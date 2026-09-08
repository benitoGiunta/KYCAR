import { describe, expect, it } from 'vitest';
import { scanForbiddenFields } from '../../types/validation';
import { assertNoForbiddenFields, mapListingToNormalized } from './normalize';
import { buildEuroStandardIndex } from './vocabularyMap';
import { loadRealReferenceData, makeRawListing } from './testFixtures';

const referenceData = loadRealReferenceData();
const euroIndex = buildEuroStandardIndex(referenceData);

describe('normalize — filtrage R3 à l’ingestion (P-1, P-2, EX-NFR-26)', () => {
  it('projette une annonce propre vers le vocabulaire KYCAR', () => {
    const raw = makeRawListing({
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
    });

    const listing = mapListingToNormalized(raw, referenceData, 'be', euroIndex);

    expect(listing.listingId).toBe('m3f9c2a1-0000-0000-0000-000000000001');
    expect(listing.makeId).toBe(54); // Opel
    expect(listing.modelId).toBe(1918); // Corsa
    expect(listing.priceEur).toBe(12999);
    expect(listing.priceStatus).toBe('QUOTED');
    expect(listing.modelYear).toBe(2019);
    expect(listing.mileageKm).toBe(90000);
    expect(listing.fuelCategory).toBe('B');
    expect(listing.bodyType).toBe('1');
    expect(listing.transmission).toBe('M');
    expect(listing.drivetrain).toBe('F');
    expect(listing.usageState).toBe('U');
    expect(listing.sellerType).toBe('P');
    expect(listing.euEmissionStandard).toBe('6');
    expect(listing.powerKw).toBe(85);
    expect(listing.co2EmissionsGPerKm).toBe(118.5);
    expect(listing.seatCount).toBe(5);
    expect(listing.doorCount).toBe(5);
  });

  it('ne porte, par construction, aucune des propriétés R3 (garde D2 : zéro incident)', () => {
    const raw = makeRawListing({ itemId: 'x1', brand: 'Opel', model: 'Corsa', advertiser: 'Bedrijf' });
    const listing = mapListingToNormalized(raw, referenceData, 'be', euroIndex);
    expect(scanForbiddenFields(listing)).toEqual([]);
    expect(() => assertNoForbiddenFields(listing)).not.toThrow();
  });

  it('preuve du filtrage à l’ingestion : une entrée brute réaliste porte des champs R3, la sortie normalisée n’en porte aucun', () => {
    const raw = makeRawListing({
      itemId: 'y2',
      brand: 'Volkswagen',
      model: 'Golf',
      advertiser: 'Particulier',
      extraForbidden: {
        seller: { id: 'seller-42', contactName: 'Jan Peeters', phone: '+32471234567' },
        // La charge réelle documentée par FINDING-allowed-surface.md §2.5 porte un nom de personne
        // physique dans un champ de contact vendeur — reproduit ici pour prouver que le garde R3
        // le détecte sur l'ENTRÉE et que l'adaptateur ne le recopie jamais en SORTIE.
      },
    });

    // Le garde D2 détecte bien le champ interdit sur l'entrée brute (preuve qu'il ne s'agit pas
    // d'un test qui ne teste rien).
    const rawIssues = scanForbiddenFields(raw);
    expect(rawIssues.length).toBeGreaterThan(0);
    expect(rawIssues.some((i) => i.path.includes('contactName'))).toBe(true);
    expect(rawIssues.some((i) => i.path.includes('phone'))).toBe(true);

    // La sortie normalisée — la SEULE chose qui franchit l'adaptateur — n'en porte aucun.
    const listing = mapListingToNormalized(raw, referenceData, 'be', euroIndex);
    expect(scanForbiddenFields(listing)).toEqual([]);
  });

  it('ne recopie jamais la géolocalisation ni la ville (R3 E9/E11), même absentes du type déclaré', () => {
    const raw = makeRawListing({ itemId: 'z3', brand: 'Opel', model: 'Astra' });
    // `makeRawListing` pose toujours `location.cityName`/`lat`/`long` (fidèle à la forme réelle,
    // probe-LOT-N.md) : la sortie ne doit littéralement porter aucune de ces clés.
    const listing = mapListingToNormalized(raw, referenceData, 'be', euroIndex);
    const keys = Object.keys(listing);
    expect(keys).not.toContain('cityName');
    expect(keys).not.toContain('location');
    expect(keys).not.toContain('lat');
    expect(keys).not.toContain('long');
    // `regionCode` (NUTS-2) est AUTORISÉ par EX-DATA-42 et porté par la sortie depuis DR-046 ; il
    // vaut INCONNU sur cette surface (aucun code postal servi) et l'annonce porte
    // `REGION_UNRESOLVED`. Ce qui reste interdit, c'est le code postal EXACT et la ville.
    expect(listing.regionCode).toBeNull();
    expect(listing.ingestFlags).toContain('REGION_UNRESOLVED');
    expect(JSON.stringify(listing)).not.toContain('Anvers');
  });

  it('marque non résolue → makeId null, exclue de toute agrégation par marque', () => {
    const raw = makeRawListing({ itemId: 'w4', brand: 'MarqueInconnueXYZ', model: 'Zzz' });
    const listing = mapListingToNormalized(raw, referenceData, 'be', euroIndex);
    expect(listing.makeId).toBeNull();
    expect(listing.modelId).toBe(0);
  });

  it('modèle non résolu (marque connue) → modelId 0 (EX-DATA-72), drapeau MODEL_UNRESOLVED', () => {
    const raw = makeRawListing({ itemId: 'v5', brand: 'Opel', model: 'ModeleFantaisiste' });
    const listing = mapListingToNormalized(raw, referenceData, 'be', euroIndex);
    expect(listing.makeId).toBe(54);
    expect(listing.modelId).toBe(0);
    expect(listing.ingestFlags).toContain('MODEL_UNRESOLVED');
  });

  it('prix sur demande et prix absent sont distingués (KYCAR_PRICE_STATUS)', () => {
    const onRequest = mapListingToNormalized(
      makeRawListing({ itemId: 'p1', brand: 'Opel', model: 'Corsa', priceType: 'ON_REQUEST' }),
      referenceData,
      'be',
      euroIndex,
    );
    expect(onRequest.priceStatus).toBe('ON_REQUEST');
    expect(onRequest.priceEur).toBeNull();

    const missing = mapListingToNormalized(
      makeRawListing({ itemId: 'p2', brand: 'Opel', model: 'Corsa' }),
      referenceData,
      'be',
      euroIndex,
    );
    expect(missing.priceStatus).toBe('MISSING');
    expect(missing.priceEur).toBeNull();
  });
});
