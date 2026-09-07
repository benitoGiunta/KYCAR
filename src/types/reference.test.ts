import { describe, expect, it } from 'vitest';
import {
  buildReferenceData,
  type RawFilters,
  type RawFiltersScope,
  type RawReferenceFile,
  type RawTaxonomy,
} from './reference';
import { VOCABULARY_NAMES } from './vocabularies';

/**
 * Chargeur de référentiels statiques sur les VRAIS fichiers du dépôt (EX-DATA-105).
 * Les JSON sont chargés via `import.meta.glob` (Vite/Vitest) — typés `unknown`, castés vers les
 * formes brutes, puis passés à la fonction pure `buildReferenceData`. Aucun fichier n'est régénéré.
 */

const taxonomyMod = import.meta.glob('../../data/reference/taxonomy.json', { eager: true, import: 'default' });
const filtersMod = import.meta.glob('../../data/reference/filters.json', { eager: true, import: 'default' });
const scopeMod = import.meta.glob('../../data/reference/filters-scope.json', { eager: true, import: 'default' });
const refMods = import.meta.glob('../../data/reference/references/*.json', { eager: true, import: 'default' });

const taxonomy = Object.values(taxonomyMod)[0] as RawTaxonomy;
const filters = Object.values(filtersMod)[0] as RawFilters;
const filtersScope = Object.values(scopeMod)[0] as RawFiltersScope;

const referenceFiles: Record<string, RawReferenceFile> = {};
for (const [path, mod] of Object.entries(refMods)) {
  if (path.endsWith('_index.json')) continue;
  const file = mod as RawReferenceFile;
  referenceFiles[file.referenceType] = file;
}

const data = buildReferenceData({ taxonomy, referenceFiles, filters, filtersScope });

describe('chargeur de référentiels', () => {
  it('charge la taxonomie : 295 marques, 4 955 modèles', () => {
    expect(data.makes).toHaveLength(295);
    expect(data.models).toHaveLength(4955);
    // Index cohérents.
    expect(data.makeById.size).toBe(295);
    expect(data.modelByKey.size).toBe(4955);
  });

  it('normalise les libellés en NFC et expose slug + index par marque', () => {
    const anyMake = data.makes[0];
    expect(anyMake).toBeDefined();
    if (anyMake) {
      expect(anyMake.label).toBe(anyMake.label.normalize('NFC'));
      expect(anyMake.slug.length).toBeGreaterThan(0);
      expect(data.modelsByMake.get(anyMake.makeId)).toBeDefined();
    }
  });

  it('assemble les 27 vocabulaires avec le bon filtrage §A.1', () => {
    expect(data.vocabularies.size).toBe(27);
    for (const name of VOCABULARY_NAMES) expect(data.vocabularies.has(name)).toBe(true);
    expect(data.vocabularies.get('KYCAR_FUEL_CATEGORY')?.values).toHaveLength(10); // sans le code T
    expect(data.vocabularies.get('KYCAR_BODY_TYPE')?.values).toHaveLength(9); // vehicleType ∋ C
    expect(data.vocabularies.get('KYCAR_EQUIPMENT')?.values).toHaveLength(132); // vehicleType ∋ C
    expect(data.vocabularies.get('KYCAR_FUEL_TYPE')?.values).toHaveLength(16);
    expect(data.vocabularies.get('KYCAR_OFFER_TYPE')?.values).toHaveLength(6);
    expect(data.vocabularies.get('KYCAR_VEHICLE_TYPE')?.values).toHaveLength(1); // C seul
    expect(data.vocabularies.get('KYCAR_SELLER_TYPE')?.values).toHaveLength(2); // P/D
    expect(data.vocabularies.get('KYCAR_INGEST_FLAG')?.values).toHaveLength(17); // EX-DATA-45
  });

  it('décode un code dans un vocabulaire explicitement nommé (EX-DATA-9)', () => {
    expect(data.decodeEnum('KYCAR_SELLER_TYPE', 'P')).toBeTruthy();
    expect(data.decodeEnum('KYCAR_FUEL_CATEGORY', 'T')).toBeNull(); // code moto exclu
  });

  it('expose les 77 filtres retenus (filters-scope.json)', () => {
    expect(data.filterScope.retained).toHaveLength(77);
    expect(filtersScope.totalRetenus).toBe(77);
    expect(data.filterScope.retainedIds.has('bodyType')).toBe(true);
  });

  it('résout un code postal belge en région NUTS-2 (§A.8)', () => {
    expect(data.resolveRegionBE(1000)).toBe('BE10'); // Bruxelles
    expect(data.resolveRegionBE(9000)).toBe('BE23'); // Flandre-Orientale
    expect(data.resolveRegionBE(4000)).toBe('BE33'); // Liège
    expect(data.regions).toHaveLength(11);
    expect(data.postalRanges).toHaveLength(13);
  });
});
