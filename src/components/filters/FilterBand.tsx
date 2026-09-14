/**
 * KYCAR — Bandeau de filtres, point de montage public du lot D5 (finition)
 * =================================================================================================
 * Composant Preact MONTABLE isolément (`docs/plans/ARCHITECTURE.md` §7.1 D5 : « expose des
 * composants montables ; l'intégration globale est le lot D8 »). Compose les quatre zones
 * d'`EX-SCR-55` : ligne primaire, recherche de filtre, groupes secondaires, filtres actifs — et
 * possède son propre état de sélection, débounce/historique (`InteractionController`) et écran G.
 *
 * Le composant ne câble RIEN dans `src/app.tsx` : c'est un export nommé que D8 monte où il veut,
 * avec les callbacks `onHistoryReplace`/`onHistoryPush`/`onRecomputeLocal`/`onReload` reliés à
 * l'historique navigateur réel et au moteur d'agrégation réels (hors périmètre D5).
 *
 * `./filter-band.css` importé en effet de bord (`E2E-21`, même convention que
 * `MarketScreen.tsx`/`market.css`) — Vite le bundle partout où `FilterBand` est monté, aucun
 * câblage `src/app.tsx` requis.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { observeHeaderHeight } from './sticky-offset';

import './filter-band.css';

import { FILTER_BY_ID, FILTER_DEFAULTS, FILTER_DEFS, isDependencySatisfied } from '../../state/filter-registry';
import { resolveFilterClass } from '../../state/filter-registry';
import type { MutableSelectionState, ScreenMode, SelectionState } from '../../state/filter-types';
import type { IneffectiveTaxonomy } from '../../state/ineffective-filters';
import { InteractionController } from '../../state/interaction';
import { parseMmmvBlock, resolveMakeChange, withRouteTaxonomy } from '../../state/navigation';
import type { ModeCarryPair } from '../../state/router';
import {
  URL_BUDGET_EXCEEDED_MESSAGE,
  assembleUrl,
  serializeQuery,
  wouldExceedBudget,
  type UiState,
} from '../../state/url-codec';
import { ActiveFilterTokens } from './ActiveFilterTokens';
import {
  cascadeRemovalMessage,
  countActiveFilters,
  defaultExpandedGroups,
  countPrimaryActive,
  deferredApplyLabel,
  isTypingTarget,
  type BandRegime,
} from './band-model';
import { FilterSearch, FILTER_SEARCH_INPUT_ID } from './FilterSearch';
import { buildActiveFilterTokens, buildSearchDescription } from './labels';
import { PrimaryLine } from './PrimaryLine';
import { SaveSearchForm } from './SaveSearchForm';
import { ScreenG, type ScreenGReferenceData } from './ScreenG';
import { SecondaryGroups } from './SecondaryGroups';
import type { FacetCounts, OnFilterChange } from './types';

export interface FilterBandProps {
  readonly mode: ScreenMode;
  readonly initialSelection: SelectionState;
  /** Origine + chemin courants (sans requête), pour le calcul du plafond `EX-NAV-10/11`. */
  readonly originAndPath: string;
  readonly uiState?: UiState;
  readonly resultCount?: number;
  /** `EX-SCR-78` : `true` pendant `ET-CHARGE-MAJ` — le compteur affiche `resultCount` (la dernière
   * valeur connue) atténué et suivi de `…`, jamais `0` (`DR-139`, résidu). */
  readonly resultCountLoading?: boolean;
  /** `D8-05` (`EX-SCR-65`/`89`/`90`) : facettes du dernier recalcul, PAR FILTRE — le contrôleur
   * (fix-app) les recalcule à chaque changement appliqué et les fournit ici ; absentes tant que le
   * premier recalcul n'est pas arrivé (aucune parenthèse rendue, jamais `(0)` par défaut). */
  readonly facetCounts?: ReadonlyMap<string, FacetCounts>;
  /** `true` pendant l'écart de recalcul des facettes (`≤ 100 ms` normatif) — chaque option affiche
   * `…` à la place de son effectif plutôt que d'afficher une valeur périmée sans le signaler. */
  readonly facetCountsPending?: boolean;
  /** `D8-05`/`FV-05` (`EX-SCR-216`) : effectifs de l'écran G, par marque puis par modèle (clé
   * `modelKey(makeId, modelId)`, `src/types/reference.ts`) — mêmes règles que `facetCounts` :
   * absents ⇒ repli sur `announcedCount` (`screen-g-model.ts`), jamais `0` par défaut. */
  readonly screenGMakeCounts?: ReadonlyMap<number, number>;
  readonly screenGModelCounts?: ReadonlyMap<string, number>;
  /** `EX-SCR-94` (zone 4, `D8-14` résidu `DR-139`) : appelé avec le NOM validé du formulaire
   * (`SaveSearchForm`, prérempli par `buildSearchDescription`) — absent ⇒ le bouton
   * `Enregistrer la recherche` n'est pas rendu. Le CRUD lui-même (persistance, écran E) appartient
   * à `src/app.tsx` : c'est à l'appelant de brancher ce callback ici. */
  readonly onSaveSearch?: (name: string) => void;
  /** `D8-15` (`EX-SCR-96`/`97` — voir la note de lecture de `regime-and-shortcuts.test.ts` sur la
   * numérotation de `FIX-LEAD-DECISIONS-2.8.md`) : régime visuel du bandeau, choisi par l'appelant
   * (largeur de fenêtre, `matchMedia`) — `large` par défaut. En régime `compact`, le bandeau se
   * réduit à une barre unique ouvrant une feuille plein écran à application DIFFÉRÉE. */
  readonly regime?: BandRegime;
  /** `EX-SCR-97` : effectif projeté sous la sélection en cours d'édition dans la feuille compacte
   * (non encore appliquée) — fourni par l'appelant, recalculé à chaque `onDraftSelectionChange`.
   * `undefined` tant qu'aucune réponse n'est disponible ⇒ libellé neutre (`deferredApplyLabel`). */
  readonly projectedResultCount?: number;
  /** `EX-SCR-97` : notifié à chaque changement de la sélection BROUILLON de la feuille compacte
   * (avant application) — permet à l'appelant de recalculer `projectedResultCount` sans toucher à
   * la sélection réellement appliquée (`onSelectionApplied`, `onRecomputeLocal`). */
  readonly onDraftSelectionChange?: (draft: SelectionState) => void;
  readonly referenceData?: ScreenGReferenceData;
  /** `EX-SCR-101` (`D8-31`) — date du snapshot SERVI (`SnapshotDescriptor.capturedAt`), routée vers
   * la zone (4). Absente ⇒ aucun marquage « sans effet », rendu strictement inchangé. */
  readonly snapshotDate?: string | Date;
  /** `EX-SCR-101` — taxonomie du snapshot quand elle diffère du référentiel de libellés (voir
   * `ActiveFilterTokens`). Aujourd'hui inutile : les deux coïncident. */
  readonly snapshotTaxonomy?: IneffectiveTaxonomy;
  /**
   * `EX-SRCH-14` (`D8-31`) — couple marque/modèle porté par la ROUTE en mode 2 (`matchRoute`). Il
   * n'est PAS dans `initialSelection` : `carryFiltersAcrossMode` retire le bloc `mmmv` à l'entrée
   * en mode 2 (`EX-NAV-15`). Sans lui, le bandeau ne peut pas savoir si la marque choisie dans le
   * sélecteur est la marque courante — il conserve alors le comportement d'avant `D8-31`.
   */
  readonly routePair?: ModeCarryPair;
  /**
   * `EX-SRCH-14`/`EX-NAV-15` — appelé quand le sélecteur désigne un MODÈLE depuis le mode 2 : seule
   * la coquille sait construire le chemin `/marche/:makeId-:slug/:modelId-:slug` (les slugs viennent
   * de la taxonomie). Absent ⇒ repli sur le comportement d'avant (`mmmv` posé comme filtre).
   */
  readonly onSelectModel?: (pair: { readonly makeId: number; readonly modelId: number }) => void;
  readonly onHistoryReplace: (url: string) => void;
  readonly onHistoryPush: (url: string) => void;
  readonly onRecomputeLocal: () => void;
  readonly onReload: () => void;
  /** Notifié à chaque sélection effectivement appliquée (post-debounce) — D8 y branche son état
   * global et le calcul de `selectionHash`/`localDatasetKey` (`tr-split.ts`). */
  readonly onSelectionApplied?: (selection: SelectionState) => void;
  /** `EX-NAV-11` : notifié quand une tentative de pose est refusée pour dépassement du plafond. */
  readonly onUrlBudgetExceeded?: (message: string) => void;
}

/**
 * `DR-059` (`EX-SCR-73`) : retire en cascade tout filtre dont la dépendance n'est plus satisfaite
 * après un retrait — sans quoi un prédicat orphelin (ex. bornes de leasing sans `hasleasing`) reste
 * appliqué alors que son contrôle est désactivé : l'utilisateur ne peut plus ni le voir ni le
 * retirer. Boucle jusqu'à stabilité (une chaîne de dépendances peut se propager sur plus d'un
 * niveau). Mutation en place de `state`, appelée uniquement sur une copie déjà détachée de l'état
 * React. Retourne les identifiants effectivement retirés PAR LA CASCADE (pas le retrait direct de
 * l'appelant) — `EX-SCR-73` : « avec une notification explicite », `cascadeRemovalMessage`.
 */
function cascadeRemoveOrphans(state: MutableSelectionState): string[] {
  const removed: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const def of FILTER_DEFS) {
      if (def.dependencies.length === 0) continue;
      if (!(def.id in state)) continue;
      if (!isDependencySatisfied(def, state)) {
        delete state[def.id];
        removed.push(def.id);
        changed = true;
      }
    }
  }
  return removed;
}

/**
 * Résumé du contrôle `Marque / Modèle` (`EX-SCR-72`/`EX-SCR-103`). Exporté depuis `D8-35` pour être
 * sondable directement : `FilterBand` utilise des hooks et ne peut pas être monté sans DOM dans
 * l'environnement des sondes de revue (`vitest.review.config.ts#environment: 'node'`).
 */
export function mmmvSummary(selection: SelectionState, referenceData: ScreenGReferenceData | undefined): string {
  const raw = selection['makesModelsVariants'];
  if (raw === undefined) return 'Toutes les marques';
  const blocks = (Array.isArray(raw) ? raw : [raw]).map(String);
  if (blocks.length > 1) return `${blocks.length} sélections`;
  const first = blocks[0];
  if (first === undefined) return 'Toutes les marques';
  const [makeIdStr, modelIdStr] = first.split('|');
  const makeId = Number(makeIdStr);
  const make = referenceData?.makeById.get(makeId);
  if (make === undefined) return 'Toutes les marques';
  if (modelIdStr === undefined || modelIdStr.length === 0) return make.label;
  const model = referenceData?.modelByKey.get(`${makeId}:${Number(modelIdStr)}`);
  return model !== undefined ? `${make.label} ${model.label}` : make.label;
}

export function FilterBand(props: FilterBandProps) {
  const selectionRef = useRef<MutableSelectionState>({ ...props.initialSelection });
  const [selection, setSelection] = useState<SelectionState>(selectionRef.current);
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(() =>
    defaultExpandedGroups(props.initialSelection),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [screenGOpen, setScreenGOpen] = useState(false);
  // `EX-SCR-73` : notification du retrait en cascade (« <n> filtres retirés », `Annuler`), 5 s.
  const [cascadeNotice, setCascadeNotice] = useState<{ message: string; snapshot: SelectionState } | null>(null);
  const cascadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // `EX-SCR-94` (`D8-14`, résidu `DR-139`) : `null` = formulaire fermé, sinon le nom en cours
  // d'édition (préempli à l'ouverture par `buildSearchDescription`, modifiable par l'utilisateur).
  const [saveSearchDraft, setSaveSearchDraft] = useState<string | null>(null);
  // `EX-SCR-97` (régime `compact`) : sélection BROUILLON de la feuille plein écran, appliquée
  // seulement au clic sur « Voir les <n> offres » — jamais poussée dans l'historique tant qu'elle
  // n'est pas confirmée (`D8-15`).
  const [compactSheetOpen, setCompactSheetOpen] = useState(false);
  const [draftSelection, setDraftSelection] = useState<SelectionState>(selection);
  /**
   * `EX-SCR-56` (ACC-02) — état REPLIÉ / DÉPLIÉ du bandeau hors régime compact. Replié, le bandeau
   * ne montre que ses zones TOUJOURS VISIBLES d'`EX-SCR-55` — la ligne primaire (1) et les filtres
   * actifs (4) — et tient dans les 96 px de l'exigence ; déplié, il ouvre le panneau qui porte la
   * recherche de filtre (2) et les groupes secondaires (3), plafonné à 320 px, zone (3) défilante.
   *
   * Défaut : REPLIÉ, sans exception. `EX-SCR-56` décrit 96 px comme l'état d'arrivée du bandeau, et
   * `EX-SCR-92` (« les groupes portant un filtre actif sont dépliés au chargement ») porte sur les
   * GROUPES à l'intérieur de la zone (3), pas sur le bandeau lui-même : ces groupes sont bien
   * ouverts, ils le sont dans un panneau que l'utilisateur ouvre. Ouvrir le panneau au chargement
   * dès qu'un filtre est posé rendait 320 px du viewport indisponibles sur toute URL partagée.
   * Le repliement du bandeau n'ajoute AUCUN paramètre d'URL : `grp` reste l'unique porteur de
   * l'état de repliement des groupes (`EX-NAV-10bis`).
   */
  const [panelOpen, setPanelOpen] = useState<boolean>(false);

  // `EX-SCR-56` (ACC-02) — publie la hauteur de l'en-tête collant dans `--kycar-band-top`, que
  // `app.css` lit sur `.kycar-filter-bar` : c'est ce conteneur qui porte le collage (le bandeau
  // lui-même avait un parent à sa propre hauteur, la boîte de collage n'offrait aucune course).
  useEffect(() => observeHeaderHeight(), []);

  const controllerRef = useRef<InteractionController | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = new InteractionController({
      replaceState: props.onHistoryReplace,
      pushState: props.onHistoryPush,
      recomputeLocal: props.onRecomputeLocal,
      reload: props.onReload,
    });
  }
  useEffect(() => {
    const controller = controllerRef.current;
    return () => controller?.dispose();
  }, []);

  // `EX-SCR-73` : le minuteur de la notification de cascade survit au démontage (nettoyé ici),
  // jamais laissé courant après que le composant a disparu.
  useEffect(() => {
    return () => {
      if (cascadeTimerRef.current !== null) clearTimeout(cascadeTimerRef.current);
    };
  }, []);

  // `EX-SCR-81` : raccourci `/` → focus du champ de recherche de filtre, depuis n'importe où dans
  // l'application, SAUF si le focus est déjà dans un champ de saisie (`isTypingTarget`, pure,
  // `band-model.ts`) — non sondable par une sonde D5 faute d'environnement DOM (`vitest.review.
  // config.ts#environment: 'node'`), comme les autres hooks de ce composant (voir le README).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== '/') return;
      const active = document.activeElement as HTMLElement | null;
      if (isTypingTarget(active?.tagName, active?.isContentEditable === true)) return;
      e.preventDefault();
      document.getElementById(FILTER_SEARCH_INPUT_ID)?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /** `EX-SCR-73` : arme (ou réarme) la notification de retrait en cascade, 5 s, annulable. */
  const notifyCascadeRemoval = (removedIds: readonly string[], before: SelectionState): void => {
    const message = cascadeRemovalMessage(removedIds);
    if (message === null) return;
    if (cascadeTimerRef.current !== null) clearTimeout(cascadeTimerRef.current);
    setCascadeNotice({ message, snapshot: before });
    cascadeTimerRef.current = setTimeout(() => setCascadeNotice(null), 5_000);
  };

  const applyToSelection = (filterId: string, value: SelectionState[string] | undefined): string => {
    const next: MutableSelectionState = { ...selectionRef.current };
    if (value === undefined) delete next[filterId];
    else next[filterId] = value;
    const query = serializeQuery(next, props.uiState ?? {}, { filterDefaults: FILTER_DEFAULTS });
    const assembly = assembleUrl(props.originAndPath, query);
    selectionRef.current = next;
    setSelection(next);
    props.onSelectionApplied?.(next);
    return assembly.url;
  };

  const handleChange: OnFilterChange = (evt) => {
    const def = FILTER_BY_ID.get(evt.filterId);
    if (def === undefined) return;

    if (evt.value !== undefined) {
      const candidate: MutableSelectionState = { ...selectionRef.current, [evt.filterId]: evt.value };
      if (wouldExceedBudget(props.originAndPath, candidate, props.uiState ?? {}, { filterDefaults: FILTER_DEFAULTS })) {
        props.onUrlBudgetExceeded?.(URL_BUDGET_EXCEEDED_MESSAGE);
        return; // EX-NAV-11 : refusé, jamais tronqué, l'ancienne valeur reste en vigueur
      }
    }

    const cls = resolveFilterClass(def, props.mode);
    controllerRef.current?.scheduleChange({
      filterId: evt.filterId,
      gesture: evt.gesture,
      control: def.control,
      cls,
      commit: () => applyToSelection(evt.filterId, evt.value),
      valueLength: evt.valueLength,
    });
  };

  /** `EX-NAV-14` : pousse une sélection sur un chemin DONNÉ (le chemin courant par défaut). Le
   * paramètre `path` sert la redirection d'`EX-SRCH-14`, seule situation où le bandeau change de
   * route ; l'état d'interface est alors volontairement VIDÉ (brossage, page, variante de G4 du
   * mode 2 n'ont aucun sens sur l'écran A). */
  const forcePushSelectionTo = (
    next: MutableSelectionState,
    path: string = props.originAndPath,
    uiState: UiState = props.uiState ?? {},
  ): void => {
    selectionRef.current = next;
    setSelection(next);
    props.onSelectionApplied?.(next);
    const query = serializeQuery(next, uiState, { filterDefaults: FILTER_DEFAULTS });
    controllerRef.current?.forcePush(assembleUrl(path, query).url);
  };

  const forcePushSelection = (next: MutableSelectionState): void => forcePushSelectionTo(next);

  const handleRemove = (filterIds: readonly string[]): void => {
    const before = selectionRef.current;
    const next: MutableSelectionState = { ...before };
    for (const id of filterIds) delete next[id];
    const cascaded = cascadeRemoveOrphans(next); // DR-059 : les enfants orphelins partent avec leur parent
    notifyCascadeRemoval(cascaded, before);
    forcePushSelection(next);
  };

  /** Retrait UNITAIRE d'une valeur d'un filtre d'énumération multi-valeurs, depuis l'infobulle
   * d'un jeton à cardinal (`EX-SCR-76` « en substance », `D-10`, `DR-062`). */
  const handleRemovePartial = (filterId: string, removesCodes: readonly string[]): void => {
    const before = selectionRef.current;
    const current = before[filterId];
    if (current === undefined) return;
    const codes = (Array.isArray(current) ? current : [current]).map(String);
    const remaining = codes.filter((c) => !removesCodes.includes(c));
    const next: MutableSelectionState = { ...before };
    if (remaining.length === 0) delete next[filterId];
    else next[filterId] = remaining;
    const cascaded = cascadeRemoveOrphans(next);
    notifyCascadeRemoval(cascaded, before);
    forcePushSelection(next);
  };

  /** `D8-04d` : retrait du jeton « modèle » de `mmmv` (`ActiveFilterTokens#onNarrow`, `narrowsTo`,
   * `labels.ts`) — REMPLACE la valeur du filtre par une variante plus étroite (la marque seule)
   * au lieu de la supprimer, contrairement à `handleRemove`. */
  const handleNarrow = (filterId: string, value: SelectionState[string]): void => {
    const before = selectionRef.current;
    const next: MutableSelectionState = { ...before, [filterId]: value };
    const cascaded = cascadeRemoveOrphans(next);
    notifyCascadeRemoval(cascaded, before);
    forcePushSelection(next);
  };

  const handleClearAll = (): void => {
    forcePushSelection({});
  };

  /**
   * `EX-SRCH-14` (`D8-31`) — application du sélecteur marque/modèle (écran G, `EX-SCR-103` : sur
   * l'écran B, le contrôle `Marque / Modèle` affiche le couple courant et ouvre `G` positionné
   * dessus). C'est le SEUL chemin par lequel la marque change en mode 2.
   *
   * Avant cette correction, tout passait par `handleChange`, donc par `applyToSelection`, donc par
   * `assembleUrl(props.originAndPath, …)` : choisir une autre marque depuis l'écran B produisait
   * `/marche/54-opel/1918-corsa?mmmv=74` — la route restait sur l'ANCIEN couple et un `mmmv`
   * orphelin s'ajoutait, au lieu de vider le modèle et de revenir à l'écran A.
   *
   * La décision est prise par `resolveMakeChange` (`src/state/navigation.ts`, source de vérité
   * unique, sondée par `tests/review/D5/make-change-mode2.test.ts`) ; ce composant ne fait
   * qu'exécuter la cible. Sans `routePair` fourni par l'appelant, le comportement d'avant est
   * conservé à l'identique (non-régression).
   */
  const handleScreenGApply = (mmmv: string): void => {
    setScreenGOpen(false);
    const chosen = parseMmmvBlock(mmmv);
    if (chosen !== null && props.mode === 'mode2' && props.routePair !== undefined) {
      const outcome = resolveMakeChange({
        mode: 'mode2',
        selection: selectionRef.current,
        chosen,
        routePair: props.routePair,
      });
      if (outcome.kind === 'unchanged') return;
      if (outcome.kind === 'redirectToMarket') {
        // `EX-NAV-11` : même règle que partout ailleurs — refus avec message, jamais de troncature.
        if (wouldExceedBudget(outcome.path, outcome.selection, {}, { filterDefaults: FILTER_DEFAULTS })) {
          props.onUrlBudgetExceeded?.(URL_BUDGET_EXCEEDED_MESSAGE);
          return;
        }
        forcePushSelectionTo(outcome.selection, outcome.path, {});
        return;
      }
      if (outcome.kind === 'goToModel' && props.onSelectModel !== undefined) {
        props.onSelectModel(outcome.pair);
        return;
      }
    }
    handleChange({ filterId: 'makesModelsVariants', value: mmmv, gesture: 'selection-immediate' });
  };

  /** `Annuler` de la notification de cascade (`EX-SCR-73`) : restitue la sélection D'AVANT le
   * retrait direct ET sa cascade — un seul geste, symétrique du retrait qui l'a déclenché. */
  const handleUndoCascade = (): void => {
    if (cascadeNotice === null) return;
    if (cascadeTimerRef.current !== null) clearTimeout(cascadeTimerRef.current);
    setCascadeNotice(null);
    forcePushSelection({ ...cascadeNotice.snapshot });
  };

  /** `EX-SCR-94` (`D8-14`) : ouvre le formulaire, préempli par la description des jetons actifs
   * (`buildSearchDescription`) — jamais un champ vide. */
  const handleOpenSaveSearch = (): void => {
    const tokens = buildActiveFilterTokens(selection, props.referenceData);
    setSaveSearchDraft(buildSearchDescription(tokens));
  };
  const handleConfirmSaveSearch = (name: string): void => {
    props.onSaveSearch?.(name);
    setSaveSearchDraft(null);
  };

  /** `EX-SCR-97` (régime `compact`) : ouvre la feuille, la sélection brouillon démarre identique à
   * la sélection APPLIQUÉE — les changements faits dans la feuille restent locaux jusqu'à
   * confirmation (`handleApplyCompactSheet`). */
  const handleOpenCompactSheet = (): void => {
    setDraftSelection(selection);
    props.onDraftSelectionChange?.(selection);
    setCompactSheetOpen(true);
  };
  const handleDraftChange: OnFilterChange = (evt) => {
    setDraftSelection((prev) => {
      const next: MutableSelectionState = { ...prev };
      if (evt.value === undefined) delete next[evt.filterId];
      else next[evt.filterId] = evt.value;
      cascadeRemoveOrphans(next); // pas de notification pour un brouillon non encore appliqué
      props.onDraftSelectionChange?.(next);
      return next;
    });
  };
  const handleResetCompactSheet = (): void => {
    setDraftSelection({});
    props.onDraftSelectionChange?.({});
  };
  const handleApplyCompactSheet = (): void => {
    // `EX-NAV-11` — complété par fix-app (D8-15), HORS de son périmètre nominal : le câblage de
    // `regime` par la coquille a rendu ce chemin atteignable pour la première fois, et l'application
    // DIFFÉRÉE de la feuille compacte passait par `forcePushSelection`, réservé aux RETRAITS (qui
    // ne peuvent que raccourcir l'URL) — le plafond de 2 000 caractères n'y était donc pas éprouvé.
    // Même règle que `handleChange` : REFUS avec son message, jamais de troncature, et la feuille
    // reste ouverte pour que l'utilisateur retire un filtre plutôt que de perdre son brouillon.
    const candidate: MutableSelectionState = { ...draftSelection };
    if (wouldExceedBudget(props.originAndPath, candidate, props.uiState ?? {}, { filterDefaults: FILTER_DEFAULTS })) {
      props.onUrlBudgetExceeded?.(URL_BUDGET_EXCEEDED_MESSAGE);
      return;
    }
    forcePushSelection(candidate);
    setCompactSheetOpen(false);
  };
  const handleCancelCompactSheet = (): void => {
    setCompactSheetOpen(false);
  };

  // `DR-135` (`EX-SCR-91`) : le compteur du bandeau doit utiliser LA MÊME règle que le reste du
  // lot (`countActiveFilters`, `band-model.ts`), qui exclut un filtre posé à sa `defaultValue`
  // non-absence (ex. `powertype=kw`) — un calcul en ligne ne le faisait pas, donnant deux comptes
  // divergents (bandeau replié vs ailleurs) pour la même sélection.
  const activeCount = useMemo(() => countActiveFilters(selection), [selection]);

  // `EX-SCR-103` (`D8-35`, demande de fix-app-2 §7.1) : sur l'écran B le couple courant n'est PAS
  // dans `selection` — la route l'a absorbé (`EX-NAV-15`). Le contrôle `Marque / Modèle` et l'écran
  // `G` le lisent donc sur `routePair`, réinjecté POUR L'AFFICHAGE par `withRouteTaxonomy` (pure,
  // `src/state/navigation.ts`). Aucune sérialisation d'URL n'utilise cette valeur : la route reste
  // la seule porteuse du couple en mode 2.
  const taxonomySelection = withRouteTaxonomy(selection, props.mode, props.routePair);
  const screenGSummary = mmmvSummary(taxonomySelection, props.referenceData);
  const regime: BandRegime = props.regime ?? 'large';

  const toggleGroup = (group: string): void =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  const searchAndGroups = (
    sel: SelectionState,
    onFieldChange: OnFilterChange,
    onResetGroup: (ids: readonly string[]) => void,
    compactControls: boolean,
  ) => (
    <>
      <FilterSearch
        query={searchQuery}
        onQueryChange={(q, groupsToExpand) => {
          setSearchQuery(q);
          if (groupsToExpand.size > 0) setExpandedGroups((prev) => new Set([...prev, ...groupsToExpand]));
        }}
      />
      <SecondaryGroups
        mode={props.mode}
        selection={sel}
        expandedGroups={expandedGroups}
        facetCounts={props.facetCounts}
        facetCountsPending={props.facetCountsPending}
        compact={compactControls}
        onToggleGroup={toggleGroup}
        onChange={onFieldChange}
        onResetGroup={onResetGroup}
      />
    </>
  );

  // `D8-15` (`EX-SCR-73`) : notification du retrait en cascade — commune aux trois régimes.
  const cascadeNoticeNode =
    cascadeNotice !== null ? (
      <div class="kycar-cascade-notice" role="status" aria-live="polite">
        <span>{cascadeNotice.message}</span>
        <button type="button" onClick={handleUndoCascade}>
          Annuler
        </button>
      </div>
    ) : null;

  // `EX-SCR-94` — commun aux trois régimes.
  const saveSearchFormNode =
    saveSearchDraft !== null ? (
      <SaveSearchForm
        value={saveSearchDraft}
        onChange={setSaveSearchDraft}
        onConfirm={handleConfirmSaveSearch}
        onCancel={() => setSaveSearchDraft(null)}
      />
    ) : null;

  const screenGNode = screenGOpen ? (
    <ScreenG
      referenceData={props.referenceData}
      currentSelection={taxonomySelection}
      counts={props.screenGMakeCounts}
      modelCounts={props.screenGModelCounts}
      onCancel={() => setScreenGOpen(false)}
      onApply={handleScreenGApply}
    />
  ) : null;

  if (regime === 'compact') {
    // `EX-SCR-97` : barre unique 56 px (bouton `Filtres (n)`, compteur, jetons défilants) — la
    // feuille plein écran applique DE FAÇON DIFFÉRÉE (`Appliquer`/`Voir les <n> offres`).
    return (
      <div class="kycar-filter-band kycar-filter-band--compact" data-active-count={activeCount} data-regime={regime}>
        <div class="kycar-compact-bar">
          <button type="button" class="kycar-compact-bar__open" onClick={handleOpenCompactSheet}>
            Filtres {activeCount > 0 ? `(${activeCount})` : ''}
          </button>
          <ActiveFilterTokens
            onRemovePartial={handleRemovePartial}
            onNarrow={handleNarrow}
            selection={selection}
            referenceData={props.referenceData}
            snapshotDate={props.snapshotDate}
            snapshotTaxonomy={props.snapshotTaxonomy}
            resultCount={props.resultCount}
            resultCountLoading={props.resultCountLoading}
            onRemove={handleRemove}
            onClearAll={handleClearAll}
            onSaveSearch={props.onSaveSearch !== undefined ? handleOpenSaveSearch : undefined}
          />
        </div>
        {cascadeNoticeNode}
        {saveSearchFormNode}
        {compactSheetOpen ? (
          <div class="kycar-compact-sheet" role="dialog" aria-modal="true" aria-label="Filtres">
            <header>
              <h2>Filtres</h2>
              <button type="button" aria-label="Fermer sans appliquer" onClick={handleCancelCompactSheet}>
                ×
              </button>
            </header>
            <PrimaryLine
              mode={props.mode}
              selection={draftSelection}
              facetCounts={props.facetCounts}
              facetCountsPending={props.facetCountsPending}
              compact
              onChange={handleDraftChange}
              onOpenScreenG={() => setScreenGOpen(true)}
              screenGSummary={mmmvSummary(withRouteTaxonomy(draftSelection, props.mode, props.routePair), props.referenceData)}
            />
            {searchAndGroups(
              draftSelection,
              handleDraftChange,
              (ids) => {
                const next: MutableSelectionState = { ...draftSelection };
                for (const id of ids) delete next[id];
                cascadeRemoveOrphans(next);
                setDraftSelection(next);
                props.onDraftSelectionChange?.(next);
              },
              true,
            )}
            <footer class="kycar-compact-sheet__footer">
              <button type="button" onClick={handleResetCompactSheet}>
                Réinitialiser
              </button>
              <button type="button" onClick={handleApplyCompactSheet}>
                {deferredApplyLabel(props.projectedResultCount)}
              </button>
            </footer>
          </div>
        ) : null}
        {screenGNode}
      </div>
    );
  }

  // `EX-SCR-56` (ACC-02) — la recherche de filtre (2) et les groupes secondaires (3) ne sont montés
  // que DÉPLIÉS : c'est ce qui borne la hauteur repliée du bandeau à 96 px sans rien rendre
  // inatteignable (tout est à un clic, et le bouton porte le compte des filtres secondaires actifs).
  const secondaryActiveCount = activeCount - countPrimaryActive(selection);
  return (
    <div
      class="kycar-filter-band"
      data-active-count={activeCount}
      data-regime={regime}
      data-expanded={panelOpen ? 'true' : 'false'}
    >
      <div class="kycar-band-primary-row">
        <PrimaryLine
          mode={props.mode}
          selection={selection}
          facetCounts={props.facetCounts}
          facetCountsPending={props.facetCountsPending}
          onChange={handleChange}
          onOpenScreenG={() => setScreenGOpen(true)}
          screenGSummary={screenGSummary}
        />
        <button
          type="button"
          class="kycar-band-more"
          aria-expanded={panelOpen}
          aria-controls="kycar-band-panel"
          onClick={() => setPanelOpen((v) => !v)}
        >
          {panelOpen ? 'Moins de filtres' : 'Plus de filtres'}
          {secondaryActiveCount > 0 ? ` (${secondaryActiveCount})` : ''}
        </button>
      </div>
      {panelOpen ? (
        <div class="kycar-band-panel" id="kycar-band-panel">
          {searchAndGroups(selection, handleChange, handleRemove, false)}
        </div>
      ) : null}
      <ActiveFilterTokens
        onRemovePartial={handleRemovePartial}
        onNarrow={handleNarrow}
        selection={selection}
        referenceData={props.referenceData}
        snapshotDate={props.snapshotDate}
        snapshotTaxonomy={props.snapshotTaxonomy}
        resultCount={props.resultCount}
        resultCountLoading={props.resultCountLoading}
        onRemove={handleRemove}
        onClearAll={handleClearAll}
        onSaveSearch={props.onSaveSearch !== undefined ? handleOpenSaveSearch : undefined}
      />
      {cascadeNoticeNode}
      {saveSearchFormNode}
      {screenGNode}
    </div>
  );
}
