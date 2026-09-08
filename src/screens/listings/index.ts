/**
 * KYCAR — Barrel de l'écran D (lot D7). Surface montable par D8.
 */

export { ListingsScreen } from './ListingsScreen';
export type { ListingsScreenProps, ListingsLabels } from './ListingsScreen';

// Modèles purs.
export { buildListingRow, readListingString, STRING_FIELD } from './listing-fields';
export type { ListingRow } from './listing-fields';
export { sortListings, paginate, allOpportunityNull, PAGE_SIZE } from './listings-model';
export type { SortColumn, SortState, SortDirection, ListingsPage } from './listings-model';
export {
  exportListingsCsv,
  exportBucketsCsv,
  assertNoR3Columns,
  csvFileName,
  LISTINGS_HEADER,
  BUCKETS_HEADER,
} from './csv-export';
export type { CsvMeta, CsvLabelResolvers } from './csv-export';

// Index d'outliers partagé (réexport pour D8).
export { OutlierIndex, comparisonBaseLabel, methodLabel } from '../outlier-index';
export type { OutlierEntry } from '../outlier-index';
