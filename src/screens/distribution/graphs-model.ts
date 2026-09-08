/**
 * KYCAR — Modèles des graphes additionnels G5–G15 (lot D7, EX-SCR-161..170 ; D8-07)
 * =================================================================================================
 * Transforme le `ListingColumnBatch` élagué (mode 2, décision O17) en modèles de rendu pour les
 * graphes additionnels normalisés par l'annexe B. Le rendu SVG lui-même est dans les composants ;
 * ces modèles sont PURS et testables.
 *
 * `D8-07` (dette D-17 levée) : G5, G6, G9, G10, G12, G13, G14, G15 ne recalculent plus rien depuis
 * `ListingColumnBatch` — ils consomment `RecalcResult.groupStats`/`ntiles`/`powerTiers`/
 * `depreciationIndex`, calculés dans le WORKER (source unique, `src/engine/stats-protocol.ts`,
 * fix-engine). Un champ ABSENT (`undefined`) rend l'état « indisponible » (`'unavailable'`), JAMAIS
 * un recalcul de repli sur le thread principal — c'est exactement ce que ce lot supprime.
 *
 * G7 (densité prix×km) et G8 (les 20 premiers outliers, hors le libellé `R²` — voir `cellStats`) ne
 * font PAS partie du protocole worker de D8-07 (aucun champ dédié) : ils restent calculés ici, sur le
 * `ListingColumnBatch` déjà élagué du mode 2 (décision O17, calcul trivial pour `m ≈ 10³`).
 */

import type { ListingColumnBatch } from '../../types/index';
import type {
  CellStat,
  DepreciationIndexResult,
  GroupStatKey,
  GroupStatSet,
  NtileResult,
  PowerTierResult,
} from '../../engine/index';
import { bin, binIndexOf, PRICE_BIN_PARAMS, MILEAGE_BIN_PARAMS } from '../../engine/bin';
import { isMileageValid, isPriceValid, PRICE_STATUS_QUOTED } from '../../engine/flags';
import type { OutlierIndex } from '../outlier-index';
import { decodeListingId } from '../../engine/uuid';

/** Marqueur d'indisponibilité (`D8-07`) : le champ correspondant de `RecalcResult` n'est pas encore
 * rempli par le worker (fix-engine non fusionné, ou moteur ne l'a pas calculé pour cette sélection).
 * Jamais un tableau vide silencieux : le composant de rendu doit distinguer « aucune donnée » de
 * « pas encore de moteur qui la publie ». */
export const UNAVAILABLE = 'unavailable' as const;
export type Unavailable = typeof UNAVAILABLE;

/** Prédicat de prix valide pour une ligne du batch (G7/G8, seuls graphes encore calculés ici). */
function priceValid(batch: ListingColumnBatch, row: number): boolean {
  return isPriceValid(batch.priceEur[row] as number, batch.priceStatus[row] as number, batch.ingestFlags[row] as number);
}

/* ---- G5 — Prix médian par année (EX-SCR-161, D8-07) -------------------------------------------- */

/** Bloc statistique minimal consommé par le rendu de G5 (`YearMedianChart` n'utilise que `n`/`median`). */
export interface YearMedianStat {
  readonly n: number;
  readonly median: number | null;
}

export interface YearMedianPoint {
  readonly year: number;
  readonly stat: YearMedianStat;
}

/**
 * G5 : médiane du prix par année de 1ʳᵉ immatriculation, années ordonnées croissantes — lu depuis
 * `RecalcResult.groupStats` (clé `yearBucket`, métrique `price`, EX-DATA-83bis), calculé par le
 * worker. `groupStats` absent (moteur pas encore fusionné/calculé) → `'unavailable'`.
 */
export function buildYearMedian(groupStats: readonly GroupStatSet[] | undefined): readonly YearMedianPoint[] | Unavailable {
  if (groupStats === undefined) return UNAVAILABLE;
  const set = groupStats.find((s) => s.key === 'yearBucket' && s.metric === 'price');
  if (set === undefined) return UNAVAILABLE;
  return [...set.groups].sort((a, b) => a.key - b.key).map((g) => ({ year: g.key, stat: { n: g.n, median: g.median } }));
}

/* ---- G6 — Dépréciation base 100 (EX-SCR-162, D8-07/EX-DATA-83quinquies) ------------------------ */

export interface DepreciationPoint {
  readonly ageYears: number;
  readonly index: number; // base 100 = année de référence (`baseYear`)
  readonly annualLossPct: number | null;
}

export interface DepreciationModel {
  readonly baseYear: number;
  readonly points: readonly DepreciationPoint[];
  /** `null` si non calculable (moins de 3 années à `n_price ≥ 12`, EX-DATA-83quinquies). */
  readonly available: boolean;
}

/**
 * G6 : indice du prix médian par âge — lu tel quel depuis `RecalcResult.depreciationIndex`, calculé
 * dans le worker (source unique, EX-DATA-83quinquies). `depreciationIndex` absent → `'unavailable'`.
 */
export function buildDepreciation(depreciationIndex: DepreciationIndexResult | undefined): DepreciationModel | Unavailable {
  if (depreciationIndex === undefined) return UNAVAILABLE;
  if (depreciationIndex.baseYear === null) return { baseYear: 0, points: [], available: false };
  const baseYear = depreciationIndex.baseYear;
  const points = depreciationIndex.entries
    .filter((e): e is typeof e & { index: number } => e.index !== null)
    .map((e) => ({ ageYears: baseYear - e.year, index: e.index, annualLossPct: e.annualLossPct }))
    .sort((a, b) => a.ageYears - b.ageYears);
  return { baseYear, points, available: points.length > 0 };
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

/* ---- G9/G12/G13/G15 — barres catégorielles (EX-SCR-165/167/168/170, D8-07) --------------------- */

export interface CategoryBar {
  readonly key: number;
  readonly count: number;
  readonly sharePct: number;
  readonly medianPrice: number | null;
}

/** Les quatre clés de `GROUPSTAT` consommées par les graphes catégoriels (G9/G12/G13/G15). */
export type CategoryBarKey = Extract<GroupStatKey, 'fuelCategory' | 'sellerType' | 'priceEvaluationCategory' | 'countryCode'>;

/**
 * Barres catégorielles triées par effectif décroissant (EX-SCR-165), part sur l'effectif à prix
 * valide du groupe — lues depuis `RecalcResult.groupStats` (clé `column`, métrique `price`).
 * `groupStats` absent, ou aucun groupe pour `column` (résultat structurellement vide) → `'unavailable'`.
 */
export function buildCategoryBars(groupStats: readonly GroupStatSet[] | undefined, column: CategoryBarKey): readonly CategoryBar[] | Unavailable {
  if (groupStats === undefined) return UNAVAILABLE;
  const set = groupStats.find((s) => s.key === column && s.metric === 'price');
  if (set === undefined) return UNAVAILABLE;
  // L'effectif d'une barre est le nombre d'annonces du groupe à prix valide (base des parts).
  const total = set.groups.reduce((s, g) => s + g.n, 0);
  const bars: CategoryBar[] = set.groups.map((g) => ({
    key: g.key,
    count: g.n,
    sharePct: total > 0 ? (g.n / total) * 100 : 0,
    medianPrice: g.median,
  }));
  bars.sort((a, b) => b.count - a.count || a.key - b.key);
  return bars;
}

/* ---- G10 — Prix par tranche de kilométrage (EX-SCR-166, D8-07/EX-DATA-83ter) ------------------- */

/** Une boîte de prix par tranche de rang de kilométrage. `p05`/`p95` remplacent `p25`/`p75` : le
 * protocole worker (`GroupStatEntry`) ne publie que P5/P50/P95 (EX-SCR-12), cohérent avec la règle
 * `A-05` (fourchette centrale = `[p05, p95]`) partout ailleurs dans l'application. */
export interface MileageBoxTile {
  readonly rank: number;
  readonly loObserved: number | null;
  readonly hiObserved: number | null;
  readonly n: number;
  readonly p05: number | null;
  readonly median: number | null;
  readonly p95: number | null;
}

/**
 * G10 : boîtes de prix par tranche de RANG de kilométrage — bornes observées lues depuis
 * `RecalcResult.ntiles` (métrique `mileage`), statistiques de prix depuis `RecalcResult.groupStats`
 * (clé `mileageNtile`, métrique `price`), toutes deux calculées par le worker (EX-DATA-83ter). L'un
 * ou l'autre absent → `'unavailable'`.
 */
export function buildMileageBoxes(
  ntiles: NtileResult | undefined,
  groupStats: readonly GroupStatSet[] | undefined,
): { readonly tiles: readonly MileageBoxTile[]; readonly tileCount: number } | Unavailable {
  if (ntiles === undefined || groupStats === undefined) return UNAVAILABLE;
  if (ntiles.metric !== 'mileage') return UNAVAILABLE;
  const priceSet = groupStats.find((s) => s.key === 'mileageNtile' && s.metric === 'price');
  const priceByRank = new Map((priceSet?.groups ?? []).map((g) => [g.key, g] as const));
  const tiles: MileageBoxTile[] = [...ntiles.slices]
    .sort((a, b) => a.rank - b.rank)
    .map((s) => {
      const g = priceByRank.get(s.rank);
      return {
        rank: s.rank,
        loObserved: s.loObserved,
        hiObserved: s.hiObserved,
        n: g?.n ?? 0,
        p05: g?.p05 ?? null,
        median: g?.median ?? null,
        p95: g?.p95 ?? null,
      };
    });
  return { tiles, tileCount: tiles.length };
}

/* ---- G14 — Prix médian par palier de puissance (EX-SCR-169, EX-DATA-83quater, D8-07) ----------- */

export const POWER_TIER_WIDTH_KW = 20;

/** Bloc statistique minimal consommé par le rendu de G14 (`PowerTiers` n'utilise que `n`/`median`). */
export interface PowerTierStat {
  readonly n: number;
  readonly median: number | null;
}

export interface PowerTierBar {
  readonly tierIndex: number;
  readonly loKw: number;
  readonly hiKw: number; // borne haute exclusive − 1 affichée
  readonly stat: PowerTierStat;
}

/**
 * G14 : médiane du prix par palier de 20 kW — lu depuis `RecalcResult.powerTiers`, calculé par le
 * worker (EX-DATA-83quater). `powerTiers` absent → `'unavailable'`. Paliers ordonnés croissants.
 */
export function buildPowerTiers(powerTiers: PowerTierResult | undefined): readonly PowerTierBar[] | Unavailable {
  if (powerTiers === undefined) return UNAVAILABLE;
  return [...powerTiers.tiers]
    .sort((a, b) => a.tier - b.tier)
    .map((t) => ({
      tierIndex: t.tier,
      loKw: t.lowerKw,
      hiKw: t.upperKw - 1,
      stat: { n: t.n, median: t.median },
    }));
}

/* ---- G8 — Libellé normatif du modèle M2 et avertissement R² (EX-DATA-93bis, EX-SCR-164, D8-07) - */

/**
 * Cellule d'homogénéité de la SÉLECTION entière (`cellLevel === 'SELECTION'`), porteuse du `R²` de la
 * passe 2 de M2 affiché sous le titre de G8. `cellStats` absent, ou aucune cellule `SELECTION`
 * publiée (n_price < 30, EX-SCR-164) → `undefined` : G8 s'affiche alors SANS libellé de modèle,
 * jamais avec une formule inventée (`A-09`).
 */
export function selectionCellStat(cellStats: readonly CellStat[] | undefined): CellStat | undefined {
  return cellStats?.find((c) => c.cellLevel === 'SELECTION');
}

/**
 * Libellé normatif EXACT d'EX-SCR-164 : `Modèle : ln(prix) ~ (année − moyenne) + km/10 000 —
 * échelle robuste MAD — n = <|F|>, R² = <R²>` (`R²` formaté `EX-SCR-2` : deux décimales, virgule
 * décimale). `cell` `undefined` → `undefined` (aucun libellé rendu, pas de formule inventée, A-09).
 */
export function g8ModelCaption(cell: CellStat | undefined): string | undefined {
  if (cell === undefined) return undefined;
  const r2 = cell.rSquared != null ? cell.rSquared.toFixed(2).replace('.', ',') : '—';
  return `Modèle : ln(prix) ~ (année − moyenne) + km/10 000 — échelle robuste MAD — n = ${cell.fitCount}, R² = ${r2}`;
}

/** `EX-DATA-93bis`/`EX-SCR-164` : avertissement ambre quand `R² < 0,30`. */
export function g8RSquaredWarning(cell: CellStat | undefined): boolean {
  return cell?.rSquaredWarning === true;
}
