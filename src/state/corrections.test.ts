import { describe, expect, it } from 'vitest';
import { loadQuery } from './corrections';

/**
 * `EX-NAV-21` : cinq classes de correction au chargement d'une URL. Chaque classe est testée
 * isolément, puis une combinaison réaliste (plusieurs corrections dans une seule URL).
 */
describe('loadQuery — cinq classes de correction (EX-NAV-21)', () => {
  it('classe 1 — code énuméré absent du vocabulaire : valeur retirée, les autres conservées', () => {
    const { selection, corrections } = loadQuery('fuel=B,Z,D');
    expect(selection.fuelType).toEqual(['B', 'D']);
    expect(corrections).toHaveLength(1);
    expect(corrections[0]?.kind).toBe('UNKNOWN_ENUM_CODE');
    expect(corrections[0]?.param).toBe('fuel');
    expect(corrections[0]?.message).toContain('fuel');
  });

  it('classe 1 — filtre enum_single devenu vide (code totalement inconnu) est retiré', () => {
    const { selection, corrections } = loadQuery('custtype=Z');
    expect(selection.sellerType).toBeUndefined();
    expect(corrections[0]?.kind).toBe('UNKNOWN_ENUM_CODE');
  });

  it('classe 1 — enum_multi entièrement inconnu retire le filtre entier', () => {
    const { selection, corrections } = loadQuery('fuel=Z,Y');
    expect(selection.fuelType).toBeUndefined();
    expect(corrections[0]?.message).toContain('aucune');
  });

  it('classe 2 — borne numérique hors domaine, écrêtée', () => {
    const { selection, corrections } = loadQuery('modelyearfrom=1850');
    expect(selection.dateOfModelYearFrom).toBe(1900); // domaine min=1900
    expect(corrections[0]?.kind).toBe('NUMERIC_OUT_OF_DOMAIN');
    expect(corrections[0]?.message).toContain('1900');
  });

  it('classe 2 — borne haute écrêtée à son maximum', () => {
    const { selection } = loadQuery('modelyearto=3000');
    expect(selection.dateOfModelYearTo).toBe(2027);
  });

  it('classe 3 — borne non numérique retirée', () => {
    const { selection, corrections } = loadQuery('pricefrom=abc');
    expect(selection.priceFrom).toBeUndefined();
    expect(corrections[0]?.kind).toBe('NON_NUMERIC_OR_EMPTY');
  });

  it('classe 3 — borne vide retirée (pricefrom=)', () => {
    const { selection, corrections } = loadQuery('pricefrom=');
    expect(selection.priceFrom).toBeUndefined();
    expect(corrections[0]?.kind).toBe('NON_NUMERIC_OR_EMPTY');
  });

  it('classe 4 — intervalle inversé permuté (EX-NAV-22), jamais refusé au chargement', () => {
    const { selection, corrections } = loadQuery('pricefrom=20000&priceto=5000');
    expect(selection.priceFrom).toBe(5000);
    expect(selection.priceTo).toBe(20000);
    expect(corrections[0]?.kind).toBe('INVERTED_INTERVAL');
    expect(corrections[0]?.message).toContain('5000');
    expect(corrections[0]?.message).toContain('20000');
  });

  it('classe 4 — un intervalle correctement ordonné ne produit aucune correction', () => {
    const { corrections } = loadQuery('pricefrom=5000&priceto=20000');
    expect(corrections).toHaveLength(0);
  });

  it('classe 5 — paramètre inconnu du catalogue, ignoré et retiré', () => {
    const { selection, corrections, uiState } = loadQuery('search_id=abc123&fuel=B');
    expect(selection.fuelType).toEqual(['B']);
    expect(uiState.search_id).toBeUndefined();
    expect(corrections).toHaveLength(1);
    expect(corrections[0]?.kind).toBe('UNKNOWN_PARAM');
    expect(corrections[0]?.param).toBe('search_id');
  });

  it('booléen : seul le code vrai est retenu, toute autre valeur est une classe 1', () => {
    const ok = loadQuery('vatded=1');
    expect(ok.selection.vatReportable).toBe('1');
    const bad = loadQuery('vatded=oui');
    expect(bad.selection.vatReportable).toBeUndefined();
    expect(bad.corrections[0]?.kind).toBe('UNKNOWN_ENUM_CODE');
  });

  it('combine plusieurs corrections dans une seule URL, jamais silencieuses', () => {
    const { selection, corrections } = loadQuery(
      'fuel=B,Z&pricefrom=20000&priceto=5000&kmfrom=abc&inconnu=1',
    );
    expect(selection.fuelType).toEqual(['B']);
    expect(selection.priceFrom).toBe(5000);
    expect(selection.priceTo).toBe(20000);
    expect(selection.mileageFrom).toBeUndefined();
    expect(corrections).toHaveLength(4);
    const kinds = corrections.map((c) => c.kind).sort();
    expect(kinds).toEqual(
      ['INVERTED_INTERVAL', 'NON_NUMERIC_OR_EMPTY', 'UNKNOWN_ENUM_CODE', 'UNKNOWN_PARAM'].sort(),
    );
  });

  it('n’applique aucune correction sur une requête valide', () => {
    const { corrections } = loadQuery('fuel=B,D&pricefrom=5000&priceto=20000&custtype=P');
    expect(corrections).toHaveLength(0);
  });
});

describe('loadQuery — collision de nom "sort" (filtre écran D vs état d’interface écran A)', () => {
  it('reconnaît "sort=price" comme le filtre sortTypes (écran D)', () => {
    const { selection, uiState } = loadQuery('sort=price');
    expect(selection.sortTypes).toBe('price');
    expect(uiState.sort).toBeUndefined();
  });

  it('reconnaît "sort=median" comme l’état d’interface (écran A)', () => {
    const { selection, uiState } = loadQuery('sort=median');
    expect(uiState.sort).toBe('median');
    expect(selection.sortTypes).toBeUndefined();
  });

  it('un "sort" hors des deux domaines est une correction, pas un crash', () => {
    const { corrections, selection, uiState } = loadQuery('sort=n_importe_quoi');
    expect(selection.sortTypes).toBeUndefined();
    expect(uiState.sort).toBeUndefined();
    expect(corrections[0]?.kind).toBe('UNKNOWN_ENUM_CODE');
  });
});

describe('loadQuery — paramètres d’état d’interface (EX-NAV-10bis)', () => {
  it('ne classe jamais m/grp/mk/selx/sely/g<n>log comme "paramètre inconnu"', () => {
    const { uiState, corrections } = loadQuery('m=9-322,15-88&grp=prix,motorisation&mk=9&g1log=1&selx=0-50000&sely=2010-2024');
    expect(corrections).toHaveLength(0);
    expect(uiState.m).toEqual(['9-322', '15-88']);
    expect(uiState.grp).toEqual(['prix', 'motorisation']);
    expect(uiState.g1log).toBe('1');
    expect(uiState.selx).toBe('0-50000');
  });

  it('g4v hors domaine {a,b} est corrigé', () => {
    const good = loadQuery('g4v=b');
    expect(good.uiState.g4v).toBe('b');
    const bad = loadQuery('g4v=c');
    expect(bad.uiState.g4v).toBeUndefined();
    expect(bad.corrections[0]?.param).toBe('g4v');
  });
});
