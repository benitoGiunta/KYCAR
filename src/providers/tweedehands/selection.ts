/**
 * KYCAR — Adaptateur 2dehands (lot D9) : traduction d'une `SelectionQuery` en requête de source
 * =================================================================================================
 * DR-016 (BLOQUANT). `fetchAggregates`/`fetchSelectionCount` n'analysaient QUE le filtre `make` et
 * ignoraient les 76 autres, tout en renvoyant la `selection` demandée comme « sélection
 * effectivement appliquée » : le `<n> offres` d'`EX-SCR-46` et toutes les fourchettes affichées
 * étaient ceux de la sélection NON filtrée. Ce module remplace ce raccourci par une traduction
 * complète et EXPLICITE, en trois catégories :
 *
 *   1. **poussé à la source** — la facette existe dans l'URL autorisée par `robots.txt` : marque et
 *      modèle, seuls segments de `/l/auto-s/<marque>/<modèle>/`. Un compte obtenu ainsi est
 *      EXHAUSTIF (`totalResultCount`).
 *   2. **résiduel** — le prédicat n'a pas de facette d'URL relevée (E4/E5 : on ne devine pas une
 *      grammaire d'URL sans la vérifier en réseau) mais il est évaluable sur une annonce normalisée.
 *      Il est appliqué à l'ÉCHANTILLON lu. Le compte cesse alors d'être exhaustif et l'agrégat le
 *      dit (`sampleCoverage = null`).
 *   3. **non pris en charge** — ni facette, ni champ normalisé : l'identifiant est DÉCLARÉ dans
 *      `unsupported` (D-03) et AUCUNE ligne ne peut être prouvée conforme. Le compte publié est
 *      alors nul — un plancher honnête —, jamais l'effectif non filtré étiqueté comme filtré.
 *
 * `dateOfRegistrationFrom`/`To` sont volontairement en catégorie 3 : `EX-DATA-25` en fait le pivot
 * temporel, `EX-DATA-27` interdit de l'imputer depuis l'année-modèle, et cette surface ne sert pas la
 * date de première immatriculation (DR-017). Les filtrer sur `modelYear` produirait un effectif faux
 * d'un à deux ans ; les déclarer non appliqués dit la vérité.
 */

import { hpToKw } from '../../types/shared-rules';
import type { SelectionQuery } from '../DataProvider';
import type { NormalizedListing } from './normalize';

/** Prédicat résiduel appliqué à l'échantillon lu. */
export type ResidualPredicate = (listing: NormalizedListing) => boolean;

/** Traduction d'une `SelectionQuery` pour cette source. */
export interface CompiledSourceSelection {
  /** Segment de marque de l'URL autorisée (`/l/auto-s/<brandSlug>/`), si la sélection en porte un. */
  readonly makeId: number | undefined;
  /** Identifiant de modèle demandé (segment `/<modelSlug>/`), si la sélection en porte un. */
  readonly modelId: number | undefined;
  /** Prédicats évaluables sur une annonce normalisée, appliqués à l'échantillon. */
  readonly residual: readonly ResidualPredicate[];
  /** Identifiants de filtre DÉCLARÉS non appliqués (`AggregateResult.unsupportedFilterIds`, D-03). */
  readonly unsupported: readonly string[];
  /**
   * Sous-ensemble de `unsupported` qu'AUCUNE annonce ne peut satisfaire (catégorie 3 de l'en-tête) :
   * l'échantillon retenu est alors VIDE, plancher honnête. Le seul identifiant déclaré SANS être
   * bloquant est `bodyType` quand la sélection désigne un modèle unique (D8-20 / O15) : on SAIT que
   * le filtre ne s'applique pas au modèle, et publier 0 offre mentirait autant que publier un
   * effectif faussement filtré. « Jamais appliqué en silence, jamais ignoré en silence. »
   */
  readonly blocking: readonly string[];
  /** Vrai si la sélection est vide (aucun filtre effectif). */
  readonly isEmpty: boolean;
  /**
   * Vrai si TOUTE la sélection a pu être poussée à la source : le `totalResultCount` renvoyé est
   * alors l'effectif exhaustif de la sélection. Faux dès qu'un prédicat résiduel ou un identifiant
   * non pris en charge subsiste — l'effectif publié n'est plus exhaustif.
   */
  readonly exhaustive: boolean;
}

/** Parse une `SelectionQuery` canonique en paires (id, valeurs) — EX-DATA-108. */
function parsePairs(query: SelectionQuery): Map<string, string[]> {
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

/** Champ énuméré d'une annonce normalisée ciblé par un filtre de code. */
type EnumField = 'fuelCategory' | 'bodyType' | 'transmission' | 'drivetrain' | 'usageState' | 'sellerType' | 'euEmissionStandard' | 'countryCode';

/** Identifiants D5 dont la valeur est un code du vocabulaire du champ normalisé visé. */
const ENUM_FILTERS: Readonly<Record<string, EnumField>> = {
  fuelType: 'fuelCategory',
  fuelCategory: 'fuelCategory',
  bodyType: 'bodyType',
  gearType: 'transmission',
  transmission: 'transmission',
  driveTrain: 'drivetrain',
  hadAccident: 'usageState',
  usageState: 'usageState',
  sellerType: 'sellerType',
  emissionClass: 'euEmissionStandard',
};

/** `countryType` (domaine D5 `cy`) → code pays ISO alpha-2 du champ normalisé (EX-DATA-40). */
const COUNTRY_TYPE_TO_ISO: Readonly<Record<string, string>> = {
  A: 'AT',
  B: 'BE',
  D: 'DE',
  E: 'ES',
  F: 'FR',
  I: 'IT',
  L: 'LU',
  NL: 'NL',
};

/** Champ numérique d'une annonce normalisée ciblé par une borne. */
type RangeField = 'priceEur' | 'mileageKm' | 'powerKw' | 'doorCount' | 'seatCount';

const RANGE_FILTERS: Readonly<Record<string, { field: RangeField; bound: 'min' | 'max' }>> = {
  priceFrom: { field: 'priceEur', bound: 'min' },
  priceTo: { field: 'priceEur', bound: 'max' },
  mileageFrom: { field: 'mileageKm', bound: 'min' },
  mileageTo: { field: 'mileageKm', bound: 'max' },
  powerFrom: { field: 'powerKw', bound: 'min' },
  powerTo: { field: 'powerKw', bound: 'max' },
  doorFrom: { field: 'doorCount', bound: 'min' },
  doorTo: { field: 'doorCount', bound: 'max' },
  numberOfSeatsFrom: { field: 'seatCount', bound: 'min' },
  numberOfSeatsTo: { field: 'seatCount', bound: 'max' },
};

/** Décode le premier couple `<makeId>|<modelId>` d'une valeur structurée `mmmv` (EX-SRCH-9bis). */
function decodeFirstTaxonomyPair(values: readonly string[]): { makeId?: number; modelId?: number } {
  const first = values[0];
  if (first === undefined) return {};
  const parts = first.split('|');
  const makeId = Number(parts[0]);
  if (!Number.isFinite(makeId)) return {};
  const modelRaw = parts[1];
  if (modelRaw === undefined || modelRaw === '') return { makeId };
  const modelId = Number(modelRaw);
  return Number.isFinite(modelId) ? { makeId, modelId } : { makeId };
}

/**
 * **D8-20 / O15** — vrai si la sélection désigne UN MODÈLE UNIQUE, c'est-à-dire l'écran B / le
 * mode 2 (`EX-NAV-15`). Même critère et même justification que dans le provider synthétique
 * (`synthetic/selection.ts`) : un seul et même comportement pour les deux sources.
 */
function pinsSingleModel(pairs: ReadonlyMap<string, string[]>): boolean {
  const model = pairs.get('model');
  if (model !== undefined && model.length === 1 && Number.isFinite(Number(model[0]))) return true;
  const mmmv = pairs.get('makesModelsVariants');
  if (mmmv === undefined || mmmv.length !== 1) return false;
  return decodeFirstTaxonomyPair(mmmv).modelId !== undefined;
}

/** Identifiant D5 du filtre Carrosserie (`param` = `body`), seul filtre de classe `DYNAMIC_BODY`. */
const BODY_FILTER_ID = 'bodyType';

/**
 * Traduit une `SelectionQuery` canonique pour la surface autorisée de 2dehands.
 * @param bodyTypeIndexAvailable `ReferenceData.bodyTypeIndexAvailable` — faux tant que la taxonomie
 * ne sert pas `Model.bodyTypes` (O15). Faux ⇒ `bodyType` n'est pas résoluble au modèle (D8-20).
 */
export function compileSourceSelection(
  selection: SelectionQuery,
  bodyTypeIndexAvailable = true,
): CompiledSourceSelection {
  const pairs = parsePairs(selection);
  if (pairs.size === 0) {
    return {
      makeId: undefined,
      modelId: undefined,
      residual: [],
      unsupported: [],
      blocking: [],
      isEmpty: true,
      exhaustive: true,
    };
  }

  let makeId: number | undefined;
  let modelId: number | undefined;
  const residual: ResidualPredicate[] = [];
  const unsupported: string[] = [];
  const declaredNotApplied: string[] = [];
  const powerInHp = (pairs.get('powerType') ?? []).includes('hp');
  const bodyUnresolvableAtModel = !bodyTypeIndexAvailable && pinsSingleModel(pairs);

  for (const [id, values] of pairs) {
    if (id === 'powerType') continue; // paramètre d'UNITÉ, jamais un prédicat (EX-SRCH-18bis).

    if (id === BODY_FILTER_ID && bodyUnresolvableAtModel) {
      // D8-20 / O15 : DÉCLARÉ non appliqué, mais NON bloquant — l'effectif reste celui de la
      // sélection sans carrosserie, et la coquille en fait le bandeau d'O15.
      declaredNotApplied.push(id);
      continue;
    }

    if (id === 'make') {
      const n = Number(values[0]);
      if (Number.isFinite(n)) makeId = n;
      else unsupported.push(id);
      continue;
    }
    if (id === 'model') {
      const n = Number(values[0]);
      if (Number.isFinite(n)) modelId = n;
      else unsupported.push(id);
      continue;
    }
    if (id === 'makesModelsVariants') {
      const pair = decodeFirstTaxonomyPair(values);
      if (pair.makeId === undefined) {
        unsupported.push(id);
        continue;
      }
      makeId = pair.makeId;
      if (pair.modelId !== undefined) modelId = pair.modelId;
      // Une sélection `mmmv` à PLUSIEURS couples ne se pousse pas dans une URL à un seul segment de
      // marque : le reste est déclaré non appliqué plutôt que silencieusement perdu.
      if (values.length > 1) unsupported.push(id);
      continue;
    }
    if (id === 'countryType') {
      const codes = new Set(values.map((v) => COUNTRY_TYPE_TO_ISO[v]).filter((c): c is string => c !== undefined));
      if (codes.size === 0) {
        unsupported.push(id);
        continue;
      }
      residual.push((l) => l.countryCode !== null && codes.has(l.countryCode));
      continue;
    }
    const enumField = ENUM_FILTERS[id];
    if (enumField !== undefined) {
      const codes = new Set(values);
      residual.push((l) => {
        const code = l[enumField];
        return code !== null && codes.has(code);
      });
      continue;
    }
    const range = RANGE_FILTERS[id];
    if (range !== undefined) {
      const raw = Number(values[0]);
      if (!Number.isFinite(raw)) {
        unsupported.push(id);
        continue;
      }
      // ARB-33 / EX-SRCH-11bis : une borne de puissance en chevaux est convertie AVANT comparaison.
      const threshold = range.field === 'powerKw' && powerInHp ? hpToKw(raw) : raw;
      const { field, bound } = range;
      residual.push((l) => {
        const value = l[field];
        if (value === null) return false;
        return bound === 'min' ? value >= threshold : value <= threshold;
      });
      continue;
    }
    unsupported.push(id);
  }

  const declared = [...unsupported, ...declaredNotApplied];
  return {
    makeId,
    modelId,
    residual,
    unsupported: declared,
    blocking: unsupported,
    isEmpty:
      makeId === undefined && modelId === undefined && residual.length === 0 && declared.length === 0,
    // Un `bodyType` déclaré non appliqué ne rend PAS l'effectif non exhaustif : le compte publié est
    // celui, exhaustif, de la sélection sans carrosserie — et le bandeau le dit (D8-20).
    exhaustive: residual.length === 0 && unsupported.length === 0,
  };
}

/**
 * Applique les prédicats résiduels à un échantillon. Un identifiant NON PRIS EN CHARGE ne peut être
 * satisfait par aucune annonce : l'échantillon retenu est vide (règle 3 de l'en-tête).
 */
export function applyResidual(
  sample: readonly NormalizedListing[],
  compiled: CompiledSourceSelection,
): readonly NormalizedListing[] {
  if (compiled.blocking.length > 0) return [];
  if (compiled.residual.length === 0) return sample;
  return sample.filter((l) => compiled.residual.every((test) => test(l)));
}
