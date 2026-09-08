import { describe, expect, it } from 'vitest';

import {
  ROUTE_NAMES,
  buildPath,
  matchRoute,
  resolveTaxonomyRoute,
  type ModelDistributionRoute,
  type ModelListingsRoute,
  type Route,
} from './router';

describe('routeur — six routes exactement (draft-screens.md §3.1)', () => {
  it('déclare exactement six noms de route', () => {
    expect(ROUTE_NAMES).toHaveLength(6);
    expect(new Set(ROUTE_NAMES).size).toBe(6);
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
    makeById: new Map<number, unknown>([[16, { makeId: 16, label: 'Opel' }]]),
    modelByKey: new Map<string, unknown>([['16:1174', { makeId: 16, modelId: 1174, label: 'Corsa' }]]),
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
});
