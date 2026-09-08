import { beforeAll, describe, expect, it } from 'vitest';

import {
  buildReferenceData,
  type RawFilters,
  type RawFiltersScope,
  type RawReferenceFile,
  type RawTaxonomy,
  type ReferenceData,
} from '../../types/reference';
import { HP_TO_KW } from '../../types/shared-rules';
import type { MakeAggregate } from '../DataProvider';
import { SyntheticDataProvider } from './SyntheticDataProvider';
import { compileSelection, decodeTaxonomyScope } from './selection';

/**
 * DR-005 / D-03 / D-33. Trois propriétés :
 *   1. tout identifiant du registre D5 dont la colonne existe est MAPPÉ (aucun ne tombe en
 *      `unsupported`) ;
 *   2. un identifiant non pris en charge est DÉCLARÉ et rend l'effectif nul — jamais l'effectif non
 *      filtré étiqueté comme filtré ;
 *   3. `fetchSelectionCount` et `fetchAggregates` passent par le MÊME `compileSelection` : même
 *      effectif, même liste `unsupported` sur un corpus de sélections (D-33).
 */

const taxonomyMod = import.meta.glob('../../../data/reference/taxonomy.json', { eager: true, import: 'default' });
const filtersMod = import.meta.glob('../../../data/reference/filters.json', { eager: true, import: 'default' });
const scopeMod = import.meta.glob('../../../data/reference/filters-scope.json', { eager: true, import: 'default' });
const refMods = import.meta.glob('../../../data/reference/references/*.json', { eager: true, import: 'default' });

function loadReference(): ReferenceData {
  const taxonomy = Object.values(taxonomyMod)[0] as RawTaxonomy;
  const filters = Object.values(filtersMod)[0] as RawFilters;
  const filtersScope = Object.values(scopeMod)[0] as RawFiltersScope;
  const referenceFiles: Record<string, RawReferenceFile> = {};
  for (const [path, mod] of Object.entries(refMods)) {
    if (path.endsWith('_index.json')) continue;
    const file = mod as RawReferenceFile;
    referenceFiles[file.referenceType] = file;
  }
  return buildReferenceData({ taxonomy, referenceFiles, filters, filtersScope });
}

const N = 4000;
let ref: ReferenceData;
let provider: SyntheticDataProvider;

beforeAll(async () => {
  ref = loadReference();
  provider = new SyntheticDataProvider({ referenceData: ref, listingCount: N, seed: 21 });
  await provider.openSnapshot();
});

/** Les 15 identifiants D5 que DR-005 relevait comme implémentables et pourtant ignorés. */
const IMPLEMENTABLE: readonly string[] = [
  'makesModelsVariants',
  'fuelType',
  'gearType',
  'dateOfRegistrationFrom',
  'dateOfRegistrationTo',
  'countryType',
  'numberOfOwners',
  'doorFrom',
  'doorTo',
  'numberOfSeatsFrom',
  'numberOfSeatsTo',
  'electricRangeFrom',
  'electricRangeTo',
  'emissionClass',
  'priceEvaluation',
];

describe('compileSelection — couverture du registre D5 (DR-005)', () => {
  it('les 15 identifiants dont la colonne existe sont mappés, aucun n’est déclaré non pris en charge', () => {
    const columns = provider.getDataset().columns;
    const ignored = IMPLEMENTABLE.filter((id) => compileSelection(columns, `${id}=1`, ref).unsupported.includes(id));
    expect(ignored).toEqual([]);
  });

  it('`makesModelsVariants` décode la valeur structurée en portée de taxonomie', () => {
    const scope = decodeTaxonomyScope(['54|1918', '74', '9|2084|555']);
    expect(scope.makeIds.has(74)).toBe(true);
    expect(scope.models.has(54 * 1_000_000 + 1918)).toBe(true);
    expect(scope.models.has(9 * 1_000_000 + 2084)).toBe(true);
  });

  it('`dateOfRegistrationFrom` porte sur la PREMIÈRE IMMATRICULATION, jamais sur l’année-modèle (EX-DATA-25)', () => {
    const columns = provider.getDataset().columns;
    const compiled = compileSelection(columns, 'dateOfRegistrationFrom=2020', ref);
    let expected = 0;
    for (let i = 0; i < columns.rowCount; i += 1) {
      const ym = columns.firstRegistrationYearMonth[i] as number;
      if (ym !== -1 && Math.floor(ym / 12) >= 2020) expected += 1;
    }
    let got = 0;
    for (let i = 0; i < columns.rowCount; i += 1) if (compiled.predicate(i)) got += 1;
    expect(expected).toBeGreaterThan(0);
    expect(got).toBe(expected);
  });

  it('une borne de puissance en CHEVAUX est convertie en kW avant comparaison (ARB-33, DR-008)', async () => {
    const handle = await provider.openSnapshot();
    const enKw = await provider.fetchSelectionCount(handle, 'powerFrom=100');
    const enCh = await provider.fetchSelectionCount(handle, 'powerFrom=100;powerType=hp');
    expect(HP_TO_KW).toBeLessThan(1);
    expect(enCh).not.toBe(enKw);
    // 100 ch = 73,55 kW : le seuil est PLUS BAS, donc l'effectif est plus GRAND.
    expect(enCh).toBeGreaterThan(enKw);
  });

  it('un filtre non pris en charge est DÉCLARÉ et ne peut être satisfait par aucune ligne', async () => {
    const handle = await provider.openSnapshot();
    const total = await provider.fetchSelectionCount(handle, '');
    const withEquipment = await provider.fetchSelectionCount(handle, 'equipment=abs,nav,xen');
    expect(total).toBe(N);
    expect(withEquipment).toBeLessThan(total);
    const result = await provider.fetchAggregates(handle, 'equipment=abs,nav,xen', 'MAKE');
    expect(result.unsupportedFilterIds).toEqual(['equipment']);
  });
});

describe('D-33 — `fetchSelectionCount` et `fetchAggregates` partagent la même compilation', () => {
  const CORPUS: readonly string[] = [
    '',
    'FULL',
    'fuelType=E',
    'bodyType=4;fuelType=D',
    'priceTo=20000;mileageTo=100000',
    'dateOfRegistrationFrom=2020',
    'countryType=B',
    'gearType=A;sellerType=D',
    'makesModelsVariants=54|1918',
    'powerFrom=100;powerType=hp',
    'equipment=abs',
    'keyword=sport;fuelType=B',
  ];

  it('même effectif et même liste `unsupported` sur tout le corpus de sélections', async () => {
    const handle = await provider.openSnapshot();
    for (const selection of CORPUS) {
      const count = await provider.fetchSelectionCount(handle, selection);
      const aggregates = await provider.fetchAggregates(handle, selection, 'MAKE');
      const summed = (aggregates.rows as readonly MakeAggregate[]).reduce((a, r) => a + r.listingCount, 0);
      expect(count, selection).toBe(aggregates.selectionCount);
      expect(summed, selection).toBe(count);
      const columns = provider.getDataset().columns;
      expect(aggregates.unsupportedFilterIds, selection).toEqual(
        compileSelection(columns, selection, ref).unsupported,
      );
    }
  });
});
