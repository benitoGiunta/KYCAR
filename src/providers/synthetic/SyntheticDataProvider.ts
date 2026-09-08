/**
 * KYCAR — `SyntheticDataProvider` (lot D3)
 * =================================================================================================
 * Implémentation `DataProvider` de source SYNTHETIC (EX-DATA-107), servant le mode 1 ET le mode 2
 * (ARCHITECTURE §6.3) : `sourceKind = 'SYNTHETIC'`, `mode1.source = 'LISTINGS'`,
 * `mode2 = SERVED (dataset complet, outliers injectés)`.
 *
 *   - Génère à l'ouverture du snapshot le NOYAU colonnaire (`generate.ts`, phase 1) et PRÉCALCULE
 *     les agrégats de base une fois pour toutes ; la zone de chaînes des annonces individuelles est
 *     matérialisée PARESSEUSEMENT, au premier accès mode 2 (ARCHITECTURE §9.3 garde-fous 1 et 2,
 *     DR-049) — `openSnapshot` n'a donc plus les 100 000 annonces sur son chemin critique.
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
import { HASH_LENGTH } from '../../types/selection';
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

/** État d'un snapshot ouvert : dataset généré, agrégats de base précalculés, index de forage. */
interface OpenState {
  readonly dataset: GeneratedDataset;
  readonly descriptor: SnapshotDescriptor;
  /**
   * Agrégats de la sélection VIDE, calculés UNE fois à l'ouverture (§9.3 garde-fou 1) et servis à
   * l'identique — même objet, jamais recalculés — à chaque `fetchBaselineAggregates`.
   */
  readonly baseline: AggregateResult<MakeAggregate>;
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
      // §9.3 garde-fou 1 : les agrégats de base sont PRÉCALCULÉS ici, sur le noyau colonnaire, et
      // mémorisés dans l'état du snapshot. Aucun recalcul au chargement, aucune annonce
      // individuelle matérialisée (garde-fou 2 : la zone de chaînes reste différée).
      const baseline: AggregateResult<MakeAggregate> = {
        snapshotId: this.snapshotId,
        // EX-DATA-108 (DR-125) : la sélection vide se SÉRIALISE en chaîne vide ; `FULL:EMPTY` en est
        // le hachage (EX-SRCH-9quinquies), pas la sélection.
        selection: '',
        selectionCount: dataset.rowCount,
        rows: aggregateByMake(dataset.metricColumns, null, 1),
        // Sélection vide : aucun filtre à appliquer, donc aucun filtre non appliqué (D-03).
        unsupportedFilterIds: [],
      };
      this.state = { dataset, descriptor: this.buildDescriptor(dataset), baseline, idByHex: null };
    }
    return Promise.resolve({ descriptor: this.state.descriptor });
  }

  closeSnapshot(_handle: SnapshotHandle): Promise<void> {
    // Idempotente : on conserve le dataset généré (régénérable à l'identique), rien à libérer.
    return Promise.resolve();
  }

  fetchBaselineAggregates(_handle: SnapshotHandle): Promise<AggregateResult<MakeAggregate>> {
    return Promise.resolve(this.requireState().baseline);
  }

  fetchAggregates(
    _handle: SnapshotHandle,
    selection: SelectionQuery,
    level: AggregateLevel,
    makeScope?: number,
  ): Promise<AggregateResult<MakeAggregate | ModelAggregate>> {
    const { dataset } = this.requireState();
    const compiled = compileSelection(dataset.columns, selection, this.ref);
    const indices = selectRows(dataset.rowCount, compiled);
    // Couverture publiée seulement pour la sélection vide (interface §4) ; sinon NON_APPLICABLE → null.
    const coverage = compiled.isEmpty ? 1 : null;
    const rows =
      level === 'MAKE'
        ? aggregateByMake(dataset.columns, indices, coverage)
        : aggregateByModel(dataset.columns, indices, coverage, makeScope);
    return Promise.resolve({
      snapshotId: this.snapshotId,
      selection,
      selectionCount: indices.length,
      rows,
      // D-03 : les identifiants que `compileSelection` a ignorés faute de colonne ou de règle.
      unsupportedFilterIds: compiled.unsupported,
    });
  }

  /**
   * Effectif de la sélection. D-33 : passe par le MÊME `compileSelection` que `fetchAggregates`,
   * donc par la même liste `unsupported` — un filtre non appliqué ne peut pas rendre ici un
   * effectif différent de celui que `fetchAggregates` publierait (test du lot : les deux chemins
   * sont comparés sur le même corpus de sélections).
   */
  fetchSelectionCount(_handle: SnapshotHandle, selection: SelectionQuery): Promise<number> {
    const { dataset } = this.requireState();
    const compiled = compileSelection(dataset.columns, selection, this.ref);
    if (compiled.isEmpty) return Promise.resolve(dataset.rowCount);
    let count = 0;
    for (let i = 0; i < dataset.rowCount; i += 1) if (compiled.predicate(i)) count += 1;
    return Promise.resolve(count);
  }

  fetchListingColumns(_handle: SnapshotHandle, tSelection: TSelectionQuery): Promise<ListingColumnBatch> {
    const { dataset } = this.requireState();
    const compiled = compileSelection(dataset.columns, tSelection, this.ref);
    if (compiled.isEmpty) {
      return Promise.resolve(dataset.batch); // le lot complet porte déjà localDatasetKey === 'FULL'.
    }
    const indices = selectRows(dataset.rowCount, compiled);
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
    const { unknownCountByField, ingestFlagCounts } = dataset;
    return {
      snapshotId: this.snapshotId,
      marketplace: this.marketplace,
      capturedAt: SYNTHETIC_CAPTURED_AT,
      sourceKind: 'SYNTHETIC',
      providerVersion: SYNTHETIC_PROVIDER_VERSION,
      listingCount: dataset.rowCount,
      // Dataset synthétique COMPLET : l'effectif annoncé égale l'effectif ingéré (couverture 1,0).
      announcedListingCount: dataset.rowCount,
      rejectedCount: 0,
      rejectedByReason: {},
      // EX-DATA-15 / ARB-54 : compteurs MESURÉS par l'audit de doublons, jamais écrits en dur.
      duplicateListingCount: dataset.duplicates.duplicateListingCount,
      duplicateValueConflictCount: dataset.duplicates.duplicateValueConflictCount,
      unknownCountByField,
      ingestFlagCounts,
      versionStrippedRate: 0,
      coverageNote: 'Dataset SYNTHETIC (EX-DATA-107) : distributions générées, non issues d’un marché réel.',
    };
  }
}
