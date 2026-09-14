import { describe, expect, it } from 'vitest';

import { hasIngestFlag } from '../../types/vocabularies';
import { allocColumns } from './columnar';
import { auditDuplicateListings } from './dedupe';

/**
 * EX-DATA-15 / ARB-54 (DR-003, DR-004) : l'ordre total d'ingestion conserve la PREMIÈRE occurrence
 * d'un `listingId`, compte les suivantes, et pose `DUPLICATE_VALUE_CONFLICT` sur l'occurrence
 * conservée quand une occurrence écartée diverge sur l'un des quatre champs d'`ARB-54`.
 */

/** Écrit un `listingId` de 16 octets reconnaissable à l'indice `row`. */
function setId(ids: Uint8Array, row: number, marker: number): void {
  for (let b = 0; b < 16; b += 1) ids[row * 16 + b] = (marker + b) & 0xff;
}

describe('audit de doublons du lot synthétique (EX-DATA-15, ARB-54)', () => {
  it('aucun doublon : les compteurs sont NULS et aucun drapeau n’est posé', () => {
    const cols = allocColumns(3);
    setId(cols.listingId, 0, 1);
    setId(cols.listingId, 1, 40);
    setId(cols.listingId, 2, 90);
    const audit = auditDuplicateListings(cols, 3);
    expect(audit.duplicateListingCount).toBe(0);
    expect(audit.duplicateValueConflictCount).toBe(0);
    expect(audit.discardedRows).toEqual([]);
    expect(hasIngestFlag(cols.ingestFlags[0] as number, 'DUPLICATE_VALUE_CONFLICT')).toBe(false);
  });

  it('doublon EXACT : la seconde occurrence est écartée et comptée, sans conflit de valeur', () => {
    const cols = allocColumns(2);
    setId(cols.listingId, 0, 7);
    setId(cols.listingId, 1, 7);
    cols.priceEur[0] = 12_900;
    cols.priceEur[1] = 12_900;
    const audit = auditDuplicateListings(cols, 2);
    expect(audit.duplicateListingCount).toBe(1);
    expect(audit.discardedRows).toEqual([1]); // la PREMIÈRE occurrence est conservée
    expect(audit.duplicateValueConflictCount).toBe(0);
    expect(hasIngestFlag(cols.ingestFlags[0] as number, 'DUPLICATE_VALUE_CONFLICT')).toBe(false);
  });

  it('doublon à PRIX divergents : `DUPLICATE_VALUE_CONFLICT` sur l’occurrence conservée', () => {
    const cols = allocColumns(2);
    setId(cols.listingId, 0, 7);
    setId(cols.listingId, 1, 7);
    cols.priceEur[0] = 12_900;
    cols.priceEur[1] = 10_500;
    const audit = auditDuplicateListings(cols, 2);
    expect(audit.duplicateListingCount).toBe(1);
    expect(audit.duplicateValueConflictCount).toBe(1);
    expect(hasIngestFlag(cols.ingestFlags[0] as number, 'DUPLICATE_VALUE_CONFLICT')).toBe(true);
    expect(hasIngestFlag(cols.ingestFlags[1] as number, 'DUPLICATE_VALUE_CONFLICT')).toBe(false);
  });

  it('les quatre champs d’ARB-54 sont comparés, et EUX SEULS', () => {
    const conflicting = [
      ['priceEur', (c: ReturnType<typeof allocColumns>) => (c.priceEur[1] = 1)],
      ['priceStatus', (c: ReturnType<typeof allocColumns>) => (c.priceStatus[1] = 2)],
      ['mileageKm', (c: ReturnType<typeof allocColumns>) => (c.mileageKm[1] = 5)],
      ['firstRegistrationYearMonth', (c: ReturnType<typeof allocColumns>) => (c.firstRegistrationYearMonth[1] = 9)],
    ] as const;
    for (const [name, mutate] of conflicting) {
      const cols = allocColumns(2);
      setId(cols.listingId, 0, 3);
      setId(cols.listingId, 1, 3);
      mutate(cols);
      expect(auditDuplicateListings(cols, 2).duplicateValueConflictCount, name).toBe(1);
    }
    // Un champ HORS de la liste (couleur) ne fait pas un conflit de valeur.
    const cols = allocColumns(2);
    setId(cols.listingId, 0, 3);
    setId(cols.listingId, 1, 3);
    cols.bodyColor[1] = 11;
    expect(auditDuplicateListings(cols, 2).duplicateValueConflictCount).toBe(0);
  });

  it('trois occurrences du même identifiant : deux écartées, une seule conservée', () => {
    const cols = allocColumns(4);
    setId(cols.listingId, 0, 5);
    setId(cols.listingId, 1, 60);
    setId(cols.listingId, 2, 5);
    setId(cols.listingId, 3, 5);
    const audit = auditDuplicateListings(cols, 4);
    expect(audit.duplicateListingCount).toBe(2);
    expect(audit.discardedRows).toEqual([2, 3]);
  });
});
