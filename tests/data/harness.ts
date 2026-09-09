/**
 * KYCAR — outillage des sondes de revue de données (phase 3.3, agent `data-review`).
 * =================================================================================================
 * Ce module ne teste rien : il CHARGE les fixtures livrées, les tables de la spécification et les
 * référentiels, et fournit les statistiques dont les sondes `R-DATA-nn` ont besoin.
 *
 * Règle du reviewer (REVIEW-PROTOCOL §2, D-31/D-32) : les mesures sont RECALCULÉES ici, jamais
 * reprises de `tools/dataset/check.mjs` ni du `generation.json` du générateur. Le seul document
 * qui fait foi est `docs/data/dataset-spec/probes.json` (les 110 sondes) et les tables qu'il vise.
 *
 * Profil : `KYCAR_DATA_PROFILE=dev` (défaut, rapide) ou `test` (profil chargé par l'application,
 * D3-01). Une sonde de portée « snapshot test » est ignorée hors de ce profil, en le disant.
 */
import { gunzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { createRequire } from 'node:module';

// -------------------------------------------------------------------------------------------------
// 1. Racine du dépôt et profil
// -------------------------------------------------------------------------------------------------

/** Racine du dépôt (ce fichier est dans `<racine>/tests/data/`). */
export const REPO_ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');

export type ProfileName = 'dev' | 'test';

/** Profil sous revue. `dev` par défaut (vitesse) ; `KYCAR_DATA_PROFILE=test` pour le profil complet. */
export const PROFILE: ProfileName =
  (process.env['KYCAR_DATA_PROFILE'] as ProfileName | undefined) === 'test' ? 'test' : 'dev';

export const IS_TEST_PROFILE = PROFILE === 'test';

/** Effectif attendu par snapshot, par profil (`profiles.json`). */
export const LISTINGS_PER_SNAPSHOT: Record<ProfileName, number> = { dev: 5_000, test: 20_000 };

// -------------------------------------------------------------------------------------------------
// 2. Types de la couche source (miroir minimal du schéma — le schéma fait foi)
// -------------------------------------------------------------------------------------------------

export interface RawListing {
  readonly id: string;
  readonly webPage: string;
  readonly marketplace: string;
  readonly vehicleType: string;
  readonly make: number;
  readonly makeName?: string;
  readonly model?: number;
  readonly modelName?: string;
  readonly modelVersion?: string;
  readonly productionYear?: number;
  readonly firstRegistrationDate?: string;
  readonly mileage?: number;
  readonly mileageUnit?: string;
  readonly power?: number;
  readonly powerUnit?: string;
  readonly powerHp?: number;
  readonly cylinderCapacity?: number;
  readonly cylinderCapacityUnit?: string;
  readonly cylinderCount?: number;
  readonly gearCount?: number;
  readonly transmission?: string;
  readonly drivetrain?: string;
  readonly fuelCategory?: string;
  readonly primaryFuelType?: number;
  readonly additionalFuelTypes?: readonly number[];
  readonly fuelSourceLabel?: string;
  readonly isPluginHybrid?: boolean;
  readonly battery?: { readonly ownershipType?: string; readonly capacity?: number; readonly capacityUnit?: string };
  readonly co2Emissions?: number;
  readonly co2EmissionsUnit?: string;
  readonly consumption?: { readonly combined?: number; readonly electricCombined?: number };
  readonly combinedUnit?: string;
  readonly electricCombinedUnit?: string;
  readonly wltp?: {
    readonly co2EmissionsCombined?: number;
    readonly consumptionCombined?: number;
    readonly consumptionElectricCombined?: number;
    readonly co2Class?: number;
  };
  readonly co2EmissionInGramPerKmWithFallback?: number;
  readonly consumptionCombinedWithFallback?: number;
  readonly euEmissionStandard?: string;
  readonly efficiencyClass?: number;
  readonly electricRange?: number;
  readonly hasParticleFilter?: boolean;
  readonly bodyType?: number;
  readonly doorCount?: number;
  readonly seatCount?: number;
  readonly bodyColor?: number;
  readonly isMetallic?: boolean;
  readonly paintType?: string;
  readonly upholsteryType?: string;
  readonly upholsteryColor?: number;
  readonly equipment?: readonly number[];
  readonly appliedSeals?: readonly number[];
  readonly offerType?: string;
  readonly usageState?: string;
  readonly condition?: { readonly hadAccident?: boolean };
  readonly previousOwnerCount?: number;
  readonly hasFullServiceHistory?: boolean;
  readonly nextInspectionDate?: string;
  readonly wasCabOrRental?: boolean;
  readonly warranty?: number;
  readonly warrantyUnit?: string;
  readonly hasWarranty?: boolean;
  readonly prices?: {
    readonly public?: {
      readonly price?: number;
      readonly currency?: string;
      readonly netPrice?: number;
      readonly vatRate?: number;
      readonly isTaxDeductible?: boolean;
      readonly isNegotiable?: boolean;
      readonly onRequestOnly?: boolean;
      readonly evaluation?: { readonly category?: number };
    };
    readonly manufacturersSuggestedRetail?: { readonly price: number; readonly currency: string };
  };
  readonly superDeal?: boolean;
  readonly adProduct?: { readonly tier?: string };
  readonly publication?: { readonly status?: string; readonly accurateState?: string; readonly isNew?: boolean };
  readonly createdAt?: string;
  readonly lastUpdatedAt?: string;
  readonly firstActivatedDate?: string;
  readonly imageCount?: number;
  readonly hasVideo?: boolean;
  readonly location: { readonly countryCode: string; readonly postalCodePrefix2?: string };
  readonly seller?: { readonly type?: string; readonly dealerBucket?: string };
}

export interface GroundTruthEntry {
  readonly listingId: string;
  readonly anomaly: string;
  readonly detail?: string;
  readonly peerListingId?: string;
  readonly expected?: Record<string, unknown>;
}

export interface SnapshotManifest {
  readonly snapshotId: string;
  readonly capturedAt: string;
  readonly marketplace: string;
  readonly profile: string;
  readonly seed: number;
  readonly schemaVersion: string;
  readonly generator: { readonly name: string; readonly version: string };
  readonly file: string;
  readonly listingCount: number;
  readonly sha256: string;
  readonly sha256Gz?: string;
  readonly uncompressedBytes?: number;
  readonly compressedBytes?: number;
  readonly previousSnapshotId: string | null;
  readonly groundTruth: readonly GroundTruthEntry[];
  readonly note?: string;
  readonly delta?: {
    readonly enteredCount: number;
    readonly exitedCount: number;
    readonly priceRevisedCount: number;
    readonly carriedOverCount: number;
  };
}

export interface Snapshot {
  readonly profile: ProfileName;
  readonly dir: string;
  readonly snapshotId: string;
  readonly manifest: SnapshotManifest;
  /** Une entrée par LIGNE du fichier (les doublons d'`id` de `A-07` sont conservés). */
  readonly rows: readonly RawListing[];
  /** Les lignes brutes, texte, dans l'ordre du fichier — nécessaires aux sondes de FORME. */
  readonly rawLines: readonly string[];
  readonly gzBytes: number;
  readonly uncompressedBytes: number;
  readonly sha256: string;
  readonly sha256Gz: string;
}

// -------------------------------------------------------------------------------------------------
// 3. Chargement (mémoïsé par processus)
// -------------------------------------------------------------------------------------------------

const snapshotCache = new Map<string, Snapshot>();

function fixtureRoot(profile: ProfileName): string {
  return join(REPO_ROOT, 'data', 'fixtures', profile);
}

/** Identifiants des snapshots d'un profil, dans l'ordre du répertoire (= ordre chronologique). */
export function snapshotIds(profile: ProfileName = PROFILE): readonly string[] {
  return readdirSync(fixtureRoot(profile))
    .filter((n) => statSync(join(fixtureRoot(profile), n)).isDirectory())
    .sort();
}

export function loadSnapshot(snapshotId: string, profile: ProfileName = PROFILE): Snapshot {
  const key = `${profile}/${snapshotId}`;
  const hit = snapshotCache.get(key);
  if (hit) return hit;

  const dir = join(fixtureRoot(profile), snapshotId);
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as SnapshotManifest;
  const gz = readFileSync(join(dir, manifest.file));
  const raw = gunzipSync(gz);
  const text = raw.toString('utf8');
  const rawLines = text.split('\n').filter((l) => l.length > 0);
  const rows = rawLines.map((l) => JSON.parse(l) as RawListing);

  const snap: Snapshot = {
    profile,
    dir,
    snapshotId,
    manifest,
    rows,
    rawLines,
    gzBytes: gz.byteLength,
    uncompressedBytes: raw.byteLength,
    sha256: createHash('sha256').update(raw).digest('hex'),
    sha256Gz: createHash('sha256').update(gz).digest('hex'),
  };
  snapshotCache.set(key, snap);
  return snap;
}

/** Les trois snapshots du profil, dans l'ordre chronologique. */
export function loadProfile(profile: ProfileName = PROFILE): readonly Snapshot[] {
  return snapshotIds(profile).map((id) => loadSnapshot(id, profile));
}

/** Le snapshot S0 du profil — portée « snapshot » des sondes. */
export function s0(profile: ProfileName = PROFILE): Snapshot {
  const first = loadProfile(profile)[0];
  if (!first) throw new Error(`aucun snapshot pour le profil ${profile}`);
  return first;
}

/** Le `generation.json` latéral d'un snapshot (rapport du générateur, écart EG-04). */
export function loadGenerationReport(snap: Snapshot): Record<string, unknown> {
  return JSON.parse(readFileSync(join(snap.dir, 'generation.json'), 'utf8')) as Record<string, unknown>;
}

// -------------------------------------------------------------------------------------------------
// 4. Tables de la spécification et référentiels
// -------------------------------------------------------------------------------------------------

function readJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(REPO_ROOT, ...parts), 'utf8')) as T;
}

export function specTable<T = Record<string, unknown>>(name: string): T {
  return readJson<T>('docs', 'data', 'dataset-spec', `${name}.json`);
}

export function probesTable(): {
  count: number;
  probes: { id: string; regle: string; famille: string; statistique: string; tolerance: string; portee: string }[];
} {
  return specTable('probes');
}

export function as24Schema(): Record<string, unknown> {
  return readJson('data', 'schema', 'as24-listing.schema.json');
}

export function manifestSchema(): Record<string, unknown> {
  return readJson('data', 'schema', 'snapshot-manifest.schema.json');
}

export function referenceJson<T = unknown>(name: string): T {
  return readJson<T>('data', 'reference', name);
}

// -------------------------------------------------------------------------------------------------
// 5. Dérivations d'annonce (jamais recopiées du générateur : recalculées d'après la spec)
// -------------------------------------------------------------------------------------------------

/** Année de première immatriculation, ou `undefined` si le champ est absent. */
export function firstRegYear(r: RawListing): number | undefined {
  const d = r.firstRegistrationDate;
  if (typeof d !== 'string' || d.length < 4) return undefined;
  const y = Number.parseInt(d.slice(0, 4), 10);
  return Number.isFinite(y) ? y : undefined;
}

export function firstRegMonthIndex(r: RawListing): number | undefined {
  const d = r.firstRegistrationDate;
  if (typeof d !== 'string' || d.length !== 7) return undefined;
  const y = Number.parseInt(d.slice(0, 4), 10);
  const m = Number.parseInt(d.slice(5, 7), 10);
  return Number.isFinite(y) && Number.isFinite(m) ? y * 12 + (m - 1) : undefined;
}

/** Âge en années au sens des sondes : `capturedAt.year − firstRegistrationYear` (P-13). */
export function ageYears(r: RawListing, snap: Snapshot): number | undefined {
  const y = firstRegYear(r);
  if (y === undefined) return undefined;
  return Number.parseInt(snap.manifest.capturedAt.slice(0, 4), 10) - y;
}

/** Âge en mois, mesuré du mois de première immatriculation au mois de `capturedAt`. */
export function ageMonths(r: RawListing, snap: Snapshot): number | undefined {
  const fm = firstRegMonthIndex(r);
  if (fm === undefined) return undefined;
  const cy = Number.parseInt(snap.manifest.capturedAt.slice(0, 4), 10);
  const cm = Number.parseInt(snap.manifest.capturedAt.slice(5, 7), 10);
  return cy * 12 + (cm - 1) - fm;
}

/** Prix affiché (`QUOTED` seul), ou `undefined`. */
export function price(r: RawListing): number | undefined {
  return r.prices?.public?.price;
}

/** Statut de prix au sens de `R-22` : la FORME de `prices.public` le porte, aucun champ ne le dit. */
export function priceStatus(r: RawListing): 'QUOTED' | 'ON_REQUEST' | 'MISSING' {
  const p = r.prices?.public;
  if (p?.onRequestOnly === true) return 'ON_REQUEST';
  if (p?.price !== undefined) return 'QUOTED';
  return 'MISSING';
}

/** Branche de mesure déclarée par la ligne (`R-38`). */
export function measurementBranch(r: RawListing): 'WLTP' | 'NEDC' | 'NONE' {
  if (r.wltp !== undefined) return 'WLTP';
  if (r.co2Emissions !== undefined || r.consumption !== undefined || r.efficiencyClass !== undefined) return 'NEDC';
  return 'NONE';
}

/** Index de vérité terrain d'un snapshot : `listingId` → codes d'anomalie déclarés. */
export function groundTruthIndex(snap: Snapshot): Map<string, Set<string>> {
  const idx = new Map<string, Set<string>>();
  for (const g of snap.manifest.groundTruth) {
    let s = idx.get(g.listingId);
    if (!s) {
      s = new Set<string>();
      idx.set(g.listingId, s);
    }
    s.add(g.anomaly);
  }
  return idx;
}

/** Toutes les entrées de vérité terrain portant un code donné. */
export function groundTruthOf(snap: Snapshot, code: string): readonly GroundTruthEntry[] {
  return snap.manifest.groundTruth.filter((g) => g.anomaly === code);
}

/** Les `listingId` déclarés sous un code donné. */
export function declaredIds(snap: Snapshot, ...codes: string[]): Set<string> {
  const wanted = new Set(codes);
  const out = new Set<string>();
  for (const g of snap.manifest.groundTruth) if (wanted.has(g.anomaly)) out.add(g.listingId);
  return out;
}

// -------------------------------------------------------------------------------------------------
// 6. Statistiques
// -------------------------------------------------------------------------------------------------

export function quantile(values: readonly number[], q: number): number {
  if (values.length === 0) return Number.NaN;
  const v = [...values].sort((a, b) => a - b);
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const a = v[lo] as number;
  const b = v[hi] as number;
  return a + (b - a) * (pos - lo);
}

export const median = (values: readonly number[]): number => quantile(values, 0.5);

export function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  let s = 0;
  for (const x of values) s += x;
  return s / values.length;
}

export function stdev(values: readonly number[]): number {
  const m = mean(values);
  let s = 0;
  for (const x of values) s += (x - m) * (x - m);
  return Math.sqrt(s / values.length);
}

/** Corrélation de Pearson sur deux séries de même longueur. */
export function pearson(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return Number.NaN;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = (xs[i] as number) - mx;
    const dy = (ys[i] as number) - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy);
}

/** Moindres carrés ordinaires `y ~ 1 + x1 + x2` par les équations normales (3×3, Gauss). */
export function ols2(
  y: readonly number[],
  x1: readonly number[],
  x2: readonly number[],
): { beta0: number; beta1: number; beta2: number } {
  const n = y.length;
  const a: number[][] = [
    [n, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < n; i += 1) {
    const u = x1[i] as number;
    const v = x2[i] as number;
    const t = y[i] as number;
    (a[0] as number[])[1] = (a[0] as number[])[1]! + u;
    (a[0] as number[])[2] = (a[0] as number[])[2]! + v;
    (a[0] as number[])[3] = (a[0] as number[])[3]! + t;
    (a[1] as number[])[1] = (a[1] as number[])[1]! + u * u;
    (a[1] as number[])[2] = (a[1] as number[])[2]! + u * v;
    (a[1] as number[])[3] = (a[1] as number[])[3]! + u * t;
    (a[2] as number[])[2] = (a[2] as number[])[2]! + v * v;
    (a[2] as number[])[3] = (a[2] as number[])[3]! + v * t;
  }
  (a[1] as number[])[0] = (a[0] as number[])[1]!;
  (a[2] as number[])[0] = (a[0] as number[])[2]!;
  (a[2] as number[])[1] = (a[1] as number[])[2]!;

  // Élimination de Gauss avec pivot partiel.
  for (let col = 0; col < 3; col += 1) {
    let piv = col;
    for (let r = col + 1; r < 3; r += 1) {
      if (Math.abs((a[r] as number[])[col]!) > Math.abs((a[piv] as number[])[col]!)) piv = r;
    }
    const tmp = a[col] as number[];
    a[col] = a[piv] as number[];
    a[piv] = tmp;
    const p = (a[col] as number[])[col]!;
    for (let c = col; c < 4; c += 1) (a[col] as number[])[c] = (a[col] as number[])[c]! / p;
    for (let r = 0; r < 3; r += 1) {
      if (r === col) continue;
      const f = (a[r] as number[])[col]!;
      if (f === 0) continue;
      for (let c = col; c < 4; c += 1) (a[r] as number[])[c] = (a[r] as number[])[c]! - f * (a[col] as number[])[c]!;
    }
  }
  return {
    beta0: (a[0] as number[])[3]!,
    beta1: (a[1] as number[])[3]!,
    beta2: (a[2] as number[])[3]!,
  };
}

/** Statistique du khi-deux d'ajustement à l'uniforme sur `k` cases. */
export function chiSquareUniform(counts: readonly number[]): { chi2: number; df: number } {
  const n = counts.reduce((s, c) => s + c, 0);
  const e = n / counts.length;
  let chi2 = 0;
  for (const c of counts) chi2 += ((c - e) * (c - e)) / e;
  return { chi2, df: counts.length - 1 };
}

/**
 * Valeur p de survie du khi-deux (série de Wilson–Hilferty pour df grand, série exacte sinon).
 * Suffisante pour un seuil à 1 % : la sonde compare `p > 0.01`.
 */
export function chiSquarePValue(chi2: number, df: number): number {
  if (df <= 0) return Number.NaN;
  if (df > 100) {
    // Wilson–Hilferty : ((chi2/df)^(1/3) − (1 − 2/(9df))) / sqrt(2/(9df)) ~ N(0,1).
    const z = (Math.cbrt(chi2 / df) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
    return 1 - normalCdf(z);
  }
  // Série de la fonction gamma incomplète régularisée Q(df/2, chi2/2).
  const k = df / 2;
  const x = chi2 / 2;
  if (x < k + 1) {
    let sum = 1 / k;
    let term = sum;
    for (let i = 1; i < 1000; i += 1) {
      term *= x / (k + i);
      sum += term;
      if (term < sum * 1e-14) break;
    }
    return 1 - sum * Math.exp(-x + k * Math.log(x) - lgamma(k));
  }
  // Fraction continue de Lentz pour Q.
  let b = x + 1 - k;
  let c = 1e300;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 1000; i += 1) {
    const an = -i * (i - k);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c;
    if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return Math.exp(-x + k * Math.log(x) - lgamma(k)) * h;
}

function lgamma(z: number): number {
  const g = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  const zz = z - 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < g.length; i += 1) x += (g[i] as number) / (zz + i + 1);
  const t = zz + g.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x);
}

export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number): number {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-a * a);
  return s * y;
}

/** Kappa de Cohen sur deux classifications binaires alignées. */
export function cohenKappa(a: readonly boolean[], b: readonly boolean[]): number {
  const n = a.length;
  let n11 = 0;
  let n10 = 0;
  let n01 = 0;
  let n00 = 0;
  for (let i = 0; i < n; i += 1) {
    const x = a[i] as boolean;
    const y = b[i] as boolean;
    if (x && y) n11 += 1;
    else if (x && !y) n10 += 1;
    else if (!x && y) n01 += 1;
    else n00 += 1;
  }
  const po = (n11 + n00) / n;
  const pe = (((n11 + n10) * (n11 + n01)) / n + ((n01 + n00) * (n10 + n00)) / n) / n;
  return (po - pe) / (1 - pe);
}

/** Comptage par clé. */
export function countBy<T>(items: readonly T[], key: (t: T) => string | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (k === undefined) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** Regroupement par clé. */
export function groupBy<T>(items: readonly T[], key: (t: T) => string | undefined): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    if (k === undefined) continue;
    const arr = m.get(k);
    if (arr) arr.push(it);
    else m.set(k, [it]);
  }
  return m;
}

/** Nombre de descentes (inversions locales) d'une série — sonde de monotonie « 1 inversion tolérée ». */
export function decreasingViolations(series: readonly number[]): number {
  let bad = 0;
  for (let i = 1; i < series.length; i += 1) if ((series[i] as number) > (series[i - 1] as number)) bad += 1;
  return bad;
}

export function increasingViolations(series: readonly number[]): number {
  let bad = 0;
  for (let i = 1; i < series.length; i += 1) if ((series[i] as number) < (series[i - 1] as number)) bad += 1;
  return bad;
}

// -------------------------------------------------------------------------------------------------
// 7. Balayage R3 — vocabulaire d'instance (D3-12)
// -------------------------------------------------------------------------------------------------

/** Toutes les clés JSON rencontrées dans un objet, chemins aplatis et clés nues. */
export function collectKeys(value: unknown, into: Set<string> = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const v of value) collectKeys(v, into);
    return into;
  }
  if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      into.add(k);
      collectKeys(v, into);
    }
  }
  return into;
}

/** Toutes les valeurs de type chaîne d'un objet (avec leur chemin). */
export function collectStrings(
  value: unknown,
  path = '',
  into: { path: string; value: string }[] = [],
): { path: string; value: string }[] {
  if (typeof value === 'string') {
    into.push({ path, value });
    return into;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) collectStrings(value[i], `${path}[]`, into);
    return into;
  }
  if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      collectStrings(v, path === '' ? k : `${path}.${k}`, into);
    }
  }
  return into;
}

// -------------------------------------------------------------------------------------------------
// 8. Journal de mesures — la table §4 du rapport est produite par l'exécution, pas recopiée
// -------------------------------------------------------------------------------------------------

/**
 * Consigne la mesure d'une sonde sur la sortie standard, sous une forme grepable
 * (`npm run test:data 2>&1 | grep '^MESURE '`). Une sonde verte doit rester lisible : sans cela la
 * table « P-nn → mesure » du rapport serait recopiée à la main, donc invérifiable.
 */
export function measure(probeId: string, text: string): void {
  console.log(`MESURE ${probeId} | ${PROFILE} | ${text}`);
}

/** Formate un ratio en pourcentage à deux décimales. */
export function pct(x: number): string {
  return `${(x * 100).toFixed(2)} %`;
}

// -------------------------------------------------------------------------------------------------
// 9. Validation de schéma (ajv 2020, déjà devDependency — aucune dépendance ajoutée)
// -------------------------------------------------------------------------------------------------

export interface CompiledValidator {
  (data: unknown): boolean;
  errors?: { instancePath?: string; message?: string }[] | null;
}

/** Compile les deux schémas livrés avec le même moteur que le générateur (ajv draft 2020-12). */
export function buildValidators(): {
  listing: CompiledValidator;
  manifest: CompiledValidator;
  engine: string;
} {
  const require_ = createRequire(import.meta.url);
  const Ajv2020 = require_('ajv/dist/2020') as { default?: unknown };
  const addFormats = require_('ajv-formats') as { default?: unknown };
  const AjvCtor = (Ajv2020.default ?? Ajv2020) as new (o: object) => {
    compile: (s: object) => CompiledValidator;
  };
  const addFormatsFn = (addFormats.default ?? addFormats) as (a: unknown) => void;
  const ajv = new AjvCtor({ allErrors: false, strict: false });
  addFormatsFn(ajv);
  const version = (require_('ajv/package.json') as { version: string }).version;
  return {
    engine: `ajv ${version}`,
    listing: ajv.compile(as24Schema()),
    manifest: ajv.compile(manifestSchema()),
  };
}

// -------------------------------------------------------------------------------------------------
// 10. Segment latent — reconstitué depuis models.json pour les modèles CURATÉS (D3-14)
// -------------------------------------------------------------------------------------------------

export interface CuratedModel {
  readonly makeSlug: string;
  readonly makeId: number;
  readonly modelSlug: string;
  readonly modelId: number;
  readonly shareInMake: number;
  readonly segment: string;
  readonly yearFrom: number;
  readonly yearTo: number;
  readonly powerKwMedian: number;
}

let curatedIndex: Map<string, CuratedModel> | undefined;

/** `makeId|modelId` → modèle curaté. Un modèle de queue n'y figure pas (son segment est inconnaissable). */
export function curatedModels(): Map<string, CuratedModel> {
  if (!curatedIndex) {
    const t = specTable<{ models: CuratedModel[] }>('models');
    curatedIndex = new Map(t.models.map((m) => [`${m.makeId}|${m.modelId}`, m]));
  }
  return curatedIndex;
}

/**
 * Segment latent d'une annonce, quand il est CONNAISSABLE : `models.json` pour un modèle curaté
 * (D3-14). Le segment d'un modèle de queue est tiré par annonce (écart EG-03) et n'est écrit nulle
 * part : il reste `undefined`, et les sondes par segment le disent.
 */
export function segmentOf(r: RawListing): string | undefined {
  if (r.model === undefined) return undefined;
  return curatedModels().get(`${r.make}|${r.model}`)?.segment;
}

/** Famille de carburant au sens des sondes P-16 … P-21. */
export function fuelFamily(r: RawListing): 'B' | 'D' | 'HYB' | 'E' | 'X' | undefined {
  const f = r.fuelCategory;
  if (f === undefined) return undefined;
  if (f === 'B') return 'B';
  if (f === 'D') return 'D';
  if (f === '2' || f === '3') return 'HYB';
  if (f === 'E') return 'E';
  return 'X';
}

// -------------------------------------------------------------------------------------------------
// 11. Lot canonique — les fixtures passées par l'ADAPTATEUR de production (`fixture-provider`)
// -------------------------------------------------------------------------------------------------

/**
 * Ouvre un snapshot avec le VRAI provider de fixtures et le VRAI adaptateur `as24 → canonique`, et
 * rend le lot colonnaire. C'est ce que l'application charge : une sonde qui juge « ce que
 * l'utilisateur verra » doit passer par ce chemin, pas par une relecture du NDJSON.
 */
export async function openCanonicalBatch(
  snapshotId?: string,
  profile: ProfileName = PROFILE,
): Promise<{ batch: import('../../src/types/index').ListingColumnBatch; provider: unknown; descriptor: unknown }> {
  const { loadReferenceData } = await import('../../src/engine/testkit');
  const { FixtureDataProvider } = await import('../../src/providers/fixture/FixtureDataProvider');
  const { createNodeFixtureLoader } = await import('../../src/providers/fixture/loaders/node');
  const provider = new FixtureDataProvider({
    referenceData: loadReferenceData(),
    profile,
    loader: createNodeFixtureLoader(join(REPO_ROOT, 'data', 'fixtures')),
    ...(snapshotId === undefined ? {} : { snapshotId }),
  });
  const handle = await provider.openSnapshot();
  const batch = await provider.fetchListingColumns(handle, 'FULL');
  return { batch, provider, descriptor: handle.descriptor };
}

// -------------------------------------------------------------------------------------------------
// 12. Anomalies de prix et de kilométrage — populations à écarter d'une STATISTIQUE de distribution
// -------------------------------------------------------------------------------------------------

/**
 * HYPOTHÈSE ÉCRITE (E4). Les sondes de DISTRIBUTION de prix (`P-31` … `P-39`) mesurent le modèle de
 * prix, pas l'injecteur d'anomalies : les annonces dont le prix a été délibérément faussé et
 * DÉCLARÉ au manifest (§6 de DATASET-SPEC) en sont écartées. Sans cela, `P-32` (moyenne/médiane)
 * mesurerait la queue d'un outlier à 3 M€ et non la dispersion du marché modélisé. Les mesures
 * publient les deux valeurs, avec et sans exclusion, pour que le choix soit vérifiable.
 */
export const PRICE_ANOMALY_CODES = [
  'PRICE_SENTINEL_ABSOLUTE',
  'PRICE_OUT_OF_RANGE',
  'OUTLIER_M1_LOW',
  'OUTLIER_M1_HIGH',
  'OUTLIER_M2_LOW',
  'OUTLIER_M2_HIGH',
] as const;

/** Anomalies portant sur le kilométrage ou sa lisibilité. */
export const MILEAGE_ANOMALY_CODES = [
  'SUSPECT_ZERO_MILEAGE',
  'MILEAGE_OUT_OF_RANGE',
  'MILEAGE_IMPLAUSIBLE_FOR_AGE',
  'UNIT_UNSUPPORTED',
] as const;

/** Moindres carrés ordinaires à `k` régresseurs (la 1re colonne de `X` porte la constante). */
export function olsK(y: readonly number[], X: readonly (readonly number[])[]): number[] {
  const k = (X[0] ?? []).length;
  const n = y.length;
  const A: number[][] = Array.from({ length: k }, () => new Array<number>(k + 1).fill(0));
  for (let i = 0; i < n; i += 1) {
    const xi = X[i] as readonly number[];
    for (let a = 0; a < k; a += 1) {
      const xa = xi[a] as number;
      for (let b = a; b < k; b += 1) (A[a] as number[])[b] = (A[a] as number[])[b]! + xa * (xi[b] as number);
      (A[a] as number[])[k] = (A[a] as number[])[k]! + xa * (y[i] as number);
    }
  }
  for (let a = 0; a < k; a += 1) for (let b = 0; b < a; b += 1) (A[a] as number[])[b] = (A[b] as number[])[a]!;
  for (let c = 0; c < k; c += 1) {
    let p = c;
    for (let r = c + 1; r < k; r += 1) if (Math.abs((A[r] as number[])[c]!) > Math.abs((A[p] as number[])[c]!)) p = r;
    const t = A[c] as number[];
    A[c] = A[p] as number[];
    A[p] = t;
    const d = (A[c] as number[])[c]!;
    for (let j = c; j <= k; j += 1) (A[c] as number[])[j] = (A[c] as number[])[j]! / d;
    for (let r = 0; r < k; r += 1) {
      if (r === c) continue;
      const f = (A[r] as number[])[c]!;
      if (f === 0) continue;
      for (let j = c; j <= k; j += 1) (A[r] as number[])[j] = (A[r] as number[])[j]! - f * (A[c] as number[])[j]!;
    }
  }
  return A.map((r) => r[k] as number);
}

/**
 * Rapport de médianes entre deux groupes « à caractéristiques comparables » : appariement exact sur
 * une clé de strate, puis moyenne pondérée (par le plus petit effectif de la strate) des log-ratios.
 * C'est l'opérationalisation littérale de « médiane de A / médiane de B à … comparables ».
 */
export function stratifiedMedianRatio<T>(
  items: readonly T[],
  stratum: (t: T) => string | undefined,
  group: (t: T) => 'A' | 'B' | undefined,
  value: (t: T) => number | undefined,
  minPerSide: number,
): { ratio: number; strata: number; weight: number } {
  const acc = new Map<string, { a: number[]; b: number[] }>();
  for (const it of items) {
    const k = stratum(it);
    const g = group(it);
    const v = value(it);
    if (k === undefined || g === undefined || v === undefined) continue;
    let e = acc.get(k);
    if (!e) {
      e = { a: [], b: [] };
      acc.set(k, e);
    }
    (g === 'A' ? e.a : e.b).push(v);
  }
  let sum = 0;
  let weight = 0;
  let strata = 0;
  for (const e of acc.values()) {
    if (e.a.length < minPerSide || e.b.length < minPerSide) continue;
    const w = Math.min(e.a.length, e.b.length);
    sum += Math.log(median(e.a) / median(e.b)) * w;
    weight += w;
    strata += 1;
  }
  return { ratio: Math.exp(sum / weight), strata, weight };
}
