/**
 * KYCAR — Recherche de filtre (`EX-SCR-79`/`80`) — logique pure, testable sans DOM.
 * =================================================================================================
 * Indexe simultanément le libellé français, le nom du paramètre d'URL, et l'identifiant KYCAR
 * (utile à un test automatisé qui n'a pas le libellé sous la main). DETTE SIGNALÉE : la suggestion
 * par distance de Levenshtein ≤ 3 sur zéro résultat (`EX-SCR-80`) n'est pas implémentée — seul le
 * texte `Aucun filtre ne correspond` est produit ; un budget de lot dédié devrait ajouter la
 * distance d'édition si ce raffinement est jugé prioritaire par D8.
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

/** `EX-SCR-79` : filtre sur trois index simultanés (libellé FR, nom de paramètre, id KYCAR). */
export function searchFilters(query: string): FilterSearchResult {
  const q = norm(query.trim());
  if (q.length === 0) return { matches: [], groupsToExpand: new Set() };
  const matches = EXPOSED_FILTER_DEFS.filter(
    (d) => norm(d.label).includes(q) || d.param.toLowerCase().includes(q) || d.id.toLowerCase().includes(q),
  );
  return { matches, groupsToExpand: new Set(matches.map((d) => d.group)) };
}
