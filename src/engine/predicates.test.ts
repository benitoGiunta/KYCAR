import { beforeAll, describe, expect, it } from 'vitest';
import type { ListingColumnBatch } from '../types/index';
import { HP_TO_KW, hpToKw, NUMERIC_UNKNOWN } from '../types/index';
import { compilePredicate, type RefinePredicate } from './predicates';
import { loadReferenceData, openSyntheticProvider } from './testkit';

/**
 * Lot D4 — `EX-SRCH-11bis` / `ARB-33` : unité d'évaluation d'un prédicat (DR-008).
 *
 * Tout prédicat s'évalue sur le champ CANONIQUE dans son unité canonique (`EX-DATA-4`) ; une borne
 * saisie dans une unité d'affichage (`powertype = hp`) est convertie vers l'unité canonique **sans
 * arrondi intermédiaire**, avec la seule constante d'EX-DATA-36 (`HP_TO_KW = 0,7355`, DIN 66036).
 * Le pendant côté provider est `compileSelection`, qui consomme le MÊME symbole `hpToKw`.
 */

let batch: ListingColumnBatch;

beforeAll(async () => {
  const provider = await openSyntheticProvider(loadReferenceData(), 3000, 5);
  batch = provider.getDataset().batch;
});

const range = (min: number | null, max: number | null, unit?: 'canonical' | 'hp'): RefinePredicate => ({
  kind: 'range',
  filterId: 'power',
  column: 'powerKw',
  min,
  max,
  ...(unit === undefined ? {} : { unit }),
});

const countMatching = (predicate: RefinePredicate): number => {
  const compiled = compilePredicate(batch, predicate);
  let n = 0;
  for (let r = 0; r < batch.rowCount; r++) if (compiled.test(r)) n++;
  return n;
};

describe('EX-SRCH-11bis — conversion d’unité avant évaluation du prédicat', () => {
  it('la constante de conversion est celle d’EX-DATA-36 et ne s’arrondit pas', () => {
    expect(HP_TO_KW).toBe(0.7355);
    // Produit EXACT en double précision, sans arrondi intermédiaire : 100 × 0,7355 vaut
    // 73,55000000000001 en IEEE 754 et c'est cette valeur qui sert de seuil, pas 73,55 arrondi.
    expect(hpToKw(100)).toBe(100 * 0.7355);
    expect(hpToKw(100)).not.toBe(Math.round(hpToKw(100) * 100) / 100);
    expect(hpToKw(136)).toBe(136 * 0.7355);
  });

  it('une borne basse de 100 ch retient STRICTEMENT plus de lignes qu’une borne de 100 kW', () => {
    const enKw = countMatching(range(100, null));
    const enCh = countMatching(range(100, null, 'hp'));
    let entre = 0;
    for (let r = 0; r < batch.rowCount; r++) {
      const p = batch.powerKw[r] as number;
      if (p === NUMERIC_UNKNOWN) continue;
      if (p >= hpToKw(100) && p < 100) entre++;
    }
    expect(entre).toBeGreaterThan(0); // la population encadre bien le seuil converti
    expect(enCh).toBe(enKw + entre);
    expect(enCh).toBeGreaterThan(enKw);
  });

  it('la borne haute suit la même conversion', () => {
    const enKw = countMatching(range(null, 100));
    const enCh = countMatching(range(null, 100, 'hp'));
    expect(enCh).toBeLessThan(enKw);
  });

  it('l’unité chevaux n’est admise que sur la colonne de puissance', () => {
    const wrong: RefinePredicate = { kind: 'range', filterId: 'price', column: 'priceEur', min: 1, max: 2, unit: 'hp' };
    expect(() => compilePredicate(batch, wrong)).toThrow(/inapplicable/);
  });
});
