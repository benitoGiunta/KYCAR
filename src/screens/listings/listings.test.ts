/**
 * KYCAR — Tests écran D : lignes, tri, pagination, export CSV sans R3 (lot D7)
 * =================================================================================================
 * Couvre EX-SCR-203/206/208 (tri, pagination) et le CRITÈRE DE SUCCÈS N°5 : export CSV sans aucun
 * champ vendeur R3, vérifié avec le garde R3 gelé de D2 (`R3_FORBIDDEN_FIELD_NAMES`).
 */

import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '../../engine/synthetic';
import { detectOutliers } from '../../engine/outliers';
import { R3_FORBIDDEN_FIELD_NAMES } from '../../types/index';
import { OutlierIndex } from '../outlier-index';
import { buildListingRow, type ListingRow } from './listing-fields';
import { sortListings, paginate, PAGE_SIZE, allOpportunityNull } from './listings-model';
import {
  exportListingsCsv,
  exportBucketsCsv,
  assertNoR3Columns,
  LISTINGS_HEADER,
  csvFileName,
  type CsvMeta,
} from './csv-export';

function fixture(n: number, seed = 99) {
  const ds = generateSyntheticDataset({ rowCount: n, seed });
  const rows = Int32Array.from({ length: n }, (_v, i) => i);
  const out = detectOutliers(ds.batch, rows, ds.batch.snapshotId, 'sel');
  const index = new OutlierIndex(out.verdicts);
  const listingRows: ListingRow[] = [];
  for (let i = 0; i < n; i++) listingRows.push(buildListingRow(ds.batch, i, index));
  return { ds, rows, listingRows, index, out };
}

const META: CsvMeta = {
  snapshotId: 'synthetic-d4',
  capturedAt: '2026-09-08T00:00:00Z',
  sourceKind: 'SYNTHETIC',
  filterQuery: 'make=1&model=101',
  sampleCoverage: 'NON_APPLICABLE',
  metricCoverage: '1,0',
};

describe('tri de l’écran D (EX-SCR-206)', () => {
  it('défaut : opportunityScore décroissant, absents en fin', () => {
    const { listingRows, ds } = fixture(2000);
    const sorted = sortListings(listingRows, ds.batch);
    // Les lignes avec score non nul précèdent toutes les lignes à score nul.
    let seenNull = false;
    for (const r of sorted) {
      if (r.opportunityScore == null) seenNull = true;
      else expect(seenNull).toBe(false); // aucun score non nul après un absent
    }
    // Décroissant parmi les non-nuls.
    const scored = sorted.filter((r) => r.opportunityScore != null).map((r) => r.opportunityScore as number);
    for (let i = 1; i < scored.length; i++) {
      expect(scored[i - 1]!).toBeGreaterThanOrEqual(scored[i]!);
    }
  });

  it('tri par prix ascendant place les absents en fin quel que soit le sens', () => {
    const { listingRows, ds } = fixture(1500, 5);
    const asc = sortListings(listingRows, ds.batch, { column: 'price', direction: 'asc' });
    const prices = asc.map((r) => r.priceEur);
    const firstNull = prices.findIndex((p) => p == null);
    if (firstNull >= 0) {
      for (let i = firstNull; i < prices.length; i++) expect(prices[i]).toBeNull();
    }
    // Croissant parmi les présents.
    const present = prices.filter((p): p is number => p != null);
    for (let i = 1; i < present.length; i++) expect(present[i - 1]!).toBeLessThanOrEqual(present[i]!);
  });

  it('bascule sur prix quand tous les scores sont nuls', () => {
    const rows: ListingRow[] = [
      { ...blankRow(0), priceEur: 3000, opportunityScore: null },
      { ...blankRow(1), priceEur: 1000, opportunityScore: null },
      { ...blankRow(2), priceEur: 2000, opportunityScore: null },
    ];
    const fakeBatch = { listingId: new Uint8Array(3 * 16) } as never;
    expect(allOpportunityNull(rows)).toBe(true);
    const sorted = sortListings(rows, fakeBatch);
    expect(sorted.map((r) => r.priceEur)).toEqual([1000, 2000, 3000]);
  });
});

describe('pagination client 50 (mandat lot D7)', () => {
  it('découpe en pages de 50 et écrête l’index', () => {
    const { listingRows, ds } = fixture(230, 11);
    const sorted = sortListings(listingRows, ds.batch);
    const p0 = paginate(sorted, 0);
    expect(p0.pageSize).toBe(PAGE_SIZE);
    expect(p0.rows.length).toBe(50);
    expect(p0.pageCount).toBe(5); // 230 → 5 pages
    const last = paginate(sorted, 99);
    expect(last.pageIndex).toBe(4);
    expect(last.rows.length).toBe(230 - 200);
  });
});

describe('export CSV des annonces — sans champ R3 (CRITÈRE 5, EX-CRUD-16/EX-NFR-26)', () => {
  it('l’en-tête ne contient aucun nom de champ R3 (garde gelé D2)', () => {
    expect(() => assertNoR3Columns(LISTINGS_HEADER)).not.toThrow();
    for (const col of LISTINGS_HEADER) {
      const norm = col.toLowerCase().replace(/[^a-z0-9]/g, '');
      expect(R3_FORBIDDEN_FIELD_NAMES.has(norm)).toBe(false);
    }
  });

  it('le CSV produit ne contient aucun libellé de champ vendeur interdit', () => {
    const { listingRows, ds } = fixture(120, 3);
    const sorted = sortListings(listingRows, ds.batch);
    const csv = exportListingsCsv(sorted.slice(0, 50), META);
    expect(csv.startsWith('﻿')).toBe(true); // BOM
    expect(csv).toContain('listing_id;prix;annee_mois');
    // Le fichier n'expose aucun des noms de champ R3 en clair dans son en-tête.
    const headerLine = csv.split('\r\n').find((l) => l.startsWith('listing_id'))!;
    for (const forbidden of ['contactname', 'companyname', 'sellerid', 'phone', 'email', 'zipcode', 'city']) {
      expect(headerLine.toLowerCase()).not.toContain(forbidden);
    }
  });

  it('assertNoR3Columns lève si une colonne interdite est injectée', () => {
    expect(() => assertNoR3Columns([...LISTINGS_HEADER, 'contactName'])).toThrow(/R3/);
  });

  it('INCONNU s’écrit cellule vide, la virgule est décimale', () => {
    const row: ListingRow = { ...blankRow(0), priceEur: null, deviationPct: -12.34, opportunityScore: 1.5 };
    const csv = exportListingsCsv([row], META);
    const dataLine = csv.trimEnd().split('\r\n').pop()!;
    const cells = dataLine.split(';');
    expect(cells[1]).toBe(''); // prix inconnu → vide
    expect(cells[7]).toBe('-12,3'); // ecart_pct virgule décimale (1 décimale)
  });
});

describe('export CSV des agrégats (EX-CRUD-16 #2)', () => {
  it('une ligne par bucket, nom du graphe en tête', () => {
    const buckets = [
      { snapshotId: 's', selectionHash: 'h', metric: 'price' as const, index: 0, lowerBound: 0, upperBound: 1000, open: false, count: 12, share: 0.5 },
    ];
    const csv = exportBucketsCsv([{ metric: 'price', buckets }], META);
    expect(csv).toContain('graphe;index;borne_basse');
    expect(csv).toContain('G1 Offres par prix;0;0;1000;non;12;0,5000');
  });
});

describe('nom de fichier (EX-DATA-123bis)', () => {
  it('kycar_<perimetre>_<snapshotId>_<AAAAMMJJ>.csv', () => {
    expect(csvFileName('opel-corsa', 'snap1', new Date(2026, 8, 8))).toBe('kycar_opel-corsa_snap1_20260908.csv');
  });
});

/** Ligne d'annonce vide pour les tests unitaires ciblés. */
function blankRow(row: number): ListingRow {
  return {
    row,
    listingId: `0000000000000000000000000000000${row}`.slice(-32),
    url: '',
    modelVersion: '',
    priceEur: null,
    mileageKm: null,
    regYearMonth: null,
    regYear: null,
    modelYear: null,
    powerKw: null,
    fuelCategory: null,
    co2X10: null,
    consumptionX10: null,
    previousOwnerCount: null,
    priceEvaluationCategory: null,
    sellerType: null,
    countryCode: null,
    regionCode: null,
    usageState: null,
    deviationPct: null,
    expectedPriceEur: null,
    opportunityScore: null,
    outlierFlags: [],
    cellLabel: null,
    cellCount: 0,
    outlierMethod: null,
  };
}
