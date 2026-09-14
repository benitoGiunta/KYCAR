/**
 * KYCAR — Revue D9 : corpus de fixtures `__NEXT_DATA__` du lot, rejoué par les sondes
 * =================================================================================================
 * Le lot D9 ne stocke aucune page HTML capturée : ses fixtures sont CONSTRUITES par
 * `src/providers/tweedehands/testFixtures.ts` (`makeRawListing` + `buildFixtureHtml`). Ce module
 * reconstitue, en un seul corpus, TOUTES les formes d'annonce que les six fichiers de test du lot
 * mettent en circulation (`TweedehandsDataProvider.test.ts`, `normalize.test.ts`, `aggregate.test.ts`,
 * `nextData.test.ts`), plus les formes adverses exigées par la mission de revue (champs vendeur
 * injectés, code postal, coordonnées, nom de vendeur dans le titre et dans le deeplink).
 *
 * Aucune I/O réseau : `buildFixtureHtml` sérialise en mémoire.
 */
import {
  buildFixtureHtml,
  makeRawListing,
} from '../../../src/providers/tweedehands/testFixtures';
import type { RawListing, RawSearchResponse } from '../../../src/providers/tweedehands/nextData';

/** Jetons R3 injectés dans les fixtures adverses : aucun ne doit survivre dans une sortie. */
export const R3_TOKENS = {
  sellerId: 'seller-42',
  contactName: 'Jan Peeters',
  companyName: 'Garage Peeters BVBA',
  phone: '+32471234567',
  email: 'jan.peeters@example.be',
  /** Code postal belge à 4 chiffres, distinct de toute année/prix des fixtures. */
  postalCode: '9051',
  city: 'Sint-Denijs-Westrem',
  lat: 50.9915,
  long: 3.6801,
  profileUrl: 'https://www.2dehands.be/u/garage-peeters/1234567/',
} as const;

/** Les annonces « nominales » des tests du lot (formes fidèles à probe-LOT-N.md). */
export const NOMINAL_LISTINGS: readonly RawListing[] = [
  makeRawListing({
    itemId: 'm3f9c2a1-0000-0000-0000-000000000001',
    brand: 'Opel',
    model: 'Corsa',
    priceCents: 1299900,
    priceType: 'FIXED',
    constructionYear: '2019',
    mileage: '90.000 km',
    fuel: 'Benzine',
    body: 'Hatchback',
    transmission: 'Handgeschakeld',
    driveTrain: 'Voorwielaandrijving',
    condition: 'Tweedehands',
    advertiser: 'Particulier',
    euronormBE: 'Euro 6',
    enginePowerKW: '85',
    co2emission: '118,5',
    numberOfSeatsBE: '5',
    aantaldeurenBE: '5',
  }),
  makeRawListing({
    itemId: 'opel-2',
    brand: 'Opel',
    model: 'Astra',
    priceCents: 1500000,
    mileage: '40000 km',
    constructionYear: '2020',
    fuel: 'Diesel',
    advertiser: 'Bedrijf',
  }),
  makeRawListing({
    itemId: 'vw-1',
    brand: 'Volkswagen',
    model: 'Golf',
    priceCents: 1800000,
    mileage: '30000 km',
    constructionYear: '2021',
    advertiser: 'Particulier',
  }),
  makeRawListing({ itemId: 'w4', brand: 'MarqueInconnueXYZ', model: 'Zzz' }),
  makeRawListing({ itemId: 'v5', brand: 'Opel', model: 'ModeleFantaisiste' }),
  makeRawListing({ itemId: 'p1', brand: 'Opel', model: 'Corsa', priceType: 'ON_REQUEST' }),
  makeRawListing({ itemId: 'p2', brand: 'Opel', model: 'Corsa' }),
];

/**
 * Annonces adverses : une charge réelle peut porter davantage de champs que ceux déclarés par
 * `RawListing` (l'index de signature du type le documente). On y met tout ce que R3 interdit,
 * plus les fuites INDIRECTES (nom de vendeur dans le titre, deeplink pointant un profil vendeur).
 */
export const ADVERSARIAL_LISTINGS: readonly RawListing[] = [
  {
    ...makeRawListing({
      itemId: 'adv-1',
      brand: 'Opel',
      model: 'Corsa',
      priceCents: 990000,
      mileage: '75000 km',
      constructionYear: '2017',
      advertiser: 'Bedrijf',
      extraForbidden: {
        seller: {
          id: R3_TOKENS.sellerId,
          name: R3_TOKENS.contactName,
          contactName: R3_TOKENS.contactName,
          companyName: R3_TOKENS.companyName,
          phone: R3_TOKENS.phone,
          email: R3_TOKENS.email,
          sellerUrl: R3_TOKENS.profileUrl,
        },
        title: `Opel Corsa — ${R3_TOKENS.contactName}, ${R3_TOKENS.city} ${R3_TOKENS.postalCode}`,
        description: `Contact ${R3_TOKENS.contactName} au ${R3_TOKENS.phone}`,
      },
    }),
    location: {
      cityName: R3_TOKENS.city,
      countryAbbreviation: 'BE',
      lat: R3_TOKENS.lat,
      long: R3_TOKENS.long,
      // Champ postal : absent de la surface observée, injecté ici pour éprouver le garde.
      postalCode: R3_TOKENS.postalCode,
    } as RawListing['location'],
  },
  {
    // Deeplink pointant un LISTING DE PROFIL vendeur (`/u/…`, en `Disallow` chez 2dehands) au lieu
    // d'une page d'annonce : fuite indirecte E6/E7 par l'URL.
    ...makeRawListing({ itemId: 'adv-2', brand: 'Volkswagen', model: 'Polo', priceCents: 700000 }),
    vipUrl: R3_TOKENS.profileUrl,
  },
];

/** Toutes les annonces du corpus. */
export const ALL_LISTINGS: readonly RawListing[] = [...NOMINAL_LISTINGS, ...ADVERSARIAL_LISTINGS];

/** Les réponses `__NEXT_DATA__` du corpus, telles que servies par une page de recherche autorisée. */
export const FIXTURE_RESPONSES: Readonly<Record<string, RawSearchResponse>> = {
  root: { totalResultCount: 100188, listings: NOMINAL_LISTINGS },
  opel: { totalResultCount: 5220, listings: [NOMINAL_LISTINGS[0]!, NOMINAL_LISTINGS[1]!] },
  'opel/corsa': { totalResultCount: 1281, listings: [NOMINAL_LISTINGS[0]!] },
  'opel/astra': { totalResultCount: 980, listings: [NOMINAL_LISTINGS[1]!] },
  volkswagen: { totalResultCount: 8100, listings: [NOMINAL_LISTINGS[2]!] },
  adversarial: { totalResultCount: 42, listings: ADVERSARIAL_LISTINGS },
  vide: { totalResultCount: 0, listings: [] },
};

/** Les pages HTML complètes correspondantes (bloc `<script id="__NEXT_DATA__">`). */
export const FIXTURE_PAGES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FIXTURE_RESPONSES).map(([key, response]) => [key, buildFixtureHtml(response)]),
);
