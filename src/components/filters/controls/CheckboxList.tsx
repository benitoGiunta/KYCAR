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

/** `D8-05` (`EX-SCR-89`) : le libellé de la parenthèse d'effectif — `…` pendant l'écart de
 * recalcul (`facetCountsPending`), sinon la valeur connue. `undefined` (facette non fournie, ex.
 * filtre de classe T) ne rend AUCUNE parenthèse — jamais une parenthèse vide. */
function facetCountLabel(count: number | undefined, pending: boolean): string | null {
  if (pending) return '…';
  if (count === undefined) return null;
  return String(count);
}

export function CheckboxList({
  def,
  value,
  disabled,
  disabledReason,
  facetCounts,
  facetCountsPending,
  onChange,
}: FilterControlProps) {
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
          const pending = facetCountsPending === true;
          const label = facetCountLabel(count, pending);
          // `EX-SCR-89` : `(0)` reste visible mais en gris — l'option reste cochable (aucune
          // désactivation liée à l'effectif, seul un filtre de classe T désactive une option).
          const isZero = !pending && count === 0;
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
              {label !== null ? (
                <span class="kycar-facet-count" style={isZero ? { opacity: 0.55 } : undefined}>
                  {' '}
                  ({label})
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
