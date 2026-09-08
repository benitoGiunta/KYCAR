// P2 (complément) — preuve du tampon détaché : première entrée en mode 2 (worker réel) vs entrée
// suivante ; écran D en accès direct ; zone-modèle à 5 ≤ n ≤ 11 sur l'écran A.
const { launch, log, text, shot, save, BASE } = require('./_common.cjs');

async function dumpB(page, label, journal) {
  const d = await page.evaluate(() => {
    const fig = [...document.querySelectorAll('.kycar-screen-b figure')];
    const byTitle = (t) => fig.find((f) => (f.querySelector('h3, .kycar-graph-title')?.textContent ?? '').startsWith(t));
    const g4 = byTitle('Prix × année'); const g8 = byTitle('Écart au prix'); const g13 = byTitle('Type de vendeur'); const g9 = byTitle('Répartition par carburant');
    const rows = (f) => (f ? f.querySelectorAll('table tbody tr').length : null);
    return {
      header: document.querySelector('.kycar-stat-header')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 260),
      g4TableRows: rows(g4), g4Note: g4?.querySelector('.kycar-scatter-no-year-note')?.textContent ?? null, g4Legend: g4?.querySelector('.kycar-scatter-legend')?.textContent.replace(/\s+/g, ' ').slice(0, 120),
      g8Items: g8 ? g8.querySelectorAll('.kycar-lollipop').length : null, g8Text: g8?.textContent.replace(/\s+/g, ' ').slice(0, 200),
      g13Text: g13?.textContent.replace(/\s+/g, ' ').slice(0, 200), g9Text: g9?.textContent.replace(/\s+/g, ' ').slice(0, 200),
      g1Bars: document.querySelectorAll('.kycar-hist svg rect, .kycar-hist svg path, .kycar-hist [role="button"], .kycar-hist button').length,
    };
  });
  log(journal, label, d);
}

(async () => {
  const journal = [];
  const { browser, context, page, consoleErrors } = await launch();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push({ message: e.message, stack: (e.stack ?? '').split('\n').slice(0, 3).join(' | ') }));
  try {
    // 1. Première entrée en mode 2 (chargement à froid de l'onglet)
    await page.goto(`${BASE}/marche/54-opel/1918-corsa`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    await page.waitForTimeout(800);
    await dumpB(page, 'P2c-1 première entrée en mode 2 (Corsa, à froid)', journal);
    log(journal, 'P2c-1 erreurs de page', { pageErrors: [...pageErrors] });

    // 2. Changement de filtre par le bandeau (même écran) → seconde entrée
    await page.locator('.filter-bar input[aria-label="Kilométrage à"]').first().fill('200000');
    await page.locator('.filter-bar input[aria-label="Kilométrage à"]').first().press('Enter');
    await page.waitForTimeout(2500);
    await dumpB(page, 'P2c-2 après un filtre du bandeau (kmto=200000)', journal);
    log(journal, 'P2c-2 url', { url: page.url() });
    journal.push({ screenshot: await shot(page, 'P2c-2-ecran-B-apres-filtre.png', true) });

    // 3. Retirer le filtre (Tout effacer) → retour à la sélection initiale
    const clear = await page.$('.filter-bar button:has-text("Tout effacer")');
    if (clear) { await clear.click(); await page.waitForTimeout(2500); }
    await dumpB(page, 'P2c-3 après « Tout effacer » (même Σ qu’en 1)', journal);
    log(journal, 'P2c-3 url', { url: page.url() });

    // 4. Écran D en accès direct (nouvel onglet, à froid)
    const p2 = await context.newPage();
    const errD = [];
    p2.on('pageerror', (e) => errD.push(e.message));
    await p2.goto(`${BASE}/marche/54-opel/1918-corsa/annonces`, { waitUntil: 'commit' });
    const okD = await p2.waitForSelector('.kycar-screen-d', { timeout: 30000 }).then(() => true).catch(() => false);
    await p2.waitForTimeout(600);
    log(journal, 'P2c-4 écran D en accès direct (à froid)', { rendered: okD, errors: errD, mainText: (await text(p2, '.kycar-main'))?.slice(0, 300) });
    journal.push({ screenshot: await shot(p2, 'P2c-4-ecran-D-froid.png') });
    if (!okD) {
      await p2.locator('.filter-bar input[aria-label="Kilométrage à"]').first().fill('200000');
      await p2.locator('.filter-bar input[aria-label="Kilométrage à"]').first().press('Enter');
      const okD2 = await p2.waitForSelector('.kycar-screen-d', { timeout: 30000 }).then(() => true).catch(() => false);
      await p2.waitForTimeout(600);
      log(journal, 'P2c-4bis écran D après un filtre du bandeau', { rendered: okD2, url: p2.url(), head: await text(p2, '.kycar-listings-head'), foot: await text(p2, '.kycar-listings-foot'), rows: (await p2.$$('.kycar-listings-table tbody tr')).length, headers: await p2.$$eval('.kycar-listings-table thead th', (ths) => ths.map((t) => t.textContent.trim())) });
      journal.push({ screenshot: await shot(p2, 'P2c-4bis-ecran-D-apres-filtre.png', true) });
      // ouverture d'une annonce
      const opener = await p2.$('.kycar-listings-table tbody tr .kycar-open, .kycar-listings-table tbody tr button:has-text("Ouvrir")');
      if (opener) {
        const popupPromise = context.waitForEvent('page', { timeout: 8000 }).catch(() => null);
        await opener.click();
        const popup = await popupPromise;
        log(journal, 'P2c-4ter ouverture d’une annonce', { popupOpened: popup !== null, popupUrl: popup ? popup.url() : null, external: popup ? !popup.url().startsWith(BASE) : null });
        if (popup) await popup.close();
      }
    }
    await p2.close();

    // 5. Zone-modèle à petit effectif sur l'écran A (VW dépliée)
    await page.goto(`${BASE}/marche?body=3&kmto=100000&priceto=20000`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-market-card', { timeout: 90000 });
    await page.click('.kycar-market-card .kycar-market-card-header');
    await page.waitForTimeout(1500);
    const zones = await page.evaluate(() => [...document.querySelectorAll('.kycar-market-card:first-of-type .kycar-market-zone-list > *')].slice(0, 12).map((z) => ({
      aria: z.getAttribute('aria-label'), html: z.outerHTML.replace(/\s+/g, ' ').slice(0, 900),
    })));
    log(journal, 'P2c-5 zones-modèles (HTML) de la première carte', { zones: zones.filter((z) => /T-Roc|Touran|Transporter|up!|Golf/.test(z.aria ?? '')) });
    journal.push({ screenshot: await shot(page, 'P2c-5-zones-petit-effectif.png') });
  } catch (e) {
    log(journal, 'ERREUR', { message: e.message });
  } finally {
    log(journal, 'P2c fin', { consoleErrors, pageErrors });
    save('p2c-journal.json', journal);
    await context.close();
    await browser.close();
  }
})();
