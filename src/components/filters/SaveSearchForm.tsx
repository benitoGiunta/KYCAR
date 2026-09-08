/**
 * KYCAR — Formulaire « Enregistrer la recherche » (`EX-SCR-94`, résidu `DR-139`, `D8-14`)
 * =================================================================================================
 * Composant SANS hook (même principe que `ScreenGEmptyNotice`, lot D6 `structure-a11y.test.ts`) :
 * appelable directement hors cycle de rendu Preact — l'état du champ (nom éditable) et son
 * ouverture/fermeture appartiennent à `FilterBand.tsx`, seul composant du lot à porter des hooks.
 *
 * Champ prérempli par `buildSearchDescription` (`labels.ts`), éditable, limité à
 * `SAVE_SEARCH_NAME_MAX_LENGTH` caractères ; `Enregistrer` n'est actif que sur un nom non vide.
 * Le CRUD lui-même (persistance, écran E) appartient à `req-behaviour`/`src/app.tsx` — ce
 * formulaire ne fait que produire le nom validé, via `onConfirm(name)`.
 */
import { SAVE_SEARCH_NAME_MAX_LENGTH } from './labels';

export interface SaveSearchFormProps {
  /** Nom courant du champ — préempli par l'appelant (`buildSearchDescription`), puis tenu par
   * l'appelant à chaque frappe (`onChange`) : ce composant ne détient aucun état lui-même. */
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onConfirm: (name: string) => void;
  readonly onCancel: () => void;
}

export function SaveSearchForm({ value, onChange, onConfirm, onCancel }: SaveSearchFormProps) {
  const trimmed = value.trim();
  const inputId = 'kycar-save-search-name';
  return (
    <form
      class="kycar-save-search-form"
      role="group"
      aria-label="Enregistrer la recherche"
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed.length > 0) onConfirm(trimmed);
      }}
    >
      <label for={inputId}>Nom de la recherche</label>
      <input
        id={inputId}
        type="text"
        value={value}
        maxLength={SAVE_SEARCH_NAME_MAX_LENGTH}
        onInput={(e) => onChange((e.currentTarget as HTMLInputElement).value)}
      />
      <button type="submit" disabled={trimmed.length === 0}>
        Enregistrer
      </button>
      <button type="button" onClick={onCancel}>
        Annuler
      </button>
    </form>
  );
}
