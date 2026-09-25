/**
 * KYCAR — recette de la SOURCE DE DONNÉES (phase 3.5, `D3-01`, `DF-2`)
 * =================================================================================================
 * Le MVP est livré sur des données FICTIVES (`fixture:test`). Deux exigences en découlent, et elles
 * sont exercées ici sur le build de production, pas sur un composant isolé :
 *
 *   1. **`EX-DATA-107`** — l'utilisateur ne doit jamais pouvoir croire que ces chiffres viennent
 *      d'un marché réel. La nature de la source est écrite sur TOUS les écrans (bandeau), dans le
 *      pied de page, dans `/mentions` et dans l'en-tête des exports CSV. Le pied de page ne doit
 *      surtout PAS annoncer « Source : AutoScout24 » sur un jeu fictif.
 *   2. **`DF-2`** — « brancher une autre source est un PARAMÈTRE, pas une recompilation » :
 *      `?provider=` bascule la source de bout en bout (URL → registre → provider → étiquette), et
 *      une spécification inconnue retombe sur le défaut AVEC un avertissement VISIBLE.
 */
import { test, expect, type Page } from '@playwright/test';

import {
  applyFilters,
  derived,
  mesure,
  open,
  openFilterSheet,
  openNav,
  readMarketSummary,
  regimeOf,
  waitForMarket,
} from './_helpers';

/** Le texte que doit porter l'étiquette d'un jeu de fixtures, quel que soit l'écran. */
const FIXTURE_TEXT = /jeu de données fictif à la forme autoscout24/i;

test.describe('EX-DATA-107 — la nature FIXTURE est dite partout', () => {
  test('bandeau d’en-tête : le jeu fictif est nommé sur l’écran A, avec son profil', async ({ page }, testInfo) => {
    await open(page, '/marche');
    const banner = page.locator('.kycar-banner-source');
    await expect(banner).toBeVisible();
    const text = await banner.innerText();
    mesure(testInfo, 'EX-DATA-107 — étiquette de source', text);
    expect(text).toMatch(FIXTURE_TEXT);
    expect(text).toMatch(/aucune annonce réelle/i);
    expect(text).toMatch(/profil test/i);
  });

  test('pied de page : la mention légale n’attribue RIEN à AutoScout24 sur un jeu fictif', async ({ page }) => {
    await open(page, '/marche');
    const legal = page.locator('.kycar-footer-legal');
    await expect(legal).toBeVisible();
    const text = await legal.innerText();
    expect(text).not.toMatch(/^Source\s*:\s*AutoScout24/i);
    expect(text).toMatch(FIXTURE_TEXT);
    expect(text).toMatch(/aucune annonce réelle/i);
  });

  test('/mentions : la phrase de provenance existe et nomme le jeu fictif', async ({ page }) => {
    await open(page, '/mentions');
    const provenance = page.locator('.kycar-mentions-provenance');
    await expect(provenance).toBeVisible();
    const text = await provenance.innerText();
    expect(text).toMatch(FIXTURE_TEXT);
    // La traçabilité du snapshot servi accompagne la nature (identifiant du provider, capture).
    expect(text).toMatch(/kycar-fixture-test|source :/i);
  });

  test('panneau Diagnostic : la nature relayée par describe() est FIXTURE, jamais REAL', async ({ page }) => {
    await open(page, '/marche');
    const source = page.locator('.kycar-footer-diagnostic dd').nth(1);
    await expect(source).toHaveText('FIXTURE');
  });

  test('l’écran A sert bien le snapshot le plus récent du profil (traçabilité EX-DATA-106)', async ({ page }) => {
    await open(page, '/marche');
    const attendu = await derived();
    const snapshotCell = page.locator('.kycar-footer-diagnostic dd').nth(2);
    await expect(snapshotCell).toHaveText(attendu.snapshotId);
    expect((await readMarketSummary(page)).offers).toBe(attendu.listingCount);
  });
});

test.describe('DF-2 — la bascule de source est un paramètre d’URL', () => {
  test('?provider=fixture:dev charge l’autre profil et l’étiquette le DIT', async ({ page }, testInfo) => {
    await page.goto('/marche?provider=fixture:dev', { waitUntil: 'commit' });
    await waitForMarket(page);
    const text = await page.locator('.kycar-banner-source').innerText();
    mesure(testInfo, 'DF-2 — étiquette sous ?provider=fixture:dev', text);
    expect(text).toMatch(FIXTURE_TEXT);
    expect(text).toMatch(/profil dev/i);
    // Le profil `dev` est plus petit que le profil `test` : la bascule change les DONNÉES servies,
    // pas seulement le libellé.
    const dev = await readMarketSummary(page);
    expect(dev.offers).toBeGreaterThan(0);
    expect(dev.offers).toBeLessThan((await derived()).listingCount);
    // Aucun avertissement de repli : la spécification est reconnue et câblée.
    await expect(page.locator('.kycar-banner-source-fallback')).toHaveCount(0);
  });

  test('?provider=synthetic bascule sur le jeu synthétique, avec SON étiquette', async ({ page }, testInfo) => {
    await page.goto('/marche?provider=synthetic', { waitUntil: 'commit' });
    await waitForMarket(page);
    const text = await page.locator('.kycar-banner-source').innerText();
    mesure(testInfo, 'DF-2 — étiquette sous ?provider=synthetic', text);
    expect(text).toMatch(/données synthétiques/i);
    expect(text).not.toMatch(FIXTURE_TEXT);
    await expect(page.locator('.kycar-footer-diagnostic dd').nth(1)).toHaveText('SYNTHETIC');
    await expect(page.locator('.kycar-banner-source-fallback')).toHaveCount(0);
  });

  test('?provider=<inconnu> retombe sur le défaut AVEC un avertissement visible (D-03)', async ({
    page,
  }, testInfo) => {
    await page.goto('/marche?provider=carrosserie-de-mon-oncle', { waitUntil: 'commit' });
    await waitForMarket(page);

    const fallback = page.locator('.kycar-banner-source-fallback');
    await expect(fallback).toBeVisible();
    const text = await fallback.innerText();
    mesure(testInfo, 'DF-2 — avertissement de repli', text.replace(/\n/g, ' '));
    expect(text).toMatch(/inconnue/i);
    expect(text).toMatch(/carrosserie-de-mon-oncle/);
    expect(text).toMatch(/fixture:test/);

    // Le repli est RÉEL : c'est bien la source par défaut qui sert.
    await expect(page.locator('.kycar-footer-diagnostic dd').nth(1)).toHaveText('FIXTURE');
    expect((await readMarketSummary(page)).offers).toBe((await derived()).listingCount);
  });

  test('?provider=tweedehands (non câblé) est REFUSÉ avec son motif, jamais appliqué en silence', async ({
    page,
  }, testInfo) => {
    await page.goto('/marche?provider=tweedehands', { waitUntil: 'commit' });
    await waitForMarket(page);
    const text = await page.locator('.kycar-banner-source-fallback').innerText();
    mesure(testInfo, 'DF-2 — refus d’une source non câblée', text.replace(/\n/g, ' '));
    expect(text).toMatch(/non branchée/i);
    expect(text).toMatch(/AC-01/);
    await expect(page.locator('.kycar-footer-diagnostic dd').nth(1)).toHaveText('FIXTURE');
  });
});

/* ================================================================================================
 * ACC-20 — la bascule de source SURVIT dans l'URL (recette rev 3 §8, `DF-2`, `EX-NAV-21`, `D-03`)
 * ================================================================================================
 * Constat : toute URL portant `?provider=` était réécrite SANS le paramètre dès le chargement, avec
 * le bandeau « Paramètre « provider » corrigé : paramètre inconnu ignoré » — alors que la source
 * demandée AVAIT été appliquée. Un `F5` ou la copie de l'URL revenaient donc à `fixture:test`, et le
 * bandeau annonçait « ignoré » ce qui avait été appliqué (contraire à `D-03`).
 *
 * `DF-2` : `?provider=` est « le plus explicite, et le SEUL qui se partage dans un lien ». Ce qui se
 * partage doit survivre au chargement, à la pose d'un filtre, à un changement d'écran et à un
 * rechargement — c'est ce que ces sondes exercent, dans cet ordre.
 */
test.describe('ACC-20 — le paramètre de bascule survit à chaque écriture d’URL', () => {
  test('?provider=synthetic : conservé au chargement, sans bandeau « corrigé »', async ({ page }, testInfo) => {
    await page.goto('/marche?provider=synthetic', { waitUntil: 'commit' });
    await waitForMarket(page);

    const url = new URL(page.url());
    mesure(testInfo, 'ACC-20 — URL après chargement', `${url.pathname}${url.search}`);
    expect(url.searchParams.get('provider')).toBe('synthetic');

    // Aucun bandeau de correction d'URL : le paramètre est RÉSERVÉ, pas « inconnu » (EX-NAV-21).
    await expect(page.locator('.kycar-banner-url-corrected')).toHaveCount(0);
    const banners = await page.locator('.status-banner').allInnerTexts();
    expect(banners.filter((b) => /corrigé|corrigée/i.test(b))).toEqual([]);
    // La source demandée est bien celle qui sert.
    await expect(page.locator('.kycar-footer-diagnostic dd').nth(1)).toHaveText('SYNTHETIC');
  });

  test('?provider=synthetic : conservé après la pose d’un filtre, un changement d’écran et un F5', async ({
    page,
  }, testInfo) => {
    const compact = regimeOf(testInfo) === 'compact';
    await page.goto('/marche?provider=synthetic', { waitUntil: 'commit' });
    await waitForMarket(page);

    // (1) pose d'un filtre réel : l'URL est réécrite par la coquille.
    // D-31 (`ux-filters`, décision D3-46) : la saisie va dans un brouillon, appliqué par
    // « Appliquer » dans TOUS les régimes (plus seulement dans la feuille compacte).
    await openFilterSheet(page, compact);
    await page.locator('.kycar-primary-line').getByLabel('Prix à', { exact: true }).fill('20000');
    await applyFilters(page);
    await page.waitForFunction(() => window.location.search.includes('priceto=20000'), null, { timeout: 20_000 });
    const afterFilter = new URL(page.url());
    mesure(testInfo, 'ACC-20 — URL après pose d’un filtre', `${afterFilter.pathname}${afterFilter.search}`);
    expect(afterFilter.searchParams.get('provider')).toBe('synthetic');
    expect(afterFilter.searchParams.get('priceto')).toBe('20000');

    // (2) navigation vers un autre écran, puis retour : le paramètre voyage avec l'utilisateur.
    await openNav(page);
    await page.getByRole('link', { name: 'Recherches', exact: true }).click();
    await expect(page.locator('#kycar-main h1').first()).toBeVisible({ timeout: 20_000 });
    expect(new URL(page.url()).searchParams.get('provider')).toBe('synthetic');
    await page.goBack();
    await waitForMarket(page);
    expect(new URL(page.url()).searchParams.get('provider')).toBe('synthetic');

    // (3) rechargement : la source servie est encore la source demandée (le cœur d'ACC-20).
    await page.reload({ waitUntil: 'commit' });
    await waitForMarket(page);
    expect(new URL(page.url()).searchParams.get('provider')).toBe('synthetic');
    await expect(page.locator('.kycar-footer-diagnostic dd').nth(1)).toHaveText('SYNTHETIC');
    await expect(page.locator('.kycar-banner-source')).toContainText(/données synthétiques/i);
  });

  test('?provider=<inconnu> : le repli est dit ET la demande reste lisible dans l’URL (D-03)', async ({
    page,
  }, testInfo) => {
    await page.goto('/marche?provider=carrosserie-de-mon-oncle', { waitUntil: 'commit' });
    await waitForMarket(page);

    // Décision fix-app-4 (recommandation du coordinateur) : la valeur inconnue est CONSERVÉE — une
    // URL partageable doit montrer ce qui a été DEMANDÉ ; ce qui est SERVI est dit par le bandeau.
    const url = new URL(page.url());
    mesure(testInfo, 'ACC-20 — URL après repli de source', `${url.pathname}${url.search}`);
    expect(url.searchParams.get('provider')).toBe('carrosserie-de-mon-oncle');
    await expect(page.locator('.kycar-banner-source-fallback')).toBeVisible();
    // Le repli se dit par `ET-SOURCE-REPLI`, jamais par « paramètre inconnu ignoré ».
    await expect(page.locator('.kycar-banner-url-corrected')).toHaveCount(0);
    await expect(page.locator('.kycar-footer-diagnostic dd').nth(1)).toHaveText('FIXTURE');
  });
});

/* ================================================================================================
 * ACC-24 — la `coverageNote` est lisible quelque part (`D3-34 (d)`, décision : ligne Diagnostic)
 * ============================================================================================== */
test.describe('ACC-24 — note de couverture du snapshot', () => {
  test('le panneau Diagnostic porte une ligne « Note de couverture » non vide', async ({ page }, testInfo) => {
    await open(page, '/marche');
    const ligne = page
      .locator('.kycar-footer-diagnostic dl > div')
      .filter({ hasText: 'Note de couverture' });
    await expect(ligne).toHaveCount(1);
    // Le panneau Diagnostic est un `<details>` REPLIÉ : `innerText` d'un contenu non rendu est vide.
    // On lit le texte du document (`textContent`), comme les autres sondes du panneau (`toHaveText`).
    const texte = ((await ligne.locator('dd').textContent()) ?? '').trim();
    mesure(testInfo, 'ACC-24 — note de couverture', texte.replace(/\n/g, ' ').slice(0, 200));
    expect(texte.length).toBeGreaterThan(20);
    expect(texte).not.toBe('—');
    expect(texte).not.toBe('aucune');
  });
});

/* ================================================================================================
 * ACC-26 — la source SERVIE est toujours celle que l'URL COURANTE nomme (recette rev 4 §8)
 * ================================================================================================
 * Constat : une recherche enregistrée depuis `/marche?priceto=20000&provider=synthetic` est stockée
 * avec son paramètre (D3-43 b), mais « Ouvrir » navigue EN INTERNE (`pushState`) : le provider ayant
 * été choisi UNE fois au démarrage par `main.tsx`, l'URL nommait `synthetic` pendant que l'écran
 * servait le jeu par défaut, sans un mot — et la carte de l'écran E comparait l'effectif figé d'une
 * source à l'effectif actuel d'une AUTRE (« 76 437 à la création · 11 652 actuellement · − 64 785 »).
 *
 * Règle posée par la remédiation (`D-03`, `DF-2`) : **l'URL est la déclaration partageable de la
 * source ; la source servie est toujours celle que l'URL courante nomme.** Toute navigation interne
 * dont la cible RÉSOUT une spécification différente de celle amorcée devient une navigation
 * COMPLÈTE (`location.assign`), qui fait ré-amorcer `main.tsx` sur la bonne source.
 */
test.describe('ACC-26 — ouvrir une recherche enregistrée sous une AUTRE source', () => {
  /** Barre d'outils d'écran : enregistrement de la recherche courante (`EX-CRUD-1`). */
  async function saveSearch(page: Page, name: string): Promise<void> {
    await page.locator('.kycar-market-toolbar').getByRole('button', { name: 'Enregistrer cette recherche' }).first().click();
    await page.getByPlaceholder('Nom de la recherche').fill(name);
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await expect(page.locator('.kycar-banner-message')).toContainText('Recherche enregistrée', { timeout: 20_000 });
  }

  const savedRow = (page: Page, name: string) => page.locator('.kycar-saved-row', { hasText: name });
  const diagnosticSource = (page: Page) => page.locator('.kycar-footer-diagnostic dd').nth(1);

  test('enregistrée sous ?provider=synthetic, rouverte depuis une page amorcée par DÉFAUT : la source suit l’URL', async ({
    page,
  }, testInfo) => {
    await page.goto('/marche?priceto=20000&provider=synthetic', { waitUntil: 'commit' });
    await waitForMarket(page);
    await expect(diagnosticSource(page)).toHaveText('SYNTHETIC');
    await saveSearch(page, 'Budget 20k synthétique');

    // Page amorcée par DÉFAUT (`fixture:test`) : l'écran E liste une recherche d'une AUTRE source.
    await open(page, '/recherches');
    const row = savedRow(page, 'Budget 20k synthétique');
    await expect(row).toBeVisible({ timeout: 20_000 });
    const carte = (await row.innerText()).replace(/\n+/g, ' · ');
    mesure(testInfo, 'ACC-26 — carte d’une recherche d’une autre source', carte);

    // `EX-SCR-212`/`213` : jamais un delta entre DEUX sources, ni un « effectif actuel » d'une autre.
    await expect(row.locator('.kycar-saved-delta')).toHaveCount(0);
    expect(carte).not.toMatch(/offres actuellement/);
    expect(carte).toMatch(/source\s*:\s*synthétique/i);
    expect(carte).toMatch(/ouvrir pour recalculer/i);

    // « Ouvrir » : l'URL nomme `synthetic`, l'écran DOIT servir `synthetic`.
    await row.getByRole('button', { name: 'Ouvrir' }).click();
    await waitForMarket(page);
    const url = new URL(page.url());
    mesure(testInfo, 'ACC-26 — URL après Ouvrir', `${url.pathname}${url.search}`);
    expect(url.searchParams.get('provider')).toBe('synthetic');
    expect(url.searchParams.get('priceto')).toBe('20000');
    await expect(diagnosticSource(page)).toHaveText('SYNTHETIC');
    await expect(page.locator('.kycar-banner-source')).toContainText(/données synthétiques/i);
  });

  test('enregistrée sous ?provider=fixture:test, rouverte depuis une page amorcée SYNTHETIC : symétrique', async ({
    page,
  }, testInfo) => {
    await page.goto('/marche?priceto=20000&provider=fixture:test', { waitUntil: 'commit' });
    await waitForMarket(page);
    await expect(diagnosticSource(page)).toHaveText('FIXTURE');
    await saveSearch(page, 'Budget 20k fixtures');

    await page.goto('/recherches?provider=synthetic', { waitUntil: 'commit' });
    await expect(page.locator('#kycar-main h1').first()).toBeVisible({ timeout: 60_000 });
    const row = savedRow(page, 'Budget 20k fixtures');
    await expect(row).toBeVisible({ timeout: 20_000 });
    const carte = (await row.innerText()).replace(/\n+/g, ' · ');
    mesure(testInfo, 'ACC-26 — carte (sens inverse)', carte);
    await expect(row.locator('.kycar-saved-delta')).toHaveCount(0);
    expect(carte).not.toMatch(/offres actuellement/);
    expect(carte).toMatch(/source\s*:\s*fixtures, profil test/i);

    await row.getByRole('button', { name: 'Ouvrir' }).click();
    await waitForMarket(page);
    const url = new URL(page.url());
    mesure(testInfo, 'ACC-26 — URL après Ouvrir (sens inverse)', `${url.pathname}${url.search}`);
    expect(url.searchParams.get('provider')).toBe('fixture:test');
    await expect(diagnosticSource(page)).toHaveText('FIXTURE');
    await expect(page.locator('.kycar-banner-source')).toContainText(FIXTURE_TEXT);
  });

  test('enregistrée SANS `?provider=` (donc sous la source par défaut), listée dans une session SYNTHETIC : aucun écart', async ({
    page,
  }, testInfo) => {
    // Une recherche enregistrée depuis une URL qui ne NOMME aucune source a été créée sous la source
    // par défaut (`ACC-20` garantit qu'une session non par défaut aurait porté le paramètre). Son
    // effectif figé vient donc de CETTE source : la session synthétique qui la liste ne peut pas lui
    // opposer un effectif actuel — ce serait le même écart entre deux sources qu'`ACC-26`.
    await open(page, '/marche?priceto=20000');
    await expect(diagnosticSource(page)).toHaveText('FIXTURE');
    await saveSearch(page, 'Budget 20k par défaut');

    await page.goto('/recherches?provider=synthetic', { waitUntil: 'commit' });
    await expect(page.locator('#kycar-main h1').first()).toBeVisible({ timeout: 60_000 });
    const row = savedRow(page, 'Budget 20k par défaut');
    await expect(row).toBeVisible({ timeout: 20_000 });
    const carte = (await row.innerText()).replace(/\n+/g, ' · ');
    mesure(testInfo, 'ACC-26 — carte d’une recherche enregistrée sans paramètre', carte);
    await expect(row.locator('.kycar-saved-delta')).toHaveCount(0);
    expect(carte).not.toMatch(/offres actuellement/);
    expect(carte).toMatch(/source\s*:\s*fixtures, profil test/i);
  });

  test('MÊME source : l’ouverture reste une navigation INTERNE (aucun rechargement inutile)', async ({
    page,
  }, testInfo) => {
    await page.goto('/marche?priceto=20000&provider=synthetic', { waitUntil: 'commit' });
    await waitForMarket(page);
    await saveSearch(page, 'Synthétique interne');

    // Navigation interne vers l'écran E : le paramètre réservé voyage (`ACC-20`).
    await openNav(page);
    await page.getByRole('link', { name: 'Recherches', exact: true }).click();
    await expect(page.locator('#kycar-main h1').first()).toBeVisible({ timeout: 20_000 });
    expect(new URL(page.url()).searchParams.get('provider')).toBe('synthetic');

    const row = savedRow(page, 'Synthétique interne');
    await expect(row).toBeVisible({ timeout: 20_000 });
    // Même source : l'effectif actuel EST calculable, et il est affiché.
    await expect(row.locator('.kycar-saved-current')).toContainText(/offres actuellement/, { timeout: 30_000 });

    // Témoin de DOCUMENT : il ne survit qu'à une navigation interne.
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>)['__kycarAcc26'] = 'même document';
    });
    await row.getByRole('button', { name: 'Ouvrir' }).click();
    await waitForMarket(page);
    const temoin = await page.evaluate(
      () => (window as unknown as Record<string, unknown>)['__kycarAcc26'] ?? null,
    );
    mesure(testInfo, 'ACC-26 — témoin de document après Ouvrir (même source)', String(temoin));
    expect(temoin).toBe('même document');
    await expect(diagnosticSource(page)).toHaveText('SYNTHETIC');
  });
});
