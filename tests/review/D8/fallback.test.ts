/**
 * Revue D8 — sonde n°3 : REPLI PROVIDER (EX-NFR-21 / 22 / 23) et bascule mode 2 (EX-DATA-107).
 *
 * Échecs simulés : rejet, délai dépassé (openSnapshot), délai dépassé (fetchBaselineAggregates),
 * données invalides, `servesMode2() = false` avec entrée en mode 2 (avec et sans repli synthétique),
 * cache présent / absent, délai dépassé sur fetchListingColumns.
 */
import { beforeAll, describe, expect, it } from 'vitest';

import { DataController, DEFAULT_RETRY_POLICY, type SnapshotCache } from '../../../src/orchestration/data-controller';
import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { createMemorySnapshotCache } from '../../../src/persistence/snapshot-cache';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';
import type { ReferenceData } from '../../../src/types/reference';
import type {
  AggregateResult,
  DataProvider,
  MakeAggregate,
  ProviderCapabilities,
  SnapshotHandle,
} from '../../../src/providers/DataProvider';
import { CORSA_MODEL_ID, OPEL_MAKE_ID, instrumentedEngineFactory } from './_helpers';

let ref: ReferenceData;
let synthetic: SyntheticDataProvider;
const noSleep = (): Promise<void> => Promise.resolve();
const FAST = { timeoutMs: 30, delaysMs: [0, 0, 0] } as const;

const realMode1Only: ProviderCapabilities = {
  providerId: 'review-mode1-only',
  providerVersion: 'test',
  marketplace: 'be',
  sourceKind: 'REAL',
  mode1: { source: 'AGGREGATE_SURFACE' },
  mode2: { kind: 'UNAVAILABLE', reason: 'BIASED_SAMPLE', fallback: 'SYNTHETIC', detail: 'revue D8' },
};

/** Provider REAL mode 1 seul, qui délègue mode 1 au synthétique (pour avoir un snapshot valide). */
function mode1OnlyProvider(): DataProvider {
  return {
    describe: () => realMode1Only,
    openSnapshot: (r) => synthetic.openSnapshot(r),
    closeSnapshot: (h) => synthetic.closeSnapshot(h),
    fetchBaselineAggregates: (h) => synthetic.fetchBaselineAggregates(h),
    fetchAggregates: (h, s, l, m) => synthetic.fetchAggregates(h, s, l, m),
    fetchSelectionCount: (h, s) => synthetic.fetchSelectionCount(h, s),
    // pas de fetchListingColumns : servesMode2() === false
  };
}

const never = <T>(): Promise<T> => new Promise<T>(() => undefined);
const settles = (p: Promise<unknown>, ms: number): Promise<boolean> =>
  Promise.race([p.then(() => true, () => true), new Promise<boolean>((r) => setTimeout(() => r(false), ms))]);

function newController(provider: DataProvider, extra: Partial<ConstructorParameters<typeof DataController>[0]> = {}): DataController {
  return new DataController({ provider, referenceData: ref, engineFactory: instrumentedEngineFactory().factory, retry: FAST, sleep: noSleep, ...extra });
}

beforeAll(() => {
  ref = loadReferenceDataFromDisk();
  synthetic = new SyntheticDataProvider({ referenceData: ref, listingCount: 3000, seed: 5 });
});

describe('EX-NFR-21 — 3 réessais, délai 5 000 ms', () => {
  it('la politique par défaut est bien 5 000 ms / 1 s, 2 s, 4 s', () => {
    expect(DEFAULT_RETRY_POLICY).toEqual({ timeoutMs: 5000, delaysMs: [1000, 2000, 4000] });
  });

  it('openSnapshot qui ne répond jamais : 4 tentatives (1 + 3), statut failed, code TIMEOUT explicite', async () => {
    let attempts = 0;
    const hanging: DataProvider = {
      describe: () => realMode1Only,
      openSnapshot: () => {
        attempts += 1;
        return never<SnapshotHandle>();
      },
      closeSnapshot: () => Promise.resolve(),
      fetchBaselineAggregates: () => never<AggregateResult<MakeAggregate>>(),
      fetchAggregates: () => never(),
      fetchSelectionCount: () => never(),
    };
    const result = await newController(hanging).start();
    expect(attempts).toBe(4);
    expect(result.status).toBe('failed');
    expect(result.errorCode).toBe('TIMEOUT_30MS');
    expect(result.hasCachedResult).toBe(false);
  });

  it('R-D8-05 — fetchBaselineAggregates qui ne répond jamais N’EST PAS couvert par le délai : start() ne se termine jamais', async () => {
    const hangingBaseline: DataProvider = {
      ...mode1OnlyProvider(),
      fetchBaselineAggregates: () => never<AggregateResult<MakeAggregate>>(),
    };
    const done = await settles(newController(hangingBaseline).start(), 400);
    expect(done).toBe(true);
  });

  it('R-D8-29 — fetchListingColumns qui ne répond jamais : enterMode2 ne se termine jamais (aucun délai ni réessai EX-NFR-21 en mode 2)', async () => {
    const hangingColumns: DataProvider = {
      describe: () => synthetic.describe(),
      openSnapshot: (r) => synthetic.openSnapshot(r),
      closeSnapshot: (h) => synthetic.closeSnapshot(h),
      fetchBaselineAggregates: (h) => synthetic.fetchBaselineAggregates(h),
      fetchAggregates: (h, s, l, m) => synthetic.fetchAggregates(h, s, l, m),
      fetchSelectionCount: (h, s) => synthetic.fetchSelectionCount(h, s),
      fetchListingColumns: () => never(),
    };
    const controller = newController(hangingColumns);
    await controller.start();
    const done = await settles(controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID), 400);
    expect(done).toBe(true);
  });
});

describe('EX-NFR-22 / 23 — repli sur cache, jamais un vide', () => {
  async function seededCache(): Promise<SnapshotCache> {
    const cache = createMemorySnapshotCache();
    const warm = new DataController({ provider: synthetic, referenceData: ref, engineFactory: instrumentedEngineFactory().factory, cache });
    await warm.start();
    warm.dispose();
    return cache;
  }
  const rejecting: DataProvider = {
    describe: () => realMode1Only,
    openSnapshot: () => Promise.reject(new Error('E-PROV-503')),
    closeSnapshot: () => Promise.resolve(),
    fetchBaselineAggregates: () => Promise.reject(new Error('E-PROV-503')),
    fetchAggregates: () => Promise.reject(new Error('E-PROV-503')),
    fetchSelectionCount: () => Promise.reject(new Error('E-PROV-503')),
  };

  it('avec cache : degraded-cache, descripteur et baseline servis depuis le cache, isDegraded = true', async () => {
    const controller = newController(rejecting, { cache: await seededCache() });
    const result = await controller.start();
    expect(result.status).toBe('degraded-cache');
    expect(result.errorCode).toBe('E-PROV-503');
    expect(controller.isDegraded).toBe(true);
    expect(result.descriptor?.sourceKind).toBe('SYNTHETIC');
    const screen = await controller.loadMarket({});
    expect(screen.makeAggregates.reduce((s, a) => s + a.listingCount, 0)).toBe(3000);
  });

  it('avec cache mais filtres posés : loadMarket ne peut pas servir un agrégat filtré depuis le cache → il retombe sur la baseline en la disant « sans filtre »', async () => {
    const controller = newController(rejecting, { cache: await seededCache() });
    await controller.start();
    const screen = await controller.loadMarket({ priceTo: 5000 });
    // Comportement observé : baseline complète renvoyée (3000) avec hasUserFilters = false alors que
    // activeFilterCount = 1 — consigné dans le rapport (l'écran A annonce un état « sans filtre »).
    expect(screen.makeAggregates.reduce((s, a) => s + a.listingCount, 0)).toBe(3000);
    expect(screen.activeFilterCount).toBe(1);
    expect(screen.hasUserFilters).toBe(false);
  });

  it('avec cache : enterMode2 échoue EXPLICITEMENT (jamais un vide) — le cache ne porte pas d’annonces', async () => {
    const controller = newController(rejecting, { cache: await seededCache() });
    await controller.start();
    await expect(controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID)).rejects.toThrow(/snapshot indisponible/);
  });

  it('sans cache : failed avec code, puis loadMarket rejette explicitement (jamais 0 marque)', async () => {
    const controller = newController(rejecting);
    const result = await controller.start();
    expect(result).toMatchObject({ status: 'failed', errorCode: 'E-PROV-503', hasCachedResult: false, descriptor: null });
    await expect(controller.loadMarket({})).rejects.toThrow(/aucun snapshot ni cache/);
  });

  it('données invalides (baseline sans tableau `rows`) : start() les accepte comme « ready », l’erreur n’éclate qu’au loadMarket (TypeError JS, pas un code E-PROV)', async () => {
    const invalid: DataProvider = {
      ...mode1OnlyProvider(),
      fetchBaselineAggregates: () => Promise.resolve({ snapshotId: 'x', selection: 'FULL:EMPTY', selectionCount: 3000, rows: undefined } as unknown as AggregateResult<MakeAggregate>),
    };
    const controller = newController(invalid);
    const result = await controller.start();
    expect(result.status).toBe('ready'); // observé : aucune validation structurelle de la réponse provider
    await expect(controller.loadMarket({})).rejects.toThrow(TypeError);
  });
});

describe('EX-DATA-107 — servesMode2() = false avec entrée en mode 2', () => {
  it('sans repli injecté : enterMode2 rejette avec un message explicite (pas de distribution vide)', async () => {
    const controller = newController(mode1OnlyProvider());
    const start = await controller.start();
    expect(start.sourceKind).toBe('REAL');
    await expect(controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID)).rejects.toThrow(/aucun provider ne sert le mode 2/);
  });

  it('avec repli synthétique injecté : le mode 2 est servi et étiqueté SYNTHETIC alors que le mode 1 est REAL', async () => {
    const controller = newController(mode1OnlyProvider(), { mode2Fallback: synthetic });
    const start = await controller.start();
    expect(start.sourceKind).toBe('REAL');
    const payload = await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID);
    expect(payload.sourceKind).toBe('SYNTHETIC');
    expect(payload.batch.rowCount).toBeGreaterThan(0);
    controller.dispose();
  });

  it('le repli est refusé s’il ne sert pas lui-même le mode 2 (double mode-1 seul)', async () => {
    const controller = newController(mode1OnlyProvider(), { mode2Fallback: mode1OnlyProvider() });
    await controller.start();
    await expect(controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID)).rejects.toThrow(/EX-DATA-107/);
  });
});
