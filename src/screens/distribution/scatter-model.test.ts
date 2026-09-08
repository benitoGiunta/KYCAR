/**
 * KYCAR — Tests du modèle du nuage G4 (lot D7, EX-DATA-98/99, EX-SCR-18/155/154)
 */

import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '../../engine/synthetic';
import {
  computeEligibility,
  buildScatterPoints,
  q01q99,
  mileageDiameter,
  rampColor,
  makeProjector,
  RAMP_A_YEAR,
  DIAMETER_MIN_PX,
  DIAMETER_MAX_PX,
  MILEAGE_CLIP_KM,
  type Viewport,
} from './scatter-model';

describe('computeEligibility (EX-DATA-99)', () => {
  it('la somme des éligibles et des motifs de rejet vaut exactement N', () => {
    const N = 5000;
    const ds = generateSyntheticDataset({ rowCount: N, seed: 42, onRequestRate: 0.05, priceMissingRate: 0.03 });
    const rows = Int32Array.from({ length: N }, (_v, i) => i);
    const e = computeEligibility(ds.batch, rows);
    expect(e.eligible.length + e.noPrice + e.noYear + e.noMileage + e.suspectValue).toBe(N);
    // Il existe des annonces à prix sur demande / absent → au moins un rejet noPrice.
    expect(e.noPrice).toBeGreaterThan(0);
  });

  it('toutes les lignes éligibles ont un prix affiché et une année/km valides', () => {
    const N = 1000;
    const ds = generateSyntheticDataset({ rowCount: N, seed: 7 });
    const rows = Int32Array.from({ length: N }, (_v, i) => i);
    const e = computeEligibility(ds.batch, rows);
    for (let i = 0; i < e.eligible.length; i++) {
      const row = e.eligible[i] as number;
      expect(ds.batch.priceEur[row]).toBeGreaterThan(0);
      expect(ds.batch.mileageKm[row]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('buildScatterPoints (EX-DATA-98)', () => {
  it('reporte prix/année/km et l’état d’outlier', () => {
    const N = 400;
    const ds = generateSyntheticDataset({ rowCount: N, seed: 3 });
    const rows = Int32Array.from({ length: N }, (_v, i) => i);
    const e = computeEligibility(ds.batch, rows);
    const outlierRows = ds.injectedLowRows;
    const pts = buildScatterPoints(ds.batch, e.eligible, {
      isOutlier: (r) => outlierRows.has(r),
      opportunityScore: () => null,
    });
    expect(pts.length).toBe(e.eligible.length);
    const anyOutlier = pts.some((p) => p.isOutlier);
    // Au moins un outlier bas injecté est éligible et repéré.
    expect(anyOutlier).toBe(true);
  });
});

describe('encodage taille (EX-SCR-155)', () => {
  it('aire proportionnelle au km, diamètre borné 5–14 px', () => {
    expect(mileageDiameter(0).diameter).toBeCloseTo(DIAMETER_MIN_PX, 5);
    expect(mileageDiameter(MILEAGE_CLIP_KM).diameter).toBeCloseTo(DIAMETER_MAX_PX, 5);
    // Aire linéaire : à mi-km, l'aire est la moyenne des aires extrêmes.
    const dMid = mileageDiameter(MILEAGE_CLIP_KM / 2).diameter;
    const aMid = dMid * dMid;
    const aExpected = (DIAMETER_MIN_PX ** 2 + DIAMETER_MAX_PX ** 2) / 2;
    expect(aMid).toBeCloseTo(aExpected, 3);
  });
  it('écrête au-delà de 250 000 km', () => {
    const d = mileageDiameter(400000);
    expect(d.clipped).toBe(true);
    expect(d.diameter).toBeCloseTo(DIAMETER_MAX_PX, 5);
  });
});

describe('rampe couleur (EX-SCR-154)', () => {
  it('retourne les arrêts aux extrêmes et interpole au milieu', () => {
    expect(rampColor(RAMP_A_YEAR, 0)).toBe('rgb(68, 1, 84)'); // #440154
    expect(rampColor(RAMP_A_YEAR, 1)).toBe('rgb(253, 231, 37)'); // #fde725
    expect(rampColor(RAMP_A_YEAR, 0.5)).toBe('rgb(33, 145, 140)'); // #21918c (arrêt central)
  });
});

describe('bornes d’axe et projection (EX-SCR-18)', () => {
  it('Q0.01/Q0.99 encadre le gros de la distribution', () => {
    const values = Array.from({ length: 1000 }, (_v, i) => i);
    const b = q01q99(values);
    expect(b.lo).toBeGreaterThanOrEqual(0);
    expect(b.hi).toBeLessThanOrEqual(999);
    expect(b.lo).toBeLessThan(b.hi);
  });

  it('projette dans la zone et écrête les valeurs hors bornes (jamais supprimées)', () => {
    const vp: Viewport = { width: 200, height: 100, padLeft: 10, padRight: 10, padTop: 5, padBottom: 5 };
    const proj = makeProjector(vp, { lo: 0, hi: 100 }, { lo: 0, hi: 100 });
    expect(proj.x(0)).toBeCloseTo(10, 5);
    expect(proj.x(100)).toBeCloseTo(190, 5);
    // Y inversé : 0 en bas.
    expect(proj.y(0)).toBeCloseTo(95, 5);
    expect(proj.y(100)).toBeCloseTo(5, 5);
    // Hors bornes : écrêté sur la bordure, signalé.
    expect(proj.xOut(150)).toBe(true);
    expect(proj.x(150)).toBeCloseTo(190, 5); // porté sur la bordure droite
  });
});
