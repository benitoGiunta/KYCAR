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
 */

import { scanForbiddenFields } from '../../types/validation';
import type { ReferenceData } from '../../types/reference';
import { MODEL_ID_UNRESOLVED } from '../../types/sentinels';
import type { RawListing } from './nextData';
import {
  mapBodyType,
  mapDrivetrain,
  mapEuEmissionStandard,
  mapFuelCategory,
  mapSellerType,
  mapTransmission,
  mapUsageState,
  parseInteger,
  parseNumeric,
  readAttr,
  resolveMakeId,
  resolveModelId,
} from './vocabularyMap';

/**
 * Vue normalisée d'une annonce 2dehands, DÉJÀ dans le vocabulaire KYCAR. Structurellement sans champ
 * vendeur identifiant (R3) : ni nom, ni téléphone, ni adresse, ni géolocalisation, ni ville — seuls
 * `sellerType` (type, autorisé EX-DATA-42) et `marketplace` (pays, pas une adresse) sont portés.
 * `regionCode` n'existe PAS ici : dette de mapping documentée (`vocabularyMap.ts` en-tête).
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
  readonly modelYear: number | null;
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
  /** Codes `KYCAR_INGEST_FLAG` posés par la normalisation de cette annonce (EX-DATA-46). */
  readonly ingestFlags: readonly string[];
  /** Champs dont la valeur est restée INCONNUE (comptés dans `unknownCountByField` du snapshot). */
  readonly unknownFields: readonly string[];
}

/** Mappe `priceInfo` vers `priceEur`/`priceStatus` (`KYCAR_PRICE_STATUS`, §A.5.3). */
function mapPrice(priceCents: number | undefined, priceType: string | undefined): {
  priceEur: number | null;
  priceStatus: 'QUOTED' | 'ON_REQUEST' | 'MISSING';
} {
  if (priceType !== undefined && priceType.toUpperCase().includes('REQUEST')) {
    return { priceEur: null, priceStatus: 'ON_REQUEST' };
  }
  if (priceCents === undefined || priceCents <= 0) {
    return { priceEur: null, priceStatus: 'MISSING' };
  }
  return { priceEur: priceCents / 100, priceStatus: 'QUOTED' };
}

/**
 * Projette une annonce brute vers le vocabulaire KYCAR. `euroIndex` est précalculé une fois par
 * `TweedehandsDataProvider` (`buildEuroStandardIndex`) et réutilisé pour chaque annonce du lot.
 */
export function mapListingToNormalized(
  raw: RawListing,
  referenceData: ReferenceData,
  marketplace: 'be' | 'nl',
  euroIndex: ReadonlyMap<string, string>,
): NormalizedListing {
  const ingestFlags: string[] = [];
  const unknownFields: string[] = [];

  const brandRaw = readAttr(raw, 'brand');
  const modelRaw = readAttr(raw, 'model');
  const makeId = resolveMakeId(referenceData, brandRaw);
  const modelId = makeId === null ? MODEL_ID_UNRESOLVED : resolveModelId(referenceData, makeId, modelRaw);
  if (modelId === MODEL_ID_UNRESOLVED && modelRaw !== undefined) {
    ingestFlags.push('MODEL_UNRESOLVED');
    unknownFields.push('modelId');
  }

  const modelYear = parseInteger(readAttr(raw, 'constructionYear'));
  if (modelYear === null) unknownFields.push('modelYear');

  const mileageKm = parseInteger(readAttr(raw, 'mileage'));
  if (mileageKm === null) unknownFields.push('mileageKm');

  const fuelCategory = mapFuelCategory(readAttr(raw, 'fuel'));
  if (fuelCategory === null) {
    unknownFields.push('fuelCategory');
    if (readAttr(raw, 'fuel') !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const bodyType = mapBodyType(readAttr(raw, 'body'));
  if (bodyType === null) unknownFields.push('bodyType');

  const transmission = mapTransmission(readAttr(raw, 'transmission'));
  if (transmission === null) {
    unknownFields.push('transmission');
    if (readAttr(raw, 'transmission') !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const drivetrain = mapDrivetrain(readAttr(raw, 'driveTrain'));
  if (drivetrain === null) unknownFields.push('drivetrain');

  const usageState = mapUsageState(readAttr(raw, 'condition'));
  if (usageState === null) unknownFields.push('usageState');

  const sellerType = mapSellerType(readAttr(raw, 'advertiser'));
  if (sellerType === null) {
    unknownFields.push('sellerType');
    if (readAttr(raw, 'advertiser') !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const euEmissionStandard = mapEuEmissionStandard(readAttr(raw, 'euronormBE'), euroIndex);
  if (euEmissionStandard === null) unknownFields.push('euEmissionStandard');

  const powerKw = parseInteger(readAttr(raw, 'enginePowerKW'));
  const co2EmissionsGPerKm = parseNumeric(readAttr(raw, 'co2emission'));
  const seatCount = parseInteger(readAttr(raw, 'numberOfSeatsBE'));
  const doorCount = parseInteger(readAttr(raw, 'aantaldeurenBE'));

  const { priceEur, priceStatus } = mapPrice(raw.priceInfo?.priceCents, raw.priceInfo?.priceType);
  if (priceStatus === 'MISSING') ingestFlags.push('PRICE_MISSING_UNDECLARED');

  return {
    listingId: raw.itemId,
    listingUrl: raw.vipUrl,
    marketplace,
    priceEur,
    priceStatus,
    makeId,
    modelId,
    modelYear,
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
      `TweedehandsDataProvider: violation R3 sur une annonce normalisée : ${issues.map((i) => i.path).join(', ')}`,
    );
  }
}
