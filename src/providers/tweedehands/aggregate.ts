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

import { MODEL_ID_UNRESOLVED } from '../../types/sentinels';
import { PRICE_SENTINEL_ABSOLUTE_EUR } from '../../types/shared-rules';
import { AD_TIER_VALUES } from '../../types/vocabularies';
import type {
  AdTierDistribution,
  CoverageWarning,
  MakeAggregate,
  MetricRange,
  ModelAggregate,
} from '../DataProvider';
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

/* ================================================================================================
 * Phase 2.8 (D8-10) — diagnostic de représentativité publié PAR LE PROVIDER RÉEL
 * ==============================================================================================
 * Trois champs optionnels de `MakeAggregate`/`ModelAggregate` (D8-10) que SEUL un provider réel peut
 * renseigner, parce qu'ils décrivent la SOURCE et non les données : `coverageWarning`,
 * `samplingBias`, `adTierDistribution`.
 *
 * DÉNOMINATEUR DE `coverageWarning` — DÉCISION EXPLICITE. `EX-DATA-17` définit
 * `priceCoverage = priceQuotedCount / listingCount`. Sur cette source, `listingCount` est le compte
 * EXHAUSTIF de la facette (`totalResultCount`, ~5 220 pour Opel) alors que les compteurs de statut
 * sont mesurés sur l'ÉCHANTILLON lu (30 annonces/page) : leur rapport ne mesurerait pas la
 * représentativité du prix, mais la taille de l'échantillon — il vaudrait ~0,006 pour TOUTES les
 * marques, et l'avertissement, toujours vrai, ne dirait plus rien. Le dénominateur retenu est donc
 * l'EFFECTIF DE L'ÉCHANTILLON sur lequel les statistiques sont effectivement calculées, cohérent
 * avec l'en-tête de ce fichier (« MetricRange.n porte le compte de l'échantillon utilisé, jamais
 * listingCount »). La couverture d'échantillon, elle, reste publiée à part (`sampleCoverage`), et
 * `coverageNote` du descripteur nomme les deux dénominateurs — `EX-DATA-61bis` interdit le mot
 * « couverture » sans qualificatif, pas deux rapports nommés.
 */

/** Seuil d'`EX-DATA-17` : sous 80 % de couverture, l'agrégat porte l'avertissement. */
const COVERAGE_WARNING_THRESHOLD = 0.8;

/** Seuil d'`EX-DATA-43` : au-delà de 30 % d'annonces promues, l'échantillon est déclaré biaisé. */
const SAMPLING_BIAS_THRESHOLD = 0.3;

/**
 * `EX-DATA-68` / `EX-DATA-71` (D8-10, FV-02) — modèles DISTINCTS présents dans l'échantillon, la
 * clé réservée `modelId = 0` (« Modèle non identifié », `EX-DATA-72`) exclue. `null` quand
 * l'échantillon est vide : l'écran affiche alors « — », JAMAIS `0` — c'est exactement le
 * « 0 modèles » de FV-02 que ce champ supprime.
 *
 * PLANCHER ASSUMÉ : comme les trois `MetricRange`, ce compte est mesuré sur l'échantillon lu, pas
 * sur la population exhaustive. Énumérer les modèles réellement présents exigerait un aller réseau
 * PAR MODÈLE de la marque (jusqu'à ~60), ce que le budget d'ouverture de snapshot interdit.
 */
function distinctModelCount(sample: readonly NormalizedListing[]): number | null {
  if (sample.length === 0) return null;
  const models = new Set<number>();
  for (const l of sample) {
    if (l.modelId !== MODEL_ID_UNRESOLVED) models.add(l.modelId);
  }
  return models.size;
}

/** `EX-DATA-17` (prix) et `EX-DATA-61` (année, kilométrage) — trois avertissements de couverture. */
function coverageWarningOf(
  sample: readonly NormalizedListing[],
  ranges: { price: MetricRange; mileage: MetricRange; year: MetricRange },
): CoverageWarning {
  const n = sample.length;
  if (n === 0) return { price: true, year: true, mileage: true };
  const quoted = sample.filter((l) => l.priceStatus === 'QUOTED').length;
  return {
    price: quoted / n < COVERAGE_WARNING_THRESHOLD,
    year: ranges.year.n / n < COVERAGE_WARNING_THRESHOLD,
    mileage: ranges.mileage.n / n < COVERAGE_WARNING_THRESHOLD,
  };
}

/** `EX-DATA-68` — effectif par code de `KYCAR_AD_TIER` : les 5 codes, toujours, y compris à zéro. */
function adTierDistributionOf(sample: readonly NormalizedListing[]): AdTierDistribution {
  const dist: Record<string, number> = {};
  for (const def of AD_TIER_VALUES) dist[def.code] = 0;
  for (const l of sample) {
    const code = l.adTier ?? 'NONE';
    if (dist[code] === undefined) continue; // code hors vocabulaire : déjà signalé ENUM_UNKNOWN.
    dist[code] = (dist[code] as number) + 1;
  }
  return dist;
}

/** `EX-DATA-43` — part d'annonces promues au-delà de 30 % : l'échantillon est déclaré biaisé. */
function samplingBiasOf(sample: readonly NormalizedListing[]): boolean {
  if (sample.length === 0) return false;
  const promoted = sample.filter((l) => (l.adTier ?? 'NONE') !== 'NONE').length;
  return promoted / sample.length > SAMPLING_BIAS_THRESHOLD;
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
  const ranges = rangesOf(own);
  return {
    makeId,
    listingCount,
    ...ranges,
    sampleCoverage: listingCount > 0 ? own.length / listingCount : null,
    modelCount: distinctModelCount(own),
    coverageWarning: coverageWarningOf(own, ranges),
    samplingBias: samplingBiasOf(own),
    adTierDistribution: adTierDistributionOf(own),
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
  const ranges = rangesOf(own);
  return {
    makeId,
    modelId,
    listingCount,
    ...ranges,
    sampleCoverage: listingCount > 0 ? own.length / listingCount : null,
    coverageWarning: coverageWarningOf(own, ranges),
    samplingBias: samplingBiasOf(own),
    adTierDistribution: adTierDistributionOf(own),
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
