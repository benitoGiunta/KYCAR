/**
 * KYCAR — Modèle de données du nuage G4 (lot D7, EX-DATA-98/99/102, EX-SCR-151..160/18)
 * =================================================================================================
 * Prépare, sur le THREAD PRINCIPAL, la matière du nuage à partir du `ListingColumnBatch` (mode 2) :
 *   - ÉLIGIBILITÉ (EX-DATA-99) : `priceStatus = QUOTED` ET année ET kilométrage valides (EX-DATA-60),
 *     avec ventilation ordonnée des motifs de rejet (`noPrice` → `noYear` → `noMileage` →
 *     `suspectValue`) de sorte que la somme des rejets et des éligibles vaille `N`.
 *   - EXTRACTION des 13 champs strictement nécessaires par point (EX-DATA-98) — aucun autre champ.
 *   - BORNES D'AXE à `Q(0,01)`/`Q(0,99)` de la donnée tracée pour les vues non-histogramme (EX-SCR-18),
 *     points hors bornes portés sur la bordure (jamais supprimés).
 *   - ENCODAGES couleur/taille (EX-SCR-154/155/156) via rampes séquentielles sûres en déficience de
 *     vision des couleurs (rampe A = année, rampe B = kilométrage — EX-SCR-186).
 *
 * Module PUR : la conversion data→pixels est une fonction retournée par `makeProjector`, testable
 * sans DOM ; le tracé lui-même est dans `scatter-render.ts`.
 */

import type { ListingColumnBatch } from '../../types/index';
import { isMileageValid, isPriceValid, isYearValid, PRICE_STATUS_QUOTED, yearFromYearMonth } from '../../engine/flags';
import { quantileFromSorted } from '../../engine/quantiles';

/** Motifs de non-éligibilité, ventilés dans l'ordre d'EX-DATA-99. */
export interface EligibilityBreakdown {
  readonly eligible: Int32Array;
  readonly noPrice: number;
  readonly noYear: number;
  readonly noMileage: number;
  readonly suspectValue: number;
}

/**
 * Ventile les lignes selon l'éligibilité au tracé (EX-DATA-99). Une ligne cumulant plusieurs motifs
 * est comptée dans le PREMIER motif applicable de la liste ordonnée, pour que la somme close `N`.
 */
export function computeEligibility(
  batch: ListingColumnBatch,
  rows: Int32Array | readonly number[],
): EligibilityBreakdown {
  const eligible: number[] = [];
  let noPrice = 0;
  let noYear = 0;
  let noMileage = 0;
  let suspectValue = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as number;
    const status = batch.priceStatus[row] as number;
    const price = batch.priceEur[row] as number;
    const ingest = batch.ingestFlags[row] as number;
    const ym = batch.firstRegistrationYearMonth[row] as number;
    const mileage = batch.mileageKm[row] as number;

    const priceOk = status === PRICE_STATUS_QUOTED && isPriceValid(price, status, ingest);
    const yearOk = isYearValid(ym);
    const mileageOk = isMileageValid(mileage, ingest);

    if (!priceOk && status !== PRICE_STATUS_QUOTED) {
      noPrice++;
    } else if (!priceOk) {
      // QUOTED mais prix invalide (drapeau) → valeur suspecte plutôt que « pas de prix ».
      suspectValue++;
    } else if (!yearOk) {
      noYear++;
    } else if (!mileageOk) {
      noMileage++;
    } else {
      eligible.push(row);
    }
  }
  return { eligible: Int32Array.from(eligible), noPrice, noYear, noMileage, suspectValue };
}

/** Un point du nuage, en coordonnées DONNÉE (les 13 champs d'EX-DATA-98, sans version/url chargés). */
export interface ScatterPoint {
  readonly row: number;
  readonly priceEur: number;
  /** Année civile de 1ʳᵉ immatriculation (dérivée de `firstRegistrationYearMonth`). */
  readonly year: number;
  /** `firstRegistrationYearMonth` brut (axe X continu de G4b). */
  readonly regYearMonth: number;
  readonly mileageKm: number;
  readonly fuelCategory: number;
  readonly powerKw: number;
  readonly isOutlier: boolean;
  readonly opportunityScore: number | null;
}

/** Informations d'outlier par ligne (dérivées des `OutlierVerdict` du moteur). */
export interface OutlierLookup {
  readonly isOutlier: (row: number) => boolean;
  readonly opportunityScore: (row: number) => number | null;
}

/** Construit les `ScatterPoint` des lignes échantillonnées. */
export function buildScatterPoints(
  batch: ListingColumnBatch,
  sampledRows: Int32Array | readonly number[],
  outliers: OutlierLookup,
): ScatterPoint[] {
  const points: ScatterPoint[] = [];
  for (let i = 0; i < sampledRows.length; i++) {
    const row = sampledRows[i] as number;
    const ym = batch.firstRegistrationYearMonth[row] as number;
    const power = batch.powerKw[row] as number;
    points.push({
      row,
      priceEur: batch.priceEur[row] as number,
      year: isYearValid(ym) ? yearFromYearMonth(ym) : -1,
      regYearMonth: ym,
      mileageKm: batch.mileageKm[row] as number,
      fuelCategory: batch.fuelCategory[row] as number,
      powerKw: power,
      isOutlier: outliers.isOutlier(row),
      opportunityScore: outliers.opportunityScore(row),
    });
  }
  return points;
}

/** Bornes d'un axe (données), avec les quantiles de tracé (EX-SCR-18). */
export interface AxisBounds {
  readonly lo: number;
  readonly hi: number;
}

/** Calcule `Q(0,01)`/`Q(0,99)` d'un vecteur de valeurs (EX-SCR-18, EX-DATA-62). */
export function q01q99(values: readonly number[]): AxisBounds {
  if (values.length === 0) return { lo: 0, hi: 1 };
  const sorted = Float64Array.from(values).sort();
  const lo = quantileFromSorted(sorted, 0.01);
  const hi = quantileFromSorted(sorted, 0.99);
  return lo < hi ? { lo, hi } : { lo, hi: lo + 1 };
}

/* ---- Rampes séquentielles sûres en déficience de vision des couleurs (EX-SCR-154/186) ---------- */

/** Rampe A (année) : viridis 5 arrêts — luminance monotone, aucune opposition rouge/vert. */
export const RAMP_A_YEAR: readonly string[] = ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'];
/** Rampe B (kilométrage) : cividis 5 arrêts — distincte de A (EX-SCR-186), CVD-safe. */
export const RAMP_B_MILEAGE: readonly string[] = ['#00204d', '#31446b', '#666970', '#a69d75', '#ffe945'];
/** Gris neutre des valeurs manquantes (EX-SCR-154). */
export const MISSING_COLOR = '#8a9099';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Interpole une rampe à 5 arrêts en `t ∈ [0, 1]`, retourne une couleur `rgb()`. */
export function rampColor(ramp: readonly string[], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const seg = clamped * (ramp.length - 1);
  const i = Math.min(ramp.length - 2, Math.floor(seg));
  const f = seg - i;
  const [r0, g0, b0] = hexToRgb(ramp[i] as string);
  const [r1, g1, b1] = hexToRgb(ramp[i + 1] as string);
  const r = Math.round(r0 + (r1 - r0) * f);
  const g = Math.round(g0 + (g1 - g0) * f);
  const b = Math.round(b0 + (b1 - b0) * f);
  return `rgb(${r}, ${g}, ${b})`;
}

/* ---- Encodage taille (EX-SCR-155) ------------------------------------------------------------- */

export const DIAMETER_MIN_PX = 5;
export const DIAMETER_MAX_PX = 14;
export const MILEAGE_CLIP_KM = 250000;

/**
 * Diamètre d'un disque G4a : AIRE proportionnelle au kilométrage (rayon en racine carrée), borné
 * 5–14 px, écrêté au-delà de 250 000 km (EX-SCR-155). Retourne `{ diameter, clipped }`.
 */
export function mileageDiameter(mileageKm: number): { readonly diameter: number; readonly clipped: boolean } {
  const clipped = mileageKm > MILEAGE_CLIP_KM;
  const km = Math.max(0, Math.min(MILEAGE_CLIP_KM, mileageKm));
  const t = km / MILEAGE_CLIP_KM; // aire ∝ km
  const aMin = DIAMETER_MIN_PX * DIAMETER_MIN_PX;
  const aMax = DIAMETER_MAX_PX * DIAMETER_MAX_PX;
  const area = aMin + (aMax - aMin) * t;
  return { diameter: Math.sqrt(area), clipped };
}

/* ---- Projection données → pixels -------------------------------------------------------------- */

/** Zone de tracé en pixels. */
export interface Viewport {
  readonly width: number;
  readonly height: number;
  readonly padLeft: number;
  readonly padRight: number;
  readonly padTop: number;
  readonly padBottom: number;
}

/** Projette une valeur d'axe (données) en pixel, écrêtée à la bordure (EX-SCR-18). */
export interface Projector {
  readonly x: (value: number) => number;
  readonly y: (value: number) => number;
  /** Vrai si `value` sort des bornes X (marqueur de dépassement). */
  readonly xOut: (value: number) => boolean;
  readonly yOut: (value: number) => boolean;
}

/** Projection INVERSE pixel → donnée (pour traduire un rectangle de brossage en bornes d'axe). */
export interface InverseProjector {
  readonly dataX: (px: number) => number;
  readonly dataY: (py: number) => number;
}

/** Fabrique l'inverse d'un projecteur linéaire (mêmes bornes/viewport). */
export function makeInverseProjector(vp: Viewport, xB: AxisBounds, yB: AxisBounds): InverseProjector {
  const x0 = vp.padLeft;
  const x1 = vp.width - vp.padRight;
  const y0 = vp.height - vp.padBottom;
  const y1 = vp.padTop;
  const spanX = xB.hi - xB.lo || 1;
  const spanY = yB.hi - yB.lo || 1;
  return {
    dataX: (px) => xB.lo + ((px - x0) / (x1 - x0 || 1)) * spanX,
    dataY: (py) => yB.lo + ((py - y0) / (y1 - y0 || 1)) * spanY,
  };
}

/**
 * Fabrique un projecteur linéaire. Y est inversé (0 en bas). Les valeurs hors bornes sont écrêtées
 * sur la bordure (jamais supprimées, EX-SCR-18) ; `xOut`/`yOut` les signalent pour le marqueur.
 */
export function makeProjector(vp: Viewport, xB: AxisBounds, yB: AxisBounds): Projector {
  const x0 = vp.padLeft;
  const x1 = vp.width - vp.padRight;
  const y0 = vp.height - vp.padBottom;
  const y1 = vp.padTop;
  const spanX = xB.hi - xB.lo || 1;
  const spanY = yB.hi - yB.lo || 1;
  const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
  return {
    x: (value) => clamp(x0 + ((value - xB.lo) / spanX) * (x1 - x0), Math.min(x0, x1), Math.max(x0, x1)),
    y: (value) => clamp(y0 + ((value - yB.lo) / spanY) * (y1 - y0), Math.min(y0, y1), Math.max(y0, y1)),
    xOut: (value) => value < xB.lo || value > xB.hi,
    yOut: (value) => value < yB.lo || value > yB.hi,
  };
}
