/**
 * KYCAR - aggregation Web Worker (scaffolding only, lot D1).
 *
 * `docs/plans/ARCHITECTURE.md` S:1.1/1.3 requires the columnar scan, bucketing, quantiles and
 * outlier detection to run off the main thread so a <=200ms recalculation (EX-NFR-5) never steals
 * frames from a chart interaction that must hold >=30fps (EX-NFR-8). Lot D4 owns that engine and
 * lands it in this file (or files this one imports) as new cases in the switch below - it does
 * not need a new worker file or a new channel: the request/response envelope is already typed in
 * `./messages.ts`.
 *
 * D1 only proves the channel: the worker answers a PING with a PONG. No aggregation logic lives
 * here yet.
 */

import type { WorkerRequest, WorkerResponse } from './messages';

function handleRequest(request: WorkerRequest): WorkerResponse {
  switch (request.kind) {
    case 'PING':
      return {
        id: request.id,
        kind: 'PONG',
        sentAt: request.sentAt,
        receivedAt: Date.now(),
      };
    // D4: add aggregation request kinds here (scan, buckets, quantiles, outliers, facets...).
  }
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  try {
    const response = handleRequest(event.data);
    self.postMessage(response);
  } catch (error) {
    const errorResponse: WorkerResponse = {
      id: event.data.id,
      kind: 'WORKER_ERROR',
      message: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(errorResponse);
  }
});
