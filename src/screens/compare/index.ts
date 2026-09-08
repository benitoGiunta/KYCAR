/**
 * KYCAR — Barrel de l'écran C (lot D8).
 */
export { CompareScreen } from './CompareScreen';
export type { CompareScreenProps, CompareModelRow, CompareRedirectTarget } from './CompareScreen';
export { COMPARE_MAX_MODELS } from './CompareScreen';
export {
  parseCompareParam,
  serializeCompareParam,
  MAX_COMPARE,
  addToCompare,
  removeFromCompare,
  type CompareModelKey,
} from './compare-selection';
