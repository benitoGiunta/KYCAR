import { describe, expect, it } from 'vitest';
import { AggregationDataset } from '../../../src/engine/kernel';
import { isNotEvaluableOutlierCode, OUTLIER_NOT_EVALUABLE_CODES } from '../../../src/types/index';
import { allRows, cellRows, makeBatch, type RowSpec } from './helpers';

/**
 * Revue D4 — **D8-07** (dette D-17 levée) et **D8-09** (dette D-45 levée).
 *
 * `FV-10` constate que `R²` n'est jamais calculé et que `GROUPSTAT` / `NTILE` / les paliers /
 * l'indice de dépréciation / l'échantillon du nuage sont recalculés sur le THREAD PRINCIPAL, hors
 * du moteur : deux implémentations, donc deux chiffres possibles pour la même sélection. D8-07 fait
 * du worker la source unique et les publie par `RecalcResult`.
 *
 * Ces sondes interrogent le moteur PAR SON PROTOCOLE (`recalculate` → `RecalcResult`), au niveau
 * exact où le thread principal les lira, et exigent les valeurs de l'annexe A — jamais celles d'une
 * seconde exécution du code testé.
 *
 * **Écrites AVANT la correction (D-32).** À l'état d'arrivée du cluster (commit `1226aeb`), les six
 * champs de `RecalcResult` sont absents et les QUATORZE sondes de ce fichier échouent ; la sortie
 * rouge est reproduite dans `reports/remediation-2.8/fix-engine.md` §3.
 */

const FULL = { selectionHash: 'FULL:EMPTY' } as const;

function recalc(rows: readonly RowSpec[]) {
  const batch = makeBatch(rows);
  return { batch, result: new AggregationDataset(batch).recalculate(FULL) };
}

describe('R-D8-07-01 — EX-DATA-83bis : GROUPSTAT publié par le moteur', () => {
  it('les neuf clés admises sont publiées avec listingCount, n, couverture métrique, médiane, P5, P95, IQR', () => {
    const { result } = recalc(cellRows(40, { seed: 11 }));
    expect(result.groupStats).toBeDefined();
    const sets = result.groupStats ?? [];
    expect(sets.map((s) => s.key)).toEqual([
      'fuelCategory',
      'priceEvaluationCategory',
      'sellerType',
      'countryCode',
      'bodyType',
      'transmission',
      'yearBucket',
      'mileageNtile',
      'powerTier',
    ]);
    const year = sets.find((s) => s.key === 'yearBucket');
    expect(year?.metric).toBe('price');
    expect(year?.groups.length).toBeGreaterThan(0);
    for (const g of year?.groups ?? []) {
      expect(g.listingCount).toBeGreaterThan(0);
      expect(g.n).toBeLessThanOrEqual(g.listingCount);
      expect(g.coverage).toBeCloseTo(g.n / g.listingCount, 12);
      if (g.n > 0) {
        expect(g.median).not.toBeNull();
        expect(g.p05).not.toBeNull();
        expect(g.p95).not.toBeNull();
        expect(g.iqr).not.toBeNull();
        expect(g.p05 as number).toBeLessThanOrEqual(g.median as number);
        expect(g.median as number).toBeLessThanOrEqual(g.p95 as number);
      }
    }
    // Ordre total : `listingCount` décroissant en tête.
    const counts = (year?.groups ?? []).map((g) => g.listingCount);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it('ARB-36 — INCONNU ne forme aucun groupe : Σ listingCount + unknownKeyCount = effectif de la sélection', () => {
    // `makeBatch` laisse `bodyType` à 0 et `priceEvaluationCategory` à 255 (INCONNU) par défaut.
    const rows = cellRows(30, { seed: 12 });
    const { result } = recalc(rows);
    for (const set of result.groupStats ?? []) {
      const total = set.groups.reduce((s, g) => s + g.listingCount, 0) + set.unknownKeyCount;
      expect(total).toBe(rows.length);
      expect(set.groups.some((g) => g.key === 255)).toBe(false);
    }
    const evalCat = (result.groupStats ?? []).find((s) => s.key === 'priceEvaluationCategory');
    expect(evalCat?.unknownKeyCount).toBe(rows.length);
    expect(evalCat?.groups).toEqual([]);
  });
});

describe('R-D8-07-02 — EX-DATA-83ter : NTILE(V_mileage(Σ), 5), tranches de RANG', () => {
  it('cinq tranches de tailles ⌊n/k⌋ ou ⌈n/k⌉, bornes observées croissantes, status OK', () => {
    const { result } = recalc(cellRows(37, { seed: 13 }));
    const nt = result.ntiles;
    expect(nt).toBeDefined();
    expect(nt?.k).toBe(5);
    expect(nt?.metric).toBe('mileage');
    expect(nt?.status).toBe('OK');
    expect(nt?.slices).toHaveLength(5);
    const sizes = (nt?.slices ?? []).map((s) => s.count);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(37);
    for (const size of sizes) expect([Math.floor(37 / 5), Math.ceil(37 / 5)]).toContain(size);
    for (let i = 1; i < (nt?.slices.length ?? 0); i++) {
      expect(nt?.slices[i]?.loObserved as number).toBeGreaterThanOrEqual(
        nt?.slices[i - 1]?.hiObserved as number,
      );
    }
  });

  it('n < k : status DEGRADED et n tranches d’un élément, jamais de tranche vide silencieuse', () => {
    const { result } = recalc(cellRows(3, { seed: 14 }));
    expect(result.ntiles?.status).toBe('DEGRADED');
    expect(result.ntiles?.slices).toHaveLength(3);
    expect((result.ntiles?.slices ?? []).every((s) => s.count === 1)).toBe(true);
  });
});

describe('R-D8-07-03 — EX-DATA-83quater : paliers de puissance de 20 kW', () => {
  it('palier = ⌊powerKw / 20⌋, borne haute exclusive, libellé normatif, paliers vides intérieurs conservés', () => {
    const rows: RowSpec[] = [
      ...Array.from({ length: 6 }, (_v, i) => ({ price: 10_000 + i * 100, powerKw: 15 })),
      ...Array.from({ length: 4 }, (_v, i) => ({ price: 30_000 + i * 100, powerKw: 85 })),
      { price: 20_000, powerKw: null },
    ];
    const { result } = recalc(rows);
    const tiers = result.powerTiers;
    expect(tiers).toBeDefined();
    expect(tiers?.tiers.map((t) => t.tier)).toEqual([0, 1, 2, 3, 4]);
    expect(tiers?.tiers.map((t) => t.listingCount)).toEqual([6, 0, 0, 0, 4]);
    expect(tiers?.tiers[4]?.lowerKw).toBe(80);
    expect(tiers?.tiers[4]?.upperKw).toBe(100);
    expect(tiers?.tiers[4]?.label).toBe('80 – 99 kW');
    expect(tiers?.unknownKeyCount).toBe(1);
  });
});

describe('R-D8-07-04 — EX-DATA-83quinquies : indice de dépréciation, base publiée', () => {
  it('base = millésime le plus récent à n_price ≥ 12 ; index = 100 × M(y)/M(y_max) à 1 décimale', () => {
    const vintage = (year: number, price: number, count: number): RowSpec[] =>
      Array.from({ length: count }, (_v, i) => ({ year, month: 1 + (i % 12), price, mileage: 50_000 + i * 100 }));
    const { result } = recalc([
      ...vintage(2023, 20_000, 12),
      ...vintage(2022, 18_000, 12),
      ...vintage(2021, 15_000, 12),
      ...vintage(2020, 10_000, 6), // sous le seuil : index null, millésime tout de même publié
    ]);
    const dep = result.depreciationIndex;
    expect(dep).toBeDefined();
    expect(dep?.baseYear).toBe(2023);
    const byYear = new Map((dep?.entries ?? []).map((e) => [e.year, e]));
    expect(byYear.get(2023)?.index).toBe(100);
    expect(byYear.get(2022)?.index).toBe(90);
    expect(byYear.get(2021)?.index).toBe(75);
    expect(byYear.get(2020)?.index).toBeNull();
    expect(byYear.get(2020)?.n).toBe(6);
    expect(byYear.get(2022)?.annualLossPct).toBe(10);
    expect(byYear.get(2021)?.annualLossPct).toBe(16.7);
    expect(byYear.get(2023)?.annualLossPct).toBeNull();
  });
});

describe('R-D8-07-05 — EX-DATA-86/87/93bis, EX-SCR-164 : statistiques de cellule et R²', () => {
  it('la cellule retenue publie n, médiane, MAD, |F| et le R² de la passe 2 avec son avertissement', () => {
    const { result } = recalc(cellRows(60, { seed: 15, basePrice: 22_000 }));
    expect(result.cellStats).toBeDefined();
    const cells = result.cellStats ?? [];
    expect(cells.length).toBeGreaterThan(0);
    const fitted = cells.find((c) => c.fitCount >= 30);
    expect(fitted).toBeDefined();
    expect(fitted?.cellLevel).toBe('MODEL');
    expect(fitted?.n).toBeGreaterThanOrEqual(30);
    expect(fitted?.median).not.toBeNull();
    expect(fitted?.mad).not.toBeNull();
    expect(fitted?.rSquared).not.toBeNull();
    const r2 = fitted?.rSquared as number;
    expect(r2).toBeLessThanOrEqual(1);
    // `EX-DATA-6` : arrondi à 2 décimales, jamais tronqué.
    expect(Math.round(r2 * 100) / 100).toBe(r2);
    expect(fitted?.rSquaredWarning).toBe(r2 < 0.3);
  });

  it('SCT = 0 (cellule à prix unique) : R² = null, avertissement faux, et verdict INSUFFICIENT_SPREAD', () => {
    const flat: RowSpec[] = Array.from({ length: 40 }, (_v, i) => ({
      price: 15_000,
      year: 2015 + (i % 8),
      month: 1 + (i % 12),
      mileage: 30_000 + i * 1_000,
    }));
    const { result } = recalc(flat);
    const cell = (result.cellStats ?? []).find((c) => c.cellLevel === 'MODEL');
    expect(cell?.rSquared).toBeNull();
    expect(cell?.rSquaredWarning).toBe(false);
    expect(cell?.mad).toBe(0);
    expect(result.outlierVerdicts.every((v) => v.flags.includes('INSUFFICIENT_SPREAD'))).toBe(true);
  });
});

describe('R-D8-07-06 — EX-DATA-99..103 / EX-DATA-118 : échantillon du nuage publié par le moteur', () => {
  it('lignes triées par listingId, compteurs d’EX-DATA-103 complets, cohérents avec eligibleCount', () => {
    const batchRows = cellRows(50, { seed: 16 });
    const { batch, result } = recalc(batchRows);
    const sample = result.sample;
    expect(sample).toBeDefined();
    expect(sample?.eligibleCount).toBe(result.eligibleCount);
    expect(sample?.plottedCount).toBe(sample?.rows.length);
    expect(sample?.sampled).toBe(false); // 50 ≪ K = 5 000
    expect(sample?.outlierTruncated).toBe(false);
    expect(sample?.maxPoints).toBe(5000);
    expect(sample?.outlierPlottedCount).toBe(sample?.outlierCount);
    // Ordre total EX-DATA-118 : `listingId` croissant, comparaison octet à octet.
    const rows = [...(sample?.rows ?? [])];
    const idOf = (row: number): string =>
      [...batch.listingId.subarray(row * 16, row * 16 + 16)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    const ids = rows.map(idOf);
    expect([...ids].sort()).toEqual(ids);
    expect(batchRows.length).toBe(50);
  });

  it('l’échantillon est identique octet à octet sur deux permutations de la même sélection (EX-DATA-100bis)', () => {
    const rows = cellRows(40, { seed: 17 });
    const straight = recalc(rows);
    const reversed = recalc([...rows].reverse());
    // Sans cette garde, la sonde passerait TRIVIALEMENT quand le champ est absent des deux côtés.
    expect(straight.result.sample).toBeDefined();
    expect((straight.result.sample?.rows.length as number) > 0).toBe(true);
    const idsOf = (r: typeof straight): string[] =>
      [...(r.result.sample?.rows ?? [])].map((row) =>
        [...r.batch.listingId.subarray(row * 16, row * 16 + 16)].map((b) => b.toString(16)).join(''),
      );
    expect(idsOf(reversed)).toEqual(idsOf(straight));
  });
});

describe('R-D8-09-01 — EX-DATA-85/86/95 : verdicts et compteurs de non-évaluabilité', () => {
  it('les compteurs sont publiés et leur somme vaut priceQuotedCount (raffinement d’I6)', () => {
    const { result } = recalc(cellRows(11, { seed: 18 }));
    const e = result.outlierEvaluation;
    expect(e).toBeDefined();
    expect(e?.evaluated).toBe(0);
    expect(e?.notEvaluable.INSUFFICIENT_DATA).toBe(11);
    expect(e?.notEvaluable.INSUFFICIENT_SPREAD).toBe(0);
    expect(
      (e?.evaluated as number) +
        (e?.notEvaluableTotal as number) +
        (e?.priceExcluded as number) +
        (e?.implausibleInCell as number),
    ).toBe(result.selectionStats.priceQuotedCount);
    // Les deux codes sont ceux du vocabulaire gelé porté à 8 par l'étape 0.
    const codes = new Set(result.outlierVerdicts.flatMap((v) => v.flags));
    for (const code of codes) {
      expect(isNotEvaluableOutlierCode(code)).toBe(true);
      expect(OUTLIER_NOT_EVALUABLE_CODES as readonly string[]).toContain(code);
    }
  });
});

describe('R-D8-07-07 — EX-NFR-5 : la garde de budget est NOMMÉE, jamais silencieuse', () => {
  it('sélection non élaguée au-delà du plafond : les six champs sont absents et statsSkipped le dit', () => {
    // 25 001 lignes non élaguées : au-delà du plafond de `STATS_UNPRUNED_MAX_ROWS`, comme pour M1/M2.
    const rows: RowSpec[] = Array.from({ length: 25_001 }, (_v, i) => ({
      price: 10_000 + (i % 500) * 10,
      year: 2010 + (i % 12),
      month: 1 + (i % 12),
      mileage: 20_000 + (i % 900) * 100,
      powerKw: 60 + (i % 6) * 15,
    }));
    const batch = makeBatch(rows);
    const result = new AggregationDataset(batch).recalculate(FULL);
    expect(result.pruned).toBe(false);
    expect(result.statsSkipped).toBe('UNPRUNED_SELECTION');
    expect(result.groupStats).toBeUndefined();
    expect(result.ntiles).toBeUndefined();
    expect(result.powerTiers).toBeUndefined();
    expect(result.depreciationIndex).toBeUndefined();
    expect(result.cellStats).toBeUndefined();
    expect(result.sample).toBeUndefined();
    expect(allRows(batch).length).toBe(25_001);
  }, 120_000);

  it('sélection élaguée : les six champs sont renseignés et statsSkipped vaut null', () => {
    const rows: RowSpec[] = [
      ...cellRows(40, { makeId: 1, modelId: 101, seed: 19 }),
      ...cellRows(40, { makeId: 2, modelId: 202, seed: 20, basePrice: 30_000 }),
    ];
    const batch = makeBatch(rows);
    const result = new AggregationDataset(batch).recalculate({
      selectionHash: 'FULL:make-1',
      scope: { makeIds: [1] },
    });
    expect(result.pruned).toBe(true);
    expect(result.statsSkipped).toBeNull();
    expect(result.groupStats).toBeDefined();
    expect(result.ntiles).toBeDefined();
    expect(result.powerTiers).toBeDefined();
    expect(result.depreciationIndex).toBeDefined();
    expect(result.cellStats).toBeDefined();
    expect(result.sample).toBeDefined();
  });

  it('les six champs traversent l’algorithme de CLONAGE STRUCTURÉ (contrainte de protocole worker)', () => {
    const { result } = recalc(cellRows(40, { seed: 21 }));
    const cloned = structuredClone(result);
    expect(cloned.groupStats).toEqual(result.groupStats);
    expect(cloned.ntiles).toEqual(result.ntiles);
    expect(cloned.powerTiers).toEqual(result.powerTiers);
    expect(cloned.depreciationIndex).toEqual(result.depreciationIndex);
    expect(cloned.cellStats).toEqual(result.cellStats);
    expect(cloned.sample?.rows).toBeInstanceOf(Int32Array);
    expect([...(cloned.sample?.rows ?? [])]).toEqual([...(result.sample?.rows ?? [])]);
    expect(cloned.outlierEvaluation).toEqual(result.outlierEvaluation);
  });
});
