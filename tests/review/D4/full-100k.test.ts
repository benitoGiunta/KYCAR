import { beforeAll, describe, expect, it } from 'vitest';
import type { ListingColumnBatch, ReferenceData } from '../../../src/types/index';
import { AggregationDataset, type EngineSelection } from '../../../src/engine/kernel';
import { aggregate } from '../../../src/engine/aggregate';
import { detectOutliers, type OutlierResult } from '../../../src/engine/outliers';
import { densityGrid } from '../../../src/engine/density';
import { isMileageValid, isPriceValid, isYearValid, PRICE_STATUS_QUOTED, FLAG_PRICE_SENTINEL_ABSOLUTE } from '../../../src/engine/flags';
import { modelIndexKey } from '../../../src/engine/index-build';
import { loadReferenceData, openSyntheticProvider } from '../../../src/engine/testkit';
import { batchByteLength, type InjectedOutlier } from '../../../src/providers/synthetic/index';
import { decodeListingId } from '../../../src/engine/uuid';
import { medianMs, percentileMs, retainedBytes } from './helpers';

/**
 * Revue D4 — sondes à N = 100 000 (dataset D3, graine 7), UN SEUL dataset construit et mis en cache au
 * niveau du module (discipline CPU) :
 *   - EX-DATA-112 : mémoire mesurée (`process.memoryUsage`) avant/après chargement + index, extrapolée
 *     linéairement à 10⁶ et comparée aux 274 Mo d'ARB-55 (ADV-08/09) et aux ~87 Mo initiaux ;
 *   - EX-DATA-109 : la sélection vide est-elle servie sans balayage par le MOTEUR ?
 *   - O17 : coût de M1/M2 (`detectOutliers`) et des autres postes en fonction de n ∈ {100, 10³, 10⁴, 10⁵},
 *     et exposition de l'API à un recalcul M1/M2 sur sélection NON élaguée ;
 *   - EX-DATA-84..97 : rappel/précision M1/M2 contre la vérité terrain D3 ; contrôle M3 sur ≥ 3 cellules
 *     d'effectif > 200 (EX-DATA-97) ; audit des prix < 250 € (EX-DATA-19) dans le dataset.
 */

const N = 100_000;
const MB = 1024 * 1024;

interface Mem {
  rss: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}
const snapshotMem = (): Mem => {
  const m = process.memoryUsage();
  return { rss: m.rss, heapUsed: m.heapUsed, external: m.external, arrayBuffers: m.arrayBuffers };
};
const deltaMb = (a: Mem, b: Mem): Record<keyof Mem, string> => ({
  rss: ((b.rss - a.rss) / MB).toFixed(1),
  heapUsed: ((b.heapUsed - a.heapUsed) / MB).toFixed(1),
  external: ((b.external - a.external) / MB).toFixed(1),
  arrayBuffers: ((b.arrayBuffers - a.arrayBuffers) / MB).toFixed(1),
});

let ref: ReferenceData;
let batch: ListingColumnBatch;
let dataset: AggregationDataset;
let truth: readonly InjectedOutlier[];
let memBefore: Mem;
let memAfterProvider: Mem;
let memAfterIndexes: Mem;
let retainedBefore: number;
let retainedAfterProvider: number;
let retainedAfterIndexes: number;
let indexBuildMs: number;
let full: OutlierResult;

beforeAll(async () => {
  ref = loadReferenceData();
  retainedBefore = retainedBytes();
  memBefore = snapshotMem();
  const provider = await openSyntheticProvider(ref, N, 7);
  batch = provider.getDataset().batch;
  truth = provider.getGroundTruthOutliers();
  retainedAfterProvider = retainedBytes();
  memAfterProvider = snapshotMem();
  const t0 = performance.now();
  dataset = new AggregationDataset(batch, ref.models);
  indexBuildMs = performance.now() - t0;
  retainedAfterIndexes = retainedBytes();
  memAfterIndexes = snapshotMem();
  const rows = Int32Array.from({ length: N }, (_v, i) => i);
  full = detectOutliers(batch, rows, batch.snapshotId, 'FULL:EMPTY');
}, 300_000);

describe('EX-DATA-112 / EX-DATA-115 / ARB-55 — mémoire mesurée à N = 100 000 (GC forcé) et extrapolée à 10⁶', () => {
  it('magasin colonnaire : batchByteLength × 10 dans l’enveloppe corrigée d’ARB-55 (colonnes + chaînes ≈ 232 Mo à 10⁶)', () => {
    const bytesColumns = batchByteLength(batch);
    const dProv = deltaMb(memBefore, memAfterProvider);
    console.log(
      `[mémoire 100k — dataset] batchByteLength = ${(bytesColumns / MB).toFixed(1)} Mo (${(bytesColumns / N).toFixed(0)} o/ligne, EX-DATA-119/121 annonce ≈ 251) ; ` +
        `retenu (heap+arrayBuffers après GC) Δ provider = ${((retainedAfterProvider - retainedBefore) / MB).toFixed(1)} Mo ; rss Δ = ${dProv.rss} Mo (inclut la génération D3)`,
    );
    expect((bytesColumns * 10) / MB).toBeLessThan(232);
  });

  it('R-D4-13 — la construction des index (EX-DATA-115) retient ≈ 74 Mo de tas V8 à 100k (≈ 740 Mo à 10⁶, budget EX-DATA-115 ≈ 41 Mo) : PK_LISTING est une Map de 100 000 cordes UUID non aplaties (≈ 770 o/clé)', () => {
    const idx = dataset.indexes;
    let bitsetBytes = 0;
    for (const [, perValue] of idx.bitsets) for (const [, arr] of perValue) bitsetBytes += arr.byteLength;
    const typedIndexBytes = idx.idxMakeRows.byteLength + idx.idxModelRows.byteLength + idx.idxPriceSorted.byteLength + bitsetBytes;
    const indexRetainedMb = (retainedAfterIndexes - retainedAfterProvider) / MB;
    const totalRetainedMb = (retainedAfterIndexes - retainedBefore) / MB;
    const dIdx = deltaMb(memAfterProvider, memAfterIndexes);
    // Coût isolé des clés : décoder les 100 000 listingId comme le fait buildIndexes (chaîne par `+=`).
    const before = retainedBytes();
    const keys: string[] = [];
    for (let i = 0; i < N; i++) keys.push(decodeListingId(batch.listingId, i));
    const keysMb = (retainedBytes() - before) / MB;
    console.log(
      `[mémoire 100k — index] construction ${indexBuildMs.toFixed(0)} ms ; retenu Δ index = ${indexRetainedMb.toFixed(1)} Mo (heap ${dIdx.heapUsed}, arrayBuffers ${dIdx.arrayBuffers}) ; ` +
        `index typés (3 Int32Array + bitsets) = ${(typedIndexBytes / MB).toFixed(2)} Mo ; 100 000 clés UUID décodées par decodeListingId = ${keysMb.toFixed(1)} Mo (${((keysMb * MB) / N).toFixed(0)} o/clé, ${keys.length} clés) ; ` +
        `PK_LISTING.size = ${idx.pkListing.size}`,
    );
    console.log(
      `[mémoire ×10 → 10⁶] dataset + index retenus ≈ ${(totalRetainedMb * 10).toFixed(0)} Mo (dont index ≈ ${(indexRetainedMb * 10).toFixed(0)} Mo) ; ` +
        `référence EX-DATA-112 corrigée (ARB-55) = 274 Mo pire cas dont index EX-DATA-115 ≈ 41 Mo (PK 24 + IDX 12 + bitsets 5,4) ; ancien total contesté ≈ 87 Mo ; budget d'onglet 512 Mo`,
    );
    // Tolérance ×3 sur la part d'index d'EX-DATA-115 ramenée à 100k (41 Mo / 10 = 4,1 Mo).
    expect(indexRetainedMb).toBeLessThanOrEqual(12.5);
  });
});

describe('EX-DATA-109 — sélection vide côté moteur', () => {
  it('le moteur n’a PAS de précalcul : `recalculate(FULL:EMPTY)` balaie les N lignes (scannedCount = N) ; le précalcul relève du provider/app', () => {
    const t0 = performance.now();
    const r = dataset.recalculate({ selectionHash: 'FULL:EMPTY' });
    const dt = performance.now() - t0;
    console.log(`[EX-DATA-109] sélection vide : scannedCount=${r.scannedCount} pruned=${r.pruned} durée=${dt.toFixed(0)} ms ; verdicts=${r.outlierVerdicts.length}`);
    expect(r.scannedCount).toBe(N);
    expect(r.pruned).toBe(false);
  });
});

describe('O17 — chemins de calcul au-delà de 200 ms et exposition de l’API', () => {
  it('R-D4-12 — l’API accepte un RECALCULATE sans scope : M1/M2 (dont M2 à la cellule C₃ = snapshot entier) s’exécutent sur la sélection NON élaguée ; attendu : garde dans le moteur', () => {
    const r = dataset.recalculate({ selectionHash: 'FULL:EMPTY' });
    const m2Selection = r.outlierVerdicts.filter((v) => v.method === 'M2' && v.cellLabel === 'SELECTION').length;
    const m1Selection = r.outlierVerdicts.filter((v) => v.method === 'M1' && v.cellLabel === 'SELECTION').length;
    console.log(`[O17 API] sans scope : pruned=${r.pruned}, verdicts M2@SELECTION=${m2Selection}, M1@SELECTION=${m1Selection} (cellule = ${N} lignes)`);
    expect(r.pruned).toBe(false);
    // Un moteur gardé ne produit pas de régression M2 sur une cellule de 10⁵ lignes hors élagage.
    expect(m2Selection).toBe(0);
  });

  it('coût de M1/M2 (`detectOutliers`), de l’agrégation et de la densité en fonction de n (sous-échantillons à pas constant)', () => {
    const sizes = [100, 1_000, 10_000, 100_000];
    const table: string[] = [];
    for (const n of sizes) {
      const stride = N / n;
      const rows = Int32Array.from({ length: n }, (_v, i) => Math.floor(i * stride));
      const runs = n >= 100_000 ? 3 : 5;
      const tOut: number[] = [];
      const tAgg: number[] = [];
      const tDen: number[] = [];
      let m2Sel = 0;
      for (let k = 0; k < runs; k++) {
        let t0 = performance.now();
        const o = detectOutliers(batch, rows, batch.snapshotId, `FULL:n${n}`);
        tOut.push(performance.now() - t0);
        m2Sel = o.verdicts.filter((v) => v.method === 'M2' && v.cellLabel === 'SELECTION').length;
        t0 = performance.now();
        aggregate(batch, rows, batch.snapshotId, `FULL:n${n}`);
        tAgg.push(performance.now() - t0);
        t0 = performance.now();
        densityGrid(batch, rows, batch.snapshotId, `FULL:n${n}`);
        tDen.push(performance.now() - t0);
      }
      table.push(
        `n=${String(n).padStart(6)} : M1/M2 ${medianMs(tOut).toFixed(1).padStart(7)} ms | agrégats+histogrammes ${medianMs(tAgg).toFixed(1).padStart(7)} ms | densité ${medianMs(tDen).toFixed(1).padStart(6)} ms | verdicts M2@SELECTION=${m2Sel}`,
      );
    }
    console.log(`[O17 coût vs n — médiane de 3 à 5 exécutions]\n${table.join('\n')}`);
    expect(table.length).toBe(4);
  });

  it('O17 — point de franchissement des 200 ms d’un recalcul NON élagué (sélection filtrée R sans scope) en fonction de l’effectif retenu', () => {
    // Un filtre R seul (sans marque/modèle) balaie N puis calcule M1/M2 sur les n lignes retenues :
    // c'est le « mode 1 fortement filtré » d'ARCHITECTURE §3.2. On mesure recalculate() pour des
    // plages d'année de plus en plus larges (n croissant), 3 exécutions, médiane.
    const bounds = [2024, 2022, 2020, 2018, 2015, 2010, 1900];
    const lines: string[] = [];
    let crossing: number | null = null;
    for (const minYear of bounds) {
      const sel: EngineSelection = {
        selectionHash: `FULL:year≥${minYear}`,
        refine: [{ kind: 'range', filterId: 'year', column: 'year', min: minYear, max: null }],
      };
      const samples: number[] = [];
      let n = 0;
      for (let k = 0; k < 3; k++) {
        const t0 = performance.now();
        n = dataset.recalculate(sel).selectionStats.selectionCount;
        samples.push(performance.now() - t0);
      }
      const med = medianMs(samples);
      lines.push(`année ≥ ${minYear} : n=${String(n).padStart(6)} → ${med.toFixed(0).padStart(4)} ms`);
      if (crossing === null && med > 200) crossing = n;
    }
    console.log(`[O17 franchissement — recalc sans scope, filtre R année, médiane de 3]\n${lines.join('\n')}\n→ premier effectif retenu au-delà de 200 ms : ${crossing ?? 'aucun'}`);
    expect(lines.length).toBe(bounds.length);
  }, 120_000);

  it('recalcul complet : non filtré (×5) vs élagué marque la plus peuplée (×20) vs modèle médian (×20)', () => {
    const fullSel: EngineSelection = { selectionHash: 'FULL:EMPTY' };
    let bestMake = -1;
    let best = -1;
    for (const [makeId, range] of dataset.indexes.makeOffsets) {
      if (range.end - range.start > best) {
        best = range.end - range.start;
        bestMake = makeId;
      }
    }
    const cells = [...dataset.indexes.modelOffsets.entries()].map(([key, r]) => ({ key, count: r.end - r.start })).sort((a, b) => a.count - b.count);
    const median = cells[Math.floor(cells.length / 2)] as { key: string; count: number };
    const [mk, md] = median.key.split(':').map(Number) as [number, number];
    const makeSel: EngineSelection = { selectionHash: 'FULL:make', scope: { makeIds: [bestMake] } };
    const modelSel: EngineSelection = { selectionHash: 'FULL:model', scope: { models: [{ makeId: mk, modelId: md }] } };
    const bench = (sel: EngineSelection, runs: number) => {
      dataset.recalculate(sel);
      const samples: number[] = [];
      for (let i = 0; i < runs; i++) {
        const t0 = performance.now();
        dataset.recalculate(sel);
        samples.push(performance.now() - t0);
      }
      return { p50: medianMs(samples), p95: percentileMs(samples, 0.95), max: Math.max(...samples) };
    };
    const f = bench(fullSel, 5);
    const m = bench(makeSel, 20);
    const d = bench(modelSel, 20);
    console.log(
      `[recalc 100k] non filtré (N=${N}) : p50=${f.p50.toFixed(0)} p95=${f.p95.toFixed(0)} max=${f.max.toFixed(0)} ms ; ` +
        `marque élaguée (m=${best}) : p50=${m.p50.toFixed(1)} p95=${m.p95.toFixed(1)} ms ; ` +
        `modèle médian (m=${median.count}) : p50=${d.p50.toFixed(2)} p95=${d.p95.toFixed(2)} ms`,
    );
    expect(m.p95).toBeLessThanOrEqual(200);
    expect(d.p95).toBeLessThanOrEqual(200);
  }, 120_000);
});

describe('EX-DATA-84..97 — vérité terrain D3, sentinelles, contrôle M3', () => {
  const inter = (a: ReadonlySet<string>, b: ReadonlySet<string>): number => {
    let c = 0;
    for (const x of a) if (b.has(x)) c++;
    return c;
  };

  it('rappel M1 > 90 % et rappel M2 ≥ 95 % dans les cellules à |F| ≥ 30 (chiffres du journal : 95,8 % / 100 %) ; précision rapportée', () => {
    const truthM1 = new Set(truth.filter((o) => o.method === 'M1').map((o) => o.listingId));
    const all = new Set(truth.map((o) => o.listingId));
    // DR-002 / EX-DATA-19(2) : un injecté dont le prix tombe sous `0,10 × médianeRéf(C)` porte
    // `PRICE_IMPLAUSIBLE_IN_CELL`, sort de `V_price(C)` et n'est donc PAS évaluable par M1/M2. Le
    // rappel se mesure sur la population que l'exigence laisse détectable ; le rappel BRUT reste
    // imprimé, et l'écart (139 injectés sur 283 à N = 100 000) est le constat à porter au
    // générateur D3 (DR-123 : les outliers injectés à `fair × [0,14 ; 0,24]` avec plancher 300 €
    // tombent sous le seuil relatif de leur cellule).
    const evaluableM1 = new Set([...truthM1].filter((id) => !full.implausibleInCellIds.has(id)));
    const recallM1 = inter(truthM1, full.m1FlaggedIds) / evaluableM1.size;
    const precisionM1 = inter(full.m1FlaggedIds, all) / full.m1FlaggedIds.size;
    const precisionM2 = inter(full.m2FlaggedIds, all) / full.m2FlaggedIds.size;
    const fByCell = new Map<string, number>();
    for (let i = 0; i < N; i++) {
      const status = batch.priceStatus[i] as number;
      const ingest = batch.ingestFlags[i] as number;
      if (!isPriceValid(batch.priceEur[i] as number, status, ingest)) continue;
      if (!isYearValid(batch.firstRegistrationYearMonth[i] as number)) continue;
      if (!isMileageValid(batch.mileageKm[i] as number, ingest)) continue;
      const key = modelIndexKey(batch.makeId[i] as number, batch.modelId[i] as number);
      fByCell.set(key, (fByCell.get(key) ?? 0) + 1);
    }
    let big = 0;
    let bigCaught = 0;
    for (const o of truth) {
      if (o.method !== 'M2') continue;
      if (full.implausibleInCellIds.has(o.listingId)) continue;
      if ((fByCell.get(modelIndexKey(o.makeId, o.modelId)) ?? 0) >= 30) {
        big++;
        if (full.m2FlaggedIds.has(o.listingId)) bigCaught++;
      }
    }
    const recallM2Big = bigCaught / big;
    console.log(
      `[vérité terrain] M1 : rappel évaluable ${(recallM1 * 100).toFixed(1)} % (${inter(truthM1, full.m1FlaggedIds)}/${evaluableM1.size}), brut ${((inter(truthM1, full.m1FlaggedIds) / truthM1.size) * 100).toFixed(1)} % sur ${truthM1.size} injectés dont ${truthM1.size - evaluableM1.size} PRICE_IMPLAUSIBLE_IN_CELL, précision ${(precisionM1 * 100).toFixed(1)} % sur ${full.m1FlaggedIds.size} signalés ; ` +
        `M2 (cellules |F| ≥ 30) : rappel ${(recallM2Big * 100).toFixed(1)} % (${bigCaught}/${big}), précision M2 ${(precisionM2 * 100).toFixed(1)} % sur ${full.m2FlaggedIds.size} signalés ; ` +
        `taux de signalement M1 = ${((full.m1FlaggedIds.size / full.outlierEvaluatedCount) * 100).toFixed(2)} % des évaluées (attendu ≈ 1,4 % sous log-normale, EX-DATA-88)`,
    );
    expect(recallM1).toBeGreaterThan(0.9);
    expect(recallM2Big).toBeGreaterThanOrEqual(0.95);
  });

  it('EX-DATA-19 — audit des prix < 250 € du dataset D3 : drapeau PRICE_SENTINEL_ABSOLUTE posé ? conséquence sur V_price', () => {
    let under250 = 0;
    let under250Flagged = 0;
    let injectedM1LowUnder250 = 0;
    for (let i = 0; i < N; i++) {
      const p = batch.priceEur[i] as number;
      if ((batch.priceStatus[i] as number) !== PRICE_STATUS_QUOTED || p < 0 || p >= 250) continue;
      under250++;
      if (((batch.ingestFlags[i] as number) & FLAG_PRICE_SENTINEL_ABSOLUTE) !== 0) under250Flagged++;
    }
    for (const o of truth) if (o.method === 'M1' && o.injectedPriceEur < 250) injectedM1LowUnder250++;
    const r = dataset.recalculate({ selectionHash: 'FULL:EMPTY' });
    console.log(
      `[EX-DATA-19 D3] prix QUOTED < 250 € : ${under250}, dont drapeautés PRICE_SENTINEL_ABSOLUTE : ${under250Flagged} ; ` +
        `injectés M1_LOW < 250 € : ${injectedM1LowUnder250} ; min(V_price) publié = ${r.selectionStats.price.min} €`,
    );
    // Hypothèse de lecture (E4) : le drapeau est de la responsabilité du provider (étage ingestion) ; le
    // moteur applique EX-DATA-60 à la lettre. Sans drapeau, ces prix entrent dans V_price.
    expect(under250Flagged).toBeLessThanOrEqual(under250);
    if (under250Flagged < under250) expect(r.selectionStats.price.min as number).toBeLessThan(250);
  });

  it('EX-DATA-97 — les quatre indicateurs M3 calculés et publiés pour ≥ 3 cellules d’effectif > 200', () => {
    // À N = 100 000, aucune cellule MODÈLE (C₂) du dataset D3 ne dépasse 200 annonces : on prend les
    // trois plus grandes sélections MARQUE (cellule C₃ de la sélection élaguée), qui sont des cellules
    // d'homogénéité au sens d'EX-DATA-86.
    const largestModel = Math.max(...[...dataset.indexes.modelOffsets.values()].map((r) => r.end - r.start));
    console.log(`[M3] plus grande cellule modèle à N=${N} : ${largestModel} annonces (< 200)`);
    const cells = [...dataset.indexes.makeOffsets.entries()]
      .map(([makeId, r]) => ({ key: `make ${makeId}`, makeId, count: r.end - r.start }))
      .filter((c) => c.count > 200)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    expect(cells.length).toBe(3);
    for (const c of cells) {
      const r = dataset.recalculate({ selectionHash: `FULL:m3-${c.makeId}`, scope: { makeIds: [c.makeId] } });
      const m3 = r.m3;
      console.log(
        `[M3 cellule ${c.key}, n=${c.count}] |E|=${m3.evaluatedPopulation} precisionLow=${fmt(m3.precisionLow)} recallLow=${fmt(m3.recallLow)} kappa=${fmt(m3.kappa)} evalCoverage=${fmt(m3.evalCoverage)}`,
      );
      expect(m3.evaluatedPopulation).toBeGreaterThan(200);
      expect(m3.evalCoverage).not.toBeNull();
      expect(m3.precisionLow !== null || m3.recallLow !== null).toBe(true);
    }
  });
});

function fmt(x: number | null): string {
  return x === null ? 'null' : x.toFixed(3);
}
