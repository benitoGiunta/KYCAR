// Observations complémentaires : clic de barre G1 (EX-SCR-149), écran D par le chemin « chaud »,
// écrans C/E/F et /mentions, corrections d'URL (EX-NAV-21/22, EX-SCR-38bis), routes héritées
// (EX-SCR-49/140), impression (EX-NFR-31), lien d'évitement (EX-NFR-12), axe-core (EX-NFR-16).
const { launch, log, text, texts, shot, save, BASE } = require('./_common.cjs');
const { AxeBuilder } = require('@axe-core/playwright');

async function axe(page, label, journal) {
  try {
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const byImpact = {};
    for (const v of r.violations) byImpact[v.impact] = (byImpact[v.impact] ?? 0) + v.nodes.length;
    log(journal, `AXE ${label}`, { violations: r.violations.length, nodesByImpact: byImpact, rules: r.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} nœuds)`), passes: r.passes.length });
  } catch (e) {
    log(journal, `AXE ${label}`, { error: e.message });
  }
}

(async () => {
  const journal = [];
  const { browser, context, page, consoleErrors } = await launch();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  try {
    // ---- A. Écran B chaud : filtre bandeau puis clic sur une barre de G1 -------------------------
    await page.goto(`${BASE}/marche/54-opel/1918-corsa`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    await page.locator('.filter-bar input[aria-label="Première immatriculation de"]').first().fill('2017');
    await page.locator('.filter-bar input[aria-label="Première immatriculation de"]').first().press('Enter');
    await page.waitForTimeout(1500);
    await page.locator('.filter-bar input[aria-label="Première immatriculation à"]').first().fill('2017');
    await page.locator('.filter-bar input[aria-label="Première immatriculation à"]').first().press('Enter');
    await page.waitForTimeout(2000);
    const headerBefore = await text(page, '.kycar-stat-header');
    const bars = await page.$$('svg.kycar-hist rect[role="button"]');
    let chosen = null;
    for (const b of bars) {
      const label = await b.getAttribute('aria-label');
      const m = label?.match(/: (\d+) offres/);
      if (m && Number(m[1]) >= 5) { chosen = { label, count: Number(m[1]) }; await b.click(); break; }
    }
    await page.waitForTimeout(2500);
    log(journal, 'A clic sur une barre de G1 (EX-SCR-149)', { barsFound: bars.length, chosen, urlAfter: page.url(), headerBefore: headerBefore?.slice(0, 60), headerAfter: (await text(page, '.kycar-stat-header'))?.slice(0, 120), band: (await text(page, '.filter-bar'))?.match(/\d+ filtres actifs.*?Tout effacer/)?.[0] });
    journal.push({ screenshot: await shot(page, 'P3-A-clic-barre.png') });
    await axe(page, 'écran B (Corsa 2017, après clic barre)', journal);

    // ---- B. Écran D par le chemin chaud (bouton « Voir les annonces ») ----------------------------
    await page.click('button:has-text("Voir les")');
    const okD = await page.waitForSelector('.kycar-screen-d', { timeout: 30000 }).then(() => true).catch(() => false);
    await page.waitForTimeout(600);
    log(journal, 'B écran D (chemin chaud)', { rendered: okD, url: page.url(), head: await text(page, '.kycar-listings-head'), scope: await text(page, '.kycar-listings-scope'), foot: await text(page, '.kycar-listings-foot'), pager: await text(page, '.kycar-pager'), rows: (await page.$$('.kycar-listings-table tbody tr')).length, headers: await texts(page, '.kycar-listings-table thead th', 20), first2: await texts(page, '.kycar-listings-table tbody tr', 2) });
    journal.push({ screenshot: await shot(page, 'P3-B-ecran-D.png', true) });
    if (okD) {
      await axe(page, 'écran D', journal);
      const opener = await page.$('.kycar-listings-table tbody tr .kycar-open, .kycar-listings-table tbody tr button:has-text("Ouvrir"), .kycar-listings-table tbody tr a:has-text("Ouvrir")');
      if (opener) {
        const popupPromise = context.waitForEvent('page', { timeout: 8000 }).catch(() => null);
        await opener.click();
        const popup = await popupPromise;
        log(journal, 'B ouverture d’une annonce (seul lien sortant)', { popupOpened: popup !== null, popupUrl: popup ? popup.url() : null, external: popup ? !popup.url().startsWith(BASE) : null, opener: popup ? await popup.evaluate(() => window.opener === null).catch(() => null) : null });
        if (popup) await popup.close();
      }
      // tri par une colonne, pagination
      const sortBtn = await page.$('.kycar-listings-table thead button');
      if (sortBtn) { await sortBtn.click(); await page.waitForTimeout(500); log(journal, 'B tri colonne', { url: page.url(), firstRow: (await texts(page, '.kycar-listings-table tbody tr', 1))[0] }); }
      const next = await page.$('.kycar-pager button:has-text("Suivante"), .kycar-pager button:has-text("›"), .kycar-pager button:not([disabled]):last-child');
      if (next) { await next.click(); await page.waitForTimeout(500); log(journal, 'B pagination', { url: page.url(), pager: await text(page, '.kycar-pager') }); }
    }

    // ---- C. Écrans E / F / C / mentions ---------------------------------------------------------------
    await page.goto(`${BASE}/marche?body=3&kmto=100000&priceto=20000`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-market-card', { timeout: 90000 });
    await page.click('button:has-text("Enregistrer cette recherche")');
    await page.fill('input[placeholder="Nom de la recherche"]', 'Coupés ≤ 20 k€');
    await page.click('button:has-text("Enregistrer")');
    await page.waitForTimeout(600);
    log(journal, 'C1 enregistrement d’une recherche', { banner: await text(page, '.kycar-banner-message'), nav: await text(page, '.kycar-nav') });
    // comparer : cocher 2 zones-modèles
    await page.click('.kycar-market-card .kycar-market-card-header');
    await page.waitForTimeout(1200);
    const boxes = await page.$$('.kycar-market-zone input[type="checkbox"]');
    if (boxes.length >= 2) { await boxes[0].click(); await boxes[1].click(); await page.waitForTimeout(300); }
    log(journal, 'C2 sélection de comparaison', { nav: await text(page, '.kycar-nav') });
    await page.goto(`${BASE}/recherches`, { waitUntil: 'commit' });
    await page.waitForTimeout(2500);
    log(journal, 'C3 écran E /recherches', { main: (await text(page, '.kycar-main'))?.slice(0, 600) });
    journal.push({ screenshot: await shot(page, 'P3-C3-ecran-E.png') });
    await axe(page, 'écran E', journal);
    // suivre un modèle depuis B puis /suivis
    await page.goto(`${BASE}/marche/54-opel/1918-corsa`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    await page.click('button:has-text("Suivre")');
    await page.waitForTimeout(400);
    await page.goto(`${BASE}/suivis`, { waitUntil: 'commit' });
    await page.waitForTimeout(2500);
    log(journal, 'C4 écran F /suivis', { main: (await text(page, '.kycar-main'))?.slice(0, 500) });
    journal.push({ screenshot: await shot(page, 'P3-C4-ecran-F.png') });
    await axe(page, 'écran F', journal);
    // comparer par URL
    await page.goto(`${BASE}/comparer?m=54-1918,74-2084`, { waitUntil: 'commit' });
    await page.waitForTimeout(6000);
    log(journal, 'C5 écran C /comparer?m=54-1918,74-2084', { main: (await text(page, '.kycar-main'))?.slice(0, 700), figures: (await page.$$('.kycar-main figure, .kycar-main svg')).length, h3: await texts(page, '.kycar-main h2, .kycar-main h3', 12), filterBar: (await page.$('.filter-bar')) !== null });
    journal.push({ screenshot: await shot(page, 'P3-C5-ecran-C.png', true) });
    await axe(page, 'écran C', journal);
    await page.goto(`${BASE}/mentions`, { waitUntil: 'commit' });
    await page.waitForTimeout(800);
    log(journal, 'C6 /mentions', { main: (await text(page, '.kycar-main'))?.slice(0, 900) });
    await axe(page, '/mentions', journal);

    // ---- D. Corrections d'URL, routes héritées, slug erroné -------------------------------------------
    await page.goto(`${BASE}/marche?fuel=Z,B&pricefrom=abc&kmfrom=100000&kmto=1000&foo=1&priceto=99999999`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-market-card', { timeout: 90000 });
    await page.waitForTimeout(600);
    log(journal, 'D1 URL fautive (EX-NAV-21/22)', { landed: page.url(), banners: await texts(page, '.status-banner, .kycar-market-banner, [class*="corrig"]'), band: (await text(page, '.filter-bar'))?.match(/\d+ filtres actifs.*?Tout effacer/)?.[0] });
    journal.push({ screenshot: await shot(page, 'P3-D1-url-corrigee.png') });
    await page.goto(`${BASE}/`, { waitUntil: 'commit' });
    await page.waitForTimeout(1500);
    log(journal, 'D2 route héritée /', { landed: page.url() });
    await page.goto(`${BASE}/modele/54/1918?priceto=20000`, { waitUntil: 'commit' });
    await page.waitForTimeout(3000);
    log(journal, 'D3 route héritée /modele/54/1918', { landed: page.url(), screenB: (await page.$('.kycar-screen-b')) !== null });
    await page.goto(`${BASE}/marche/54-opell/1918-corsaa?priceto=20000`, { waitUntil: 'commit' });
    await page.waitForTimeout(3000);
    log(journal, 'D4 slug erroné (EX-SCR-140)', { landed: page.url(), screenB: (await page.$('.kycar-screen-b')) !== null });
    await page.goto(`${BASE}/marche/999999-x/1-y`, { waitUntil: 'commit' });
    await page.waitForTimeout(1500);
    log(journal, 'D5 marque inconnue (EX-NAV-19)', { main: (await text(page, '.kycar-main'))?.slice(0, 300) });
    await page.goto(`${BASE}/marche/54-opel/424242-z?priceto=20000`, { waitUntil: 'commit' });
    await page.waitForTimeout(1500);
    log(journal, 'D6 modèle hors marque (EX-NAV-20)', { main: (await text(page, '.kycar-main'))?.slice(0, 300), link: await page.$eval('.kycar-main a', (a) => a.getAttribute('href')).catch(() => null) });
    await page.goto(`${BASE}/marche/54-opel/0-modele-non-identifie`, { waitUntil: 'commit' });
    await page.waitForTimeout(3000);
    log(journal, 'D7 modelId = 0 (EX-SCR-113bis)', { landed: page.url(), main: (await text(page, '.kycar-main'))?.slice(0, 300) });

    // ---- E. Impression et lien d'évitement ------------------------------------------------------------
    await page.goto(`${BASE}/marche?priceto=20000`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-market-card', { timeout: 90000 });
    await page.emulateMedia({ media: 'print' });
    const printState = await page.evaluate(() => {
      const vis = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).display : 'absent'; };
      return { filterBand: vis('.filter-bar .kycar-filter-band, .filter-bar > *:first-child'), printSummary: vis('.kycar-print-filter-summary'), header: getComputedStyle(document.querySelector('.kycar-header')).position, summaryBar: getComputedStyle(document.querySelector('.kycar-market-summary-bar')).position, c3: vis('.kycar-market-banner-c3'), noPrintCount: [...document.querySelectorAll('.no-print')].filter((e) => getComputedStyle(e).display !== 'none').length, summaryText: document.querySelector('.kycar-print-filter-summary')?.textContent };
    });
    log(journal, 'E1 média print (EX-NFR-31)', printState);
    await page.emulateMedia({ media: 'screen' });
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => ({ tag: document.activeElement.tagName, text: document.activeElement.textContent.trim().slice(0, 60), href: document.activeElement.getAttribute('href') }));
    log(journal, 'E2 premier arrêt de tabulation (EX-NFR-12)', first);
    await axe(page, 'écran A (priceto=20000)', journal);
    // jeton de snapshot, pied de page, onglets
    log(journal, 'E3 coquille S0', { snapshotToken: await text(page, '.kycar-snapshot-token'), footer: await text(page, '.kycar-footer'), nav: await text(page, '.kycar-nav'), title: await page.title() });
  } catch (e) {
    log(journal, 'ERREUR', { message: e.message, stack: e.stack?.split('\n').slice(0, 3) });
  } finally {
    log(journal, 'P3 fin', { consoleErrors, pageErrors });
    save('p3-journal.json', journal);
    await context.close();
    await browser.close();
  }
})();
