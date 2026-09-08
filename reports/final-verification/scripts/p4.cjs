// Observations ciblées : ouverture d'annonce (window.open instrumenté), mode modelId = 0,
// détail axe-core sur l'écran A, origine des erreurs <polyline> NaN, feuille d'impression.
const { launch, log, text, texts, shot, save, BASE } = require('./_common.cjs');
const { AxeBuilder } = require('@axe-core/playwright');

(async () => {
  const journal = [];
  const { browser, context, page, consoleErrors } = await launch();
  await page.addInitScript(() => {
    window.__opened = [];
    const orig = window.open.bind(window);
    window.open = (u, t, f) => { window.__opened.push({ u: String(u), t, f }); return orig(u, t, f); };
  });
  try {
    // A. Ouverture d'annonce depuis l'écran D (chemin chaud)
    await page.goto(`${BASE}/marche/54-opel/1918-corsa`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    await page.locator('.filter-bar input[aria-label="Kilométrage à"]').first().fill('200000');
    await page.locator('.filter-bar input[aria-label="Kilométrage à"]').first().press('Enter');
    await page.waitForTimeout(2500);
    await page.click('button:has-text("Voir les")');
    await page.waitForSelector('.kycar-screen-d', { timeout: 30000 });
    await page.waitForTimeout(500);
    const firstOpen = await page.$('.kycar-listings-table tbody tr .kycar-open, .kycar-listings-table tbody tr button:has-text("Ouvrir")');
    const tag = firstOpen ? await firstOpen.evaluate((e) => ({ tag: e.tagName, href: e.getAttribute('href'), target: e.getAttribute('target'), rel: e.getAttribute('rel'), outer: e.outerHTML.slice(0, 200) })) : null;
    const popupPromise = context.waitForEvent('page', { timeout: 6000 }).catch(() => null);
    if (firstOpen) await firstOpen.click();
    const popup = await popupPromise;
    await page.waitForTimeout(500);
    log(journal, 'A ouverture d’une annonce (écran D)', { control: tag, opened: await page.evaluate(() => window.__opened), popup: popup ? popup.url() : null, banner: await text(page, '.kycar-banner-message') });
    if (popup) await popup.close();
    // le même depuis G8 (sucette)
    await page.goBack();
    await page.waitForSelector('.kycar-screen-b', { timeout: 30000 });
    await page.waitForTimeout(800);
    const lolli = await page.$('.kycar-lollipop-open');
    const popupPromise2 = context.waitForEvent('page', { timeout: 6000 }).catch(() => null);
    if (lolli) await lolli.click();
    const popup2 = await popupPromise2;
    log(journal, 'A2 ouverture depuis G8', { lollipopFound: lolli !== null, opened: await page.evaluate(() => window.__opened), popup: popup2 ? popup2.url() : null });
    if (popup2) await popup2.close();
    // infobulle d'un point du nuage / titre de sucette
    const lolliTitle = lolli ? await lolli.getAttribute('title') : null;
    log(journal, 'A3 étiquetage de la base de comparaison (EX-SCR-158bis)', { lollipopTitle: lolliTitle, g8Subtitle: (await text(page, 'figure:has(.kycar-lollipops)'))?.slice(0, 400) });

    // B. Mode modelId = 0 (EX-SCR-113bis)
    await page.goto(`${BASE}/marche/54-opel/0-modele-non-identifie`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    await page.waitForTimeout(800);
    log(journal, 'B modelId = 0', { banners: await texts(page, '.status-banner, [class*="banner"], [role="status"]'), titles: await texts(page, '.kycar-graph-title, .kycar-screen-b h3', 20), compareDisabled: await page.$eval('button:has-text("Comparer")', (b) => b.disabled).catch(() => null) });

    // C. Détail axe-core sur l'écran A (color-contrast)
    await page.goto(`${BASE}/marche?priceto=20000`, { waitUntil: 'commit' });
    await page.waitForSelector('.kycar-market-card', { timeout: 90000 });
    await page.waitForTimeout(500);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const details = r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 6).map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 140), summary: n.failureSummary?.replace(/\s+/g, ' ').slice(0, 220) })), distinctTargets: [...new Set(v.nodes.map((n) => n.target.join(' ').replace(/nth-child\(\d+\)/g, 'nth-child(n)')))].slice(0, 12) }));
    log(journal, 'C axe écran A — détail', { violations: details });
    // écran A sans filtre et écran A carte dépliée
    await page.click('.kycar-market-card .kycar-market-card-header');
    await page.waitForTimeout(1200);
    const r2 = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    log(journal, 'C2 axe écran A carte dépliée', { rules: r2.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length})`) });
    // écran G ouvert
    await page.click('button:has-text("Toutes les marques")');
    await page.waitForTimeout(800);
    const r3 = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    log(journal, 'C3 axe écran G ouvert', { rules: r3.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length})`) });
    await page.keyboard.press('Escape');

    // D. Origine des erreurs <polyline> NaN : écran C seul, puis écran B seul
    const errs = [];
    const p2 = await context.newPage();
    p2.on('console', (m) => { if (m.type() === 'error') errs.push(`[C] ${m.text().slice(0, 120)}`); });
    await p2.goto(`${BASE}/comparer?m=54-1918,74-2084`, { waitUntil: 'commit' });
    await p2.waitForTimeout(7000);
    const cText = await p2.evaluate(() => [...document.querySelectorAll('.kycar-main figure, .kycar-main svg')].map((f) => ({ tag: f.tagName, cls: f.className?.baseVal ?? f.className, polylines: f.querySelectorAll('polyline').length, nanPolylines: [...f.querySelectorAll('polyline')].filter((p) => /NaN/.test(p.getAttribute('points') ?? '')).length, text: f.textContent.replace(/\s+/g, ' ').slice(0, 120) })));
    log(journal, 'D1 écran C : erreurs console et polylines', { errs: [...errs], figures: cText });
    errs.length = 0;
    await p2.goto(`${BASE}/marche/54-opel/1918-corsa?kmto=200000`, { waitUntil: 'commit' });
    await p2.waitForSelector('.kycar-screen-b', { timeout: 90000 });
    await p2.waitForTimeout(1500);
    const bNan = await p2.evaluate(() => [...document.querySelectorAll('.kycar-screen-b figure')].map((f) => ({ title: f.querySelector('h3,.kycar-graph-title')?.textContent, nanPolylines: [...f.querySelectorAll('polyline, path')].filter((p) => /NaN/.test((p.getAttribute('points') ?? '') + (p.getAttribute('d') ?? ''))).length })).filter((x) => x.nanPolylines > 0));
    log(journal, 'D2 écran B : erreurs console et NaN', { errs: [...errs], nan: bNan });
    await p2.close();

    // E. Feuille d'impression : quelles règles s'appliquent ?
    await page.emulateMedia({ media: 'print' });
    const printInfo = await page.evaluate(() => {
      const q = (sel) => [...document.querySelectorAll(sel)].map((e) => ({ sel, cls: e.className, display: getComputedStyle(e).display, position: getComputedStyle(e).position }));
      const rules = [];
      for (const ss of document.styleSheets) { try { for (const r of ss.cssRules) if (r.media && /print/.test(r.media.mediaText)) for (const rr of r.cssRules) rules.push(rr.cssText.slice(0, 160)); } catch (e) { rules.push('inaccessible: ' + e.message); } }
      return { filterBar: q('.kycar-filter-bar'), bandRoot: q('.filter-bar > *'), printSummary: q('.kycar-print-filter-summary'), header: q('.kycar-header'), c3: q('.kycar-market-banner-c3'), rules };
    });
    log(journal, 'E média print — règles et états', printInfo);
    await page.emulateMedia({ media: 'screen' });
  } catch (e) {
    log(journal, 'ERREUR', { message: e.message, stack: e.stack?.split('\n').slice(0, 3) });
  } finally {
    log(journal, 'P4 fin', { consoleErrors: consoleErrors.slice(0, 12) });
    save('p4-journal.json', journal);
    await context.close();
    await browser.close();
  }
})();
