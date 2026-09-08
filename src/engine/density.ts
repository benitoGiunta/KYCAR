/**
 * KYCAR — Grille de densité année × kilométrage (lot D4, EX-DATA-99/102, invariant I7)
 * =================================================================================================
 * La grille réutilise EXACTEMENT les bins de `BIN` (EX-DATA-77) pour l'ensemble ÉLIGIBLE (EX-DATA-99 :
 * `priceStatus = QUOTED` et année et kilométrage tous deux valides au sens d'EX-DATA-60). Ainsi la
 * somme des cellules vaut `n_e` et, par colonne d'année, la somme des cellules vaut l'effectif du bin
 * d'année (I7). Cellules d'effectif nul non émises. Bornes : `(24+2)² = 676` cellules (EX-DATA-102).
 *
 * L'entité gelée `DensityCell` ne porte que `count` ; les statistiques de prix par cellule
 * (`medianPrice`, `p05/p95`) d'EX-DATA-102 sont un enrichissement de rendu, hors de l'entité D2 —
 * non produites ici (dette documentée dans le rapport de lot).
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { DensityCell, ListingColumnBatch } from '../types/index';
import { isMileageValid, isYearValid, PRICE_STATUS_QUOTED, yearFromYearMonth } from './flags';
import { bin, binIndexOf, MILEAGE_BIN_PARAMS, YEAR_BIN_PARAMS } from './bin';

/** Résultat de la grille de densité, avec les éléments nécessaires à I7. */
export interface DensityResult {
  readonly cells: readonly DensityCell[];
  /** Effectif éligible `n_e`. */
  readonly eligibleCount: number;
  /** Effectif par bin d'année (marginal), pour l'invariant I7. */
  readonly yearBucketCountByIndex: ReadonlyMap<number, number>;
}

/** Construit la grille de densité de la sélection déjà balayée. */
export function densityGrid(
  batch: ListingColumnBatch,
  rows: Int32Array,
  snapshotId: string,
  selectionHash: string,
): DensityResult {
  const n = rows.length;
  const eligRows: number[] = [];
  const eligYear: number[] = [];
  const eligMileage: number[] = [];

  for (let i = 0; i < n; i++) {
    const row = rows[i] as number;
    if ((batch.priceStatus[row] as number) !== PRICE_STATUS_QUOTED) continue;
    const ym = batch.firstRegistrationYearMonth[row] as number;
    if (!isYearValid(ym)) continue;
    const mileage = batch.mileageKm[row] as number;
    const ingest = batch.ingestFlags[row] as number;
    if (!isMileageValid(mileage, ingest)) continue;
    eligRows.push(row);
    eligYear.push(yearFromYearMonth(ym));
    eligMileage.push(mileage);
  }

  const eligibleCount = eligRows.length;
  if (eligibleCount === 0) {
    return { cells: [], eligibleCount: 0, yearBucketCountByIndex: new Map() };
  }

  const yearBin = bin(eligYear, YEAR_BIN_PARAMS);
  const mileageBin = bin(eligMileage, MILEAGE_BIN_PARAMS);

  const cellCounts = new Map<string, { yi: number; mi: number; count: number }>();
  const yearMarginal = new Map<number, number>();

  for (let i = 0; i < eligibleCount; i++) {
    const yi = binIndexOf(eligYear[i] as number, yearBin);
    const mi = binIndexOf(eligMileage[i] as number, mileageBin);
    const key = `${yi},${mi}`;
    let cell = cellCounts.get(key);
    if (cell === undefined) {
      cell = { yi, mi, count: 0 };
      cellCounts.set(key, cell);
    }
    cell.count++;
    yearMarginal.set(yi, (yearMarginal.get(yi) ?? 0) + 1);
  }

  const cells: DensityCell[] = [];
  for (const { yi, mi, count } of cellCounts.values()) {
    cells.push({ snapshotId, selectionHash, yearBinIndex: yi, mileageBinIndex: mi, count });
  }
  // Tri lexicographique (yearBinIndex, mileageBinIndex) — EX-DATA-117.
  cells.sort((a, b) =>
    a.yearBinIndex !== b.yearBinIndex ? a.yearBinIndex - b.yearBinIndex : a.mileageBinIndex - b.mileageBinIndex,
  );

  return { cells, eligibleCount, yearBucketCountByIndex: yearMarginal };
}
