import { describe, expect, it } from 'vitest';

import type { MakeAggregate, MetricRange } from '../../providers/DataProvider';
import { deriveScreenAState, SCREEN_A_STATE_KINDS, type LoadPhase, type ScreenALoadedData } from './state';

function range(): MetricRange {
  return { min: null, max: null, p05: null, p50: null, p95: null, n: 0 };
}

function makeAgg(makeId: number, listingCount: number): MakeAggregate {
  return { makeId, listingCount, price: range(), mileage: range(), year: range(), sampleCoverage: null, modelCount: null };
}

function baseData(partial: Partial<ScreenALoadedData> = {}): ScreenALoadedData {
  return {
    makeAggregates: [],
    modelAggregatesByMake: new Map(),
    hasUserFilters: false,
    activeFilterCount: 0,
    topRestrictiveFilters: [],
    snapshotDate: '2026-09-08',
    snapshotListingCount: 0,
    snapshotAnnouncedListingCount: null,
    failedMakeIds: new Set(),
    totalMakesAttempted: 0,
    ...partial,
  };
}

describe('deriveScreenAState — les 6 états rendables de l’écran A', () => {
  it('phase loading -> kind loading (ET-CHARGE-INIT)', () => {
    const load: LoadPhase = { phase: 'loading' };
    expect(deriveScreenAState(load)).toEqual({ kind: 'loading' });
  });

  it('phase error -> kind provider-error (ET-ERREUR-PROVIDER)', () => {
    const load: LoadPhase = { phase: 'error', errorCode: 'E-PROV-408', attemptedAt: '14:32:07', hasCachedResult: true };
    expect(deriveScreenAState(load)).toEqual({
      kind: 'provider-error',
      errorCode: 'E-PROV-408',
      attemptedAt: '14:32:07',
      hasCachedResult: true,
    });
  });

  it('aucun agrégat, aucun filtre posé -> kind empty, reason no-filter (ET-VIDE-SANS-FILTRE, traité en panne)', () => {
    const load: LoadPhase = { phase: 'loaded', data: baseData({ hasUserFilters: false, snapshotDate: '2026-09-08' }) };
    const state = deriveScreenAState(load);
    expect(state).toEqual({ kind: 'empty', reason: 'no-filter', snapshotDate: '2026-09-08' });
  });

  it('aucun agrégat, au moins un filtre posé -> kind empty, reason filters (ET-VIDE-FILTRES)', () => {
    const load: LoadPhase = {
      phase: 'loaded',
      data: baseData({
        hasUserFilters: true,
        activeFilterCount: 12,
        topRestrictiveFilters: [{ filterId: 'priceTo', label: 'Prix max', gain: 4200 }],
      }),
    };
    const state = deriveScreenAState(load);
    expect(state).toEqual({
      kind: 'empty',
      reason: 'filters',
      activeFilterCount: 12,
      topRestrictive: [{ filterId: 'priceTo', label: 'Prix max', gain: 4200 }],
    });
  });

  it("des agrégats, ET des marques en échec -> kind partial (EX-SCR-133), même sans filtre", () => {
    const load: LoadPhase = {
      phase: 'loaded',
      data: baseData({
        makeAggregates: [makeAgg(1, 100)],
        failedMakeIds: new Set([2, 3]),
        totalMakesAttempted: 3,
      }),
    };
    const state = deriveScreenAState(load);
    expect(state.kind).toBe('partial');
    if (state.kind === 'partial') {
      expect(state.failedMakeIds).toEqual(new Set([2, 3]));
      expect(state.totalMakesAttempted).toBe(3);
    }
  });

  it('des agrégats, aucun échec, aucun filtre posé -> kind no-filter (SANS-FILTRE, EX-SCR-125)', () => {
    const load: LoadPhase = { phase: 'loaded', data: baseData({ makeAggregates: [makeAgg(1, 12480)], hasUserFilters: false }) };
    expect(deriveScreenAState(load).kind).toBe('no-filter');
  });

  it('des agrégats, aucun échec, un filtre posé -> kind ready (rendu nominal)', () => {
    const load: LoadPhase = { phase: 'loaded', data: baseData({ makeAggregates: [makeAgg(1, 42)], hasUserFilters: true }) };
    expect(deriveScreenAState(load).kind).toBe('ready');
  });

  it("l'échec partiel prévaut sur l'état SANS-FILTRE : une marque en échec sans filtre reste 'partial', pas 'no-filter'", () => {
    const load: LoadPhase = {
      phase: 'loaded',
      data: baseData({ makeAggregates: [makeAgg(1, 100)], hasUserFilters: false, failedMakeIds: new Set([2]), totalMakesAttempted: 2 }),
    };
    expect(deriveScreenAState(load).kind).toBe('partial');
  });

  it('SCREEN_A_STATE_KINDS énumère exactement les 6 états, sans doublon', () => {
    expect(new Set(SCREEN_A_STATE_KINDS).size).toBe(6);
    expect(SCREEN_A_STATE_KINDS).toHaveLength(6);
  });

  it('chacun des 6 kinds de SCREEN_A_STATE_KINDS est effectivement atteignable par deriveScreenAState', () => {
    const reached = new Set<string>();
    reached.add(deriveScreenAState({ phase: 'loading' }).kind);
    reached.add(deriveScreenAState({ phase: 'error', errorCode: 'E', attemptedAt: '00:00:00', hasCachedResult: false }).kind);
    reached.add(deriveScreenAState({ phase: 'loaded', data: baseData({ hasUserFilters: false }) }).kind); // empty/no-filter
    reached.add(deriveScreenAState({ phase: 'loaded', data: baseData({ hasUserFilters: true }) }).kind); // empty/filters
    reached.add(deriveScreenAState({ phase: 'loaded', data: baseData({ makeAggregates: [makeAgg(1, 1)], hasUserFilters: false }) }).kind); // no-filter
    reached.add(deriveScreenAState({ phase: 'loaded', data: baseData({ makeAggregates: [makeAgg(1, 1)], hasUserFilters: true }) }).kind); // ready
    reached.add(
      deriveScreenAState({
        phase: 'loaded',
        data: baseData({ makeAggregates: [makeAgg(1, 1)], failedMakeIds: new Set([2]), totalMakesAttempted: 2 }),
      }).kind,
    ); // partial
    expect(reached).toEqual(new Set(SCREEN_A_STATE_KINDS));
  });
});
