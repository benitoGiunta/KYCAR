/**
 * KYCAR — Seuils de l'écran A (lot D6)
 * =================================================================================================
 * Une seule table normative par famille de seuil, jamais un nombre magique dispersé dans les
 * composants. `EX-SCR-124bis` : « Aucun autre seuil de rendu n'existe sur l'écran A. »
 */

/* ================================================================================================
 * EX-SCR-124bis — table unique des seuils de la GRILLE
 * ============================================================================================== */

/** État `SANS-FILTRE` (`EX-SCR-27bis`/`125`) : nombre de cartes-marques affichées par défaut. */
export const NO_FILTER_TEASER_MAKE_COUNT = 20;

/** Au-delà de ce nombre de cartes À RENDRE, la grille bascule en rendu virtualisé
 * (`EX-SCR-127`) : au plus 12 cartes montées simultanément, sans jamais plafonner le nombre de
 * cartes ACCESSIBLES. */
export const GRID_VIRTUALIZATION_THRESHOLD = 40;
export const GRID_VIRTUALIZATION_MOUNTED_CARDS = 12;

/** Taille d'un lot de chargement continu (`EX-SCR-129`). */
export const GRID_LOAD_BATCH_SIZE = 12;

/** `EX-SRCH-26` / `EX-SCR-32` — au-delà de ce nombre de marques avec au moins un résultat, bandeau
 * non bloquant « affinez pour comparer », sans jamais bloquer le rendu. */
export const MAKE_COUNT_WARNING_THRESHOLD = 60;

/** `EX-SCR-122` — nombre de zones-modèles visibles avant repli, par régime responsive
 * (`EX-SCR-135` réduit ce nombre à 4 en régime `compact`). */
export const MODELS_VISIBLE_BEFORE_COLLAPSE: Readonly<Record<'compact' | 'intermediate' | 'large', number>> = {
  compact: 4,
  intermediate: 6,
  large: 6,
};

/** `EX-SCR-124` règle 2 — au-delà de ce nombre de modèles dans une marque, un champ de recherche de
 * modèle apparaît au dépliement. */
export const MODEL_SEARCH_FIELD_THRESHOLD = 12;

/** `EX-SCR-124` règle 3 — au-delà de ce nombre de zones-modèles dans la liste dépliée, le rendu est
 * virtualisé (au plus ce nombre de nœuds de zone existent simultanément dans le DOM par carte). */
export const MODEL_LIST_VIRTUALIZATION_THRESHOLD = 30;

/** `EX-SCR-122`/`127` — hauteur REPLIÉE de référence d'une carte-marque, en px. Sert d'estimation
 * initiale à la virtualisation de la grille (« hauteur de conteneur estimée depuis la hauteur
 * repliée (588 px) puis corrigée à la mesure réelle », `EX-SCR-127`). */
export const COLLAPSED_CARD_HEIGHT_PX = 588;

/** `EX-SCR-124` règle 1 — hauteur MAXIMALE d'une carte, dépliée comprise. */
export const CARD_MAX_HEIGHT_PX = 636;

/** `EX-SCR-124` règle 1 — hauteur maximale de la liste de zones dépliée (6,6 zones de 72 px). */
export const MODEL_LIST_MAX_HEIGHT_PX = 480;

/** `EX-SCR-112` — hauteur d'une zone-modèle en régime large : pas de la fenêtre de virtualisation. */
export const MODEL_ZONE_HEIGHT_PX = 72;

/** `EX-SCR-128` — un modèle est « à moins de 3 offres » (masquable par la case dédiée) pour un
 * effectif strictement inférieur à ce seuil. */
export const SPARSE_MODEL_MAX_LISTING_COUNT = 2;

export function isSparseModel(listingCount: number): boolean {
  return listingCount <= SPARSE_MODEL_MAX_LISTING_COUNT;
}

/* ================================================================================================
 * EX-SCR-33 — paliers d'effectif d'une statistique (n = n_m(Σ) de la métrique concernée)
 * ============================================================================================== */

export type EffectifTier = 'absente' | 'trop-faible' | 'reduite' | 'sans-m2' | 'complete';

/**
 * `EX-SCR-33` — quatre paliers, plus le cas `n = 0` (statistique non affichée) :
 *   - `n = 0`               → `'absente'`     : caractère `—`, aucune statistique.
 *   - `1 ≤ n ≤ 4`           → `'trop-faible'`  : valeurs brutes seules, aucun percentile/médiane/
 *                             IQR/régression/outlier.
 *   - `5 ≤ n ≤ 11`          → `'reduite'`      : médiane/min/max, P5/P95/IQR/régression/outliers
 *                             désactivés, jeton ambre `n = <n>`.
 *   - `12 ≤ n ≤ 29`         → `'sans-m2'`      : tout sauf M2 (prix attendu, `G8`, écart au prix
 *                             attendu) — seule M1 est disponible.
 *   - `n ≥ 30`              → `'complete'`     : tout, M1 et M2 comprises.
 * Seuils uniques pour toute l'application (`EX-DATA-86`/`90` : 12 pour M1, 30 pour M2).
 */
export function effectifTier(n: number): EffectifTier {
  if (n === 0) return 'absente';
  if (n <= 4) return 'trop-faible';
  if (n <= 11) return 'reduite';
  if (n <= 29) return 'sans-m2';
  return 'complete';
}

/** `EX-SCR-134` — la zone-modèle applique `ET-EFFECTIF-FAIBLE` : pour `1 ≤ n ≤ 4`, la médiane est
 * remplacée par `n trop faible` (`n = 1` affiche spécifiquement `1 seule offre`) ; les fourchettes
 * restent affichées (min/max définis dès `n = 1`). */
export interface ModelZoneMedianDisplay {
  readonly kind: 'value' | 'single-offer' | 'too-few' | 'absent';
  /** Effectif exact, à afficher à la place de la médiane pour `'too-few'`/`'single-offer'`. */
  readonly n: number;
}

export function modelZoneMedianDisplay(n: number): ModelZoneMedianDisplay {
  if (n === 0) return { kind: 'absent', n };
  if (n === 1) return { kind: 'single-offer', n };
  if (n <= 4) return { kind: 'too-few', n };
  return { kind: 'value', n };
}

/* ================================================================================================
 * Bandeau de dépassement (EX-SRCH-26, EX-SCR-32)
 * ============================================================================================== */

/** `true` si le bandeau `<n> marques correspondent — affinez pour comparer` doit s'afficher :
 * plus de 60 marques avec au moins un résultat (`MAKE_COUNT_WARNING_THRESHOLD`). Le nombre 60 n'est
 * PAS un plafond de calcul (`EX-SRCH-27`) : il ne pilote qu'un bandeau, jamais un plafonnement. */
export function shouldShowMakeCountWarning(makeCountWithResults: number): boolean {
  return makeCountWithResults > MAKE_COUNT_WARNING_THRESHOLD;
}

/** `true` si la grille doit être rendue en mode virtualisé (`EX-SCR-127`). */
export function shouldVirtualizeGrid(makeCountToRender: number): boolean {
  return makeCountToRender > GRID_VIRTUALIZATION_THRESHOLD;
}
