/**
 * KYCAR — Impression (PLAN-2 §2.9a, `EX-NFR-31` / `ARB-63`)
 * =================================================================================================
 * L'exigence est CLOSE : l'impression n'est pas mise en page, mais quatre règles sont dues.
 *   1. les éléments collants (en-tête, bandeau de filtres, barre de synthèse) perdent leur
 *      positionnement fixe ;
 *   2. les bandeaux d'état et le bandeau `C3` SONT imprimés ;
 *   3. le bandeau de filtres est remplacé par un résumé TEXTUEL des filtres actifs, UN PAR LIGNE ;
 *   4. les contrôles interactifs ne sont pas imprimés.
 *
 * `page.emulateMedia({ media: 'print' })` fait basculer le moteur en média `print` : les styles
 * calculés lus ensuite sont ceux du papier. Aucune sonde hors navigateur ne peut évaluer une
 * `@media print`.
 */
import { test, expect, type Page } from '@playwright/test';

import { P1_QUERY, SURFACES, constat, hasCssRuleFor, mesure, open } from './_helpers';

/** Style calculé d'un sélecteur, dans le média courant. */
async function computed(page: Page, selector: string, property: string): Promise<string> {
  return page.evaluate(
    ({ sel, prop }) => {
      const el = document.querySelector(sel);
      if (el === null) return '(absent)';
      return window.getComputedStyle(el).getPropertyValue(prop);
    },
    { sel: selector, prop: property },
  );
}

test.describe('EX-NFR-31 — feuille @media print minimale', () => {
  test('règle 1 : l’en-tête collant perd son positionnement fixe à l’impression', async ({ page }, testInfo) => {
    await open(page, `${SURFACES.A}${P1_QUERY}`);
    expect(await computed(page, '.app-header', 'position')).toBe('sticky');

    await page.emulateMedia({ media: 'print' });
    const printed = await computed(page, '.app-header', 'position');
    mesure(testInfo, 'EX-NFR-31 — position de .app-header à l’impression', printed);
    expect(printed).toBe('static');
  });

  test('règle 2 : les bandeaux d’état et le bandeau C3 sont imprimés', async ({ page }) => {
    await open(page, `${SURFACES.A}${P1_QUERY}`);
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.summary-bar-c3')).toBeVisible();
    await expect(page.locator('.status-banner').first()).toBeVisible();
  });

  test('règle 4 : aucun contrôle interactif n’atteint le papier', async ({ page }, testInfo) => {
    await open(page, `${SURFACES.A}${P1_QUERY}`);
    expect(await page.locator('button:visible').count()).toBeGreaterThan(5);
    await expect(page.locator('.kycar-skip-link')).toHaveCount(1);

    await page.emulateMedia({ media: 'print' });
    const visibleControls = await page.evaluate(() => {
      const shown = (el: Element): boolean => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      };
      return Array.from(document.querySelectorAll('button, input, select, textarea, [role="button"], .no-print')).filter(
        shown,
      ).length;
    });
    mesure(testInfo, 'EX-NFR-31 — contrôles encore visibles à l’impression', String(visibleControls));
    expect(visibleControls).toBe(0);
  });

  // D8-14/D8-17 (E2E-20, CORRIGÉ) : `MarketScreen.tsx` importe désormais `./market.css` (comme
  // `distribution.css`/`listings.css` le font déjà pour leurs écrans) — la feuille de l'écran A entre
  // enfin dans le bundle. `test.fail()` retiré (D8-17) ; ce constat cachait aussi DR-143 (grille
  // compacte 4 lignes, corrigée séparément, D8-12) derrière un fichier mort.
  test('CONSTAT E2E-20 — la barre de synthèse est collante à l’écran : src/screens/market/market.css est bien chargé (EX-NFR-31 règle 1, EX-SCR-105/106)', async ({
    page,
  }, testInfo) => {
    await open(page, `${SURFACES.A}${P1_QUERY}`);
    const rulePresent = await hasCssRuleFor(page, 'kycar-market-summary-bar');
    mesure(testInfo, 'EX-SCR-106 — règle CSS .kycar-market-summary-bar chargée', String(rulePresent));
    expect(rulePresent, 'la feuille de style de l’écran A doit être livrée dans le bundle').toBe(true);
    expect(await computed(page, '.summary-bar', 'position')).toBe('sticky');
  });

  test('CONSTAT E2E-22 — le résumé des filtres actifs n’atteint jamais le papier (EX-NFR-31 règle 3)', async ({
    page,
  }, testInfo) => {
    // D8-14/D8-26 (CORRIGÉ) : DEUX causes. Le résumé est désormais FRÈRE de `.filter-bar` (un
    // ancêtre en `display:none` masquait sa descendance), et la règle « masqué à l'écran » de
    // `print.css`, écrite hors media et placée après le bloc `@media print`, l'emportait à
    // specificité égale jusque sur le papier : elle est bornée à `@media screen`.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-22',
      'EX-NFR-31',
      'le paragraphe .print-filter-summary est un ENFANT de .filter-bar, que la même feuille met en display:none à l’impression : un ancêtre masqué masque sa descendance, la règle .print-filter-summary { display: block } ne peut pas la rattraper. À l’impression, le bandeau de filtres disparaît sans être remplacé par quoi que ce soit',
    );

    await open(page, `${SURFACES.A}${P1_QUERY}`);
    await page.emulateMedia({ media: 'print' });

    const summary = page.locator('.print-filter-summary');
    mesure(testInfo, 'EX-NFR-31 — display du résumé imprimé', await computed(page, '.print-filter-summary', 'display'));
    await expect(summary).toBeVisible();
  });

  test('CONSTAT E2E-23 — le résumé des filtres tient sur une ligne et cite des noms de paramètres bruts (EX-NFR-31 règle 3)', async ({
    page,
  }, testInfo) => {
    // D8-14/D8-26 (CORRIGÉ) : le résumé est construit depuis `buildActiveFilterTokens`, le MÊME
    // modèle que les jetons du bandeau (« Carrosserie : Coupé »), un filtre par ligne.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-23',
      'EX-NFR-31',
      'la règle demande « un résumé textuel des filtres actifs, UN PAR LIGNE » : la coquille produit « Filtres actifs : body=3 · kmto=100000 · priceto=20000 », une seule ligne de noms de PARAMÈTRES d’URL, alors que les jetons du bandeau savent déjà dire « Carrosserie : Coupé » (EX-SCR-75)',
    );

    await open(page, `${SURFACES.A}${P1_QUERY}`);
    const text = (await page.locator('.print-filter-summary').textContent()) ?? '';
    mesure(testInfo, 'EX-NFR-31 — texte du résumé imprimé', text);

    // Trois filtres actifs ⇒ trois lignes, chacune avec un libellé français, aucun nom de paramètre.
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(text).not.toMatch(/priceto=|kmto=|body=/);
    expect(text).toContain('Carrosserie');
  });

  test('l’écran B s’imprime aussi sans contrôle ni graphe interactif (EX-NFR-31)', async ({ page }) => {
    await open(page, SURFACES.B);
    await page.emulateMedia({ media: 'print' });

    // La barre d'outils du modèle porte `no-print` : elle ne doit pas atteindre le papier.
    await expect(page.locator('.kycar-model-toolbar')).toBeHidden();
    // Le contenu statistique, lui, reste imprimé.
    await expect(page.locator('.kycar-stat-header')).toBeVisible();
  });
});
