/**
 * KYCAR — Tests des graphes additionnels G5–G15 (lot D7, EX-SCR-161..170, EX-DATA-102bis ; D8-07)
 * =================================================================================================
 * `D8-07` (dette D-17 levée) : G5, G6, G9, G10, G12, G13, G14, G15 ne recalculent plus rien depuis
 * `ListingColumnBatch` — ils consomment `RecalcResult.groupStats`/`ntiles`/`powerTiers`/
 * `depreciationIndex`/`cellStats`, calculés dans le WORKER (fix-engine). Ce fichier teste donc les
 * ADAPTATEURS purs contre des fixtures du protocole (`src/engine/stats-protocol.ts`), construites à
 * la main — fix-engine n'ayant pas encore fusionné dans ce worktree, aucune valeur numérique du
 * moteur réel n'est disponible ici. Chaque adaptateur est aussi testé dans son état `'unavailable'`
 * (champ `undefined`), l'état attendu tant que le worker ne publie pas encore le champ.
 *
 * G7 (densité) et G8 (liste des outliers) restent hors du protocole worker de D8-07 (aucun champ
 * dédié) et gardent leurs tests d'origine sur `ListingColumnBatch`.
 */

import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '../../engine/synthetic';
import { detectOutliers } from '../../engine/outliers';
import { OutlierIndex } from '../outlier-index';
import type {
  CellStat,
  DepreciationIndexResult,
  GroupStatEntry,
  GroupStatSet,
  NtileResult,
  PowerTierResult,
} from '../../engine/index';
import {
  buildYearMedian,
  buildDepreciation,
  buildPriceMileageDensity,
  buildOutlierLollipops,
  buildCategoryBars,
  buildMileageBoxes,
  buildPowerTiers,
  selectionCellStat,
  g8ModelCaption,
  g8RSquaredWarning,
  UNAVAILABLE,
} from './graphs-model';

function fixture(n: number, seed = 21) {
  const ds = generateSyntheticDataset({ rowCount: n, seed });
  const rows = Int32Array.from({ length: n }, (_v, i) => i);
  return { ds, batch: ds.batch, rows };
}

function groupEntry(partial: Partial<GroupStatEntry> & { key: number }): GroupStatEntry {
  return { label: String(partial.key), listingCount: 0, n: 0, coverage: null, median: null, p05: null, p95: null, iqr: null, ...partial };
}

function groupSet(key: GroupStatSet['key'], metric: GroupStatSet['metric'], groups: readonly GroupStatEntry[]): GroupStatSet {
  return { key, metric, groups, unknownKeyCount: 0 };
}

describe('D8-07 — état `unavailable` : aucun recalcul de repli quand le champ du worker est absent', () => {
  it('G5/G6/G9/G12/G13/G15/G10/G14 rendent `unavailable` quand leur champ source est `undefined`', () => {
    expect(buildYearMedian(undefined)).toBe(UNAVAILABLE);
    expect(buildDepreciation(undefined)).toBe(UNAVAILABLE);
    expect(buildCategoryBars(undefined, 'fuelCategory')).toBe(UNAVAILABLE);
    expect(buildMileageBoxes(undefined, undefined)).toBe(UNAVAILABLE);
    expect(buildMileageBoxes({ metric: 'mileage', k: 5, status: 'OK', slices: [] }, undefined)).toBe(UNAVAILABLE);
    expect(buildPowerTiers(undefined)).toBe(UNAVAILABLE);
  });

  it('G8 : aucun libellé de modèle ni avertissement inventés quand `cellStats` est absent (A-09)', () => {
    expect(selectionCellStat(undefined)).toBeUndefined();
    expect(g8ModelCaption(undefined)).toBeUndefined();
    expect(g8RSquaredWarning(undefined)).toBe(false);
  });

  it('`groupStats` présent mais sans la clé demandée -> `unavailable` (jamais un tableau vide silencieux)', () => {
    expect(buildYearMedian([groupSet('fuelCategory', 'price', [groupEntry({ key: 1 })])])).toBe(UNAVAILABLE);
    expect(buildCategoryBars([groupSet('yearBucket', 'price', [groupEntry({ key: 2020 })])], 'sellerType')).toBe(UNAVAILABLE);
  });
});

describe('G5 — médiane par année, depuis `RecalcResult.groupStats` (EX-DATA-83bis)', () => {
  it('lit la clé `yearBucket`/`price`, années triées croissantes', () => {
    const groupStats = [
      groupSet('yearBucket', 'price', [
        groupEntry({ key: 2021, n: 40, median: 15000 }),
        groupEntry({ key: 2019, n: 30, median: 12000 }),
        groupEntry({ key: 2020, n: 35, median: 13500 }),
      ]),
    ];
    const ym = buildYearMedian(groupStats);
    expect(ym).not.toBe(UNAVAILABLE);
    const points = ym as Exclude<typeof ym, typeof UNAVAILABLE>;
    expect(points.map((p) => p.year)).toEqual([2019, 2020, 2021]);
    expect(points[0]!.stat.median).toBe(12000);
    expect(points[0]!.stat.n).toBe(30);
  });
});

describe('G6 — dépréciation base 100, depuis `RecalcResult.depreciationIndex` (EX-DATA-83quinquies)', () => {
  it('publie les points calculables, âge = baseYear - year, exclut les entrées à `index: null`', () => {
    const depreciationIndex: DepreciationIndexResult = {
      baseYear: 2024,
      entries: [
        { year: 2024, n: 40, medianPriceEur: 20000, index: 100, annualLossPct: null },
        { year: 2023, n: 35, medianPriceEur: 18000, index: 90, annualLossPct: 10 },
        { year: 2022, n: 5, medianPriceEur: null, index: null, annualLossPct: null }, // sous le seuil
      ],
    };
    const dep = buildDepreciation(depreciationIndex);
    expect(dep).not.toBe(UNAVAILABLE);
    const model = dep as Exclude<typeof dep, typeof UNAVAILABLE>;
    expect(model.available).toBe(true);
    expect(model.baseYear).toBe(2024);
    expect(model.points.map((p) => p.ageYears)).toEqual([0, 1]);
    expect(model.points[0]!.index).toBe(100);
  });

  it('`baseYear: null` (aucun millésime au seuil) -> non calculable', () => {
    const dep = buildDepreciation({ baseYear: null, entries: [] });
    expect(dep).toEqual({ baseYear: 0, points: [], available: false });
  });
});

describe('G7 — densité prix × km (EX-DATA-102bis, hors protocole worker D8-07)', () => {
  it('la somme des effectifs de cellule vaut l’effectif éligible', () => {
    const { batch, rows } = fixture(5000);
    const d = buildPriceMileageDensity(batch, rows);
    expect(d.available).toBe(true);
    const sum = d.cells.reduce((s, c) => s + c.count, 0);
    expect(sum).toBe(d.eligibleCount);
    expect(d.maxCount).toBeGreaterThan(0);
  });

  it('non calculable sous 40 offres', () => {
    const { batch } = fixture(5000);
    const d = buildPriceMileageDensity(batch, [0, 1, 2, 3, 4]);
    expect(d.available).toBe(false);
  });
});

describe('G8 — écart au prix attendu (EX-SCR-164, hors protocole worker D8-07) et libellé R² (D8-07)', () => {
  it('trie par opportunityScore décroissant et limite à 20', () => {
    const { batch, rows } = fixture(8000, 4);
    const out = detectOutliers(batch, rows, batch.snapshotId, 'sel');
    const idx = new OutlierIndex(out.verdicts);
    const lolli = buildOutlierLollipops(batch, rows, idx, 20);
    expect(lolli.length).toBeLessThanOrEqual(20);
    for (let i = 1; i < lolli.length; i++) {
      expect(lolli[i - 1]!.opportunityScore).toBeGreaterThanOrEqual(lolli[i]!.opportunityScore);
    }
  });

  function cellStat(partial: Partial<CellStat> = {}): CellStat {
    return {
      cellLevel: 'SELECTION',
      cellKey: 0,
      cellLabel: 'sélection courante',
      n: 400,
      median: 15000,
      mad: 1200,
      rSquared: 0.62,
      rSquaredWarning: false,
      fitCount: 380,
      implausibleInCellCount: 0,
      ...partial,
    };
  }

  it('EX-SCR-164 : libellé normatif mot pour mot, R² à deux décimales, virgule décimale', () => {
    const cell = selectionCellStat([cellStat({ rSquared: 0.6234, fitCount: 380 })]);
    expect(g8ModelCaption(cell)).toBe(
      'Modèle : ln(prix) ~ (année − moyenne) + km/10 000 — échelle robuste MAD — n = 380, R² = 0,62',
    );
    expect(g8RSquaredWarning(cell)).toBe(false);
  });

  it('EX-DATA-93bis : `rSquaredWarning` vrai quand R² < 0,30, `rSquared: null` -> « — »', () => {
    expect(g8RSquaredWarning(selectionCellStat([cellStat({ rSquared: 0.12, rSquaredWarning: true })]))).toBe(true);
    const cell = selectionCellStat([cellStat({ rSquared: null, rSquaredWarning: false })]);
    expect(g8ModelCaption(cell)).toContain('R² = —');
  });

  it('ne retient que la cellule `SELECTION` (pas `MODEL`/`MODEL_YEAR`)', () => {
    const cells: readonly CellStat[] = [cellStat({ cellLevel: 'MODEL', fitCount: 999 }), cellStat({ cellLevel: 'SELECTION', fitCount: 42 })];
    expect(selectionCellStat(cells)?.fitCount).toBe(42);
  });
});

describe('G9/G12/G13/G15 — barres catégorielles, depuis `RecalcResult.groupStats` (EX-SCR-165)', () => {
  it('barres triées par effectif décroissant, parts sommant 100, clé INCONNU absente', () => {
    const groupStats = [
      groupSet('fuelCategory', 'price', [
        groupEntry({ key: 1, n: 60, median: 14000 }),
        groupEntry({ key: 2, n: 40, median: 18000 }),
      ]),
    ];
    const bars = buildCategoryBars(groupStats, 'fuelCategory');
    expect(bars).not.toBe(UNAVAILABLE);
    const list = bars as Exclude<typeof bars, typeof UNAVAILABLE>;
    expect(list.length).toBe(2);
    for (let i = 1; i < list.length; i++) expect(list[i - 1]!.count).toBeGreaterThanOrEqual(list[i]!.count);
    const totalShare = list.reduce((s, b) => s + b.sharePct, 0);
    expect(totalShare).toBeCloseTo(100, 6);
  });
});

describe('G10 / G14 — tranches km (NTILE) et paliers puissance, depuis `RecalcResult` (D8-07)', () => {
  it('G10 : fusionne les bornes de `ntiles` et les statistiques de `groupStats` (clé `mileageNtile`) par rang', () => {
    const ntiles: NtileResult = {
      metric: 'mileage',
      k: 2,
      status: 'OK',
      slices: [
        { rank: 1, loObserved: 0, hiObserved: 50000, count: 10 },
        { rank: 2, loObserved: 50001, hiObserved: 200000, count: 10 },
      ],
    };
    const groupStats = [
      groupSet('mileageNtile', 'price', [
        groupEntry({ key: 1, n: 10, median: 16000, p05: 12000, p95: 20000 }),
        groupEntry({ key: 2, n: 10, median: 11000, p05: 8000, p95: 15000 }),
      ]),
    ];
    const boxes = buildMileageBoxes(ntiles, groupStats);
    expect(boxes).not.toBe(UNAVAILABLE);
    const result = boxes as Exclude<typeof boxes, typeof UNAVAILABLE>;
    expect(result.tileCount).toBe(2);
    expect(result.tiles.map((t) => t.rank)).toEqual([1, 2]);
    expect(result.tiles[0]!.median).toBe(16000);
    expect(result.tiles[0]!.hiObserved).toBe(50000);
  });

  it('G10 : `ntiles.metric !== "mileage"` -> `unavailable` (protocole mal formé)', () => {
    const ntiles: NtileResult = { metric: 'price', k: 5, status: 'OK', slices: [] };
    expect(buildMileageBoxes(ntiles, [])).toBe(UNAVAILABLE);
  });

  it('G14 : paliers de 20 kW ordonnés, `hiKw = upperKw − 1`', () => {
    const powerTiers: PowerTierResult = {
      tiers: [
        { tier: 1, lowerKw: 20, upperKw: 40, label: '20–39 kW', listingCount: 12, n: 12, median: 9000 },
        { tier: 0, lowerKw: 0, upperKw: 20, label: '0–19 kW', listingCount: 8, n: 8, median: 7000 },
      ],
      unknownKeyCount: 0,
    };
    const tiers = buildPowerTiers(powerTiers);
    expect(tiers).not.toBe(UNAVAILABLE);
    const list = tiers as Exclude<typeof tiers, typeof UNAVAILABLE>;
    expect(list.map((t) => t.tierIndex)).toEqual([0, 1]);
    expect(list[0]!.loKw).toBe(0);
    expect(list[0]!.hiKw).toBe(19);
    expect(list[1]!.stat.median).toBe(9000);
  });
});
