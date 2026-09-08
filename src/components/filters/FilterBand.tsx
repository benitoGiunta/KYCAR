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
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { FILTER_BY_ID, FILTER_DEFAULTS } from '../../state/filter-registry';
import { resolveFilterClass } from '../../state/filter-registry';
import type { MutableSelectionState, ScreenMode, SelectionState } from '../../state/filter-types';
import { InteractionController } from '../../state/interaction';
import {
  URL_BUDGET_EXCEEDED_MESSAGE,
  assembleUrl,
  serializeQuery,
  wouldExceedBudget,
  type UiState,
} from '../../state/url-codec';
import { ActiveFilterTokens } from './ActiveFilterTokens';
import { defaultExpandedGroups } from './band-model';
import { FilterSearch } from './FilterSearch';
import { PrimaryLine } from './PrimaryLine';
import { ScreenG, type ScreenGReferenceData } from './ScreenG';
import { SecondaryGroups } from './SecondaryGroups';
import type { OnFilterChange } from './types';

export interface FilterBandProps {
  readonly mode: ScreenMode;
  readonly initialSelection: SelectionState;
  /** Origine + chemin courants (sans requête), pour le calcul du plafond `EX-NAV-10/11`. */
  readonly originAndPath: string;
  readonly uiState?: UiState;
  readonly resultCount?: number;
  readonly referenceData?: ScreenGReferenceData;
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

function mmmvSummary(selection: SelectionState, referenceData: ScreenGReferenceData | undefined): string {
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
    });
  };

  const handleRemove = (filterIds: readonly string[]): void => {
    const next: MutableSelectionState = { ...selectionRef.current };
    for (const id of filterIds) delete next[id];
    selectionRef.current = next;
    setSelection(next);
    props.onSelectionApplied?.(next);
    const query = serializeQuery(next, props.uiState ?? {}, { filterDefaults: FILTER_DEFAULTS });
    controllerRef.current?.forcePush(assembleUrl(props.originAndPath, query).url);
  };

  const handleClearAll = (): void => {
    const next: MutableSelectionState = {};
    selectionRef.current = next;
    setSelection(next);
    props.onSelectionApplied?.(next);
    const query = serializeQuery(next, props.uiState ?? {}, { filterDefaults: FILTER_DEFAULTS });
    controllerRef.current?.forcePush(assembleUrl(props.originAndPath, query).url);
  };

  const activeCount = useMemo(() => {
    let n = 0;
    for (const id of Object.keys(selection)) {
      const def = FILTER_BY_ID.get(id);
      if (def !== undefined && def.cls !== 'D' && !def.nonExposed) n++;
    }
    return n;
  }, [selection]);

  const screenGSummary = mmmvSummary(selection, props.referenceData);

  return (
    <div class="kycar-filter-band" data-active-count={activeCount}>
      <PrimaryLine
        mode={props.mode}
        selection={selection}
        onChange={handleChange}
        onOpenScreenG={() => setScreenGOpen(true)}
        screenGSummary={screenGSummary}
      />
      <FilterSearch
        query={searchQuery}
        onQueryChange={(q, groupsToExpand) => {
          setSearchQuery(q);
          if (groupsToExpand.size > 0) {
            setExpandedGroups((prev) => new Set([...prev, ...groupsToExpand]));
          }
        }}
      />
      <SecondaryGroups
        mode={props.mode}
        selection={selection}
        expandedGroups={expandedGroups}
        onToggleGroup={(group) =>
          setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group);
            else next.add(group);
            return next;
          })
        }
        onChange={handleChange}
      />
      <ActiveFilterTokens
        selection={selection}
        resultCount={props.resultCount}
        onRemove={handleRemove}
        onClearAll={handleClearAll}
      />
      {screenGOpen ? (
        <ScreenG
          referenceData={props.referenceData}
          currentSelection={selection}
          onCancel={() => setScreenGOpen(false)}
          onApply={(mmmv) => {
            setScreenGOpen(false);
            handleChange({ filterId: 'makesModelsVariants', value: mmmv, gesture: 'selection-immediate' });
          }}
        />
      ) : null}
    </div>
  );
}
