/**
 * KYCAR — Cache du dernier snapshot (lot D8, EX-NFR-22 / EX-NFR-24)
 * =================================================================================================
 * Implémente l'interface `SnapshotCache` attendue par le `DataController` : quand tous les réessais
 * provider échouent (EX-NFR-21), le contrôleur relit ce cache pour servir un mode 1 dégradé plutôt
 * qu'une erreur (EX-NFR-23). Le payload (`descriptor` + agrégats de base) est volumineux mais
 * strictement structuré-clonable (nombres et chaînes) : il vit dans IndexedDB, pas dans
 * `localStorage` (les collections CRUD légères y restent, elles). Le cache est un CONFORT : toute
 * défaillance de lecture/écriture est silencieuse et non bloquante (voir `DataController.start`).
 */

import type { CachedSnapshot, SnapshotCache } from '../orchestration/data-controller';
import { SCHEMA_VERSION } from './schema';

const DB_NAME = 'kycar';
const STORE = 'snapshot-cache';
const LATEST_KEY = 'latest';

interface Envelope {
  readonly schemaVersion: number;
  readonly snapshot: CachedSnapshot;
}

/** Cache mémoire — pour les tests d'intégration (repli EX-NFR-22) et le repli hors-navigateur. */
export function createMemorySnapshotCache(initial?: CachedSnapshot | null): SnapshotCache {
  let current: CachedSnapshot | null = initial ?? null;
  return {
    read: () => Promise.resolve(current),
    write: (snapshot) => {
      current = snapshot;
      return Promise.resolve();
    },
  };
}

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

/**
 * Cache IndexedDB pour la production. Si `indexedDB` est indisponible, bascule sur le cache mémoire
 * (persistance perdue mais le contrat `SnapshotCache` reste honoré). Une envelope à `schemaVersion`
 * différente est ignorée (le cache est reconstruit au prochain démarrage réussi).
 */
export function createIndexedDbSnapshotCache(): SnapshotCache {
  if (typeof indexedDB === 'undefined') return createMemorySnapshotCache();

  return {
    async read(): Promise<CachedSnapshot | null> {
      try {
        const db = await openDb();
        const envelope = await new Promise<Envelope | undefined>((resolve, reject) => {
          const tx = db.transaction(STORE, 'readonly');
          const req = tx.objectStore(STORE).get(LATEST_KEY);
          req.onsuccess = (): void => resolve(req.result as Envelope | undefined);
          req.onerror = (): void => reject(req.error ?? new Error('read failed'));
        });
        db.close();
        if (envelope === undefined || envelope.schemaVersion !== SCHEMA_VERSION) return null;
        return envelope.snapshot;
      } catch {
        return null;
      }
    },
    async write(snapshot: CachedSnapshot): Promise<void> {
      try {
        const db = await openDb();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE, 'readwrite');
          const envelope: Envelope = { schemaVersion: SCHEMA_VERSION, snapshot };
          tx.objectStore(STORE).put(envelope, LATEST_KEY);
          tx.oncomplete = (): void => resolve();
          tx.onerror = (): void => reject(tx.error ?? new Error('write failed'));
        });
        db.close();
      } catch {
        // Confort non bloquant (EX-NFR-22) : un échec d'écriture ne remonte jamais.
      }
    },
  };
}
