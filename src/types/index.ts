/**
 * KYCAR — Point d'entrée public du schéma (lot D2)
 * =================================================================================================
 * Barrel des types et fonctions que les lots D3/D4/D5/D9 importent. L'interface `DataProvider` est
 * réexportée depuis `src/providers/DataProvider.ts` (gelée, non modifiée) pour un import unique.
 */

// Interface DataProvider gelée (réexport).
export type {
  DataProvider,
  ProviderCapabilities,
  Mode2Capability,
  Mode2UnavailabilityReason,
  Mode1Source,
  ListingColumnBatch,
  MetricRange,
  MakeAggregate,
  ModelAggregate,
  AggregateResult,
  AggregateLevel,
  SnapshotDescriptor,
  SnapshotHandle,
  SnapshotId,
  OpenSnapshotRequest,
  Marketplace,
  SourceKind,
  SelectionQuery,
  TSelectionQuery,
} from '../providers/DataProvider';
export { servesMode2, STRINGS_PER_ROW } from '../providers/DataProvider';

// Sentinelles (EX-DATA-119/120).
export {
  NUMERIC_UNKNOWN,
  ENUM_UNKNOWN_BYTE,
  MODEL_ID_UNRESOLVED,
  isNumericKnown,
  isEnumByteKnown,
  readNumeric,
  readEnumByte,
  encodeNumeric,
  encodeEnumByte,
} from './sentinels';

// Modèle colonnaire.
export type { ColumnDescriptor, ColumnPhysicalType, SentinelPolicy, Listing } from './columns';
export { LISTING_COLUMNS, LISTING_COLUMN_BY_NAME } from './columns';

// Vocabulaires.
export type { VocabularyName, EnumValueDef, PostalRangeDef, IngestFlagCode } from './vocabularies';
export {
  VOCABULARY_NAMES,
  PRICE_STATUS_VALUES,
  MEASUREMENT_STANDARD_VALUES,
  USAGE_STATE_VALUES,
  AD_TIER_VALUES,
  PRICE_EVALUATION_VALUES,
  MARKETPLACE_VALUES,
  INGEST_FLAG_VALUES,
  INGEST_FLAG_BIT,
  INGEST_FLAG_BIT_CAPACITY,
  hasIngestFlag,
  setIngestFlag,
  ingestFlagCodes,
  OUTLIER_FLAG_VALUES,
  REGION_VALUES,
  BE_POSTAL_RANGES,
} from './vocabularies';

// Entités (EX-DATA-105).
export type {
  Snapshot,
  Make,
  Model,
  Enumeration,
  EnumValue,
  Region,
  PostalRegionRange,
  DistributionBucket,
  SelectionStats,
  MetricStats,
  OutlierVerdict,
  OutlierMethod,
  DensityCell,
  AggregationMetric,
} from './entities';

// Codec selectionHash / localDatasetKey (EX-DATA-108).
export type { FilterValue, SelectionInput, CanonicalizeOptions, SelectionHashResult } from './selection';
export {
  HASH_LENGTH,
  FULL,
  EMPTY,
  DEFAULT_TAXONOMY_T_FILTERS,
  compareCode,
  escapeFilterValue,
  unescapeFilterValue,
  serializeSelection,
  computeSelectionHash,
  localDatasetKey,
  selectionHash,
} from './selection';
export { sha256Hex } from './sha256';

// Règles métier partagées (seuils, facteurs, clés, nettoyage) — étape 0 de la remédiation 2.6.
export type {
  DuplicateConflictField,
  CleanModelVersionOptions,
  ParseModelVersionOptions,
  ParsedModelVersion,
  BadgePower,
} from './shared-rules';
export {
  PRICE_SENTINEL_ABSOLUTE_EUR,
  isPriceSentinelAbsolute,
  HP_TO_KW,
  hpToKw,
  listingKey,
  DUPLICATE_CONFLICT_FIELDS,
  MODEL_VERSION_CLEAN_MAX,
  TRIM_TOKEN_MAX_LENGTH,
  TRIM_TOKENS_MAX,
  cleanModelVersion,
  parseModelVersion,
} from './shared-rules';

// Validation + garde R3.
export type { ValidationIssue, ValidationResult, ValidateListingOptions } from './validation';
export {
  R3_FORBIDDEN_FIELD_NAMES,
  R3_IDENTIFIER_VALUE_KEYS,
  LISTING_NUMERIC_BOUNDS,
  LISTING_STRING_BOUNDS,
  LISTING_TRIM_TOKENS_MAX,
  LISTING_ID_PATTERN,
  LISTING_MANDATORY_FIELDS,
  defaultModelYearMax,
  scanForbiddenFields,
  scanForbiddenIdentifiers,
  validateListingRecord,
} from './validation';

// Invariants I1..I8 (EX-DATA-104).
export type { InvariantResult } from './invariants';
export {
  checkI1,
  checkI2,
  checkI3,
  checkI4,
  checkI5,
  checkI6,
  checkI7,
  checkI8,
} from './invariants';

// Chargeur de référentiels.
export type {
  ReferenceData,
  RawReferenceInputs,
  RawTaxonomy,
  RawMake,
  RawModel,
  RawReferenceFile,
  RawReferenceEntry,
  RawFilters,
  RawEnumEntry,
  RawFiltersScope,
  RawScopeEntry,
  RawVersionStoplist,
  RawVersionLexicon,
  FilterScope,
} from './reference';
export { buildReferenceData, modelKey } from './reference';
