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

import { FILTER_BY_ID, FILTER_DEFAULTS, FILTER_DEFS, isDependencySatisfied } from '../../state/filter-registry';
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
import { countActiveFilters, defaultExpandedGroups } from './band-model';
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

/**
 * `DR-059` (`EX-SCR-73`) : retire en cascade tout filtre dont la dépendance n'est plus satisfaite
 * après un retrait — sans quoi un prédicat orphelin (ex. bornes de leasing sans `hasleasing`) reste
 * appliqué alors que son contrôle est désactivé : l'utilisateur ne peut plus ni le voir ni le
 * retirer. Boucle jusqu'à stabilité (une chaîne de dépendances peut se propager sur plus d'un
 * niveau). Mutation en place de `state`, appelée uniquement sur une copie déjà détachée de l'état
 * React.
 */
function cascadeRemoveOrphans(state: MutableSelectionState): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const def of FILTER_DEFS) {
      if (def.dependencies.length === 0) continue;
      if (!(def.id in state)) continue;
      if (!isDependencySatisfied(def, state)) {
        delete state[def.id];
        changed = true;
      }
    }
  }
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
      valueLength: evt.valueLength,
    });
  };

  const forcePushSelection = (next: MutableSelectionState): void => {
    selectionRef.current = next;
    setSelection(next);
    props.onSelectionApplied?.(next);
    const query = serializeQuery(next, props.uiState ?? {}, { filterDefaults: FILTER_DEFAULTS });
    controllerRef.current?.forcePush(assembleUrl(props.originAndPath, query).url);
  };

  const handleRemove = (filterIds: readonly string[]): void => {
    const next: MutableSelectionState = { ...selectionRef.current };
    for (const id of filterIds) delete next[id];
    cascadeRemoveOrphans(next); // DR-059 : les enfants orphelins partent avec leur parent
    forcePushSelection(next);
  };

  /** Retrait UNITAIRE d'une valeur d'un filtre d'énumération multi-valeurs, depuis l'infobulle
   * d'un jeton à cardinal (`EX-SCR-76` « en substance », `D-10`, `DR-062`). */
  const handleRemovePartial = (filterId: string, removesCodes: readonly string[]): void => {
    const current = selectionRef.current[filterId];
    if (current === undefined) return;
    const codes = (Array.isArray(current) ? current : [current]).map(String);
    const remaining = codes.filter((c) => !removesCodes.includes(c));
    const next: MutableSelectionState = { ...selectionRef.current };
    if (remaining.length === 0) delete next[filterId];
    else next[filterId] = remaining;
    cascadeRemoveOrphans(next);
    forcePushSelection(next);
  };

  const handleClearAll = (): void => {
    forcePushSelection({});
  };

  // `DR-135` (`EX-SCR-91`) : le compteur du bandeau doit utiliser LA MÊME règle que le reste du
  // lot (`countActiveFilters`, `band-model.ts`), qui exclut un filtre posé à sa `defaultValue`
  // non-absence (ex. `powertype=kw`) — un calcul en ligne ne le faisait pas, donnant deux comptes
  // divergents (bandeau replié vs ailleurs) pour la même sélection.
  const activeCount = useMemo(() => countActiveFilters(selection), [selection]);

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
        onResetGroup={handleRemove}
      />
      <ActiveFilterTokens
        onRemovePartial={handleRemovePartial}
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
