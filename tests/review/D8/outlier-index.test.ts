/**
 * Revue D8 (remédiation 2.8) — sonde `D8-11-outlier-index` : `OutlierIndex` face aux verdicts de
 * NON-ÉVALUABILITÉ `INSUFFICIENT_*` (D8-09, `EX-DATA-85`/`86`/`95`).
 *
 * Constat relevé par `fix-engine` (§6.1 de son rapport) et attribué à `fix-app` : depuis D8-09 le
 * moteur publie UN verdict par annonce non évaluable, portant `flags = ['INSUFFICIENT_DATA']` ou
 * `['INSUFFICIENT_SPREAD']`. `OutlierIndex.has()` répond « signalée » dès que `flags` est non vide
 * et `isEvaluated()` dès qu'une entrée existe : les deux répondaient donc **oui** sur une annonce
 * que le moteur déclare explicitement NON évaluée. Conséquences observables : `|A|` (nuage G4,
 * écrêtage `EX-DATA-101`) gonflé de toutes les annonces d'une cellule sous n = 12, sucettes G8 sur
 * des annonces sans écart mesuré, colonne « signalée » de l'écran D fausse.
 *
 * Sonde écrite AVANT la correction (D-32) : rouge à l'écriture, verte après.
 */
import { describe, expect, it } from 'vitest';

import { OutlierIndex } from '../../../src/screens/outlier-index';
import type { OutlierVerdict } from '../../../src/types/index';

function verdict(partial: Partial<OutlierVerdict> & { listingId: string }): OutlierVerdict {
  return {
    listingId: partial.listingId,
    method: partial.method ?? 'M1',
    flags: partial.flags ?? [],
    opportunityScore: partial.opportunityScore ?? null,
    expectedPriceEur: partial.expectedPriceEur ?? null,
    deviationPct: partial.deviationPct ?? null,
    cellLabel: partial.cellLabel ?? 'MODEL',
    cellCount: partial.cellCount ?? 0,
  } as OutlierVerdict;
}

describe('D8-09 / EX-DATA-95 — OutlierIndex et les verdicts INSUFFICIENT_*', () => {
  it('R-D8-09-IDX-01 : une annonce INSUFFICIENT_DATA n’est ni signalée ni évaluée', () => {
    const index = new OutlierIndex([verdict({ listingId: 'a', flags: ['INSUFFICIENT_DATA'] })]);
    expect(index.has('a'), 'INSUFFICIENT_DATA n’est pas une annonce signalée (|A|)').toBe(false);
    expect(index.isEvaluated('a'), 'INSUFFICIENT_DATA dit précisément que l’annonce n’a PAS été évaluée').toBe(false);
    expect(index.flaggedCount).toBe(0);
  });

  it('R-D8-09-IDX-02 : idem pour INSUFFICIENT_SPREAD (dispersion nulle, EX-DATA-89)', () => {
    const index = new OutlierIndex([verdict({ listingId: 'b', flags: ['INSUFFICIENT_SPREAD'] })]);
    expect(index.has('b')).toBe(false);
    expect(index.isEvaluated('b')).toBe(false);
  });

  it('R-D8-09-IDX-03 : une annonce ÉVALUÉE sans barrière franchie reste évaluée mais non signalée (D-48)', () => {
    const index = new OutlierIndex([verdict({ listingId: 'c', flags: [], opportunityScore: 0.2 })]);
    expect(index.has('c')).toBe(false);
    expect(index.isEvaluated('c'), 'flags vide = évaluée sans anomalie, pas « non évaluable »').toBe(true);
  });

  it('R-D8-09-IDX-04 : une vraie anomalie reste signalée et évaluée', () => {
    const index = new OutlierIndex([verdict({ listingId: 'd', flags: ['M1_LOW'], opportunityScore: -1.4 })]);
    expect(index.has('d')).toBe(true);
    expect(index.isEvaluated('d')).toBe(true);
    expect(index.flaggedCount).toBe(1);
  });

  it('R-D8-09-IDX-05 : un verdict M2 réel prime sur un verdict INSUFFICIENT_* de la même annonce', () => {
    const index = new OutlierIndex([
      verdict({ listingId: 'e', method: 'M1', flags: ['INSUFFICIENT_DATA'] }),
      verdict({ listingId: 'e', method: 'M2', flags: ['M2_HIGH'], opportunityScore: 2.1 }),
    ]);
    expect(index.has('e')).toBe(true);
    expect(index.isEvaluated('e')).toBe(true);
    expect(index.get('e')?.flags).toContain('M2_HIGH');
  });
});
