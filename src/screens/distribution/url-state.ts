/**
 * KYCAR — Paramètres d'état d'interface de l'écran B (lot D7, EX-NAV-10bis)
 * =================================================================================================
 * L'écran B ajoute plusieurs paramètres d'ÉTAT D'INTERFACE à l'URL (EX-NAV-10bis) : ils suivent les
 * mêmes règles canoniques que les filtres (ordre alphabétique à la sérialisation globale, défaut
 * JAMAIS émis — EX-NAV-8/9). Le codec canonique GLOBAL est propriété de D5 (`src/state/url-codec.ts`,
 * non modifié) ; ce module se contente de LIRE et d'ÉCRIRE la sous-partie D7, en `key → value`, pour
 * que D8 la fusionne dans l'URL. Aucune dépendance à `window`.
 *
 * Paramètres portés (D-11/D-12, `FIX-LEAD-DECISIONS.md` — DR-064/065, contrat D5 fait foi) :
 *   - `g4v`    : `a` (G4a, nuée empilée) ou `b` (G4b, prix×année) SUR LE FIL — la représentation
 *     interne (`G4Variant`) reste `'stack'`/`'scatter'`, traduite à la frontière lecture/écriture
 *     (D-11 : « le codec D5 est l'autorité sur l'URL »).
 *   - `g<n>log`: échelle logarithmique du n-ième histogramme (booléen, EX-SCR-16).
 *   - `selx`   : bornes du brossage sur l'axe X, format `lo-hi` (EX-NAV-10bis, liaison croisée
 *     EX-SCR-158) — PAS `from,to` (ancien format, incompatible avec D5, DR-065).
 *   - `sely`   : bornes du brossage sur l'axe Y, même format `lo-hi`.
 *
 * `page`/`sel` (D-12, écran D) : DÉCLARÉS par fix-state dans `UI_STATE_PARAMS` (`src/state/url-codec.ts`,
 * DR-066/067) et LUS par `loadQuery` (`src/state/corrections.ts`). Ce module ne redéclare plus rien :
 * il traduit seulement la valeur brute du codec D5 en état d'écran (et retour), comme pour `g4v` et
 * `selx`/`sely`. `historyModeFor` rend le mode d'historique du contrat D5 (`replace` pour `g4v`,
 * `page`, `size`, `sel` ; `push` pour un brossage) — la coquille n'invente aucune politique.
 */

import { loadQuery } from '../../state/corrections';
import { UI_STATE_PARAMS, type HistoryMode } from '../../state/url-codec';

/** Variante commutable du nuage G4 (EX-SCR-151). */
export type G4Variant = 'stack' | 'scatter';

/** Défaut de la variante G4 selon l'effectif (ARCHITECTURE §4.2 : ≤ 400 → nuée empilée G4a). */
export const G4_STACK_DEFAULT_MAX = 400;

/** Bornes d'un axe de brossage (inclusives). `null` = pas de brossage sur cet axe. */
export interface BrushRange {
  readonly from: number;
  readonly to: number;
}

/** État d'interface de l'écran B extrait de l'URL. */
export interface DistributionUiState {
  /** Variante explicite si présente dans l'URL, sinon `undefined` (→ défaut selon effectif). */
  readonly g4Variant?: G4Variant;
  /** Indices d'histogrammes en échelle log (ex. `{1, 3}` pour `g1log` + `g3log`). */
  readonly logHistograms: ReadonlySet<number>;
  /** Bornes du brossage X, ou `null`. */
  readonly brushX: BrushRange | null;
  /** Bornes du brossage Y, ou `null`. */
  readonly brushY: BrushRange | null;
  /** `page` (D-12, DR-066) — pagination 1-based de l'écran D. Défaut `1`, jamais émis (EX-NAV-8). */
  readonly page?: number;
  /** `sel` (D-12, DR-067, EX-SCR-202) — restriction d'AFFICHAGE de l'écran D (bornes de prix). */
  readonly sel?: BrushRange | null;
}

/** Défaut vide (aucun paramètre D7 dans l'URL). */
export const EMPTY_UI_STATE: DistributionUiState = {
  logHistograms: new Set(),
  brushX: null,
  brushY: null,
};

const LOG_PARAM_RE = /^g(\d+)log$/;

/** Résout la variante EFFECTIVE de G4 : l'URL prime, sinon le défaut par effectif. */
export function effectiveG4Variant(state: DistributionUiState, selectionCount: number): G4Variant {
  if (state.g4Variant !== undefined) return state.g4Variant;
  return selectionCount <= G4_STACK_DEFAULT_MAX ? 'stack' : 'scatter';
}

/** `lo-hi` (D-12, DR-065) — un seul tiret sépare les deux bornes ; les valeurs des trois métriques
 * (prix, km, année) sont toujours ≥ 0, donc un tiret UNIQUE sans ambiguïté avec un signe négatif. */
const RANGE_RE = /^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/;

function parseRange(raw: string | null | undefined): BrushRange | null {
  if (raw == null) return null;
  const m = RANGE_RE.exec(raw);
  if (!m) return null;
  const from = Number(m[1]);
  const to = Number(m[2]);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return from <= to ? { from, to } : { from: to, to: from };
}

/** `page` (D-12) : entier 1-based ; toute autre forme retombe sur la page 1 (jamais une erreur). */
function parsePage(raw: string | null | undefined): number {
  if (raw == null) return 1;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** `g4v` (D-11) : vocabulaire d'URL `a`/`b` ↔ représentation interne `stack`/`scatter`. */
function g4vFromWire(raw: string | null): G4Variant | undefined {
  if (raw === 'a') return 'stack';
  if (raw === 'b') return 'scatter';
  return undefined;
}
function g4vToWire(variant: G4Variant): 'a' | 'b' {
  return variant === 'stack' ? 'a' : 'b';
}

/**
 * Lit l'état d'interface D7 depuis un jeu de paires clé→valeur (typiquement issu de `URLSearchParams`
 * ou du codec global de D5). Tolérant : ignore les valeurs mal formées (D5 gère la table de
 * corrections EX-NAV-21 ; ici on n'émet jamais d'erreur bloquante).
 */
export function readDistributionUiState(params: {
  get(key: string): string | null;
  keys?(): IterableIterator<string>;
  forEach?(cb: (value: string, key: string) => void): void;
}): DistributionUiState {
  const g4Variant = g4vFromWire(params.get('g4v'));

  const logHistograms = new Set<number>();
  const consider = (key: string, value: string | null): void => {
    const m = LOG_PARAM_RE.exec(key);
    if (m && (value === '1' || value === 'true')) {
      logHistograms.add(Number(m[1]));
    }
  };
  if (typeof params.forEach === 'function') {
    params.forEach((value, key) => consider(key, value));
  } else if (typeof params.keys === 'function') {
    for (const key of params.keys()) consider(key, params.get(key));
  }

  return {
    g4Variant,
    logHistograms,
    brushX: parseRange(params.get('selx')),
    brushY: parseRange(params.get('sely')),
    page: parsePage(params.get('page')),
    sel: parseRange(params.get('sel')),
  };
}

/**
 * Lecture depuis la REQUÊTE BRUTE en passant par le codec canonique de D5 (`loadQuery`, table de
 * corrections `EX-NAV-21`) : c'est le chemin que la coquille emprunte (`EX-NAV-18` — le rendu est
 * une fonction pure de l'URL). Les corrections éventuelles restent disponibles pour l'appelant.
 */
export function readDistributionUiStateFromQuery(search: string): DistributionUiState {
  const ui = loadQuery(search).uiState;
  const get = (key: string): string | null => {
    const raw = ui[key];
    if (raw === undefined) return null;
    return Array.isArray(raw) ? (raw[0] ?? null) : (raw as string);
  };
  return readDistributionUiState({
    get,
    forEach: (cb) => {
      for (const [key, value] of Object.entries(ui)) {
        cb(Array.isArray(value) ? (value[0] ?? '') : (value as string), key);
      }
    },
  });
}

/**
 * Sérialise l'état d'interface D7 en paires clé→valeur canoniques : DÉFAUT JAMAIS ÉMIS (EX-NAV-8).
 * Retourne un tableau trié par clé (le tri global final reste au codec de D5). D8 fusionne ces
 * paires dans l'URL avant `pushState`/`replaceState`.
 */
export function writeDistributionUiState(state: DistributionUiState): readonly (readonly [string, string])[] {
  const out: (readonly [string, string])[] = [];
  if (state.g4Variant !== undefined) out.push(['g4v', g4vToWire(state.g4Variant)]);
  for (const n of [...state.logHistograms].sort((a, b) => a - b)) {
    out.push([`g${n}log`, '1']);
  }
  if (state.brushX) out.push(['selx', `${state.brushX.from}-${state.brushX.to}`]);
  if (state.brushY) out.push(['sely', `${state.brushY.from}-${state.brushY.to}`]);
  // `page` (D-12) : défaut 1 JAMAIS émis (EX-NAV-8). `sel` : absent = rien.
  if (state.page !== undefined && state.page > 1) out.push(['page', String(state.page)]);
  if (state.sel) out.push(['sel', `${state.sel.from}-${state.sel.to}`]);
  return out.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

/** Bascule immuable de l'échelle log d'un histogramme (helper d'état d'interface). */
export function toggleLogHistogram(state: DistributionUiState, n: number): DistributionUiState {
  const next = new Set(state.logHistograms);
  if (next.has(n)) next.delete(n);
  else next.add(n);
  return { ...state, logHistograms: next };
}

/* ================================================================================================
 * Écran D — `page` et `sel` (D-12, DR-066/067) : contrat D5 CONSOMMÉ, plus aucune déclaration locale
 * ============================================================================================== */

/** Les deux paramètres sont déclarés par fix-state dans `UI_STATE_PARAMS` — vérifié à l'exécution
 * plutôt que dupliqué : si le contrat D5 changeait, la lecture ci-dessus cesserait d'être fondée. */
const UI_PARAM_HISTORY_MODE: ReadonlyMap<string, HistoryMode> = new Map(
  UI_STATE_PARAMS.map((p) => [p.param, p.historyMode] as const),
);

/**
 * Mode d'historique d'un changement d'état d'interface (`EX-NAV-12`/`13`, contrat D5) : `push` dès
 * qu'un paramètre déclaré `push` change (un brossage est une action d'historique à part entière),
 * `replace` sinon (`g4v`, `page`, `size`, `sel`, `g<n>log`).
 */
export function historyModeFor(prev: DistributionUiState, next: DistributionUiState): HistoryMode {
  const before = new Map(writeDistributionUiState(prev).map(([k, v]) => [k, v] as const));
  const after = new Map(writeDistributionUiState(next).map(([k, v]) => [k, v] as const));
  const changed = new Set<string>();
  for (const [k, v] of after) if (before.get(k) !== v) changed.add(k);
  for (const [k] of before) if (!after.has(k)) changed.add(k);
  for (const param of changed) {
    if (UI_PARAM_HISTORY_MODE.get(param) === 'push') return 'push';
  }
  return 'replace';
}

/** Page 1-based de l'écran D lue depuis l'état d'interface (contrat D5, `D-12`). */
export function readListingsPage(params: { get(key: string): string | null }): number {
  return parsePage(params.get('page'));
}

/** Restriction d'affichage `sel` (`EX-SCR-202`, bornes de PRIX — axe commun aux deux projections du
 * nuage). Ce n'est PAS un filtre : Σ ne change jamais, seules les LIGNES MONTRÉES sont restreintes. */
export function readListingsSel(params: { get(key: string): string | null }): BrushRange | null {
  return parseRange(params.get('sel'));
}
