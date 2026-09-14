/**
 * KYCAR — Barrel de l'adaptateur `as24 → canonique` (phase 3.3)
 * =================================================================================================
 * Point d'entrée unique du dossier. Il est RÉUTILISABLE par un futur provider de source réelle
 * AutoScout24 : la table §3.1 de `docs/data/DATA-MODEL.md` ne dépend pas de la façon dont les
 * lignes arrivent (fichier de fixtures, API sous contrat), seulement de leur FORME.
 */

export type {
  As24Battery,
  As24Consumption,
  As24Listing,
  As24Location,
  As24Marketplace,
  As24Prices,
  As24PublicPrice,
  As24Seller,
  As24Wltp,
} from './types';

export {
  AS24_NOTICE_CODES,
  adaptAs24Listing,
  createAs24Context,
  type As24AdaptResult,
  type As24AdapterContext,
  type As24ContextOptions,
  type As24NoticeCode,
  type As24RejectReason,
  type CanonicalRow,
  type MeasurementSource,
} from './adapt';

export {
  ISO_TO_MARKETPLACE_CODE,
  LISTING_ID_PATTERN,
  MARKETPLACE_CODE_TO_ISO,
  hostMatchesDomain,
  normalizeListingUrl,
  normalizeText,
  roundHalfAwayFromZero,
  truncateCodePoints,
  truncateDecimals,
  uuidToBytes,
  type NormalizedListingUrl,
} from './normalize';

export {
  ADAPTED_VOCABULARIES,
  buildAs24CodeTables,
  tablesAgreeWithCodeIndex,
  type As24CodeTables,
  type CodeTable,
} from './vocab';

export { assembleBatch, writeCanonicalRow, type AssembledBatch } from './columnar';
