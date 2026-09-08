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
