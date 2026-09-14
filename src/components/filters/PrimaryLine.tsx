/**
 * KYCAR — Ligne primaire du bandeau (`EX-SCR-55` zone 1, `EX-SCR-59`)
 * =================================================================================================
 * Les neuf contrôles primaires (12 paramètres) plus `kwd`, toujours visible, jamais dans
 * l'accordéon replié (`EX-SCR-56`).
 */
import { buildPrimaryControls, isControlDisabled } from './band-model';
import { FilterFieldRow } from './FilterFieldRow';
import type { ScreenMode, SelectionState } from '../../state/filter-types';
import type { FacetCounts, OnFilterChange } from './types';

export interface PrimaryLineProps {
  readonly mode: ScreenMode;
  readonly selection: SelectionState;
  /** `D8-05` : facettes du dernier recalcul, PAR FILTRE (`filterId → FacetCounts`) — absent pour
   * un filtre qui n'en a pas reçu (aucune parenthèse rendue, jamais une parenthèse vide). */
  readonly facetCounts?: ReadonlyMap<string, FacetCounts>;
  readonly facetCountsPending?: boolean;
  /** `EX-SCR-98` (`D8-15`) : routé vers chaque `RangeControl` de la ligne primaire (`priceFrom`/
   * `mileageFrom`…). */
  readonly compact?: boolean;
  readonly onChange: OnFilterChange;
  readonly onOpenScreenG: () => void;
  readonly screenGSummary: string;
}

export function PrimaryLine({
  mode,
  selection,
  facetCounts,
  facetCountsPending,
  compact,
  onChange,
  onOpenScreenG,
  screenGSummary,
}: PrimaryLineProps) {
  return (
    <div class="kycar-primary-line" role="group" aria-label="Filtres principaux">
      {buildPrimaryControls().map((group) => {
        const def = group.defs[0];
        if (def === undefined) return null;
        const disabled = isControlDisabled(def, selection, mode);
        return (
          <FilterFieldRow
            key={group.key}
            def={def}
            mode={mode}
            selection={selection}
            disabled={disabled}
            disabledReason={def.disabledReason}
            facetCounts={facetCounts?.get(def.id)}
            facetCountsPending={facetCountsPending}
            compact={compact}
            onChange={onChange}
            onOpenScreenG={def.control === 'structured-picker' ? onOpenScreenG : undefined}
            screenGSummary={def.control === 'structured-picker' ? screenGSummary : undefined}
          />
        );
      })}
    </div>
  );
}
