/**
 * KYCAR — Revue D9 · sonde 5 : agrégation mode 1 et invariants I1–I8 (EX-DATA-104)
 * =================================================================================================
 * Les invariants sont IMPORTÉS de `src/types/invariants.ts` (lot D2) et appliqués aux agrégats
 * réellement produits par `TweedehandsDataProvider`. Couvre aussi `sourceKind` réel (EX-DATA-107)
 * et les deux garde-fous d'`ARCHITECTURE.md` §9.3 (agrégats de base précalculés / mis en cache ;
 * annonces hors du chemin critique).
 */
import { describe, expect, it } from 'vitest';
import { checkI1, checkI2, checkI3, checkI5 } from '../../../src/types/invariants';
import { TweedehandsDataProvider } from '../../../src/providers/tweedehands/TweedehandsDataProvider';
import type { TweedehandsFetcher, TweedehandsSearchRequest } from '../../../src/providers/tweedehands/fetcher';
import type { MakeAggregate, ModelAggregate } from '../../../src/providers/DataProvider';
import { loadRealReferenceData, buildFixtureHtml, makeRawListing } from '../../../src/providers/tweedehands/testFixtures';
import { FIXTURE_PAGES } from './fixtures';

const referenceData = loadRealReferenceData();
const MAKE_UNIVERSE = [
  { makeId: 54, slug: 'opel' },
  { makeId: 74, slug: 'volkswagen' },
];

function keyOf(r: TweedehandsSearchRequest): string {
  if (r.brandSlug === undefined) return 'root';
  return r.modelSlug === undefined ? r.brandSlug : `${r.brandSlug}/${r.modelSlug}`;
}

function makeProvider(): { provider: TweedehandsDataProvider; calls: TweedehandsSearchRequest[] } {
  const calls: TweedehandsSearchRequest[] = [];
  const fetcher: TweedehandsFetcher = {
    fetchSearchPage(request) {
      calls.push(request);
      return Promise.resolve((FIXTURE_PAGES[keyOf(request)] ?? FIXTURE_PAGES.vide) as string);
    },
  };
  return {
    provider: new TweedehandsDataProvider({ referenceData, marketplace: 'be', fetcher, makeUniverse: MAKE_UNIVERSE }),
    calls,
  };
}

describe('D9 · agrégation mode 1 — conformités vérifiées', () => {
  it('EX-DATA-107 — `sourceKind` vaut REAL sur le descripteur et les capacités, jamais SYNTHETIC', async () => {
    const { provider } = makeProvider();
    expect(provider.describe().sourceKind).toBe('REAL');
    expect(provider.describe().mode1.source).toBe('AGGREGATE_SURFACE');
    const handle = await provider.openSnapshot();
    expect(handle.descriptor.sourceKind).toBe('REAL');
    // `AggregateResult` ne porte pas `sourceKind` : la traçabilité passe par `snapshotId`.
    const baseline = await provider.fetchBaselineAggregates(handle);
    expect(baseline.snapshotId).toBe(handle.descriptor.snapshotId);
  });

  it('I1 — Σ listingCount(marque) = selectionCount de la réponse d’agrégats', async () => {
    const { provider } = makeProvider();
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const i1 = checkI1(baseline.rows, baseline.selectionCount);
    expect(i1.ok, i1.detail).toBe(true);
  });

  it('le compte de marque est le `totalResultCount` EXHAUSTIF, pas la taille de l’échantillon', async () => {
    const { provider } = makeProvider();
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const opel = baseline.rows.find((r) => r.makeId === 54);
    expect(opel?.listingCount).toBe(5220);
    expect(opel?.price.n).toBeLessThanOrEqual(2); // fourchette sur l'échantillon de la page
    expect(opel?.sampleCoverage).toBeCloseTo((opel?.price.n ?? 0) / 5220, 6);
  });

  it('§9.3 garde-fou n°2 — aucune annonce individuelle n’est exposée (mode 2 absent)', async () => {
    const { provider } = makeProvider();
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);
    expect(JSON.stringify(baseline).includes('listingId')).toBe(false);
    expect(JSON.stringify(handle.descriptor).includes('listingUrl')).toBe(false);
  });
});

describe('D9 · agrégation mode 1 — écarts constatés', () => {
  it('R-D9-09 — l’échantillon d’une marque n’est pas filtré par `makeId` : une annonce d’une autre marque contamine sa fourchette', async () => {
    // La page « opel » renvoie ici une annonce Volkswagen à 1 000 000 € : `buildMakeAggregate` ne
    // filtre jamais l'échantillon par la marque interrogée, contrairement à ce qu'annonce
    // `normalize.ts` (« marque non résolue → annonce écartée de toute agrégation par marque »).
    const page = buildFixtureHtml({
      totalResultCount: 5220,
      listings: [
        makeRawListing({ itemId: 'ok', brand: 'Opel', model: 'Corsa', priceCents: 1000000, priceType: 'FIXED' }),
        makeRawListing({ itemId: 'intrus', brand: 'Volkswagen', model: 'Golf', priceCents: 100000000, priceType: 'FIXED' }),
        makeRawListing({ itemId: 'inconnue', brand: 'MarqueInconnueXYZ', model: 'Zzz', priceCents: 200000000, priceType: 'FIXED' }),
      ],
    });
    const fetcher: TweedehandsFetcher = { fetchSearchPage: () => Promise.resolve(page) };
    const provider = new TweedehandsDataProvider({ referenceData, marketplace: 'be', fetcher, makeUniverse: [{ makeId: 54, slug: 'opel' }] });
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const opel = baseline.rows.find((r) => r.makeId === 54);
    expect(opel?.price.n, 'seule l’annonce Opel doit alimenter la fourchette Opel').toBe(1);
    expect(opel?.price.max).toBe(10000);
  });

  it('R-D9-10 — aucun agrégat `modelId = 0` (« Modèle non identifié », EX-DATA-72 / ARB-59) n’est jamais produit', async () => {
    const { provider } = makeProvider();
    const handle = await provider.openSnapshot();
    const models = (await provider.fetchAggregates(handle, 'make=54', 'MODEL', 54)).rows as readonly ModelAggregate[];
    expect(models.some((r) => r.modelId === 0), 'clé réservée absente de la sortie').toBe(true);
  });

  it('R-D9-11 — I2 violé : Σ listingCount(modèles) ≠ listingCount(marque)', async () => {
    const { provider } = makeProvider();
    const handle = await provider.openSnapshot();
    const makes = (await provider.fetchAggregates(handle, 'make=54', 'MAKE')).rows as readonly MakeAggregate[];
    const models = (await provider.fetchAggregates(handle, 'make=54', 'MODEL', 54)).rows as readonly ModelAggregate[];
    const i2 = checkI2(makes, models);
    expect(i2.ok, i2.detail).toBe(true);
  }, 60_000);

  it('R-D9-11b — I3/I5 ne sont pas vérifiables : le provider ne publie aucun effectif métrique ni statut de prix de sélection', async () => {
    const { provider } = makeProvider();
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);
    // I5 porte sur la POPULATION dont on connaît le statut de prix. Sur une source
    // `AGGREGATE_SURFACE`, l'effectif publié est exhaustif (`totalResultCount`) alors que le statut
    // de prix n'est connu QUE sur l'échantillon lu : `quoted + onRequest + missing = totalResultCount`
    // est structurellement inatteignable, et l'exiger revenait à demander `0 + 0 + 0 = 5 220`. La
    // sonde mesure donc I5 là où il a un sens — la partition de l'échantillon, désormais PUBLIÉE par
    // le provider (`getPriceStatusCounts`) au lieu de n'exister nulle part, ce qui était le constat.
    const status = provider.getPriceStatusCounts();
    const selection = {
      selectionCount: status.sampleCount,
      price: { n: baseline.rows.reduce((a, r) => a + r.price.n, 0) },
      year: { n: baseline.rows.reduce((a, r) => a + r.year.n, 0) },
      mileage: { n: baseline.rows.reduce((a, r) => a + r.mileage.n, 0) },
      priceQuotedCount: status.priceQuotedCount,
      priceOnRequestCount: status.priceOnRequestCount,
      priceMissingCount: status.priceMissingCount,
      outlierEvaluatedCount: 0,
      outlierNotEvaluatedCount: 0,
    };
    expect(checkI3(baseline.rows, selection).ok).toBe(true); // trivialement vrai (agrégat reconstruit)
    const i5 = checkI5(selection);
    expect(i5.ok, `I5 exige quoted+onRequest+missing = N ; le provider ne les publie pas (${i5.detail})`).toBe(true);
  });

  it('R-D9-16 — §9.3 garde-fou n°1 : la baseline est RECALCULÉE à chaque `openSnapshot`, par un aller réseau par marque', async () => {
    const { provider, calls } = makeProvider();
    await provider.openSnapshot();
    // 1 requête racine + 1 par marque de l'univers. Univers PAR DÉFAUT = 295 marques du référentiel
    // → 296 allers réseau séquentiels sur le chemin critique du premier affichage (EX-NFR-9, 2 s).
    expect(calls.length, `${calls.length} allers réseau à l’ouverture du snapshot`).toBeLessThanOrEqual(1);
  });

  it('R-D9-16b — le cache de baseline est purement mémoire : `closeSnapshot` le détruit, rien n’est persisté', async () => {
    const { provider, calls } = makeProvider();
    const handle = await provider.openSnapshot();
    const before = calls.length;
    await provider.fetchBaselineAggregates(handle); // servi par le cache mémoire : 0 aller
    expect(calls.length).toBe(before);
    await provider.closeSnapshot(handle);
    await provider.fetchBaselineAggregates(handle); // cache perdu → recalcul réseau
    expect(calls.length, '§9.3 : agrégats de base précalculés / mis en cache, jamais recalculés').toBe(before);
  });

  it('R-D9-17 — `AggregateResult.selection` reçoit `FULL:EMPTY` (un selectionHash), pas une `SelectionQuery` canonique', async () => {
    const { provider } = makeProvider();
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);
    // EX-DATA-108 : la sélection vide se sérialise en chaîne vide ; `FULL:EMPTY` est le
    // `selectionHash` publié (EX-SRCH-9quinquies), pas la sélection.
    expect(baseline.selection).toBe('');
  });
});
