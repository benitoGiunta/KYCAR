/**
 * Revue D6 — item 2 : « fourchette centrale » (`A-05`/`R-A05`, `EX-DATA-69`) et `ADV-02`.
 * =================================================================================================
 * `ADV-02` (MAJEUR, `ARB-19`) : l'étiquette « prix min – prix max » sur la carte-marque serait fausse
 * si `displayRange` ([p05,p95]) y était présentée sous ce nom. Ce fichier prouve, PAR EXÉCUTION des
 * modules purs de D6 (`view-model.ts`, `format.ts`), que :
 *   1. partout où `[p05,p95]` est affiché (carte-marque ET zone-modèle), l'étiquette porte
 *      littéralement « fourchette centrale (90 % des offres) » ;
 *   2. `[min,max]` (rawRange) n'est JAMAIS étiqueté comme une fourchette centrale — il porte
 *      « du moins cher au plus cher », un texte disjoint ;
 *   3. le format des nombres est fr-BE : séparateur de milliers U+202F, `€`/`km` précédés d'un NBSP
 *      U+00A0, tiret de fourchette U+2013.
 */
import { describe, expect, it } from 'vitest';

import type { MakeAggregate, MetricRange, ModelAggregate } from '../../../src/providers/DataProvider';
import type { Make, Model } from '../../../src/types/entities';
import { formatMileageRange, formatPrice, formatPriceRange, formatYearRange } from '../../../src/screens/market/format';
import { buildMakeCardViewModel, buildModelZoneViewModel } from '../../../src/screens/market/view-model';

function range(partial: Partial<MetricRange> = {}): MetricRange {
  return { min: null, max: null, p05: null, p50: null, p95: null, n: 0, ...partial };
}
function makeAgg(partial: Partial<MakeAggregate> = {}): MakeAggregate {
  // D8-10 : `modelCount` devient un champ OBLIGATOIRE de `MakeAggregate` (valeur neutre `null`).
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, modelCount: null, ...partial };
}
function modelAgg(partial: Partial<ModelAggregate> & { modelId: number }): ModelAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, ...partial };
}

const OPEL: Make = { makeId: 5, label: 'Opel', slug: 'opel', announcedCount: null };
const CORSA: Model = { makeId: 5, modelId: 50, label: 'Corsa', slug: 'corsa', bodyTypes: [], announcedCount: null };

const CENTRAL_CAPTION = 'fourchette centrale (90 % des offres)';
const RAW_CAPTION = 'du moins cher au plus cher';

describe('ADV-02 — carte-marque : la fourchette [p05,p95] ne porte jamais « prix min – prix max »', () => {
  // Cas normatif de la stress-test : la source annonce 119 € comme minimum d'occasion. Une carte
  // affichant « Opel : de 119 € à 289 000 € » sous l'étiquette centrale décrirait les queues de
  // distribution, pas le marché (EX-DATA-69).
  const agg = makeAgg({
    makeId: 5,
    listingCount: 50000,
    price: range({ min: 119, max: 289000, p05: 3900, p50: 12900, p95: 45000, n: 50000 }),
  });
  const card = buildMakeCardViewModel(agg, {
    make: OPEL,
    modelAggregates: [modelAgg({ modelId: 50, listingCount: 1000, price: range({ min: 119, max: 289000, p05: 3900, p95: 45000, n: 1000 }) })],
    models: new Map([[50, CORSA]]),
    hasUserFilters: false,
    hideSparseModels: false,
    isExpanded: false,
    modelsVisibleBeforeCollapse: 6,
  });

  it("card.price est [p05,p95], étiqueté « fourchette centrale (90 % des offres) »", () => {
    expect(card.price.available).toBe(true);
    expect(card.price.caption).toBe(CENTRAL_CAPTION);
    expect(card.price.label).toBe(formatPriceRange(3900, 45000));
    expect(card.price.label).not.toContain('119');
    expect(card.price.label).not.toContain('289');
  });

  it('card.priceRawTooltip (le [min,max] brut) porte un libellé DISJOINT — jamais « fourchette centrale »', () => {
    expect(card.priceRawTooltip).toContain(RAW_CAPTION);
    expect(card.priceRawTooltip).not.toContain('centrale');
    expect(card.priceRawTooltip).toContain('119');
    expect(card.priceRawTooltip).toContain('289');
  });

  it("card.year suit la même règle (EX-SCR-109 ligne 2)", () => {
    const y = buildMakeCardViewModel(
      makeAgg({ makeId: 5, listingCount: 50000, year: range({ min: 1998, max: 2026, p05: 2010, p95: 2024, n: 50000 }) }),
      {
        make: OPEL,
        modelAggregates: [],
        models: new Map(),
        hasUserFilters: false,
        hideSparseModels: false,
        isExpanded: false,
        modelsVisibleBeforeCollapse: 6,
      },
    );
    expect(y.year.caption).toBe(CENTRAL_CAPTION);
    expect(y.year.label).toBe(formatYearRange(2010, 2024));
  });

  it('EX-SCR-109 : le kilométrage ne fait PAS partie du résumé de marque (agrégat hétérogène sans info)', () => {
    // Absence structurelle : aucun champ `mileage`/`km` sur MakeCardViewModel.
    expect('mileage' in card).toBe(false);
  });
});

describe('ADV-02 — zone-modèle : les trois fourchettes suivent la même règle', () => {
  const agg = modelAgg({
    modelId: 50,
    listingCount: 1281,
    price: range({ min: 500, max: 38000, p05: 9900, p50: 12900, p95: 16400, n: 1281 }),
    year: range({ min: 2001, max: 2026, p05: 2015, p95: 2023, n: 1281 }),
    mileage: range({ min: 0, max: 400000, p05: 20000, p95: 180000, n: 1281 }),
  });
  const zone = buildModelZoneViewModel(agg, CORSA, 1281, false);

  it('les trois libellés portent « fourchette centrale (90 % des offres) », jamais un autre texte', () => {
    expect(zone.price.caption).toBe(CENTRAL_CAPTION);
    expect(zone.year.caption).toBe(CENTRAL_CAPTION);
    expect(zone.mileage.caption).toBe(CENTRAL_CAPTION);
  });

  it('seule la fourchette de PRIX porte un second libellé rawRange (EX-SCR-113 #4)', () => {
    expect(zone.priceRawTooltip).toContain(RAW_CAPTION);
    expect(zone.priceRawTooltip).toContain('500'); // min brut, jamais présenté comme central
    expect(zone.priceRawTooltip).toContain('38');
  });

  it('les fourchettes année et km ne portent AUCUN libellé rawRange (structurellement absent du modèle de vue)', () => {
    expect('yearRawTooltip' in zone).toBe(false);
    expect('mileageRawTooltip' in zone).toBe(false);
  });
});

describe('Format fr-BE des nombres (EX-SCR-1/3/4/5/6)', () => {
  it('séparateur de milliers = U+202F (espace fine insécable), jamais une virgule ni un point', () => {
    expect(formatPrice(12480)).toBe('12 480 €');
    expect(formatPrice(12480)).not.toContain(',');
    expect(formatPrice(12480)).not.toMatch(/12\.480|12,480/);
  });

  it('€ et km précédés d’un NBSP normal (U+00A0), pas d’une espace ordinaire', () => {
    expect(formatPrice(100)).toContain(' €');
    expect(formatMileageRange(12000, 240000).endsWith(' km')).toBe(true);
  });

  it('tiret de fourchette = U+2013 (demi-cadratin), entouré de NBSP', () => {
    const r = formatPriceRange(8900, 32500);
    expect(r).toContain(' – ');
  });

  it('année : jamais de séparateur de milliers (2 014 serait faux)', () => {
    expect(formatYearRange(2010, 2025)).toBe('2010 – 2025');
    expect(formatYearRange(2010, 2025)).not.toContain(' ');
  });
});
