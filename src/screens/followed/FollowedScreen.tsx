/**
 * KYCAR — Écran F, modèles suivis (lot D8, EX-SCR-214bis / EX-NAV-4, EX-CRUD-7..10)
 * =================================================================================================
 * Liste les couples marque/modèle suivis, avec accès direct à la route canonique de l'écran B pour
 * chacun (EX-CRUD-7 : aucun filtre stocké) et le retrait (EX-CRUD-9). Fonction pure de ses props ;
 * la coquille possède la banque `FollowedModelStore` et résout les libellés via `ReferenceData`.
 */
import type { JSX } from 'preact';

import type { LoadedRecord } from '../../persistence/crud-store';
import type { FollowedModel } from '../../persistence/followed-models';
import { FOLLOWED_MODELS_CAP } from '../../persistence/followed-models';

export interface FollowedRow {
  readonly makeId: number;
  readonly modelId: number;
  readonly name: string;
  readonly ajouteLe: string;
}

export interface FollowedScreenProps {
  readonly rows: readonly LoadedRecord<FollowedModel>[];
  readonly nameOf: (makeId: number, modelId: number) => string;
  readonly onOpen: (makeId: number, modelId: number) => void;
  readonly onUnfollow: (makeId: number, modelId: number) => void;
  /** `EX-SCR-214bis` (DR-090) — effectif ACTUEL du couple (recalculé par l'hôte). `null` =
   * indisponible (`ET-ERREUR-PROVIDER`), `'loading'` = pas encore résolu (`ET-CHARGE-INIT`,
   * squelette), absent = même repli que `'loading'`. */
  readonly currentCountOf?: (makeId: number, modelId: number) => number | null | 'loading';
  /** `EX-SCR-27bis`-like (DR-090, ET-VIDE-FILTRES) : amorce vers l'écran A depuis l'état vide. */
  readonly onGoToMarket?: () => void;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat('fr-BE', { dateStyle: 'medium' }).format(d);
}

export function FollowedScreen(props: FollowedScreenProps): JSX.Element {
  return (
    <section class="kycar-followed" aria-labelledby="kycar-followed-title">
      {/* `EX-SCR-214bis` (DR-090) : en-tête `<n> / 30 modèles suivis`. */}
      <h1 id="kycar-followed-title">
        Modèles suivis ({`${props.rows.length} / ${FOLLOWED_MODELS_CAP} modèles suivis`})
      </h1>
      {props.rows.length === 0 ? (
        <div class="kycar-followed-empty">
          <p>
            Aucun modèle suivi. Depuis l’écran d’un modèle, utilisez le bouton « Suivre » pour l’ajouter
            ici (jusqu’à {FOLLOWED_MODELS_CAP} modèles). Aucune veille automatique n’est fournie (snapshot périodique).
          </p>
          <p>Suivez un modèle depuis l’en-tête de l’écran B.</p>
          <button type="button" onClick={props.onGoToMarket}>
            Aller au survol du marché
          </button>
        </div>
      ) : (
        <ul class="kycar-followed-rows">
          {props.rows.map(({ value }) => {
            const name = props.nameOf(value.makeId, value.modelId);
            const current = props.currentCountOf ? props.currentCountOf(value.makeId, value.modelId) : 'loading';
            return (
              <li key={`${value.makeId}:${value.modelId}`} class="kycar-followed-row">
                <button type="button" class="kycar-followed-open" onClick={() => props.onOpen(value.makeId, value.modelId)}>
                  {name}
                </button>
                <span class="kycar-followed-date">suivi depuis le {fmtDate(value.ajouteLe)}</span>
                {/* `EX-SCR-214bis` (DR-090) : effectif actuel par carte. */}
                {current === 'loading' ? (
                  <span class="kycar-market-skeleton-block" aria-hidden="true" />
                ) : current === null ? (
                  <span class="kycar-followed-current">effectif actuel indisponible</span>
                ) : (
                  <span class="kycar-followed-current">{current.toLocaleString('fr-BE')} offres actuellement</span>
                )}
                <button
                  type="button"
                  class="no-print"
                  onClick={() => props.onUnfollow(value.makeId, value.modelId)}
                  aria-label={`Ne plus suivre ${name}`}
                >
                  Ne plus suivre
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
