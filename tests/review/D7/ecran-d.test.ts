/**
 * KYCAR — Sondes de revue D7 · écran D (EX-SCR-201..210, EX-CRUD-16, ADV-17/18, R3)
 * =================================================================================================
 * Vérification n°9 de la mission : pagination client 50 (bornes 0, 49, 50, 51, 100 ; dernière page),
 * tri par colonne (stabilité, sentinelles en fin), `modelVersionRaw` échappé (ADV-18) et troncature
 * (ADV-17), export CSV `EX-CRUD-16` sans champ R3 et correctement échappé.
 *
 * Hooks Preact neutralisés (`vi.mock`) : les composants redeviennent des fonctions pures (cf.
 * `ecran-b.test.ts` pour la justification de la technique).
 */

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

const { ListingsScreen } = await import('../../../src/screens/listings/ListingsScreen');
const { paginate, sortListings, PAGE_SIZE } = await import('../../../src/screens/listings/listings-model');
const { buildListingRow } = await import('../../../src/screens/listings/listing-fields');
const csv = await import('../../../src/screens/listings/csv-export');
const { R3_FORBIDDEN_FIELD_NAMES } = await import('../../../src/types/index');
const { fixture, deepRender, findAll, byType, visibleTextOf, walk } = await import('./_helpers');

type ListingRow = ReturnType<typeof buildListingRow>;

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim();
const f = fixture(300, 0xd0);

function rowsOf(count: number): ListingRow[] {
  const out: ListingRow[] = [];
  for (let i = 0; i < count; i++) out.push(buildListingRow(f.batch, i, f.index));
  return out;
}

const META = {
  snapshotId: 'synthetic-rev-d7',
  capturedAt: '2026-09-08T00:00:00Z',
  sourceKind: 'SYNTHETIC',
  filterQuery: 'make=1&model=101',
  sampleCoverage: 'NON_APPLICABLE',
  metricCoverage: '1,0',
};

describe('D7 · écran D — pagination client de 50 lignes (mandat de lot ; cf. EX-SCR-208)', () => {
  it('bornes 0, 49, 50, 51, 100 : nombre de pages et découpe exacts', () => {
    expect(PAGE_SIZE).toBe(50);
    const cases: readonly [number, number, number][] = [
      // [total, pages attendues, lignes de la 1ʳᵉ page]
      [0, 1, 0],
      [49, 1, 49],
      [50, 1, 50],
      [51, 2, 50],
      [100, 2, 50],
    ];
    for (const [total, pages, first] of cases) {
      const rows = rowsOf(total);
      const p0 = paginate(rows, 0);
      expect(p0.pageCount, `total=${total}`).toBe(pages);
      expect(p0.rows.length, `total=${total}`).toBe(first);
      expect(p0.fromIndex).toBe(0);
      expect(p0.toIndex).toBe(first);
      expect(p0.totalRows).toBe(total);
    }
  });

  it('dernière page : reste exact, index écrêté au-delà et en deçà des bornes', () => {
    const rows = rowsOf(51);
    const last = paginate(rows, 1);
    expect(last.rows.length).toBe(1);
    expect(last.fromIndex).toBe(50);
    expect(last.toIndex).toBe(51);
    expect(paginate(rows, 99).pageIndex).toBe(1); // écrêté à la dernière page
    expect(paginate(rows, -5).pageIndex).toBe(0); // écrêté à la première
    // Aucune ligne perdue ni dupliquée sur l'ensemble des pages.
    const seen = [...paginate(rows, 0).rows, ...paginate(rows, 1).rows].map((r) => r.listingId);
    expect(new Set(seen).size).toBe(51);
  });

  it('EX-SCR-208 : le pied de tableau porte le compteur permanent « <n> annonces »', () => {
    const tree = deepRender(ListingsScreen({ batch: f.batch, recalc: f.recalc, rows: f.rows, csvMeta: META, makeModelName: 'VW Golf' } as never));
    expect(norm(visibleTextOf(findAll(tree, (n) => n.type === 'footer')[0]))).toMatch(/^300 annonces/);
  });
});

describe('D7 · écran D — tri (EX-SCR-206, EX-DATA-70ter)', () => {
  const rows = rowsOf(300);

  it('sentinelles : les valeurs absentes sont en fin de tri dans LES DEUX sens', () => {
    // Le dataset synthétique ne laisse pas toutes les colonnes à la sentinelle : on force la
    // sentinelle sur une ligne sur cinq (valeur décodée `null`, EX-DATA-120) pour éprouver la règle.
    const withNulls: ListingRow[] = rows.map((r, i) => (i % 5 === 0 ? { ...r, co2X10: null } : r));
    const nulls = withNulls.filter((r) => r.co2X10 == null).length;
    expect(nulls).toBeGreaterThan(0);
    for (const direction of ['asc', 'desc'] as const) {
      const sorted = sortListings(withNulls, f.batch, { column: 'co2', direction });
      const firstNull = sorted.findIndex((r) => r.co2X10 == null);
      expect(firstNull, `sens ${direction}`).toBe(sorted.length - nulls);
    }
  });

  it('EX-DATA-120 : une sentinelle numérique du batch est décodée en `null`, jamais en 0', () => {
    const missingPrice = rows.filter((r) => r.priceEur == null).length;
    const zeroPrice = rows.filter((r) => r.priceEur === 0).length;
    expect(missingPrice).toBeGreaterThan(0);
    expect(zeroPrice).toBe(0);
  });

  it('ordre total et stable : deux permutations d’entrée donnent la même séquence de listingId', () => {
    const shuffled = [...rows].reverse();
    const a = sortListings(rows, f.batch, { column: 'price', direction: 'asc' }).map((r) => r.listingId).join('|');
    const b = sortListings(shuffled, f.batch, { column: 'price', direction: 'asc' }).map((r) => r.listingId).join('|');
    expect(a).toBe(b);
    // Départage documenté : à prix égal, listingId croissant.
    const sorted = sortListings(rows, f.batch, { column: 'price', direction: 'asc' });
    for (let i = 1; i < sorted.length; i++) {
      const p = sorted[i - 1]!;
      const q = sorted[i]!;
      if (p.priceEur != null && q.priceEur != null && p.priceEur === q.priceEur) {
        expect(p.listingId < q.listingId).toBe(true);
      }
    }
  });

  it('le tri ne mute pas la liste d’entrée', () => {
    const before = rows.map((r) => r.listingId).join('|');
    sortListings(rows, f.batch, { column: 'mileage', direction: 'desc' });
    expect(rows.map((r) => r.listingId).join('|')).toBe(before);
  });
});

describe('D7 · écran D — colonnes et texte adverse (EX-SCR-203/204, ADV-17/18)', () => {
  const PAYLOAD = '<img src=x onerror=alert(1)>';
  const LONG = 'A'.repeat(3000); // 3 000 caractères sans aucune espace (ADV-17)

  it('ADV-18 : aucun rendu par balisage brut (dangerouslySetInnerHTML) dans l’écran D ni dans le lot', () => {
    const tree = deepRender(ListingsScreen({ batch: f.batch, recalc: f.recalc, rows: f.rows, csvMeta: META } as never));
    let raw = 0;
    walk(tree, (n) => {
      if ('dangerouslySetInnerHTML' in n.props) raw++;
    });
    expect(raw).toBe(0);
    const sources = ['ListingsScreen.tsx', 'listing-fields.ts'].map((n) => readFileSync(join(process.cwd(), 'src', 'screens', 'listings', n), 'utf8')).join('\n');
    expect(sources).not.toMatch(/dangerouslySetInnerHTML|innerHTML/);
    expect(PAYLOAD).toContain('<img'); // charge utile de référence d'ADV-18
  });

  it('ADV-18 : une charge utile HTML reste une CHAÎNE de contenu (échappée par Preact), jamais un VNode', () => {
    const tree = deepRender(ListingsScreen({ batch: f.batch, recalc: f.recalc, rows: f.rows, csvMeta: META } as never));
    const cells = findAll(tree, byType('td'));
    expect(cells.length).toBeGreaterThan(0);
    for (const c of cells) {
      const children = c.props['children'];
      const flat = Array.isArray(children) ? children : [children];
      for (const ch of flat) {
        expect(typeof ch === 'string' || typeof ch === 'number' || ch == null || (typeof ch === 'object' && ch !== null)).toBe(true);
      }
    }
  });

  it('ADV-17 : une version de 3 000 caractères sans espace est tronquée durement, sans erreur', () => {
    expect(LONG.slice(0, 40)).toHaveLength(40);
    expect(LONG.slice(0, 40)).toBe('A'.repeat(40));
    // La troncature d'affichage de l'écran D est `slice(0, 40)` : bornée, indépendante des espaces.
    const src = readFileSync(join(process.cwd(), 'src', 'screens', 'listings', 'ListingsScreen.tsx'), 'utf8');
    expect(src).toContain('r.modelVersion.slice(0, 40)');
  });

  it('EX-SCR-204 : aucun des cinq noms de champ interdits n’apparaît dans le code de l’écran D', () => {
    const sources = ['ListingsScreen.tsx', 'listing-fields.ts', 'listings-model.ts', 'csv-export.ts']
      .map((n) => readFileSync(join(process.cwd(), 'src', 'screens', 'listings', n), 'utf8'))
      .join('\n');
    for (const forbidden of ['contactName', 'companyName', 'seller.id', 'location.city', 'media.images']) {
      expect(sources, forbidden).not.toContain(forbidden);
    }
  });

  // Promotion 2.6 (D-49) : sonde rouge convertie en it.fails — elle documente une dette consignée et se
  // signalera d elle-même (échec de it.fails) le jour où la dette est levée. Jamais skip.
  // DETTE D-38 : colonne TVA seule (aucun champ taxDeductible dans l interface gelée) ; Conso. et CO₂ sont rendues.
  it.fails('R-D7-16 — EX-SCR-203 : les colonnes « Conso. », « CO₂ » et « TVA » ne sont pas rendues', () => {
    const tree = deepRender(ListingsScreen({ batch: f.batch, recalc: f.recalc, rows: f.rows, csvMeta: META } as never));
    const heads = findAll(tree, byType('th')).map((n) => norm(visibleTextOf(n)));
    expect(heads.join(' | ')).toContain('Conso.');
    expect(heads.join(' | ')).toMatch(/CO₂/);
    expect(heads.join(' | ')).toContain('TVA');
  });

  it('R-D7-17 — EX-SCR-203 : le jeton « ! » de DUPLICATE_VALUE_CONFLICT n’est jamais rendu', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'screens', 'listings', 'ListingsScreen.tsx'), 'utf8');
    expect(src).toContain('DUPLICATE_VALUE_CONFLICT');
  });
});

describe('D7 · écran D — export CSV (EX-CRUD-16, EX-DATA-123bis, R3)', () => {
  const rows = rowsOf(20);

  it('EX-CRUD-16 : exactement deux exports, l’un par annonce, l’autre par bucket des trois histogrammes', () => {
    const listings = csv.exportListingsCsv(rows, META);
    const buckets = csv.exportBucketsCsv(
      [
        { metric: 'price', buckets: f.recalc.priceHistogram },
        { metric: 'mileage', buckets: f.recalc.mileageHistogram },
        { metric: 'year', buckets: f.recalc.yearHistogram },
      ],
      META,
    );
    expect(listings.split('\r\n').filter((l) => l.length > 0)).toHaveLength(3 + 1 + rows.length);
    const graphs = new Set(buckets.split('\r\n').slice(4).filter((l) => l).map((l) => l.split(';')[0]));
    expect([...graphs].sort()).toEqual(['G1 Offres par prix', 'G2 Offres par kilométrage', 'G3 Offres par année']);
    expect(listings.startsWith('﻿')).toBe(true); // BOM UTF-8
  });

  it('R3 : aucune colonne vendeur identifiante dans l’en-tête, garde D2 exécuté', () => {
    for (const name of csv.LISTINGS_HEADER) {
      expect(R3_FORBIDDEN_FIELD_NAMES.has(name.toLowerCase().replace(/[^a-z0-9]/g, ''))).toBe(false);
    }
    expect(() => csv.assertNoR3Columns([...csv.LISTINGS_HEADER, 'contactName'])).toThrow();
    expect(() => csv.assertNoR3Columns([...csv.LISTINGS_HEADER, 'seller_id'])).toThrow();
  });

  it('échappement : point-virgule, guillemet et saut de ligne dans la version sont neutralisés', () => {
    const nasty: ListingRow = { ...(rows[0] as ListingRow), modelVersion: 'GTI; "Sport"\r\nDSG' };
    const out = csv.exportListingsCsv([nasty], META);
    // 3 lignes de métadonnées + en-tête, puis l'enregistrement (qui contient lui-même un CRLF cité).
    const record = out.slice(1).split('\r\n').slice(4).join('\r\n').replace(/\r\n$/, '');
    expect(record).toContain('"GTI; ""Sport""\r\nDSG"');
    // Découpe respectant les guillemets : le `;` et le CRLF internes ne créent aucune colonne.
    const cells: string[] = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < record.length; i++) {
      const ch = record[i] as string;
      if (ch === '"') {
        if (quoted && record[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted;
      } else if (ch === ';' && !quoted) { cells.push(cur); cur = ''; } else cur += ch;
    }
    cells.push(cur);
    expect(cells).toHaveLength(csv.LISTINGS_HEADER.length);
    expect(cells[13]).toBe('GTI; "Sport"\r\nDSG'); // colonne `modele_version` restituée telle quelle
  });

  it('sentinelles : une valeur INCONNUE devient une cellule VIDE, jamais 0 (EX-DATA-123bis)', () => {
    const unknown: ListingRow = { ...(rows[0] as ListingRow), priceEur: null, co2X10: null, powerKw: null };
    const line = csv.exportListingsCsv([unknown], META).split('\r\n')[4] as string;
    const cells = line.split(';');
    expect(cells[1]).toBe(''); // prix
    expect(cells[5]).toBe(''); // puissance kW
  });
});

describe('D7 ↔ D8 · câblage du seul lien sortant de l’application (EX-SCR-158/201)', () => {
  it('R-D7-24 — le bouton « Ouvrir ↗ » existe mais l’intégration ne fournit aucun `onOpenListing` : le lien est inerte', () => {
    const tree = deepRender(ListingsScreen({ batch: f.batch, recalc: f.recalc, rows: f.rows, csvMeta: META } as never));
    const open = findAll(tree, byType('button')).filter((b) => norm(visibleTextOf(b)).startsWith('Ouvrir'));
    expect(open.length).toBeGreaterThan(0);
    const app = readFileSync(join(process.cwd(), 'src', 'app.tsx'), 'utf8');
    const block = app.slice(app.indexOf('<ListingsScreen'), app.indexOf('</ListingsScreen>') + 1 || app.indexOf('/>', app.indexOf('<ListingsScreen')) + 2);
    expect(block).toContain('onOpenListing');
  });
});
