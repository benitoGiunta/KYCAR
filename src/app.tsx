/**
 * KYCAR — Coquille S0 : routage global, montage des écrans, orchestration UI (lot D8)
 * =================================================================================================
 * Composant racine. Le RENDU est une fonction pure du chemin+requête (EX-NAV-18) : toute la
 * navigation passe par l'URL (`history.pushState`/`popstate`), et l'état d'écran en est dérivé.
 * La coquille est l'HÔTE qui possède le `DataController` (provider → moteur), les banques de
 * persistance, et l'état de session (sélection de comparaison, écran G). Les écrans A/B/C/D/E/F et la
 * page /mentions ne possèdent rien : ils reçoivent des données déjà résolues et remontent des
 * intentions par callbacks. Injection de dépendances (`AppProps`) pour la testabilité.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';

import type { DataController, Mode2Payload, StartResult } from './orchestration/data-controller';
import type { ReferenceData } from './types/reference';
import type { ModelAggregate } from './providers/DataProvider';
import type { SelectionState } from './state/filter-types';
import { assembleUrl, serializeQuery } from './state/url-codec';
import { loadQuery, type Correction } from './state/corrections';
import { serializeSelection } from './types/selection';
import { FILTER_DEFAULTS } from './state/filter-registry';
import { buildPath, carryFiltersAcrossMode, resolveTaxonomyRoute, type TaxonomyRouteResult } from './state/router';
import { FilterBand } from './components/filters/FilterBand';
import { buildActiveFilterTokens, buildSearchDescription } from './components/filters/labels';
import type { FacetCounts } from './components/filters/types';
import { countActiveFilters, type BandRegime } from './components/filters/band-model';
import {
  deriveScreenAState,
  type LoadPhase,
  type RestrictiveFilterHint,
  type ScreenALoadedData,
} from './screens/market/state';
import { MarketScreen, type MarketRegime, type PrimerShortcutId } from './screens/market/MarketScreen';
import type { AggregateCsvMeta } from './screens/market/csv';
import { GRID_LOAD_BATCH_SIZE } from './screens/market/thresholds';
import type { MakeSortField, SortDirection } from './screens/market/sort';
import {
  DistributionScreen,
  EMPTY_UI_STATE,
  historyModeFor,
  readDistributionUiStateFromQuery,
  writeDistributionUiState,
  type DistributionUiState,
} from './screens/distribution/index';
import { ListingsScreen, readListingString, STRING_FIELD } from './screens/listings/index';
import type { CsvMeta } from './screens/listings/index';
import {
  CompareScreen,
  addToCompare,
  removeFromCompare,
  parseCompareParam,
  MAX_COMPARE,
  type CompareModelKey,
  type CompareModelRow,
  type CompareRedirectTarget,
} from './screens/compare/index';
import { SavedSearchesScreen } from './screens/saved/index';
import { FollowedScreen } from './screens/followed/index';
import { MentionsPage } from './screens/mentions/index';
import type { SelectionInput } from './types/index';
import type { VocabularyName } from './types/vocabularies';
import { MEDIA_QUERY_MOBILE, MEDIA_QUERY_TABLET } from './styles/breakpoints';
import { resolveView, routeOfView, currentLocation, type AppView } from './app/navigation';
import { removalPatchFor, topRestrictiveFilters } from './app/restrictive-filters';
import { CapExceededError } from './persistence/index';
import { modelKey } from './types/reference';
import type {
  SavedSearchStore,
  FollowedModelStore,
  RecentHistoryStore,
  PreferencesStore,
} from './persistence/index';
import './app/app.css';

/** Banques de persistance injectées (localStorage + IndexedDB en prod, mémoire en test). */
export interface AppStores {
  readonly saved: SavedSearchStore;
  readonly followed: FollowedModelStore;
  readonly recent: RecentHistoryStore;
  readonly preferences: PreferencesStore;
}

export interface AppProps {
  readonly controller: DataController;
  readonly referenceData: ReferenceData;
  readonly stores: AppStores;
}

const PRIMER_SELECTIONS: Readonly<Record<PrimerShortcutId, SelectionState>> = {
  'budget-10000': { priceTo: 10000 },
  'budget-20000': { priceTo: 20000 },
  'mileage-100000': { mileageTo: 100000 },
  'registration-2020': { dateOfRegistrationFrom: 2020 },
};

/**
 * `EX-DATA-107` (`DR-094`, `D-24`) — le câblage par défaut sert des données SYNTHÉTIQUES : la
 * coquille le dit sur TOUS les écrans de marché (A/B/D), depuis `describe()`/`StartResult`, pas
 * seulement dans `/mentions` et l'en-tête CSV.
 */
const SYNTHETIC_NOTICE =
  'Données synthétiques de démonstration — chiffres générés, sans valeur de marché réelle.';

/** `EX-NFR-14` (DR-101) — titre de document par vue (annoncé au changement de route). */
const VIEW_TITLES: Readonly<Record<AppView['kind'], string>> = {
  market: 'Survol du marché',
  modelDistribution: 'Distribution d’un modèle',
  modelListings: 'Annonces du modèle',
  compare: 'Comparer des modèles',
  savedSearches: 'Recherches enregistrées',
  followed: 'Modèles suivis',
  mentions: 'Mentions légales',
  notFound: 'Page introuvable',
};

/**
 * `D8-02` / `EX-NFR-9` — délai minimal avant le chargement des agrégats MODÈLE de portée marché.
 * Il ne s'agit pas d'un confort : ce chargement est un SECOND balayage du jeu servi, et le lancer
 * dans la foulée du rendu le fait concourir avec la peinture des cartes — c'est-à-dire avec le
 * « premier affichage utile » que l'exigence borne à 2 000 ms.
 */
const MODEL_AGGREGATES_DELAY_MS = 400;

/** `EX-DATA-110bis` (`D8-05`) — les facettes sont DIFFÉRÉES : au plus 100 ms après le recalcul. */
const FACET_DEFER_MS = 100;

/** `EX-SCR-38` — au plus DEUX bandeaux d'état simultanés ; les suivants derrière un jeton `+k`. */
const BANNER_STACK_MAX = 2;

/** Identifiants de filtre de classe `T` taxonomique (absorbés par la route en mode 2). */
const TAXONOMY_FILTER_IDS: readonly string[] = ['make', 'model', 'makesModelsVariants', 'category', 'modelCategory'];

/** `EX-SCR-46` — sélection PRIVÉE de sa composante taxonomique (premier nombre du double compteur). */
function withoutTaxonomy(selection: SelectionState): SelectionState {
  const next: Record<string, unknown> = { ...selection };
  for (const id of TAXONOMY_FILTER_IDS) delete next[id];
  return next as SelectionState;
}

/** `EX-SCR-43` — âges du jeton de snapshot (vert < 7 j, ambre < 30 j, rouge au-delà). */
const SNAPSHOT_FRESH_DAYS = 7;
const SNAPSHOT_STALE_DAYS = 30;

/**
 * `EX-SCR-38` — un bandeau d'état de la COQUILLE. `retry` ajoute l'action « Réessayer »
 * (`EX-NFR-22`) ; `dismissible` suit la table de repliabilité normative bandeau par bandeau.
 */
interface ShellBanner {
  readonly id: string;
  readonly className: string;
  readonly text: string;
  readonly dismissible: boolean;
  readonly retry?: boolean;
}

interface Mode2State {
  readonly key: string;
  readonly status: 'loading' | 'ready' | 'error';
  readonly payload?: Mode2Payload;
  readonly errorCode?: string;
}

export function App(props: AppProps): JSX.Element {
  const { controller, referenceData, stores } = props;

  // ---- Localisation (source de vérité du rendu, EX-NAV-18) -------------------------------------
  const [location, setLocation] = useState(currentLocation);
  const view = useMemo<AppView>(() => resolveView(location.pathname), [location.pathname]);

  const navigate = useCallback((url: string, mode: 'push' | 'replace' = 'push'): void => {
    if (typeof window !== 'undefined' && window.history) {
      if (mode === 'replace') window.history.replaceState({}, '', url);
      else window.history.pushState({}, '', url);
    }
    const qIndex = url.indexOf('?');
    const pathname = qIndex === -1 ? url : url.slice(0, qIndex);
    const search = qIndex === -1 ? '' : url.slice(qIndex);
    setLocation({ pathname, search });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onPop = (): void => setLocation(currentLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ---- Sélection de filtres dérivée de l'URL (deep-link, EX-NAV-21 corrections) -----------------
  /**
   * `D8-03` / `FV-03` / `E2E-26` — la requête reçue est lue UNE fois et **entièrement** : la
   * coquille consommait `.selection` et jetait `.corrections`, si bien qu'une URL fautive était
   * corrigée en mémoire mais ni réécrite ni signalée (« aucune correction silencieuse »,
   * REQUIREMENTS §8). `parsedQuery` porte les trois composantes ; l'effet plus bas canonise l'URL
   * (`replaceState`) et publie le bandeau `ET-URL-CORRIGEE` (`EX-SCR-38bis`).
   */
  const parsedQuery = useMemo(() => loadQuery(location.search), [location.search]);
  const selection = parsedQuery.selection as SelectionState;
  const uiStateFromUrl = parsedQuery.uiState;
  const currentQuery = useMemo(
    () => serializeQuery(selection, {}, { filterDefaults: FILTER_DEFAULTS }),
    [selection],
  );
  /**
   * `FV-17` (`EX-SCR-123`) — état DÉPLIÉ des cartes-marques, encodé dans l'URL par `mk`
   * (`UI_STATE_PARAMS`, mode d'historique `replace`). Il était purement local : un partage d'URL ou
   * un retour arrière perdait l'état de dépliage.
   */
  const mkParam = useMemo<string>(() => {
    const raw = uiStateFromUrl['mk'];
    if (raw === undefined) return '';
    return (Array.isArray(raw) ? raw : [raw]).map(String).join(',');
  }, [uiStateFromUrl]);
  const expandedMakeIds = useMemo<ReadonlySet<number>>(
    () => new Set(mkParam.split(',').map(Number).filter((n) => Number.isFinite(n) && n > 0)),
    [mkParam],
  );
  /** État d'interface mode 1 à reconduire dans chaque écriture d'URL (`mk`, `EX-NAV-10bis`). */
  const mode1Ui = useMemo<Readonly<Record<string, string>>>(
    () => (mkParam === '' ? ({} as Record<string, string>) : { mk: mkParam }),
    [mkParam],
  );
  /** Mode d'écran courant (`EX-SCR-82`/`221`) : il gouverne la scission T/R et le transport de
   * filtres d'un mode à l'autre (`carryFiltersAcrossMode`). */
  const currentMode: 'mode1' | 'mode2' =
    view.kind === 'modelDistribution' || view.kind === 'modelListings' ? 'mode2' : 'mode1';

  // ---- Validation taxonomique et canonisation de la route (DR-099, EX-NAV-19/20, EX-SCR-140) ----
  const taxonomyRoute = useMemo<TaxonomyRouteResult | null>(() => {
    const route = routeOfView(view);
    return route === null ? null : resolveTaxonomyRoute(route, referenceData);
  }, [view, referenceData]);

  /**
   * `EX-SCR-140` (`DR-099`, `R-D8-15`/`R-D8-16`) — canonisation de la route par `replaceState` :
   *  - route héritée `/` (`EX-SCR-49`) → `/marche` ;
   *  - route héritée `/modele/:makeId/:modelId` (annexe C §A.1) et slug erroné → forme canonique
   *    calculée par `resolveTaxonomyRoute` (les identifiants font foi, le slug est cosmétique).
   * La requête (filtres + état d'interface) est conservée telle quelle : la canonisation ne change
   * jamais la sélection, seulement le chemin.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (view.kind === 'market' && location.pathname !== '/marche') {
      navigate(`/marche${location.search}`, 'replace');
      return;
    }
    if (taxonomyRoute === null || !taxonomyRoute.ok) return;
    const canonical = taxonomyRoute.route;
    const received = routeOfView(view);
    if (received === null) return;
    if (received.makeSlug !== canonical.makeSlug || received.modelSlug !== canonical.modelSlug) {
      navigate(`${buildPath(canonical)}${location.search}`, 'replace');
    }
  }, [view, taxonomyRoute, location.pathname, location.search, navigate]);

  /**
   * `EX-SCR-20`/`135` et `EX-NFR-19` (`DR-071`, `DR-072`, `DR-081`) — la coquille est le SEUL
   * propriétaire du viewport : elle détecte le régime responsive par `matchMedia`, le passe
   * explicitement aux écrans, et le met à jour à chaud (aucun remontage nécessaire).
   */
  const [regime, setRegime] = useState<MarketRegime>(() => detectRegime());
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const queries = [window.matchMedia(MEDIA_QUERY_MOBILE), window.matchMedia(MEDIA_QUERY_TABLET)];
    const onChange = (): void => setRegime(detectRegime());
    for (const q of queries) q.addEventListener('change', onChange);
    return () => {
      for (const q of queries) q.removeEventListener('change', onChange);
    };
  }, []);

  // ---- État d'interface de l'écran B/D lu par le codec canonique de D5 (D-11/D-12) --------------
  const ui = useMemo<DistributionUiState>(
    () => readDistributionUiStateFromQuery(location.search),
    [location.search],
  );

  // ---- Démarrage du contrôleur (acquisition du snapshot, EX-NFR-21/22) --------------------------
  const [start, setStart] = useState<StartResult | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  /**
   * `D8-03` / `FV-03` / `E2E-26` (`EX-NAV-21`/`22`, `EX-SCR-38bis`) — corrections d'URL PUBLIÉES.
   * Durée de vie normative : jusqu'au prochain changement de filtre par l'utilisateur (jamais avant),
   * et non restaurées par un retour arrière vers la même URL corrigée — d'où un état de session
   * séparé de `location`, remis à zéro par `applyMode1Query`/`applyFilters`/`FilterBand`.
   */
  const [urlCorrections, setUrlCorrections] = useState<readonly Correction[]>([]);
  /** Requête déjà canonisée (évite de rejouer `replaceState` en boucle sur la même URL). */
  const [correctedFrom, setCorrectedFrom] = useState<string | null>(null);

  /**
   * `D8-15` / `FV-19` (`ET-HORS-LIGNE`, `EX-SCR-37`) — état de connectivité réel du navigateur.
   * Aucun appel réseau : `navigator.onLine` plus les événements `online`/`offline` (E5 respectée).
   */
  const [offline, setOffline] = useState<boolean>(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const up = (): void => setOffline(false);
    const down = (): void => setOffline(true);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  /**
   * `FV-17` (`EX-SCR-126`) — l'amorce SANS-FILTRE est une AMORCE : elle ne doit pas revenir après
   * que l'utilisateur a posé puis effacé ses filtres (« Tout effacer » relançait l'écran d'accueil).
   * Drapeau de SESSION (jamais persistant : une nouvelle session revoit l'amorce).
   */
  const [primerDismissed, setPrimerDismissed] = useState<boolean>(() => readPrimerFlag());
  const dismissPrimer = useCallback((): void => {
    writePrimerFlag();
    setPrimerDismissed(true);
  }, []);
  useEffect(() => {
    if (currentQuery !== '') dismissPrimer();
  }, [currentQuery, dismissPrimer]);

  // ---- État CRUD (relu à chaque tick ; rafraîchi par l'événement storage inter-onglets) ---------
  const [crudTick, setCrudTick] = useState(0);
  const bumpCrud = useCallback((): void => setCrudTick((n) => n + 1), []);
  useEffect(() => {
    let live = true;
    void controller.start().then((r) => {
      if (live) setStart(r);
    });
    return () => {
      live = false;
    };
  }, [controller]);

  // ---- Mode 1 : chargement du marché ------------------------------------------------------------
  const [marketPhase, setMarketPhase] = useState<LoadPhase>({ phase: 'loading' });
  const [modelsByMake, setModelsByMake] = useState<ReadonlyMap<number, readonly ModelAggregate[] | 'unavailable'>>(new Map());

  const reloadMarket = useCallback(
    async (sel: SelectionState): Promise<void> => {
      setMarketPhase({ phase: 'loading' });
      setModelsByMake(new Map());
      try {
        const data = await controller.loadMarket(sel);
        setMarketPhase({ phase: 'loaded', data });
      } catch (e) {
        setMarketPhase({
          phase: 'error',
          errorCode: e instanceof Error ? e.message : String(e),
          attemptedAt: new Date().toISOString(),
          hasCachedResult: start?.hasCachedResult ?? false,
        });
      }
    },
    [controller, start],
  );

  useEffect(() => {
    if (start === null) return;
    if (view.kind === 'market') void reloadMarket(selection);
  }, [start, view.kind, currentQuery, reloadMarket, selection]);

  /**
   * `D8-02` / `FV-02` / `E2E-04`, `E2E-05` (BLOQUANT) — agrégats MODÈLE du marché filtré, chargés
   * APRÈS le marché et pour TOUTES les cartes rendues (un seul aller de portée marché).
   *
   * Sans eux, `modelAggregatesByMake` restait vide tant qu'aucune carte n'était dépliée : la barre
   * de synthèse annonçait « 0 modèles » sur une population qui en compte des centaines, et aucune
   * carte-marque ne rendait ses zones-modèles avant un clic (`EX-SCR-22` : 0 zone à 1 440 × 900).
   * L'appel est SÉPARÉ de `loadMarket` — le premier affichage utile (`EX-NFR-9`) reste servi par les
   * seuls agrégats de marque, les zones arrivent ensuite ; un échec laisse les cartes sans zones
   * (repli `EX-SCR-132`), jamais un cardinal inventé.
   */
  useEffect(() => {
    if (start === null || view.kind !== 'market') return undefined;
    if (marketPhase.phase !== 'loaded') return undefined;
    let live = true;
    const run = (): void => {
      if (!live) return;
      void controller
        .loadAllModels(selection)
        .then((byMake) => {
          if (!live || byMake.size === 0) return;
          setModelsByMake((prev) => {
            const next = new Map(prev);
            for (const [makeId, models] of byMake) if (!next.has(makeId)) next.set(makeId, models);
            return next;
          });
        })
        .catch(() => undefined);
    };
    // `EX-NFR-9` — l'agrégation par MODÈLE est un second balayage du jeu servi : lancée dans la
    // foulée du rendu, elle bloquait le thread principal AVANT la peinture des cartes et repoussait
    // le « premier affichage utile » de ~400 ms (mesuré : médiane 1 493 → 1 903 ms sur un budget de
    // 2 000 ms). Le premier affichage utile, au sens de l'exigence, est la grille de cartes-marques ;
    // les zones-modèles sont un enrichissement PROGRESSIF. Le travail est donc rendu à la boucle
    // d'inactivité (`requestIdleCallback`, repli minuté) : il ne dispute plus le thread à la peinture.
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    const cancelIdle = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
    let idleHandle: number | null = null;
    // Plancher de `MODEL_AGGREGATES_DELAY_MS` AVANT même de demander un créneau d'inactivité : sans
    // lui, le créneau est accordé si tôt que le balayage entre en concurrence avec la peinture des
    // cartes une fois sur deux (série mesurée : 1 519 / 1 973 / 1 821 / 1 523 / 2 023 ms, contre
    // 1 495 / 1 489 / 1 493 / 1 494 / 1 493 ms sans ce chargement). Les zones-modèles arrivent
    // ~0,5 s après les cartes : c'est exactement ce qu'un enrichissement progressif doit faire.
    const floor = window.setTimeout(() => {
      if (typeof idle === 'function') idleHandle = idle(run, { timeout: 2000 });
      else run();
    }, MODEL_AGGREGATES_DELAY_MS);
    return () => {
      live = false;
      window.clearTimeout(floor);
      if (idleHandle !== null) cancelIdle?.(idleHandle);
    };
  }, [start, view.kind, marketPhase.phase, currentQuery, controller, selection]);

  /**
   * `D8-03` / `FV-03` / `E2E-26` — CONSOMMATION des corrections d'URL : réécriture `replaceState`
   * vers la requête canonique (`EX-NAV-22` : les bornes permutées sont visibles dans la barre
   * d'adresse) et publication du bandeau `ET-URL-CORRIGEE`. La canonisation préserve l'état
   * d'interface reçu (`mk`, `g4v`, `page`… `EX-NAV-10bis`) : seule la composante de FILTRES est
   * corrigée.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (parsedQuery.corrections.length === 0) return;
    if (correctedFrom === location.search) return;
    const uiObj: Record<string, string> = {};
    for (const [k, v] of Object.entries(uiStateFromUrl)) {
      uiObj[k] = Array.isArray(v) ? v.map(String).join(',') : String(v);
    }
    const canonical = assembleUrl(
      location.pathname,
      serializeQuery(selection, uiObj, { filterDefaults: FILTER_DEFAULTS }),
    ).url;
    setUrlCorrections(parsedQuery.corrections);
    setCorrectedFrom(location.search);
    if (`${location.pathname}${location.search}` !== canonical) navigate(canonical, 'replace');
  }, [parsedQuery, location.pathname, location.search, selection, uiStateFromUrl, navigate, correctedFrom]);

  // ---- Historique récent (EX-CRUD-11) : marché et route canonique d'écran B ---------------------
  // `DR-159` : une entrée n'est ajoutée que si le JEU DE FILTRES change — un changement d'état
  // d'interface (`selx`, `sely`, `g4v`, `page`, échelles log) n'est pas « une recherche différente ».
  const filterSignature = `${location.pathname}?${serializeSelection(selection, { defaults: FILTER_DEFAULTS })}`;
  useEffect(() => {
    if (view.kind === 'market' || view.kind === 'modelDistribution') {
      stores.recent.visit(location.pathname + location.search);
      bumpCrud();
    }
  }, [filterSignature, view.kind]);

  // ---- Mode 2 : entrée dans l'écran B/D (O17, élagage avant M1/M2) -------------------------------
  const [mode2, setMode2] = useState<Mode2State | null>(null);
  /** Compteur de tentatives : le bouton « Réessayer » de l'écran B/D relance l'effet d'entrée. */
  const [mode2Attempt, setMode2Attempt] = useState(0);
  useEffect(() => {
    if (start === null) return;
    if (view.kind !== 'modelDistribution' && view.kind !== 'modelListings') return;
    // `DR-099` : aucune entrée en mode 2 sur une route invalide — l'écran d'erreur EX-NAV-19/20 est
    // rendu à la place, sans aller provider ni moteur.
    if (taxonomyRoute !== null && !taxonomyRoute.ok) return;
    // `DR-006` : la clé d'entrée en mode 2 dépend du couple ET de la requête courante — un changement
    // de filtre du bandeau mode 2 doit RECALCULER, pas seulement réécrire l'URL.
    const key = `${view.makeId}:${view.modelId}:${currentQuery}:${mode2Attempt}`;
    if (mode2?.key === key && mode2.status !== 'error') return;
    // `D8-24` (`ET-CHARGE-INIT`/`ET-CHARGE-MAJ`, `EX-SCR-24`/`173`) : le payload PRÉCÉDENT est
    // conservé pendant le recalcul. Premier calcul (aucun payload) ⇒ squelettes ; recalcul ⇒ figures
    // atténuées avec barre de progression, jamais un écran vidé puis repeuplé.
    setMode2((prev) => ({ key, status: 'loading', ...(prev?.payload === undefined ? {} : { payload: prev.payload }) }));
    void controller
      .enterMode2(view.makeId, view.modelId, selection)
      .then((payload) => setMode2({ key, status: 'ready', payload }))
      .catch((e) => setMode2({ key, status: 'error', errorCode: e instanceof Error ? e.message : String(e) }));
  }, [start, view, currentQuery, mode2Attempt, taxonomyRoute]);

  useEffect(() => {
    const unsubs = [stores.saved.subscribe(bumpCrud), stores.followed.subscribe(bumpCrud), stores.recent.subscribe(bumpCrud)];
    return () => unsubs.forEach((u) => u());
  }, [stores, bumpCrud]);

  /**
   * `D8-05` / `FV-06` (`EX-SCR-65`/`89`/`90`, `EX-DATA-110bis`) — FACETTES du dernier recalcul,
   * DIFFÉRÉES (≤ 100 ms normatif) : pendant l'écart, `facetCountsPending` fait afficher `…` à la
   * place de chaque effectif plutôt qu'une valeur périmée non signalée.
   *
   * Portée : le moteur ne peut facetter que ce qu'il a en mémoire, c'est-à-dire le jeu de données
   * local du mode 2 (décision O17 : le mode 1 ne charge JAMAIS les colonnes d'annonces, `EX-NFR-9`).
   * En mode 1 aucune facette n'est passée — le bandeau ne rend alors AUCUNE parenthèse, jamais un
   * `(0)` par défaut (règle de `CheckboxList`).
   */
  const [facetCounts, setFacetCounts] = useState<ReadonlyMap<string, FacetCounts> | undefined>(undefined);
  const [facetCountsPending, setFacetCountsPending] = useState(false);
  const mode2Status = mode2?.status;
  const mode2Key = mode2?.key;
  useEffect(() => {
    if (currentMode !== 'mode2') {
      setFacetCounts(undefined);
      setFacetCountsPending(false);
      return undefined;
    }
    if (mode2Status !== 'ready') return undefined;
    let live = true;
    setFacetCountsPending(true);
    const timer = setTimeout(() => {
      void controller
        .computeFacets(selection)
        .then((f) => {
          if (!live) return;
          setFacetCounts(f ?? undefined);
          setFacetCountsPending(false);
        })
        .catch(() => {
          if (live) setFacetCountsPending(false);
        });
    }, FACET_DEFER_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [currentMode, mode2Status, mode2Key, controller, selection]);

  /**
   * `D8-05` / `FV-05` (`EX-SCR-216`) — effectifs de l'écran G : par marque depuis les agrégats du
   * marché courant, par modèle depuis les agrégats-modèles (`D8-02`). Absents ⇒ `screen-g-model.ts`
   * retombe sur `announcedCount`, jamais sur `0`.
   */
  const screenGMakeCounts = useMemo<ReadonlyMap<number, number>>(() => {
    const out = new Map<number, number>();
    if (marketPhase.phase !== 'loaded') {
      // `D8-34` (`EX-SCR-216`, constat `fix-app-2` §7.3) — en MODE 2, l'écran A n'a jamais été
      // monté : `marketPhase` n'est pas `loaded`, cette carte restait VIDE, et `screen-g-model.ts`
      // rendait `—` sur CHAQUE entrée (`DR-060` : une carte fournie sans la clé demandée vaut `—`).
      // Repli sur les effectifs de la BASELINE, déjà en mémoire dans le contrôleur : aucun aller
      // provider, aucun second balayage, `EX-NFR-9` intact. Ce sont les effectifs du snapshot
      // ENTIER, non filtrés — une valeur mesurée, jamais présentée comme le périmètre courant.
      // Hors mode 2, rien ne change : sur l'écran A en cours de chargement, l'absence d'effectif
      // reste `ET-CHARGE-INIT` plutôt qu'un chiffre non filtré affiché sous des filtres posés.
      if (currentMode !== 'mode2') return out;
      return controller.baselineMakeCounts ?? out;
    }
    for (const agg of marketPhase.data.makeAggregates) out.set(agg.makeId, agg.listingCount);
    return out;
  }, [marketPhase, currentMode, controller, start]);
  const screenGModelCounts = useMemo<ReadonlyMap<string, number>>(() => {
    const out = new Map<string, number>();
    for (const [makeId, models] of modelsByMake) {
      if (models === 'unavailable') continue;
      for (const m of models) out.set(modelKey(makeId, m.modelId), m.listingCount);
    }
    return out;
  }, [modelsByMake]);

  /**
   * `D8-05` / `FV-23` (`EX-SCR-78`, `EX-SRCH-21`) — compteur de la zone (4) du bandeau : effectif de
   * la sélection RÉELLEMENT appliquée. Mode 2 : Σ du lot élagué ; mode 1 : `selectionCount` publié
   * par le provider, à défaut la somme des cartes. `undefined` = inconnu (le bandeau n'affiche alors
   * aucun chiffre, jamais `0`).
   */
  const resultCount = useMemo<number | undefined>(() => {
    if (currentMode === 'mode2') return mode2?.payload?.rows.length;
    if (marketPhase.phase !== 'loaded') return undefined;
    return (
      controller.marketSelectionCount ??
      marketPhase.data.makeAggregates.reduce((sum, a) => sum + a.listingCount, 0)
    );
  }, [currentMode, mode2, marketPhase, controller]);
  const resultCountLoading =
    currentMode === 'mode2' ? mode2Status === 'loading' : marketPhase.phase === 'loading';

  /**
   * `D8-05` / `FV-23` (`EX-SCR-46`, `EX-DATA-110bis`) — DOUBLE compteur du fil d'Ariane
   * « <n> offres | <n> ici » : le premier nombre est l'effectif de la sélection PRIVÉE de sa
   * composante taxonomique (`selectionHashWithoutTaxonomy`), le second celui du périmètre courant.
   * `null` = non établi (provider en échec) : le fil d'Ariane n'affiche alors que « ici ».
   */
  const [countWithoutTaxonomy, setCountWithoutTaxonomy] = useState<number | null>(null);
  useEffect(() => {
    if (currentMode !== 'mode2' || start === null) {
      setCountWithoutTaxonomy(null);
      return undefined;
    }
    let live = true;
    void controller.countForSelection(withoutTaxonomy(selection)).then((n) => {
      if (live) setCountWithoutTaxonomy(n);
    });
    return () => {
      live = false;
    };
  }, [currentMode, start, controller, selection]);

  /** `D8-15` (`EX-SCR-97`) — effectif PROJETÉ de la sélection brouillon de la feuille compacte. */
  const [projectedResultCount, setProjectedResultCount] = useState<number | undefined>(undefined);
  const onDraftSelectionChange = useCallback(
    (draft: SelectionState): void => {
      void controller.countForSelection(draft).then((n) => setProjectedResultCount(n ?? undefined));
    },
    [controller],
  );

  // ---- Sélection de comparaison (session, EX-CRUD-13bis) ----------------------------------------
  const [compareKeys, setCompareKeys] = useState<readonly CompareModelKey[]>([]);
  // À l'ouverture de /comparer?m=…, l'URL REMPLACE la sélection de session (écrêtage signalé).
  useEffect(() => {
    if (view.kind !== 'compare') return;
    const parsed = parseCompareParam(loadQuery(location.search).uiState.m as string | readonly string[] | undefined);
    if (parsed.keys.length > 0 || location.search.includes('m=')) {
      setCompareKeys(parsed.keys);
      if (parsed.clipped) setBanner('Sélection de comparaison écrêtée à 4 modèles (le reste de l’URL a été ignoré).');
    }
  }, [view.kind, location.search]);

  /**
   * `EX-SCR-198` (`D8-06`/`FV-15`) — « **Passer sous** 2 modèles redirige vers l'écran B du modèle
   * restant » : l'exigence décrit une TRANSITION (un retrait de colonne), pas l'état initial. Une
   * visite à froid de `/comparer` sans sélection ne doit donc pas rebondir vers l'écran A — sans
   * quoi l'écran C devient inatteignable et sa colonne « + Ajouter un modèle » (`EX-SCR-197`)
   * n'existe plus. Ce drapeau retient qu'une comparaison a réellement été peuplée dans cette
   * session : seule sa réduction déclenche la redirection.
   */
  const compareWasPopulated = useRef(false);
  if (compareKeys.length >= 2) compareWasPopulated.current = true;

  const [compareRows, setCompareRows] = useState<readonly CompareModelRow[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  useEffect(() => {
    if (view.kind !== 'compare' || start === null) {
      return;
    }
    let live = true;
    setCompareLoading(compareKeys.length > 0);
    void (async () => {
      const rows: CompareModelRow[] = [];
      for (const key of compareKeys) {
        const models = await controller.loadModelsForMake({}, key.makeId).catch(() => [] as readonly ModelAggregate[]);
        const agg = models.find((m) => m.modelId === key.modelId);
        if (agg !== undefined) {
          // `EX-SCR-196` (DR-088) : les barres G1/G3 par colonne viennent du VRAI recalcul mode 2 du
          // modèle (`enterMode2`), jamais d'un graphe fabriqué. Un échec laisse la colonne sans
          // buckets (cadre « Données indisponibles »), sans faire tomber les autres colonnes.
          const payload = await controller.enterMode2(key.makeId, key.modelId).catch(() => null);
          rows.push({
            makeId: key.makeId,
            modelId: key.modelId,
            name: modelName(referenceData, key.makeId, key.modelId),
            listingCount: agg.listingCount,
            price: agg.price,
            year: agg.year,
            mileage: agg.mileage,
            status: payload === null ? 'error' : 'ready',
            ...(payload === null
              ? {}
              : {
                  priceBuckets: payload.recalc.priceHistogram.map(toCompareBucket),
                  yearBuckets: payload.recalc.yearHistogram.map(toCompareBucket),
                }),
          });
          if (live) setCompareRows([...rows]);
        }
      }
      if (live) {
        setCompareRows(rows);
        setCompareLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [view.kind, compareKeys, start, controller, referenceData]);

  /**
   * `EX-SCR-212`/`213` (DR-089) et `EX-SCR-214bis` (DR-090) — effectifs ACTUELS des écrans E et F,
   * recalculés sur la requête canonique de chaque entrée (jamais l'effectif figé à l'enregistrement).
   * `null` = indisponible (provider en échec) ; absent de la carte = pas encore résolu.
   */
  const [currentCounts, setCurrentCounts] = useState<ReadonlyMap<string, number | null>>(new Map());
  useEffect(() => {
    if (start === null) return;
    if (view.kind !== 'savedSearches' && view.kind !== 'followed') return;
    let live = true;
    void (async () => {
      const next = new Map<string, number | null>();
      if (view.kind === 'savedSearches') {
        for (const record of stores.saved.list()) {
          const query = record.value.url.split('?')[1] ?? '';
          next.set(record.value.id, await controller.countForSelection(loadQuery(query).selection));
        }
      } else {
        for (const record of stores.followed.list()) {
          const { makeId, modelId } = record.value;
          next.set(`${makeId}:${modelId}`, await controller.countForModel(makeId, modelId));
        }
      }
      if (live) setCurrentCounts(next);
    })();
    return () => {
      live = false;
    };
  }, [view.kind, start, controller, stores, crudTick]);

  // ---- Handlers d'écran A -----------------------------------------------------------------------
  const prefs = stores.preferences.read();
  const [sortField, setSortField] = useState<MakeSortField>(prefs.sortField as MakeSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(prefs.sortDirection);
  const [hideSparse, setHideSparse] = useState<boolean>(prefs.hideSparseModels);
  const [loadedMakeCount, setLoadedMakeCount] = useState(GRID_LOAD_BATCH_SIZE * 3);
  const [showAllMakes, setShowAllMakes] = useState(false);
  const [screenGOpen, setScreenGOpen] = useState(false);

  const applyMode1Query = useCallback(
    (sel: SelectionState, mode: 'push' | 'replace' = 'push'): void => {
      const q = serializeQuery(sel, mode1Ui, { filterDefaults: FILTER_DEFAULTS });
      navigate(assembleUrl('/marche', q).url, mode);
    },
    [navigate, mode1Ui],
  );

  /**
   * `FV-17` (`EX-SCR-123`) — le dépliage d'une carte est un ÉTAT D'INTERFACE partageable : il est
   * écrit dans `mk` en mode `replace` (pas d'entrée d'historique, `UI_STATE_PARAMS`), et non plus
   * gardé dans un `useState` invisible de l'URL.
   */
  const onToggleExpand = useCallback(
    (makeId: number, next: boolean): void => {
      const ids = new Set(expandedMakeIds);
      if (next) ids.add(makeId);
      else ids.delete(makeId);
      const mk = [...ids].sort((a, b) => a - b).join(',');
      const q = serializeQuery(selection, mk === '' ? {} : { mk }, { filterDefaults: FILTER_DEFAULTS });
      navigate(assembleUrl(location.pathname, q).url, 'replace');
      // `EX-SCR-132` : le détail par modèle d'une carte reste chargeable à la demande, en filet de
      // sécurité, quand le chargement de portée marché (`D8-02`) n'a pas encore abouti.
      if (next && !modelsByMake.has(makeId)) {
        void controller
          .loadModelsForMake(selection, makeId)
          .then((models) => setModelsByMake((prev) => new Map(prev).set(makeId, models)))
          .catch(() => setModelsByMake((prev) => new Map(prev).set(makeId, 'unavailable')));
      }
    },
    [controller, selection, modelsByMake, expandedMakeIds, navigate, location.pathname],
  );

  /**
   * `EX-NAV-15`/`16` (`D-09`, `DR-063`) — entrée en mode 2 : le bloc `mmmv` du couple CHOISI est
   * ABSORBÉ par la route (`carryFiltersAcrossMode`), tous les autres filtres partagés sont conservés
   * dans la requête. Sans cela, ouvrir un modèle perdait silencieusement les filtres posés.
   */
  const goToModel = useCallback(
    (makeId: number, modelId: number, mode: 'push' | 'replace' = 'push'): void => {
      const make = referenceData.makeById.get(makeId);
      const model = referenceData.modelByKey.get(`${makeId}:${modelId}`);
      const path = buildPath({
        name: 'modelDistribution',
        makeId,
        makeSlug: make?.slug ?? String(makeId),
        modelId,
        modelSlug: model?.slug ?? String(modelId),
      });
      const carried = carryFiltersAcrossMode(selection, currentMode, 'mode2', { makeId, modelId });
      navigate(assembleUrl(path, serializeQuery(carried, {}, { filterDefaults: FILTER_DEFAULTS })).url, mode);
    },
    [navigate, referenceData, selection, currentMode],
  );


  /**
   * `D8-04b` / `FV-04` (`EX-SCR-104`) — un `mmmv` portant un couple COMPLET (marque ET modèle) n'est
   * pas un filtre de l'écran A : c'est la désignation d'un modèle, donc l'écran B. La coquille y
   * redirige (`push` : c'est bien une navigation utilisateur), `carryFiltersAcrossMode` absorbant le
   * bloc taxonomique dans la route. Un `mmmv` réduit à la marque (`make|||`, `D-09`) reste un filtre
   * d'écran A et ne redirige pas.
   */
  useEffect(() => {
    if (view.kind !== 'market') return;
    const pair = completeMmmvPair(selection);
    if (pair === null) return;
    // `replace` : l'URL intermédiaire `/marche?mmmv=<make>|<model>` ne doit PAS rester dans
    // l'historique, sinon un retour arrière y reviendrait et redirigerait aussitôt — l'utilisateur
    // ne pourrait plus quitter l'écran B par `Précédent` (`EX-NAV-12`).
    goToModel(pair.makeId, pair.modelId, 'replace');
  }, [view.kind, selection, goToModel]);

  const toggleCompare = useCallback((makeId: number, modelId: number, next: boolean): void => {
    setCompareKeys((prev) => (next ? addToCompare(prev, { makeId, modelId }) : removeFromCompare(prev, { makeId, modelId })));
  }, []);

  const persistPrefs = useCallback(
    (patch: Parameters<PreferencesStore['write']>[0]): void => {
      stores.preferences.write(patch);
    },
    [stores],
  );

  const saveCurrentSearch = useCallback(
    (nom: string): void => {
      // `EX-CRUD-1`/`ARB-45` (DR-102) : `effectifInitial` est l'effectif d'ANNONCES de la sélection au
      // moment de l'enregistrement — Σ du mode 2 quand on enregistre depuis l'écran B/D, la somme des
      // cartes du mode 1 sinon. Figé à la création, jamais réécrit.
      const data = marketPhase.phase === 'loaded' ? marketPhase.data : null;
      const effectifInitial =
        mode2?.status === 'ready' && mode2.payload !== undefined && currentMode === 'mode2'
          ? mode2.payload.rows.length
          : data
            ? data.makeAggregates.reduce((s, a) => s + a.listingCount, 0)
            : 0;
      try {
        // `E2E-24` (`EX-CRUD-1`/`EX-CRUD-3`) : l'homonymie est évaluée sur l'état ANTÉRIEUR. Elle
        // l'était après `create`, si bien que l'entrée qui venait d'être créée comptait comme son
        // propre doublon : le message d'homonymie s'affichait à CHAQUE enregistrement, même sur une
        // collection vide, et perdait tout pouvoir informatif.
        const duplicate = stores.saved.hasDuplicateName(nom);
        stores.saved.create({
          nom,
          url: location.pathname + location.search,
          effectifInitial,
          snapshotInitial: controller.snapshotDescriptor?.snapshotId ?? '',
        });
        setBanner(duplicate ? 'Recherche enregistrée (un nom identique existait déjà).' : 'Recherche enregistrée.');
        bumpCrud();
      } catch (e) {
        setBanner(e instanceof CapExceededError ? e.message : e instanceof Error ? e.message : 'Échec de l’enregistrement.');
      }
    },
    [marketPhase, mode2, currentMode, location, controller, stores, bumpCrud],
  );

  const toggleFollow = useCallback(
    (makeId: number, modelId: number): void => {
      try {
        stores.followed.toggle(makeId, modelId);
        bumpCrud();
      } catch (e) {
        setBanner(e instanceof CapExceededError ? e.message : 'Échec du suivi.');
      }
    },
    [stores, bumpCrud],
  );

  /**
   * `EX-NAV-17` (`D-09`, `DR-063`) — retour vers l'écran A : le couple ACTIF de la route quittée est
   * RÉINJECTÉ dans `mmmv` par `carryFiltersAcrossMode`, les autres filtres partagés sont conservés.
   * `pair` absent (ou route invalide) : les filtres partent tels quels, sans couple inventé.
   */
  const marketUrlFrom = useCallback(
    (pair?: { readonly makeId: number; readonly modelId?: number }): string => {
      const sel = pair === undefined ? selection : carryFiltersAcrossMode(selection, 'mode2', 'mode1', pair);
      return assembleUrl('/marche', serializeQuery(sel, {}, { filterDefaults: FILTER_DEFAULTS })).url;
    },
    [selection],
  );

  /**
   * `DR-010` (`EX-SCR-201`/`164`) — SEUL lien SORTANT de l'application : l'annonce d'origine s'ouvre
   * dans un nouvel onglet (`noopener`), JAMAIS par une navigation interne. Une URL absente est dite,
   * jamais remplacée par un écran de l'application.
   */
  const openListing = useCallback(
    (batch: Mode2Payload['batch'], row: number): void => {
      const url = readListingString(batch, row, STRING_FIELD.listingUrl);
      if (url === '') {
        setBanner('Cette annonce ne porte pas d’URL d’origine exploitable.');
        return;
      }
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        window.open(url, '_blank', 'noopener');
      }
    },
    [],
  );

  /**
   * `EX-NFR-29` (DR-077) — résolveurs de libellés FR partagés par les écrans B et D et par les
   * exports CSV : l'index d'octet stocké en colonne EST le rang de la valeur dans son vocabulaire
   * (`KYCAR_SELLER_TYPE[0] = « Particulier »`), donc la part de particuliers de l'en-tête d'écran B
   * se lit réellement au lieu de rester indisponible. Un code hors domaine rend le code brut.
   */
  const labelOf = useCallback(
    (vocabulary: VocabularyName) =>
      (code: number): string =>
        referenceData.vocabularies.get(vocabulary)?.values[code]?.label ?? String(code),
    [referenceData],
  );
  const distributionLabels = useMemo(
    () => ({
      fuel: labelOf('KYCAR_FUEL_CATEGORY'),
      sellerType: labelOf('KYCAR_SELLER_TYPE'),
      evaluation: labelOf('KYCAR_PRICE_EVALUATION'),
      country: labelOf('KYCAR_MARKETPLACE'),
    }),
    [labelOf],
  );
  const listingsLabels = useMemo(
    () => ({
      fuel: labelOf('KYCAR_FUEL_CATEGORY'),
      sellerType: labelOf('KYCAR_SELLER_TYPE'),
      country: labelOf('KYCAR_MARKETPLACE'),
      region: labelOf('KYCAR_REGION'),
      usageState: labelOf('KYCAR_USAGE_STATE'),
      evaluation: labelOf('KYCAR_PRICE_EVALUATION'),
    }),
    [labelOf],
  );

  /**
   * `ARB-09`/`EX-SCR-149` (DR-009) et `EX-SCR-184` (DR-079) — pose un correctif de filtres RÉELS sur
   * la sélection courante : le patch est FUSIONNÉ dans la sélection du bandeau, l'URL est réécrite
   * (entrée d'historique : c'est une action utilisateur) et le recalcul suit (mode 1 par l'effet de
   * marché, mode 2 par la clé d'entrée qui dépend de la requête).
   */
  const applyFilters = useCallback(
    (patch: SelectionInput, extraUi: Readonly<Record<string, string>> = {}): void => {
      const next: SelectionState = { ...selection };
      for (const [id, value] of Object.entries(patch)) {
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
          delete (next as Record<string, unknown>)[id];
        } else {
          (next as Record<string, unknown>)[id] = value;
        }
      }
      const q = serializeQuery(next, extraUi, { filterDefaults: FILTER_DEFAULTS });
      // `EX-SCR-38bis` : le bandeau `ET-URL-CORRIGEE` vit jusqu'au prochain changement de filtre.
      setUrlCorrections([]);
      navigate(assembleUrl(location.pathname, q).url, 'push');
    },
    [selection, navigate, location.pathname],
  );

  /** Chemin de l'écran D d'un couple (route canonique, `EX-SCR-140`). */
  const listingsPath = useCallback(
    (makeId: number, modelId: number): string =>
      buildPath({
        name: 'modelListings',
        makeId,
        makeSlug: referenceData.makeById.get(makeId)?.slug ?? String(makeId),
        modelId,
        modelSlug: referenceData.modelByKey.get(`${makeId}:${modelId}`)?.slug ?? String(modelId),
      }),
    [referenceData],
  );

  /** Écrit l'état d'interface D7/D-12 dans l'URL, au mode d'historique du contrat D5 (`historyModeFor`). */
  const applyUiState = useCallback(
    (next: DistributionUiState, path: string = location.pathname): void => {
      const uiObj: Record<string, string> = Object.fromEntries(writeDistributionUiState(next));
      const q = serializeQuery(selection, uiObj, { filterDefaults: FILTER_DEFAULTS });
      navigate(assembleUrl(path, q).url, historyModeFor(ui, next));
    },
    [selection, navigate, location.pathname, ui],
  );

  /**
   * `EX-NAV-23`/`25` (`D8-14`/`FV-21`) — RAFRAÎCHISSEMENT explicite du snapshot : le moteur est
   * libéré (jeu de données obsolète), la sélection de comparaison purgée (identifiants d'un autre
   * snapshot, `EX-NAV-24`), le provider redemandé. Si le snapshot servi CHANGE, le bandeau
   * « Nouvelles données du … » le dit — jamais un remplacement silencieux.
   */
  const refreshSnapshot = useCallback((): void => {
    const previousId = controller.snapshotDescriptor?.snapshotId ?? null;
    setCompareKeys([]);
    setCompareRows([]);
    controller.dispose();
    void controller.start().then((r) => {
      setStart(r);
      const nextId = r.descriptor?.snapshotId ?? null;
      if (nextId !== null && previousId !== null && nextId !== previousId) {
        setBanner(`Nouvelles données du ${frDate(r.descriptor?.capturedAt ?? null)} — les chiffres affichés ont été recalculés.`);
      }
      if (view.kind === 'market') void reloadMarket(selection);
    });
  }, [controller, view.kind, reloadMarket, selection]);

  /** `EX-NFR-22` (DR-092) — « Réessayer » relance RÉELLEMENT le provider, puis rejoue le marché. */
  const onStarted = useCallback(
    (r: StartResult): void => {
      setStart(r);
      if (view.kind === 'market') void reloadMarket(selection);
    },
    [view.kind, reloadMarket, selection],
  );

  /** `EX-SCR-45` — fil d'Ariane : Marché › Marque Modèle › Annonces (le chemin, pas l'historique). */
  const breadcrumb = useMemo<readonly { readonly label: string; readonly href?: string }[]>(() => {
    if (view.kind === 'modelDistribution' || view.kind === 'modelListings') {
      const name = modelName(referenceData, view.makeId, view.modelId);
      const modelHref = buildPath({
        name: 'modelDistribution',
        makeId: view.makeId,
        makeSlug: referenceData.makeById.get(view.makeId)?.slug ?? String(view.makeId),
        modelId: view.modelId,
        modelSlug: referenceData.modelByKey.get(`${view.makeId}:${view.modelId}`)?.slug ?? String(view.modelId),
      });
      // `D8-04c` / `FV-04` (`EX-NAV-16`, `D-09`) : le retour vers l'écran A réinjecte la MARQUE
      // SEULE (`make|||`), jamais le couple complet — un `mmmv` complet désignerait de nouveau
      // l'écran B (`EX-SCR-104`) et le retour boucler ait sur lui-même.
      const trail: { label: string; href?: string }[] = [
        { label: 'Marché', href: marketUrlFrom({ makeId: view.makeId }) },
      ];
      if (view.kind === 'modelListings') {
        trail.push({ label: name, href: modelHref }, { label: 'Annonces' });
      } else {
        trail.push({ label: name });
      }
      return trail;
    }
    return [{ label: VIEW_TITLES[view.kind] }];
  }, [view, referenceData, marketUrlFrom]);

  /**
   * `EX-SCR-47`/`53`/`218`/`224` (`D8-14`/`FV-21`) — panneau Diagnostic du pied de page. Il ne
   * portait que huit lignes d'ORCHESTRATION ; il expose désormais aussi ce que le `SnapshotDescriptor`
   * mesure réellement sur le jeu servi : champs inconnus par champ (`unknownCountByField`), drapeaux
   * d'ingestion posés (`ingestFlagCounts` — ITÉRÉ, jamais dérivé du vocabulaire à 17 codes, cf.
   * fix-providers §6.4), conflits de valeur sur doublon, doublons, rejets d'ingestion par motif
   * (journal d'erreurs) et taux de version élaguée. Aucune donnée R3 : ce sont des COMPTEURS.
   */
  const diagnostics = useMemo<readonly (readonly [string, string])[]>(() => {
    const d = controller.snapshotDescriptor;
    const counts = (record: Readonly<Record<string, number>> | undefined): string => {
      const entries = Object.entries(record ?? {}).filter(([, n]) => n > 0);
      if (entries.length === 0) return 'aucun';
      return entries
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => `${k} : ${n}`)
        .join(' · ');
    };
    return [
      ['Statut du démarrage', start?.status ?? 'en cours'],
      ['Source', start?.sourceKind ?? 'inconnue'],
      ['Snapshot', d?.snapshotId ?? '—'],
      ['Annonces du snapshot', String(d?.listingCount ?? '—')],
      ['Annonces annoncées par la source', d?.announcedListingCount === null || d?.announcedListingCount === undefined ? '—' : String(d.announcedListingCount)],
      ['Code d’erreur', start?.errorCode ?? 'aucun'],
      ['Dernière tentative', start?.attemptedAt ?? '—'],
      ['Requête canonique', currentQuery === '' ? '(aucun filtre)' : currentQuery],
      ['Régime d’affichage', regime],
      ['Champs inconnus (par champ)', counts(d?.unknownCountByField)],
      ['Drapeaux d’ingestion posés', counts(d?.ingestFlagCounts)],
      ['Doublons détectés', String(d?.duplicateListingCount ?? '—')],
      ['Conflits de valeur sur doublon', String(d?.duplicateValueConflictCount ?? '—')],
      ['Journal des rejets d’ingestion', d === null || d === undefined ? '—' : `${d.rejectedCount} rejetées — ${counts(d.rejectedByReason)}`],
      ['Versions élaguées (taux)', d === null || d === undefined ? '—' : d.versionStrippedRate.toFixed(3)],
    ];
  }, [start, controller, currentQuery, regime]);

  /**
   * `EX-NFR-14`/`16` (DR-101) — titre de document PAR VUE et prise de focus après navigation : le
   * lecteur d'écran annonce la nouvelle page, le clavier repart du `h1` (et non du début du document).
   */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const suffix = view.kind === 'modelDistribution' || view.kind === 'modelListings'
      ? modelName(referenceData, view.makeId, view.modelId)
      : '';
    document.title = `KYCAR — ${VIEW_TITLES[view.kind]}${suffix === '' ? '' : ` · ${suffix}`}`;
    const main = document.getElementById('kycar-main');
    const heading = (main?.querySelector('h1') ?? main) as HTMLElement | null;
    // `E2E-16` / `FV-16` (`EX-NFR-12`, `DR-101`) : `focus()` sur un `h1` SANS `tabindex` est sans
    // effet — l'appel échouait en silence et le focus restait sur `<body>` (chargement direct) ou
    // sur le lien cliqué (navigation interne). Le titre est rendu focalisable par programme
    // (`tabindex="-1"` : atteignable au script, JAMAIS inséré dans l'ordre de tabulation, donc le
    // lien d'évitement reste le premier arrêt du document) avant la prise de focus ; en dernier
    // recours le repli sur `#kycar-main`, lui-même `tabIndex={-1}`, s'applique.
    if (heading !== null && typeof heading.focus === 'function') {
      if (heading.getAttribute('tabindex') === null) heading.setAttribute('tabindex', '-1');
      heading.focus();
      if (document.activeElement !== heading && main !== null) main.focus();
    }
  }, [view, referenceData]);

  // ---- Composition ------------------------------------------------------------------------------
  const degraded = start?.status === 'degraded-cache' || controller.isDegraded;
  const filterBandMode = currentMode;
  const descriptor = controller.snapshotDescriptor;
  // `D-24`/`D-43` (DR-094/DR-152) : la provenance vient de `describe()` et du descripteur de
  // snapshot, jamais d'un littéral d'écran.
  const sourceKind = start?.sourceKind ?? descriptor?.sourceKind ?? controller.capabilities.sourceKind;
  const loadedData = marketPhase.phase === 'loaded' ? marketPhase.data : null;

  /** `EX-DATA-123bis` (DR-070/140/141) — métadonnées réelles des 3 lignes d'en-tête du CSV écran A. */
  const aggregateCsvMeta: AggregateCsvMeta = {
    snapshotId: descriptor?.snapshotId ?? '',
    capturedAt: descriptor?.capturedAt ?? '',
    sourceKind: sourceKind ?? 'INCONNU',
    filterQuery: currentQuery,
    sampleCoverage: descriptor?.coverageNote ?? 'NON_APPLICABLE',
    metricCoverage: '',
  };

  /**
   * `EX-NFR-31` règle 3 (`D8-14`/`FV-13`, `E2E-23`) — résumé TEXTUEL des filtres actifs, imprimé à la
   * place du bandeau. Il citait les noms de PARAMÈTRES d'URL sur UNE ligne (« body=3 · kmto=100000 »)
   * alors que la règle demande « un résumé textuel des filtres actifs, **un par ligne** » et que les
   * jetons du bandeau (`EX-SCR-75`) savent déjà dire « Carrosserie : Coupé ». Même modèle, même
   * source : `buildActiveFilterTokens`.
   */
  const activeFilterTokens = useMemo(
    () => buildActiveFilterTokens(selection, referenceData),
    [selection, referenceData],
  );
  const printFilterLines = useMemo<readonly string[]>(
    () => activeFilterTokens.map((t) => t.text),
    [activeFilterTokens],
  );
  /** `EX-SCR-94` (`D8-14`/`FV-24`) — nom PRÉREMPLI du formulaire d'enregistrement. */
  const suggestedSearchName = useMemo(() => buildSearchDescription(activeFilterTokens), [activeFilterTokens]);

  /**
   * `EX-SCR-26` / `EX-SCR-174` (`D8-31`, liste de `fix-screens-2` §8.1) — suggestions de retrait de
   * l'état `ET-VIDE-FILTRES` de l'écran B. Le calcul « leave-one-out » n'a lieu QUE lorsque la
   * sélection est effectivement vide (c'est le seul état qui rend le bloc) : hors de ce cas, aucun
   * balayage supplémentaire n'est fait. Il porte sur le lot DÉJÀ chargé et élagué au couple
   * marque/modèle (`O17`), donc sans aucun aller provider. Sur l'écran A (mode 1), le même calcul
   * exigerait un balayage des 100 000 annonces : `ScreenALoadedData.topRestrictiveFilters` y reste
   * `[]` (dette signalée dans `data-controller.ts`, hors portée de `D8-31`).
   */
  const emptySelectionHints = useMemo<readonly RestrictiveFilterHint[]>(() => {
    const payload = mode2?.payload;
    if (payload === undefined || payload.rows.length !== 0) return [];
    return topRestrictiveFilters({ selection, batch: payload.batch, referenceData, baselineCount: 0 });
  }, [mode2, selection, referenceData]);

  /**
   * `D8-20` (`ET-FILTRE-NON-APPLIQUE`, `EX-SCR-221`, O15) — filtres DÉCLARÉS non appliqués par le
   * moteur en mode 2. Cas particulier tranché par le fix-lead sur relevé de fix-providers §6.3 :
   * `bodyType` sur une sélection pincée à un modèle est le SEUL identifiant pour lequel l'effectif
   * publié reste complet et exploitable (l'index carrosserie est vide, `O15`) — il est donc affiché
   * avec sa mention propre plutôt que refusé comme un plancher (`D-03`, cas général).
   */
  const unsupportedMode2 = mode2?.payload?.unappliedFilterIds ?? [];
  const bodyFilterUnapplied = unsupportedMode2.includes('bodyType');

  /**
   * `ET-FILTRE-NON-APPLIQUE` (D-03, DR-103) — bandeau nommant les filtres non appliqués.
   *
   * `ACC-01` / `D8-41` : la déclaration dépend du MODE. En mode 1 elle vient du provider
   * (`ScreenALoadedData.unappliedFilterIds`) ; en mode 2 elle vient de l'entrée `enterMode2`
   * (composante `T` hors route, que `fetchListingColumns` n'accepte pas — O17), moins `bodyType`
   * qui a son bandeau propre ci-dessus. Sans cette lecture, un filtre de classe `T` posé sur
   * l'écran B restait sans effet ET sans mention, ce que `D-03` interdit ; et la liste du mode 1,
   * conservée en mémoire pendant la navigation vers B, n'y décrit plus les chiffres affichés.
   */
  const unapplied =
    currentMode === 'mode2' ? unsupportedMode2.filter((id) => id !== 'bodyType') : (loadedData?.unappliedFilterIds ?? []);

  /**
   * `EX-SCR-38` (`D8-06`/`FV-07`) — EMPILEMENT des bandeaux d'état de la coquille : au plus DEUX
   * simultanés, dans l'ordre de priorité normatif `ET-ERREUR-PROVIDER` > `ET-HORS-LIGNE` >
   * `ET-PARTIEL-CACHE` > `ET-TROP-RESULTATS`/`ET-FILTRE-NON-APPLIQUE` > `ET-URL-CORRIGEE` ; les
   * suivants sont repliés derrière un jeton `+k avertissements` cliquable. Le bandeau `C3` de
   * couverture est rendu par les écrans A et B (une seule fois chacun) et n'entre pas dans ce
   * plafond (exception explicite d'`EX-SCR-38`).
   */
  const shellBanners = useMemo<readonly ShellBanner[]>(() => {
    const out: ShellBanner[] = [];
    if (start?.status === 'failed') {
      out.push({
        id: 'ET-ERREUR-PROVIDER',
        className: 'kycar-banner-provider-error',
        dismissible: false,
        text: `Données indisponibles — le fournisseur n’a pas répondu (code ${start.errorCode ?? 'inconnu'}), dernière tentative le ${frDateTime(start.attemptedAt)}.`,
        retry: true,
      });
    }
    if (offline) {
      out.push({
        id: 'ET-HORS-LIGNE',
        className: 'kycar-banner-offline',
        dismissible: true,
        text: 'Hors ligne — les filtres qui exigent un nouveau jeu de données sont désactivés ; les filtres appliqués localement restent actifs sur le dernier jeu chargé.',
      });
    }
    if (degraded) {
      out.push({
        id: 'ET-PARTIEL-CACHE',
        className: 'kycar-banner-degraded',
        dismissible: true,
        text: `Mode dégradé — Données du ${frDate(start?.status === 'degraded-cache' ? (descriptor?.capturedAt ?? null) : null)} — dernière tentative de mise à jour échouée le ${frDateTime(start?.attemptedAt ?? null)} (code ${start?.errorCode ?? 'inconnu'}). Les agrégats marqués d’un astérisque proviennent du cache ; l’export est désactivé.`,
        retry: true,
      });
    }
    if (unapplied.length > 0) {
      out.push({
        id: 'ET-FILTRE-NON-APPLIQUE',
        className: 'kycar-banner-unapplied',
        dismissible: true,
        text: `Agrégats filtrés indisponibles — ${unapplied.length === 1 ? 'le filtre' : 'les filtres'} ${unapplied.join(', ')} ${unapplied.length === 1 ? 'n’a pas pu être appliqué' : 'n’ont pas pu être appliqués'} : les chiffres affichés sont ceux de la sélection NON filtrée.`,
      });
    }
    if (bodyFilterUnapplied) {
      out.push({
        id: 'ET-FILTRE-NON-APPLIQUE-BODY',
        className: 'kycar-banner-unapplied-body',
        dismissible: true,
        text: 'Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) — l’effectif affiché est complet, mais il ne tient pas compte de ce critère.',
      });
    }
    if (urlCorrections.length > 0) {
      // `EX-SCR-38bis` : une ligne par paramètre corrigé, au plus TROIS, puis « et <k> autres ».
      const head = urlCorrections.slice(0, 3).map((c) => c.message);
      const rest = urlCorrections.length - head.length;
      out.push({
        id: 'ET-URL-CORRIGEE',
        className: 'kycar-banner-url-corrected',
        dismissible: true,
        text: [...head, ...(rest > 0 ? [`et ${rest} autres paramètres corrigés`] : [])].join('\n'),
      });
    }
    return out;
  }, [start, offline, degraded, descriptor, unapplied, bodyFilterUnapplied, urlCorrections]);

  return (
    <div class="kycar-app" data-crud-rev={crudTick}>
      {/* `EX-NFR-12` (DR-101) — lien d'évitement : premier élément focalisable de la page. */}
      <a class="kycar-skip-link no-print" href="#kycar-main">
        Aller au contenu principal
      </a>
      <AppHeader
        sourceKind={sourceKind}
        snapshotDate={descriptor?.capturedAt ?? null}
        compareCount={compareKeys.length}
        followedCount={stores.followed.list().length}
        banner={banner}
        banners={shellBanners}
        regime={regime}
        currentQuery={currentQuery}
        breadcrumbCount={resultCount}
        breadcrumbCountWithoutTaxonomy={currentMode === 'mode2' ? countWithoutTaxonomy : null}
        onDismissBanner={() => setBanner(null)}
        onNavigate={navigate}
        onRetry={() => void controller.start().then(onStarted)}
        breadcrumb={breadcrumb}
      />

      {/* `D8-06`/`FV-15` (`EX-SCR-103`) : le bandeau de filtres C1 est aussi rendu sur `/comparer`. */}
      {view.kind === 'market' ||
      view.kind === 'modelDistribution' ||
      view.kind === 'modelListings' ||
      view.kind === 'compare' ? (
        <>
        <div class="filter-bar kycar-filter-bar">
          <FilterBand
            key={`${location.pathname}${location.search}`}
            mode={filterBandMode}
            initialSelection={selection}
            originAndPath={location.pathname}
            referenceData={referenceData}
            /* `EX-SCR-101` (`D8-31`, fix-state-2 §5.1) — DÉCLARATION : la taxonomie servie au
               bandeau est celle de ce snapshot. Un `mmmv` dont la marque ou le modèle en est absent
               est alors CONSERVÉ, marqué en ambre et compté à part (jamais retiré en silence).
               Le prop n'accepte pas `null` : `descriptor?.capturedAt`, sans `?? null`. */
            snapshotDate={descriptor?.capturedAt}
            /* `EX-SRCH-14` (`D8-31`, fix-state-2 §5.2) — en mode 2, la marque courante n'est portée
               que par la ROUTE (`carryFiltersAcrossMode` retire `mmmv` de la sélection à l'entrée) :
               sans elle, « même marque » n'est pas décidable et le bandeau garde son comportement
               d'avant. Absent hors mode 2, par construction. */
            routePair={
              view.kind === 'modelDistribution' || view.kind === 'modelListings'
                ? { makeId: view.makeId, modelId: view.modelId }
                : undefined
            }
            /* `EX-NAV-15` (fix-state-2 §5.3) — corollaire du même geste : l'écran `G` ouvert depuis
               le mode 2 a désigné un COUPLE complet. Seule la coquille sait bâtir
               `/marche/:makeId-:slug/:modelId-:slug` (les slugs viennent de la taxonomie). */
            onSelectModel={(pair) => goToModel(pair.makeId, pair.modelId)}
            onHistoryReplace={(url) => navigate(url, 'replace')}
            onHistoryPush={(url) => navigate(url, 'push')}
            onRecomputeLocal={() => {
              if (view.kind === 'market') void reloadMarket(selection);
            }}
            // `EX-NAV-24` (DR-155) : un remplacement de snapshot purge la sélection de comparaison
            // (identifiants d'un autre snapshot) et libère le moteur — même chemin que « Rafraîchir ».
            onReload={refreshSnapshot}
            onUrlBudgetExceeded={(msg) => setBanner(msg)}
            // `EX-SCR-94` (DR-139) : bouton « Enregistrer la recherche » de la zone (4) du bandeau,
            // routé sur le même CRUD que la barre d'outils (`saveCurrentSearch`), actif quand un
            // résultat est chargé (mode 1) ou en mode 2 (Σ connu).
            // `EX-SCR-94` (`D8-14`/`FV-24`, résidu `DR-139`) : le formulaire de `SaveSearchForm` est
            // PRÉREMPLI par la description des jetons ; la coquille recevait une fonction d'arité 0
            // qui écrasait ce nom par « Recherche du <date> ». Le NOM VALIDÉ est désormais utilisé.
            onSaveSearch={
              marketPhase.phase === 'loaded' || view.kind !== 'market'
                ? (name: string) => saveCurrentSearch(name)
                : undefined
            }
            resultCount={resultCount}
            resultCountLoading={resultCountLoading}
            facetCounts={facetCounts}
            facetCountsPending={facetCountsPending}
            screenGMakeCounts={screenGMakeCounts}
            screenGModelCounts={screenGModelCounts}
            regime={bandRegimeOf(regime)}
            projectedResultCount={projectedResultCount}
            onDraftSelectionChange={onDraftSelectionChange}
            onSelectionApplied={() => setUrlCorrections([])}
          />
        </div>
        {/* `EX-NFR-31` règle 3 (`D8-14`/`FV-13`, `E2E-22`) : le résumé imprimé est FRÈRE de
            `.filter-bar`, jamais son enfant — `print.css` met `.filter-bar` en `display: none` à
            l'impression, et un ancêtre masqué masque toute sa descendance : la règle
            `.print-filter-summary { display: block }` ne pouvait pas la rattraper. */}
        <div class="kycar-print-filter-summary print-filter-summary">
          {printFilterLines.length === 0
            ? 'Aucun filtre actif'
            : `Filtres actifs\n${printFilterLines.join('\n')}`}
        </div>
        </>
      ) : null}

      <main class="kycar-main">
        {/* `EX-NFR-12`/`16` (DR-101) : cible du lien d'évitement et du focus après navigation. */}
        <div id="kycar-main" tabIndex={-1} class="kycar-main-inner">
          {renderView()}
        </div>
      </main>

      <AppFooter
        sourceKind={sourceKind}
        snapshotDate={descriptor?.capturedAt ?? null}
        diagnostics={diagnostics}
        onNavigate={navigate}
        onRefresh={refreshSnapshot}
      />
    </div>
  );

  function renderView(): JSX.Element {
    switch (view.kind) {
      case 'market': {
        const mergedData: ScreenALoadedData | null =
          marketPhase.phase === 'loaded' ? { ...marketPhase.data, modelAggregatesByMake: modelsByMake } : null;
        const load: LoadPhase =
          marketPhase.phase === 'loaded' && mergedData !== null ? { phase: 'loaded', data: mergedData } : marketPhase;
        const derived = deriveScreenAState(load);
        // `FV-17` (`EX-SCR-126`) : l'amorce SANS-FILTRE est une AMORCE. Une fois que l'utilisateur a
        // posé des filtres dans cette session, « Tout effacer » ne le renvoie plus à l'écran
        // d'accueil : la grille complète (état `ready`) reste rendue, sans raccourcis d'amorce.
        const state =
          derived.kind === 'no-filter' && primerDismissed ? { kind: 'ready' as const, data: derived.data } : derived;
        return (
          <>
            <MarketToolbar onSave={saveCurrentSearch} canSave={marketPhase.phase === 'loaded'} suggestedName={suggestedSearchName} />
            <MarketScreen
              state={state}
              referenceData={referenceData}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortFieldChange={(f) => {
                setSortField(f);
                persistPrefs({ sortField: f });
              }}
              onSortDirectionToggle={() => {
                setSortDirection((d) => {
                  const next = d === 'asc' ? 'desc' : 'asc';
                  persistPrefs({ sortDirection: next });
                  return next;
                });
              }}
              hideSparseModels={hideSparse}
              onToggleHideSparseModels={(next) => {
                setHideSparse(next);
                persistPrefs({ hideSparseModels: next });
              }}
              expandedMakeIds={expandedMakeIds}
              onToggleExpand={onToggleExpand}
              loadedMakeCount={loadedMakeCount}
              onLoadMoreMakes={() => setLoadedMakeCount((n) => n + GRID_LOAD_BATCH_SIZE)}
              showAllMakesRequested={showAllMakes}
              onShowAllMakes={() => setShowAllMakes(true)}
              onApplyPrimerShortcut={(id) => applyMode1Query(PRIMER_SELECTIONS[id])}
              // `D8-04a` / `FV-04` (`EX-SCR-110`) : un clic sur l'EN-TÊTE de carte POSE le filtre
              // `mmmv` sur la marque (`make|||`, `D-09`) au lieu de simplement déplier la carte —
              // c'est la désignation d'une marque, pas un pliage. Le chevron reste la voie du
              // dépliage (`onToggleExpand`).
              onSelectMake={(makeId) => applyMode1Query({ ...selection, makesModelsVariants: String(makeId) })}
              onSelectModel={goToModel}
              compareSelection={new Set(compareKeys.map((k) => `${k.makeId}:${k.modelId}`))}
              compareAtCapacity={compareKeys.length >= MAX_COMPARE}
              onToggleCompare={toggleCompare}
              onRetryProvider={() => void controller.start().then(onStarted)}
              onRetryMakeModels={(makeId) => onToggleExpand(makeId, true)}
              onRemoveFilter={(filterId) => {
                const next = { ...selection };
                delete (next as Record<string, unknown>)[filterId];
                applyMode1Query(next);
              }}
              onResetAllFilters={() => {
                // `FV-17` : « Tout effacer » vide la sélection sans rouvrir l'amorce SANS-FILTRE.
                dismissPrimer();
                setUrlCorrections([]);
                navigate('/marche');
              }}
              onSaveSearch={() => saveCurrentSearch(defaultSearchName())}
              screenGOpen={screenGOpen}
              onOpenScreenG={() => setScreenGOpen(true)}
              onCancelScreenG={() => setScreenGOpen(false)}
              onApplyScreenG={(mmmv) => {
                setScreenGOpen(false);
                applyMode1Query({ ...selection, makesModelsVariants: mmmv });
              }}
              currentMmmv={typeof selection.makesModelsVariants === 'string' ? selection.makesModelsVariants : undefined}
              regime={regime}
              csvMeta={aggregateCsvMeta}
              partialCache={degraded}
            />
          </>
        );
      }

      case 'modelDistribution':
        return renderMode2('distribution');
      case 'modelListings':
        return renderMode2('listings');

      case 'compare':
        return (
          <CompareScreen
            rows={compareRows}
            loading={compareLoading}
            atCapacity={compareKeys.length >= MAX_COMPARE}
            onRemove={(makeId, modelId) => setCompareKeys((prev) => removeFromCompare(prev, { makeId, modelId }))}
            onOpen={goToModel}
            onClearAll={() => setCompareKeys([])}
            // `EX-SCR-197` (`D8-06`/`FV-15`) — « + Ajouter un modèle » : le sélecteur marque/modèle
            // du bandeau C1 (rendu sur `/comparer` depuis ce lot) est la voie d'ajout.
            onAddModel={() => navigate('/marche')}
            // `EX-SCR-198` (`D8-06`/`FV-15`) — redirections normatives : 0 modèle → écran A,
            // 1 modèle → écran B de ce modèle. `CompareScreen` étant sans hook, l'appel arrive
            // pendant le rendu : il est différé d'un tick pour ne pas naviguer depuis un rendu.
            onRedirect={(target: CompareRedirectTarget) => {
              // La redirection est décidée sur l'état RÉEL de la sélection de comparaison, pas sur
              // `rows` (qui est vide tant que `enterMode2` n'a pas répondu, y compris au tout premier
              // rendu d'une URL `/comparer?m=…` parfaitement peuplée).
              if (!compareWasPopulated.current || compareLoading) return;
              if (target.kind === 'market' && compareKeys.length !== 0) return;
              if (target.kind === 'model' && compareKeys.length !== 1) return;
              setTimeout(() => {
                if (target.kind === 'market') navigate(marketUrlFrom());
                else goToModel(target.makeId, target.modelId);
              }, 0);
            }}
          />
        );

      case 'savedSearches':
        return (
          <SavedSearchesScreen
            saved={stores.saved.list()}
            recent={stores.recent.list()}
            currentCountById={currentCounts}
            /* `EX-SCR-213` (`D8-31`, fix-screens-2 §8.2) — condition d'affichage de l'écart :
               il n'est rendu que si le snapshot a CHANGÉ depuis l'enregistrement. Absent ⇒ aucun
               écart, jamais un « + 0 ». */
            currentSnapshotId={descriptor?.snapshotId}
            /* `EX-SCR-212` — résolution de `<Marque> <Modèle>` du périmètre et des jetons `mmmv` de
               la description ; absent ⇒ repli sur les slugs de l'URL, jamais un identifiant nu. */
            taxonomy={referenceData}
            onGoToMarket={() => navigate('/marche')}
            onOpen={(url, id) => {
              // `EX-CRUD-6` (DR-102) : l'ouverture met à jour `dernier_accès_le` (les valeurs figées
              // d'`ARB-45` — `effectifInitial`, `snapshotInitial` — ne bougent jamais).
              if (id !== undefined) stores.saved.touch(id);
              bumpCrud();
              navigate(url);
            }}
            onRename={(id, nom) => {
              try {
                stores.saved.rename(id, nom);
              } catch (e) {
                setBanner(e instanceof Error ? e.message : 'Renommage refusé.');
              }
              bumpCrud();
            }}
            onDelete={(id) => {
              stores.saved.remove(id);
              bumpCrud();
            }}
            onClearHistory={() => {
              stores.recent.clear();
              bumpCrud();
            }}
          />
        );

      case 'followed':
        return (
          <FollowedScreen
            rows={stores.followed.list()}
            nameOf={(makeId, modelId) => modelName(referenceData, makeId, modelId)}
            currentCountOf={(makeId, modelId) => {
              const key = `${makeId}:${modelId}`;
              return currentCounts.has(key) ? (currentCounts.get(key) ?? null) : 'loading';
            }}
            onGoToMarket={() => navigate('/marche')}
            onOpen={goToModel}
            onUnfollow={(makeId, modelId) => {
              stores.followed.unfollow(makeId, modelId);
              bumpCrud();
            }}
          />
        );

      case 'mentions':
        return (
          <MentionsPage
            snapshotDate={controller.snapshotDescriptor?.capturedAt}
            sourceKind={start?.sourceKind ?? controller.capabilities.sourceKind}
            providerId={`${controller.capabilities.providerId} ${controller.capabilities.providerVersion} · snapshot ${controller.snapshotDescriptor?.snapshotId ?? '—'}`}
          />
        );

      case 'notFound':
        return (
          <section class="kycar-notfound" role="alert" aria-labelledby="kycar-notfound-title">
            <h1 id="kycar-notfound-title">Page introuvable</h1>
            <p>Le chemin « {view.path} » ne correspond à aucun écran connu.</p>
            <button type="button" onClick={() => navigate('/marche')}>
              Revenir au marché
            </button>
          </section>
        );
    }
  }

  function renderMode2(which: 'distribution' | 'listings'): JSX.Element {
    if (view.kind !== 'modelDistribution' && view.kind !== 'modelListings') return <></>;
    const { makeId, modelId } = view;
    const followed = stores.followed.isFollowed(makeId, modelId);
    const name = modelName(referenceData, makeId, modelId);

    // `DR-099` — écrans d'erreur `EX-NAV-19` (marque inconnue) et `EX-NAV-20` (modèle hors marque) :
    // message nommé, lien vers `/marche` AVEC les filtres courants conservés (jamais un écran vide).
    if (taxonomyRoute !== null && !taxonomyRoute.ok) {
      const error = taxonomyRoute.error;
      const title =
        error.kind === 'unknownMake'
          ? 'Marque inconnue'
          : 'Ce modèle n’existe pas pour cette marque';
      const detail =
        error.kind === 'unknownMake'
          ? `La marque « ${error.makeId} » ne figure pas dans le référentiel du snapshot.`
          : `Le modèle « ${error.modelId} » n’appartient pas à la marque « ${error.makeId} » dans le référentiel du snapshot.`;
      return (
        <section class="kycar-route-error" role="alert" aria-labelledby="kycar-route-error-title">
          <h1 id="kycar-route-error-title">{title}</h1>
          <p>{detail}</p>
          <p>
            <a
              href={marketUrlFrom()}
              onClick={(e: Event) => {
                e.preventDefault();
                navigate(marketUrlFrom());
              }}
            >
              Revenir au marché (vos filtres sont conservés)
            </a>
          </p>
        </section>
      );
    }

    // `D8-24` (`ET-CHARGE-INIT`, `EX-SCR-23`/`173`) : PREMIER calcul seulement — aucun payload
    // précédent à atténuer, l'écran annonce son chargement. Un RECALCUL (payload conservé) passe par
    // le rendu nominal avec `recalculating`, c'est-à-dire `ET-CHARGE-MAJ` (atténuation + barre).
    if (mode2 === null || (mode2.status === 'loading' && mode2.payload === undefined)) {
      return <div class="kycar-mode2-loading" aria-busy="true">Chargement des distributions…</div>;
    }
    if (mode2.status === 'error' || mode2.payload === undefined) {
      return (
        <section class="kycar-market-error" role="alert">
          <p>Les distributions n’ont pas pu être chargées ({mode2.errorCode ?? 'erreur'}).</p>
          <button type="button" onClick={() => setMode2Attempt((n) => n + 1)}>
            Réessayer
          </button>
        </section>
      );
    }
    const payload = mode2.payload;

    const toolbar = (
      <div class="kycar-model-toolbar no-print">
        <h1 class="kycar-model-title">{payload.makeModelName || name}</h1>
        {/* `EX-CRUD-4` (DR-102) : « Enregistrer cette recherche » est disponible sur les DEUX écrans. */}
        <MarketToolbar onSave={saveCurrentSearch} canSave={true} suggestedName={suggestedSearchName} />
        <div class="kycar-model-actions">
          <button type="button" aria-pressed={followed} onClick={() => toggleFollow(makeId, modelId)}>
            {followed ? 'Ne plus suivre' : 'Suivre'}
          </button>
          <button
            type="button"
            aria-pressed={compareKeys.some((k) => k.makeId === makeId && k.modelId === modelId)}
            disabled={compareKeys.length >= MAX_COMPARE && !compareKeys.some((k) => k.makeId === makeId && k.modelId === modelId)}
            onClick={() =>
              toggleCompare(makeId, modelId, !compareKeys.some((k) => k.makeId === makeId && k.modelId === modelId))
            }
          >
            Comparer
          </button>
          {which === 'distribution' ? (
            <button
              type="button"
              onClick={() => navigate(assembleUrl(listingsPath(makeId, modelId), currentQuery).url)}
            >
              Voir les annonces
            </button>
          ) : (
            <button type="button" onClick={() => goToModel(makeId, modelId)}>
              Voir les distributions
            </button>
          )}
        </div>
      </div>
    );

    // `EX-DATA-123bis` (DR-070/140/141) — métadonnées RÉELLES du snapshot servi, jamais inventées.
    const csvMeta: CsvMeta = {
      snapshotId: payload.batch.snapshotId,
      capturedAt: controller.snapshotDescriptor?.capturedAt ?? '',
      sourceKind: payload.sourceKind,
      filterQuery: currentQuery,
      sampleCoverage: controller.snapshotDescriptor?.coverageNote ?? 'NON_APPLICABLE',
      metricCoverage: '',
    };

    if (which === 'listings') {
      return (
        <>
          {toolbar}
          <ListingsScreen
            batch={payload.batch}
            recalc={payload.recalc}
            rows={payload.rows}
            selectionCount={payload.rows.length}
            makeModelName={payload.makeModelName}
            csvMeta={csvMeta}
            labels={listingsLabels}
            onOpenListing={(row) => openListing(payload.batch, row)}
            page={ui.page ?? 1}
            onPageChange={(page) => applyUiState({ ...ui, page })}
            sel={ui.sel ?? null}
            /* `EX-SCR-209` (`D8-15`) — régime détecté par la coquille, seule propriétaire du viewport. */
            regime={regime}
          />
        </>
      );
    }

    return (
      <>
        {toolbar}
        <DistributionScreen
          batch={payload.batch}
          recalc={payload.recalc}
          rows={payload.rows}
          ui={ui}
          makeModelName={payload.makeModelName}
          labels={distributionLabels}
          csvMeta={csvMeta}
          degraded={regime === 'compact'}
          isFollowed={followed}
          /* `EX-SCR-113bis` (`D8-06`/`FV-08`) — `modelId = 0` : mode « Modèle non identifié ». */
          modelId={modelId}
          /* `EX-SCR-31`/`175` (`D8-06`/`FV-07`) — bandeau C3 + ligne de représentativité. */
          snapshotCoverage={
            descriptor === null
              ? undefined
              : {
                  listingCount: descriptor.listingCount,
                  announcedListingCount: descriptor.announcedListingCount,
                  hasUserFilters: currentQuery !== '',
                }
          }
          onOpenMentions={() => navigate('/mentions')}
          /* `D8-24` (`ET-CHARGE-INIT`/`ET-CHARGE-MAJ`) — un recalcul est EN COURS sur ce périmètre. */
          recalculating={mode2.status === 'loading'}
          /* `EX-SCR-174`/`EX-SCR-26` (`D8-31`, fix-screens-2 §8.1) — bloc `ET-VIDE-FILTRES` de
             l'écran B. `activeFilterCount` est la valeur du BANDEAU (même fonction, même sélection) ;
             les suggestions sont mesurées « leave-one-out » sur le lot chargé. */
          activeFilterCount={countActiveFilters(selection)}
          topRestrictiveFilters={emptySelectionHints}
          onRemoveFilter={(filterId: string) => applyFilters(removalPatchFor(filterId))}
          onResetAllFilters={() => {
            // Mode 2 : « Réinitialiser tous les filtres » vide la REQUÊTE, jamais la route — le
            // périmètre marque/modèle est la page elle-même (`EX-NAV-2`), pas un filtre posé.
            setUrlCorrections([]);
            navigate(location.pathname, 'push');
          }}
          onSaveSearch={() => saveCurrentSearch(defaultSearchName())}
          onUiChange={(next) => applyUiState(next)}
          onApplyFilters={(patch) => applyFilters(patch)}
          onViewBrushedListings={(sel) =>
            applyUiState({ ...EMPTY_UI_STATE, sel }, listingsPath(makeId, modelId))
          }
          onViewListings={() => navigate(assembleUrl(listingsPath(makeId, modelId), currentQuery).url)}
          onCompare={() => {
            toggleCompare(makeId, modelId, true);
            navigate('/comparer');
          }}
          onFollow={() => toggleFollow(makeId, modelId)}
          onOpenListing={(row) => openListing(payload.batch, row)}
        />
      </>
    );
  }
}

/** `EX-SCR-196` (DR-088) — bucket de comparaison depuis un bin du moteur (mêmes bornes, même compte). */
function toCompareBucket(b: { lowerBound: number; upperBound: number; count: number }): {
  lowerBound: number;
  upperBound: number;
  count: number;
} {
  return { lowerBound: b.lowerBound, upperBound: b.upperBound, count: b.count };
}

/**
 * `D8-04b` / `FV-04` (`EX-SCR-104`) — couple marque/modèle COMPLET porté par `mmmv`, ou `null`.
 * Format du sélecteur (`screen-g-model.ts::serializeMmmv`) : `<makeId>` (marque seule, `D-09`) ou
 * `<makeId>|<modelId>`. Plusieurs blocs = sélection multiple : ce n'est pas la désignation d'UN
 * modèle, donc pas de redirection.
 */
function completeMmmvPair(selection: SelectionState): { makeId: number; modelId: number } | null {
  const raw = selection['makesModelsVariants'];
  if (raw === undefined) return null;
  const blocks = (Array.isArray(raw) ? raw : [raw]).map(String).filter((b) => b.length > 0);
  if (blocks.length !== 1) return null;
  const [makeIdStr, modelIdStr] = (blocks[0] as string).split('|');
  if (modelIdStr === undefined || modelIdStr.length === 0) return null;
  const makeId = Number(makeIdStr);
  const modelId = Number(modelIdStr);
  if (!Number.isFinite(makeId) || !Number.isFinite(modelId)) return null;
  return { makeId, modelId };
}

/** `FV-17` (`EX-SCR-126`) — drapeau de SESSION de l'amorce SANS-FILTRE (jamais persistant). */
const PRIMER_FLAG_KEY = 'kycar:primer-seen';
function readPrimerFlag(): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(PRIMER_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}
function writePrimerFlag(): void {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(PRIMER_FLAG_KEY, '1');
  } catch {
    // Stockage refusé (mode privé strict) : l'amorce reviendra, ce n'est pas une valeur affichée.
  }
}

/** `EX-SCR-96`/`97` (`D8-15`) — régime du bandeau de filtres, au vocabulaire de `band-model.ts`. */
function bandRegimeOf(regime: MarketRegime): BandRegime {
  return regime === 'compact' ? 'compact' : regime === 'intermediate' ? 'intermediaire' : 'large';
}

/** `EX-NFR-18` — régime responsive courant, mesuré sur les points de rupture partagés de `src/styles`. */
function detectRegime(): MarketRegime {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'large';
  if (window.matchMedia(MEDIA_QUERY_MOBILE).matches) return 'compact';
  if (window.matchMedia(MEDIA_QUERY_TABLET).matches) return 'intermediate';
  return 'large';
}

/** Nom lisible d'un couple marque/modèle depuis la taxonomie (repli explicite si inconnu). */
function modelName(ref: ReferenceData, makeId: number, modelId: number): string {
  const make = ref.makeById.get(makeId);
  const model = ref.modelByKey.get(`${makeId}:${modelId}`);
  const makeLabel = make?.label ?? `Marque ${makeId}`;
  const modelLabel = model?.label ?? (modelId === 0 ? 'Modèle non identifié' : `Modèle ${modelId}`);
  return `${makeLabel} ${modelLabel}`.trim();
}

function defaultSearchName(): string {
  return `Recherche du ${new Intl.DateTimeFormat('fr-BE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`;
}

/** Âge du snapshot en jours pleins, ou `null` si la date est absente/illisible (`EX-SCR-43`). */
function snapshotAgeDays(capturedAt: string | null): number | null {
  if (capturedAt === null) return null;
  const t = new Date(capturedAt).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

/** Date courte `JJ/MM/AAAA` (`EX-SCR-29`, bandeau dégradé daté). */
function frDate(iso: string | null): string {
  if (iso === null) return 'date inconnue';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat('fr-BE', { dateStyle: 'short' }).format(d);
}

/** `EX-SCR-43` (`D8-14`/`FV-17`) — date COURTE `JJ/MM` du jeton de snapshot (le reste en infobulle). */
function frDayMonth(iso: string | null): string {
  if (iso === null) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-BE', { day: '2-digit', month: '2-digit' }).format(d);
}

/** `EX-SCR-46` — effectif formaté à la française (séparateur d'unités de mille insécable). */
function formatCount(n: number): string {
  return new Intl.NumberFormat('fr-BE').format(n);
}

/** Horodatage court `JJ/MM/AAAA HH:MM` de la dernière tentative de mise à jour (`EX-NFR-22`). */
function frDateTime(iso: string | null): string {
  if (iso === null) return 'inconnue';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat('fr-BE', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}

/**
 * En-tête applicatif S0 (`EX-SCR-42`…`46`, DR-100) : QUATRE onglets (`Marché`, `Comparer (n)`,
 * `Recherches`, `Suivis (n)`), le jeton de snapshot daté (`EX-SCR-43`, âge 7/30 j), le fil d'Ariane
 * (`EX-SCR-45`) et les bandeaux d'état — dégradé DATÉ avec `Réessayer` et code d'erreur (`DR-093`),
 * source SYNTHETIC (`DR-094`), filtres non appliqués (`D-03`), message ponctuel.
 * `/mentions` n'est PAS un onglet : c'est un lien du pied de page (`EX-SCR-47`).
 */
function AppHeader(props: {
  readonly sourceKind: string | null;
  readonly snapshotDate: string | null;
  readonly compareCount: number;
  readonly followedCount: number;
  readonly banner: string | null;
  readonly banners: readonly ShellBanner[];
  readonly regime: MarketRegime;
  readonly currentQuery: string;
  readonly breadcrumbCount: number | undefined;
  readonly breadcrumbCountWithoutTaxonomy: number | null;
  readonly onDismissBanner: () => void;
  readonly onNavigate: (url: string) => void;
  readonly onRetry: () => void;
  readonly breadcrumb: readonly { readonly label: string; readonly href?: string }[];
}): JSX.Element {
  /** `EX-SCR-38` — bandeaux repliés derrière le jeton `+k avertissements`, dépliables. */
  const [bannersExpanded, setBannersExpanded] = useState(false);
  /** `EX-SCR-38` — bandeaux fermés par l'utilisateur (les non-repliables ne le sont jamais). */
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());
  /** `EX-SCR-48` (`D8-15`) — en régime compact, la navigation passe par un tiroir. */
  const [menuOpen, setMenuOpen] = useState(false);
  const compact = props.regime === 'compact';

  const live = props.banners.filter((b) => !dismissed.has(b.id));
  const shown = bannersExpanded ? live : live.slice(0, BANNER_STACK_MAX);
  const hiddenCount = live.length - shown.length;
  const links: ReadonlyArray<{ readonly href: string; readonly label: string }> = [
    { href: '/marche', label: 'Marché' },
    { href: '/comparer', label: 'Comparer' },
    { href: '/recherches', label: 'Recherches' },
    { href: '/suivis', label: 'Suivis' },
  ];
  /**
   * `EX-SCR-42` (`D8-14`/`FV-17`) — les deux onglets à cardinal portent leur compteur dans leur
   * libellé, MASQUÉ à zéro : « Comparer (0) » annonçait un cardinal là où il n'y a rien à compter.
   */
  const labelOfTab = (href: string, label: string): string => {
    if (href === '/comparer') return props.compareCount > 0 ? `Comparer (${props.compareCount})` : 'Comparer';
    if (href === '/suivis') return props.followedCount > 0 ? `Suivis (${props.followedCount})` : 'Suivis';
    return label;
  };
  // `EX-SCR-44` : comparer exige au moins 2 modèles — l'onglet reste visible mais inopérant.
  const compareDisabled = props.compareCount < 2;
  const age = snapshotAgeDays(props.snapshotDate);
  const freshness = age === null ? 'inconnu' : age < SNAPSHOT_FRESH_DAYS ? 'frais' : age < SNAPSHOT_STALE_DAYS ? 'ancien' : 'perime';
  /** `EX-SCR-43` (`D8-14`/`FV-17`) — jeton court `Snapshot <JJ/MM>` ; le détail va en infobulle. */
  const tokenLabel = `Snapshot ${frDayMonth(props.snapshotDate)}`;
  const tokenTooltip = `Snapshot du ${frDate(props.snapshotDate)}${age === null ? '' : ` — ${age} jour${age > 1 ? 's' : ''}`} (${freshness})`;
  /** `EX-SCR-42` (`D8-14`/`FV-17`) — la marque renvoie au marché AVEC les filtres courants. */
  const brandHref = assembleUrl('/marche', props.currentQuery).url;

  return (
    <header class="app-header kycar-header" data-regime={props.regime}>
      <a class="kycar-brand" href={brandHref} onClick={(e) => { e.preventDefault(); props.onNavigate(brandHref); }}>
        KYCAR
      </a>
      {compact ? (
        <button
          type="button"
          class="kycar-nav-toggle no-print"
          aria-expanded={menuOpen}
          aria-controls="kycar-nav-drawer"
          onClick={() => setMenuOpen((v) => !v)}
        >
          Menu
        </button>
      ) : null}
      <nav aria-label="Navigation principale" id="kycar-nav-drawer" class={compact && !menuOpen ? 'kycar-nav-drawer kycar-nav-drawer--closed' : 'kycar-nav-drawer'}>
        <ul class="kycar-nav">
          {links.map((l) => {
            const disabled = l.href === '/comparer' && compareDisabled;
            return (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-disabled={disabled ? 'true' : undefined}
                  class={disabled ? 'kycar-nav-link kycar-nav-link--disabled' : 'kycar-nav-link'}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!disabled) props.onNavigate(l.href);
                  }}
                >
                  {labelOfTab(l.href, l.label)}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* `EX-SCR-43` — jeton de snapshot : `Snapshot <JJ/MM>`, le reste en infobulle. */}
      <p class={`kycar-snapshot-token kycar-snapshot-token--${freshness}`} title={tokenTooltip}>
        {tokenLabel}
      </p>

      {/* `EX-DATA-107` (DR-094) — la source est dite sur TOUS les écrans, pas seulement /mentions. */}
      {props.sourceKind === 'SYNTHETIC' ? (
        <p class="status-banner kycar-banner-synthetic" role="status">
          {SYNTHETIC_NOTICE}
        </p>
      ) : null}

      {/* `EX-SCR-45` — fil d'Ariane. */}
      <nav class="kycar-breadcrumb no-print" aria-label="Fil d’Ariane">
        <ol>
          {props.breadcrumb.map((crumb, i) => (
            <li key={`${crumb.label}-${i}`}>
              {crumb.href === undefined ? (
                <span aria-current="page">{crumb.label}</span>
              ) : (
                <a href={crumb.href} onClick={(e) => { e.preventDefault(); props.onNavigate(crumb.href as string); }}>
                  {crumb.label}
                </a>
              )}
            </li>
          ))}
        </ol>
        {/* `EX-SCR-46` (`D8-05`/`FV-23`) — double compteur : offres de la sélection hors taxonomie,
            puis effectif du périmètre courant. Chaque nombre absent est tu, jamais remplacé par 0. */}
        {props.breadcrumbCount !== undefined || props.breadcrumbCountWithoutTaxonomy !== null ? (
          <p class="kycar-breadcrumb-counts">
            {props.breadcrumbCountWithoutTaxonomy !== null
              ? `${formatCount(props.breadcrumbCountWithoutTaxonomy)} offres | `
              : ''}
            {props.breadcrumbCount === undefined ? '— ici' : `${formatCount(props.breadcrumbCount)} ici`}
          </p>
        ) : null}
      </nav>

      {/* `EX-SCR-38` — pile de bandeaux d'état : au plus deux, le reste derrière `+k`. */}
      {shown.map((b) => (
        <div key={b.id} class={`status-banner ${b.className}`} role="status" data-banner-id={b.id}>
          <span class="kycar-banner-text">{b.text}</span>
          {b.retry === true ? (
            <button type="button" class="no-print" onClick={props.onRetry}>
              Réessayer
            </button>
          ) : null}
          {b.dismissible ? (
            <button
              type="button"
              class="no-print"
              aria-label="Fermer ce bandeau"
              onClick={() => setDismissed((prev) => new Set(prev).add(b.id))}
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
      {hiddenCount > 0 ? (
        <button type="button" class="kycar-banner-more no-print" onClick={() => setBannersExpanded(true)}>
          +{hiddenCount} avertissement{hiddenCount > 1 ? 's' : ''}
        </button>
      ) : null}
      {bannersExpanded && live.length > BANNER_STACK_MAX ? (
        <button type="button" class="kycar-banner-more no-print" onClick={() => setBannersExpanded(false)}>
          Replier les avertissements
        </button>
      ) : null}

      {props.banner !== null ? (
        <div class="status-banner kycar-banner-message" role="status">
          <span>{props.banner}</span>
          <button type="button" class="no-print" onClick={props.onDismissBanner} aria-label="Fermer le message">
            ×
          </button>
        </div>
      ) : null}
    </header>
  );
}

/**
 * Pied de page obligatoire (`EX-SCR-47`, DR-100) : mention juridique, date du snapshot, lien
 * `/mentions` et panneau Diagnostic repliable (`<details>`, aucun état à porter).
 */
function AppFooter(props: {
  readonly sourceKind: string | null;
  readonly snapshotDate: string | null;
  readonly diagnostics: readonly (readonly [string, string])[];
  readonly onNavigate: (url: string) => void;
  readonly onRefresh: () => void;
}): JSX.Element {
  return (
    <footer class="kycar-footer">
      <p class="kycar-footer-legal">
        Source : AutoScout24 — agrégat non affilié. Données du {frDate(props.snapshotDate)}
        {props.sourceKind === 'SYNTHETIC' ? ' — jeu de données synthétique de démonstration' : ''}.
      </p>
      <p class="kycar-footer-links no-print">
        <a href="/mentions" onClick={(e) => { e.preventDefault(); props.onNavigate('/mentions'); }}>
          Mentions légales
        </a>
      </p>
      <details class="kycar-footer-diagnostic no-print">
        <summary>Diagnostic</summary>
        <dl>
          {props.diagnostics.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {/* `EX-NAV-23`/`25` (`D8-14`/`FV-21`) — action explicite de rafraîchissement du snapshot :
            elle relâche le jeu de données courant et REDEMANDE le snapshot au provider. */}
        <p class="kycar-footer-refresh">
          <button type="button" onClick={props.onRefresh}>
            Rafraîchir les données
          </button>
        </p>
      </details>
    </footer>
  );
}

/**
 * Barre d'action de l'écran A : « Enregistrer cette recherche » (EX-CRUD-4, dispo sur les 2 écrans).
 *
 * `EX-SCR-94` (`D8-14`/`FV-24`) — le champ est PRÉREMPLI par la description des filtres actifs
 * (`buildSearchDescription`, même modèle que `SaveSearchForm` du bandeau : « Opel Corsa · ≤ 20 000 €
 * · Belgique »), et non plus laissé vide pour retomber sur « Recherche du <date> ».
 */
function MarketToolbar(props: {
  readonly onSave: (nom: string) => void;
  readonly canSave: boolean;
  readonly suggestedName: string;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  return (
    <div class="kycar-market-toolbar no-print">
      {open ? (
        <form
          class="kycar-save-form"
          onSubmit={(e: Event) => {
            e.preventDefault();
            const clean = name.trim();
            if (clean.length > 0) {
              props.onSave(clean);
              setName('');
              setOpen(false);
            }
          }}
        >
          <label>
            <span class="kycar-visually-hidden">Nom de la recherche</span>
            <input
              value={name}
              maxLength={60}
              placeholder="Nom de la recherche"
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
            />
          </label>
          <button type="submit">Enregistrer</button>
          <button type="button" onClick={() => setOpen(false)}>
            Annuler
          </button>
        </form>
      ) : (
        <button
          type="button"
          disabled={!props.canSave}
          onClick={() => {
            setName(props.suggestedName);
            setOpen(true);
          }}
        >
          Enregistrer cette recherche
        </button>
      )}
    </div>
  );
}
