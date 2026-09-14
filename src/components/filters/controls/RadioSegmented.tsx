/**
 * KYCAR — Boutons radio segmentés (`EX-SCR-63`) — enum_single, domaine ≤ 4 valeurs.
 * Concerne : `custtype`, `powertype`, `desc` (+ tout filtre secondaire generé par `EX-SCR-72bis`).
 */
import { moveRovingIndex } from '../keyboard-nav';
import { resolveOptionLabel, semanticsWarningTooltip } from '../labels';
import type { FilterControlProps } from '../types';

export function RadioSegmented({ def, value, disabled, disabledReason, facetCounts, onChange }: FilterControlProps) {
  const options = def.options ?? [];
  const current = typeof value === 'string' ? value : Array.isArray(value) ? String(value[0] ?? '') : undefined;
  const warning = semanticsWarningTooltip(def);

  const focusRadioAt = (index: number, el: HTMLElement): void => {
    const group = el.closest('[role="radiogroup"]');
    const items = group?.querySelectorAll<HTMLElement>('[role="radio"]');
    items?.item(index)?.focus();
  };

  return (
    <div class="kycar-control kycar-control--radio-segmented">
      <span class="kycar-control__label">
        {def.label}
        {warning !== undefined ? (
          <span class="kycar-warning-icon" title={warning} aria-label={warning}>
            (?)
          </span>
        ) : null}
      </span>
      <div
        role="radiogroup"
        aria-label={def.label}
        aria-disabled={disabled}
        title={disabled ? disabledReason : undefined}
      >
        {options.map((opt, i) => {
          const checked = current === opt.code;
          const isDefault = def.defaultValue !== undefined && String(def.defaultValue) === opt.code;
          const count = facetCounts?.get(opt.code);
          return (
            <button
              key={opt.code}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              tabIndex={checked || (i === 0 && current === undefined) ? 0 : -1}
              class={`kycar-radio-segment${checked ? ' kycar-radio-segment--checked' : ''}`}
              onClick={() => {
                onChange({ filterId: def.id, value: checked ? undefined : opt.code, gesture: 'discrete-change' });
              }}
              onKeyDown={(e) => {
                const key = e.key;
                if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') {
                  e.preventDefault();
                  const next = moveRovingIndex(i, options.length, key, 'horizontal');
                  focusRadioAt(next, e.currentTarget as HTMLElement);
                }
              }}
            >
              {resolveOptionLabel(def, opt.code)}
              {isDefault ? ' (défaut)' : ''}
              {count !== undefined ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
