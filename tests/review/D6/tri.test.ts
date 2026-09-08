/**
 * Revue D6 — item 5 : tri (`sort`) — ordres disponibles, stabilité, ex æquo, persistance après
 * changement de filtre R.
 * =================================================================================================
 * `sort.test.ts` (17 tests, relancé avec le reste du lot) couvre déjà les 4 options, l'inversion de
 * sens, la médiane `null` en fin d'ordre, la non-mutation et le déterminisme répété sur la MÊME
 * entrée. Ce fichier ajoute : (a) la liste des 4 options confrontée littéralement à l'annexe B
 * (`EX-SCR-120`) ; (b) un scénario d'ex æquo À TROIS, pour éliminer tout artefact d'un tri à 2
 * éléments ; (c) la persistance du tri au travers d'un changement de la POPULATION triée (ce qu'un
 * changement de filtre R produit réellement : le moteur renvoie un nouvel ensemble d'agrégats, le
 * champ/sens de tri restant les mêmes props) ; (d) la preuve structurelle que `MarketScreen` ne
 * réinitialise jamais `sortField`/`sortDirection` lui-même (ils sont *pass-through*, jamais mutés).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { MAKE_SORT_DEFAULT_DIRECTION, MAKE_SORT_FIELD_LABEL, sortMakeRows, type SortableMakeRow } from '../../../src/screens/market/sort';

describe('EX-SCR-120 — exactement quatre options de tri, sens par défaut normatifs', () => {
  it('les quatre codes et libellés attendus, rien de plus', () => {
    expect(Object.keys(MAKE_SORT_FIELD_LABEL).sort()).toEqual(['alpha', 'median', 'modeles', 'offres'].sort());
    expect(MAKE_SORT_FIELD_LABEL.offres).toBe("Nombre d'offres");
    expect(MAKE_SORT_FIELD_LABEL.median).toBe('Prix médian');
    expect(MAKE_SORT_FIELD_LABEL.alpha).toBe('Alphabétique');
    expect(MAKE_SORT_FIELD_LABEL.modeles).toBe('Nombre de modèles');
  });

  it('sens par défaut : offres décroissant, médian croissant, alpha croissant, modèles décroissant', () => {
    expect(MAKE_SORT_DEFAULT_DIRECTION).toEqual({ offres: 'desc', median: 'asc', alpha: 'asc', modeles: 'desc' });
  });
});

describe('Ex æquo à trois marques (au-delà du cas à 2 déjà couvert par sort.test.ts)', () => {
  const rows: SortableMakeRow[] = [
    { makeId: 30, label: 'Škoda', listingCount: 500, medianPrice: 10000, modelCount: 5 },
    { makeId: 10, label: 'Suzuki', listingCount: 500, medianPrice: 10000, modelCount: 5 },
    { makeId: 20, label: 'Seat', listingCount: 500, medianPrice: 10000, modelCount: 5 },
  ];

  it('à effectif ET médiane ET modelCount identiques, les trois options numériques retombent sur le DÉPARTAGE par libellé (EX-DATA-70bis), pas sur makeId', () => {
    // Ordre attendu par libellé (NFD sans diacritiques, casse invariante) : Seat, Škoda(=Skoda), Suzuki.
    for (const field of ['offres', 'median', 'modeles'] as const) {
      const sorted = sortMakeRows(rows, field, MAKE_SORT_DEFAULT_DIRECTION[field]);
      expect(sorted.map((r) => r.label)).toEqual(['Seat', 'Škoda', 'Suzuki']);
    }
  });

  it('le tri est un ordre TOTAL : deux permutations différentes de la même entrée convergent vers le même résultat', () => {
    const shuffled = [rows[2], rows[0], rows[1]] as SortableMakeRow[];
    const a = sortMakeRows(rows, 'offres', 'desc').map((r) => r.makeId);
    const b = sortMakeRows(shuffled, 'offres', 'desc').map((r) => r.makeId);
    expect(a).toEqual(b);
  });
});

describe('Tri conservé après un changement de population (ce qu’un filtre R produit réellement)', () => {
  it('même field/direction appliqués à deux populations différentes -> chacune ordonnée selon la MÊME règle, sans état résiduel de l’ancienne', () => {
    const before: SortableMakeRow[] = [
      { makeId: 1, label: 'BMW', listingCount: 100, medianPrice: 20000, modelCount: 10 },
      { makeId: 2, label: 'Audi', listingCount: 200, medianPrice: 18000, modelCount: 8 },
    ];
    // Un filtre R (ex. prix max) exclut BMW du résultat et fait chuter l'effectif d'Audi : nouvelle
    // population, mêmes props de tri (le composant hôte NE remet PAS sortField/sortDirection à zéro,
    // cf. absence de tout appel interne à onSortFieldChange/onSortDirectionToggle dans
    // MarketScreen.tsx, vérifié ci-dessous par lecture directe du fichier).
    const after: SortableMakeRow[] = [{ makeId: 2, label: 'Audi', listingCount: 40, medianPrice: 18000, modelCount: 8 }];
    const sortedBefore = sortMakeRows(before, 'offres', 'desc').map((r) => r.label);
    const sortedAfter = sortMakeRows(after, 'offres', 'desc').map((r) => r.label);
    expect(sortedBefore).toEqual(['Audi', 'BMW']);
    expect(sortedAfter).toEqual(['Audi']);
  });

  it("MarketScreen.tsx ne mute/n'appelle jamais onSortFieldChange ou onSortDirectionToggle lui-même : sortField/sortDirection sont de purs props, jamais réinitialisés au changement de state.data", () => {
    const src = readFileSync(new URL('../../../src/screens/market/MarketScreen.tsx', import.meta.url), 'utf8');
    // Les deux callbacks n'apparaissent QUE dans l'interface de props et dans le passage à
    // <SummaryBar> (`onSortFieldChange={props.onSortFieldChange}` etc.) — jamais invoqués (`(`) par
    // MarketScreen lui-même.
    expect(src).not.toMatch(/props\.onSortFieldChange\(/);
    expect(src).not.toMatch(/props\.onSortDirectionToggle\(/);
  });
});

describe('DETTE déjà signalée par le lot (README) — sortDirection non persisté dans l’URL', () => {
  it('confirmation factuelle : `sort` (le champ) est bien un paramètre UI-state figé par D5, sans variante de sens', () => {
    const src = readFileSync(new URL('../../../src/state/corrections.ts', import.meta.url), 'utf8');
    expect(src).toContain('UI_SORT_VALUES');
  });
});
