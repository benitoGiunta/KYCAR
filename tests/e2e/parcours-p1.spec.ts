/**
 * KYCAR — Parcours cible 1 (mode 1), recette navigateur (PLAN-2 §2.9a, `docs/00-CONTEXT.md`)
 * =================================================================================================
 * « Je cherche une voiture d'occasion avec un budget de 20 000 €, une carrosserie coupé, en
 *   Belgique, moins de 100 000 km — montre-moi ce que le marché propose. »
 *
 * Le parcours est joué SUR LE BUILD DE PRODUCTION servi par `vite preview`, avec le câblage réel
 * (provider synthétique 100 000 annonces + Web Worker d'agrégation). Les filtres sont posés par le
 * BANDEAU RÉEL, pas par une URL fabriquée, sauf là où l'exigence l'interdit (`cy`, `EX-SRCH-18bis`).
 *
 * Vérité terrain des effectifs : `tests/review/D8/parcours.test.ts` (2 656 offres / 112 marques).
 */
import { test, expect, type Page } from '@playwright/test';

import {
  P1_QUERY,
  derived,
  DENSE_QUERY,
  applyFilterSheet,
  constat,
  mesure,
  open,
  openFilterSheet,
  parseInteger,
  readCardCounts,
  readCardTitles,
  readMarketSummary,
  regimeOf,
  stripSpaces,
  waitForMarket,
} from './_helpers';

/** Ouvre l'écran A vierge et attend le premier affichage utile. */
async function openMarket(page: import('@playwright/test').Page, query = ''): Promise<void> {
  await open(page, `/marche${query}`);
}

/**
 * `EX-SCR-97` (D8-15) — coche « Berline » là où le régime courant place le contrôle : directement
 * dans la ligne primaire en `large`/`intermédiaire`, dans la FEUILLE plein écran à application
 * différée en `compact`. Le fait exercé (ajouter une carrosserie au filtre `body`) est identique.
 */
async function checkBerline(page: Page, compact: boolean): Promise<void> {
  await openFilterSheet(page, compact);
  await page.getByLabel('Berline', { exact: true }).check();
  await applyFilterSheet(page, compact);
  await page.waitForFunction(() => window.location.search.includes('body=3,6'), null, { timeout: 20_000 });
}

test.describe('Parcours 1 — mode 1, survol du marché filtré', () => {
  test('premier affichage : agrégats de base, bandeau C3 de couverture et amorce de filtres (EX-SCR-106/EX-SCR-113)', async ({
    page,
  }, testInfo) => {
    await openMarket(page);

    const summary = await readMarketSummary(page);
    // `D3-24` — attendus DÉRIVÉS des fixtures servies, jamais figés : la barre de synthèse sans
    // filtre annonce exactement les annonces INGÉRÉES du snapshot le plus récent du profil.
    const attendu = await derived();
    expect(summary.offers).toBe(attendu.listingCount);
    expect(summary.makes).toBe(attendu.unfiltered.makes);

    // `EX-SCR-113` — bandeau C3 de couverture d'échantillon, toujours présent sur l'écran A.
    await expect(page.locator('.summary-bar-c3')).toContainText(/couverture/i);

    // Amorce (`EX-SCR-118`) : les quatre raccourcis de pose de filtre sont offerts.
    for (const label of ['Budget ≤ 10 000 €', 'Budget ≤ 20 000 €', 'Moins de 100 000 km', 'Immatriculées depuis 2020']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }

    mesure(testInfo, 'P1 — barre de synthèse au premier affichage', summary.raw.replace(/\n/g, ' '));
  });

  test('pose des quatre filtres du parcours par le bandeau réel : URL canonique et effectif affiché (EX-NAV-9, EX-SCR-106)', async ({
    page,
  }, testInfo) => {
    await openMarket(page);

    // D8-15/D-31 : depuis que la coquille fournit `regime`, le régime COMPACT d'`EX-SCR-97` est
    // réellement atteignable — sous 768 px les contrôles vivent dans une FEUILLE plein écran à
    // application DIFFÉRÉE (« Appliquer »), et l'URL ne bouge qu'à l'application. Le parcours
    // mesuré (les trois filtres posés, l'URL canonique, l'effectif affiché) est identique ; seul le
    // chemin d'interaction suit l'exigence.
    const compact = regimeOf(testInfo) === 'compact';
    await openFilterSheet(page, compact);

    // (1) budget ≤ 20 000 € — saisie libre dans la borne haute du couple `EX-SCR-67`.
    await page.locator('.kycar-primary-line').getByLabel('Prix à', { exact: true }).fill('20000');
    if (!compact) {
      await page.waitForFunction(() => window.location.search.includes('priceto=20000'), null, { timeout: 20_000 });
    }

    // (2) kilométrage ≤ 100 000 km.
    await page.locator('.kycar-primary-line').getByLabel('Kilométrage à', { exact: true }).fill('100000');
    if (!compact) {
      await page.waitForFunction(() => window.location.search.includes('kmto=100000'), null, { timeout: 20_000 });
    }

    // (3) carrosserie coupé — case à cocher du groupe primaire `Carrosserie`.
    await page.getByLabel('Coupé', { exact: true }).check();
    // `EX-SCR-97` — application DIFFÉRÉE en compact : rien n'est posé avant ce clic.
    await applyFilterSheet(page, compact);
    await page.waitForFunction(() => window.location.search.includes('body=3'), null, { timeout: 20_000 });

    // (4) pays BE : `EX-SRCH-18bis` interdit d'en faire un filtre utilisateur — le périmètre belge
    //     est celui du snapshot, attesté par son identifiant, et `cy` n'est JAMAIS dans l'URL.
    // D8-14/FV-17/D-31 : `EX-SCR-43` demande un jeton COURT `Snapshot <JJ/MM>` et renvoie le détail
    // (identifiant, âge, fraîcheur) en INFOBULLE — l'identifiant complet ne figure plus dans le
    // texte visible du jeton. Le fait mesuré ici (le périmètre belge est attesté par l'identifiant
    // du snapshot servi, et `cy` n'est jamais dans l'URL) est inchangé : il se lit désormais sur
    // l'attribut `title`, à l'endroit exact où l'exigence l'a déplacé.
    await expect(page.locator('.kycar-snapshot-token')).toHaveAttribute('title', /snapshot du /i);
    await expect(page.locator('.kycar-snapshot-token')).toContainText(/^Snapshot \d{2}\/\d{2}$/);
    expect(await page.locator(String.raw`.kycar-footer-diagnostic dd`).nth(2).textContent()).toMatch(/be-/i);
    expect(page.url()).not.toContain('cy=');

    // `EX-NAV-9` — ordre canonique alphabétique par nom de paramètre.
    expect(new URL(page.url()).search).toBe(P1_QUERY);

    await waitForMarket(page);
    const summary = await readMarketSummary(page);
    const attendu = (await derived()).p1;
    expect(summary.offers).toBe(attendu.offers);
    expect(summary.makes).toBe(attendu.makes);

    // `EX-SCR-75` — chaque filtre actif est affiché AVEC sa valeur dans son jeton.
    const tokens = page.locator('.kycar-filter-band');
    await expect(tokens).toContainText('Prix : ≤ 20 000 €');
    await expect(tokens).toContainText('Kilométrage : ≤ 100 000 km');
    await expect(tokens).toContainText('Carrosserie : Coupé');
    await expect(tokens).toHaveAttribute('data-active-count', '3');
  });

  test('cartes-marques et zones-modèles : fourchette étiquetée « fourchette centrale » (EX-SCR-107/EX-SCR-118)', async ({
    page,
  }) => {
    await openMarket(page, P1_QUERY);

    const counts = await readCardCounts(page);
    expect(counts.length).toBeGreaterThan(0);
    // Tri par défaut : nombre d'offres décroissant (`EX-SCR-106`).
    for (let i = 1; i < counts.length; i += 1) expect(counts[i - 1]).toBeGreaterThanOrEqual(counts[i] as number);
    // La somme des cartes affichées ne peut dépasser l'effectif filtré total.
    const summary = await readMarketSummary(page);
    expect(counts.reduce((s, n) => s + n, 0)).toBeLessThanOrEqual(summary.offers);

    // `EX-SCR-33`/`114` (`D8-06`, `FV-09`) — la légende de la fourchette SUIT l'effectif : sous
    // `n = 12` elle devient « fourchette observée (min – max, effectif réduit) ». Au profil `test`
    // le parcours 1 est étroit (quelques dizaines d'offres réparties sur autant de marques), donc
    // c'est la branche RÉDUITE que l'écran doit rendre ici — l'exiger « centrale » reviendrait à
    // exiger que l'application mente sur un effectif de 6.
    const firstCard = page.locator('.kycar-market-card').first();
    await expect(firstCard).toContainText(/fourchette (centrale|observée)/);

    // Dépliage : les zones-modèles arrivent et portent elles aussi l'étiquette normative.
    await firstCard.locator('.kycar-market-card-header').click();
    const zones = firstCard.locator('.kycar-market-zone-list');
    await expect(zones).toContainText(/fourchette (centrale|observée)/, { timeout: 30_000 });
  });

  test('la fourchette centrale (90 % des offres) est étiquetée telle quelle dès que l’effectif la porte (EX-SCR-118)', async ({
    page,
  }) => {
    // Branche DENSE du même contrat : une sélection large (`DENSE_QUERY`) place la première carte
    // très au-dessus de `n = 12`, et la légende doit alors être exactement celle d'`EX-SCR-118`.
    await openMarket(page, DENSE_QUERY);
    const firstCard = page.locator('.kycar-market-card').first();
    await expect(firstCard.getByText('fourchette centrale (90 % des offres)').first()).toBeVisible();

    await firstCard.locator('.kycar-market-card-header').click();
    const zones = firstCard.locator('.kycar-market-zone-list');
    await expect(zones.getByText('fourchette centrale (90 % des offres)').first()).toBeVisible({ timeout: 30_000 });
  });

  test('tri des cartes-marques : alphabétique puis inversion du sens (EX-SCR-106)', async ({ page }, testInfo) => {
    await openMarket(page, P1_QUERY);
    const regime = regimeOf(testInfo);

    if (regime === 'compact') {
      // `EX-SCR-135` — en compact, le tri est une feuille dépliable, pas une liste déroulante.
      await page.locator('.kycar-sort-sheet-trigger').click();
      await page.getByRole('option', { name: 'Alphabétique' }).click();
    } else {
      await page.locator('.kycar-market-sort-controls select').selectOption('alpha');
    }

    // Le bouton d'inversion annonce l'action à venir : « Trier en ordre croissant » ⇒ le sens
    // COURANT est décroissant, et réciproquement (`SummaryBar`, `EX-SCR-106`).
    const toggle = page.getByRole('button', { name: /Trier en ordre (dé)?croissant/ });
    const firstLabel = await toggle.getAttribute('aria-label');
    const firstDirection = firstLabel === 'Trier en ordre croissant' ? 'desc' : 'asc';
    const byDirection = (dir: 'asc' | 'desc') => (a: string, b: string) =>
      dir === 'asc' ? a.localeCompare(b, 'fr-BE') : b.localeCompare(a, 'fr-BE');

    await expect.poll(async () => (await readCardTitles(page)).length, { timeout: 30_000 }).toBeGreaterThan(1);
    const first = await readCardTitles(page);
    expect(first).toEqual([...first].sort(byDirection(firstDirection)));

    // Inversion du sens : l'ordre alphabétique bascule. Le JEU de marques montées change
    // légitimement — seules les `n` premières cartes de l'ordre courant sont montées (`EX-SCR-127`).
    await toggle.click();
    await expect.poll(async () => (await readCardTitles(page))[0], { timeout: 30_000 }).not.toBe(first[0]);
    const second = await readCardTitles(page);
    expect(second).toEqual([...second].sort(byDirection(firstDirection === 'asc' ? 'desc' : 'asc')));
    expect(second.length).toBe(first.length);
  });

  test('export CSV des agrégats affichés : téléchargement réel, en-tête normatif, aucun champ R3 (EX-CRUD-14/15, EX-DATA-123bis)', async ({
    page,
  }, testInfo) => {
    await openMarket(page, P1_QUERY);
    // Une zone-modèle doit exister pour que l'export porte des lignes (`EX-CRUD-15`).
    await page.locator('.kycar-market-card-header').first().click();
    // La pré-condition est qu'une zone-modèle SOIT MONTÉE (l'export porte alors des lignes) : la
    // LÉGENDE de sa fourchette dépend de l'effectif (`EX-SCR-33`) et n'est pas le sujet ici.
    await expect(page.locator('.kycar-market-zone-list').first()).toContainText(/fourchette (centrale|observée)/, {
      timeout: 30_000,
    });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.locator('.kycar-market-sort-controls').getByRole('button', { name: 'Exporter' }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^kycar_agregats-mode1_.+\.csv$/);
    const stream = await download.createReadStream();
    let csv = '';
    for await (const chunk of stream) csv += String(chunk);

    const lines = csv.split(/\r?\n/);
    // `EX-CRUD-14` : UTF-8 AVEC BOM (U+FEFF), pour qu'un tableur francophone ouvre le fichier droit.
    expect(lines[0]).toMatch(/^\uFEFF# snapshot;/);
    expect(lines[1]).toMatch(/^# filtres;/);
    expect(stripSpaces(lines[1] ?? '')).toContain('body=3');
    expect(lines[2]).toMatch(/^# couverture;/);
    // `EX-DATA-123bis` — en-tête de colonnes exact, et AUCUNE colonne vendeur (garde R3).
    expect(lines[3]).toBe(
      'marque;modele;offres;prix_median;prix_p5;prix_p95;prix_min;prix_max;annee_min;annee_max;km_min;km_max;n_prix;n_annee;n_km',
    );
    expect(lines[3]).not.toMatch(/vendeur|seller|contact|telephone|e-?mail|adresse/i);
    expect(lines.length).toBeGreaterThan(4);
    mesure(testInfo, 'P1 — export CSV', `${download.suggestedFilename()}, ${lines.length - 4} lignes de données`);
  });

  test('changement de filtre R : recalcul sans rechargement de page (EX-NFR-2, EX-NAV-12)', async ({ page }, testInfo) => {
    await openMarket(page, P1_QUERY);
    // Témoin de session : il ne survit pas à un rechargement de document.
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__kycarE2E = 'vivant';
    });
    const before = await readMarketSummary(page);

    await checkBerline(page, regimeOf(testInfo) === 'compact');
    await expect.poll(async () => (await readMarketSummary(page)).offers, { timeout: 30_000 }).not.toBe(before.offers);

    const after = await readMarketSummary(page);
    expect(after.offers).toBeGreaterThan(before.offers);
    expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__kycarE2E)).toBe('vivant');
  });

  test('retour arrière : une entrée d’historique par changement appliqué, état restauré (EX-NAV-12/13)', async ({
    page,
  }, testInfo) => {
    await openMarket(page, P1_QUERY);
    const filtered = await readMarketSummary(page);

    await checkBerline(page, regimeOf(testInfo) === 'compact');
    await expect.poll(async () => (await readMarketSummary(page)).offers, { timeout: 30_000 }).not.toBe(filtered.offers);

    await page.goBack();
    await expect.poll(() => new URL(page.url()).search, { timeout: 20_000 }).toBe(P1_QUERY);
    await waitForMarket(page);
    await expect.poll(async () => (await readMarketSummary(page)).offers, { timeout: 30_000 }).toBe(filtered.offers);
    expect((await readMarketSummary(page)).makes).toBe((await derived()).p1.makes);
  });

  test('CONSTAT E2E-04 — le cardinal « modèles » de la barre de synthèse vaut 0 alors que la population filtrée en compte (EX-SCR-106)', async ({
    page,
  }, testInfo) => {
    // D8-02/D8-26 (CORRIGÉ) : `DataController.loadAllModels` charge les agrégats MODÈLE de tout le
    // marché filtré en un aller de portée marché, et la coquille les fusionne juste après
    // `loadMarket` — le cardinal « modèles » et les zones-modèles n'attendent plus un clic.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-04',
      'EX-SCR-106',
      'la barre de synthèse affiche « 0 modèles » tant qu’aucune carte n’est dépliée, alors que les trois cardinaux doivent être ceux de la population filtrée',
    );
    // D-31 : le cardinal des MODÈLES est un enrichissement PROGRESSIF, rendu à la boucle
    // d'inactivité pour ne pas disputer le thread principal à la peinture des cartes (`EX-NFR-9`,
    // budget 2 000 ms) : il est donc attendu par `expect.poll`, comme l'effectif ci-dessous. Le fait
    // mesuré — les trois cardinaux sont ceux de la population filtrée, jamais un `0` — est intact.
    test.skip(regimeOf(testInfo) === 'compact', 'le cardinal « modèles » est absent par contrat en régime compact (EX-SCR-135)');

    await openMarket(page, P1_QUERY);
    expect((await readMarketSummary(page)).offers).toBe((await derived()).p1.offers);
    // La population filtrée compte des modèles : le cardinal ne peut valoir 0.
    await expect
      .poll(async () => (await readMarketSummary(page)).models ?? 0, { timeout: 30_000 })
      .toBeGreaterThan(0);
  });

  test('CONSTAT E2E-05 — le résumé de carte-marque annonce « 0 modèles » avant dépliage (EX-SCR-107 ligne 1)', async ({
    page,
  }, testInfo) => {
    // D8-02/D8-26 (CORRIGÉ) : `DataController.loadAllModels` charge les agrégats MODÈLE de tout le
    // marché filtré en un aller de portée marché, et la coquille les fusionne juste après
    // `loadMarket` — le cardinal « modèles » et les zones-modèles n'attendent plus un clic.
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-05',
      'EX-SCR-107',
      'la ligne 1 du résumé de carte affiche « 0 modèles · médiane <prix> » avant dépliage, au lieu du cardinal réel ou du repli « — » d’EX-SCR-132',
    );

    await openMarket(page, P1_QUERY);
    const firstSummary = await page.locator('.kycar-market-card-summary').first().innerText();
    expect(parseInteger(firstSummary)).toBeGreaterThan(0);
  });

  /**
   * `ACC-05` / `D8-42` (`EX-SCR-106`, `EX-SCR-132`, `D8-02` : « jamais 0 par défaut, — tant que la
   * donnée manque »). La recette 2.9b a mesuré « 0 modèles » pendant 486 à 691 ms avant le cardinal
   * réel, à chaque chargement : le test `E2E-04` ci-dessus l'attend par `expect.poll` et ne voyait
   * donc pas la valeur transitoire. Ici, un `MutationObserver` posé AVANT la navigation enregistre
   * TOUS les textes successifs de la barre : aucun ne doit annoncer un cardinal à zéro.
   */
  test('ACC-05 — la barre de synthèse n’affiche jamais « 0 modèles » avant le cardinal réel (EX-SCR-106)', async ({
    page,
  }, testInfo) => {
    test.skip(regimeOf(testInfo) === 'compact', 'le cardinal « modèles » est absent par contrat en régime compact (EX-SCR-135)');

    // Échantillonnage à CHAQUE image (`requestAnimationFrame`), posé avant tout script de la page :
    // une valeur transitoire de 486 à 691 ms (mesure de la recette) laisse ~30 à 40 échantillons.
    // Les répétitions consécutives sont écartées : seuls les CHANGEMENTS de texte sont conservés.
    await page.addInitScript(() => {
      const w = window as unknown as { __kycarSummarySamples?: string[] };
      const samples: string[] = [];
      w.__kycarSummarySamples = samples;
      const sample = (): void => {
        const el = document.querySelector('.kycar-market-summary-counts');
        const text = el === null ? null : (el.textContent ?? '');
        if (text !== null && text !== samples[samples.length - 1] && samples.length < 2_000) samples.push(text);
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });

    await openMarket(page, P1_QUERY);
    // Fenêtre d'observation couvrant largement le chargement des agrégats MODÈLE (~0,5 à 0,7 s).
    await expect
      .poll(async () => (await readMarketSummary(page)).models ?? 0, { timeout: 30_000 })
      .toBeGreaterThan(0);
    await page.waitForTimeout(1_500);

    const samples = await page.evaluate(
      () => (window as unknown as { __kycarSummarySamples?: string[] }).__kycarSummarySamples ?? [],
    );
    const zeros = samples.filter((s) => /(^|\D)0\s?modèles?/u.test(s.replace(/[\u202f\u00a0]/gu, ' ')));
    mesure(testInfo, 'ACC-05 — échantillons de la barre de synthèse', `${samples.length} rendus, ${zeros.length} à « 0 modèles »`);
    expect(samples.length).toBeGreaterThan(0);
    expect(zeros).toEqual([]);
  });

  /**
   * `ACC-15` / `D8-42` (`EX-SCR-1`..`4`, `EX-SCR-106`) — « 1 marques · 69 modèles · 280 offres » :
   * le pluriel n'était pas accordé quand une seule marque est retenue.
   */
  test('ACC-15 — les cardinaux de la barre de synthèse s’accordent en nombre (EX-SCR-106)', async ({ page }, testInfo) => {
    await openMarket(page, '?mmmv=74');
    const summary = await readMarketSummary(page);
    mesure(testInfo, 'ACC-15 — barre de synthèse à une seule marque', summary.raw.replace(/\n/g, ' '));
    expect(summary.makes).toBe(1);
    expect(summary.raw).not.toMatch(/\b1 marques\b/u);
    expect(summary.raw).toMatch(/\b1 marque\b/u);
    if (summary.models !== null && summary.models === 1) expect(summary.raw).not.toMatch(/\b1 modèles\b/u);
    if (summary.offers === 1) expect(summary.raw).not.toMatch(/\b1 offres\b/u);
  });
});
