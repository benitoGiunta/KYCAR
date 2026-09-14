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
    "R-D6-08 — CORRIGÉ (DR-071) : MarketScreen.tsx indexe désormais MODELS_VISIBLE_BEFORE_COLLAPSE " +
      "par le régime responsive courant (prop `regime`, repli par `matchMedia`), au lieu du littéral " +
      '`modelsVisibleBeforeCollapse: 6` en dur.',
    () => {
      // D-32 : cette sonde était VERTE en documentant le défaut (elle est explicitement nommée par
      // la mission comme l'une des sondes que la correction autorise à réécrire, avec le protocole
      // rouge-puis-vert). `usages` doit maintenant INCLURE MarketScreen.tsx (il consomme la
      // constante), et le littéral `6` en dur ainsi que l'absence de `matchMedia` sont remplacés par
      // le comportement corrigé.
      const dir = new URL('../../../src/screens/market/', import.meta.url);
      const files = readdirSync(dir).filter((f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && f !== 'thresholds.ts' && !f.endsWith('.test.ts'));
      const usages = files.filter((f) => readFileSync(new URL(f, dir), 'utf8').includes('MODELS_VISIBLE_BEFORE_COLLAPSE'));
      expect(usages).toEqual(['MarketScreen.tsx']);

      const marketScreenSrc = readFileSync(new URL('MarketScreen.tsx', dir), 'utf8');
      expect(marketScreenSrc).not.toContain('modelsVisibleBeforeCollapse: 6');
      expect(marketScreenSrc).toContain('MODELS_VISIBLE_BEFORE_COLLAPSE[regime]');
      expect(marketScreenSrc).toMatch(/matchMedia/);
    },
  );
});

describe("SummaryBar.tsx — adaptation au régime compact (EX-SCR-135 : perte du cardinal « modèles », select -> feuille) — CORRIGÉ (DR-072)", () => {
  it(
    "R-D6-09 — SummaryBar retire le cardinal « modèles » et bascule le `<select>` vers une feuille " +
      "de sélection 44 px quand `regime === 'compact'`, sans changer le comportement des autres " +
      'régimes.',
    () => {
      // D-32 : cette sonde était VERTE en documentant le défaut (nommée explicitement par la mission
      // parmi celles que la correction autorise à réécrire, protocole rouge-puis-vert). Le composant
      // reste SANS HOOK (contrainte de `structure-a11y.test.ts`, qui l'appelle hors cycle de rendu
      // Preact) : la feuille compacte est un `<details>` natif, pas un état local.
      const src = readFileSync(new URL('../../../src/screens/market/SummaryBar.tsx', import.meta.url), 'utf8');
      expect(src).toMatch(/compact/i);
      expect(src).toMatch(/kycar-sort-sheet/);
      // Le cardinal « modèles » n'est plus concaténé SANS CONDITION de régime : il est maintenant
      // gardé par `!compact`.
      expect(src).toMatch(/!compact[\s\S]{0,120}modèles/);
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

  // D8-12/D8-19 (DR-143, dette levée) : la sonde documentait l'ABSENCE de grille de lignes contrôlée
  // par régime. `ModelZone.tsx` porte désormais des classes dédiées par fourchette
  // (`kycar-market-zone-price/-year/-mileage/-median`) et `market.css` les replace en 4 lignes
  // nommées (`grid-template-areas`) sous 768 px — l'assertion NÉGATIVE est remplacée par l'assertion
  // POSITIVE du comportement corrigé, sans toucher aux deux autres sondes de ce fichier (R-D6-08/09,
  // seules nommées par ailleurs).
  it(
    "R-D6-10 — CORRIGÉ (DR-143) : la zone-modèle compacte est réorganisée en QUATRE LIGNES distinctes " +
      '(EX-SCR-135 : « 1: nom+effectif ; 2: prix ; 3: années+km ; 4: médiane+barre ») par une grille ' +
      "nommée dédiée, et non plus par le seul `flex-wrap` générique de `.kycar-market-zone-ranges`.",
    () => {
      // D8-14/D8-19 (a11y, nested-interactive) : une colonne étroite `cmp` s'est ajoutée pour la case
      // de comparaison, désormais sibling du `role="button"` (ModelZone.tsx) plutôt que descendante —
      // les quatre lignes normatives sont inchangées, seule la largeur de colonne 1 (`cmp`/`.`) l'est.
      const compactBlock = css.slice(css.indexOf('@container (max-width: 767.98px)'));
      expect(compactBlock).toMatch(/grid-template-areas/);
      expect(compactBlock).toContain("'cmp row1 row1'");
      expect(compactBlock).toContain("price price'");
      expect(compactBlock).toContain("year mileage'");
      expect(compactBlock).toContain("median bar'");
    },
  );
});
