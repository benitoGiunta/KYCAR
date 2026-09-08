/**
 * KYCAR — Grille de densité année × kilométrage (lot D4, EX-DATA-99/102, invariant I7)
 * =================================================================================================
 * La grille réutilise EXACTEMENT les bins de `BIN` (EX-DATA-77) pour l'ensemble ÉLIGIBLE. L'éligibilité
 * est celle d'EX-DATA-99 lue par **D-05** : le prix doit être VALIDE — `priceStatus = QUOTED`, valeur
 * connue, aucune sentinelle ABSOLUE (EX-DATA-60) et aucune sentinelle RELATIVE à la cellule
 * (`PRICE_IMPLAUSIBLE_IN_CELL`, EX-DATA-19(2)) — et l'année et le kilométrage doivent être valides.
 * C'est la même règle que celle du nuage de D7 (`suspectValue`), pour que `eligibleCount` publié soit
 * exactement l'effectif tracé. Ainsi la somme des cellules vaut `n_e` et, par colonne d'année, la
 * somme des cellules vaut l'effectif du bin d'année (I7). Cellules d'effectif nul non émises.
 * Bornes : `(24+2)² = 676` cellules (EX-DATA-102).
 *
 * Les non éligibles sont comptées et leur motif VENTILÉ (`noPrice`, `noYear`, `noMileage`,
 * `suspectValue`) : une annonce cumulant plusieurs motifs est comptée dans le premier applicable, de
 * sorte que la somme des quatre compteurs et de `n_e` vaut exactement `N` (EX-DATA-99).
 *
 * L'entité gelée `DensityCell` ne porte que `count` ; les statistiques de prix par cellule
 * (`medianPrice`, `p05/p95`) d'EX-DATA-102 sont un enrichissement de rendu, hors de l'entité D2 —
 * non produites ici (dette documentée dans le rapport de lot).
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { DensityCell, ListingColumnBatch } from '../types/index';
import { isMileageValid, isPriceValid, isYearValid, PRICE_STATUS_QUOTED, yearFromYearMonth } from './flags';
import { bin, binIndexOf, MILEAGE_BIN_PARAMS, YEAR_BIN_PARAMS } from './bin';
import { selectionImplausibleThreshold } from './implausible';

/**
 * Ventilation des motifs de NON-éligibilité (EX-DATA-99). `n_e + noPrice + noYear + noMileage +
 * suspectValue = N` par construction.
 */
export interface IneligibleBreakdown {
  /** Prix non affiché : `priceStatus ≠ QUOTED`. */
  readonly noPrice: number;
  readonly noYear: number;
  readonly noMileage: number;
  /** Prix affiché mais écarté de `V_price` : sentinelle absolue, hors domaine, ou implausible en cellule. */
  readonly suspectValue: number;
}

/** Résultat de la grille de densité, avec les éléments nécessaires à I7. */
export interface DensityResult {
  readonly cells: readonly DensityCell[];
  /** Effectif éligible `n_e`. */
  readonly eligibleCount: number;
  /**
   * Les lignes ÉLIGIBLES elles-mêmes, dans l'ordre de balayage (D8-07). Publiées pour que
   * l'échantillonnage du nuage G4 (`EX-DATA-101`) travaille sur le MÊME ensemble `Elig` que la
   * grille de densité, sans refaire une passe d'éligibilité qui pourrait en diverger.
   */
  readonly eligibleRows: Int32Array;
  /** Motifs de non-éligibilité ventilés (EX-DATA-99). */
  readonly ineligible: IneligibleBreakdown;
  /** Effectif par bin d'année (marginal), pour l'invariant I7. */
  readonly yearBucketCountByIndex: ReadonlyMap<number, number>;
}

/**
 * Construit la grille de densité de la sélection déjà balayée.
 *
 * @param threshold seuil relatif de la cellule `C₃ = Σ` (`0,10 × médianeRéf`, EX-DATA-19(2)), ou
 *   `null` quand la règle ne s'applique pas (`n_price(Σ) < 12`). OMIS, il est calculé ici : le noyau
 *   le fournit parce qu'il le tient déjà de `detectOutliers`, mais un appel direct rend exactement
 *   les mêmes chiffres — c'est ce qu'exige l'équivalence d'EX-DATA-116.
 */
export function densityGrid(
  batch: ListingColumnBatch,
  rows: Int32Array,
  snapshotId: string,
  selectionHash: string,
  threshold?: number | null,
): DensityResult {
  const n = rows.length;
  const implausibleThreshold =
    threshold === undefined ? selectionImplausibleThreshold(batch, rows) : threshold;
  const eligRows: number[] = [];
  const eligYear: number[] = [];
  const eligMileage: number[] = [];
  let noPrice = 0;
  let noYear = 0;
  let noMileage = 0;
  let suspectValue = 0;

  for (let i = 0; i < n; i++) {
    const row = rows[i] as number;
    const status = batch.priceStatus[row] as number;
    const price = batch.priceEur[row] as number;
    const ingest = batch.ingestFlags[row] as number;
    if (status !== PRICE_STATUS_QUOTED) {
      noPrice++;
      continue;
    }
    // D-05 : « prix valide » = QUOTED ∧ valeur connue ∧ ¬sentinelle absolue ∧ ¬implausible en cellule.
    if (
      !isPriceValid(price, status, ingest) ||
      (implausibleThreshold !== null && price < implausibleThreshold)
    ) {
      suspectValue++;
      continue;
    }
    const ym = batch.firstRegistrationYearMonth[row] as number;
    if (!isYearValid(ym)) {
      noYear++;
      continue;
    }
    const mileage = batch.mileageKm[row] as number;
    if (!isMileageValid(mileage, ingest)) {
      noMileage++;
      continue;
    }
    eligRows.push(row);
    eligYear.push(yearFromYearMonth(ym));
    eligMileage.push(mileage);
  }

  const ineligible: IneligibleBreakdown = { noPrice, noYear, noMileage, suspectValue };
  const eligibleCount = eligRows.length;
  if (eligibleCount === 0) {
    return {
      cells: [],
      eligibleCount: 0,
      eligibleRows: new Int32Array(0),
      ineligible,
      yearBucketCountByIndex: new Map(),
    };
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

  return {
    cells,
    eligibleCount,
    eligibleRows: Int32Array.from(eligRows),
    ineligible,
    yearBucketCountByIndex: yearMarginal,
  };
}
