/**
 * KYCAR — Barrel public de l'adaptateur 2dehands (lot D9)
 * =================================================================================================
 * Point d'entrée unique du dossier `src/providers/tweedehands/`. N'édite aucun barrel partagé
 * (`src/providers/README.md`, contrainte de lot) : ce fichier est propre à D9.
 */

export {
  TweedehandsDataProvider,
  type TweedehandsBaselineCache,
  type TweedehandsDataProviderOptions,
} from './TweedehandsDataProvider';

export {
  buildSearchUrl,
  assertAllowedUrl,
  createHttpTweedehandsFetcher,
  MAX_ALLOWED_PAGE_NUMBER,
  type TweedehandsFetcher,
  type TweedehandsMarketplace,
  type TweedehandsSearchRequest,
} from './fetcher';

export {
  extractNextDataScript,
  parseSearchResponse,
  getAttr,
  getAllAttrValues,
  type RawAttribute,
  type RawListing,
  type RawLocation,
  type RawPriceInfo,
  type RawSearchResponse,
} from './nextData';

export {
  isBodyTypeRecognised,
  isFuelCategoryRecognised,
  isUsageStateRecognised,
  mapBodyType,
  mapCountryCode,
  mapRegionCode,
  mapDrivetrain,
  mapEuEmissionStandard,
  mapFuelCategory,
  mapSellerType,
  mapTransmission,
  mapUsageState,
  buildEuroStandardIndex,
  resolveMakeId,
  resolveModelId,
  parseInteger,
  parseNumeric,
} from './vocabularyMap';

export { mapListingToNormalized, assertNoForbiddenFields, type NormalizedListing } from './normalize';

export {
  computeMetricRange,
  buildMakeAggregate,
  buildModelAggregate,
  buildUnresolvedModelAggregate,
  priceStatusCounts,
  sampleForMake,
  type MetricKind,
  type PriceStatusCounts,
} from './aggregate';

export {
  applyResidual,
  compileSourceSelection,
  type CompiledSourceSelection,
  type ResidualPredicate,
} from './selection';

export { dedupeListings, type DedupeResult } from './dedupe';
