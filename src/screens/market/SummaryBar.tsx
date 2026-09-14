/**
 * KYCAR — Barre de synthèse et de tri de l'écran A (lot D6), `EX-SCR-106`
 * =================================================================================================
 * `<n> marques · <n> modèles · <n> offres`, puis le tri, puis le sens, puis la case de masquage des
 * modèles épars (`EX-SCR-128`). Composant fin, même convention que les autres `.tsx` de ce dossier.
 */
import type { JSX } from 'preact';

import { MISSING_VALUE, formatInteger, formatOfferCount } from './format';
import { MAKE_SORT_FIELD_LABEL, type MakeSortField, type SortDirection } from './sort';

/**
 * `ACC-15` / `D8-42` (`EX-SCR-1`..`4`, `EX-SCR-106`) — cardinal ACCORDÉ : « 1 marque », « 2
 * marques », « 0 modèle ». En français le singulier couvre 0 et 1 ; le pluriel commence à 2.
 * `formatOfferCount` porte déjà la même règle pour les offres (et « aucune offre » à 0).
 */
function cardinal(n: number, singular: string, plural = `${singular}s`): string {
  return `${formatInteger(n)} ${n > 1 ? plural : singular}`;
}

export interface SummaryBarProps {
  readonly makeCount: number;
  /**
   * `ACC-05` / `D8-42` (`D8-02`, `EX-SCR-132`) — `null` = cardinal PAS ENCORE connu : la barre rend
   * « — modèles », jamais `0`. Un `0` reçu ici est un zéro MESURÉ et s'affiche comme tel.
   * Source : `marketModelCardinal` (`view-model.ts`).
   */
  readonly modelCount: number | null;
  readonly offerCount: number;
  /** `EX-SCR-106` : si différent de `makeCount` (population affichée < population filtrée). */
  readonly displayedMakeCount?: number;
  readonly sortField: MakeSortField;
  readonly sortDirection: SortDirection;
  readonly onSortFieldChange: (field: MakeSortField) => void;
  readonly onSortDirectionToggle: () => void;
  readonly sortDisabled: boolean;
  readonly hideSparseModels: boolean;
  readonly onToggleHideSparseModels: (next: boolean) => void;
  /** `EX-SCR-23`/`29` : le contrôle `Exporter` visé par ces deux exigences est celui-ci — la barre
   * de synthèse de l'écran A (`ARB-44`), pas un bouton flottant ailleurs sur l'écran. */
  readonly onExport: () => void;
  readonly exportDisabled: boolean;
  readonly exportDisabledReason?: string;
  /** `EX-SCR-135` — régime `'compact'` (< 768 px) : le cardinal « modèles » disparaît et le
   * `<select>` de tri devient un déclencheur 44 px ouvrant une feuille de sélection. Absent ou
   * différent de `'compact'` : comportement inchangé (intermédiaire/large). Composant SANS HOOK
   * (contrainte du lot, `structure-a11y.test.ts` l'appelle hors cycle de rendu Preact) : la
   * « feuille » de tri compacte est un `<details>` natif, pas un état local. */
  readonly regime?: 'compact' | 'intermediate' | 'large';
  /** `ET-PARTIEL-CACHE` (`EX-SCR-29`, DR-093) — les chiffres viennent du CACHE (mode dégradé) : ils
   * portent un astérisque et l'export est refusé (on n'exporte pas un agrégat qu'on ne peut pas
   * dater du snapshot courant). Absent = nominal. */
  readonly partialCache?: boolean;
}

const SORT_FIELDS: readonly MakeSortField[] = ['offres', 'median', 'alpha', 'modeles'];

export function SummaryBar(props: SummaryBarProps): JSX.Element {
  const compact = props.regime === 'compact';
  // `ACC-05` — cardinal des modèles : « — modèles » tant que la donnée manque (`D8-02`).
  const modelCardinal = props.modelCount === null ? null : cardinal(props.modelCount, 'modèle');
  return (
    <div class="kycar-market-summary-bar summary-bar">
      <div class="kycar-market-summary-counts">
        {props.makeCount === 0 ? (
          '0 marque · 0 modèle · aucune offre'
        ) : (
          <>
            {cardinal(props.makeCount, 'marque')}
            {!compact ? <> · {modelCardinal ?? `${MISSING_VALUE} modèles`}</> : null}{' '}
            · {formatOfferCount(props.offerCount)}
            {props.partialCache === true ? <abbr title="chiffres issus du cache (mode dégradé)">&nbsp;*</abbr> : null}
            {props.displayedMakeCount !== undefined && props.displayedMakeCount !== props.makeCount ? (
              <span class="kycar-muted">
                {' '}
                — {cardinal(props.displayedMakeCount, 'marque affichée', 'marques affichées')}
              </span>
            ) : null}
          </>
        )}
      </div>
      <div class="kycar-market-sort-controls">
        {compact ? (
          <details class="kycar-sort-sheet">
            <summary
              class="kycar-sort-sheet-trigger"
              aria-disabled={props.sortDisabled}
              title={props.sortDisabled ? 'Aucun résultat à trier' : undefined}
            >
              Trier : {MAKE_SORT_FIELD_LABEL[props.sortField]} {props.sortDirection === 'asc' ? '↑' : '↓'}
            </summary>
            <div role="listbox" aria-label="Choisir un tri" class="kycar-sort-sheet-list">
              {SORT_FIELDS.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="option"
                  aria-selected={f === props.sortField}
                  disabled={props.sortDisabled}
                  onClick={() => props.onSortFieldChange(f)}
                >
                  {MAKE_SORT_FIELD_LABEL[f]}
                </button>
              ))}
              <button
                type="button"
                disabled={props.sortDisabled}
                aria-label={props.sortDirection === 'asc' ? 'Trier en ordre décroissant' : 'Trier en ordre croissant'}
                onClick={props.onSortDirectionToggle}
              >
                Inverser le sens ({props.sortDirection === 'asc' ? '↑' : '↓'})
              </button>
            </div>
          </details>
        ) : (
          <>
            <label>
              Trier par{' '}
              <select
                disabled={props.sortDisabled}
                title={props.sortDisabled ? 'Aucun résultat à trier' : undefined}
                value={props.sortField}
                onChange={(e: JSX.TargetedEvent<HTMLSelectElement>) => props.onSortFieldChange(e.currentTarget.value as MakeSortField)}
              >
                {SORT_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {MAKE_SORT_FIELD_LABEL[f]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={props.sortDisabled}
              aria-label={props.sortDirection === 'asc' ? 'Trier en ordre décroissant' : 'Trier en ordre croissant'}
              onClick={props.onSortDirectionToggle}
            >
              {props.sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </>
        )}
        <label>
          <input
            type="checkbox"
            checked={props.hideSparseModels}
            onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => props.onToggleHideSparseModels(e.currentTarget.checked)}
          />{' '}
          Masquer les modèles à moins de 3 offres
        </label>
        <button type="button" disabled={props.exportDisabled} title={props.exportDisabledReason} onClick={props.onExport}>
          Exporter
        </button>
      </div>
    </div>
  );
}
