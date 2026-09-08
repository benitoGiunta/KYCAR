/**
 * Sonde de revue D5 — `EX-SCR-101` (`D8-31`, mineur isolé de `FINAL-VERIFICATION.md` §3.2(d))
 * =================================================================================================
 * « Le bandeau ne se réinitialise jamais tout seul. Ni sur navigation, ni sur erreur, ni sur
 * changement de snapshot. Si un filtre devient invalide après un changement de snapshot (par
 * exemple un `modelId` disparu), il est **conservé**, marqué en ambre avec l'infobulle
 * `Ce modèle est absent du snapshot du <date>` et **compté séparément** : `1 filtre sans effet`. »
 *
 * État avant correction (`REMEDIATION-2.8.md` §7.1 point 3) : `grep -rn 'sans effet' src/` → aucune
 * occurrence ; `corrections.ts` documente NOMMÉMENT son absence de validation référentielle
 * (« elle exige `ReferenceData` et est du ressort du composant appelant ») et personne ne la faisait.
 * Un `mmmv` désignant un `makeId`/`modelId` absent de la taxonomie servie restait donc posé,
 * silencieux, sans effet et sans mention — exactement le défaut visé.
 *
 * Deux volets, tous deux sondés ici :
 *   1. la fonction PURE `ineffectiveFilters(selection, contexte)` (`src/state/ineffective-filters.ts`) ;
 *   2. le RENDU de la zone (4) (`ActiveFilterTokens`, appelé directement — composant sans hook,
 *      même convention que `facet-counts.test.ts`) : rangée ambre `data-ineffective="true"`,
 *      infobulle au format EXACT, compteur singulier/pluriel, et filtre JAMAIS retiré.
 */
import { describe, expect, it } from 'vitest';

import { ActiveFilterTokens } from '../../../src/components/filters/ActiveFilterTokens';
import {
  formatSnapshotDateFrBE,
  ineffectiveFilterCountLabel,
  ineffectiveFilters,
  type IneffectiveContext,
} from '../../../src/state/ineffective-filters';
import type { SelectionState } from '../../../src/state/filter-types';

/* ---- Outillage VNode (copie locale, même convention que `facet-counts.test.ts`) ---------------- */

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
function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isVNode(node)) return collectText(node.props.children);
  return '';
}

/* ---- Fixtures : une taxonomie de snapshot minimale ---------------------------------------------
 * `ineffectiveFilters` ne prend QUE les deux index dont il a besoin (`makeById`, `modelByKey`) :
 * la sonde n'a donc pas à fabriquer un `ReferenceData` complet, et le contrat testé est celui que
 * la coquille pourra satisfaire avec l'objet qu'elle détient déjà (`props.referenceData`).
 * ---------------------------------------------------------------------------------------------- */

const TAXONOMY: IneffectiveContext['taxonomy'] = {
  makeById: new Map([
    [54, { label: 'Opel' }],
    [74, { label: 'Volkswagen' }],
  ]),
  modelByKey: new Map([
    ['54:1918', { label: 'Corsa' }],
    ['74:2084', { label: 'Golf' }],
  ]),
};

const SNAPSHOT_DATE = '2026-09-02T10:00:00.000Z';
const CONTEXT: IneffectiveContext = { taxonomy: TAXONOMY, snapshotDate: SNAPSHOT_DATE };
const NOOP = (): void => {};

describe('R-D5-2.8-01 — EX-SCR-101 : `ineffectiveFilters` identifie les filtres sans effet', () => {
  it('un `modelId` absent de la taxonomie du snapshot est signalé, avec le message NORMATIF', () => {
    const selection: SelectionState = { makesModelsVariants: '54|9999' };
    const out = ineffectiveFilters(selection, CONTEXT);
    expect(out.ids).toEqual(['makesModelsVariants']);
    expect(out.reasons).toHaveLength(1);
    expect(out.reasons[0]?.kind).toBe('MISSING_MODEL');
    expect(out.reasons[0]?.message).toBe('Ce modèle est absent du snapshot du 02/09/2026');
    // Le jeton visé est celui du NIVEAU modèle (`labels.ts#formatMmmvTokens`), pas celui de la marque.
    expect(out.reasons[0]?.tokenKey).toBe('makesModelsVariants:model');
  });

  it('un `makeId` absent est signalé lui aussi, et emporte le niveau modèle (un seul filtre compté)', () => {
    const selection: SelectionState = { makesModelsVariants: '9999|1' };
    const out = ineffectiveFilters(selection, CONTEXT);
    expect(out.ids).toEqual(['makesModelsVariants']);
    expect(out.reasons).toHaveLength(1);
    expect(out.reasons[0]?.kind).toBe('MISSING_MAKE');
    expect(out.reasons[0]?.message).toBe('Cette marque est absente du snapshot du 02/09/2026');
    expect(out.reasons[0]?.tokenKey).toBe('makesModelsVariants:make');
  });

  it('une sélection entièrement valide ne produit AUCUN constat (aucun faux positif)', () => {
    const selection: SelectionState = {
      makesModelsVariants: '54|1918',
      fuelType: ['B', 'D'],
      priceTo: 20000,
    };
    expect(ineffectiveFilters(selection, CONTEXT)).toEqual({ ids: [], reasons: [] });
  });

  it('une sélection vide ne produit AUCUN constat', () => {
    expect(ineffectiveFilters({}, CONTEXT)).toEqual({ ids: [], reasons: [] });
  });

  it('sans taxonomie fournie, AUCUN filtre n’est déclaré sans effet (jamais d’ambre par défaut)', () => {
    const selection: SelectionState = { makesModelsVariants: '9999|1' };
    expect(ineffectiveFilters(selection, { snapshotDate: SNAPSHOT_DATE })).toEqual({ ids: [], reasons: [] });
  });

  it('sans date de snapshot, le message reste formé et ne fabrique JAMAIS une date', () => {
    const out = ineffectiveFilters({ makesModelsVariants: '54|9999' }, { taxonomy: TAXONOMY });
    expect(out.reasons[0]?.message).toBe('Ce modèle est absent du snapshot courant');
  });

  it('la date est formatée `fr-BE` en `JJ/MM/AAAA`', () => {
    expect(formatSnapshotDateFrBE('2026-09-02T10:00:00.000Z')).toBe('02/09/2026');
    expect(formatSnapshotDateFrBE('pas-une-date')).toBeNull();
    expect(formatSnapshotDateFrBE(undefined)).toBeNull();
  });

  it('le compteur suit le singulier/pluriel d’`EX-SCR-101` et disparaît à zéro', () => {
    expect(ineffectiveFilterCountLabel(0)).toBeNull();
    expect(ineffectiveFilterCountLabel(1)).toBe('1 filtre sans effet');
    expect(ineffectiveFilterCountLabel(3)).toBe('3 filtres sans effet');
  });
});

describe('R-D5-2.8-02 — EX-SCR-101 : la zone (4) marque en ambre, conserve, et compte à part', () => {
  const selection: SelectionState = { makesModelsVariants: '54|9999', priceTo: 20000 };
  const render = () =>
    ActiveFilterTokens({
      selection,
      referenceData: TAXONOMY as never,
      snapshotDate: SNAPSHOT_DATE,
      onRemove: NOOP,
      onClearAll: NOOP,
      onRemovePartial: NOOP,
      onNarrow: NOOP,
    });

  it('le jeton devenu sans effet porte `data-ineffective="true"` (rendu ambre)', () => {
    const items = findAll(render(), (n) => n.type === 'li');
    const flagged = items.filter((n) => n.props['data-ineffective'] === 'true');
    expect(flagged).toHaveLength(1);
    // Marquage visuel dédié, distinct du jeton ordinaire (classe CSS `filter-band.css`).
    expect(String(flagged[0]?.props.class)).toContain('kycar-token--ineffective');
  });

  it('l’infobulle est au format EXACT de l’exigence, et référencée par `aria-describedby`', () => {
    const vnode = render();
    const flagged = findAll(vnode, (n) => n.type === 'li' && n.props['data-ineffective'] === 'true')[0];
    expect(flagged?.props.title).toBe('Ce modèle est absent du snapshot du 02/09/2026');
    const describedBy = String(flagged?.props['aria-describedby'] ?? '');
    expect(describedBy.length).toBeGreaterThan(0);
    const description = findAll(vnode, (n) => n.props.id === describedBy)[0];
    expect(collectText(description)).toBe('Ce modèle est absent du snapshot du 02/09/2026');
  });

  it('le filtre est CONSERVÉ : les deux jetons restent rendus, aucun retrait automatique', () => {
    // NB : Preact sort `key` du sac de props (il vit sur le VNode) — on filtre donc sur la classe.
    const items = findAll(render(), (n) => n.type === 'li' && String(n.props.class ?? '').includes('kycar-token'));
    const texts = items.map((n) => collectText(n));
    expect(texts.some((t) => t.includes('Opel'))).toBe(true);
    expect(texts.some((t) => t.includes('Modèle nº 9999'))).toBe(true);
  });

  it('le compteur « n filtre(s) sans effet » est DISTINCT du compteur de filtres actifs', () => {
    const vnode = render();
    const counter = findAll(vnode, (n) => String(n.props.class ?? '').includes('kycar-active-tokens__ineffective'))[0];
    expect(collectText(counter)).toBe('1 filtre sans effet');
    const summary = findAll(vnode, (n) => String(n.props.class ?? '').includes('kycar-active-tokens__summary'))[0];
    expect(collectText(summary)).toContain('filtres actifs');
    expect(collectText(summary)).not.toContain('sans effet');
  });

  it('le pluriel du compteur suit le nombre de FILTRES sans effet, pas de jetons', () => {
    const vnode = ActiveFilterTokens({
      selection: { makesModelsVariants: '9999|8888' },
      referenceData: TAXONOMY as never,
      snapshotDate: SNAPSHOT_DATE,
      onRemove: NOOP,
      onClearAll: NOOP,
      onRemovePartial: NOOP,
      onNarrow: NOOP,
    });
    // Marque ET modèle absents = UN filtre (`makesModelsVariants`) sans effet, pas deux.
    const counter = findAll(vnode, (n) => String(n.props.class ?? '').includes('kycar-active-tokens__ineffective'))[0];
    expect(collectText(counter)).toBe('1 filtre sans effet');
  });

  it('sans `snapshotDate` ni taxonomie, le rendu est INCHANGÉ (non-régression E2E)', () => {
    const vnode = ActiveFilterTokens({
      selection,
      onRemove: NOOP,
      onClearAll: NOOP,
      onRemovePartial: NOOP,
      onNarrow: NOOP,
    });
    expect(findAll(vnode, (n) => n.props['data-ineffective'] === 'true')).toHaveLength(0);
    expect(
      findAll(vnode, (n) => String(n.props.class ?? '').includes('kycar-active-tokens__ineffective')),
    ).toHaveLength(0);
  });
});
