/**
 * KYCAR — Types partagés du bandeau de filtres (lot D5)
 * =================================================================================================
 * Ce module ne contient AUCUNE donnée : uniquement les types portés par `filter-registry.ts` et
 * consommés par le codec d'URL, la scission T/R, l'historique et les composants du bandeau.
 *
 * Réutilise le type `FilterValue`/`SelectionInput` du codec D2 (`src/types/selection.ts`) comme
 * fondation de l'état de filtres : D5 ne réinvente pas cette forme, il la spécialise.
 */

import type { FilterValue, SelectionInput } from '../types/selection';

export type { FilterValue };

/**
 * Classe d'exécution d'un filtre (`EX-SCR-57`) :
 *  - `R` — recalculable en mémoire sur le jeu de données local ;
 *  - `T` — exige un rechargement `DataProvider` (nouvelle `localDatasetKey`) ;
 *  - `D` — présent, désactivé, jamais sérialisé dans l'URL ;
 *  - `DYNAMIC_BODY` — cas unique de `body` (Carrosserie) : `T` en mode 2 (annonce), `R` en mode 1
 *    (modèle, via `Model.bodyTypes`) — `EX-SCR-82` ligne 44, `EX-SCR-221`.
 */
export type FilterClass = 'T' | 'R' | 'D' | 'DYNAMIC_BODY';

/** Mode d'écran, nécessaire pour résoudre la classe dynamique de `body`. */
export type ScreenMode = 'mode1' | 'mode2';

/** Type de valeur du catalogue (`data/reference/filters-scope.json`, champ `type`). */
export type ScopeType =
  | 'enum_single'
  | 'enum_multi'
  | 'range_min'
  | 'range_max'
  | 'number'
  | 'boolean'
  | 'text'
  | 'geo_text'
  | 'structured_multi';

/** Type de contrôle rendu (table générative `EX-SCR-72bis`). */
export type ControlKind =
  | 'radio-segmented' // enum_single, domaine <= 4 (EX-SCR-63)
  | 'select-indifferent' // enum_single, domaine 5-12 (EX-SCR-64)
  | 'panel-search-single' // enum_single, domaine > 12 (EX-SCR-66, réserve générative — inutilisé en pratique)
  | 'checkbox-list' // enum_multi, domaine <= 14 (EX-SCR-65)
  | 'panel-search-multi' // enum_multi, domaine > 14 (EX-SCR-66 — uniquement `eq`)
  | 'range-pair' // range_min + range_max de même préfixe (EX-SCR-67)
  | 'range-single' // range_min isolé, sans jumeau (EX-SCR-67 amendé ARB-53)
  | 'number-field' // number (EX-SCR-67)
  | 'boolean-toggle' // boolean (EX-SCR-69)
  | 'geo-composite' // geo_text (EX-SCR-70)
  | 'text-field' // text (EX-SCR-71)
  | 'structured-picker' // structured_multi -> écran G (EX-SCR-72)
  | 'none'; // non exposé (atype) ou exclu

/** Une option d'un domaine énuméré, libellé FR déjà résolu (EX-NFR-29 — jamais de code brut). */
export interface EnumOption {
  readonly code: string;
  readonly label: string;
}

/** Domaine numérique d'un filtre à intervalle ou nombre. Bornes absentes = non bornable. */
export interface NumericDomain {
  readonly min?: number;
  readonly max?: number;
  /** Paliers suggérés (EX-SCR-67) — jamais une contrainte, la saisie libre reste acceptée. */
  readonly steps?: readonly number[];
  /** `true` si la source déclare explicitement `free_input`. */
  readonly freeInput?: boolean;
}

/** Sémantique non prouvée à signaler par une icône `(?)` (EX-SCR-85). */
export type SemanticsWarning =
  | 'EQ_AND_PRESUMED' // eq : ET présumé (Z1)
  | 'AT_LEAST_PRESUMED' // emclass, ensticker : "au moins" présumé (Z2)
  | 'AT_MOST_PRESUMED'; // prevownersid : "au plus" présumé (Z2)

/** Définition normative d'un filtre du bandeau (table `EX-SCR-82`). */
export interface FilterDef {
  /** Identifiant KYCAR, clé de `SelectionInput` (D2) — reprend `filters-scope.json#id`. */
  readonly id: string;
  /** Nom du paramètre d'URL, relevé sur AutoScout24 sans renommage (`EX-NAV-5`). */
  readonly param: string;
  /** Libellé FR (`EX-NFR-28`/`30`). */
  readonly label: string;
  /** Groupe visuel (`EX-SCR-93` pour l'ordre normatif). */
  readonly group: string;
  readonly scopeType: ScopeType;
  readonly control: ControlKind;
  readonly cls: FilterClass;
  /** `true` si l'un des neuf contrôles primaires (`EX-SCR-59`). */
  readonly primary: boolean;
  /** Identifiants (espace `id`, pas `param`) des filtres parents dont dépend l'activation. */
  readonly dependencies: readonly string[];
  /** Pour un membre d'une paire d'intervalle, l'id de l'autre borne. */
  readonly pairedWith?: string;
  /** Domaine énuméré, déjà résolu en libellés FR (jamais de code brut, EX-NFR-30). Absent si non énuméré. */
  readonly options?: readonly EnumOption[];
  readonly numericDomain?: NumericDomain;
  /** Unité canonique d'affichage (EX-SRCH-11bis), pour les filtres numériques. */
  readonly unit?: string;
  /** Code émis quand un booléen est actif (presque toujours `"1"`). Absent hors type `boolean`. */
  readonly booleanTrueCode?: string;
  /** Motif d'infobulle pour un filtre de classe `D` (`EX-SCR-74`). */
  readonly disabledReason?: string;
  readonly semanticsWarning?: SemanticsWarning;
  /** `true` si l'exposition est `NON_EXPOSE` malgré `perimetre = RETENU` (seul cas : `atype`). */
  readonly nonExposed?: boolean;
}

/** État de filtres : identique à `SelectionInput` de D2 (clés = `FilterDef.id`). */
export type SelectionState = SelectionInput;
export type MutableSelectionState = Record<string, FilterValue>;
