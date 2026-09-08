/**
 * KYCAR — Logique pure de l'écran G, sélecteur marque/modèle (lot D5, finition, `EX-SCR-215`/`216`)
 * =================================================================================================
 * Recherche insensible à la casse et aux diacritiques (`skoda` trouve `Škoda`, `EX-SCR-216`), tri
 * par effectif décroissant puis alphabétique. Fonctions pures : testables sans DOM, et réutilisées
 * telles quelles par `ScreenG.tsx` pour ses gestionnaires.
 *
 * DETTE SIGNALÉE : « effectif d'offres dans le périmètre filtré courant » (`EX-SCR-216`) exige le
 * moteur d'agrégation (D4) réévalué à chaque ouverture de la modale sous les filtres actifs — hors
 * périmètre référentiel de D5 (`buildReferenceData`, D2, n'expose que `announcedCount`, la
 * dernière volumétrie connue de la source, PAS un recalcul local). Ce module accepte donc un
 * effectif déjà résolu par l'appelant (`counts` optionnel) et se rabat sur `announcedCount` sinon,
 * jamais sur `0` (`EX-SCR-89`/`ET-CHAMP-MANQUANT` : un effectif non calculable affiche `—`, pas `0`).
 */
import type { Make, Model } from '../../types/entities';
import type { ReferenceData } from '../../types/reference';

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export interface MakeRow {
  readonly make: Make;
  readonly count: number | null;
}
export interface ModelRow {
  readonly model: Model;
  readonly count: number | null;
}

/**
 * `DR-060` : quand une carte d'effectifs (`counts`) est fournie par l'appelant, une entrée ABSENTE
 * de cette carte rend `null` (« — », `ET-CHAMP-MANQUANT`), jamais un repli sur `announcedCount` —
 * qui n'est PAS relatif au périmètre filtré courant (`EX-SCR-216`). Quand `counts` lui-même est
 * absent (aucune carte remontée du tout par l'appelant), le repli `announcedCount` reste la
 * meilleure information disponible.
 */
function resolveCount<K>(key: K, counts: ReadonlyMap<K, number> | undefined, fallback: number | null): number | null {
  if (counts === undefined) return fallback;
  return counts.get(key) ?? null;
}

function sortRows<T extends { readonly count: number | null }>(rows: T[], label: (r: T) => string): T[] {
  return rows.slice().sort((a, b) => {
    const ac = a.count ?? -1;
    const bc = b.count ?? -1;
    if (ac !== bc) return bc - ac;
    return label(a).localeCompare(label(b), 'fr');
  });
}

/** Marques filtrées par sous-chaîne de recherche (vide = tout le catalogue), triées par effectif. */
export function searchMakes(
  reference: ReferenceData,
  query: string,
  counts?: ReadonlyMap<number, number>,
): readonly MakeRow[] {
  const q = norm(query.trim());
  const filtered = q.length === 0 ? reference.makes : reference.makes.filter((m) => norm(m.label).includes(q));
  const rows = filtered.map((make) => ({ make, count: resolveCount(make.makeId, counts, make.announcedCount) }));
  return sortRows(rows, (r) => r.make.label);
}

/** Modèles d'une marque, filtrés par sous-chaîne, triés par effectif. `makeId = undefined` = aucune
 * marque sélectionnée -> liste vide (le panneau droit reste vide tant qu'aucune marque n'est choisie). */
export function searchModels(
  reference: ReferenceData,
  makeId: number | undefined,
  query: string,
  counts?: ReadonlyMap<string, number>,
): readonly ModelRow[] {
  if (makeId === undefined) return [];
  const all = reference.modelsByMake.get(makeId) ?? [];
  const q = norm(query.trim());
  const filtered = q.length === 0 ? all : all.filter((m) => norm(m.label).includes(q));
  const rows = filtered.map((model) => ({
    model,
    count: resolveCount(`${model.makeId}:${model.modelId}`, counts, model.announcedCount),
  }));
  return sortRows(rows, (r) => r.model.label);
}

/** Sérialise la sélection de l'écran G au format relevé `makeId|modelId` (`EX-SCR-72`). Le
 * troisième/quatrième bloc (`modelLineId`/`version`) n'est pas produit par ce sélecteur simplifié
 * — dette signalée, `version0` reste un filtre texte libre séparé (`EX-SCR-71`). */
export function serializeMmmv(makeId: number, modelId: number | undefined): string {
  return modelId === undefined ? String(makeId) : `${makeId}|${modelId}`;
}

/** `true` si la sélection candidate diffère de l'état courant de l'écran appelant — `Appliquer`
 * est désactivé sinon (`EX-SCR-216` : « sélection inchangée »). */
export function isSameSelection(candidate: string, current: string | undefined): boolean {
  return candidate === (current ?? '');
}

/* ================================================================================================
 * Fenêtrage des deux panneaux (résidu `DR-060`/`EX-SCR-216`) — 295 marques, jusqu'à 4 955 modèles
 * =================================================================================================
 * Aucune bibliothèque de virtualisation n'est disponible dans ce worktree (même contrainte que
 * `PanelSearchMulti.tsx`, `EX-SCR-100`). Fonction pure, sans DOM : à partir de la position de
 * défilement courante, calcule la sous-liste à monter (fenêtre visible + tampon de part et
 * d'autre) et les paddings haut/bas qui remplacent les lignes non montées, pour que la hauteur de
 * défilement totale reste correcte sans jamais rendre les 295/4 955 lignes à la fois.
 */

/** Hauteur d'une ligne, en pixels — sert au calcul de la fenêtre et des paddings. */
export const SCREEN_G_ROW_HEIGHT_PX = 32;
/** Nombre de lignes visibles à l'écran (cas normatif « 60 lignes visibles »). */
export const SCREEN_G_VISIBLE_ROWS = 60;
/** Tampon monté de part et d'autre de la zone visible, pour absorber le défilement sans « trou »
 * perceptible avant le prochain recalcul. */
export const SCREEN_G_BUFFER_ROWS = 20;

export interface RowWindow<T> {
  /** Sous-ensemble de `rows` effectivement monté dans le DOM. */
  readonly items: readonly T[];
  /** Index (dans `rows`) du premier élément de `items`. */
  readonly startIndex: number;
  /** Index (exclu) suivant le dernier élément de `items`. */
  readonly endIndex: number;
  /** Longueur totale de `rows`, non fenêtrée — sert à `aria-setsize`/`aria-rowcount`. */
  readonly totalCount: number;
  /** Hauteur (px) de l'espaceur remplaçant les lignes non montées AVANT la fenêtre. */
  readonly topPaddingPx: number;
  /** Hauteur (px) de l'espaceur remplaçant les lignes non montées APRÈS la fenêtre. */
  readonly bottomPaddingPx: number;
}

/**
 * Calcule la fenêtre de lignes à monter pour une position de défilement donnée. `rows` vide rend
 * une fenêtre vide sans erreur. Les bornes sont toujours ramenées dans `[0, rows.length]`, y
 * compris pour un `scrollTop` négatif ou dépassant la hauteur totale (défilement élastique).
 */
export function computeRowWindow<T>(
  rows: readonly T[],
  scrollTop: number,
  rowHeightPx: number = SCREEN_G_ROW_HEIGHT_PX,
  visibleRows: number = SCREEN_G_VISIBLE_ROWS,
  bufferRows: number = SCREEN_G_BUFFER_ROWS,
): RowWindow<T> {
  const totalCount = rows.length;
  if (totalCount === 0) {
    return { items: [], startIndex: 0, endIndex: 0, totalCount: 0, topPaddingPx: 0, bottomPaddingPx: 0 };
  }
  const clampedScrollTop = Math.max(0, scrollTop);
  const firstVisible = Math.floor(clampedScrollTop / rowHeightPx);
  const startIndex = Math.max(0, Math.min(totalCount, firstVisible - bufferRows));
  const endIndex = Math.max(startIndex, Math.min(totalCount, firstVisible + visibleRows + bufferRows));
  return {
    items: rows.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    totalCount,
    topPaddingPx: startIndex * rowHeightPx,
    bottomPaddingPx: (totalCount - endIndex) * rowHeightPx,
  };
}

/**
 * `E2E-12`/`D8-14` : la navigation clavier au sein d'un panneau (`ArrowUp`/`ArrowDown`) déplace la
 * sélection (motif `aria-activedescendant`, APG listbox à sélection unique — la sélection SUIT le
 * focus) — l'option ciblée doit alors être RENDUE (dans la fenêtre montée, `computeRowWindow`),
 * sinon `aria-activedescendant` pointerait vers un id absent du DOM. Fonction pure : calcule le
 * nouveau `scrollTop` minimal qui ramène `index` dans la zone visible, sans changer `scrollTop` si
 * la ligne y est déjà (pas de sursaut de défilement à chaque frappe).
 */
export function computeScrollTopToReveal(
  index: number,
  currentScrollTop: number,
  rowHeightPx: number = SCREEN_G_ROW_HEIGHT_PX,
  visibleRows: number = SCREEN_G_VISIBLE_ROWS,
): number {
  const rowTop = index * rowHeightPx;
  const rowBottom = rowTop + rowHeightPx;
  const viewTop = currentScrollTop;
  const viewBottom = currentScrollTop + visibleRows * rowHeightPx;
  if (rowTop < viewTop) return rowTop;
  if (rowBottom > viewBottom) return rowBottom - visibleRows * rowHeightPx;
  return currentScrollTop;
}

/* ================================================================================================
 * `ET-VIDE-FILTRES` et « Effacer la recherche » (résidu `DR-060`/`EX-SCR-216`)
 * ============================================================================================== */

/** Identifiant d'état normatif du catalogue (`draft-screens.md` §7.4) — recherche sans
 * correspondance sur l'un des deux panneaux. */
export const SCREEN_G_EMPTY_STATE_ID = 'ET-VIDE-FILTRES' as const;

export interface ScreenGEmptyState {
  readonly stateId: typeof SCREEN_G_EMPTY_STATE_ID;
  readonly message: string;
}

/** `ET-VIDE-FILTRES` du panneau marque : une saisie non vide qui ne fait correspondre aucune
 * marque. `null` tant que le champ est vide ou qu'il reste au moins une correspondance. */
export function makePanelEmptyState(query: string, rows: readonly MakeRow[]): ScreenGEmptyState | null {
  if (query.trim().length === 0 || rows.length > 0) return null;
  return { stateId: SCREEN_G_EMPTY_STATE_ID, message: `Aucune marque ne contient « ${query} »` };
}

/** `ET-VIDE-FILTRES` du panneau modèle : même règle, sans objet tant qu'aucune marque n'est
 * sélectionnée (le panneau droit reste vide, ce n'est pas une recherche sans correspondance). */
export function modelPanelEmptyState(
  makeSelected: boolean,
  query: string,
  rows: readonly ModelRow[],
): ScreenGEmptyState | null {
  if (!makeSelected || query.trim().length === 0 || rows.length > 0) return null;
  return { stateId: SCREEN_G_EMPTY_STATE_ID, message: `Aucun modèle ne contient « ${query} »` };
}

/** État local (recherche + sélection) des deux panneaux de l'écran G. */
export interface ScreenGSearchState {
  readonly makeQuery: string;
  readonly modelQuery: string;
  readonly selectedMakeId: number | undefined;
  readonly selectedModelId: number | undefined;
}

/** État initial au montage de la modale — aucune saisie, aucune sélection. */
export const INITIAL_SCREEN_G_SEARCH_STATE: ScreenGSearchState = {
  makeQuery: '',
  modelQuery: '',
  selectedMakeId: undefined,
  selectedModelId: undefined,
};

/** `Effacer la recherche` (`EX-SCR-216`) : vide les deux champs de recherche et remet les DEUX
 * panneaux à leur état initial (aucune marque ni modèle sélectionnés) — pas seulement le champ du
 * panneau où le bouton a été actionné, conformément au comportement décrit pour cette action. */
export function clearScreenGSearch(): ScreenGSearchState {
  return INITIAL_SCREEN_G_SEARCH_STATE;
}
