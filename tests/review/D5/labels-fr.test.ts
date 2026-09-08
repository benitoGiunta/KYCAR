/**
 * Sonde de revue D5 — fr-BE et absence de code brut (`EX-NFR-28`/`29`/`30`), sur l'INTÉGRALITÉ des
 * domaines énumérés des 77 filtres, pas sur des exemples choisis.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  buildActiveFilterTokens,
  resolveOptionLabel,
  semanticsWarningTooltip,
} from '../../../src/components/filters/labels';
import { FILTER_DEFAULTS, FILTER_DEFS, GROUP_LABELS } from '../../../src/state/filter-registry';
import { serializeQuery } from '../../../src/state/url-codec';

const OPTS = { filterDefaults: FILTER_DEFAULTS } as const;

interface RawDomainValue {
  readonly code: string | number;
  readonly label_fr?: string | null;
}
interface RawFilter {
  readonly id: string;
  readonly domain?: readonly RawDomainValue[] | readonly number[] | null;
  readonly default?: unknown;
}
const rawFilters = (
  JSON.parse(readFileSync('data/reference/filters.json', 'utf8')) as { filters: readonly RawFilter[] }
).filters;
const rawById = new Map(rawFilters.map((f) => [f.id, f]));

describe('D5 — EX-NFR-30 : 0 code brut affiché', () => {
  it('chaque code de chaque domaine énuméré résout un libellé non vide', () => {
    let count = 0;
    const empty: string[] = [];
    for (const def of FILTER_DEFS) {
      for (const option of def.options ?? []) {
        count++;
        const label = resolveOptionLabel(def, option.code);
        if (label.trim().length === 0) empty.push(`${def.param}:${option.code}`);
      }
    }
    expect(count).toBeGreaterThanOrEqual(280);
    expect(empty).toEqual([]);
  });

  it('un code hors domaine échoue bruyamment plutôt que de retomber sur le code brut', () => {
    const fuel = FILTER_DEFS.find((d) => d.param === 'fuel');
    expect(fuel).toBeDefined();
    if (fuel === undefined) return;
    expect(() => resolveOptionLabel(fuel, 'ZZZ')).toThrow(/EX-NFR-30/);
  });

  it('EX-NFR-28 — libellés de filtres, de groupes et jetons entièrement en français', () => {
    for (const def of FILTER_DEFS) expect(def.label.trim().length).toBeGreaterThan(0);
    expect(Object.values(GROUP_LABELS).every((l) => l.trim().length > 0)).toBe(true);
    const tokens = buildActiveFilterTokens({ fuelType: ['B', 'D'], priceFrom: 5_000, vatReportable: '1' });
    expect(tokens.map((t) => t.text)).toEqual([
      '≥ 5 000 €',
      'TVA déductible / récupérable',
      'Essence, Diesel',
    ]);
  });

  it('EX-SCR-85 — les quatre sémantiques présumées portent leur infobulle', () => {
    const flagged = FILTER_DEFS.filter((d) => d.semanticsWarning !== undefined).map((d) => d.param);
    expect(flagged.sort()).toEqual(['emclass', 'ensticker', 'eq', 'prevownersid']);
    for (const def of FILTER_DEFS) {
      if (def.semanticsWarning === undefined) continue;
      expect(semanticsWarningTooltip(def)).toBe('Sémantique présumée, non vérifiée à la source');
    }
  });

  it('ADV-11 / A-03 — la sémantique ET de `eq` est déclarée présumée, jamais affirmée', () => {
    const eq = FILTER_DEFS.find((d) => d.param === 'eq');
    expect(eq?.semanticsWarning).toBe('EQ_AND_PRESUMED');
    expect(eq?.options?.length).toBe(136);
    // Le registre ne code AUCUN prédicat : la sémantique reste un paramètre du moteur (A-03).
    const query = serializeQuery({ equipment: (eq?.options ?? []).map((o) => o.code) }, {}, OPTS);
    expect(query.startsWith('eq=')).toBe(true);
    expect(query.split(',').length).toBe(136);
  });
});

describe('R-D5-09 — EX-NFR-30 : `prevownersid` affiche des libellés égaux à leur code', () => {
  it('R-D5-09 — aucun libellé d’option ne doit être identique à son code', () => {
    const sameAsCode: string[] = [];
    for (const def of FILTER_DEFS) {
      for (const option of def.options ?? []) {
        if (resolveOptionLabel(def, option.code) === option.code) {
          sameAsCode.push(`${def.param}:${option.code}`);
        }
      }
    }
    expect(sameAsCode).toEqual([]);
  });

  it('R-D5-09 — le jeton de filtre actif affiche alors un « 1 » nu, sans son libellé', () => {
    const tokens = buildActiveFilterTokens({ numberOfOwners: '1' });
    expect(tokens[0]?.text).not.toBe('1');
  });
});

describe('R-D5-10 — EX-NFR-29 : libellés forgés non marqués `[EXTRAPOLÉ]`', () => {
  it('R-D5-10 — les libellés de `zipr` sont forgés (domaine source sans libellé) et non marqués', () => {
    const radius = FILTER_DEFS.find((d) => d.param === 'zipr');
    const raw = rawById.get('radius');
    // Domaine source : une liste de nombres nus, aucun `label_fr` — les libellés « 10 km »… sont
    // forgés par le registre, donc relèvent de la règle (3) d'EX-NFR-29.
    expect(raw?.domain?.every((v) => typeof v === 'number')).toBe(true);
    const forged = (radius?.options ?? []).map((o) => o.label);
    expect(forged.every((l) => l.includes('[EXTRAPOLÉ]'))).toBe(true);
  });
});

describe('R-D5-11 — EX-NAV-8 : le défaut relevé d’`ensticker` est émis dans l’URL', () => {
  it('R-D5-11 — `ensticker=1` (défaut source, EX-SCR-82 #54 « code 1 non émis ») est sérialisé', () => {
    expect(rawById.get('emissionSticker')?.default).toBe(1);
    expect(serializeQuery({ emissionSticker: '1' }, {}, OPTS)).toBe('');
  });
});
