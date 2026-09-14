import { describe, expect, it } from 'vitest';
import { LISTING_COLUMNS } from './columns';
import { buildReferenceData, type RawFilters, type RawFiltersScope, type RawReferenceFile, type RawTaxonomy } from './reference';
import {
  R3_FORBIDDEN_FIELD_NAMES,
  scanForbiddenFields,
  scanForbiddenIdentifiers,
} from './validation';

/**
 * KYCAR — BALAYAGE R3 du dépôt (EX-DATA-49, S5, DR-026 / DR-027)
 * =================================================================================================
 * `EX-DATA-49` exige la détection d'un identifiant `E1..E14` apparaissant « comme nom de propriété,
 * de colonne, de clé JSON **ou de paramètre** », et le test de balayage qui l'exerce. Ce fichier est
 * ce test : il passe le garde sur les STRUCTURES EXPOSÉES par KYCAR, c'est-à-dire le schéma
 * colonnaire, les données de référence versionnées, et le périmètre de filtres RETENU.
 *
 * Hors périmètre, et c'est délibéré : `data/reference/filters.json` est le RELEVÉ BRUT du catalogue
 * de la source (il nomme forcément `zip`, `lat`, `lon`, `cid` — c'est ce qu'on a observé), et le
 * bloc `exclus` de `filters-scope.json` est le REGISTRE de ce qui a été écarté, où nommer un
 * paramètre interdit avec son motif est précisément l'objet. R3 porte sur ce que KYCAR RETIENT.
 */

const taxonomyMod = import.meta.glob('../../data/reference/taxonomy.json', { eager: true, import: 'default' });
const filtersMod = import.meta.glob('../../data/reference/filters.json', { eager: true, import: 'default' });
const scopeMod = import.meta.glob('../../data/reference/filters-scope.json', { eager: true, import: 'default' });
const refMods = import.meta.glob('../../data/reference/references/*.json', { eager: true, import: 'default' });
const versionMods = import.meta.glob('../../data/reference/version-*.json', { eager: true, import: 'default' });

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

describe('EX-DATA-49 — balayage R3 des structures exposées', () => {
  it('aucune COLONNE du schéma ne porte un nom de champ interdit E1..E14', () => {
    const offenders = LISTING_COLUMNS.filter((c) => R3_FORBIDDEN_FIELD_NAMES.has(norm(c.name)));
    expect(offenders.map((c) => c.name)).toEqual([]);
    // Les deux attributs vendeur AUTORISÉS sont bien là (EX-DATA-42).
    const names = LISTING_COLUMNS.map((c) => c.name);
    expect(names).toContain('sellerType');
    expect(names).toContain('regionCode');
  });

  it('aucun filtre RETENU ne porte un identifiant ni un paramètre interdit (DR-026, D-14)', () => {
    const offenders = data.filterScope.retained
      .filter((f) => R3_FORBIDDEN_FIELD_NAMES.has(norm(f.id)) || R3_FORBIDDEN_FIELD_NAMES.has(norm(f.param)))
      .map((f) => `${f.id} (param ${f.param})`);
    expect(offenders).toEqual([]);
    expect(scanForbiddenIdentifiers(data.filterScope.retained)).toEqual([]);
  });

  it('les trois filtres géographiques fins sont EXCLUS avec le motif R3_DONNEE_PERSONNELLE', () => {
    for (const param of ['zip', 'lat', 'lon', 'cid']) {
      const excluded = data.filterScope.excluded.find((f) => f.param === param);
      expect(excluded, `paramètre ${param}`).toBeDefined();
      expect(excluded?.exclusion).toBe('R3_DONNEE_PERSONNELLE');
      expect((excluded?.motif ?? '').length).toBeGreaterThan(0);
    }
  });

  it('aucun fichier de référence versionné ne porte un nom ni un identifiant interdit', () => {
    for (const [path, mod] of Object.entries({ ...refMods, ...versionMods })) {
      expect(scanForbiddenFields(mod), path).toEqual([]);
      expect(scanForbiddenIdentifiers(mod), path).toEqual([]);
    }
  });

  it('les structures typées construites par le chargeur passent le garde', () => {
    const scannable = {
      makes: data.makes.slice(0, 200),
      models: data.models.slice(0, 200),
      regions: data.regions,
      postalRanges: data.postalRanges,
      vocabularies: [...data.vocabularies.keys()],
      retained: data.filterScope.retained,
    };
    expect(scanForbiddenFields(scannable)).toEqual([]);
    expect(scanForbiddenIdentifiers(scannable)).toEqual([]);
  });
});
