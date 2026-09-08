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
  type AxisBounds,
  type Viewport,
} from './scatter-model';
import { drawScatter, type Canvas2DLike, type ScatterVariant } from './scatter-render';
import { computeBrushSelection, BRUSH_ACCESSOR_SCATTER, type BrushAccessor } from './brush-model';
import type { BrushRange } from './url-state';
import { formatPrice, formatKm, formatYear } from './format';
import { bin, binIndexOf, PRICE_BIN_PARAMS } from '../../engine/bin';

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
}

/** Bornes d'année / km observées (pour normaliser les rampes couleur). */
function ramps(points: readonly ScatterPoint[]) {
  let yearMin = Infinity;
  let yearMax = -Infinity;
  let kmMin = Infinity;
  let kmMax = -Infinity;
  for (const p of points) {
    if (p.year >= 0) {
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
  return { yearMin, yearMax, kmMin, kmMax };
}

export function ScatterCloud(props: ScatterCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const width = props.width ?? 900;
  const height = props.height ?? 480;
  const [zoom, setZoom] = useState(1);
  const [showData, setShowData] = useState(false);
  const dragRef = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [dragRect, setDragRect] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  const effectiveVariant: ScatterVariant = props.degraded ? 'scatter' : props.variant;
  const { yearMin, yearMax, kmMin, kmMax } = ramps(props.points);

  const vp: Viewport = useMemo(
    () => ({ width, height, padLeft: 52, padRight: props.degraded ? 16 : 168, padTop: 16, padBottom: 40 }),
    [width, height, props.degraded],
  );

  // Rangs d'empilement pour G4a (Y = effectif dans le bucket de prix, EX-SCR-151).
  const stackRankByRow = useMemo(() => {
    if (effectiveVariant !== 'stack') return undefined;
    const prices = props.points.map((p) => p.priceEur);
    const priceBins = bin(prices, PRICE_BIN_PARAMS);
    const rankByBin = new Map<number, number>();
    const map = new Map<number, number>();
    for (const p of props.points) {
      const bi = binIndexOf(p.priceEur, priceBins);
      const r = rankByBin.get(bi) ?? 0;
      map.set(p.row, r);
      rankByBin.set(bi, r + 1);
    }
    return map;
  }, [props.points, effectiveVariant]);

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
      x = q01q99(props.points.map((p) => p.priceEur));
      y = { lo: 0, hi: maxStack };
    } else {
      x = q01q99(props.points.map((p) => p.regYearMonth));
      y = q01q99(props.points.map((p) => p.priceEur));
    }
    const zx: AxisBounds = { lo: x.lo, hi: x.lo + (x.hi - x.lo) * zoom };
    const zy: AxisBounds = { lo: y.lo, hi: y.lo + (y.hi - y.lo) * zoom };
    return { xB: zx, yB: zy };
  }, [props.points, effectiveVariant, props.degraded, maxStack, zoom]);

  const selectedRows = useMemo(() => {
    if (props.brushX === null && props.brushY === null) return null;
    const accessor: BrushAccessor = props.degraded
      ? { x: (p) => p.mileageKm, y: (p) => p.priceEur }
      : effectiveVariant === 'stack'
        ? { x: (p) => p.priceEur, y: (p) => p.priceEur }
        : BRUSH_ACCESSOR_SCATTER;
    return computeBrushSelection(props.points, props.brushX, props.brushY, accessor);
  }, [props.points, props.brushX, props.brushY, effectiveVariant, props.degraded]);

  // Rendu Canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as unknown as Canvas2DLike | null;
    if (!ctx) return;
    const proj = makeProjector(vp, xB, yB);
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
    }, stackRankByRow);
  }, [props.points, effectiveVariant, props.degraded, vp, xB, yB, selectedRows, yearMin, yearMax, kmMin, kmMax, stackRankByRow]);

  // Brossage (souris) — désactivé en dégradé (EX-NFR-19).
  const onPointerDown = (e: MouseEvent): void => {
    if (props.degraded) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * vp.width;
    const y = ((e.clientY - rect.top) / rect.height) * vp.height;
    dragRef.current = { x0: x, y0: y, x1: x, y1: y };
    setDragRect(dragRef.current);
  };
  const onPointerMove = (e: MouseEvent): void => {
    if (dragRef.current === null) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current.x1 = ((e.clientX - rect.left) / rect.width) * vp.width;
    dragRef.current.y1 = ((e.clientY - rect.top) / rect.height) * vp.height;
    setDragRect({ ...dragRef.current });
  };
  const onPointerUp = (): void => {
    const d = dragRef.current;
    dragRef.current = null;
    setDragRect(null);
    if (d === null) return;
    if (Math.abs(d.x1 - d.x0) < 4 || Math.abs(d.y1 - d.y0) < 4) {
      props.onBrushChange(null, null); // clic simple → efface
      return;
    }
    const inv = makeInverseProjector(vp, xB, yB);
    const xa = inv.dataX(Math.min(d.x0, d.x1));
    const xb = inv.dataX(Math.max(d.x0, d.x1));
    const ya = inv.dataY(Math.max(d.y0, d.y1)); // y bas
    const yb = inv.dataY(Math.min(d.y0, d.y1)); // y haut
    props.onBrushChange({ from: xa, to: xb }, { from: ya, to: yb });
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') props.onBrushChange(null, null); // EX-SCR-158
  };

  const outlierPoints = props.points.filter((p) => p.isOutlier);
  const selectedCount = selectedRows?.size ?? 0;

  return (
    <figure class="kycar-graph kycar-scatter" data-graph="G4" role="group" aria-label="Nuage prix, année et kilométrage">
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
                disabled={yearMax === yearMin}
                title={yearMax === yearMin ? "Nécessite l'année de première immatriculation" : undefined}
                onClick={() => props.onVariantChange('scatter')}
              >
                Prix × année
              </button>
            </div>
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
          style={{ maxWidth: '100%', touchAction: 'none' }}
          tabIndex={0}
          role="img"
          aria-label={`Nuage de ${props.sampleInfo.plottedCount} points, ${outlierPoints.length} outliers`}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onKeyDown={onKeyDown}
        />
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

        {/* Légende (couleur + taille) */}
        {!props.degraded ? (
          <div class="kycar-scatter-legend" aria-hidden="true">
            <ColorLegend
              variant={effectiveVariant}
              yearMin={yearMin}
              yearMax={yearMax}
              kmMin={kmMin}
              kmMax={kmMax}
            />
          </div>
        ) : null}
      </div>

      {/* Mention d'échantillonnage (EX-DATA-103) */}
      {props.sampleInfo.sampled ? (
        <p class="kycar-scatter-samplenote">
          Échantillon : {props.sampleInfo.plottedCount} points tracés sur {props.sampleInfo.eligibleCount} éligibles (plafond {5000}).
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
            {props.points.slice(0, 500).map((p) => (
              <tr key={p.row}>
                <td>{formatPrice(p.priceEur)}</td>
                <td>{p.year >= 0 ? formatYear(p.year) : '—'}</td>
                <td>{formatKm(p.mileageKm)}</td>
                <td>{p.isOutlier ? 'oui' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {props.points.length > 500 ? <p>… {props.points.length - 500} points supplémentaires (export CSV pour la liste complète).</p> : null}
      </div>
    </figure>
  );
}

function ColorLegend(props: { variant: ScatterVariant; yearMin: number; yearMax: number; kmMin: number; kmMax: number }) {
  const isYear = props.variant === 'stack';
  const ramp = isYear ? RAMP_A_YEAR : RAMP_B_MILEAGE;
  const stops = [0, 0.25, 0.5, 0.75, 1];
  const lo = isYear ? props.yearMin : props.kmMin;
  const hi = isYear ? props.yearMax : props.kmMax;
  const fmt = isYear ? (v: number) => formatYear(v) : (v: number) => formatKm(v);
  return (
    <div class="kycar-legend">
      <span class="kycar-legend-title">{isYear ? 'Année' : 'Kilométrage'}</span>
      <span class="kycar-legend-ramp" style={{ display: 'inline-flex' }}>
        {stops.map((t) => (
          <span key={t} style={{ width: '18px', height: '10px', background: rampColor(ramp, t) }} />
        ))}
      </span>
      <span class="kycar-legend-range">
        {fmt(lo)} – {fmt(hi)}
      </span>
    </div>
  );
}
