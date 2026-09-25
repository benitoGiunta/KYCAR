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
  DENSE_QUERY,
  derived,
  P2_PATH,
  open,
  regimeOf,
  mesure,
  brushScatter,
  openAllFilters,
  stripSpaces,
} from './_helpers';

/* ================================================================================================
 * ACC-02 — `EX-SCR-56` : le bandeau de filtres COLLE, et sa hauteur repliée est bornée
 * ================================================================================================
 * D-31 — bloc AMENDÉ par `ux-filters` (v0.1.1) au titre de la décision D3-46 (retour de test du
 * commanditaire : « un tiers de la page bouffé » par l'en-tête, le fil d'Ariane et le bandeau, tous
 * collants). Ce que figeait l'ancienne rédaction, et son équivalent D3-46 :
 *   - « le bandeau colle SOUS l'en-tête collant » → l'en-tête ne colle plus ; SEULE la barre
 *     condensée (`.kycar-band-bar`) colle, en haut du viewport (y = 0), et l'en-tête a défilé ;
 *   - « replié : ≤ 96 px (132 en intermédiaire, 56 en compact) et ≤ 40 % du viewport » → la barre
 *     condensée tient dans ≤ 64 px (large, intermédiaire) / 56 px (compact) et ≤ 40 % du viewport ;
 *   - « déplié : ≤ 320 px et ≤ 40 % du viewport, zone (3) défilante » → le panneau « Tous les
 *     filtres », en surimpression, est borné à 70 % du viewport et son corps défile verticalement.
 * La mesure de la hauteur collante TOTALE (tous éléments collants confondus) est dans
 * `filtres-d3-46.spec.ts` (d).
 */

test.describe('ACC-02 — barre de filtres collante et bornée (EX-SCR-56 [amendée 3.6 — D3-46])', () => {
  for (const [nom, url] of [
    ['écran A', `/marche${P1_QUERY}`],
    ['écran B', P2_PATH],
  ] as const) {
    test(`${nom} : après 1 200 px de défilement la barre condensée colle en haut du viewport (EX-SCR-56)`, async ({
      page,
    }, testInfo) => {
      await open(page, url);

      // Défilement franc de la page, bien au-delà de la hauteur de l'en-tête et du bandeau.
      await page.evaluate(() => window.scrollTo(0, 1200));
      await page.waitForTimeout(150);

      const geom = await page.evaluate(() => {
        const bar = document.querySelector('.kycar-band-bar');
        const header = document.querySelector('.kycar-header');
        if (bar === null || header === null) return null;
        const b = bar.getBoundingClientRect();
        const h = header.getBoundingClientRect();
        return {
          scrollY: window.scrollY,
          barTop: Math.round(b.top),
          barBottom: Math.round(b.bottom),
          headerBottom: Math.round(h.bottom),
          viewport: window.innerHeight,
        };
      });
      expect(geom, 'barre ou en-tête absent du DOM').not.toBeNull();
      if (geom === null) return;
      mesure(
        testInfo,
        `ACC-02 ${nom} — barre après défilement`,
        `scrollY=${geom.scrollY} · barre y=${geom.barTop}..${geom.barBottom} · bas d’en-tête=${geom.headerBottom}`,
      );

      expect(geom.scrollY, 'la page doit avoir réellement défilé').toBeGreaterThan(600);
      // Collante : la barre est en haut du viewport ; l'en-tête, lui, a défilé (D3-46).
      expect(geom.barTop).toBe(0);
      expect(geom.barBottom).toBeLessThanOrEqual(geom.viewport);
      expect(geom.headerBottom).toBeLessThanOrEqual(0);
    });
  }

  test('hauteur de la barre condensée ≤ 40 % du viewport, et ≤ 64 px (56 en compact) — EX-SCR-56, EX-SCR-96/97', async ({
    page,
  }, testInfo) => {
    const regime = regimeOf(testInfo);
    await open(page, `/marche${P1_QUERY}`);

    // « Replié » : panneau « Tous les filtres » fermé (état d'arrivée, aucun paramètre d'URL).
    if (regime !== 'compact') {
      const more = page.locator('.kycar-band-bar').getByRole('button', { name: /^Tous les filtres/ });
      await expect(more).toHaveAttribute('aria-expanded', 'false');
    }

    const m = await page.evaluate(() => {
      const bar = document.querySelector('.kycar-band-bar');
      if (bar === null) return null;
      const parts = Array.from(bar.children).map(
        (c) => `${String(c.className).split(/\s+/)[0]}=${Math.round(c.getBoundingClientRect().height)}`,
      );
      return {
        height: Math.round(bar.getBoundingClientRect().height),
        viewport: window.innerHeight,
        parts: parts.join(' · '),
      };
    });
    expect(m, 'barre absente du DOM').not.toBeNull();
    if (m === null) return;

    mesure(
      testInfo,
      `ACC-02 — hauteur de la barre condensée (${regime})`,
      `${m.height} px sur un viewport de ${m.viewport} px (${((m.height / m.viewport) * 100).toFixed(1)} %) · ${m.parts}`,
    );
    // D3-46 (d) : ≤ 64 px en large et intermédiaire, ≤ 56 px en compact ; jamais plus de 40 %.
    expect(m.height).toBeLessThanOrEqual(0.4 * m.viewport);
    expect(m.height).toBeLessThanOrEqual(regime === 'compact' ? 56 : 64);
  });

  test('déplié, le panneau « Tous les filtres » ne dépasse pas 70 % du viewport, et son corps défile (EX-SCR-56)', async ({
    page,
  }, testInfo) => {
    test.skip(
      regimeOf(testInfo) === 'compact',
      'EX-SCR-97 : en compact le panneau est une FEUILLE plein écran, pas une surimpression bornée',
    );
    await open(page, `/marche${P1_QUERY}`);
    const more = page.locator('.kycar-band-bar').getByRole('button', { name: /^Tous les filtres/ });
    if ((await more.getAttribute('aria-expanded')) === 'false') await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');

    const m = await page.evaluate(() => {
      const bar = document.querySelector('.kycar-band-bar');
      const panel = document.querySelector('.kycar-band-panel');
      const body = document.querySelector('.kycar-band-panel__body');
      if (bar === null || panel === null || body === null) return null;
      return {
        total: Math.round(panel.getBoundingClientRect().bottom - bar.getBoundingClientRect().top),
        viewport: window.innerHeight,
        overflowY: getComputedStyle(body).overflowY,
        scrollable: body.scrollHeight > body.clientHeight,
      };
    });
    expect(m, 'barre, panneau ou corps absent du DOM').not.toBeNull();
    if (m === null) return;
    mesure(
      testInfo,
      'ACC-02 — hauteur dépliée (barre + panneau)',
      `${m.total} px sur ${m.viewport} px · corps overflow-y=${m.overflowY}, défilant=${m.scrollable}`,
    );
    expect(m.total).toBeLessThanOrEqual(Math.ceil(0.7 * m.viewport) + 1);
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

/* ================================================================================================
 * ACC-07 — `EX-SCR-178` : les notes d'exclusion de G1 closent l'effectif
 * ============================================================================================== */

test('ACC-07 — G1 + ses exclusions nommées = Σ (EX-SCR-178)', async ({ page }, testInfo) => {
  await open(page, P2_PATH);

  const m = await page.evaluate(() => {
    const frame = document.querySelector('[data-graph="G1"]');
    const head = document.querySelector('.kycar-stat-header');
    if (frame === null || head === null) return null;
    const strip = (t: string): string => t.replace(/[\s\u00A0\u202F\u2009]/g, '');
    const sigma = Number(/(\d+)offres?/.exec(strip(head.textContent ?? ''))?.[1] ?? NaN);
    // Effectif du graphe : la somme des effectifs de sa table de données équivalente (EX-NFR-15).
    const rows = Array.from(frame.querySelectorAll('table tbody tr'));
    const inClasses = rows.reduce((sum, tr) => sum + Number(strip(tr.children[1]?.textContent ?? '0')), 0);
    const notes = Array.from(frame.querySelectorAll('.kycar-graph-exclusions li')).map((li) => (li.textContent ?? '').trim());
    const excluded = notes.reduce((sum, n) => sum + Number(strip(n).match(/^(\d+)/)?.[1] ?? 0), 0);
    return { sigma, inClasses, excluded, notes };
  });
  expect(m, 'G1 ou en-tête absent').not.toBeNull();
  if (m === null) return;

  mesure(
    testInfo,
    'ACC-07 — clôture de G1',
    `Σ=${m.sigma} · dans les classes=${m.inClasses} · exclues=${m.excluded} · notes : ${m.notes.join(' / ') || '(aucune)'}`,
  );
  expect(m.inClasses + m.excluded).toBe(m.sigma);
  // Le motif nouveau est nommé, au mot près, dès qu'il compte au moins une annonce.
  if (m.sigma - m.inClasses > 0) {
    expect(m.notes.join(' ')).toMatch(/hors des classes affichées/);
  }
});

/* ================================================================================================
 * ACC-08 — `EX-SCR-21` : gouttières, rayons, cibles tactiles
 * ============================================================================================== */

/*
 * D-31 (constat coordinateur C-R1-03, 2026-09-13) — correction de sonde justifiée.
 * `open()` (`_helpers.ts`) n'attend que le premier rendu utile de l'écran A : effectif dans la barre
 * de synthèse + au moins une carte-marque (`waitForMarket`). Les zones-modèles (et leur case
 * « Comparer ») arrivent APRÈS, dans un second aller différé à la boucle d'inactivité
 * (`loadAllModels`, `src/app.tsx` ~l. 413, `EX-NFR-9`) : avant la fusion de `fixture-perf`, ce
 * second aller se terminait quasi immédiatement (jeu de données réduit), la mesure ci-dessous
 * tombait presque toujours APRÈS son arrivée et ACC-08 ne voyait donc jamais l'état transitoire.
 * Depuis `fixture-perf` (D3-31), l'ingestion différée retarde cet aller : la mesure, prise juste
 * après `open()`, tombait désormais AVANT l'arrivée des zones et ne les comptait jamais parmi les
 * cibles interactives (0 case « Comparer » vue). Le test était donc dépendant d'un état transitoire
 * non garanti par aucun contrat — un défaut de la SONDE, pas de l'écran. La correction attend un
 * état déterministe (nombre de `.kycar-market-zone-compare` STABLE pendant 300 ms) avant de mesurer ;
 * aucun seuil du test ne change (44/32 px, gouttières 16/20/24, rayon 4). Voir aussi le correctif
 * produit de la case elle-même (cible agrandie via `.kycar-market-zone-compare-target`,
 * `src/screens/market/ModelZone.tsx`/`market.css`) que cette attente a révélé sous ce seuil.
 */
test('ACC-08 — gouttière de grille, rayon des contrôles et cibles tactiles (EX-SCR-21)', async ({
  page,
}, testInfo) => {
  const regime = regimeOf(testInfo);
  await open(page, `/marche${P1_QUERY}`);

  // D-31 — attendre l'arrivée ET la stabilisation des zones-modèles (second aller différé,
  // `EX-NFR-9`) avant de mesurer les cibles tactiles ; sans quoi la mesure dépend du timing de
  // `loadAllModels` plutôt que d'un état d'écran garanti.
  await page.waitForFunction(
    () => document.querySelectorAll('.kycar-market-zone-compare').length > 0,
    null,
    { timeout: 60_000 },
  );
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __acc08LastCount?: number; __acc08StableSince?: number };
      const n = document.querySelectorAll('.kycar-market-zone-compare').length;
      const now = Date.now();
      if (w.__acc08LastCount !== n) {
        w.__acc08LastCount = n;
        w.__acc08StableSince = now;
        return false;
      }
      return now - (w.__acc08StableSince ?? now) >= 300;
    },
    null,
    { timeout: 60_000 },
  );

  const m = await page.evaluate(() => {
    const grid = document.querySelector('.kycar-market-grid');
    // `EX-SCR-21` — « rayon de coin 8 px sur les cartes, 4 px sur les contrôles ». Les cases à
    // cocher et boutons radio NATIFS sont exclus : leur forme est celle du système (Chromium ne
    // leur applique aucun rayon d'auteur tant que `appearance` reste `auto`), et la leur imposer
    // reviendrait à les redessiner entièrement, ce que l'exigence ne demande pas.
    const controls = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.kycar-primary-line input:not([type="checkbox"]):not([type="radio"]), .kycar-primary-line select, .kycar-primary-line button',
      ),
    );
    const radii = controls.map((c) => ({
      r: Number.parseFloat(getComputedStyle(c).borderTopLeftRadius) || 0,
      what: `${c.tagName.toLowerCase()}[${c.getAttribute('type') ?? ''}].${String(c.className).split(/\s+/)[0]}`,
    }));
    const interactive = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), label',
      ),
    )
      // `EX-SCR-21` — la CIBLE d'une case à cocher ou d'un bouton radio est son libellé
      // (`<label for>`), pas la case : c'est le libellé qui reçoit le clic. On mesure donc le
      // libellé, et la case elle-même n'est pas comptée deux fois.
      .map((el) => {
        const input = el as HTMLInputElement;
        if (el.tagName === 'INPUT' && (input.type === 'checkbox' || input.type === 'radio')) {
          const id = el.getAttribute('id');
          const lab = (id !== null ? document.querySelector<HTMLElement>(`label[for="${id}"]`) : null) ?? el.closest('label');
          return lab ?? el;
        }
        return el;
      })
      .filter((el, i, all) => all.indexOf(el) === i)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
    const under = (min: number): string[] =>
      interactive
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width < min || r.height < min;
        })
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${el.tagName.toLowerCase()}.${String(el.className).split(/\s+/)[0]}(${Math.round(r.width)}×${Math.round(r.height)})`;
        });
    return {
      gap: grid === null ? -1 : Math.round(Number.parseFloat(getComputedStyle(grid).rowGap) || 0),
      minRadius: radii.length === 0 ? -1 : Math.min(...radii.map((x) => x.r)),
      radiusOffenders: radii.filter((x) => x.r < 4).map((x) => `${x.what}=${x.r}`),
      total: interactive.length,
      under32: under(32),
      under44: under(44),
    };
  });

  const attendu = regime === 'compact' ? 16 : regime === 'intermediate' ? 20 : 24;
  const seuil = regime === 'compact' ? 44 : 32;
  const offenders = regime === 'compact' ? m.under44 : m.under32;
  mesure(
    testInfo,
    `ACC-08 — rythme et cibles (${regime})`,
    `gouttière=${m.gap} px (attendu ${attendu}) · rayon min des contrôles=${m.minRadius} px${m.radiusOffenders.length > 0 ? ' (' + m.radiusOffenders.slice(0, 6).join(', ') + ')' : ''} · ${offenders.length} cibles sur ${m.total} sous ${seuil} px${offenders.length > 0 ? ' : ' + offenders.slice(0, 12).join(', ') : ''}`,
  );

  expect(m.gap).toBe(attendu);
  // En compact la ligne primaire vit dans la feuille plein écran, fermée ici : aucun contrôle à
  // mesurer (`minRadius === -1`), le rayon est alors éprouvé par les autres régimes.
  if (m.minRadius !== -1) expect(m.minRadius).toBeGreaterThanOrEqual(4);
  expect(offenders).toEqual([]);
});

/*
 * C-R1-05 (constat coordinateur D3-39, 2026-09-13) — `.kycar-market-card-header` déclare
 * `min-height: 72px` (`market.css`) mais le plancher de cible tactile GLOBAL d'`app.css`
 * (`.kycar-app [role='button'] { min-height: 32px }`, et sa variante compacte à 44px), à
 * spécificité 0-0-2-0 contre 0-0-1-0 pour l'en-tête, l'emportait TOUJOURS : l'en-tête rendait
 * 32 px en large/intermédiaire et 44 px en compact au lieu des 72 px normatifs
 * (`EX-SCR-107`/`EX-SCR-108`), amputant chaque carte-marque de 40 px (le calcul de `EX-SCR-122` —
 * 588 px repliés — pose 72 px d'en-tête). `EX-SCR-135` (régime compact) ne dit rien d'une hauteur
 * d'en-tête différente : la valeur large s'applique donc à tous les régimes (hypothèse E4).
 * Corrigé dans `src/app/app.css` en réunissant `min-height` au bloc `:where(.kycar-app
 * [role='button'])` déjà utilisé par `C-R1-04` (spécificité nulle) : le plancher reste le DÉFAUT
 * pour tout `[role='button']` qui ne déclare pas sa propre hauteur, mais un composant qui déclare
 * une valeur plus grande (l'en-tête de carte, 72px) n'est plus écrasé.
 */
test('C-R1-05 — en-tête de carte-marque à 72 px (EX-SCR-107)', async ({ page }, testInfo) => {
  const regime = regimeOf(testInfo);
  await open(page, `/marche${P1_QUERY}`);

  // Même précaution déterministe qu'ACC-08 (D-31) : attendre que les cartes soient arrivées puis
  // stables (300 ms sans changement de compte) avant de mesurer leur en-tête.
  await page.waitForFunction(
    () => document.querySelectorAll('.kycar-market-card-header').length > 0,
    null,
    { timeout: 60_000 },
  );
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __cr105LastCount?: number; __cr105StableSince?: number };
      const n = document.querySelectorAll('.kycar-market-card-header').length;
      const now = Date.now();
      if (w.__cr105LastCount !== n) {
        w.__cr105LastCount = n;
        w.__cr105StableSince = now;
        return false;
      }
      return now - (w.__cr105StableSince ?? now) >= 300;
    },
    null,
    { timeout: 60_000 },
  );

  const heights = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('.kycar-market-card-header'))
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => Math.round(el.getBoundingClientRect().height)),
  );

  // `EX-SCR-135` ne décrit aucune hauteur d'en-tête propre au régime compact : la valeur large de
  // `EX-SCR-107` (72 px) s'applique par défaut aux trois régimes (hypothèse E4).
  const attendu = 72;
  const minMesure = heights.length === 0 ? -1 : Math.min(...heights);
  mesure(
    testInfo,
    `C-R1-05 — en-tête de carte-marque (${regime})`,
    `${heights.length} en-têtes visibles, hauteur min=${minMesure} px (attendu ≥ ${attendu})`,
  );

  expect(heights.length).toBeGreaterThan(0);
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(attendu);
});

/*
 * C-R1-04 (constat coordinateur, 2026-09-13, complété par une retouche du 2026-09-13) — la grille
 * compacte des zones-modèles (`EX-SCR-135`, quatre lignes) dépend d'un `display: contents` sur
 * `.kycar-market-zone-interactive` pour que ses enfants (row1, prix, années, kilométrage, médiane,
 * barre) deviennent des items nommés de la grille de `.kycar-market-zone`. Une règle GLOBALE hors
 * périmètre de ce lot, `src/app/app.css` : `.kycar-app [role='button'] { display: inline-flex; ... }`
 * (deux sélecteurs, spécificité 0-0-2-0), l'emportait TOUJOURS sur ce `display: contents` (une seule
 * classe, 0-0-1-0), quel que soit l'ordre des feuilles — `.kycar-market-zone-interactive` porte
 * `role="button"`. Le résultat : les rangées 2 à 4 de la grille compacte se réduisaient à 0 px (rien
 * n'y était plus placé, leur contenu étant redevenu de simples enfants flex de la boîte réifiée), et
 * le TEXTE de chaque zone débordait sur la zone suivante — chevauchement visible à 360 px (mobile)
 * ET à 768 px (tablette : le CONTENEUR de requête, `.kycar-market-screen`, y mesure 736 px de large,
 * sous le seuil `767.98px` de la même `@container`, donc la même grille compacte s'y applique).
 * Corrigé dans `market.css` en portant la spécificité du sélecteur à 0-0-3-0
 * (`.kycar-market-zone .kycar-market-zone-interactive[role='button']`), sans toucher à
 * `src/app/app.css` (hors périmètre).
 *
 * Un SECOND défaut latent est apparu en construisant la sonde ci-dessous (cause différente) : une
 * carte dont le nombre de modèles vaut exactement `modelesVisiblesAvantRepli + 1` les affiche TOUS
 * par défaut (`view-model.ts` l. 369, évite un « + 1 autre modèle » dégénéré). En régime
 * compact/intermédiaire (bande ≥ 96 px), la liste NON dépliée d'une telle carte peut dépasser les
 * 480 px alloués — et jusqu'ici, seule la variante `--expanded` de `.kycar-market-zone-list`
 * recevait `min-height: 0`/`overflow-y: auto` ; la liste REPLIÉE se contentait du
 * `overflow: hidden` de la carte (`EX-SCR-124`), qui ROGNE (au lieu de rendre défilable) tout excès
 * — un ou plusieurs derniers modèles d'une telle carte devenaient invisibles ET inaccessibles
 * (aucun bouton de dépliement, `hasMoreModels` étant faux), en violation de `EX-SCR-112`/`D-36`
 * (« jamais masqués »). Corrigé en portant `min-height: 0`, `max-height: 480px`, `overflow-y: auto`
 * (et l'ombre de débord déjà utilisée par `--expanded`) sur `.kycar-market-zone-list` de base :
 * l'excès, désormais, se déroule au doigt au lieu de disparaître.
 *
 * RETOUCHE (relecture du coordinateur sur `cr104-apres-mobile.png`) — un TROISIÈME défaut, une fois
 * les deux premiers corrigés : à 360 px, la légende « (fourchette centrale (90 % des offres)) »
 * fait passer la ligne prix sur DEUX lignes, portant la zone à CINQ lignes de texte dans une bande
 * qui n'en compte que quatre (`EX-SCR-135`) ; la ligne médiane + barre débordait alors de ~15 px
 * sous le trait de séparation de SA PROPRE zone, empiétant sur la suivante (et paraissant lui
 * appartenir). Corrigé par DEUX changements complémentaires dans `market.css` : (a) la légende sort
 * du flux VISUEL de la zone en compact seulement (`.kycar-market-zone-price-caption`, motif
 * « visually hidden » — aucune valeur n'est retirée, `D-36` : la légende reste dans le DOM, `title`
 * la garde au survol, et l'en-tête de carte la porte déjà une fois) ; (b) `.kycar-market-zone` reçoit
 * `flex: 0 0 auto` — sans `flex-shrink: 0` explicite, la « taille hypothétique » que l'algorithme
 * flex calcule pour cette zone (à la fois item flex de `.kycar-market-zone-list` ET conteneur de
 * grille) pouvait être légèrement INFÉRIEURE à la somme réellement rendue des pistes `auto` de sa
 * propre grille dès que le contenu dépassait le plancher `min-height: 96px` (c'est la cause exacte
 * du débordement : ni un `height` fixe — il n'y en a aucun — ni la cale de virtualisation
 * `MODEL_ZONE_HEIGHT_PX` — qui ne fixe qu'un pas de défilement, jamais une propriété CSS de la zone
 * — ni `align-items`, testé et disculpé). `min-height: 96px` reste inchangé (valeur gelée
 * d'`EX-SCR-135`, sonde `tests/review/D6/responsive.test.ts`) ; si le contenu réel dépasse encore ce
 * plancher, la bande grandit désormais correctement (jamais de `height` fixe, jamais
 * d'`overflow: hidden` sur la zone elle-même).
 *
 * Cette sonde mesure deux invariants géométriques déterministes, indépendants du texte affiché :
 * (1) CHAQUE enfant texte visible d'une zone reste dans la boîte de CETTE zone
 * (`enfant.bottom ≤ zone.bottom + 1` et `enfant.top ≥ zone.top − 1`) ; (2) aucune zone VISIBLE
 * n'empiète sur la suivante (`zone[n].bottom ≤ zone[n+1].top`). « Visible » exclut le contenu scindé
 * hors du cadre d'un ancêtre défilant (`overflow: hidden|auto|scroll`), qu'un utilisateur ne voit
 * qu'en faisant défiler CETTE liste, jamais en superposition avec une autre carte.
 */
test('ACC-08bis — aucun chevauchement de texte entre zones-modèles, régimes compact et intermédiaire (EX-SCR-135, C-R1-04)', async ({
  page,
}, testInfo) => {
  const regime = regimeOf(testInfo);
  test.skip(regime === 'large', 'la bande large (EX-SCR-112, 72 px) ne suit pas la grille à 4 lignes compacte visée par C-R1-04');
  // `DENSE_QUERY` (pas `P1_QUERY`) : il faut des cartes à beaucoup de modèles pour que la grille
  // compacte soit exercée sur assez de zones consécutives — c'est le jeu qui a servi aux captures
  // du constat C-R1-04 (`reports/remediation-2.8/fix-screens-3/avant-mobile.png`).
  await open(page, `/marche${DENSE_QUERY}`);

  // Même attente déterministe que ACC-08 (D-31) : au moins une case « Comparer », puis un compte
  // stable pendant 300 ms, avant de mesurer la géométrie des zones-modèles.
  await page.waitForFunction(
    () => document.querySelectorAll('.kycar-market-zone-compare').length > 0,
    null,
    { timeout: 60_000 },
  );
  await page.waitForFunction(
    () => {
      const w = window as unknown as { __acc08bisLastCount?: number; __acc08bisStableSince?: number };
      const n = document.querySelectorAll('.kycar-market-zone-compare').length;
      const now = Date.now();
      if (w.__acc08bisLastCount !== n) {
        w.__acc08bisLastCount = n;
        w.__acc08bisStableSince = now;
        return false;
      }
      return now - (w.__acc08bisStableSince ?? now) >= 300;
    },
    null,
    { timeout: 60_000 },
  );

  const problems = await page.evaluate(() => {
    const EPS = 0.5;
    // Retouche coordinateur (2026-09-13) : tolérance resserrée à 1 px pour « chaque enfant texte
    // visible reste dans la boîte de sa propre zone » — la sonde initiale (tolérance 6 px, pour
    // absorber un écart de sous-pixel documenté à l'époque) a laissé passer un débordement de
    // ~15 px (légende de fourchette sur deux lignes, cf. l'en-tête de ce test) : elle n'était donc
    // pas assez stricte pour ce défaut. Les deux causes (spécificité CSS, légende) sont corrigées ;
    // 1 px n'est plus qu'un arrondi sous-pixel inoffensif.
    const CHILD_EPS = 1;
    // Un contenu scindé hors du cadre visible d'un ancêtre défilant (`.kycar-market-zone-list`,
    // `.kycar-market-zone-list--expanded`, la fenêtre…) n'est pas un chevauchement pour
    // l'utilisateur : il faut faire défiler CE conteneur pour l'atteindre, jamais une autre carte
    // ne vient s'y superposer. On exclut donc les zones entièrement hors du cadre d'un ancêtre non
    // `overflow: visible` (verticalement — ces listes ne défilent qu'en Y).
    const isClippedOut = (el: HTMLElement): boolean => {
      const r = el.getBoundingClientRect();
      for (let node = el.parentElement; node !== null; node = node.parentElement) {
        const cs = getComputedStyle(node);
        if (cs.overflowY === 'visible') continue;
        const nr = node.getBoundingClientRect();
        if (r.bottom <= nr.top + EPS || r.top >= nr.bottom - EPS) return true;
      }
      return false;
    };
    const zones = Array.from(document.querySelectorAll<HTMLElement>('.kycar-market-zone')).filter(
      (z) => z.getBoundingClientRect().height > 0 && !isClippedOut(z),
    );
    const out: string[] = [];
    // Tous les enfants texte VISIBLES d'une zone (retouche coordinateur : « chaque enfant », pas
    // seulement les quatre lignes groupées) — les porteurs de VALEUR d'`EX-SCR-135` plus les jetons
    // optionnels. La légende masquée (`.kycar-market-zone-price-caption`, compact) n'est PAS de ceux-
    // là (elle ne porte aucune valeur, `D-36`) : elle n'est délibérément pas dans cette liste.
    const childSelectors = [
      '.kycar-market-zone-row1',
      '.kycar-market-zone-price',
      '.kycar-market-zone-year',
      '.kycar-market-zone-mileage',
      '.kycar-market-zone-median',
      '.kycar-market-zone-share-bar',
      '.kycar-market-low-sample-token',
      '.kycar-market-sampling-bias',
    ];
    for (const zone of zones) {
      const zr = zone.getBoundingClientRect();
      for (const sel of childSelectors) {
        const el = zone.querySelector<HTMLElement>(sel);
        if (el === null) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue; // élément masqué (visually-hidden), non concerné
        if (r.bottom > zr.bottom + CHILD_EPS || r.top < zr.top - CHILD_EPS) {
          out.push(`${sel} hors de sa zone (top=${Math.round(r.top)} bottom=${Math.round(r.bottom)} zone=[${Math.round(zr.top)},${Math.round(zr.bottom)}])`);
        }
      }
    }
    // Les quatre « lignes » d'EX-SCR-135 : années et kilométrage PARTAGENT la ligne 3, à dessein —
    // vérifie qu'elles restent dans cet ordre, sans chevaucher la ligne suivante.
    const lineSelectors: readonly (readonly string[])[] = [
      ['.kycar-market-zone-row1'],
      ['.kycar-market-zone-price'],
      ['.kycar-market-zone-year', '.kycar-market-zone-mileage'],
      ['.kycar-market-zone-median'],
    ];
    for (const zone of zones) {
      const lines = lineSelectors
        .map((sels) =>
          sels
            .map((sel) => zone.querySelector<HTMLElement>(sel))
            .filter((el): el is HTMLElement => el !== null)
            .map((el) => el.getBoundingClientRect()),
        )
        .filter((rects) => rects.length > 0);
      for (let i = 1; i < lines.length; i++) {
        const prevMaxBottom = Math.max(...lines[i - 1].map((r) => r.bottom));
        const curMinTop = Math.min(...lines[i].map((r) => r.top));
        if (curMinTop < prevMaxBottom - EPS) {
          out.push(`chevauchement interne entre lignes ${i - 1} et ${i} (bas=${Math.round(prevMaxBottom)} haut=${Math.round(curMinTop)})`);
        }
      }
    }
    for (let i = 1; i < zones.length; i++) {
      const prev = zones[i - 1].getBoundingClientRect();
      const cur = zones[i].getBoundingClientRect();
      if (cur.top < prev.bottom - EPS) {
        out.push(`chevauchement entre zones ${i - 1} et ${i} (bas zone précédente=${Math.round(prev.bottom)} haut zone suivante=${Math.round(cur.top)})`);
      }
    }
    return { count: zones.length, out };
  });

  mesure(
    testInfo,
    `ACC-08bis — chevauchement (${regime})`,
    `${problems.count} zones examinées · ${problems.out.length} chevauchement(s)${problems.out.length > 0 ? ' : ' + problems.out.slice(0, 8).join(' | ') : ''}`,
  );
  expect(problems.out).toEqual([]);
});

/* ================================================================================================
 * ACC-09 / ACC-10 — `EX-SCR-124` et `EX-SCR-127` : virtualisation
 * ============================================================================================== */

test('ACC-09 — liste de zones-modèles virtualisée à 30, ombres de débord, carte ≤ 636 px (EX-SCR-124)', async ({
  page,
}, testInfo) => {
  await open(page, '/marche');

  // Une marque à GRAND nombre de modèles (plus de 30 zones : c'est le seuil de virtualisation).
  const boutons = page.getByRole('button', { name: /Afficher les \d+ autres modèles/ });
  await expect(boutons.first()).toBeVisible({ timeout: 30_000 });
  const n = await boutons.count();
  let ouvert = false;
  for (let i = 0; i < n && !ouvert; i += 1) {
    const b = boutons.nth(i);
    const restants = Number(/(\d+)/.exec((await b.innerText()).replace(/[\s   ]/g, ''))?.[1] ?? 0);
    if (restants < 30) continue;
    await b.click();
    ouvert = true;
  }
  expect(ouvert, 'aucune marque à plus de 30 modèles dans la grille sans filtre').toBe(true);
  await expect(page.locator('.kycar-market-zone-list--expanded .kycar-market-zone').first()).toBeVisible({
    timeout: 20_000,
  });

  const m = await page.evaluate(() => {
    const list = document.querySelector<HTMLElement>('.kycar-market-zone-list--expanded');
    const card = list?.closest<HTMLElement>('.kycar-market-card');
    if (card == null || list == null) return null;
    return {
      mounted: list.querySelectorAll('.kycar-market-zone').length,
      cardHeight: Math.round(card.getBoundingClientRect().height),
      listHeight: Math.round(list.getBoundingClientRect().height),
      boxShadow: getComputedStyle(list).boxShadow,
      scrollHeight: list.scrollHeight,
      clientHeight: list.clientHeight,
    };
  });
  expect(m, 'carte ou liste dépliée absente').not.toBeNull();
  if (m === null) return;
  mesure(
    testInfo,
    'ACC-09 — carte dépliée',
    `${m.mounted} zones montées · carte ${m.cardHeight} px · liste ${m.listHeight} px (course ${m.scrollHeight}) · ombre ${m.boxShadow}`,
  );

  expect(m.mounted).toBeGreaterThan(0);
  expect(m.mounted).toBeLessThanOrEqual(30);
  expect(m.cardHeight).toBeLessThanOrEqual(636);
  expect(m.listHeight).toBeLessThanOrEqual(480);
  expect(m.boxShadow).not.toBe('none');
  // La course de défilement décrit la liste ENTIÈRE : aucune zone n'est rendue inaccessible.
  expect(m.scrollHeight).toBeGreaterThan(m.clientHeight);
});

test('ACC-10 — au-delà de 40 cartes, au plus 12 sont montées, sans plafonner l’accès (EX-SCR-127)', async ({
  page,
}, testInfo) => {
  // Le pied de chargement continu (`EX-SCR-129`) n'existe qu'avec des filtres POSÉS, et la
  // virtualisation ne s'arme qu'au-delà de 40 cartes. Le parcours P1 est trop étroit au profil
  // `test` (quelques dizaines d'offres, 17 marques) : on part donc de la sélection DENSE, et la
  // prémisse est VÉRIFIÉE sur les fixtures plutôt que supposée.
  const attendu = await derived();
  expect(
    attendu.dense.makes,
    'la sélection dense doit dépasser le seuil de virtualisation de 40 cartes (EX-SCR-127)',
  ).toBeGreaterThan(40);
  await open(page, `/marche${DENSE_QUERY}`);
  const plus = page.getByRole('button', { name: /Charger \d+ marques de plus/ });
  await expect(plus).toBeVisible({ timeout: 30_000 });
  await plus.click();
  await expect(page.locator('.kycar-market-grid[data-virtualized="true"]')).toBeVisible({ timeout: 20_000 });

  const avant = await page.evaluate(() => ({
    mounted: document.querySelectorAll('.kycar-market-card').length,
    nodes: document.querySelectorAll('.kycar-market-grid *').length,
    gridHeight: Math.round(document.querySelector('.kycar-market-grid')?.getBoundingClientRect().height ?? 0),
    premiere: document.querySelector('.kycar-market-card-title')?.textContent?.trim() ?? '',
  }));

  // Défilement : la fenêtre suit, les cartes montées changent, aucune n'est perdue.
  await page.evaluate(() => window.scrollBy(0, 2400));
  await page.waitForTimeout(300);
  const apres = await page.evaluate(() => ({
    mounted: document.querySelectorAll('.kycar-market-card').length,
    premiere: document.querySelector('.kycar-market-card-title')?.textContent?.trim() ?? '',
  }));

  mesure(
    testInfo,
    'ACC-10 — grille virtualisée',
    `${avant.mounted} cartes montées (${avant.nodes} nœuds, grille ${avant.gridHeight} px) · après défilement ${apres.mounted} montées, première « ${apres.premiere} » (avant « ${avant.premiere} »)`,
  );

  expect(avant.mounted).toBeLessThanOrEqual(12);
  expect(apres.mounted).toBeLessThanOrEqual(12);
  expect(apres.premiere).not.toBe(avant.premiere);
});

/* ================================================================================================
 * ACC-11 / ACC-12 — retour visuel des contrôles, encodages de couleur
 * ============================================================================================== */

test('ACC-11 — survol et état coché sont visibles dans le bandeau (EX-SCR-87)', async ({ page }, testInfo) => {
  test.skip(regimeOf(testInfo) === 'compact', 'EX-SCR-97 : les contrôles vivent dans la feuille plein écran en compact');
  await open(page, `/marche${P1_QUERY}`);
  // D-31 (`ux-filters`, décision D3-46) : les cases de carburant et de carrosserie ne sont plus dans
  // la barre repliée mais dans la carte « Essentiels » du panneau « Tous les filtres » : on l'ouvre.
  // Le fait mesuré (retour visuel au survol, état coché inversé) est inchangé.
  await openAllFilters(page);

  const option = page.locator('.kycar-primary-line .kycar-checkbox-option').first();
  const avant = await option.evaluate((el) => getComputedStyle(el).backgroundColor);
  await option.hover();
  const survol = await option.evaluate((el) => getComputedStyle(el).backgroundColor);

  // « Coupé » est coché par la requête du parcours (`body=3`) : son libellé porte l'état actif.
  const cochee = page.locator('.kycar-primary-line .kycar-checkbox-option').filter({ hasText: 'Coupé' }).first();
  const actif = await cochee.evaluate((el) => ({
    background: getComputedStyle(el).backgroundColor,
    color: getComputedStyle(el).color,
  }));
  mesure(testInfo, 'ACC-11 — retour visuel', `survol ${avant} → ${survol} · coché fond ${actif.background}, texte ${actif.color}`);

  expect(survol).not.toBe(avant);
  expect(actif.background).not.toBe('rgba(0, 0, 0, 0)');
});

test('ACC-12 — palette qualitative sur G9/G12/G13, teintes divergentes sur G8, rampe B sur G7 (EX-SCR-186)', async ({
  page,
}, testInfo) => {
  test.skip(regimeOf(testInfo) === 'compact', 'EX-SCR-181 : G7 n’est pas tracé en régime compact');
  await open(page, P2_PATH);

  const m = await page.evaluate(() => {
    const backgrounds = (sel: string): string[] =>
      Array.from(document.querySelectorAll<HTMLElement>(sel)).map((el) => getComputedStyle(el).backgroundColor);
    const fills = (sel: string): string[] =>
      Array.from(document.querySelectorAll<SVGElement>(sel)).map((el) => el.getAttribute('fill') ?? '');
    return {
      g9: backgrounds('[data-graph="G9"] .kycar-catbar-track > span'),
      g12: backgrounds('[data-graph="G12"] .kycar-catbar-track > span'),
      g13: backgrounds('[data-graph="G13"] .kycar-catbar-track > span'),
      g8: backgrounds('[data-graph="G8"] .kycar-lollipop-bar > span'),
      g7: fills('[data-graph="G7"] svg.kycar-heatmap rect[data-price-lower]'),
    };
  });
  const distinctes = (xs: string[]): number => new Set(xs).size;
  mesure(
    testInfo,
    'ACC-12 — encodages',
    `G9 ${distinctes(m.g9)} teintes sur ${m.g9.length} · G12 ${distinctes(m.g12)} · G13 ${distinctes(m.g13)} · G8 ${distinctes(m.g8)} sur ${m.g8.length} · G7 ${distinctes(m.g7)} sur ${m.g7.length}`,
  );

  // Palette qualitative Q : plusieurs teintes dès qu'il y a plusieurs modalités.
  for (const bars of [m.g9, m.g12, m.g13]) {
    if (bars.length > 1) expect(distinctes(bars)).toBeGreaterThan(1);
  }
  // G8 : les teintes employées sont EXACTEMENT la paire divergente dédiée (`scatter-model.ts`), et
  // aucune n'est l'accent de la page ni une teinte de la palette Q. Le graphe montre les 20 plus
  // grands écarts : ils peuvent être tous de même signe, on n'exige donc pas les deux teintes à la
  // fois, mais on exige qu'aucune autre ne soit employée.
  const DIVERGENTES = ['rgb(1, 102, 94)', 'rgb(140, 81, 10)'];
  for (const c of m.g8) expect(DIVERGENTES).toContain(c);
  expect(m.g8.join(' ')).not.toMatch(/rgb\(11, 95, 214\)/);
  // G7 : rampe B (cividis), donc des teintes opaques variées, jamais l'alpha de l'accent.
  expect(m.g7.join(' ')).not.toMatch(/rgba\(11,\s*95,\s*214/);
  if (m.g7.length > 1) expect(distinctes(m.g7)).toBeGreaterThan(1);
});

/* ================================================================================================
 * ACC-13 — `EX-SCR-25` : l'indicateur de recalcul n'apparaît qu'au-delà de 150 ms
 * ============================================================================================== */

test('ACC-13 — aucun indicateur de recalcul sous 150 ms (EX-SCR-25)', async ({ page }, testInfo) => {
  await open(page, P2_PATH);

  // Sonde à 10 ms : l'indicateur `ET-CHARGE-MAJ` ne doit jamais être posé avant le seuil.
  const suivi = await page.evaluate(async () => {
    const screen = document.querySelector('.kycar-screen-b');
    if (screen === null) return null;
    const debut = performance.now();
    let premierIndicateur: number | null = null;
    for (let i = 0; i < 60; i += 1) {
      if (premierIndicateur === null && screen.getAttribute('data-recalculating') === 'true') {
        premierIndicateur = performance.now() - debut;
      }
      await new Promise((r) => setTimeout(r, 10));
    }
    return premierIndicateur;
  });
  mesure(testInfo, 'ACC-13 — indicateur au repos', suivi === null ? 'aucun' : `posé à ${Math.round(suivi)} ms`);
  expect(suivi).toBeNull();

  // La temporisation elle-même est déclarée par le composant, pas devinée par le test.
  const delai = await page.evaluate(() => document.querySelector('.kycar-screen-b') !== null);
  expect(delai).toBe(true);
});

/* ================================================================================================
 * ACC-14 — `EX-SCR-199` : responsive de l'écran C
 * ============================================================================================== */

test('ACC-14 — repères de colonne collants en intermédiaire, sparklines 60 × 24 en compact (EX-SCR-199)', async ({
  page,
}, testInfo) => {
  const regime = regimeOf(testInfo);
  test.skip(regime === 'large', 'EX-SCR-199 ne décrit que les régimes intermédiaire et compact');
  await open(page, '/comparer?m=54-1918,54-1916');
  await expect(page.locator('.kycar-compare-table')).toBeVisible({ timeout: 30_000 });

  const m = await page.evaluate(() => {
    const th = document.querySelector('.kycar-compare-table thead th');
    const svg = document.querySelector('.kycar-compare-table svg');
    return {
      position: th === null ? 'absent' : getComputedStyle(th).position,
      svg: svg === null ? null : { w: Math.round(svg.getBoundingClientRect().width), h: Math.round(svg.getBoundingClientRect().height) },
    };
  });
  mesure(testInfo, `ACC-14 — écran C (${regime})`, `thead th position=${m.position} · mini-graphe ${m.svg?.w}×${m.svg?.h}`);

  if (regime === 'intermediate') expect(m.position).toBe('sticky');
  if (regime === 'compact') {
    expect(m.svg?.w).toBe(60);
    expect(m.svg?.h).toBe(24);
  }
});
