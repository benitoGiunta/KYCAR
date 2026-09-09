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
  derived,
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

  /**
   * `ACC-01` / `D8-41` (`EX-SCR-221`, `D-03` « jamais ignoré en silence », `D8-20`, `EX-NAV-18`).
   * La recette 2.9b a constaté qu'en mode 2 le filtre Carrosserie n'était NI appliqué NI déclaré :
   * l'effectif de la cellule entière (1 352) s'affichait sous un jeton « Carrosserie : Coupé »
   * actif, sans le bandeau normatif. Le chiffre n'est pas faux — la carrosserie n'est pas résoluble
   * au modèle tant que `Model.bodyTypes` est vide (`O15`) —, c'est la MENTION qui manquait. Ce test
   * fixe les trois faits ensemble : jeton présent, effectif INCHANGÉ, écart NOMMÉ.
   */
  test('ACC-01 — en mode 2, un filtre Carrosserie d’URL est déclaré non appliqué, sans changer l’effectif', async ({
    page,
  }, testInfo) => {
    await open(page, `${P2_PATH}?body=3`);
    const withFilter = await readSelectionCount(page);

    // (1) l'effectif est celui de la CELLULE ENTIÈRE : la vérité terrain de `tests/review/D8`.
    expect(withFilter).toBe((await derived()).corsaTotal);

    // (2) le jeton de filtre est bien actif — l'utilisateur croit son critère posé…
    await expect(page.locator('.kycar-active-tokens__list')).toContainText('Carrosserie');

    // (3) …et l'application le lui dit, au mot près (`D8-20`).
    const banner = page.locator('[data-banner-id="ET-FILTRE-NON-APPLIQUE-BODY"]');
    await expect(banner).toBeVisible({ timeout: 20_000 });
    const text = (await banner.innerText()).replace(/\s+/g, ' ');
    mesure(testInfo, 'ACC-01 — bandeau de filtre non appliqué (mode 2)', `${withFilter} offres ; ${text}`);
    expect(text).toContain('Filtre Carrosserie non appliqué à ce modèle (donnée indisponible)');
    expect(text).toContain('l’effectif affiché est complet, mais il ne tient pas compte de ce critère');

    // Le bandeau est propre au mode 2 : sans le filtre, rien n'est déclaré (pas de faux positif).
    await open(page, P2_PATH);
    expect(await readSelectionCount(page)).toBe((await derived()).corsaTotal);
    await expect(page.locator('[data-banner-id="ET-FILTRE-NON-APPLIQUE-BODY"]')).toHaveCount(0);
  });

  test('EX-NAV-11 — au-delà de 2 000 caractères, la modification de filtre est REFUSÉE avec son message', async ({
    page,
  }, testInfo) => {
    // Requête déjà à 1 997 caractères : le moindre filtre supplémentaire dépasse le plafond.
    const keyword = 'a'.repeat(1985);
    await open(page, `/marche?kwd=${keyword}`);
    const lengthBefore = await page.evaluate(() => window.location.pathname.length + window.location.search.length);
    expect(lengthBefore).toBeLessThanOrEqual(2_000);

    // D8-15/D-31 : en régime COMPACT les contrôles ne sont montés que dans la feuille plein écran
    // (`EX-SCR-97`), à application DIFFÉRÉE : le plafond d'URL est donc éprouvé au moment de
    // l'application, pas à la coche du brouillon. Le fait mesuré — la pose est REFUSÉE, avec son
    // message, et l'URL n'est ni tronquée ni modifiée — est identique dans les deux régimes.
    const compact = regimeOf(testInfo) === 'compact';
    await openFilterSheet(page, compact);
    const checkbox = page.locator('#filter-bodyType-3');
    await checkbox.click();
    if (compact) await page.locator('.kycar-compact-sheet__footer button').last().click();

    const banner = page.locator('.kycar-banner-message');
    await expect(banner).toBeVisible({ timeout: 20_000 });
    const text = await banner.innerText();
    mesure(testInfo, 'EX-NAV-11 — message de plafond d’URL', text.replace(/\n/g, ' '));
    expect(text).toContain("limite d'URL atteinte, retirez un filtre pour en ajouter un autre");

    // Refus, jamais troncature : l'URL est inchangée…
    expect(await page.evaluate(() => window.location.search.includes('body='))).toBe(false);
    // …et le contrôle revient à son état antérieur. En compact, la feuille reste OUVERTE sur le
    // brouillon (l'utilisateur peut retirer un filtre au lieu de tout perdre) : c'est la sélection
    // APPLIQUÉE qui est refusée, et le jeton correspondant n'apparaît donc jamais dans le bandeau.
    if (compact) {
      await expect(page.getByRole('dialog', { name: 'Filtres' })).toBeVisible();
      await expect(page.locator('.kycar-active-tokens__list')).not.toContainText('Carrosserie');
    } else {
      await expect(checkbox).not.toBeChecked();
    }
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
  test('EX-SCR-101 — une URL partagée portant une marque absente du snapshot : le filtre est CONSERVÉ, marqué et compté à part', async ({
    page,
  }, testInfo) => {
    // `D8-31` — la validation référentielle de `mmmv` n'appartient pas à `EX-NAV-21` : un
    // identifiant taxonomique inconnu n'est PAS retiré de l'URL (le lien reste fidèle à ce que son
    // auteur a partagé). Le bandeau doit donc le dire, sans jamais l'effacer en silence.
    await page.goto('/marche?mmmv=999999&priceto=20000', { waitUntil: 'commit' });
    const tokens = page.locator('.kycar-active-tokens').first();
    await expect(tokens).toBeVisible({ timeout: 60_000 });

    // L'URL n'a pas bougé : aucune correction n'a retiré l'identifiant inconnu.
    expect(new URL(page.url()).search).toBe('?mmmv=999999&priceto=20000');

    const marked = page.locator('[data-ineffective="true"]');
    await expect(marked).toHaveCount(1);
    const tooltip = await marked.first().getAttribute('title');
    mesure(testInfo, 'EX-SCR-101 — infobulle du filtre sans effet', String(tooltip));
    expect(tooltip).toMatch(/^Cette marque est absente du snapshot du \d{2}\/\d{2}\/\d{4}$/);

    // Le jeton reste RENDU et retirable : jamais de retrait automatique.
    await expect(marked.first().getByRole('button', { name: /^Retirer le filtre/ })).toBeVisible();

    // Compteur SÉPARÉ, à côté du compteur de filtres actifs — jamais à sa place.
    const zone = await tokens.innerText();
    mesure(testInfo, 'EX-SCR-101 — zone (4) du bandeau', zone.split('\n').slice(0, 2).join(' · '));
    expect(zone).toContain('2 filtres actifs');
    expect(zone).toContain('1 filtre sans effet');

    // La couleur n'est jamais le seul signal (`EX-SCR-99`) : une note est référencée par `aria-describedby`.
    expect(await marked.first().getAttribute('aria-describedby')).toBeTruthy();
  });
});
