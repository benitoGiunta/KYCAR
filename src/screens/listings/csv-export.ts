/**
 * KYCAR — Export CSV mode 2 (lot D7, EX-CRUD-16, EX-DATA-123bis, EX-CRUD-14)
 * =================================================================================================
 * Deux exports (EX-CRUD-16) : (1) CSV des annonces du périmètre — une ligne par annonce, AUCUN champ
 * identifiant un vendeur (R3) ; (2) CSV des agrégats affichés — une ligne par bucket des trois
 * histogrammes imposés, nom du graphe en première colonne.
 *
 * Format (EX-CRUD-14 / EX-DATA-123bis) : UTF-8 avec BOM, séparateur `;`, virgule décimale, sans
 * séparateur de milliers, `INCONNU` → cellule vide (jamais `0` ni `null`). Trois lignes de
 * métadonnées précèdent l'en-tête.
 *
 * GARANTIE R3 : les colonnes proviennent exclusivement du `ListingColumnBatch`, qui n'a par
 * construction aucune colonne vendeur (EX-NFR-26) ; `assertNoR3Columns` le vérifie sur l'en-tête au
 * moyen du garde gelé de D2 (`R3_FORBIDDEN_FIELD_NAMES`).
 *
 * Module PUR : testable sans DOM. La remise du fichier au navigateur (Blob/download) est faite par le
 * composant, jamais ici.
 */

import { R3_FORBIDDEN_FIELD_NAMES } from '../../types/index';
import type { DistributionBucket } from '../../types/index';
import type { ListingRow } from './listing-fields';

export const CSV_BOM = '﻿';
const SEP = ';';

/** En-tête des annonces (EX-DATA-123bis, section « Annonces »). */
export const LISTINGS_HEADER: readonly string[] = [
  'listing_id',
  'prix',
  'annee_mois',
  'km',
  'carburant',
  'puissance_kw',
  'prix_attendu',
  'ecart_pct',
  'score_opportunite',
  'drapeaux_outlier',
  'cellule',
  'cellule_n',
  'url',
  'modele_version',
  'type_vendeur',
  'pays',
  'region',
  'etat_usage',
];

/** En-tête des buckets d'agrégats (EX-DATA-123bis, section « Buckets mode 2 »). */
export const BUCKETS_HEADER: readonly string[] = [
  'graphe',
  'index',
  'borne_basse',
  'borne_haute',
  'ouvert',
  'effectif',
  'part',
];

/** Résolveurs de libellés facultatifs (fournis par D8/ReferenceData). */
export interface CsvLabelResolvers {
  readonly fuel?: (code: number) => string;
  readonly sellerType?: (code: number) => string;
  readonly country?: (code: number) => string;
  readonly region?: (code: number) => string;
  readonly usageState?: (code: number) => string;
}

/** Métadonnées d'en-tête de fichier (EX-DATA-123bis). */
export interface CsvMeta {
  readonly snapshotId: string;
  readonly capturedAt: string;
  readonly sourceKind: string;
  /** Chaîne de requête canonique complète (EX-NAV-9). */
  readonly filterQuery: string;
  readonly sampleCoverage: string;
  readonly metricCoverage: string;
}

/** Échappe une cellule CSV (séparateur `;`, guillemets, sauts de ligne). */
function cell(value: string): string {
  if (value.includes(SEP) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Nombre entier → texte (sans séparateur de milliers). `null` → cellule vide. */
function intCell(value: number | null): string {
  return value == null ? '' : String(value);
}

/** Nombre décimal → texte à virgule décimale, `digits` décimales. `null` → cellule vide. */
function decCell(value: number | null, digits: number): string {
  if (value == null) return '';
  return value.toFixed(digits).replace('.', ',');
}

/** Vérifie qu'aucun nom de colonne n'est un champ R3 (EX-NFR-26, garde gelé D2). Lève sinon. */
export function assertNoR3Columns(header: readonly string[]): void {
  for (const name of header) {
    const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (R3_FORBIDDEN_FIELD_NAMES.has(norm)) {
      throw new Error(`csv-export: colonne R3 interdite dans l'en-tête: ${name}`);
    }
  }
}

function metaLines(meta: CsvMeta): string[] {
  return [
    ['# snapshot', meta.snapshotId, meta.capturedAt, meta.sourceKind].map(cell).join(SEP),
    ['# filtres', meta.filterQuery].map(cell).join(SEP),
    ['# couverture', meta.sampleCoverage, meta.metricCoverage].map(cell).join(SEP),
  ];
}

/** Construit le CSV des annonces du périmètre (EX-CRUD-16 #1). */
export function exportListingsCsv(
  rows: readonly ListingRow[],
  meta: CsvMeta,
  labels: CsvLabelResolvers = {},
): string {
  assertNoR3Columns(LISTINGS_HEADER);
  const lines: string[] = [...metaLines(meta), LISTINGS_HEADER.map(cell).join(SEP)];
  for (const r of rows) {
    const fields = [
      r.listingId,
      intCell(r.priceEur),
      intCell(r.regYearMonth),
      intCell(r.mileageKm),
      r.fuelCategory == null ? '' : (labels.fuel?.(r.fuelCategory) ?? String(r.fuelCategory)),
      intCell(r.powerKw),
      intCell(r.expectedPriceEur),
      decCell(r.deviationPct, 1),
      decCell(r.opportunityScore, 3),
      r.outlierFlags.join('|'),
      r.cellLabel ?? '',
      r.cellCount === 0 ? '' : String(r.cellCount),
      r.url,
      r.modelVersion,
      r.sellerType == null ? '' : (labels.sellerType?.(r.sellerType) ?? String(r.sellerType)),
      r.countryCode == null ? '' : (labels.country?.(r.countryCode) ?? String(r.countryCode)),
      r.regionCode == null ? '' : (labels.region?.(r.regionCode) ?? String(r.regionCode)),
      r.usageState == null ? '' : (labels.usageState?.(r.usageState) ?? String(r.usageState)),
    ];
    lines.push(fields.map((f) => cell(String(f))).join(SEP));
  }
  return CSV_BOM + lines.join('\r\n') + '\r\n';
}

/** Nom canonique d'un graphe pour la colonne `graphe` de l'export d'agrégats. */
export type HistogramMetric = 'price' | 'mileage' | 'year';
const GRAPH_NAME: Record<HistogramMetric, string> = {
  price: 'G1 Offres par prix',
  mileage: 'G2 Offres par kilométrage',
  year: 'G3 Offres par année',
};

/** Construit le CSV des agrégats affichés (EX-CRUD-16 #2) : buckets des trois histogrammes. */
export function exportBucketsCsv(
  histograms: { readonly metric: HistogramMetric; readonly buckets: readonly DistributionBucket[] }[],
  meta: CsvMeta,
): string {
  assertNoR3Columns(BUCKETS_HEADER);
  const lines: string[] = [...metaLines(meta), BUCKETS_HEADER.map(cell).join(SEP)];
  for (const h of histograms) {
    for (const b of h.buckets) {
      const fields = [
        GRAPH_NAME[h.metric],
        String(b.index),
        Number.isFinite(b.lowerBound) ? intCell(b.lowerBound) : '',
        Number.isFinite(b.upperBound) ? intCell(b.upperBound) : '',
        b.open ? 'oui' : 'non',
        String(b.count),
        decCell(b.share, 4),
      ];
      lines.push(fields.map((f) => cell(f)).join(SEP));
    }
  }
  return CSV_BOM + lines.join('\r\n') + '\r\n';
}

/** Nom de fichier (EX-DATA-123bis). */
export function csvFileName(perimeter: string, snapshotId: string, date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const safe = perimeter.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `kycar_${safe}_${snapshotId}_${y}${m}${d}.csv`;
}
