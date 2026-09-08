/**
 * KYCAR — Barrel de la persistance locale (lot D8)
 * =================================================================================================
 * Surface publique consommée par la coquille (`app.tsx`) et les écrans E/F. Répartition du stockage :
 *   - Collections CRUD (recherches, modèles suivis, historique) → `localStorage` : seul stockage qui
 *     émet l'événement `storage` (concurrence inter-onglets EX-CRUD-19) et autorise une relecture-
 *     vérification-écriture synchrone du plafond dur.
 *   - Cache du dernier snapshot (payload lourd, EX-NFR-22) → IndexedDB.
 *   - Préférences d'affichage → `localStorage`.
 * Toutes les entités portent `schemaVersion` et passent par la migration d'EX-CRUD-18.
 */

export { SCHEMA_VERSION, applyMigrations } from './schema';
export type { SchemaStatus, Versioned, Migration } from './schema';

export { memoryBackend, browserLocalStorageBackend, subscribeCrossTab } from './kv';
export type { KvBackend } from './kv';

export { CappedCollection, CapExceededError } from './crud-store';
export type { LoadedRecord } from './crud-store';

export {
  SavedSearchStore,
  createSavedSearchStore,
  deriveMode,
  validateName,
  SAVED_SEARCHES_CAP,
} from './saved-searches';
export type { SavedSearch, CreateSavedSearchInput } from './saved-searches';

export {
  FollowedModelStore,
  createFollowedModelStore,
  followedKeyOf,
  FOLLOWED_MODELS_CAP,
} from './followed-models';
export type { FollowedModel } from './followed-models';

export { RecentHistoryStore, createRecentHistoryStore, RECENT_HISTORY_CAP } from './recent-history';
export type { RecentEntry } from './recent-history';

export { createMemorySnapshotCache, createIndexedDbSnapshotCache } from './snapshot-cache';

export { PreferencesStore, createPreferencesStore, DEFAULT_PREFERENCES } from './preferences';
export type { Preferences } from './preferences';
