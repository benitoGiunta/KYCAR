import { describe, expect, it } from 'vitest';
import {
  servesMode2,
  type AggregateResult,
  type DataProvider,
  type ListingColumnBatch,
  type MakeAggregate,
  type ProviderCapabilities,
  type SnapshotHandle,
} from './DataProvider';

/**
 * Mock-impl de `DataProvider` (critère de succès D2 #5) : un cas SERVED (mode 2 servi, méthode
 * `fetchListingColumns` présente) et un cas UNAVAILABLE (méthode absente). Le garde `servesMode2()`
 * doit trancher selon la capacité déclarée.
 */

const DESCRIPTOR: SnapshotHandle = {
  descriptor: {
    snapshotId: 'be-20260101T000000Z',
    marketplace: 'be',
    capturedAt: '2026-01-01T00:00:00Z',
    sourceKind: 'SYNTHETIC',
    providerVersion: 'mock-1',
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

function emptyMakeResult(): AggregateResult<MakeAggregate> {
  return { snapshotId: DESCRIPTOR.descriptor.snapshotId, selection: 'FULL:EMPTY', selectionCount: 0, rows: [] };
}

/** Base mode 1 commune aux deux mocks (méthodes obligatoires). */
const mode1Base = {
  openSnapshot: (): Promise<SnapshotHandle> => Promise.resolve(DESCRIPTOR),
  closeSnapshot: (): Promise<void> => Promise.resolve(),
  fetchBaselineAggregates: (): Promise<AggregateResult<MakeAggregate>> => Promise.resolve(emptyMakeResult()),
  fetchAggregates: (): Promise<AggregateResult<MakeAggregate>> => Promise.resolve(emptyMakeResult()),
  fetchSelectionCount: (): Promise<number> => Promise.resolve(0),
};

/** Provider SERVED : sert le mode 2. */
const servedProvider: DataProvider = {
  ...mode1Base,
  describe: (): ProviderCapabilities => ({
    providerId: 'mock-served',
    providerVersion: 'mock-1',
    marketplace: 'be',
    sourceKind: 'SYNTHETIC',
    mode1: { source: 'LISTINGS' },
    mode2: { kind: 'SERVED', maxSampleSize: 1000 },
  }),
  fetchListingColumns: (_h, _t): Promise<ListingColumnBatch> =>
    Promise.resolve({
      snapshotId: DESCRIPTOR.descriptor.snapshotId,
      localDatasetKey: 'FULL',
      rowCount: 0,
      listingId: new Uint8Array(0),
      priceEur: new Int32Array(0),
      mileageKm: new Int32Array(0),
      firstRegistrationYearMonth: new Int32Array(0),
      modelId: new Int32Array(0),
      makeId: new Int16Array(0),
      modelYear: new Int16Array(0),
      powerKw: new Int16Array(0),
      co2EmissionsGPerKmX10: new Int16Array(0),
      consumptionCombinedL100KmX10: new Int16Array(0),
      electricRangeKm: new Int16Array(0),
      fuelCategory: new Uint8Array(0),
      bodyType: new Uint8Array(0),
      transmission: new Uint8Array(0),
      drivetrain: new Uint8Array(0),
      offerType: new Uint8Array(0),
      usageState: new Uint8Array(0),
      sellerType: new Uint8Array(0),
      regionCode: new Uint8Array(0),
      countryCode: new Uint8Array(0),
      priceStatus: new Uint8Array(0),
      priceEvaluationCategory: new Uint8Array(0),
      adTier: new Uint8Array(0),
      bodyColor: new Uint8Array(0),
      upholsteryType: new Uint8Array(0),
      euEmissionStandard: new Uint8Array(0),
      doorCount: new Uint8Array(0),
      seatCount: new Uint8Array(0),
      previousOwnerCount: new Uint8Array(0),
      imageCount: new Uint8Array(0),
      booleanFlags: new Uint16Array(0),
      ingestFlags: new Uint16Array(0),
      stringBlob: new Uint8Array(0),
      stringOffsets: new Uint32Array(0),
    }),
};

/** Provider UNAVAILABLE : mode 1 seul, `fetchListingColumns` absente (comme 2dehands, D9). */
const unavailableProvider: DataProvider = {
  ...mode1Base,
  describe: (): ProviderCapabilities => ({
    providerId: 'mock-unavailable',
    providerVersion: 'mock-1',
    marketplace: 'nl',
    sourceKind: 'REAL',
    mode1: { source: 'AGGREGATE_SURFACE' },
    mode2: {
      kind: 'UNAVAILABLE',
      reason: 'BIASED_SAMPLE',
      fallback: 'SYNTHETIC',
      detail: 'Échantillon biaisé par la publicité — distributions sur dataset synthétique.',
    },
  }),
};

describe('mock DataProvider + servesMode2', () => {
  it('EX-DATA: le provider SERVED est reconnu et expose fetchListingColumns', async () => {
    expect(servesMode2(servedProvider)).toBe(true);
    if (servesMode2(servedProvider)) {
      const batch = await servedProvider.fetchListingColumns(DESCRIPTOR, 'FULL');
      expect(batch.localDatasetKey).toBe('FULL');
      expect(batch.rowCount).toBe(0);
      // Garantie R3 structurelle : aucune propriété vendeur identifiante dans le batch.
      expect(Object.keys(batch)).not.toContain('sellerId');
      expect(Object.keys(batch)).not.toContain('zip');
    }
  });

  it('le provider UNAVAILABLE est refusé par le garde et n’a pas fetchListingColumns', () => {
    expect(servesMode2(unavailableProvider)).toBe(false);
    expect(unavailableProvider.fetchListingColumns).toBeUndefined();
  });
});
