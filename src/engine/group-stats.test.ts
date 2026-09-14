import { describe, expect, it } from 'vitest';
import { allFixtureRows, makeFixtureBatch, type FixtureRow } from './batch-fixture';
import {
  compareGroupLabels,
  computeGroupStats,
  GROUP_STAT_KEYS,
  powerTierLabel,
  roundHalfAway,
} from './group-stats';
import type { GroupStatSet } from './stats-protocol';

/**
 * D8-07 — `GROUPSTAT` (EX-DATA-83bis), `NTILE` (EX-DATA-83ter), paliers de puissance
 * (EX-DATA-83quater) et indice de dépréciation (EX-DATA-83quinquies), calculés DANS le worker.
 *
 * Chaque cas est un petit jeu dont les valeurs attendues sont calculées À LA MAIN par la formule de
 * l'annexe A (quantile de type 7 d'EX-DATA-62, frontières de rang d'EX-DATA-83ter, arrondi
 * `round-half-away-from-zero` d'EX-DATA-6) : l'oracle est l'exigence, jamais une seconde exécution
 * du code testé.
 */

function run(rows: readonly FixtureRow[], threshold: number | null = null) {
  const batch = makeFixtureBatch(rows);
  return computeGroupStats(batch, allFixtureRows(batch), threshold);
}

function setOf(sets: readonly GroupStatSet[], key: string): GroupStatSet {
  const found = sets.find((s) => s.key === key);
  expect(found).toBeDefined();
  return found as GroupStatSet;
}

describe('EX-DATA-83bis — GROUPSTAT(Σ, g, m)', () => {
  /**
   * 9 annonces : 5 en `fuelCategory = 1` (prix 10 000 … 50 000), 3 en `fuelCategory = 2` (deux prix
   * affichés 12 000 / 14 000, une annonce à prix SUR DEMANDE), 1 à carburant INCONNU.
   */
  const rows: FixtureRow[] = [
    { fuel: 1, price: 30_000 },
    { fuel: 1, price: 10_000 },
    { fuel: 1, price: 50_000 },
    { fuel: 1, price: 20_000 },
    { fuel: 1, price: 40_000 },
    { fuel: 2, price: 14_000 },
    { fuel: 2, price: 12_000 },
    { fuel: 2, price: null, status: 'ON_REQUEST' },
    { fuel: 255, price: 99_000 },
  ];

  it('publie exactement les neuf clés admises, et aucune autre', () => {
    const { groupStats } = run(rows);
    expect(groupStats.map((s) => s.key)).toEqual([...GROUP_STAT_KEYS]);
    expect(groupStats).toHaveLength(9);
    expect(new Set(groupStats.map((s) => s.metric))).toEqual(new Set(['price']));
  });

  it('par groupe : listingCount, n, couverture métrique, médiane, P5, P95 et IQR (quantile de type 7)', () => {
    const fuel = setOf(run(rows).groupStats, 'fuelCategory');
    const g1 = fuel.groups[0];
    const g2 = fuel.groups[1];

    // Ordre total : `listingCount` décroissant (5 puis 3).
    expect(fuel.groups.map((g) => g.key)).toEqual([1, 2]);

    // Groupe 1 : V_price = {10, 20, 30, 40, 50} k€. Type 7 : p50 = 30 000 ;
    // p05 → h = 4·0,05 + 1 = 1,2 ⇒ 10 000 + 0,2·10 000 = 12 000 ;
    // p95 → h = 4·0,95 + 1 = 4,8 ⇒ 40 000 + 0,8·10 000 = 48 000 ; IQR = 40 000 − 20 000.
    expect(g1?.listingCount).toBe(5);
    expect(g1?.n).toBe(5);
    expect(g1?.coverage).toBe(1);
    expect(g1?.median).toBe(30_000);
    expect(g1?.p05).toBe(12_000);
    expect(g1?.p95).toBe(48_000);
    expect(g1?.iqr).toBe(20_000);

    // Groupe 2 : 3 annonces, 2 prix valides ⇒ couverture MÉTRIQUE 2/3 (EX-DATA-61), jamais 1.
    expect(g2?.listingCount).toBe(3);
    expect(g2?.n).toBe(2);
    expect(g2?.coverage).toBeCloseTo(2 / 3, 12);
    expect(g2?.median).toBe(13_000);
    expect(g2?.p05).toBe(12_100);
    expect(g2?.p95).toBe(13_900);
    expect(g2?.iqr).toBe(1_000);
  });

  it('ARB-36 — INCONNU ne forme JAMAIS un groupe : il est compté dans unknownKeyCount', () => {
    const fuel = setOf(run(rows).groupStats, 'fuelCategory');
    expect(fuel.groups.map((g) => g.key)).not.toContain(255);
    expect(fuel.unknownKeyCount).toBe(1);
    // La somme des effectifs de groupe plus les clés inconnues vaut l'effectif de la sélection.
    expect(fuel.groups.reduce((s, g) => s + g.listingCount, 0) + fuel.unknownKeyCount).toBe(rows.length);
  });

  it('ordre total : listingCount décroissant, puis libellé EX-DATA-70bis, puis code croissant', () => {
    // Trois groupes de MÊME effectif (2) : le départage se fait alors sur le libellé — ici les codes
    // « 2 », « 10 » et « 3 » comparés CARACTÈRE par caractère (EX-DATA-70bis : « 10 » précède « 2 »).
    const tie: FixtureRow[] = [
      { fuel: 2, price: 1000 },
      { fuel: 2, price: 1000 },
      { fuel: 10, price: 1000 },
      { fuel: 10, price: 1000 },
      { fuel: 3, price: 1000 },
      { fuel: 3, price: 1000 },
    ];
    const fuel = setOf(run(tie).groupStats, 'fuelCategory');
    expect(fuel.groups.map((g) => g.label)).toEqual(['10', '2', '3']);
    expect(compareGroupLabels('Škoda', 'Skoda')).toBe(0);
    expect(compareGroupLabels('Série 3', 'Série 30')).toBeLessThan(0);
  });

  it('la clé yearBucket est le millésime civil (BIN ligne Année : W = {1}, O = 0)', () => {
    const year = setOf(
      run([
        { year: 2020, price: 1000 },
        { year: 2020, price: 3000 },
        { year: 2021, price: 2000 },
        { year: null, price: 5000 },
      ]).groupStats,
      'yearBucket',
    );
    expect(year.groups.map((g) => g.key)).toEqual([2020, 2021]);
    expect(year.groups.map((g) => g.label)).toEqual(['2020', '2021']);
    expect(year.unknownKeyCount).toBe(1);
    expect(year.groups[0]?.median).toBe(2000);
  });

  it('la sentinelle relative de C₃ (EX-DATA-19(2)) sort du V_price des groupes comme de celui de Σ', () => {
    const rowsWithOutlier: FixtureRow[] = [
      ...Array.from({ length: 12 }, () => ({ fuel: 1, price: 20_000 }) as FixtureRow),
      { fuel: 1, price: 900 }, // < 0,10 × 20 000 = 2 000
    ];
    const withThreshold = setOf(run(rowsWithOutlier, 2_000).groupStats, 'fuelCategory');
    expect(withThreshold.groups[0]?.listingCount).toBe(13); // l'annonce reste comptée (ARB-15)
    expect(withThreshold.groups[0]?.n).toBe(12); // …mais sort de V_price
    expect(withThreshold.groups[0]?.coverage).toBeCloseTo(12 / 13, 12);
  });
});

describe('EX-DATA-83ter — NTILE(V, k), tranches de rang', () => {
  const withMileages = (mileages: readonly number[]): FixtureRow[] =>
    mileages.map((m, i) => ({ mileage: m, price: 10_000 + i, idRank: i }));

  it('n = 7, k = 5 : frontières ⌈(t−1)·n/k⌉ < i ≤ ⌈t·n/k⌉, tailles ⌊n/k⌋ ou ⌈n/k⌉', () => {
    const { ntiles } = run(withMileages([10_000, 20_000, 30_000, 40_000, 50_000, 60_000, 70_000]));
    expect(ntiles.status).toBe('OK');
    expect(ntiles.k).toBe(5);
    expect(ntiles.metric).toBe('mileage');
    // ⌈0⌉=0, ⌈7/5⌉=2, ⌈14/5⌉=3, ⌈21/5⌉=5, ⌈28/5⌉=6, 7 ⇒ tailles 2, 1, 2, 1, 1.
    expect(ntiles.slices.map((s) => s.count)).toEqual([2, 1, 2, 1, 1]);
    expect(ntiles.slices.map((s) => s.loObserved)).toEqual([10_000, 30_000, 40_000, 60_000, 70_000]);
    expect(ntiles.slices.map((s) => s.hiObserved)).toEqual([20_000, 30_000, 50_000, 60_000, 70_000]);
    expect(ntiles.slices.map((s) => s.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it('un ex æquo à une frontière reste dans la tranche de rang le plus BAS (coupure sur les rangs)', () => {
    // 10 valeurs : 1 000 ×3, 2 000 ×3, 3 000 ×4. Frontières de rang : 2, 4, 6, 8.
    const { ntiles } = run(
      withMileages([1_000, 1_000, 1_000, 2_000, 2_000, 2_000, 3_000, 3_000, 3_000, 3_000]),
    );
    expect(ntiles.slices.map((s) => s.count)).toEqual([2, 2, 2, 2, 2]);
    // La 3ᵉ annonce à 1 000 km tombe dans la tranche 2 : deux annonces de même kilométrage peuvent
    // tomber dans deux tranches voisines, c'est la propriété que le texte exige.
    expect(ntiles.slices[0]?.hiObserved).toBe(1_000);
    expect(ntiles.slices[1]?.loObserved).toBe(1_000);
    expect(ntiles.slices[1]?.hiObserved).toBe(2_000);
  });

  it('n < k : n tranches d’un élément, status DEGRADED (jamais de tranche vide silencieuse)', () => {
    const { ntiles } = run(withMileages([10_000, 20_000, 30_000]));
    expect(ntiles.status).toBe('DEGRADED');
    expect(ntiles.slices).toHaveLength(3);
    expect(ntiles.slices.every((s) => s.count === 1)).toBe(true);
  });

  it('EX-DATA-82 — deux permutations du même multiensemble produisent la même partition', () => {
    const values = [50_000, 10_000, 30_000, 70_000, 20_000, 60_000, 40_000];
    const direct = run(values.map((m, i) => ({ mileage: m, price: 10_000, idRank: i })));
    const shuffled = run(
      [...values]
        .map((m, i) => ({ m, i }))
        .reverse()
        .map(({ m, i }) => ({ mileage: m, price: 10_000, idRank: i })),
    );
    expect(shuffled.ntiles).toEqual(direct.ntiles);
  });

  it('la clé de groupe mileageNtile est le RANG de tranche, kilométrage inconnu = clé inconnue', () => {
    const rows: FixtureRow[] = [
      ...[10_000, 20_000, 30_000, 40_000, 50_000].map((m, i) => ({ mileage: m, price: 1_000 * (i + 1), idRank: i })),
      { mileage: null, price: 9_000, idRank: 9 },
    ];
    const set = setOf(run(rows).groupStats, 'mileageNtile');
    expect(set.groups.map((g) => g.key)).toEqual([1, 2, 3, 4, 5]);
    expect(set.groups.map((g) => g.label)).toEqual([
      'Tranche 1',
      'Tranche 2',
      'Tranche 3',
      'Tranche 4',
      'Tranche 5',
    ]);
    expect(set.unknownKeyCount).toBe(1);
  });
});

describe('EX-DATA-83quater — paliers de puissance', () => {
  it('palier = ⌊powerKw / 20⌋, largeur 20 kW, borne haute EXCLUSIVE, libellé normatif', () => {
    expect(powerTierLabel(0)).toBe('0 – 19 kW');
    expect(powerTierLabel(4)).toBe('80 – 99 kW');
    const { powerTiers } = run([
      { powerKw: 15, price: 5_000 },
      { powerKw: 25, price: 7_000 },
      { powerKw: 85, price: 20_000 },
      { powerKw: 99, price: 22_000 },
      { powerKw: null, price: 30_000 },
      { powerKw: 0, price: 31_000 },
    ]);
    // Paliers 0 et 4 occupés : les paliers vides INTÉRIEURS 1, 2, 3 sont conservés.
    expect(powerTiers.tiers.map((t) => t.tier)).toEqual([0, 1, 2, 3, 4]);
    expect(powerTiers.tiers.map((t) => t.listingCount)).toEqual([1, 1, 0, 0, 2]);
    expect(powerTiers.tiers[4]?.lowerKw).toBe(80);
    expect(powerTiers.tiers[4]?.upperKw).toBe(100); // borne haute EXCLUSIVE
    expect(powerTiers.tiers[4]?.label).toBe('80 – 99 kW');
    expect(powerTiers.tiers[4]?.median).toBe(21_000);
    // `powerKw` INCONNU (sentinelle) et 0 kW (hors domaine [1, 9999]) n'entrent dans aucun palier.
    expect(powerTiers.unknownKeyCount).toBe(2);
    // Aucun palier au-delà du maximum observé.
    expect(powerTiers.tiers.some((t) => t.tier > 4)).toBe(false);
  });
});

describe('EX-DATA-83quinquies — indice de dépréciation', () => {
  /** 12 annonces d'un millésime, toutes au même prix : la médiane vaut ce prix. */
  const vintage = (year: number, price: number, count = 12): FixtureRow[] =>
    Array.from({ length: count }, () => ({ year, price }) as FixtureRow);

  const rows: FixtureRow[] = [
    ...vintage(2023, 20_000),
    ...vintage(2022, 18_000),
    ...vintage(2021, 15_000),
    ...vintage(2020, 12_000),
    ...vintage(2019, 10_000, 5), // sous le seuil de 12
  ];

  it('base = millésime le plus RÉCENT à n_price ≥ 12, index = 100 × M(y) / M(y_max) à 1 décimale', () => {
    const { depreciationIndex } = run(rows);
    expect(depreciationIndex.baseYear).toBe(2023);
    expect(depreciationIndex.entries.map((e) => e.year)).toEqual([2019, 2020, 2021, 2022, 2023]);
    expect(depreciationIndex.entries.map((e) => e.index)).toEqual([null, 60, 75, 90, 100]);
  });

  it('annualLossPct = 100 × (1 − M(y) / M(y+1)) à 1 décimale, null si y+1 manque ou est sous le seuil', () => {
    const byYear = new Map(run(rows).depreciationIndex.entries.map((e) => [e.year, e]));
    expect(byYear.get(2022)?.annualLossPct).toBe(10); // 1 − 18 000/20 000
    expect(byYear.get(2021)?.annualLossPct).toBe(16.7); // 1 − 15 000/18 000 = 16,666… → 16,7
    expect(byYear.get(2020)?.annualLossPct).toBe(20); // 1 − 12 000/15 000
    expect(byYear.get(2023)?.annualLossPct).toBeNull(); // y+1 absent
    expect(byYear.get(2019)?.annualLossPct).toBeNull(); // sous le seuil
    // Le millésime sous le seuil reste PUBLIÉ avec son effectif et sa médiane, index null.
    expect(byYear.get(2019)?.n).toBe(5);
    expect(byYear.get(2019)?.medianPriceEur).toBe(10_000);
  });

  it('aucun millésime au-dessus du seuil : baseYear = null, tous les index null', () => {
    const { depreciationIndex } = run([...vintage(2023, 20_000, 5), ...vintage(2022, 18_000, 4)]);
    expect(depreciationIndex.baseYear).toBeNull();
    expect(depreciationIndex.entries.every((e) => e.index === null)).toBe(true);
  });

  it('EX-DATA-6 — arrondi demi vers l’infini en valeur absolue, jamais bancaire', () => {
    expect(roundHalfAway(16.65, 1)).toBe(16.7);
    expect(roundHalfAway(0.125, 2)).toBe(0.13);
    expect(roundHalfAway(-0.125, 2)).toBe(-0.13);
  });
});
