/**
 * KYCAR — Bouton ouvrant le sélecteur `G` (`EX-SCR-72`) — `mmmv`, seul filtre `structured_multi`
 * exposé (`cat`/`mcat` partagent le contrôle mais sont désactivés à la source, `EX-SCR-82` #3/4).
 * N'ouvre PAS la modale lui-même : il délègue à `onOpen`, l'écran G étant monté par l'appelant
 * (`ScreenG.tsx`) au niveau du bandeau, pas par filtre, pour n'exister qu'une fois dans le DOM.
 */
import type { FilterDef } from '../../../state/filter-types';

export interface StructuredPickerButtonProps {
  readonly def: FilterDef;
  /** Résumé déjà résolu par l'appelant (`Toutes les marques` / `<Marque>` / `<Marque> <Modèle>` /
   * `<n> sélections`) — ce composant ne connaît pas la taxonomie (D2), il ne fait qu'afficher. */
  readonly summary: string;
  readonly disabled: boolean;
  readonly onOpen: () => void;
}

export function StructuredPickerButton({ def, summary, disabled, onOpen }: StructuredPickerButtonProps) {
  return (
    <div class="kycar-control kycar-control--structured-picker">
      <button type="button" disabled={disabled} onClick={onOpen} aria-haspopup="dialog">
        <span class="kycar-control__label">{def.label}</span>
        <span class="kycar-control__value">{summary}</span>
      </button>
    </div>
  );
}
