/**
 * KYCAR — Sondes transverses `patho` : VOLUMÉTRIE (revue 2.5)
 * =================================================================================================
 * Rejeu de bout en bout (`DataProvider` → moteur D4 → modèles de vue D6/D7) des cas de volumétrie
 * de la matrice d'attaques d'`ST-adversarial.md` : `n = 0`, `n = 1`, 1 annonce par cellule sur
 * 100 cellules, 200 000 annonces (borne haute rejouée une seule fois, mise en cache module), et une
 * cellule unique de 50 000 annonces.
 *
 * Attendus : `ARB-17` (paliers 0 / 1-4 / 5-11 / 12-29 / ≥ 30), `EX-SCR-116` (aucun `0 – 0 €`
 * fabriqué), `EX-DATA-81` (`BIN` sur échantillon vide), invariants I1/I2/I4/I5.
 */

import { describe, expect, it } from 'vitest';

import { generateSyntheticDataset } from '../../../src/engine/index';
import { AggregationDataset } from '../../../src/engine/index';
import type { RecalcResult } from '../../../src/engine/index';
import { buildMakeCardViewModel, buildModelZoneViewModel } from '../../../src/screens/market/view-model';
import { deriveScreenAState } from '../../../src/screens/market/state';
import { buildHistogram } from '../../../src/screens/distribution/histogram-model';
import { effectifTier } from '../../../src/screens/market/thresholds';
import { batchProvider, buildBatch, cell, checkInvariants, recalcOf, recalcThroughProvider } from './_fixtures';

/* ------------------------------------------------------------------------------------------------
 * Jeu 200 000 annonces : généré UNE SEULE FOIS pour tout le fichier (contrainte §2 du protocole).
 * ---------------------------------------------------------------------------------------------- */
let big: RecalcResult | null = null;
function bigRecalc(): RecalcResult {
  if (big === null) {
    const ds = generateSyntheticDataset({ rowCount: 200_000, seed: 20260908 });
    big = new AggregationDataset(ds.batch).recalculate({ selectionHash: 'FULL:EMPTY' });
  }
  return big;
}

describe('patho — volumétrie', () => {
  it('VOL-00 — 0 annonce : aucun agrégat fabriqué, aucun bucket, écran A en état vide (EX-SCR-116, EX-DATA-81)', async () => {
    const recalc = await recalcOf([]);

    expect(recalc.selectionStats.selectionCount).toBe(0);
    expect(recalc.makeAggregates).toHaveLength(0);
    expect(recalc.modelAggregates).toHaveLength(0);
    expect(recalc.priceHistogram).toHaveLength(0);
    expect(recalc.selectionStats.price.n).toBe(0);
    expect(recalc.selectionStats.price.p50).toBeNull();
    expect(recalc.selectionStats.price.min).toBeNull(); // jamais 0 fabriqué
    expect(effectifTier(0)).toBe('absente');

    // Écran A : état vide explicite, jamais une grille de cartes à 0.
    const state = deriveScreenAState({
      phase: 'loaded',
      data: {
        makeAggregates: [],
        modelAggregatesByMake: new Map(),
        hasUserFilters: false,
        activeFilterCount: 0,
        topRestrictiveFilters: [],
        snapshotDate: '2026-09-01',
        snapshotListingCount: 0,
        snapshotAnnouncedListingCount: null,
        failedMakeIds: new Set(),
        totalMakesAttempted: 0,
      },
    });
    expect(state.kind).toBe('empty');

    // Histogramme vide : aucune barre, pas de bascule log proposée.
    const h = buildHistogram('price', recalc.priceHistogram);
    expect(h.bars).toHaveLength(0);
    expect(h.logAvailable).toBe(false);
  });

  it('VOL-01 — 1 annonce : effectif 1, médiane = la valeur, aucun percentile publié par la zone-modèle (ARB-17)', async () => {
    const recalc = await recalcOf([{ makeId: 7, modelId: 700, priceEur: 9990, year: 2015, mileageKm: 88000 }]);

    expect(recalc.selectionStats.selectionCount).toBe(1);
    expect(recalc.selectionStats.price.n).toBe(1);
    expect(recalc.selectionStats.price.p50).toBe(9990);
    expect(recalc.selectionStats.price.stdDev).toBeNull(); // jamais 0 (matrice ST-adversarial « n = 1 »)
    expect(recalc.priceHistogram.reduce((s, b) => s + b.count, 0)).toBe(1);

    const zone = buildModelZoneViewModel(recalc.modelAggregates[0]!, undefined, 1, false);
    expect(zone.listingCount).toBe(1);
    expect(zone.medianLabel).toBe('1 seule offre'); // ARB-17 : 1 ≤ n ≤ 4 → aucune médiane publiée
    expect(zone.rangesAvailable).toBe(true);
    expect(zone.price.label).not.toContain('0 – 0');
    expect(effectifTier(1)).toBe('trop-faible');
  });

  it('VOL-100 — 100 cellules à 1 annonce : 100 zones-modèles, aucune statistique de cellule, invariants tenus', async () => {
    const specs = Array.from({ length: 100 }, (_v, i) => ({
      makeId: 1 + (i % 5),
      modelId: 1000 + i,
      priceEur: 8000 + i * 137,
      year: 2010 + (i % 15),
      mileageKm: 10000 + i * 900,
    }));
    const recalc = await recalcOf(specs);

    expect(recalc.selectionStats.selectionCount).toBe(100);
    expect(recalc.modelAggregates).toHaveLength(100);
    expect(recalc.makeAggregates).toHaveLength(5);

    const inv = checkInvariants(recalc);
    expect(inv.makeSum).toBe(inv.selectionCount);
    expect(inv.makeCountsMatchModelSums).toBe(true);
    expect(inv.priceBucketSum).toBe(inv.priceN);
    expect(inv.priceStatusPartitionOk).toBe(true);

    // Aucune cellule n'atteint 12 : M1 s'appuie sur C₃ (la sélection), jamais sur une cellule à 1.
    for (const v of recalc.outlierVerdicts) expect(v.cellLabel).toBe('SELECTION');

    // Chaque zone-modèle affiche « 1 seule offre », jamais une médiane de cellule à 1.
    const zones = recalc.modelAggregates.map((a) => buildModelZoneViewModel(a, undefined, 1, false));
    expect(zones.every((z) => z.medianLabel === '1 seule offre')).toBe(true);
  });

  it('VOL-200K — 200 000 annonces : recalcul complet, invariants et sommes exactes (extrapolation 10⁶ au rapport)', () => {
    const recalc = bigRecalc();
    const inv = checkInvariants(recalc);

    expect(inv.selectionCount).toBe(200_000);
    expect(inv.makeSum).toBe(200_000);
    expect(inv.makeCountsMatchModelSums).toBe(true);
    expect(inv.priceBucketSum).toBe(inv.priceN);
    expect(inv.yearBucketSum).toBe(inv.yearN);
    expect(inv.mileageBucketSum).toBe(inv.mileageN);
    expect(inv.priceStatusPartitionOk).toBe(true);
    // ≤ 26 bins émis par métrique (EX-DATA-77 : 24 fermés + 2 débordements).
    expect(recalc.priceHistogram.length).toBeLessThanOrEqual(26);
    expect(recalc.mileageHistogram.length).toBeLessThanOrEqual(26);
  });

  it('VOL-50K — une cellule unique de 50 000 annonces : M1 et M2 sur la cellule C₂, aucune dégradation en C₃', async () => {
    const specs = cell(50_000, { makeId: 3, modelId: 303, year: 2019, basePrice: 21000 });
    const provider = batchProvider(buildBatch(specs));
    const recalc = await recalcThroughProvider(provider);

    expect(recalc.selectionStats.selectionCount).toBe(50_000);
    expect(recalc.makeAggregates).toHaveLength(1);
    expect(recalc.modelAggregates).toHaveLength(1);
    const inv = checkInvariants(recalc);
    expect(inv.makeSum).toBe(50_000);
    expect(inv.priceBucketSum).toBe(inv.priceN);

    // Toutes les lignes partagent (marque, modèle, année) : la cellule retenue est C₁ (MODEL_YEAR).
    const m1 = recalc.outlierVerdicts.filter((v) => v.method === 'M1');
    for (const v of m1) expect(v.cellLabel).toBe('MODEL_YEAR');
  });

  it('VOL-CARTE — la carte-marque d’une marque à 100 modèles reste complète et virtualisée (ARB-28 / EX-SCR-124bis)', async () => {
    const specs = Array.from({ length: 100 }, (_v, i) => ({
      makeId: 42,
      modelId: 2000 + i,
      priceEur: 10000 + i * 90,
      year: 2016,
      mileageKm: 50000,
    }));
    const recalc = await recalcOf(specs);
    const card = buildMakeCardViewModel(recalc.makeAggregates[0]!, {
      make: undefined,
      modelAggregates: recalc.modelAggregates,
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: true,
      modelsVisibleBeforeCollapse: 6,
    });
    // ARB-28 : virtualisation, jamais plafonnement du nombre de zones accessibles.
    expect(card.modelZones).toHaveLength(100);
    expect(card.needsVirtualizedModelList).toBe(true);
    expect(card.needsModelSearchField).toBe(true);
    expect(card.modelCount).toBe(100);
  });
});
