/**
 * KYCAR — Histogramme SVG G1–G3 (lot D7, EX-SCR-145..150/19/16, EX-NFR-15)
 * =================================================================================================
 * Rendu SVG accessible : ≤ 26 barres, axe des effectifs partant de 0 (EX-SCR-19), une seule couleur
 * (accent 70 %, EX-SCR-148), barres d'effectif ≥ 1 jamais sous 1 px, bins de débordement en trame
 * diagonale (EX-SCR-145). Bascule log conditionnelle (EX-SCR-16). Table de données équivalente via
 * `GraphFrame` (EX-NFR-15).
 */

import { buildHistogram, histogramTable, type HistogramModel } from './histogram-model';
import { GraphFrame, type ExclusionNote } from './GraphFrame';
import { formatMetric } from './format';
import type { DistributionBucket } from '../../types/index';

const VIEW_W = 520;
const VIEW_H = 240;
const PAD_L = 40;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 32;

export interface HistogramProps {
  readonly graphId: string;
  readonly title: string;
  readonly metric: 'price' | 'year' | 'mileage';
  readonly buckets: readonly DistributionBucket[];
  readonly log: boolean;
  readonly onToggleLog: () => void;
  readonly headerCount?: number;
  readonly exclusions?: readonly ExclusionNote[];
  /** Clic sur une barre → pose l'intervalle correspondant (EX-SCR-149). Point d'intégration D8. */
  readonly onSelectBucket?: (bucket: DistributionBucket) => void;
}

export function Histogram(props: HistogramProps) {
  const model: HistogramModel = buildHistogram(props.metric, props.buckets, { log: props.log });
  const plotW = VIEW_W - PAD_L - PAD_R;
  const plotH = VIEW_H - PAD_T - PAD_B;
  const gap = 2; // EX-SCR-148

  const table = histogramTable(model, formatMetric);
  const ariaLabel = `Histogramme ${props.title}, ${model.bars.length} classes, ${model.totalCount} offres`;

  return (
    <GraphFrame
      graphId={props.graphId}
      title={props.title}
      ariaLabel={ariaLabel}
      count={props.headerCount !== undefined && props.headerCount !== model.totalCount ? model.totalCount : undefined}
      exclusions={props.exclusions}
      dataTable={
        <table>
          <caption>Données de {props.title}</caption>
          <thead>
            <tr>
              <th scope="col">Classe</th>
              <th scope="col">Effectif</th>
              <th scope="col">Part</th>
            </tr>
          </thead>
          <tbody>
            {table.map((r, i) => (
              <tr key={i}>
                <td>{r.rangeLabel}</td>
                <td>{r.count}</td>
                <td>{r.sharePct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      {/* EX-SCR-150 : n_m = 1, mention sous le titre (la bascule log reste absente du DOM, seule
          `logAvailable` la commande). */}
      {model.totalCount === 1 ? <p class="kycar-hist-note">1 offre — aucune distribution</p> : null}

      {model.bars.length === 0 ? (
        // EX-SCR-150 (DR-073) : n_m = 0, cadre de MÊME dimension que le SVG normal, jamais vide.
        <div
          class="kycar-hist-empty"
          style={{ width: `${VIEW_W}px`, height: `${VIEW_H}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          role="img"
          aria-label={ariaLabel}
        >
          Aucune offre
        </div>
      ) : (
        <>
          {model.logAvailable ? (
            <label class="kycar-log-toggle">
              <input type="checkbox" checked={model.logApplied} onChange={props.onToggleLog} /> Échelle log
            </label>
          ) : null}

          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} class="kycar-hist" role="img" aria-label={ariaLabel}>
            <defs>
              <pattern id={`${props.graphId}-hatch`} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <rect width="4" height="4" fill="var(--color-surface)" />
                <line x1="0" y1="0" x2="0" y2="4" stroke="var(--color-border)" stroke-width="1" />
              </pattern>
            </defs>
            {/* Axe des effectifs (départ à 0, EX-SCR-19) */}
            <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + plotH} stroke="var(--color-border)" stroke-width="1" />
            <line x1={PAD_L} y1={PAD_T + plotH} x2={PAD_L + plotW} y2={PAD_T + plotH} stroke="var(--color-border)" stroke-width="1" />
            <text x={PAD_L - 4} y={PAD_T + 8} text-anchor="end" font-size="9" fill="var(--color-text-muted)">
              {model.maxCount}
            </text>
            <text x={PAD_L - 4} y={PAD_T + plotH} text-anchor="end" font-size="9" fill="var(--color-text-muted)">
              0
            </text>

            {model.bars.map((b, i) => {
              const x = PAD_L + b.xFrac * plotW + gap / 2;
              const w = Math.max(1, b.widthFrac * plotW - gap);
              // Barre d'effectif >= 1 jamais sous 1 px (EX-SCR-148).
              const h = b.count > 0 ? Math.max(1, b.heightFrac * plotH) : 0;
              const y = PAD_T + plotH - h;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={b.open ? `url(#${props.graphId}-hatch)` : 'var(--color-primary)'}
                  fill-opacity={b.open ? 1 : 0.7}
                  stroke={b.open ? 'var(--color-border)' : 'none'}
                  stroke-dasharray={b.open ? '2 1' : undefined}
                  tabIndex={0}
                  role="button"
                  aria-label={`${formatMetric(b.lowerBound, props.metric)} à ${formatMetric(b.upperBound, props.metric)}: ${b.count} offres`}
                  onClick={() => props.onSelectBucket?.(props.buckets.find((bk) => bk.index === b.index) as DistributionBucket)}
                >
                  <title>{`${formatMetric(b.lowerBound, props.metric)} – ${formatMetric(b.upperBound, props.metric)} · ${b.count} offres · ${(b.share * 100).toFixed(1)} %`}</title>
                </rect>
              );
            })}

            {/* EX-SCR-145 (DR-074) : étiquettes de borne d'axe X — une sur deux si < 48 px par
                étiquette, pour rester lisible sans survol ni ouverture de la table. */}
            {model.bars.map((b, i) => {
              const barWidthPx = b.widthFrac * plotW;
              if (barWidthPx < 48 && i % 2 !== 0) return null;
              const x = PAD_L + b.xFrac * plotW + (b.widthFrac * plotW) / 2;
              return (
                <text key={`xl-${i}`} x={x} y={PAD_T + plotH + 14} text-anchor="middle" font-size="9" fill="var(--color-text-muted)">
                  {formatMetric(b.lowerBound, props.metric)}
                </text>
              );
            })}
          </svg>
        </>
      )}
    </GraphFrame>
  );
}
