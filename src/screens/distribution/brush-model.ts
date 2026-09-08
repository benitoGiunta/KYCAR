/**
 * KYCAR — Brossage rectangulaire et liaison croisée (lot D7, EX-SCR-158/184/185/202, EX-NAV-10bis)
 * =================================================================================================
 * Le brossage de G4 (ou G7/G10) sélectionne un sous-ensemble d'annonces. La sélection N'EST PAS UN
 * FILTRE (EX-SCR-184) : c'est une restriction d'affichage encodée dans l'URL par les bornes d'axe
 * `selx`/`sely` (EX-NAV-10bis), qui met en surbrillance les mêmes annonces dans les autres graphes.
 *
 * Ce module est PUR : il convertit un rectangle (en bornes de données) en ensemble de lignes
 * sélectionnées, et fournit le comptage par bucket pour la surimpression des histogrammes.
 */

import type { BrushRange } from './url-state';
import type { ScatterPoint } from './scatter-model';

/** Accès aux coordonnées d'axe d'un point selon la variante (G4a : prix×rang ; G4b : an×prix). */
export interface BrushAccessor {
  readonly x: (p: ScatterPoint) => number;
  readonly y: (p: ScatterPoint) => number;
}

/** Accès G4b : X = date de 1ʳᵉ immat., Y = prix. */
export const BRUSH_ACCESSOR_SCATTER: BrushAccessor = {
  x: (p) => p.regYearMonth,
  y: (p) => p.priceEur,
};

/** Accès G4a : X = prix. `EX-SCR-151` : l'axe Y de G4a encode le RANG D'EMPILEMENT dans le bucket de
 * prix (bornes `{0, maxStack}`), une information qui dépend de l'ensemble des points (`stackRankByRow`
 * dans `ScatterCloud.tsx`) et n'est donc PAS portée par un `ScatterPoint` isolé. `DR-075` : lire
 * `priceEur` sur Y (comme avant) comparait un rang (~0-30) à un prix (des milliers d'euros) et
 * éliminait systématiquement tous les points dès qu'un brossage touchait tout l'axe Y. Le brossage de
 * G4a ne contraint donc QUE l'axe des prix — Y ne filtre jamais (retourne une constante toujours dans
 * l'intervalle `[0, maxStack]`, `maxStack ≥ 1`). */
export const BRUSH_ACCESSOR_STACK: BrushAccessor = {
  x: (p) => p.priceEur,
  y: () => 0,
};

/**
 * Calcule l'ensemble des lignes dont les coordonnées tombent dans le rectangle de brossage. Un axe
 * `null` n'est pas contraint (brossage 1D). Retourne un `Set<row>`.
 */
export function computeBrushSelection(
  points: readonly ScatterPoint[],
  brushX: BrushRange | null,
  brushY: BrushRange | null,
  accessor: BrushAccessor,
): Set<number> {
  const selected = new Set<number>();
  if (brushX === null && brushY === null) return selected;
  for (const p of points) {
    if (brushX !== null) {
      const x = accessor.x(p);
      if (x < brushX.from || x > brushX.to) continue;
    }
    if (brushY !== null) {
      const y = accessor.y(p);
      if (y < brushY.from || y > brushY.to) continue;
    }
    selected.add(p.row);
  }
  return selected;
}

/**
 * Convertit la sélection brossée en filtres d'intervalle englobants (EX-SCR-184 : « Convertir la
 * sélection en filtre »). Retourne les bornes prix / année / km min-max des lignes sélectionnées, à
 * poser comme `pricefrom/to`, `fregfrom/to`, `kmfrom/to`. `null` si aucune ligne sélectionnée.
 */
export interface IntervalFilters {
  readonly priceFrom: number;
  readonly priceTo: number;
  readonly yearFrom: number;
  readonly yearTo: number;
  readonly mileageFrom: number;
  readonly mileageTo: number;
}

export function brushToIntervalFilters(
  points: readonly ScatterPoint[],
  selectedRows: ReadonlySet<number>,
): IntervalFilters | null {
  let pMin = Infinity;
  let pMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  let kMin = Infinity;
  let kMax = -Infinity;
  let any = false;
  for (const p of points) {
    if (!selectedRows.has(p.row)) continue;
    any = true;
    if (p.priceEur < pMin) pMin = p.priceEur;
    if (p.priceEur > pMax) pMax = p.priceEur;
    if (p.year >= 0) {
      if (p.year < yMin) yMin = p.year;
      if (p.year > yMax) yMax = p.year;
    }
    if (p.mileageKm < kMin) kMin = p.mileageKm;
    if (p.mileageKm > kMax) kMax = p.mileageKm;
  }
  if (!any) return null;
  return {
    priceFrom: pMin,
    priceTo: pMax,
    yearFrom: Number.isFinite(yMin) ? yMin : 0,
    yearTo: Number.isFinite(yMax) ? yMax : 0,
    mileageFrom: kMin,
    mileageTo: kMax,
  };
}
