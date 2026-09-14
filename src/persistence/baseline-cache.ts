/**
 * KYCAR — Cache IndexedDB des agrégats de base d'un provider `AGGREGATE_SURFACE` (D-29, EX-DATA-109)
 * =================================================================================================
 * `D-29` : « un provider `AGGREGATE_SURFACE` fait un aller par appel MAIS sa baseline est mise en
 * cache IndexedDB après le premier succès et lue d'abord ». Le point d'injection est
 * `TweedehandsDataProviderOptions.baselineCache` (`TweedehandsBaselineCache`, fix-providers §6.3),
 * dont le contrat est SYNCHRONE (`get(key) → valeur | undefined`, `set(key, valeur)`) alors
 * qu'IndexedDB est asynchrone. Ce module réconcilie les deux :
 *   - une carte MÉMOIRE sert les lectures synchrones (c'est elle que le provider interroge) ;
 *   - `hydrate()` la remplit depuis IndexedDB au démarrage, AVANT le premier `openSnapshot` ;
 *   - `set` écrit la mémoire puis pousse vers IndexedDB en tâche de fond, sans jamais bloquer ni
 *     propager d'échec (le cache est un confort, comme `snapshot-cache.ts`).
 *
 * Ce module ne connaît AUCUN provider concret (R2 : `src/persistence` n'importe jamais
 * `src/providers/tweedehands` — le type est structurel), il est donc utilisable par tout provider
 * qui expose le même point d'injection.
 */

import { SCHEMA_VERSION } from './schema';

/** Contrat SYNCHRONE attendu au point d'injection (structurellement `TweedehandsBaselineCache`). */
export interface SyncValueCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
}

/** Cache injectable + son amorçage asynchrone (à attendre avant le premier appel provider). */
export interface HydratableCache<T> extends SyncValueCache<T> {
  /** Charge le contenu persisté dans la carte mémoire. Ne lève jamais. */
  hydrate(): Promise<void>;
}

const DB_NAME = 'kycar';
const STORE = 'baseline-cache';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, SCHEMA_VERSION);
    req.onupgradeneeded = (): void => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = (): void => resolve(req.result);
    req.onerror = (): void => reject(req.error ?? new Error('indexedDB open failed'));
  });
}

/** Cache mémoire pur — repli hors navigateur, et base du cache IndexedDB. */
export function createMemoryBaselineCache<T>(): HydratableCache<T> {
  const map = new Map<string, T>();
  return {
    get: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
    },
    hydrate: () => Promise.resolve(),
  };
}

/**
 * Cache de baseline persistant (`D-29`). À injecter dans le provider `AGGREGATE_SURFACE` :
 * `new TweedehandsDataProvider({ …, baselineCache })` après avoir attendu `hydrate()`.
 * Hors navigateur ou si IndexedDB est indisponible, se comporte comme le cache mémoire.
 */
export function createIndexedDbBaselineCache<T>(): HydratableCache<T> {
  const memory = createMemoryBaselineCache<T>();
  if (typeof indexedDB === 'undefined') return memory;

  return {
    get: (key) => memory.get(key),
    set: (key, value) => {
      memory.set(key, value);
      void (async (): Promise<void> => {
        try {
          const db = await openDb();
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put(value, key);
            tx.oncomplete = (): void => resolve();
            tx.onerror = (): void => reject(tx.error ?? new Error('write failed'));
          });
          db.close();
        } catch {
          // Confort non bloquant : la mémoire porte déjà la valeur pour cette session.
        }
      })();
    },
    async hydrate(): Promise<void> {
      try {
        const db = await openDb();
        const entries = await new Promise<{ key: string; value: T }[]>((resolve, reject) => {
          const out: { key: string; value: T }[] = [];
          const tx = db.transaction(STORE, 'readonly');
          const req = tx.objectStore(STORE).openCursor();
          req.onsuccess = (): void => {
            const cursor = req.result;
            if (cursor === null) {
              resolve(out);
              return;
            }
            out.push({ key: String(cursor.key), value: cursor.value as T });
            cursor.continue();
          };
          req.onerror = (): void => reject(req.error ?? new Error('read failed'));
        });
        db.close();
        for (const { key, value } of entries) memory.set(key, value);
      } catch {
        // Aucun cache lisible : le provider recalculera sa baseline au premier succès.
      }
    },
  };
}
