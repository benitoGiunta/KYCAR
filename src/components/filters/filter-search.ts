/**
 * KYCAR — Recherche de filtre (`EX-SCR-79`/`80`) — logique pure, testable sans DOM.
 * =================================================================================================
 * `EX-SCR-79` : trois index simultanés — le libellé français, le libellé anglais relevé
 * (`labelEn`, `filters.json#label_en`, `DR-057`) et le nom du paramètre d'URL. L'identifiant KYCAR
 * reste indexé en plus (utile à un test automatisé qui n'a pas le libellé sous la main), sans
 * compter parmi les trois index normatifs. `EX-SCR-80` : sur zéro correspondance, les 3 filtres les
 * plus proches par distance de Levenshtein ≤ 3 (`DR-134`) — DETTE SIGNALÉE, non implémentée : seul
 * le texte `Aucun filtre ne correspond` est produit ; mise en dette explicite (aucune valeur
 * affichée fausse, confort de recherche uniquement).
 */
import { EXPOSED_FILTER_DEFS } from '../../state/filter-registry';
import type { FilterDef } from '../../state/filter-types';

export interface FilterSearchResult {
  readonly matches: readonly FilterDef[];
  /** Clés de groupe à déplier automatiquement parce qu'elles contiennent une correspondance. */
  readonly groupsToExpand: ReadonlySet<string>;
}

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** `EX-SCR-79` : filtre sur trois index simultanés (libellé FR, libellé EN relevé, paramètre
 * d'URL), plus l'identifiant KYCAR. */
export function searchFilters(query: string): FilterSearchResult {
  const q = norm(query.trim());
  if (q.length === 0) return { matches: [], groupsToExpand: new Set() };
  const matches = EXPOSED_FILTER_DEFS.filter(
    (d) =>
      norm(d.label).includes(q) ||
      (d.labelEn !== undefined && norm(d.labelEn).includes(q)) ||
      d.param.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q),
  );
  return { matches, groupsToExpand: new Set(matches.map((d) => d.group)) };
}
