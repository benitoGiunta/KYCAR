/**
 * KYCAR — Adaptateur 2dehands (lot D9) : projection R3 d'une annonce brute vers le vocabulaire KYCAR
 * =================================================================================================
 * `mapListingToNormalized` est le point UNIQUE où une annonce 2dehands entre dans l'adaptateur. Il
 * construit un `NormalizedListing` CHAMP PAR CHAMP (allowlist explicite, jamais un spread de l'objet
 * brut) : aucune propriété du `RawListing` source qui ne soit pas nommée ci-dessous n'atteint jamais
 * la sortie. C'est la traduction exécutable de « filtrage R3 à l'ingestion, pas au rendu »
 * (`DataProvider.ts` en-tête, `EX-NFR-26`, P-2) — et la raison pour laquelle `scanForbiddenFields`
 * (garde D2) trouve zéro champ interdit sur la sortie de cette fonction, y compris quand l'entrée en
 * porterait (test `normalize.test.ts`).
 *
 * CONTRÔLES D'INGESTION (remédiation 2.6). L'ingestion n'appliquait AUCUNE règle de valeur : un prix
 * à 1 €, un prix à 10 000 000 €, un kilométrage à −5 km, une année 1899 et une puissance à 99 999 kW
 * traversaient tels quels et devenaient des bornes publiées. Sont désormais appliqués, DANS CET
 * ORDRE et sans jamais REJETER l'annonce (ARB-15, ARB-16) :
 *
 * | Règle | Exigence | Effet | Drapeau |
 * |---|---|---|---|
 * | prix sur demande (NL/FR/code source) | EX-DATA-16(b) | `priceStatus = ON_REQUEST` | `PRICE_ON_REQUEST_WITH_AMOUNT` si un montant l'accompagne |
 * | prix > 5 000 000 € | ARB-16 / ADV-16 | prix → INCONNU | `PRICE_OUT_OF_RANGE` |
 * | prix < 250 € | EX-DATA-19(1) / ARB-15 | prix CONSERVÉ, hors `V_price` (EX-DATA-60) | `PRICE_SENTINEL_ABSOLUTE` |
 * | prix absent | EX-DATA-18 | `priceStatus = MISSING` | `PRICE_MISSING_UNDECLARED` |
 * | km hors [0, 1 500 000] | annexe A champ 30 | km → INCONNU | `MILEAGE_OUT_OF_RANGE` |
 * | km = 0 | annexe A champ 59 | km CONSERVÉ, hors `V_mileage` | `SUSPECT_ZERO_MILEAGE` |
 * | puissance hors [1, 9 999] | annexe A champ 35 | puissance → INCONNU | `POWER_OUT_OF_RANGE` |
 * | année hors [1900, 2101] | annexe A champ 31 | année → INCONNU | `FIRST_REG_OUT_OF_RANGE` |
 * | valeur énumérée présente et non reconnue | EX-DATA-45/46 | repli typé | `ENUM_UNKNOWN` |
 * | pays hors table | EX-DATA-40 (ARB-60) | pays INCONNU | `MARKETPLACE_UNMAPPED` |
 * | région NUTS-2 | EX-DATA-53 (O14) | toujours INCONNUE sur cette surface | `REGION_UNRESOLVED` |
 *
 * SIX RÈGLES AJOUTÉES PAR LA PHASE 2.8 (D8-08, D8-16 / FV-20), dans le même esprit :
 *
 * | Règle | Exigence | Effet | Drapeau |
 * |---|---|---|---|
 * | `*Unit` servi hors unité canonique | EX-DATA-5 | conversion REFUSÉE, champ INCONNU | `UNIT_UNSUPPORTED` |
 * | `fuelCategory` absente, `fuelTypePrimary` servi | EX-DATA-10 | repli création → recherche | `ENUM_UNKNOWN` + rapport `FUEL_CATEGORY_FROM_FUEL_TYPE` |
 * | hybride rechargeable sans catégorie | EX-DATA-11 | catégorie INCONNUE, jamais `B`/`D` | `ENUM_UNKNOWN` + rapport `HYBRID_CATEGORY_UNRESOLVED` |
 * | norme de mesure du CO₂ | EX-DATA-35 | `co2Source` = WLTP / NEDC / UNKNOWN | — |
 * | champ BTW/TVA de la source | EX-SCR-203, annexe A # 10 | `vatDeductible` tri-état | `ENUM_UNKNOWN` si valeur non traduisible |
 * | produit de mise en avant | EX-DATA-43 | `adTier` (`KYCAR_AD_TIER`), diagnostic seul | `ENUM_UNKNOWN` si valeur non traduisible |
 *
 * L'absence de `listingUrl` (EX-DATA-14) est un REJET, pas un drapeau : il est prononcé par
 * `TweedehandsDataProvider.queryOne`, seul point qui puisse compter un rejet par motif — la
 * normalisation, elle, rend le deeplink vide et le recense dans `unknownFields`.
 *
 * PIVOT TEMPOREL (EX-DATA-25/27, DR-017). `constructionYear` de 2dehands est une ANNÉE-MODÈLE.
 * `EX-DATA-25` impose `firstRegistrationYear` comme seul pivot temporel des agrégats et `EX-DATA-27`
 * interdit de l'imputer depuis l'année-modèle. `firstRegistrationYear` est donc porté par le type et
 * vaut `null` sur cette surface, qui ne le sert pas : l'axe « année » des agrégats publie `n = 0`
 * plutôt qu'une fourchette décalée d'un à deux ans sans le dire.
 */

import { scanForbiddenFields } from '../../types/validation';
import { LISTING_NUMERIC_BOUNDS, isWithinListingBound } from '../../types/validation';
import type { ReferenceData } from '../../types/reference';
import { MODEL_ID_UNRESOLVED } from '../../types/sentinels';
import { cleanModelVersion, isPriceSentinelAbsolute } from '../../types/shared-rules';
import type { IngestFlagCode } from '../../types/vocabularies';
import type { RawListing } from './nextData';
import {
  isAdTierRecognised,
  isBodyTypeRecognised,
  isCanonicalUnit,
  isFuelCategoryRecognised,
  isUsageStateRecognised,
  mapAdTier,
  mapBodyType,
  mapCountryCode,
  mapDrivetrain,
  mapEuEmissionStandard,
  mapFuelCategory,
  mapFuelCategoryFromFuelType,
  mapRegionCode,
  mapSellerType,
  mapTransmission,
  mapUsageState,
  mapVatDeductible,
  parseInteger,
  parseNumeric,
  parseSourceBoolean,
  readAttr,
  readVatDeductibleAttribute,
  resolveMakeId,
  resolveModelId,
} from './vocabularyMap';

/** Message d'erreur typé du provider (rattachable dans un rapport, ZO-5). */
const TYPED_PREFIX = 'TweedehandsDataProvider:';

/**
 * Préfixe de chemin d'une PAGE D'ANNONCE sur la surface Adevinta (`/v/<catégorie>/<id>`). `EX-NFR-26`
 * : « le deeplink conservé pointe vers l'annonce d'origine, jamais vers une fiche vendeur ». Le
 * deeplink était recopié sans contrôle : une URL de profil vendeur — chemin en `Disallow` chez
 * 2dehands — traversait la normalisation (DR-127). Contrôle par PRÉFIXE POSITIF (seule la page
 * d'annonce est acceptée), jamais par liste noire : une liste noire laisse passer ce qu'elle
 * n'énumère pas.
 */
const LISTING_PATH_PREFIX = '/v/';

/** Vrai si `url` désigne une PAGE D'ANNONCE de la surface (préfixe de chemin autorisé). */
function isListingDeeplink(url: string): boolean {
  const at = url.indexOf('://');
  if (at < 0) return false;
  const slash = url.indexOf('/', at + 3);
  if (slash < 0) return false;
  return url.slice(slash).startsWith(LISTING_PATH_PREFIX);
}

/**
 * Vue normalisée d'une annonce 2dehands, DÉJÀ dans le vocabulaire KYCAR. Structurellement sans champ
 * vendeur identifiant (R3) : ni nom, ni téléphone, ni adresse, ni géolocalisation, ni ville — seuls
 * `sellerType` (type, autorisé EX-DATA-42), `countryCode` (pays, pas une adresse) et `regionCode`
 * (NUTS-2, jamais un code postal exact) sont portés.
 */
export interface NormalizedListing {
  readonly listingId: string;
  readonly listingUrl: string;
  readonly marketplace: 'be' | 'nl';
  readonly priceEur: number | null;
  readonly priceStatus: 'QUOTED' | 'ON_REQUEST' | 'MISSING';
  /** `null` si la marque 2dehands ne résout à aucun `makeId` du référentiel — annonce écartée de
   *  l'agrégation par marque/modèle (pas de bucket « marque non identifiée » dans `MakeAggregate`). */
  readonly makeId: number | null;
  /** `0` = « Modèle non identifié » (EX-DATA-72), jamais `null`. */
  readonly modelId: number;
  /** Année-modèle relevée (`constructionYear`). JAMAIS le pivot temporel des agrégats (EX-DATA-25). */
  readonly modelYear: number | null;
  /** Pivot temporel d'EX-DATA-25. `null` : la surface autorisée ne sert pas cette date (EX-DATA-27
   *  interdit de l'imputer depuis `modelYear`). */
  readonly firstRegistrationYear: number | null;
  readonly mileageKm: number | null;
  readonly fuelCategory: string | null;
  readonly bodyType: string | null;
  readonly transmission: string | null;
  readonly drivetrain: string | null;
  readonly usageState: string | null;
  readonly sellerType: string | null;
  readonly euEmissionStandard: string | null;
  readonly powerKw: number | null;
  readonly co2EmissionsGPerKm: number | null;
  readonly seatCount: number | null;
  readonly doorCount: number | null;
  /** Pays ISO 3166-1 alpha-2, `null` si l'abréviation source est hors table (ARB-60). */
  readonly countryCode: string | null;
  /** Région NUTS-2, toujours `null` sur cette surface (EX-DATA-53 / O14, voir `mapRegionCode`). */
  readonly regionCode: string | null;
  /** Version brute relevée dans le titre, hors marque et modèle (`EX-DATA-29`). */
  readonly modelVersionRaw: string | null;
  /** Version nettoyée et tronquée à 80 points de code par la couche D2 (ARB-61/ADV-17). */
  readonly modelVersionClean: string | null;
  /** Date d'annonce brute (`date` : « Vandaag »…), jamais normalisée sur cette surface. */
  readonly listedAt: string | null;
  /**
   * TVA déductible (`EX-SCR-203` colonne « TVA », annexe A champ # 10 `isTaxDeductible`, D8-08).
   * TRI-ÉTAT : `true` déductible, `false` non déductible, `null` INCONNU (la source ne le porte
   * pas). `null` ne vaut JAMAIS `false` — `encodeVatDeductible` le projette sur le code `0`.
   */
  readonly vatDeductible: boolean | null;
  /** Palier publicitaire `KYCAR_AD_TIER` (`EX-DATA-43`, annexe A champ 79). Absent ⇒ `NONE`. */
  readonly adTier: string | null;
  /**
   * Provenance de la mesure de CO₂ (`EX-DATA-35`, `KYCAR_MEASUREMENT_STANDARD`) : `WLTP` ou `NEDC`
   * quand la source NOMME la norme, `UNKNOWN` quand la valeur vient du champ d'annonce à repli,
   * dont la norme n'est pas déclarée. Jamais devinée : WLTP et NEDC ne sont pas comparables.
   */
  readonly co2Source: 'WLTP' | 'NEDC' | 'UNKNOWN';
  /**
   * D'où vient `fuelCategory` (`EX-DATA-10`) : `SOURCE` (attribut `fuel` servi), `FUEL_TYPE_FALLBACK`
   * (repli création → recherche depuis `fuelTypePrimary`), `NONE` (aucune des deux).
   */
  readonly fuelCategorySource: 'SOURCE' | 'FUEL_TYPE_FALLBACK' | 'NONE';
  /** Codes `KYCAR_INGEST_FLAG` posés par la normalisation de cette annonce (EX-DATA-46). */
  readonly ingestFlags: readonly IngestFlagCode[];
  /**
   * SOUS-QUALIFICATIONS d'`ENUM_UNKNOWN` et drapeaux de champ (`EX-DATA-45` dernier alinéa) :
   * `HYBRID_CATEGORY_UNRESOLVED`, `FUEL_CATEGORY_FROM_FUEL_TYPE`… Ils sont « comptés dans le rapport
   * d'ingestion mais NON dans le vocabulaire à 17 codes » — ils ne portent donc aucun bit de
   * `ingestFlags` et ne peuvent pas élargir `KYCAR_INGEST_FLAG` par la bande. Le snapshot les publie
   * dans `ingestFlagCounts` à côté des 17 codes gelés.
   */
  readonly ingestReportFlags: readonly string[];
  /** Champs dont la valeur est restée INCONNUE (comptés dans `unknownCountByField` du snapshot). */
  readonly unknownFields: readonly string[];
}

/**
 * Valeurs de `priceInfo.priceType` qui signifient « prix sur demande » (EX-DATA-16(b), DR-042).
 * Table EXPLICITE des formes RELEVÉES : néerlandais, français, anglais et le code Adevinta `NOTK`
 * (« Nader Overeen Te Komen »). Le jeton anglais `REQUEST` était le SEUL reconnu : « Op aanvraag »
 * et `NOTK` passaient pour un prix affiché.
 */
const ON_REQUEST_TOKENS: readonly string[] = [
  'request',
  'onrequest',
  'opaanvraag',
  'prijsopaanvraag',
  'notk',
  'nadereovereenkomst',
  'surdemande',
  'prixsurdemande',
  'surdevis',
];

/** Replie une valeur pour comparaison : minuscule, accents, espaces et séparateurs ôtés. */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\s\-_/.]+/g, '');
}

/** Vrai si `priceType` désigne un prix sur demande (table explicite ci-dessus). */
function isOnRequest(priceType: string | undefined): boolean {
  if (priceType === undefined) return false;
  const folded = fold(priceType);
  return ON_REQUEST_TOKENS.some((token) => folded.includes(token));
}

/** Résultat de la cartographie du prix (§A.5.3 `KYCAR_PRICE_STATUS` + drapeaux d'ARB-15/ARB-16). */
interface MappedPrice {
  readonly priceEur: number | null;
  readonly priceStatus: 'QUOTED' | 'ON_REQUEST' | 'MISSING';
  readonly flags: readonly IngestFlagCode[];
}

/** Mappe `priceInfo` vers `priceEur`/`priceStatus` et les drapeaux d'ingestion associés. */
function mapPrice(priceCents: number | undefined, priceType: string | undefined): MappedPrice {
  const flags: IngestFlagCode[] = [];
  const hasAmount = priceCents !== undefined && priceCents > 0;

  if (isOnRequest(priceType)) {
    // ADV-16 : un prix sur demande ACCOMPAGNÉ d'un montant est une incohérence de la source, pas un
    // prix affiché — l'annonce est conservée, le montant est écarté, le rapport le dit.
    if (hasAmount) flags.push('PRICE_ON_REQUEST_WITH_AMOUNT');
    return { priceEur: null, priceStatus: 'ON_REQUEST', flags };
  }
  if (!hasAmount) {
    return { priceEur: null, priceStatus: 'MISSING', flags: ['PRICE_MISSING_UNDECLARED'] };
  }

  const euros = (priceCents as number) / 100;
  const bounds = LISTING_NUMERIC_BOUNDS.priceEur;
  if (bounds !== undefined && euros > bounds.max) {
    // ARB-16 : hors borne haute ⇒ INCONNU + drapeau, JAMAIS un rejet d'annonce.
    return { priceEur: null, priceStatus: 'QUOTED', flags: ['PRICE_OUT_OF_RANGE'] };
  }
  if (isPriceSentinelAbsolute(euros)) {
    // ARB-15 : la valeur est CONSERVÉE (l'annonce compte), mais EX-DATA-60 la sort de `V_price`.
    flags.push('PRICE_SENTINEL_ABSOLUTE');
  }
  return { priceEur: euros, priceStatus: 'QUOTED', flags };
}

/** Applique une borne numérique de l'annexe A : hors domaine ⇒ INCONNU + drapeau. */
function boundedInteger(
  value: number | null,
  field: keyof typeof LISTING_NUMERIC_BOUNDS,
  flag: IngestFlagCode,
  flags: IngestFlagCode[],
): number | null {
  if (value === null) return null;
  if (!isWithinListingBound(field, value)) {
    flags.push(flag);
    return null;
  }
  return value;
}

/**
 * `EX-DATA-5` (D8-16 / FV-20) — GARDE D'UNITÉ, appliquée AVANT toute lecture de valeur. Si la source
 * sert un attribut `*Unit` dont l'unité n'est pas celle du dictionnaire KYCAR (`EX-DATA-4`), la
 * conversion est REFUSÉE : le champ vaut INCONNU et l'annonce porte `UNIT_UNSUPPORTED`. Retourne
 * `true` quand la lecture est autorisée. Aucune conversion n'est devinée — le facteur `mi → km` est
 * connu, mais l'exigence interdit de deviner : une source qui change d'unité doit se VOIR.
 */
function unitAccepted(
  raw: RawListing,
  unitAttribute: string,
  field: string,
  flags: IngestFlagCode[],
  unknownFields: string[],
): boolean {
  if (isCanonicalUnit(unitAttribute, readAttr(raw, unitAttribute))) return true;
  if (!flags.includes('UNIT_UNSUPPORTED')) flags.push('UNIT_UNSUPPORTED');
  unknownFields.push(field);
  return false;
}

/**
 * Extrait la VERSION d'une annonce : le titre privé de la marque et du modèle (`EX-DATA-29`). Le
 * nettoyage et la troncature à 80 points de code sont ceux de la couche D2 (`cleanModelVersion`,
 * ARB-61/ADV-24) — jamais réécrits ici.
 */
function extractVersion(
  raw: RawListing,
  brandRaw: string | undefined,
  modelRaw: string | undefined,
): { modelVersionRaw: string | null; modelVersionClean: string | null } {
  const title = typeof raw.title === 'string' ? raw.title : undefined;
  if (title === undefined) return { modelVersionRaw: null, modelVersionClean: null };
  let rest = title;
  for (const part of [brandRaw, modelRaw]) {
    if (part === undefined || part.length === 0) continue;
    const at = rest.toLowerCase().indexOf(part.toLowerCase());
    if (at >= 0) rest = `${rest.slice(0, at)}${rest.slice(at + part.length)}`;
  }
  const modelVersionRaw = rest.trim();
  if (modelVersionRaw.length === 0) return { modelVersionRaw: null, modelVersionClean: null };
  return { modelVersionRaw, modelVersionClean: cleanModelVersion(modelVersionRaw) };
}

/**
 * Projette une annonce brute vers le vocabulaire KYCAR. `euroIndex` est précalculé une fois par
 * `TweedehandsDataProvider` (`buildEuroStandardIndex`) et réutilisé pour chaque annonce du lot.
 *
 * Lève un message TYPÉ (ZO-5) si l'élément n'est pas un objet d'annonce : un `null` glissé dans
 * `listings` faisait auparavant échouer tout `openSnapshot` sur un `TypeError` non rattachable.
 */
export function mapListingToNormalized(
  raw: RawListing,
  referenceData: ReferenceData,
  marketplace: 'be' | 'nl',
  euroIndex: ReadonlyMap<string, string>,
): NormalizedListing {
  if (raw === null || typeof raw !== 'object') {
    throw new TypeError(`${TYPED_PREFIX} élément de listings non exploitable (attendu : un objet d'annonce)`);
  }

  const ingestFlags: IngestFlagCode[] = [];
  const ingestReportFlags: string[] = [];
  const unknownFields: string[] = [];

  const brandRaw = readAttr(raw, 'brand');
  const modelRaw = readAttr(raw, 'model');
  const makeId = resolveMakeId(referenceData, brandRaw);
  if (makeId === null) unknownFields.push('makeId');
  const modelId = makeId === null ? MODEL_ID_UNRESOLVED : resolveModelId(referenceData, makeId, modelRaw);
  if (modelId === MODEL_ID_UNRESOLVED && modelRaw !== undefined) {
    ingestFlags.push('MODEL_UNRESOLVED');
    unknownFields.push('modelId');
  }

  const modelYear = boundedInteger(
    parseInteger(readAttr(raw, 'constructionYear')),
    'modelYear',
    'FIRST_REG_OUT_OF_RANGE',
    ingestFlags,
  );
  if (modelYear === null) unknownFields.push('modelYear');

  // EX-DATA-25/27 (DR-017) : la surface autorisée ne sert AUCUNE date de première immatriculation ;
  // l'imputer depuis `modelYear` est explicitement interdit. Le champ existe et vaut INCONNU.
  const firstRegistrationYear: number | null = null;
  unknownFields.push('firstRegistrationYear');

  // EX-DATA-5 : la garde d'unité PRÉCÈDE la lecture — un kilométrage en miles n'est pas converti.
  const mileageUnitOk = unitAccepted(raw, 'mileageUnit', 'mileageKm', ingestFlags, unknownFields);
  const rawMileage = mileageUnitOk ? parseInteger(readAttr(raw, 'mileage')) : null;
  const mileageKm = mileageUnitOk
    ? boundedInteger(rawMileage, 'mileageKm', 'MILEAGE_OUT_OF_RANGE', ingestFlags)
    : null;
  if (mileageUnitOk && mileageKm === null) unknownFields.push('mileageKm');
  // Annexe A champ 59 : 0 km sur une annonce d'occasion est SUSPECT — la valeur reste, mais elle
  // sort de `V_mileage` (EX-DATA-60) et le rapport d'ingestion la nomme.
  else if (mileageKm === 0) ingestFlags.push('SUSPECT_ZERO_MILEAGE');

  // --- Carburant : catégorie SERVIE, puis repli EX-DATA-10, puis garde hybride EX-DATA-11 --------
  const fuelRaw = readAttr(raw, 'fuel');
  const fuelTypePrimaryRaw = readAttr(raw, 'fuelTypePrimary') ?? readAttr(raw, 'fuelType');
  const isPluginHybrid = parseSourceBoolean(readAttr(raw, 'isPluginHybrid'));
  let fuelCategory = mapFuelCategory(fuelRaw);
  let fuelCategorySource: 'SOURCE' | 'FUEL_TYPE_FALLBACK' | 'NONE' = fuelCategory === null ? 'NONE' : 'SOURCE';
  if (fuelCategory === null) unknownFields.push('fuelCategory');
  else if (!isFuelCategoryRecognised(fuelRaw)) {
    ingestFlags.push('ENUM_UNKNOWN');
    unknownFields.push('fuelCategory');
  }
  if (fuelCategory === null) {
    if (isPluginHybrid) {
      // EX-DATA-11 : la catégorie hybride est INATTEIGNABLE par le repli (aucun code de
      // `KYCAR_FUEL_TYPE` ne projette sur `2` ni `3`). Rattacher un hybride essence à « Essence »
      // gonflerait la catégorie Essence et viderait la catégorie hybride : on laisse INCONNU.
      ingestFlags.push('ENUM_UNKNOWN');
      ingestReportFlags.push('HYBRID_CATEGORY_UNRESOLVED');
    } else {
      // EX-DATA-10 : repli création → recherche, utilisé UNIQUEMENT ici (catégorie absente ET
      // `fuelTypePrimary` présent). La table est `[EXTRAPOLÉ]` : le rapport d'ingestion le dit.
      const fallback = mapFuelCategoryFromFuelType(fuelTypePrimaryRaw);
      if (fallback !== null) {
        fuelCategory = fallback;
        fuelCategorySource = 'FUEL_TYPE_FALLBACK';
        ingestFlags.push('ENUM_UNKNOWN');
        ingestReportFlags.push('FUEL_CATEGORY_FROM_FUEL_TYPE');
      }
    }
  }

  const bodyRaw = readAttr(raw, 'body');
  const bodyType = mapBodyType(bodyRaw);
  if (bodyType === null) unknownFields.push('bodyType');
  else if (!isBodyTypeRecognised(bodyRaw)) {
    // Le repli « Autres » est un code valide : c'est le drapeau qui empêche qu'il passe pour une
    // reconnaissance (DR-044).
    ingestFlags.push('ENUM_UNKNOWN');
    unknownFields.push('bodyType');
  }

  const transmissionRaw = readAttr(raw, 'transmission');
  const transmission = mapTransmission(transmissionRaw);
  if (transmission === null) {
    unknownFields.push('transmission');
    if (transmissionRaw !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const driveTrainRaw = readAttr(raw, 'driveTrain');
  const drivetrain = mapDrivetrain(driveTrainRaw);
  if (drivetrain === null) {
    unknownFields.push('drivetrain');
    if (driveTrainRaw !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const conditionRaw = readAttr(raw, 'condition');
  const usageState = mapUsageState(conditionRaw);
  if (usageState === null) unknownFields.push('usageState');
  else if (!isUsageStateRecognised(conditionRaw)) {
    ingestFlags.push('ENUM_UNKNOWN');
    unknownFields.push('usageState');
  }

  const advertiserRaw = readAttr(raw, 'advertiser');
  const sellerType = mapSellerType(advertiserRaw);
  if (sellerType === null) {
    unknownFields.push('sellerType');
    if (advertiserRaw !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const euronormRaw = readAttr(raw, 'euronormBE');
  const euEmissionStandard = mapEuEmissionStandard(euronormRaw, euroIndex);
  if (euEmissionStandard === null) {
    unknownFields.push('euEmissionStandard');
    if (euronormRaw !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  const powerUnitOk = unitAccepted(raw, 'powerUnit', 'powerKw', ingestFlags, unknownFields);
  const powerKw = powerUnitOk
    ? boundedInteger(parseInteger(readAttr(raw, 'enginePowerKW')), 'powerKw', 'POWER_OUT_OF_RANGE', ingestFlags)
    : null;
  if (powerUnitOk && powerKw === null) unknownFields.push('powerKw');

  // EX-DATA-35 : la PROVENANCE de la mesure de CO₂ est portée par le champ dont la valeur est
  // retenue. WLTP et NEDC ne sont pas comparables (écart systématique ≈ 20 %) : une valeur issue du
  // champ d'annonce à repli, dont la norme n'est pas déclarée, reste `UNKNOWN` — jamais devinée.
  const co2UnitOk = unitAccepted(raw, 'co2EmissionsUnit', 'co2EmissionsGPerKm', ingestFlags, unknownFields);
  const co2Wltp = co2UnitOk ? parseNumeric(readAttr(raw, 'co2emissionWLTP')) : null;
  const co2Nedc = co2UnitOk ? parseNumeric(readAttr(raw, 'co2emissionNEDC')) : null;
  const co2Fallback = co2UnitOk ? parseNumeric(readAttr(raw, 'co2emission')) : null;
  const co2EmissionsGPerKm = co2Wltp ?? co2Nedc ?? co2Fallback;
  const co2Source: 'WLTP' | 'NEDC' | 'UNKNOWN' =
    co2Wltp !== null ? 'WLTP' : co2Nedc !== null ? 'NEDC' : 'UNKNOWN';
  if (co2UnitOk && co2EmissionsGPerKm === null) unknownFields.push('co2EmissionsGPerKm');
  if (co2Source === 'UNKNOWN') unknownFields.push('co2Source');
  const seatCount = parseInteger(readAttr(raw, 'numberOfSeatsBE'));
  if (seatCount === null) unknownFields.push('seatCount');
  const doorCount = parseInteger(readAttr(raw, 'aantaldeurenBE'));
  if (doorCount === null) unknownFields.push('doorCount');

  // EX-DATA-40 (ARB-60/ADV-15) : pays traduit en ISO, repli INCONNU + `MARKETPLACE_UNMAPPED`.
  const countryCode = mapCountryCode(raw.location?.countryAbbreviation);
  if (countryCode === null) {
    unknownFields.push('countryCode');
    ingestFlags.push('MARKETPLACE_UNMAPPED');
  }
  // EX-DATA-53 (O14) : aucune région dérivable sans code postal — couverture NULLE, pas muette.
  const regionCode = mapRegionCode();
  unknownFields.push('regionCode');
  ingestFlags.push('REGION_UNRESOLVED');

  const { modelVersionRaw, modelVersionClean } = extractVersion(raw, brandRaw, modelRaw);
  if (modelVersionClean === null) unknownFields.push('modelVersionClean');
  else if (modelVersionClean.length === 0) ingestFlags.push('VERSION_FULLY_STRIPPED');

  const listedAt = typeof raw.date === 'string' && raw.date.length > 0 ? raw.date : null;
  if (listedAt === null) unknownFields.push('listedAt');

  const price = mapPrice(raw.priceInfo?.priceCents, raw.priceInfo?.priceType);
  ingestFlags.push(...price.flags);
  if (price.priceEur === null) unknownFields.push('priceEur');

  // D8-08 (EX-SCR-203, annexe A champ # 10) : TVA déductible, tri-état. Chemin de lecture documenté
  // dans `vocabularyMap.ts` (`readVatDeductibleAttribute`). Absent ⇒ INCONNU, jamais « non ».
  const vatRaw = readVatDeductibleAttribute(raw);
  const vatDeductible = mapVatDeductible(vatRaw);
  if (vatDeductible === null) {
    unknownFields.push('vatDeductible');
    // Valeur PRÉSENTE mais non traduisible : dérive de la source, signalée comme telle (DR-044).
    if (vatRaw !== undefined) ingestFlags.push('ENUM_UNKNOWN');
  }

  // EX-DATA-43 : le palier publicitaire est conservé EXCLUSIVEMENT pour le diagnostic de
  // représentativité (`samplingBias`, `adTierDistribution`) — jamais un critère d'affichage.
  const adTierRaw = readAttr(raw, 'priorityProduct') ?? readAttr(raw, 'adTier');
  const adTier = mapAdTier(adTierRaw);
  if (adTierRaw !== undefined && !isAdTierRecognised(adTierRaw)) {
    ingestFlags.push('ENUM_UNKNOWN');
    unknownFields.push('adTier');
  }

  // EX-NFR-26 (DR-127) : un deeplink qui n'est pas une page d'annonce est ÉCARTÉ et recensé — il ne
  // franchit jamais l'adaptateur, même quand la source le sert.
  const rawDeeplink = typeof raw.vipUrl === 'string' ? raw.vipUrl : '';
  const deeplink = isListingDeeplink(rawDeeplink) ? rawDeeplink : '';
  if (deeplink === '') unknownFields.push('listingUrl');

  return {
    // ZO-5 : un listing partiel ne ment pas sur son type — `listingId`/`listingUrl` restent des
    // chaînes, vides si la source ne les sert pas ou si le deeplink n'est pas une page d'annonce.
    listingId: typeof raw.itemId === 'string' ? raw.itemId : '',
    listingUrl: deeplink,
    marketplace,
    priceEur: price.priceEur,
    priceStatus: price.priceStatus,
    makeId,
    modelId,
    modelYear,
    firstRegistrationYear,
    mileageKm,
    fuelCategory,
    bodyType,
    transmission,
    drivetrain,
    usageState,
    sellerType,
    euEmissionStandard,
    powerKw,
    co2EmissionsGPerKm,
    seatCount,
    doorCount,
    countryCode,
    regionCode,
    modelVersionRaw,
    modelVersionClean,
    listedAt,
    vatDeductible,
    adTier,
    co2Source,
    fuelCategorySource,
    ingestFlags,
    ingestReportFlags,
    unknownFields,
  };
}

/**
 * Prouve, à l'exécution, qu'un `NormalizedListing` ne porte aucun champ R3 (P-1). Enveloppe fine de
 * `scanForbiddenFields` (garde D2) pour un usage direct dans les tests de ce lot.
 */
export function assertNoForbiddenFields(listing: NormalizedListing): void {
  const issues = scanForbiddenFields(listing);
  if (issues.length > 0) {
    throw new Error(
      `${TYPED_PREFIX} violation R3 sur une annonce normalisée : ${issues.map((i) => i.path).join(', ')}`,
    );
  }
}
