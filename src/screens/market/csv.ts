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

export interface AggregateCsvRow {
  readonly marque: string;
  readonly modele: string;
  readonly nombreOffres: number;
  readonly prixMinEur: number | null;
  readonly prixMaxEur: number | null;
  readonly anneeMin: number | null;
  readonly anneeMax: number | null;
  readonly kilometrageMin: number | null;
  readonly kilometrageMax: number | null;
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
        nombreOffres: zone.listingCount,
        prixMinEur: zone.rawMetrics.price.min,
        prixMaxEur: zone.rawMetrics.price.max,
        anneeMin: zone.rawMetrics.year.min,
        anneeMax: zone.rawMetrics.year.max,
        kilometrageMin: zone.rawMetrics.mileage.min,
        kilometrageMax: zone.rawMetrics.mileage.max,
      });
    }
  }
  return rows;
}

const CSV_HEADER: readonly string[] = [
  'Marque',
  'Modèle',
  "Nombre d'offres",
  'Prix min (EUR)',
  'Prix max (EUR)',
  'Année min',
  'Année max',
  'Kilométrage min',
  'Kilométrage max',
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
  return [r.marque, r.modele, r.nombreOffres, r.prixMinEur, r.prixMaxEur, r.anneeMin, r.anneeMax, r.kilometrageMin, r.kilometrageMax]
    .map(csvCell)
    .join(';');
}

/** `EX-CRUD-14` : BOM UTF-8 (compatibilité Excel FR), séparateur `;`, fin de ligne CRLF. */
export function toCsvString(rows: readonly AggregateCsvRow[]): string {
  const BOM = '﻿';
  const lines = [CSV_HEADER.map(csvCell).join(';'), ...rows.map(rowToLine)];
  return BOM + lines.join('\r\n');
}

export function buildAggregateCsv(cards: readonly MakeCardViewModel[]): string {
  return toCsvString(buildAggregateCsvRows(cards));
}
