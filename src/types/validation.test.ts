import { describe, expect, it } from 'vitest';
import {
  defaultModelYearMax,
  LISTING_NUMERIC_BOUNDS,
  LISTING_STRING_BOUNDS,
  scanForbiddenFields,
  scanForbiddenIdentifiers,
  validateListingRecord,
} from './validation';

/** Garde R3 structurel (P-1, EX-DATA-47/49) + validation de schéma. Critère de succès D2 #3. */
describe('garde R3', () => {
  it('rejette un enregistrement portant un identifiant de vendeur (seller.id, E1)', () => {
    const rec = { listingId: 'x', seller: { id: 'dealer-42' } };
    const res = validateListingRecord(rec);
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.code === 'R3_FORBIDDEN_FIELD')).toBe(true);
  });

  it('rejette companyName, contactName, téléphone, email (E2..E5)', () => {
    for (const rec of [
      { companyName: 'Garage Dupont' },
      { seller: { contactName: 'Jean Dupont' } },
      { phone: '+3212345678' },
      { email: 'a@b.be' },
    ]) {
      expect(validateListingRecord(rec).ok).toBe(false);
    }
  });

  it('rejette code postal exact, ville, rue, géolocalisation (E8..E11)', () => {
    const rec = { location: { zip: '1000', city: 'Bruxelles', street: 'Rue X', lat: 50.8, lon: 4.3 } };
    const issues = scanForbiddenFields(rec);
    expect(issues.map((i) => i.path).sort()).toEqual(
      ['location.city', 'location.lat', 'location.lon', 'location.street', 'location.zip'].sort(),
    );
  });

  it('rejette le texte libre description (E12/E13)', () => {
    expect(validateListingRecord({ description: 'contactez le 0475...' }).ok).toBe(false);
    expect(validateListingRecord({ condition: { description: 'nom + tel' } }).ok).toBe(false);
  });

  it('accepte sellerType, regionCode et postalCodePrefix2 (autorisés, EX-DATA-42)', () => {
    const clean = {
      listingId: '0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
      makeId: 9,
      modelId: 322,
      sellerType: 1,
      regionCode: 0,
      postalCodePrefix2: '10',
      priceEur: 15000,
      mileageKm: 80000,
    };
    expect(validateListingRecord(clean).ok).toBe(true);
    expect(scanForbiddenFields(clean)).toHaveLength(0);
  });
});

describe('validation de schéma', () => {
  it('signale une valeur hors bornes', () => {
    const res = validateListingRecord({ priceEur: 6_000_000 });
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.code === 'OUT_OF_RANGE')).toBe(true);
  });

  it('admet null pour un champ inconnu', () => {
    expect(validateListingRecord({ priceEur: null, mileageKm: null }).ok).toBe(true);
  });

  it('interdit la fuite de la sentinelle brute -1 dans la vue décodée (EX-DATA-120)', () => {
    const res = validateListingRecord({ priceEur: -1 });
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.code === 'RAW_SENTINEL_LEAK')).toBe(true);
  });
});

/**
 * DR-020 à DR-023, DR-027, DR-109, DR-113 — contrôles du dictionnaire (annexe A) que la validation
 * n'appliquait pas : forme de `listingId`, hôte de `listingUrl`, borne haute d'année-modèle liée à
 * l'observation, longueurs de chaîne, cohérence `priceStatus` / `priceEur`, identifiants R3 portés
 * en VALEUR d'un paramètre.
 */
describe('validation du dictionnaire — identité, hôte, bornes et longueurs', () => {
  it('annexe A # 1 : un listingId hors forme canonique est rejeté, la forme canonique est admise', () => {
    expect(validateListingRecord({ listingId: 'PAS-UN-UUID' }).ok).toBe(false);
    expect(validateListingRecord({ listingId: 'ABCDEF01-2345-4678-89ab-cdef01234567' }).ok).toBe(false);
    expect(validateListingRecord({ listingId: 'abcdef01-2345-4678-89ab-cdef01234567' }).ok).toBe(true);
  });

  it('annexe A # 2 : l’hôte de listingUrl doit appartenir au domaine du marketplace', () => {
    expect(validateListingRecord({ listingUrl: 'https://exemple.invalid/annonce' }).ok).toBe(false);
    expect(validateListingRecord({ listingUrl: 'https://www.autoscout24.be/offres/1' }).ok).toBe(true);
    expect(validateListingRecord({ listingUrl: 'https://autoscout24.co.uk/o/1' }).ok).toBe(true);
    // Un autre provider sert un autre hôte : le domaine attendu est un paramètre.
    expect(
      validateListingRecord({ listingUrl: 'https://www.2dehands.be/v/1' }, { listingUrlDomain: '2dehands' }).ok,
    ).toBe(true);
    expect(validateListingRecord({ listingUrl: 'pas-une-url' }).ok).toBe(false);
  });

  it('annexe A # 24 : la borne haute de l’année-modèle suit l’année d’observation', () => {
    expect(LISTING_NUMERIC_BOUNDS['modelYear']?.max).toBeLessThanOrEqual(new Date().getUTCFullYear() + 1);
    expect(defaultModelYearMax(2026)).toBe(2027);
    expect(validateListingRecord({ modelYear: 2101 }, { observedAtYear: 2026 }).ok).toBe(false);
    expect(validateListingRecord({ modelYear: 2027 }, { observedAtYear: 2026 }).ok).toBe(true);
    expect(validateListingRecord({ modelYear: 2028 }, { observedAtYear: 2026 }).ok).toBe(false);
  });

  it('les champs OBL sont contrôlés à la demande, jamais sur un enregistrement partiel', () => {
    expect(validateListingRecord({ priceEur: 15000 }).ok).toBe(true);
    const strict = validateListingRecord({ priceEur: 15000 }, { requireMandatory: true });
    expect(strict.ok).toBe(false);
    expect(strict.issues.filter((i) => i.code === 'MANDATORY_FIELD_MISSING')).toHaveLength(7);
  });

  it('annexe A # 2/20/21/22/45 : les longueurs maximales sont contrôlées', () => {
    expect(LISTING_STRING_BOUNDS['modelVersionClean']).toBe(80);
    expect(validateListingRecord({ modelVersionClean: 'a'.repeat(81) }).ok).toBe(false);
    expect(validateListingRecord({ modelVersionClean: 'a'.repeat(80) }).ok).toBe(true);
    expect(validateListingRecord({ modelVersionRaw: 'a'.repeat(122) }).ok).toBe(false);
    expect(validateListingRecord({ trimTokens: Array.from({ length: 13 }, () => 'X') }).ok).toBe(false);
    expect(validateListingRecord({ trimTokens: ['a'.repeat(25)] }).ok).toBe(false);
  });

  it('EX-DATA-32 : priceStatus et priceEur ne peuvent pas se contredire', () => {
    expect(validateListingRecord({ priceStatus: 'ON_REQUEST', priceEur: 15000 }).ok).toBe(false);
    expect(validateListingRecord({ priceStatus: 'QUOTED', priceEur: null }).ok).toBe(false);
    expect(validateListingRecord({ priceStatus: 'QUOTED', priceEur: 15000 }).ok).toBe(true);
    expect(validateListingRecord({ priceStatus: 'ON_REQUEST', priceEur: null }).ok).toBe(true);
  });

  it('EX-DATA-49 : un identifiant interdit porté en VALEUR d’un paramètre est détecté', () => {
    expect(scanForbiddenFields({ id: 'lat', param: 'lat' }).length).toBeGreaterThan(0);
    expect(scanForbiddenIdentifiers({ filters: [{ id: 'location', param: 'zip' }] }).length).toBeGreaterThan(0);
    // Un identifiant légitime ne déclenche rien.
    expect(scanForbiddenIdentifiers({ filters: [{ id: 'fuel', param: 'fuel' }] })).toHaveLength(0);
  });
});
