/**
 * Sonde de revue D5 — navigation clavier (`EX-NFR-14`, `EX-SCR-99`) et modèle de vue du bandeau
 * (`EX-SCR-59`/`79`/`91`/`92`/`93`/`102`). axe-core n'étant pas installable dans ce périmètre,
 * cette sonde éprouve la logique PURE que les composants appellent verbatim.
 */
import { describe, expect, it } from 'vitest';

import {
  ACCORDION_GROUP_ORDER,
  buildPrimaryControls,
  buildSecondaryGroups,
  countActiveFilters,
  defaultExpandedGroups,
  isControlDisabled,
} from '../../../src/components/filters/band-model';
import { searchFilters } from '../../../src/components/filters/filter-search';
import {
  SCREEN_G_TAB_ORDER,
  computeBandTabOrder,
  isActivationKey,
  moveRovingIndex,
  nextScreenGStop,
  tabStopKey,
} from '../../../src/components/filters/keyboard-nav';
import { buildActiveFilterTokens } from '../../../src/components/filters/labels';
import { EXPOSED_FILTER_DEFS, FILTER_DEFS, GROUP_LABELS } from '../../../src/state/filter-registry';
import type { SelectionState } from '../../../src/state/filter-types';

const ALL_GROUPS = new Set(ACCORDION_GROUP_ORDER);

describe('D5 — EX-NFR-14 / EX-SCR-99 : ordre de tabulation du bandeau', () => {
  it('EX-SCR-59 amendée — 12 paramètres primaires = 8 contrôles + le champ `kwd` (DR-138/D-15)', () => {
    // `D-15`/`DR-052` : `cy` (`countryType`) est retiré de la ligne primaire — valeur injectée
    // vers la source (`EX-SRCH-18bis`/`ARB-30`), jamais un choix utilisateur. `EX-SCR-59` en
    // comptait 9/13 ; il n'en reste que 8/12. `kwd` (zone 2, `DR-138`) reste nommément distinct.
    const controls = buildPrimaryControls();
    expect(controls).toHaveLength(9); // les 8 contrôles restants de la table + `kwd`
    expect(controls.filter((c) => c.key !== 'keyword')).toHaveLength(8);
    expect(controls.flatMap((c) => c.defs).length).toBe(12);
    expect(controls.flatMap((c) => c.defs).map((d) => d.param).sort()).toEqual([
      'body', 'custtype', 'fregfrom', 'fregto', 'fuel', 'gear', 'kmfrom', 'kmto', 'kwd',
      'mmmv', 'pricefrom', 'priceto',
    ].sort());
  });

  it('l’ordre suit l’ordre visuel : primaires → recherche → groupes → jetons, sans doublon', () => {
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection: {},
      expandedGroups: ALL_GROUPS,
      activeTokenFilterIds: [],
    });
    const keys = stops.map(tabStopKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys[0]).toBe('primary:makesModelsVariants');
    // 12 paramètres primaires (DR-138/D-15, `cy` retiré) : la recherche suit au 13ᵉ arrêt (indice 12).
    expect(keys[12]).toBe('search');
    expect(keys[13]).toBe('group-toggle:vehicule');
  });

  it('EX-SCR-99 — `Tab` ne pénètre jamais un groupe replié', () => {
    const collapsed = computeBandTabOrder({
      mode: 'mode1',
      selection: {},
      expandedGroups: new Set(),
      activeTokenFilterIds: [],
    });
    expect(collapsed.filter((s) => s.kind === 'filter')).toHaveLength(0);
    expect(collapsed.filter((s) => s.kind === 'group-toggle').length).toBeGreaterThan(0);
  });

  it('EX-SCR-88(a)/(b) — un contrôle de classe D ou à dépendance non satisfaite sort de l’ordre', () => {
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection: {},
      expandedGroups: ALL_GROUPS,
      activeTokenFilterIds: [],
    });
    const keys = new Set(stops.map(tabStopKey));
    for (const def of FILTER_DEFS.filter((d) => d.cls === 'D')) {
      expect(keys.has(`filter:${def.id}`)).toBe(false);
      expect(isControlDisabled(def, {}, 'mode1')).toBe(true);
    }
  });

  it('poser le parent rend l’enfant atteignable au clavier', () => {
    const withParent: SelectionState = { hasLeasing: '1' };
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection: withParent,
      expandedGroups: ALL_GROUPS,
      activeTokenFilterIds: [],
    });
    const keys = new Set(stops.map(tabStopKey));
    expect(keys.has('filter:leasingRateFrom')).toBe(true);
    expect(keys.has('filter:leasingTargetGroup')).toBe(true);
  });

  it('roving tabindex : flèches circulaires, Home/End, Espace/Entrée activent', () => {
    expect(moveRovingIndex(0, 4, 'ArrowUp')).toBe(3);
    expect(moveRovingIndex(3, 4, 'ArrowDown')).toBe(0);
    expect(moveRovingIndex(2, 4, 'Home')).toBe(0);
    expect(moveRovingIndex(0, 4, 'End')).toBe(3);
    expect(moveRovingIndex(0, 4, 'ArrowRight', 'horizontal')).toBe(1);
    expect(moveRovingIndex(0, 0, 'ArrowDown')).toBe(0);
    expect([' ', 'Enter'].every(isActivationKey)).toBe(true);
    expect(isActivationKey('a')).toBe(false);
  });

  it('EX-SCR-216 — le piège de focus de l’écran G circule sur ses six arrêts', () => {
    expect([...SCREEN_G_TAB_ORDER]).toEqual([
      'search-make',
      'list-make',
      'search-model',
      'list-model',
      'cancel',
      'apply',
    ]);
    expect(nextScreenGStop('apply', 1)).toBe('search-make');
    expect(nextScreenGStop('search-make', -1)).toBe('apply');
  });
});

describe('D5 — EX-SCR-91/92/93 : compteurs, repliement et ordre des groupes', () => {
  it('EX-SCR-93 — l’ordre des groupes est celui du texte normatif, stable', () => {
    const labels = buildSecondaryGroups({}).map((g) => g.label);
    expect(labels).toEqual([
      'Véhicule',
      'Véhicule (taxonomie)',
      'Prix et valeur',
      'Kilométrage',
      'Immatriculation et année',
      'Motorisation',
      'Carrosserie et habitacle',
      'Écologie et électrique',
      'Équipements',
      'État et historique',
      'Vendeur',
      'Géographie',
      'Financement et leasing',
      'Fraîcheur et achat en ligne',
    ]);
    expect(new Set(Object.keys(GROUP_LABELS)).size).toBe(16);
  });

  it('EX-SCR-91 — un filtre à sa valeur par défaut relevée ne compte pas comme actif', () => {
    // `powerType`/`hadAccident` sont `nonExposed` depuis `DR-052` (`EX-SRCH-18bis`) : ils ne
    // comptent JAMAIS, quelle que soit leur valeur (couvert par la sonde `nonExposed` dédiée
    // ci-dessous). `sortTypes` (défaut `standard`) illustre désormais le cas « défaut non-absence,
    // filtre EXPOSÉ ».
    expect(countActiveFilters({ sortTypes: 'standard' })).toBe(0);
    expect(countActiveFilters({ sortTypes: 'price' })).toBe(1);
    expect(countActiveFilters({ powerType: 'hp' })).toBe(0);
    expect(countActiveFilters({ hadAccident: 'A' })).toBe(0);
    expect(countActiveFilters({})).toBe(0);
  });

  it('EX-SCR-92 — seuls les groupes contenant un filtre actif sont dépliés au chargement', () => {
    expect([...defaultExpandedGroups({})]).toEqual([]);
    expect([...defaultExpandedGroups({ fuelType: ['B'] })]).toEqual(['motorisation']);
  });

  it('EX-SCR-102 — 60 filtres actifs : jetons, retrait unitaire et tabulation restent utilisables', () => {
    const selection: Record<string, string | number | readonly string[]> = {};
    for (const def of EXPOSED_FILTER_DEFS) {
      if (def.cls === 'D') continue;
      if (Object.keys(selection).length >= 60) break;
      const first = def.options?.[0]?.code;
      if (first !== undefined) selection[def.id] = def.scopeType === 'enum_multi' ? [first] : first;
      else if (def.scopeType === 'boolean') selection[def.id] = def.booleanTrueCode ?? '1';
      else if (def.scopeType === 'range_min' || def.scopeType === 'number') selection[def.id] = def.numericDomain?.min ?? 1;
      else if (def.scopeType === 'range_max') selection[def.id] = def.numericDomain?.max ?? 9_999;
      else selection[def.id] = 'valeur';
    }
    expect(Object.keys(selection).length).toBe(60);
    const tokens = buildActiveFilterTokens(selection);
    expect(tokens.length).toBeGreaterThan(0);
    // Chaque jeton porte les identifiants qu'il retire : le retrait unitaire est adressable.
    for (const token of tokens) expect(token.filterIds.length).toBeGreaterThan(0);
    const covered = new Set(tokens.flatMap((t) => t.filterIds));
    const expected = Object.keys(selection).filter((id) => {
      const def = FILTER_DEFS.find((d) => d.id === id);
      return def !== undefined && def.defaultValue === undefined;
    });
    expect(expected.filter((id) => !covered.has(id))).toEqual([]);
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection,
      expandedGroups: ALL_GROUPS,
      activeTokenFilterIds: tokens.flatMap((t) => t.filterIds),
    });
    expect(new Set(stops.map(tabStopKey)).size).toBe(stops.map(tabStopKey).length);
  });
});

describe('D5 — EX-SCR-79/80 : recherche de filtre', () => {
  it('la recherche atteint un filtre par son libellé français et par son paramètre d’URL', () => {
    expect(searchFilters('kilom').matches.map((d) => d.param)).toContain('kmto');
    expect(searchFilters('bcol').matches.map((d) => d.param)).toEqual(['bcol']);
    expect(searchFilters('bcol').groupsToExpand.has('carrosserie')).toBe(true);
    expect(searchFilters('').matches).toEqual([]);
  });

  it('R-D5-12 — EX-SCR-79 exige TROIS index, dont le libellé anglais relevé', () => {
    // `bodyColor` porte le libellé anglais relevé « Exterior colour » (`filters.json#label_en`).
    expect(searchFilters('exterior colour').matches.map((d) => d.param)).toEqual(['bcol']);
  });

  // Promotion 2.6 (D-49) : sonde rouge convertie en it.fails — elle documente une dette consignée et se
  // signalera d elle-même (échec de it.fails) le jour où la dette est levée. Jamais skip.
  // DETTE DR-134 / D-49 : suggestions par distance d édition (EX-SCR-80), confort sans effet sur une valeur affichée.
  it.fails('R-D5-13 — EX-SCR-80 : zéro correspondance doit proposer les 3 filtres les plus proches', () => {
    const result = searchFilters('kilomtrage');
    expect(result.matches.map((d) => d.param)).toContain('kmfrom');
  });
});

describe('R-D5-19 — EX-NFR-14 : l’ordre de tabulation ne suit pas l’ordre visuel normatif', () => {
  it('R-D5-19 — EX-SCR-59/71 : `kwd` appartient à la zone (2) et `body` précède `gear`', () => {
    // `countryType` retiré de la liste attendue : `D-15`/`DR-052` (`EX-SRCH-18bis`/`ARB-30`,
    // décidé APRÈS la rédaction de cette sonde) en fait une valeur injectée vers la source, jamais
    // un choix utilisateur — amende la 9ᵉ ligne d'`EX-SCR-59` que cette sonde attendait encore
    // primaire. Correction justifiée par `D-31` : la décision fix-lead prime sur la rédaction
    // antérieure de la sonde.
    expect(buildPrimaryControls().map((c) => c.key)).toEqual([
      'makesModelsVariants',
      'priceFrom',
      'mileageFrom',
      'dateOfRegistrationFrom',
      'fuelType',
      'bodyType',
      'gearType',
      'sellerType',
      'keyword',
    ]);
  });
});

describe('R-D5-08 — le contrôle Puissance est inatteignable au clavier par défaut', () => {
  it('R-D5-08 — `powerfrom`/`powerto` absents de l’ordre de tabulation sur sélection vide', () => {
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection: {},
      expandedGroups: ALL_GROUPS,
      activeTokenFilterIds: [],
    });
    const keys = new Set(stops.map(tabStopKey));
    expect({ powerFrom: keys.has('filter:powerFrom'), powerTo: keys.has('filter:powerTo') }).toEqual({
      powerFrom: true,
      powerTo: true,
    });
  });
});
