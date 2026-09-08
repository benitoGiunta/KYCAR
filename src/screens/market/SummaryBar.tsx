/**
 * KYCAR — Barre de synthèse et de tri de l'écran A (lot D6), `EX-SCR-106`
 * =================================================================================================
 * `<n> marques · <n> modèles · <n> offres`, puis le tri, puis le sens, puis la case de masquage des
 * modèles épars (`EX-SCR-128`). Composant fin, même convention que les autres `.tsx` de ce dossier.
 */
import type { JSX } from 'preact';

import { formatInteger, formatOfferCount } from './format';
import { MAKE_SORT_FIELD_LABEL, type MakeSortField, type SortDirection } from './sort';

export interface SummaryBarProps {
  readonly makeCount: number;
  readonly modelCount: number;
  readonly offerCount: number;
  /** `EX-SCR-106` : si différent de `makeCount` (population affichée < population filtrée). */
  readonly displayedMakeCount?: number;
  readonly sortField: MakeSortField;
  readonly sortDirection: SortDirection;
  readonly onSortFieldChange: (field: MakeSortField) => void;
  readonly onSortDirectionToggle: () => void;
  readonly sortDisabled: boolean;
  readonly hideSparseModels: boolean;
  readonly onToggleHideSparseModels: (next: boolean) => void;
}

const SORT_FIELDS: readonly MakeSortField[] = ['offres', 'median', 'alpha', 'modeles'];

export function SummaryBar(props: SummaryBarProps): JSX.Element {
  return (
    <div class="kycar-market-summary-bar">
      <div class="kycar-market-summary-counts">
        {props.makeCount === 0 ? (
          '0 marque · 0 modèle · aucune offre'
        ) : (
          <>
            {formatInteger(props.makeCount)} marques · {formatInteger(props.modelCount)} modèles ·{' '}
            {formatOfferCount(props.offerCount)}
            {props.displayedMakeCount !== undefined && props.displayedMakeCount !== props.makeCount ? (
              <span class="kycar-muted"> — {formatInteger(props.displayedMakeCount)} marques affichées</span>
            ) : null}
          </>
        )}
      </div>
      <div class="kycar-market-sort-controls">
        <label>
          Trier par{' '}
          <select
            disabled={props.sortDisabled}
            title={props.sortDisabled ? 'Aucun résultat à trier' : undefined}
            value={props.sortField}
            onChange={(e: JSX.TargetedEvent<HTMLSelectElement>) => props.onSortFieldChange(e.currentTarget.value as MakeSortField)}
          >
            {SORT_FIELDS.map((f) => (
              <option key={f} value={f}>
                {MAKE_SORT_FIELD_LABEL[f]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={props.sortDisabled}
          aria-label={props.sortDirection === 'asc' ? 'Trier en ordre décroissant' : 'Trier en ordre croissant'}
          onClick={props.onSortDirectionToggle}
        >
          {props.sortDirection === 'asc' ? '↑' : '↓'}
        </button>
        <label>
          <input
            type="checkbox"
            checked={props.hideSparseModels}
            onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => props.onToggleHideSparseModels(e.currentTarget.checked)}
          />{' '}
          Masquer les modèles à moins de 3 offres
        </label>
      </div>
    </div>
  );
}
