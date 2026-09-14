/**
 * KYCAR — Panneau dédié à recherche interne (`EX-SCR-66`) — enum_multi, n > 14. Concerne
 * uniquement `eq` (136 valeurs, `EX-SRCH-2`, 250 ms). L'avertissement de sémantique « ET présumée »
 * (Z1) est affiché en tête, jamais utilisé pour un calcul (`EX-SCR-85`).
 *
 * DETTE SIGNALÉE : la liste n'est pas virtualisée (`EX-SCR-100` demande un index préconstruit et
 * un rendu non bloquant sur 101 filtres/136 valeurs) — à 136 lignes le DOM reste largement sous le
 * budget de frame de 16 ms sur desktop, mais la virtualisation réelle (fenêtrage) est laissée à
 * l'intégration D8, qui dispose du contexte de performance réel (Moto G4 cible d'`EX-SCR-100`).
 */
import { useMemo, useState } from 'preact/hooks';

import { resolveOptionLabel } from '../labels';
import type { FilterControlProps } from '../types';

function toCodeSet(value: unknown): Set<string> {
  if (Array.isArray(value)) return new Set(value.map(String));
  if (value === undefined || value === null) return new Set();
  return new Set([String(value)]);
}

export function PanelSearchMulti({ def, value, disabled, disabledReason, facetCounts, onChange }: FilterControlProps) {
  const [query, setQuery] = useState('');
  const options = def.options ?? [];
  const current = toCodeSet(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return options;
    return options.filter((o) => resolveOptionLabel(def, o.code).toLowerCase().includes(q));
  }, [query, options, def]);

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
    <fieldset class="kycar-control kycar-control--panel-search" disabled={disabled} title={disabled ? disabledReason : undefined}>
      <legend>{def.label}</legend>
      <p class="kycar-control__warning">
        Sémantique ET présumée, non prouvée (REF-filters Z1) — un cumul d&apos;équipements peut
        donner un résultat inattendu
      </p>
      <p class="kycar-control__hint">
        {current.size} équipement{current.size === 1 ? '' : 's'} sélectionné{current.size === 1 ? '' : 's'}
      </p>
      <input
        type="text"
        placeholder="Rechercher un équipement…"
        value={query}
        disabled={disabled}
        onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
      />
      {current.size > 0 ? (
        <button type="button" onClick={() => onChange({ filterId: def.id, value: undefined, gesture: 'discrete-change' })}>
          Tout décocher
        </button>
      ) : null}
      <ul class="kycar-panel-search-list">
        {filtered.map((opt) => {
          const id = `filter-${def.id}-${opt.code}`;
          const count = facetCounts?.get(opt.code);
          return (
            <li key={opt.code}>
              <label for={id}>
                <input id={id} type="checkbox" checked={current.has(opt.code)} disabled={disabled} onChange={() => toggle(opt.code)} />
                {resolveOptionLabel(def, opt.code)}
                {count !== undefined ? ` (${count})` : ''}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
