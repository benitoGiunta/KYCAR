import { describe, expect, it } from 'vitest';

import type { MakeAggregate, MetricRange, ModelAggregate } from '../../providers/DataProvider';
import type { Make, Model } from '../../types/entities';
import { buildMakeCardViewModel, buildModelZoneViewModel, badgeColorForMake, badgeInitials } from './view-model';

function range(partial: Partial<MetricRange> = {}): MetricRange {
  return { min: null, max: null, p05: null, p50: null, p95: null, n: 0, ...partial };
}

function modelAgg(partial: Partial<ModelAggregate> & { modelId: number }): ModelAggregate {
  return {
    makeId: 1,
    listingCount: 0,
    price: range(),
    mileage: range(),
    year: range(),
    sampleCoverage: null,
    ...partial,
  };
}

function makeAgg(partial: Partial<MakeAggregate> = {}): MakeAggregate {
  return {
    makeId: 1,
    listingCount: 0,
    price: range(),
    mileage: range(),
    year: range(),
    sampleCoverage: null,
    modelCount: null,
    ...partial,
  };
}

const VW: Make = { makeId: 1, label: 'Volkswagen', slug: 'volkswagen', announcedCount: null };
const GOLF: Model = { makeId: 1, modelId: 11, label: 'Golf', slug: 'golf', bodyTypes: [], announcedCount: null };
const POLO: Model = { makeId: 1, modelId: 12, label: 'Polo', slug: 'polo', bodyTypes: [], announcedCount: null };

describe('buildModelZoneViewModel — fourchette centrale partout (EX-DATA-69, R-A05)', () => {
  it('les trois fourchettes (prix/année/km) sont toutes libellées « fourchette centrale (90 % des offres) »', () => {
    const agg = modelAgg({
      modelId: 11,
      listingCount: 3120,
      price: range({ min: 4200, max: 89000, p05: 8900, p50: 17400, p95: 32500, n: 3120 }),
      year: range({ min: 2004, max: 2026, p05: 2010, p95: 2025, n: 3120 }),
      mileage: range({ min: 0, max: 400000, p05: 12000, p95: 240000, n: 3120 }),
    });
    const vm = buildModelZoneViewModel(agg, GOLF, 3120, false);
    expect(vm.price.caption).toBe('fourchette centrale (90 % des offres)');
    expect(vm.year.caption).toBe('fourchette centrale (90 % des offres)');
    expect(vm.mileage.caption).toBe('fourchette centrale (90 % des offres)');
    expect(vm.price.available).toBe(true);
    expect(vm.year.available).toBe(true);
    expect(vm.mileage.available).toBe(true);
  });

  it('la fourchette de prix affiche p05/p95, jamais min/max, dans son libellé principal', () => {
    const agg = modelAgg({
      modelId: 11,
      listingCount: 100,
      price: range({ min: 119, max: 289000, p05: 8900, p50: 17400, p95: 32500, n: 100 }),
    });
    const vm = buildModelZoneViewModel(agg, GOLF, 100, false);
    expect(vm.price.label).not.toContain('119');
    expect(vm.price.label).not.toContain('289');
  });

  it("seule la fourchette de prix porte une infobulle rawRange « du moins cher au plus cher »", () => {
    const agg = modelAgg({
      modelId: 11,
      listingCount: 100,
      price: range({ min: 4200, max: 89000, p05: 8900, p95: 32500, n: 100 }),
    });
    const vm = buildModelZoneViewModel(agg, GOLF, 100, false);
    expect(vm.priceRawTooltip).toContain('du moins cher au plus cher');
    // Structurellement : ni `year` ni `mileage` n'exposent de champ raw-tooltip (EX-SCR-113 items 5/6).
    expect('yearRawTooltip' in vm).toBe(false);
    expect('mileageRawTooltip' in vm).toBe(false);
  });
});

describe('buildModelZoneViewModel — EX-SCR-116 (listingCount = 0)', () => {
  it("remplace les trois fourchettes par l'indisponibilité, jamais 0 – 0 €, garde l'effectif", () => {
    const agg = modelAgg({ modelId: 11, listingCount: 0 });
    const vm = buildModelZoneViewModel(agg, GOLF, 10, false);
    expect(vm.rangesAvailable).toBe(false);
    expect(vm.price.available).toBe(false);
    expect(vm.price.label).not.toMatch(/0.*€/);
    expect(vm.listingCount).toBe(0);
    expect(vm.offerCountBare).toBe('0');
  });
});

describe('buildModelZoneViewModel — clé réservée modelId = 0 (EX-DATA-72)', () => {
  it('porte le libellé et le slug canoniques, indépendamment du référentiel', () => {
    const agg = modelAgg({ modelId: 0, listingCount: 5 });
    const vm = buildModelZoneViewModel(agg, undefined, 5, false);
    expect(vm.label).toBe('Modèle non identifié');
    expect(vm.slug).toBe('modele-non-identifie');
    expect(vm.isUnresolved).toBe(true);
  });
});

describe('buildModelZoneViewModel — EX-SCR-134 (médiane par palier d’effectif)', () => {
  it('n = 0 -> —', () => {
    const agg = modelAgg({ modelId: 11, listingCount: 5, price: range({ n: 0 }) });
    expect(buildModelZoneViewModel(agg, GOLF, 5, false).medianLabel).toBe('—');
  });

  it('n = 1 -> « 1 seule offre », jamais « 1 trop faible »', () => {
    const agg = modelAgg({ modelId: 11, listingCount: 1, price: range({ n: 1 }) });
    expect(buildModelZoneViewModel(agg, GOLF, 1, false).medianLabel).toBe('1 seule offre');
  });

  it('2 <= n <= 4 -> « n trop faible »', () => {
    const agg = modelAgg({ modelId: 11, listingCount: 3, price: range({ n: 3 }) });
    expect(buildModelZoneViewModel(agg, GOLF, 3, false).medianLabel).toBe('3 trop faible');
  });

  it('n >= 5 -> médiane normale', () => {
    const agg = modelAgg({ modelId: 11, listingCount: 20, price: range({ n: 20, p50: 17400 }) });
    expect(buildModelZoneViewModel(agg, GOLF, 20, false).medianLabel).toContain('méd.');
  });
});

describe('buildModelZoneViewModel — part relative (EX-SCR-113 #9 / 134)', () => {
  it('longueur réelle, jamais nulle pour un effectif > 0, même à n = 1', () => {
    const agg = modelAgg({ modelId: 11, listingCount: 1 });
    const vm = buildModelZoneViewModel(agg, GOLF, 500, false);
    expect(vm.relativeShareRatio).toBeGreaterThan(0);
    expect(vm.relativeShareRatio).toBeCloseTo(1 / 500);
  });

  it('vaut 1 pour le modèle le plus offert de la marque', () => {
    const agg = modelAgg({ modelId: 11, listingCount: 500 });
    const vm = buildModelZoneViewModel(agg, GOLF, 500, false);
    expect(vm.relativeShareRatio).toBe(1);
  });
});

describe('badgeInitials / badgeColorForMake — EX-SCR-108', () => {
  it('deux premières lettres en capitales', () => {
    expect(badgeInitials('Volkswagen')).toBe('VO');
    expect(badgeInitials('bmw')).toBe('BM');
  });

  it('couleur déterministe et stable pour un même makeId', () => {
    expect(badgeColorForMake(42)).toBe(badgeColorForMake(42));
  });
});

describe('buildMakeCardViewModel — résumé et modelCount (EX-DATA-71, D8-02/D8-10)', () => {
  // D8-02/D8-19 (FV-02) : `modelCount` vient désormais de `agg.modelCount` (publié par le provider,
  // D8-10), jamais d'un comptage sur `modelAggregates` — ce comptage valait `0` tant que le détail
  // par modèle de CETTE carte n'était pas chargé (c'est exactement le « 0 modèles » de FV-02). La
  // sonde exerce donc désormais `agg.modelCount` explicitement au lieu de le faire dériver du
  // tableau `modelAggregates` passé à côté (qui garde son propre rôle : construire les zones).
  it("porte le cardinal publié par le provider, indépendant du tableau modelAggregates de la carte", () => {
    const models = new Map([[11, GOLF], [12, POLO]]);
    const agg = makeAgg({ makeId: 1, listingCount: 200, price: range({ p50: 18900, n: 200 }), modelCount: 2 });
    const vm = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [
        modelAgg({ modelId: 11, listingCount: 100 }),
        modelAgg({ modelId: 12, listingCount: 90 }),
        modelAgg({ modelId: 0, listingCount: 10 }),
      ],
      models,
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(vm.modelCount).toBe(2);
    expect(vm.medianPriceLine).toContain('2 modèles');
  });

  it("D8-02/FV-02 : `modelCount` reste « — » (jamais 0) quand le provider ne l'a pas calculé, même si des zones-modèles sont déjà rendues", () => {
    const models = new Map([[11, GOLF], [12, POLO]]);
    const agg = makeAgg({ makeId: 1, listingCount: 200, price: range({ p50: 18900, n: 200 }), modelCount: null });
    const vm = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [modelAgg({ modelId: 11, listingCount: 100 }), modelAgg({ modelId: 12, listingCount: 90 })],
      models,
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(vm.modelCount).toBeNull();
    expect(vm.medianPriceLine).toContain('— modèles');
    expect(vm.medianPriceLine).not.toContain('0 modèles');
    // Les zones sont bien construites (le repli/l'affichage des zones ne dépend pas de `modelCount`).
    expect(vm.modelZones).toHaveLength(2);
  });

  it('place modelId = 0 en dernier, quel que soit son effectif', () => {
    const models = new Map([[11, GOLF]]);
    const agg = makeAgg({ makeId: 1, listingCount: 200 });
    const vm = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [modelAgg({ modelId: 0, listingCount: 99999 }), modelAgg({ modelId: 11, listingCount: 1 })],
      models,
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(vm.modelZones.map((z) => z.modelId)).toEqual([11, 0]);
  });

  it('EX-SCR-128 : masque les modèles à moins de 3 offres et compte les masqués', () => {
    const models = new Map([[11, GOLF], [12, POLO]]);
    const agg = makeAgg({ makeId: 1, listingCount: 100 });
    const vm = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [modelAgg({ modelId: 11, listingCount: 98 }), modelAgg({ modelId: 12, listingCount: 2 })],
      models,
      hasUserFilters: false,
      hideSparseModels: true,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(vm.modelZones.map((z) => z.modelId)).toEqual([11]);
    expect(vm.hiddenSparseCount).toBe(1);
  });

  it("EX-SCR-122 : n'affiche pas de bouton de dépliement pour exactement 6 modèles (seuil)", () => {
    const models = new Map<number, Model>();
    const aggs: ModelAggregate[] = Array.from({ length: 6 }, (_, i) => modelAgg({ modelId: i + 1, listingCount: 10 - i }));
    const vm = buildMakeCardViewModel(makeAgg({ listingCount: 100 }), {
      make: VW,
      modelAggregates: aggs,
      models,
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(vm.hasMoreModels).toBe(false);
    expect(vm.visibleModelZones).toHaveLength(6);
  });

  it("EX-SCR-122 : affiche les 7 modèles sans repli quand il y en a exactement 7 (déplier pour un seul serait un clic inutile)", () => {
    const models = new Map<number, Model>();
    const aggs: ModelAggregate[] = Array.from({ length: 7 }, (_, i) => modelAgg({ modelId: i + 1, listingCount: 10 - i }));
    const vm = buildMakeCardViewModel(makeAgg({ listingCount: 100 }), {
      make: VW,
      modelAggregates: aggs,
      models,
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(vm.hasMoreModels).toBe(false);
    expect(vm.visibleModelZones).toHaveLength(7);
  });

  it('replie au-delà de 8 modèles, avec le compte exact restant', () => {
    const models = new Map<number, Model>();
    const aggs: ModelAggregate[] = Array.from({ length: 34 }, (_, i) => modelAgg({ modelId: i + 1, listingCount: 34 - i }));
    const vm = buildMakeCardViewModel(makeAgg({ listingCount: 100 }), {
      make: VW,
      modelAggregates: aggs,
      models,
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(vm.visibleModelZones).toHaveLength(6);
    expect(vm.hasMoreModels).toBe(true);
    expect(vm.remainingModelCount).toBe(28);
  });

  it('EX-SCR-124 règle 2 : champ de recherche de modèle requis au-delà de 12 modèles', () => {
    const models = new Map<number, Model>();
    const aggs13: ModelAggregate[] = Array.from({ length: 13 }, (_, i) => modelAgg({ modelId: i + 1, listingCount: 1 }));
    const vm = buildMakeCardViewModel(makeAgg({ listingCount: 100 }), {
      make: VW,
      modelAggregates: aggs13,
      models,
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: true,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(vm.needsModelSearchField).toBe(true);
  });

  it('EX-SCR-124 règle 3 : virtualisation requise au-delà de 30 zones', () => {
    const models = new Map<number, Model>();
    const aggs31: ModelAggregate[] = Array.from({ length: 31 }, (_, i) => modelAgg({ modelId: i + 1, listingCount: 1 }));
    const vm = buildMakeCardViewModel(makeAgg({ listingCount: 100 }), {
      make: VW,
      modelAggregates: aggs31,
      models,
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: true,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(vm.needsVirtualizedModelList).toBe(true);
  });

  it("EX-SCR-132 : modelAggregates 'unavailable' -> carte marquée modelsUnavailable, zéro zone", () => {
    const vm = buildMakeCardViewModel(makeAgg({ listingCount: 100 }), {
      make: VW,
      modelAggregates: 'unavailable',
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(vm.modelsUnavailable).toBe(true);
    expect(vm.modelZones).toHaveLength(0);
  });
});
