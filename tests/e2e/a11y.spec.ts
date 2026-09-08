/**
 * KYCAR — Accessibilité au rendu réel (PLAN-2 §2.9a, `EX-NFR-12`/`13`/`16`)
 * =================================================================================================
 * `EX-NFR-16` exige un contrôle automatisé de type axe-core SANS aucune violation de niveau A ou AA
 * sur les écrans. Le périmètre retenu par le plan est celui des HUIT surfaces : A (`/marche`), B, D,
 * C (`/comparer`), E (`/recherches`), F (`/suivis`), G (modale ouverte) et `/mentions`.
 *
 * `EX-NFR-13` (contraste ≥ 4,5:1 texte normal, ≥ 3:1 texte large et éléments graphiques porteurs
 * d'information) n'est vérifiable QU'ICI : les couleurs sont calculées par le navigateur à partir des
 * jetons de `src/styles/tokens.css`, aucune sonde hors navigateur ne peut les résoudre. C'est la
 * règle `color-contrast` d'axe qui en rend compte.
 *
 * Le balayage porte sur la page ENTIÈRE (en-tête, bandeau, contenu, pied) : une violation dans une
 * région partagée est un défaut de la surface où elle se voit.
 */
import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

import { SURFACES, constat, mesure, open, waitForMarket } from './_helpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface RuleCount {
  readonly id: string;
  readonly impact: string;
  readonly nodes: number;
  readonly firstTarget: string;
}

/** Balaye la page courante et retourne un décompte par règle, trié par nombre de nœuds. */
async function scan(page: Page, include?: string): Promise<RuleCount[]> {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (include !== undefined) builder = builder.include(include);
  const result = await builder.analyze();
  return result.violations
    .map((v) => ({
      id: v.id,
      impact: v.impact ?? 'inconnu',
      nodes: v.nodes.length,
      firstTarget: String(v.nodes[0]?.target?.join(' ') ?? ''),
    }))
    .sort((a, b) => b.nodes - a.nodes);
}

function summarize(violations: readonly RuleCount[]): string {
  if (violations.length === 0) return '0 violation';
  return violations.map((v) => `${v.id} [${v.impact}] ×${v.nodes} (${v.firstTarget})`).join(' ; ');
}

test.describe('EX-NFR-16 — axe-core WCAG 2.1 A/AA sur les huit surfaces', () => {
  for (const [name, path] of [
    ['B — distribution d’un modèle', SURFACES.B],
    ['C — comparer des modèles', SURFACES.C],
    ['E — recherches enregistrées', SURFACES.E],
    ['F — modèles suivis', SURFACES.F],
    ['/mentions — mentions légales', SURFACES.mentions],
  ] as const) {
    test(`surface ${name} : zéro violation A/AA`, async ({ page }, testInfo) => {
      await open(page, path);
      const violations = await scan(page);
      mesure(testInfo, `axe — ${name}`, summarize(violations));
      expect(violations, `violations axe sur ${name}`).toEqual([]);
    });
  }

  test('CONSTAT E2E-13 — surface D : l’écran ne rend pas, EX-NFR-16 ne peut y être prononcée (EX-NFR-16)', async ({
    page,
  }, testInfo) => {
    test.fail();
    constat(
      testInfo,
      'E2E-13',
      'EX-NFR-16',
      'la surface D ne peut pas être balayée : la route /annonces ne monte que la barre d’outils (cf. E2E-01), un balayage axe y renverrait « 0 violation » sur une page vide — verdict d’accessibilité NON PRONONÇABLE tant qu’E2E-01 n’est pas corrigé',
    );

    await open(page, SURFACES.D);
    const violations = await scan(page);
    mesure(testInfo, 'axe — D — annonces du modèle', summarize(violations));
    expect(violations).toEqual([]);
  });

  test('CONSTAT E2E-11 — surface A : contraste insuffisant des pastilles de marque (EX-NFR-13, EX-NFR-16)', async ({
    page,
  }, testInfo) => {
    test.fail();
    constat(
      testInfo,
      'E2E-11',
      'EX-NFR-13/EX-NFR-16',
      'la règle color-contrast d’axe échoue sur les pastilles .kycar-market-badge de l’écran A (texte #14171c sur fonds de teinte générés : 3,19:1 à 4,15:1 mesurés, seuil 4,5:1) — la couleur de fond est calculée par carte, aucune sonde hors navigateur ne pouvait le voir',
    );

    await open(page, SURFACES.A);
    const violations = await scan(page);
    mesure(testInfo, 'axe — A /marche', summarize(violations));
    expect(violations).toEqual([]);
  });

  test('CONSTAT E2E-12 — surface G : attributs ARIA non autorisés et contrôles imbriqués dans la modale (EX-NFR-16, EX-SCR-215/216)', async ({
    page,
  }, testInfo) => {
    test.fail();
    constat(
      testInfo,
      'E2E-12',
      'EX-NFR-16/EX-SCR-215',
      'la modale de sélection marque/modèle produit deux violations sérieuses/critiques : aria-allowed-attr (aria-setsize porté par le ul[role=listbox] et aria-selected porté par les boutons de ligne) et nested-interactive (un bouton focalisable à l’intérieur d’un li[role=option]) — l’équivalent accessible du fenêtrage viole la sémantique listbox/option',
    );

    await open(page, SURFACES.A);
    await waitForMarket(page);
    await page.getByRole('button', { name: 'Choisir une marque et un modèle' }).click();
    await expect(page.getByRole('dialog', { name: 'Sélectionner marque et modèle' })).toBeVisible();

    const violations = await scan(page, '.kycar-screen-g');
    mesure(testInfo, 'axe — G (modale marque/modèle)', summarize(violations));
    expect(violations).toEqual([]);
  });
});
