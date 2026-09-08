/**
 * KYCAR — Intervalle numérique (`EX-SCR-67`) — couple `from`/`to`, ou borne unique isolée
 * (`ARB-53`, ex. `lsyeinmifrom`). La saisie libre est acceptée en plus des paliers suggérés.
 *
 * DETTE SIGNALÉE : `EX-SRCH-3` nomme une « glissière » (curseur physique) pour `pricefrom/to` et
 * `kmfrom/to` au relâchement (`pointerup`, 150 ms). Ce composant rend les paliers suggérés comme
 * des BOUTONS cliquables (geste `'slider-commit'`, même débounce) plutôt qu'un curseur glissé au
 * pointeur — un vrai composant à glissière tactile est un investissement d'interaction distinct,
 * hors budget de ce lot, et les boutons restent pleinement utilisables au clavier (`EX-NFR-14`), ce
 * qu'un curseur HTML natif `<input type="range">` à paliers discrets ne permet pas nativement pour
 * une liste de valeurs non uniformément espacées comme celle de `filters.json`.
 *
 * `EX-SCR-68` : validation d'intervalle interactive — si `from > to`, le changement est REFUSÉ
 * (jamais permuté ; la permutation `EX-NAV-22` ne s'applique qu'au chargement d'une URL) et un
 * message inline s'affiche.
 */
import { useState } from 'preact/hooks';

import type { FilterDef } from '../../../state/filter-types';
import { formatNumberFr } from '../labels';
import type { OnFilterChange } from '../types';

export interface RangeControlProps {
  readonly fromDef: FilterDef;
  readonly toDef?: FilterDef;
  readonly fromValue: number | undefined;
  readonly toValue: number | undefined;
  readonly disabled: boolean;
  readonly disabledReason?: string;
  readonly onChange: OnFilterChange;
}

function clampToDomain(n: number, def: FilterDef): { value: number; clamped: boolean } {
  const domain = def.numericDomain;
  if (domain === undefined) return { value: n, clamped: false };
  let v = n;
  if (domain.min !== undefined && v < domain.min) v = domain.min;
  if (domain.max !== undefined && v > domain.max) v = domain.max;
  return { value: v, clamped: v !== n };
}

export function RangeControl({ fromDef, toDef, fromValue, toValue, disabled, disabledReason, onChange }: RangeControlProps) {
  const [error, setError] = useState<string | null>(null);
  const [clampedMsg, setClampedMsg] = useState<string | null>(null);
  const label = toDef !== undefined ? fromDef.label.replace(/\s+de$/, '') : fromDef.label;
  const domain = fromDef.numericDomain;

  const commitTyped = (which: 'from' | 'to', raw: string): void => {
    setError(null);
    if (raw.trim().length === 0) {
      onChange({ filterId: which === 'from' ? fromDef.id : (toDef ?? fromDef).id, value: undefined, gesture: 'keystroke' });
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const def = which === 'from' ? fromDef : toDef ?? fromDef;
    const { value: clamped, clamped: wasClamped } = clampToDomain(n, def);
    const otherValue = which === 'from' ? toValue : fromValue;
    if (toDef !== undefined) {
      const nextFrom = which === 'from' ? clamped : fromValue;
      const nextTo = which === 'to' ? clamped : toValue;
      if (nextFrom !== undefined && nextTo !== undefined && nextFrom > nextTo) {
        setError('La borne basse dépasse la borne haute');
        return; // EX-SCR-68 : refusé, jamais permuté, ancienne valeur conservée
      }
      void otherValue;
    }
    if (wasClamped) {
      setClampedMsg(`Ramené à ${formatNumberFr(clamped, fromDef.unit)}`);
      setTimeout(() => setClampedMsg(null), 4000);
    }
    onChange({ filterId: def.id, value: clamped, gesture: 'keystroke' });
  };

  const commitPalier = (which: 'from' | 'to', paletteValue: number): void => {
    const def = which === 'from' ? fromDef : toDef ?? fromDef;
    onChange({ filterId: def.id, value: paletteValue, gesture: 'slider-commit' });
  };

  return (
    <div class="kycar-control kycar-control--range">
      <span class="kycar-control__label">{label}</span>
      <div class="kycar-range-fields" aria-disabled={disabled} title={disabled ? disabledReason : undefined}>
        <input
          type="number"
          aria-label={fromDef.label}
          value={fromValue ?? ''}
          disabled={disabled}
          min={domain?.min}
          max={domain?.max}
          onInput={(e) => commitTyped('from', (e.currentTarget as HTMLInputElement).value)}
        />
        {toDef !== undefined ? (
          <>
            <span aria-hidden="true">à</span>
            <input
              type="number"
              aria-label={toDef.label}
              value={toValue ?? ''}
              disabled={disabled}
              min={domain?.min}
              max={domain?.max}
              onInput={(e) => commitTyped('to', (e.currentTarget as HTMLInputElement).value)}
            />
          </>
        ) : null}
      </div>
      {domain?.steps !== undefined ? (
        <div class="kycar-range-steps">
          {domain.steps.map((step) => (
            <button
              key={step}
              type="button"
              disabled={disabled}
              onClick={() => commitPalier(toDef !== undefined && fromValue !== undefined ? 'to' : 'from', step)}
            >
              {formatNumberFr(step, fromDef.unit)}
            </button>
          ))}
        </div>
      ) : null}
      {error !== null ? <p class="kycar-control__error" role="alert">{error}</p> : null}
      {clampedMsg !== null ? <p class="kycar-control__hint" role="status">{clampedMsg}</p> : null}
    </div>
  );
}
