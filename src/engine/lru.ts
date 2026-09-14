/**
 * KYCAR — Cache LRU du moteur d'agrégation (lot D4)
 * =================================================================================================
 * Cache à éviction « moins récemment utilisé » (LRU), de capacité fixe 32 (EX-DATA-109,
 * EX-SRCH-9quinquies). Il vit sur le THREAD PRINCIPAL, devant le worker : une sélection déjà
 * calculée n'induit ni aller-retour `postMessage` ni recalcul. La clé est le couple
 * `(localDatasetKey, refineHash)` — c'est-à-dire le `selectionHash` publié `<localDatasetKey>:<refineHash>`
 * (EX-SRCH-9quinquies), stable et canonique (deux sélections sémantiquement identiques → même clé).
 *
 * Implémentation : `Map` d'insertion ordonnée. `get` réinsère l'entrée en fin (la plus récente) ;
 * `set` évince la tête (la plus ancienne) quand la capacité est dépassée. O(1) amorti par opération.
 *
 * Ce module ne s'exécute QUE sur le thread principal (il n'est jamais importé par le worker) : il ne
 * dépend d'aucune globale DOM ni WebWorker, mais il n'a pas vocation à passer sous la lib WebWorker.
 */

/** Capacité fixe du cache de sélection (EX-DATA-109). */
export const LRU_CAPACITY = 32;

/** Compose la clé de cache canonique à partir des deux composantes de hachage (EX-SRCH-9quinquies). */
export function cacheKey(localDatasetKey: string, refineHash: string): string {
  return `${localDatasetKey}:${refineHash}`;
}

/**
 * Cache LRU générique de capacité bornée. `V` est la valeur mémorisée (typiquement le résultat de
 * recalcul complet d'une sélection).
 */
export class LruCache<V> {
  private readonly store = new Map<string, V>();

  constructor(readonly capacity: number = LRU_CAPACITY) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(`LruCache: capacité ${capacity} invalide (entier ≥ 1 attendu)`);
    }
  }

  /** Nombre d'entrées actuellement mémorisées. */
  get size(): number {
    return this.store.size;
  }

  /** Vrai si la clé est présente (sans modifier l'ordre de récence). */
  has(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * Lit une entrée et la marque « la plus récemment utilisée ». Retourne `undefined` si absente
   * (défaut de cache).
   */
  get(key: string): V | undefined {
    const value = this.store.get(key);
    if (value === undefined) return undefined;
    // Réinsertion en fin : devient la plus récente.
    this.store.delete(key);
    this.store.set(key, value);
    return value;
  }

  /**
   * Insère ou met à jour une entrée (devient la plus récente) puis évince les plus anciennes tant
   * que la capacité est dépassée. Retourne les clés évincées, dans l'ordre d'éviction.
   */
  set(key: string, value: V): readonly string[] {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, value);
    const evicted: string[] = [];
    while (this.store.size > this.capacity) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
      evicted.push(oldest);
    }
    return evicted;
  }

  /**
   * Lit une entrée ou la calcule et la mémorise à la volée (défaut de cache). Le factory n'est
   * appelé qu'en cas d'absence.
   */
  getOrCompute(key: string, factory: () => V): V {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = factory();
    this.set(key, value);
    return value;
  }

  /** Vide le cache (ex. changement de snapshot — EX-NAV-23). */
  clear(): void {
    this.store.clear();
  }

  /** Clés présentes, de la plus ancienne à la plus récente (diagnostic/test). */
  keysOldestFirst(): readonly string[] {
    return [...this.store.keys()];
  }
}
