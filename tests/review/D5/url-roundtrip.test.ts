/**
 * Sonde de revue D5 — aller-retour état → URL → état, au caractère près, sur les 77 filtres.
 *
 * Critère de succès spécifique du lot (`ARCHITECTURE.md` §7.1 D5) : « aller-retour état → URL →
 * état égal au caractère près pour les 77 filtres ». La sonde balaie CHAQUE filtre du périmètre :
 * chaque valeur du domaine pour les énumérations, min seul / max seul / les deux / bornes extrêmes
 * pour les intervalles, et les cas d'échappement pour les champs texte et structurés.
 */
import { describe, expect, it } from 'vitest';

import { FILTER_BY_ID, FILTER_DEFAULTS, FILTER_DEFS } from '../../../src/state/filter-registry';
import type { FilterDef, FilterValue, SelectionState } from '../../../src/state/filter-types';
import { loadQuery } from '../../../src/state/corrections';
import { serializeQuery } from '../../../src/state/url-codec';

const OPTS = { filterDefaults: FILTER_DEFAULTS } as const;

/** Un cas de valeur à éprouver pour un filtre donné. */
interface Case {
  readonly label: string;
  readonly value: FilterValue;
}

function casesFor(def: FilterDef): readonly Case[] {
  const out: Case[] = [];
  const options = def.options;
  switch (def.scopeType) {
    case 'enum_single':
      for (const o of options ?? []) out.push({ label: `code=${o.code}`, value: o.code });
      break;
    case 'enum_multi':
      for (const o of options ?? []) out.push({ label: `code=${o.code}`, value: [o.code] });
      if (options !== undefined && options.length > 1) {
        out.push({ label: 'domaine complet', value: options.map((o) => o.code) });
        out.push({
          label: 'deux valeurs, ordre inversé',
          value: [options[options.length - 1]!.code, options[0]!.code],
        });
      }
      break;
    case 'boolean':
      out.push({ label: 'vrai', value: def.booleanTrueCode ?? '1' });
      break;
    case 'range_min':
    case 'range_max':
    case 'number': {
      const domain = def.numericDomain;
      const lo = domain?.min ?? 1;
      const hi = domain?.max ?? 999_999;
      out.push({ label: `borne basse ${lo}`, value: lo });
      out.push({ label: `borne haute ${hi}`, value: hi });
      out.push({ label: 'valeur médiane', value: Math.floor((lo + hi) / 2) });
      break;
    }
    case 'text':
    case 'geo_text':
      out.push({ label: 'texte simple', value: 'coupe sport' });
      out.push({ label: 'texte avec virgule', value: 'coupe,sport' });
      out.push({ label: 'texte avec esperluette', value: 'coupe&sport' });
      out.push({ label: 'texte accentué et pourcent', value: 'été 100% cuir' });
      break;
    case 'structured_multi':
      out.push({ label: 'un bloc marque|modèle', value: '16|1174' });
      break;
  }
  return out;
}

/** Aller-retour complet d'UNE valeur : état → URL → état → URL. */
function roundTrip(def: FilterDef, value: FilterValue): {
  readonly q1: string;
  readonly q2: string;
  readonly corrections: number;
  readonly serialized: boolean;
} {
  const selection: SelectionState = { [def.id]: value };
  const q1 = serializeQuery(selection, {}, OPTS);
  if (q1 === '') return { q1, q2: '', corrections: 0, serialized: false };
  const loaded = loadQuery(q1);
  const q2 = serializeQuery(loaded.selection, {}, OPTS);
  return { q1, q2, corrections: loaded.corrections.length, serialized: true };
}

describe('D5 — aller-retour URL exhaustif sur le périmètre des 77 filtres', () => {
  it('chaque valeur valide de chaque filtre sérialisable revient identique au caractère près', () => {
    const failures: string[] = [];
    for (const def of FILTER_DEFS) {
      for (const c of casesFor(def)) {
        const r = roundTrip(def, c.value);
        if (!r.serialized) continue;
        if (r.q1 !== r.q2 || r.corrections !== 0) {
          failures.push(`${def.param} [${c.label}] : « ${r.q1} » → « ${r.q2} » (${r.corrections} correction(s))`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('les intervalles reviennent identiques pour min seul, max seul et les deux bornes', () => {
    const failures: string[] = [];
    for (const def of FILTER_DEFS) {
      if (def.scopeType !== 'range_min' || def.pairedWith === undefined) continue;
      const toDef = FILTER_BY_ID.get(def.pairedWith);
      if (toDef === undefined) continue;
      const lo = def.numericDomain?.min ?? 10;
      const hi = def.numericDomain?.max ?? 900;
      const combos: ReadonlyArray<readonly [string, SelectionState]> = [
        ['min seul', { [def.id]: lo }],
        ['max seul', { [toDef.id]: hi }],
        ['les deux', { [def.id]: lo, [toDef.id]: hi }],
        ['bornes extrêmes égales', { [def.id]: hi, [toDef.id]: hi }],
      ];
      for (const [label, selection] of combos) {
        const q1 = serializeQuery(selection, {}, OPTS);
        const loaded = loadQuery(q1);
        const q2 = serializeQuery(loaded.selection, {}, OPTS);
        if (q1 !== q2 || loaded.corrections.length !== 0) {
          failures.push(`${def.param}/${toDef.param} [${label}] : « ${q1} » → « ${q2} »`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('EX-NAV-9 — l’ordre canonique ne dépend pas de l’ordre de pose', () => {
    const a: SelectionState = { fuelType: ['D', 'B'], priceTo: 25_000, priceFrom: 5_000, sellerType: 'P' };
    const b: SelectionState = { sellerType: 'P', priceFrom: 5_000, fuelType: ['B', 'D'], priceTo: 25_000 };
    expect(serializeQuery(a, {}, OPTS)).toBe(serializeQuery(b, {}, OPTS));
    expect(serializeQuery(a, {}, OPTS)).toBe('custtype=P&fuel=B,D&pricefrom=5000&priceto=25000');
  });

  it('EX-NAV-8 — une valeur par défaut n’est jamais émise', () => {
    expect(serializeQuery({ powerType: 'kw' }, {}, OPTS)).toBe('');
    expect(serializeQuery({ hadAccident: 'N,U' }, {}, OPTS)).toBe('');
    expect(serializeQuery({ sortTypes: 'standard' }, {}, OPTS)).toBe('');
    expect(serializeQuery({ page: 1, pageSize: 20 }, {}, OPTS)).toBe('');
  });

  it('EX-SCR-57 — un filtre de classe D n’est jamais sérialisé', () => {
    for (const def of FILTER_DEFS.filter((d) => d.cls === 'D')) {
      const value: FilterValue = def.options?.[0]?.code ?? 'x';
      expect(serializeQuery({ [def.id]: value }, {}, OPTS)).toBe('');
    }
  });

  it('décompte : combien des 77 filtres font réellement l’aller-retour', () => {
    const ok: string[] = [];
    const notSerialized: string[] = [];
    const broken: string[] = [];
    for (const def of FILTER_DEFS) {
      const cases = casesFor(def);
      const results = cases.map((c) => roundTrip(def, c.value));
      if (results.length === 0 || results.every((r) => !r.serialized)) notSerialized.push(def.param);
      else if (results.every((r) => !r.serialized || (r.q1 === r.q2 && r.corrections === 0))) ok.push(def.param);
      else broken.push(def.param);
    }
    // Décompte factuel, mis à jour par `DR-059` (`EX-SCR-73`) : le codec refuse désormais de
    // sérialiser un filtre dont la DÉPENDANCE n'est pas satisfaite (`src/state/url-codec.ts`,
    // `serializeFilterPair`, même défense en profondeur que `cls === 'D'` — nécessaire pour que
    // `R-D5-17` passe : un prédicat de leasing orphelin de `hasleasing` ne doit plus survivre à un
    // aller-retour). Cette sonde construit chaque `roundTrip` en ISOLANT le filtre testé, SANS son
    // parent — tout filtre `dependencies.length > 0` bascule donc ici de « ok » à
    // « notSerialized » : les 9 filtres de leasing (`hasleasing`), `bot`/`erfrom`/`erto`
    // (carburant électrique), `crossborder` (`radius`), `desc` (`sortTypes`),
    // `sealor`/`version0`/`cat`/`mcat` (`mmmv`). Ce n'est pas une régression de l'aller-retour
    // EX-NAV-6/7/9 (prouvé génériquement par les sondes précédentes de ce fichier, restées vertes)
    // : c'est la conséquence directe et attendue de `DR-059`, dont la preuve (`R-D5-17`) exige
    // précisément ce nouveau comportement. S'y ajoutent les six paramètres `nonExposed` de
    // `DR-052`/`D-12` (`powertype`, `ustate`, `cy`, `page`, `size`, en plus d'`atype` déjà là).
    expect({ ok: ok.length, notSerialized: notSerialized.slice().sort(), broken }).toEqual({
      ok: 47,
      notSerialized: [
        'atype', 'bot', 'cat', 'crossborder', 'cy', 'damaged_listing', 'desc', 'dlv_max', 'erfrom',
        'erto', 'leasingratefrom', 'leasingrateto', 'lsavno', 'lsdufrom', 'lsduto', 'lsenbo',
        'lstagr', 'lstrinbo', 'lsyeinmifrom', 'mcat', 'page', 'powertype', 'region', 'sealor',
        'size', 'ustate', 'version0',
      ].sort(),
      broken: [],
    });
  });
});

describe('R-D5-01 — `mmmv` : la virgule échappée d’EX-SCR-72 est détruite par l’aller-retour', () => {
  it('R-D5-01 — un bloc `version` contenant `%2C` revient scindé en deux blocs', () => {
    // EX-SCR-72 : « virgule littérale dans `version` échappée en `,,` puis encodée `%2C` ».
    const selection: SelectionState = { makesModelsVariants: '16|1174|3|Sport%2CGT' };
    const q1 = serializeQuery(selection, {}, OPTS);
    const q2 = serializeQuery(loadQuery(q1).selection, {}, OPTS);
    expect(q2).toBe(q1);
  });
});

describe('R-D5-02 — `structured_multi` : la décomposition multi-blocs est perdue au chargement', () => {
  it('R-D5-02 — `mmmv` à deux blocs revient sous forme d’une chaîne unique', () => {
    const selection: SelectionState = { makesModelsVariants: ['16|1174', '9|11'] };
    const back = loadQuery(serializeQuery(selection, {}, OPTS)).selection;
    expect(back['makesModelsVariants']).toEqual(['16|1174', '9|11']);
  });

  it('R-D5-02 — `cat` à deux blocs ne revient pas au caractère près', () => {
    const selection: SelectionState = { vkhFilters: ['16|1174', '9|11'] };
    const q1 = serializeQuery(selection, {}, OPTS);
    const q2 = serializeQuery(loadQuery(q1).selection, {}, OPTS);
    expect(q2).toBe(q1);
  });
});

describe('R-D5-04 — `atype` : sérialisé dans l’URL applicative et jamais validé', () => {
  it('R-D5-04 — EX-SRCH-18bis : `atype` ne doit jamais apparaître dans l’URL de l’application', () => {
    expect(serializeQuery({ articleType: 'C' }, {}, OPTS)).toBe('');
  });

  it('R-D5-04 — une valeur `atype` hors domaine est acceptée sans correction EX-NAV-21', () => {
    const loaded = loadQuery('atype=ZZZ');
    expect({ selection: loaded.selection, corrections: loaded.corrections.length }).toEqual({
      selection: {},
      corrections: 1,
    });
  });
});
