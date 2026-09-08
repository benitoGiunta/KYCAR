/**
 * KYCAR — Adaptateur 2dehands (lot D9) : projection R3 d'une annonce brute vers le vocabulaire KYCAR
 * =================================================================================================
 * `mapListingToNormalized` est le point UNIQUE où une annonce 2dehands entre dans l'adaptateur. Il
 * construit un `NormalizedListing` CHAMP PAR CHAMP (allowlist explicite, jamais un spread de l'objet
 * brut) : aucune propriété du `RawListing` source qui ne soit pas nommée ci-dessous n'atteint jamais
 * la sortie. C'est la traduction exécutable de « filtrage R3 à l'ingestion, pas au rendu »
 * (`DataProvider.ts` en-tête, `EX-NFR-26`, P-2) — et la raison pour laquelle `scanForbiddenFields`
 * (garde D2) trouve zéro champ interdit sur la sortie de cette fonction, y compris quand l'entrée en
 * porterait (test `normalize.test.ts`).
 *
 * CONTRÔLES D'INGESTION (remédiation 2.6). L'ingestion n'appliquait AUCUNE règle de valeur : un prix
 * à 1 €, un prix à 10 000 000 €, un kilométrage à −5 km, une année 1899 et une puissance à 99 999 kW
 * traversaient tels quels et devenaient des bornes publiées. Sont désormais appliqués, DANS CET
 * ORDRE et sans jamais REJETER l'annonce (ARB-15, ARB-16) :
 *
 * | Règle | Exigence | Effet | Drapeau |
 * |---|---|---|---|
 * | prix sur demande (NL/FR/code source) | EX-DATA-16(b) | `priceStatus = ON_REQUEST` | `PRICE_ON_REQUEST_WITH_AMOUNT` si un montant l'accompagne |
 * | prix > 5 000 000 € | ARB-16 / ADV-16 | prix → INCONNU | `PRICE_OUT_OF_RANGE` |
 * | prix < 250 € | EX-DATA-19(1) / ARB-15 | prix CONSERVÉ, hors `V_price` (EX-DATA-60) | `PRICE_SENTINEL_ABSOLUTE` |
 * | prix absent | EX-DATA-18 | `priceStatus = MISSING` | `PRICE_MISSING_UNDECLARED` |
 * | km hors [0, 1 500 000] | annexe A champ 30 | km → INCONNU | `MILEAGE_OUT_OF_RANGE` |
 * | km = 0 | annexe A champ 59 | km CONSERVÉ, hors `V_mileage` | `SUSPECT_ZERO_MILEAGE` |
 * | puissance hors [1, 9 999] | annexe A champ 35 | puissance → INCONNU | `POWER_OUT_OF_RANGE` |
 * | année hors [1900, 2101] | annexe A champ 31 | année → INCONNU | `FIRST_REG_OUT_OF_RANGE` |
 * | valeur énumérée présente et non reconnue | EX-DATA-45/46 | repli typé | `ENUM_UNKNOWN` |
 * | pays hors table | EX-DATA-40 (ARB-60) | pays INCONNU | `MARKETPLACE_UNMAPPED` |
 * | région NUTS-2 | EX-DATA-53 (O14) | toujours INCONNUE sur cette surface | `REGION_UNRESOLVED` |
 *
 * PIVOT TEMPOREL (EX-DATA-25/27, DR-017). `constructionYear` de 2dehands est une ANNÉE-MODÈLE.
 * `EX-DATA-25` impose `firstRegistrationYear` comme seul pivot temporel des agrégats et `EX-DATA-27`
 * interdit de l'imputer depuis l'année-modèle. `firstRegistrationYear` est donc porté par le type et
 * vaut `null` sur cette surface, qui ne le sert pas : l'axe « année » des agrégats publie `n = 0`
 * plutôt qu'une fourchette décalée d'un à deux ans sans le dire.
 */

import { scanForbiddenFields } from '../../types/validation';
import { LISTING_NUMERIC_BOUNDS, isWithinListingBound } from '../../types/validation';
import type { ReferenceData } from '../../types/reference';
import { MODEL_ID_UNRESOLVED } from '../../types/sentinels';
import { cleanModelVersion, isPriceSentinelAbsolute } from '../../types/shared-rules';
import type { IngestFlagCode } from '../../types/vocabularies';
import type { RawListing } from './nextData';
import {
  isBodyTypeRecognised,
  isFuelCategoryRecognised,
  isUsageStateRecognised,
  mapBodyType,
  mapCountryCode,
  mapDrivetrain,
  mapEuEmissionStandard,
  mapFuelCategory,
  mapRegionCode,
  mapSellerType,
  mapTransmission,
  mapUsageState,
  parseInteger,
  parseNumeric,
  readAttr,
  resolveMakeId,
  resolveModelId,
} from './vocabularyMap';

/** Message d'erreur typé du provider (rattachable dans un rapport, ZO-5). */
const TYPED_PREFIX = 'TweedehandsDataProvider:';

/**
 * Préfixe de chemin d'une PAGE D'ANNONCE sur la surface Adevinta (`/v/<catégorie>/<id>`). `EX-NFR-26`
 * : « le deeplink conservé pointe vers l'annonce d'origine, jamais vers une fiche vendeur ». Le
 * deeplink était recopié sans contrôle : une URL de profil vendeur — chemin en `Disallow` chez
 * 2dehands — traversait la normalisation (DR-127). Contrôle par PRÉFIXE POSITIF (seule la page
 * d'annonce est acceptée), jamais par liste noire : une liste noire laisse passer ce qu'elle
 * n'énumère pas.
 */
const LISTING_PATH_PREFIX = '/v/';

/** Vrai si `url` désigne une PAGE D'ANNONCE de la surface (préfixe de chemin autorisé). */
function isListingDeeplink(url: string): boolean {
  const at = url.indexOf('://');
  if (at < 0) return false;
  const slash = url.indexOf('/', at + 3);
  if (slash < 0) return false;
  return url.slice(slash).startsWith(LISTING_PATH_PREFIX);
}

/**
 * Vue normalisée d'une annonce 2dehands, DÉJÀ dans le vocabulaire KYCAR. Structurellement sans champ
 * vendeur identifiant (R3) : ni nom, ni téléphone, ni adresse, ni géolocalisation, ni ville — seuls
 * `sellerType` (type, autorisé EX-DATA-42), `countryCode` (pays, pas une adresse) et `regionCode`
 * (NUTS-2, jamais un code postal exact) sont portés.
 */
export interface NormalizedListing {
  readonly listingId: string;
  readonly listingUrl: string;
  readonly marketplace: 'be' | 'nl';
  readonly priceEur: number | null;
  readonly priceStatus: 'QUOTED' | 'ON_REQUEST' | 'MISSING';
  /** `null` si la marque 2dehands ne résout à aucun `makeId` du référentiel — annonce écartée de
   *  l'agrégation par marque/modèle (pas de bucket « marque non identifiée » dans `MakeAggregate`). */
  readonly makeId: number | null;
  /** `0` = « Modèle non identifié » (EX-DATA-72), jamais `null`. */
  readonly modelId: number;
  /** Année-modèle relevée (`constructionYear`). JAMAIS le pivot temporel des agrégats (EX-DATA-25). */
  readonly modelYear: number | null;
  /** Pivot temporel d'EX-DATA-25. `null` : la surface autorisée ne sert pas cette date (EX-DATA-27
   *  interdit de l'imputer depuis `modelYear`). */
  readonly firstRegistrationYear: number | null;
  readonly mileageKm: number | null;
  readonly fuelCategory: string | null;
  readonly bodyType: string | null;
  readonly transmission: string | null;
  readonly drivetrain: string | null;
  readonly usageState: string | null;
  readonly sellerType: string | null;
  readonly euEmissionStandard: string | null;
  readonly powerKw: number | null;
  readonly co2EmissionsGPerKm: number | null;
  readonly seatCount: number | null;
  readonly doorCount: number | null;
  /** Pays ISO 3166-1 alpha-2, `null` si l'abréviation source est hors table (ARB-60). */
  readonly countryCode: string | null;
  /** Région NUTS-2, toujours `null` sur cette surface (EX-DATA-53 / O14, voir `mapRegionCode`). */
  readonly regionCode: string | null;
  /** Version brute relevée dans le titre, hors marque et modèle (`EX-DATA-29`). */
  readonly modelVersionRaw: string | null;
  /** Version nettoyée et tronquée à 80 points de code par la couche D2 (ARB-61/ADV-17). */
  readonly modelVersionClean: string | null;
  /** Date d'annonce brute (`date` : « Vandaag »…), jamais normalisée sur cette surface. */
  readonly listedAt: string | null;
  /** Codes `KYCAR_INGEST_FLAG` posés par la normalisation de cette annonce (EX-DATA-46). */
  readonly ingestFlags: readonly IngestFlagCode[];
  /** Champs dont la valeur est restée INCONNUE (comptés dans `unknownCountByField` du snapshot). */
  readonly unknownFields: readonly string[];
}

/**
 * Valeurs de `priceInfo.priceType` qui signifient « prix sur demande » (EX-DATA-16(b), DR-042).
 * Table EXPLICITE des formes RELEVÉES : néerlandais, français, anglais et le code Adevinta `NOTK`
 * (« Nader Overeen Te Komen »). Le jeton anglais `REQUEST` était le SEUL reconnu : « Op aanvraag »
 * et `NOTK` passaient pour un prix affiché.
 */
const ON_REQUEST_TOKENS: readonly string[] = [
  'request',
  'onrequest',
  'opaanvraag',
  'prijsopaanvraag',
  'notk',
  'nadereovereenkomst',
  'surdemande',
  'prixsurdemande',
  'surdevis',
];

/** Replie une valeur pour comparaison : minuscule, accents, espaces et séparateurs ôtés. */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\s\-_/.]+/g, '');
}

/** Vrai si `priceType` désigne un prix sur demande (table explicite ci-dessus). */
function isOnRequest(priceType: string | undefined): boolean {
  if (priceType === undefined) return false;
  const folded = fold(priceType);
  return ON_REQUEST_TOKENS.some((token) => folded.includes(token));
}

/** Résultat de la cartographie du prix (§A.5.3 `KYCAR_PRICE_STATUS` + drapeaux d'ARB-15/ARB-16). */
interface MappedPrice {
  readonly priceEur: number | null;
  readonly priceStatus: 'QUOTED' | 'ON_REQUEST' | 'MISSING';
  readonly flags: readonly IngestFlagCode[];
}

/** Mappe `priceInfo` vers `priceEur`/`priceStatus` et les drapeaux d'ingestion associés. */
function mapPrice(priceCents: number | undefined, priceType: string | undefined): MappedPrice {
  const flags: IngestFlagCode[] = [];
  const hasAmount = priceCents !== undefined && priceCents > 0;

  if (isOnRequest(priceType)) {
    // ADV-16 : un prix sur demande ACCOMPAGNÉ d'un montant est une incohérence de la source, pas un
    // prix affiché — l'annonce est conservée, le montant est écarté, le rapport le dit.
    if (hasAmount) flags.push('PRICE_ON_REQUEST_WITH_AMOUNT');
    return { priceEur: null, priceStatus: 'ON_REQUEST', flags };
  }
  if (!hasAmount) {
    return { priceEur: null, priceStatus: 'MISSING', flags: ['PRICE_MISSING_UNDECLARED'] };
  }

  const euros = (priceCents as number) / 100;
  const bounds = LISTING_NUMERIC_BOUNDS.priceEur;
  if (bounds !== undefined && euros > bounds.max) {
    // ARB-16 : hors borne haute ⇒ INCONNU + drapeau, JAMAIS un rejet d'annonce.
    return { priceEur: null, priceStatus: 'QUOTED', flags: ['PRICE_OUT_OF_RANGE'] };
  }
  if (isPriceSentinelAbsolute(euros)) {
    // ARB-15 : la valeur est CONSERVÉE (l'annonce compte), mais EX-DATA-60 la sort de `V_price`.
    flags.push('PRICE_SENTINEL_ABSOLUTE');
  }
  return { priceEur: euros, priceStatus: 'QUOTED', flags };
}

/** Applique une borne numérique de l'annexe A : hors domaine ⇒ INCONNU + drapeau. */
function boundedInteger(
  value: number | null,
  field: keyof typeof LISTING_NUMERIC_BOUNDS,
  flag: IngestFlagCode,
  flags: IngestFlagCode[],
): number | null {
  if (value === null) return null;
  if (!isWithinListingBound(field, value)) {
    flags.push(flag);
    return null;
  }
  return value;
}

/**
 * Extrait la VERSION d'une annonce : le titre privé de la marque et du modèle (`EX-DATA-29`). Le
 * nettoyage et la troncature à 80 points de code sont ceux de la couche D2 (`cleanModelVersion`,
 * ARB-61/ADV-24) — jamais réécrits ici.
 */
function extractVersion(
  raw: RawListing,
  brandRaw: string | undefined,
  modelRaw: string | undefined,
): { modelVersionRaw: string | null; modelVersionClean: string | null } {
  const title = typeof raw.title === 'string' ? raw.title : undefined;
  if (title === undefined) return { modelVersionRaw: null, modelVersionClean: null };
  let rest = title;
  for (const part of [brandRaw, modelRaw]) {
    if (part === undefined || part.length === 0) continue;
    const at = rest.toLowerCase().indexOf(part.toLowerCase());
    if (at >= 0) rest = `${rest.slice(0, at)}${rest.slice(at + part.length)}`;
  }
  const modelVersionRaw = rest.trim();
  if (modelVersionRaw.length === 0) return { modelVersionRaw: null, modelVersionClean: null };
  return { modelVersionRaw, modelVersionClean: cleanModelVersion(modelVersionRaw) };
}

/**
 * Projette une annonce brute vers le vocabulaire KYCAR. `euroIndex` est précalculé une fois par
 * `TweedehandsDataProvider` (`buildEuroStandardIndex`) et réutilisé pour chaque annonce du lot.
 *
 * Lève un message TYPÉ (ZO-5) si l'élément n'est pas un objet d'annonce : un `null` glissé dans
 * `listings` faisait auparavant échouer tout `openSnapshot` sur un `TypeError` non rattachable.
 */
export function mapListingToNormalized(
  raw: RawListing,
  referenceData: ReferenceData,
  marketplace: 'be' | 'nl',
  euroIndex: ReadonlyMap<string, string>,
): NormalizedListing {
  if (raw === null || typeof raw !== 'object') {
    throw new TypeError(`${TYPED_PREFIX} élément de listings non exploitable (attendu : un objet d'annonce)`);
  }

  const ingestFlags: IngestFlagCode[] = [];
  const unknownFields: string[] = [];

  const brandRaw = readAttr(raw, 'brand');
  const modelRaw = readAttr(raw, 'model');
  const makeId = resolveMakeId(referenceData, brandRaw);
  if (makeId === null) unknownFields.push('makeId');
  const modelId = makeId === null ? MODEL_ID_UNRESOLVED : resolveModelId(referenceData, makeId, modelRaw);
  if (modelId === MODEL_ID_UNRESOLVED && modelRaw !== undefined) {
    ingestFlags.push('MODEL_UNRESOLVED');
    unknownFields.push('modelId');
  }

  const modelYear = boundedInteger(
    parseInteger(readAttr(raw, 'constructionYear')),
    'modelYear',
    'FIRST_REG_OUT_OF_RANGE',
    ingestFlags,
  );
  if (modelYear === null) unknownFields.push('modelYear');

  // EX-DATA-25/27 (DR-017) : la surface autorisée ne sert AUCUNE date de première immatriculation ;
  // l'imputer depuis `modelYear` est explicitement interdit. Le champ existe et vaut INCONNU.
  const firstRegistrationYear: number | null = null;
  unknownFields.push('firstRegistrationYear');

  const rawMileage = parseInteger(readAttr(raw, 'mileage'));
  const mileageKm = boundedInteger(rawMileage, 'mileageKm', 'MILEAGE_OUT_OF_RANGE', ingestFlags);
  if (mileageKm === null) unknownFields.push('mileageKm');
  // Annexe A champ 59 : 0 km sur une annonce d'occasion est SUSPECT — la valeur reste, mais elle
  // sort de `V_mileage` (EX-DATA-60) et le rapport d'ingestion la nomme.
  else if (mileageKm === 0) ingestFlags.push('SUSPECT_ZERO_MILEAGE');

  const fuelRaw = readAttr(raw, 'fuel');
  const fuelCategory = mapFuelCategory(fuelRaw);
  if (fuelCategory === null) unknownFields.push('fuelCategory');
  else if (!isFuelCategoryRecognised(fuelRaw)) {
    ingestFlags.push('ENUM_UNKNOWN');
    unknownFields.push('fuelCategory');
  }

  const bodyRaw = readAttr(raw, 'body');
  const bodyType = mapBodyType(bodyRaw);
  if (bodyType === null) unknownFields.push('bodyType');
  else if (!isBodyTypeRecognised(bodyRaw)) {
    // Le repli « Autres » est un code valide : c'est le drapeau qui empêche qu'il passe pour une
    // reconnaissance (DR-044).
    ingestFlags.push('ENUM_UNKNOWN');
    unknownFields.push('bodyType');
  }

  const transmissionRaw = readAttr(raw, 'transmission');
  const transmission = mapTransmission(transmissionRaw);
  if (transmission === null) {
    unknownFields.push('transmission');
    if (transmissionRaw !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const driveTrainRaw = readAttr(raw, 'driveTrain');
  const drivetrain = mapDrivetrain(driveTrainRaw);
  if (drivetrain === null) {
    unknownFields.push('drivetrain');
    if (driveTrainRaw !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const conditionRaw = readAttr(raw, 'condition');
  const usageState = mapUsageState(conditionRaw);
  if (usageState === null) unknownFields.push('usageState');
  else if (!isUsageStateRecognised(conditionRaw)) {
    ingestFlags.push('ENUM_UNKNOWN');
    unknownFields.push('usageState');
  }

  const advertiserRaw = readAttr(raw, 'advertiser');
  const sellerType = mapSellerType(advertiserRaw);
  if (sellerType === null) {
    unknownFields.push('sellerType');
    if (advertiserRaw !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const euronormRaw = readAttr(raw, 'euronormBE');
  const euEmissionStandard = mapEuEmissionStandard(euronormRaw, euroIndex);
  if (euEmissionStandard === null) {
    unknownFields.push('euEmissionStandard');
    if (euronormRaw !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const powerKw = boundedInteger(
    parseInteger(readAttr(raw, 'enginePowerKW')),
    'powerKw',
    'POWER_OUT_OF_RANGE',
    ingestFlags,
  );
  if (powerKw === null) unknownFields.push('powerKw');

  const co2EmissionsGPerKm = parseNumeric(readAttr(raw, 'co2emission'));
  if (co2EmissionsGPerKm === null) unknownFields.push('co2EmissionsGPerKm');
  const seatCount = parseInteger(readAttr(raw, 'numberOfSeatsBE'));
  if (seatCount === null) unknownFields.push('seatCount');
  const doorCount = parseInteger(readAttr(raw, 'aantaldeurenBE'));
  if (doorCount === null) unknownFields.push('doorCount');

  // EX-DATA-40 (ARB-60/ADV-15) : pays traduit en ISO, repli INCONNU + `MARKETPLACE_UNMAPPED`.
  const countryCode = mapCountryCode(raw.location?.countryAbbreviation);
  if (countryCode === null) {
    unknownFields.push('countryCode');
    ingestFlags.push('MARKETPLACE_UNMAPPED');
  }
  // EX-DATA-53 (O14) : aucune région dérivable sans code postal — couverture NULLE, pas muette.
  const regionCode = mapRegionCode();
  unknownFields.push('regionCode');
  ingestFlags.push('REGION_UNRESOLVED');

  const { modelVersionRaw, modelVersionClean } = extractVersion(raw, brandRaw, modelRaw);
  if (modelVersionClean === null) unknownFields.push('modelVersionClean');
  else if (modelVersionClean.length === 0) ingestFlags.push('VERSION_FULLY_STRIPPED');

  const listedAt = typeof raw.date === 'string' && raw.date.length > 0 ? raw.date : null;
  if (listedAt === null) unknownFields.push('listedAt');

  const price = mapPrice(raw.priceInfo?.priceCents, raw.priceInfo?.priceType);
  ingestFlags.push(...price.flags);
  if (price.priceEur === null) unknownFields.push('priceEur');

  // EX-NFR-26 (DR-127) : un deeplink qui n'est pas une page d'annonce est ÉCARTÉ et recensé — il ne
  // franchit jamais l'adaptateur, même quand la source le sert.
  const rawDeeplink = typeof raw.vipUrl === 'string' ? raw.vipUrl : '';
  const deeplink = isListingDeeplink(rawDeeplink) ? rawDeeplink : '';
  if (deeplink === '') unknownFields.push('listingUrl');

  return {
    // ZO-5 : un listing partiel ne ment pas sur son type — `listingId`/`listingUrl` restent des
    // chaînes, vides si la source ne les sert pas ou si le deeplink n'est pas une page d'annonce.
    listingId: typeof raw.itemId === 'string' ? raw.itemId : '',
    listingUrl: deeplink,
    marketplace,
    priceEur: price.priceEur,
    priceStatus: price.priceStatus,
    makeId,
    modelId,
    modelYear,
    firstRegistrationYear,
    mileageKm,
    fuelCategory,
    bodyType,
    transmission,
    drivetrain,
    usageState,
    sellerType,
    euEmissionStandard,
    powerKw,
    co2EmissionsGPerKm,
    seatCount,
    doorCount,
    countryCode,
    regionCode,
    modelVersionRaw,
    modelVersionClean,
    listedAt,
    ingestFlags,
    unknownFields,
  };
}

/**
 * Prouve, à l'exécution, qu'un `NormalizedListing` ne porte aucun champ R3 (P-1). Enveloppe fine de
 * `scanForbiddenFields` (garde D2) pour un usage direct dans les tests de ce lot.
 */
export function assertNoForbiddenFields(listing: NormalizedListing): void {
  const issues = scanForbiddenFields(listing);
  if (issues.length > 0) {
    throw new Error(
      `${TYPED_PREFIX} violation R3 sur une annonce normalisée : ${issues.map((i) => i.path).join(', ')}`,
    );
  }
}
