/**
 * Sonde de revue D5 — plafond d'URL et rechargement à grande échelle.
 *  - `EX-SCR-102` : 60 filtres posés → URL acceptée au rechargement.
 *  - `ADV-10` / `ARB-56` : les 77 filtres retenus à leurs valeurs les plus larges → longueur.
 *  - `EX-NAV-11` : refus explicite au-delà de 2 000 caractères, AVEC son message, sans troncature.
 */
import { describe, expect, it } from 'vitest';

import { FILTER_DEFAULTS, FILTER_DEFS } from '../../../src/state/filter-registry';
import type { FilterDef, FilterValue, SelectionState } from '../../../src/state/filter-types';
import { loadQuery } from '../../../src/state/corrections';
import {
  MAX_URL_LENGTH,
  URL_BUDGET_EXCEEDED_MESSAGE,
  assembleUrl,
  serializeQuery,
  wouldExceedBudget,
} from '../../../src/state/url-codec';

const OPTS = { filterDefaults: FILTER_DEFAULTS } as const;
const ORIGIN = 'https://kycar.app/marche';

/** Valeur non défaut la plus large et plausible pour un filtre (protocole d'`ARB-56`). */
function widestValue(def: FilterDef): FilterValue | undefined {
  const options = def.options;
  if (def.scopeType === 'enum_multi' && options !== undefined) return options.map((o) => o.code);
  if (def.scopeType === 'enum_single' && options !== undefined) {
    const last = options[options.length - 1];
    return last?.code;
  }
  if (def.scopeType === 'boolean') return def.booleanTrueCode ?? '1';
  if (def.scopeType === 'range_min') return def.numericDomain?.min ?? 100_000;
  if (def.scopeType === 'range_max') return def.numericDomain?.max ?? 999_999;
  if (def.scopeType === 'number') return def.numericDomain?.max ?? 999;
  if (def.scopeType === 'text' || def.scopeType === 'geo_text') return 'valeur-plausible-de-test';
  if (def.scopeType === 'structured_multi') return '16|1174';
  return undefined;
}

function widestSelection(): SelectionState {
  const out: Record<string, FilterValue> = {};
  for (const def of FILTER_DEFS) {
    if (def.cls === 'D' || def.nonExposed === true) continue;
    const v = widestValue(def);
    if (v !== undefined) out[def.id] = v;
  }
  return out;
}

describe('D5 — EX-SCR-102 : 60 filtres posés, URL rechargeable', () => {
  it('60 filtres tiennent sous le plafond et se rechargent sans correction ni perte', () => {
    const widest = widestSelection();
    const ids = Object.keys(widest).slice(0, 60);
    expect(ids.length).toBe(60);
    const selection: Record<string, FilterValue> = {};
    for (const id of ids) {
      const v = widest[id];
      if (v !== undefined) selection[id] = v;
    }

    const query = serializeQuery(selection, {}, OPTS);
    const url = assembleUrl(ORIGIN, query);
    expect(url.withinBudget).toBe(true);

    const loaded = loadQuery(query);
    expect(loaded.corrections).toEqual([]);
    expect(Object.keys(loaded.selection).length).toBe(60);
    expect(serializeQuery(loaded.selection, {}, OPTS)).toBe(query);
  });
});

describe('D5 — ADV-10 / ARB-56 : les 77 filtres retenus à leurs valeurs les plus larges', () => {
  it('la mesure réelle reste sous les 2 000 caractères (ARB-56 annonçait ≈ 1 720)', () => {
    const query = serializeQuery(widestSelection(), {}, OPTS);
    const url = assembleUrl(ORIGIN, query);
    // 65 filtres sérialisables (les 3 filtres D et les 6 `nonExposed` ne le sont pas — EX-SCR-57,
    // DR-052/D-12/D-14 : `location`/`lat`/`lon` retirés du registre, `powerType`/`hadAccident`/
    // `countryType`/`page`/`pageSize` marqués `nonExposed`).
    expect(query.split('&').length).toBe(65);
    expect(url.length).toBeLessThanOrEqual(MAX_URL_LENGTH);
    expect(url.length).toBeGreaterThan(1_500);
    // `eq` seul, à ses 136 valeurs : le poste dominant annoncé par EX-NAV-10 (« ≈ 540 »).
    const eqSegment = query.split('&').find((s) => s.startsWith('eq='));
    expect(eqSegment?.length).toBeGreaterThan(450);
  });

  it('EX-NAV-11 — un état plus large que le plafond est refusé, avec son message', () => {
    const selection: Record<string, FilterValue> = { ...widestSelection() };
    selection['keyword'] = 'a'.repeat(600);
    expect(wouldExceedBudget(ORIGIN, selection, {}, OPTS)).toBe(true);
    expect(URL_BUDGET_EXCEEDED_MESSAGE).toBe(
      "limite d'URL atteinte, retirez un filtre pour en ajouter un autre",
    );
    // Aucune troncature : la sérialisation refusée n'est jamais raccourcie d'autorité.
    const query = serializeQuery(selection, {}, OPTS);
    expect(assembleUrl(ORIGIN, query).length).toBeGreaterThan(MAX_URL_LENGTH);
    expect(query).toContain(`kwd=${'a'.repeat(600)}`);
  });

  it('EX-NAV-10bis — les paramètres d’état d’interface comptent dans le plafond', () => {
    const query = serializeQuery({}, { m: ['16-1174', '9-11'], sort: 'median', g4v: 'b' });
    expect(query).toBe('g4v=b&m=16-1174,9-11&sort=median');
    expect(assembleUrl(ORIGIN, query).length).toBe(ORIGIN.length + 1 + query.length);
  });
});
