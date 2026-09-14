/**
 * KYCAR — Tests d'intégration de bout en bout (lot D8) : les deux parcours cibles + le repli
 * =================================================================================================
 * Exercent l'HÔTE réel (`DataController`) câblé au provider synthétique (D3) et au moteur
 * d'agrégation piloté par le client IN-PROCESS (D8), avec les référentiels lus sur disque
 * (`loadReferenceDataFromDisk`, D8). Aucun mock du domaine : seul le transport (Worker, réseau,
 * IndexedDB) est remplacé par ses équivalents Node.
 *
 * Couvre les CRITÈRES DE SUCCÈS n°2 et n°5 de la mission :
 *   - Parcours 1 (mode 1)  : `start()` puis `loadMarket({})` → cartes-marques réelles.
 *   - Parcours 2 (mode 2)  : `enterMode2(make, model)` → `Mode2Payload` avec `recalc` (distributions
 *                            + verdicts d'outliers) sur un lot ÉLAGUÉ au couple (décision O17).
 *   - Repli (EX-NFR-22/23) : provider en échec → `degraded-cache` avec cache, `failed` sans, jamais
 *                            une exception muette ni un résultat vide.
 *   - EX-NFR-9             : le premier affichage mode 1 n'entraîne AUCUN chargement d'annonces
 *                            individuelles ; `fetchListingColumns` n'est appelé qu'à l'entrée mode 2.
 */

import { describe, expect, it, beforeAll } from 'vitest';

import { AggregationEngine } from '../engine/index';
import { loadReferenceDataFromDisk } from './reference-fs';
import { createInProcessEngineClient } from './engine-inprocess';
import { DataController } from './data-controller';
import { createMemorySnapshotCache } from '../persistence/snapshot-cache';
import { SyntheticDataProvider } from '../providers/synthetic/index';
import type { ReferenceData } from '../types/reference';
import type {
  AggregateResult,
  DataProvider,
  MakeAggregate,
  ProviderCapabilities,
  SnapshotHandle,
} from '../providers/DataProvider';

let referenceData: ReferenceData;

beforeAll(() => {
  referenceData = loadReferenceDataFromDisk();
});

/** Moteur de test : façade réelle pilotée par le client in-process (pas de Worker sous Node). */
function engineFactory(): AggregationEngine {
  return new AggregationEngine(createInProcessEngineClient());
}

function newController(provider: DataProvider): DataController {
  return new DataController({
    provider,
    referenceData,
    engineFactory,
    cache: createMemorySnapshotCache(),
  });
}

/** Enveloppe comptant les appels réseau lourds, pour prouver EX-NFR-9 (annonces hors chemin critique). */
function countingProvider(inner: DataProvider): { provider: DataProvider; counts: { listingColumns: number; baseline: number } } {
  const counts = { listingColumns: 0, baseline: 0 };
  const provider: DataProvider = {
    describe: () => inner.describe(),
    openSnapshot: (r) => inner.openSnapshot(r),
    closeSnapshot: (h) => inner.closeSnapshot(h),
    fetchBaselineAggregates: (h) => {
      counts.baseline += 1;
      return inner.fetchBaselineAggregates(h);
    },
    fetchAggregates: (h, s, l, m) => inner.fetchAggregates(h, s, l, m),
    fetchSelectionCount: (h, s) => inner.fetchSelectionCount(h, s),
    fetchListingColumns: inner.fetchListingColumns
      ? (h, t) => {
          counts.listingColumns += 1;
          return inner.fetchListingColumns!(h, t);
        }
      : undefined,
    fetchListingsByIds: inner.fetchListingsByIds ? (h, ids) => inner.fetchListingsByIds!(h, ids) : undefined,
  };
  return { provider, counts };
}

describe('Parcours 1 — mode 1 (survol du marché)', () => {
  it('start() réussit puis loadMarket({}) renvoie des cartes-marques réelles', async () => {
    const provider = new SyntheticDataProvider({ referenceData, listingCount: 6000, seed: 7 });
    const controller = newController(provider);

    const start = await controller.start();
    expect(start.status).toBe('ready');
    expect(start.sourceKind).toBe('SYNTHETIC');
    expect(start.descriptor).not.toBeNull();

    const screen = await controller.loadMarket({});
    expect(screen.makeAggregates.length).toBeGreaterThan(0);
    expect(screen.hasUserFilters).toBe(false);
    // Un agrégat-marque porte un effectif et une fourchette de prix (mode 1, pas d'annonce individuelle).
    const first = screen.makeAggregates[0]!;
    expect(first.listingCount).toBeGreaterThan(0);
    expect(first.makeId).toBeGreaterThan(0);
    expect(screen.snapshotListingCount).toBeGreaterThan(0);

    controller.dispose();
  });

  it('EX-NFR-9 : le premier affichage mode 1 ne charge AUCUNE annonce individuelle', async () => {
    const { provider, counts } = countingProvider(new SyntheticDataProvider({ referenceData, listingCount: 6000, seed: 7 }));
    const controller = newController(provider);

    await controller.start();
    await controller.loadMarket({});
    expect(counts.baseline).toBe(1); // agrégats de base précalculés, une fois
    expect(counts.listingColumns).toBe(0); // annonces jamais chargées sur le chemin critique

    controller.dispose();
  });
});

describe('Parcours 2 — mode 2 (distributions d’un modèle ciblé)', () => {
  it('enterMode2(make, model) renvoie un Mode2Payload avec recalc sur un lot élagué (O17)', async () => {
    const inner = new SyntheticDataProvider({ referenceData, listingCount: 6000, seed: 7 });
    const { provider, counts } = countingProvider(inner);
    const controller = newController(provider);

    await controller.start();
    const market = await controller.loadMarket({});
    // Choisit une marque réelle du snapshot (celle de plus fort effectif) sans deviner d'identifiant.
    const topMake = [...market.makeAggregates].sort((a, b) => b.listingCount - a.listingCount)[0]!;
    const models = await controller.loadModelsForMake({}, topMake.makeId);
    const realModel = models.find((m) => m.modelId !== 0 && m.listingCount > 0) ?? models[0]!;

    const payload = await controller.enterMode2(topMake.makeId, realModel.modelId);

    // Le lot est élagué AVANT tout M1/M2 : bien plus petit que le snapshot complet (O17).
    expect(payload.batch.rowCount).toBeGreaterThan(0);
    expect(payload.batch.rowCount).toBeLessThan(market.snapshotListingCount);
    expect(payload.rows.length).toBe(payload.batch.rowCount);
    expect(payload.sourceKind).toBe('SYNTHETIC');
    expect(payload.makeModelName.length).toBeGreaterThan(0);

    // recalc porte les distributions imposées et la détection d'outliers.
    expect(payload.recalc.priceHistogram.length).toBeGreaterThan(0);
    expect(payload.recalc.yearHistogram.length).toBeGreaterThan(0);
    expect(payload.recalc.mileageHistogram.length).toBeGreaterThan(0);
    expect(Array.isArray(payload.recalc.outlierVerdicts)).toBe(true);
    expect(payload.recalc.eligibleCount).toBeGreaterThanOrEqual(0);

    // EX-NFR-9 : les annonces individuelles n'ont été chargées qu'ICI, à l'entrée en mode 2.
    expect(counts.listingColumns).toBe(1);

    controller.dispose();
  });
});

describe('Repli — échec provider (EX-NFR-21/22/23)', () => {
  const failing: DataProvider = {
    describe: (): ProviderCapabilities => ({
      providerId: 'failing',
      providerVersion: 'test',
      marketplace: 'be',
      sourceKind: 'REAL',
      mode1: { source: 'AGGREGATE_SURFACE' },
      mode2: { kind: 'UNAVAILABLE', reason: 'FORBIDDEN_SURFACE', fallback: 'NONE', detail: 'test' },
    }),
    openSnapshot: (): Promise<SnapshotHandle> => Promise.reject(new Error('NETWORK_DOWN')),
    closeSnapshot: () => Promise.resolve(),
    fetchBaselineAggregates: (): Promise<AggregateResult<MakeAggregate>> => Promise.reject(new Error('NETWORK_DOWN')),
    fetchAggregates: () => Promise.reject(new Error('NETWORK_DOWN')),
    fetchSelectionCount: () => Promise.reject(new Error('NETWORK_DOWN')),
  };

  const noSleep = (): Promise<void> => Promise.resolve();

  it('sans cache : start() renvoie failed (jamais une exception muette ni un vide)', async () => {
    const controller = new DataController({ provider: failing, referenceData, engineFactory, sleep: noSleep });
    const result = await controller.start();
    expect(result.status).toBe('failed');
    expect(result.errorCode).toBeDefined();
    expect(result.hasCachedResult).toBe(false);
  });

  it('avec cache préchargé : start() renvoie degraded-cache et sert le dernier résultat connu', async () => {
    const seeded = await (async () => {
      // Amorce un cache à partir d'un vrai démarrage synthétique réussi.
      const good = new SyntheticDataProvider({ referenceData, listingCount: 2000, seed: 3 });
      const cache = createMemorySnapshotCache();
      const warm = new DataController({ provider: good, referenceData, engineFactory, cache });
      await warm.start();
      warm.dispose();
      return cache;
    })();

    const controller = new DataController({ provider: failing, referenceData, engineFactory, cache: seeded, sleep: noSleep });
    const result = await controller.start();
    expect(result.status).toBe('degraded-cache');
    expect(controller.isDegraded).toBe(true);
    expect(result.hasCachedResult).toBe(true);

    // L'UI peut toujours afficher un mode 1 dégradé (EX-NFR-23 : jamais une erreur présentée en vide).
    const screen = await controller.loadMarket({});
    expect(screen.makeAggregates.length).toBeGreaterThan(0);

    controller.dispose();
  });
});
