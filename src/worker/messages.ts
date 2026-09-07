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

/** Discriminant present on every message exchanged with the aggregation worker. */
export type WorkerRequestKind = 'PING';

/** Discriminant present on every message the worker sends back. */
export type WorkerResponseKind = 'PONG' | 'WORKER_ERROR';

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

/** Union of every request kind the worker currently understands. D4 adds its members here. */
export type WorkerRequest = PingMessage;

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

/** Union of every response kind the worker currently emits. D4 adds its members here. */
export type WorkerResponse = PongMessage | WorkerErrorMessage;

/** Type guard used by the main-thread client to narrow `MessageEvent<WorkerResponse>.data`. */
export function isPongMessage(message: WorkerResponse): message is PongMessage {
  return message.kind === 'PONG';
}

/** Type guard used by the main-thread client to narrow `MessageEvent<WorkerResponse>.data`. */
export function isWorkerErrorMessage(message: WorkerResponse): message is WorkerErrorMessage {
  return message.kind === 'WORKER_ERROR';
}
