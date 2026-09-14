/**
 * KYCAR - main-thread client for the aggregation worker.
 *
 * Thin wrapper so screen/state code (D5-D8) never touches `postMessage`/`onmessage` directly.
 * D1 exposed `ping()`, proving the round trip. D4 adds `loadDataset` / `recalculate` / `computeFacets`,
 * following the same request/response-by-id pattern.
 *
 * `D8-01` / `FV-01` / `E2E-01`..`10`, `13` (BLOQUANT, remédiation 2.8) — le lot colonnaire N'EST
 * PLUS TRANSFÉRÉ. `loadDataset` transférait les `ArrayBuffer` de toutes les colonnes du
 * `ListingColumnBatch` (liste de `Transferable`) : côté hôte, les vues typées restaient référencées
 * mais leurs tampons étaient DÉTACHÉS. Toute lecture y rendait `undefined` et toute construction de
 * vue levait `Cannot perform Construct on a detached ArrayBuffer` — ce qui mettait à terre l'écran D
 * entier, le nuage G4, huit graphes additionnels, l'export CSV et la part de particuliers de
 * l'écran B, sans qu'aucune sonde hors navigateur puisse le voir (elles pilotent le moteur
 * in-process, sans `postMessage`, donc sans transfert).
 *
 * Le lot part désormais par COPIE STRUCTURÉE (`postMessage` sans liste de transfert) : le worker
 * reçoit son propre exemplaire, l'hôte garde le sien intact. Coût mesuré : une copie unique par jeu
 * de données (jamais par recalcul), voir `client.structured-copy.test.ts` et
 * `reports/remediation-2.8/fix-app.md`. Le contrôleur ne dépend d'aucune identité d'objet.
 */

import {
  isDatasetLoadedMessage,
  isFacetsReadyMessage,
  isPongMessage,
  isRecalculatedMessage,
  isWorkerErrorMessage,
  type FacetsMessage,
  type LoadDatasetMessage,
  type PongMessage,
  type RecalculateMessage,
  type WorkerRequest,
  type WorkerResponse,
} from './messages';
import type { ListingColumnBatch, Model } from '../types/index';
import type { EngineSelection, FacetResult, RecalcResult } from '../engine/kernel';
import type { FacetFilterSpec } from '../engine/facets';

let nextRequestId = 1;

interface PendingRequest {
  readonly resolve: (value: WorkerResponse) => void;
  readonly reject: (reason: Error) => void;
}

/** Client typé au-dessus du worker d'agrégation. */
export interface AggregationWorkerClient {
  ping(): Promise<PongMessage>;
  loadDataset(batch: ListingColumnBatch, models?: readonly Model[]): Promise<number>;
  recalculate(selection: EngineSelection): Promise<RecalcResult>;
  computeFacets(selection: EngineSelection, facetFilters: readonly FacetFilterSpec[]): Promise<FacetResult>;
  terminate(): void;
}

/**
 * Crée le worker d'agrégation et retourne un petit client requête/réponse. `import.meta.url` permet à
 * Vite de découvrir et d'empaqueter le worker comme son propre chunk (support natif, sans plugin).
 */
export function createAggregationWorkerClient(): AggregationWorkerClient {
  const worker = new Worker(new URL('./aggregation.worker.ts', import.meta.url), { type: 'module' });
  const pending = new Map<number, PendingRequest>();

  worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const request = pending.get(response.id);
    if (!request) return;
    pending.delete(response.id);
    if (isWorkerErrorMessage(response)) {
      request.reject(new Error(response.message));
      return;
    }
    request.resolve(response);
  });

  function send(request: WorkerRequest): Promise<WorkerResponse> {
    return new Promise<WorkerResponse>((resolve, reject) => {
      pending.set(request.id, { resolve, reject });
      // `D8-01` : AUCUNE liste de transfert — `postMessage` clone structurellement le message.
      worker.postMessage(request);
    });
  }

  return {
    ping(): Promise<PongMessage> {
      const id = nextRequestId++;
      return send({ id, kind: 'PING', sentAt: Date.now() }).then((r) => {
        if (isPongMessage(r)) return r;
        throw new Error(`réponse inattendue pour PING : ${r.kind}`);
      });
    },
    loadDataset(batch: ListingColumnBatch, models?: readonly Model[]): Promise<number> {
      const id = nextRequestId++;
      const request: LoadDatasetMessage = { id, kind: 'LOAD_DATASET', batch, models };
      return send(request).then((r) => {
        if (isDatasetLoadedMessage(r)) return r.rowCount;
        throw new Error(`réponse inattendue pour LOAD_DATASET : ${r.kind}`);
      });
    },
    recalculate(selection: EngineSelection): Promise<RecalcResult> {
      const id = nextRequestId++;
      const request: RecalculateMessage = { id, kind: 'RECALCULATE', selection };
      return send(request).then((r) => {
        if (isRecalculatedMessage(r)) return r.result;
        throw new Error(`réponse inattendue pour RECALCULATE : ${r.kind}`);
      });
    },
    computeFacets(selection: EngineSelection, facetFilters: readonly FacetFilterSpec[]): Promise<FacetResult> {
      const id = nextRequestId++;
      const request: FacetsMessage = { id, kind: 'FACETS', selection, facetFilters };
      return send(request).then((r) => {
        if (isFacetsReadyMessage(r)) return r.result;
        throw new Error(`réponse inattendue pour FACETS : ${r.kind}`);
      });
    },
    terminate(): void {
      // EX-NAV-23 / EX-NFR-23 : vider `pending` sans rien régler laissait tout appelant en vol
      // (`enterMode2`, `dispose`) suspendu à jamais. Chaque promesse est REJETÉE avant l'arrêt.
      const abandoned = [...pending.values()];
      pending.clear();
      for (const request of abandoned) {
        request.reject(new Error('aggregation worker: terminé, requête abandonnée'));
      }
      worker.terminate();
    },
  };
}
