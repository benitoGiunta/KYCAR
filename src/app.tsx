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
import { FILTER_DEFAULTS } from './state/filter-registry';
import { buildPath } from './state/router';
import { FilterBand } from './components/filters/FilterBand';
import {
  deriveScreenAState,
  type LoadPhase,
  type ScreenALoadedData,
} from './screens/market/state';
import { MarketScreen, type PrimerShortcutId } from './screens/market/MarketScreen';
import { GRID_LOAD_BATCH_SIZE } from './screens/market/thresholds';
import type { MakeSortField, SortDirection } from './screens/market/sort';
import {
  DistributionScreen,
  EMPTY_UI_STATE,
  readDistributionUiState,
  writeDistributionUiState,
  type DistributionUiState,
} from './screens/distribution/index';
import { ListingsScreen } from './screens/listings/index';
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
import { resolveView, currentLocation, type AppView } from './app/navigation';
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
  useEffect(() => {
    if (view.kind === 'market' || view.kind === 'modelDistribution') {
      stores.recent.visit(location.pathname + location.search);
      bumpCrud();
    }
  }, [location.pathname, location.search, view.kind]);

  // ---- Mode 2 : entrée dans l'écran B/D (O17, élagage avant M1/M2) -------------------------------
  const [mode2, setMode2] = useState<Mode2State | null>(null);
  useEffect(() => {
    if (start === null) return;
    if (view.kind !== 'modelDistribution' && view.kind !== 'modelListings') return;
    const key = `${view.makeId}:${view.modelId}`;
    if (mode2?.key === key && mode2.status !== 'error') return;
    setMode2({ key, status: 'loading' });
    void controller
      .enterMode2(view.makeId, view.modelId)
      .then((payload) => setMode2({ key, status: 'ready', payload }))
      .catch((e) => setMode2({ key, status: 'error', errorCode: e instanceof Error ? e.message : String(e) }));
  }, [start, view]);

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
  useEffect(() => {
    if (view.kind !== 'compare' || start === null) {
      return;
    }
    let live = true;
    void (async () => {
      const rows: CompareModelRow[] = [];
      for (const key of compareKeys) {
        const models = await controller.loadModelsForMake({}, key.makeId).catch(() => [] as readonly ModelAggregate[]);
        const agg = models.find((m) => m.modelId === key.modelId);
        if (agg !== undefined) {
          rows.push({
            makeId: key.makeId,
            modelId: key.modelId,
            name: modelName(referenceData, key.makeId, key.modelId),
            listingCount: agg.listingCount,
            price: agg.price,
            year: agg.year,
            mileage: agg.mileage,
          });
        }
      }
      if (live) setCompareRows(rows);
    })();
    return () => {
      live = false;
    };
  }, [view.kind, compareKeys, start, controller, referenceData]);

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

  // ---- Composition ------------------------------------------------------------------------------
  const degraded = start?.status === 'degraded-cache' || controller.isDegraded;
  const filterBandMode = view.kind === 'modelDistribution' || view.kind === 'modelListings' ? 'mode2' : 'mode1';

  return (
    <div class="kycar-app" data-crud-rev={crudTick}>
      <AppHeader degraded={degraded} banner={banner} onDismissBanner={() => setBanner(null)} onNavigate={navigate} />

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
              void controller.start().then((r) => {
                setStart(r);
                if (view.kind === 'market') void reloadMarket(selection);
              });
            }}
            onUrlBudgetExceeded={(msg) => setBanner(msg)}
          />
        </div>
      ) : null}

      <main class="kycar-main">
        {renderView()}
      </main>
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
              onRetryProvider={() => void reloadMarket(selection)}
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
            onOpen={(url) => navigate(url)}
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
            sourceKind={start?.sourceKind ?? null}
            providerId={controller.snapshotDescriptor?.providerVersion}
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

    if (mode2 === null || mode2.status === 'loading') {
      return <div class="kycar-mode2-loading" aria-busy="true">Chargement des distributions…</div>;
    }
    if (mode2.status === 'error' || mode2.payload === undefined) {
      return (
        <section class="kycar-market-error" role="alert">
          <p>Les distributions n’ont pas pu être chargées ({mode2.errorCode ?? 'erreur'}).</p>
          <button type="button" onClick={() => setMode2({ key: `${makeId}:${modelId}`, status: 'loading' })}>
            Réessayer
          </button>
        </section>
      );
    }
    const payload = mode2.payload;

    const toolbar = (
      <div class="kycar-model-toolbar no-print">
        <h1 class="kycar-model-title">{payload.makeModelName || name}</h1>
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

    if (which === 'listings') {
      const csvMeta: CsvMeta = {
        snapshotId: payload.batch.snapshotId,
        capturedAt: controller.snapshotDescriptor?.capturedAt ?? '',
        sourceKind: payload.sourceKind,
        filterQuery: currentQuery,
        sampleCoverage: 'NON_APPLICABLE',
        metricCoverage: '',
      };
      return (
        <>
          {toolbar}
          <ListingsScreen
            batch={payload.batch}
            recalc={payload.recalc}
            rows={payload.rows}
            selectionCount={payload.batch.rowCount}
            makeModelName={payload.makeModelName}
            csvMeta={csvMeta}
          />
        </>
      );
    }

    const ui: DistributionUiState =
      typeof URLSearchParams !== 'undefined'
        ? readDistributionUiState(new URLSearchParams(location.search))
        : EMPTY_UI_STATE;
    return (
      <>
        {toolbar}
        <DistributionScreen
          batch={payload.batch}
          recalc={payload.recalc}
          rows={payload.rows}
          ui={ui}
          makeModelName={payload.makeModelName}
          onUiChange={(next) => {
            const uiObj: Record<string, string> = Object.fromEntries(writeDistributionUiState(next));
            const q = serializeQuery(selection, uiObj, { filterDefaults: FILTER_DEFAULTS });
            navigate(assembleUrl(location.pathname, q).url, 'replace');
          }}
          onOpenListing={() => navigate(
            buildPath({
              name: 'modelListings',
              makeId,
              makeSlug: referenceData.makeById.get(makeId)?.slug ?? String(makeId),
              modelId,
              modelSlug: referenceData.modelByKey.get(`${makeId}:${modelId}`)?.slug ?? String(modelId),
            }),
          )}
        />
      </>
    );
  }
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

/** En-tête applicatif : navigation principale + bandeaux d'état (dégradé, message ponctuel). */
function AppHeader(props: {
  readonly degraded: boolean;
  readonly banner: string | null;
  readonly onDismissBanner: () => void;
  readonly onNavigate: (url: string) => void;
}): JSX.Element {
  const links: ReadonlyArray<{ readonly href: string; readonly label: string }> = [
    { href: '/marche', label: 'Marché' },
    { href: '/comparer', label: 'Comparer' },
    { href: '/recherches', label: 'Recherches' },
    { href: '/suivis', label: 'Suivis' },
    { href: '/mentions', label: 'Mentions' },
  ];
  return (
    <header class="app-header kycar-header">
      <a class="kycar-brand" href="/marche" onClick={(e) => { e.preventDefault(); props.onNavigate('/marche'); }}>
        KYCAR
      </a>
      <nav aria-label="Navigation principale">
        <ul class="kycar-nav">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={(e) => { e.preventDefault(); props.onNavigate(l.href); }}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {props.degraded ? (
        <div class="status-banner kycar-banner-degraded" role="status">
          Mode dégradé : dernier résultat connu affiché (les données n’ont pas pu être rafraîchies).
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
