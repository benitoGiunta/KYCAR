/**
 * KYCAR — Fabrique de `ListingColumnBatch` CONTRÔLÉ ligne à ligne (utilitaire de TEST, lot D4)
 * =================================================================================================
 * Les tests des statistiques D8-07 (`GROUPSTAT`, `NTILE`, paliers, indice de dépréciation,
 * statistiques de cellule, échantillon du nuage) valent par des valeurs CONNUES À LA MAIN : il leur
 * faut un lot colonnaire dont chaque ligne est posée explicitement, et non un jeu synthétique dont
 * la loi de génération devrait être ré-implémentée dans l'oracle.
 *
 * Ce module est importé UNIQUEMENT par des fichiers `*.test.ts` (aucun chemin de production ne le
 * référence, il ne pèse donc pas sur le bundle d'`EX-NFR-10`). Il vit dans `src/engine/` parce que
 * `tsconfig.json` n'inclut que `src` : un test de `src/` ne peut pas importer `tests/review/D4/helpers.ts`.
 */

import type { ListingColumnBatch } from '../types/index';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN } from '../types/index';
import { PRICE_STATUS_MISSING, PRICE_STATUS_ON_REQUEST, PRICE_STATUS_QUOTED } from './flags';

/** Spécification d'une ligne. Tout champ omis reçoit une valeur neutre CONNUE. */
export interface FixtureRow {
  readonly makeId?: number;
  readonly modelId?: number;
  /** Prix en euros ; `null` = inconnu (statut `MISSING` par défaut). */
  readonly price?: number | null;
  readonly status?: 'QUOTED' | 'ON_REQUEST' | 'MISSING';
  /** Année civile de première immatriculation ; `null` = inconnue. */
  readonly year?: number | null;
  /** Mois 1..12 (défaut 6). */
  readonly month?: number;
  /** Kilométrage ; `null` = inconnu. */
  readonly mileage?: number | null;
  /** Puissance en kW ; `null` = inconnue. */
  readonly powerKw?: number | null;
  /** Masque `ingestFlags`. */
  readonly flags?: number;
  readonly fuel?: number;
  readonly body?: number;
  readonly transmission?: number;
  readonly sellerType?: number;
  readonly country?: number;
  readonly evalCat?: number;
  /**
   * Octets de tête du `listingId` (ordre total d'`EX-DATA-118`). Par défaut l'indice de ligne, de
   * sorte que l'ordre par `listingId` soit l'ordre d'insertion — un test qui veut éprouver
   * l'invariance à la permutation pose ses propres valeurs.
   */
  readonly idRank?: number;
}

function statusByte(row: FixtureRow): number {
  if (row.status === 'ON_REQUEST') return PRICE_STATUS_ON_REQUEST;
  if (row.status === 'MISSING') return PRICE_STATUS_MISSING;
  if (row.status === 'QUOTED') return PRICE_STATUS_QUOTED;
  return typeof row.price === 'number' ? PRICE_STATUS_QUOTED : PRICE_STATUS_MISSING;
}

/** Construit un lot colonnaire déterministe à partir de spécifications de lignes. */
export function makeFixtureBatch(
  rows: readonly FixtureRow[],
  options: { readonly snapshotId?: string; readonly localDatasetKey?: string } = {},
): ListingColumnBatch {
  const n = rows.length;
  const listingId = new Uint8Array(n * 16);
  const priceEur = new Int32Array(n);
  const mileageKm = new Int32Array(n);
  const firstRegistrationYearMonth = new Int32Array(n);
  const modelId = new Int32Array(n);
  const makeId = new Int32Array(n);
  const modelYear = new Int16Array(n);
  const powerKw = new Int16Array(n);
  const enumCol = (): Uint8Array => new Uint8Array(n).fill(ENUM_UNKNOWN_BYTE);
  const fuelCategory = enumCol();
  const bodyType = enumCol();
  const transmission = enumCol();
  const sellerType = enumCol();
  const countryCode = enumCol();
  const priceEvaluationCategory = enumCol();
  const priceStatus = new Uint8Array(n);
  const ingestFlags = new Uint32Array(n);

  for (let i = 0; i < n; i++) {
    const r = rows[i] as FixtureRow;
    const rank = r.idRank ?? i;
    // Les 4 octets de tête portent le rang : la comparaison octet à octet d'EX-DATA-118 ordonne donc
    // les lignes par `idRank` croissant, ce qui rend les départages de tri lisibles à l'œil nu.
    const base = i * 16;
    listingId[base] = (rank >>> 24) & 0xff;
    listingId[base + 1] = (rank >>> 16) & 0xff;
    listingId[base + 2] = (rank >>> 8) & 0xff;
    listingId[base + 3] = rank & 0xff;
    listingId[base + 6] = 0x40; // version 4
    listingId[base + 8] = 0x80; // variante RFC 4122
    listingId[base + 15] = (i + 1) & 0xff;

    makeId[i] = r.makeId ?? 1;
    modelId[i] = r.modelId ?? 101;
    priceEur[i] = typeof r.price === 'number' ? r.price : NUMERIC_UNKNOWN;
    priceStatus[i] = statusByte(r);
    if (r.year === null || r.year === undefined) {
      firstRegistrationYearMonth[i] = r.year === null ? NUMERIC_UNKNOWN : 12 * 2018 + (6 - 1);
      modelYear[i] = r.year === null ? NUMERIC_UNKNOWN : 2018;
    } else {
      firstRegistrationYearMonth[i] = 12 * r.year + ((r.month ?? 6) - 1);
      modelYear[i] = r.year;
    }
    mileageKm[i] = r.mileage === null ? NUMERIC_UNKNOWN : (r.mileage ?? 80_000);
    powerKw[i] = r.powerKw === null ? NUMERIC_UNKNOWN : (r.powerKw ?? 85);
    ingestFlags[i] = r.flags ?? 0;
    fuelCategory[i] = r.fuel ?? 0;
    bodyType[i] = r.body ?? 0;
    transmission[i] = r.transmission ?? 0;
    sellerType[i] = r.sellerType ?? 1;
    countryCode[i] = r.country ?? 0;
    priceEvaluationCategory[i] = r.evalCat ?? ENUM_UNKNOWN_BYTE;
  }

  return {
    snapshotId: options.snapshotId ?? 'fixture',
    localDatasetKey: options.localDatasetKey ?? 'FULL',
    rowCount: n,
    listingId,
    priceEur,
    mileageKm,
    firstRegistrationYearMonth,
    modelId,
    makeId,
    modelYear,
    powerKw,
    co2EmissionsGPerKmX10: new Int16Array(n).fill(NUMERIC_UNKNOWN),
    consumptionCombinedL100KmX10: new Int16Array(n).fill(NUMERIC_UNKNOWN),
    electricRangeKm: new Int16Array(n).fill(NUMERIC_UNKNOWN),
    fuelCategory,
    bodyType,
    transmission,
    drivetrain: enumCol(),
    offerType: enumCol(),
    usageState: enumCol(),
    sellerType,
    regionCode: enumCol(),
    countryCode,
    priceStatus,
    priceEvaluationCategory,
    adTier: enumCol(),
    bodyColor: enumCol(),
    upholsteryType: enumCol(),
    euEmissionStandard: enumCol(),
    doorCount: enumCol(),
    seatCount: enumCol(),
    previousOwnerCount: enumCol(),
    imageCount: enumCol(),
    // D8-08 : colonne TVA tri-état, `0` = INCONNU (et non la sentinelle 255 des autres octets).
    vatDeductible: new Uint8Array(n),
    booleanFlags: new Uint16Array(n),
    ingestFlags,
    stringBlob: new Uint8Array(0),
    stringOffsets: new Uint32Array(n * 5 + 1),
  };
}

/** Toutes les lignes `[0, n)` d'un lot. */
export function allFixtureRows(batch: ListingColumnBatch): Int32Array {
  return Int32Array.from({ length: batch.rowCount }, (_v, i) => i);
}
