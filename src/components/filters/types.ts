/**
 * KYCAR — Types partagés des composants du bandeau (lot D5, finition)
 * =================================================================================================
 * Contrat commun à tous les contrôles de `src/components/filters/controls/`, dirigé par les
 * données du registre (`FilterDef`) plutôt que par un composant dédié par filtre — cohérent avec la
 * règle générative d'`EX-SCR-72bis` : un même composant rend indifféremment n'importe quel filtre
 * partageant son `ControlKind`.
 */

import type { InteractionGesture } from '../../state/debounce-policy';
import type { FilterDef, FilterValue } from '../../state/filter-types';

/** Émis par un contrôle à chaque changement ; `gesture` détermine le débounce appliqué en amont
 * par `InteractionController` (table `EX-SRCH-1`…`8`, `debounce-policy.ts`). */
export interface FilterChangeEvent {
  readonly filterId: string;
  /** `undefined` = filtre retiré (valeur vidée). */
  readonly value: FilterValue | undefined;
  readonly gesture: InteractionGesture;
}

export type OnFilterChange = (event: FilterChangeEvent) => void;

/** Effectif d'option leave-one-out (`EX-SCR-90`), fourni par l'écran appelant — absent pour un
 * filtre de classe T (aucune parenthèse n'est alors affichée, jamais une parenthèse vide). */
export type FacetCounts = ReadonlyMap<string, number>;

export interface FilterControlProps {
  readonly def: FilterDef;
  readonly value: FilterValue | undefined;
  readonly disabled: boolean;
  readonly disabledReason?: string;
  readonly facetCounts?: FacetCounts;
  readonly onChange: OnFilterChange;
}

/** Props communes à un couple d'intervalle (range-pair) ou à une borne isolée (range-single). */
export interface RangeControlProps {
  readonly fromDef: FilterDef;
  readonly toDef?: FilterDef;
  readonly fromValue: number | undefined;
  readonly toValue: number | undefined;
  readonly disabled: boolean;
  readonly disabledReason?: string;
  readonly onChange: OnFilterChange;
}
