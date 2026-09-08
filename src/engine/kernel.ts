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
import { densityGrid, type IneligibleBreakdown } from './density';
import { detectOutliers, M3_EMPTY, type M3Control } from './outliers';
import { selectionImplausibleThreshold } from './implausible';
import { buildIndexes, type DatasetIndexes } from './index-build';
import { compilePredicates, type RefinePredicate, type TaxonomyScope } from './predicates';
import { computeFacets, type FacetCount, type FacetFilterSpec } from './facets';
import { scanSelection } from './scan';

/**
 * Motif typé d'omission de la détection d'outliers (EX-NFR-5, EX-NFR-4bis, O17).
 * `UNPRUNED_SELECTION` : la sélection n'est pas élaguée par la taxonomie ET dépasse le plafond de
 * lignes sous lequel M1/M2 tiennent le budget synchrone.
 */
export type OutliersSkippedReason = 'UNPRUNED_SELECTION';

/**
 * Plafond de lignes au-delà duquel M1/M2 ne s'exécutent PAS sur une sélection non élaguée.
 *
 * `EX-NFR-5` borne le recalcul synchrone à 200 ms. Le banc O17 (`tests/review/D4/full-100k.test.ts`)
 * mesure le franchissement des 200 ms d'un recalcul NON élagué au premier effectif retenu de
 * **44 186 lignes** (100 000 lignes : 567 ms ; 25 069 lignes : 161 ms). Le plafond est posé à
 * 25 000 lignes : le dernier point mesuré sous budget, avec ≈ 20 % de marge. Au-delà, et sans scope
 * marque/modèle, la détection est omise et le motif est publié — le moteur ne rend jamais des
 * verdicts M2 calculés sur une régression à `C₃ = 10⁵` lignes hors élagage (R-D4-12).
 */
export const OUTLIER_UNPRUNED_MAX_ROWS = 25_000;

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
  /**
   * Motifs de non-éligibilité ventilés (EX-DATA-99) : `eligibleCount` plus les quatre compteurs
   * valent exactement `selectionCount`. Publiés par le moteur pour que l'écran B ne les recalcule
   * pas sur le thread principal.
   */
  readonly ineligible: IneligibleBreakdown;
  readonly outlierVerdicts: readonly OutlierVerdict[];
  /**
   * Motif d'omission de M1/M2, ou `null` si la détection a bien tourné. Quand il est renseigné,
   * `outlierVerdicts` est vide, `outlierEvaluatedCount` vaut 0 et `outlierNotEvaluatedCount` vaut
   * `priceQuotedCount` — l'invariant I6 tient (EX-DATA-104).
   */
  readonly outliersSkipped: OutliersSkippedReason | null;
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

    // Garde de budget (EX-NFR-5, O17) : M1/M2 ne tournent que sur une sélection élaguée par la
    // taxonomie, ou assez petite pour tenir les 200 ms. Sinon la détection est OMISE avec son motif.
    const outliersSkipped: OutliersSkippedReason | null =
      scan.pruned || scan.rows.length <= OUTLIER_UNPRUNED_MAX_ROWS ? null : 'UNPRUNED_SELECTION';
    const outliers =
      outliersSkipped === null ? detectOutliers(batch, scan.rows, snapshotId, selectionHash) : null;
    // Éligibilité du nuage et de la densité (D-05) : même règle de prix valide que M1/M2, donc le
    // seuil relatif de `C₃ = Σ` est celui que la détection a calculé — recalculé seulement si elle
    // a été omise.
    const implausibleThreshold =
      outliers === null ? selectionImplausibleThreshold(batch, scan.rows) : outliers.selectionImplausibleThreshold;
    const density = densityGrid(batch, scan.rows, snapshotId, selectionHash, implausibleThreshold);
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
      outlierEvaluatedCount: outliers === null ? 0 : outliers.outlierEvaluatedCount,
      outlierNotEvaluatedCount:
        outliers === null ? agg.priceQuotedCount : outliers.outlierNotEvaluatedCount,
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
      ineligible: density.ineligible,
      outlierVerdicts: outliers === null ? [] : outliers.verdicts,
      outliersSkipped,
      m3: outliers === null ? M3_EMPTY : outliers.m3,
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
