/**
 * KYCAR — GROUPSTAT / NTILE sur le thread principal (lot D7, EX-DATA-83bis/83ter)
 * =================================================================================================
 * Les graphes additionnels G5/G9/G10/G12/G13/G14/G15 ont besoin de statistiques de prix PAR GROUPE
 * (par carburant, par vendeur, par tranche de kilométrage, par année, par palier de puissance…). Le
 * moteur (D4) produit les histogrammes et agrégats marque/modèle, mais pas un GROUPSTAT par clé
 * arbitraire. Comme l'écran B est un écran de mode 2 TOUJOURS ÉLAGUÉ (décision O17 : `m ≈ 10³`), ce
 * calcul tient trivialement sur le thread principal à partir du `ListingColumnBatch`.
 *
 * `groupStat(rows, keyOf, valueOf)` regroupe les lignes par clé entière et calcule, par groupe, les
 * statistiques de prix exactes (médiane, P25, P75, min, max) via les quantiles du moteur. Seules les
 * valeurs valides (fournies par l'appelant) entrent dans les statistiques.
 *
 * Module PUR : testable sans DOM.
 */

import { quantileFromSorted } from '../../engine/quantiles';

/** Statistiques de prix d'un groupe (EX-DATA-83bis). `null` = non calculable (n = 0). */
export interface GroupPriceStat {
  readonly key: number;
  readonly n: number;
  readonly median: number | null;
  readonly p25: number | null;
  readonly p75: number | null;
  readonly p05: number | null;
  readonly p95: number | null;
  readonly min: number | null;
  readonly max: number | null;
}

/** Calcule les statistiques d'un vecteur de valeurs valides déjà collectées. */
export function priceStatOf(values: number[], key: number): GroupPriceStat {
  const n = values.length;
  if (n === 0) {
    return { key, n: 0, median: null, p25: null, p75: null, p05: null, p95: null, min: null, max: null };
  }
  const sorted = Float64Array.from(values).sort();
  return {
    key,
    n,
    median: quantileFromSorted(sorted, 0.5),
    p25: quantileFromSorted(sorted, 0.25),
    p75: quantileFromSorted(sorted, 0.75),
    p05: quantileFromSorted(sorted, 0.05),
    p95: quantileFromSorted(sorted, 0.95),
    min: sorted[0] as number,
    max: sorted[n - 1] as number,
  };
}

/**
 * GROUPSTAT : regroupe `rows` par `keyOf(row)` (clé entière), collecte `valueOf(row)` quand
 * `isValid(row)` est vrai, et calcule les statistiques de prix par groupe. Retourne les groupes
 * triés par clé croissante.
 */
export function groupStat(
  rows: Int32Array | readonly number[],
  keyOf: (row: number) => number,
  valueOf: (row: number) => number,
  isValid: (row: number) => boolean,
): GroupPriceStat[] {
  const buckets = new Map<number, number[]>();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as number;
    if (!isValid(row)) continue;
    const key = keyOf(row);
    let arr = buckets.get(key);
    if (arr === undefined) {
      arr = [];
      buckets.set(key, arr);
    }
    arr.push(valueOf(row));
  }
  const out: GroupPriceStat[] = [];
  for (const [key, values] of buckets) out.push(priceStatOf(values, key));
  out.sort((a, b) => a.key - b.key);
  return out;
}

/** Une tranche NTILE (EX-DATA-83ter) : rang, bornes observées, statistiques de prix. */
export interface NtileBin {
  readonly rank: number;
  readonly loObserved: number;
  readonly hiObserved: number;
  readonly stat: GroupPriceStat;
}

/**
 * NTILE : découpe les lignes valides en `q` tranches de RANG (effectifs quasi égaux) selon la valeur
 * `sortValueOf`, et calcule les statistiques de prix par tranche (EX-DATA-83ter, G10). Les tranches
 * sont ordonnées par valeur croissante ; les bornes observées sont les min/max de la valeur de tri.
 */
export function ntile(
  rows: Int32Array | readonly number[],
  sortValueOf: (row: number) => number,
  priceOf: (row: number) => number,
  isValid: (row: number) => boolean,
  q: number,
): NtileBin[] {
  const valid: { row: number; sv: number }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as number;
    if (isValid(row)) valid.push({ row, sv: sortValueOf(row) });
  }
  valid.sort((a, b) => a.sv - b.sv || a.row - b.row);
  const n = valid.length;
  if (n === 0 || q < 1) return [];
  const bins: NtileBin[] = [];
  for (let t = 0; t < q; t++) {
    const start = Math.floor((t * n) / q);
    const end = Math.floor(((t + 1) * n) / q);
    if (end <= start) continue;
    const slice = valid.slice(start, end);
    const prices = slice.map((e) => priceOf(e.row));
    bins.push({
      rank: t + 1,
      loObserved: slice[0]!.sv,
      hiObserved: slice[slice.length - 1]!.sv,
      stat: priceStatOf(prices, t + 1),
    });
  }
  return bins;
}
