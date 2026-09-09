/**
 * KYCAR — recette navigateur du chantier 2.10 « finition visuelle » (dette D8-43)
 * =================================================================================================
 * Un test par constat `ACC-nn` de `reports/ACCEPTANCE.md` §8 encore ouvert après la rev 2. Chaque
 * test a été écrit ROUGE contre le build d'avant la correction (D-32) et cite l'exigence mesurée.
 *
 * Conventions du harnais (`tests/e2e/README.md`) : interrogation par rôle, libellé ou texte normatif ;
 * une classe CSS n'est utilisée que lorsqu'elle EST le contrat (ici les classes de structure du
 * bandeau et des cadres de graphe, qui portent les mesures géométriques des exigences). Aucun
 * `test.fail()`, aucun `test.skip` hors inadéquation de plate-forme.
 */
import { test, expect } from '@playwright/test';
import {
  P1_QUERY,
  P2_PATH,
  open,
  regimeOf,
  mesure,
  brushScatter,
  stripSpaces,
} from './_helpers';

/* ================================================================================================
 * ACC-02 — `EX-SCR-56` : le bandeau de filtres COLLE, et sa hauteur repliée est bornée
 * ============================================================================================== */

test.describe('ACC-02 — bandeau de filtres collant et borné (EX-SCR-56)', () => {
  for (const [nom, url] of [
    ['écran A', `/marche${P1_QUERY}`],
    ['écran B', P2_PATH],
  ] as const) {
    test(`${nom} : après 1 200 px de défilement le bandeau reste visible sous l’en-tête (EX-SCR-56)`, async ({
      page,
    }, testInfo) => {
      await open(page, url);

      // Défilement franc de la page, bien au-delà de la hauteur du bandeau.
      await page.evaluate(() => window.scrollTo(0, 1200));
      await page.waitForTimeout(150);

      const geom = await page.evaluate(() => {
        const band = document.querySelector('.kycar-filter-band');
        const header = document.querySelector('.kycar-header');
        if (band === null || header === null) return null;
        const b = band.getBoundingClientRect();
        const h = header.getBoundingClientRect();
        return {
          scrollY: window.scrollY,
          bandTop: Math.round(b.top),
          bandBottom: Math.round(b.bottom),
          headerBottom: Math.round(h.bottom),
          viewport: window.innerHeight,
        };
      });
      expect(geom, 'bandeau ou en-tête absent du DOM').not.toBeNull();
      if (geom === null) return;
      mesure(
        testInfo,
        `ACC-02 ${nom} — bandeau après défilement`,
        `scrollY=${geom.scrollY} · bandeau y=${geom.bandTop}..${geom.bandBottom} · bas d’en-tête=${geom.headerBottom}`,
      );

      expect(geom.scrollY, 'la page doit avoir réellement défilé').toBeGreaterThan(600);
      // Collant : le bandeau est encore dans le viewport, et SOUS l'en-tête (jamais recouvert).
      expect(geom.bandTop).toBeGreaterThanOrEqual(0);
      expect(geom.bandTop).toBeGreaterThanOrEqual(geom.headerBottom - 1);
      expect(geom.bandBottom).toBeLessThanOrEqual(geom.viewport);
    });
  }

  test('hauteur repliée du bandeau ≤ 40 % du viewport, et ≤ 96 px (132 en intermédiaire) — EX-SCR-56, EX-SCR-96/97', async ({
    page,
  }, testInfo) => {
    const regime = regimeOf(testInfo);
    await open(page, `/marche${P1_QUERY}`);

    // « Replié » au sens d'`EX-SCR-56` : zones (2) et (3) fermées. `EX-SCR-92` ouvre le panneau au
    // chargement quand un groupe porte un filtre actif — on le referme pour mesurer l'état replié.
    if (regime !== 'compact') {
      const more = page.getByRole('button', { name: /Plus de filtres|Moins de filtres/ });
      if ((await more.getAttribute('aria-expanded')) === 'true') await more.click();
      await expect(more).toHaveAttribute('aria-expanded', 'false');
    }

    const m = await page.evaluate(() => {
      const band = document.querySelector('.kycar-filter-band');
      if (band === null) return null;
      const parts = Array.from(band.children).map(
        (c) => `${String(c.className).split(/\s+/)[0]}=${Math.round(c.getBoundingClientRect().height)}`,
      );
      const bar = document.querySelector('.kycar-compact-bar');
      return {
        height: Math.round(band.getBoundingClientRect().height),
        viewport: window.innerHeight,
        parts: parts.join(' · '),
        compactBar: bar === null ? null : Math.round(bar.getBoundingClientRect().height),
      };
    });
    expect(m, 'bandeau absent du DOM').not.toBeNull();
    if (m === null) return;

    mesure(
      testInfo,
      `ACC-02 — hauteur repliée (${regime})`,
      `${m.height} px sur un viewport de ${m.viewport} px (${((m.height / m.viewport) * 100).toFixed(1)} %) · ${m.parts}`,
    );
    // `EX-SCR-56` : 96 px replié ; `EX-SCR-96` porte ce plafond à 132 px en régime intermédiaire
    // (ligne primaire sur deux lignes). Dans tous les cas, jamais plus de 40 % du viewport.
    const plafond = regime === 'intermediate' ? 132 : 96;
    expect(m.height).toBeLessThanOrEqual(0.4 * m.viewport);
    expect(m.height).toBeLessThanOrEqual(plafond);
    // `EX-SCR-97` — en compact, la barre unique du bandeau mesure 56 px.
    if (regime === 'compact') expect(m.compactBar).toBe(56);
  });

  test('déplié, le bandeau ne dépasse ni 320 px ni 40 % du viewport, et sa zone (3) défile (EX-SCR-56)', async ({
    page,
  }, testInfo) => {
    test.skip(
      regimeOf(testInfo) === 'compact',
      'EX-SCR-97 : en compact les zones (2) et (3) vivent dans une FEUILLE plein écran, pas dans le bandeau',
    );
    await open(page, `/marche${P1_QUERY}`);
    const more = page.getByRole('button', { name: /Plus de filtres|Moins de filtres/ });
    if ((await more.getAttribute('aria-expanded')) === 'false') await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');

    const m = await page.evaluate(() => {
      const band = document.querySelector('.kycar-filter-band');
      const zone3 = document.querySelector('.kycar-band-panel');
      if (band === null || zone3 === null) return null;
      return {
        height: Math.round(band.getBoundingClientRect().height),
        viewport: window.innerHeight,
        overflowY: getComputedStyle(zone3).overflowY,
        scrollable: zone3.scrollHeight > zone3.clientHeight,
      };
    });
    expect(m, 'bandeau ou zone (3) absent du DOM').not.toBeNull();
    if (m === null) return;
    mesure(
      testInfo,
      'ACC-02 — hauteur dépliée',
      `${m.height} px sur ${m.viewport} px · zone (3) overflow-y=${m.overflowY}, défilante=${m.scrollable}`,
    );
    expect(m.height).toBeLessThanOrEqual(320);
    expect(m.height).toBeLessThanOrEqual(0.4 * m.viewport);
    expect(m.overflowY).toBe('auto');
    expect(m.scrollable).toBe(true);
  });
});

/* ================================================================================================
 * ACC-06 — `EX-SCR-158` / `EX-SCR-202` : le brossage 2D conduit à un écran D RESTREINT
 * ============================================================================================== */

test('ACC-06 — un brossage 2D conduit à un écran D restreint aux annonces brossées (EX-SCR-158/202, EX-CRUD-16)', async ({
  page,
}, testInfo) => {
  test.skip(
    regimeOf(testInfo) === 'compact',
    'EX-NFR-19 : sous 768 px le nuage est servi en projection 2D dégradée, brossage désactivé par contrat',
  );
  await open(page, P2_PATH);

  // Projection G4b (prix × année) : les DEUX axes portent une propriété d'annonce (EX-SCR-152).
  const g4 = page.locator('[data-graph="G4"]');
  await g4.getByRole('tab', { name: 'Prix × année' }).click();
  await page.waitForFunction(() => window.location.search.includes('g4v='), null, { timeout: 20_000 });

  await brushScatter(page);
  await page.waitForFunction(() => window.location.search.includes('selx='), null, { timeout: 20_000 });

  const compteur = await page.locator('.kycar-scatter-selcount').innerText();
  const brossees = Number(stripSpaces(compteur).match(/(\d+)annonces/)?.[1] ?? NaN);
  expect(Number.isFinite(brossees) && brossees > 0, `compteur illisible : « ${compteur} »`).toBe(true);

  await page.getByRole('button', { name: 'Voir ces annonces' }).click();
  await expect(page.locator('.kycar-listings-head')).toBeVisible({ timeout: 30_000 });

  const sel = new URL(page.url()).searchParams.get('sel');
  const portee = await page.locator('.kycar-listings-scope').innerText();
  const affichees = Number(stripSpaces(portee).match(/(\d+)lignesaffichées/)?.[1] ?? NaN);
  mesure(testInfo, 'ACC-06 — brossage → écran D', `${brossees} brossées · sel=${sel} · « ${portee.trim()} »`);

  // `EX-SCR-202` : `sel` porte les DEUX axes (deux paires de bornes), et l'écran D montre
  // EXACTEMENT les annonces brossées.
  expect(sel).toMatch(/^[\d.]+-[\d.]+_r[\d.]+-[\d.]+_k[\d.]+-[\d.]+$/);
  expect(affichees).toBe(brossees);

  // `EX-CRUD-16` — l'export « Annonces du périmètre » suit ce que l'écran affiche.
  const download = page.waitForEvent('download', { timeout: 30_000 });
  await page.getByRole('button', { name: 'CSV des annonces du périmètre' }).click();
  const file = await (await download).path();
  expect(file).not.toBeNull();
  const { readFileSync } = await import('node:fs');
  // BOM d'`EX-DATA-123bis` retiré avant le découpage : sans cela la première ligne `#` de l'en-tête
  // de fichier ne serait pas reconnue comme telle et fausserait le décompte d'une unité.
  const csv = readFileSync(String(file), 'utf8').replace(/^\uFEFF/, '');
  const lignes = csv.split('\n').filter((l) => l.trim() !== '' && !l.startsWith('#')).length - 1;
  mesure(testInfo, 'ACC-06 — CSV des annonces du périmètre', `${lignes} lignes de données`);
  expect(lignes).toBe(brossees);
});

/* ================================================================================================
 * ACC-03 — `EX-SCR-181` : le régime compact de l'écran B
 * ============================================================================================== */

test.describe('ACC-03 — régime compact de l’écran B (EX-SCR-181)', () => {
  test('hauteurs, en-tête à 5 lignes, boutons défilables, une étiquette sur trois, G8 à 10, G7 non tracé', async ({
    page,
  }, testInfo) => {
    test.skip(regimeOf(testInfo) !== 'compact', 'EX-SCR-181 ne décrit que le régime compact (< 768 px)');
    await open(page, P2_PATH);

    const m = await page.evaluate(() => {
      const h = (sel: string): number => {
        const el = document.querySelector(sel);
        return el === null ? -1 : Math.round(el.getBoundingClientRect().height);
      };
      const actions = document.querySelector('.kycar-stat-actions');
      return {
        hist: h('[data-graph="G1"] svg.kycar-hist'),
        canvas: h('[data-graph="G4"] canvas'),
        additional: h('[data-graph="G9"] .kycar-graph-body'),
        statLines: document.querySelectorAll('.kycar-stat-header .kycar-stat-line').length,
        actionsOverflow: actions === null ? 'absent' : getComputedStyle(actions).overflowX,
        g1Labels: document.querySelectorAll('[data-graph="G1"] svg.kycar-hist text').length,
        g1Bars: document.querySelectorAll('[data-graph="G1"] svg.kycar-hist rect[role="button"]').length,
      };
    });
    mesure(
      testInfo,
      'ACC-03 — géométrie du régime compact',
      `G1=${m.hist} px · G4=${m.canvas} px · additionnels=${m.additional} px · en-tête=${m.statLines} lignes · boutons overflow-x=${m.actionsOverflow} · G1 ${m.g1Labels} textes pour ${m.g1Bars} barres`,
    );

    expect(m.hist).toBe(200);
    expect(m.canvas).toBe(320);
    expect(m.additional).toBe(240);
    expect(m.statLines).toBe(5);
    expect(m.actionsOverflow).toBe('auto');

    // `EX-SCR-181` — une étiquette d'axe sur trois : au plus ⌈barres / 3⌉ étiquettes d'axe X, plus
    // les deux graduations de l'axe des effectifs (max et 0).
    expect(m.g1Labels).toBeLessThanOrEqual(Math.ceil(m.g1Bars / 3) + 2);

    // `EX-SCR-181` — G8 montre 10 sucettes, les autres derrière « Afficher 10 de plus ».
    const g8Visible = await page.locator('[data-graph="G8"] li.kycar-lollipop:visible').count();
    mesure(testInfo, 'ACC-03 — G8 en compact', `${g8Visible} sucettes visibles`);
    expect(g8Visible).toBeLessThanOrEqual(10);
    await expect(page.locator('[data-graph="G8"] summary')).toContainText(/Afficher \d+ de plus/);

    // `EX-SCR-181` — G7 n'est pas tracé et le dit.
    await expect(page.locator('[data-graph="G7"]')).toContainText('Densité disponible sur écran large');
    expect(await page.locator('[data-graph="G7"] svg.kycar-heatmap').count()).toBe(0);
  });

  test('appui long sur un point de G4 : infobulle en feuille basse avec « Ouvrir l’annonce » (EX-SCR-181)', async ({
    page,
  }, testInfo) => {
    test.skip(regimeOf(testInfo) !== 'compact', 'EX-SCR-181 : l’appui long est l’interaction tactile du régime compact');
    await open(page, P2_PATH);

    const canvas = page.locator('[data-graph="G4"] canvas');
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    expect(box, 'canvas G4 absent').not.toBeNull();
    if (box === null) return;

    // Balayage de la zone de tracé : l'appui long n'ouvre la feuille que SUR un point.
    const sheet = page.getByRole('dialog', { name: 'Annonce sélectionnée' });
    let ouverte = false;
    for (let i = 1; i <= 12 && !ouverte; i += 1) {
      for (let j = 1; j <= 6 && !ouverte; j += 1) {
        const x = box.x + (box.width * i) / 13;
        const y = box.y + (box.height * j) / 7;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.waitForTimeout(700); // > 500 ms (LONG_PRESS_MS)
        await page.mouse.up();
        ouverte = await sheet.isVisible();
      }
    }
    mesure(testInfo, 'ACC-03 — appui long sur G4', ouverte ? 'feuille basse ouverte' : 'aucun point atteint');
    expect(ouverte, 'aucun appui long n’a ouvert la feuille basse').toBe(true);
    await expect(sheet.getByRole('button', { name: 'Ouvrir l’annonce' })).toBeVisible();
    await sheet.getByRole('button', { name: 'Fermer' }).click();
    await expect(sheet).toBeHidden();
  });

  test('un appui déplacé n’ouvre pas la feuille basse (EX-SCR-181, geste annulé au déplacement)', async ({
    page,
  }, testInfo) => {
    test.skip(regimeOf(testInfo) !== 'compact', 'EX-SCR-181 : régime compact');
    await open(page, P2_PATH);
    const canvas = page.locator('[data-graph="G4"] canvas');
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    if (box === null) return;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 60, y + 40, { steps: 6 });
    await page.waitForTimeout(700);
    await page.mouse.up();
    await expect(page.getByRole('dialog', { name: 'Annonce sélectionnée' })).toBeHidden();
  });
});

/* ================================================================================================
 * ACC-04 — `EX-SCR-180` : le régime intermédiaire de l'écran B
 * ============================================================================================== */

test('ACC-04 — régime intermédiaire : G3 et G8 en pleine largeur, G4 à 400 px, légendes dessous (EX-SCR-180)', async ({
  page,
}, testInfo) => {
  test.skip(regimeOf(testInfo) !== 'intermediate', 'EX-SCR-180 ne décrit que le régime intermédiaire (768–1279 px)');
  await open(page, P2_PATH);

  const m = await page.evaluate(() => {
    const w = (sel: string): number => {
      const el = document.querySelector(sel);
      return el === null ? -1 : Math.round(el.getBoundingClientRect().width);
    };
    const canvas = document.querySelector('[data-graph="G4"] canvas');
    const legend = document.querySelector('.kycar-scatter-legend');
    return {
      histRow: w('.kycar-hist-row'),
      g1: w('[data-graph="G1"]'),
      g3: w('[data-graph="G3"]'),
      grid: w('.kycar-graph-grid'),
      g8: w('[data-graph="G8"]'),
      g9: w('[data-graph="G9"]'),
      canvasHeight: canvas === null ? -1 : Math.round(canvas.getBoundingClientRect().height),
      legendPosition: legend === null ? 'absent' : getComputedStyle(legend).position,
      legendBelowCanvas:
        canvas !== null && legend !== null
          ? legend.getBoundingClientRect().top >= canvas.getBoundingClientRect().bottom - 1
          : false,
    };
  });
  mesure(
    testInfo,
    'ACC-04 — géométrie du régime intermédiaire',
    `rangée=${m.histRow} · G1=${m.g1} · G3=${m.g3} · grille=${m.grid} · G8=${m.g8} · G9=${m.g9} · G4=${m.canvasHeight} px · légende ${m.legendPosition}, dessous=${m.legendBelowCanvas}`,
  );

  // `G1` sur une demi-rangée, `G3` seul en pleine largeur ; idem `G9` (demi) et `G8` (pleine).
  expect(m.g1).toBeLessThan(m.histRow * 0.6);
  expect(m.g3).toBeGreaterThan(m.histRow * 0.9);
  expect(m.g9).toBeLessThan(m.grid * 0.6);
  expect(m.g8).toBeGreaterThan(m.grid * 0.9);
  expect(m.canvasHeight).toBe(400);
  expect(m.legendPosition).toBe('static');
  expect(m.legendBelowCanvas).toBe(true);
});
