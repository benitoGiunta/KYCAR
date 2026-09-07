/**
 * KYCAR — Codec d'URL canonique (lot D5)
 * =================================================================================================
 * Sérialisation/désérialisation de la REQUÊTE (partie `?...` d'une URL), au-dessus du codec de
 * hachage de D2 (`src/types/selection.ts`), dont ce module ne duplique AUCUNE règle : D2 hache une
 * sélection déjà typée (clés = identifiants KYCAR) pour produire `selectionHash`/`localDatasetKey` ;
 * D5 sérialise cette même sélection dans l'espace des PARAMÈTRES D'URL relevés sur AutoScout24
 * (clés = `param`, pas `id`), pour l'adresse-barre elle-même (`EX-NAV-5`…`11`).
 *
 * Règles appliquées ici (`docs/plans/ARCHITECTURE.md` §5.2, `docs/requirements/draft-behaviour.md`
 * §A.2) :
 *   - EX-NAV-5 : noms de paramètre relevés, sans renommage (portés par `filter-registry.ts`).
 *   - EX-NAV-6 : multi-valeurs = une seule occurrence, valeurs jointes par virgule.
 *   - EX-NAV-7 : intervalles = paires `from`/`to`, bornes non posées jamais émises.
 *   - EX-NAV-8 : valeur par défaut jamais émise ; valeur vidée retirée (jamais `param=`).
 *   - EX-NAV-9 : ordre alphabétique fixe par nom de PARAMÈTRE (filtres ET état d'interface confondus).
 *   - EX-NAV-10/11 : plafond 2000 caractères, refus explicite, jamais de troncature.
 *   - EX-NAV-10bis : paramètres d'état d'interface (mêmes règles d'ordre/défaut).
 */

import { compareCode } from '../types/selection';
import { FILTER_DEFS, FILTER_BY_PARAM } from './filter-registry';
import type { FilterValue, SelectionState } from './filter-types';

/** Plafond `EX-NAV-10` : longueur maximale de l'URL complète (origine + chemin + requête). */
export const MAX_URL_LENGTH = 2000;

/* ================================================================================================
 * Paramètres d'état d'interface (EX-NAV-10bis)
 * ============================================================================================== */

export type HistoryMode = 'push' | 'replace';

export interface UiStateParamDef {
  readonly param: string;
  readonly historyMode: HistoryMode;
}

/**
 * Table des sept paramètres d'état d'interface. `g<n>log` est une FAMILLE de paramètres (un par
 * graphe numéroté n) : `uiStateParamName` la génère à la demande plutôt que de l'énumérer ici.
 */
export const UI_STATE_PARAMS: readonly UiStateParamDef[] = [
  { param: 'm', historyMode: 'push' },
  { param: 'grp', historyMode: 'replace' },
  { param: 'mk', historyMode: 'replace' },
  { param: 'sort', historyMode: 'replace' },
  { param: 'g4v', historyMode: 'replace' },
  { param: 'selx', historyMode: 'push' },
  { param: 'sely', historyMode: 'push' },
];

/** `g<n>log` — un paramètre par graphe numéroté (bascule log conditionnelle, EX-SCR-16). */
export function graphLogParam(graphNumber: number): string {
  return `g${graphNumber}log`;
}

/** État d'interface : identique en forme à une sélection de filtres (param → valeur brute). */
export type UiState = Readonly<Record<string, FilterValue>>;

/* ================================================================================================
 * Encodage d'une valeur canonique (réutilise l'ordre de code de D2 pour les multi-valeurs)
 * ============================================================================================== */

/** Normalise une valeur en liste de codes non vides, triés par `compareCode` (identique à D2). */
function toSortedCodes(value: FilterValue): string[] {
  const raw = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();
  for (const v of raw) {
    const s = typeof v === 'number' ? formatNumber(v) : v;
    if (s.length > 0) seen.add(s);
  }
  return [...seen].sort(compareCode);
}

/** Formate un nombre sans notation scientifique ni décimales superflues (`18000`, pas `18000.0`). */
function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '';
  return String(n);
}

/**
 * Encode UNE valeur de code pour la requête : `encodeURIComponent`, à l'exception du séparateur
 * `,` (réservé à `EX-NAV-6`, jamais produit par un code de vocabulaire ni par un nombre formaté —
 * il ne peut donc apparaître qu'au sein d'un champ TEXTE LIBRE, où il doit alors être encodé).
 */
function encodeValueSegment(segment: string): string {
  return encodeURIComponent(segment);
}

/**
 * `makesModelsVariants` (`mmmv`) porte son propre échappement de virgule interne
 * (`EX-SCR-72` : virgule littérale de `version` échappée en `,,` puis `%2C` PAR LE SÉLECTEUR
 * `G`, avant remise au codec). Le codec ne réencode donc PAS ses blocs, pour ne jamais les
 * doubler — seule exception à `encodeValueSegment` ci-dessus.
 */
const RAW_PASSTHROUGH_IDS: ReadonlySet<string> = new Set(['makesModelsVariants']);

/** Sérialise une paire `param=valeur` pour un filtre, ou `null` si la valeur est vide. */
function serializeFilterPair(filterId: string, value: FilterValue): { param: string; encoded: string } | null {
  const def = FILTER_DEFS.find((d) => d.id === filterId);
  if (def === undefined) return null; // filtre inconnu du registre : jamais sérialisé
  const codes = toSortedCodes(value);
  if (codes.length === 0) return null;
  const raw = RAW_PASSTHROUGH_IDS.has(filterId);
  const encoded = codes.map((c) => (raw ? c : encodeValueSegment(c))).join(',');
  return { param: def.param, encoded };
}

/** Sérialise une paire `param=valeur` d'état d'interface. */
function serializeUiPair(param: string, value: FilterValue): { param: string; encoded: string } | null {
  const codes = toSortedCodes(value);
  if (codes.length === 0) return null;
  return { param, encoded: codes.map(encodeValueSegment).join(',') };
}

/**
 * Vrai si la valeur d'un filtre égale sa valeur par défaut (jamais émise, `EX-NAV-8`). Les
 * défauts par filtre sont fournis par l'appelant (D5 ne fige aucune politique de défaut dans le
 * codec générique, cohérent avec la décision de D2 pour `computeSelectionHash`).
 */
function equalsDefault(value: FilterValue, defaultValue: FilterValue | undefined): boolean {
  if (defaultValue === undefined) return false;
  return toSortedCodes(value).join(',') === toSortedCodes(defaultValue).join(',');
}

export interface SerializeQueryOptions {
  /** Valeurs par défaut de filtres à omettre (clés = id KYCAR), `EX-NAV-8`. */
  readonly filterDefaults?: SelectionState;
  /** Valeurs par défaut de paramètres d'état d'interface à omettre (clés = param). */
  readonly uiDefaults?: UiState;
}

/**
 * Sérialise l'état de filtres ET l'état d'interface en UNE requête canonique unique (`EX-NAV-9` :
 * un seul ordre alphabétique par nom de paramètre, filtres et état d'interface confondus).
 */
export function serializeQuery(
  selection: SelectionState,
  uiState: UiState = {},
  options: SerializeQueryOptions = {},
): string {
  const pairs: Array<{ param: string; encoded: string }> = [];

  for (const [filterId, value] of Object.entries(selection)) {
    if (options.filterDefaults && equalsDefault(value, options.filterDefaults[filterId])) continue;
    const pair = serializeFilterPair(filterId, value);
    if (pair !== null) pairs.push(pair);
  }
  for (const [param, value] of Object.entries(uiState)) {
    if (options.uiDefaults && equalsDefault(value, options.uiDefaults[param])) continue;
    const pair = serializeUiPair(param, value);
    if (pair !== null) pairs.push(pair);
  }

  // EX-NAV-9 : ordre alphabétique FIXE par nom de paramètre. Comparaison de code point simple
  // (tous les noms de paramètre sont ASCII minuscule/chiffres) — indépendante de la locale.
  pairs.sort((a, b) => (a.param < b.param ? -1 : a.param > b.param ? 1 : 0));

  return pairs.map((p) => `${p.param}=${p.encoded}`).join('&');
}

/* ================================================================================================
 * Assemblage et plafond de longueur (EX-NAV-10/11)
 * ============================================================================================== */

export interface UrlAssembly {
  readonly url: string;
  readonly length: number;
  readonly withinBudget: boolean;
}

/** Assemble `origine + chemin + ('?' + requête si non vide)` et mesure sa longueur totale. */
export function assembleUrl(originAndPath: string, query: string): UrlAssembly {
  const url = query.length > 0 ? `${originAndPath}?${query}` : originAndPath;
  const length = url.length;
  return { url, length, withinBudget: length <= MAX_URL_LENGTH };
}

/**
 * `EX-NAV-11` : est-ce que POSER `additionalSelection`/`additionalUiState` en plus de l'état
 * courant ferait dépasser le plafond ? Ne modifie rien — l'appelant (composant de filtre) doit
 * REFUSER la modification et afficher le message si `true`, sans jamais tronquer.
 */
export function wouldExceedBudget(
  originAndPath: string,
  selection: SelectionState,
  uiState: UiState,
  options: SerializeQueryOptions = {},
): boolean {
  const query = serializeQuery(selection, uiState, options);
  return !assembleUrl(originAndPath, query).withinBudget;
}

/** Message normatif `EX-NAV-11`, jamais un simple "erreur" générique. */
export const URL_BUDGET_EXCEEDED_MESSAGE =
  "limite d'URL atteinte, retirez un filtre pour en ajouter un autre";

/* ================================================================================================
 * Analyse (parsing) d'une requête reçue — étape BRUTE, avant correction (EX-NAV-21, corrections.ts)
 * ============================================================================================== */

/** Une paire brute `param=valeur` déjà décodée (`%xx` résolu), valeur encore une chaîne unique. */
export interface RawQueryEntry {
  readonly param: string;
  /** Chaîne brute après décodage URL, AVANT scission par virgule. */
  readonly raw: string;
}

/**
 * Découpe une requête `?a=1&b=2,3` (le `?` initial est toléré et ignoré) en paires `param, brut`
 * décodées. Ne connaît PAS `filter-registry.ts` : un paramètre inconnu du catalogue reste dans la
 * sortie, à charge de `corrections.ts` de le retirer (`EX-NAV-21`, classe « paramètre inconnu »).
 */
export function parseRawQuery(query: string): readonly RawQueryEntry[] {
  const q = query.startsWith('?') ? query.slice(1) : query;
  if (q.length === 0) return [];
  const out: RawQueryEntry[] = [];
  for (const segment of q.split('&')) {
    if (segment.length === 0) continue;
    const eq = segment.indexOf('=');
    const rawParam = eq === -1 ? segment : segment.slice(0, eq);
    const rawValue = eq === -1 ? '' : segment.slice(eq + 1);
    let param: string;
    let value: string;
    try {
      param = decodeURIComponent(rawParam);
      value = decodeURIComponent(rawValue);
    } catch {
      // Séquence `%` invalide : conservée telle quelle, `corrections.ts` la traitera comme une
      // valeur hors domaine (elle ne matchera aucun code connu) plutôt que de faire échouer tout
      // le chargement de l'URL sur un seul paramètre malformé.
      param = rawParam;
      value = rawValue;
    }
    out.push({ param, raw: value });
  }
  return out;
}

/** Scinde une valeur brute multi-valeurs par virgule (`EX-NAV-6`), en retirant les segments vides. */
export function splitMultiValue(raw: string): string[] {
  if (raw.length === 0) return [];
  return raw.split(',').filter((s) => s.length > 0);
}

/** Retrouve le `FilterDef` d'un paramètre, ou `undefined` s'il est inconnu du catalogue retenu. */
export function filterDefForParam(param: string): ReturnType<typeof FILTER_BY_PARAM.get> {
  return FILTER_BY_PARAM.get(param);
}
