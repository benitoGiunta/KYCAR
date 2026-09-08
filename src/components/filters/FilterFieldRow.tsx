/**
 * KYCAR — Ligne d'un filtre au sein d'un groupe (lot D5, finition)
 * =================================================================================================
 * Centralise le choix entre les contrôles à un seul `FilterDef` (`ControlRenderer.tsx`) et les
 * trois contrôles à plusieurs filtres apparentés (couple d'intervalle, localisation composite,
 * sélecteur structuré `mmmv`), pour que `PrimaryLine.tsx` et `SecondaryGroups.tsx` n'aient à
 * connaître qu'UN point d'entrée par filtre du registre.
 */
import { FILTER_BY_ID } from '../../state/filter-registry';
import type { FilterDef, FilterValue, ScreenMode, SelectionState } from '../../state/filter-types';
import { ControlRenderer } from './controls/ControlRenderer';
import { GeoComposite } from './controls/GeoComposite';
import { RangeControl } from './controls/RangeControl';
import { StructuredPickerButton } from './controls/StructuredPickerButton';
import type { FacetCounts, OnFilterChange } from './types';

/** Identifiants de filtre déjà rendus par le contrôle composite d'un `def` donné — pour que
 * l'appelant les retire de son itération (une borne "to", ou `zipr`/`crossborder` sous `zip`). */
export function filterIdsConsumedByRow(def: FilterDef): readonly string[] {
  if (def.id === 'location') return ['location', 'radius', 'crossBorder'];
  if (def.scopeType === 'range_min' && def.pairedWith !== undefined) return [def.id, def.pairedWith];
  return [def.id];
}

/** `true` si ce `def` ne doit JAMAIS être itéré directement par le parent (il est toujours rendu
 * comme partie d'un contrôle composite déclenché par un autre filtre — `radius`/`crossBorder` sous
 * `location`, une borne `to` sous sa borne `from`). */
export function isConsumedElsewhere(def: FilterDef): boolean {
  if (def.id === 'radius' || def.id === 'crossBorder') return true;
  if (def.scopeType === 'range_max' && def.pairedWith !== undefined) return true;
  return false;
}

function numberOrUndefined(v: FilterValue | undefined): number | undefined {
  if (typeof v === 'number') return v;
  if (Array.isArray(v) && typeof v[0] === 'number') return v[0];
  return undefined;
}

function stringOrUndefined(v: FilterValue | undefined): string | undefined {
  if (typeof v === 'string') return v.length > 0 ? v : undefined;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}

export interface FilterFieldRowProps {
  readonly def: FilterDef;
  readonly mode: ScreenMode;
  readonly selection: SelectionState;
  readonly disabled: boolean;
  readonly disabledReason?: string;
  readonly facetCounts?: FacetCounts;
  readonly onChange: OnFilterChange;
  /** Requis uniquement pour `mmmv` (`structured-picker`). */
  readonly onOpenScreenG?: () => void;
  readonly screenGSummary?: string;
}

export function FilterFieldRow({
  def,
  selection,
  disabled,
  disabledReason,
  facetCounts,
  onChange,
  onOpenScreenG,
  screenGSummary,
}: FilterFieldRowProps) {
  if (def.control === 'none') return null;

  if (def.control === 'structured-picker') {
    return (
      <StructuredPickerButton
        def={def}
        summary={screenGSummary ?? 'Toutes les marques'}
        disabled={disabled}
        onOpen={onOpenScreenG ?? (() => {})}
      />
    );
  }

  if (def.id === 'location') {
    const radiusDef = FILTER_BY_ID.get('radius');
    const crossBorderDef = FILTER_BY_ID.get('crossBorder');
    if (radiusDef === undefined || crossBorderDef === undefined) return null;
    return (
      <GeoComposite
        locationDef={def}
        radiusDef={radiusDef}
        crossBorderDef={crossBorderDef}
        locationValue={stringOrUndefined(selection[def.id])}
        radiusValue={stringOrUndefined(selection[radiusDef.id])}
        crossBorderValue={stringOrUndefined(selection[crossBorderDef.id])}
        onChange={onChange}
      />
    );
  }

  if (def.scopeType === 'range_min') {
    const toDef = def.pairedWith !== undefined ? FILTER_BY_ID.get(def.pairedWith) : undefined;
    return (
      <RangeControl
        fromDef={def}
        toDef={toDef}
        fromValue={numberOrUndefined(selection[def.id])}
        toValue={toDef !== undefined ? numberOrUndefined(selection[toDef.id]) : undefined}
        disabled={disabled}
        disabledReason={disabledReason}
        onChange={onChange}
      />
    );
  }

  return (
    <ControlRenderer
      def={def}
      value={selection[def.id]}
      disabled={disabled}
      disabledReason={disabledReason}
      facetCounts={facetCounts}
      onChange={onChange}
    />
  );
}
