/**
 * KYCAR — Outillage des sondes transverses `patho` (revue 2.5)
 * =================================================================================================
 * Construit, sans réseau ni DOM, la chaîne réelle `DataProvider → moteur → modèles de vue` sur des
 * jeux de données PATHOLOGIQUES minimaux : chaque sonde décrit ses lignes en clair, ce module les
 * encode dans le contrat colonnaire gelé (`ListingColumnBatch`, `src/providers/DataProvider.ts`),
 * puis les pousse dans `AggregationDataset` (moteur D4) et, de là, dans les modèles de vue des
 * écrans A / B / D.
 *
 * Aucune règle métier n'est réimplémentée ici : les sondes comparent ce que produit `src/` à la
 * décision `ARB-xx` de `reports/REQ-STRESSTEST.md`. Ce fichier n'est PAS un test (il ne correspond
 * pas au motif `*.test.ts` de `vitest.review.config.ts`).
 */

import { AggregationDataset } from '../../../src/engine/index';
import type { RecalcResult } from '../../../src/engine/index';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN, STRINGS_PER_ROW } from '../../../src/types/sentinels';
import { INGEST_FLAG_VALUES, PRICE_STATUS_VALUES } from '../../../src/types/vocabularies';
import type {
  AggregateResult,
  DataProvider,
  ListingColumnBatch,
  MakeAggregate,
  ProviderCapabilities,
  SnapshotDescriptor,
  SnapshotHandle,
} from '../../../src/providers/DataProvider';

/* ================================================================================================
 * 1. Codes utiles (dérivés des vocabulaires gelés de D2, jamais recopiés en dur)
 * ============================================================================================== */

const priceStatusByte = (code: string): number => {
  const i = PRICE_STATUS_VALUES.findIndex((v) => v.code === code);
  if (i < 0) throw new Error(`code de statut de prix inconnu : ${code}`);
  return i;
};

export const PS_QUOTED = priceStatusByte('QUOTED');
export const PS_ON_REQUEST = priceStatusByte('ON_REQUEST');
export const PS_MISSING = priceStatusByte('MISSING');

/** Bit d'un drapeau d'ingestion = son index dans `INGEST_FLAG_VALUES` (contrat colonnaire D2). */
export const ingestBit = (code: string): number => {
  const i = INGEST_FLAG_VALUES.findIndex((v) => v.code === code);
  if (i < 0) throw new Error(`drapeau d'ingestion inconnu : ${code}`);
  return 1 << i;
};

/* ================================================================================================
 * 2. Description en clair d'une ligne pathologique
 * ============================================================================================== */

export interface RowSpec {
  readonly makeId?: number;
  readonly modelId?: number;
  /** Prix en euros, `null` = INCONNU (sentinelle -1). */
  readonly priceEur?: number | null;
  readonly priceStatus?: number;
  readonly mileageKm?: number | null;
  /** Année civile de 1ʳᵉ immatriculation ; `null` = INCONNU. */
  readonly year?: number | null;
  readonly month?: number;
  readonly modelYear?: number | null;
  readonly powerKw?: number | null;
  readonly fuelCategory?: number;
  readonly bodyType?: number;
  readonly transmission?: number;
  readonly sellerType?: number;
  readonly countryCode?: number;
  readonly regionCode?: number;
  readonly priceEvaluationCategory?: number;
  readonly ingestFlags?: number;
  /** 16 octets d'identifiant ; par défaut dérivés déterministiquement de l'indice de ligne. */
  readonly listingIdBytes?: Uint8Array;
  /** [listingUrl, modelVersionRaw, modelVersionClean, fuelSourceLabelRaw, trimTokens]. */
  readonly strings?: readonly string[];
}

export interface BuildBatchOptions {
  readonly snapshotId?: string;
  readonly localDatasetKey?: string;
}

const ENC = new TextEncoder();

/** Identifiant déterministe : les 4 derniers octets portent l'indice de ligne. */
function defaultListingId(row: number): Uint8Array {
  const id = new Uint8Array(16);
  for (let i = 0; i < 12; i += 1) id[i] = (row * 7 + i * 31) & 0xff;
  id[12] = (row >>> 24) & 0xff;
  id[13] = (row >>> 16) & 0xff;
  id[14] = (row >>> 8) & 0xff;
  id[15] = row & 0xff;
  return id;
}

/** Encode une grandeur positive optionnelle vers sa colonne (sentinelle -1 pour l'inconnu). */
function encNum(v: number | null | undefined, fallback: number): number {
  if (v === undefined) return fallback;
  if (v === null) return NUMERIC_UNKNOWN;
  return v;
}

/**
 * Assemble un `ListingColumnBatch` conforme au contrat gelé à partir de lignes décrites en clair.
 * Les valeurs non précisées reçoivent un défaut PLAUSIBLE (annonce saine), pour qu'une sonde ne
 * fasse varier que ce qu'elle attaque.
 */
export function buildBatch(specs: readonly RowSpec[], options: BuildBatchOptions = {}): ListingColumnBatch {
  const n = specs.length;
  const listingId = new Uint8Array(n * 16);
  const priceEur = new Int32Array(n);
  const mileageKm = new Int32Array(n);
  const firstRegistrationYearMonth = new Int32Array(n);
  const modelId = new Int32Array(n);
  const makeId = new Int16Array(n);
  const modelYear = new Int16Array(n);
  const powerKw = new Int16Array(n);
  const co2EmissionsGPerKmX10 = new Int16Array(n);
  const consumptionCombinedL100KmX10 = new Int16Array(n);
  const electricRangeKm = new Int16Array(n);
  const fuelCategory = new Uint8Array(n);
  const bodyType = new Uint8Array(n);
  const transmission = new Uint8Array(n);
  const drivetrain = new Uint8Array(n);
  const offerType = new Uint8Array(n);
  const usageState = new Uint8Array(n);
  const sellerType = new Uint8Array(n);
  const regionCode = new Uint8Array(n);
  const countryCode = new Uint8Array(n);
  const priceStatus = new Uint8Array(n);
  const priceEvaluationCategory = new Uint8Array(n);
  const adTier = new Uint8Array(n);
  const bodyColor = new Uint8Array(n);
  const upholsteryType = new Uint8Array(n);
  const euEmissionStandard = new Uint8Array(n);
  const doorCount = new Uint8Array(n);
  const seatCount = new Uint8Array(n);
  const previousOwnerCount = new Uint8Array(n);
  const imageCount = new Uint8Array(n);
  const booleanFlags = new Uint16Array(n);
  const ingestFlags = new Uint16Array(n);

  const perRowStrings: string[][] = [];

  for (let row = 0; row < n; row += 1) {
    const s = specs[row] as RowSpec;
    listingId.set(s.listingIdBytes ?? defaultListingId(row), row * 16);

    makeId[row] = s.makeId ?? 1;
    modelId[row] = s.modelId ?? 101;

    const price = s.priceEur === undefined ? 15000 : s.priceEur;
    priceEur[row] = price === null ? NUMERIC_UNKNOWN : price;
    priceStatus[row] = s.priceStatus ?? (price === null ? PS_MISSING : PS_QUOTED);

    mileageKm[row] = encNum(s.mileageKm, 60000);

    const year = s.year === undefined ? 2018 : s.year;
    firstRegistrationYearMonth[row] = year === null ? NUMERIC_UNKNOWN : 12 * year + ((s.month ?? 6) - 1);
    modelYear[row] = encNum(s.modelYear, year === null ? NUMERIC_UNKNOWN : year);

    powerKw[row] = encNum(s.powerKw, 85);
    co2EmissionsGPerKmX10[row] = 1200;
    consumptionCombinedL100KmX10[row] = 55;
    electricRangeKm[row] = NUMERIC_UNKNOWN;

    fuelCategory[row] = s.fuelCategory ?? 0;
    bodyType[row] = s.bodyType ?? 0;
    transmission[row] = s.transmission ?? 0;
    drivetrain[row] = 0;
    offerType[row] = 0;
    usageState[row] = 2;
    sellerType[row] = s.sellerType ?? 1;
    regionCode[row] = s.regionCode ?? 0;
    countryCode[row] = s.countryCode ?? 0;
    priceEvaluationCategory[row] = s.priceEvaluationCategory ?? ENUM_UNKNOWN_BYTE;
    adTier[row] = 0;
    bodyColor[row] = 0;
    upholsteryType[row] = 0;
    euEmissionStandard[row] = 6;
    doorCount[row] = 5;
    seatCount[row] = 5;
    previousOwnerCount[row] = 1;
    imageCount[row] = 8;
    booleanFlags[row] = 0;
    ingestFlags[row] = s.ingestFlags ?? 0;

    const base = s.strings ?? [`https://patho.local/l/${row}`, '', '', '', ''];
    const five: string[] = [];
    for (let f = 0; f < STRINGS_PER_ROW; f += 1) five.push(base[f] ?? '');
    perRowStrings.push(five);
  }

  // Zone de chaînes contiguë (EX-DATA-121) : offsets = début de chaque champ, +1 pour la fin.
  const encoded: Uint8Array[] = [];
  let total = 0;
  for (const rowStrings of perRowStrings) {
    for (const value of rowStrings) {
      const bytes = ENC.encode(value);
      encoded.push(bytes);
      total += bytes.length;
    }
  }
  const stringBlob = new Uint8Array(total);
  const stringOffsets = new Uint32Array(n * STRINGS_PER_ROW + 1);
  let cursor = 0;
  for (let i = 0; i < encoded.length; i += 1) {
    stringOffsets[i] = cursor;
    const bytes = encoded[i] as Uint8Array;
    stringBlob.set(bytes, cursor);
    cursor += bytes.length;
  }
  stringOffsets[n * STRINGS_PER_ROW] = cursor;

  return {
    snapshotId: options.snapshotId ?? 'patho-snapshot',
    localDatasetKey: options.localDatasetKey ?? 'FULL',
    rowCount: n,
    listingId,
    priceEur,
    mileageKm,
    firstRegistrationYearMonth,
    modelId,
    makeId,
    modelYear,
    powerKw,
    co2EmissionsGPerKmX10,
    consumptionCombinedL100KmX10,
    electricRangeKm,
    fuelCategory,
    bodyType,
    transmission,
    drivetrain,
    offerType,
    usageState,
    sellerType,
    regionCode,
    countryCode,
    priceStatus,
    priceEvaluationCategory,
    adTier,
    bodyColor,
    upholsteryType,
    euEmissionStandard,
    doorCount,
    seatCount,
    previousOwnerCount,
    imageCount,
    booleanFlags,
    ingestFlags,
    stringBlob,
    stringOffsets,
  };
}

/* ================================================================================================
 * 3. Chaîne provider → moteur
 * ============================================================================================== */

/** Descripteur de snapshot minimal, cohérent avec le lot fourni. */
export function descriptorFor(batch: ListingColumnBatch, announced: number | null = null): SnapshotDescriptor {
  return {
    snapshotId: batch.snapshotId,
    marketplace: 'be',
    capturedAt: '2026-09-01T00:00:00.000Z',
    sourceKind: 'SYNTHETIC',
    providerVersion: 'patho-1',
    listingCount: batch.rowCount,
    announcedListingCount: announced,
    rejectedCount: 0,
    rejectedByReason: {},
    duplicateListingCount: 0,
    duplicateValueConflictCount: 0,
    unknownCountByField: {},
    ingestFlagCounts: {},
    versionStrippedRate: 0,
    coverageNote: null,
  };
}

/**
 * `DataProvider` conforme (mode 1 + mode 2 SERVED) servant un lot fabriqué : c'est la porte R2 par
 * laquelle les données pathologiques entrent, exactement comme un vrai provider.
 */
export function batchProvider(batch: ListingColumnBatch, announced: number | null = null): DataProvider {
  const handle: SnapshotHandle = { descriptor: descriptorFor(batch, announced) };
  const empty = (): AggregateResult<MakeAggregate> => ({
    snapshotId: batch.snapshotId,
    selection: 'FULL:EMPTY',
    selectionCount: batch.rowCount,
    rows: [],
  });
  return {
    describe: (): ProviderCapabilities => ({
      providerId: 'patho-batch',
      providerVersion: 'patho-1',
      marketplace: 'be',
      sourceKind: 'SYNTHETIC',
      mode1: { source: 'LISTINGS' },
      mode2: { kind: 'SERVED', maxSampleSize: null },
    }),
    openSnapshot: (): Promise<SnapshotHandle> => Promise.resolve(handle),
    closeSnapshot: (): Promise<void> => Promise.resolve(),
    fetchBaselineAggregates: (): Promise<AggregateResult<MakeAggregate>> => Promise.resolve(empty()),
    fetchAggregates: (): Promise<AggregateResult<MakeAggregate>> => Promise.resolve(empty()),
    fetchSelectionCount: (): Promise<number> => Promise.resolve(batch.rowCount),
    fetchListingColumns: (): Promise<ListingColumnBatch> => Promise.resolve(batch),
  };
}

/** Pousse un lot venant d'un provider dans le moteur et recalcule la sélection vide. */
export async function recalcThroughProvider(provider: DataProvider): Promise<RecalcResult> {
  const handle = await provider.openSnapshot();
  if (provider.fetchListingColumns === undefined) throw new Error('provider sans mode 2');
  const batch = await provider.fetchListingColumns(handle, 'FULL');
  const dataset = new AggregationDataset(batch);
  return dataset.recalculate({ selectionHash: `${batch.localDatasetKey}:EMPTY` });
}

/** Raccourci : lot fabriqué → provider → moteur. */
export async function recalcOf(specs: readonly RowSpec[]): Promise<RecalcResult> {
  return recalcThroughProvider(batchProvider(buildBatch(specs)));
}

/** Toutes les lignes d'un lot (sélection vide), pour les modèles de vue de l'écran D. */
export function allRows(batch: ListingColumnBatch): Int32Array {
  const rows = new Int32Array(batch.rowCount);
  for (let i = 0; i < batch.rowCount; i += 1) rows[i] = i;
  return rows;
}

/* ================================================================================================
 * 4. Générateurs de cellules
 * ============================================================================================== */

/** `count` annonces d'une même cellule (marque, modèle, année), prix pseudo-aléatoire déterministe. */
export function cell(
  count: number,
  opts: { makeId?: number; modelId?: number; year?: number; basePrice?: number; spread?: number } = {},
): RowSpec[] {
  const base = opts.basePrice ?? 12000;
  const spread = opts.spread ?? 0.25;
  const out: RowSpec[] = [];
  for (let i = 0; i < count; i += 1) {
    // Suite déterministe sans PRNG externe : reste reproductible d'un run à l'autre.
    const t = ((i * 2654435761) % 1000) / 1000;
    out.push({
      makeId: opts.makeId ?? 1,
      modelId: opts.modelId ?? 101,
      year: opts.year ?? 2018,
      month: 1 + (i % 12),
      priceEur: Math.round(base * (1 - spread + 2 * spread * t)),
      mileageKm: 20000 + ((i * 3571) % 120000),
    });
  }
  return out;
}

/* ================================================================================================
 * 5. Invariants de vérité affichée (rejoués sous chaque jeu)
 * ============================================================================================== */

export interface InvariantReport {
  /** I4 — somme des effectifs de bins = effectif de l'échantillon valide de la métrique. */
  readonly priceBucketSum: number;
  readonly priceN: number;
  readonly yearBucketSum: number;
  readonly yearN: number;
  readonly mileageBucketSum: number;
  readonly mileageN: number;
  /** I1/I2 — somme des agrégats modèles d'une marque = agrégat de cette marque. */
  readonly makeCountsMatchModelSums: boolean;
  /** Somme des agrégats marques = effectif de sélection. */
  readonly makeSum: number;
  readonly selectionCount: number;
  /** I5 — partition du statut de prix. */
  readonly priceStatusPartitionOk: boolean;
}

export function checkInvariants(recalc: RecalcResult): InvariantReport {
  const sum = (b: readonly { count: number }[]): number => b.reduce((s, x) => s + x.count, 0);
  const byMake = new Map<number, number>();
  for (const m of recalc.modelAggregates) {
    byMake.set(m.makeId, (byMake.get(m.makeId) ?? 0) + m.listingCount);
  }
  const makeCountsMatchModelSums = recalc.makeAggregates.every(
    (m) => (byMake.get(m.makeId) ?? 0) === m.listingCount,
  );
  const s = recalc.selectionStats;
  return {
    priceBucketSum: sum(recalc.priceHistogram),
    priceN: s.price.n,
    yearBucketSum: sum(recalc.yearHistogram),
    yearN: s.year.n,
    mileageBucketSum: sum(recalc.mileageHistogram),
    mileageN: s.mileage.n,
    makeCountsMatchModelSums,
    makeSum: recalc.makeAggregates.reduce((acc, m) => acc + m.listingCount, 0),
    selectionCount: s.selectionCount,
    priceStatusPartitionOk:
      s.priceQuotedCount + s.priceOnRequestCount + s.priceMissingCount === s.selectionCount,
  };
}
