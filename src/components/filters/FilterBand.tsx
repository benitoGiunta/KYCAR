/**
 * KYCAR — Bandeau de filtres, point de montage public du lot D5 (finition), refondu par `D3-46`
 * =================================================================================================
 * Composant Preact MONTABLE isolément (`docs/plans/ARCHITECTURE.md` §7.1 D5). Depuis la décision
 * `D3-46` (v0.1.1, retour de test du commanditaire, `reports/data/DATA-LEAD-DECISIONS.md`), il se
 * compose ainsi :
 *
 *   (a) une BARRE CONDENSÉE, seule région collante de la page (`.kycar-band-bar`, `top: 0`) : les
 *       trois filtres toujours visibles (Marque et modèle → écran G, Prix, Kilométrage), le bouton
 *       « Tous les filtres (n) », puis, à droite, l'effectif appliqué — ou « Annuler » /
 *       « Appliquer » dès que le brouillon diffère de la sélection appliquée. En régime compact, la
 *       barre ne porte que le résumé « Filtres (n) » et l'effectif (ou Annuler / Appliquer).
 *       Aucun défilement horizontal : la barre se condense, elle ne défile jamais.
 *   (b) le PANNEAU « Tous les filtres », ouvert sous la barre en SURIMPRESSION (aucun décalage de
 *       mise en page), borné à 70 % du viewport avec défilement vertical interne et pied fixe
 *       (Fermer, Annuler, Appliquer) : la recherche de filtre en tête, puis une carte par groupe en
 *       grille sur toute la largeur (`FilterCards.tsx`). En compact, la feuille plein écran
 *       d'`EX-SCR-97` porte les mêmes cartes en une colonne.
 *   (c) un BROUILLON (`src/state/draft.ts`) : toute modification d'un contrôle (saisie, case,
 *       palier, liste, écran G en mode 1) écrit dans le brouillon ; rien n'est appliqué avant
 *       « Appliquer » ou Entrée dans un champ texte/nombre. L'application fait UNE navigation
 *       (`InteractionController.applyDraft`, une entrée d'historique, scission `T`/`R`), avec le
 *       plafond d'URL `EX-NAV-11` éprouvé à ce moment. Retirer un jeton, « Tout effacer » et
 *       « Annuler » d'une notification de cascade restent IMMÉDIATS (actions explicites).
 *   (d) la ligne des filtres actifs, NON collante, sous la barre (elle défile avec la page).
 *
 * La sélection APPLIQUÉE n'est plus un état local : c'est `props.initialSelection`, lue de l'URL par
 * la coquille à chaque rendu. Le bandeau n'est donc plus remonté à chaque changement de requête (la
 * coquille ne le clé plus que sur le chemin) : l'état du panneau, son défilement, le focus et le
 * brouillon survivent à une application. Quand la sélection appliquée change sous un brouillon sale
 * (jeton retiré, amorce de l'écran A, retour arrière), les modifications en attente sont REPORTÉES
 * sur la nouvelle base (`rebaseDraft`).
 *
 * `./filter-band.css` importé en effet de bord (`E2E-21`).
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { observeBandHeight } from './sticky-offset';

import './filter-band.css';

import { FILTER_BY_ID, FILTER_DEFAULTS } from '../../state/filter-registry';
import type { MutableSelectionState, ScreenMode, SelectionState } from '../../state/filter-types';
import {
  cascadeRemoveOrphans,
  countDraftChanges,
  isDraftDirty,
  planDraftApply,
  rebaseDraft,
  withDraftValue,
  withoutDraftFilters,
} from '../../state/draft';
import { resolveDebounceMs } from '../../state/debounce-policy';
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
import { formatOfferCount } from '../../screens/market/format';
import { ActiveFilterTokens } from './ActiveFilterTokens';
import {
  ESSENTIALS_CARD_KEY,
  buildAlwaysVisibleControls,
  cardKeyOf,
  cascadeRemovalMessage,
  countActiveFilters,
  defaultExpandedGroups,
  draftApplyLabel,
  draftStatusMessage,
  isTypingTarget,
  type BandRegime,
} from './band-model';
import { FilterCards } from './FilterCards';
import { FilterSearch, FILTER_SEARCH_INPUT_ID } from './FilterSearch';
import { searchFilters } from './filter-search';
import { buildActiveFilterTokens, buildSearchDescription } from './labels';
import { PrimaryLine } from './PrimaryLine';
import { SaveSearchForm } from './SaveSearchForm';
import { ScreenG, type ScreenGReferenceData } from './ScreenG';
import type { FacetCounts, FilterChangeEvent, OnFilterChange } from './types';

export interface FilterBandProps {
  readonly mode: ScreenMode;
  /** Sélection APPLIQUÉE (celle de l'URL). Le bandeau la relit à chaque rendu (`D3-46`). */
  readonly initialSelection: SelectionState;
  /** Origine + chemin courants (sans requête), pour le calcul du plafond `EX-NAV-10/11`. */
  readonly originAndPath: string;
  readonly uiState?: UiState;
  readonly resultCount?: number;
  /** `EX-SCR-78` : `true` pendant `ET-CHARGE-MAJ` — le compteur affiche `resultCount` (la dernière
   * valeur connue) atténué et suivi de `…`, jamais `0` (`DR-139`, résidu). */
  readonly resultCountLoading?: boolean;
  /** `D8-05` (`EX-SCR-65`/`89`/`90`) : facettes du dernier recalcul, PAR FILTRE. */
  readonly facetCounts?: ReadonlyMap<string, FacetCounts>;
  readonly facetCountsPending?: boolean;
  /** `D8-05`/`FV-05` (`EX-SCR-216`) : effectifs de l'écran G, par marque puis par modèle. */
  readonly screenGMakeCounts?: ReadonlyMap<number, number>;
  readonly screenGModelCounts?: ReadonlyMap<string, number>;
  /** `EX-SCR-94` : appelé avec le NOM validé du formulaire — absent ⇒ bouton non rendu. */
  readonly onSaveSearch?: (name: string) => void;
  /** `D8-15` (`EX-SCR-96`/`97`) : régime visuel du bandeau, choisi par l'appelant — `large` par défaut. */
  readonly regime?: BandRegime;
  /** `D3-46` (c) — effectif PRÉVISIONNEL du brouillon, calculé par l'appelant après
   * `onDraftSelectionChange` (jamais une navigation). `undefined` tant qu'aucune réponse n'est
   * arrivée pour le brouillon courant ⇒ libellé « Appliquer (n modifications) ». */
  readonly projectedResultCount?: number;
  /** `D3-46` (c) — notifié (après le délai de calcul de la table `EX-SRCH`, `debounce-policy.ts`)
   * de chaque brouillon SALE à évaluer. En mode 2, la sélection transmise porte le couple de la
   * route (`withRouteTaxonomy`) : l'effectif prévisionnel est celui du périmètre affiché. */
  readonly onDraftSelectionChange?: (draft: SelectionState) => void;
  readonly referenceData?: ScreenGReferenceData;
  /** `EX-SCR-101` (`D8-31`) — date du snapshot SERVI, routée vers la zone (4). */
  readonly snapshotDate?: string | Date;
  readonly snapshotTaxonomy?: IneffectiveTaxonomy;
  /** `EX-SRCH-14` (`D8-31`) — couple marque/modèle porté par la ROUTE en mode 2 (`matchRoute`). */
  readonly routePair?: ModeCarryPair;
  /** `EX-SRCH-14`/`EX-NAV-15` — appelé quand le sélecteur désigne un MODÈLE depuis le mode 2. */
  readonly onSelectModel?: (pair: { readonly makeId: number; readonly modelId: number }) => void;
  readonly onHistoryReplace: (url: string) => void;
  readonly onHistoryPush: (url: string) => void;
  readonly onRecomputeLocal: () => void;
  readonly onReload: () => void;
  /** Notifié à chaque sélection effectivement appliquée — D8 y branche son état global. */
  readonly onSelectionApplied?: (selection: SelectionState) => void;
  /** `EX-NAV-11` : notifié quand une application est refusée pour dépassement du plafond. */
  readonly onUrlBudgetExceeded?: (message: string) => void;
}

/**
 * Résumé du contrôle `Marque / Modèle` (`EX-SCR-72`/`EX-SCR-103`). Exporté depuis `D8-35` pour être
 * sondable directement : `FilterBand` utilise des hooks et ne peut pas être monté sans DOM.
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

/** Forme canonique d'une sélection (clé de comparaison, jamais affichée). */
function selectionKey(selection: SelectionState): string {
  return serializeQuery(selection, {}, { filterDefaults: FILTER_DEFAULTS });
}

/** `D3-46` (c) — Entrée dans un champ texte/nombre de filtre applique le brouillon. */
function isEnterApplyTarget(target: EventTarget | null): boolean {
  const el = target as HTMLInputElement | null;
  if (el === null || el.tagName !== 'INPUT') return false;
  if (el.getAttribute('data-enter-apply') === 'off') return false;
  return el.type === 'number' || el.type === 'text';
}

interface DraftState {
  /** Clé canonique de la base (sélection appliquée d'où le brouillon est parti). */
  readonly baseKey: string;
  readonly base: SelectionState;
  readonly draft: SelectionState;
}

export function FilterBand(props: FilterBandProps) {
  const propsRef = useRef(props);
  propsRef.current = props;
  const regime: BandRegime = props.regime ?? 'large';
  const compact = regime === 'compact';

  /* ---- Sélection appliquée (URL) et brouillon ------------------------------------------------ */
  const selection = props.initialSelection; // APPLIQUÉE
  const appliedKey = useMemo(() => selectionKey(selection), [selection]);
  const draftRef = useRef<DraftState>({ baseKey: appliedKey, base: selection, draft: selection });
  if (draftRef.current.baseKey !== appliedKey) {
    // La sélection appliquée a changé sous le brouillon : report des modifications en attente.
    draftRef.current = {
      baseKey: appliedKey,
      base: selection,
      draft: rebaseDraft(draftRef.current.base, draftRef.current.draft, selection),
    };
  }
  const draftSelection = draftRef.current.draft;
  const [, setDraftTick] = useState(0);
  const dirty = isDraftDirty(selection, draftSelection);
  const changeCount = countDraftChanges(selection, draftSelection);
  const draftKey = selectionKey(draftSelection);

  /* ---- Effectif prévisionnel (calcul débouncé, jamais une navigation) ------------------------ */
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Clé du brouillon dont l'effectif a été demandé à l'appelant (`projectedResultCount`). */
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const cancelPreview = (): void => {
    if (previewTimerRef.current !== null) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = null;
  };
  const requestPreview = (draft: SelectionState, evt: FilterChangeEvent | null): void => {
    cancelPreview();
    const p = propsRef.current;
    if (p.onDraftSelectionChange === undefined) return;
    if (!isDraftDirty(p.initialSelection, draft)) return;
    const def = evt === null ? undefined : FILTER_BY_ID.get(evt.filterId);
    const ms =
      evt === null || def === undefined ? 0 : resolveDebounceMs(evt.filterId, evt.gesture, def.control, evt.valueLength);
    if (!Number.isFinite(ms)) return; // `EX-SRCH-6` : sous le seuil de caractères, aucun calcul.
    const fire = (): void => {
      previewTimerRef.current = null;
      const latest = propsRef.current;
      setPreviewKey(selectionKey(draft));
      latest.onDraftSelectionChange?.(withRouteTaxonomy(draft, latest.mode, latest.routePair));
    };
    if (ms <= 0) fire();
    else previewTimerRef.current = setTimeout(fire, ms);
  };
  useEffect(() => cancelPreview, []);
  const projectedCount = dirty && previewKey === draftKey ? props.projectedResultCount : undefined;

  const setDraft = (next: SelectionState, evt: FilterChangeEvent | null): void => {
    draftRef.current = { ...draftRef.current, draft: next };
    setDraftTick((t) => t + 1);
    requestPreview(next, evt);
  };

  /* ---- Interface ----------------------------------------------------------------------------- */
  const [expandedCards, setExpandedCards] = useState<ReadonlySet<string>>(
    () => new Set([ESSENTIALS_CARD_KEY, ...defaultExpandedGroups(props.initialSelection)]),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [screenGOpen, setScreenGOpen] = useState(false);
  /** `D3-46` (b) — panneau « Tous les filtres » : fermé par défaut, n'ajoute aucun paramètre d'URL. */
  const [panelOpen, setPanelOpen] = useState(false);
  const [compactSheetOpen, setCompactSheetOpen] = useState(false);
  // `EX-SCR-73` : notification du retrait en cascade (« <n> filtres retirés », `Annuler`), 5 s.
  const [cascadeNotice, setCascadeNotice] = useState<{ message: string; snapshot: SelectionState } | null>(null);
  const cascadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // `EX-SCR-94` (`D8-14`) : `null` = formulaire fermé, sinon le nom en cours d'édition.
  const [saveSearchDraft, setSaveSearchDraft] = useState<string | null>(null);
  /** Bouton « Tous les filtres » / « Filtres (n) » : cible du focus à la fermeture (`EX-NFR-14`). */
  const moreRef = useRef<HTMLButtonElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  /** Élément qui a ouvert l'écran G : le focus y revient à sa fermeture (`E2E-14`). */
  const screenGOpenerRef = useRef<HTMLElement | null>(null);

  // `D3-46` (d) — publie la hauteur de la barre collante (`--kycar-band-height`) pour le
  // `scroll-padding-top` du document : un `scrollIntoView` n'amène jamais le contenu SOUS la barre.
  useEffect(() => observeBandHeight(barRef.current), []);

  const controllerRef = useRef<InteractionController | null>(null);
  if (controllerRef.current === null) {
    // Rappels lus sur les props COURANTES : le bandeau n'est plus remonté à chaque requête.
    controllerRef.current = new InteractionController({
      replaceState: (url) => propsRef.current.onHistoryReplace(url),
      pushState: (url) => propsRef.current.onHistoryPush(url),
      recomputeLocal: () => propsRef.current.onRecomputeLocal(),
      reload: () => propsRef.current.onReload(),
    });
  }
  useEffect(() => {
    const controller = controllerRef.current;
    return () => controller?.dispose();
  }, []);

  useEffect(() => {
    return () => {
      if (cascadeTimerRef.current !== null) clearTimeout(cascadeTimerRef.current);
    };
  }, []);

  // `EX-SCR-81` : raccourci `/` → focus du champ de recherche de filtre, SAUF si le focus est déjà
  // dans un champ de saisie (`isTypingTarget`). Depuis `D3-46`, le champ vit dans le panneau : le
  // raccourci l'ouvre d'abord (la feuille en compact), puis y place le focus.
  const [focusSearchPending, setFocusSearchPending] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== '/') return;
      const active = document.activeElement as HTMLElement | null;
      if (isTypingTarget(active?.tagName, active?.isContentEditable === true)) return;
      e.preventDefault();
      if (propsRef.current.regime === 'compact') setCompactSheetOpen(true);
      else setPanelOpen(true);
      setFocusSearchPending(true);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  useEffect(() => {
    if (!focusSearchPending) return;
    const input = document.getElementById(FILTER_SEARCH_INPUT_ID);
    if (input !== null) {
      input.focus();
      setFocusSearchPending(false);
    }
  });

  /* ---- Actions immédiates (jetons, tout effacer, cascade) ------------------------------------ */
  const notifyCascadeRemoval = (removedIds: readonly string[], before: SelectionState): void => {
    const message = cascadeRemovalMessage(removedIds);
    if (message === null) return;
    if (cascadeTimerRef.current !== null) clearTimeout(cascadeTimerRef.current);
    setCascadeNotice({ message, snapshot: before });
    cascadeTimerRef.current = setTimeout(() => setCascadeNotice(null), 5_000);
  };

  /** `EX-NAV-14` : pousse une sélection sur un chemin DONNÉ (le chemin courant par défaut). Le
   * paramètre `path` sert la redirection d'`EX-SRCH-14`, seule situation où le bandeau change de
   * route ; l'état d'interface est alors volontairement VIDÉ. */
  const forcePushSelectionTo = (
    next: MutableSelectionState,
    path: string = props.originAndPath,
    uiState: UiState = props.uiState ?? {},
  ): void => {
    props.onSelectionApplied?.(next);
    const query = serializeQuery(next, uiState, { filterDefaults: FILTER_DEFAULTS });
    controllerRef.current?.forcePush(assembleUrl(path, query).url);
  };
  const forcePushSelection = (next: MutableSelectionState): void => forcePushSelectionTo(next);

  /** Une action immédiate sur un filtre abandonne toute modification EN ATTENTE sur ce filtre. */
  const dropPendingOn = (filterIds: readonly string[]): void => {
    const { base, draft } = draftRef.current;
    const next: MutableSelectionState = { ...draft };
    for (const id of filterIds) {
      const v = base[id];
      if (v === undefined) delete next[id];
      else next[id] = v;
    }
    draftRef.current = { ...draftRef.current, draft: next };
  };

  const handleRemove = (filterIds: readonly string[]): void => {
    const before = selection;
    const next: MutableSelectionState = { ...before };
    for (const id of filterIds) delete next[id];
    const cascaded = cascadeRemoveOrphans(next); // DR-059 : les enfants orphelins partent avec leur parent
    notifyCascadeRemoval(cascaded, before);
    dropPendingOn([...filterIds, ...cascaded]);
    forcePushSelection(next);
  };

  /** Retrait UNITAIRE d'une valeur d'un filtre d'énumération multi-valeurs (`EX-SCR-76`, `DR-062`). */
  const handleRemovePartial = (filterId: string, removesCodes: readonly string[]): void => {
    const before = selection;
    const current = before[filterId];
    if (current === undefined) return;
    const codes = (Array.isArray(current) ? current : [current]).map(String);
    const remaining = codes.filter((c) => !removesCodes.includes(c));
    const next: MutableSelectionState = { ...before };
    if (remaining.length === 0) delete next[filterId];
    else next[filterId] = remaining;
    const cascaded = cascadeRemoveOrphans(next);
    notifyCascadeRemoval(cascaded, before);
    dropPendingOn([filterId, ...cascaded]);
    forcePushSelection(next);
  };

  /** `D8-04d` : retrait du jeton « modèle » de `mmmv` — REMPLACE la valeur par la marque seule. */
  const handleNarrow = (filterId: string, value: SelectionState[string]): void => {
    const before = selection;
    const next: MutableSelectionState = { ...before, [filterId]: value };
    const cascaded = cascadeRemoveOrphans(next);
    notifyCascadeRemoval(cascaded, before);
    dropPendingOn([filterId, ...cascaded]);
    forcePushSelection(next);
  };

  /** « Tout effacer » : immédiat, et il vide AUSSI le brouillon (l'utilisateur repart de zéro). */
  const handleClearAll = (): void => {
    cancelPreview();
    draftRef.current = { baseKey: selectionKey({}), base: {}, draft: {} };
    setDraftTick((t) => t + 1);
    forcePushSelection({});
  };

  const handleUndoCascade = (): void => {
    if (cascadeNotice === null) return;
    if (cascadeTimerRef.current !== null) clearTimeout(cascadeTimerRef.current);
    setCascadeNotice(null);
    forcePushSelection({ ...cascadeNotice.snapshot });
  };

  /* ---- Brouillon : modifications, annulation, application ------------------------------------ */
  const handleDraftChange: OnFilterChange = (evt) => {
    if (FILTER_BY_ID.get(evt.filterId) === undefined) return;
    setDraft(withDraftValue(draftRef.current.draft, evt.filterId, evt.value), evt);
  };

  const handleResetCard = (filterIds: readonly string[]): void => {
    setDraft(withoutDraftFilters(draftRef.current.draft, filterIds), null);
  };

  /** Le focus est-il sur un bouton de la barre qui disparaît quand le brouillon redevient propre ? */
  const focusOnVanishingControl = (): boolean => {
    const active = typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
    return active !== null && active.closest('.kycar-band-bar__draft') !== null;
  };

  /** « Annuler » : le brouillon redevient la sélection appliquée, sans navigation. */
  const handleCancelDraft = (): void => {
    const refocus = focusOnVanishingControl();
    cancelPreview();
    draftRef.current = { baseKey: appliedKey, base: selection, draft: selection };
    setDraftTick((t) => t + 1);
    if (refocus) moreRef.current?.focus();
  };

  /** « Appliquer » / Entrée : UNE navigation, plafond d'URL éprouvé, scission T/R du lot. */
  const handleApplyDraft = (): void => {
    const p = propsRef.current;
    const next: MutableSelectionState = { ...draftRef.current.draft };
    cascadeRemoveOrphans(next);
    if (!isDraftDirty(p.initialSelection, next)) return;
    // `EX-NAV-11` : REFUS avec son message, jamais de troncature ; le brouillon est conservé pour
    // que l'utilisateur retire un filtre plutôt que de tout perdre.
    if (wouldExceedBudget(p.originAndPath, next, p.uiState ?? {}, { filterDefaults: FILTER_DEFAULTS })) {
      p.onUrlBudgetExceeded?.(URL_BUDGET_EXCEEDED_MESSAGE);
      return;
    }
    const refocus = focusOnVanishingControl();
    cancelPreview();
    const plan = planDraftApply(p.initialSelection, next, p.mode);
    draftRef.current = { baseKey: selectionKey(next), base: next, draft: next };
    setDraftTick((t) => t + 1);
    p.onSelectionApplied?.(next);
    const query = serializeQuery(next, p.uiState ?? {}, { filterDefaults: FILTER_DEFAULTS });
    controllerRef.current?.applyDraft(assembleUrl(p.originAndPath, query).url, plan.classes);
    if (p.regime === 'compact' && compactSheetOpen) {
      setCompactSheetOpen(false);
      moreRef.current?.focus();
    } else if (refocus) {
      moreRef.current?.focus();
    }
  };

  const handleEnterKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Enter' || e.defaultPrevented) return;
    if (!isEnterApplyTarget(e.target)) return;
    e.preventDefault();
    handleApplyDraft();
  };

  /**
   * `EX-SRCH-14` (`D8-31`) — application du sélecteur marque/modèle (écran G). En mode 2, un choix
   * qui CHANGE DE ROUTE (autre marque ⇒ retour à l'écran A, autre modèle ⇒ son écran B) reste une
   * navigation immédiate : c'est un changement d'écran (`EX-SRCH-8`, `EX-NAV-14`) validé par le
   * bouton « Appliquer » de l'écran G lui-même ; la redirection emporte le brouillon courant. Partout
   * ailleurs (`D3-46` (c)), le choix est écrit dans le BROUILLON comme toute autre modification.
   * Décision prise par `resolveMakeChange` (`src/state/navigation.ts`, source de vérité unique).
   */
  const handleScreenGApply = (mmmv: string): void => {
    closeScreenG();
    const chosen = parseMmmvBlock(mmmv);
    if (chosen !== null && props.mode === 'mode2' && props.routePair !== undefined) {
      const outcome = resolveMakeChange({
        mode: 'mode2',
        selection: draftRef.current.draft,
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
    handleDraftChange({ filterId: 'makesModelsVariants', value: mmmv, gesture: 'selection-immediate' });
  };

  function openScreenG(): void {
    screenGOpenerRef.current = typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
    setScreenGOpen(true);
  }
  function closeScreenG(): void {
    setScreenGOpen(false);
    const opener = screenGOpenerRef.current;
    screenGOpenerRef.current = null;
    if (opener !== null && opener.isConnected) opener.focus();
  }

  /* ---- Panneau / feuille --------------------------------------------------------------------- */
  const closePanel = (): void => {
    setPanelOpen(false);
    moreRef.current?.focus();
  };
  const closeSheet = (): void => {
    setCompactSheetOpen(false);
    moreRef.current?.focus();
  };
  const handlePanelKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && !e.defaultPrevented) {
      e.preventDefault();
      if (compact) closeSheet();
      else closePanel();
      return;
    }
    handleEnterKey(e);
  };

  const handleOpenSaveSearch = (): void => {
    const tokens = buildActiveFilterTokens(selection, props.referenceData);
    setSaveSearchDraft(buildSearchDescription(tokens));
  };
  const handleConfirmSaveSearch = (name: string): void => {
    props.onSaveSearch?.(name);
    setSaveSearchDraft(null);
  };

  // `DR-135` (`EX-SCR-91`) : même règle de décompte partout (`countActiveFilters`).
  const activeCount = useMemo(() => countActiveFilters(selection), [selection]);

  // `EX-SCR-103` (`D8-35`) : sur l'écran B le couple courant n'est PAS dans la sélection — la route
  // l'a absorbé (`EX-NAV-15`). Le contrôle `Marque / Modèle` et l'écran `G` le lisent sur
  // `routePair`, réinjecté POUR L'AFFICHAGE. Depuis `D3-46`, sur le BROUILLON : le résumé montre le
  // choix en attente d'application (identique à l'appliqué quand le brouillon est propre).
  const taxonomySelection = withRouteTaxonomy(draftSelection, props.mode, props.routePair);
  const screenGSummary = mmmvSummary(taxonomySelection, props.referenceData);

  const toggleCard = (key: string): void =>
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** Détail du bouton « Appliquer » : effectif prévisionnel, sinon nombre de modifications. */
  const applyLabelDetail = draftApplyLabel(projectedCount, dirty ? changeCount : 0).slice('Appliquer'.length);

  /** Bouton « Appliquer » : libellé visible « Appliquer » + détail, masqué visuellement là où la
   * largeur manque mais toujours dans le nom accessible. `aria-disabled` plutôt que `disabled` : le
   * bouton garde le focus après usage (`D3-46` : aucune application ne perd le focus). */
  const applyButton = (inBar = false) => (
    <button
      type="button"
      class="kycar-band-apply"
      aria-disabled={dirty ? undefined : 'true'}
      onClick={handleApplyDraft}
    >
      {inBar ? (
        <>
          <span class="kycar-band-apply__main">Appliquer</span>
          {applyLabelDetail.length > 0 ? <span class="kycar-band-apply__detail">{applyLabelDetail}</span> : null}
        </>
      ) : (
        `Appliquer${applyLabelDetail}`
      )}
    </button>
  );
  const cancelButton = () => (
    <button
      type="button"
      class="kycar-band-cancel"
      aria-disabled={dirty ? undefined : 'true'}
      onClick={() => {
        if (dirty) handleCancelDraft();
      }}
    >
      Annuler
    </button>
  );

  /** Extrémité droite de la barre : effectif appliqué, ou Annuler / Appliquer si le brouillon est sale. */
  const barEnd = dirty ? (
    <div class="kycar-band-bar__draft">
      {cancelButton()}
      {applyButton(true)}
    </div>
  ) : props.resultCount !== undefined ? (
    <span class="kycar-band-bar__count">
      {props.resultCountLoading === true ? (
        <span class="kycar-band-bar__count--dim">{formatOfferCount(props.resultCount)}…</span>
      ) : (
        formatOfferCount(props.resultCount)
      )}
    </span>
  ) : null;

  const cards = (
    <>
      <div class="kycar-band-panel__head">
        <FilterSearch
          query={searchQuery}
          onQueryChange={(q) => {
            setSearchQuery(q);
            // `EX-SCR-79` : déplie les cartes des filtres trouvés (« Essentiels » pour un primaire).
            const toExpand = searchFilters(q).matches.map(cardKeyOf);
            if (toExpand.length > 0) setExpandedCards((prev) => new Set([...prev, ...toExpand]));
          }}
        />
      </div>
      <FilterCards
        mode={props.mode}
        regime={regime}
        selection={draftSelection}
        expandedCards={expandedCards}
        facetCounts={props.facetCounts}
        facetCountsPending={props.facetCountsPending}
        onToggleCard={toggleCard}
        onChange={handleDraftChange}
        onResetCard={handleResetCard}
        onOpenScreenG={openScreenG}
        screenGSummary={screenGSummary}
      />
    </>
  );

  // `D3-46` (c) — annonce polie de l'état du brouillon et de l'effectif prévisionnel.
  const draftStatus = (
    <div class="kycar-band-draft-status" role="status" aria-live="polite">
      {draftStatusMessage(dirty ? changeCount : 0, projectedCount)}
    </div>
  );

  const cascadeNoticeNode =
    cascadeNotice !== null ? (
      <div class="kycar-cascade-notice" role="status" aria-live="polite">
        <span>{cascadeNotice.message}</span>
        <button type="button" onClick={handleUndoCascade}>
          Annuler
        </button>
      </div>
    ) : null;

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
      onCancel={closeScreenG}
      onApply={handleScreenGApply}
    />
  ) : null;

  const tokensNode = (
    <ActiveFilterTokens
      onRemovePartial={handleRemovePartial}
      onNarrow={handleNarrow}
      selection={selection}
      referenceData={props.referenceData}
      snapshotDate={props.snapshotDate}
      snapshotTaxonomy={props.snapshotTaxonomy}
      onRemove={handleRemove}
      onClearAll={handleClearAll}
      onSaveSearch={props.onSaveSearch !== undefined ? handleOpenSaveSearch : undefined}
    />
  );

  if (compact) {
    // `EX-SCR-97` `[amendée 3.6 — D3-46]` : barre unique de 56 px (résumé « Filtres (n) » + effectif,
    // ou Annuler / Appliquer), feuille plein écran à une colonne de cartes, pied fixe.
    return (
      <div
        class="kycar-filter-band kycar-filter-band--compact"
        data-active-count={activeCount}
        data-regime={regime}
        data-dirty={dirty ? 'true' : 'false'}
      >
        <div class="kycar-band-bar kycar-compact-bar" ref={barRef}>
          <button
            type="button"
            class="kycar-compact-bar__open"
            ref={moreRef}
            aria-haspopup="dialog"
            aria-expanded={compactSheetOpen}
            onClick={() => setCompactSheetOpen(true)}
          >
            Filtres{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          {barEnd}
        </div>
        {draftStatus}
        {tokensNode}
        {cascadeNoticeNode}
        {saveSearchFormNode}
        {compactSheetOpen ? (
          <div class="kycar-compact-sheet" role="dialog" aria-modal="true" aria-label="Filtres" onKeyDown={handlePanelKeyDown}>
            <header>
              <h2>Filtres</h2>
              {/* `EX-SCR-97` : « Réinitialiser » vide le BROUILLON (rien n'est appliqué avant
                  « Appliquer ») ; « Fermer » referme sans appliquer et CONSERVE le brouillon. */}
              <button type="button" class="kycar-compact-sheet__reset" onClick={() => setDraft({}, null)}>
                Réinitialiser
              </button>
              <button type="button" class="kycar-compact-sheet__close" onClick={closeSheet}>
                Fermer
              </button>
            </header>
            <div class="kycar-compact-sheet__body">{cards}</div>
            <footer class="kycar-compact-sheet__footer">
              {cancelButton()}
              {applyButton()}
            </footer>
          </div>
        ) : null}
        {screenGNode}
      </div>
    );
  }

  return (
    <div
      class="kycar-filter-band"
      data-active-count={activeCount}
      data-regime={regime}
      data-expanded={panelOpen ? 'true' : 'false'}
      data-dirty={dirty ? 'true' : 'false'}
    >
      <div class="kycar-band-bar" ref={barRef} onKeyDown={handleEnterKey}>
        <div class="kycar-band-bar__row">
          <PrimaryLine
            mode={props.mode}
            selection={draftSelection}
            controls={buildAlwaysVisibleControls()}
            label="Filtres toujours visibles"
            condensed
            facetCounts={props.facetCounts}
            facetCountsPending={props.facetCountsPending}
            onChange={handleDraftChange}
            onOpenScreenG={openScreenG}
            screenGSummary={screenGSummary}
          />
          <button
            type="button"
            class="kycar-band-more"
            ref={moreRef}
            aria-expanded={panelOpen}
            aria-controls="kycar-band-panel"
            onClick={() => (panelOpen ? closePanel() : setPanelOpen(true))}
          >
            {/* Intermédiaire : « Filtres (n) » à l'écran, nom accessible « Tous les filtres (n) ». */}
            <span class="kycar-band-more__long">Tous les filtres</span>
            <span class="kycar-band-more__short" aria-hidden="true">
              Filtres
            </span>
            {activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          {barEnd}
        </div>
        {panelOpen ? (
          <section
            class="kycar-band-panel"
            id="kycar-band-panel"
            role="region"
            aria-label="Tous les filtres"
            onKeyDown={handlePanelKeyDown}
          >
            <div class="kycar-band-panel__body">{cards}</div>
            <footer class="kycar-band-panel__footer">
              <button type="button" class="kycar-band-panel__close" onClick={closePanel}>
                Fermer
              </button>
              {cancelButton()}
              {applyButton()}
            </footer>
          </section>
        ) : null}
      </div>
      {draftStatus}
      {tokensNode}
      {cascadeNoticeNode}
      {saveSearchFormNode}
      {screenGNode}
    </div>
  );
}
