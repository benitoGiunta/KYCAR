/**
 * KYCAR — Sondes de revue D7 · `ET-VIDE-FILTRES` sur l'écran B (EX-SCR-174, EX-SCR-26, D8-31)
 * =================================================================================================
 * Phase 2.8, vague F3. `FINAL-VERIFICATION` §3.2(b) classait `EX-SCR-174` « à sonder en 2.8 » et
 * `REMEDIATION-2.8` §7.1 n° 2 constate que la sonde n'a jamais été écrite (`grep -rn 'EX-SCR-174'
 * tests/` → 0). L'exigence, mot pour mot : « les graphes sont retirés et remplacés par le bloc
 * d'`EX-SCR-26`, dont les suggestions de retrait de filtre sont ici particulièrement utiles.
 * L'en-tête statistique reste affiché avec `aucune offre` et un `—` pour chaque statistique. Le
 * bouton `Voir les 0 annonces` est désactivé, avec l'infobulle `Aucune annonce à lister`. »
 *
 * Environnement `node`, hooks neutralisés, arbre de VNodes rendu en profondeur.
 */

import { describe, it, expect, vi } from 'vitest';
import type { RecalcResult } from '../../../src/engine/index';
import type { MetricStats } from '../../../src/types/index';
import type { RestrictiveFilterHint } from '../../../src/screens/market/state';

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
const { fixture, deepRender, findAll, byType, visibleTextOf } = await import('./_helpers');

const NOOP = (): void => {};
const f = fixture(600, 0xb0);
const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** Statistiques d'une métrique à `n = 0` : tout est non calculable, donc `null` (jamais `0`). */
function emptyMetric(base: MetricStats): MetricStats {
  return { ...base, n: 0, min: null, max: null, mean: null, p05: null, p25: null, p50: null, p75: null, p95: null, stdDev: null, iqr: null, coverage: null };
}

/** `RecalcResult` d'une sélection VIDE : aucun bucket, aucune statistique, `selectionCount = 0`. */
const emptyRecalc: RecalcResult = {
  ...f.recalc,
  priceHistogram: [],
  mileageHistogram: [],
  yearHistogram: [],
  outlierVerdicts: [],
  selectionStats: {
    ...f.recalc.selectionStats,
    selectionCount: 0,
    price: emptyMetric(f.recalc.selectionStats.price),
    mileage: emptyMetric(f.recalc.selectionStats.mileage),
    year: emptyMetric(f.recalc.selectionStats.year),
    priceOnRequestCount: 0,
    priceMissingCount: 0,
  },
};

const HINTS: readonly RestrictiveFilterHint[] = [
  { filterId: 'priceTo', label: 'Prix maximum', gain: 1420 },
  { filterId: 'mileageTo', label: 'Kilométrage maximum', gain: 380 },
  // Classe `T` (son retrait rechargerait le jeu local) : bouton SANS chiffre (EX-SCR-26).
  { filterId: 'countries', label: 'Pays', gain: null },
];

function renderEmpty(overrides: Record<string, unknown> = {}): unknown {
  return deepRender(
    DistributionScreen({
      batch: f.batch,
      recalc: emptyRecalc,
      rows: new Int32Array(0),
      ui: EMPTY_UI_STATE,
      onUiChange: NOOP,
      makeModelName: 'Volkswagen Golf',
      activeFilterCount: 12,
      topRestrictiveFilters: HINTS,
      ...overrides,
    } as never),
  );
}

const tree = renderEmpty();
const buttons = (root: unknown): { readonly props: Record<string, unknown> }[] =>
  findAll(root, byType('button')) as { props: Record<string, unknown> }[];
const buttonNamed = (root: unknown, re: RegExp) => buttons(root).find((b) => re.test(norm(visibleTextOf(b))));

describe('D7 · EX-SCR-174 — `ET-VIDE-FILTRES` sur l’écran B (D8-31)', () => {
  it('R-D7-2.8-14 — les graphes sont RETIRÉS du DOM et remplacés par le bloc d’EX-SCR-26', () => {
    expect(findAll(tree, (n) => n.props['data-graph'] !== undefined)).toHaveLength(0);
    const t = norm(visibleTextOf(tree));
    expect(t).toContain('Aucune offre ne correspond');
    expect(t).toContain('12 filtres actifs restreignent la recherche.');
  });

  it('R-D7-2.8-15 — les suggestions de retrait sont au format normatif d’EX-SCR-26, chiffrées sauf pour un filtre de classe T', () => {
    const labels = buttons(tree).map((b) => norm(visibleTextOf(b)));
    expect(labels).toContain('retirer « Prix maximum » : 1 420 offres de plus');
    expect(labels).toContain('retirer « Kilométrage maximum » : 380 offres de plus');
    expect(labels).toContain('retirer « Pays »'); // classe T : jamais de chiffre inventé
    expect(labels).toContain('Réinitialiser tous les filtres');
    expect(labels).toContain('Enregistrer cette recherche'); // reste actif (veille légitime)

    const removed: string[] = [];
    const wired = renderEmpty({ onRemoveFilter: (id: string) => removed.push(id) });
    (buttonNamed(wired, /^retirer « Prix maximum »/)?.props['onClick'] as (() => void) | undefined)?.();
    expect(removed).toEqual(['priceTo']);
  });

  it('R-D7-2.8-16 — l’en-tête statistique reste affiché, avec `aucune offre` et un `—` par statistique', () => {
    const header = findAll(tree, (n) => n.type === 'header')[0];
    expect(header).toBeDefined();
    const t = norm(visibleTextOf(header));
    expect(t).toContain('Volkswagen Golf');
    expect(t).toContain('aucune offre');
    expect(t).not.toMatch(/\d+\s*offres/); // jamais « 0 offres »
    for (const stat of ['médiane —', 'P25 —', 'P75 —', 'min —', 'max —', 'km médian —', '1ʳᵉ immat. médiane —']) {
      expect(t, stat).toContain(stat);
    }
    expect(t).toContain('— % particuliers');
  });

  it('R-D7-2.8-17 — le bouton `Voir les 0 annonces` est désactivé, avec l’infobulle `Aucune annonce à lister`', () => {
    const btn = buttonNamed(tree, /^Voir les 0 annonces$/);
    expect(btn, 'bouton « Voir les 0 annonces » absent').toBeDefined();
    expect(btn?.props['disabled']).toBe(true);
    expect(btn?.props['title']).toBe('Aucune annonce à lister');
  });

  it('R-D7-2.8-18 — non-régression : à effectif non nul, les 13 figures et l’en-tête chiffré sont rendus (le bloc vide n’apparaît pas)', () => {
    const full = deepRender(
      DistributionScreen({
        batch: f.batch,
        recalc: f.recalc,
        rows: f.rows,
        ui: EMPTY_UI_STATE,
        onUiChange: NOOP,
        makeModelName: 'Volkswagen Golf',
        activeFilterCount: 12,
        topRestrictiveFilters: HINTS,
      } as never),
    );
    expect(findAll(full, (n) => n.props['data-graph'] !== undefined).length).toBeGreaterThanOrEqual(13);
    expect(norm(visibleTextOf(full))).not.toContain('Aucune offre ne correspond');
    expect(buttonNamed(full, /^Voir les \d+ annonces$/)?.props['disabled']).toBeFalsy();
  });
});
