import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  servesMode2,
  STRINGS_PER_ROW,
  type AggregateResult,
  type DataProvider,
  type ListingColumnBatch,
  type MakeAggregate,
  type ProviderCapabilities,
  type SnapshotHandle,
} from '../../../src/providers/DataProvider';
import { LISTING_COLUMNS } from '../../../src/types/columns';

/**
 * Sonde de revue D2 — `DataProvider` : identité octet à octet avec l'interface gelée de la phase
 * 2.3 (critère S2 de 2.3), mock-impl `SERVED` / `UNAVAILABLE` et cohérence de `servesMode2()`
 * avec la capacité déclarée (critère de succès D2 §7.1 n° 3), alignement du descripteur colonnaire.
 */

const gelé = new URL('../../../docs/plans/DataProvider.ts', import.meta.url);
const intégré = new URL('../../../src/providers/DataProvider.ts', import.meta.url);

describe('D2 — `DataProvider.ts` intégré = interface gelée, octet à octet', () => {
  it('les deux fichiers ont les mêmes octets (SHA-256 et taille identiques)', () => {
    const a = readFileSync(gelé);
    const b = readFileSync(intégré);
    expect(b.length).toBe(a.length);
    expect(createHash('sha256').update(b).digest('hex')).toBe(createHash('sha256').update(a).digest('hex'));
    expect(Buffer.compare(a, b)).toBe(0);
  });
});

const DESCRIPTOR: SnapshotHandle = {
  descriptor: {
    snapshotId: 'be-20260101T000000Z',
    marketplace: 'be',
    capturedAt: '2026-01-01T00:00:00Z',
    sourceKind: 'SYNTHETIC',
    providerVersion: 'rev-D2-1',
    listingCount: 0,
    announcedListingCount: null,
    rejectedCount: 0,
    rejectedByReason: {},
    duplicateListingCount: 0,
    duplicateValueConflictCount: 0,
    unknownCountByField: {},
    ingestFlagCounts: {},
    versionStrippedRate: 0,
    coverageNote: null,
  },
};

const vide = (): AggregateResult<MakeAggregate> => ({
  snapshotId: DESCRIPTOR.descriptor.snapshotId,
  selection: 'FULL:EMPTY',
  selectionCount: 0,
  rows: [],
  unsupportedFilterIds: [],
});

const mode1Base = {
  openSnapshot: (): Promise<SnapshotHandle> => Promise.resolve(DESCRIPTOR),
  closeSnapshot: (): Promise<void> => Promise.resolve(),
  fetchBaselineAggregates: (): Promise<AggregateResult<MakeAggregate>> => Promise.resolve(vide()),
  fetchAggregates: (): Promise<AggregateResult<MakeAggregate>> => Promise.resolve(vide()),
  fetchSelectionCount: (): Promise<number> => Promise.resolve(0),
};

function batchVide(): ListingColumnBatch {
  const u8 = new Uint8Array(0);
  return {
    snapshotId: DESCRIPTOR.descriptor.snapshotId,
    localDatasetKey: 'FULL',
    rowCount: 0,
    listingId: u8,
    priceEur: new Int32Array(0),
    mileageKm: new Int32Array(0),
    firstRegistrationYearMonth: new Int32Array(0),
    modelId: new Int32Array(0),
    makeId: new Int32Array(0),
    modelYear: new Int16Array(0),
    powerKw: new Int16Array(0),
    co2EmissionsGPerKmX10: new Int16Array(0),
    consumptionCombinedL100KmX10: new Int16Array(0),
    electricRangeKm: new Int16Array(0),
    fuelCategory: u8,
    bodyType: u8,
    transmission: u8,
    drivetrain: u8,
    offerType: u8,
    usageState: u8,
    sellerType: u8,
    regionCode: u8,
    countryCode: u8,
    priceStatus: u8,
    priceEvaluationCategory: u8,
    adTier: u8,
    bodyColor: u8,
    upholsteryType: u8,
    euEmissionStandard: u8,
    doorCount: u8,
    seatCount: u8,
    previousOwnerCount: u8,
    imageCount: u8,
    vatDeductible: u8,
    booleanFlags: new Uint16Array(0),
    ingestFlags: new Uint32Array(0),
    stringBlob: u8,
    stringOffsets: new Uint32Array(0),
  };
}

/** Mock SERVED : capacité `SERVED` ET méthode `fetchListingColumns` présente. */
const served: DataProvider = {
  ...mode1Base,
  describe: (): ProviderCapabilities => ({
    providerId: 'rev-d2-served',
    providerVersion: 'rev-D2-1',
    marketplace: 'be',
    sourceKind: 'SYNTHETIC',
    mode1: { source: 'LISTINGS' },
    mode2: { kind: 'SERVED', maxSampleSize: 1000 },
  }),
  fetchListingColumns: (): Promise<ListingColumnBatch> => Promise.resolve(batchVide()),
};

/** Mock UNAVAILABLE : mode 1 seul, aucune méthode de mode 2 (profil 2dehands, D9). */
const unavailable: DataProvider = {
  ...mode1Base,
  describe: (): ProviderCapabilities => ({
    providerId: 'rev-d2-unavailable',
    providerVersion: 'rev-D2-1',
    marketplace: 'nl',
    sourceKind: 'REAL',
    mode1: { source: 'AGGREGATE_SURFACE' },
    mode2: { kind: 'UNAVAILABLE', reason: 'BIASED_SAMPLE', fallback: 'SYNTHETIC', detail: 'revue' },
  }),
};

/** Mock incohérent : capacité `SERVED` DÉCLARÉE mais méthode absente. */
const incohérent: DataProvider = {
  ...mode1Base,
  describe: (): ProviderCapabilities => ({
    providerId: 'rev-d2-menteur',
    providerVersion: 'rev-D2-1',
    marketplace: 'be',
    sourceKind: 'SYNTHETIC',
    mode1: { source: 'LISTINGS' },
    mode2: { kind: 'SERVED', maxSampleSize: 10 },
  }),
};

describe('D2 — mock DataProvider et cohérence de servesMode2()', () => {
  it('le mock SERVED est reconnu et sert un batch colonnaire', async () => {
    expect(servesMode2(served)).toBe(true);
    if (servesMode2(served)) {
      const batch = await served.fetchListingColumns(DESCRIPTOR, 'FULL');
      expect(batch.rowCount).toBe(0);
      expect(batch.localDatasetKey).toBe('FULL');
    }
  });

  it('le mock UNAVAILABLE est refusé par le garde et n’expose pas fetchListingColumns', () => {
    expect(servesMode2(unavailable)).toBe(false);
    expect(unavailable.fetchListingColumns).toBeUndefined();
    expect(unavailable.describe().mode2.kind).toBe('UNAVAILABLE');
  });

  it('capacité SERVED déclarée sans la méthode : le garde refuse (pas de faux positif)', () => {
    expect(incohérent.describe().mode2.kind).toBe('SERVED');
    expect(servesMode2(incohérent)).toBe(false);
  });

  it('le batch colonnaire ne porte aucune propriété vendeur identifiante (R3, EX-DATA-122)', () => {
    const clés = Object.keys(batchVide()).map((k) => k.toLowerCase());
    for (const interdit of ['sellerid', 'sellername', 'zip', 'postalcode', 'city', 'street', 'lat', 'lon', 'phone', 'email', 'description', 'cid']) {
      expect(clés).not.toContain(interdit);
    }
  });

  it('le descripteur `LISTING_COLUMNS` de D2 est aligné sur `ListingColumnBatch`, colonne par colonne', () => {
    const clésBatch = new Set(Object.keys(batchVide()));
    // Les 3 champs d'en-tête et la zone de chaînes ne sont pas des colonnes décrites.
    for (const meta of ['snapshotId', 'localDatasetKey', 'rowCount', 'stringBlob', 'stringOffsets']) {
      clésBatch.delete(meta);
    }
    const décrites = LISTING_COLUMNS.filter((c) => c.physical !== 'string').map((c) => c.name);
    expect([...clésBatch].sort()).toEqual([...décrites].sort());
    expect(STRINGS_PER_ROW).toBe(5);
  });
});
