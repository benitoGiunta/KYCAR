/**
 * KYCAR — Tests de la sélection de comparaison (lot D8, EX-CRUD-13bis).
 */
import { describe, expect, it } from 'vitest';

import { addToCompare, removeFromCompare, parseCompareParam, serializeCompareParam, MAX_COMPARE } from './compare-selection';

describe('sélection de comparaison (EX-CRUD-13bis)', () => {
  it('ajoute, refuse les doublons et plafonne à 4', () => {
    let sel = addToCompare([], { makeId: 1, modelId: 10 });
    sel = addToCompare(sel, { makeId: 1, modelId: 10 }); // doublon → sans effet
    expect(sel).toHaveLength(1);
    sel = addToCompare(sel, { makeId: 2, modelId: 20 });
    sel = addToCompare(sel, { makeId: 3, modelId: 30 });
    sel = addToCompare(sel, { makeId: 4, modelId: 40 });
    sel = addToCompare(sel, { makeId: 5, modelId: 50 }); // 5e → ignoré (plafond 4)
    expect(sel).toHaveLength(MAX_COMPARE);
  });

  it('exclut la clé réservée modelId = 0 (EX-NAV-20)', () => {
    expect(addToCompare([], { makeId: 1, modelId: 0 })).toHaveLength(0);
  });

  it('retire un couple', () => {
    const sel = removeFromCompare([{ makeId: 1, modelId: 10 }, { makeId: 2, modelId: 20 }], { makeId: 1, modelId: 10 });
    expect(sel).toEqual([{ makeId: 2, modelId: 20 }]);
  });

  it('sérialise puis réanalyse un aller-retour', () => {
    const keys = [{ makeId: 16, modelId: 1174 }, { makeId: 9, modelId: 33 }];
    const serialized = serializeCompareParam(keys);
    expect(serialized).toBe('16.1174,9.33');
    expect(parseCompareParam(serialized).keys).toEqual(keys);
  });

  it('écrête l’URL au-delà de 4 couples et le signale', () => {
    const raw = '1.1,2.2,3.3,4.4,5.5,6.6';
    const parsed = parseCompareParam(raw);
    expect(parsed.keys).toHaveLength(MAX_COMPARE);
    expect(parsed.clipped).toBe(true);
  });

  it('ignore les tokens malformés et modelId = 0 dans l’URL', () => {
    const parsed = parseCompareParam('abc,1.0,2.,.3,7.70');
    expect(parsed.keys).toEqual([{ makeId: 7, modelId: 70 }]);
  });
});
