/**
 * KYCAR — Ligne des filtres actifs (`EX-SCR-55` zone 4, `EX-SCR-75`/`76`/`77`/`78`/`94`)
 * =================================================================================================
 * Visible dès qu'au moins un filtre est posé ; région `aria-live="polite"` (`EX-SCR-99`) annonçant
 * le nombre de filtres actifs à chaque changement, sans lire le contenu entier à chaque frappe.
 *
 * `DR-139` (résidu) : le compteur de résultats suit désormais le format normatif d'`EX-SCR-78`
 * (`formatOfferCount`, `EX-SCR-10`) à l'extrémité droite de la zone, atténué et suivi de `…`
 * pendant `ET-CHARGE-MAJ` — jamais un texte inline accolé au résumé de jetons, jamais `0`. Le
 * bouton `Enregistrer la recherche` d'`EX-SCR-94` n'est rendu QUE si l'appelant fournit
 * `onSaveSearch` : le CRUD lui-même (`req-behaviour`, écran E) est un autre lot, déjà livré
 * ailleurs dans la coquille (`src/app.tsx`, `saveCurrentSearch`/`MarketToolbar`) — ce composant ne
 * le duplique pas, il expose seulement le point de câblage.
 *
 * `EX-SCR-101` (`D8-31`, vague F3) : un filtre devenu SANS EFFET sur le snapshot courant (un
 * `modelId` disparu, par exemple) n'est JAMAIS retiré — il est conservé, sa rangée est marquée en
 * ambre (`data-ineffective="true"`), son infobulle porte le message normatif, et il est compté
 * SÉPARÉMENT (« 1 filtre sans effet »), à côté — et non à la place — du compteur de filtres actifs.
 * Le constat lui-même est calculé par la fonction pure `ineffectiveFilters` (`src/state`), ce
 * composant ne fait que le rendre.
 */
import { buildActiveFilterTokens, type TokenTaxonomyReference } from './labels';
import type { FilterValue, SelectionState } from '../../state/filter-types';
import {
  ineffectiveFilterCountLabel,
  ineffectiveFilters,
  type IneffectiveTaxonomy,
} from '../../state/ineffective-filters';
import { formatOfferCount } from '../../screens/market/format';

export interface ActiveFilterTokensProps {
  readonly selection: SelectionState;
  /** `D8-04d` : résout les libellés taxonomiques du jeton `mmmv` (« Volkswagen », « Golf »),
   * jamais le code brut — absent ⇒ repli sur un espace réservé numéroté (`labels.ts`). */
  readonly referenceData?: TokenTaxonomyReference;
  /**
   * `EX-SCR-101` — date du snapshot SERVI (`SnapshotDescriptor.capturedAt`). Elle vaut DÉCLARATION
   * de l'appelant : « la taxonomie que je te donne est celle de ce snapshot-là ». Absente ⇒ aucun
   * marquage « sans effet », aucun changement de rendu (non-régression : la coquille qui ne câble
   * pas encore ce prop obtient exactement le rendu d'avant `D8-31`).
   */
  readonly snapshotDate?: string | Date;
  /**
   * `EX-SCR-101` — taxonomie du snapshot, quand elle DIFFÈRE du référentiel de libellés
   * (`referenceData`). Aujourd'hui les deux coïncident (le référentiel est chargé une fois au
   * démarrage, `main.tsx`) et ce prop est inutile ; il existe pour le jour où un provider réel
   * servira sa propre taxonomie avec le snapshot, sans avoir à changer ce composant.
   */
  readonly snapshotTaxonomy?: IneffectiveTaxonomy;
  readonly resultCount?: number;
  /** `EX-SCR-78` : pendant `ET-CHARGE-MAJ`, `true` fait afficher `resultCount` (la dernière valeur
   * CONNUE, jamais `0`) atténué et suivi de `…`. L'appelant continue de passer le dernier effectif
   * résolu ; ce composant ne recalcule ni ne mémorise rien lui-même. */
  readonly resultCountLoading?: boolean;
  readonly onRemove: (filterIds: readonly string[]) => void;
  readonly onClearAll: () => void;
  /** Retrait UNITAIRE d'une valeur, depuis l'infobulle d'un jeton à cardinal (`EX-SCR-76` « en
   * substance », `D-10`, `DR-062`). Absent des jetons à 1 ou 2 valeurs (`removalTargets` alors
   * absent), qui se retirent entièrement via `onRemove`. */
  readonly onRemovePartial: (filterId: string, removesCodes: readonly string[]) => void;
  /** `D8-04d` : retrait du jeton « modèle » de `mmmv` — RESTREINT le filtre à `value` plutôt que
   * de le supprimer (`narrowsTo`, `labels.ts`). Seul le jeton de niveau modèle en porte un ; les
   * autres croix passent par `onRemove`. */
  readonly onNarrow: (filterId: string, value: FilterValue) => void;
  /** `EX-SCR-94` : ouvre le CRUD d'enregistrement de recherche (écran E). Absent ⇒ le bouton n'est
   * pas rendu — n'invente jamais un mécanisme d'enregistrement local (`DR-139`). */
  readonly onSaveSearch?: () => void;
}

/** Identifiant DOM stable et sûr pour `aria-describedby`, dérivé de la clé du jeton. */
function ineffectiveNoteId(tokenKey: string): string {
  return `kycar-ineffective-${tokenKey.replace(/[^A-Za-z0-9_-]/g, '-')}`;
}

export function ActiveFilterTokens({
  selection,
  referenceData,
  snapshotDate,
  snapshotTaxonomy,
  resultCount,
  resultCountLoading,
  onRemove,
  onClearAll,
  onRemovePartial,
  onNarrow,
  onSaveSearch,
}: ActiveFilterTokensProps) {
  const tokens = buildActiveFilterTokens(selection, referenceData);
  if (tokens.length === 0) return null;

  // `EX-SCR-101` : constat PUR, calculé une fois, jamais un retrait. Sans date de snapshot déclarée
  // par l'appelant, aucun constat n'est même demandé — le rendu reste celui d'avant.
  const taxonomy = snapshotTaxonomy ?? referenceData;
  const ineffective =
    snapshotDate === undefined ? { ids: [], reasons: [] } : ineffectiveFilters(selection, { taxonomy, snapshotDate });
  const reasonByTokenKey = new Map(ineffective.reasons.map((r) => [r.tokenKey, r]));
  const ineffectiveLabel = ineffectiveFilterCountLabel(ineffective.ids.length);

  return (
    <div class="kycar-active-tokens" role="region" aria-live="polite" aria-label="Filtres actifs">
      <span class="kycar-active-tokens__summary">
        {tokens.length} filtre{tokens.length > 1 ? 's' : ''} actif{tokens.length > 1 ? 's' : ''}
      </span>
      {ineffectiveLabel !== null ? (
        <span class="kycar-active-tokens__ineffective">{ineffectiveLabel}</span>
      ) : null}
      <ul class="kycar-active-tokens__list">
        {tokens.map((t) => {
          const reason = reasonByTokenKey.get(t.key);
          const noteId = reason !== undefined ? ineffectiveNoteId(t.key) : undefined;
          return (
          <li
            key={t.key}
            class={reason !== undefined ? 'kycar-token kycar-token--ineffective' : 'kycar-token'}
            data-ineffective={reason !== undefined ? 'true' : undefined}
            aria-describedby={noteId}
            title={reason !== undefined ? reason.message : t.removalTargets === undefined ? t.tooltip : undefined}
          >
            <span>{t.text}</span>
            {reason !== undefined ? (
              <span id={noteId} class="kycar-token__ineffective-note">
                {reason.message}
              </span>
            ) : null}
            <button
              type="button"
              aria-label={`Retirer le filtre ${t.text}`}
              onClick={() => (t.narrowsTo !== undefined ? onNarrow(t.narrowsTo.filterId, t.narrowsTo.value) : onRemove(t.filterIds))}
            >
              ×
            </button>
            {t.removalTargets !== undefined ? (
              <ul class="kycar-token__removal-popover" aria-label={`Valeurs de ${t.text}`}>
                {t.removalTargets.map((target) => (
                  <li key={target.label}>
                    <span>{target.label}</span>
                    <button
                      type="button"
                      aria-label={`Retirer ${target.label}`}
                      onClick={() => onRemovePartial(t.filterIds[0]!, target.removesCodes)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
          );
        })}
      </ul>
      <button type="button" class="kycar-active-tokens__clear-all" onClick={onClearAll}>
        Tout effacer
      </button>
      {onSaveSearch !== undefined ? (
        <button type="button" class="kycar-active-tokens__save-search" onClick={onSaveSearch}>
          Enregistrer la recherche
        </button>
      ) : null}
      {resultCount !== undefined ? (
        <span class="kycar-active-tokens__count" style={{ marginLeft: 'auto' }}>
          {resultCountLoading === true ? (
            <span class="kycar-active-tokens__count--dim">{formatOfferCount(resultCount)}…</span>
          ) : (
            formatOfferCount(resultCount)
          )}
        </span>
      ) : null}
    </div>
  );
}
