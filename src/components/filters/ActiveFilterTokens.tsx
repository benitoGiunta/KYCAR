/**
 * KYCAR — Ligne des filtres actifs (`EX-SCR-55` zone 4, `EX-SCR-75`/`76`/`77`)
 * =================================================================================================
 * Visible dès qu'au moins un filtre est posé ; région `aria-live="polite"` (`EX-SCR-99`) annonçant
 * le nombre de filtres actifs à chaque changement, sans lire le contenu entier à chaque frappe.
 */
import { buildActiveFilterTokens } from './labels';
import type { SelectionState } from '../../state/filter-types';

export interface ActiveFilterTokensProps {
  readonly selection: SelectionState;
  readonly resultCount?: number;
  readonly onRemove: (filterIds: readonly string[]) => void;
  readonly onClearAll: () => void;
  /** Retrait UNITAIRE d'une valeur, depuis l'infobulle d'un jeton à cardinal (`EX-SCR-76` « en
   * substance », `D-10`, `DR-062`). Absent des jetons à 1 ou 2 valeurs (`removalTargets` alors
   * absent), qui se retirent entièrement via `onRemove`. */
  readonly onRemovePartial: (filterId: string, removesCodes: readonly string[]) => void;
}

export function ActiveFilterTokens({
  selection,
  resultCount,
  onRemove,
  onClearAll,
  onRemovePartial,
}: ActiveFilterTokensProps) {
  const tokens = buildActiveFilterTokens(selection);
  if (tokens.length === 0) return null;

  return (
    <div class="kycar-active-tokens" role="region" aria-live="polite" aria-label="Filtres actifs">
      <span class="kycar-active-tokens__summary">
        {tokens.length} filtre{tokens.length > 1 ? 's' : ''} actif{tokens.length > 1 ? 's' : ''}
        {resultCount !== undefined ? `, ${resultCount} offres` : ''}
      </span>
      <ul class="kycar-active-tokens__list">
        {tokens.map((t) => (
          <li key={t.key} class="kycar-token" title={t.removalTargets === undefined ? t.tooltip : undefined}>
            <span>{t.text}</span>
            <button
              type="button"
              aria-label={`Retirer le filtre ${t.text}`}
              onClick={() => onRemove(t.filterIds)}
            >
              ×
            </button>
            {t.removalTargets !== undefined ? (
              <ul class="kycar-token__removal-popover" aria-label={`Valeurs de ${t.text}`}>
                {t.removalTargets.map((target) => (
                  <li key={target.label}>
                    <span>{target.label}</span>
                    <button
                      type="button"
                      aria-label={`Retirer ${target.label}`}
                      onClick={() => onRemovePartial(t.filterIds[0]!, target.removesCodes)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
      <button type="button" class="kycar-active-tokens__clear-all" onClick={onClearAll}>
        Tout effacer
      </button>
    </div>
  );
}
