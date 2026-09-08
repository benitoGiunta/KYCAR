/**
 * Sonde de revue D5 — actions de la zone (4) et réinitialisations : retrait unitaire
 * (`EX-SCR-76`, recette d'`EX-SCR-102`) et réinitialisation par groupe (`EX-SRCH-19`).
 */
import { describe, expect, it } from 'vitest';

import { ActiveFilterTokens } from '../../../src/components/filters/ActiveFilterTokens';
import { buildSecondaryGroups, countActiveFilters } from '../../../src/components/filters/band-model';
import { buildActiveFilterTokens } from '../../../src/components/filters/labels';
import { FILTER_DEFAULTS } from '../../../src/state/filter-registry';
import { serializeQuery } from '../../../src/state/url-codec';
import { formatOfferCount } from '../../../src/screens/market/format';

const OPTS = { filterDefaults: FILTER_DEFAULTS } as const;

interface VNode {
  readonly type: unknown;
  readonly props: Record<string, unknown>;
}
function isVNode(x: unknown): x is VNode {
  return typeof x === 'object' && x !== null && 'type' in x && 'props' in (x as Record<string, unknown>);
}
function findAll(node: unknown, predicate: (n: VNode) => boolean, acc: VNode[] = []): VNode[] {
  if (node === null || node === undefined || typeof node === 'boolean' || typeof node === 'string' || typeof node === 'number') {
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
function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isVNode(node)) return collectText(node.props.children);
  return '';
}
/** Enfants directs de la zone (4), dans l'ordre de rendu — `ActiveFilterTokens` n'a pas de hook :
 * on peut l'appeler directement (même principe que `structure-a11y.test.ts`, lot D6). */
function directChildren(root: unknown): VNode[] {
  if (!isVNode(root)) return [];
  const children = root.props.children;
  return Array.isArray(children) ? children.filter(isVNode) : isVNode(children) ? [children] : [];
}

const NOOP = (): void => {};
const BASE_PROPS = {
  selection: { fuelType: ['B'] },
  onRemove: NOOP,
  onClearAll: NOOP,
  onRemovePartial: NOOP,
} as const;

describe('D5 — EX-SCR-75/77 : jetons et « Tout effacer »', () => {
  it('EX-SCR-75 — le format des jetons suit la table normative (1, 2, ≥ 3 valeurs, intervalle, booléen)', () => {
    expect(buildActiveFilterTokens({ fuelType: ['B'] })[0]?.text).toBe('Carburant : Essence');
    expect(buildActiveFilterTokens({ fuelType: ['B', 'D'] })[0]?.text).toBe('Carburant : Essence, Diesel');
    const three = buildActiveFilterTokens({ fuelType: ['B', 'D', 'E'] })[0];
    expect(three?.text).toBe('Carburant : 3 valeurs');
    expect(three?.tooltip).toBe('Essence, Diesel, Electrique');
    expect(buildActiveFilterTokens({ mileageTo: 100_000 })[0]?.text).toBe('Kilométrage : ≤ 100 000 km');
    expect(buildActiveFilterTokens({ vatReportable: '1' })[0]?.text).toBe('TVA déductible / récupérable');
  });

  it('EX-SCR-77 / EX-SRCH-18 — « Tout effacer » laisse une URL sans aucun paramètre de filtre', () => {
    const selection = { fuelType: ['B', 'D'], priceFrom: 5_000, hasLeasing: '1' };
    expect(serializeQuery(selection, {}, OPTS).length).toBeGreaterThan(0);
    expect(serializeQuery({}, {}, OPTS)).toBe('');
    expect(countActiveFilters({})).toBe(0);
  });

  it('EX-SCR-76 — retirer un intervalle retire ses DEUX bornes en un seul geste', () => {
    const token = buildActiveFilterTokens({ priceFrom: 5_000, priceTo: 25_000 })[0];
    expect(token?.filterIds).toEqual(['priceFrom', 'priceTo']);
  });
});

describe('R-D5-22 — EX-SCR-76 : le retrait unitaire d’une valeur multi-valeurs est impossible', () => {
  // `D-10` (fix-lead, tension EX-SCR-75 vs EX-SCR-76) : le retrait unitaire est satisfait « EN
  // SUBSTANCE » par un jeton UNIQUE portant le cardinal (conforme à `EX-SCR-75`, table normative
  // 1/2/≥3 valeurs) DONT l'infobulle liste chaque valeur avec sa propre cible de retrait
  // (`removalTargets`, `removesCodes`) — PAS par un jeton de premier niveau par valeur. La
  // rédaction initiale de cette sonde (`toHaveLength(3)`) anticipait la lecture opposée de la
  // tension, tranchée depuis par `D-10` en sens contraire ; corrigée en conséquence (`D-31`).
  it('R-D5-22 — un jeton à cardinal (> 2 valeurs) expose une cible de retrait par valeur (D-10)', () => {
    const tokens = buildActiveFilterTokens({ fuelType: ['B', 'D', 'E'] });
    // Recette d'EX-SCR-102 : « retrait unitaire fonctionnel » — un jeton UNIQUE, dont chaque
    // valeur de l'infobulle porte sa propre croix (`removalTargets`).
    expect(tokens).toHaveLength(1);
    const token = tokens[0]!;
    expect(token.filterIds).toEqual(['fuelType']);
    expect(token.removesCodes).toEqual(['B', 'D', 'E']);
    expect(token.removalTargets).toHaveLength(3);
    for (const target of token.removalTargets ?? []) {
      // Un retrait UNITAIRE retire un sous-ensemble STRICT des 3 codes, jamais les 3 à la fois
      // (sinon ce serait la croix du jeton lui-même, pas un retrait unitaire).
      expect(target.removesCodes.length).toBeGreaterThan(0);
      expect(target.removesCodes.length).toBeLessThan(3);
    }
    const allTargetCodes = (token.removalTargets ?? []).flatMap((t) => t.removesCodes).sort();
    expect(allTargetCodes).toEqual(['B', 'D', 'E']);
  });
});

describe('R-D5-21 — EX-SRCH-19 : aucun bouton de réinitialisation par groupe', () => {
  it('R-D5-21 — le modèle de vue d’un groupe n’expose pas les filtres à vider', () => {
    const group = buildSecondaryGroups({ fuelType: ['B'] })[0];
    expect(group).toBeDefined();
    expect(Object.keys(group ?? {})).toContain('resetFilterIds');
  });
});

describe('R-D5-24 — EX-SCR-94/78 : « Enregistrer la recherche » et le compteur de résultats de la zone (4)', () => {
  it('R-D5-24 — le bouton « Enregistrer la recherche » (EX-SCR-94) n’est rendu que si `onSaveSearch` est fourni', () => {
    const withoutCallback = ActiveFilterTokens({ ...BASE_PROPS });
    const buttonsWithout = findAll(withoutCallback, (n) => n.type === 'button').filter(
      (b) => collectText(b.props.children) === 'Enregistrer la recherche',
    );
    expect(buttonsWithout).toHaveLength(0);

    const onSaveSearch = () => {};
    const withCallback = ActiveFilterTokens({ ...BASE_PROPS, onSaveSearch });
    const buttonsWith = findAll(withCallback, (n) => n.type === 'button').filter(
      (b) => collectText(b.props.children) === 'Enregistrer la recherche',
    );
    expect(buttonsWith).toHaveLength(1);
    expect(buttonsWith[0]?.props.onClick).toBe(onSaveSearch);
  });

  it('R-D5-24 — le compteur (EX-SCR-78) est au format `EX-SCR-10`, dernier enfant de la zone (extrémité droite)', () => {
    const vnode = ActiveFilterTokens({ ...BASE_PROPS, resultCount: 2_656 });
    expect(vnode).not.toBeNull();
    if (vnode === null) return;
    const children = directChildren(vnode);
    const last = children[children.length - 1];
    expect(last).toBeDefined();
    expect(collectText(last)).toBe(formatOfferCount(2_656));
    expect(collectText(last)).toContain('2');
    expect(collectText(last)).toContain('656');
    expect(collectText(last)).toContain('offres');
    // Positionné à l'extrémité droite : pas de texte de compteur ailleurs dans l'arbre (l'ancien
    // format inline `, <n> offres` accolé au résumé de jetons a bien disparu).
    const summary = children.find((c) => typeof c.props['class'] === 'string' && (c.props['class'] as string).includes('summary'));
    expect(summary).toBeDefined();
    expect(collectText(summary)).not.toContain('offre');
  });

  it('R-D5-24 — pendant `ET-CHARGE-MAJ`, la valeur PRÉCÉDENTE reste affichée, atténuée, suivie de `…`, jamais `0`', () => {
    const vnode = ActiveFilterTokens({ ...BASE_PROPS, resultCount: 112, resultCountLoading: true });
    const children = directChildren(vnode);
    const last = children[children.length - 1];
    const text = collectText(last);
    expect(text).toBe('112 offres…');
    expect(text).not.toContain('0 offre');
    // « atténuée » : un élément dédié porte la valeur, distinct du texte brut (habillage visuel).
    const dimmed = findAll(last!, (n) => typeof n.props['class'] === 'string' && (n.props['class'] as string).includes('dim'));
    expect(dimmed).toHaveLength(1);
  });

  it('R-D5-24 — `resultCount` absent : aucun compteur rendu (pas de `0` affiché à tort)', () => {
    const vnode = ActiveFilterTokens({ ...BASE_PROPS });
    const children = directChildren(vnode);
    const counters = findAll(vnode!, (n) => typeof n.props['class'] === 'string' && (n.props['class'] as string).includes('count'));
    expect(counters).toHaveLength(0);
    void children;
  });
});
