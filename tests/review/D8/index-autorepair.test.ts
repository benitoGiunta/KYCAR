/**
 * Revue D8 (remédiation 2.8) — sonde `E2E-25` : l'index ordonné d'une collection CRUD est
 * AUTO-RÉPARATEUR (`EX-CRUD-19`, `ADV-13`).
 *
 * Le harnais navigateur (`tests/e2e/persistance.spec.ts::CONSTAT E2E-25`) a mesuré 7 à 8 rondes
 * perdantes sur 8 : deux onglets qui enregistrent au même instant écrivent bien leurs DEUX blobs
 * d'entrée, mais le dernier écrivain écrase l'index du premier — dont l'entrée devient orpheline et
 * disparaît définitivement de l'écran E, sans message. Cette sonde reproduit l'entrelacement exact,
 * hors navigateur, sur deux instances de `CappedCollection` partageant un même backend (deux onglets
 * = deux processus de rendu sur un même `localStorage`).
 *
 * Écrite avant la correction (D-32) : rouge à l'écriture, verte après.
 */
import { describe, expect, it } from 'vitest';

import { CappedCollection, INDEX_KEY_SUFFIX } from '../../../src/persistence/crud-store';
import { memoryBackend, type KvBackend } from '../../../src/persistence/kv';

interface Note extends Record<string, unknown> {
  readonly schemaVersion: number;
  readonly id: string;
  readonly nom: string;
}

const KEY = 'kycar:saved';

function collection(backend: KvBackend): CappedCollection<Note> {
  return new CappedCollection<Note>({ backend, key: KEY, cap: 50, idOf: (v) => v.id });
}

function note(id: string): Note {
  return { schemaVersion: 1, id, nom: `Recherche ${id}` };
}

function indexOf(backend: KvBackend): string[] {
  return JSON.parse(backend.get(`${KEY}${INDEX_KEY_SUFFIX}`) ?? '[]') as string[];
}

function entryKeys(backend: KvBackend): string[] {
  return (backend.keys?.(`${KEY}/`) ?? []) as string[];
}

describe('E2E-25 / EX-CRUD-19 — index ordonné auto-réparateur', () => {
  it('R-D8-25-01 : deux onglets qui écrivent en s’entrelaçant ne perdent aucune entrée de l’index', () => {
    const backend = memoryBackend();
    // Deux instances distinctes : chacune a lu l'état AVANT que l'autre n'écrive (la course réelle).
    const tabA = collection(backend);
    const tabB = collection(backend);

    // Onglet A écrit en premier : entrée + index.
    tabA.mutate(() => [note('a')]);
    // Onglet B a lu l'index AVANT A (il croit la collection vide) et écrit maintenant.
    tabB.mutate((current) => [...current.map((r) => r.value), note('b')]);

    expect(entryKeys(backend).sort()).toEqual([`${KEY}/a`, `${KEY}/b`]);
    expect(indexOf(backend).sort(), 'les deux identifiants doivent être indexés').toEqual(['a', 'b']);
  });

  it('R-D8-25-02 : une entrée orpheline (index écrasé par une course) est réintégrée à la lecture', () => {
    const backend = memoryBackend();
    const store = collection(backend);
    store.mutate(() => [note('a'), note('b')]);

    // Simulation de la course perdue : l'index ne cite plus que `b`, le blob de `a` reste présent.
    backend.set(`${KEY}${INDEX_KEY_SUFFIX}`, JSON.stringify(['b']));

    const ids = collection(backend)
      .values()
      .map((v) => v.id)
      .sort();
    expect(ids, 'la lecture doit retrouver l’entrée orpheline').toEqual(['a', 'b']);

    // …et la première écriture suivante réécrit un index complet (auto-réparation persistée).
    collection(backend).mutate((current) => current.map((r) => r.value));
    expect(indexOf(backend).sort()).toEqual(['a', 'b']);
  });

  it('R-D8-25-03 : huit rondes d’écritures simultanées — autant d’identifiants indexés que de blobs', () => {
    const backend = memoryBackend();
    for (let round = 0; round < 8; round += 1) {
      const tabA = collection(backend);
      const tabB = collection(backend);
      // Chaque onglet ajoute la SIENNE à l'état qu'il relit (sémantique réelle de `create`).
      tabA.mutate((current) => [...current.map((r) => r.value), note(`A${round}`)]);
      tabB.mutate((current) => [...current.map((r) => r.value), note(`B${round}`)]);

      expect(indexOf(backend).length, `ronde ${round}`).toBe(entryKeys(backend).length);
    }
    expect(entryKeys(backend)).toHaveLength(16);
  });

  it('R-D8-25-04 : `clear()` retire aussi les entrées que l’index ne citait pas (aucune clé fantôme)', () => {
    const backend = memoryBackend();
    const store = collection(backend);
    store.mutate(() => [note('a'), note('b')]);
    backend.set(`${KEY}${INDEX_KEY_SUFFIX}`, JSON.stringify(['b']));

    collection(backend).clear();
    expect(entryKeys(backend)).toEqual([]);
  });

  it('R-D8-25-05 : un backend sans énumération garde le comportement antérieur (aucune erreur)', () => {
    const inner = memoryBackend();
    const noKeys: KvBackend = { get: inner.get, set: inner.set, remove: inner.remove };
    const store = new CappedCollection<Note>({ backend: noKeys, key: KEY, cap: 50, idOf: (v) => v.id });
    store.mutate(() => [note('a')]);
    expect(store.values().map((v) => v.id)).toEqual(['a']);
  });
});
