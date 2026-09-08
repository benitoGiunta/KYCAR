/**
 * KYCAR — Écran C, comparaison de modèles (lot D8, EX-CRUD-13bis / EX-NAV-2ter, draft-screens §C)
 * =================================================================================================
 * Comparaison côte à côte de 0 à 4 modèles (plafond `CompareSelection`, ARB-43). La sélection est une
 * entité de SESSION (jamais persistée) portée par la coquille ; cet écran est une fonction pure de
 * ses lignes déjà résolues (agrégats mode 1 par modèle) — il ne possède ni provider ni moteur, même
 * convention que les écrans A/B. Aucune donnée d'annonce individuelle, aucun champ vendeur (R3).
 */
import type { JSX } from 'preact';

import type { MetricRange } from '../../providers/DataProvider';

export interface CompareModelRow {
  readonly makeId: number;
  readonly modelId: number;
  readonly name: string;
  readonly listingCount: number;
  readonly price: MetricRange;
  readonly year: MetricRange;
  readonly mileage: MetricRange;
}

export interface CompareScreenProps {
  readonly rows: readonly CompareModelRow[];
  /** Plafond atteint (4) — l'ajout est désactivé ailleurs ; ici on l'indique seulement. */
  readonly atCapacity: boolean;
  readonly onRemove: (makeId: number, modelId: number) => void;
  readonly onOpen: (makeId: number, modelId: number) => void;
  readonly onClearAll: () => void;
}

function fmtRange(r: MetricRange, unit: string): string {
  if (r.p05 === null || r.p95 === null) return '—';
  const f = (n: number): string => new Intl.NumberFormat('fr-BE').format(Math.round(n));
  return `${f(r.p05)} – ${f(r.p95)} ${unit}`.trim();
}

const METRIC_ROWS: ReadonlyArray<{ readonly label: string; readonly render: (r: CompareModelRow) => string }> = [
  { label: 'Nombre d’offres', render: (r) => new Intl.NumberFormat('fr-BE').format(r.listingCount) },
  { label: 'Prix (P05–P95)', render: (r) => fmtRange(r.price, '€') },
  { label: 'Année (P05–P95)', render: (r) => fmtRange(r.year, '') },
  { label: 'Kilométrage (P05–P95)', render: (r) => fmtRange(r.mileage, 'km') },
];

export function CompareScreen(props: CompareScreenProps): JSX.Element {
  if (props.rows.length === 0) {
    return (
      <section class="kycar-compare" aria-labelledby="kycar-compare-title">
        <h1 id="kycar-compare-title">Comparer des modèles</h1>
        <p>
          Aucun modèle sélectionné. Depuis l’écran du marché ou l’écran d’un modèle, cochez la case
          « Comparer » d’un modèle pour l’ajouter ici (jusqu’à 4 modèles).
        </p>
      </section>
    );
  }

  return (
    <section class="kycar-compare" aria-labelledby="kycar-compare-title">
      <div class="kycar-compare-head">
        <h1 id="kycar-compare-title">Comparer des modèles</h1>
        <button type="button" class="no-print" onClick={props.onClearAll}>
          Tout retirer
        </button>
      </div>
      {props.atCapacity ? (
        <p role="note">4 modèles au maximum — retirez-en un pour en ajouter un autre.</p>
      ) : null}
      <div class="kycar-compare-scroll">
        <table class="kycar-compare-table">
          <caption class="kycar-visually-hidden">
            Comparaison des agrégats de {props.rows.length} modèles
          </caption>
          <thead>
            <tr>
              <th scope="col">Critère</th>
              {props.rows.map((r) => (
                <th scope="col" key={`${r.makeId}:${r.modelId}`}>
                  <span class="kycar-compare-model-name">{r.name}</span>
                  <span class="kycar-compare-model-actions no-print">
                    <button type="button" onClick={() => props.onOpen(r.makeId, r.modelId)}>
                      Ouvrir
                    </button>
                    <button
                      type="button"
                      onClick={() => props.onRemove(r.makeId, r.modelId)}
                      aria-label={`Retirer ${r.name} de la comparaison`}
                    >
                      Retirer
                    </button>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_ROWS.map((mr) => (
              <tr key={mr.label}>
                <th scope="row">{mr.label}</th>
                {props.rows.map((r) => (
                  <td key={`${r.makeId}:${r.modelId}`}>{mr.render(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
