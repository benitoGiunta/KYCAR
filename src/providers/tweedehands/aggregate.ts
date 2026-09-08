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
 *
 * TROIS RÈGLES AJOUTÉES PAR LA REMÉDIATION 2.6 :
 *
 *   1. **EX-DATA-60 (DR-001)** — `computeMetricRange` calcule sur l'ÉCHANTILLON VALIDE : la métrique
 *      `price` exclut les valeurs sous la sentinelle absolue de 250 € (EX-DATA-19(1), ARB-15).
 *      L'annonce reste comptée dans `listingCount` ; elle n'entre ni dans la médiane ni dans les
 *      bornes. Le paramètre `metric` nomme la métrique calculée ; `price` est la valeur par défaut,
 *      la seule des trois à porter une sentinelle absolue.
 *   2. **EX-DATA §B.3 (DR-018)** — l'échantillon d'une marque (resp. d'un couple marque/modèle) est
 *      FILTRÉ sur cette marque avant tout calcul. Une page de facette peut contenir des annonces
 *      d'une autre marque ou de marque non résolue : les laisser entrer faisait alimenter le prix, le
 *      kilométrage et l'année d'une marque par des annonces qui ne lui appartiennent pas. Les
 *      annonces écartées sont COMPTÉES, jamais perdues en silence.
 *   3. **EX-DATA-25/27 (DR-017)** — l'axe « année » est bâti sur `firstRegistrationYear`, jamais sur
 *      `modelYear`. La surface ne servant pas cette date, la fourchette publiée porte `n = 0` et la
 *      note de couverture le dit — plutôt qu'une fourchette décalée d'un à deux ans, sans drapeau.
 */

import { PRICE_SENTINEL_ABSOLUTE_EUR } from '../../types/shared-rules';
import type { MakeAggregate, MetricRange, ModelAggregate } from '../DataProvider';
import type { NormalizedListing } from './normalize';

/** Métrique calculée — seul le prix porte une sentinelle absolue (EX-DATA-19(1)). */
export type MetricKind = 'price' | 'mileage' | 'year';

/** Fourchette vide, publiée quand aucune valeur valide n'est disponible. */
const EMPTY_RANGE: MetricRange = { min: null, max: null, p05: null, p50: null, p95: null, n: 0 };

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
 * est l'effectif de valeurs VALIDES au sens d'EX-DATA-60 dans l'échantillon fourni : valeur connue,
 * et — pour le prix — au-dessus de la sentinelle absolue de 250 €.
 */
export function computeMetricRange(
  values: readonly (number | null)[],
  metric: MetricKind = 'price',
): MetricRange {
  const known = values.filter((v): v is number => v !== null && Number.isFinite(v));
  const valid = metric === 'price' ? known.filter((v) => v >= PRICE_SENTINEL_ABSOLUTE_EUR) : known;
  if (valid.length === 0) return EMPTY_RANGE;
  const sorted = [...valid].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? null,
    max: sorted[sorted.length - 1] ?? null,
    p05: percentile(sorted, 0.05),
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    n: sorted.length,
  };
}

/** Répartition par statut de prix d'un échantillon (I5 d'EX-DATA-104, mesurée sur l'échantillon). */
export interface PriceStatusCounts {
  /** Effectif de l'échantillon sur lequel la partition est mesurée. */
  readonly sampleCount: number;
  readonly priceQuotedCount: number;
  readonly priceOnRequestCount: number;
  readonly priceMissingCount: number;
}

/** Compte les trois statuts de prix d'un échantillon (partition exhaustive : I5). */
export function priceStatusCounts(sample: readonly NormalizedListing[]): PriceStatusCounts {
  let quoted = 0;
  let onRequest = 0;
  let missing = 0;
  for (const listing of sample) {
    if (listing.priceStatus === 'QUOTED') quoted += 1;
    else if (listing.priceStatus === 'ON_REQUEST') onRequest += 1;
    else missing += 1;
  }
  return {
    sampleCount: sample.length,
    priceQuotedCount: quoted,
    priceOnRequestCount: onRequest,
    priceMissingCount: missing,
  };
}

/** Restreint un échantillon aux annonces de la marque (et du modèle) interrogés (DR-018). */
export function sampleForMake(
  sample: readonly NormalizedListing[],
  makeId: number,
  modelId?: number,
): readonly NormalizedListing[] {
  return sample.filter((l) => l.makeId === makeId && (modelId === undefined || l.modelId === modelId));
}

/** Construit les trois fourchettes d'un échantillon déjà restreint (axe année : EX-DATA-25). */
function rangesOf(sample: readonly NormalizedListing[]): {
  price: MetricRange;
  mileage: MetricRange;
  year: MetricRange;
} {
  return {
    price: computeMetricRange(sample.map((l) => l.priceEur), 'price'),
    mileage: computeMetricRange(
      // EX-DATA-60 : un kilométrage nul suspect (annexe A champ 59) sort de `V_mileage`.
      sample.map((l) => (l.ingestFlags.includes('SUSPECT_ZERO_MILEAGE') ? null : l.mileageKm)),
      'mileage',
    ),
    // EX-DATA-25/27 : `firstRegistrationYear`, JAMAIS `modelYear` (DR-017).
    year: computeMetricRange(sample.map((l) => l.firstRegistrationYear), 'year'),
  };
}

/**
 * Construit la ligne `MakeAggregate` d'une marque à partir de son compte exhaustif et de son
 * échantillon. L'échantillon est restreint à la marque interrogée (DR-018) : `sampleCoverage` porte
 * donc le rapport entre l'échantillon RETENU et l'effectif exhaustif.
 */
export function buildMakeAggregate(
  makeId: number,
  listingCount: number,
  sample: readonly NormalizedListing[],
): MakeAggregate {
  const own = sampleForMake(sample, makeId);
  return {
    makeId,
    listingCount,
    ...rangesOf(own),
    sampleCoverage: listingCount > 0 ? own.length / listingCount : null,
  };
}

/** Construit la ligne `ModelAggregate` d'un couple marque/modèle. */
export function buildModelAggregate(
  makeId: number,
  modelId: number,
  listingCount: number,
  sample: readonly NormalizedListing[],
): ModelAggregate {
  const own = sampleForMake(sample, makeId, modelId);
  return {
    makeId,
    modelId,
    listingCount,
    ...rangesOf(own),
    sampleCoverage: listingCount > 0 ? own.length / listingCount : null,
  };
}

/**
 * Ligne RÉSIDUELLE `modelId = 0` (« Modèle non identifié », EX-DATA-72 / ARB-59) d'une marque : elle
 * porte l'écart entre l'effectif exhaustif de la marque et la somme des effectifs de ses modèles.
 * Sans elle, l'invariant I2 d'EX-DATA-104 est violé sur toute source `AGGREGATE_SURFACE` — deux
 * facettes indépendantes ne se réconcilient jamais d'elles-mêmes (DR-040, DR-045).
 */
export function buildUnresolvedModelAggregate(
  makeId: number,
  residualCount: number,
  sample: readonly NormalizedListing[],
): ModelAggregate {
  return buildModelAggregate(makeId, 0, residualCount, sample);
}
