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
      }
      visit(value, childPath, [...ancestorKeys, key]);
    }
  };
  visit(record, pathPrefix, []);
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
export const LISTING_NUMERIC_BOUNDS: Readonly<Record<string, NumericBound>> = {
  priceEur: { min: 1, max: 5_000_000, sentinel: null },
  mileageKm: { min: 0, max: 1_500_000, sentinel: null },
  modelYear: { min: 1900, max: 2101, sentinel: null },
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
 * Valide un enregistrement d'annonce (vue logique décodée, ou objet candidat). Applique d'abord le
 * garde R3, puis les bornes numériques des champs reconnus. Un champ `null`/absent est admis
 * (valeur INCONNU, EX-DATA-2). Ne juge PAS l'appartenance aux vocabulaires (elle exige le
 * référentiel — voir `reference.ts`).
 */
export function validateListingRecord(record: Record<string, unknown>): ValidationResult {
  const issues: ValidationIssue[] = [...scanForbiddenFields(record)];

  for (const [field, bound] of Object.entries(LISTING_NUMERIC_BOUNDS)) {
    const value = record[field];
    if (value === null || value === undefined) continue;
    if (typeof value !== 'number' || Number.isNaN(value)) {
      issues.push({ path: field, code: 'TYPE_NOT_NUMERIC', message: `${field} n'est pas un nombre` });
      continue;
    }
    if (bound.sentinel !== null && value === bound.sentinel) continue;
    if (value < bound.min || value > bound.max) {
      issues.push({
        path: field,
        code: 'OUT_OF_RANGE',
        message: `${field} = ${value} hors des bornes [${bound.min}, ${bound.max}]`,
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
