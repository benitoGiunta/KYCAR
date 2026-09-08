/**
 * KYCAR — Tests de résolution de vue de la coquille (lot D8).
 * =================================================================================================
 * Vérifie que la coquille reconnaît les deux chemins additionnels `/suivis` et `/mentions` (absents
 * du routeur D5 figé) et délègue les six autres routes à `matchRoute`, en conservant un rendu
 * fonction pure du chemin (EX-NAV-18).
 */
import { describe, expect, it } from 'vitest';

import { resolveView } from './navigation';

describe('resolveView (routage de la coquille D8)', () => {
  it('résout les chemins additionnels /suivis et /mentions', () => {
    expect(resolveView('/suivis')).toEqual({ kind: 'followed' });
    expect(resolveView('/suivis/')).toEqual({ kind: 'followed' });
    expect(resolveView('/mentions')).toEqual({ kind: 'mentions' });
  });

  it('délègue les six routes D5 en conservant les identifiants de la route de modèle', () => {
    expect(resolveView('/marche')).toEqual({ kind: 'market' });
    expect(resolveView('/')).toEqual({ kind: 'market' });
    expect(resolveView('/comparer')).toEqual({ kind: 'compare' });
    expect(resolveView('/recherches')).toEqual({ kind: 'savedSearches' });
    expect(resolveView('/marche/16-opel/1174-corsa')).toEqual({
      kind: 'modelDistribution',
      makeId: 16,
      makeSlug: 'opel',
      modelId: 1174,
      modelSlug: 'corsa',
    });
    expect(resolveView('/marche/16-opel/1174-corsa/annonces')).toEqual({
      kind: 'modelListings',
      makeId: 16,
      makeSlug: 'opel',
      modelId: 1174,
      modelSlug: 'corsa',
    });
  });

  it('résout un chemin inconnu en notFound (jamais une exception)', () => {
    expect(resolveView('/nawak')).toEqual({ kind: 'notFound', path: '/nawak' });
  });
});
