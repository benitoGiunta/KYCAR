/**
 * KYCAR — Champ numérique unique (`EX-SCR-67`/`72bis`) — type `number` (ex. `page`, `size`).
 */
import type { FilterControlProps } from '../types';

export function NumberField({ def, value, disabled, disabledReason, onChange }: FilterControlProps) {
  const current = typeof value === 'number' ? value : Array.isArray(value) ? Number(value[0]) : undefined;
  const domain = def.numericDomain;
  const inputId = `filter-${def.id}`;

  return (
    <div class="kycar-control kycar-control--number">
      <label for={inputId}>{def.label}</label>
      <input
        id={inputId}
        type="number"
        value={current ?? ''}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        min={domain?.min}
        max={domain?.max}
        onInput={(e) => {
          const raw = (e.currentTarget as HTMLInputElement).value;
          if (raw.trim().length === 0) {
            onChange({ filterId: def.id, value: undefined, gesture: 'keystroke' });
            return;
          }
          const n = Number(raw);
          if (Number.isFinite(n)) onChange({ filterId: def.id, value: n, gesture: 'keystroke' });
        }}
      />
    </div>
  );
}
