/**
 * KYCAR — Orchestration des données (lot D8)
 * =================================================================================================
 * Le `DataController` est l'HÔTE que les composants montables (D6/D7 : `MarketScreen`,
 * `DistributionScreen`, `ListingsScreen`) attendent : eux ne possèdent ni `DataProvider` ni moteur, il
 * les leur fournit sous une forme déjà résolue (`ScreenALoadedData`, `RecalcResult`, batch élagué).
 *
 * Il implémente les décisions d'orchestration de la mission D8 :
 *   - Cycle de vie du snapshot (EX-NAV-23) : un seul snapshot actif, acquis au démarrage.
 *   - Échec provider (EX-NFR-21) : délai 5 000 ms, 3 réessais 1s/2s/4s ; repli sur le dernier cache
 *     (EX-NFR-22) ; une erreur n'est JAMAIS présentée comme un résultat vide (EX-NFR-23).
 *   - Chargement progressif (EX-NFR-9) : mode 1 servi par les agrégats de base précalculés d'abord ;
 *     les colonnes d'annonces ne sont chargées qu'à l'ENTRÉE en mode 2 (`fetchListingColumns`).
 *   - Décision O17 : M1/M2 et les distributions fines ne tournent qu'APRÈS élagage marque/modèle — le
 *     lot mode 2 est demandé pour `make=<id>;model=<id>`, donc déjà réduit (~10³ lignes), jamais sur
 *     les 100k complets.
 */

import { AggregationEngine } from '../engine/index';
import type { RecalcResult } from '../engine/index';
import {
  servesMode2,
  type AggregateResult,
  type DataProvider,
  type MakeAggregate,
  type ModelAggregate,
  type ProviderCapabilities,
  type SnapshotDescriptor,
  type SnapshotHandle,
} from '../providers/DataProvider';
import { compilePredicates } from '../engine/predicates';
import { FILTER_DEFAULTS } from '../state/filter-registry';
import type { SelectionState } from '../state/filter-types';
import { resolveTaxonomyRoute } from '../state/router';
import { partitionSelection, splitSelection } from '../state/tr-split';
import type { ReferenceData } from '../types/reference';
import { serializeSelection } from '../types/selection';
import { buildRefinePredicates } from './refine-predicates';
import type { ListingColumnBatch } from '../types/index';
import type { ScreenALoadedData } from '../screens/market/state';

/** Un instantané de cache (EX-NFR-22) : descripteur + agrégats de base, pour le repli hors-ligne. */
export interface CachedSnapshot {
  readonly descriptor: SnapshotDescriptor;
  readonly baseline: AggregateResult<MakeAggregate>;
  readonly storedAt: string;
}

/** Cache du dernier snapshot (EX-NFR-22, EX-NFR-24). Implémenté sur IndexedDB (voir `persistence/`). */
export interface SnapshotCache {
  read(): Promise<CachedSnapshot | null>;
  write(snapshot: CachedSnapshot): Promise<void>;
}

/** Politique de réessai (EX-NFR-21). */
export interface RetryPolicy {
  readonly timeoutMs: number;
  readonly delaysMs: readonly number[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  timeoutMs: 5000,
  delaysMs: [1000, 2000, 4000],
};

export interface DataControllerOptions {
  readonly provider: DataProvider;
  readonly referenceData: ReferenceData;
  /** Provider de repli mode 2 quand le provider principal ne sert pas le mode 2 (EX-DATA-107). */
  readonly mode2Fallback?: DataProvider;
  /** Fabrique du moteur (worker en prod, in-process en test). Défaut : `new AggregationEngine()`. */
  readonly engineFactory?: () => AggregationEngine;
  readonly cache?: SnapshotCache;
  readonly retry?: RetryPolicy;
  /** Injection d'horloge/minuterie pour les tests (défaut : `setTimeout`). */
  readonly sleep?: (ms: number) => Promise<void>;
}

/** Résultat du démarrage : nominal, ou dégradé sur cache, ou échec total (jamais silencieux). */
export interface StartResult {
  readonly status: 'ready' | 'degraded-cache' | 'failed';
  readonly descriptor: SnapshotDescriptor | null;
  readonly sourceKind: 'REAL' | 'SYNTHETIC' | null;
  readonly errorCode?: string;
  readonly attemptedAt: string;
  readonly hasCachedResult: boolean;
}

/** Résultat de l'entrée en mode 2 (écrans B/D) : lot élagué + recalcul moteur. */
export interface Mode2Payload {
  readonly batch: ListingColumnBatch;
  readonly recalc: RecalcResult;
  /** Lignes de Σ après application des filtres R de l'URL (`DR-006`), indices dans `batch`. */
  readonly rows: Int32Array;
  readonly makeModelName: string;
  readonly sourceKind: 'REAL' | 'SYNTHETIC';
  /** `selectionHash` réellement recalculé (`<localDatasetKey>:<refineHash>`, EX-SRCH-9quinquies). */
  readonly selectionHash: string;
  /** `D-03` — filtres R posés que le moteur n'a PAS pu appliquer (jamais silencieux). */
  readonly unappliedFilterIds: readonly string[];
}

const defaultSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Course entre une promesse et un délai (EX-NFR-21 : 5 000 ms). */
function withTimeout<T>(p: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`TIMEOUT_${timeoutMs}MS`)), timeoutMs);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

/**
 * `DR-158` (`EX-NFR-23`, `EX-SCR-28`) — validation de FORME d'une réponse d'agrégats. Une réponse
 * structurellement invalide (`rows` absent ou non tableau…) est refusée à `start()` avec un code
 * `E-PROV-…` affichable, jamais acceptée comme « ready » pour éclater plus tard en `TypeError`.
 */
export function validateAggregateResult(value: unknown): string | null {
  if (value === null || typeof value !== 'object') return 'E-PROV-INVALID_SHAPE';
  const r = value as Partial<AggregateResult<MakeAggregate>>;
  if (!Array.isArray(r.rows)) return 'E-PROV-INVALID_ROWS';
  if (typeof r.snapshotId !== 'string') return 'E-PROV-INVALID_SNAPSHOT_ID';
  if (typeof r.selectionCount !== 'number' || !Number.isFinite(r.selectionCount)) {
    return 'E-PROV-INVALID_SELECTION_COUNT';
  }
  return null;
}

export class DataController {
  private readonly provider: DataProvider;
  private readonly ref: ReferenceData;
  private readonly mode2Fallback?: DataProvider;
  private readonly cache?: SnapshotCache;
  private readonly retry: RetryPolicy;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly engineFactory: () => AggregationEngine;

  private handle: SnapshotHandle | null = null;
  private descriptor: SnapshotDescriptor | null = null;
  private cachedBaseline: AggregateResult<MakeAggregate> | null = null;
  private engine: AggregationEngine | null = null;
  private degraded = false;
  /** Dernière clé de jeu local chargée dans le moteur (évite un rechargement redondant). */
  private loadedDatasetKey: string | null = null;

  constructor(options: DataControllerOptions) {
    this.provider = options.provider;
    this.ref = options.referenceData;
    this.mode2Fallback = options.mode2Fallback;
    this.cache = options.cache;
    this.retry = options.retry ?? DEFAULT_RETRY_POLICY;
    this.sleep = options.sleep ?? defaultSleep;
    this.engineFactory = options.engineFactory ?? ((): AggregationEngine => new AggregationEngine());
  }

  get isDegraded(): boolean {
    return this.degraded;
  }

  get snapshotDescriptor(): SnapshotDescriptor | null {
    return this.descriptor;
  }

  /** `EX-DATA-107` (`D-24`/`D-43`, DR-094/DR-152) — capacités DÉCLARÉES du provider mode 1 : c'est
   * la source de vérité de la provenance affichée (jamais un littéral figé dans un écran). */
  get capabilities(): ProviderCapabilities {
    return this.provider.describe();
  }

  /**
   * Acquiert le snapshot avec la politique de réessai (EX-NFR-21) et le repli sur cache (EX-NFR-22).
   * Ne LANCE jamais : un échec est un `StartResult` explicite, jamais une exception muette ni un vide.
   */
  async start(): Promise<StartResult> {
    const attemptedAt = new Date().toISOString();
    let lastError: Error | null = null;

    const attempts = this.retry.delaysMs.length + 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        // `DR-091` (`EX-NFR-21`) : le délai couvre la SÉQUENCE d'acquisition entière — un
        // `fetchBaselineAggregates` qui ne répond jamais suspendait `start()` indéfiniment.
        const { handle, baseline } = await withTimeout(
          (async (): Promise<{ handle: SnapshotHandle; baseline: AggregateResult<MakeAggregate> }> => {
            const h = await this.provider.openSnapshot();
            const b = await this.provider.fetchBaselineAggregates(h);
            return { handle: h, baseline: b };
          })(),
          this.retry.timeoutMs,
        );
        // `DR-158` : forme validée AVANT publication (jamais un « ready » qui éclatera au loadMarket).
        const invalid = validateAggregateResult(baseline);
        if (invalid !== null) throw new Error(invalid);
        this.handle = handle;
        this.descriptor = handle.descriptor;
        this.cachedBaseline = baseline;
        this.degraded = false;
        if (this.cache) {
          await this.cache
            .write({ descriptor: handle.descriptor, baseline, storedAt: new Date().toISOString() })
            .catch(() => undefined); // le cache est un confort, jamais bloquant
        }
        return {
          status: 'ready',
          descriptor: handle.descriptor,
          sourceKind: handle.descriptor.sourceKind,
          attemptedAt,
          hasCachedResult: true,
        };
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        const delay = this.retry.delaysMs[attempt];
        if (delay !== undefined) await this.sleep(delay);
      }
    }

    // Tous les réessais ont échoué → repli sur le dernier cache (EX-NFR-22).
    const cached = this.cache ? await this.cache.read().catch(() => null) : null;
    if (cached !== null) {
      this.descriptor = cached.descriptor;
      this.cachedBaseline = cached.baseline;
      this.degraded = true;
      return {
        status: 'degraded-cache',
        descriptor: cached.descriptor,
        sourceKind: cached.descriptor.sourceKind,
        errorCode: lastError?.message ?? 'PROVIDER_ERROR',
        attemptedAt,
        hasCachedResult: true,
      };
    }

    // Aucun cache : échec total, présenté comme une erreur (EX-NFR-23), jamais comme un résultat vide.
    return {
      status: 'failed',
      descriptor: null,
      sourceKind: null,
      errorCode: lastError?.message ?? 'PROVIDER_ERROR',
      attemptedAt,
      hasCachedResult: false,
    };
  }

  /** Agrégats mode 1 pour la sélection courante → `ScreenALoadedData` prêt pour l'écran A. */
  async loadMarket(selection: SelectionState): Promise<ScreenALoadedData> {
    const hasUserFilters = Object.keys(selection).length > 0;
    const query = serializeSelection(selection, { defaults: FILTER_DEFAULTS });

    // Sélection vide : agrégats de base (précalculés / cache), sans balayage (EX-NFR-9).
    if (!hasUserFilters) {
      const baseline = this.requireBaseline();
      return this.screenDataFrom(baseline.rows, false, selection);
    }

    // `DR-103` (`EX-SCR-29`, `EX-NFR-23`) — mode dégradé AVEC filtres posés : le cache ne porte que
    // la baseline. On ne sert JAMAIS cette baseline comme un agrégat filtré : les filtres sont
    // déclarés non appliqués et l'écran l'annonce (`ET-FILTRE-NON-APPLIQUE`).
    if (this.handle === null) {
      const baseline = this.requireBaseline();
      return this.screenDataFrom(baseline.rows, false, selection, {
        unappliedFilterIds: Object.keys(selection),
        unappliedReason: 'DEGRADED_CACHE',
      });
    }

    const result = await this.provider.fetchAggregates(this.handle, query, 'MAKE');
    const unsupported = result.unsupportedFilterIds ?? [];
    // `D-03` — un seul filtre non appliqué suffit : l'effectif rendu est un PLANCHER, jamais
    // l'effectif filtré. On publie la baseline en la disant explicitement non filtrée.
    if (unsupported.length > 0) {
      const baseline = this.requireBaseline();
      return this.screenDataFrom(baseline.rows, false, selection, {
        unappliedFilterIds: unsupported,
        unappliedReason: 'PROVIDER_UNSUPPORTED',
      });
    }
    return this.screenDataFrom(result.rows as readonly MakeAggregate[], true, selection);
  }

  /** Agrégats de base disponibles, ou l'échec EXPLICITE d'`EX-NFR-23` (jamais un résultat vide). */
  private requireBaseline(): AggregateResult<MakeAggregate> {
    const baseline = this.cachedBaseline;
    if (baseline === null) throw new Error('DataController.loadMarket: aucun snapshot ni cache disponible');
    return baseline;
  }

  /** Agrégats de modèle d'une marque (chargement paresseux à l'expansion d'une carte, EX-SCR-132). */
  async loadModelsForMake(selection: SelectionState, makeId: number): Promise<readonly ModelAggregate[]> {
    if (this.handle === null) return [];
    const query = serializeSelection(selection, { defaults: FILTER_DEFAULTS });
    const result = await this.provider.fetchAggregates(this.handle, query, 'MODEL', makeId);
    return result.rows.filter((r): r is ModelAggregate => 'modelId' in r);
  }

  /**
   * Entrée en mode 2 (écrans B/D) : charge le lot élagué au couple marque/modèle et recalcule (O17).
   * Le lot est demandé pour `make;model` — l'élagage a donc lieu AVANT tout M1/M2.
   */
  async enterMode2(makeId: number, modelId: number, selection: SelectionState = {}): Promise<Mode2Payload> {
    if (this.handle === null) throw new Error('DataController.enterMode2: snapshot indisponible');

    // `DR-099` (`EX-NAV-19`/`20`) : la route est VALIDÉE contre la taxonomie avant tout aller
    // provider — une marque inconnue ou un modèle hors marque produit un écran d'erreur nommé, pas
    // un écran B vide. `modelId = 0` reste une route valide (`ADV-14`/`EX-DATA-72`).
    const resolved = resolveTaxonomyRoute(
      { name: 'modelDistribution', makeId, makeSlug: '', modelId, modelSlug: '' },
      this.ref,
    );
    if (!resolved.ok) {
      throw new Error(
        resolved.error.kind === 'unknownMake'
          ? `DataController.enterMode2 : marque inconnue (${makeId})`
          : `DataController.enterMode2 : ce modèle n’existe pas pour cette marque (${makeId}/${modelId})`,
      );
    }

    const provider = this.mode2Provider();
    const tSelection = `make=${makeId};model=${modelId}`;
    const handle = this.handle;
    const batch = await this.withRetry('DataController.enterMode2', () =>
      provider.fetchListingColumns!(handle, tSelection),
    );

    const engine = this.ensureEngine();
    if (this.loadedDatasetKey !== batch.localDatasetKey) {
      await engine.loadDataset(batch, this.ref.models);
      this.loadedDatasetKey = batch.localDatasetKey;
    }

    // `DR-006` — la composante R de l'URL est APPLIQUÉE : scission T/R par D5 (le couple
    // marque/modèle, classe T, est déjà absorbé par la route et par `tSelection`), compilation des
    // prédicats par D4, recalcul sur le `selectionHash` RÉEL (jamais `:EMPTY` d'office).
    const { r } = partitionSelection(selection, 'mode2');
    const { refine, unsupported } = buildRefinePredicates(r, this.ref);
    const refineHash = splitSelection(selection, 'mode2').refineHash;
    const selectionHash = `${batch.localDatasetKey}:${refineHash}`;
    const recalc = await engine.recalculate({ selectionHash, refine });

    // Lignes de Σ : le moteur balaie de son côté (worker), l'écran a besoin des indices ici. Le lot
    // est élagué (O17) : le balayage local est trivial et n'emprunte aucun chemin réseau.
    const compiled = compilePredicates(batch, refine);
    const kept: number[] = [];
    for (let i = 0; i < batch.rowCount; i += 1) {
      let ok = true;
      for (const p of compiled) {
        if (!p.test(i)) {
          ok = false;
          break;
        }
      }
      if (ok) kept.push(i);
    }
    const rows = Int32Array.from(kept);

    const make = this.ref.makeById.get(makeId);
    const model = this.ref.modelByKey.get(`${makeId}:${modelId}`);
    const makeModelName = `${make?.label ?? `Marque ${makeId}`} ${model?.label ?? (modelId === 0 ? 'Modèle non identifié' : `Modèle ${modelId}`)}`.trim();

    return {
      batch,
      recalc,
      rows,
      makeModelName,
      sourceKind: provider.describe().sourceKind,
      selectionHash,
      unappliedFilterIds: unsupported,
    };
  }

  /**
   * `EX-SCR-212`/`213` (DR-089) — effectif ACTUEL d'une sélection enregistrée, sur le snapshot
   * courant. `null` quand il ne peut pas être établi (aucun snapshot, provider en échec) : l'écran
   * affiche « effectif actuel indisponible », jamais un zéro inventé.
   */
  async countForSelection(selection: SelectionState): Promise<number | null> {
    if (this.handle === null) return null;
    try {
      return await this.provider.fetchSelectionCount(
        this.handle,
        serializeSelection(selection, { defaults: FILTER_DEFAULTS }),
      );
    } catch {
      return null;
    }
  }

  /** `EX-SCR-214bis` (DR-090) — même mécanisme, par couple marque/modèle suivi. */
  async countForModel(makeId: number, modelId: number): Promise<number | null> {
    if (this.handle === null) return null;
    try {
      return await this.provider.fetchSelectionCount(this.handle, `make=${makeId};model=${modelId}`);
    } catch {
      return null;
    }
  }

  /** Libère le moteur (démontage, changement de snapshot). */
  dispose(): void {
    this.engine?.terminate();
    this.engine = null;
    this.loadedDatasetKey = null;
  }

  /**
   * `DR-157` (`EX-NFR-21`) — même politique que `start()` appliquée à un aller mode 2 : délai de
   * 5 000 ms par tentative, réessais 1 s / 2 s / 4 s, puis échec EXPLICITE (jamais un écran figé sur
   * « Chargement des distributions… »).
   */
  private async withRetry<T>(label: string, run: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    const attempts = this.retry.delaysMs.length + 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await withTimeout(run(), this.retry.timeoutMs);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        const delay = this.retry.delaysMs[attempt];
        if (delay !== undefined) await this.sleep(delay);
      }
    }
    throw new Error(`${label}: ${lastError?.message ?? 'PROVIDER_ERROR'}`);
  }

  private ensureEngine(): AggregationEngine {
    if (this.engine === null) this.engine = this.engineFactory();
    return this.engine;
  }

  /** Choisit le provider qui sert le mode 2 : le principal s'il le sert, sinon le repli synthétique. */
  private mode2Provider(): DataProvider {
    if (servesMode2(this.provider)) return this.provider;
    if (this.mode2Fallback && servesMode2(this.mode2Fallback)) return this.mode2Fallback;
    throw new Error('DataController.enterMode2: aucun provider ne sert le mode 2 (EX-DATA-107)');
  }

  private screenDataFrom(
    makeAggregates: readonly MakeAggregate[],
    hasUserFilters: boolean,
    selection: SelectionState,
    unapplied?: {
      readonly unappliedFilterIds: readonly string[];
      readonly unappliedReason: 'PROVIDER_UNSUPPORTED' | 'DEGRADED_CACHE';
    },
  ): ScreenALoadedData {
    const descriptor = this.descriptor;
    return {
      ...(unapplied ?? {}),
      makeAggregates,
      modelAggregatesByMake: new Map(),
      hasUserFilters,
      activeFilterCount: Object.keys(selection).length,
      // EX-SCR-26 (leave-one-out) : calcul complet non câblé — dette signalée (boutons libellé seul).
      topRestrictiveFilters: [],
      snapshotDate: descriptor?.capturedAt ?? '',
      snapshotListingCount: descriptor?.listingCount ?? makeAggregates.reduce((s, a) => s + a.listingCount, 0),
      snapshotAnnouncedListingCount: descriptor?.announcedListingCount ?? null,
      failedMakeIds: new Set(),
      totalMakesAttempted: makeAggregates.length,
    };
  }
}
