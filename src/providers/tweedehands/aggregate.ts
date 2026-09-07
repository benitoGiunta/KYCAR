/**
 * KYCAR — Adaptateur 2dehands (lot D9) : assemblage des agrégats mode 1 depuis la surface `AGGREGATE_SURFACE`
 * =================================================================================================
 * `Mode1Source = 'AGGREGATE_SURFACE'` (`DataProvider.ts` §2) : ce provider n'a pas d'annonces
 * exploitables en volume, il interroge la surface d'agrégats de 2dehands — un aller réseau par appel
 * (`ARCHITECTURE.md` §6.3). Deux grandeurs de nature différente composent chaque ligne :
 *
 *   - `listingCount` = `totalResultCount` de la réponse — EXHAUSTIF par construction
 *     (`DECISION-coordinateur-source.md` : « totalResultCount est exhaustif par construction »).
 *   - `price`/`mileage`/`year` (`MetricRange`) = calculées sur l'ÉCHANTILLON de la même réponse
 *     (30 annonces/page, `probe-LOT-N.md` req 13) — PAS exhaustives. `MetricRange.n` porte le compte
 *     de l'échantillon utilisé, jamais `listingCount` : c'est le numérateur honnête de la couverture
 *     métrique (`sampleCoverage`), cohérent avec le constat d'audit 1.5 (pagination licite plafonnée
 *     à ~5 010 annonces, échantillon promu à ~95 %) — cette même prudence s'applique aux fourchettes
 *     mode 1, pas seulement au mode 2 refusé.
 */

import type { MakeAggregate, MetricRange, ModelAggregate } from '../DataProvider';
import type { NormalizedListing } from './normalize';

function percentile(sorted: readonly number[], p: number): number | null {
  const n = sorted.length;
  if (n === 0) return null;
  if (n === 1) return sorted[0] ?? null;
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const loVal = sorted[lo];
  const hiVal = sorted[hi];
  if (loVal === undefined || hiVal === undefined) return null;
  if (lo === hi) return loVal;
  return loVal + (hiVal - loVal) * (idx - lo);
}

/**
 * Fourchette d'une métrique sur un échantillon (PAS la population exhaustive — voir en-tête). `n`
 * est l'effectif de valeurs connues dans l'échantillon fourni.
 */
export function computeMetricRange(values: readonly (number | null)[]): MetricRange {
  const known = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (known.length === 0) return { min: null, max: null, p05: null, p50: null, p95: null, n: 0 };
  const sorted = [...known].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? null,
    max: sorted[sorted.length - 1] ?? null,
    p05: percentile(sorted, 0.05),
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    n: sorted.length,
  };
}

/** Construit la ligne `MakeAggregate` d'une marque à partir de son compte exhaustif et de son échantillon. */
export function buildMakeAggregate(
  makeId: number,
  listingCount: number,
  sample: readonly NormalizedListing[],
): MakeAggregate {
  const priceRange = computeMetricRange(sample.map((l) => l.priceEur));
  const sampleSize = sample.length;
  return {
    makeId,
    listingCount,
    price: priceRange,
    mileage: computeMetricRange(sample.map((l) => l.mileageKm)),
    year: computeMetricRange(sample.map((l) => l.modelYear)),
    sampleCoverage: listingCount > 0 ? sampleSize / listingCount : null,
  };
}

/** Construit la ligne `ModelAggregate` d'un couple marque/modèle. */
export function buildModelAggregate(
  makeId: number,
  modelId: number,
  listingCount: number,
  sample: readonly NormalizedListing[],
): ModelAggregate {
  const sampleSize = sample.length;
  return {
    makeId,
    modelId,
    listingCount,
    price: computeMetricRange(sample.map((l) => l.priceEur)),
    mileage: computeMetricRange(sample.map((l) => l.mileageKm)),
    year: computeMetricRange(sample.map((l) => l.modelYear)),
    sampleCoverage: listingCount > 0 ? sampleSize / listingCount : null,
  };
}
