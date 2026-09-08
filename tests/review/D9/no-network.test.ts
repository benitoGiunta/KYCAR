/**
 * KYCAR — Revue D9 · sonde 2 : ZÉRO appel réseau (E5) et surface d'URL autorisée
 * =================================================================================================
 * (a) Balayage STATIQUE des sources du lot : primitives réseau et littéraux d'URL.
 * (b) Balayage DYNAMIQUE : `globalThis.fetch` est remplacé par un espion qui ÉCHOUE, et tous les
 *     chemins du provider sont exercés (baseline, mode 1 filtré, mode 2 refusé). L'espion ne doit
 *     jamais être appelé.
 * (c) `fetcher.ts` : à quoi sert-il, quelles URL construit-il, respecte-t-il la surface autorisée
 *     par le `robots.txt` de 2dehands (`/l/auto-s/` ; jamais `/lrp/api/` ni `/lp/api/`) ?
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { servesMode2, type DataProvider } from '../../../src/providers/DataProvider';
import { TweedehandsDataProvider } from '../../../src/providers/tweedehands/TweedehandsDataProvider';
import { assertAllowedUrl, buildSearchUrl, MAX_ALLOWED_PAGE_NUMBER } from '../../../src/providers/tweedehands/fetcher';
import type { TweedehandsFetcher } from '../../../src/providers/tweedehands/fetcher';
import { loadRealReferenceData } from '../../../src/providers/tweedehands/testFixtures';
import { FIXTURE_PAGES } from './fixtures';

const LOT_DIR = fileURLToPath(new URL('../../../src/providers/tweedehands/', import.meta.url));
const SOURCES: readonly { readonly name: string; readonly text: string }[] = readdirSync(LOT_DIR)
  .filter((f) => f.endsWith('.ts'))
  .map((name) => ({ name, text: readFileSync(LOT_DIR + name, 'utf8') }));

const referenceData = loadRealReferenceData();

describe('D9 · E5 (a) — balayage statique des primitives réseau du lot', () => {
  it('aucune primitive réseau autre que `fetch`, et un seul site d’appel `fetch(`', () => {
    const banned = /\bXMLHttpRequest\b|\bWebSocket\b|sendBeacon|\bEventSource\b|\bimport\s*\(/;
    const offenders = SOURCES.filter((s) => banned.test(s.text)).map((s) => s.name);
    expect(offenders).toEqual([]);

    const callSites = SOURCES.flatMap((s) =>
      [...s.text.matchAll(/(?<![.\w])fetch\s*\(/g)].map(() => s.name),
    );
    expect(callSites).toEqual(['fetcher.ts']);
  });

  it('tout littéral d’URL du CODE DE PRODUCTION est sur la surface autorisée', () => {
    const production = SOURCES.filter((s) => !s.name.endsWith('.test.ts'));
    const urls = production.flatMap((s) => [...s.text.matchAll(/https?:\/\/[^\s'"`)]+/g)].map((m) => m[0]));
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(/^https:\/\/www\.(2dehands\.be|marktplaats\.nl)/.test(url), `URL hors origine autorisée : ${url}`).toBe(true);
      expect(url.includes('/lrp/api'), `URL sur l’API interne interdite : ${url}`).toBe(false);
      expect(url.includes('/lp/api'), `URL sur l’API interne interdite : ${url}`).toBe(false);
      expect(url.includes('/u/'), `URL sur un listing de profil vendeur : ${url}`).toBe(false);
    }
  });

  it('les URL de préfixe interdit n’apparaissent que dans des assertions de REFUS des tests du lot', () => {
    const tests = SOURCES.filter((s) => s.name.endsWith('.test.ts'));
    const suspicious = tests.flatMap((s) =>
      s.text
        .split('\n')
        .filter((line) => /\/lrp\/api|\/lp\/api|\/u\//.test(line))
        .map((line) => ({ file: s.name, line: line.trim() })),
    );
    // Chaque occurrence est une URL passée à `assertAllowedUrl` avec un `toThrow` : un cas négatif.
    for (const occurrence of suspicious) {
      expect(
        /assertAllowedUrl/.test(occurrence.line),
        `${occurrence.file} : ${occurrence.line}`,
      ).toBe(true);
    }
    expect(suspicious.length).toBeGreaterThan(0);
  });
});

describe('D9 · E5 (b) — aucun appel réseau à l’exécution, sur tous les chemins du provider', () => {
  it('l’espion `globalThis.fetch` (qui échoue) n’est jamais appelé', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('E5 — appel réseau interdit pendant la revue');
    });
    try {
      const fetcher: TweedehandsFetcher = {
        fetchSearchPage: (r) =>
          Promise.resolve(
            (FIXTURE_PAGES[r.brandSlug === undefined ? 'root' : (r.modelSlug === undefined ? r.brandSlug : `${r.brandSlug}/${r.modelSlug}`)] ??
              FIXTURE_PAGES.vide) as string,
          ),
      };
      const provider = new TweedehandsDataProvider({
        referenceData,
        marketplace: 'be',
        fetcher,
        makeUniverse: [{ makeId: 54, slug: 'opel' }],
      });

      const caps = provider.describe();
      const handle = await provider.openSnapshot();
      await provider.fetchBaselineAggregates(handle);            // baseline
      await provider.fetchAggregates(handle, 'make=54', 'MAKE');  // mode 1 filtré
      await provider.fetchAggregates(handle, 'FULL:EMPTY', 'MODEL', 54);
      await provider.fetchSelectionCount(handle, 'make=54');

      // Mode 2 refusé : le garde interdit l'appel, les méthodes sont absentes.
      const asProvider: DataProvider = provider;
      expect(servesMode2(provider)).toBe(false);
      expect(asProvider.fetchListingColumns).toBeUndefined();
      expect(asProvider.fetchListingsByIds).toBeUndefined();
      expect(caps.mode2.kind).toBe('UNAVAILABLE');

      await provider.closeSnapshot(handle);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  }, 60_000);
});

describe('D9 · E5 (c) — `fetcher.ts` : surface d’URL autorisée', () => {
  it('les URL construites restent sur le préfixe `/l/auto-s/` des deux origines', () => {
    expect(buildSearchUrl({ marketplace: 'be', page: 1 })).toBe('https://www.2dehands.be/l/auto-s/');
    expect(buildSearchUrl({ marketplace: 'nl', page: 1 })).toBe('https://www.marktplaats.nl/l/auto-s/');
    expect(buildSearchUrl({ marketplace: 'be', brandSlug: 'opel', modelSlug: 'corsa', page: 2 })).toBe(
      'https://www.2dehands.be/l/auto-s/opel/corsa/p/2/',
    );
  });

  it('les préfixes en `Disallow` (API interne) et les listings de profil sont refusés', () => {
    expect(() => assertAllowedUrl('https://www.2dehands.be/lrp/api/search')).toThrow(/interdit par robots\.txt/);
    expect(() => assertAllowedUrl('https://www.2dehands.be/lp/api/listings')).toThrow(/interdit par robots\.txt/);
    expect(() => assertAllowedUrl('https://www.2dehands.be/u/janjansen/1234/l/auto-s/')).toThrow(/préfixe autorisé/);
    expect(() => assertAllowedUrl('https://www.autoscout24.be/fr/voiture/')).toThrow(/origines autorisées/);
    expect(() => assertAllowedUrl('https://www.2dehands.be.evil.example/l/auto-s/')).toThrow();
  });

  it('R-D9-13 — `buildSearchUrl` n’assainit ni la page ni les slugs (plafond 167 non appliqué)', () => {
    // Le plafond licite mesuré (audit 1.5) est exporté mais jamais appliqué.
    expect(MAX_ALLOWED_PAGE_NUMBER).toBe(167);
    expect(() => buildSearchUrl({ marketplace: 'be', page: MAX_ALLOWED_PAGE_NUMBER + 1 })).toThrow();
  });

  it('R-D9-13b — un slug non encodé s’injecte tel quel dans le chemin de l’URL', () => {
    // Une valeur de slug portant `?`/`#` sort du chemin de recherche sans que le garde le voie.
    // Attendu : les segments de chemin sont encodés (`encodeURIComponent`) avant construction.
    // Obtenu : le slug est concaténé tel quel — `?`/`#` sortent du chemin de recherche.
    expect(buildSearchUrl({ marketplace: 'be', brandSlug: 'opel?x=1#y', page: 1 })).toBe(
      'https://www.2dehands.be/l/auto-s/opel%3Fx=1%23y/',
    );
  });
});
