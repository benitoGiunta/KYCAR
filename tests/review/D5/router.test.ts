/**
 * Sonde de revue D5 — routeur maison : les six routes de l'annexe C (`EX-NAV-1`…`4`), les
 * redirections canoniques (`EX-SCR-140`, routes historiques) et l'exception `modelId = 0`
 * (`ADV-14` / `ARB-59`).
 */
import { describe, expect, it } from 'vitest';

import {
  ROUTE_NAMES,
  buildPath,
  matchRoute,
  resolveTaxonomyRoute,
  type TaxonomyLookup,
} from '../../../src/state/router';

const TAXONOMY: TaxonomyLookup = {
  makeById: new Map<number, unknown>([[16, { label: 'Opel' }]]),
  modelByKey: new Map<string, unknown>([['16:1174', { label: 'Corsa' }]]),
};

describe('D5 — routes adressables de l’annexe C', () => {
  it('EX-NAV-1/2/2bis/2ter/3 — les cinq routes nommées sont reconnues', () => {
    expect(matchRoute('/marche').name).toBe('market');
    expect(matchRoute('/marche/16-opel/1174-corsa').name).toBe('modelDistribution');
    expect(matchRoute('/marche/16-opel/1174-corsa/annonces').name).toBe('modelListings');
    expect(matchRoute('/comparer').name).toBe('compare');
    expect(matchRoute('/recherches').name).toBe('savedSearches');
  });

  it('EX-NAV-18 — `matchRoute` est pure : même chemin, même route, sans effet de bord', () => {
    const a = matchRoute('/marche/16-opel/1174-corsa');
    const b = matchRoute('/marche/16-opel/1174-corsa');
    expect(a).toEqual(b);
    expect(buildPath(a)).toBe('/marche/16-opel/1174-corsa');
  });

  it('EX-SCR-140 — l’identifiant fait foi : un slug erroné n’empêche pas l’affichage', () => {
    const route = matchRoute('/marche/16-mauvais-slug/1174-mauvais');
    expect(route.name).toBe('modelDistribution');
    if (route.name === 'modelDistribution') {
      expect(route.makeId).toBe(16);
      expect(route.modelId).toBe(1174);
    }
  });

  it('ADV-14 / ARB-59 — `modelId = 0` est servi, jamais traité comme modèle inconnu', () => {
    const route = matchRoute('/marche/16-opel/0-modele-non-identifie');
    expect(route.name).toBe('modelDistribution');
    if (route.name !== 'modelDistribution') return;
    expect(resolveTaxonomyRoute(route, TAXONOMY)).toEqual({ ok: true, route });
  });

  it('EX-NAV-19/20 — marque inconnue et modèle inconnu produisent deux erreurs distinctes', () => {
    const unknownMake = matchRoute('/marche/999-inconnue/1174-corsa');
    const unknownModel = matchRoute('/marche/16-opel/999-inconnu');
    if (unknownMake.name === 'modelDistribution') {
      expect(resolveTaxonomyRoute(unknownMake, TAXONOMY)).toEqual({
        ok: false,
        error: { kind: 'unknownMake', makeId: 999 },
      });
    }
    if (unknownModel.name === 'modelDistribution') {
      expect(resolveTaxonomyRoute(unknownModel, TAXONOMY)).toEqual({
        ok: false,
        error: { kind: 'unknownModel', makeId: 16, modelId: 999 },
      });
    }
  });
});

describe('R-D5-06 — la route `/suivis` (EX-NAV-4, écran F) est absente du routeur', () => {
  it('R-D5-06 — `/suivis` résout en `notFound`', () => {
    expect(matchRoute('/suivis').name).toBe('followedModels');
  });

  it('R-D5-06 — les six routes de l’annexe C sont les cinq adressables + `/suivis`', () => {
    expect([...ROUTE_NAMES]).toContain('followedModels');
  });
});

describe('R-D5-07 — redirections canoniques absentes (EX-SCR-140, routes historiques)', () => {
  it('R-D5-07 — aucune fonction ne produit le chemin canonique d’un slug erroné', () => {
    const route = matchRoute('/marche/16-mauvais-slug/1174-mauvais');
    expect(route.name).toBe('modelDistribution');
    if (route.name !== 'modelDistribution') return;
    // `buildPath` reconstruit le chemin REÇU, slug erroné compris, et `resolveTaxonomyRoute`
    // renvoie la route telle quelle : rien ne calcule la redirection canonique d'EX-SCR-140 à
    // partir de la taxonomie, alors que c'est le seul point du lot qui la connaît.
    const resolved = resolveTaxonomyRoute(route, TAXONOMY);
    expect(resolved.ok ? buildPath(resolved.route) : '(erreur)').toBe('/marche/16-opel/1174-corsa');
  });

  it('R-D5-07 — la route historique `/modele/:makeId/:modelId` ne redirige pas', () => {
    // Annexe C §A.1 : « conservées en lecture seule et redirigent par `replaceState` ».
    expect(matchRoute('/modele/16/1174').name).toBe('modelDistribution');
  });
});
