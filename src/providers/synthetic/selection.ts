/**
 * KYCAR — Filtrage de sélection interne du provider synthétique
 * =================================================================================================
 * Traduit une `SelectionQuery` canonique (EX-DATA-108 : `id=v1,v2;id2=v3`) en un prédicat sur les
 * lignes du lot en mémoire. Le provider est ainsi AUTONOME et TESTABLE sans le moteur D4.
 *
 * PÉRIMÈTRE SUPPORTÉ (dette signalée) : les filtres qui s'appliquent 1:1 aux colonnes stockées —
 * `make`/`model` (identifiants entiers), les énumérés adossés à un vocabulaire de colonne, et les
 * bornes numériques prix/km/année/puissance. Les filtres D5 STRUCTURÉS (`mmmv`, `mcat`) et le filtre
 * `fuelType` (vocabulaire KYCAR_FUEL_TYPE ≠ colonne `fuelCategory`) NE sont PAS interprétés ici : le
 * câblage de la grammaire d'état complète relève de l'intégration D4/D5. Un filtre non reconnu est
 * IGNORÉ (aucune contrainte ajoutée) et remonté dans `unsupported`.
 */

import type { ReferenceData } from '../../types/reference';
import type { VocabularyName } from '../../types/vocabularies';
import type { ListingColumnBatch } from '../DataProvider';
import { NUMERIC_UNKNOWN } from '../../types/sentinels';

/** Prédicat compilé + liste des identifiants de filtre non pris en charge. */
export interface CompiledSelection {
  readonly predicate: (i: number) => boolean;
  readonly unsupported: readonly string[];
  /** Vrai si la sélection est vide (équivalent `FULL`) : aucun filtre effectif. */
  readonly isEmpty: boolean;
}

/** Colonne énumérée d'un octet ciblée par un filtre, avec son vocabulaire de décodage. */
type EnumColumn = keyof Pick<
  ListingColumnBatch,
  'fuelCategory' | 'bodyType' | 'bodyColor' | 'upholsteryType' | 'drivetrain' | 'transmission' | 'sellerType' | 'offerType' | 'regionCode' | 'usageState'
>;

const ENUM_FILTERS: Readonly<Record<string, { column: EnumColumn; vocabulary: VocabularyName }>> = {
  fuelCategory: { column: 'fuelCategory', vocabulary: 'KYCAR_FUEL_CATEGORY' },
  bodyType: { column: 'bodyType', vocabulary: 'KYCAR_BODY_TYPE' },
  bodyColor: { column: 'bodyColor', vocabulary: 'KYCAR_BODY_COLOR' },
  upholstery: { column: 'upholsteryType', vocabulary: 'KYCAR_UPHOLSTERY_TYPE' },
  driveTrain: { column: 'drivetrain', vocabulary: 'KYCAR_DRIVETRAIN' },
  transmission: { column: 'transmission', vocabulary: 'KYCAR_TRANSMISSION' },
  sellerType: { column: 'sellerType', vocabulary: 'KYCAR_SELLER_TYPE' },
  offer: { column: 'offerType', vocabulary: 'KYCAR_OFFER_TYPE' },
  region: { column: 'regionCode', vocabulary: 'KYCAR_REGION' },
  hadAccident: { column: 'usageState', vocabulary: 'KYCAR_USAGE_STATE' },
  usageState: { column: 'usageState', vocabulary: 'KYCAR_USAGE_STATE' },
};

/** Colonne numérique ciblée par une borne min/max. */
type RangeColumn = keyof Pick<ListingColumnBatch, 'priceEur' | 'mileageKm' | 'modelYear' | 'powerKw'>;

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

/** Compile une `SelectionQuery` en prédicat sur les lignes du lot. */
export function compileSelection(
  batch: ListingColumnBatch,
  query: string,
  ref: ReferenceData,
): CompiledSelection {
  const pairs = parsePairs(query);
  if (pairs.size === 0) {
    return { predicate: () => true, unsupported: [], isEmpty: true };
  }

  const tests: Array<(i: number) => boolean> = [];
  const unsupported: string[] = [];

  for (const [id, values] of pairs) {
    if (id === 'make' || id === 'model') {
      const ids = new Set(values.map((v) => Number(v)).filter((n) => Number.isFinite(n)));
      const col = id === 'make' ? batch.makeId : batch.modelId;
      tests.push((i) => ids.has(col[i] as number));
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
      const threshold = Number(values[0]);
      if (Number.isFinite(threshold)) {
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
      }
      continue;
    }
    unsupported.push(id);
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
