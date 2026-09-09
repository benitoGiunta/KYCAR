/**
 * KYCAR — recette de la SOURCE DE DONNÉES (phase 3.5, `D3-01`, `DF-2`)
 * =================================================================================================
 * Le MVP est livré sur des données FICTIVES (`fixture:test`). Deux exigences en découlent, et elles
 * sont exercées ici sur le build de production, pas sur un composant isolé :
 *
 *   1. **`EX-DATA-107`** — l'utilisateur ne doit jamais pouvoir croire que ces chiffres viennent
 *      d'un marché réel. La nature de la source est écrite sur TOUS les écrans (bandeau), dans le
 *      pied de page, dans `/mentions` et dans l'en-tête des exports CSV. Le pied de page ne doit
 *      surtout PAS annoncer « Source : AutoScout24 » sur un jeu fictif.
 *   2. **`DF-2`** — « brancher une autre source est un PARAMÈTRE, pas une recompilation » :
 *      `?provider=` bascule la source de bout en bout (URL → registre → provider → étiquette), et
 *      une spécification inconnue retombe sur le défaut AVEC un avertissement VISIBLE.
 */
import { test, expect } from '@playwright/test';

import { derived, mesure, open, readMarketSummary, waitForMarket } from './_helpers';

/** Le texte que doit porter l'étiquette d'un jeu de fixtures, quel que soit l'écran. */
const FIXTURE_TEXT = /jeu de données fictif à la forme autoscout24/i;

test.describe('EX-DATA-107 — la nature FIXTURE est dite partout', () => {
  test('bandeau d’en-tête : le jeu fictif est nommé sur l’écran A, avec son profil', async ({ page }, testInfo) => {
    await open(page, '/marche');
    const banner = page.locator('.kycar-banner-source');
    await expect(banner).toBeVisible();
    const text = await banner.innerText();
    mesure(testInfo, 'EX-DATA-107 — étiquette de source', text);
    expect(text).toMatch(FIXTURE_TEXT);
    expect(text).toMatch(/aucune annonce réelle/i);
    expect(text).toMatch(/profil test/i);
  });

  test('pied de page : la mention légale n’attribue RIEN à AutoScout24 sur un jeu fictif', async ({ page }) => {
    await open(page, '/marche');
    const legal = page.locator('.kycar-footer-legal');
    await expect(legal).toBeVisible();
    const text = await legal.innerText();
    expect(text).not.toMatch(/^Source\s*:\s*AutoScout24/i);
    expect(text).toMatch(FIXTURE_TEXT);
    expect(text).toMatch(/aucune annonce réelle/i);
  });

  test('/mentions : la phrase de provenance existe et nomme le jeu fictif', async ({ page }) => {
    await open(page, '/mentions');
    const provenance = page.locator('.kycar-mentions-provenance');
    await expect(provenance).toBeVisible();
    const text = await provenance.innerText();
    expect(text).toMatch(FIXTURE_TEXT);
    // La traçabilité du snapshot servi accompagne la nature (identifiant du provider, capture).
    expect(text).toMatch(/kycar-fixture-test|source :/i);
  });

  test('panneau Diagnostic : la nature relayée par describe() est FIXTURE, jamais REAL', async ({ page }) => {
    await open(page, '/marche');
    const source = page.locator('.kycar-footer-diagnostic dd').nth(1);
    await expect(source).toHaveText('FIXTURE');
  });

  test('l’écran A sert bien le snapshot le plus récent du profil (traçabilité EX-DATA-106)', async ({ page }) => {
    await open(page, '/marche');
    const attendu = await derived();
    const snapshotCell = page.locator('.kycar-footer-diagnostic dd').nth(2);
    await expect(snapshotCell).toHaveText(attendu.snapshotId);
    expect((await readMarketSummary(page)).offers).toBe(attendu.listingCount);
  });
});

test.describe('DF-2 — la bascule de source est un paramètre d’URL', () => {
  test('?provider=fixture:dev charge l’autre profil et l’étiquette le DIT', async ({ page }, testInfo) => {
    await page.goto('/marche?provider=fixture:dev', { waitUntil: 'commit' });
    await waitForMarket(page);
    const text = await page.locator('.kycar-banner-source').innerText();
    mesure(testInfo, 'DF-2 — étiquette sous ?provider=fixture:dev', text);
    expect(text).toMatch(FIXTURE_TEXT);
    expect(text).toMatch(/profil dev/i);
    // Le profil `dev` est plus petit que le profil `test` : la bascule change les DONNÉES servies,
    // pas seulement le libellé.
    const dev = await readMarketSummary(page);
    expect(dev.offers).toBeGreaterThan(0);
    expect(dev.offers).toBeLessThan((await derived()).listingCount);
    // Aucun avertissement de repli : la spécification est reconnue et câblée.
    await expect(page.locator('.kycar-banner-source-fallback')).toHaveCount(0);
  });

  test('?provider=synthetic bascule sur le jeu synthétique, avec SON étiquette', async ({ page }, testInfo) => {
    await page.goto('/marche?provider=synthetic', { waitUntil: 'commit' });
    await waitForMarket(page);
    const text = await page.locator('.kycar-banner-source').innerText();
    mesure(testInfo, 'DF-2 — étiquette sous ?provider=synthetic', text);
    expect(text).toMatch(/données synthétiques/i);
    expect(text).not.toMatch(FIXTURE_TEXT);
    await expect(page.locator('.kycar-footer-diagnostic dd').nth(1)).toHaveText('SYNTHETIC');
    await expect(page.locator('.kycar-banner-source-fallback')).toHaveCount(0);
  });

  test('?provider=<inconnu> retombe sur le défaut AVEC un avertissement visible (D-03)', async ({
    page,
  }, testInfo) => {
    await page.goto('/marche?provider=carrosserie-de-mon-oncle', { waitUntil: 'commit' });
    await waitForMarket(page);

    const fallback = page.locator('.kycar-banner-source-fallback');
    await expect(fallback).toBeVisible();
    const text = await fallback.innerText();
    mesure(testInfo, 'DF-2 — avertissement de repli', text.replace(/\n/g, ' '));
    expect(text).toMatch(/inconnue/i);
    expect(text).toMatch(/carrosserie-de-mon-oncle/);
    expect(text).toMatch(/fixture:test/);

    // Le repli est RÉEL : c'est bien la source par défaut qui sert.
    await expect(page.locator('.kycar-footer-diagnostic dd').nth(1)).toHaveText('FIXTURE');
    expect((await readMarketSummary(page)).offers).toBe((await derived()).listingCount);
  });

  test('?provider=tweedehands (non câblé) est REFUSÉ avec son motif, jamais appliqué en silence', async ({
    page,
  }, testInfo) => {
    await page.goto('/marche?provider=tweedehands', { waitUntil: 'commit' });
    await waitForMarket(page);
    const text = await page.locator('.kycar-banner-source-fallback').innerText();
    mesure(testInfo, 'DF-2 — refus d’une source non câblée', text.replace(/\n/g, ' '));
    expect(text).toMatch(/non branchée/i);
    expect(text).toMatch(/AC-01/);
    await expect(page.locator('.kycar-footer-diagnostic dd').nth(1)).toHaveText('FIXTURE');
  });
});
