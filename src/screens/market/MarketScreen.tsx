/**
 * KYCAR — Écran A, survol du marché (lot D6), point de montage public
 * =================================================================================================
 * Composant Preact MONTABLE isolément, même convention que `FilterBand.tsx` (D5,
 * `docs/plans/ARCHITECTURE.md` §7.1 : « expose des composants montables ; l'intégration globale est
 * le lot D8 »). Ne câble RIEN dans `src/app.tsx`. D6 NE POSSÈDE PAS le `DataProvider`/moteur
 * (`AggregationEngine`) : comme `FilterBand` ne calcule rien elle-même et attend `onReload`/
 * `onRecomputeLocal` de son hôte, `MarketScreen` attend un `ScreenAState` déjà résolu (`state.ts`)
 * — c'est D8 (ou un harnais de test) qui appelle le `DataProvider`/moteur et construit cet état.
 * Décision de conception documentée dans le rapport de lot, pas seulement ici.
 *
 * Les 6 états rendables (`state.ts`, `deriveScreenAState`) sont un `switch` exhaustif sur
 * `state.kind` : `noFallthroughCasesInSwitch` (tsconfig) garantit qu'aucun n'est oublié au fil des
 * évolutions futures.
 *
 * Montage de l'écran G (`ScreenG`, D5, `src/components/filters/ScreenG.tsx`) : EXACTEMENT comme
 * `FilterBand` le fait déjà (voir son code) — un état local `screenGOpen` (ici tenu par l'appelant
 * via `screenGOpen`/`onOpenScreenG`/`onCancelScreenG`, pour que l'ouverture par un bouton de
 * `MarketScreen` ET par un futur bouton d'un autre écran partagent le même état hôte), une
 * sélection courante minimale reconstituée depuis `currentMmmv` (`MarketScreen` ne possède pas
 * l'état de sélection complet des 77 filtres — seul `mmmv` l'intéresse), et `onApply(mmmv)` qui
 * relaie la chaîne sérialisée à l'hôte (qui met à jour l'URL/le filtre réel, hors périmètre D6).
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';

import { ScreenG, type ScreenGReferenceData } from '../../components/filters/ScreenG';
import type { SelectionState } from '../../state/filter-types';
import type { Model } from '../../types/entities';
import { buildAggregateCsv, buildAggregateCsvFileName, type AggregateCsvMeta } from './csv';
import { buildC3Banner } from './coverage';
import { formatInteger } from './format';
import { GridFooter } from './GridFooter';
import { MakeCard } from './MakeCard';
import {
  MAKE_COUNT_WARNING_THRESHOLD,
  MODELS_VISIBLE_BEFORE_COLLAPSE,
  NO_FILTER_TEASER_MAKE_COUNT,
  GRID_LOAD_BATCH_SIZE,
  GRID_VIRTUALIZATION_MOUNTED_CARDS,
  COLLAPSED_CARD_HEIGHT_PX,
  shouldVirtualizeGrid,
} from './thresholds';
import { sortMakeRows, type MakeSortField, type SortDirection, type SortableMakeRow } from './sort';
import { SummaryBar } from './SummaryBar';
import type { RestrictiveFilterHint, ScreenAState } from './state';
import { buildMakeCardViewModel, marketModelCardinal, type MakeCardViewModel } from './view-model';
import './market.css';

/** `EX-SCR-20`/`135`/`136`/`137` — les trois régimes responsives de l'écran A. */
export type MarketRegime = 'compact' | 'intermediate' | 'large';

/** Défaut de `regime` quand l'hôte (D8, seul propriétaire du viewport) ne le fournit pas encore : une
 * estimation par `matchMedia`, alignée sur les points de rupture de `market.css` (768/1280 px),
 * sinon `'large'` (SSR ou environnement sans `window`). Un composant MONTABLE isolément (test,
 * storybook) reste ainsi utilisable sans hôte ; en production, D8 passe `regime` explicitement
 * (voir le rapport de lot, § « Câblage attendu de fix-app »). */
function defaultRegimeFromViewport(): MarketRegime {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'large';
  if (window.matchMedia('(max-width: 767.98px)').matches) return 'compact';
  if (window.matchMedia('(max-width: 1279.98px)').matches) return 'intermediate';
  return 'large';
}

export type PrimerShortcutId = 'budget-10000' | 'budget-20000' | 'mileage-100000' | 'registration-2020';

const PRIMER_SHORTCUTS: ReadonlyArray<{ readonly id: PrimerShortcutId; readonly label: string }> = [
  { id: 'budget-10000', label: 'Budget ≤ 10 000 €' },
  { id: 'budget-20000', label: 'Budget ≤ 20 000 €' },
  { id: 'mileage-100000', label: 'Moins de 100 000 km' },
  { id: 'registration-2020', label: 'Immatriculées depuis 2020' },
];

export interface MarketScreenProps {
  readonly state: ScreenAState;
  readonly referenceData: ScreenGReferenceData | undefined;

  readonly sortField: MakeSortField;
  readonly sortDirection: SortDirection;
  readonly onSortFieldChange: (field: MakeSortField) => void;
  readonly onSortDirectionToggle: () => void;

  readonly hideSparseModels: boolean;
  readonly onToggleHideSparseModels: (next: boolean) => void;

  readonly expandedMakeIds: ReadonlySet<number>;
  readonly onToggleExpand: (makeId: number, next: boolean) => void;

  /** Nombre de cartes chargées dans la grille continue (`EX-SCR-129`) — l'hôte l'incrémente par
   * `GRID_LOAD_BATCH_SIZE` sur `onLoadMoreMakes`. Ignoré à l'état `no-filter` (seuil dédié). */
  readonly loadedMakeCount: number;
  readonly onLoadMoreMakes: () => void;

  /** `EX-SCR-125` : passe outre le plafond des 20 premières marques de l'état `SANS-FILTRE`. */
  readonly showAllMakesRequested: boolean;
  readonly onShowAllMakes: () => void;
  readonly onApplyPrimerShortcut: (shortcut: PrimerShortcutId) => void;

  readonly onSelectMake: (makeId: number) => void;
  readonly onSelectModel: (makeId: number, modelId: number) => void;

  readonly compareSelection: ReadonlySet<string>;
  readonly compareAtCapacity: boolean;
  readonly onToggleCompare?: (makeId: number, modelId: number, next: boolean) => void;

  readonly onRetryProvider: () => void;
  readonly onRetryMakeModels?: (makeId: number) => void;
  readonly onRemoveFilter?: (filterId: string) => void;
  readonly onResetAllFilters?: () => void;
  readonly onSaveSearch?: () => void;

  readonly screenGOpen: boolean;
  readonly onOpenScreenG: () => void;
  readonly onCancelScreenG: () => void;
  readonly onApplyScreenG: (mmmv: string) => void;
  readonly currentMmmv?: string;

  /** `EX-SCR-20`/`135` — régime responsive courant, détecté par l'hôte D8 (seul propriétaire du
   * viewport). Absent : repli sur `defaultRegimeFromViewport()` (voir plus haut). */
  readonly regime?: MarketRegime;

  /** `EX-DATA-123bis` — métadonnées des 3 lignes d'en-tête de l'export CSV et du nom de fichier
   * normatif. Absentes : reploi explicite (`buildAggregateCsvFileName`/`AggregateCsvMeta`), jamais
   * une valeur inventée (voir le rapport de lot, § « Câblage attendu de fix-app »). */
  readonly csvMeta?: AggregateCsvMeta;

  /** `ET-PARTIEL-CACHE` (`EX-SCR-29`, DR-093) — servi depuis le cache (mode dégradé) : astérisques
   * sur la barre de synthèse et `Exporter` désactivé avec son motif. Détecté par la coquille. */
  readonly partialCache?: boolean;
}

function currentSelectionForScreenG(mmmv: string | undefined): SelectionState {
  return mmmv === undefined ? {} : { makesModelsVariants: mmmv };
}

function triggerCsvDownload(csv: string, fileName: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function MarketScreen(props: MarketScreenProps): JSX.Element {
  const { state } = props;
  const regime: MarketRegime = props.regime ?? defaultRegimeFromViewport();

  const loadedData = state.kind === 'ready' || state.kind === 'no-filter' || state.kind === 'partial' ? state.data : undefined;

  const cards = useMemo<readonly MakeCardViewModel[]>(() => {
    if (loadedData === undefined) return [];
    // Indexée par la clé composite `makeId:modelId` (`src/types/reference.ts::modelKey`), pas par
    // `modelId` seul — voir la ré-indexation par marque plus bas.
    const modelByKey: ReadonlyMap<string, Model> = props.referenceData?.modelByKey ?? new Map();
    const makeById = props.referenceData?.makeById;

    const sortableRows: SortableMakeRow[] = loadedData.makeAggregates.map((agg) => {
      const modelAggs = loadedData.modelAggregatesByMake.get(agg.makeId);
      const modelCount =
        modelAggs === undefined || modelAggs === 'unavailable'
          ? 0
          : new Set(modelAggs.filter((m) => m.modelId !== 0).map((m) => m.modelId)).size;
      return {
        makeId: agg.makeId,
        label: makeById?.get(agg.makeId)?.label ?? `Marque ${agg.makeId}`,
        listingCount: agg.listingCount,
        medianPrice: agg.price.p50,
        modelCount,
      };
    });
    const orderedIds = sortMakeRows(sortableRows, props.sortField, props.sortDirection).map((r) => r.makeId);
    const byMakeId = new Map(loadedData.makeAggregates.map((a) => [a.makeId, a] as const));

    return orderedIds
      .map((id) => byMakeId.get(id))
      .filter((a): a is NonNullable<typeof a> => a !== undefined)
      .map((agg) => {
        const modelAggs = loadedData.modelAggregatesByMake.get(agg.makeId);
        // Par modèle réel (`(makeId, modelId)`), reconstruit une carte `Model` avec la BONNE clé
        // `modelId` — `modelByKey` est indexée par `makeId:modelId` (`src/types/reference.ts`),
        // mais `buildMakeCardViewModel` attend une map indexée par `modelId` SEUL (elle ne connaît
        // qu'une marque à la fois). Reconstruite ici, pas une nouvelle règle : simple ré-indexation.
        const modelsOfThisMake = new Map<number, Model>();
        if (modelAggs !== undefined && modelAggs !== 'unavailable') {
          for (const m of modelAggs) {
            const model = modelByKey.get(`${agg.makeId}:${m.modelId}`);
            if (model !== undefined) modelsOfThisMake.set(m.modelId, model);
          }
        }
        return buildMakeCardViewModel(agg, {
          make: makeById?.get(agg.makeId),
          modelAggregates: modelAggs ?? [],
          models: modelsOfThisMake,
          hasUserFilters: loadedData.hasUserFilters,
          hideSparseModels: props.hideSparseModels,
          isExpanded: props.expandedMakeIds.has(agg.makeId),
          modelsVisibleBeforeCollapse: MODELS_VISIBLE_BEFORE_COLLAPSE[regime],
        });
      });
  }, [loadedData, props.referenceData, props.sortField, props.sortDirection, props.hideSparseModels, props.expandedMakeIds, regime]);

  /**
   * `EX-SCR-127` (ACC-10) — RENDU VIRTUALISÉ de la grille au-delà de 40 cartes : « au plus 12 cartes
   * montées simultanément, hauteur de conteneur estimée depuis la hauteur repliée (588 px) puis
   * corrigée à la mesure réelle », et « la virtualisation ne plafonne JAMAIS le nombre de cartes
   * accessibles ». Mesuré en recette : 180 cartes montées, 15 677 nœuds DOM — `shouldVirtualizeGrid`
   * existait sans effet de rendu, le chargement par lots (`EX-SCR-129`) en tenait lieu.
   *
   * La fenêtre glisse sur le défilement du DOCUMENT (la grille n'a pas de défilement propre). Deux
   * cales, en pleine largeur de grille, portent la hauteur des rangées hors fenêtre : la barre de
   * défilement décrit donc toujours la grille entière. Le nombre de colonnes et la hauteur de rangée
   * sont RELUS sur le rendu réel à chaque mesure ; 588 px n'est que l'estimation d'amorçage.
   */
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [gridWindowStart, setGridWindowStart] = useState(0);
  const gridMetricsRef = useRef({ columns: 1, rowHeight: COLLAPSED_CARD_HEIGHT_PX });
  useEffect(() => {
    const measureAndPlace = (): void => {
      const grid = gridRef.current;
      if (grid === null || typeof window === 'undefined') return;
      const cards0 = grid.querySelectorAll<HTMLElement>('.kycar-market-card');
      const first = cards0[0];
      if (first !== undefined) {
        const style = window.getComputedStyle(grid);
        const columns = Math.max(1, style.gridTemplateColumns.split(' ').filter((t) => t !== '').length);
        const gap = Number.parseFloat(style.rowGap) || 0;
        const rowHeight = Math.max(1, Math.round(first.getBoundingClientRect().height + gap));
        gridMetricsRef.current = { columns, rowHeight };
      }
      const { columns, rowHeight } = gridMetricsRef.current;
      const gridTop = grid.getBoundingClientRect().top + window.scrollY;
      const rowsAbove = Math.max(0, Math.floor((window.scrollY - gridTop) / rowHeight));
      setGridWindowStart(rowsAbove * columns);
    };
    measureAndPlace();
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('scroll', measureAndPlace, { passive: true });
    window.addEventListener('resize', measureAndPlace);
    return () => {
      window.removeEventListener('scroll', measureAndPlace);
      window.removeEventListener('resize', measureAndPlace);
    };
  }, [cards.length]);

  switch (state.kind) {
    case 'loading':
      return (
        <div class="kycar-market-screen" aria-busy="true">
          <h1 id="kycar-market-title">Survol du marché</h1>
          <div class="kycar-market-summary-bar summary-bar">— marques · — modèles · — offres</div>
          <div class="kycar-market-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} class="kycar-market-card">
                <div class="kycar-market-skeleton-block" style={{ height: '72px' }} />
                <div class="kycar-market-skeleton-block" style={{ height: '44px', margin: '4px 0' }} />
                {Array.from({ length: 6 }, (_, j) => (
                  <div key={j} class="kycar-market-skeleton-block" style={{ height: '72px', margin: '1px 0' }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      );

    case 'provider-error':
      return (
        <div class="kycar-market-error" role="alert">
          <h1 id="kycar-market-title">Survol du marché</h1>
          <p>Les données n’ont pas pu être chargées ({state.errorCode}, {state.attemptedAt})</p>
          <button type="button" onClick={props.onRetryProvider}>
            Réessayer
          </button>
          {state.hasCachedResult ? <button type="button">Afficher le dernier résultat connu</button> : null}
        </div>
      );

    case 'empty':
      if (state.reason === 'no-filter') {
        return (
          <div class="kycar-market-empty">
            <h1 id="kycar-market-title">Survol du marché</h1>
            <h2>Aucune donnée disponible</h2>
            <p>Jeu de données du {state.snapshotDate}</p>
            <button type="button" onClick={props.onRetryProvider}>
              Réessayer
            </button>
          </div>
        );
      }
      return (
        <div class="kycar-market-empty">
          <h1 id="kycar-market-title">Survol du marché</h1>
          <h2>Aucune offre ne correspond</h2>
          {/* EX-SCR-131 — barre de synthèse à zéro : "0 marque · 0 modèle · aucune offre", tri
              désactivé ("Aucun résultat à trier") ; rendue par <SummaryBar> avec makeCount=0 et
              sortDisabled=true, qui produisent littéralement ce texte (voir SummaryBar.tsx). */}
          <SummaryBar
            makeCount={0}
            modelCount={0}
            offerCount={0}
            sortField={props.sortField}
            sortDirection={props.sortDirection}
            onSortFieldChange={props.onSortFieldChange}
            onSortDirectionToggle={props.onSortDirectionToggle}
            sortDisabled={true}
            hideSparseModels={props.hideSparseModels}
            onToggleHideSparseModels={props.onToggleHideSparseModels}
            onExport={() =>
              triggerCsvDownload(
                buildAggregateCsv([], props.csvMeta),
                buildAggregateCsvFileName('agregats-mode1', props.csvMeta?.snapshotId ?? 'inconnu', new Date()),
              )
            }
            exportDisabled={true}
          />
          <p>{state.activeFilterCount} filtres actifs restreignent la recherche.</p>
          <div class="kycar-market-primer-shortcuts">
            {state.topRestrictive.map((hint: RestrictiveFilterHint) => (
              <button key={hint.filterId} type="button" onClick={() => props.onRemoveFilter?.(hint.filterId)}>
                {hint.gain === null ? `retirer « ${hint.label} »` : `retirer « ${hint.label} » : ${formatInteger(hint.gain)} offres de plus`}
              </button>
            ))}
          </div>
          <button type="button" onClick={props.onResetAllFilters}>
            Réinitialiser tous les filtres
          </button>
          <button type="button" onClick={props.onSaveSearch}>
            Enregistrer cette recherche
          </button>
        </div>
      );

    case 'partial':
    case 'no-filter':
    case 'ready': {
      const data = state.data;
      const isNoFilter = state.kind === 'no-filter';
      const visibleCards =
        isNoFilter && !props.showAllMakesRequested ? cards.slice(0, NO_FILTER_TEASER_MAKE_COUNT) : cards.slice(0, props.loadedMakeCount || cards.length);
      const totalOfferCount = data.makeAggregates.reduce((sum, a) => sum + a.listingCount, 0);
      // `ACC-05` / `D8-42` — le cardinal des modèles vient de `marketModelCardinal` (`view-model.ts`),
      // qui le lit sur les agrégats de MARQUE (`MakeAggregate.modelCount`, `D8-10`) et rend `null`
      // tant qu'il n'est pas connu. Le comptage local qui était ici valait `0` pendant les ~0,5 à
      // 0,7 s de chargement des agrégats MODÈLE : « 0 modèles » affiché comme un fait mesuré.
      const totalModelCount = marketModelCardinal(data.makeAggregates, data.modelAggregatesByMake);
      const makesWithResults = data.makeAggregates.filter((a) => a.listingCount > 0).length;
      const c3 = buildC3Banner({
        listingCount: data.snapshotListingCount,
        announcedListingCount: data.snapshotAnnouncedListingCount,
        hasUserFilters: data.hasUserFilters,
      });

      return (
        <div class="kycar-market-screen">
          {/* `EX-NFR-12` (E2E-15) : l'écran A n'avait aucun `h1` — le focus après navigation
              retombait sur un conteneur muet pour un lecteur d'écran. */}
          <h1 id="kycar-market-title">Survol du marché</h1>
          <div class="kycar-market-banners">
            {/* `EX-NFR-31` (DR-154) : la région `summary-bar-c3` du contrat `print.css` est le
                bandeau de couverture C3 — TOUJOURS imprimé (règle 2 de la feuille d'impression). */}
            <div class="kycar-market-banner-c3 summary-bar-c3">
              <div class={`kycar-market-banner kycar-market-banner--${c3.tone}`}>{c3.text}</div>
            </div>
            {state.kind === 'partial' ? (
              <div class="kycar-market-banner kycar-market-banner--ambre">
                {state.failedMakeIds.size} marques sur {state.totalMakesAttempted} n’ont pas pu être chargées
              </div>
            ) : null}
            {makesWithResults > MAKE_COUNT_WARNING_THRESHOLD ? (
              <div class="kycar-market-banner kycar-market-banner--neutre">
                {formatInteger(makesWithResults)} marques correspondent — affinez pour comparer
              </div>
            ) : null}
            {isNoFilter ? (
              <div class="kycar-market-banner kycar-market-banner--neutre">
                {formatInteger(cards.length)} marques dans le snapshot — {Math.min(cards.length, NO_FILTER_TEASER_MAKE_COUNT)} affichées, triées par
                nombre d’offres{' '}
                {!props.showAllMakesRequested ? (
                  <button type="button" onClick={props.onShowAllMakes}>
                    Afficher les {formatInteger(cards.length)} marques
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {isNoFilter ? (
            <div class="kycar-market-primer">
              <p>Posez au moins un critère pour voir ce que le marché propose</p>
              <div class="kycar-market-primer-shortcuts">
                {PRIMER_SHORTCUTS.map((s) => (
                  <button key={s.id} type="button" onClick={() => props.onApplyPrimerShortcut(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <SummaryBar
            makeCount={data.makeAggregates.length}
            modelCount={totalModelCount}
            offerCount={totalOfferCount}
            displayedMakeCount={visibleCards.length !== cards.length ? visibleCards.length : undefined}
            sortField={props.sortField}
            sortDirection={props.sortDirection}
            onSortFieldChange={props.onSortFieldChange}
            onSortDirectionToggle={props.onSortDirectionToggle}
            sortDisabled={false}
            hideSparseModels={props.hideSparseModels}
            onToggleHideSparseModels={props.onToggleHideSparseModels}
            onExport={() =>
              triggerCsvDownload(
                buildAggregateCsv(cards, props.csvMeta),
                buildAggregateCsvFileName('agregats-mode1', props.csvMeta?.snapshotId ?? 'inconnu', new Date()),
              )
            }
            exportDisabled={props.partialCache === true}
            exportDisabledReason={
              props.partialCache === true
                ? 'Données du cache (mode dégradé) — export indisponible tant que le snapshot n’est pas rafraîchi'
                : undefined
            }
            partialCache={props.partialCache}
            regime={regime}
          />

          {/* Point d'entrée supplémentaire vers l'écran G, propre à cet écran (la voie principale
              reste le contrôle mmmv du bandeau C1, montée par FilterBand/D5) — aucun EX-SCR-* ne
              dicte son emplacement exact sur l'écran A ; documenté comme tel dans le rapport de lot. */}
          <button type="button" onClick={props.onOpenScreenG}>
            Choisir une marque et un modèle
          </button>

          {/* `EX-SCR-127` (ACC-10) — fenêtre de rendu de la grille. */}
          {(() => {
            const virtualizeGrid = shouldVirtualizeGrid(visibleCards.length);
            const { columns, rowHeight } = gridMetricsRef.current;
            const start = virtualizeGrid
              ? Math.max(0, Math.min(gridWindowStart, Math.max(0, visibleCards.length - GRID_VIRTUALIZATION_MOUNTED_CARDS)))
              : 0;
            const mounted = virtualizeGrid
              ? visibleCards.slice(start, start + GRID_VIRTUALIZATION_MOUNTED_CARDS)
              : visibleCards;
            const rowsAbove = virtualizeGrid ? Math.floor(start / columns) : 0;
            const rowsBelow = virtualizeGrid
              ? Math.max(0, Math.ceil((visibleCards.length - start - mounted.length) / columns))
              : 0;
            return (
              <div class="kycar-market-grid" ref={gridRef} data-virtualized={virtualizeGrid ? 'true' : undefined}>
                {rowsAbove > 0 ? (
                  <div class="kycar-market-grid-spacer" style={{ height: `${rowsAbove * rowHeight}px` }} aria-hidden="true" />
                ) : null}
                {mounted.map((card) => (
                  <MakeCard
                    key={card.makeId}
                    card={card}
                    isExpanded={props.expandedMakeIds.has(card.makeId)}
                    onSelectMake={props.onSelectMake}
                    onSelectModel={props.onSelectModel}
                    onToggleExpand={props.onToggleExpand}
                    onToggleCompare={props.onToggleCompare}
                    compareSelection={props.compareSelection}
                    compareAtCapacity={props.compareAtCapacity}
                    onRetryModels={props.onRetryMakeModels}
                  />
                ))}
                {rowsBelow > 0 ? (
                  <div class="kycar-market-grid-spacer" style={{ height: `${rowsBelow * rowHeight}px` }} aria-hidden="true" />
                ) : null}
              </div>
            );
          })()}

          {!isNoFilter ? (
            <GridFooter
              loadedCount={visibleCards.length}
              totalCount={cards.length}
              hasMore={visibleCards.length < cards.length}
              batchSize={GRID_LOAD_BATCH_SIZE}
              onLoadMore={props.onLoadMoreMakes}
            />
          ) : null}

          {props.screenGOpen ? (
            <ScreenG
              referenceData={props.referenceData}
              currentSelection={currentSelectionForScreenG(props.currentMmmv)}
              onCancel={props.onCancelScreenG}
              onApply={props.onApplyScreenG}
            />
          ) : null}
        </div>
      );
    }
  }
}
