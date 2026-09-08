/**
 * KYCAR — Sondes de revue D9 (phase 2.8) : dictionnaire d'ingestion et agrégats du provider RÉEL
 * =================================================================================================
 * Sondes écrites AVANT la correction (D-32), pour les décisions du fix-lead :
 *
 *   - **D8-08** — mapping du champ BTW/TVA de 2dehands (`EX-SCR-203`, annexe A champ # 10) ;
 *     absent ⇒ INCONNU, jamais « non déductible ».
 *   - **D8-10** — `MakeAggregate.modelCount` (`EX-DATA-68`/`71`), `coverageWarning` (`EX-DATA-17`),
 *     `samplingBias` et `adTierDistribution` (`EX-DATA-43`), réservés au provider RÉEL.
 *   - **D8-16** (FV-20) — `UNIT_UNSUPPORTED` (`EX-DATA-5`), repli carburant création → recherche
 *     (`EX-DATA-10`), `HYBRID_CATEGORY_UNRESOLVED` (`EX-DATA-11`), rejet d'une annonce sans
 *     `listingUrl` (`EX-DATA-14`), `co2Source` (`EX-DATA-35`).
 *   - **D8-20** (O15) — `bodyType` déclaré non appliqué à l'entrée du mode 2.
 *
 * Aucun accès réseau (E5) : le `TweedehandsFetcher` est un double qui rejoue une page construite en
 * mémoire par `testFixtures.ts`.
 */

import { describe, expect, it } from 'vitest';

import { TweedehandsDataProvider } from '../../../src/providers/tweedehands/TweedehandsDataProvider';
import type { TweedehandsFetcher } from '../../../src/providers/tweedehands/fetcher';
import { assertNoForbiddenFields, mapListingToNormalized } from '../../../src/providers/tweedehands/normalize';
import type { RawListing } from '../../../src/providers/tweedehands/nextData';
import {
  buildFixtureHtml,
  loadRealReferenceData,
  makeRawListing,
} from '../../../src/providers/tweedehands/testFixtures';
import { buildEuroStandardIndex } from '../../../src/providers/tweedehands/vocabularyMap';
import type { MakeAggregate, ModelAggregate } from '../../../src/providers/DataProvider';

const referenceData = loadRealReferenceData();
const euroIndex = buildEuroStandardIndex(referenceData);

const norm = (o: Parameters<typeof makeRawListing>[0]): ReturnType<typeof mapListingToNormalized> =>
  mapListingToNormalized(makeRawListing(o), referenceData, 'be', euroIndex);

/** Provider branché sur une page fixe (aucun réseau), avec l'univers de marques réduit à Opel. */
function providerOn(
  listings: readonly RawListing[],
  totalResultCount = 5220,
): TweedehandsDataProvider {
  const fetcher: TweedehandsFetcher = {
    fetchSearchPage() {
      return Promise.resolve(buildFixtureHtml({ totalResultCount, listings }));
    },
  };
  return new TweedehandsDataProvider({
    referenceData,
    marketplace: 'be',
    fetcher,
    makeUniverse: [{ makeId: 54, slug: 'opel' }],
  });
}

/* ================================================================================================
 * D8-08 — colonne TVA (EX-SCR-203, annexe A champ # 10 `isTaxDeductible`)
 * ============================================================================================== */

describe('D9 §2.8 — D8-08 : le champ BTW/TVA de la source est cartographié', () => {
  it('R-D9-22 — `btwVerrekenbaar` (NL) et `tvaDeductible` (FR) alimentent `vatDeductible`', () => {
    expect(norm({ itemId: 'v1', brand: 'Opel', model: 'Corsa', btwVerrekenbaar: 'Ja' }).vatDeductible).toBe(true);
    expect(norm({ itemId: 'v2', brand: 'Opel', model: 'Corsa', btwVerrekenbaar: 'Nee' }).vatDeductible).toBe(false);
    expect(norm({ itemId: 'v3', brand: 'Opel', model: 'Corsa', btwVerrekenbaar: 'Oui' }).vatDeductible).toBe(true);
    expect(norm({ itemId: 'v4', brand: 'Opel', model: 'Corsa', btwVerrekenbaar: 'Non' }).vatDeductible).toBe(false);
  });

  it('R-D9-22b — champ absent ⇒ INCONNU (`null`), JAMAIS « non déductible »', () => {
    const listing = norm({ itemId: 'v5', brand: 'Opel', model: 'Corsa' });
    expect(listing.vatDeductible).toBeNull();
    expect(listing.unknownFields).toContain('vatDeductible');
    // Une valeur PRÉSENTE mais non traduisible est un code énuméré inconnu, pas un « non ».
    const weird = norm({ itemId: 'v6', brand: 'Opel', model: 'Corsa', btwVerrekenbaar: 'Misschien' });
    expect(weird.vatDeductible).toBeNull();
    expect(weird.ingestFlags).toContain('ENUM_UNKNOWN');
  });
});

/* ================================================================================================
 * D8-10 — agrégats enrichis du provider réel (EX-DATA-17, 43, 68, 71)
 * ============================================================================================== */

describe('D9 §2.8 — D8-10 : agrégats enrichis', () => {
  const sample: readonly RawListing[] = [
    makeRawListing({ itemId: 'a1', brand: 'Opel', model: 'Corsa', priceCents: 1000000, priceType: 'FIXED', mileage: '90000 km', priorityProduct: 'DAGTOPPER' }),
    makeRawListing({ itemId: 'a2', brand: 'Opel', model: 'Astra', priceCents: 1500000, priceType: 'FIXED', mileage: '40000 km', priorityProduct: 'DAGTOPPER' }),
    makeRawListing({ itemId: 'a3', brand: 'Opel', model: 'Corsa', priceType: 'NOTK', mileage: '20000 km', priorityProduct: 'TOPADVERTENTIE' }),
    makeRawListing({ itemId: 'a4', brand: 'Opel', model: 'Corsa', mileage: '10000 km' }),
  ];

  it('R-D9-23 — `modelCount` compte les modèles DISTINCTS de l’échantillon, jamais `null` par défaut', async () => {
    const p = providerOn(sample);
    const handle = await p.openSnapshot();
    const result = await p.fetchAggregates(handle, '', 'MAKE');
    const opel = result.rows.find((r) => r.makeId === 54) as MakeAggregate;
    // Corsa et Astra : deux modèles distincts, `modelId = 0` exclu (EX-DATA-71).
    expect(opel.modelCount).toBe(2);
  });

  it('R-D9-24 — EX-DATA-17 : `coverageWarning.price` quand la part de prix fermes tombe sous 0,80', async () => {
    const p = providerOn(sample);
    const handle = await p.openSnapshot();
    const result = await p.fetchAggregates(handle, '', 'MAKE');
    const opel = result.rows.find((r) => r.makeId === 54) as MakeAggregate;
    expect(opel.coverageWarning).toBeDefined();
    // 2 prix fermes sur 4 annonces = 0,50 < 0,80.
    expect(opel.coverageWarning?.price).toBe(true);
    // EX-DATA-25/27 : l'axe année est vide sur cette surface — couverture nulle, donc avertie.
    expect(opel.coverageWarning?.year).toBe(true);
    expect(opel.coverageWarning?.mileage).toBe(false);
  });

  it('R-D9-25 — EX-DATA-43 : `adTierDistribution` publiée et `samplingBias` au-delà de 30 % de promus', async () => {
    const p = providerOn(sample);
    const handle = await p.openSnapshot();
    const result = await p.fetchAggregates(handle, '', 'MAKE');
    const opel = result.rows.find((r) => r.makeId === 54) as MakeAggregate;
    expect(opel.adTierDistribution).toBeDefined();
    const dist = opel.adTierDistribution as Readonly<Record<string, number>>;
    console.log(`[rev-D9 2.8] adTierDistribution = ${JSON.stringify(dist)}`);
    // Les 5 codes de `KYCAR_AD_TIER` sont publiés, somme = effectif de l'échantillon.
    expect(Object.keys(dist).sort()).toEqual(['NONE', 'T20', 'T30', 'T40', 'T50']);
    expect(Object.values(dist).reduce((a, b) => a + b, 0)).toBe(4);
    expect(dist.NONE).toBe(1);
    // 3 promus sur 4 = 75 % > 30 %.
    expect(opel.samplingBias).toBe(true);
  });

  it('R-D9-25b — un échantillon sans promotion ne porte PAS `samplingBias`', async () => {
    const plain = [
      makeRawListing({ itemId: 'b1', brand: 'Opel', model: 'Corsa', priceCents: 1000000, priceType: 'FIXED', mileage: '10000 km' }),
      makeRawListing({ itemId: 'b2', brand: 'Opel', model: 'Astra', priceCents: 1100000, priceType: 'FIXED', mileage: '20000 km' }),
    ];
    const p = providerOn(plain);
    const handle = await p.openSnapshot();
    const result = await p.fetchAggregates(handle, '', 'MAKE');
    const opel = result.rows.find((r) => r.makeId === 54) as MakeAggregate;
    expect(opel.samplingBias).toBe(false);
    expect(opel.coverageWarning?.price).toBe(false);
  });
});

/* ================================================================================================
 * D8-16 (FV-20) — drapeaux et replis d'ingestion
 * ============================================================================================== */

describe('D9 §2.8 — D8-16 : drapeaux et replis d’ingestion', () => {
  it('R-D9-26 — EX-DATA-5 : une unité source non gérée refuse la conversion (`UNIT_UNSUPPORTED`)', () => {
    const miles = norm({ itemId: 'u1', brand: 'Opel', model: 'Corsa', mileage: '60000', mileageUnit: 'mi' });
    expect(miles.ingestFlags).toContain('UNIT_UNSUPPORTED');
    expect(miles.mileageKm, 'aucune conversion devinée').toBeNull();
    expect(miles.unknownFields).toContain('mileageKm');

    const hp = norm({ itemId: 'u2', brand: 'Opel', model: 'Corsa', enginePowerKW: '150', powerUnit: 'hp' });
    expect(hp.ingestFlags).toContain('UNIT_UNSUPPORTED');
    expect(hp.powerKw).toBeNull();

    // Unité CANONIQUE explicitement servie : la valeur passe, aucun drapeau.
    const km = norm({ itemId: 'u3', brand: 'Opel', model: 'Corsa', mileage: '60000', mileageUnit: 'km' });
    expect(km.mileageKm).toBe(60000);
    expect(km.ingestFlags).not.toContain('UNIT_UNSUPPORTED');
  });

  it('R-D9-27 — EX-DATA-10 : repli création → recherche quand `fuelCategory` manque et `fuelTypePrimary` est là', () => {
    // `7` = Diesel dans `KYCAR_FUEL_TYPE` → `D` Diesel dans `KYCAR_FUEL_CATEGORY`.
    const diesel = norm({ itemId: 'f1', brand: 'Opel', model: 'Corsa', fuelTypePrimary: '7' });
    expect(diesel.fuelCategory).toBe('D');
    expect(diesel.ingestFlags).toContain('ENUM_UNKNOWN');
    expect(diesel.fuelCategorySource).toBe('FUEL_TYPE_FALLBACK');

    // `12` = Électrique → `E`.
    expect(norm({ itemId: 'f2', brand: 'Opel', model: 'Corsa', fuelTypePrimary: '12' }).fuelCategory).toBe('E');

    // La catégorie SERVIE prime : le repli n'est jamais consulté quand `fuel` est présent.
    const served = norm({ itemId: 'f3', brand: 'Opel', model: 'Corsa', fuel: 'Benzine', fuelTypePrimary: '7' });
    expect(served.fuelCategory).toBe('B');
    expect(served.fuelCategorySource).toBe('SOURCE');
  });

  it('R-D9-28 — EX-DATA-11 : un hybride rechargeable sans catégorie reste INCONNU, jamais `B` ni `D`', () => {
    const phev = norm({ itemId: 'h1', brand: 'Opel', model: 'Corsa', fuelTypePrimary: '1', isPluginHybrid: 'true' });
    expect(phev.fuelCategory, 'aucun rattachement à Essence/Diesel').toBeNull();
    expect(phev.ingestFlags).toContain('ENUM_UNKNOWN');
    expect(phev.ingestReportFlags).toContain('HYBRID_CATEGORY_UNRESOLVED');
    expect(phev.unknownFields).toContain('fuelCategory');
  });

  it('R-D9-29 — EX-DATA-14 : une annonce sans `listingUrl` est REJETÉE et comptée par motif', async () => {
    const withoutUrl: RawListing = {
      ...makeRawListing({ itemId: 'nourl', brand: 'Opel', model: 'Corsa', priceCents: 900000, priceType: 'FIXED' }),
      vipUrl: '',
    };
    const kept = makeRawListing({ itemId: 'ok', brand: 'Opel', model: 'Corsa', priceCents: 1000000, priceType: 'FIXED' });
    const p = providerOn([withoutUrl, kept]);
    const handle = await p.openSnapshot();
    const d = handle.descriptor;
    console.log(`[rev-D9 2.8] rejets = ${JSON.stringify(d.rejectedByReason)}`);
    expect(d.rejectedByReason.LISTING_URL_MISSING).toBe(1);
    expect(d.listingCount, "l'annonce sans deeplink ne franchit pas l'adaptateur").toBe(1);
  });

  it('R-D9-30 — EX-DATA-35 : `co2Source` distingue WLTP, NEDC et INCONNU', () => {
    expect(norm({ itemId: 'c1', brand: 'Opel', model: 'Corsa', co2emissionWLTP: '118' }).co2Source).toBe('WLTP');
    expect(norm({ itemId: 'c2', brand: 'Opel', model: 'Corsa', co2emissionNEDC: '104' }).co2Source).toBe('NEDC');
    // Champ d'annonce à repli, dont la norme n'est PAS déclarée : `UNKNOWN`, jamais une norme devinée.
    const fallback = norm({ itemId: 'c3', brand: 'Opel', model: 'Corsa', co2emission: '118,5' });
    expect(fallback.co2EmissionsGPerKm).toBe(118.5);
    expect(fallback.co2Source).toBe('UNKNOWN');
    // Aucune valeur : la provenance reste INCONNUE et le champ est compté comme tel.
    const none = norm({ itemId: 'c4', brand: 'Opel', model: 'Corsa' });
    expect(none.co2Source).toBe('UNKNOWN');
    expect(none.unknownFields).toContain('co2Source');
  });
});

/* ================================================================================================
 * D8-20 — filtre `bodyType` à l'entrée du mode 2 (O15)
 * ============================================================================================== */

describe('D9 §2.8 — D8-20 : le filtre Carrosserie en mode 2', () => {
  it('R-D9-31 — les agrégats de MODÈLE déclarent `bodyType` non appliqué (O15)', async () => {
    const p = providerOn([
      makeRawListing({ itemId: 'm1', brand: 'Opel', model: 'Corsa', priceCents: 1000000, priceType: 'FIXED', body: 'Hatchback' }),
    ]);
    const handle = await p.openSnapshot();
    const result = (await p.fetchAggregates(handle, 'make=54;bodyType=1', 'MODEL', 54)) as {
      readonly rows: readonly ModelAggregate[];
      readonly unsupportedFilterIds: readonly string[];
    };
    expect(referenceData.bodyTypeIndexAvailable).toBe(false);
    expect(result.unsupportedFilterIds).toContain('bodyType');
  });
});

/* ================================================================================================
 * R3 — la garde reste intangible sur tout objet produit (P-1, EX-NFR-26)
 * ============================================================================================== */

describe('D9 §2.8 — R3 sur les champs ajoutés par la phase 2.8', () => {
  it('R-D9-32 — `scanForbiddenFields` ne signale rien sur une annonce portant TOUS les nouveaux champs', () => {
    const listing = norm({
      itemId: 'r3',
      brand: 'Opel',
      model: 'Corsa',
      priceCents: 1000000,
      priceType: 'FIXED',
      mileage: '90000',
      mileageUnit: 'km',
      btwVerrekenbaar: 'Ja',
      priorityProduct: 'DAGTOPPER',
      co2emissionWLTP: '118',
      fuelTypePrimary: '7',
    });
    expect(() => assertNoForbiddenFields(listing)).not.toThrow();
    expect(listing.vatDeductible).toBe(true);
    expect(listing.adTier).toBe('T50');
    expect(listing.co2Source).toBe('WLTP');
  });
});
