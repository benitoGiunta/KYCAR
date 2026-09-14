import { describe, expect, it } from 'vitest';
import {
  checkI1,
  checkI2,
  checkI3,
  checkI4,
  checkI5,
  checkI6,
  checkI7,
  checkI8,
} from './invariants';

/** Les 8 invariants (EX-DATA-104) sur données jouet, chacun avec une violation injectée. #6. */

const makeAgg = [
  { makeId: 1, listingCount: 6 },
  { makeId: 2, listingCount: 4 },
];
const modelAgg = [
  { makeId: 1, listingCount: 4 },
  { makeId: 1, listingCount: 2 },
  { makeId: 2, listingCount: 4 },
];
const makeMetric = [
  { price: { n: 5 }, year: { n: 6 }, mileage: { n: 4 } },
  { price: { n: 3 }, year: { n: 4 }, mileage: { n: 4 } },
];
const selection = {
  selectionCount: 10,
  price: { n: 8 },
  year: { n: 10 },
  mileage: { n: 8 },
  priceQuotedCount: 8,
  priceOnRequestCount: 1,
  priceMissingCount: 1,
  outlierEvaluatedCount: 6,
  outlierNotEvaluatedCount: 2,
};
const buckets = [
  { metric: 'price' as const, count: 5 },
  { metric: 'price' as const, count: 3 },
  { metric: 'year' as const, count: 10 },
  { metric: 'mileage' as const, count: 8 },
];
const cells = [
  { yearBinIndex: 0, count: 3 },
  { yearBinIndex: 1, count: 5 },
];
const yearMap = new Map<number, number>([
  [0, 3],
  [1, 5],
]);

/** Binning jouet, fonction pure du multiset (permutation-invariant), min au 1er bin, max au dernier. */
function binFn(values: readonly number[]): readonly { lowerBound: number; upperBound: number }[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const BINS = 4;
  const width = max - min === 0 ? 1 : (max - min) / BINS;
  const bins = Array.from({ length: BINS }, (_, i) => ({
    lowerBound: min + i * width,
    upperBound: i === BINS - 1 ? max : min + (i + 1) * width,
  }));
  return bins;
}
/** Binning FAUTIF : dépend de l'ordre d'arrivée (premier élément). */
function badBinFn(values: readonly number[]): readonly { lowerBound: number; upperBound: number }[] {
  return [{ lowerBound: values[0] ?? 0, upperBound: values[0] ?? 0 }];
}

describe('invariants I1..I8 — cas cohérent', () => {
  it('I1', () => expect(checkI1(makeAgg, 10).ok).toBe(true));
  it('I2', () => expect(checkI2(makeAgg, modelAgg).ok).toBe(true));
  it('I3', () => expect(checkI3(makeMetric, selection).ok).toBe(true));
  it('I4', () => expect(checkI4(buckets, selection).ok).toBe(true));
  it('I5', () => expect(checkI5(selection).ok).toBe(true));
  it('I6', () => expect(checkI6(selection).ok).toBe(true));
  it('I7', () => expect(checkI7(cells, 8, yearMap).ok).toBe(true));
  it('I8', () => expect(checkI8(binFn, [10, 20, 15, 40, 25]).ok).toBe(true));
});

describe('invariants I1..I8 — violation injectée détectée', () => {
  it('I1 détecte un N faux', () => expect(checkI1(makeAgg, 11).ok).toBe(false));
  it('I2 détecte un modèle incohérent', () =>
    expect(checkI2(makeAgg, [{ makeId: 1, listingCount: 4 }, { makeId: 1, listingCount: 1 }, { makeId: 2, listingCount: 4 }]).ok).toBe(false));
  it('I3 détecte un effectif métrique faux', () =>
    expect(checkI3(makeMetric, { ...selection, price: { n: 7 } }).ok).toBe(false));
  it('I4 détecte un bin manquant', () =>
    expect(checkI4([{ metric: 'price' as const, count: 5 }, { metric: 'year' as const, count: 10 }, { metric: 'mileage' as const, count: 8 }], selection).ok).toBe(false));
  it('I5 détecte une partition de prix fausse', () =>
    expect(checkI5({ ...selection, priceMissingCount: 2 }).ok).toBe(false));
  it('I6 détecte un décompte outlier faux', () =>
    expect(checkI6({ ...selection, outlierEvaluatedCount: 5 }).ok).toBe(false));
  it('I7 détecte une grille de densité fausse', () =>
    expect(checkI7(cells, 9, yearMap).ok).toBe(false));
  it('I8 détecte un binning dépendant de l’ordre', () =>
    expect(checkI8(badBinFn, [10, 20, 15]).ok).toBe(false));
});
