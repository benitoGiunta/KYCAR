/**
 * KYCAR — Partage d'URL et canonisation (PLAN-2 §2.9a, `EX-NAV-18`..`22`, `EX-SCR-140`)
 * =================================================================================================
 * `EX-NAV-18` — toute URL de l'application doit être ouvrable directement et reproduire EXACTEMENT
 * l'état qu'elle décrit, sans dépendre d'une navigation préalable ni d'un état en mémoire. La seule
 * preuve honnête est celle-ci : produire l'URL par l'interface, puis la rouvrir dans un CONTEXTE
 * NAVIGATEUR NEUF (profil vierge, aucun `localStorage`, aucun cache applicatif) et comparer.
 * `EX-NAV-10`/`11` — plafond de 2 000 caractères, refus explicite, jamais de troncature.
 * `EX-NAV-21`/`22` — table de corrections à la lecture d'une URL, chacune signalée par
 * `ET-URL-CORRIGEE` et réécrite par `replaceState`.
 * `EX-SCR-140`/`DR-099` — routes héritées et slugs erronés canonisés par `replaceState`.
 * `EX-NAV-19`/`20` — marque inconnue, modèle hors marque : écrans d'erreur nommés.
 */
import { test, expect, type Browser, type Page } from '@playwright/test';

import {
  P1_QUERY,
  P2_PATH,
  SURFACES,
  applyFilterSheet,
  constat,
  mesure,
  open,
  openFilterSheet,
  readMarketSummary,
  readSelectionCount,
  regimeOf,
  waitForMarket,
} from './_helpers';

/** Ouvre une URL dans un contexte NEUF (profil vierge) et rend la page, à charge de l'appelant de fermer. */
async function openInFreshContext(browser: Browser, url: string): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'commit' });
  return { page, close: () => context.close() };
}

/** Signature d'état d'un écran A : effectifs affichés + jetons de filtres actifs. */
async function marketSignature(page: Page): Promise<string> {
  await waitForMarket(page);
  const summary = await readMarketSummary(page);
  const tokens = (await page.locator('.kycar-filter-band').getAttribute('data-active-count')) ?? '';
  const list = page.locator('.kycar-active-tokens__list');
  const tokenText = ((await list.count()) === 0 ? '' : await list.innerText()).replace(/\s+/g, ' ').trim();
  return `${summary.makes}|${summary.offers}|${tokens}|${tokenText}`;
}

test.describe('EX-NAV-18 — une URL suffit à reconstituer l’état', () => {
  test('un état de mode 1 produit par le bandeau, rouvert dans un contexte NEUF, rend le même écran', async ({
    page,
    browser,
  }, testInfo) => {
    // D8-15/D-31 : la coquille fournit désormais `regime` au bandeau, donc le régime compact
    // d'`EX-SCR-97` (feuille plein écran, application différée) est réellement atteignable. Le
    // parcours mesuré (poser deux filtres, partager l'URL, la rouvrir dans un contexte neuf) est
    // identique ; seul le chemin d'interaction suit le régime.
    const compact = regimeOf(testInfo) === 'compact';
    await open(page, SURFACES.A);
    await openFilterSheet(page, compact);
    await page.locator('.kycar-primary-line').getByLabel('Prix à', { exact: true }).fill('20000');
    if (!compact) {
      await page.waitForFunction(() => window.location.search.includes('priceto=20000'), null, { timeout: 20_000 });
    }
    await page.getByLabel('Coupé', { exact: true }).check();
    await applyFilterSheet(page, compact);
    await page.waitForFunction(() => window.location.search.includes('body=3'), null, { timeout: 20_000 });
    await page.waitForFunction(() => window.location.search.includes('priceto=20000'), null, { timeout: 20_000 });
    await waitForMarket(page);

    const shared = page.url();
    const original = await marketSignature(page);

    const fresh = await openInFreshContext(browser, shared);
    const reopened = await marketSignature(fresh.page);
    mesure(testInfo, 'EX-NAV-18 — signature mode 1 (origine / contexte neuf)', `${original} // ${reopened}`);
    expect(fresh.page.url()).toBe(shared);
    expect(reopened).toBe(original);
    await fresh.close();
  });

  test('un état de mode 2 avec projection et brossage, rouvert dans un contexte NEUF, rend le même écran', async ({
    page,
    browser,
  }, testInfo) => {
    // État d'interface complet : filtre R, variante de nuage, bornes de brossage (`EX-NAV-10bis`).
    const shared = `${P2_PATH}?fregfrom=2017&fregto=2017&g4v=a&selx=0.1-0.5&sely=0.2-0.8`;
    await open(page, shared);
    const count = await readSelectionCount(page);
    const search = new URL(page.url()).search;

    const fresh = await openInFreshContext(browser, shared);
    await expect(fresh.page.locator('.kycar-stat-header')).toBeVisible({ timeout: 60_000 });
    const reopenedCount = await readSelectionCount(fresh.page);
    const reopenedSearch = new URL(fresh.page.url()).search;

    mesure(testInfo, 'EX-NAV-18 — signature mode 2 (origine / contexte neuf)', `${count} // ${reopenedCount}`);
    expect(reopenedCount).toBe(count);
    expect(reopenedSearch).toBe(search);
    // La projection et le brossage décrits par l'URL sont conservés tels quels.
    expect(reopenedSearch).toContain('g4v=a');
    expect(reopenedSearch).toContain('selx=0.1-0.5');
    expect(reopenedSearch).toContain('sely=0.2-0.8');
    await expect(fresh.page).toHaveTitle('KYCAR — Distribution d’un modèle · Opel Corsa');
    await fresh.close();
  });

  test('EX-NAV-11 — au-delà de 2 000 caractères, la modification de filtre est REFUSÉE avec son message', async ({
    page,
  }, testInfo) => {
    // Requête déjà à 1 997 caractères : le moindre filtre supplémentaire dépasse le plafond.
    const keyword = 'a'.repeat(1985);
    await open(page, `/marche?kwd=${keyword}`);
    const lengthBefore = await page.evaluate(() => window.location.pathname.length + window.location.search.length);
    expect(lengthBefore).toBeLessThanOrEqual(2_000);

    // D8-15/D-31 : en régime compact les contrôles ne sont montés que dans la feuille plein écran
    // (`EX-SCR-97`) ; le refus de plafond est le MÊME, il est simplement exercé là où le contrôle
    // existe désormais.
    await openFilterSheet(page, regimeOf(testInfo) === 'compact');
    const checkbox = page.locator('#filter-bodyType-3');
    await checkbox.click();

    const banner = page.locator('.kycar-banner-message');
    await expect(banner).toBeVisible({ timeout: 20_000 });
    const text = await banner.innerText();
    mesure(testInfo, 'EX-NAV-11 — message de plafond d’URL', text.replace(/\n/g, ' '));
    expect(text).toContain("limite d'URL atteinte, retirez un filtre pour en ajouter un autre");

    // Refus, jamais troncature : l'URL et l'état du contrôle sont inchangés.
    expect(await page.evaluate(() => window.location.search.includes('body='))).toBe(false);
    await expect(checkbox).not.toBeChecked();
  });

  test('EX-SCR-140 / DR-099 — routes héritées et slug erroné canonisés par replaceState', async ({ page }, testInfo) => {
    const cases: readonly [string, string][] = [
      ['/', '/marche'],
      ['/modele/54/1918', '/marche/54-opel/1918-corsa'],
      ['/marche/54-nawak/1918-bidon', '/marche/54-opel/1918-corsa'],
    ];
    for (const [from, expected] of cases) {
      await page.goto(from, { waitUntil: 'commit' });
      await expect.poll(() => new URL(page.url()).pathname, { timeout: 60_000 }).toBe(expected);
      // `replaceState`, jamais `pushState` : la canonisation n'ajoute PAS d'entrée d'historique, donc
      // un retour arrière ne peut pas ramener sur la forme héritée.
      await page.goBack().catch(() => null);
      const afterBack = new URL(page.url()).pathname;
      mesure(testInfo, `EX-SCR-140 — ${from}`, `${expected} ; retour arrière → ${afterBack}`);
      expect(afterBack).not.toBe(from === '/' ? '/' : from);
    }
  });

  test('la requête est conservée mot pour mot par la canonisation de route (EX-SCR-140)', async ({ page }) => {
    await page.goto(`/modele/54/1918?fregfrom=2017&fregto=2017`, { waitUntil: 'commit' });
    await expect.poll(() => new URL(page.url()).pathname, { timeout: 60_000 }).toBe('/marche/54-opel/1918-corsa');
    expect(new URL(page.url()).search).toBe('?fregfrom=2017&fregto=2017');
  });

  test('EX-NAV-19 / EX-NAV-20 — marque inconnue et modèle hors marque : écrans d’erreur nommés, filtres conservés', async ({
    page,
  }) => {
    await page.goto(`/marche/99999-zzz/1-xx${P1_QUERY}`, { waitUntil: 'commit' });
    await expect(page.getByRole('heading', { name: 'Marque inconnue' })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#kycar-main')).toContainText('99999');
    const back = page.getByRole('link', { name: /Revenir au marché/ });
    await expect(back).toBeVisible();
    await back.click();
    await waitForMarket(page);
    // `EX-NAV-19` — les filtres posés sont conservés au retour.
    expect(new URL(page.url()).search).toBe(P1_QUERY);

    await page.goto('/marche/54-opel/999999-fantome', { waitUntil: 'commit' });
    await expect(page.getByRole('heading', { name: 'Ce modèle n’existe pas pour cette marque' })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('#kycar-main')).toContainText('999999');
  });

  test('CONSTAT E2E-26 — aucune correction d’URL n’est signalée ni réécrite (EX-NAV-21, EX-NAV-22, ET-URL-CORRIGEE)', async ({
    page,
  }, testInfo) => {
    // D8-03/D8-26 (CORRIGÉ) : la coquille CONSOMME `loadQuery(...).corrections` — réécriture
    // `replaceState` vers la requête canonique et bandeau `ET-URL-CORRIGEE` au format normatif.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-26',
      'EX-NAV-21/EX-NAV-22',
      'src/app.tsx appelle loadQuery(location.search) mais n’en lit QUE .selection : la liste .corrections est jetée. Aucune des quatre classes de défaut d’EX-NAV-21 ne produit le bandeau ET-URL-CORRIGEE (EX-SCR-38bis), et l’URL n’est jamais réécrite par replaceState — un lien reçu avec « pricefrom=20000&priceto=5000 » affiche 48 786 offres calculées sur l’intervalle PERMUTÉ tout en gardant l’URL inversée dans la barre d’adresse, et « body=ZZZ » est ignoré en silence',
    );

    const cases: readonly { url: string; canonical: string; label: string }[] = [
      { url: '/marche?pricefrom=20000&priceto=5000', canonical: '?pricefrom=5000&priceto=20000', label: 'intervalle inversé (EX-NAV-22)' },
      { url: '/marche?body=ZZZ&priceto=20000', canonical: '?priceto=20000', label: 'code énuméré inconnu' },
      { url: '/marche?priceto=99999999', canonical: '?priceto=100000', label: 'borne hors domaine (écrêtée)' },
      { url: '/marche?zzzz=1&priceto=20000', canonical: '?priceto=20000', label: 'paramètre inconnu' },
    ];

    const silent: string[] = [];
    for (const { url, canonical, label } of cases) {
      await open(page, url);
      const banners = await page.locator('.status-banner').allInnerTexts();
      const signalled = banners.some((b) => /corrigé|corrigée/i.test(b));
      const rewritten = new URL(page.url()).search === canonical;
      if (!signalled || !rewritten) {
        silent.push(`${label} : signalé=${signalled}, réécrit=${rewritten} (URL ${new URL(page.url()).search})`);
      }
    }
    mesure(testInfo, 'EX-NAV-21 — corrections appliquées en silence', silent.join(' ; ') || '(aucune)');
    expect(silent).toEqual([]);
  });
});
