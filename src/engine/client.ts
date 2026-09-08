/**
 * KYCAR — Colle moteur côté thread principal (lot D4)
 * =================================================================================================
 * `AggregationEngine` est la façade que D6/D7 utilisent : elle pilote le worker (via
 * `AggregationWorkerClient`) et intercale le CACHE LRU 32 (EX-DATA-109) clé
 * `(localDatasetKey, refineHash)` — c'est-à-dire le `selectionHash` publié. Un retour arrière ou un
 * changement d'onglet sur une sélection déjà calculée est alors `O(1)`, sans aller-retour worker ni
 * recalcul (EX-SRCH-9quinquies).
 *
 * Ce module s'exécute sur le THREAD PRINCIPAL (il crée un `Worker`) : il n'est jamais importé par le
 * worker.
 */

import { createAggregationWorkerClient, type AggregationWorkerClient } from '../worker/client';
import type { ListingColumnBatch, Model } from '../types/index';
import type { EngineSelection, FacetResult, RecalcResult } from './kernel';
import type { FacetFilterSpec } from './facets';
import { LruCache, LRU_CAPACITY } from './lru';

/** Façade moteur : worker + cache LRU de sélection. */
export class AggregationEngine {
  private readonly cache = new LruCache<RecalcResult>(LRU_CAPACITY);
  /**
   * Recalculs EN VOL, par `selectionHash` (EX-DATA-109, ADV-12/ARB-57). Le cache LRU ne coalesce
   * que ce qui est déjà REVENU : trois demandes du même hachage avant la première réponse
   * déclenchaient trois calculs worker. La promesse est mémorisée le temps de l'aller-retour, puis
   * retirée — un échec ne se mémorise pas (DR-117).
   */
  private readonly inFlight = new Map<string, Promise<RecalcResult>>();

  constructor(private readonly client: AggregationWorkerClient = createAggregationWorkerClient()) {}

  /** Charge (ou remplace) le jeu de données actif. Vide le cache (nouveau snapshot, EX-NAV-23). */
  async loadDataset(batch: ListingColumnBatch, models?: readonly Model[]): Promise<number> {
    this.cache.clear();
    this.inFlight.clear();
    return this.client.loadDataset(batch, models);
  }

  /**
   * Recalcule les chiffres principaux d'une sélection, en servant depuis le cache LRU si la sélection
   * (clé `selectionHash`) a déjà été calculée.
   */
  async recalculate(selection: EngineSelection): Promise<RecalcResult> {
    const key = selection.selectionHash;
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;
    const flying = this.inFlight.get(key);
    if (flying !== undefined) return flying;
    const promise = this.client
      .recalculate(selection)
      .then((result) => {
        this.cache.set(key, result);
        return result;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });
    this.inFlight.set(key, promise);
    return promise;
  }

  /** Calcule les facettes (chemin différé, non mémorisé — dépend du même balayage que le recalcul). */
  computeFacets(selection: EngineSelection, facetFilters: readonly FacetFilterSpec[]): Promise<FacetResult> {
    return this.client.computeFacets(selection, facetFilters);
  }

  /** Vrai si la sélection est déjà en cache (diagnostic). */
  isCached(selectionHash: string): boolean {
    return this.cache.has(selectionHash);
  }

  /** Nombre de sélections mémorisées. */
  get cacheSize(): number {
    return this.cache.size;
  }

  /** Nombre de recalculs en vol (diagnostic). */
  get inFlightSize(): number {
    return this.inFlight.size;
  }

  /** Libère le worker. */
  terminate(): void {
    this.inFlight.clear();
    this.client.terminate();
  }
}

/** Fabrique la façade moteur au-dessus d'un worker neuf. */
export function createAggregationEngine(): AggregationEngine {
  return new AggregationEngine();
}
