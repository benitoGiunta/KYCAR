import { describe, expect, it } from 'vitest';
import { AggregationDataset } from '../../../src/engine/kernel';
import { detectOutliers } from '../../../src/engine/outliers';
import { densityGrid } from '../../../src/engine/density';
import { decodeListingId } from '../../../src/engine/uuid';
import {
  FLAG_PRICE_OUT_OF_RANGE,
  FLAG_PRICE_SENTINEL_ABSOLUTE,
} from '../../../src/engine/flags';
import { allRows, cellRows, makeBatch, refStats, type RowSpec } from './helpers';

/**
 * Revue D4 — prix sentinelles et éligibilité (EX-DATA-16, EX-DATA-19, EX-DATA-60, EX-DATA-99 ;
 * ADV-04 / ARB-15). Une annonce `ON_REQUEST`, `MISSING`, ou à prix < 250 € (drapeau
 * `PRICE_SENTINEL_ABSOLUTE`) COMPTE dans tout effectif (16(a)) et est EXCLUE de toute statistique de
 * prix, de l'histogramme des prix, de M1 et de M2 (16(b)(c)(d)).
 */

const CLEAN = cellRows(40, { makeId: 1, modelId: 101, basePrice: 20_000, seed: 11 });
const cleanPrices = CLEAN.map((r) => r.price as number);

// Lignes sentinelles, ajoutées APRÈS les 40 lignes propres (indices 40..44).
const S_ONE_EURO: RowSpec = { price: 1, status: 'QUOTED', flags: FLAG_PRICE_SENTINEL_ABSOLUTE, year: 2019, mileage: 60_000 };
const S_100_EURO: RowSpec = { price: 100, status: 'QUOTED', flags: FLAG_PRICE_SENTINEL_ABSOLUTE, year: 2020, mileage: 50_000 };
const S_ON_REQUEST: RowSpec = { price: null, status: 'ON_REQUEST', year: 2018, mileage: 70_000 };
const S_MISSING: RowSpec = { price: null, status: 'MISSING', year: 2017, mileage: 90_000 };
const S_OUT_OF_RANGE: RowSpec = { price: null, status: 'MISSING', flags: FLAG_PRICE_OUT_OF_RANGE, year: 2016, mileage: 110_000 };

const batchA = makeBatch([...CLEAN, S_ONE_EURO, S_100_EURO, S_ON_REQUEST, S_MISSING, S_OUT_OF_RANGE]);
const datasetA = new AggregationDataset(batchA);
const resultA = datasetA.recalculate({ selectionHash: 'FULL:EMPTY' });
const sentinelIds = new Set([40, 41, 42, 43, 44].map((row) => decodeListingId(batchA.listingId, row)));

describe('EX-DATA-16(a)/I5 — les sentinelles comptent dans les effectifs', () => {
  it('N = 45 ; quoted = 42 (dont les 2 prix < 250 €), onRequest = 1, missing = 2 (dont PRICE_OUT_OF_RANGE)', () => {
    const s = resultA.selectionStats;
    expect(s.selectionCount).toBe(45);
    expect(s.priceQuotedCount).toBe(42);
    expect(s.priceOnRequestCount).toBe(1);
    expect(s.priceMissingCount).toBe(2);
    expect(resultA.makeAggregates[0]?.listingCount).toBe(45);
    expect(resultA.modelAggregates[0]?.listingCount).toBe(45);
  });

  it('EX-DATA-16(f) — année et kilométrage des sentinelles restent dans V_year / V_mileage (n = 45)', () => {
    expect(resultA.selectionStats.year.n).toBe(45);
    expect(resultA.selectionStats.mileage.n).toBe(45);
    expect(resultA.yearHistogram.reduce((a, b) => a + b.count, 0)).toBe(45);
    expect(resultA.mileageHistogram.reduce((a, b) => a + b.count, 0)).toBe(45);
  });
});

describe('EX-DATA-16(b)(c)/EX-DATA-60 — les sentinelles sortent de V_price', () => {
  it('bloc prix calculé sur les 40 prix propres uniquement (n, min, médiane = référence)', () => {
    const ref = refStats(cleanPrices);
    const p = resultA.selectionStats.price;
    expect(p.n).toBe(40);
    expect(p.min).toBe(ref.min);
    expect(p.max).toBe(ref.max);
    expect(p.p50 as number).toBeCloseTo(ref.p50, 9);
    expect(resultA.makeAggregates[0]?.price.n).toBe(40);
    expect(resultA.makeAggregates[0]?.price.min).toBe(ref.min);
  });

  it('histogramme des prix : Σ count = 40, aucun bin ne contient 1 € ni 100 € (pas de débordement bas)', () => {
    const h = resultA.priceHistogram;
    expect(h.reduce((a, b) => a + b.count, 0)).toBe(40);
    expect(h.every((b) => b.upperBound > 250 || b.count === 0)).toBe(true);
    expect(h.filter((b) => b.open && b.lowerBound === -Infinity).length).toBe(0);
  });
});

describe('EX-DATA-16(d) — les sentinelles ne sont ni évaluées ni signalées par M1/M2', () => {
  it('aucun verdict ne porte un listingId sentinelle ; evaluated ≤ 40 ; notEvaluated ≥ 2 (les 2 prix < 250 € QUOTED)', () => {
    expect(resultA.outlierVerdicts.some((v) => sentinelIds.has(v.listingId))).toBe(false);
    expect(resultA.selectionStats.outlierEvaluatedCount).toBeLessThanOrEqual(40);
    expect(resultA.selectionStats.outlierNotEvaluatedCount).toBeGreaterThanOrEqual(2);
    // Une cellule de 40 avec dispersion : M1 et M2 applicables → les 40 propres sont évaluées.
    expect(resultA.selectionStats.outlierEvaluatedCount).toBe(40);
    expect(resultA.selectionStats.outlierNotEvaluatedCount).toBe(2);
  });

  it('la barrière M1 est calculée sur 40 valeurs (cellCount = 40 sur une cellule enrichie d’un outlier haut ×4)', () => {
    const rows: RowSpec[] = [...CLEAN, { ...(CLEAN[0] as RowSpec), price: Math.round((CLEAN[0]?.price as number) * 4) }, S_ONE_EURO, S_100_EURO];
    const batch = makeBatch(rows);
    const r = detectOutliers(batch, allRows(batch), 'snap', 'FULL:EMPTY');
    const highId = decodeListingId(batch.listingId, 40);
    const m1 = r.verdicts.find((v) => v.listingId === highId && v.method === 'M1');
    expect(m1).toBeDefined();
    expect(m1?.cellCount).toBe(41); // 40 propres + l'outlier haut lui-même, jamais les 2 sentinelles
  });
});

describe('EX-DATA-99 — éligibilité au nuage / grille de densité face aux prix sentinelles', () => {
  it('R-D4-01 — un prix QUOTED porteur de PRICE_SENTINEL_ABSOLUTE (1 €) est compté ÉLIGIBLE par le moteur (n_e = 42) alors que V_price l’exclut (attendu n_e = 40, cf. scatter-model D7 « suspectValue »)', () => {
    // Les 40 lignes propres + S_ONE_EURO + S_100_EURO ont statut QUOTED, année et kilométrage valides.
    // EX-DATA-16(e)/EX-DATA-19 : un prix sentinelle est exclu de V_price et l'axe 1 du nuage est
    // `priceEur` (EX-DATA-98) ; EX-DATA-99 ventile ce cas sous `suspectValue`. D7 (`computeEligibility`)
    // exclut ces lignes ; le moteur les inclut → `eligibleCount` publié ≠ effectif tracé.
    expect(resultA.eligibleCount).toBe(40);
  });

  it('les lignes ON_REQUEST / MISSING sont hors du nuage (motif noPrice) — Σ cellules = n_e', () => {
    const d = densityGrid(batchA, allRows(batchA), 'snap', 'FULL:EMPTY');
    expect(d.cells.reduce((a, c) => a + c.count, 0)).toBe(d.eligibleCount);
    expect(d.eligibleCount).toBeLessThanOrEqual(42);
  });

  it('R-D4-02 — la ventilation des motifs de non-éligibilité (noPrice, noYear, noMileage, suspectValue) exigée par EX-DATA-99 n’est pas publiée par le moteur', () => {
    const keys = Object.keys(resultA);
    expect(keys.some((k) => /noPrice|noYear|noMileage|suspectValue|ineligib/i.test(k))).toBe(true);
  });
});

describe('EX-DATA-19(2)/EX-DATA-60/87 — sentinelle RELATIVE à la cellule (PRICE_IMPLAUSIBLE_IN_CELL)', () => {
  // 40 prix propres ≈ 12 000–20 000 € (médiane ≈ 15 000 €), un prix de 300 € (≥ 250 : pas de drapeau
  // absolu ; < 0,10 × médianeRéf : IMPLAUSIBLE_IN_CELL), et un outlier haut ×4 pour observer cellCount.
  const rowsC: RowSpec[] = [
    ...CLEAN,
    { ...(CLEAN[1] as RowSpec), price: 300 },
    { ...(CLEAN[2] as RowSpec), price: Math.round((CLEAN[2]?.price as number) * 4) },
  ];
  const batchC = makeBatch(rowsC);
  const rC = detectOutliers(batchC, allRows(batchC), 'snap', 'FULL:EMPTY');
  const implausibleId = decodeListingId(batchC.listingId, 40);
  const highId = decodeListingId(batchC.listingId, 41);

  it('R-D4-03 — l’annonce à 300 € (< 0,10 × médianeRéf) doit être écartée de V_price(C) et non évaluée ; le moteur la signale M1_LOW/M2_LOW', () => {
    const verdicts = rC.verdicts.filter((v) => v.listingId === implausibleId);
    expect(verdicts.map((v) => v.method)).toEqual([]);
  });

  it('R-D4-04 — cellCount publié avec le verdict doit valoir n_price(C) hors implausibles (41) ; le moteur publie 42', () => {
    const m1 = rC.verdicts.find((v) => v.listingId === highId && v.method === 'M1');
    expect(m1).toBeDefined();
    expect(m1?.cellCount).toBe(41);
  });
});

describe('Dépendance au drapeau d’ingestion (information, pas un constat moteur)', () => {
  it('un prix QUOTED de 1 € SANS drapeau PRICE_SENTINEL_ABSOLUTE entre dans V_price : le moteur ne re-dérive pas la règle absolue (EX-DATA-19 étage ingestion)', () => {
    const batchB = makeBatch([...CLEAN, { price: 1, status: 'QUOTED', year: 2019, mileage: 60_000 }]);
    const r = new AggregationDataset(batchB).recalculate({ selectionHash: 'FULL:EMPTY' });
    console.log(
      `[sentinelle sans drapeau] price.n = ${r.selectionStats.price.n} ; min = ${r.selectionStats.price.min} ; ` +
        `verdicts sur la ligne 1 € = ${r.outlierVerdicts.filter((v) => v.listingId === decodeListingId(batchB.listingId, 40)).map((v) => v.method + ':' + v.flags.join('+')).join(',') || 'aucun'}`,
    );
    expect(r.selectionStats.price.n).toBe(41);
    expect(r.selectionStats.price.min).toBe(1);
  });
});
