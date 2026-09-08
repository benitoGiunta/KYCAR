import { describe, expect, it } from 'vitest';

import { EXPOSED_FILTER_DEFS, FILTER_BY_ID } from '../../state/filter-registry';
import type { SelectionState } from '../../state/filter-types';
import {
  buildActiveFilterTokens,
  formatNumberFr,
  resolveOptionLabel,
  semanticsWarningTooltip,
} from './labels';

/**
 * Critère de succès D5 #3 (`EX-NFR-30`) : 0 libellé non-français / code brut affiché. Ce test
 * parcourt EXHAUSTIVEMENT le domaine énuméré des 76 filtres exposés — pas un échantillon — et
 * vérifie que le jeton produit pour chaque code isolé restitue le LIBELLÉ résolu du registre, pas
 * le code lui-même transmis tel quel par accident de câblage.
 */
describe('EX-NFR-30 — 0 code brut affiché, exhaustif sur le registre', () => {
  const enumDefs = EXPOSED_FILTER_DEFS.filter(
    (d) =>
      (d.scopeType === 'enum_single' || d.scopeType === 'enum_multi') &&
      (d.options?.length ?? 0) > 0 &&
      d.cls !== 'D', // classe D : jamais sérialisée/affichée comme jeton (EX-SCR-57), couvert séparément
  );

  it('couvre au moins un filtre énuméré (garde contre un registre vidé par erreur)', () => {
    expect(enumDefs.length).toBeGreaterThan(0);
  });

  it('chaque option de chaque filtre énuméré produit un jeton dont le texte EST le libellé résolu', () => {
    for (const def of enumDefs) {
      for (const opt of def.options ?? []) {
        // Une option qui EST la valeur par défaut non-absence du filtre (ex. powertype=kw) ne
        // produit normativement aucun jeton (EX-NAV-8/EX-SCR-91) : exclue de cette assertion, déjà
        // couverte séparément plus bas.
        if (def.defaultValue !== undefined && String(def.defaultValue) === opt.code) continue;
        const selection: SelectionState = { [def.id]: opt.code };
        const tokens = buildActiveFilterTokens(selection);
        expect(tokens, `filtre ${def.id}, code ${opt.code}`).toHaveLength(1);
        expect(tokens[0]?.text).toBe(opt.label);
        // Le libellé n'est jamais vide (EX-NFR-29 : chaque code utilisé porte un libellé FR).
        expect(opt.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('un filtre énuméré à 2 valeurs affiche les deux libellés joints par une virgule', () => {
    const def = FILTER_BY_ID.get('fuelType');
    expect(def).toBeDefined();
    const [first, second] = def?.options ?? [];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    const tokens = buildActiveFilterTokens({ fuelType: [first!.code, second!.code] });
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.text).toBe(`${first!.label}, ${second!.label}`);
    expect(tokens[0]?.text).not.toContain(first!.code);
  });

  it('un filtre énuméré à 3+ valeurs affiche le cardinal, l’énumération complète en infobulle', () => {
    const def = FILTER_BY_ID.get('fuelType');
    const codes = (def?.options ?? []).slice(0, 3).map((o) => o.code);
    expect(codes).toHaveLength(3);
    const tokens = buildActiveFilterTokens({ fuelType: codes });
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.text).toBe('Carburant : 3 valeurs');
    for (const code of codes) {
      expect(tokens[0]?.tooltip).toContain(code === codes[0] ? '' : ''); // infobulle vérifiée ci-dessous
    }
    const labels = (def?.options ?? []).slice(0, 3).map((o) => o.label);
    expect(tokens[0]?.tooltip).toBe(labels.join(', '));
  });

  it('resolveOptionLabel refuse silencieusement de retomber sur un code inconnu (lève une erreur)', () => {
    const def = FILTER_BY_ID.get('fuelType');
    expect(def).toBeDefined();
    expect(() => resolveOptionLabel(def!, 'CODE_INCONNU_XYZ')).toThrow();
  });

  it('un booléen actif affiche le libellé du filtre, jamais le code true brut ("1")', () => {
    const tokens = buildActiveFilterTokens({ vatReportable: '1' });
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.text).toBe('TVA déductible / récupérable');
    expect(tokens[0]?.text).not.toBe('1');
  });

  it('un booléen à sa valeur fausse (absente) ne produit aucun jeton', () => {
    expect(buildActiveFilterTokens({ vatReportable: '0' })).toHaveLength(0);
  });
});

describe('formatage numérique fr-BE et jetons d’intervalle (EX-SCR-75)', () => {
  it('formate un nombre en séparateur de milliers fr-BE avec suffixe d’unité', () => {
    const formatted = formatNumberFr(18000, 'EUR');
    expect(formatted).toContain('18');
    expect(formatted).toContain('000');
    expect(formatted.endsWith(' €')).toBe(true);
  });

  it('un intervalle à deux bornes produit un seul jeton "de – à"', () => {
    const tokens = buildActiveFilterTokens({ priceFrom: 18000, priceTo: 25000 });
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.filterIds).toEqual(['priceFrom', 'priceTo']);
    expect(tokens[0]?.text).toContain('–');
    expect(tokens[0]?.text.endsWith('€')).toBe(true);
  });

  it('un intervalle à borne unique haute affiche "≤ valeur"', () => {
    const tokens = buildActiveFilterTokens({ mileageTo: 100000 });
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.text.startsWith('≤')).toBe(true);
    expect(tokens[0]?.filterIds).toEqual(['mileageTo']);
  });

  it('un intervalle à borne unique basse affiche "≥ valeur"', () => {
    const tokens = buildActiveFilterTokens({ dateOfRegistrationFrom: 2015 });
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.text.startsWith('≥')).toBe(true);
    // Année : aucun suffixe d'unité (le séparateur de milliers fr-BE est l'espace fine insécable).
    expect(tokens[0]?.text).toBe(`≥ ${formatNumberFr(2015)}`);
    expect(tokens[0]?.text.endsWith('€')).toBe(false);
  });

  it('l’ordre des jetons suit l’ordre du registre, pas l’ordre d’insertion de la sélection', () => {
    const tokens = buildActiveFilterTokens({ mileageFrom: 10000, priceFrom: 5000 });
    // priceFrom est déclaré avant mileageFrom dans FILTER_DEFS.
    expect(tokens.map((t) => t.key)).toEqual(['priceFrom', 'mileageFrom']);
  });

  it('un filtre à sa valeur par défaut non-absence (powertype=kw) ne produit aucun jeton', () => {
    expect(buildActiveFilterTokens({ powerType: 'kw' })).toHaveLength(0);
  });

  it('un filtre de classe D n’est jamais un jeton (défense en profondeur, EX-SCR-57)', () => {
    expect(buildActiveFilterTokens({ hadAccidentNew: 'include' })).toHaveLength(0);
  });
});

describe('icône (?) de sémantique présumée (EX-SCR-85)', () => {
  it('porte une infobulie pour les quatre filtres à sémantique non prouvée', () => {
    for (const id of ['equipment', 'emissionClass', 'numberOfOwners', 'emissionSticker']) {
      const def = FILTER_BY_ID.get(id);
      expect(def, id).toBeDefined();
      expect(semanticsWarningTooltip(def!)).toBe('Sémantique présumée, non vérifiée à la source');
    }
  });

  it('ne porte aucune infobulle pour un filtre sans sémantique présumée', () => {
    const def = FILTER_BY_ID.get('fuelType');
    expect(semanticsWarningTooltip(def!)).toBeUndefined();
  });
});
