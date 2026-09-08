/**
 * KYCAR — Localisation composite (`EX-SCR-70`) — `zip` (code postal/commune), `zipr` (rayon,
 * dépendant), `crossborder` (interrupteur). Le rayon et l'interrupteur sont désactivés tant que le
 * champ de localisation est vide (`EX-SCR-73`). `EX-SRCH-6` : la résolution géographique ne se
 * déclenche pas avant 4 caractères saisis (`POSTAL_CODE_MIN_CHARS`).
 */
import { POSTAL_CODE_MIN_CHARS } from '../../../state/debounce-policy';
import type { FilterDef } from '../../../state/filter-types';
import { resolveOptionLabel } from '../labels';
import type { OnFilterChange } from '../types';

export interface GeoCompositeProps {
  readonly locationDef: FilterDef;
  readonly radiusDef: FilterDef;
  readonly crossBorderDef: FilterDef;
  readonly locationValue: string | undefined;
  readonly radiusValue: string | undefined;
  readonly crossBorderValue: string | undefined;
  readonly onChange: OnFilterChange;
}

export function GeoComposite({
  locationDef,
  radiusDef,
  crossBorderDef,
  locationValue,
  radiusValue,
  crossBorderValue,
  onChange,
}: GeoCompositeProps) {
  const locationPosed = (locationValue ?? '').length >= POSTAL_CODE_MIN_CHARS;
  const crossActive = crossBorderValue === (crossBorderDef.booleanTrueCode ?? '1');

  return (
    <div class="kycar-control kycar-control--geo">
      <span class="kycar-control__label">Localisation</span>
      <input
        type="text"
        aria-label={locationDef.label}
        placeholder="Ville ou code postal"
        value={locationValue ?? ''}
        onInput={(e) => {
          const raw = (e.currentTarget as HTMLInputElement).value;
          onChange({ filterId: locationDef.id, value: raw.length > 0 ? raw : undefined, gesture: 'keystroke' });
        }}
      />
      <select
        aria-label={radiusDef.label}
        disabled={!locationPosed}
        title={!locationPosed ? 'Renseignez d’abord une localisation' : undefined}
        value={radiusValue ?? ''}
        onChange={(e) => {
          const v = (e.currentTarget as HTMLSelectElement).value;
          // EX-SRCH-7 : sélecteur dépendant, application immédiate (0 ms) — même geste que tout
          // contrôle discret (`resolveDebounceMs` résout les deux à 0 ms pour ce filtre).
          onChange({ filterId: radiusDef.id, value: v.length > 0 ? v : undefined, gesture: 'discrete-change' });
        }}
      >
        <option value="">Indifférent</option>
        {(radiusDef.options ?? []).map((opt) => (
          <option key={opt.code} value={opt.code}>
            {resolveOptionLabel(radiusDef, opt.code)}
          </option>
        ))}
      </select>
      <button
        type="button"
        role="switch"
        aria-checked={crossActive}
        disabled={!locationPosed}
        title={!locationPosed ? 'Renseignez d’abord une localisation' : undefined}
        class={`kycar-toggle${crossActive ? ' kycar-toggle--active' : ''}`}
        onClick={() => {
          onChange({
            filterId: crossBorderDef.id,
            value: crossActive ? undefined : crossBorderDef.booleanTrueCode ?? '1',
            gesture: 'discrete-change',
          });
        }}
      >
        Inclure au-delà de la frontière
      </button>
      <p class="kycar-control__hint">
        Le code postal exact n&apos;est pas conservé par KYCAR ; la distance est calculée à la
        requête puis oubliée.
      </p>
    </div>
  );
}
