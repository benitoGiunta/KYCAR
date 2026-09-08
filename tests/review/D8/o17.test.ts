/**
 * Revue D8 — sonde n°2 : PREUVE DE CÂBLAGE O17 (EX-NFR-5).
 *
 * À prouver par exécution (EXECUTION-LOG § O17) :
 *   (a) le premier affichage mode 1 est servi par `fetchBaselineAggregates` précalculé, sans balayage ;
 *   (b) M1/M2 (exécutés dans `AggregationDataset.recalculate`) ne sont JAMAIS invoqués avant
 *       `enterMode2(make, model)` — donc jamais en mode 1, quels que soient les filtres R posés ;
 *   (c) après `enterMode2`, la sélection passée au moteur est élaguée (taille ≤ effectif de la cellule).
 * Puis recherche ACTIVE de chemins résiduels : filtre R en mode 1, dépliage d'une carte, écran C
 * (deux modèles), URL entrée directement en `/marche/...`, clé réservée `modelId = 0` (ADV-14),
 * ré-entrée (retour arrière), rechargement du snapshot (`Rafraîchir`).
 *
 * Instrument : `instrumentedEngineFactory()` (client moteur espionné) + `countingProvider()`.
 * Dataset : 20 000 annonces (la preuve est structurelle — tailles de lots —, pas une mesure de perf).
 */
import { beforeAll, describe, expect, it } from 'vitest';

import { DataController } from '../../../src/orchestration/data-controller';
import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { createMemorySnapshotCache } from '../../../src/persistence/snapshot-cache';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';
import type { ReferenceData } from '../../../src/types/reference';
import type { ListingColumnBatch } from '../../../src/types/index';
import { CORSA_MODEL_ID, OPEL_MAKE_ID, cellRows, countingProvider, instrumentedEngineFactory } from './_helpers';

const N = 20_000;
let ref: ReferenceData;
let batch: ListingColumnBatch;
let inner: SyntheticDataProvider;

function build(): { controller: DataController; counts: ReturnType<typeof countingProvider>['counts']; spy: ReturnType<typeof instrumentedEngineFactory>['spy'] } {
  const { provider, counts } = countingProvider(inner);
  const { factory, spy } = instrumentedEngineFactory();
  const controller = new DataController({ provider, referenceData: ref, engineFactory: factory, cache: createMemorySnapshotCache() });
  return { controller, counts, spy };
}

beforeAll(async () => {
  ref = loadReferenceDataFromDisk();
  inner = new SyntheticDataProvider({ referenceData: ref, listingCount: N, seed: 17 });
  await inner.openSnapshot();
  batch = inner.getDataset().batch;
});

describe('O17 (a) — premier affichage mode 1 = agrégats de base précalculés, zéro balayage moteur', () => {
  it('start() + loadMarket({}) : 1 fetchBaselineAggregates, 0 fetchAggregates, 0 fetchListingColumns, moteur jamais instancié', async () => {
    const { controller, counts, spy } = build();
    await controller.start();
    const screen = await controller.loadMarket({});
    expect(screen.makeAggregates.reduce((s, a) => s + a.listingCount, 0)).toBe(N);
    expect(counts.baseline).toBe(1);
    expect(counts.aggregates).toHaveLength(0);
    expect(counts.listingColumns).toHaveLength(0);
    expect(spy.created).toBe(0);
    controller.dispose();
  });

  it('loadMarket({}) appelé 3 fois : la baseline est servie depuis la mémoire du contrôleur (pas de nouvel appel provider)', async () => {
    const { controller, counts } = build();
    await controller.start();
    await controller.loadMarket({});
    await controller.loadMarket({});
    await controller.loadMarket({});
    expect(counts.baseline).toBe(1);
    expect(counts.aggregates).toHaveLength(0);
    controller.dispose();
  });
});

describe('O17 (b) — M1/M2 jamais invoqués avant enterMode2', () => {
  it('filtres R en mode 1 (3 changements), dépliage de carte, écran C (2 modèles) : moteur toujours à zéro', async () => {
    const { controller, counts, spy } = build();
    await controller.start();
    await controller.loadMarket({ priceTo: 15000 });
    await controller.loadMarket({ priceTo: 15000, mileageTo: 80000 });
    await controller.loadMarket({ mileageTo: 80000 });
    await controller.loadModelsForMake({ mileageTo: 80000 }, OPEL_MAKE_ID); // EX-SCR-132, dépliage
    // Écran C : app.tsx résout chaque colonne par loadModelsForMake({}, makeId) — agrégats provider.
    await controller.loadModelsForMake({}, OPEL_MAKE_ID);
    await controller.loadModelsForMake({}, 9);
    expect(counts.aggregates.map((a) => a.level)).toEqual(['MAKE', 'MAKE', 'MAKE', 'MODEL', 'MODEL', 'MODEL']);
    expect(counts.listingColumns).toHaveLength(0);
    expect(spy.created).toBe(0);
    expect(spy.recalcs).toHaveLength(0);
    controller.dispose();
  });
});

describe('O17 (c) — après enterMode2, le moteur ne voit que la cellule', () => {
  it('enterMode2(Opel, Corsa) : lot chargé = cellule, recalcul balayant = cellule, jamais le snapshot', async () => {
    const { controller, counts, spy } = build();
    await controller.start();
    const cell = cellRows(batch, OPEL_MAKE_ID, CORSA_MODEL_ID).length;
    const payload = await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID);
    expect(cell).toBeGreaterThan(0);
    expect(counts.listingColumns).toEqual([`make=${OPEL_MAKE_ID};model=${CORSA_MODEL_ID}`]);
    expect(spy.loads).toEqual([{ rowCount: cell, localDatasetKey: payload.batch.localDatasetKey }]);
    expect(payload.batch.localDatasetKey).not.toBe('FULL');
    expect(spy.recalcs).toHaveLength(1);
    expect(spy.recalcs[0]?.rowCountAtCall).toBe(cell);
    expect(spy.recalcs[0]?.scannedCount).toBe(cell);
    expect(spy.recalcs[0]?.selection.selectionHash).toBe(`${payload.batch.localDatasetKey}:EMPTY`);
    controller.dispose();
  });

  it('chemin résiduel « URL entrée directement en /marche/54-opel/1918-corsa » (aucun loadMarket préalable) : même élagage', async () => {
    const { controller, counts, spy } = build();
    await controller.start();
    const cell = cellRows(batch, OPEL_MAKE_ID, CORSA_MODEL_ID).length;
    await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID);
    expect(counts.aggregates).toHaveLength(0);
    expect(spy.loads.map((l) => l.rowCount)).toEqual([cell]);
    controller.dispose();
  });

  it('chemin résiduel « clé réservée modelId = 0 » (ADV-14 / ARB-59) : lot « Modèle non identifié » de la marque, jamais le snapshot', async () => {
    const { controller, counts, spy } = build();
    await controller.start();
    const cell = cellRows(batch, OPEL_MAKE_ID, 0).length;
    const makeTotal = batch.makeId.reduce<number>((s, m) => s + (m === OPEL_MAKE_ID ? 1 : 0), 0);
    const payload = await controller.enterMode2(OPEL_MAKE_ID, 0);
    expect(counts.listingColumns).toEqual([`make=${OPEL_MAKE_ID};model=0`]);
    expect(payload.batch.rowCount).toBe(cell);
    expect(payload.batch.rowCount).toBeLessThanOrEqual(makeTotal);
    expect(payload.makeModelName).toBe('Opel Modèle non identifié');
    expect(spy.loads.map((l) => l.rowCount)).toEqual([cell]);
    controller.dispose();
  });

  it('chemin résiduel « retour arrière / changement de modèle / re-entrée » : chaque lot ≤ sa cellule, aucun lot FULL', async () => {
    const { controller, spy } = build();
    await controller.start();
    const corsa = cellRows(batch, OPEL_MAKE_ID, CORSA_MODEL_ID).length;
    const astra = cellRows(batch, OPEL_MAKE_ID, 1916).length;
    await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID);
    await controller.enterMode2(OPEL_MAKE_ID, 1916);
    await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID); // retour arrière
    expect(spy.loads.map((l) => l.rowCount)).toEqual([corsa, astra, corsa]);
    expect(spy.loads.every((l) => l.localDatasetKey !== 'FULL')).toBe(true);
    for (const r of spy.recalcs) expect(r.scannedCount).toBeLessThanOrEqual(r.rowCountAtCall);
    expect(Math.max(...spy.loads.map((l) => l.rowCount))).toBeLessThan(N);
    controller.dispose();
  });

  it('chemin résiduel « Rafraîchir » (start() rejoué après un mode 2) : la baseline reste précalculée, le moteur n’est pas relancé', async () => {
    const { controller, counts, spy } = build();
    await controller.start();
    await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID);
    const before = spy.recalcs.length;
    await controller.start(); // onReload de FilterBand → controller.start()
    await controller.loadMarket({});
    expect(counts.baseline).toBe(2);
    expect(spy.recalcs).toHaveLength(before);
    controller.dispose();
  });
});

describe('O17 — invariant global de la campagne', () => {
  it('sur tous les scénarios ci-dessus rejoués d’un trait : max(lot moteur) = max(cellule) < N ; tout recalcul balaye ≤ son lot', async () => {
    const { controller, spy } = build();
    await controller.start();
    await controller.loadMarket({});
    await controller.loadMarket({ priceTo: 15000 });
    await controller.loadModelsForMake({}, OPEL_MAKE_ID);
    const cells = [
      cellRows(batch, OPEL_MAKE_ID, CORSA_MODEL_ID).length,
      cellRows(batch, OPEL_MAKE_ID, 1916).length,
      cellRows(batch, OPEL_MAKE_ID, 0).length,
    ];
    await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID);
    await controller.enterMode2(OPEL_MAKE_ID, 1916);
    await controller.enterMode2(OPEL_MAKE_ID, 0);
    expect(Math.max(...spy.loads.map((l) => l.rowCount))).toBe(Math.max(...cells));
    expect(Math.max(...spy.loads.map((l) => l.rowCount))).toBeLessThan(N);
    expect(spy.recalcs.every((r) => r.scannedCount <= r.rowCountAtCall)).toBe(true);
    controller.dispose();
  });
});
