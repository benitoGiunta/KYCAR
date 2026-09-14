/**
 * KYCAR — Sentinelle RELATIVE à la cellule `PRICE_IMPLAUSIBLE_IN_CELL` (lot D4, EX-DATA-19(2), ARB-13)
 * =================================================================================================
 * `EX-DATA-19` pose DEUX règles de prix sentinelle, à deux étages, sans rétroaction :
 *   (1) `PRICE_SENTINEL_ABSOLUTE` — étage INGESTION, `prix < 250 €`, stocké dans `ingestFlags` ;
 *   (2) `PRICE_IMPLAUSIBLE_IN_CELL` — étage ANALYSE, `prix < 0,10 × médianeRéf(C)`, **jamais stocké**,
 *       recalculé par cellule et par sélection.
 *
 * `médianeRéf(C)` est la médiane de `V_price(C)` privé des seules sentinelles ABSOLUES ; la règle
 * relative n'entre jamais dans son calcul. Le calcul est en UN SEUL passage —
 * `filtrer l'absolu → médiane → marquer le relatif` — et aucune itération, aucune recherche de point
 * fixe n'est autorisée (ARB-13, R-A06). La règle ne s'applique pas sous 12 prix valides.
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { ListingColumnBatch } from '../types/index';
import { isPriceValid } from './flags';
import { quantileFromSorted } from './quantiles';

/** Rapport à la médiane de référence sous lequel un prix est implausible dans sa cellule. */
export const IMPLAUSIBLE_IN_CELL_RATIO = 0.1;

/** La règle relative ne s'applique pas sous 12 prix valides dans la cellule (EX-DATA-19(2)). */
export const MIN_IMPLAUSIBLE_IN_CELL = 12;

/**
 * Seuil relatif d'une cellule, ou `null` si la règle ne s'y applique pas.
 * @param medianRef médiane de `V_price(C)` (sentinelles absolues déjà écartées).
 * @param nPrice `n_price(C)` après retrait des sentinelles absolues.
 */
export function implausibleInCellThreshold(medianRef: number | null, nPrice: number): number | null {
  if (medianRef === null || nPrice < MIN_IMPLAUSIBLE_IN_CELL) return null;
  return IMPLAUSIBLE_IN_CELL_RATIO * medianRef;
}

/**
 * Seuil relatif de la cellule `C₃ = Σ` d'une sélection déjà balayée : `0,10 × médianeRéf(Σ)`, ou
 * `null` si `n_price(Σ) < 12`.
 *
 * `detectOutliers` le publie quand la détection tourne (`selectionImplausibleThreshold`) ; cette
 * fonction sert les appelants qui n'en disposent pas — la grille de densité appelée directement, et
 * le noyau quand la garde de budget (DR-032) a omis M1/M2.
 */
export function selectionImplausibleThreshold(batch: ListingColumnBatch, rows: Int32Array): number | null {
  const prices: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as number;
    const price = batch.priceEur[row] as number;
    if (isPriceValid(price, batch.priceStatus[row] as number, batch.ingestFlags[row] as number)) {
      prices.push(price);
    }
  }
  if (prices.length === 0) return null;
  const sorted = Float64Array.from(prices).sort();
  return implausibleInCellThreshold(quantileFromSorted(sorted, 0.5), sorted.length);
}
