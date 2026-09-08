import { describe, expect, it } from 'vitest';

import { EXPOSED_FILTER_DEFS, FILTER_BY_ID } from '../../state/filter-registry';
import type { SelectionState } from '../../state/filter-types';
import {
  ACCORDION_GROUP_ORDER,
  buildPrimaryControls,
  buildSecondaryGroups,
  countActiveFilters,
  defaultExpandedGroups,
  isControlDisabled,
  isFilterActive,
} from './band-model';

describe('buildPrimaryControls — EX-SCR-59 (9 contrôles, 13 paramètres)', () => {
  const groups = buildPrimaryControls();

  it('produit les neuf contrôles de la table EX-SCR-59, plus le champ mot-clé (kwd) qu’elle en distingue explicitement', () => {
    // EX-SCR-59 : « Les filtres primaires sont exactement neuf contrôles couvrant douze paramètres
    // d'URL, PLUS le champ de recherche par mot-clé » — `keyword` est primaire (zone 2, EX-SCR-71)
    // mais nommément distinct des « neuf contrôles » du tableau normatif ; il compte donc comme un
    // dixième groupe ici plutôt que d'être exclu du bandeau.
    expect(groups).toHaveLength(10);
    const nineControlsOnly = groups.filter((g) => g.key !== 'keyword');
    expect(nineControlsOnly).toHaveLength(9);
    const paramsOfNine = nineControlsOnly.reduce((n, g) => n + g.defs.length, 0);
    expect(paramsOfNine).toBe(12);
  });

  it('couvre exactement les 13 paramètres primaires, sans doublon', () => {
    const ids = groups.flatMap((g) => g.defs.map((d) => d.id));
    expect(new Set(ids).size).toBe(13);
    expect(ids).toHaveLength(13);
  });

  it('regroupe chaque couple from/to primaire en un seul contrôle à deux champs', () => {
    const price = groups.find((g) => g.key === 'priceFrom');
    expect(price?.defs.map((d) => d.id)).toEqual(['priceFrom', 'priceTo']);
    const km = groups.find((g) => g.key === 'mileageFrom');
    expect(km?.defs.map((d) => d.id)).toEqual(['mileageFrom', 'mileageTo']);
    const freg = groups.find((g) => g.key === 'dateOfRegistrationFrom');
    expect(freg?.defs.map((d) => d.id)).toEqual(['dateOfRegistrationFrom', 'dateOfRegistrationTo']);
  });

  it('n’ajoute jamais un contrôle isolé pour la borne "to" déjà consommée par son couple', () => {
    const asToKey = groups.find((g) => g.key === 'priceTo');
    expect(asToKey).toBeUndefined();
  });
});

describe('buildSecondaryGroups — ordre EX-SCR-93, hors tri/liste_annonces', () => {
  it('exclut les groupes tri et liste_annonces de l’accordéon', () => {
    expect(ACCORDION_GROUP_ORDER).not.toContain('tri');
    expect(ACCORDION_GROUP_ORDER).not.toContain('liste_annonces');
  });

  it('couvre tous les filtres exposés à travers les groupes de l’accordéon', () => {
    const groups = buildSecondaryGroups({});
    const total = groups.reduce((n, g) => n + g.defs.length, 0);
    const expectedTotal = EXPOSED_FILTER_DEFS.filter(
      (d) => d.group !== 'tri' && d.group !== 'liste_annonces',
    ).length;
    expect(total).toBe(expectedTotal);
  });

  it('respecte l’ordre normatif des groupes (EX-SCR-93)', () => {
    const groups = buildSecondaryGroups({});
    expect(groups.map((g) => g.key)).toEqual(ACCORDION_GROUP_ORDER);
  });

  it('compte les filtres actifs par groupe (EX-SCR-92)', () => {
    const selection: SelectionState = { fuelType: 'D', vatReportable: '1' };
    const groups = buildSecondaryGroups(selection);
    const motorisation = groups.find((g) => g.key === 'motorisation');
    const prix = groups.find((g) => g.key === 'prix');
    expect(motorisation?.activeCount).toBe(1);
    expect(prix?.activeCount).toBe(1);
    const geographie = groups.find((g) => g.key === 'geographie');
    expect(geographie?.activeCount).toBe(0);
  });
});

describe('defaultExpandedGroups — EX-SCR-92 (déplié si au moins un actif)', () => {
  it('ne déplie aucun groupe sans filtre actif', () => {
    expect(defaultExpandedGroups({}).size).toBe(0);
  });

  it('déplie uniquement les groupes portant un filtre actif', () => {
    const expanded = defaultExpandedGroups({ fuelType: 'D' });
    expect(expanded.has('motorisation')).toBe(true);
    expect(expanded.has('geographie')).toBe(false);
  });
});

describe('isFilterActive / countActiveFilters — EX-SCR-91', () => {
  it('un filtre à sa valeur par défaut non-absence ne compte pas', () => {
    const def = FILTER_BY_ID.get('powerType')!;
    expect(isFilterActive(def, { powerType: 'kw' })).toBe(false);
    expect(isFilterActive(def, { powerType: 'hp' })).toBe(true);
  });

  it('un filtre de classe D ne compte jamais, même "posé"', () => {
    const def = FILTER_BY_ID.get('hadAccidentNew')!;
    expect(isFilterActive(def, { hadAccidentNew: 'include' })).toBe(false);
  });

  it('countActiveFilters compte chaque filtre posé, y compris chaque borne d’un couple séparément', () => {
    expect(countActiveFilters({ priceFrom: 1000, priceTo: 2000, fuelType: 'D' })).toBe(3);
  });

  it('countActiveFilters ignore les valeurs vides', () => {
    expect(countActiveFilters({ fuelType: [], keyword: '' })).toBe(0);
  });
});

describe('isControlDisabled — EX-SCR-88 (a, b)', () => {
  it('désactive un filtre de classe D quel que soit le mode', () => {
    const def = FILTER_BY_ID.get('region')!;
    expect(isControlDisabled(def, {}, 'mode1')).toBe(true);
    expect(isControlDisabled(def, {}, 'mode2')).toBe(true);
  });

  it('désactive un filtre dépendant tant que son parent n’est pas posé', () => {
    const def = FILTER_BY_ID.get('radius')!; // dépend de `location`
    expect(isControlDisabled(def, {}, 'mode1')).toBe(true);
    expect(isControlDisabled(def, { location: '1000' }, 'mode1')).toBe(false);
  });

  it('active la carrosserie (classe dynamique) en mode 1, la désactive-pas en mode 2 (T ≠ D)', () => {
    const def = FILTER_BY_ID.get('bodyType')!;
    expect(isControlDisabled(def, {}, 'mode1')).toBe(false);
    expect(isControlDisabled(def, {}, 'mode2')).toBe(false); // classe T, pas D : le contrôle reste actif hors ligne mis à part
  });
});
