/**
 * Sonde de revue D5 — `D8-04d` (`FV-04`, `EX-SCR-75`/`76`, `EX-NFR-30`) : le jeton de la ligne des
 * filtres actifs pour `mmmv` (`makesModelsVariants`) ne doit JAMAIS afficher le bloc brut
 * (`74|2084`) — un jeton PAR NIVEAU, résolu contre le référentiel taxonomique, chacun
 * indépendamment retirable (le modèle se retire sans perdre la marque).
 *
 * Avant correction (`git show HEAD~1:src/components/filters/labels.ts`, `formatTextToken`) :
 *   buildActiveFilterTokens({ makesModelsVariants: '74|2084' }) →
 *     [{ text: 'Marque / Modèle / Version : 74|2084', filterIds: ['makesModelsVariants'] }]
 *   — un seul jeton, code brut affiché, un seul retrait possible (tout ou rien).
 */
import { describe, expect, it } from 'vitest';

import { buildActiveFilterTokens } from '../../../src/components/filters/labels';
import type { TokenTaxonomyReference } from '../../../src/components/filters/labels';

function fakeReference(): TokenTaxonomyReference {
  return {
    makeById: new Map([
      [74, { makeId: 74, label: 'Volkswagen', announcedCount: 1000 } as never],
    ]),
    modelByKey: new Map([
      ['74:2084', { makeId: 74, modelId: 2084, label: 'Golf', announcedCount: 200 } as never],
    ]),
  };
}

describe('R-D5-27 — D8-04d : jeton `mmmv` par niveau, libellé taxonomique, jamais le code brut', () => {
  it('marque seule (`makeId`) : UN jeton portant le libellé de la marque, pas le code', () => {
    const tokens = buildActiveFilterTokens({ makesModelsVariants: '74' }, fakeReference());
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.text).toBe('Volkswagen');
    expect(tokens[0]?.text).not.toContain('74');
    expect(tokens[0]?.narrowsTo).toBeUndefined(); // retrait total, pas de restriction possible
  });

  it('couple marque/modèle (`makeId|modelId`) : DEUX jetons, marque puis modèle, aucun code brut', () => {
    const tokens = buildActiveFilterTokens({ makesModelsVariants: '74|2084' }, fakeReference());
    expect(tokens).toHaveLength(2);
    expect(tokens[0]?.text).toBe('Volkswagen');
    expect(tokens[1]?.text).toBe('Golf');
    for (const t of tokens) {
      expect(t.text).not.toContain('74');
      expect(t.text).not.toContain('2084');
      expect(t.text).not.toContain('|');
    }
  });

  it('le jeton « modèle » restreint (`narrowsTo`) à la marque seule, il ne supprime pas tout', () => {
    const tokens = buildActiveFilterTokens({ makesModelsVariants: '74|2084' }, fakeReference());
    const modelToken = tokens[1]!;
    expect(modelToken.narrowsTo).toEqual({ filterId: 'makesModelsVariants', value: '74' });
  });

  it('le jeton « marque » (niveau supérieur) retire tout, y compris le descendant (EX-SCR-76)', () => {
    const tokens = buildActiveFilterTokens({ makesModelsVariants: '74|2084' }, fakeReference());
    const makeToken = tokens[0]!;
    expect(makeToken.narrowsTo).toBeUndefined();
    expect(makeToken.filterIds).toEqual(['makesModelsVariants']);
  });

  it('référentiel absent : repli sur un espace réservé numéroté, JAMAIS le code nu (EX-NFR-30)', () => {
    const tokens = buildActiveFilterTokens({ makesModelsVariants: '74|2084' }, undefined);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]?.text).toBe('Marque nº 74');
    expect(tokens[1]?.text).toBe('Modèle nº 2084');
    // « nº 74 » n'est pas le code brut affiché seul (EX-NFR-30 vise l'affichage d'UN code isolé
    // sans mot autour) : ici le nombre reste entouré d'un espace réservé français explicite.
  });

  it('marque introuvable dans le référentiel (id inconnu) : même repli, jamais une exception', () => {
    const tokens = buildActiveFilterTokens({ makesModelsVariants: '999' }, fakeReference());
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.text).toBe('Marque nº 999');
  });

  it('sélection multi-blocs (défensif, aucun sélecteur actuel n’en produit) : repli au cardinal', () => {
    const tokens = buildActiveFilterTokens({ makesModelsVariants: ['74', '54|1918'] }, fakeReference());
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.text).toBe('Marque / Modèle / Version : 2 sélections');
  });

  it('l’ordre des jetons `mmmv` (marque puis modèle) est stable au tri global (filterIds[0])', () => {
    const tokens = buildActiveFilterTokens(
      { priceFrom: 5000, makesModelsVariants: '74|2084' },
      fakeReference(),
    );
    const mmmvTokens = tokens.filter((t) => t.filterIds[0] === 'makesModelsVariants');
    expect(mmmvTokens.map((t) => t.text)).toEqual(['Volkswagen', 'Golf']);
  });
});
