/**
 * Revue D8 — sonde n°6 : ÉCRANS C / E / F et page /mentions — états dégradés (6 par écran, ARB-51)
 * et contenu requis. Technique : appel des composants sans hook comme fonctions pures et inspection
 * de l'arbre de VNodes (même technique que `src/screens/compare/structure.test.ts`, env node).
 * NB : `SavedSearchesScreen` délègue chaque carte à un sous-composant à hooks (`SavedRow`) ; seules
 * ses parties sans hook sont inspectables ici (liste vide, panneau récent, structure).
 */
import { describe, expect, it } from 'vitest';

import { CompareScreen, type CompareModelRow } from '../../../src/screens/compare/CompareScreen';
import { SavedSearchesScreen } from '../../../src/screens/saved/SavedSearchesScreen';
import { FollowedScreen } from '../../../src/screens/followed/FollowedScreen';
import { MentionsPage } from '../../../src/screens/mentions/MentionsPage';
import type { MetricRange } from '../../../src/providers/DataProvider';

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
/** Concatène tout le texte de l'arbre (chaînes et nombres). */
function textOf(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  if (isVNode(node)) {
    const own = Object.entries(node.props)
      .filter(([k, v]) => k !== 'children' && typeof v === 'string' && (k === 'aria-label' || k === 'title'))
      .map(([, v]) => String(v))
      .join(' ');
    return `${own} ${textOf(node.props.children)}`;
  }
  return '';
}
const byType = (t: string) => (n: VNodeLike): boolean => n.type === t;
const range = (n: number): MetricRange => ({ min: 1000, max: 30000, p05: 2000, p50: 12000, p95: 25000, n });
const EMPTY_RANGE: MetricRange = { min: null, max: null, p05: null, p50: null, p95: null, n: 0 };
const noop = (): void => undefined;
const row = (over: Partial<CompareModelRow>): CompareModelRow => ({
  makeId: 54,
  modelId: 1918,
  name: 'Opel Corsa',
  listingCount: 1281,
  price: range(1281),
  year: range(1281),
  mileage: range(1281),
  ...over,
});

describe('écran C — comparaison (EX-SCR-194…200)', () => {
  it('nominal : titre, tableau à en-têtes scopés, actions natives étiquetées, note de plafond à 4', () => {
    const tree = CompareScreen({ rows: [row({}), row({ modelId: 1916, name: 'Opel Astra' })], atCapacity: true, onRemove: noop, onOpen: noop, onClearAll: noop });
    expect(findAll(tree, byType('h1'))).toHaveLength(1);
    expect(findAll(tree, byType('table'))).toHaveLength(1);
    expect(findAll(tree, (n) => n.type === 'th' && typeof n.props.scope === 'string').length).toBeGreaterThan(0);
    expect(textOf(tree)).toMatch(/4 modèles au maximum — retirez-en un pour en ajouter un autre/);
    expect(findAll(tree, byType('button')).some((b) => String(b.props['aria-label']).startsWith('Retirer'))).toBe(true);
  });

  it('ET-CHAMP-MANQUANT : une fourchette absente est rendue « — » (jamais 0)', () => {
    const tree = CompareScreen({ rows: [row({ price: EMPTY_RANGE })], atCapacity: false, onRemove: noop, onOpen: noop, onClearAll: noop });
    const cells = findAll(tree, byType('td')).map((c) => textOf(c).trim());
    expect(cells).toContain('—');
  });

  it('R-D8-18 — ET-VIDE-FILTRES : une colonne à n = 0 doit afficher « aucune offre », toutes à 0 le texte global d’EX-SCR-200', () => {
    const one = CompareScreen({ rows: [row({ listingCount: 0, price: EMPTY_RANGE }), row({ modelId: 1916, name: 'Opel Astra' })], atCapacity: false, onRemove: noop, onOpen: noop, onClearAll: noop });
    expect(textOf(one)).toMatch(/aucune offre/i);
    const all = CompareScreen({ rows: [row({ listingCount: 0 }), row({ modelId: 1916, name: 'Opel Astra', listingCount: 0 })], atCapacity: false, onRemove: noop, onOpen: noop, onClearAll: noop });
    expect(textOf(all)).toMatch(/Aucun des modèles comparés n’a d’offre sous ces filtres — élargissez vos critères/);
    expect(findAll(all, byType('th')).length).toBeGreaterThanOrEqual(2); // les colonnes restent présentes
  });

  it('R-D8-18 — ET-EFFECTIF-FAIBLE : une colonne à n < 12 doit porter le jeton ambre `n = <n>` (EX-SCR-33)', () => {
    const tree = CompareScreen({ rows: [row({ listingCount: 7, price: range(7), year: range(7), mileage: range(7) }), row({ modelId: 1916, name: 'Opel Astra' })], atCapacity: false, onRemove: noop, onOpen: noop, onClearAll: noop });
    expect(textOf(tree)).toMatch(/n\s*=\s*7|trop faible/);
  });

  it('R-D8-18 — ET-CHARGE-INIT / ET-ERREUR-PROVIDER par colonne : l’écran n’a aucune notion de colonne « en chargement » ou « en erreur » (rows vides ⇒ « Aucun modèle sélectionné »)', () => {
    type WithStates = Parameters<typeof CompareScreen>[0] & { readonly loading?: boolean };
    const tree = CompareScreen({ rows: [], atCapacity: false, onRemove: noop, onOpen: noop, onClearAll: noop, loading: true } as WithStates);
    expect(textOf(tree)).not.toMatch(/Aucun modèle sélectionné/);
  });

  it('R-D8-19 — EX-SCR-196 : quatre rangées (G1, G3, G5 superposé, Synthèse) — aucun graphe n’est rendu, seule la synthèse existe', () => {
    const tree = CompareScreen({ rows: [row({}), row({ modelId: 1916, name: 'Opel Astra' })], atCapacity: false, onRemove: noop, onOpen: noop, onClearAll: noop });
    const svgs = findAll(tree, byType('svg'));
    expect(svgs.length).toBeGreaterThanOrEqual(3); // ≥ G1 ×2 colonnes + G5
    expect(textOf(tree)).toMatch(/échelle commune/);
  });
});

describe('écran E — recherches enregistrées (EX-SCR-212…214)', () => {
  it('structure : titre, panneau « Recherches récentes » avec l’action unique « Vider l’historique » et aucune suppression unitaire', () => {
    const tree = SavedSearchesScreen({
      saved: [],
      recent: [{ value: { schemaVersion: 1, url: '/marche?priceto=1', visiteLe: '2026-09-01T00:00:00Z' }, status: { kind: 'current' } }],
      onOpen: noop,
      onRename: noop,
      onDelete: noop,
      onClearHistory: noop,
    });
    expect(findAll(tree, byType('h1'))).toHaveLength(1);
    expect(findAll(tree, byType('aside'))).toHaveLength(1);
    const buttons = findAll(tree, byType('button')).map((b) => textOf(b).trim());
    expect(buttons).toContain('Vider l’historique');
    expect(buttons.filter((b) => /supprimer/i.test(b))).toHaveLength(0);
  });

  it('R-D8-20 — ET-VIDE-FILTRES : bloc « Aucune recherche enregistrée », phrase « Enregistrez une recherche depuis le bandeau de filtres » et bouton « Aller au survol du marché »', () => {
    const tree = SavedSearchesScreen({ saved: [], recent: [], onOpen: noop, onRename: noop, onDelete: noop, onClearHistory: noop });
    const text = textOf(tree);
    expect(text).toMatch(/Aucune recherche enregistrée/);
    expect(text).toMatch(/Enregistrez une recherche depuis le bandeau de filtres/);
    expect(findAll(tree, byType('button')).map((b) => textOf(b).trim())).toContain('Aller au survol du marché');
  });

  it('R-D8-20 — EX-SCR-212/213 : l’écran ne reçoit ni effectif actuel ni écart (`+ <k> offres depuis le <date>`) — aucune propriété ne les porte', () => {
    type WithCurrent = Parameters<typeof SavedSearchesScreen>[0] & { readonly currentCountById?: ReadonlyMap<string, number | null> };
    const props: WithCurrent = {
      saved: [{ value: { schemaVersion: 1, id: 'a', nom: 'Diesel', url: '/marche?fuel=D', mode: 1, creeeLe: '2026-09-02T00:00:00Z', dernierAccesLe: '2026-09-02T00:00:00Z', effectifInitial: 100, snapshotInitial: 'snap-old' }, status: { kind: 'current' } }],
      recent: [],
      onOpen: noop,
      onRename: noop,
      onDelete: noop,
      onClearHistory: noop,
      currentCountById: new Map([['a', 134]]),
    };
    const tree = SavedSearchesScreen(props);
    // La carte est un sous-composant à hooks : on vérifie que la donnée lui est au moins transmise.
    const cards = findAll(tree, (n) => typeof n.type === 'function');
    expect(cards.length).toBe(1);
    const cardProps = cards[0]?.props as Record<string, unknown>;
    expect(Object.keys(cardProps)).toEqual(expect.arrayContaining(['currentCount']));
  });
});

describe('écran F — modèles suivis (EX-SCR-214bis)', () => {
  const rows = [{ value: { schemaVersion: 1, makeId: 54, modelId: 1918, ajouteLe: '2026-09-01T00:00:00Z' }, status: { kind: 'current' as const } }];

  it('nominal : titre, une carte par modèle avec marque+modèle, date d’ajout et « Ne plus suivre » étiqueté', () => {
    const tree = FollowedScreen({ rows, nameOf: () => 'Opel Corsa', onOpen: noop, onUnfollow: noop });
    expect(findAll(tree, byType('h1'))).toHaveLength(1);
    expect(findAll(tree, byType('li'))).toHaveLength(1);
    const text = textOf(tree);
    expect(text).toMatch(/Opel Corsa/);
    expect(text).toMatch(/suivi depuis le/);
    expect(findAll(tree, byType('button')).some((b) => String(b.props['aria-label']) === 'Ne plus suivre Opel Corsa')).toBe(true);
  });

  it('ET-CHAMP-MANQUANT : un couple absent de la taxonomie est nommé explicitement (repli « Marque n Modèle m »), jamais 0', () => {
    const tree = FollowedScreen({ rows, nameOf: (m, mo) => `Marque ${m} Modèle ${mo}`, onOpen: noop, onUnfollow: noop });
    expect(textOf(tree)).toMatch(/Marque 54 Modèle 1918/);
  });

  it('R-D8-21 — en-tête `<n> / 30 modèles suivis` (EX-SCR-214bis) absent', () => {
    const tree = FollowedScreen({ rows, nameOf: () => 'Opel Corsa', onOpen: noop, onUnfollow: noop });
    expect(textOf(tree)).toMatch(/1\s*\/\s*30 modèles suivis/);
  });

  it('R-D8-21 — ET-VIDE-FILTRES : « Aucun modèle suivi », « Suivez un modèle depuis l’en-tête de l’écran B », bouton « Aller au survol du marché »', () => {
    const tree = FollowedScreen({ rows: [], nameOf: () => '', onOpen: noop, onUnfollow: noop });
    const text = textOf(tree);
    expect(text).toMatch(/Aucun modèle suivi/);
    expect(text).toMatch(/Suivez un modèle depuis l’en-tête de l’écran B/);
    expect(findAll(tree, byType('button')).map((b) => textOf(b).trim())).toContain('Aller au survol du marché');
  });

  it('R-D8-21 — effectif actuel par carte (ET-CHARGE-INIT squelette / ET-ERREUR-PROVIDER « effectif actuel indisponible ») : aucune propriété ne le porte', () => {
    type WithCurrent = Parameters<typeof FollowedScreen>[0] & { readonly currentCountOf?: (makeId: number, modelId: number) => number | null | 'loading' };
    const tree = FollowedScreen({ rows, nameOf: () => 'Opel Corsa', onOpen: noop, onUnfollow: noop, currentCountOf: () => null } as WithCurrent);
    expect(textOf(tree)).toMatch(/effectif actuel indisponible/);
  });
});

describe('page /mentions (REQUIREMENTS § 5 l.158, EX-SCR-47, EX-DATA-107, R3)', () => {
  it('contenu requis : sources et limites de collecte, périmètre, protection des données (R3), provenance SYNTHETIC étiquetée', () => {
    const tree = MentionsPage({ sourceKind: 'SYNTHETIC', snapshotDate: '2026-09-01T00:00:00.000Z', providerId: 'D3-1.0.0' });
    const text = textOf(tree);
    expect(findAll(tree, byType('h1'))).toHaveLength(1);
    expect(text).toMatch(/Sources et limites de collecte/);
    expect(text).toMatch(/Protection des données/);
    expect(text).toMatch(/identifiant un vendeur/);
    expect(text).toMatch(/jeu synthétique de démonstration/);
    expect(text).toMatch(/D3-1\.0\.0/);
    expect(text).toMatch(/2026-09-01/);
  });

  it('non-régression du correctif 5c17490 : sans sourceKind connu (null / absent), AUCUNE ligne de provenance — jamais « marché réel » par défaut', () => {
    for (const props of [{}, { sourceKind: null }, { sourceKind: undefined }]) {
      const tree = MentionsPage(props);
      expect(findAll(tree, (n) => n.props.class === 'kycar-mentions-provenance')).toHaveLength(0);
      expect(textOf(tree)).not.toMatch(/marché réel/);
    }
    expect(textOf(MentionsPage({ sourceKind: 'REAL' }))).toMatch(/marché réel/);
  });
});
});
