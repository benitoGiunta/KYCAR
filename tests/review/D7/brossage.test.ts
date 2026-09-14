/**
 * KYCAR — Sondes de revue D7 · brossage et liaison croisée (EX-SCR-158/184/185, EX-NAV-10bis)
 * =================================================================================================
 * Vérification n°5 de la mission : brossage vide, brossage couvrant tout, brossage hors domaine,
 * cohérence entre les listes liées. La sonde rejoue la CHAÎNE RÉELLE du composant `ScatterCloud`
 * (projecteur inverse → bornes de données → `computeBrushSelection`), pas seulement le modèle isolé.
 */

import { describe, it, expect } from 'vitest';
import {
  computeBrushSelection,
  brushToIntervalFilters,
  BRUSH_ACCESSOR_SCATTER,
  BRUSH_ACCESSOR_STACK,
} from '../../../src/screens/distribution/brush-model';
import { makeInverseProjector, type AxisBounds, type ScatterPoint, type Viewport } from '../../../src/screens/distribution/scatter-model';

/** Viewport identique à celui du composant (`ScatterCloud`, mode non dégradé). */
const VP: Viewport = { width: 900, height: 480, padLeft: 52, padRight: 168, padTop: 16, padBottom: 40 };

function point(row: number, priceEur: number, year: number, mileageKm: number): ScatterPoint {
  return {
    row,
    priceEur,
    year,
    regYearMonth: year * 12 + 5,
    mileageKm,
    fuelCategory: 1,
    powerKw: 90,
    isOutlier: false,
    opportunityScore: null,
  };
}

const POINTS: readonly ScatterPoint[] = [
  point(0, 8000, 2012, 180000),
  point(1, 12000, 2016, 120000),
  point(2, 15000, 2018, 90000),
  point(3, 22000, 2021, 40000),
  point(4, 31000, 2023, 15000),
];

const X_SCATTER: AxisBounds = { lo: 2012 * 12, hi: 2023 * 12 + 11 };
const Y_PRICE: AxisBounds = { lo: 8000, hi: 31000 };

describe('D7 · brossage G4b (EX-SCR-158)', () => {
  it('brossage vide (aucune borne) : sélection vide et aucun filtre d’intervalle', () => {
    const sel = computeBrushSelection(POINTS, null, null, BRUSH_ACCESSOR_SCATTER);
    expect(sel.size).toBe(0);
    expect(brushToIntervalFilters(POINTS, sel)).toBeNull();
  });

  it('brossage couvrant tout le domaine : toutes les annonces sont sélectionnées', () => {
    const sel = computeBrushSelection(
      POINTS,
      { from: X_SCATTER.lo, to: X_SCATTER.hi },
      { from: Y_PRICE.lo, to: Y_PRICE.hi },
      BRUSH_ACCESSOR_SCATTER,
    );
    expect(sel.size).toBe(POINTS.length);
    const f = brushToIntervalFilters(POINTS, sel);
    expect(f).not.toBeNull();
    expect(f!.priceFrom).toBe(8000);
    expect(f!.priceTo).toBe(31000);
    expect(f!.yearFrom).toBe(2012);
    expect(f!.yearTo).toBe(2023);
    expect(f!.mileageFrom).toBe(15000);
    expect(f!.mileageTo).toBe(180000);
  });

  it('brossage hors domaine : sélection vide, aucun point n’est ramené sur la bordure', () => {
    const sel = computeBrushSelection(
      POINTS,
      { from: 1990 * 12, to: 1995 * 12 },
      { from: 1, to: 100 },
      BRUSH_ACCESSOR_SCATTER,
    );
    expect(sel.size).toBe(0);
    expect(brushToIntervalFilters(POINTS, sel)).toBeNull();
  });

  it('cohérence des listes liées : les bornes converties encadrent exactement les points sélectionnés', () => {
    const sel = computeBrushSelection(
      POINTS,
      { from: 2016 * 12, to: 2021 * 12 + 11 },
      { from: 10000, to: 25000 },
      BRUSH_ACCESSOR_SCATTER,
    );
    expect([...sel].sort()).toEqual([1, 2, 3]);
    const f = brushToIntervalFilters(POINTS, sel)!;
    for (const p of POINTS) {
      const inside = p.priceEur >= f.priceFrom && p.priceEur <= f.priceTo && p.year >= f.yearFrom && p.year <= f.yearTo && p.mileageKm >= f.mileageFrom && p.mileageKm <= f.mileageTo;
      if (sel.has(p.row)) expect(inside).toBe(true);
    }
    // La conversion en filtres est ENGLOBANTE (EX-SCR-184) : elle peut ramener des voisins, mais
    // jamais perdre une annonce brossée.
    expect(f.priceFrom).toBe(12000);
    expect(f.priceTo).toBe(22000);
  });

  it('EX-SCR-184 : le brossage ne modifie aucun agrégat — il ne produit qu’un ensemble de lignes', () => {
    const before = POINTS.map((p) => p.priceEur);
    computeBrushSelection(POINTS, { from: 0, to: 1e9 }, { from: 0, to: 1e9 }, BRUSH_ACCESSOR_SCATTER);
    expect(POINTS.map((p) => p.priceEur)).toEqual(before);
  });
});

describe('D7 · brossage G4a — nuée empilée (EX-SCR-151/158)', () => {
  /**
   * Rejoue exactement `ScatterCloud.onPointerUp` en variante `stack` : l'axe Y encode le RANG
   * d'empilement (bornes `{lo: 0, hi: maxStack}`), donc le projecteur inverse rend des valeurs de
   * rang ; l'accesseur de brossage de `BRUSH_ACCESSOR_STACK`, lui, lit `priceEur` sur Y.
   */
  const maxStack = 4;
  const yStack: AxisBounds = { lo: 0, hi: maxStack };
  const xStack: AxisBounds = { lo: 8000, hi: 31000 };
  const inv = makeInverseProjector(VP, xStack, yStack);

  it('R-D7-06 — un glisser couvrant TOUTE la zone de tracé de G4a ne sélectionne aucune annonce', () => {
    // Glisser du coin haut-gauche au coin bas-droit de la zone de tracé.
    const x0 = VP.padLeft;
    const x1 = VP.width - VP.padRight;
    const yTop = VP.padTop;
    const yBottom = VP.height - VP.padBottom;
    const brushX = { from: inv.dataX(x0), to: inv.dataX(x1) };
    const brushY = { from: inv.dataY(yBottom), to: inv.dataY(yTop) };
    expect(brushX.from).toBeCloseTo(8000, 6);
    expect(brushX.to).toBeCloseTo(31000, 6);
    expect(brushY.to).toBeCloseTo(maxStack, 6); // bornes en RANG, pas en prix

    const sel = computeBrushSelection(POINTS, brushX, brushY, BRUSH_ACCESSOR_STACK);
    expect(sel.size).toBe(POINTS.length);
  });
});
