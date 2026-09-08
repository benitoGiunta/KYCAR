/**
 * KYCAR — Lecture d'une ligne d'annonce depuis le batch colonnaire (lot D7, EX-SCR-203, EX-DATA-98)
 * =================================================================================================
 * Extrait, pour une ligne du `ListingColumnBatch`, les champs affichés par l'écran D et exportés en
 * CSV (EX-DATA-123bis). Les sentinelles typées (`-1`, `255`, EX-DATA-120) sont converties en `null`
 * (`INCONNU`) : jamais `0`, jamais `null` brut confondu avec une valeur. La zone de chaînes
 * (`stringBlob`/`stringOffsets`) porte `listingUrl` et les versions — JAMAIS un champ vendeur R3
 * (garanti par construction du batch, EX-NFR-26).
 *
 * Module PUR : testable sans DOM.
 */

import type { ListingColumnBatch } from '../../types/index';
import { NUMERIC_UNKNOWN, ENUM_UNKNOWN_BYTE, STRINGS_PER_ROW, hasIngestFlag } from '../../types/index';
import { decodeListingId } from '../../engine/uuid';
import { isYearValid, yearFromYearMonth } from '../../engine/flags';
import type { OutlierEntry, OutlierIndex } from '../outlier-index';

/** Ordre des champs textuels dans `stringOffsets` (DataProvider.ts). */
export const STRING_FIELD = {
  listingUrl: 0,
  modelVersionRaw: 1,
  modelVersionClean: 2,
  fuelSourceLabelRaw: 3,
  trimTokens: 4,
} as const;

const decoder = new TextDecoder();

/** Lit le `field`-ième champ textuel de la ligne `row` (chaîne vide si absent). */
export function readListingString(batch: ListingColumnBatch, row: number, field: number): string {
  const base = row * STRINGS_PER_ROW + field;
  const start = batch.stringOffsets[base] as number;
  const end = batch.stringOffsets[base + 1] as number;
  if (end <= start) return '';
  return decoder.decode(batch.stringBlob.subarray(start, end));
}

/** Convertit une valeur numérique en `null` si sentinelle d'inconnu. */
function num(value: number): number | null {
  return value === NUMERIC_UNKNOWN ? null : value;
}

/** Convertit un octet énuméré en `null` si sentinelle d'inconnu. */
function enumByte(value: number): number | null {
  return value === ENUM_UNKNOWN_BYTE ? null : value;
}

/** Une ligne d'annonce prête pour la table (EX-SCR-203) et l'export (EX-DATA-123bis). */
export interface ListingRow {
  readonly row: number;
  readonly listingId: string;
  readonly url: string;
  readonly modelVersion: string;
  readonly priceEur: number | null;
  readonly mileageKm: number | null;
  /** `firstRegistrationYearMonth` brut, ou `null`. */
  readonly regYearMonth: number | null;
  /** Année civile de 1ʳᵉ immat., ou `null`. */
  readonly regYear: number | null;
  readonly modelYear: number | null;
  readonly powerKw: number | null;
  readonly fuelCategory: number | null;
  readonly co2X10: number | null;
  readonly consumptionX10: number | null;
  readonly previousOwnerCount: number | null;
  readonly priceEvaluationCategory: number | null;
  readonly sellerType: number | null;
  readonly countryCode: number | null;
  readonly regionCode: number | null;
  readonly usageState: number | null;
  /** Écart au prix attendu `δ = p/p̂ − 1` en %, ou `null` (colonne écart, EX-SCR-203). */
  readonly deviationPct: number | null;
  readonly expectedPriceEur: number | null;
  readonly opportunityScore: number | null;
  readonly outlierFlags: readonly string[];
  readonly cellLabel: string | null;
  readonly cellCount: number;
  readonly outlierMethod: 'M1' | 'M2' | null;
  /** `EX-DATA-15`/`EX-SCR-203` (DR-150) : deux versions de cette annonce reçues avec des valeurs
   * différentes dans ce snapshot (`ARB-54`/D-04 → fix-providers pose ce drapeau à l'ingestion). */
  readonly duplicateValueConflict: boolean;
}

/** Construit une `ListingRow` pour la ligne `row`. */
export function buildListingRow(
  batch: ListingColumnBatch,
  row: number,
  outliers: OutlierIndex,
): ListingRow {
  const listingId = decodeListingId(batch.listingId, row);
  const entry: OutlierEntry | undefined = outliers.get(listingId);
  const ym = batch.firstRegistrationYearMonth[row] as number;
  const versionClean = readListingString(batch, row, STRING_FIELD.modelVersionClean);
  const version = versionClean || readListingString(batch, row, STRING_FIELD.modelVersionRaw);
  return {
    row,
    listingId,
    url: readListingString(batch, row, STRING_FIELD.listingUrl),
    modelVersion: version,
    priceEur: num(batch.priceEur[row] as number),
    mileageKm: num(batch.mileageKm[row] as number),
    regYearMonth: num(ym),
    regYear: isYearValid(ym) ? yearFromYearMonth(ym) : null,
    modelYear: num(batch.modelYear[row] as number),
    powerKw: num(batch.powerKw[row] as number),
    fuelCategory: enumByte(batch.fuelCategory[row] as number),
    co2X10: num(batch.co2EmissionsGPerKmX10[row] as number),
    consumptionX10: num(batch.consumptionCombinedL100KmX10[row] as number),
    previousOwnerCount: enumByte(batch.previousOwnerCount[row] as number),
    priceEvaluationCategory: enumByte(batch.priceEvaluationCategory[row] as number),
    sellerType: enumByte(batch.sellerType[row] as number),
    countryCode: enumByte(batch.countryCode[row] as number),
    regionCode: enumByte(batch.regionCode[row] as number),
    usageState: enumByte(batch.usageState[row] as number),
    deviationPct: entry?.deviationPct ?? null,
    expectedPriceEur: entry?.expectedPriceEur ?? null,
    opportunityScore: entry?.opportunityScore ?? null,
    outlierFlags: entry?.flags ?? [],
    cellLabel: entry?.cellLabel ?? null,
    cellCount: entry?.cellCount ?? 0,
    outlierMethod: entry?.method ?? null,
    duplicateValueConflict: hasIngestFlag(batch.ingestFlags[row] as number, 'DUPLICATE_VALUE_CONFLICT'),
  };
}
