import { describe, expect, it, vi } from 'vitest';
import { scanForbiddenFields } from '../../types/validation';
import { servesMode2, type DataProvider } from '../DataProvider';
import { TweedehandsDataProvider } from './TweedehandsDataProvider';
import type { TweedehandsFetcher, TweedehandsSearchRequest } from './fetcher';
import type { RawSearchResponse } from './nextData';
import { buildFixtureHtml, loadRealReferenceData, makeRawListing } from './testFixtures';

const referenceData = loadRealReferenceData();

/**
 * Fixture locale complète : deux marques réelles (Opel=54, Volkswagen=74), deux modèles chacune.
 * Chaque combinaison marque(/modèle) a sa PROPRE réponse `__NEXT_DATA__` invent 'ee, de forme
 * fidèle à `probe-LOT-N.md` — jamais de donnée 2dehands réelle copiée.
 */
const FIXTURE_RESPONSES: Record<string, RawSearchResponse> = {
  // Racine (toutes marques) — non utilisée par ce provider (une requête par marque), gardée pour
  // couvrir le cas où aucun brandSlug n'est fourni (fetchSelectionCount sans filtre make).
  'root': {
    totalResultCount: 100188,
    listings: [
      makeRawListing({ itemId: 'root-1', brand: 'Opel', model: 'Corsa', priceCents: 1000000, mileage: '50000 km', constructionYear: '2018', advertiser: 'Particulier' }),
    ],
  },
  'opel': {
    totalResultCount: 5220,
    listings: [
      makeRawListing({ itemId: 'opel-1', brand: 'Opel', model: 'Corsa', priceCents: 1200000, mileage: '60000 km', constructionYear: '2019', fuel: 'Benzine', advertiser: 'Particulier' }),
      makeRawListing({ itemId: 'opel-2', brand: 'Opel', model: 'Astra', priceCents: 1500000, mileage: '40000 km', constructionYear: '2020', fuel: 'Diesel', advertiser: 'Bedrijf' }),
    ],
  },
  'opel/corsa': {
    totalResultCount: 1281,
    listings: [
      makeRawListing({ itemId: 'opel-corsa-1', brand: 'Opel', model: 'Corsa', priceCents: 1200000, mileage: '60000 km', constructionYear: '2019', advertiser: 'Particulier' }),
      makeRawListing({ itemId: 'opel-corsa-2', brand: 'Opel', model: 'Corsa', priceCents: 900000, mileage: '90000 km', constructionYear: '2016', advertiser: 'Particulier' }),
    ],
  },
  'opel/astra': {
    totalResultCount: 980,
    listings: [
      makeRawListing({ itemId: 'opel-astra-1', brand: 'Opel', model: 'Astra', priceCents: 1500000, mileage: '40000 km', constructionYear: '2020', advertiser: 'Bedrijf' }),
    ],
  },
  'volkswagen': {
    totalResultCount: 8100,
    listings: [
      makeRawListing({ itemId: 'vw-1', brand: 'Volkswagen', model: 'Golf', priceCents: 1800000, mileage: '30000 km', constructionYear: '2021', advertiser: 'Particulier' }),
    ],
  },
};

/** Clé de fixture pour une requête donnée (marque/modèle, ou 'root' si aucun). */
function fixtureKeyOf(request: TweedehandsSearchRequest): string {
  if (request.brandSlug === undefined) return 'root';
  return request.modelSlug === undefined ? request.brandSlug : `${request.brandSlug}/${request.modelSlug}`;
}

/**
 * Faux fetcher : ne fait AUCUNE I/O, rejoue les fixtures ci-dessus. `fetchCalls` compte les
 * invocations pour prouver l'« un aller réseau par appel » de `Mode1Source.AGGREGATE_SURFACE» sans
 * jamais toucher au réseau. Aucun test de ce fichier n'importe ni n'appelle
 * `createHttpTweedehandsFetcher` : zéro appel réseau live, garanti par construction.
 */
function createFakeFetcher(): TweedehandsFetcher & { readonly calls: TweedehandsSearchRequest[] } {
  const calls: TweedehandsSearchRequest[] = [];
  return {
    calls,
    fetchSearchPage(request: TweedehandsSearchRequest): Promise<string> {
      calls.push(request);
      const key = fixtureKeyOf(request);
      const response = FIXTURE_RESPONSES[key];
      if (response === undefined) {
        return Promise.resolve(buildFixtureHtml({ totalResultCount: 0, listings: [] }));
      }
      return Promise.resolve(buildFixtureHtml(response));
    },
  };
}

// Univers de marques restreint aux deux marques de la fixture (politique opérationnelle légitime,
// cf. TweedehandsDataProviderOptions.makeUniverse) — évite 295 appels fetch fictifs par test.
const MAKE_UNIVERSE = [
  { makeId: 54, slug: 'opel' },
  { makeId: 74, slug: 'volkswagen' },
];

function createProvider(): { provider: TweedehandsDataProvider; fetcher: ReturnType<typeof createFakeFetcher> } {
  const fetcher = createFakeFetcher();
  const provider = new TweedehandsDataProvider({
    referenceData,
    marketplace: 'be',
    fetcher,
    makeUniverse: MAKE_UNIVERSE,
  });
  return { provider, fetcher };
}

describe('TweedehandsDataProvider — describe() / servesMode2()', () => {
  it('déclare sourceKind REAL, mode1.source AGGREGATE_SURFACE, mode2 UNAVAILABLE(BIASED_SAMPLE, fallback SYNTHETIC)', () => {
    const { provider } = createProvider();
    const caps = provider.describe();
    expect(caps.sourceKind).toBe('REAL');
    expect(caps.mode1.source).toBe('AGGREGATE_SURFACE');
    expect(caps.mode2.kind).toBe('UNAVAILABLE');
    if (caps.mode2.kind === 'UNAVAILABLE') {
      expect(caps.mode2.reason).toBe('BIASED_SAMPLE');
      expect(caps.mode2.fallback).toBe('SYNTHETIC');
      expect(caps.mode2.detail.length).toBeGreaterThan(0);
    }
  });

  it('servesMode2() renvoie false, et fetchListingColumns/fetchListingsByIds sont absentes', () => {
    const { provider } = createProvider();
    const asProvider: DataProvider = provider;
    expect(servesMode2(provider)).toBe(false);
    expect(asProvider.fetchListingColumns).toBeUndefined();
    expect(asProvider.fetchListingsByIds).toBeUndefined();
  });
});

describe('TweedehandsDataProvider — mode 1 (agrégats)', () => {
  it('openSnapshot ouvre un snapshot REAL avec listingCount/announcedListingCount cohérents', async () => {
    const { provider } = createProvider();
    const handle = await provider.openSnapshot();
    expect(handle.descriptor.sourceKind).toBe('REAL');
    expect(handle.descriptor.marketplace).toBe('be');
    expect(handle.descriptor.announcedListingCount).toBe(100188); // totalResultCount de la racine
    expect(handle.descriptor.listingCount).toBeGreaterThan(0); // échantillon effectivement ingéré
    expect(handle.descriptor.coverageNote).toMatch(/exhaustifs/);
  });

  it('fetchBaselineAggregates construit une ligne MakeAggregate par marque, listingCount EXHAUSTIF', async () => {
    const { provider, fetcher } = createProvider();
    const handle = await provider.openSnapshot();
    const result = await provider.fetchBaselineAggregates(handle);

    expect(result.rows).toHaveLength(2);
    const opel = result.rows.find((r) => r.makeId === 54);
    const vw = result.rows.find((r) => r.makeId === 74);
    expect(opel?.listingCount).toBe(5220); // totalResultCount exhaustif, pas la taille de l'échantillon (2)
    expect(vw?.listingCount).toBe(8100);
    expect(opel?.price.n).toBe(2); // fourchette calculée sur l'échantillon de 2 annonces
    expect(opel?.sampleCoverage).toBeCloseTo(2 / 5220);

    // Un aller réseau par marque (Mode1Source.AGGREGATE_SURFACE) — jamais plus qu'espéré.
    expect(fetcher.calls.filter((c) => c.brandSlug !== undefined && c.modelSlug === undefined).length).toBeGreaterThanOrEqual(2);
  });

  it('fetchAggregates(level=MODEL, makeScope) construit une ligne ModelAggregate par modèle de la marque', async () => {
    const { provider } = createProvider();
    const handle = await provider.openSnapshot();
    const result = await provider.fetchAggregates(handle, 'FULL:EMPTY', 'MODEL', 54);

    const corsa = result.rows.find((r) => 'modelId' in r && r.modelId === 1918);
    const astra = result.rows.find((r) => 'modelId' in r && r.modelId === 1916);
    expect(corsa).toBeDefined();
    expect(astra).toBeDefined();
    if (corsa && 'listingCount' in corsa) expect(corsa.listingCount).toBe(1281);
    if (astra && 'listingCount' in astra) expect(astra.listingCount).toBe(980);
  });

  it('fetchAggregates(level=MAKE) avec sélection make=54 restreint à cette seule marque', async () => {
    const { provider, fetcher } = createProvider();
    const handle = await provider.openSnapshot();
    const before = fetcher.calls.length;
    const result = await provider.fetchAggregates(handle, 'make=54', 'MAKE');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.makeId).toBe(54);
    // Un seul appel réseau supplémentaire (une marque ciblée), pas un balayage des 2 marques.
    expect(fetcher.calls.length - before).toBe(1);
  });

  it('fetchSelectionCount retourne le totalResultCount exhaustif de la sélection', async () => {
    const { provider } = createProvider();
    const handle = await provider.openSnapshot();
    const count = await provider.fetchSelectionCount(handle, 'make=54');
    expect(count).toBe(5220);
  });

  it('closeSnapshot est idempotente', async () => {
    const { provider } = createProvider();
    const handle = await provider.openSnapshot();
    await expect(provider.closeSnapshot(handle)).resolves.toBeUndefined();
    await expect(provider.closeSnapshot(handle)).resolves.toBeUndefined();
  });
});

describe('TweedehandsDataProvider — garde R3 sur la sortie (P-1)', () => {
  it('aucun champ interdit dans SnapshotDescriptor ni dans les agrégats mode 1', async () => {
    const { provider } = createProvider();
    const handle = await provider.openSnapshot();
    expect(scanForbiddenFields(handle.descriptor)).toEqual([]);

    const baseline = await provider.fetchBaselineAggregates(handle);
    expect(scanForbiddenFields(baseline)).toEqual([]);

    const models = await provider.fetchAggregates(handle, 'FULL:EMPTY', 'MODEL', 54);
    expect(scanForbiddenFields(models)).toEqual([]);
  });
});

describe('TweedehandsDataProvider — aucun appel réseau live', () => {
  it('n’invoque jamais un fetch global non simulé (le double injecté ne fait aucune I/O)', async () => {
    const globalFetchSpy = vi.spyOn(globalThis, 'fetch' as never);
    const { provider } = createProvider();
    await provider.openSnapshot();
    expect(globalFetchSpy).not.toHaveBeenCalled();
    globalFetchSpy.mockRestore();
  });
});
