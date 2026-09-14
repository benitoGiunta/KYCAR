/**
 * KYCAR — Revue D9 · sonde 3 : re-cartographie du vocabulaire 2dehands → KYCAR
 * =================================================================================================
 * Vérifie que CHAQUE valeur des fixtures trouve une correspondance ou tombe dans la sentinelle
 * prévue par l'annexe A, et que les valeurs inconnues lèvent un DRAPEAU d'ingestion
 * (`KYCAR_INGEST_FLAG`, EX-DATA-45/46) au lieu d'un repli silencieux. Couvre carburant, boîte,
 * carrosserie, transmission, vendeur, norme Euro, pays (EX-DATA-40 / ADV-15) et région NUTS-2
 * (EX-DATA-53 / O14 : troncature du code postal).
 */
import { describe, expect, it } from 'vitest';
import { INGEST_FLAG_VALUES, type VocabularyName } from '../../../src/types/vocabularies';
import { mapListingToNormalized } from '../../../src/providers/tweedehands/normalize';
import {
  buildEuroStandardIndex,
  mapBodyType,
  mapDrivetrain,
  mapFuelCategory,
  mapSellerType,
  mapTransmission,
  mapUsageState,
} from '../../../src/providers/tweedehands/vocabularyMap';
import { loadRealReferenceData, makeRawListing } from '../../../src/providers/tweedehands/testFixtures';
import { ALL_LISTINGS, R3_TOKENS } from './fixtures';

const referenceData = loadRealReferenceData();
const euroIndex = buildEuroStandardIndex(referenceData);
const FLAG_CODES = new Set(INGEST_FLAG_VALUES.map((f) => f.code));
const norm = (o: Parameters<typeof makeRawListing>[0]) =>
  mapListingToNormalized(makeRawListing(o), referenceData, 'be', euroIndex);

describe('D9 · vocabulaire — codes produits et existence dans le référentiel réel', () => {
  it('tout code produit par les fixtures existe dans son vocabulaire KYCAR', () => {
    const checks: readonly [VocabularyName, (l: ReturnType<typeof norm>) => string | null][] = [
      ['KYCAR_FUEL_CATEGORY', (l) => l.fuelCategory],
      ['KYCAR_BODY_TYPE', (l) => l.bodyType],
      ['KYCAR_TRANSMISSION', (l) => l.transmission],
      ['KYCAR_DRIVETRAIN', (l) => l.drivetrain],
      ['KYCAR_USAGE_STATE', (l) => l.usageState],
      ['KYCAR_SELLER_TYPE', (l) => l.sellerType],
      ['KYCAR_EU_EMISSION_STANDARD', (l) => l.euEmissionStandard],
    ];
    for (const raw of ALL_LISTINGS) {
      const listing = mapListingToNormalized(raw, referenceData, 'be', euroIndex);
      for (const [vocabulary, read] of checks) {
        const code = read(listing);
        if (code === null) continue;
        expect(referenceData.decodeEnum(vocabulary, code), `${vocabulary} = ${code}`).toBeTruthy();
      }
    }
  });

  it('tout drapeau d’ingestion posé appartient à `KYCAR_INGEST_FLAG` (EX-DATA-45)', () => {
    for (const raw of ALL_LISTINGS) {
      const listing = mapListingToNormalized(raw, referenceData, 'be', euroIndex);
      for (const flag of listing.ingestFlags) expect(FLAG_CODES.has(flag), flag).toBe(true);
    }
  });

  it('une valeur d’énumération inconnue lève `ENUM_UNKNOWN` pour carburant / boîte / vendeur', () => {
    expect(norm({ itemId: 'a', brand: 'Opel', model: 'Corsa', fuel: 'Zonderbrandstof' }).ingestFlags).toContain('ENUM_UNKNOWN');
    expect(norm({ itemId: 'b', brand: 'Opel', model: 'Corsa', transmission: 'Onbekend' }).ingestFlags).toContain('ENUM_UNKNOWN');
    expect(norm({ itemId: 'c', brand: 'Opel', model: 'Corsa', advertiser: 'Handelaar' }).ingestFlags).toContain('ENUM_UNKNOWN');
  });
});

describe('D9 · vocabulaire — écarts constatés', () => {
  it('R-D9-04 — un hybride est mappé sur son carburant primaire, jamais sur les codes 2/3 de KYCAR_FUEL_CATEGORY', () => {
    // `REF-vocabulary-reconciliation.md` PIÈGE 1 / décision V1 : la catégorie de recherche possède
    // `2` (Électrique/Essence) et `3` (Électrique/Diesel). Les écraser sur `B`/`D` est exactement
    // l'erreur silencieuse que le document interdit : « une donnée fausse qui fausse ensuite toute
    // distribution par carburant ».
    expect(referenceData.decodeEnum('KYCAR_FUEL_CATEGORY', '2')).toBeTruthy();
    expect(mapFuelCategory('Hybride benzine/elektrisch')).toBe('2');
    expect(mapFuelCategory('Hybride diesel/elektrisch')).toBe('3');
  });

  it('R-D9-04b — la valeur « Autres » (code O) du vocabulaire n’est jamais produite', () => {
    expect(referenceData.decodeEnum('KYCAR_FUEL_CATEGORY', 'O')).toBeTruthy();
    expect(mapFuelCategory('Andere')).toBe('O');
  });

  it('R-D9-06 — carrosserie et état inconnus tombent dans un repli SILENCIEUX (aucun drapeau, aucun champ inconnu)', () => {
    const body = norm({ itemId: 'd', brand: 'Opel', model: 'Corsa', body: 'Iets ongewoons' });
    expect(mapBodyType('Iets ongewoons')).toBe('7'); // repli « Autres » — constaté
    expect(body.ingestFlags, 'carrosserie non reconnue sans drapeau').toContain('ENUM_UNKNOWN');

    const state = norm({ itemId: 'e', brand: 'Opel', model: 'Corsa', condition: 'Onbekend' });
    expect(mapUsageState('Onbekend')).toBe('U'); // repli « état d'origine » — constaté
    expect(state.ingestFlags, 'état non reconnu sans drapeau').toContain('ENUM_UNKNOWN');
  });

  it('R-D9-06b — transmission et norme Euro inconnues : `null` sans `ENUM_UNKNOWN` pour drivetrain/euronorm', () => {
    expect(mapDrivetrain('Onbekend')).toBeNull();
    expect(mapTransmission('Onbekend')).toBeNull();
    expect(mapSellerType('Handelaar')).toBeNull();
    const dt = norm({ itemId: 'f', brand: 'Opel', model: 'Corsa', driveTrain: 'Onbekend', euronormBE: 'Norme inconnue' });
    expect(dt.ingestFlags.filter((f) => f === 'ENUM_UNKNOWN').length, 'drivetrain + euronorm inconnus').toBe(2);
  });

  it('R-D9-14 — pays (EX-DATA-40 / ADV-15) : `location.countryAbbreviation` n’est jamais traduit en ISO', () => {
    const listing = norm({ itemId: 'g', brand: 'Opel', model: 'Corsa' });
    // `makeRawListing` pose toujours `countryAbbreviation: 'BE'`. L'annexe A exige un `countryCode`
    // ISO-3166-1 alpha-2, avec repli `INCONNU` + `MARKETPLACE_UNMAPPED` (ARB-60) pour le 9ᵉ code.
    expect(Object.keys(listing)).toContain('countryCode');
  });

  it('R-D9-14b — région NUTS-2 (EX-DATA-53 / O14) : aucune région produite, aucun drapeau `REGION_UNRESOLVED`', () => {
    const listing = norm({ itemId: 'h', brand: 'Opel', model: 'Corsa' });
    // Aucun code postal n'est servi par la surface autorisée (probe-LOT-N) : la conséquence attendue
    // est `regionCode = INCONNU` + `REGION_UNRESOLVED` au rapport d'ingestion, pas le silence.
    expect(listing.ingestFlags).toContain('REGION_UNRESOLVED');
  });

  it('O14 — aucun code postal exact ne survit à la normalisation (contrôle de non-régression)', () => {
    const listing = mapListingToNormalized(
      { ...makeRawListing({ itemId: 'i', brand: 'Opel', model: 'Corsa' }), location: { cityName: R3_TOKENS.city, countryAbbreviation: 'BE', postalCode: R3_TOKENS.postalCode } as never },
      referenceData,
      'be',
      euroIndex,
    );
    expect(JSON.stringify(listing).includes(R3_TOKENS.postalCode)).toBe(false);
    expect(JSON.stringify(listing).includes(R3_TOKENS.city)).toBe(false);
  });
});
