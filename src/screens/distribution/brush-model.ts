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

import type { BrushRange, G4Variant, SelAxisRange, SelRestriction } from './url-state';
import type { ScatterPoint } from './scatter-model';
import type { SelectionInput } from '../../types/index';

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

/** Accès dégradé (EX-NFR-19) : X = km, Y = prix, brossage désactivé par le composant mais l'accesseur
 * reste défini pour partager EXACTEMENT le même calcul entre `ScatterCloud` et `DistributionScreen`
 * (DR-080, liaison croisée). */
export const BRUSH_ACCESSOR_DEGRADED: BrushAccessor = {
  x: (p) => p.mileageKm,
  y: (p) => p.priceEur,
};

/** Sélectionne l'accesseur de brossage EXACT qu'utilise `ScatterCloud` pour une variante/mode donnés
 * — factorisé ici pour que `DistributionScreen` (liaison croisée, DR-080) calcule la MÊME sélection
 * que le nuage, sans dupliquer la règle. */
export function brushAccessorFor(variant: G4Variant, degraded: boolean): BrushAccessor {
  if (degraded) return BRUSH_ACCESSOR_DEGRADED;
  return variant === 'stack' ? BRUSH_ACCESSOR_STACK : BRUSH_ACCESSOR_SCATTER;
}

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

/** `EX-SCR-184`/`EX-SCR-158` (DR-079) — traduit le résultat englobant de `brushToIntervalFilters` en
 * identifiants de filtre RÉELS du registre D5 (`priceFrom`/`priceTo`, `dateOfRegistrationFrom/To`,
 * `mileageFrom`/`mileageTo`) : c'est ce `SelectionInput` que « Convertir la sélection en filtre »
 * pose. L'année n'est incluse que si au moins une annonce sélectionnée en porte une (`yearFrom = 0`
 * ET `yearTo = 0` est le repli de `brushToIntervalFilters` en l'absence totale d'année — jamais une
 * vraie année de 1ʳᵉ immatriculation, qui n'est jamais nulle). */
export function intervalFiltersToSelectionInput(f: IntervalFilters): SelectionInput {
  const hasYear = !(f.yearFrom === 0 && f.yearTo === 0);
  return {
    priceFrom: f.priceFrom,
    priceTo: f.priceTo,
    mileageFrom: f.mileageFrom,
    mileageTo: f.mileageTo,
    ...(hasYear ? { dateOfRegistrationFrom: f.yearFrom, dateOfRegistrationTo: f.yearTo } : {}),
  };
}

/**
 * `EX-SCR-158`/`EX-SCR-202` (ACC-06) — traduit la sélection brossée en RESTRICTION D'AFFICHAGE de
 * l'écran D (`sel`), sur les métriques d'annonce du nuage.
 *
 * La recette 2.9b (ACC-06) a montré qu'une restriction de PRIX seule laisse passer, à l'écran D, les
 * annonces qui partagent la bande de prix sans appartenir au rectangle brossé (« 280 lignes » pour
 * 262 annonces sélectionnées). On borne donc AUSSI les autres métriques d'annonce que le nuage
 * connaît : la 1ʳᵉ immatriculation (`regYearMonth`) et le kilométrage.
 *
 * Les bornes rendues sont celles de la BOÎTE ENGLOBANTE des lignes sélectionnées. Elle est donc
 * satisfaite par toutes ces lignes — aucune annonce brossée n'est jamais écartée — et, sur les axes
 * réellement brossés, elle est incluse dans le rectangle : tout point qu'elle contient était brossé.
 * Les métriques hors brossage ferment le dernier écart mesuré au rendu (674 brossées, 684 lignes) :
 * une annonce que le nuage ne trace pas (`EX-DATA-99`) porte la sentinelle `NUMERIC_UNKNOWN` (`-1`)
 * sur la métrique qui l'a fait rejeter, valeur hors de toute borne réelle.
 *
 * `stack` (G4a) contraint le seul axe des prix ; `scatter` (G4b) prix × immatriculation ; le régime
 * dégradé (`EX-NFR-19`) prix × kilométrage. Dans les trois cas la boîte englobante est calculée sur
 * les trois métriques, ce qui rend la restriction indépendante de la projection en vigueur à la
 * réouverture de l'URL (`EX-NAV-18` : le rendu est une fonction pure de l'URL).
 */
export function brushToSelRestriction(
  points: readonly ScatterPoint[],
  selectedRows: ReadonlySet<number>,
): SelRestriction | null {
  const box = brushToIntervalFilters(points, selectedRows);
  if (box === null) return null;
  let rMin = Infinity;
  let rMax = -Infinity;
  for (const p of points) {
    if (!selectedRows.has(p.row)) continue;
    if (p.regYearMonth < rMin) rMin = p.regYearMonth;
    if (p.regYearMonth > rMax) rMax = p.regYearMonth;
  }
  const axes: SelAxisRange[] = [];
  if (Number.isFinite(rMin) && Number.isFinite(rMax)) axes.push({ metric: 'reg', from: rMin, to: rMax });
  if (Number.isFinite(box.mileageFrom) && Number.isFinite(box.mileageTo)) {
    axes.push({ metric: 'km', from: box.mileageFrom, to: box.mileageTo });
  }
  return axes.length === 0
    ? { from: box.priceFrom, to: box.priceTo }
    : { from: box.priceFrom, to: box.priceTo, axes };
}

/** Bornes minimales d'un bucket (sous-ensemble de `DistributionBucket` utile ici). */
interface BucketBounds {
  readonly index: number;
  readonly lowerBound: number;
  readonly upperBound: number;
}

/**
 * `EX-SCR-184` (DR-080) — compte, par indice de bucket, le nombre de points SÉLECTIONNÉS (brossage)
 * dont `metricOf(point)` tombe dans le bucket. Sert à la surimpression de liaison croisée sur les
 * histogrammes G1-G3 : AUCUN recalcul d'échelle (`EX-SCR-190`), seule la part déjà tracée d'une barre
 * est distinguée par une seconde barre superposée. Bins semi-ouverts à droite (`[lo, hi)`,
 * `EX-DATA-76`) sauf le dernier bucket, fermé à droite pour capter la borne exacte. `points` est
 * l'ÉCHANTILLON tracé du nuage (`EX-DATA-100`), pas la sélection Σ entière : au-delà de `K = 5 000`
 * points, la surimpression porte donc sur l'échantillon, comme le nuage lui-même — cohérent, jamais
 * une fausse précision au-delà de ce que G4 donne à voir. */
export function selectedCountsByBucket(
  points: readonly ScatterPoint[],
  selectedRows: ReadonlySet<number>,
  buckets: readonly BucketBounds[],
  metricOf: (p: ScatterPoint) => number,
): ReadonlyMap<number, number> {
  const out = new Map<number, number>();
  for (const p of points) {
    if (!selectedRows.has(p.row)) continue;
    const v = metricOf(p);
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i] as BucketBounds;
      const isLast = i === buckets.length - 1;
      const inBucket = v >= b.lowerBound && (isLast ? v <= b.upperBound : v < b.upperBound);
      if (inBucket) {
        out.set(b.index, (out.get(b.index) ?? 0) + 1);
        break;
      }
    }
  }
  return out;
}
