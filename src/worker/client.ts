/**
 * KYCAR - main-thread client for the aggregation worker.
 *
 * Thin wrapper so screen/state code (D5-D8) never touches `postMessage`/`onmessage` directly.
 * D1 only exposes `ping()`, proving the round trip end to end; D4 adds one typed method per new
 * `WorkerRequest` kind it introduces, following the same request/response-by-id pattern.
 */

import {
  isPongMessage,
  isWorkerErrorMessage,
  type PongMessage,
  type WorkerResponse,
} from './messages';

let nextRequestId = 1;

interface PendingRequest {
  readonly resolve: (value: PongMessage) => void;
  readonly reject: (reason: Error) => void;
}

/**
 * Creates the aggregation worker and returns a small request/response client over it.
 * `import.meta.url` resolution is what lets Vite discover and bundle the worker as its own
 * chunk (native Vite worker support, no plugin needed).
 */
export function createAggregationWorkerClient(): {
  ping: () => Promise<PongMessage>;
  terminate: () => void;
} {
  const worker = new Worker(new URL('./aggregation.worker.ts', import.meta.url), {
    type: 'module',
  });

  const pending = new Map<number, PendingRequest>();

  worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const request = pending.get(response.id);
    if (!request) {
      return;
    }
    pending.delete(response.id);

    if (isWorkerErrorMessage(response)) {
      request.reject(new Error(response.message));
      return;
    }
    if (isPongMessage(response)) {
      request.resolve(response);
    }
  });

  function ping(): Promise<PongMessage> {
    const id = nextRequestId++;
    return new Promise<PongMessage>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, kind: 'PING', sentAt: Date.now() });
    });
  }

  function terminate(): void {
    pending.clear();
    worker.terminate();
  }

  return { ping, terminate };
}
