/**
 * KYCAR — Persistance locale et concurrence entre onglets (PLAN-2 §2.9a, `EX-CRUD-*`)
 * =================================================================================================
 * `EX-CRUD-1`/`4`/`6` — enregistrer, renommer, rouvrir une recherche ; `dernier_accès_le` mis à jour
 * à l'ouverture, valeurs figées d'`ARB-45` jamais réécrites.
 * `EX-CRUD-9`/`10` — suivre un modèle, plafond 30 ; `EX-CRUD-5` — plafond 50 recherches.
 * `EX-CRUD-18` — un blob illisible est PRÉSERVÉ sous `<clé>.corrupt` avant toute réécriture.
 * `EX-CRUD-19`/`ADV-13` — une clé `localStorage` PAR ENTRÉE + un index ordonné, écriture précédée
 * d'une relecture, réconciliation par l'événement `storage` : deux onglets qui écrivent en même
 * temps ne se perdent pas mutuellement une entrée.
 *
 * La concurrence est jouée avec DEUX PAGES DU MÊME CONTEXTE : c'est la seule configuration où deux
 * onglets partagent réellement l'origine et son `localStorage`, et où l'événement `storage` traverse.
 * Deux `BrowserContext` distincts sont deux profils isolés — ils ne modéliseraient pas ADV-13.
 */
import { test, expect, type Page } from '@playwright/test';

import {
  CAPS,
  LS,
  P2_PATH,
  SURFACES,
  constat,
  dumpLocalStorage,
  mesure,
  open,
  openNav,
  seedFollowedModels,
  seedLocalStorage,
  seedSavedSearches,
  waitForMarket,
} from './_helpers';

/**
 * `EX-SCR-212` (D8-31, fix-screens-2 §8.3) — la carte de l'écran E ne fait PLUS du nom un bouton :
 * le nom est un texte (`.kycar-saved-name`), l'ouverture est un bouton NOMMÉ `Ouvrir`, à côté de
 * `Renommer` et `Supprimer`. Toutes les désignations d'une recherche enregistrée passent donc par
 * sa CARTE, puis par le contrôle voulu. La classe est ici le contrat de la carte (au sens du
 * README : `.kycar-saved-row` est l'unité que l'exigence décrit), le contrôle reste désigné par son
 * rôle et son libellé.
 */
function savedRow(page: Page, name: string) {
  return page.locator('.kycar-saved-row', { hasText: name });
}

/** Enregistre la recherche courante depuis la barre d'outils d'écran (`EX-CRUD-1`). */
async function saveSearch(page: Page, name: string): Promise<void> {
  await page.locator('.kycar-market-toolbar').getByRole('button', { name: 'Enregistrer cette recherche' }).first().click();
  await page.getByPlaceholder('Nom de la recherche').fill(name);
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
}

test.describe('EX-CRUD — persistance locale, plafonds et concurrence entre onglets', () => {
  test('EX-CRUD-1 — une recherche enregistrée s’écrit par ENTRÉE et par INDEX, et s’affiche sur l’écran E', async ({
    page,
  }, testInfo) => {
    await open(page, '/marche?priceto=20000');
    await saveSearch(page, 'Budget 20k');

    await expect.poll(async () => Object.keys(await dumpLocalStorage(page)).length, { timeout: 20_000 }).toBeGreaterThan(1);
    const store = await dumpLocalStorage(page);
    const entryKeys = Object.keys(store).filter((k) => k.startsWith(`${LS.saved}/`));
    mesure(testInfo, 'EX-CRUD-19 — clés localStorage écrites', Object.keys(store).join(', '));

    // `EX-CRUD-19` : une clé par entrée, plus un index ordonné. Jamais la collection en un bloc.
    expect(entryKeys).toHaveLength(1);
    expect(store[LS.savedIndex]).toBeDefined();
    const index = JSON.parse(store[LS.savedIndex] ?? '[]') as string[];
    expect(index).toHaveLength(1);
    expect(entryKeys[0]).toBe(`${LS.saved}/${index[0]}`);

    const record = JSON.parse(store[entryKeys[0] as string] ?? '{}') as Record<string, unknown>;
    expect(record.nom).toBe('Budget 20k');
    expect(record.url).toBe('/marche?priceto=20000');
    expect(record.mode).toBe(1);
    expect(typeof record.effectifInitial).toBe('number');
    expect(record.effectifInitial).toBeGreaterThan(0);

    await open(page, SURFACES.E);
    await expect(savedRow(page, 'Budget 20k')).toBeVisible();
  });

  test('EX-CRUD-6 — rouvrir une recherche met à jour dernier_accès_le sans toucher aux valeurs figées (ARB-45)', async ({
    page,
  }) => {
    await open(page, '/marche?priceto=15000');
    await saveSearch(page, 'À rouvrir');
    await expect.poll(async () => Object.keys(await dumpLocalStorage(page)).length, { timeout: 20_000 }).toBeGreaterThan(1);

    const keyOf = async (): Promise<string> =>
      Object.keys(await dumpLocalStorage(page)).find((k) => k.startsWith(`${LS.saved}/`)) ?? '';
    const key = await keyOf();
    const before = JSON.parse((await dumpLocalStorage(page))[key] ?? '{}') as Record<string, unknown>;

    await open(page, SURFACES.E);
    await savedRow(page, 'À rouvrir').getByRole('button', { name: 'Ouvrir' }).click();
    await waitForMarket(page);
    expect(new URL(page.url()).search).toBe('?priceto=15000');

    const after = JSON.parse((await dumpLocalStorage(page))[key] ?? '{}') as Record<string, unknown>;
    expect(after.dernierAccesLe).not.toBe(before.dernierAccesLe);
    // `ARB-45` — figés à la création, jamais réécrits.
    expect(after.creeeLe).toBe(before.creeeLe);
    expect(after.effectifInitial).toBe(before.effectifInitial);
    expect(after.snapshotInitial).toBe(before.snapshotInitial);
  });

  test('EX-CRUD-9/10 — suivre un modèle depuis l’écran B, l’écran F le liste et l’onglet le compte', async ({
    page,
  }) => {
    await open(page, P2_PATH);
    await page.locator('.kycar-model-actions').getByRole('button', { name: 'Suivre', exact: true }).click();
    await expect(page.locator('.kycar-model-actions').getByRole('button', { name: 'Ne plus suivre' })).toBeVisible();
    await openNav(page);
    await expect(page.getByRole('link', { name: 'Suivis (1)' })).toBeVisible();

    await open(page, SURFACES.F);
    await expect(page.locator('#kycar-main')).toContainText('Opel Corsa');
    await expect(page.locator('#kycar-main')).toContainText(`1 / ${CAPS.followed} modèles suivis`);
  });

  test('EX-CRUD-5 — au plafond de 50 recherches, l’enregistrement est REFUSÉ avec son message', async ({
    page,
  }, testInfo) => {
    await seedLocalStorage(page, seedSavedSearches(CAPS.saved));
    await open(page, '/marche?priceto=9000');
    await saveSearch(page, 'La 51e');

    const banner = page.locator('.kycar-banner-message');
    await expect(banner).toBeVisible({ timeout: 20_000 });
    const text = await banner.innerText();
    mesure(testInfo, 'EX-CRUD-5 — message de plafond', text.replace(/\n/g, ' '));
    expect(text).toContain(`Limite de ${CAPS.saved} recherches atteinte`);

    // L'écriture n'a PAS été appliquée en dépassement.
    const index = JSON.parse((await dumpLocalStorage(page))[LS.savedIndex] ?? '[]') as string[];
    expect(index).toHaveLength(CAPS.saved);
  });

  test('EX-CRUD-10 — au plafond de 30 modèles suivis, le suivi est REFUSÉ avec son message', async ({
    page,
  }, testInfo) => {
    await seedLocalStorage(page, seedFollowedModels(CAPS.followed));
    await open(page, P2_PATH);
    await openNav(page);
    await expect(page.getByRole('link', { name: `Suivis (${CAPS.followed})` })).toBeVisible();

    const follow = page.locator('.kycar-model-actions').getByRole('button', { name: 'Suivre', exact: true });
    await expect(follow).toBeVisible();
    await follow.click();
    const banner = page.locator('.kycar-banner-message');
    await expect(banner).toBeVisible({ timeout: 20_000 });
    const text = await banner.innerText();
    mesure(testInfo, 'EX-CRUD-10 — message de plafond', text.replace(/\n/g, ' '));
    expect(text).toContain(`Limite de ${CAPS.followed} modèles suivis atteinte`);

    const index = JSON.parse((await dumpLocalStorage(page))[LS.followedIndex] ?? '[]') as string[];
    expect(index).toHaveLength(CAPS.followed);
  });

  test('EX-CRUD-19 — écritures SÉQUENTIELLES de deux onglets : une clé par entrée, index réconcilié, aucun rechargement', async ({
    page,
    context,
  }, testInfo) => {
    await open(page, '/marche?priceto=11000');
    const second = await context.newPage();
    await second.goto('/marche?kmto=60000', { waitUntil: 'commit' });
    await waitForMarket(second);

    await saveSearch(page, 'Onglet A');
    await expect(page.locator('.kycar-banner-message')).toBeVisible({ timeout: 20_000 });
    await saveSearch(second, 'Onglet B');
    await expect(second.locator('.kycar-banner-message')).toBeVisible({ timeout: 20_000 });

    await expect
      .poll(async () => (JSON.parse((await dumpLocalStorage(page))[LS.savedIndex] ?? '[]') as string[]).length, {
        timeout: 20_000,
      })
      .toBe(2);

    const store = await dumpLocalStorage(page);
    const entryKeys = Object.keys(store).filter((k) => k.startsWith(`${LS.saved}/`));
    const names = entryKeys.map((k) => (JSON.parse(store[k] ?? '{}') as { nom?: string }).nom ?? '?').sort();
    mesure(testInfo, 'EX-CRUD-19 — état après écritures séquentielles', `${entryKeys.length} entrées [${names.join(', ')}]`);
    expect(names).toEqual(['Onglet A', 'Onglet B']);

    // Réconciliation SANS rechargement : l'onglet A voit l'entrée écrite par l'onglet B.
    await openNav(page);
    await page.getByRole('link', { name: 'Recherches' }).click();
    await expect(savedRow(page, 'Onglet A')).toBeVisible({ timeout: 20_000 });
    await expect(savedRow(page, 'Onglet B')).toBeVisible();
    await second.close();
  });

  test('CONSTAT E2E-25 — deux onglets qui enregistrent AU MÊME INSTANT perdent une entrée de l’index (EX-CRUD-19, ADV-13)', async ({
    page,
    context,
  }, testInfo) => {
    // D8-26 (CORRIGÉ) : l'index ordonné des collections est AUTO-RÉPARATEUR — réconcilié avec
    // les clés `kycar:<collection>/*` réellement présentes à chaque lecture, la réparation étant
    // persistée et rejouée sur l'événement `storage` d'un autre onglet (crud-store.ts).
    // Mesuré 0 ronde perdante sur 8, trois exécutions. `test.fail()` retiré (D8-17).
    constat(
      testInfo,
      'E2E-25',
      'EX-CRUD-19/ADV-13',
      'les deux blobs d’entrée sont bien écrits, mais l’INDEX ordonné n’en cite qu’un : CappedCollection.mutate relit l’index (étape 3) puis le réécrit, et cette lecture-écriture n’est pas atomique entre deux processus de rendu. Si les deux onglets lisent l’index avant que l’autre ne l’écrive, le dernier écrivain efface l’identifiant du premier. L’entrée orpheline n’est plus jamais réindexée : la recherche enregistrée disparaît définitivement de l’écran E, sans message. EX-CRUD-19 promet exactement l’inverse (« la seule façon dont deux onglets peuvent écrire sans se faire perdre mutuellement une entrée »)',
    );

    await open(page, '/marche?priceto=11000');
    const second = await context.newPage();
    await second.goto('/marche?kmto=60000', { waitUntil: 'commit' });
    await waitForMarket(second);

    // La fenêtre de course est de quelques microsecondes : on la sollicite plusieurs fois. Chaque
    // ronde enregistre deux recherches simultanément et compare le nombre de blobs à celui de l'index.
    const ROUNDS = 8;
    const losses: string[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      await page.locator('.kycar-market-toolbar').getByRole('button', { name: 'Enregistrer cette recherche' }).first().click();
      await second.locator('.kycar-market-toolbar').getByRole('button', { name: 'Enregistrer cette recherche' }).first().click();
      await page.getByPlaceholder('Nom de la recherche').fill(`A${round}`);
      await second.getByPlaceholder('Nom de la recherche').fill(`B${round}`);
      await Promise.all([
        page.getByRole('button', { name: 'Enregistrer', exact: true }).click(),
        second.getByRole('button', { name: 'Enregistrer', exact: true }).click(),
      ]);
      await page.waitForTimeout(400);

      const store = await dumpLocalStorage(page);
      const entryKeys = Object.keys(store).filter((k) => k.startsWith(`${LS.saved}/`));
      const index = JSON.parse(store[LS.savedIndex] ?? '[]') as string[];
      if (index.length !== entryKeys.length) {
        losses.push(`ronde ${round} : ${entryKeys.length} blobs pour ${index.length} identifiants indexés`);
      }
    }

    mesure(
      testInfo,
      'EX-CRUD-19 — rondes d’écriture simultanée avec perte',
      `${losses.length} sur ${ROUNDS}${losses.length > 0 ? ` — ${losses.join(' ; ')}` : ''}`,
    );
    await second.close();
    expect(losses, 'aucune ronde ne doit perdre une entrée de l’index').toEqual([]);
  });

  test('les collections survivent à un rechargement complet de la page', async ({ page }) => {
    await open(page, '/marche?priceto=12500');
    await saveSearch(page, 'Survivante');
    await expect.poll(async () => Object.keys(await dumpLocalStorage(page)).length, { timeout: 20_000 }).toBeGreaterThan(1);

    await page.reload({ waitUntil: 'commit' });
    await waitForMarket(page);
    await openNav(page);
    await page.getByRole('link', { name: 'Recherches' }).click();
    await expect(savedRow(page, 'Survivante')).toBeVisible({ timeout: 20_000 });
  });

  test('EX-CRUD-18 — un blob illisible est préservé sous une clé .corrupt avant toute réécriture', async ({
    page,
  }, testInfo) => {
    const poison = '{ceci n’est pas du JSON';
    await seedLocalStorage(page, { [LS.saved]: poison });
    await open(page, '/marche?priceto=8000');

    // La lecture ne lève jamais (`DR-098`) : l'écran E s'affiche, vide.
    await openNav(page);
    await page.getByRole('link', { name: 'Recherches' }).click();
    await expect(page.locator('#kycar-main h1')).toBeVisible();

    // La première ÉCRITURE préserve le blob illisible sous `<clé>.corrupt`.
    await openNav(page);
    await page.getByRole('link', { name: 'Marché' }).click();
    await waitForMarket(page);
    await saveSearch(page, 'Après corruption');

    await expect
      .poll(async () => Object.keys(await dumpLocalStorage(page)).some((k) => k.endsWith('.corrupt')), {
        timeout: 20_000,
      })
      .toBe(true);
    const store = await dumpLocalStorage(page);
    const corruptKey = Object.keys(store).find((k) => k.endsWith('.corrupt')) ?? '';
    mesure(testInfo, 'EX-CRUD-18 — clé de sauvegarde du blob illisible', corruptKey);
    expect(corruptKey).toBe(`${LS.saved}.corrupt`);
    expect(store[corruptKey]).toBe(poison);
  });

  test('CONSTAT E2E-24 — tout enregistrement annonce « un nom identique existait déjà » (EX-CRUD-1/3)', async ({
    page,
  }, testInfo) => {
    // D8-14/D8-26 (CORRIGÉ) : `hasDuplicateName` est évalué AVANT `create`, sur l'état antérieur.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-24',
      'EX-CRUD-1/EX-CRUD-3',
      'src/app.tsx appelle stores.saved.hasDuplicateName(nom) APRÈS stores.saved.create(...) : l’entrée qui vient d’être créée compte comme son propre doublon, donc le message « Recherche enregistrée (un nom identique existait déjà). » s’affiche à CHAQUE enregistrement, même sur une collection vide — l’avertissement d’homonymie devient du bruit et perd tout pouvoir informatif',
    );

    await open(page, '/marche?priceto=7000');
    await saveSearch(page, 'Tout premier nom');
    const banner = page.locator('.kycar-banner-message');
    await expect(banner).toBeVisible({ timeout: 20_000 });
    const text = await banner.innerText();
    mesure(testInfo, 'EX-CRUD-1 — message après le tout premier enregistrement', text.replace(/\n/g, ' '));
    expect(text).not.toContain('un nom identique existait déjà');
  });
  test('EX-SCR-212 / EX-SCR-213 — la carte de l’écran E : nom, périmètre, filtres, effectif, et trois actions nommées', async ({
    page,
  }, testInfo) => {
    await open(page, '/marche?priceto=20000');
    await saveSearch(page, 'Budget 20k');
    await expect.poll(async () => Object.keys(await dumpLocalStorage(page)).length, { timeout: 20_000 }).toBeGreaterThan(1);

    await open(page, SURFACES.E);
    const row = savedRow(page, 'Budget 20k');
    await expect(row).toBeVisible({ timeout: 20_000 });

    // `EX-SCR-212` — TROIS boutons nommés ; le nom n'est plus une action.
    expect(await row.getByRole('button').allInnerTexts()).toEqual(['Ouvrir', 'Renommer', 'Supprimer']);
    await expect(row.getByRole('button', { name: 'Ouvrir' })).toBeEnabled();

    const text = await row.innerText();
    mesure(testInfo, 'EX-SCR-212 — carte de recherche enregistrée', text.replace(/\n+/g, ' · '));
    // Périmètre puis description GÉNÉRÉE des filtres actifs, dans les libellés du bandeau.
    expect(text).toContain('Toutes marques');
    expect(text).toMatch(/Prix\s*:\s*\u2264\s*20[\s\u00A0\u202F]?000\s*\u20AC/);
    expect(text).toMatch(/offres à la création/);
    // `EX-SCR-213` — snapshot INCHANGÉ depuis la création : aucun écart affiché, jamais un « + 0 ».
    await expect(row.locator('.kycar-saved-delta')).toHaveCount(0);
    expect(text).toMatch(/offres actuellement/);

    // `Ouvrir` restitue exactement l'URL enregistrée (`EX-CRUD-6`).
    await row.getByRole('button', { name: 'Ouvrir' }).click();
    await waitForMarket(page);
    expect(new URL(page.url()).search).toBe('?priceto=20000');
  });
});
