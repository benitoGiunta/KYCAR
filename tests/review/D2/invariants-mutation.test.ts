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
} from '../../../src/types/invariants';

/**
 * Sonde de revue D2 — les 8 invariants (`EX-DATA-104`, §B.8) par MUTATION : pour chaque
 * invariant, une violation MINIMALE (un seul compteur décalé de 1) doit être rejetée.
 */

/** Base cohérente minimale : 1 marque, 1 modèle, 1 annonce. */
const MAKES = [{ makeId: 1, listingCount: 1 }];
const MODELS = [{ makeId: 1, listingCount: 1 }];
const MAKE_METRICS = [{ price: { n: 1 }, year: { n: 1 }, mileage: { n: 1 } }];
const SELECTION = {
  selectionCount: 1,
  price: { n: 1 },
  year: { n: 1 },
  mileage: { n: 1 },
  priceQuotedCount: 1,
  priceOnRequestCount: 0,
  priceMissingCount: 0,
  outlierEvaluatedCount: 1,
  outlierNotEvaluatedCount: 0,
};
const BUCKETS = [
  { metric: 'price' as const, count: 1 },
  { metric: 'year' as const, count: 1 },
  { metric: 'mileage' as const, count: 1 },
];
const CELLS = [{ yearBinIndex: 0, count: 1 }];
const YEAR_MAP = new Map<number, number>([[0, 1]]);

/** Binning déterministe et invariant par permutation (référence saine). */
function binOk(values: readonly number[]): readonly { lowerBound: number; upperBound: number }[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return [
    { lowerBound: min, upperBound: (min + max) / 2 },
    { lowerBound: (min + max) / 2, upperBound: max },
  ];
}

describe('D2 — I1..I8 : base cohérente acceptée', () => {
  it('les 8 invariants passent sur la base minimale cohérente', () => {
    expect(checkI1(MAKES, 1).ok).toBe(true);
    expect(checkI2(MAKES, MODELS).ok).toBe(true);
    expect(checkI3(MAKE_METRICS, SELECTION).ok).toBe(true);
    expect(checkI4(BUCKETS, SELECTION).ok).toBe(true);
    expect(checkI5(SELECTION).ok).toBe(true);
    expect(checkI6(SELECTION).ok).toBe(true);
    expect(checkI7(CELLS, 1, YEAR_MAP).ok).toBe(true);
    expect(checkI8(binOk, [10, 20, 30]).ok).toBe(true);
  });
});

describe('D2 — I1..I8 : violation minimale (mutation de 1) détectée', () => {
  it('I1 — Σ listingCount(marque) ≠ N', () => {
    expect(checkI1(MAKES, 2).ok).toBe(false);
  });

  it('I2 — Σ modèles d’une marque ≠ effectif de la marque', () => {
    expect(checkI2(MAKES, [{ makeId: 1, listingCount: 2 }]).ok).toBe(false);
  });

  it('I3 — Σ n_m(marque) ≠ n_m(Σ) pour une métrique', () => {
    expect(checkI3(MAKE_METRICS, { ...SELECTION, mileage: { n: 2 } }).ok).toBe(false);
  });

  it('I4 — Σ bins émis ≠ n_m(Σ) pour une métrique', () => {
    expect(checkI4([{ metric: 'price', count: 2 }, ...BUCKETS.slice(1)], SELECTION).ok).toBe(false);
  });

  it('I5 — quoted + onRequest + missing ≠ N', () => {
    expect(checkI5({ ...SELECTION, priceMissingCount: 1 }).ok).toBe(false);
  });

  it('I6 — evaluated + notEvaluated ≠ priceQuotedCount', () => {
    expect(checkI6({ ...SELECTION, outlierNotEvaluatedCount: 1 }).ok).toBe(false);
  });

  it('I7 — Σ cellules ≠ n_e', () => {
    expect(checkI7(CELLS, 2, YEAR_MAP).ok).toBe(false);
  });

  it('I7 — une colonne d’année dont la somme ne vaut pas l’effectif du bin d’année', () => {
    expect(checkI7(CELLS, 1, new Map<number, number>([[0, 2]])).ok).toBe(false);
  });

  it('I8 — BIN dépend de l’ordre d’arrivée', () => {
    const binOrdered = (values: readonly number[]): readonly { lowerBound: number; upperBound: number }[] => [
      { lowerBound: values[0] ?? 0, upperBound: values[values.length - 1] ?? 0 },
    ];
    expect(checkI8(binOrdered, [10, 20, 30]).ok).toBe(false);
  });

  it('I8 — min(V) hors du premier bin émis', () => {
    const binShifted = (values: readonly number[]): readonly { lowerBound: number; upperBound: number }[] => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      return [
        { lowerBound: min + 1, upperBound: max },
        { lowerBound: min + 1, upperBound: max },
      ];
    };
    expect(checkI8(binShifted, [10, 20, 30]).ok).toBe(false);
  });
});

describe('D2 — I2 / I7 : couverture des mutations structurelles', () => {
  it('R-D2-06 — I2 détecte un agrégat modèle orphelin (marque absente des agrégats marque)', () => {
    // `checkI2` n'itère que sur les agrégats MARQUE : un agrégat modèle rattaché à une marque
    // absente de `makeAggregates` n'est jamais confronté, l'effectif orphelin passe.
    expect(checkI2(MAKES, [{ makeId: 1, listingCount: 1 }, { makeId: 99, listingCount: 7 }]).ok).toBe(false);
  });

  it('R-D2-07 — I7 détecte une colonne d’année entièrement absente de la grille', () => {
    // `checkI7` n'itère que sur les indices d'année PRÉSENTS dans les cellules : un bin d'année
    // qui a perdu toutes ses cellules n'est jamais confronté à `yearBucketCountByIndex`.
    expect(checkI7(CELLS, 1, new Map<number, number>([[0, 1], [1, 4]])).ok).toBe(false);
  });
});
