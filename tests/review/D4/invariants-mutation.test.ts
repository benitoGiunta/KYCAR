import { beforeAll, describe, expect, it } from 'vitest';
import type { ListingColumnBatch, ReferenceData } from '../../../src/types/index';
import { checkI1, checkI2, checkI3, checkI4, checkI5, checkI6, checkI7, checkI8 } from '../../../src/types/index';
import { AggregationDataset, type EngineSelection, type RecalcResult } from '../../../src/engine/kernel';
import { bin, binEdges, MILEAGE_BIN_PARAMS, PRICE_BIN_PARAMS, YEAR_BIN_PARAMS } from '../../../src/engine/bin';
import { isMileageValid, isPriceValid, isYearValid, PRICE_STATUS_QUOTED, yearFromYearMonth } from '../../../src/engine/flags';
import { loadReferenceData, openSyntheticProvider } from '../../../src/engine/testkit';

/**
 * Revue D4 — invariants I1..I8 (EX-DATA-104) sur le dataset D3 (N = 20 000, graine 7) :
 *   1. relance des 8 contrôles sur la sélection vide ET sur une sélection élaguée + filtrée ;
 *   2. sondes de mutation au niveau de l'ENTRÉE (batch) et de la SORTIE (résultat) : une violation doit
 *      être détectée ; quand le moteur produit lui-même une sortie violant un invariant à partir d'une
 *      entrée dégradée, c'est un constat ;
 *   3. contrôle INDÉPENDANT de I6 (le moteur calcule `notEvaluated = quoted − evaluated` : le contrôle
 *      D2 est tautologique sur ses sorties) et de la partition de la grille de densité (I7 / EX-DATA-102).
 */

const N = 20_000;

let ref: ReferenceData;
let batch: ListingColumnBatch;
let dataset: AggregationDataset;
let full: RecalcResult;
let filteredSel: EngineSelection;

beforeAll(async () => {
  ref = loadReferenceData();
  const provider = await openSyntheticProvider(ref, N, 7);
  batch = provider.getDataset().batch;
  dataset = new AggregationDataset(batch, ref.models);
  full = dataset.recalculate({ selectionHash: 'FULL:EMPTY' });
  // Sélection élaguée (plus grosse marque) + filtre R (carburant = code le plus fréquent).
  let bestMake = -1;
  let best = -1;
  for (const [makeId, range] of dataset.indexes.makeOffsets) {
    if (range.end - range.start > best) {
      best = range.end - range.start;
      bestMake = makeId;
    }
  }
  const fuelCounts = new Map<number, number>();
  for (let i = 0; i < batch.rowCount; i++) {
    const f = batch.fuelCategory[i] as number;
    if (f !== 255) fuelCounts.set(f, (fuelCounts.get(f) ?? 0) + 1);
  }
  const topFuel = [...fuelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as number;
  filteredSel = {
    selectionHash: 'FULL:make-fuel',
    scope: { makeIds: [bestMake] },
    refine: [{ kind: 'enum', filterId: 'fuel', column: 'fuelCategory', codes: [topFuel] }],
  };
});

function allBuckets(r: RecalcResult) {
  return [...r.priceHistogram, ...r.yearHistogram, ...r.mileageHistogram];
}

function checkAll(r: RecalcResult, yearMarginal: ReadonlyMap<number, number>, label: string): void {
  const results = [
    checkI1(r.makeAggregates, r.selectionStats.selectionCount),
    checkI2(r.makeAggregates, r.modelAggregates),
    checkI3(r.makeAggregates, r.selectionStats),
    checkI4(allBuckets(r), r.selectionStats),
    checkI5(r.selectionStats),
    checkI6(r.selectionStats),
    checkI7(r.densityCells, r.eligibleCount, yearMarginal),
  ];
  for (const res of results) {
    console.log(`[${label}] ${res.id} ${res.ok ? 'OK' : 'KO'} — ${res.detail}`);
    expect(res.ok, `${label} ${res.id}: ${res.detail}`).toBe(true);
  }
}

describe('EX-DATA-104 — I1..I8 relancés (sélection vide et sélection élaguée + filtrée)', () => {
  it('I1..I7 tiennent sur la sélection vide (N = 20 000)', () => {
    expect(full.selectionStats.selectionCount).toBe(N);
    // Le marginal d'année exposé par le noyau est celui du DERNIER recalcul : on rejoue FULL.
    const again = dataset.recalculate({ selectionHash: 'FULL:EMPTY' });
    checkAll(again, dataset.yearBucketCountByIndex, 'FULL');
  });

  it('I1..I7 tiennent sur une sélection élaguée (marque) + filtre R (carburant)', () => {
    const again = dataset.recalculate(filteredSel);
    expect(again.pruned).toBe(true);
    expect(again.selectionStats.selectionCount).toBeGreaterThan(0);
    expect(again.selectionStats.selectionCount).toBeLessThan(N);
    checkAll(again, dataset.yearBucketCountByIndex, 'ÉLAGUÉE+R');
  });

  it('I8 tient sur les trois paramétrages (prix, kilométrage, année) avec les valeurs valides du dataset', () => {
    const prices: number[] = [];
    const kms: number[] = [];
    const years: number[] = [];
    for (let i = 0; i < batch.rowCount && prices.length < 2_000; i++) {
      const ingest = batch.ingestFlags[i] as number;
      const p = batch.priceEur[i] as number;
      if (isPriceValid(p, batch.priceStatus[i] as number, ingest)) prices.push(p);
      const km = batch.mileageKm[i] as number;
      if (isMileageValid(km, ingest)) kms.push(km);
      const ym = batch.firstRegistrationYearMonth[i] as number;
      if (isYearValid(ym)) years.push(yearFromYearMonth(ym));
    }
    expect(checkI8((v) => binEdges(v, PRICE_BIN_PARAMS), prices).ok).toBe(true);
    expect(checkI8((v) => binEdges(v, MILEAGE_BIN_PARAMS), kms).ok).toBe(true);
    expect(checkI8((v) => binEdges(v, YEAR_BIN_PARAMS), years).ok).toBe(true);
  });
});

describe('Sondes de mutation — chaque invariant détecte une violation', () => {
  it('sortie corrompue : I1, I2, I3, I4, I5, I6, I7 passent chacun à KO sur une altération unitaire', () => {
    const s = full.selectionStats;
    expect(checkI1(full.makeAggregates, s.selectionCount - 1).ok).toBe(false);
    expect(checkI2(full.makeAggregates, full.modelAggregates.map((m, i) => (i === 0 ? { ...m, listingCount: m.listingCount - 1 } : m))).ok).toBe(false);
    expect(checkI3(full.makeAggregates.map((m, i) => (i === 0 ? { ...m, mileage: { ...m.mileage, n: m.mileage.n + 1 } } : m)), s).ok).toBe(false);
    expect(checkI4(allBuckets(full).map((b, i) => (i === 0 ? { ...b, count: b.count + 1 } : b)), s).ok).toBe(false);
    expect(checkI5({ ...s, priceOnRequestCount: s.priceOnRequestCount + 1 }).ok).toBe(false);
    expect(checkI6({ ...s, outlierEvaluatedCount: s.outlierEvaluatedCount + 1 }).ok).toBe(false);
    const cells = full.densityCells;
    expect(checkI7(cells.slice(1), full.eligibleCount, dataset.yearBucketCountByIndex).ok).toBe(false);
  });

  it('I8 : une fonction de binning dépendante de l’ordre est détectée', () => {
    const values = [3, 1, 2, 10, 7];
    const orderDependent = (v: readonly number[]) => [{ lowerBound: v[0] as number, upperBound: v[v.length - 1] as number }];
    expect(checkI8(orderDependent, values).ok).toBe(false);
  });

  it('R-D4-08 — entrée dégradée : un `priceStatus` hors vocabulaire (255) traverse le moteur en silence et produit une sortie qui viole I5 (attendu : rejet ou comptage exhaustif)', () => {
    const mutated: ListingColumnBatch = { ...batch, priceStatus: Uint8Array.from(batch.priceStatus) };
    (mutated.priceStatus as Uint8Array)[0] = 255;
    (mutated.priceStatus as Uint8Array)[1] = 7;
    let threw = false;
    let i5ok = true;
    try {
      const r = new AggregationDataset(mutated).recalculate({ selectionHash: 'FULL:EMPTY' });
      i5ok = checkI5(r.selectionStats).ok;
      console.log(`[mutation I5] ${checkI5(r.selectionStats).detail}`);
    } catch {
      threw = true;
    }
    expect(threw || i5ok).toBe(true);
  });

  it('entrée dégradée : un kilométrage hors bornes DRAPEAUTÉ sort de V_mileage (I3/I4 restent vrais) — EX-DATA-60', () => {
    const mutated: ListingColumnBatch = { ...batch, ingestFlags: Uint32Array.from(batch.ingestFlags) };
    const bitMileageOOR = 1 << 9; // MILEAGE_OUT_OF_RANGE (index 9 d'INGEST_FLAG_VALUES)
    let touched = 0;
    for (let i = 0; i < 50; i++) {
      if ((batch.mileageKm[i] as number) >= 0) {
        (mutated.ingestFlags as Uint32Array)[i] = (mutated.ingestFlags[i] as number) | bitMileageOOR;
        touched++;
      }
    }
    const r = new AggregationDataset(mutated).recalculate({ selectionHash: 'FULL:EMPTY' });
    expect(r.selectionStats.mileage.n).toBe(full.selectionStats.mileage.n - touched);
    expect(checkI3(r.makeAggregates, r.selectionStats).ok).toBe(true);
    expect(checkI4(allBuckets(r), r.selectionStats).ok).toBe(true);
  });
});

describe('I6 — contrôle indépendant (le moteur dérive notEvaluated par soustraction)', () => {
  it('evaluated ≤ n_price(Σ) et notEvaluated ≥ quoted − n_price(Σ), recomptés hors moteur', () => {
    let quoted = 0;
    let priceValid = 0;
    for (let i = 0; i < batch.rowCount; i++) {
      const status = batch.priceStatus[i] as number;
      if (status === PRICE_STATUS_QUOTED) quoted++;
      if (isPriceValid(batch.priceEur[i] as number, status, batch.ingestFlags[i] as number)) priceValid++;
    }
    const s = full.selectionStats;
    expect(s.priceQuotedCount).toBe(quoted);
    expect(s.price.n).toBe(priceValid);
    expect(s.outlierEvaluatedCount).toBeLessThanOrEqual(priceValid);
    expect(s.outlierNotEvaluatedCount).toBeGreaterThanOrEqual(quoted - priceValid);
    // Le contrôle D2 est tautologique par construction du moteur : il ne peut jamais échouer sur une sortie réelle.
    expect(s.outlierNotEvaluatedCount).toBe(s.priceQuotedCount - s.outlierEvaluatedCount);
    console.log(`[I6 indépendant] quoted=${quoted} n_price=${priceValid} evaluated=${s.outlierEvaluatedCount} notEvaluated=${s.outlierNotEvaluatedCount}`);
  });
});

describe('I7 / EX-DATA-102 — la grille de densité réutilise-t-elle EXACTEMENT les bins de BIN de la sélection ?', () => {
  it('colonnes de la grille vs histogramme d’année PUBLIÉ (G3) : mêmes indices fermés (W = {1}) mais effectifs différents (n_e < n_year) — tension du texte d’I7', () => {
    const byIndex = new Map<number, number>();
    for (const c of full.densityCells) byIndex.set(c.yearBinIndex, (byIndex.get(c.yearBinIndex) ?? 0) + c.count);
    const published = new Map(full.yearHistogram.filter((b) => !b.open).map((b) => [b.index, b.count]));
    let equalColumns = 0;
    let differentColumns = 0;
    for (const [idx, count] of byIndex) {
      if (!published.has(idx)) continue;
      if (published.get(idx) === count) equalColumns++;
      else differentColumns++;
    }
    const sumGrid = [...byIndex.values()].reduce((a, b) => a + b, 0);
    const sumHist = full.yearHistogram.reduce((a, b) => a + b.count, 0);
    console.log(`[I7 vs G3] Σ grille = ${sumGrid} (n_e) ; Σ histogramme année = ${sumHist} (n_year) ; colonnes égales = ${equalColumns}, différentes = ${differentColumns}`);
    expect(sumGrid).toBe(full.eligibleCount);
    expect(sumHist).toBe(full.selectionStats.year.n);
    expect(sumHist).toBeGreaterThanOrEqual(sumGrid);
  });

  it('EX-DATA-102 — partition du kilométrage : la grille est binée sur l’ensemble ÉLIGIBLE, l’histogramme G2 sur V_mileage(Σ) — largeur et bornes doivent coïncider', () => {
    const eligMileage: number[] = [];
    const allMileage: number[] = [];
    for (let i = 0; i < batch.rowCount; i++) {
      const ingest = batch.ingestFlags[i] as number;
      const km = batch.mileageKm[i] as number;
      const kmOk = isMileageValid(km, ingest);
      if (kmOk) allMileage.push(km);
      const status = batch.priceStatus[i] as number;
      if (status === PRICE_STATUS_QUOTED && isYearValid(batch.firstRegistrationYearMonth[i] as number) && kmOk) eligMileage.push(km);
    }
    const gridBins = bin(eligMileage, MILEAGE_BIN_PARAMS);
    const histBins = bin(allMileage, MILEAGE_BIN_PARAMS);
    const publishedWidth = (full.mileageHistogram.find((b) => !b.open) as { upperBound: number; lowerBound: number }).upperBound -
      (full.mileageHistogram.find((b) => !b.open) as { upperBound: number; lowerBound: number }).lowerBound;
    console.log(
      `[EX-DATA-102 km] grille : w=${gridBins.binWidth} kLo=${gridBins.kLo} kHi=${gridBins.kHi} ; ` +
        `G2 publié : w=${publishedWidth} kLo=${histBins.kLo} kHi=${histBins.kHi} ; indices de cellules km observés : ` +
        `${Math.min(...full.densityCells.map((c) => c.mileageBinIndex))}..${Math.max(...full.densityCells.map((c) => c.mileageBinIndex))}`,
    );
    expect(gridBins.binWidth).toBe(publishedWidth);
    expect(gridBins.kLo).toBe(histBins.kLo);
    expect(gridBins.kHi).toBe(histBins.kHi);
  });
});
