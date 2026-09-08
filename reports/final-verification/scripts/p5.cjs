// Dernières observations : clés localStorage par entrée (D-16), page=2 sur D (chemin chaud),
// ET-VIDE-FILTRES sur B, amorce après « Tout effacer » (EX-SCR-126), densité 1 440 × 900 (EX-SCR-22),
// mode 2 « 2017 » depuis l'écran A (parcours complet C1 → A → B).
const { launch, log, text, texts, shot, save, BASE } = require('./_common.cjs');

(async () => {
  const journal = [];
  const { browser, context, page } = await launch({ viewport: { width: 1440, height: 900 } });
  try {
    if (!process.env.SKIP_AB) {
    // A. Densité EX-SCR-22 à 1440×900 (sans défilement) : cartes et zones visibles
    await page.goto(`${BASE}/marche?priceto=20000`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-market-card', { timeout: 90000 });
    await page.waitForTimeout(500);
    const density = await page.evaluate(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; };
      return { cardsVisible: [...document.querySelectorAll('.kycar-market-card')].filter(vis).length, zonesVisible: [...document.querySelectorAll('.kycar-market-zone')].filter(vis).length, zonesTotal: document.querySelectorAll('.kycar-market-zone').length };
    });
    log(journal, 'A densité 1440×900 avant tout clic (EX-SCR-22)', density);
    journal.push({ screenshot: await shot(page, 'P5-A-densite-1440x900.png') });

    // B. Amorce : présente sans filtre, absente après filtre, ne revient pas après Tout effacer ?
    await page.goto(`${BASE}/marche`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-market-card', { timeout: 90000 });
    const primer0 = (await page.$('.kycar-market-primer')) !== null;
    await page.click('.kycar-market-primer-shortcuts button:has-text("Budget ≤ 20 000 €")');
    await page.waitForTimeout(1500);
    const primer1 = (await page.$('.kycar-market-primer')) !== null;
    const url1 = page.url();
    await page.click('.filter-bar button:has-text("Tout effacer")');
    await page.waitForTimeout(1500);
    const primer2 = (await page.$('.kycar-market-primer')) !== null;
    log(journal, 'B amorce SANS-FILTRE (EX-SCR-125/126)', { primerInitial: primer0, urlAfterShortcut: url1, primerAfterShortcut: primer1, urlAfterClear: page.url(), primerAfterClear: primer2 });

    }
    // C. localStorage : une clé par entrée + index (D-16 / EX-CRUD-19)
    await page.goto(`${BASE}/marche/54-opel/1918-corsa`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    await page.click('button:has-text("Suivre")');
    await page.click('.kycar-market-toolbar button:has-text("Enregistrer cette recherche")');
    await page.fill('.kycar-save-form input', 'Corsa toutes années');
    await page.click('.kycar-save-form button[type="submit"]');
    await page.waitForTimeout(600);
    const ls = await page.evaluate(() => Object.keys(localStorage).sort().map((k) => `${k} = ${localStorage.getItem(k).slice(0, 90)}`));
    log(journal, 'C clés localStorage après 1 suivi + 1 recherche (D-16)', { keys: ls });

    // D. ET-VIDE-FILTRES sur B (filtre impossible)
    await page.goto(`${BASE}/marche/54-opel/1918-corsa?pricefrom=4900000`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b, .kycar-market-empty, [class*="empty"]', { timeout: 90000 });
    await page.waitForTimeout(1200);
    log(journal, 'D écran B à zéro résultat (EX-SCR-174)', { header: (await text(page, '.kycar-stat-header'))?.slice(0, 200), main: (await text(page, '.kycar-main'))?.slice(0, 500), figures: (await page.$$('.kycar-screen-b figure')).length });
    journal.push({ screenshot: await shot(page, 'P5-D-ecran-B-vide.png') });

    // E. Écran D page=2 par le chemin chaud
    await page.goto(`${BASE}/marche/54-opel/1918-corsa`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    await page.locator('.filter-bar input[aria-label="Kilométrage à"]').first().fill('300000');
    await page.locator('.filter-bar input[aria-label="Kilométrage à"]').first().press('Enter');
    await page.waitForTimeout(2500);
    await page.click('button:has-text("Voir les")');
    await page.waitForSelector('.kycar-screen-d', { timeout: 30000 });
    await page.waitForTimeout(500);
    const pagerBefore = await text(page, '.kycar-pager');
    const nextBtn = await page.$('.kycar-pager button:has-text("Suivant")');
    if (nextBtn) { await nextBtn.click(); await page.waitForTimeout(700); }
    log(journal, 'E écran D pagination (EX-SCR-208 / D-12)', { pagerBefore, url: page.url(), pagerAfter: await text(page, '.kycar-pager'), rows: (await page.$$('.kycar-listings-table tbody tr')).length, foot: await text(page, '.kycar-listings-foot') });
    await page.goBack();
    await page.waitForTimeout(700);
    log(journal, 'E retour arrière après pagination (replaceState attendu → revient à B ?)', { url: page.url(), screenB: (await page.$('.kycar-screen-b')) !== null, screenD: (await page.$('.kycar-screen-d')) !== null });

    // F. Parcours complet C1 → A → B → D « Opel Corsa 2017 » en partant de l'écran A via l'écran G
    await page.goto(`${BASE}/marche?fregfrom=2017&fregto=2017`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-market-card', { timeout: 90000 });
    await page.click('button:has-text("Toutes les marques")');
    await page.waitForTimeout(600);
    await page.fill('[role="dialog"] input[type="search"], [role="dialog"] input', 'opel');
    await page.waitForTimeout(500);
    const opelRow = await page.$('[role="dialog"] [role="option"]:has-text("Opel")');
    if (opelRow) { await opelRow.click(); await page.waitForTimeout(600); }
    const corsaRow = await page.$('[role="dialog"] [role="option"]:has-text("Corsa")');
    if (corsaRow) { await corsaRow.click(); await page.waitForTimeout(300); }
    const applyBtn = await page.$('[role="dialog"] button:has-text("Appliquer")');
    const applyDisabled = applyBtn ? await applyBtn.evaluate((b) => b.disabled) : null;
    if (applyBtn && !applyDisabled) { await applyBtn.click(); await page.waitForTimeout(2500); }
    log(journal, 'F écran G → Opel Corsa → Appliquer', { opelRow: opelRow !== null, corsaRow: corsaRow !== null, applyDisabled, url: page.url(), screenB: (await page.$('.kycar-screen-b')) !== null, summary: await text(page, '.kycar-market-summary-bar'), header: (await text(page, '.kycar-stat-header'))?.slice(0, 120), band: (await text(page, '.filter-bar'))?.match(/\d+ filtres actifs.*?Tout effacer/)?.[0] });
    journal.push({ screenshot: await shot(page, 'P5-F-apres-ecran-G.png') });
  } catch (e) {
    log(journal, 'ERREUR', { message: e.message, stack: e.stack?.split('\n').slice(0, 3) });
  } finally {
    save('p5-journal.json', journal);
    await context.close();
    await browser.close();
  }
})();
