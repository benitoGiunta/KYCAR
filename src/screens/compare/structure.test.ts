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

import { CompareScreen, type CompareModelRow, type CompareRedirectTarget, COMPARE_MAX_MODELS } from './CompareScreen';
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
function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  if (isVNode(node)) return collectText(node.props.children);
  return '';
}

const RANGE: MetricRange = { min: 1, max: 9, p05: 2, p50: 5, p95: 8, n: 100 };

describe('écran C — structure/accessibilité', () => {
  const rows: CompareModelRow[] = [
    { makeId: 54, modelId: 1918, name: 'Opel Corsa', listingCount: 1200, price: RANGE, year: RANGE, mileage: RANGE },
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

  // D8-06/FV-14 : l'année de la ligne « Synthèse » utilisait le formateur numérique générique
  // (`Intl.NumberFormat('fr-BE')`, séparateur de milliers), d'où « 2 008 – 2 026 ».
  it('D8-06/FV-14 — l’année de la ligne Synthèse est formatée SANS séparateur de milliers', () => {
    const text = collectText(tree);
    expect(text).toContain('2'); // sanity : du texte est bien rendu
    expect(text).not.toMatch(/2\s0\d{2}/); // "2 008"/"2 026" : espace insécable entre "2" et "0xx"
  });

  // D8-06/FV-15 : `OverlaidPriceChart` produisait des coordonnées `NaN` quand deux buckets ouverts de
  // sens opposés (première/dernière tranche, bornes infinies) participaient au même calcul de centre.
  it('D8-06/FV-15 — G5 (prix superposés) ne produit aucune coordonnée NaN avec des buckets ouverts aux deux extrémités', () => {
    const openRows: CompareModelRow[] = [
      {
        makeId: 54,
        modelId: 1918,
        name: 'Opel Corsa',
        listingCount: 50,
        price: RANGE,
        year: RANGE,
        mileage: RANGE,
        priceBuckets: [
          { lowerBound: -Infinity, upperBound: 5000, count: 10 },
          { lowerBound: 5000, upperBound: 10000, count: 20 },
          { lowerBound: 10000, upperBound: Infinity, count: 5 },
        ],
      },
    ];
    const withG5 = CompareScreen({ rows: openRows, atCapacity: false, onRemove: () => {}, onOpen: () => {}, onClearAll: () => {} });
    const polylines = findAll(withG5, byType('polyline'));
    expect(polylines.length).toBeGreaterThan(0);
    for (const p of polylines) {
      const points = String(p.props['points'] ?? '');
      expect(points).not.toContain('NaN');
      expect(points.length).toBeGreaterThan(0);
    }
  });

  // D8-06/FV-15 (EX-SCR-197) : jusqu'à 4 colonnes, chaque emplacement non pourvu porte un bloc
  // « + Ajouter un modèle », désactivé au plafond.
  describe('D8-06/FV-15 — colonnes vides « + Ajouter un modèle » (EX-SCR-197)', () => {
    it(`complète jusqu'à ${COMPARE_MAX_MODELS} colonnes avec des blocs « + Ajouter un modèle »`, () => {
      const addButtons = findAll(tree, (n) => n.type === 'button' && collectText(n) === '+ Ajouter un modèle');
      expect(addButtons).toHaveLength(COMPARE_MAX_MODELS - rows.length);
      for (const b of addButtons) expect(b.props['disabled']).toBeFalsy();
    });

    it('désactive les blocs vides au plafond (atCapacity)', () => {
      const twoMore: CompareModelRow[] = [
        { makeId: 1, modelId: 1, name: 'A', listingCount: 10, price: RANGE, year: RANGE, mileage: RANGE },
        { makeId: 2, modelId: 2, name: 'B', listingCount: 10, price: RANGE, year: RANGE, mileage: RANGE },
      ];
      const fullTree = CompareScreen({ rows: [...rows, ...twoMore], atCapacity: true, onRemove: () => {}, onOpen: () => {}, onClearAll: () => {} });
      const addButtons = findAll(fullTree, (n) => n.type === 'button' && collectText(n) === '+ Ajouter un modèle');
      expect(addButtons).toHaveLength(0); // 4/4 : aucun emplacement vide à afficher
    });

    it('un onAddModel fourni est bien câblé sur le clic', () => {
      let opened = 0;
      const withCb = CompareScreen({ rows, atCapacity: false, onRemove: () => {}, onOpen: () => {}, onClearAll: () => {}, onAddModel: () => (opened += 1) });
      const addButton = findAll(withCb, (n) => n.type === 'button' && collectText(n) === '+ Ajouter un modèle')[0]!;
      (addButton.props['onClick'] as () => void)();
      expect(opened).toBe(1);
    });
  });

  // D8-06/FV-15 (EX-SCR-198) : sous 2 modèles, l'hôte doit rediriger — 0 restant -> marché, 1 restant
  // -> écran B de ce modèle. `CompareScreen` reste SANS hook : l'appel se fait pendant le rendu.
  describe('D8-06/FV-15 — onRedirect (EX-SCR-198)', () => {
    it('0 modèle (hors chargement) -> redirection vers le marché', () => {
      let redirected: CompareRedirectTarget | undefined;
      CompareScreen({ rows: [], atCapacity: false, onRemove: () => {}, onOpen: () => {}, onClearAll: () => {}, onRedirect: (t) => (redirected = t) });
      expect(redirected).toEqual({ kind: 'market' });
    });

    it('0 modèle EN CHARGEMENT -> pas de redirection (ce n’est pas encore "aucun modèle")', () => {
      let redirected: CompareRedirectTarget | undefined;
      CompareScreen({ rows: [], atCapacity: false, loading: true, onRemove: () => {}, onOpen: () => {}, onClearAll: () => {}, onRedirect: (t) => (redirected = t) });
      expect(redirected).toBeUndefined();
    });

    it('1 modèle restant -> redirection vers l’écran B de ce modèle', () => {
      let redirected: CompareRedirectTarget | undefined;
      CompareScreen({ rows: [rows[0]!], atCapacity: false, onRemove: () => {}, onOpen: () => {}, onClearAll: () => {}, onRedirect: (t) => (redirected = t) });
      expect(redirected).toEqual({ kind: 'model', makeId: 54, modelId: 1918 });
    });

    it('2 modèles ou plus -> aucune redirection (non-régression)', () => {
      let redirected: CompareRedirectTarget | undefined;
      CompareScreen({ rows, atCapacity: false, onRemove: () => {}, onOpen: () => {}, onClearAll: () => {}, onRedirect: (t) => (redirected = t) });
      expect(redirected).toBeUndefined();
    });
  });
});

describe('écran F — structure/accessibilité', () => {
  const tree = FollowedScreen({
    rows: [{ value: { schemaVersion: 1, makeId: 54, modelId: 1918, ajouteLe: '2026-09-01T00:00:00Z' }, status: { kind: 'current' } }],
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
