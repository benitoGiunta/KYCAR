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
  waitForMarket,
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

  // D8-14/D8-17 (E2E-19, CORRIGÉ) : `distribution.css` pose `minmax(0, 1fr)` sur `.kycar-hist-row` et
  // `.kycar-graph-grid` à tous les régimes (au lieu du `1fr` nu, dont le minimum implicite est
  // `min-content` — 378 px, imposé par le `minWidthPx` de 320/360 px des graphes additionnels) : le
  // défilement horizontal reste confiné à `.kycar-graph-body` (`overflow-x: auto`, GraphFrame.tsx),
  // il ne remonte plus au document. `test.fail()` retiré (D8-17).
  test('CONSTAT E2E-19 — aucun défilement horizontal du document sur les surfaces principales (EX-NFR-19, EX-SCR-183, ≥ 320 px)', async ({
    page,
  }, testInfo) => {
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
    // D8-04a/FV-04/D-31 : depuis la remédiation 2.8, un clic sur l'EN-TÊTE de carte POSE le filtre
    // `mmmv` sur la marque (`EX-SCR-110`) au lieu de déplier la carte — c'était précisément le
    // premier des quatre écarts `mmmv` relevés par la vérification finale. Le dépliage a son propre
    // contrôle, le bouton de pied de carte (`EX-SCR-122`), qui est aussi celui que la suite du test
    // utilise déjà pour REPLIER. Le fait mesuré (les zones se déplient puis se replient au seuil du
    // régime) est inchangé ; seul le contrôle actionné suit l'exigence.
    await card.locator('.kycar-market-card-footer button').click();
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

  // D8-14/D8-17 (E2E-17, CORRIGÉ) : `scatter-render.ts::drawScatter` colore par ANNÉE
  // (`RAMP_A_YEAR`) dès que `options.degraded` est vrai, quel que soit `variant` ; `ScatterCloud.tsx`
  // rend désormais la légende de couleur même en dégradé (`ColorLegend` bascule sur « Année » via son
  // nouveau paramètre `degraded`), seule la légende de TAILLE (sans encodage en dégradé) disparaît.
  // `test.fail()` retiré (D8-17).
  test('CONSTAT E2E-17 — en régime dégradé la couleur encode l’année, déjà distincte de l’axe X (km) (EX-NFR-19, EX-SCR-154)', async ({
    page,
  }, testInfo) => {
    test.skip(regimeOf(testInfo) !== 'compact', 'la dégradation d’EX-NFR-19 ne s’applique que sous 768 px');

    await open(page, SURFACES.B);
    const legend = page.locator('[data-graph="G4"] .kycar-legend-title').first();
    await expect(legend).toBeVisible({ timeout: 10_000 });
    await expect(legend).toHaveText('Année');
  });

  // D8-14/D8-17 (E2E-18, CORRIGÉ) : `view-model.ts::buildMakeCardViewModel` publie désormais
  // `modelsVisibleBeforeCollapse` (le seuil RÉEL reçu par la carte) et `MakeCard.tsx` s'appuie dessus
  // au lieu du littéral `6` en dur — le libellé de repli suit enfin le régime. `test.fail()` retiré
  // (D8-17).
  test('CONSTAT E2E-18 — le bouton de repli annonce le bon seuil du régime compact (EX-SCR-122/135)', async ({
    page,
  }, testInfo) => {
    test.skip(regimeOf(testInfo) !== 'compact', 'le libellé n’est vérifiable que dans le régime qui replie à 4');

    await open(page, `${SURFACES.A}${P1_QUERY}`);
    const card = page.locator('.kycar-market-card').first();
    await card.locator('.kycar-market-card-header').click();
    await expect(card.locator('.kycar-market-card-footer button')).toBeVisible({ timeout: 30_000 });
    const label = await card.locator('.kycar-market-card-footer button').innerText();
    mesure(testInfo, 'EX-SCR-122 — libellé du bouton de repli en compact', label);
    expect(label).toContain('4 modèles');
  });

  /**
   * DETTE D8-15 (ratifiée par le fix-lead, `FIX-LEAD-DECISIONS-2.8.md` §A) — `EX-SCR-95`, réglages
   * « Assainissement KYCAR ». Panneau de préférences sans effet sur une valeur affichée, jugé hors
   * budget de la remédiation 2.8 et requalifié en DETTE PRODUIT. Le test reste écrit et ROUGE PAR
   * CONSTRUCTION (`test.fail()`, jamais `test.skip`) : la dette est ainsi visible dans chaque
   * exécution de la recette, et ce test redeviendra vert le jour où le panneau sera livré.
   */
  test('DETTE D8-15 — les réglages « Assainissement KYCAR » ne sont offerts nulle part (EX-SCR-95)', async ({
    page,
  }, testInfo) => {
    test.fail();
    await open(page, SURFACES.A);
    await waitForMarket(page);
    const found = await page
      .getByText(/assainissement/i)
      .count();
    mesure(testInfo, 'EX-SCR-95 — points d’entrée « Assainissement KYCAR » trouvés', String(found));
    expect(found, 'EX-SCR-95 : un panneau de réglages d’assainissement doit être atteignable').toBeGreaterThan(0);
  });

  test('CONSTAT E2E-21 — le bandeau de filtres et l’écran G sont rendus sans aucune feuille de style (EX-SCR-89..98, EX-SCR-215)', async ({
    page,
  }, testInfo) => {
    // D8-26 (CORRIGÉ par fix-state) : `src/components/filters/filter-band.css` et `screen-g.css`
    // existent et sont importés en effet de bord par leurs composants — le bandeau et l'écran G
    // sont peints. `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
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
