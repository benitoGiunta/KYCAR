/**
 * KYCAR — Modèle de vue pur du bandeau (lot D5, finition)
 * =================================================================================================
 * Fonctions PURES qui transforment `filter-registry.ts` + l'état de sélection + l'état d'ouverture
 * des groupes en la structure que `FilterBand.tsx` rend, et que `keyboard-nav.ts` parcourt pour
 * calculer l'ordre de tabulation attendu. Aucune de ces fonctions ne touche le DOM : c'est ce qui
 * les rend testables sans navigateur (`band-model.test.ts`), conformément au repli du critère de
 * succès D5 #4 (« sinon tests unitaires du tab-order et de l'activation »).
 */

import {
  EXPOSED_FILTER_DEFS,
  FILTER_BY_ID,
  GROUP_LABELS,
  GROUP_ORDER,
  PRIMARY_FILTER_DEFS,
  PRIMARY_ORDER,
  isDependencySatisfied,
  resolveFilterClass,
} from '../../state/filter-registry';
import type { FilterDef, ScreenMode, SelectionState } from '../../state/filter-types';
import { formatOfferCount } from '../../screens/market/format';

/** Groupes normatifs de l'accordéon (`EX-SCR-93`) : `tri` et `liste_annonces` en sont exclus — le
 * premier est un contrôle de tri dédié des écrans A/D, le second n'existe que sur l'écran D. */
export const ACCORDION_GROUP_ORDER: readonly string[] = GROUP_ORDER.filter(
  (g) => g !== 'tri' && g !== 'liste_annonces',
);

export interface PrimaryControlGroup {
  /** Identifiant stable = id du premier filtre du groupe (ex. `priceFrom` pour le couple prix). */
  readonly key: string;
  readonly defs: readonly FilterDef[];
}

/**
 * Regroupe les paramètres primaires (`EX-SCR-59`/`71`) en contrôles visuels : un couple `from`/`to`
 * compte pour un seul contrôle (ex. Prix = `pricefrom` + `priceto`), les autres pour un seul
 * filtre. L'ordre suit `PRIMARY_ORDER` (`DR-138`), pas l'ordre de déclaration du registre : `kwd`
 * appartient à la zone (2) — dernier de la ligne, jamais premier — et Carrosserie précède Boîte de
 * vitesses. `countryType` (`cy`) n'apparaît plus ici (`D-15`/`DR-052`, `EX-SRCH-18bis`).
 */
export function buildPrimaryControls(): readonly PrimaryControlGroup[] {
  const groups: PrimaryControlGroup[] = [];
  const consumed = new Set<string>();
  for (const id of PRIMARY_ORDER) {
    if (consumed.has(id)) continue;
    const def = PRIMARY_FILTER_DEFS.find((d) => d.id === id);
    if (def === undefined) continue;
    if (def.scopeType === 'range_min' && def.pairedWith !== undefined) {
      const pair = PRIMARY_FILTER_DEFS.find((d) => d.id === def.pairedWith);
      if (pair !== undefined) {
        consumed.add(def.id);
        consumed.add(pair.id);
        groups.push({ key: def.id, defs: [def, pair] });
        continue;
      }
    }
    consumed.add(def.id);
    groups.push({ key: def.id, defs: [def] });
  }
  return groups;
}

export interface FilterGroupViewModel {
  readonly key: string;
  readonly label: string;
  readonly defs: readonly FilterDef[];
  /** Nombre de filtres du groupe posés à une valeur autre que leur défaut (`EX-SCR-91`/`92`). */
  readonly activeCount: number;
  /** Identifiants à vider pour le bouton de réinitialisation DU GROUPE (`EX-SRCH-19`, `DR-061`) —
   * tous les filtres du groupe hors classe `D` (jamais actionnables, rien à réinitialiser). */
  readonly resetFilterIds: readonly string[];
}

/** Vrai si `value` compte comme « posé » (non vide) au sens d'`EX-SCR-91`. */
function isPosedValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.length > 0;
  return true;
}

function sameAsDefault(value: unknown, defaultValue: unknown): boolean {
  if (defaultValue === undefined) return false;
  const a = Array.isArray(value) ? value.map(String).slice().sort() : [String(value)];
  const b = Array.isArray(defaultValue) ? defaultValue.map(String).slice().sort() : [String(defaultValue)];
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Vrai si un filtre compte dans le compteur « `<k>` filtres actifs » (`EX-SCR-91`, `R-A01`). */
export function isFilterActive(def: FilterDef, selection: SelectionState): boolean {
  if (def.cls === 'D' || def.nonExposed) return false;
  const value = selection[def.id];
  if (!isPosedValue(value)) return false;
  if (def.defaultValue !== undefined && sameAsDefault(value, def.defaultValue)) return false;
  return true;
}

/** Nombre total de filtres actifs du bandeau (`EX-SCR-91`), tous groupes confondus. */
export function countActiveFilters(selection: SelectionState): number {
  let n = 0;
  for (const def of EXPOSED_FILTER_DEFS) {
    if (isFilterActive(def, selection)) n++;
  }
  return n;
}

/**
 * `EX-SCR-56` (ACC-02) — nombre de filtres actifs portés par la LIGNE PRIMAIRE (`EX-SCR-59`). Sert
 * au compteur du bouton « Plus de filtres (n) » : `n` compte ce que le bandeau REPLIÉ ne montre
 * pas, c'est-à-dire les actifs des groupes secondaires (`countActiveFilters` moins ceux-ci).
 */
export function countPrimaryActive(selection: SelectionState): number {
  let n = 0;
  for (const def of PRIMARY_FILTER_DEFS) {
    if (isFilterActive(def, selection)) n++;
  }
  return n;
}

/**
 * Construit les groupes de l'accordéon secondaire, dans l'ordre normatif d'`EX-SCR-93`, chacun
 * portant ses filtres (registre) et son compteur d'actifs (`<n> actifs`, `EX-SCR-92`).
 */
export function buildSecondaryGroups(selection: SelectionState): readonly FilterGroupViewModel[] {
  const byGroup = new Map<string, FilterDef[]>();
  for (const def of EXPOSED_FILTER_DEFS) {
    const bucket = byGroup.get(def.group);
    if (bucket === undefined) byGroup.set(def.group, [def]);
    else bucket.push(def);
  }
  const groups: FilterGroupViewModel[] = [];
  for (const key of ACCORDION_GROUP_ORDER) {
    const defs = byGroup.get(key) ?? [];
    if (defs.length === 0) continue;
    const activeCount = defs.filter((d) => isFilterActive(d, selection)).length;
    const resetFilterIds = defs.filter((d) => d.cls !== 'D').map((d) => d.id);
    groups.push({ key, label: GROUP_LABELS[key] ?? key, defs, activeCount, resetFilterIds });
  }
  return groups;
}

/** Groupes à déplier par défaut au chargement (`EX-SCR-92`) : ceux contenant au moins un actif. */
export function defaultExpandedGroups(selection: SelectionState): ReadonlySet<string> {
  const expanded = new Set<string>();
  for (const g of buildSecondaryGroups(selection)) {
    if (g.activeCount > 0) expanded.add(g.key);
  }
  return expanded;
}

/**
 * Vrai si le CONTRÔLE d'un filtre doit être rendu désactivé (`EX-SCR-88`, conditions a/b — les
 * conditions c/d — hors ligne, domaine dépendant vide — exigent un contexte réseau/référentiel que
 * ce module pur n'a pas et restent du ressort du composant appelant).
 */
export function isControlDisabled(def: FilterDef, selection: SelectionState, mode: ScreenMode): boolean {
  if (resolveFilterClass(def, mode) === 'D') return true;
  return !isDependencySatisfied(def, selection);
}

/* ================================================================================================
 * `D8-15` — régimes responsive du bandeau (`EX-SCR-96` intermédiaire, `EX-SCR-97` compact,
 * `EX-SCR-98` paliers en liste déroulante native — confirmé par le coordinateur : `EX-SCR-95` est
 * le bloc « Assainissement KYCAR », HORS PÉRIMÈTRE, dette produit ratifiée par D8-15, à ne pas
 * implémenter), raccourci clavier `/` (`EX-SCR-81`) et notification de retrait en cascade
 * (`EX-SCR-73`) — voir `reports/remediation-2.8/fix-state.md` pour le détail de cette lecture.
 * ============================================================================================== */

/** Trois régimes visuels du bandeau (`draft-screens.md` §3/4) : `large` (défaut, ≥ 1280 px),
 * `intermediaire` (768–1279 px, `EX-SCR-96`) et `compact` (< 768 px, `EX-SCR-97`). La mise en page
 * elle-même (grille, largeurs, media queries) est un point de style qui appartient à
 * `src/app/app.css` (hors périmètre `src/components/filters`) — ce module ne porte que la
 * DÉCISION de régime et le comportement fonctionnel qui en dépend (feuille plein écran et
 * application différée du régime `compact`, non de la seule CSS). */
export type BandRegime = 'large' | 'intermediaire' | 'compact';

/**
 * `EX-SCR-81` : le raccourci `/` doit ATTEINDRE le champ de recherche de filtre depuis n'importe
 * où dans l'application, SAUF si le focus est déjà dans un champ de saisie — sinon il empêcherait
 * de taper un `/` littéral dans un champ texte (ex. une plaque, une note). Fonction pure : ne
 * connaît que la forme de l'élément actuellement focalisé, pas le DOM lui-même (`FilterBand.tsx`
 * l'appelle depuis un `useEffect`, non sondable ici faute d'environnement DOM, `vitest.review.
 * config.ts#environment: 'node'`).
 */
export function isTypingTarget(tagName: string | null | undefined, isContentEditable: boolean): boolean {
  if (isContentEditable) return true;
  const tag = tagName?.toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * `EX-SCR-73` : « Lorsqu'un parent est retiré, ses enfants sont retirés avec une notification
 * explicite : `3 filtres de leasing retirés` pendant 5 s, avec un bouton `Annuler`. » Le message
 * nomme le GROUPE des filtres retirés par la cascade quand ils appartiennent tous au même groupe
 * (le cas normatif : les 9 filtres de leasing dépendent tous de `hasLeasing`) ; repli générique
 * sinon (une chaîne de dépendances peut, en théorie, traverser plusieurs groupes). `null` si rien
 * n'a été retiré PAR LA CASCADE (le retrait direct de l'utilisateur ne se notifie pas lui-même).
 */
export function cascadeRemovalMessage(removedFilterIds: readonly string[]): string | null {
  if (removedFilterIds.length === 0) return null;
  const n = removedFilterIds.length;
  const plural = n > 1 ? 's' : '';
  const groups = new Set(
    removedFilterIds.map((id) => FILTER_BY_ID.get(id)?.group).filter((g): g is string => g !== undefined),
  );
  if (groups.size === 1) {
    const groupLabel = (GROUP_LABELS[[...groups][0]!] ?? '').toLowerCase();
    if (groupLabel.length > 0) return `${n} filtre${plural} de ${groupLabel} retiré${plural}`;
  }
  return `${n} filtre${plural} retiré${plural}`;
}

/**
 * `EX-SCR-97` : « le bouton [de validation] affiche l'effectif projeté. » `projectedCount`
 * provient de l'appelant (le contrôleur, seul à pouvoir évaluer un effectif sous une sélection
 * candidate non encore appliquée) ; `undefined` tant qu'il n'a pas encore répondu ⇒ un libellé
 * neutre plutôt qu'un effectif inventé ou périmé.
 */
export function deferredApplyLabel(projectedCount: number | undefined): string {
  if (projectedCount === undefined) return 'Voir les résultats';
  if (projectedCount === 0) return 'Voir les résultats (0 offre)';
  return `Voir les ${formatOfferCount(projectedCount)}`;
}
