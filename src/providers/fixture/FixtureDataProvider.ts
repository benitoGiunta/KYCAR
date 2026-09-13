/**
 * KYCAR — `FixtureDataProvider` (phase 3.3, PLAN-3 §3.3)
 * =================================================================================================
 * Implémentation `DataProvider` d'une source **FIXTURE** : un jeu de données FICTIF, VERSIONNÉ et
 * REJOUABLE, à la forme AutoScout24 (`data/fixtures/<profil>/<snapshot>/`), ni marché réel ni
 * distribution générée à la volée dans l'onglet. `sourceKind = 'FIXTURE'` est propagé jusqu'au
 * `SnapshotDescriptor`, donc jusqu'à l'UI : l'utilisateur ne doit jamais confondre les trois
 * natures (`EX-DATA-107`).
 *
 * CHEMIN D'OUVERTURE (`openSnapshot`), dans cet ordre :
 *
 *   1. index du profil → choix du snapshot (le plus récent par `capturedAt`, ou celui qu'on demande) ;
 *   2. `manifest.json` → **contrôle de version de schéma AVANT toute ligne** (`DATA-MODEL` §6) :
 *      un majeur inconnu REFUSE l'ouverture, aucune ligne servie ;
 *   3. `baseline.json` → **agrégats mode 1 PRÉCALCULÉS** (`D3-31`), s'ils sont là et recevables :
 *      `openSnapshot` construit le descripteur et la baseline À PARTIR D'EUX et REND LA MAIN. Les
 *      annonces sont téléchargées et ingérées EN ARRIÈRE-PLAN, à partir de cet instant ;
 *   4. sinon (artefact absent, d'un autre snapshot, d'un autre format) : chemin d'origine —
 *      `listings.ndjson.gz` en FLUX (`ndjson.ts`), décompression `DecompressionStream('gzip')` et
 *      découpage ligne à ligne, sans jamais matérialiser le texte entier (budget ARB-55) ;
 *      adaptation ligne à ligne (`adapters/as24`), **garde R3 d'abord**, rejets comptés par motif ;
 *      dédoublonnage `EX-DATA-15` par les critères EXPLICITES de D3-15, indépendants de l'ordre du
 *      fichier ; assemblage colonnaire ; baseline calculée UNE fois (ARCHITECTURE §9.3 garde-fou 1 :
 *      `fetchBaselineAggregates` rend le MÊME objet, jamais un recalcul).
 *
 * **POURQUOI CE DÉDOUBLEMENT** (`C-3.5-01`, `D3-31`). L'écran A n'a besoin que des agrégats par
 * marque — 262 lignes, quelques dizaines de Kio. En attendant les 2 677 Kio gzip d'annonces du
 * profil `test`, il affichait son premier chiffre à 7 800 ms pour un budget `EX-NFR-9` de 2 000 ms.
 * Les annonces ne servent qu'au MODE 2 (et aux sélections filtrées du mode 1) : les attendre pour
 * afficher un agrégat déjà calculé, c'était faire payer à tout le monde ce dont personne n'avait
 * encore besoin.
 *
 * **CE QUI EMPÊCHE LE PRÉCALCUL DE MENTIR.** Trois verrous, dans cet ordre : l'artefact est LIÉ à
 * ses octets (`snapshotId` + `sha256` du manifest, vérifiés avant d'être servis) ; à l'arrivée des
 * annonces, la baseline est RECALCULÉE et comparée à celle qui a été servie (`diffBaseline`) ; un
 * écart met le snapshot en ERREUR EXPLICITE et toute demande ultérieure échoue avec sa phrase, au
 * lieu de continuer sur un chiffre que plus rien ne soutient.
 *
 * MODE 1 ET MODE 2. Le lot colonnaire complet est en mémoire dès que l'ingestion est finie : `mode2`
 * est `SERVED`, sans plafond d'échantillon imposé par la source. Les méthodes qui en dépendent
 * (`fetchAggregates`, `fetchSelectionCount`, `fetchListingColumns`, `fetchListingsByIds`)
 * l'ATTENDENT ; celles qui n'en dépendent pas (`fetchBaselineAggregates`) répondent tout de suite.
 * La compilation de sélection, l'agrégation et l'extraction de sous-ensemble sont celles du lot D3
 * (`synthetic/selection.ts`, `aggregate.ts`, `columnar.ts`) — les réécrire aurait produit un second
 * moteur d'agrégation à faire diverger.
 *
 * CE QUE CE PROVIDER NE SAIT PAS FAIRE, ET LE DIT (`coverageNote`) : la provenance de mesure
 * (`co2Source`, `consumptionSource`) est DÉRIVÉE par l'adaptateur mais n'a aucune colonne dans
 * l'interface v1 (dette D8-32, statu quo D3-08) ; sa distribution mesurée est publiée en clair,
 * pour que la dette reste chiffrée. Le diagnostic de représentativité (`coverageWarning`,
 * `samplingBias`, `adTierDistribution`) n'est pas publié : ce sont des propriétés de la SOURCE, et
 * les inventer sur un jeu fictif décrirait un biais qui n'existe pas.
 */

import type {
  AggregateLevel,
  AggregateResult,
  DataProvider,
  ListingColumnBatch,
  MakeAggregate,
  Marketplace,
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
import { ingestFlagCodes } from '../../types/vocabularies';
import { aggregateByMake, aggregateByModel } from '../synthetic/aggregate';
import { subsetBatch } from '../synthetic/columnar';
import { compileSelection, selectRows } from '../synthetic/selection';
import {
  adaptAs24Listing,
  createAs24Context,
  type As24AdapterContext,
  type As24NoticeCode,
  type CanonicalRow,
  type MeasurementSource,
} from '../adapters/as24/adapt';
import { assembleBatch } from '../adapters/as24/columnar';
import { uuidToBytes } from '../adapters/as24/normalize';
import {
  baselineRejectionReason,
  diffBaseline,
  isBaselineArtifact,
  type BaselineIngestSummary,
  type SnapshotBaselineArtifact,
} from './baseline-artifact';
import { hasDuplicateValueConflict, preferCandidate, type DuplicateCandidate } from './dedupe';
import {
  checkSchemaVersion,
  isSnapshotManifest,
  selectSnapshot,
  type FixtureProfile,
  type FixtureSnapshotEntry,
  type SnapshotManifest,
} from './manifest';
import { readNdjsonStream } from './ndjson';
import type { FixtureLoader } from './loaders/types';
import { setIngestFlag } from '../../types/vocabularies';

/** Version du provider, écrite dans `SnapshotDescriptor.providerVersion` quand le manifest se tait. */
export const FIXTURE_PROVIDER_VERSION = 'P3-1.0.0';

/** Options de construction. */
export interface FixtureProviderOptions {
  /** Référentiels statiques assemblés par D2 (`buildReferenceData`). */
  readonly referenceData: ReferenceData;
  /** Profil de volume (D3-01 : `test` pour l'application, `dev` pour les tests, `perf` pour les bancs). */
  readonly profile: FixtureProfile;
  /** Accès aux fichiers : HTTP dans le navigateur, disque sous vitest. */
  readonly loader: FixtureLoader;
  /** Snapshot explicite ; à défaut, le plus récent du profil (les trois servent les écarts d'effectif). */
  readonly snapshotId?: string;
  /**
   * Vérifier `manifest.sha256` (octets NON compressés). Défaut : **seulement sur le profil `dev`**.
   * Motif : `crypto.subtle.digest` n'a pas d'API incrémentale, il faut donc conserver le flux entier
   * pour le hacher. Sur `dev` (≈ 1,5 Mio) c'est indolore ; sur `test` (≈ 6 Mio) et surtout `perf`
   * (≈ 30 Mio) ce serait payer un doublement de l'empreinte mémoire d'ouverture pour re-prouver, à
   * chaque démarrage, l'intégrité d'un fichier versionné dans le dépôt — que le générateur a déjà
   * prouvée et que git protège. Le régime retenu est DÉCLARÉ dans `coverageNote`, jamais implicite.
   */
  readonly verifySha256?: boolean;
  /** Domaine ISO accepté pour # 74 ; omis = contrôle de forme (voir `As24AdapterContext`). */
  readonly isoCountryCodes?: ReadonlySet<string> | null;
  /** Identifiant de provider (défaut `kycar-fixture-<profil>`). */
  readonly providerId?: string;
  /**
   * Avertissement à joindre à `coverageNote` — c'est par là que le REGISTRE signale un repli sur le
   * profil par défaut après une spécification inconnue, sans toucher à `app.tsx` (D-03 : jamais
   * silencieux).
   */
  readonly coverageWarning?: string | null;
  /**
   * Employer les agrégats mode 1 PRÉCALCULÉS (`baseline.json`, `D3-31`) quand le chargeur en sert.
   * Défaut : `true`.
   *
   * `false` force le chemin d'ingestion complète — c'est ainsi que `tools/dataset/baseline.ts`
   * PRODUIT l'artefact (il ne peut pas le lire pour l'écrire) et que la sonde de contrat compare le
   * précalculé au recalculé. Aucun usage applicatif.
   */
  readonly useBaselineArtifact?: boolean;
}

/** Ce que l'ingestion des annonces produit : le lot colonnaire et ce qu'elle a mesuré. */
interface IngestedListings {
  readonly batch: ListingColumnBatch;
  readonly summary: BaselineIngestSummary;
}

/** État d'un snapshot ouvert. */
interface OpenState {
  readonly descriptor: SnapshotDescriptor;
  readonly baseline: AggregateResult<MakeAggregate>;
  readonly manifest: SnapshotManifest;
  /**
   * Ingestion des annonces : promesse MÉMORISÉE, déjà résolue sur le chemin de repli, en cours sur
   * le chemin précalculé. Une seule par ouverture — deux appels concurrents de `fetchAggregates` ne
   * doivent pas télécharger le fichier deux fois.
   */
  readonly listings: Promise<IngestedListings>;
  /** Résultat de l'ingestion une fois disponible (accès synchrone des bancs et des sondes). */
  ingested: IngestedListings | null;
  idByHex: Map<string, number> | null;
}

/** Ce que l'ingestion a mesuré, au-delà de ce que le descripteur sait porter. */
interface IngestReport {
  readonly rows: CanonicalRow[];
  readonly listingIdBytes: Uint8Array;
  readonly rejectedByReason: Record<string, number>;
  readonly rejectedCount: number;
  readonly duplicateListingCount: number;
  readonly duplicateValueConflictCount: number;
  readonly unknownCountByField: Record<string, number>;
  readonly ingestFlagCounts: Record<string, number>;
  readonly noticeCounts: Record<string, number>;
  readonly measurementCounts: Record<MeasurementSource, number>;
  readonly lineCount: number;
  readonly uncompressedBytes: number;
  readonly sha256: string | null;
  readonly wasGzipped: boolean;
}

export class FixtureDataProvider implements DataProvider {
  private readonly ref: ReferenceData;
  private readonly profile: FixtureProfile;
  private readonly loader: FixtureLoader;
  private readonly requestedSnapshotId: string | undefined;
  private readonly verifySha256: boolean;
  private readonly isoCountryCodes: ReadonlySet<string> | null;
  private readonly providerId: string;
  private readonly coverageWarning: string | null;
  private readonly useBaselineArtifact: boolean;
  private state: OpenState | null = null;
  /**
   * Durée de la dernière ouverture, en millisecondes : le temps jusqu'à la BASELINE SERVIE, c'est-
   * à-dire jusqu'au retour d'`openSnapshot`. C'est le jalon du budget S4 de la phase 3.3, et celui
   * dont dépend `EX-NFR-9` — depuis `D3-31`, il ne comprend plus l'ingestion des annonces.
   */
  private lastOpenMs = 0;
  /**
   * Durée entre le DÉBUT de l'ouverture et la fin de l'ingestion des annonces (mode 2 prêt), en
   * millisecondes. `null` tant que l'ingestion n'est pas terminée. Publiée à part de `lastOpenMs` :
   * confondre les deux ferait passer un chargement différé pour une ouverture instantanée.
   */
  private lastIngestMs: number | null = null;
  /**
   * Écart CONSTATÉ entre la baseline précalculée servie et celle recalculée sur les annonces. Non
   * `null` = le snapshot est en erreur : plus aucune valeur n'est servie, ni les annonces, ni la
   * baseline elle-même.
   */
  private divergence: string | null = null;

  constructor(options: FixtureProviderOptions) {
    this.ref = options.referenceData;
    this.profile = options.profile;
    this.loader = options.loader;
    this.requestedSnapshotId = options.snapshotId;
    this.verifySha256 = options.verifySha256 ?? options.profile === 'dev';
    this.isoCountryCodes = options.isoCountryCodes ?? null;
    this.providerId = options.providerId ?? `kycar-fixture-${options.profile}`;
    this.coverageWarning = options.coverageWarning ?? null;
    this.useBaselineArtifact = options.useBaselineArtifact ?? true;
  }

  describe(): ProviderCapabilities {
    return {
      providerId: this.providerId,
      // Sincérité : tant qu'un snapshot n'est pas ouvert, la version du provider est la sienne ;
      // une fois ouvert, c'est celle du GÉNÉRATEUR qui a produit le fichier, écrite au manifest.
      providerVersion: this.state?.descriptor.providerVersion ?? FIXTURE_PROVIDER_VERSION,
      marketplace: this.state?.descriptor.marketplace ?? 'be',
      sourceKind: 'FIXTURE',
      mode1: { source: 'LISTINGS' },
      // SINCÉRITÉ (D3-21) : `maxSampleSize` est l'effectif fin maximal qu'une réponse peut ramener.
      // Tant qu'aucun snapshot n'est ouvert, ce plafond est INCONNU et vaut `null` — « pas de
      // plafond imposé par la source ». Une fois le snapshot ouvert, il est CONNU et fini : c'est
      // l'effectif servi, lu du jeu réel. Annoncer `null` sur un jeu de 5 000 annonces laisserait
      // croire à un échantillon illimité (`EX-DATA-112` dimensionne la mémoire sur ce chiffre).
      mode2: { kind: 'SERVED', maxSampleSize: this.state?.descriptor.listingCount ?? null },
    };
  }

  async openSnapshot(request?: OpenSnapshotRequest): Promise<SnapshotHandle> {
    if (this.state !== null && request?.forceRefresh !== true) {
      return { descriptor: this.state.descriptor };
    }
    const startedAt = Date.now();
    this.state = null;
    this.lastIngestMs = null;
    this.divergence = null;

    const index = await this.loader.loadProfileIndex(this.profile);
    const entry = selectSnapshot(index, this.requestedSnapshotId);
    if (entry === null) {
      throw new Error(
        this.requestedSnapshotId === undefined
          ? `Aucun snapshot dans le profil de fixtures « ${this.profile} » (${this.loader.origin}).`
          : `Snapshot « ${this.requestedSnapshotId} » absent du profil « ${this.profile} ».`,
      );
    }

    const rawManifest = await this.loader.loadManifest(this.profile, entry);
    if (!isSnapshotManifest(rawManifest)) {
      throw new Error(`Manifest illisible pour le snapshot « ${entry.dir} » (profil ${this.profile}).`);
    }
    const manifest = rawManifest;

    // §6 : le contrôle de version passe AVANT la première ligne.
    const verdict = checkSchemaVersion(manifest.schemaVersion);
    if (!verdict.accepted) throw new Error(verdict.message ?? 'Version de schéma incompatible.');

    // `D3-31` — les agrégats mode 1 précalculés, s'ils sont là ET recevables. `rejection` porte la
    // phrase à publier quand ils sont là mais refusés : un refus se DIT, il ne s'oublie pas.
    const { artifact, rejection } = await this.loadBaselineArtifact(manifest, entry);

    if (artifact !== null) {
      const descriptor = this.buildDescriptor(manifest, artifact.ingest, [
        verdict.message,
        this.deferredIntegrityNote(),
        this.precomputedNote(artifact),
        this.coverageWarning,
      ]);
      const baseline: AggregateResult<MakeAggregate> = {
        snapshotId: manifest.snapshotId,
        // EX-DATA-108 (DR-125) : la sélection VIDE se sérialise en chaîne vide.
        selection: '',
        selectionCount: artifact.selectionCount,
        // §9.3 garde-fou 1 : le MÊME objet à chaque appel — ici, celui de l'artefact.
        rows: artifact.rows,
        unsupportedFilterIds: [],
      };
      // L'ingestion part MAINTENANT, en arrière-plan, et sa promesse est mémorisée : le
      // téléchargement des annonces recouvre le temps que l'utilisateur passe à lire l'écran A.
      const listings = this.startIngestion(manifest, entry, startedAt, artifact);
      this.state = { descriptor, baseline, manifest, listings, ingested: null, idByHex: null };
      this.lastOpenMs = Date.now() - startedAt;
      return { descriptor };
    }

    // Repli (`D3-31`) : pas d'artefact recevable → chemin d'origine, tout est ingéré AVANT de servir.
    const { ingested, integrityNote } = await this.ingestListings(manifest, entry);
    this.lastIngestMs = Date.now() - startedAt;

    const descriptor = this.buildDescriptor(manifest, ingested.summary, [
      verdict.message,
      integrityNote,
      rejection ?? this.missingPrecomputedNote(),
      this.coverageWarning,
    ]);

    const baseline: AggregateResult<MakeAggregate> = {
      snapshotId: manifest.snapshotId,
      selection: '',
      selectionCount: ingested.batch.rowCount,
      // §9.3 garde-fou 1 : calculée UNE fois, ici, et servie à l'identique ensuite.
      rows: aggregateByMake(ingested.batch, null, 1),
      unsupportedFilterIds: [],
    };

    this.state = {
      descriptor,
      baseline,
      manifest,
      listings: Promise.resolve(ingested),
      ingested,
      idByHex: null,
    };
    this.lastOpenMs = Date.now() - startedAt;
    return { descriptor };
  }

  closeSnapshot(_handle: SnapshotHandle): Promise<void> {
    // Idempotente. Le lot est conservé : le rouvrir coûterait une relecture complète du fichier, et
    // `EX-NAV-23` ne demande qu'UN snapshot actif, pas sa destruction à la fermeture d'un écran.
    return Promise.resolve();
  }

  /**
   * Sert la baseline mode 1 SANS attendre les annonces (`D3-31`) : c'est tout l'objet du précalcul.
   * Le même objet à chaque appel (§9.3 garde-fou 1). Si la baseline servie a été DÉMENTIE par les
   * annonces, plus rien n'est servi — pas même elle (`ensureNoDivergence`).
   */
  // `async` (et non `Promise.resolve`) pour que le refus d'un jeu DÉMENTI arrive au consommateur
  // sous la forme d'une promesse rejetée, comme toute autre erreur de provider : le contrôleur
  // l'attrape dans son `try`, au lieu de la voir exploser au point d'appel.
  async fetchBaselineAggregates(_handle: SnapshotHandle): Promise<AggregateResult<MakeAggregate>> {
    const state = this.requireState();
    this.ensureNoDivergence();
    return state.baseline;
  }

  async fetchAggregates(
    _handle: SnapshotHandle,
    selection: SelectionQuery,
    level: AggregateLevel,
    makeScope?: number,
  ): Promise<AggregateResult<MakeAggregate | ModelAggregate>> {
    const { descriptor } = this.requireState();
    // Une sélection quelconque se calcule sur les ANNONCES : on les attend (chargement différé).
    const { batch } = await this.requireListings();
    const compiled = compileSelection(batch, selection, this.ref);
    const indices = selectRows(batch.rowCount, compiled);
    // Couverture publiée seulement pour la sélection vide (interface §4) ; sinon NON_APPLICABLE.
    const coverage = compiled.isEmpty ? 1 : null;
    const rows =
      level === 'MAKE'
        ? aggregateByMake(batch, indices, coverage)
        : aggregateByModel(batch, indices, coverage, makeScope);
    return {
      snapshotId: descriptor.snapshotId,
      selection,
      selectionCount: indices.length,
      rows,
      // D-03 : les identifiants que la compilation n'a pas su appliquer, jamais tus.
      unsupportedFilterIds: compiled.unsupported,
    };
  }

  /**
   * D-33 : le compteur passe par la MÊME compilation que `fetchAggregates`, donc par la même liste
   * `unsupported`. Un filtre non appliqué ne peut pas rendre ici un effectif différent de celui
   * qu'`fetchAggregates` publierait.
   */
  async fetchSelectionCount(_handle: SnapshotHandle, selection: SelectionQuery): Promise<number> {
    this.requireState();
    const { batch } = await this.requireListings();
    const compiled = compileSelection(batch, selection, this.ref);
    if (compiled.isEmpty) return batch.rowCount;
    let count = 0;
    for (let i = 0; i < batch.rowCount; i += 1) if (compiled.predicate(i)) count += 1;
    return count;
  }

  async fetchListingColumns(_handle: SnapshotHandle, tSelection: TSelectionQuery): Promise<ListingColumnBatch> {
    const { descriptor } = this.requireState();
    const { batch } = await this.requireListings();
    const compiled = compileSelection(batch, tSelection, this.ref);
    if (compiled.isEmpty) return batch; // le lot complet porte déjà `FULL`.
    const indices = selectRows(batch.rowCount, compiled);
    const key = sha256Hex(tSelection).slice(0, HASH_LENGTH);
    return subsetBatch(batch, indices, descriptor.snapshotId, key);
  }

  async fetchListingsByIds(_handle: SnapshotHandle, listingIds: readonly string[]): Promise<ListingColumnBatch> {
    const { descriptor } = this.requireState();
    const { batch } = await this.requireListings();
    const index = this.ensureIdIndex(batch);
    const indices: number[] = [];
    for (const id of listingIds) {
      const i = index.get(id.toLowerCase());
      if (i !== undefined) indices.push(i);
    }
    return subsetBatch(batch, indices, descriptor.snapshotId, `ids-${indices.length}`);
  }

  /* ---- Accès de mesure (bancs et suite de contrat) ------------------------------------------- */

  /**
   * Durée de la dernière ouverture, en ms : jusqu'à la BASELINE SERVIE (budget S4 : < 2 000 ms).
   * Depuis `D3-31`, l'ingestion des annonces n'en fait plus partie — `getLastIngestMs()` la mesure.
   */
  getLastOpenMs(): number {
    return this.lastOpenMs;
  }

  /**
   * Durée écoulée entre le début de l'ouverture et la fin de l'ingestion des annonces (mode 2
   * prêt), en ms, ou `null` tant qu'elle n'est pas terminée. Deux jalons, deux mesures : les
   * confondre ferait passer un chargement différé pour une ouverture instantanée.
   */
  getLastIngestMs(): number | null {
    return this.lastIngestMs;
  }

  /** Attend la fin de l'ingestion des annonces (bancs, sondes) et rend le lot colonnaire complet. */
  async whenIngested(): Promise<ListingColumnBatch> {
    return (await this.requireListings()).batch;
  }

  /**
   * Ce que l'ingestion a MESURÉ, sous la forme exacte que porte l'artefact précalculé — c'est ce
   * que `tools/dataset/baseline.ts` sérialise, et ce que la sonde de contrat compare. Exige que
   * l'ingestion soit terminée (`whenIngested()`).
   */
  getIngestSummary(): BaselineIngestSummary {
    const state = this.requireState();
    if (state.ingested === null) {
      throw new Error(
        'FixtureDataProvider : statistiques d’ingestion demandées avant la fin du chargement des ' +
          'annonces (D3-31). Attendez whenIngested().',
      );
    }
    return state.ingested.summary;
  }

  /** Manifest du snapshot ouvert : la vérité terrain des anomalies y vit (`groundTruth`). */
  getManifest(): SnapshotManifest {
    return this.requireState().manifest;
  }

  /**
   * Lot colonnaire complet (mesures de taille mémoire). SYNCHRONE : il exige que l'ingestion soit
   * terminée. Elle l'est après n'importe quel appel mode 2 ou après `whenIngested()` ; sinon la
   * méthode le DIT plutôt que de rendre un lot vide qui passerait pour un jeu sans annonces.
   */
  getBatch(): ListingColumnBatch {
    const state = this.requireState();
    if (state.ingested === null) {
      throw new Error(
        'FixtureDataProvider : les annonces sont encore en cours de chargement (D3-31, chargement ' +
          'différé). Attendez whenIngested() ou un appel de mode 2 avant de demander le lot colonnaire.',
      );
    }
    this.ensureNoDivergence();
    return state.ingested.batch;
  }

  /* ---- Interne : agrégats précalculés et chargement différé (`D3-31`) ------------------------- */

  /**
   * Lit `baseline.json` s'il existe et décide s'il est RECEVABLE. Rend l'artefact retenu, ou la
   * phrase qui dit pourquoi il ne l'est pas — jamais un refus muet, jamais un échec d'ouverture :
   * le chemin d'ingestion complète reste toujours disponible et donne le même résultat, plus lentement.
   */
  private async loadBaselineArtifact(
    manifest: SnapshotManifest,
    entry: FixtureSnapshotEntry,
  ): Promise<{ artifact: SnapshotBaselineArtifact | null; rejection: string | null }> {
    if (!this.useBaselineArtifact || this.loader.loadBaseline === undefined) {
      return { artifact: null, rejection: null };
    }
    let raw: unknown;
    try {
      raw = await this.loader.loadBaseline(this.profile, entry);
    } catch {
      // Un artefact injoignable n'est pas une donnée manquante : c'est un chemin plus lent.
      return { artifact: null, rejection: null };
    }
    if (raw === null || raw === undefined) return { artifact: null, rejection: null };
    if (!isBaselineArtifact(raw)) {
      return {
        artifact: null,
        rejection:
          'Un fichier d’agrégats précalculés a été trouvé mais n’a pas la forme attendue : il est ' +
          'IGNORÉ et les agrégats sont recalculés sur les annonces.',
      };
    }
    const reason = baselineRejectionReason(raw, manifest);
    return reason === null ? { artifact: raw, rejection: null } : { artifact: null, rejection: reason };
  }

  /**
   * Démarre l'ingestion des annonces EN ARRIÈRE-PLAN et mémorise sa promesse. À l'arrivée du lot,
   * la baseline est RECALCULÉE et comparée à celle qui a déjà été servie : un écart n'est jamais
   * absorbé — il met le snapshot en erreur, et toute demande ultérieure échoue en le nommant.
   */
  private startIngestion(
    manifest: SnapshotManifest,
    entry: FixtureSnapshotEntry,
    startedAt: number,
    artifact: SnapshotBaselineArtifact,
  ): Promise<IngestedListings> {
    const pending = (async (): Promise<IngestedListings> => {
      const { ingested } = await this.ingestListings(manifest, entry);
      const recomputed = {
        rows: aggregateByMake(ingested.batch, null, 1),
        selectionCount: ingested.batch.rowCount,
        ingest: ingested.summary,
      };
      const diff = diffBaseline(artifact, recomputed);
      if (diff !== null) {
        this.divergence =
          'Les agrégats précalculés de ce jeu de données ne correspondent pas aux annonces reçues ' +
          `(${diff}). Aucune valeur n’est servie tant que l’écart n’est pas levé : régénérez ` +
          'l’artefact (npm run data:baseline) ou vérifiez le fichier d’annonces.';
        throw new Error(this.divergence);
      }
      if (this.state !== null) this.state.ingested = ingested;
      this.lastIngestMs = Date.now() - startedAt;
      return ingested;
    })();
    // Sans ce `catch` de courtoisie, un échec d'ingestion que personne n'attend ENCORE remonterait
    // en « unhandled rejection ». Les appelants réels, eux, reçoivent bien le rejet.
    void pending.catch(() => undefined);
    return pending;
  }

  /** Ouvre le flux, ingère, contrôle l'intégrité, assemble le lot colonnaire. */
  private async ingestListings(
    manifest: SnapshotManifest,
    entry: FixtureSnapshotEntry,
  ): Promise<{ ingested: IngestedListings; integrityNote: string }> {
    const ctx = createAs24Context({
      referenceData: this.ref,
      observedAt: manifest.capturedAt,
      isoCountryCodes: this.isoCountryCodes,
    });
    const stream = await this.loader.openListings(this.profile, entry);
    const report = await this.ingest(stream, ctx);

    // Intégrité : le hachage porte sur les octets NON compressés (`DATA-MODEL` §7-31).
    let integrityNote: string;
    if (this.verifySha256 && report.sha256 !== null) {
      if (report.sha256 !== manifest.sha256) {
        throw new Error(
          `Intégrité du jeu de données rompue : le hachage lu (${report.sha256.slice(0, 12)}…) ne ` +
            `correspond pas à celui du manifest (${manifest.sha256.slice(0, 12)}…). Aucune annonce n’est servie.`,
        );
      }
      integrityNote = 'Intégrité vérifiée (sha256 des octets non compressés, conforme au manifest).';
    } else {
      integrityNote =
        `Intégrité NON vérifiée à l’ouverture (profil ${this.profile}) : le hachage exigerait de ` +
        'conserver le flux décompressé entier en mémoire, ce que le budget d’ouverture ne permet ' +
        'pas au-delà du profil dev. Le fichier est versionné et son sha256 figure au manifest.';
    }

    const { batch } = assembleBatch(report.rows, report.listingIdBytes, manifest.snapshotId, 'FULL');
    return { ingested: { batch, summary: summaryOf(report) }, integrityNote };
  }

  /** Attend les annonces (chargement différé) et refuse de servir si elles ont démenti la baseline. */
  private async requireListings(): Promise<IngestedListings> {
    const state = this.requireState();
    const ingested = await state.listings;
    this.ensureNoDivergence();
    return ingested;
  }

  /** Lève si la baseline servie a été démentie par les annonces. */
  private ensureNoDivergence(): void {
    if (this.divergence !== null) throw new Error(this.divergence);
  }

  /** Note d'intégrité du chemin DIFFÉRÉ : le contrôle a lieu, mais plus tard, et cela se dit. */
  private deferredIntegrityNote(): string {
    return this.verifySha256
      ? 'Intégrité : le sha256 des octets non compressés est vérifié À L’ARRIVÉE des annonces ' +
          '(chargement différé, D3-31) ; une rupture met le jeu en erreur explicite et aucune annonce ' +
          'n’est alors servie.'
      : `Intégrité NON vérifiée (profil ${this.profile}) : le hachage exigerait de conserver le flux ` +
          'décompressé entier en mémoire, ce que le budget d’ouverture ne permet pas au-delà du profil ' +
          'dev. Le fichier est versionné et son sha256 figure au manifest.';
  }

  /** Note du chemin PRÉCALCULÉ : d'où viennent les chiffres affichés avant la première annonce. */
  private precomputedNote(artifact: SnapshotBaselineArtifact): string {
    return (
      `Agrégats de base PRÉCALCULÉS (${artifact.producedBy.name}@${artifact.producedBy.version}, ` +
      `provider ${artifact.producedBy.providerVersion}, D3-31) : l’écran de mode 1 est servi par ` +
      `${artifact.rows.length} agrégats par marque lus à côté du manifest, sans attendre les annonces. ` +
      'Les annonces sont chargées en arrière-plan pour le mode 2 ; à leur arrivée, la baseline est ' +
      'RECALCULÉE et comparée à celle qui a été servie — un écart met le jeu en erreur explicite.'
    );
  }

  /** Note du chemin de REPLI : l'artefact n'est pas là, l'ouverture est plus lente, et cela se dit. */
  private missingPrecomputedNote(): string {
    return (
      'Agrégats de base NON précalculés pour ce snapshot (pas de baseline.json, D3-31) : ils ont été ' +
      'calculés à l’ouverture, après le chargement complet des annonces. Les valeurs sont les mêmes ; ' +
      'le premier affichage, lui, a attendu le fichier entier.'
    );
  }

  /* ---- Interne -------------------------------------------------------------------------------- */

  /**
   * Lit le flux ligne à ligne, adapte, dédoublonne. C'est LA passe coûteuse d'`openSnapshot` : elle
   * ne matérialise ni le texte du fichier, ni un tableau d'objets source — seulement les lignes
   * canoniques retenues.
   */
  private async ingest(stream: ReadableStream<Uint8Array>, ctx: As24AdapterContext): Promise<IngestReport> {
    const rows: CanonicalRow[] = [];
    const updatedAt: (string | null)[] = [];
    const byListingId = new Map<string, number>();
    const rejectedByReason: Record<string, number> = {};
    const unknownCountByField: Record<string, number> = {};
    const ingestFlagCounts: Record<string, number> = {};
    const noticeCounts: Record<string, number> = {};
    const measurementCounts: Record<MeasurementSource, number> = { WLTP: 0, NEDC: 0, UNKNOWN: 0 };
    let rejectedCount = 0;
    let duplicateListingCount = 0;
    let duplicateValueConflictCount = 0;

    const countUnknown = (row: CanonicalRow): void => {
      for (const field of row.unknownFields) {
        unknownCountByField[field] = (unknownCountByField[field] ?? 0) + 1;
      }
    };
    const countFlags = (row: CanonicalRow): void => {
      for (const code of ingestFlagCodes(row.ingestFlags)) {
        ingestFlagCounts[code] = (ingestFlagCounts[code] ?? 0) + 1;
      }
    };
    const countNotices = (notices: readonly As24NoticeCode[]): void => {
      for (const code of notices) noticeCounts[code] = (noticeCounts[code] ?? 0) + 1;
    };

    const result = await readNdjsonStream(stream, {
      hash: this.verifySha256,
      onLine: (line) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(line);
        } catch {
          rejectedCount += 1;
          rejectedByReason['NOT_AN_OBJECT'] = (rejectedByReason['NOT_AN_OBJECT'] ?? 0) + 1;
          return;
        }
        const outcome = adaptAs24Listing(parsed, ctx);
        if (outcome.kind === 'rejected') {
          rejectedCount += 1;
          rejectedByReason[outcome.reason] = (rejectedByReason[outcome.reason] ?? 0) + 1;
          return;
        }
        const row = outcome.row;
        const source = parsed as { readonly lastUpdatedAt?: string };
        const candidate: DuplicateCandidate = {
          row,
          sourceUpdatedAt: typeof source.lastUpdatedAt === 'string' ? source.lastUpdatedAt : null,
        };

        const existing = byListingId.get(row.listingId);
        if (existing === undefined) {
          byListingId.set(row.listingId, rows.length);
          rows.push(row);
          updatedAt.push(candidate.sourceUpdatedAt);
          return;
        }

        // EX-DATA-15 / ARB-54 / D3-15 : deux occurrences du même identifiant.
        duplicateListingCount += 1;
        const keptRow = rows[existing] as CanonicalRow;
        const kept: DuplicateCandidate = { row: keptRow, sourceUpdatedAt: updatedAt[existing] ?? null };
        const conflict = hasDuplicateValueConflict(keptRow, row);
        const winner = preferCandidate(kept, candidate) ? candidate : kept;
        let finalRow = winner.row;
        if (conflict) {
          duplicateValueConflictCount += 1;
          // Le drapeau vit sur l'occurrence CONSERVÉE (ARB-54).
          finalRow = { ...finalRow, ingestFlags: setIngestFlag(finalRow.ingestFlags, 'DUPLICATE_VALUE_CONFLICT') };
        }
        rows[existing] = finalRow;
        updatedAt[existing] = winner.sourceUpdatedAt;
      },
    });

    // Les compteurs sont établis sur les lignes RETENUES, après arbitrage : compter au fil de l'eau
    // aurait compté deux fois les champs d'un doublon, et compté ceux de l'occurrence écartée.
    const listingIdBytes = new Uint8Array(rows.length * 16);
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] as CanonicalRow;
      uuidToBytes(row.listingId, listingIdBytes, i * 16);
      countUnknown(row);
      countFlags(row);
      countNotices(row.notices);
      measurementCounts[row.co2Source] += 1;
    }

    return {
      rows,
      listingIdBytes,
      rejectedByReason,
      rejectedCount,
      duplicateListingCount,
      duplicateValueConflictCount,
      unknownCountByField,
      ingestFlagCounts,
      noticeCounts,
      measurementCounts,
      lineCount: result.lineCount,
      uncompressedBytes: result.uncompressedBytes,
      sha256: result.sha256,
      wasGzipped: result.wasGzipped,
    };
  }

  /**
   * Construit le descripteur à partir des STATISTIQUES d'ingestion — celles que l'ingestion vient
   * de mesurer, ou celles que l'artefact précalculé porte (`D3-31`). Les deux chemins passent par
   * ici, et par la même note : c'est ce qui garantit qu'aucune valeur affichée ne dépend du chemin.
   */
  private buildDescriptor(
    manifest: SnapshotManifest,
    ingest: BaselineIngestSummary,
    notes: readonly (string | null)[],
  ): SnapshotDescriptor {
    const rowCount = ingest.listingCount;
    const stripped = ingest.ingestFlagCounts['VERSION_FULLY_STRIPPED'] ?? 0;
    const marketplace: Marketplace = manifest.marketplace === 'nl' ? 'nl' : 'be';
    return {
      snapshotId: manifest.snapshotId,
      marketplace,
      capturedAt: manifest.capturedAt,
      sourceKind: 'FIXTURE',
      // Traçabilité (EX-DATA-106) : c'est le GÉNÉRATEUR qui a produit ce fichier, pas ce provider.
      providerVersion:
        manifest.generator === undefined
          ? FIXTURE_PROVIDER_VERSION
          : `${manifest.generator.name}@${manifest.generator.version}`,
      listingCount: rowCount,
      // Dénominateur de la couverture d'ÉCHANTILLON : ce que la source annonce contenir, c'est-à-dire
      // le compte du manifest. Les rejets d'ingestion se lisent dans `rejectedByReason`, pas ici
      // (EX-DATA-46) — confondre les deux ferait tomber la couverture pour un motif qu'elle ne mesure pas.
      announcedListingCount: manifest.listingCount,
      rejectedCount: ingest.rejectedCount,
      rejectedByReason: ingest.rejectedByReason,
      duplicateListingCount: ingest.duplicateListingCount,
      duplicateValueConflictCount: ingest.duplicateValueConflictCount,
      unknownCountByField: ingest.unknownCountByField,
      ingestFlagCounts: ingest.ingestFlagCounts,
      versionStrippedRate: rowCount === 0 ? 0 : stripped / rowCount,
      coverageNote: this.buildCoverageNote(manifest, ingest, notes),
    };
  }

  /**
   * `coverageNote` — ce que ce provider sert, ce qu'il ne sert pas, et ce qu'il a mesuré sans
   * pouvoir le transporter. `EX-DATA-61bis` interdit d'employer « couverture » sans qualificatif ;
   * `EX-DATA-46` exige que le rapport d'ingestion rende auditable ce que l'adaptateur n'a pas su
   * servir.
   */
  private buildCoverageNote(
    manifest: SnapshotManifest,
    ingest: BaselineIngestSummary,
    notes: readonly (string | null)[],
  ): string {
    const parts: string[] = [];
    parts.push(
      `Jeu de données FIXTURE (PLAN-3) : annonces FICTIVES à la forme AutoScout24, profil ` +
        `${this.profile}, snapshot ${manifest.snapshotId} du ${manifest.capturedAt}, généré avec la ` +
        `graine ${manifest.seed}. Ce n’est ni un marché réel, ni une distribution calculée à la volée.`,
    );
    parts.push(
      `Ingestion : ${ingest.lineCount} lignes lues, ${ingest.listingCount} retenues, ` +
        `${ingest.rejectedCount} rejetées, ${ingest.duplicateListingCount} doublons d’identifiant ` +
        `arbitrés (critères D3-15 : complétude, date de mise à jour, signature — jamais l’ordre du fichier).`,
    );
    // Tailles ANNONCÉES par le manifest, jamais estimées : elles disent ce que le jeu pèse
    // réellement et rendent le budget `EX-NFR-3` vérifiable depuis l'application elle-même.
    const announced = manifest.listingCount;
    const kept = ingest.listingCount;
    parts.push(
      `Taille : ${announced} annonces annoncées au manifest, ${kept} servies ` +
        `(couverture d’échantillon ${announced === 0 ? 'indéterminée' : `${((100 * kept) / announced).toFixed(1)} %`})` +
        `${manifest.uncompressedBytes === undefined ? '' : `, ${(manifest.uncompressedBytes / 1048576).toFixed(2)} Mio non compressés`}` +
        `${manifest.compressedBytes === undefined ? '' : `, ${(manifest.compressedBytes / 1048576).toFixed(2)} Mio gzip`}` +
        `${manifest.groundTruth.length === 0 ? '' : `, ${manifest.groundTruth.length} anomalies déclarées en vérité terrain`}.`,
    );
    parts.push(
      'Provenance de la mesure (co2Source, EX-DATA-35) : DÉRIVÉE par l’adaptateur mais sans colonne ' +
        `dans l’interface v1 (dette D8-32, statu quo D3-08) — distribution mesurée : ` +
        `WLTP ${ingest.measurementCounts.WLTP}, NEDC ${ingest.measurementCounts.NEDC}, ` +
        `indéterminée ${ingest.measurementCounts.UNKNOWN}.`,
    );
    const notices = Object.entries(ingest.noticeCounts);
    parts.push(
      notices.length === 0
        ? 'Aucune condition hors vocabulaire des drapeaux d’ingestion détectée.'
        : 'Conditions détectées hors du vocabulaire KYCAR_INGEST_FLAG (codes d’anomalie du manifest, ' +
          `sans bit dédié) : ${notices.map(([k, v]) => `${k} ${v}`).join(', ')}.`,
    );
    parts.push(
      'Diagnostic de représentativité (coverageWarning, samplingBias, adTierDistribution, D8-10) : ' +
        'non publié — ce sont des propriétés de la SOURCE, et les inventer sur un jeu fictif ' +
        'décrirait un biais qui n’existe pas.',
    );
    for (const note of notes) if (note !== null && note.length > 0) parts.push(note);
    return parts.join(' ');
  }

  private requireState(): OpenState {
    if (this.state === null) {
      throw new Error('FixtureDataProvider : openSnapshot doit être appelée avant tout accès aux données');
    }
    return this.state;
  }

  private ensureIdIndex(batch: ListingColumnBatch): Map<string, number> {
    const state = this.requireState();
    if (state.idByHex === null) {
      const map = new Map<string, number>();
      for (let i = 0; i < batch.rowCount; i += 1) map.set(hexOfUuid(batch.listingId, i * 16), i);
      state.idByHex = map;
    }
    return state.idByHex;
  }
}

/**
 * Ce que l'ingestion a mesuré, réduit à ce que le DESCRIPTEUR et l'ARTEFACT publient. C'est la
 * frontière exacte entre « ce qu'il faut relire le fichier pour savoir » et « ce qu'un précalcul
 * peut porter » : tout ce qui est ici se précalcule, le reste (les lignes elles-mêmes) ne se
 * précalcule pas.
 */
function summaryOf(report: IngestReport): BaselineIngestSummary {
  return {
    lineCount: report.lineCount,
    listingCount: report.rows.length,
    rejectedCount: report.rejectedCount,
    rejectedByReason: report.rejectedByReason,
    duplicateListingCount: report.duplicateListingCount,
    duplicateValueConflictCount: report.duplicateValueConflictCount,
    unknownCountByField: report.unknownCountByField,
    ingestFlagCounts: report.ingestFlagCounts,
    noticeCounts: report.noticeCounts,
    measurementCounts: {
      WLTP: report.measurementCounts.WLTP,
      NEDC: report.measurementCounts.NEDC,
      UNKNOWN: report.measurementCounts.UNKNOWN,
    },
  };
}

/** Relit les 16 octets d'un `listingId` sous sa forme canonique 8-4-4-4-12 minuscule. */
function hexOfUuid(bytes: Uint8Array, offset: number): string {
  let hex = '';
  for (let b = 0; b < 16; b += 1) hex += (bytes[offset + b] as number).toString(16).padStart(2, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
