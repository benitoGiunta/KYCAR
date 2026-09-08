/**
 * KYCAR — Panneau des groupes secondaires (`EX-SCR-55` zone 3, `EX-SCR-92`/`93`/`99`)
 * =================================================================================================
 * Chaque groupe est un `<fieldset>` avec `<legend>` (`EX-SCR-99`), replié par défaut sauf s'il
 * contient un filtre actif (`EX-SCR-92`) ; `Tab` ne pénètre jamais un groupe replié — assuré ici
 * simplement en ne rendant PAS le contenu du groupe replié dans le DOM (l'absence du DOM est la
 * garantie la plus forte contre une fuite de tabulation, plus robuste qu'un `tabIndex` conditionnel).
 *
 * DETTE SIGNALÉE : les deux réglages d'assainissement KYCAR (`EX-SCR-95`, prix sur demande / seuil
 * sentinelle) ne sont pas rendus ici — ce ne sont pas des filtres du registre D5 mais des réglages
 * d'agrégation propres au moteur (D4), hors périmètre de ce lot ; D8 les intègre au groupe `Prix et
 * valeur` au moment de l'assemblage final.
 */
import { buildSecondaryGroups, isControlDisabled } from './band-model';
import { FilterFieldRow, isConsumedElsewhere } from './FilterFieldRow';
import type { ScreenMode, SelectionState } from '../../state/filter-types';
import type { OnFilterChange } from './types';

export interface SecondaryGroupsProps {
  readonly mode: ScreenMode;
  readonly selection: SelectionState;
  readonly expandedGroups: ReadonlySet<string>;
  readonly onToggleGroup: (group: string) => void;
  readonly onChange: OnFilterChange;
  /** Réinitialisation PAR GROUPE (`EX-SRCH-19`, `DR-061`) — vide `resetFilterIds`, routé par
   * l'appelant via `forcePush` (`EX-NAV-14`). */
  readonly onResetGroup: (filterIds: readonly string[]) => void;
}

export function SecondaryGroups({
  mode,
  selection,
  expandedGroups,
  onToggleGroup,
  onChange,
  onResetGroup,
}: SecondaryGroupsProps) {
  const groups = buildSecondaryGroups(selection);

  return (
    <div class="kycar-secondary-groups">
      {groups.map((group) => {
        const expanded = expandedGroups.has(group.key);
        return (
          <fieldset key={group.key} class="kycar-secondary-group">
            <legend>
              <button
                type="button"
                class="kycar-secondary-group__toggle"
                aria-expanded={expanded}
                onClick={() => onToggleGroup(group.key)}
              >
                {group.label}
                {group.activeCount > 0 ? ` (${group.activeCount} actifs)` : ''}
              </button>
              {group.activeCount > 0 ? (
                <button
                  type="button"
                  class="kycar-secondary-group__reset"
                  aria-label={`Réinitialiser le groupe ${group.label}`}
                  onClick={() => onResetGroup(group.resetFilterIds)}
                >
                  Réinitialiser
                </button>
              ) : null}
            </legend>
            {expanded ? (
              <div class="kycar-secondary-group__body">
                {group.defs
                  .filter((d) => !isConsumedElsewhere(d) && d.control !== 'none')
                  .map((def) => (
                    <FilterFieldRow
                      key={def.id}
                      def={def}
                      mode={mode}
                      selection={selection}
                      disabled={isControlDisabled(def, selection, mode)}
                      disabledReason={def.disabledReason}
                      onChange={onChange}
                    />
                  ))}
              </div>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
