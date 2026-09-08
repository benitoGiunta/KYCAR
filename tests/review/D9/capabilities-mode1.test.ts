/**
 * KYCAR — Revue D9 · sonde 6 : critères §7.1 (déclaration mode 2, mode 1 réel servi, sélection)
 * =================================================================================================
 * Vérifie mot à mot la déclaration exigée par `ARCHITECTURE.md` §6.3/§7.1
 * (`UNAVAILABLE('BIASED_SAMPLE', fallback:'SYNTHETIC')`, `servesMode2() === false`) et éprouve ce
 * que « mode 1 réel servi » veut dire à l'exécution : la sélection passée par `DataController` est
 * la `SelectionQuery` canonique COMPLÈTE (77 filtres possibles), pas seulement `make`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { servesMode2, type DataProvider } from '../../../src/providers/DataProvider';
import { TweedehandsDataProvider } from '../../../src/providers/tweedehands/TweedehandsDataProvider';
import type { TweedehandsFetcher, TweedehandsSearchRequest } from '../../../src/providers/tweedehands/fetcher';
import { loadRealReferenceData, buildFixtureHtml, makeRawListing } from '../../../src/providers/tweedehands/testFixtures';

const referenceData = loadRealReferenceData();

function provider(): { p: TweedehandsDataProvider; calls: TweedehandsSearchRequest[] } {
  const calls: TweedehandsSearchRequest[] = [];
  const fetcher: TweedehandsFetcher = {
    fetchSearchPage(request) {
      calls.push(request);
      const total = request.brandSlug === 'opel' ? 5220 : 100188;
      return Promise.resolve(
        buildFixtureHtml({
          totalResultCount: total,
          listings: [
            makeRawListing({ itemId: 'a', brand: 'Opel', model: 'Corsa', priceCents: 1000000, priceType: 'FIXED', fuel: 'Benzine', constructionYear: '2012' }),
          ],
        }),
      );
    },
  };
  return {
    p: new TweedehandsDataProvider({ referenceData, marketplace: 'be', fetcher, makeUniverse: [{ makeId: 54, slug: 'opel' }] }),
    calls,
  };
}

describe('D9 · §7.1 — déclaration des capacités', () => {
  it('`mode2` vaut exactement UNAVAILABLE(BIASED_SAMPLE, fallback SYNTHETIC) et `servesMode2()` est faux', () => {
    const { p } = provider();
    const caps = p.describe();
    expect(caps.mode2.kind).toBe('UNAVAILABLE');
    expect(caps.mode2).toMatchObject({ kind: 'UNAVAILABLE', reason: 'BIASED_SAMPLE', fallback: 'SYNTHETIC' });
    expect(servesMode2(p)).toBe(false);
    const asProvider: DataProvider = p;
    expect(asProvider.fetchListingColumns).toBeUndefined();
    expect(asProvider.fetchListingsByIds).toBeUndefined();
    if (caps.mode2.kind === 'UNAVAILABLE') expect(caps.mode2.detail).toMatch(/biais|promu/i);
  });
});

describe('D9 · §7.1 — « mode 1 réel servi »', () => {
  it('R-D9-01 — tout filtre autre que `make` est IGNORÉ : le compte renvoyé est celui de la sélection non filtrée', async () => {
    const { p } = provider();
    const handle = await p.openSnapshot();
    const unfiltered = await p.fetchSelectionCount(handle, 'make=54');
    const filtered = await p.fetchSelectionCount(handle, 'fuel=D;make=54;pricefrom=30000;year=2024');
    expect(unfiltered).toBe(5220);
    // EX-SCR-46 : le « <n> offres » affiché est celui de la SÉLECTION. Ici il est identique au
    // compte non filtré : quatre filtres n'ont eu aucun effet.
    expect(filtered, 'la sélection filtrée doit produire un compte différent').not.toBe(unfiltered);
  });

  it('R-D9-01b — `fetchAggregates` renvoie les comptes non filtrés en les étiquetant de la sélection demandée', async () => {
    const { p } = provider();
    const handle = await p.openSnapshot();
    const result = await p.fetchAggregates(handle, 'fuel=D;make=54;year=2024', 'MAKE');
    expect(result.selection).toBe('fuel=D;make=54;year=2024'); // étiquette « sélection appliquée »
    // …alors que le chiffre est le compte brut de la marque, tous carburants et toutes années.
    expect(result.rows[0]?.listingCount, 'compte de la sélection, pas de la marque entière').not.toBe(5220);
  });

  it('preuve de R-D9-01 — la couche de requête ne connaît que marketplace/brandSlug/modelSlug/page', async () => {
    const { p, calls } = provider();
    const handle = await p.openSnapshot();
    await p.fetchAggregates(handle, 'fuel=D;make=54;pricefrom=30000', 'MAKE');
    const requestKeys = new Set(calls.flatMap((c) => Object.keys(c)));
    // La requête ne connaît que marketplace/brandSlug/modelSlug/page : aucune facette de filtre.
    expect([...requestKeys].sort()).toEqual(['brandSlug', 'marketplace', 'modelSlug', 'page']);
    expect(requestKeys.has('fuel')).toBe(false);
  });

  it('R-D9-21 — le provider n’est câblé nulle part : l’application sert le mode 1 SYNTHÉTIQUE', () => {
    const main = readFileSync(fileURLToPath(new URL('../../../src/main.tsx', import.meta.url)), 'utf8');
    expect(main.includes('SyntheticDataProvider')).toBe(true);
    expect(main.includes('TweedehandsDataProvider'), 'mode 1 réel servi par l’application').toBe(true);
  });

  it('R-D9-19 — EX-NFR-26 : ni le provider ni /mentions ne nomment la source réelle ni ses conditions', () => {
    const mentions = readFileSync(
      fileURLToPath(new URL('../../../src/screens/mentions/MentionsPage.tsx', import.meta.url)),
      'utf8',
    );
    expect(
      /2dehands|marktplaats|Adevinta/i.test(mentions),
      'la page /mentions doit nommer la source réelle et ses conditions (robots.txt / CGU)',
    ).toBe(true);
  });
});
