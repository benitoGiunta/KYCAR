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
import { MODEL_ID_UNRESOLVED } from '../types/index';
import { isMileageValid, isPriceValid, isYearValid, PRICE_STATUS_QUOTED, yearFromYearMonth } from './flags';
import { implausibleInCellThreshold } from './implausible';
import { quantileFromSorted } from './quantiles';
import { decodeListingId } from './uuid';
import { roundHalfAway } from './group-stats';
import type { CellLevel, CellStat } from './stats-protocol';

/**
 * Clés composites ENTIÈRES des cellules (point chaud mesuré à N = 100 000 : allouer une chaîne
 * `makeId:modelId` — et `…|year` — PAR ligne dominait le coût). Même encodage que `IDX_MODEL`.
 * `makeId ∈ Int16`, `modelId < 2²¹`, `year < 4096` ⇒ toutes les clés tiennent bien sous 2⁵³.
 */
const MODEL_KEY_STRIDE = 2097152;
const cellC2 = (makeId: number, modelId: number): number => makeId * MODEL_KEY_STRIDE + modelId;
const cellC1 = (c2: number, year: number): number => c2 * 4096 + year;

/* ---- Constantes de méthode (EX-DATA-88/90/92) ------------------------------------------------- */
const TUKEY_K = 1.5;
const ROBUST_SD_FROM_IQR = 1.349;
const MAD_FACTOR = 1.4826;
const M2_Z_THRESHOLD = 2.5;
const M2_TRIM = 3.5;
const MIN_M1 = 12;
const MIN_M2 = 30;
/** Échelle relative sous laquelle l'écart robuste de M2 est tenu pour nul (EX-DATA-89, DR-035). */
const M2_SPREAD_EPS = 1e-9;


/* ---- Codes de drapeau (vocabulaire gelé KYCAR_OUTLIER_FLAG) ----------------------------------- */
const FLAG_M1_LOW = 'M1_LOW';
const FLAG_M1_HIGH = 'M1_HIGH';
const FLAG_M2_LOW = 'M2_LOW';
const FLAG_M2_HIGH = 'M2_HIGH';
const FLAG_AGREE_LOW = 'M1_M2_AGREE_LOW';
const FLAG_AGREE_HIGH = 'M1_M2_AGREE_HIGH';
/**
 * D8-09 (DR-114, dette D-45 levée) — les deux codes de NON-ÉVALUABILITÉ du vocabulaire gelé, porté
 * de 6 à 8 codes par l'étape 0 (`OUTLIER_FLAG_VALUES`, `OUTLIER_NOT_EVALUABLE_CODES`).
 * `EX-DATA-86` (dernière ligne du tableau de repli) et `EX-DATA-89` / `EX-DATA-91` / `EX-DATA-92`
 * les EXIGENT ; `EX-DATA-95` en tire la conséquence : une annonce qui les porte n'est jamais classée
 * parmi les opportunités et n'est pas non plus comptée comme « non anormale ».
 */
const FLAG_INSUFFICIENT_DATA = 'INSUFFICIENT_DATA';
const FLAG_INSUFFICIENT_SPREAD = 'INSUFFICIENT_SPREAD';

/** Seuil d'avertissement affiché sous le titre de `G8` (EX-SCR-164, EX-DATA-93bis). */
export const R_SQUARED_WARNING_THRESHOLD = 0.3;

/** Contrôle externe M3 (EX-DATA-96). */
export interface M3Control {
  readonly evaluatedPopulation: number;
  readonly precisionLow: number | null;
  readonly recallLow: number | null;
  readonly kappa: number | null;
  readonly evalCoverage: number | null;
}

/** Contrôle M3 sans population évaluée (sélection vide, ou détection omise par la garde D4). */
export const M3_EMPTY: M3Control = {
  evaluatedPopulation: 0,
  precisionLow: null,
  recallLow: null,
  kappa: null,
  evalCoverage: null,
};

/**
 * D8-09 — décompte de l'évaluabilité des annonces à prix AFFICHÉ (`priceStatus = QUOTED`), publié
 * pour que l'écran distingue « aucune anomalie détectée » de « anomalie non évaluable », que
 * `EX-DATA-95` interdit de confondre.
 *
 * Invariant (contrôlé par test, raffinement d'I6) :
 * `evaluated + notEvaluableTotal + priceExcluded + implausibleInCell = priceQuotedCount`,
 * et `notEvaluableTotal + priceExcluded + implausibleInCell = outlierNotEvaluatedCount`.
 */
export interface OutlierEvaluationCounters {
  /** Annonces évaluées par M1 et/ou M2 (`outlierEvaluatedCount`). */
  readonly evaluated: number;
  /** Annonces non évaluables, ventilées par code de verdict (les deux codes de D8-09). */
  readonly notEvaluable: Readonly<Record<'INSUFFICIENT_DATA' | 'INSUFFICIENT_SPREAD', number>>;
  /** Somme des deux compteurs ci-dessus — le nombre de verdicts de non-évaluabilité émis. */
  readonly notEvaluableTotal: number;
  /**
   * Annonces à prix affiché mais HORS `V_price` au sens absolu (sentinelle `PRICE_SENTINEL_ABSOLUTE`,
   * hors domaine) : non évaluées et JAMAIS porteuses d'un verdict (EX-DATA-16(d)).
   */
  readonly priceExcluded: number;
  /**
   * Annonces écartées de `V_price(C)` par `PRICE_IMPLAUSIBLE_IN_CELL` : ni évaluées ni JUGÉES,
   * aucun verdict, pas même de non-évaluabilité (EX-DATA-19(2)).
   */
  readonly implausibleInCell: number;
}

/** Résultat complet de la détection. */
export interface OutlierResult {
  readonly verdicts: readonly OutlierVerdict[];
  readonly outlierEvaluatedCount: number;
  readonly outlierNotEvaluatedCount: number;
  /** D8-09 — ventilation de l'évaluabilité, dont les deux codes `INSUFFICIENT_*`. */
  readonly evaluation: OutlierEvaluationCounters;
  /**
   * D8-07 — statistiques des cellules d'homogénéité RETENUES (EX-DATA-86/87/93bis), dont le `R²` de
   * la passe 2 de M2 et son avertissement `R² < 0,30`.
   */
  readonly cellStats: readonly CellStat[];
  /** Lignes SIGNALÉES (`A` d'EX-DATA-101) : au moins un drapeau `M1_*` / `M2_*`. */
  readonly flaggedRows: ReadonlySet<number>;
  /** `opportunityScore` par ligne évaluée (départage du cas `|A| ≥ K` d'EX-DATA-101). */
  readonly scoreByRow: ReadonlyMap<number, number>;
  readonly m1FlaggedIds: ReadonlySet<string>;
  readonly m2FlaggedIds: ReadonlySet<string>;
  /**
   * Annonces écartées de `V_price(C)` au titre de `PRICE_IMPLAUSIBLE_IN_CELL` dans la cellule que le
   * moteur leur a retenue (EX-DATA-19(2)). Elles comptent dans tout effectif, ne sont ni évaluées ni
   * signalées, et l'écran peut les nommer (EX-DATA-87).
   */
  readonly implausibleInCellIds: ReadonlySet<string>;
  /**
   * Seuil relatif de la cellule `C₃ = Σ` (`0,10 × médianeRéf(Σ)`), ou `null` si `n_price(Σ) < 12`.
   * Publié pour que l'éligibilité du nuage et de la densité (EX-DATA-99, D-05) applique la MÊME
   * règle sans recalculer la médiane.
   */
  readonly selectionImplausibleThreshold: number | null;
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

/** Barrières de Tukey d'une cellule (M1, EX-DATA-88), calculées sur `V_price(C)` hors implausibles. */
interface M1Fence {
  readonly n: number;
  readonly median: number;
  readonly iqr: number;
  readonly lowFence: number;
  readonly highFence: number;
  readonly spread: boolean;
}

/** Barrière de Tukey sur `ln(prix)` (EX-DATA-88). `sortedPrices` est déjà croissant. */
function fenceFromSortedPrices(sortedPrices: Float64Array): M1Fence {
  // `ln` est strictement croissante : l'ordre est conservé, aucun second tri n'est nécessaire.
  const sorted = new Float64Array(sortedPrices.length);
  for (let i = 0; i < sortedPrices.length; i++) sorted[i] = Math.log(sortedPrices[i] as number);
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

/**
 * Échantillon d'une cellule d'homogénéité (EX-DATA-86) : `V_price(C)`, la sentinelle RELATIVE
 * d'EX-DATA-19(2) appliquée, et la barrière M1 qui en découle.
 *
 * UN SEUL passage, dans l'ordre imposé par ARB-13 — `filtrer l'absolu → médiane → marquer le
 * relatif` — sans itération ni recherche de point fixe : les sentinelles ABSOLUES sont déjà hors de
 * `V_price(C)` (EX-DATA-60, `isPriceValid`), `médianeRéf(C)` est la médiane du reste, et le marquage
 * relatif ne rétroagit jamais sur elle. La règle ne s'applique pas sous 12 prix valides.
 */
interface CellSample {
  /** `0,10 × médianeRéf(C)`, ou `null` quand la règle relative ne s'applique pas (`n_price < 12`). */
  readonly implausibleThreshold: number | null;
  /** Annonces écartées de `V_price(C)` au titre de `PRICE_IMPLAUSIBLE_IN_CELL` (EX-DATA-87). */
  readonly implausibleInCellCount: number;
  /** `n_price(C)` HORS implausibles : l'effectif publié avec le verdict (EX-DATA-87). */
  readonly keptCount: number;
  /** Médiane de `V_price(C)` (prix, en euros), ou `null` si la cellule est vide — D8-07. */
  readonly median: number | null;
  /**
   * Écart absolu médian de `V_price(C)` autour de sa médiane, en euros (l'estimateur robuste
   * d'`EX-DATA-92` appliqué à l'échantillon de la cellule), ou `null` si la cellule est vide —
   * D8-07. `null` et JAMAIS `0` par défaut : `0` est une valeur mesurée (cellule à prix unique) qui
   * déclenche `INSUFFICIENT_SPREAD`, et la confondre avec « non calculée » ferait dire à l'écran
   * qu'une cellule non mesurée est parfaitement homogène.
   */
  readonly mad: number | null;
  /** Barrière M1 de la cellule, ou `null` si `keptCount < 12`. */
  readonly fence: M1Fence | null;
}

const EMPTY_CELL: CellSample = {
  implausibleThreshold: null,
  implausibleInCellCount: 0,
  keptCount: 0,
  median: null,
  mad: null,
  fence: null,
};

function buildCellSample(prices: readonly number[] | undefined): CellSample {
  if (prices === undefined || prices.length === 0) return EMPTY_CELL;
  const sorted = Float64Array.from(prices).sort();
  let start = 0;
  const threshold = implausibleInCellThreshold(quantileFromSorted(sorted, 0.5), sorted.length);
  if (threshold !== null) {
    // Les prix implausibles sont les plus petits : ils occupent la tête du tableau trié.
    while (start < sorted.length && (sorted[start] as number) < threshold) start++;
  }
  const kept = sorted.subarray(start);
  const keptMedian = kept.length === 0 ? null : quantileFromSorted(kept, 0.5);
  let mad: number | null = null;
  if (keptMedian !== null) {
    const deviations = new Float64Array(kept.length);
    for (let i = 0; i < kept.length; i++) deviations[i] = Math.abs((kept[i] as number) - keptMedian);
    deviations.sort();
    mad = quantileFromSorted(deviations, 0.5);
  }
  return {
    implausibleThreshold: threshold,
    implausibleInCellCount: start,
    keptCount: kept.length,
    median: keptMedian,
    mad,
    fence: kept.length >= MIN_M1 ? fenceFromSortedPrices(kept) : null,
  };
}

/** Vrai si ce prix porte `PRICE_IMPLAUSIBLE_IN_CELL` dans cette cellule (EX-DATA-19(2)). */
function isImplausibleInCell(sample: CellSample, price: number): boolean {
  return sample.implausibleThreshold !== null && price < sample.implausibleThreshold;
}

/** Points d'ajustement `F` d'une cellule pour M2 (EX-DATA-90) : lignes, `ln(prix)`, année, km. */
interface M2Points {
  readonly rows: number[];
  readonly y: number[];
  readonly year: number[];
  readonly mileage: number[];
}

/** Ajustement M2 d'une cellule (EX-DATA-90). */
interface M2Fit {
  readonly ok: boolean;
  /** `z_i` robuste par ligne (uniquement pour les lignes de `F`). */
  readonly zByRow: ReadonlyMap<number, number>;
  readonly expectedByRow: ReadonlyMap<number, number>;
  readonly deviationByRow: ReadonlyMap<number, number>;
  /** `|F|` — effectif de l'ensemble d'ajustement, publié avec le libellé normatif de `G8`. */
  readonly fitCount: number;
  /**
   * `R² = 1 − SCR/SCT` de la PASSE 2 (EX-DATA-93bis), sur `F` COMPLET — jamais sur `F'` — en échelle
   * `y = ln(p)`, arrondi à 2 décimales. `null` si `SCT = 0` (le verdict de la cellule est alors
   * `INSUFFICIENT_SPREAD`) ou si M2 n'est pas applicable à la cellule.
   */
  readonly rSquared: number | null;
}

const FIT_EMPTY: M2Fit = {
  ok: false,
  zByRow: new Map(),
  expectedByRow: new Map(),
  deviationByRow: new Map(),
  fitCount: 0,
  rSquared: null,
};

/** Ajuste M2 sur les points `F` (lignes, y=ln prix, année, km) — EX-DATA-90/91/92/93. */
function fitM2(fRows: number[], fY: number[], fYear: number[], fMileage: number[]): M2Fit {
  const nF = fRows.length;
  if (nF < MIN_M2) return FIT_EMPTY;

  // EX-DATA-89 / EX-DATA-92 : dispersion insuffisante ⇒ `INSUFFICIENT_SPREAD`, aucune évaluation.
  // Le test porte sur l'échelle de la RÉPONSE, relativement à `|médiane(y)|` : à prix tous égaux, la
  // dispersion robuste des `ln p` est nulle et aucun modèle ne peut juger un écart. Le test que ce
  // module portait (`s <= 0` sur les résidus) ne captait que le zéro EXACT, alors que la ridge
  // d'EX-DATA-90 pose un plancher numérique — mesuré à `s ≈ 9,3e-7` sur une cellule de 40 annonces
  // au même prix, très au-dessus de tout epsilon relatif appliqué aux résidus.
  const medY = median(fY);
  const spreadY = median(fY.map((v) => Math.abs(v - medY)));
  if (spreadY <= M2_SPREAD_EPS * Math.max(1, Math.abs(medY))) return FIT_EMPTY;

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
  // EX-DATA-89 / EX-DATA-92 (I6) : dispersion insuffisante ⇒ INSUFFICIENT_SPREAD, aucune évaluation.
  // Le test ne peut pas être `s <= 0` : avec un régresseur non dégénéré et des prix tous égaux, les
  // résidus ne sont pas exactement nuls et le MAD vaut ≈ 1e-16 — M2 déclarerait alors « évaluées »
  // des annonces qu'elle ne peut pas juger. Le seuil est RELATIF à l'échelle des `y` (des `ln p`).
  if (pass.s <= M2_SPREAD_EPS * Math.max(1, Math.abs(median(fY)))) return FIT_EMPTY;

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

  // EX-DATA-93bis — `R² = 1 − SCR/SCT` sur `F` COMPLET (jamais `F'`), en échelle `y = ln(p)` et non
  // en euros, avec les coefficients de la PASSE 2 (`betaUsed`) et SANS le recentrage `m_r` : `ŷ_i`
  // est la prédiction du modèle, pas le prix attendu. `SCT = 0` ⇒ `null` (cellule sans dispersion).
  let yBar = 0;
  for (let p = 0; p < nF; p++) yBar += fY[p] as number;
  yBar /= nF;
  let scr = 0;
  let sct = 0;
  for (let p = 0; p < nF; p++) {
    const y = fY[p] as number;
    const r = y - predict(betaUsed, p);
    scr += r * r;
    const c = y - yBar;
    sct += c * c;
  }
  const rSquared = sct === 0 ? null : roundHalfAway(1 - scr / sct, 2);

  return { ok: true, zByRow, expectedByRow, deviationByRow, fitCount: nF, rSquared };
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

  // Regroupements de PRIX par cellule (M1 + sentinelle relative) et de points F par cellule (M2).
  // Les prix — et non les `ln(prix)` — parce que `médianeRéf(C)` d'EX-DATA-19(2) est la médiane des
  // PRIX de la cellule : l'interpolation du quantile de type 7 ne commute pas avec `ln`.
  const c1Prices = new Map<number, number[]>();
  const c2Prices = new Map<number, number[]>();
  const c3Prices: number[] = [];
  const c2F = new Map<number, M2Points>();
  const c3F: M2Points = { rows: [], y: [], year: [], mileage: [] };

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
    const c2Key = cellC2(makeId, modelId);

    const ym = batch.firstRegistrationYearMonth[row] as number;
    const yearValid = isYearValid(ym);
    const year = yearValid ? yearFromYearMonth(ym) : 0;
    const mileage = batch.mileageKm[row] as number;
    const mileageValid = isMileageValid(mileage, ingest);

    // ARB-59 / EX-SCR-113bis : `C₁` et `C₂` exigent un `modelId` RÉSOLU. La clé réservée
    // `MODEL_ID_UNRESOLVED` n'est pas un modèle : elle ne forme aucune cellule de rang 1 ou 2, et
    // l'échelle de repli de ces annonces démarre directement à `C₃ = Σ`.
    const modelResolved = modelId !== MODEL_ID_UNRESOLVED;

    // M1 et sentinelle relative : cellules C1 / C2 / C3.
    if (modelResolved && yearValid) {
      pushTo(c1Prices, cellC1(c2Key, year), price);
    }
    if (modelResolved) pushTo(c2Prices, c2Key, price);
    c3Prices.push(price);

    // M2 : points F (prix, année, km tous valides).
    if (yearValid && mileageValid) {
      if (modelResolved) {
        let f = c2F.get(c2Key);
        if (f === undefined) {
          f = { rows: [], y: [], year: [], mileage: [] };
          c2F.set(c2Key, f);
        }
        f.rows.push(row);
        f.y.push(ln);
        f.year.push(year);
        f.mileage.push(mileage);
      }
      c3F.rows.push(row);
      c3F.y.push(ln);
      c3F.year.push(year);
      c3F.mileage.push(mileage);
    }
  }

  // Échantillons de cellule (lazy) : sentinelle relative + barrière M1. Un cache par niveau.
  const c1SampleCache = new Map<number, CellSample>();
  const c2SampleCache = new Map<number, CellSample>();
  const sampleOf = (
    map: Map<number, number[]>,
    cache: Map<number, CellSample>,
    key: number,
  ): CellSample => {
    let s = cache.get(key);
    if (s === undefined) {
      s = buildCellSample(map.get(key));
      cache.set(key, s);
    }
    return s;
  };
  let c3SampleMemo: CellSample | undefined;
  const sampleC3 = (): CellSample => (c3SampleMemo ??= buildCellSample(c3Prices));

  /** Ajuste M2 sur les points `F` de la cellule, IMPLAUSIBLES ÉCARTÉS (EX-DATA-19(2)). */
  const fitCell = (f: M2Points | undefined, sample: CellSample): M2Fit => {
    if (f === undefined || sample.keptCount < MIN_M2) return FIT_EMPTY;
    const t = sample.implausibleThreshold;
    if (t === null || sample.implausibleInCellCount === 0) return fitM2(f.rows, f.y, f.year, f.mileage);
    const rows: number[] = [];
    const y: number[] = [];
    const year: number[] = [];
    const mileage: number[] = [];
    for (let i = 0; i < f.rows.length; i++) {
      const r = f.rows[i] as number;
      if ((batch.priceEur[r] as number) < t) continue;
      rows.push(r);
      y.push(f.y[i] as number);
      year.push(f.year[i] as number);
      mileage.push(f.mileage[i] as number);
    }
    return fitM2(rows, y, year, mileage);
  };

  // Fits M2 par cellule (lazy).
  const m2FitCache = new Map<number, M2Fit>();
  const fitC2 = (key: number, sample: CellSample): M2Fit => {
    let fit = m2FitCache.get(key);
    if (fit === undefined) {
      fit = fitCell(c2F.get(key), sample);
      m2FitCache.set(key, fit);
    }
    return fit;
  };
  let c3Fit: M2Fit | undefined;
  const fitC3 = (): M2Fit => (c3Fit ??= fitCell(c3F, sampleC3()));

  const verdicts: OutlierVerdict[] = [];
  const m1FlaggedIds = new Set<string>();
  const m2FlaggedIds = new Set<string>();
  let evaluatedCount = 0;
  // DR-121 : `outlierNotEvaluatedCount` était DÉRIVÉ par soustraction, ce qui rendait le contrôle I6
  // tautologique — il ne pouvait jamais échouer sur une sortie réelle du moteur. Les deux termes
  // sont désormais comptés indépendamment, et I6 compare deux comptages.
  let notEvaluatedCount = 0;
  // D8-09 : ventilation des annonces NON ÉVALUABLES par code de verdict, et des deux motifs qui ne
  // donnent lieu à AUCUN verdict (prix hors `V_price` au sens absolu, implausible en cellule).
  let insufficientDataCount = 0;
  let insufficientSpreadCount = 0;
  let priceExcludedCount = 0;
  let implausibleInCellCount = 0;
  // Annonces à prix affiché mais hors de `V_price` (sentinelle absolue, hors domaine) : comptées
  // non évaluées, jamais porteuses d'un verdict (EX-DATA-16(d)).
  for (let i = 0; i < n; i++) {
    const row = rows[i] as number;
    const status = batch.priceStatus[row] as number;
    if (status !== PRICE_STATUS_QUOTED) continue;
    if (!isPriceValid(batch.priceEur[row] as number, status, batch.ingestFlags[row] as number)) {
      notEvaluatedCount++;
      priceExcludedCount++;
    }
  }

  // D8-07 — statistiques des cellules d'homogénéité RETENUES (EX-DATA-86/87/93bis). Une cellule est
  // enregistrée la PREMIÈRE fois qu'une annonce la retient ; la clé de déduplication est
  // `niveau|clé entière`, de sorte que `C₁(m, y)` et `C₂(m)` restent deux cellules distinctes.
  // Un magasin par NIVEAU, clé ENTIÈRE (aucune chaîne allouée sur le chemin chaud) : `C₁(m, y)` et
  // `C₂(m)` restent deux cellules distinctes, et `C₃ = Σ` est unique par construction.
  const cellStatC1 = new Map<number, CellStat>();
  const cellStatC2 = new Map<number, CellStat>();
  /** `C₃ = Σ` est unique : un porte-valeur d'au plus un élément suffit. */
  const cellStatSelection: CellStat[] = [];
  const buildCellStat = (
    level: CellLevel,
    cellKey: number,
    label: string,
    sample: CellSample,
    fit: M2Fit | null,
  ): CellStat => {
    const fitted = fit !== null && fit.ok;
    const rSquared = fitted ? fit.rSquared : null;
    return {
      cellLevel: level,
      cellKey,
      cellLabel: label,
      n: sample.keptCount,
      median: sample.median,
      mad: sample.mad,
      rSquared,
      rSquaredWarning: rSquared !== null && rSquared < R_SQUARED_WARNING_THRESHOLD,
      fitCount: fitted ? fit.fitCount : 0,
      implausibleInCellCount: sample.implausibleInCellCount,
    };
  };
  /**
   * Enregistre une cellule RETENUE. Une cellule d'abord vue par M1 (sans ajustement) peut l'être
   * ensuite par M2 : on complète alors son `R²` au lieu d'en publier une seconde ligne muette.
   */
  const registerCell = (
    level: CellLevel,
    cellKey: number,
    label: string,
    sample: CellSample,
    fit: M2Fit | null,
  ): void => {
    const store = level === 'MODEL_YEAR' ? cellStatC1 : level === 'MODEL' ? cellStatC2 : null;
    const known = store === null ? cellStatSelection[0] : store.get(cellKey);
    const brings = fit !== null && fit.ok;
    if (known !== undefined && (!brings || known.rSquared !== null)) return;
    const stat = buildCellStat(level, cellKey, label, sample, fit);
    if (store === null) cellStatSelection[0] = stat;
    else store.set(cellKey, stat);
  };
  /** Libellé de cellule côté MOTEUR : identifiants techniques, l'écran y substitue la taxonomie. */
  const cellLabelOf = (level: CellLevel, makeId: number, modelId: number, year: number): string =>
    level === 'SELECTION'
      ? 'Σ'
      : level === 'MODEL'
        ? `${makeId}/${modelId}`
        : `${makeId}/${modelId} · ${year}`;

  // Pour M3 : besoin, par ligne, du fait d'avoir été signalée BAS.
  const flaggedLowRow = new Set<number>();
  // `A` d'EX-DATA-101 (nuage G4) et le score de départage, par LIGNE : l'échantillonneur travaille
  // sur des indices de ligne, pas sur des `listingId` (aucune chaîne allouée sur ce chemin).
  const flaggedRows = new Set<number>();
  const scoreByRow = new Map<number, number>();
  // Annonces marquées `PRICE_IMPLAUSIBLE_IN_CELL` dans leur cellule (EX-DATA-19(2)).
  const implausibleInCellIds = new Set<string>();

  for (const row of qvpRows) {
    const price = batch.priceEur[row] as number;
    const ln = Math.log(price);
    const makeId = batch.makeId[row] as number;
    const modelId = batch.modelId[row] as number;
    const c2Key = cellC2(makeId, modelId);
    const ym = batch.firstRegistrationYearMonth[row] as number;
    const yearValid = isYearValid(ym);
    const year = yearValid ? yearFromYearMonth(ym) : 0;

    // ARB-59 : la clé réservée `modelId = 0` ne forme ni `C₁` ni `C₂`.
    const modelResolved = modelId !== MODEL_ID_UNRESOLVED;
    const c2Sample = modelResolved ? sampleOf(c2Prices, c2SampleCache, c2Key) : EMPTY_CELL;

    // --- M1 : choisir la première cellule à n ≥ 12 (implausibles déjà écartés) ---
    let m1Cell: CellSample = EMPTY_CELL;
    let m1Fence: M1Fence | null = null;
    let m1Level: 'MODEL_YEAR' | 'MODEL' | 'SELECTION' | null = null;
    if (modelResolved && yearValid) {
      const s = sampleOf(c1Prices, c1SampleCache, cellC1(c2Key, year));
      if (s.fence !== null) {
        m1Cell = s;
        m1Fence = s.fence;
        m1Level = 'MODEL_YEAR';
      }
    }
    if (m1Fence === null && c2Sample.fence !== null) {
      m1Cell = c2Sample;
      m1Fence = c2Sample.fence;
      m1Level = 'MODEL';
    }
    if (m1Fence === null) {
      const s = sampleC3();
      if (s.fence !== null) {
        m1Cell = s;
        m1Fence = s.fence;
        m1Level = 'SELECTION';
      }
    }

    // D8-07 : la cellule que M1 a RETENUE est publiée avec ses statistiques (EX-DATA-87), qu'un
    // verdict soit émis ou non — l'écran nomme la base de comparaison sans la recalculer.
    const m1CellKey =
      m1Level === 'MODEL_YEAR' ? cellC1(c2Key, year) : m1Level === 'MODEL' ? c2Key : -1;
    if (m1Level !== null) {
      registerCell(m1Level, m1CellKey, cellLabelOf(m1Level, makeId, modelId, year), m1Cell, null);
    }

    let m1Evaluated = false;
    let m1Low = false;
    let m1High = false;
    let zIqr: number | null = null;
    // EX-DATA-19(2) : une annonce marquée `PRICE_IMPLAUSIBLE_IN_CELL` dans SA cellule est hors de
    // `V_price(C)` — elle n'est ni évaluée ni signalée, et l'on ne redescend pas à une cellule plus
    // grossière pour la faire évaluer autrement.
    const m1Implausible = m1Fence !== null && isImplausibleInCell(m1Cell, price);
    if (m1Fence !== null && m1Fence.spread && !m1Implausible) {
      m1Evaluated = true;
      zIqr = (ln - m1Fence.median) / (m1Fence.iqr / ROBUST_SD_FROM_IQR);
      if (price < m1Fence.lowFence) m1Low = true;
      else if (price > m1Fence.highFence) m1High = true;
    }

    // --- M2 : la cellule est choisie par la PREMIÈRE RÈGLE SATISFAITE d'EX-DATA-86 ---
    // La condition d'usage du rang 2 porte sur `n_price(C₂) ≥ 30`, PAS sur `|F(C₂)|`. Dès que C₂
    // satisfait cette condition, C₂ EST la cellule : si son ensemble d'ajustement est trop petit
    // (`|F| < 30`, EX-DATA-90), l'annonce n'est pas évaluée par M2 — le moteur ne redescend PAS à
    // `C₃`, qui produirait un verdict au niveau SELECTION sur une cellule que le texte n'a pas
    // retenue (DR-115).
    let m2Fit: M2Fit = FIT_EMPTY;
    let m2Cell: CellSample = EMPTY_CELL;
    let m2Level: 'MODEL' | 'SELECTION' | null = null;
    let m2Implausible = false;
    if (c2Sample.keptCount >= MIN_M2) {
      if (isImplausibleInCell(c2Sample, price)) {
        m2Implausible = true;
      } else {
        const fit = fitC2(c2Key, c2Sample);
        // D8-07 : la cellule est RETENUE dès que `n_price(C₂) ≥ 30` — son `R²` est publié même
        // quand l'annonce courante n'appartient pas à `F` (EX-DATA-93bis porte sur la CELLULE).
        registerCell('MODEL', c2Key, cellLabelOf('MODEL', makeId, modelId, year), c2Sample, fit);
        if (fit.ok && fit.zByRow.has(row)) {
          m2Fit = fit;
          m2Cell = c2Sample;
          m2Level = 'MODEL';
        }
      }
    } else if (!m2Implausible) {
      const s = sampleC3();
      if (s.keptCount >= MIN_M2 && !isImplausibleInCell(s, price)) {
        const fit = fitC3();
        registerCell('SELECTION', -1, 'Σ', s, fit);
        if (fit.ok && fit.zByRow.has(row)) {
          m2Fit = fit;
          m2Cell = s;
          m2Level = 'SELECTION';
        }
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

    if (m1Implausible || m2Implausible) {
      implausibleInCellIds.add(decodeListingId(batch.listingId, row));
      // Une annonce écartée de `V_price(C)` n'est ni évaluée ni JUGÉE : aucun verdict, pas même de
      // non-évaluation (EX-DATA-19(2)). Elle compte dans `outlierNotEvaluatedCount`.
      notEvaluatedCount++;
      implausibleInCellCount++;
      continue;
    }

    if (m1Evaluated || m2Evaluated) evaluatedCount++;
    else {
      notEvaluatedCount++;
      // ---- D8-09 (DR-114) : un VERDICT par annonce non évaluable ----------------------------
      // `EX-DATA-86` (dernière ligne : « aucune cellule … drapeau INSUFFICIENT_DATA »),
      // `EX-DATA-89` (« IQR = 0 … verdict INSUFFICIENT_SPREAD ») et `EX-DATA-95` (« n'est pas non
      // plus comptée comme non anormale ») exigent que la non-évaluabilité soit DITE, et non
      // déduite d'une absence. Le moteur n'émettait aucun verdict : l'écran ne pouvait pas
      // distinguer « aucune anomalie » de « pas de mesure possible ».
      //
      // Le code est déterminé par la cause, dans cet ordre :
      //   - aucune cellule n'a atteint `n_price ≥ 12` (`m1Fence === null`)      → INSUFFICIENT_DATA
      //     (M2 démarre à 30 : aucune cellule à 12 ⇒ aucune à 30, la cause est bien l'effectif) ;
      //   - une cellule existe mais son `IQR(ln p)` est nul (`spread === false`) → INSUFFICIENT_SPREAD.
      // Les deux autres branches de non-évaluation (prix hors `V_price` au sens absolu, implausible
      // en cellule) sortent AVANT ce point : elles ne sont pas jugées du tout (EX-DATA-16(d),
      // EX-DATA-19(2)) et ne reçoivent donc pas de verdict.
      const notEvaluableCode = m1Fence === null ? FLAG_INSUFFICIENT_DATA : FLAG_INSUFFICIENT_SPREAD;
      if (notEvaluableCode === FLAG_INSUFFICIENT_DATA) insufficientDataCount++;
      else insufficientSpreadCount++;
      verdicts.push({
        snapshotId,
        selectionHash,
        listingId: decodeListingId(batch.listingId, row),
        // La méthode nommée est M1 : c'est la première du repli d'`EX-DATA-86` et la plus
        // permissive (12 contre 30) — une annonce que M1 ne peut pas juger, M2 ne le peut pas
        // davantage. La clé primaire du verdict `(snapshot, sélection, annonce, méthode)` reste
        // unique : une annonce non évaluable ne porte aucun autre verdict.
        method: 'M1',
        flags: [notEvaluableCode],
        expectedPriceEur: null,
        deviationPct: null,
        // EX-DATA-95 : jamais classée parmi les opportunités.
        opportunityScore: null,
        cellLabel: m1Level,
        cellCount: m1Cell.keptCount,
        implausibleInCellCount: m1Cell.implausibleInCellCount,
      });
      continue;
    }

    const agreeLow = m1Low && m2Low;
    const agreeHigh = m1High && m2High;
    const opportunityScore = m2Evaluated ? -(m2Z as number) : m1Evaluated ? -(zIqr as number) : null;
    if (m1Low || m2Low) flaggedLowRow.add(row);
    // `A` d'EX-DATA-101 : l'annonce porte au moins un des quatre drapeaux de signalement (les codes
    // d'accord n'apparaissent jamais seuls). Publié par LIGNE pour l'échantillonnage du nuage G4.
    if (m1Low || m1High || m2Low || m2High) flaggedRows.add(row);
    if (opportunityScore !== null) scoreByRow.set(row, opportunityScore);

    // EX-DATA-92/94, EX-SCR-203/206 : un verdict est publié pour TOUTE annonce ÉVALUÉE, signalée ou
    // non — `flags` vide quand aucune barrière n'est franchie. Le verdict d'aberration (`flags`) et
    // le score de classement (`opportunityScore`) sont deux choses distinctes : sans cela l'écran D
    // ne peut ni afficher l'écart au prix attendu des annonces évaluées, ni les classer.
    // L'UUID canonique n'est décodé qu'UNE fois par annonce évaluée (point chaud à N = 100 000).
    if (m1Evaluated || m2Evaluated) {
      const listingId = decodeListingId(batch.listingId, row);
      if (m1Evaluated) {
        const flags: string[] = [];
        if (m1Low || m1High) {
          m1FlaggedIds.add(listingId);
          flags.push(m1Low ? FLAG_M1_LOW : FLAG_M1_HIGH);
          if (agreeLow) flags.push(FLAG_AGREE_LOW);
          if (agreeHigh) flags.push(FLAG_AGREE_HIGH);
        }
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
          cellCount: m1Cell.keptCount,
          implausibleInCellCount: m1Cell.implausibleInCellCount,
        });
      }
      if (m2Evaluated) {
        const flags: string[] = [];
        if (m2Low || m2High) {
          m2FlaggedIds.add(listingId);
          flags.push(m2Low ? FLAG_M2_LOW : FLAG_M2_HIGH);
          if (agreeLow) flags.push(FLAG_AGREE_LOW);
          if (agreeHigh) flags.push(FLAG_AGREE_HIGH);
        }
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
          cellCount: m2Cell.keptCount,
          implausibleInCellCount: m2Cell.implausibleInCellCount,
        });
      }
    }
  }

  const outlierNotEvaluatedCount = notEvaluatedCount;

  // --- M3 : contrôle externe (EX-DATA-96) ---
  const m3 = computeM3(batch, rows, flaggedLowRow, priceQuotedCount);

  // D8-07 : ordre de publication total des cellules — niveau (du plus fin au plus grossier), puis
  // clé entière croissante. `C₃ = Σ` est unique et vient en dernier.
  const cellStats: CellStat[] = [
    ...[...cellStatC1.values()].sort((a, b) => a.cellKey - b.cellKey),
    ...[...cellStatC2.values()].sort((a, b) => a.cellKey - b.cellKey),
    ...cellStatSelection,
  ];

  return {
    verdicts,
    outlierEvaluatedCount: evaluatedCount,
    outlierNotEvaluatedCount,
    evaluation: {
      evaluated: evaluatedCount,
      notEvaluable: {
        INSUFFICIENT_DATA: insufficientDataCount,
        INSUFFICIENT_SPREAD: insufficientSpreadCount,
      },
      notEvaluableTotal: insufficientDataCount + insufficientSpreadCount,
      priceExcluded: priceExcludedCount,
      implausibleInCell: implausibleInCellCount,
    },
    cellStats,
    flaggedRows,
    scoreByRow,
    m1FlaggedIds,
    m2FlaggedIds,
    implausibleInCellIds,
    selectionImplausibleThreshold: sampleC3().implausibleThreshold,
    m3,
  };
}

function pushTo(map: Map<number, number[]>, key: number, value: number): void {
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
