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

// `D-14` (`R3_DONNEE_PERSONNELLE`) : `zip`/`lat`/`lon` sont retirés du registre par fix-state QUEL
// QUE SOIT le contenu de `filters-scope.json` (fix-engine les retire de son côté, séparément,
// potentiellement pas encore fusionné dans ce worktree). Rend ces sondes robustes aux deux états.
const REMOVED_BY_D14: ReadonlySet<string> = new Set(['zip', 'lat', 'lon']);

describe('D5 — registre vs filters-scope.json (EX-NAV-5, §A.2.2)', () => {
  it('les filtres RETENUS du périmètre (moins ceux exclus par D-14) sont tous présents dans le registre', () => {
    const missing = scope.retenus
      .filter((f) => !REMOVED_BY_D14.has(f.param))
      .filter((f) => !FILTER_BY_PARAM.has(f.param))
      .map((f) => f.param);
    expect(missing).toEqual([]);
  });

  it('le registre n’ajoute aucun filtre hors périmètre', () => {
    const known = new Set(scope.retenus.map((f) => f.param));
    expect(FILTER_DEFS.filter((d) => !known.has(d.param)).map((d) => d.param)).toEqual([]);
    // 74 = filtres retenus (77, ou 74 si fix-engine a déjà fusionné) moins les 3 exclus par D-14
    // (compté sur le nombre EFFECTIVEMENT présent dans le fichier de scope de ce worktree).
    const scopeCountMinusD14 = scope.retenus.filter((f) => !REMOVED_BY_D14.has(f.param)).length;
    expect(FILTER_DEFS.length).toBe(scopeCountMinusD14);
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

  it('EX-SCR-83 mis à jour — 6 NON_EXPOSE, 3 filtres de classe D, 12 paramètres primaires (DR-052/D-12/D-15)', () => {
    // `atype` (toujours) + `powerType`/`hadAccident`/`countryType` (`DR-052`, valeurs injectées
    // vers la source, `EX-SRCH-18bis`/`ARB-30`) + `page`/`pageSize` (`D-12`/`DR-066`, paramètres
    // d'état d'interface). `PRIMARY_FILTER_DEFS` : 12, `countryType` retiré (`D-15`).
    expect(FILTER_DEFS.filter((d) => d.nonExposed === true).map((d) => d.param)).toEqual([
      'atype',
      'powertype',
      'ustate',
      'cy',
      'page',
      'size',
    ]);
    expect([...DISABLED_FILTER_IDS].length).toBe(3);
    expect(EXPOSED_FILTER_DEFS.length).toBe(68);
    expect(PRIMARY_FILTER_DEFS.length).toBe(12);
  });

  it('EX-SCR-82 — la classe T/R/D de chaque filtre retenu correspond à la table normative', () => {
    const table = ex82Classes();
    // 76 des 77 lignes RETENU sont extraites côté document (inchangé) ; `zip` portait « R
    // (dégradé) » et était vérifié à part — retiré du registre par `D-14`, il n'y a plus de
    // vérification directe à faire (la boucle `drift` ci-dessous l'ignore déjà : `def === undefined`).
    expect(table.size).toBe(76);
    expect(FILTER_BY_PARAM.get('zip')).toBeUndefined();
    // `D-12`/`DR-066` (`R-D7-20`) : `page`/`size` sont désormais « hors classes T/R » (paramètres
    // d'état d'interface) — la table `EX-SCR-82` du document, elle, les classait encore `T` avant
    // cette décision. Divergence assumée et documentée ici plutôt que de laisser dériver la sonde ;
    // fix-docs porte la mise à jour du document.
    const AMENDED_BY_D12: ReadonlySet<string> = new Set(['page', 'size']);
    const drift: string[] = [];
    for (const [param, cls] of table) {
      if (AMENDED_BY_D12.has(param)) continue;
      const def = FILTER_BY_PARAM.get(param);
      if (def === undefined) continue;
      const expected = cls === 'T / R' ? 'DYNAMIC_BODY' : cls;
      if (def.cls !== expected) drift.push(`${param}: registre=${def.cls} table=${expected}`);
    }
    expect(drift).toEqual([]);
  });
});
