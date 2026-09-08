/**
 * KYCAR — Responsive aux points de rupture réels (PLAN-2 §2.9a, `EX-NFR-18`/`19`)
 * =================================================================================================
 * `EX-NFR-18` — desktop ≥ 1280 px, tablette 768-1279 px, mobile < 768 px. Les trois projets
 * Playwright (`playwright.config.ts`) sont posés EXACTEMENT sur ces trois régimes : 1280, 768, 360.
 * `EX-NFR-19` — sous 768 px, le nuage tri-dimensionnel est servi en projection 2D dégradée plutôt
 * que désactivé, et « les histogrammes et cartes-marques restent pleinement fonctionnels à toutes
 * les largeurs ≥ 320 px ».
 * `EX-SCR-135` — en régime compact, la barre de synthèse perd le cardinal « modèles » et le tri
 * devient une feuille dépliable ; `EX-SCR-122`/`123` — repli des zones-modèles (6, ou 4 en compact).
 *
 * Une media query ne se vérifie qu'au rendu : `matchMedia` est ici évalué par le navigateur, sur le
 * viewport réel du projet.
 */
import { test, expect } from '@playwright/test';

import {
  P1_QUERY,
  SURFACES,
  constat,
  hasCssRuleFor,
  mesure,
  open,
  readMarketSummary,
  regimeOf,
} from './_helpers';

/** Le régime que l'application déclare elle-même, lu dans le panneau Diagnostic (`EX-SCR-47`). */
async function readDeclaredRegime(page: import('@playwright/test').Page): Promise<string> {
  await page.locator('.kycar-footer-diagnostic summary').click();
  const text = await page.locator('.kycar-footer-diagnostic').innerText();
  return (/Régime d’affichage\s*\n?\s*(\w+)/.exec(text)?.[1] ?? '').trim();
}

test.describe('EX-NFR-18 / EX-NFR-19 — régimes responsive', () => {
  test('le régime détecté par l’application correspond au point de rupture du viewport (EX-NFR-18)', async ({
    page,
  }, testInfo) => {
    await open(page, SURFACES.A);
    const declared = await readDeclaredRegime(page);
    mesure(testInfo, `EX-NFR-18 — régime déclaré à ${testInfo.project.name}`, declared);
    expect(declared).toBe(regimeOf(testInfo));
  });

  test('CONSTAT E2E-19 — aucun défilement horizontal du document sur les surfaces principales (EX-NFR-19, EX-SCR-183, ≥ 320 px)', async ({
    page,
  }, testInfo) => {
    // Le défaut n'existe qu'au régime compact : ailleurs la sonde est une vraie garde de non-régression.
    test.fail(
      regimeOf(testInfo) === 'compact',
      'CONSTAT E2E-19 — EX-NFR-19/EX-SCR-183 — à 360 px l’écran B déborde le document de 50 px : .kycar-graph-grid déclare grid-template-columns: 1fr, dont le minimum implicite est min-content (378 px, imposé par le minWidthPx de 320/360 px des graphes additionnels) au lieu de minmax(0, 1fr) ; le défilement horizontal remonte au document au lieu de rester dans .kycar-graph-body',
    );
    if (regimeOf(testInfo) === 'compact') {
      constat(
        testInfo,
        'E2E-19',
        'EX-NFR-19/EX-SCR-183',
        'à 360 px, les cadres des graphes additionnels (G5 à G15) mesurent 378 px dans une colonne de grille de 296 px : le document défile horizontalement (scrollWidth 410 pour clientWidth 360) au lieu que le graphe défile dans son propre cadre',
      );
    }
    const offenders: string[] = [];
    for (const [name, path] of [
      ['A', `${SURFACES.A}${P1_QUERY}`],
      ['B', SURFACES.B],
      ['C', SURFACES.C],
      ['E', SURFACES.E],
      ['F', SURFACES.F],
      ['mentions', SURFACES.mentions],
    ] as const) {
      await open(page, path);
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      if (overflows) offenders.push(name);
    }
    mesure(testInfo, 'EX-NFR-19 — surfaces à débordement horizontal', offenders.join(', ') || '(aucune)');
    expect(offenders).toEqual([]);
  });

  test('régime compact : la barre de synthèse perd le cardinal « modèles » et le tri devient une feuille (EX-SCR-135)', async ({
    page,
  }, testInfo) => {
    const compact = regimeOf(testInfo) === 'compact';
    await open(page, `${SURFACES.A}${P1_QUERY}`);

    const summary = await readMarketSummary(page);
    expect(summary.makes).toBeGreaterThan(0);
    expect(summary.offers).toBeGreaterThan(0);
    if (compact) {
      expect(summary.models).toBeNull();
      await expect(page.locator('.kycar-sort-sheet-trigger')).toBeVisible();
      await expect(page.locator('.kycar-market-sort-controls select')).toHaveCount(0);
    } else {
      expect(summary.models).not.toBeNull();
      await expect(page.locator('.kycar-market-sort-controls select')).toBeVisible();
      await expect(page.locator('.kycar-sort-sheet-trigger')).toHaveCount(0);
    }
  });

  test('les cartes-marques restent pleinement fonctionnelles, et le repli des zones suit le régime (EX-NFR-19, EX-SCR-122/123)', async ({
    page,
  }, testInfo) => {
    const expectedCollapse = regimeOf(testInfo) === 'compact' ? 4 : 6;
    await open(page, `${SURFACES.A}${P1_QUERY}`);

    const card = page.locator('.kycar-market-card').first();
    await card.locator('.kycar-market-card-header').click();
    await expect(card.locator('.kycar-market-zone-list')).toContainText('fourchette centrale', { timeout: 30_000 });
    const expanded = await card.locator('.kycar-market-zone-list > *').count();
    expect(expanded).toBeGreaterThan(expectedCollapse);

    // Repli : `EX-SCR-122`/`123`, six zones visibles, quatre en compact.
    await card.locator('.kycar-market-card-footer button').click();
    await expect.poll(async () => card.locator('.kycar-market-zone-list > *').count(), { timeout: 20_000 }).toBe(
      expectedCollapse,
    );
    mesure(testInfo, 'EX-SCR-122 — zones visibles après repli', `${expectedCollapse} (déplié : ${expanded})`);
  });

  test('les histogrammes G1–G3 restent pleinement fonctionnels à toutes les largeurs (EX-NFR-19)', async ({
    page,
  }) => {
    await open(page, SURFACES.B);
    for (const graphId of ['G1', 'G2', 'G3']) {
      const frame = page.locator(`[data-graph="${graphId}"]`);
      await expect(frame).toBeVisible();
      expect(await frame.locator('svg.kycar-hist rect[role="button"]').count()).toBeGreaterThan(0);
      await frame.getByRole('button', { name: 'Voir les données' }).click();
      expect(await frame.locator('.kycar-graph-datatable tbody tr').count()).toBeGreaterThan(0);
    }
    // `EX-SCR-183` — un graphe plus large que la zone lisible défile DANS son cadre, jamais la page.
    const scrollable = await page
      .locator('[data-graph="G1"] .kycar-graph-body')
      .evaluate((el) => window.getComputedStyle(el).overflowX);
    expect(scrollable).toBe('auto');
  });

  test('sous 768 px, le nuage est servi en projection 2D dégradée plutôt que désactivé (EX-NFR-19)', async ({
    page,
  }, testInfo) => {
    await open(page, SURFACES.B);
    const g4 = page.locator('[data-graph="G4"]');
    await expect(g4).toBeVisible();
    await expect(g4.locator('canvas')).toBeVisible();

    if (regimeOf(testInfo) === 'compact') {
      // Projection imposée : aucune bascule de variante, aucun brossage (contrat de dégradation).
      await expect(g4.getByRole('tablist')).toHaveCount(0);
    } else {
      await expect(g4.getByRole('tablist', { name: 'Variante du nuage' })).toBeVisible();
    }
    // Le zoom reste offert dans les deux régimes (`EX-SCR-158`).
    await expect(g4.getByRole('button', { name: 'Zoom avant' })).toBeVisible();
    await expect(g4.getByRole('button', { name: 'Zoom arrière' })).toBeVisible();
  });

  test('CONSTAT E2E-17 — en régime dégradé la couleur encode le kilométrage, déjà porté par l’axe X, et la légende disparaît (EX-NFR-19, EX-SCR-154)', async ({
    page,
  }, testInfo) => {
    test.skip(regimeOf(testInfo) !== 'compact', 'la dégradation d’EX-NFR-19 ne s’applique que sous 768 px');
    test.fail();
    constat(
      testInfo,
      'E2E-17',
      'EX-NFR-19/EX-SCR-154',
      'EX-NFR-19 exige « prix × kilométrage, année encodée par couleur » : les axes sont bons, mais scatter-render applique RAMP_B_MILEAGE (le kilométrage, déjà l’axe X) au lieu de RAMP_A_YEAR, et ScatterCloud retire toute la légende quand degraded est vrai — l’encodage couleur devient à la fois redondant et illisible',
    );

    await open(page, SURFACES.B);
    const legend = page.locator('[data-graph="G4"] .kycar-legend-title').first();
    await expect(legend).toBeVisible({ timeout: 10_000 });
    await expect(legend).toHaveText('Année');
  });

  test('CONSTAT E2E-18 — le bouton de repli annonce « 6 modèles » alors que le régime compact en garde 4 (EX-SCR-122/135)', async ({
    page,
  }, testInfo) => {
    test.skip(regimeOf(testInfo) !== 'compact', 'le libellé n’est faux que dans le régime qui replie à 4');
    test.fail();
    constat(
      testInfo,
      'E2E-18',
      'EX-SCR-122/EX-SCR-135',
      'MakeCard code en dur « − Réduire à 6 modèles » (Math.min(modelZones.length, 6)) alors que MODELS_VISIBLE_BEFORE_COLLAPSE vaut 4 en compact : le repli lui-même est correct (4 zones), seul le libellé ment à l’utilisateur',
    );

    await open(page, `${SURFACES.A}${P1_QUERY}`);
    const card = page.locator('.kycar-market-card').first();
    await card.locator('.kycar-market-card-header').click();
    await expect(card.locator('.kycar-market-card-footer button')).toBeVisible({ timeout: 30_000 });
    const label = await card.locator('.kycar-market-card-footer button').innerText();
    mesure(testInfo, 'EX-SCR-122 — libellé du bouton de repli en compact', label);
    expect(label).toContain('4 modèles');
  });

  test('CONSTAT E2E-21 — le bandeau de filtres et l’écran G sont rendus sans aucune feuille de style (EX-SCR-89..98, EX-SCR-215)', async ({
    page,
  }, testInfo) => {
    test.fail();
    constat(
      testInfo,
      'E2E-21',
      'EX-SCR-96/EX-SCR-98/EX-SCR-215',
      'src/components/filters/ ne contient AUCUN fichier .css et aucune règle ne cible .kycar-filter-band, .kycar-control ni .kycar-screen-g dans le bundle : le bandeau (hauteur repliée de 132 px, lignes de contrôles 5 puis 4 en compact) et la modale marque/modèle sont peints par les seuls styles par défaut du navigateur — le §6 de draft-screens n’est donc vérifiable sur aucune largeur',
    );

    await open(page, SURFACES.A);
    const band = await hasCssRuleFor(page, 'kycar-filter-band');
    const control = await hasCssRuleFor(page, 'kycar-control');
    const screenG = await hasCssRuleFor(page, 'kycar-screen-g');
    mesure(
      testInfo,
      'EX-SCR-96 — règles CSS chargées (bandeau / contrôle / écran G)',
      `${band} / ${control} / ${screenG}`,
    );
    expect({ band, control, screenG }).toEqual({ band: true, control: true, screenG: true });
  });
});
