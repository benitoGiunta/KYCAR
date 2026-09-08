/**
 * KYCAR — Liste de cases à cocher (`EX-SCR-65`) — enum_multi, n ≤ 14. Application immédiate
 * (`EX-SRCH-1`, 0 ms) sauf pour `eq`, qui utilise `PanelSearchMulti` (`EX-SCR-66`), pas ce contrôle.
 */
import { resolveOptionLabel, semanticsWarningTooltip } from '../labels';
import type { FilterControlProps } from '../types';

function toCodeSet(value: unknown): Set<string> {
  if (Array.isArray(value)) return new Set(value.map(String));
  if (value === undefined || value === null) return new Set();
  return new Set([String(value)]);
}

export function CheckboxList({ def, value, disabled, disabledReason, facetCounts, onChange }: FilterControlProps) {
  const options = def.options ?? [];
  const current = toCodeSet(value);
  const warning = semanticsWarningTooltip(def);

  const toggle = (code: string): void => {
    const next = new Set(current);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange({
      filterId: def.id,
      value: next.size > 0 ? [...next] : undefined,
      gesture: 'discrete-change',
    });
  };

  return (
    <fieldset class="kycar-control kycar-control--checkbox-list" disabled={disabled} title={disabled ? disabledReason : undefined}>
      <legend>
        {def.label}
        {warning !== undefined ? (
          <span class="kycar-warning-icon" title={warning} aria-label={warning}>
            (?)
          </span>
        ) : null}
      </legend>
      <p class="kycar-control__hint">Au moins une de ces valeurs</p>
      <div class={`kycar-checkbox-grid${options.length > 6 ? ' kycar-checkbox-grid--2col' : ''}`}>
        {options.map((opt) => {
          const id = `filter-${def.id}-${opt.code}`;
          const count = facetCounts?.get(opt.code);
          return (
            <label key={opt.code} for={id} class="kycar-checkbox-option">
              <input
                id={id}
                type="checkbox"
                checked={current.has(opt.code)}
                disabled={disabled}
                onChange={() => toggle(opt.code)}
              />
              {resolveOptionLabel(def, opt.code)}
              {count !== undefined ? ` (${count})` : ''}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
