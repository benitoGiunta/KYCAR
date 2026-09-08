import { describe, expect, it } from 'vitest';

import {
  GRID_VIRTUALIZATION_THRESHOLD,
  MAKE_COUNT_WARNING_THRESHOLD,
  effectifTier,
  isSparseModel,
  modelZoneMedianDisplay,
  shouldShowMakeCountWarning,
  shouldVirtualizeGrid,
} from './thresholds';

describe('effectifTier — EX-SCR-33 (paliers testables sur 0, 1, 3, 5, 9, 11, 12, 29, 30)', () => {
  it.each([
    [0, 'absente'],
    [1, 'trop-faible'],
    [3, 'trop-faible'],
    [4, 'trop-faible'],
    [5, 'reduite'],
    [9, 'reduite'],
    [11, 'reduite'],
    [12, 'sans-m2'],
    [29, 'sans-m2'],
    [30, 'complete'],
    [1000, 'complete'],
  ])('n=%i -> %s', (n, expected) => {
    expect(effectifTier(n)).toBe(expected);
  });
});

describe('modelZoneMedianDisplay — EX-SCR-134', () => {
  it('n = 0 -> absent', () => {
    expect(modelZoneMedianDisplay(0)).toEqual({ kind: 'absent', n: 0 });
  });

  it('n = 1 -> single-offer (« 1 seule offre »), pas « n trop faible »', () => {
    expect(modelZoneMedianDisplay(1)).toEqual({ kind: 'single-offer', n: 1 });
  });

  it('2 <= n <= 4 -> too-few (« n trop faible »)', () => {
    expect(modelZoneMedianDisplay(2)).toEqual({ kind: 'too-few', n: 2 });
    expect(modelZoneMedianDisplay(4)).toEqual({ kind: 'too-few', n: 4 });
  });

  it('n >= 5 -> valeur normale', () => {
    expect(modelZoneMedianDisplay(5)).toEqual({ kind: 'value', n: 5 });
  });
});

describe('isSparseModel — EX-SCR-128 (« moins de 3 offres »)', () => {
  it.each([
    [1, true],
    [2, true],
    [3, false],
    [0, true],
  ])('listingCount=%i -> sparse=%s', (n, expected) => {
    expect(isSparseModel(n)).toBe(expected);
  });
});

describe('shouldShowMakeCountWarning — EX-SRCH-26 / EX-SCR-32 (seuil 60)', () => {
  it('n’affiche pas le bandeau à 60 marques exactement (le seuil est un dépassement STRICT)', () => {
    expect(shouldShowMakeCountWarning(MAKE_COUNT_WARNING_THRESHOLD)).toBe(false);
  });

  it('affiche le bandeau au-delà de 60', () => {
    expect(shouldShowMakeCountWarning(MAKE_COUNT_WARNING_THRESHOLD + 1)).toBe(true);
  });
});

describe('shouldVirtualizeGrid — EX-SCR-127 (seuil 40)', () => {
  it('ne virtualise pas à 40 cartes exactement', () => {
    expect(shouldVirtualizeGrid(GRID_VIRTUALIZATION_THRESHOLD)).toBe(false);
  });

  it('virtualise au-delà de 40 cartes', () => {
    expect(shouldVirtualizeGrid(GRID_VIRTUALIZATION_THRESHOLD + 1)).toBe(true);
  });
});
