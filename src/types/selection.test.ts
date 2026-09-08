import { describe, expect, it } from 'vitest';
import {
  computeSelectionHash,
  serializeSelection,
  localDatasetKey,
  selectionHash,
  FULL,
  EMPTY,
  compareCode,
  escapeFilterValue,
  unescapeFilterValue,
  type SelectionInput,
} from './selection';

/**
 * Codec `selectionHash` / `localDatasetKey` (EX-DATA-108, EX-SRCH-9ter/quinquies).
 * Critère de succès D2 #4.
 */
describe('codec de sélection', () => {
  it('produit une chaîne identique octet à octet pour une permutation des mêmes filtres', () => {
    const a: SelectionInput = {
      fuelCategory: ['B', 'D', 'E'],
      make: '9',
      priceTo: 20000,
    };
    // Mêmes filtres, ordre des clés ET des valeurs permuté.
    const b: SelectionInput = {
      priceTo: 20000,
      make: '9',
      fuelCategory: ['E', 'B', 'D'],
    };
    expect(serializeSelection(a)).toBe(serializeSelection(b));
    expect(computeSelectionHash(a).selectionHash).toBe(computeSelectionHash(b).selectionHash);
    // Non vide, forme <localDatasetKey>:<refineHash>.
    expect(computeSelectionHash(a).selectionHash).toMatch(/^[0-9a-f]{16}:[0-9a-f]{16}$/);
  });

  it('omet les filtres à leur valeur par défaut (EX-NAV-8)', () => {
    const withDefault: SelectionInput = { fuelCategory: 'B', sort: 'standard' };
    const defaults: SelectionInput = { sort: 'standard' };
    const canonical = serializeSelection(withDefault, { defaults });
    expect(canonical).toBe('fuelCategory=B');
    // Le hachage ignore le filtre au défaut : identique à la sélection sans lui.
    expect(selectionHash(withDefault, undefined, { defaults })).toBe(
      selectionHash({ fuelCategory: 'B' }),
    );
  });

  it('scinde T / R : localDatasetKey ne dépend que de la composante T', () => {
    const base: SelectionInput = { make: '9', mmmv: '9;322' };
    const refined: SelectionInput = { make: '9', mmmv: '9;322', fuelCategory: 'E', priceTo: 15000 };
    // Même composante T → même localDatasetKey, malgré des filtres R en plus.
    expect(localDatasetKey(refined)).toBe(localDatasetKey(base));
    // Mais selectionHash diffère (refineHash change).
    expect(selectionHash(refined)).not.toBe(selectionHash(base));
    const r = computeSelectionHash(refined);
    expect(r.localDatasetKey).toMatch(/^[0-9a-f]{16}$/);
    expect(r.refineHash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('rend FULL:EMPTY pour la sélection globalement vide', () => {
    const r = computeSelectionHash({});
    expect(r.localDatasetKey).toBe(FULL);
    expect(r.refineHash).toBe(EMPTY);
    expect(r.selectionHash).toBe('FULL:EMPTY');
  });

  it('rend localDatasetKey = FULL quand seuls des filtres R sont posés', () => {
    const r = computeSelectionHash({ fuelCategory: 'E' });
    expect(r.localDatasetKey).toBe(FULL);
    expect(r.refineHash).not.toBe(EMPTY);
    expect(r.selectionHash).toBe(`FULL:${r.refineHash}`);
  });

  it('trie les codes numériques numériquement et avant les codes alphabétiques', () => {
    expect(compareCode('2', '10')).toBeLessThan(0);
    expect(compareCode('10', 'B')).toBeLessThan(0);
    const s = serializeSelection({ x: ['10', '2', 'B', 'A'] });
    expect(s).toBe('x=2,10,A,B');
  });
});

/**
 * DR-019 / DR-106 — EX-DATA-108 : les trois séparateurs réservés sont échappés dans les VALEURS, et
 * le tri des filtres porte sur l'identifiant, pas sur la paire sérialisée.
 */
describe('codec de sélection — séparateurs réservés et ordre des identifiants', () => {
  it('deux sélections sémantiquement différentes ne partagent jamais une chaîne canonique', () => {
    expect(serializeSelection({ keyword: 'break', page: '2' })).not.toBe(
      serializeSelection({ keyword: 'break;page=2' }),
    );
    expect(selectionHash({ keyword: 'break', page: '2' })).not.toBe(selectionHash({ keyword: 'break;page=2' }));
  });

  it('une liste de deux valeurs se distingue d’une valeur unique portant une virgule', () => {
    expect(serializeSelection({ keyword: ['break', 'gps'] })).not.toBe(serializeSelection({ keyword: 'break,gps' }));
  });

  it('l’échappement est réversible, et le pour cent est échappé en premier', () => {
    for (const raw of ['break', 'a,b', 'a;b', 'a=b', '100%', '%2C', 'a%3Bb;c']) {
      expect(unescapeFilterValue(escapeFilterValue(raw))).toBe(raw);
    }
    expect(escapeFilterValue('%2C')).toBe('%252C');
  });

  it('les filtres sont triés par identifiant croissant, pas par paire sérialisée', () => {
    expect(serializeSelection({ a1: 'z', a: 'y' })).toBe('a=y;a1=z');
    expect(serializeSelection({ a: 'y', a1: 'z' })).toBe('a=y;a1=z');
  });
});
