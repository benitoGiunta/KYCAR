/**
 * Revue D6 (remédiation 2.9b) — sondes `R-D6-2.9-01..06` : les trois cardinaux de la barre de
 * synthèse (`EX-SCR-106`) — constats `ACC-05` et `ACC-15`, décision `D8-42`.
 * =================================================================================================
 * `ACC-05` (MINEUR, contraire à `D8-02` « jamais 0 par défaut, — tant que la donnée manque ») : la
 * barre affiche « **0 modèles** » pendant 486 à 691 ms à chaque chargement, avant le cardinal réel
 * (3 021 sur `/marche` nu, 908 sur l'URL du parcours 1). Le cardinal était dérivé des agrégats
 * MODÈLE, chargés APRÈS le marché et rendus à la boucle d'inactivité (`EX-NFR-9`) : tant que la map
 * est vide, `new Set([]).size` vaut `0` — un zéro par défaut présenté comme un fait mesuré.
 *
 * `ACC-15` (MINEUR, `EX-SCR-1`..`4`) : « **1 marques** · 69 modèles · 280 offres » — le pluriel
 * n'est pas accordé quand un seul élément est retenu (le cardinal d'offres, lui, l'était déjà par
 * `formatOfferCount`).
 *
 * Ces sondes exécutent le composant (Preact SANS hook, appelé directement : même technique que
 * `structure-a11y.test.ts`) et la fonction PURE de dérivation du cardinal, `marketModelCardinal`.
 */
import { describe, expect, it } from 'vitest';

import type { MakeAggregate, ModelAggregate } from '../../../src/providers/DataProvider';
import { SummaryBar, type SummaryBarProps } from '../../../src/screens/market/SummaryBar';
import { marketModelCardinal } from '../../../src/screens/market/view-model';

interface VNode {
  readonly type: unknown;
  readonly props: Record<string, unknown>;
}
function isVNode(x: unknown): x is VNode {
  return typeof x === 'object' && x !== null && 'type' in x && 'props' in (x as Record<string, unknown>);
}
function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isVNode(node)) return collectText(node.props.children);
  return '';
}

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

/** Texte de la seule ligne des cardinaux (`.kycar-market-summary-counts`). */
function counts(partial: Partial<SummaryBarProps> = {}): string {
  const vnode = SummaryBar(props(partial)) as unknown as VNode;
  // Espaces insécables normatives (U+202F séparateur de milliers, U+00A0 devant une unité)
  // ramenées à l'espace ordinaire pour que les assertions restent lisibles.
  return collectText(vnode).replace(/[\u202f\u00a0]/g, ' ');
}

function makeAgg(makeId: number, listingCount: number, modelCount: number | null): MakeAggregate {
  const range = { min: 1, p05: 2, p50: 3, p95: 4, max: 5, n: listingCount };
  return {
    makeId,
    listingCount,
    price: range,
    mileage: range,
    year: range,
    sampleCoverage: 1,
    modelCount,
  };
}

describe('ACC-05 / D8-42 — « — » tant que le cardinal des modèles n’est pas chargé, jamais « 0 »', () => {
  it('R-D6-2.9-01 — `modelCount: null` (pas encore chargé) rend « — modèles », jamais « 0 modèle »', () => {
    const text = counts({ modelCount: null });
    expect(text).toContain('— modèles');
    expect(text).not.toContain('0 modèle');
  });

  it('R-D6-2.9-02 — `modelCount: 0` (zéro RÉEL, mesuré) rend « 0 modèle », jamais « — »', () => {
    const text = counts({ modelCount: 0, makeCount: 3 });
    expect(text).toContain('0 modèle');
    expect(text).not.toContain('— modèles');
  });

  it('R-D6-2.9-03 — la source du cardinal distingue « pas encore chargé » de « zéro réel »', () => {
    const noModels: ReadonlyMap<number, readonly ModelAggregate[] | 'unavailable'> = new Map();
    // (a) le cardinal est publié par les agrégats de MARQUE (`MakeAggregate.modelCount`, D8-10) :
    // il est donc connu dès le premier affichage, sans attendre le second aller `MODEL`.
    expect(marketModelCardinal([makeAgg(1, 100, 12), makeAgg(2, 50, 7)], noModels)).toBe(19);
    // (b) aucun agrégat de marque ne le publie et aucun agrégat modèle n'est chargé : INCONNU.
    expect(marketModelCardinal([makeAgg(1, 100, null)], noModels)).toBeNull();
    // (c) le détail par modèle a échoué (`EX-SCR-132`) : toujours INCONNU, jamais 0.
    const unavailable = new Map<number, readonly ModelAggregate[] | 'unavailable'>([[1, 'unavailable']]);
    expect(marketModelCardinal([makeAgg(1, 100, null)], unavailable)).toBeNull();
    // (d) zéro RÉEL : la marque publie 0 modèle distinct (toutes ses annonces à `modelId = 0`).
    expect(marketModelCardinal([makeAgg(1, 100, 0)], noModels)).toBe(0);
    // (e) repli : le cardinal n'est pas publié, mais les agrégats modèle sont là.
    const loaded = new Map<number, readonly ModelAggregate[] | 'unavailable'>([
      [1, [{ ...makeAgg(1, 60, null), modelId: 11 } as unknown as ModelAggregate]],
    ]);
    expect(marketModelCardinal([makeAgg(1, 100, null)], loaded)).toBe(1);
  });
});

describe('ACC-15 / D8-42 — accord singulier/pluriel des trois cardinaux (EX-SCR-1..4, EX-SCR-106)', () => {
  it('R-D6-2.9-04 — un seul élément : « 1 marque · 1 modèle · 1 offre »', () => {
    const text = counts({ makeCount: 1, modelCount: 1, offerCount: 1 });
    expect(text).toContain('1 marque ');
    expect(text).not.toContain('1 marques');
    expect(text).toContain('1 modèle ');
    expect(text).not.toContain('1 modèles');
    expect(text).toContain('1 offre');
    expect(text).not.toContain('1 offres');
  });

  it('R-D6-2.9-05 — plusieurs éléments : le pluriel est conservé, et le zéro reste au singulier', () => {
    expect(counts({ makeCount: 2, modelCount: 69, offerCount: 280 })).toContain('2 marques');
    expect(counts({ makeCount: 2, modelCount: 69, offerCount: 280 })).toContain('69 modèles');
    expect(counts({ makeCount: 2, modelCount: 69, offerCount: 280 })).toContain('280 offres');
    // `EX-SCR-131` — la ligne à zéro reste littéralement celle de l'exigence.
    expect(counts({ makeCount: 0, modelCount: 0, offerCount: 0 })).toContain('0 marque · 0 modèle · aucune offre');
  });

  it('R-D6-2.9-06 — le suffixe « marques affichées » s’accorde lui aussi (EX-SCR-106)', () => {
    expect(counts({ makeCount: 12, displayedMakeCount: 1 })).toContain('1 marque affichée');
    expect(counts({ makeCount: 12, displayedMakeCount: 6 })).toContain('6 marques affichées');
  });
});
