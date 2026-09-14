/**
 * KYCAR — Les SUJETS de la suite de contrat : trois implémentations d'une même interface
 * =================================================================================================
 * Un contrat de provider ne vaut que s'il est exercé sur PLUSIEURS implémentations : une seule ne
 * prouve que sa cohérence avec elle-même. La suite exécute donc les mêmes cas sur :
 *
 *   1. **synthetic** — `SyntheticDataProvider`, source SYNTHETIC générée à la volée, mode 2 servi ;
 *   2. **fixture** — `FixtureDataProvider` sur le profil `dev` : le VRAI `data/fixtures/dev` s'il
 *      existe dans l'arbre, sinon le mini-jeu déterministe de `fixtures/mini.ts`. Le sujet dit
 *      lequel des deux il a servi ; aucune mesure n'est publiée sans dire sur quoi elle porte ;
 *   3. **tweedehands (mock)** — `TweedehandsDataProvider` sur un faux `fetcher` qui rejoue des
 *      fixtures locales inventées : source REAL, mode 1 par surface d'agrégats, **mode 2
 *      INDISPONIBLE**. C'est le sujet qui empêche le contrat de supposer le mode 2.
 *
 * Aucune I/O réseau (E5) : le sujet 2 lit le disque, le sujet 3 rejoue des chaînes en mémoire.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import type { DataProvider } from '../../src/providers/DataProvider';
import { FixtureDataProvider } from '../../src/providers/fixture/FixtureDataProvider';
import { createNodeFixtureLoader } from '../../src/providers/fixture/loaders/node';
import { SyntheticDataProvider } from '../../src/providers/synthetic/SyntheticDataProvider';
import { TweedehandsDataProvider } from '../../src/providers/tweedehands/TweedehandsDataProvider';
import type { TweedehandsFetcher, TweedehandsSearchRequest } from '../../src/providers/tweedehands/fetcher';
import type { RawSearchResponse } from '../../src/providers/tweedehands/nextData';
import { buildFixtureHtml, loadRealReferenceData, makeRawListing } from '../../src/providers/tweedehands/testFixtures';
import type { ReferenceData } from '../../src/types/reference';
import { buildMiniFixtures, MINI_PROFILE } from './fixtures/mini';

/** Effectif du sujet synthétique : assez pour que les agrégats soient peuplés, assez peu pour être rapide. */
export const SYNTHETIC_ROWS = 3_000;

/** Un sujet de la suite : un provider, son nom, et ce qu'on attend de lui. */
export interface ContractSubject {
  readonly name: string;
  readonly provider: DataProvider;
  /** Le provider sert-il le mode 2 ? Le contrat s'y adapte, il ne le suppose pas. */
  readonly expectsMode2: boolean;
  /** Description de la source réellement servie (jeu réel ou mini-jeu), pour les mesures. */
  readonly origin: string;
}

let cachedRef: ReferenceData | null = null;

/** Référentiels RÉELS du dépôt, chargés une fois pour toute la suite. */
export function referenceData(): ReferenceData {
  cachedRef ??= loadRealReferenceData();
  return cachedRef;
}

/** Vrai si `data/fixtures/dev` existe dans l'arbre (livrable de `dataset-gen`, phase 3.2). */
export function realDevFixturesAvailable(): boolean {
  return existsSync(resolve(process.cwd(), 'data/fixtures', 'dev'));
}

/** Construit le provider de fixtures sur le meilleur jeu disponible. */
export function createFixtureSubject(): ContractSubject {
  const real = realDevFixturesAvailable();
  const root = real ? resolve(process.cwd(), 'data/fixtures') : buildMiniFixtures().root;
  return {
    name: 'fixture',
    expectsMode2: true,
    origin: real ? 'data/fixtures/dev (jeu réel, dataset-gen)' : `mini-jeu déterministe (${root})`,
    provider: new FixtureDataProvider({
      referenceData: referenceData(),
      profile: MINI_PROFILE as 'dev',
      loader: createNodeFixtureLoader(root),
    }),
  };
}

/** Construit le provider synthétique. */
export function createSyntheticSubject(): ContractSubject {
  return {
    name: 'synthetic',
    expectsMode2: true,
    origin: `généré à la volée (${SYNTHETIC_ROWS} annonces, graine fixe)`,
    provider: new SyntheticDataProvider({ referenceData: referenceData(), listingCount: SYNTHETIC_ROWS, seed: 7 }),
  };
}

/* ---- Mock 2dehands : mêmes fixtures locales inventées que le lot D9 --------------------------- */

const FIXTURE_RESPONSES: Readonly<Record<string, RawSearchResponse>> = {
  root: {
    totalResultCount: 100_188,
    listings: [makeRawListing({ itemId: 'root-1', brand: 'Opel', model: 'Corsa', priceCents: 1_000_000, mileage: '50000 km', constructionYear: '2018', advertiser: 'Particulier' })],
  },
  opel: {
    totalResultCount: 5_220,
    listings: [
      makeRawListing({ itemId: 'opel-1', brand: 'Opel', model: 'Corsa', priceCents: 1_200_000, mileage: '60000 km', constructionYear: '2019', fuel: 'Benzine', advertiser: 'Particulier' }),
      makeRawListing({ itemId: 'opel-2', brand: 'Opel', model: 'Astra', priceCents: 1_500_000, mileage: '40000 km', constructionYear: '2020', fuel: 'Diesel', advertiser: 'Bedrijf' }),
    ],
  },
  'opel/corsa': {
    totalResultCount: 1_281,
    listings: [makeRawListing({ itemId: 'opel-corsa-1', brand: 'Opel', model: 'Corsa', priceCents: 1_200_000, mileage: '60000 km', constructionYear: '2019', advertiser: 'Particulier' })],
  },
  volkswagen: {
    totalResultCount: 8_100,
    listings: [makeRawListing({ itemId: 'vw-1', brand: 'Volkswagen', model: 'Golf', priceCents: 1_800_000, mileage: '30000 km', constructionYear: '2021', advertiser: 'Particulier' })],
  },
};

function fakeFetcher(): TweedehandsFetcher {
  return {
    fetchSearchPage(request: TweedehandsSearchRequest): Promise<string> {
      const key =
        request.brandSlug === undefined
          ? 'root'
          : request.modelSlug === undefined
            ? request.brandSlug
            : `${request.brandSlug}/${request.modelSlug}`;
      return Promise.resolve(buildFixtureHtml(FIXTURE_RESPONSES[key] ?? { totalResultCount: 0, listings: [] }));
    },
  };
}

/** Construit le sujet 2dehands : source REAL, mode 1 par surface d'agrégats, mode 2 INDISPONIBLE. */
export function createTweedehandsSubject(): ContractSubject {
  return {
    name: 'tweedehands (mock)',
    expectsMode2: false,
    origin: 'fixtures locales inventées, rejouées en mémoire (aucune I/O réseau)',
    provider: new TweedehandsDataProvider({
      referenceData: referenceData(),
      marketplace: 'be',
      fetcher: fakeFetcher(),
      // Univers restreint aux deux marques des fixtures : politique opérationnelle légitime
      // (`TweedehandsDataProviderOptions.makeUniverse`), et 295 allers fictifs évités par test.
      makeUniverse: [
        { makeId: 54, slug: 'opel' },
        { makeId: 74, slug: 'volkswagen' },
      ],
    }),
  };
}

/** Les trois sujets, dans l'ordre où la suite les exécute. */
export function allSubjects(): readonly ContractSubject[] {
  return [createSyntheticSubject(), createFixtureSubject(), createTweedehandsSubject()];
}
