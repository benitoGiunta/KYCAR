/**
 * KYCAR — Validation de schéma exécutable + garde R3 structurel (P-1, EX-DATA-47/49)
 * =================================================================================================
 * Lot D2. Deux responsabilités :
 *
 *  1. GARDE R3 (P-1, EX-DATA-47/49) : aucun champ vendeur identifiant de la liste E1..E14 (§A.7)
 *     ne doit avoir de place dans une structure de données KYCAR. `scanForbiddenFields` parcourt un
 *     enregistrement (objet arbitraire, y compris brut source) et REJETTE dès qu'un nom de propriété
 *     interdit apparaît, à n'importe quelle profondeur. C'est la traduction exécutable du critère S5.
 *
 *  2. VALIDATION DE SCHÉMA : `validateListingRecord` applique le garde R3 puis les bornes de
 *     plausibilité de la partie A (déjà normalisées, unités canoniques d'EX-DATA-4) sur les champs
 *     numériques reconnus, et contrôle la cohérence des sentinelles typées (EX-DATA-120).
 *
 * Les champs AUTORISÉS `sellerType` (type de vendeur) et `regionCode` (NUTS-2) ne sont PAS interdits
 * (EX-DATA-42) : seuls les identifiants et coordonnées exactes le sont.
 */

/** Un problème de validation. */
export interface ValidationIssue {
  readonly path: string;
  readonly code: string;
  readonly message: string;
}

/** Résultat de validation. `ok === true` si et seulement si `issues` est vide. */
export interface ValidationResult {
  readonly ok: boolean;
  readonly issues: readonly ValidationIssue[];
}

/**
 * Noms de propriété INTERDITS partout (R3, E1..E14). Comparaison insensible à la casse. La liste
 * couvre les noms source ET les noms canoniques par lesquels un champ vendeur identifiant pourrait
 * se glisser dans une structure — y compris les formes APLATIES (`sellerName`, `dealerName`,
 * `contactPhone`…, DR-012), qui échappaient à la seule règle d'ancêtre `seller`.
 * `postalCodePrefix2`, `sellerType` et `regionCode` (autorisés, EX-DATA-42) n'y figurent pas.
 */
export const R3_FORBIDDEN_FIELD_NAMES: ReadonlySet<string> = new Set(
  [
    // E1 seller.id / identifiant vendeur
    'sellerid',
    // E2 companyName
    'companyname',
    // E3 contactName
    'contactname',
    // E4 téléphone
    'phone',
    'phonenumber',
    'telephone',
    'mobile',
    'mobilephone',
    // E5 email
    'email',
    'emailaddress',
    'mail',
    // E6/E7 URL de contact / vitrine vendeur
    'contacturl',
    'formurl',
    'sellerurl',
    'dealerurl',
    'website',
    'websiteurl',
    'homepage',
    // E8 code postal exact
    'zip',
    'zipcode',
    'postalcode',
    'postcode',
    // E9 ville
    'city',
    'town',
    'municipality',
    // E10 rue et numéro
    'street',
    'streetname',
    'housenumber',
    'address',
    'addressline',
    // E11 géolocalisation
    'lat',
    'lon',
    'lng',
    'latitude',
    'longitude',
    'geolocation',
    // E12/E13 texte libre
    'description',
    // E14 cid
    'cid',

    // ---- Formes APLATIES canoniques (DR-012) --------------------------------------------------
    // Le nom canonique le plus probable d'un champ vendeur dans une structure KYCAR est aplati
    // (`sellerName`), pas imbriqué (`seller.name`) : la règle d'ancêtre `seller` ne le voyait pas.
    // E1/E2/E3 — identité du vendeur
    'sellername',
    'dealername',
    'vendorname',
    'sellercompanyname',
    // E4 — téléphone
    'sellerphone',
    'dealerphone',
    'vendorphone',
    'contactphone',
    // E5 — courriel
    'selleremail',
    'dealeremail',
    'vendoremail',
    'contactemail',
    // E6/E7 — URL de contact
    'sellercontacturl',
    'dealercontacturl',
    'contacturlseller',
    // E8/E10 — adresse postale exacte
    'selleraddress',
    'dealeraddress',
    'vendoraddress',
    'sellerstreet',
    'dealerstreet',
    'sellerpostalcode',
    'sellerzip',
    'sellercity',
  ].map((s) => s.toLowerCase()),
);

/** Préfixes qui font d'un nom générique un identifiant vendeur une fois aplati (DR-012). */
const SELLER_PREFIXES: readonly string[] = ['seller', 'dealer', 'vendor'];

/**
 * Noms interdits UNIQUEMENT sous un ancêtre `seller` (où ils deviennent identifiants) — `id`, `name`
 * bruts. Évite de rejeter `listingId`/`makeName` légitimes ailleurs.
 */
const FORBIDDEN_UNDER_SELLER: ReadonlySet<string> = new Set(['id', 'name']);

/**
 * Généralisation de DR-012 : un nom normalisé qui commence par `seller`/`dealer`/`vendor` et se
 * termine par un membre de `FORBIDDEN_UNDER_SELLER` est la forme APLATIE d'un champ vendeur
 * identifiant (`sellerName`, `dealerId`…), donc interdit — alors que `sellerType` (type de vendeur,
 * EX-DATA-42) reste autorisé puisque `type` n'est pas un membre de cette liste.
 */
function isFlattenedSellerIdentifier(normalizedKey: string): boolean {
  for (const prefix of SELLER_PREFIXES) {
    if (!normalizedKey.startsWith(prefix)) continue;
    const rest = normalizedKey.slice(prefix.length);
    if (rest.length > 0 && FORBIDDEN_UNDER_SELLER.has(rest)) return true;
  }
  return false;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_\-\s]/g, '');
}

/**
 * Parcourt récursivement un enregistrement et signale tout nom de propriété interdit par R3.
 * @param record objet à contrôler (brut source ou entité KYCAR).
 */
export function scanForbiddenFields(record: unknown, pathPrefix = ''): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const visit = (node: unknown, path: string, ancestorKeys: readonly string[]): void => {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, `${path}[${i}]`, ancestorKeys));
      return;
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const norm = normalizeKey(key);
      const childPath = path === '' ? key : `${path}.${key}`;
      const underSeller = ancestorKeys.some((k) => normalizeKey(k) === 'seller');
      if (R3_FORBIDDEN_FIELD_NAMES.has(norm) || isFlattenedSellerIdentifier(norm)) {
        issues.push({
          path: childPath,
          code: 'R3_FORBIDDEN_FIELD',
          message: `Champ interdit par R3 (§A.7) : « ${key} » ne doit exister dans aucune structure KYCAR`,
        });
      } else if (underSeller && FORBIDDEN_UNDER_SELLER.has(norm)) {
        issues.push({
          path: childPath,
          code: 'R3_FORBIDDEN_FIELD',
          message: `Champ vendeur identifiant interdit par R3 : « seller.${key} »`,
        });
      } else if (typeof value === 'string' && IDENTIFIER_VALUE_KEY_SET.has(norm)) {
        // EX-DATA-49 vise l'identifiant qui apparaît « comme nom de propriété, de colonne, de clé
        // JSON OU DE PARAMÈTRE » : `{ id: 'lat', param: 'lat' }` traversait un garde qui ne lisait
        // que les noms (DR-027). Le garde est ÉLARGI, jamais relâché.
        const normValue = normalizeKey(value);
        if (R3_FORBIDDEN_FIELD_NAMES.has(normValue) || isFlattenedSellerIdentifier(normValue)) {
          issues.push({
            path: childPath,
            code: 'R3_FORBIDDEN_IDENTIFIER',
            message: `Identifiant interdit par R3 (§A.7) en valeur de « ${key} » : « ${value} »`,
          });
        }
      }
      visit(value, childPath, [...ancestorKeys, key]);
    }
  };
  visit(record, pathPrefix, []);
  return issues;
}

/**
 * Noms de PROPRIÉTÉ dont la VALEUR est elle-même un identifiant de champ (identifiant de filtre,
 * nom de colonne, clé JSON, paramètre de requête). `EX-DATA-49` exige la détection d'un identifiant
 * `E1..E14` « apparaissant comme nom de propriété, de colonne, de clé JSON **ou de paramètre** » :
 * `{ id: 'lat', param: 'lat' }` traversait le garde, qui ne lisait que les NOMS (DR-027).
 */
export const R3_IDENTIFIER_VALUE_KEYS: readonly string[] = ['id', 'param', 'name', 'field', 'column', 'key'];

const IDENTIFIER_VALUE_KEY_SET: ReadonlySet<string> = new Set(R3_IDENTIFIER_VALUE_KEYS.map((k) => normalizeKey(k)));

/**
 * Signale tout identifiant interdit par R3 apparaissant comme VALEUR d'une propriété d'identifiant
 * (`id`, `param`, `name`, `field`, `column`, `key`), à n'importe quelle profondeur — le pendant de
 * `scanForbiddenFields`, qui ne lit que les noms de propriété (EX-DATA-49, DR-027).
 *
 * @param record objet à contrôler (registre de filtres, périmètre de recherche, descripteur de
 *   colonne, document de référence…).
 * @param options `valueKeys` remplace la liste des propriétés dont la valeur est un identifiant.
 */
export function scanForbiddenIdentifiers(
  record: unknown,
  options: { readonly valueKeys?: readonly string[] } = {},
  pathPrefix = '',
): ValidationIssue[] {
  const valueKeys = new Set((options.valueKeys ?? R3_IDENTIFIER_VALUE_KEYS).map((k) => normalizeKey(k)));
  const issues: ValidationIssue[] = [];
  const visit = (node: unknown, path: string): void => {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, `${path}[${i}]`));
      return;
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const childPath = path === '' ? key : `${path}.${key}`;
      if (typeof value === 'string' && valueKeys.has(normalizeKey(key))) {
        const norm = normalizeKey(value);
        if (R3_FORBIDDEN_FIELD_NAMES.has(norm) || isFlattenedSellerIdentifier(norm)) {
          issues.push({
            path: childPath,
            code: 'R3_FORBIDDEN_IDENTIFIER',
            message: `Identifiant interdit par R3 (§A.7) en valeur de « ${key} » : « ${value} »`,
          });
        }
      }
      visit(value, childPath);
    }
  };
  visit(record, pathPrefix);
  return issues;
}

/** Bornes de plausibilité (valeurs déjà normalisées, EX-DATA-4). `min`/`max` inclusifs. */
interface NumericBound {
  readonly min: number;
  readonly max: number;
  /** La sentinelle admise pour « inconnu » (jamais soumise aux bornes). */
  readonly sentinel: number | null;
}

/**
 * Bornes des champs numériques reconnus de la vue `Listing` décodée (valeurs métier, non stockées).
 * `co2` et `consumption` sont exprimés dans leur unité canonique (décimal), pas ×10.
 */
/**
 * Borne haute par défaut de l'année-modèle : `observedAt.year + 1` (annexe A # 24). Elle DÉPEND du
 * snapshot observé ; à défaut d'`observedAt`, on retient l'année courante + 1, jamais une constante
 * figée — `max = 2101` déclarait valide une année-modèle 2101 sur un snapshot 2026 (DR-020).
 */
export function defaultModelYearMax(observedAtYear: number = new Date().getUTCFullYear()): number {
  return observedAtYear + 1;
}

export const LISTING_NUMERIC_BOUNDS: Readonly<Record<string, NumericBound>> = {
  priceEur: { min: 1, max: 5_000_000, sentinel: null },
  mileageKm: { min: 0, max: 1_500_000, sentinel: null },
  modelYear: { min: 1900, max: defaultModelYearMax(), sentinel: null },
  powerKw: { min: 1, max: 9999, sentinel: null },
  co2EmissionsGPerKm: { min: 0, max: 1000, sentinel: null },
  consumptionCombinedL100Km: { min: 0.1, max: 99.9, sentinel: null },
  electricRangeKm: { min: 1, max: 10_000, sentinel: null },
  previousOwnerCount: { min: 0, max: 99, sentinel: null },
  doorCount: { min: 1, max: 9, sentinel: null },
  seatCount: { min: 1, max: 99, sentinel: null },
  imageCount: { min: 0, max: 50, sentinel: null },
};

/**
 * Longueurs maximales de chaîne du dictionnaire (annexe A # 2, 20, 21, 22, 45), en points de code.
 * `trimTokens` borne le NOMBRE de jetons et la longueur de chacun (DR-113).
 */
export const LISTING_STRING_BOUNDS: Readonly<Record<string, number>> = {
  listingUrl: 512,
  modelVersionRaw: 121,
  modelVersionClean: 80,
  fuelSourceLabelRaw: 160,
  trimToken: 24,
};

/** Nombre maximal de jetons de finition (annexe A # 22). */
export const LISTING_TRIM_TOKENS_MAX = 12;

/** Forme canonique d'un `listingId` (annexe A # 1, EX-DATA-15) : UUID 8-4-4-4-12 minuscule. */
export const LISTING_ID_PATTERN = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/;

/** Champs OBLIGATOIRES du dictionnaire (annexe A # 1, 2, 5, 6, 16, 17, 74). */
export const LISTING_MANDATORY_FIELDS: readonly string[] = [
  'listingId',
  'listingUrl',
  'observedAt',
  'marketplace',
  'makeId',
  'makeName',
  'countryCode',
];

/** Options de `validateListingRecord`. */
export interface ValidateListingOptions {
  /**
   * Année d'observation du snapshot (annexe A # 24) : la borne haute de `modelYear` vaut
   * `observedAtYear + 1`. Défaut : année courante.
   */
  readonly observedAtYear?: number;
  /**
   * Domaine attendu de l'hôte de `listingUrl` (annexe A # 2, EX-DATA-14). Défaut `autoscout24` ; un
   * provider 2dehands sert un autre hôte et fournit le sien.
   */
  readonly listingUrlDomain?: string;
  /**
   * Exiger la présence des champs OBL (annexe A). Faux par défaut : le validateur sert aussi à
   * contrôler des enregistrements PARTIELS (un champ à la fois), et l'absence d'un champ n'est pas
   * une valeur invalide.
   */
  readonly requireMandatory?: boolean;
}

/** Vrai si l'hôte appartient au domaine attendu (`autoscout24.<tld>` ou un sous-domaine). */
function hostMatchesDomain(host: string, domain: string): boolean {
  const h = host.toLowerCase();
  const d = domain.toLowerCase();
  const at = h.lastIndexOf(`${d}.`);
  if (at < 0) return false;
  if (at > 0 && h[at - 1] !== '.') return false;
  const tld = h.slice(at + d.length + 1);
  return /^[a-z]{2,}(\.[a-z]{2,})*$/.test(tld);
}

/**
 * Valide un enregistrement d'annonce (vue logique décodée, ou objet candidat). Applique d'abord le
 * garde R3, puis la forme des champs d'identité, les bornes numériques et les longueurs de chaîne
 * des champs reconnus. Un champ `null`/absent est admis (valeur INCONNU, EX-DATA-2) sauf si
 * `requireMandatory` est posé. Ne juge PAS l'appartenance aux vocabulaires (elle exige le
 * référentiel — voir `reference.ts`).
 */
export function validateListingRecord(
  record: Record<string, unknown>,
  options: ValidateListingOptions = {},
): ValidationResult {
  const issues: ValidationIssue[] = [...scanForbiddenFields(record), ...scanForbiddenIdentifiers(record)];

  // Annexe A # 1 : forme canonique de `listingId`, « sinon REJET ».
  const listingId = record['listingId'];
  if (listingId !== null && listingId !== undefined) {
    if (typeof listingId !== 'string' || !LISTING_ID_PATTERN.test(listingId)) {
      issues.push({
        path: 'listingId',
        code: 'LISTING_ID_MALFORMED',
        message: `listingId doit être un UUID canonique 8-4-4-4-12 minuscule (annexe A # 1)`,
      });
    }
  }

  // Annexe A # 2 : l'hôte de `listingUrl` appartient au domaine du marketplace, « sinon REJET ».
  const listingUrl = record['listingUrl'];
  if (listingUrl !== null && listingUrl !== undefined) {
    const domain = options.listingUrlDomain ?? 'autoscout24';
    if (typeof listingUrl !== 'string') {
      issues.push({ path: 'listingUrl', code: 'TYPE_NOT_STRING', message: `listingUrl n'est pas une chaîne` });
    } else {
      let host: string | null;
      try {
        host = new URL(listingUrl).host;
      } catch {
        host = null;
      }
      if (host === null) {
        issues.push({ path: 'listingUrl', code: 'LISTING_URL_MALFORMED', message: `listingUrl n'est pas une URL absolue` });
      } else if (!hostMatchesDomain(host, domain)) {
        issues.push({
          path: 'listingUrl',
          code: 'LISTING_URL_HOST_UNEXPECTED',
          message: `hôte « ${host} » hors du domaine attendu ${domain}.<tld> (annexe A # 2)`,
        });
      }
    }
  }

  // Champs OBL du dictionnaire (contrôle opt-in : voir `requireMandatory`).
  if (options.requireMandatory === true) {
    for (const field of LISTING_MANDATORY_FIELDS) {
      const value = record[field];
      if (value === null || value === undefined || value === '') {
        issues.push({ path: field, code: 'MANDATORY_FIELD_MISSING', message: `${field} est OBLIGATOIRE (annexe A)` });
      }
    }
  }

  // Longueurs maximales du dictionnaire (DR-113).
  for (const [field, max] of Object.entries(LISTING_STRING_BOUNDS)) {
    if (field === 'trimToken') continue;
    const value = record[field];
    if (typeof value !== 'string') continue;
    if ([...value].length > max) {
      issues.push({
        path: field,
        code: 'STRING_TOO_LONG',
        message: `${field} dépasse ${max} points de code (annexe A)`,
      });
    }
  }
  const trimTokens = record['trimTokens'];
  if (Array.isArray(trimTokens)) {
    if (trimTokens.length > LISTING_TRIM_TOKENS_MAX) {
      issues.push({
        path: 'trimTokens',
        code: 'STRING_TOO_LONG',
        message: `trimTokens dépasse ${LISTING_TRIM_TOKENS_MAX} jetons (annexe A # 22)`,
      });
    }
    trimTokens.forEach((token, i) => {
      if (typeof token === 'string' && [...token].length > (LISTING_STRING_BOUNDS['trimToken'] as number)) {
        issues.push({
          path: `trimTokens[${i}]`,
          code: 'STRING_TOO_LONG',
          message: `un jeton de finition dépasse ${LISTING_STRING_BOUNDS['trimToken'] as number} points de code`,
        });
      }
    });
  }

  // Cohérence `priceStatus` / `priceEur` (EX-DATA-16/18/32) : la contradiction se résout à
  // l'ingestion, elle ne doit jamais atteindre une structure KYCAR (DR-109).
  const priceStatus = record['priceStatus'];
  const priceEur = record['priceEur'];
  if (typeof priceStatus === 'string') {
    const quoted = priceStatus === 'QUOTED';
    if (quoted && (priceEur === null || priceEur === undefined)) {
      issues.push({
        path: 'priceEur',
        code: 'PRICE_STATUS_INCONSISTENT',
        message: `priceStatus = QUOTED exige un montant (EX-DATA-32)`,
      });
    }
    if (!quoted && typeof priceEur === 'number') {
      issues.push({
        path: 'priceEur',
        code: 'PRICE_STATUS_INCONSISTENT',
        message: `priceStatus = ${priceStatus} exige priceEur = null (EX-DATA-32)`,
      });
    }
  }

  const modelYearMax = defaultModelYearMax(options.observedAtYear);
  for (const [field, bound] of Object.entries(LISTING_NUMERIC_BOUNDS)) {
    const effective: NumericBound = field === 'modelYear' ? { ...bound, max: modelYearMax } : bound;
    const value = record[field];
    if (value === null || value === undefined) continue;
    if (typeof value !== 'number' || Number.isNaN(value)) {
      issues.push({ path: field, code: 'TYPE_NOT_NUMERIC', message: `${field} n'est pas un nombre` });
      continue;
    }
    if (effective.sentinel !== null && value === effective.sentinel) continue;
    if (value < effective.min || value > effective.max) {
      issues.push({
        path: field,
        code: 'OUT_OF_RANGE',
        message: `${field} = ${value} hors des bornes [${effective.min}, ${effective.max}]`,
      });
    }
  }

  // Sentinelle interdite comme valeur métier décodée : la vue logique doit porter `null`, pas `-1`.
  for (const field of ['priceEur', 'mileageKm', 'powerKw', 'modelYear', 'electricRangeKm']) {
    if (record[field] === -1) {
      issues.push({
        path: field,
        code: 'RAW_SENTINEL_LEAK',
        message: `${field} porte la sentinelle brute -1 ; la vue décodée doit utiliser null (EX-DATA-120)`,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
