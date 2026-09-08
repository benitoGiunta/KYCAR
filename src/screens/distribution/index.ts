/**
 * KYCAR — Barrel de l'écran B (lot D7). Surface montable par D8 (routage global).
 * =================================================================================================
 * D7 crée SON propre barrel : il ne modifie aucun barrel partagé. Le composant racine est
 * `DistributionScreen` ; les modules purs sont réexportés pour les tests et la réutilisation (écran D
 * réutilise `format`, `OutlierIndex`).
 */

export { DistributionScreen } from './DistributionScreen';
export type { DistributionScreenProps, DistributionLabels } from './DistributionScreen';

export { Histogram } from './Histogram';
export type { HistogramProps } from './Histogram';
export { ScatterCloud } from './ScatterCloud';
export type { ScatterCloudProps, ScatterSampleInfo } from './ScatterCloud';
export { GraphFrame } from './GraphFrame';

// Modèles purs.
export { sampleScatter, SCATTER_MAX_POINTS } from './scatter-sample';
export type { ScatterSampleInput, ScatterSampleResult } from './scatter-sample';
export {
  computeEligibility,
  buildScatterPoints,
  makeProjector,
  makeInverseProjector,
  q01q99,
} from './scatter-model';
export type { ScatterPoint, EligibilityBreakdown, Viewport, AxisBounds } from './scatter-model';
export { buildHistogram, histogramTable } from './histogram-model';
export type { HistogramModel } from './histogram-model';
export {
  readDistributionUiState,
  writeDistributionUiState,
  effectiveG4Variant,
  toggleLogHistogram,
  EMPTY_UI_STATE,
} from './url-state';
export type { DistributionUiState, G4Variant, BrushRange } from './url-state';
export { computeBrushSelection, brushToIntervalFilters } from './brush-model';
export {
  buildYearMedian,
  buildDepreciation,
  buildPriceMileageDensity,
  buildOutlierLollipops,
  buildCategoryBars,
  buildMileageBoxes,
  buildPowerTiers,
} from './graphs-model';
export { groupStat, ntile } from './group-stat';
