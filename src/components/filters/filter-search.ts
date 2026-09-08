/**
 * KYCAR — Recherche de filtre (`EX-SCR-79`/`80`) — logique pure, testable sans DOM.
 * =================================================================================================
 * `EX-SCR-79` : trois index simultanés — le libellé français, le libellé anglais relevé
 * (`labelEn`, `filters.json#label_en`, `DR-057`) et le nom du paramètre d'URL. L'identifiant KYCAR
 * reste indexé en plus (utile à un test automatisé qui n'a pas le libellé sous la main), sans
 * compter parmi les trois index normatifs.
 *
 * `EX-SCR-80` (`DR-134`, dette LEVÉE par `D8-12` — distance d'édition ≤ 2, décision du fix-lead
 * 2.8 qui resserre le seuil ≤ 3 du texte normatif d'origine) : sur zéro correspondance EXACTE, les
 * 3 filtres les plus proches sont proposés — la distance est calculée MOT PAR MOT sur le libellé
 * (FR, EN) et sur le paramètre, jamais sur le libellé complet avec ses espaces/suffixes
 * (« Kilométrage de » ne serait jamais à distance ≤ 2 de « kilomtrage » sinon). `isFuzzy` distingue
 * ce repli d'une correspondance exacte pour l'appelant (message « suggestions », `FilterSearch.tsx`).
 */
import { EXPOSED_FILTER_DEFS } from '../../state/filter-registry';
import type { FilterDef } from '../../state/filter-types';

export interface FilterSearchResult {
  readonly matches: readonly FilterDef[];
  /** Clés de groupe à déplier automatiquement parce qu'elles contiennent une correspondance. */
  readonly groupsToExpand: ReadonlySet<string>;
  /** `true` quand `matches` provient du repli par distance d'édition (`EX-SCR-80`), pas d'une
   * correspondance exacte — l'appelant affiche alors « suggestions », pas « <n> filtres
   * correspondent ». Toujours `false` quand `matches` est vide. */
  readonly isFuzzy: boolean;
}

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Seuil normatif du repli par distance d'édition (`EX-SCR-80`, resserré à 2 par `D8-12`). */
export const FUZZY_MAX_DISTANCE = 2;
/** Nombre de suggestions rendues sur zéro correspondance (`EX-SCR-80` : « les 3 … »). */
export const FUZZY_SUGGESTION_COUNT = 3;

/** Distance de Levenshtein classique (insertion/suppression/substitution, coût 1), sans
 * dépendance externe — les chaînes comparées ici sont courtes (mots de libellé, paramètres). */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1, // suppression
        (curr[j - 1] ?? 0) + 1, // insertion
        (prev[j - 1] ?? 0) + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n] ?? 0;
}

/** Plus petite distance entre `query` et l'un des mots (séparés par un non-alphanumérique) de
 * `text` — pour qu'un libellé à plusieurs mots (« Kilométrage de ») reste proposable par un seul
 * mot fautif, sans faire porter la ponctuation/les espaces dans le calcul. */
function bestWordDistance(query: string, text: string): number {
  const words = norm(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 0);
  let best = Infinity;
  for (const w of words) {
    const d = levenshteinDistance(query, w);
    if (d < best) best = d;
  }
  return best;
}

/** Les `FUZZY_SUGGESTION_COUNT` filtres les plus proches de `query` par distance d'édition
 * (`EX-SCR-80`), sur le libellé FR, le libellé EN relevé et le paramètre d'URL — les trois mêmes
 * index qu'`EX-SCR-79`. `[]` si aucun filtre n'est à distance ≤ `FUZZY_MAX_DISTANCE`. */
function suggestClosestFilters(query: string): readonly FilterDef[] {
  const scored: Array<{ def: FilterDef; distance: number }> = [];
  for (const def of EXPOSED_FILTER_DEFS) {
    const candidates = [bestWordDistance(query, def.label), levenshteinDistance(query, def.param.toLowerCase())];
    if (def.labelEn !== undefined) candidates.push(bestWordDistance(query, def.labelEn));
    const distance = Math.min(...candidates);
    if (distance <= FUZZY_MAX_DISTANCE) scored.push({ def, distance });
  }
  scored.sort((a, b) => a.distance - b.distance || a.def.label.localeCompare(b.def.label, 'fr'));
  return scored.slice(0, FUZZY_SUGGESTION_COUNT).map((s) => s.def);
}

/** `EX-SCR-79` : filtre sur trois index simultanés (libellé FR, libellé EN relevé, paramètre
 * d'URL), plus l'identifiant KYCAR. Zéro correspondance exacte → repli `EX-SCR-80` (`isFuzzy`). */
export function searchFilters(query: string): FilterSearchResult {
  const q = norm(query.trim());
  if (q.length === 0) return { matches: [], groupsToExpand: new Set(), isFuzzy: false };
  const matches = EXPOSED_FILTER_DEFS.filter(
    (d) =>
      norm(d.label).includes(q) ||
      (d.labelEn !== undefined && norm(d.labelEn).includes(q)) ||
      d.param.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q),
  );
  if (matches.length > 0) {
    return { matches, groupsToExpand: new Set(matches.map((d) => d.group)), isFuzzy: false };
  }
  const suggestions = suggestClosestFilters(q);
  return { matches: suggestions, groupsToExpand: new Set(suggestions.map((d) => d.group)), isFuzzy: suggestions.length > 0 };
}
