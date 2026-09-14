import { describe, expect, it } from 'vitest';

import type { MakeAggregate, MetricRange, ModelAggregate } from '../../providers/DataProvider';
import type { Make, Model } from '../../types/entities';
import { buildMakeCardViewModel, buildModelZoneViewModel, badgeColorForMake, badgeTextColorForMake, badgeInitials } from './view-model';
import { formatPrice, formatYearRange } from './format';

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

// D8-14/FV-16/E2E-11 : `color-contrast` d'axe échouait (3,19–4,35:1 mesurés, seuil 4,5:1, WCAG 1.4.3)
// sur les pastilles `.kycar-market-badge`. Recalcul indépendant de la luminance relative WCAG (pas un
// import de la logique interne de `badgeTextColorForMake`) pour vérifier, sonde par sonde, que le
// texte choisi atteint bien 4,5:1 contre les 12 teintes de la palette (0..30, dont les doublons par
// modulo, EX-SCR-108).
describe('badgeTextColorForMake — EX-SCR-118/a11y (D8-14, FV-16, E2E-11)', () => {
  function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [255 * f(0), 255 * f(8), 255 * f(4)];
  }
  function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function relLum([r, g, b]: readonly number[]): number {
    const lin = (c: number) => { const cs = c / 255; return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(r as number) + 0.7152 * lin(g as number) + 0.0722 * lin(b as number);
  }
  function contrast(l1: number, l2: number): number {
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  }

  it('les 12 teintes de `BADGE_PALETTE` atteignent ≥ 4,5:1 avec la couleur de texte choisie (WCAG 1.4.3)', () => {
    for (let makeId = 0; makeId < 12; makeId++) {
      const bgHsl = badgeColorForMake(makeId);
      const m = /hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/.exec(bgHsl)!;
      const bgLum = relLum(hslToRgb(Number(m[1]), Number(m[2]), Number(m[3])));
      const textHex = badgeTextColorForMake(makeId);
      const textLum = relLum(hexToRgb(textHex));
      expect(contrast(bgLum, textLum), `makeId=${makeId} bg=${bgHsl} text=${textHex}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('déterministe et stable pour un même makeId (même carte, même rendu)', () => {
    expect(badgeTextColorForMake(7)).toBe(badgeTextColorForMake(7));
  });
});

describe('buildMakeCardViewModel — modelsVisibleBeforeCollapse (EX-SCR-122/135, E2E-18)', () => {
  // E2E-18 (CORRIGÉ) : `MakeCard.tsx` codait en dur `Math.min(modelZones.length, 6)` pour le libellé
  // « − Réduire à <n> modèles », mentant en régime compact (seuil réel 4). Le seuil REÇU par la carte
  // est maintenant publié sur le modèle de vue lui-même, pour que le composant ne devine jamais.
  it('publie le seuil de repli reçu (jamais un « 6 » supposé)', () => {
    const models = new Map([[11, GOLF]]);
    const agg = makeAgg({ makeId: 1, listingCount: 40 });
    const vm = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [modelAgg({ modelId: 11, listingCount: 40 })],
      models,
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: true,
      modelsVisibleBeforeCollapse: 4, // régime compact
    });
    expect(vm.modelsVisibleBeforeCollapse).toBe(4);
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

describe('D8-10 — coverageWarning / samplingBias (EX-DATA-68), provider réel seulement', () => {
  it('buildModelZoneViewModel : `coverageWarning.<métrique>` posé sur la CentralRange correspondante, jamais ailleurs', () => {
    const agg = modelAgg({
      modelId: 11,
      listingCount: 200,
      price: range({ p05: 8900, p95: 32500, n: 200 }),
      year: range({ p05: 2010, p95: 2025, n: 200 }),
      mileage: range({ p05: 12000, p95: 240000, n: 200 }),
      coverageWarning: { price: true, year: false, mileage: false },
    });
    const zone = buildModelZoneViewModel(agg, GOLF, 200, false);
    expect(zone.price.coverageWarning).toBe(true);
    expect(zone.year.coverageWarning).toBeUndefined();
    expect(zone.mileage.coverageWarning).toBeUndefined();
  });

  it('buildModelZoneViewModel : `samplingBias` absent par défaut (provider synthétique), publié tel quel quand présent', () => {
    const withoutBias = buildModelZoneViewModel(modelAgg({ modelId: 11, listingCount: 5 }), GOLF, 5, false);
    expect(withoutBias.samplingBias).toBeUndefined();
    const withBias = buildModelZoneViewModel(modelAgg({ modelId: 11, listingCount: 5, samplingBias: true }), GOLF, 5, false);
    expect(withBias.samplingBias).toBe(true);
  });

  it('buildMakeCardViewModel : `coverageWarning`/`samplingBias` de la MARQUE se retrouvent sur la carte', () => {
    const agg = makeAgg({
      listingCount: 100,
      price: range({ p05: 8900, p95: 32500, n: 100 }),
      year: range({ p05: 2010, p95: 2025, n: 100 }),
      coverageWarning: { price: false, year: true, mileage: false },
      samplingBias: true,
    });
    const card = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.price.coverageWarning).toBeUndefined();
    expect(card.year.coverageWarning).toBe(true);
    expect(card.samplingBias).toBe(true);
  });
});

describe('yearCentralRange — ACC-17 (EX-DATA-64) : le repli [min, max] sous effectif insuffisant reste au plus proche, PAS plancher/plafond', () => {
  // `D8-06` fait basculer la fourchette d'année sur `[min, max]` (valeurs OBSERVÉES) sous n < 12 —
  // ces bornes ne sont PAS des quantiles interpolés et suivent donc la règle « entier » (au plus
  // proche), jamais le plancher/plafond réservé à `[p05, p95]` (`market/format.ts::
  // YearBoundPosition`, position `'raw'`).
  it("n = 2 (palier 'trop-faible'), min = 2017,6 / max = 2019,4 : arrondi au plus proche (2018 – 2019), pas plancher/plafond (2017 – 2020)", () => {
    const agg = modelAgg({ modelId: 11, listingCount: 2, year: range({ min: 2017.6, max: 2019.4, n: 2 }) });
    const zone = buildModelZoneViewModel(agg, GOLF, 2, false);
    expect(zone.year.label).toBe(formatYearRange(2017.6, 2019.4, 'raw', 'raw'));
    expect(zone.year.label).toBe(formatYearRange(2018, 2019));
    expect(zone.year.lowSampleToken).toBe('n = 2');
  });
});

describe('buildMakeCardViewModel — medianPriceLine suit le palier EX-SCR-33/134 (ACC-21)', () => {
  // Reproduction exacte des trois cas cités par la recette (ACC-17/ACC-21, `reports/ACCEPTANCE.md`
  // §8.2) : Aspid (n_prix = 2), Morgan (n_prix = 1), une marque à n_prix >= 12.
  it("Aspid (n_prix = 2, palier 'trop-faible') : « 1 modèle · 2 trop faible », jamais « médiane »", () => {
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
    expect(card.medianPriceLine).toBe('1 modèle · 2 trop faible');
    expect(card.medianPriceLine).not.toContain('médiane');
  });

  it("Morgan (n_prix = 1, palier 'trop-faible') : « 1 modèle · 1 seule offre »", () => {
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
    expect(card.medianPriceLine).toBe('1 modèle · 1 seule offre');
  });

  it("une marque à n_prix >= 12 (palier 'sans-m2'/'complete') publie la médiane, inchangé", () => {
    const agg = makeAgg({ makeId: 1, listingCount: 40, price: range({ p50: 18900, n: 40 }), modelCount: 3 });
    const card = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.medianPriceLine).toBe(`3 modèles · médiane ${formatPrice(18900)}`);
  });

  it("n_prix compris entre 5 et 11 (palier 'reduite') publie ENCORE la médiane (EX-SCR-33 : seul 1 <= n <= 4 l'interdit)", () => {
    const agg = makeAgg({ makeId: 1, listingCount: 8, price: range({ p50: 12000, n: 8 }), modelCount: 2 });
    const card = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.medianPriceLine).toBe(`2 modèles · médiane ${formatPrice(12000)}`);
  });

  it('ACC-15/ACC-21 : accord du pluriel — « 1 modèle », jamais « 1 modèles »', () => {
    const agg = makeAgg({ makeId: 1, listingCount: 21, price: range({ p50: 15000, n: 21 }), modelCount: 1 });
    const card = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.medianPriceLine).toContain('1 modèle ·');
    expect(card.medianPriceLine).not.toContain('1 modèles');
  });
});

describe('priceScopeNote — ACC-18 (EX-DATA-19(2), décision D3-42 (1)) : le périmètre de calcul du prix est nommé', () => {
  it('zone-modèle : `priceScopeNote` est publié dès que `price.available` est vrai', () => {
    const agg = modelAgg({ modelId: 11, listingCount: 552, price: range({ p05: 5900, p95: 15900, p50: 9900, n: 552 }) });
    const zone = buildModelZoneViewModel(agg, GOLF, 552, false);
    expect(zone.price.available).toBe(true);
    expect(zone.priceScopeNote).toBeDefined();
    expect(zone.priceScopeNote).toMatch(/sélection/);
    expect(zone.priceScopeNote).toMatch(/modèle/);
    // Formulation sans jargon interne : ni « cellule », ni « sentinelle », ni « vraisemblance », ni
    // identifiant d'exigence, ne sont montrés à l'utilisateur.
    expect(zone.priceScopeNote).not.toMatch(/cellule|sentinelle|vraisemblance|EX-DATA|EX-SCR|ACC-\d/i);
  });

  it("zone-modèle : `priceScopeNote` est `undefined` quand aucune statistique de prix n'est affichée (`price.available` faux)", () => {
    const agg = modelAgg({ modelId: 11, listingCount: 0 });
    const zone = buildModelZoneViewModel(agg, GOLF, 0, false);
    expect(zone.price.available).toBe(false);
    expect(zone.priceScopeNote).toBeUndefined();
  });

  it('résumé de carte : `priceScopeNote` est publié dès que `price.available` est vrai (même mention que la zone)', () => {
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
    expect(card.price.available).toBe(true);
    expect(card.priceScopeNote).toBe(
      buildModelZoneViewModel(modelAgg({ modelId: 11, listingCount: 576, price: range({ p05: 3900, p95: 15900, p50: 9448, n: 576 }) }), GOLF, 576, false)
        .priceScopeNote,
    );
  });

  it("résumé de carte : `priceScopeNote` est `undefined` quand aucune statistique de prix n'est affichée", () => {
    const agg = makeAgg({ makeId: 1, listingCount: 0 });
    const card = buildMakeCardViewModel(agg, {
      make: VW,
      modelAggregates: [],
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.price.available).toBe(false);
    expect(card.priceScopeNote).toBeUndefined();
  });
});
