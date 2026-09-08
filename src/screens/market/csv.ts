/**
 * KYCAR — Export CSV des agrégats de l'écran A (lot D6)
 * =================================================================================================
 * `EX-CRUD-14` (format : CSV, UTF-8 avec BOM, séparateur `;`) et `EX-CRUD-15` (périmètre mode 1 :
 * une ligne par couple marque/modèle actuellement affiché, respecte les filtres actifs ; colonnes =
 * les agrégats affichés sur la carte).
 *
 * GARDE R3 STRUCTURELLE : l'entrée de ce module (`MakeCardViewModel`/`ModelZoneViewModel`, `view-
 * model.ts`) ne contient, PAR CONSTRUCTION, aucun champ vendeur — elle dérive de `MakeAggregate`/
 * `ModelAggregate` (`src/providers/DataProvider.ts`), des types d'AGRÉGAT qui n'ont jamais porté la
 * moindre colonne d'annonce individuelle, encore moins de champ vendeur (E1..E14, R3). Aucun filtrage
 * a posteriori n'est donc nécessaire ici pour respecter R3 — la ligne de défense est le TYPE, pas un
 * scan. `csv.test.ts` le vérifie quand même avec le garde `scanForbiddenFields` de D2, pour que la
 * preuve soit exécutable et pas seulement argumentée.
 *
 * `draft-data-dictionary.md` (§B.3, note sous `EX-DATA-69`) : « Les écrans B et D ET l'export CSV
 * publient `rawRange`, sans écrêtage. » — cet export utilise donc TOUJOURS `[min, max]` bruts
 * (`rawMetrics`), jamais `[p05, p95]`, même si l'écran affiche `displayRange` au même endroit.
 */

import type { MakeCardViewModel } from './view-model';

/** `EX-DATA-123bis` — 15 colonnes normatives de l'export « Agrégats mode 1 » : effectif, médiane,
 * P5/P95 et fourchette brute du prix, fourchette brute année/km, et les trois effectifs PAR MÉTRIQUE
 * (`n_prix`/`n_annee`/`n_km`, `EX-DATA-59` — distincts de `nombreOffres`, qui est `listingCount`). */
export interface AggregateCsvRow {
  readonly marque: string;
  readonly modele: string;
  readonly offres: number;
  readonly prixMedianEur: number | null;
  readonly prixP5Eur: number | null;
  readonly prixP95Eur: number | null;
  readonly prixMinEur: number | null;
  readonly prixMaxEur: number | null;
  readonly anneeMin: number | null;
  readonly anneeMax: number | null;
  readonly kilometrageMin: number | null;
  readonly kilometrageMax: number | null;
  readonly nPrix: number;
  readonly nAnnee: number;
  readonly nKm: number;
}

/** Aplatit les cartes-marques en lignes d'export, une par couple marque/modèle actuellement
 * affiché (`EX-CRUD-15`). N'inclut PAS les modèles masqués par `EX-SCR-128` (déjà retirés de
 * `card.modelZones` en amont, dans `view-model.ts`) : l'export respecte les filtres actifs, y
 * compris ce filtre d'affichage. Le repliement (`EX-SCR-122`/`123`), lui, n'est qu'une troncature
 * VISUELLE — les modèles repliés restent dans `modelZones` et sont donc exportés. */
export function buildAggregateCsvRows(cards: readonly MakeCardViewModel[]): readonly AggregateCsvRow[] {
  const rows: AggregateCsvRow[] = [];
  for (const card of cards) {
    for (const zone of card.modelZones) {
      rows.push({
        marque: card.label,
        modele: zone.label,
        offres: zone.listingCount,
        prixMedianEur: zone.rawMetrics.price.p50,
        prixP5Eur: zone.rawMetrics.price.p05,
        prixP95Eur: zone.rawMetrics.price.p95,
        prixMinEur: zone.rawMetrics.price.min,
        prixMaxEur: zone.rawMetrics.price.max,
        anneeMin: zone.rawMetrics.year.min,
        anneeMax: zone.rawMetrics.year.max,
        kilometrageMin: zone.rawMetrics.mileage.min,
        kilometrageMax: zone.rawMetrics.mileage.max,
        nPrix: zone.rawMetrics.price.n,
        nAnnee: zone.rawMetrics.year.n,
        nKm: zone.rawMetrics.mileage.n,
      });
    }
  }
  return rows;
}

/** `EX-DATA-123bis` : en-tête exact, ordre exact — clés techniques minuscules, pas les libellés FR
 * affichés à l'écran (cohérent avec l'écran D, `listings/csv-export.ts`). */
const CSV_HEADER: readonly string[] = [
  'marque',
  'modele',
  'offres',
  'prix_median',
  'prix_p5',
  'prix_p95',
  'prix_min',
  'prix_max',
  'annee_min',
  'annee_max',
  'km_min',
  'km_max',
  'n_prix',
  'n_annee',
  'n_km',
];

/** `EX-CRUD-14` : séparateur `;` — une cellule qui contiendrait `;`, `"` ou un saut de ligne est
 * entourée de guillemets, ses guillemets internes doublés (RFC 4180, adapté au séparateur `;`). */
function csvCell(value: string | number | null): string {
  if (value === null) return '';
  const s = String(value);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowToLine(r: AggregateCsvRow): string {
  return [
    r.marque,
    r.modele,
    r.offres,
    r.prixMedianEur,
    r.prixP5Eur,
    r.prixP95Eur,
    r.prixMinEur,
    r.prixMaxEur,
    r.anneeMin,
    r.anneeMax,
    r.kilometrageMin,
    r.kilometrageMax,
    r.nPrix,
    r.nAnnee,
    r.nKm,
  ]
    .map(csvCell)
    .join(';');
}

/** Métadonnées d'en-tête de fichier (`EX-DATA-123bis`) : les trois lignes qui précèdent l'en-tête
 * des colonnes. Champs facultatifs, faute d'être tous portés aujourd'hui par `ScreenAState`
 * (`snapshotId`, la requête canonique et les deux couvertures viennent de l'hôte D8 — voir le
 * rapport de lot, § « Câblage attendu de fix-app ») : chaque champ absent est rendu par un repli
 * explicite, jamais par une valeur inventée. */
export interface AggregateCsvMeta {
  readonly snapshotId?: string;
  readonly capturedAt?: string;
  readonly sourceKind?: string;
  /** Requête canonique complète (`EX-NAV-9`). */
  readonly filterQuery?: string;
  readonly sampleCoverage?: string;
  readonly metricCoverage?: string;
}

function metaLines(meta: AggregateCsvMeta): string[] {
  return [
    ['# snapshot', meta.snapshotId ?? 'INCONNU', meta.capturedAt ?? '', meta.sourceKind ?? 'INCONNU'].map(csvCell).join(';'),
    ['# filtres', meta.filterQuery ?? ''].map(csvCell).join(';'),
    ['# couverture', meta.sampleCoverage ?? 'NON_APPLICABLE', meta.metricCoverage ?? ''].map(csvCell).join(';'),
  ];
}

/** `EX-CRUD-14` : BOM UTF-8 (compatibilité Excel FR), séparateur `;`, fin de ligne CRLF, précédé des
 * trois lignes de métadonnées normatives (`EX-DATA-123bis`). */
export function toCsvString(rows: readonly AggregateCsvRow[], meta: AggregateCsvMeta = {}): string {
  const BOM = '﻿';
  const lines = [...metaLines(meta), CSV_HEADER.map(csvCell).join(';'), ...rows.map(rowToLine)];
  return BOM + lines.join('\r\n');
}

export function buildAggregateCsv(cards: readonly MakeCardViewModel[], meta: AggregateCsvMeta = {}): string {
  return toCsvString(buildAggregateCsvRows(cards), meta);
}

/** Nom de fichier normatif (`EX-DATA-123bis`) : `kycar_<perimetre>_<snapshotId>_<AAAAMMJJ>.csv`. */
export function buildAggregateCsvFileName(perimeter: string, snapshotId: string, date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const safe = perimeter.replace(/[^a-zA-Z0-9_-]/g, '-');
  const safeId = (snapshotId || 'inconnu').replace(/[^a-zA-Z0-9_-]/g, '-');
  return `kycar_${safe}_${safeId}_${y}${m}${d}.csv`;
}
