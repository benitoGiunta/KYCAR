/**
 * KYCAR — Modèles suivis (lot D8, EX-CRUD-7..10, C.2)
 * =================================================================================================
 * Liste de raccourcis vers des couples marque/modèle, SANS filtres stockés (EX-CRUD-7) — le suivi
 * porte sur le modèle. Bascule suivre/ne-plus-suivre (EX-CRUD-9). Plafond dur : 30 (EX-CRUD-10),
 * ajout refusé au-delà. Ajouter un couple déjà suivi est sans effet (idempotent).
 */

import { CapExceededError, CappedCollection, type LoadedRecord } from './crud-store';
import { browserLocalStorageBackend, memoryBackend, subscribeCrossTab, type KvBackend } from './kv';
import { SCHEMA_VERSION, type Versioned } from './schema';

export const FOLLOWED_MODELS_KEY = 'kycar:followed-models';
export const FOLLOWED_MODELS_CAP = 30;
export const CAP_MESSAGE =
  'Limite de 30 modèles suivis atteinte — retirez un modèle pour en suivre un nouveau.';

export interface FollowedModel extends Versioned {
  readonly makeId: number;
  readonly modelId: number;
  readonly ajouteLe: string;
}

function keyOf(makeId: number, modelId: number): string {
  return `${makeId}:${modelId}`;
}

export class FollowedModelStore {
  private readonly col: CappedCollection<FollowedModel>;
  constructor(backend: KvBackend) {
    this.col = new CappedCollection<FollowedModel>({
      backend,
      key: FOLLOWED_MODELS_KEY,
      cap: FOLLOWED_MODELS_CAP,
      // `D-16`/`DR-096` : une clé par couple marque/modèle (identité naturelle de l'entité).
      idOf: (m) => keyOf(m.makeId, m.modelId),
    });
  }

  list(): LoadedRecord<FollowedModel>[] {
    return this.col.load();
  }

  isFollowed(makeId: number, modelId: number): boolean {
    return this.col.values().some((m) => m.makeId === makeId && m.modelId === modelId);
  }

  /** Ajoute un suivi (EX-CRUD-9). Idempotent (doublon sans effet). Refuse au plafond (EX-CRUD-10/19). */
  follow(makeId: number, modelId: number): void {
    this.col.mutate((current) => {
      const values = current.map((r) => r.value);
      if (values.some((m) => m.makeId === makeId && m.modelId === modelId)) return values; // idempotent
      this.col.assertCanAdd(current, CAP_MESSAGE);
      return [...values, { schemaVersion: SCHEMA_VERSION, makeId, modelId, ajouteLe: new Date().toISOString() }];
    });
  }

  /** Retire un suivi (EX-CRUD-9), depuis l'écran B ou `/suivis`. */
  unfollow(makeId: number, modelId: number): void {
    this.col.mutate((current) =>
      current.filter((r) => !(r.value.makeId === makeId && r.value.modelId === modelId)).map((r) => r.value),
    );
  }

  /** Bascule (EX-CRUD-9). Retourne le nouvel état suivi/non-suivi. Peut lever `CapExceededError`. */
  toggle(makeId: number, modelId: number): boolean {
    if (this.isFollowed(makeId, modelId)) {
      this.unfollow(makeId, modelId);
      return false;
    }
    this.follow(makeId, modelId);
    return true;
  }

  subscribe(onChange: () => void): () => void {
    return subscribeCrossTab(FOLLOWED_MODELS_KEY, onChange);
  }
}

export { CapExceededError, keyOf as followedKeyOf };

export function createFollowedModelStore(backend?: KvBackend): FollowedModelStore {
  return new FollowedModelStore(backend ?? browserLocalStorageBackend() ?? memoryBackend());
}
