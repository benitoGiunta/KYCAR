/**
 * KYCAR - typed protocol for the aggregation Web Worker.
 *
 * Lot D1 (scaffolding) only defines the message envelope and a PING/PONG round trip so the
 * main thread <-> worker channel is proven end to end. The aggregation engine itself (columnar
 * scan, buckets, quantiles, outlier detection, ...) is lot D4's responsibility - see
 * `docs/plans/ARCHITECTURE.md` S:1.3 and S:7.1 (D4). D4 extends `WorkerRequest`/`WorkerResponse`
 * below with its own message kinds instead of inventing a parallel channel.
 *
 * This file is shared between the main thread and the worker: it has no DOM and no
 * WebWorker-only globals, so it type-checks under both `tsconfig.json` (DOM lib) and
 * `tsconfig.worker.json` (WebWorker lib).
 */

import type { ListingColumnBatch, Model } from '../types/index';
import type { EngineSelection, FacetResult, RecalcResult } from '../engine/kernel';
import type { FacetFilterSpec } from '../engine/facets';

/** Discriminant present on every message exchanged with the aggregation worker. */
export type WorkerRequestKind = 'PING' | 'LOAD_DATASET' | 'RECALCULATE' | 'FACETS';

/** Discriminant present on every message the worker sends back. */
export type WorkerResponseKind =
  | 'PONG'
  | 'WORKER_ERROR'
  | 'DATASET_LOADED'
  | 'RECALCULATED'
  | 'FACETS_READY';

/**
 * Envelope for a request sent from the main thread to the worker. `id` lets the caller match a
 * response to its request (the worker may reorder or batch in future lots).
 */
export interface WorkerRequestBase<Kind extends WorkerRequestKind> {
  readonly id: number;
  readonly kind: Kind;
}

/** Liveness check: the worker must answer with a `PongMessage` carrying the same `id`. */
export interface PingMessage extends WorkerRequestBase<'PING'> {
  readonly sentAt: number;
}

/**
 * Charge (ou remplace) le jeu de données actif dans le worker (EX-NAV-23 : un seul snapshot actif).
 * Les `TypedArray` du batch sont transmis en `Transferable` par le client — le thread principal ne
 * conserve donc pas de copie des colonnes (le worker devient propriétaire des buffers).
 */
export interface LoadDatasetMessage extends WorkerRequestBase<'LOAD_DATASET'> {
  readonly batch: ListingColumnBatch;
  /** Taxonomie (facultative) pour l'index EX-DATA-115bis (carrosserie). */
  readonly models?: readonly Model[];
}

/** Demande de recalcul des chiffres principaux d'une sélection (chemin synchrone ≤ 200 ms). */
export interface RecalculateMessage extends WorkerRequestBase<'RECALCULATE'> {
  readonly selection: EngineSelection;
}

/** Demande de calcul des facettes d'une sélection (chemin différé, un seul balayage). */
export interface FacetsMessage extends WorkerRequestBase<'FACETS'> {
  readonly selection: EngineSelection;
  readonly facetFilters: readonly FacetFilterSpec[];
}

/** Union of every request kind the worker currently understands. D4 adds its members here. */
export type WorkerRequest = PingMessage | LoadDatasetMessage | RecalculateMessage | FacetsMessage;

export interface WorkerResponseBase<Kind extends WorkerResponseKind> {
  readonly id: number;
  readonly kind: Kind;
}

/** Reply to `PingMessage`. `receivedAt` lets the caller measure round-trip latency. */
export interface PongMessage extends WorkerResponseBase<'PONG'> {
  readonly sentAt: number;
  readonly receivedAt: number;
}

/**
 * Uniform error envelope. The worker never lets an exception cross the `postMessage` boundary
 * unformatted - every catch site wraps its failure in this shape so the main thread can render a
 * degraded state instead of silently hanging (see `EX-NFR-23`: a failure is never presented as an
 * empty legitimate result).
 */
export interface WorkerErrorMessage extends WorkerResponseBase<'WORKER_ERROR'> {
  readonly message: string;
}

/** Réponse à `LoadDatasetMessage` : le jeu de données est prêt (index construits). */
export interface DatasetLoadedMessage extends WorkerResponseBase<'DATASET_LOADED'> {
  readonly rowCount: number;
}

/** Réponse à `RecalculateMessage` : les chiffres principaux. */
export interface RecalculatedMessage extends WorkerResponseBase<'RECALCULATED'> {
  readonly result: RecalcResult;
}

/** Réponse à `FacetsMessage` : les facettes. */
export interface FacetsReadyMessage extends WorkerResponseBase<'FACETS_READY'> {
  readonly result: FacetResult;
}

/** Union of every response kind the worker currently emits. D4 adds its members here. */
export type WorkerResponse =
  | PongMessage
  | WorkerErrorMessage
  | DatasetLoadedMessage
  | RecalculatedMessage
  | FacetsReadyMessage;

/** Type guard used by the main-thread client to narrow `MessageEvent<WorkerResponse>.data`. */
export function isPongMessage(message: WorkerResponse): message is PongMessage {
  return message.kind === 'PONG';
}

/** Type guard used by the main-thread client to narrow `MessageEvent<WorkerResponse>.data`. */
export function isWorkerErrorMessage(message: WorkerResponse): message is WorkerErrorMessage {
  return message.kind === 'WORKER_ERROR';
}

/** Narrows a response to `DatasetLoadedMessage`. */
export function isDatasetLoadedMessage(message: WorkerResponse): message is DatasetLoadedMessage {
  return message.kind === 'DATASET_LOADED';
}

/** Narrows a response to `RecalculatedMessage`. */
export function isRecalculatedMessage(message: WorkerResponse): message is RecalculatedMessage {
  return message.kind === 'RECALCULATED';
}

/** Narrows a response to `FacetsReadyMessage`. */
export function isFacetsReadyMessage(message: WorkerResponse): message is FacetsReadyMessage {
  return message.kind === 'FACETS_READY';
}
