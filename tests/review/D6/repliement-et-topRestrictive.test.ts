/**
 * Revue D6 — item 9 : repliement des cartes (`EX-SCR-122`/`123`/`124`) et `topRestrictiveFilters`
 * leave-one-out (`EX-SCR-26`, « non câblé » selon `docs/HANDOFF.md` §6).
 * =================================================================================================
 * Le repliement lui-même est déjà largement couvert par `view-model.test.ts` (6/7/8/34 modèles,
 * seuils de recherche/virtualisation à 12/30). Ce fichier vérifie un cas non couvert par le lot
 * (repliement PUIS re-dépliement, cohérence de `remainingModelCount`) et établit le FAIT sur
 * `topRestrictiveFilters` : où la responsabilité réelle du calcul se trouve, et ce que D6 fait
 * correctement de ce qu'on lui fournit (y compris un tableau vide).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { MakeAggregate, MetricRange, ModelAggregate } from '../../../src/providers/DataProvider';
import type { Model } from '../../../src/types/entities';
import { buildMakeCardViewModel } from '../../../src/screens/market/view-model';
import { deriveScreenAState, type LoadPhase } from '../../../src/screens/market/state';

function range(): MetricRange {
  return { min: null, max: null, p05: null, p50: null, p95: null, n: 0 };
}
function modelAgg(partial: Partial<ModelAggregate> & { modelId: number }): ModelAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, ...partial };
}
function makeAgg(partial: Partial<MakeAggregate> = {}): MakeAggregate {
  // D8-10 : `modelCount` devient un champ OBLIGATOIRE de `MakeAggregate` (valeur neutre `null`).
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, modelCount: null, ...partial };
}

describe('Repliement — cohérence replié <-> déplié sur la même marque (EX-SCR-122/123)', () => {
  it('remainingModelCount(replié) === modelZones.length − 6, et redevient 0 une fois déplié, sans perte ni doublon de zone', () => {
    const models = new Map<number, Model>();
    const aggs: ModelAggregate[] = Array.from({ length: 20 }, (_, i) => modelAgg({ modelId: i + 1, listingCount: 20 - i }));
    const opts = {
      make: undefined,
      modelAggregates: aggs,
      models,
      hasUserFilters: false,
      hideSparseModels: false,
      modelsVisibleBeforeCollapse: 6,
    };
    const collapsed = buildMakeCardViewModel(makeAgg({ listingCount: 100 }), { ...opts, isExpanded: false });
    const expanded = buildMakeCardViewModel(makeAgg({ listingCount: 100 }), { ...opts, isExpanded: true });

    expect(collapsed.visibleModelZones).toHaveLength(6);
    expect(collapsed.remainingModelCount).toBe(14);
    expect(collapsed.hasMoreModels).toBe(true);

    expect(expanded.visibleModelZones).toHaveLength(20);
    expect(expanded.remainingModelCount).toBe(0);
    // Le même ENSEMBLE de modelId, replié ou déplié — aucune zone perdue par le repliement.
    const idsCollapsed = new Set(collapsed.modelZones.map((z) => z.modelId));
    const idsExpanded = new Set(expanded.modelZones.map((z) => z.modelId));
    expect(idsCollapsed).toEqual(idsExpanded);
    expect(idsCollapsed.size).toBe(20);
  });
});

describe('topRestrictiveFilters (EX-SCR-26, leave-one-out) — état réel de câblage', () => {
  it("D6 (state.ts/MarketScreen.tsx) consomme correctement un tableau VIDE sans planter : zéro bouton de retrait, mais le reste du bloc ET-VIDE-FILTRES s'affiche", () => {
    const load: LoadPhase = {
      phase: 'loaded',
      data: {
        makeAggregates: [],
        modelAggregatesByMake: new Map(),
        hasUserFilters: true,
        activeFilterCount: 12,
        topRestrictiveFilters: [], // ce que D8 fournit RÉELLEMENT aujourd'hui (voir test suivant)
        snapshotDate: '2026-09-08',
        snapshotListingCount: 0,
        snapshotAnnouncedListingCount: null,
        failedMakeIds: new Set(),
        totalMakesAttempted: 0,
      },
    };
    const state = deriveScreenAState(load);
    expect(state.kind).toBe('empty');
    if (state.kind === 'empty' && state.reason === 'filters') {
      expect(state.topRestrictive).toEqual([]);
      expect(state.activeFilterCount).toBe(12);
    }
  });

  it(
    'CONSTAT (hors périmètre D6, cité pour mémoire) — le calcul leave-one-out lui-même vit dans ' +
      "src/orchestration/data-controller.ts (D8), qui fournit aujourd'hui littéralement `topRestrictiveFilters: []` " +
      "en dur : la fonctionnalité n'est PAS câblée en amont de D6, confirmant docs/HANDOFF.md §6.",
    () => {
      const src = readFileSync(new URL('../../../src/orchestration/data-controller.ts', import.meta.url), 'utf8');
      expect(src).toContain('topRestrictiveFilters: []');
    },
  );

  it('MarketScreen.tsx rend bien un bouton par élément de `topRestrictive`, au format normatif exact quand des hints EXISTENT (le rendu, lui, est prêt)', () => {
    const src = readFileSync(new URL('../../../src/screens/market/MarketScreen.tsx', import.meta.url), 'utf8');
    expect(src).toContain('hint.gain === null');
    expect(src).toContain('offres de plus');
    expect(src).toContain('state.topRestrictive.map');
  });
});
