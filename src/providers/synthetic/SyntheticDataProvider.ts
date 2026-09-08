/**
 * KYCAR — `SyntheticDataProvider` (lot D3)
 * =================================================================================================
 * Implémentation `DataProvider` de source SYNTHETIC (EX-DATA-107), servant le mode 1 ET le mode 2
 * (ARCHITECTURE §6.3) : `sourceKind = 'SYNTHETIC'`, `mode1.source = 'LISTINGS'`,
 * `mode2 = SERVED (dataset complet, outliers injectés)`.
 *
 *   - Génère à l'ouverture du snapshot un dataset colonnaire complet de distributions plausibles
 *     (`generate.ts`), déterministe à graine fixée.
 *   - Sert les agrégats mode 1 par une agrégation interne correcte (`aggregate.ts`).
 *   - Sert l'échantillon fin mode 2 (`fetchListingColumns` / `fetchListingsByIds`) sur ce dataset.
 *   - Émet la vérité terrain des outliers injectés (`getGroundTruthOutliers`) pour D4.
 *
 * `sourceKind = SYNTHETIC` est propagé jusqu'au `SnapshotDescriptor` : jamais confondable avec du réel.
 */

import type {
  AggregateLevel,
  AggregateResult,
  DataProvider,
  ListingColumnBatch,
  MakeAggregate,
  ModelAggregate,
  OpenSnapshotRequest,
  ProviderCapabilities,
  SelectionQuery,
  SnapshotDescriptor,
  SnapshotHandle,
  TSelectionQuery,
} from '../DataProvider';
import type { ReferenceData } from '../../types/reference';
import { INGEST_FLAG_VALUES } from '../../types/vocabularies';
import { NUMERIC_UNKNOWN } from '../../types/sentinels';
import { FULL, HASH_LENGTH } from '../../types/selection';
import { sha256Hex } from '../../types/sha256';
import { aggregateByMake, aggregateByModel } from './aggregate';
import { subsetBatch } from './columnar';
import {
  DEFAULT_LISTING_COUNT,
  DEFAULT_SEED,
  generateDataset,
  uuidToHex,
  type GeneratedDataset,
  type InjectedOutlier,
} from './generate';
import { compileSelection, selectRows } from './selection';

/** Version du provider, écrite dans `SnapshotDescriptor.providerVersion` (EX-DATA-106). */
export const SYNTHETIC_PROVIDER_VERSION = 'D3-1.0.0';
/** Instant de capture fixe : le déterminisme couvre aussi l'horodatage du snapshot. */
export const SYNTHETIC_CAPTURED_AT = '2026-09-01T00:00:00.000Z';

/** Options de construction du provider synthétique. */
export interface SyntheticProviderOptions {
  /** Référentiels statiques assemblés par D2 (`buildReferenceData`). Injecté par l'appelant (D8/tests). */
  readonly referenceData: ReferenceData;
  /** Graine du générateur (défaut `DEFAULT_SEED`). Même graine ⇒ dataset identique octet à octet. */
  readonly seed?: number;
  /** Effectif d'annonces (défaut 100 000, EX-NFR-1). */
  readonly listingCount?: number;
  /** Marché du snapshot (défaut `be`). */
  readonly marketplace?: 'be' | 'nl';
  /** Fraction d'outliers injectés parmi les annonces à prix affiché (défaut 0,6 %). */
  readonly outlierRate?: number;
}

/** État d'un snapshot ouvert : dataset généré + index de forage. */
interface OpenState {
  readonly dataset: GeneratedDataset;
  readonly descriptor: SnapshotDescriptor;
  /** Index paresseux `listingId (hex) → indice de ligne`, pour `fetchListingsByIds`. */
  idByHex: Map<string, number> | null;
}

export class SyntheticDataProvider implements DataProvider {
  private readonly ref: ReferenceData;
  private readonly seed: number;
  private readonly listingCount: number;
  private readonly marketplace: 'be' | 'nl';
  private readonly outlierRate: number;
  private readonly snapshotId: string;
  private state: OpenState | null = null;

  constructor(options: SyntheticProviderOptions) {
    this.ref = options.referenceData;
    this.seed = options.seed ?? DEFAULT_SEED;
    this.listingCount = options.listingCount ?? DEFAULT_LISTING_COUNT;
    this.marketplace = options.marketplace ?? 'be';
    this.outlierRate = options.outlierRate ?? 0.006;
    this.snapshotId = `${this.marketplace}-synthetic-${this.listingCount}-${(this.seed >>> 0).toString(16)}`;
  }

  describe(): ProviderCapabilities {
    return {
      providerId: 'kycar-synthetic',
      providerVersion: SYNTHETIC_PROVIDER_VERSION,
      marketplace: this.marketplace,
      sourceKind: 'SYNTHETIC',
      mode1: { source: 'LISTINGS' },
      // Dataset complet servi en mode 2 : pas de plafond d'échantillon imposé par la source.
      mode2: { kind: 'SERVED', maxSampleSize: null },
    };
  }

  openSnapshot(request?: OpenSnapshotRequest): Promise<SnapshotHandle> {
    if (this.state === null || request?.forceRefresh === true) {
      const dataset = generateDataset({
        referenceData: this.ref,
        seed: this.seed,
        listingCount: this.listingCount,
        snapshotId: this.snapshotId,
        outlierRate: this.outlierRate,
      });
      this.state = { dataset, descriptor: this.buildDescriptor(dataset), idByHex: null };
    }
    return Promise.resolve({ descriptor: this.state.descriptor });
  }

  closeSnapshot(_handle: SnapshotHandle): Promise<void> {
    // Idempotente : on conserve le dataset généré (régénérable à l'identique), rien à libérer.
    return Promise.resolve();
  }

  fetchBaselineAggregates(_handle: SnapshotHandle): Promise<AggregateResult<MakeAggregate>> {
    const { dataset } = this.requireState();
    const rows = aggregateByMake(dataset.batch, allIndices(dataset.batch.rowCount), 1);
    return Promise.resolve({
      snapshotId: this.snapshotId,
      selection: `${FULL}:EMPTY`,
      selectionCount: dataset.batch.rowCount,
      rows,
      // Sélection vide : aucun filtre à appliquer, donc aucun filtre non appliqué (D-03).
      unsupportedFilterIds: [],
    });
  }

  fetchAggregates(
    _handle: SnapshotHandle,
    selection: SelectionQuery,
    level: AggregateLevel,
    makeScope?: number,
  ): Promise<AggregateResult<MakeAggregate | ModelAggregate>> {
    const { dataset } = this.requireState();
    const compiled = compileSelection(dataset.batch, selection, this.ref);
    const indices = selectRows(dataset.batch.rowCount, compiled);
    // Couverture publiée seulement pour la sélection vide (interface §4) ; sinon NON_APPLICABLE → null.
    const coverage = compiled.isEmpty ? 1 : null;
    const rows =
      level === 'MAKE'
        ? aggregateByMake(dataset.batch, indices, coverage)
        : aggregateByModel(dataset.batch, indices, coverage, makeScope);
    return Promise.resolve({
      snapshotId: this.snapshotId,
      selection,
      selectionCount: indices.length,
      rows,
      // D-03 : les identifiants que `compileSelection` a ignorés faute de colonne ou de règle.
      unsupportedFilterIds: compiled.unsupported,
    });
  }

  fetchSelectionCount(_handle: SnapshotHandle, selection: SelectionQuery): Promise<number> {
    const { dataset } = this.requireState();
    const compiled = compileSelection(dataset.batch, selection, this.ref);
    if (compiled.isEmpty) return Promise.resolve(dataset.batch.rowCount);
    let count = 0;
    for (let i = 0; i < dataset.batch.rowCount; i += 1) if (compiled.predicate(i)) count += 1;
    return Promise.resolve(count);
  }

  fetchListingColumns(_handle: SnapshotHandle, tSelection: TSelectionQuery): Promise<ListingColumnBatch> {
    const { dataset } = this.requireState();
    const compiled = compileSelection(dataset.batch, tSelection, this.ref);
    if (compiled.isEmpty) {
      return Promise.resolve(dataset.batch); // le lot complet porte déjà localDatasetKey === 'FULL'.
    }
    const indices = selectRows(dataset.batch.rowCount, compiled);
    const key = sha256Hex(tSelection).slice(0, HASH_LENGTH);
    return Promise.resolve(subsetBatch(dataset.batch, indices, this.snapshotId, key));
  }

  fetchListingsByIds(_handle: SnapshotHandle, listingIds: readonly string[]): Promise<ListingColumnBatch> {
    const { dataset } = this.requireState();
    const index = this.ensureIdIndex();
    const indices: number[] = [];
    for (const id of listingIds) {
      const i = index.get(id.toLowerCase());
      if (i !== undefined) indices.push(i);
    }
    return Promise.resolve(subsetBatch(dataset.batch, indices, this.snapshotId, `ids-${indices.length}`));
  }

  /** Vérité terrain des outliers injectés (pour la vérification de détection de D4). */
  getGroundTruthOutliers(): readonly InjectedOutlier[] {
    return this.requireState().dataset.outliers;
  }

  /** Accès direct au dataset généré (mesures de taille, tests). */
  getDataset(): GeneratedDataset {
    return this.requireState().dataset;
  }

  private requireState(): OpenState {
    if (this.state === null) {
      throw new Error('SyntheticDataProvider: openSnapshot doit être appelée avant tout accès aux données');
    }
    return this.state;
  }

  private ensureIdIndex(): Map<string, number> {
    const state = this.requireState();
    if (state.idByHex === null) {
      const map = new Map<string, number>();
      const { batch } = state.dataset;
      for (let i = 0; i < batch.rowCount; i += 1) map.set(uuidToHex(batch.listingId, i * 16), i);
      state.idByHex = map;
    }
    return state.idByHex;
  }

  private buildDescriptor(dataset: GeneratedDataset): SnapshotDescriptor {
    const { batch } = dataset;
    const unknownCountByField = countUnknowns(batch);
    const ingestFlagCounts = countIngestFlags(batch);
    return {
      snapshotId: this.snapshotId,
      marketplace: this.marketplace,
      capturedAt: SYNTHETIC_CAPTURED_AT,
      sourceKind: 'SYNTHETIC',
      providerVersion: SYNTHETIC_PROVIDER_VERSION,
      listingCount: batch.rowCount,
      // Dataset synthétique COMPLET : l'effectif annoncé égale l'effectif ingéré (couverture 1,0).
      announcedListingCount: batch.rowCount,
      rejectedCount: 0,
      rejectedByReason: {},
      duplicateListingCount: 0,
      duplicateValueConflictCount: 0,
      unknownCountByField,
      ingestFlagCounts,
      versionStrippedRate: 0,
      coverageNote: 'Dataset SYNTHETIC (EX-DATA-107) : distributions générées, non issues d’un marché réel.',
    };
  }
}

/** Tous les indices [0, rowCount). */
function* allIndices(rowCount: number): Generator<number> {
  for (let i = 0; i < rowCount; i += 1) yield i;
}

/** Compte, par champ numérique clé, le nombre d'annonces à valeur inconnue (sentinelle -1). */
function countUnknowns(batch: ListingColumnBatch): Record<string, number> {
  const fields: Array<[string, ArrayLike<number>]> = [
    ['priceEur', batch.priceEur],
    ['mileageKm', batch.mileageKm],
    ['powerKw', batch.powerKw],
    ['co2EmissionsGPerKmX10', batch.co2EmissionsGPerKmX10],
    ['consumptionCombinedL100KmX10', batch.consumptionCombinedL100KmX10],
    ['electricRangeKm', batch.electricRangeKm],
    ['modelYear', batch.modelYear],
  ];
  const out: Record<string, number> = {};
  for (const [name, col] of fields) {
    let c = 0;
    for (let i = 0; i < batch.rowCount; i += 1) if (col[i] === NUMERIC_UNKNOWN) c += 1;
    out[name] = c;
  }
  return out;
}

/** Compte les annonces portant chaque drapeau d'ingestion (O13 : 16 bits ⇒ 16 codes au plus). */
function countIngestFlags(batch: ListingColumnBatch): Record<string, number> {
  const counts = new Array<number>(16).fill(0);
  for (let i = 0; i < batch.rowCount; i += 1) {
    const flags = batch.ingestFlags[i] as number;
    if (flags === 0) continue;
    for (let b = 0; b < 16; b += 1) if ((flags & (1 << b)) !== 0) counts[b] = (counts[b] as number) + 1;
  }
  const out: Record<string, number> = {};
  for (let b = 0; b < 16; b += 1) {
    const count = counts[b] as number;
    if (count === 0) continue;
    const def = INGEST_FLAG_VALUES[b];
    if (def !== undefined) out[def.code] = count;
  }
  return out;
}
