/**
 * KYCAR — Graphes additionnels G5–G15 (lot D7, EX-SCR-161..170/191)
 * =================================================================================================
 * Rendus SVG compacts au-dessus des modèles purs de `graphs-model.ts`, chacun dans un `GraphFrame`
 * accessible avec sa table de données équivalente. Titres exacts d'EX-SCR-191.
 *
 * DETTE SIGNALÉE : ces rendus sont livrés au niveau « lisible + accessible + table équivalente ». Les
 * interactions fines par graphe (clic→pose de filtre EX-SCR-149/161/165…, infobulles à 6 lignes,
 * seconds axes de G5, base 100 de G6 en double série) sont des raffinements d'intégration D8 : le
 * modèle expose déjà toutes les valeurs nécessaires.
 */

import { GraphFrame } from './GraphFrame';
import { formatPrice, formatKm, formatYear, formatSignedPct, formatPower } from './format';
import { comparisonBaseLabel, methodLabel } from '../outlier-index';
import type {
  YearMedianPoint,
  DepreciationModel,
  PriceMileageDensity,
  OutlierLollipop,
  CategoryBar,
  PowerTierBar,
  MileageBoxTile,
  Unavailable,
} from './graphs-model';

/** Résolveur de libellé d'une valeur énumérée. */
export type LabelResolver = (code: number) => string;

/** `D8-07` — un graphe dont la source (`RecalcResult`) n'est pas encore remplie par le worker
 * affiche cet état, jamais un recalcul de repli ni un graphe vide silencieux. */
function UnavailableGraph({ graphId, title, reason }: { graphId: string; title: string; reason: string }) {
  return (
    <GraphFrame graphId={graphId} title={title} ariaLabel={`${title}, données indisponibles`} dataTable={<p>{reason}</p>}>
      <p class="kycar-graph-empty">{reason}</p>
    </GraphFrame>
  );
}

const STATS_UNAVAILABLE_REASON = 'Données indisponibles — statistiques non encore calculées pour cette sélection';

/* ---- G5 — Prix médian par année --------------------------------------------------------------- */
export function YearMedianChart({ points }: { points: readonly YearMedianPoint[] | Unavailable }) {
  if (points === 'unavailable') return <UnavailableGraph graphId="G5" title="Prix médian par année" reason={STATS_UNAVAILABLE_REASON} />;
  const W = 520;
  const H = 220;
  const padL = 48;
  const padB = 28;
  const medians = points.map((p) => p.stat.median ?? 0);
  const maxP = Math.max(1, ...medians);
  const years = points.map((p) => p.year);
  const yMin = Math.min(...years);
  const yMax = Math.max(...years);
  const xOf = (y: number): number => padL + ((y - yMin) / Math.max(1, yMax - yMin)) * (W - padL - 8);
  const yOf = (p: number): number => H - padB - (p / maxP) * (H - padB - 8);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.year).toFixed(1)},${yOf(p.stat.median ?? 0).toFixed(1)}`).join(' ');
  return (
    <GraphFrame
      graphId="G5"
      title="Prix médian par année"
      ariaLabel={`Prix médian par année, ${points.length} années`}
      dataTable={<StatTable rows={points.map((p) => ({ label: formatYear(p.year), n: p.stat.n, median: p.stat.median }))} />}
    >
      <svg viewBox={`0 0 ${W} ${H}`} class="kycar-line" role="img" aria-label="Courbe du prix médian par année">
        <line x1={padL} y1={8} x2={padL} y2={H - padB} stroke="var(--color-border)" />
        <line x1={padL} y1={H - padB} x2={W - 8} y2={H - padB} stroke="var(--color-border)" />
        <path d={path} fill="none" stroke="var(--color-primary)" stroke-width="2" />
        {points.map((p) => (
          <circle key={p.year} cx={xOf(p.year)} cy={yOf(p.stat.median ?? 0)} r={p.stat.n <= 4 ? 3 : 4} fill={p.stat.n <= 4 ? 'var(--color-bg)' : 'var(--color-primary)'} stroke="var(--color-primary)">
            <title>{`${p.year} · n=${p.stat.n} · médiane ${p.stat.median != null ? formatPrice(p.stat.median) : '—'}`}</title>
          </circle>
        ))}
      </svg>
    </GraphFrame>
  );
}

/* ---- G6 — Dépréciation base 100 --------------------------------------------------------------- */
export function DepreciationChart({ model }: { model: DepreciationModel | Unavailable }) {
  if (model === 'unavailable') return <UnavailableGraph graphId="G6" title="Dépréciation (base 100)" reason={STATS_UNAVAILABLE_REASON} />;
  return (
    <GraphFrame
      graphId="G6"
      title="Dépréciation (base 100)"
      ariaLabel="Dépréciation base 100 par âge"
      dataTable={
        model.available ? (
          <table>
            <caption>{`base 100 = ${model.baseYear}`}</caption>
            <thead>
              <tr>
                <th scope="col">Âge</th>
                <th scope="col">Indice</th>
                <th scope="col">Perte annuelle</th>
              </tr>
            </thead>
            <tbody>
              {model.points.map((p) => (
                <tr key={p.ageYears}>
                  <td>{p.ageYears} an(s)</td>
                  <td>{p.index.toFixed(0)}</td>
                  <td>{p.annualLossPct != null ? `${p.annualLossPct.toFixed(1).replace('.', ',')} %` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Dépréciation non calculable — il faut au moins 3 années comptant chacune 5 offres</p>
        )
      }
    >
      {model.available ? (
        <p class="kycar-graph-inline">{`base 100 = ${model.baseYear} · ${model.points.length} points`}</p>
      ) : (
        <p class="kycar-graph-empty">Dépréciation non calculable — il faut au moins 3 années comptant chacune 5 offres</p>
      )}
    </GraphFrame>
  );
}

/* ---- G7 — Densité prix × km ------------------------------------------------------------------- */
export function DensityHeatmap({ density }: { density: PriceMileageDensity }) {
  const cellSize = 14;
  const cols = new Set(density.cells.map((c) => c.mileageBinIndex));
  const rows = new Set(density.cells.map((c) => c.priceBinIndex));
  const colList = [...cols].sort((a, b) => a - b);
  const rowList = [...rows].sort((a, b) => b - a); // prix décroissant vers le haut
  const colIndex = new Map(colList.map((c, i) => [c, i]));
  const rowIndex = new Map(rowList.map((r, i) => [r, i]));
  return (
    <GraphFrame
      graphId="G7"
      title="Densité prix × km"
      ariaLabel={`Densité prix par kilométrage, ${density.cells.length} cellules`}
      minWidthPx={320}
      dataTable={
        density.available ? (
          <table>
            <caption>Effectif par cellule prix × km</caption>
            <thead>
              <tr>
                <th scope="col">Bin prix</th>
                <th scope="col">Bin km</th>
                <th scope="col">Effectif</th>
              </tr>
            </thead>
            <tbody>
              {density.cells.map((c, i) => (
                <tr key={i}>
                  <td>{c.priceBinIndex}</td>
                  <td>{c.mileageBinIndex}</td>
                  <td>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Densité non calculable en dessous de 40 offres — voir la nuée ci-dessus</p>
        )
      }
    >
      {density.available ? (
        <svg viewBox={`0 0 ${Math.max(1, colList.length) * cellSize} ${Math.max(1, rowList.length) * cellSize}`} class="kycar-heatmap" role="img" aria-label="Carte de densité prix par kilométrage">
          {density.cells.map((c, i) => {
            const t = c.count / Math.max(1, density.maxCount);
            return (
              <rect
                key={i}
                x={(colIndex.get(c.mileageBinIndex) ?? 0) * cellSize}
                y={(rowIndex.get(c.priceBinIndex) ?? 0) * cellSize}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={`rgba(11,95,214,${(0.15 + 0.85 * t).toFixed(3)})`}
              >
                <title>{`prix bin ${c.priceBinIndex} · km bin ${c.mileageBinIndex} · ${c.count} offres`}</title>
              </rect>
            );
          })}
        </svg>
      ) : (
        <p class="kycar-graph-empty">Densité non calculable en dessous de 40 offres — voir la nuée ci-dessus</p>
      )}
    </GraphFrame>
  );
}

/* ---- G8 — Écart au prix attendu (20 premiers outliers) ---------------------------------------- */
export function OutlierLollipopChart({
  items,
  perimeter,
  onOpen,
  /** `D8-07`/`EX-DATA-93bis` — libellé normatif du modèle M2 (`graphs-model.ts::g8ModelCaption`),
   * `undefined` tant que `RecalcResult.cellStats` n'a pas encore été calculé (jamais une formule
   * inventée, A-09). */
  modelCaption,
  /** `EX-SCR-164` — avertissement ambre quand `R² < 0,30` (`graphs-model.ts::g8RSquaredWarning`). */
  rSquaredWarning,
}: {
  items: readonly OutlierLollipop[];
  perimeter?: { makeModel?: string; year?: number };
  onOpen?: (row: number) => void;
  modelCaption?: string;
  rSquaredWarning?: boolean;
}) {
  const maxAbs = Math.max(1, ...items.map((i) => Math.abs(i.deviationPct)));
  return (
    <GraphFrame
      graphId="G8"
      title="Écart au prix attendu"
      ariaLabel={`Écart au prix attendu, ${items.length} annonces`}
      minWidthPx={360}
      dataTable={
        <table>
          <caption>Écarts au prix attendu (base de comparaison en légende)</caption>
          <thead>
            <tr>
              <th scope="col">Prix</th>
              <th scope="col">Écart</th>
              <th scope="col">Prix attendu</th>
              <th scope="col">Base</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.listingId}>
                <td>{formatPrice(it.priceEur)}</td>
                <td>{formatSignedPct(it.deviationPct)}</td>
                <td>{it.expectedPriceEur != null ? formatPrice(it.expectedPriceEur) : '—'}</td>
                <td>{comparisonBaseLabel(it, perimeter)} · {methodLabel(it.method)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      {/* `EX-SCR-164` (D8-07) — libellé normatif du modèle M2, MOT POUR MOT ; aucune formule inventée
          (`A-09`) quand `modelCaption` est absent (cellule `SELECTION` pas encore publiée). */}
      {modelCaption !== undefined ? <p class="kycar-graph-caption">{modelCaption}</p> : null}
      {rSquaredWarning === true ? (
        <p class="kycar-graph-warning" role="status">
          Le modèle explique moins de 30&nbsp;% de la variance — les écarts sont peu fiables
        </p>
      ) : null}
      <ul class="kycar-lollipops">
        {items.map((it) => {
          const frac = (it.deviationPct / maxAbs) * 50; // % de largeur, centré sur 0
          const cold = it.deviationPct < 0;
          return (
            <li key={it.listingId} class="kycar-lollipop">
              <button type="button" class="kycar-lollipop-open" onClick={() => onOpen?.(it.row)} title={`${comparisonBaseLabel(it, perimeter)} · ${methodLabel(it.method)}`}>
                <span class="kycar-lollipop-price">{formatPrice(it.priceEur)}</span>
                <span class="kycar-lollipop-bar" aria-hidden="true">
                  <span
                    style={{
                      position: 'relative',
                      left: cold ? `${50 + frac}%` : '50%',
                      width: `${Math.abs(frac)}%`,
                      height: '6px',
                      display: 'inline-block',
                      background: cold ? 'var(--color-primary)' : 'var(--color-danger)',
                    }}
                  />
                </span>
                <span class="kycar-lollipop-dev">{formatSignedPct(it.deviationPct)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </GraphFrame>
  );
}

/* ---- G9/G12/G13/G15 — barres catégorielles ---------------------------------------------------- */
export function CategoricalBars({
  graphId,
  title,
  bars,
  label,
  note,
}: {
  graphId: string;
  title: string;
  bars: readonly CategoryBar[] | Unavailable;
  label: LabelResolver;
  note?: string;
}) {
  if (bars === 'unavailable') return <UnavailableGraph graphId={graphId} title={title} reason={STATS_UNAVAILABLE_REASON} />;
  const maxCount = Math.max(1, ...bars.map((b) => b.count));
  return (
    <GraphFrame
      graphId={graphId}
      title={title}
      ariaLabel={`${title}, ${bars.length} classes`}
      dataTable={
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Classe</th>
              <th scope="col">Effectif</th>
              <th scope="col">Part</th>
              <th scope="col">Prix médian</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((b) => (
              <tr key={b.key}>
                <td>{label(b.key)}</td>
                <td>{b.count}</td>
                <td>{b.sharePct.toFixed(1)} %</td>
                <td>{b.medianPrice != null ? formatPrice(b.medianPrice) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ul class="kycar-catbars">
        {bars.map((b) => (
          <li key={b.key} class="kycar-catbar">
            <span class="kycar-catbar-label">{label(b.key)}</span>
            <span class="kycar-catbar-track" aria-hidden="true">
              <span style={{ width: `${(b.count / maxCount) * 100}%`, background: 'var(--color-primary)', display: 'inline-block', height: '12px' }} />
            </span>
            <span class="kycar-catbar-value">
              {b.count} · {b.sharePct.toFixed(0)} %{b.medianPrice != null ? ` · ${formatPrice(b.medianPrice)}` : ''}
            </span>
          </li>
        ))}
      </ul>
      {note ? <p class="kycar-graph-note">{note}</p> : null}
    </GraphFrame>
  );
}

/* ---- G10 — Prix par tranche de kilométrage ---------------------------------------------------- */
const fmtKm = (v: number | null): string => (v != null ? formatKm(v) : '—');

export function MileageBoxes({ boxes }: { boxes: { readonly tiles: readonly MileageBoxTile[]; readonly tileCount: number } | Unavailable }) {
  if (boxes === 'unavailable') return <UnavailableGraph graphId="G10" title="Prix par tranche de kilométrage" reason={STATS_UNAVAILABLE_REASON} />;
  const { tiles } = boxes;
  return (
    <GraphFrame
      graphId="G10"
      title="Prix par tranche de kilométrage"
      ariaLabel={`Prix par tranche de kilométrage, ${tiles.length} tranches`}
      dataTable={
        <table>
          <caption>Boîtes de prix par tranche de km</caption>
          <thead>
            <tr>
              <th scope="col">Tranche km</th>
              <th scope="col">n</th>
              <th scope="col">P5</th>
              <th scope="col">Médiane</th>
              <th scope="col">P95</th>
            </tr>
          </thead>
          <tbody>
            {tiles.map((t) => (
              <tr key={t.rank}>
                <td>{`${fmtKm(t.loObserved)} – ${fmtKm(t.hiObserved)} (${t.rank}/${tiles.length})`}</td>
                <td>{t.n}</td>
                <td>{t.p05 != null ? formatPrice(t.p05) : '—'}</td>
                <td>{t.median != null ? formatPrice(t.median) : '—'}</td>
                <td>{t.p95 != null ? formatPrice(t.p95) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ul class="kycar-boxes">
        {tiles.map((t) => (
          <li key={t.rank}>
            <span class="kycar-box-label">{`${fmtKm(t.loObserved)}–${fmtKm(t.hiObserved)}`}</span>
            <span class="kycar-box-stat">
              n={t.n} · méd. {t.median != null ? formatPrice(t.median) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </GraphFrame>
  );
}

/* ---- G14 — Prix médian par palier de puissance ------------------------------------------------ */
export function PowerTiers({ tiers }: { tiers: readonly PowerTierBar[] | Unavailable }) {
  if (tiers === 'unavailable') return <UnavailableGraph graphId="G14" title="Prix médian par puissance" reason={STATS_UNAVAILABLE_REASON} />;
  const maxMedian = Math.max(1, ...tiers.map((t) => t.stat.median ?? 0));
  const W = 520;
  const H = 200;
  const padB = 28;
  const barW = tiers.length > 0 ? (W - 8) / tiers.length : W;
  return (
    <GraphFrame
      graphId="G14"
      title="Prix médian par puissance"
      ariaLabel={`Prix médian par palier de puissance, ${tiers.length} paliers`}
      dataTable={
        <table>
          <caption>Prix médian par palier de 20 kW</caption>
          <thead>
            <tr>
              <th scope="col">Palier</th>
              <th scope="col">n</th>
              <th scope="col">Médiane</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr key={t.tierIndex}>
                <td>{`${t.loKw} – ${t.hiKw} kW`}</td>
                <td>{t.stat.n}</td>
                <td>{t.stat.median != null ? formatPrice(t.stat.median) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} class="kycar-bars" role="img" aria-label="Barres du prix médian par puissance">
        <line x1={4} y1={H - padB} x2={W - 4} y2={H - padB} stroke="var(--color-border)" />
        {tiers.map((t, i) => {
          const h = ((t.stat.median ?? 0) / maxMedian) * (H - padB - 8);
          return (
            <g key={t.tierIndex}>
              <rect x={4 + i * barW + 1} y={H - padB - h} width={Math.max(1, barW - 2)} height={h} fill="var(--color-primary)" fill-opacity={t.stat.n <= 4 ? 0.3 : 0.8} stroke={t.stat.n <= 4 ? 'var(--color-border)' : 'none'} stroke-dasharray={t.stat.n <= 4 ? '2 1' : undefined}>
                <title>{`${t.loKw}–${t.hiKw} kW · n=${t.stat.n} · méd. ${t.stat.median != null ? formatPrice(t.stat.median) : '—'}`}</title>
              </rect>
              <text x={4 + i * barW + barW / 2} y={H - padB + 10} text-anchor="middle" font-size="8" fill="var(--color-text-muted)">
                {formatPower(t.loKw)}
              </text>
            </g>
          );
        })}
      </svg>
    </GraphFrame>
  );
}

/** Table statistique générique (label / n / médiane) pour les tables équivalentes. */
function StatTable({ rows }: { rows: readonly { label: string; n: number; median: number | null }[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">Classe</th>
          <th scope="col">n</th>
          <th scope="col">Prix médian</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.label}</td>
            <td>{r.n}</td>
            <td>{r.median != null ? formatPrice(r.median) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
