import { describe, expect, it } from 'vitest';

import { EXPOSED_FILTER_DEFS, FILTER_BY_ID } from '../../state/filter-registry';
import type { SelectionState } from '../../state/filter-types';
import {
  ACCORDION_GROUP_ORDER,
  ALWAYS_VISIBLE_FILTER_KEYS,
  ESSENTIALS_CARD_KEY,
  buildAlwaysVisibleControls,
  buildEssentialControls,
  buildFilterCards,
  buildPrimaryControls,
  cardKeyOf,
  draftApplyLabel,
  draftStatusMessage,
  buildSecondaryGroups,
  countActiveFilters,
  defaultExpandedGroups,
  isControlDisabled,
  isFilterActive,
} from './band-model';

describe('buildPrimaryControls — EX-SCR-59 amendée (8 contrôles, 12 paramètres, DR-138/D-15)', () => {
  const groups = buildPrimaryControls();

  it('produit les huit contrôles de la table EX-SCR-59 amendée, plus le champ mot-clé (kwd) en dernier', () => {
    // `D-15`/`DR-052` : `countryType` (`cy`, 9ᵉ ligne d'`EX-SCR-59`) est retiré de la ligne
    // primaire — valeur injectée vers la source (`EX-SRCH-18bis`/`ARB-30`), jamais un choix
    // utilisateur ; fix-docs porte la requalification documentaire de l'exigence. Il ne reste donc
    // que huit des neuf contrôles d'origine. `keyword` (zone 2, `EX-SCR-71`, `DR-138`) est
    // toujours nommément distinct de la table et compte comme un neuvième groupe, en DERNIÈRE
    // position (et non première) sur la ligne primaire.
    expect(groups).toHaveLength(9);
    const eightControlsOnly = groups.filter((g) => g.key !== 'keyword');
    expect(eightControlsOnly).toHaveLength(8);
    const paramsOfEight = eightControlsOnly.reduce((n, g) => n + g.defs.length, 0);
    expect(paramsOfEight).toBe(11);
    expect(groups.at(-1)?.key).toBe('keyword');
  });

  it('couvre exactement les 12 paramètres primaires, sans doublon', () => {
    const ids = groups.flatMap((g) => g.defs.map((d) => d.id));
    expect(new Set(ids).size).toBe(12);
    expect(ids).toHaveLength(12);
    expect(ids).not.toContain('countryType');
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
    // `powerType` n'illustre plus ce cas : `nonExposed` depuis `DR-052` (`EX-SRCH-18bis`), il ne
    // compte JAMAIS, quelle que soit sa valeur (couvert séparément ci-dessous). `sortTypes`
    // (défaut `standard`) reste un filtre EXPOSÉ à défaut non-absence.
    const def = FILTER_BY_ID.get('sortTypes')!;
    expect(isFilterActive(def, { sortTypes: 'standard' })).toBe(false);
    expect(isFilterActive(def, { sortTypes: 'price' })).toBe(true);
  });

  it('un filtre `nonExposed` ne compte jamais, quelle que soit sa valeur (EX-SRCH-18bis, DR-052)', () => {
    const def = FILTER_BY_ID.get('powerType')!;
    expect(isFilterActive(def, { powerType: 'kw' })).toBe(false);
    expect(isFilterActive(def, { powerType: 'hp' })).toBe(false);
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
    // `radius` ne dépend plus de `location`, retiré du registre par `D-14` (R3) : `crossBorder`
    // (dépend de `radius`) illustre désormais ce cas.
    const def = FILTER_BY_ID.get('crossBorder')!;
    expect(isControlDisabled(def, {}, 'mode1')).toBe(true);
    expect(isControlDisabled(def, { radius: '50' }, 'mode1')).toBe(false);
  });

  it('active la carrosserie (classe dynamique) en mode 1, la désactive-pas en mode 2 (T ≠ D)', () => {
    const def = FILTER_BY_ID.get('bodyType')!;
    expect(isControlDisabled(def, {}, 'mode1')).toBe(false);
    expect(isControlDisabled(def, {}, 'mode2')).toBe(false); // classe T, pas D : le contrôle reste actif hors ligne mis à part
  });
});

describe('D3-46 (a) — trois filtres toujours visibles dans la barre condensée', () => {
  it('Marque et modèle, Prix, Kilométrage — dans l’ordre PRIMARY_ORDER', () => {
    expect(ALWAYS_VISIBLE_FILTER_KEYS).toEqual(['makesModelsVariants', 'priceFrom', 'mileageFrom']);
    expect(buildAlwaysVisibleControls().map((g) => g.key)).toEqual(['makesModelsVariants', 'priceFrom', 'mileageFrom']);
  });

  it('la carte « Essentiels » porte les autres primaires (tous en régime compact)', () => {
    const large = buildEssentialControls('large').map((g) => g.key);
    expect(large).toEqual(['dateOfRegistrationFrom', 'fuelType', 'bodyType', 'gearType', 'sellerType', 'keyword']);
    expect(buildEssentialControls('intermediaire').map((g) => g.key)).toEqual(large);
    expect(buildEssentialControls('compact').map((g) => g.key)).toEqual(buildPrimaryControls().map((g) => g.key));
  });
});

describe('D3-46 (b) — cartes du panneau « Tous les filtres »', () => {
  it('« Essentiels » en tête, puis les groupes dans l’ordre EX-SCR-93, chaque filtre une seule fois', () => {
    const cards = buildFilterCards({}, 'large');
    expect(cards[0]?.key).toBe(ESSENTIALS_CARD_KEY);
    const groupKeys = cards.slice(1).map((c) => c.key);
    expect(groupKeys).toEqual(ACCORDION_GROUP_ORDER.filter((g) => groupKeys.includes(g)));
    // Aucun primaire dans une carte de groupe ; les groupes entièrement primaires n'ont pas de carte.
    for (const c of cards.slice(1)) expect((c.defs ?? []).some((d) => d.primary)).toBe(false);
    expect(groupKeys).not.toContain('kilometrage');
    expect(groupKeys).not.toContain('vendeur');
    expect(cards.length).toBe(13); // « Essentiels » + 12 des 14 groupes d’EX-SCR-93
  });

  it('badge d’actifs par carte, sur les filtres que la carte affiche', () => {
    const cards = buildFilterCards({ fuelType: ['D'], co2EmissionTo: 120, priceTo: 20000 }, 'large');
    const byKey = new Map(cards.map((c) => [c.key, c]));
    expect(byKey.get(ESSENTIALS_CARD_KEY)?.activeCount).toBe(1); // carburant (prix : dans la barre)
    expect(byKey.get('prix')?.activeCount).toBe(0);
  });

  it('la recherche déplie « Essentiels » pour un primaire, la carte du groupe sinon', () => {
    expect(cardKeyOf(FILTER_BY_ID.get('fuelType')!)).toBe(ESSENTIALS_CARD_KEY);
    const secondary = EXPOSED_FILTER_DEFS.find((d) => !d.primary && d.group === 'financement')!;
    expect(cardKeyOf(secondary)).toBe('financement');
  });
});

describe('D3-46 (c) — libellé et annonce du brouillon', () => {
  it('libellé du bouton : effectif prévisionnel, sinon nombre de modifications', () => {
    expect(draftApplyLabel(undefined, 3)).toBe('Appliquer (3 modifications)');
    expect(draftApplyLabel(0, 3)).toBe('Appliquer — 0 offre');
  });

  it('annonce polie : rien quand le brouillon est propre', () => {
    expect(draftStatusMessage(0, 12)).toBe('');
    expect(draftStatusMessage(2, undefined)).toBe('2 modifications en attente, effectif en cours de calcul');
    expect(draftStatusMessage(1, 0)).toBe('1 modification en attente : 0 offre après application');
  });
});
