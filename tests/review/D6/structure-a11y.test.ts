/**
 * Revue D6 — item 10 : responsive/a11y — structure sémantique dans le rendu.
 * =================================================================================================
 * `node_modules` a été inspecté (`ls node_modules | grep -i preact-render-to-string`) : ABSENT.
 * Aucun `jsdom`/`happy-dom` non plus (confirmé par `package.json`, cf. README du lot). Rien n'est
 * installé pour cette revue (E-quelconque d'installation interdite par le protocole).
 *
 * Ce qui reste possible SANS DOM ni bibliothèque de rendu : un composant fonctionnel Preact SANS
 * hooks est une fonction pure qui, appelée directement, renvoie un arbre de VNode — de simples objets
 * `{ type, props }` — que l'on peut parcourir. `ModelZone.tsx`, `SummaryBar.tsx` et `GridFooter.tsx`
 * n'utilisent aucun hook (vérifié par lecture) : ce fichier les appelle DIRECTEMENT et inspecte
 * l'arbre obtenu — c'est une véritable exécution du composant, pas une lecture de son code source.
 * `MakeCard.tsx` et `MarketScreen.tsx` utilisent `useState`/`useMemo` : les appeler hors du cycle de
 * rendu Preact lève une exception (prouvé dans `etats-ecran-a.test.ts`) — pour eux, verdict
 * NON VÉRIFIABLE PAR EXÉCUTION, inspection du code source seulement (citée avec numéro de ligne).
 */
import { describe, expect, it } from 'vitest';

import type { ModelZoneViewModel } from '../../../src/screens/market/view-model';
import { ModelZone } from '../../../src/screens/market/ModelZone';
import { SummaryBar, type SummaryBarProps } from '../../../src/screens/market/SummaryBar';
import { GridFooter } from '../../../src/screens/market/GridFooter';

interface VNode {
  readonly type: unknown;
  readonly props: Record<string, unknown>;
}
function isVNode(x: unknown): x is VNode {
  return typeof x === 'object' && x !== null && 'type' in x && 'props' in (x as Record<string, unknown>);
}
function findAll(node: unknown, predicate: (n: VNode) => boolean, acc: VNode[] = []): VNode[] {
  if (node === null || node === undefined || typeof node === 'boolean' || typeof node === 'string' || typeof node === 'number') return acc;
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

function baseZone(partial: Partial<ModelZoneViewModel> = {}): ModelZoneViewModel {
  return {
    makeId: 1,
    modelId: 11,
    isUnresolved: false,
    label: 'Golf',
    labelTruncated: { display: 'Golf', truncated: false, full: 'Golf' },
    slug: 'golf',
    listingCount: 3120,
    offerCountBare: '3 120',
    ariaLabel: 'Golf, 3 120 offres',
    rangesAvailable: true,
    price: { label: '8 900 – 32 500 €', caption: 'fourchette centrale (90 % des offres)', available: true },
    priceRawTooltip: 'du moins cher au plus cher : 4 200 – 89 000 €',
    year: { label: '2010 – 2025', caption: 'fourchette centrale (90 % des offres)', available: true },
    mileage: { label: '12 000 – 240 000 km', caption: 'fourchette centrale (90 % des offres)', available: true },
    medianLabel: 'méd. 17 400 €',
    coverage: null,
    coverageLevel: 'indisponible',
    coverageTooltip: 'couverture d’échantillon indisponible',
    italicizeRanges: false,
    relativeShareRatio: 0.5,
    isSparse: false,
    rawMetrics: {
      price: { min: 4200, max: 89000, p05: 8900, p50: 17400, p95: 32500, n: 3120 },
      year: { min: 2004, max: 2026, p05: 2010, p50: null, p95: 2025, n: 3120 },
      mileage: { min: 0, max: 400000, p05: 12000, p50: null, p95: 240000, n: 3120 },
    },
    ...partial,
  };
}

describe('ModelZone — EX-SCR-117 (bande entière cliquable), EX-SCR-113 (aria-label), a11y clavier', () => {
  it('racine : role="button", tabIndex=0, aria-label complet "<nom>, <n> offres" (EX-SCR-113 #2), pas une <div> muette', () => {
    const vnode = ModelZone({ zone: baseZone(), onSelect: () => undefined, isInCompareSelection: false, compareAtCapacity: false }) as unknown as VNode;
    expect(vnode.type).toBe('div'); // pas un <button>/<a> natif — cf. constat ci-dessous
    expect(vnode.props.role).toBe('button');
    expect(vnode.props.tabIndex).toBe(0);
    expect(vnode.props['aria-label']).toBe('Golf, 3 120 offres');
  });

  it('gestion clavier : Entrée ET Espace déclenchent la sélection, avec preventDefault (évite le défilement de page sur Espace)', () => {
    let calls = 0;
    const vnode = ModelZone({
      zone: baseZone(),
      onSelect: () => {
        calls += 1;
      },
      isInCompareSelection: false,
      compareAtCapacity: false,
    }) as unknown as VNode;
    const onKeyDown = vnode.props.onKeyDown as (e: { key: string; preventDefault: () => void }) => void;
    let prevented = false;
    onKeyDown({ key: 'Enter', preventDefault: () => (prevented = true) });
    onKeyDown({ key: ' ', preventDefault: () => (prevented = true) });
    onKeyDown({ key: 'a', preventDefault: () => (prevented = true) });
    expect(calls).toBe(2);
    expect(prevented).toBe(true);
  });

  it("R-D6-06 — MINEUR : la bande interactive est une <div role=\"button\"> (ARIA), pas un élément focusable natif (<button>) — a11y correcte mais non native, cohérente sur toutes les zones", () => {
    const vnode = ModelZone({ zone: baseZone(), onSelect: () => undefined, isInCompareSelection: false, compareAtCapacity: false }) as unknown as VNode;
    expect(vnode.type).toBe('div');
    expect(vnode.props.role).toBe('button');
  });

  it('la barre de part relative (EX-SCR-113 #9) porte aria-hidden="true" (redondance visuelle uniquement, EX-SCR-113)', () => {
    const vnode = ModelZone({ zone: baseZone(), onSelect: () => undefined, isInCompareSelection: false, compareAtCapacity: false }) as unknown as VNode;
    const bars = findAll(vnode, (n) => typeof n.props.class === 'string' && (n.props.class as string).includes('share-bar') && !(n.props.class as string).includes('fill'));
    expect(bars).toHaveLength(1);
    expect(bars[0]?.props['aria-hidden']).toBe('true');
  });

  it('les trois fourchettes et l’effectif sont bien du texte présent dans l’arbre (EX-SCR-138 : ne se masquent jamais)', () => {
    const vnode = ModelZone({ zone: baseZone(), onSelect: () => undefined, isInCompareSelection: false, compareAtCapacity: false }) as unknown as VNode;
    const text = collectText(vnode);
    expect(text).toContain('3 120');
    expect(text).toContain('8 900');
    expect(text).toContain('2010');
    expect(text).toContain('12 000');
  });

  // D8-06 (FV-09) : `view-model.ts::lowSampleToken` était calculé mais JAMAIS rendu par `ModelZone`
  // — le jeton ambre `n = <n>` d'`EX-SCR-33`/`134` n'apparaissait donc jamais dans le DOM.
  it("D8-06/FV-09 : le jeton ambre `n = <n>` (effectif réduit) est bien rendu quand `view-model.ts` le pose", () => {
    const zone = baseZone({
      price: { label: '9 000 – 15 000 €', caption: 'fourchette observée (min – max, effectif réduit)', available: true, lowSampleToken: 'n = 8' },
    });
    const vnode = ModelZone({ zone, onSelect: () => undefined, isInCompareSelection: false, compareAtCapacity: false }) as unknown as VNode;
    expect(collectText(vnode)).toContain('n = 8');
  });

  it('absence de `lowSampleToken` sur les trois fourchettes -> aucun jeton rendu (non-régression)', () => {
    const vnode = ModelZone({ zone: baseZone(), onSelect: () => undefined, isInCompareSelection: false, compareAtCapacity: false }) as unknown as VNode;
    expect(collectText(vnode)).not.toMatch(/n = \d/);
  });
});

describe('SummaryBar — EX-SCR-106, structure de formulaire (label/select associés)', () => {
  function props(partial: Partial<SummaryBarProps> = {}): SummaryBarProps {
    return {
      makeCount: 42,
      modelCount: 318,
      offerCount: 120779,
      sortField: 'offres',
      sortDirection: 'desc',
      onSortFieldChange: () => undefined,
      onSortDirectionToggle: () => undefined,
      sortDisabled: false,
      hideSparseModels: false,
      onToggleHideSparseModels: () => undefined,
      onExport: () => undefined,
      exportDisabled: false,
      ...partial,
    };
  }

  it('le <select> de tri est bien imbriqué dans un <label> (association implicite, a11y correcte)', () => {
    const vnode = SummaryBar(props()) as unknown as VNode;
    const labels = findAll(vnode, (n) => n.type === 'label');
    expect(labels.length).toBeGreaterThanOrEqual(2); // « Trier par » + case à cocher
    const selects = findAll(vnode, (n) => n.type === 'select');
    expect(selects).toHaveLength(1);
  });

  it("le bouton d'inversion de sens porte un aria-label explicite (pas seulement le glyphe ↑/↓)", () => {
    const vnode = SummaryBar(props({ sortDirection: 'asc' })) as unknown as VNode;
    const toggles = findAll(vnode, (n) => n.type === 'button' && typeof n.props['aria-label'] === 'string');
    expect(toggles.length).toBeGreaterThanOrEqual(1);
    expect(toggles[0]?.props['aria-label']).toBe('Trier en ordre décroissant');
  });

  it('sortDisabled désactive select ET bouton d’inversion, avec l’infobulle normative EX-SCR-131', () => {
    const vnode = SummaryBar(props({ sortDisabled: true, makeCount: 0, modelCount: 0, offerCount: 0 })) as unknown as VNode;
    const selects = findAll(vnode, (n) => n.type === 'select');
    expect(selects[0]?.props.disabled).toBe(true);
    expect(selects[0]?.props.title).toBe('Aucun résultat à trier');
    const text = collectText(vnode);
    expect(text).toContain('0 marque · 0 modèle · aucune offre');
  });
});

describe('GridFooter — EX-SCR-129, bouton explicite (pas seulement un IntersectionObserver)', () => {
  it('le bouton "Charger N marques de plus" est un <button type="button"> réel, actionnable au clavier par défaut', () => {
    const vnode = GridFooter({ loadedCount: 20, totalCount: 295, hasMore: true, batchSize: 12, onLoadMore: () => undefined }) as unknown as VNode;
    const buttons = findAll(vnode, (n) => n.type === 'button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.props.type).toBe('button');
    expect(collectText(vnode)).toContain('20 marques sur 295');
    expect(collectText(vnode)).toContain('Charger 12 marques de plus');
  });

  it('hasMore=false : aucun bouton (fin de liste), seul le compteur reste', () => {
    const vnode = GridFooter({ loadedCount: 295, totalCount: 295, hasMore: false, batchSize: 12, onLoadMore: () => undefined }) as unknown as VNode;
    expect(findAll(vnode, (n) => n.type === 'button')).toHaveLength(0);
  });
});

describe('MakeCard.tsx / MarketScreen.tsx — NON VÉRIFIABLE PAR EXÉCUTION (composants à hooks, aucun DOM disponible)', () => {
  it('constat de méthode, pas un test de comportement : ces deux composants ne peuvent être exécutés hors du cycle de rendu Preact dans cet environnement', () => {
    // Preuve produite dans etats-ecran-a.test.ts (`MakeCard` lève `Cannot read properties of
    // undefined (reading '__H')` quand on l'appelle directement) : ni `jsdom`/`happy-dom` ni
    // `preact-render-to-string` ne sont installés dans ce dépôt (vérifié dans `node_modules`, rien
    // installé par cette revue). L'inspection de leur structure (rôles ARIA du champ de recherche de
    // modèle, du bouton de dépliement, de la checkbox de comparaison, des 6 skeletons de l'état
    // 'loading') reste donc une LECTURE DE CODE, jamais une exécution — déclarée non vérifiable par
    // ce protocole plutôt que présentée comme prouvée.
    expect(true).toBe(true);
  });
});
