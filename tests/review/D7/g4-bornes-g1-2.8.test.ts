/**
 * KYCAR — Sondes de revue D7 · échelles de G4 (EX-SCR-153, D8-31)
 * =================================================================================================
 * Phase 2.8, vague F3. `FINAL-VERIFICATION` §3.2(d) et `REMEDIATION-2.8` §7.1 n° 3 relèvent
 * `EX-SCR-153` toujours ouverte : « alignement de G4a sur les bornes/buckets de G1 non prouvé »
 * (`grep -n buckets scatter-model.ts ScatterCloud.tsx` → 0). L'exigence :
 *   - `G4a` : axe X LINÉAIRE en prix, avec **exactement les mêmes bornes et les mêmes buckets que
 *     `G1`** (grille `BIN` d'`EX-DATA-75`, ici `recalc.priceHistogram`) ; axe Y linéaire en
 *     effectif DEPUIS 0 ;
 *   - `G4b` : axe X linéaire en date de 1ʳᵉ immatriculation, graduations ANNUELLES au 1ᵉʳ janvier ;
 *     axe Y linéaire en prix ;
 *   - **aucune échelle logarithmique dans `G4`**, qui romprait la correspondance avec `G1`.
 *
 * Le graphe est un canvas : les GRADUATIONS rendues (SVG, `data-axis`/`data-tick`) sont la seule
 * trace inspectable sans DOM — elles portent les bornes et les buckets effectivement projetés.
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
const { EMPTY_UI_STATE } = await import('../../../src/screens/distribution/url-state');
const { fixture, withCountryCodes, deepRender, findAll } = await import('./_helpers');

const NOOP = (): void => {};
const f = withCountryCodes(fixture(1200, 0xb4), [0, 1]);

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

function figureOf(tree: unknown, graphId: string): unknown {
  const fig = findAll(tree, (n) => n.props['data-graph'] === graphId)[0];
  expect(fig, `figure ${graphId} absente`).toBeDefined();
  return fig;
}

/** Valeurs des graduations d'un axe (`data-axis="x"|"y"`), dans l'ordre de rendu. */
function ticksOf(figure: unknown, axis: 'x' | 'y'): number[] {
  const group = findAll(figure, (n) => n.props['data-axis'] === axis)[0];
  expect(group, `axe ${axis} absent de G4`).toBeDefined();
  return findAll(group, (n) => n.props['data-tick'] !== undefined).map((n) => Number(n.props['data-tick']));
}

/** Bornes de G1 : premier/dernier bin FERMÉ de `recalc.priceHistogram` (grille `BIN`). */
const closedG1 = f.recalc.priceHistogram.filter((b) => !b.open);
const g1Edges = [...closedG1.map((b) => b.lowerBound), closedG1[closedG1.length - 1]!.upperBound];

// `EX-SCR-152` : G4a est la vue par DÉFAUT jusqu'à 400 annonces ; la fixture en porte 1 200, donc
// la vue par défaut est G4b. Les deux vues sont exercées explicitement par `ui.g4Variant`.
const uiStack: DistributionUiState = { ...EMPTY_UI_STATE, g4Variant: 'stack' };
const uiScatter: DistributionUiState = { ...EMPTY_UI_STATE, g4Variant: 'scatter' };

describe('D7 · EX-SCR-153 — G4a : axe des prix aligné sur la grille de G1 (D8-31)', () => {
  it('R-D7-2.8-08 — les BORNES de l’axe X de G4a sont exactement celles de G1 (première borne du premier bucket, dernière du dernier)', () => {
    const g4 = figureOf(renderScreen({ ui: uiStack }), 'G4');
    const ticks = ticksOf(g4, 'x');
    expect(ticks.length).toBeGreaterThan(2);
    expect(ticks[0]).toBe(g1Edges[0]);
    expect(ticks[ticks.length - 1]).toBe(g1Edges[g1Edges.length - 1]);
  });

  it('R-D7-2.8-09 — les BUCKETS de l’axe X de G4a sont exactement ceux de G1 (mêmes bornes intermédiaires, une par bucket fermé)', () => {
    const g4 = figureOf(renderScreen({ ui: uiStack }), 'G4');
    expect(ticksOf(g4, 'x')).toEqual(g1Edges);
  });

  it('R-D7-2.8-10 — l’axe Y de G4a est linéaire en EFFECTIF depuis 0 (pas de borne basse flottante)', () => {
    const g4 = figureOf(renderScreen({ ui: uiStack }), 'G4');
    const ticks = ticksOf(g4, 'y');
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks[0]).toBe(0);
    // Linéarité : pas exigible d'un axe log, où les écarts successifs ne sont jamais constants.
    const steps = ticks.slice(1).map((v, i) => v - (ticks[i] as number));
    for (const s of steps) expect(Math.abs(s - (steps[0] as number))).toBeLessThanOrEqual(1e-6);
  });

  it('R-D7-2.8-11 — les deux échelles de G4 sont déclarées LINÉAIRES et aucune bascule log n’est offerte (EX-SCR-153)', () => {
    for (const ui of [uiStack, uiScatter]) {
      const g4 = figureOf(renderScreen({ ui }), 'G4');
      const axes = findAll(g4, (n) => n.props['data-axis'] !== undefined);
      expect(axes.length).toBe(2);
      for (const a of axes) expect(a.props['data-scale']).toBe('linear');
      const logControls = findAll(g4, (n) => {
        const label = `${String(n.props['aria-label'] ?? '')} ${String(n.props['title'] ?? '')}`.toLowerCase();
        return (n.type === 'button' || n.type === 'input') && /\blog\b|logarithmique/.test(label);
      });
      expect(logControls).toHaveLength(0);
    }
  });
});

describe('D7 · EX-SCR-153 — G4b : date de 1ʳᵉ immatriculation en X, prix en Y (D8-31)', () => {
  it('R-D7-2.8-12 — les graduations de l’axe X de G4b sont ANNUELLES, au 1ᵉʳ janvier (`firstRegistrationYearMonth ≡ 0 [12]`), en années consécutives', () => {
    const g4 = figureOf(renderScreen({ ui: uiScatter }), 'G4');
    const ticks = ticksOf(g4, 'x');
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    for (const t of ticks) expect(t % 12).toBe(0);
    const years = ticks.map((t) => t / 12);
    for (let i = 1; i < years.length; i++) expect((years[i] as number) - (years[i - 1] as number)).toBe(1);
  });

  it('R-D7-2.8-13 — l’axe Y de G4b est linéaire en PRIX (graduations croissantes à pas constant, dans les bornes de tracé)', () => {
    const g4 = figureOf(renderScreen({ ui: uiScatter }), 'G4');
    const ticks = ticksOf(g4, 'y');
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    const steps = ticks.slice(1).map((v, i) => v - (ticks[i] as number));
    for (const s of steps) {
      expect(s).toBeGreaterThan(0);
      expect(Math.abs(s - (steps[0] as number))).toBeLessThanOrEqual(1e-6);
    }
    const prices = f.recalc.selectionStats.price;
    expect(ticks[0]).toBeGreaterThanOrEqual(prices.min ?? 0);
  });
});
