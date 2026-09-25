/**
 * KYCAR — Contrôles primaires du bandeau (`EX-SCR-59`, `[amendée 3.6 — D3-46]`)
 * =================================================================================================
 * Rend une liste de contrôles primaires (`PrimaryControlGroup`, `band-model.ts`). Depuis `D3-46`, la
 * même ligne sert à deux endroits :
 *   - la BARRE CONDENSÉE (collante), qui ne porte que les trois contrôles toujours visibles
 *     (`buildAlwaysVisibleControls` : Marque et modèle, Prix, Kilométrage), rendus « condensés »
 *     (intervalle sans paliers, texte indicatif court) et marqués `data-band-filter` ;
 *   - la carte « Essentiels » du panneau « Tous les filtres », qui porte les autres primaires (tous
 *     en régime compact, où la barre n'en montre aucun).
 * Par défaut (sans `controls`), les neuf contrôles de `buildPrimaryControls`.
 */
import { buildPrimaryControls, isControlDisabled, type PrimaryControlGroup } from './band-model';
import { FilterFieldRow } from './FilterFieldRow';
import type { ScreenMode, SelectionState } from '../../state/filter-types';
import type { FacetCounts, OnFilterChange } from './types';

/** `D3-46` (a) — libellés courts des intervalles de la barre condensée (« Prix min », « Km max »). */
const SHORT_LABELS: Readonly<Record<string, string>> = { priceFrom: 'Prix', mileageFrom: 'Km' };

export interface PrimaryLineProps {
  readonly mode: ScreenMode;
  readonly selection: SelectionState;
  /** Contrôles à rendre, dans l'ordre ; défaut : les neuf primaires (`buildPrimaryControls`). */
  readonly controls?: readonly PrimaryControlGroup[];
  /** Nom accessible du groupe (`role="group"`). */
  readonly label?: string;
  /** `D3-46` (a) — rendu de la barre condensée : intervalles sans paliers, texte indicatif court,
   * chaque contrôle marqué `data-band-filter="<clé>"`. */
  readonly condensed?: boolean;
  /** `D8-05` : facettes du dernier recalcul, PAR FILTRE (`filterId → FacetCounts`) — absent pour
   * un filtre qui n'en a pas reçu (aucune parenthèse rendue, jamais une parenthèse vide). */
  readonly facetCounts?: ReadonlyMap<string, FacetCounts>;
  readonly facetCountsPending?: boolean;
  /** `EX-SCR-98` (`D8-15`) : routé vers chaque `RangeControl` (`priceFrom`/`mileageFrom`…). */
  readonly compact?: boolean;
  readonly onChange: OnFilterChange;
  readonly onOpenScreenG: () => void;
  readonly screenGSummary: string;
}

export function PrimaryLine({
  mode,
  selection,
  controls,
  label = 'Filtres principaux',
  condensed,
  facetCounts,
  facetCountsPending,
  compact,
  onChange,
  onOpenScreenG,
  screenGSummary,
}: PrimaryLineProps) {
  return (
    <div class="kycar-primary-line" role="group" aria-label={label}>
      {(controls ?? buildPrimaryControls()).map((group) => {
        const def = group.defs[0];
        if (def === undefined) return null;
        const disabled = isControlDisabled(def, selection, mode);
        const row = (
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
            condensed={condensed}
            shortLabel={condensed === true ? SHORT_LABELS[group.key] : undefined}
            onChange={onChange}
            onOpenScreenG={def.control === 'structured-picker' ? onOpenScreenG : undefined}
            screenGSummary={def.control === 'structured-picker' ? screenGSummary : undefined}
          />
        );
        return condensed === true ? (
          <div key={group.key} class="kycar-band-slot" data-band-filter={group.key}>
            {row}
          </div>
        ) : (
          row
        );
      })}
    </div>
  );
}
