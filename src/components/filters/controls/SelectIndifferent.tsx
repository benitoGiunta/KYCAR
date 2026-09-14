/**
 * KYCAR — Liste déroulante native avec « Indifférent » (`EX-SCR-64`) — enum_single, 5 ≤ n ≤ 12.
 */
import { resolveOptionLabel, semanticsWarningTooltip } from '../labels';
import type { FilterControlProps } from '../types';

export function SelectIndifferent({ def, value, disabled, disabledReason, facetCounts, onChange }: FilterControlProps) {
  const options = def.options ?? [];
  const current = typeof value === 'string' ? value : Array.isArray(value) ? String(value[0] ?? '') : '';
  const warning = semanticsWarningTooltip(def);
  const selectId = `filter-${def.id}`;

  return (
    <div class="kycar-control kycar-control--select">
      <label for={selectId}>
        {def.label}
        {warning !== undefined ? (
          <span class="kycar-warning-icon" title={warning} aria-label={warning}>
            (?)
          </span>
        ) : null}
      </label>
      <select
        id={selectId}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        value={current}
        onChange={(e) => {
          const v = (e.currentTarget as HTMLSelectElement).value;
          onChange({ filterId: def.id, value: v.length > 0 ? v : undefined, gesture: 'discrete-change' });
        }}
      >
        <option value="">Indifférent</option>
        {options.map((opt) => {
          const count = facetCounts?.get(opt.code);
          return (
            <option key={opt.code} value={opt.code}>
              {resolveOptionLabel(def, opt.code)}
              {count !== undefined ? ` (${count})` : ''}
            </option>
          );
        })}
      </select>
    </div>
  );
}
