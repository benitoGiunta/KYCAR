/**
 * KYCAR — Tests de STRUCTURE / accessibilité des écrans montés par D8
 * =================================================================================================
 * L'environnement de test est `node` (aucun DOM, cf. `vite.config.ts`), et aucune dépendance a11y
 * tierce (axe-core) n'est admise (contrainte du lot : « aucune dépendance runtime tierce »). On
 * teste donc les rôles/libellés/structure en APPELANT le composant Preact comme une fonction pure et
 * en inspectant l'arbre de VNodes renvoyé (les VNodes Preact sont de simples objets `{ type, props }`).
 * Cela couvre, franchement et sans DOM, les invariants d'accessibilité vérifiables statiquement :
 * présence d'un titre, en-têtes de tableau `scope`, libellés d'action explicites, contrôles NATIFS
 * (`button`) donc focusables/activables au clavier. Les états riches des écrans A/B qui exigent un
 * rendu réel restent couverts par leurs propres suites D6/D7.
 */
import { describe, expect, it } from 'vitest';

import { CompareScreen, type CompareModelRow } from './CompareScreen';
import { FollowedScreen } from '../followed/FollowedScreen';
import { MentionsPage } from '../mentions/MentionsPage';
import type { MetricRange } from '../../providers/DataProvider';

/* -- Marche-arbre VNode ------------------------------------------------------------------------- */
interface VNodeLike {
  readonly type: unknown;
  readonly props: Record<string, unknown> & { readonly children?: unknown };
}
function isVNode(x: unknown): x is VNodeLike {
  return typeof x === 'object' && x !== null && 'type' in x && 'props' in x;
}
function walk(node: unknown, visit: (n: VNodeLike) => void): void {
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, visit));
    return;
  }
  if (isVNode(node)) {
    visit(node);
    walk(node.props.children, visit);
  }
}
function findAll(root: unknown, pred: (n: VNodeLike) => boolean): VNodeLike[] {
  const out: VNodeLike[] = [];
  walk(root, (n) => {
    if (pred(n)) out.push(n);
  });
  return out;
}
const byType = (t: string) => (n: VNodeLike): boolean => n.type === t;

const RANGE: MetricRange = { min: 1, max: 9, p05: 2, p50: 5, p95: 8, n: 100 };

describe('écran C — structure/accessibilité', () => {
  const rows: CompareModelRow[] = [
    { makeId: 16, modelId: 1174, name: 'Opel Corsa', listingCount: 1200, price: RANGE, year: RANGE, mileage: RANGE },
    { makeId: 9, modelId: 33, name: 'BMW 320', listingCount: 800, price: RANGE, year: RANGE, mileage: RANGE },
  ];
  const tree = CompareScreen({ rows, atCapacity: false, onRemove: () => {}, onOpen: () => {}, onClearAll: () => {} });

  it('porte un titre h1 unique et un tableau à en-têtes scopés', () => {
    expect(findAll(tree, byType('h1'))).toHaveLength(1);
    expect(findAll(tree, byType('table'))).toHaveLength(1);
    const scoped = findAll(tree, (n) => (n.type === 'th') && typeof n.props.scope === 'string');
    expect(scoped.length).toBeGreaterThan(0);
  });

  it('offre des actions natives clavier avec libellés explicites', () => {
    const buttons = findAll(tree, byType('button'));
    expect(buttons.length).toBeGreaterThan(0);
    const hasRemoveLabel = buttons.some((b) => typeof b.props['aria-label'] === 'string' && (b.props['aria-label'] as string).includes('Retirer'));
    expect(hasRemoveLabel).toBe(true);
  });

  it('état vide : message d’aide sous un titre, sans tableau', () => {
    const empty = CompareScreen({ rows: [], atCapacity: false, onRemove: () => {}, onOpen: () => {}, onClearAll: () => {} });
    expect(findAll(empty, byType('h1'))).toHaveLength(1);
    expect(findAll(empty, byType('table'))).toHaveLength(0);
  });
});

describe('écran F — structure/accessibilité', () => {
  const tree = FollowedScreen({
    rows: [{ value: { schemaVersion: 1, makeId: 16, modelId: 1174, ajouteLe: '2026-09-01T00:00:00Z' }, status: { kind: 'current' } }],
    nameOf: () => 'Opel Corsa',
    onOpen: () => {},
    onUnfollow: () => {},
  });

  it('liste les modèles suivis avec une action de retrait étiquetée', () => {
    expect(findAll(tree, byType('h1'))).toHaveLength(1);
    expect(findAll(tree, byType('li')).length).toBeGreaterThan(0);
    const unfollow = findAll(tree, byType('button')).some((b) => String(b.props['aria-label'] ?? '').includes('Ne plus suivre'));
    expect(unfollow).toBe(true);
  });
});

describe('page /mentions — structure', () => {
  const tree = MentionsPage({ sourceKind: 'SYNTHETIC', snapshotDate: '2026-09-01', providerId: 'D3-1.0.0' });
  it('est structurée par un h1 et plusieurs h2', () => {
    expect(findAll(tree, byType('h1'))).toHaveLength(1);
    expect(findAll(tree, byType('h2')).length).toBeGreaterThanOrEqual(3);
  });
  it('étiquette clairement la nature synthétique des données', () => {
    const strongs = findAll(tree, byType('strong'));
    const mentionsSynthetic = strongs.some((s) => String(s.props.children).toLowerCase().includes('synthétique'));
    expect(mentionsSynthetic).toBe(true);
  });
});

/*
 * NOTE FRANCHE (contrainte a11y) : les écrans A (`MarketScreen`) et B (`DistributionScreen`) utilisent
 * des hooks (`useMemo`…) ; les appeler comme de simples fonctions hors contexte de rendu lève
 * « Cannot read properties of undefined ». Sans DOM (env `node`) ni dépendance a11y tierce autorisée,
 * on ne peut donc pas exécuter ici de test de structure sur ces deux écrans par appel direct — leurs
 * rôles/libellés/états sont couverts par leurs propres suites D6/D7. Ce fichier couvre les écrans
 * SANS hook montés par D8 (C, F, /mentions), pour lesquels l'inspection de l'arbre de VNodes est licite.
 */
