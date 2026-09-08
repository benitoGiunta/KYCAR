/**
 * KYCAR — Sondes de revue D6 · écran E « Recherches enregistrées » (EX-SCR-212/213, EX-CRUD-11/13)
 * =================================================================================================
 * Phase 2.8, vague F3 (`D8-31`). `FINAL-VERIFICATION` §3.2(d) et `REMEDIATION-2.8` §7.1 n° 3 :
 * « carte de l'écran E sans bouton `Ouvrir` nommé, sans description de filtres ni périmètre »,
 * « aucun correcteur ne cite l'écran E ». `EX-SCR-212` exige, PAR CARTE : le nom (60 car. max), la
 * description générée des filtres actifs (tronquée à 2 lignes), le périmètre (`Toutes marques` ou
 * `<Marque> <Modèle>`), l'effectif à l'enregistrement, l'effectif actuel, l'écart au format
 * `+ 34 offres depuis le 02/09`, et TROIS boutons `Ouvrir`, `Renommer`, `Supprimer` ; plus le
 * panneau latéral `Recherches récentes` (10 entrées FIFO d'`EX-CRUD-11`) avec l'action UNIQUE
 * `Vider l'historique` (`EX-CRUD-13`), sans suppression unitaire.
 *
 * Environnement `node`, hooks neutralisés : l'arbre de VNodes est inspecté (aucun DOM).
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LoadedRecord } from '../../../src/persistence/crud-store';
import type { SavedSearch } from '../../../src/persistence/saved-searches';
import type { RecentEntry } from '../../../src/persistence/recent-history';
import type { Make, Model } from '../../../src/types/index';
import { modelKey } from '../../../src/types/reference';

vi.mock('preact/hooks', () => ({
  useState: <T>(init: T | (() => T)) => [typeof init === 'function' ? (init as () => T)() : init, (): void => {}],
  useMemo: <T>(fn: () => T) => fn(),
  useEffect: (): void => {},
  useLayoutEffect: (): void => {},
  useRef: <T>(init: T) => ({ current: init }),
  useCallback: <T>(fn: T) => fn,
  useContext: () => undefined,
  useReducer: () => [undefined, (): void => {}],
  useId: () => 'id',
}));

const { SavedSearchesScreen } = await import('../../../src/screens/saved/SavedSearchesScreen');
const { deepRender, findAll, byType, visibleTextOf } = await import('../D7/_helpers');

const norm = (s: string): string => s.replace(/[\s\u00a0\u202f\u2009]+/g, ' ').trim();
const NOOP = (): void => {};

const MAKE: Make = { makeId: 74, label: 'Volkswagen', slug: 'volkswagen', announcedCount: null };
const MODEL: Model = { makeId: 74, modelId: 941, label: 'Golf', slug: 'golf', bodyTypes: [], announcedCount: null };
const TAXONOMY = {
  makeById: new Map([[MAKE.makeId, MAKE]]),
  modelByKey: new Map([[modelKey(MAKE.makeId, MODEL.modelId), MODEL]]),
};

function saved(over: Partial<SavedSearch> = {}): LoadedRecord<SavedSearch> {
  return {
    value: {
      schemaVersion: 1,
      id: 'r1',
      nom: 'Golf sous 20 000',
      url: '/marche/74-volkswagen/941-golf?priceto=20000&fuel=D',
      mode: 2,
      creeeLe: '2026-09-02T10:00:00.000Z',
      dernierAccesLe: '2026-09-02T10:00:00.000Z',
      effectifInitial: 108,
      snapshotInitial: 'snap-2026-09-02',
      ...over,
    } as SavedSearch,
    status: { kind: 'current' },
  };
}

function recent(n: number): LoadedRecord<RecentEntry>[] {
  return Array.from({ length: n }, (_v, i) => ({
    value: { schemaVersion: 1, url: `/marche?priceto=${10000 + i}`, visiteLe: `2026-09-0${(i % 9) + 1}T08:00:00.000Z` } as RecentEntry,
    status: { kind: 'current' as const },
  }));
}

function render(over: Record<string, unknown> = {}): unknown {
  return deepRender(
    SavedSearchesScreen({
      saved: [saved()],
      recent: recent(10),
      onOpen: NOOP,
      onRename: NOOP,
      onDelete: NOOP,
      onClearHistory: NOOP,
      currentCountById: new Map([['r1', 142]]),
      currentSnapshotId: 'snap-2026-09-08',
      taxonomy: TAXONOMY,
      ...over,
    } as never),
  );
}

const buttons = (root: unknown): { readonly props: Record<string, unknown> }[] =>
  findAll(root, byType('button')) as { props: Record<string, unknown> }[];
const buttonNames = (root: unknown): string[] => buttons(root).map((b) => norm(visibleTextOf(b)));

describe('D6 · EX-SCR-212 — carte de recherche enregistrée (D8-31)', () => {
  const tree = render();

  it('R-D6-2.8-05 — la carte porte les TROIS boutons nommés `Ouvrir`, `Renommer`, `Supprimer`', () => {
    const names = buttonNames(tree);
    for (const label of ['Ouvrir', 'Renommer', 'Supprimer']) expect(names, label).toContain(label);
  });

  it('R-D6-2.8-06 — `Ouvrir` ouvre l’URL enregistrée avec son identifiant (EX-CRUD-6), et reste actif', () => {
    const opened: (string | undefined)[] = [];
    const wired = render({ onOpen: (url: string, id?: string) => opened.push(url, id) });
    const open = buttons(wired).find((b) => norm(visibleTextOf(b)) === 'Ouvrir');
    expect(open?.props['disabled']).toBeFalsy();
    (open?.props['onClick'] as (() => void) | undefined)?.();
    expect(opened).toEqual(['/marche/74-volkswagen/941-golf?priceto=20000&fuel=D', 'r1']);
  });

  it('R-D6-2.8-07 — la carte porte le NOM, la DESCRIPTION générée des filtres actifs et le PÉRIMÈTRE taxonomique', () => {
    const t = norm(visibleTextOf(tree));
    expect(t).toContain('Golf sous 20 000');
    // Périmètre : `<Marque> <Modèle>` résolu par la taxonomie, jamais un identifiant nu.
    expect(t).toContain('Volkswagen Golf');
    // Description : les filtres NON taxonomiques de l'URL enregistrée, en clair.
    const description = findAll(tree, (n) => n.props['class'] === 'kycar-saved-description')[0];
    expect(description, 'description des filtres absente').toBeDefined();
    const d = norm(visibleTextOf(description));
    expect(d).toMatch(/20\s?000/); // borne de prix
    expect(d.toLowerCase()).toContain('diesel'); // libellé du carburant, jamais le code `D`
    expect(d).not.toContain('Volkswagen'); // le périmètre a sa propre ligne
  });

  it('R-D6-2.8-08 — périmètre `Toutes marques` quand l’URL enregistrée ne porte aucun filtre de marque', () => {
    const tree1 = render({ saved: [saved({ id: 'r1', url: '/marche?priceto=20000', mode: 1 })] });
    expect(norm(visibleTextOf(tree1))).toContain('Toutes marques');
  });

  it('R-D6-2.8-09 — effectif à l’enregistrement, effectif actuel et ÉCART au format `+ <k> offres depuis le JJ/MM`', () => {
    const t = norm(visibleTextOf(tree));
    expect(t).toContain('108'); // effectif à l'enregistrement
    expect(t).toContain('142'); // effectif actuel
    expect(t).toContain('+ 34 offres depuis le 02/09');
  });

  it('R-D6-2.8-10 — EX-SCR-213 : l’écart est MASQUÉ sur le même snapshot, et jamais affiché à `+ 0`', () => {
    const same = render({ currentSnapshotId: 'snap-2026-09-02' });
    expect(norm(visibleTextOf(same))).not.toContain('offres depuis le');
    const equal = render({ currentCountById: new Map([['r1', 108]]) });
    const t = norm(visibleTextOf(equal));
    expect(t).not.toContain('+ 0 offres');
    expect(t).not.toContain('offres depuis le');
    const unknown = render({ currentCountById: new Map([['r1', null]]) });
    const u = norm(visibleTextOf(unknown));
    expect(u).toContain('effectif actuel indisponible');
    expect(u).not.toContain('offres depuis le');
  });

  it('R-D6-2.8-11 — le nom affiché est borné à 60 caractères (EX-SCR-212, EX-CRUD-2)', () => {
    const long = 'A'.repeat(90);
    const tree1 = render({ saved: [saved({ nom: long })] });
    const open = buttons(tree1).find((b) => norm(visibleTextOf(b)) === 'Ouvrir');
    expect(open).toBeDefined();
    const name = findAll(tree1, (n) => n.props['class'] === 'kycar-saved-name')[0];
    expect(name, 'nom de carte absent').toBeDefined();
    expect(norm(visibleTextOf(name)).replace(/…$/, '').length).toBeLessThanOrEqual(60);
  });
});

describe('D6 · EX-SCR-212 — panneau `Recherches récentes` (EX-CRUD-11/13, D8-31)', () => {
  it('R-D6-2.8-12 — les 10 entrées FIFO sont listées, avec l’action UNIQUE `Vider l’historique` (aucune suppression unitaire)', () => {
    const tree = render();
    const aside = findAll(tree, (n) => n.type === 'aside')[0];
    expect(aside, 'panneau latéral absent').toBeDefined();
    expect(findAll(aside, byType('li'))).toHaveLength(10);
    const names = buttonNames(aside);
    expect(names.filter((n) => /Vider l’historique|Vider l'historique/.test(n))).toHaveLength(1);
    expect(names.some((n) => /supprimer|retirer/i.test(n))).toBe(false);
  });
});

describe('D6 · EX-SCR-212 — présentation de la carte (feuille de style de l’écran E, D8-31)', () => {
  const css = readFileSync(join(process.cwd(), 'src/screens/saved/saved.css'), 'utf8');

  it('R-D6-2.8-13 — la carte fait 96 px et la description est tronquée à 2 lignes', () => {
    expect(css).toMatch(/\.kycar-saved-row\b[^}]*min-height:\s*96px/s);
    expect(css).toMatch(/\.kycar-saved-description\b[^}]*-webkit-line-clamp:\s*2/s);
  });
});
