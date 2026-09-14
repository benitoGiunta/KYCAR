/**
 * KYCAR — Fonction BIN et histogrammes (lot D4, EX-DATA-75/76/77/78/79/80/81/82)
 * =================================================================================================
 * `BIN(V, W, T, O)` est l'algorithme UNIQUE de binning (EX-DATA-75). Il est déterministe : sa sortie
 * est une fonction pure du multiensemble `V` et de ses trois paramètres, identique octet à octet quel
 * que soit l'ordre d'entrée (EX-DATA-82, invariant I8). Bornes des bins fermés : `[lo, hi)`
 * semi-ouvert à droite (EX-DATA-76). Deux bins de débordement possibles, émis seulement si non vides
 * (EX-DATA-79). Bins intérieurs vides conservés à `count = 0` (EX-DATA-78).
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { AggregationMetric, DistributionBucket } from '../types/index';
import { quantileFromSorted } from './quantiles';

/** Paramètres de binning (EX-DATA-77). */
export interface BinParams {
  /** Échelle finie de largeurs autorisées `W` (EUR / km / an), triée croissante à l'usage. */
  readonly widths: readonly number[];
  /** Nombre de bins visé `T`. */
  readonly targetBins: number;
  /** Origine de la grille `O`. */
  readonly origin: number;
}

/** Table de paramétrage des trois histogrammes (EX-DATA-77). */
export const PRICE_BIN_PARAMS: BinParams = {
  widths: [100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000],
  targetBins: 24,
  origin: 0,
};
export const MILEAGE_BIN_PARAMS: BinParams = {
  widths: [1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000],
  targetBins: 24,
  origin: 0,
};
export const YEAR_BIN_PARAMS: BinParams = { widths: [1], targetBins: 24, origin: 0 };

/** Un bin brut, avant enrichissement en `DistributionBucket`. */
export interface RawBin {
  readonly index: number;
  readonly lowerBound: number;
  readonly upperBound: number;
  readonly open: boolean;
  count: number;
}

/** Résultat complet de `BIN` (EX-DATA-75). */
export interface BinResult {
  readonly status: 'OK' | 'EMPTY';
  readonly binWidth: number | null;
  readonly bins: readonly RawBin[];
  readonly n: number;
  readonly lowConfidence: boolean;
  readonly underflowCount: number;
  readonly overflowCount: number;
  /** Origine de la grille `O` (rappel, pour mapper une valeur → indice de bin). */
  readonly origin: number;
  /** Indice du premier bin fermé (`plancher((a−O)/w)`), ou `null` si `EMPTY`. */
  readonly kLo: number | null;
  /** Indice du dernier bin fermé (`plancher((b−O)/w)`), ou `null` si `EMPTY`. */
  readonly kHi: number | null;
}

/**
 * Indice du bin d'une valeur, cohérent avec un `BinResult` (EX-DATA-76) : `kLo−1` (débordement bas),
 * `kHi+1` (débordement haut), ou l'indice du bin fermé. Sert à la grille de densité (I7).
 */
export function binIndexOf(value: number, result: BinResult): number {
  if (result.status === 'EMPTY' || result.binWidth === null || result.kLo === null || result.kHi === null) {
    throw new Error('binIndexOf: BinResult vide');
  }
  const k = Math.floor((value - result.origin) / result.binWidth);
  if (k < result.kLo) return result.kLo - 1;
  if (k > result.kHi) return result.kHi + 1;
  return k;
}

/** Sélectionne la largeur `w` : plus petit `u ∈ W` tel que `u ≥ raw`, sinon `max(W)` (EX-DATA-75). */
function selectWidth(widths: readonly number[], raw: number): number {
  const sorted = [...widths].sort((a, b) => a - b);
  for (const u of sorted) {
    if (u >= raw) return u;
  }
  return sorted[sorted.length - 1] as number;
}

/**
 * Cœur de `BIN` : reçoit les valeurs et leurs 1ᵉʳ/99ᵉ centiles pré-calculés (`a`, `b`) pour éviter un
 * second tri quand le bloc statistique les a déjà.
 */
export function binCore(
  values: Int32Array | readonly number[],
  a: number,
  b: number,
  params: BinParams,
): BinResult {
  const n = values.length;
  if (n === 0) {
    return { status: 'EMPTY', binWidth: null, bins: [], n: 0, lowConfidence: true, underflowCount: 0, overflowCount: 0, origin: params.origin, kLo: null, kHi: null };
  }
  const { targetBins: t, origin: o } = params;
  const raw = (b - a) / t;
  const w = selectWidth(params.widths, raw);
  const kLo = Math.floor((a - o) / w);
  const kHi = Math.floor((b - o) / w);

  const span = kHi - kLo + 1;
  const closed: RawBin[] = new Array(span);
  for (let s = 0; s < span; s++) {
    const k = kLo + s;
    closed[s] = { index: k, lowerBound: o + k * w, upperBound: o + (k + 1) * w, open: false, count: 0 };
  }
  let underflowCount = 0;
  let overflowCount = 0;
  for (let i = 0; i < n; i++) {
    const x = values[i] as number;
    const k = Math.floor((x - o) / w);
    if (k < kLo) underflowCount++;
    else if (k > kHi) overflowCount++;
    else (closed[k - kLo] as RawBin).count++;
  }

  const bins: RawBin[] = [];
  if (underflowCount > 0) {
    bins.push({ index: kLo - 1, lowerBound: -Infinity, upperBound: o + kLo * w, open: true, count: underflowCount });
  }
  for (const bin of closed) bins.push(bin);
  if (overflowCount > 0) {
    bins.push({ index: kHi + 1, lowerBound: o + (kHi + 1) * w, upperBound: Infinity, open: true, count: overflowCount });
  }

  return {
    status: 'OK',
    binWidth: w,
    bins,
    n,
    lowConfidence: n < 12,
    underflowCount,
    overflowCount,
    origin: o,
    kLo,
    kHi,
  };
}

/** `BIN(V, …)` complet : calcule `a`/`b` (Q0,01 / Q0,99) puis délègue au cœur (EX-DATA-75). */
export function bin(values: Int32Array | readonly number[], params: BinParams): BinResult {
  const n = values.length;
  if (n === 0) return binCore(values, 0, 0, params);
  const sorted = Int32Array.from(values).sort();
  const a = quantileFromSorted(sorted, 0.01);
  const b = quantileFromSorted(sorted, 0.99);
  return binCore(sorted, a, b, params);
}

/**
 * Convertit un `BinResult` en `DistributionBucket[]` (entité D2), avec `share = count / n` (4
 * décimales, EX-DATA-83). Ordre : débordement bas en tête, bins fermés, débordement haut en fin
 * (EX-DATA-117).
 */
export function toDistributionBuckets(
  result: BinResult,
  snapshotId: string,
  selectionHash: string,
  metric: AggregationMetric,
): DistributionBucket[] {
  const n = result.n;
  return result.bins.map((b) => ({
    snapshotId,
    selectionHash,
    metric,
    index: b.index,
    lowerBound: b.lowerBound,
    upperBound: b.upperBound,
    open: b.open,
    count: b.count,
    share: n > 0 ? Math.round((b.count / n) * 1e4) / 1e4 : 0,
  }));
}

/** Adaptateur pour l'invariant I8 (D2) : `values → [{lowerBound, upperBound}]` sur les bins émis. */
export function binEdges(
  values: readonly number[],
  params: BinParams,
): readonly { readonly lowerBound: number; readonly upperBound: number }[] {
  return bin(values, params).bins.map((b) => ({ lowerBound: b.lowerBound, upperBound: b.upperBound }));
}
