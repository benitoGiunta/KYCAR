/**
 * KYCAR — Navigation clavier du bandeau (lot D5, finition)
 * =================================================================================================
 * `EX-NFR-14` : 100 % des contrôles atteignables et actionnables au clavier seul, ordre de
 * tabulation = ordre visuel, indicateur de focus jamais supprimé (déjà garanti globalement par
 * `src/styles/tokens.css` `:focus-visible`, lot D1 — ce module n'y touche pas).
 *
 * Sans environnement DOM disponible dans ce worktree (pas de `jsdom`/`happy-dom` en dépendance, et
 * `package.json` est hors périmètre de ce lot), ni axe-core exécutable : ce module fournit donc le
 * repli explicitement autorisé par le rapport de lot — des fonctions PURES calculant (a) l'ordre de
 * tabulation attendu à partir de l'état du bandeau, et (b) la logique d'activation par clavier
 * (flèches, Home/End, Échap) — testées unitairement, indépendamment du rendu réel. Les composants
 * Preact de ce dossier appellent CES MÊMES fonctions pour construire leurs gestionnaires
 * `onKeyDown` : le test unitaire et le comportement réel ne peuvent donc pas diverger.
 */

import { isFilterActive, buildPrimaryControls, ACCORDION_GROUP_ORDER } from './band-model';
import { EXPOSED_FILTER_DEFS, isDependencySatisfied, resolveFilterClass } from '../../state/filter-registry';
import type { FilterDef, ScreenMode, SelectionState } from '../../state/filter-types';

/* ================================================================================================
 * Ordre de tabulation du bandeau
 * ============================================================================================== */

export interface BandTabOrderInput {
  readonly mode: ScreenMode;
  readonly selection: SelectionState;
  /** Clés de groupe actuellement dépliées (`EX-SCR-92`). */
  readonly expandedGroups: ReadonlySet<string>;
  /** Filtres portant un jeton actif, dans l'ordre d'affichage de la ligne (4) (`EX-SCR-75`). */
  readonly activeTokenFilterIds: readonly string[];
}

/** Identifiant stable d'un arrêt de tabulation. Un couple d'intervalle produit DEUX arrêts (les
 * deux champs sont séparément focalisables), un filtre scalaire un seul. */
export type TabStop =
  | { readonly kind: 'primary'; readonly filterId: string }
  | { readonly kind: 'search' }
  | { readonly kind: 'group-toggle'; readonly group: string }
  | { readonly kind: 'filter'; readonly filterId: string; readonly group: string }
  | { readonly kind: 'active-token'; readonly filterId: string };

function byGroup(defs: readonly FilterDef[]): Map<string, FilterDef[]> {
  const m = new Map<string, FilterDef[]>();
  for (const d of defs) {
    const bucket = m.get(d.group);
    if (bucket === undefined) m.set(d.group, [d]);
    else bucket.push(d);
  }
  return m;
}

/**
 * Calcule l'ordre de tabulation attendu du bandeau (`EX-NFR-14`) : ligne primaire → recherche →
 * pour chaque groupe (ordre `EX-SCR-93`) son bouton de repliement puis, SEULEMENT s'il est déplié,
 * ses filtres actionnables (`Tab` ne pénètre jamais un groupe replié, `EX-SCR-99`) → jetons actifs.
 * Un filtre dont le contrôle est désactivé (classe D, ou dépendance non satisfaite) est exclu de
 * l'ordre, exactement comme un attribut HTML `disabled` le retire nativement de la tabulation.
 */
export function computeBandTabOrder(input: BandTabOrderInput): readonly TabStop[] {
  const stops: TabStop[] = [];

  for (const group of buildPrimaryControls()) {
    for (const def of group.defs) stops.push({ kind: 'primary', filterId: def.id });
  }

  stops.push({ kind: 'search' });

  const grouped = byGroup(EXPOSED_FILTER_DEFS);
  for (const groupKey of ACCORDION_GROUP_ORDER) {
    const defs = grouped.get(groupKey);
    if (defs === undefined || defs.length === 0) continue;
    stops.push({ kind: 'group-toggle', group: groupKey });
    if (!input.expandedGroups.has(groupKey)) continue;
    for (const def of defs) {
      if (resolveFilterClass(def, input.mode) === 'D') continue;
      if (!isDependencySatisfied(def, input.selection)) continue;
      stops.push({ kind: 'filter', filterId: def.id, group: groupKey });
    }
  }

  for (const filterId of input.activeTokenFilterIds) {
    stops.push({ kind: 'active-token', filterId });
  }

  return stops;
}

/** Compare deux arrêts pour l'égalité structurelle (utile aux tests et à la détection de doublons). */
export function tabStopKey(stop: TabStop): string {
  switch (stop.kind) {
    case 'primary':
      return `primary:${stop.filterId}`;
    case 'search':
      return 'search';
    case 'group-toggle':
      return `group-toggle:${stop.group}`;
    case 'filter':
      return `filter:${stop.filterId}`;
    case 'active-token':
      return `active-token:${stop.filterId}`;
  }
}

/**
 * `<n> filtres actifs` (`EX-SCR-91`) calculé pour un groupe précis — utilitaire partagé par le
 * calcul de tabulation ci-dessus et par le rendu du titre de groupe replié.
 */
export function groupActiveCount(defs: readonly FilterDef[], selection: SelectionState): number {
  return defs.filter((d) => isFilterActive(d, selection)).length;
}

/* ================================================================================================
 * Roving tabindex générique (listes de boutons radio / cases / options d'un panneau) — flèches,
 * Home/End (§EX-SCR-99, `Tab` ne circule qu'au niveau du groupe, les flèches à l'intérieur).
 * ============================================================================================== */

export type RovingKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

/**
 * Calcule le nouvel index focalisé d'une liste de `count` options, pour la touche pressée. Circule
 * (wrap-around) — convention d'accessibilité standard pour les groupes de boutons radio/listbox.
 * Retourne `current` inchangé pour une touche qui ne s'applique pas à `orientation`.
 */
export function moveRovingIndex(
  current: number,
  count: number,
  key: RovingKey,
  orientation: 'horizontal' | 'vertical' = 'vertical',
): number {
  if (count <= 0) return current;
  const forwardKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
  const backwardKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === forwardKey) return (current + 1) % count;
  if (key === backwardKey) return (current - 1 + count) % count;
  return current;
}

/** Touches d'activation d'un contrôle une fois focalisé (`Espace`/`Entrée`, `EX-SCR-86`/`87`). */
export function isActivationKey(key: string): boolean {
  return key === ' ' || key === 'Enter' || key === 'Spacebar';
}

/* ================================================================================================
 * Piège de focus de l'écran G (§7.4 `EX-SCR-216`) : ordre fixe à 6 arrêts, flèches gauche/droite
 * commutent entre les deux panneaux listés, Échap ferme sans appliquer.
 * ============================================================================================== */

export const SCREEN_G_TAB_ORDER = [
  'search-make',
  'list-make',
  'search-model',
  'list-model',
  'cancel',
  'apply',
] as const;

export type ScreenGFocusStop = (typeof SCREEN_G_TAB_ORDER)[number];

/** `Tab`/`Shift+Tab` à l'intérieur du piège de focus de l'écran G — circule, ne s'évade jamais. */
export function nextScreenGStop(current: ScreenGFocusStop, direction: 1 | -1): ScreenGFocusStop {
  const idx = SCREEN_G_TAB_ORDER.indexOf(current);
  const n = SCREEN_G_TAB_ORDER.length;
  const nextIdx = (idx + direction + n) % n;
  // `SCREEN_G_TAB_ORDER` est un tuple non vide connu statiquement : l'accès est toujours défini.
  return SCREEN_G_TAB_ORDER[nextIdx] as ScreenGFocusStop;
}

/** `Flèche gauche`/`Flèche droite` : commutent entre la liste des marques et celle des modèles,
 * sans effet ailleurs dans le piège de focus (`EX-SCR-216`). */
export function switchScreenGPanelOnArrow(
  current: ScreenGFocusStop,
  key: 'ArrowLeft' | 'ArrowRight',
): ScreenGFocusStop | null {
  if (current === 'list-make' && key === 'ArrowRight') return 'list-model';
  if (current === 'list-model' && key === 'ArrowLeft') return 'list-make';
  return null;
}
