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

  // Dette DR-105 levée en 2.8 par D8-11 : EX-DATA-49 est étendue à E15..E17 et le garde les porte.
  // La sonde repasse de it.fails à it dans le commit de la correction (D8-19), sans être modifiée
  // dans son intention ni dans ses assertions.
  it('R-D2-02 — rejette les champs RGPD E15..E17 (vin, licencePlate, belgianCarpassMileageUrl)', () => {
    // EX-DATA-47 : « ces champs n'existent dans aucune table, aucun type, aucune colonne ».
    expect(scanForbiddenFields({ vin: 'WVWZZZ1KZ8W000001' }).length).toBeGreaterThan(0);
    expect(scanForbiddenFields({ licencePlate: '1-ABC-123' }).length).toBeGreaterThan(0);
    expect(scanForbiddenFields({ belgianCarpassMileageUrl: 'https://x' }).length).toBeGreaterThan(0);
  });

  it('R-D2-02 (formes imbriquées et aplaties) — même rejet quelle que soit l’écriture de la clé', () => {
    // `normalizeKey` replie la casse et retire `_`, `-`, espace : une entrée couvre les variantes.
    expect(scanForbiddenFields({ vehicle: { vin: 'WVWZZZ1KZ8W000001' } }).length).toBeGreaterThan(0);
    expect(scanForbiddenFields({ licence_plate: '1-ABC-123' }).length).toBeGreaterThan(0);
    expect(scanForbiddenFields({ 'licence-plate': '1-ABC-123' }).length).toBeGreaterThan(0);
    expect(scanForbiddenFields({ listing: { belgian_carpass_mileage_url: 'https://x' } }).length).toBeGreaterThan(0);
    // Les attributs autorisés d'EX-DATA-42 restent autorisés (le garde est élargi, pas relâché).
    expect(scanForbiddenFields({ sellerType: 1, regionCode: 0, postalCodePrefix2: '10' })).toHaveLength(0);
  });

  it('n’interdit pas les attributs vendeur autorisés (EX-DATA-42)', () => {
    const clean = { sellerType: 1, regionCode: 0, countryCode: 0, postalCodePrefix2: '10' };
    expect(scanForbiddenFields(clean)).toHaveLength(0);
    expect(validateListingRecord(clean).ok).toBe(true);
  });
});
