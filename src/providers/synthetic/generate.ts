/**
 * KYCAR — Générateur de dataset synthétique plausible (lot D3, EX-DATA-107)
 * =================================================================================================
 * Produit un `ListingColumnBatch` de distributions CRÉDIBLES par marque/modèle/année :
 *   - prix corrélé à l'année, au kilométrage et à la puissance (dépréciation ~13 %/an) ;
 *   - kilométrage croissant avec l'âge (≈ 14 000 km/an, bruité) ;
 *   - mix carburant/carrosserie/transmission réaliste, adossé aux vocabulaires réels (D2) ;
 *   - taxonomie réelle (`taxonomy.json` : 295 marques / 4 955 modèles) via le `ReferenceData` de D2.
 *
 * DÉTERMINISME (critère de succès) : toute source d'aléa est le `Prng` à graine fixée ; l'ordre de
 * parcours est fixe ; deux générations à même graine et même référentiel sont identiques octet à
 * octet (colonnes ET zone de chaînes).
 *
 * OUTLIERS INJECTÉS (matière des tests D4) : une fraction déterministe des annonces à prix affiché
 * reçoit un prix aberrant pour son année/km. La VÉRITÉ TERRAIN (`InjectedOutlier[]`) est émise pour
 * que D4 vérifie sa détection M1/M2/M3.
 *
 * SYNTHETIC (EX-DATA-107) : `sourceKind` est propagé par le provider ; ce module ne produit que des
 * données étiquetables comme synthétiques (aucune prétention à l'exactitude d'un marché réel).
 */

import type { ReferenceData } from '../../types/reference';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN } from '../../types/sentinels';
import type { ListingColumnBatch } from '../DataProvider';
import {
  AD_TIER_WEIGHTS,
  BODY_WEIGHTS,
  buildDist,
  codeIndex,
  COLOR_WEIGHTS,
  DRIVETRAIN_WEIGHTS,
  FUEL_WEIGHTS,
  REGION_WEIGHTS,
  SELLER_WEIGHTS,
  TRANSMISSION_WEIGHTS,
  UPHOLSTERY_WEIGHTS,
  type WeightedDist,
} from './catalog';
import { ColumnarBuilder, type EncodedRow } from './columnar';
import { combineKeys, hashToUnit, Prng } from './prng';

/** Année de capture de référence (fige la fenêtre d'âges ; déterministe). */
export const CURRENT_YEAR = 2026;
/** Graine par défaut (« KYCA » en ASCII), cf. ARCHITECTURE §4.2. */
export const DEFAULT_SEED = 0x4b594341;
/** Effectif cible par défaut (EX-NFR-1). */
export const DEFAULT_LISTING_COUNT = 100_000;

/** Codes `KYCAR_OUTLIER_FLAG` posés à l'injection (vérité terrain). */
export type OutlierFlag = 'M1_LOW' | 'M1_HIGH' | 'M2_LOW' | 'M2_HIGH';

/** Une annonce dont le prix a été volontairement rendu aberrant — vérité terrain pour D4. */
export interface InjectedOutlier {
  /** Indice de ligne dans le lot complet (`localDatasetKey === 'FULL'`). */
  readonly rowIndex: number;
  /** UUID canonique 8-4-4-4-12 de l'annonce (miroir de `listingId`). */
  readonly listingId: string;
  readonly makeId: number;
  readonly modelId: number;
  /** Méthode que l'outlier est censé déclencher (`M1` = absolu, `M2` = relatif à la cellule). */
  readonly method: 'M1' | 'M2';
  readonly flag: OutlierFlag;
  /** Prix plausible calculé avant injection (le « juste prix » du modèle synthétique). */
  readonly fairPriceEur: number;
  /** Prix aberrant effectivement stocké dans la colonne `priceEur`. */
  readonly injectedPriceEur: number;
}

/** Sortie du générateur : le lot colonnaire complet et la vérité terrain des outliers. */
export interface GeneratedDataset {
  readonly batch: ListingColumnBatch;
  readonly outliers: readonly InjectedOutlier[];
  readonly quotedCount: number;
  readonly onRequestCount: number;
  readonly missingCount: number;
}

/** Paramètres de génération. */
export interface GenerateOptions {
  readonly referenceData: ReferenceData;
  readonly seed?: number;
  readonly listingCount?: number;
  readonly snapshotId: string;
  /** Fraction des annonces à prix affiché rendues aberrantes (défaut 0,6 %). */
  readonly outlierRate?: number;
}

const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x);
const round50 = (x: number): number => Math.round(x / 50) * 50;

/* ---- Index de tirage de la taxonomie ---------------------------------------------------------- */

interface MakeEntry {
  readonly makeId: number;
  readonly slug: string;
  readonly modelIds: number[];
  readonly modelSlugs: string[];
  readonly modelCumulative: number[];
}

interface TaxonomyIndex {
  readonly makeEntries: MakeEntry[];
  readonly makeCumulative: number[];
}

function buildTaxonomyIndex(ref: ReferenceData): TaxonomyIndex {
  const makeEntries: MakeEntry[] = [];
  const makeCumulative: number[] = [];
  let acc = 0;
  for (const make of ref.makes) {
    const models = ref.modelsByMake.get(make.makeId) ?? [];
    const modelIds: number[] = [];
    const modelSlugs: string[] = [];
    const modelCumulative: number[] = [];
    let mAcc = 0;
    for (const model of models) {
      const w = 0.3 + hashToUnit(combineKeys(make.makeId, model.modelId + 1));
      mAcc += w;
      modelIds.push(model.modelId);
      modelSlugs.push(model.slug);
      modelCumulative.push(mAcc);
    }
    // Popularité de marque : corrélée à la richesse du catalogue et à un aléa stable.
    const makeWeight = (1 + models.length) * (0.4 + hashToUnit(make.makeId) * 1.2);
    acc += makeWeight;
    makeEntries.push({ makeId: make.makeId, slug: make.slug, modelIds, modelSlugs, modelCumulative });
    makeCumulative.push(acc);
  }
  return { makeEntries, makeCumulative };
}

/* ---- Distributions énumérées préconstruites --------------------------------------------------- */

interface Dists {
  fuel: WeightedDist;
  body: WeightedDist;
  transmission: WeightedDist;
  drivetrain: WeightedDist;
  color: WeightedDist;
  upholstery: WeightedDist;
  seller: WeightedDist;
  region: WeightedDist;
  adTier: WeightedDist;
  transmissionAutoIndex: number;
  countryIndex: number;
  usageN: number;
  usageU: number;
  usageA: number;
  offerN: number;
  offerD: number;
  offerS: number;
  offerJ: number;
  offerU: number;
  priceEval: Record<string, number>;
}

function requireIndex(ref: ReferenceData, voc: Parameters<typeof codeIndex>[1], code: string): number {
  const i = codeIndex(ref, voc, code);
  if (i === null) throw new Error(`generate: code ${code} absent de ${voc}`);
  return i;
}

function buildDists(ref: ReferenceData): Dists {
  const priceEval: Record<string, number> = {};
  for (const c of ['0', '1', '2', '3', '4', '5']) {
    priceEval[c] = requireIndex(ref, 'KYCAR_PRICE_EVALUATION', c);
  }
  return {
    fuel: buildDist(ref, 'KYCAR_FUEL_CATEGORY', FUEL_WEIGHTS),
    body: buildDist(ref, 'KYCAR_BODY_TYPE', BODY_WEIGHTS),
    transmission: buildDist(ref, 'KYCAR_TRANSMISSION', TRANSMISSION_WEIGHTS),
    drivetrain: buildDist(ref, 'KYCAR_DRIVETRAIN', DRIVETRAIN_WEIGHTS),
    color: buildDist(ref, 'KYCAR_BODY_COLOR', COLOR_WEIGHTS),
    upholstery: buildDist(ref, 'KYCAR_UPHOLSTERY_TYPE', UPHOLSTERY_WEIGHTS),
    seller: buildDist(ref, 'KYCAR_SELLER_TYPE', SELLER_WEIGHTS),
    region: buildDist(ref, 'KYCAR_REGION', REGION_WEIGHTS),
    adTier: buildDist(ref, 'KYCAR_AD_TIER', AD_TIER_WEIGHTS),
    transmissionAutoIndex: requireIndex(ref, 'KYCAR_TRANSMISSION', 'A'),
    countryIndex: requireIndex(ref, 'KYCAR_MARKETPLACE', 'be'),
    usageN: requireIndex(ref, 'KYCAR_USAGE_STATE', 'N'),
    usageU: requireIndex(ref, 'KYCAR_USAGE_STATE', 'U'),
    usageA: requireIndex(ref, 'KYCAR_USAGE_STATE', 'A'),
    offerN: requireIndex(ref, 'KYCAR_OFFER_TYPE', 'N'),
    offerD: requireIndex(ref, 'KYCAR_OFFER_TYPE', 'D'),
    offerS: requireIndex(ref, 'KYCAR_OFFER_TYPE', 'S'),
    offerJ: requireIndex(ref, 'KYCAR_OFFER_TYPE', 'J'),
    offerU: requireIndex(ref, 'KYCAR_OFFER_TYPE', 'U'),
    priceEval,
  };
}

/* ---- Fenêtre d'âges --------------------------------------------------------------------------- */

/** Poids par âge (0..31 ans) : parc réaliste, décroissant, léger creux sur le neuf. */
const AGE_WEIGHTS: readonly number[] = [
  6, 9, 10, 10, 9, 8, 7, 6, 5, 4.2, 4, 3.4, 3, 2.6, 2.2, 2, 1.6, 1.3, 1.1, 0.9, 0.7, 0.55, 0.45, 0.36,
  0.3, 0.24, 0.2, 0.16, 0.13, 0.1, 0.08, 0.06,
];
const AGE_CUMULATIVE: readonly number[] = (() => {
  const c: number[] = [];
  let a = 0;
  for (const w of AGE_WEIGHTS) {
    a += w;
    c.push(a);
  }
  return c;
})();

/* ---- Encodage d'un UUID ----------------------------------------------------------------------- */

const HEX: readonly string[] = Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, '0'));

function fillUuid(prng: Prng, out: Uint8Array): void {
  for (let b = 0; b < 16; b += 4) {
    const word = prng.nextUint32();
    out[b] = (word >>> 24) & 0xff;
    out[b + 1] = (word >>> 16) & 0xff;
    out[b + 2] = (word >>> 8) & 0xff;
    out[b + 3] = word & 0xff;
  }
  out[6] = (0x40 | (out[6] as number) & 0x0f) & 0xff; // version 4
  out[8] = (0x80 | (out[8] as number) & 0x3f) & 0xff; // variant
}

/** Décode 16 octets en UUID canonique 8-4-4-4-12. */
export function uuidToHex(bytes: Uint8Array, offset = 0): string {
  const h = (i: number): string => HEX[bytes[offset + i] as number] as string;
  return (
    `${h(0)}${h(1)}${h(2)}${h(3)}-${h(4)}${h(5)}-${h(6)}${h(7)}-${h(8)}${h(9)}-` +
    `${h(10)}${h(11)}${h(12)}${h(13)}${h(14)}${h(15)}`
  );
}

/* ---- Génération ------------------------------------------------------------------------------- */

const FUEL_BADGE: Readonly<Record<string, string>> = {
  B: 'TSI',
  D: 'TDI',
  '2': 'PHEV',
  '3': 'PHEV',
  L: 'LPG',
  C: 'CNG',
  M: 'E85',
  H: 'FCEV',
  O: '',
  E: '',
};
const TRIM_WORDS: readonly string[] = ['Sport', 'Style', 'Comfort', 'GT', 'Business', 'Edition', 'Elegance'];

/** Génère le dataset complet et la vérité terrain des outliers. */
export function generateDataset(options: GenerateOptions): GeneratedDataset {
  const ref = options.referenceData;
  const seed = options.seed ?? DEFAULT_SEED;
  const count = options.listingCount ?? DEFAULT_LISTING_COUNT;
  const outlierRate = options.outlierRate ?? 0.006;

  const taxonomy = buildTaxonomyIndex(ref);
  const dists = buildDists(ref);
  const prng = new Prng(seed);
  const builder = new ColumnarBuilder(count);

  const quotedRows: number[] = [];
  const quotedFair: number[] = [];
  const makeIdByRow = new Int32Array(count);
  const modelIdByRow = new Int32Array(count);
  const uuidBytes = new Uint8Array(count * 16);

  let quotedCount = 0;
  let onRequestCount = 0;
  let missingCount = 0;

  const uuid = new Uint8Array(16);

  for (let i = 0; i < count; i += 1) {
    // --- Marque / modèle ---
    const makeIdx = prng.pickCumulative(taxonomy.makeCumulative);
    const makeEntry = taxonomy.makeEntries[makeIdx] as MakeEntry;
    const makeId = makeEntry.makeId;
    let modelId = 0;
    let modelSlug = 'modele';
    if (makeEntry.modelIds.length > 0) {
      const mIdx = prng.pickCumulative(makeEntry.modelCumulative);
      modelId = makeEntry.modelIds[mIdx] as number;
      modelSlug = makeEntry.modelSlugs[mIdx] as string;
    }
    makeIdByRow[i] = makeId;
    modelIdByRow[i] = modelId;

    // --- Âge / année ---
    const age = prng.pickCumulative(AGE_CUMULATIVE);
    const modelYear = clamp(CURRENT_YEAR - age, 1994, CURRENT_YEAR);

    // --- État / type d'offre corrélés à l'âge ---
    let usageState: number;
    let offerType: number;
    if (age === 0) {
      usageState = dists.usageN;
      const r = prng.nextFloat();
      offerType = r < 0.5 ? dists.offerN : r < 0.8 ? dists.offerD : dists.offerS;
    } else if (age <= 2) {
      usageState = prng.nextBool(0.03) ? dists.usageA : dists.usageU;
      const r = prng.nextFloat();
      offerType = r < 0.5 ? dists.offerU : r < 0.9 ? dists.offerJ : dists.offerD;
    } else {
      usageState = prng.nextBool(0.02) ? dists.usageA : dists.usageU;
      offerType = prng.nextBool(0.95) ? dists.offerU : dists.offerJ;
    }

    // --- Carburant / carrosserie / transmission / transmission ---
    const fuelPos = prng.pickCumulative(dists.fuel.cumulative);
    const fuelCategory = dists.fuel.indices[fuelPos] as number;
    const fuelCode = dists.fuel.codeByIndex.get(fuelCategory) as string;
    const isBev = fuelCode === 'E' || fuelCode === 'H';
    const isPhev = fuelCode === '2' || fuelCode === '3';

    const bodyPos = prng.pickCumulative(dists.body.cumulative);
    const bodyType = dists.body.indices[bodyPos] as number;
    const bodyCode = dists.body.codeByIndex.get(bodyType) as string;

    let transmission: number;
    if (isBev) transmission = dists.transmissionAutoIndex;
    else if (isPhev) transmission = prng.nextBool(0.85) ? dists.transmissionAutoIndex : (dists.transmission.indices[prng.pickCumulative(dists.transmission.cumulative)] as number);
    else transmission = dists.transmission.indices[prng.pickCumulative(dists.transmission.cumulative)] as number;

    const drivetrain = dists.drivetrain.indices[prng.pickCumulative(dists.drivetrain.cumulative)] as number;

    // --- Paramètres stables marque/modèle ---
    const brandMul = 0.7 + hashToUnit(makeId) * 1.6;
    const segment = 0.6 + hashToUnit(combineKeys(makeId, modelId + 7)) * 1.7;
    const baseNew = clamp(Math.round(9000 * brandMul * segment), 6000, 240000);

    // --- Puissance ---
    let powerKw = Math.round(45 + segment * brandMul * 70 + prng.nextGaussian() * 18);
    if (isBev) powerKw = Math.round(powerKw * 1.15);
    powerKw = clamp(powerKw, 40, 480);

    // --- Kilométrage ---
    let mileageKm: number;
    let previousOwnerCount: number;
    if (age === 0 && usageState === dists.usageN) {
      mileageKm = prng.nextInt(0, 60);
      previousOwnerCount = 0;
    } else {
      const annual = clamp(14000 + prng.nextGaussian() * 3500, 4000, 35000);
      mileageKm = clamp(Math.round((age * annual) * Math.exp(prng.nextGaussian() * 0.15)), 0, 400000);
      mileageKm = Math.round(mileageKm / 100) * 100;
      previousOwnerCount = clamp(Math.round(age / 4 + prng.nextGaussian() * 0.6), 0, 6);
    }

    // --- Prix plausible ---
    const ageFactor = Math.max(0.06, Math.pow(0.87, age));
    const expectedKm = age * 14000;
    const kmFactor = clamp(1 - (mileageKm - expectedKm) / 280000, 0.55, 1.25);
    const fuelFactor = isPhev ? 1.12 : isBev ? 1.1 : fuelCode === 'D' ? 1.02 : fuelCode === 'O' ? 0.95 : 1.0;
    const powerFactor = clamp(0.8 + (powerKw - 100) / 500, 0.7, 1.8);
    const noise = Math.exp(prng.nextGaussian() * 0.11);
    const fairPrice = clamp(round50(baseNew * ageFactor * kmFactor * fuelFactor * powerFactor * noise), 500, 300_000);

    // --- Statut de prix ---
    const psDraw = prng.nextFloat();
    let priceStatus: number;
    let priceEur: number;
    let priceEvaluationCategory: number;
    const psQuoted = requireIndex(ref, 'KYCAR_PRICE_STATUS', 'QUOTED');
    const psOnReq = requireIndex(ref, 'KYCAR_PRICE_STATUS', 'ON_REQUEST');
    const psMissing = requireIndex(ref, 'KYCAR_PRICE_STATUS', 'MISSING');
    if (psDraw < 0.94) {
      priceStatus = psQuoted;
      priceEur = fairPrice;
      // Évaluation externe (M3) dérivée d'un petit bruit relatif.
      const evalNoise = prng.nextGaussian() * 0.06;
      priceEvaluationCategory =
        evalNoise < -0.08 ? (dists.priceEval['1'] as number)
        : evalNoise < -0.03 ? (dists.priceEval['2'] as number)
        : evalNoise < 0.03 ? (dists.priceEval['3'] as number)
        : evalNoise < 0.08 ? (dists.priceEval['4'] as number)
        : (dists.priceEval['5'] as number);
      quotedRows.push(i);
      quotedFair.push(fairPrice);
      quotedCount += 1;
    } else if (psDraw < 0.98) {
      priceStatus = psOnReq;
      priceEur = NUMERIC_UNKNOWN;
      priceEvaluationCategory = dists.priceEval['0'] as number;
      onRequestCount += 1;
    } else {
      priceStatus = psMissing;
      priceEur = NUMERIC_UNKNOWN;
      priceEvaluationCategory = dists.priceEval['0'] as number;
      missingCount += 1;
    }

    // --- Émissions / consommation / autonomie selon carburant ---
    let co2X10: number;
    let consX10: number;
    let electricRangeKm: number;
    if (isBev) {
      co2X10 = 0;
      consX10 = NUMERIC_UNKNOWN;
      electricRangeKm = fuelCode === 'E' ? prng.nextInt(180, 560) : prng.nextInt(400, 700);
    } else if (isPhev) {
      const co2 = clamp(Math.round(powerKw * 0.15 + 25 + prng.nextGaussian() * 6), 10, 90);
      co2X10 = co2 * 10;
      consX10 = clamp(Math.round((co2 / 23.5) * 10), 8, 60);
      electricRangeKm = prng.nextInt(30, 90);
    } else {
      const base = fuelCode === 'D' ? powerKw * 0.55 + 95 : powerKw * 0.65 + 110;
      const co2 = clamp(Math.round(base + prng.nextGaussian() * 9), 30, 400);
      co2X10 = co2 * 10;
      consX10 = clamp(Math.round((co2 / 23.5) * 10), 30, 150);
      electricRangeKm = NUMERIC_UNKNOWN;
    }

    // --- Norme d'émission selon l'année ---
    const euCode =
      modelYear <= 1996 ? '1'
      : modelYear <= 2000 ? '2'
      : modelYear <= 2005 ? '3'
      : modelYear <= 2010 ? '4'
      : modelYear <= 2014 ? '5'
      : modelYear <= 2017 ? '6'
      : modelYear === 2018 ? '9'
      : modelYear === 2019 ? '7'
      : modelYear <= 2021 ? '8'
      : modelYear <= 2023 ? '11'
      : '10';
    const euIdx = codeIndex(ref, 'KYCAR_EU_EMISSION_STANDARD', euCode);
    const euEmissionStandard = euIdx === null ? ENUM_UNKNOWN_BYTE : euIdx;

    // --- Portes / places selon carrosserie ---
    let doorCount: number;
    let seatCount: number;
    if (bodyCode === '2' || bodyCode === '3') {
      doorCount = prng.nextBool(0.6) ? 2 : 3;
      seatCount = prng.nextBool(0.7) ? 4 : 5;
    } else if (bodyCode === '1') {
      doorCount = prng.nextBool(0.6) ? 5 : 3;
      seatCount = 5;
    } else if (bodyCode === '12') {
      doorCount = 5;
      seatCount = prng.nextBool(0.6) ? 7 : 5;
    } else if (bodyCode === '13') {
      doorCount = prng.nextBool(0.5) ? 4 : 5;
      seatCount = prng.nextBool(0.5) ? 3 : 5;
    } else {
      doorCount = prng.nextBool(0.75) ? 5 : 4;
      seatCount = 5;
    }

    const imageCount = clamp(Math.round(14 + prng.nextGaussian() * 6), 0, 40);

    // --- Vendeur / palier pub / couleurs / région ---
    const sellerType = dists.seller.indices[prng.pickCumulative(dists.seller.cumulative)] as number;
    const sellerCode = dists.seller.codeByIndex.get(sellerType) as string;
    const adTier =
      sellerCode === 'P' && prng.nextBool(0.92)
        ? (dists.adTier.indexByCode.get('NONE') as number)
        : (dists.adTier.indices[prng.pickCumulative(dists.adTier.cumulative)] as number);
    const bodyColor = dists.color.indices[prng.pickCumulative(dists.color.cumulative)] as number;
    const upholsteryType = dists.upholstery.indices[prng.pickCumulative(dists.upholstery.cumulative)] as number;
    const regionCode = dists.region.indices[prng.pickCumulative(dists.region.cumulative)] as number;

    // --- Immatriculation ---
    const regMonth = age === 0 ? prng.nextInt(0, 8) : prng.nextInt(0, 11);
    const firstRegistrationYearMonth = 12 * modelYear + regMonth;

    // --- Drapeaux (O13 : ≤ 16 bits, Uint16) ---
    let ingestFlags = 0;
    if (mileageKm === 0 && usageState !== dists.usageN) ingestFlags |= 1 << 8; // SUSPECT_ZERO_MILEAGE (bit 8)
    const booleanFlags = 0; // sémantique réservée à un lot ultérieur (aucun contrat D2) — laissé nul.

    // --- Chaînes ---
    fillUuid(prng, uuid);
    uuidBytes.set(uuid, i * 16);
    const listingUrl = `https://www.autoscout24.be/fr/annonce/${makeEntry.slug}-${modelSlug}/${i}`;
    const disp = clamp(Math.round((0.9 + segment * 1.1) * 10) / 10, 1.0, 5.0);
    const badge = FUEL_BADGE[fuelCode] ?? '';
    const modelVersionRaw = isBev ? `${powerKw} kW` : badge ? `${disp.toFixed(1)} ${badge}` : disp.toFixed(1);
    const modelVersionClean = isBev ? `${powerKw}kW` : disp.toFixed(1);
    const fuelSourceLabelRaw = ref.decodeEnum('KYCAR_FUEL_CATEGORY', fuelCode) ?? fuelCode;
    const trimTokens =
      prng.nextBool(0.45)
        ? TRIM_WORDS[Math.floor(hashToUnit(combineKeys(i, modelId)) * TRIM_WORDS.length)] ?? ''
        : '';

    const row: EncodedRow = {
      listingId: uuid,
      priceEur,
      mileageKm,
      firstRegistrationYearMonth,
      modelId,
      makeId,
      modelYear,
      powerKw,
      co2EmissionsGPerKmX10: co2X10,
      consumptionCombinedL100KmX10: consX10,
      electricRangeKm,
      fuelCategory,
      bodyType,
      transmission,
      drivetrain,
      offerType,
      usageState,
      sellerType,
      regionCode,
      countryCode: dists.countryIndex,
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
      strings: [listingUrl, modelVersionRaw, modelVersionClean, fuelSourceLabelRaw, trimTokens],
    };
    builder.setRow(i, row);
  }

  const batch = builder.finalize(options.snapshotId, 'FULL');
  const outliers = injectOutliers(batch, quotedRows, quotedFair, makeIdByRow, modelIdByRow, seed, outlierRate, dists);

  return { batch, outliers, quotedCount, onRequestCount, missingCount };
}

/**
 * Rend aberrant le prix d'une fraction déterministe des annonces à prix affiché, et émet la vérité
 * terrain. L'échantillon est réparti régulièrement sur les annonces cotées (couverture large des
 * marques). Les colonnes `priceEur` et `priceEvaluationCategory` du lot sont modifiées en place.
 */
function injectOutliers(
  batch: ListingColumnBatch,
  quotedRows: readonly number[],
  quotedFair: readonly number[],
  makeIdByRow: Int32Array,
  modelIdByRow: Int32Array,
  seed: number,
  rate: number,
  dists: Dists,
): InjectedOutlier[] {
  const price = batch.priceEur as unknown as Int32Array;
  const evalCol = batch.priceEvaluationCategory as unknown as Uint8Array;
  const quotedCount = quotedRows.length;
  const target = Math.max(0, Math.round(quotedCount * rate));
  if (target === 0 || quotedCount === 0) return [];
  const stride = Math.max(1, Math.floor(quotedCount / target));
  const prng = new Prng((seed ^ 0x0c1a5d3f) >>> 0);
  const flags: readonly OutlierFlag[] = ['M1_HIGH', 'M1_LOW', 'M2_HIGH', 'M2_LOW'];
  const evalHigh = dists.priceEval['5'] as number;
  const evalLow = dists.priceEval['1'] as number;

  const out: InjectedOutlier[] = [];
  let k = 0;
  for (let q = 0; q < quotedCount && out.length < target; q += stride) {
    const rowIndex = quotedRows[q] as number;
    const fair = quotedFair[q] as number;
    const flag = flags[k % flags.length] as OutlierFlag;
    k += 1;
    let injected: number;
    switch (flag) {
      // M1 = anomalie ABSOLUE (prix absurde dans l'absolu, indépendant de la cellule) : au-delà de
      // toute fourchette de marché normale (500..300 000 €) — un simple garde global la repère.
      case 'M1_HIGH':
        injected = clamp(round50(prng.nextRange(500_000, 3_000_000)), 500, 4_999_950);
        break;
      case 'M1_LOW':
        injected = clamp(round50(prng.nextRange(50, 400)), 50, 450);
        break;
      // M2 = anomalie RELATIVE à la cellule (juste prix année/km/modèle) : un facteur marqué autour du
      // juste prix, plausible dans l'absolu — c'est le modèle attendu (M2) qui la démasque.
      case 'M2_HIGH':
        injected = clamp(round50(fair * prng.nextRange(3.5, 5.0)), 500, 400_000);
        break;
      case 'M2_LOW':
      default:
        injected = clamp(round50(fair * prng.nextRange(0.14, 0.24)), 300, 300_000);
        break;
    }
    // Garantit une vraie aberration même après bornage (sinon on saute).
    if (injected === fair) continue;
    price[rowIndex] = injected;
    evalCol[rowIndex] = flag.endsWith('HIGH') ? evalHigh : evalLow;
    out.push({
      rowIndex,
      listingId: uuidToHex(batch.listingId, rowIndex * 16),
      makeId: makeIdByRow[rowIndex] as number,
      modelId: modelIdByRow[rowIndex] as number,
      method: flag.startsWith('M1') ? 'M1' : 'M2',
      flag,
      fairPriceEur: fair,
      injectedPriceEur: injected,
    });
  }
  return out;
}
