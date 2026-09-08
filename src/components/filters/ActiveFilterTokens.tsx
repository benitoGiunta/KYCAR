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
}

export function ActiveFilterTokens({ selection, resultCount, onRemove, onClearAll }: ActiveFilterTokensProps) {
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
          <li key={t.key} class="kycar-token" title={t.tooltip}>
            <span>{t.text}</span>
            <button
              type="button"
              aria-label={`Retirer le filtre ${t.text}`}
              onClick={() => onRemove(t.filterIds)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button type="button" class="kycar-active-tokens__clear-all" onClick={onClearAll}>
        Tout effacer
      </button>
    </div>
  );
}
