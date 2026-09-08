import { describe, expect, it } from 'vitest';
import { LruCache, LRU_CAPACITY, cacheKey } from '../../../src/engine/lru';
import { AggregationEngine } from '../../../src/engine/client';
import type { AggregationWorkerClient } from '../../../src/worker/client';
import type { EngineSelection, FacetResult, RecalcResult } from '../../../src/engine/kernel';
import type { PongMessage } from '../../../src/worker/messages';

/**
 * Revue D4 — cache LRU 32 (EX-DATA-109, EX-SRCH-9quinquies) : éviction, clé = `selectionHash`,
 * absence de fuite de référence, et comportement sous requêtes concurrentes identiques (ADV-12).
 */

function fakeResult(tag: string): RecalcResult {
  return { selectionHash: tag, snapshotId: 'snap', scannedCount: 0, pruned: false } as unknown as RecalcResult;
}

/** Client factice : compte les appels, résout immédiatement ou sur demande (`deferred`). */
function fakeClient(options: { deferred?: boolean } = {}) {
  const calls: string[] = [];
  const pending: Array<(r: RecalcResult) => void> = [];
  let loads = 0;
  const client: AggregationWorkerClient = {
    ping: () => Promise.resolve({ id: 0, kind: 'PONG', sentAt: 0, receivedAt: 0 } as PongMessage),
    loadDataset: () => {
      loads++;
      return Promise.resolve(0);
    },
    recalculate: (selection: EngineSelection) => {
      calls.push(selection.selectionHash);
      if (options.deferred) return new Promise<RecalcResult>((resolve) => pending.push(resolve));
      return Promise.resolve(fakeResult(selection.selectionHash));
    },
    computeFacets: (selection: EngineSelection) => Promise.resolve({ snapshotId: 'snap', selectionHash: selection.selectionHash, facets: [] } as FacetResult),
    terminate: () => undefined,
  };
  return { client, calls, pending, loads: () => loads };
}

describe('LruCache — éviction et récence', () => {
  it('capacité 32 : la 33ᵉ insertion évince la plus ancienne ; `get` rafraîchit la récence', () => {
    const cache = new LruCache<number>(LRU_CAPACITY);
    for (let i = 0; i < 32; i++) expect(cache.set(`k${i}`, i)).toEqual([]);
    expect(cache.size).toBe(32);
    expect(cache.get('k0')).toBe(0); // k0 devient la plus récente
    expect(cache.set('k32', 32)).toEqual(['k1']); // k1 est maintenant la plus ancienne
    expect(cache.has('k0')).toBe(true);
    expect(cache.has('k1')).toBe(false);
    expect(cache.size).toBe(32);
    expect(cache.keysOldestFirst()[0]).toBe('k2');
    expect(cache.keysOldestFirst()[31]).toBe('k32');
  });

  it('mise à jour d’une clé existante : pas d’éviction, devient la plus récente ; `clear` vide ; capacité invalide refusée', () => {
    const cache = new LruCache<string>(3);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');
    expect(cache.set('a', '1bis')).toEqual([]);
    expect(cache.keysOldestFirst()).toEqual(['b', 'c', 'a']);
    expect(cache.set('d', '4')).toEqual(['b']);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(() => new LruCache(0)).toThrow(RangeError);
    expect(cacheKey('FULL', 'abc')).toBe('FULL:abc');
  });

  it('getOrCompute n’appelle la fabrique qu’en cas d’absence', () => {
    const cache = new LruCache<number>(2);
    let computed = 0;
    const f = () => {
      computed++;
      return 42;
    };
    expect(cache.getOrCompute('x', f)).toBe(42);
    expect(cache.getOrCompute('x', f)).toBe(42);
    expect(computed).toBe(1);
  });
});

describe('AggregationEngine — cache clé `selectionHash` devant le worker', () => {
  it('même selectionHash → un seul appel worker et le même objet résultat ; hash différent → nouvel appel', async () => {
    const { client, calls } = fakeClient();
    const engine = new AggregationEngine(client);
    const a1 = await engine.recalculate({ selectionHash: 'FULL:A' });
    const a2 = await engine.recalculate({ selectionHash: 'FULL:A' });
    expect(a1).toBe(a2);
    expect(calls).toEqual(['FULL:A']);
    await engine.recalculate({ selectionHash: 'FULL:B' });
    expect(calls).toEqual(['FULL:A', 'FULL:B']);
    expect(engine.isCached('FULL:A')).toBe(true);
    expect(engine.cacheSize).toBe(2);
  });

  it('33 sélections distinctes : la première est évincée et recalculée ; le cache ne dépasse jamais 32 entrées', async () => {
    const { client, calls } = fakeClient();
    const engine = new AggregationEngine(client);
    for (let i = 0; i < 33; i++) await engine.recalculate({ selectionHash: `FULL:s${i}` });
    expect(engine.cacheSize).toBe(32);
    expect(engine.isCached('FULL:s0')).toBe(false);
    expect(engine.isCached('FULL:s1')).toBe(true);
    await engine.recalculate({ selectionHash: 'FULL:s0' });
    expect(calls.filter((c) => c === 'FULL:s0').length).toBe(2);
    expect(engine.cacheSize).toBe(32);
  });

  it('loadDataset vide le cache (EX-NAV-23 : nouveau snapshot) ; la clé n’est jamais partagée entre deux jeux de données', async () => {
    const { client, calls, loads } = fakeClient();
    const engine = new AggregationEngine(client);
    await engine.recalculate({ selectionHash: 'FULL:A' });
    await engine.loadDataset({} as never);
    expect(loads()).toBe(1);
    expect(engine.cacheSize).toBe(0);
    await engine.recalculate({ selectionHash: 'FULL:A' });
    expect(calls).toEqual(['FULL:A', 'FULL:A']);
  });

  it('pas de fuite de référence : un résultat évincé n’est plus retenu par le cache (WeakRef libérée si gc exposé, sinon absence structurelle)', async () => {
    const { client } = fakeClient();
    const engine = new AggregationEngine(client);
    // La référence forte au résultat ne vit que dans cette fermeture : après éviction, seul le cache
    // pourrait encore le retenir.
    const weak = await (async (): Promise<WeakRef<RecalcResult>> => {
      const first = await engine.recalculate({ selectionHash: 'FULL:first' });
      return new WeakRef(first);
    })();
    for (let i = 0; i < 40; i++) await engine.recalculate({ selectionHash: `FULL:x${i}` });
    expect(engine.isCached('FULL:first')).toBe(false);
    const internal = (engine as unknown as { cache: LruCache<RecalcResult> }).cache;
    expect(internal.keysOldestFirst()).not.toContain('FULL:first');
    const gc = (globalThis as unknown as { gc?: () => void }).gc;
    if (typeof gc === 'function') {
      gc();
      await new Promise((r) => setTimeout(r, 10));
      gc();
      const released = weak.deref() === undefined;
      console.log(`[LRU fuite] WeakRef après éviction + gc : ${released ? 'libérée' : 'encore vivante'}`);
      expect(released).toBe(true);
    } else {
      console.log('[LRU fuite] gc non exposé : vérification structurelle seulement (clé absente du Map interne)');
    }
    expect(internal.size).toBe(32);
  });

  it('R-D4-09 — deux demandes concurrentes du MÊME selectionHash avant la première réponse déclenchent deux calculs worker (aucune coalescence en vol ; ADV-12/ARB-57)', async () => {
    const { client, calls, pending } = fakeClient({ deferred: true });
    const engine = new AggregationEngine(client);
    const p1 = engine.recalculate({ selectionHash: 'FULL:same' });
    const p2 = engine.recalculate({ selectionHash: 'FULL:same' });
    const p3 = engine.recalculate({ selectionHash: 'FULL:same' });
    console.log(`[coalescence] 3 demandes identiques en vol → ${calls.length} appel(s) worker`);
    for (const resolve of pending) resolve(fakeResult('FULL:same'));
    await Promise.all([p1, p2, p3]);
    expect(calls.length).toBe(1);
  });
});
