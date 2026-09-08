/**
 * KYCAR - aggregation Web Worker (lot D4 : le moteur y est exécuté).
 *
 * `docs/plans/ARCHITECTURE.md` S:1.1/1.3 exige que le balayage colonnaire, le binning, les quantiles
 * et la détection d'outliers tournent HORS du thread principal, pour qu'un recalcul ≤ 200 ms
 * (EX-NFR-5) ne vole jamais d'image à une interaction de graphe (≥ 30 fps, EX-NFR-8). Lot D4 ajoute
 * ici les cas du switch qui délèguent au noyau `AggregationDataset` (`src/engine/kernel.ts`) : il ne
 * crée ni un second worker ni un second canal — l'enveloppe requête/réponse est celle de
 * `./messages.ts`, étendue par D4.
 *
 * D1 prouvait le canal (PING → PONG) ; ce comportement est conservé.
 */

import type { WorkerRequest, WorkerResponse } from './messages';
import { AggregationDataset } from '../engine/kernel';

/** Un seul snapshot actif (EX-NAV-23). Remplacé à chaque `LOAD_DATASET`. */
let dataset: AggregationDataset | null = null;

function requireDataset(): AggregationDataset {
  if (dataset === null) {
    throw new Error('aggregation worker: aucun jeu de données chargé (LOAD_DATASET requis)');
  }
  return dataset;
}

function handleRequest(request: WorkerRequest): WorkerResponse {
  switch (request.kind) {
    case 'PING':
      return { id: request.id, kind: 'PONG', sentAt: request.sentAt, receivedAt: Date.now() };
    case 'LOAD_DATASET': {
      dataset = new AggregationDataset(request.batch, request.models);
      return { id: request.id, kind: 'DATASET_LOADED', rowCount: dataset.rowCount };
    }
    case 'RECALCULATE':
      return { id: request.id, kind: 'RECALCULATED', result: requireDataset().recalculate(request.selection) };
    case 'FACETS':
      return {
        id: request.id,
        kind: 'FACETS_READY',
        result: requireDataset().computeFacets(request.selection, request.facetFilters),
      };
    default: {
      // EX-NFR-23 : sans ce cas, un `kind` inconnu (protocole désynchronisé, message d'un autre
      // émetteur) faisait retourner `undefined`, donc `postMessage(undefined)`, et le client lisait
      // `undefined.id` — exception non gérée sur le thread principal. On lève : le `catch` du
      // récepteur rend un `WORKER_ERROR` nommé, porteur de l'`id` de la requête (DR-118).
      const unknown = request as { readonly kind?: unknown };
      throw new Error(`aggregation worker: type de requête inconnu « ${String(unknown.kind)} »`);
    }
  }
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  try {
    const response = handleRequest(event.data);
    self.postMessage(response);
  } catch (error) {
    const errorResponse: WorkerResponse = {
      // `event.data` peut être n'importe quoi : l'`id` est lu en accès optionnel (EX-NFR-23).
      id: (event.data as { id?: number } | undefined)?.id ?? 0,
      kind: 'WORKER_ERROR',
      message: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(errorResponse);
  }
});
