import { describe, expect, it } from 'vitest';
import {
  R3_FORBIDDEN_FIELD_NAMES,
  scanForbiddenFields,
} from '../../../src/types/validation';
import { buildReferenceData, type RawFilters, type RawFiltersScope, type RawReferenceFile, type RawTaxonomy } from '../../../src/types/reference';

/**
 * Sonde de revue D2 — `EX-DATA-49` : « Un test automatisé du lot D2 échoue si un identifiant de la
 * liste E1 à E14 apparaît, comme nom de propriété, de colonne, de clé JSON ou de PARAMÈTRE, dans le
 * code source, le schéma de persistance ou un jeu de données du dépôt. »
 *
 * Le garde `scanForbiddenFields` contrôle les NOMS de propriété d'un enregistrement ; il ne
 * contrôle ni les VALEURS d'identifiant/paramètre de filtre, ni les jeux de données du dépôt.
 */

const taxonomyMod = import.meta.glob('../../../data/reference/taxonomy.json', { eager: true, import: 'default' });
const filtersMod = import.meta.glob('../../../data/reference/filters.json', { eager: true, import: 'default' });
const scopeMod = import.meta.glob('../../../data/reference/filters-scope.json', { eager: true, import: 'default' });
const refMods = import.meta.glob('../../../data/reference/references/*.json', { eager: true, import: 'default' });

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

const norm = (s: string): string => s.toLowerCase().replace(/[_\-\s]/g, '');

describe('D2 — EX-DATA-49 : aucun identifiant E1..E14 dans les structures exposées', () => {
  it('la structure `ReferenceData` construite ne porte aucun NOM de propriété interdit', () => {
    // Contrôle du garde tel qu'il est écrit : il scanne les noms de propriété.
    const scannable = {
      makes: data.makes.slice(0, 50),
      models: data.models.slice(0, 50),
      regions: data.regions,
      postalRanges: data.postalRanges,
    };
    expect(scanForbiddenFields(scannable)).toHaveLength(0);
  });

  it('R-D2-21 — aucun filtre RETENU ne porte un identifiant ni un paramètre de la liste E1..E14', () => {
    // `data/reference/filters-scope.json` est un jeu de données du dépôt, exposé typé par
    // `ReferenceData.filterScope.retained`. `cid` (E14) y est bien EXCLU avec le motif
    // `R3_DONNEE_PERSONNELLE` ; `lat`, `lon` (E11) et `zip` (E8) y sont RETENUS.
    const fautifs = data.filterScope.retained
      .filter((f) => R3_FORBIDDEN_FIELD_NAMES.has(norm(f.id)) || R3_FORBIDDEN_FIELD_NAMES.has(norm(f.param)))
      .map((f) => `${f.id} (param ${f.param})`);
    expect(fautifs).toEqual([]);
  });

  it('fait — `cid` (E14) est correctement écarté du périmètre des filtres', () => {
    expect(data.filterScope.retainedIds.has('customerId')).toBe(false);
    const exclu = data.filterScope.excluded.find((f) => f.param === 'cid');
    expect(exclu).toBeDefined();
  });

  it('R-D2-22 — le garde R3 détecte un identifiant interdit porté comme VALEUR d’un `param`', () => {
    // EX-DATA-49 cite explicitement le cas « comme … paramètre ». `scanForbiddenFields` ne lit
    // que les noms de propriété : `{ id: 'lat', param: 'lat' }` traverse le garde.
    expect(scanForbiddenFields({ id: 'lat', param: 'lat' }).length).toBeGreaterThan(0);
  });
});
