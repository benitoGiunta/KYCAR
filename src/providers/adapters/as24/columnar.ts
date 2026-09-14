/**
 * KYCAR — Assemblage colonnaire des lignes adaptées (`as24 → canonique`)
 * =================================================================================================
 * Écrit des `CanonicalRow` dans les colonnes typées de `ListingColumnBatch` (`EX-DATA-119`). Il ne
 * DÉCIDE rien : l'adaptateur a déjà encodé chaque valeur, sentinelles comprises. Séparer les deux
 * étages est ce qui rend la table §3.1 testable ligne à ligne sans construire un lot.
 *
 * Les primitives d'allocation, de zone de chaînes et de sous-ensemble sont celles du lot D3
 * (`src/providers/synthetic/columnar.ts`) : `allocColumns`, `finalizeBatch`, `subsetBatch`,
 * `batchByteLength`. Les RÉÉCRIRE aurait produit un deuxième encodage de la même interface gelée —
 * exactement la duplication que la revue 2.5 a sanctionnée ailleurs.
 *
 * GARANTIE R3 : `dealerBucket` (D3-02) est porté par `CanonicalRow` pour le dédoublonnage et
 * ABANDONNÉ ici — le lot n'a, par construction, aucune colonne où il pourrait atterrir (écart E-02).
 */

import type { ListingColumnBatch } from '../../DataProvider';
import { STRINGS_PER_ROW } from '../../DataProvider';
import { allocColumns, finalizeBatch, type MutableColumns } from '../../synthetic/columnar';
import type { CanonicalRow } from './adapt';

/** Écrit la ligne `row` à l'indice `i` des colonnes déjà allouées. */
export function writeCanonicalRow(cols: MutableColumns, i: number, row: CanonicalRow, listingIdBytes: Uint8Array): void {
  cols.listingId.set(listingIdBytes, i * 16);
  cols.priceEur[i] = row.priceEur;
  cols.mileageKm[i] = row.mileageKm;
  cols.firstRegistrationYearMonth[i] = row.firstRegistrationYearMonth;
  cols.modelId[i] = row.modelId;
  cols.makeId[i] = row.makeId;
  cols.modelYear[i] = row.modelYear;
  cols.powerKw[i] = row.powerKw;
  cols.co2EmissionsGPerKmX10[i] = row.co2EmissionsGPerKmX10;
  cols.consumptionCombinedL100KmX10[i] = row.consumptionCombinedL100KmX10;
  cols.electricRangeKm[i] = row.electricRangeKm;
  cols.fuelCategory[i] = row.fuelCategory;
  cols.bodyType[i] = row.bodyType;
  cols.transmission[i] = row.transmission;
  cols.drivetrain[i] = row.drivetrain;
  cols.offerType[i] = row.offerType;
  cols.usageState[i] = row.usageState;
  cols.sellerType[i] = row.sellerType;
  cols.regionCode[i] = row.regionCode;
  cols.countryCode[i] = row.countryCode;
  cols.priceStatus[i] = row.priceStatus;
  cols.priceEvaluationCategory[i] = row.priceEvaluationCategory;
  cols.adTier[i] = row.adTier;
  cols.bodyColor[i] = row.bodyColor;
  cols.upholsteryType[i] = row.upholsteryType;
  cols.euEmissionStandard[i] = row.euEmissionStandard;
  cols.doorCount[i] = row.doorCount;
  cols.seatCount[i] = row.seatCount;
  cols.previousOwnerCount[i] = row.previousOwnerCount;
  cols.imageCount[i] = row.imageCount;
  cols.vatDeductible[i] = row.vatDeductible;
  cols.booleanFlags[i] = row.booleanFlags;
  cols.ingestFlags[i] = row.ingestFlags;
}

/** Ce que l'assembleur rend en plus du lot : ce qu'il a fallu jeter, et pourquoi. */
export interface AssembledBatch {
  readonly batch: ListingColumnBatch;
  /** Colonnes mutables, conservées pour l'audit de doublons (qui pose `DUPLICATE_VALUE_CONFLICT`). */
  readonly columns: MutableColumns;
}

/**
 * Assemble un lot colonnaire complet à partir de lignes déjà adaptées.
 *
 * Les cinq champs textuels sont écrits dans l'ordre GELÉ de `stringOffsets`
 * (`[listingUrl, modelVersionRaw, modelVersionClean, fuelSourceLabelRaw, trimTokens]`) ;
 * `trimTokens` est sérialisé en jetons séparés par une espace — les jetons sont en majuscules et
 * issus d'une découpe SUR l'espace (`EX-DATA-29` étape 7), donc aucun n'en contient : la
 * sérialisation est réversible par un simple `split(' ')`. Le provider synthétique laisse ce
 * cinquième champ VIDE ; le lot fixture le remplit.
 */
export function assembleBatch(
  rows: readonly CanonicalRow[],
  listingIdBytes: Uint8Array,
  snapshotId: string,
  localDatasetKey: string,
): AssembledBatch {
  const rowCount = rows.length;
  const cols = allocColumns(rowCount);
  const perRowStrings: string[][] = new Array(rowCount);
  for (let i = 0; i < rowCount; i += 1) {
    const row = rows[i] as CanonicalRow;
    writeCanonicalRow(cols, i, row, listingIdBytes.subarray(i * 16, i * 16 + 16));
    const strings = new Array<string>(STRINGS_PER_ROW);
    for (let f = 0; f < STRINGS_PER_ROW; f += 1) strings[f] = row.strings[f] ?? '';
    perRowStrings[i] = strings;
  }
  const batch = finalizeBatch(cols, rowCount, perRowStrings, snapshotId, localDatasetKey);
  return { batch, columns: cols };
}
