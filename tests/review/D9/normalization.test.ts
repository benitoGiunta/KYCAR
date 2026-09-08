/**
 * KYCAR — Revue D9 · sonde 4 : normalisation (prix, kilométrage, année, puissance, version, dates)
 * =================================================================================================
 * Confronte `normalize.ts` aux décisions d'arbitrage de la phase 2.2 (ARB-15/ADV-04, ARB-16/ADV-16,
 * ARB-61/ADV-17) et aux bornes de plausibilité de l'annexe A (champs 7, 30-32, 35-36, 59).
 */
import { describe, expect, it } from 'vitest';
import { mapListingToNormalized } from '../../../src/providers/tweedehands/normalize';
import { buildEuroStandardIndex } from '../../../src/providers/tweedehands/vocabularyMap';
import { computeMetricRange } from '../../../src/providers/tweedehands/aggregate';
import { loadRealReferenceData, makeRawListing } from '../../../src/providers/tweedehands/testFixtures';

const referenceData = loadRealReferenceData();
const euroIndex = buildEuroStandardIndex(referenceData);
const norm = (o: Parameters<typeof makeRawListing>[0]) =>
  mapListingToNormalized(makeRawListing(o), referenceData, 'be', euroIndex);

describe('D9 · normalisation — comportements conformes', () => {
  it('les centimes deviennent des euros et `priceStatus` distingue QUOTED / MISSING (ARB-16)', () => {
    expect(norm({ itemId: 'a', brand: 'Opel', model: 'Corsa', priceCents: 1299900, priceType: 'FIXED' }).priceEur).toBe(12999);
    const zero = norm({ itemId: 'b', brand: 'Opel', model: 'Corsa', priceCents: 0, priceType: 'FIXED' });
    expect(zero.priceStatus).toBe('MISSING');
    expect(zero.priceEur).toBeNull();
    expect(zero.ingestFlags).toContain('PRICE_MISSING_UNDECLARED'); // ADV-16/ARB-16 : aucun rejet
  });

  it('le kilométrage et l’année à unité embarquée sont parsés (formats NL/FR)', () => {
    const listing = norm({ itemId: 'c', brand: 'Opel', model: 'Corsa', mileage: '90.000 km', constructionYear: '2019' });
    expect(listing.mileageKm).toBe(90000);
    expect(listing.modelYear).toBe(2019);
  });

  it('la puissance est lue en kW depuis `enginePowerKW` (unité canonique EX-DATA champ 35)', () => {
    expect(norm({ itemId: 'd', brand: 'Opel', model: 'Corsa', enginePowerKW: '85' }).powerKw).toBe(85);
  });
});

describe('D9 · normalisation — écarts constatés', () => {
  it('R-D9-02 — un prix < 250 € n’est ni marqué `PRICE_SENTINEL_ABSOLUTE` ni exclu de `V_price` (ADV-04 / ARB-15)', () => {
    const oneEuro = norm({ itemId: 'e', brand: 'Opel', model: 'Corsa', priceCents: 100, priceType: 'FIXED' });
    expect(oneEuro.priceEur).toBe(1);
    expect(oneEuro.ingestFlags, 'EX-DATA-19 : seuil unique 250 €').toContain('PRICE_SENTINEL_ABSOLUTE');
  });

  it('R-D9-02b — le prix sentinelle contamine la fourchette publiée (médiane et p05 de l’écran A)', () => {
    // Trois annonces à 10 000/12 000/15 000 € et une annonce-piège à 1 € : ARB-15 exige que la
    // sentinelle compte dans l'effectif mais n'entre NI dans la médiane NI dans les bornes.
    const prices = [10000, 12000, 15000, 1];
    const range = computeMetricRange(prices);
    expect(range.min, 'min de V_price sans la sentinelle').toBe(10000);
    expect(range.n, 'effectif métrique sans la sentinelle').toBe(3);
  });

  it('R-D9-03 — un prix hors borne haute (> 5 000 000 €) est conservé tel quel, sans `PRICE_OUT_OF_RANGE` (ARB-16)', () => {
    const collector = norm({ itemId: 'f', brand: 'Opel', model: 'Corsa', priceCents: 999999900, priceType: 'FIXED' });
    expect(collector.ingestFlags).toContain('PRICE_OUT_OF_RANGE');
    expect(collector.priceEur, 'valeur ramenée à INCONNU').toBeNull();
  });

  it('R-D9-05 — « Op aanvraag » / « NOTK » ne sont pas reconnus comme ON_REQUEST (seul le jeton anglais REQUEST l’est)', () => {
    expect(norm({ itemId: 'g', brand: 'Opel', model: 'Corsa', priceCents: 1200000, priceType: 'Op aanvraag' }).priceStatus).toBe('ON_REQUEST');
    expect(norm({ itemId: 'h', brand: 'Opel', model: 'Corsa', priceType: 'NOTK' }).priceStatus).toBe('ON_REQUEST');
    // Contrôle positif : le jeton reconnu fonctionne bien.
    expect(norm({ itemId: 'i', brand: 'Opel', model: 'Corsa', priceType: 'ON_REQUEST' }).priceStatus).toBe('ON_REQUEST');
  });

  it('R-D9-05b — un prix sur demande accompagné d’un montant ne lève pas `PRICE_ON_REQUEST_WITH_AMOUNT`', () => {
    const listing = norm({ itemId: 'j', brand: 'Opel', model: 'Corsa', priceCents: 1200000, priceType: 'ON_REQUEST' });
    expect(listing.priceStatus).toBe('ON_REQUEST');
    expect(listing.ingestFlags).toContain('PRICE_ON_REQUEST_WITH_AMOUNT');
  });

  it('R-D9-07 — aucune borne de plausibilité (annexe A champs 30/35/59) : km négatif, année absurde, puissance absurde passent', () => {
    const bad = norm({
      itemId: 'k',
      brand: 'Opel',
      model: 'Corsa',
      mileage: '-5 km',
      constructionYear: '1899',
      enginePowerKW: '99999',
    });
    expect(bad.ingestFlags).toContain('MILEAGE_OUT_OF_RANGE'); // 0 ≤ m ≤ 1 500 000
    expect(bad.ingestFlags).toContain('POWER_OUT_OF_RANGE'); // 1 ≤ p ≤ 9 999
    expect(bad.ingestFlags).toContain('FIRST_REG_OUT_OF_RANGE'); // 1900 ≤ y
  });

  it('R-D9-07b — `mileageKm = 0` ne lève pas `SUSPECT_ZERO_MILEAGE` (annexe A champ 59)', () => {
    const zeroKm = norm({ itemId: 'l', brand: 'Opel', model: 'Corsa', mileage: '0 km' });
    expect(zeroKm.mileageKm).toBe(0);
    expect(zeroKm.ingestFlags).toContain('SUSPECT_ZERO_MILEAGE');
  });

  it('R-D9-08 — l’axe « année » est bâti sur `modelYear`, ce qu’EX-DATA-25/27 interdisent', () => {
    // `constructionYear` de 2dehands est une année-modèle : l'annexe A impose `firstRegistrationYear`
    // comme SEUL pivot temporel des agrégats et interdit de l'imputer depuis `modelYear`.
    const listing = norm({ itemId: 'm', brand: 'Opel', model: 'Corsa', constructionYear: '2019' });
    expect(Object.keys(listing), 'champ 31 firstRegistrationYear absent').toContain('firstRegistrationYear');
  });

  it('R-D9-15 — aucun `modelVersionRaw`/`modelVersionClean` n’est produit (ADV-17 / ARB-61 sans objet)', () => {
    const listing = norm({ itemId: 'n', brand: 'Opel', model: 'Corsa' });
    expect(Object.keys(listing)).toContain('modelVersionClean');
  });

  it('R-D9-15b — la date d’annonce (`date` : « Vandaag ») n’est jamais normalisée', () => {
    const listing = norm({ itemId: 'o', brand: 'Opel', model: 'Corsa' });
    expect(Object.keys(listing)).toContain('listedAt');
  });
});
