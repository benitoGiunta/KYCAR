import { describe, expect, it } from 'vitest';

import { isPongMessage, isWorkerErrorMessage, type WorkerResponse } from './messages';

describe('worker message type guards', () => {
  it('recognises a PONG message and rejects it as an error message', () => {
    const pong: WorkerResponse = { id: 1, kind: 'PONG', sentAt: 0, receivedAt: 1 };
    expect(isPongMessage(pong)).toBe(true);
    expect(isWorkerErrorMessage(pong)).toBe(false);
  });

  it('recognises a WORKER_ERROR message and rejects it as a PONG', () => {
    const errorMessage: WorkerResponse = { id: 2, kind: 'WORKER_ERROR', message: 'boom' };
    expect(isWorkerErrorMessage(errorMessage)).toBe(true);
    expect(isPongMessage(errorMessage)).toBe(false);
  });
});
