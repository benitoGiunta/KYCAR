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
