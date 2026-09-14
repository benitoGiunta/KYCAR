/**
 * KYCAR — Dispatcheur générique par `ControlKind` (`EX-SCR-72bis`) pour les contrôles à UN seul
 * `FilterDef`. Les contrôles à plusieurs `FilterDef` (couple d'intervalle, localisation composite,
 * sélecteur structuré) sont assemblés par l'appelant (`PrimaryLine.tsx`/`SecondaryGroups.tsx`), qui
 * seul connaît les filtres apparentés (`pairedWith`, `location`/`radius`/`crossBorder`).
 */
import { BooleanToggle } from './BooleanToggle';
import { CheckboxList } from './CheckboxList';
import { NumberField } from './NumberField';
import { PanelSearchMulti } from './PanelSearchMulti';
import { RadioSegmented } from './RadioSegmented';
import { SelectIndifferent } from './SelectIndifferent';
import { TextField } from './TextField';
import type { FilterControlProps } from '../types';

/** `true` si `def.control` est un des sept `ControlKind` à un seul filtre gérés par ce dispatcheur. */
export function isSingleDefControl(control: string): boolean {
  return (
    control === 'radio-segmented' ||
    control === 'select-indifferent' ||
    control === 'panel-search-single' ||
    control === 'checkbox-list' ||
    control === 'panel-search-multi' ||
    control === 'number-field' ||
    control === 'boolean-toggle' ||
    control === 'text-field'
  );
}

export function ControlRenderer(props: FilterControlProps) {
  switch (props.def.control) {
    case 'radio-segmented':
      return <RadioSegmented {...props} />;
    case 'select-indifferent':
    case 'panel-search-single': // réserve générative inutilisée en pratique (aucun filtre retenu ne l'emploie)
      return <SelectIndifferent {...props} />;
    case 'checkbox-list':
      return <CheckboxList {...props} />;
    case 'panel-search-multi':
      return <PanelSearchMulti {...props} />;
    case 'number-field':
      return <NumberField {...props} />;
    case 'boolean-toggle':
      return <BooleanToggle {...props} />;
    case 'text-field':
      return <TextField {...props} />;
    default:
      return null;
  }
}
