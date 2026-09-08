/**
 * KYCAR — Codec `selectionHash` / `localDatasetKey` (EX-DATA-108, EX-SRCH-9ter/quinquies)
 * =================================================================================================
 * Lot D2. Sérialisation CANONIQUE d'un état de filtres et sa scission en deux composantes :
 *
 *   - Sérialisation canonique (EX-DATA-108, EX-NAV-6/8/9) :
 *       • filtres triés par identifiant KYCAR croissant ;
 *       • valeurs multiples dédupliquées, triées par ordre croissant de leur code, jointes par `,` ;
 *       • filtres à leur valeur par défaut OMIS ;
 *       • paires `identifiant=valeur` jointes par `;`.
 *     Deux états sémantiquement identiques produisent donc la MÊME chaîne, octet à octet.
 *
 *   - Scission T / R (EX-SRCH-9bis) :
 *       • composante `T` (filtres qui exigent un rechargement `DataProvider`) → `localDatasetKey`
 *         = 16 hex du SHA-256 de la composante `T` canonique, ou la chaîne réservée `FULL` si vide ;
 *       • composante `R` (filtres appliqués en mémoire) → `refineHash`
 *         = 16 hex du SHA-256 de la composante `R` canonique, ou la chaîne réservée `EMPTY` si vide.
 *
 *   - `selectionHash` publié (EX-SRCH-9quinquies) = `<localDatasetKey>:<refineHash>`.
 *     La sélection globalement vide vaut donc `FULL:EMPTY`.
 *
 * La classe T/R et les valeurs par défaut sont des DONNÉES d'état (propriété du lot D5) : le codec
 * les reçoit en paramètre. Le défaut fourni ici (`DEFAULT_TAXONOMY_T_FILTERS`) reprend les prédicats
 * de taxonomie d'EX-DATA-110bis (`make`, `mmmv`, `cat`, `mcat`) — ceux qui changent le jeu de
 * données local.
 */

import { sha256Hex } from './sha256';

/**
 * Séparateurs RÉSERVÉS de la sérialisation canonique (EX-DATA-108) : `;` entre paires, `=` entre
 * identifiant et valeur, `,` entre valeurs d'une liste. Une valeur de filtre est du texte libre
 * (`keyword`, filtre de type `text` du périmètre retenu) : sans échappement,
 * `{keyword:'break', page:'2'}` et `{keyword:'break;page=2'}` rendent la MÊME chaîne canonique, donc
 * le même `selectionHash`, la même entrée de cache et la même clé d'entité (DR-019).
 *
 * L'échappement est un pourcentage : `%` d'abord (sinon il ne serait plus réversible), puis les
 * trois séparateurs. Il est appliqué AVANT le tri et le hachage, et il est injectif : deux valeurs
 * distinctes rendent deux formes distinctes.
 */
const RESERVED_ESCAPES: readonly (readonly [RegExp, string])[] = [
  [/%/g, '%25'],
  [/,/g, '%2C'],
  [/;/g, '%3B'],
  [/=/g, '%3D'],
];

/** Échappe les séparateurs réservés d'une valeur de filtre (EX-DATA-108). */
export function escapeFilterValue(raw: string): string {
  let out = raw;
  for (const [pattern, replacement] of RESERVED_ESCAPES) out = out.replace(pattern, replacement);
  return out;
}

/** Chemin inverse d'`escapeFilterValue` (les trois séparateurs, puis `%`). */
export function unescapeFilterValue(escaped: string): string {
  return escaped
    .replace(/%2C/g, ',')
    .replace(/%3B/g, ';')
    .replace(/%3D/g, '=')
    .replace(/%25/g, '%');
}

/** Valeur d'un filtre : un scalaire ou une liste (multi-valeurs). Les nombres sont normalisés. */
export type FilterValue = string | number | readonly (string | number)[];

/** État de filtres : identifiant KYCAR → valeur(s). */
export type SelectionInput = Readonly<Record<string, FilterValue>>;

/** Longueur réservée d'un hachage tronqué (EX-DATA-108 : 16 caractères hexadécimaux). */
export const HASH_LENGTH = 16;

/** Chaîne réservée d'une composante `T` vide (snapshot complet). */
export const FULL = 'FULL';
/** Chaîne réservée d'une composante `R` vide. */
export const EMPTY = 'EMPTY';

/**
 * Filtres de classe `T` par défaut : les prédicats de taxonomie d'EX-DATA-110bis. D5 peut fournir
 * son propre ensemble ; le codec ne fige aucune politique d'état.
 */
export const DEFAULT_TAXONOMY_T_FILTERS: ReadonlySet<string> = new Set([
  'make',
  'mmmv',
  'cat',
  'mcat',
]);

/** Options de canonisation. */
export interface CanonicalizeOptions {
  /**
   * Valeurs par défaut à omettre (EX-NAV-8). Un filtre dont la liste de valeurs canonique égale la
   * liste par défaut canonique est retiré de la sérialisation.
   */
  readonly defaults?: SelectionInput;
}

/** Résultat de hachage complet d'un état de filtres. */
export interface SelectionHashResult {
  /** Chaîne canonique complète (tous filtres non-défaut), utile comme `SelectionQuery`. */
  readonly canonical: string;
  /** Composante `T` canonique (avant hachage), ou chaîne vide. */
  readonly tCanonical: string;
  /** Composante `R` canonique (avant hachage), ou chaîne vide. */
  readonly rCanonical: string;
  readonly localDatasetKey: string;
  readonly refineHash: string;
  /** `<localDatasetKey>:<refineHash>`. */
  readonly selectionHash: string;
}

/**
 * Compare deux codes de valeur pour l'ordre croissant (EX-DATA-108). Ordre total et déterministe,
 * indépendant de la locale : codes purement numériques comparés numériquement et placés AVANT les
 * codes non numériques ; à défaut, comparaison par unité de code UTF-16.
 */
export function compareCode(a: string, b: string): number {
  const aNum = /^[0-9]+$/.test(a);
  const bNum = /^[0-9]+$/.test(b);
  if (aNum && bNum) {
    const an = Number(a);
    const bn = Number(b);
    if (an !== bn) return an < bn ? -1 : 1;
    // Codes numériquement égaux mais écrits différemment (« 01 » vs « 1 ») : départage stable.
    return a < b ? -1 : a > b ? 1 : 0;
  }
  if (aNum !== bNum) return aNum ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Normalise une valeur de filtre en liste de codes ÉCHAPPÉS, dédupliqués, triés (ordre croissant de
 * code). L'échappement précède la déduplication, le tri et le hachage (EX-DATA-108, DR-019).
 */
function toCanonicalValueList(value: FilterValue): string[] {
  const raw = Array.isArray(value) ? value : [value as string | number];
  const seen = new Set<string>();
  for (const v of raw) {
    const s = typeof v === 'number' ? String(v) : v;
    if (s.length > 0) seen.add(escapeFilterValue(s));
  }
  return [...seen].sort(compareCode);
}

/** Sérialise UN filtre en `identifiant=valeur1,valeur2` (valeurs déjà canonisées), ou `null` si vide. */
function serializeFilter(filterId: string, value: FilterValue): string | null {
  const list = toCanonicalValueList(value);
  if (list.length === 0) return null;
  return `${filterId}=${list.join(',')}`;
}

/** Vrai si la valeur d'un filtre égale sa valeur par défaut (comparaison canonique). */
function equalsDefault(value: FilterValue, defaultValue: FilterValue | undefined): boolean {
  if (defaultValue === undefined) return false;
  const a = toCanonicalValueList(value).join(',');
  const b = toCanonicalValueList(defaultValue).join(',');
  return a === b;
}

/**
 * Sérialise canoniquement un sous-ensemble de filtres (déjà réduit aux ids voulus). Applique le
 * retrait des valeurs par défaut, le tri des valeurs, puis le tri des filtres par identifiant.
 */
function canonicalize(selection: SelectionInput, ids: readonly string[], defaults?: SelectionInput): string {
  // EX-DATA-108 : « filtres triés par identifiant KYCAR croissant ». Trier les PAIRES `id=valeur`
  // en tant que chaînes n'est pas la même chose : `=` (0x3D) est inférieur aux chiffres, donc
  // `{a1:'z', a:'y'}` rendait `a1=z;a=y`. Le tri porte sur l'identifiant seul (DR-106).
  const sortedIds = [...ids].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  const pairs: string[] = [];
  for (const id of sortedIds) {
    const value = selection[id];
    if (value === undefined) continue;
    if (defaults && equalsDefault(value, defaults[id])) continue;
    const pair = serializeFilter(id, value);
    if (pair !== null) pairs.push(pair);
  }
  return pairs.join(';');
}

/** Sérialisation canonique complète d'un état de filtres (`SelectionQuery`, EX-DATA-108). */
export function serializeSelection(selection: SelectionInput, options: CanonicalizeOptions = {}): string {
  return canonicalize(selection, Object.keys(selection), options.defaults);
}

/**
 * Hachage complet d'un état de filtres avec scission T / R.
 * @param selection état de filtres brut.
 * @param tFilters ensemble des identifiants de classe `T` (défaut : `DEFAULT_TAXONOMY_T_FILTERS`).
 * @param options valeurs par défaut à omettre.
 */
export function computeSelectionHash(
  selection: SelectionInput,
  tFilters: ReadonlySet<string> = DEFAULT_TAXONOMY_T_FILTERS,
  options: CanonicalizeOptions = {},
): SelectionHashResult {
  const allIds = Object.keys(selection);
  const tIds = allIds.filter((id) => tFilters.has(id));
  const rIds = allIds.filter((id) => !tFilters.has(id));

  const canonical = canonicalize(selection, allIds, options.defaults);
  const tCanonical = canonicalize(selection, tIds, options.defaults);
  const rCanonical = canonicalize(selection, rIds, options.defaults);

  const localDatasetKey = tCanonical === '' ? FULL : sha256Hex(tCanonical).slice(0, HASH_LENGTH);
  const refineHash = rCanonical === '' ? EMPTY : sha256Hex(rCanonical).slice(0, HASH_LENGTH);

  return {
    canonical,
    tCanonical,
    rCanonical,
    localDatasetKey,
    refineHash,
    selectionHash: `${localDatasetKey}:${refineHash}`,
  };
}

/** `localDatasetKey` seul (EX-SRCH-9ter) — la clé du jeu de données local. */
export function localDatasetKey(
  selection: SelectionInput,
  tFilters: ReadonlySet<string> = DEFAULT_TAXONOMY_T_FILTERS,
  options: CanonicalizeOptions = {},
): string {
  return computeSelectionHash(selection, tFilters, options).localDatasetKey;
}

/** `selectionHash` publié seul (EX-SRCH-9quinquies) : `<localDatasetKey>:<refineHash>`. */
export function selectionHash(
  selection: SelectionInput,
  tFilters: ReadonlySet<string> = DEFAULT_TAXONOMY_T_FILTERS,
  options: CanonicalizeOptions = {},
): string {
  return computeSelectionHash(selection, tFilters, options).selectionHash;
}
