/**
 * Revue D8 — utilitaires partagés des sondes (pas un test : nom sans `.test.ts`).
 *
 * - `instrumentedEngineFactory()` : fabrique un `AggregationEngine` réel (façade D4) au-dessus du
 *   client in-process D8, en ESPIONNANT chaque `loadDataset` (taille du lot) et chaque `recalculate`
 *   (sélection, effectif balayé). C'est la preuve de câblage O17 : M1/M2 tournent dans
 *   `AggregationDataset.recalculate` (kernel.ts) — donc « recalculate a été appelé sur un lot de
 *   taille m » ⇔ « M1/M2 a tourné sur m lignes ».
 * - `countingProvider()` : enveloppe un `DataProvider` en comptant les appels réseau logiques.
 * - `cellRows()` : vérité terrain calculée directement sur le lot colonnaire du provider.
 */
import { AggregationEngine } from '../../../src/engine/index';
import type { EngineSelection, RecalcResult, FacetResult } from '../../../src/engine/kernel';
import type { FacetFilterSpec } from '../../../src/engine/facets';
import { createInProcessEngineClient } from '../../../src/orchestration/engine-inprocess';
import type { AggregationWorkerClient } from '../../../src/worker/client';
import type { ListingColumnBatch, Model } from '../../../src/types/index';
import type { DataProvider } from '../../../src/providers/DataProvider';

export interface EngineSpy {
  readonly loads: { rowCount: number; localDatasetKey: string }[];
  readonly recalcs: { selection: EngineSelection; scannedCount: number; rowCountAtCall: number; ms: number }[];
  facets: number;
  /** Nombre de moteurs effectivement fabriqués (0 = jamais instancié). */
  created: number;
}

export function instrumentedEngineFactory(): { factory: () => AggregationEngine; spy: EngineSpy } {
  const spy: EngineSpy = { loads: [], recalcs: [], facets: 0, created: 0 };
  const factory = (): AggregationEngine => {
    spy.created += 1;
    const inner = createInProcessEngineClient();
    let currentRowCount = 0;
    const client: AggregationWorkerClient = {
      ping: () => inner.ping(),
      loadDataset(batch: ListingColumnBatch, models?: readonly Model[]): Promise<number> {
        currentRowCount = batch.rowCount;
        spy.loads.push({ rowCount: batch.rowCount, localDatasetKey: batch.localDatasetKey });
        return inner.loadDataset(batch, models);
      },
      async recalculate(selection: EngineSelection): Promise<RecalcResult> {
        const t0 = performance.now();
        const result = await inner.recalculate(selection);
        spy.recalcs.push({ selection, scannedCount: result.scannedCount, rowCountAtCall: currentRowCount, ms: performance.now() - t0 });
        return result;
      },
      computeFacets(selection: EngineSelection, facetFilters: readonly FacetFilterSpec[]): Promise<FacetResult> {
        spy.facets += 1;
        return inner.computeFacets(selection, facetFilters);
      },
      terminate: () => inner.terminate(),
    };
    return new AggregationEngine(client);
  };
  return { factory, spy };
}

export interface ProviderCounts {
  openSnapshot: number;
  baseline: number;
  aggregates: { selection: string; level: string; makeScope: number | undefined }[];
  selectionCount: number;
  listingColumns: string[];
  listingsByIds: number;
}

export function countingProvider(inner: DataProvider): { provider: DataProvider; counts: ProviderCounts } {
  const counts: ProviderCounts = { openSnapshot: 0, baseline: 0, aggregates: [], selectionCount: 0, listingColumns: [], listingsByIds: 0 };
  const provider: DataProvider = {
    describe: () => inner.describe(),
    openSnapshot: (r) => {
      counts.openSnapshot += 1;
      return inner.openSnapshot(r);
    },
    closeSnapshot: (h) => inner.closeSnapshot(h),
    fetchBaselineAggregates: (h) => {
      counts.baseline += 1;
      return inner.fetchBaselineAggregates(h);
    },
    fetchAggregates: (h, s, l, m) => {
      counts.aggregates.push({ selection: s, level: l, makeScope: m });
      return inner.fetchAggregates(h, s, l, m);
    },
    fetchSelectionCount: (h, s) => {
      counts.selectionCount += 1;
      return inner.fetchSelectionCount(h, s);
    },
    fetchListingColumns: inner.fetchListingColumns
      ? (h, t) => {
          counts.listingColumns.push(t);
          return inner.fetchListingColumns!(h, t);
        }
      : undefined,
    fetchListingsByIds: inner.fetchListingsByIds
      ? (h, ids) => {
          counts.listingsByIds += 1;
          return inner.fetchListingsByIds!(h, ids);
        }
      : undefined,
  };
  return { provider, counts };
}

/** Indices des lignes du lot appartenant à la cellule (makeId, modelId) — vérité terrain directe. */
export function cellRows(batch: ListingColumnBatch, makeId: number, modelId: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < batch.rowCount; i += 1) {
    if (batch.makeId[i] === makeId && batch.modelId[i] === modelId) out.push(i);
  }
  return out;
}

/** Compte les lignes satisfaisant un prédicat sur le lot complet. */
export function countRows(batch: ListingColumnBatch, pred: (i: number) => boolean): number {
  let n = 0;
  for (let i = 0; i < batch.rowCount; i += 1) if (pred(i)) n += 1;
  return n;
}

/** Année de première immatriculation d'une ligne (colonne `12*année + mois-1`, sentinelle -1). */
export function registrationYear(batch: ListingColumnBatch, i: number): number {
  const ym = batch.firstRegistrationYearMonth[i] as number;
  return ym < 0 ? -1 : Math.floor(ym / 12);
}

export const OPEL_MAKE_ID = 54;
export const CORSA_MODEL_ID = 1918;

/* ------------------------------------------------------------------------------------------------
 * Estimation STATIQUE du premier affichage (EX-NFR-9) : octets gzip réellement transférés au démarrage.
 * Modèle : 4G ≈ 500 Ko/s (ARCHITECTURE §2.3/§9.3), latence 150 ms (EX-NFR-9) comptée pour DEUX
 * vagues séquentielles (HTML→JS initial, puis la vague parallèle `/reference/*` lancée par main.tsx).
 * ---------------------------------------------------------------------------------------------- */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { REQUIRED_REFERENCE_FILES } from '../../../src/orchestration/reference-loader';

export const FOUR_G_BYTES_PER_SEC = 500_000;
export const FOUR_G_LATENCY_MS = 150;

export interface TransferEstimate {
  readonly distPresent: boolean;
  readonly initialJsBytes: number;
  readonly initialCssBytes: number;
  readonly referenceBytes: number;
  readonly referenceFiles: { file: string; gzipBytes: number }[];
  readonly totalBytes: number;
  readonly transferMs: number;
}

interface ManifestEntry {
  readonly file: string;
  readonly isEntry?: boolean;
  readonly imports?: readonly string[];
  readonly css?: readonly string[];
}

export function estimateStartupTransfer(root: string = process.cwd()): TransferEstimate {
  const refDir = resolve(root, 'data/reference');
  const refPaths = ['taxonomy.json', 'filters.json', 'filters-scope.json', ...REQUIRED_REFERENCE_FILES.map((n) => `references/${n}.json`)];
  const referenceFiles = refPaths.map((rel) => ({ file: rel, gzipBytes: gzipSync(readFileSync(resolve(refDir, rel))).length }));
  const referenceBytes = referenceFiles.reduce((s, f) => s + f.gzipBytes, 0);

  const manifestPath = resolve(root, 'dist/.vite/manifest.json');
  let initialJsBytes = 0;
  let initialCssBytes = 0;
  const distPresent = existsSync(manifestPath);
  if (distPresent) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, ManifestEntry>;
    const visited = new Set<string>();
    const queue = Object.keys(manifest).filter((k) => manifest[k]?.isEntry);
    while (queue.length > 0) {
      const key = queue.shift() as string;
      if (visited.has(key)) continue;
      const entry = manifest[key];
      if (entry === undefined) continue;
      visited.add(key);
      for (const dep of entry.imports ?? []) queue.push(dep);
    }
    for (const key of visited) {
      const entry = manifest[key] as ManifestEntry;
      if (entry.file.endsWith('.js')) initialJsBytes += gzipSync(readFileSync(resolve(root, 'dist', entry.file))).length;
      for (const css of entry.css ?? []) initialCssBytes += gzipSync(readFileSync(resolve(root, 'dist', css))).length;
    }
  }
  const totalBytes = initialJsBytes + initialCssBytes + referenceBytes;
  const transferMs = (totalBytes / FOUR_G_BYTES_PER_SEC) * 1000 + 2 * FOUR_G_LATENCY_MS;
  return { distPresent, initialJsBytes, initialCssBytes, referenceBytes, referenceFiles, totalBytes, transferMs };
}
