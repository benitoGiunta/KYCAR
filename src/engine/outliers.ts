/**
 * KYCAR — Détection d'outliers M1 / M2 / M3 (lot D4, EX-DATA-84..96, invariant I6)
 * =================================================================================================
 * M1 — barrières de Tukey (facteur 1,5) sur `ln(prix)`, dès `n_price ≥ 12` (EX-DATA-88).
 * M2 — écart robuste (MAD, facteur 1,4826 ; seuil ±2,5) au prix attendu par une régression OLS
 *      `ln(prix) ~ β0 + β1·(année−moyenne) + β2·(km/10000)` avec ridge et Cholesky, en DEUX passes
 *      (EX-DATA-90/92/93), dès `|F| ≥ 30`.
 * M3 — contrôle externe (jamais détecteur, EX-DATA-13/96) : contingence 2×2 vs `priceEvaluationCategory`.
 * Cellules d'homogénéité (EX-DATA-86) : M1 essaie `C₁`(marque·modèle·année) → `C₂`(marque·modèle) →
 * `C₃`(sélection) ; M2 démarre à `C₂`.
 *
 * DIVERGENCE DE SOURCE SIGNALÉE (non corrigée) : EX-DATA-85 nomme les drapeaux `LOW_PRICE_IQR`,
 * `HIGH_PRICE_IQR`, `LOW_PRICE_MODEL`, `HIGH_PRICE_MODEL` ; le vocabulaire gelé de D2
 * (`KYCAR_OUTLIER_FLAG`, `OUTLIER_FLAG_VALUES`) nomme `M1_LOW/M1_HIGH/M2_LOW/M2_HIGH` plus
 * `M1_M2_AGREE_LOW/HIGH`. On émet les codes du VOCABULAIRE GELÉ (contrat D2), et l'on ajoute le
 * drapeau d'accord quand M1 et M2 concordent. L'écart de nommage est remonté au rapport de lot.
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { ListingColumnBatch, OutlierVerdict } from '../types/index';
import { isMileageValid, isPriceValid, isYearValid, PRICE_STATUS_QUOTED, yearFromYearMonth } from './flags';
import { quantileFromSorted } from './quantiles';
import { modelIndexKey } from './index-build';
import { decodeListingId } from './uuid';

/* ---- Constantes de méthode (EX-DATA-88/90/92) ------------------------------------------------- */
const TUKEY_K = 1.5;
const ROBUST_SD_FROM_IQR = 1.349;
const MAD_FACTOR = 1.4826;
const M2_Z_THRESHOLD = 2.5;
const M2_TRIM = 3.5;
const MIN_M1 = 12;
const MIN_M2 = 30;

/* ---- Codes de drapeau (vocabulaire gelé KYCAR_OUTLIER_FLAG) ----------------------------------- */
const FLAG_M1_LOW = 'M1_LOW';
const FLAG_M1_HIGH = 'M1_HIGH';
const FLAG_M2_LOW = 'M2_LOW';
const FLAG_M2_HIGH = 'M2_HIGH';
const FLAG_AGREE_LOW = 'M1_M2_AGREE_LOW';
const FLAG_AGREE_HIGH = 'M1_M2_AGREE_HIGH';

/** Contrôle externe M3 (EX-DATA-96). */
export interface M3Control {
  readonly evaluatedPopulation: number;
  readonly precisionLow: number | null;
  readonly recallLow: number | null;
  readonly kappa: number | null;
  readonly evalCoverage: number | null;
}

/** Résultat complet de la détection. */
export interface OutlierResult {
  readonly verdicts: readonly OutlierVerdict[];
  readonly outlierEvaluatedCount: number;
  readonly outlierNotEvaluatedCount: number;
  readonly m1FlaggedIds: ReadonlySet<string>;
  readonly m2FlaggedIds: ReadonlySet<string>;
  readonly m3: M3Control;
}

/* ---- Petite algèbre linéaire (systèmes 1×1 à 3×3, EX-DATA-90) --------------------------------- */

/** Résout `A x = b` par factorisation de Cholesky (A symétrique définie positive). `null` si échec. */
function choleskySolve(a: number[][], b: number[], k: number): number[] | null {
  const l: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let i = 0; i < k; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = (a[i] as number[])[j] as number;
      for (let m = 0; m < j; m++) sum -= (l[i] as number[])[m]! * (l[j] as number[])[m]!;
      if (i === j) {
        if (sum <= 0) return null;
        (l[i] as number[])[j] = Math.sqrt(sum);
      } else {
        (l[i] as number[])[j] = sum / ((l[j] as number[])[j] as number);
      }
    }
  }
  // Ly = b
  const y = new Array<number>(k).fill(0);
  for (let i = 0; i < k; i++) {
    let sum = b[i] as number;
    for (let m = 0; m < i; m++) sum -= (l[i] as number[])[m]! * (y[m] as number);
    y[i] = sum / ((l[i] as number[])[i] as number);
  }
  // Lᵗ x = y
  const x = new Array<number>(k).fill(0);
  for (let i = k - 1; i >= 0; i--) {
    let sum = y[i] as number;
    for (let m = i + 1; m < k; m++) sum -= (l[m] as number[])[i]! * (x[m] as number);
    x[i] = sum / ((l[i] as number[])[i] as number);
  }
  return x;
}

/** Médiane (quantile type 7 à p = 0,5) d'un tableau non trié. */
function median(values: readonly number[]): number {
  const sorted = Float64Array.from(values).sort();
  return quantileFromSorted(sorted, 0.5);
}

/* ---- Structures de cellule ------------------------------------------------------------------- */

/** Échantillon d'une cellule pour M1 : les `ln(prix)` valides. */
interface M1Fence {
  readonly n: number;
  readonly median: number;
  readonly iqr: number;
  readonly lowFence: number;
  readonly highFence: number;
  readonly spread: boolean;
}

function computeM1Fence(lnPrices: readonly number[]): M1Fence {
  const sorted = Float64Array.from(lnPrices).sort();
  const q1 = quantileFromSorted(sorted, 0.25);
  const q3 = quantileFromSorted(sorted, 0.75);
  const med = quantileFromSorted(sorted, 0.5);
  const iqr = q3 - q1;
  return {
    n: sorted.length,
    median: med,
    iqr,
    lowFence: Math.exp(q1 - TUKEY_K * iqr),
    highFence: Math.exp(q3 + TUKEY_K * iqr),
    spread: iqr > 0,
  };
}

/** Points d'ajustement `F` d'une cellule pour M2 (EX-DATA-90). */
interface M2Fit {
  readonly ok: boolean;
  /** `z_i` robuste par ligne (uniquement pour les lignes de `F`). */
  readonly zByRow: ReadonlyMap<number, number>;
  readonly expectedByRow: ReadonlyMap<number, number>;
  readonly deviationByRow: ReadonlyMap<number, number>;
}

const FIT_EMPTY: M2Fit = { ok: false, zByRow: new Map(), expectedByRow: new Map(), deviationByRow: new Map() };

/** Ajuste M2 sur les points `F` (lignes, y=ln prix, année, km) — EX-DATA-90/91/92/93. */
function fitM2(fRows: number[], fY: number[], fYear: number[], fMileage: number[]): M2Fit {
  const nF = fRows.length;
  if (nF < MIN_M2) return FIT_EMPTY;

  const meanYear = fYear.reduce((a, b) => a + b, 0) / nF;
  const x1 = fYear.map((y) => y - meanYear);
  const x2 = fMileage.map((m) => m / 10000);

  // Dégénérescence des régresseurs (EX-DATA-91), test d'égalité exacte avant ajustement.
  const keepX1 = Math.max(...x1) !== Math.min(...x1);
  const keepX2 = Math.max(...x2) !== Math.min(...x2);
  if (!keepX1 && !keepX2) return FIT_EMPTY; // INSUFFICIENT_SPREAD

  // Colonnes du modèle : [1] (+ x1) (+ x2).
  const cols: number[][] = [new Array<number>(nF).fill(1)];
  if (keepX1) cols.push(x1);
  if (keepX2) cols.push(x2);
  const k = cols.length;

  const fit = (rowsIdx: readonly number[]): number[] | null => {
    // XtX et Xty sur le sous-ensemble d'indices (positions dans F).
    const xtx: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
    const xty = new Array<number>(k).fill(0);
    for (const p of rowsIdx) {
      for (let i = 0; i < k; i++) {
        const ci = (cols[i] as number[])[p] as number;
        xty[i] = (xty[i] as number) + ci * (fY[p] as number);
        for (let j = i; j < k; j++) {
          (xtx[i] as number[])[j] = ((xtx[i] as number[])[j] as number) + ci * ((cols[j] as number[])[p] as number);
        }
      }
    }
    for (let i = 0; i < k; i++) for (let j = 0; j < i; j++) (xtx[i] as number[])[j] = (xtx[j] as number[])[i] as number;
    let trace = 0;
    for (let i = 0; i < k; i++) trace += (xtx[i] as number[])[i] as number;
    const lambda = (1e-9 * trace) / 3;
    for (let i = 0; i < k; i++) (xtx[i] as number[])[i] = ((xtx[i] as number[])[i] as number) + lambda;
    return choleskySolve(xtx, xty, k);
  };

  const predict = (beta: number[], p: number): number => {
    let yh = 0;
    for (let i = 0; i < k; i++) yh += (beta[i] as number) * ((cols[i] as number[])[p] as number);
    return yh;
  };

  const allIdx = Array.from({ length: nF }, (_v, i) => i);
  const beta1 = fit(allIdx);
  if (beta1 === null) return FIT_EMPTY;

  const robust = (beta: number[]): { mr: number; s: number; z: number[] } => {
    const r = allIdx.map((p) => (fY[p] as number) - predict(beta, p));
    const mr = median(r);
    const mad = median(r.map((ri) => Math.abs(ri - mr)));
    const s = MAD_FACTOR * mad;
    const z = s > 0 ? r.map((ri) => (ri - mr) / s) : r.map(() => 0);
    return { mr, s, z };
  };

  let pass = robust(beta1);
  let betaUsed = beta1;
  // Passe 2 : ré-ajustement sur F' = { |z| < 3,5 }.
  const fPrime = allIdx.filter((p) => Math.abs(pass.z[p] as number) < M2_TRIM);
  if (fPrime.length >= MIN_M2) {
    const beta2 = fit(fPrime);
    if (beta2 !== null) {
      betaUsed = beta2;
      pass = robust(beta2); // recalcule mr, s, z sur F COMPLET avec les coefficients de la passe 2
    }
  }
  if (pass.s <= 0) return FIT_EMPTY; // INSUFFICIENT_SPREAD

  const zByRow = new Map<number, number>();
  const expectedByRow = new Map<number, number>();
  const deviationByRow = new Map<number, number>();
  for (let p = 0; p < nF; p++) {
    const yh = predict(betaUsed, p);
    const expected = Math.exp(yh + pass.mr);
    const price = Math.exp(fY[p] as number);
    zByRow.set(fRows[p] as number, pass.z[p] as number);
    expectedByRow.set(fRows[p] as number, expected);
    deviationByRow.set(fRows[p] as number, price / expected - 1);
  }
  return { ok: true, zByRow, expectedByRow, deviationByRow };
}

/* ---- Détection complète ---------------------------------------------------------------------- */

/** Exécute M1, M2 et le contrôle M3 sur une sélection déjà balayée. */
export function detectOutliers(
  batch: ListingColumnBatch,
  rows: Int32Array,
  snapshotId: string,
  selectionHash: string,
): OutlierResult {
  const n = rows.length;

  // Sous-population à prix affiché valide (candidats à l'évaluation).
  const qvpRows: number[] = [];
  let priceQuotedCount = 0;

  // Regroupements de ln(prix) par cellule (M1) et de points F par cellule (M2).
  const c1Ln = new Map<string, number[]>();
  const c2Ln = new Map<string, number[]>();
  const c3Ln: number[] = [];
  const c2F = new Map<string, { rows: number[]; y: number[]; year: number[]; mileage: number[] }>();
  const c3F = { rows: [] as number[], y: [] as number[], year: [] as number[], mileage: [] as number[] };

  for (let i = 0; i < n; i++) {
    const row = rows[i] as number;
    const status = batch.priceStatus[row] as number;
    if (status === PRICE_STATUS_QUOTED) priceQuotedCount++;
    const price = batch.priceEur[row] as number;
    const ingest = batch.ingestFlags[row] as number;
    if (!isPriceValid(price, status, ingest)) continue;

    qvpRows.push(row);
    const ln = Math.log(price);
    const makeId = batch.makeId[row] as number;
    const modelId = batch.modelId[row] as number;
    const c2Key = modelIndexKey(makeId, modelId);

    const ym = batch.firstRegistrationYearMonth[row] as number;
    const yearValid = isYearValid(ym);
    const year = yearValid ? yearFromYearMonth(ym) : 0;
    const mileage = batch.mileageKm[row] as number;
    const mileageValid = isMileageValid(mileage, ingest);

    // M1 : cellules C1 / C2 / C3.
    if (yearValid) {
      const c1Key = `${c2Key}|${year}`;
      pushTo(c1Ln, c1Key, ln);
    }
    pushTo(c2Ln, c2Key, ln);
    c3Ln.push(ln);

    // M2 : points F (prix, année, km tous valides).
    if (yearValid && mileageValid) {
      let f = c2F.get(c2Key);
      if (f === undefined) {
        f = { rows: [], y: [], year: [], mileage: [] };
        c2F.set(c2Key, f);
      }
      f.rows.push(row);
      f.y.push(ln);
      f.year.push(year);
      f.mileage.push(mileage);
      c3F.rows.push(row);
      c3F.y.push(ln);
      c3F.year.push(year);
      c3F.mileage.push(mileage);
    }
  }

  // Fences M1 par cellule (lazy).
  const m1FenceCache = new Map<string, M1Fence>();
  const fenceOf = (map: Map<string, number[]>, key: string): M1Fence | null => {
    const arr = map.get(key);
    if (arr === undefined || arr.length < MIN_M1) return null;
    const cacheKey = `${map === c1Ln ? '1' : '2'}:${key}`;
    let f = m1FenceCache.get(cacheKey);
    if (f === undefined) {
      f = computeM1Fence(arr);
      m1FenceCache.set(cacheKey, f);
    }
    return f;
  };
  let c3Fence: M1Fence | null | undefined;
  const fenceC3 = (): M1Fence | null => {
    if (c3Fence === undefined) c3Fence = c3Ln.length >= MIN_M1 ? computeM1Fence(c3Ln) : null;
    return c3Fence;
  };

  // Fits M2 par cellule (lazy).
  const m2FitCache = new Map<string, M2Fit>();
  const fitC2 = (key: string): M2Fit => {
    let fit = m2FitCache.get(key);
    if (fit === undefined) {
      const f = c2F.get(key);
      const c2n = c2Ln.get(key)?.length ?? 0;
      fit = f !== undefined && c2n >= MIN_M2 ? fitM2(f.rows, f.y, f.year, f.mileage) : FIT_EMPTY;
      m2FitCache.set(key, fit);
    }
    return fit;
  };
  let c3Fit: M2Fit | undefined;
  const fitC3 = (): M2Fit => {
    if (c3Fit === undefined) {
      c3Fit = c3Ln.length >= MIN_M2 ? fitM2(c3F.rows, c3F.y, c3F.year, c3F.mileage) : FIT_EMPTY;
    }
    return c3Fit;
  };

  const verdicts: OutlierVerdict[] = [];
  const m1FlaggedIds = new Set<string>();
  const m2FlaggedIds = new Set<string>();
  let evaluatedCount = 0;

  // Pour M3 : besoin, par ligne, du fait d'avoir été signalée BAS.
  const flaggedLowRow = new Set<number>();

  for (const row of qvpRows) {
    const price = batch.priceEur[row] as number;
    const ln = Math.log(price);
    const makeId = batch.makeId[row] as number;
    const modelId = batch.modelId[row] as number;
    const c2Key = modelIndexKey(makeId, modelId);
    const ym = batch.firstRegistrationYearMonth[row] as number;
    const yearValid = isYearValid(ym);
    const year = yearValid ? yearFromYearMonth(ym) : 0;

    // --- M1 : choisir la première cellule à n ≥ 12 ---
    let m1Fence: M1Fence | null = null;
    let m1Level: 'MODEL_YEAR' | 'MODEL' | 'SELECTION' | null = null;
    if (yearValid) {
      const f = fenceOf(c1Ln, `${c2Key}|${year}`);
      if (f) {
        m1Fence = f;
        m1Level = 'MODEL_YEAR';
      }
    }
    if (m1Fence === null) {
      const f = fenceOf(c2Ln, c2Key);
      if (f) {
        m1Fence = f;
        m1Level = 'MODEL';
      }
    }
    if (m1Fence === null) {
      const f = fenceC3();
      if (f) {
        m1Fence = f;
        m1Level = 'SELECTION';
      }
    }

    let m1Evaluated = false;
    let m1Low = false;
    let m1High = false;
    let zIqr: number | null = null;
    if (m1Fence !== null && m1Fence.spread) {
      m1Evaluated = true;
      zIqr = (ln - m1Fence.median) / (m1Fence.iqr / ROBUST_SD_FROM_IQR);
      if (price < m1Fence.lowFence) m1Low = true;
      else if (price > m1Fence.highFence) m1High = true;
    }

    // --- M2 : cellule C2 (n_price ≥ 30) puis C3 ---
    let m2Fit: M2Fit = FIT_EMPTY;
    let m2Level: 'MODEL' | 'SELECTION' | null = null;
    if ((c2Ln.get(c2Key)?.length ?? 0) >= MIN_M2) {
      const fit = fitC2(c2Key);
      if (fit.ok && fit.zByRow.has(row)) {
        m2Fit = fit;
        m2Level = 'MODEL';
      }
    }
    if (m2Fit === FIT_EMPTY && c3Ln.length >= MIN_M2) {
      const fit = fitC3();
      if (fit.ok && fit.zByRow.has(row)) {
        m2Fit = fit;
        m2Level = 'SELECTION';
      }
    }

    let m2Evaluated = false;
    let m2Low = false;
    let m2High = false;
    let m2Z: number | null = null;
    let expected: number | null = null;
    let deviation: number | null = null;
    if (m2Fit.ok && m2Fit.zByRow.has(row)) {
      m2Evaluated = true;
      m2Z = m2Fit.zByRow.get(row) as number;
      expected = m2Fit.expectedByRow.get(row) ?? null;
      const dev = m2Fit.deviationByRow.get(row);
      deviation = dev === undefined ? null : dev * 100;
      if (m2Z <= -M2_Z_THRESHOLD) m2Low = true;
      else if (m2Z >= M2_Z_THRESHOLD) m2High = true;
    }

    if (m1Evaluated || m2Evaluated) evaluatedCount++;

    const agreeLow = m1Low && m2Low;
    const agreeHigh = m1High && m2High;
    const opportunityScore = m2Evaluated ? -(m2Z as number) : m1Evaluated ? -(zIqr as number) : null;
    if (m1Low || m2Low) flaggedLowRow.add(row);

    const listingId = decodeListingId(batch.listingId, row);

    if (m1Low || m1High) {
      m1FlaggedIds.add(listingId);
      const flags = [m1Low ? FLAG_M1_LOW : FLAG_M1_HIGH];
      if (agreeLow) flags.push(FLAG_AGREE_LOW);
      if (agreeHigh) flags.push(FLAG_AGREE_HIGH);
      verdicts.push({
        snapshotId,
        selectionHash,
        listingId,
        method: 'M1',
        flags,
        expectedPriceEur: null,
        deviationPct: null,
        opportunityScore,
        cellLabel: m1Level,
        cellCount: m1Fence ? m1Fence.n : 0,
      });
    }
    if (m2Low || m2High) {
      m2FlaggedIds.add(listingId);
      const flags = [m2Low ? FLAG_M2_LOW : FLAG_M2_HIGH];
      if (agreeLow) flags.push(FLAG_AGREE_LOW);
      if (agreeHigh) flags.push(FLAG_AGREE_HIGH);
      verdicts.push({
        snapshotId,
        selectionHash,
        listingId,
        method: 'M2',
        flags,
        expectedPriceEur: expected,
        deviationPct: deviation,
        opportunityScore,
        cellLabel: m2Level,
        cellCount: (m2Level === 'MODEL' ? c2Ln.get(c2Key)?.length : c3Ln.length) ?? 0,
      });
    }
  }

  const outlierNotEvaluatedCount = priceQuotedCount - evaluatedCount;

  // --- M3 : contrôle externe (EX-DATA-96) ---
  const m3 = computeM3(batch, rows, flaggedLowRow, priceQuotedCount);

  return {
    verdicts,
    outlierEvaluatedCount: evaluatedCount,
    outlierNotEvaluatedCount,
    m1FlaggedIds,
    m2FlaggedIds,
    m3,
  };
}

function pushTo(map: Map<string, number[]>, key: string, value: number): void {
  let arr = map.get(key);
  if (arr === undefined) {
    arr = [];
    map.set(key, arr);
  }
  arr.push(value);
}

/** Contingence 2×2 vs `priceEvaluationCategory` (EX-DATA-96). */
function computeM3(
  batch: ListingColumnBatch,
  rows: Int32Array,
  flaggedLowRow: ReadonlySet<number>,
  priceQuotedCount: number,
): M3Control {
  let a = 0;
  let b = 0;
  let c = 0;
  let d = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as number;
    if ((batch.priceStatus[row] as number) !== PRICE_STATUS_QUOTED) continue;
    const cat = batch.priceEvaluationCategory[row] as number;
    if (cat === 0 || cat === 255) continue; // exclut Inconnu et absent
    const cheap = cat === 1 || cat === 2;
    const flaggedLow = flaggedLowRow.has(row);
    if (flaggedLow && cheap) a++;
    else if (flaggedLow && !cheap) b++;
    else if (!flaggedLow && cheap) c++;
    else d++;
  }
  const e = a + b + c + d;
  if (e === 0) {
    return { evaluatedPopulation: 0, precisionLow: null, recallLow: null, kappa: null, evalCoverage: null };
  }
  const precisionLow = a + b === 0 ? null : a / (a + b);
  const recallLow = a + c === 0 ? null : a / (a + c);
  const po = (a + d) / e;
  const pe = ((a + b) * (a + c) + (c + d) * (b + d)) / (e * e);
  const kappa = pe === 1 ? null : (po - pe) / (1 - pe);
  const evalCoverage = priceQuotedCount === 0 ? null : Math.round((e / priceQuotedCount) * 1e4) / 1e4;
  return { evaluatedPopulation: e, precisionLow, recallLow, kappa, evalCoverage };
}
