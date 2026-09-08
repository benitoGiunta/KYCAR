import { describe, expect, it } from 'vitest';

import {
  compareLabels,
  compareMakeRows,
  compareModelRows,
  sortMakeRows,
  sortModelRows,
  type SortableMakeRow,
  type SortableModelRow,
} from './sort';

describe('compareLabels — EX-DATA-70bis', () => {
  it("classe Škoda avec Skoda, sans dépendre d'une collation locale (justification d'EX-SCR-119)", () => {
    expect(compareLabels('Škoda', 'Skoda')).toBe(0);
  });

  it("compare lexicographiquement, jamais numériquement : Série 3 précède Série 30", () => {
    expect(compareLabels('Série 3', 'Série 30')).toBeLessThan(0);
  });

  it('est insensible à la casse via une mise en majuscule invariante de locale', () => {
    expect(compareLabels('bmw', 'BMW')).toBe(0);
  });

  it('trie deux libellés simples dans l’ordre attendu', () => {
    expect(compareLabels('Audi', 'BMW')).toBeLessThan(0);
    expect(compareLabels('BMW', 'Audi')).toBeGreaterThan(0);
  });
});

describe('compareMakeRows / sortMakeRows — EX-SCR-119/120, EX-DATA-70/70ter', () => {
  const rows: SortableMakeRow[] = [
    { makeId: 3, label: 'Volkswagen', listingCount: 12480, medianPrice: 18900, modelCount: 34 },
    { makeId: 1, label: 'BMW', listingCount: 9105, medianPrice: 24500, modelCount: 28 },
    { makeId: 2, label: 'Audi', listingCount: 9105, medianPrice: 21000, modelCount: 19 },
  ];

  it("ordre par défaut : effectif d'offres décroissant (EX-SCR-119)", () => {
    const sorted = sortMakeRows(rows, 'offres', 'desc');
    expect(sorted.map((r) => r.label)).toEqual(['Volkswagen', 'Audi', 'BMW']);
  });

  it('égalité d’effectif départagée par libellé croissant, puis makeId (EX-DATA-70)', () => {
    // BMW et Audi sont à égalité (9 105) : Audi (libellé) doit précéder BMW.
    const sorted = sortMakeRows(rows, 'offres', 'desc');
    expect(sorted[1]?.label).toBe('Audi');
    expect(sorted[2]?.label).toBe('BMW');
  });

  it('prix médian croissant par défaut (EX-SCR-120)', () => {
    // Volkswagen 18 900 < Audi 21 000 < BMW 24 500.
    const sorted = sortMakeRows(rows, 'median', 'asc');
    expect(sorted.map((r) => r.label)).toEqual(['Volkswagen', 'Audi', 'BMW']);
  });

  it('alphabétique croissant', () => {
    const sorted = sortMakeRows(rows, 'alpha', 'asc');
    expect(sorted.map((r) => r.label)).toEqual(['Audi', 'BMW', 'Volkswagen']);
  });

  it('nombre de modèles décroissant', () => {
    const sorted = sortMakeRows(rows, 'modeles', 'desc');
    expect(sorted.map((r) => r.label)).toEqual(['Volkswagen', 'BMW', 'Audi']);
  });

  it('le bouton d’inversion applique le sens contraire pour chaque option', () => {
    expect(sortMakeRows(rows, 'offres', 'asc').map((r) => r.label)).toEqual(['Audi', 'BMW', 'Volkswagen']);
    expect(sortMakeRows(rows, 'alpha', 'desc').map((r) => r.label)).toEqual(['Volkswagen', 'BMW', 'Audi']);
  });

  it('une médiane null (prix sur demande partout) place la marque en fin, dans les deux sens', () => {
    const withNull: SortableMakeRow[] = [
      { makeId: 1, label: 'Alpha', listingCount: 5, medianPrice: null, modelCount: 1 },
      { makeId: 2, label: 'Beta', listingCount: 5, medianPrice: 15000, modelCount: 1 },
    ];
    expect(sortMakeRows(withNull, 'median', 'asc').map((r) => r.label)).toEqual(['Beta', 'Alpha']);
    expect(sortMakeRows(withNull, 'median', 'desc').map((r) => r.label)).toEqual(['Beta', 'Alpha']);
  });

  it('le tri est total et déterministe : deux tris successifs produisent le même ordre (EX-SCR-119)', () => {
    const a = sortMakeRows(rows, 'offres', 'desc').map((r) => r.makeId);
    const b = sortMakeRows(rows, 'offres', 'desc').map((r) => r.makeId);
    expect(a).toEqual(b);
  });

  it('ne mute jamais le tableau d’entrée', () => {
    const copy = [...rows];
    sortMakeRows(rows, 'alpha', 'asc');
    expect(rows).toEqual(copy);
  });
});

describe('compareModelRows / sortModelRows — EX-SCR-121, EX-DATA-72', () => {
  it('trie par effectif décroissant', () => {
    const rows: SortableModelRow[] = [
      { modelId: 10, label: 'Polo', listingCount: 2410 },
      { modelId: 11, label: 'Golf', listingCount: 3120 },
    ];
    expect(sortModelRows(rows).map((r) => r.label)).toEqual(['Golf', 'Polo']);
  });

  it("modelId = 0 (« Modèle non identifié ») est TOUJOURS en dernier, même à effectif supérieur", () => {
    const rows: SortableModelRow[] = [
      { modelId: 0, label: 'Modèle non identifié', listingCount: 99999 },
      { modelId: 11, label: 'Golf', listingCount: 1 },
    ];
    expect(sortModelRows(rows).map((r) => r.modelId)).toEqual([11, 0]);
  });

  it('égalité d’effectif départagée par libellé puis modelId', () => {
    const rows: SortableModelRow[] = [
      { modelId: 2, label: 'Golf', listingCount: 100 },
      { modelId: 1, label: 'Caddy', listingCount: 100 },
    ];
    expect(sortModelRows(rows).map((r) => r.label)).toEqual(['Caddy', 'Golf']);
  });

  it('directement testable via le comparateur (utilisé aussi par le moteur pour cohérence)', () => {
    expect(compareModelRows({ modelId: 1, label: 'A', listingCount: 5 }, { modelId: 0, label: 'Modèle non identifié', listingCount: 5 })).toBeLessThan(0);
  });
});
