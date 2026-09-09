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
 *   3. `listings.ndjson.gz` en FLUX (`ndjson.ts`) : décompression `DecompressionStream('gzip')` et
 *      découpage ligne à ligne, sans jamais matérialiser le texte entier (budget ARB-55) ;
 *   4. adaptation ligne à ligne (`adapters/as24`), **garde R3 d'abord**, rejets comptés par motif ;
 *   5. dédoublonnage `EX-DATA-15` par les critères EXPLICITES de D3-15, indépendants de l'ordre du
 *      fichier ;
 *   6. assemblage colonnaire, puis **baseline précalculée une fois** (ARCHITECTURE §9.3 garde-fou 1 :
 *      `fetchBaselineAggregates` rend le MÊME objet, jamais un recalcul).
 *
 * MODE 1 ET MODE 2. Le lot colonnaire complet est en mémoire : `mode2` est `SERVED`, sans plafond
 * d'échantillon imposé par la source. La compilation de sélection, l'agrégation et l'extraction de
 * sous-ensemble sont celles du lot D3 (`synthetic/selection.ts`, `aggregate.ts`, `columnar.ts`) —
 * les réécrire aurait produit un second moteur d'agrégation à faire diverger.
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
import { hasDuplicateValueConflict, preferCandidate, type DuplicateCandidate } from './dedupe';
import {
  checkSchemaVersion,
  isSnapshotManifest,
  selectSnapshot,
  type FixtureProfile,
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
}

/** État d'un snapshot ouvert. */
interface OpenState {
  readonly batch: ListingColumnBatch;
  readonly descriptor: SnapshotDescriptor;
  readonly baseline: AggregateResult<MakeAggregate>;
  readonly manifest: SnapshotManifest;
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
  private state: OpenState | null = null;
  /** Durée de la dernière ouverture, en millisecondes (mesure du budget S4 de la phase 3.3). */
  private lastOpenMs = 0;

  constructor(options: FixtureProviderOptions) {
    this.ref = options.referenceData;
    this.profile = options.profile;
    this.loader = options.loader;
    this.requestedSnapshotId = options.snapshotId;
    this.verifySha256 = options.verifySha256 ?? options.profile === 'dev';
    this.isoCountryCodes = options.isoCountryCodes ?? null;
    this.providerId = options.providerId ?? `kycar-fixture-${options.profile}`;
    this.coverageWarning = options.coverageWarning ?? null;
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
      // Le lot colonnaire complet est en mémoire : aucun plafond d'échantillon n'est imposé par la
      // source. Ce n'est pas une promesse de volume, c'est l'absence de troncature.
      mode2: { kind: 'SERVED', maxSampleSize: null },
    };
  }

  async openSnapshot(request?: OpenSnapshotRequest): Promise<SnapshotHandle> {
    if (this.state !== null && request?.forceRefresh !== true) {
      return { descriptor: this.state.descriptor };
    }
    const startedAt = Date.now();

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

    const { batch } = assembleBatch(
      report.rows,
      report.listingIdBytes,
      manifest.snapshotId,
      'FULL',
    );

    const descriptor = this.buildDescriptor(manifest, report, [
      verdict.message,
      integrityNote,
      this.coverageWarning,
    ]);

    const baseline: AggregateResult<MakeAggregate> = {
      snapshotId: manifest.snapshotId,
      // EX-DATA-108 (DR-125) : la sélection VIDE se sérialise en chaîne vide.
      selection: '',
      selectionCount: batch.rowCount,
      // §9.3 garde-fou 1 : calculée UNE fois, ici, et servie à l'identique ensuite.
      rows: aggregateByMake(batch, null, 1),
      unsupportedFilterIds: [],
    };

    this.state = { batch, descriptor, baseline, manifest, idByHex: null };
    this.lastOpenMs = Date.now() - startedAt;
    return { descriptor };
  }

  closeSnapshot(_handle: SnapshotHandle): Promise<void> {
    // Idempotente. Le lot est conservé : le rouvrir coûterait une relecture complète du fichier, et
    // `EX-NAV-23` ne demande qu'UN snapshot actif, pas sa destruction à la fermeture d'un écran.
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
    const { batch, descriptor } = this.requireState();
    const compiled = compileSelection(batch, selection, this.ref);
    const indices = selectRows(batch.rowCount, compiled);
    // Couverture publiée seulement pour la sélection vide (interface §4) ; sinon NON_APPLICABLE.
    const coverage = compiled.isEmpty ? 1 : null;
    const rows =
      level === 'MAKE'
        ? aggregateByMake(batch, indices, coverage)
        : aggregateByModel(batch, indices, coverage, makeScope);
    return Promise.resolve({
      snapshotId: descriptor.snapshotId,
      selection,
      selectionCount: indices.length,
      rows,
      // D-03 : les identifiants que la compilation n'a pas su appliquer, jamais tus.
      unsupportedFilterIds: compiled.unsupported,
    });
  }

  /**
   * D-33 : le compteur passe par la MÊME compilation que `fetchAggregates`, donc par la même liste
   * `unsupported`. Un filtre non appliqué ne peut pas rendre ici un effectif différent de celui
   * qu'`fetchAggregates` publierait.
   */
  fetchSelectionCount(_handle: SnapshotHandle, selection: SelectionQuery): Promise<number> {
    const { batch } = this.requireState();
    const compiled = compileSelection(batch, selection, this.ref);
    if (compiled.isEmpty) return Promise.resolve(batch.rowCount);
    let count = 0;
    for (let i = 0; i < batch.rowCount; i += 1) if (compiled.predicate(i)) count += 1;
    return Promise.resolve(count);
  }

  fetchListingColumns(_handle: SnapshotHandle, tSelection: TSelectionQuery): Promise<ListingColumnBatch> {
    const { batch, descriptor } = this.requireState();
    const compiled = compileSelection(batch, tSelection, this.ref);
    if (compiled.isEmpty) return Promise.resolve(batch); // le lot complet porte déjà `FULL`.
    const indices = selectRows(batch.rowCount, compiled);
    const key = sha256Hex(tSelection).slice(0, HASH_LENGTH);
    return Promise.resolve(subsetBatch(batch, indices, descriptor.snapshotId, key));
  }

  fetchListingsByIds(_handle: SnapshotHandle, listingIds: readonly string[]): Promise<ListingColumnBatch> {
    const { batch, descriptor } = this.requireState();
    const index = this.ensureIdIndex();
    const indices: number[] = [];
    for (const id of listingIds) {
      const i = index.get(id.toLowerCase());
      if (i !== undefined) indices.push(i);
    }
    return Promise.resolve(subsetBatch(batch, indices, descriptor.snapshotId, `ids-${indices.length}`));
  }

  /* ---- Accès de mesure (bancs et suite de contrat) ------------------------------------------- */

  /** Durée de la dernière ouverture, en ms (budget S4 : < 2 000 ms sur le profil `dev`). */
  getLastOpenMs(): number {
    return this.lastOpenMs;
  }

  /** Manifest du snapshot ouvert : la vérité terrain des anomalies y vit (`groundTruth`). */
  getManifest(): SnapshotManifest {
    return this.requireState().manifest;
  }

  /** Lot colonnaire complet (mesures de taille mémoire). */
  getBatch(): ListingColumnBatch {
    return this.requireState().batch;
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

  private buildDescriptor(
    manifest: SnapshotManifest,
    report: IngestReport,
    notes: readonly (string | null)[],
  ): SnapshotDescriptor {
    const rowCount = report.rows.length;
    const stripped = report.ingestFlagCounts['VERSION_FULLY_STRIPPED'] ?? 0;
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
      rejectedCount: report.rejectedCount,
      rejectedByReason: report.rejectedByReason,
      duplicateListingCount: report.duplicateListingCount,
      duplicateValueConflictCount: report.duplicateValueConflictCount,
      unknownCountByField: report.unknownCountByField,
      ingestFlagCounts: report.ingestFlagCounts,
      versionStrippedRate: rowCount === 0 ? 0 : stripped / rowCount,
      coverageNote: this.buildCoverageNote(manifest, report, notes),
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
    report: IngestReport,
    notes: readonly (string | null)[],
  ): string {
    const parts: string[] = [];
    parts.push(
      `Jeu de données FIXTURE (PLAN-3) : annonces FICTIVES à la forme AutoScout24, profil ` +
        `${this.profile}, snapshot ${manifest.snapshotId} du ${manifest.capturedAt}, généré avec la ` +
        `graine ${manifest.seed}. Ce n’est ni un marché réel, ni une distribution calculée à la volée.`,
    );
    parts.push(
      `Ingestion : ${report.lineCount} lignes lues, ${report.rows.length} retenues, ` +
        `${report.rejectedCount} rejetées, ${report.duplicateListingCount} doublons d’identifiant ` +
        `arbitrés (critères D3-15 : complétude, date de mise à jour, signature — jamais l’ordre du fichier).`,
    );
    parts.push(
      'Provenance de la mesure (co2Source, EX-DATA-35) : DÉRIVÉE par l’adaptateur mais sans colonne ' +
        `dans l’interface v1 (dette D8-32, statu quo D3-08) — distribution mesurée : ` +
        `WLTP ${report.measurementCounts.WLTP}, NEDC ${report.measurementCounts.NEDC}, ` +
        `indéterminée ${report.measurementCounts.UNKNOWN}.`,
    );
    const notices = Object.entries(report.noticeCounts);
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

  private ensureIdIndex(): Map<string, number> {
    const state = this.requireState();
    if (state.idByHex === null) {
      const map = new Map<string, number>();
      const { batch } = state;
      for (let i = 0; i < batch.rowCount; i += 1) map.set(hexOfUuid(batch.listingId, i * 16), i);
      state.idByHex = map;
    }
    return state.idByHex;
  }
}

/** Relit les 16 octets d'un `listingId` sous sa forme canonique 8-4-4-4-12 minuscule. */
function hexOfUuid(bytes: Uint8Array, offset: number): string {
  let hex = '';
  for (let b = 0; b < 16; b += 1) hex += (bytes[offset + b] as number).toString(16).padStart(2, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
