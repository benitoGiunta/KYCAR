/**
 * KYCAR — Cadre commun de graphe (lot D7, EX-SCR-188/178/171)
 * =================================================================================================
 * Enveloppe accessible partagée par tous les graphes de l'écran B :
 *   - un `<h3>` visible + `aria-label` résumant la lecture (EX-SCR-188) ;
 *   - un bouton `Voir les données` qui déplie le TABLEAU DE DONNÉES ÉQUIVALENT (EX-NFR-15) — seule
 *     voie conforme pour un lecteur d'écran ;
 *   - la note d'exclusion par graphe (EX-SCR-178) quand des annonces sont exclues ;
 *   - conteneur défilable horizontalement en dessous de la largeur de lisibilité (EX-SCR-183).
 */

import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

export interface ExclusionNote {
  readonly count: number;
  readonly reason: string;
}

export interface GraphFrameProps {
  readonly graphId: string;
  readonly title: string;
  readonly ariaLabel: string;
  /** Effectif du graphe, affiché entre parenthèses s'il diffère de l'en-tête (EX-SCR-191). */
  readonly count?: number;
  /** Notes d'exclusion (EX-SCR-178). */
  readonly exclusions?: readonly ExclusionNote[];
  /** Largeur minimale de lisibilité en px (EX-SCR-183). */
  readonly minWidthPx?: number;
  /** Le graphe (SVG/Canvas). */
  readonly children: ComponentChildren;
  /** La table de données équivalente (dépliée par « Voir les données »). */
  readonly dataTable: ComponentChildren;
}

export function GraphFrame(props: GraphFrameProps) {
  const [showData, setShowData] = useState(false);
  const tableId = `${props.graphId}-data`;
  return (
    <figure class="kycar-graph" data-graph={props.graphId} role="group" aria-label={props.ariaLabel}>
      <figcaption class="kycar-graph-head">
        <h3 class="kycar-graph-title">
          {props.title}
          {props.count !== undefined ? <span class="kycar-graph-count"> ({props.count})</span> : null}
        </h3>
        <button
          type="button"
          class="kycar-graph-datatoggle"
          aria-expanded={showData}
          aria-controls={tableId}
          onClick={() => setShowData((v) => !v)}
        >
          {showData ? 'Masquer les données' : 'Voir les données'}
        </button>
      </figcaption>

      <div class="kycar-graph-body" style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: `${props.minWidthPx ?? 280}px` }}>{props.children}</div>
      </div>

      {props.exclusions && props.exclusions.length > 0 ? (
        <ul class="kycar-graph-exclusions">
          {props.exclusions
            .filter((e) => e.count >= 1)
            .map((e) => (
              <li key={e.reason}>
                {e.count} annonces exclues ({e.reason})
              </li>
            ))}
        </ul>
      ) : null}

      <div id={tableId} class="kycar-graph-datatable" hidden={!showData}>
        {props.dataTable}
      </div>
    </figure>
  );
}
