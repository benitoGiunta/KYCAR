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
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import type { JSX } from 'preact';

import type { DataController, Mode2Payload, StartResult } from './orchestration/data-controller';
import type { ReferenceData } from './types/reference';
import type { ModelAggregate } from './providers/DataProvider';
import type { SelectionState } from './state/filter-types';
import { assembleUrl, serializeQuery } from './state/url-codec';
import { loadQuery } from './state/corrections';
import { serializeSelection } from './types/selection';
import { FILTER_DEFAULTS } from './state/filter-registry';
import { buildPath, carryFiltersAcrossMode, resolveTaxonomyRoute, type TaxonomyRouteResult } from './state/router';
import { FilterBand } from './components/filters/FilterBand';
import {
  deriveScreenAState,
  type LoadPhase,
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
} from './screens/compare/index';
import { SavedSearchesScreen } from './screens/saved/index';
import { FollowedScreen } from './screens/followed/index';
import { MentionsPage } from './screens/mentions/index';
import type { SelectionInput } from './types/index';
import type { VocabularyName } from './types/vocabularies';
import { MEDIA_QUERY_MOBILE, MEDIA_QUERY_TABLET } from './styles/breakpoints';
import { resolveView, routeOfView, currentLocation, type AppView } from './app/navigation';
import { CapExceededError } from './persistence/index';
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

/** `EX-SCR-43` — âges du jeton de snapshot (vert < 7 j, ambre < 30 j, rouge au-delà). */
const SNAPSHOT_FRESH_DAYS = 7;
const SNAPSHOT_STALE_DAYS = 30;

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
  const selection = useMemo<SelectionState>(() => loadQuery(location.search).selection, [location.search]);
  const currentQuery = useMemo(
    () => serializeQuery(selection, {}, { filterDefaults: FILTER_DEFAULTS }),
    [selection],
  );

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
    setMode2({ key, status: 'loading' });
    void controller
      .enterMode2(view.makeId, view.modelId, selection)
      .then((payload) => setMode2({ key, status: 'ready', payload }))
      .catch((e) => setMode2({ key, status: 'error', errorCode: e instanceof Error ? e.message : String(e) }));
  }, [start, view, currentQuery, mode2Attempt, taxonomyRoute]);

  useEffect(() => {
    const unsubs = [stores.saved.subscribe(bumpCrud), stores.followed.subscribe(bumpCrud), stores.recent.subscribe(bumpCrud)];
    return () => unsubs.forEach((u) => u());
  }, [stores, bumpCrud]);

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
  const [expandedMakeIds, setExpandedMakeIds] = useState<ReadonlySet<number>>(new Set());
  const [loadedMakeCount, setLoadedMakeCount] = useState(GRID_LOAD_BATCH_SIZE * 3);
  const [showAllMakes, setShowAllMakes] = useState(false);
  const [screenGOpen, setScreenGOpen] = useState(false);

  const applyMode1Query = useCallback(
    (sel: SelectionState, mode: 'push' | 'replace' = 'push'): void => {
      const q = serializeQuery(sel, {}, { filterDefaults: FILTER_DEFAULTS });
      navigate(assembleUrl('/marche', q).url, mode);
    },
    [navigate],
  );

  const onToggleExpand = useCallback(
    (makeId: number, next: boolean): void => {
      setExpandedMakeIds((prev) => {
        const s = new Set(prev);
        if (next) s.add(makeId);
        else s.delete(makeId);
        return s;
      });
      if (next && !modelsByMake.has(makeId)) {
        void controller
          .loadModelsForMake(selection, makeId)
          .then((models) => setModelsByMake((prev) => new Map(prev).set(makeId, models)))
          .catch(() => setModelsByMake((prev) => new Map(prev).set(makeId, 'unavailable')));
      }
    },
    [controller, selection, modelsByMake],
  );

  const goToModel = useCallback(
    (makeId: number, modelId: number): void => {
      const make = referenceData.makeById.get(makeId);
      const model = referenceData.modelByKey.get(`${makeId}:${modelId}`);
      navigate(
        buildPath({
          name: 'modelDistribution',
          makeId,
          makeSlug: make?.slug ?? String(makeId),
          modelId,
          modelSlug: model?.slug ?? String(modelId),
        }),
      );
    },
    [navigate, referenceData],
  );

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
      const data = marketPhase.phase === 'loaded' ? marketPhase.data : null;
      const effectifInitial = data ? data.makeAggregates.reduce((s, a) => s + a.listingCount, 0) : 0;
      try {
        stores.saved.create({
          nom,
          url: location.pathname + location.search,
          effectifInitial,
          snapshotInitial: controller.snapshotDescriptor?.snapshotId ?? '',
        });
        setBanner(stores.saved.hasDuplicateName(nom) ? 'Recherche enregistrée (un nom identique existait déjà).' : 'Recherche enregistrée.');
        bumpCrud();
      } catch (e) {
        setBanner(e instanceof CapExceededError ? e.message : e instanceof Error ? e.message : 'Échec de l’enregistrement.');
      }
    },
    [marketPhase, location, controller, stores, bumpCrud],
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
      const trail: { label: string; href?: string }[] = [
        { label: 'Marché', href: marketUrlFrom({ makeId: view.makeId, modelId: view.modelId }) },
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

  /** `EX-SCR-47` — panneau Diagnostic du pied de page (état d'orchestration, jamais une donnée R3). */
  const diagnostics = useMemo<readonly (readonly [string, string])[]>(
    () => [
      ['Statut du démarrage', start?.status ?? 'en cours'],
      ['Source', start?.sourceKind ?? 'inconnue'],
      ['Snapshot', controller.snapshotDescriptor?.snapshotId ?? '—'],
      ['Annonces du snapshot', String(controller.snapshotDescriptor?.listingCount ?? '—')],
      ['Code d’erreur', start?.errorCode ?? 'aucun'],
      ['Dernière tentative', start?.attemptedAt ?? '—'],
      ['Requête canonique', currentQuery === '' ? '(aucun filtre)' : currentQuery],
      ['Régime d’affichage', regime],
    ],
    [start, controller, currentQuery, regime],
  );

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
    if (heading !== null && typeof heading.focus === 'function') heading.focus();
  }, [view, referenceData]);

  // ---- Composition ------------------------------------------------------------------------------
  const degraded = start?.status === 'degraded-cache' || controller.isDegraded;
  const filterBandMode = view.kind === 'modelDistribution' || view.kind === 'modelListings' ? 'mode2' : 'mode1';
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

  /** `EX-NFR-31` (DR-154) — résumé TEXTUEL des filtres actifs, imprimé à la place du bandeau. */
  const printFilterSummary =
    currentQuery === '' ? 'Aucun filtre actif' : `Filtres actifs : ${currentQuery.replace(/&/g, ' · ')}`;

  /** `ET-FILTRE-NON-APPLIQUE` (D-03, DR-103) — bandeau nommant les filtres non appliqués. */
  const unapplied = loadedData?.unappliedFilterIds ?? [];

  return (
    <div class="kycar-app" data-crud-rev={crudTick}>
      {/* `EX-NFR-12` (DR-101) — lien d'évitement : premier élément focalisable de la page. */}
      <a class="kycar-skip-link no-print" href="#kycar-main">
        Aller au contenu principal
      </a>
      <AppHeader
        degraded={degraded}
        degradedSince={start?.status === 'degraded-cache' ? (descriptor?.capturedAt ?? null) : null}
        errorCode={start?.errorCode ?? null}
        attemptedAt={start?.attemptedAt ?? null}
        sourceKind={sourceKind}
        snapshotId={descriptor?.snapshotId ?? null}
        snapshotDate={descriptor?.capturedAt ?? null}
        compareCount={compareKeys.length}
        followedCount={stores.followed.list().length}
        banner={banner}
        unappliedFilterIds={unapplied}
        onDismissBanner={() => setBanner(null)}
        onNavigate={navigate}
        onRetry={() => void controller.start().then(onStarted)}
        breadcrumb={breadcrumb}
      />

      {view.kind === 'market' || view.kind === 'modelDistribution' || view.kind === 'modelListings' ? (
        <div class="filter-bar kycar-filter-bar">
          <FilterBand
            key={`${location.pathname}${location.search}`}
            mode={filterBandMode}
            initialSelection={selection}
            originAndPath={location.pathname}
            referenceData={referenceData}
            onHistoryReplace={(url) => navigate(url, 'replace')}
            onHistoryPush={(url) => navigate(url, 'push')}
            onRecomputeLocal={() => {
              if (view.kind === 'market') void reloadMarket(selection);
            }}
            onReload={() => {
              // `EX-NAV-24` (DR-155) : un remplacement de snapshot purge la sélection de comparaison
              // (des identifiants d'un autre snapshot) et libère le moteur (jeu de données obsolète).
              setCompareKeys([]);
              setCompareRows([]);
              controller.dispose();
              void controller.start().then((r) => {
                setStart(r);
                if (view.kind === 'market') void reloadMarket(selection);
              });
            }}
            onUrlBudgetExceeded={(msg) => setBanner(msg)}
          />
          {/* `EX-NFR-31` (DR-154) : le bandeau de filtres disparaît à l'impression, ce résumé le remplace. */}
          <p class="kycar-print-filter-summary print-filter-summary">{printFilterSummary}</p>
        </div>
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
        const state = deriveScreenAState(load);
        return (
          <>
            <MarketToolbar onSave={saveCurrentSearch} canSave={marketPhase.phase === 'loaded'} />
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
              onSelectMake={(makeId) => onToggleExpand(makeId, !expandedMakeIds.has(makeId))}
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
              onResetAllFilters={() => navigate('/marche')}
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
          />
        );

      case 'savedSearches':
        return (
          <SavedSearchesScreen
            saved={stores.saved.list()}
            recent={stores.recent.list()}
            currentCountById={currentCounts}
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

    if (mode2 === null || mode2.status === 'loading') {
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
        <MarketToolbar onSave={saveCurrentSearch} canSave={true} />
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
              onClick={() =>
                navigate(
                  buildPath({
                    name: 'modelListings',
                    makeId,
                    makeSlug: referenceData.makeById.get(makeId)?.slug ?? String(makeId),
                    modelId,
                    modelSlug: referenceData.modelByKey.get(`${makeId}:${modelId}`)?.slug ?? String(modelId),
                  }),
                )
              }
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
  readonly degraded: boolean;
  readonly degradedSince: string | null;
  readonly errorCode: string | null;
  readonly attemptedAt: string | null;
  readonly sourceKind: string | null;
  readonly snapshotId: string | null;
  readonly snapshotDate: string | null;
  readonly compareCount: number;
  readonly followedCount: number;
  readonly banner: string | null;
  readonly unappliedFilterIds: readonly string[];
  readonly onDismissBanner: () => void;
  readonly onNavigate: (url: string) => void;
  readonly onRetry: () => void;
  readonly breadcrumb: readonly { readonly label: string; readonly href?: string }[];
}): JSX.Element {
  const links: ReadonlyArray<{ readonly href: string; readonly label: string }> = [
    { href: '/marche', label: 'Marché' },
    { href: '/comparer', label: 'Comparer' },
    { href: '/recherches', label: 'Recherches' },
    { href: '/suivis', label: 'Suivis' },
  ];
  /** `EX-SCR-42` — les deux onglets à cardinal portent leur compteur dans leur libellé. */
  const labelOfTab = (href: string, label: string): string => {
    if (href === '/comparer') return `Comparer (${props.compareCount})`;
    if (href === '/suivis') return `Suivis (${props.followedCount})`;
    return label;
  };
  // `EX-SCR-44` : comparer exige au moins 2 modèles — l'onglet reste visible mais inopérant.
  const compareDisabled = props.compareCount < 2;
  const age = snapshotAgeDays(props.snapshotDate);
  const freshness = age === null ? 'inconnu' : age < SNAPSHOT_FRESH_DAYS ? 'frais' : age < SNAPSHOT_STALE_DAYS ? 'ancien' : 'perime';

  return (
    <header class="app-header kycar-header">
      <a class="kycar-brand" href="/marche" onClick={(e) => { e.preventDefault(); props.onNavigate('/marche'); }}>
        KYCAR
      </a>
      <nav aria-label="Navigation principale">
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

      {/* `EX-SCR-43` — jeton de snapshot : identifiant, date et âge (7 j / 30 j). */}
      <p class={`kycar-snapshot-token kycar-snapshot-token--${freshness}`}>
        Snapshot {props.snapshotId ?? '—'} du {frDate(props.snapshotDate)}
        {age === null ? '' : ` (${age} j)`}
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
      </nav>

      {props.degraded ? (
        <div class="status-banner kycar-banner-degraded" role="status">
          Mode dégradé — Données du {frDate(props.degradedSince)} — dernière tentative de mise à jour
          échouée le {frDateTime(props.attemptedAt)} (code {props.errorCode ?? 'inconnu'}). Les
          agrégats marqués d’un astérisque proviennent du cache ; l’export est désactivé.
          <button type="button" class="no-print" onClick={props.onRetry}>
            Réessayer
          </button>
        </div>
      ) : null}

      {props.unappliedFilterIds.length > 0 ? (
        <div class="status-banner kycar-banner-unapplied" role="status">
          Agrégats filtrés indisponibles — {props.unappliedFilterIds.length === 1 ? 'le filtre' : 'les filtres'}{' '}
          {props.unappliedFilterIds.join(', ')}{' '}
          {props.unappliedFilterIds.length === 1 ? "n’a pas pu être appliqué" : "n’ont pas pu être appliqués"} :
          les chiffres affichés sont ceux de la sélection NON filtrée.
        </div>
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
      </details>
    </footer>
  );
}

/** Barre d'action de l'écran A : « Enregistrer cette recherche » (EX-CRUD-4, dispo sur les 2 écrans). */
function MarketToolbar(props: { readonly onSave: (nom: string) => void; readonly canSave: boolean }): JSX.Element {
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
        <button type="button" disabled={!props.canSave} onClick={() => setOpen(true)}>
          Enregistrer cette recherche
        </button>
      )}
    </div>
  );
}
