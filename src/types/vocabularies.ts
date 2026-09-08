/**
 * KYCAR — Les 27 vocabulaires nommés (EX-DATA-8, table §A.1) et les vocabulaires CRÉÉS
 * =================================================================================================
 * Lot D2. Application de la décision V1 (EX-DATA-9) : aucun code énuméré n'est interprété sans que
 * son vocabulaire soit connu, et toute fonction de décodage prend le vocabulaire en paramètre
 * explicite. Ce module déclare :
 *   - le NOM des 27 vocabulaires (type `VocabularyName`) ;
 *   - le domaine des vocabulaires CRÉÉS par KYCAR (régions, statut de prix, norme de mesure,
 *     drapeaux d'ingestion, drapeaux d'outlier, palier publicitaire, marché, état d'usage,
 *     évaluation de prix canonique) — ceux qui n'ont pas de fichier de référence dans le dépôt.
 * Les vocabulaires ADOSSÉS À UN FICHIER (`references/*.json`, `filters.json`) sont assemblés par le
 * chargeur `reference.ts`, qui applique les filtrages de la table §A.1 (BodyType→9 codes voiture,
 * Equipment→132, FuelCategory→10 sans le code `T` réservé aux motos, etc.).
 */

/** Les 27 vocabulaires nommés de la table §A.1 (EX-DATA-8). */
export type VocabularyName =
  | 'KYCAR_FUEL_CATEGORY'
  | 'KYCAR_FUEL_TYPE'
  | 'KYCAR_OFFER_TYPE'
  | 'KYCAR_USAGE_STATE'
  | 'KYCAR_TRANSMISSION'
  | 'KYCAR_DRIVETRAIN'
  | 'KYCAR_BODY_TYPE'
  | 'KYCAR_BODY_COLOR'
  | 'KYCAR_PAINT_TYPE'
  | 'KYCAR_UPHOLSTERY_TYPE'
  | 'KYCAR_UPHOLSTERY_COLOR'
  | 'KYCAR_EU_EMISSION_STANDARD'
  | 'KYCAR_CO2_CLASS'
  | 'KYCAR_EFFICIENCY_CLASS'
  | 'KYCAR_BATTERY_OWNERSHIP'
  | 'KYCAR_EQUIPMENT'
  | 'KYCAR_SEAL'
  | 'KYCAR_SELLER_TYPE'
  | 'KYCAR_PRICE_EVALUATION'
  | 'KYCAR_AD_TIER'
  | 'KYCAR_MARKETPLACE'
  | 'KYCAR_VEHICLE_TYPE'
  | 'KYCAR_REGION'
  | 'KYCAR_PRICE_STATUS'
  | 'KYCAR_MEASUREMENT_STANDARD'
  | 'KYCAR_INGEST_FLAG'
  | 'KYCAR_OUTLIER_FLAG';

/** L'ensemble ordonné des 27 noms de vocabulaire, pour l'itération et les contrôles d'exhaustivité. */
export const VOCABULARY_NAMES: readonly VocabularyName[] = [
  'KYCAR_FUEL_CATEGORY',
  'KYCAR_FUEL_TYPE',
  'KYCAR_OFFER_TYPE',
  'KYCAR_USAGE_STATE',
  'KYCAR_TRANSMISSION',
  'KYCAR_DRIVETRAIN',
  'KYCAR_BODY_TYPE',
  'KYCAR_BODY_COLOR',
  'KYCAR_PAINT_TYPE',
  'KYCAR_UPHOLSTERY_TYPE',
  'KYCAR_UPHOLSTERY_COLOR',
  'KYCAR_EU_EMISSION_STANDARD',
  'KYCAR_CO2_CLASS',
  'KYCAR_EFFICIENCY_CLASS',
  'KYCAR_BATTERY_OWNERSHIP',
  'KYCAR_EQUIPMENT',
  'KYCAR_SEAL',
  'KYCAR_SELLER_TYPE',
  'KYCAR_PRICE_EVALUATION',
  'KYCAR_AD_TIER',
  'KYCAR_MARKETPLACE',
  'KYCAR_VEHICLE_TYPE',
  'KYCAR_REGION',
  'KYCAR_PRICE_STATUS',
  'KYCAR_MEASUREMENT_STANDARD',
  'KYCAR_INGEST_FLAG',
  'KYCAR_OUTLIER_FLAG',
];

/** Une valeur d'un vocabulaire nommé (entité `EnumValue`, EX-DATA-105). */
export interface EnumValueDef {
  /** Code canonique tel qu'il traverse le modèle (chaîne — `"B"`, `"2"`, `"T50"`, `"BE10"`…). */
  readonly code: string;
  /** Libellé FR affichable, normalisé NFC. */
  readonly label: string;
}

/* ================================================================================================
 * Vocabulaires CRÉÉS par KYCAR — sans fichier de référence dans le dépôt
 * ============================================================================================== */

/** `KYCAR_PRICE_STATUS` — CRÉÉ (§A.5.3, EX-DATA §8). */
export const PRICE_STATUS_VALUES: readonly EnumValueDef[] = [
  { code: 'QUOTED', label: 'Prix affiché' },
  { code: 'ON_REQUEST', label: 'Prix sur demande' },
  { code: 'MISSING', label: 'Prix absent' },
];

/** `KYCAR_MEASUREMENT_STANDARD` — CRÉÉ (§A.5.5). */
export const MEASUREMENT_STANDARD_VALUES: readonly EnumValueDef[] = [
  { code: 'WLTP', label: 'WLTP' },
  { code: 'NEDC', label: 'NEDC' },
  { code: 'UNKNOWN', label: 'Inconnue' },
];

/** `KYCAR_USAGE_STATE` — recherche `ustate` (§A.1), domaine normatif {A, N, U} (EX-DATA #26). */
export const USAGE_STATE_VALUES: readonly EnumValueDef[] = [
  { code: 'A', label: 'Accidenté' },
  { code: 'N', label: 'Neuf' },
  { code: 'U', label: "État d'origine" },
];

/** `KYCAR_AD_TIER` — OpenAPI `Tier` + valeur `NONE` créée (§A.1, EX-DATA #79). */
export const AD_TIER_VALUES: readonly EnumValueDef[] = [
  { code: 'NONE', label: 'Aucun' },
  { code: 'T20', label: 'T20' },
  { code: 'T30', label: 'T30' },
  { code: 'T40', label: 'T40' },
  { code: 'T50', label: 'T50' },
];

/**
 * `KYCAR_PRICE_EVALUATION` — CRÉÉ : échelle de création `PriceLabel` à 6 niveaux retenue comme
 * canonique, projection §A.1.2 (EX-DATA-12).
 */
export const PRICE_EVALUATION_VALUES: readonly EnumValueDef[] = [
  { code: '0', label: 'Inconnu' },
  { code: '1', label: 'Offre top' },
  { code: '2', label: 'Bonne offre' },
  { code: '3', label: 'Offre équitable' },
  { code: '4', label: 'Un peu cher' },
  { code: '5', label: 'Cher' },
];

/**
 * `KYCAR_MARKETPLACE` — OpenAPI `Marketplace`, 9 valeurs (§A.1). La 9ᵉ n'est pas identifiée par les
 * relevés (EX-DATA-40) : elle est représentée par le code réservé `UNKNOWN_9`.
 */
export const MARKETPLACE_VALUES: readonly EnumValueDef[] = [
  { code: 'be', label: 'Belgique' },
  { code: 'nl', label: 'Pays-Bas' },
  { code: 'de', label: 'Allemagne' },
  { code: 'at', label: 'Autriche' },
  { code: 'es', label: 'Espagne' },
  { code: 'fr', label: 'France' },
  { code: 'it', label: 'Italie' },
  { code: 'lu', label: 'Luxembourg' },
  { code: 'UNKNOWN_9', label: 'Marché non identifié' },
];

/**
 * `KYCAR_INGEST_FLAG` — CRÉÉ (§A.6, EX-DATA-45). EX-DATA-45 énumère **17 codes** ; la ligne de la
 * table §A.1 en annonce 14 et le champ #82 borne le tableau à `0..14`. Divergence de la source
 * signalée (non corrigée). On reprend ici la liste exhaustive d'EX-DATA-45 (17 codes), qui fait foi
 * puisqu'elle nomme chaque drapeau. `PRICE_IMPLAUSIBLE_IN_CELL` n'y figure pas (verdict d'analyse).
 *
 * O13 tranché par D-01 (`reports/remediation/FIX-LEAD-DECISIONS.md`) : la colonne `ingestFlags` est
 * un `Uint32Array` (32 bits) et l'encodage reste POSITIONNEL — la position de bit d'un code est son
 * rang dans cette liste. La correspondance n'est plus laissée à la charge de chaque appelant : elle
 * est matérialisée UNE FOIS par `INGEST_FLAG_BIT` ci-dessous, seule source du couple bit ↔ code
 * (DR-013). 17 codes posés, 15 bits de réserve.
 */
const INGEST_FLAG_DEFS = [
  { code: 'UNIT_UNSUPPORTED', label: 'Unité non gérée' },
  { code: 'ENUM_UNKNOWN', label: 'Code énuméré inconnu' },
  { code: 'MODEL_UNRESOLVED', label: 'Modèle non résolu' },
  { code: 'REGION_UNRESOLVED', label: 'Région non résolue' },
  { code: 'PRICE_SENTINEL_ABSOLUTE', label: 'Prix sentinelle absolu' },
  { code: 'PRICE_MISSING_UNDECLARED', label: 'Prix absent non déclaré' },
  { code: 'PRICE_ON_REQUEST_WITH_AMOUNT', label: 'Prix sur demande avec montant' },
  { code: 'PRICE_OUT_OF_RANGE', label: 'Prix hors bornes' },
  { code: 'SUSPECT_ZERO_MILEAGE', label: 'Kilométrage nul suspect' },
  { code: 'MILEAGE_OUT_OF_RANGE', label: 'Kilométrage hors bornes' },
  { code: 'POWER_OUT_OF_RANGE', label: 'Puissance hors bornes' },
  { code: 'POWER_UNIT_MISMATCH', label: 'Incohérence unité de puissance' },
  { code: 'FIRST_REG_UNPARSEABLE', label: 'Première immatriculation illisible' },
  { code: 'FIRST_REG_OUT_OF_RANGE', label: 'Première immatriculation hors bornes' },
  { code: 'VERSION_FULLY_STRIPPED', label: 'Version entièrement nettoyée' },
  { code: 'DUPLICATE_VALUE_CONFLICT', label: 'Conflit de valeur sur doublon' },
  { code: 'MARKETPLACE_UNMAPPED', label: 'Marché non traduit' },
] as const;

/** Les 17 valeurs du vocabulaire `KYCAR_INGEST_FLAG`, dans l'ordre normatif d'EX-DATA-45. */
export const INGEST_FLAG_VALUES: readonly EnumValueDef[] = INGEST_FLAG_DEFS;

/** Code canonique d'un drapeau d'ingestion (union littérale des 17 codes d'EX-DATA-45). */
export type IngestFlagCode = (typeof INGEST_FLAG_DEFS)[number]['code'];

/**
 * Table EXPLICITE bit ↔ code (DR-013 / D-01). La position de bit d'un drapeau est son rang dans
 * `INGEST_FLAG_VALUES` ; cette table matérialise cette correspondance pour que plus aucun appelant
 * n'ait à recalculer un index ni à écrire un `1 << n` littéral. Une valeur de cette table est un
 * NUMÉRO DE BIT (0..31), pas un masque : le masque s'obtient par `1 << INGEST_FLAG_BIT[code]`, ou
 * mieux par `setIngestFlag` / `hasIngestFlag`.
 */
export const INGEST_FLAG_BIT: Readonly<Record<IngestFlagCode, number>> = Object.freeze(
  Object.fromEntries(INGEST_FLAG_DEFS.map((v, i) => [v.code, i])) as Record<IngestFlagCode, number>,
);

/** Nombre de bits utilisables dans la colonne `ingestFlags` (`Uint32Array`, D-01). */
export const INGEST_FLAG_BIT_CAPACITY = 32;

/** Vrai si le masque `flags` porte le drapeau `code`. */
export function hasIngestFlag(flags: number, code: IngestFlagCode): boolean {
  return ((flags >>> INGEST_FLAG_BIT[code]) & 1) === 1;
}

/** Retourne `flags` augmenté du drapeau `code` (masque non signé, jamais muté en place). */
export function setIngestFlag(flags: number, code: IngestFlagCode): number {
  return (flags | (1 << INGEST_FLAG_BIT[code])) >>> 0;
}

/** Décode un masque `ingestFlags` en la liste ordonnée des codes qu'il porte (EX-DATA-46). */
export function ingestFlagCodes(flags: number): readonly IngestFlagCode[] {
  const codes: IngestFlagCode[] = [];
  for (const def of INGEST_FLAG_DEFS) {
    if (hasIngestFlag(flags, def.code)) codes.push(def.code);
  }
  return codes;
}

/**
 * `KYCAR_OUTLIER_FLAG` — CRÉÉ (§B.6), **8 codes** depuis D8-09 / DR-122 (dette D-45 levée).
 *
 * Les six premiers sont les codes de DÉTECTION gelés en 2.3 (divergence de nommage avec
 * EX-DATA-85, qui les appelle `LOW_PRICE_IQR`/`HIGH_PRICE_IQR`/`LOW_PRICE_MODEL`/
 * `HIGH_PRICE_MODEL` : signalée en 2.3, non corrigée, le vocabulaire gelé fait foi).
 *
 * Les deux derniers sont les codes de NON-ÉVALUABILITÉ nommés littéralement par EX-DATA-85 et
 * exigés par EX-DATA-86 (dernière ligne du tableau de cellules) et EX-DATA-95 : une annonce que
 * ni M1 ni M2 ne peuvent évaluer porte un verdict qui DIT pourquoi, au lieu de disparaître des
 * sorties. Ils ne sont PAS des drapeaux d'outlier : EX-DATA-95 interdit de compter une annonce
 * `INSUFFICIENT_*` comme signalée.
 *   - `INSUFFICIENT_DATA`   : aucune cellule d'homogénéité n'atteint le seuil (n < 12 pour M1,
 *                             |F| < 30 pour M2) — EX-DATA-86.
 *   - `INSUFFICIENT_SPREAD` : la cellule existe mais sa dispersion est nulle (IQR ou MAD nul,
 *                             `SCT = 0` pour le `R²` d'EX-DATA-93bis) — aucun écart n'est
 *                             mesurable, un z-score y serait une division par zéro.
 *
 * D8-09 : le VOCABULAIRE est étendu ici (étape 0) ; l'ÉMISSION des deux codes par le moteur est
 * le travail de fix-engine (`src/engine/outliers.ts`). Tant qu'elle n'est pas faite, aucun verdict
 * ne porte ces codes et la sonde `R-D4-05` reste rouge (`it.fails` vert).
 */
const OUTLIER_FLAG_DEFS = [
  { code: 'M1_LOW', label: 'M1 — prix anormalement bas' },
  { code: 'M1_HIGH', label: 'M1 — prix anormalement haut' },
  { code: 'M2_LOW', label: 'M2 — sous le prix attendu' },
  { code: 'M2_HIGH', label: 'M2 — au-dessus du prix attendu' },
  { code: 'M1_M2_AGREE_LOW', label: 'M1 et M2 concordent (bas)' },
  { code: 'M1_M2_AGREE_HIGH', label: 'M1 et M2 concordent (haut)' },
  { code: 'INSUFFICIENT_DATA', label: 'Effectif insuffisant pour évaluer' },
  { code: 'INSUFFICIENT_SPREAD', label: 'Dispersion nulle : écart non mesurable' },
] as const;

/** Les 8 valeurs du vocabulaire `KYCAR_OUTLIER_FLAG` (EX-DATA-85, D8-09). */
export const OUTLIER_FLAG_VALUES: readonly EnumValueDef[] = OUTLIER_FLAG_DEFS;

/** Code canonique d'un verdict d'outlier (union littérale des 8 codes d'EX-DATA-85). */
export type OutlierFlagCode = (typeof OUTLIER_FLAG_DEFS)[number]['code'];

/**
 * Les deux codes de NON-ÉVALUABILITÉ (D8-09). Un verdict qui en porte un n'est jamais compté
 * comme une annonce signalée (EX-DATA-95) : les écrans et les invariants doivent les exclure de
 * l'ensemble `A` des outliers.
 */
export const OUTLIER_NOT_EVALUABLE_CODES: readonly OutlierFlagCode[] = [
  'INSUFFICIENT_DATA',
  'INSUFFICIENT_SPREAD',
];

/** Validation : `code` appartient-il au vocabulaire gelé `KYCAR_OUTLIER_FLAG` (8 codes) ? */
export function isOutlierFlagCode(code: string): code is OutlierFlagCode {
  return OUTLIER_FLAG_DEFS.some((v) => v.code === code);
}

/**
 * Validation : le code est-il un verdict de NON-ÉVALUABILITÉ (EX-DATA-95) ? Sert à ne jamais
 * compter une annonce `INSUFFICIENT_*` parmi les annonces signalées.
 */
export function isNotEvaluableOutlierCode(code: string): boolean {
  return code === 'INSUFFICIENT_DATA' || code === 'INSUFFICIENT_SPREAD';
}

/**
 * `KYCAR_REGION` — CRÉÉ, NUTS-2 2021 (§A.8, EX-DATA-51). 11 valeurs distinctes pour la Belgique.
 * Marqué `[EXTRAPOLÉ]` (EX-DATA-53) : dette à solder contre le fichier officiel bpost/Statbel.
 */
export const REGION_VALUES: readonly EnumValueDef[] = [
  { code: 'BE10', label: 'Région de Bruxelles-Capitale' },
  { code: 'BE21', label: 'Anvers' },
  { code: 'BE22', label: 'Limbourg' },
  { code: 'BE23', label: 'Flandre-Orientale' },
  { code: 'BE24', label: 'Brabant flamand' },
  { code: 'BE25', label: 'Flandre-Occidentale' },
  { code: 'BE31', label: 'Brabant wallon' },
  { code: 'BE32', label: 'Hainaut' },
  { code: 'BE33', label: 'Liège' },
  { code: 'BE34', label: 'Luxembourg' },
  { code: 'BE35', label: 'Namur' },
];

/**
 * Table BE code postal → région (§A.8, EX-DATA-52), 13 plages contiguës disjointes couvrant
 * 1000–9999, chaque borne inclusive. Alimente les entités `Region` / `PostalRegionRange`.
 * `[EXTRAPOLÉ]` (EX-DATA-53).
 */
export interface PostalRangeDef {
  readonly lo: number;
  readonly hi: number;
  readonly regionCode: string;
}

export const BE_POSTAL_RANGES: readonly PostalRangeDef[] = [
  { lo: 1000, hi: 1299, regionCode: 'BE10' },
  { lo: 1300, hi: 1499, regionCode: 'BE31' },
  { lo: 1500, hi: 1999, regionCode: 'BE24' },
  { lo: 2000, hi: 2999, regionCode: 'BE21' },
  { lo: 3000, hi: 3499, regionCode: 'BE24' },
  { lo: 3500, hi: 3999, regionCode: 'BE22' },
  { lo: 4000, hi: 4999, regionCode: 'BE33' },
  { lo: 5000, hi: 5999, regionCode: 'BE35' },
  { lo: 6000, hi: 6599, regionCode: 'BE32' },
  { lo: 6600, hi: 6999, regionCode: 'BE34' },
  { lo: 7000, hi: 7999, regionCode: 'BE32' },
  { lo: 8000, hi: 8999, regionCode: 'BE25' },
  { lo: 9000, hi: 9999, regionCode: 'BE23' },
];
