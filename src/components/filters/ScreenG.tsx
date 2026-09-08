/**
 * KYCAR — Écran G, sélecteur marque/modèle (`docs/requirements/draft-screens.md` §7.4, `EX-SCR-215`
 * `216`), lot D5 (finition)
 * =================================================================================================
 * Modale piège de focus à deux panneaux, montée par `FilterBand.tsx` UNIQUEMENT quand ouverte.
 * Les deux panneaux sont FENÊTRÉS (`computeRowWindow`, `screen-g-model.ts`, résidu `DR-060`) :
 * jamais plus qu'une fenêtre de `SCREEN_G_VISIBLE_ROWS` lignes + tampon n'est montée à la fois sur
 * les 295 marques ou les jusqu'à 4 955 modèles, sans bibliothèque externe (même contrainte que
 * `PanelSearchMulti.tsx`) — deux espaceurs (haut/bas) conservent la hauteur de défilement totale,
 * et chaque ligne montée porte `aria-posinset`/`aria-setsize` (équivalent accessible du fenêtrage
 * pour une liste virtualisée, la liste elle-même restant `role="listbox"`).
 *
 * `Échap` ferme sans appliquer ; `Tab`/`Shift+Tab` circulent dans les six arrêts d'
 * `EX-SCR-216` (`keyboard-nav.ts`, `SCREEN_G_TAB_ORDER`) ; `Flèche gauche`/`droite` commutent entre
 * les deux listes. Au montage, le focus va au champ de recherche marque ; à la fermeture, il doit
 * revenir au contrôle appelant — cette dernière étape est laissée à l'appelant (`FilterFieldRow`
 * connaît le bouton d'origine, cette modale ne le connaît pas), documentée ici comme point d'
 * intégration pour D8.
 *
 * `ScreenGEmptyNotice`, `ScreenGMakeRow` et `ScreenGModelRow` sont des composants Preact SANS hook,
 * appelables directement hors cycle de rendu (sondes de structure de `screen-g.test.ts`) — comme
 * `ModelZone`/`SummaryBar`/`GridFooter` du lot D6 (`structure-a11y.test.ts`). `ScreenG` lui-même
 * utilise `useState`/`useEffect`/`useRef` et ne peut être vérifié que par intégration réelle (D8).
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
import {
  clearScreenGSearch,
  computeRowWindow,
  isSameSelection,
  makePanelEmptyState,
  modelPanelEmptyState,
  searchMakes,
  searchModels,
  serializeMmmv,
  type MakeRow,
  type ModelRow,
  type ScreenGEmptyState,
} from './screen-g-model';

export type ScreenGReferenceData = ReferenceData;

/* ================================================================================================
 * Composants SANS hook — appelables directement, hors cycle de rendu Preact (tests de structure).
 * ============================================================================================== */

export interface ScreenGEmptyNoticeProps {
  readonly state: ScreenGEmptyState;
  /** `Effacer la recherche` (`EX-SCR-216`) — remet les deux panneaux à l'état initial. */
  readonly onClearSearch: () => void;
}

/** `ET-VIDE-FILTRES` (recherche sans correspondance) : le message normatif de `draft-screens.md`
 * §7.4, avec le bouton `Effacer la recherche` accessible (résidu `DR-060`). */
export function ScreenGEmptyNotice({ state, onClearSearch }: ScreenGEmptyNoticeProps) {
  return (
    <p class="kycar-screen-g__empty" data-screen-g-state={state.stateId}>
      {state.message}
      <button type="button" class="kycar-screen-g__clear-search" onClick={onClearSearch}>
        Effacer la recherche
      </button>
    </p>
  );
}

export interface ScreenGMakeRowProps {
  readonly row: MakeRow;
  /** Position 0-indexée dans la liste COMPLÈTE (non fenêtrée) — sert à `aria-posinset`. */
  readonly index: number;
  /** Longueur totale de la liste complète — sert à `aria-setsize` (résidu `DR-060`). */
  readonly totalCount: number;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

/** Une ligne du panneau marque, avec sa position dans la liste complète (`aria-posinset`/
 * `aria-setsize`) — l'équivalent accessible du fenêtrage : un lecteur d'écran annonce toujours
 * « <n> sur 295 », jamais seulement « <n> sur <taille de la fenêtre montée> ». */
export function ScreenGMakeRow({ row, index, totalCount, selected, onSelect }: ScreenGMakeRowProps) {
  return (
    <li key={row.make.makeId} role="option" aria-posinset={index + 1} aria-setsize={totalCount}>
      <button type="button" aria-selected={selected} onClick={onSelect}>
        {row.make.label} {row.count === null ? '—' : row.count}
      </button>
    </li>
  );
}

export interface ScreenGModelRowProps {
  readonly row: ModelRow;
  readonly index: number;
  readonly totalCount: number;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

/** Une ligne du panneau modèle — même principe d'accessibilité que `ScreenGMakeRow`. */
export function ScreenGModelRow({ row, index, totalCount, selected, onSelect }: ScreenGModelRowProps) {
  return (
    <li key={row.model.modelId} role="option" aria-posinset={index + 1} aria-setsize={totalCount}>
      <label>
        <input type="checkbox" checked={selected} onChange={onSelect} />
        {row.model.label} {row.count === null ? '—' : row.count}
      </label>
    </li>
  );
}

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
  // Fenêtrage (résidu `DR-060`) : position de défilement de chaque panneau, en pixels.
  const [makeScrollTop, setMakeScrollTop] = useState(0);
  const [modelScrollTop, setModelScrollTop] = useState(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  /** `Effacer la recherche` (`EX-SCR-216`) : remet les DEUX panneaux à l'état initial. */
  const handleClearSearch = (): void => {
    const reset = clearScreenGSearch();
    setMakeQuery(reset.makeQuery);
    setModelQuery(reset.modelQuery);
    setSelectedMakeId(reset.selectedMakeId);
    setSelectedModelId(reset.selectedModelId);
    setMakeScrollTop(0);
    setModelScrollTop(0);
  };

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

  // Fenêtrage des deux panneaux (résidu `DR-060`) : jamais plus qu'une fenêtre de lignes montée.
  const makeWindow = computeRowWindow(makeRows, makeScrollTop);
  const modelWindow = computeRowWindow(modelRows, modelScrollTop);
  const makeEmptyState = makePanelEmptyState(makeQuery, makeRows);
  const modelEmptyState = modelPanelEmptyState(selectedMakeId !== undefined, modelQuery, modelRows);

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
          {makeEmptyState !== null ? <ScreenGEmptyNotice state={makeEmptyState} onClearSearch={handleClearSearch} /> : null}
          <ul
            role="listbox"
            aria-label="Marques"
            aria-setsize={makeWindow.totalCount}
            data-screen-g-stop="list-make"
            tabIndex={0}
            onFocus={() => setFocusStop('list-make')}
            onScroll={(e) => setMakeScrollTop((e.currentTarget as HTMLUListElement).scrollTop)}
          >
            <li aria-hidden="true" style={{ height: `${makeWindow.topPaddingPx}px` }} />
            {makeWindow.items.map((row, i) => (
              <ScreenGMakeRow
                row={row}
                index={makeWindow.startIndex + i}
                totalCount={makeWindow.totalCount}
                selected={selectedMakeId === row.make.makeId}
                onSelect={() => {
                  setSelectedMakeId(row.make.makeId);
                  setSelectedModelId(undefined);
                  setModelScrollTop(0);
                }}
              />
            ))}
            <li aria-hidden="true" style={{ height: `${makeWindow.bottomPaddingPx}px` }} />
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
          {modelEmptyState !== null ? <ScreenGEmptyNotice state={modelEmptyState} onClearSearch={handleClearSearch} /> : null}
          <ul
            role="listbox"
            aria-label="Modèles"
            aria-setsize={modelWindow.totalCount}
            data-screen-g-stop="list-model"
            tabIndex={0}
            onFocus={() => setFocusStop('list-model')}
            onScroll={(e) => setModelScrollTop((e.currentTarget as HTMLUListElement).scrollTop)}
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
            <li aria-hidden="true" style={{ height: `${modelWindow.topPaddingPx}px` }} />
            {modelWindow.items.map((row, i) => (
              <ScreenGModelRow
                row={row}
                index={modelWindow.startIndex + i}
                totalCount={modelWindow.totalCount}
                selected={selectedModelId === row.model.modelId}
                onSelect={() => setSelectedModelId(row.model.modelId)}
              />
            ))}
            <li aria-hidden="true" style={{ height: `${modelWindow.bottomPaddingPx}px` }} />
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
