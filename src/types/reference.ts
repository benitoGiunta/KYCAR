/**
 * KYCAR — Chargeur des référentiels statiques (EX-DATA-105 : Make, Model, Enumeration, EnumValue,
 * Region, PostalRegionRange)
 * =================================================================================================
 * Lot D2. Fonction PURE `buildReferenceData(raw)` : elle reçoit les JSON DÉJÀ PARSÉS du dépôt
 * (`data/reference/taxonomy.json`, `references/*.json`, `filters.json`, `filters-scope.json`) et les
 * expose typés, indexés et validés. Elle ne régénère RIEN et ne lit pas le disque : le câblage
 * réel (fetch au démarrage, EX-NFR-4) est du ressort de l'app (D8) ; les tests l'alimentent avec les
 * vrais fichiers. Ce découplage évite d'inliner 692 Ko de taxonomie dans le bundle (garde EX-NFR-10).
 *
 * Assemblage des 27 vocabulaires (EX-DATA-8, §A.1) : les vocabulaires adossés à un fichier sont
 * filtrés selon la table §A.1 (BodyType→9 codes voiture, Equipment→132, FuelCategory→10 sans le
 * code `T` moto, VehicleType→{C}) ; les vocabulaires CRÉÉS proviennent de `vocabularies.ts`.
 */

import type {
  Enumeration,
  Make,
  Model,
  PostalRegionRange,
  Region,
} from './entities';
import {
  AD_TIER_VALUES,
  BE_POSTAL_RANGES,
  INGEST_FLAG_VALUES,
  MARKETPLACE_VALUES,
  MEASUREMENT_STANDARD_VALUES,
  OUTLIER_FLAG_VALUES,
  PRICE_EVALUATION_VALUES,
  PRICE_STATUS_VALUES,
  REGION_VALUES,
  USAGE_STATE_VALUES,
  VOCABULARY_NAMES,
  type EnumValueDef,
  type VocabularyName,
} from './vocabularies';

/* ---- Formes brutes des fichiers du dépôt ------------------------------------------------------- */

export interface RawModel {
  readonly id: number;
  readonly label: string;
  readonly slug?: string;
  readonly vehicleType?: string;
  readonly bodyTypes?: readonly string[];
}
export interface RawMake {
  readonly id: number;
  readonly label: string;
  readonly slug?: string;
  readonly vehicleTypes?: readonly string[];
  readonly models?: readonly RawModel[];
}
export interface RawTaxonomy {
  readonly makes: readonly RawMake[];
}
export interface RawReferenceEntry {
  readonly id: string;
  readonly label: string;
  readonly vehicleType?: readonly string[];
  readonly country?: string | null;
}
export interface RawReferenceFile {
  readonly referenceType: string;
  readonly references: readonly RawReferenceEntry[];
}
export interface RawEnumEntry {
  readonly code: string | number;
  readonly label_fr?: string;
  readonly label_en?: string;
}
export interface RawFilters {
  readonly enumerations: Readonly<Record<string, readonly RawEnumEntry[]>>;
}
export interface RawScopeEntry {
  readonly id: string;
  readonly param: string;
  readonly label: string;
  readonly type: string;
  readonly group: string;
}
export interface RawFiltersScope {
  readonly totalRetenus: number;
  readonly retenus: readonly RawScopeEntry[];
  readonly exclus?: readonly RawScopeEntry[];
}

/** Entrées brutes du chargeur : les JSON du dépôt déjà parsés. */
export interface RawReferenceInputs {
  readonly taxonomy: RawTaxonomy;
  /** `references/*.json` indexés par `referenceType` (ex. `FuelCategory`, `BodyType`). */
  readonly referenceFiles: Readonly<Record<string, RawReferenceFile>>;
  readonly filters: RawFilters;
  readonly filtersScope: RawFiltersScope;
}

/* ---- Sortie typée ----------------------------------------------------------------------------- */

export interface FilterScope {
  readonly retained: readonly RawScopeEntry[];
  readonly excluded: readonly RawScopeEntry[];
  readonly retainedIds: ReadonlySet<string>;
}

export interface ReferenceData {
  readonly makes: readonly Make[];
  readonly makeById: ReadonlyMap<number, Make>;
  readonly models: readonly Model[];
  readonly modelByKey: ReadonlyMap<string, Model>;
  readonly modelsByMake: ReadonlyMap<number, readonly Model[]>;
  readonly vocabularies: ReadonlyMap<VocabularyName, Enumeration>;
  readonly regions: readonly Region[];
  readonly postalRanges: readonly PostalRegionRange[];
  readonly filterScope: FilterScope;
  /** Décode un code dans un vocabulaire NOMMÉ explicitement (EX-DATA-9). `null` si code inconnu. */
  decodeEnum(vocabulary: VocabularyName, code: string): string | null;
  /** Résout un code postal belge en `regionCode` NUTS-2, ou `null` (EX-DATA-52/54). */
  resolveRegionBE(postalCode: number): string | null;
}

const NFC = (s: string): string => s.normalize('NFC');

/** Clé composite d'un modèle. */
export function modelKey(makeId: number, modelId: number): string {
  return `${makeId}:${modelId}`;
}

function slugify(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

function toEnumeration(
  vocabulary: VocabularyName,
  origin: string,
  values: readonly EnumValueDef[],
): Enumeration {
  const byCode = new Map<string, string>();
  for (const v of values) byCode.set(v.code, v.label);
  return { vocabulary, origin, values, byCode };
}

/** Charge un vocabulaire depuis un `references/*.json`, avec filtre optionnel sur `vehicleType`. */
function fromReferenceFile(
  vocabulary: VocabularyName,
  file: RawReferenceFile | undefined,
  opts: { readonly carOnly?: boolean; readonly dropCodes?: ReadonlySet<string>; readonly onlyCode?: string } = {},
): Enumeration {
  if (file === undefined) {
    throw new Error(`reference: fichier de référence manquant pour ${vocabulary}`);
  }
  const values: EnumValueDef[] = [];
  for (const r of file.references) {
    if (opts.carOnly && !(r.vehicleType?.includes('C') ?? false)) continue;
    if (opts.onlyCode !== undefined && r.id !== opts.onlyCode) continue;
    if (opts.dropCodes?.has(r.id)) continue;
    values.push({ code: r.id, label: NFC(r.label) });
  }
  return toEnumeration(vocabulary, `references/${file.referenceType}.json`, values);
}

/** Charge un vocabulaire depuis une énumération de `filters.json`. */
function fromFiltersEnum(
  vocabulary: VocabularyName,
  filters: RawFilters,
  key: string,
): Enumeration {
  const entries = filters.enumerations[key];
  if (entries === undefined) {
    throw new Error(`reference: énumération filters.json manquante pour ${key} (${vocabulary})`);
  }
  const values: EnumValueDef[] = entries
    .filter((e) => String(e.code).length > 0)
    .map((e) => ({ code: String(e.code), label: NFC(e.label_fr ?? e.label_en ?? String(e.code)) }));
  return toEnumeration(vocabulary, `filters.json#enumerations.${key}`, values);
}

/** Construit la table complète des 27 vocabulaires. */
function buildVocabularies(inputs: RawReferenceInputs): Map<VocabularyName, Enumeration> {
  const ref = inputs.referenceFiles;
  const f = inputs.filters;
  const v = new Map<VocabularyName, Enumeration>();

  // Adossés à references/*.json
  v.set('KYCAR_FUEL_CATEGORY', fromReferenceFile('KYCAR_FUEL_CATEGORY', ref['FuelCategory'], { dropCodes: new Set(['T']) }));
  v.set('KYCAR_FUEL_TYPE', fromReferenceFile('KYCAR_FUEL_TYPE', ref['FuelType']));
  v.set('KYCAR_OFFER_TYPE', fromReferenceFile('KYCAR_OFFER_TYPE', ref['OfferType']));
  v.set('KYCAR_TRANSMISSION', fromReferenceFile('KYCAR_TRANSMISSION', ref['Transmission']));
  v.set('KYCAR_DRIVETRAIN', fromReferenceFile('KYCAR_DRIVETRAIN', ref['Drivetrain']));
  v.set('KYCAR_BODY_TYPE', fromReferenceFile('KYCAR_BODY_TYPE', ref['BodyType'], { carOnly: true }));
  v.set('KYCAR_BODY_COLOR', fromReferenceFile('KYCAR_BODY_COLOR', ref['BodyColor']));
  v.set('KYCAR_UPHOLSTERY_TYPE', fromReferenceFile('KYCAR_UPHOLSTERY_TYPE', ref['UpholsteryType']));
  v.set('KYCAR_UPHOLSTERY_COLOR', fromReferenceFile('KYCAR_UPHOLSTERY_COLOR', ref['UpholsteryColor']));
  v.set('KYCAR_EU_EMISSION_STANDARD', fromReferenceFile('KYCAR_EU_EMISSION_STANDARD', ref['EuEmissionStandard']));
  v.set('KYCAR_CO2_CLASS', fromReferenceFile('KYCAR_CO2_CLASS', ref['Co2Class']));
  v.set('KYCAR_EFFICIENCY_CLASS', fromReferenceFile('KYCAR_EFFICIENCY_CLASS', ref['EfficiencyClass']));
  v.set('KYCAR_BATTERY_OWNERSHIP', fromReferenceFile('KYCAR_BATTERY_OWNERSHIP', ref['BatteryOwnershipType']));
  v.set('KYCAR_EQUIPMENT', fromReferenceFile('KYCAR_EQUIPMENT', ref['Equipment'], { carOnly: true }));
  v.set('KYCAR_VEHICLE_TYPE', fromReferenceFile('KYCAR_VEHICLE_TYPE', ref['VehicleType'], { onlyCode: 'C' }));

  // Adossés à filters.json
  v.set('KYCAR_PAINT_TYPE', fromFiltersEnum('KYCAR_PAINT_TYPE', f, 'bodyPainting'));
  v.set('KYCAR_SELLER_TYPE', fromFiltersEnum('KYCAR_SELLER_TYPE', f, 'customerType'));
  v.set('KYCAR_SEAL', fromFiltersEnum('KYCAR_SEAL', f, 'seals'));

  // CRÉÉS (vocabularies.ts)
  v.set('KYCAR_USAGE_STATE', toEnumeration('KYCAR_USAGE_STATE', 'CRÉÉ (§A.1 ustate)', USAGE_STATE_VALUES));
  v.set('KYCAR_PRICE_EVALUATION', toEnumeration('KYCAR_PRICE_EVALUATION', 'CRÉÉ (§A.1.2, EX-DATA-12)', PRICE_EVALUATION_VALUES));
  v.set('KYCAR_AD_TIER', toEnumeration('KYCAR_AD_TIER', 'CRÉÉ (OAS:Tier + NONE)', AD_TIER_VALUES));
  v.set('KYCAR_MARKETPLACE', toEnumeration('KYCAR_MARKETPLACE', 'CRÉÉ (OAS:Marketplace)', MARKETPLACE_VALUES));
  v.set('KYCAR_REGION', toEnumeration('KYCAR_REGION', 'CRÉÉ (§A.8 NUTS-2) [EXTRAPOLÉ]', REGION_VALUES));
  v.set('KYCAR_PRICE_STATUS', toEnumeration('KYCAR_PRICE_STATUS', 'CRÉÉ (§A.5.3)', PRICE_STATUS_VALUES));
  v.set('KYCAR_MEASUREMENT_STANDARD', toEnumeration('KYCAR_MEASUREMENT_STANDARD', 'CRÉÉ (§A.5.5)', MEASUREMENT_STANDARD_VALUES));
  v.set('KYCAR_INGEST_FLAG', toEnumeration('KYCAR_INGEST_FLAG', 'CRÉÉ (§A.6, EX-DATA-45)', INGEST_FLAG_VALUES));
  v.set('KYCAR_OUTLIER_FLAG', toEnumeration('KYCAR_OUTLIER_FLAG', 'CRÉÉ (§B.6)', OUTLIER_FLAG_VALUES));

  // Contrôle d'exhaustivité : les 27 vocabulaires doivent être présents.
  for (const name of VOCABULARY_NAMES) {
    if (!v.has(name)) throw new Error(`reference: vocabulaire ${name} non assemblé`);
  }
  return v;
}

function buildTaxonomy(taxonomy: RawTaxonomy): {
  makes: Make[];
  makeById: Map<number, Make>;
  models: Model[];
  modelByKey: Map<string, Model>;
  modelsByMake: Map<number, Model[]>;
} {
  const makes: Make[] = [];
  const makeById = new Map<number, Make>();
  const models: Model[] = [];
  const modelByKey = new Map<string, Model>();
  const modelsByMake = new Map<number, Model[]>();

  for (const rm of taxonomy.makes) {
    const label = NFC(rm.label);
    const make: Make = {
      makeId: rm.id,
      label,
      slug: rm.slug ?? slugify(label),
      announcedCount: null,
    };
    makes.push(make);
    makeById.set(make.makeId, make);

    const bucket: Model[] = [];
    for (const rmo of rm.models ?? []) {
      const mlabel = NFC(rmo.label);
      const model: Model = {
        makeId: rm.id,
        modelId: rmo.id,
        label: mlabel,
        slug: rmo.slug ?? slugify(mlabel),
        // taxonomy.json ne porte pas bodyTypes → tableau vide, jamais INCONNU (EX-DATA-115bis).
        bodyTypes: rmo.bodyTypes ?? [],
        announcedCount: null,
      };
      models.push(model);
      modelByKey.set(modelKey(model.makeId, model.modelId), model);
      bucket.push(model);
    }
    modelsByMake.set(rm.id, bucket);
  }
  return { makes, makeById, models, modelByKey, modelsByMake };
}

function buildRegions(): { regions: Region[]; postalRanges: PostalRegionRange[] } {
  const regions: Region[] = REGION_VALUES.map((r) => ({
    regionCode: r.code,
    regionName: r.label,
    countryCode: 'BE',
  }));
  const postalRanges: PostalRegionRange[] = BE_POSTAL_RANGES.map((p) => ({
    countryCode: 'BE',
    lo: p.lo,
    hi: p.hi,
    regionCode: p.regionCode,
  }));
  return { regions, postalRanges };
}

/** Construit la structure de référence typée à partir des JSON du dépôt déjà parsés. */
export function buildReferenceData(inputs: RawReferenceInputs): ReferenceData {
  const { makes, makeById, models, modelByKey, modelsByMake } = buildTaxonomy(inputs.taxonomy);
  const vocabularies = buildVocabularies(inputs);
  const { regions, postalRanges } = buildRegions();

  const retained = inputs.filtersScope.retenus;
  const excluded = inputs.filtersScope.exclus ?? [];
  const filterScope: FilterScope = {
    retained,
    excluded,
    retainedIds: new Set(retained.map((r) => r.id)),
  };

  const decodeEnum = (vocabulary: VocabularyName, code: string): string | null => {
    const voc = vocabularies.get(vocabulary);
    if (voc === undefined) return null;
    return voc.byCode.get(code) ?? null;
  };

  const resolveRegionBE = (postalCode: number): string | null => {
    for (const range of postalRanges) {
      if (postalCode >= range.lo && postalCode <= range.hi) return range.regionCode;
    }
    return null;
  };

  return {
    makes,
    makeById,
    models,
    modelByKey,
    modelsByMake,
    vocabularies,
    regions,
    postalRanges,
    filterScope,
    decodeEnum,
    resolveRegionBE,
  };
}
