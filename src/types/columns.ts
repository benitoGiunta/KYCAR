/**
 * KYCAR — Modèle colonnaire de `Listing` (EX-DATA-119)
 * =================================================================================================
 * Lot D2. Décrit, champ par champ, la disposition physique colonnaire de la table `Listing` telle
 * qu'elle est gelée dans `ListingColumnBatch` (`DataProvider.ts` §5) et dans le tableau d'EX-DATA-119.
 *
 * Ce module NE redéclare PAS `ListingColumnBatch` : il le réexporte depuis l'interface gelée (qui
 * fait foi) et fournit, à côté, un DESCRIPTEUR de schéma (`LISTING_COLUMNS`) qui associe chaque
 * colonne à son type physique, à sa sentinelle et, pour les colonnes énumérées, à son vocabulaire
 * (EX-DATA-8). Le descripteur pilote la validation (`validation.ts`) et documente l'alignement.
 *
 * GARANTIE R3 STRUCTURELLE (EX-DATA-122 / P-1) : ce descripteur ne contient AUCUNE colonne vendeur
 * identifiante (E1..E14, §A.7). `sellerType` (type de vendeur) et `regionCode` (NUTS-2) y figurent
 * — ils sont explicitement autorisés (EX-DATA-42) ; nom, téléphone, adresse et code postal exact
 * n'ont, par construction, aucune colonne.
 */

import type { VocabularyName } from './vocabularies';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN } from './sentinels';

export type { ListingColumnBatch } from '../providers/DataProvider';
export { STRINGS_PER_ROW } from '../providers/DataProvider';

/** Type physique d'une colonne du modèle colonnaire. */
export type ColumnPhysicalType =
  | 'Int32Array'
  | 'Int16Array'
  | 'Uint8Array'
  | 'Uint16Array'
  | 'Uint8Array16' // 16 octets par ligne (UUID binaire de `listingId`)
  | 'bitset16' // `Uint16Array` de drapeaux de bits (`booleanFlags`)
  | 'bitset32' // `Uint32Array` de drapeaux de bits (`ingestFlags`, 17 codes — D-01 / DR-013)
  | 'string'; // champ textuel de la zone de chaînes (adressé par offsets)

/** Politique de sentinelle d'une colonne. */
export type SentinelPolicy =
  | { readonly kind: 'numeric'; readonly value: typeof NUMERIC_UNKNOWN } // -1
  | { readonly kind: 'enumByte'; readonly value: typeof ENUM_UNKNOWN_BYTE } // 255
  | { readonly kind: 'reserved-zero' } // `modelId` : 0 = non résolu, pas une sentinelle d'inconnu
  | { readonly kind: 'tristate-zero' } // `vatDeductible` : 0 = INCONNU, 1 = NON, 2 = OUI (D8-08)
  | { readonly kind: 'none' }; // colonne toujours connue (ex. `makeId`, OBL) ou zone de bits/chaînes

/** Descripteur d'une colonne physique du batch. */
export interface ColumnDescriptor {
  /** Nom de la colonne, identique à la propriété de `ListingColumnBatch`. */
  readonly name: string;
  readonly physical: ColumnPhysicalType;
  readonly sentinel: SentinelPolicy;
  /** Vocabulaire de rattachement pour une colonne énumérée (EX-DATA-8), sinon `null`. */
  readonly vocabulary: VocabularyName | null;
  /** Facteur d'échelle appliqué au stockage entier (ex. `×10` pour un décimal à 1 décimale). */
  readonly scale: number;
  /** Champ hors du chemin chaud (zone de chaînes, EX-DATA-121). */
  readonly hotPath: boolean;
}

const NUM: SentinelPolicy = { kind: 'numeric', value: NUMERIC_UNKNOWN };
const ENUMB: SentinelPolicy = { kind: 'enumByte', value: ENUM_UNKNOWN_BYTE };
const NONE: SentinelPolicy = { kind: 'none' };
const VATD: SentinelPolicy = { kind: 'tristate-zero' };

/**
 * Le schéma colonnaire complet, dans l'ordre d'EX-DATA-119 et de `ListingColumnBatch`.
 * Aligné octet à octet sur l'interface gelée.
 */
export const LISTING_COLUMNS: readonly ColumnDescriptor[] = [
  // Identité
  { name: 'listingId', physical: 'Uint8Array16', sentinel: NONE, vocabulary: null, scale: 1, hotPath: false },

  // Colonnes numériques du chemin chaud
  { name: 'priceEur', physical: 'Int32Array', sentinel: NUM, vocabulary: null, scale: 1, hotPath: true },
  { name: 'mileageKm', physical: 'Int32Array', sentinel: NUM, vocabulary: null, scale: 1, hotPath: true },
  { name: 'firstRegistrationYearMonth', physical: 'Int32Array', sentinel: NUM, vocabulary: null, scale: 1, hotPath: true },
  { name: 'modelId', physical: 'Int32Array', sentinel: { kind: 'reserved-zero' }, vocabulary: null, scale: 1, hotPath: true },
  { name: 'makeId', physical: 'Int32Array', sentinel: NONE, vocabulary: null, scale: 1, hotPath: true },
  { name: 'modelYear', physical: 'Int16Array', sentinel: NUM, vocabulary: null, scale: 1, hotPath: true },
  { name: 'powerKw', physical: 'Int16Array', sentinel: NUM, vocabulary: null, scale: 1, hotPath: true },
  { name: 'co2EmissionsGPerKmX10', physical: 'Int16Array', sentinel: NUM, vocabulary: null, scale: 10, hotPath: true },
  { name: 'consumptionCombinedL100KmX10', physical: 'Int16Array', sentinel: NUM, vocabulary: null, scale: 10, hotPath: true },
  { name: 'electricRangeKm', physical: 'Int16Array', sentinel: NUM, vocabulary: null, scale: 1, hotPath: true },

  // Colonnes énumérées sur un octet (sentinelle 255)
  { name: 'fuelCategory', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_FUEL_CATEGORY', scale: 1, hotPath: true },
  { name: 'bodyType', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_BODY_TYPE', scale: 1, hotPath: true },
  { name: 'transmission', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_TRANSMISSION', scale: 1, hotPath: true },
  { name: 'drivetrain', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_DRIVETRAIN', scale: 1, hotPath: true },
  { name: 'offerType', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_OFFER_TYPE', scale: 1, hotPath: true },
  { name: 'usageState', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_USAGE_STATE', scale: 1, hotPath: true },
  { name: 'sellerType', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_SELLER_TYPE', scale: 1, hotPath: true },
  { name: 'regionCode', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_REGION', scale: 1, hotPath: true },
  // Champ # 74 : ISO-3166-1 alpha-2, colonne « Énum. » VIDE. EX-DATA-40 avertit que la liste de
  // recherche et la liste ISO se recouvrent par ACCIDENT (`L` = Luxembourg en recherche, Liberia en
  // ISO) : rattacher la colonne à `KYCAR_MARKETPLACE` produisait un libellé de pays potentiellement
  // faux (DR-023). Le décodage se fait contre `references/Country.json`, hors vocabulaire nommé.
  { name: 'countryCode', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: null, scale: 1, hotPath: true },
  { name: 'priceStatus', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_PRICE_STATUS', scale: 1, hotPath: true },
  { name: 'priceEvaluationCategory', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_PRICE_EVALUATION', scale: 1, hotPath: true },
  { name: 'adTier', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_AD_TIER', scale: 1, hotPath: true },
  { name: 'bodyColor', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_BODY_COLOR', scale: 1, hotPath: true },
  { name: 'upholsteryType', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_UPHOLSTERY_TYPE', scale: 1, hotPath: true },
  { name: 'euEmissionStandard', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: 'KYCAR_EU_EMISSION_STANDARD', scale: 1, hotPath: true },
  { name: 'doorCount', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: null, scale: 1, hotPath: true },
  { name: 'seatCount', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: null, scale: 1, hotPath: true },
  { name: 'previousOwnerCount', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: null, scale: 1, hotPath: true },
  { name: 'imageCount', physical: 'Uint8Array', sentinel: ENUMB, vocabulary: null, scale: 1, hotPath: true },
  // Champ # 10 `isTaxDeductible` (colonne « TVA » d'EX-SCR-203, D8-08 / DR-082). Tri-état sur un
  // octet : l'inconnu vaut `0`, PAS la sentinelle 255 des autres colonnes énumérées — le champ
  // source est un booléen optionnel et les trois états tiennent dans 0/1/2 (`VAT_DEDUCTIBLE`).
  { name: 'vatDeductible', physical: 'Uint8Array', sentinel: VATD, vocabulary: null, scale: 1, hotPath: false },

  // Drapeaux de bits
  { name: 'booleanFlags', physical: 'bitset16', sentinel: NONE, vocabulary: null, scale: 1, hotPath: true },
  { name: 'ingestFlags', physical: 'bitset32', sentinel: NONE, vocabulary: 'KYCAR_INGEST_FLAG', scale: 1, hotPath: true },

  // Zone de chaînes (EX-DATA-121), hors du chemin chaud
  { name: 'listingUrl', physical: 'string', sentinel: NONE, vocabulary: null, scale: 1, hotPath: false },
  { name: 'modelVersionRaw', physical: 'string', sentinel: NONE, vocabulary: null, scale: 1, hotPath: false },
  { name: 'modelVersionClean', physical: 'string', sentinel: NONE, vocabulary: null, scale: 1, hotPath: false },
  { name: 'fuelSourceLabelRaw', physical: 'string', sentinel: NONE, vocabulary: null, scale: 1, hotPath: false },
  { name: 'trimTokens', physical: 'string', sentinel: NONE, vocabulary: null, scale: 1, hotPath: false },
];

/** Index des descripteurs par nom de colonne. */
export const LISTING_COLUMN_BY_NAME: ReadonlyMap<string, ColumnDescriptor> = new Map(
  LISTING_COLUMNS.map((c) => [c.name, c]),
);

/**
 * Vue LOGIQUE d'une ligne `Listing` décodée (entité `Listing`, EX-DATA-105), miroir exact des
 * colonnes du batch : toute valeur inconnue est `null` (jamais `0`, jamais la sentinelle brute).
 * Aucune propriété vendeur identifiante — la même garantie R3 structurelle que `ListingColumnBatch`.
 * C'est une vue de FORAGE (drilldown) : le chemin chaud lit les colonnes typées, pas cet objet.
 */
export interface Listing {
  /** UUID canonique 8-4-4-4-12 (décodé depuis les 16 octets binaires). */
  readonly listingId: string;
  readonly priceEur: number | null;
  readonly mileageKm: number | null;
  /** `12·année + (mois-1)`, décodé, ou `null`. */
  readonly firstRegistrationYearMonth: number | null;
  /** `0` = « Modèle non identifié » (EX-DATA-72). */
  readonly modelId: number;
  readonly makeId: number;
  readonly modelYear: number | null;
  readonly powerKw: number | null;
  /** g/km, une décimale (colonne stockée ×10). */
  readonly co2EmissionsGPerKm: number | null;
  /** l/100km, une décimale (colonne stockée ×10). */
  readonly consumptionCombinedL100Km: number | null;
  readonly electricRangeKm: number | null;

  readonly fuelCategory: number | null;
  readonly bodyType: number | null;
  readonly transmission: number | null;
  readonly drivetrain: number | null;
  readonly offerType: number | null;
  readonly usageState: number | null;
  /** Type de vendeur (particulier/pro) — NON identifiant, autorisé (EX-DATA-42). */
  readonly sellerType: number | null;
  /** NUTS-2 (P-3) — jamais le code postal exact. */
  readonly regionCode: number | null;
  readonly countryCode: number | null;
  readonly priceStatus: number | null;
  readonly priceEvaluationCategory: number | null;
  readonly adTier: number | null;
  readonly bodyColor: number | null;
  readonly upholsteryType: number | null;
  readonly euEmissionStandard: number | null;
  readonly doorCount: number | null;
  readonly seatCount: number | null;
  readonly previousOwnerCount: number | null;
  readonly imageCount: number | null;

  readonly booleanFlags: number;
  readonly ingestFlags: number;

  /** TVA déductible (EX-SCR-203) : `true`, `false`, ou `null` si la source ne le dit pas (D8-08). */
  readonly vatDeductible: boolean | null;

  readonly listingUrl: string;
  readonly modelVersionRaw: string | null;
  readonly modelVersionClean: string | null;
  readonly fuelSourceLabelRaw: string | null;
  readonly trimTokens: readonly string[];
}
