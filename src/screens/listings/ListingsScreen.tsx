/**
 * KYCAR — Écran D « Annonces du modèle » (lot D7, EX-SCR-201..210, EX-CRUD-16)
 * =================================================================================================
 * Composant MONTABLE (routage global câblé par D8). Table dense, tri mono-colonne (EX-SCR-206),
 * pagination client de 50 lignes (mandat lot ; cf. divergence EX-SCR-208 signalée dans
 * `listings-model.ts`), étiquetage de la base de comparaison (EX-SCR-202/158bis), liseré P10 des
 * écarts (EX-SCR-207), export CSV du périmètre et des agrégats SANS champ vendeur R3 (EX-CRUD-16).
 *
 * Colonnes interdites (EX-SCR-204) : aucune colonne vendeur nominatif, aucune image — garanti par le
 * batch colonnaire (aucune colonne R3) et vérifié par le garde `assertNoR3Columns` à l'export.
 */

import { useMemo, useState } from 'preact/hooks';
import type { ListingColumnBatch } from '../../types/index';
import type { RecalcResult } from '../../engine/index';
import { quantileFromSorted } from '../../engine/quantiles';
import { OutlierIndex, comparisonBaseLabel, methodLabel } from '../outlier-index';
import { buildListingRow, type ListingRow } from './listing-fields';
import { sortListings, paginate, allOpportunityNull, type SortColumn, type SortState } from './listings-model';
import {
  exportListingsCsv,
  exportBucketsCsv,
  csvFileName,
  type CsvMeta,
  type CsvLabelResolvers,
} from './csv-export';
import {
  formatPrice,
  formatKm,
  formatSignedPct,
  formatMonthYear,
  formatPower,
  formatYear,
  formatConsumption,
  formatCo2,
} from '../distribution/format';
import './listings.css';

/** Résolveurs de libellés de l'écran D (surensemble des résolveurs d'export). */
export type ListingsLabels = CsvLabelResolvers & { readonly evaluation?: (code: number) => string };

export interface ListingsScreenProps {
  readonly batch: ListingColumnBatch;
  readonly recalc: RecalcResult;
  /** Lignes du périmètre à lister (indices dans `batch`). Défaut : toutes les lignes du batch. */
  readonly rows?: Int32Array;
  /** Effectif N de la sélection Σ (dénominateur de l'étiquetage EX-SCR-202). Défaut : rows.length. */
  readonly selectionCount?: number;
  readonly makeModelName?: string;
  readonly labels?: ListingsLabels;
  readonly csvMeta: CsvMeta;
  readonly onOpenListing?: (row: number) => void;

  /** `EX-NAV-10bis` (D-12, DR-066) — pagination CONTRÔLÉE depuis l'URL (1-based) : fournie par
   * l'hôte via `src/state`/`url-state.ts::readListingsPage` (contrat provisoire, voir le rapport de
   * lot). Absente : l'écran garde un `useState` interne (comportement inchangé, usage autonome). */
  readonly page?: number;
  readonly onPageChange?: (page: number) => void;
  /** `EX-SCR-202` (D-12, DR-067) — restriction d'AFFICHAGE (paramètre `sel`, bornes de prix,
   * `url-state.ts::readListingsSel`) : ne filtre que les LIGNES MONTRÉES, Σ (`selectionCount`) reste
   * celui de la sélection entière. `null`/absent : aucune restriction. */
  readonly sel?: { readonly from: number; readonly to: number } | null;
}

export function ListingsScreen(props: ListingsScreenProps) {
  const { batch, recalc } = props;
  const rows = useMemo(
    () => props.rows ?? Int32Array.from({ length: batch.rowCount }, (_v, i) => i),
    [props.rows, batch.rowCount],
  );
  const [sort, setSort] = useState<SortState | undefined>(undefined);
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  // `page` est 1-based côté URL (D-12), `pageIndex` reste 0-based en interne (`listings-model.ts`).
  const pageIndex = props.page !== undefined ? Math.max(0, props.page - 1) : internalPageIndex;
  const setPageIndex = (updater: (prev: number) => number): void => {
    const next = updater(pageIndex);
    if (props.onPageChange) props.onPageChange(next + 1);
    else setInternalPageIndex(next);
  };

  const index = useMemo(() => new OutlierIndex(recalc.outlierVerdicts), [recalc.outlierVerdicts]);
  const listingRows = useMemo(() => {
    const out: ListingRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as number;
      // `EX-SCR-202` (DR-067) — `sel` restreint l'AFFICHAGE (pas Σ) : les bornes portent sur le
      // prix, l'axe commun aux deux projections du nuage (cf. `url-state.ts::readListingsSel`).
      if (props.sel) {
        const p = batch.priceEur[row] as number;
        if (p < props.sel.from || p > props.sel.to) continue;
      }
      out.push(buildListingRow(batch, row, index));
    }
    return out;
  }, [batch, rows, index, props.sel]);

  // P10 des écarts (EX-SCR-207), calculé sur tout le périmètre, en pourcentage.
  const p10 = useMemo(() => {
    const devs = listingRows.map((r) => r.deviationPct).filter((d): d is number => d != null);
    if (devs.length === 0) return null;
    return quantileFromSorted(Float64Array.from(devs).sort(), 0.1);
  }, [listingRows]);

  const sorted = useMemo(() => sortListings(listingRows, batch, sort), [listingRows, batch, sort]);
  const page = useMemo(() => paginate(sorted, pageIndex), [sorted, pageIndex]);

  const totalN = props.selectionCount ?? rows.length;
  const defaultSortLabel = allOpportunityNull(listingRows)
    ? 'prix croissant (aucun score d’opportunité)'
    : 'score d’opportunité décroissant';

  const onSort = (col: SortColumn): void => {
    setPageIndex(() => 0);
    setSort((prev) =>
      prev && prev.column === col
        ? { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column: col, direction: col === 'deviation' || col === 'price' || col === 'mileage' ? 'asc' : 'asc' },
    );
  };

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
  const onExportListings = (): void => {
    const csv = exportListingsCsv(sorted, props.csvMeta, props.labels ?? {});
    download(csv, csvFileName(props.makeModelName ?? 'annonces', props.csvMeta.snapshotId, new Date()));
  };
  const onExportBuckets = (): void => {
    const csv = exportBucketsCsv(
      [
        { metric: 'price', buckets: recalc.priceHistogram },
        { metric: 'mileage', buckets: recalc.mileageHistogram },
        { metric: 'year', buckets: recalc.yearHistogram },
      ],
      props.csvMeta,
    );
    download(csv, csvFileName(`${props.makeModelName ?? 'agregats'}-agregats`, props.csvMeta.snapshotId, new Date()));
  };

  const label = (resolver: ((c: number) => string) | undefined, code: number | null): string =>
    code == null ? '' : (resolver?.(code) ?? String(code));

  return (
    <div class="kycar-screen-d">
      <header class="kycar-listings-head">
        <h2>Annonces — {props.makeModelName ?? 'Modèle'}</h2>
        <p class="kycar-listings-scope">
          {page.totalRows} lignes affichées sur {totalN} de la sélection — écarts calculés sur les {totalN}
        </p>
        <p class="kycar-listings-sort">Tri : {sort ? `${sort.column} ${sort.direction}` : defaultSortLabel}</p>
        <div class="kycar-listings-export">
          <button type="button" onClick={onExportListings}>CSV des annonces du périmètre</button>
          <button type="button" onClick={onExportBuckets}>CSV des agrégats affichés</button>
        </div>
      </header>

      <div class="kycar-table-scroll">
        <table class="kycar-listings-table">
          <thead>
            <tr>
              <th scope="col">Version</th>
              <SortableTh label="Prix" col="price" sort={sort} onSort={onSort} />
              <SortableTh label="Écart attendu" col="deviation" sort={sort} onSort={onSort} />
              <SortableTh label="Km" col="mileage" sort={sort} onSort={onSort} />
              <SortableTh label="1ʳᵉ immat." col="firstReg" sort={sort} onSort={onSort} />
              <SortableTh label="Année-mod." col="modelYear" sort={sort} onSort={onSort} />
              <SortableTh label="Puissance" col="power" sort={sort} onSort={onSort} />
              <SortableTh label="Carburant" col="fuel" sort={sort} onSort={onSort} />
              <SortableTh label="Conso." col="consumption" sort={sort} onSort={onSort} />
              <SortableTh label="CO₂" col="co2" sort={sort} onSort={onSort} />
              <SortableTh label="Propr." col="owners" sort={sort} onSort={onSort} />
              <SortableTh label="Éval. AS24" col="evaluation" sort={sort} onSort={onSort} />
              <SortableTh label="Vendeur" col="seller" sort={sort} onSort={onSort} />
              <SortableTh label="Pays" col="country" sort={sort} onSort={onSort} />
              {/* `TVA` (EX-SCR-203, `prices.public.taxDeductible`, D8-08) : colonne tri-état triable,
                  `ListingColumnBatch.vatDeductible` amendée à l'étape 0 de la phase 2.8. */}
              <SortableTh label="TVA" col="vat" sort={sort} onSort={onSort} />
              <th scope="col">Lien</th>
            </tr>
          </thead>
          <tbody>
            {page.rows.map((r) => {
              const highlighted = p10 != null && r.deviationPct != null && r.deviationPct < p10;
              const baseLabel =
                r.outlierMethod != null
                  ? `${comparisonBaseLabel({ cellLabel: r.cellLabel, cellCount: r.cellCount }, { makeModel: props.makeModelName, year: r.regYear ?? undefined })} · ${methodLabel(r.outlierMethod)}`
                  : undefined;
              return (
                <tr key={r.listingId} class={highlighted ? 'kycar-row-highlight' : undefined} title={highlighted ? baseLabel : undefined}>
                  <td>
                    {/* EX-DATA-15/EX-SCR-203 (DR-150) : jeton du drapeau d'ingestion
                        DUPLICATE_VALUE_CONFLICT (`r.duplicateValueConflict`, dérivé par
                        `listing-fields.ts::buildListingRow` via `hasIngestFlag`), infobulle exacte
                        de l'annexe B. */}
                    {r.duplicateValueConflict ? (
                      <span
                        class="kycar-duplicate-conflict"
                        title="deux versions de cette annonce ont été reçues dans ce snapshot avec des valeurs différentes"
                      >
                        !
                      </span>
                    ) : null}
                    {r.modelVersion.slice(0, 40)}
                  </td>
                  <td>{r.priceEur != null ? formatPrice(r.priceEur) : ''}</td>
                  <td title={baseLabel}>{r.deviationPct != null ? formatSignedPct(r.deviationPct) : ''}</td>
                  <td>{r.mileageKm != null ? formatKm(r.mileageKm) : ''}</td>
                  <td>{r.regYearMonth != null ? formatMonthYear(r.regYearMonth) : ''}</td>
                  <td>{r.modelYear != null ? `mod. ${formatYear(r.modelYear)}` : ''}</td>
                  <td>{r.powerKw != null ? formatPower(r.powerKw) : ''}</td>
                  <td>{label(props.labels?.fuel, r.fuelCategory)}</td>
                  <td>{r.consumptionX10 != null ? formatConsumption(r.consumptionX10) : ''}</td>
                  <td>{r.co2X10 != null ? formatCo2(r.co2X10) : ''}</td>
                  <td>{r.previousOwnerCount ?? ''}</td>
                  <td>{label(props.labels?.evaluation, r.priceEvaluationCategory)}</td>
                  <td>{label(props.labels?.sellerType, r.sellerType)}</td>
                  <td>{label(props.labels?.country, r.countryCode)}</td>
                  <td>{r.vatDeductible === true ? 'TVA déd.' : ''}</td>
                  <td>
                    {r.url ? (
                      <button type="button" class="kycar-open" onClick={() => props.onOpenListing?.(r.row)} aria-label="Ouvrir l'annonce d'origine">
                        Ouvrir ↗
                      </button>
                    ) : (
                      ''
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer class="kycar-listings-foot">
        <span>{page.totalRows} annonces</span>
        <div class="kycar-pager">
          <button type="button" disabled={page.pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}>
            Précédent
          </button>
          <span>
            page {page.pageIndex + 1} / {page.pageCount}
          </span>
          <button type="button" disabled={page.pageIndex >= page.pageCount - 1} onClick={() => setPageIndex((p) => p + 1)}>
            Suivant
          </button>
        </div>
      </footer>
    </div>
  );
}

function SortableTh({
  label,
  col,
  sort,
  onSort,
}: {
  label: string;
  col: SortColumn;
  sort: SortState | undefined;
  onSort: (c: SortColumn) => void;
}) {
  const active = sort?.column === col;
  const chevron = active ? (sort!.direction === 'asc' ? ' ▲' : ' ▼') : '';
  return (
    <th scope="col" aria-sort={active ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" class="kycar-sort-btn" onClick={() => onSort(col)}>
        {label}
        {chevron}
      </button>
    </th>
  );
}
