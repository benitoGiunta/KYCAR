/**
 * KYCAR — Barrel de l'écran C (lot D8).
 */
export { CompareScreen } from './CompareScreen';
export type { CompareScreenProps, CompareModelRow } from './CompareScreen';
export {
  parseCompareParam,
  serializeCompareParam,
  MAX_COMPARE,
  addToCompare,
  removeFromCompare,
  type CompareModelKey,
} from './compare-selection';
