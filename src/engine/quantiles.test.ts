import { describe, expect, it } from 'vitest';
import { exactMetricStats, quantileFromSorted } from './quantiles';
import { bin, binEdges, PRICE_BIN_PARAMS } from './bin';
import { checkI8 } from '../types/index';

/**
 * Quantiles exacts (EX-DATA-62/111) vérifiés contre des valeurs connues, y compris les cas limites
 * n = 0, 1, 3 (critère de succès D4 #4), et la fonction BIN contre l'invariant I8 (EX-DATA-82).
 */
describe('quantiles exacts type 7 (EX-DATA-62)', () => {
  it('n = 0 : toutes les statistiques sont nulles', () => {
    const s = exactMetricStats([]);
    expect(s.n).toBe(0);
    expect(s.min).toBeNull();
    expect(s.max).toBeNull();
    expect(s.mean).toBeNull();
    expect(s.p50).toBeNull();
    expect(s.stdDev).toBeNull();
  });

  it('n = 1 : tous les quantiles valent la valeur unique, sd = null (EX-DATA-65)', () => {
    const s = exactMetricStats([42]);
    expect(s.n).toBe(1);
    expect(s.min).toBe(42);
    expect(s.max).toBe(42);
    expect(s.mean).toBe(42);
    expect(s.p05).toBe(42);
    expect(s.p25).toBe(42);
    expect(s.p50).toBe(42);
    expect(s.p75).toBe(42);
    expect(s.p95).toBe(42);
    expect(s.stdDev).toBeNull();
  });

  it('n = 3 : interpolation type 7 aux valeurs connues', () => {
    const s = exactMetricStats([30, 10, 20]); // ordre indifférent
    expect(s.min).toBe(10);
    expect(s.max).toBe(30);
    expect(s.p25).toBeCloseTo(15, 10);
    expect(s.p50).toBe(20);
    expect(s.p75).toBeCloseTo(25, 10);
    expect(s.p05).toBeCloseTo(11, 10);
    expect(s.p95).toBeCloseTo(29, 10);
    expect(s.mean).toBeCloseTo(20, 10);
    expect(s.stdDev).toBeCloseTo(10, 10); // sd d'échantillon (n−1)
  });

  it('n = 9 : quantiles tombant exactement sur des statistiques d’ordre', () => {
    const s = exactMetricStats([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(s.p25).toBe(3);
    expect(s.p50).toBe(5);
    expect(s.p75).toBe(7);
  });

  it('quantileFromSorted correspond à NumPy/R sur un cas connu', () => {
    const v = [15, 20, 35, 40, 50];
    expect(quantileFromSorted(v, 0.5)).toBe(35); // h=(5-1)*0.5+1=3 -> x_3
    expect(quantileFromSorted(v, 0.25)).toBe(20); // h=(5-1)*0.25+1=2 -> x_2
  });
});

/**
 * Verrou de non-régression du correctif de performance (lot D4-finition) : `exactMetricStats`
 * choisit entre tri par comptage (domaine dense) et tri comparatif (domaine creux, `domaine > 4n`).
 * Les DEUX chemins doivent rendre EXACTEMENT les mêmes statistiques (EX-DATA-111 : jamais approché).
 */
describe('exactMetricStats — équivalence comptage / tri sur domaine creux', () => {
  /** Référence type 7 indépendante, calculée sur une copie triée. */
  function reference(values: readonly number[]): {
    min: number; max: number; mean: number; p05: number; p25: number; p50: number; p75: number; p95: number; std: number | null;
  } {
    const s = [...values].sort((a, b) => a - b);
    const n = s.length;
    const q = (p: number): number => {
      if (n === 1) return s[0] as number;
      const h = (n - 1) * p + 1;
      const i = Math.floor(h);
      const f = h - i;
      if (f === 0 || i >= n) return s[Math.min(i, n) - 1] as number;
      return (s[i - 1] as number) + f * ((s[i] as number) - (s[i - 1] as number));
    };
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = n < 2 ? null : values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
    return {
      min: s[0] as number,
      max: s[n - 1] as number,
      mean,
      p05: q(0.05),
      p25: q(0.25),
      p50: q(0.5),
      p75: q(0.75),
      p95: q(0.95),
      std: variance === null ? null : Math.sqrt(variance),
    };
  }

  function expectMatches(values: readonly number[]): void {
    const s = exactMetricStats(values);
    const r = reference(values);
    expect(s.min).toBe(r.min);
    expect(s.max).toBe(r.max);
    expect(s.mean as number).toBeCloseTo(r.mean, 8);
    expect(s.p05 as number).toBeCloseTo(r.p05, 8);
    expect(s.p25 as number).toBeCloseTo(r.p25, 8);
    expect(s.p50 as number).toBeCloseTo(r.p50, 8);
    expect(s.p75 as number).toBeCloseTo(r.p75, 8);
    expect(s.p95 as number).toBeCloseTo(r.p95, 8);
    if (r.std === null) expect(s.stdDev).toBeNull();
    else expect(s.stdDev as number).toBeCloseTo(r.std, 6);
  }

  it('domaine DENSE (chemin comptage) : identique à la référence', () => {
    const dense: number[] = [];
    for (let i = 0; i < 500; i += 1) dense.push(10000 + ((i * 7) % 200));
    expectMatches(dense);
  });

  it('domaine CREUX avec outlier extrême (chemin tri) : identique à la référence', () => {
    // 40 prix serrés + un outlier à 3 000 000 → domaine ≈ 3·10⁶ ≫ 4n : force le tri comparatif.
    const sparse = [800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200,
      2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800, 3900,
      4000, 4100, 4200, 4300, 4400, 4500, 4600, 3_000_000];
    expectMatches(sparse);
  });

  it('les deux chemins coïncident sur les mêmes valeurs (avec/sans outlier lointain)', () => {
    const base = Array.from({ length: 60 }, (_v, i) => 15000 + i * 3);
    expectMatches(base); // dense → comptage
    expectMatches([...base, 2_500_000]); // + outlier → creux → tri
  });
});

describe('BIN (EX-DATA-75) et invariant I8', () => {
  const prices = [
    500, 1200, 3000, 4500, 6000, 7000, 8000, 9000, 10000, 12000, 14000, 16000, 18000, 20000, 25000,
    30000, 40000, 55000, 80000, 120000,
  ];

  it('I8 : BIN invariant par permutation, min au premier bin, max au dernier', () => {
    const result = checkI8((values) => binEdges(values, PRICE_BIN_PARAMS), prices);
    expect(result.ok).toBe(true);
  });

  it('n = 0 : status EMPTY', () => {
    const r = bin([], PRICE_BIN_PARAMS);
    expect(r.status).toBe('EMPTY');
    expect(r.bins.length).toBe(0);
    expect(r.binWidth).toBeNull();
  });

  it('n = 1 : un seul bin fermé, lowConfidence', () => {
    const r = bin([12345], PRICE_BIN_PARAMS);
    expect(r.status).toBe('OK');
    expect(r.bins.filter((b) => !b.open).length).toBe(1);
    expect(r.lowConfidence).toBe(true);
  });

  it('somme des effectifs de bins = n (base de I4)', () => {
    const r = bin(prices, PRICE_BIN_PARAMS);
    const total = r.bins.reduce((a, b) => a + b.count, 0);
    expect(total).toBe(prices.length);
  });
});
