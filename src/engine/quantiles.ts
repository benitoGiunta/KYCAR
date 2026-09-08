/**
 * KYCAR — Quantiles exacts et statistiques descriptives (lot D4, EX-DATA-62/63/64/65/66/111)
 * =================================================================================================
 * Le quantile de KYCAR est TOUJOURS le quantile de type 7 (interpolation linéaire, convention R /
 * NumPy — EX-DATA-62), calculé en double précision, sans arrondi intermédiaire (EX-DATA-63). Les
 * trois métriques (`price`, `mileage`, `year`) sont des entiers de domaine borné (EX-DATA-111) : on
 * les trie donc EXACTEMENT par comptage (sélection entière) ou par collecte + tri (par groupe),
 * jamais par histogramme, t-digest ou échantillonnage.
 *
 * L'écart-type suit Welford (EX-DATA-66), variante par lots de valeurs identiques (Chan et al.),
 * numériquement stable : `Σ x²` déborderait la précision entière du `double` dès `N·max² > 2⁵³`.
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { MetricStats } from '../types/index';

/** Les cinq probabilités publiées (EX-DATA-64). */
const P05 = 0.05;
const P25 = 0.25;
const P50 = 0.5;
const P75 = 0.75;
const P95 = 0.95;

/**
 * Quantile de type 7 (EX-DATA-62) à partir d'un accès aux statistiques d'ordre 1-indexées.
 * @param orderStat fonction `i → x_i` (1 ≤ i ≤ n), la i-ᵉ plus petite valeur.
 * @param n effectif (≥ 1).
 * @param p probabilité dans [0, 1].
 */
export function quantileType7(orderStat: (i: number) => number, n: number, p: number): number {
  if (n < 1) throw new RangeError('quantileType7: n doit être ≥ 1');
  if (n === 1) return orderStat(1);
  const h = (n - 1) * p + 1;
  const i = Math.floor(h);
  const f = h - i;
  if (f === 0 || i >= n) return orderStat(Math.min(i, n));
  const xi = orderStat(i);
  return xi + f * (orderStat(i + 1) - xi);
}

/** Quantile de type 7 sur un tableau DÉJÀ TRIÉ croissant (accès 0-indexé). */
export function quantileFromSorted(sorted: ArrayLike<number>, p: number): number {
  const n = sorted.length;
  return quantileType7((i) => sorted[i - 1] as number, n, p);
}

/** Les rangs 1-indexés (`i` et `i+1`) dont le type 7 a besoin pour une probabilité `p` à effectif `n`. */
function ranksFor(p: number, n: number): readonly number[] {
  if (n === 1) return [1];
  const h = (n - 1) * p + 1;
  const i = Math.floor(h);
  const f = h - i;
  if (f === 0 || i >= n) return [Math.min(i, n)];
  return [i, i + 1];
}

/**
 * Statistiques d'ordre à partir d'un tableau de comptages (tri par comptage, EX-DATA-111).
 * @param counts `counts[v - valMin]` = effectif de la valeur `v`.
 * @param valMin borne basse observée (valeur de `counts[0]`).
 * @param ranks rangs 1-indexés voulus (n'importe quel ordre).
 * @returns une `Map rang → valeur`.
 */
export function orderStatsFromCounts(
  counts: Int32Array | Uint32Array,
  valMin: number,
  ranks: readonly number[],
): Map<number, number> {
  const wanted = [...new Set(ranks)].sort((a, b) => a - b);
  const out = new Map<number, number>();
  let cumulative = 0;
  let w = 0;
  for (let j = 0; j < counts.length && w < wanted.length; j++) {
    const c = counts[j] as number;
    if (c === 0) continue;
    const nextCumulative = cumulative + c;
    // Tous les rangs de (cumulative, nextCumulative] valent la valeur valMin + j.
    while (w < wanted.length && (wanted[w] as number) <= nextCumulative) {
      out.set(wanted[w] as number, valMin + j);
      w++;
    }
    cumulative = nextCumulative;
  }
  return out;
}

/**
 * Bloc statistique complet (EX-DATA-64), sous-ensemble figé par l'entité D2 `MetricStats` :
 * `n, min, max, mean, p05, p25, p50, p75, p95, stdDev`. Valeurs NON arrondies (double précision,
 * EX-DATA-63) — l'arrondi de présentation est du ressort du rendu.
 * @param counts comptages sur le domaine `[valMin, valMin + counts.length − 1]`.
 * @param valMin borne basse du domaine de comptage.
 * @param n effectif valide (Σ counts). `0` → toutes les statistiques nulles.
 * @param mean moyenne pré-calculée (Welford), ou `null`.
 * @param stdDev écart-type pré-calculé (Welford, Bessel), ou `null`.
 */
export function metricStatsFromCounts(
  counts: Int32Array | Uint32Array,
  valMin: number,
  n: number,
  mean: number | null,
  stdDev: number | null,
): MetricStats {
  if (n <= 0) {
    return { n: 0, min: null, max: null, mean: null, p05: null, p25: null, p50: null, p75: null, p95: null, stdDev: null };
  }
  const ranks = [
    1,
    n,
    ...ranksFor(P05, n),
    ...ranksFor(P25, n),
    ...ranksFor(P50, n),
    ...ranksFor(P75, n),
    ...ranksFor(P95, n),
  ];
  const os = orderStatsFromCounts(counts, valMin, ranks);
  const orderStat = (i: number): number => {
    const v = os.get(i);
    if (v === undefined) throw new Error(`metricStatsFromCounts: statistique d'ordre ${i} manquante`);
    return v;
  };
  return {
    n,
    min: orderStat(1),
    max: orderStat(n),
    mean,
    p05: quantileType7(orderStat, n, P05),
    p25: quantileType7(orderStat, n, P25),
    p50: quantileType7(orderStat, n, P50),
    p75: quantileType7(orderStat, n, P75),
    p95: quantileType7(orderStat, n, P95),
    stdDev,
  };
}

/**
 * Accumulateur de moyenne / variance par lots de valeurs identiques (Welford / Chan, EX-DATA-66).
 * Alimenté en balayant les comptages : un lot = une valeur `v` répétée `c` fois.
 */
export class WelfordAccumulator {
  private n = 0;
  private mean = 0;
  private m2 = 0;

  /** Ajoute `count` occurrences de la valeur `value`. */
  addRepeated(value: number, count: number): void {
    if (count <= 0) return;
    const delta = value - this.mean;
    const newN = this.n + count;
    this.mean += (delta * count) / newN;
    // Lot de valeurs identiques : M2 du lot = 0 ; terme de combinaison = delta² · n · c / (n+c).
    this.m2 += (delta * delta * this.n * count) / newN;
    this.n = newN;
  }

  get count(): number {
    return this.n;
  }

  /** Moyenne, ou `null` si aucun élément. */
  meanOrNull(): number | null {
    return this.n >= 1 ? this.mean : null;
  }

  /** Écart-type d'échantillon (Bessel, `n−1`), `null` si `n < 2` (EX-DATA-65) — jamais `0`. */
  sampleStdDev(): number | null {
    if (this.n < 2) return null;
    return Math.sqrt(this.m2 / (this.n - 1));
  }
}

const EMPTY_STATS: MetricStats = {
  n: 0, min: null, max: null, mean: null, p05: null, p25: null, p50: null, p75: null, p95: null, stdDev: null,
};

/**
 * Bloc statistique EXACT d'une liste de valeurs entières valides (EX-DATA-111 : jamais d'histogramme,
 * de t-digest ni d'échantillonnage — l'ordre statistique complet est réalisé).
 *
 * Deux réalisations EXACTES du même tri, choisies par coût :
 *   - tri par COMPTAGE sur `[min, max]` (EX-DATA-112) quand le domaine est dense — `O(n + domaine)` ;
 *   - tri COMPARATIF `O(n log n)` quand le domaine est CREUX (`domaine > 4·n`).
 *
 * CORRECTION DE PERFORMANCE (lot D4-finition, signalée au rapport) : la version d'origine allouait
 * toujours un `Int32Array(max − min + 1)`. Un groupe marque/modèle contenant un seul outlier de prix
 * (domaine jusqu'à ~3·10⁶) déclenchait une allocation multi-Mo ET deux balayages du domaine PAR
 * groupe → l'agrégation d'un snapshot 100 k coûtait ~25 s. Le tri comparatif sur les groupes creux
 * rend des quantiles type 7 / moyenne / écart-type IDENTIQUES (mêmes statistiques d'ordre), sans
 * changer l'interface publique. Le seuil `4·n` conserve le comptage pour les métriques denses
 * (année, kilométrage groupés) où il reste le plus rapide.
 *
 * @param values valeurs entières valides (ordre indifférent).
 */
export function exactMetricStats(values: Int32Array | readonly number[]): MetricStats {
  const n = values.length;
  if (n === 0) return EMPTY_STATS;
  let lo = values[0] as number;
  let hi = lo;
  for (let k = 1; k < n; k++) {
    const v = values[k] as number;
    if (v < lo) lo = v;
    else if (v > hi) hi = v;
  }
  const domain = hi - lo + 1;
  if (domain > 4 * n) return exactStatsBySort(values, n);

  const counts = new Int32Array(domain);
  for (let k = 0; k < n; k++) {
    const idx = (values[k] as number) - lo;
    counts[idx] = (counts[idx] as number) + 1;
  }
  const welford = new WelfordAccumulator();
  for (let j = 0; j < counts.length; j++) {
    const c = counts[j] as number;
    if (c > 0) welford.addRepeated(lo + j, c);
  }
  return metricStatsFromCounts(counts, lo, n, welford.meanOrNull(), welford.sampleStdDev());
}

/**
 * Réalisation EXACTE par tri comparatif (chemin des domaines creux). Trie une copie `Int32Array`
 * (tri numérique natif), puis lit min/max, les cinq quantiles type 7 sur le tableau trié, et la
 * moyenne / l'écart-type d'échantillon par un passage de Welford. Résultats identiques au comptage.
 */
function exactStatsBySort(values: Int32Array | readonly number[], n: number): MetricStats {
  const sorted = values instanceof Int32Array ? values.slice() : Int32Array.from(values);
  sorted.sort();
  let mean = 0;
  let m2 = 0;
  for (let k = 0; k < n; k++) {
    const x = sorted[k] as number;
    const delta = x - mean;
    mean += delta / (k + 1);
    m2 += delta * (x - mean);
  }
  return {
    n,
    min: sorted[0] as number,
    max: sorted[n - 1] as number,
    mean,
    p05: quantileFromSorted(sorted, P05),
    p25: quantileFromSorted(sorted, P25),
    p50: quantileFromSorted(sorted, P50),
    p75: quantileFromSorted(sorted, P75),
    p95: quantileFromSorted(sorted, P95),
    stdDev: n < 2 ? null : Math.sqrt(m2 / (n - 1)),
  };
}
