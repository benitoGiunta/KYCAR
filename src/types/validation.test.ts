import { describe, expect, it } from 'vitest';
import { scanForbiddenFields, validateListingRecord } from './validation';

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
