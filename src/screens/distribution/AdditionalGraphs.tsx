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
function UnavailableGraph({
  graphId,
  title,
  reason,
  dataSelection,
}: {
  graphId: string;
  title: string;
  reason: string;
  /** `EX-SCR-176` (D8-06/FV-18) — la figure existe déjà dans le DOM même sans statistique calculée
   * et doit porter l'empreinte courante, pour qu'un hôte ne confonde pas « en attente du worker »
   * et « resté sur un ancien périmètre après changement de filtre ». */
  dataSelection?: string;
}) {
  return (
    <GraphFrame
      graphId={graphId}
      title={title}
      ariaLabel={`${title}, données indisponibles`}
      dataTable={<p>{reason}</p>}
      dataSelection={dataSelection}
    >
      <p class="kycar-graph-empty">{reason}</p>
    </GraphFrame>
  );
}

const STATS_UNAVAILABLE_REASON = 'Données indisponibles — statistiques non encore calculées pour cette sélection';

/* ---- G5 — Prix médian par année --------------------------------------------------------------- */
export function YearMedianChart({ points, dataSelection }: { points: readonly YearMedianPoint[] | Unavailable; dataSelection?: string }) {
  if (points === 'unavailable')
    return <UnavailableGraph graphId="G5" title="Prix médian par année" reason={STATS_UNAVAILABLE_REASON} dataSelection={dataSelection} />;
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
      dataSelection={dataSelection}
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
export function DepreciationChart({ model, dataSelection }: { model: DepreciationModel | Unavailable; dataSelection?: string }) {
  if (model === 'unavailable')
    return <UnavailableGraph graphId="G6" title="Dépréciation (base 100)" reason={STATS_UNAVAILABLE_REASON} dataSelection={dataSelection} />;
  return (
    <GraphFrame
      graphId="G6"
      title="Dépréciation (base 100)"
      ariaLabel="Dépréciation base 100 par âge"
      dataSelection={dataSelection}
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

/** `EX-SCR-17` — plancher du logarithme : un prix nul ou négatif n'existe pas dans `V_price`
 * (`EX-DATA-60`), mais la BORNE BASSE de la grille `BIN` peut valoir 0 (origine `O = 0`). Le
 * plancher évite `log10(0) = −∞` sans déplacer aucune valeur observable. */
const PRICE_LOG_FLOOR_EUR = 1;

/** Échelle de l'axe des prix de G7 : identité (linéaire) ou `log10` (`EX-SCR-17`). */
function priceScaleFn(log: boolean): (v: number) => number {
  return log ? (v: number) => Math.log10(Math.max(PRICE_LOG_FLOOR_EUR, v)) : (v: number) => v;
}

/**
 * G7 — densité prix × km. L'axe des PRIX est un axe quantitatif réel (bornes et hauteurs prises sur
 * la grille `BIN`, `density.priceBins`), ce qui est la condition pour qu'une bascule d'échelle ait
 * un sens : `EX-SCR-17` offre une bascule logarithmique sur l'axe des prix du SEUL graphe `G7`
 * (« où l'étalement du haut de gamme écrase la masse »). L'axe des kilométrages, lui, reste une
 * grille régulière de bins (aucune échelle log ailleurs, `EX-SCR-17`/`EX-SCR-153`).
 *
 * État de la bascule : le mécanisme EXISTANT `ui.logHistograms` / `g<n>log` (`EX-SCR-16`,
 * `EX-NAV-10bis`) avec l'indice **7** — l'écran B passe `log`/`onToggleLog` ; `g7log` est déjà
 * encodable et décodable par le codec de D5 (`GRAPH_LOG_RE`), aucune déclaration nouvelle.
 */
export function DensityHeatmap({
  density,
  dataSelection,
  log,
  onToggleLog,
  compact,
}: {
  density: PriceMileageDensity;
  dataSelection?: string;
  /** `EX-SCR-17` — axe des PRIX en échelle logarithmique (`ui.logHistograms.has(7)`). */
  log?: boolean;
  /** Bascule l'échelle de l'axe des prix (`toggleLogHistogram(ui, 7)`). Absent : bouton inerte. */
  onToggleLog?: () => void;
  /** `EX-SCR-181` (ACC-03) — régime COMPACT : `G7` n'est PAS tracé (la grille d'`EX-DATA-102bis` sur
   * moins de 320 px de large ne porte plus d'information) et affiche le message normatif à sa place.
   * Le cadre, son titre et sa table de données équivalente (`EX-NFR-15`) restent, eux, en place. */
  compact?: boolean;
}) {
  const cellSize = 14;
  const isLog = log === true;
  const cols = new Set(density.cells.map((c) => c.mileageBinIndex));
  const colList = [...cols].sort((a, b) => a - b);
  const colIndex = new Map(colList.map((c, i) => [c, i]));
  const width = Math.max(1, colList.length) * cellSize;

  // Axe des prix : bornes = premier/dernier bin FERMÉ de la grille `BIN` (EX-SCR-18). Les cellules
  // des bins de débordement sont ÉCRÊTÉES sur la bordure (jamais supprimées, EX-SCR-18).
  const bins = density.priceBins;
  const lo = bins.length > 0 ? (bins[0] as { lowerBound: number }).lowerBound : 0;
  const hi = bins.length > 0 ? (bins[bins.length - 1] as { upperBound: number }).upperBound : 1;
  const height = Math.max(1, bins.length) * cellSize;
  const scale = priceScaleFn(isLog);
  const sLo = scale(lo);
  const span = scale(hi) - sLo || 1;
  /** Pixel (haut = prix élevé) d'un prix, écrêté à la zone de tracé. */
  const yOf = (price: number): number => {
    const t = (scale(Math.max(lo, Math.min(hi, price))) - sLo) / span;
    return height - t * height;
  };
  const boundsOf = (index: number): { lower: number; upper: number } => {
    const b = bins.find((x) => x.index === index);
    if (b !== undefined) return { lower: b.lowerBound, upper: b.upperBound };
    // Bin de débordement : porté sur la bordure basse ou haute (EX-SCR-18).
    return index < (bins[0]?.index ?? 0) ? { lower: lo, upper: lo } : { lower: hi, upper: hi };
  };

  // Graduations de l'axe des prix : les bornes des bins fermés, éclaircies à ~6 étiquettes.
  const tickStep = Math.max(1, Math.ceil(bins.length / 6));
  const ticks = bins
    .filter((_b, i) => i % tickStep === 0)
    .map((b) => b.lowerBound)
    .concat(bins.length > 0 ? [hi] : []);

  return (
    <GraphFrame
      graphId="G7"
      title="Densité prix × km"
      ariaLabel={`Densité prix par kilométrage, ${density.cells.length} cellules`}
      dataSelection={dataSelection}
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
      {/* `EX-SCR-181` (ACC-03) — régime compact : le message normatif tient lieu de tracé. */}
      {compact === true ? (
        <p class="kycar-graph-note kycar-graph-note--large-only">Densité disponible sur écran large</p>
      ) : density.available ? (
        <>
          {/* `EX-SCR-17` — bascule de l'axe des PRIX de G7, et de lui seul. Bouton bascule nommé
              (l'axe est dit dans le libellé), état porté par `aria-pressed` : un lecteur d'écran
              annonce « activé »/« désactivé », ce qu'une case à cocher sans nom d'axe ne dirait pas. */}
          <button
            type="button"
            class="kycar-log-toggle"
            aria-pressed={isLog}
            onClick={onToggleLog}
            title="L’axe des prix seul change d’échelle ; l’axe des kilométrages reste linéaire"
          >
            Échelle log de l’axe des prix
          </button>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            class="kycar-heatmap"
            role="img"
            aria-label={`Carte de densité prix par kilométrage, axe des prix en échelle ${isLog ? 'logarithmique' : 'linéaire'}`}
            data-price-scale={isLog ? 'log' : 'linear'}
          >
            {density.cells.map((c, i) => {
              const t = c.count / Math.max(1, density.maxCount);
              const b = boundsOf(c.priceBinIndex);
              const yTop = yOf(b.upper);
              const cellHeight = Math.max(1, yOf(b.lower) - yTop);
              return (
                <rect
                  key={i}
                  x={(colIndex.get(c.mileageBinIndex) ?? 0) * cellSize}
                  y={yTop}
                  width={cellSize - 1}
                  height={cellHeight}
                  data-price-lower={b.lower}
                  data-price-upper={b.upper}
                  fill={`rgba(11,95,214,${(0.15 + 0.85 * t).toFixed(3)})`}
                >
                  <title>{`prix bin ${c.priceBinIndex} · km bin ${c.mileageBinIndex} · ${c.count} offres`}</title>
                </rect>
              );
            })}
          </svg>
          {/* Graduations de l'axe des prix, en TEXTE (l'échelle log doit se lire, sinon la bascule
              ne se voit qu'à la déformation des cellules). */}
          <ul class="kycar-heatmap-priceaxis" aria-hidden="true">
            {ticks.map((v) => (
              <li key={v} data-tick={v}>
                {formatPrice(v)}
              </li>
            ))}
          </ul>
        </>
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
  dataSelection,
  compact,
}: {
  items: readonly OutlierLollipop[];
  perimeter?: { makeModel?: string; year?: number };
  onOpen?: (row: number) => void;
  modelCaption?: string;
  rSquaredWarning?: boolean;
  dataSelection?: string;
  /** `EX-SCR-181` (ACC-03) — régime COMPACT : la liste est réduite de 20 à 10 sucettes, les autres
   * étant repliées derrière un bouton `Afficher 10 de plus`. Le repli est un `<details>` natif :
   * aucun état de composant (ce module est appelé comme une fonction pure par les sondes D7). */
  compact?: boolean;
}) {
  const maxAbs = Math.max(1, ...items.map((i) => Math.abs(i.deviationPct)));
  const COMPACT_VISIBLE = 10;
  const shown = compact === true ? items.slice(0, COMPACT_VISIBLE) : items;
  const rest = compact === true ? items.slice(COMPACT_VISIBLE) : [];
  return (
    <GraphFrame
      graphId="G8"
      title="Écart au prix attendu"
      dataSelection={dataSelection}
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
        {shown.map((it) => {
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
      {/* `EX-SCR-181` (ACC-03) — le reste de la liste, replié, jamais retiré. */}
      {rest.length > 0 ? (
        <details class="kycar-lollipops-more">
          <summary>Afficher {rest.length} de plus</summary>
          <ul class="kycar-lollipops">
            {rest.map((it) => {
              const frac = (it.deviationPct / maxAbs) * 50;
              const cold = it.deviationPct < 0;
              return (
                <li key={it.listingId} class="kycar-lollipop">
                  <button
                    type="button"
                    class="kycar-lollipop-open"
                    onClick={() => onOpen?.(it.row)}
                    title={`${comparisonBaseLabel(it, perimeter)} · ${methodLabel(it.method)}`}
                  >
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
        </details>
      ) : null}
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
  dataSelection,
}: {
  graphId: string;
  title: string;
  bars: readonly CategoryBar[] | Unavailable;
  label: LabelResolver;
  note?: string;
  dataSelection?: string;
}) {
  if (bars === 'unavailable')
    return <UnavailableGraph graphId={graphId} title={title} reason={STATS_UNAVAILABLE_REASON} dataSelection={dataSelection} />;
  const maxCount = Math.max(1, ...bars.map((b) => b.count));
  return (
    <GraphFrame
      graphId={graphId}
      title={title}
      ariaLabel={`${title}, ${bars.length} classes`}
      dataSelection={dataSelection}
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

export function MileageBoxes({
  boxes,
  dataSelection,
}: {
  boxes: { readonly tiles: readonly MileageBoxTile[]; readonly tileCount: number } | Unavailable;
  dataSelection?: string;
}) {
  if (boxes === 'unavailable')
    return <UnavailableGraph graphId="G10" title="Prix par tranche de kilométrage" reason={STATS_UNAVAILABLE_REASON} dataSelection={dataSelection} />;
  const { tiles } = boxes;
  return (
    <GraphFrame
      graphId="G10"
      title="Prix par tranche de kilométrage"
      ariaLabel={`Prix par tranche de kilométrage, ${tiles.length} tranches`}
      dataSelection={dataSelection}
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
export function PowerTiers({ tiers, dataSelection }: { tiers: readonly PowerTierBar[] | Unavailable; dataSelection?: string }) {
  if (tiers === 'unavailable')
    return <UnavailableGraph graphId="G14" title="Prix médian par puissance" reason={STATS_UNAVAILABLE_REASON} dataSelection={dataSelection} />;
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
      dataSelection={dataSelection}
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
