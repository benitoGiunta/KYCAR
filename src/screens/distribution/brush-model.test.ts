/**
 * KYCAR — Tests du brossage et de la liaison croisée (lot D7, EX-SCR-158/184)
 */

import { describe, it, expect } from 'vitest';
import type { ScatterPoint } from './scatter-model';
import { makeInverseProjector, type Viewport } from './scatter-model';
import {
  computeBrushSelection,
  brushToIntervalFilters,
  BRUSH_ACCESSOR_SCATTER,
} from './brush-model';

function pt(row: number, price: number, year: number, ym: number, km: number): ScatterPoint {
  return { row, priceEur: price, year, regYearMonth: ym, mileageKm: km, fuelCategory: 0, powerKw: 100, isOutlier: false, opportunityScore: null };
}

const POINTS: ScatterPoint[] = [
  pt(0, 5000, 2015, 2015 * 12, 120000),
  pt(1, 12000, 2018, 2018 * 12, 60000),
  pt(2, 20000, 2020, 2020 * 12, 30000),
  pt(3, 30000, 2022, 2022 * 12, 10000),
];

describe('computeBrushSelection (EX-SCR-158)', () => {
  it('sélectionne les points dans le rectangle (an × prix)', () => {
    const sel = computeBrushSelection(
      POINTS,
      { from: 2017 * 12, to: 2021 * 12 },
      { from: 10000, to: 25000 },
      BRUSH_ACCESSOR_SCATTER,
    );
    expect([...sel].sort()).toEqual([1, 2]);
  });

  it('brossage 1D (un seul axe contraint)', () => {
    const sel = computeBrushSelection(POINTS, null, { from: 25000, to: 40000 }, BRUSH_ACCESSOR_SCATTER);
    expect([...sel]).toEqual([3]);
  });

  it('aucun axe → sélection vide (pas de filtre implicite, EX-SCR-184)', () => {
    expect(computeBrushSelection(POINTS, null, null, BRUSH_ACCESSOR_SCATTER).size).toBe(0);
  });
});

describe('brushToIntervalFilters (EX-SCR-184)', () => {
  it('bornes englobantes de la sélection', () => {
    const sel = new Set([1, 2]);
    const f = brushToIntervalFilters(POINTS, sel);
    expect(f).toEqual({
      priceFrom: 12000,
      priceTo: 20000,
      yearFrom: 2018,
      yearTo: 2020,
      mileageFrom: 30000,
      mileageTo: 60000,
    });
  });

  it('null si sélection vide', () => {
    expect(brushToIntervalFilters(POINTS, new Set())).toBeNull();
  });
});

describe('projection inverse (rectangle pixel → bornes données)', () => {
  it('dataX/dataY inversent makeProjector', () => {
    const vp: Viewport = { width: 200, height: 100, padLeft: 10, padRight: 10, padTop: 5, padBottom: 5 };
    const inv = makeInverseProjector(vp, { lo: 0, hi: 100 }, { lo: 0, hi: 100 });
    // px=10 → 0 ; px=190 → 100.
    expect(inv.dataX(10)).toBeCloseTo(0, 5);
    expect(inv.dataX(190)).toBeCloseTo(100, 5);
    // py=95 (bas) → 0 ; py=5 (haut) → 100.
    expect(inv.dataY(95)).toBeCloseTo(0, 5);
    expect(inv.dataY(5)).toBeCloseTo(100, 5);
  });
});
