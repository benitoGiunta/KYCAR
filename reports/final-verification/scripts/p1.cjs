// Parcours cible P1 — mode 1 « budget 20 000 €, carrosserie coupé, Belgique, < 100 000 km ».
// Observations : premier affichage (EX-NFR-9, avec et sans limitation 4G), cartes-marques,
// zones-modèles, effectifs et fourchettes, écran G, transition A → B (EX-NAV-15 / EX-SCR-51).
const { launch, log, text, texts, shot, save, timeToSelector, BASE } = require('./_common.cjs');

(async () => {
  const journal = [];
  const { browser, context, page, consoleErrors, requests } = await launch();
  try {
    // ---- Étape 0 : premier affichage utile, réseau non limité -----------------------------------
    const cold = await timeToSelector(page, `${BASE}/marche`, '.kycar-market-card');
    log(journal, 'P1-0 premier affichage /marche (réseau local)', { url: page.url(), ...cold });
    log(journal, 'P1-0 barre de synthèse', { summary: await text(page, '.kycar-market-summary-bar') });
    log(journal, 'P1-0 bandeaux', { banners: await texts(page, '.status-banner, .kycar-market-banner, .kycar-market-banner-c3') });
    log(journal, 'P1-0 amorce SANS-FILTRE', { primer: await text(page, '.kycar-market-primer'), shortcuts: await texts(page, '.kycar-market-primer-shortcuts button') });
    log(journal, 'P1-0 cartes rendues', { cards: (await page.$$('.kycar-market-card')).length, footer: await text(page, '.kycar-market-grid-footer') });
    journal.push({ screenshot: await shot(page, 'P1-0-marche-sans-filtre.png') });

    // ---- Étape 0bis : premier affichage sous 4G simulée (CDP), cache vidé --------------------------
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'fr-BE' });
    const page2 = await ctx2.newPage();
    const client = await ctx2.newCDPSession(page2);
    await client.send('Network.enable');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });
    // ≈ 4 Mb/s = 500 Ko/s, latence 150 ms (EX-NFR-9)
    await client.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 500 * 1024, uploadThroughput: 500 * 1024 });
    const g4 = await timeToSelector(page2, `${BASE}/marche`, '.kycar-market-card', 120000);
    log(journal, 'P1-0bis premier affichage /marche (4G simulée, cache désactivé)', g4);
    const g4b = await timeToSelector(page2, `${BASE}/marche?priceto=20000`, '.kycar-market-card', 120000);
    log(journal, 'P1-0bis second chargement (4G simulée, cache désactivé)', g4b);
    await ctx2.close();

    // ---- Étape 1 : poser les contraintes du parcours ------------------------------------------------
    // `cy` (Belgique) est `nonExposed` (D-15) : on le pose tout de même dans l'URL pour observer le
    // traitement (accepté ? corrigé ET-URL-CORRIGEE ? ignoré ?).
    const url1 = `${BASE}/marche?body=3&cy=B&kmto=100000&priceto=20000`;
    const t1 = await timeToSelector(page, url1, '.kycar-market-card');
    log(journal, 'P1-1 URL filtrée', { requested: url1, landed: page.url(), ...t1 });
    await page.waitForTimeout(600);
    log(journal, 'P1-1 barre de synthèse', { summary: await text(page, '.kycar-market-summary-bar') });
    log(journal, 'P1-1 bandeaux', { banners: await texts(page, '.status-banner, .kycar-market-banner, .kycar-market-banner-c3') });
    log(journal, 'P1-1 jetons de filtres actifs', { tokens: await texts(page, '.filter-bar [class*="token"], .filter-bar [class*="chip"], .filter-bar li'), bandText: (await text(page, '.filter-bar'))?.slice(0, 600) });
    const cards = await page.$$('.kycar-market-card');
    log(journal, 'P1-1 cartes', { count: cards.length, footer: await text(page, '.kycar-market-grid-footer') });
    const firstCards = [];
    for (const c of cards.slice(0, 3)) {
      firstCards.push({
        header: (await (await c.$('.kycar-market-card-header'))?.innerText())?.replace(/\s+/g, ' '),
        summary: (await (await c.$('.kycar-market-card-summary'))?.innerText())?.replace(/\s+/g, ' '),
        secondary: (await (await c.$('.kycar-market-card-summary-secondary'))?.innerText())?.replace(/\s+/g, ' '),
        footer: (await (await c.$('.kycar-market-card-footer'))?.innerText())?.replace(/\s+/g, ' '),
      });
    }
    log(journal, 'P1-1 trois premières cartes', { firstCards });
    journal.push({ screenshot: await shot(page, 'P1-1-marche-filtre.png') });

    // ---- Étape 2 : déplier la première carte → zones-modèles ---------------------------------------
    const foot = await page.$('.kycar-market-card .kycar-market-card-footer button');
    if (foot) {
      await foot.click();
      await page.waitForTimeout(800);
    }
    const zones = await texts(page, '.kycar-market-card:first-of-type [class*="zone"][role], .kycar-market-card:first-of-type .kycar-market-zone-row1', 12);
    const zoneRanges = await texts(page, '.kycar-market-card:first-of-type .kycar-market-zone-ranges', 12);
    log(journal, 'P1-2 zones-modèles de la première carte', { zones, zoneRanges, cardText: (await text(page, '.kycar-market-card:first-of-type'))?.slice(0, 1200) });
    journal.push({ screenshot: await shot(page, 'P1-2-carte-depliee.png') });

    // ---- Étape 3 : écran G (sélecteur marque/modèle) ------------------------------------------------
    const gBtn = await page.$('button:has-text("Toutes les marques"), button:has-text("Marque")');
    if (gBtn) {
      await gBtn.click();
      await page.waitForTimeout(800);
      const dialog = await page.$('[role="dialog"]');
      log(journal, 'P1-3 écran G ouvert', {
        dialogPresent: dialog !== null,
        title: dialog ? (await dialog.innerText()).split('\n')[0] : null,
        makeRows: (await page.$$('[role="dialog"] [role="option"], [role="dialog"] li')).length,
        text: dialog ? (await dialog.innerText()).replace(/\s+/g, ' ').slice(0, 700) : null,
      });
      journal.push({ screenshot: await shot(page, 'P1-3-ecran-G.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      log(journal, 'P1-3 Échap ferme l’écran G', { dialogPresent: (await page.$('[role="dialog"]')) !== null, url: page.url() });
    } else {
      log(journal, 'P1-3 écran G', { error: 'bouton d’ouverture introuvable' });
    }

    // ---- Étape 4 : clic sur une zone-modèle → écran B, filtres conservés --------------------------
    const zone = await page.$('.kycar-market-card .kycar-market-zone-row1');
    const zoneLabel = zone ? (await zone.innerText()).replace(/\s+/g, ' ') : null;
    if (zone) {
      await zone.click();
      await page.waitForSelector('.kycar-screen-b', { timeout: 60000 });
      await page.waitForTimeout(500);
    }
    log(journal, 'P1-4 ouverture d’un modèle (A → B)', { clicked: zoneLabel, url: page.url(), header: await text(page, '.kycar-stat-header'), breadcrumb: await text(page, '.kycar-breadcrumb') });
    journal.push({ screenshot: await shot(page, 'P1-4-ecran-B-depuis-A.png') });

    // ---- Étape 5 : retour au marché par le fil d'Ariane (EX-NAV-16) ------------------------------
    const crumb = await page.$('.kycar-breadcrumb a');
    if (crumb) {
      await crumb.click();
      await page.waitForSelector('.kycar-market-card', { timeout: 60000 });
      await page.waitForTimeout(500);
    }
    log(journal, 'P1-5 retour B → A par le fil d’Ariane', { url: page.url(), summary: await text(page, '.kycar-market-summary-bar') });
  } catch (e) {
    log(journal, 'ERREUR', { message: e.message, stack: e.stack?.split('\n').slice(0, 4) });
  } finally {
    const external = requests.filter((u) => !u.startsWith(BASE));
    log(journal, 'P1 fin', { consoleErrors, externalRequests: external });
    save('p1-journal.json', journal);
    await context.close();
    await browser.close();
  }
})();
