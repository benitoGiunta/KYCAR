/**
 * KYCAR — Sondes de revue D7 · bascule logarithmique de l'axe des PRIX (EX-SCR-17, EX-SCR-153)
 * =================================================================================================
 * Phase 2.8, vague F3 (`D8-31`). `FINAL-VERIFICATION` §3.2(d) et `REMEDIATION-2.8` §7.1 n° 3
 * relèvent `EX-SCR-17` toujours ouverte : « bascule d'échelle log de G7 absente »
 * (`grep -c 'onToggleLog|log' AdditionalGraphs.tsx` → 0). L'exigence est double et se prouve des
 * deux côtés :
 *   (a) une bascule log EST offerte sur l'axe des prix du SEUL graphe `G7` (densité prix × km) ;
 *   (b) aucun AUTRE axe de prix n'est logarithmique — en particulier `G4` n'a AUCUNE échelle log
 *       (`EX-SCR-153`), et `G1` (prix) n'est pas entraîné par la bascule de `G7`.
 * L'état est porté par le mécanisme EXISTANT `ui.logHistograms` / `g<n>log` (`EX-SCR-16`,
 * `EX-NAV-10bis`), avec l'indice 7 — encodage/décodage d'URL éprouvé ci-dessous.
 *
 * Environnement `node`, hooks de Preact neutralisés : chaque composant est une fonction pure de ses
 * props, l'arbre de VNodes est inspecté (même technique que `ecran-b.test.ts`).
 */

import { describe, it, expect, vi } from 'vitest';
import type { DistributionUiState } from '../../../src/screens/distribution/url-state';

vi.mock('preact/hooks', () => ({
  useState: <T>(init: T | (() => T)) => [typeof init === 'function' ? (init as () => T)() : init, (): void => {}],
  useMemo: <T>(fn: () => T) => fn(),
  useEffect: (): void => {},
  useLayoutEffect: (): void => {},
  useRef: <T>(init: T) => ({ current: init }),
  useCallback: <T>(fn: T) => fn,
  useContext: () => undefined,
  useReducer: () => [undefined, (): void => {}],
  useId: () => 'id',
}));

const { DistributionScreen } = await import('../../../src/screens/distribution/DistributionScreen');
const { EMPTY_UI_STATE, readDistributionUiState, writeDistributionUiState, historyModeFor } = await import(
  '../../../src/screens/distribution/url-state'
);
const { loadQuery } = await import('../../../src/state/corrections');
const { fixture, withCountryCodes, deepRender, findAll, visibleTextOf } = await import('./_helpers');

const NOOP = (): void => {};
const f = withCountryCodes(fixture(1200, 0xb7), [0, 1]);

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();

function renderScreen(overrides: Record<string, unknown> = {}): unknown {
  return deepRender(
    DistributionScreen({
      batch: f.batch,
      recalc: f.recalc,
      rows: f.rows,
      ui: EMPTY_UI_STATE,
      onUiChange: NOOP,
      makeModelName: 'Volkswagen Golf',
      ...overrides,
    } as never),
  );
}

/** La figure d'un graphe donné, dans l'arbre rendu en profondeur. */
function figureOf(tree: unknown, graphId: string): { readonly type: unknown; readonly props: Record<string, unknown> } {
  const fig = findAll(tree, (n) => n.props['data-graph'] === graphId)[0];
  expect(fig, `figure ${graphId} absente`).toBeDefined();
  return fig as { type: unknown; props: Record<string, unknown> };
}

/** Tous les contrôles (boutons / cases) dont le NOM ACCESSIBLE parle d'échelle logarithmique. */
function logControls(root: unknown): { readonly type: unknown; readonly props: Record<string, unknown> }[] {
  return findAll(root, (n) => {
    if (n.type !== 'button' && n.type !== 'label' && n.type !== 'input') return false;
    const name = `${norm(visibleTextOf(n))} ${String(n.props['aria-label'] ?? '')}`.toLowerCase();
    return /\blog\b|logarithmique/.test(name);
  }) as { type: unknown; props: Record<string, unknown> }[];
}

const uiWithLog = (n: number): DistributionUiState => ({ ...EMPTY_UI_STATE, logHistograms: new Set([n]) });

describe('D7 · EX-SCR-17 — bascule log offerte sur l’axe des PRIX de G7 (D8-31)', () => {
  it('R-D7-2.8-02 — G7 porte un contrôle nommé, avec `aria-pressed`, qui bascule l’échelle log de l’axe des prix', () => {
    const g7 = figureOf(renderScreen(), 'G7');
    const controls = logControls(g7);
    expect(controls.length, 'aucune bascule log sur G7').toBe(1);
    const toggle = controls[0]!;
    // Nom explicite : la bascule dit sur QUEL axe elle agit (l'axe des prix), jamais « log » seul.
    expect(norm(visibleTextOf(toggle)).toLowerCase()).toContain('prix');
    // `aria-pressed` (bouton bascule) : faux tant que `logHistograms` ne porte pas l'indice 7.
    expect(toggle.props['aria-pressed']).toBe(false);
  });

  it('R-D7-2.8-03 — la bascule reflète `ui.logHistograms` (indice 7) et son activation appelle `onUiChange` avec l’indice 7 ajouté', () => {
    const pressed = figureOf(renderScreen({ ui: uiWithLog(7) }), 'G7');
    expect(logControls(pressed)[0]?.props['aria-pressed']).toBe(true);

    const seen: DistributionUiState[] = [];
    const g7 = figureOf(renderScreen({ onUiChange: (next: DistributionUiState) => seen.push(next) }), 'G7');
    const onClick = logControls(g7)[0]?.props['onClick'] as (() => void) | undefined;
    expect(typeof onClick, 'la bascule de G7 n’est pas câblée').toBe('function');
    onClick?.();
    expect(seen).toHaveLength(1);
    expect([...(seen[0] as DistributionUiState).logHistograms]).toEqual([7]);
  });

  it('R-D7-2.8-04 — l’échelle log de G7 change RÉELLEMENT la position des cellules sur l’axe des prix (jamais un drapeau décoratif)', () => {
    const yOf = (tree: unknown): string[] =>
      findAll(figureOf(tree, 'G7'), (n) => n.type === 'rect' && n.props['data-price-lower'] !== undefined).map(
        (n) => `${String(n.props['y'])}/${String(n.props['height'])}`,
      );
    const lin = yOf(renderScreen());
    const log = yOf(renderScreen({ ui: uiWithLog(7) }));
    expect(lin.length, 'aucune cellule de densité positionnée sur un axe de prix').toBeGreaterThan(3);
    expect(log).toHaveLength(lin.length);
    expect(log).not.toEqual(lin);
  });

  it('R-D7-2.8-05 — EX-SCR-17/153 : aucun AUTRE axe de prix ne devient log — G1 reste linéaire et G4 n’offre AUCUNE bascule log', () => {
    const tree = renderScreen({ ui: uiWithLog(7) });
    // G1 (histogramme des prix) : sa bascule à lui est l'axe des EFFECTIFS (EX-SCR-16) ; l'indice 7
    // ne doit en aucun cas l'activer.
    const g1 = figureOf(tree, 'G1');
    const g1LogBars = findAll(g1, (n) => n.props['data-log'] === true || n.props['data-log'] === 'true');
    expect(g1LogBars).toHaveLength(0);
    // G4 : « Aucune échelle logarithmique dans G4 » (EX-SCR-153), quel que soit l'état de `ui`.
    for (const ui of [EMPTY_UI_STATE, uiWithLog(4), uiWithLog(7)]) {
      const g4 = figureOf(renderScreen({ ui }), 'G4');
      expect(logControls(g4), 'G4 ne doit offrir aucune bascule log').toHaveLength(0);
    }
  });
});

describe('D7 · EX-SCR-17 — état d’URL de la bascule de G7 (`g7log`, EX-NAV-10bis)', () => {
  it('R-D7-2.8-06 — `g7log=1` est décodé par le codec D5 (`loadQuery`) sans correction, puis lu comme l’indice 7', () => {
    const loaded = loadQuery('g7log=1');
    expect(loaded.uiState['g7log']).toBe('1');
    expect(loaded.corrections.map((c) => c.kind)).not.toContain('UNKNOWN_PARAM');
    const params = new URLSearchParams('g7log=1');
    expect([...readDistributionUiState(params).logHistograms]).toEqual([7]);
  });

  it('R-D7-2.8-07 — l’indice 7 est ré-encodé en `g7log=1`, jamais émis au défaut, et reste en `replace` d’historique', () => {
    expect(writeDistributionUiState(uiWithLog(7))).toEqual([['g7log', '1']]);
    expect(writeDistributionUiState(EMPTY_UI_STATE).map(([k]) => k)).not.toContain('g7log');
    expect(historyModeFor(EMPTY_UI_STATE, uiWithLog(7))).toBe('replace');
  });
});
