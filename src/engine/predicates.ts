/**
 * KYCAR — Prédicats de raffinement (filtres de classe R) et taxonomie de classe T (lot D4)
 * =================================================================================================
 * Les filtres de classe `R` (EX-SRCH-9bis) sont appliqués EN MÉMOIRE par le moteur sur le jeu de
 * données local, jamais par le `DataProvider`. Les filtres de classe `T` (`make`, `mmmv`, `cat`,
 * `mcat`) contraignent la taxonomie : ils pilotent l'ÉLAGAGE (EX-DATA-116) via `IDX_MAKE`/`IDX_MODEL`.
 *
 * Ce module type les prédicats et les COMPILE en tests rapides (table booléenne de 256 entrées pour
 * les colonnes énumérées sur un octet ; comparaison bornée pour les plages numériques).
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { ListingColumnBatch } from '../types/index';
import { hpToKw, NUMERIC_UNKNOWN } from '../types/index';
import { yearFromYearMonth } from './flags';

/** Colonnes énumérées sur un octet éligibles à un filtre `R` / à une facette. */
export type EnumColumnName =
  | 'fuelCategory'
  | 'bodyType'
  | 'transmission'
  | 'drivetrain'
  | 'offerType'
  | 'usageState'
  | 'sellerType'
  | 'regionCode'
  | 'countryCode'
  | 'priceStatus'
  | 'priceEvaluationCategory'
  | 'adTier'
  | 'bodyColor'
  | 'upholsteryType'
  | 'euEmissionStandard'
  | 'doorCount'
  | 'seatCount'
  | 'previousOwnerCount'
  | 'imageCount';

/** Colonnes numériques éligibles à une plage `R`. La métrique `year` est dérivée du yearMonth. */
export type NumericColumnName = 'priceEur' | 'mileageKm' | 'powerKw' | 'modelYear' | 'year';

/**
 * Unité dans laquelle les bornes d'une plage sont SAISIES (EX-SRCH-11bis, ARB-33). Le prédicat
 * s'évalue toujours sur le champ canonique dans son unité canonique (`EX-DATA-4`) ; une borne
 * exprimée dans une unité d'affichage est convertie AVANT comparaison, sans arrondi intermédiaire.
 * `'hp'` (chevaux DIN, `powertype = hp`) n'est admis que sur `powerKw`.
 */
export type RangeBoundUnit = 'canonical' | 'hp';

/** Prédicat de raffinement (classe R). */
export type RefinePredicate =
  | {
      readonly kind: 'enum';
      /** Identifiant KYCAR du filtre (clé de facette). */
      readonly filterId: string;
      readonly column: EnumColumnName;
      /** Codes d'octet acceptés. Une valeur INCONNUE (255) n'est acceptée que si 255 y figure. */
      readonly codes: readonly number[];
    }
  | {
      readonly kind: 'range';
      readonly filterId: string;
      readonly column: NumericColumnName;
      readonly min: number | null;
      readonly max: number | null;
      /** Unité des bornes (EX-SRCH-11bis). Absente = unité canonique de la colonne. */
      readonly unit?: RangeBoundUnit;
    };

/** Contrainte de taxonomie (classe T) pilotant l'élagage. */
export interface TaxonomyScope {
  /** Marques retenues (élagage via `IDX_MAKE`). */
  readonly makeIds?: readonly number[];
  /** Couples marque/modèle retenus (élagage via `IDX_MODEL`). */
  readonly models?: readonly { readonly makeId: number; readonly modelId: number }[];
}

/** Lecture typée d'une colonne énumérée du batch. */
export function enumColumn(batch: ListingColumnBatch, name: EnumColumnName): Uint8Array {
  return batch[name];
}

/** Lecture d'une colonne numérique brute (avant décodage de sentinelle). `year` est dérivé. */
function readNumericColumn(batch: ListingColumnBatch, row: number, column: NumericColumnName): number {
  switch (column) {
    case 'priceEur':
      return batch.priceEur[row] as number;
    case 'mileageKm':
      return batch.mileageKm[row] as number;
    case 'powerKw':
      return batch.powerKw[row] as number;
    case 'modelYear':
      return batch.modelYear[row] as number;
    case 'year': {
      const ym = batch.firstRegistrationYearMonth[row] as number;
      return ym === NUMERIC_UNKNOWN ? NUMERIC_UNKNOWN : yearFromYearMonth(ym);
    }
  }
}

/** Un prédicat compilé : un test `row → booléen` et l'identifiant du filtre. */
export interface CompiledPredicate {
  readonly filterId: string;
  readonly kind: 'enum' | 'range';
  readonly column: EnumColumnName | NumericColumnName;
  test(row: number): boolean;
}

/** Compile un prédicat de raffinement en test rapide sur le batch. */
export function compilePredicate(batch: ListingColumnBatch, predicate: RefinePredicate): CompiledPredicate {
  if (predicate.kind === 'enum') {
    const col = enumColumn(batch, predicate.column);
    const lut = new Uint8Array(256);
    for (const c of predicate.codes) {
      if (c >= 0 && c <= 255) lut[c] = 1;
    }
    return {
      filterId: predicate.filterId,
      kind: 'enum',
      column: predicate.column,
      test: (row: number) => lut[col[row] as number] === 1,
    };
  }
  const { column } = predicate;
  const [min, max] = canonicalBounds(predicate);
  return {
    filterId: predicate.filterId,
    kind: 'range',
    column,
    test: (row: number) => {
      const v = readNumericColumn(batch, row, column);
      if (v === NUMERIC_UNKNOWN) return false; // valeur inconnue exclue d'une plage
      if (min !== null && v < min) return false;
      if (max !== null && v > max) return false;
      return true;
    },
  };
}

/**
 * Convertit les bornes d'une plage vers l'unité CANONIQUE de la colonne (EX-SRCH-11bis, ARB-33).
 *
 * `powertype = hp` : `powerKw ≥ borne_ch × 0,7355` et `powerKw ≤ borne_ch × 0,7355`, la constante
 * étant celle d'EX-DATA-36 (DIN 66036) et aucune autre, appliquée en double précision et **sans
 * arrondi intermédiaire** — la conversion produit le seuil exact, jamais un entier arrondi. Le champ
 * dérivé `powerHp` est un champ d'affichage et n'est jamais le membre gauche d'un prédicat.
 *
 * `hpToKw` est le symbole unique de la conversion (`src/types/shared-rules.ts`) : le moteur et
 * `compileSelection` côté provider s'en servent tous les deux, il n'existe pas de seconde constante.
 */
function canonicalBounds(predicate: {
  readonly column: NumericColumnName;
  readonly min: number | null;
  readonly max: number | null;
  readonly unit?: RangeBoundUnit;
}): [number | null, number | null] {
  if (predicate.unit === undefined || predicate.unit === 'canonical') return [predicate.min, predicate.max];
  if (predicate.column !== 'powerKw') {
    throw new Error(`predicates: unité ${predicate.unit} inapplicable à la colonne ${predicate.column}`);
  }
  return [
    predicate.min === null ? null : hpToKw(predicate.min),
    predicate.max === null ? null : hpToKw(predicate.max),
  ];
}

/** Compile une liste de prédicats. */
export function compilePredicates(
  batch: ListingColumnBatch,
  predicates: readonly RefinePredicate[],
): readonly CompiledPredicate[] {
  return predicates.map((p) => compilePredicate(batch, p));
}
