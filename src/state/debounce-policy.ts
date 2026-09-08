/**
 * KYCAR — Table de débounce par type de contrôle (lot D5, finition)
 * =================================================================================================
 * Reprend littéralement `docs/requirements/draft-behaviour.md` §B.1 (`EX-SRCH-1`…`8`). Chaque ligne
 * de cette table normative nomme des filtres CONCRETS, pas seulement un type de contrôle générique
 * (ex. `EX-SRCH-3` ne s'applique qu'à `pricefrom/to` et `kmfrom/to` sur glissière, alors que
 * `powerfrom/to`/`fregfrom/to` partagent le même `ControlKind` `range-pair` mais restent sur la
 * ligne `EX-SRCH-4`, 500 ms, en saisie libre). Une table indexée uniquement par `ControlKind`
 * gommerait cette distinction ; ce module indexe donc par (filtre, geste), avec repli par
 * `ControlKind` pour tout filtre non nommé explicitement par le texte normatif.
 */

import type { ControlKind } from './filter-types';

/** Le geste physique qui a déclenché un changement de valeur. */
export type InteractionGesture =
  | 'discrete-change' // case, radio, interrupteur, select — événement `change` (EX-SCR-86)
  | 'keystroke' // frappe dans un champ texte/numérique — débounce après la DERNIÈRE frappe
  | 'slider-commit' // relâchement d'un curseur/palier — débounce après `pointerup`
  | 'selection-immediate'; // sélection marque / clic zone-modèle / navigation (EX-SRCH-8)

/** Délais normatifs, en millisecondes, table `EX-SRCH-1`…`8`. */
export const DEBOUNCE_DISCRETE_MS = 0; // EX-SRCH-1
export const DEBOUNCE_CHECKBOX_BURST_MS = 250; // EX-SRCH-2 (eq)
export const DEBOUNCE_SLIDER_COMMIT_MS = 150; // EX-SRCH-3 (pricefrom/to, kmfrom/to)
export const DEBOUNCE_NUMERIC_TYPED_MS = 500; // EX-SRCH-4
export const DEBOUNCE_TEXT_TYPED_MS = 400; // EX-SRCH-5 (kwd, et par extension version0/region/dlv_max)
export const DEBOUNCE_POSTAL_CODE_MS = 500; // EX-SRCH-6
export const DEBOUNCE_DEPENDENT_IMMEDIATE_MS = 0; // EX-SRCH-7 (zipr)
export const DEBOUNCE_SELECTION_IMMEDIATE_MS = 0; // EX-SRCH-8 (make, route)

/** Nombre minimal de caractères avant que `zip` ne déclenche la résolution géographique (EX-SRCH-6). */
export const POSTAL_CODE_MIN_CHARS = 4;

/** `eq` est le seul filtre concerné par `EX-SRCH-2` (panneau à recherche interne, 136 valeurs). */
const CHECKBOX_BURST_FILTER_IDS: ReadonlySet<string> = new Set(['equipment']);

/** `pricefrom/to`, `kmfrom/to` : seuls couples explicitement nommés « glissière » par EX-SRCH-3. */
const SLIDER_FILTER_IDS: ReadonlySet<string> = new Set([
  'priceFrom',
  'priceTo',
  'mileageFrom',
  'mileageTo',
]);

/** `zip` (localisation) : geste clavier mais gouverné par EX-SRCH-6, pas EX-SRCH-4/5. */
const POSTAL_CODE_FILTER_IDS: ReadonlySet<string> = new Set(['location']);

/** `zipr` : sélecteur dépendant activé seulement après son parent, immédiat (EX-SRCH-7). */
const DEPENDENT_IMMEDIATE_FILTER_IDS: ReadonlySet<string> = new Set(['radius']);

/** `make/mmmv` (sélection marque / modèle) et le changement de route : immédiat (EX-SRCH-8). */
const SELECTION_IMMEDIATE_FILTER_IDS: ReadonlySet<string> = new Set(['makesModelsVariants']);

/**
 * Résout le délai de débounce (ms) pour un changement de filtre donné, selon le geste physique
 * observé par le composant appelant. Le geste prime sur le `ControlKind` générique : un composant
 * qui sait qu'il vient de recevoir une frappe passe `'keystroke'`, un relâchement de curseur passe
 * `'slider-commit'`, une case/case-à-cocher/interrupteur/select passe `'discrete-change'`.
 *
 * `valueLength` (`EX-SRCH-6`, `DR-058`) : longueur courante de la valeur brute saisie, UNIQUEMENT
 * consultée pour `location` (code postal). Sous `POSTAL_CODE_MIN_CHARS`, ou si l'appelant ne la
 * fournit pas du tout (repli conservateur — mieux vaut ne jamais committer une valeur trop courte
 * que de le faire par défaut faute d'information), le résultat est `Number.POSITIVE_INFINITY` :
 * aucun commit n'est JAMAIS planifié pour ce geste, quelle que soit la durée d'attente.
 */
export function resolveDebounceMs(
  filterId: string,
  gesture: InteractionGesture,
  control: ControlKind,
  valueLength?: number,
): number {
  if (gesture === 'discrete-change') {
    if (CHECKBOX_BURST_FILTER_IDS.has(filterId) || control === 'panel-search-multi') {
      return DEBOUNCE_CHECKBOX_BURST_MS;
    }
    return DEBOUNCE_DISCRETE_MS;
  }
  if (gesture === 'selection-immediate') return DEBOUNCE_SELECTION_IMMEDIATE_MS;
  if (gesture === 'slider-commit') return DEBOUNCE_SLIDER_COMMIT_MS;
  // gesture === 'keystroke'
  if (POSTAL_CODE_FILTER_IDS.has(filterId)) {
    if (valueLength === undefined || valueLength < POSTAL_CODE_MIN_CHARS) return Number.POSITIVE_INFINITY;
    return DEBOUNCE_POSTAL_CODE_MS;
  }
  if (DEPENDENT_IMMEDIATE_FILTER_IDS.has(filterId)) return DEBOUNCE_DEPENDENT_IMMEDIATE_MS;
  if (SELECTION_IMMEDIATE_FILTER_IDS.has(filterId)) return DEBOUNCE_SELECTION_IMMEDIATE_MS;
  if (control === 'text-field') return DEBOUNCE_TEXT_TYPED_MS;
  if (SLIDER_FILTER_IDS.has(filterId)) return DEBOUNCE_NUMERIC_TYPED_MS; // saisie libre du couple (EX-SRCH-4)
  if (control === 'range-pair' || control === 'range-single' || control === 'number-field') {
    return DEBOUNCE_NUMERIC_TYPED_MS;
  }
  return DEBOUNCE_TEXT_TYPED_MS;
}
