/**
 * Revue D6 — item 4 : `ADV-14` — la zone-modèle `modelId = 0` (« Modèle non identifié »).
 * =================================================================================================
 * `ARB-59` (BLOQUANT) : décision — une route DÉDIÉE (`/marche/:makeId-:makeSlug/0-modele-non-
 * identifie`), la zone-modèle reste ENTIÈREMENT CLIQUABLE (jamais une zone morte), et n'entre jamais
 * dans la sélection de comparaison. `EX-SCR-113`/`118` (annexe B) portent la même décision. La route
 * elle-même est hors périmètre D6 (`src/app/navigation.ts`, D8) : ce fichier vérifie ce que D6
 * possède réellement — le modèle de vue (`view-model.ts`) et le composant `ModelZone.tsx`, ce
 * dernier SANS hooks Preact, donc appelable directement et inspectable sans DOM (VNode brut).
 */
import { describe, expect, it } from 'vitest';

import type { MetricRange, ModelAggregate } from '../../../src/providers/DataProvider';
import { MODEL_ID_UNRESOLVED } from '../../../src/types/sentinels';
import { buildModelZoneViewModel, MODEL_NON_IDENTIFIE_LABEL, MODEL_NON_IDENTIFIE_SLUG } from '../../../src/screens/market/view-model';
import { compareModelRows, sortModelRows } from '../../../src/screens/market/sort';
import { ModelZone } from '../../../src/screens/market/ModelZone';

function range(partial: Partial<MetricRange> = {}): MetricRange {
  return { min: null, max: null, p05: null, p50: null, p95: null, n: 0, ...partial };
}
function modelAgg(partial: Partial<ModelAggregate> & { modelId: number }): ModelAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, ...partial };
}

describe('ADV-14/ARB-59 — clé réservée modelId = 0, côté modèle de vue', () => {
  it('MODEL_ID_UNRESOLVED === 0, et le modèle de vue porte le libellé/slug canoniques', () => {
    expect(MODEL_ID_UNRESOLVED).toBe(0);
    const vm = buildModelZoneViewModel(modelAgg({ modelId: 0, listingCount: 7 }), undefined, 7, false);
    expect(vm.isUnresolved).toBe(true);
    expect(vm.label).toBe(MODEL_NON_IDENTIFIE_LABEL);
    expect(vm.slug).toBe(MODEL_NON_IDENTIFIE_SLUG);
  });

  it('EX-SCR-121/EX-DATA-72 : la clé 0 est toujours en dernier, même avec l’effectif le plus élevé', () => {
    const ordered = sortModelRows([
      { modelId: 0, label: MODEL_NON_IDENTIFIE_LABEL, listingCount: 999999 },
      { modelId: 12, label: 'Astra', listingCount: 1 },
    ]);
    expect(ordered.map((r) => r.modelId)).toEqual([12, 0]);
    expect(compareModelRows({ modelId: 1, label: 'A', listingCount: 0 }, { modelId: 0, label: MODEL_NON_IDENTIFIE_LABEL, listingCount: 0 })).toBeLessThan(0);
  });
});

describe('ADV-14/ARB-59 — ModelZone.tsx : entièrement cliquable, jamais dans la sélection de comparaison', () => {
  function zoneVm(modelId: number) {
    return buildModelZoneViewModel(modelAgg({ modelId, listingCount: 42, price: range({ p05: 1000, p95: 2000, n: 42 }) }), undefined, 42, false);
  }

  // D8-14 (a11y, nested-interactive) : le `role="button"` est porté par un DESCENDANT
  // (`.kycar-market-zone-interactive`), la racine n'étant plus qu'un conteneur de mise en page.
  type VNodeLike = { type: unknown; props: Record<string, unknown> };
  function interactiveNodeOf(node: unknown): VNodeLike {
    const v = node as VNodeLike;
    if (v.props.role === 'button') return v;
    const children = v.props['children'];
    for (const child of Array.isArray(children) ? children : [children]) {
      if (child !== null && typeof child === 'object') {
        const found = interactiveNodeOf(child);
        if (found.props.role === 'button') return found;
      }
    }
    return v;
  }

  it("le nœud interactif porte role='button'/tabIndex=0 pour modelId=0 EXACTEMENT comme pour un modèle résolu (pas de zone morte)", () => {
    let selected: [number, number] | undefined;
    const vnode0 = interactiveNodeOf(
      ModelZone({
        zone: zoneVm(0),
        onSelect: (makeId, modelId) => {
          selected = [makeId, modelId];
        },
        isInCompareSelection: false,
        compareAtCapacity: false,
      }),
    );
    const vnodeResolved = interactiveNodeOf(
      ModelZone({
        zone: zoneVm(11),
        onSelect: () => undefined,
        isInCompareSelection: false,
        compareAtCapacity: false,
      }),
    );

    expect(vnode0.props.role).toBe('button');
    expect(vnode0.props.tabIndex).toBe(0);
    expect(vnode0.props.role).toBe(vnodeResolved.props.role);
    expect(vnode0.props.tabIndex).toBe(vnodeResolved.props.tabIndex);

    // Le clic déclenche bien la navigation (le composant n'annule jamais onSelect pour modelId=0).
    (vnode0.props.onClick as () => void)();
    expect(selected).toEqual([1, 0]);
  });

  it("EX-SCR-118 : aucune case de comparaison (checkbox) n'est rendue pour modelId=0", () => {
    function hasCheckbox(node: unknown): boolean {
      if (node === null || node === undefined || typeof node !== 'object') return false;
      const v = node as { type?: unknown; props?: { children?: unknown; type?: unknown } };
      if (v.type === 'input' && v.props?.type === 'checkbox') return true;
      const children = v.props?.children;
      if (Array.isArray(children)) return children.some(hasCheckbox);
      return hasCheckbox(children);
    }
    const vnode0 = ModelZone({
      zone: zoneVm(0),
      onSelect: () => undefined,
      onToggleCompare: () => undefined,
      isInCompareSelection: false,
      compareAtCapacity: false,
    });
    const vnodeResolved = ModelZone({
      zone: zoneVm(11),
      onSelect: () => undefined,
      onToggleCompare: () => undefined,
      isInCompareSelection: false,
      compareAtCapacity: false,
    });
    expect(hasCheckbox(vnode0)).toBe(false);
    expect(hasCheckbox(vnodeResolved)).toBe(true); // preuve que le test sait détecter une case si présente
  });
});
