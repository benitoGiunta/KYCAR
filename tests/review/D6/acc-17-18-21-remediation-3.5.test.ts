/**
 * Remédiation PLAN-3 §3.5 (fix-screens-5) — `reports/ACCEPTANCE.md` rev 3, §8 : ACC-17, ACC-18, ACC-21.
 * =================================================================================================
 * Sonde NEUVE (protocole S2 : rouge d'abord, sans modification après correction) reprenant les trois
 * constats attribués à `fix-screens-5` par `reports/data/DATA-LEAD-DECISIONS.md` (D3-42) :
 *
 *   - `ACC-17` (`EX-DATA-64`, table B.2) : l'arrondi de présentation d'une ANNÉE dépend de la POSITION
 *     du quantile qu'elle représente — plancher pour p05/q1/médiane/q3, plafond pour p95 — jamais
 *     `Math.round`. Exercé sur l'écran A (carte/zone, `market/view-model.ts`), l'écran B
 *     (`distribution/format.ts::formatYearStat`, exemple normatif : Toyota Corolla 2018,5 -> « 2018 »,
 *     pas « 2019 ») et le CSV mode 1 (`market/csv.ts` : quantile de prix non entier écrit à l'euro).
 *   - `ACC-21` (`EX-SCR-33`/`134`) : le résumé de carte-marque applique le MÊME palier d'effectif que
 *     la zone-modèle avant d'afficher une médiane.
 *   - `ACC-18` (`EX-DATA-19(2)`, décision `D3-42` (1)) : l'écran A NOMME le périmètre de calcul de son
 *     prix (`priceScopeNote`) partout où une statistique de prix est effectivement affichée.
 *
 * Reproduction directe des chiffres cités par la recette (VW P1 : p05 = 2016,8 / p95 = 2022,1 ;
 * Aspid n_prix = 2 ; Morgan n_prix = 1 ; Volkswagen Passat prix médian 12 846,5 €).
 */
import { describe, expect, it } from 'vitest';

import type { MakeAggregate, MetricRange, ModelAggregate } from '../../../src/providers/DataProvider';
import type { Make, Model } from '../../../src/types/entities';
import { formatYearRange } from '../../../src/screens/market/format';
import { formatYearStat } from '../../../src/screens/distribution/format';
import { buildAggregateCsvRows } from '../../../src/screens/market/csv';
import { buildMakeCardViewModel, buildModelZoneViewModel } from '../../../src/screens/market/view-model';

function range(partial: Partial<MetricRange> = {}): MetricRange {
  return { min: null, max: null, p05: null, p50: null, p95: null, n: 0, ...partial };
}
function modelAgg(partial: Partial<ModelAggregate> & { modelId: number }): ModelAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, ...partial };
}
function makeAgg(partial: Partial<MakeAggregate> = {}): MakeAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, modelCount: null, ...partial };
}
const VW: Make = { makeId: 1, label: 'Volkswagen', slug: 'volkswagen', announcedCount: null };
const GOLF: Model = { makeId: 1, modelId: 11, label: 'Golf', slug: 'golf', bodyTypes: [], announcedCount: null };

describe('ACC-17 — écran A : fourchette d’année de la carte ET de la zone, exemple normatif VW/P1', () => {
  it('carte-marque : p05 = 2016,8 / p95 = 2022,1 -> « 2016 – 2023 » (jamais « 2017 – 2022 »)', () => {
    const agg = makeAgg({ makeId: 1, listingCount: 74, year: range({ min: 2010, max: 2026, p05: 2016.8, p95: 2022.1, n: 74 }) });
    const card = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.year.label).toBe(formatYearRange(2016.8, 2022.1));
    expect(card.year.label).toBe(formatYearRange(2016, 2023));
  });

  it('zone-modèle : même exemple, même règle (une seule implémentation, `yearCentralRange`, partagée par les deux)', () => {
    const agg = modelAgg({ modelId: 11, listingCount: 21, year: range({ min: 2010, max: 2026, p05: 2016.8, p95: 2022.1, n: 21 }) });
    const zone = buildModelZoneViewModel(agg, GOLF, 21, false);
    expect(zone.year.label).toBe(formatYearRange(2016, 2023));
  });
});

describe('ACC-17 — écran B : `formatYearStat` applique le plancher à la position « médiane » (table B.2, « idem » de p05)', () => {
  // Exemple cité par la recette : Toyota Corolla, médiane d'année 2018,5, affichée « 2019 »
  // (`Math.round`) au lieu du plancher normatif « 2018 ». `DistributionScreen.tsx` (hors périmètre
  // d'écriture de `fix-screens-5`, cf. rapport § « Hors périmètre ») doit appeler cette fonction avec
  // la position `'p05'` pour la ligne « 1ʳᵉ immat. médiane ».
  it("médiane d'année 2018,5 -> plancher 2018, jamais 2019", () => {
    expect(formatYearStat(2018.5, 'p05')).toBe('2018');
  });
});

describe('ACC-17 — CSV mode 1 : les quantiles de prix non entiers sont écrits à l’euro (jamais bruts)', () => {
  it('exemple cité par la recette (Volkswagen Passat, n = 209) : médiane 12 846,5 € -> 12 847', () => {
    const card = buildMakeCardViewModel(makeAgg({ makeId: 1, listingCount: 209 }), {
      make: VW,
      modelAggregates: [
        modelAgg({
          modelId: 11,
          listingCount: 209,
          price: range({ min: 2964, max: 19932.5, p50: 12846.5, n: 209 }),
        }),
      ],
      models: new Map([[11, GOLF]]),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: true,
      modelsVisibleBeforeCollapse: 6,
    });
    const row = buildAggregateCsvRows([card])[0];
    expect(row?.prixMedianEur).toBe(12847);
    expect(Number.isInteger(row?.prixMedianEur)).toBe(true);
  });
});

describe('ACC-21 — le résumé de carte applique le palier EX-SCR-33/134 avant d’afficher une médiane', () => {
  it('Aspid (n_prix = 2) : « 2 trop faible », jamais « médiane 17 665 € »', () => {
    const agg = makeAgg({ makeId: 1, listingCount: 2, price: range({ min: 9990, max: 25339, p50: 17664.5, n: 2 }), modelCount: 1 });
    const card = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.medianPriceLine).not.toContain('médiane');
    expect(card.medianPriceLine).toContain('trop faible');
  });

  it('Morgan (n_prix = 1) : « 1 seule offre », jamais « médiane 6 950 € »', () => {
    const agg = makeAgg({ makeId: 1, listingCount: 1, price: range({ min: 6950, max: 6950, p50: 6950, n: 1 }), modelCount: 1 });
    const card = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.medianPriceLine).toContain('1 seule offre');
    expect(card.medianPriceLine).not.toContain('médiane');
  });
});

describe('ACC-18 — le périmètre de calcul du prix est nommé sur chaque zone et chaque carte à médiane affichée', () => {
  it('zone-modèle : `priceScopeNote` défini dès qu’une statistique de prix est affichée, sans jargon ni identifiant d’exigence', () => {
    const agg = modelAgg({ modelId: 11, listingCount: 552, price: range({ p05: 5900, p95: 15900, p50: 9900, n: 552 }) });
    const zone = buildModelZoneViewModel(agg, GOLF, 552, false);
    expect(zone.priceScopeNote).toBeTruthy();
    expect(zone.priceScopeNote).not.toMatch(/cellule|sentinelle|vraisemblance|EX-DATA|EX-SCR|ACC-\d|D3-\d/i);
  });

  it('résumé de carte : `priceScopeNote` défini dès qu’une statistique de prix est affichée', () => {
    const agg = makeAgg({ makeId: 1, listingCount: 576, price: range({ p05: 3900, p95: 15900, p50: 9448, n: 576 }) });
    const card = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.priceScopeNote).toBeTruthy();
  });

  it('aucune statistique de prix affichée (listingCount = 0) : `priceScopeNote` est `undefined`, rien à nommer', () => {
    const zone = buildModelZoneViewModel(modelAgg({ modelId: 11, listingCount: 0 }), GOLF, 0, false);
    expect(zone.priceScopeNote).toBeUndefined();
  });
});
