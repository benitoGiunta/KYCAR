/**
 * Sonde de revue D5 — `EX-SCR-103` en mode 2 (`D8-35` point 1, demande de `fix-app-2` §7.1)
 * =================================================================================================
 * `draft-screens.md` `EX-SCR-103` : « Le bandeau est identique sur les écrans A, B, C et D […] à
 * l'exception du contrôle `Marque / Modèle`, qui **sur l'écran B affiche le couple courant et, au
 * clic, ouvre le sélecteur `G` positionné sur ce couple**. »
 *
 * CONSTAT (relevé en navigateur par `fix-app-2` §7.1, arbre d'accessibilité sur
 * `/marche/54-opel/1918-corsa`) : le bouton portait `Marque / Modèle / Version Toutes les marques`
 * et l'écran `G` s'ouvrait NON positionné (`9ff`, `Abarth`, `AC`…). Cause lue dans le code :
 * `FilterBand.tsx` dérivait `screenGSummary` et `currentSelection` de `selection`, qui en mode 2 ne
 * porte JAMAIS `makesModelsVariants` — `carryFiltersAcrossMode` l'absorbe dans la route à l'entrée
 * (`EX-NAV-15`), motif même pour lequel le prop `routePair` existe.
 *
 * PORTÉE DE CETTE SONDE (E4, contrainte d'environnement, non un choix). `FilterBand` et `ScreenG`
 * utilisent des hooks ; `vitest.review.config.ts` fixe `environment: 'node'` et le dépôt n'embarque
 * aucune dépendance DOM (`jsdom`, `happy-dom`, `preact-render-to-string` : absents de
 * `package.json`, `ARCHITECTURE.md` §8) — les monter est impossible ici, comme le note déjà
 * `FilterBand.tsx` en tête pour le raccourci `/`. La sonde éprouve donc les trois maillons au plus
 * haut niveau atteignable, sans en sauter aucun :
 *   1. la dérivation PURE (`withRouteTaxonomy`, `src/state/navigation.ts`) ;
 *   2. le RENDU du contrôle (`PrimaryLine` → `StructuredPickerButton`, tous deux sans hook,
 *      appelés directement — même convention que `facet-counts.test.ts`) ;
 *   3. le CÂBLAGE dans `FilterBand.tsx`, par lecture du source — même convention que
 *      `tests/review/D8/shell-static.test.ts`, écrite pour la même raison.
 * La preuve de bout en bout en navigateur est l'E2E demandée par `fix-app-2` §7.1 point 2.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { mmmvSummary } from '../../../src/components/filters/FilterBand';
import { PrimaryLine } from '../../../src/components/filters/PrimaryLine';
import type { ScreenGReferenceData } from '../../../src/components/filters/ScreenG';
import type { SelectionState } from '../../../src/state/filter-types';
import { withRouteTaxonomy } from '../../../src/state/navigation';

/* ---- Outillage VNode (même convention que `facet-counts.test.ts`) ------------------------------ */

interface VNode {
  readonly type: unknown;
  readonly props: Record<string, unknown>;
}
function isVNode(x: unknown): x is VNode {
  return typeof x === 'object' && x !== null && 'type' in x && 'props' in (x as Record<string, unknown>);
}
function findAll(node: unknown, predicate: (n: VNode) => boolean, acc: VNode[] = []): VNode[] {
  if (
    node === null ||
    node === undefined ||
    typeof node === 'boolean' ||
    typeof node === 'string' ||
    typeof node === 'number'
  ) {
    return acc;
  }
  if (Array.isArray(node)) {
    for (const n of node) findAll(n, predicate, acc);
    return acc;
  }
  if (isVNode(node)) {
    if (predicate(node)) acc.push(node);
    findAll(node.props.children, predicate, acc);
  }
  return acc;
}
/**
 * Déplie les composants FONCTION rencontrés : sans cela l'arbre s'arrête au VNode du composant,
 * dont `props.children` ne contient pas son rendu. Le chemin qui nous intéresse
 * (`PrimaryLine` → `FilterFieldRow` → `ControlRenderer` → `StructuredPickerButton`) n'utilise
 * aucun hook ; d'autres contrôles de la MÊME ligne primaire en utilisent (`RangeControl` et son
 * `useState`), et ne sont pas montables sans DOM — un composant qui lève est donc laissé replié
 * plutôt que de faire échouer la traversée. Aucun de ceux-là n'est lu par cette sonde.
 */
function expand(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(expand);
  if (isVNode(node) && typeof node.type === 'function') {
    try {
      return expand((node.type as (p: Record<string, unknown>) => unknown)(node.props));
    } catch {
      return node;
    }
  }
  if (isVNode(node)) {
    return { ...node, props: { ...node.props, children: expand(node.props.children) } };
  }
  return node;
}

function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isVNode(node)) return collectText(node.props.children);
  return '';
}

/* ---- Fixtures : le couple de la route de l'écran B `/marche/54-opel/1918-corsa` ---------------- */

const ROUTE_PAIR = { makeId: 54, modelId: 1918 } as const;
/** Deux index suffisent à `mmmvSummary` — le reste de `ReferenceData` n'est pas lu ici. */
const REFERENCE = {
  makeById: new Map([[54, { label: 'Opel' }]]),
  modelByKey: new Map([['54:1918', { label: 'Corsa' }]]),
} as unknown as ScreenGReferenceData;

/** Sélection réelle d'un écran B : des filtres partagés, et AUCUN `mmmv` (`EX-NAV-15`). */
const MODE2_SELECTION: SelectionState = { priceTo: 20000, fuelType: ['B'] };

const NOOP = (): void => {};

describe('R-D5-2.8-07 — EX-SCR-103 : la dérivation du couple depuis la route (fonction pure)', () => {
  it('en mode 2 avec un couple de route, la sélection taxonomique porte `makesModelsVariants`', () => {
    const derived = withRouteTaxonomy(MODE2_SELECTION, 'mode2', ROUTE_PAIR);
    expect(derived['makesModelsVariants']).toBe('54|1918');
    // Les autres filtres sont intacts, et la sélection D'ORIGINE n'est jamais mutée.
    expect(derived['priceTo']).toBe(20000);
    expect(MODE2_SELECTION['makesModelsVariants']).toBeUndefined();
  });

  it('une route de marque seule donne le bloc de marque seule', () => {
    expect(withRouteTaxonomy({}, 'mode2', { makeId: 54 })['makesModelsVariants']).toBe('54');
  });

  it('en mode 1, ou sans couple de route, la sélection est rendue TELLE QUELLE', () => {
    expect(withRouteTaxonomy(MODE2_SELECTION, 'mode1', ROUTE_PAIR)).toBe(MODE2_SELECTION);
    expect(withRouteTaxonomy(MODE2_SELECTION, 'mode2', undefined)).toBe(MODE2_SELECTION);
  });

  it('un `mmmv` déjà posé dans la sélection n’est pas écrasé silencieusement en mode 1', () => {
    const sel: SelectionState = { makesModelsVariants: '74' };
    expect(withRouteTaxonomy(sel, 'mode1', ROUTE_PAIR)['makesModelsVariants']).toBe('74');
  });
});

describe('R-D5-2.8-08 — EX-SCR-103 : le contrôle `Marque / Modèle` affiche le couple courant', () => {
  it('`mmmvSummary` résout le couple de la route en libellés taxonomiques', () => {
    expect(mmmvSummary(withRouteTaxonomy(MODE2_SELECTION, 'mode2', ROUTE_PAIR), REFERENCE)).toBe('Opel Corsa');
  });

  it('le bouton `structured-picker` de la ligne primaire porte « Opel Corsa », jamais « Toutes les marques »', () => {
    const summary = mmmvSummary(withRouteTaxonomy(MODE2_SELECTION, 'mode2', ROUTE_PAIR), REFERENCE);
    const vnode = PrimaryLine({
      mode: 'mode2',
      selection: MODE2_SELECTION,
      onChange: NOOP,
      onOpenScreenG: NOOP,
      screenGSummary: summary,
    });
    const picker = findAll(
      expand(vnode),
      (n) => n.type === 'div' && String(n.props.class ?? '').includes('kycar-control--structured-picker'),
    )[0];
    expect(picker).toBeDefined();
    expect(collectText(picker)).toContain('Opel Corsa');
    expect(collectText(picker)).not.toContain('Toutes les marques');
  });

  it('sur l’écran A (mode 1, aucune marque posée), le résumé reste « Toutes les marques »', () => {
    expect(mmmvSummary(withRouteTaxonomy({}, 'mode1', undefined), REFERENCE)).toBe('Toutes les marques');
  });
});

describe('R-D5-2.8-09 — EX-SCR-103 : `FilterBand` câble la dérivation vers le résumé ET vers `ScreenG`', () => {
  // `FilterBand` et `ScreenG` utilisent des hooks : indémontables sans DOM (en-tête de ce fichier).
  // Sonde STATIQUE du câblage, même convention que `tests/review/D8/shell-static.test.ts`.
  const source = readFileSync(resolve(process.cwd(), 'src/components/filters/FilterBand.tsx'), 'utf8');

  it('la sélection taxonomique est dérivée par `withRouteTaxonomy`, pas recopiée à la main', () => {
    expect(source).toContain('withRouteTaxonomy');
    expect(source).toMatch(/const taxonomySelection = withRouteTaxonomy\(selection, props\.mode, props\.routePair\)/);
  });

  it('`screenGSummary` est calculé sur la sélection taxonomique, plus sur `selection`', () => {
    expect(source).toMatch(/const screenGSummary = mmmvSummary\(taxonomySelection, props\.referenceData\)/);
    expect(source).not.toMatch(/const screenGSummary = mmmvSummary\(selection, props\.referenceData\)/);
  });

  it('`ScreenG` reçoit la sélection taxonomique en `currentSelection` (écran G positionné)', () => {
    expect(source).toMatch(/currentSelection=\{taxonomySelection\}/);
    expect(source).not.toMatch(/currentSelection=\{selection\}/);
  });

  it('la feuille du régime compact dérive elle aussi son résumé du couple de la route', () => {
    expect(source).toMatch(/mmmvSummary\(withRouteTaxonomy\(draftSelection, props\.mode, props\.routePair\), props\.referenceData\)/);
  });
});
