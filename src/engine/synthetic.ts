/**
 * KYCAR — Générateur de dataset synthétique de test (lot D4)
 * =================================================================================================
 * D4 est développé dans un worktree isolé, en parallèle de D3 (le vrai `SyntheticDataProvider` et
 * son dataset 100k). D4 ne peut donc PAS dépendre du dataset de D3 : ce module fabrique un petit
 * `ListingColumnBatch` colonnaire, déterministe (PRNG à graine), avec des OUTLIERS INJECTÉS dont on
 * connaît les identifiants de ligne — de quoi vérifier la détection M1/M2 et les invariants I1–I8
 * sans attendre l'intégration. La jonction avec le vrai dataset de D3 est faite par le coordinateur.
 *
 * Ce module est PUR (aucune globale DOM ni WebWorker) : il est importable par le worker comme par le
 * thread principal (bancs de perf).
 *
 * Le modèle de prix est volontairement simple et « propre » : prix ≈ base(modèle) · f(année) ·
 * g(kilométrage) · bruit multiplicatif resserré. Les clusters (marque, modèle) sont peuplés de
 * plusieurs centaines de lignes pour que les bornes de Tukey (M1) et la régression robuste (M2)
 * soient stables. Les outliers injectés s'écartent d'un facteur extrême (×0,2 et ×5) : ils sont
 * détectables par toute borne raisonnable, ce qui rend le test robuste au réglage fin des seuils.
 */

import type { ListingColumnBatch } from '../types/index';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN } from '../types/index';
import { decodeListingId } from './uuid';

/** PRNG déterministe mulberry32 : reproductible d'un run à l'autre (bancs et tests stables). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Un modèle du catalogue synthétique : marque, modèle, prix de base et caractéristiques centrales. */
interface SyntheticModelSpec {
  readonly makeId: number;
  readonly modelId: number;
  /** Prix de base (année récente, faible kilométrage) en euros. */
  readonly basePriceEur: number;
  readonly fuelCategory: number;
  readonly bodyType: number;
  readonly powerKw: number;
}

/**
 * Catalogue synthétique : 6 modèles répartis sur 3 marques, gammes de prix distinctes. Les codes
 * énumérés sont de simples octets dans `[0, 254]` (le décodage réel est du ressort du référentiel).
 */
const CATALOG: readonly SyntheticModelSpec[] = [
  { makeId: 1, modelId: 101, basePriceEur: 18000, fuelCategory: 0, bodyType: 0, powerKw: 66 },
  { makeId: 1, modelId: 102, basePriceEur: 32000, fuelCategory: 1, bodyType: 1, powerKw: 110 },
  { makeId: 2, modelId: 201, basePriceEur: 24000, fuelCategory: 0, bodyType: 0, powerKw: 85 },
  { makeId: 2, modelId: 202, basePriceEur: 46000, fuelCategory: 2, bodyType: 2, powerKw: 150 },
  { makeId: 3, modelId: 301, basePriceEur: 12000, fuelCategory: 0, bodyType: 0, powerKw: 51 },
  { makeId: 3, modelId: 302, basePriceEur: 58000, fuelCategory: 3, bodyType: 3, powerKw: 230 },
];

/** Options du générateur. */
export interface SyntheticOptions {
  /** Nombre de lignes à produire. */
  readonly rowCount: number;
  /** Graine du PRNG (déterminisme). */
  readonly seed?: number;
  /**
   * Nombre d'outliers de prix BAS à injecter (prix ≈ ×0,2 du prix « propre »). Par défaut, ~0,3 %.
   */
  readonly lowOutliers?: number;
  /** Nombre d'outliers de prix HAUT à injecter (prix ≈ ×5). Par défaut, ~0,3 %. */
  readonly highOutliers?: number;
  /** Proportion d'annonces à prix « sur demande » (priceStatus ON_REQUEST, prix inconnu). */
  readonly onRequestRate?: number;
  /** Proportion d'annonces à prix absent (priceStatus MISSING). */
  readonly priceMissingRate?: number;
  /** Année civile de référence (immatriculations réparties sur les 12 années précédentes). */
  readonly referenceYear?: number;
  readonly snapshotId?: string;
  readonly localDatasetKey?: string;
}

/** Résultat du générateur : le batch et la vérité-terrain des outliers injectés. */
export interface SyntheticDataset {
  readonly batch: ListingColumnBatch;
  /** Indices de ligne des outliers de prix bas injectés. */
  readonly injectedLowRows: ReadonlySet<number>;
  /** Indices de ligne des outliers de prix haut injectés. */
  readonly injectedHighRows: ReadonlySet<number>;
  /** Identifiants (UUID canonique) des outliers bas, alignés sur `injectedLowRows`. */
  readonly injectedLowIds: readonly string[];
  readonly injectedHighIds: readonly string[];
  /** Décode l'UUID canonique 8-4-4-4-12 de la ligne `row` (pour recouper avec les verdicts). */
  decodeListingId(row: number): string;
}

const PRICE_STATUS_QUOTED = 0; // ordre PRICE_STATUS_VALUES : QUOTED, ON_REQUEST, MISSING
const PRICE_STATUS_ON_REQUEST = 1;
const PRICE_STATUS_MISSING = 2;

/** Écrit 16 octets d'UUID déterministes pour la ligne `row`. */
function writeListingId(target: Uint8Array, row: number, rng: () => number): void {
  const base = row * 16;
  for (let i = 0; i < 16; i++) {
    target[base + i] = Math.floor(rng() * 256) & 0xff;
  }
  // Marque la version 4 / variante RFC 4122 pour un UUID plausible (non contraignant ici).
  target[base + 6] = ((target[base + 6] ?? 0) & 0x0f) | 0x40;
  target[base + 8] = ((target[base + 8] ?? 0) & 0x3f) | 0x80;
}

/**
 * Génère un dataset synthétique colonnaire déterministe avec outliers injectés.
 */
export function generateSyntheticDataset(options: SyntheticOptions): SyntheticDataset {
  const n = options.rowCount;
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(`generateSyntheticDataset: rowCount ${n} invalide`);
  }
  const rng = mulberry32(options.seed ?? 0x9e3779b9);
  const referenceYear = options.referenceYear ?? 2025;
  const onRequestRate = options.onRequestRate ?? 0.03;
  const priceMissingRate = options.priceMissingRate ?? 0.01;
  const lowCount = options.lowOutliers ?? Math.max(3, Math.round(n * 0.003));
  const highCount = options.highOutliers ?? Math.max(3, Math.round(n * 0.003));

  // Colonnes numériques du chemin chaud.
  const listingId = new Uint8Array(n * 16);
  const priceEur = new Int32Array(n);
  const mileageKm = new Int32Array(n);
  const firstRegistrationYearMonth = new Int32Array(n);
  const modelId = new Int32Array(n);
  const makeId = new Int16Array(n);
  const modelYear = new Int16Array(n);
  const powerKw = new Int16Array(n);
  const co2EmissionsGPerKmX10 = new Int16Array(n);
  const consumptionCombinedL100KmX10 = new Int16Array(n);
  const electricRangeKm = new Int16Array(n);

  // Colonnes énumérées (octet). Celles non modélisées reçoivent la sentinelle 255 (INCONNU) ou 0.
  const fuelCategory = new Uint8Array(n);
  const bodyType = new Uint8Array(n);
  const transmission = new Uint8Array(n);
  const drivetrain = new Uint8Array(n);
  const offerType = new Uint8Array(n);
  const usageState = new Uint8Array(n);
  const sellerType = new Uint8Array(n);
  const regionCode = new Uint8Array(n);
  const countryCode = new Uint8Array(n);
  const priceStatus = new Uint8Array(n);
  const priceEvaluationCategory = new Uint8Array(n);
  const adTier = new Uint8Array(n);
  const bodyColor = new Uint8Array(n);
  const upholsteryType = new Uint8Array(n);
  const euEmissionStandard = new Uint8Array(n);
  const doorCount = new Uint8Array(n);
  const seatCount = new Uint8Array(n);
  const previousOwnerCount = new Uint8Array(n);
  const imageCount = new Uint8Array(n);

  const booleanFlags = new Uint16Array(n);
  const ingestFlags = new Uint16Array(n);

  // Prix « propre » avant injection (sert de base aux outliers).
  const cleanPrice = new Int32Array(n);

  for (let i = 0; i < n; i++) {
    writeListingId(listingId, i, rng);

    const spec = CATALOG[i % CATALOG.length] as SyntheticModelSpec;
    makeId[i] = spec.makeId;
    modelId[i] = spec.modelId;
    fuelCategory[i] = spec.fuelCategory;
    bodyType[i] = spec.bodyType;
    powerKw[i] = spec.powerKw;

    // Année d'immatriculation sur 12 ans, mois uniforme.
    const ageYears = Math.floor(rng() * 12); // 0..11
    const year = referenceYear - ageYears;
    const month = 1 + Math.floor(rng() * 12); // 1..12
    modelYear[i] = year;
    firstRegistrationYearMonth[i] = 12 * year + (month - 1);

    // Kilométrage corrélé à l'âge, avec bruit.
    const km = Math.round((5000 + ageYears * 15000) * (0.7 + rng() * 0.6));
    mileageKm[i] = Math.max(0, km);

    // Prix propre : base · dépréciation annuelle · effet kilométrage · bruit resserré (±10 %).
    const yearFactor = Math.pow(0.90, ageYears);
    const mileageFactor = 1 - Math.min(0.4, km / 300000);
    const noise = 0.9 + rng() * 0.2;
    const clean = Math.max(500, Math.round(spec.basePriceEur * yearFactor * mileageFactor * noise));
    cleanPrice[i] = clean;

    // Consommations / CO2 plausibles (échelle ×10 pour une décimale).
    co2EmissionsGPerKmX10[i] = spec.fuelCategory === 2 ? 0 : Math.round((90 + rng() * 80) * 10);
    consumptionCombinedL100KmX10[i] = spec.fuelCategory === 2 ? 0 : Math.round((45 + rng() * 40));
    electricRangeKm[i] = spec.fuelCategory === 2 ? Math.round(300 + rng() * 200) : NUMERIC_UNKNOWN;

    // Enums de filtrage (classe R typiques).
    transmission[i] = rng() < 0.6 ? 0 : 1;
    drivetrain[i] = rng() < 0.7 ? 0 : 1;
    offerType[i] = 0;
    usageState[i] = rng() < 0.9 ? 2 : 1; // « état d'origine » majoritaire
    sellerType[i] = rng() < 0.7 ? 1 : 0; // pro majoritaire
    regionCode[i] = Math.floor(rng() * 11); // 11 régions BE
    countryCode[i] = 0; // 'be'
    adTier[i] = rng() < 0.5 ? 0 : 1 + Math.floor(rng() * 4);
    bodyColor[i] = Math.floor(rng() * 12);
    upholsteryType[i] = Math.floor(rng() * 4);
    euEmissionStandard[i] = 5 + Math.floor(rng() * 2);
    doorCount[i] = rng() < 0.6 ? 5 : 3;
    seatCount[i] = 5;
    previousOwnerCount[i] = Math.floor(rng() * 4);
    imageCount[i] = 5 + Math.floor(rng() * 20);

    // priceEvaluationCategory (référence externe M3) : corrélée au ratio prix/propre, posée plus bas.
    priceEvaluationCategory[i] = ENUM_UNKNOWN_BYTE;

    // Statut de prix : la majorité QUOTED, une part ON_REQUEST / MISSING (prix inconnu → -1).
    const r = rng();
    if (r < priceMissingRate) {
      priceStatus[i] = PRICE_STATUS_MISSING;
      priceEur[i] = NUMERIC_UNKNOWN;
    } else if (r < priceMissingRate + onRequestRate) {
      priceStatus[i] = PRICE_STATUS_ON_REQUEST;
      priceEur[i] = NUMERIC_UNKNOWN;
    } else {
      priceStatus[i] = PRICE_STATUS_QUOTED;
      priceEur[i] = clean;
    }
  }

  // --- Injection des outliers, uniquement sur des annonces à prix affiché (QUOTED) --------------
  const quotedRows: number[] = [];
  for (let i = 0; i < n; i++) if (priceStatus[i] === PRICE_STATUS_QUOTED) quotedRows.push(i);

  // Sélection déterministe et disjointe d'indices dans quotedRows.
  const chosen = new Set<number>();
  const pick = (): number => {
    for (let guard = 0; guard < quotedRows.length * 4; guard++) {
      const idx = Math.floor(rng() * quotedRows.length);
      const row = quotedRows[idx] as number;
      if (!chosen.has(row)) {
        chosen.add(row);
        return row;
      }
    }
    // Repli linéaire si le tirage sature.
    for (const row of quotedRows) if (!chosen.has(row)) { chosen.add(row); return row; }
    throw new Error('generateSyntheticDataset: pas assez de lignes QUOTED pour injecter les outliers');
  };

  const injectedLowRows = new Set<number>();
  const injectedHighRows = new Set<number>();
  for (let k = 0; k < lowCount; k++) {
    const row = pick();
    priceEur[row] = Math.max(300, Math.round((cleanPrice[row] as number) * 0.2));
    injectedLowRows.add(row);
  }
  for (let k = 0; k < highCount; k++) {
    const row = pick();
    priceEur[row] = Math.round((cleanPrice[row] as number) * 5);
    injectedHighRows.add(row);
  }

  // priceEvaluationCategory (M3) : posée d'après le ratio prix affiché / prix propre.
  for (let i = 0; i < n; i++) {
    if (priceStatus[i] !== PRICE_STATUS_QUOTED) continue;
    const ratio = (priceEur[i] as number) / (cleanPrice[i] as number);
    // 1 top .. 5 cher (0 inconnu). Les outliers bas → « offre top », hauts → « cher ».
    let cat: number;
    if (ratio < 0.5) cat = 1;
    else if (ratio < 0.9) cat = 2;
    else if (ratio < 1.1) cat = 3;
    else if (ratio < 1.5) cat = 4;
    else cat = 5;
    priceEvaluationCategory[i] = cat;
  }

  // Zone de chaînes : listingUrl minimal par ligne, les 4 autres champs vides.
  // STRINGS_PER_ROW = 5 ; offsets = prefix-sum de longueur n*5 + 1.
  const encoder = new TextEncoder();
  const urls: Uint8Array[] = [];
  let blobLen = 0;
  for (let i = 0; i < n; i++) {
    const u = encoder.encode(`https://synthetic.local/l/${i}`);
    urls.push(u);
    blobLen += u.length;
  }
  const stringBlob = new Uint8Array(blobLen);
  const stringOffsets = new Uint32Array(n * 5 + 1);
  let cursor = 0;
  for (let i = 0; i < n; i++) {
    const u = urls[i] as Uint8Array;
    const rowBase = i * 5;
    stringOffsets[rowBase] = cursor; // listingUrl début
    stringBlob.set(u, cursor);
    cursor += u.length;
    // Les 4 champs suivants sont vides : leurs bornes coïncident avec la fin de l'URL.
    stringOffsets[rowBase + 1] = cursor;
    stringOffsets[rowBase + 2] = cursor;
    stringOffsets[rowBase + 3] = cursor;
    stringOffsets[rowBase + 4] = cursor;
  }
  stringOffsets[n * 5] = cursor;

  const batch: ListingColumnBatch = {
    snapshotId: options.snapshotId ?? 'synthetic-d4',
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
    co2EmissionsGPerKmX10,
    consumptionCombinedL100KmX10,
    electricRangeKm,
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
    stringBlob,
    stringOffsets,
  };

  const injectedLowIds = [...injectedLowRows].map((row) => decodeListingId(listingId, row));
  const injectedHighIds = [...injectedHighRows].map((row) => decodeListingId(listingId, row));

  return {
    batch,
    injectedLowRows,
    injectedHighRows,
    injectedLowIds,
    injectedHighIds,
    decodeListingId: (row: number) => decodeListingId(listingId, row),
  };
}
