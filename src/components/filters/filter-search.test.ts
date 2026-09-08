import { describe, expect, it } from 'vitest';

import { searchFilters } from './filter-search';

describe('searchFilters — EX-SCR-79 (trois index : libellé, param, id)', () => {
  it('trouve un filtre par son libellé français', () => {
    const { matches } = searchFilters('Carburant');
    expect(matches.some((m) => m.id === 'fuelType')).toBe(true);
  });

  it('trouve un filtre par son nom de paramètre d’URL (utilisateur avancé)', () => {
    const { matches } = searchFilters('kmto');
    expect(matches.some((m) => m.id === 'mileageTo')).toBe(true);
  });

  it('trouve un filtre par son identifiant KYCAR', () => {
    const { matches } = searchFilters('sellerType');
    expect(matches.some((m) => m.id === 'sellerType')).toBe(true);
  });

  it('est insensible à la casse', () => {
    expect(searchFilters('CARBURANT').matches.length).toBe(searchFilters('carburant').matches.length);
  });

  it('une chaîne vide ne retourne aucune correspondance et aucun groupe à déplier', () => {
    const r = searchFilters('   ');
    expect(r.matches).toHaveLength(0);
    expect(r.groupsToExpand.size).toBe(0);
  });

  it('déplie tous les groupes contenant au moins une correspondance', () => {
    const r = searchFilters('leasing');
    expect(r.groupsToExpand.has('financement')).toBe(true);
  });

  it('aucune correspondance pour une chaîne absurde', () => {
    expect(searchFilters('zzzzznocorrespondance').matches).toHaveLength(0);
  });
});
