/**
 * Sonde de revue D5 — `D8-05` (`FV-06`, `EX-SCR-65`/`89`/`90`) : les facettes du dernier recalcul
 * doivent atteindre `CheckboxList` — `(n)` par option, `(0)` en gris (option restant cochable),
 * `…` pendant l'écart — et être exposées de bout en bout par `FilterBand` (props publiques).
 *
 * Avant correction, `facetCounts` s'arrêtait à `FilterFieldRow`/`ControlRenderer`/`CheckboxList` :
 * ni `PrimaryLine`, ni `SecondaryGroups`, ni `FilterBand` ne l'acceptaient ou ne le routaient —
 * un appelant (fix-app) n'avait donc AUCUN moyen d'atteindre `CheckboxList` (`grep facetCounts
 * src/app.tsx src/components/filters/FilterBand.tsx` = 0, `FINAL-VERIFICATION.md` FV-06).
 */
import { describe, expect, it } from 'vitest';

import { CheckboxList } from '../../../src/components/filters/controls/CheckboxList';
import { FILTER_BY_ID } from '../../../src/state/filter-registry';
import type { FacetCounts } from '../../../src/components/filters/types';

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

const fuelType = FILTER_BY_ID.get('fuelType')!;
const NOOP = (): void => {};

describe('R-D5-29 — D8-05/EX-SCR-89/90 : CheckboxList rend `(n)`/`(0)` gris/`…` depuis `facetCounts`', () => {
  it('une option avec effectif > 0 affiche `(n)`', () => {
    const facetCounts: FacetCounts = new Map([['B', 412]]);
    const vnode = CheckboxList({ def: fuelType, value: undefined, disabled: false, facetCounts, onChange: NOOP });
    const labels = findAll(vnode, (n) => n.type === 'label');
    const essence = labels.find((l) => collectText(l).startsWith('Essence'));
    expect(essence).toBeDefined();
    expect(collectText(essence)).toContain('(412)');
  });

  it('une option à effectif `0` reste rendue « (0) », et son checkbox n’est PAS désactivé (EX-SCR-89)', () => {
    const facetCounts: FacetCounts = new Map([['B', 0]]);
    const vnode = CheckboxList({ def: fuelType, value: undefined, disabled: false, facetCounts, onChange: NOOP });
    const labels = findAll(vnode, (n) => n.type === 'label');
    const essence = labels.find((l) => collectText(l).startsWith('Essence'));
    expect(collectText(essence)).toContain('(0)');
    const checkbox = findAll(essence, (n) => n.type === 'input')[0];
    expect(checkbox?.props.disabled).toBe(false);
    // Rendu « en gris » : une parenthèse à 0 porte un style d'atténuation dédié.
    const dimmed = findAll(essence, (n) => n.type === 'span' && (n.props.class as string)?.includes('facet-count'))[0];
    expect(dimmed?.props.style).toMatchObject({ opacity: expect.any(Number) });
  });

  it('`facetCountsPending` affiche `…` au lieu de la valeur, y compris quand `facetCounts` est fourni', () => {
    const facetCounts: FacetCounts = new Map([['B', 412]]);
    const vnode = CheckboxList({
      def: fuelType,
      value: undefined,
      disabled: false,
      facetCounts,
      facetCountsPending: true,
      onChange: NOOP,
    });
    const labels = findAll(vnode, (n) => n.type === 'label');
    const essence = labels.find((l) => collectText(l).startsWith('Essence'));
    expect(collectText(essence)).toContain('(…)');
    expect(collectText(essence)).not.toContain('(412)');
  });

  it('`facetCounts` absent (filtre de classe T ou pas encore recalculé) : aucune parenthèse, jamais `(0)` par défaut', () => {
    const vnode = CheckboxList({ def: fuelType, value: undefined, disabled: false, onChange: NOOP });
    const labels = findAll(vnode, (n) => n.type === 'label');
    const essence = labels.find((l) => collectText(l).startsWith('Essence'));
    expect(collectText(essence)).not.toContain('(');
  });
});
