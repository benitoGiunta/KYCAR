/**
 * KYCAR — Interrupteur à deux états (`EX-SCR-69`) — jamais une case à cocher tri-état.
 * Un booléen faux n'est jamais émis dans l'URL (le codec D5-core l'omet déjà ; ce composant se
 * contente de retirer la clé de la sélection plutôt que d'y écrire une valeur "fausse").
 */
import type { FilterControlProps } from '../types';

export function BooleanToggle({ def, value, disabled, disabledReason, onChange }: FilterControlProps) {
  const trueCode = def.booleanTrueCode ?? '1';
  const active = (Array.isArray(value) ? String(value[0] ?? '') : value !== undefined ? String(value) : '') === trueCode;
  const switchId = `filter-${def.id}`;

  return (
    <div class="kycar-control kycar-control--boolean">
      <label for={switchId}>{def.label}</label>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={active}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        class={`kycar-toggle${active ? ' kycar-toggle--active' : ''}`}
        onClick={() => {
          onChange({ filterId: def.id, value: active ? undefined : trueCode, gesture: 'discrete-change' });
        }}
      >
        {active ? 'Actif' : 'Non filtré'}
      </button>
    </div>
  );
}
