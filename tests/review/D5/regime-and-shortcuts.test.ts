/**
 * Sonde de revue D5 — `D8-15` (`FV-19`) : régimes responsive du bandeau (`EX-SCR-96` intermédiaire,
 * `EX-SCR-97` compact, `EX-SCR-98` paliers en liste déroulante), raccourci `/` (`EX-SCR-81`),
 * notification de retrait en cascade (`EX-SCR-73`) ; `D8-14`/`DR-139` résidu : formulaire
 * « Enregistrer la recherche » prérempli (`EX-SCR-94`).
 *
 * Numérotation confirmée par le coordinateur (correction reçue en cours de lot) : `EX-SCR-95` est
 * le bloc « Assainissement KYCAR », HORS PÉRIMÈTRE (dette produit ratifiée par D8-15) — ni le
 * raccourci ni la notification n'en relèvent, malgré la rédaction ambiguë de
 * `FIX-LEAD-DECISIONS-2.8.md` D8-15. Voir `reports/remediation-2.8/fix-state.md`.
 */
import { describe, expect, it } from 'vitest';

import {
  cascadeRemovalMessage,
  deferredApplyLabel,
  isTypingTarget,
} from '../../../src/components/filters/band-model';
import { buildActiveFilterTokens, buildSearchDescription } from '../../../src/components/filters/labels';
import { SaveSearchForm } from '../../../src/components/filters/SaveSearchForm';
import { RangeSteps } from '../../../src/components/filters/controls/RangeControl';
import { FILTER_BY_ID } from '../../../src/state/filter-registry';

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

describe('R-D5-30 — EX-SCR-81 : garde du raccourci `/` (focus déjà dans un champ de saisie)', () => {
  it('un `INPUT`/`TEXTAREA`/`SELECT` focalisé bloque le raccourci', () => {
    expect(isTypingTarget('INPUT', false)).toBe(true);
    expect(isTypingTarget('TEXTAREA', false)).toBe(true);
    expect(isTypingTarget('SELECT', false)).toBe(true);
    expect(isTypingTarget('input', false)).toBe(true); // insensible à la casse (tagName natif)
  });

  it('un élément `contenteditable` bloque le raccourci, quel que soit son tag', () => {
    expect(isTypingTarget('DIV', true)).toBe(true);
  });

  it('aucun champ de saisie focalisé (ou aucun focus) : le raccourci est autorisé', () => {
    expect(isTypingTarget('BODY', false)).toBe(false);
    expect(isTypingTarget('BUTTON', false)).toBe(false);
    expect(isTypingTarget(null, false)).toBe(false);
    expect(isTypingTarget(undefined, false)).toBe(false);
  });
});

describe('R-D5-31 — EX-SCR-73 : message de notification du retrait en cascade', () => {
  it('aucun retrait de cascade (tableau vide) : aucune notification', () => {
    expect(cascadeRemovalMessage([])).toBeNull();
  });

  it('les 9 filtres de leasing (même groupe) : « <n> filtres de <groupe> retirés »', () => {
    const leasingIds = [
      'leasingRateFrom', 'leasingRateTo', 'leasingDurationFrom', 'leasingDurationTo',
      'leasingYearlyIncludedMileageFrom', 'leasingTradeInBonus', 'leasingEnvironmentBonus',
      'leasingAvailableNow', 'leasingTargetGroup',
    ];
    const message = cascadeRemovalMessage(leasingIds);
    expect(message).toContain('9 filtres');
    expect(message).toContain('retirés');
  });

  it('un seul filtre retiré : accord au singulier, jamais « 1 filtres »', () => {
    const message = cascadeRemovalMessage(['radius']);
    expect(message).toMatch(/^1 filtre[^s]/);
  });

  it('des filtres de groupes différents (défensif) : repli générique sans nom de groupe', () => {
    const message = cascadeRemovalMessage(['radius', 'leasingRateFrom']);
    expect(message).toBe('2 filtres retirés');
  });
});

describe('R-D5-32 — EX-SCR-97 : libellé du bouton d’application différée (régime compact)', () => {
  it('effectif projeté connu : « Voir les <n> offres »', () => {
    expect(deferredApplyLabel(1281)).toBe('Voir les 1 281 offres');
    expect(deferredApplyLabel(1)).toBe('Voir les 1 offre');
  });

  it('effectif projeté inconnu (pas encore répondu) : libellé neutre, jamais un chiffre inventé', () => {
    expect(deferredApplyLabel(undefined)).toBe('Voir les résultats');
  });

  it('effectif projeté nul : ne délègue pas à `formatOfferCount` (« aucune offre » serait boiteux ici)', () => {
    expect(deferredApplyLabel(0)).not.toContain('aucune offre');
  });
});

describe('R-D5-34 — EX-SCR-98 : paliers en liste déroulante native en régime compact', () => {
  // `RangeControl` porte des hooks (`useState`) et ne peut donc pas être appelé directement par une
  // sonde (même contrainte que `ScreenG`/`FilterBand`) : `RangeSteps`, qu'il monte pour ses
  // paliers, a été extrait SANS hook exprès pour rester testable ici (même principe que
  // `ScreenGMakeRow`/`CheckboxList`).
  const priceFrom = FILTER_BY_ID.get('priceFrom')!;
  const steps = priceFrom.numericDomain?.steps ?? [];
  const NOOP = (): void => {};

  it('régime large (`compact` absent) : les paliers restent des boutons', () => {
    const vnode = RangeSteps({ steps, unit: priceFrom.unit, label: priceFrom.label, disabled: false, onPick: NOOP });
    expect(findAll(vnode, (n) => n.type === 'select')).toHaveLength(0);
    expect(findAll(vnode, (n) => n.type === 'button').length).toBeGreaterThan(0);
  });

  it('régime `compact` : les paliers sont une SEULE liste déroulante native, aucun bouton', () => {
    const vnode = RangeSteps({
      steps,
      unit: priceFrom.unit,
      label: priceFrom.label,
      disabled: false,
      compact: true,
      onPick: NOOP,
    });
    expect(vnode.type).toBe('select');
    const options = findAll(vnode, (n) => n.type === 'option');
    // +1 pour l'option de garde ("Palier suggéré…", value="").
    expect(options.length).toBe(steps.length + 1);
  });

  it('sélectionner un palier dans la liste déroulante compacte appelle `onPick` avec la valeur numérique', () => {
    let received: number | null = null;
    const vnode = RangeSteps({
      steps,
      unit: priceFrom.unit,
      label: priceFrom.label,
      disabled: false,
      compact: true,
      onPick: (step) => {
        received = step;
      },
    });
    (vnode.props.onChange as (e: unknown) => void)({ currentTarget: { value: '5000' } });
    expect(received).toBe(5000);
  });
});

describe('R-D5-33 — DR-139 résidu, EX-SCR-94 : description générée pour le formulaire d’enregistrement', () => {
  it('génère « Opel Corsa · … » depuis les jetons actifs, joints par « · »', () => {
    const tokens = buildActiveFilterTokens({ priceTo: 20000 });
    const description = buildSearchDescription(tokens);
    expect(description).toBe('Prix : ≤ 20 000 €');
  });

  it('tronque à 60 caractères avec une ellipse, jamais un nom plus long', () => {
    const tokens = buildActiveFilterTokens({ fuelType: ['B', 'D', 'E'], mileageTo: 100000, priceFrom: 5000 });
    const description = buildSearchDescription(tokens);
    expect(description.length).toBeLessThanOrEqual(60);
  });

  it('aucun filtre actif : un nom neutre horodaté, jamais un champ vide', () => {
    const description = buildSearchDescription([], new Date('2026-09-08'));
    expect(description.length).toBeGreaterThan(0);
    expect(description).not.toBe('');
  });

  it('SaveSearchForm : `Enregistrer` désactivé sur un nom vide/blanc, actif sinon', () => {
    const disabled = SaveSearchForm({ value: '   ', onChange: () => {}, onConfirm: () => {}, onCancel: () => {} });
    const submit = disabled.props.children.find(
      (c: { type: unknown; props: { type: unknown } }) => c.type === 'button' && c.props.type === 'submit',
    );
    expect(submit.props.disabled).toBe(true);

    const enabled = SaveSearchForm({
      value: 'Opel Corsa · ≤ 20 000 €',
      onChange: () => {},
      onConfirm: () => {},
      onCancel: () => {},
    });
    const submitEnabled = enabled.props.children.find(
      (c: { type: unknown; props: { type: unknown } }) => c.type === 'button' && c.props.type === 'submit',
    );
    expect(submitEnabled.props.disabled).toBe(false);
  });

  it('SaveSearchForm : la soumission avec un nom non vide appelle `onConfirm` avec le nom coupé (trim)', () => {
    let confirmed: string | null = null;
    const vnode = SaveSearchForm({
      value: '  Ma recherche  ',
      onChange: () => {},
      onConfirm: (name) => {
        confirmed = name;
      },
      onCancel: () => {},
    });
    const form = vnode;
    (form.props.onSubmit as (e: { preventDefault: () => void }) => void)({ preventDefault: () => {} });
    expect(confirmed).toBe('Ma recherche');
  });
});
