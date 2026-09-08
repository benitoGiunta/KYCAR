/**
 * KYCAR — Tri et pagination de l'écran D (lot D7, EX-SCR-203/206/208)
 * =================================================================================================
 * Tri (EX-SCR-206) : défaut `opportunityScore` DÉCROISSANT, départage `priceEur` croissant puis
 * `listingId` croissant (les meilleures affaires en tête). Quand tous les `opportunityScore` sont
 * `null`, bascule sur `priceEur` croissant puis `listingId`. Les valeurs absentes sont TOUJOURS
 * placées en fin, quel que soit le sens (jamais traitées comme des zéros). Tri mono-colonne.
 *
 * PAGINATION : décision coordinateur du lot D7 — pagination client de 50 lignes. DIVERGENCE SIGNALÉE
 * (non corrigée) : EX-SCR-208 demande un rendu VIRTUALISÉ sans pagination numérotée (≤ 60 lignes
 * montées) ; la consigne du lot impose une pagination de 50. On implémente la pagination 50 (mandat
 * de lot) et on signale l'écart au rapport pour arbitrage — les deux visent le même but (ne pas
 * monter des milliers de lignes) et la bascule vers la virtualisation est un changement local de vue.
 *
 * Module PUR : testable sans DOM.
 */

import { compareListingId } from '../../engine/uuid';
import type { ListingColumnBatch } from '../../types/index';
import type { ListingRow } from './listing-fields';

/** Colonnes triables (EX-SCR-203). */
export type SortColumn =
  | 'price'
  | 'deviation'
  | 'mileage'
  | 'firstReg'
  | 'modelYear'
  | 'power'
  | 'fuel'
  | 'consumption'
  | 'co2'
  | 'owners'
  | 'evaluation'
  | 'seller'
  | 'country'
  | 'opportunity';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  readonly column: SortColumn;
  readonly direction: SortDirection;
}

/** Taille de page fixe (mandat de lot D7 ; cf. divergence EX-SCR-208 en tête de fichier). */
export const PAGE_SIZE = 50;

/** Valeur numérique triable d'une ligne pour une colonne (ou `null` = absent → fin de tri). */
function sortValue(rowData: ListingRow, column: SortColumn): number | null {
  switch (column) {
    case 'price':
      return rowData.priceEur;
    case 'deviation':
      return rowData.deviationPct;
    case 'mileage':
      return rowData.mileageKm;
    case 'firstReg':
      return rowData.regYearMonth;
    case 'modelYear':
      return rowData.modelYear;
    case 'power':
      return rowData.powerKw;
    case 'fuel':
      return rowData.fuelCategory;
    case 'consumption':
      return rowData.consumptionX10;
    case 'co2':
      return rowData.co2X10;
    case 'owners':
      return rowData.previousOwnerCount;
    case 'evaluation':
      return rowData.priceEvaluationCategory;
    case 'seller':
      return rowData.sellerType;
    case 'country':
      return rowData.countryCode;
    case 'opportunity':
      return rowData.opportunityScore;
    default:
      return null;
  }
}

/** Vrai si aucune ligne ne porte de `opportunityScore` (bascule du tri par défaut, EX-SCR-206). */
export function allOpportunityNull(rows: readonly ListingRow[]): boolean {
  return rows.every((r) => r.opportunityScore == null);
}

/**
 * Tri de l'écran D. `sort === undefined` applique le tri par défaut d'EX-SCR-206. Départage constant :
 * `priceEur` croissant puis `listingId` croissant (via `batch` pour l'ordre octet à octet).
 * Ne mute pas l'entrée.
 */
export function sortListings(
  rows: readonly ListingRow[],
  batch: ListingColumnBatch,
  sort?: SortState,
): ListingRow[] {
  const tieBreak = (a: ListingRow, b: ListingRow): number => {
    const pa = a.priceEur;
    const pb = b.priceEur;
    if (pa != null && pb != null && pa !== pb) return pa - pb;
    if (pa == null && pb != null) return 1;
    if (pa != null && pb == null) return -1;
    return compareListingId(batch.listingId, a.row, b.row);
  };

  const effective: SortState =
    sort ??
    (allOpportunityNull(rows)
      ? { column: 'price', direction: 'asc' }
      : { column: 'opportunity', direction: 'desc' });

  const dir = effective.direction === 'asc' ? 1 : -1;
  const out = [...rows];
  out.sort((a, b) => {
    const va = sortValue(a, effective.column);
    const vb = sortValue(b, effective.column);
    // Valeurs absentes toujours en fin, quel que soit le sens (EX-SCR-206).
    if (va == null && vb == null) return tieBreak(a, b);
    if (va == null) return 1;
    if (vb == null) return -1;
    if (va !== vb) return (va - vb) * dir;
    return tieBreak(a, b);
  });
  return out;
}

/** Une page de la liste. */
export interface ListingsPage {
  readonly rows: readonly ListingRow[];
  readonly pageIndex: number;
  readonly pageCount: number;
  readonly pageSize: number;
  readonly totalRows: number;
  readonly fromIndex: number;
  readonly toIndex: number;
}

/** Découpe `rows` (déjà triées) en page de 50 (client). `pageIndex` écrêté aux bornes. */
export function paginate(rows: readonly ListingRow[], pageIndex: number, pageSize = PAGE_SIZE): ListingsPage {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.max(0, Math.min(pageIndex, pageCount - 1));
  const fromIndex = clamped * pageSize;
  const toIndex = Math.min(total, fromIndex + pageSize);
  return {
    rows: rows.slice(fromIndex, toIndex),
    pageIndex: clamped,
    pageCount,
    pageSize,
    totalRows: total,
    fromIndex,
    toIndex,
  };
}
