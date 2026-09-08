/**
 * KYCAR — Assemblage colonnaire d'un `ListingColumnBatch` (EX-DATA-119/121)
 * =================================================================================================
 * Trois services pour le lot D3 :
 *   - `allocColumns` : alloue les `TypedArray` d'un lot de `rowCount` lignes. Le générateur écrit
 *     DIRECTEMENT dans ces colonnes (aucun objet-ligne intermédiaire : DR-049, chemin critique).
 *   - `buildStringZone` / `finalizeBatch` : matérialisent la zone de chaînes contiguë
 *     (`stringBlob` + `stringOffsets`, `STRINGS_PER_ROW` champs par ligne) et figent le lot. Cette
 *     étape est la plus coûteuse de la génération (≈ 330 ms à 100 000 lignes) : elle est DIFFÉRÉE
 *     hors du chemin critique de `openSnapshot` (DR-049, ARCHITECTURE §9.3 garde-fou 2).
 *   - `subsetBatch` : extrait un sous-ensemble de lignes d'un lot existant (filtrage de sélection,
 *     forage par identifiants), en reconstruisant la zone de chaînes.
 *
 * GARANTIE R3 STRUCTURELLE : le lot n'a, par construction, aucune colonne vendeur identifiante — la
 * même propriété que le type gelé `ListingColumnBatch`. Aucun champ E1..E14 n'est jamais alloué.
 */

import type { ListingColumnBatch } from '../DataProvider';
import { STRINGS_PER_ROW } from '../DataProvider';

const ENCODER = new TextEncoder();

/** Champs de chaînes attendus par ligne (miroir de `STRINGS_PER_ROW`). */
const STRING_FIELDS = STRINGS_PER_ROW;

/** Colonnes typées mutables allouées pour l'assemblage — écrites directement par le générateur. */
export interface MutableColumns {
  listingId: Uint8Array;
  priceEur: Int32Array;
  mileageKm: Int32Array;
  firstRegistrationYearMonth: Int32Array;
  modelId: Int32Array;
  makeId: Int32Array;
  modelYear: Int16Array;
  powerKw: Int16Array;
  co2EmissionsGPerKmX10: Int16Array;
  consumptionCombinedL100KmX10: Int16Array;
  electricRangeKm: Int16Array;
  fuelCategory: Uint8Array;
  bodyType: Uint8Array;
  transmission: Uint8Array;
  drivetrain: Uint8Array;
  offerType: Uint8Array;
  usageState: Uint8Array;
  sellerType: Uint8Array;
  regionCode: Uint8Array;
  countryCode: Uint8Array;
  priceStatus: Uint8Array;
  priceEvaluationCategory: Uint8Array;
  adTier: Uint8Array;
  bodyColor: Uint8Array;
  upholsteryType: Uint8Array;
  euEmissionStandard: Uint8Array;
  doorCount: Uint8Array;
  seatCount: Uint8Array;
  previousOwnerCount: Uint8Array;
  imageCount: Uint8Array;
  booleanFlags: Uint16Array;
  ingestFlags: Uint32Array;
}

/** Alloue toutes les colonnes typées d'un lot de `rowCount` lignes (sentinelles à poser par l'appelant). */
export function allocColumns(rowCount: number): MutableColumns {
  return {
    listingId: new Uint8Array(rowCount * 16),
    priceEur: new Int32Array(rowCount),
    mileageKm: new Int32Array(rowCount),
    firstRegistrationYearMonth: new Int32Array(rowCount),
    modelId: new Int32Array(rowCount),
    makeId: new Int32Array(rowCount),
    modelYear: new Int16Array(rowCount),
    powerKw: new Int16Array(rowCount),
    co2EmissionsGPerKmX10: new Int16Array(rowCount),
    consumptionCombinedL100KmX10: new Int16Array(rowCount),
    electricRangeKm: new Int16Array(rowCount),
    fuelCategory: new Uint8Array(rowCount),
    bodyType: new Uint8Array(rowCount),
    transmission: new Uint8Array(rowCount),
    drivetrain: new Uint8Array(rowCount),
    offerType: new Uint8Array(rowCount),
    usageState: new Uint8Array(rowCount),
    sellerType: new Uint8Array(rowCount),
    regionCode: new Uint8Array(rowCount),
    countryCode: new Uint8Array(rowCount),
    priceStatus: new Uint8Array(rowCount),
    priceEvaluationCategory: new Uint8Array(rowCount),
    adTier: new Uint8Array(rowCount),
    bodyColor: new Uint8Array(rowCount),
    upholsteryType: new Uint8Array(rowCount),
    euEmissionStandard: new Uint8Array(rowCount),
    doorCount: new Uint8Array(rowCount),
    seatCount: new Uint8Array(rowCount),
    previousOwnerCount: new Uint8Array(rowCount),
    imageCount: new Uint8Array(rowCount),
    booleanFlags: new Uint16Array(rowCount),
    ingestFlags: new Uint32Array(rowCount),
  };
}

/** Assemble la zone de chaînes contiguë à partir des chaînes par ligne. */
export function buildStringZone(
  perRowStrings: readonly (readonly string[])[],
): { stringBlob: Uint8Array; stringOffsets: Uint32Array } {
  const rowCount = perRowStrings.length;
  const encoded: Uint8Array[] = new Array(rowCount * STRING_FIELDS);
  let totalBytes = 0;
  for (let r = 0; r < rowCount; r += 1) {
    const strings = perRowStrings[r] ?? [];
    for (let f = 0; f < STRING_FIELDS; f += 1) {
      const bytes = ENCODER.encode(strings[f] ?? '');
      encoded[r * STRING_FIELDS + f] = bytes;
      totalBytes += bytes.length;
    }
  }
  const stringBlob = new Uint8Array(totalBytes);
  const stringOffsets = new Uint32Array(rowCount * STRING_FIELDS + 1);
  let cursor = 0;
  for (let i = 0; i < encoded.length; i += 1) {
    stringOffsets[i] = cursor;
    const bytes = encoded[i] as Uint8Array;
    stringBlob.set(bytes, cursor);
    cursor += bytes.length;
  }
  stringOffsets[encoded.length] = cursor;
  return { stringBlob, stringOffsets };
}

/**
 * Fige un lot colonnaire : colonnes déjà remplies + zone de chaînes construite à partir des
 * `STRINGS_PER_ROW` champs textuels de chaque ligne.
 */
export function finalizeBatch(
  cols: MutableColumns,
  rowCount: number,
  perRowStrings: readonly (readonly string[])[],
  snapshotId: string,
  localDatasetKey: string,
): ListingColumnBatch {
  const { stringBlob, stringOffsets } = buildStringZone(perRowStrings);
  return { snapshotId, localDatasetKey, rowCount, ...cols, stringBlob, stringOffsets };
}

/**
 * Extrait un sous-ensemble ordonné de lignes d'un lot, en reconstruisant la zone de chaînes. Utilisé
 * pour le filtrage de `fetchListingColumns` sur une composante `T` et pour `fetchListingsByIds`.
 */
export function subsetBatch(
  source: ListingColumnBatch,
  indices: readonly number[],
  snapshotId: string,
  localDatasetKey: string,
): ListingColumnBatch {
  const n = indices.length;
  const cols = allocColumns(n);
  const perRowStrings: string[][] = new Array(n);
  const decoder = new TextDecoder();
  for (let k = 0; k < n; k += 1) {
    const i = indices[k] as number;
    cols.listingId.set(source.listingId.subarray(i * 16, i * 16 + 16), k * 16);
    cols.priceEur[k] = source.priceEur[i] as number;
    cols.mileageKm[k] = source.mileageKm[i] as number;
    cols.firstRegistrationYearMonth[k] = source.firstRegistrationYearMonth[i] as number;
    cols.modelId[k] = source.modelId[i] as number;
    cols.makeId[k] = source.makeId[i] as number;
    cols.modelYear[k] = source.modelYear[i] as number;
    cols.powerKw[k] = source.powerKw[i] as number;
    cols.co2EmissionsGPerKmX10[k] = source.co2EmissionsGPerKmX10[i] as number;
    cols.consumptionCombinedL100KmX10[k] = source.consumptionCombinedL100KmX10[i] as number;
    cols.electricRangeKm[k] = source.electricRangeKm[i] as number;
    cols.fuelCategory[k] = source.fuelCategory[i] as number;
    cols.bodyType[k] = source.bodyType[i] as number;
    cols.transmission[k] = source.transmission[i] as number;
    cols.drivetrain[k] = source.drivetrain[i] as number;
    cols.offerType[k] = source.offerType[i] as number;
    cols.usageState[k] = source.usageState[i] as number;
    cols.sellerType[k] = source.sellerType[i] as number;
    cols.regionCode[k] = source.regionCode[i] as number;
    cols.countryCode[k] = source.countryCode[i] as number;
    cols.priceStatus[k] = source.priceStatus[i] as number;
    cols.priceEvaluationCategory[k] = source.priceEvaluationCategory[i] as number;
    cols.adTier[k] = source.adTier[i] as number;
    cols.bodyColor[k] = source.bodyColor[i] as number;
    cols.upholsteryType[k] = source.upholsteryType[i] as number;
    cols.euEmissionStandard[k] = source.euEmissionStandard[i] as number;
    cols.doorCount[k] = source.doorCount[i] as number;
    cols.seatCount[k] = source.seatCount[i] as number;
    cols.previousOwnerCount[k] = source.previousOwnerCount[i] as number;
    cols.imageCount[k] = source.imageCount[i] as number;
    cols.booleanFlags[k] = source.booleanFlags[i] as number;
    cols.ingestFlags[k] = source.ingestFlags[i] as number;
    const strings: string[] = new Array(STRING_FIELDS);
    for (let f = 0; f < STRING_FIELDS; f += 1) {
      const start = source.stringOffsets[i * STRING_FIELDS + f] as number;
      const end = source.stringOffsets[i * STRING_FIELDS + f + 1] as number;
      strings[f] = decoder.decode(source.stringBlob.subarray(start, end));
    }
    perRowStrings[k] = strings;
  }
  const { stringBlob, stringOffsets } = buildStringZone(perRowStrings);
  return { snapshotId, localDatasetKey, rowCount: n, ...cols, stringBlob, stringOffsets };
}

/** Somme des octets détenus par un lot colonnaire (empreinte mémoire, EX-NFR-1). */
export function batchByteLength(batch: ListingColumnBatch): number {
  let total = 0;
  for (const value of Object.values(batch)) {
    if (ArrayBuffer.isView(value)) total += value.byteLength;
  }
  return total;
}
