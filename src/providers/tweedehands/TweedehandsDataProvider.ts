/**
 * KYCAR — `TweedehandsDataProvider` (lot D9)
 * =================================================================================================
 * Implémentation `DataProvider` mode 1 SEULEMENT, sur la surface `__NEXT_DATA__` de 2dehands.be /
 * marktplaats.nl autorisée par `robots.txt` (`DECISION-coordinateur-source.md`, `probe-LOT-N.md`).
 *
 *   - `sourceKind = 'REAL'`, `mode1.source = 'AGGREGATE_SURFACE'` (`ARCHITECTURE.md` §6.3).
 *   - `mode2 = UNAVAILABLE('BIASED_SAMPLE', fallback: 'SYNTHETIC')` : la pagination licite est
 *     plafonnée à ~5 010 annonces et ~95% en sont promues (audit 1.5) — aucun échantillon non biaisé
 *     n'est accessible pour le mode 2. `fetchListingColumns`/`fetchListingsByIds` sont donc ABSENTES
 *     (méthodes optionnelles non implémentées) et `servesMode2(this)` renvoie `false`.
 *   - Filtrage R3 à l'ingestion (`normalize.ts`) : aucun champ vendeur identifiant ne franchit
 *     l'adaptateur (P-2, EX-NFR-26).
 *
 * ACCÈS RÉSEAU : ce fichier ne contient AUCUN appel `fetch` direct. Tout accès passe par le
 * `TweedehandsFetcher` injecté au constructeur (`fetcher.ts`) — en production
 * `createHttpTweedehandsFetcher()` (préfixes autorisés seulement, jamais `/lrp/api/`), en test un
 * double qui rejoue une fixture locale. Aucun test de ce lot ne construit ni n'invoque
 * `createHttpTweedehandsFetcher` : zéro appel réseau live pendant le développement et les tests.
 *
 * HYPOTHÈSE E4 EXPLICITE (DR-131). Les facettes marque/modèle de l'URL autorisée sont construites
 * avec les SLUGS de la taxonomie AutoScout24 (`data/reference/taxonomy.json`), faute de pouvoir
 * relever ceux de 2dehands sans requête réseau (E5). Si un slug diffère, la facette répond une page
 * VIDE : ces facettes sont désormais COMPTÉES dans `rejectedByReason.EMPTY_FACET` au lieu de faire
 * disparaître la marque en silence.
 *
 * SÉLECTION (DR-016). La `SelectionQuery` est traduite par `compileSourceSelection` : marque et
 * modèle sont poussés dans l'URL (compte exhaustif), les autres prédicats évaluables sont appliqués
 * à l'ÉCHANTILLON lu (compte non exhaustif, `sampleCoverage = null`), et tout identifiant ni
 * poussable ni évaluable est DÉCLARÉ dans `unsupportedFilterIds` — jamais ignoré en silence, jamais
 * remplacé par le compte NON filtré.
 *
 * BASELINE (DR-050, D-29). `openSnapshot` ne fait plus qu'UN aller (la page racine, qui donne le
 * descripteur) : la répartition par marque — un aller par marque de l'univers — est calculée à la
 * DEMANDE et mémorisée dans un cache indexé par une empreinte du snapshot. Le cache par défaut est
 * un cache mémoire de PROCESSUS, que `closeSnapshot` ne détruit pas ; il s'injecte par
 * `options.baselineCache`, point d'extension prévu pour le cache IndexedDB de la couche application
 * (`src/persistence`, fix-app).
 */

import type { SnapshotId } from '../DataProvider';
import { buildMakeAggregate, buildModelAggregate, priceStatusCounts, type PriceStatusCounts } from './aggregate';
import { dedupeListings } from './dedupe';
import {
  MAX_ALLOWED_PAGE_NUMBER,
  type TweedehandsFetcher,
  type TweedehandsMarketplace,
} from './fetcher';
import { mapListingToNormalized, type NormalizedListing } from './normalize';
import { parseSearchResponse, type RawListing } from './nextData';
import { applyResidual, compileSourceSelection, type CompiledSourceSelection } from './selection';
import { buildEuroStandardIndex } from './vocabularyMap';
import type { ReferenceData } from '../../types/reference';
import { MODEL_ID_UNRESOLVED } from '../../types/sentinels';
import type {
  AggregateLevel,
  AggregateResult,
  DataProvider,
  MakeAggregate,
  ModelAggregate,
  OpenSnapshotRequest,
  ProviderCapabilities,
  SelectionQuery,
  SnapshotDescriptor,
  SnapshotHandle,
} from '../DataProvider';

/**
 * Cache de baseline injectable (D-29, DR-050) : la répartition par marque est calculée UNE fois puis
 * relue, y compris après `closeSnapshot`. L'implémentation par défaut est un cache mémoire de
 * processus ; la couche application y branche son cache IndexedDB (clé de snapshot persistée) sans
 * que l'adaptateur connaisse le stockage.
 */
export interface TweedehandsBaselineCache {
  get(key: string): AggregateResult<MakeAggregate> | undefined;
  set(key: string, value: AggregateResult<MakeAggregate>): void;
}

/** Cache mémoire de PROCESSUS par défaut — survit à `closeSnapshot` et au provider lui-même. */
const PROCESS_BASELINE_CACHE = new Map<string, AggregateResult<MakeAggregate>>();

function defaultBaselineCache(): TweedehandsBaselineCache {
  return {
    get: (key) => PROCESS_BASELINE_CACHE.get(key),
    set: (key, value) => {
      PROCESS_BASELINE_CACHE.set(key, value);
    },
  };
}

export interface TweedehandsDataProviderOptions {
  readonly referenceData: ReferenceData;
  readonly marketplace: TweedehandsMarketplace;
  readonly fetcher: TweedehandsFetcher;
  /** Identifiant de version écrit dans `Snapshot.providerVersion` (EX-DATA-106). */
  readonly providerVersion?: string;
  /**
   * Sous-ensemble de marques interrogées pour construire la répartition par marque (baseline et
   * `fetchAggregates(level: 'MAKE')`). Un aller réseau par marque (§ en-tête) : borner cet univers
   * est une politique opérationnelle légitime (bande passante, budget de rafraîchissement), pas une
   * limite de l'adaptateur. Défaut : `referenceData.makes` en entier (295 marques — coûteux, à
   * restreindre par l'appelant en production, cf. `probe-LOT-A.md` P5 sur le coût d'énumération).
   */
  readonly makeUniverse?: readonly { readonly makeId: number; readonly slug: string }[];
  /** Cache de baseline (D-29) ; défaut : cache mémoire de processus. */
  readonly baselineCache?: TweedehandsBaselineCache;
}

const DETAIL_MODE2_UNAVAILABLE =
  "Échantillon 2dehands biaisé par la publicité (pagination limitée, ~95 % d'annonces promues) : " +
  'les distributions détaillées utilisent le jeu de données synthétique.';

const COVERAGE_NOTE =
  'Agrégats mode 1 (comptes) exhaustifs via totalResultCount quand la sélection est entièrement ' +
  "poussée dans la facette marque/modèle ; sinon l'effectif publié porte sur le seul échantillon lu. " +
  'Fourchettes [min,p05,p50,p95,max] calculées sur l’échantillon de la page (30 annonces), jamais ' +
  'sur la population entière (pagination licite plafonnée à ~5 010 annonces — ' +
  'DECISION-coordinateur-source.md). Axe ANNÉE : EX-DATA-25 impose la première immatriculation, que ' +
  'cette surface ne sert pas et qu’EX-DATA-27 interdit d’imputer depuis l’année-modèle — la ' +
  'fourchette d’année est donc publiée à n = 0 (couverture nulle, non muette). Région NUTS-2 : ' +
  'aucun code postal servi, REGION_UNRESOLVED sur chaque annonce. Version : extraite du titre ' +
  'quand il est servi, sinon INCONNUE.';

/** Résultat d'une requête élémentaire (une page) déjà normalisée, dédupliquée et compilée. */
interface QueryResult {
  readonly listingCount: number;
  readonly sample: readonly NormalizedListing[];
  readonly unknownCountByField: Record<string, number>;
  readonly ingestFlagCounts: Record<string, number>;
  readonly rejectedByReason: Record<string, number>;
  readonly rejectedCount: number;
  readonly duplicateListingCount: number;
  readonly duplicateValueConflictCount: number;
  readonly versionStrippedRate: number;
  readonly priceStatus: PriceStatusCounts;
  readonly announcedCountRejected: boolean;
}

export class TweedehandsDataProvider implements DataProvider {
  private readonly referenceData: ReferenceData;
  private readonly marketplace: TweedehandsMarketplace;
  private readonly fetcher: TweedehandsFetcher;
  private readonly providerVersion: string;
  private readonly euroIndex: ReadonlyMap<string, string>;
  private readonly makeUniverse: readonly { readonly makeId: number; readonly slug: string }[];
  private readonly baselineCache: TweedehandsBaselineCache;
  /** Empreinte du snapshot ouvert — clé du cache de baseline (DR-050). */
  private baselineKey: string | null = null;
  private lastPriceStatus: PriceStatusCounts = {
    sampleCount: 0,
    priceQuotedCount: 0,
    priceOnRequestCount: 0,
    priceMissingCount: 0,
  };

  constructor(options: TweedehandsDataProviderOptions) {
    this.referenceData = options.referenceData;
    this.marketplace = options.marketplace;
    this.fetcher = options.fetcher;
    this.providerVersion = options.providerVersion ?? 'tweedehands-1';
    this.euroIndex = buildEuroStandardIndex(options.referenceData);
    this.makeUniverse = options.makeUniverse ?? options.referenceData.makes;
    this.baselineCache = options.baselineCache ?? defaultBaselineCache();
  }

  describe(): ProviderCapabilities {
    return {
      providerId: 'tweedehands',
      providerVersion: this.providerVersion,
      marketplace: this.marketplace,
      sourceKind: 'REAL',
      mode1: { source: 'AGGREGATE_SURFACE' },
      mode2: {
        kind: 'UNAVAILABLE',
        reason: 'BIASED_SAMPLE',
        fallback: 'SYNTHETIC',
        detail: DETAIL_MODE2_UNAVAILABLE,
      },
    };
  }

  /**
   * Ouvre le snapshot en UN aller (la page racine). §9.3 garde-fou 1 : la répartition par marque
   * n'est PAS calculée ici — elle est servie par le cache, ou calculée au premier appel de
   * `fetchBaselineAggregates` puis mémorisée (DR-050).
   */
  async openSnapshot(_request?: OpenSnapshotRequest): Promise<SnapshotHandle> {
    const snapshotId = `${this.marketplace}-${new Date().toISOString().replace(/[-:.]/g, '')}`;
    const root = await this.queryOne(snapshotId, {});
    this.baselineKey = this.buildBaselineKey(root);
    this.lastPriceStatus = root.priceStatus;

    const descriptor: SnapshotDescriptor = {
      snapshotId,
      marketplace: this.marketplace,
      capturedAt: new Date().toISOString(),
      sourceKind: 'REAL',
      providerVersion: this.providerVersion,
      listingCount: root.sample.length,
      announcedListingCount: root.listingCount,
      rejectedCount: root.rejectedCount,
      rejectedByReason: root.rejectedByReason,
      duplicateListingCount: root.duplicateListingCount,
      duplicateValueConflictCount: root.duplicateValueConflictCount,
      unknownCountByField: root.unknownCountByField,
      ingestFlagCounts: root.ingestFlagCounts,
      versionStrippedRate: root.versionStrippedRate,
      coverageNote: COVERAGE_NOTE,
    };

    return { descriptor };
  }

  /**
   * Idempotente. Ne DÉTRUIT PAS le cache de baseline : §9.3 garde-fou 1 exige des agrégats de base
   * « jamais recalculés au chargement », ce qu'un cache détruit à la fermeture ne peut pas tenir.
   */
  closeSnapshot(_handle: SnapshotHandle): Promise<void> {
    return Promise.resolve();
  }

  async fetchBaselineAggregates(handle: SnapshotHandle): Promise<AggregateResult<MakeAggregate>> {
    const key = this.baselineKey ?? handle.descriptor.snapshotId;
    const cached = this.baselineCache.get(key);
    if (cached !== undefined) return cached;
    const computed = await this.computeMakeAggregates(handle.descriptor.snapshotId, '', {
      makeId: undefined,
      modelId: undefined,
      residual: [],
      unsupported: [],
      blocking: [],
      isEmpty: true,
      exhaustive: true,
    });
    this.baselineCache.set(key, computed);
    return computed;
  }

  async fetchAggregates(
    handle: SnapshotHandle,
    selection: SelectionQuery,
    level: AggregateLevel,
    makeScope?: number,
  ): Promise<AggregateResult<MakeAggregate | ModelAggregate>> {
    const compiled = compileSourceSelection(selection, this.referenceData.bodyTypeIndexAvailable);
    if (level === 'MODEL') {
      const scope = makeScope ?? compiled.makeId;
      if (scope === undefined) {
        throw new Error(
          'TweedehandsDataProvider: fetchAggregates(level=MODEL) exige makeScope ou un filtre make dans la sélection',
        );
      }
      return this.computeModelAggregates(handle.descriptor.snapshotId, selection, scope, compiled);
    }
    return this.computeMakeAggregates(handle.descriptor.snapshotId, selection, compiled);
  }

  /**
   * Effectif de la sélection. Passe par le MÊME `compileSourceSelection` que `fetchAggregates`
   * (D-33) : exhaustif quand toute la sélection est poussée à la source, sinon l'effectif de
   * l'échantillon retenu — jamais l'effectif NON filtré (DR-016).
   */
  async fetchSelectionCount(_handle: SnapshotHandle, selection: SelectionQuery): Promise<number> {
    const compiled = compileSourceSelection(selection, this.referenceData.bodyTypeIndexAvailable);
    const scope = this.scopeOf(compiled);
    const result = await this.queryOne(_handle.descriptor.snapshotId, scope);
    if (compiled.exhaustive) return result.listingCount;
    return applyResidual(this.restrictToScope(result.sample, compiled), compiled).length;
  }

  /** Partition de statut de prix mesurée sur le dernier échantillon lu (I5 d'EX-DATA-104). */
  getPriceStatusCounts(): PriceStatusCounts {
    return this.lastPriceStatus;
  }

  /* ---- Interne ---------------------------------------------------------------------------- */

  /** Empreinte du snapshot : marché, univers de marques et signature de la page racine (DR-050). */
  private buildBaselineKey(root: QueryResult): string {
    const universe = this.makeUniverse.map((m) => m.makeId).join('.');
    const ids = root.sample.map((l) => l.listingId).join('.');
    return `${this.marketplace}|${universe}|${root.listingCount}|${ids}`;
  }

  /** Facette d'URL demandée par une sélection compilée (marque, puis modèle). */
  private scopeOf(compiled: CompiledSourceSelection): { brandSlug?: string; modelSlug?: string } {
    if (compiled.makeId === undefined) return {};
    const make = this.referenceData.makeById.get(compiled.makeId);
    if (make === undefined) return {};
    if (compiled.modelId === undefined || compiled.modelId === MODEL_ID_UNRESOLVED) {
      return { brandSlug: make.slug };
    }
    const model = this.referenceData.modelByKey.get(`${compiled.makeId}:${compiled.modelId}`);
    return model === undefined ? { brandSlug: make.slug } : { brandSlug: make.slug, modelSlug: model.slug };
  }

  /** Restreint un échantillon à la marque (et au modèle) demandés par la sélection (DR-018). */
  private restrictToScope(
    sample: readonly NormalizedListing[],
    compiled: CompiledSourceSelection,
  ): readonly NormalizedListing[] {
    if (compiled.makeId === undefined) return sample;
    return sample.filter(
      (l) =>
        l.makeId === compiled.makeId &&
        (compiled.modelId === undefined || l.modelId === compiled.modelId),
    );
  }

  /** Une requête réseau (page 1) et sa normalisation — le grain élémentaire de `AGGREGATE_SURFACE`. */
  private async queryOne(
    snapshotId: SnapshotId,
    scope: { readonly brandSlug?: string; readonly modelSlug?: string },
  ): Promise<QueryResult> {
    const html = await this.fetcher.fetchSearchPage({
      marketplace: this.marketplace,
      brandSlug: scope.brandSlug,
      modelSlug: scope.modelSlug,
      page: 1,
    });
    const response = parseSearchResponse(html);

    const rejectedByReason: Record<string, number> = {};
    const reject = (reason: string): void => {
      rejectedByReason[reason] = (rejectedByReason[reason] ?? 0) + 1;
    };

    const normalized: NormalizedListing[] = [];
    for (const raw of response.listings) {
      if (raw === null || typeof raw !== 'object') {
        // ZO-5 : un élément non exploitable est ÉCARTÉ et compté, jamais laissé faire échouer le lot.
        reject('LISTING_NOT_AN_OBJECT');
        continue;
      }
      const listing = mapListingToNormalized(raw as RawListing, this.referenceData, this.marketplace, this.euroIndex);
      if (listing.listingId === '') {
        // Annexe A champ # 1 : sans identifiant, l'annonce n'est ni dédupliquable ni référençable.
        reject('LISTING_ID_MISSING');
        continue;
      }
      if (listing.listingUrl === '') {
        // EX-DATA-14 (D8-16 / FV-20) : « `listingUrl` est obligatoire et son absence provoque le
        // REJET de l'annonce ». L'architecture est fondée sur le deeplink vers l'annonce d'origine
        // plutôt que sur la copie de son contenu : une annonce sans deeplink est invérifiable par
        // l'utilisateur, donc sans valeur pour la détection d'opportunité. Elle était CONSERVÉE et
        // signalée dans `unknownFields` ; elle est désormais rejetée et comptée par motif — ce qui
        // couvre aussi le deeplink de PROFIL VENDEUR écarté par `normalize.ts` (DR-127).
        reject('LISTING_URL_MISSING');
        continue;
      }
      normalized.push(listing);
    }
    if (response.announcedCountRejected === true) reject('ANNOUNCED_COUNT_OUT_OF_RANGE');
    if (response.totalResultCount === 0 && scope.brandSlug !== undefined) {
      // Hypothèse E4 des slugs de facette (DR-131) : une facette à réponse vide est comptée.
      reject('EMPTY_FACET');
    }

    // EX-DATA-15 / ARB-54 : ordre total d'ingestion = ordre de lecture de la page.
    const deduped = dedupeListings(normalized, snapshotId);
    const sample = deduped.kept;

    const unknownCountByField: Record<string, number> = {};
    const ingestFlagCounts: Record<string, number> = {};
    let withRawVersion = 0;
    let strippedVersion = 0;
    for (const listing of sample) {
      for (const field of listing.unknownFields) {
        unknownCountByField[field] = (unknownCountByField[field] ?? 0) + 1;
      }
      for (const flag of listing.ingestFlags) {
        ingestFlagCounts[flag] = (ingestFlagCounts[flag] ?? 0) + 1;
      }
      // EX-DATA-45 (dernier alinéa) : les SOUS-QUALIFICATIONS d'`ENUM_UNKNOWN`
      // (`HYBRID_CATEGORY_UNRESOLVED`, `FUEL_CATEGORY_FROM_FUEL_TYPE`) sont « comptées dans le
      // rapport d'ingestion mais non dans le vocabulaire à 17 codes » : elles rejoignent
      // `ingestFlagCounts` sans jamais entrer dans `KYCAR_INGEST_FLAG` ni dans un bit d'`ingestFlags`.
      for (const flag of listing.ingestReportFlags) {
        ingestFlagCounts[flag] = (ingestFlagCounts[flag] ?? 0) + 1;
      }
      if (listing.modelVersionRaw !== null) {
        withRawVersion += 1;
        if (listing.modelVersionClean === null || listing.modelVersionClean.length === 0) strippedVersion += 1;
      }
    }

    return {
      listingCount: response.totalResultCount,
      sample,
      unknownCountByField,
      ingestFlagCounts,
      rejectedByReason,
      rejectedCount: Object.values(rejectedByReason).reduce((a, b) => a + b, 0) + deduped.duplicateListingCount,
      duplicateListingCount: deduped.duplicateListingCount,
      duplicateValueConflictCount: deduped.duplicateValueConflictCount,
      // EX-DATA-31 (DR-129) : taux MESURÉ sur les annonces qui portaient une version, pas une
      // constante écrite en dur. Aucune version relevée ⇒ 0 sur 0 ⇒ 0, et `coverageNote` le dit.
      versionStrippedRate: withRawVersion === 0 ? 0 : strippedVersion / withRawVersion,
      priceStatus: priceStatusCounts(sample),
      announcedCountRejected: response.announcedCountRejected === true,
    };
  }

  private async computeMakeAggregates(
    snapshotId: SnapshotId,
    selection: SelectionQuery,
    compiled: CompiledSourceSelection,
  ): Promise<AggregateResult<MakeAggregate>> {
    const targets =
      compiled.makeId === undefined
        ? this.makeUniverse
        : this.makeUniverse.filter((m) => m.makeId === compiled.makeId);

    const rows: MakeAggregate[] = [];
    let selectionCount = 0;
    let priceStatus: PriceStatusCounts = {
      sampleCount: 0,
      priceQuotedCount: 0,
      priceOnRequestCount: 0,
      priceMissingCount: 0,
    };
    for (const make of targets) {
      const result = await this.queryOne(snapshotId, this.scopeOf({ ...compiled, makeId: make.makeId }));
      const own = applyResidual(result.sample.filter((l) => l.makeId === make.makeId), compiled);
      // Compte EXHAUSTIF seulement si toute la sélection a pu être poussée à la source (DR-016) ;
      // sinon l'effectif publié est celui de l'échantillon retenu, jamais le compte non filtré.
      const listingCount = compiled.exhaustive ? result.listingCount : own.length;
      if (listingCount <= 0) continue;
      const row = buildMakeAggregate(make.makeId, listingCount, own);
      rows.push(compiled.exhaustive ? row : { ...row, sampleCoverage: null });
      selectionCount += listingCount;
      priceStatus = addStatus(priceStatus, priceStatusCounts(own));
    }
    rows.sort((a, b) => a.makeId - b.makeId);
    this.lastPriceStatus = priceStatus;

    return {
      snapshotId,
      // EX-DATA-108 (DR-125) : la sélection EFFECTIVEMENT appliquée, canonique — jamais un hachage.
      selection,
      selectionCount,
      rows,
      unsupportedFilterIds: compiled.unsupported,
    };
  }

  private async computeModelAggregates(
    snapshotId: SnapshotId,
    selection: SelectionQuery,
    makeScope: number,
    compiled: CompiledSourceSelection,
  ): Promise<AggregateResult<ModelAggregate>> {
    const make = this.referenceData.makeById.get(makeScope);
    if (make === undefined) {
      return { snapshotId, selection, selectionCount: 0, rows: [], unsupportedFilterIds: compiled.unsupported };
    }
    const models = this.referenceData.modelsByMake.get(makeScope) ?? [];

    const rows: ModelAggregate[] = [];
    let selectionCount = 0;
    for (const model of models) {
      const result = await this.queryOne(snapshotId, { brandSlug: make.slug, modelSlug: model.slug });
      const own = applyResidual(
        result.sample.filter((l) => l.makeId === makeScope && l.modelId === model.modelId),
        compiled,
      );
      const listingCount = compiled.exhaustive ? result.listingCount : own.length;
      if (listingCount <= 0) continue;
      const row = buildModelAggregate(makeScope, model.modelId, listingCount, own);
      rows.push(compiled.exhaustive ? row : { ...row, sampleCoverage: null });
      selectionCount += listingCount;
    }

    // EX-DATA-104 I2 + ARB-59 (DR-040, DR-045) : sur une source `AGGREGATE_SURFACE`, la facette
    // marque et les facettes modèle sont INDÉPENDANTES — leur somme ne se réconcilie pas d'elle-même.
    // La ligne résiduelle `modelId = 0` (« Modèle non identifié », EX-DATA-72) porte l'écart, ce qui
    // rétablit I2 et rend la clé réservée exerçable par la route dédiée d'ARB-59.
    const makeResult = await this.queryOne(snapshotId, this.scopeOf({ ...compiled, makeId: makeScope, modelId: undefined }));
    const makeOwn = applyResidual(makeResult.sample.filter((l) => l.makeId === makeScope), compiled);
    const makeCount = compiled.exhaustive ? makeResult.listingCount : makeOwn.length;
    const residual = makeCount - selectionCount;
    if (residual > 0) {
      const unresolvedSample = makeOwn.filter((l) => l.modelId === MODEL_ID_UNRESOLVED);
      const row = buildModelAggregate(makeScope, MODEL_ID_UNRESOLVED, residual, unresolvedSample);
      rows.push(compiled.exhaustive ? row : { ...row, sampleCoverage: null });
      selectionCount += residual;
    }

    rows.sort(
      (a, b) =>
        (a.modelId === MODEL_ID_UNRESOLVED ? 1 : 0) - (b.modelId === MODEL_ID_UNRESOLVED ? 1 : 0) ||
        a.modelId - b.modelId,
    );

    return { snapshotId, selection, selectionCount, rows, unsupportedFilterIds: compiled.unsupported };
  }
}

/** Somme deux partitions de statut de prix (I5 reste exhaustive par addition). */
function addStatus(a: PriceStatusCounts, b: PriceStatusCounts): PriceStatusCounts {
  return {
    sampleCount: a.sampleCount + b.sampleCount,
    priceQuotedCount: a.priceQuotedCount + b.priceQuotedCount,
    priceOnRequestCount: a.priceOnRequestCount + b.priceOnRequestCount,
    priceMissingCount: a.priceMissingCount + b.priceMissingCount,
  };
}

/** Plage licite documentée pour un futur appelant (D8) — pas utilisée par la logique de ce lot. */
export { MAX_ALLOWED_PAGE_NUMBER };
