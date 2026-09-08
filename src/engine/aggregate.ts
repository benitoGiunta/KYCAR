/**
 * KYCAR — Agrégats marque/modèle, statistiques de sélection, histogrammes (lot D4)
 * =================================================================================================
 * À partir des lignes retenues par le balayage, ce module produit en un passage :
 *   - `MakeAggregate[]` / `ModelAggregate[]` (EX-DATA §B.3/B.4) avec leurs `MetricRange` exactes ;
 *   - les blocs `MetricStats` de la sélection (prix/année/kilométrage, EX-DATA-64) ;
 *   - la partition du statut de prix (I5) ;
 *   - les trois histogrammes `DistributionBucket[]` (EX-DATA-75/77, I4).
 *
 * Les échantillons valides suivent EX-DATA-60 (validité par métrique). Les quantiles sont exacts
 * (EX-DATA-111). La couverture d'échantillon (`sampleCoverage`) exige `announcedCount` du référentiel
 * (absent du batch) : elle est laissée à `null` (NON_APPLICABLE) et renseignée par le rendu.
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type {
  AggregationMetric,
  DistributionBucket,
  ListingColumnBatch,
  MakeAggregate,
  MetricRange,
  MetricStats,
  ModelAggregate,
} from '../types/index';
import {
  isMileageValid,
  isPriceValid,
  isYearValid,
  PRICE_STATUS_MISSING,
  PRICE_STATUS_ON_REQUEST,
  PRICE_STATUS_QUOTED,
  yearFromYearMonth,
} from './flags';
import { exactMetricStats } from './quantiles';
import {
  bin,
  MILEAGE_BIN_PARAMS,
  PRICE_BIN_PARAMS,
  toDistributionBuckets,
  YEAR_BIN_PARAMS,
} from './bin';

/**
 * Clé composite ENTIÈRE (marque, modèle) pour les regroupements chauds — évite d'allouer une chaîne
 * `makeId:modelId` par ligne (point chaud mesuré à N = 100 000). Même encodage que `IDX_MODEL`
 * (index-build) : `makeId ∈ Int16`, `modelId < 2²¹`. Interne à l'agrégation ; la clé lisible reste
 * `modelIndexKey` pour l'API d'index/élagage.
 */
const MODEL_KEY_STRIDE = 2097152;
const modelKeyInt = (makeId: number, modelId: number): number => makeId * MODEL_KEY_STRIDE + modelId;

/** `MetricRange` (entité gelée D2) à partir d'un bloc `MetricStats`. */
function toMetricRange(stats: MetricStats): MetricRange {
  return { min: stats.min, max: stats.max, p05: stats.p05, p50: stats.p50, p95: stats.p95, n: stats.n };
}

/** `MetricRange` exacte d'une liste de valeurs entières valides. */
export function metricRangeFromValues(values: readonly number[]): MetricRange {
  return toMetricRange(exactMetricStats(values));
}

/** Accumulateur de valeurs valides d'un groupe (marque ou modèle). */
interface GroupBuckets {
  listingCount: number;
  price: number[];
  year: number[];
  mileage: number[];
}

function newGroup(): GroupBuckets {
  return { listingCount: 0, price: [], year: [], mileage: [] };
}

/** Sortie interne de l'agrégation (assemblée en `SelectionStats` par le noyau). */
export interface AggregateOutput {
  readonly selectionCount: number;
  readonly makeAggregates: readonly MakeAggregate[];
  readonly modelAggregates: readonly ModelAggregate[];
  readonly priceStats: MetricStats;
  readonly yearStats: MetricStats;
  readonly mileageStats: MetricStats;
  readonly priceQuotedCount: number;
  readonly priceOnRequestCount: number;
  readonly priceMissingCount: number;
  readonly priceHistogram: readonly DistributionBucket[];
  readonly yearHistogram: readonly DistributionBucket[];
  readonly mileageHistogram: readonly DistributionBucket[];
}

/** Trie les agrégats par `(listingCount desc, id asc)` — le départage par nom est fait au rendu. */
function compareByCountThenId(aCount: number, aId: number, bCount: number, bId: number): number {
  if (aCount !== bCount) return bCount - aCount;
  return aId - bId;
}

/**
 * Calcule les agrégats et statistiques d'une sélection déjà balayée.
 * @param batch le jeu de données colonnaire.
 * @param rows indices de ligne retenus par le balayage.
 * @param snapshotId identifiant de snapshot (clés d'entité).
 * @param selectionHash hachage de sélection publié (clés d'entité).
 */
export function aggregate(
  batch: ListingColumnBatch,
  rows: Int32Array,
  snapshotId: string,
  selectionHash: string,
): AggregateOutput {
  const n = rows.length;

  const makeGroups = new Map<number, GroupBuckets>();
  const modelGroups = new Map<number, GroupBuckets>();
  const modelIds = new Map<number, { makeId: number; modelId: number }>();

  const selPrice: number[] = [];
  const selYear: number[] = [];
  const selMileage: number[] = [];

  let priceQuotedCount = 0;
  let priceOnRequestCount = 0;
  let priceMissingCount = 0;

  for (let i = 0; i < n; i++) {
    const row = rows[i] as number;
    const makeId = batch.makeId[row] as number;
    const modelId = batch.modelId[row] as number;
    const mKey = modelKeyInt(makeId, modelId);

    let mk = makeGroups.get(makeId);
    if (mk === undefined) {
      mk = newGroup();
      makeGroups.set(makeId, mk);
    }
    let md = modelGroups.get(mKey);
    if (md === undefined) {
      md = newGroup();
      modelGroups.set(mKey, md);
      modelIds.set(mKey, { makeId, modelId });
    }
    mk.listingCount++;
    md.listingCount++;

    // Statut de prix (I5).
    const status = batch.priceStatus[row] as number;
    if (status === PRICE_STATUS_QUOTED) priceQuotedCount++;
    else if (status === PRICE_STATUS_ON_REQUEST) priceOnRequestCount++;
    else if (status === PRICE_STATUS_MISSING) priceMissingCount++;

    // Échantillons valides (EX-DATA-60).
    const ingest = batch.ingestFlags[row] as number;
    const price = batch.priceEur[row] as number;
    if (isPriceValid(price, status, ingest)) {
      selPrice.push(price);
      mk.price.push(price);
      md.price.push(price);
    }
    const ym = batch.firstRegistrationYearMonth[row] as number;
    if (isYearValid(ym)) {
      const year = yearFromYearMonth(ym);
      selYear.push(year);
      mk.year.push(year);
      md.year.push(year);
    }
    const mileage = batch.mileageKm[row] as number;
    if (isMileageValid(mileage, ingest)) {
      selMileage.push(mileage);
      mk.mileage.push(mileage);
      md.mileage.push(mileage);
    }
  }

  const makeAggregates: MakeAggregate[] = [];
  for (const [makeId, g] of makeGroups) {
    makeAggregates.push({
      makeId,
      listingCount: g.listingCount,
      price: metricRangeFromValues(g.price),
      mileage: metricRangeFromValues(g.mileage),
      year: metricRangeFromValues(g.year),
      sampleCoverage: null,
    });
  }
  makeAggregates.sort((a, b) => compareByCountThenId(a.listingCount, a.makeId, b.listingCount, b.makeId));

  const modelAggregates: ModelAggregate[] = [];
  for (const [mKey, g] of modelGroups) {
    const ids = modelIds.get(mKey) as { makeId: number; modelId: number };
    modelAggregates.push({
      makeId: ids.makeId,
      modelId: ids.modelId,
      listingCount: g.listingCount,
      price: metricRangeFromValues(g.price),
      mileage: metricRangeFromValues(g.mileage),
      year: metricRangeFromValues(g.year),
      sampleCoverage: null,
    });
  }
  // Tri (listingCount desc, modelId asc), modelId = 0 (« non identifié ») en dernier (EX-DATA-117).
  modelAggregates.sort((a, b) => {
    if (a.listingCount !== b.listingCount) return b.listingCount - a.listingCount;
    if ((a.modelId === 0) !== (b.modelId === 0)) return a.modelId === 0 ? 1 : -1;
    if (a.makeId !== b.makeId) return a.makeId - b.makeId;
    return a.modelId - b.modelId;
  });

  const priceStats = exactMetricStats(selPrice);
  const yearStats = exactMetricStats(selYear);
  const mileageStats = exactMetricStats(selMileage);

  const priceHistogram = histogramFor(selPrice, PRICE_BIN_PARAMS, snapshotId, selectionHash, 'price');
  const yearHistogram = histogramFor(selYear, YEAR_BIN_PARAMS, snapshotId, selectionHash, 'year');
  const mileageHistogram = histogramFor(selMileage, MILEAGE_BIN_PARAMS, snapshotId, selectionHash, 'mileage');

  return {
    selectionCount: n,
    makeAggregates,
    modelAggregates,
    priceStats,
    yearStats,
    mileageStats,
    priceQuotedCount,
    priceOnRequestCount,
    priceMissingCount,
    priceHistogram,
    yearHistogram,
    mileageHistogram,
  };
}

function histogramFor(
  values: readonly number[],
  params: Parameters<typeof bin>[1],
  snapshotId: string,
  selectionHash: string,
  metric: AggregationMetric,
): DistributionBucket[] {
  return toDistributionBuckets(bin(values, params), snapshotId, selectionHash, metric);
}
