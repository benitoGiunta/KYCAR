/**
 * KYCAR — Brouillon de sélection du bandeau (`D3-46` (c), v0.1.1)
 * =================================================================================================
 * Retour du commanditaire (`reports/data/DATA-LEAD-DECISIONS.md` D3-46) : « quand je mets une valeur
 * sur un filtre, j'ai à peine fini de la taper qu'elle s'enregistre ». Les débounces d'application
 * (`EX-SRCH-1…8`) sont remplacés par un BROUILLON : toute modification d'un contrôle du bandeau écrit
 * ici, rien n'est appliqué (ni URL, ni historique, ni recalcul) avant un geste explicite
 * (« Appliquer », Entrée dans un champ). Ce module est la logique PURE de ce brouillon — aucun DOM,
 * aucune horloge — : `FilterBand.tsx` n'en est que le rendu.
 *
 *   - `isDraftDirty` / `draftChangedFilterIds` : le brouillon diffère-t-il de la sélection appliquée,
 *     et par quels filtres ? Comparaison sur la forme CANONIQUE d'URL (`serializeQuery`) : une valeur
 *     posée à son défaut « non-absence » (`powertype=kw`) ou un ordre de cases différent n'est pas une
 *     modification (`EX-NAV-8`/`9`).
 *   - `withDraftValue` : pose ou retire une valeur, puis retire en cascade les enfants orphelins
 *     (`DR-059`, `EX-SCR-73`) — sans notification tant que rien n'est appliqué.
 *   - `rebaseDraft` : la sélection APPLIQUÉE a changé sous le brouillon (retrait d'un jeton, « Tout
 *     effacer », amorce de l'écran A, brossage converti, retour arrière). Les modifications en attente
 *     sont reportées sur la nouvelle base ; tout le reste suit la nouvelle base.
 *   - `planDraftApply` : ce que l'application déclenchera — filtres modifiés et classes résolues
 *     (`T` ⇒ rechargement du `DataProvider`, `R` ⇒ recalcul local) : la scission `T`/`R`
 *     (`EX-SCR-57`, `tr-split.ts`) s'applique au moment d'« Appliquer », une seule fois.
 *   - `countDraftChanges` : nombre de modifications en attente, affiché quand l'effectif
 *     prévisionnel n'est pas encore connu (« Appliquer (2 modifications) »).
 */

import { FILTER_DEFAULTS, FILTER_BY_ID, FILTER_DEFS, isDependencySatisfied, resolveFilterClass } from './filter-registry';
import type { FilterClass, FilterValue, MutableSelectionState, ScreenMode, SelectionState } from './filter-types';
import { serializeQuery } from './url-codec';

/** Forme canonique d'UN filtre, telle que l'URL l'écrirait (`''` = absent ou à son défaut). */
function canonicalOf(filterId: string, value: FilterValue | undefined): string {
  if (value === undefined) return '';
  return serializeQuery({ [filterId]: value }, {}, { filterDefaults: FILTER_DEFAULTS });
}

/** Identifiants des filtres dont la valeur canonique diffère entre `applied` et `draft`, triés. */
export function draftChangedFilterIds(applied: SelectionState, draft: SelectionState): readonly string[] {
  const ids = new Set([...Object.keys(applied), ...Object.keys(draft)]);
  const changed: string[] = [];
  for (const id of ids) {
    if (canonicalOf(id, applied[id]) !== canonicalOf(id, draft[id])) changed.push(id);
  }
  return changed.sort();
}

/** Vrai si le brouillon porte au moins une modification non appliquée. */
export function isDraftDirty(applied: SelectionState, draft: SelectionState): boolean {
  return draftChangedFilterIds(applied, draft).length > 0;
}

/**
 * Nombre de modifications en attente, compté en CONTRÔLES et non en paramètres : un couple
 * d'intervalle (`pricefrom`/`priceto`) modifié sur ses deux bornes compte pour une modification,
 * comme l'utilisateur le perçoit (un seul contrôle « Prix »).
 */
export function countDraftChanges(applied: SelectionState, draft: SelectionState): number {
  const controls = new Set<string>();
  for (const id of draftChangedFilterIds(applied, draft)) {
    const def = FILTER_BY_ID.get(id);
    const key = def?.scopeType === 'range_max' && def.pairedWith !== undefined ? def.pairedWith : id;
    controls.add(key);
  }
  return controls.size;
}

/**
 * `DR-059` (`EX-SCR-73`) : retire en cascade tout filtre dont la dépendance n'est plus satisfaite —
 * boucle jusqu'à stabilité (une chaîne de dépendances peut se propager sur plus d'un niveau).
 * Mutation EN PLACE de `state` (toujours une copie détachée chez l'appelant) ; retourne les
 * identifiants retirés PAR LA CASCADE.
 */
export function cascadeRemoveOrphans(state: MutableSelectionState): string[] {
  const removed: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const def of FILTER_DEFS) {
      if (def.dependencies.length === 0) continue;
      if (!(def.id in state)) continue;
      if (!isDependencySatisfied(def, state)) {
        delete state[def.id];
        removed.push(def.id);
        changed = true;
      }
    }
  }
  return removed;
}

/** Brouillon suivant après la pose (`value`) ou le retrait (`undefined`) d'un filtre. */
export function withDraftValue(
  draft: SelectionState,
  filterId: string,
  value: FilterValue | undefined,
): SelectionState {
  const next: MutableSelectionState = { ...draft };
  if (value === undefined) delete next[filterId];
  else next[filterId] = value;
  cascadeRemoveOrphans(next);
  return next;
}

/** Brouillon suivant après le retrait de plusieurs filtres (réinitialisation d'une carte). */
export function withoutDraftFilters(draft: SelectionState, filterIds: readonly string[]): SelectionState {
  const next: MutableSelectionState = { ...draft };
  for (const id of filterIds) delete next[id];
  cascadeRemoveOrphans(next);
  return next;
}

/**
 * Reporte les modifications en attente (`draft` par rapport à `oldBase`) sur une nouvelle sélection
 * appliquée (`newBase`). Règle : un filtre MODIFIÉ dans le brouillon garde la valeur du brouillon
 * (y compris un retrait) ; tout autre filtre prend la valeur de la nouvelle base. Brouillon propre ⇒
 * le résultat est exactement `newBase`.
 */
export function rebaseDraft(oldBase: SelectionState, draft: SelectionState, newBase: SelectionState): SelectionState {
  const pending = draftChangedFilterIds(oldBase, draft);
  if (pending.length === 0) return newBase;
  const next: MutableSelectionState = { ...newBase };
  for (const id of pending) {
    const v = draft[id];
    if (v === undefined) delete next[id];
    else next[id] = v;
  }
  cascadeRemoveOrphans(next);
  return next;
}

export interface DraftApplyPlan {
  /** Filtres dont la valeur change à l'application. */
  readonly changedFilterIds: readonly string[];
  /** Classes RÉSOLUES (`T`/`R`) des filtres modifiés, sans doublon — jamais `DYNAMIC_BODY`. */
  readonly classes: readonly FilterClass[];
}

/**
 * Plan d'application d'un brouillon : ce qui change, et quelle(s) classe(s) cela engage. Les
 * filtres de classe `D` ne sont jamais sérialisés et ne comptent pas.
 */
export function planDraftApply(applied: SelectionState, draft: SelectionState, mode: ScreenMode): DraftApplyPlan {
  const changedFilterIds = draftChangedFilterIds(applied, draft);
  const classes = new Set<FilterClass>();
  for (const id of changedFilterIds) {
    const def = FILTER_BY_ID.get(id);
    if (def === undefined) continue;
    const cls = resolveFilterClass(def, mode);
    if (cls === 'T' || cls === 'R') classes.add(cls);
  }
  return { changedFilterIds, classes: [...classes].sort() };
}
