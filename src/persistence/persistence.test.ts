/**
 * KYCAR — Tests de la persistance locale (lot D8)
 * =================================================================================================
 * Environnement vitest `node` : pas de `localStorage` ni de `window`. On injecte `memoryBackend()`
 * (et, pour deux « onglets », un MÊME backend partagé) pour exercer la logique de plafond, la
 * relecture-vérification-écriture (EX-CRUD-19), le FIFO (EX-CRUD-12), la migration (EX-CRUD-18) et
 * les invariants de figement (ARB-45).
 */

import { describe, expect, it } from 'vitest';

import { memoryBackend } from './kv';
import { applyMigrations, SCHEMA_VERSION, type Migration } from './schema';
import { SavedSearchStore, CapExceededError, deriveMode, SAVED_SEARCHES_CAP } from './saved-searches';
import { FollowedModelStore, FOLLOWED_MODELS_CAP } from './followed-models';
import { RecentHistoryStore, RECENT_HISTORY_CAP } from './recent-history';
import { createMemorySnapshotCache } from './snapshot-cache';
import { createMemoryBaselineCache } from './baseline-cache';
import { SAVED_SEARCHES_KEY } from './saved-searches';
import { INDEX_KEY_SUFFIX } from './crud-store';

describe('schema / migration (EX-CRUD-18)', () => {
  it('laisse une entrée à la version courante telle quelle', () => {
    const { status } = applyMigrations({ schemaVersion: SCHEMA_VERSION, a: 1 }, new Map());
    expect(status.kind).toBe('current');
  });

  it('migre une entrée antérieure quand une migration existe et réécrit en version courante', () => {
    const migrations = new Map<number, Migration>([[0, (r) => ({ ...r, migrated: true })]]);
    const { value, status } = applyMigrations({ schemaVersion: 0, a: 1 }, migrations);
    expect(status).toEqual({ kind: 'migrated', from: 0 });
    expect(value.migrated).toBe(true);
    expect(value.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('conserve (sans supprimer) une entrée antérieure non migrable', () => {
    const { status } = applyMigrations({ schemaVersion: 0 }, new Map());
    expect(status.kind).toBe('legacy-unmigratable');
  });

  it('conserve mais ne migre pas une entrée d’une version plus récente', () => {
    const { status } = applyMigrations({ schemaVersion: SCHEMA_VERSION + 5 }, new Map());
    expect(status).toEqual({ kind: 'from-newer', version: SCHEMA_VERSION + 5 });
  });
});

describe('recherches sauvegardées (EX-CRUD-1..6)', () => {
  it('dérive le mode 2 d’une route d’écran B et le mode 1 d’une route de marché', () => {
    expect(deriveMode('/marche/16-opel/1174-corsa?km_max=100000')).toBe(2);
    expect(deriveMode('/marche?prix_max=10000')).toBe(1);
  });

  it('crée une recherche avec effectifInitial et snapshotInitial figés', () => {
    const store = new SavedSearchStore(memoryBackend());
    const s = store.create({ nom: '  Diesel récents  ', url: '/marche?carburant=diesel', effectifInitial: 4211, snapshotInitial: 'snap-1' });
    expect(s.nom).toBe('Diesel récents'); // trim EX-CRUD-2
    expect(s.effectifInitial).toBe(4211);
    expect(s.snapshotInitial).toBe('snap-1');
    expect(store.list()).toHaveLength(1);
  });

  it('ne réécrit JAMAIS effectifInitial/snapshotInitial au renommage ni à l’ouverture (ARB-45)', () => {
    const store = new SavedSearchStore(memoryBackend());
    const s = store.create({ nom: 'A', url: '/marche', effectifInitial: 100, snapshotInitial: 'snap-1' });
    store.rename(s.id, 'B');
    store.touch(s.id);
    const after = store.list()[0]!.value;
    expect(after.nom).toBe('B');
    expect(after.effectifInitial).toBe(100);
    expect(after.snapshotInitial).toBe('snap-1');
    expect(after.dernierAccesLe >= s.dernierAccesLe).toBe(true);
  });

  it('refuse le nom vide et le nom > 60 caractères', () => {
    const store = new SavedSearchStore(memoryBackend());
    expect(() => store.create({ nom: '   ', url: '/marche', effectifInitial: 0, snapshotInitial: 's' })).toThrow();
    expect(() => store.create({ nom: 'x'.repeat(61), url: '/marche', effectifInitial: 0, snapshotInitial: 's' })).toThrow();
  });

  it('bloque la création au-delà de 50 (EX-CRUD-5) sans perdre les existantes', () => {
    const store = new SavedSearchStore(memoryBackend());
    for (let i = 0; i < SAVED_SEARCHES_CAP; i++) store.create({ nom: `s${i}`, url: '/marche', effectifInitial: i, snapshotInitial: 's' });
    expect(store.list()).toHaveLength(SAVED_SEARCHES_CAP);
    expect(() => store.create({ nom: 'overflow', url: '/marche', effectifInitial: 0, snapshotInitial: 's' })).toThrow(CapExceededError);
    expect(store.list()).toHaveLength(SAVED_SEARCHES_CAP);
  });
});

describe('concurrence inter-onglets — relecture-vérification-écriture (EX-CRUD-19)', () => {
  it('refuse le dépassement de plafond quand un second onglet a rempli la collection entre-temps', () => {
    const shared = memoryBackend(); // un seul localStorage partagé par deux onglets
    const tabA = new SavedSearchStore(shared);
    const tabB = new SavedSearchStore(shared);
    // L'onglet A lit une collection presque pleine (49), puis l'onglet B ajoute la 50e.
    for (let i = 0; i < SAVED_SEARCHES_CAP - 1; i++) tabA.create({ nom: `a${i}`, url: '/marche', effectifInitial: i, snapshotInitial: 's' });
    tabB.create({ nom: 'b-fills-cap', url: '/marche', effectifInitial: 0, snapshotInitial: 's' });
    expect(tabB.list()).toHaveLength(SAVED_SEARCHES_CAP);
    // L'onglet A tente d'ajouter : sa mutation relit l'état FRAIS (50) et refuse (jamais 51).
    expect(() => tabA.create({ nom: 'a-overflow', url: '/marche', effectifInitial: 0, snapshotInitial: 's' })).toThrow(CapExceededError);
    expect(tabA.list()).toHaveLength(SAVED_SEARCHES_CAP);
  });

  it('deux écritures concurrentes ne font perdre aucune entrée existante', () => {
    const shared = memoryBackend();
    const tabA = new FollowedModelStore(shared);
    const tabB = new FollowedModelStore(shared);
    tabA.follow(1, 10);
    tabB.follow(2, 20); // relit l'entrée de A avant d'écrire
    expect(new FollowedModelStore(shared).list()).toHaveLength(2);
  });
});

describe('modèles suivis (EX-CRUD-7..10)', () => {
  it('bascule, est idempotent sur doublon, et refuse au-delà de 30', () => {
    const store = new FollowedModelStore(memoryBackend());
    expect(store.toggle(1, 10)).toBe(true);
    expect(store.isFollowed(1, 10)).toBe(true);
    store.follow(1, 10); // idempotent
    expect(store.list()).toHaveLength(1);
    expect(store.toggle(1, 10)).toBe(false);
    expect(store.isFollowed(1, 10)).toBe(false);

    for (let i = 0; i < FOLLOWED_MODELS_CAP; i++) store.follow(100 + i, 1);
    expect(store.list()).toHaveLength(FOLLOWED_MODELS_CAP);
    expect(() => store.follow(999, 1)).toThrow(CapExceededError);
  });
});

describe('historique récent (EX-CRUD-11..13)', () => {
  it('insère en tête, ignore l’URL identique au précédent, et tronque à 10 (FIFO silencieux)', () => {
    const store = new RecentHistoryStore(memoryBackend());
    store.visit('/marche?a=1');
    store.visit('/marche?a=1'); // identique au précédent → ignoré
    expect(store.list()).toHaveLength(1);
    for (let i = 0; i < 15; i++) store.visit(`/marche?n=${i}`);
    const entries = store.list();
    expect(entries).toHaveLength(RECENT_HISTORY_CAP);
    expect(entries[0]!.value.url).toBe('/marche?n=14'); // le plus récent en tête
    store.clear();
    expect(store.list()).toHaveLength(0);
  });
});

describe('cache de snapshot mémoire (EX-NFR-22)', () => {
  it('relit ce qui a été écrit, et démarre à null', async () => {
    const cache = createMemorySnapshotCache();
    expect(await cache.read()).toBeNull();
    const snap = {
      descriptor: { snapshotId: 'x' } as never,
      baseline: { snapshotId: 'x', selection: '', selectionCount: 0, rows: [] } as never,
      storedAt: '2026-09-08T00:00:00Z',
    };
    await cache.write(snap);
    expect(await cache.read()).toBe(snap);
  });
});

describe('D-16 / DR-096 — une clé par entrée plus un index ordonné', () => {
  it('écrit `kycar:saved-searches/<id>` et l’index, jamais la collection entière', () => {
    const backend = memoryBackend();
    const store = new SavedSearchStore(backend);
    const created = store.create({ nom: 'a', url: '/marche', effectifInitial: 1, snapshotInitial: 's' });
    expect(backend.get(`${SAVED_SEARCHES_KEY}/${created.id}`)).not.toBeNull();
    expect(JSON.parse(backend.get(`${SAVED_SEARCHES_KEY}${INDEX_KEY_SUFFIX}`) ?? '[]')).toEqual([created.id]);
    // La clé « collection entière » du format historique n'est jamais créée par une écriture neuve.
    expect(backend.get(SAVED_SEARCHES_KEY)).toBeNull();
    store.remove(created.id);
    expect(backend.get(`${SAVED_SEARCHES_KEY}/${created.id}`)).toBeNull();
    expect(store.list()).toHaveLength(0);
  });
});

describe('D-29 — cache de baseline injectable (point d’injection `baselineCache`)', () => {
  it('le cache mémoire rend ce qu’il a mémorisé et s’hydrate sans lever', async () => {
    const cache = createMemoryBaselineCache<{ n: number }>();
    expect(cache.get('k')).toBeUndefined();
    cache.set('k', { n: 1 });
    await cache.hydrate();
    expect(cache.get('k')).toEqual({ n: 1 });
  });
});
