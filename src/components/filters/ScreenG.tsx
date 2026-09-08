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
 * `E2E-12` (axe-core, `aria-allowed-attr` + `nested-interactive`) : chaque option (`<li
 * role="option">`) ne contient AUCUN élément interactif natif — le clic est posé sur le `<li>`
 * lui-même, et la navigation clavier au sein d'un panneau (`ArrowUp`/`ArrowDown`) suit le motif
 * APG « la sélection suit le focus », porté par `aria-activedescendant` sur le `<ul
 * role="listbox">` parent (`handleMakeListKeyDown`/`handleModelListKeyDown`) — jamais un
 * `tabindex` individuel par option. `aria-setsize` ne vit QUE sur les options (jamais sur le
 * `<ul>`, qui n'est pas lui-même un membre d'ensemble).
 *
 * `Échap` ferme sans appliquer ; `Tab`/`Shift+Tab` circulent dans les six arrêts d'
 * `EX-SCR-216` (`keyboard-nav.ts`, `SCREEN_G_TAB_ORDER`) ; `Flèche gauche`/`droite` commutent entre
 * les deux listes. Au montage, le focus va au champ de recherche marque ; à la fermeture (`E2E-14`,
 * WCAG 2.4.3), il REVIENT au contrôle appelant — mémorisé par `ScreenG` lui-même à l'ouverture
 * (`document.activeElement`) et restitué dans le nettoyage du même `useEffect`, sans prop dédiée :
 * la modale se démonte toujours de la même façon, quel que soit le bouton qui l'a fermée.
 *
 * `./screen-g.css` importé en effet de bord (`E2E-21`) — fixe la hauteur des deux panneaux, dont
 * dépend le calcul de fenêtrage (`SCREEN_G_ROW_HEIGHT_PX`/`VISIBLE_ROWS`, `screen-g-model.ts`).
 *
 * `ScreenGEmptyNotice`, `ScreenGMakeRow` et `ScreenGModelRow` sont des composants Preact SANS hook,
 * appelables directement hors cycle de rendu (sondes de structure de `screen-g.test.ts`) — comme
 * `ModelZone`/`SummaryBar`/`GridFooter` du lot D6 (`structure-a11y.test.ts`). `ScreenG` lui-même
 * utilise `useState`/`useEffect`/`useRef` et ne peut être vérifié que par intégration réelle (D8).
 */
import { useEffect, useRef, useState } from 'preact/hooks';

import './screen-g.css';
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
  computeScrollTopToReveal,
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

/** Identifiant DOM stable d'une option marque — cible d'`aria-activedescendant` (`E2E-12`). */
export function screenGMakeOptionId(makeId: number): string {
  return `screen-g-make-${makeId}`;
}
/** Identifiant DOM stable d'une option modèle. `undefined` = l'option « Tous les modèles ». */
export function screenGModelOptionId(modelId: number | undefined): string {
  return modelId === undefined ? 'screen-g-model-all' : `screen-g-model-${modelId}`;
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

/**
 * Une ligne du panneau marque, avec sa position dans la liste complète (`aria-posinset`/
 * `aria-setsize`) — l'équivalent accessible du fenêtrage : un lecteur d'écran annonce toujours
 * « <n> sur 295 », jamais seulement « <n> sur <taille de la fenêtre montée> ».
 *
 * `E2E-12`/`D8-14` (axe-core, `aria-allowed-attr` ×82 + `nested-interactive` ×80) : l'ancienne
 * version portait un `<button>` focalisable À L'INTÉRIEUR du `<li role="option">` — un rôle
 * `option` compte comme interactif pour axe, donc un `<button>` imbriqué déclenche
 * `nested-interactive`, quel que soit l'endroit où vit `aria-selected`. Corrigé en profondeur :
 * PLUS aucun élément interactif natif (`button`/`input`/`a`) sous le `<li>` — le clic est posé sur
 * le `<li>` lui-même (aucun rôle/`tabindex` propre requis pour un gestionnaire `onClick`, donc
 * aucune interactivité SUPPLÉMENTAIRE détectée par axe à cet endroit), et la navigation clavier
 * passe par `aria-activedescendant` sur le `<ul role="listbox">` parent (motif APG « sélection
 * suit le focus » — `ScreenG#handlePanelArrowKey`), pas par un `tabindex` individuel par option. */
export function ScreenGMakeRow({ row, index, totalCount, selected, onSelect }: ScreenGMakeRowProps) {
  return (
    <li
      key={row.make.makeId}
      id={screenGMakeOptionId(row.make.makeId)}
      role="option"
      aria-posinset={index + 1}
      aria-setsize={totalCount}
      aria-selected={selected}
      class="kycar-screen-g__option"
      onClick={onSelect}
    >
      <span>
        {row.make.label} {row.count === null ? '—' : row.count}
      </span>
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

/** Une ligne du panneau modèle — même principe d'accessibilité que `ScreenGMakeRow` (`E2E-12`). */
export function ScreenGModelRow({ row, index, totalCount, selected, onSelect }: ScreenGModelRowProps) {
  return (
    <li
      key={row.model.modelId}
      id={screenGModelOptionId(row.model.modelId)}
      role="option"
      aria-posinset={index + 1}
      aria-setsize={totalCount}
      aria-selected={selected}
      class="kycar-screen-g__option"
      onClick={onSelect}
    >
      <span>
        {row.model.label} {row.count === null ? '—' : row.count}
      </span>
    </li>
  );
}

export interface ScreenGProps {
  readonly referenceData?: ScreenGReferenceData;
  readonly currentSelection: SelectionState;
  /** `FV-05`/`D8-05` (`EX-SCR-216`) : effectifs du périmètre filtré courant, fournis par
   * l'appelant (le contrôleur, fix-app) — absents ⇒ repli sur `announcedCount` (`ScreenGMakeRow`/
   * `ScreenGModelRow` affichent alors `—` jusqu'à ce que ce repli existe côté `screen-g-model.ts`,
   * qui distingue déjà les deux cas). Clé du second : `modelKey(makeId, modelId)`. */
  readonly counts?: ReadonlyMap<number, number>;
  readonly modelCounts?: ReadonlyMap<string, number>;
  readonly onCancel: () => void;
  readonly onApply: (mmmv: string) => void;
}

function currentMmmvString(selection: SelectionState): string | undefined {
  const raw = selection['makesModelsVariants'];
  if (raw === undefined) return undefined;
  return Array.isArray(raw) ? String(raw[0]) : String(raw);
}

export function ScreenG({ referenceData, currentSelection, counts, modelCounts, onCancel, onApply }: ScreenGProps) {
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
    // `E2E-14` (`EX-SCR-216`/WCAG 2.4.3) : le focus doit revenir au contrôle appelant à la
    // fermeture (`Échap`/`Annuler`/`Appliquer`) — jamais retomber sur `<body>`. Mémorisé ICI,
    // dans `ScreenG` lui-même (pas une prop `returnFocusTo` : l'appelant n'a rien à fournir, la
    // modale se referme toujours par son propre démontage, quel que soit le bouton qui l'a fermée
    // — `onCancel`/`onApply` déclenchent tous deux `setScreenGOpen(false)` côté `FilterBand`).
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('[data-screen-g-stop="search-make"]')?.focus();
    return () => {
      previouslyFocused?.focus();
    };
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

  const makeRows = searchMakes(referenceData, makeQuery, counts);
  const modelRows = searchModels(referenceData, selectedMakeId, modelQuery, modelCounts);
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

  /**
   * `E2E-12`/`D8-14` : navigation `ArrowUp`/`ArrowDown` au sein d'un panneau — motif APG « la
   * sélection suit le focus » d'un listbox à sélection unique, porté par `aria-activedescendant`
   * sur le `<ul>` (pas de `tabindex` par option, `ScreenGMakeRow`/`ModelRow` restent sans élément
   * interactif imbriqué). `computeScrollTopToReveal` (pure, `screen-g-model.ts`) fait défiler la
   * fenêtre pour que l'option ciblée soit RENDUE avant que `aria-activedescendant` n'y pointe —
   * sinon l'attribut désignerait un id absent du DOM (fenêtrage, résidu `DR-060`).
   */
  const selectMakeAt = (index: number): void => {
    if (makeRows.length === 0) return;
    const clamped = Math.max(0, Math.min(makeRows.length - 1, index));
    const row = makeRows[clamped];
    if (row === undefined) return;
    setSelectedMakeId(row.make.makeId);
    setSelectedModelId(undefined);
    setModelScrollTop(0);
    setMakeScrollTop((prev) => computeScrollTopToReveal(clamped, prev));
  };
  const handleMakeListKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const currentIndex = selectedMakeId !== undefined ? makeRows.findIndex((r) => r.make.makeId === selectedMakeId) : -1;
    selectMakeAt(e.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1);
  };

  /** Panneau modèle : l'option « Tous les modèles » occupe la position virtuelle 0, les modèles
   * réels suivent (`virtualIndex = modelRows-index + 1`) — même principe que `selectMakeAt`. */
  const selectModelAt = (virtualIndex: number): void => {
    const total = modelRows.length + 1;
    const clamped = Math.max(0, Math.min(total - 1, virtualIndex));
    if (clamped === 0) {
      setSelectedModelId(undefined);
      return;
    }
    const row = modelRows[clamped - 1];
    if (row === undefined) return;
    setSelectedModelId(row.model.modelId);
    setModelScrollTop((prev) => computeScrollTopToReveal(clamped - 1, prev));
  };
  const handleModelListKeyDown = (e: KeyboardEvent): void => {
    if (selectedMakeId === undefined) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const currentVirtualIndex =
      selectedModelId === undefined ? 0 : modelRows.findIndex((r) => r.model.modelId === selectedModelId) + 1;
    selectModelAt(e.key === 'ArrowDown' ? currentVirtualIndex + 1 : currentVirtualIndex - 1);
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
            aria-activedescendant={selectedMakeId !== undefined ? screenGMakeOptionId(selectedMakeId) : undefined}
            data-screen-g-stop="list-make"
            tabIndex={0}
            onFocus={() => setFocusStop('list-make')}
            onScroll={(e) => setMakeScrollTop((e.currentTarget as HTMLUListElement).scrollTop)}
            onKeyDown={handleMakeListKeyDown}
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
            aria-activedescendant={
              selectedMakeId === undefined ? undefined : screenGModelOptionId(selectedModelId)
            }
            data-screen-g-stop="list-model"
            tabIndex={0}
            onFocus={() => setFocusStop('list-model')}
            onScroll={(e) => setModelScrollTop((e.currentTarget as HTMLUListElement).scrollTop)}
            onKeyDown={handleModelListKeyDown}
          >
            {selectedMakeId !== undefined ? (
              <li
                id={screenGModelOptionId(undefined)}
                role="option"
                aria-selected={selectedModelId === undefined}
                class="kycar-screen-g__option"
                onClick={() => setSelectedModelId(undefined)}
              >
                <span>Tous les modèles {referenceData.makeById.get(selectedMakeId)?.label ?? ''}</span>
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
