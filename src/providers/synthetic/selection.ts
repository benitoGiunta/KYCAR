/**
 * KYCAR — Compilation d'une `SelectionQuery` en prédicat sur le lot du provider synthétique
 * =================================================================================================
 * Traduit une `SelectionQuery` canonique (EX-DATA-108 : `id=v1,v2;id2=v3`, IDENTIFIANTS de filtre D5
 * — jamais les paramètres d'URL) en un prédicat sur les lignes du lot en mémoire. Le provider est
 * ainsi AUTONOME et TESTABLE sans le moteur D4.
 *
 * DR-005 (BLOQUANT) — la table ne mappait que 21 identifiants et en IGNORAIT 15 dont la colonne
 * existe pourtant dans `ListingColumnBatch` : `makesModelsVariants`, `fuelType`, `gearType`,
 * `dateOfRegistrationFrom/To`, `countryType`, `numberOfOwners`, `doorFrom/To`,
 * `numberOfSeatsFrom/To`, `electricRangeFrom/To`, `emissionClass`, `priceEvaluation`. Les 15 sont
 * désormais mappés, y compris la valeur STRUCTURÉE `mmmv` décodée en `TaxonomyScope`.
 *
 * DEUX RÈGLES NON NÉGOCIABLES (D-03, DR-016) :
 *   1. Un identifiant NON pris en charge est déclaré dans `unsupported` — jamais ignoré en silence.
 *   2. Un prédicat non applicable ne peut être satisfait par AUCUNE ligne : il compile en un test
 *      constamment faux. L'effectif publié est donc un PLANCHER honnête (0 pour un filtre
 *      inapplicable seul), jamais l'effectif NON FILTRÉ étiqueté comme filtré. Le contrôleur lit
 *      `unsupportedFilterIds` (`AggregateResult`) et bascule en état dégradé `ET-FILTRE-NON-APPLIQUE`
 *      plutôt que de publier ce plancher (D-03, fix-app).
 *
 * `powerFrom`/`powerTo` sont exprimés dans l'unité désignée par `powerType` (ARB-33/EX-SRCH-11bis) :
 * une borne en chevaux est convertie en kW par `hpToKw`, la constante UNIQUE de la couche D2
 * (DR-008), sans arrondi intermédiaire.
 */

import type { ReferenceData } from '../../types/reference';
import type { VocabularyName } from '../../types/vocabularies';
import { NUMERIC_UNKNOWN } from '../../types/sentinels';
import { hpToKw } from '../../types/shared-rules';
import type { CoreColumns } from './generate';

/** Prédicat compilé + liste des identifiants de filtre non pris en charge. */
export interface CompiledSelection {
  readonly predicate: (i: number) => boolean;
  readonly unsupported: readonly string[];
  /** Vrai si la sélection est vide (équivalent `FULL`) : aucun filtre effectif. */
  readonly isEmpty: boolean;
}

/** Colonne énumérée d'un octet ciblée par un filtre, avec son vocabulaire de décodage. */
type EnumColumn = keyof Pick<
  CoreColumns,
  | 'fuelCategory'
  | 'bodyType'
  | 'bodyColor'
  | 'upholsteryType'
  | 'drivetrain'
  | 'transmission'
  | 'sellerType'
  | 'offerType'
  | 'regionCode'
  | 'usageState'
  | 'countryCode'
  | 'euEmissionStandard'
  | 'priceEvaluationCategory'
>;

/**
 * Identifiants D5 dont la valeur est un CODE du vocabulaire de la colonne visée. `fuelType` (domaine
 * `filters.json#fuel`) et `KYCAR_FUEL_CATEGORY` partagent leurs dix codes (`B`, `D`, `2`, `3`, `E`,
 * `H`, `L`, `C`, `M`, `O`) : la traduction est l'identité, vérifiée par le test du lot.
 */
const ENUM_FILTERS: Readonly<Record<string, { column: EnumColumn; vocabulary: VocabularyName }>> = {
  fuelCategory: { column: 'fuelCategory', vocabulary: 'KYCAR_FUEL_CATEGORY' },
  fuelType: { column: 'fuelCategory', vocabulary: 'KYCAR_FUEL_CATEGORY' },
  bodyType: { column: 'bodyType', vocabulary: 'KYCAR_BODY_TYPE' },
  bodyColor: { column: 'bodyColor', vocabulary: 'KYCAR_BODY_COLOR' },
  upholstery: { column: 'upholsteryType', vocabulary: 'KYCAR_UPHOLSTERY_TYPE' },
  driveTrain: { column: 'drivetrain', vocabulary: 'KYCAR_DRIVETRAIN' },
  transmission: { column: 'transmission', vocabulary: 'KYCAR_TRANSMISSION' },
  gearType: { column: 'transmission', vocabulary: 'KYCAR_TRANSMISSION' },
  sellerType: { column: 'sellerType', vocabulary: 'KYCAR_SELLER_TYPE' },
  offer: { column: 'offerType', vocabulary: 'KYCAR_OFFER_TYPE' },
  region: { column: 'regionCode', vocabulary: 'KYCAR_REGION' },
  hadAccident: { column: 'usageState', vocabulary: 'KYCAR_USAGE_STATE' },
  usageState: { column: 'usageState', vocabulary: 'KYCAR_USAGE_STATE' },
  emissionClass: { column: 'euEmissionStandard', vocabulary: 'KYCAR_EU_EMISSION_STANDARD' },
  priceEvaluation: { column: 'priceEvaluationCategory', vocabulary: 'KYCAR_PRICE_EVALUATION' },
};

/**
 * `countryType` (`cy`) porte le domaine D5 des pays de recherche (`A`, `B`, `D`, `E`, `F`, `I`, `L`,
 * `NL`) tandis que la colonne `countryCode` porte le vocabulaire `KYCAR_MARKETPLACE` (`at`, `be`,
 * `de`, `es`, `fr`, `it`, `lu`, `nl`). Traduction EXPLICITE, jamais une coïncidence de casse
 * (EX-DATA-40).
 */
const COUNTRY_TYPE_TO_MARKETPLACE: Readonly<Record<string, string>> = {
  A: 'at',
  B: 'be',
  D: 'de',
  E: 'es',
  F: 'fr',
  I: 'it',
  L: 'lu',
  NL: 'nl',
};

/** Colonne numérique ciblée par une borne min/max. */
type RangeColumn = keyof Pick<
  CoreColumns,
  'priceEur' | 'mileageKm' | 'modelYear' | 'powerKw' | 'doorCount' | 'seatCount' | 'electricRangeKm' | 'previousOwnerCount'
>;

const RANGE_FILTERS: Readonly<Record<string, { column: RangeColumn; bound: 'min' | 'max' }>> = {
  priceFrom: { column: 'priceEur', bound: 'min' },
  priceTo: { column: 'priceEur', bound: 'max' },
  mileageFrom: { column: 'mileageKm', bound: 'min' },
  mileageTo: { column: 'mileageKm', bound: 'max' },
  modelYearFrom: { column: 'modelYear', bound: 'min' },
  modelYearTo: { column: 'modelYear', bound: 'max' },
  dateOfModelYearFrom: { column: 'modelYear', bound: 'min' },
  dateOfModelYearTo: { column: 'modelYear', bound: 'max' },
  powerFrom: { column: 'powerKw', bound: 'min' },
  powerTo: { column: 'powerKw', bound: 'max' },
  doorFrom: { column: 'doorCount', bound: 'min' },
  doorTo: { column: 'doorCount', bound: 'max' },
  numberOfSeatsFrom: { column: 'seatCount', bound: 'min' },
  numberOfSeatsTo: { column: 'seatCount', bound: 'max' },
  electricRangeFrom: { column: 'electricRangeKm', bound: 'min' },
  electricRangeTo: { column: 'electricRangeKm', bound: 'max' },
  // `prevownersid` porte une sémantique « au plus » relevée (`AT_MOST_PRESUMED`, filter-registry).
  numberOfOwners: { column: 'previousOwnerCount', bound: 'max' },
};

/** Parse une `SelectionQuery` canonique en paires (id, valeurs). */
function parsePairs(query: string): Map<string, string[]> {
  const pairs = new Map<string, string[]>();
  const trimmed = query.trim();
  if (trimmed === '' || trimmed === 'FULL') return pairs;
  for (const part of trimmed.split(';')) {
    if (part === '') continue;
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const id = part.slice(0, eq);
    const values = part.slice(eq + 1).split(',').filter((v) => v.length > 0);
    if (id.length > 0 && values.length > 0) pairs.set(id, values);
  }
  return pairs;
}

/** Ensemble d'indices d'octet correspondant à des codes, pour un filtre énuméré. */
function enumIndexSet(ref: ReferenceData, vocabulary: VocabularyName, codes: readonly string[]): Set<number> {
  const voc = ref.vocabularies.get(vocabulary);
  const set = new Set<number>();
  if (voc === undefined) return set;
  for (const code of codes) {
    const idx = voc.values.findIndex((v) => v.code === code);
    if (idx >= 0) set.add(idx);
  }
  return set;
}

/**
 * Portée de taxonomie décodée d'un `mmmv` (EX-SRCH-9bis) : chaque valeur est
 * `<makeId>|<modelId>|<versionId>`, les deux derniers segments étant facultatifs. Une valeur qui ne
 * porte QUE la marque élargit la portée à toute la marque ; le segment version n'a pas de colonne
 * dans le lot (`modelVersion*` est du texte libre) et n'est donc PAS appliqué — sans conséquence
 * sur l'effectif, puisque toute annonce du couple marque/modèle reste retenue.
 */
export interface TaxonomySelectionScope {
  readonly makeIds: ReadonlySet<number>;
  readonly models: ReadonlySet<number>;
}

/** Décode la valeur structurée `makesModelsVariants` en portée de taxonomie. */
export function decodeTaxonomyScope(values: readonly string[]): TaxonomySelectionScope {
  const makeIds = new Set<number>();
  const models = new Set<number>();
  for (const value of values) {
    const parts = value.split('|');
    const makeId = Number(parts[0]);
    if (!Number.isFinite(makeId)) continue;
    const modelRaw = parts[1];
    if (modelRaw === undefined || modelRaw === '') {
      makeIds.add(makeId);
      continue;
    }
    const modelId = Number(modelRaw);
    if (Number.isFinite(modelId)) models.add(makeId * 1_000_000 + modelId);
    else makeIds.add(makeId);
  }
  return { makeIds, models };
}

/**
 * **D8-20 / O15** — vrai si la sélection DÉSIGNE UN MODÈLE UNIQUE, c'est-à-dire si elle est celle de
 * l'écran B / du mode 2 (`EX-NAV-15` : un couple marque+modèle complet redirige vers B). C'est le
 * seul critère observable PAR LE PROVIDER de l'entrée en mode 2, et c'est exactement la portée du
 * bandeau normatif « Filtre Carrosserie non appliqué **à ce modèle** (donnée indisponible) ».
 * Une sélection qui ne pince qu'une MARQUE (zones-modèles de l'écran A, mode 1) n'est pas concernée.
 */
function pinsSingleModel(pairs: ReadonlyMap<string, string[]>): boolean {
  const model = pairs.get('model');
  if (model !== undefined && model.length === 1) return true;
  const mmmv = pairs.get('makesModelsVariants');
  if (mmmv === undefined) return false;
  const scope = decodeTaxonomyScope(mmmv);
  return scope.makeIds.size === 0 && scope.models.size === 1;
}

/**
 * **D8-20 / O15 — le seul filtre DÉCLARÉ non appliqué SANS annuler l'effectif.**
 * `bodyType` est de classe `DYNAMIC_BODY` (`EX-SCR-82` #44, `EX-SCR-221`) : `R` en mode 1, `T` en
 * mode 2, et sa résolution AU MODÈLE passe par `Model.bodyTypes`, que la taxonomie ne sert pas
 * (O15 — `bodyTypes = []` sur les 4 955 modèles, `EX-DATA-115bis`). Quand la sélection désigne un
 * modèle unique, le filtre ne peut donc PAS être honoré à cette granularité.
 *
 * Il est alors DÉCLARÉ dans `unsupportedFilterIds` — la coquille en fait le bandeau d'O15 — et
 * l'effectif publié reste celui de la sélection SANS carrosserie. C'est le SEUL identifiant qui ne
 * compile pas en prédicat constamment faux : la règle 2 de l'en-tête (« plancher honnête ») vise un
 * filtre qu'on ne sait pas évaluer ; ici on SAIT que le filtre ne s'applique pas au modèle, et
 * publier 0 offre mentirait autant que publier un effectif faussement filtré. « Jamais appliqué en
 * silence, jamais ignoré en silence » : l'effectif est complet ET l'écart est nommé.
 */
const BODY_FILTER_ID = 'bodyType';

/** Compile une `SelectionQuery` en prédicat sur les lignes du lot. */
export function compileSelection(
  batch: CoreColumns,
  query: string,
  ref: ReferenceData,
): CompiledSelection {
  const pairs = parsePairs(query);
  if (pairs.size === 0) {
    return { predicate: () => true, unsupported: [], isEmpty: true };
  }

  const tests: Array<(i: number) => boolean> = [];
  const unsupported: string[] = [];
  // ARB-33 : l'unité des bornes de puissance est portée par `powerType` (`kw` par défaut).
  const powerInHp = (pairs.get('powerType') ?? []).includes('hp');
  // D8-20 : la carrosserie n'est pas résoluble AU MODÈLE tant que `Model.bodyTypes` est vide (O15).
  const bodyUnresolvableAtModel = !ref.bodyTypeIndexAvailable && pinsSingleModel(pairs);

  for (const [id, values] of pairs) {
    if (id === 'powerType') continue; // paramètre d'UNITÉ, jamais un prédicat (EX-SRCH-18bis).

    if (id === BODY_FILTER_ID && bodyUnresolvableAtModel) {
      unsupported.push(id); // DÉCLARÉ, non appliqué, sans annuler l'effectif — voir ci-dessus.
      continue;
    }

    if (id === 'make' || id === 'model') {
      const ids = new Set(values.map((v) => Number(v)).filter((n) => Number.isFinite(n)));
      const col = id === 'make' ? batch.makeId : batch.modelId;
      tests.push((i) => ids.has(col[i] as number));
      continue;
    }

    if (id === 'makesModelsVariants') {
      const scope = decodeTaxonomyScope(values);
      if (scope.makeIds.size === 0 && scope.models.size === 0) {
        unsupported.push(id);
        continue;
      }
      const makeCol = batch.makeId;
      const modelCol = batch.modelId;
      tests.push((i) => {
        const makeId = makeCol[i] as number;
        if (scope.makeIds.has(makeId)) return true;
        return scope.models.has(makeId * 1_000_000 + (modelCol[i] as number));
      });
      continue;
    }

    if (id === 'countryType') {
      const codes = values.map((v) => COUNTRY_TYPE_TO_MARKETPLACE[v]).filter((c): c is string => c !== undefined);
      const set = enumIndexSet(ref, 'KYCAR_MARKETPLACE', codes);
      const col = batch.countryCode;
      tests.push((i) => set.has(col[i] as number));
      continue;
    }

    if (id === 'dateOfRegistrationFrom' || id === 'dateOfRegistrationTo') {
      // EX-DATA-25 : le pivot temporel est la PREMIÈRE IMMATRICULATION, jamais l'année-modèle.
      const year = Number(values[0]);
      if (!Number.isFinite(year)) {
        unsupported.push(id);
        continue;
      }
      const col = batch.firstRegistrationYearMonth;
      const isMin = id === 'dateOfRegistrationFrom';
      tests.push((i) => {
        const ym = col[i] as number;
        if (ym === NUMERIC_UNKNOWN) return false;
        const y = Math.floor(ym / 12);
        return isMin ? y >= year : y <= year;
      });
      continue;
    }

    const enumSpec = ENUM_FILTERS[id];
    if (enumSpec !== undefined) {
      const set = enumIndexSet(ref, enumSpec.vocabulary, values);
      const col = batch[enumSpec.column];
      tests.push((i) => set.has(col[i] as number));
      continue;
    }

    const rangeSpec = RANGE_FILTERS[id];
    if (rangeSpec !== undefined) {
      const raw = Number(values[0]);
      if (!Number.isFinite(raw)) {
        unsupported.push(id);
        continue;
      }
      const isPower = rangeSpec.column === 'powerKw';
      const threshold = isPower && powerInHp ? hpToKw(raw) : raw;
      const col = batch[rangeSpec.column];
      if (rangeSpec.bound === 'min') {
        tests.push((i) => {
          const v = col[i] as number;
          return v !== NUMERIC_UNKNOWN && v >= threshold;
        });
      } else {
        tests.push((i) => {
          const v = col[i] as number;
          return v !== NUMERIC_UNKNOWN && v <= threshold;
        });
      }
      continue;
    }

    // Aucune colonne, aucune règle : le filtre est DÉCLARÉ non appliqué et aucune ligne ne peut être
    // prouvée conforme (règle 2 de l'en-tête) — jamais l'effectif non filtré.
    unsupported.push(id);
    tests.push(() => false);
  }

  const predicate = (i: number): boolean => {
    for (const t of tests) if (!t(i)) return false;
    return true;
  };
  return { predicate, unsupported, isEmpty: tests.length === 0 };
}

/** Indices des lignes satisfaisant une sélection compilée. */
export function selectRows(rowCount: number, compiled: CompiledSelection): number[] {
  if (compiled.isEmpty) {
    const all = new Array<number>(rowCount);
    for (let i = 0; i < rowCount; i += 1) all[i] = i;
    return all;
  }
  const out: number[] = [];
  for (let i = 0; i < rowCount; i += 1) if (compiled.predicate(i)) out.push(i);
  return out;
}
