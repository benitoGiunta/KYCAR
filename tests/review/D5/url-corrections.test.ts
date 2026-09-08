/**
 * Sonde de revue D5 — table de corrections d'URL au chargement (`EX-NAV-21`, `EX-NAV-22`, `A-04`)
 * et cas pathologique `ADV-01` (lien tronqué par un transport externe, décision `ARB-12`).
 */
import { describe, expect, it } from 'vitest';

import { buildActiveFilterTokens } from '../../../src/components/filters/labels';
import { loadQuery } from '../../../src/state/corrections';
import { FILTER_DEFAULTS } from '../../../src/state/filter-registry';
import { serializeQuery } from '../../../src/state/url-codec';

const OPTS = { filterDefaults: FILTER_DEFAULTS } as const;

describe('D5 — EX-NAV-21 : les cinq classes de correction, chacune signalée', () => {
  it('classe 1 — code énuméré inconnu retiré, les autres valeurs du filtre conservées', () => {
    const loaded = loadQuery('fuel=B,Z,D');
    expect(loaded.selection['fuelType']).toEqual(['B', 'D']);
    expect(loaded.corrections.map((c) => c.kind)).toEqual(['UNKNOWN_ENUM_CODE']);
    expect(loaded.corrections[0]?.message).toBe(
      'Paramètre « fuel » corrigé : valeur inconnue retirée, valeur retenue B,D',
    );
  });

  it('classe 1 — le filtre devenu vide est retiré', () => {
    const loaded = loadQuery('fuel=Z');
    expect(loaded.selection).toEqual({});
    expect(loaded.corrections).toHaveLength(1);
  });

  it('classe 2 — borne hors domaine écrêtée à la borne relevée', () => {
    const loaded = loadQuery('pricefrom=1');
    expect(loaded.selection['priceFrom']).toBe(500);
    expect(loaded.corrections[0]?.message).toBe(
      'Paramètre « pricefrom » corrigé : borne ramenée au domaine, valeur retenue 500',
    );
  });

  it('classe 3 — borne non numérique ou vide : paramètre retiré', () => {
    for (const q of ['pricefrom=abc', 'pricefrom=']) {
      const loaded = loadQuery(q);
      expect(loaded.selection).toEqual({});
      expect(loaded.corrections.map((c) => c.kind)).toEqual(['NON_NUMERIC_OR_EMPTY']);
    }
  });

  it('classe 4 — intervalle inversé : bornes permutées (EX-NAV-22), jamais refusées', () => {
    const loaded = loadQuery('pricefrom=30000&priceto=20000');
    expect(loaded.selection['priceFrom']).toBe(20_000);
    expect(loaded.selection['priceTo']).toBe(30_000);
    expect(loaded.corrections.map((c) => c.message)).toEqual([
      'Paramètre « pricefrom » corrigé : bornes interverties, intervalle retenu 20000 – 30000',
    ]);
  });

  it('classe 5 — paramètre inconnu ignoré et retiré, le reste s’applique', () => {
    const loaded = loadQuery('foo=1&fuel=B');
    expect(loaded.selection).toEqual({ fuelType: ['B'] });
    expect(loaded.corrections.map((c) => c.kind)).toEqual(['UNKNOWN_PARAM']);
  });

  it('la casse est significative : un nom de paramètre majuscule est classé « inconnu »', () => {
    expect(loadQuery('FUEL=B').corrections.map((c) => c.kind)).toEqual(['UNKNOWN_PARAM']);
    expect(loadQuery('fuel=b').corrections.map((c) => c.kind)).toEqual(['UNKNOWN_ENUM_CODE']);
  });

  it('tous les messages de correction sont en français et nomment le paramètre', () => {
    const queries = ['fuel=Z', 'pricefrom=1', 'pricefrom=abc', 'pricefrom=30000&priceto=20000', 'foo=1'];
    for (const q of queries) {
      for (const c of loadQuery(q).corrections) {
        expect(c.message).toMatch(/^Paramètre « .+ » corrigé : /);
        expect(c.message).toContain(c.param);
      }
    }
  });
});

describe('D5 — ADV-01 / ARB-12 : lien tronqué au milieu d’un paramètre numérique', () => {
  it('ADV-01 — une valeur tronquée mais dans le domaine est acceptée sans signalement (limite déclarée)', () => {
    // `priceto=25000` tronqué en `priceto=2500` : valeur parfaitement valide du domaine.
    const loaded = loadQuery('pricefrom=5000&priceto=2500');
    // Aucune somme de contrôle, aucun marqueur de fin : décision ARB-12 / dette D-2.
    // Seule la permutation EX-NAV-22 se déclenche, parce que l'intervalle devient inversé.
    expect(loaded.corrections.map((c) => c.kind)).toEqual(['INVERTED_INTERVAL']);
  });

  it('ADV-01 — une troncature qui ne renverse pas l’intervalle passe totalement inaperçue', () => {
    const loaded = loadQuery('pricefrom=500&priceto=25000');
    expect(loaded.corrections).toEqual([]);
    expect(loaded.selection['priceFrom']).toBe(500);
  });

  it('ADV-01 — la contre-mesure exigée (jeton portant le LIBELLÉ et la VALEUR, EX-SCR-75) est en place', () => {
    // `DR-056`/`ARB-12` : le jeton porte désormais TOUJOURS le libellé du filtre en plus de sa
    // valeur — contre-mesure renforcée du lien tronqué (« Prix : … », jamais la valeur nue).
    const tokens = buildActiveFilterTokens(loadQuery('pricefrom=500&priceto=25000').selection);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.text.startsWith('Prix : ')).toBe(true);
    expect(tokens[0]?.text).toContain('500');
    expect(tokens[0]?.text).toContain('25');
    expect(tokens[0]?.text).toContain('€');
  });

  it('ADV-01 — aucun paramètre de somme de contrôle ni de longueur n’est ajouté à l’URL', () => {
    const query = serializeQuery({ priceFrom: 5_000, priceTo: 25_000 }, {}, OPTS);
    expect(query).toBe('pricefrom=5000&priceto=25000');
  });
});

describe('R-D5-03 — paramètre dupliqué : dernière occurrence gagne, silencieusement', () => {
  it('R-D5-03 — `fuel=B&fuel=D` perd la première valeur sans ET-URL-CORRIGEE', () => {
    const loaded = loadQuery('fuel=B&fuel=D');
    // Comportement obtenu : `{ fuelType: ['D'] }`, zéro correction — la valeur `B` disparaît de
    // l'URL canonique réécrite par `replaceState` sans que rien ne le signale, ce qu'`EX-NAV-21`
    // (« aucune correction d'URL n'est silencieuse », A-04) interdit.
    expect(loaded.corrections.length).toBeGreaterThan(0);
  });

  it('R-D5-03 — `pricefrom=5000&pricefrom=9000` réécrit la valeur sans aucun signalement', () => {
    const loaded = loadQuery('pricefrom=5000&pricefrom=9000');
    expect(loaded.corrections.length).toBeGreaterThan(0);
  });
});

describe('R-D5-16 — séquence `%` invalide : acceptée telle quelle, sans signalement', () => {
  it('R-D5-16 — `kwd=abc%` entre dans l’état et l’URL canonique est réécrite en `abc%25`', () => {
    const loaded = loadQuery('kwd=abc%');
    expect(loaded.corrections.length).toBeGreaterThan(0);
  });
});
