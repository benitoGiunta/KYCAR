/**
 * Tests unitaires du brouillon de sélection (`draft.ts`, décision D3-46 (c)).
 */
import { describe, expect, it } from 'vitest';

import {
  cascadeRemoveOrphans,
  countDraftChanges,
  draftChangedFilterIds,
  isDraftDirty,
  planDraftApply,
  rebaseDraft,
  withDraftValue,
  withoutDraftFilters,
} from './draft';
import type { MutableSelectionState } from './filter-types';

describe('isDraftDirty / draftChangedFilterIds — sale ou propre, sur la forme canonique', () => {
  it('brouillon identique à la sélection appliquée : propre', () => {
    expect(isDraftDirty({ priceTo: 20000 }, { priceTo: 20000 })).toBe(false);
    expect(draftChangedFilterIds({}, {})).toEqual([]);
  });

  it('une valeur ajoutée, modifiée ou retirée rend le brouillon sale', () => {
    expect(draftChangedFilterIds({}, { priceTo: 20000 })).toEqual(['priceTo']);
    expect(draftChangedFilterIds({ priceTo: 20000 }, { priceTo: 15000 })).toEqual(['priceTo']);
    expect(draftChangedFilterIds({ priceTo: 20000 }, {})).toEqual(['priceTo']);
  });

  it('l’ordre des cases cochées ne compte pas (EX-NAV-9)', () => {
    expect(isDraftDirty({ bodyType: ['3', '6'] }, { bodyType: ['6', '3'] })).toBe(false);
  });

  it('une valeur posée à son défaut « non-absence » équivaut à l’absence (EX-NAV-8)', () => {
    expect(isDraftDirty({}, { powerType: 'kw' })).toBe(false);
  });
});

describe('countDraftChanges — compté en contrôles, pas en paramètres', () => {
  it('les deux bornes d’un même intervalle comptent pour UNE modification', () => {
    expect(countDraftChanges({}, { priceFrom: 5000, priceTo: 20000 })).toBe(1);
    expect(countDraftChanges({}, { priceFrom: 5000, mileageTo: 100000 })).toBe(2);
    expect(countDraftChanges({ priceTo: 1 }, { priceTo: 1 })).toBe(0);
  });
});

describe('withDraftValue / withoutDraftFilters — édition du brouillon', () => {
  it('pose et retire une valeur sans muter le brouillon d’origine', () => {
    const draft = { priceTo: 20000 };
    const next = withDraftValue(draft, 'mileageTo', 100000);
    expect(next).toEqual({ priceTo: 20000, mileageTo: 100000 });
    expect(draft).toEqual({ priceTo: 20000 });
    expect(withDraftValue(next, 'priceTo', undefined)).toEqual({ mileageTo: 100000 });
  });

  it('retire en cascade les enfants orphelins (DR-059), sans notification', () => {
    const next = withDraftValue({ hasLeasing: '1', leasingRateFrom: 100 }, 'hasLeasing', undefined);
    expect(next).toEqual({});
  });

  it('réinitialiser une carte vide ses filtres dans le brouillon', () => {
    expect(withoutDraftFilters({ priceTo: 1, fuelType: ['B'] }, ['fuelType'])).toEqual({ priceTo: 1 });
  });

  it('cascadeRemoveOrphans rend les identifiants retirés par la cascade', () => {
    const state: MutableSelectionState = { leasingRateFrom: 100 };
    expect(cascadeRemoveOrphans(state)).toEqual(['leasingRateFrom']);
    expect(state).toEqual({});
  });
});

describe('rebaseDraft — la sélection appliquée change sous un brouillon (fusion)', () => {
  it('brouillon propre : il devient exactement la nouvelle base', () => {
    const newBase = { fuelType: ['D'] };
    expect(rebaseDraft({ priceTo: 1 }, { priceTo: 1 }, newBase)).toBe(newBase);
  });

  it('les modifications en attente sont reportées ; le reste suit la nouvelle base', () => {
    // Appliqué : prix ≤ 20 000 et diesel. Brouillon : kilométrage ≤ 100 000 en plus.
    // Puis le jeton « Carburant » est retiré (nouvelle base sans carburant).
    const oldBase = { priceTo: 20000, fuelType: ['D'] };
    const draft = { priceTo: 20000, fuelType: ['D'], mileageTo: 100000 };
    const newBase = { priceTo: 20000 };
    expect(rebaseDraft(oldBase, draft, newBase)).toEqual({ priceTo: 20000, mileageTo: 100000 });
  });

  it('un retrait en attente reste un retrait', () => {
    const oldBase = { priceTo: 20000, fuelType: ['D'] };
    const draft = { fuelType: ['D'] }; // l'utilisateur a vidé le prix, pas encore appliqué
    const newBase = { priceTo: 20000, fuelType: ['D'], bodyType: ['3'] };
    expect(rebaseDraft(oldBase, draft, newBase)).toEqual({ fuelType: ['D'], bodyType: ['3'] });
  });
});

describe('planDraftApply — une application, la scission T/R du lot', () => {
  it('rien de modifié : aucune classe', () => {
    expect(planDraftApply({ priceTo: 1 }, { priceTo: 1 }, 'mode1')).toEqual({ changedFilterIds: [], classes: [] });
  });

  it('des filtres R seuls : recalcul local', () => {
    const plan = planDraftApply({}, { priceTo: 20000, mileageTo: 100000 }, 'mode1');
    expect(plan.changedFilterIds).toEqual(['mileageTo', 'priceTo']);
    expect(plan.classes).toEqual(['R']);
  });

  it('un filtre T dans le lot : le rechargement est engagé', () => {
    const plan = planDraftApply({}, { priceTo: 20000, gearType: ['A'] }, 'mode1');
    expect(plan.classes).toEqual(['R', 'T']);
  });
});
