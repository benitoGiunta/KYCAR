/**
 * KYCAR — Sondes transverses `patho` : INGESTION RÉELLE (revue 2.5)
 * =================================================================================================
 * Les sondes ci-dessus attaquent le moteur et les écrans à partir d'un lot fabriqué. Celles-ci
 * attaquent le SEUL adaptateur d'ingestion réel du dépôt (`TweedehandsDataProvider`, lot D9) avec
 * une page `__NEXT_DATA__` de fixture — aucun réseau (E5) : le `fetcher` est substitué, exactement
 * comme dans `TweedehandsDataProvider.test.ts`.
 *
 * Objet : montrer où les décisions `ARB-13` (`PRICE_SENTINEL_ABSOLUTE`), `ARB-16`
 * (`PRICE_OUT_OF_RANGE`) et `ARB-54` (`EX-DATA-15` : ordre total, déduplication,
 * `DUPLICATE_VALUE_CONFLICT`) devraient s'appliquer — et ce qui se produit à la place, jusqu'au
 * `MakeAggregate` servi à l'écran A.
 */

import { describe, expect, it } from 'vitest';

import { TweedehandsDataProvider } from '../../../src/providers/tweedehands/TweedehandsDataProvider';
import type { TweedehandsFetcher, TweedehandsSearchRequest } from '../../../src/providers/tweedehands/fetcher';
import type { RawSearchResponse } from '../../../src/providers/tweedehands/nextData';
import {
  buildFixtureHtml,
  loadRealReferenceData,
  makeRawListing,
} from '../../../src/providers/tweedehands/testFixtures';
import { buildMakeCardViewModel } from '../../../src/screens/market/view-model';

const referenceData = loadRealReferenceData();
const MAKE_UNIVERSE = [{ makeId: 54, slug: 'opel' }];

/** Fetcher de fixture : rejoue UNE réponse pour toute requête. Aucune I/O. */
function fixtureFetcher(response: RawSearchResponse): TweedehandsFetcher {
  const html = buildFixtureHtml(response);
  return {
    fetchSearchPage: (_request: TweedehandsSearchRequest): Promise<string> => Promise.resolve(html),
  };
}

function providerFor(response: RawSearchResponse): TweedehandsDataProvider {
  return new TweedehandsDataProvider({
    referenceData,
    marketplace: 'be',
    fetcher: fixtureFetcher(response),
    makeUniverse: MAKE_UNIVERSE,
  });
}

describe('patho — ingestion réelle (D9) sous données pathologiques', () => {
  it('ING-SAIN — chemin nominal : agrégat marque servi, carte-marque construite, aucun champ vendeur', async () => {
    // Sonde AMENDÉE sur sa seule FIXTURE (D-31). Elle servait DEUX annonces et exigeait ensuite une
    // fourchette centrale à l'écran A. Depuis que `EX-SCR-33`/`ARB-17` est câblé dans la carte-marque
    // (D-04, fix-screens), un échantillon de 2 prix relève du palier « trop faible » : P5/P95 sont
    // MASQUÉS et remplacés par le jeton `n = <n>` — c'est l'exigence, pas un défaut. Le chemin
    // nominal que cette sonde mesure demande donc un échantillon du palier publiable (n ≥ 12) ;
    // les deux paliers sont vérifiés ci-dessous, pour que l'amendement ne perde pas le cas initial.
    const listings = Array.from({ length: 12 }, (_v, i) =>
      makeRawListing({
        itemId: `a-${i}`,
        brand: 'Opel',
        model: 'Corsa',
        priceCents: 1200000 + i * 100000,
        mileage: `${60000 - i * 1000} km`,
        constructionYear: `${2019 + (i % 2)}`,
      }),
    );
    const provider = providerFor({ totalResultCount: 5220, listings });
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);

    expect(baseline.rows).toHaveLength(1);
    const opel = baseline.rows[0]!;
    expect(opel.makeId).toBe(54);
    expect(opel.listingCount).toBe(5220);
    expect(opel.price.n).toBe(12);
    expect(opel.price.min).toBe(12000);

    const card = buildMakeCardViewModel(opel, {
      make: undefined,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.price.available).toBe(true);
    expect(card.price.caption).toContain('90 % des offres');

    // Palier « trop faible » (ARB-17) sur le MÊME chemin nominal : la carte se construit, l'effectif
    // est servi, et la fourchette centrale est masquée derrière son jeton — jamais un P5/P95 forgé.
    const petit = providerFor({ totalResultCount: 5220, listings: listings.slice(0, 2) });
    const handlePetit = await petit.openSnapshot();
    const opelPetit = (await petit.fetchBaselineAggregates(handlePetit)).rows[0]!;
    expect(opelPetit.price.n).toBe(2);
    const cartePetite = buildMakeCardViewModel(opelPetit, {
      make: undefined,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(cartePetite.price.available).toBe(false);
    expect(cartePetite.price.lowSampleToken).toBe('n = 2');
  });

  it('R-PATHO-01 — ADV-04 : une annonce à 1 € entre dans la fourchette de prix servie à l’écran A', async () => {
    // `EX-DATA-19(1)` + `EX-DATA-60` : `priceEur < 250` ⇒ `PRICE_SENTINEL_ABSOLUTE`, hors `V_price`.
    const provider = providerFor({
      totalResultCount: 5220,
      listings: [
        makeRawListing({ itemId: 'b-1', brand: 'Opel', model: 'Corsa', priceCents: 100, mileage: '60000 km', constructionYear: '2019' }),
        makeRawListing({ itemId: 'b-2', brand: 'Opel', model: 'Corsa', priceCents: 1200000, mileage: '60000 km', constructionYear: '2019' }),
        makeRawListing({ itemId: 'b-3', brand: 'Opel', model: 'Corsa', priceCents: 1400000, mileage: '40000 km', constructionYear: '2020' }),
      ],
    });
    const handle = await provider.openSnapshot();
    const opel = (await provider.fetchBaselineAggregates(handle)).rows[0]!;

    expect(opel.listingCount).toBe(5220); // l'annonce compte dans l'effectif : conforme
    expect(opel.price.min).toBe(12000); // ATTENDU : hors V_price ; constaté : 1 €
    expect(handle.descriptor.ingestFlagCounts.PRICE_SENTINEL_ABSOLUTE).toBe(1);
  });

  it('R-PATHO-02 — ADV-16 : un prix de 10 000 000 € devient le maximum publié, sans PRICE_OUT_OF_RANGE', async () => {
    const provider = providerFor({
      totalResultCount: 5220,
      listings: [
        makeRawListing({ itemId: 'c-1', brand: 'Opel', model: 'Corsa', priceCents: 1_000_000_000, mileage: '60000 km', constructionYear: '2019' }),
        makeRawListing({ itemId: 'c-2', brand: 'Opel', model: 'Corsa', priceCents: 1200000, mileage: '60000 km', constructionYear: '2019' }),
      ],
    });
    const handle = await provider.openSnapshot();
    const opel = (await provider.fetchBaselineAggregates(handle)).rows[0]!;

    expect(opel.price.max).toBe(12000); // ATTENDU : la valeur hors bornes est INCONNU (ARB-16)
    expect(handle.descriptor.ingestFlagCounts.PRICE_OUT_OF_RANGE).toBe(1);
  });

  it('R-PATHO-09 — ADV-05 / ARB-54 : deux occurrences du même listingId ne sont pas dédupliquées', async () => {
    const provider = providerFor({
      totalResultCount: 5220,
      listings: [
        makeRawListing({ itemId: 'dup-1', brand: 'Opel', model: 'Corsa', priceCents: 1290000, mileage: '60000 km', constructionYear: '2019' }),
        makeRawListing({ itemId: 'dup-1', brand: 'Opel', model: 'Corsa', priceCents: 1050000, mileage: '60000 km', constructionYear: '2019' }),
      ],
    });
    const handle = await provider.openSnapshot();
    const opel = (await provider.fetchBaselineAggregates(handle)).rows[0]!;

    // `EX-DATA-15` : la seconde occurrence est écartée ⇒ un seul prix dans l'échantillon.
    expect(opel.price.n).toBe(1);
    expect(handle.descriptor.listingCount).toBe(1);
    expect(handle.descriptor.duplicateListingCount).toBe(1);
  });

  it('R-PATHO-10 — ADV-05 / ARB-54 : le conflit de valeur sur doublon n’est ni drapeauté ni compté', async () => {
    const provider = providerFor({
      totalResultCount: 5220,
      listings: [
        makeRawListing({ itemId: 'dup-2', brand: 'Opel', model: 'Corsa', priceCents: 1290000, mileage: '60000 km', constructionYear: '2019' }),
        makeRawListing({ itemId: 'dup-2', brand: 'Opel', model: 'Corsa', priceCents: 1050000, mileage: '60000 km', constructionYear: '2019' }),
      ],
    });
    const handle = await provider.openSnapshot();
    expect(handle.descriptor.duplicateValueConflictCount).toBe(1);
    expect(handle.descriptor.ingestFlagCounts.DUPLICATE_VALUE_CONFLICT).toBe(1);
  });

  it('ING-R3 — aucune donnée vendeur ne franchit l’interface, même sur charge adverse (R3, EX-NFR-26)', async () => {
    const provider = providerFor({
      totalResultCount: 12,
      listings: [
        makeRawListing({
          itemId: 'r3-1',
          brand: 'Opel',
          model: 'Corsa',
          priceCents: 1200000,
          mileage: '60000 km',
          constructionYear: '2019',
          extraForbidden: {
            sellerName: 'Garage Dupont',
            phone: '+32 470 00 00 00',
            postalCode: '1000',
            city: 'Bruxelles',
            lat: 50.85,
            lon: 4.35,
          },
        }),
      ],
    });
    const handle = await provider.openSnapshot();
    const rows = (await provider.fetchBaselineAggregates(handle)).rows;
    const serialized = JSON.stringify({ descriptor: handle.descriptor, rows });
    for (const needle of ['Dupont', '+32', 'Bruxelles', '50.85', '4.35', '1000"']) {
      expect(serialized).not.toContain(needle);
    }
  });
});
