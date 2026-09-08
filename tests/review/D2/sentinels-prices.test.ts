import { describe, expect, it } from 'vitest';
import {
  ENUM_UNKNOWN_BYTE,
  MODEL_ID_UNRESOLVED,
  NUMERIC_UNKNOWN,
  encodeEnumByte,
  encodeNumeric,
  isEnumByteKnown,
  isNumericKnown,
  readEnumByte,
  readNumeric,
} from '../../../src/types/sentinels';
import { validateListingRecord } from '../../../src/types/validation';
import { PRICE_STATUS_VALUES } from '../../../src/types/vocabularies';

/**
 * Sonde de revue D2 — sentinelles typées (`EX-DATA-119`/`120`) et cas pathologiques de prix
 * `ADV-04` (prix 1 €, décision `ARB-15`) et `ADV-16` (prix 0 €, décision `ARB-16`).
 */

describe('D2 — sentinelles typées (EX-DATA-120)', () => {
  it('les trois constantes valent -1 / 255 / 0 et se lisent en null (jamais 0)', () => {
    expect(NUMERIC_UNKNOWN).toBe(-1);
    expect(ENUM_UNKNOWN_BYTE).toBe(255);
    expect(MODEL_ID_UNRESOLVED).toBe(0);
    expect(readNumeric(-1)).toBeNull();
    expect(readEnumByte(255)).toBeNull();
    // 0 est une valeur LÉGITIME de mileageKm / co2 / previousOwnerCount, jamais un inconnu.
    expect(readNumeric(0)).toBe(0);
    expect(readEnumByte(0)).toBe(0);
    expect(isNumericKnown(0)).toBe(true);
    expect(isEnumByteKnown(0)).toBe(true);
  });

  it('l’encodage refuse les valeurs qui collisionneraient avec la sentinelle', () => {
    expect(encodeNumeric(null)).toBe(-1);
    expect(encodeNumeric(undefined)).toBe(-1);
    expect(encodeNumeric(0)).toBe(0);
    expect(() => encodeNumeric(-2)).toThrow(RangeError);
    expect(encodeEnumByte(null)).toBe(255);
    expect(encodeEnumByte(254)).toBe(254);
    expect(() => encodeEnumByte(255)).toThrow(RangeError);
    expect(() => encodeEnumByte(-1)).toThrow(RangeError);
  });
});

describe('D2 — ADV-04 / ARB-15 : prix à 1 €', () => {
  it('priceEur = 1 est une valeur VALIDE du schéma (bornes 1..5 000 000, EX-DATA-7)', () => {
    // ARB-15 : l'annonce compte dans tout effectif, et l'exclusion (< 250 €,
    // `PRICE_SENTINEL_ABSOLUTE`) porte sur V_price, pas sur la validité du champ.
    expect(validateListingRecord({ priceEur: 1 }).ok).toBe(true);
  });

  it('R-D2-08 — le seuil de sentinelle absolue 250 € (EX-DATA-19) est exprimé dans la couche types', () => {
    // ARB-15/EX-DATA-19 : `priceEur < 250` ⇒ `ingestFlags += PRICE_SENTINEL_ABSOLUTE` et exclusion
    // de V_price. Aucun symbole de D2 ne porte ce seuil : ni constante, ni prédicat.
    const types = import.meta.glob('../../../src/types/*.ts', { eager: true, query: '?raw', import: 'default' });
    const sources = Object.entries(types).filter(([p]) => !p.endsWith('.test.ts'));
    const withThreshold = sources.filter(([, src]) => /\b250\b/.test(src as string));
    expect(withThreshold.length).toBeGreaterThan(0);
  });
});

describe('D2 — ADV-16 / ARB-16 : prix à 0 € et prix hors borne haute', () => {
  it('priceEur = 0 n’est jamais une valeur métier : la vue décodée porte null (INCONNU)', () => {
    // ARB-16 : `p = 0` ⇒ `priceStatus = MISSING`, `priceEur = INCONNU`. La vue décodée porte
    // donc `null`, admis par la validation.
    expect(validateListingRecord({ priceEur: null }).ok).toBe(true);
  });

  it('priceEur = 0 dans une vue décodée est signalé hors bornes (borne basse 1)', () => {
    const res = validateListingRecord({ priceEur: 0 });
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.code === 'OUT_OF_RANGE')).toBe(true);
  });

  it('priceEur > 5 000 000 est signalé hors bornes, sans notion de rejet d’annonce', () => {
    const res = validateListingRecord({ priceEur: 9_999_999 });
    expect(res.ok).toBe(false);
    expect(res.issues.every((i) => i.code === 'OUT_OF_RANGE')).toBe(true);
    // ARB-16 : « aucune valeur de prix ne provoque plus le rejet de l'annonce entière ».
    // `validateListingRecord` n'émet pas de verdict de rejet d'annonce : elle décrit le champ.
    expect(res.issues.map((i) => i.path)).toEqual(['priceEur']);
  });

  it('la sentinelle brute -1 ne peut pas fuir dans la vue décodée (EX-DATA-120)', () => {
    expect(validateListingRecord({ priceEur: -1 }).issues.some((i) => i.code === 'RAW_SENTINEL_LEAK')).toBe(true);
  });
});

describe('D2 — ON_REQUEST / MISSING (EX-DATA-16 à 18, §A.5.3)', () => {
  it('KYCAR_PRICE_STATUS porte exactement QUOTED, ON_REQUEST, MISSING', () => {
    expect(PRICE_STATUS_VALUES.map((v) => v.code)).toEqual(['QUOTED', 'ON_REQUEST', 'MISSING']);
  });

  it('R-D2-09 — la couche types porte la règle « priceStatus ≠ QUOTED ⇒ priceEur INCONNU »', () => {
    // EX-DATA-16(b)/EX-DATA-18 : `ON_REQUEST` et `MISSING` sont deux états distincts, et aucun
    // des deux ne porte de montant. D2 ne relie jamais `priceStatus` à `priceEur` : un
    // enregistrement contradictoire (statut sans montant / montant sans statut) est accepté.
    const contradictoire = { priceStatus: 'ON_REQUEST', priceEur: 15000 };
    expect(validateListingRecord(contradictoire).ok).toBe(false);
  });
});
