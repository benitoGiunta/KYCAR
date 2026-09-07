/**
 * KYCAR — Les 8 invariants vérifiables du moteur d'agrégation (I1..I8, EX-DATA-104)
 * =================================================================================================
 * Lot D2. Chaque invariant d'EX-DATA-104 (§B.8) est ici une FONCTION exécutable et testable. D4 (le
 * moteur) les rebranchera sur ses vraies sorties ; D2 fige leur sémantique et les couvre par des
 * tests sur données jouet (dont une violation injectée par invariant).
 *
 *   I1  Σ_k listingCount(A_k) = N
 *   I2  ∀k : Σ_j listingCount(B_{k,j}) = listingCount(A_k)
 *   I3  ∀m : Σ_k n_m(A_k) = n_m(Σ)
 *   I4  ∀m : Σ_{bins émis} count = n_m(Σ)
 *   I5  priceQuotedCount + priceOnRequestCount + priceMissingCount = N
 *   I6  outlierEvaluatedCount + outlierNotEvaluatedCount = priceQuotedCount
 *   I7  Σ_{cellules de G} count = n_e ; et par colonne d'année, Σ cellules = effectif du bin d'année
 *   I8  BIN(permutation(V)) = BIN(V) octet à octet ; min(V) au premier bin, max(V) au dernier
 */

import type { AggregationMetric } from './entities';

/** Résultat d'un contrôle d'invariant. */
export interface InvariantResult {
  readonly id: 'I1' | 'I2' | 'I3' | 'I4' | 'I5' | 'I6' | 'I7' | 'I8';
  readonly ok: boolean;
  readonly detail: string;
}

/* ---- Entrées structurelles minimales (sous-ensembles des entités) ------------------------------ */

interface HasListingCount {
  readonly listingCount: number;
}
interface MakeCounted extends HasListingCount {
  readonly makeId: number;
}
interface ModelCounted extends HasListingCount {
  readonly makeId: number;
}
interface MetricN {
  readonly n: number;
}
interface MakeMetricN {
  readonly price: MetricN;
  readonly year: MetricN;
  readonly mileage: MetricN;
}
interface SelectionMetricN {
  readonly selectionCount: number;
  readonly price: MetricN;
  readonly year: MetricN;
  readonly mileage: MetricN;
  readonly priceQuotedCount: number;
  readonly priceOnRequestCount: number;
  readonly priceMissingCount: number;
  readonly outlierEvaluatedCount: number;
  readonly outlierNotEvaluatedCount: number;
}
interface BucketCounted {
  readonly metric: AggregationMetric;
  readonly count: number;
}
interface DensityCounted {
  readonly yearBinIndex: number;
  readonly count: number;
}
interface BinRange {
  readonly lowerBound: number;
  readonly upperBound: number;
}

const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

/** I1 — la somme des effectifs de marque égale l'effectif de la sélection. */
export function checkI1(makeAggregates: readonly HasListingCount[], selectionCount: number): InvariantResult {
  const total = sum(makeAggregates.map((a) => a.listingCount));
  return {
    id: 'I1',
    ok: total === selectionCount,
    detail: `Σ listingCount(marque) = ${total} ; N = ${selectionCount}`,
  };
}

/** I2 — pour chaque marque, la somme des effectifs de ses modèles égale l'effectif de la marque. */
export function checkI2(
  makeAggregates: readonly MakeCounted[],
  modelAggregates: readonly ModelCounted[],
): InvariantResult {
  const byMake = new Map<number, number>();
  for (const m of modelAggregates) byMake.set(m.makeId, (byMake.get(m.makeId) ?? 0) + m.listingCount);
  for (const a of makeAggregates) {
    const modelSum = byMake.get(a.makeId) ?? 0;
    if (modelSum !== a.listingCount) {
      return {
        id: 'I2',
        ok: false,
        detail: `marque ${a.makeId} : Σ modèles = ${modelSum} ≠ listingCount marque = ${a.listingCount}`,
      };
    }
  }
  return { id: 'I2', ok: true, detail: `${makeAggregates.length} marques cohérentes` };
}

/** I3 — pour chaque métrique, la somme des effectifs métriques par marque égale l'effectif global. */
export function checkI3(
  makeAggregates: readonly MakeMetricN[],
  selection: SelectionMetricN,
): InvariantResult {
  const metrics: readonly AggregationMetric[] = ['price', 'year', 'mileage'];
  for (const m of metrics) {
    const total = sum(makeAggregates.map((a) => a[m].n));
    if (total !== selection[m].n) {
      return { id: 'I3', ok: false, detail: `métrique ${m} : Σ n(marque) = ${total} ≠ n(Σ) = ${selection[m].n}` };
    }
  }
  return { id: 'I3', ok: true, detail: 'price/year/mileage cohérents' };
}

/** I4 — pour chaque métrique, la somme des effectifs de bins égale l'effectif métrique. */
export function checkI4(buckets: readonly BucketCounted[], selection: SelectionMetricN): InvariantResult {
  const metrics: readonly AggregationMetric[] = ['price', 'year', 'mileage'];
  for (const m of metrics) {
    const total = sum(buckets.filter((b) => b.metric === m).map((b) => b.count));
    if (total !== selection[m].n) {
      return { id: 'I4', ok: false, detail: `métrique ${m} : Σ bins = ${total} ≠ n(Σ) = ${selection[m].n}` };
    }
  }
  return { id: 'I4', ok: true, detail: 'histogrammes cohérents avec les effectifs métriques' };
}

/** I5 — la partition du statut de prix est exhaustive : quoted + onRequest + missing = N. */
export function checkI5(selection: SelectionMetricN): InvariantResult {
  const total = selection.priceQuotedCount + selection.priceOnRequestCount + selection.priceMissingCount;
  return {
    id: 'I5',
    ok: total === selection.selectionCount,
    detail: `quoted+onRequest+missing = ${total} ; N = ${selection.selectionCount}`,
  };
}

/** I6 — les annonces à prix affiché se partitionnent en évaluées / non évaluées pour l'outlier. */
export function checkI6(selection: SelectionMetricN): InvariantResult {
  const total = selection.outlierEvaluatedCount + selection.outlierNotEvaluatedCount;
  return {
    id: 'I6',
    ok: total === selection.priceQuotedCount,
    detail: `evaluated+notEvaluated = ${total} ; priceQuotedCount = ${selection.priceQuotedCount}`,
  };
}

/**
 * I7 — la grille de densité totalise l'effectif éligible `n_e`, et chaque colonne d'année totalise
 * l'effectif du bin d'année correspondant.
 * @param cells cellules de densité.
 * @param eligibleCount `n_e` (effectif éligible du nuage / densité).
 * @param yearBucketCountByIndex effectif du bin d'année, indexé par `yearBinIndex`.
 */
export function checkI7(
  cells: readonly DensityCounted[],
  eligibleCount: number,
  yearBucketCountByIndex: ReadonlyMap<number, number>,
): InvariantResult {
  const total = sum(cells.map((c) => c.count));
  if (total !== eligibleCount) {
    return { id: 'I7', ok: false, detail: `Σ cellules = ${total} ≠ n_e = ${eligibleCount}` };
  }
  const byYear = new Map<number, number>();
  for (const c of cells) byYear.set(c.yearBinIndex, (byYear.get(c.yearBinIndex) ?? 0) + c.count);
  for (const [yearIndex, colCount] of byYear) {
    const expected = yearBucketCountByIndex.get(yearIndex) ?? 0;
    if (colCount !== expected) {
      return {
        id: 'I7',
        ok: false,
        detail: `colonne année ${yearIndex} : Σ cellules = ${colCount} ≠ effectif bin année = ${expected}`,
      };
    }
  }
  return { id: 'I7', ok: true, detail: `${cells.length} cellules cohérentes` };
}

/**
 * I8 — le binning est invariant par permutation (octet à octet), et `min`/`max` tombent dans le
 * premier / dernier bin émis. Invariant d'ordre supérieur : il reçoit la fonction `BIN` de D4.
 * @param binFn fonction de binning : liste de valeurs → liste ordonnée de bins émis.
 * @param values valeurs jouet (non vides).
 * @param permutation permutation des mêmes valeurs (par défaut, inversion).
 */
export function checkI8(
  binFn: (values: readonly number[]) => readonly BinRange[],
  values: readonly number[],
  permutation?: readonly number[],
): InvariantResult {
  if (values.length === 0) return { id: 'I8', ok: false, detail: 'aucune valeur fournie' };
  const perm = permutation ?? [...values].reverse();
  const a = binFn(values);
  const b = binFn(perm);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    return { id: 'I8', ok: false, detail: 'BIN(permutation(V)) ≠ BIN(V) octet à octet' };
  }
  if (a.length === 0) return { id: 'I8', ok: false, detail: 'aucun bin émis' };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const first = a[0] as BinRange;
  const last = a[a.length - 1] as BinRange;
  if (min < first.lowerBound || min > first.upperBound) {
    return { id: 'I8', ok: false, detail: `min(V) = ${min} hors du premier bin [${first.lowerBound}, ${first.upperBound}]` };
  }
  if (max < last.lowerBound || max > last.upperBound) {
    return { id: 'I8', ok: false, detail: `max(V) = ${max} hors du dernier bin [${last.lowerBound}, ${last.upperBound}]` };
  }
  return { id: 'I8', ok: true, detail: `${a.length} bins, invariance par permutation vérifiée` };
}
