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

/** Identité stable d'une visite (`D-16`) : empreinte courte de l'URL et de l'horodatage — deux
 * visites successives de la même URL restent deux entrées distinctes. */
function entryId(entry: RecentEntry): string {
  const source = `${entry.url}|${entry.visiteLe}`;
  let h = 5381;
  for (let i = 0; i < source.length; i += 1) h = ((h * 33) ^ source.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export class RecentHistoryStore {
  private readonly col: CappedCollection<RecentEntry>;
  constructor(backend: KvBackend) {
    this.col = new CappedCollection<RecentEntry>({
      backend,
      key: RECENT_HISTORY_KEY,
      cap: RECENT_HISTORY_CAP,
      idOf: entryId,
    });
  }

  list(): LoadedRecord<RecentEntry>[] {
    return this.col.load();
  }

  /**
   * Enregistre une visite (EX-CRUD-11). No-op si `url` est identique à l'entrée la plus récente
   * (« jeu de filtres différent du précédent »). Insère en tête, tronque à 10 (FIFO, EX-CRUD-12).
   */
  visit(url: string): void {
    // `DR-153` (`EX-CRUD-11`/`12`) : l'historique automatique est SILENCIEUX — un quota plein (ou
    // tout autre refus d'écriture) ne doit jamais faire échouer un rendu de la coquille. L'échec est
    // journalisé, jamais propagé (contrairement aux collections NOMMÉES, qui refusent bruyamment).
    try {
      this.visitOrThrow(url);
    } catch (e) {
      console.warn('KYCAR: historique récent non enregistré (écriture refusée)', e);
    }
  }

  /** Cœur de `visit`, sans absorption d'erreur (testable). */
  private visitOrThrow(url: string): void {
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
