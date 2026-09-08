/**
 * KYCAR — Ligne primaire du bandeau (`EX-SCR-55` zone 1, `EX-SCR-59`)
 * =================================================================================================
 * Les neuf contrôles primaires (12 paramètres) plus `kwd`, toujours visible, jamais dans
 * l'accordéon replié (`EX-SCR-56`).
 */
import { buildPrimaryControls, isControlDisabled } from './band-model';
import { FilterFieldRow } from './FilterFieldRow';
import type { ScreenMode, SelectionState } from '../../state/filter-types';
import type { OnFilterChange } from './types';

export interface PrimaryLineProps {
  readonly mode: ScreenMode;
  readonly selection: SelectionState;
  readonly onChange: OnFilterChange;
  readonly onOpenScreenG: () => void;
  readonly screenGSummary: string;
}

export function PrimaryLine({ mode, selection, onChange, onOpenScreenG, screenGSummary }: PrimaryLineProps) {
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
            onChange={onChange}
            onOpenScreenG={def.control === 'structured-picker' ? onOpenScreenG : undefined}
            screenGSummary={def.control === 'structured-picker' ? screenGSummary : undefined}
          />
        );
      })}
    </div>
  );
}
