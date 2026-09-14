import { describe, expect, it } from 'vitest';

import {
  ROUTE_NAMES,
  buildPath,
  carryFiltersAcrossMode,
  matchRoute,
  resolveTaxonomyRoute,
  type ModelDistributionRoute,
  type ModelListingsRoute,
  type Route,
  type TaxonomyEntry,
} from './router';

describe('routeur — six routes adressables + notFound (draft-screens.md §3.1, DR-053/054)', () => {
  it('déclare les six routes adressables (dont /suivis) plus le générique notFound', () => {
    // `DR-054` : `notFound` est un SEPTIÈME nom technique (l'écran d'erreur générique), pas une
    // des six routes ADRESSABLES de l'annexe C — qui comptent désormais `followedModels`
    // (`/suivis`, `DR-053`) à la place de l'ancien décompte qui prenait `notFound` pour la sixième.
    expect(ROUTE_NAMES).toHaveLength(7);
    expect(new Set(ROUTE_NAMES).size).toBe(7);
    expect(ROUTE_NAMES).toContain('followedModels');
    const addressable = ROUTE_NAMES.filter((n) => n !== 'notFound');
    expect(addressable).toHaveLength(6);
  });

  it('résout /marche et la racine en écran A (market)', () => {
    expect(matchRoute('/marche')).toEqual({ name: 'market' });
    expect(matchRoute('/')).toEqual({ name: 'market' });
    expect(matchRoute('')).toEqual({ name: 'market' });
  });

  it('résout /comparer en écran C (compare)', () => {
    expect(matchRoute('/comparer')).toEqual({ name: 'compare' });
  });

  it('résout /recherches en écran E (savedSearches)', () => {
    expect(matchRoute('/recherches')).toEqual({ name: 'savedSearches' });
  });

  it('résout /marche/:makeId-:makeSlug/:modelId-:modelSlug en écran B (modelDistribution)', () => {
    expect(matchRoute('/marche/16-opel/1174-corsa')).toEqual({
      name: 'modelDistribution',
      makeId: 16,
      makeSlug: 'opel',
      modelId: 1174,
      modelSlug: 'corsa',
    });
  });

  it('résout .../annonces en écran D (modelListings)', () => {
    expect(matchRoute('/marche/16-opel/1174-corsa/annonces')).toEqual({
      name: 'modelListings',
      makeId: 16,
      makeSlug: 'opel',
      modelId: 1174,
      modelSlug: 'corsa',
    });
  });

  it('accepte modelId = 0 (clé réservée « Modèle non identifié », EX-DATA-72)', () => {
    expect(matchRoute('/marche/16-opel/0-modele-non-identifie')).toEqual({
      name: 'modelDistribution',
      makeId: 16,
      makeSlug: 'opel',
      modelId: 0,
      modelSlug: 'modele-non-identifie',
    });
  });

  it('ignore une requête ou un fragment collé au chemin', () => {
    expect(matchRoute('/marche?pricefrom=1000')).toEqual({ name: 'market' });
    expect(matchRoute('/marche/16-opel/1174-corsa?fuel=D')).toEqual({
      name: 'modelDistribution',
      makeId: 16,
      makeSlug: 'opel',
      modelId: 1174,
      modelSlug: 'corsa',
    });
  });

  it('résout tout chemin non reconnu en notFound, avec le chemin conservé', () => {
    const cases = [
      '/inconnu',
      '/marche/abc-opel/1174-corsa', // segment makeId non numérique
      '/marche/16-opel', // modèle manquant
      '/marche/16-opel/1174-corsa/autre-chose', // quatrième segment non "annonces"
      '/marche/16-opel/1174-corsa/annonces/trop',
    ];
    for (const p of cases) {
      expect(matchRoute(p)).toEqual({ name: 'notFound', path: p });
    }
  });

  it('round-trip matchRoute -> buildPath -> matchRoute, identique, pour les cinq routes adressables', () => {
    const routes: Route[] = [
      { name: 'market' },
      { name: 'compare' },
      { name: 'savedSearches' },
      { name: 'modelDistribution', makeId: 16, makeSlug: 'opel', modelId: 1174, modelSlug: 'corsa' },
      { name: 'modelListings', makeId: 16, makeSlug: 'opel', modelId: 1174, modelSlug: 'corsa' },
    ];
    for (const r of routes) {
      const path = buildPath(r);
      expect(matchRoute(path)).toEqual(r);
    }
  });

  it('buildPath restitue le chemin brut d’une route notFound', () => {
    expect(buildPath({ name: 'notFound', path: '/inconnu?x=1' })).toBe('/inconnu?x=1');
  });
});

describe('résolution taxonomique — EX-NAV-19/20 (séparée du routeur pur)', () => {
  const taxonomy = {
    makeById: new Map<number, TaxonomyEntry>([[16, { label: 'Opel' }]]),
    modelByKey: new Map<string, TaxonomyEntry>([['16:1174', { label: 'Corsa' }]]),
  };

  function distributionRoute(makeId: number, modelId: number): ModelDistributionRoute {
    return { name: 'modelDistribution', makeId, makeSlug: 'x', modelId, modelSlug: 'y' };
  }

  it('accepte un couple makeId/modelId connu', () => {
    const result = resolveTaxonomyRoute(distributionRoute(16, 1174), taxonomy);
    expect(result.ok).toBe(true);
  });

  it('refuse un makeId absent de la taxonomie (écran d’erreur « marque inconnue »)', () => {
    const result = resolveTaxonomyRoute(distributionRoute(999, 1), taxonomy);
    expect(result).toEqual({ ok: false, error: { kind: 'unknownMake', makeId: 999 } });
  });

  it('refuse un modelId n’appartenant pas au makeId (écran d’erreur « modèle inconnu »)', () => {
    const result = resolveTaxonomyRoute(distributionRoute(16, 42), taxonomy);
    expect(result).toEqual({ ok: false, error: { kind: 'unknownModel', makeId: 16, modelId: 42 } });
  });

  it('exception unique : modelId = 0 n’est jamais un modèle inconnu, même absent de modelByKey', () => {
    const result = resolveTaxonomyRoute(distributionRoute(16, 0), taxonomy);
    expect(result.ok).toBe(true);
  });

  it('modelId = 0 reste refusé si le makeId lui-même est inconnu', () => {
    const result = resolveTaxonomyRoute(distributionRoute(999, 0), taxonomy);
    expect(result).toEqual({ ok: false, error: { kind: 'unknownMake', makeId: 999 } });
  });

  it('s’applique identiquement à modelListings (écran D)', () => {
    const route: ModelListingsRoute = { name: 'modelListings', makeId: 16, makeSlug: 'x', modelId: 1174, modelSlug: 'y' };
    expect(resolveTaxonomyRoute(route, taxonomy).ok).toBe(true);
  });

  it('DR-054 — la route retournée porte les slugs CANONIQUES relevés, pas ceux reçus', () => {
    const resolved = resolveTaxonomyRoute(distributionRoute(16, 1174), taxonomy);
    expect(resolved).toEqual({
      ok: true,
      route: { name: 'modelDistribution', makeId: 16, makeSlug: 'opel', modelId: 1174, modelSlug: 'corsa' },
    });
  });

  it('DR-054 — modelId = 0 : le makeSlug est canonisé, le modelSlug reçu est conservé', () => {
    const resolved = resolveTaxonomyRoute(distributionRoute(16, 0), taxonomy);
    expect(resolved).toEqual({
      ok: true,
      route: { name: 'modelDistribution', makeId: 16, makeSlug: 'opel', modelId: 0, modelSlug: 'y' },
    });
  });
});

describe('DR-054 — route historique /modele/:makeId/:modelId (annexe C §A.1)', () => {
  it('reconnue par matchRoute, sans slug (à canoniser via resolveTaxonomyRoute)', () => {
    expect(matchRoute('/modele/16/1174')).toEqual({
      name: 'modelDistribution',
      makeId: 16,
      makeSlug: '',
      modelId: 1174,
      modelSlug: '',
    });
  });

  it('un segment non numérique reste notFound', () => {
    expect(matchRoute('/modele/abc/1174').name).toBe('notFound');
  });
});

describe('DR-063 — carryFiltersAcrossMode (D-09, EX-NAV-15/16/17)', () => {
  it('mode 1 → mode 2 : le bloc mmmv du couple choisi est absorbé par la route, le reste survit', () => {
    const selection = { makesModelsVariants: '16|1174', fuelType: ['D'], priceFrom: 5_000 };
    const next = carryFiltersAcrossMode(selection, 'mode1', 'mode2', { makeId: 16, modelId: 1174 });
    expect(next).toEqual({ fuelType: ['D'], priceFrom: 5_000 });
  });

  it('mode 2 → mode 1 : le couple actif de la route est réinjecté dans mmmv', () => {
    const selection = { fuelType: ['D'], priceFrom: 5_000 };
    const next = carryFiltersAcrossMode(selection, 'mode2', 'mode1', { makeId: 16, modelId: 1174 });
    expect(next).toEqual({ makesModelsVariants: '16|1174', fuelType: ['D'], priceFrom: 5_000 });
  });

  it('mode 2 → mode 1, marque seule (aucun modèle) : mmmv ne porte qu’un bloc makeId', () => {
    const next = carryFiltersAcrossMode({}, 'mode2', 'mode1', { makeId: 16 });
    expect(next).toEqual({ makesModelsVariants: '16' });
  });

  it('même mode des deux côtés : identité (copie défensive)', () => {
    const selection = { fuelType: ['D'] };
    const next = carryFiltersAcrossMode(selection, 'mode1', 'mode1', { makeId: 16 });
    expect(next).toEqual(selection);
    expect(next).not.toBe(selection);
  });
});
