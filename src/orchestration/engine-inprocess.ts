/**
 * KYCAR — Client moteur IN-PROCESS (lot D8)
 * =================================================================================================
 * Implémente l'interface `AggregationWorkerClient` (D4) SANS Web Worker, en pilotant directement le
 * noyau pur `AggregationDataset` sur le thread appelant. Deux usages :
 *   1. Tests d'intégration (vitest/node n'a pas de `Worker`) — la façade `AggregationEngine` peut être
 *      construite avec ce client et exercée de bout en bout.
 *   2. Repli optionnel de rendu si l'environnement ne fournit pas de `Worker`.
 *
 * En PRODUCTION, `src/main.tsx` utilise le vrai worker (`createAggregationEngine()`), conformément à
 * ARCHITECTURE §1.3 : le calcul lourd reste hors du thread de rendu. Grâce à la décision O17 (M1/M2 et
 * distributions fines seulement APRÈS élagage marque/modèle), le lot chargé en mode 2 est petit
 * (~10³ lignes), donc ce client synchrone reste largement sous le budget même sur le thread principal.
 */

import type { AggregationWorkerClient } from '../worker/client';
import type { FacetFilterSpec } from '../engine/facets';
import { AggregationDataset, type EngineSelection, type FacetResult, type RecalcResult } from '../engine/kernel';
import type { ListingColumnBatch, Model } from '../types/index';
import type { PongMessage } from '../worker/messages';

/** Crée un client moteur exécutant le noyau pur sur place (aucun `Worker`). */
export function createInProcessEngineClient(): AggregationWorkerClient {
  let dataset: AggregationDataset | null = null;

  const require = (): AggregationDataset => {
    if (dataset === null) throw new Error('engine-inprocess: loadDataset doit précéder tout calcul');
    return dataset;
  };

  return {
    ping(): Promise<PongMessage> {
      return Promise.resolve({ id: 0, kind: 'PONG', sentAt: Date.now(), receivedAt: Date.now() });
    },
    loadDataset(batch: ListingColumnBatch, models?: readonly Model[]): Promise<number> {
      dataset = new AggregationDataset(batch, models);
      return Promise.resolve(dataset.rowCount);
    },
    recalculate(selection: EngineSelection): Promise<RecalcResult> {
      return Promise.resolve(require().recalculate(selection));
    },
    computeFacets(selection: EngineSelection, facetFilters: readonly FacetFilterSpec[]): Promise<FacetResult> {
      return Promise.resolve(require().computeFacets(selection, facetFilters));
    },
    terminate(): void {
      dataset = null;
    },
  };
}
