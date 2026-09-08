/**
 * Revue D8 — sonde n°4 : PERSISTANCE LOCALE (EX-CRUD-5/10/12/18/19, EX-NFR-22/24/27, ADV-13).
 *
 * Plafonds de l'annexe C : 50 recherches (EX-CRUD-5), 30 modèles suivis (EX-CRUD-10), 10 entrées
 * d'historique (EX-CRUD-12). Concurrence inter-onglets simulée par un MÊME backend partagé et par une
 * interposition entre la relecture et l'écriture (ADV-13 : le seul entrelacement que `localStorage`
 * ne garantit pas). Migration n−1 → n, version inconnue, données corrompues, quota dépassé,
 * IndexedDB indisponible (mode privé).
 */
import { afterEach, describe, expect, it } from 'vitest';

import { CappedCollection, applyMigrations, SCHEMA_VERSION, memoryBackend, subscribeCrossTab, type KvBackend, type Migration } from '../../../src/persistence/index';
import { SavedSearchStore, SAVED_SEARCHES_CAP, SAVED_SEARCHES_KEY, CAP_MESSAGE as SAVED_CAP_MESSAGE, CapExceededError } from '../../../src/persistence/saved-searches';
import { FollowedModelStore, FOLLOWED_MODELS_CAP, FOLLOWED_MODELS_KEY, CAP_MESSAGE as FOLLOWED_CAP_MESSAGE } from '../../../src/persistence/followed-models';
import { RecentHistoryStore, RECENT_HISTORY_CAP } from '../../../src/persistence/recent-history';
import { PreferencesStore, DEFAULT_PREFERENCES } from '../../../src/persistence/preferences';
import { createIndexedDbSnapshotCache } from '../../../src/persistence/snapshot-cache';
import type { CachedSnapshot } from '../../../src/orchestration/data-controller';

const mk = (i: number) => ({ nom: `s${i}`, url: `/marche?priceto=${i}`, effectifInitial: i, snapshotInitial: 'snap' });

describe('plafonds de l’annexe C (EX-CRUD-5 / 10 / 12)', () => {
  it('les constantes valent exactement 50 / 30 / 10', () => {
    expect(SAVED_SEARCHES_CAP).toBe(50);
    expect(FOLLOWED_MODELS_CAP).toBe(30);
    expect(RECENT_HISTORY_CAP).toBe(10);
  });

  it('51e recherche refusée avec le message de plafond, sans rien perdre ; 31e suivi refusé ; 11e visite évince la plus ancienne en silence', () => {
    const saved = new SavedSearchStore(memoryBackend());
    for (let i = 0; i < 50; i += 1) saved.create(mk(i));
    expect(() => saved.create(mk(50))).toThrow(CapExceededError);
    expect(() => saved.create(mk(50))).toThrow(SAVED_CAP_MESSAGE);
    expect(SAVED_CAP_MESSAGE).toMatch(/50/);
    expect(saved.list()).toHaveLength(50);

    const followed = new FollowedModelStore(memoryBackend());
    for (let i = 1; i <= 30; i += 1) followed.follow(i, 1);
    expect(() => followed.follow(31, 1)).toThrow(FOLLOWED_CAP_MESSAGE);
    expect(FOLLOWED_CAP_MESSAGE).toMatch(/30/);
    expect(followed.list()).toHaveLength(30);

    const recent = new RecentHistoryStore(memoryBackend());
    for (let i = 0; i < 11; i += 1) recent.visit(`/marche?n=${i}`);
    const urls = recent.list().map((r) => r.value.url);
    expect(urls).toHaveLength(10);
    expect(urls[0]).toBe('/marche?n=10');
    expect(urls).not.toContain('/marche?n=0');
  });

  it('EX-NFR-27 : aucune expiration — une entrée datée d’il y a 10 ans est toujours listée', () => {
    const backend = memoryBackend({
      [SAVED_SEARCHES_KEY]: JSON.stringify([{ ...mk(1), schemaVersion: SCHEMA_VERSION, id: 'old', mode: 1, creeeLe: '2016-01-01T00:00:00Z', dernierAccesLe: '2016-01-01T00:00:00Z' }]),
    });
    expect(new SavedSearchStore(backend).list()).toHaveLength(1);
  });
});

describe('ADV-13 / EX-CRUD-19 — concurrence inter-onglets', () => {
  it('plafond : l’onglet A, parti d’un état à 49, relit 50 (écrit par B) juste avant d’écrire et refuse', () => {
    const shared = memoryBackend();
    const a = new SavedSearchStore(shared);
    const b = new SavedSearchStore(shared);
    for (let i = 0; i < 49; i += 1) a.create(mk(i));
    b.create(mk(100));
    expect(() => a.create(mk(101))).toThrow(CapExceededError);
    expect(new SavedSearchStore(shared).list()).toHaveLength(50);
  });

  it('R-D8-10 — perte d’écriture : si l’onglet B écrit ENTRE la relecture de A et l’écriture de A, l’entrée de B est perdue (la collection entière est réécrite)', () => {
    const shared = memoryBackend();
    // Backend « onglet A » : à la première écriture, on intercale une écriture de l'onglet B sur le
    // vrai stockage — c'est l'entrelacement lire(A) → écrire(B) → écrire(A) qu'ADV-13 décrit.
    let interposed = false;
    const tabB = new FollowedModelStore(shared);
    const backendA: KvBackend = {
      get: (k) => shared.get(k),
      remove: (k) => shared.remove(k),
      set: (k, v) => {
        if (!interposed) {
          interposed = true;
          tabB.follow(2, 20);
        }
        shared.set(k, v);
      },
    };
    const tabA = new FollowedModelStore(backendA);
    tabA.follow(1, 10);
    const after = new FollowedModelStore(shared).list().map((r) => `${r.value.makeId}:${r.value.modelId}`);
    expect(after).toContain('1:10');
    expect(after).toContain('2:20'); // EX-CRUD-19 : « ne peuvent jamais faire perdre une entrée existante »
  });

  it('événement `storage` : chaque onglet rafraîchit sur la clé de la collection (ou sur un effacement global), pas sur une autre clé', () => {
    type Listener = (e: { key: string | null }) => void;
    const listeners = new Set<Listener>();
    const fakeWindow = {
      addEventListener: (_t: string, l: Listener) => listeners.add(l),
      removeEventListener: (_t: string, l: Listener) => listeners.delete(l),
    };
    const g = globalThis as { window?: unknown };
    const saved = g.window;
    g.window = fakeWindow;
    try {
      let hits = 0;
      const unsubscribe = subscribeCrossTab(FOLLOWED_MODELS_KEY, () => {
        hits += 1;
      });
      for (const l of listeners) l({ key: FOLLOWED_MODELS_KEY });
      for (const l of listeners) l({ key: SAVED_SEARCHES_KEY });
      for (const l of listeners) l({ key: null });
      expect(hits).toBe(2);
      unsubscribe();
      expect(listeners.size).toBe(0);
    } finally {
      g.window = saved;
    }
  });
});

describe('EX-CRUD-18 — schemaVersion et migration', () => {
  it('n−1 → n avec migration : migrée en mémoire ET réécrite en version courante dans le stockage', () => {
    const backend = memoryBackend({ 'k': JSON.stringify([{ schemaVersion: SCHEMA_VERSION - 1, legacyName: 'x' }]) });
    const migrations = new Map<number, Migration>([[SCHEMA_VERSION - 1, (r) => ({ ...r, nom: r.legacyName })]]);
    const col = new CappedCollection<{ schemaVersion: number; nom?: string }>({ backend, key: 'k', cap: 50, migrations });
    const loaded = col.load();
    expect(loaded[0]?.status).toEqual({ kind: 'migrated', from: SCHEMA_VERSION - 1 });
    expect(loaded[0]?.value.nom).toBe('x');
    const stored = JSON.parse(backend.get('k') ?? '[]') as { schemaVersion: number }[];
    expect(stored[0]?.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('n−1 sans migration (cas réel : les trois banques n’enregistrent AUCUNE migration) : conservée, utilisable, « à vérifier », jamais réécrite', () => {
    const raw = [{ ...mk(1), schemaVersion: 0, id: 'legacy', mode: 1, creeeLe: '2026-01-01', dernierAccesLe: '2026-01-01' }];
    const backend = memoryBackend({ [SAVED_SEARCHES_KEY]: JSON.stringify(raw) });
    const store = new SavedSearchStore(backend);
    const list = store.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.status).toEqual({ kind: 'legacy-unmigratable', from: 0 });
    expect(backend.get(SAVED_SEARCHES_KEY)).toBe(JSON.stringify(raw));
    store.create(mk(2)); // une écriture ultérieure conserve l'entrée legacy
    expect(store.list().map((r) => r.value.id)).toContain('legacy');
  });

  it('version inconnue (supérieure) : conservée, non ouvrable, exclue du décompte de plafond', () => {
    const raw = [{ ...mk(1), schemaVersion: SCHEMA_VERSION + 7, id: 'future', mode: 1, creeeLe: '2030-01-01', dernierAccesLe: '2030-01-01' }];
    const store = new SavedSearchStore(memoryBackend({ [SAVED_SEARCHES_KEY]: JSON.stringify(raw) }));
    expect(store.list()[0]?.status).toEqual({ kind: 'from-newer', version: SCHEMA_VERSION + 7 });
    for (let i = 0; i < 50; i += 1) store.create(mk(i));
    expect(store.list()).toHaveLength(51); // 50 ouvrables + 1 conservée non ouvrable
    expect(() => store.create(mk(99))).toThrow(CapExceededError);
  });

  it('applyMigrations : un enregistrement sans schemaVersion est traité comme version 0', () => {
    expect(applyMigrations({ nom: 'x' }, new Map()).status).toEqual({ kind: 'legacy-unmigratable', from: 0 });
  });

  it('R-D8-11 — blob corrompu (JSON invalide) : la première écriture l’ÉCRASE silencieusement au lieu de le préserver ou de refuser', () => {
    const backend = memoryBackend({ [SAVED_SEARCHES_KEY]: '{not json' });
    const store = new SavedSearchStore(backend);
    expect(store.list()).toEqual([]); // illisible → liste vide (acceptable en lecture)
    expect(() => store.create(mk(1))).toThrow(); // EX-CRUD-18 : « aucune entrée n'est jamais supprimée silencieusement »
  });

  it('R-D8-12 — entrée `null` dans la collection : list() lève une TypeError (écran E/F inutilisable) au lieu de conserver et marquer', () => {
    const store = new SavedSearchStore(memoryBackend({ [SAVED_SEARCHES_KEY]: '[null, 42]' }));
    expect(() => store.list()).not.toThrow();
  });
});

describe('quota dépassé (QuotaExceededError simulé)', () => {
  function quotaBackend(): KvBackend {
    const inner = memoryBackend();
    return {
      get: (k) => inner.get(k),
      remove: (k) => inner.remove(k),
      set: () => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      },
    };
  }

  it('création d’une recherche : l’erreur remonte (message affichable), la collection reste intacte', () => {
    const store = new SavedSearchStore(quotaBackend());
    expect(() => store.create(mk(1))).toThrow(/quota/i);
    expect(store.list()).toHaveLength(0);
  });

  it('R-D8-13 — historique automatique (EX-CRUD-11/12, « silencieux ») : visit() lève au lieu d’absorber l’échec de quota', () => {
    const store = new RecentHistoryStore(quotaBackend());
    expect(() => store.visit('/marche?priceto=1')).not.toThrow();
  });
});

describe('IndexedDB indisponible (EX-NFR-22, mode privé)', () => {
  const g = globalThis as { indexedDB?: unknown };
  const original = g.indexedDB;
  afterEach(() => {
    g.indexedDB = original;
  });
  const snapshot: CachedSnapshot = {
    descriptor: { snapshotId: 'x' } as unknown as CachedSnapshot['descriptor'],
    baseline: { snapshotId: 'x', selection: 'FULL:EMPTY', selectionCount: 0, rows: [], unsupportedFilterIds: [] },
    storedAt: '2026-09-08T00:00:00Z',
  };

  it('`indexedDB` absent : repli mémoire — le contrat SnapshotCache reste honoré (écriture puis lecture)', async () => {
    g.indexedDB = undefined;
    const cache = createIndexedDbSnapshotCache();
    expect(await cache.read()).toBeNull();
    await cache.write(snapshot);
    expect(await cache.read()).toBe(snapshot);
  });

  it('`indexedDB.open` qui lève (mode privé strict) : read() → null, write() ne lève pas', async () => {
    g.indexedDB = {
      open: () => {
        throw new DOMException('InvalidStateError', 'InvalidStateError');
      },
    };
    const cache = createIndexedDbSnapshotCache();
    await expect(cache.write(snapshot)).resolves.toBeUndefined();
    expect(await cache.read()).toBeNull();
  });
});

describe('préférences', () => {
  it('JSON corrompu → défauts ; write fusionne et force schemaVersion', () => {
    const backend = memoryBackend({ 'kycar:preferences': '###' });
    const store = new PreferencesStore(backend);
    expect(store.read()).toEqual(DEFAULT_PREFERENCES);
    const next = store.write({ sortField: 'prix' });
    expect(next.sortField).toBe('prix');
    expect(next.schemaVersion).toBe(SCHEMA_VERSION);
    expect(store.read().sortDirection).toBe(DEFAULT_PREFERENCES.sortDirection);
  });
});
