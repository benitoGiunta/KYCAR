/**
 * KYCAR — Adaptateur de stockage clé/valeur synchrone (lot D8)
 * =================================================================================================
 * Les collections CRUD (recherches sauvegardées, modèles suivis, historique récent) vivent dans
 * `localStorage` : c'est le seul stockage local qui, sur une même origine, émet l'événement `storage`
 * exigé par EX-CRUD-19 pour le rafraîchissement inter-onglets, et sur lequel une relecture-
 * vérification-écriture synchrone (plafond dur d'EX-CRUD-5/10/12) est directement réalisable —
 * IndexedDB n'offre ni l'un ni l'autre nativement. Le cache de snapshot (payload volumineux,
 * EX-NFR-22) reste, lui, dans IndexedDB (voir `snapshot-cache.ts`).
 *
 * Ce module abstrait le backend derrière `KvBackend` pour que la logique de plafond/FIFO/migration
 * soit testable en Node (vitest, environnement `node`, sans `window`) via `memoryBackend()`.
 */

/** Backend clé/valeur synchrone minimal. `localStorage` en satisfait la forme. */
export interface KvBackend {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** Backend mémoire pour les tests et le repli quand `localStorage` est indisponible. */
export function memoryBackend(seed?: Readonly<Record<string, string>>): KvBackend {
  const map = new Map<string, string>(seed ? Object.entries(seed) : undefined);
  return {
    get: (k) => map.get(k) ?? null,
    set: (k, v) => {
      map.set(k, v);
    },
    remove: (k) => {
      map.delete(k);
    },
  };
}

/**
 * Backend `localStorage` du navigateur, ou `null` si indisponible (SSR, Node, mode privé strict).
 * L'appelant bascule alors sur `memoryBackend()` (persistance perdue mais app fonctionnelle).
 */
export function browserLocalStorageBackend(): KvBackend | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    // Sonde d'accès (certains navigateurs jettent en mode privé).
    const probe = '__kycar_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return {
      get: (k) => localStorage.getItem(k),
      set: (k, v) => localStorage.setItem(k, v),
      remove: (k) => localStorage.removeItem(k),
    };
  } catch {
    return null;
  }
}

/**
 * S'abonne aux changements d'une clé venus d'un AUTRE onglet (EX-CRUD-19). Retourne une fonction de
 * désabonnement. No-op hors navigateur. `window.storage` ne se déclenche que pour les autres onglets,
 * ce qui est exactement le besoin : un onglet rafraîchit sa liste quand un autre écrit.
 */
export function subscribeCrossTab(key: string, onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return () => undefined;
  }
  const handler = (e: StorageEvent): void => {
    if (e.key === null || e.key === key) onChange();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
