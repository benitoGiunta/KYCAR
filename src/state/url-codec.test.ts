import { describe, expect, it } from 'vitest';
import { FILTER_DEFS, FILTER_BY_PARAM } from './filter-registry';
import type { SelectionState, FilterValue } from './filter-types';
import {
  MAX_URL_LENGTH,
  URL_BUDGET_EXCEEDED_MESSAGE,
  UI_STATE_PARAMS,
  assembleUrl,
  graphLogParam,
  parseRawQuery,
  serializeQuery,
  splitMultiValue,
  wouldExceedBudget,
} from './url-codec';

/** Construit une valeur non-défaut plausible pour un filtre, selon son type de portée. */
function sampleValueFor(filterId: string): FilterValue | undefined {
  const d = FILTER_DEFS.find((x) => x.id === filterId);
  if (!d || d.nonExposed) return undefined;
  switch (d.scopeType) {
    case 'enum_single':
      return d.options?.[0]?.code;
    case 'enum_multi':
      return d.options ? d.options.slice(0, Math.min(2, d.options.length)).map((o) => o.code) : undefined;
    case 'range_min':
      return (d.numericDomain?.min ?? 0) + 1;
    case 'range_max':
      return (d.numericDomain?.max ?? 100) - 1;
    case 'number':
      return (d.numericDomain?.min ?? 0) + 1;
    case 'boolean':
      return d.booleanTrueCode ?? '1';
    case 'text':
      return 'texte de test';
    case 'geo_text':
      return '1000';
    case 'structured_multi':
      return '9|322||';
    default:
      return undefined;
  }
}

/** Une sélection couvrant TOUS les filtres exposés (hors `atype`), une valeur plausible chacun. */
function fullSelection(): SelectionState {
  const out: Record<string, FilterValue> = {};
  for (const d of FILTER_DEFS) {
    if (d.nonExposed) continue;
    const v = sampleValueFor(d.id);
    if (v !== undefined) out[d.id] = v;
  }
  return out;
}

describe('serializeQuery — ordre canonique (EX-NAV-9)', () => {
  it('trie les paramètres alphabétiquement, indépendamment de l’ordre de saisie', () => {
    const a = serializeQuery({ mileageFrom: 10000, priceTo: 20000, fuelType: 'B' });
    const b = serializeQuery({ fuelType: 'B', mileageFrom: 10000, priceTo: 20000 });
    expect(a).toBe(b);
    // Ordre alphabétique des PARAMÈTRES (fuel < kmfrom < priceto).
    expect(a).toBe('fuel=B&kmfrom=10000&priceto=20000');
  });

  it('joint les valeurs multiples par une seule virgule, triées (EX-NAV-6)', () => {
    const q = serializeQuery({ fuelType: ['D', 'B', 'E'] });
    expect(q).toBe('fuel=B,D,E');
  });

  it('sérialise un intervalle en deux paramètres jumeaux, bornes non posées omises (EX-NAV-7)', () => {
    expect(serializeQuery({ priceFrom: 5000 })).toBe('pricefrom=5000');
    expect(serializeQuery({ priceFrom: 5000, priceTo: 20000 })).toBe('pricefrom=5000&priceto=20000');
  });

  it('omet un filtre à sa valeur par défaut, jamais réécrit vide (EX-NAV-8)', () => {
    const withDefault = serializeQuery(
      { sortTypes: 'standard', fuelType: 'B' },
      {},
      { filterDefaults: { sortTypes: 'standard' } },
    );
    expect(withDefault).toBe('fuel=B');
    expect(withDefault).not.toContain('sort=');
  });

  it('mélange filtres et état d’interface dans le MÊME ordre alphabétique (EX-NAV-10bis)', () => {
    const q = serializeQuery({ fuelType: 'B' }, { sort: 'median', mk: ['9'] });
    // fuel < mk < sort
    expect(q).toBe('fuel=B&mk=9&sort=median');
  });

  it('encode les caractères réservés d’un champ texte libre, jamais la virgule séparatrice de code', () => {
    const q = serializeQuery({ keyword: 'break & van' });
    expect(q).toBe('kwd=break%20%26%20van');
  });
});

describe('parseRawQuery / splitMultiValue — analyse brute', () => {
  it('décode une requête simple', () => {
    expect(parseRawQuery('fuel=B,D')).toEqual([{ param: 'fuel', raw: 'B,D' }]);
    expect(parseRawQuery('?fuel=B,D&kmfrom=10000')).toEqual([
      { param: 'fuel', raw: 'B,D' },
      { param: 'kmfrom', raw: '10000' },
    ]);
  });

  it('décode le pourcent-encodage y compris pour les caractères réservés', () => {
    expect(parseRawQuery('kwd=break%20%26%20van')).toEqual([{ param: 'kwd', raw: 'break & van' }]);
  });

  it('ne fait jamais échouer tout le chargement sur une séquence %xx invalide isolée', () => {
    expect(() => parseRawQuery('kwd=%zz')).not.toThrow();
  });

  it('scinde une valeur multi-valeurs par virgule, retire les segments vides', () => {
    expect(splitMultiValue('B,D,')).toEqual(['B', 'D']);
    expect(splitMultiValue('')).toEqual([]);
  });

  it('retrouve le FilterDef d’un paramètre connu, undefined sinon', () => {
    expect(FILTER_BY_PARAM.get('fuel')?.id).toBe('fuelType');
    expect(FILTER_BY_PARAM.get('inconnu_xyz')).toBeUndefined();
  });
});

/**
 * Critère de succès D5 #2 : ALLER-RETOUR état → URL → état égal au caractère près pour les 77
 * filtres. Test exhaustif : construit une valeur plausible pour chaque filtre exposé, sérialise,
 * reconstruit la sélection depuis la requête brute, et compare la re-sérialisation (le point fixe
 * du codec, pas une comparaison structurelle qui masquerait une perte d'information).
 */
describe('aller-retour état → URL → état, aux 77 filtres (critère de succès D5 #2)', () => {
  it('reproduit exactement la même chaîne canonique après un aller-retour', () => {
    const selection = fullSelection();
    const query1 = serializeQuery(selection);
    expect(query1.length).toBeGreaterThan(0);

    // Retour : reconstruit une SelectionState depuis la requête (id ← param, valeur brute scindée).
    // Seul `enum_multi` scinde par virgule (EX-NAV-6) : un scalaire (ex. `ustate=N,U`, code
    // composite contenant une virgule LITTÉRALE) n'est JAMAIS scindé — c'est au type de portée de
    // décider, pas à la présence d'une virgule dans la chaîne (règle appliquée à l'identique par
    // `corrections.ts`).
    const rebuilt: Record<string, FilterValue> = {};
    for (const entry of parseRawQuery(query1)) {
      const def = FILTER_BY_PARAM.get(entry.param);
      if (!def) continue;
      if (def.scopeType === 'enum_multi') {
        rebuilt[def.id] = splitMultiValue(entry.raw);
      } else {
        rebuilt[def.id] = entry.raw;
      }
    }

    const query2 = serializeQuery(rebuilt);
    expect(query2).toBe(query1);
  });

  it('chaque filtre exposé apparaît dans la requête complète (aucune perte silencieuse)', () => {
    const selection = fullSelection();
    const query = serializeQuery(selection);
    const params = new Set(parseRawQuery(query).map((e) => e.param));
    const exposedNonDerived = FILTER_DEFS.filter((d) => !d.nonExposed);
    for (const d of exposedNonDerived) {
      expect(params.has(d.param), `paramètre absent : ${d.id} (${d.param})`).toBe(true);
    }
  });
});

describe('plafond de longueur (EX-NAV-10/11, critère de succès D5 #3)', () => {
  it('60 filtres posés restent sous le plafond de 2000 caractères', () => {
    const selection = fullSelection();
    const entries = Object.entries(selection).slice(0, 60);
    const sixty: Record<string, FilterValue> = Object.fromEntries(entries);
    const query = serializeQuery(sixty);
    const assembly = assembleUrl('https://kycar.example/marche', query);
    expect(assembly.withinBudget).toBe(true);
    expect(assembly.length).toBeLessThanOrEqual(MAX_URL_LENGTH);
  });

  it('l’état le plus large (tous les enum_multi à leur cardinalité maximale) dépasse le plafond', () => {
    // EX-NAV-18 : l'estimation de référence (~1720 car., eq large compris) tient sous 2000 pour
    // UN état "plausible" ; le dépassement s'atteint en élargissant plusieurs filtres
    // multi-valeurs SIMULTANÉMENT à leur cardinalité maximale (pas seulement `eq`).
    const selection = fullSelection();
    const wide: Record<string, FilterValue> = { ...selection };
    for (const d of FILTER_DEFS) {
      if (d.scopeType === 'enum_multi' && d.options) {
        wide[d.id] = d.options.map((o) => o.code);
      }
    }
    // Élargit aussi les champs texte libres (kwd, version0, region, dlv_max) : une recherche par
    // mots-clés plausible n'est pas bornée à un mot, contrairement à l'échantillon minimal utilisé
    // ailleurs dans ce fichier. C'est l'un des « deux ou trois filtres élargis » qu'`EX-NAV-18`
    // désigne comme trajectoire de dépassement, en sus des multi-valeurs déjà à cardinalité max.
    wide.keyword = 'break familiale essence automatique toit ouvrant jantes alliage cuir '.repeat(3);
    wide.version = 'finition haut de gamme pack confort et sécurité complet avec options '.repeat(3);
    const query = serializeQuery(wide);
    const assembly = assembleUrl('https://kycar.example/marche', query);
    expect(assembly.withinBudget).toBe(false);
    expect(wouldExceedBudget('https://kycar.example/marche', wide, {})).toBe(true);
  });

  it('expose le message normatif de refus, jamais une troncature', () => {
    expect(URL_BUDGET_EXCEEDED_MESSAGE).toBe(
      "limite d'URL atteinte, retirez un filtre pour en ajouter un autre",
    );
  });

  it('assembleUrl mesure origine + chemin + requête, jamais la requête seule', () => {
    const longOrigin = 'https://kycar.example' + '/x'.repeat(990); // ~2000 avec un chemin seul
    const assembly = assembleUrl(longOrigin, 'fuel=B');
    expect(assembly.length).toBe(longOrigin.length + 1 + 'fuel=B'.length);
    expect(assembly.withinBudget).toBe(false);
  });
});

describe('paramètres d’état d’interface (EX-NAV-10bis)', () => {
  it('porte les 7 paramètres nommés avec leur mode d’historique', () => {
    const byParam = new Map(UI_STATE_PARAMS.map((p) => [p.param, p.historyMode]));
    expect(byParam.get('m')).toBe('push');
    expect(byParam.get('grp')).toBe('replace');
    expect(byParam.get('mk')).toBe('replace');
    expect(byParam.get('sort')).toBe('replace');
    expect(byParam.get('g4v')).toBe('replace');
    expect(byParam.get('selx')).toBe('push');
    expect(byParam.get('sely')).toBe('push');
  });

  it('g<n>log est une famille générée, pas une entrée statique', () => {
    expect(graphLogParam(1)).toBe('g1log');
    expect(graphLogParam(9)).toBe('g9log');
  });
});
