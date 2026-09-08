import { beforeAll, describe, expect, it } from 'vitest';
import type { DistributionBucket, MakeAggregate, ModelAggregate, ReferenceData } from '../types/index';
import {
  checkI1,
  checkI2,
  checkI3,
  checkI4,
  checkI5,
  checkI6,
  checkI7,
  checkI8,
} from '../types/index';
import { AggregationDataset, type RecalcResult } from './kernel';
import { binEdges, PRICE_BIN_PARAMS } from './bin';
import { isPriceValid } from './flags';
import { loadReferenceData, openSyntheticProvider } from './testkit';

/**
 * Critère de succès D4 #2 : les 8 invariants I1..I8 (EX-DATA-104) passent sur un dataset GÉNÉRÉ PAR D3,
 * branchés sur les VRAIES sorties du moteur (`AggregationDataset.recalculate`) ; et une violation
 * injectée dans chaque sortie est bien DÉTECTÉE par le bon invariant (les contrôles ont des dents).
 */

const N = 20_000;

let ref: ReferenceData;
let result: RecalcResult;
let dataset: AggregationDataset;
let validPrices: number[];

beforeAll(async () => {
  ref = loadReferenceData();
  const provider = await openSyntheticProvider(ref, N, 7);
  const batch = provider.getDataset().batch;
  dataset = new AggregationDataset(batch);
  // Sélection vide (FULL) : les invariants portent sur la totalité du snapshot.
  result = dataset.recalculate({ selectionHash: 'FULL:EMPTY' });

  validPrices = [];
  for (let i = 0; i < batch.rowCount && validPrices.length < 800; i += 1) {
    const p = batch.priceEur[i] as number;
    if (isPriceValid(p, batch.priceStatus[i] as number, batch.ingestFlags[i] as number)) validPrices.push(p);
  }
});

/** Concatène les trois histogrammes en une liste de buckets (base d'I4). */
function allBuckets(r: RecalcResult): readonly DistributionBucket[] {
  return [...r.priceHistogram, ...r.yearHistogram, ...r.mileageHistogram];
}

describe('D4 — invariants I1..I8 sur dataset D3 (EX-DATA-104)', () => {
  it('I1 — Σ listingCount(marque) = N', () => {
    const r = checkI1(result.makeAggregates, result.selectionStats.selectionCount);
    console.log(`[I1] ${r.detail}`);
    expect(r.ok).toBe(true);
    // Violation injectée : effectif de sélection faux.
    expect(checkI1(result.makeAggregates, result.selectionStats.selectionCount + 1).ok).toBe(false);
  });

  it('I2 — Σ modèles(marque) = listingCount(marque)', () => {
    const r = checkI2(result.makeAggregates, result.modelAggregates);
    console.log(`[I2] ${r.detail}`);
    expect(r.ok).toBe(true);
    const corrupt: ModelAggregate[] = result.modelAggregates.map((m, i) =>
      i === 0 ? { ...m, listingCount: m.listingCount + 1 } : m,
    );
    expect(checkI2(result.makeAggregates, corrupt).ok).toBe(false);
  });

  it('I3 — Σ n(métrique, marque) = n(métrique, Σ)', () => {
    const r = checkI3(result.makeAggregates, result.selectionStats);
    console.log(`[I3] ${r.detail}`);
    expect(r.ok).toBe(true);
    const corrupt: MakeAggregate[] = result.makeAggregates.map((m, i) =>
      i === 0 ? { ...m, price: { ...m.price, n: m.price.n + 1 } } : m,
    );
    expect(checkI3(corrupt, result.selectionStats).ok).toBe(false);
  });

  it('I4 — Σ bins(métrique) = n(métrique, Σ)', () => {
    const r = checkI4(allBuckets(result), result.selectionStats);
    console.log(`[I4] ${r.detail}`);
    expect(r.ok).toBe(true);
    const buckets = allBuckets(result);
    const corrupt: DistributionBucket[] = buckets.map((b, i) =>
      i === 0 ? { ...b, count: b.count + 1 } : b,
    );
    expect(checkI4(corrupt, result.selectionStats).ok).toBe(false);
  });

  it('I5 — quoted + onRequest + missing = N', () => {
    const r = checkI5(result.selectionStats);
    console.log(`[I5] ${r.detail}`);
    expect(r.ok).toBe(true);
    expect(checkI5({ ...result.selectionStats, priceMissingCount: result.selectionStats.priceMissingCount + 1 }).ok).toBe(
      false,
    );
  });

  it('I6 — evaluated + notEvaluated = priceQuotedCount', () => {
    const r = checkI6(result.selectionStats);
    console.log(`[I6] ${r.detail}`);
    expect(r.ok).toBe(true);
    expect(
      checkI6({
        ...result.selectionStats,
        outlierNotEvaluatedCount: result.selectionStats.outlierNotEvaluatedCount + 1,
      }).ok,
    ).toBe(false);
  });

  it('I7 — Σ cellules = n_e ; par colonne d’année, Σ = effectif du bin d’année', () => {
    const r = checkI7(result.densityCells, result.eligibleCount, dataset.yearBucketCountByIndex);
    console.log(`[I7] ${r.detail}`);
    expect(r.ok).toBe(true);
    const corrupt = result.densityCells.map((c, i) => (i === 0 ? { ...c, count: c.count + 1 } : c));
    expect(checkI7(corrupt, result.eligibleCount, dataset.yearBucketCountByIndex).ok).toBe(false);
  });

  it('I8 — BIN invariant par permutation ; min au premier bin, max au dernier', () => {
    const r = checkI8((values) => binEdges(values, PRICE_BIN_PARAMS), validPrices);
    console.log(`[I8] ${r.detail}`);
    expect(r.ok).toBe(true);
    // Violation injectée : une fonction de binning DÉPENDANTE de l’ordre d’entrée.
    const orderDependent = (values: readonly number[]) => [
      { lowerBound: values[0] as number, upperBound: values[values.length - 1] as number },
    ];
    expect(checkI8(orderDependent, validPrices).ok).toBe(false);
  });
});
