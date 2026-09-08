/**
 * KYCAR — Nuage G4 (lot D7, EX-SCR-151..160, EX-NFR-7/8/15/19)
 * =================================================================================================
 * Vue commutable G4a (nuée empilée) / G4b (nuage prix × année), rendue en Canvas 2D (le calcul
 * d'échantillonnage et de projection est fait par les modules purs testés). Brossage rectangulaire
 * avec liaison croisée (EX-SCR-158/184), zoom par boutons + Maj-glisser, légendes couleur/taille,
 * table des points sous-jacents + résumé textuel des outliers (EX-NFR-15). Sous 768 px : projection
 * 2D dégradée prix × km, année en couleur, brossage désactivé (EX-NFR-19).
 */

import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ScatterPoint } from './scatter-model';
import {
  makeProjector,
  makeInverseProjector,
  q01q99,
  rampColor,
  RAMP_A_YEAR,
  RAMP_B_MILEAGE,
  MILEAGE_CLIP_KM,
  mileageDiameter,
  priceGridEdges,
  priceBoundsFromGrid,
  gridBucketIndex,
  januaryTicks,
  linearTicks,
  type AxisBounds,
  type AxisTick,
  type GridBucket,
  type Viewport,
} from './scatter-model';
import { drawScatter, type Canvas2DLike, type ScatterVariant } from './scatter-render';
import { computeBrushSelection, brushAccessorFor } from './brush-model';
import type { BrushRange } from './url-state';
import { formatPrice, formatKm, formatYear } from './format';
import { bin, binIndexOf, PRICE_BIN_PARAMS } from '../../engine/bin';
import { SCATTER_MAX_POINTS } from './scatter-sample';

/** Rayon de tolérance (px) du survol/clic sur un point (DR-084, index spatial simple). */
const HIT_RADIUS_PX = 8;

export interface ScatterSampleInfo {
  readonly eligibleCount: number;
  readonly plottedCount: number;
  readonly outlierCount: number;
  readonly outlierPlottedCount: number;
  readonly sampled: boolean;
  readonly outlierTruncated: boolean;
}

export interface ScatterCloudProps {
  readonly points: readonly ScatterPoint[];
  readonly variant: ScatterVariant;
  readonly onVariantChange: (v: ScatterVariant) => void;
  readonly sampleInfo: ScatterSampleInfo;
  readonly brushX: BrushRange | null;
  readonly brushY: BrushRange | null;
  readonly onBrushChange: (brushX: BrushRange | null, brushY: BrushRange | null) => void;
  /** Vrai sous 768 px : projection dégradée prix × km, année en couleur, brossage off (EX-NFR-19). */
  readonly degraded?: boolean;
  readonly width?: number;
  readonly height?: number;
  /** `EX-SCR-158` (DR-084) — survol d'un point : les 6 lignes normatives de l'infobulle (texte,
   * jamais du balisage — `ARB-62`), la 6ᵉ étant la chaîne d'étiquetage `EX-SCR-158bis`. Calculées par
   * l'hôte (`DistributionScreen`, qui a accès au batch et aux verdicts d'outlier) à partir de
   * `point.row`. `undefined` : aucune infobulle (repli, ex. écran monté sans cette prop). */
  readonly resolveTooltip?: (row: number) => readonly string[] | undefined;
  /** `EX-SCR-158`/`201` (DR-084, cohérent avec DR-010) — clic sur un point : ouvre l'annonce
   * d'origine. Point d'intégration D8 (l'URL réelle vient du batch, tenu par l'hôte). */
  readonly onOpenListing?: (row: number) => void;
  /** `EX-SCR-176` (D8-06/FV-18) — empreinte du jeu de filtres qui a produit ce nuage, posée telle
   * quelle en `data-selection` sur le `<figure>` (même contrat que `GraphFrame`, pas de dépendance
   * directe puisque G4 se peint lui-même). */
  readonly dataSelection?: string;
  /** `EX-SCR-153` (D8-31) — grille de `G1` (`RecalcResult.priceHistogram`) : `G4a` doit porter
   * « exactement les mêmes bornes et les mêmes buckets » que l'histogramme des prix, faute de quoi
   * les deux graphes ne se lisent plus l'un sur l'autre. Absente : repli sur `Q(0,01)`/`Q(0,99)` des
   * points tracés (`EX-SCR-18`), c'est-à-dire le comportement d'avant D8-31 — jamais une borne
   * inventée, mais l'alignement n'est alors pas garanti (voir le rapport de lot). */
  readonly priceBuckets?: readonly GridBucket[];
}

/** Bornes d'année / km observées (pour normaliser les rampes couleur). `hasAnyYear` (DR-086) est
 * calculé AVANT le repli `{0,1}` de `yearMin`/`yearMax` : ce repli sert uniquement à donner des
 * bornes finies à la rampe couleur quand aucune annonce n'a d'année exploitable, il ne doit jamais
 * être confondu avec « une année existe » (`yearMax === yearMin` ne se déclenche jamais sur `{0,1}`,
 * `EX-SCR-160`). */
function ramps(points: readonly ScatterPoint[]) {
  let yearMin = Infinity;
  let yearMax = -Infinity;
  let kmMin = Infinity;
  let kmMax = -Infinity;
  let hasAnyYear = false;
  for (const p of points) {
    if (p.year >= 0) {
      hasAnyYear = true;
      if (p.year < yearMin) yearMin = p.year;
      if (p.year > yearMax) yearMax = p.year;
    }
    if (p.mileageKm < kmMin) kmMin = p.mileageKm;
    if (p.mileageKm > kmMax) kmMax = p.mileageKm;
  }
  if (!Number.isFinite(yearMin)) {
    yearMin = 0;
    yearMax = 1;
  }
  if (!Number.isFinite(kmMin)) {
    kmMin = 0;
    kmMax = 1;
  }
  return { yearMin, yearMax, kmMin, kmMax, hasAnyYear };
}

export function ScatterCloud(props: ScatterCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const width = props.width ?? 900;
  const height = props.height ?? 480;
  const [zoom, setZoom] = useState(1);
  const [showData, setShowData] = useState(false);
  const dragRef = useRef<{ x0: number; y0: number; x1: number; y1: number; shiftKey: boolean } | null>(null);
  const [dragRect, setDragRect] = useState<{ x0: number; y0: number; x1: number; y1: number; shiftKey: boolean } | null>(null);

  const effectiveVariant: ScatterVariant = props.degraded ? 'scatter' : props.variant;
  const { yearMin, yearMax, kmMin, kmMax, hasAnyYear } = ramps(props.points);

  // `EX-SCR-159` (D8-24) — sous 4 offres, le brossage (et le zoom rectangulaire `Maj` + glisser, qui
  // partage le même geste de glissement) n'a plus de sens (« Sélection inutile en dessous de 4
  // offres ») ; les légendes passent en styles discrets (texte atténué, taille réduite,
  // `distribution.css`). Le clic simple (ouvrir une annonce / effacer un brossage existant déjà posé)
  // reste actif : seule la partie GLISSÉE du geste est neutralisée (cf. `onPointerDown`/`onPointerUp`
  // plus bas).
  const lowSample = props.points.length < 4;

  const vp: Viewport = useMemo(
    () => ({ width, height, padLeft: 52, padRight: props.degraded ? 16 : 168, padTop: 16, padBottom: 40 }),
    [width, height, props.degraded],
  );

  // `EX-SCR-153` (D8-31) — bornes et buckets de `G1`, quand l'hôte les fournit.
  const gridEdges = useMemo(
    () => (props.priceBuckets ? priceGridEdges(props.priceBuckets) : []),
    [props.priceBuckets],
  );
  const gridBounds = useMemo(() => priceBoundsFromGrid(gridEdges), [gridEdges]);

  // Rangs d'empilement pour G4a (Y = effectif dans le bucket de prix, EX-SCR-151). `EX-SCR-153` :
  // les buckets sont CEUX DE G1 dès que la grille est fournie — un `BIN` refait sur les seuls points
  // ÉCHANTILLONNÉS (`sampleScatter`) produirait sa propre largeur de bin, donc un empilement qui ne
  // correspondrait plus barre pour barre à l'histogramme des prix.
  const stackRankByRow = useMemo(() => {
    if (effectiveVariant !== 'stack') return undefined;
    const useGrid = gridEdges.length >= 2;
    const priceBins = useGrid ? null : bin(props.points.map((p) => p.priceEur), PRICE_BIN_PARAMS);
    const rankByBin = new Map<number, number>();
    const map = new Map<number, number>();
    for (const p of props.points) {
      const bi = useGrid ? gridBucketIndex(p.priceEur, gridEdges) : binIndexOf(p.priceEur, priceBins!);
      const r = rankByBin.get(bi) ?? 0;
      map.set(p.row, r);
      rankByBin.set(bi, r + 1);
    }
    return map;
  }, [props.points, effectiveVariant, gridEdges]);

  const maxStack = useMemo(() => {
    if (stackRankByRow === undefined) return 1;
    let m = 1;
    for (const r of stackRankByRow.values()) if (r + 1 > m) m = r + 1;
    return m;
  }, [stackRankByRow]);

  // Bornes d'axe (Q01/Q99, EX-SCR-18), resserrées par le zoom.
  const { xB, yB } = useMemo(() => {
    let x: AxisBounds;
    let y: AxisBounds;
    if (props.degraded) {
      x = q01q99(props.points.map((p) => p.mileageKm));
      y = q01q99(props.points.map((p) => p.priceEur));
    } else if (effectiveVariant === 'stack') {
      // `EX-SCR-153` : bornes de `G1` (première borne du premier bucket fermé, dernière du dernier),
      // et non `Q(0,01)`/`Q(0,99)` des points — sinon les deux axes de prix ne coïncident pas.
      x = gridBounds ?? q01q99(props.points.map((p) => p.priceEur));
      y = { lo: 0, hi: maxStack };
    } else {
      x = q01q99(props.points.map((p) => p.regYearMonth));
      y = q01q99(props.points.map((p) => p.priceEur));
    }
    const zx: AxisBounds = { lo: x.lo, hi: x.lo + (x.hi - x.lo) * zoom };
    const zy: AxisBounds = { lo: y.lo, hi: y.lo + (y.hi - y.lo) * zoom };
    return { xB: zx, yB: zy };
  }, [props.points, effectiveVariant, props.degraded, maxStack, zoom, gridBounds]);

  const selectedRows = useMemo(() => {
    if (props.brushX === null && props.brushY === null) return null;
    const accessor = brushAccessorFor(effectiveVariant, Boolean(props.degraded));
    return computeBrushSelection(props.points, props.brushX, props.brushY, accessor);
  }, [props.points, props.brushX, props.brushY, effectiveVariant, props.degraded]);

  const proj = useMemo(() => makeProjector(vp, xB, yB), [vp, xB, yB]);

  /**
   * `EX-SCR-153` (D8-31) — GRADUATIONS des deux axes, seule trace lisible (et inspectable) des
   * échelles réellement projetées, le tracé lui-même étant un canvas :
   *   - `G4a` : X = les bornes de buckets de `G1` (grille `BIN`), Y = effectif LINÉAIRE depuis 0 ;
   *   - `G4b` : X = 1ᵉʳ janvier de chaque année (`firstRegistrationYearMonth ≡ 0 [12]`), Y = prix ;
   *   - régime dégradé (`EX-NFR-19`) : X = kilométrage, Y = prix, tous deux linéaires.
   * Les deux échelles sont LINÉAIRES en toutes circonstances : `EX-SCR-153` interdit toute échelle
   * logarithmique dans `G4` (elle romprait la correspondance visuelle avec `G1` et `G3`).
   */
  const axes = useMemo((): { readonly x: readonly AxisTick[]; readonly y: readonly AxisTick[] } => {
    const withinX = (v: number): boolean => v >= xB.lo - 1e-9 && v <= xB.hi + 1e-9;
    if (props.degraded) {
      return { x: linearTicks(xB, 5, formatKm), y: linearTicks(yB, 5, formatPrice) };
    }
    if (effectiveVariant === 'stack') {
      const edges = gridEdges.filter(withinX);
      const every = Math.max(1, Math.ceil(edges.length / 6));
      const x: readonly AxisTick[] =
        edges.length >= 2
          ? edges.map((v, i) => ({ value: v, label: i % every === 0 ? formatPrice(v) : '' }))
          : linearTicks(xB, 5, formatPrice);
      const steps = Math.max(2, Math.min(5, Math.round(yB.hi) + 1));
      return { x, y: linearTicks(yB, steps, (v) => String(Math.round(v))) };
    }
    const years = Math.max(1, Math.floor(xB.hi / 12) - Math.ceil(xB.lo / 12) + 1);
    return { x: januaryTicks(xB, Math.max(1, Math.ceil(years / 8))), y: linearTicks(yB, 5, formatPrice) };
  }, [props.degraded, effectiveVariant, gridEdges, xB, yB]);

  // Position ÉCRAN d'un point, cohérente avec `drawScatter` (X = rang en G4a, X = km en dégradé).
  const screenPosOf = (p: ScatterPoint): { x: number; y: number } => {
    if (props.degraded) return { x: proj.x(p.mileageKm), y: proj.y(p.priceEur) };
    if (effectiveVariant === 'stack') return { x: proj.x(p.priceEur), y: proj.y(stackRankByRow?.get(p.row) ?? 0) };
    return { x: proj.x(p.regYearMonth), y: proj.y(p.priceEur) };
  };

  /** Point le plus proche du curseur (index spatial simple : balayage linéaire, DR-084) — `points`
   * est déjà borné à `SCATTER_MAX_POINTS` (5 000), un balayage par mouvement de souris reste bon
   * marché. `HIT_RADIUS_PX` : rayon de tolérance au survol/clic. */
  const nearestPoint = (px: number, py: number): ScatterPoint | undefined => {
    let best: ScatterPoint | undefined;
    let bestDist = HIT_RADIUS_PX * HIT_RADIUS_PX;
    for (const p of props.points) {
      const pos = screenPosOf(p);
      const dx = pos.x - px;
      const dy = pos.y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 <= bestDist) {
        bestDist = d2;
        best = p;
      }
    }
    return best;
  };

  // Rendu Canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as unknown as Canvas2DLike | null;
    if (!ctx) return;
    // En dégradé, l'axe X encode le km : on recopie km dans regYearMonth pour réutiliser le rendu
    // scatter (X = regYearMonth). C'est la projection 2D dégradée d'EX-NFR-19.
    const drawPoints = props.degraded
      ? props.points.map((p) => ({ ...p, regYearMonth: p.mileageKm })) // X = km en dégradé
      : props.points;
    drawScatter(ctx, drawPoints, proj, vp.width, vp.height, {
      variant: props.degraded ? 'scatter' : effectiveVariant,
      yearMin,
      yearMax,
      mileageMin: kmMin,
      mileageMax: kmMax,
      selectedRows,
      fixedDiameterPx: 6,
      degraded: props.degraded,
    }, stackRankByRow);
  }, [props.points, effectiveVariant, props.degraded, vp, proj, selectedRows, yearMin, yearMax, kmMin, kmMax, stackRankByRow]);

  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const eventPos = (e: MouseEvent): { x: number; y: number } => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * vp.width, y: ((e.clientY - rect.top) / rect.height) * vp.height };
  };

  // Brossage (souris) — désactivé en dégradé (EX-NFR-19). `Maj` + glisser (DR-148, EX-SCR-158) :
  // zoom rectangulaire plutôt qu'un brossage, distingué par `shiftKey` au clic initial.
  const onPointerDown = (e: MouseEvent): void => {
    if (props.degraded) return;
    const { x, y } = eventPos(e);
    dragRef.current = { x0: x, y0: y, x1: x, y1: y, shiftKey: e.shiftKey };
    // `EX-SCR-159` : pas d'aperçu de rectangle sous 4 offres — le geste glissé est neutralisé (voir
    // `onPointerUp`), montrer un rectangle qui n'aboutira à rien serait trompeur.
    if (!lowSample) setDragRect(dragRef.current);
  };
  const onPointerMove = (e: MouseEvent): void => {
    if (dragRef.current !== null) {
      const { x, y } = eventPos(e);
      dragRef.current.x1 = x;
      dragRef.current.y1 = y;
      if (!lowSample) setDragRect({ ...dragRef.current });
      return;
    }
    // Pas de glisser en cours : survol (DR-084).
    const { x, y } = eventPos(e);
    const p = nearestPoint(x, y);
    setHoveredRow(p ? p.row : null);
    setHoverPos(p ? { x, y } : null);
  };
  const onPointerLeave = (): void => {
    setHoveredRow(null);
    setHoverPos(null);
  };
  const onPointerUp = (e: MouseEvent): void => {
    const d = dragRef.current;
    dragRef.current = null;
    setDragRect(null);
    if (d === null) return;
    const negligible = Math.abs(d.x1 - d.x0) < 4 || Math.abs(d.y1 - d.y0) < 4;
    if (negligible) {
      // Clic simple : sur un point → ouvre l'annonce (DR-084/EX-SCR-158) ; sinon, efface le
      // brossage en cours (comportement inchangé).
      const { x, y } = eventPos(e);
      const p = nearestPoint(x, y);
      if (p) props.onOpenListing?.(p.row);
      else props.onBrushChange(null, null);
      return;
    }
    // `EX-SCR-159` : sous 4 offres, un VRAI glisser (non négligeable) ne pose ni brossage ni zoom —
    // seul le clic simple ci-dessus reste actif.
    if (lowSample) return;
    const inv = makeInverseProjector(vp, xB, yB);
    const xa = inv.dataX(Math.min(d.x0, d.x1));
    const xb = inv.dataX(Math.max(d.x0, d.x1));
    const ya = inv.dataY(Math.max(d.y0, d.y1)); // y bas
    const yb = inv.dataY(Math.min(d.y0, d.y1)); // y haut
    if (d.shiftKey) {
      // Zoom rectangulaire (DR-148, EX-SCR-158) : resserre la fenêtre courante sur le rectangle
      // glissé plutôt que de poser un brossage. `zoom` reste un facteur scalaire UNIQUE (appliqué
      // aux deux axes depuis leur borne basse, comme le zoom par boutons) : on le recale sur le
      // ratio de largeur du rectangle sur l'axe X, l'axe dimensionnant de `G4b` comme de `G4a`.
      const spanX = xB.hi - xB.lo || 1;
      const newSpanX = xb - xa;
      if (newSpanX > 0) setZoom((z) => Math.max(0.01, Math.min(2, z * (newSpanX / spanX))));
      return;
    }
    props.onBrushChange({ from: xa, to: xb }, { from: ya, to: yb });
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') props.onBrushChange(null, null); // EX-SCR-158
  };

  const outlierPoints = props.points.filter((p) => p.isOutlier);
  const selectedCount = selectedRows?.size ?? 0;
  const tooltipLines = hoveredRow !== null ? props.resolveTooltip?.(hoveredRow) : undefined;

  // `EX-SCR-154` (DR-151) : médiane d'année à ajouter à la légende de couleur — calcul direct
  // (module de tri déjà utilisé pour les rangs de G4a serait disproportionné pour une médiane).
  const yearMedian = useMemo(() => {
    const years = props.points.map((p) => p.year).filter((y) => y >= 0).sort((a, b) => a - b);
    if (years.length === 0) return undefined;
    return years[Math.floor(years.length / 2)];
  }, [props.points]);

  return (
    <figure class="kycar-graph kycar-scatter" data-graph="G4" data-selection={props.dataSelection} role="group" aria-label="Nuage prix, année et kilométrage">
      <figcaption class="kycar-graph-head">
        <h3 class="kycar-graph-title">Prix × année × kilométrage</h3>
        <div class="kycar-scatter-controls">
          {!props.degraded ? (
            <div role="tablist" aria-label="Variante du nuage">
              <button type="button" role="tab" aria-selected={props.variant === 'stack'} onClick={() => props.onVariantChange('stack')}>
                Nuée empilée
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={props.variant === 'scatter'}
                disabled={!hasAnyYear}
                title={!hasAnyYear ? "Nécessite l'année de première immatriculation" : undefined}
                onClick={() => props.onVariantChange('scatter')}
              >
                Prix × année
              </button>
            </div>
          ) : null}
          {/* EX-SCR-160 (DR-086) : légende de repli quand G4b est indisponible faute d'année. */}
          {!hasAnyYear ? (
            <p class="kycar-scatter-no-year-note">année non renseignée sur les {props.points.length} offres</p>
          ) : null}
          <div class="kycar-scatter-zoom">
            <button type="button" aria-label="Zoom avant" onClick={() => setZoom((z) => Math.max(0.1, z * 0.8))}>+</button>
            <button type="button" aria-label="Zoom arrière" onClick={() => setZoom((z) => Math.min(2, z * 1.25))}>−</button>
            <button type="button" onClick={() => setZoom(1)}>Réinitialiser</button>
          </div>
          <button type="button" aria-expanded={showData} onClick={() => setShowData((v) => !v)}>
            {showData ? 'Masquer les données' : 'Voir les données'}
          </button>
        </div>
      </figcaption>

      <div class="kycar-scatter-body" style={{ position: 'relative', overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          class={lowSample ? 'kycar-scatter-canvas kycar-scatter-canvas--brush-disabled' : 'kycar-scatter-canvas'}
          style={{ maxWidth: '100%', touchAction: 'none' }}
          tabIndex={0}
          role="img"
          aria-label={`Nuage de ${props.sampleInfo.plottedCount} points, ${outlierPoints.length} outliers`}
          // `EX-SCR-159` (D8-24) — sous 4 offres, `aria-disabled` + curseur dédié (`distribution.css`)
          // et message court signalent que brossage/zoom sont inertes ; le clic simple (survol,
          // ouverture d'annonce) reste, lui, pleinement fonctionnel (cf. `onPointerDown`/`onPointerUp`).
          aria-disabled={lowSample}
          title={lowSample ? 'Sélection inutile en dessous de 4 offres' : undefined}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerLeave}
          onKeyDown={onKeyDown}
        />
        {/* Graduations (EX-SCR-153) — calque SVG au-dessus du canvas, sans interception d'événement.
            `aria-hidden` : la lecture non visuelle passe par la table des points (EX-NFR-15), un axe
            gradué n'y ajouterait qu'un flot de nombres. Les attributs `data-axis`/`data-scale`/
            `data-tick` portent l'échelle et les bornes effectivement projetées. */}
        <svg
          class="kycar-scatter-axes"
          viewBox={`0 0 ${vp.width} ${vp.height}`}
          aria-hidden="true"
          style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <g data-axis="x" data-scale="linear">
            {axes.x.map((t) => (
              <g key={`x${t.value}`}>
                <line
                  data-tick={t.value}
                  x1={proj.x(t.value)}
                  x2={proj.x(t.value)}
                  y1={vp.height - vp.padBottom}
                  y2={vp.height - vp.padBottom + 4}
                  stroke="currentColor"
                  stroke-width={0.5}
                />
                {t.label !== '' ? (
                  <text x={proj.x(t.value)} y={vp.height - vp.padBottom + 15} text-anchor="middle" font-size="9">
                    {t.label}
                  </text>
                ) : null}
              </g>
            ))}
          </g>
          <g data-axis="y" data-scale="linear">
            {axes.y.map((t) => (
              <g key={`y${t.value}`}>
                <line
                  data-tick={t.value}
                  x1={vp.padLeft - 4}
                  x2={vp.padLeft}
                  y1={proj.y(t.value)}
                  y2={proj.y(t.value)}
                  stroke="currentColor"
                  stroke-width={0.5}
                />
                {t.label !== '' ? (
                  <text x={vp.padLeft - 6} y={proj.y(t.value) + 3} text-anchor="end" font-size="9">
                    {t.label}
                  </text>
                ) : null}
              </g>
            ))}
          </g>
        </svg>
        {dragRect ? (
          <div
            class="kycar-brush-rect"
            style={{
              position: 'absolute',
              left: `${(Math.min(dragRect.x0, dragRect.x1) / vp.width) * 100}%`,
              top: `${(Math.min(dragRect.y0, dragRect.y1) / vp.height) * 100}%`,
              width: `${(Math.abs(dragRect.x1 - dragRect.x0) / vp.width) * 100}%`,
              height: `${(Math.abs(dragRect.y1 - dragRect.y0) / vp.height) * 100}%`,
              border: '1px solid var(--color-primary)',
              background: 'rgba(11,95,214,0.12)',
              pointerEvents: 'none',
            }}
          />
        ) : null}

        {/* Infobulle de survol, 6 lignes (EX-SCR-158) — CONTENU TEXTUEL, jamais du balisage
            (`ARB-62`) : `resolveTooltip` (fourni par l'hôte) rend déjà des chaînes échappées par
            Preact comme tout enfant textuel. */}
        {tooltipLines && tooltipLines.length > 0 && hoverPos ? (
          <div
            class="kycar-scatter-tooltip"
            role="status"
            style={{
              position: 'absolute',
              left: `${(hoverPos.x / vp.width) * 100}%`,
              top: `${(hoverPos.y / vp.height) * 100}%`,
              pointerEvents: 'none',
            }}
          >
            {tooltipLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        ) : null}

        {/* Légende (couleur + taille) — EX-SCR-154/155/156 (DR-151) : contenu TEXTUEL réel, plus
            `aria-hidden` (rien à masquer, la légende porte une information que le nuage seul ne
            donne pas). `EX-NFR-19` (E2E-17, CORRIGÉ) : en dégradé (X = km, EX-NFR-19), la couleur
            encode l'ANNÉE (jamais le km, déjà porté par l'axe X) — la légende de couleur reste donc
            rendue ; seule la légende de TAILLE disparaît (taille fixe en dégradé, `fixedDiameterPx`,
            rien à légender). */}
        <div class="kycar-scatter-legend">
          <ColorLegend
            variant={effectiveVariant}
            degraded={props.degraded}
            yearMin={yearMin}
            yearMax={yearMax}
            yearMedian={yearMedian}
            kmMin={kmMin}
            kmMax={kmMax}
            discrete={lowSample}
          />
          {!props.degraded ? (
            effectiveVariant === 'stack' ? <SizeLegend discrete={lowSample} /> : <SizeLegendScatter discrete={lowSample} />
          ) : null}
        </div>
      </div>

      {/* Mention d'échantillonnage (EX-DATA-103, DR-149 — D-06 : mode + n_e + K + points, SANS
          graine, `EX-DATA-101` faisant foi sur `EX-DATA-100bis`). */}
      {props.sampleInfo.sampled ? (
        <p class="kycar-scatter-samplenote">
          Échantillon : mode d’échantillonnage pas régulier sur listingId, outliers conservés (EX-DATA-101) —{' '}
          {props.sampleInfo.plottedCount} points tracés sur {props.sampleInfo.eligibleCount} éligibles (n_e), plafond {SCATTER_MAX_POINTS}
          (K).
          {props.sampleInfo.outlierTruncated
            ? ` ${props.sampleInfo.outlierCount - props.sampleInfo.outlierPlottedCount} annonces signalées non tracées.`
            : ''}
        </p>
      ) : null}

      {selectedCount > 0 ? (
        <p class="kycar-scatter-selcount" role="status">
          {selectedCount} annonces sélectionnées
        </p>
      ) : null}

      {/* Résumé textuel des outliers + table des points (EX-NFR-15) */}
      <div class="kycar-scatter-data" hidden={!showData}>
        <p>
          {outlierPoints.length} outliers détectés dans l'échantillon.
        </p>
        <table>
          <caption>Points sous-jacents du nuage</caption>
          <thead>
            <tr>
              <th scope="col">Prix</th>
              <th scope="col">Année</th>
              <th scope="col">Km</th>
              <th scope="col">Outlier</th>
            </tr>
          </thead>
          <tbody>
            {/* EX-NFR-15 (DR-083, WCAG 1.1.1) : la TOTALITÉ des points tracés, pas seulement les 500
                premiers — 90 % du nuage n'était plus accessible au lecteur d'écran. Coût nul à
                l'affichage initial : la table est repliée par défaut (`hidden`, ci-dessus). */}
            {props.points.map((p) => (
              <tr key={p.row}>
                <td>{formatPrice(p.priceEur)}</td>
                <td>{p.year >= 0 ? formatYear(p.year) : '—'}</td>
                <td>{formatKm(p.mileageKm)}</td>
                <td>{p.isOutlier ? 'oui' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** `EX-SCR-159` (D8-24) — classe commune des trois légendes en dessous de 4 offres : texte atténué
 * (`--color-text-muted`) et taille réduite (`distribution.css`, §annexe B), simple modificateur de la
 * légende continue existante — la légende reste la MÊME donnée, seulement moins mise en avant, jamais
 * un habillage inventé. */
function legendClass(base: string, discrete: boolean | undefined): string {
  return discrete ? `${base} kycar-legend--discrete` : base;
}

function ColorLegend(props: {
  variant: ScatterVariant;
  /** `EX-NFR-19` (E2E-17) : en dégradé, la couleur encode TOUJOURS l'année, quelle que soit
   * `variant` (le km, déjà sur l'axe X, ne peut pas être aussi la couleur). */
  degraded?: boolean;
  yearMin: number;
  yearMax: number;
  yearMedian: number | undefined;
  kmMin: number;
  kmMax: number;
  /** `EX-SCR-159` : moins de 4 offres tracées — légende discrète (texte atténué, taille réduite). */
  discrete?: boolean;
}) {
  const isYear = props.degraded === true || props.variant === 'stack';
  const ramp = isYear ? RAMP_A_YEAR : RAMP_B_MILEAGE;
  const stops = [0, 0.25, 0.5, 0.75, 1];
  const lo = isYear ? props.yearMin : props.kmMin;
  const hi = isYear ? props.yearMax : props.kmMax;
  const fmt = isYear ? (v: number) => formatYear(v) : (v: number) => formatKm(v);
  return (
    <div class={legendClass('kycar-legend', props.discrete)}>
      <span class="kycar-legend-title">{isYear ? 'Année' : 'Kilométrage'}</span>
      <span class="kycar-legend-ramp" style={{ display: 'inline-flex' }}>
        {stops.map((t) => (
          <span key={t} style={{ width: '18px', height: '10px', background: rampColor(ramp, t) }} />
        ))}
      </span>
      <span class="kycar-legend-range">
        {fmt(lo)} – {fmt(hi)}
        {/* EX-SCR-154 (DR-151) : médiane d'année, absente jusqu'ici de la légende de couleur. */}
        {isYear && props.yearMedian !== undefined ? <> · médiane {fmt(props.yearMedian)}</> : null}
      </span>
    </div>
  );
}

/** `EX-SCR-155` (DR-151) : légende de taille de G4a — trois disques témoins, aire ∝ km (comme le
 * tracé, `mileageDiameter`). */
function SizeLegend(props: { discrete?: boolean }) {
  const stops: readonly [number, string][] = [
    [0, '0 km'],
    [100000, '100 000 km'],
    [MILEAGE_CLIP_KM, '250 000 km et plus'],
  ];
  return (
    <div class={legendClass('kycar-legend kycar-legend-size', props.discrete)}>
      <span class="kycar-legend-title">Taille</span>
      {stops.map(([km, label]) => {
        const d = mileageDiameter(km).diameter;
        return (
          <span key={km} class="kycar-legend-disc-item">
            <span
              class="kycar-legend-disc"
              style={{ display: 'inline-block', width: `${d}px`, height: `${d}px`, borderRadius: '50%', background: 'var(--color-text-muted)' }}
            />
            {label}
          </span>
        );
      })}
    </div>
  );
}

/** `EX-SCR-156` (DR-151) : la taille de G4b encode la puissance ; en son absence, taille fixe et
 * mention explicite (« taille non porteuse d'information »), jamais silencieuse. */
function SizeLegendScatter(props: { discrete?: boolean }) {
  return (
    <div class={legendClass('kycar-legend kycar-legend-size', props.discrete)}>
      <span class="kycar-legend-title">Taille</span>
      <span>puissance (kW) — sinon taille fixe, taille non porteuse d'information</span>
    </div>
  );
}
