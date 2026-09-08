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
 */

import { MODEL_ID_UNRESOLVED } from '../../types/sentinels';
import type { ReferenceData } from '../../types/reference';
import { buildModelAggregate, buildMakeAggregate } from './aggregate';
import {
  MAX_ALLOWED_PAGE_NUMBER,
  type TweedehandsFetcher,
  type TweedehandsMarketplace,
} from './fetcher';
import { mapListingToNormalized, type NormalizedListing } from './normalize';
import { parseSearchResponse, type RawListing } from './nextData';
import { buildEuroStandardIndex } from './vocabularyMap';
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
}

const DETAIL_MODE2_UNAVAILABLE =
  "Échantillon 2dehands biaisé par la publicité (pagination limitée, ~95 % d'annonces promues) : " +
  'les distributions détaillées utilisent le jeu de données synthétique.';

/** Analyse grossière d'une `SelectionQuery` canonique pour en extraire le filtre `make` (EX-DATA-108). */
function parseMakeFilter(selection: SelectionQuery): number | undefined {
  for (const pair of selection.split(';')) {
    const [id, values] = pair.split('=');
    if (id === 'make' && values !== undefined && values.length > 0) {
      const first = values.split(',')[0];
      const n = first === undefined ? NaN : Number(first);
      return Number.isFinite(n) ? n : undefined;
    }
  }
  return undefined;
}

export class TweedehandsDataProvider implements DataProvider {
  private readonly referenceData: ReferenceData;
  private readonly marketplace: TweedehandsMarketplace;
  private readonly fetcher: TweedehandsFetcher;
  private readonly providerVersion: string;
  private readonly euroIndex: ReadonlyMap<string, string>;
  private readonly makeUniverse: readonly { readonly makeId: number; readonly slug: string }[];
  private baselineCache: AggregateResult<MakeAggregate> | undefined;

  constructor(options: TweedehandsDataProviderOptions) {
    this.referenceData = options.referenceData;
    this.marketplace = options.marketplace;
    this.fetcher = options.fetcher;
    this.providerVersion = options.providerVersion ?? 'tweedehands-1';
    this.euroIndex = buildEuroStandardIndex(options.referenceData);
    this.makeUniverse = options.makeUniverse ?? options.referenceData.makes;
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

  async openSnapshot(_request?: OpenSnapshotRequest): Promise<SnapshotHandle> {
    const { listingCount, sample, unknownCountByField, ingestFlagCounts } = await this.queryOne({});
    const snapshotId = `${this.marketplace}-${new Date().toISOString().replace(/[-:.]/g, '')}`;

    const descriptor: SnapshotDescriptor = {
      snapshotId,
      marketplace: this.marketplace,
      capturedAt: new Date().toISOString(),
      sourceKind: 'REAL',
      providerVersion: this.providerVersion,
      listingCount: sample.length,
      announcedListingCount: listingCount,
      rejectedCount: 0,
      rejectedByReason: {},
      duplicateListingCount: 0,
      duplicateValueConflictCount: 0,
      unknownCountByField,
      ingestFlagCounts,
      versionStrippedRate: 0,
      coverageNote:
        'Agrégats mode 1 (comptes) exhaustifs via totalResultCount ; fourchettes [min,p05,p50,p95,max] ' +
        "calculées sur l'échantillon de la page lue (30 annonces), pas sur la population entière " +
        '(pagination licite plafonnée à ~5 010 annonces — DECISION-coordinateur-source.md).',
    };

    // Précalcule et met en cache la répartition par marque (EX-DATA-109 : baseline persistée avec le
    // snapshot, premier affichage sans balayage).
    this.baselineCache = await this.computeMakeAggregates(snapshotId, 'FULL:EMPTY', undefined);

    return { descriptor };
  }

  closeSnapshot(_handle: SnapshotHandle): Promise<void> {
    this.baselineCache = undefined;
    return Promise.resolve();
  }

  async fetchBaselineAggregates(handle: SnapshotHandle): Promise<AggregateResult<MakeAggregate>> {
    if (this.baselineCache !== undefined) return this.baselineCache;
    return this.computeMakeAggregates(handle.descriptor.snapshotId, 'FULL:EMPTY', undefined);
  }

  async fetchAggregates(
    handle: SnapshotHandle,
    selection: SelectionQuery,
    level: AggregateLevel,
    makeScope?: number,
  ): Promise<AggregateResult<MakeAggregate | ModelAggregate>> {
    if (level === 'MODEL') {
      const scope = makeScope ?? parseMakeFilter(selection);
      if (scope === undefined) {
        throw new Error(
          'TweedehandsDataProvider: fetchAggregates(level=MODEL) exige makeScope ou un filtre make dans la sélection',
        );
      }
      return this.computeModelAggregates(handle.descriptor.snapshotId, selection, scope);
    }
    return this.computeMakeAggregates(handle.descriptor.snapshotId, selection, parseMakeFilter(selection));
  }

  async fetchSelectionCount(_handle: SnapshotHandle, selection: SelectionQuery): Promise<number> {
    const makeId = parseMakeFilter(selection);
    const make = makeId === undefined ? undefined : this.referenceData.makeById.get(makeId);
    const { listingCount } = await this.queryOne({ brandSlug: make?.slug });
    return listingCount;
  }

  /* ---- Interne ---------------------------------------------------------------------------- */

  /** Une requête réseau (page 1) et sa normalisation — le grain élémentaire de `AGGREGATE_SURFACE`. */
  private async queryOne(scope: { readonly brandSlug?: string; readonly modelSlug?: string }): Promise<{
    readonly listingCount: number;
    readonly sample: readonly NormalizedListing[];
    readonly unknownCountByField: Record<string, number>;
    readonly ingestFlagCounts: Record<string, number>;
  }> {
    const html = await this.fetcher.fetchSearchPage({
      marketplace: this.marketplace,
      brandSlug: scope.brandSlug,
      modelSlug: scope.modelSlug,
      page: 1,
    });
    const response = parseSearchResponse(html);
    const sample = response.listings.map((raw: RawListing) =>
      mapListingToNormalized(raw, this.referenceData, this.marketplace, this.euroIndex),
    );

    const unknownCountByField: Record<string, number> = {};
    const ingestFlagCounts: Record<string, number> = {};
    for (const listing of sample) {
      for (const field of listing.unknownFields) {
        unknownCountByField[field] = (unknownCountByField[field] ?? 0) + 1;
      }
      for (const flag of listing.ingestFlags) {
        ingestFlagCounts[flag] = (ingestFlagCounts[flag] ?? 0) + 1;
      }
    }

    return { listingCount: response.totalResultCount, sample, unknownCountByField, ingestFlagCounts };
  }

  private async computeMakeAggregates(
    snapshotId: string,
    selection: SelectionQuery,
    onlyMakeId: number | undefined,
  ): Promise<AggregateResult<MakeAggregate>> {
    const targets =
      onlyMakeId === undefined
        ? this.makeUniverse
        : this.makeUniverse.filter((m) => m.makeId === onlyMakeId);

    const rows: MakeAggregate[] = [];
    let selectionCount = 0;
    for (const make of targets) {
      const { listingCount, sample } = await this.queryOne({ brandSlug: make.slug });
      if (listingCount <= 0) continue;
      rows.push(buildMakeAggregate(make.makeId, listingCount, sample));
      selectionCount += listingCount;
    }
    rows.sort((a, b) => a.makeId - b.makeId);

    // D-03 : ce provider n'a pas encore de table de correspondance sélection → requête (fix-providers) ;
    // il n'applique que le filtre `make`. La liste reste vide tant que la table n'est pas posée.
    return { snapshotId, selection, selectionCount, rows, unsupportedFilterIds: [] };
  }

  private async computeModelAggregates(
    snapshotId: string,
    selection: SelectionQuery,
    makeScope: number,
  ): Promise<AggregateResult<ModelAggregate>> {
    const make = this.referenceData.makeById.get(makeScope);
    if (make === undefined) {
      return { snapshotId, selection, selectionCount: 0, rows: [], unsupportedFilterIds: [] };
    }
    const models = this.referenceData.modelsByMake.get(makeScope) ?? [];

    const rows: ModelAggregate[] = [];
    let selectionCount = 0;
    for (const model of models) {
      const { listingCount, sample } = await this.queryOne({ brandSlug: make.slug, modelSlug: model.slug });
      if (listingCount <= 0) continue;
      rows.push(buildModelAggregate(makeScope, model.modelId, listingCount, sample));
      selectionCount += listingCount;
    }
    rows.sort((a, b) => (a.modelId === MODEL_ID_UNRESOLVED ? 1 : 0) - (b.modelId === MODEL_ID_UNRESOLVED ? 1 : 0) || a.modelId - b.modelId);

    return { snapshotId, selection, selectionCount, rows, unsupportedFilterIds: [] };
  }
}

/** Plage licite documentée pour un futur appelant (D8) — pas utilisée par la logique de ce lot. */
export { MAX_ALLOWED_PAGE_NUMBER };
