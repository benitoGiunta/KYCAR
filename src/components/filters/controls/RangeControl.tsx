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
 * message inline s'affiche. `[amendée 3.6 — D3-46]` : ce contrôle et le ramenage au domaine
 * s'exercent à la validation du champ (sortie, Entrée), plus à chaque frappe.
 */
import { useEffect, useState } from 'preact/hooks';

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
  /** `EX-SCR-98` (régime `compact`, `D8-15`) : la liste de paliers devient une liste déroulante
   * native au lieu de boutons — aucun histogramme miniature n'existe dans ce contrôle à ce jour
   * (`grep -rn "histogramme miniature\|MiniHistogram" src/components/filters` = 0 résultat avant
   * comme après cette correction : rien à masquer côté `RangeControl`, seule la construction du
   * palier change de forme). */
  readonly compact?: boolean;
  /** `D3-46` (a) — barre condensée : les paliers suggérés ne sont pas rendus (ils le sont dans la
   * carte du panneau « Tous les filtres ») ; la barre ne porte que les deux champs. Défaut `true`. */
  readonly showSteps?: boolean;
  /** `D3-46` (a) — libellé court (« Prix », « Km ») : texte indicatif des champs de la barre
   * condensée (« Prix min » / « Prix max »), où le libellé visible peut être masqué faute de
   * largeur. Absent ⇒ aucun texte indicatif (rendu d'avant). */
  readonly shortLabel?: string;
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

export interface RangeStepsProps {
  readonly steps: readonly number[];
  readonly unit?: string;
  readonly label: string;
  readonly disabled: boolean;
  readonly compact?: boolean;
  readonly onPick: (step: number) => void;
}

/**
 * Les paliers suggérés d'un `RangeControl` (`EX-SCR-67`/`98`) — composant SANS hook (même principe
 * que `ScreenGMakeRow`/`CheckboxList`, appelable directement hors cycle de rendu Preact pour une
 * sonde de structure), extrait de `RangeControl` UNIQUEMENT parce que ce dernier porte des hooks
 * (`useState`) et ne peut donc pas être invoqué comme une fonction pure par une sonde. Régime
 * `compact` (`EX-SCR-98`) : liste déroulante native au lieu de boutons — AUCUN histogramme
 * miniature n'existe dans ce contrôle à ce jour (`grep -rn "histogramme miniature\|MiniHistogram"
 * src/components/filters` = 0 résultat avant comme après cette correction : rien à masquer côté
 * `RangeControl`, seule la construction du palier change de forme).
 */
export function RangeSteps({ steps, unit, label, disabled, compact, onPick }: RangeStepsProps) {
  if (compact === true) {
    return (
      <select
        class="kycar-range-steps__select"
        disabled={disabled}
        aria-label={`Paliers suggérés — ${label}`}
        value=""
        onChange={(e) => {
          const raw = (e.currentTarget as HTMLSelectElement).value;
          if (raw.length === 0) return;
          onPick(Number(raw));
          (e.currentTarget as HTMLSelectElement).value = '';
        }}
      >
        <option value="" disabled>
          Palier suggéré…
        </option>
        {steps.map((step) => (
          <option key={step} value={step}>
            {formatNumberFr(step, unit)}
          </option>
        ))}
      </select>
    );
  }
  return (
    <div class="kycar-range-steps">
      {steps.map((step) => (
        <button key={step} type="button" disabled={disabled} onClick={() => onPick(step)}>
          {formatNumberFr(step, unit)}
        </button>
      ))}
    </div>
  );
}

export function RangeControl({
  fromDef,
  toDef,
  fromValue,
  toValue,
  disabled,
  disabledReason,
  compact,
  showSteps = true,
  shortLabel,
  onChange,
}: RangeControlProps) {
  const [error, setError] = useState<string | null>(null);
  const [clampedMsg, setClampedMsg] = useState<string | null>(null);
  const label = toDef !== undefined ? fromDef.label.replace(/\s+de$/, '') : fromDef.label;
  const domain = fromDef.numericDomain;

  // `D3-46` (c) — le texte SAISI est un état local du contrôle : la valeur du brouillon n'est mise à
  // jour, pendant la frappe, que par une valeur COMPLÈTE et valide (dans le domaine, bornes dans
  // l'ordre). Une valeur intermédiaire (« 2 » en route vers « 20000 », sous le minimum de 500 €) ne
  // touche ni le brouillon ni le champ : elle était auparavant ramenée au minimum À LA FRAPPE, ce qui
  // réécrivait le champ sous les doigts de l'utilisateur (« 2 » → « 500 », puis « 5000 »…). Le
  // contrôle d'`EX-SCR-67`/`68` (valeur ramenée au domaine, borne basse > borne haute refusée)
  // s'exerce à la VALIDATION du champ : sortie du champ (`blur`) ou Entrée — qui, elle, applique
  // ensuite le brouillon (`FilterBand`).
  const [fromText, setFromText] = useState(fromValue === undefined ? '' : String(fromValue));
  const [toText, setToText] = useState(toValue === undefined ? '' : String(toValue));
  const matches = (text: string, value: number | undefined): boolean =>
    value === undefined ? text.trim().length === 0 : text.trim().length > 0 && Number(text) === value;
  // Valeur changée HORS de la frappe (« Annuler », palier, jeton retiré, retour arrière) : le champ
  // reprend la valeur du brouillon.
  useEffect(() => {
    if (!matches(fromText, fromValue)) setFromText(fromValue === undefined ? '' : String(fromValue));
  }, [fromValue]);
  useEffect(() => {
    if (!matches(toText, toValue)) setToText(toValue === undefined ? '' : String(toValue));
  }, [toValue]);

  const defOf = (which: 'from' | 'to'): FilterDef => (which === 'from' ? fromDef : toDef ?? fromDef);
  const outOfOrder = (which: 'from' | 'to', n: number): boolean => {
    if (toDef === undefined) return false;
    const nextFrom = which === 'from' ? n : fromValue;
    const nextTo = which === 'to' ? n : toValue;
    return nextFrom !== undefined && nextTo !== undefined && nextFrom > nextTo;
  };

  /** Frappe : met à jour le texte ; propage au brouillon une valeur vide ou complète et valide. */
  const onTyped = (which: 'from' | 'to', raw: string): void => {
    if (which === 'from') setFromText(raw);
    else setToText(raw);
    setError(null);
    const def = defOf(which);
    if (raw.trim().length === 0) {
      onChange({ filterId: def.id, value: undefined, gesture: 'keystroke' });
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    if (clampToDomain(n, def).clamped) return; // hors domaine : tranché à la validation du champ
    if (outOfOrder(which, n)) return; // bornes inversées : tranché à la validation du champ
    onChange({ filterId: def.id, value: n, gesture: 'keystroke' });
  };

  /** Validation du champ (`blur`, Entrée) : domaine (`EX-SCR-67`), ordre des bornes (`EX-SCR-68`). */
  const commitTyped = (which: 'from' | 'to'): void => {
    const raw = which === 'from' ? fromText : toText;
    const current = which === 'from' ? fromValue : toValue;
    const setText = which === 'from' ? setFromText : setToText;
    if (raw.trim().length === 0) return;
    const n = Number(raw);
    const def = defOf(which);
    if (!Number.isFinite(n)) {
      setText(current === undefined ? '' : String(current));
      return;
    }
    const { value: clamped, clamped: wasClamped } = clampToDomain(n, def);
    if (outOfOrder(which, clamped)) {
      setError('La borne basse dépasse la borne haute');
      setText(current === undefined ? '' : String(current));
      return; // EX-SCR-68 : refusé, jamais permuté, ancienne valeur conservée
    }
    if (wasClamped) {
      setText(String(clamped));
      setClampedMsg(`Ramené à ${formatNumberFr(clamped, fromDef.unit)}`);
      setTimeout(() => setClampedMsg(null), 4000);
    }
    if (clamped !== current) onChange({ filterId: def.id, value: clamped, gesture: 'keystroke' });
  };
  const onFieldKeyDown = (which: 'from' | 'to', e: KeyboardEvent): void => {
    // Entrée valide d'abord le champ ; l'événement remonte ensuite au bandeau, qui applique.
    if (e.key === 'Enter') commitTyped(which);
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
          placeholder={shortLabel !== undefined ? `${shortLabel} min` : undefined}
          value={fromText}
          disabled={disabled}
          min={domain?.min}
          max={domain?.max}
          onInput={(e) => onTyped('from', (e.currentTarget as HTMLInputElement).value)}
          onBlur={() => commitTyped('from')}
          onKeyDown={(e) => onFieldKeyDown('from', e)}
        />
        {toDef !== undefined ? (
          <>
            <span aria-hidden="true">à</span>
            <input
              type="number"
              aria-label={toDef.label}
              placeholder={shortLabel !== undefined ? `${shortLabel} max` : undefined}
              value={toText}
              disabled={disabled}
              min={domain?.min}
              max={domain?.max}
              onInput={(e) => onTyped('to', (e.currentTarget as HTMLInputElement).value)}
              onBlur={() => commitTyped('to')}
              onKeyDown={(e) => onFieldKeyDown('to', e)}
            />
          </>
        ) : null}
      </div>
      {showSteps && domain?.steps !== undefined ? (
        <RangeSteps
          steps={domain.steps}
          unit={fromDef.unit}
          label={label}
          disabled={disabled}
          compact={compact}
          onPick={(step) => commitPalier(toDef !== undefined && fromValue !== undefined ? 'to' : 'from', step)}
        />
      ) : null}
      {error !== null ? <p class="kycar-control__error" role="alert">{error}</p> : null}
      {clampedMsg !== null ? <p class="kycar-control__hint" role="status">{clampedMsg}</p> : null}
    </div>
  );
}
