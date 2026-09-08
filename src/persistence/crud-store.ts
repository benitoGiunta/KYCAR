/**
 * KYCAR — Collection CRUD persistée à plafond dur (lot D8, EX-CRUD-5/10/12/18/19)
 * =================================================================================================
 * Générique partagé par les trois collections CRUD (recherches sauvegardées, modèles suivis,
 * historique récent). Stockée en JSON sous une clé `localStorage`. Garanties :
 *   - EX-CRUD-18 : chaque entrée porte `schemaVersion` ; à la lecture, les entrées migrables sont
 *     migrées EN MÉMOIRE et RÉÉCRITES ; aucune entrée n'est jamais supprimée silencieusement.
 *   - EX-CRUD-19 : toute mutation est une relecture-vérification-écriture SYNCHRONE (`mutate`) — on
 *     relit l'état frais juste avant d'écrire, on revérifie le plafond, et on refuse l'écriture en
 *     dépassement plutôt que de réécrire la collection entière à l'aveugle.
 */

import type { KvBackend } from './kv';
import { applyMigrations, type Migration, type SchemaStatus, type Versioned } from './schema';

/** Entrée chargée : la valeur (éventuellement migrée) et son statut de schéma (EX-CRUD-18). */
export interface LoadedRecord<T extends Versioned> {
  readonly value: T;
  readonly status: SchemaStatus;
}

/** Levée quand une écriture dépasserait le plafond dur de la collection (EX-CRUD-5/10). */
export class CapExceededError extends Error {
  readonly cap: number;
  constructor(cap: number, message: string) {
    super(message);
    this.name = 'CapExceededError';
    this.cap = cap;
  }
}

export interface CappedCollectionOptions {
  readonly backend: KvBackend;
  readonly key: string;
  readonly cap: number;
  readonly migrations?: ReadonlyMap<number, Migration>;
}

const NO_MIGRATIONS: ReadonlyMap<number, Migration> = new Map();

export class CappedCollection<T extends Versioned> {
  private readonly backend: KvBackend;
  private readonly key: string;
  readonly cap: number;
  private readonly migrations: ReadonlyMap<number, Migration>;

  constructor(options: CappedCollectionOptions) {
    this.backend = options.backend;
    this.key = options.key;
    this.cap = options.cap;
    this.migrations = options.migrations ?? NO_MIGRATIONS;
  }

  /** Lit les entrées brutes (tableau JSON), sans migration. Tolérant : renvoie `[]` si absent/corrompu. */
  private readRaw(): Record<string, unknown>[] {
    const stored = this.backend.get(this.key);
    if (stored === null) return [];
    try {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
    } catch {
      return [];
    }
  }

  /**
   * Charge et migre. Les entrées migrées sont RÉÉCRITES en version courante (EX-CRUD-18), en une
   * seule passe. Aucune entrée n'est jamais retirée (même « from-newer » ou « legacy-unmigratable »).
   */
  load(): LoadedRecord<T>[] {
    const raw = this.readRaw();
    let mutated = false;
    const records = raw.map((entry) => {
      const { value, status } = applyMigrations(entry, this.migrations);
      if (status.kind === 'migrated') mutated = true;
      return { value: value as unknown as T, status };
    });
    if (mutated) {
      this.backend.set(this.key, JSON.stringify(records.map((r) => r.value)));
    }
    return records;
  }

  /** Valeurs seules, ordre de stockage. */
  values(): T[] {
    return this.load().map((r) => r.value);
  }

  /** Nombre d'entrées OUVRABLES (exclut « from-newer », non ouvrable — EX-CRUD-18). */
  private openableCount(records: LoadedRecord<T>[]): number {
    return records.filter((r) => r.status.kind !== 'from-newer').length;
  }

  /**
   * Relecture-vérification-écriture (EX-CRUD-19). Relit l'état frais, laisse `fn` produire le nouvel
   * état, puis écrit. `fn` peut lever `CapExceededError` pour refuser. La collection entière n'est
   * jamais écrasée à l'aveugle : `fn` part TOUJOURS de l'état relu à l'instant.
   */
  mutate(fn: (current: LoadedRecord<T>[]) => T[]): T[] {
    const current = this.load();
    const next = fn(current);
    this.backend.set(this.key, JSON.stringify(next));
    return next;
  }

  /** Vide entièrement la collection (EX-CRUD-13 pour l'historique). */
  clear(): void {
    this.backend.remove(this.key);
  }

  /** Vérifie le plafond avant un ajout, en comptant les entrées ouvrables fraîchement relues. */
  assertCanAdd(records: LoadedRecord<T>[], message: string): void {
    if (this.openableCount(records) >= this.cap) throw new CapExceededError(this.cap, message);
  }
}
