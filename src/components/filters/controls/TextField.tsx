/**
 * KYCAR — Champ texte libre avec compteur de caractères (`EX-SCR-71`) — `kwd`, `version0`,
 * `region`, `dlv_max`. `kwd` porte un libellé flottant distinct du champ `Rechercher un filtre`
 * pour ne jamais être confondu (voir `FilterSearch.tsx`).
 */
import type { FilterControlProps } from '../types';

const MAX_LENGTH = 240;

export function TextField({ def, value, disabled, disabledReason, onChange }: FilterControlProps) {
  const current = typeof value === 'string' ? value : Array.isArray(value) ? String(value[0] ?? '') : '';
  const inputId = `filter-${def.id}`;

  return (
    <div class="kycar-control kycar-control--text">
      <label for={inputId}>{def.label}</label>
      <input
        id={inputId}
        type="text"
        value={current}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        maxLength={MAX_LENGTH}
        onInput={(e) => {
          const raw = (e.currentTarget as HTMLInputElement).value;
          onChange({ filterId: def.id, value: raw.length > 0 ? raw : undefined, gesture: 'keystroke' });
        }}
      />
      <span class="kycar-control__counter">
        {current.length}/{MAX_LENGTH}
      </span>
    </div>
  );
}
