// P1 (complément) — zones-modèles, transition A → B → A, bandeau C3, 404.
const { launch, log, text, texts, shot, save, timeToSelector, BASE } = require('./_common.cjs');

(async () => {
  const journal = [];
  const { browser, context, page, consoleErrors, requests } = await launch();
  try {
    const url1 = `${BASE}/marche?body=3&kmto=100000&priceto=20000`;
    const t1 = await timeToSelector(page, url1, '.kycar-market-card');
    await page.waitForTimeout(600);
    log(journal, 'P1b-1 URL filtrée (sans cy)', { landed: page.url(), ...t1, summary: await text(page, '.kycar-market-summary-bar') });

    // DOM du bandeau C3 : doublon ?
    const c3 = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.kycar-market-banner-c3, .kycar-market-banners > *, .kycar-market-banners .kycar-market-banner')];
      return els.map((e) => ({ tag: e.tagName, cls: e.className, text: e.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) }));
    });
    log(journal, 'P1b-1 DOM des bandeaux de l’écran A', { c3 });

    // Cartes avant tout clic : zones ?
    const before = await page.evaluate(() => {
      const c = document.querySelector('.kycar-market-card');
      return { zoneCount: c.querySelectorAll('.kycar-market-zone-list > *').length, summary: c.querySelector('.kycar-market-card-summary')?.textContent.replace(/\s+/g, ' ').trim(), footer: c.querySelector('.kycar-market-card-footer')?.textContent };
    });
    log(journal, 'P1b-2 première carte AVANT clic sur l’en-tête', before);

    // Clic sur l'en-tête (onSelectMake → toggleExpand + loadModelsForMake)
    await page.click('.kycar-market-card .kycar-market-card-header');
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => {
      const c = document.querySelector('.kycar-market-card');
      const zones = [...c.querySelectorAll('.kycar-market-zone-list > *')].slice(0, 8).map((z) => z.textContent.replace(/\s+/g, ' ').trim());
      return { url: location.href, zoneCount: c.querySelectorAll('.kycar-market-zone-list > *').length, summary: c.querySelector('.kycar-market-card-summary')?.textContent.replace(/\s+/g, ' ').trim(), footer: c.querySelector('.kycar-market-card-footer')?.textContent, zones, summaryBar: document.querySelector('.kycar-market-summary-bar')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) };
    });
    log(journal, 'P1b-2 première carte APRÈS clic sur l’en-tête', after);
    journal.push({ screenshot: await shot(page, 'P1b-2-carte-apres-clic-entete.png') });

    // Déplier la 2e carte par le bouton de pied si présent, sinon en-tête
    const second = (await page.$$('.kycar-market-card'))[1];
    if (second) {
      await (await second.$('.kycar-market-card-header')).click();
      await page.waitForTimeout(1200);
      const s2 = await second.evaluate((c) => ({ zoneCount: c.querySelectorAll('.kycar-market-zone-list > *').length, summary: c.querySelector('.kycar-market-card-summary')?.textContent.replace(/\s+/g, ' ').trim(), footer: c.querySelector('.kycar-market-card-footer')?.textContent }));
      log(journal, 'P1b-2 deuxième carte après clic en-tête', s2);
    }

    // Clic sur la première zone-modèle → écran B, filtres conservés
    const zone = await page.$('.kycar-market-card .kycar-market-zone-list > *');
    const zoneLabel = zone ? (await zone.innerText()).replace(/\s+/g, ' ') : null;
    const zoneAria = zone ? await zone.getAttribute('aria-label') : null;
    if (zone) {
      await zone.click();
      await page.waitForSelector('.kycar-screen-b', { timeout: 90000 });
      await page.waitForTimeout(600);
    }
    log(journal, 'P1b-3 A → B par clic sur une zone-modèle', { zoneLabel, zoneAria, url: page.url(), header: await text(page, '.kycar-stat-header'), breadcrumb: await text(page, '.kycar-breadcrumb'), band: (await text(page, '.filter-bar'))?.match(/\d+ filtres actifs.*?(Tout effacer)/)?.[0] });
    journal.push({ screenshot: await shot(page, 'P1b-3-ecran-B-depuis-A.png') });

    // Retour par le fil d'Ariane (EX-NAV-16 : mmmv réinjecté)
    await page.click('.kycar-breadcrumb a');
    await page.waitForSelector('.kycar-market-card', { timeout: 90000 });
    await page.waitForTimeout(600);
    log(journal, 'P1b-4 B → A par le fil d’Ariane', { url: page.url(), summary: await text(page, '.kycar-market-summary-bar'), cards: (await page.$$('.kycar-market-card')).length, band: (await text(page, '.filter-bar'))?.match(/\d+ filtres actifs.*?(Tout effacer)/)?.[0] });
    journal.push({ screenshot: await shot(page, 'P1b-4-retour-A.png') });

    // Historique navigateur : retour arrière restaure l'écran B
    await page.goBack();
    await page.waitForTimeout(1200);
    log(journal, 'P1b-5 history.back()', { url: page.url(), screenB: (await page.$('.kycar-screen-b')) !== null });

    // Régime compact (360 px) : bandeau et cartes
    const ctx3 = await browser.newContext({ viewport: { width: 360, height: 740 }, locale: 'fr-BE', isMobile: true, hasTouch: true });
    const p3 = await ctx3.newPage();
    await p3.goto(url1, { waitUntil: 'commit' });
    await p3.waitForSelector('.kycar-market-card', { timeout: 90000 });
    await p3.waitForTimeout(600);
    const compact = await p3.evaluate(() => ({
      bodyScrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth,
      summary: document.querySelector('.kycar-market-summary-bar')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 160),
      filterBar: document.querySelector('.filter-bar')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 160),
      cardWidth: document.querySelector('.kycar-market-card')?.getBoundingClientRect().width,
      columns: getComputedStyle(document.querySelector('.kycar-market-grid')).gridTemplateColumns,
    }));
    log(journal, 'P1b-6 régime compact 360 px', compact);
    journal.push({ screenshot: await shot(p3, 'P1b-6-compact-360.png') });
    await ctx3.close();
  } catch (e) {
    log(journal, 'ERREUR', { message: e.message, stack: e.stack?.split('\n').slice(0, 4) });
  } finally {
    log(journal, 'P1b fin', { consoleErrors, externalRequests: requests.filter((u) => !u.startsWith(BASE)) });
    save('p1b-journal.json', journal);
    await context.close();
    await browser.close();
  }
})();
