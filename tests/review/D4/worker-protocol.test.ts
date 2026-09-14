import { beforeAll, describe, expect, it } from 'vitest';
import type { WorkerRequest, WorkerResponse } from '../../../src/worker/messages';
import { isRecalculatedMessage, isWorkerErrorMessage } from '../../../src/worker/messages';
import { createAggregationWorkerClient } from '../../../src/worker/client';
import { cellRows, makeBatch } from './helpers';

/**
 * Revue D4 — protocole worker (src/worker/messages.ts) et worker réel (aggregation.worker.ts) exécutés
 * IN-PROCESS via un `self` factice : le module du worker s'abonne à `self.addEventListener('message')`
 * et répond par `self.postMessage`. On rejoue le switch réel, puis le client thread principal
 * (`createAggregationWorkerClient`) au-dessus d'un `Worker` factice branché sur ce même switch.
 * Objet : ADV-12 (annulation / déduplication des recalculs en file) et robustesse du canal.
 */

type Listener = (event: { data: unknown }) => void;
const listeners: Listener[] = [];
const posted: unknown[] = [];

function dispatch(request: unknown): void {
  for (const l of listeners) l({ data: request });
}

function lastPosted(): WorkerResponse {
  return posted[posted.length - 1] as WorkerResponse;
}

const BATCH = makeBatch(cellRows(400, { seed: 9 }));

beforeAll(async () => {
  Object.defineProperty(globalThis, 'self', {
    value: {
      addEventListener: (_type: string, fn: Listener) => listeners.push(fn),
      postMessage: (message: unknown) => posted.push(message),
    },
    configurable: true,
    writable: true,
  });
  const workerPath = new URL('../../../src/worker/aggregation.worker.ts', import.meta.url).pathname;
  await import(/* @vite-ignore */ workerPath);
  expect(listeners.length).toBe(1);
});

describe('Switch du worker (in-process, module réel)', () => {
  it('PING → PONG avec le même id (D1 conservé)', () => {
    dispatch({ id: 1, kind: 'PING', sentAt: 123 } satisfies WorkerRequest);
    expect(lastPosted()).toMatchObject({ id: 1, kind: 'PONG', sentAt: 123 });
  });

  it('RECALCULATE avant LOAD_DATASET → WORKER_ERROR (jamais un résultat vide légitime, EX-NFR-23)', () => {
    dispatch({ id: 2, kind: 'RECALCULATE', selection: { selectionHash: 'FULL:EMPTY' } } satisfies WorkerRequest);
    const r = lastPosted();
    expect(isWorkerErrorMessage(r)).toBe(true);
    expect(isWorkerErrorMessage(r) ? r.message : '').toMatch(/LOAD_DATASET/);
  });

  it('LOAD_DATASET → DATASET_LOADED(rowCount) ; RECALCULATE → RECALCULATED ; FACETS → FACETS_READY', () => {
    dispatch({ id: 3, kind: 'LOAD_DATASET', batch: BATCH } satisfies WorkerRequest);
    expect(lastPosted()).toEqual({ id: 3, kind: 'DATASET_LOADED', rowCount: 400 });
    dispatch({ id: 4, kind: 'RECALCULATE', selection: { selectionHash: 'FULL:EMPTY' } } satisfies WorkerRequest);
    const r = lastPosted();
    expect(isRecalculatedMessage(r)).toBe(true);
    if (isRecalculatedMessage(r)) {
      expect(r.result.selectionStats.selectionCount).toBe(400);
      expect(r.result.pruned).toBe(false);
    }
    dispatch({ id: 5, kind: 'FACETS', selection: { selectionHash: 'FULL:EMPTY' }, facetFilters: [{ filterId: 'fuel', column: 'fuelCategory' }] } satisfies WorkerRequest);
    expect(lastPosted()).toMatchObject({ id: 5, kind: 'FACETS_READY' });
  });

  it('ADV-12 — rafale de 20 RECALCULATE identiques : 20 calculs exécutés séquentiellement, aucune déduplication ni annulation possible dans le protocole', () => {
    const before = posted.length;
    const t0 = performance.now();
    for (let i = 0; i < 20; i++) dispatch({ id: 100 + i, kind: 'RECALCULATE', selection: { selectionHash: 'FULL:burst' } } satisfies WorkerRequest);
    const dt = performance.now() - t0;
    const responses = posted.slice(before) as WorkerResponse[];
    expect(responses.length).toBe(20);
    expect(responses.map((r) => r.id)).toEqual(Array.from({ length: 20 }, (_v, i) => 100 + i));
    expect(responses.every((r) => r.kind === 'RECALCULATED')).toBe(true);
    console.log(`[ADV-12 worker] 20 recalculs identiques en file : ${dt.toFixed(1)} ms cumulés (n=400) — kinds disponibles : PING, LOAD_DATASET, RECALCULATE, FACETS ; aucun CANCEL`);
  });

  it('R-D4-10 — un `kind` inconnu produit `postMessage(undefined)` au lieu d’un WORKER_ERROR (le client lira `undefined.id`)', () => {
    dispatch({ id: 999, kind: 'CANCEL' });
    const r = posted[posted.length - 1];
    expect(r).toMatchObject({ id: 999, kind: 'WORKER_ERROR' });
  });
});

describe('Client thread principal au-dessus d’un Worker factice (même switch)', () => {
  class FakeWorker {
    private readonly handlers: Array<(event: { data: unknown }) => void> = [];
    static instances = 0;
    static terminated = 0;
    constructor(_url: URL, _options?: unknown) {
      FakeWorker.instances++;
    }
    addEventListener(_type: string, fn: (event: { data: unknown }) => void): void {
      this.handlers.push(fn);
    }
    postMessage(request: unknown, _transfer?: unknown[]): void {
      const before = posted.length;
      dispatch(request);
      const response = posted[before];
      queueMicrotask(() => {
        for (const h of this.handlers) h({ data: response });
      });
    }
    terminate(): void {
      FakeWorker.terminated++;
    }
  }

  beforeAll(() => {
    Object.defineProperty(globalThis, 'Worker', { value: FakeWorker, configurable: true, writable: true });
  });

  it('ping / loadDataset / recalculate / computeFacets : correspondance par id, rejet sur WORKER_ERROR', async () => {
    const client = createAggregationWorkerClient();
    const pong = await client.ping();
    expect(pong.kind).toBe('PONG');
    const rows = await client.loadDataset(BATCH);
    expect(rows).toBe(400);
    const r = await client.recalculate({ selectionHash: 'FULL:EMPTY' });
    expect(r.selectionStats.selectionCount).toBe(400);
    const f = await client.computeFacets({ selectionHash: 'FULL:EMPTY' }, [{ filterId: 'fuel', column: 'fuelCategory' }]);
    expect(f.facets.length).toBeGreaterThan(0);
    // Deux requêtes en vol : chacune reçoit SA réponse.
    const [a, b] = await Promise.all([
      client.recalculate({ selectionHash: 'FULL:a', scope: { models: [{ makeId: 1, modelId: 101 }] } }),
      client.recalculate({ selectionHash: 'FULL:b', scope: { models: [{ makeId: 99, modelId: 1 }] } }),
    ]);
    expect(a.selectionHash).toBe('FULL:a');
    expect(b.selectionHash).toBe('FULL:b');
    expect(b.selectionStats.selectionCount).toBe(0);
    client.terminate();
  });

  it('R-D4-11 — `terminate()` pendant une requête en vol : la promesse n’est jamais réglée (ni rejetée), l’appelant reste suspendu', async () => {
    const client = createAggregationWorkerClient();
    // Réponse retardée : on intercepte la livraison en remplaçant queueMicrotask par un délai.
    const pendingPromise = client.recalculate({ selectionHash: 'FULL:EMPTY' });
    client.terminate();
    const outcome = await Promise.race([
      pendingPromise.then(() => 'résolue', () => 'rejetée'),
      new Promise<string>((resolve) => setTimeout(() => resolve('suspendue'), 200)),
    ]);
    console.log(`[terminate] requête en vol après terminate() : ${outcome}`);
    expect(outcome).toBe('rejetée');
  });
});
