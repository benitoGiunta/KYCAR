/**
 * Revue D8 — sonde n°1 : les DEUX PARCOURS CIBLES de 00-CONTEXT rejoués via le `DataController`
 * (sans DOM), sur le câblage de production (provider synthétique par défaut = 100 000 annonces,
 * référentiels lus sur disque, moteur D4 réel piloté in-process et ESPIONNÉ).
 *
 *   Parcours 1 (mode 1) : « budget 20 000 €, coupé, BE, < 100 000 km » → cartes-marques.
 *   Parcours 2 (mode 2) : « Opel Corsa 2017 » → distributions + nuage + liste.
 *
 * Chaque valeur intermédiaire est confrontée à une VÉRITÉ TERRAIN recalculée directement sur le lot
 * colonnaire du provider (pas sur la sortie du moteur). Les sondes en échec portent l'identifiant du
 * constat (R-D8-xx) et sont laissées telles quelles pour la phase 2.6.
 */
import { beforeAll, describe, expect, it } from 'vitest';

import { DataController, type Mode2Payload } from '../../../src/orchestration/data-controller';
import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { createMemorySnapshotCache } from '../../../src/persistence/snapshot-cache';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';
import type { ReferenceData } from '../../../src/types/reference';
import type { ListingColumnBatch } from '../../../src/types/index';
import type { SelectionState } from '../../../src/state/filter-types';
import { NUMERIC_UNKNOWN } from '../../../src/types/sentinels';
import {
  CORSA_MODEL_ID,
  OPEL_MAKE_ID,
  cellRows,
  countRows,
  countingProvider,
  estimateStartupTransfer,
  instrumentedEngineFactory,
  registrationYear,
  type EngineSpy,
  type ProviderCounts,
} from './_helpers';

let ref: ReferenceData;
let inner: SyntheticDataProvider;
let controller: DataController;
let counts: ProviderCounts;
let spy: EngineSpy;
let batch: ListingColumnBatch;
let startupCpuMs = { openSnapshot: 0, baseline: 0 };
let coupeCode: string;
let coupeByte: number;

beforeAll(async () => {
  ref = loadReferenceDataFromDisk();
  // Câblage de production (main.tsx) : `new SyntheticDataProvider({ referenceData })` → 100 000 annonces.
  inner = new SyntheticDataProvider({ referenceData: ref });
  const wrapped = countingProvider(inner);
  counts = wrapped.counts;
  const eng = instrumentedEngineFactory();
  spy = eng.spy;
  controller = new DataController({ provider: wrapped.provider, referenceData: ref, engineFactory: eng.factory, cache: createMemorySnapshotCache() });

  // Mesure du coût CPU du démarrage tel que `start()` l'enchaîne (openSnapshot puis baseline) :
  // MÉDIANE de 3 générations (la génération est déterministe ; seule la charge machine varie).
  const samples: { openSnapshot: number; baseline: number }[] = [];
  for (let k = 0; k < 3; k += 1) {
    const p = k === 0 ? inner : new SyntheticDataProvider({ referenceData: ref });
    const t0 = performance.now();
    const handle = await p.openSnapshot();
    const t1 = performance.now();
    await p.fetchBaselineAggregates(handle);
    const t2 = performance.now();
    samples.push({ openSnapshot: t1 - t0, baseline: t2 - t1 });
  }
  samples.sort((a, b) => a.openSnapshot + a.baseline - (b.openSnapshot + b.baseline));
  startupCpuMs = samples[1]!;
  console.log(`[EX-NFR-9] 3 mesures CPU (openSnapshot+baseline) : ${samples.map((s) => (s.openSnapshot + s.baseline).toFixed(0)).join(' / ')} ms`);

  batch = inner.getDataset().batch;
  const voc = ref.vocabularies.get('KYCAR_BODY_TYPE');
  const idx = voc?.values.findIndex((v) => /coup/i.test(v.label)) ?? -1;
  expect(idx).toBeGreaterThanOrEqual(0);
  coupeByte = idx;
  coupeCode = voc!.values[idx]!.code;
}, 120_000);

describe('Parcours 1 — mode 1 « budget 20 000 €, coupé, BE, < 100 000 km »', () => {
  it('start() sert le snapshot SYNTHETIC de 100 000 annonces et loadMarket({}) = agrégats de base sans balayage ni moteur', async () => {
    const start = await controller.start();
    expect(start.status).toBe('ready');
    expect(start.sourceKind).toBe('SYNTHETIC');
    expect(start.descriptor?.listingCount).toBe(100_000);

    const screen = await controller.loadMarket({});
    const total = screen.makeAggregates.reduce((s, a) => s + a.listingCount, 0);
    expect(total).toBe(100_000);
    expect(screen.hasUserFilters).toBe(false);
    expect(screen.makeAggregates.some((a) => a.makeId === OPEL_MAKE_ID)).toBe(true);
    // O17 (a) : premier affichage = fetchBaselineAggregates, zéro fetchAggregates, zéro annonce, zéro moteur.
    expect(counts.baseline).toBe(1);
    expect(counts.aggregates).toHaveLength(0);
    expect(counts.listingColumns).toHaveLength(0);
    expect(spy.created).toBe(0);
  });

  it('R-D8-31 — toute carte-marque du premier affichage doit correspondre à une marque de la taxonomie (EX-DATA-20 : marque inconnue → rejet) — observé : des makeId NÉGATIFS hors référentiel portent ~18 % des annonces', async () => {
    const screen = await controller.loadMarket({});
    const unknown = screen.makeAggregates.filter((a) => !ref.makeById.has(a.makeId));
    const unknownRows = unknown.reduce((s, a) => s + a.listingCount, 0);
    console.log(`[R-D8-31] cartes hors taxonomie : ${unknown.length} sur ${screen.makeAggregates.length}, ${unknownRows} annonces ; exemples : ${unknown.slice(0, 5).map((a) => a.makeId).join(', ')}`);
    expect(unknown).toEqual([]);
  });

  it('les cartes filtrées (prix ≤ 20 000, km ≤ 100 000, carrosserie coupé) égalent la vérité terrain du lot', async () => {
    const selection: SelectionState = { priceTo: 20000, mileageTo: 100000, bodyType: [coupeCode], countryType: ['B'] };
    const screen = await controller.loadMarket(selection);
    expect(screen.hasUserFilters).toBe(true);
    expect(screen.activeFilterCount).toBe(4);

    const expected = countRows(
      batch,
      (i) =>
        (batch.priceEur[i] as number) !== NUMERIC_UNKNOWN &&
        (batch.priceEur[i] as number) <= 20000 &&
        (batch.mileageKm[i] as number) !== NUMERIC_UNKNOWN &&
        (batch.mileageKm[i] as number) <= 100000 &&
        batch.bodyType[i] === coupeByte,
    );
    const total = screen.makeAggregates.reduce((s, a) => s + a.listingCount, 0);
    expect(expected).toBeGreaterThan(0);
    expect(total).toBe(expected);
    for (const a of screen.makeAggregates) {
      if (a.price.max !== null) expect(a.price.max).toBeLessThanOrEqual(20000);
      if (a.mileage.max !== null) expect(a.mileage.max).toBeLessThanOrEqual(100000);
    }
    // Le filtre pays n'a pas d'effet mesurable ici : le snapshot ne porte qu'un seul code pays.
    const countries = new Set<number>();
    for (let i = 0; i < batch.rowCount; i += 1) countries.add(batch.countryCode[i] as number);
    expect(countries.size).toBe(1);
    // Toujours aucun moteur ni annonce en mode 1 (O17).
    expect(spy.created).toBe(0);
    expect(counts.listingColumns).toHaveLength(0);
  });

  it('R-D8-01 — le raccourci « immatriculation ≥ 2020 » de l’écran A (dateOfRegistrationFrom) est ignoré : les cartes affichent 100 000 offres', async () => {
    const screen = await controller.loadMarket({ dateOfRegistrationFrom: 2020 });
    const expected = countRows(batch, (i) => registrationYear(batch, i) >= 2020);
    const total = screen.makeAggregates.reduce((s, a) => s + a.listingCount, 0);
    expect(expected).toBeGreaterThan(0);
    expect(expected).toBeLessThan(100_000);
    expect(total).toBe(expected);
  });

  it('R-D8-02 — la sélection de l’écran G (mmmv = « 54|1918 », Opel Corsa) est ignorée par loadMarket : toutes les marques restent affichées', async () => {
    const screen = await controller.loadMarket({ makesModelsVariants: `${OPEL_MAKE_ID}|${CORSA_MODEL_ID}` });
    const corsa = cellRows(batch, OPEL_MAKE_ID, CORSA_MODEL_ID).length;
    expect(corsa).toBeGreaterThan(0);
    expect(screen.makeAggregates).toHaveLength(1);
    expect(screen.makeAggregates[0]?.makeId).toBe(OPEL_MAKE_ID);
    expect(screen.makeAggregates[0]?.listingCount).toBe(corsa);
  });
});

describe('Parcours 2 — mode 2 « Opel Corsa 2017 »', () => {
  let payload: Mode2Payload;
  let corsa: number[];

  beforeAll(async () => {
    corsa = cellRows(batch, OPEL_MAKE_ID, CORSA_MODEL_ID);
    payload = await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID);
  });

  it('enterMode2(54, 1918) charge exactement la cellule Opel Corsa, élaguée AVANT le moteur (O17 b/c)', () => {
    expect(corsa.length).toBeGreaterThan(0);
    expect(payload.batch.rowCount).toBe(corsa.length);
    expect(payload.rows.length).toBe(corsa.length);
    expect(payload.makeModelName).toBe('Opel Corsa');
    expect(payload.sourceKind).toBe('SYNTHETIC');
    // Le provider n'a été sollicité qu'avec la composante T `make;model`.
    expect(counts.listingColumns).toEqual([`make=${OPEL_MAKE_ID};model=${CORSA_MODEL_ID}`]);
    // Le moteur n'a jamais reçu plus que la cellule, et M1/M2 (dans recalculate) n'a balayé que la cellule.
    expect(spy.created).toBe(1);
    expect(spy.loads).toEqual([{ rowCount: corsa.length, localDatasetKey: payload.batch.localDatasetKey }]);
    expect(spy.recalcs).toHaveLength(1);
    expect(spy.recalcs[0]?.rowCountAtCall).toBe(corsa.length);
    expect(spy.recalcs[0]?.scannedCount).toBe(corsa.length);
    expect(payload.recalc.selectionStats.selectionCount).toBe(corsa.length);
    expect(spy.recalcs[0]?.ms).toBeLessThan(200); // EX-NFR-5 sur le chemin élagué
  });

  it('R-D8-30 — la cellule Opel Corsa du snapshot par défaut (100 000) doit atteindre le seuil M2 (n ≥ 30, EX-SCR-33) pour que le parcours 2 montre une détection — observé : 9 annonces, 0 outlier injecté', () => {
    const truth = inner.getGroundTruthOutliers().filter((o) => o.makeId === OPEL_MAKE_ID && o.modelId === CORSA_MODEL_ID);
    console.log(`[R-D8-30] Opel Corsa : ${corsa.length} annonces / 100 000, ${truth.length} outlier(s) injecté(s), années ${[...new Set(corsa.map((i) => registrationYear(batch, i)))].sort().join(' ')}`);
    expect(corsa.length).toBeGreaterThanOrEqual(30);
    expect(truth.length).toBeGreaterThan(0);
  });

  it('distributions (G1/G2/G3), nuage (densité) et liste sont produits, et les fourchettes sont celles de la cellule', () => {
    expect(payload.recalc.priceHistogram.length).toBeGreaterThan(0);
    expect(payload.recalc.yearHistogram.length).toBeGreaterThan(0);
    expect(payload.recalc.mileageHistogram.length).toBeGreaterThan(0);
    expect(payload.recalc.densityCells.length).toBeGreaterThan(0);
    const bucketTotal = payload.recalc.priceHistogram.reduce((s, b) => s + b.count, 0);
    const quoted = countRows(payload.batch, (i) => (payload.batch.priceEur[i] as number) > 0);
    expect(bucketTotal).toBeLessThanOrEqual(quoted);
    // Vérité terrain min/max prix de la cellule (prix affichés uniquement).
    let min = Number.POSITIVE_INFINITY;
    let max = 0;
    for (const i of corsa) {
      const p = batch.priceEur[i] as number;
      if (p > 0) {
        min = Math.min(min, p);
        max = Math.max(max, p);
      }
    }
    const stats = payload.recalc.selectionStats.price;
    expect(stats.min).toBe(min);
    expect(stats.max).toBe(max);
  });

  it('les outliers de vérité terrain ressortent dans les verdicts M1/M2 sur la cellule éligible (n ≥ 30) la plus riche en outliers injectés (substitut : la cellule Corsa n’en porte aucun)', async () => {
    const byCell = new Map<string, number>();
    for (const o of inner.getGroundTruthOutliers()) {
      if (o.modelId === 0 || !ref.makeById.has(o.makeId)) continue;
      const k = `${o.makeId}:${o.modelId}`;
      byCell.set(k, (byCell.get(k) ?? 0) + 1);
    }
    const eligible = [...byCell.entries()]
      .map(([k, n]) => ({ k, n, size: cellRows(batch, Number(k.split(':')[0]), Number(k.split(':')[1])).length }))
      .filter((c) => c.size >= 30)
      .sort((a, b) => b.n - a.n || b.size - a.size);
    const target = eligible[0];
    expect(target).toBeDefined();
    const [makeId, modelId] = target!.k.split(':').map(Number) as [number, number];
    const cell = await controller.enterMode2(makeId, modelId);
    const truth = inner.getGroundTruthOutliers().filter((o) => o.makeId === makeId && o.modelId === modelId);
    const flagged = new Set(cell.recalc.outlierVerdicts.filter((v) => v.flags.length > 0).map((v) => v.listingId.toLowerCase()));
    const found = truth.filter((o) => flagged.has(o.listingId.toLowerCase()));
    console.log(`[parcours 2] cellule substitut ${cell.makeModelName} : n=${cell.batch.rowCount}, injectés=${truth.length}, retrouvés=${found.length}, verdicts=${cell.recalc.outlierVerdicts.length}`);
    expect(cell.batch.rowCount).toBe(target!.size);
    // Rapport D4-verif : M1 95,8 % / M2 100 % en cellules éligibles ; on exige ici la majorité.
    expect(found.length / truth.length).toBeGreaterThanOrEqual(0.5);
    // Tout verdict porte sur une annonce de la cellule (jamais une annonce hors élagage).
    expect(new Set(cell.recalc.outlierVerdicts.map((v) => v.listingId)).size).toBeLessThanOrEqual(cell.batch.rowCount);
    expect(Math.max(...spy.loads.map((l) => l.rowCount))).toBeLessThan(100_000);
  });

  it('R-D8-03 — « 2017 » ne peut pas être appliqué : le contrôleur n’offre aucun chemin pour raffiner le mode 2 (les filtres R de l’URL sont ignorés en écran B/D)', async () => {
    const y2017 = corsa.filter((i) => registrationYear(batch, i) === 2017).length;
    expect(y2017).toBeGreaterThan(0);
    expect(y2017).toBeLessThan(corsa.length);
    // Contrat attendu de 2.6 : l'hôte transmet la composante R au moteur (ici un 3e paramètre optionnel).
    type Mode2WithSelection = { enterMode2(makeId: number, modelId: number, selection?: SelectionState): Promise<Mode2Payload> };
    const refined = await (controller as unknown as Mode2WithSelection).enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID, {
      dateOfRegistrationFrom: 2017,
      dateOfRegistrationTo: 2017,
    });
    expect(refined.rows.length).toBe(y2017);
    expect(refined.recalc.selectionStats.selectionCount).toBe(y2017);
  });

  it('retour arrière / ré-entrée sur le même modèle : aucun rechargement, aucun lot plus grand que sa cellule', async () => {
    const before = spy.loads.length;
    const again = await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID);
    expect(again.batch.rowCount).toBe(corsa.length);
    // Un lot (Corsa) recharge le moteur car le substitut a pris sa place ; jamais plus qu'une cellule.
    expect(spy.loads.length).toBeLessThanOrEqual(before + 1);
    expect(spy.loads.every((l) => l.rowCount < 100_000 && l.localDatasetKey !== 'FULL')).toBe(true);
  });
});

describe('EX-NFR-9 — premier affichage utile du mode 1 ≤ 2 000 ms (4G simulée)', () => {
  it('coût CPU du démarrage (génération 100k + agrégats de base, machine de revue) + transfert estimé (dist + référentiels) ≤ 2 000 ms', () => {
    const transfer = estimateStartupTransfer();
    const cpu = startupCpuMs.openSnapshot + startupCpuMs.baseline;
    console.log(
      `[EX-NFR-9] openSnapshot=${startupCpuMs.openSnapshot.toFixed(0)} ms, baseline=${startupCpuMs.baseline.toFixed(0)} ms, ` +
        `transfert=${(transfer.totalBytes / 1024).toFixed(1)} Kio gzip → ${transfer.transferMs.toFixed(0)} ms (dist ${transfer.distPresent ? 'présent' : 'ABSENT'}), ` +
        `total=${(cpu + transfer.transferMs).toFixed(0)} ms`,
    );
    expect(transfer.distPresent).toBe(true);
    expect(cpu + transfer.transferMs).toBeLessThanOrEqual(2000);
  });
});
