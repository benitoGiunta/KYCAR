import { describe, expect, it } from 'vitest';
import {
  R3_FORBIDDEN_FIELD_NAMES,
  scanForbiddenFields,
  validateListingRecord,
} from '../../../src/types/validation';

/**
 * Sonde de revue D2 — garde R3 (`P-1`, `EX-DATA-47`/`49`, critère de succès D2 §7.1 n° 1).
 *
 * Variantes exigées par la mission : clé imbriquée, clé en casse différente, clé dans un tableau,
 * champs `sellerName` / `phone` / `email` / `address` / `postalCode` / `contactUrl`.
 */

describe('D2 — garde R3 : variantes de portage d’un champ interdit', () => {
  it('rejette un champ interdit à n’importe quelle profondeur (clé imbriquée)', () => {
    const issues = scanForbiddenFields({ a: { b: { c: { email: 'x@y.be' } } } });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe('a.b.c.email');
  });

  it('rejette un champ interdit quelle que soit la casse et la ponctuation du nom', () => {
    for (const rec of [{ PHONE: '1' }, { EMail: 'a@b.be' }, { postal_code: '1000' }, { 'Contact-Url': 'https://x' }]) {
      expect(scanForbiddenFields(rec).length).toBeGreaterThan(0);
    }
  });

  it('rejette un champ interdit porté par un élément de tableau, même imbriqué', () => {
    expect(scanForbiddenFields({ sellers: [{ email: 'a@b.be' }] })[0]?.path).toBe('sellers[0].email');
    expect(scanForbiddenFields({ a: [[{ zip: '1000' }]] })[0]?.path).toBe('a[0][0].zip');
  });

  it('rejette phone, email, address, postalCode, contactUrl à plat (E4, E5, E10, E8, E6)', () => {
    for (const rec of [
      { phone: '+3212345678' },
      { email: 'a@b.be' },
      { address: 'Rue X 1' },
      { postalCode: '1000' },
      { contactUrl: 'https://x' },
    ]) {
      expect(validateListingRecord(rec).ok).toBe(false);
    }
  });

  it('R-D2-01 — rejette sellerName, nom de vendeur à plat (E2/E3)', () => {
    // `seller.name` imbriqué est bien rejeté (FORBIDDEN_UNDER_SELLER) ; le nom canonique aplati
    // `sellerName`, lui, traverse le garde : R3_FORBIDDEN_FIELD_NAMES ne contient pas `sellername`.
    expect(R3_FORBIDDEN_FIELD_NAMES.has('sellername')).toBe(true);
    expect(scanForbiddenFields({ sellerName: 'Garage Dupont' }).length).toBeGreaterThan(0);
    expect(validateListingRecord({ sellerName: 'Garage Dupont' }).ok).toBe(false);
  });

  it('la forme imbriquée seller.name / seller.id est bien rejetée (référence de comparaison)', () => {
    expect(scanForbiddenFields({ seller: { name: 'Garage Dupont' } })).toHaveLength(1);
    expect(scanForbiddenFields({ seller: { id: 'dealer-42' } })).toHaveLength(1);
  });

  it('R-D2-02 — rejette les champs RGPD E15..E17 (vin, licencePlate, belgianCarpassMileageUrl)', () => {
    // EX-DATA-47 : « ces champs n'existent dans aucune table, aucun type, aucune colonne ».
    // EX-DATA-49 ne cite que E1..E14 ; le garde s'arrête donc avant E15..E17, qui restent
    // pourtant proscrits par EX-DATA-47 (RGPD).
    expect(scanForbiddenFields({ vin: 'WVWZZZ1KZ8W000001' }).length).toBeGreaterThan(0);
    expect(scanForbiddenFields({ licencePlate: '1-ABC-123' }).length).toBeGreaterThan(0);
    expect(scanForbiddenFields({ belgianCarpassMileageUrl: 'https://x' }).length).toBeGreaterThan(0);
  });

  it('n’interdit pas les attributs vendeur autorisés (EX-DATA-42)', () => {
    const clean = { sellerType: 1, regionCode: 0, countryCode: 0, postalCodePrefix2: '10' };
    expect(scanForbiddenFields(clean)).toHaveLength(0);
    expect(validateListingRecord(clean).ok).toBe(true);
  });
});
