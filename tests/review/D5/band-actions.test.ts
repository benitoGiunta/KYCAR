/**
 * Sonde de revue D5 — actions de la zone (4) et réinitialisations : retrait unitaire
 * (`EX-SCR-76`, recette d'`EX-SCR-102`) et réinitialisation par groupe (`EX-SRCH-19`).
 */
import { describe, expect, it } from 'vitest';

import { buildSecondaryGroups, countActiveFilters } from '../../../src/components/filters/band-model';
import { buildActiveFilterTokens } from '../../../src/components/filters/labels';
import { FILTER_DEFAULTS } from '../../../src/state/filter-registry';
import { serializeQuery } from '../../../src/state/url-codec';

const OPTS = { filterDefaults: FILTER_DEFAULTS } as const;

describe('D5 — EX-SCR-75/77 : jetons et « Tout effacer »', () => {
  it('EX-SCR-75 — le format des jetons suit la table normative (1, 2, ≥ 3 valeurs, intervalle, booléen)', () => {
    expect(buildActiveFilterTokens({ fuelType: ['B'] })[0]?.text).toBe('Essence');
    expect(buildActiveFilterTokens({ fuelType: ['B', 'D'] })[0]?.text).toBe('Essence, Diesel');
    const three = buildActiveFilterTokens({ fuelType: ['B', 'D', 'E'] })[0];
    expect(three?.text).toBe('Carburant : 3 valeurs');
    expect(three?.tooltip).toBe('Essence, Diesel, Electrique');
    expect(buildActiveFilterTokens({ mileageTo: 100_000 })[0]?.text).toBe('≤ 100 000 km');
    expect(buildActiveFilterTokens({ vatReportable: '1' })[0]?.text).toBe('TVA déductible / récupérable');
  });

  it('EX-SCR-77 / EX-SRCH-18 — « Tout effacer » laisse une URL sans aucun paramètre de filtre', () => {
    const selection = { fuelType: ['B', 'D'], priceFrom: 5_000, hasLeasing: '1' };
    expect(serializeQuery(selection, {}, OPTS).length).toBeGreaterThan(0);
    expect(serializeQuery({}, {}, OPTS)).toBe('');
    expect(countActiveFilters({})).toBe(0);
  });

  it('EX-SCR-76 — retirer un intervalle retire ses DEUX bornes en un seul geste', () => {
    const token = buildActiveFilterTokens({ priceFrom: 5_000, priceTo: 25_000 })[0];
    expect(token?.filterIds).toEqual(['priceFrom', 'priceTo']);
  });
});

describe('R-D5-22 — EX-SCR-76 : le retrait unitaire d’une valeur multi-valeurs est impossible', () => {
  it('R-D5-22 — un filtre à 3 valeurs doit offrir 3 retraits adressables séparément', () => {
    const tokens = buildActiveFilterTokens({ fuelType: ['B', 'D', 'E'] });
    // Recette d'EX-SCR-102 : « retrait unitaire fonctionnel ». Le jeton unique porte
    // `filterIds: ['fuelType']` : cliquer sa croix retire les trois valeurs d'un coup.
    expect(tokens).toHaveLength(3);
  });
});

describe('R-D5-21 — EX-SRCH-19 : aucun bouton de réinitialisation par groupe', () => {
  it('R-D5-21 — le modèle de vue d’un groupe n’expose pas les filtres à vider', () => {
    const group = buildSecondaryGroups({ fuelType: ['B'] })[0];
    expect(group).toBeDefined();
    expect(Object.keys(group ?? {})).toContain('resetFilterIds');
  });
});
