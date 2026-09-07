/**
 * KYCAR — Barrel public de l'adaptateur 2dehands (lot D9)
 * =================================================================================================
 * Point d'entrée unique du dossier `src/providers/tweedehands/`. N'édite aucun barrel partagé
 * (`src/providers/README.md`, contrainte de lot) : ce fichier est propre à D9.
 */

export { TweedehandsDataProvider, type TweedehandsDataProviderOptions } from './TweedehandsDataProvider';

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
  mapBodyType,
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

export { computeMetricRange, buildMakeAggregate, buildModelAggregate } from './aggregate';
