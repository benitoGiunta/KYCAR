/**
 * KYCAR — Barrel public du moteur d'agrégation (lot D4)
 * =================================================================================================
 * Surface publique consommée par D6/D7 (écrans) et par le câblage d'intégration du coordinateur.
 * D4 crée SON propre barrel : il ne modifie aucun barrel partagé (`src/types/index.ts`,
 * `src/providers/index.ts`).
 *
 * Deux niveaux d'accès :
 *   - Façade thread principal : `AggregationEngine` / `createAggregationEngine` (worker + cache LRU).
 *   - Noyau pur (worker/tests/bancs) : `AggregationDataset` et les fonctions de calcul.
 */

// Façade thread principal (pilote le worker + cache LRU 32).
export { AggregationEngine, createAggregationEngine } from './client';
export { createAggregationWorkerClient, type AggregationWorkerClient } from '../worker/client';

// Noyau exécuté dans le worker (calcul pur — utilisable aussi hors worker pour les tests/bancs).
export { AggregationDataset, OUTLIER_UNPRUNED_MAX_ROWS, STATS_UNPRUNED_MAX_ROWS } from './kernel';
export type { EngineSelection, RecalcResult, FacetResult, OutliersSkippedReason, StatsSkippedReason } from './kernel';

// Statistiques publiées par le protocole worker (D8-07, dette D-17 levée) — types seulement.
export type {
  GroupStatKey,
  GroupStatEntry,
  GroupStatSet,
  NtileSlice,
  NtileResult,
  PowerTierEntry,
  PowerTierResult,
  DepreciationEntry,
  DepreciationIndexResult,
  CellLevel,
  CellStat,
  ScatterSampleSummary,
} from './stats-protocol';

// Contrat de sélection : taxonomie (T, élagage) et raffinement (R, en mémoire).
export type {
  RefinePredicate,
  TaxonomyScope,
  EnumColumnName,
  NumericColumnName,
  CompiledPredicate,
} from './predicates';
export { compilePredicate, compilePredicates } from './predicates';

// Facettes (EX-DATA-110bis).
export type { FacetCount, FacetFilterSpec } from './facets';
export { computeFacets } from './facets';

// Détection d'outliers (M1/M2/M3) et évaluabilité (D8-09).
export { detectOutliers, R_SQUARED_WARNING_THRESHOLD } from './outliers';
export type { OutlierResult, M3Control, OutlierEvaluationCounters } from './outliers';

// Agrégats par groupe D8-07 : GROUPSTAT, NTILE, paliers de puissance, indice de dépréciation.
export {
  computeGroupStats,
  computeDepreciationIndex,
  compareGroupLabels,
  powerTierLabel,
  roundHalfAway,
  GROUP_STAT_KEYS,
  MILEAGE_NTILE_K,
  POWER_TIER_WIDTH_KW,
  DEPRECIATION_MIN_N,
} from './group-stats';
export type { GroupStatsOutput } from './group-stats';

// Échantillon déterministe du nuage G4 (EX-DATA-99..103), calculé dans le worker (D8-07).
export { sampleScatter, SCATTER_MAX_POINTS } from './scatter';
export type { ScatterSampleInput } from './scatter';

// Index et élagage (EX-DATA-115/116).
export { buildIndexes, modelIndexKey, BITSET_COLUMNS } from './index-build';
export type { DatasetIndexes, IndexRange } from './index-build';

// Balayage de sélection.
export { scanSelection, candidateRows } from './scan';
export type { ScanResult } from './scan';

// Agrégats et statistiques.
export { aggregate, metricRangeFromValues } from './aggregate';
export type { AggregateOutput } from './aggregate';

// Grille de densité (I7).
export { densityGrid } from './density';
export type { DensityResult } from './density';

// BIN et histogrammes (EX-DATA-75/77).
export {
  bin,
  binCore,
  binEdges,
  binIndexOf,
  toDistributionBuckets,
  PRICE_BIN_PARAMS,
  MILEAGE_BIN_PARAMS,
  YEAR_BIN_PARAMS,
} from './bin';
export type { BinParams, BinResult, RawBin } from './bin';

// Quantiles exacts et statistiques (EX-DATA-62/111).
export {
  quantileType7,
  quantileFromSorted,
  exactMetricStats,
  metricStatsFromCounts,
  orderStatsFromCounts,
  WelfordAccumulator,
} from './quantiles';

// Validité métrique (EX-DATA-60) et décodage d'année.
export {
  isPriceValid,
  isYearValid,
  isMileageValid,
  yearFromYearMonth,
  PRICE_STATUS_QUOTED,
  PRICE_STATUS_ON_REQUEST,
  PRICE_STATUS_MISSING,
} from './flags';

// UUID de listingId (forage, départage de tri).
export { decodeListingId, compareListingId } from './uuid';

// Cache LRU de sélection.
export { LruCache, LRU_CAPACITY, cacheKey } from './lru';

// Générateur synthétique de test (autonomie vis-à-vis de D3).
export { generateSyntheticDataset } from './synthetic';
export type { SyntheticDataset, SyntheticOptions } from './synthetic';
