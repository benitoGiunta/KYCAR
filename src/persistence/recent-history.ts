/**
 * KYCAR — Historique des recherches récentes (lot D8, EX-CRUD-11..13, C.3)
 * =================================================================================================
 * Automatique, non nommé, capé bas. À chaque navigation vers `/marche` ou une route canonique
 * d'écran B avec un jeu de filtres DIFFÉRENT du précédent, une entrée `(url, visitéLe)` est insérée
 * EN TÊTE d'une liste FIFO. Plafond STRICT 10 (EX-CRUD-12) : au-delà, la plus ancienne (en queue)
 * est retirée SILENCIEUSEMENT — pas de refus, contrairement aux collections nommées. Seule action
 * utilisateur : « vider l'historique » (EX-CRUD-13).
 */

import { CappedCollection, type LoadedRecord } from './crud-store';
import { browserLocalStorageBackend, memoryBackend, subscribeCrossTab, type KvBackend } from './kv';
import { SCHEMA_VERSION, type Versioned } from './schema';

export const RECENT_HISTORY_KEY = 'kycar:recent-history';
export const RECENT_HISTORY_CAP = 10;

export interface RecentEntry extends Versioned {
  readonly url: string;
  readonly visiteLe: string;
}

export class RecentHistoryStore {
  private readonly col: CappedCollection<RecentEntry>;
  constructor(backend: KvBackend) {
    this.col = new CappedCollection<RecentEntry>({ backend, key: RECENT_HISTORY_KEY, cap: RECENT_HISTORY_CAP });
  }

  list(): LoadedRecord<RecentEntry>[] {
    return this.col.load();
  }

  /**
   * Enregistre une visite (EX-CRUD-11). No-op si `url` est identique à l'entrée la plus récente
   * (« jeu de filtres différent du précédent »). Insère en tête, tronque à 10 (FIFO, EX-CRUD-12).
   */
  visit(url: string): void {
    this.col.mutate((current) => {
      const values = current.map((r) => r.value);
      if (values.length > 0 && values[0]!.url === url) return values; // identique au précédent
      const entry: RecentEntry = { schemaVersion: SCHEMA_VERSION, url, visiteLe: new Date().toISOString() };
      return [entry, ...values].slice(0, RECENT_HISTORY_CAP);
    });
  }

  /** Vide l'historique (EX-CRUD-13). Seule action utilisateur sur cette entité. */
  clear(): void {
    this.col.clear();
  }

  subscribe(onChange: () => void): () => void {
    return subscribeCrossTab(RECENT_HISTORY_KEY, onChange);
  }
}

export function createRecentHistoryStore(backend?: KvBackend): RecentHistoryStore {
  return new RecentHistoryStore(backend ?? browserLocalStorageBackend() ?? memoryBackend());
}
