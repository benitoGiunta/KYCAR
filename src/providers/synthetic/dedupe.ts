/**
 * KYCAR — Audit de doublons du lot synthétique (EX-DATA-15, ARB-54/ADV-05 — DR-003 / DR-004)
 * =================================================================================================
 * `EX-DATA-15` : les annonces sont ordonnées par l'ordre total d'ingestion `(pageIndex, position
 * dans la page)` ; la PREMIÈRE occurrence d'un `listingId` dans cet ordre est conservée, les
 * suivantes sont écartées et comptées dans `duplicateListingCount`. `ARB-54` ajoute : si une
 * occurrence écartée diffère de l'occurrence conservée sur l'un des `DUPLICATE_CONFLICT_FIELDS`,
 * l'occurrence CONSERVÉE porte `DUPLICATE_VALUE_CONFLICT` et `duplicateValueConflictCount` est
 * incrémenté.
 *
 * SUR UN JEU SYNTHÉTIQUE, l'ordre total d'ingestion EST l'ordre des lignes (le générateur émet une
 * annonce après l'autre) et les identifiants sont tirés d'un espace de 122 bits : les doublons sont
 * improbables mais ne sont plus SUPPOSÉS absents — ils sont MESURÉS, et `duplicateListingCount`
 * cesse d'être une constante écrite en dur dans le descripteur (le constat de DR-003). La
 * déduplication qui RETIRE effectivement des lignes vit dans l'adaptateur de source réelle, seul
 * endroit où deux occurrences du même identifiant arrivent vraiment.
 *
 * L'audit n'alloue aucune chaîne : il indexe les 16 octets de `listingId` dans une table de hachage
 * ouverte en `Int32Array`, ce qui le laisse sous les 10 ms à 100 000 lignes (chemin critique, DR-049).
 */

import { DUPLICATE_CONFLICT_FIELDS } from '../../types/shared-rules';
import { setIngestFlag } from '../../types/vocabularies';
import type { MutableColumns } from './columnar';

/** Résultat de l'audit, tel qu'il alimente le `SnapshotDescriptor` (EX-DATA-106). */
export interface DuplicateAudit {
  readonly duplicateListingCount: number;
  readonly duplicateValueConflictCount: number;
  /** Indices des lignes écartées (occurrences non premières), dans l'ordre croissant. */
  readonly discardedRows: readonly number[];
}

/** Hachage FNV-1a 32 bits des 16 octets d'un `listingId`. */
function hashListingId(ids: Uint8Array, row: number): number {
  let h = 0x811c9dc5;
  const base = row * 16;
  for (let b = 0; b < 16; b += 1) {
    h ^= ids[base + b] as number;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Vrai si les deux lignes portent le même `listingId` (comparaison des 16 octets). */
function sameListingId(ids: Uint8Array, a: number, b: number): boolean {
  const pa = a * 16;
  const pb = b * 16;
  for (let i = 0; i < 16; i += 1) if (ids[pa + i] !== ids[pb + i]) return false;
  return true;
}

/**
 * Audite les doublons d'identifiant du lot dans l'ordre total d'ingestion (indice de ligne
 * croissant). Pose `DUPLICATE_VALUE_CONFLICT` sur l'occurrence CONSERVÉE quand une occurrence
 * écartée diverge sur l'un des quatre champs d'`ARB-54`.
 */
export function auditDuplicateListings(cols: MutableColumns, rowCount: number): DuplicateAudit {
  if (rowCount === 0) {
    return { duplicateListingCount: 0, duplicateValueConflictCount: 0, discardedRows: [] };
  }
  let capacity = 1;
  while (capacity < rowCount * 2) capacity *= 2;
  const mask = capacity - 1;
  const slots = new Int32Array(capacity); // 0 = libre, sinon `ligne + 1`
  const ids = cols.listingId;

  let duplicateListingCount = 0;
  let duplicateValueConflictCount = 0;
  const discardedRows: number[] = [];

  for (let row = 0; row < rowCount; row += 1) {
    let slot = hashListingId(ids, row) & mask;
    let kept = -1;
    for (;;) {
      const stored = slots[slot] as number;
      if (stored === 0) break;
      if (sameListingId(ids, stored - 1, row)) {
        kept = stored - 1;
        break;
      }
      slot = (slot + 1) & mask;
    }
    if (kept < 0) {
      slots[slot] = row + 1;
      continue;
    }
    duplicateListingCount += 1;
    discardedRows.push(row);
    if (hasValueConflict(cols, kept, row)) {
      duplicateValueConflictCount += 1;
      cols.ingestFlags[kept] = setIngestFlag(cols.ingestFlags[kept] as number, 'DUPLICATE_VALUE_CONFLICT');
    }
  }
  return { duplicateListingCount, duplicateValueConflictCount, discardedRows };
}

/** Vrai si les deux lignes divergent sur l'un des `DUPLICATE_CONFLICT_FIELDS` (ARB-54). */
function hasValueConflict(cols: MutableColumns, kept: number, other: number): boolean {
  for (const field of DUPLICATE_CONFLICT_FIELDS) {
    switch (field) {
      case 'priceEur':
        if (cols.priceEur[kept] !== cols.priceEur[other]) return true;
        break;
      case 'priceStatus':
        if (cols.priceStatus[kept] !== cols.priceStatus[other]) return true;
        break;
      case 'mileageKm':
        if (cols.mileageKm[kept] !== cols.mileageKm[other]) return true;
        break;
      case 'firstRegistrationYearMonth':
        if (cols.firstRegistrationYearMonth[kept] !== cols.firstRegistrationYearMonth[other]) return true;
        break;
    }
  }
  return false;
}
