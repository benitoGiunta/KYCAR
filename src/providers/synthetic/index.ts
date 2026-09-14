/**
 * KYCAR — Point d'entrée public du lot D3 (`SyntheticDataProvider`)
 * =================================================================================================
 * Barrel PROPRE au sous-dossier `synthetic/` (aucune édition des barrels partagés `src/providers` ou
 * `src/types` — le câblage est fait par le coordinateur). Exporte le provider, ses options, la
 * fonction de génération et le format de VÉRITÉ TERRAIN des outliers consommé par D4.
 */

export {
  SyntheticDataProvider,
  SYNTHETIC_PROVIDER_VERSION,
  SYNTHETIC_CAPTURED_AT,
  type SyntheticProviderOptions,
} from './SyntheticDataProvider';

export {
  generateDataset,
  uuidToHex,
  CURRENT_YEAR,
  DEFAULT_SEED,
  DEFAULT_LISTING_COUNT,
  type CoreColumns,
  type GeneratedDataset,
  type GenerateOptions,
  type InjectedOutlier,
  type MetricColumns,
  type OutlierFlag,
} from './generate';

export { compileSelection, decodeTaxonomyScope, selectRows, type CompiledSelection } from './selection';

export { auditDuplicateListings, type DuplicateAudit } from './dedupe';

export { batchByteLength } from './columnar';
