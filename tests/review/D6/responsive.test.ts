/**
 * Revue D6 — item 10 (volet responsive) : régimes `compact`/`intermédiaire`/`large`
 * (`EX-SCR-20`/`135`/`136`/`137`).
 * =================================================================================================
 * Aucun moteur CSS n'est disponible dans cet environnement (pas de navigateur, pas de `jsdom` avec
 * layout) : les points de rupture eux-mêmes (`market.css`) sont vérifiés par LECTURE DE VALEUR
 * exacte (une exécution de script sur le texte source, pas un rendu) — déclaré comme tel. En
 * revanche, la question « le JS adapte-t-il son propre comportement au régime ? » est vérifiable
 * PAR EXÉCUTION à 100 % : `MODELS_VISIBLE_BEFORE_COLLAPSE` (le seul point d'entrée JS d'un seuil
 * différent par régime, `thresholds.ts`) est un export public — s'il n'est importé nulle part
 * ailleurs dans le lot, aucune valeur de régime autre que le défaut `6` codé en dur n'atteint jamais
 * `buildMakeCardViewModel`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { MODELS_VISIBLE_BEFORE_COLLAPSE } from '../../../src/screens/market/thresholds';

describe('EX-SCR-135 — repli à 4 modèles en régime compact (au lieu de 6)', () => {
  it('la table normative existe et porte bien compact=4/intermediate=6/large=6', () => {
    expect(MODELS_VISIBLE_BEFORE_COLLAPSE).toEqual({ compact: 4, intermediate: 6, large: 6 });
  });

  it(
    "R-D6-08 — MODELS_VISIBLE_BEFORE_COLLAPSE n'est utilisé NULLE PART ailleurs dans le lot : " +
      "MarketScreen.tsx passe le littéral `modelsVisibleBeforeCollapse: 6` en dur à " +
      '`buildMakeCardViewModel`, sans jamais détecter ni recevoir le régime responsive courant ' +
      "(aucun matchMedia/ResizeObserver/prop de régime dans MarketScreen.tsx, SummaryBar.tsx ou " +
      "MakeCard.tsx). En régime compact réel (< 768 px), le repli reste donc à 6, jamais 4.",
    () => {
      const dir = new URL('../../../src/screens/market/', import.meta.url);
      const files = readdirSync(dir).filter((f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && f !== 'thresholds.ts' && !f.endsWith('.test.ts'));
      const usages = files.filter((f) => readFileSync(new URL(f, dir), 'utf8').includes('MODELS_VISIBLE_BEFORE_COLLAPSE'));
      expect(usages).toEqual([]);

      const marketScreenSrc = readFileSync(new URL('MarketScreen.tsx', dir), 'utf8');
      expect(marketScreenSrc).toContain('modelsVisibleBeforeCollapse: 6');
      expect(marketScreenSrc).not.toMatch(/matchMedia|ResizeObserver/);
    },
  );
});

describe("SummaryBar.tsx — aucune adaptation au régime compact (EX-SCR-135 : perte du cardinal « modèles », select -> feuille)", () => {
  it(
    "R-D6-09 — SummaryBar affiche TOUJOURS les trois cardinaux (marques/modèles/offres) et un " +
      '<select> natif : aucune prop/branche ne retire le cardinal « modèles » ni ne bascule vers un ' +
      'bouton 44 px ouvrant une feuille de sélection, quel que soit le régime.',
    () => {
      const src = readFileSync(new URL('../../../src/screens/market/SummaryBar.tsx', import.meta.url), 'utf8');
      expect(src).not.toMatch(/compact|feuille|sheet|matchMedia/i);
      // Les trois cardinaux sont concaténés sans condition de régime.
      expect(src).toContain('modèles ·');
    },
  );
});

describe('market.css — valeurs de points de rupture (lecture de constante, pas un rendu)', () => {
  const css = readFileSync(new URL('../../../src/screens/market/market.css', import.meta.url), 'utf8');

  it('EX-SCR-20/136/137 : 768px (2 col.), 1280px (3 col.), 1680px (4 col.) — les trois valeurs normatives sont présentes', () => {
    expect(css).toContain('min-width: 768px');
    expect(css).toContain('min-width: 1280px');
    expect(css).toContain('min-width: 1680px');
  });

  it('EX-SCR-135 : la zone-modèle passe à 96px en compact (< 768px)', () => {
    expect(css).toMatch(/max-width:\s*767\.98px[\s\S]{0,80}min-height:\s*96px/);
  });

  it(
    "R-D6-10 — MINEUR : la réorganisation en QUATRE LIGNES distinctes de la zone-modèle compacte " +
      '(EX-SCR-135 : « 1: nom+effectif ; 2: prix ; 3: années+km ; 4: médiane+barre ») n’a aucune ' +
      "règle CSS dédiée au-delà de l'augmentation de hauteur (96px) — seul un `flex-wrap` générique " +
      '(`.kycar-market-zone-ranges`) existe, sans grille de lignes contrôlée par régime.',
    () => {
      const compactBlock = css.slice(css.indexOf('@container (max-width: 767.98px)'));
      expect(compactBlock).not.toMatch(/grid-template-areas|grid-template-rows/);
    },
  );
});
