/**
 * KYCAR — Modèle de vue pur du bandeau (lot D5, finition)
 * =================================================================================================
 * Fonctions PURES qui transforment `filter-registry.ts` + l'état de sélection + l'état d'ouverture
 * des groupes en la structure que `FilterBand.tsx` rend, et que `keyboard-nav.ts` parcourt pour
 * calculer l'ordre de tabulation attendu. Aucune de ces fonctions ne touche le DOM : c'est ce qui
 * les rend testables sans navigateur (`band-model.test.ts`), conformément au repli du critère de
 * succès D5 #4 (« sinon tests unitaires du tab-order et de l'activation »).
 */

import {
  EXPOSED_FILTER_DEFS,
  GROUP_LABELS,
  GROUP_ORDER,
  PRIMARY_FILTER_DEFS,
  PRIMARY_ORDER,
  isDependencySatisfied,
  resolveFilterClass,
} from '../../state/filter-registry';
import type { FilterDef, ScreenMode, SelectionState } from '../../state/filter-types';

/** Groupes normatifs de l'accordéon (`EX-SCR-93`) : `tri` et `liste_annonces` en sont exclus — le
 * premier est un contrôle de tri dédié des écrans A/D, le second n'existe que sur l'écran D. */
export const ACCORDION_GROUP_ORDER: readonly string[] = GROUP_ORDER.filter(
  (g) => g !== 'tri' && g !== 'liste_annonces',
);

export interface PrimaryControlGroup {
  /** Identifiant stable = id du premier filtre du groupe (ex. `priceFrom` pour le couple prix). */
  readonly key: string;
  readonly defs: readonly FilterDef[];
}

/**
 * Regroupe les paramètres primaires (`EX-SCR-59`/`71`) en contrôles visuels : un couple `from`/`to`
 * compte pour un seul contrôle (ex. Prix = `pricefrom` + `priceto`), les autres pour un seul
 * filtre. L'ordre suit `PRIMARY_ORDER` (`DR-138`), pas l'ordre de déclaration du registre : `kwd`
 * appartient à la zone (2) — dernier de la ligne, jamais premier — et Carrosserie précède Boîte de
 * vitesses. `countryType` (`cy`) n'apparaît plus ici (`D-15`/`DR-052`, `EX-SRCH-18bis`).
 */
export function buildPrimaryControls(): readonly PrimaryControlGroup[] {
  const groups: PrimaryControlGroup[] = [];
  const consumed = new Set<string>();
  for (const id of PRIMARY_ORDER) {
    if (consumed.has(id)) continue;
    const def = PRIMARY_FILTER_DEFS.find((d) => d.id === id);
    if (def === undefined) continue;
    if (def.scopeType === 'range_min' && def.pairedWith !== undefined) {
      const pair = PRIMARY_FILTER_DEFS.find((d) => d.id === def.pairedWith);
      if (pair !== undefined) {
        consumed.add(def.id);
        consumed.add(pair.id);
        groups.push({ key: def.id, defs: [def, pair] });
        continue;
      }
    }
    consumed.add(def.id);
    groups.push({ key: def.id, defs: [def] });
  }
  return groups;
}

export interface FilterGroupViewModel {
  readonly key: string;
  readonly label: string;
  readonly defs: readonly FilterDef[];
  /** Nombre de filtres du groupe posés à une valeur autre que leur défaut (`EX-SCR-91`/`92`). */
  readonly activeCount: number;
  /** Identifiants à vider pour le bouton de réinitialisation DU GROUPE (`EX-SRCH-19`, `DR-061`) —
   * tous les filtres du groupe hors classe `D` (jamais actionnables, rien à réinitialiser). */
  readonly resetFilterIds: readonly string[];
}

/** Vrai si `value` compte comme « posé » (non vide) au sens d'`EX-SCR-91`. */
function isPosedValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.length > 0;
  return true;
}

function sameAsDefault(value: unknown, defaultValue: unknown): boolean {
  if (defaultValue === undefined) return false;
  const a = Array.isArray(value) ? value.map(String).slice().sort() : [String(value)];
  const b = Array.isArray(defaultValue) ? defaultValue.map(String).slice().sort() : [String(defaultValue)];
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Vrai si un filtre compte dans le compteur « `<k>` filtres actifs » (`EX-SCR-91`, `R-A01`). */
export function isFilterActive(def: FilterDef, selection: SelectionState): boolean {
  if (def.cls === 'D' || def.nonExposed) return false;
  const value = selection[def.id];
  if (!isPosedValue(value)) return false;
  if (def.defaultValue !== undefined && sameAsDefault(value, def.defaultValue)) return false;
  return true;
}

/** Nombre total de filtres actifs du bandeau (`EX-SCR-91`), tous groupes confondus. */
export function countActiveFilters(selection: SelectionState): number {
  let n = 0;
  for (const def of EXPOSED_FILTER_DEFS) {
    if (isFilterActive(def, selection)) n++;
  }
  return n;
}

/**
 * Construit les groupes de l'accordéon secondaire, dans l'ordre normatif d'`EX-SCR-93`, chacun
 * portant ses filtres (registre) et son compteur d'actifs (`<n> actifs`, `EX-SCR-92`).
 */
export function buildSecondaryGroups(selection: SelectionState): readonly FilterGroupViewModel[] {
  const byGroup = new Map<string, FilterDef[]>();
  for (const def of EXPOSED_FILTER_DEFS) {
    const bucket = byGroup.get(def.group);
    if (bucket === undefined) byGroup.set(def.group, [def]);
    else bucket.push(def);
  }
  const groups: FilterGroupViewModel[] = [];
  for (const key of ACCORDION_GROUP_ORDER) {
    const defs = byGroup.get(key) ?? [];
    if (defs.length === 0) continue;
    const activeCount = defs.filter((d) => isFilterActive(d, selection)).length;
    const resetFilterIds = defs.filter((d) => d.cls !== 'D').map((d) => d.id);
    groups.push({ key, label: GROUP_LABELS[key] ?? key, defs, activeCount, resetFilterIds });
  }
  return groups;
}

/** Groupes à déplier par défaut au chargement (`EX-SCR-92`) : ceux contenant au moins un actif. */
export function defaultExpandedGroups(selection: SelectionState): ReadonlySet<string> {
  const expanded = new Set<string>();
  for (const g of buildSecondaryGroups(selection)) {
    if (g.activeCount > 0) expanded.add(g.key);
  }
  return expanded;
}

/**
 * Vrai si le CONTRÔLE d'un filtre doit être rendu désactivé (`EX-SCR-88`, conditions a/b — les
 * conditions c/d — hors ligne, domaine dépendant vide — exigent un contexte réseau/référentiel que
 * ce module pur n'a pas et restent du ressort du composant appelant).
 */
export function isControlDisabled(def: FilterDef, selection: SelectionState, mode: ScreenMode): boolean {
  if (resolveFilterClass(def, mode) === 'D') return true;
  return !isDependencySatisfied(def, selection);
}
