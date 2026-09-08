/**
 * KYCAR — Parcours cible 2 (mode 2), recette navigateur (PLAN-2 §2.9a, `docs/00-CONTEXT.md`)
 * =================================================================================================
 * « Opel Corsa 2017 : montre-moi la distribution des prix, le nuage prix × année × kilométrage, et
 *   la liste des annonces — et laisse-moi convertir ce que je brosse en filtre. »
 *
 * Vérité terrain (`tests/review/D8/parcours.test.ts`) : la cellule Opel (54) Corsa (1918) porte
 * 1 352 annonces dans le snapshot synthétique de 100 000, dont 54 immatriculées en 2017.
 *
 * Ce fichier est celui qui porte le plus de `test.fail()` : la recette navigateur révèle que les
 * consommateurs MAIN-THREAD du lot colonnaire (nuage G4, graphes additionnels, écran D, export des
 * annonces) lisent des vues typées DÉTACHÉES — le lot est transféré au Web Worker d'agrégation
 * (`src/worker/client.ts`, liste de `Transferable`), ce qu'aucune sonde hors navigateur ne pouvait
 * voir puisqu'elles pilotent le moteur in-process.
 */
import { test, expect, type Page } from '@playwright/test';

import {
  P2_EXPECTED,
  brushScatter,
  P2_LISTINGS_PATH,
  P2_PATH,
  P2_YEAR_QUERY,
  constat,
  mesure,
  open,
  parseInteger,
  readCanvasInk,
  openFilterSheet,
  regimeOf,
  readSelectionCount,
  stripSpaces,
  waitForDistribution,
  waitForMarket,
} from './_helpers';

/**
 * Sélection à effectif NUL sur la cellule Opel Corsa : aucune Corsa n'est immatriculée entre 1950
 * et 1960 dans le snapshot synthétique (1 352 offres sans ce filtre). C'est un intervalle, donc un
 * SEUL jeton du bandeau porté par DEUX identifiants de filtre (`fregfrom`/`fregto`) — ce qui éprouve
 * du même coup le retrait apparié d'`EX-SCR-26`.
 */
const P2_EMPTY_QUERY = '?fregfrom=1950&fregto=1960';

/** Somme des effectifs de la table de données équivalente d'un cadre de graphe (`EX-NFR-15`). */
async function sumDataTable(page: Page, graphId: string, column: number): Promise<number> {
  const cells = await page.locator(`[data-graph="${graphId}"] .kycar-graph-datatable tbody tr td:nth-child(${column})`).allInnerTexts();
  return cells.reduce((sum, cell) => sum + (Number(stripSpaces(cell)) || 0), 0);
}

test.describe('Parcours 2 — mode 2, distribution d’un modèle', () => {
  test('en-tête statistique : effectif, médiane, quartiles et fourchette min – max (EX-SCR-142)', async ({
    page,
  }, testInfo) => {
    await open(page, `${P2_PATH}${P2_YEAR_QUERY}`);

    expect(await readSelectionCount(page)).toBe(P2_EXPECTED.corsa2017);
    const header = await page.locator('.kycar-stat-header').innerText();
    expect(header).toContain('Opel Corsa');
    const NUM = '[\\d\\s\\u00A0\\u202F]+';
    expect(header).toMatch(new RegExp(`médiane\\s${NUM}€`));
    expect(header).toMatch(new RegExp(`P25\\s${NUM}€`));
    expect(header).toMatch(new RegExp(`P75\\s${NUM}€`));
    // `EX-SCR-4` — fourchette au tiret demi-cadratin, du moins cher au plus cher.
    expect(header).toMatch(new RegExp(`min\\s${NUM}€\\s*–\\s*max\\s${NUM}€`));
    expect(header).toContain('du moins cher au plus cher');
    expect(header).toMatch(/km médian/);
    expect(header).toMatch(/1ʳᵉ immat\. médiane/);

    // Le titre de document nomme la vue ET le couple (`EX-NFR-14`, DR-101).
    await expect(page).toHaveTitle('KYCAR — Distribution d’un modèle · Opel Corsa');
    mesure(testInfo, 'P2 — en-tête écran B (2017)', header.replace(/\n/g, ' | '));
  });

  test('cellule entière sans filtre d’année : 1 352 annonces (vérité terrain D8)', async ({ page }) => {
    await open(page, P2_PATH);
    expect(await readSelectionCount(page)).toBe(P2_EXPECTED.corsaTotal);
  });

  test('G1–G3 présents, chacun doublé de sa table de données équivalente (EX-SCR-141, EX-NFR-15)', async ({
    page,
  }) => {
    await open(page, `${P2_PATH}${P2_YEAR_QUERY}`);

    for (const [graphId, title] of [
      ['G1', 'Offres par prix'],
      ['G2', 'Offres par kilométrage'],
      ['G3', 'Offres par année'],
    ] as const) {
      const frame = page.locator(`[data-graph="${graphId}"]`);
      await expect(frame).toBeVisible();
      await expect(frame.locator('.kycar-graph-title')).toContainText(title);

      // Le tableau équivalent n'est déplié que par le bouton — seule voie conforme au clavier.
      const toggle = frame.getByRole('button', { name: 'Voir les données' });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
      await expect(frame.getByRole('button', { name: 'Masquer les données' })).toBeVisible();

      const table = frame.locator('.kycar-graph-datatable table');
      await expect(table).toBeVisible();
      for (const column of ['Classe', 'Effectif', 'Part']) {
        await expect(table.locator('thead')).toContainText(column);
      }

      // Équivalence : une ligne de table par barre tracée, effectifs identiques.
      const bars = await frame.locator('svg.kycar-hist rect[role="button"]').count();
      const rows = await frame.locator('.kycar-graph-datatable tbody tr').count();
      expect(rows).toBe(bars);
      expect(rows).toBeGreaterThan(0);

      const total = await sumDataTable(page, graphId, 2);
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(P2_EXPECTED.corsa2017);
    }
  });

  test('clic sur une barre d’histogramme : le filtre d’intervalle correspondant est posé (ARB-09, EX-SCR-149)', async ({
    page,
  }) => {
    await open(page, `${P2_PATH}${P2_YEAR_QUERY}`);

    const bars = page.locator('[data-graph="G1"] svg.kycar-hist rect[role="button"]');
    const count = await bars.count();
    let chosen: { label: string; index: number } | null = null;
    for (let i = 0; i < count; i += 1) {
      const label = (await bars.nth(i).getAttribute('aria-label')) ?? '';
      if (!/:\s*0\s+offres/.test(label)) {
        chosen = { label, index: i };
        break;
      }
    }
    expect(chosen, 'aucune barre non vide sur G1').not.toBeNull();
    const expected = parseInteger((chosen?.label ?? '').split(':')[1] ?? '0');

    // Une barre SVG peut être haute de 0 px : on déclenche l'activation, pas un clic géométrique.
    await bars.nth(chosen?.index ?? 0).dispatchEvent('click');

    await page.waitForFunction(() => window.location.search.includes('pricefrom='), null, { timeout: 20_000 });
    const search = new URL(page.url()).search;
    expect(search).toContain('pricefrom=');
    expect(search).toContain('priceto=');
    // Le filtre est RÉEL : Σ se recalcule sur l'intervalle de la barre.
    await expect.poll(() => readSelectionCount(page), { timeout: 30_000 }).toBe(expected);
  });

  test('« Voir les <n> annonces » mène à l’écran D du même couple, filtres conservés (EX-SCR-142 ligne 3)', async ({
    page,
  }) => {
    await open(page, `${P2_PATH}${P2_YEAR_QUERY}`);
    await page.getByRole('button', { name: `Voir les ${P2_EXPECTED.corsa2017} annonces` }).click();
    await expect.poll(() => new URL(page.url()).pathname, { timeout: 20_000 }).toBe(P2_LISTINGS_PATH);
    expect(new URL(page.url()).search).toBe(P2_YEAR_QUERY);
  });

  test('brossage du nuage : les bornes sont écrites dans l’URL (EX-NAV-10bis, selx/sely)', async ({ page }, testInfo) => {
    test.skip(
      regimeOf(testInfo) === 'compact',
      'EX-NFR-19 : sous 768 px le nuage est servi en projection 2D dégradée, brossage désactivé par contrat',
    );
    await open(page, `${P2_PATH}${P2_YEAR_QUERY}`);
    await brushScatter(page);

    await page.waitForFunction(() => window.location.search.includes('selx='), null, { timeout: 20_000 });
    const search = new URL(page.url()).search;
    expect(search).toContain('selx=');
    expect(search).toContain('sely=');
  });

  test('CONSTAT E2E-02 — le nuage G4 ne trace aucun point sur une cellule de 1 352 annonces (EX-SCR-151..160, EX-DATA-99)', async ({
    page,
  }, testInfo) => {
    // D8-01/D8-26 (CONSTAT E2E-02, CORRIGÉ) : `src/worker/client.ts::loadDataset` n'envoie plus le lot
    // colonnaire en `Transferable` — il part par copie structurée, l'hôte garde ses tampons.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-02',
      'EX-SCR-151/EX-DATA-99',
      'le canvas G4 est vierge (0 pixel encré, aria-label « Nuage de 0 points ») : les vues typées du lot colonnaire sont DÉTACHÉES côté thread principal après leur transfert au worker (src/worker/client.ts), donc computeEligibility rejette toutes les lignes',
    );

    await open(page, P2_PATH);
    expect(await readSelectionCount(page)).toBe(P2_EXPECTED.corsaTotal);

    const ariaLabel = await page.locator('[data-graph="G4"] canvas').getAttribute('aria-label');
    mesure(testInfo, 'P2 — nuage G4', String(ariaLabel));
    expect(ariaLabel).not.toMatch(/Nuage de 0 points/);

    const ink = await readCanvasInk(page, '[data-graph="G4"] canvas');
    mesure(testInfo, 'P2 — encre du canvas G4', `${ink.inked} pixels sur ${ink.width}×${ink.height}`);
    expect(ink.inked).toBeGreaterThan(0);
  });

  test('CONSTAT E2E-03 — la seconde projection du nuage est désactivée faute de points (EX-SCR-152)', async ({
    page,
  }, testInfo) => {
    test.skip(
      regimeOf(testInfo) === 'compact',
      'EX-NFR-19 : la bascule de projection n’existe pas en régime dégradé (projection 2D imposée)',
    );
    // D8-01/D8-26 (CONSTAT E2E-03, CORRIGÉ) : `src/worker/client.ts::loadDataset` n'envoie plus le lot
    // colonnaire en `Transferable` — il part par copie structurée, l'hôte garde ses tampons.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-03',
      'EX-SCR-152',
      'l’onglet « Prix × année » est rendu disabled avec le titre « Nécessite l’année de première immatriculation » : conséquence directe d’E2E-02, la bascule entre les deux projections est inatteignable',
    );

    await open(page, `${P2_PATH}${P2_YEAR_QUERY}`);
    const g4 = page.locator('[data-graph="G4"]');
    await expect(g4.getByRole('tab', { name: 'Nuée empilée' })).toBeEnabled();
    await expect(g4.getByRole('tab', { name: 'Prix × année' })).toBeEnabled();

    await g4.getByRole('tab', { name: 'Prix × année' }).click();
    await page.waitForFunction(() => window.location.search.includes('g4v='), null, { timeout: 20_000 });
  });

  test('CONSTAT E2E-06 — un brossage ne sélectionne aucune annonce : « Convertir la sélection en filtre » et « Voir ces annonces » n’apparaissent jamais (EX-SCR-158/184)', async ({
    page,
  }, testInfo) => {
    test.skip(
      regimeOf(testInfo) === 'compact',
      'EX-NFR-19 : brossage désactivé par contrat en régime dégradé',
    );
    // D8-01/D8-26 (CONSTAT E2E-06, CORRIGÉ) : `src/worker/client.ts::loadDataset` n'envoie plus le lot
    // colonnaire en `Transferable` — il part par copie structurée, l'hôte garde ses tampons.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-06',
      'EX-SCR-158/EX-SCR-184',
      'les bornes du brossage sont bien écrites dans l’URL (selx/sely) mais la sélection est vide (0 point tracé, cf. E2E-02) : les deux actions de la sélection ne sont pas montées, le maillon « brosser → filtrer → lister » du parcours 2 est rompu',
    );

    await open(page, P2_PATH);
    await brushScatter(page);
    await page.waitForFunction(() => window.location.search.includes('selx='), null, { timeout: 20_000 });

    await expect(page.getByRole('button', { name: 'Convertir la sélection en filtre' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: 'Voir ces annonces' })).toBeVisible();
  });

  test('CONSTAT E2E-01 — l’écran D lève « detached ArrayBuffer » et ne rend aucune annonce (EX-SCR-201..210)', async ({
    page,
  }, testInfo) => {
    // D8-01/D8-26 (CONSTAT E2E-01, CORRIGÉ) : `src/worker/client.ts::loadDataset` n'envoie plus le lot
    // colonnaire en `Transferable` — il part par copie structurée, l'hôte garde ses tampons.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-01',
      'EX-SCR-201..210',
      'la route /annonces monte la barre d’outils puis lève TypeError: Cannot perform Construct on a detached ArrayBuffer ; aucun tableau, aucune pagination, aucun bouton « Ouvrir ↗ » : le parcours cible 2 ne se termine pas',
    );

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(`${P2_LISTINGS_PATH}${P2_YEAR_QUERY}`, { waitUntil: 'commit' });
    await expect(page.locator('.kycar-model-title')).toContainText('Opel Corsa', { timeout: 60_000 });
    await page.waitForTimeout(2_000);
    mesure(testInfo, 'P2 — erreurs de page sur l’écran D', errors.join(' | ') || '(aucune)');

    expect(errors, 'aucune exception ne doit remonter du rendu de l’écran D').toEqual([]);
    // `EX-SCR-209` (D8-15) : en régime COMPACT l'écran D remplace le tableau par des cartes — le
    // fait mesuré (les annonces sont RENDUES, la route ne lève plus) est le même sur les deux
    // formes ; seul le conteneur diffère, comme le contrat responsive le prévoit.
    const listings =
      regimeOf(testInfo) === 'compact'
        ? page.locator('.kycar-listings-cards')
        : page.locator('.kycar-listings-table');
    await expect(listings).toBeVisible({ timeout: 20_000 });
  });

  test('CONSTAT E2E-07 — pagination 50, tri, jeton de doublon et « Ouvrir ↗ » de l’écran D (EX-SCR-203/206/208, EX-DATA-15)', async ({
    page,
    context,
  }, testInfo) => {
    constat(
      testInfo,
      'E2E-07',
      'EX-SCR-203/206/208',
      'aucun des contrôles de l’écran D n’est atteignable (pagination de 50, tri mono-colonne, jeton « ! » de DUPLICATE_VALUE_CONFLICT, lien sortant « Ouvrir ↗ » vers l’annonce d’origine) : conséquence d’E2E-01',
    );

    // `EX-SCR-209` (D8-15) : le TABLEAU et son tri par en-tête n'existent pas en régime compact
    // (cartes + sélecteur « Trier par… »). Inadéquation de plate-forme, jamais un masquage : les
    // mêmes contrôles y sont exercés par le test de régime de `responsive.spec.ts`.
    test.skip(regimeOf(testInfo) === 'compact', 'EX-SCR-209 : l’écran D est rendu en cartes sous 768 px, sans en-tête de tri');

    await page.goto(`${P2_LISTINGS_PATH}`, { waitUntil: 'commit' });
    await expect(page.locator('.kycar-model-title')).toContainText('Opel Corsa', { timeout: 60_000 });

    // Pagination : 50 lignes par page (`EX-SCR-208`, mandat de lot).
    await expect(page.locator('.kycar-listings-table tbody tr')).toHaveCount(50, { timeout: 20_000 });
    await expect(page.locator('.kycar-pager')).toContainText('page 1 /');

    // Tri mono-colonne par en-tête (`EX-SCR-206`).
    // D8-26/D-31 : le locator `/^Prix/` non ancré était AMBIGU dès que l'écran D rend réellement —
    // il capturait aussi le repli « Prix et valeur » du bandeau de filtres (le test échouait avant
    // d'y arriver, E2E-01). Il est ancré sur l'en-tête de la table ; l'assertion est inchangée.
    await page.locator('.kycar-listings-table').getByRole('button', { name: 'Prix', exact: true }).click();
    await expect(page.locator('th[aria-sort="ascending"]')).toHaveCount(1);

    // `EX-SCR-201`/`164` — seul lien SORTANT : nouvel onglet vers l'annonce d'origine.
    const opened = context.waitForEvent('page', { timeout: 15_000 });
    await page.getByRole('button', { name: "Ouvrir l'annonce d'origine" }).first().click();
    const popup = await opened;
    expect(popup.url()).not.toContain('localhost:4180');
  });

  test('CONSTAT E2E-08 — les graphes additionnels G5 et G8–G15 rendent des tables de données VIDES (EX-SCR-144, EX-NFR-15)', async ({
    page,
  }, testInfo) => {
    // D8-01/D8-26 (CONSTAT E2E-08, CORRIGÉ) : `src/worker/client.ts::loadDataset` n'envoie plus le lot
    // colonnaire en `Transferable` — il part par copie structurée, l'hôte garde ses tampons.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-08',
      'EX-SCR-144/EX-NFR-15',
      'les tables équivalentes de G5, G8, G9, G10, G12, G13, G14 et G15 ne portent que leur en-tête (zéro ligne) : ces graphes sont calculés sur le thread principal à partir du lot colonnaire détaché (cf. E2E-02)',
    );

    await open(page, P2_PATH);
    const empties: string[] = [];
    for (const graphId of ['G5', 'G8', 'G9', 'G10', 'G12', 'G13', 'G14', 'G15']) {
      const frame = page.locator(`[data-graph="${graphId}"]`);
      if ((await frame.count()) === 0) continue;
      await frame.getByRole('button', { name: 'Voir les données' }).click();
      const rows = await frame.locator('.kycar-graph-datatable tbody tr').count();
      if (rows === 0) empties.push(graphId);
    }
    mesure(testInfo, 'P2 — graphes additionnels sans ligne de données', empties.join(', ') || '(aucun)');
    expect(empties).toEqual([]);
  });

  test('CONSTAT E2E-09 — la part de particuliers de l’en-tête vaut 0 % (EX-SCR-142 ligne 2, EX-NFR-29)', async ({
    page,
  }, testInfo) => {
    // D8-01/D8-26 (CONSTAT E2E-09, CORRIGÉ) : `src/worker/client.ts::loadDataset` n'envoie plus le lot
    // colonnaire en `Transferable` — il part par copie structurée, l'hôte garde ses tampons.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-09',
      'EX-SCR-142',
      'l’en-tête annonce « 0 % particuliers » sur 1 352 annonces : la colonne sellerType est lue sur le lot détaché, tous les codes ressortent inconnus (cf. E2E-02)',
    );

    await open(page, P2_PATH);
    const line = await page.locator('.kycar-stat-header .kycar-stat-line').nth(1).innerText();
    mesure(testInfo, 'P2 — ligne 2 de l’en-tête écran B', line.replace(/\n/g, ' | '));
    const share = /(\d+)\s*%\s*particuliers/.exec(line);
    expect(share, `part de particuliers introuvable dans « ${line} »`).not.toBeNull();
    expect(Number(share?.[1])).toBeGreaterThan(0);
  });

  test('CONSTAT E2E-10 — l’export « Annonces du périmètre (CSV) » de l’écran B ne produit aucun fichier (EX-CRUD-16)', async ({
    page,
  }, testInfo) => {
    // D8-01/D8-26 (CONSTAT E2E-10, CORRIGÉ) : `src/worker/client.ts::loadDataset` n'envoie plus le lot
    // colonnaire en `Transferable` — il part par copie structurée, l'hôte garde ses tampons.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-10',
      'EX-CRUD-16',
      'le bouton « Annonces du périmètre (CSV) » lève « detached ArrayBuffer » dans buildListingRow : aucun téléchargement n’est déclenché et l’erreur n’est pas dite à l’utilisateur (cf. E2E-02)',
    );

    await open(page, `${P2_PATH}${P2_YEAR_QUERY}`);
    await page.locator('.kycar-stat-export').getByRole('button', { name: 'Exporter' }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      page.getByRole('button', { name: 'Annonces du périmètre (CSV)' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
  /* ==============================================================================================
   * Vague F3 (`D8-31`) — comportements visibles ouverts par le câblage de la coquille.
   * ============================================================================================ */

  test('EX-SCR-174 / EX-SCR-26 — sélection vide : en-tête « aucune offre », graphes RETIRÉS, suggestions de retrait chiffrées', async ({
    page,
  }, testInfo) => {
    await open(page, `${P2_PATH}${P2_EMPTY_QUERY}`);

    // L'en-tête statistique reste affiché, mais ne rend AUCUN chiffre hérité du périmètre précédent.
    const header = await page.locator('.kycar-stat-header').innerText();
    mesure(testInfo, 'EX-SCR-174 — en-tête à effectif nul', header.replace(/\n/g, ' · '));
    expect(header).toContain('aucune offre');
    expect(header).not.toMatch(/\d\s*offres/);
    expect(header).toContain('médiane —');

    // `EX-SCR-174` : les graphes sortent du DOM — un graphe vide ferait croire à une distribution plate.
    expect(await page.locator('#kycar-main figure').count()).toBe(0);

    const block = page.locator('.kycar-screen-b-empty');
    await expect(block).toBeVisible();
    const blockText = await block.innerText();
    mesure(testInfo, 'EX-SCR-26 — bloc ET-VIDE-FILTRES de l’écran B', blockText.replace(/\n+/g, ' · '));
    expect(blockText).toContain('Aucune offre ne correspond');
    // Le compte est celui du BANDEAU (`countActiveFilters`) : un intervalle compte ses deux bornes.
    expect(blockText).toMatch(/2 filtres actifs restreignent la recherche\./);

    // `EX-SCR-26` — la suggestion porte un GAIN, et ce gain est celui qu'on observe en la suivant.
    const suggestion = block.getByRole('button', { name: /^retirer « / });
    await expect(suggestion).toHaveCount(1);
    const label = await suggestion.innerText();
    const promised = parseInteger(/:\s*([\d\s\u00A0\u202F]+)\s*offres de plus/.exec(label)?.[1] ?? '');
    expect(promised).toBe(P2_EXPECTED.corsaTotal);

    await suggestion.click();
    // Le retrait relance un recalcul : on attend que l'état `ET-VIDE-FILTRES` soit LEVÉ avant de
    // lire l'effectif (sur une sélection vide, l'en-tête n'affiche aucun nombre — c'est le sujet
    // même d'`EX-SCR-174`, pas une valeur à sonder).
    await expect(block).toHaveCount(0, { timeout: 20_000 });
    await waitForDistribution(page);
    expect(await readSelectionCount(page)).toBe(promised);
    // Le retrait emporte les DEUX bornes de l'intervalle (`removalPatchFor`), et rien d'autre.
    expect(new URL(page.url()).search).toBe('');
    expect(new URL(page.url()).pathname).toBe(P2_PATH);
  });

  test('EX-SCR-26 — « Réinitialiser tous les filtres » vide la requête sans quitter le modèle', async ({
    page,
  }) => {
    await open(page, `${P2_PATH}${P2_EMPTY_QUERY}`);
    const block = page.locator('.kycar-screen-b-empty');
    await block.getByRole('button', { name: 'Réinitialiser tous les filtres' }).click();
    await expect(block).toHaveCount(0, { timeout: 20_000 });
    await waitForDistribution(page);
    // La route mode 2 EST le périmètre (`EX-NAV-2`) : elle survit à la réinitialisation.
    expect(new URL(page.url()).pathname).toBe(P2_PATH);
    expect(new URL(page.url()).search).toBe('');
    expect(await readSelectionCount(page)).toBe(P2_EXPECTED.corsaTotal);
  });

  test('EX-SCR-17 — la bascule d’échelle log de l’axe des prix existe sur G7, et sur lui seul', async ({
    page,
  }, testInfo) => {
    await open(page, P2_PATH);
    const g7 = page.locator('[data-graph="G7"]');
    await expect(g7).toHaveCount(1);

    const toggle = g7.getByRole('button', { name: 'Échelle log de l’axe des prix' });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(g7.locator('svg[data-price-scale]')).toHaveAttribute('data-price-scale', 'linear');

    // La bascule DÉPLACE réellement les cellules : un drapeau décoratif ne passerait pas.
    const before = await g7.locator('svg[data-price-scale] rect[data-price-lower]').first().getAttribute('y');
    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(g7.locator('svg[data-price-scale]')).toHaveAttribute('data-price-scale', 'log');
    const after = await g7.locator('svg[data-price-scale] rect[data-price-lower]').first().getAttribute('y');
    mesure(testInfo, 'EX-SCR-17 — ordonnée de la première cellule G7', `linéaire ${before} → log ${after}`);
    expect(after).not.toBe(before);

    // `EX-SCR-16` — l'état est mémorisé PAR GRAPHE dans l'URL, en `replace` (aucune entrée d'historique).
    expect(new URL(page.url()).search).toBe('?g7log=1');
    // Aucun autre graphe ne bascule : `g1log` reste absent et G4 n'offre aucune bascule log.
    expect(await page.locator('[data-graph="G4"]').getByRole('button', { name: /Échelle log/ }).count()).toBe(0);

    // Rouverte, l'URL rend le MÊME état (`EX-NAV-18`).
    await open(page, `${P2_PATH}?g7log=1`);
    await expect(
      page.locator('[data-graph="G7"]').getByRole('button', { name: 'Échelle log de l’axe des prix' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('EX-SRCH-14 — changer de marque en mode 2 vide le modèle et redirige vers l’écran A', async ({
    page,
  }, testInfo) => {
    await open(page, `${P2_PATH}?priceto=20000`);

    // `EX-SCR-103` — le seul sélecteur de marque atteignable en mode 2 est le contrôle
    // `Marque / Modèle` du bandeau, qui ouvre l'écran `G`. En régime COMPACT (`EX-SCR-97`), la
    // ligne primaire ne vit que dans la feuille plein écran : le MÊME parcours passe par elle.
    await openFilterSheet(page, regimeOf(testInfo) === 'compact');
    await page.locator('.kycar-filter-band .kycar-control--structured-picker button').first().click();
    const dialog = page.getByRole('dialog', { name: 'Sélectionner marque et modèle' });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder('Rechercher…').fill('Volkswagen');
    await dialog.locator('[role="option"]').first().click();
    await dialog.getByRole('button', { name: 'Appliquer' }).click();

    await waitForMarket(page);
    const url = new URL(page.url());
    mesure(testInfo, 'EX-SRCH-14 — URL après changement de marque depuis l’écran B', `${url.pathname}${url.search}`);
    // Plus aucun segment de modèle dans le chemin : l'utilisateur revient à « marque choisie,
    // modèle à choisir ». La forme canonique de `mmmv` est la forme COURTE (`74`), qui est la même
    // valeur que `74|||` (cf. fix-state-2 §2.3, hypothèse E4 ratifiée par la sonde R-D5-2.8-03).
    expect(url.pathname).toBe('/marche');
    expect(url.searchParams.get('mmmv')).toBe('74');
    // Les autres filtres posés sont CONSERVÉS (`EX-NAV-17`).
    expect(url.searchParams.get('priceto')).toBe('20000');
  });
});
