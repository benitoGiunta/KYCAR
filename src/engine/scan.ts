/**
 * KYCAR — Balayage colonnaire de sélection avec élagage (lot D4, EX-DATA-110/116)
 * =================================================================================================
 * Le balayage applique, en UN passage séquentiel, tous les prédicats de classe `R` posés
 * (EX-DATA-110). L'ÉLAGAGE (EX-DATA-116) choisit la source des lignes candidates : si la sélection
 * contraint `(makeId, modelId)` ou `makeId`, on part de `IDX_MODEL` / `IDX_MAKE` au lieu de parcourir
 * les `N` lignes — le mode 2 devient `O(m)`, `m` étant l'effectif du modèle.
 *
 * `scannedCount` mesure le nombre de lignes réellement examinées : c'est le témoin du facteur
 * d'élagage (`N / scannedCount`), vérifié par le banc de perf.
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { DatasetIndexes } from './index-build';
import { modelIndexKey } from './index-build';
import type { CompiledPredicate, TaxonomyScope } from './predicates';

/** Résultat d'un balayage : indices de ligne retenus, et nombre de lignes examinées. */
export interface ScanResult {
  readonly rows: Int32Array;
  /** Lignes réellement examinées (candidat après élagage). `N / scannedCount` = facteur d'élagage. */
  readonly scannedCount: number;
  /** `true` si l'élagage taxonomique a été appliqué (départ d'un index, pas de balayage complet). */
  readonly pruned: boolean;
}

/**
 * Fusionne des tranches d'index individuellement croissantes en UN tableau globalement croissant.
 *
 * `EX-DATA-116` exige que le chemin élagué et le balayage complet rendent les MÊMES chiffres. Le
 * balayage complet visite les lignes `0..N-1` dans l'ordre ; une simple concaténation des tranches
 * (marque par marque, modèle par modèle) visite les mêmes lignes dans un ORDRE différent. Les
 * sommations flottantes du moteur (moyennes, régression M2) ne sont pas associatives : un écart
 * d'un ulp sur `β̂` suffit à basculer l'arrondi à 9 chiffres de `deviationPct`
 * (D-34 ; `reports/remediation/fix-foundation.md` §4). La fusion triée rend les deux chemins
 * identiques octet à octet.
 *
 * Les tranches d'`IDX_MAKE`/`IDX_MODEL` sont déjà croissantes et le cas fréquent (une seule tranche,
 * ou tranches déjà en ordre global) ne coûte qu'une comparaison par frontière.
 */
function mergeSortedSlices(chunks: readonly Int32Array[], total: number): Int32Array {
  const rows = new Int32Array(total);
  let cursor = 0;
  let ordered = true;
  for (const chunk of chunks) {
    if (chunk.length === 0) continue;
    if (cursor > 0 && (rows[cursor - 1] as number) > (chunk[0] as number)) ordered = false;
    rows.set(chunk, cursor);
    cursor += chunk.length;
  }
  // `Int32Array.prototype.sort()` sans comparateur trie NUMÉRIQUEMENT en ordre croissant : c'est
  // exactement l'ordre de visite du balayage complet. Les indices de ligne sont deux à deux
  // distincts (une ligne porte un seul couple marque/modèle), la fusion est donc sans ambiguïté.
  if (!ordered) rows.sort();
  return rows;
}

/**
 * Construit la liste des lignes candidates après élagage taxonomique (EX-DATA-116).
 * `rows === null` signifie « toutes les lignes » (pas d'élagage) ; le balayage part alors de `[0, N)`.
 * Exporté pour que le calcul de facettes (EX-DATA-110bis) partage exactement la même source.
 */
export function candidateRows(indexes: DatasetIndexes, scope: TaxonomyScope | undefined): {
  rows: Int32Array | null;
  pruned: boolean;
} {
  if (scope?.models && scope.models.length > 0) {
    const chunks: Int32Array[] = [];
    let total = 0;
    for (const { makeId, modelId } of scope.models) {
      const range = indexes.modelOffsets.get(modelIndexKey(makeId, modelId));
      if (range === undefined) continue;
      const slice = indexes.idxModelRows.subarray(range.start, range.end);
      chunks.push(slice);
      total += slice.length;
    }
    return { rows: mergeSortedSlices(chunks, total), pruned: true };
  }
  if (scope?.makeIds && scope.makeIds.length > 0) {
    const chunks: Int32Array[] = [];
    let total = 0;
    for (const makeId of scope.makeIds) {
      const range = indexes.makeOffsets.get(makeId);
      if (range === undefined) continue;
      const slice = indexes.idxMakeRows.subarray(range.start, range.end);
      chunks.push(slice);
      total += slice.length;
    }
    return { rows: mergeSortedSlices(chunks, total), pruned: true };
  }
  return { rows: null, pruned: false };
}

/**
 * Balaie la sélection. Retourne les lignes qui satisfont tous les prédicats de raffinement, en
 * partant d'un index taxonomique si la sélection s'y prête (élagage), sinon des `N` lignes.
 */
export function scanSelection(
  indexes: DatasetIndexes,
  predicates: readonly CompiledPredicate[],
  scope?: TaxonomyScope,
): ScanResult {
  const { rows: candidates, pruned } = candidateRows(indexes, scope);
  const n = indexes.rowCount;
  const source = candidates ?? null;
  const sourceLength = source ? source.length : n;

  // Cas fréquent : aucun prédicat R → toutes les lignes candidates passent.
  if (predicates.length === 0) {
    const rows = source ? Int32Array.from(source) : Int32Array.from({ length: n }, (_v, i) => i);
    return { rows, scannedCount: sourceLength, pruned };
  }

  const matched = new Int32Array(sourceLength);
  let count = 0;
  for (let idx = 0; idx < sourceLength; idx++) {
    const row = source ? (source[idx] as number) : idx;
    let ok = true;
    for (let p = 0; p < predicates.length; p++) {
      if (!(predicates[p] as CompiledPredicate).test(row)) {
        ok = false;
        break;
      }
    }
    if (ok) matched[count++] = row;
  }
  return { rows: matched.subarray(0, count), scannedCount: sourceLength, pruned };
}
