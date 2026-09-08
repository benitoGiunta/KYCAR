/**
 * KYCAR — Scission T/R de l'état de filtres (lot D5, EX-SRCH-9bis/ter/quater/quinquies)
 * =================================================================================================
 * Pont entre le registre de classes T/R/D possédé par D5 (`filter-registry.ts`) et le codec de
 * hachage possédé par D2 (`src/types/selection.ts`) : ce module NE RÉÉCRIT AUCUNE règle de
 * canonisation ou de hachage, il fournit seulement le bon ensemble de filtres `T` — dépendant du
 * mode d'écran à cause de la classe dynamique de `bodyType` — à `computeSelectionHash`.
 */

import { computeSelectionHash, type SelectionHashResult } from '../types/selection';
import { FILTER_DEFAULTS, tFilterIds } from './filter-registry';
import type { ScreenMode, SelectionState } from './filter-types';

/**
 * Scinde une sélection en composantes `T`/`R` et calcule `localDatasetKey`/`refineHash`/
 * `selectionHash` (EX-SRCH-9ter/quinquies), pour le MODE d'écran donné (seul `bodyType` en
 * dépend, `EX-SCR-82`/`221`). Applique les défauts non-absence connus (`EX-NAV-8`) pour que deux
 * sélections sémantiquement identiques (l'une explicite sur un défaut, l'autre muette) partagent
 * le même hachage — condition du cache LRU `(snapshotId, localDatasetKey)` et
 * `(snapshotId, selectionHash)` (`EX-DATA-109`).
 */
export function splitSelection(selection: SelectionState, mode: ScreenMode): SelectionHashResult {
  return computeSelectionHash(selection, tFilterIds(mode), { defaults: FILTER_DEFAULTS });
}

/** `localDatasetKey` seul — la clé du jeu de données local (`EX-SRCH-9ter`). */
export function localDatasetKeyFor(selection: SelectionState, mode: ScreenMode): string {
  return splitSelection(selection, mode).localDatasetKey;
}

/** `selectionHash` publié seul (`EX-SRCH-9quinquies`) : `<localDatasetKey>:<refineHash>`. */
export function selectionHashFor(selection: SelectionState, mode: ScreenMode): string {
  return splitSelection(selection, mode).selectionHash;
}

/**
 * Sépare une sélection en deux sous-`SelectionState` (composante `T` et composante `R`), utile au
 * composant qui doit savoir QUELS filtres appartiennent à quelle composante (ex. l'en-tête
 * `Jeu de données restreint par <k> filtre(s) rechargé(s)`, `EX-SRCH-9quater`).
 */
export function partitionSelection(
  selection: SelectionState,
  mode: ScreenMode,
): { readonly t: SelectionState; readonly r: SelectionState } {
  const tIds = tFilterIds(mode);
  const t: Record<string, SelectionState[string]> = {};
  const r: Record<string, SelectionState[string]> = {};
  for (const [id, value] of Object.entries(selection)) {
    (tIds.has(id) ? t : r)[id] = value;
  }
  return { t, r };
}
