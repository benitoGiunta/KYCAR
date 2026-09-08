/**
 * KYCAR — Drapeaux d'ingestion, statut de prix, et validité métrique (lot D4)
 * =================================================================================================
 * Constantes de bits et prédicats de VALIDITÉ (EX-DATA-60) réutilisés par tout le moteur. Les codes
 * sont dérivés des vocabulaires gelés de D2 (`INGEST_FLAG_VALUES`, `PRICE_STATUS_VALUES`) : l'index
 * d'un code dans le tableau EST sa position de bit / son octet énuméré (contrat colonnaire D2).
 *
 * O13 (coordinateur) : `ingestFlags` est un `Uint16Array` (16 bits). Les quatre drapeaux dont le
 * moteur a besoin (indices 4, 7, 8, 9) tiennent tous dans 16 bits ; on n'en pose ni n'en lit aucun
 * au-delà du bit 15.
 *
 * Module PUR (aucune globale) : importable par le worker comme par le thread principal.
 */

import { INGEST_FLAG_VALUES, NUMERIC_UNKNOWN, PRICE_STATUS_VALUES } from '../types/index';

/** Position de bit d'un drapeau d'ingestion = son index dans `INGEST_FLAG_VALUES`. */
function ingestBit(code: string): number {
  const index = INGEST_FLAG_VALUES.findIndex((v) => v.code === code);
  if (index < 0) throw new Error(`flags: drapeau d'ingestion inconnu ${code}`);
  if (index > 15) throw new Error(`flags: ${code} au bit ${index} déborde du Uint16 (O13)`);
  return 1 << index;
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
