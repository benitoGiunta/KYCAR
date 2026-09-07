/**
 * KYCAR — Les entités du modèle (EX-DATA-105)
 * =================================================================================================
 * Lot D2. La table d'EX-DATA-105 NOMME les entités suivantes :
 *   Snapshot, Listing, Make, Model, Enumeration, EnumValue, Region, PostalRegionRange,
 *   MakeAggregate, ModelAggregate, DistributionBucket, SelectionStats, OutlierVerdict, DensityCell.
 *
 * DIVERGENCE DE SOURCE SIGNALÉE (non corrigée) : l'énoncé d'EX-DATA-105 et de ARCHITECTURE §2.1
 * dit « treize entités », mais la table en NOMME quatorze (ci-dessus). EX-DATA-114 (clés primaires)
 * n'attribue pas de clé propre à `Enumeration` ni à `Region` — elles sont clefées via leurs enfants
 * `EnumValue` et `PostalRegionRange`. On type ici tout concept nommé : mieux vaut un type de plus
 * qu'un concept normatif sans type. L'écart « 13 vs 14 » est remonté au rapport de lot.
 *
 * `Listing` (entité #2) est définie dans `columns.ts` (vue logique) et matérialisée en colonnes
 * typées par `ListingColumnBatch` (`DataProvider.ts`). Les agrégats mode 1 (`MakeAggregate`,
 * `ModelAggregate`, `MetricRange`) et le descripteur de snapshot sont RÉEXPORTÉS de l'interface
 * gelée pour qu'il n'existe qu'une seule définition dans tout le code.
 */

import type { EnumValueDef, VocabularyName } from './vocabularies';

export type { Listing } from './columns';
export type {
  MakeAggregate,
  ModelAggregate,
  MetricRange,
  AggregateResult,
  AggregateLevel,
  SnapshotDescriptor,
  SnapshotHandle,
  SnapshotId,
  Marketplace,
  SourceKind,
} from '../providers/DataProvider';

/* ================================================================================================
 * Snapshot (EX-DATA-106) — persistée
 * ============================================================================================== */

/**
 * Un lot d'ingestion et ses métadonnées de qualité (EX-DATA-106). Sur-ensemble de
 * `SnapshotDescriptor` (`DataProvider.ts`) : mêmes champs de qualité, plus la portée entité.
 */
export interface Snapshot {
  readonly snapshotId: string;
  readonly marketplace: 'be' | 'nl';
  /** ISO-8601 UTC. */
  readonly capturedAt: string;
  readonly sourceKind: 'REAL' | 'SYNTHETIC';
  readonly providerVersion: string;
  readonly listingCount: number;
  /** Dénominateur de `sampleCoverage`, ou `null` si la source ne le fournit pas (ARB-01). */
  readonly announcedListingCount: number | null;
  readonly rejectedCount: number;
  readonly rejectedByReason: Readonly<Record<string, number>>;
  readonly duplicateListingCount: number;
  readonly duplicateValueConflictCount: number;
  /** Par champ, nombre d'annonces à valeur absente/inconnue (EX-DATA-106). */
  readonly unknownCountByField: Readonly<Record<string, number>>;
  /** Par code de `KYCAR_INGEST_FLAG`, l'effectif d'annonces portant le drapeau (EX-DATA-46). */
  readonly ingestFlagCounts: Readonly<Record<string, number>>;
  readonly versionStrippedRate: number;
  readonly coverageNote: string | null;
}

/* ================================================================================================
 * Taxonomie statique : Make, Model (EX-DATA-105, C.0)
 * ============================================================================================== */

/** Marque de référence — clé primaire `makeId` (295 marques dans `taxonomy.json`). */
export interface Make {
  readonly makeId: number;
  /** Libellé canonique, NFC. */
  readonly label: string;
  readonly slug: string;
  /** Effectif annoncé par la source, ou `null` (INCONNU, ARB-01). */
  readonly announcedCount: number | null;
}

/** Modèle de référence — clé primaire `(makeId, modelId)` (4 955 modèles). */
export interface Model {
  readonly makeId: number;
  readonly modelId: number;
  readonly label: string;
  readonly slug: string;
  /**
   * Codes `KYCAR_BODY_TYPE` du modèle (EX-DATA-115bis). `taxonomy.json` ne porte PAS ce champ
   * (dette signalée) : le chargeur produit donc systématiquement le tableau vide, jamais `INCONNU`.
   */
  readonly bodyTypes: readonly string[];
  readonly announcedCount: number | null;
}

/* ================================================================================================
 * Vocabulaires statiques : Enumeration, EnumValue (EX-DATA-105, §A.1)
 * ============================================================================================== */

/** Un vocabulaire nommé (EX-DATA-8) et ses valeurs. Clefée par `vocabulary` (via ses `EnumValue`). */
export interface Enumeration {
  readonly vocabulary: VocabularyName;
  /** Provenance : fichier de référence lu, ou « CRÉÉ » pour un vocabulaire propre KYCAR. */
  readonly origin: string;
  readonly values: readonly EnumValueDef[];
  /** Index code → libellé pour un décodage O(1) (le vocabulaire est TOUJOURS explicite, EX-DATA-9). */
  readonly byCode: ReadonlyMap<string, string>;
}

/** Une valeur d'un vocabulaire — clé primaire `(vocabulary, code)` (EX-DATA-114). */
export interface EnumValue {
  readonly vocabulary: VocabularyName;
  readonly code: string;
  readonly label: string;
}

/* ================================================================================================
 * Géographie statique : Region, PostalRegionRange (EX-DATA-105, §A.8)
 * ============================================================================================== */

/** Une région NUTS-2 (EX-DATA-51). Clefée via ses `PostalRegionRange`. */
export interface Region {
  readonly regionCode: string;
  readonly regionName: string;
  readonly countryCode: string;
}

/**
 * Une plage de codes postaux → région (EX-DATA-52), clé primaire `(countryCode, lo)` avec
 * contrainte de non-recouvrement (EX-DATA-114). Bornes inclusives.
 */
export interface PostalRegionRange {
  readonly countryCode: string;
  readonly lo: number;
  readonly hi: number;
  readonly regionCode: string;
}

/* ================================================================================================
 * Entités calculées : DistributionBucket, SelectionStats, OutlierVerdict, DensityCell
 * ============================================================================================== */

/** Métrique d'agrégation (EX-DATA-59). */
export type AggregationMetric = 'price' | 'year' | 'mileage';

/**
 * Un bin d'histogramme (§B.5) — clé primaire `(snapshotId, selectionHash, metric, index)`.
 * Ordre : `index` croissant, bin de débordement bas en tête, bin de débordement haut en fin
 * (EX-DATA-75).
 */
export interface DistributionBucket {
  readonly snapshotId: string;
  readonly selectionHash: string;
  readonly metric: AggregationMetric;
  readonly index: number;
  readonly lowerBound: number;
  readonly upperBound: number;
  /** Bin de débordement (borne ouverte). */
  readonly open: boolean;
  readonly count: number;
  /** Part de l'effectif de la métrique, `count / n_m` (EX-DATA §B.5). */
  readonly share: number;
}

/** Statistiques descriptives d'une métrique sur une sélection (§B.2). `null` = non calculable. */
export interface MetricStats {
  readonly n: number;
  readonly min: number | null;
  readonly max: number | null;
  readonly mean: number | null;
  readonly p05: number | null;
  readonly p25: number | null;
  readonly p50: number | null;
  readonly p75: number | null;
  readonly p95: number | null;
  readonly stdDev: number | null;
}

/**
 * Bloc statistique de la sélection entière (§B.2) — clé primaire `(snapshotId, selectionHash)`.
 * Porte les compteurs de couverture de prix (EX-DATA-17) et d'outlier nécessaires aux invariants
 * I5 et I6.
 */
export interface SelectionStats {
  readonly snapshotId: string;
  readonly selectionHash: string;
  /** Effectif total de la sélection `N` (EX-DATA-59). */
  readonly selectionCount: number;
  readonly price: MetricStats;
  readonly year: MetricStats;
  readonly mileage: MetricStats;
  readonly priceQuotedCount: number;
  readonly priceOnRequestCount: number;
  readonly priceMissingCount: number;
  readonly outlierEvaluatedCount: number;
  readonly outlierNotEvaluatedCount: number;
}

/** Méthode de détection d'outlier (§B.6). */
export type OutlierMethod = 'M1' | 'M2' | 'M3';

/**
 * Verdict de détection par annonce (§B.6) — clé primaire
 * `(snapshotId, selectionHash, listingId, method)`.
 */
export interface OutlierVerdict {
  readonly snapshotId: string;
  readonly selectionHash: string;
  readonly listingId: string;
  readonly method: OutlierMethod;
  /** Codes `KYCAR_OUTLIER_FLAG` posés par la méthode. */
  readonly flags: readonly string[];
  /** Prix attendu par le modèle (M2), ou `null`. */
  readonly expectedPriceEur: number | null;
  /** Écart relatif au prix attendu, en pourcentage, ou `null`. */
  readonly deviationPct: number | null;
  /** Score d'opportunité (§B.6.3), ou `null`. */
  readonly opportunityScore: number | null;
  /** Cellule d'homogénéité au sens d'EX-DATA-86, nommée pour l'étiquetage. */
  readonly cellLabel: string | null;
  readonly cellCount: number;
}

/**
 * Cellule de la grille année × kilométrage (§B.7) — clé primaire
 * `(snapshotId, selectionHash, yearBinIndex, mileageBinIndex)`. Au plus 676 cellules (EX-DATA-102).
 */
export interface DensityCell {
  readonly snapshotId: string;
  readonly selectionHash: string;
  readonly yearBinIndex: number;
  readonly mileageBinIndex: number;
  readonly count: number;
}
