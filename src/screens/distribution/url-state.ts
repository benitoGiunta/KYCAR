/**
 * KYCAR — Paramètres d'état d'interface de l'écran B (lot D7, EX-NAV-10bis)
 * =================================================================================================
 * L'écran B ajoute plusieurs paramètres d'ÉTAT D'INTERFACE à l'URL (EX-NAV-10bis) : ils suivent les
 * mêmes règles canoniques que les filtres (ordre alphabétique à la sérialisation globale, défaut
 * JAMAIS émis — EX-NAV-8/9). Le codec canonique GLOBAL est propriété de D5 (`src/state/url-codec.ts`,
 * non modifié) ; ce module se contente de LIRE et d'ÉCRIRE la sous-partie D7, en `key → value`, pour
 * que D8 la fusionne dans l'URL. Aucune dépendance à `window`.
 *
 * Paramètres portés :
 *   - `g4v`    : variante du nuage G4 — `stack` (G4a, nuée empilée) ou `scatter` (G4b, prix×année).
 *   - `g<n>log`: échelle logarithmique du n-ième histogramme (booléen, EX-SCR-16).
 *   - `selx`   : bornes du brossage sur l'axe X, `from,to` (EX-NAV-10bis, liaison croisée EX-SCR-158).
 *   - `sely`   : bornes du brossage sur l'axe Y, `from,to`.
 */

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

function parseRange(raw: string | null | undefined): BrushRange | null {
  if (raw == null) return null;
  const parts = raw.split(',');
  if (parts.length !== 2) return null;
  const from = Number(parts[0]);
  const to = Number(parts[1]);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return from <= to ? { from, to } : { from: to, to: from };
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
  const g4vRaw = params.get('g4v');
  const g4Variant: G4Variant | undefined =
    g4vRaw === 'stack' || g4vRaw === 'scatter' ? g4vRaw : undefined;

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
    brushX: parseRange(g4vRaw === null ? params.get('selx') : params.get('selx')),
    brushY: parseRange(params.get('sely')),
  };
}

/**
 * Sérialise l'état d'interface D7 en paires clé→valeur canoniques : DÉFAUT JAMAIS ÉMIS (EX-NAV-8).
 * Retourne un tableau trié par clé (le tri global final reste au codec de D5). D8 fusionne ces
 * paires dans l'URL avant `pushState`/`replaceState`.
 */
export function writeDistributionUiState(state: DistributionUiState): readonly (readonly [string, string])[] {
  const out: (readonly [string, string])[] = [];
  if (state.g4Variant !== undefined) out.push(['g4v', state.g4Variant]);
  for (const n of [...state.logHistograms].sort((a, b) => a - b)) {
    out.push([`g${n}log`, '1']);
  }
  if (state.brushX) out.push(['selx', `${state.brushX.from},${state.brushX.to}`]);
  if (state.brushY) out.push(['sely', `${state.brushY.from},${state.brushY.to}`]);
  return out.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

/** Bascule immuable de l'échelle log d'un histogramme (helper d'état d'interface). */
export function toggleLogHistogram(state: DistributionUiState, n: number): DistributionUiState {
  const next = new Set(state.logHistograms);
  if (next.has(n)) next.delete(n);
  else next.add(n);
  return { ...state, logHistograms: next };
}
