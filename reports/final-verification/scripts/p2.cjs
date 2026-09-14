// Parcours cible P2 — mode 2 « Opel Corsa 2017 » (Opel = 54, Corsa = 1918).
// Observations : écran B (en-tête, histogrammes, nuage, graphes additionnels, annonces signalées),
// resserrement « 2017 » par l'URL et par le bandeau, clic sur une barre (EX-SCR-149), écran D,
// ouverture d'une annonce (EX-SCR-158 / 201, seul lien sortant).
const { launch, log, text, texts, shot, save, timeToSelector, BASE } = require('./_common.cjs');

(async () => {
  const journal = [];
  const { browser, context, page, consoleErrors, requests } = await launch();
  try {
    // ---- Étape 1 : écran B Opel Corsa, toutes années ---------------------------------------------
    const t = await timeToSelector(page, `${BASE}/marche/54-opel/1918-corsa`, '.kycar-screen-b', 90000);
    await page.waitForTimeout(800);
    log(journal, 'P2-1 écran B Opel Corsa', { url: page.url(), ...t, title: await page.title() });
    log(journal, 'P2-1 en-tête statistique', { header: await text(page, '.kycar-stat-header'), lines: await texts(page, '.kycar-stat-line') });
    log(journal, 'P2-1 bandeaux', { banners: await texts(page, '.status-banner, .kycar-market-banner, [class*="banner"]') });
    log(journal, 'P2-1 titres de graphes', { titles: await texts(page, '.kycar-graph-title, .kycar-screen-b h3', 20) });
    const figures = await page.evaluate(() => [...document.querySelectorAll('.kycar-screen-b figure')].map((f) => ({
      title: f.querySelector('h3, .kycar-graph-title')?.textContent.replace(/\s+/g, ' ').trim(),
      hasTable: f.querySelector('table') !== null,
      svg: f.querySelectorAll('svg').length, canvas: f.querySelectorAll('canvas').length,
      empty: f.querySelector('.kycar-graph-empty, .kycar-hist-empty')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      note: f.querySelector('.kycar-hist-note, [class*="note"]')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      textHead: f.textContent.replace(/\s+/g, ' ').trim().slice(0, 220),
    })));
    log(journal, 'P2-1 détail des 14 figures', { figures });
    log(journal, 'P2-1 histogrammes', { count: (await page.$$('.kycar-hist')).length, notes: await texts(page, '.kycar-hist-note'), figures: (await page.$$('.kycar-screen-b figure')).length, tables: (await page.$$('.kycar-screen-b table')).length });
    log(journal, 'P2-1 nuage G4', { canvas: (await page.$$('.kycar-scatter-body canvas')).length, svgPoints: (await page.$$('.kycar-scatter-body circle')).length, controls: await text(page, '.kycar-scatter-controls'), sampleNote: await text(page, '.kycar-scatter-samplenote'), legend: (await text(page, '.kycar-scatter-legend'))?.slice(0, 300) });
    log(journal, 'P2-1 G8 annonces signalées', { lollipops: (await page.$$('.kycar-lollipop')).length, first3: await texts(page, '.kycar-lollipop', 3), g8Head: await text(page, '.kycar-lollipops') });
    journal.push({ screenshot: await shot(page, 'P2-1-ecran-B-corsa.png', true) });

    // ---- Étape 2 : resserrer sur 2017 par l'URL (EX-NAV-18 : rendu = fonction de l'URL) ------------
    const t2 = await timeToSelector(page, `${BASE}/marche/54-opel/1918-corsa?fregfrom=2017&fregto=2017`, '.kycar-screen-b', 90000);
    await page.waitForTimeout(800);
    log(journal, 'P2-2 écran B Opel Corsa 2017 (URL)', { url: page.url(), ...t2 });
    log(journal, 'P2-2 en-tête statistique', { header: await text(page, '.kycar-stat-header') });
    log(journal, 'P2-2 jetons actifs', { band: (await text(page, '.filter-bar'))?.slice(0, 500) });
    log(journal, 'P2-2 histogrammes', { notes: await texts(page, '.kycar-hist-note'), emptyFrames: await texts(page, '.kycar-graph-empty, .kycar-hist-empty') });
    log(journal, 'P2-2 G8', { lollipops: (await page.$$('.kycar-lollipop')).length, g8Text: (await text(page, '.kycar-lollipops'))?.slice(0, 300) });
    journal.push({ screenshot: await shot(page, 'P2-2-ecran-B-corsa-2017.png', true) });

    // ---- Étape 2bis : resserrer par le BANDEAU (saisie 1re immat. 2017 → 2017) --------------------
    await page.goto(`${BASE}/marche/54-opel/1918-corsa`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    await page.waitForTimeout(500);
    const headerBefore = await text(page, '.kycar-stat-header');
    const inputs = await page.$$('.filter-bar input[type="number"], .filter-bar input[inputmode="numeric"]');
    const labels = [];
    for (const i of inputs) labels.push((await i.getAttribute('aria-label')) ?? (await i.getAttribute('name')) ?? (await i.getAttribute('id')));
    log(journal, 'P2-2bis champs numériques du bandeau', { count: inputs.length, labels });
    const fregFrom = page.locator('.filter-bar input[aria-label="Première immatriculation de"]').first();
    const fregTo = page.locator('.filter-bar input[aria-label="Première immatriculation à"]').first();
    if ((await fregFrom.count()) > 0 && (await fregTo.count()) > 0) {
      await fregFrom.fill('2017');
      await fregFrom.press('Enter');
      await page.waitForTimeout(1200);
      const urlMid = page.url();
      await page.locator('.filter-bar input[aria-label="Première immatriculation à"]').first().fill('2017');
      await page.locator('.filter-bar input[aria-label="Première immatriculation à"]').first().press('Enter');
      await page.waitForTimeout(2000);
      log(journal, 'P2-2bis après saisie 2017–2017 dans le bandeau', { urlMid, url: page.url(), headerBefore, headerAfter: await text(page, '.kycar-stat-header') });
    } else {
      log(journal, 'P2-2bis', { error: 'champs 1re immatriculation introuvables dans le bandeau' });
    }
    journal.push({ screenshot: await shot(page, 'P2-2bis-bandeau-2017.png') });

    // ---- Étape 3 : geste central — clic sur une barre de G1 (EX-SCR-149) ---------------------------
    await page.goto(`${BASE}/marche/54-opel/1918-corsa?fregfrom=2017&fregto=2017`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    await page.waitForTimeout(600);
    const bars = await page.$$('.kycar-hist svg rect[data-count], .kycar-hist svg rect[role="button"], .kycar-hist svg rect');
    log(journal, 'P2-3 barres de G1', { bars: bars.length });
    let barInfo = null;
    for (const b of bars) {
      const box = await b.boundingBox();
      const label = (await b.getAttribute('aria-label')) ?? '';
      const count = await b.getAttribute('data-count');
      if (box && box.height > 2 && (label !== '' || count !== null)) { barInfo = { label, count, box }; await b.click(); break; }
    }
    await page.waitForTimeout(1500);
    log(journal, 'P2-3 après clic sur une barre', { barInfo, url: page.url(), header: await text(page, '.kycar-stat-header') });
    journal.push({ screenshot: await shot(page, 'P2-3-clic-barre.png') });

    // ---- Étape 4 : écran D (annonces), tri par score, ouverture d'une annonce ---------------------
    await page.goto(`${BASE}/marche/54-opel/1918-corsa?fregfrom=2017&fregto=2017`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    const voir = await page.$('button:has-text("Voir les annonces"), button:has-text("Voir les")');
    if (voir) { await voir.click(); await page.waitForSelector('.kycar-screen-d', { timeout: 60000 }); await page.waitForTimeout(600); }
    log(journal, 'P2-4 écran D', { url: page.url(), head: await text(page, '.kycar-listings-head'), scope: await text(page, '.kycar-listings-scope'), foot: await text(page, '.kycar-listings-foot'), pager: await text(page, '.kycar-pager') });
    log(journal, 'P2-4 colonnes', { headers: await texts(page, '.kycar-listings-table thead th', 20) });
    log(journal, 'P2-4 lignes', { rows: (await page.$$('.kycar-listings-table tbody tr')).length, first2: await texts(page, '.kycar-listings-table tbody tr', 2) });
    journal.push({ screenshot: await shot(page, 'P2-4-ecran-D.png', true) });

    const opener = await page.$('.kycar-listings-table tbody tr .kycar-open, .kycar-listings-table tbody tr button:has-text("Ouvrir"), .kycar-listings-table tbody tr a:has-text("Ouvrir")');
    if (opener) {
      const popupPromise = context.waitForEvent('page', { timeout: 8000 }).catch(() => null);
      await opener.click();
      const popup = await popupPromise;
      log(journal, 'P2-4 ouverture d’une annonce', { popupOpened: popup !== null, popupUrl: popup ? popup.url() : null, sameOrigin: popup ? popup.url().startsWith(BASE) : null });
      if (popup) await popup.close();
    } else {
      log(journal, 'P2-4 ouverture d’une annonce', { error: 'bouton Ouvrir introuvable' });
    }

    // ---- Étape 5 : écran D depuis un brossage (`sel`) et pagination (`page`) -----------------------
    await page.goto(`${BASE}/marche/54-opel/1918-corsa/annonces?page=2`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-d', { timeout: 60000 });
    await page.waitForTimeout(500);
    log(journal, 'P2-5 écran D page=2 (toutes années)', { url: page.url(), foot: await text(page, '.kycar-listings-foot'), pager: await text(page, '.kycar-pager'), rows: (await page.$$('.kycar-listings-table tbody tr')).length });
  } catch (e) {
    log(journal, 'ERREUR', { message: e.message, stack: e.stack?.split('\n').slice(0, 4) });
  } finally {
    const external = requests.filter((u) => !u.startsWith(BASE));
    log(journal, 'P2 fin', { consoleErrors, externalRequests: external });
    save('p2-journal.json', journal);
    await context.close();
    await browser.close();
  }
})();
