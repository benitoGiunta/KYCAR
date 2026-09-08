import { describe, expect, it } from 'vitest';
import { buildMakeAggregate, buildModelAggregate, computeMetricRange } from './aggregate';
import { mapListingToNormalized } from './normalize';
import { buildEuroStandardIndex } from './vocabularyMap';
import { loadRealReferenceData, makeRawListing } from './testFixtures';

const referenceData = loadRealReferenceData();
const euroIndex = buildEuroStandardIndex(referenceData);

function listing(priceCents: number, mileageKm: number, year: number) {
  const raw = makeRawListing({
    itemId: `id-${priceCents}`,
    brand: 'Opel',
    model: 'Corsa',
    priceCents,
    priceType: 'FIXED',
    mileage: `${mileageKm} km`,
    constructionYear: String(year),
  });
  return mapListingToNormalized(raw, referenceData, 'be', euroIndex);
}

describe('aggregate — MetricRange et lignes MakeAggregate/ModelAggregate', () => {
  it('computeMetricRange calcule min/max/p50 sur un échantillon connu', () => {
    const range = computeMetricRange([10, 20, 30, 40, 50], 'mileage');
    expect(range.n).toBe(5);
    expect(range.min).toBe(10);
    expect(range.max).toBe(50);
    expect(range.p50).toBe(30);
  });

  it('computeMetricRange ignore les valeurs inconnues (null)', () => {
    const range = computeMetricRange([100, null, 200, null], 'mileage');
    expect(range.n).toBe(2);
    expect(range.min).toBe(100);
    expect(range.max).toBe(200);
  });

  it('EX-DATA-60 / ARB-15 (DR-001) : la métrique PRIX exclut la sentinelle absolue de 250 €', () => {
    // L'annonce à 1 € compte dans l'effectif (`listingCount`) mais n'entre NI dans la médiane NI
    // dans les bornes publiées. Le prix est la SEULE métrique à porter une sentinelle absolue :
    // c'est pourquoi il est la valeur par défaut du paramètre `metric`.
    const range = computeMetricRange([10000, 12000, 15000, 1]);
    expect(range.n).toBe(3);
    expect(range.min).toBe(10000);
    expect(range.p50).toBe(12000);
    // La même série lue comme un kilométrage garde ses quatre valeurs : la règle est propre au prix.
    expect(computeMetricRange([10000, 12000, 15000, 1], 'mileage').n).toBe(4);
  });

  it('computeMetricRange sur échantillon vide renvoie tout à null, n=0', () => {
    const range = computeMetricRange([]);
    expect(range).toEqual({ min: null, max: null, p05: null, p50: null, p95: null, n: 0 });
  });

  it('buildMakeAggregate sépare le compte EXHAUSTIF (totalResultCount) de la fourchette ÉCHANTILLON', () => {
    const sample = [listing(1000000, 50000, 2018), listing(2000000, 30000, 2020), listing(1500000, 80000, 2016)];
    const row = buildMakeAggregate(54, 5220, sample);
    expect(row.makeId).toBe(54);
    expect(row.listingCount).toBe(5220); // exhaustif, pas la taille de l'échantillon
    expect(row.price.n).toBe(3); // fourchette calculée sur l'échantillon
    expect(row.price.min).toBe(10000);
    expect(row.price.max).toBe(20000);
    expect(row.sampleCoverage).toBeCloseTo(3 / 5220);
  });

  it('buildModelAggregate porte makeId ET modelId', () => {
    const sample = [listing(1000000, 50000, 2018)];
    const row = buildModelAggregate(54, 1918, 1281, sample);
    expect(row.makeId).toBe(54);
    expect(row.modelId).toBe(1918);
    expect(row.listingCount).toBe(1281);
    expect(row.sampleCoverage).toBeCloseTo(1 / 1281);
  });

  it('sampleCoverage est null quand listingCount vaut 0', () => {
    const row = buildMakeAggregate(54, 0, []);
    expect(row.sampleCoverage).toBeNull();
  });
});
