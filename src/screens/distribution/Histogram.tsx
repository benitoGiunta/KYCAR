/**
 * KYCAR — Histogramme SVG G1–G3 (lot D7, EX-SCR-145..150/19/16, EX-NFR-15)
 * =================================================================================================
 * Rendu SVG accessible : ≤ 26 barres, axe des effectifs partant de 0 (EX-SCR-19), une seule couleur
 * (accent 70 %, EX-SCR-148), barres d'effectif ≥ 1 jamais sous 1 px, bins de débordement en trame
 * diagonale (EX-SCR-145). Bascule log conditionnelle (EX-SCR-16). Table de données équivalente via
 * `GraphFrame` (EX-NFR-15).
 */

import { buildHistogram, histogramTable, envelopeBounds, type HistogramModel } from './histogram-model';
import { GraphFrame, type ExclusionNote } from './GraphFrame';
import { formatMetric } from './format';
import type { DistributionBucket } from '../../types/index';

const VIEW_W = 520;
const VIEW_H = 240;
/**
 * `EX-SCR-181` (ACC-03) — hauteur de boîte de vue du régime COMPACT. Le SVG est servi en
 * `width: 100%` : sa hauteur rendue vaut `largeur × VIEW_H / VIEW_W`. À 360 px de viewport la zone
 * de tracé mesure ~300 px, d'où 138 px de haut avec la boîte de vue large — l'exigence en demande
 * 200. Une boîte de 520 × 347 (rapport 1,499) rendue dans une boîte de 300 × 200 (rapport 1,5) la
 * remplit exactement : la hauteur est celle de l'exigence ET le tracé n'est ni déformé ni cerné de
 * blanc (`distribution.css` fixe la hauteur à 200 px, ceci lui donne le bon rapport).
 */
const VIEW_H_COMPACT = 347;
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
  /** Clic sur une barre, brossage horizontal ou `Ctrl` + clic (EX-SCR-149) → pose l'intervalle
   * correspondant. Type volontairement affaibli à `Pick<…, 'lowerBound' | 'upperBound'>` (au lieu du
   * `DistributionBucket` complet) : le brossage et le `Ctrl` + clic ne produisent qu'une ENVELOPPE
   * (`envelopeBounds`), pas un bucket réel du moteur — même chemin d'intégration D8 que le clic
   * simple, compatible avec le câblage existant de l'hôte (`bucketToIntervalFilters` ne lit que ces
   * deux champs). Aucune nouvelle prop : c'est la même que celle du lot précédent, élargie.
   */
  readonly onSelectBucket?: (bucket: Pick<DistributionBucket, 'lowerBound' | 'upperBound'>) => void;
  /** `EX-SCR-149` (double-clic, D8-24) — retire le filtre posé par ce graphe. Optionnelle : absente
   * tant que l'hôte (`DistributionScreen`/`app.tsx`, hors périmètre de ce lot) ne la câble pas, sans
   * aucun effet par défaut — même convention que les props D8-06 laissées à fix-app (rapport
   * `fix-screens.md` §3). */
  readonly onClearFilter?: (metric: 'price' | 'year' | 'mileage') => void;
  /** `EX-SCR-184` (DR-080) — part sélectionnée (brossage G4) par indice de bucket, pour la
   * surimpression de liaison croisée. `undefined`/absent = aucun brossage actif. */
  readonly selectedCounts?: ReadonlyMap<number, number>;
  /** `EX-SCR-176` (D8-06/FV-18) — empreinte du jeu de filtres, transmise telle quelle à `GraphFrame`. */
  readonly dataSelection?: string;
  /** `EX-SCR-181` (ACC-03) — régime COMPACT (< 768 px) : boîte de vue plus haute (200 px rendus) et
   * une étiquette d'axe sur trois. Absent : régime `large`/`intermédiaire`, rendu inchangé. */
  readonly compact?: boolean;
}

/**
 * `EX-SCR-149` (D8-24) — accumulation du `Ctrl` + clic, PAR `graphId` (G1/G2/G3 sont trois instances
 * indépendantes). Portée MODULE, délibérément PAS un état Preact : `Histogram` reste un composant
 * SANS hook (les sondes `tests/review/D7/histogrammes.test.ts` l'appellent comme une fonction pure,
 * hors de tout rendu Preact — un hook y lèverait une exception) et cet accroissement ne doit de toute
 * façon PAS provoquer de nouveau rendu à lui seul : seul l'appel à `onSelectBucket` (qui pose un vrai
 * filtre côté hôte) fait progresser l'écran. Remise à zéro par clic simple ou double-clic sur ce
 * graphe (repart d'une sélection propre, EX-SCR-149).
 */
const ctrlSelectionByGraph = new Map<string, Set<number>>();

export function Histogram(props: HistogramProps) {
  const model: HistogramModel = buildHistogram(props.metric, props.buckets, { log: props.log });
  const viewH = props.compact === true ? VIEW_H_COMPACT : VIEW_H;
  const plotW = VIEW_W - PAD_L - PAD_R;
  const plotH = viewH - PAD_T - PAD_B;
  const gap = 2; // EX-SCR-148

  const table = histogramTable(model, formatMetric);
  const ariaLabel = `Histogramme ${props.title}, ${model.bars.length} classes, ${model.totalCount} offres`;

  // ---- EX-SCR-149 (D8-24) — brossage horizontal / `Ctrl` + clic / double-clic ------------------
  // Variables de FERMETURE (pas un état Preact, cf. commentaire de `ctrlSelectionByGraph`) : un
  // brossage complet (mousedown → mouseup) ne traverse jamais de nouveau rendu de CE composant (aucun
  // changement de props en cours de geste), donc une simple fermeture locale suffit et reste plus
  // simple qu'un état module — contrairement au `Ctrl` + clic, dont chaque étape POSE réellement un
  // filtre (et déclenche donc un nouveau rendu), d'où sa portée module.
  let dragStartIndex: number | null = null;
  let dragEndIndex: number | null = null;

  const barBoundsAt = (i: number): Pick<DistributionBucket, 'lowerBound' | 'upperBound'> | undefined => model.bars[i];

  /** Termine un brossage horizontal (mouseup/mouseleave) : n'agit QUE si au moins deux bins distincts
   * ont été traversés — un brossage nul (aucun déplacement) est un simple clic, déjà géré par
   * `onClick` de la barre, jamais compté deux fois. */
  const finalizeBrush = (): void => {
    const start = dragStartIndex;
    const end = dragEndIndex;
    dragStartIndex = null;
    dragEndIndex = null;
    if (start === null || end === null || start === end) return;
    const lo = Math.min(start, end);
    const hi = Math.max(start, end);
    const spanned = model.bars.slice(lo, hi + 1);
    if (spanned.length === 0) return;
    props.onSelectBucket?.(envelopeBounds(spanned));
  };

  /** Clic simple (pose le bucket exact, comportement inchangé) ou `Ctrl` + clic (accumule/retire ce
   * bucket dans la sélection non contiguë du graphe, pose l'enveloppe des buckets accumulés). */
  const onBarClick = (i: number, ctrlKey: boolean): void => {
    const bar = model.bars[i];
    if (bar === undefined) return;
    if (ctrlKey) {
      const selected = ctrlSelectionByGraph.get(props.graphId) ?? new Set<number>();
      if (selected.has(i)) selected.delete(i);
      else selected.add(i);
      ctrlSelectionByGraph.set(props.graphId, selected);
      if (selected.size === 0) return; // dernier bucket retiré de la sélection : rien à poser
      const spanned = [...selected]
        .map((idx) => barBoundsAt(idx))
        .filter((b): b is Pick<DistributionBucket, 'lowerBound' | 'upperBound'> => b !== undefined);
      props.onSelectBucket?.(envelopeBounds(spanned));
      return;
    }
    ctrlSelectionByGraph.delete(props.graphId); // clic simple : repart d'une sélection propre
    const bucket = props.buckets.find((bk) => bk.index === bar.index);
    if (bucket) props.onSelectBucket?.(bucket);
  };

  /** Double-clic dans la zone de tracé (EX-SCR-149) : retire le filtre posé par ce graphe. */
  const onPlotDoubleClick = (): void => {
    ctrlSelectionByGraph.delete(props.graphId);
    props.onClearFilter?.(props.metric);
  };

  return (
    <GraphFrame
      graphId={props.graphId}
      title={props.title}
      ariaLabel={ariaLabel}
      count={props.headerCount !== undefined && props.headerCount !== model.totalCount ? model.totalCount : undefined}
      exclusions={props.exclusions}
      dataSelection={props.dataSelection}
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
          style={{ width: `${VIEW_W}px`, height: `${viewH}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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

          <svg
            viewBox={`0 0 ${VIEW_W} ${viewH}`}
            class="kycar-hist"
            role="img"
            aria-label={ariaLabel}
            onMouseUp={finalizeBrush}
            onMouseLeave={finalizeBrush}
            onDblClick={onPlotDoubleClick}
          >
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
                  // EX-SCR-149 : clic = bucket exact ; `Ctrl` + clic = accumulation non contiguë
                  // (`onBarClick`) ; mousedown/mouseenter amorcent/prolongent le brossage horizontal,
                  // fini au `mouseup`/`mouseleave` du tracé (`finalizeBrush`, sur le `<svg>`).
                  onClick={(e: MouseEvent) => onBarClick(i, e.ctrlKey)}
                  onMouseDown={() => {
                    dragStartIndex = i;
                    dragEndIndex = i;
                  }}
                  onMouseEnter={() => {
                    if (dragStartIndex !== null) dragEndIndex = i;
                  }}
                >
                  <title>{`${formatMetric(b.lowerBound, props.metric)} – ${formatMetric(b.upperBound, props.metric)} · ${b.count} offres · ${(b.share * 100).toFixed(1)} %`}</title>
                </rect>
              );
            })}

            {/* EX-SCR-184 (DR-080) — surimpression de liaison croisée : part sélectionnée par
                brossage, en accent secondaire, SANS recalcul d'échelle (même hauteur de référence
                que la barre principale). */}
            {props.selectedCounts
              ? model.bars.map((b, i) => {
                  const selCount = props.selectedCounts?.get(b.index) ?? 0;
                  if (selCount <= 0) return null;
                  const x = PAD_L + b.xFrac * plotW + gap / 2;
                  const w = Math.max(1, b.widthFrac * plotW - gap);
                  const denom = model.logApplied ? Math.log1p(model.maxCount) : model.maxCount;
                  const selFrac = model.logApplied ? Math.log1p(selCount) / denom : selCount / denom;
                  const h = Math.max(1, selFrac * plotH);
                  const y = PAD_T + plotH - h;
                  return (
                    <rect
                      key={`sel-${i}`}
                      data-selected="true"
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill="var(--color-secondary, #b3261e)"
                      fill-opacity={0.85}
                      pointer-events="none"
                    />
                  );
                })
              : null}

            {/* EX-SCR-145 (DR-074) : étiquettes de borne d'axe X — une sur deux si < 48 px par
                étiquette, pour rester lisible sans survol ni ouverture de la table.
                `EX-SCR-181` (ACC-03) : en régime COMPACT, une sur TROIS, sans condition de largeur —
                à 360 px de viewport les 14 étiquettes de G1 se chevauchaient comme à 1280. */}
            {model.bars.map((b, i) => {
              const barWidthPx = b.widthFrac * plotW;
              const skipped =
                props.compact === true ? i % 3 !== 0 : barWidthPx < 48 && i % 2 !== 0;
              if (skipped) return null;
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
