/**
 * KYCAR — Préférences d'affichage locales (lot D8)
 * =================================================================================================
 * Petites préférences par onglet/appareil (tri par défaut de l'écran A, masquage des modèles peu
 * fournis…). Stockées dans `localStorage`, portent `schemaVersion` (EX-CRUD-18). Perte tolérée :
 * une préférence absente retombe sur son défaut. Aucune donnée d'annonce, aucun champ vendeur.
 */

import { browserLocalStorageBackend, memoryBackend, type KvBackend } from './kv';
import { SCHEMA_VERSION } from './schema';

export const PREFERENCES_KEY = 'kycar:preferences';

export interface Preferences {
  readonly schemaVersion: number;
  readonly sortField: string;
  readonly sortDirection: 'asc' | 'desc';
  readonly hideSparseModels: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  schemaVersion: SCHEMA_VERSION,
  sortField: 'listingCount',
  sortDirection: 'desc',
  hideSparseModels: false,
};

export class PreferencesStore {
  constructor(private readonly backend: KvBackend) {}

  read(): Preferences {
    const stored = this.backend.get(PREFERENCES_KEY);
    if (stored === null) return DEFAULT_PREFERENCES;
    try {
      const parsed = JSON.parse(stored) as Partial<Preferences>;
      return { ...DEFAULT_PREFERENCES, ...parsed, schemaVersion: SCHEMA_VERSION };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  write(patch: Partial<Omit<Preferences, 'schemaVersion'>>): Preferences {
    const next: Preferences = { ...this.read(), ...patch, schemaVersion: SCHEMA_VERSION };
    this.backend.set(PREFERENCES_KEY, JSON.stringify(next));
    return next;
  }
}

export function createPreferencesStore(backend?: KvBackend): PreferencesStore {
  return new PreferencesStore(backend ?? browserLocalStorageBackend() ?? memoryBackend());
}
