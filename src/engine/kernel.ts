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
import {
  detectOutliers,
  M3_EMPTY,
  type M3Control,
  type OutlierEvaluationCounters,
} from './outliers';
import { computeGroupStats } from './group-stats';
import { sampleScatter } from './scatter';
import { selectionImplausibleThreshold } from './implausible';
import { buildIndexes, type DatasetIndexes } from './index-build';
import { compilePredicates, type RefinePredicate, type TaxonomyScope } from './predicates';
import { PRICE_STATUS_MISSING, PRICE_STATUS_ON_REQUEST, PRICE_STATUS_QUOTED } from './flags';
import { computeFacets, type FacetCount, type FacetFilterSpec } from './facets';
import { scanSelection } from './scan';
import type {
  CellStat,
  DepreciationIndexResult,
  GroupStatSet,
  NtileResult,
  PowerTierResult,
  ScatterSampleSummary,
} from './stats-protocol';

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

/**
 * Motif typé d'omission des statistiques D8-07 (`GROUPSTAT`, `NTILE`, paliers, indice de
 * dépréciation, statistiques de cellule, échantillon du nuage).
 */
export type StatsSkippedReason = 'UNPRUNED_SELECTION';

/**
 * Plafond de lignes au-delà duquel les statistiques D8-07 ne sont PAS calculées sur une sélection
 * non élaguée — le MÊME que celui de la détection d'outliers, et pour la même raison.
 *
 * Ces statistiques servent l'écran B, qui est un écran de mode 2 TOUJOURS ÉLAGUÉ (décision O17,
 * `m ≈ 10³`) : sur ce chemin elles coûtent une fraction de milliseconde. Sur une sélection NON
 * élaguée à `N = 10⁵`, elles coûtent (mesure du banc `recalc.perf.test.ts`, §4 du rapport) un ordre
 * de grandeur de plus que tout le reste du recalcul — neuf regroupements plus un tri de 10⁵
 * `listingId` octet à octet —, sur un recalcul qui dépasse déjà les 200 ms d'`EX-NFR-5` sans elles
 * (567 ms, O17). Les calculer là serait dépenser le budget pour un écran qui ne les lit pas. Au-delà
 * du plafond, les six champs sont absents et `statsSkipped` DIT pourquoi.
 */
export const STATS_UNPRUNED_MAX_ROWS = OUTLIER_UNPRUNED_MAX_ROWS;

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
  /**
   * Seuil relatif de la cellule `C₃ = Σ` (`0,10 × médianeRéf`), ou `null` sous 12 prix valides.
   * Publié pour que l'écran nomme la règle qui a écarté des annonces (EX-DATA-87).
   */
  readonly implausibleThreshold: number | null;
  /** Annonces écartées de `V_price(Σ)` par ce seuil (D-44, EX-DATA-19(2)). */
  readonly implausibleInCellExcluded: number;

  /* ---- D8-07 : statistiques calculées DANS le worker (dette D-17 levée) ----------------------
   * Les six champs ci-dessous sont OPTIONNELS à l'étape 0 de la remédiation 2.8 : la FORME est
   * figée pour que fix-engine (calcul) et fix-screens (consommation) avancent en parallèle, mais
   * le moteur ne les remplit pas encore et rien ne casse tant qu'il ne le fait pas. Ils sont la
   * SOURCE UNIQUE de ces chiffres : quand ils sont remplis, D7 supprime son recalcul du thread
   * principal (`group-stat.ts`, `scatter-sample.ts`). Types : `./stats-protocol`. */

  /** `GROUPSTAT(Σ, g, m)` par clé admise (EX-DATA-83bis) — G5/G6/G9/G12/G13/G14/G15. */
  readonly groupStats?: readonly GroupStatSet[];
  /** `NTILE(V_mileage(Σ), 5)` — tranches de rang de G10 (EX-DATA-83ter). */
  readonly ntiles?: NtileResult;
  /** Paliers de puissance de 20 kW (EX-DATA-83quater). */
  readonly powerTiers?: PowerTierResult;
  /** Indice de dépréciation base `y_max` publiée (EX-DATA-83quinquies). */
  readonly depreciationIndex?: DepreciationIndexResult;
  /** Statistiques par cellule d'homogénéité, dont `R²` et son avertissement (EX-DATA-86/87/93bis). */
  readonly cellStats?: readonly CellStat[];
  /** Échantillon déterministe du nuage G4 et ses compteurs (EX-DATA-99..103). */
  readonly sample?: ScatterSampleSummary;

  /**
   * D8-07 — motif d'omission des six champs ci-dessus, ou `null` s'ils sont tous renseignés.
   * Une absence SILENCIEUSE se lirait comme « aucun groupe », c'est-à-dire comme un résultat
   * légitime vide (ce qu'`EX-NFR-23` proscrit) : le motif est donc publié à côté.
   */
  readonly statsSkipped?: StatsSkippedReason | null;

  /**
   * D8-09 — ventilation de l'évaluabilité des annonces à prix affiché : `evaluated`, les deux
   * compteurs `INSUFFICIENT_*`, et les deux motifs qui ne donnent lieu à AUCUN verdict.
   * `EX-DATA-95` interdit de confondre « aucune anomalie détectée » et « non évaluable ».
   */
  readonly outlierEvaluation?: OutlierEvaluationCounters;
}

/** Résultat du calcul de facettes (différé). */
export interface FacetResult {
  readonly snapshotId: string;
  readonly selectionHash: string;
  readonly facets: readonly FacetCount[];
}

/**
 * Contrôle d'entrée au chargement du jeu de données (`LOAD_DATASET`) : `priceStatus` doit appartenir
 * au vocabulaire gelé `KYCAR_PRICE_STATUS` (EX-DATA-8). Un octet hors vocabulaire est une donnée
 * corrompue en amont : le moteur le REFUSE au chargement (`WORKER_ERROR` nommé) au lieu de le
 * laisser fausser la partition I5 en silence (DR-116).
 */
function assertPriceStatusVocabulary(batch: ListingColumnBatch): void {
  for (let row = 0; row < batch.rowCount; row++) {
    const status = batch.priceStatus[row] as number;
    if (status !== PRICE_STATUS_QUOTED && status !== PRICE_STATUS_ON_REQUEST && status !== PRICE_STATUS_MISSING) {
      throw new Error(
        `kernel: priceStatus hors vocabulaire KYCAR_PRICE_STATUS à la ligne ${row} (octet ${status})`,
      );
    }
  }
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
    assertPriceStatusVocabulary(batch);
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

    // D-44 — EX-DATA-19(2) / EX-DATA-60 en DEUX passes sur la cellule `C₃ = Σ` :
    //   passe 1 : médiane de référence de `V_price(Σ)` déjà purgé des sentinelles ABSOLUES,
    //             d'où le seuil relatif (`null` sous 12 prix valides) ;
    //   passe 2 : statistiques, agrégats, histogrammes et densité sur ce qui reste.
    // Aucune itération, aucun point fixe (ARB-13, R-A06) : le seuil est calculé UNE fois et sert
    // tous les étages de la même sélection, ce qu'I3 et I4 exigent.
    const implausibleThreshold = selectionImplausibleThreshold(batch, scan.rows);
    const agg = aggregate(batch, scan.rows, snapshotId, selectionHash, implausibleThreshold);

    // Garde de budget (EX-NFR-5, O17) : M1/M2 ne tournent que sur une sélection élaguée par la
    // taxonomie, ou assez petite pour tenir les 200 ms. Sinon la détection est OMISE avec son motif.
    const outliersSkipped: OutliersSkippedReason | null =
      scan.pruned || scan.rows.length <= OUTLIER_UNPRUNED_MAX_ROWS ? null : 'UNPRUNED_SELECTION';
    const outliers =
      outliersSkipped === null ? detectOutliers(batch, scan.rows, snapshotId, selectionHash) : null;
    // Éligibilité du nuage et de la densité (D-05) : même règle de prix valide que M1/M2, donc le
    // MÊME seuil relatif de `C₃ = Σ` que la passe 1 ci-dessus — la détection le recalcule pour son
    // propre compte et les deux valeurs coïncident (contrôlé par `invariants.integration.test.ts`).
    const density = densityGrid(batch, scan.rows, snapshotId, selectionHash, implausibleThreshold);
    this.lastYearMarginal = density.yearBucketCountByIndex;

    // ---- D8-07 : statistiques par groupe, de cellule et échantillon du nuage (dette D-17 levée) --
    // Même garde de budget que M1/M2 (EX-NFR-5, O17) : l'écran B qui les lit est TOUJOURS élagué.
    const statsSkipped: StatsSkippedReason | null =
      scan.pruned || scan.rows.length <= STATS_UNPRUNED_MAX_ROWS ? null : 'UNPRUNED_SELECTION';
    const stats =
      statsSkipped === null
        ? {
            ...computeGroupStats(batch, scan.rows, implausibleThreshold),
            cellStats: outliers === null ? [] : outliers.cellStats,
            // `Elig` d'EX-DATA-99 est celui de la grille de densité : un seul ensemble éligible pour
            // la nuée, la densité et leurs compteurs (D-05).
            sample: sampleScatter({
              eligible: density.eligibleRows,
              listingId: batch.listingId,
              isOutlier: (row) => outliers !== null && outliers.flaggedRows.has(row),
              scoreOf: (row) => (outliers === null ? null : (outliers.scoreByRow.get(row) ?? null)),
            }),
            statsSkipped: null,
          }
        : { statsSkipped };

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
      implausibleThreshold,
      implausibleInCellExcluded: agg.implausibleInCellExcluded,
      ...stats,
      outlierEvaluation: outliers === null ? undefined : outliers.evaluation,
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
