/**
 * KYCAR — Écran G, sélecteur marque/modèle (`docs/requirements/draft-screens.md` §7.4, `EX-SCR-215`
 * `216`), lot D5 (finition)
 * =================================================================================================
 * Modale piège de focus à deux panneaux, montée par `FilterBand.tsx` UNIQUEMENT quand ouverte
 * (jamais de virtualisation réelle ici — DETTE SIGNALÉE, voir `PanelSearchMulti.tsx` pour la
 * même limite sur `eq` : à 295 marques et jusqu'à 80 modèles par marque, le DOM reste rendu sans
 * fenêtrage ; `EX-SCR-216` demande une liste virtualisée pour 4 955 modèles au total, mais jamais
 * plus de quelques dizaines à la fois puisqu'une seule marque est affichée à droite — le pire cas
 * par panneau reste très inférieur au cas global qui motive la virtualisation).
 *
 * `Échap` ferme sans appliquer ; `Tab`/`Shift+Tab` circulent dans les six arrêts d'
 * `EX-SCR-216` (`keyboard-nav.ts`, `SCREEN_G_TAB_ORDER`) ; `Flèche gauche`/`droite` commutent entre
 * les deux listes. Au montage, le focus va au champ de recherche marque ; à la fermeture, il doit
 * revenir au contrôle appelant — cette dernière étape est laissée à l'appelant (`FilterFieldRow`
 * connaît le bouton d'origine, cette modale ne le connaît pas), documentée ici comme point d'
 * intégration pour D8.
 */
import { useEffect, useRef, useState } from 'preact/hooks';

import type { ReferenceData } from '../../types/reference';
import type { SelectionState } from '../../state/filter-types';
import {
  SCREEN_G_TAB_ORDER,
  nextScreenGStop,
  switchScreenGPanelOnArrow,
  type ScreenGFocusStop,
} from './keyboard-nav';
import { isSameSelection, searchMakes, searchModels, serializeMmmv } from './screen-g-model';

export type ScreenGReferenceData = ReferenceData;

export interface ScreenGProps {
  readonly referenceData?: ScreenGReferenceData;
  readonly currentSelection: SelectionState;
  readonly onCancel: () => void;
  readonly onApply: (mmmv: string) => void;
}

function currentMmmvString(selection: SelectionState): string | undefined {
  const raw = selection['makesModelsVariants'];
  if (raw === undefined) return undefined;
  return Array.isArray(raw) ? String(raw[0]) : String(raw);
}

export function ScreenG({ referenceData, currentSelection, onCancel, onApply }: ScreenGProps) {
  const [makeQuery, setMakeQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [selectedMakeId, setSelectedMakeId] = useState<number | undefined>(undefined);
  const [selectedModelId, setSelectedModelId] = useState<number | undefined>(undefined);
  const [focusStop, setFocusStop] = useState<ScreenGFocusStop>('search-make');
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('[data-screen-g-stop="search-make"]')?.focus();
  }, []);

  if (referenceData === undefined) {
    return (
      <div class="kycar-screen-g" role="dialog" aria-modal="true" aria-label="Sélectionner marque et modèle">
        <p>Liste des marques indisponible — réessayer</p>
        <button type="button" onClick={onCancel}>
          Fermer
        </button>
      </div>
    );
  }

  const makeRows = searchMakes(referenceData, makeQuery);
  const modelRows = searchModels(referenceData, selectedMakeId, modelQuery);
  const candidate =
    selectedMakeId !== undefined ? serializeMmmv(selectedMakeId, selectedModelId) : undefined;
  const applyDisabled = candidate === undefined || isSameSelection(candidate, currentMmmvString(currentSelection));

  const focusStopElement = (stop: ScreenGFocusStop): void => {
    dialogRef.current?.querySelector<HTMLElement>(`[data-screen-g-stop="${stop}"]`)?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const next = nextScreenGStop(focusStop, e.shiftKey ? -1 : 1);
      setFocusStop(next);
      focusStopElement(next);
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const next = switchScreenGPanelOnArrow(focusStop, e.key);
      if (next !== null) {
        e.preventDefault();
        setFocusStop(next);
        focusStopElement(next);
      }
    }
  };

  return (
    <div
      ref={dialogRef}
      class="kycar-screen-g"
      role="dialog"
      aria-modal="true"
      aria-label="Sélectionner marque et modèle"
      onKeyDown={handleKeyDown}
    >
      <header>
        <h2>Sélectionner marque et modèle</h2>
        <button type="button" aria-label="Fermer" onClick={onCancel}>
          ×
        </button>
      </header>
      <div class="kycar-screen-g__panels">
        <div class="kycar-screen-g__panel">
          <input
            type="text"
            data-screen-g-stop="search-make"
            placeholder="Rechercher…"
            value={makeQuery}
            onFocus={() => setFocusStop('search-make')}
            onInput={(e) => setMakeQuery((e.currentTarget as HTMLInputElement).value)}
          />
          {makeQuery.trim().length > 0 && makeRows.length === 0 ? (
            <p>Aucune marque ne contient « {makeQuery} »</p>
          ) : null}
          <ul role="listbox" aria-label="Marques" data-screen-g-stop="list-make" tabIndex={0} onFocus={() => setFocusStop('list-make')}>
            {makeRows.map((row) => (
              <li key={row.make.makeId}>
                <button
                  type="button"
                  aria-selected={selectedMakeId === row.make.makeId}
                  onClick={() => {
                    setSelectedMakeId(row.make.makeId);
                    setSelectedModelId(undefined);
                  }}
                >
                  {row.make.label} {row.count === null ? '—' : row.count}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div class="kycar-screen-g__panel">
          <input
            type="text"
            data-screen-g-stop="search-model"
            placeholder="Rechercher un modèle…"
            value={modelQuery}
            disabled={selectedMakeId === undefined}
            onFocus={() => setFocusStop('search-model')}
            onInput={(e) => setModelQuery((e.currentTarget as HTMLInputElement).value)}
          />
          {selectedMakeId !== undefined && modelQuery.trim().length > 0 && modelRows.length === 0 ? (
            <p>Aucun modèle ne contient « {modelQuery} »</p>
          ) : null}
          <ul
            role="listbox"
            aria-label="Modèles"
            data-screen-g-stop="list-model"
            tabIndex={0}
            onFocus={() => setFocusStop('list-model')}
          >
            {selectedMakeId !== undefined ? (
              <li>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedModelId === undefined}
                    onChange={() => setSelectedModelId(undefined)}
                  />
                  Tous les modèles {referenceData.makeById.get(selectedMakeId)?.label ?? ''}
                </label>
              </li>
            ) : null}
            {modelRows.map((row) => (
              <li key={row.model.modelId}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedModelId === row.model.modelId}
                    onChange={() => setSelectedModelId(row.model.modelId)}
                  />
                  {row.model.label} {row.count === null ? '—' : row.count}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <footer>
        <span>
          {selectedMakeId !== undefined ? 1 : 0} marque, {selectedModelId !== undefined ? 1 : 0} modèle
          sélectionnés
        </span>
        <button type="button" data-screen-g-stop="cancel" onFocus={() => setFocusStop('cancel')} onClick={onCancel}>
          Annuler
        </button>
        <button
          type="button"
          data-screen-g-stop="apply"
          onFocus={() => setFocusStop('apply')}
          disabled={applyDisabled}
          title={applyDisabled ? (candidate === undefined ? 'sélectionnez une marque' : 'sélection inchangée') : undefined}
          onClick={() => candidate !== undefined && onApply(candidate)}
        >
          Appliquer
        </button>
      </footer>
    </div>
  );
}

/** Ordre normatif des six arrêts — réexporté pour que l'intégration (D8) puisse vérifier qu'aucun
 * arrêt n'a été oublié dans le rendu ci-dessus, sans dupliquer la liste. */
export { SCREEN_G_TAB_ORDER };
