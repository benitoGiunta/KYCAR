/**
 * KYCAR — Sondes transverses `patho` : CONSTATS BLOQUANTS DE 2.2, REJOUÉS DE BOUT EN BOUT
 * =================================================================================================
 * Douze constats BLOQUANTS de `ST-complete.md` / `ST-ambiguity.md` dont la décision `ARB-xx` est
 * testable à travers `DataProvider` → moteur → modèles de vue. Chaque sonde cite son constat source
 * ET la décision qui fait foi.
 *
 *   T-01/AMB-15/AMB-28 → `ARB-01`  · AMB-01 → `ARB-21` · AMB-02/AMB-22 → `ARB-25`
 *   AMB-04 → `ARB-28`  · AMB-05 → `ARB-29` · AMB-09 → `ARB-05` · AMB-10 → `ARB-09`
 *   AMB-11 → `ARB-10`  · AMB-12 → `ARB-11` · AMB-13 → `ARB-30` · AMB-19 → `ARB-33`
 *   AMB-27 → `ARB-35`  · AMB-30 → `ARB-36` · T-09 → `ARB-43`
 */

import { describe, expect, it } from 'vitest';

import { AggregationDataset } from '../../../src/engine/index';
import { bin, PRICE_BIN_PARAMS, YEAR_BIN_PARAMS } from '../../../src/engine/index';
import { compilePredicate } from '../../../src/engine/index';
import { buildC3Banner, coverageDiscLevel, sampleCoverageOf } from '../../../src/screens/market/coverage';
import { formatPrice, roundHalfAwayFromZero } from '../../../src/screens/market/format';
import { compareLabels, sortMakeRows } from '../../../src/screens/market/sort';
import {
  GRID_VIRTUALIZATION_THRESHOLD,
  NO_FILTER_TEASER_MAKE_COUNT,
  shouldVirtualizeGrid,
  shouldShowMakeCountWarning,
} from '../../../src/screens/market/thresholds';
import { deriveScreenAState } from '../../../src/screens/market/state';
import { loadQuery } from '../../../src/state/corrections';
import { serializeQuery } from '../../../src/state/url-codec';
import { buildActiveFilterTokens } from '../../../src/components/filters/labels';
import { addToCompare, MAX_COMPARE, parseCompareParam } from '../../../src/screens/compare/compare-selection';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';
import { loadRealReferenceData } from '../../../src/providers/tweedehands/testFixtures';
import { buildBatch, cell, type RowSpec } from './_fixtures';

describe('patho — T-01 / AMB-15 / AMB-28 → ARB-01 (les trois couvertures)', () => {
  it('ST-ARB01 — `sampleCoverage` : NON_APPLICABLE sous filtre, `null` si annoncé INCONNU, jamais 100 % fabriqué', () => {
    expect(sampleCoverageOf(120, 1000, false)).toBe(0.12);
    expect(sampleCoverageOf(120, 1000, true)).toBe('NON_APPLICABLE'); // dès qu'un filtre est posé
    expect(sampleCoverageOf(120, null, false)).toBeNull(); // annoncé INCONNU : jamais 1
    expect(coverageDiscLevel(null)).toBe('indisponible');
    expect(coverageDiscLevel('NON_APPLICABLE')).toBe('indisponible');
    expect(coverageDiscLevel(0.19)).toBe('creux');
    expect(coverageDiscLevel(0.8)).toBe('plein');
  });

  it('ST-ARB01-C3 — le bandeau C3 ne prend jamais `listingCount` pour `announcedCount`', () => {
    const inconnu = buildC3Banner({ listingCount: 500, announcedListingCount: null, hasUserFilters: false });
    expect(inconnu.text).toContain('inconnue');
    expect(inconnu.text).not.toContain('100');
    expect(inconnu.tone).toBe('neutre');

    const filtre = buildC3Banner({ listingCount: 500, announcedListingCount: 100000, hasUserFilters: true });
    expect(filtre.text).toContain('non applicable sous filtre');
    expect(filtre.tone).toBe('neutre');

    const rouge = buildC3Banner({ listingCount: 500, announcedListingCount: 100000, hasUserFilters: false });
    expect(rouge.tone).toBe('rouge');
    expect(rouge.dismissible).toBe(false); // non refermable sous 20 %
  });
});

describe('patho — AMB-01 → ARB-21 (arrondi du prix) et AMB-02/AMB-22 → ARB-25 (comparateur)', () => {
  it('ST-ARB21 — arrondi au plus proche, demi vers l’infini ; `Math.floor` exclu', () => {
    expect(roundHalfAwayFromZero(12499.5)).toBe(12500);
    expect(roundHalfAwayFromZero(12500.4)).toBe(12500);
    expect(roundHalfAwayFromZero(12499.4)).toBe(12499);
    expect(Math.floor(12499.5)).toBe(12499); // la lecture concurrente d'AMB-01, écartée par ARB-21
    expect(formatPrice(12499.5)).toContain('12');
  });

  it('ST-ARB25 — comparateur unique de libellés, ordre total, sans `Intl.Collator`', () => {
    // Diacritiques repliés, casse invariante, comparaison par point de code.
    expect(compareLabels('Citroën', 'Citroen')).toBe(0);
    expect(compareLabels('Audi', 'BMW')).toBeLessThan(0);
    expect(compareLabels('Škoda', 'Seat')).toBeGreaterThan(0); // S-K-O-D-A après S-E-A-T

    // Ordre TOTAL : deux marques d'effectif et de libellé identiques restent départagées par l'id.
    const rows = [
      { makeId: 9, label: 'Alpha', listingCount: 10, medianPrice: 1000, modelCount: 1 },
      { makeId: 4, label: 'Alpha', listingCount: 10, medianPrice: 1000, modelCount: 1 },
    ];
    const sorted = sortMakeRows(rows, 'offres', 'desc');
    expect(sorted.map((r) => r.makeId)).toEqual([4, 9]);
    expect(sortMakeRows([...rows].reverse(), 'offres', 'desc').map((r) => r.makeId)).toEqual([4, 9]);
  });
});

describe('patho — AMB-04 → ARB-28 et AMB-05 → ARB-29 (seuils et état SANS-FILTRE)', () => {
  it('ST-ARB28 — une seule table de seuils : 20 seulement à l’amorce, virtualisation à 40, bandeau à 60', () => {
    expect(NO_FILTER_TEASER_MAKE_COUNT).toBe(20);
    expect(GRID_VIRTUALIZATION_THRESHOLD).toBe(40);
    expect(shouldVirtualizeGrid(41)).toBe(true);
    expect(shouldVirtualizeGrid(40)).toBe(false);
    // ARB-28 : au-delà de 40, AUCUN plafonnement du nombre de cartes accessibles — seul le bandeau
    // de dépassement existe, et il ne se déclenche qu'au-delà de 60.
    expect(shouldShowMakeCountWarning(50)).toBe(false);
    expect(shouldShowMakeCountWarning(61)).toBe(true);
  });

  it('ST-ARB29 — l’état SANS-FILTRE est décidé au même endroit que les cinq autres', () => {
    const data = {
      makeAggregates: [{ makeId: 1, listingCount: 5, price: { min: 1, max: 2, p05: 1, p50: 1, p95: 2, n: 5 }, mileage: { min: null, max: null, p05: null, p50: null, p95: null, n: 0 }, year: { min: null, max: null, p05: null, p50: null, p95: null, n: 0 }, sampleCoverage: null, modelCount: null }],
      modelAggregatesByMake: new Map(),
      hasUserFilters: false,
      activeFilterCount: 0,
      topRestrictiveFilters: [],
      snapshotDate: '2026-09-01',
      snapshotListingCount: 5,
      snapshotAnnouncedListingCount: null,
      failedMakeIds: new Set<number>(),
      totalMakesAttempted: 1,
    };
    expect(deriveScreenAState({ phase: 'loaded', data }).kind).toBe('no-filter');
    expect(deriveScreenAState({ phase: 'loaded', data: { ...data, hasUserFilters: true } }).kind).toBe('ready');
    expect(deriveScreenAState({ phase: 'loaded', data: { ...data, makeAggregates: [] } })).toMatchObject({
      kind: 'empty',
      reason: 'no-filter',
    });
  });
});

describe('patho — AMB-09 → ARB-05 (BIN) et AMB-10 → ARB-09 (bornes inclusives)', () => {
  it('ST-ARB05 — `BIN(V, W, T, O)` seul : largeur prise dans l’échelle finie, ≤ 26 bins, vides conservés', () => {
    const values = [...cell(200, { basePrice: 15000, spread: 0.4 })].map((r) => r.priceEur as number);
    const result = bin(values, PRICE_BIN_PARAMS);
    expect(result.status).toBe('OK');
    expect(PRICE_BIN_PARAMS.widths).toContain(result.binWidth);
    expect(result.bins.length).toBeLessThanOrEqual(26);
    // Bins fermés vides conservés (EX-DATA-78) : l'ordre des index est contigu entre kLo et kHi.
    const closed = result.bins.filter((b) => !b.open);
    for (let i = 1; i < closed.length; i += 1) {
      expect(closed[i]!.index).toBe(closed[i - 1]!.index + 1);
    }
    // Déterminisme (EX-DATA-82 / I8) : une permutation donne le même résultat.
    const permuted = bin([...values].reverse(), PRICE_BIN_PARAMS);
    expect(permuted.bins.map((b) => b.count)).toEqual(result.bins.map((b) => b.count));
    // Année : échelle de largeur réduite à 1 an (EX-DATA-77).
    expect(bin([2010, 2011, 2015], YEAR_BIN_PARAMS).binWidth).toBe(1);
  });

  it('ST-ARB09 — bornes de filtre INCLUSIVES : `[lo, hi − 1]` retient exactement l’effectif de la barre', () => {
    const specs: RowSpec[] = cell(300, { basePrice: 15000, spread: 0.5 });
    const batch = buildBatch(specs);
    const recalc = new AggregationDataset(batch).recalculate({ selectionHash: 'arb09' });
    const bar = recalc.priceHistogram.find((b) => !b.open && b.count > 0)!;

    // `ARB-09` : clic sur une barre ⇒ `pricefrom = lo`, `priceto = hi − u` (u = 1 €), bornes
    // inclusives. L'effectif après recalcul doit être EXACTEMENT celui de la barre.
    const predicate = compilePredicate(batch, {
      kind: 'range',
      filterId: 'priceFrom',
      column: 'priceEur',
      min: bar.lowerBound,
      max: bar.upperBound - 1,
    });
    let count = 0;
    for (let row = 0; row < batch.rowCount; row += 1) if (predicate.test(row)) count += 1;
    expect(count).toBe(bar.count);

    // `EX-NAV-7` : une valeur INCONNUE ne satisfait aucun prédicat d'intervalle.
    const withUnknown = buildBatch([{ priceEur: null }]);
    const p2 = compilePredicate(withUnknown, { kind: 'range', filterId: 'priceFrom', column: 'priceEur', min: null, max: null });
    expect(p2.test(0)).toBe(false);
  });
});

describe('patho — AMB-11 → ARB-10 et AMB-12 → ARB-11 (corrections d’URL)', () => {
  it('ST-ARB10 — intervalle inversé reçu dans une URL : bornes permutées ET signalées', () => {
    const loaded = loadQuery('pricefrom=25000&priceto=5000');
    expect(loaded.selection.priceFrom).toBe(5000);
    expect(loaded.selection.priceTo).toBe(25000);
    expect(loaded.corrections.map((c) => c.kind)).toEqual(['INVERTED_INTERVAL']);
    expect(loaded.corrections[0]!.message).toContain('bornes interverties');
    expect(loaded.corrections[0]!.message).toContain('5000 – 25000');
  });

  it('ST-ARB11 — les cinq classes d’EX-NAV-21 corrigent ET signalent, jamais silencieusement', () => {
    const enumInconnu = loadQuery('fuel=B,ZZZ');
    expect(enumInconnu.selection.fuelType).toEqual(['B']); // valeur inconnue retirée, autres conservées
    expect(enumInconnu.corrections[0]!.kind).toBe('UNKNOWN_ENUM_CODE');

    const horsDomaine = loadQuery('pricefrom=999999999');
    expect(horsDomaine.corrections[0]!.kind).toBe('NUMERIC_OUT_OF_DOMAIN');
    expect(horsDomaine.selection.priceFrom).toBe(100000); // écrêtée à la borne du domaine

    const nonNumerique = loadQuery('pricefrom=abc');
    expect(nonNumerique.corrections[0]!.kind).toBe('NON_NUMERIC_OR_EMPTY');
    expect(nonNumerique.selection.priceFrom).toBeUndefined();

    const inconnu = loadQuery('parametre_invente=1');
    expect(inconnu.corrections[0]!.kind).toBe('UNKNOWN_PARAM');
    expect(Object.keys(inconnu.selection)).toHaveLength(0);
  });
});

describe('patho — AMB-27 → ARB-35, AMB-30 → ARB-36, T-09 → ARB-43', () => {
  it('ST-ARB35 — un filtre énuméré est une ÉGALITÉ STRICTE de code : aucun code voisin n’est capté', () => {
    const batch = buildBatch([
      { fuelCategory: 0 }, // essence
      { fuelCategory: 1 }, // diesel
      { fuelCategory: 2 }, // électrique
      { fuelCategory: 3 }, // hybride
    ]);
    const p = compilePredicate(batch, { kind: 'enum', filterId: 'fuelCategory', column: 'fuelCategory', codes: [0] });
    expect([0, 1, 2, 3].map((r) => p.test(r))).toEqual([true, false, false, false]);
    // Une valeur INCONNUE (255) n'est retenue que si 255 figure explicitement dans les codes.
    const unknownBatch = buildBatch([{ fuelCategory: 255 }]);
    expect(compilePredicate(unknownBatch, { kind: 'enum', filterId: 'f', column: 'fuelCategory', codes: [0] }).test(0)).toBe(false);
    expect(compilePredicate(unknownBatch, { kind: 'enum', filterId: 'f', column: 'fuelCategory', codes: [255] }).test(0)).toBe(true);
  });

  it('ST-ARB36 — INCONNU n’est jamais une clé d’agrégation : sans année, la cellule démarre à C₂', () => {
    // 40 annonces d'une même (marque, modèle), TOUTES sans année : `C₁` est impossible.
    const recalc = new AggregationDataset(
      buildBatch(
        Array.from({ length: 40 }, (_v, i) => ({
          makeId: 8,
          modelId: 808,
          year: null,
          priceEur: i === 0 ? 1300 : 12000 + (i % 5) * 400,
          mileageKm: 30000 + i * 1500,
        })),
      ),
    ).recalculate({ selectionHash: 'arb36' });

    expect(recalc.selectionStats.year.n).toBe(0); // aucune année : la métrique est vide, pas nulle
    expect(recalc.yearHistogram).toHaveLength(0); // aucun bucket « année INCONNUE » fabriqué
    expect(recalc.outlierVerdicts.length).toBeGreaterThan(0);
    for (const v of recalc.outlierVerdicts) {
      expect(v.cellLabel).not.toBe('MODEL_YEAR'); // C₁ exige une année connue
    }
  });

  it('ST-ARB43 — sélection de comparaison : plafond unique de 4 modèles, `modelId = 0` exclu, écrêtage signalé', () => {
    expect(MAX_COMPARE).toBe(4);
    let selection: readonly { makeId: number; modelId: number }[] = [];
    for (let i = 0; i < 6; i += 1) selection = addToCompare(selection, { makeId: 1, modelId: 100 + i });
    expect(selection).toHaveLength(4);
    expect(addToCompare(selection.slice(0, 1), { makeId: 1, modelId: 0 })).toHaveLength(1); // clé réservée

    // D-31 : littéral adapté du point au tiret (D-13/DR-085 — format normatif `<makeId>-<modelId>`,
    // annexe C fait foi sur l'encodage) ; la propriété testée ici (plafond/écrêtage signalé) est
    // inchangée et indépendante du séparateur.
    const parsed = parseCompareParam('1-101,1-102,1-103,1-104,1-105');
    expect(parsed.keys).toHaveLength(4);
    expect(parsed.clipped).toBe(true); // écrêtage SIGNALÉ, jamais silencieux
  });
});

describe('patho — AMB-13 → ARB-30 et AMB-19 → ARB-33', () => {
  it('R-PATHO-14 — ARB-30 / EX-SRCH-18bis : `ustate` est exposé comme filtre utilisateur et sérialisé dans l’URL', () => {
    // `EX-SRCH-18bis` : `atype`, `ustate`, `powertype`, `pricetype`, `cy` sont des valeurs INJECTÉES
    // vers la source — « jamais sérialisées dans l'URL de l'application, jamais comptées dans le
    // badge de filtres actifs ». Le registre les traite comme des filtres utilisateur ordinaires.
    const query = serializeQuery({ hadAccident: 'A', powerType: 'hp', countryType: ['B'] }, {});
    expect(query).not.toContain('ustate=');
    expect(query).not.toContain('powertype=');
    expect(query).not.toContain('cy=');
    expect(buildActiveFilterTokens({ hadAccident: 'A' })).toHaveLength(0);
  });

  it('R-PATHO-15 — ARB-33 / EX-SRCH-11bis : une borne de puissance en chevaux n’est jamais convertie en kW', async () => {
    // `powerfrom = 100` avec `powertype = hp` doit s'évaluer comme `powerKw ≥ 100 × 0,7355 = 73,55`.
    const provider = new SyntheticDataProvider({ referenceData: loadRealReferenceData(), listingCount: 3000, seed: 5 });
    const handle = await provider.openSnapshot();
    const enKw = await provider.fetchSelectionCount(handle, 'powerFrom=100');
    const enCh = await provider.fetchSelectionCount(handle, 'powerType=hp;powerFrom=100');

    // 100 ch (73,55 kW) est une borne PLUS PERMISSIVE que 100 kW : l'effectif doit être strictement
    // supérieur. Constaté : les deux sélections donnent le même effectif (aucune conversion).
    expect(enCh).toBeGreaterThan(enKw);
  });
});
