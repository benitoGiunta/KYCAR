import { beforeAll, describe, expect, it } from 'vitest';
import type { ListingColumnBatch, ReferenceData, OutlierVerdict } from '../../../src/types/index';
import { AggregationDataset, type EngineSelection, type RecalcResult } from '../../../src/engine/kernel';
import { aggregate } from '../../../src/engine/aggregate';
import { detectOutliers } from '../../../src/engine/outliers';
import { densityGrid } from '../../../src/engine/density';
import { computeFacets, type FacetFilterSpec } from '../../../src/engine/facets';
import { compilePredicates, type CompiledPredicate, type RefinePredicate, type TaxonomyScope } from '../../../src/engine/predicates';
import { candidateRows, scanSelection } from '../../../src/engine/scan';
import { bin, YEAR_BIN_PARAMS, MILEAGE_BIN_PARAMS } from '../../../src/engine/bin';
import { isMileageValid, isPriceValid, isYearValid, PRICE_STATUS_QUOTED, yearFromYearMonth } from '../../../src/engine/flags';
import { NUMERIC_UNKNOWN } from '../../../src/types/index';
import { loadReferenceData, openSyntheticProvider } from '../../../src/engine/testkit';
import { mulberry32, refQuantile } from './helpers';

/**
 * Revue D4 — élagage (EX-DATA-116), index (EX-DATA-115), facettes en un balayage (EX-DATA-110bis) et
 * grille de densité (EX-DATA-102, I7) sur le dataset D3 (N = 10 000, graine 7).
 *
 * Propriété d'équivalence : pour 20 sélections aléatoires à graine fixe, la sélection ÉLAGUÉE (départ
 * d'IDX_MAKE / IDX_MODEL) produit exactement les mêmes chiffres qu'un balayage complet de référence
 * (filtre brut sur les N lignes, puis les mêmes fonctions de calcul).
 */

const N = 10_000;

let ref: ReferenceData;
let batch: ListingColumnBatch;
let dataset: AggregationDataset;
let makeIds: number[];
let modelKeys: { makeId: number; modelId: number; count: number }[];
let fuelCodes: number[];
let transmissionCodes: number[];

beforeAll(async () => {
  ref = loadReferenceData();
  const provider = await openSyntheticProvider(ref, N, 7);
  batch = provider.getDataset().batch;
  dataset = new AggregationDataset(batch, ref.models);
  makeIds = [...dataset.indexes.makeOffsets.keys()];
  modelKeys = [...dataset.indexes.modelOffsets.entries()].map(([key, range]) => {
    const [mk, md] = key.split(':').map(Number) as [number, number];
    return { makeId: mk, modelId: md, count: range.end - range.start };
  });
  const distinct = (col: Uint8Array): number[] => [...new Set(Array.from(col).filter((v) => v !== 255))].sort((a, b) => a - b);
  fuelCodes = distinct(batch.fuelCategory);
  transmissionCodes = distinct(batch.transmission);
});

/* ---- Référence brute (sans index) ------------------------------------------------------------ */

function rowMatchesScope(row: number, scope: TaxonomyScope | undefined): boolean {
  if (!scope) return true;
  const mk = batch.makeId[row] as number;
  const md = batch.modelId[row] as number;
  if (scope.models && scope.models.length > 0) return scope.models.some((m) => m.makeId === mk && m.modelId === md);
  if (scope.makeIds && scope.makeIds.length > 0) return scope.makeIds.includes(mk);
  return true;
}

function rowMatchesPredicate(row: number, p: RefinePredicate): boolean {
  if (p.kind === 'enum') return p.codes.includes(batch[p.column][row] as number);
  let v: number;
  if (p.column === 'year') {
    const ym = batch.firstRegistrationYearMonth[row] as number;
    v = ym === NUMERIC_UNKNOWN ? NUMERIC_UNKNOWN : yearFromYearMonth(ym);
  } else {
    v = batch[p.column][row] as number;
  }
  if (v === NUMERIC_UNKNOWN) return false;
  if (p.min !== null && v < p.min) return false;
  if (p.max !== null && v > p.max) return false;
  return true;
}

function bruteRows(scope: TaxonomyScope | undefined, refine: readonly RefinePredicate[]): Int32Array {
  const out: number[] = [];
  for (let row = 0; row < batch.rowCount; row++) {
    if (!rowMatchesScope(row, scope)) continue;
    if (refine.every((p) => rowMatchesPredicate(row, p))) out.push(row);
  }
  return Int32Array.from(out);
}

const round9 = (x: number | null): number | null => (x === null ? null : Math.round(x * 1e9) / 1e9);

function normalizeVerdicts(vs: readonly OutlierVerdict[]) {
  return [...vs]
    .map((v) => ({
      listingId: v.listingId,
      method: v.method,
      flags: [...v.flags].sort(),
      cellLabel: v.cellLabel,
      cellCount: v.cellCount,
      score: round9(v.opportunityScore),
      expected: round9(v.expectedPriceEur),
      deviation: round9(v.deviationPct),
    }))
    .sort((a, b) => (a.listingId < b.listingId ? -1 : a.listingId > b.listingId ? 1 : a.method < b.method ? -1 : 1));
}

function normalizeStats(r: RecalcResult) {
  const s = r.selectionStats;
  const m = (x: { n: number; min: number | null; max: number | null; mean: number | null; p05: number | null; p25: number | null; p50: number | null; p75: number | null; p95: number | null; stdDev: number | null }) => ({
    n: x.n, min: x.min, max: x.max, mean: round9(x.mean), p05: round9(x.p05), p25: round9(x.p25), p50: round9(x.p50), p75: round9(x.p75), p95: round9(x.p95), sd: round9(x.stdDev),
  });
  return {
    N: s.selectionCount,
    price: m(s.price),
    year: m(s.year),
    mileage: m(s.mileage),
    quoted: s.priceQuotedCount,
    onRequest: s.priceOnRequestCount,
    missing: s.priceMissingCount,
    evaluated: s.outlierEvaluatedCount,
    notEvaluated: s.outlierNotEvaluatedCount,
  };
}

function randomSelection(rng: () => number, k: number): EngineSelection {
  const kind = k % 4;
  let scope: TaxonomyScope;
  if (kind === 0) {
    scope = { makeIds: [makeIds[Math.floor(rng() * makeIds.length)] as number] };
  } else if (kind === 1) {
    const m = modelKeys[Math.floor(rng() * modelKeys.length)] as { makeId: number; modelId: number };
    scope = { models: [{ makeId: m.makeId, modelId: m.modelId }] };
  } else if (kind === 2) {
    const a = modelKeys[Math.floor(rng() * modelKeys.length)] as { makeId: number; modelId: number };
    const b = modelKeys[Math.floor(rng() * modelKeys.length)] as { makeId: number; modelId: number };
    scope = { models: [{ makeId: a.makeId, modelId: a.modelId }, { makeId: b.makeId, modelId: b.modelId }] };
  } else {
    const a = makeIds[Math.floor(rng() * makeIds.length)] as number;
    const b = makeIds[Math.floor(rng() * makeIds.length)] as number;
    scope = { makeIds: [a, b] };
  }
  const refine: RefinePredicate[] = [];
  const nPred = Math.floor(rng() * 3);
  for (let p = 0; p < nPred; p++) {
    const r = rng();
    if (r < 0.4) {
      const codes = [fuelCodes[Math.floor(rng() * fuelCodes.length)] as number];
      if (rng() < 0.5) codes.push(fuelCodes[Math.floor(rng() * fuelCodes.length)] as number);
      refine.push({ kind: 'enum', filterId: 'fuel', column: 'fuelCategory', codes });
    } else if (r < 0.7) {
      refine.push({ kind: 'range', filterId: 'year', column: 'year', min: 2010 + Math.floor(rng() * 8), max: null });
    } else {
      refine.push({ kind: 'range', filterId: 'km', column: 'mileageKm', min: null, max: 50_000 + Math.floor(rng() * 150_000) });
    }
  }
  return { selectionHash: `FULL:rand-${k}`, scope, refine };
}

describe('EX-DATA-116 — équivalence élagage / balayage complet (20 sélections aléatoires, graine 2025)', () => {
  it('mêmes statistiques, agrégats, histogrammes, cellules de densité et verdicts que la référence brute', () => {
    const rng = mulberry32(2025);
    let prunedCount = 0;
    let nonEmpty = 0;
    for (let k = 0; k < 20; k++) {
      const sel = randomSelection(rng, k);
      const pruned = dataset.recalculate(sel);
      expect(pruned.pruned).toBe(true);
      prunedCount++;
      const rows = bruteRows(sel.scope, sel.refine ?? []);
      expect(pruned.selectionStats.selectionCount).toBe(rows.length);
      if (rows.length > 0) nonEmpty++;
      const agg = aggregate(batch, rows, batch.snapshotId, sel.selectionHash);
      const out = detectOutliers(batch, rows, batch.snapshotId, sel.selectionHash);
      const den = densityGrid(batch, rows, batch.snapshotId, sel.selectionHash);
      expect(normalizeStats(pruned)).toEqual({
        N: rows.length,
        price: normalizeStats({ ...pruned, selectionStats: { ...pruned.selectionStats, price: agg.priceStats } }).price,
        year: normalizeStats({ ...pruned, selectionStats: { ...pruned.selectionStats, year: agg.yearStats } }).year,
        mileage: normalizeStats({ ...pruned, selectionStats: { ...pruned.selectionStats, mileage: agg.mileageStats } }).mileage,
        quoted: agg.priceQuotedCount,
        onRequest: agg.priceOnRequestCount,
        missing: agg.priceMissingCount,
        evaluated: out.outlierEvaluatedCount,
        notEvaluated: out.outlierNotEvaluatedCount,
      });
      expect(pruned.makeAggregates).toEqual(agg.makeAggregates);
      expect(pruned.modelAggregates).toEqual(agg.modelAggregates);
      expect(pruned.priceHistogram).toEqual(agg.priceHistogram);
      expect(pruned.yearHistogram).toEqual(agg.yearHistogram);
      expect(pruned.mileageHistogram).toEqual(agg.mileageHistogram);
      expect(pruned.densityCells).toEqual(den.cells);
      expect(pruned.eligibleCount).toBe(den.eligibleCount);
      expect(normalizeVerdicts(pruned.outlierVerdicts)).toEqual(normalizeVerdicts(out.verdicts));
      expect(pruned.m3).toEqual(out.m3);
      // Témoin d'élagage : lignes examinées = effectif de l'index, jamais N.
      expect(pruned.scannedCount).toBeLessThan(N);
    }
    console.log(`[équivalence] 20 sélections, ${prunedCount} élaguées, ${nonEmpty} non vides — toutes identiques à la référence`);
    expect(nonEmpty).toBeGreaterThanOrEqual(10);
  });

  it('EX-DATA-115/116 — IDX_MAKE / IDX_MODEL : offsets exhaustifs, disjoints, et lignes triées par indice croissant dans chaque plage', () => {
    const idx = dataset.indexes;
    let total = 0;
    for (const [makeId, range] of idx.makeOffsets) {
      total += range.end - range.start;
      for (let p = range.start; p < range.end; p++) {
        const row = idx.idxMakeRows[p] as number;
        expect(batch.makeId[row]).toBe(makeId);
        if (p > range.start) expect(row).toBeGreaterThan(idx.idxMakeRows[p - 1] as number);
      }
    }
    expect(total).toBe(N);
    let totalModels = 0;
    for (const [key, range] of idx.modelOffsets) {
      totalModels += range.end - range.start;
      const [mk, md] = key.split(':').map(Number) as [number, number];
      const row = idx.idxModelRows[range.start] as number;
      expect(batch.makeId[row]).toBe(mk);
      expect(batch.modelId[row]).toBe(md);
    }
    expect(totalModels).toBe(N);
    expect(idx.pkListing.size).toBe(N);
    expect(idx.idxPriceSorted.length).toBe(N);
    for (let p = 1; p < N; p++) expect(batch.priceEur[idx.idxPriceSorted[p] as number] as number).toBeGreaterThanOrEqual(batch.priceEur[idx.idxPriceSorted[p - 1] as number] as number);
  });

  it('cas limites de scope : modèle inconnu → 0 ligne sans erreur ; `models: []` retombe sur `makeIds` ; `models` prime sur `makeIds`', () => {
    const unknown = dataset.recalculate({ selectionHash: 'FULL:unknown', scope: { models: [{ makeId: 32000, modelId: 999_999 }] } });
    expect(unknown.pruned).toBe(true);
    expect(unknown.selectionStats.selectionCount).toBe(0);
    expect(unknown.priceHistogram).toEqual([]);
    expect(unknown.outlierVerdicts).toEqual([]);
    const mk = makeIds[0] as number;
    const viaMake = dataset.recalculate({ selectionHash: 'FULL:mk', scope: { makeIds: [mk] } });
    const emptyModels = dataset.recalculate({ selectionHash: 'FULL:mk2', scope: { makeIds: [mk], models: [] } });
    expect(emptyModels.selectionStats.selectionCount).toBe(viaMake.selectionStats.selectionCount);
    const model = modelKeys.find((m) => m.makeId !== mk) as { makeId: number; modelId: number; count: number };
    const both = dataset.recalculate({ selectionHash: 'FULL:both', scope: { makeIds: [mk], models: [{ makeId: model.makeId, modelId: model.modelId }] } });
    expect(both.selectionStats.selectionCount).toBe(model.count);
    // Aucun scope → balayage complet (pruned = false, scannedCount = N).
    const full = dataset.recalculate({ selectionHash: 'FULL:EMPTY' });
    expect(full.pruned).toBe(false);
    expect(full.scannedCount).toBe(N);
  });

  it('les bitsets énumérés (EX-DATA-115) sont construits (5 colonnes, 1 bit/ligne) — DETTE : aucun chemin de calcul ne les consulte', () => {
    const bs = dataset.indexes.bitsets;
    expect(bs.size).toBe(5);
    let words = 0;
    for (const [, perValue] of bs) for (const [, arr] of perValue) words += arr.length;
    console.log(`[bitsets] ${bs.size} colonnes, ${words * 4} octets alloués à N=${N} (≈ ${((words * 4 * 100) / N).toFixed(0)} o/ligne ×100)`);
    // Le balayage n'utilise pas les bitsets : un prédicat enum est évalué par table de 256 sur chaque ligne candidate.
    const enumPred = compilePredicates(batch, [{ kind: 'enum', filterId: 'fuel', column: 'fuelCategory', codes: [fuelCodes[0] as number] }]);
    const scan = scanSelection(dataset.indexes, enumPred);
    expect(scan.scannedCount).toBe(N);
  });
});

describe('EX-DATA-110bis — facettes en UN balayage', () => {
  const FACETS: readonly FacetFilterSpec[] = [
    { filterId: 'fuel', column: 'fuelCategory' },
    { filterId: 'transmission', column: 'transmission' },
    { filterId: 'body', column: 'bodyType' },
    { filterId: 'region', column: 'regionCode' },
  ];

  function bruteFacets(scope: TaxonomyScope | undefined, refine: readonly RefinePredicate[]): Map<string, number> {
    const out = new Map<string, number>();
    for (let row = 0; row < batch.rowCount; row++) {
      if (!rowMatchesScope(row, scope)) continue;
      for (const f of FACETS) {
        const others = refine.filter((p) => p.filterId !== f.filterId);
        if (!others.every((p) => rowMatchesPredicate(row, p))) continue;
        const code = batch[f.column][row] as number;
        if (code === 255) continue;
        const key = `${f.filterId}:${code}`;
        out.set(key, (out.get(key) ?? 0) + 1);
      }
    }
    return out;
  }

  it('compteurs exacts (prédicat « moins un » par filtre) sur 3 sélections : marque + carburant(2 codes) + boîte + plage année', () => {
    const rng = mulberry32(31);
    for (let t = 0; t < 3; t++) {
      const mk = makeIds[Math.floor(rng() * makeIds.length)] as number;
      const refine: RefinePredicate[] = [
        { kind: 'enum', filterId: 'fuel', column: 'fuelCategory', codes: [fuelCodes[0] as number, fuelCodes[Math.min(1, fuelCodes.length - 1)] as number] },
        { kind: 'enum', filterId: 'transmission', column: 'transmission', codes: [transmissionCodes[t % transmissionCodes.length] as number] },
        { kind: 'range', filterId: 'year', column: 'year', min: 2012, max: null },
      ];
      const scope: TaxonomyScope = t === 2 ? {} : { makeIds: [mk] };
      const got = dataset.computeFacets({ selectionHash: `FULL:f${t}`, scope, refine }, FACETS).facets;
      const gotMap = new Map(got.map((f) => [`${f.filterId}:${f.code}`, f.count]));
      const expected = bruteFacets(t === 2 ? undefined : scope, refine);
      expect(gotMap).toEqual(expected);
      // Cohérence avec le recalcul : facet(fuel, c) ≥ effectif de la sélection restreinte à fuel = c.
      const sel = dataset.recalculate({ selectionHash: `FULL:f${t}`, scope, refine }).selectionStats.selectionCount;
      const fuelPred = refine[0] as Extract<RefinePredicate, { kind: 'enum' }>;
      const sumSelectedFuel = fuelPred.codes.reduce((a, c) => a + (gotMap.get(`fuel:${c}`) ?? 0), 0);
      expect(sumSelectedFuel).toBe(sel);
    }
  });

  it('un seul balayage : chaque prédicat est testé au plus une fois par ligne candidate (compteur d’appels)', () => {
    let mk = -1;
    let best = -1;
    for (const [makeId, range] of dataset.indexes.makeOffsets) {
      if (range.end - range.start > best) {
        best = range.end - range.start;
        mk = makeId;
      }
    }
    const scope: TaxonomyScope = { makeIds: [mk] };
    const refine: RefinePredicate[] = [
      { kind: 'enum', filterId: 'fuel', column: 'fuelCategory', codes: [fuelCodes[0] as number] },
      { kind: 'range', filterId: 'year', column: 'year', min: 2014, max: 2022 },
    ];
    const compiled = compilePredicates(batch, refine);
    let calls = 0;
    const counted: CompiledPredicate[] = compiled.map((p) => ({ ...p, test: (row: number) => { calls++; return p.test(row); } }));
    const candidates = candidateRows(dataset.indexes, scope).rows as Int32Array;
    const t0 = performance.now();
    const facets = computeFacets(batch, dataset.indexes, scope, counted, FACETS, batch.snapshotId, 'FULL:one-pass');
    const dt = performance.now() - t0;
    console.log(`[facettes] candidats=${candidates.length} prédicats=${compiled.length} appels=${calls} (≤ ${candidates.length * compiled.length}) ; ${facets.length} compteurs en ${dt.toFixed(2)} ms`);
    expect(calls).toBeLessThanOrEqual(candidates.length * compiled.length);
    expect(facets.length).toBeGreaterThan(0);
    expect(dt).toBeLessThan(100);
  });
});

describe('EX-DATA-102 / I7 — grille de densité : bornée, triée, cohérente', () => {
  it('Σ cellules = n_e recomputé indépendamment ; ≤ 676 cellules ; indices dans [kLo−1, kHi+1] des deux axes ; ordre lexicographique', () => {
    const r = dataset.recalculate({ selectionHash: 'FULL:EMPTY' });
    // Ensemble éligible recomputé HORS moteur. Lecture retenue : **D-05** — l'éligibilité au nuage et
    // à la densité est « prix VALIDE », c'est-à-dire `QUOTED` ∧ ¬sentinelle absolue (EX-DATA-60) ∧
    // ¬`PRICE_IMPLAUSIBLE_IN_CELL` (EX-DATA-19(2)), en plus d'une année et d'un kilométrage valides.
    // La lecture littérale d'EX-DATA-99 (« statut seul ») est amendée par D-05 et par fix-docs ; les
    // trois chiffres restent imprimés pour que l'écart soit lisible.
    const validPrices: number[] = [];
    for (let i = 0; i < batch.rowCount; i++) {
      const status = batch.priceStatus[i] as number;
      const p = batch.priceEur[i] as number;
      if (isPriceValid(p, status, batch.ingestFlags[i] as number)) validPrices.push(p);
    }
    const implausibleBelow = validPrices.length >= 12 ? 0.1 * refQuantile(validPrices, 0.5) : Number.NEGATIVE_INFINITY;
    const eligYear: number[] = [];
    const eligKm: number[] = [];
    let eligStrict = 0;
    let eligStatusOnly = 0;
    let eligValidPrice = 0;
    for (let i = 0; i < batch.rowCount; i++) {
      const status = batch.priceStatus[i] as number;
      const ingest = batch.ingestFlags[i] as number;
      const ym = batch.firstRegistrationYearMonth[i] as number;
      const km = batch.mileageKm[i] as number;
      if (status !== PRICE_STATUS_QUOTED || !isYearValid(ym) || !isMileageValid(km, ingest)) continue;
      eligStatusOnly++;
      const price = batch.priceEur[i] as number;
      if (!isPriceValid(price, status, ingest)) continue;
      eligStrict++;
      if (price < implausibleBelow) continue;
      eligValidPrice++;
      eligYear.push(yearFromYearMonth(ym));
      eligKm.push(km);
    }
    console.log(`[densité] n_e moteur=${r.eligibleCount} ; n_e (statut seul)=${eligStatusOnly} ; n_e (prix valide EX-DATA-60)=${eligStrict} ; n_e (prix valide D-05, seuil ${implausibleBelow.toFixed(0)} €)=${eligValidPrice} ; cellules=${r.densityCells.length}`);
    expect(r.eligibleCount).toBe(eligValidPrice);
    // EX-DATA-99 : la ventilation des motifs ferme l'effectif de la sélection.
    expect(
      r.eligibleCount +
        r.ineligible.noPrice +
        r.ineligible.noYear +
        r.ineligible.noMileage +
        r.ineligible.suspectValue,
    ).toBe(r.selectionStats.selectionCount);
    expect(r.densityCells.reduce((a, c) => a + c.count, 0)).toBe(r.eligibleCount);
    expect(r.densityCells.length).toBeLessThanOrEqual(676);
    const yb = bin(eligYear, YEAR_BIN_PARAMS);
    const kb = bin(eligKm, MILEAGE_BIN_PARAMS);
    // Bornes indépendantes : kLo/kHi via le quantile de référence.
    const a = refQuantile(eligYear, 0.01);
    const b = refQuantile(eligYear, 0.99);
    expect(yb.kLo).toBe(Math.floor(a));
    expect(yb.kHi).toBe(Math.floor(b));
    for (const c of r.densityCells) {
      expect(c.yearBinIndex).toBeGreaterThanOrEqual((yb.kLo as number) - 1);
      expect(c.yearBinIndex).toBeLessThanOrEqual((yb.kHi as number) + 1);
      expect(c.mileageBinIndex).toBeGreaterThanOrEqual((kb.kLo as number) - 1);
      expect(c.mileageBinIndex).toBeLessThanOrEqual((kb.kHi as number) + 1);
      expect(c.count).toBeGreaterThan(0);
    }
    for (let i = 1; i < r.densityCells.length; i++) {
      const p = r.densityCells[i - 1] as { yearBinIndex: number; mileageBinIndex: number };
      const c = r.densityCells[i] as { yearBinIndex: number; mileageBinIndex: number };
      expect(c.yearBinIndex > p.yearBinIndex || (c.yearBinIndex === p.yearBinIndex && c.mileageBinIndex > p.mileageBinIndex)).toBe(true);
    }
  });

  it('sélection vide (0 ligne) : aucune cellule, n_e = 0, histogrammes vides, statistiques nulles (EX-DATA-81)', () => {
    const r = dataset.recalculate({ selectionHash: 'FULL:none', scope: { models: [{ makeId: 32000, modelId: 1 }] } });
    expect(r.densityCells).toEqual([]);
    expect(r.eligibleCount).toBe(0);
    expect(r.priceHistogram).toEqual([]);
    expect(r.selectionStats.price.n).toBe(0);
    expect(r.selectionStats.price.p50).toBeNull();
    expect(r.makeAggregates).toEqual([]);
  });
});
