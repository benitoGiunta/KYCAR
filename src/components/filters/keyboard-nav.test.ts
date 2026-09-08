import { describe, expect, it } from 'vitest';

import { EXPOSED_FILTER_DEFS } from '../../state/filter-registry';
import type { SelectionState } from '../../state/filter-types';
import {
  SCREEN_G_TAB_ORDER,
  computeBandTabOrder,
  isActivationKey,
  moveRovingIndex,
  nextScreenGStop,
  switchScreenGPanelOnArrow,
  tabStopKey,
} from './keyboard-nav';

describe('computeBandTabOrder — EX-NFR-14 (ordre de tabulation = ordre visuel)', () => {
  it('commence par les 9 contrôles primaires puis le champ de recherche', () => {
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection: {},
      expandedGroups: new Set(),
      activeTokenFilterIds: [],
    });
    expect(stops[0]).toEqual({ kind: 'primary', filterId: 'makesModelsVariants' });
    const searchIdx = stops.findIndex((s) => s.kind === 'search');
    const firstGroupToggleIdx = stops.findIndex((s) => s.kind === 'group-toggle');
    expect(searchIdx).toBeGreaterThan(0);
    expect(firstGroupToggleIdx).toBeGreaterThan(searchIdx);
  });

  it('Tab ne pénètre jamais un groupe replié (EX-SCR-99) : aucun arrêt "filter" hors groupe déplié', () => {
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection: {},
      expandedGroups: new Set(), // aucun groupe déplié
      activeTokenFilterIds: [],
    });
    expect(stops.some((s) => s.kind === 'filter')).toBe(false);
    // Les boutons de repliement, eux, restent atteignables.
    expect(stops.some((s) => s.kind === 'group-toggle')).toBe(true);
  });

  it('déplier un groupe ajoute exactement ses filtres actionnables à l’ordre de tabulation', () => {
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection: {},
      expandedGroups: new Set(['vendeur']),
      activeTokenFilterIds: [],
    });
    const vendeurFilters = EXPOSED_FILTER_DEFS.filter((d) => d.group === 'vendeur');
    const rendered = stops.filter((s) => s.kind === 'filter' && s.group === 'vendeur');
    expect(rendered).toHaveLength(vendeurFilters.length);
  });

  it('exclut un filtre de classe D de l’ordre de tabulation, même le groupe déplié', () => {
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection: {},
      expandedGroups: new Set(['etat_historique']),
      activeTokenFilterIds: [],
    });
    expect(stops.some((s) => s.kind === 'filter' && s.filterId === 'hadAccidentNew')).toBe(false);
  });

  it('exclut un filtre dont la dépendance parente n’est pas satisfaite (EX-SCR-73/88)', () => {
    const withoutParent = computeBandTabOrder({
      mode: 'mode1',
      selection: {},
      expandedGroups: new Set(['geographie']),
      activeTokenFilterIds: [],
    });
    expect(withoutParent.some((s) => s.kind === 'filter' && s.filterId === 'radius')).toBe(false);

    const withParent = computeBandTabOrder({
      mode: 'mode1',
      selection: { location: '1000' } as SelectionState,
      expandedGroups: new Set(['geographie']),
      activeTokenFilterIds: [],
    });
    expect(withParent.some((s) => s.kind === 'filter' && s.filterId === 'radius')).toBe(true);
  });

  it('place les jetons de filtres actifs en dernier, dans l’ordre fourni', () => {
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection: {},
      expandedGroups: new Set(),
      activeTokenFilterIds: ['fuelType', 'priceFrom'],
    });
    const last = stops.slice(-2);
    expect(last).toEqual([
      { kind: 'active-token', filterId: 'fuelType' },
      { kind: 'active-token', filterId: 'priceFrom' },
    ]);
  });

  it('ne produit jamais deux arrêts identiques (pas de doublon de tabulation)', () => {
    const stops = computeBandTabOrder({
      mode: 'mode1',
      selection: { location: '1000' } as SelectionState,
      expandedGroups: new Set(['geographie', 'motorisation', 'vendeur']),
      activeTokenFilterIds: ['fuelType'],
    });
    const keys = stops.map(tabStopKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('moveRovingIndex — activation clavier des listes d’options (EX-NFR-14)', () => {
  it('ArrowDown avance et circule (wrap-around) en orientation verticale', () => {
    expect(moveRovingIndex(0, 3, 'ArrowDown')).toBe(1);
    expect(moveRovingIndex(2, 3, 'ArrowDown')).toBe(0);
  });

  it('ArrowUp recule et circule', () => {
    expect(moveRovingIndex(0, 3, 'ArrowUp')).toBe(2);
    expect(moveRovingIndex(1, 3, 'ArrowUp')).toBe(0);
  });

  it('Home va au premier, End va au dernier', () => {
    expect(moveRovingIndex(1, 5, 'Home')).toBe(0);
    expect(moveRovingIndex(1, 5, 'End')).toBe(4);
  });

  it('orientation horizontale : ArrowRight avance, ArrowLeft recule', () => {
    expect(moveRovingIndex(0, 3, 'ArrowRight', 'horizontal')).toBe(1);
    expect(moveRovingIndex(0, 3, 'ArrowLeft', 'horizontal')).toBe(2);
  });

  it('une touche hors orientation ne change rien', () => {
    expect(moveRovingIndex(1, 3, 'ArrowRight', 'vertical')).toBe(1);
  });

  it('liste vide : index inchangé, jamais d’exception', () => {
    expect(moveRovingIndex(0, 0, 'ArrowDown')).toBe(0);
  });

  it('isActivationKey reconnaît Espace et Entrée, rien d’autre', () => {
    expect(isActivationKey(' ')).toBe(true);
    expect(isActivationKey('Enter')).toBe(true);
    expect(isActivationKey('Tab')).toBe(false);
    expect(isActivationKey('a')).toBe(false);
  });
});

describe('Écran G — piège de focus à 6 arrêts (EX-SCR-216)', () => {
  it('déclare exactement 6 arrêts, dans l’ordre normatif', () => {
    expect(SCREEN_G_TAB_ORDER).toEqual([
      'search-make',
      'list-make',
      'search-model',
      'list-model',
      'cancel',
      'apply',
    ]);
  });

  it('Tab circule vers l’avant et boucle après le dernier arrêt', () => {
    expect(nextScreenGStop('search-make', 1)).toBe('list-make');
    expect(nextScreenGStop('apply', 1)).toBe('search-make');
  });

  it('Shift+Tab circule vers l’arrière et boucle avant le premier arrêt', () => {
    expect(nextScreenGStop('list-make', -1)).toBe('search-make');
    expect(nextScreenGStop('search-make', -1)).toBe('apply');
  });

  it('Flèche droite depuis la liste des marques va à la liste des modèles', () => {
    expect(switchScreenGPanelOnArrow('list-make', 'ArrowRight')).toBe('list-model');
  });

  it('Flèche gauche depuis la liste des modèles revient à la liste des marques', () => {
    expect(switchScreenGPanelOnArrow('list-model', 'ArrowLeft')).toBe('list-make');
  });

  it('les flèches n’ont aucun effet ailleurs que dans les deux listes', () => {
    expect(switchScreenGPanelOnArrow('search-make', 'ArrowRight')).toBeNull();
    expect(switchScreenGPanelOnArrow('cancel', 'ArrowLeft')).toBeNull();
    expect(switchScreenGPanelOnArrow('list-make', 'ArrowLeft')).toBeNull();
  });
});
