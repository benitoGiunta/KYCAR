/**
 * KYCAR — Tests de l'état d'interface d'URL de l'écran B (lot D7, EX-NAV-10bis/8/9)
 */

import { describe, it, expect } from 'vitest';
import {
  readDistributionUiState,
  writeDistributionUiState,
  effectiveG4Variant,
  toggleLogHistogram,
  EMPTY_UI_STATE,
  G4_STACK_DEFAULT_MAX,
} from './url-state';

/** Adaptateur minimal type `URLSearchParams`. */
function params(map: Record<string, string>): URLSearchParams {
  return new URLSearchParams(map);
}

describe('lecture de l’état d’interface (EX-NAV-10bis)', () => {
  it('lit g4v, g<n>log, selx, sely', () => {
    const s = readDistributionUiState(params({ g4v: 'scatter', g1log: '1', g3log: '1', selx: '1000,5000', sely: '2010,2018' }));
    expect(s.g4Variant).toBe('scatter');
    expect([...s.logHistograms].sort()).toEqual([1, 3]);
    expect(s.brushX).toEqual({ from: 1000, to: 5000 });
    expect(s.brushY).toEqual({ from: 2010, to: 2018 });
  });

  it('ignore une variante inconnue et des bornes mal formées', () => {
    const s = readDistributionUiState(params({ g4v: 'wobble', selx: 'x,y' }));
    expect(s.g4Variant).toBeUndefined();
    expect(s.brushX).toBeNull();
  });

  it('réordonne les bornes inversées', () => {
    const s = readDistributionUiState(params({ selx: '5000,1000' }));
    expect(s.brushX).toEqual({ from: 1000, to: 5000 });
  });
});

describe('sérialisation canonique (EX-NAV-8/9)', () => {
  it('n’émet jamais un défaut et trie par clé', () => {
    const pairs = writeDistributionUiState({
      g4Variant: 'stack',
      logHistograms: new Set([3, 1]),
      brushX: { from: 1000, to: 5000 },
      brushY: null,
    });
    expect(pairs).toEqual([
      ['g1log', '1'],
      ['g3log', '1'],
      ['g4v', 'stack'],
      ['selx', '1000,5000'],
    ]);
  });

  it('un état vide ne produit aucune paire', () => {
    expect(writeDistributionUiState(EMPTY_UI_STATE)).toEqual([]);
  });

  it('aller-retour lecture→écriture→lecture stable', () => {
    const start = params({ g2log: '1', g4v: 'scatter', sely: '3000,9000' });
    const s1 = readDistributionUiState(start);
    const written = new URLSearchParams(writeDistributionUiState(s1) as [string, string][]);
    const s2 = readDistributionUiState(written);
    expect(s2.g4Variant).toBe(s1.g4Variant);
    expect([...s2.logHistograms]).toEqual([...s1.logHistograms]);
    expect(s2.brushY).toEqual(s1.brushY);
  });
});

describe('variante effective de G4 (EX-SCR-151/152)', () => {
  it('défaut nuée empilée jusqu’à 400, nuage au-delà', () => {
    expect(effectiveG4Variant(EMPTY_UI_STATE, G4_STACK_DEFAULT_MAX)).toBe('stack');
    expect(effectiveG4Variant(EMPTY_UI_STATE, G4_STACK_DEFAULT_MAX + 1)).toBe('scatter');
  });
  it('l’URL prime sur le défaut', () => {
    expect(effectiveG4Variant({ ...EMPTY_UI_STATE, g4Variant: 'stack' }, 100000)).toBe('stack');
  });
});

describe('bascule log immuable', () => {
  it('ajoute puis retire', () => {
    const a = toggleLogHistogram(EMPTY_UI_STATE, 2);
    expect(a.logHistograms.has(2)).toBe(true);
    const b = toggleLogHistogram(a, 2);
    expect(b.logHistograms.has(2)).toBe(false);
  });
});
