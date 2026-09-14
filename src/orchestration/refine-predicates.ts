/**
 * KYCAR — Traduction d'une sélection D5 en prédicats de raffinement D4 (lot D8, DR-006)
 * =================================================================================================
 * En mode 2 (écrans B/D), la composante `R` de la sélection (`partitionSelection`, D5) est appliquée
 * EN MÉMOIRE par le moteur (`EX-SRCH-9bis`) : le lot colonnaire est déjà élagué au couple
 * marque/modèle (O17), le raffinement est un simple balayage. Ce module est le PONT entre les
 * identifiants de filtre D5 (`SelectionState`) et le vocabulaire de prédicats du moteur
 * (`RefinePredicate`, `src/engine/predicates.ts`).
 *
 * Deux règles, alignées sur `compileSelection` du provider (D-03, DR-005) :
 *   1. un identifiant qu'aucune colonne du lot ne porte est DÉCLARÉ dans `unsupported` — jamais
 *      ignoré en silence (le contrôleur le remonte à la coquille, `ET-FILTRE-NON-APPLIQUE`) ;
 *   2. il n'est pas traduit en prédicat « toujours vrai » : la sélection publiée dirait alors
 *      qu'il est appliqué. L'appelant décide (le contrôleur refuse de présenter l'effectif comme
 *      filtré tant que la liste n'est pas vide).
 *
 * `powerType = hp` (ARB-33 / EX-SRCH-11bis) est porté par `RefinePredicate.unit`, la conversion
 * étant faite par le moteur avec la constante unique `hpToKw` (DR-008) — jamais ici.
 */

import type { EnumColumnName, NumericColumnName, RefinePredicate } from '../engine/predicates';
import type { SelectionState } from '../state/filter-types';
import type { ReferenceData } from '../types/reference';
import type { VocabularyName } from '../types/vocabularies';

/** Filtres énumérés : identifiant D5 → colonne d'octet du lot + vocabulaire de décodage du code. */
const ENUM_FILTERS: Readonly<Record<string, { column: EnumColumnName; vocabulary: VocabularyName }>> = {
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
 * `countryType` (`cy`) porte le domaine D5 des pays de recherche tandis que la colonne
 * `countryCode` porte `KYCAR_MARKETPLACE` : traduction EXPLICITE (même table que le provider).
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

/** Filtres de plage : identifiant D5 → colonne numérique du moteur + borne visée. */
const RANGE_FILTERS: Readonly<Record<string, { column: NumericColumnName; bound: 'min' | 'max' }>> = {
  priceFrom: { column: 'priceEur', bound: 'min' },
  priceTo: { column: 'priceEur', bound: 'max' },
  mileageFrom: { column: 'mileageKm', bound: 'min' },
  mileageTo: { column: 'mileageKm', bound: 'max' },
  powerFrom: { column: 'powerKw', bound: 'min' },
  powerTo: { column: 'powerKw', bound: 'max' },
  modelYearFrom: { column: 'modelYear', bound: 'min' },
  modelYearTo: { column: 'modelYear', bound: 'max' },
  dateOfModelYearFrom: { column: 'modelYear', bound: 'min' },
  dateOfModelYearTo: { column: 'modelYear', bound: 'max' },
  // `EX-DATA-25` : le pivot temporel est la PREMIÈRE IMMATRICULATION, jamais l'année-modèle.
  dateOfRegistrationFrom: { column: 'year', bound: 'min' },
  dateOfRegistrationTo: { column: 'year', bound: 'max' },
};

/** Identifiants de classe `T` absorbés par la route en mode 2 : jamais des prédicats `R`. */
const TAXONOMY_IDS: ReadonlySet<string> = new Set(['make', 'model', 'makesModelsVariants', 'category', 'modelCategory']);

/** Paramètres d'UNITÉ ou d'état d'interface : jamais un prédicat (EX-SRCH-18bis, EX-NAV-10bis). */
const NON_PREDICATE_IDS: ReadonlySet<string> = new Set(['powerType', 'page', 'pageSize', 'sortTypes']);

export interface RefineCompilation {
  readonly refine: readonly RefinePredicate[];
  /** Identifiants posés que le moteur ne peut PAS appliquer (D-03) — jamais silencieux. */
  readonly unsupported: readonly string[];
}

function toCodes(value: SelectionState[string]): string[] {
  const raw = Array.isArray(value) ? value : [value];
  return raw.map((v) => (typeof v === 'number' ? String(v) : v)).filter((v) => v.length > 0);
}

/** Indices d'octet d'un jeu de codes dans un vocabulaire (l'index EST le code stocké en colonne). */
function enumIndexes(ref: ReferenceData, vocabulary: VocabularyName, codes: readonly string[]): number[] {
  const voc = ref.vocabularies.get(vocabulary);
  if (voc === undefined) return [];
  const out: number[] = [];
  for (const code of codes) {
    const idx = voc.values.findIndex((v) => v.code === code);
    if (idx >= 0) out.push(idx);
  }
  return out;
}

/**
 * Traduit la composante `R` d'une sélection en prédicats du moteur. Fonction PURE (ne dépend que du
 * référentiel), testable sans provider ni moteur.
 */
export function buildRefinePredicates(rSelection: SelectionState, ref: ReferenceData): RefineCompilation {
  const refine: RefinePredicate[] = [];
  const unsupported: string[] = [];
  const powerInHp = toCodes(rSelection['powerType'] ?? []).includes('hp');

  for (const [id, value] of Object.entries(rSelection)) {
    if (value === undefined) continue;
    if (NON_PREDICATE_IDS.has(id) || TAXONOMY_IDS.has(id)) continue;
    const codes = toCodes(value);
    if (codes.length === 0) continue;

    if (id === 'countryType') {
      const mapped = codes.map((c) => COUNTRY_TYPE_TO_MARKETPLACE[c]).filter((c): c is string => c !== undefined);
      const indexes = enumIndexes(ref, 'KYCAR_MARKETPLACE', mapped);
      if (indexes.length === 0) unsupported.push(id);
      else refine.push({ kind: 'enum', filterId: id, column: 'countryCode', codes: indexes });
      continue;
    }

    const enumSpec = ENUM_FILTERS[id];
    if (enumSpec !== undefined) {
      const indexes = enumIndexes(ref, enumSpec.vocabulary, codes);
      if (indexes.length === 0) unsupported.push(id);
      else refine.push({ kind: 'enum', filterId: id, column: enumSpec.column, codes: indexes });
      continue;
    }

    const rangeSpec = RANGE_FILTERS[id];
    if (rangeSpec !== undefined) {
      const bound = Number(codes[0]);
      if (!Number.isFinite(bound)) {
        unsupported.push(id);
        continue;
      }
      const unit = rangeSpec.column === 'powerKw' && powerInHp ? ('hp' as const) : undefined;
      refine.push({
        kind: 'range',
        filterId: id,
        column: rangeSpec.column,
        min: rangeSpec.bound === 'min' ? bound : null,
        max: rangeSpec.bound === 'max' ? bound : null,
        ...(unit === undefined ? {} : { unit }),
      });
      continue;
    }

    // Aucune colonne, aucune règle : déclaré non appliqué (règle 1 de l'en-tête).
    unsupported.push(id);
  }

  return { refine, unsupported };
}

/**
 * `D8-05` / `FV-06` (`EX-SCR-65`/`89`/`90`, `EX-DATA-110bis`) — filtres énumérés à FACETTER, en un
 * seul balayage du moteur. Dérivé de la même table `ENUM_FILTERS` que les prédicats : une facette
 * ne peut donc jamais porter sur un filtre que le moteur ne sait pas appliquer, et l'ajout d'un
 * filtre énuméré n'a pas à être répété ici. `countryType` y est joint explicitement (même exception
 * que dans `buildRefinePredicates` : domaine D5 `cy` → colonne `countryCode`).
 */
export const FACET_FILTER_SPECS: readonly { readonly filterId: string; readonly column: EnumColumnName }[] = [
  ...Object.entries(ENUM_FILTERS).map(([filterId, spec]) => ({ filterId, column: spec.column })),
  { filterId: 'countryType', column: 'countryCode' as EnumColumnName },
];
