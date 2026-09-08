/**
 * KYCAR — Agrégation interne du provider synthétique (mode 1, EX-DATA-111)
 * =================================================================================================
 * Agrégation CORRECTE (percentiles exacts, effectifs entiers) mais volontairement simple : le moteur
 * optimisé (balayage colonnaire, worker) est le lot D4, développé en parallèle. Ici, l'objectif est
 * un provider AUTONOME et TESTABLE — les agrégats se calculent directement sur le lot en mémoire.
 *
 * `MetricRange` (min/max/p05/p50/p95/n) est calculé sur les seules valeurs CONNUES (hors sentinelle
 * `-1`). Les percentiles sont exacts par rang le plus proche (EX-DATA-111 : métriques entières).
 */

import type { MakeAggregate, MetricRange, ModelAggregate } from '../DataProvider';
import type { ListingColumnBatch } from '../DataProvider';
import { NUMERIC_UNKNOWN } from '../../types/sentinels';

/** Percentile par rang le plus proche sur un tableau trié croissant non vide (p dans [0, 1]). */
function nearestRank(sorted: readonly number[], p: number): number {
  const n = sorted.length;
  const idx = Math.min(n - 1, Math.max(0, Math.ceil(p * n) - 1));
  return sorted[idx] as number;
}

/** Construit un `MetricRange` à partir de valeurs connues (déjà extraites, sentinelles exclues). */
export function metricRange(values: number[]): MetricRange {
  const n = values.length;
  if (n === 0) return { min: null, max: null, p05: null, p50: null, p95: null, n: 0 };
  values.sort((a, b) => a - b);
  return {
    min: values[0] as number,
    max: values[n - 1] as number,
    p05: nearestRank(values, 0.05),
    p50: nearestRank(values, 0.5),
    p95: nearestRank(values, 0.95),
    n,
  };
}

/** Accumulateur d'un groupe (marque ou modèle). */
interface Group {
  listingCount: number;
  price: number[];
  mileage: number[];
  year: number[];
}

function newGroup(): Group {
  return { listingCount: 0, price: [], mileage: [], year: [] };
}

function pushRow(group: Group, batch: ListingColumnBatch, i: number): void {
  group.listingCount += 1;
  const p = batch.priceEur[i] as number;
  if (p !== NUMERIC_UNKNOWN) group.price.push(p);
  const m = batch.mileageKm[i] as number;
  if (m !== NUMERIC_UNKNOWN) group.mileage.push(m);
  const y = batch.modelYear[i] as number;
  if (y !== NUMERIC_UNKNOWN) group.year.push(y);
}

/** Agrégats par marque sur un ensemble de lignes (indices). `coverage` = 1 si sélection vide, sinon null. */
export function aggregateByMake(
  batch: ListingColumnBatch,
  rowIndices: Iterable<number>,
  coverage: number | null,
): MakeAggregate[] {
  const groups = new Map<number, Group>();
  for (const i of rowIndices) {
    const makeId = batch.makeId[i] as number;
    let g = groups.get(makeId);
    if (g === undefined) {
      g = newGroup();
      groups.set(makeId, g);
    }
    pushRow(g, batch, i);
  }
  const rows: MakeAggregate[] = [];
  for (const [makeId, g] of groups) {
    rows.push({
      makeId,
      listingCount: g.listingCount,
      price: metricRange(g.price),
      mileage: metricRange(g.mileage),
      year: metricRange(g.year),
      sampleCoverage: coverage,
    });
  }
  rows.sort((a, b) => b.listingCount - a.listingCount || a.makeId - b.makeId);
  return rows;
}

/**
 * Agrégats par couple marque/modèle. Si `makeScope` est fourni, restreint aux modèles de cette marque
 * (zones-modèles d'une carte, EX-DATA §B.4).
 */
export function aggregateByModel(
  batch: ListingColumnBatch,
  rowIndices: Iterable<number>,
  coverage: number | null,
  makeScope?: number,
): ModelAggregate[] {
  const groups = new Map<string, { makeId: number; modelId: number; g: Group }>();
  for (const i of rowIndices) {
    const makeId = batch.makeId[i] as number;
    if (makeScope !== undefined && makeId !== makeScope) continue;
    const modelId = batch.modelId[i] as number;
    const key = `${makeId}:${modelId}`;
    let entry = groups.get(key);
    if (entry === undefined) {
      entry = { makeId, modelId, g: newGroup() };
      groups.set(key, entry);
    }
    pushRow(entry.g, batch, i);
  }
  const rows: ModelAggregate[] = [];
  for (const { makeId, modelId, g } of groups.values()) {
    rows.push({
      makeId,
      modelId,
      listingCount: g.listingCount,
      price: metricRange(g.price),
      mileage: metricRange(g.mileage),
      year: metricRange(g.year),
      sampleCoverage: coverage,
    });
  }
  rows.sort((a, b) => b.listingCount - a.listingCount || a.makeId - b.makeId || a.modelId - b.modelId);
  return rows;
}
