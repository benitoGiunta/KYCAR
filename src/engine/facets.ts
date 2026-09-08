/**
 * KYCAR — Facettes en un seul balayage (lot D4, EX-DATA-110bis)
 * =================================================================================================
 * `FacetCount(filterId, code)` = effectif du prédicat de la sélection PRIVÉ de la totalité des
 * prédicats du filtre `filterId`, augmenté du seul prédicat `filterId = code` (EX-SCR-90). Tous les
 * compteurs de facette de tous les filtres de classe `R` sont accumulés SIMULTANÉMENT pendant le
 * balayage de sélection, par la technique du « masque de prédicats moins un » : il est INTERDIT de
 * relancer un balayage par filtre ou par valeur.
 *
 * Principe du masque : pour chaque ligne, on compte le nombre de GROUPES de prédicats qu'elle échoue.
 *   - échoue 0 groupe  → elle compte dans `facet(f, sa valeur)` pour TOUT filtre `f` (retirer `f` la
 *     laisse dans la sélection) ;
 *   - échoue exactement le groupe `f₀` → elle ne compte que dans `facet(f₀, sa valeur)` ;
 *   - échoue ≥ 2 groupes → elle ne compte nulle part.
 * Un filtre de facette NON présent dans la sélection ne peut jamais être « le groupe échoué » : seules
 * les lignes qui échouent 0 groupe l'alimentent (comptage par valeur sur la sélection courante).
 *
 * La valeur INCONNUE (255) n'est pas une option de vocabulaire : elle n'émet aucune facette
 * (elle relèverait de `unknownKeyCount`, hors périmètre du compteur de facette).
 *
 * Module PUR : importable par le worker comme par le thread principal.
 */

import type { ListingColumnBatch } from '../types/index';
import type { CompiledPredicate, EnumColumnName } from './predicates';
import { enumColumn } from './predicates';
import type { DatasetIndexes } from './index-build';
import { candidateRows } from './scan';
import type { TaxonomyScope } from './predicates';

/** Effectif d'une option de filtre (EX-DATA-110bis). `FacetCount` est calculée, jamais persistée. */
export interface FacetCount {
  readonly snapshotId: string;
  readonly selectionHash: string;
  readonly filterId: string;
  readonly code: number;
  readonly count: number;
}

/** Un filtre à facetter : identifiant KYCAR et colonne énumérée sous-jacente. */
export interface FacetFilterSpec {
  readonly filterId: string;
  readonly column: EnumColumnName;
}

/**
 * Calcule les facettes de tous les filtres demandés en UN balayage (EX-DATA-110bis).
 * @param allPredicates tous les prédicats `R` de la sélection courante (enum ET plage) — le masque.
 * @param facetFilters les filtres énumérés dont on veut les compteurs par valeur.
 */
export function computeFacets(
  batch: ListingColumnBatch,
  indexes: DatasetIndexes,
  scope: TaxonomyScope | undefined,
  allPredicates: readonly CompiledPredicate[],
  facetFilters: readonly FacetFilterSpec[],
  snapshotId: string,
  selectionHash: string,
): FacetCount[] {
  const { rows: source } = candidateRows(indexes, scope);
  const sourceLength = source ? source.length : indexes.rowCount;

  // Colonnes des facettes et accumulateurs par (facette → code → compteur).
  const facetCols = facetFilters.map((f) => enumColumn(batch, f.column));
  const counters: Map<number, number>[] = facetFilters.map(() => new Map<number, number>());

  for (let idx = 0; idx < sourceLength; idx++) {
    const row = source ? (source[idx] as number) : idx;

    // Nombre de groupes échoués et identifiant de l'unique groupe échoué (si un seul).
    let failCount = 0;
    let failedFilterId = '';
    for (let p = 0; p < allPredicates.length; p++) {
      const pred = allPredicates[p] as CompiledPredicate;
      if (!pred.test(row)) {
        failCount++;
        if (failCount === 1) failedFilterId = pred.filterId;
        else if (failCount >= 2) break;
      }
    }
    if (failCount >= 2) continue;

    for (let g = 0; g < facetFilters.length; g++) {
      const spec = facetFilters[g] as FacetFilterSpec;
      // La ligne alimente facet(g) si, en retirant g, elle ne échoue plus aucun groupe.
      const failsExcludingG = failCount === 0 ? 0 : failedFilterId === spec.filterId ? 0 : 1;
      if (failsExcludingG !== 0) continue;
      const value = (facetCols[g] as Uint8Array)[row] as number;
      if (value === 255) continue; // inconnu : pas une option
      const map = counters[g] as Map<number, number>;
      map.set(value, (map.get(value) ?? 0) + 1);
    }
  }

  const out: FacetCount[] = [];
  for (let g = 0; g < facetFilters.length; g++) {
    const spec = facetFilters[g] as FacetFilterSpec;
    const map = counters[g] as Map<number, number>;
    const codes = [...map.keys()].sort((a, b) => a - b);
    for (const code of codes) {
      out.push({ snapshotId, selectionHash, filterId: spec.filterId, code, count: map.get(code) as number });
    }
  }
  return out;
}
