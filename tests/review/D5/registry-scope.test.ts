/**
 * Sonde de revue D5 — couverture du registre de filtres.
 *
 * Confronte `src/state/filter-registry.ts` aux deux sources normatives :
 *  - `data/reference/filters-scope.json` (77 filtres RETENUS, renvoi normatif d'`EX-NAV-5`/§A.2.2) ;
 *  - la table d'affectation `EX-SCR-82` de `docs/requirements/draft-screens.md` (classe T/R/D).
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  DISABLED_FILTER_IDS,
  EXPOSED_FILTER_DEFS,
  FILTER_BY_PARAM,
  FILTER_DEFS,
  PRIMARY_FILTER_DEFS,
} from '../../../src/state/filter-registry';

interface ScopeEntry {
  readonly id: string;
  readonly param: string;
  readonly label: string;
  readonly type: string;
}
interface Scope {
  readonly totalCatalogue: number;
  readonly totalRetenus: number;
  readonly retenus: readonly ScopeEntry[];
}

const scope = JSON.parse(readFileSync('data/reference/filters-scope.json', 'utf8')) as Scope;

/** Classe déclarée par la table `EX-SCR-82` (colonne 6), extraite du document normatif. */
function ex82Classes(): Map<string, string> {
  const doc = readFileSync('docs/requirements/draft-screens.md', 'utf8');
  const out = new Map<string, string>();
  const row = /^\|\s*\d+\s*\|\s*`([a-zA-Z_0-9]+)`\s*\|[^|]*\|\s*`(RETENU|EXCLU)`\s*\|[^|]*\|\s*\*{0,2}([TRD]|T \/ R)\*{0,2}\s*\|/;
  for (const line of doc.split('\n')) {
    const m = row.exec(line.trim());
    if (m === null) continue;
    const [, param, perimetre, cls] = m;
    if (param === undefined || cls === undefined || perimetre !== 'RETENU') continue;
    out.set(param, cls);
  }
  return out;
}

describe('D5 — registre vs filters-scope.json (EX-NAV-5, §A.2.2)', () => {
  it('les 77 filtres RETENUS du périmètre sont tous présents dans le registre', () => {
    expect(scope.totalRetenus).toBe(77);
    const missing = scope.retenus.filter((f) => !FILTER_BY_PARAM.has(f.param)).map((f) => f.param);
    expect(missing).toEqual([]);
  });

  it('le registre n’ajoute aucun filtre hors périmètre', () => {
    const known = new Set(scope.retenus.map((f) => f.param));
    expect(FILTER_DEFS.filter((d) => !known.has(d.param)).map((d) => d.param)).toEqual([]);
    expect(FILTER_DEFS.length).toBe(77);
  });

  it('id, param et type de portée sont repris sans dérive', () => {
    const drift: string[] = [];
    for (const entry of scope.retenus) {
      const def = FILTER_BY_PARAM.get(entry.param);
      if (def === undefined) continue;
      if (def.id !== entry.id) drift.push(`${entry.param}: id ${def.id} ≠ ${entry.id}`);
      if (def.scopeType !== entry.type) drift.push(`${entry.param}: type ${def.scopeType} ≠ ${entry.type}`);
    }
    expect(drift).toEqual([]);
  });

  it('EX-SCR-83 — 1 NON_EXPOSE (atype), 3 filtres de classe D, 13 paramètres primaires', () => {
    expect(FILTER_DEFS.filter((d) => d.nonExposed === true).map((d) => d.param)).toEqual(['atype']);
    expect([...DISABLED_FILTER_IDS].length).toBe(3);
    expect(EXPOSED_FILTER_DEFS.length).toBe(76);
    expect(PRIMARY_FILTER_DEFS.length).toBe(13);
  });

  it('EX-SCR-82 — la classe T/R/D de chaque filtre retenu correspond à la table normative', () => {
    const table = ex82Classes();
    // 76 des 77 lignes RETENU sont extraites ; `zip` porte « R (dégradé) » et est vérifié à part.
    expect(table.size).toBe(76);
    expect(FILTER_BY_PARAM.get('zip')?.cls).toBe('R');
    const drift: string[] = [];
    for (const [param, cls] of table) {
      const def = FILTER_BY_PARAM.get(param);
      if (def === undefined) continue;
      const expected = cls === 'T / R' ? 'DYNAMIC_BODY' : cls;
      if (def.cls !== expected) drift.push(`${param}: registre=${def.cls} table=${expected}`);
    }
    expect(drift).toEqual([]);
  });
});
