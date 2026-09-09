/**
 * KYCAR — Adaptateur `as24 → canonique` (phase 3.3)
 * =================================================================================================
 * Fonction PURE qui applique, ligne à ligne, la table §3.1 de `docs/data/DATA-MODEL.md` : les
 * **82 champs** du dictionnaire, avec leur normalisation, leur validation, leur drapeau d'ingestion
 * et leur valeur par défaut. Elle est le SEUL endroit du dépôt qui connaisse la forme AutoScout24 ;
 * brancher une autre source, c'est écrire un autre module de ce dossier, pas toucher au moteur ni
 * aux écrans (DF-2 du PLAN-3).
 *
 * Ordre normatif (`EX-DATA-2`) : **garde R3, puis normalisation, puis validation.**
 *
 *   0. `scanForbiddenFields` sur l'objet REÇU — avant toute lecture de champ. Une ligne qui porte
 *      un nom de propriété interdit (E1..E17) est REJETÉE : elle n'est pas « filtrée », elle
 *      n'entre pas. C'est la mitigation STRUCTURELLE exigée par `00-CONTEXT.md`, et c'est ce que
 *      `data/schema/examples/invalid-r3.json` prouve.
 *   1. normalisation dans l'unité canonique (`EX-DATA-4`), arrondi ou troncature (`EX-DATA-6`),
 *      `EX-DATA-7` sur toute chaîne ;
 *   2. validation contre les bornes de l'annexe A, matérialisées UNE fois par
 *      `LISTING_NUMERIC_BOUNDS` / `LISTING_BOUND_INGEST_FLAG` (`src/types/validation.ts`, D-47) —
 *      aucune borne n'est recopiée ici.
 *
 * **Un drapeau n'est jamais une valeur** : le champ concerné prend INCONNU *en plus* du drapeau,
 * sauf mention contraire de la table (le prix sentinelle, lui, est CONSERVÉ — `ARB-15`).
 *
 * **Aucun code de drapeau n'est inventé.** `KYCAR_INGEST_FLAG` (`EX-DATA-45`) compte 17 codes et
 * l'encodage est positionnel (D-01/DR-013) : un code hors liste n'a pas de bit. La table §3.1
 * nomme pourtant quatre conditions (`CO2_ZERO_NON_BEV`, `HYBRID_INCONSISTENT`,
 * `HYBRID_CATEGORY_UNRESOLVED`, et `YEAR_OUT_OF_RANGE` pour # 24) que ce vocabulaire ne définit
 * pas — ce sont des codes d'ANOMALIE du manifest (`groundTruth`), pas des drapeaux d'ingestion.
 * L'adaptateur applique donc la CONSÉQUENCE écrite (valeur INCONNUE) et publie la condition dans
 * `notices`, que le provider agrège et déclare dans `coverageNote` : jamais en silence, jamais dans
 * un bit qui appartient à un autre code. Pour # 24, la borne d'année passe par le drapeau que la
 * table unique `LISTING_BOUND_INGEST_FLAG` associe à `modelYear`, `FIRST_REG_OUT_OF_RANGE`.
 */

import type {
  As24Listing,
  As24PublicPrice,
} from './types';
import type { As24CodeTables } from './vocab';
import { buildAs24CodeTables } from './vocab';
import {
  ISO_TO_MARKETPLACE_CODE,
  LISTING_ID_PATTERN,
  MARKETPLACE_CODE_TO_ISO,
  hostMatchesDomain,
  normalizeListingUrl,
  normalizeText,
  roundHalfAwayFromZero,
  truncateCodePoints,
  truncateDecimals,
} from './normalize';
import type { ReferenceData } from '../../../types/reference';
import { modelKey } from '../../../types/reference';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN, VAT_DEDUCTIBLE } from '../../../types/sentinels';
import {
  MODEL_VERSION_CLEAN_MAX,
  PRICE_SENTINEL_ABSOLUTE_EUR,
  HP_TO_KW,
  parseFirstRegistrationYearMonth,
  parseModelVersion,
} from '../../../types/shared-rules';
import {
  LISTING_BOUND_INGEST_FLAG,
  LISTING_STRING_BOUNDS,
  isWithinListingBound,
  scanForbiddenFields,
} from '../../../types/validation';
import { setBooleanFlag, setIngestFlag, type IngestFlagCode } from '../../../types/vocabularies';

/* ================================================================================================
 * 1. RÉSULTATS
 * ============================================================================================== */

/**
 * Motifs de REJET d'une annonce (`EX-DATA-46` : le rapport d'ingestion les compte par motif, ce qui
 * rend auditable ce que l'adaptateur n'a pas su servir). Chacun correspond à une ligne « REJET » de
 * la colonne « Si absent » de la table §3.1.
 */
export type As24RejectReason =
  /** La ligne n'est pas un objet JSON : le fichier n'est pas au format attendu. */
  | 'NOT_AN_OBJECT'
  /** R3 (§A.7, `EX-DATA-49`) : un nom de propriété interdit. La ligne n'entre pas. */
  | 'R3_FORBIDDEN_FIELD'
  /** # 1 — `id` absent ou hors de la forme UUID 8-4-4-4-12. */
  | 'LISTING_ID_INVALID'
  /** # 2 — `webPage` absent, illisible, ou hors du domaine `autoscout24.<tld>` (`EX-DATA-14`). */
  | 'LISTING_URL_INVALID'
  /** # 5 — `marketplace` hors de `KYCAR_MARKETPLACE`. */
  | 'MARKETPLACE_UNKNOWN'
  /** # 6 — `vehicleType` différent de `C` : le périmètre du produit est la voiture. */
  | 'VEHICLE_TYPE_NOT_CAR'
  /** # 16 — `make` absent de `taxonomy.json`. */
  | 'MAKE_UNKNOWN'
  /** # 74 — `location.countryCode` absent, mal formé, ou hors ISO-3166-1 alpha-2. */
  | 'COUNTRY_CODE_INVALID';

/**
 * Conditions DÉTECTÉES par l'adaptateur que `KYCAR_INGEST_FLAG` ne sait pas nommer (voir l'en-tête).
 * Publiées telles quelles, comptées par le provider, déclarées dans `coverageNote`.
 */
export const AS24_NOTICE_CODES = [
  /** # 49 — CO₂ à 0 g/km sur une catégorie autre qu'électrique (`DATA-MODEL` §7-18). */
  'CO2_ZERO_NON_BEV',
  /** # 46 — `isPluginHybrid` vrai hors des catégories `2`, `3`, `O` (§7-19). */
  'HYBRID_INCONSISTENT',
  /** # 42 — catégorie d'énergie absente et non résoluble depuis le type de carburant (`EX-DATA-11`). */
  'HYBRID_CATEGORY_UNRESOLVED',
  /** # 34 — kilométrage annualisé au-delà de 200 000 km/an (§7-22). */
  'MILEAGE_IMPLAUSIBLE_FOR_AGE',
  /** §7-17 — un champ `…WithFallback` contredit la valeur de la branche de mesure retenue. */
  'FALLBACK_VALUE_DIVERGENT',
] as const;

/** Une condition détectée hors du vocabulaire des drapeaux d'ingestion. */
export type As24NoticeCode = (typeof AS24_NOTICE_CODES)[number];

/**
 * Provenance de la mesure (`EX-DATA-35`), DÉRIVÉE par l'adaptateur (# 50, # 53). Elle ne franchit
 * pas l'interface v1 : `ListingColumnBatch` n'a aucune colonne pour la porter (dette D8-32,
 * statu quo déclaré par D3-08). L'adaptateur la calcule quand même — c'est ce qui rend la dette
 * mesurable au lieu d'être supposée — et le provider en publie la distribution dans `coverageNote`.
 */
export type MeasurementSource = 'WLTP' | 'NEDC' | 'UNKNOWN';

/**
 * Une annonce ADAPTÉE, prête à être écrite dans une ligne de `ListingColumnBatch`. Les valeurs
 * numériques et énumérées sont déjà ENCODÉES (sentinelles comprises : `-1` et `255`) ; l'assembleur
 * colonnaire n'a plus qu'à les recopier, sans décision.
 *
 * R3 : cette structure n'a AUCUN champ vendeur identifiant. `dealerBucket` (clé pseudonyme,
 * autorisée par D3-02) y figure parce que le dédoublonnage inter-vendeurs en a besoin, et il est
 * abandonné par l'assembleur — il n'a, par construction, aucune colonne où atterrir (écart E-02).
 */
export interface CanonicalRow {
  /** # 1, forme canonique minuscule. */
  readonly listingId: string;
  /** # 2, deeplink nettoyé. */
  readonly listingUrl: string;

  // --- Colonnes numériques (sentinelle -1) -----------------------------------------------------
  readonly priceEur: number;
  readonly mileageKm: number;
  readonly firstRegistrationYearMonth: number;
  readonly modelId: number;
  readonly makeId: number;
  readonly modelYear: number;
  readonly powerKw: number;
  readonly co2EmissionsGPerKmX10: number;
  readonly consumptionCombinedL100KmX10: number;
  readonly electricRangeKm: number;

  // --- Colonnes énumérées sur un octet (sentinelle 255) ----------------------------------------
  readonly fuelCategory: number;
  readonly bodyType: number;
  readonly transmission: number;
  readonly drivetrain: number;
  readonly offerType: number;
  readonly usageState: number;
  readonly sellerType: number;
  readonly regionCode: number;
  readonly countryCode: number;
  readonly priceStatus: number;
  readonly priceEvaluationCategory: number;
  readonly adTier: number;
  readonly bodyColor: number;
  readonly upholsteryType: number;
  readonly euEmissionStandard: number;
  readonly doorCount: number;
  readonly seatCount: number;
  readonly previousOwnerCount: number;
  readonly imageCount: number;
  /** Tri-état `VAT_DEDUCTIBLE` : 0 inconnu, 1 non, 2 oui (D8-08). */
  readonly vatDeductible: number;

  // --- Drapeaux de bits -------------------------------------------------------------------------
  /** Les dix booléens du dictionnaire (D3-10, `BOOLEAN_FLAG_BIT`). */
  readonly booleanFlags: number;
  /** Masque `KYCAR_INGEST_FLAG` (`EX-DATA-45`), encodage positionnel. */
  readonly ingestFlags: number;

  // --- Zone de chaînes, dans l'ordre gelé de `stringOffsets` -------------------------------------
  /** `[listingUrl, modelVersionRaw, modelVersionClean, fuelSourceLabelRaw, trimTokens]`. */
  readonly strings: readonly string[];

  // --- Hors interface : ce que l'adaptateur sait et que la v1 ne transporte pas -----------------
  /** Clé pseudonyme de regroupement vendeur (D3-02) — jamais une colonne (E-02). */
  readonly dealerBucket: string | null;
  /** # 50 — dette D8-32 / D3-08. */
  readonly co2Source: MeasurementSource;
  /** # 53 — dette D8-32 / D3-08. */
  readonly consumptionSource: MeasurementSource;
  /** Champs canoniques restés INCONNUS (`EX-DATA-46`, `unknownCountByField`). */
  readonly unknownFields: readonly string[];
  /** Conditions détectées hors du vocabulaire des drapeaux (voir `AS24_NOTICE_CODES`). */
  readonly notices: readonly As24NoticeCode[];
}

/** Verdict de l'adaptation d'une ligne : jamais une exception, toujours une décision nommée. */
export type As24AdaptResult =
  | { readonly kind: 'accepted'; readonly row: CanonicalRow }
  | { readonly kind: 'rejected'; readonly reason: As24RejectReason; readonly detail: string };

/* ================================================================================================
 * 2. CONTEXTE
 * ============================================================================================== */

/**
 * Ce que l'adaptateur a besoin de savoir du SNAPSHOT (et non de l'annonce) : la date d'observation,
 * qui borne les années (# 24, # 30, # 62) ; le marché ; les référentiels ; les tables de codes
 * pré-calculées.
 */
export interface As24AdapterContext {
  readonly ref: ReferenceData;
  readonly tables: As24CodeTables;
  /** `observedAt` (# 4) = `manifest.capturedAt`, ISO-8601. */
  readonly observedAt: string;
  readonly observedAtYear: number;
  /** `12·année + (mois−1)` de la capture, pour l'âge du véhicule (# 33). */
  readonly observedYearMonth: number;
  /**
   * Domaine ISO-3166-1 alpha-2 accepté pour # 74. `null` = contrôle dégradé à la FORME (deux
   * lettres majuscules) : le référentiel `Country.json` n'est pas chargé par l'application
   * (`REQUIRED_REFERENCE_FILES`), et exiger un fichier de plus au démarrage coûterait un aller
   * réseau sur le chemin critique d'`EX-NFR-9` pour un contrôle que le schéma source fait déjà à la
   * génération. Le provider DÉCLARE le régime retenu dans `coverageNote`.
   */
  readonly isoCountryCodes: ReadonlySet<string> | null;
  /** `EX-DATA-30` — liste d'arrêt promotionnelle versionnée (`ReferenceData.versionStoplist`). */
  readonly versionStoplist: readonly string[];
  /** `EX-DATA-29` étape 10 — lexique fermé des mentions de motorisation. */
  readonly versionDriveBadges: readonly string[];
}

/** Options de `createAs24Context`. */
export interface As24ContextOptions {
  readonly referenceData: ReferenceData;
  /** `manifest.capturedAt`. */
  readonly observedAt: string;
  /** Domaine ISO accepté pour # 74 ; omis = contrôle de forme seul (voir `isoCountryCodes`). */
  readonly isoCountryCodes?: ReadonlySet<string> | null;
  /** Tables de codes déjà construites (réutilisation entre snapshots d'un même profil). */
  readonly tables?: As24CodeTables;
}

/** Construit le contexte d'adaptation d'un snapshot (tables de codes comprises). */
export function createAs24Context(options: As24ContextOptions): As24AdapterContext {
  const observed = new Date(options.observedAt);
  const valid = Number.isFinite(observed.getTime());
  const year = valid ? observed.getUTCFullYear() : new Date().getUTCFullYear();
  const month = valid ? observed.getUTCMonth() : 0; // 0-based
  return {
    ref: options.referenceData,
    tables: options.tables ?? buildAs24CodeTables(options.referenceData),
    observedAt: options.observedAt,
    observedAtYear: year,
    observedYearMonth: 12 * year + month,
    isoCountryCodes: options.isoCountryCodes ?? null,
    versionStoplist: options.referenceData.versionStoplist,
    versionDriveBadges: options.referenceData.versionDriveBadges,
  };
}

/* ================================================================================================
 * 3. L'ADAPTATEUR
 * ============================================================================================== */

const reject = (reason: As24RejectReason, detail: string): As24AdaptResult => ({
  kind: 'rejected',
  reason,
  detail,
});

/** Accumulateur d'une ligne en cours d'adaptation : drapeaux, inconnus et signalements. */
class RowAccumulator {
  ingestFlags = 0;
  booleanFlags = 0;
  readonly unknown: string[] = [];
  readonly notices: As24NoticeCode[] = [];

  flag(code: IngestFlagCode): void {
    this.ingestFlags = setIngestFlag(this.ingestFlags, code);
  }

  notice(code: As24NoticeCode): void {
    if (!this.notices.includes(code)) this.notices.push(code);
  }

  /** Marque un champ canonique comme INCONNU (`EX-DATA-46`) et rend la sentinelle demandée. */
  unknownNumeric(field: string): number {
    this.unknown.push(field);
    return NUMERIC_UNKNOWN;
  }

  unknownEnum(field: string): number {
    this.unknown.push(field);
    return ENUM_UNKNOWN_BYTE;
  }
}

/**
 * Adapte une ligne source vers la couche canonique.
 *
 * @param raw ligne telle qu'elle sort du NDJSON — `unknown`, parce qu'un fichier n'obéit à aucun
 *   type : la garde R3 et les contrôles de forme s'appliquent AVANT toute lecture typée.
 * @param ctx contexte du snapshot (`createAs24Context`).
 */
export function adaptAs24Listing(raw: unknown, ctx: As24AdapterContext): As24AdaptResult {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return reject('NOT_AN_OBJECT', 'la ligne n’est pas un objet JSON');
  }

  // ---- Étape 0 : garde R3, AVANT toute adaptation (P-2, EX-NFR-26, EX-DATA-49) ------------------
  const forbidden = scanForbiddenFields(raw);
  if (forbidden.length > 0) {
    return reject(
      'R3_FORBIDDEN_FIELD',
      forbidden.map((i) => i.path).join(', '),
    );
  }

  const src = raw as As24Listing;
  const acc = new RowAccumulator();
  const t = ctx.tables;

  // ---- # 1 `listingId` : REJET si la forme n'est pas l'UUID canonique ---------------------------
  const listingId = (normalizeText(src.id) ?? '').toLowerCase();
  if (!LISTING_ID_PATTERN.test(listingId)) {
    return reject('LISTING_ID_INVALID', `id « ${String(src.id)} »`);
  }

  // ---- # 2 `listingUrl` : REJET hors du domaine attendu (EX-DATA-14) ----------------------------
  const { url: listingUrl, host } = normalizeListingUrl(src.webPage);
  if (listingUrl === null || !hostMatchesDomain(host)) {
    return reject('LISTING_URL_INVALID', `webPage « ${String(src.webPage)} »`);
  }

  // ---- # 5 `marketplace` : REJET hors vocabulaire -----------------------------------------------
  const marketplaceCode = (normalizeText(src.marketplace as string) ?? '').toLowerCase();
  if (t.get('KYCAR_MARKETPLACE')?.has(marketplaceCode) !== true) {
    return reject('MARKETPLACE_UNKNOWN', `marketplace « ${String(src.marketplace)} »`);
  }

  // ---- # 6 `vehicleType` : REJET si ce n'est pas une voiture ------------------------------------
  const vehicleType = (normalizeText(src.vehicleType) ?? '').toUpperCase();
  if (vehicleType !== 'C') {
    return reject('VEHICLE_TYPE_NOT_CAR', `vehicleType « ${String(src.vehicleType)} »`);
  }

  // ---- # 16 / # 17 `makeId` / `makeName` : REJET hors taxonomie ---------------------------------
  const makeId = Number.isInteger(src.make) ? (src.make as number) : Number.NaN;
  const make = ctx.ref.makeById.get(makeId);
  if (make === undefined || make.label.length === 0) {
    return reject('MAKE_UNKNOWN', `make « ${String(src.make)} » absent de taxonomy.json`);
  }

  // ---- # 74 `countryCode` : REJET hors ISO ; traduction obligatoire d'un code de marché ---------
  const countryRaw = (normalizeText(src.location?.countryCode) ?? '').toUpperCase();
  const countryIso = MARKETPLACE_CODE_TO_ISO[countryRaw] ?? countryRaw;
  const isoWellFormed = /^[A-Z]{2}$/.test(countryIso);
  const isoKnown =
    ctx.isoCountryCodes === null ? isoWellFormed : ctx.isoCountryCodes.has(countryIso);
  if (!isoWellFormed || !isoKnown) {
    return reject('COUNTRY_CODE_INVALID', `countryCode « ${String(src.location?.countryCode)} »`);
  }
  // La colonne `countryCode` est adossée au vocabulaire `KYCAR_MARKETPLACE` (convention D3) : un
  // pays ISO valide hors des neuf marchés n'a pas de place dans l'octet. INCONNU, jamais un code
  // inventé, et compté comme tel.
  const marketplaceForCountry = ISO_TO_MARKETPLACE_CODE[countryIso];
  const countryCode =
    marketplaceForCountry === undefined
      ? acc.unknownEnum('countryCode')
      : (t.get('KYCAR_MARKETPLACE')?.index(marketplaceForCountry) ?? acc.unknownEnum('countryCode'));

  /* ---- PRIX (# 7 à # 15) --------------------------------------------------------------------- */

  const pub: As24PublicPrice = src.prices?.public ?? {};

  // # 7 `priceEur` — arrondi à l'euro ; hors borne haute → INCONNU + PRICE_OUT_OF_RANGE ;
  // sous le seuil absolu → drapeau MAIS valeur CONSERVÉE (ARB-15 : l'annonce reste comptée).
  let priceEur: number;
  if (typeof pub.price === 'number' && Number.isFinite(pub.price)) {
    const rounded = roundHalfAwayFromZero(pub.price);
    if (!isWithinListingBound('priceEur', rounded)) {
      acc.flag(LISTING_BOUND_INGEST_FLAG['priceEur'] as IngestFlagCode);
      priceEur = acc.unknownNumeric('priceEur');
    } else {
      priceEur = rounded;
      if (rounded < PRICE_SENTINEL_ABSOLUTE_EUR) acc.flag('PRICE_SENTINEL_ABSOLUTE');
    }
  } else {
    priceEur = acc.unknownNumeric('priceEur');
  }

  // # 9 `priceOnRequestOnly` — DÉFAUT `false`, porté par `booleanFlags` (D3-10).
  const onRequestOnly = pub.onRequestOnly === true;
  acc.booleanFlags = setBooleanFlag(acc.booleanFlags, 'priceOnRequestOnly', onRequestOnly);

  // # 8 `priceStatus` — DÉRIVÉ, exhaustif par construction.
  const priceKnown = priceEur !== NUMERIC_UNKNOWN;
  let priceStatusCode: string;
  if (priceKnown) {
    priceStatusCode = 'QUOTED';
    // EX-DATA-32 : un montant ET le drapeau « sur demande » est licite, mais jamais muet.
    if (onRequestOnly) acc.flag('PRICE_ON_REQUEST_WITH_AMOUNT');
  } else if (onRequestOnly) {
    priceStatusCode = 'ON_REQUEST';
  } else {
    priceStatusCode = 'MISSING';
    // EX-DATA-18 : prix absent SANS déclaration est un défaut d'extraction, pas une décision.
    if (pub.price === undefined) acc.flag('PRICE_MISSING_UNDECLARED');
  }
  const priceStatus =
    t.get('KYCAR_PRICE_STATUS')?.index(priceStatusCode) ?? acc.unknownEnum('priceStatus');

  // # 10 `isTaxDeductible` → colonne tri-état `vatDeductible` (D8-08).
  const vatDeductible =
    pub.isTaxDeductible === undefined
      ? ((): number => {
          acc.unknown.push('vatDeductible');
          return VAT_DEDUCTIBLE.UNKNOWN;
        })()
      : pub.isTaxDeductible
        ? VAT_DEDUCTIBLE.YES
        : VAT_DEDUCTIBLE.NO;

  // # 11 `priceEvaluationCategory` — projection 3 → 6 niveaux (EX-DATA-12) ; DÉFAUT `0` (Inconnu).
  let priceEvaluationCategory: number;
  const evalCategory = pub.evaluation?.category;
  if (evalCategory === undefined) {
    priceEvaluationCategory = t.get('KYCAR_PRICE_EVALUATION')?.index('0') ?? ENUM_UNKNOWN_BYTE;
    acc.unknown.push('priceEvaluationCategory');
  } else {
    const projected = String(evalCategory);
    const idx = t.get('KYCAR_PRICE_EVALUATION')?.index(projected) ?? null;
    if (idx === null) {
      acc.flag('ENUM_UNKNOWN');
      priceEvaluationCategory = acc.unknownEnum('priceEvaluationCategory');
    } else {
      priceEvaluationCategory = idx;
    }
  }

  // # 12 `isSuperDeal` — DÉFAUT `false`.
  acc.booleanFlags = setBooleanFlag(acc.booleanFlags, 'isSuperDeal', src.superDeal === true);

  // # 13 `netPriceEur`, # 14 `vatRatePercent`, # 15 `msrpEur` — validés, non transportés (E-07).
  // Ils sont VALIDÉS quand même : une valeur incohérente doit être comptée comme inconnue dans le
  // rapport d'ingestion, sans quoi `unknownCountByField` décrirait une couverture qui n'existe pas.
  if (pub.netPrice === undefined || !(pub.netPrice >= 1 && priceKnown && pub.netPrice < priceEur)) {
    acc.unknown.push('netPriceEur');
  }
  if (pub.vatRate === undefined || truncateDecimals(pub.vatRate, 1) < 0 || pub.vatRate > 100) {
    acc.unknown.push('vatRatePercent');
  }
  const msrp = src.prices?.manufacturersSuggestedRetail?.price;
  if (msrp === undefined || !isWithinListingBound('priceEur', roundHalfAwayFromZero(msrp))) {
    acc.unknown.push('msrpEur');
  }

  /* ---- TAXONOMIE ET VERSION (# 18 à # 24) ----------------------------------------------------- */

  // # 18 `modelId` — le modèle doit appartenir à la marque, sinon `0` + MODEL_UNRESOLVED.
  let modelId = 0;
  if (Number.isInteger(src.model) && ctx.ref.modelByKey.has(modelKey(makeId, src.model as number))) {
    modelId = src.model as number;
  } else {
    acc.flag('MODEL_UNRESOLVED');
    acc.unknown.push('modelId');
  }

  // # 20 `modelVersionRaw` — EX-DATA-7 puis troncature à 121 points de code.
  const versionRawText = normalizeText(src.modelVersion);
  const modelVersionRaw =
    versionRawText === null
      ? ''
      : truncateCodePoints(versionRawText, LISTING_STRING_BOUNDS['modelVersionRaw'] as number);
  if (modelVersionRaw === '') acc.unknown.push('modelVersionRaw');

  // # 21 `modelVersionClean` et # 22 `trimTokens` — pipeline EX-DATA-29 (étapes 1-6 puis 7).
  const parsedVersion = parseModelVersion(modelVersionRaw === '' ? null : modelVersionRaw, {
    stoplist: ctx.versionStoplist,
    tokenStoplist: ctx.versionStoplist,
    driveBadgeLexicon: ctx.versionDriveBadges,
  });
  const modelVersionClean = truncateCodePoints(parsedVersion.clean, MODEL_VERSION_CLEAN_MAX);
  if (modelVersionRaw !== '' && modelVersionClean === '') {
    // EX-DATA-31 : le nettoyage a tout retiré d'une version pourtant servie.
    acc.flag('VERSION_FULLY_STRIPPED');
  }
  if (modelVersionClean === '') acc.unknown.push('modelVersionClean');
  if (parsedVersion.trimTokens.length === 0) acc.unknown.push('trimTokens');
  // # 23 `badgeDisplacementL` — dérivé, sans colonne : compté seulement.
  if (parsedVersion.badgeDisplacementL === null) acc.unknown.push('badgeDisplacementL');

  // # 24 `modelYear` — borne haute `observedAt.year + 1` (annexe A).
  let modelYear: number;
  if (Number.isInteger(src.productionYear)) {
    const y = src.productionYear as number;
    if (y >= 1900 && y <= ctx.observedAtYear + 1) {
      modelYear = y;
    } else {
      // La table §3.1 nomme ici `YEAR_OUT_OF_RANGE`, absent d'`EX-DATA-45`. La table UNIQUE des
      // drapeaux de borne (D-47) associe `modelYear` à `FIRST_REG_OUT_OF_RANGE` : on la suit,
      // plutôt que d'inventer un 18ᵉ code qui n'aurait aucun bit.
      acc.flag(LISTING_BOUND_INGEST_FLAG['modelYear'] as IngestFlagCode);
      modelYear = acc.unknownNumeric('modelYear');
    }
  } else {
    modelYear = acc.unknownNumeric('modelYear');
  }

  /* ---- ÉTAT ET DATES (# 25 à # 34, # 59 à # 63) ------------------------------------------------ */

  const offerTypeCode = (normalizeText(src.offerType) ?? '').toUpperCase();
  const offerType =
    offerTypeCode === ''
      ? acc.unknownEnum('offerType')
      : (t.get('KYCAR_OFFER_TYPE')?.index(offerTypeCode) ?? acc.unknownEnum('offerType'));

  const usageStateCode = (normalizeText(src.usageState) ?? '').toUpperCase();
  const usageState =
    usageStateCode === ''
      ? acc.unknownEnum('usageState')
      : (t.get('KYCAR_USAGE_STATE')?.index(usageStateCode) ?? acc.unknownEnum('usageState'));

  // # 27, # 29 — booléens portés par `booleanFlags` (D3-10).
  acc.booleanFlags = setBooleanFlag(acc.booleanFlags, 'hadAccident', src.condition?.hadAccident ?? null);
  if (src.condition?.hadAccident === undefined) acc.unknown.push('hadAccident');
  acc.booleanFlags = setBooleanFlag(acc.booleanFlags, 'isNewListing', src.publication?.isNew === true);
  // # 28 `publicationState` — conservé hors interface, jamais un filtre (domaine inconnu, H-02).
  if (normalizeText(src.publication?.accurateState) === null) acc.unknown.push('publicationState');

  // # 30 `firstRegistrationYearMonth` — EX-DATA-23 (parsing) PUIS borne d'annexe A (deux étages).
  const firstReg = parseFirstRegistrationYearMonth(src.firstRegistrationDate, acc.ingestFlags);
  acc.ingestFlags = firstReg.ingestFlags;
  let firstRegistrationYearMonth = firstReg.encoded;
  if (firstRegistrationYearMonth !== NUMERIC_UNKNOWN) {
    const min = 12 * 1900; // 1900-01
    const max = 12 * (ctx.observedAtYear + 1) + 11; // (observedAt.year + 1)-12
    if (firstRegistrationYearMonth < min || firstRegistrationYearMonth > max) {
      acc.flag('FIRST_REG_OUT_OF_RANGE');
      firstRegistrationYearMonth = acc.unknownNumeric('firstRegistrationYearMonth');
    }
  } else {
    acc.unknown.push('firstRegistrationYearMonth');
  }

  // # 33 `vehicleAgeMonths` — dérivé (# 30 et # 4), sans colonne ; sert au contrôle # 34.
  const ageMonths =
    firstRegistrationYearMonth === NUMERIC_UNKNOWN
      ? null
      : ctx.observedYearMonth - firstRegistrationYearMonth;
  const ageValid = ageMonths !== null && ageMonths >= 0 && ageMonths <= 1500;
  if (!ageValid) acc.unknown.push('vehicleAgeMonths');

  // # 59 `mileageKm` — garde d'unité (EX-DATA-5) AVANT la borne, puis les deux cas d'EX-DATA-38.
  let mileageKm: number;
  if (src.mileageUnit !== undefined && src.mileageUnit !== 'km') {
    acc.flag('UNIT_UNSUPPORTED');
    mileageKm = acc.unknownNumeric('mileageKm');
  } else if (Number.isFinite(src.mileage)) {
    const m = roundHalfAwayFromZero(src.mileage as number);
    if (!isWithinListingBound('mileageKm', m)) {
      acc.flag(LISTING_BOUND_INGEST_FLAG['mileageKm'] as IngestFlagCode);
      mileageKm = acc.unknownNumeric('mileageKm');
    } else {
      mileageKm = m;
      if (m === 0 && !['N', 'S', 'D'].includes(offerTypeCode)) acc.flag('SUSPECT_ZERO_MILEAGE');
    }
  } else {
    mileageKm = acc.unknownNumeric('mileageKm');
  }

  // # 34 `mileagePerYearKm` — dérivé, sans colonne ; au-delà de la borne, signalement §7-22.
  if (mileageKm !== NUMERIC_UNKNOWN && ageValid) {
    const perYear = roundHalfAwayFromZero((mileageKm * 12) / Math.max(ageMonths as number, 6));
    if (perYear > 200_000) {
      acc.notice('MILEAGE_IMPLAUSIBLE_FOR_AGE');
      acc.unknown.push('mileagePerYearKm');
    }
  } else {
    acc.unknown.push('mileagePerYearKm');
  }

  // # 60 `previousOwnerCount` (0..99), # 65 `doorCount` (1..9), # 66 `seatCount` (1..99),
  // # 80 `imageCount` (0..50, plafonné) : entiers stockés tels quels dans un octet, 255 = INCONNU.
  const previousOwnerCount = boundedByte(src.previousOwnerCount, 'previousOwnerCount', acc);
  const doorCount = boundedByte(src.doorCount, 'doorCount', acc);
  const seatCount = boundedByte(src.seatCount, 'seatCount', acc);
  const imageCount =
    src.imageCount === undefined
      ? 0 // DÉFAUT `0` (annexe A # 80) : aucune image déclarée, ce n'est pas un inconnu.
      : Math.min(Math.max(Math.trunc(src.imageCount), 0), 50);

  // # 61, # 63, # 68, # 58, # 46 — tri-états portés par `booleanFlags`.
  for (const [code, value, field] of [
    ['hasFullServiceHistory', src.hasFullServiceHistory, 'hasFullServiceHistory'],
    ['wasCabOrRental', src.wasCabOrRental, 'wasCabOrRental'],
    ['isMetallic', src.isMetallic, 'isMetallic'],
    ['hasParticleFilter', src.hasParticleFilter, 'hasParticleFilter'],
  ] as const) {
    acc.booleanFlags = setBooleanFlag(acc.booleanFlags, code, value ?? null);
    if (value === undefined) acc.unknown.push(field);
  }
  // # 81 `hasVideo` — DÉFAUT `false` (aucune URL de média n'existe : E19).
  acc.booleanFlags = setBooleanFlag(acc.booleanFlags, 'hasVideo', src.hasVideo === true);

  /* ---- MOTORISATION (# 35 à # 48) ------------------------------------------------------------- */

  // # 35 `powerKw` — l'unité canonique est le kW ; toute autre unité est REFUSÉE, jamais convertie
  // au jugé (EX-DATA-5).
  let powerKw: number;
  if (src.powerUnit !== undefined && src.powerUnit !== 'kW') {
    acc.flag('UNIT_UNSUPPORTED');
    powerKw = acc.unknownNumeric('powerKw');
  } else if (Number.isFinite(src.power)) {
    const p = roundHalfAwayFromZero(src.power as number);
    if (!isWithinListingBound('powerKw', p)) {
      acc.flag(LISTING_BOUND_INGEST_FLAG['powerKw'] as IngestFlagCode);
      powerKw = acc.unknownNumeric('powerKw');
    } else {
      powerKw = p;
    }
  } else {
    powerKw = acc.unknownNumeric('powerKw');
  }

  // # 36 `powerHp` — TOUJOURS recalculé depuis `powerKw` (EX-DATA-36, DIN 66036) ; la valeur source
  // ne sert QU'AU CONTRÔLE. Un écart > 2 % dit que la source s'est trompée d'unité.
  if (powerKw !== NUMERIC_UNKNOWN && typeof src.powerHp === 'number' && src.powerHp > 0) {
    const derived = roundHalfAwayFromZero(powerKw / HP_TO_KW);
    if (Math.abs(derived - src.powerHp) / src.powerHp > 0.02) acc.flag('POWER_UNIT_MISMATCH');
  }
  if (powerKw === NUMERIC_UNKNOWN) acc.unknown.push('powerHp');

  // # 37 à # 39 — validés, non transportés.
  if (!inRange(src.cylinderCapacity, 1, 99_999) || (src.cylinderCapacityUnit !== undefined && src.cylinderCapacityUnit !== 'ccm')) {
    if (src.cylinderCapacityUnit !== undefined && src.cylinderCapacityUnit !== 'ccm') acc.flag('UNIT_UNSUPPORTED');
    acc.unknown.push('cylinderCapacityCcm');
  }
  if (!inRange(src.cylinderCount, 1, 99)) acc.unknown.push('cylinderCount');
  if (!inRange(src.gearCount, 1, 9)) acc.unknown.push('gearCount');

  const transmissionCode = (normalizeText(src.transmission) ?? '').toUpperCase();
  const transmission =
    transmissionCode === ''
      ? acc.unknownEnum('transmission')
      : (t.get('KYCAR_TRANSMISSION')?.index(transmissionCode) ?? acc.unknownEnum('transmission'));

  const drivetrainCode = (normalizeText(src.drivetrain) ?? '').toUpperCase();
  const drivetrain =
    drivetrainCode === ''
      ? acc.unknownEnum('drivetrain')
      : (t.get('KYCAR_DRIVETRAIN')?.index(drivetrainCode) ?? acc.unknownEnum('drivetrain'));

  // # 43 `fuelTypePrimary` — entier → chaîne, vocabulaire DISTINCT de la catégorie (EX-DATA-9).
  const fuelTypeTable = t.get('KYCAR_FUEL_TYPE');
  const primaryFuelCode =
    src.primaryFuelType === undefined ? null : String(src.primaryFuelType);
  const primaryFuelKnown = primaryFuelCode !== null && fuelTypeTable?.has(primaryFuelCode) === true;
  if (!primaryFuelKnown) acc.unknown.push('fuelTypePrimary');

  // # 42 `fuelCategory` — les codes alphabétiques passent en majuscules ; `2` et `3` restent des
  // CHAÎNES. Absente, elle se replie sur le type de carburant (EX-DATA-10) ; un hybride non
  // résoluble est signalé (EX-DATA-11), jamais deviné.
  const fuelCategoryTable = t.get('KYCAR_FUEL_CATEGORY');
  let fuelCategoryCode = normalizeText(src.fuelCategory) ?? '';
  if (/^[a-z]$/i.test(fuelCategoryCode)) fuelCategoryCode = fuelCategoryCode.toUpperCase();
  let fuelCategory: number;
  if (fuelCategoryCode !== '' && fuelCategoryTable?.has(fuelCategoryCode) === true) {
    fuelCategory = fuelCategoryTable.index(fuelCategoryCode) as number;
  } else {
    if (fuelCategoryCode !== '') acc.flag('ENUM_UNKNOWN');
    // `EX-DATA-11` : le repli d'`EX-DATA-10` est INAPPLICABLE à un hybride rechargeable. Le type de
    // carburant PRIMAIRE d'un hybride est, par construction, son carburant thermique : le lire comme
    // une catégorie classerait une hybride rechargeable essence en `B` (« Essence ») dans tous les
    // filtres et toutes les distributions, au lieu de `2` (« Électrique/Essence »). Un carburant
    // primaire ne peut pas dire si la catégorie vaut `2`, `3` ou `O` — c'est exactement le cas que
    // le dictionnaire déclare NON RÉSOLUBLE, et deviner y serait pire que l'INCONNU.
    const hybridBlocksFallback = src.isPluginHybrid === true;
    const fallback =
      primaryFuelKnown && !hybridBlocksFallback ? FUEL_TYPE_TO_CATEGORY[primaryFuelCode as string] : undefined;
    if (fallback !== undefined && fuelCategoryTable?.has(fallback) === true) {
      fuelCategory = fuelCategoryTable.index(fallback) as number;
      fuelCategoryCode = fallback;
    } else {
      if (hybridBlocksFallback) acc.notice('HYBRID_CATEGORY_UNRESOLVED');
      fuelCategoryCode = '';
      fuelCategory = acc.unknownEnum('fuelCategory');
    }
  }

  // # 44 `fuelTypesAdditional`, # 47, # 48 — validés, non transportés.
  if ((src.additionalFuelTypes ?? []).filter((c) => fuelTypeTable?.has(String(c)) === true).length === 0) {
    acc.unknown.push('fuelTypesAdditional');
  }
  if (src.battery?.ownershipType === undefined || t.get('KYCAR_BATTERY_OWNERSHIP')?.has(src.battery.ownershipType) !== true) {
    acc.unknown.push('batteryOwnership');
  }
  if (src.battery?.capacityUnit !== undefined && src.battery.capacityUnit !== 'kWh') acc.flag('UNIT_UNSUPPORTED');
  if (src.battery?.capacity === undefined || !inRange(truncateDecimals(src.battery.capacity, 1), 0.1, 500)) {
    acc.unknown.push('batteryCapacityKwh');
  }

  // # 45 `fuelSourceLabelRaw` — conservé tel quel, JAMAIS décodé vers un code (EX-DATA-37).
  const fuelSourceLabelText = normalizeText(src.fuelSourceLabel);
  const fuelSourceLabelRaw =
    fuelSourceLabelText === null
      ? ''
      : truncateCodePoints(fuelSourceLabelText, LISTING_STRING_BOUNDS['fuelSourceLabelRaw'] as number);
  if (fuelSourceLabelRaw === '') acc.unknown.push('fuelSourceLabelRaw');

  // # 46 `isPluginHybrid` — tri-état + contrôle de cohérence §7-19.
  acc.booleanFlags = setBooleanFlag(acc.booleanFlags, 'isPluginHybrid', src.isPluginHybrid ?? null);
  if (src.isPluginHybrid === undefined) acc.unknown.push('isPluginHybrid');
  // §7-19 vise une catégorie qui CONTREDIT `isPluginHybrid`, pas une catégorie ABSENTE : quand elle
  // est restée INCONNUE, la contradiction n'est pas établie et c'est `HYBRID_CATEGORY_UNRESOLVED`
  // (déjà signalé plus haut) qui décrit la situation. Signaler les deux ferait compter deux fois la
  // même annonce dans deux diagnostics distincts.
  if (src.isPluginHybrid === true && fuelCategoryCode !== '' && !['2', '3', 'O'].includes(fuelCategoryCode)) {
    acc.notice('HYBRID_INCONSISTENT');
  }

  /* ---- MESURE : CO₂ ET CONSOMMATION (# 49 à # 57) ---------------------------------------------- */

  // Priorité normative `wltp > NEDC > …WithFallback`, qui détermine AUSSI la provenance (# 50/# 53).
  const co2Picked = pickMeasurement(
    src.wltp?.co2EmissionsCombined,
    src.co2Emissions,
    src.co2EmissionInGramPerKmWithFallback,
  );
  const co2Source = co2Picked.source;
  let co2EmissionsGPerKmX10: number;
  if (src.co2EmissionsUnit !== undefined && src.co2EmissionsUnit !== 'g/km') {
    acc.flag('UNIT_UNSUPPORTED');
    co2EmissionsGPerKmX10 = acc.unknownNumeric('co2EmissionsGPerKm');
  } else if (co2Picked.value !== null) {
    const c = truncateDecimals(co2Picked.value, 1);
    if (!isWithinListingBound('co2EmissionsGPerKm', c)) {
      co2EmissionsGPerKmX10 = acc.unknownNumeric('co2EmissionsGPerKm');
    } else if (c === 0 && fuelCategoryCode !== 'E') {
      // §7-18 : un 0 g/km hors électrique est une anomalie déclarée, pas une mesure.
      acc.notice('CO2_ZERO_NON_BEV');
      co2EmissionsGPerKmX10 = acc.unknownNumeric('co2EmissionsGPerKm');
    } else {
      co2EmissionsGPerKmX10 = Math.round(c * 10);
    }
  } else {
    co2EmissionsGPerKmX10 = acc.unknownNumeric('co2EmissionsGPerKm');
  }
  if (co2Picked.divergentFallback) acc.notice('FALLBACK_VALUE_DIVERGENT');

  const consumptionPicked = pickMeasurement(
    src.wltp?.consumptionCombined,
    src.consumption?.combined,
    src.consumptionCombinedWithFallback,
  );
  const consumptionSource = consumptionPicked.source;
  let consumptionCombinedL100KmX10: number;
  if (src.combinedUnit !== undefined && src.combinedUnit !== 'l/100km') {
    acc.flag('UNIT_UNSUPPORTED');
    consumptionCombinedL100KmX10 = acc.unknownNumeric('consumptionCombinedL100Km');
  } else if (consumptionPicked.value !== null) {
    const v = truncateDecimals(consumptionPicked.value, 1);
    consumptionCombinedL100KmX10 = isWithinListingBound('consumptionCombinedL100Km', v)
      ? Math.round(v * 10)
      : acc.unknownNumeric('consumptionCombinedL100Km');
  } else {
    consumptionCombinedL100KmX10 = acc.unknownNumeric('consumptionCombinedL100Km');
  }
  if (consumptionPicked.divergentFallback) acc.notice('FALLBACK_VALUE_DIVERGENT');

  // # 52 — validé, non transporté ; le champ WLTP prime sur le champ déprécié.
  const electricConsumption = src.wltp?.consumptionElectricCombined ?? src.consumption?.electricCombined;
  if (electricConsumption === undefined || !inRange(truncateDecimals(electricConsumption, 1), 0.1, 99.9)) {
    acc.unknown.push('consumptionElectricKwh100Km');
  }

  const euCode = normalizeText(src.euEmissionStandard) ?? '';
  const euEmissionStandard =
    euCode === ''
      ? acc.unknownEnum('euEmissionStandard')
      : (t.get('KYCAR_EU_EMISSION_STANDARD')?.index(euCode) ?? acc.unknownEnum('euEmissionStandard'));

  // # 55 `co2Class` (branche WLTP seule) et # 56 `efficiencyClass` (branche NEDC seule) — validés,
  // non transportés (E-07).
  if (src.wltp?.co2Class === undefined || t.get('KYCAR_CO2_CLASS')?.has(String(src.wltp.co2Class)) !== true) {
    acc.unknown.push('co2Class');
  }
  if (src.efficiencyClass === undefined || t.get('KYCAR_EFFICIENCY_CLASS')?.has(String(src.efficiencyClass)) !== true) {
    acc.unknown.push('efficiencyClass');
  }

  // # 57 `electricRangeKm`.
  let electricRangeKm: number;
  if (Number.isFinite(src.electricRange) && isWithinListingBound('electricRangeKm', src.electricRange as number)) {
    electricRangeKm = Math.trunc(src.electricRange as number);
  } else {
    electricRangeKm = acc.unknownNumeric('electricRangeKm');
  }

  /* ---- CARROSSERIE ET FINITION (# 64 à # 73) --------------------------------------------------- */

  const bodyType = enumFromInteger(src.bodyType, 'KYCAR_BODY_TYPE', 'bodyType', t, acc, true);
  const bodyColor = enumFromInteger(src.bodyColor, 'KYCAR_BODY_COLOR', 'bodyColor', t, acc, false);
  if (src.upholsteryColor === undefined || t.get('KYCAR_UPHOLSTERY_COLOR')?.has(String(src.upholsteryColor)) !== true) {
    acc.unknown.push('upholsteryColor');
  }
  const upholsteryCode = (normalizeText(src.upholsteryType) ?? '').toUpperCase();
  const upholsteryType =
    upholsteryCode === ''
      ? acc.unknownEnum('upholsteryType')
      : (t.get('KYCAR_UPHOLSTERY_TYPE')?.index(upholsteryCode) ?? acc.unknownEnum('upholsteryType'));
  const paintCode = (normalizeText(src.paintType) ?? '').toUpperCase();
  if (paintCode === '' || t.get('KYCAR_PAINT_TYPE')?.has(paintCode) !== true) acc.unknown.push('paintType');

  // # 72 / # 73 — codes hors périmètre voiture retirés SILENCIEUSEMENT (le référentiel les filtre
  // déjà) ; un code hors vocabulaire lève `ENUM_UNKNOWN`. Aucune colonne : comptés seulement.
  const equipmentTable = t.get('KYCAR_EQUIPMENT');
  const keptEquipment = (src.equipment ?? []).filter((c) => equipmentTable?.has(String(c)) === true);
  if ((src.equipment ?? []).length > 0 && keptEquipment.length < (src.equipment ?? []).length) {
    acc.flag('ENUM_UNKNOWN');
  }
  if (keptEquipment.length === 0) acc.unknown.push('equipmentCodes');
  const sealTable = t.get('KYCAR_SEAL');
  if ((src.appliedSeals ?? []).filter((c) => sealTable?.has(String(c)) === true).length === 0) {
    acc.unknown.push('sealCodes');
  }

  /* ---- GÉOGRAPHIE, VENDEUR, PUBLICITÉ (# 75 à # 81) -------------------------------------------- */

  // # 75 `regionCode` — dérivé du PRÉFIXE postal (D3-06) : les 13 plages d'EX-DATA-52 commencent
  // toutes sur un multiple de 100, donc `préfixe × 100` tombe dans la bonne plage sans ambiguïté.
  let regionCode: number;
  const prefix = normalizeText(src.location?.postalCodePrefix2);
  if (countryIso !== 'BE') {
    // EX-DATA-55 : hors Belgique, la table NUTS-2 belge ne s'applique pas. INCONNU, sans drapeau —
    // ce n'est pas une région non résolue, c'est une région hors périmètre.
    regionCode = acc.unknownEnum('regionCode');
  } else if (prefix === null || !/^[0-9]{2}$/.test(prefix)) {
    acc.flag('REGION_UNRESOLVED');
    regionCode = acc.unknownEnum('regionCode');
  } else {
    const resolved = ctx.ref.resolveRegionBE(Number(prefix) * 100);
    if (resolved === null) {
      acc.flag('REGION_UNRESOLVED');
      regionCode = acc.unknownEnum('regionCode');
    } else {
      regionCode = t.get('KYCAR_REGION')?.index(resolved) ?? acc.unknownEnum('regionCode');
    }
  }
  // # 77 `postalCodePrefix2` — validé, non transporté (aucune colonne : R3).
  if (prefix === null || !/^[0-9]{2}$/.test(prefix)) acc.unknown.push('postalCodePrefix2');

  // # 78 `sellerType` — alias d'entrée d'EX-DATA-41.
  let sellerCode = (normalizeText(src.seller?.type) ?? '').toUpperCase();
  if (sellerCode === 'PRIVATE') sellerCode = 'P';
  if (sellerCode === 'DEALER') sellerCode = 'D';
  const sellerType =
    sellerCode === ''
      ? acc.unknownEnum('sellerType')
      : (t.get('KYCAR_SELLER_TYPE')?.index(sellerCode) ?? acc.unknownEnum('sellerType'));

  // # 79 `adTier` — l'ABSENCE du champ vaut `NONE`, une valeur, pas un inconnu (annexe A).
  const tierCode = (normalizeText(src.adProduct?.tier) ?? '').toUpperCase();
  let adTier: number;
  if (tierCode === '') {
    adTier = t.get('KYCAR_AD_TIER')?.index('NONE') ?? ENUM_UNKNOWN_BYTE;
  } else {
    const idx = t.get('KYCAR_AD_TIER')?.index(tierCode) ?? null;
    adTier = idx === null ? acc.unknownEnum('adTier') : idx;
  }

  /* ---- ASSEMBLAGE ------------------------------------------------------------------------------ */

  // # 50 / # 53 : DÉRIVÉS mais sans colonne (D3-08). Ils sont comptés comme inconnus DU POINT DE VUE
  // DE L'INTERFACE — c'est bien elle qui ne les transporte pas — et le provider publie par ailleurs
  // la distribution réellement mesurée, pour que la dette reste chiffrée au lieu d'être supposée.
  acc.unknown.push('co2Source', 'consumptionSource');

  return {
    kind: 'accepted',
    row: {
      listingId,
      listingUrl,
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
      vatDeductible,
      booleanFlags: acc.booleanFlags,
      ingestFlags: acc.ingestFlags,
      strings: [
        listingUrl,
        modelVersionRaw,
        modelVersionClean,
        fuelSourceLabelRaw,
        parsedVersion.trimTokens.join(' '),
      ],
      dealerBucket: normalizeText(src.seller?.dealerBucket),
      co2Source,
      consumptionSource,
      unknownFields: acc.unknown,
      notices: acc.notices,
    },
  };
}

/* ================================================================================================
 * 4. AIDANTS
 * ============================================================================================== */

/** Vrai si `value` est un nombre fini dans `[lo, hi]` (bornes incluses). */
function inRange(value: unknown, lo: number, hi: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= lo && value <= hi;
}

/**
 * Entier borné par l'annexe A (`LISTING_NUMERIC_BOUNDS`) écrit dans une colonne d'un octet.
 * Hors borne ou absent → sentinelle `255`, et le champ est compté INCONNU.
 */
function boundedByte(value: number | undefined, field: string, acc: RowAccumulator): number {
  if (value === undefined || !Number.isInteger(value) || !isWithinListingBound(field, value)) {
    return acc.unknownEnum(field);
  }
  return value;
}

/** Code énuméré servi comme ENTIER par la source (`bodyType`, `bodyColor`) → indice d'octet. */
function enumFromInteger(
  value: number | undefined,
  vocabulary: Parameters<As24CodeTables['get']>[0],
  field: string,
  tables: As24CodeTables,
  acc: RowAccumulator,
  flagUnknownCode: boolean,
): number {
  if (value === undefined) return acc.unknownEnum(field);
  const idx = tables.get(vocabulary)?.index(String(value)) ?? null;
  if (idx === null) {
    if (flagUnknownCode) acc.flag('ENUM_UNKNOWN');
    return acc.unknownEnum(field);
  }
  return idx;
}

/** Résultat du choix d'une mesure entre les trois branches (`EX-DATA-35`). */
interface PickedMeasurement {
  readonly value: number | null;
  readonly source: MeasurementSource;
  /** Vrai si un champ `…WithFallback` accompagnait la branche retenue avec une valeur DIFFÉRENTE. */
  readonly divergentFallback: boolean;
}

/**
 * Applique la priorité normative `wltp > NEDC > …WithFallback` (# 49 à # 53) et rend, avec la
 * valeur, la PROVENANCE de la mesure. Le champ `…WithFallback` qui accompagne une branche doit en
 * porter exactement la valeur (`DATA-MODEL` §7-17) : une divergence décrirait la même annonce par
 * deux chiffres et est signalée.
 */
function pickMeasurement(
  wltp: number | undefined,
  nedc: number | undefined,
  fallback: number | undefined,
): PickedMeasurement {
  if (typeof wltp === 'number' && Number.isFinite(wltp)) {
    return {
      value: wltp,
      source: 'WLTP',
      divergentFallback: typeof fallback === 'number' && Math.abs(fallback - wltp) > 1e-9,
    };
  }
  if (typeof nedc === 'number' && Number.isFinite(nedc)) {
    return {
      value: nedc,
      source: 'NEDC',
      divergentFallback: typeof fallback === 'number' && Math.abs(fallback - nedc) > 1e-9,
    };
  }
  if (typeof fallback === 'number' && Number.isFinite(fallback)) {
    return { value: fallback, source: 'UNKNOWN', divergentFallback: false };
  }
  return { value: null, source: 'UNKNOWN', divergentFallback: false };
}

/**
 * `EX-DATA-10` — repli de la catégorie d'énergie (# 42) sur le TYPE de carburant (# 43) quand la
 * catégorie est absente. Table EXPLICITE et minimale : elle ne couvre que les correspondances
 * univoques du référentiel (`references/FuelType.json` vers `references/FuelCategory.json`). Un
 * type qui n'y figure pas ne produit AUCUNE catégorie — `EX-DATA-11` interdit de deviner, en
 * particulier pour les hybrides, dont le type ne dit pas la catégorie.
 */
const FUEL_TYPE_TO_CATEGORY: Readonly<Record<string, string>> = Object.freeze({
  // Essences (`references/FuelType.json` 1 à 6 : « Essence 91 » … « Super Plus E10 98 ») → `B`.
  '1': 'B',
  '2': 'B',
  '3': 'B',
  '4': 'B',
  '5': 'B',
  '6': 'B',
  // Gazoles (7 « Diesel », 8 « Diesel écologique ») → `D`.
  '7': 'D',
  '8': 'D',
  // 9 « Gaz de pétrole liquéfié » → `L` (GPL).
  '9': 'L',
  // 10 et 11 « Gaz naturel H / L » → `C` (CNG).
  '10': 'C',
  '11': 'C',
  // 12 « Électrique » → `E` ; 13 « Hydrogène » → `H` ; 16 « Ethanol » → `M`.
  '12': 'E',
  '13': 'H',
  '16': 'M',
  // 14 « Vegetable oil » et 15 « Biogas » n'ont AUCUNE catégorie du référentiel qui leur
  // corresponde sans interprétation : ils restent hors table, donc INCONNUS. `O` (« Autres »)
  // serait un fourre-tout choisi par nous, pas une donnée de la source.
});
