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
 * `page`/`sel` (D-12, écran D) : la déclaration d'état d'interface et le codec définitifs sont
 * livrés par fix-state (DR-066/067, `src/state/`, hors périmètre fix-screens). En attendant leur
 * fusion, ce module expose des fonctions LOCALES MINIMALES (`// TODO fix-state contract`) que
 * l'écran D consomme dès maintenant — le coordinateur les remplacera par le codec définitif à la
 * fusion (voir le rapport de lot, § « Contrat d'URL consommé »).
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
  };
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
 * Écran D — `page` et `sel` (D-12, DR-066/067)
 * ================================================================================================
 * // TODO fix-state contract — ces deux paramètres sont déclarés ICI en fonctions locales MINIMALES
 * // le temps que fix-state (i) sorte `page` du registre de filtres classe `T` pour en faire un
 * // paramètre d'état d'interface (DR-066), et (ii) déclare `sel` de même (DR-067). Le coordinateur
 * // remplacera cette lecture locale par le codec définitif de `src/state` à la fusion — voir le
 * // rapport de lot, § « Contrat d'URL consommé ».
 * ============================================================================================== */

/** Lit `page` depuis un jeu de paires clé→valeur (1-based, EX-NAV-10bis). Repli sur `1` si absent,
 * non entier ou `< 1` — jamais une page négative ou fractionnaire. */
export function readListingsPage(params: { get(key: string): string | null }): number {
  const raw = params.get('page');
  if (raw === null) return 1;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** Sérialise `page` : DÉFAUT (1) JAMAIS ÉMIS (EX-NAV-8). */
export function writeListingsPage(page: number): readonly (readonly [string, string])[] {
  return page > 1 ? [['page', String(page)]] : [];
}

/** Restriction d'affichage de l'écran D (`EX-SCR-202`) : bornes `<lo>-<hi>` sur le PRIX — seul axe
 * commun aux deux projections du nuage (G4a : X = prix ; G4b : Y = prix), donc l'axe le plus robuste
 * pour un lien « Voir ces annonces » indépendant de la variante active au moment du brossage. Cette
 * hypothèse est celle que `DistributionScreen::onViewBrushedListings` (DR-079) encode déjà ; elle
 * n'est PAS un filtre (Σ inchangée), seulement une restriction d'AFFICHAGE des lignes de l'écran D. */
export function readListingsSel(params: { get(key: string): string | null }): BrushRange | null {
  return parseRange(params.get('sel'));
}

/** Sérialise `sel`. Absent : rien n'est émis (EX-NAV-8). */
export function writeListingsSel(sel: BrushRange | null): readonly (readonly [string, string])[] {
  return sel ? [['sel', `${sel.from}-${sel.to}`]] : [];
}
