/**
 * KYCAR — Rendu Canvas 2D du nuage G4 (lot D7, EX-SCR-155/157, EX-NFR-7/8)
 * =================================================================================================
 * Dessine les points sur un contexte de type `CanvasRenderingContext2D`. La fonction est PURE au sens
 * où elle ne touche à aucune globale : elle reçoit le contexte, les points, la fenêtre et le
 * projecteur. Cela la rend mesurable hors navigateur avec un contexte-espion (banc de perf), et
 * réutilisable telle quelle par le composant `ScatterCloud.tsx`.
 *
 * Encodage (EX-SCR-157) : opacité 55 %, contour 0,5 px à 100 % d'opacité pour dénombrer les
 * superpositions. Points écrêtés au-delà de 250 000 km : contour pointillé 1,5 px (EX-SCR-155). La
 * liaison croisée (EX-SCR-184) tombe les points NON sélectionnés à 15 % d'opacité.
 */

import type { Projector, ScatterPoint } from './scatter-model';
import {
  MILEAGE_CLIP_KM,
  RAMP_A_YEAR,
  RAMP_B_MILEAGE,
  MISSING_COLOR,
  mileageDiameter,
  rampColor,
} from './scatter-model';

/** Sous-ensemble de `CanvasRenderingContext2D` utilisé par le rendu (permet un espion de test). */
export interface Canvas2DLike {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
  lineWidth: number;
  clearRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  arc(x: number, y: number, r: number, a0: number, a1: number): void;
  fill(): void;
  stroke(): void;
  setLineDash(segments: number[]): void;
  save(): void;
  restore(): void;
}

/** Variante rendue (EX-SCR-151). */
export type ScatterVariant = 'stack' | 'scatter';

export interface DrawScatterOptions {
  readonly variant: ScatterVariant;
  /** Bornes d'année observées (min/max) pour normaliser la rampe couleur de G4a. */
  readonly yearMin: number;
  readonly yearMax: number;
  /** Bornes de kilométrage observées pour la rampe couleur de G4b. */
  readonly mileageMin: number;
  readonly mileageMax: number;
  /** Lignes surlignées par la liaison croisée (brossage). `null` = pas de sélection active. */
  readonly selectedRows?: ReadonlySet<number> | null;
  /** Diamètre fixe de G4b quand la puissance manque (EX-SCR-156). */
  readonly fixedDiameterPx?: number;
  /** `EX-NFR-19` (E2E-17) : régime dégradé (< 768 px) — l'axe X porte le km (substitué dans
   * `regYearMonth` par l'appelant, `ScatterCloud.tsx`), donc la couleur DOIT encoder l'année
   * (`RAMP_A_YEAR`, sur `p.year`) au lieu du km (déjà porté par la position), sinon l'encodage
   * couleur devient à la fois redondant et illisible. */
  readonly degraded?: boolean;
}

const POINT_ALPHA = 0.55; // EX-SCR-157
const UNSELECTED_ALPHA = 0.15; // EX-SCR-184
const OUTLINE_WIDTH = 0.5; // EX-SCR-157
const CLIP_OUTLINE_WIDTH = 1.5; // EX-SCR-155

/**
 * Dessine le nuage. Retourne le nombre de points effectivement tracés (diagnostic/perf).
 * `pxOf`/`pyOf` calculent la position ; pour G4a l'appelant fournit un projecteur dont l'axe Y encode
 * le rang d'empilement (EX-SCR-151) — le rang est porté par `stackRankByRow`.
 */
export function drawScatter(
  ctx: Canvas2DLike,
  points: readonly ScatterPoint[],
  proj: Projector,
  vpWidth: number,
  vpHeight: number,
  options: DrawScatterOptions,
  stackRankByRow?: ReadonlyMap<number, number>,
): number {
  ctx.clearRect(0, 0, vpWidth, vpHeight);
  const { variant, selectedRows } = options;
  const yearSpan = options.yearMax - options.yearMin || 1;
  const kmSpan = options.mileageMax - options.mileageMin || 1;
  const fixedD = options.fixedDiameterPx ?? 6;

  let drawn = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i] as ScatterPoint;

    // Position.
    let px: number;
    let py: number;
    if (variant === 'stack') {
      px = proj.x(p.priceEur);
      const rank = stackRankByRow?.get(p.row) ?? 0;
      py = proj.y(rank);
    } else {
      px = proj.x(p.regYearMonth);
      py = proj.y(p.priceEur);
    }

    // Couleur.
    let color: string;
    if (variant === 'stack' || options.degraded) {
      color = p.year < 0 ? MISSING_COLOR : rampColor(RAMP_A_YEAR, (p.year - options.yearMin) / yearSpan);
    } else {
      color = rampColor(RAMP_B_MILEAGE, (p.mileageKm - options.mileageMin) / kmSpan);
    }

    // Taille + écrêtage.
    let diameter: number;
    let clipped: boolean;
    if (variant === 'stack') {
      const d = mileageDiameter(p.mileageKm);
      diameter = d.diameter;
      clipped = d.clipped;
    } else {
      diameter = p.powerKw > 0 ? Math.max(5, Math.min(14, 5 + (p.powerKw / 300) * 9)) : fixedD;
      clipped = p.mileageKm > MILEAGE_CLIP_KM;
    }
    const radius = diameter / 2;

    // Opacité (liaison croisée).
    const selected = selectedRows == null || selectedRows.has(p.row);
    ctx.globalAlpha = selected ? POINT_ALPHA : UNSELECTED_ALPHA;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, TWO_PI);
    ctx.fill();

    // Contour (dénombrement des superpositions).
    ctx.globalAlpha = selected ? 1 : UNSELECTED_ALPHA;
    ctx.strokeStyle = p.isOutlier ? OUTLIER_OUTLINE : REGULAR_OUTLINE;
    if (clipped) {
      ctx.lineWidth = CLIP_OUTLINE_WIDTH;
      ctx.setLineDash(CLIP_DASH);
    } else {
      ctx.lineWidth = OUTLINE_WIDTH;
      ctx.setLineDash(EMPTY_DASH);
    }
    ctx.stroke();
    drawn++;
  }
  ctx.globalAlpha = 1;
  ctx.setLineDash(EMPTY_DASH);
  return drawn;
}

const TWO_PI = Math.PI * 2;
const CLIP_DASH = [2, 1.5];
const EMPTY_DASH: number[] = [];
const OUTLIER_OUTLINE = '#b3261e'; // --color-danger (EX-NFR-13)
const REGULAR_OUTLINE = '#14171c'; // --color-text
