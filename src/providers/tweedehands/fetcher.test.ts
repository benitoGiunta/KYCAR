import { describe, expect, it } from 'vitest';
import { assertAllowedUrl, buildSearchUrl } from './fetcher';

/**
 * Ces tests sont 100% PURS : `buildSearchUrl`/`assertAllowedUrl` ne font aucune I/O. Aucun test de ce
 * fichier (ni d'aucun autre du lot) n'invoque `createHttpTweedehandsFetcher` — critère « aucun appel
 * réseau live » vérifié par construction : la fonction qui appelle `fetch` n'apparaît nulle part dans
 * la suite de tests.
 */

describe('fetcher — construction d’URL restreinte aux préfixes autorisés par robots.txt', () => {
  it('construit la page racine be sur /l/auto-s/', () => {
    expect(buildSearchUrl({ marketplace: 'be', page: 1 })).toBe('https://www.2dehands.be/l/auto-s/');
  });

  it('construit la page racine nl (marktplaats) sur /l/auto-s/', () => {
    expect(buildSearchUrl({ marketplace: 'nl', page: 1 })).toBe('https://www.marktplaats.nl/l/auto-s/');
  });

  it('ajoute le slug de marque puis de modèle', () => {
    expect(buildSearchUrl({ marketplace: 'be', brandSlug: 'opel', page: 1 })).toBe(
      'https://www.2dehands.be/l/auto-s/opel/',
    );
    expect(buildSearchUrl({ marketplace: 'be', brandSlug: 'opel', modelSlug: 'corsa', page: 1 })).toBe(
      'https://www.2dehands.be/l/auto-s/opel/corsa/',
    );
  });

  it('ajoute /p/N/ au-delà de la page 1', () => {
    expect(buildSearchUrl({ marketplace: 'be', page: 3 })).toBe('https://www.2dehands.be/l/auto-s/p/3/');
  });

  it('refuse modelSlug sans brandSlug', () => {
    expect(() => buildSearchUrl({ marketplace: 'be', modelSlug: 'corsa', page: 1 })).toThrow(/brandSlug/);
  });

  it('assertAllowedUrl accepte les URL sur le préfixe /l/auto-s/', () => {
    expect(() => assertAllowedUrl('https://www.2dehands.be/l/auto-s/opel/')).not.toThrow();
    expect(() => assertAllowedUrl('https://www.marktplaats.nl/l/auto-s/')).not.toThrow();
  });

  it('assertAllowedUrl refuse une origine inconnue', () => {
    expect(() => assertAllowedUrl('https://www.autoscout24.be/fr/voiture/')).toThrow(/origines autorisées/);
  });

  it('assertAllowedUrl refuse un chemin hors /l/auto-s/', () => {
    expect(() => assertAllowedUrl('https://www.2dehands.be/l/auto-s-motoren/')).toThrow(/préfixe autorisé/);
    expect(() => assertAllowedUrl('https://www.2dehands.be/u/janjansen/1234/l/auto-s/')).toThrow(/préfixe autorisé/);
  });

  it('assertAllowedUrl refuse explicitement l’API interne /lrp/api/ et /lp/api/', () => {
    expect(() => assertAllowedUrl('https://www.2dehands.be/lrp/api/search')).toThrow(/interdit par robots.txt/);
    expect(() => assertAllowedUrl('https://www.2dehands.be/l/auto-s/../lp/api/listings')).toThrow(
      /interdit par robots.txt/,
    );
  });
});
