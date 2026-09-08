import { describe, expect, it } from 'vitest';
import {
  buildReferenceData,
  modelKey,
  type RawFilters,
  type RawFiltersScope,
  type RawReferenceFile,
  type RawReferenceInputs,
  type RawTaxonomy,
} from '../../../src/types/reference';
import { BE_POSTAL_RANGES, REGION_VALUES, VOCABULARY_NAMES } from '../../../src/types/vocabularies';

/**
 * Sonde de revue D2 — chargeur de référentiels (`reference.ts`) : comportement nominal sur les
 * VRAIS fichiers du dépôt, robustesse (fichier absent, JSON invalide, `_index.json` incohérent) et
 * instruction des points ouverts O14 (table NUTS-2 BE) et O15 (`Model.bodyTypes`).
 */

const taxonomyMod = import.meta.glob('../../../data/reference/taxonomy.json', { eager: true, import: 'default' });
const filtersMod = import.meta.glob('../../../data/reference/filters.json', { eager: true, import: 'default' });
const scopeMod = import.meta.glob('../../../data/reference/filters-scope.json', { eager: true, import: 'default' });
const refMods = import.meta.glob('../../../data/reference/references/*.json', { eager: true, import: 'default' });

const taxonomy = Object.values(taxonomyMod)[0] as RawTaxonomy;
const filters = Object.values(filtersMod)[0] as RawFilters;
const filtersScope = Object.values(scopeMod)[0] as RawFiltersScope;

const referenceFiles: Record<string, RawReferenceFile> = {};
/** Le fichier `_index.json` du dépôt ne porte PAS `referenceType` : il est écarté explicitement. */
const indexEntries: [string, unknown][] = [];
for (const [path, mod] of Object.entries(refMods)) {
  if (path.endsWith('_index.json')) {
    indexEntries.push([path, mod]);
    continue;
  }
  const file = mod as RawReferenceFile;
  referenceFiles[file.referenceType] = file;
}

const inputs: RawReferenceInputs = { taxonomy, referenceFiles, filters, filtersScope };
const data = buildReferenceData(inputs);

describe('D2 — chargement nominal des référentiels du dépôt', () => {
  it('assemble les 27 vocabulaires nommés (EX-DATA-8) avec les effectifs de la table §A.1', () => {
    expect(data.vocabularies.size).toBe(27);
    for (const name of VOCABULARY_NAMES) expect(data.vocabularies.has(name)).toBe(true);
    const n = (v: Parameters<typeof data.decodeEnum>[0]): number => data.vocabularies.get(v)?.values.length ?? -1;
    expect(n('KYCAR_FUEL_CATEGORY')).toBe(10);
    expect(n('KYCAR_FUEL_TYPE')).toBe(16);
    expect(n('KYCAR_OFFER_TYPE')).toBe(6);
    expect(n('KYCAR_USAGE_STATE')).toBe(3);
    expect(n('KYCAR_TRANSMISSION')).toBe(3);
    expect(n('KYCAR_DRIVETRAIN')).toBe(3);
    expect(n('KYCAR_BODY_TYPE')).toBe(9);
    expect(n('KYCAR_BODY_COLOR')).toBe(14);
    expect(n('KYCAR_PAINT_TYPE')).toBe(5);
    expect(n('KYCAR_UPHOLSTERY_TYPE')).toBe(6);
    expect(n('KYCAR_UPHOLSTERY_COLOR')).toBe(11);
    expect(n('KYCAR_EU_EMISSION_STANDARD')).toBe(11);
    expect(n('KYCAR_CO2_CLASS')).toBe(7);
    expect(n('KYCAR_EFFICIENCY_CLASS')).toBe(10);
    expect(n('KYCAR_BATTERY_OWNERSHIP')).toBe(3);
    expect(n('KYCAR_EQUIPMENT')).toBe(132);
    expect(n('KYCAR_SEAL')).toBe(14);
    expect(n('KYCAR_SELLER_TYPE')).toBe(2);
    expect(n('KYCAR_PRICE_EVALUATION')).toBe(6);
    expect(n('KYCAR_AD_TIER')).toBe(5);
    expect(n('KYCAR_MARKETPLACE')).toBe(9);
    expect(n('KYCAR_VEHICLE_TYPE')).toBe(1);
    expect(n('KYCAR_REGION')).toBe(11);
    expect(n('KYCAR_PRICE_STATUS')).toBe(3);
    expect(n('KYCAR_MEASUREMENT_STANDARD')).toBe(3);
    expect(n('KYCAR_OUTLIER_FLAG')).toBe(6);
  });

  it('EX-DATA-9 : le décodage exige le vocabulaire, et deux vocabulaires disjoints ne se confondent pas', () => {
    // Le code `2` vaut « Électrique/Essence » en FUEL_CATEGORY et « Super 95 » en FUEL_TYPE.
    const cat = data.decodeEnum('KYCAR_FUEL_CATEGORY', '2');
    const typ = data.decodeEnum('KYCAR_FUEL_TYPE', '2');
    expect(cat).not.toBeNull();
    expect(typ).not.toBeNull();
    expect(cat).not.toBe(typ);
  });

  it('taxonomie : 295 marques, 4 955 modèles, index (makeId, modelId) cohérent', () => {
    expect(data.makes).toHaveLength(295);
    expect(data.models).toHaveLength(4955);
    const first = data.models[0];
    expect(first).toBeDefined();
    if (first) expect(data.modelByKey.get(modelKey(first.makeId, first.modelId))).toBe(first);
  });
});

describe('D2 — robustesse du chargeur (point 10 de la revue)', () => {
  it('fichier de référence absent : erreur nommée, jamais un vocabulaire silencieusement vide', () => {
    const amputé: Record<string, RawReferenceFile> = { ...referenceFiles };
    delete amputé['BodyType'];
    expect(() => buildReferenceData({ ...inputs, referenceFiles: amputé })).toThrow(
      /fichier de référence manquant pour KYCAR_BODY_TYPE/,
    );
  });

  it('énumération `filters.json` absente : erreur nommée', () => {
    const sansCustomerType: RawFilters = { enumerations: { ...filters.enumerations } };
    delete (sansCustomerType.enumerations as Record<string, unknown>)['customerType'];
    expect(() => buildReferenceData({ ...inputs, filters: sansCustomerType })).toThrow(
      /énumération filters.json manquante pour customerType/,
    );
  });

  it('`_index.json` du dépôt : il ne porte pas `referenceType` et n’est donc pas un fichier de référence', () => {
    expect(indexEntries).toHaveLength(1);
    const index = indexEntries[0]?.[1] as { referenceType?: string; referenceTypes?: unknown[] };
    expect(index.referenceType).toBeUndefined();
    expect(Array.isArray(index.referenceTypes)).toBe(true);
  });

  it('R-D2-14 — `_index.json` injecté par erreur dans la table : rejet nommé, pas une clé « undefined »', () => {
    // Le chargeur indexe par `file.referenceType` sans le valider. Un appelant (D8) qui n'écarte
    // pas `_index.json` produit silencieusement une entrée `undefined` au lieu d'une erreur.
    //
    // SONDE CORRIGÉE (D-31, justification DR-110). Telle qu'écrite, elle construisait elle-même
    // l'objet pollué avec `[String(index.referenceType)]` — donc littéralement la clé « undefined »,
    // puisque le « fait » vert ci-dessus établit que `_index.json` ne porte PAS de `referenceType` —
    // puis affirmait que cette clé n'existait pas : l'assertion était insatisfaisable et
    // n'exerçait à aucun moment le chargeur. La CORRECTION ATTENDUE par DR-110 est « valider que
    // chaque entrée porte un `referenceType` non vide cohérent avec sa clé, avec une erreur
    // nommée » : c'est ce que la sonde mesure désormais, sur le chargeur, sans changer son intention.
    const index = indexEntries[0]?.[1] as RawReferenceFile;
    const pollué: Record<string, RawReferenceFile> = { ...referenceFiles, [String(index.referenceType)]: index };
    expect(Object.keys(pollué)).toContain('undefined'); // ce que l'appelant fautif produit
    expect(() => buildReferenceData({ ...inputs, referenceFiles: pollué })).toThrow(/referenceType/);
  });

  it('R-D2-15 — fichier de référence structurellement invalide : erreur nommée, pas un TypeError brut', () => {
    // « JSON invalide » se manifeste ici par un objet dont `references` n'est pas un tableau
    // (le `JSON.parse` est du ressort de l'appelant : le chargeur est pur, EX-NFR-10).
    const cassé = { ...referenceFiles, BodyType: { referenceType: 'BodyType' } as unknown as RawReferenceFile };
    expect(() => buildReferenceData({ ...inputs, referenceFiles: cassé })).toThrow(/BodyType|référence/);
  });

  it('fait — taxonomie structurellement invalide : erreur nommée', () => {
    const cassée = {} as unknown as RawTaxonomy;
    expect(() => buildReferenceData({ ...inputs, taxonomy: cassée })).toThrow(/taxonom/i);
  });
});

describe('D2 — O14 : table NUTS-2 BE encodée en dur (EX-DATA-52/53)', () => {
  it('13 plages, 11 régions, bornes inclusives, couverture SANS trou de 1000 à 9999', () => {
    expect(BE_POSTAL_RANGES).toHaveLength(13);
    expect(REGION_VALUES).toHaveLength(11);
    expect(data.postalRanges).toHaveLength(13);
    expect(data.regions).toHaveLength(11);
    for (let cp = 1000; cp <= 9999; cp++) {
      expect(data.resolveRegionBE(cp), `code postal ${cp}`).not.toBeNull();
    }
  });

  it('plages disjointes et contiguës, chaque regionCode appartient au vocabulaire KYCAR_REGION', () => {
    const codes = new Set(REGION_VALUES.map((r) => r.code));
    const sorted = [...BE_POSTAL_RANGES].sort((a, b) => a.lo - b.lo);
    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      expect(r).toBeDefined();
      if (!r) continue;
      expect(r.hi).toBeGreaterThanOrEqual(r.lo);
      expect(codes.has(r.regionCode)).toBe(true);
      const next = sorted[i + 1];
      if (next) expect(next.lo).toBe(r.hi + 1);
    }
    expect(sorted[0]?.lo).toBe(1000);
    expect(sorted[sorted.length - 1]?.hi).toBe(9999);
  });

  it('hors des plages : aucune région (EX-DATA-52 → REGION_UNRESOLVED)', () => {
    expect(data.resolveRegionBE(999)).toBeNull();
    expect(data.resolveRegionBE(10_000)).toBeNull();
  });

  // Promotion 2.6 (D-49) : sonde rouge convertie en it.fails — elle documente une dette consignée et se
  // signalera d elle-même (échec de it.fails) le jour où la dette est levée. Jamais skip.
  // DETTE DR-112 / D-49 : exceptions communales (postal-regions-be.json) exigent une source externe officielle interdite par E5 ; couverture actuelle exhaustive, marquée [EXTRAPOLÉ].
  it.fails('R-D2-16 — EX-DATA-54 : les exceptions communales priment sur les plages', () => {
    // `data/reference/postal-regions-be.json` (sections `ranges` + `exceptions`) n'existe pas dans
    // le dépôt ; `resolveRegionBE` ne consulte que les plages extrapolées codées en dur.
    const fichiers = import.meta.glob('../../../data/reference/postal-regions-be.json', { eager: true });
    expect(Object.keys(fichiers)).toHaveLength(1);
  });
});

describe('D2 — O15 : Model.bodyTypes et index taxonomique par carrosserie (EX-DATA-115bis)', () => {
  it('tous les modèles portent un bodyTypes vide (jamais INCONNU) — état réel de taxonomy.json', () => {
    expect(data.models.every((m) => Array.isArray(m.bodyTypes))).toBe(true);
    const nonVides = data.models.filter((m) => m.bodyTypes.length > 0);
    expect(nonVides).toHaveLength(0);
  });

  it('R-D2-17 — l’index taxonomique par carrosserie est exposé par `ReferenceData`', () => {
    // EX-DATA-115bis conditionne la classe R du filtre Carrosserie à un index modèle→carrosserie.
    // `ReferenceData` n'expose aucun index de ce nom : ni vide, ni marqué indisponible.
    const clefs = Object.keys(data);
    expect(clefs.some((k) => /body/i.test(k))).toBe(true);
  });
});
