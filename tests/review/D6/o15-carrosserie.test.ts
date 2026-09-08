/**
 * Revue D6 — item 8 : `O15` — `Model.bodyTypes` vide, dégradation du filtre Carrosserie.
 * =================================================================================================
 * Constat factuel (le point ouvert n'est pas tranché ici, cf. §5 du rapport). Le filtre Carrosserie
 * (`bodyType`, param `body`) est défini et rendu par `src/state/filter-registry.ts` /
 * `src/components/filters/` (lot D5), monté par `FilterBand` — **hors périmètre de ce lot** : D6
 * (`src/screens/market/`) ne référence `bodyType`/`body`/`Carrosserie` NULLE PART dans son propre
 * code (vérifié ci-dessous). D6 ne peut donc dégrader ni bien ni mal ce filtre : il ne le voit pas.
 *
 * Ce que D6 possède réellement de la chaîne causale d'`O15`, c'est l'AVAL : si le filtre Carrosserie
 * (posé ailleurs) réduit la sélection à zéro résultat — le cas prévisible pour TOUTE valeur de
 * `body`, puisque `Model.bodyTypes` vaut `[]` pour tous les modèles et qu'un tableau vide ne
 * satisfait aucun prédicat `body` (`EX-SCR-221`) —, l'écran A doit se dégrader vers `ET-VIDE-FILTRES`
 * (`EX-SCR-26`), un état déjà couvert et générique (`deriveScreenAState`), sans traitement
 * Carrosserie particulier. C'est ce fait qui est prouvé ici.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { deriveScreenAState, type LoadPhase } from '../../../src/screens/market/state';

describe('O15 — périmètre réel de D6 vis-à-vis du filtre Carrosserie', () => {
  it("aucun fichier DE PRODUCTION de src/screens/market/ ne référence bodyType/body/Carrosserie (le filtre est monté par D5, importé tel quel)", () => {
    // Exclut les *.test.ts : leurs fixtures `Model` portent `bodyTypes: []` uniquement parce que ce
    // champ est OBLIGATOIRE sur le type `Model` (src/types/entities.ts) — cela ne signifie pas que
    // la logique de production de D6 lit/consulte ce champ.
    const dir = new URL('../../../src/screens/market/', import.meta.url);
    const files = readdirSync(dir).filter((f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.endsWith('.test.ts'));
    const hits: string[] = [];
    for (const f of files) {
      const content = readFileSync(new URL(f, dir), 'utf8');
      if (/bodyType|Carrosserie/i.test(content)) hits.push(f);
    }
    expect(hits).toEqual([]);
  });

  it('confirmation inverse : les FIXTURES de test, elles, portent bien `bodyTypes: []` (champ obligatoire du type Model, sans rapport avec le filtre)', () => {
    const csvTest = readFileSync(new URL('../../../src/screens/market/csv.test.ts', import.meta.url), 'utf8');
    expect(csvTest).toContain('bodyTypes: []');
  });

  it("confirmation en amont (D2/référentiel, hors D6) : Model.bodyTypes est structurellement [] pour tout modèle — buildTaxonomy ne peuple jamais ce champ", () => {
    const src = readFileSync(new URL('../../../src/types/reference.ts', import.meta.url), 'utf8');
    expect(src).toContain('bodyTypes: rmo.bodyTypes ?? []');
  });

  it("l'aval que D6 possède réellement : un filtre Carrosserie qui vide la sélection dégrade vers ET-VIDE-FILTRES générique (EX-SCR-26), sans branche Carrosserie spécifique — aucune régression à corriger côté D6", () => {
    const load: LoadPhase = {
      phase: 'loaded',
      data: {
        makeAggregates: [],
        modelAggregatesByMake: new Map(),
        hasUserFilters: true,
        activeFilterCount: 1,
        topRestrictiveFilters: [{ filterId: 'bodyType', label: 'Carrosserie', gain: 12480 }],
        snapshotDate: '2026-09-08',
        snapshotListingCount: 0,
        snapshotAnnouncedListingCount: null,
        failedMakeIds: new Set(),
        totalMakesAttempted: 0,
      },
    };
    const state = deriveScreenAState(load);
    expect(state).toEqual({
      kind: 'empty',
      reason: 'filters',
      activeFilterCount: 1,
      topRestrictive: [{ filterId: 'bodyType', label: 'Carrosserie', gain: 12480 }],
    });
  });
});
