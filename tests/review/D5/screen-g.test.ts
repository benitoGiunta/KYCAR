/**
 * Sonde de revue D5 — écran G (`EX-SCR-215`/`216`) à l'échelle réelle du référentiel :
 * 295 marques et 4 955 modèles de `data/reference/taxonomy.json`, plus le seuil d'`EX-SRCH-26`.
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  clearScreenGSearch,
  computeRowWindow,
  INITIAL_SCREEN_G_SEARCH_STATE,
  isSameSelection,
  makePanelEmptyState,
  modelPanelEmptyState,
  searchMakes,
  searchModels,
  serializeMmmv,
  SCREEN_G_BUFFER_ROWS,
  SCREEN_G_EMPTY_STATE_ID,
  SCREEN_G_VISIBLE_ROWS,
  type MakeRow,
} from '../../../src/components/filters/screen-g-model';
import { ScreenGEmptyNotice, ScreenGMakeRow, ScreenGModelRow } from '../../../src/components/filters/ScreenG';
import { MAKE_COUNT_WARNING_THRESHOLD, shouldShowMakeCountWarning } from '../../../src/screens/market/thresholds';
import type { Make, Model } from '../../../src/types/entities';
import type { ReferenceData } from '../../../src/types/reference';

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

interface RawModel {
  readonly id: number;
  readonly label: string;
  readonly slug?: string;
}
interface RawMake {
  readonly id: number;
  readonly label: string;
  readonly slug?: string;
  readonly models?: readonly RawModel[];
}
interface RawTaxonomy {
  readonly makeCount: number;
  readonly modelCount: number;
  readonly makes: readonly RawMake[];
}

const raw = JSON.parse(readFileSync('data/reference/taxonomy.json', 'utf8')) as RawTaxonomy;

function buildReference(): ReferenceData {
  const makes: Make[] = [];
  const models: Model[] = [];
  const modelsByMake = new Map<number, Model[]>();
  for (const [index, rm] of raw.makes.entries()) {
    makes.push({
      makeId: rm.id,
      label: rm.label,
      slug: rm.slug ?? String(rm.id),
      // Volumétrie déterministe, décroissante : sert uniquement au tri de la sonde.
      announcedCount: raw.makes.length - index,
    });
    const bucket: Model[] = [];
    for (const [mIndex, rmo] of (rm.models ?? []).entries()) {
      const model: Model = {
        makeId: rm.id,
        modelId: rmo.id,
        label: rmo.label,
        slug: rmo.slug ?? String(rmo.id),
        bodyTypes: [],
        announcedCount: (rm.models ?? []).length - mIndex,
      };
      models.push(model);
      bucket.push(model);
    }
    modelsByMake.set(rm.id, bucket);
  }
  const reference: Pick<ReferenceData, 'makes' | 'makeById' | 'models' | 'modelByKey' | 'modelsByMake'> = {
    makes,
    makeById: new Map(makes.map((m) => [m.makeId, m])),
    models,
    modelByKey: new Map(models.map((m) => [`${m.makeId}:${m.modelId}`, m])),
    modelsByMake,
  };
  return reference as ReferenceData;
}

const reference = buildReference();

describe('D5 — EX-SCR-215/216 : écran G à l’échelle réelle (295 marques, 4 955 modèles)', () => {
  it('le référentiel chargé porte bien 295 marques et 4 955 modèles', () => {
    expect(raw.makeCount).toBe(295);
    expect(raw.modelCount).toBe(4_955);
    expect(reference.makes).toHaveLength(295);
    expect(reference.models).toHaveLength(4_955);
  });

  it('le panneau gauche liste les 295 marques, triées par effectif décroissant', () => {
    const rows = searchMakes(reference, '');
    expect(rows).toHaveLength(295);
    const counts = rows.map((r) => r.count ?? -1);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it('EX-SCR-216 — la recherche est insensible à la casse et aux diacritiques', () => {
    // `Bolloré` : seule marque diacritée du référentiel — « bollore » doit la trouver.
    expect(searchMakes(reference, 'bollore').map((r) => r.make.label)).toContain('Bolloré');
    expect(searchMakes(reference, 'anhanger').map((r) => r.make.label)).toContain('Trailer-Anhänger');
    expect(searchMakes(reference, 'MERCEDES').length).toBeGreaterThan(0);
    expect(searchMakes(reference, 'zzz-aucune-marque')).toHaveLength(0);
  });

  it('le panneau droit reste vide tant qu’aucune marque n’est choisie, puis liste ses modèles', () => {
    expect(searchModels(reference, undefined, '')).toHaveLength(0);
    const firstMake = raw.makes[0];
    expect(firstMake).toBeDefined();
    if (firstMake === undefined) return;
    const rows = searchModels(reference, firstMake.id, '');
    expect(rows).toHaveLength((firstMake.models ?? []).length);
    for (const row of rows) expect(row.model.makeId).toBe(firstMake.id);
  });

  it('la recherche de modèle filtre par sous-chaîne, insensible à la casse', () => {
    const opel = raw.makes.find((m) => m.label === 'Opel');
    expect(opel).toBeDefined();
    if (opel === undefined) return;
    const rows = searchModels(reference, opel.id, 'CORS');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.model.label.toLowerCase()).toContain('cors');
  });

  it('EX-SCR-72 — `Appliquer` sérialise `makeId|modelId` et est désactivé si la sélection est inchangée', () => {
    expect(serializeMmmv(16, undefined)).toBe('16');
    expect(serializeMmmv(16, 1_174)).toBe('16|1174');
    expect(isSameSelection('16|1174', '16|1174')).toBe(true);
    expect(isSameSelection('16|1174', undefined)).toBe(false);
  });

  it('EX-SRCH-26 — le seuil d’avertissement est bien 60 marques, sans blocage', () => {
    expect(MAKE_COUNT_WARNING_THRESHOLD).toBe(60);
    expect(shouldShowMakeCountWarning(60)).toBe(false);
    expect(shouldShowMakeCountWarning(61)).toBe(true);
  });
});

describe('R-D5-20 — écran G : effectifs jamais relatifs au périmètre filtré courant', () => {
  it('R-D5-20 — un effectif non calculable doit rester `null` (affiché « — »), jamais une volumétrie source', () => {
    // `ScreenG.tsx` n'alimente jamais l'argument `counts` : les effectifs affichés sont la
    // dernière volumétrie connue de la source (`announcedCount`), non l'effectif « dans le
    // périmètre filtré courant » exigé par EX-SCR-216.
    const firstId = raw.makes[0]?.id ?? 0;
    const counts = new Map<number, number>([[firstId, 12]]);
    const rows = searchMakes(reference, '', counts);
    expect(rows.find((r) => r.make.makeId === firstId)?.count).toBe(12);
    // Toute marque SANS effectif fourni doit rendre `null` (affiché « — », ET-CHAMP-MANQUANT),
    // jamais la volumétrie source `announcedCount`, qui n'est pas relative au périmètre filtré.
    expect(rows.filter((r) => r.make.makeId !== firstId && r.count !== null)).toHaveLength(0);
  });
});

describe('R-D5-25 — écran G : fenêtrage des deux panneaux (résidu EX-SCR-216, DR-060)', () => {
  it('R-D5-25 — à l’ouverture (scrollTop=0), seule une fenêtre de lignes est montée sur les 295 marques', () => {
    const allMakes = searchMakes(reference, '');
    expect(allMakes).toHaveLength(295);
    const w = computeRowWindow(allMakes, 0);
    // Jamais les 295 lignes à la fois : fenêtre visible + tampon, très inférieure au total.
    expect(w.items.length).toBeLessThan(295);
    expect(w.items.length).toBeGreaterThanOrEqual(SCREEN_G_VISIBLE_ROWS);
    expect(w.startIndex).toBe(0);
    expect(w.totalCount).toBe(295);
    expect(w.topPaddingPx).toBe(0);
    expect(w.bottomPaddingPx).toBeGreaterThan(0);
    // La reconstitution (padding + items + padding) couvre exactement le total, aucune ligne perdue.
    expect(w.items).toEqual(allMakes.slice(w.startIndex, w.endIndex));
  });

  it('R-D5-25 — un défilement profond avance la fenêtre sans jamais dépasser les bornes du tableau', () => {
    const allMakes = searchMakes(reference, '');
    const farDown = computeRowWindow(allMakes, 100_000); // dépasse largement la hauteur totale réelle
    expect(farDown.endIndex).toBe(295);
    expect(farDown.bottomPaddingPx).toBe(0);
    expect(farDown.startIndex).toBeGreaterThan(0);
    expect(farDown.startIndex).toBeLessThanOrEqual(295);
  });

  it('R-D5-25 — le plus grand panneau modèle (4 955 modèles au total) reste fenêtré à l’échelle réelle', () => {
    const total = reference.models.length;
    expect(total).toBe(4_955);
    // Le panneau droit ne montre jamais plus d'une marque à la fois (une seule sélectionnée) :
    // même la plus grosse marque du référentiel doit être fenêtrée dès qu'elle dépasse la fenêtre.
    const biggestMakeId = [...reference.modelsByMake.entries()].sort((a, b) => b[1].length - a[1].length)[0]?.[0];
    expect(biggestMakeId).toBeDefined();
    if (biggestMakeId === undefined) return;
    const rows = searchModels(reference, biggestMakeId, '');
    const w = computeRowWindow(rows, 0);
    expect(w.items.length).toBeLessThanOrEqual(rows.length);
    if (rows.length > SCREEN_G_VISIBLE_ROWS + SCREEN_G_BUFFER_ROWS) {
      expect(w.items.length).toBeLessThan(rows.length);
    }
  });

  it('R-D5-25 — une liste vide rend une fenêtre vide, sans erreur', () => {
    const w = computeRowWindow<MakeRow>([], 0);
    expect(w).toEqual({ items: [], startIndex: 0, endIndex: 0, totalCount: 0, topPaddingPx: 0, bottomPaddingPx: 0 });
  });

  it('R-D5-25 — chaque ligne montée porte `aria-posinset`/`aria-setsize` (équivalent accessible du fenêtrage)', () => {
    const allMakes = searchMakes(reference, '');
    const w = computeRowWindow(allMakes, computeRowWindow(allMakes, 0).topPaddingPx + 5_000); // fenêtre décalée
    const row = w.items[0];
    expect(row).toBeDefined();
    if (row === undefined) return;
    const vnode = ScreenGMakeRow({ row, index: w.startIndex, totalCount: w.totalCount, selected: false, onSelect: () => {} });
    expect(vnode.props['aria-posinset']).toBe(w.startIndex + 1);
    expect(vnode.props['aria-setsize']).toBe(295);
  });
});

describe('R-D5-26 — écran G : « Effacer la recherche » et `ET-VIDE-FILTRES` (résidu EX-SCR-216, DR-060)', () => {
  it('R-D5-26 — une saisie marque sans correspondance déclenche `ET-VIDE-FILTRES`, une saisie vide non', () => {
    const noMatch = searchMakes(reference, 'zzz-aucune-marque-connue');
    expect(noMatch).toHaveLength(0);
    const state = makePanelEmptyState('zzz-aucune-marque-connue', noMatch);
    expect(state).not.toBeNull();
    expect(state?.stateId).toBe('ET-VIDE-FILTRES');
    expect(state?.message).toBe('Aucune marque ne contient « zzz-aucune-marque-connue »');

    expect(makePanelEmptyState('', searchMakes(reference, ''))).toBeNull();
    const match = searchMakes(reference, 'Opel');
    expect(makePanelEmptyState('Opel', match)).toBeNull();
  });

  it('R-D5-26 — le panneau modèle ne rend `ET-VIDE-FILTRES` que si une marque est sélectionnée', () => {
    const noMatch = searchModels(reference, raw.makes[0]?.id, 'zzz-aucun-modele-connu');
    expect(noMatch).toHaveLength(0);
    expect(modelPanelEmptyState(false, 'zzz-aucun-modele-connu', noMatch)).toBeNull();
    const withMake = modelPanelEmptyState(true, 'zzz-aucun-modele-connu', noMatch);
    expect(withMake?.stateId).toBe('ET-VIDE-FILTRES');
    expect(withMake?.message).toBe('Aucun modèle ne contient « zzz-aucun-modele-connu »');
  });

  it('R-D5-26 — « Effacer la recherche » remet les DEUX panneaux à l’état initial, pas seulement le champ courant', () => {
    const reset = clearScreenGSearch();
    expect(reset).toEqual(INITIAL_SCREEN_G_SEARCH_STATE);
    expect(reset.makeQuery).toBe('');
    expect(reset.modelQuery).toBe('');
    expect(reset.selectedMakeId).toBeUndefined();
    expect(reset.selectedModelId).toBeUndefined();
  });

  it('R-D5-26 — le message `ET-VIDE-FILTRES` rend un bouton « Effacer la recherche » accessible (structure du VNode)', () => {
    const state = makePanelEmptyState('zzz', []);
    expect(state).not.toBeNull();
    if (state === null) return;
    const onClearSearch = () => {};
    const vnode = ScreenGEmptyNotice({ state, onClearSearch });
    expect(vnode.props['data-screen-g-state']).toBe(SCREEN_G_EMPTY_STATE_ID);
    expect(collectText(vnode.props.children)).toContain(state.message);
    const buttons = findAll(vnode, (n) => n.type === 'button');
    expect(buttons).toHaveLength(1);
    expect(collectText(buttons[0]?.props.children)).toBe('Effacer la recherche');
    expect(buttons[0]?.props.onClick).toBe(onClearSearch);
  });

  it('R-D5-26 — les lignes rendues (marque et modèle) restent conformes au format d’effectif « — »/valeur existant', () => {
    const rowVisible = ScreenGMakeRow({
      row: { make: { makeId: 1, label: 'Test', slug: 'test', announcedCount: 5 }, count: null },
      index: 0,
      totalCount: 1,
      selected: false,
      onSelect: () => {},
    });
    expect(collectText(rowVisible)).toContain('—');
    const modelRow = ScreenGModelRow({
      row: {
        model: { makeId: 1, modelId: 2, label: 'Modèle', slug: 'modele', bodyTypes: [], announcedCount: 3 },
        count: 7,
      },
      index: 0,
      totalCount: 1,
      selected: true,
      onSelect: () => {},
    });
    expect(collectText(modelRow)).toContain('7');
  });
});

describe('R-D5-28 — FV-16/D8-14 : `aria-allowed-attr` de l’écran G (axe-core critique ×82)', () => {
  // Avant correction : `aria-selected` était posé sur le `<button>` interne (rôle implicite
  // `button`), qui ne le supporte pas — axe-core lève `aria-allowed-attr` (critique) sur chaque
  // ligne montée. `aria-selected` n'est permis que sur un rôle qui le déclare (dont `option`,
  // porté ici par le `<li>`) : c'est LUI qui doit recevoir l'attribut d'état.
  it('R-D5-28 — ScreenGMakeRow : `aria-selected` est sur le `<li role="option">`, jamais sur le `<button>`', () => {
    const vnode = ScreenGMakeRow({
      row: { make: { makeId: 1, label: 'Test', slug: 'test', announcedCount: 5 }, count: 5 },
      index: 0,
      totalCount: 1,
      selected: true,
      onSelect: () => {},
    });
    expect(vnode.props.role).toBe('option');
    expect(vnode.props['aria-selected']).toBe(true);
    const button = findAll(vnode, (n) => n.type === 'button')[0];
    expect(button).toBeDefined();
    expect(button?.props['aria-selected']).toBeUndefined();
  });

  it('R-D5-28 — ScreenGModelRow : même règle, `aria-selected` sur le `<li role="option">`', () => {
    const vnode = ScreenGModelRow({
      row: {
        model: { makeId: 1, modelId: 2, label: 'Modèle', slug: 'modele', bodyTypes: [], announcedCount: 3 },
        count: 3,
      },
      index: 0,
      totalCount: 1,
      selected: false,
      onSelect: () => {},
    });
    expect(vnode.props.role).toBe('option');
    expect(vnode.props['aria-selected']).toBe(false);
  });
});
