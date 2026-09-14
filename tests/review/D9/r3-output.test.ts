/**
 * KYCAR — Revue D9 · sonde 1 : aucun champ R3 dans la sortie (critère §7.1 « P-1 »)
 * =================================================================================================
 * Toutes les fixtures `__NEXT_DATA__` du lot (corpus `./fixtures`) traversent le pipeline COMPLET
 * (extraction → parsing → normalisation → agrégation → provider), puis :
 *   a) `scanForbiddenFields` est appliqué à CHAQUE objet produit ;
 *   b) `scanForbiddenFields` est appliqué au snapshot SÉRIALISÉ (JSON) ;
 *   c) un balayage de VALEURS cherche les fuites indirectes que le garde par NOM ne voit pas :
 *      `sellerId`, URL de profil vendeur, coordonnées GPS, code postal à 4 chiffres, nom de vendeur.
 */
import { describe, expect, it } from 'vitest';
import { scanForbiddenFields } from '../../../src/types/validation';
import { mapListingToNormalized } from '../../../src/providers/tweedehands/normalize';
import { parseSearchResponse } from '../../../src/providers/tweedehands/nextData';
import { buildMakeAggregate, buildModelAggregate } from '../../../src/providers/tweedehands/aggregate';
import { buildEuroStandardIndex } from '../../../src/providers/tweedehands/vocabularyMap';
import { TweedehandsDataProvider } from '../../../src/providers/tweedehands/TweedehandsDataProvider';
import type { TweedehandsFetcher, TweedehandsSearchRequest } from '../../../src/providers/tweedehands/fetcher';
import { loadRealReferenceData } from '../../../src/providers/tweedehands/testFixtures';
import { FIXTURE_PAGES, FIXTURE_RESPONSES, R3_TOKENS } from './fixtures';

const referenceData = loadRealReferenceData();
const euroIndex = buildEuroStandardIndex(referenceData);

function fixtureKeyOf(request: TweedehandsSearchRequest): string {
  if (request.brandSlug === undefined) return 'root';
  return request.modelSlug === undefined ? request.brandSlug : `${request.brandSlug}/${request.modelSlug}`;
}

/** Fetcher de fixtures : aucune I/O, rejoue le corpus local. */
function corpusFetcher(): TweedehandsFetcher {
  return {
    fetchSearchPage(request: TweedehandsSearchRequest): Promise<string> {
      const page = FIXTURE_PAGES[fixtureKeyOf(request)] ?? FIXTURE_PAGES.adversarial;
      return Promise.resolve(page as string);
    },
  };
}

/** Jetons R3 qui ne doivent JAMAIS apparaître, même en sous-chaîne, dans une sortie sérialisée. */
const FORBIDDEN_VALUE_TOKENS: readonly string[] = [
  R3_TOKENS.sellerId,
  R3_TOKENS.contactName,
  R3_TOKENS.companyName,
  R3_TOKENS.phone,
  R3_TOKENS.email,
  R3_TOKENS.city,
  R3_TOKENS.postalCode,
  String(R3_TOKENS.lat),
  String(R3_TOKENS.long),
  '/u/', // segment d'un listing de profil vendeur (Disallow robots.txt 2dehands)
];

function assertNoForbiddenValue(serialized: string, label: string): void {
  for (const token of FORBIDDEN_VALUE_TOKENS) {
    expect(serialized.includes(token), `${label} : jeton R3 « ${token} » présent`).toBe(false);
  }
  // Code postal belge à 4 chiffres non tronqué, sous une clé quelconque.
  expect(/"[^"]*(postal|zip|post)[^"]*"\s*:\s*"?\d{4}"?/i.test(serialized), `${label} : code postal à 4 chiffres`).toBe(false);
}

describe('D9 · R3 — sortie du pipeline complet sur toutes les fixtures du lot (P-1)', () => {
  it('chaque annonce normalisée issue de chaque fixture est exempte de champ R3 (garde par nom)', () => {
    let count = 0;
    for (const [key, page] of Object.entries(FIXTURE_PAGES)) {
      const response = parseSearchResponse(page);
      for (const raw of response.listings) {
        const normalized = mapListingToNormalized(raw, referenceData, 'be', euroIndex);
        expect(scanForbiddenFields(normalized), `fixture ${key}`).toEqual([]);
        count += 1;
      }
    }
    expect(count).toBeGreaterThanOrEqual(11);
  });

  it('les fixtures adverses portent bien des champs R3 en ENTRÉE (la sonde teste quelque chose)', () => {
    const response = parseSearchResponse(FIXTURE_PAGES.adversarial as string);
    const issues = response.listings.flatMap((raw) => scanForbiddenFields(raw));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path.toLowerCase().includes('phone'))).toBe(true);
    expect(issues.some((i) => i.path.toLowerCase().includes('lat'))).toBe(true);
  });

  it('les agrégats marque/modèle construits sur ces annonces sont exempts de champ R3', () => {
    for (const [key, response] of Object.entries(FIXTURE_RESPONSES)) {
      const sample = response.listings.map((raw) => mapListingToNormalized(raw, referenceData, 'be', euroIndex));
      const make = buildMakeAggregate(54, response.totalResultCount, sample);
      const model = buildModelAggregate(54, 1918, response.totalResultCount, sample);
      expect(scanForbiddenFields(make), `fixture ${key}`).toEqual([]);
      expect(scanForbiddenFields(model), `fixture ${key}`).toEqual([]);
      assertNoForbiddenValue(JSON.stringify({ make, model }), `agrégats ${key}`);
    }
  });

  it('la sortie du provider (descripteur + agrégats), objet ET snapshot sérialisé, est exempte de R3', async () => {
    const provider = new TweedehandsDataProvider({
      referenceData,
      marketplace: 'be',
      fetcher: corpusFetcher(),
      makeUniverse: [
        { makeId: 54, slug: 'opel' },
        { makeId: 74, slug: 'volkswagen' },
      ],
    });
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const makes = await provider.fetchAggregates(handle, 'make=54', 'MAKE');
    const models = await provider.fetchAggregates(handle, 'FULL:EMPTY', 'MODEL', 54);

    for (const [label, value] of [
      ['descripteur', handle.descriptor],
      ['baseline', baseline],
      ['agrégats marque', makes],
      ['agrégats modèle', models],
    ] as const) {
      expect(scanForbiddenFields(value), label).toEqual([]);
      assertNoForbiddenValue(JSON.stringify(value), label);
    }

    // Snapshot sérialisé complet (ce que l'application persisterait / enverrait au worker).
    const snapshot = JSON.stringify({ descriptor: handle.descriptor, baseline, makes, models });
    expect(scanForbiddenFields(JSON.parse(snapshot))).toEqual([]);
    assertNoForbiddenValue(snapshot, 'snapshot sérialisé');
  }, 60_000);

  it('R-D9-12 — le deeplink recopié n’est jamais contrôlé : une URL de profil vendeur (/u/…) traverse la normalisation', () => {
    const response = parseSearchResponse(FIXTURE_PAGES.adversarial as string);
    const profileAd = response.listings.find((l) => String(l.vipUrl).includes('/u/'));
    expect(profileAd).toBeDefined();
    const normalized = mapListingToNormalized(profileAd!, referenceData, 'be', euroIndex);
    // EX-NFR-26 : « Le deeplink conservé pointe vers l'annonce d'origine, jamais vers une fiche
    // vendeur. » L'adaptateur ne le vérifie pas : la sonde échoue tant que le contrôle est absent.
    expect(normalized.listingUrl.includes('/u/')).toBe(false);
  });
});
