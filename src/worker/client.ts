/**
 * KYCAR - main-thread client for the aggregation worker.
 *
 * Thin wrapper so screen/state code (D5-D8) never touches `postMessage`/`onmessage` directly.
 * D1 exposed `ping()`, proving the round trip. D4 adds `loadDataset` / `recalculate` / `computeFacets`,
 * following the same request/response-by-id pattern. Le thread principal NE conserve PAS les colonnes
 * du batch : leurs buffers sont transmis en `Transferable` au worker lors de `loadDataset`.
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

/** Collecte les `ArrayBuffer` transférables d'un batch colonnaire (toutes ses colonnes typées). */
function batchTransferables(batch: ListingColumnBatch): ArrayBuffer[] {
  const arrays: ArrayBufferView[] = [
    batch.listingId,
    batch.priceEur,
    batch.mileageKm,
    batch.firstRegistrationYearMonth,
    batch.modelId,
    batch.makeId,
    batch.modelYear,
    batch.powerKw,
    batch.co2EmissionsGPerKmX10,
    batch.consumptionCombinedL100KmX10,
    batch.electricRangeKm,
    batch.fuelCategory,
    batch.bodyType,
    batch.transmission,
    batch.drivetrain,
    batch.offerType,
    batch.usageState,
    batch.sellerType,
    batch.regionCode,
    batch.countryCode,
    batch.priceStatus,
    batch.priceEvaluationCategory,
    batch.adTier,
    batch.bodyColor,
    batch.upholsteryType,
    batch.euEmissionStandard,
    batch.doorCount,
    batch.seatCount,
    batch.previousOwnerCount,
    batch.imageCount,
    batch.vatDeductible,
    batch.booleanFlags,
    batch.ingestFlags,
    batch.stringBlob,
    batch.stringOffsets,
  ];
  // Déduplique les buffers (plusieurs vues peuvent partager un buffer) avant transfert.
  const seen = new Set<ArrayBuffer>();
  const out: ArrayBuffer[] = [];
  for (const view of arrays) {
    const buffer = view.buffer as ArrayBuffer;
    if (!seen.has(buffer)) {
      seen.add(buffer);
      out.push(buffer);
    }
  }
  return out;
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

  function send(request: WorkerRequest, transfer?: Transferable[]): Promise<WorkerResponse> {
    return new Promise<WorkerResponse>((resolve, reject) => {
      pending.set(request.id, { resolve, reject });
      if (transfer && transfer.length > 0) worker.postMessage(request, transfer);
      else worker.postMessage(request);
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
      return send(request, batchTransferables(batch)).then((r) => {
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
