import { describe, expect, it } from 'vitest';
import { INGEST_FLAG_VALUES } from '../../../src/types/vocabularies';
import type { Snapshot } from '../../../src/types/entities';
import * as types from '../../../src/types/index';

/**
 * Sonde de revue D2 — `ADV-05` / `ARB-54` : doublon exact d'un `listingId` avec deux prix.
 * Décision ARB-54 : (a) un ORDRE D'INGESTION total `(pageIndex, positionDansPage)`, la première
 * occurrence conservée ; (b) le drapeau `DUPLICATE_VALUE_CONFLICT` sur l'occurrence conservée ;
 * (c) le compteur `Snapshot.duplicateValueConflictCount`.
 * Ce que la couche types (D2) doit porter, et ce qu'elle porte réellement.
 */

describe('D2 — ADV-05 / ARB-54 : mécanisme de dédoublonnage dans la couche types', () => {
  it('(b) le drapeau DUPLICATE_VALUE_CONFLICT existe et est adressable en bit (≤ 15)', () => {
    const bit = INGEST_FLAG_VALUES.findIndex((v) => v.code === 'DUPLICATE_VALUE_CONFLICT');
    expect(bit).toBeGreaterThanOrEqual(0);
    expect(bit).toBeLessThanOrEqual(15);
  });

  it('(c) `Snapshot` porte les deux compteurs d’ARB-54 / EX-DATA-15', () => {
    const s: Snapshot = {
      snapshotId: 'be-20260101T000000Z',
      marketplace: 'be',
      capturedAt: '2026-01-01T00:00:00Z',
      sourceKind: 'REAL',
      providerVersion: 'rev-D2',
      listingCount: 2,
      announcedListingCount: null,
      rejectedCount: 0,
      rejectedByReason: {},
      duplicateListingCount: 1,
      duplicateValueConflictCount: 1,
      unknownCountByField: {},
      ingestFlagCounts: { DUPLICATE_VALUE_CONFLICT: 1 },
      versionStrippedRate: 0,
      coverageNote: null,
    };
    expect(s.duplicateListingCount).toBe(1);
    expect(s.duplicateValueConflictCount).toBe(1);
    expect(s.ingestFlagCounts['DUPLICATE_VALUE_CONFLICT']).toBe(1);
  });

  it('R-D2-23 — (a) la clé de dédoublonnage `(snapshotId, listingId)` est exposée par D2', () => {
    // EX-DATA-15 : `(snapshotId, listingId)` est la clé primaire de `Listing`, et ARB-54 en fait le
    // pivot du dédoublonnage. D2 expose `modelKey(makeId, modelId)` pour `Model` mais aucune
    // fonction de clé pour `Listing` : chaque provider (D3, D9) réinvente la sienne.
    const listingKey = (types as unknown as Record<string, unknown>)['listingKey'];
    expect(typeof listingKey).toBe('function');
  });

  it('R-D2-24 — (a) les champs comparés pour détecter le conflit sont nommés par D2', () => {
    // ARB-54 fixe la liste EXACTE des champs dont la divergence lève le drapeau :
    // `priceEur`, `priceStatus`, `mileageKm`, `firstRegistrationYearMonth`. Aucun symbole de D2
    // ne porte cette liste : elle est reconstituée à la main par chaque adaptateur.
    const champs = (types as unknown as Record<string, unknown>)['DUPLICATE_CONFLICT_FIELDS'];
    expect(champs).toBeDefined();
  });
});
