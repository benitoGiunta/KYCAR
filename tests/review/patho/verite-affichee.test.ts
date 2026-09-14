/**
 * KYCAR — Sondes transverses `patho` : VÉRITÉ AFFICHÉE (revue 2.5)
 * =================================================================================================
 * Les invariants que TOUT jeu de données, sain ou pathologique, doit tenir jusqu'au modèle de vue :
 *   - étiquetage des fourchettes (`ADV-02`/`ADV-03` → `ARB-19`, `ARB-20`) : l'écran A publie
 *     `displayRange = [p05, p95]` NOMMÉE `(90 % des offres)`, et la fourchette brute `[min, max]`
 *     sous le libellé `du moins cher au plus cher` ;
 *   - effectifs affichés = effectifs calculés (`EX-DATA-59`/`61`) ;
 *   - somme des buckets = `n_m` de la métrique (I4) ;
 *   - agrégat marque = somme des agrégats modèles (I1/I2) ;
 *   - mention de méthode d'un classement d'opportunité (`ARB-18`).
 *
 * Chaque invariant est rejoué sur SIX jeux : sain, vide, unitaire, cellules unitaires, valeurs
 * absentes, structure dégradée (`modelId = 0` + doublons).
 */

import { describe, expect, it } from 'vitest';

import { AggregationDataset } from '../../../src/engine/index';
import type { RecalcResult } from '../../../src/engine/index';
import { buildHistogram, histogramTable } from '../../../src/screens/distribution/histogram-model';
import { buildMakeCardViewModel, buildModelZoneViewModel } from '../../../src/screens/market/view-model';
import { methodLabel, comparisonBaseLabel, OutlierIndex } from '../../../src/screens/outlier-index';
import { exportBucketsCsv } from '../../../src/screens/listings/csv-export';
import { buildBatch, cell, checkInvariants, PS_MISSING, PS_ON_REQUEST, type RowSpec } from './_fixtures';

/** Les six jeux rejoués, du sain au pathologique. */
const DATASETS: ReadonlyArray<readonly [string, readonly RowSpec[]]> = [
  ['sain', [...cell(60, { makeId: 1, modelId: 101 }), ...cell(40, { makeId: 2, modelId: 201, basePrice: 25000 })]],
  ['vide', []],
  ['unitaire', [{ makeId: 1, modelId: 101, priceEur: 9990, year: 2015, mileageKm: 80000 }]],
  ['cellules-unitaires', Array.from({ length: 30 }, (_v, i) => ({ makeId: 1 + (i % 3), modelId: 100 + i, priceEur: 8000 + i * 200, year: 2012 + (i % 10), mileageKm: 5000 + i * 3000 }))],
  [
    'valeurs-absentes',
    [
      ...cell(20, {}),
      { priceEur: null, priceStatus: PS_ON_REQUEST },
      { priceEur: null, priceStatus: PS_MISSING },
      { priceEur: 12000, year: null },
      { priceEur: 12000, mileageKm: null },
    ],
  ],
  [
    'structure-degradee',
    [
      ...cell(25, { makeId: 54, modelId: 1918 }),
      ...cell(7, { makeId: 54, modelId: 0, basePrice: 6000 }),
      { priceEur: 13000, makeId: 54, modelId: 1918, listingIdBytes: new Uint8Array(16).fill(0x11) },
      { priceEur: 9000, makeId: 54, modelId: 1918, listingIdBytes: new Uint8Array(16).fill(0x11) },
    ],
  ],
];

function recalcOfSpecs(specs: readonly RowSpec[]): RecalcResult {
  return new AggregationDataset(buildBatch(specs)).recalculate({ selectionHash: 'verite' });
}

describe('patho — invariants de vérité affichée, sur les six jeux', () => {
  it.each(DATASETS)('VER-INV-%s — I1/I2/I4/I5 tenus du moteur au modèle de vue', (_name, specs) => {
    const recalc = recalcOfSpecs(specs);
    const inv = checkInvariants(recalc);

    // I1/I2 : agrégat marque = somme des agrégats modèles ; somme des marques = effectif.
    expect(inv.makeCountsMatchModelSums).toBe(true);
    expect(inv.makeSum).toBe(inv.selectionCount);
    expect(inv.selectionCount).toBe(specs.length);

    // I4 : somme des buckets = effectif de l'échantillon valide de la métrique.
    expect(inv.priceBucketSum).toBe(inv.priceN);
    expect(inv.yearBucketSum).toBe(inv.yearN);
    expect(inv.mileageBucketSum).toBe(inv.mileageN);

    // I5 : partition du statut de prix.
    expect(inv.priceStatusPartitionOk).toBe(true);

    // L'histogramme de vue ne réinvente aucun effectif : bar.count = bucket.count, total identique.
    const model = buildHistogram('price', recalc.priceHistogram);
    expect(model.totalCount).toBe(inv.priceN);
    const barSum = model.bars.reduce((s, b) => s + b.count, 0);
    expect(barSum).toBe(inv.priceN);
    // Table équivalente (EX-NFR-15) : une ligne par barre, aucun effectif inventé.
    expect(histogramTable(model, (v) => String(v))).toHaveLength(model.bars.length);
  });

  it.each(DATASETS)('VER-EFFECTIF-%s — l’effectif affiché par chaque zone-modèle est celui de l’agrégat', (_name, specs) => {
    const recalc = recalcOfSpecs(specs);
    for (const agg of recalc.modelAggregates) {
      const zone = buildModelZoneViewModel(agg, undefined, Math.max(1, agg.listingCount), false);
      expect(zone.listingCount).toBe(agg.listingCount);
      expect(zone.ariaLabel).toContain(String(agg.listingCount));
      // `EX-SCR-116` : jamais de fourchette `0 – 0` fabriquée pour un effectif nul.
      if (agg.listingCount === 0) expect(zone.rangesAvailable).toBe(false);
    }
  });

  it.each(DATASETS)('VER-CSV-%s — l’export des buckets reproduit exactement les effectifs du moteur', (_name, specs) => {
    const recalc = recalcOfSpecs(specs);
    const csv = exportBucketsCsv(
      [
        { metric: 'price', buckets: recalc.priceHistogram },
        { metric: 'year', buckets: recalc.yearHistogram },
        { metric: 'mileage', buckets: recalc.mileageHistogram },
      ],
      {
        snapshotId: 'patho',
        capturedAt: '2026-09-01T00:00:00Z',
        sourceKind: 'SYNTHETIC',
        filterQuery: '',
        sampleCoverage: 'NON_APPLICABLE',
        metricCoverage: '',
      },
    );
    const dataLines = csv.split('\n').filter((l) => l.length > 0).slice(4); // 3 méta + en-tête
    const total = recalc.priceHistogram.length + recalc.yearHistogram.length + recalc.mileageHistogram.length;
    expect(dataLines).toHaveLength(total);
  });
});

describe('patho — étiquetage des fourchettes (ADV-02 / ADV-03 → ARB-19, ARB-20)', () => {
  it('VER-ETIQ-A — la carte-marque publie [p05, p95] nommée « 90 % des offres », et [min, max] en libellé secondaire', () => {
    const recalc = recalcOfSpecs([
      { makeId: 54, modelId: 1918, priceEur: 119, year: 2010, mileageKm: 200000 },
      ...cell(60, { makeId: 54, modelId: 1918, basePrice: 13000, spread: 0.2 }),
      { makeId: 54, modelId: 1918, priceEur: 289000, year: 2024, mileageKm: 1000 },
    ]);
    const agg = recalc.makeAggregates[0]!;
    const card = buildMakeCardViewModel(agg, {
      make: undefined,
      modelAggregates: recalc.modelAggregates,
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });

    // `ARB-19` : la fourchette PRINCIPALE est `displayRange`, jamais `[min, max]` — l'exemple même
    // d'`ADV-02` (« Opel : 119 € – 289 000 € ») ne doit pas être la ligne 2 de la carte.
    expect(card.price.caption).toBe('fourchette centrale (90 % des offres)');
    expect(card.price.label).not.toContain('119');
    expect(card.price.label).not.toContain('289');

    // Sonde AMENDÉE (D-31, justification D-44). L'annonce à 119 € est sous
    // `0,10 × médianeRéf(C₃ = Σ)` (médiane ≈ 13 000 € ⇒ seuil ≈ 1 300 €) : c'est une sentinelle
    // RELATIVE au sens d'EX-DATA-19(2), donc hors de `V_price` au titre d'EX-DATA-60, exactement
    // comme une sentinelle absolue. Elle reste comptée dans l'effectif (ARB-15, 62 annonces).
    // CONSÉQUENCE consignée au rapport : le CHIFFRE littéral d'`ADV-02` (« 119 € ») n'est plus
    // atteignable dans une cellule d'au moins 12 prix valides ; l'ATTAQUE d'ADV-02 l'est toujours,
    // et c'est elle que la sonde mesure — une fourchette brute [1 400 €, 289 000 €] reste absurde
    // et c'est `ARB-19` (étiquetage), non la donnée, qui la rend lisible.
    expect(agg.listingCount).toBe(62);
    expect(recalc.implausibleInCellExcluded).toBe(1);
    expect(agg.price.n).toBe(61);
    expect(agg.price.min).toBeGreaterThan(1300);
    expect(agg.price.max).toBe(289000);

    // `ARB-19` : la fourchette brute existe, en libellé secondaire nommé.
    expect(card.priceRawTooltip).toContain('du moins cher au plus cher');
    expect(card.priceRawTooltip).toContain('289');

    // Même attaque, avec un prix bas que la règle relative NE capte PAS (≥ 0,10 × médianeRéf) :
    // la fourchette brute reste trompeuse, et `ARB-19` reste la seule réponse.
    const adv02 = recalcOfSpecs([
      { makeId: 54, modelId: 1918, priceEur: 1400, year: 2010, mileageKm: 200000 },
      ...cell(60, { makeId: 54, modelId: 1918, basePrice: 13000, spread: 0.2 }),
      { makeId: 54, modelId: 1918, priceEur: 289000, year: 2024, mileageKm: 1000 },
    ]);
    const aggAdv = adv02.makeAggregates[0]!;
    expect(aggAdv.price.min).toBe(1400);
    expect(aggAdv.price.max).toBe(289000);
    const cardAdv = buildMakeCardViewModel(aggAdv, {
      make: undefined,
      modelAggregates: adv02.modelAggregates,
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: false,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(cardAdv.price.label).not.toContain('1 400');
    expect(cardAdv.price.label).not.toContain('289');
    expect(cardAdv.priceRawTooltip).toContain('du moins cher au plus cher');
    expect(cardAdv.priceRawTooltip).toContain('289');
  });

  it('VER-ETIQ-ZONE — la zone-modèle porte le même libellé normatif et son infobulle brute', () => {
    const recalc = recalcOfSpecs(cell(40, { makeId: 54, modelId: 1918, basePrice: 15000 }));
    const zone = buildModelZoneViewModel(recalc.modelAggregates[0]!, undefined, 40, false);
    expect(zone.price.caption).toBe('fourchette centrale (90 % des offres)');
    expect(zone.year.caption).toBe('fourchette centrale (90 % des offres)');
    expect(zone.mileage.caption).toBe('fourchette centrale (90 % des offres)');
    expect(zone.priceRawTooltip).toContain('du moins cher au plus cher');
  });

  it('R-PATHO-16 — EX-DATA-94 : `opportunityScore` n’est publié que pour les annonces SIGNALÉES, pas pour les annonces évaluées', () => {
    // `EX-DATA-94` : `opportunityScore = −z_i` si M2 s'applique à l'annonce, `−zIqr_i` si M1 s'applique,
    // `null` SINON — donc défini pour toute annonce ÉVALUÉE, pas seulement pour celles qui franchissent
    // un seuil. `EX-SCR-206` trie l'écran D sur ce score : sans lui, seules les annonces signalées
    // sont classées et toutes les autres tombent en fin de liste.
    const recalc = recalcOfSpecs(
      Array.from({ length: 60 }, (_v, i) => ({
        makeId: 7,
        modelId: 707,
        year: 2016,
        month: 1 + (i % 12),
        priceEur: i === 0 ? 1500 : 12000 + (i % 6) * 350,
        mileageKm: 20000 + i * 1200,
      })),
    );
    const index = new OutlierIndex(recalc.outlierVerdicts);
    expect(recalc.selectionStats.outlierEvaluatedCount).toBe(60);
    // ATTENDU : un score pour chaque annonce évaluée. Constaté : seulement pour les signalées.
    expect(index.size).toBe(recalc.selectionStats.outlierEvaluatedCount);
  });

  it('VER-METHODE — tout classement d’opportunité nomme sa méthode et sa cellule (ARB-18, ARB-47)', () => {
    const recalc = recalcOfSpecs(
      Array.from({ length: 40 }, (_v, i) => ({
        makeId: 7,
        modelId: 707,
        year: 2016,
        month: 1 + (i % 12),
        priceEur: i === 0 ? 1500 : 12000 + (i % 6) * 350,
        mileageKm: 20000 + i * 1800,
      })),
    );
    const index = new OutlierIndex(recalc.outlierVerdicts);
    expect(index.size).toBeGreaterThan(0);
    const entry = index.get(recalc.outlierVerdicts[0]!.listingId)!;

    expect(methodLabel(entry.method)).toMatch(
      /^score : (écart au prix attendu \(M2\)|écart robuste au prix de la cellule \(M1\))$/,
    );
    const label = comparisonBaseLabel(entry, { makeModel: 'Marque Modèle', year: 2016 });
    expect(label.startsWith('écart calculé sur :')).toBe(true);
    expect(label).toContain(`n = ${entry.cellCount}`);
    expect(entry.cellCount).toBeGreaterThan(0);
  });
});
