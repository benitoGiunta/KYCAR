/**
 * KYCAR — Pied de grille de l'écran A (lot D6), `EX-SCR-129`
 * =================================================================================================
 * Pas de pagination numérotée : indicateur `<n> marques sur <N>` en permanence, bouton `Charger 12
 * marques de plus` en repli d'un observateur d'intersection que ce composant NE POSSÈDE PAS lui-même
 * (dette signalée, README) — c'est un bouton explicite dans tous les cas, l'hôte peut en plus câbler
 * un `IntersectionObserver` qui appelle `onLoadMore` automatiquement à 600 px du bas.
 */
import type { JSX } from 'preact';

import { formatInteger } from './format';

export interface GridFooterProps {
  readonly loadedCount: number;
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly batchSize: number;
  readonly onLoadMore: () => void;
}

export function GridFooter(props: GridFooterProps): JSX.Element {
  return (
    <div class="kycar-market-grid-footer">
      <span>
        {formatInteger(props.loadedCount)} marques sur {formatInteger(props.totalCount)}
      </span>
      {props.hasMore ? (
        <button type="button" onClick={props.onLoadMore}>
          Charger {props.batchSize} marques de plus
        </button>
      ) : null}
    </div>
  );
}
