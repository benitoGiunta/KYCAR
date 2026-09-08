/**
 * KYCAR — Générateur de dataset synthétique plausible (lot D3, EX-DATA-107)
 * =================================================================================================
 * Produit un `ListingColumnBatch` de distributions CRÉDIBLES par marque/modèle/année :
 *   - prix corrélé à l'année, au kilométrage et à la puissance (dépréciation ~13 %/an) ;
 *   - kilométrage croissant avec l'âge (≈ 14 000 km/an, bruité) ;
 *   - mix carburant/carrosserie/transmission réaliste, adossé aux vocabulaires réels (D2) ;
 *   - taxonomie réelle (`taxonomy.json` : 295 marques / 4 955 modèles) via le `ReferenceData` de D2 ;
 *   - popularité CONCENTRÉE marque/modèle (`popularity.ts`, DR-038) : sans elle, aucune cellule
 *     d'homogénéité d'EX-DATA-86 n'est formable et M2 (EX-DATA-90, `|F| ≥ 30`) n'a pas de matière.
 *
 * DEUX PHASES (DR-049, ARCHITECTURE §9.3 garde-fous 1 et 2) :
 *   1. `generateCore` — écrit DIRECTEMENT les colonnes numériques et énumérées, les identifiants et
 *      les drapeaux d'ingestion. C'est la seule phase du chemin critique de `openSnapshot` : elle
 *      suffit à calculer les agrégats de base du mode 1.
 *   2. `materializeBatch` — construit la zone de chaînes (deeplink, version, libellés) et fige le
 *      `ListingColumnBatch`. Phase la plus coûteuse, DIFFÉRÉE au premier accès aux annonces
 *      individuelles (mode 2, export, forage) : `GeneratedDataset.batch` est un accesseur PARESSEUX.
 *
 * DÉTERMINISME (critère de succès) : toute source d'aléa est le `Prng` à graine fixée ; l'ordre de
 * parcours est fixe ; deux générations à même graine et même référentiel sont identiques octet à
 * octet (colonnes ET zone de chaînes). La phase 2 ne consomme AUCUN tirage : tout ce dont elle a
 * besoin est mémorisé par la phase 1 (`stringRecipe`), si bien que différer la matérialisation ne
 * peut pas décaler le flot pseudo-aléatoire.
 *
 * OUTLIERS INJECTÉS (matière des tests D4) : une fraction déterministe des annonces à prix affiché
 * reçoit un prix aberrant pour son année/km. La VÉRITÉ TERRAIN (`InjectedOutlier[]`) est émise pour
 * que D4 vérifie sa détection M1/M2/M3.
 *
 * SYNTHETIC (EX-DATA-107) : `sourceKind` est propagé par le provider ; ce module ne produit que des
 * données étiquetables comme synthétiques (aucune prétention à l'exactitude d'un marché réel).
 */

import type { ReferenceData } from '../../types/reference';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN, encodeVatDeductible } from '../../types/sentinels';
import { cleanModelVersion } from '../../types/shared-rules';
import { isPriceSentinelAbsolute, PRICE_SENTINEL_ABSOLUTE_EUR } from '../../types/shared-rules';
import { INGEST_FLAG_BIT, INGEST_FLAG_VALUES, setIngestFlag } from '../../types/vocabularies';
import type { IngestFlagCode } from '../../types/vocabularies';
import { LISTING_BOUND_INGEST_FLAG, isWithinListingBound } from '../../types/validation';
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
import { allocColumns, finalizeBatch, type MutableColumns } from './columnar';
import { auditDuplicateListings, type DuplicateAudit } from './dedupe';
import {
  MAKE_POPULARITY,
  MAKE_TAIL_TOTAL_WEIGHT,
  MODEL_RANK_HINTS,
  ZIPF_MAKE_TAIL_EXPONENT,
  ZIPF_MODEL_EXPONENT,
} from './popularity';
import { buildDrawTable, buildSafeDrawTable, combineKeys, drawTableSizeFor, hashToUnit, Prng } from './prng';

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
  /**
   * Lot colonnaire complet. ACCESSEUR PARESSEUX (DR-049) : le premier accès matérialise la zone de
   * chaînes (≈ 330 ms à 100 000 lignes) ; les suivants rendent le même objet.
   */
  readonly batch: ListingColumnBatch;
  /** Vrai si la zone de chaînes a déjà été matérialisée (mesures, tests de garde-fou). */
  readonly isMaterialized: boolean;
  readonly outliers: readonly InjectedOutlier[];
  readonly quotedCount: number;
  readonly onRequestCount: number;
  readonly missingCount: number;
  /**
   * Colonnes des agrégats de base — disponibles SANS matérialiser les colonnes de présentation ni
   * la zone de chaînes. C'est la seule vue du chemin critique de `openSnapshot`.
   */
  readonly metricColumns: MetricColumns;
  /**
   * Toutes les colonnes. ACCESSEUR PARESSEUX : le premier accès matérialise les colonnes de
   * présentation (≈ 40 % du coût par ligne), qu'aucun agrégat de base ne lit.
   */
  readonly columns: CoreColumns;
  readonly rowCount: number;
  /**
   * Rapport d'ingestion (EX-DATA-46) accumulé PENDANT la génération : champs restés INCONNUS et
   * drapeaux posés. Compter à part imposerait une passe supplémentaire sur le chemin critique.
   */
  readonly unknownCountByField: Readonly<Record<string, number>>;
  readonly ingestFlagCounts: Readonly<Record<string, number>>;
  /** Rejets d'ingestion par motif (EX-DATA-46), publiés tels quels au `SnapshotDescriptor`. */
  readonly rejectedByReason: Readonly<Record<string, number>>;
  /** Doublons MESURÉS dans l'ordre total d'ingestion d'ARB-54 (EX-DATA-15, DR-003/DR-004). */
  readonly duplicates: DuplicateAudit;
}

/**
 * Colonnes strictement nécessaires aux AGRÉGATS DE BASE du mode 1 (effectif, prix, kilométrage,
 * année) : le seul sous-ensemble que le chemin critique du premier affichage doit produire
 * (ARCHITECTURE §9.3 garde-fou 2, DR-049). `ListingColumnBatch` et `CoreColumns` la satisfont
 * structurellement.
 */
export interface MetricColumns {
  readonly rowCount: number;
  readonly priceEur: ArrayLike<number>;
  readonly mileageKm: ArrayLike<number>;
  readonly modelYear: ArrayLike<number>;
  readonly makeId: ArrayLike<number>;
  readonly modelId: ArrayLike<number>;
  readonly ingestFlags: ArrayLike<number>;
}

/**
 * Vue en lecture seule de TOUTES les colonnes : agrégats, compilation d'une sélection, rapport
 * d'ingestion. Obtenir cette vue déclenche la matérialisation des colonnes de PRÉSENTATION
 * (carrosserie, couleur, équipement…), qui ne sont pas sur le chemin critique.
 */
export interface CoreColumns extends MetricColumns {
  readonly firstRegistrationYearMonth: ArrayLike<number>;
  readonly powerKw: ArrayLike<number>;
  readonly electricRangeKm: ArrayLike<number>;
  readonly fuelCategory: ArrayLike<number>;
  readonly bodyType: ArrayLike<number>;
  readonly transmission: ArrayLike<number>;
  readonly drivetrain: ArrayLike<number>;
  readonly offerType: ArrayLike<number>;
  readonly usageState: ArrayLike<number>;
  readonly sellerType: ArrayLike<number>;
  readonly regionCode: ArrayLike<number>;
  readonly countryCode: ArrayLike<number>;
  readonly priceStatus: ArrayLike<number>;
  readonly priceEvaluationCategory: ArrayLike<number>;
  readonly bodyColor: ArrayLike<number>;
  readonly upholsteryType: ArrayLike<number>;
  readonly euEmissionStandard: ArrayLike<number>;
  readonly doorCount: ArrayLike<number>;
  readonly seatCount: ArrayLike<number>;
  readonly previousOwnerCount: ArrayLike<number>;
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

/** Plus grand nombre de modèles porté par une marque de `taxonomy.json` (Mercedes-Benz : 357). */
const MAX_MODELS_PER_MAKE = 512;

/** Plus grande valeur d'un tableau d'entiers (0 si vide). */
function maxOf(values: Int32Array): number {
  let max = 0;
  for (let i = 0; i < values.length; i += 1) if ((values[i] as number) > max) max = values[i] as number;
  return max;
}

/** Numéros de bit des drapeaux posés par le générateur (table unique de D2, D-01). */
const BIT_MODEL_UNRESOLVED = INGEST_FLAG_BIT.MODEL_UNRESOLVED;
const BIT_SUSPECT_ZERO_MILEAGE = INGEST_FLAG_BIT.SUSPECT_ZERO_MILEAGE;
const BIT_PRICE_MISSING_UNDECLARED = INGEST_FLAG_BIT.PRICE_MISSING_UNDECLARED;
const BIT_PRICE_SENTINEL_ABSOLUTE = INGEST_FLAG_BIT.PRICE_SENTINEL_ABSOLUTE;

/**
 * Colonnes numériques dont l'annexe A borne le domaine ET qu'EX-DATA-45 sait signaler (D-47).
 * `firstRegistrationYearMonth` n'y figure pas : sa borne porte sur l'ANNÉE, pas sur le mois-année
 * stocké, et le générateur ne produit que des années de son propre catalogue.
 */
const BOUNDED_COLUMNS = ['priceEur', 'mileageKm', 'powerKw', 'modelYear'] as const;
const round50 = (x: number): number => Math.round(x / 50) * 50;

/* ================================================================================================
 * Taux d'inconnu injectés (DR-037, EX-DATA-120)
 * ==============================================================================================
 * Sans une seule sentinelle d'inconnu hors `priceEur`, la règle « année INCONNUE ⇒ pas de cellule de
 * rang 1 » (EX-DATA-86), les exclusions de `V_year`/`V_mileage` (EX-DATA-60) et l'affichage
 * `INCONNU` des écrans ne sont exercés par aucun jeu de données. Taux volontairement BAS (1–2 %),
 * de l'ordre de ce qu'un marché réel laisse passer.
 */
const UNKNOWN_RATE_MILEAGE = 0.012;
const UNKNOWN_RATE_MODEL_YEAR = 0.008;
const UNKNOWN_RATE_POWER = 0.015;
const UNKNOWN_RATE_BODY_COLOR = 0.01;
const UNKNOWN_RATE_FIRST_REGISTRATION = 0.006;
/**
 * Bornes cumulées de la partition d'inconnus du NOYAU (un seul tirage uniforme, cf. boucle de
 * génération). `bodyColor` n'y figure pas : c'est une colonne de présentation, tirée par la passe
 * différée sur son propre flot — l'inclure ici élargirait la part des autres champs.
 */
const UNKNOWN_CUT_MILEAGE = UNKNOWN_RATE_MILEAGE;
const UNKNOWN_CUT_MODEL_YEAR = UNKNOWN_CUT_MILEAGE + UNKNOWN_RATE_MODEL_YEAR;
const UNKNOWN_CUT_POWER = UNKNOWN_CUT_MODEL_YEAR + UNKNOWN_RATE_POWER;
const UNKNOWN_CUT_FIRST_REGISTRATION = UNKNOWN_CUT_POWER + UNKNOWN_RATE_FIRST_REGISTRATION;
/** Fraction d'occasions affichées à 0 km — `SUSPECT_ZERO_MILEAGE` (annexe A champ 59, DR-124). */
const SUSPECT_ZERO_MILEAGE_RATE = 0.002;
/** Fraction d'annonces dont le modèle n'est pas identifié (`MODEL_ID_UNRESOLVED`, ADV-14/ARB-59). */
const MODEL_UNRESOLVED_RATE = 0.005;

/* ---- Phase 2.8 (D8-08, D8-16 / FV-20) : replis d'ingestion et colonne TVA ----------------------
 *
 * CONTRAINTE DE DÉTERMINISME, à respecter à la lettre. Les proportions ci-dessous sont tirées par
 * un HACHAGE PUR de la graine et de l'indice de ligne (`hashToUnit(combineKeys(...))`), JAMAIS par
 * un tirage du `Prng` du noyau. Consommer un tirage de plus dans la boucle de génération décalerait
 * tout le flot pseudo-aléatoire aval : la vérité terrain des outliers, les effectifs de cellules
 * (« Opel Corsa : 1 352 annonces »), les taux d'inconnus et les 47 prix sentinelles changeraient,
 * et une dizaine de sondes vertes mesurant ces valeurs deviendraient fausses sans qu'aucun défaut
 * ne les ait causées. Le hachage est déterministe à graine fixe, dépend de la graine (deux graines
 * donnent deux jeux différents) et ne coûte aucun état.
 */

/** Part des annonces à kilométrage INCONNU dont l'inconnu vient d'une unité source non gérée. */
const UNIT_UNSUPPORTED_SHARE_OF_UNKNOWN_MILEAGE = 0.25;
/** Part des annonces dont la catégorie de carburant vient du repli création → recherche (EX-DATA-10). */
const FUEL_FALLBACK_RATE = 0.004;
/** Part des annonces hybrides rechargeables dont la catégorie reste INCONNUE (EX-DATA-11). */
const HYBRID_UNRESOLVED_RATE = 0.002;
/** Part des annonces SOURCE servies sans deeplink, rejetées à l'ingestion (EX-DATA-14). */
const LISTING_URL_MISSING_RATE = 0.0015;
/** Part des professionnels dont la déductibilité de TVA n'est pas renseignée par la source (D8-08). */
const VAT_UNKNOWN_SHARE_OF_PROS = 0.04;
/** Part des professionnels dont la TVA est déductible (D8-08) — véhicules d'entreprise et flottes. */
const VAT_DEDUCTIBLE_SHARE_OF_PROS = 0.58;

/** Constantes de dérivation des hachages purs : un domaine par usage, jamais deux fois la même. */
const HASH_DOMAIN_UNIT = 0x554e4954;
const HASH_DOMAIN_FUEL = 0x4655454c;
const HASH_DOMAIN_HYBRID = 0x48594252;
const HASH_DOMAIN_URL = 0x55524c30;
const HASH_DOMAIN_VAT = 0x54564101;

/** Tirage déterministe dans [0, 1) pour une ligne et un usage, SANS consommer le flot du noyau. */
function pureDraw(seed: number, domain: number, row: number): number {
  return hashToUnit(combineKeys((seed ^ domain) >>> 0, row));
}
/**
 * Fraction des annonces à prix affiché qui portent un PRIX SENTINELLE (< 250 €, ADV-04/ARB-15) :
 * le « 1 € » du stress-test, posé à l'ingestion avec `PRICE_SENTINEL_ABSOLUTE` (DR-001).
 *
 * Ces annonces ne sont PAS de la vérité terrain d'outlier : `EX-DATA-60` les sort de `V_price`, donc
 * ni M1 ni M2 ne les voient — les annoncer comme détectables serait une vérité terrain fausse. Elles
 * sont un cas d'ingestion distinct, et c'est le drapeau qui les rend auditables.
 */
const PRICE_SENTINEL_INJECTION_RATE = 0.0005;

/* ---- Index de tirage de la taxonomie ---------------------------------------------------------- */

interface MakeEntry {
  readonly makeId: number;
  readonly slug: string;
  readonly modelIds: number[];
  readonly modelSlugs: string[];
  readonly modelCumulative: number[];
  /** Table de tirage O(1) des modèles, ou `null` si la traîne est trop fine pour être quantifiée. */
  readonly modelTable: Int32Array | null;
}

interface TaxonomyIndex {
  readonly makeEntries: MakeEntry[];
  readonly makeCumulative: number[];
  readonly makeTable: Int32Array | null;
}

/**
 * Poids d'une marque : sa part dans `MAKE_POPULARITY` si elle y figure, sinon une part de la queue
 * de Zipf (`MAKE_TAIL_TOTAL_WEIGHT` réparti sur les marques restantes selon un rang stable). Aucune
 * marque du référentiel n'a un poids nul : la taxonomie entière reste représentable (EX-DATA-20).
 */
function makeWeights(ref: ReferenceData): number[] {
  const tail: number[] = [];
  const weights = new Array<number>(ref.makes.length).fill(0);
  ref.makes.forEach((make, i) => {
    const listed = MAKE_POPULARITY[make.slug];
    if (listed !== undefined) weights[i] = listed;
    else tail.push(i);
  });
  // Rang stable dans la queue : ordre du hachage de l'identifiant, indépendant de l'ordre du fichier.
  tail.sort((a, b) => {
    const ha = hashToUnit(ref.makes[a]?.makeId ?? a);
    const hb = hashToUnit(ref.makes[b]?.makeId ?? b);
    return ha - hb || a - b;
  });
  let zipfTotal = 0;
  for (let r = 1; r <= tail.length; r += 1) zipfTotal += Math.pow(r, -ZIPF_MAKE_TAIL_EXPONENT);
  tail.forEach((index, r) => {
    weights[index] = (MAKE_TAIL_TOTAL_WEIGHT * Math.pow(r + 1, -ZIPF_MAKE_TAIL_EXPONENT)) / zipfTotal;
  });
  return weights;
}

/** Rangs de popularité des modèles d'une marque : indices listés d'abord, puis l'ordre du référentiel. */
function modelRankOrder(makeSlug: string, modelSlugs: readonly string[]): number[] {
  const hints = MODEL_RANK_HINTS[makeSlug];
  const order: number[] = [];
  const taken = new Set<number>();
  if (hints !== undefined) {
    for (const slug of hints) {
      const i = modelSlugs.indexOf(slug);
      if (i >= 0 && !taken.has(i)) {
        taken.add(i);
        order.push(i);
      }
    }
  }
  for (let i = 0; i < modelSlugs.length; i += 1) if (!taken.has(i)) order.push(i);
  return order;
}

function buildTaxonomyIndex(ref: ReferenceData): TaxonomyIndex {
  const makeEntries: MakeEntry[] = [];
  const makeCumulative: number[] = [];
  const weights = makeWeights(ref);
  let acc = 0;
  ref.makes.forEach((make, mi) => {
    const models = ref.modelsByMake.get(make.makeId) ?? [];
    const modelIds: number[] = [];
    const modelSlugs: string[] = [];
    for (const model of models) {
      modelIds.push(model.modelId);
      modelSlugs.push(model.slug);
    }
    // Popularité de modèle : loi de Zipf sur le rang (DR-038) — quelques modèles portent l'essentiel
    // des annonces de la marque, le reste forme une longue traîne, comme sur un marché réel.
    const rankOf = new Array<number>(modelIds.length).fill(0);
    modelRankOrder(make.slug, modelSlugs).forEach((index, rank) => {
      rankOf[index] = rank + 1;
    });
    const modelCumulative: number[] = [];
    let mAcc = 0;
    for (let i = 0; i < modelIds.length; i += 1) {
      mAcc += Math.pow(rankOf[i] as number, -ZIPF_MODEL_EXPONENT);
      modelCumulative.push(mAcc);
    }
    acc += weights[mi] as number;
    makeEntries.push({
      makeId: make.makeId,
      slug: make.slug,
      modelIds,
      modelSlugs,
      modelCumulative,
      modelTable:
        modelCumulative.length === 0
          ? null
          : buildSafeDrawTable(modelCumulative, drawTableSizeFor(modelCumulative.length)),
    });
    makeCumulative.push(acc);
  });
  return {
    makeEntries,
    makeCumulative,
    makeTable: buildSafeDrawTable(makeCumulative, drawTableSizeFor(makeCumulative.length)),
  };
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
  psQuoted: number;
  psOnRequest: number;
  psMissing: number;
  adTierNone: number;
  /** Code de carburant par indice d'octet, matérialisé en tableau (accès O(1) sans `Map`). */
  fuelCodeByByte: string[];
  /** Libellé source du carburant par indice d'octet (zone texte, phase 2). */
  fuelLabelByByte: string[];
  /** Indice d'octet du type de vendeur « particulier ». */
  sellerPrivate: number;
  euByYear: Int16Array;
  /** Tables par indice d'octet : évitent toute recherche de `Map` et toute comparaison de chaîne
   *  dans la boucle de génération (DR-049, chemin critique). */
  fuelIsBev: Uint8Array;
  fuelIsPhev: Uint8Array;
  fuelFactor: Float64Array;
  /** Classe de carrosserie : 0 autre, 1 citadine, 2 coupé/cabriolet, 3 monospace, 4 utilitaire. */
  bodyShape: Uint8Array;
  /** Facteur de dépréciation par âge (0..31 ans), précalculé. */
  ageFactor: Float64Array;
  /** Tables de tirage O(1) des distributions courtes (voir `buildDrawTable`). */
  fuelTable: Int32Array;
  bodyTable: Int32Array;
  transmissionTable: Int32Array;
  drivetrainTable: Int32Array;
  sellerTable: Int32Array;
  adTierTable: Int32Array;
  colorTable: Int32Array;
  upholsteryTable: Int32Array;
  regionTable: Int32Array;
  ageTable: Int32Array;
}

function requireIndex(ref: ReferenceData, voc: Parameters<typeof codeIndex>[1], code: string): number {
  const i = codeIndex(ref, voc, code);
  if (i === null) throw new Error(`generate: code ${code} absent de ${voc}`);
  return i;
}

/** Norme d'émission attendue pour une année-modèle (indice d'octet, `ENUM_UNKNOWN_BYTE` sinon). */
function euCodeForYear(year: number): string {
  if (year <= 1996) return '1';
  if (year <= 2000) return '2';
  if (year <= 2005) return '3';
  if (year <= 2010) return '4';
  if (year <= 2014) return '5';
  if (year <= 2017) return '6';
  if (year === 2018) return '9';
  if (year === 2019) return '7';
  if (year <= 2021) return '8';
  if (year <= 2023) return '11';
  return '10';
}

function buildDists(ref: ReferenceData): Dists {
  const priceEval: Record<string, number> = {};
  for (const c of ['0', '1', '2', '3', '4', '5']) {
    priceEval[c] = requireIndex(ref, 'KYCAR_PRICE_EVALUATION', c);
  }
  const fuel = buildDist(ref, 'KYCAR_FUEL_CATEGORY', FUEL_WEIGHTS);
  const fuelVoc = ref.vocabularies.get('KYCAR_FUEL_CATEGORY');
  const fuelCodeByByte: string[] = [];
  const fuelLabelByByte: string[] = [];
  (fuelVoc?.values ?? []).forEach((v, i) => {
    fuelCodeByByte[i] = v.code;
    fuelLabelByByte[i] = v.label;
  });
  // Table année → norme Euro, calculée UNE fois (le chemin critique n'y fait qu'une lecture).
  const euByYear = new Int16Array(CURRENT_YEAR + 1);
  for (let y = 0; y <= CURRENT_YEAR; y += 1) {
    const idx = codeIndex(ref, 'KYCAR_EU_EMISSION_STANDARD', euCodeForYear(y));
    euByYear[y] = idx === null ? ENUM_UNKNOWN_BYTE : idx;
  }
  const adTier = buildDist(ref, 'KYCAR_AD_TIER', AD_TIER_WEIGHTS);
  const seller = buildDist(ref, 'KYCAR_SELLER_TYPE', SELLER_WEIGHTS);
  const byteCount = 256;
  const fuelIsBev = new Uint8Array(byteCount);
  const fuelIsPhev = new Uint8Array(byteCount);
  const fuelFactor = new Float64Array(byteCount).fill(1);
  fuelCodeByByte.forEach((code, i) => {
    const bev = code === 'E' || code === 'H';
    const phev = code === '2' || code === '3';
    fuelIsBev[i] = bev ? 1 : 0;
    fuelIsPhev[i] = phev ? 1 : 0;
    fuelFactor[i] = phev ? 1.12 : bev ? 1.1 : code === 'D' ? 1.02 : code === 'O' ? 0.95 : 1.0;
  });
  const body = buildDist(ref, 'KYCAR_BODY_TYPE', BODY_WEIGHTS);
  const bodyShape = new Uint8Array(byteCount);
  for (const [index, code] of body.codeByIndex) {
    bodyShape[index] = code === '2' || code === '3' ? 2 : code === '1' ? 1 : code === '12' ? 3 : code === '13' ? 4 : 0;
  }
  const ageFactor = new Float64Array(AGE_WEIGHTS.length);
  for (let a = 0; a < ageFactor.length; a += 1) ageFactor[a] = Math.max(0.06, Math.pow(0.87, a));
  const color = buildDist(ref, 'KYCAR_BODY_COLOR', COLOR_WEIGHTS);
  const upholstery = buildDist(ref, 'KYCAR_UPHOLSTERY_TYPE', UPHOLSTERY_WEIGHTS);
  const region = buildDist(ref, 'KYCAR_REGION', REGION_WEIGHTS);
  const transmission = buildDist(ref, 'KYCAR_TRANSMISSION', TRANSMISSION_WEIGHTS);
  const drivetrain = buildDist(ref, 'KYCAR_DRIVETRAIN', DRIVETRAIN_WEIGHTS);
  return {
    fuel,
    fuelTable: buildDrawTable(fuel.cumulative),
    bodyTable: buildDrawTable(body.cumulative),
    transmissionTable: buildDrawTable(transmission.cumulative),
    drivetrainTable: buildDrawTable(drivetrain.cumulative),
    sellerTable: buildDrawTable(seller.cumulative),
    adTierTable: buildDrawTable(adTier.cumulative),
    colorTable: buildDrawTable(color.cumulative),
    upholsteryTable: buildDrawTable(upholstery.cumulative),
    regionTable: buildDrawTable(region.cumulative),
    ageTable: buildDrawTable(AGE_CUMULATIVE),
    fuelIsBev,
    fuelIsPhev,
    fuelFactor,
    bodyShape,
    ageFactor,
    body,
    transmission,
    drivetrain,
    color,
    upholstery,
    seller,
    region,
    adTier,
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
    psQuoted: requireIndex(ref, 'KYCAR_PRICE_STATUS', 'QUOTED'),
    psOnRequest: requireIndex(ref, 'KYCAR_PRICE_STATUS', 'ON_REQUEST'),
    psMissing: requireIndex(ref, 'KYCAR_PRICE_STATUS', 'MISSING'),
    adTierNone: adTier.indexByCode.get('NONE') ?? 0,
    fuelCodeByByte,
    fuelLabelByByte,
    sellerPrivate: seller.indexByCode.get('P') ?? 0,
    euByYear,
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

/** Décode 16 octets en UUID canonique 8-4-4-4-12. */
export function uuidToHex(bytes: Uint8Array, offset = 0): string {
  const h = (i: number): string => HEX[bytes[offset + i] as number] as string;
  return (
    `${h(0)}${h(1)}${h(2)}${h(3)}-${h(4)}${h(5)}-${h(6)}${h(7)}-${h(8)}${h(9)}-` +
    `${h(10)}${h(11)}${h(12)}${h(13)}${h(14)}${h(15)}`
  );
}

/* ================================================================================================
 * Zone de chaînes : vocabulaire de version (DR-126 / ADV-17 / ARB-61)
 * ==============================================================================================
 * Les versions produites jusqu'ici (`« 2.0 TDI »`, ≤ 8 caractères) ne ressemblaient à rien de ce que
 * publie un marché réel : la troncature à 80 points de code d'ARB-61 n'était JAMAIS exercée et la
 * zone texte pesait 98,7 o/ligne au lieu des ≈ 180 prévus — ce qui FLATTAIT `EX-NFR-1`/`EX-NFR-3`.
 *
 * PLAFOND ASSUMÉ (D-30, « le budget prime ») : la marge gzip mesurée à l'étape 0 n'était déjà que de
 * 4,6 % pour `EX-NFR-3` (≤ 6 Mio). Le générateur produit donc des versions réalistes mais BORNÉES :
 * la grande majorité des lignes reste courte, et seule une petite fraction (`VERSION_TIER_LONG`)
 * dépasse 80 points de code pour exercer la troncature. Mesures avant/après : rapport fix-providers.
 */
const TRIM_WORDS: readonly string[] = [
  'Sport', 'Style', 'Comfort', 'GT Line', 'Business', 'Edition', 'Élégance', 'Allure', 'Executive',
  'Ultimate', 'Premium', 'Innovation', 'Dynamic', 'Avantgarde', 'Zen', 'Intens', 'Ambiente',
];
const PACK_WORDS: readonly string[] = [
  'Pack Confort', 'Pack Hiver', 'Pack Sport', 'Pack Business', 'Pack Techno', 'Pack Cuir',
];
const TECH_WORDS: readonly string[] = [
  'Start/Stop', 'BlueMotion Technology', 'BlueHDi', 'EcoBoost', 'mHEV 48V', 'AdBlue', 'S&S',
];
const GEARBOX_WORDS: readonly string[] = [
  'Boîte automatique 7 rapports', 'DSG7', 'EDC6', 'S-Tronic', 'Steptronic', 'Manuelle 6 vitesses',
];
const EXTRA_WORDS: readonly string[] = [
  'Toit ouvrant panoramique', 'Caméra de recul', 'Attelage amovible', 'Sièges chauffants',
  'GPS Européen', 'Jantes alliage 18 pouces', 'Première main', 'Carnet d’entretien complet',
];

/** Badge de motorisation par code de carburant (texte de version, phase 2). */
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

/**
 * Recette de version, mémorisée par la phase 1 sur 1 octet par ligne : les 2 bits de poids fort
 * portent le PALIER de longueur, les 6 bits restants l'indice de finition. Tout le reste du texte
 * se dérive du numéro de ligne et des colonnes déjà écrites : la phase 2 ne tire aucun aléa.
 */
const VERSION_TIER_SHORT = 0;
const VERSION_TIER_TRIM = 1;
const VERSION_TIER_PACK = 2;
const VERSION_TIER_LONG = 3;
/** Probabilités cumulées des quatre paliers (plafonnées par le budget `EX-NFR-3`, D-30). */
const VERSION_TIER_CUMULATIVE: readonly number[] = [0.8, 0.955, 0.98, 1];

/* ---- Génération : phase 1 (noyau colonnaire) --------------------------------------------------- */

interface CoreDataset {
  readonly cols: MutableColumns;
  readonly rowCount: number;
  readonly snapshotId: string;
  readonly outliers: InjectedOutlier[];
  readonly quotedCount: number;
  readonly onRequestCount: number;
  readonly missingCount: number;
  /** Indice de la marque et du modèle dans la taxonomie (reconstruction des slugs, phase 2). */
  readonly makeIdx: Int32Array;
  readonly modelIdx: Int32Array;
  readonly versionRecipe: Uint8Array;
  /** Âge du véhicule (0..31 ans), mémorisé pour la passe de présentation différée. */
  readonly ageByRow: Uint8Array;
  readonly seed: number;
  readonly taxonomy: TaxonomyIndex;
  readonly dists: Dists;
  /** Faux tant que les colonnes de présentation n'ont pas été remplies (DR-049). */
  presentationDone: boolean;
  readonly unknownCountByField: Record<string, number>;
  readonly ingestFlagCounts: Record<string, number>;
  /** Rejets d'ingestion par motif (EX-DATA-46) — `LISTING_URL_MISSING` d'EX-DATA-14 (D8-16). */
  readonly rejectedByReason: Record<string, number>;
  readonly duplicates: DuplicateAudit;
}

/** Génère le dataset complet et la vérité terrain des outliers (zone de chaînes différée). */
export function generateDataset(options: GenerateOptions): GeneratedDataset {
  const core = generateCore(options);
  let batch: ListingColumnBatch | null = null;
  return {
    get batch(): ListingColumnBatch {
      batch ??= materializeBatch(core);
      return batch;
    },
    get isMaterialized(): boolean {
      return batch !== null;
    },
    outliers: core.outliers,
    quotedCount: core.quotedCount,
    onRequestCount: core.onRequestCount,
    missingCount: core.missingCount,
    metricColumns: {
      rowCount: core.rowCount,
      priceEur: core.cols.priceEur,
      mileageKm: core.cols.mileageKm,
      modelYear: core.cols.modelYear,
      makeId: core.cols.makeId,
      modelId: core.cols.modelId,
      ingestFlags: core.cols.ingestFlags,
    },
    get columns(): CoreColumns {
      materializePresentation(core);
      return { rowCount: core.rowCount, ...core.cols };
    },
    rowCount: core.rowCount,
    unknownCountByField: core.unknownCountByField,
    ingestFlagCounts: core.ingestFlagCounts,
    rejectedByReason: core.rejectedByReason,
    duplicates: core.duplicates,
  };
}

function generateCore(options: GenerateOptions): CoreDataset {
  const ref = options.referenceData;
  const seed = options.seed ?? DEFAULT_SEED;
  const count = options.listingCount ?? DEFAULT_LISTING_COUNT;
  const outlierRate = options.outlierRate ?? 0.006;

  const taxonomy = buildTaxonomyIndex(ref);
  const d = buildDists(ref);
  const prng = new Prng(seed);
  const cols = allocColumns(count);

  const quotedRows = new Int32Array(count);
  const quotedFair = new Int32Array(count);
  const makeIdx = new Int32Array(count);
  const modelIdx = new Int32Array(count);
  const versionRecipe = new Uint8Array(count);
  const ageByRow = new Uint8Array(count);

  let quotedCount = 0;
  let onRequestCount = 0;
  let missingCount = 0;
  // Rapport d'ingestion accumulé au fil de l'eau (EX-DATA-46) : aucune passe supplémentaire.
  let unknownMileage = 0;
  let unknownModelYear = 0;
  let unknownPowerKw = 0;
  let unknownFrym = 0;
  const flagCounts = new Int32Array(32);

  const makeEntries = taxonomy.makeEntries;
  const uuid = new Uint8Array(16);

  // Chemin critique (DR-049) : toutes les tables sont hissées en variables LOCALES avant la boucle.
  // Chaque `d.x.y[...]` évité, ce sont deux chargements de propriété de moins par ligne et par tirage.
  const makeCum = taxonomy.makeCumulative;
  const makeTable = taxonomy.makeTable;
  const fuelIdx = d.fuel.indices;
  const fuelTable = d.fuelTable;
  const fuelIsBev = d.fuelIsBev;
  const fuelFactorByByte = d.fuelFactor;
  const ageFactorByAge = d.ageFactor;
  const usageN = d.usageN;
  const usageU = d.usageU;
  const usageA = d.usageA;
  const psQuoted = d.psQuoted;
  const psOnRequest = d.psOnRequest;
  const psMissing = d.psMissing;
  const eval0 = d.priceEval['0'] as number;
  const eval1 = d.priceEval['1'] as number;
  const eval2 = d.priceEval['2'] as number;
  const eval3 = d.priceEval['3'] as number;
  const eval4 = d.priceEval['4'] as number;
  const eval5 = d.priceEval['5'] as number;
  const colPrice = cols.priceEur;
  const colMileage = cols.mileageKm;
  const colFrym = cols.firstRegistrationYearMonth;
  const colModelId = cols.modelId;
  const colMakeId = cols.makeId;
  const colModelYear = cols.modelYear;
  const colPowerKw = cols.powerKw;
  const colFuel = cols.fuelCategory;
  const colUsage = cols.usageState;
  const colStatus = cols.priceStatus;
  const colEval = cols.priceEvaluationCategory;
  const colFlags = cols.ingestFlags;
  const colListingId = cols.listingId;

  for (let i = 0; i < count; i += 1) {
    // --- Marque / modèle (popularité concentrée, DR-038) ---
    const mkIdx = makeTable === null ? prng.pickCumulative(makeCum) : prng.pickTable(makeTable);
    const makeEntry = makeEntries[mkIdx] as MakeEntry;
    const makeId = makeEntry.makeId;
    let modelId = 0;
    let mdIdx = -1;
    if (makeEntry.modelIds.length > 0) {
      const modelTable = makeEntry.modelTable;
      mdIdx = modelTable === null ? prng.pickCumulative(makeEntry.modelCumulative) : prng.pickTable(modelTable);
      modelId = makeEntry.modelIds[mdIdx] as number;
    }
    // ADV-14 / ARB-59 : une fraction des annonces n'identifie pas son modèle (EX-DATA-72).
    let ingestFlags = 0;
    if (prng.nextBool(MODEL_UNRESOLVED_RATE)) {
      modelId = 0;
      mdIdx = -1;
      ingestFlags = setIngestFlag(ingestFlags, 'MODEL_UNRESOLVED');
      flagCounts[BIT_MODEL_UNRESOLVED] = (flagCounts[BIT_MODEL_UNRESOLVED] as number) + 1;
    }
    makeIdx[i] = mkIdx;
    modelIdx[i] = mdIdx;
    colMakeId[i] = makeId;
    colModelId[i] = modelId;

    // --- Âge / année ---
    const age = prng.pickTable(d.ageTable);
    const modelYear = clamp(CURRENT_YEAR - age, 1994, CURRENT_YEAR);

    // --- État corrélé à l'âge (le type d'offre en dérive, passe de présentation) ---
    const usageState = age === 0 ? usageN : prng.nextBool(age <= 2 ? 0.03 : 0.02) ? usageA : usageU;

    // --- Carburant (entre dans le modèle de prix : reste sur le chemin critique) ---
    const fuelCategory = fuelIdx[prng.pickTable(fuelTable)] as number;
    const isBev = fuelIsBev[fuelCategory] === 1;

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
    if (age === 0 && usageState === usageN) {
      mileageKm = prng.nextInt(0, 60);
    } else {
      const annual = clamp(14000 + prng.nextGaussian() * 3500, 4000, 35000);
      mileageKm = clamp(Math.round(age * annual * Math.exp(prng.nextGaussian() * 0.15)), 0, 400000);
      mileageKm = Math.round(mileageKm / 100) * 100;
      // Annexe A champ 59 (DR-124) : une occasion affichée à 0 km est SUSPECTE, jamais plausible.
      if (prng.nextBool(SUSPECT_ZERO_MILEAGE_RATE)) mileageKm = 0;
    }
    if (mileageKm === 0 && usageState !== usageN) {
      ingestFlags = setIngestFlag(ingestFlags, 'SUSPECT_ZERO_MILEAGE');
      flagCounts[BIT_SUSPECT_ZERO_MILEAGE] = (flagCounts[BIT_SUSPECT_ZERO_MILEAGE] as number) + 1;
    }

    // --- Prix plausible ---
    const ageFactor = ageFactorByAge[age] as number;
    const expectedKm = age * 14000;
    const kmFactor = clamp(1 - (mileageKm - expectedKm) / 280000, 0.55, 1.25);
    const fuelFactor = fuelFactorByByte[fuelCategory] as number;
    const powerFactor = clamp(0.8 + (powerKw - 100) / 500, 0.7, 1.8);
    const noise = Math.exp(prng.nextGaussian() * 0.11);
    const fairPrice = clamp(round50(baseNew * ageFactor * kmFactor * fuelFactor * powerFactor * noise), 500, 300_000);

    // --- Statut de prix ---
    const psDraw = prng.nextFloat();
    let priceStatus: number;
    let priceEur: number;
    let priceEvaluationCategory: number;
    if (psDraw < 0.94) {
      priceStatus = psQuoted;
      priceEur = fairPrice;
      const evalNoise = prng.nextGaussian() * 0.06;
      priceEvaluationCategory =
        evalNoise < -0.08 ? eval1
        : evalNoise < -0.03 ? eval2
        : evalNoise < 0.03 ? eval3
        : evalNoise < 0.08 ? eval4
        : eval5;
      quotedRows[quotedCount] = i;
      quotedFair[quotedCount] = fairPrice;
      quotedCount += 1;
    } else if (psDraw < 0.98) {
      priceStatus = psOnRequest;
      priceEur = NUMERIC_UNKNOWN;
      priceEvaluationCategory = eval0;
      onRequestCount += 1;
    } else {
      priceStatus = psMissing;
      priceEur = NUMERIC_UNKNOWN;
      priceEvaluationCategory = eval0;
      // EX-DATA-18 : un prix absent NON déclaré est signalé au rapport d'ingestion (DR-124).
      ingestFlags = setIngestFlag(ingestFlags, 'PRICE_MISSING_UNDECLARED');
      flagCounts[BIT_PRICE_MISSING_UNDECLARED] = (flagCounts[BIT_PRICE_MISSING_UNDECLARED] as number) + 1;
      missingCount += 1;
    }

    // --- Immatriculation ---
    const regMonth = age === 0 ? prng.nextInt(0, 8) : prng.nextInt(0, 11);
    let firstRegistrationYearMonth = 12 * modelYear + regMonth;

    // --- Sentinelles d'inconnu (DR-037, EX-DATA-120) ---
    // Un SEUL tirage partitionne les cinq inconnus : sur un champ donné le taux est exactement
    // celui annoncé, et une annonce ne porte au plus qu'une valeur inconnue — hypothèse plus
    // conservatrice (et moins coûteuse) que cinq tirages indépendants.
    let storedMileage = mileageKm;
    let storedModelYear = modelYear;
    let storedPowerKw = powerKw;
    const unknownDraw = prng.nextFloat();
    if (unknownDraw < UNKNOWN_CUT_MILEAGE) {
      storedMileage = NUMERIC_UNKNOWN;
      unknownMileage += 1;
    } else if (unknownDraw < UNKNOWN_CUT_MODEL_YEAR) {
      storedModelYear = NUMERIC_UNKNOWN;
      unknownModelYear += 1;
    } else if (unknownDraw < UNKNOWN_CUT_POWER) {
      storedPowerKw = NUMERIC_UNKNOWN;
      unknownPowerKw += 1;
    } else if (unknownDraw < UNKNOWN_CUT_FIRST_REGISTRATION) {
      firstRegistrationYearMonth = NUMERIC_UNKNOWN;
      unknownFrym += 1;
    }

    // --- Identifiant et recette de version ---
    for (let b = 0; b < 16; b += 4) {
      // `nextInt32` (entier SIGNÉ) et non `nextUint32` : un mot ≥ 2^31 sortirait du domaine des
      // petits entiers de V8 et provoquerait une allocation par tirage (DR-049). Les décalages
      // ci-dessous portent sur le motif de bits, identique dans les deux écritures.
      const word = prng.nextInt32();
      uuid[b] = (word >>> 24) & 0xff;
      uuid[b + 1] = (word >>> 16) & 0xff;
      uuid[b + 2] = (word >>> 8) & 0xff;
      uuid[b + 3] = word & 0xff;
    }
    uuid[6] = (0x40 | ((uuid[6] as number) & 0x0f)) & 0xff; // version 4
    uuid[8] = (0x80 | ((uuid[8] as number) & 0x3f)) & 0xff; // variant
    colListingId.set(uuid, i * 16);

    // Un SEUL tirage porte le palier de longueur (bits de poids fort) et l'indice de finition
    // (6 bits de poids faible), tous deux indépendants.
    const recipeWord = prng.nextInt32();
    const tierDraw = (recipeWord >>> 8) / 16777216;
    const tier =
      tierDraw < (VERSION_TIER_CUMULATIVE[0] as number) ? VERSION_TIER_SHORT
      : tierDraw < (VERSION_TIER_CUMULATIVE[1] as number) ? VERSION_TIER_TRIM
      : tierDraw < (VERSION_TIER_CUMULATIVE[2] as number) ? VERSION_TIER_PACK
      : VERSION_TIER_LONG;
    versionRecipe[i] = ((tier << 6) | (recipeWord & 0x3f)) & 0xff;

    // --- Écriture des colonnes ---
    colPrice[i] = priceEur;
    colMileage[i] = storedMileage;
    colFrym[i] = firstRegistrationYearMonth;
    colModelYear[i] = storedModelYear;
    colPowerKw[i] = storedPowerKw;
    colFuel[i] = fuelCategory;
    colUsage[i] = usageState;
    colStatus[i] = priceStatus;
    colEval[i] = priceEvaluationCategory;
    colFlags[i] = ingestFlags;
    ageByRow[i] = age;
  }

  const outliers = injectOutliers(
    cols,
    count,
    quotedRows,
    quotedFair,
    quotedCount,
    makeIdx,
    modelIdx,
    seed,
    outlierRate,
    d,
  );

  // ---- Phase 2.8 (D8-16 / FV-20) : replis d'ingestion du dictionnaire, exercés à faible taux ----
  //
  // Ces trois règles n'étaient exercées par AUCUN jeu de données (`grep UNIT_UNSUPPORTED` = 0,
  // `grep HYBRID_CATEGORY_UNRESOLVED` = 0) : les branches correspondantes du dictionnaire étaient
  // du code mort non prouvé. Elles sont posées ICI, après la boucle de génération, par hachage pur
  // (voir la note de déterminisme ci-dessus) — aucune valeur déjà tirée n'est modifiée, sauf la
  // catégorie de carburant des hybrides non résolus, qui DOIT devenir INCONNUE.
  let fuelFallbackCount = 0;
  let hybridUnresolvedCount = 0;
  const colFuelCategory = cols.fuelCategory;
  for (let i = 0; i < count; i += 1) {
    // EX-DATA-5 — une part des kilométrages INCONNUS l'est parce que la source servait une unité
    // non gérée (`mileageUnit = mi`) : la conversion est REFUSÉE, jamais devinée. La valeur est
    // déjà INCONNUE (partition d'inconnus de la boucle) : seul le MOTIF manquait.
    if (
      (cols.mileageKm[i] as number) === NUMERIC_UNKNOWN &&
      pureDraw(seed, HASH_DOMAIN_UNIT, i) < UNIT_UNSUPPORTED_SHARE_OF_UNKNOWN_MILEAGE
    ) {
      cols.ingestFlags[i] = setIngestFlag(cols.ingestFlags[i] as number, 'UNIT_UNSUPPORTED');
      flagCounts[INGEST_FLAG_BIT.UNIT_UNSUPPORTED] =
        (flagCounts[INGEST_FLAG_BIT.UNIT_UNSUPPORTED] as number) + 1;
      continue;
    }
    // EX-DATA-11 — hybride rechargeable dont la source ne sert PAS la catégorie : elle reste
    // INCONNUE (sentinelle 255), jamais rattachée à `B` ou `D`. Prioritaire sur le repli EX-DATA-10,
    // qu'EX-DATA-11 rend justement inatteignable pour ce cas.
    if (pureDraw(seed, HASH_DOMAIN_HYBRID, i) < HYBRID_UNRESOLVED_RATE) {
      colFuelCategory[i] = ENUM_UNKNOWN_BYTE;
      cols.ingestFlags[i] = setIngestFlag(cols.ingestFlags[i] as number, 'ENUM_UNKNOWN');
      flagCounts[INGEST_FLAG_BIT.ENUM_UNKNOWN] = (flagCounts[INGEST_FLAG_BIT.ENUM_UNKNOWN] as number) + 1;
      hybridUnresolvedCount += 1;
      continue;
    }
    // EX-DATA-10 — catégorie absente de la source, RÉSOLUE par la table de repli création →
    // recherche depuis `fuelTypePrimary`. La catégorie stockée est celle que le repli a produite ;
    // le rapport d'ingestion dit qu'elle vient d'une table `[EXTRAPOLÉ]`, pas de la source.
    if (pureDraw(seed, HASH_DOMAIN_FUEL, i) < FUEL_FALLBACK_RATE) {
      cols.ingestFlags[i] = setIngestFlag(cols.ingestFlags[i] as number, 'ENUM_UNKNOWN');
      flagCounts[INGEST_FLAG_BIT.ENUM_UNKNOWN] = (flagCounts[INGEST_FLAG_BIT.ENUM_UNKNOWN] as number) + 1;
      fuelFallbackCount += 1;
    }
  }

  // EX-DATA-14 (D8-16 / FV-20) — la source sert une part d'annonces SANS deeplink. `listingUrl` est
  // obligatoire et son absence provoque le REJET : ces candidates n'entrent JAMAIS dans le lot
  // colonnaire (aucune ligne du lot ne porte une URL vide) et sont comptées par motif. Elles sont
  // dénombrées, non générées : les matérialiser puis les retirer décalerait les indices de toutes
  // les lignes retenues, et donc la vérité terrain des outliers.
  const rejectedByReason: Record<string, number> = {};
  const urlRejected = countRejectedSourceCandidates(seed, count);
  if (urlRejected > 0) rejectedByReason.LISTING_URL_MISSING = urlRejected;

  // EX-DATA-19(1) / EX-DATA-60 (DR-001) : le drapeau de sentinelle absolue est posé À L'INGESTION,
  // APRÈS l'injection des outliers — un `M1_LOW` à 150 € est exactement le cas visé par ARB-15.
  //
  // D-47 : la MÊME passe applique les bornes de plausibilité de l'annexe A (`isWithinListingBound`,
  // symbole unique de D2, jamais recopié ici). Une valeur hors domaine devient INCONNU et porte son
  // drapeau d'ingestion (EX-DATA-45) — y compris quand c'est l'injection d'aberrations qui l'a
  // produite. Sur le jeu par défaut ce contrôle ne déclenche pas (les tirages sont déjà bornés) :
  // il rend l'invariant OBSERVABLE au lieu de le laisser reposer sur la construction.
  for (let i = 0; i < count; i += 1) {
    if (isPriceSentinelAbsolute(cols.priceEur[i] as number)) {
      cols.ingestFlags[i] = setIngestFlag(cols.ingestFlags[i] as number, 'PRICE_SENTINEL_ABSOLUTE');
      flagCounts[BIT_PRICE_SENTINEL_ABSOLUTE] = (flagCounts[BIT_PRICE_SENTINEL_ABSOLUTE] as number) + 1;
    }
    for (const field of BOUNDED_COLUMNS) {
      const col = cols[field] as { [k: number]: number };
      const value = col[i] as number;
      if (value === NUMERIC_UNKNOWN || isWithinListingBound(field, value)) continue;
      col[i] = NUMERIC_UNKNOWN;
      const bit = INGEST_FLAG_BIT[LISTING_BOUND_INGEST_FLAG[field] as IngestFlagCode];
      cols.ingestFlags[i] = (cols.ingestFlags[i] as number) | ((1 << bit) >>> 0);
      flagCounts[bit] = (flagCounts[bit] as number) + 1;
    }
  }

  // EX-DATA-15 / ARB-54 (DR-003, DR-004) : les doublons sont MESURÉS dans l'ordre total
  // d'ingestion — ici l'ordre des lignes — et non plus supposés absents.
  const duplicates = auditDuplicateListings(cols, count);
  if (duplicates.duplicateValueConflictCount > 0) {
    flagCounts[INGEST_FLAG_BIT.DUPLICATE_VALUE_CONFLICT] = duplicates.duplicateValueConflictCount;
  }

  const ingestFlagCounts: Record<string, number> = {};
  INGEST_FLAG_VALUES.forEach((def, b) => {
    const n = flagCounts[b] as number;
    if (n > 0) ingestFlagCounts[def.code] = n;
  });
  // EX-DATA-45 (dernier alinéa) : `FUEL_CATEGORY_FROM_FUEL_TYPE` et `HYBRID_CATEGORY_UNRESOLVED`
  // sont des SOUS-QUALIFICATIONS d'`ENUM_UNKNOWN`, « comptées dans le rapport d'ingestion mais non
  // dans le vocabulaire à 17 codes ». Elles rejoignent donc le rapport (EX-DATA-46) sans jamais
  // occuper un bit d'`ingestFlags` ni élargir `KYCAR_INGEST_FLAG` par la bande.
  if (fuelFallbackCount > 0) ingestFlagCounts.FUEL_CATEGORY_FROM_FUEL_TYPE = fuelFallbackCount;
  if (hybridUnresolvedCount > 0) ingestFlagCounts.HYBRID_CATEGORY_UNRESOLVED = hybridUnresolvedCount;

  return {
    cols,
    rowCount: count,
    snapshotId: options.snapshotId,
    outliers,
    quotedCount,
    onRequestCount,
    missingCount,
    makeIdx,
    modelIdx,
    versionRecipe,
    ageByRow,
    seed,
    taxonomy,
    dists: d,
    presentationDone: false,
    unknownCountByField: {
      priceEur: onRequestCount + missingCount,
      mileageKm: unknownMileage,
      powerKw: unknownPowerKw,
      modelYear: unknownModelYear,
      firstRegistrationYearMonth: unknownFrym,
      // EX-DATA-11 : catégorie de carburant laissée INCONNUE sur les hybrides non résolus.
      fuelCategory: hybridUnresolvedCount,
      // EX-DATA-35 : le lot colonnaire GELÉ (EX-DATA-119) n'a AUCUNE colonne `co2Source`. La
      // provenance de la mesure ne peut donc pas être portée par ligne : elle vaut `UNKNOWN` sur
      // 100 % du lot, et le rapport d'ingestion le DIT au lieu de laisser croire à une norme connue.
      co2Source: count,
    },
    ingestFlagCounts,
    rejectedByReason,
    duplicates,
  };
}

/**
 * `EX-DATA-14` (D8-16 / FV-20) — nombre d'annonces que la source a servies SANS deeplink et que
 * l'ingestion a rejetées. Le rejet est un ÉVÉNEMENT D'INGESTION : il porte sur des candidates de la
 * source, en amont du lot colonnaire, et se compte donc sans matérialiser une ligne qui, par
 * définition, n'existe pas dans le lot. Le compte est déterministe à graine fixe (hachage pur) et
 * proportionnel à la taille du lot demandé.
 */
function countRejectedSourceCandidates(seed: number, keptCount: number): number {
  let rejected = 0;
  const candidates = Math.round(keptCount * LISTING_URL_MISSING_RATE * 4);
  for (let k = 0; k < candidates; k += 1) {
    if (pureDraw(seed, HASH_DOMAIN_URL, k) < 0.25) rejected += 1;
  }
  return rejected;
}

/* ---- Génération : phase 1bis (colonnes de présentation, hors chemin critique) ------------------ */

/**
 * Remplit les colonnes que les AGRÉGATS DE BASE ne lisent jamais : carrosserie, boîte, transmission,
 * type d'offre, vendeur, palier publicitaire, couleurs, sellerie, région, pays, norme Euro, portes,
 * places, propriétaires, photos, émissions, consommation et autonomie (DR-049, §9.3 garde-fou 2).
 *
 * FLOT PSEUDO-ALÉATOIRE PROPRE : cette passe possède son propre `Prng`, dérivé de la graine du jeu de
 * données par une constante fixe. Elle ne consomme donc aucun tirage du flot du noyau — la différer
 * (ou l'exécuter deux fois) ne peut pas décaler la génération, et le résultat reste identique octet à
 * octet à graine égale. Les grandeurs dont elle a besoin (âge, carburant, puissance, état) sont lues
 * dans les colonnes déjà écrites par le noyau.
 */
function materializePresentation(core: CoreDataset): void {
  if (core.presentationDone) return;
  core.presentationDone = true;
  const { cols, rowCount, dists: d, ageByRow } = core;
  const prng = new Prng((core.seed ^ 0x50524553) >>> 0);

  const bodyIdx = d.body.indices;
  const bodyTable = d.bodyTable;
  const bodyShapeByByte = d.bodyShape;
  const transIdx = d.transmission.indices;
  const transTable = d.transmissionTable;
  const dtIdx = d.drivetrain.indices;
  const dtTable = d.drivetrainTable;
  const sellerIdx = d.seller.indices;
  const sellerTable = d.sellerTable;
  const adTierIdx = d.adTier.indices;
  const adTierTable = d.adTierTable;
  const colorIdx = d.color.indices;
  const colorTable = d.colorTable;
  const uphIdx = d.upholstery.indices;
  const uphTable = d.upholsteryTable;
  const regionIdx = d.region.indices;
  const regionTable = d.regionTable;
  const fuelIsBev = d.fuelIsBev;
  const fuelIsPhev = d.fuelIsPhev;
  const fuelCodeByByte = d.fuelCodeByByte;
  const euByYear = d.euByYear;

  for (let i = 0; i < rowCount; i += 1) {
    const age = ageByRow[i] as number;
    const fuelCategory = cols.fuelCategory[i] as number;
    const isBev = fuelIsBev[fuelCategory] === 1;
    const isPhev = fuelIsPhev[fuelCategory] === 1;
    const storedPower = cols.powerKw[i] as number;
    const powerKw = storedPower === NUMERIC_UNKNOWN ? 100 : storedPower;
    const isNew = (cols.usageState[i] as number) === d.usageN;

    // Type d'offre corrélé à l'âge (EX-DATA §A.1 `KYCAR_OFFER_TYPE`).
    let offerType: number;
    if (age === 0) {
      const r = prng.nextFloat();
      offerType = r < 0.5 ? d.offerN : r < 0.8 ? d.offerD : d.offerS;
    } else if (age <= 2) {
      const r = prng.nextFloat();
      offerType = r < 0.5 ? d.offerU : r < 0.9 ? d.offerJ : d.offerD;
    } else {
      offerType = prng.nextBool(0.95) ? d.offerU : d.offerJ;
    }

    const bodyType = bodyIdx[prng.pickTable(bodyTable)] as number;
    const bodyShape = bodyShapeByByte[bodyType] as number;

    let transmission: number;
    if (isBev) transmission = d.transmissionAutoIndex;
    else if (isPhev)
      transmission = prng.nextBool(0.85)
        ? d.transmissionAutoIndex
        : (transIdx[prng.pickTable(transTable)] as number);
    else transmission = transIdx[prng.pickTable(transTable)] as number;

    const drivetrain = dtIdx[prng.pickTable(dtTable)] as number;

    let co2X10: number;
    let consX10: number;
    let electricRangeKm: number;
    if (isBev) {
      co2X10 = 0;
      consX10 = NUMERIC_UNKNOWN;
      electricRangeKm = fuelCodeByByte[fuelCategory] === 'H' ? prng.nextInt(400, 700) : prng.nextInt(180, 560);
    } else if (isPhev) {
      const co2 = clamp(Math.round(powerKw * 0.15 + 25 + prng.nextGaussian() * 6), 10, 90);
      co2X10 = co2 * 10;
      consX10 = clamp(Math.round((co2 / 23.5) * 10), 8, 60);
      electricRangeKm = prng.nextInt(30, 90);
    } else {
      const base = fuelCodeByByte[fuelCategory] === 'D' ? powerKw * 0.55 + 95 : powerKw * 0.65 + 110;
      const co2 = clamp(Math.round(base + prng.nextGaussian() * 9), 30, 400);
      co2X10 = co2 * 10;
      consX10 = clamp(Math.round((co2 / 23.5) * 10), 30, 150);
      electricRangeKm = NUMERIC_UNKNOWN;
    }

    let doorCount: number;
    let seatCount: number;
    if (bodyShape === 2) {
      doorCount = prng.nextBool(0.6) ? 2 : 3;
      seatCount = prng.nextBool(0.7) ? 4 : 5;
    } else if (bodyShape === 1) {
      doorCount = prng.nextBool(0.6) ? 5 : 3;
      seatCount = 5;
    } else if (bodyShape === 3) {
      doorCount = 5;
      seatCount = prng.nextBool(0.6) ? 7 : 5;
    } else if (bodyShape === 4) {
      doorCount = prng.nextBool(0.5) ? 4 : 5;
      seatCount = prng.nextBool(0.5) ? 3 : 5;
    } else {
      doorCount = prng.nextBool(0.75) ? 5 : 4;
      seatCount = 5;
    }

    const previousOwnerCount =
      age === 0 && isNew ? 0 : clamp(Math.round(age / 4 + prng.nextGaussian() * 0.6), 0, 6);
    const imageCount = clamp(Math.round(14 + prng.nextGaussian() * 6), 0, 40);

    const sellerType = sellerIdx[prng.pickTable(sellerTable)] as number;
    const adTier =
      sellerType === d.sellerPrivate && prng.nextBool(0.92)
        ? d.adTierNone
        : (adTierIdx[prng.pickTable(adTierTable)] as number);
    let bodyColor = colorIdx[prng.pickTable(colorTable)] as number;
    // EX-DATA-120 (DR-037) : une couleur peut rester INCONNUE (sentinelle 255 d'une colonne énumérée).
    if (prng.nextBool(UNKNOWN_RATE_BODY_COLOR)) bodyColor = ENUM_UNKNOWN_BYTE;
    const upholsteryType = uphIdx[prng.pickTable(uphTable)] as number;
    const regionCode = regionIdx[prng.pickTable(regionTable)] as number;
    const modelYear = cols.modelYear[i] as number;

    cols.bodyType[i] = bodyType;
    cols.transmission[i] = transmission;
    cols.drivetrain[i] = drivetrain;
    cols.offerType[i] = offerType;
    cols.sellerType[i] = sellerType;
    cols.regionCode[i] = regionCode;
    cols.countryCode[i] = d.countryIndex;
    cols.adTier[i] = adTier;
    cols.bodyColor[i] = bodyColor;
    cols.upholsteryType[i] = upholsteryType;
    cols.euEmissionStandard[i] =
      modelYear === NUMERIC_UNKNOWN ? ENUM_UNKNOWN_BYTE : (euByYear[modelYear] ?? ENUM_UNKNOWN_BYTE);
    cols.doorCount[i] = doorCount;
    cols.seatCount[i] = seatCount;
    cols.previousOwnerCount[i] = previousOwnerCount;
    cols.imageCount[i] = imageCount;
    // D8-08 (EX-SCR-203 colonne « TVA », annexe A champ # 10 `isTaxDeductible`). Modèle de plausibilité :
    //   - un PARTICULIER ne facture pas la TVA — la colonne vaut « non » (`VAT_DEDUCTIBLE.NO`),
    //     jamais « oui », et jamais INCONNU (l'information est déductible du type de vendeur) ;
    //   - un PROFESSIONNEL vend une part de véhicules à TVA déductible (flottes, utilitaires,
    //     véhicules d'entreprise) et une part de véhicules « TVA marge » qui ne l'est pas ; une
    //     petite part d'annonces ne renseigne pas le champ, et reste INCONNUE (code `0`).
    // Tirage par HACHAGE PUR (note de déterminisme) : la passe de présentation garde son flot
    // pseudo-aléatoire intact, donc toutes les colonnes déjà mesurées par les sondes sont inchangées.
    if (sellerType === d.sellerPrivate) {
      cols.vatDeductible[i] = encodeVatDeductible(false);
    } else {
      const draw = pureDraw(core.seed, HASH_DOMAIN_VAT, i);
      cols.vatDeductible[i] =
        draw < VAT_UNKNOWN_SHARE_OF_PROS
          ? encodeVatDeductible(null)
          : encodeVatDeductible(draw < VAT_UNKNOWN_SHARE_OF_PROS + VAT_DEDUCTIBLE_SHARE_OF_PROS);
    }
    cols.co2EmissionsGPerKmX10[i] = co2X10;
    cols.consumptionCombinedL100KmX10[i] = consX10;
    cols.electricRangeKm[i] = electricRangeKm;
    cols.booleanFlags[i] = 0; // sémantique réservée à un lot ultérieur (aucun contrat D2).
  }
}

/* ---- Génération : phase 2 (zone de chaînes, hors chemin critique) ------------------------------ */

/** Reconstruit le texte de version d'une ligne à partir de sa recette et de ses colonnes. */
function buildVersionText(core: CoreDataset, i: number): { raw: string; clean: string } {
  const recipe = core.versionRecipe[i] as number;
  const tier = recipe >>> 6;
  const pick = recipe & 0x3f;
  const cols = core.cols;
  const fuelCode = core.dists.fuelCodeByByte[cols.fuelCategory[i] as number] ?? '';
  const powerKw = cols.powerKw[i] as number;
  const makeId = cols.makeId[i] as number;
  const modelId = cols.modelId[i] as number;
  const disp = clamp(Math.round((0.9 + (0.6 + hashToUnit(combineKeys(makeId, modelId + 7)) * 1.7) * 1.1) * 10) / 10, 1, 5);
  const badge = FUEL_BADGE[fuelCode] ?? '';
  const isElectric = fuelCode === 'E' || fuelCode === 'H';

  // PLAFOND D-30 : la puissance n'est écrite que sur les paliers longs. L'ajouter partout coûtait
  // ≈ 1 Mio de plus au lot sérialisé, pour une marge `EX-NFR-3` déjà réduite à 4,6 % avant DR-126.
  const withPower = tier >= VERSION_TIER_TRIM && powerKw !== NUMERIC_UNKNOWN;
  const head = isElectric
    ? `${powerKw === NUMERIC_UNKNOWN ? 'e' : `${powerKw} kW`} Electric`
    : `${disp.toFixed(1)}${badge === '' ? '' : ` ${badge}`}${withPower ? ` ${powerKw} kW` : ''}`;

  const parts: string[] = [head];
  if (tier >= VERSION_TIER_TRIM) parts.push(TRIM_WORDS[pick % TRIM_WORDS.length] as string);
  if (tier >= VERSION_TIER_PACK) parts.push(PACK_WORDS[pick % PACK_WORDS.length] as string);
  if (tier === VERSION_TIER_LONG) {
    parts.push(TECH_WORDS[pick % TECH_WORDS.length] as string);
    parts.push(GEARBOX_WORDS[pick % GEARBOX_WORDS.length] as string);
    parts.push(EXTRA_WORDS[pick % EXTRA_WORDS.length] as string);
    parts.push(EXTRA_WORDS[(pick + 3) % EXTRA_WORDS.length] as string);
  }
  const raw = parts.join(' ');
  // ARB-61 / EX-DATA-29 : la troncature à 80 points de code est appliquée par la couche D2, jamais
  // réécrite ici — c'est le point d'application que le lot n'avait pas (DR-025 → DR-126).
  return { raw, clean: cleanModelVersion(raw) };
}

/** Matérialise la zone de chaînes et fige le lot colonnaire (phase 2, DR-049). */
function materializeBatch(core: CoreDataset): ListingColumnBatch {
  materializePresentation(core);
  const { cols, rowCount, taxonomy, dists } = core;
  const perRowStrings: string[][] = new Array(rowCount);
  for (let i = 0; i < rowCount; i += 1) {
    const makeEntry = taxonomy.makeEntries[core.makeIdx[i] as number] as MakeEntry;
    const mdIdx = core.modelIdx[i] as number;
    const modelSlug = mdIdx < 0 ? 'modele-non-identifie' : ((makeEntry.modelSlugs[mdIdx] ?? 'modele') as string);
    const { raw, clean } = buildVersionText(core, i);
    perRowStrings[i] = [
      `https://www.autoscout24.be/fr/annonce/${makeEntry.slug}-${modelSlug}/${i}`,
      raw,
      clean,
      dists.fuelLabelByByte[cols.fuelCategory[i] as number] ?? '',
      '',
    ];
  }
  return finalizeBatch(cols, rowCount, perRowStrings, core.snapshotId, 'FULL');
}

/* ---- Injection des outliers -------------------------------------------------------------------- */

/**
 * Rend aberrant le prix d'une fraction déterministe des annonces à prix affiché, et émet la vérité
 * terrain. L'échantillon est réparti régulièrement sur les annonces cotées (couverture large des
 * marques). Les colonnes `priceEur` et `priceEvaluationCategory` sont modifiées en place.
 *
 * DEUX GARDES ajoutées par la remédiation :
 *   - DR-039 : un outlier `M2_*` n'est posé que dans une cellule `(marque, modèle)` d'effectif de
 *     prix ≥ 30 — le seuil d'applicabilité de M2 (EX-DATA-90). Hors de là, D4 ne peut PAS le
 *     détecter : la vérité terrain annoncerait une détection invérifiable par construction.
 *   - DR-123 : le rapport réel `injecté / juste prix` est recalculé APRÈS bornage ; si le plancher
 *     l'a écrasé hors de l'intervalle annoncé, la ligne est SAUTÉE plutôt que faussement étiquetée.
 */
function injectOutliers(
  cols: MutableColumns,
  rowCount: number,
  quotedRows: Int32Array,
  quotedFair: Int32Array,
  quotedCount: number,
  makeIdx: Int32Array,
  modelIdx: Int32Array,
  seed: number,
  rate: number,
  d: Dists,
): InjectedOutlier[] {
  const price = cols.priceEur;
  const evalCol = cols.priceEvaluationCategory;
  const target = Math.max(0, Math.round(quotedCount * rate));
  if (target === 0 || quotedCount === 0) return [];

  // Effectif de prix par cellule (marque, modèle) — connu seulement après la génération (DR-039).
  // Comptage DENSE sur les INDICES de taxonomie (`makeIdx`, `modelIdx`), bornés par construction :
  // un `Int32Array` remplace deux recherches de `Map` par ligne sur le chemin critique.
  const cellStride = MAX_MODELS_PER_MAKE + 1;
  const cellSize = new Int32Array((makeIdx.length === 0 ? 0 : 1 + maxOf(makeIdx)) * cellStride + cellStride);
  for (let i = 0; i < rowCount; i += 1) {
    if ((price[i] as number) === NUMERIC_UNKNOWN) continue;
    const c = (makeIdx[i] as number) * cellStride + (modelIdx[i] as number) + 1;
    cellSize[c] = (cellSize[c] as number) + 1;
  }

  const stride = Math.max(1, Math.floor(quotedCount / target));
  const prng = new Prng((seed ^ 0x0c1a5d3f) >>> 0);
  const flags: readonly OutlierFlag[] = ['M1_HIGH', 'M1_LOW', 'M2_HIGH', 'M2_LOW'];
  const evalHigh = d.priceEval['5'] as number;
  const evalLow = d.priceEval['1'] as number;
  /** Seuil d'applicabilité de M2 (EX-DATA-90). */
  const M2_MIN_CELL = 30;

  const out: InjectedOutlier[] = [];
  let k = 0;
  for (let q = 0; q < quotedCount && out.length < target; q += stride) {
    const rowIndex = quotedRows[q] as number;
    const fair = quotedFair[q] as number;
    const flag = flags[k % flags.length] as OutlierFlag;
    const isM2 = flag.startsWith('M2');
    if (isM2) {
      const c = (makeIdx[rowIndex] as number) * cellStride + (modelIdx[rowIndex] as number) + 1;
      if ((cellSize[c] as number) < M2_MIN_CELL) continue; // DR-039 : cellule inéligible, on saute.
    }
    let injected: number;
    switch (flag) {
      // M1 = anomalie ABSOLUE (prix absurde dans l'absolu, indépendant de la cellule) : au-delà de
      // toute fourchette de marché normale (500..300 000 €) — un simple garde global la repère.
      case 'M1_HIGH':
        injected = clamp(round50(prng.nextRange(500_000, 3_000_000)), 500, 4_999_950);
        break;
      case 'M1_LOW':
        // Plancher à 250 € : sous ce seuil l'annonce devient une SENTINELLE (EX-DATA-19(1)), sort de
        // `V_price` (EX-DATA-60) et n'est donc plus détectable par M1 — l'annoncer comme telle
        // serait une vérité terrain invérifiable par construction. Le cas « 1 € » d'ADV-04 est
        // injecté séparément (`PRICE_SENTINEL_INJECTION_RATE`).
        injected = clamp(round50(prng.nextRange(260, 480)), PRICE_SENTINEL_ABSOLUTE_EUR + 50, 500);
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
    const ratio = injected / fair;
    if (flag === 'M2_LOW' && (ratio > 0.25 || ratio < 0.13)) continue; // DR-123 : écart réel écrasé.
    if (flag === 'M2_HIGH' && ratio < 3) continue;
    k += 1;
    price[rowIndex] = injected;
    evalCol[rowIndex] = flag.endsWith('HIGH') ? evalHigh : evalLow;
    out.push({
      rowIndex,
      listingId: uuidToHex(cols.listingId, rowIndex * 16),
      makeId: cols.makeId[rowIndex] as number,
      modelId: cols.modelId[rowIndex] as number,
      method: flag.startsWith('M1') ? 'M1' : 'M2',
      flag,
      fairPriceEur: fair,
      injectedPriceEur: injected,
    });
  }

  // ADV-04 / ARB-15 : quelques annonces à prix DÉRISOIRE (1 à 249 €). Réparties sur des lignes que
  // l'injection d'outliers n'a pas touchées, elles ne figurent pas dans la vérité terrain.
  const injectedRows = new Set(out.map((o) => o.rowIndex));
  const sentinelTarget = Math.max(1, Math.round(quotedCount * PRICE_SENTINEL_INJECTION_RATE));
  const sentinelStride = Math.max(1, Math.floor(quotedCount / sentinelTarget));
  let placed = 0;
  for (let q = 3; q < quotedCount && placed < sentinelTarget; q += sentinelStride) {
    const rowIndex = quotedRows[q] as number;
    if (injectedRows.has(rowIndex)) continue;
    price[rowIndex] = prng.nextInt(1, PRICE_SENTINEL_ABSOLUTE_EUR - 1);
    placed += 1;
  }
  return out;
}
