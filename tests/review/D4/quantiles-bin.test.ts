import { describe, expect, it } from 'vitest';
import {
  exactMetricStats,
  metricStatsFromCounts,
  quantileFromSorted,
  quantileType7,
} from '../../../src/engine/quantiles';
import {
  bin,
  binEdges,
  binIndexOf,
  MILEAGE_BIN_PARAMS,
  PRICE_BIN_PARAMS,
  toDistributionBuckets,
  YEAR_BIN_PARAMS,
} from '../../../src/engine/bin';
import { checkI8 } from '../../../src/types/index';
import { mulberry32, refQuantile, refStats } from './helpers';

/**
 * Revue D4 — quantiles exacts (EX-DATA-62/63/111) et fonction BIN (EX-DATA-75..83, I8).
 * La référence est `refQuantile` (helpers.ts), écrite indépendamment à partir de la formule
 * littérale d'EX-DATA-62 (type 7 : h = (n−1)p + 1, interpolation linéaire).
 */

const EPS = 1e-9;

function expectStatsMatchReference(values: readonly number[]): void {
  const s = exactMetricStats(values);
  const r = refStats(values);
  expect(s.n).toBe(r.n);
  expect(s.min).toBe(r.min);
  expect(s.max).toBe(r.max);
  expect(s.mean as number).toBeCloseTo(r.mean, 8);
  expect(Math.abs((s.p05 as number) - r.p05)).toBeLessThan(EPS);
  expect(Math.abs((s.p25 as number) - r.p25)).toBeLessThan(EPS);
  expect(Math.abs((s.p50 as number) - r.p50)).toBeLessThan(EPS);
  expect(Math.abs((s.p75 as number) - r.p75)).toBeLessThan(EPS);
  expect(Math.abs((s.p95 as number) - r.p95)).toBeLessThan(EPS);
  if (r.sd === null) expect(s.stdDev).toBeNull();
  else expect(s.stdDev as number).toBeCloseTo(r.sd, 6);
}

describe('EX-DATA-62/111 — quantiles exacts type 7 contre valeurs connues', () => {
  it('n = 0 : bloc entièrement nul, n = 0 (EX-DATA-64)', () => {
    const s = exactMetricStats([]);
    expect(s).toEqual({ n: 0, min: null, max: null, mean: null, p05: null, p25: null, p50: null, p75: null, p95: null, stdDev: null });
  });

  it('n = 1 : Q(V, p) = x₁ pour tout p ; sd = null (EX-DATA-65)', () => {
    const s = exactMetricStats([7]);
    expect([s.min, s.max, s.p05, s.p25, s.p50, s.p75, s.p95, s.mean]).toEqual([7, 7, 7, 7, 7, 7, 7, 7]);
    expect(s.stdDev).toBeNull();
  });

  it('n = 2 (pair) : médiane interpolée 1,5 ; P5 = 1,05 ; P95 = 1,95 ; P25 = 1,25 ; P75 = 1,75', () => {
    const s = exactMetricStats([2, 1]);
    expect(s.p50).toBeCloseTo(1.5, 12);
    expect(s.p05).toBeCloseTo(1.05, 12);
    expect(s.p95).toBeCloseTo(1.95, 12);
    expect(s.p25).toBeCloseTo(1.25, 12);
    expect(s.p75).toBeCloseTo(1.75, 12);
    expect(s.stdDev).toBeCloseTo(Math.SQRT1_2, 12); // sd d'échantillon de {1,2} = √0,5
  });

  it('n = 3 (impair) : P25 = 15, P50 = 20, P75 = 25, P5 = 11, P95 = 29 sur {10,20,30}', () => {
    const s = exactMetricStats([30, 10, 20]);
    expect(s.p25).toBeCloseTo(15, 12);
    expect(s.p50).toBe(20);
    expect(s.p75).toBeCloseTo(25, 12);
    expect(s.p05).toBeCloseTo(11, 12);
    expect(s.p95).toBeCloseTo(29, 12);
  });

  it('n = 4 (pair) : P25 = 1,75 ; P50 = 2,5 ; P75 = 3,25 ; P5 = 1,15 ; P95 = 3,85 sur {1,2,3,4}', () => {
    const s = exactMetricStats([4, 3, 2, 1]);
    expect(s.p25).toBeCloseTo(1.75, 12);
    expect(s.p50).toBeCloseTo(2.5, 12);
    expect(s.p75).toBeCloseTo(3.25, 12);
    expect(s.p05).toBeCloseTo(1.15, 12);
    expect(s.p95).toBeCloseTo(3.85, 12);
  });

  it('n = 5 (impair, valeurs NumPy/R connues) : {15,20,35,40,50} → P5 = 16, P25 = 20, P50 = 35, P75 = 40, P95 = 48', () => {
    const s = exactMetricStats([50, 15, 40, 20, 35]);
    expect(s.p05).toBeCloseTo(16, 12);
    expect(s.p25).toBe(20);
    expect(s.p50).toBe(35);
    expect(s.p75).toBe(40);
    expect(s.p95).toBeCloseTo(48, 12);
  });

  it('doublons : {5,5,5,5,9} → P50 = 5, P75 = 5, P95 = 8,2 ; {1,1,2,2} → P50 = 1,5', () => {
    const a = exactMetricStats([5, 9, 5, 5, 5]);
    expect(a.p50).toBe(5);
    expect(a.p75).toBe(5);
    expect(a.p95).toBeCloseTo(8.2, 12);
    const b = exactMetricStats([2, 1, 2, 1]);
    expect(b.p50).toBeCloseTo(1.5, 12);
    expect(b.p25).toBe(1);
    expect(b.p75).toBe(2);
  });

  it('bornes p = 0 et p = 1 : x₁ et xₙ (quantileType7 / quantileFromSorted)', () => {
    const sorted = [3, 8, 13, 21];
    expect(quantileFromSorted(sorted, 0)).toBe(3);
    expect(quantileFromSorted(sorted, 1)).toBe(21);
    expect(quantileType7((i) => sorted[i - 1] as number, 4, 0.5)).toBeCloseTo(10.5, 12);
    expect(() => quantileType7(() => 0, 0, 0.5)).toThrow(RangeError);
  });

  it('les deux réalisations (comptage / tri comparatif) coïncident avec la référence pour n = 2..4', () => {
    // Domaine dense → comptage ; domaine creux (> 4n) → tri comparatif.
    expectStatsMatchReference([1, 2]);
    expectStatsMatchReference([1, 1_000_000]);
    expectStatsMatchReference([1, 2, 3]);
    expectStatsMatchReference([100, 5_000, 4_999_000]);
    expectStatsMatchReference([1, 2, 3, 4]);
    expectStatsMatchReference([250, 260, 90_000, 4_900_000]);
  });

  it('propriété : 200 échantillons aléatoires (n ∈ [1, 40], denses et creux, avec doublons) = référence à 1e-9', () => {
    const rng = mulberry32(20250908);
    for (let t = 0; t < 200; t++) {
      const n = 1 + Math.floor(rng() * 40);
      const sparse = rng() < 0.5;
      const values: number[] = [];
      for (let k = 0; k < n; k++) {
        values.push(sparse ? 1 + Math.floor(rng() * 5_000_000) : 1000 + Math.floor(rng() * 12));
      }
      expectStatsMatchReference(values);
    }
  });

  it('metricStatsFromCounts : comptages avec trous (valeurs 10, 12, 12, 20) → P50 = 12, P25 = 11,5, P75 = 14', () => {
    const counts = new Int32Array(11); // domaine [10, 20]
    counts[0] = 1;
    counts[2] = 2;
    counts[10] = 1;
    const s = metricStatsFromCounts(counts, 10, 4, null, null);
    expect(s.min).toBe(10);
    expect(s.max).toBe(20);
    expect(s.p50).toBe(12);
    expect(s.p25).toBeCloseTo(11.5, 12);
    expect(s.p75).toBeCloseTo(14, 12);
  });
});

describe('EX-DATA-75/76/77/78/79/80/81/83 — BIN : bornes, débordements, effectifs', () => {
  it('bornes semi-ouvertes [lo, hi) : une valeur égale à `lo` entre dans le bin, une valeur égale à `hi` dans le suivant (EX-DATA-76)', () => {
    // 24 valeurs 1000, 2000, …, 24000 → a ≈ 1230, b ≈ 23770, raw ≈ 939 → w = 1000, kLo = 1, kHi = 23.
    const values = Array.from({ length: 24 }, (_v, i) => (i + 1) * 1000);
    const r = bin(values, PRICE_BIN_PARAMS);
    expect(r.binWidth).toBe(1000);
    expect(r.kLo).toBe(1);
    expect(r.kHi).toBe(23);
    const closed = r.bins.filter((b) => !b.open);
    expect(closed[0]?.lowerBound).toBe(1000);
    expect(closed[0]?.upperBound).toBe(2000);
    // 1000 est dans [1000, 2000) ; 2000 est dans [2000, 3000) ; 1999 dans [1000, 2000).
    expect(binIndexOf(1000, r)).toBe(1);
    expect(binIndexOf(1999, r)).toBe(1);
    expect(binIndexOf(2000, r)).toBe(2);
    expect(closed[0]?.count).toBe(1);
    // 24000 = (kHi+1)·w tombe dans le bin de débordement HAUT (index kHi+1, ouvert), et le maximum
    // de V appartient donc au dernier bin émis (I8).
    const last = r.bins[r.bins.length - 1];
    expect(last?.open).toBe(true);
    expect(last?.index).toBe(24);
    expect(last?.count).toBe(1);
    expect(r.overflowCount).toBe(1);
    expect(r.underflowCount).toBe(0);
    expect(r.bins[0]?.open).toBe(false); // aucun bin de débordement bas émis (effectif nul, EX-DATA-79)
  });

  it('la valeur b = Q(0,99) tombe dans le dernier bin fermé ; une valeur juste au-dessus de b mais sous (kHi+1)·w aussi', () => {
    const values = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8600];
    const r = bin(values, PRICE_BIN_PARAMS);
    const b = refQuantile(values, 0.99);
    expect(binIndexOf(b, r)).toBe(r.kHi);
    const w = r.binWidth as number;
    const justBelowNext = (r.kHi as number + 1) * w - 1;
    expect(binIndexOf(justBelowNext, r)).toBe(r.kHi);
    expect(binIndexOf((r.kHi as number + 1) * w, r)).toBe((r.kHi as number) + 1);
  });

  it('valeurs hors domaine de l’écrêtage : débordements comptés, effectif total des bins = n (I4)', () => {
    // 200 prix dans [12 000, 16 000] + trois extrêmes : l'écrêtage à [Q(0,01), Q(0,99)] les rejette dans
    // les bins de débordement (avec n petit, Q(0,01)/Q(0,99) tendent vers min/max et rien ne déborde).
    const values = [1, 250, 5_000_000];
    for (let i = 0; i < 200; i++) values.push(12_000 + (i * 20) % 4_000);
    const r = bin(values, PRICE_BIN_PARAMS);
    const total = r.bins.reduce((acc, b) => acc + b.count, 0);
    expect(total).toBe(values.length);
    expect(r.underflowCount + r.overflowCount).toBeGreaterThan(0);
    const under = r.bins[0] as { open: boolean; lowerBound: number; index: number; count: number };
    expect(under.open).toBe(true);
    expect(under.lowerBound).toBe(-Infinity);
    expect(under.index).toBe((r.kLo as number) - 1);
    expect(under.count).toBe(r.underflowCount);
    const over = r.bins[r.bins.length - 1] as { open: boolean; upperBound: number; index: number; count: number };
    expect(over.open).toBe(true);
    expect(over.upperBound).toBe(Infinity);
    expect(over.index).toBe((r.kHi as number) + 1);
    expect(over.count).toBe(r.overflowCount);
  });

  it('propriété : Σ count = n et chaque valeur tombe dans exactement un bin (binIndexOf cohérent) sur 100 échantillons aléatoires', () => {
    const rng = mulberry32(777);
    for (let t = 0; t < 100; t++) {
      const n = 1 + Math.floor(rng() * 300);
      const params = t % 3 === 0 ? PRICE_BIN_PARAMS : t % 3 === 1 ? MILEAGE_BIN_PARAMS : YEAR_BIN_PARAMS;
      const values: number[] = [];
      for (let k = 0; k < n; k++) {
        if (params === YEAR_BIN_PARAMS) values.push(1990 + Math.floor(rng() * 36));
        else if (params === MILEAGE_BIN_PARAMS) values.push(Math.floor(rng() * (rng() < 0.05 ? 1_500_000 : 250_000)));
        else values.push(1 + Math.floor(rng() * (rng() < 0.05 ? 5_000_000 : 60_000)));
      }
      const r = bin(values, params);
      expect(r.bins.reduce((acc, b) => acc + b.count, 0)).toBe(n);
      const byIndex = new Map(r.bins.map((b) => [b.index, b]));
      const recount = new Map<number, number>();
      for (const v of values) {
        const k = binIndexOf(v, r);
        const b = byIndex.get(k);
        expect(b).toBeDefined();
        if (b && !b.open) {
          expect(v).toBeGreaterThanOrEqual(b.lowerBound);
          expect(v).toBeLessThan(b.upperBound);
        }
        recount.set(k, (recount.get(k) ?? 0) + 1);
      }
      for (const b of r.bins) expect(recount.get(b.index) ?? 0).toBe(b.count);
      // Indices strictement croissants : débordement bas en tête, haut en fin (EX-DATA-117).
      for (let i = 1; i < r.bins.length; i++) expect((r.bins[i] as { index: number }).index).toBe((r.bins[i - 1] as { index: number }).index + 1);
    }
  });

  it('bins intérieurs vides conservés (EX-DATA-78) ; débordements non émis si vides (EX-DATA-79)', () => {
    const values = [1000, 1100, 9000, 9100];
    const r = bin(values, PRICE_BIN_PARAMS);
    const closed = r.bins.filter((b) => !b.open);
    expect(closed.length).toBe((r.kHi as number) - (r.kLo as number) + 1);
    expect(closed.some((b) => b.count === 0)).toBe(true);
    expect(r.bins.every((b) => !b.open || b.count > 0)).toBe(true);
  });

  it('n = 1 : exactement un bin fermé de largeur min(W) contenant la valeur (EX-DATA-80) ; lowConfidence à n < 12 seulement', () => {
    const r1 = bin([12_345], PRICE_BIN_PARAMS);
    expect(r1.binWidth).toBe(100);
    expect(r1.bins.length).toBe(1);
    expect(r1.bins[0]?.open).toBe(false);
    expect(r1.bins[0]?.count).toBe(1);
    expect(r1.lowConfidence).toBe(true);
    expect(bin(Array.from({ length: 11 }, (_v, i) => 1000 + i * 100), PRICE_BIN_PARAMS).lowConfidence).toBe(true);
    expect(bin(Array.from({ length: 12 }, (_v, i) => 1000 + i * 100), PRICE_BIN_PARAMS).lowConfidence).toBe(false);
  });

  it('n = 0 : EMPTY, bins = [], binWidth = null (EX-DATA-81)', () => {
    const r = bin([], YEAR_BIN_PARAMS);
    expect(r.status).toBe('EMPTY');
    expect(r.bins).toEqual([]);
    expect(r.binWidth).toBeNull();
    expect(() => binIndexOf(2000, r)).toThrow();
  });

  it('année, W = {1} : étendue > 24 ans → w = max(W) = 1 et plus de 24 bins fermés (EX-DATA-75/77)', () => {
    const years: number[] = [];
    for (let y = 1995; y <= 2025; y++) years.push(y, y);
    const r = bin(years, YEAR_BIN_PARAMS);
    expect(r.binWidth).toBe(1);
    expect(r.bins.filter((b) => !b.open).length).toBeGreaterThan(24);
    expect(r.bins.reduce((acc, b) => acc + b.count, 0)).toBe(years.length);
  });

  it('I8 (EX-DATA-82) : BIN(permutation(V)) = BIN(V) octet à octet, min dans le premier bin, max dans le dernier', () => {
    const rng = mulberry32(99);
    const values = Array.from({ length: 500 }, () => 1 + Math.floor(rng() * 80_000));
    const shuffled = [...values].sort(() => rng() - 0.5);
    expect(JSON.stringify(bin(values, PRICE_BIN_PARAMS))).toBe(JSON.stringify(bin(shuffled, PRICE_BIN_PARAMS)));
    expect(checkI8((v) => binEdges(v, PRICE_BIN_PARAMS), values, shuffled).ok).toBe(true);
    expect(checkI8((v) => binEdges(v, MILEAGE_BIN_PARAMS), values.map((v) => v * 3), shuffled.map((v) => v * 3)).ok).toBe(true);
  });

  it('EX-DATA-83 : share = count / n arrondi à 4 décimales, Σ count = n, ordre index croissant', () => {
    const values = Array.from({ length: 37 }, (_v, i) => 5000 + i * 397);
    const r = bin(values, PRICE_BIN_PARAMS);
    const buckets = toDistributionBuckets(r, 'snap', 'FULL:EMPTY', 'price');
    expect(buckets.reduce((acc, b) => acc + b.count, 0)).toBe(37);
    for (const b of buckets) expect(b.share).toBe(Math.round((b.count / 37) * 1e4) / 1e4);
    for (let i = 1; i < buckets.length; i++) expect((buckets[i] as { index: number }).index).toBeGreaterThan((buckets[i - 1] as { index: number }).index);
    expect(buckets.every((b) => b.metric === 'price' && b.selectionHash === 'FULL:EMPTY')).toBe(true);
  });
});
