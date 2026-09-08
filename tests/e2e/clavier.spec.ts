/**
 * KYCAR — Navigation au clavier et prise de focus (PLAN-2 §2.9a, `EX-NFR-12`/`14`)
 * =================================================================================================
 * `EX-NFR-14` : 100 % des contrôles du bandeau de filtres et des actions d'écran atteignables et
 * actionnables au clavier seul, ORDRE DE TABULATION correspondant à l'ordre visuel, indicateur de
 * focus visible en permanence (jamais supprimé par CSS).
 * `EX-NFR-12`/`DR-101` : lien d'évitement en premier arrêt, titre de document par vue, prise de
 * focus après navigation.
 * `EX-SCR-216` : les six arrêts de l'écran G, `Échap` qui ferme sans appliquer, piège de focus.
 *
 * Rien de tout cela n'est vérifiable hors navigateur : `:focus-visible`, l'ordre de tabulation réel
 * et `document.activeElement` n'existent que dans un moteur de rendu.
 */
import { test, expect, type Page } from '@playwright/test';

import {
  FOCUSABLE_SELECTOR,
  SURFACES,
  constat,
  firstTabbableDescription,
  focusDescription,
  focusFirstTabbable,
  mesure,
  open,
  waitForMarket,
} from './_helpers';

/** Marque les éléments focalisables d'une région dans l'ordre du DOM (= ordre visuel attendu). */
async function markFocusables(page: Page, root: string): Promise<number> {
  return page.evaluate(
    ({ rootSelector, focusableSelector }) => {
      const container = document.querySelector(rootSelector);
      if (container === null) return 0;
      let i = 0;
      for (const el of container.querySelectorAll<HTMLElement>(focusableSelector)) {
        el.setAttribute('data-e2e-tab', String(i));
        i += 1;
      }
      return i;
    },
    { rootSelector: root, focusableSelector: FOCUSABLE_SELECTOR },
  );
}

/** Tabule `steps` fois et retourne, dans l'ordre, les index marqués effectivement atteints. */
async function collectMarkedTabOrder(page: Page, steps: number): Promise<number[]> {
  const seen: number[] = [];
  for (let i = 0; i < steps; i += 1) {
    await page.keyboard.press('Tab');
    const mark = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute('data-e2e-tab') ?? null);
    if (mark !== null) seen.push(Number(mark));
  }
  return seen;
}

test.describe('EX-NFR-12 / EX-NFR-14 — clavier, focus et titres', () => {
  test('le lien d’évitement est le premier arrêt de tabulation et mène au contenu principal (EX-NFR-12)', async ({
    page,
  }) => {
    await open(page, SURFACES.A);

    // Le lien d'évitement est le PREMIER élément tabulable du document — c'est la propriété que
    // l'exigence demande, et elle se lit dans le DOM sans dépendre du point de départ de tabulation
    // que Chromium conserve après la prise de focus programmatique de la coquille.
    expect(await firstTabbableDescription(page)).toContain('Aller au contenu principal');

    // Vérification dynamique : depuis le deuxième arrêt, un Maj+Tab revient sur le lien d'évitement.
    await page.locator('.kycar-brand').focus();
    await page.keyboard.press('Shift+Tab');

    const skip = page.locator('.kycar-skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await expect(skip).toHaveText('Aller au contenu principal');
    await expect(skip).toHaveAttribute('href', '#kycar-main');

    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => window.location.hash), { timeout: 10_000 }).toBe('#kycar-main');
  });

  test('l’indicateur de focus reste visible sur un contrôle atteint au clavier (EX-NFR-14)', async ({ page }) => {
    await open(page, SURFACES.A);
    await focusFirstTabbable(page); // lien d'évitement
    await page.keyboard.press('Tab'); // marque KYCAR : premier contrôle « ordinaire »

    const ring = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (el === null) return null;
      const style = window.getComputedStyle(el);
      return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
    });
    expect(ring).not.toBeNull();
    expect(ring?.style).not.toBe('none');
    expect(Number.parseFloat(ring?.width ?? '0')).toBeGreaterThanOrEqual(1);
  });

  test('tous les contrôles de la ligne primaire du bandeau sont atteints au clavier, dans l’ordre du DOM (EX-NFR-14)', async ({
    page,
  }, testInfo) => {
    await open(page, SURFACES.A);
    const total = await markFocusables(page, '.kycar-primary-line');
    expect(total).toBeGreaterThan(10);

    // On repart du début du document : le parcours traverse en-tête puis bandeau.
    await focusFirstTabbable(page);
    const seen = await collectMarkedTabOrder(page, total + 30);

    mesure(testInfo, 'clavier — contrôles de la ligne primaire', `${seen.length} atteints sur ${total}`);
    // Aucun contrôle sauté : les index atteints couvrent l'intégralité de la région…
    expect(new Set(seen).size).toBe(total);
    // …et ils sont atteints dans l'ordre du DOM, qui est l'ordre visuel de la ligne primaire.
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });

  test('écran G : ouverture au clavier, focus initial, piège de focus et fermeture par Échap (EX-SCR-216, EX-NFR-14)', async ({
    page,
  }, testInfo) => {
    await open(page, SURFACES.A);
    await waitForMarket(page);

    const trigger = page.getByRole('button', { name: 'Choisir une marque et un modèle' });
    await trigger.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Sélectionner marque et modèle' });
    await expect(dialog).toBeVisible();

    // Au montage, le focus va au champ de recherche marque (`EX-SCR-216`).
    await expect
      .poll(() => page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute('data-screen-g-stop') ?? null), {
        timeout: 10_000,
      })
      .toBe('search-make');

    // Piège de focus : douze tabulations ne sortent JAMAIS de la modale, et ne visitent que les
    // six arrêts déclarés.
    const stops: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        const modal = document.querySelector('.kycar-screen-g');
        return {
          contained: el !== null && modal !== null && modal.contains(el),
          stop: el?.getAttribute('data-screen-g-stop') ?? null,
        };
      });
      expect(inside.contained, `tabulation ${i + 1} sortie de la modale`).toBe(true);
      if (inside.stop !== null) stops.push(inside.stop);
    }
    mesure(testInfo, 'clavier — arrêts visités dans l’écran G', [...new Set(stops)].join(', '));
    expect(new Set(stops).size).toBeGreaterThanOrEqual(4);

    // `Échap` ferme sans appliquer : ni sélection posée, ni URL modifiée.
    const before = page.url();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(page.url()).toBe(before);
  });

  test('CONSTAT E2E-14 — à la fermeture de l’écran G le focus n’est pas rendu au contrôle appelant (EX-SCR-216, WCAG 2.4.3)', async ({
    page,
  }, testInfo) => {
    // D8-26 (CORRIGÉ par fix-state) : `ScreenG` mémorise l'élément déclencheur à l'ouverture et
    // le refocalise au démontage. `test.fail()` retiré après rejeu VERT (D8-17).
    constat(
      testInfo,
      'E2E-14',
      'EX-SCR-216/EX-NFR-14',
      'après Échap (ou « Annuler ») le focus retombe sur <body> au lieu de revenir au bouton qui a ouvert la modale : la restitution est explicitement laissée « à l’appelant » par src/components/filters/ScreenG.tsx et aucun appelant (MarketScreen, FilterBand) ne l’implémente — l’utilisateur au clavier repart du début du document',
    );

    await open(page, SURFACES.A);
    await waitForMarket(page);
    const trigger = page.getByRole('button', { name: 'Choisir une marque et un modèle' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Sélectionner marque et modèle' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Sélectionner marque et modèle' })).toBeHidden();

    mesure(testInfo, 'clavier — focus après fermeture de l’écran G', await focusDescription(page));
    await expect(trigger).toBeFocused();
  });

  test('document.title nomme la vue courante, route par route (EX-NFR-14, DR-101)', async ({ page }) => {
    for (const [path, title] of [
      [SURFACES.A, 'KYCAR — Survol du marché'],
      [SURFACES.B, 'KYCAR — Distribution d’un modèle · Opel Corsa'],
      [SURFACES.C, 'KYCAR — Comparer des modèles'],
      [SURFACES.E, 'KYCAR — Recherches enregistrées'],
      [SURFACES.F, 'KYCAR — Modèles suivis'],
      [SURFACES.mentions, 'KYCAR — Mentions légales'],
    ] as const) {
      await open(page, path);
      await expect(page).toHaveTitle(title);
    }
    // L'écran D est nommé même quand son contenu ne rend pas (cf. E2E-01).
    await page.goto(SURFACES.D, { waitUntil: 'commit' });
    await expect(page).toHaveTitle('KYCAR — Annonces du modèle · Opel Corsa', { timeout: 60_000 });
    // Route inconnue : titre et écran d'erreur nommés.
    await page.goto('/route-inexistante', { waitUntil: 'commit' });
    await expect(page).toHaveTitle('KYCAR — Page introuvable', { timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
  });

  // D8-14/D8-17 (E2E-15, CORRIGÉ) : ce test supposait l'écran A « sans titre » — c'était exactement
  // la lacune qu'E2E-15 a comblée (`MarketScreen.tsx` porte désormais un `h1`). Il n'existe donc plus
  // AUCUNE vue sans titre pour exercer ce scénario : l'écran A rejoint maintenant les sept autres
  // vues sous le défaut DÉJÀ catalogué par E2E-16 ci-dessous (`heading.focus()` sur un `h1` sans
  // `tabindex`, sans effet) — ce n'est pas une régression neuve, c'est l'élargissement attendu du
  // périmètre d'E2E-16 à la vue qui y échappait seule jusqu'ici. `test.fail()` documente ce report,
  // à corriger par fix-app (E2E-16, `src/app.tsx`, hors périmètre fix-screens).
  test('CONSTAT E2E-16 (élargi par E2E-15) — au chargement direct de l’écran A, le focus n’atteint plus le contenu principal (EX-NFR-12)', async ({
    page,
  }, testInfo) => {
    // D8-14/D8-26 (CORRIGÉ) : la coquille pose `tabindex="-1"` sur le `h1` visé AVANT de le
    // focaliser (et retombe sur `#kycar-main` si l'appel reste sans effet). Le lien d'évitement
    // demeure le premier arrêt de tabulation du document (test dédié, ci-dessus).
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-16',
      'EX-NFR-12',
      'depuis EX-SCR-113bis/E2E-15, l’écran A porte lui aussi un h1 dans #kycar-main : l’effet de src/app.tsx qui appelle focus() sur ce h1 (non focalisable, aucun tabindex) échoue silencieusement au lieu de retomber sur #kycar-main — l’écran A rejoint donc le défaut déjà catalogué par E2E-16 pour C/E/F/mentions, qu’il était seul à ne pas partager avant cette correction',
    );
    await open(page, SURFACES.A);
    const inMain = await page.evaluate(() => {
      const el = document.activeElement;
      const main = document.getElementById('kycar-main');
      return el !== null && main !== null && (el === main || main.contains(el));
    });
    expect(inMain).toBe(true);
  });

  test('CONSTAT E2E-16 — la prise de focus après navigation échoue dès que la vue porte un h1 (EX-NFR-12, DR-101)', async ({
    page,
  }, testInfo) => {
    // D8-14/D8-26 (CORRIGÉ) : la coquille pose `tabindex="-1"` sur le `h1` visé AVANT de le
    // focaliser (et retombe sur `#kycar-main` si l'appel reste sans effet). Le lien d'évitement
    // demeure le premier arrêt de tabulation du document (test dédié, ci-dessus).
    // `test.fail()` retiré après rejeu VERT contre Chromium réel (D8-17).
    constat(
      testInfo,
      'E2E-16',
      'EX-NFR-12',
      // D8-14/E2E-15 : l'écran A porte désormais un h1 lui aussi (voir le test ci-dessus) — la clause
      // « seules les vues SANS h1 (A, et B/D avant chargement) reçoivent le repli » ne vaut donc plus
      // que pour B/D avant chargement de leurs données ; A ne fait plus exception.
      'la coquille appelle focus() sur le h1 du contenu, qui n’est pas focalisable (aucun tabindex) : l’appel est sans effet. Au chargement direct de A/C/E/F/mentions le focus reste sur <body> ; après une navigation interne il reste sur le lien cliqué. Seules B/D AVANT le chargement de leurs données (pas encore de h1 au moment de l’effet) reçoivent le repli sur #kycar-main',
    );

    await open(page, SURFACES.A);
    await waitForMarket(page);
    await page.locator('.kycar-footer-links a').click();
    await expect(page).toHaveTitle('KYCAR — Mentions légales');

    mesure(testInfo, 'clavier — focus après navigation vers /mentions', await focusDescription(page));
    const inMain = await page.evaluate(() => {
      const el = document.activeElement;
      const main = document.getElementById('kycar-main');
      return el !== null && main !== null && (el === main || main.contains(el));
    });
    expect(inMain, 'le focus doit être déplacé dans le contenu principal après navigation').toBe(true);
  });

  // D8-14/D8-17 (E2E-15, CORRIGÉ) : `MarketScreen.tsx` porte désormais un `<h1 id="kycar-market-title">
  // Survol du marché</h1>` dans chacun de ses cinq états rendables (chargement, erreur, vide,
  // sans-filtre, prêt), comme les six autres vues. `test.fail()` retiré (D8-17).
  test('CONSTAT E2E-15 — l’écran A porte un titre de niveau 1 (EX-NFR-12)', async ({ page }) => {
    await open(page, SURFACES.A);
    await expect(page.locator('#kycar-main h1')).toHaveCount(1);
  });
});
