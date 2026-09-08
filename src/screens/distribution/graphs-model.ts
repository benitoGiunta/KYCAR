/**
 * KYCAR — Modèles des graphes additionnels G5–G15 (lot D7, EX-SCR-161..170)
 * =================================================================================================
 * Transforme le `ListingColumnBatch` élagué (mode 2, décision O17) en modèles de rendu pour les
 * graphes additionnels normalisés par l'annexe B. Le rendu SVG lui-même est dans les composants ;
 * ces modèles sont PURS et testables.
 *
 * Couverts ici : G5 (médiane prix/année), G6 (dépréciation base 100), G7 (densité prix×km),
 * G8 (écart au prix attendu, 20 premiers outliers), G9/G12/G13/G15 (barres catégorielles),
 * G10 (prix par tranche de km), G14 (médiane prix par palier de puissance).
 *
 * DETTE SIGNALÉE : le rendu fin de chaque graphe (interactions de clic-pose-filtre, infobulles
 * complètes, régimes responsive détaillés) est livré au niveau « lisible et accessible » ; les
 * raffinements d'interaction par graphe (EX-SCR-149/158 clic→filtre sur chaque graphe additionnel)
 * sont un point d'intégration D8 documenté dans le composant.
 */

import type { ListingColumnBatch } from '../../types/index';
import { bin, binIndexOf, PRICE_BIN_PARAMS, MILEAGE_BIN_PARAMS } from '../../engine/bin';
import { isMileageValid, isPriceValid, isYearValid, PRICE_STATUS_QUOTED, yearFromYearMonth } from '../../engine/flags';
import { groupStat, ntile, type GroupPriceStat, type NtileBin } from './group-stat';
import type { OutlierIndex } from '../outlier-index';
import { decodeListingId } from '../../engine/uuid';

/** Prédicat de prix valide pour une ligne du batch. */
function priceValid(batch: ListingColumnBatch, row: number): boolean {
  return isPriceValid(batch.priceEur[row] as number, batch.priceStatus[row] as number, batch.ingestFlags[row] as number);
}
function priceOf(batch: ListingColumnBatch, row: number): number {
  return batch.priceEur[row] as number;
}

/* ---- G5 — Prix médian par année (EX-SCR-161) -------------------------------------------------- */

export interface YearMedianPoint {
  readonly year: number;
  readonly stat: GroupPriceStat;
}

/** G5 : médiane / P25 / P75 du prix par année de 1ʳᵉ immatriculation, années ordonnées croissantes. */
export function buildYearMedian(batch: ListingColumnBatch, rows: Int32Array | readonly number[]): YearMedianPoint[] {
  const valid = (row: number): boolean =>
    priceValid(batch, row) && isYearValid(batch.firstRegistrationYearMonth[row] as number);
  const stats = groupStat(
    rows,
    (row) => yearFromYearMonth(batch.firstRegistrationYearMonth[row] as number),
    (row) => priceOf(batch, row),
    valid,
  );
  return stats.map((s) => ({ year: s.key, stat: s }));
}

/* ---- G6 — Dépréciation base 100 (EX-SCR-162) -------------------------------------------------- */

export interface DepreciationPoint {
  readonly ageYears: number;
  readonly index: number; // base 100 = année la plus récente
  readonly annualLossPct: number | null;
}

export interface DepreciationModel {
  readonly baseYear: number;
  readonly points: readonly DepreciationPoint[];
  /** `null` si non calculable (moins de 3 années à ≥ 5 offres, EX-SCR-162). */
  readonly available: boolean;
}

/** G6 : indice du prix médian par âge, base 100 = médiane de l'année la plus récente. */
export function buildDepreciation(yearMedians: readonly YearMedianPoint[]): DepreciationModel {
  const usable = yearMedians.filter((y) => y.stat.n >= 5 && y.stat.median != null);
  if (usable.length < 3) return { baseYear: 0, points: [], available: false };
  const baseYear = Math.max(...usable.map((y) => y.year));
  const baseMedian = usable.find((y) => y.year === baseYear)!.stat.median as number;
  const byYearDesc = [...usable].sort((a, b) => b.year - a.year);
  const points: DepreciationPoint[] = [];
  let prevMedian: number | null = null;
  for (const y of byYearDesc) {
    const median = y.stat.median as number;
    const index = (median / baseMedian) * 100;
    const annualLossPct = prevMedian != null && prevMedian > 0 ? (1 - median / prevMedian) * 100 : null;
    points.push({ ageYears: baseYear - y.year, index, annualLossPct });
    prevMedian = median;
  }
  return { baseYear, points, available: true };
}

/* ---- G7 — Densité prix × kilométrage (EX-SCR-163, EX-DATA-102bis) ----------------------------- */

export interface DensityCellPM {
  readonly priceBinIndex: number;
  readonly mileageBinIndex: number;
  readonly count: number;
}

export interface PriceMileageDensity {
  readonly cells: readonly DensityCellPM[];
  readonly eligibleCount: number;
  /** `null` si non calculable (< 40 offres, EX-SCR-163). */
  readonly available: boolean;
  readonly maxCount: number;
}

/**
 * G7 : grille prix × km réutilisant EXACTEMENT les bins de `BIN` (EX-DATA-102bis). Une annonce entre
 * si prix ET km valides ; la somme des `count` vaut l'effectif éligible (invariant testable).
 */
export function buildPriceMileageDensity(batch: ListingColumnBatch, rows: Int32Array | readonly number[]): PriceMileageDensity {
  const priceValues: number[] = [];
  const mileageValues: number[] = [];
  const eligibleRows: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as number;
    if (!priceValid(batch, row)) continue;
    if (!isMileageValid(batch.mileageKm[row] as number, batch.ingestFlags[row] as number)) continue;
    eligibleRows.push(row);
    priceValues.push(batch.priceEur[row] as number);
    mileageValues.push(batch.mileageKm[row] as number);
  }
  if (eligibleRows.length < 40) {
    return { cells: [], eligibleCount: eligibleRows.length, available: false, maxCount: 0 };
  }
  const priceBins = bin(priceValues, PRICE_BIN_PARAMS);
  const mileageBins = bin(mileageValues, MILEAGE_BIN_PARAMS);
  const counts = new Map<string, number>();
  let maxCount = 0;
  for (const row of eligibleRows) {
    const pi = binIndexOf(batch.priceEur[row] as number, priceBins);
    const mi = binIndexOf(batch.mileageKm[row] as number, mileageBins);
    const key = `${pi}:${mi}`;
    const next = (counts.get(key) ?? 0) + 1;
    counts.set(key, next);
    if (next > maxCount) maxCount = next;
  }
  const cells: DensityCellPM[] = [];
  for (const [key, count] of counts) {
    const [pi, mi] = key.split(':').map(Number);
    cells.push({ priceBinIndex: pi as number, mileageBinIndex: mi as number, count });
  }
  cells.sort((a, b) => a.priceBinIndex - b.priceBinIndex || a.mileageBinIndex - b.mileageBinIndex);
  return { cells, eligibleCount: eligibleRows.length, available: true, maxCount };
}

/* ---- G8 — Écart au prix attendu, 20 premiers outliers (EX-SCR-164) ---------------------------- */

export interface OutlierLollipop {
  readonly listingId: string;
  readonly row: number;
  readonly deviationPct: number;
  readonly expectedPriceEur: number | null;
  readonly opportunityScore: number;
  readonly priceEur: number;
  readonly method: 'M1' | 'M2';
  readonly cellLabel: string | null;
  readonly cellCount: number;
}

/**
 * G8 : les `limit` premiers écarts, triés par `opportunityScore` DÉCROISSANT (EX-SCR-164), égalités
 * par `priceEur` croissant puis `listingId` croissant. N'inclut que les lignes portant un verdict.
 */
export function buildOutlierLollipops(
  batch: ListingColumnBatch,
  rows: Int32Array | readonly number[],
  outliers: OutlierIndex,
  limit = 20,
): OutlierLollipop[] {
  const items: OutlierLollipop[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as number;
    const id = decodeListingId(batch.listingId, row);
    const entry = outliers.get(id);
    if (entry === undefined || entry.opportunityScore == null || entry.deviationPct == null) continue;
    if (batch.priceStatus[row] !== PRICE_STATUS_QUOTED) continue;
    items.push({
      listingId: id,
      row,
      deviationPct: entry.deviationPct,
      expectedPriceEur: entry.expectedPriceEur,
      opportunityScore: entry.opportunityScore,
      priceEur: batch.priceEur[row] as number,
      method: entry.method,
      cellLabel: entry.cellLabel,
      cellCount: entry.cellCount,
    });
  }
  items.sort((a, b) => {
    if (b.opportunityScore !== a.opportunityScore) return b.opportunityScore - a.opportunityScore;
    if (a.priceEur !== b.priceEur) return a.priceEur - b.priceEur;
    return a.listingId < b.listingId ? -1 : a.listingId > b.listingId ? 1 : 0;
  });
  return items.slice(0, limit);
}

/* ---- G9/G12/G13/G15 — barres catégorielles (EX-SCR-165/167/168/170) --------------------------- */

export interface CategoryBar {
  readonly key: number;
  readonly count: number;
  readonly sharePct: number;
  readonly medianPrice: number | null;
}

/** Barres catégorielles triées par effectif décroissant (EX-SCR-165), part sur l'effectif éligible. */
export function buildCategoryBars(
  batch: ListingColumnBatch,
  rows: Int32Array | readonly number[],
  column: 'fuelCategory' | 'sellerType' | 'priceEvaluationCategory' | 'countryCode',
): CategoryBar[] {
  const col = batch[column];
  const stats = groupStat(
    rows,
    (row) => col[row] as number,
    (row) => priceOf(batch, row),
    (row) => priceValid(batch, row),
  );
  // L'effectif d'une barre est le nombre d'annonces du groupe à prix valide (base des parts).
  const total = stats.reduce((s, g) => s + g.n, 0);
  const bars: CategoryBar[] = stats.map((g) => ({
    key: g.key,
    count: g.n,
    sharePct: total > 0 ? (g.n / total) * 100 : 0,
    medianPrice: g.median,
  }));
  bars.sort((a, b) => b.count - a.count || a.key - b.key);
  return bars;
}

/* ---- G10 — Prix par tranche de kilométrage (EX-SCR-166) --------------------------------------- */

/** G10 : boîtes à moustaches par tranche de rang de kilométrage (5, 3 ou nuage selon effectif). */
export function buildMileageBoxes(
  batch: ListingColumnBatch,
  rows: Int32Array | readonly number[],
): { readonly tiles: NtileBin[]; readonly tileCount: number } {
  const valid = (row: number): boolean =>
    priceValid(batch, row) && isMileageValid(batch.mileageKm[row] as number, batch.ingestFlags[row] as number);
  let nMileage = 0;
  for (let i = 0; i < rows.length; i++) if (valid(rows[i] as number)) nMileage++;
  const q = nMileage < 25 ? 3 : 5; // EX-SCR-166 : 3 tranches sous 25 offres
  const tiles = ntile(rows, (row) => batch.mileageKm[row] as number, (row) => priceOf(batch, row), valid, q);
  return { tiles, tileCount: q };
}

/* ---- G14 — Prix médian par palier de puissance (EX-SCR-169, EX-DATA-83quater) ----------------- */

export const POWER_TIER_WIDTH_KW = 20;

export interface PowerTierBar {
  readonly tierIndex: number;
  readonly loKw: number;
  readonly hiKw: number; // borne haute exclusive − 1 affichée
  readonly stat: GroupPriceStat;
}

/** G14 : médiane du prix par palier de 20 kW (borne haute exclusive). Paliers ordonnés croissants. */
export function buildPowerTiers(batch: ListingColumnBatch, rows: Int32Array | readonly number[]): PowerTierBar[] {
  const valid = (row: number): boolean => priceValid(batch, row) && (batch.powerKw[row] as number) > 0;
  const stats = groupStat(
    rows,
    (row) => Math.floor((batch.powerKw[row] as number) / POWER_TIER_WIDTH_KW),
    (row) => priceOf(batch, row),
    valid,
  );
  return stats.map((s) => ({
    tierIndex: s.key,
    loKw: s.key * POWER_TIER_WIDTH_KW,
    hiKw: (s.key + 1) * POWER_TIER_WIDTH_KW - 1,
    stat: s,
  }));
}
