/**
 * KYCAR — recette navigateur de la décision D3-46 (v0.1.1, retour de test du commanditaire)
 * =================================================================================================
 * Retour d'origine : « la barre de filtres est vraiment mal faite et ça entrave le testing » —
 * (1) défilement horizontal très long de la ligne primaire ; (2) une valeur tapée s'applique avant la
 * fin de la saisie et le défilement revient au début ; (3) en-tête + fil d'Ariane + bandeau, tous
 * collants, mangent un tiers de la page. Traduction arbitrée : `reports/data/DATA-LEAD-DECISIONS.md`
 * D3-46 (a)–(d). Chaque test ci-dessous a été écrit ROUGE contre le build v0.1.0 (sorties dans
 * `reports/ux/ux-filters.md`) avant toute correction (D-32).
 *
 * Contrat de structure exercé (les classes SONT le contrat de la barre condensée, comme les classes
 * d'impression pour `print.css`) : `.kycar-band-bar` (la seule région collante du bandeau),
 * `[data-band-filter]` (les trois filtres toujours visibles), `.kycar-band-panel` (panneau déplié,
 * région « Tous les filtres »), `.kycar-filter-card` (une carte par groupe), les pieds collants
 * `.kycar-band-panel__footer` / `.kycar-compact-sheet__footer`. Tout le reste est interrogé par rôle
 * et libellé.
 */
import { test, expect, type Locator, type Page } from '@playwright/test';

import {
  DENSE_QUERY,
  P1_QUERY,
  P2_PATH,
  derived,
  mesure,
  open,
  readMarketSummary,
  regimeOf,
  stripSpaces,
  waitForMarket,
} from './_helpers';

type Regime = ReturnType<typeof regimeOf>;

/** Budget de hauteur collante D3-46 (d). */
function stickyBudget(regime: Regime): number {
  return regime === 'compact' ? 56 : 64;
}

/** La barre condensée (collante) du bandeau. */
function bar(page: Page): Locator {
  return page.locator('.kycar-band-bar');
}

/**
 * Débordements horizontaux : celui du DOCUMENT, et tout élément du bandeau (barre, panneau, feuille)
 * dont le contenu déborde de sa boîte (`scrollWidth > clientWidth + 1`) ou qui sort du viewport.
 * Les éléments de 1 px (masqués visuellement pour les technologies d'assistance) sont exclus.
 */
async function horizontalOverflow(page: Page): Promise<{ doc: number; client: number; offenders: string[] }> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const offenders = new Set<string>();
    const describe = (el: Element): string =>
      `${el.tagName.toLowerCase()}.${String(el.className).split(/\s+/)[0] ?? ''}`;
    const roots = document.querySelectorAll('.kycar-filter-band, .kycar-band-panel, .kycar-compact-sheet');
    for (const root of Array.from(roots)) {
      for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.display === 'contents' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1) continue;
        if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) {
          offenders.add(`${describe(el)} scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}`);
        }
        if (r.right > doc.clientWidth + 1 || r.left < -1) {
          offenders.add(`${describe(el)} hors viewport (${Math.round(r.left)}..${Math.round(r.right)})`);
        }
      }
    }
    return { doc: doc.scrollWidth, client: doc.clientWidth, offenders: Array.from(offenders).slice(0, 12) };
  });
}

/**
 * Hauteur collante occupée en haut du viewport : union CONTIGUË, depuis y = 0, des boîtes de tous
 * les éléments `position: sticky | fixed` rendus. Un élément collant entièrement recouvert par un
 * autre (même intervalle) ne compte pas deux fois ; un élément qui dépasse sous la barre, si.
 */
async function stickyHeight(page: Page): Promise<{ height: number; parts: string }> {
  return page.evaluate(() => {
    const iv: [number, number, string][] = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'sticky' && cs.position !== 'fixed') continue;
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.height <= 1 || r.width <= 1 || r.bottom <= 0 || r.top >= window.innerHeight) continue;
      iv.push([Math.max(0, r.top), r.bottom, String(el.className).split(/\s+/)[0] ?? el.tagName]);
    }
    iv.sort((a, b) => a[0] - b[0]);
    let cover = 0;
    const parts: string[] = [];
    for (const [top, bottom, name] of iv) {
      if (top > cover + 1) continue;
      parts.push(`${name} ${Math.round(top)}–${Math.round(bottom)}`);
      cover = Math.max(cover, bottom);
    }
    return { height: Math.round(cover), parts: parts.join(' · ') };
  });
}

/** Ouvre le panneau « Tous les filtres » (large, intermédiaire) ou la feuille (compact). */
async function openAll(page: Page, regime: Regime): Promise<Locator> {
  if (regime === 'compact') {
    await bar(page).getByRole('button', { name: /^Filtres/ }).click();
    const sheet = page.getByRole('dialog', { name: 'Filtres' });
    await expect(sheet).toBeVisible();
    return sheet;
  }
  await bar(page).getByRole('button', { name: /^Tous les filtres/ }).click();
  const panel = page.getByRole('region', { name: 'Tous les filtres' });
  await expect(panel).toBeVisible();
  return panel;
}

/** Compte les appels `pushState`/`replaceState` à partir de maintenant. */
async function watchHistory(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __navs: string[] };
    w.__navs = [];
    const push = history.pushState.bind(history);
    const replace = history.replaceState.bind(history);
    history.pushState = (...args: Parameters<History['pushState']>) => {
      w.__navs.push(`push ${String(args[2])}`);
      push(...args);
    };
    history.replaceState = (...args: Parameters<History['replaceState']>) => {
      w.__navs.push(`replace ${String(args[2])}`);
      replace(...args);
    };
  });
}

async function historyCalls(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __navs?: string[] }).__navs ?? []);
}

/* ================================================================================================
 * (a) — aucun défilement horizontal, trois filtres toujours visibles
 * ============================================================================================== */

test.describe('D3-46 (a) — bandeau replié : trois filtres visibles, aucun défilement horizontal', () => {
  for (const [nom, url] of [
    ['écran A', '/marche'],
    ['écran A filtré (P1)', `/marche${P1_QUERY}`],
    ['écran B', P2_PATH],
  ] as const) {
    test(`${nom} : ni le document ni un élément du bandeau ne défile horizontalement`, async ({ page }, testInfo) => {
      await open(page, url);
      const m = await horizontalOverflow(page);
      mesure(testInfo, `D3-46 (a) ${nom} — débordement`, `document ${m.doc}/${m.client} · ${m.offenders.join(' | ') || 'aucun élément'}`);
      expect(m.doc).toBeLessThanOrEqual(m.client);
      expect(m.offenders).toEqual([]);
    });
  }

  test('exactement trois filtres toujours visibles (Marque et modèle, Prix, Kilométrage) + « Tous les filtres »', async ({
    page,
  }, testInfo) => {
    const regime = regimeOf(testInfo);
    await open(page, '/marche');
    await expect(bar(page)).toBeVisible();

    const visibles = await bar(page)
      .locator('[data-band-filter]')
      .evaluateAll((els) =>
        els
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 1 && r.height > 1 && getComputedStyle(el).visibility !== 'hidden';
          })
          .map((el) => el.getAttribute('data-band-filter')),
      );
    mesure(testInfo, `D3-46 (a) — filtres visibles dans la barre (${regime})`, visibles.join(', ') || 'aucun');

    if (regime === 'compact') {
      // Compact : la barre porte le RÉSUMÉ (« Filtres (n) » + effectif), les filtres vivent dans la feuille.
      expect(visibles).toEqual([]);
      await expect(bar(page).getByRole('button', { name: /^Filtres/ })).toBeVisible();
      await expect(bar(page)).toContainText(/offres?/);
      return;
    }
    expect(visibles).toEqual(['makesModelsVariants', 'priceFrom', 'mileageFrom']);
    await expect(bar(page).getByRole('button', { name: /^Tous les filtres/ })).toBeVisible();
    await expect(bar(page).getByLabel('Prix à', { exact: true })).toBeVisible();
    await expect(bar(page).getByLabel('Kilométrage à', { exact: true })).toBeVisible();
    // Les autres primaires (carburant, carrosserie…) ne sont PAS dans la barre repliée.
    await expect(page.getByLabel('Coupé', { exact: true })).toHaveCount(0);
  });
});

/* ================================================================================================
 * (b) — « Tous les filtres » : cartes en grille sur la largeur, recherche en tête
 * ============================================================================================== */

test('D3-46 (b) — panneau déplié : toutes les cartes dépliées, en colonnes sur toute la largeur, sans barre horizontale, recherche en tête', async ({
  page,
}, testInfo) => {
  const regime = regimeOf(testInfo);
  await open(page, `/marche${P1_QUERY}`);
  const panel = await openAll(page, regime);

  const cards = panel.locator('.kycar-filter-card');
  // La carte « Essentiels » en tête, puis une carte par groupe d'`EX-SCR-93` portant au moins un
  // filtre non primaire (12 sur 14 : `kilometrage` et `vendeur` n'ont que des primaires, déjà dans la
  // barre ou dans « Essentiels » — chaque filtre n'apparaît qu'une fois).
  expect(await cards.count()).toBe(13);
  await expect(cards.first()).toHaveAttribute('data-card', 'essentiels');
  await expect(panel.getByLabel('Rechercher un filtre')).toBeVisible();
  // Aucun filtre en double : un seul champ « Prix à » et une seule case « Coupé » sur la page.
  await expect(page.getByLabel('Prix à', { exact: true })).toHaveCount(1);
  await expect(page.getByLabel('Coupé', { exact: true })).toHaveCount(1);

  // Retouche coordinateur : « déplier TOUS les filtres en cartes » — aucune carte repliée, aucune
  // carte réduite à son titre.
  await expect(panel.locator('.kycar-filter-card[data-expanded="false"]')).toHaveCount(0);
  const g = await panel.evaluate((el) => {
    const cardEls = Array.from(el.querySelectorAll('.kycar-filter-card'));
    const lefts = cardEls.map((c) => Math.round(c.getBoundingClientRect().left));
    const firstRow = new Set(lefts).size; // nombre de colonnes occupées
    // Ordre du DOM (= tabulation) : colonne par colonne, de haut en bas.
    const pos = cardEls.map((c) => {
      const r = c.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.top)] as const;
    });
    const domOrderIsColumnOrder = pos.every(
      (p, i) => i === 0 || p[0] > pos[i - 1]![0] || (p[0] === pos[i - 1]![0] && p[1] > pos[i - 1]![1]),
    );
    const empty = cardEls.filter((c) => c.querySelector('.kycar-secondary-group__body') === null).length;
    const grid = el.querySelector('.kycar-filter-cards');
    const r = el.getBoundingClientRect();
    return {
      firstRow,
      domOrderIsColumnOrder,
      empty,
      columns: grid === null ? '' : `column-width ${getComputedStyle(grid).columnWidth}`,
      width: Math.round(r.width),
      height: Math.round(r.height),
      viewportW: document.documentElement.clientWidth,
      viewportH: window.innerHeight,
    };
  });
  const m = await horizontalOverflow(page);
  mesure(
    testInfo,
    `D3-46 (b) — panneau (${regime})`,
    `${g.firstRow} colonnes · ${g.columns} · ordre DOM = ordre des colonnes : ${g.domOrderIsColumnOrder} · ${g.width}×${g.height} px sur ${g.viewportW}×${g.viewportH} · débordements : ${m.offenders.join(' | ') || 'aucun'}`,
  );
  expect(m.doc).toBeLessThanOrEqual(m.client);
  expect(m.offenders).toEqual([]);
  expect(g.empty).toBe(0);
  expect(g.domOrderIsColumnOrder).toBe(true);
  // Sur toute la largeur de l'écran (à la gouttière près).
  expect(g.width).toBeGreaterThanOrEqual(g.viewportW - 40);
  if (regime === 'large') expect(g.firstRow).toBeGreaterThanOrEqual(3);
  if (regime === 'intermediate') expect(g.firstRow).toBeGreaterThanOrEqual(2);
  if (regime === 'compact') expect(g.firstRow).toBe(1);
  // Hors compact, le panneau est borné à 70 % du viewport (défilement vertical interne).
  if (regime !== 'compact') expect(g.height).toBeLessThanOrEqual(Math.ceil(0.7 * g.viewportH) + 1);

  // Échap referme sans appliquer, et le focus revient au bouton qui a ouvert le panneau.
  if (regime !== 'compact') {
    await panel.getByLabel('Rechercher un filtre').focus();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(bar(page).getByRole('button', { name: /^Tous les filtres/ })).toBeFocused();
  }
});

/* ================================================================================================
 * (c) — brouillon + « Appliquer » : plus aucune application automatique
 * ============================================================================================== */

test('D3-46 (c) — saisir un prix caractère par caractère ne navigue pas ; « Appliquer » navigue UNE fois, « Annuler » rétablit, Entrée applique', async ({
  page,
}, testInfo) => {
  const regime = regimeOf(testInfo);
  const compact = regime === 'compact';
  await open(page, '/marche');
  const attendu = (await derived()).dense;

  // Hors compact : la page est défilée AVANT la saisie, le défilement ne doit pas bouger.
  if (!compact) {
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(150);
  }
  const scope = compact ? await openAll(page, regime) : bar(page);
  const before = page.url();
  const scrollBefore = await page.evaluate(() => window.scrollY);

  const price = scope.getByLabel('Prix à', { exact: true });
  await price.click();
  for (const ch of '20000') {
    await page.keyboard.type(ch);
    await page.waitForTimeout(800);
    expect(page.url(), `la frappe « ${ch} » a navigué`).toBe(before);
  }
  await expect(price).toBeFocused();
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(2);

  // « Appliquer » collant, visible, avec l'effectif PRÉVISIONNEL du brouillon (dérivé, jamais figé).
  const applyScope = compact ? page.locator('.kycar-compact-sheet__footer') : bar(page);
  const apply = applyScope.getByRole('button', { name: /^Appliquer/ });
  await expect(apply).toBeVisible();
  await expect
    .poll(async () => stripSpaces(await apply.innerText()), { timeout: 20_000 })
    .toContain(stripSpaces(`${attendu.offers} offres`));
  // Annonce polie de l'effectif prévisionnel (`aria-live`).
  await expect(page.locator('.kycar-band-draft-status')).toContainText(/offres?/);
  mesure(testInfo, `D3-46 (c) — bouton d'application (${regime})`, await apply.innerText());

  // « Annuler » rétablit la sélection appliquée, sans navigation.
  await applyScope.getByRole('button', { name: /^Annuler/ }).click();
  await expect(price).toHaveValue('');
  expect(page.url()).toBe(before);
  if (!compact) await expect(bar(page).getByRole('button', { name: /^Appliquer/ })).toHaveCount(0);

  // Entrée dans le champ applique : une seule écriture d'historique, URL canonique.
  await watchHistory(page);
  await price.fill('20000');
  await page.waitForTimeout(900);
  expect(page.url()).toBe(before);
  await price.press('Enter');
  await page.waitForFunction(() => window.location.search.includes('priceto=20000'), null, { timeout: 20_000 });
  await waitForMarket(page);
  expect(new URL(page.url()).search).toBe(DENSE_QUERY);
  const calls = await historyCalls(page);
  mesure(testInfo, `D3-46 (c) — écritures d'historique à l'application (${regime})`, calls.join(' | '));
  expect(calls).toHaveLength(1);
  expect(calls[0]).toMatch(/^push /);
  if (!compact) {
    // Le défilement n'est pas RÉINITIALISÉ : la page ne remonte pas. Elle peut descendre de la
    // hauteur de la ligne des jetons qui apparaît au-dessus du contenu (ancrage de défilement du
    // navigateur : le contenu regardé reste immobile à l'écran).
    const tokensHeight = await page.evaluate(() =>
      Math.ceil(document.querySelector('.kycar-active-tokens')?.getBoundingClientRect().height ?? 0),
    );
    const after = await page.evaluate(() => window.scrollY);
    mesure(testInfo, `D3-46 (c) — défilement après application (${regime})`, `${scrollBefore} → ${after} (jetons ${tokensHeight} px)`);
    expect(after).toBeGreaterThanOrEqual(scrollBefore - 2);
    expect(after).toBeLessThanOrEqual(scrollBefore + tokensHeight + 2);
    await expect(price).toBeFocused();
    await expect(bar(page)).toBeInViewport();
  }
  await expect.poll(async () => (await readMarketSummary(page)).offers, { timeout: 20_000 }).toBe(attendu.offers);
});

test('D3-46 (c) — dans le panneau, une modification ne réinitialise ni le défilement interne ni la page ; « Appliquer » reste visible en pied après défilement', async ({
  page,
}, testInfo) => {
  const regime = regimeOf(testInfo);
  await open(page, '/marche');
  const panel = await openAll(page, regime);
  const scroller = regime === 'compact' ? page.locator('.kycar-compact-sheet__body') : panel.locator('.kycar-band-panel__body');
  const before = page.url();

  // Défilement interne du panneau (la case visée amenée dans la vue), PUIS modification : c'est la
  // modification qui ne doit rien faire défiler, pas le geste de Playwright.
  const coupe = panel.getByLabel('Coupé', { exact: true });
  await scroller.evaluate((el) => {
    el.scrollTop = 60;
  });
  await coupe.scrollIntoViewIfNeeded();
  const top0 = await scroller.evaluate((el) => el.scrollTop);
  const page0 = await page.evaluate(() => window.scrollY);
  expect(top0, 'le panneau doit avoir défilé').toBeGreaterThan(0);
  await coupe.check();
  await page.waitForTimeout(800);
  expect(page.url()).toBe(before);
  expect(await scroller.evaluate((el) => el.scrollTop)).toBe(top0);
  expect(await page.evaluate(() => window.scrollY)).toBe(page0);

  // Défilement jusqu'en bas du panneau : le pied « Appliquer » reste visible, dans le viewport.
  await scroller.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const footer = page.locator(regime === 'compact' ? '.kycar-compact-sheet__footer' : '.kycar-band-panel__footer');
  const apply = footer.getByRole('button', { name: /^Appliquer/ });
  await expect(apply).toBeVisible();
  const box = await apply.boundingBox();
  const vh = page.viewportSize()?.height ?? 0;
  mesure(testInfo, `D3-46 (c) — pied du panneau après défilement (${regime})`, `Appliquer y=${Math.round(box?.y ?? -1)} sur ${vh}`);
  expect(box).not.toBeNull();
  expect((box?.y ?? vh) + (box?.height ?? 0)).toBeLessThanOrEqual(vh);
  const hit = await apply.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return top !== null && (top === el || el.contains(top));
  });
  expect(hit, 'le bouton « Appliquer » du pied est recouvert').toBe(true);

  // Clic : une navigation, la carrosserie est posée. Retouche coordinateur (H5 refusée) : le
  // panneau (la feuille en compact) se REFERME pour montrer le résultat, le focus revient au bouton
  // qui l'avait ouvert, et le défilement de la page ne bouge pas.
  await watchHistory(page);
  const pageBefore = await page.evaluate(() => window.scrollY);
  await apply.click();
  await page.waitForFunction(() => window.location.search.includes('body=3'), null, { timeout: 20_000 });
  expect(await historyCalls(page)).toHaveLength(1);
  await expect(panel).toBeHidden();
  await expect(
    regime === 'compact'
      ? bar(page).getByRole('button', { name: /^Filtres/ })
      : bar(page).getByRole('button', { name: /^Tous les filtres/ }),
  ).toBeFocused();
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - pageBefore)).toBeLessThanOrEqual(2);
});

test('D3-46 (c) — l’écran G applique IMMÉDIATEMENT son choix, en emportant le brouillon de la barre (une navigation)', async ({
  page,
}, testInfo) => {
  const regime = regimeOf(testInfo);
  await open(page, '/marche');
  // Un brouillon en cours : kilométrage ≤ 100 000, non appliqué.
  const scope = regime === 'compact' ? await openAll(page, regime) : bar(page);
  await scope.getByLabel('Kilométrage à', { exact: true }).fill('100000');
  await expect(page.locator('.kycar-filter-band')).toHaveAttribute('data-dirty', 'true');
  const before = page.url();
  expect(before).not.toContain('kmto=');

  await watchHistory(page);
  await scope.locator('.kycar-control--structured-picker button').first().click();
  const dialog = page.getByRole('dialog', { name: 'Sélectionner marque et modèle' });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('Rechercher…').first().fill('Opel');
  await dialog.locator('[role="option"]').first().click();
  await dialog.getByRole('button', { name: 'Appliquer' }).click();

  // UNE navigation, qui porte le choix de G ET le brouillon ; aucun second « Appliquer » requis.
  await page.waitForFunction(() => window.location.search.includes('mmmv='), null, { timeout: 20_000 });
  const url = new URL(page.url());
  const calls = await historyCalls(page);
  mesure(testInfo, `D3-46 (c) — écran G (${regime})`, `${url.pathname}${url.search} · ${calls.join(' | ')}`);
  expect(calls).toHaveLength(1);
  expect(url.searchParams.get('mmmv')).toBe('54');
  expect(url.searchParams.get('kmto')).toBe('100000');
  await expect(page.locator('.kycar-filter-band')).toHaveAttribute('data-dirty', 'false');
  await expect(bar(page).getByRole('button', { name: /^Appliquer/ })).toHaveCount(0);
});

/* ================================================================================================
 * (d) — hauteur collante mesurée
 * ============================================================================================== */

test.describe('D3-46 (d) — hauteur collante totale ≤ 64 px (≤ 56 px en compact), en-tête et fil d’Ariane non collants', () => {
  for (const [nom, url] of [
    ['écran A', `/marche${P1_QUERY}`],
    ['écran B', P2_PATH],
  ] as const) {
    test(`${nom} : après 1 200 px de défilement`, async ({ page }, testInfo) => {
      const regime = regimeOf(testInfo);
      await open(page, url);
      await page.evaluate(() => window.scrollTo(0, 1200));
      await page.waitForTimeout(200);

      const s = await stickyHeight(page);
      const geo = await page.evaluate(() => ({
        scrollY: window.scrollY,
        header: Math.round(document.querySelector('.kycar-header')?.getBoundingClientRect().bottom ?? 0),
        crumb: Math.round(document.querySelector('.kycar-breadcrumb')?.getBoundingClientRect().bottom ?? 0),
        bar: Math.round(document.querySelector('.kycar-band-bar')?.getBoundingClientRect().top ?? -999),
      }));
      mesure(
        testInfo,
        `D3-46 (d) ${nom} — hauteur collante (${regime})`,
        `${s.height} px (budget ${stickyBudget(regime)}) · ${s.parts} · scrollY=${geo.scrollY} · bas en-tête=${geo.header} · bas fil=${geo.crumb}`,
      );
      expect(geo.scrollY).toBeGreaterThan(600);
      expect(s.height).toBeLessThanOrEqual(stickyBudget(regime));
      // En-tête et fil d'Ariane ont défilé hors du viewport ; la barre condensée colle en haut.
      expect(geo.header).toBeLessThanOrEqual(0);
      expect(geo.crumb).toBeLessThanOrEqual(0);
      expect(geo.bar).toBe(0);
    });
  }

  test('brouillon sale : la barre porte « Appliquer / Annuler » sans dépasser le budget', async ({ page }, testInfo) => {
    const regime = regimeOf(testInfo);
    await open(page, `/marche${P1_QUERY}`);
    if (regime === 'compact') {
      const sheet = await openAll(page, regime);
      await sheet.getByLabel('Prix à', { exact: true }).fill('15000');
      // Fermer sans appliquer : le brouillon est CONSERVÉ, la barre porte « Appliquer ».
      await sheet.getByRole('button', { name: 'Fermer' }).click();
      await expect(sheet).toBeHidden();
    } else {
      await bar(page).getByLabel('Prix à', { exact: true }).fill('15000');
    }
    await expect(bar(page).getByRole('button', { name: /^Appliquer/ })).toBeVisible();
    await expect(bar(page).getByRole('button', { name: /^Annuler/ })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(200);
    const s = await stickyHeight(page);
    const m = await horizontalOverflow(page);
    mesure(testInfo, `D3-46 (d) — barre sale (${regime})`, `${s.height} px · ${s.parts} · débordements ${m.offenders.join(' | ') || 'aucun'}`);
    expect(s.height).toBeLessThanOrEqual(stickyBudget(regime));
    expect(m.offenders).toEqual([]);
    await expect(bar(page).getByRole('button', { name: /^Appliquer/ })).toBeInViewport();
  });
});
