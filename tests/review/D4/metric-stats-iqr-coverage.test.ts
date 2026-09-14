import { describe, expect, it } from 'vitest';
import { exactMetricStats, metricStatsFromCounts } from '../../../src/engine/quantiles';
import { AggregationDataset } from '../../../src/engine/kernel';
import { makeBatch, type RowSpec } from './helpers';

/**
 * Revue D4 — **D8-30** (résidu `DR-122` / `D8-10`) : les deux dernières valeurs du bloc
 * d'`EX-DATA-64` — `iqr = q3 − q1` et `coverage = n_m / N` (`EX-DATA-61`) — sont PUBLIÉES par le
 * type `MetricStats` depuis l'étape 0 de 2.8, mais restaient écrites en quatre littéraux `null`
 * dans `src/engine/quantiles.ts` (`REMEDIATION-2.8.md` §7.1 point 1).
 *
 * Règle de preuve D-32 : **ces sondes sont écrites AVANT la correction** et sont ROUGES sur l'état
 * d'arrivée du worktree (commit `4c00ecc`) — `iqr` et `coverage` y valent `null` partout, et les
 * deux fonctions n'acceptent pas encore le paramètre `selectionCount`. La sortie rouge est
 * reproduite dans `reports/remediation-2.8/fix-engine-2.md` §2.
 *
 * `N` est l'effectif de la SÉLECTION courante `|Σ|` (`EX-DATA-64`, ligne `count`), jamais le total
 * du snapshot : chaque sonde le passe explicitement et le confronte à `SelectionStats.selectionCount`.
 */

/** Arrondi normatif de `coverage` : 4 décimales (`EX-DATA-61`, `EX-DATA-64`). */
const round4 = (x: number): number => Math.round(x * 1e4) / 1e4;

const FULL = { selectionHash: 'FULL:EMPTY' } as const;

describe('R-D4-2.8-01 — EX-DATA-64 : `iqr = q3 − q1` sur un jeu connu', () => {
  it('{10, 20, 30, 40, 50} : q1 = 20, q3 = 40, iqr = 20 (jamais null à n ≥ 1)', () => {
    const s = exactMetricStats([50, 10, 40, 20, 30], 8);
    expect(s.p25).toBe(20);
    expect(s.p75).toBe(40);
    expect(s.iqr).toBe(20);
    expect(s.iqr).toBe((s.p75 as number) - (s.p25 as number));
  });

  it('n = 1 : iqr vaut 0 — une valeur RÉELLE (q3 = q1 = x₁), pas un inconnu', () => {
    const s = exactMetricStats([7], 3);
    expect(s.iqr).toBe(0);
  });

  it('domaine CREUX (chemin de tri comparatif) : iqr identique à q3 − q1', () => {
    // Un seul outlier étend le domaine au-delà de 4·n : `exactStatsBySort` prend le relais.
    const values = [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 3_000_000];
    const s = exactMetricStats(values, 10);
    expect(s.iqr).toBeCloseTo((s.p75 as number) - (s.p25 as number), 12);
    expect(s.iqr as number).toBeGreaterThan(0);
  });

  it('n = 0 : iqr null (défini seulement à n ≥ 1)', () => {
    expect(exactMetricStats([]).iqr).toBeNull();
    expect(exactMetricStats([], 12).iqr).toBeNull();
  });
});

describe('R-D4-2.8-02 — EX-DATA-61/64 : `coverage = n_m / N` arrondie à 4 décimales', () => {
  it('n = 5, N = 8 → 0,625 exactement', () => {
    expect(exactMetricStats([50, 10, 40, 20, 30], 8).coverage).toBe(0.625);
  });

  it('n = 1, N = 3 → 0,3333 (arrondi à 4 décimales, pas 0,333333…)', () => {
    expect(exactMetricStats([7], 3).coverage).toBe(0.3333);
  });

  it('n = 2, N = 3 → 0,6667 (arrondi au plus proche, pas troncature)', () => {
    expect(exactMetricStats([7, 9], 3).coverage).toBe(0.6667);
  });

  it('n = N → 1 ; n = 0 avec N ≥ 1 → 0 (division parfaitement définie, jamais null)', () => {
    expect(exactMetricStats([7, 9, 11], 3).coverage).toBe(1);
    expect(exactMetricStats([], 10).coverage).toBe(0);
  });

  it('N inconnu (paramètre omis) → coverage null, jamais un chiffre inventé', () => {
    expect(exactMetricStats([50, 10, 40, 20, 30]).coverage).toBeNull();
    expect(exactMetricStats([]).coverage).toBeNull();
  });

  it('N = 0 → coverage null (EX-DATA-64 : défini si N ≥ 1)', () => {
    expect(exactMetricStats([], 0).coverage).toBeNull();
  });
});

describe('R-D4-2.8-03 — `metricStatsFromCounts` : même contrat sur le chemin par comptage', () => {
  it('valeurs 10, 12, 12, 20 (comptages à trous), N = 5 : iqr = 2,5 et coverage = 0,8', () => {
    const counts = new Int32Array(11); // domaine [10, 20]
    counts[0] = 1; // 10
    counts[2] = 2; // 12
    counts[10] = 1; // 20
    const s = metricStatsFromCounts(counts, 10, 4, null, null, 5);
    expect(s.p25).toBeCloseTo(11.5, 12);
    expect(s.p75).toBeCloseTo(14, 12);
    expect(s.iqr).toBeCloseTo(2.5, 12);
    expect(s.coverage).toBe(0.8);
  });

  it('n = 0 avec N = 4 : bloc nul mais coverage = 0 ; sans N : coverage null', () => {
    const counts = new Int32Array(3);
    const withN = metricStatsFromCounts(counts, 0, 0, null, null, 4);
    expect(withN.iqr).toBeNull();
    expect(withN.coverage).toBe(0);
    const withoutN = metricStatsFromCounts(counts, 0, 0, null, null);
    expect(withoutN.iqr).toBeNull();
    expect(withoutN.coverage).toBeNull();
  });
});

/**
 * Cohérence avec `GroupStatEntry` (`R-D8-07-01`), qui publie `iqr` et `coverage` CALCULÉS depuis
 * D8-07. Le jeu est bâti pour que la sélection entière forme un GROUPE UNIQUE (même `fuelCategory`)
 * : le groupe et la sélection partagent alors exactement `V_price`, donc le même `q3 − q1`, et le
 * même rapport `n / N` — au seul arrondi près, `GroupStatEntry.coverage` n'étant pas arrondie.
 */
describe('R-D4-2.8-04 — cohérence `MetricStats` × `GroupStatEntry` sur la même sélection', () => {
  const rows: RowSpec[] = [];
  for (let i = 0; i < 40; i++) {
    // 32 prix fermes plausibles, 8 annonces sans prix : n = 32, N = 40.
    rows.push(
      i < 32
        ? { fuel: 1, price: 12_000 + i * 250, year: 2018, mileage: 60_000 + i * 500 }
        : { fuel: 1, price: null, status: 'MISSING', year: 2018, mileage: 60_000 + i * 500 },
    );
  }

  it('la sélection publie iqr et coverage, et N vaut selectionCount (jamais le total du snapshot)', () => {
    const result = new AggregationDataset(makeBatch(rows)).recalculate(FULL);
    const stats = result.selectionStats;
    expect(stats.selectionCount).toBe(40);
    expect(stats.price.n).toBe(32);
    expect(stats.price.iqr).toBe((stats.price.p75 as number) - (stats.price.p25 as number));
    expect(stats.price.coverage).toBe(round4(32 / 40));
    expect(stats.price.coverage).toBe(0.8);
    // Les deux autres métriques sont connues sur les 40 lignes : couverture pleine.
    expect(stats.year.coverage).toBe(1);
    expect(stats.mileage.coverage).toBe(1);
    expect(stats.year.iqr).not.toBeNull();
  });

  it('le groupe unique de `fuelCategory` porte le MÊME iqr et la même couverture métrique', () => {
    const result = new AggregationDataset(makeBatch(rows)).recalculate(FULL);
    const set = (result.groupStats ?? []).find((s) => s.key === 'fuelCategory');
    expect(set?.groups.length).toBe(1);
    const group = set?.groups[0];
    expect(group?.listingCount).toBe(result.selectionStats.selectionCount);
    expect(group?.n).toBe(result.selectionStats.price.n);
    expect(group?.iqr).toBeCloseTo(result.selectionStats.price.iqr as number, 9);
    expect(round4(group?.coverage as number)).toBe(result.selectionStats.price.coverage);
  });
});
