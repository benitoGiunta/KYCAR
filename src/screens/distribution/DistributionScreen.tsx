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

import { useMemo, useState } from 'preact/hooks';
import type { ListingColumnBatch, SelectionInput } from '../../types/index';
import { MODEL_ID_UNRESOLVED } from '../../types/index';
import type { RecalcResult } from '../../engine/index';
import { decodeListingId } from '../../engine/uuid';
import { OutlierIndex, comparisonBaseLabel, methodLabel } from '../outlier-index';
import { buildListingRow } from '../listings/listing-fields';
import { exportListingsCsv, exportBucketsCsv, csvFileName, type CsvMeta, type CsvLabelResolvers } from '../listings/csv-export';
import { computeEligibility, buildScatterPoints, type OutlierLookup } from './scatter-model';
import { sampleScatter } from './scatter-sample';
import { Histogram } from './Histogram';
import { ScatterCloud } from './ScatterCloud';
import { bucketToIntervalFilters } from './histogram-model';
import {
  computeBrushSelection,
  brushAccessorFor,
  brushToIntervalFilters,
  intervalFiltersToSelectionInput,
  selectedCountsByBucket,
} from './brush-model';
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
  selectionCellStat,
  g8ModelCaption,
  g8RSquaredWarning,
} from './graphs-model';
import {
  effectiveG4Variant,
  toggleLogHistogram,
  type DistributionUiState,
  type G4Variant,
  type BrushRange,
} from './url-state';
import { formatPrice, formatKm, formatYear, formatPower, formatMonthYear } from './format';
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
  /** `EX-SCR-113bis` (D8-06/FV-08) — clé réservée `MODEL_ID_UNRESOLVED` (0) : mode « Modèle non
   * identifié ». Bandeau non refermable, `G5`/`G6`/`G8`/`G10`/`G14` hors DOM, `Comparer` désactivé. */
  readonly modelId?: number;
  /** Ouvre l'annonce d'origine (deeplink), fourni par D8. */
  readonly onOpenListing?: (row: number) => void;

  /** `ARB-09`/`EX-SCR-184` (DR-009, DR-079) — pose un correctif de filtres RÉELS sur la sélection Σ
   * (clic sur une barre d'histogramme, ou « Convertir la sélection en filtre »). Point d'intégration
   * D8/fix-app : lit les valeurs actuelles du bandeau de filtres, y fusionne `patch`, écrit la
   * nouvelle URL — voir le rapport de lot, § « Câblage attendu de fix-app ». */
  readonly onApplyFilters?: (patch: SelectionInput) => void;
  /** `EX-SCR-158`/`184`, `D-12`/`D-26` — « Voir ces annonces » : navigue vers l'écran D restreint à
   * la sélection brossée (`sel=<lo>-<hi>` sur le prix, restriction d'affichage, Σ INCHANGÉE). */
  readonly onViewBrushedListings?: (sel: { readonly from: number; readonly to: number }) => void;
  /** `EX-SCR-142` ligne 3 (DR-078) — « Voir les <n> annonces » : écran D SANS restriction. */
  readonly onViewListings?: () => void;
  /** `EX-SCR-142` ligne 3 (DR-078) — « Comparer » : écran C. */
  readonly onCompare?: () => void;
  /** `EX-SCR-142` ligne 3 / `EX-CRUD-10` (DR-078) — « Suivre » : CRUD écran F. */
  readonly onFollow?: (next: boolean) => void;
  readonly isFollowed?: boolean;
  /** Métadonnées d'en-tête des deux exports CSV auto-portés par cet écran (DR-078/`EX-CRUD-16`). */
  readonly csvMeta?: CsvMeta;
  /** `EX-NFR-19` (DR-081) — régime dégradé (< 768 px, prix × km, année en couleur, brossage off).
   * Absent : repli par `matchMedia` (voir `defaultDegradedFromViewport`, plus bas). */
  readonly degraded?: boolean;
}

function idLabel(code: number): string {
  return String(code);
}

/** `EX-NFR-19` (DR-081) — défaut de `degraded` quand l'hôte (D8, seul propriétaire du viewport) ne
 * le fournit pas encore : estimation par `matchMedia`, alignée sur le point de rupture normatif
 * (768 px). Un composant MONTABLE isolément reste ainsi utilisable sans hôte. */
function defaultDegradedFromViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(max-width: 767.98px)').matches;
}

export function DistributionScreen(props: DistributionScreenProps) {
  const { batch, recalc, ui } = props;
  const [exportOpen, setExportOpen] = useState(false);
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

  // Graphes additionnels — `D8-07` (dette D-17 levée) : G5/G6/G9/G10/G12/G13/G14/G15 sont lus DEPUIS
  // `RecalcResult` (source unique, calculée dans le worker), plus jamais recalculés ici depuis
  // `batch`/`rows`. Un champ absent (`recalc.groupStats` etc. non encore rempli par fix-engine) rend
  // l'état « indisponible » (`'unavailable'`) — voir `graphs-model.ts`. G7 (densité) et G8 (liste des
  // outliers, hors libellé R²) restent hors du protocole worker (aucun champ dédié, O17).
  const yearMedian = useMemo(() => buildYearMedian(recalc.groupStats), [recalc.groupStats]);
  const depreciation = useMemo(() => buildDepreciation(recalc.depreciationIndex), [recalc.depreciationIndex]);
  const density = useMemo(() => buildPriceMileageDensity(batch, rows), [batch, rows]);
  const lollipops = useMemo(() => buildOutlierLollipops(batch, rows, outlierIndex, 20), [batch, rows, outlierIndex]);
  const fuelBars = useMemo(() => buildCategoryBars(recalc.groupStats, 'fuelCategory'), [recalc.groupStats]);
  const sellerBars = useMemo(() => buildCategoryBars(recalc.groupStats, 'sellerType'), [recalc.groupStats]);
  const evalBars = useMemo(() => buildCategoryBars(recalc.groupStats, 'priceEvaluationCategory'), [recalc.groupStats]);
  const countryBars = useMemo(() => buildCategoryBars(recalc.groupStats, 'countryCode'), [recalc.groupStats]);
  const mileageBoxes = useMemo(() => buildMileageBoxes(recalc.ntiles, recalc.groupStats), [recalc.ntiles, recalc.groupStats]);
  const powerTiers = useMemo(() => buildPowerTiers(recalc.powerTiers), [recalc.powerTiers]);
  const selectionCell = useMemo(() => selectionCellStat(recalc.cellStats), [recalc.cellStats]);
  const g8Caption = useMemo(() => g8ModelCaption(selectionCell), [selectionCell]);
  const g8Warning = useMemo(() => g8RSquaredWarning(selectionCell), [selectionCell]);

  // `EX-SCR-113bis` (D8-06/FV-08) — mode « Modèle non identifié ».
  const isUnresolvedModel = props.modelId === MODEL_ID_UNRESOLVED;

  const variant: G4Variant = effectiveG4Variant(ui, selectionCount);
  const labels = props.labels ?? {};
  const degraded = props.degraded ?? defaultDegradedFromViewport();

  const onToggleLog = (n: number): void => props.onUiChange(toggleLogHistogram(ui, n));
  const onBrushChange = (brushX: BrushRange | null, brushY: BrushRange | null): void =>
    props.onUiChange({ ...ui, brushX, brushY });
  const onVariantChange = (v: G4Variant): void => props.onUiChange({ ...ui, g4Variant: v });

  const price = stats.price;

  // `EX-SCR-142` ligne 2 (DR-077) — part de particuliers, calculée depuis le batch (aucune donnée
  // équivalente sur `SelectionStats`, hors périmètre fix-screens de l'étendre) : le libellé exact
  // « Particulier » de l'écran D (`EX-SCR-203`) sert de pivot, résolu par le même `labels.sellerType`
  // que le graphe G13 — sans ce résolveur, la part reste indisponible plutôt que fausse.
  const particulier = useMemo(() => {
    if (!labels.sellerType) return null;
    let particulierN = 0;
    let knownN = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as number;
      const code = batch.sellerType[row] as number;
      if (code === 255) continue; // ENUM_UNKNOWN_BYTE (EX-DATA-120)
      knownN++;
      if (labels.sellerType(code) === 'Particulier') particulierN++;
    }
    return knownN > 0 ? { pct: (particulierN / knownN) * 100, n: knownN } : null;
  }, [batch, rows, labels]);

  // `EX-SCR-184` (DR-080) — sélection brossée EN LIGNES (mêmes règles que `ScatterCloud`, via
  // `brushAccessorFor`), pour la liaison croisée sur G1–G3 et les actions de la sélection (DR-079).
  const selectedRows = useMemo(() => {
    if (ui.brushX === null && ui.brushY === null) return null;
    const accessor = brushAccessorFor(variant, degraded);
    return computeBrushSelection(scatter.points, ui.brushX, ui.brushY, accessor);
  }, [scatter.points, ui.brushX, ui.brushY, variant, degraded]);

  const priceSelectedCounts = useMemo(
    () => (selectedRows ? selectedCountsByBucket(scatter.points, selectedRows, recalc.priceHistogram, (p) => p.priceEur) : undefined),
    [scatter.points, selectedRows, recalc.priceHistogram],
  );
  const mileageSelectedCounts = useMemo(
    () => (selectedRows ? selectedCountsByBucket(scatter.points, selectedRows, recalc.mileageHistogram, (p) => p.mileageKm) : undefined),
    [scatter.points, selectedRows, recalc.mileageHistogram],
  );
  const yearSelectedCounts = useMemo(
    () => (selectedRows ? selectedCountsByBucket(scatter.points, selectedRows, recalc.yearHistogram, (p) => p.year) : undefined),
    [scatter.points, selectedRows, recalc.yearHistogram],
  );

  // `ARB-09`/`EX-SCR-149` (DR-009) — clic sur une barre : pose l'intervalle correspondant.
  const onSelectBucket = (metric: 'price' | 'year' | 'mileage') => (bucket: Parameters<typeof bucketToIntervalFilters>[0]): void => {
    props.onApplyFilters?.(bucketToIntervalFilters(bucket, metric));
  };

  // `EX-SCR-158`/`184` (DR-079) — actions de la sélection brossée.
  const brushInterval = selectedRows ? brushToIntervalFilters(scatter.points, selectedRows) : null;
  const onConvertBrushToFilter = (): void => {
    if (!brushInterval) return;
    props.onApplyFilters?.(intervalFiltersToSelectionInput(brushInterval));
    props.onUiChange({ ...ui, brushX: null, brushY: null }); // `sel`/`selx`/`sely` retirés (D-26)
  };
  const onViewBrushedListings = (): void => {
    if (!brushInterval) return;
    props.onViewBrushedListings?.({ from: brushInterval.priceFrom, to: brushInterval.priceTo });
  };

  // `EX-SCR-158` (DR-084) — infobulle de survol du nuage, 6 lignes, CONTENU TEXTUEL (`ARB-62`).
  const resolveTooltip = (row: number): readonly string[] => {
    const r = buildListingRow(batch, row, outlierIndex);
    const evalLabel = r.priceEvaluationCategory != null ? labels.evaluation?.(r.priceEvaluationCategory) : undefined;
    const comparisonLine =
      r.outlierMethod != null
        ? `${comparisonBaseLabel({ cellLabel: r.cellLabel, cellCount: r.cellCount }, { makeModel: props.makeModelName, year: r.regYear ?? undefined })} · ${methodLabel(r.outlierMethod)}`
        : 'écart calculé sur : sélection courante';
    const lines = [
      r.modelVersion.slice(0, 40),
      r.priceEur != null ? formatPrice(r.priceEur) : '—',
      r.mileageKm != null ? formatKm(r.mileageKm) : '—',
      r.regYearMonth != null ? `1ʳᵉ immat. ${formatMonthYear(r.regYearMonth)}` : '1ʳᵉ immat. inconnue',
      r.powerKw != null ? formatPower(r.powerKw) : '—',
    ];
    if (evalLabel) lines.push(evalLabel);
    lines.push(comparisonLine);
    return lines;
  };

  // `EX-CRUD-16` (DR-078) — les deux exports CSV, auto-portés par l'écran B (mêmes fonctions que
  // l'écran D). `csvMeta` par défaut : repli explicite, jamais une valeur inventée.
  const csvMeta: CsvMeta = props.csvMeta ?? {
    snapshotId: 'INCONNU',
    capturedAt: '',
    sourceKind: 'INCONNU',
    filterQuery: '',
    sampleCoverage: 'NON_APPLICABLE',
    metricCoverage: '',
  };
  const csvLabels: CsvLabelResolvers = { fuel: labels.fuel, sellerType: labels.sellerType, country: labels.country };
  const download = (content: string, name: string): void => {
    if (typeof document === 'undefined') return;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };
  const onExportListingsCsv = (): void => {
    const listingRows = Array.from(rows, (row) => buildListingRow(batch, row, outlierIndex));
    download(exportListingsCsv(listingRows, csvMeta, csvLabels), csvFileName(props.makeModelName ?? 'annonces', csvMeta.snapshotId, new Date()));
  };
  const onExportBucketsCsv = (): void => {
    const buckets = [
      { metric: 'price' as const, buckets: recalc.priceHistogram },
      { metric: 'mileage' as const, buckets: recalc.mileageHistogram },
      { metric: 'year' as const, buckets: recalc.yearHistogram },
    ];
    download(exportBucketsCsv(buckets, csvMeta), csvFileName(`${props.makeModelName ?? 'agregats'}-agregats`, csvMeta.snapshotId, new Date()));
  };

  return (
    <div class="kycar-screen-b">
      {/* Bloc 1 — en-tête statistique (EX-SCR-142) */}
      <header class="kycar-stat-header">
        <div class="kycar-stat-line">
          <strong>{props.makeModelName ?? 'Modèle'}</strong>
          <span title={`n = ${selectionCount}`}>{selectionCount} offres</span>
          <span title={`n = ${price.n}`}>médiane {price.p50 != null ? formatPrice(price.p50) : '—'}</span>
          <span title={`n = ${price.n}`}>P25 {price.p25 != null ? formatPrice(price.p25) : '—'}</span>
          <span title={`n = ${price.n}`}>P75 {price.p75 != null ? formatPrice(price.p75) : '—'}</span>
          <span title={`n = ${price.n}`}>
            min {price.min != null ? formatPrice(price.min) : '—'} – max {price.max != null ? formatPrice(price.max) : '—'}
            <span class="kycar-stat-sublabel"> (du moins cher au plus cher)</span>
          </span>
        </div>
        <div class="kycar-stat-line">
          <span title={`n = ${stats.mileage.n}`}>km médian {stats.mileage.p50 != null ? formatKm(stats.mileage.p50) : '—'}</span>
          <span title={`n = ${stats.year.n}`}>1ʳᵉ immat. médiane {stats.year.p50 != null ? formatYear(stats.year.p50) : '—'}</span>
          <span title={particulier ? `n = ${particulier.n}` : undefined}>
            {particulier ? `${particulier.pct.toFixed(0)} % particuliers` : '— % particuliers'}
          </span>
        </div>
        <div class="kycar-stat-line kycar-stat-actions">
          <button type="button" onClick={props.onViewListings}>
            Voir les {selectionCount} annonces
          </button>
          <button
            type="button"
            onClick={props.onCompare}
            disabled={isUnresolvedModel}
            title={isUnresolvedModel ? 'un modèle non identifié ne peut pas être comparé' : undefined}
          >
            Comparer
          </button>
          <button type="button" onClick={() => props.onFollow?.(!props.isFollowed)} aria-pressed={props.isFollowed ?? false}>
            {props.isFollowed ? 'Suivi ✓' : 'Suivre'}
          </button>
          <span class="kycar-stat-export">
            <button type="button" aria-expanded={exportOpen} onClick={() => setExportOpen((v) => !v)}>
              Exporter
            </button>
            {exportOpen ? (
              <span class="kycar-stat-export-menu">
                <button type="button" onClick={onExportListingsCsv}>
                  Annonces du périmètre (CSV)
                </button>
                <button type="button" onClick={onExportBucketsCsv}>
                  Agrégats affichés (CSV)
                </button>
              </span>
            ) : null}
          </span>
        </div>
      </header>

      {/* `EX-SCR-113bis` (D8-06/FV-08) — bandeau NON refermable du mode « Modèle non identifié ». */}
      {isUnresolvedModel ? (
        <div class="kycar-banner kycar-banner--ambre" role="status">
          Ces annonces n’ont pas pu être rattachées à un modèle du référentiel — les distributions
          par modèle ne s’appliquent pas
        </div>
      ) : null}

      {/* Bloc 2 — histogrammes G1–G3 */}
      <section class="kycar-hist-row" aria-label="Distributions">
        <Histogram graphId="G1" title="Offres par prix" metric="price" buckets={recalc.priceHistogram} log={ui.logHistograms.has(1)} onToggleLog={() => onToggleLog(1)} headerCount={selectionCount} exclusions={[{ count: stats.priceOnRequestCount, reason: 'prix sur demande' }, { count: stats.priceMissingCount, reason: 'prix absent' }]} onSelectBucket={onSelectBucket('price')} selectedCounts={priceSelectedCounts} />
        <Histogram graphId="G2" title="Offres par kilométrage" metric="mileage" buckets={recalc.mileageHistogram} log={ui.logHistograms.has(2)} onToggleLog={() => onToggleLog(2)} headerCount={selectionCount} exclusions={[{ count: selectionCount - stats.mileage.n, reason: 'kilométrage non renseigné' }]} onSelectBucket={onSelectBucket('mileage')} selectedCounts={mileageSelectedCounts} />
        <Histogram graphId="G3" title="Offres par année" metric="year" buckets={recalc.yearHistogram} log={ui.logHistograms.has(3)} onToggleLog={() => onToggleLog(3)} headerCount={selectionCount} exclusions={[{ count: selectionCount - stats.year.n, reason: 'année non renseignée' }]} onSelectBucket={onSelectBucket('year')} selectedCounts={yearSelectedCounts} />
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
          degraded={degraded}
          resolveTooltip={resolveTooltip}
          onOpenListing={props.onOpenListing}
        />
        {selectedRows && selectedRows.size > 0 ? (
          <div class="kycar-scatter-selection-actions">
            <button type="button" onClick={onConvertBrushToFilter}>
              Convertir la sélection en filtre
            </button>
            <button type="button" onClick={onViewBrushedListings}>
              Voir ces annonces
            </button>
          </div>
        ) : null}
      </section>

      {/* Bloc 4 — graphes additionnels (ordre EX-SCR-144). `EX-SCR-113bis` (D8-06/FV-08) : en mode
          « Modèle non identifié », G5/G6/G8/G10/G14 sont hors DOM (jamais seulement masqués en CSS —
          C₁/C₂ de la détection d'outlier exigent un `modelId` résolu, EX-SCR-113bis). */}
      <section class="kycar-graph-grid" aria-label="Graphes additionnels">
        {!isUnresolvedModel ? <YearMedianChart points={yearMedian} /> : null}
        {!isUnresolvedModel ? <DepreciationChart model={depreciation} /> : null}
        <DensityHeatmap density={density} />
        {!isUnresolvedModel ? (
          <OutlierLollipopChart
            items={lollipops}
            perimeter={{ makeModel: props.makeModelName }}
            onOpen={props.onOpenListing}
            modelCaption={g8Caption}
            rSquaredWarning={g8Warning}
          />
        ) : null}
        <CategoricalBars graphId="G9" title="Répartition par carburant" bars={fuelBars} label={labels.fuel ?? idLabel} />
        {!isUnresolvedModel ? <MileageBoxes boxes={mileageBoxes} /> : null}
        <CategoricalBars graphId="G12" title="Évaluation de prix AutoScout24" bars={evalBars} label={labels.evaluation ?? idLabel} note="Évaluation calculée par AutoScout24, méthode non publiée." />
        <CategoricalBars graphId="G13" title="Type de vendeur" bars={sellerBars} label={labels.sellerType ?? idLabel} />
        {!isUnresolvedModel ? <PowerTiers tiers={powerTiers} /> : null}
        <CategoricalBars graphId="G15" title="Répartition par pays" bars={countryBars} label={labels.country ?? idLabel} />
        {/* A-08 (DR-147, DETTE consignée) : CO₂, consommation et boîte de vitesses sont écartés de
            cette grille — voir `reports/remediation/fix-screens.md` §6.5. Mention volontairement
            absente ici : le fix-lead a retenu la dette « muette » pour ce MINEUR, pas un correctif. */}
      </section>
    </div>
  );
}
