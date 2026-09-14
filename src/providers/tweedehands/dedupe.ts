/**
 * KYCAR — Adaptateur 2dehands (lot D9) : déduplication à l'ingestion (EX-DATA-15, ARB-54/ADV-05)
 * =================================================================================================
 * DR-003 / DR-004 (BLOQUANT). Aucune déduplication n'existait dans la chaîne : deux occurrences du
 * même `listingId` étaient comptées deux fois, `duplicateListingCount` était écrit en dur à `0`, et
 * `DUPLICATE_VALUE_CONFLICT` — pourtant au vocabulaire gelé — n'était écrit nulle part.
 *
 * `EX-DATA-15` fixe l'ordre TOTAL d'ingestion `(pageIndex, position dans la page)` : les annonces
 * arrivent page par page, dans l'ordre de lecture, et c'est cet ordre qui décide. `ARB-54` ajoute :
 *
 *   - la PREMIÈRE occurrence d'un `listingId` dans cet ordre est CONSERVÉE ;
 *   - les suivantes sont ÉCARTÉES et comptées dans `duplicateListingCount` ;
 *   - si une occurrence écartée diverge de l'occurrence conservée sur l'un des
 *     `DUPLICATE_CONFLICT_FIELDS` (prix, statut de prix, kilométrage, première immatriculation),
 *     l'occurrence CONSERVÉE porte `DUPLICATE_VALUE_CONFLICT` et `duplicateValueConflictCount` est
 *     incrémenté — l'écran D peut alors rendre le jeton d'`EX-SCR-203`.
 *
 * La clé est `listingKey(snapshotId, listingId)` (couche D2) : la déduplication est INTERNE à un
 * snapshot, jamais entre deux captures.
 */

import { DUPLICATE_CONFLICT_FIELDS, listingKey } from '../../types/shared-rules';
import type { SnapshotId } from '../DataProvider';
import type { NormalizedListing } from './normalize';

/** Résultat de la déduplication d'un lot d'annonces ingérées dans l'ordre total d'ARB-54. */
export interface DedupeResult {
  /** Annonces conservées, dans l'ordre d'ingestion, drapeaux de conflit posés. */
  readonly kept: readonly NormalizedListing[];
  readonly duplicateListingCount: number;
  readonly duplicateValueConflictCount: number;
}

/** Vrai si les deux occurrences divergent sur l'un des quatre champs d'`ARB-54`. */
function hasValueConflict(kept: NormalizedListing, other: NormalizedListing): boolean {
  for (const field of DUPLICATE_CONFLICT_FIELDS) {
    switch (field) {
      case 'priceEur':
        if (kept.priceEur !== other.priceEur) return true;
        break;
      case 'priceStatus':
        if (kept.priceStatus !== other.priceStatus) return true;
        break;
      case 'mileageKm':
        if (kept.mileageKm !== other.mileageKm) return true;
        break;
      case 'firstRegistrationYearMonth':
        // La surface ne sert pas le mois : la première immatriculation se compare à l'ANNÉE, seule
        // granularité disponible (EX-DATA-25, `firstRegistrationYear`).
        if (kept.firstRegistrationYear !== other.firstRegistrationYear) return true;
        break;
    }
  }
  return false;
}

/**
 * Déduplique un lot d'annonces normalisées dans l'ordre d'ingestion fourni (ordre total d'ARB-54 :
 * l'ordre du tableau EST `(pageIndex, position dans la page)`).
 */
export function dedupeListings(
  listings: readonly NormalizedListing[],
  snapshotId: SnapshotId,
): DedupeResult {
  const keptByKey = new Map<string, number>();
  const kept: NormalizedListing[] = [];
  let duplicateListingCount = 0;
  let duplicateValueConflictCount = 0;

  for (const listing of listings) {
    const key = listingKey(snapshotId, listing.listingId);
    const at = keptByKey.get(key);
    if (at === undefined) {
      keptByKey.set(key, kept.length);
      kept.push(listing);
      continue;
    }
    duplicateListingCount += 1;
    const first = kept[at] as NormalizedListing;
    if (!hasValueConflict(first, listing)) continue;
    duplicateValueConflictCount += 1;
    if (!first.ingestFlags.includes('DUPLICATE_VALUE_CONFLICT')) {
      kept[at] = { ...first, ingestFlags: [...first.ingestFlags, 'DUPLICATE_VALUE_CONFLICT'] };
    }
  }

  return { kept, duplicateListingCount, duplicateValueConflictCount };
}
