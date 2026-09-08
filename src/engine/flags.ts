/**
 * KYCAR — Drapeaux d'ingestion, statut de prix, et validité métrique (lot D4)
 * =================================================================================================
 * Constantes de bits et prédicats de VALIDITÉ (EX-DATA-60) réutilisés par tout le moteur. Les codes
 * sont dérivés des vocabulaires gelés de D2 (`INGEST_FLAG_BIT`, `PRICE_STATUS_VALUES`) : la table
 * `INGEST_FLAG_BIT` est la SEULE source de la correspondance bit ↔ code (DR-013) ; ce module n'y
 * ajoute que les masques dont le moteur se sert.
 *
 * O13 tranché par D-01 : `ingestFlags` est un `Uint32Array` (32 bits), encodage positionnel
 * conservé. Les 17 codes d'EX-DATA-45 y tiennent tous, `MARKETPLACE_UNMAPPED` (bit 16) compris.
 *
 * Module PUR (aucune globale) : importable par le worker comme par le thread principal.
 */

import {
  INGEST_FLAG_BIT,
  INGEST_FLAG_BIT_CAPACITY,
  NUMERIC_UNKNOWN,
  PRICE_STATUS_VALUES,
  type IngestFlagCode,
} from '../types/index';

/** Masque d'un drapeau d'ingestion, lu dans l'unique table bit ↔ code de D2 (DR-013). */
function ingestBit(code: IngestFlagCode): number {
  const bit = INGEST_FLAG_BIT[code];
  if (bit === undefined) throw new Error(`flags: drapeau d'ingestion inconnu ${code}`);
  if (bit >= INGEST_FLAG_BIT_CAPACITY) {
    throw new Error(`flags: ${code} au bit ${bit} déborde de la colonne ingestFlags (D-01)`);
  }
  return (1 << bit) >>> 0;
}

/** Octet énuméré d'un statut de prix = son index dans `PRICE_STATUS_VALUES`. */
function priceStatusByte(code: string): number {
  const index = PRICE_STATUS_VALUES.findIndex((v) => v.code === code);
  if (index < 0) throw new Error(`flags: statut de prix inconnu ${code}`);
  return index;
}

/* ---- Bits d'ingestion utiles au moteur (EX-DATA-60) ------------------------------------------- */
export const FLAG_PRICE_SENTINEL_ABSOLUTE = ingestBit('PRICE_SENTINEL_ABSOLUTE');
export const FLAG_PRICE_OUT_OF_RANGE = ingestBit('PRICE_OUT_OF_RANGE');
export const FLAG_SUSPECT_ZERO_MILEAGE = ingestBit('SUSPECT_ZERO_MILEAGE');
export const FLAG_MILEAGE_OUT_OF_RANGE = ingestBit('MILEAGE_OUT_OF_RANGE');

/** Masque des drapeaux excluant le prix d'un échantillon valide (EX-DATA-60). */
export const PRICE_INVALID_MASK = FLAG_PRICE_SENTINEL_ABSOLUTE | FLAG_PRICE_OUT_OF_RANGE;
/** Masque des drapeaux excluant le kilométrage d'un échantillon valide (EX-DATA-60). */
export const MILEAGE_INVALID_MASK = FLAG_SUSPECT_ZERO_MILEAGE | FLAG_MILEAGE_OUT_OF_RANGE;

/* ---- Octets de statut de prix (ordre PRICE_STATUS_VALUES) ------------------------------------- */
export const PRICE_STATUS_QUOTED = priceStatusByte('QUOTED');
export const PRICE_STATUS_ON_REQUEST = priceStatusByte('ON_REQUEST');
export const PRICE_STATUS_MISSING = priceStatusByte('MISSING');

/**
 * Vrai si le PRIX de la ligne appartient à l'échantillon valide (EX-DATA-60) : statut QUOTED, valeur
 * connue, et aucun drapeau d'invalidité de prix. (`PRICE_IMPLAUSIBLE_IN_CELL` est un contrôle
 * relatif à une cellule, traité par le détecteur d'outliers, pas ici.)
 */
export function isPriceValid(price: number, priceStatus: number, ingestFlags: number): boolean {
  return (
    priceStatus === PRICE_STATUS_QUOTED &&
    price !== NUMERIC_UNKNOWN &&
    (ingestFlags & PRICE_INVALID_MASK) === 0
  );
}

/* ---- Sentinelle RELATIVE à la cellule (EX-DATA-19(2), ARB-13, R-A06) -------------------------- */

/**
 * `PRICE_IMPLAUSIBLE_IN_CELL` : `prix < 0,10 × médianeRéf(C)`. Verdict d'ANALYSE, recalculé par
 * cellule et par sélection, JAMAIS stocké dans `ingestFlags` — le vocabulaire gelé ne le porte pas.
 */
export const IMPLAUSIBLE_IN_CELL_RATIO = 0.1;

/** La règle relative ne s'applique pas sous 12 prix valides dans la cellule (EX-DATA-19(2)). */
export const MIN_IMPLAUSIBLE_IN_CELL = 12;

/**
 * Seuil relatif de la cellule, ou `null` si la règle ne s'y applique pas.
 * `médianeRéf(C)` est la médiane de `V_price(C)`, c'est-à-dire des prix de la cellule DÉJÀ privés
 * des sentinelles ABSOLUES : un seul passage, aucune rétroaction (ARB-13).
 */
export function implausibleInCellThreshold(medianRef: number | null, nPrice: number): number | null {
  if (medianRef === null || nPrice < MIN_IMPLAUSIBLE_IN_CELL) return null;
  return IMPLAUSIBLE_IN_CELL_RATIO * medianRef;
}

/** Vrai si l'ANNÉE (firstRegistrationYearMonth encodé) est connue (EX-DATA-60). */
export function isYearValid(firstRegistrationYearMonth: number): boolean {
  return firstRegistrationYearMonth !== NUMERIC_UNKNOWN;
}

/** Vrai si le KILOMÉTRAGE de la ligne appartient à l'échantillon valide (EX-DATA-60). */
export function isMileageValid(mileage: number, ingestFlags: number): boolean {
  return mileage !== NUMERIC_UNKNOWN && (ingestFlags & MILEAGE_INVALID_MASK) === 0;
}

/** Décode l'année civile depuis `firstRegistrationYearMonth = 12·année + (mois−1)`. */
export function yearFromYearMonth(firstRegistrationYearMonth: number): number {
  return Math.floor(firstRegistrationYearMonth / 12);
}
