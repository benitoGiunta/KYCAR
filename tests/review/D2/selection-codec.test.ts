import { describe, expect, it } from 'vitest';
import {
  computeSelectionHash,
  serializeSelection,
  type SelectionInput,
} from '../../../src/types/selection';

/**
 * Sonde de revue D2 — codec `selectionHash` (`EX-DATA-108`, `EX-SRCH-9ter`/`quinquies`,
 * critère de succès D2 §7.1 n° 2 : « `selectionHash` d'une permutation de filtres est identique
 * octet à octet »).
 */

const hash = (s: SelectionInput): string => computeSelectionHash(s).selectionHash;

describe('D2 — canonisation invariante par permutation', () => {
  it('permutation des clés de filtres : chaîne et hachage identiques octet à octet', () => {
    const a: SelectionInput = { make: '9', fuelCategory: ['B', 'D'], priceTo: 20000, bodyType: '6' };
    const b: SelectionInput = { bodyType: '6', priceTo: 20000, fuelCategory: ['B', 'D'], make: '9' };
    expect(serializeSelection(a)).toBe(serializeSelection(b));
    expect(hash(a)).toBe(hash(b));
  });

  it('permutation des valeurs multiples d’un même filtre : hachage identique', () => {
    const a: SelectionInput = { equipment: ['12', '3', '108', '7'] };
    const b: SelectionInput = { equipment: ['108', '7', '3', '12'] };
    const c: SelectionInput = { equipment: ['7', '12', '108', '3'] };
    expect(serializeSelection(a)).toBe('equipment=3,7,12,108');
    expect(hash(a)).toBe(hash(b));
    expect(hash(b)).toBe(hash(c));
  });

  it('doublons dans les valeurs multiples : dédupliqués, hachage inchangé', () => {
    expect(hash({ equipment: ['3', '7', '3', '7'] })).toBe(hash({ equipment: ['7', '3'] }));
  });

  it('valeurs numériques et chaînes équivalentes : même hachage (« 10 » ≡ 10)', () => {
    expect(hash({ priceTo: 10 })).toBe(hash({ priceTo: '10' }));
    expect(hash({ equipment: [10, '2'] })).toBe(hash({ equipment: ['2', 10] }));
    expect(serializeSelection({ equipment: ['10', 2] })).toBe('equipment=2,10');
  });

  it('sélection globalement vide : FULL:EMPTY (EX-DATA-108)', () => {
    expect(hash({})).toBe('FULL:EMPTY');
  });

  it('même composante T, composante R différente : même localDatasetKey, selectionHash différent', () => {
    const base: SelectionInput = { make: '9' };
    const refined: SelectionInput = { make: '9', priceTo: 20000 };
    expect(computeSelectionHash(refined).localDatasetKey).toBe(computeSelectionHash(base).localDatasetKey);
    expect(hash(refined)).not.toBe(hash(base));
  });

  it('R-D2-03 — deux sélections DIFFÉRENTES ne partagent pas un selectionHash (séparateurs non échappés)', () => {
    // `keyword` (« Recherche par mots-clés », filtre retenu n° 7 de `filters-scope.json`, type
    // `text`) porte du texte libre. Les séparateurs réservés `;` `=` `,` n'étant pas échappés,
    // deux états de filtres SÉMANTIQUEMENT DIFFÉRENTS produisent la même chaîne canonique, donc
    // la même clé de cache et la même clé d'entité calculée.
    const deuxFiltres: SelectionInput = { keyword: 'break', page: '2' };
    const unSeulFiltre: SelectionInput = { keyword: 'break;page=2' };
    expect(serializeSelection(deuxFiltres)).not.toBe(serializeSelection(unSeulFiltre));
    expect(hash(deuxFiltres)).not.toBe(hash(unSeulFiltre));
  });

  it('R-D2-04 — une valeur multiple et une valeur unique porteuse d’une virgule sont distinguées', () => {
    expect(serializeSelection({ keyword: ['break', 'gps'] })).not.toBe(
      serializeSelection({ keyword: 'break,gps' }),
    );
  });

  it('R-D2-05 — les filtres sont triés par IDENTIFIANT croissant (EX-DATA-108), pas par paire', () => {
    // `canonicalize` trie les paires `id=valeur` en tant que chaînes. Comme `=` (0x3D) est
    // inférieur aux chiffres (0x30..0x39), l'ordre des paires diverge de l'ordre des
    // identifiants dès qu'un identifiant est le préfixe d'un autre suivi d'un chiffre.
    expect(serializeSelection({ a1: 'z', a: 'y' })).toBe('a=y;a1=z');
  });
});
