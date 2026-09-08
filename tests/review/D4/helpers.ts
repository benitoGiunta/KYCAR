/**
 * Revue D4 — utilitaires partagés des sondes (phase 2.5, rev-D4).
 *
 * - `makeBatch(rows)` : construit un `ListingColumnBatch` colonnaire CONTRÔLÉ ligne à ligne (prix,
 *   statut, drapeaux d'ingestion, année/mois, kilométrage, marque/modèle, énumérations) pour les
 *   sondes de seuil (ADV-06/07), de sentinelle (ADV-04), de bornes BIN et de densité.
 * - `refQuantile` / `refStats` : RÉFÉRENCE INDÉPENDANTE du quantile de type 7 (EX-DATA-62), écrite
 *   sans réutiliser le code du moteur, pour confronter `exactMetricStats` / `bin`.
 * - `cellRows` : génère `n` annonces plausibles d'une même cellule (marque, modèle) avec dispersion
 *   contrôlée, déterministe (PRNG à graine) — pour construire des cellules à n = 11, 12, 29, 30.
 *
 * Aucun réseau. Import uniquement depuis `src/` en chemin relatif.
 */

import v8 from 'node:v8';
import vm from 'node:vm';
import type { ListingColumnBatch } from '../../../src/types/index';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN } from '../../../src/types/index';
import {
  PRICE_STATUS_MISSING,
  PRICE_STATUS_ON_REQUEST,
  PRICE_STATUS_QUOTED,
} from '../../../src/engine/flags';

export type PriceStatusName = 'QUOTED' | 'ON_REQUEST' | 'MISSING';

/** Spécification d'une ligne du batch de test. Tout champ omis reçoit une valeur neutre connue. */
export interface RowSpec {
  readonly makeId?: number;
  readonly modelId?: number;
  /** Prix en euros ; `null` = inconnu (sentinelle −1). */
  readonly price?: number | null;
  /** Statut de prix ; par défaut QUOTED si `price` est un nombre, MISSING sinon. Un octet brut est accepté. */
  readonly status?: PriceStatusName | number;
  /** Année civile de première immatriculation ; `null` = inconnue. */
  readonly year?: number | null;
  /** Mois 1..12 (défaut 6). */
  readonly month?: number;
  /** Kilométrage ; `null` = inconnu. */
  readonly mileage?: number | null;
  /** Masque `ingestFlags` (bits d'`INGEST_FLAG_VALUES`). */
  readonly flags?: number;
  /** `priceEvaluationCategory` (0..5, 255 = inconnu). */
  readonly evalCat?: number;
  readonly fuel?: number;
  readonly body?: number;
  readonly transmission?: number;
  readonly region?: number;
  readonly country?: number;
  readonly sellerType?: number;
  readonly powerKw?: number | null;
}

function statusByte(spec: RowSpec): number {
  const s = spec.status;
  if (typeof s === 'number') return s;
  if (s === 'ON_REQUEST') return PRICE_STATUS_ON_REQUEST;
  if (s === 'MISSING') return PRICE_STATUS_MISSING;
  if (s === 'QUOTED') return PRICE_STATUS_QUOTED;
  return typeof spec.price === 'number' ? PRICE_STATUS_QUOTED : PRICE_STATUS_MISSING;
}

/** Construit un batch colonnaire déterministe à partir de spécifications de lignes. */
export function makeBatch(
  rows: readonly RowSpec[],
  options: { readonly snapshotId?: string; readonly localDatasetKey?: string } = {},
): ListingColumnBatch {
  const n = rows.length;
  const listingId = new Uint8Array(n * 16);
  const priceEur = new Int32Array(n);
  const mileageKm = new Int32Array(n);
  const firstRegistrationYearMonth = new Int32Array(n);
  const modelId = new Int32Array(n);
  const makeId = new Int32Array(n);
  const modelYear = new Int16Array(n);
  const powerKw = new Int16Array(n);
  const co2 = new Int16Array(n).fill(NUMERIC_UNKNOWN);
  const cons = new Int16Array(n).fill(NUMERIC_UNKNOWN);
  const range = new Int16Array(n).fill(NUMERIC_UNKNOWN);
  const enumCol = (): Uint8Array => new Uint8Array(n).fill(ENUM_UNKNOWN_BYTE);
  const fuelCategory = enumCol();
  const bodyType = enumCol();
  const transmission = enumCol();
  const drivetrain = enumCol();
  const offerType = enumCol();
  const usageState = enumCol();
  const sellerType = enumCol();
  const regionCode = enumCol();
  const countryCode = enumCol();
  const priceStatus = new Uint8Array(n);
  const priceEvaluationCategory = enumCol();
  const adTier = enumCol();
  const bodyColor = enumCol();
  const upholsteryType = enumCol();
  const euEmissionStandard = enumCol();
  const doorCount = enumCol();
  const seatCount = enumCol();
  const previousOwnerCount = enumCol();
  const imageCount = enumCol();
  const booleanFlags = new Uint16Array(n);
  const ingestFlags = new Uint16Array(n);

  for (let i = 0; i < n; i++) {
    const r = rows[i] as RowSpec;
    // UUID unique et déterministe : les 4 derniers octets portent l'indice de ligne.
    const base = i * 16;
    for (let k = 0; k < 12; k++) listingId[base + k] = (i * 131 + k * 17 + 7) & 0xff;
    listingId[base + 6] = ((listingId[base + 6] as number) & 0x0f) | 0x40;
    listingId[base + 8] = ((listingId[base + 8] as number) & 0x3f) | 0x80;
    listingId[base + 12] = (i >>> 24) & 0xff;
    listingId[base + 13] = (i >>> 16) & 0xff;
    listingId[base + 14] = (i >>> 8) & 0xff;
    listingId[base + 15] = i & 0xff;

    makeId[i] = r.makeId ?? 1;
    modelId[i] = r.modelId ?? 101;
    priceEur[i] = typeof r.price === 'number' ? r.price : NUMERIC_UNKNOWN;
    priceStatus[i] = statusByte(r);
    if (r.year === null) {
      firstRegistrationYearMonth[i] = NUMERIC_UNKNOWN;
      modelYear[i] = NUMERIC_UNKNOWN;
    } else {
      const y = r.year ?? 2018;
      const m = r.month ?? 6;
      firstRegistrationYearMonth[i] = 12 * y + (m - 1);
      modelYear[i] = y;
    }
    mileageKm[i] = r.mileage === null ? NUMERIC_UNKNOWN : (r.mileage ?? 80_000);
    powerKw[i] = r.powerKw === null ? NUMERIC_UNKNOWN : (r.powerKw ?? 85);
    ingestFlags[i] = r.flags ?? 0;
    priceEvaluationCategory[i] = r.evalCat ?? ENUM_UNKNOWN_BYTE;
    fuelCategory[i] = r.fuel ?? 0;
    bodyType[i] = r.body ?? 0;
    transmission[i] = r.transmission ?? 0;
    regionCode[i] = r.region ?? 0;
    countryCode[i] = r.country ?? 0;
    sellerType[i] = r.sellerType ?? 1;
  }

  // Zone de chaînes : 5 champs vides par ligne (STRINGS_PER_ROW = 5).
  const stringOffsets = new Uint32Array(n * 5 + 1);
  return {
    snapshotId: options.snapshotId ?? 'review-d4',
    localDatasetKey: options.localDatasetKey ?? 'FULL',
    rowCount: n,
    listingId,
    priceEur,
    mileageKm,
    firstRegistrationYearMonth,
    modelId,
    makeId,
    modelYear,
    powerKw,
    co2EmissionsGPerKmX10: co2,
    consumptionCombinedL100KmX10: cons,
    electricRangeKm: range,
    fuelCategory,
    bodyType,
    transmission,
    drivetrain,
    offerType,
    usageState,
    sellerType,
    regionCode,
    countryCode,
    priceStatus,
    priceEvaluationCategory,
    adTier,
    bodyColor,
    upholsteryType,
    euEmissionStandard,
    doorCount,
    seatCount,
    previousOwnerCount,
    imageCount,
    booleanFlags,
    ingestFlags,
    stringBlob: new Uint8Array(0),
    stringOffsets,
  };
}

/** Toutes les lignes `[0, n)` d'un batch. */
export function allRows(batch: ListingColumnBatch): Int32Array {
  return Int32Array.from({ length: batch.rowCount }, (_v, i) => i);
}

/* ---- Référence indépendante : quantile de type 7 (EX-DATA-62) ------------------------------- */

/** `Q(V, p)` type 7 selon la formule littérale d'EX-DATA-62, sur un multiensemble non trié. */
export function refQuantile(values: readonly number[], p: number): number {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) throw new RangeError('refQuantile: échantillon vide');
  if (n === 1) return s[0] as number;
  const h = (n - 1) * p + 1;
  const i = Math.floor(h);
  const f = h - i;
  if (f === 0 || i === n) return s[i - 1] as number;
  return (s[i - 1] as number) + f * ((s[i] as number) - (s[i - 1] as number));
}

/** Bloc de référence (min, max, moyenne, sd d'échantillon en deux passes, cinq quantiles). */
export function refStats(values: readonly number[]): {
  n: number;
  min: number;
  max: number;
  mean: number;
  sd: number | null;
  p05: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
} {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const ss = values.reduce((a, b) => a + (b - mean) * (b - mean), 0);
  return {
    n,
    min: Math.min(...values),
    max: Math.max(...values),
    mean,
    sd: n < 2 ? null : Math.sqrt(ss / (n - 1)),
    p05: refQuantile(values, 0.05),
    p25: refQuantile(values, 0.25),
    p50: refQuantile(values, 0.5),
    p75: refQuantile(values, 0.75),
    p95: refQuantile(values, 0.95),
  };
}

/* ---- PRNG et générateur de cellule ---------------------------------------------------------- */

/** mulberry32 : PRNG déterministe. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `n` annonces plausibles d'une cellule (marque, modèle) : prix ≈ base · 0,9^âge · (1 − km/300000) ·
 * bruit multiplicatif ±`noise`, années réparties sur 8 millésimes, kilométrage corrélé à l'âge.
 * Toutes les lignes ont prix/année/kilométrage valides (points `F` d'EX-DATA-90).
 */
export function cellRows(
  n: number,
  options: {
    readonly makeId?: number;
    readonly modelId?: number;
    readonly basePrice?: number;
    readonly seed?: number;
    readonly noise?: number;
    readonly referenceYear?: number;
  } = {},
): RowSpec[] {
  const rng = mulberry32(options.seed ?? 42);
  const basePrice = options.basePrice ?? 20_000;
  const noise = options.noise ?? 0.08;
  const refYear = options.referenceYear ?? 2025;
  const out: RowSpec[] = [];
  for (let i = 0; i < n; i++) {
    const age = i % 8; // millésimes répartis, jamais dégénérés
    const km = Math.round((8_000 + age * 16_000) * (0.75 + rng() * 0.5));
    const clean = basePrice * Math.pow(0.9, age) * (1 - Math.min(0.4, km / 300_000)) * (1 - noise + 2 * noise * rng());
    out.push({
      makeId: options.makeId ?? 1,
      modelId: options.modelId ?? 101,
      price: Math.max(500, Math.round(clean)),
      year: refYear - age,
      month: 1 + (i % 12),
      mileage: km,
    });
  }
  return out;
}

/* ---- Mesure mémoire déterministe ------------------------------------------------------------- */

let gcFn: (() => void) | null = null;

/**
 * GC complet forcé, sans dépendre d'une option de lancement : active `--expose-gc` à chaud via V8 et
 * récupère `gc` dans un contexte neuf (technique standard Node). Deux passes pour vider aussi les
 * objets à finalisation différée.
 */
export function forceGc(): void {
  if (gcFn === null) {
    const existing = (globalThis as unknown as { gc?: () => void }).gc;
    if (typeof existing === 'function') gcFn = existing;
    else {
      v8.setFlagsFromString('--expose-gc');
      gcFn = vm.runInNewContext('gc') as () => void;
    }
  }
  gcFn();
  gcFn();
}

/** `heapUsed + arrayBuffers` après GC forcé, en octets : la mémoire réellement retenue par le processus V8. */
export function retainedBytes(): number {
  forceGc();
  const m = process.memoryUsage();
  return m.heapUsed + m.arrayBuffers;
}

/** Percentile empirique (rang plafonné) d'un tableau de durées — rapport de latence. */
export function percentileMs(samples: readonly number[], p: number): number {
  const s = [...samples].sort((a, b) => a - b);
  if (s.length === 0) return NaN;
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1));
  return s[idx] as number;
}

/** Médiane d'un tableau de durées. */
export function medianMs(samples: readonly number[]): number {
  return percentileMs(samples, 0.5);
}
