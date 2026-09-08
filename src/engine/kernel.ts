/**
 * KYCAR — Noyau d'agrégation exécuté DANS le worker (lot D4)
 * =================================================================================================
 * `AggregationDataset` détient le jeu de données colonnaire et ses index (construits une fois à
 * l'ingestion) et orchestre les deux chemins de calcul de la stratégie §3.2 :
 *   - `recalculate(selection)` → les CHIFFRES PRINCIPAUX (agrégats, statistiques, quantiles exacts,
 *     histogrammes, densité, outliers), sous le budget synchrone ≤ 200 ms (EX-NFR-5) ;
 *   - `computeFacets(selection)` → les FACETTES en un seul balayage, DIFFÉRÉES ≤ 100 ms (EX-DATA-110bis).
 *
 * Aucune globale DOM ni WebWorker : ce noyau est du calcul pur, appelé par le switch de messages du
 * worker (`src/worker/aggregation.worker.ts`).
 */

import type {
  DensityCell,
  DistributionBucket,
  ListingColumnBatch,
  MakeAggregate,
  Model,
  ModelAggregate,
  SelectionStats,
  OutlierVerdict,
} from '../types/index';
import { aggregate } from './aggregate';
import { densityGrid } from './density';
import { detectOutliers, type M3Control } from './outliers';
import { buildIndexes, type DatasetIndexes } from './index-build';
import { compilePredicates, type RefinePredicate, type TaxonomyScope } from './predicates';
import { computeFacets, type FacetCount, type FacetFilterSpec } from './facets';
import { scanSelection } from './scan';

/** Sélection telle que la voit le moteur : hachage publié + scope de taxonomie (T) + prédicats (R). */
export interface EngineSelection {
  /** `<localDatasetKey>:<refineHash>` (EX-SRCH-9quinquies) — clé d'entité et de cache. */
  readonly selectionHash: string;
  /** Contraintes de taxonomie (classe T), pilotent l'élagage. */
  readonly scope?: TaxonomyScope;
  /** Filtres de raffinement (classe R), appliqués en mémoire. */
  readonly refine?: readonly RefinePredicate[];
}

/** Résultat du recalcul des chiffres principaux d'une sélection. */
export interface RecalcResult {
  readonly snapshotId: string;
  readonly selectionHash: string;
  readonly selectionStats: SelectionStats;
  readonly makeAggregates: readonly MakeAggregate[];
  readonly modelAggregates: readonly ModelAggregate[];
  readonly priceHistogram: readonly DistributionBucket[];
  readonly yearHistogram: readonly DistributionBucket[];
  readonly mileageHistogram: readonly DistributionBucket[];
  readonly densityCells: readonly DensityCell[];
  readonly eligibleCount: number;
  readonly outlierVerdicts: readonly OutlierVerdict[];
  readonly m3: M3Control;
  /** Lignes réellement examinées (témoin d'élagage : `N / scannedCount`). */
  readonly scannedCount: number;
  readonly pruned: boolean;
}

/** Résultat du calcul de facettes (différé). */
export interface FacetResult {
  readonly snapshotId: string;
  readonly selectionHash: string;
  readonly facets: readonly FacetCount[];
}

/**
 * Jeu de données actif dans le worker : batch colonnaire + index. Un seul snapshot actif
 * (EX-NAV-23). L'invariant I7 a besoin du marginal d'année : il est exposé via `lastDensity`.
 */
export class AggregationDataset {
  readonly indexes: DatasetIndexes;
  /** Dernier marginal d'année par bin, exposé pour la vérification de l'invariant I7. */
  private lastYearMarginal: ReadonlyMap<number, number> = new Map();

  constructor(
    readonly batch: ListingColumnBatch,
    models?: readonly Model[],
  ) {
    this.indexes = buildIndexes(batch, models);
  }

  /** Effectif total du snapshot. */
  get rowCount(): number {
    return this.batch.rowCount;
  }

  /** Marginal d'année du dernier `recalculate` (invariant I7). */
  get yearBucketCountByIndex(): ReadonlyMap<number, number> {
    return this.lastYearMarginal;
  }

  /** Recalcule les chiffres principaux d'une sélection (chemin synchrone ≤ 200 ms). */
  recalculate(selection: EngineSelection): RecalcResult {
    const { batch } = this;
    const snapshotId = batch.snapshotId;
    const selectionHash = selection.selectionHash;

    const predicates = compilePredicates(batch, selection.refine ?? []);
    const scan = scanSelection(this.indexes, predicates, selection.scope);

    const agg = aggregate(batch, scan.rows, snapshotId, selectionHash);
    const outliers = detectOutliers(batch, scan.rows, snapshotId, selectionHash);
    const density = densityGrid(batch, scan.rows, snapshotId, selectionHash);
    this.lastYearMarginal = density.yearBucketCountByIndex;

    const selectionStats: SelectionStats = {
      snapshotId,
      selectionHash,
      selectionCount: agg.selectionCount,
      price: agg.priceStats,
      year: agg.yearStats,
      mileage: agg.mileageStats,
      priceQuotedCount: agg.priceQuotedCount,
      priceOnRequestCount: agg.priceOnRequestCount,
      priceMissingCount: agg.priceMissingCount,
      outlierEvaluatedCount: outliers.outlierEvaluatedCount,
      outlierNotEvaluatedCount: outliers.outlierNotEvaluatedCount,
    };

    return {
      snapshotId,
      selectionHash,
      selectionStats,
      makeAggregates: agg.makeAggregates,
      modelAggregates: agg.modelAggregates,
      priceHistogram: agg.priceHistogram,
      yearHistogram: agg.yearHistogram,
      mileageHistogram: agg.mileageHistogram,
      densityCells: density.cells,
      eligibleCount: density.eligibleCount,
      outlierVerdicts: outliers.verdicts,
      m3: outliers.m3,
      scannedCount: scan.scannedCount,
      pruned: scan.pruned,
    };
  }

  /** Calcule les facettes d'une sélection (chemin différé, un seul balayage). */
  computeFacets(selection: EngineSelection, facetFilters: readonly FacetFilterSpec[]): FacetResult {
    const { batch } = this;
    const predicates = compilePredicates(batch, selection.refine ?? []);
    const facets = computeFacets(
      batch,
      this.indexes,
      selection.scope,
      predicates,
      facetFilters,
      batch.snapshotId,
      selection.selectionHash,
    );
    return { snapshotId: batch.snapshotId, selectionHash: selection.selectionHash, facets };
  }
}
