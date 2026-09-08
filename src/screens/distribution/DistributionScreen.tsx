/**
 * KYCAR — Écran B « Distribution d'un modèle » (lot D7, EX-SCR-139..192)
 * =================================================================================================
 * Composant MONTABLE (le routage global est câblé par D8, EX-SCR-139/140). Quatre blocs (EX-SCR-141) :
 *   (1) en-tête statistique (EX-SCR-142) ; (2) les trois histogrammes imposés G1–G3 ;
 *   (3) le nuage G4 pleine largeur ; (4) la grille des graphes additionnels G5–G15 (ordre EX-SCR-144).
 *
 * Consomme le moteur D4 (`RecalcResult`) pour les chiffres/histogrammes/densité/outliers, et le
 * `ListingColumnBatch` élagué (mode 2) pour les points du nuage et les GROUPSTAT additionnels (O17 :
 * écran de mode 2 toujours élagué → calcul main-thread trivial).
 *
 * DETTE SIGNALÉE : la surimpression de liaison croisée SUR LES HISTOGRAMMES et barres (EX-SCR-184,
 * part sélectionnée) n'est pas peinte ici — la sélection brossée est calculée et pilote la mise en
 * évidence du nuage (points non sélectionnés à 15 %) et le compteur ; l'overlay des autres graphes
 * est un point d'intégration D8 (le modèle expose déjà `selectedRows`). Idem `ET-*` d'écran (D8).
 */

import { useMemo } from 'preact/hooks';
import type { ListingColumnBatch } from '../../types/index';
import type { RecalcResult } from '../../engine/index';
import { decodeListingId } from '../../engine/uuid';
import { OutlierIndex } from '../outlier-index';
import { computeEligibility, buildScatterPoints, type OutlierLookup } from './scatter-model';
import { sampleScatter } from './scatter-sample';
import { Histogram } from './Histogram';
import { ScatterCloud } from './ScatterCloud';
import {
  YearMedianChart,
  DepreciationChart,
  DensityHeatmap,
  OutlierLollipopChart,
  CategoricalBars,
  MileageBoxes,
  PowerTiers,
  type LabelResolver,
} from './AdditionalGraphs';
import {
  buildYearMedian,
  buildDepreciation,
  buildPriceMileageDensity,
  buildOutlierLollipops,
  buildCategoryBars,
  buildMileageBoxes,
  buildPowerTiers,
} from './graphs-model';
import {
  effectiveG4Variant,
  toggleLogHistogram,
  type DistributionUiState,
  type G4Variant,
  type BrushRange,
} from './url-state';
import { formatPrice, formatKm, formatYear } from './format';
import './distribution.css';

/** Résolveurs de libellés (fournis par D8/ReferenceData) — défaut = code brut. */
export interface DistributionLabels {
  readonly fuel?: LabelResolver;
  readonly sellerType?: LabelResolver;
  readonly evaluation?: LabelResolver;
  readonly country?: LabelResolver;
}

export interface DistributionScreenProps {
  readonly batch: ListingColumnBatch;
  readonly recalc: RecalcResult;
  /**
   * Lignes de la sélection courante Σ (indices dans `batch`). Fournies par D8 (qui détient le moteur
   * et le scan). Défaut : toutes les lignes du batch (batch déjà élagué au modèle).
   */
  readonly rows?: Int32Array;
  readonly ui: DistributionUiState;
  readonly onUiChange: (next: DistributionUiState) => void;
  readonly labels?: DistributionLabels;
  /** Nom « Marque Modèle » pour l'en-tête et l'étiquetage EX-SCR-158bis. */
  readonly makeModelName?: string;
  /** Ouvre l'annonce d'origine (deeplink), fourni par D8. */
  readonly onOpenListing?: (row: number) => void;
}

function idLabel(code: number): string {
  return String(code);
}

export function DistributionScreen(props: DistributionScreenProps) {
  const { batch, recalc, ui } = props;
  const rows = useMemo(
    () => props.rows ?? Int32Array.from({ length: batch.rowCount }, (_v, i) => i),
    [props.rows, batch.rowCount],
  );
  const stats = recalc.selectionStats;
  const selectionCount = stats.selectionCount;

  const outlierIndex = useMemo(() => new OutlierIndex(recalc.outlierVerdicts), [recalc.outlierVerdicts]);

  const outlierLookup: OutlierLookup = useMemo(
    () => ({
      isOutlier: (row) => outlierIndex.has(decodeListingId(batch.listingId, row)),
      opportunityScore: (row) => outlierIndex.scoreOf(decodeListingId(batch.listingId, row)),
    }),
    [outlierIndex, batch.listingId],
  );

  // Nuage G4 : éligibilité → échantillonnage → points.
  const scatter = useMemo(() => {
    const elig = computeEligibility(batch, rows);
    const sample = sampleScatter({
      eligible: elig.eligible,
      listingId: batch.listingId,
      isOutlier: outlierLookup.isOutlier,
      opportunityScore: outlierLookup.opportunityScore,
    });
    const points = buildScatterPoints(batch, sample.rows, outlierLookup);
    return { elig, sample, points };
  }, [batch, rows, outlierLookup]);

  // Graphes additionnels.
  const yearMedian = useMemo(() => buildYearMedian(batch, rows), [batch, rows]);
  const depreciation = useMemo(() => buildDepreciation(yearMedian), [yearMedian]);
  const density = useMemo(() => buildPriceMileageDensity(batch, rows), [batch, rows]);
  const lollipops = useMemo(() => buildOutlierLollipops(batch, rows, outlierIndex, 20), [batch, rows, outlierIndex]);
  const fuelBars = useMemo(() => buildCategoryBars(batch, rows, 'fuelCategory'), [batch, rows]);
  const sellerBars = useMemo(() => buildCategoryBars(batch, rows, 'sellerType'), [batch, rows]);
  const evalBars = useMemo(() => buildCategoryBars(batch, rows, 'priceEvaluationCategory'), [batch, rows]);
  const countryBars = useMemo(() => buildCategoryBars(batch, rows, 'countryCode'), [batch, rows]);
  const mileageBoxes = useMemo(() => buildMileageBoxes(batch, rows), [batch, rows]);
  const powerTiers = useMemo(() => buildPowerTiers(batch, rows), [batch, rows]);

  const variant: G4Variant = effectiveG4Variant(ui, selectionCount);
  const labels = props.labels ?? {};

  const onToggleLog = (n: number): void => props.onUiChange(toggleLogHistogram(ui, n));
  const onBrushChange = (brushX: BrushRange | null, brushY: BrushRange | null): void =>
    props.onUiChange({ ...ui, brushX, brushY });
  const onVariantChange = (v: G4Variant): void => props.onUiChange({ ...ui, g4Variant: v });

  const price = stats.price;

  return (
    <div class="kycar-screen-b">
      {/* Bloc 1 — en-tête statistique (EX-SCR-142) */}
      <header class="kycar-stat-header">
        <div class="kycar-stat-line">
          <strong>{props.makeModelName ?? 'Modèle'}</strong>
          <span>{selectionCount} offres</span>
          <span>médiane {price.p50 != null ? formatPrice(price.p50) : '—'}</span>
          <span>P25 {price.p25 != null ? formatPrice(price.p25) : '—'}</span>
          <span>P75 {price.p75 != null ? formatPrice(price.p75) : '—'}</span>
          <span title="du moins cher au plus cher">
            {price.min != null ? formatPrice(price.min) : '—'} – {price.max != null ? formatPrice(price.max) : '—'}
          </span>
        </div>
        <div class="kycar-stat-line">
          <span>km médian {stats.mileage.p50 != null ? formatKm(stats.mileage.p50) : '—'}</span>
          <span>1ʳᵉ immat. médiane {stats.year.p50 != null ? formatYear(stats.year.p50) : '—'}</span>
        </div>
      </header>

      {/* Bloc 2 — histogrammes G1–G3 */}
      <section class="kycar-hist-row" aria-label="Distributions">
        <Histogram graphId="G1" title="Offres par prix" metric="price" buckets={recalc.priceHistogram} log={ui.logHistograms.has(1)} onToggleLog={() => onToggleLog(1)} headerCount={selectionCount} exclusions={[{ count: stats.priceOnRequestCount, reason: 'prix sur demande' }, { count: stats.priceMissingCount, reason: 'prix absent' }]} />
        <Histogram graphId="G2" title="Offres par kilométrage" metric="mileage" buckets={recalc.mileageHistogram} log={ui.logHistograms.has(2)} onToggleLog={() => onToggleLog(2)} headerCount={selectionCount} />
        <Histogram graphId="G3" title="Offres par année" metric="year" buckets={recalc.yearHistogram} log={ui.logHistograms.has(3)} onToggleLog={() => onToggleLog(3)} headerCount={selectionCount} />
      </section>

      {/* Bloc 3 — nuage G4 */}
      <section class="kycar-scatter-row" aria-label="Nuage prix, année, kilométrage">
        <ScatterCloud
          points={scatter.points}
          variant={variant}
          onVariantChange={onVariantChange}
          sampleInfo={scatter.sample}
          brushX={ui.brushX}
          brushY={ui.brushY}
          onBrushChange={onBrushChange}
        />
      </section>

      {/* Bloc 4 — graphes additionnels (ordre EX-SCR-144) */}
      <section class="kycar-graph-grid" aria-label="Graphes additionnels">
        <YearMedianChart points={yearMedian} />
        <DepreciationChart model={depreciation} />
        <DensityHeatmap density={density} />
        <OutlierLollipopChart items={lollipops} perimeter={{ makeModel: props.makeModelName }} onOpen={props.onOpenListing} />
        <CategoricalBars graphId="G9" title="Répartition par carburant" bars={fuelBars} label={labels.fuel ?? idLabel} />
        <MileageBoxes tiles={mileageBoxes.tiles} />
        <CategoricalBars graphId="G12" title="Évaluation de prix AutoScout24" bars={evalBars} label={labels.evaluation ?? idLabel} note="Évaluation calculée par AutoScout24, méthode non publiée." />
        <CategoricalBars graphId="G13" title="Type de vendeur" bars={sellerBars} label={labels.sellerType ?? idLabel} />
        <PowerTiers tiers={powerTiers} />
        <CategoricalBars graphId="G15" title="Répartition par pays" bars={countryBars} label={labels.country ?? idLabel} />
      </section>
    </div>
  );
}
