/**
 * Revue D6 — item 6 : `EX-SRCH-26` — seuil de 60 marques, sans blocage.
 * =================================================================================================
 * `thresholds.test.ts` (relancé) prouve déjà `shouldShowMakeCountWarning` aux bornes 60/61. Ce
 * fichier vérifie deux choses de plus : (a) le seuil porte sur les marques AVEC AU MOINS UN RÉSULTAT
 * (`EX-SCR-124bis` : « > 60 marques avec au moins un résultat »), pas sur la longueur brute du
 * tableau d'agrégats (qui pourrait en théorie contenir des lignes à effectif nul) ; (b) le TEXTE du
 * bandeau tel qu'écrit dans `MarketScreen.tsx` correspond à l'annexe B (`EX-SCR-32`, qui régit la
 * disposition de l'écran A et prévaut par `R-A09` sur le texte alternatif d'`EX-SRCH-26`, annexe C —
 * la divergence entre les deux formulations de la même exigence est documentée dans le rapport de
 * revue, §5, comme un fait du corpus, pas une erreur de D6).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { MAKE_COUNT_WARNING_THRESHOLD, shouldShowMakeCountWarning } from '../../../src/screens/market/thresholds';

describe('EX-SRCH-26 — seuil = 60, dépassement STRICT, jamais un plafond de calcul', () => {
  it('MAKE_COUNT_WARNING_THRESHOLD === 60 (le nombre normatif unique, EX-SCR-124bis)', () => {
    expect(MAKE_COUNT_WARNING_THRESHOLD).toBe(60);
  });

  it('60 marques exactement -> pas de bandeau ; 61 -> bandeau (dépassement strict, "plus de 60")', () => {
    expect(shouldShowMakeCountWarning(60)).toBe(false);
    expect(shouldShowMakeCountWarning(61)).toBe(true);
  });
});

describe('MarketScreen.tsx applique le seuil au décompte « makeCount > 0 », pas à la taille brute du tableau', () => {
  it('la condition du bandeau filtre bien listingCount > 0 avant de comparer au seuil (lecture directe du code de production)', () => {
    const src = readFileSync(new URL('../../../src/screens/market/MarketScreen.tsx', import.meta.url), 'utf8');
    expect(src).toContain('makesWithResults = data.makeAggregates.filter((a) => a.listingCount > 0).length');
    expect(src).toContain('makesWithResults > MAKE_COUNT_WARNING_THRESHOLD');
  });

  it('le texte du bandeau reproduit EX-SCR-32 littéralement : « <n> marques correspondent — affinez pour comparer »', () => {
    const src = readFileSync(new URL('../../../src/screens/market/MarketScreen.tsx', import.meta.url), 'utf8');
    expect(src).toContain('marques correspondent — affinez pour comparer');
  });

  it(
    'FAIT DE CORPUS (non tranché ici) — EX-SRCH-26 (annexe C, draft-behaviour.md) prescrit un texte ' +
      'DIFFÉRENT pour le même seuil : « <n> marques correspondent — affinez pour une vue plus lisible ». ' +
      "Le code suit EX-SCR-32 (annexe B), autorité de disposition par R-A09 — documenté, pas un défaut D6.",
    () => {
      const behaviourDoc = readFileSync(new URL('../../../docs/requirements/draft-behaviour.md', import.meta.url), 'utf8');
      expect(behaviourDoc).toContain('affinez pour une vue plus lisible');
      const screensDoc = readFileSync(new URL('../../../docs/requirements/draft-screens.md', import.meta.url), 'utf8');
      expect(screensDoc).toContain('affinez pour comparer');
    },
  );
});
