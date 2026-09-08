/**
 * Sonde de revue D5 — domaine du paramètre d'état d'interface `g<n>log` (`EX-SCR-16`/`EX-SCR-17`)
 * =================================================================================================
 * Écrite à la demande du fix-lead (mission `fix-state-2`, point 3) pour RÉPONDRE à `fix-screens-2`,
 * qui livre `EX-SCR-17` (bascule d'échelle log de l'axe des prix du SEUL graphe `G7`) : l'indice `7`
 * est-il encodable dans le paramètre d'URL qui porte `logHistograms` ?
 *
 * `EX-SCR-16` : « son état est mémorisé par graphe dans l'URL (paramètre `g<n>log=1`), pas
 * globalement ». Le paramètre est donc GÉNÉRATIF (un par graphe numéroté), pas une énumération
 * fermée : `url-codec.ts#graphLogParam(n)` le fabrique, `corrections.ts#GRAPH_LOG_RE` (`/^g\d+log$/`)
 * le reconnaît comme état d'interface — et NON comme « paramètre inconnu » (classe 5 d'`EX-NAV-21`) —
 * et `src/screens/distribution/url-state.ts#LOG_PARAM_RE` (`/^g(\d+)log$/`) le relit.
 *
 * Cette sonde établit le fait par exécution plutôt que par lecture : aucun élargissement de domaine
 * n'est nécessaire pour `G7`. Elle vaut aussi de garde-fou — un rétrécissement futur du domaine à
 * `{1,2,3}` casserait `EX-SCR-17` en silence.
 */
import { describe, expect, it } from 'vitest';

import { loadQuery } from '../../../src/state/corrections';
import { FILTER_DEFAULTS } from '../../../src/state/filter-registry';
import { graphLogParam, serializeQuery, type UiState } from '../../../src/state/url-codec';
import {
  readDistributionUiStateFromQuery,
  writeDistributionUiState,
  EMPTY_UI_STATE,
} from '../../../src/screens/distribution/url-state';

const LOG_INDICES = [1, 2, 3, 7] as const;

describe('R-D5-2.8-06 — `g<n>log` : `7` (G7, EX-SCR-17) est encodable comme 1, 2 et 3', () => {
  it('`graphLogParam` fabrique le nom de paramètre de n’importe quel graphe numéroté', () => {
    expect(LOG_INDICES.map(graphLogParam)).toEqual(['g1log', 'g2log', 'g3log', 'g7log']);
  });

  it('aller : les quatre indices sont sérialisés, en ordre alphabétique canonique (EX-NAV-9)', () => {
    const ui: UiState = Object.fromEntries(LOG_INDICES.map((n) => [graphLogParam(n), '1']));
    expect(serializeQuery({}, ui, { filterDefaults: FILTER_DEFAULTS })).toBe(
      'g1log=1&g2log=1&g3log=1&g7log=1',
    );
  });

  it('retour : `loadQuery` les reconnaît comme ÉTAT D’INTERFACE, sans aucune correction EX-NAV-21', () => {
    const loaded = loadQuery('?g1log=1&g2log=1&g3log=1&g7log=1');
    expect(loaded.corrections).toEqual([]);
    expect(loaded.selection).toEqual({});
    for (const n of LOG_INDICES) expect(loaded.uiState[graphLogParam(n)]).toBe('1');
  });

  it('`g7log` n’est PAS classé « paramètre inconnu » alors qu’un vrai inconnu l’est', () => {
    expect(loadQuery('?g7log=1').corrections).toEqual([]);
    const bogus = loadQuery('?glog7=1').corrections;
    expect(bogus).toHaveLength(1);
    expect(bogus[0]?.kind).toBe('UNKNOWN_PARAM');
  });

  it('l’écran B relit bien `7` dans `logHistograms` (contrat consommé par fix-screens-2)', () => {
    const state = readDistributionUiStateFromQuery('?g1log=1&g7log=1');
    expect([...state.logHistograms].sort((a, b) => a - b)).toEqual([1, 7]);
  });

  it('aller-retour complet D7 → D5 → D7, canonique et stable', () => {
    const pairs = writeDistributionUiState({ ...EMPTY_UI_STATE, logHistograms: new Set([7, 3, 1]) });
    const ui: UiState = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
    const query = serializeQuery({}, ui, { filterDefaults: FILTER_DEFAULTS });
    expect(query).toBe('g1log=1&g3log=1&g7log=1');
    const back = readDistributionUiStateFromQuery(`?${query}`);
    expect([...back.logHistograms].sort((a, b) => a - b)).toEqual([1, 3, 7]);
  });

  it('le défaut n’est jamais émis : aucune bascule active ⇒ aucun `g<n>log` dans l’URL (EX-NAV-8)', () => {
    expect(writeDistributionUiState(EMPTY_UI_STATE).filter(([k]) => /^g\d+log$/.test(k))).toEqual([]);
    expect(serializeQuery({}, {}, { filterDefaults: FILTER_DEFAULTS })).toBe('');
  });
});
