/**
 * KYCAR — Recherches sauvegardées (lot D8, EX-CRUD-1..6, C.1)
 * =================================================================================================
 * État de filtres nommé, capturé comme URL relative (chemin + requête). Aucune donnée d'annonce
 * dupliquée. `effectifInitial` et `snapshotInitial` sont FIGÉS à la création (ARB-45), jamais
 * réécrits — y compris à l'ouverture. Plafond dur : 50 (EX-CRUD-5), écriture refusée au-delà.
 */

import { CapExceededError, CappedCollection, type LoadedRecord } from './crud-store';
import { browserLocalStorageBackend, memoryBackend, subscribeCrossTab, type KvBackend } from './kv';
import { SCHEMA_VERSION, type Versioned } from './schema';

export const SAVED_SEARCHES_KEY = 'kycar:saved-searches';
export const SAVED_SEARCHES_CAP = 50;
export const NAME_MIN = 1;
export const NAME_MAX = 60;
export const CAP_MESSAGE =
  'Limite de 50 recherches atteinte — supprimez une recherche existante pour en enregistrer une nouvelle.';

export interface SavedSearch extends Versioned {
  readonly id: string;
  readonly nom: string;
  readonly url: string;
  readonly mode: 1 | 2;
  readonly creeeLe: string;
  readonly dernierAccesLe: string;
  /** Effectif d'ANNONCES de la sélection au moment de l'enregistrement (jamais marques/modèles). */
  readonly effectifInitial: number;
  readonly snapshotInitial: string;
}

export interface CreateSavedSearchInput {
  readonly nom: string;
  readonly url: string;
  readonly effectifInitial: number;
  readonly snapshotInitial: string;
}

/** Génère un identifiant opaque stable. `crypto.randomUUID` si disponible, repli horodaté sinon. */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `s_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/** Dérive le mode (1 ou 2) de l'URL : une route d'écran B/D (`/marche/:make/:model…`) est mode 2. */
export function deriveMode(url: string): 1 | 2 {
  const path = url.split('?')[0] ?? '';
  return /\/marche\/\d+-[^/]+\/\d+-[^/]+/.test(path) ? 2 : 1;
}

/** Valide le nom (EX-CRUD-2) : non vide après trim, ≤ 60 caractères. Retourne le nom nettoyé. */
export function validateName(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length < NAME_MIN) throw new Error('Le nom de la recherche est obligatoire.');
  if (trimmed.length > NAME_MAX) throw new Error(`Le nom ne peut dépasser ${NAME_MAX} caractères.`);
  return trimmed;
}

export class SavedSearchStore {
  private readonly col: CappedCollection<SavedSearch>;
  constructor(backend: KvBackend) {
    this.col = new CappedCollection<SavedSearch>({
      backend,
      key: SAVED_SEARCHES_KEY,
      cap: SAVED_SEARCHES_CAP,
      // `D-16`/`DR-096` : une clé `localStorage` par entrée, identifiée par son `id` opaque.
      idOf: (s) => s.id,
    });
  }

  list(): LoadedRecord<SavedSearch>[] {
    return this.col.load();
  }

  /** True si un nom identique existe déjà (avertissement non bloquant, EX-CRUD-2). */
  hasDuplicateName(nom: string): boolean {
    const trimmed = nom.trim();
    return this.col.values().some((s) => s.nom === trimmed);
  }

  /** Crée une recherche (EX-CRUD-1). Refuse au plafond (EX-CRUD-5/19). */
  create(input: CreateSavedSearchInput): SavedSearch {
    const nom = validateName(input.nom);
    const now = new Date().toISOString();
    const record: SavedSearch = {
      schemaVersion: SCHEMA_VERSION,
      id: generateId(),
      nom,
      url: input.url,
      mode: deriveMode(input.url),
      creeeLe: now,
      dernierAccesLe: now,
      effectifInitial: input.effectifInitial,
      snapshotInitial: input.snapshotInitial,
    };
    this.col.mutate((current) => {
      this.col.assertCanAdd(current, CAP_MESSAGE);
      return [...current.map((r) => r.value), record];
    });
    return record;
  }

  /** Renomme (EX-CRUD-4). Ne touche NI `url`, NI `effectifInitial`, NI `snapshotInitial`. */
  rename(id: string, nom: string): void {
    const clean = validateName(nom);
    this.col.mutate((current) =>
      current.map((r) => (r.value.id === id ? { ...r.value, nom: clean } : r.value)),
    );
  }

  /** Met à jour `dernierAccesLe` à l'ouverture (EX-CRUD-6). Valeurs figées inchangées (ARB-45). */
  touch(id: string): void {
    const now = new Date().toISOString();
    this.col.mutate((current) =>
      current.map((r) => (r.value.id === id ? { ...r.value, dernierAccesLe: now } : r.value)),
    );
  }

  /** Suppression immédiate, sans corbeille (EX-CRUD-4). */
  remove(id: string): void {
    this.col.mutate((current) => current.filter((r) => r.value.id !== id).map((r) => r.value));
  }

  subscribe(onChange: () => void): () => void {
    // `E2E-25` (`EX-CRUD-19`, `ADV-13`) : l'écriture d'un autre onglet est l'instant EXACT où une
    // course sur l'index a pu se produire — l'index est réconcilié avec les blobs réellement
    // présents AVANT de notifier l'écran, de sorte qu'aucune entrée ne reste orpheline.
    return subscribeCrossTab(SAVED_SEARCHES_KEY, () => {
      this.col.reconcileIndex();
      onChange();
    });
  }
}

export { CapExceededError };

/** Fabrique la banque avec le backend navigateur, ou mémoire en repli (hors navigateur / mode privé). */
export function createSavedSearchStore(backend?: KvBackend): SavedSearchStore {
  return new SavedSearchStore(backend ?? browserLocalStorageBackend() ?? memoryBackend());
}
