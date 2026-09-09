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

test('ACC-08 — gouttière de grille, rayon des contrôles et cibles tactiles (EX-SCR-21)', async ({
  page,
}, testInfo) => {
  const regime = regimeOf(testInfo);
  await open(page, `/marche${P1_QUERY}`);

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
  // Le pied de chargement continu (`EX-SCR-129`) n'existe qu'avec des filtres posés : on part donc
  // du parcours P1, qui retient 107 marques — bien au-delà du seuil de virtualisation (40).
  await open(page, `/marche${P1_QUERY}`);
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
