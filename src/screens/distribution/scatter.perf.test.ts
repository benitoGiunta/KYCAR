/**
 * KYCAR — Banc de performance du nuage G4 (lot D7, EX-NFR-7/8, EX-SCR-189)
 * =================================================================================================
 * EXCLU de `npm test` (suffixe `.perf.test.ts`) ; lancé par `npm run test:perf`.
 *
 * Mesure le COÛT CPU DU THREAD PRINCIPAL du rendu du nuage : projection des points + émission des
 * appels de dessin. C'est exactement la part qui se dispute le thread principal avec la boucle
 * d'animation (le moteur d'agrégation, lui, tourne dans le worker — ARCHITECTURE §1.3). La
 * rastérisation GPU/Canvas n'est pas reproductible hors navigateur ; on mesure donc une BORNE de la
 * charge JS par trame, ce qui est la grandeur opposable pour EX-NFR-8. Le contexte-espion accumule
 * les coordonnées reçues pour empêcher le JIT d'élider les appels (mesure honnête).
 *
 * Critères vérifiés :
 *   - EX-NFR-7 : rendu initial de 5 000 points ≤ 500 ms au p95.
 *   - EX-NFR-8 : sur 10 s d'interaction continue (pan/zoom simulé), ≥ 95 % des fenêtres glissantes
 *     de 1 s tiennent ≥ 30 img/s ; on publie le nombre de fenêtres, les fenêtres en défaut et le
 *     débit minimal observé (ARB-38).
 */

import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '../../engine/synthetic';
import { detectOutliers } from '../../engine/outliers';
import { decodeListingId } from '../../engine/uuid';
import { computeEligibility, buildScatterPoints, makeProjector, q01q99, type Viewport } from './scatter-model';
import { sampleScatter } from './scatter-sample';
import { drawScatter, type Canvas2DLike, type DrawScatterOptions } from './scatter-render';

/** Contexte-espion : implémente `Canvas2DLike`, accumule un checksum pour ne rien laisser élider. */
class SpyContext implements Canvas2DLike {
  fillStyle: string | CanvasGradient | CanvasPattern = '#000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000';
  globalAlpha = 1;
  lineWidth = 1;
  checksum = 0;
  clearRect(): void {}
  beginPath(): void {}
  arc(x: number, y: number, r: number): void {
    this.checksum += x + y + r;
  }
  fill(): void {
    this.checksum += 1;
  }
  stroke(): void {
    this.checksum += 1;
  }
  setLineDash(): void {}
  save(): void {}
  restore(): void {}
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(p * (sortedAsc.length - 1)));
  return sortedAsc[idx] as number;
}

describe('nuage G4 — performance (EX-NFR-7/8)', () => {
  // Prépare un échantillon de 5 000 points depuis un dataset synthétique.
  const N = 60000;
  const ds = generateSyntheticDataset({ rowCount: N, seed: 0x51ee7 });
  const batch = ds.batch;
  const allRows = Int32Array.from({ length: N }, (_v, i) => i);
  const { eligible } = computeEligibility(batch, allRows);
  const out = detectOutliers(batch, eligible, batch.snapshotId, 'perf');
  const outlierIds = new Set<string>(out.verdicts.map((v) => v.listingId));
  const scoreById = new Map<string, number>();
  for (const v of out.verdicts) {
    if (v.opportunityScore != null) {
      const prev = scoreById.get(v.listingId);
      if (prev === undefined || Math.abs(v.opportunityScore) > Math.abs(prev)) {
        scoreById.set(v.listingId, v.opportunityScore);
      }
    }
  }
  const isOutlier = (row: number): boolean => outlierIds.has(decodeListingId(batch.listingId, row));
  const opportunityScore = (row: number): number | null =>
    scoreById.get(decodeListingId(batch.listingId, row)) ?? null;

  const sample = sampleScatter({ eligible, listingId: batch.listingId, isOutlier, opportunityScore });
  const points = buildScatterPoints(batch, sample.rows, { isOutlier, opportunityScore });

  const vp: Viewport = { width: 1000, height: 480, padLeft: 48, padRight: 160, padTop: 16, padBottom: 40 };
  const xB = q01q99(points.map((p) => p.regYearMonth));
  const yB = q01q99(points.map((p) => p.priceEur));
  let yearMin = Infinity;
  let yearMax = -Infinity;
  let kmMin = Infinity;
  let kmMax = -Infinity;
  for (const p of points) {
    if (p.year >= 0) {
      if (p.year < yearMin) yearMin = p.year;
      if (p.year > yearMax) yearMax = p.year;
    }
    if (p.mileageKm < kmMin) kmMin = p.mileageKm;
    if (p.mileageKm > kmMax) kmMax = p.mileageKm;
  }
  const baseOptions: DrawScatterOptions = {
    variant: 'scatter',
    yearMin,
    yearMax,
    mileageMin: kmMin,
    mileageMax: kmMax,
    selectedRows: null,
  };
  const ctx = new SpyContext();

  it('EX-NFR-7 : rendu initial de ≤ 5 000 points ≤ 500 ms au p95', () => {
    expect(points.length).toBeLessThanOrEqual(5000);
    const samples: number[] = [];
    // 40 rendus « à froid » (nouveau projecteur à chaque fois, comme un premier tracé).
    for (let i = 0; i < 40; i++) {
      const proj = makeProjector(vp, xB, yB);
      const t0 = performance.now();
      drawScatter(ctx, points, proj, vp.width, vp.height, baseOptions);
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    const p95 = percentile(samples, 0.95);
    console.log(`[EX-NFR-7] points=${points.length} p50=${percentile(samples, 0.5).toFixed(2)}ms p95=${p95.toFixed(2)}ms checksum=${ctx.checksum}`);
    expect(p95).toBeLessThanOrEqual(500);
  });

  it('EX-NFR-8 : ≥ 30 img/s dans ≥ 95 % des fenêtres de 1 s sur 10 s d’interaction', () => {
    // Simule 10 s d'interaction : on redessine en boucle avec un zoom/pan continu et on horodate
    // chaque trame. On regroupe ensuite les trames en fenêtres glissantes de 1 s.
    const frameTimestamps: number[] = [];
    const start = performance.now();
    let z = 1;
    while (performance.now() - start < 10000) {
      z = z >= 1.5 ? 0.7 : z + 0.002; // zoom continu
      const zx: typeof xB = { lo: xB.lo, hi: xB.lo + (xB.hi - xB.lo) * z };
      const zy: typeof yB = { lo: yB.lo, hi: yB.lo + (yB.hi - yB.lo) * z };
      const proj = makeProjector(vp, zx, zy);
      drawScatter(ctx, points, proj, vp.width, vp.height, baseOptions);
      frameTimestamps.push(performance.now() - start);
    }
    const totalFrames = frameTimestamps.length;
    // Débit instantané minimal (plus grand intervalle inter-trame).
    let maxGap = 0;
    for (let i = 1; i < frameTimestamps.length; i++) {
      const gap = (frameTimestamps[i] as number) - (frameTimestamps[i - 1] as number);
      if (gap > maxGap) maxGap = gap;
    }
    const minFps = maxGap > 0 ? 1000 / maxGap : Infinity;

    // Fenêtres glissantes de 1 s, pas de 100 ms : fps = nombre de trames dans la fenêtre.
    let windows = 0;
    let failing = 0;
    for (let w = 0; w + 1000 <= 10000; w += 100) {
      windows++;
      let count = 0;
      for (const t of frameTimestamps) if (t >= w && t < w + 1000) count++;
      if (count < 30) failing++;
    }
    const okRatio = windows > 0 ? (windows - failing) / windows : 1;
    console.log(
      `[EX-NFR-8] frames=${totalFrames} windows=${windows} failing=${failing} okRatio=${(okRatio * 100).toFixed(1)}% minFpsInstant=${minFps.toFixed(0)} checksum=${ctx.checksum}`,
    );
    expect(okRatio).toBeGreaterThanOrEqual(0.95);
  });
});
