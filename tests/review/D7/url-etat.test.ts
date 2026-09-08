/**
 * KYCAR — Sondes de revue D7 · état d'interface de l'écran B dans l'URL (EX-NAV-8/9/10bis/18, §5.1)
 * =================================================================================================
 * Vérification n°11 de la mission : les paramètres de l'écran B (projection `g4v`, brossage
 * `selx`/`sely`, pagination de l'écran D) sont-ils conformes à la scission T / R de §5.1 et au
 * vocabulaire du codec canonique de D5 ?
 *
 * La sonde confronte le module D7 (`url-state.ts`) au codec et à la table de corrections de D5
 * (`src/state/*`), c'est-à-dire aux deux moitiés du même contrat d'URL.
 */

import { describe, it, expect } from 'vitest';
import {
  readDistributionUiState,
  writeDistributionUiState,
  effectiveG4Variant,
  toggleLogHistogram,
  EMPTY_UI_STATE,
  G4_STACK_DEFAULT_MAX,
  type DistributionUiState,
} from '../../../src/screens/distribution/url-state';
import { loadQuery } from '../../../src/state/corrections';
import { UI_STATE_PARAMS } from '../../../src/state/url-codec';
import { FILTER_BY_ID } from '../../../src/state/filter-registry';

describe('D7 · paramètres d’état d’interface (EX-NAV-10bis)', () => {
  it('EX-NAV-8 : aucun défaut n’est émis ; EX-NAV-9 : les clés sortent en ordre alphabétique', () => {
    expect(writeDistributionUiState(EMPTY_UI_STATE)).toEqual([]);
    const state: DistributionUiState = {
      g4Variant: 'scatter',
      logHistograms: new Set([3, 1]),
      brushX: { from: 8000, to: 20000 },
      brushY: { from: 2015, to: 2022 },
    };
    const pairs = writeDistributionUiState(state).map(([k]) => k);
    expect(pairs).toEqual([...pairs].sort());
    expect(pairs).toEqual(['g1log', 'g3log', 'g4v', 'selx', 'sely']);
  });

  it('EX-NAV-18 : aller-retour état → URL → état pour la projection, le log et le brossage', () => {
    const state: DistributionUiState = {
      g4Variant: 'stack',
      logHistograms: new Set([2]),
      brushX: { from: 1, to: 2 },
      brushY: { from: 3, to: 4 },
    };
    const params = new URLSearchParams(writeDistributionUiState(state) as [string, string][]);
    const back = readDistributionUiState(params);
    expect(back.g4Variant).toBe('stack');
    expect([...back.logHistograms]).toEqual([2]);
    expect(back.brushX).toEqual({ from: 1, to: 2 });
    expect(back.brushY).toEqual({ from: 3, to: 4 });
  });

  it('bornes inversées : `selx` est normalisé en `from ≤ to`, une valeur illisible est ignorée', () => {
    // D-31 : littéral adapté de `900,100` à `900-100` (D-11/D-12, DR-065 — le format canonique de
    // `selx`/`sely` est `lo-hi`, pas `from,to` ; l'assertion normative testée ici — bornes normalisées
    // en `from ≤ to` — est inchangée).
    const p = new URLSearchParams([['selx', '900-100'], ['sely', 'abc']]);
    const s = readDistributionUiState(p);
    expect(s.brushX).toEqual({ from: 100, to: 900 });
    expect(s.brushY).toBeNull();
  });

  it('§5.1 : `g4v`, `selx`, `sely`, `g<n>log` sont des paramètres d’ÉTAT D’INTERFACE, ni T ni R', () => {
    const uiNames = UI_STATE_PARAMS.map((p) => p.param);
    for (const name of ['g4v', 'selx', 'sely']) expect(uiNames).toContain(name);
    // Aucun d'eux n'est un filtre : ils n'entrent donc ni dans `localDatasetKey` (T) ni dans
    // `refineHash` (R) — conforme à EX-SCR-184 (« la sélection n'est pas un filtre »).
    for (const id of ['g4v', 'selx', 'sely']) expect(FILTER_BY_ID.has(id)).toBe(false);
  });

  it('EX-SCR-152 : la variante par défaut bascule à 400 annonces, l’URL prime toujours', () => {
    expect(G4_STACK_DEFAULT_MAX).toBe(400);
    expect(effectiveG4Variant(EMPTY_UI_STATE, 400)).toBe('stack');
    expect(effectiveG4Variant(EMPTY_UI_STATE, 401)).toBe('scatter');
    expect(effectiveG4Variant({ ...EMPTY_UI_STATE, g4Variant: 'stack' }, 100000)).toBe('stack');
    expect([...toggleLogHistogram(EMPTY_UI_STATE, 1).logHistograms]).toEqual([1]);
  });
});

describe('D7 ↔ D5 · cohérence du contrat d’URL', () => {
  it('R-D7-18 — `g4v` : D7 écrit `stack`/`scatter`, la table de corrections de D5 n’admet que `a`/`b`', () => {
    const written = writeDistributionUiState({ ...EMPTY_UI_STATE, g4Variant: 'stack' });
    expect(written).toEqual([['g4v', 'stack']]);
    const loaded = loadQuery('g4v=stack');
    expect(loaded.corrections).toHaveLength(0); // aucune correction ne devrait être levée
    expect(loaded.uiState['g4v']).toBe('stack'); // et la valeur devrait survivre au chargement
  });

  it('R-D7-19 — `selx` : D7 sérialise `from,to` alors que D5 véhicule `lo-hi` ; le brossage ne survit pas au rechargement', () => {
    const fromD5 = loadQuery('selx=0-50000&sely=2010-2024');
    expect(fromD5.corrections).toHaveLength(0);
    const params = new URLSearchParams(Object.entries(fromD5.uiState).map(([k, v]) => [k, String(v)]));
    const back = readDistributionUiState(params);
    expect(back.brushX).not.toBeNull(); // le brossage d'une URL partagée doit être relu
  });

  it('R-D7-20 — pagination de l’écran D : absente de l’URL côté D7, et déclarée filtre de classe T côté D5', () => {
    const pageFilter = FILTER_BY_ID.get('page');
    expect(pageFilter).toBeDefined();
    // Un numéro de page ne détermine pas le JEU DE DONNÉES local (§5.1) : le classer `T` invalide le
    // cache `localDatasetKey` et provoque un `fetchListingColumns` par page.
    expect(pageFilter!.cls).not.toBe('T');
    // Et l'écran D ne publie aucun paramètre de page : l'état n'est pas représentable dans l'URL.
    const keys = writeDistributionUiState({ ...EMPTY_UI_STATE }).map(([k]) => k);
    expect(keys).toContain('page');
  });

  it('R-D7-26 — EX-SCR-202 : le paramètre `sel` (restriction d’affichage de l’écran D) n’est lu par aucun module', () => {
    // `sel` est le paramètre normatif de l'écran D ; D7 ne publie que `selx`/`sely` (bornes d'axes)
    // et l'écran D reçoit ses lignes par prop, sans jamais consulter l'URL.
    const loaded = loadQuery('sel=8000-15000');
    expect(loaded.corrections).toHaveLength(0);
    expect(Object.keys(loaded.uiState)).toContain('sel');
  });
});
