/**
 * KYCAR — `D8-01` / `FV-01` / `E2E-01`..`10`, `13` : le lot colonnaire SURVIT à son envoi au worker.
 * =================================================================================================
 * Ce test est la contrepartie NODE du constat que seule la recette navigateur pouvait prononcer :
 * les sondes de revue pilotent le moteur in-process (`engine-inprocess.ts`), sans `postMessage`,
 * donc sans transfert — elles ne pouvaient structurellement pas voir le détachement.
 *
 * Deux preuves, à la même profondeur que le défaut :
 *  1. un VRAI `Worker` (`node:worker_threads`), qui applique l'algorithme de sérialisation
 *     structurée du HTML — avec une liste de transfert, l'hôte perd ses tampons ; sans, il les
 *     garde. Le test relit, APRÈS l'aller-retour, les colonnes que les écrans D/B lisent
 *     réellement (`priceEur`, `mileageKm`, `firstRegistrationYearMonth`, `sellerType`) ;
 *  2. `structuredClone`, qui est exactement ce que fait `postMessage` sans liste de transfert :
 *     l'original reste intact, la copie porte les mêmes valeurs.
 *
 * Le coût de la copie (une seule par jeu de données, jamais par recalcul) est MESURÉ ici sur un lot
 * de 100 000 lignes et journalisé — c'est le chiffre reporté dans `reports/remediation-2.8/fix-app.md`.
 */
import { Worker } from 'node:worker_threads';
import { describe, expect, it } from 'vitest';

import type { ListingColumnBatch } from '../types/index';

/** Colonnes lues par les écrans après `loadDataset` (échantillon représentatif du défaut FV-01). */
const READ_BACK_COLUMNS = ['priceEur', 'mileageKm', 'firstRegistrationYearMonth', 'sellerType'] as const;

/**
 * Lot colonnaire minimal, de la même FORME que `ListingColumnBatch` (mêmes noms, mêmes types de
 * vues) : ce test porte sur le mécanisme de transport, pas sur le contenu métier. Un vrai lot du
 * provider synthétique passerait par le même chemin — et coûterait 30 s de génération par cas.
 */
function makeBatch(rowCount: number): Record<string, unknown> {
  const i32 = (fill: (i: number) => number): Int32Array => {
    const a = new Int32Array(rowCount);
    for (let i = 0; i < rowCount; i += 1) a[i] = fill(i);
    return a;
  };
  const u8 = (fill: (i: number) => number): Uint8Array => {
    const a = new Uint8Array(rowCount);
    for (let i = 0; i < rowCount; i += 1) a[i] = fill(i);
    return a;
  };
  return {
    snapshotId: 'be-test-0001',
    localDatasetKey: 'TEST',
    rowCount,
    priceEur: i32((i) => 5000 + (i % 30000)),
    mileageKm: i32((i) => (i * 137) % 300000),
    firstRegistrationYearMonth: i32((i) => 201001 + (i % 150)),
    modelId: i32((i) => i % 500),
    makeId: i32((i) => i % 120),
    powerKw: i32((i) => 50 + (i % 200)),
    sellerType: u8((i) => i % 2),
    fuelCategory: u8((i) => i % 5),
    countryCode: u8((i) => i % 3),
    ingestFlags: new Uint32Array(rowCount),
    stringBlob: new Uint8Array(64),
    stringOffsets: new Int32Array(8),
  };
}

/** Vues typées d'un lot (celles qu'une liste de transfert détacherait). */
function buffersOf(batch: Record<string, unknown>): ArrayBuffer[] {
  const seen = new Set<ArrayBuffer>();
  for (const value of Object.values(batch)) {
    if (ArrayBuffer.isView(value)) seen.add(value.buffer as ArrayBuffer);
  }
  return [...seen];
}

/**
 * Aller-retour par un VRAI worker : l'hôte envoie le lot, le worker répond avec le nombre de lignes
 * qu'il a réellement lues. `transfer` reproduit à l'identique l'ancien comportement de
 * `client.ts::loadDataset`.
 */
function roundTrip(
  batch: Record<string, unknown>,
  transfer: readonly ArrayBuffer[],
): Promise<{ rowCount: number; firstPrice: number }> {
  const source = `
    const { parentPort } = require('node:worker_threads');
    parentPort.on('message', (msg) => {
      parentPort.postMessage({ rowCount: msg.batch.rowCount, firstPrice: msg.batch.priceEur[0] });
    });
  `;
  const worker = new Worker(source, { eval: true });
  return new Promise((resolve, reject) => {
    worker.once('message', (m: { rowCount: number; firstPrice: number }) => {
      void worker.terminate();
      resolve(m);
    });
    worker.once('error', (e) => {
      void worker.terminate();
      reject(e instanceof Error ? e : new Error(String(e)));
    });
    worker.postMessage({ kind: 'LOAD_DATASET', batch }, transfer as ArrayBuffer[]);
  });
}

describe('D8-01 / FV-01 — le lot colonnaire reste lisible côté hôte après loadDataset', () => {
  it('AVEC liste de transfert (comportement d’AVANT la correction) : les tampons de l’hôte sont détachés', async () => {
    const batch = makeBatch(2000);
    const received = await roundTrip(batch, buffersOf(batch));
    expect(received.rowCount).toBe(2000);

    // Le worker a bien reçu la donnée…
    expect(received.firstPrice).toBe(5000);
    // …mais l'hôte, lui, ne peut plus rien lire : c'est EXACTEMENT le défaut FV-01/E2E-01.
    const detached = buffersOf(batch).every((b) => b.byteLength === 0);
    expect(detached, 'un transfert détache bien les tampons de l’hôte (prémisse du constat)').toBe(true);
    expect(() => new Int32Array((batch.priceEur as Int32Array).buffer, 0, 1)).toThrow();
  });

  it('SANS liste de transfert (copie structurée, correction D8-01) : l’hôte relit toutes ses colonnes', async () => {
    const batch = makeBatch(2000);
    const received = await roundTrip(batch, []);
    expect(received.rowCount).toBe(2000);
    expect(received.firstPrice).toBe(5000);

    for (const name of READ_BACK_COLUMNS) {
      const view = batch[name] as Int32Array | Uint8Array;
      expect(view.buffer.byteLength, `colonne ${name} détachée`).toBeGreaterThan(0);
      expect(view.length, `colonne ${name} vidée`).toBe(2000);
      // Construction d'une vue sur le tampon : c'est l'opération qui levait
      // « Cannot perform Construct on a detached ArrayBuffer » sur l'écran D.
      expect(() => new Uint8Array(view.buffer, 0, 1)).not.toThrow();
    }
    expect((batch.priceEur as Int32Array)[1999]).toBe(5000 + (1999 % 30000));
    expect((batch.sellerType as Uint8Array)[1999]).toBe(1999 % 2);
  });

  it('structuredClone (le mécanisme même de postMessage sans transfert) : original intact, copie fidèle', () => {
    const batch = makeBatch(5000);
    const copy = structuredClone(batch) as Record<string, unknown>;

    expect((copy.priceEur as Int32Array)[4999]).toBe((batch.priceEur as Int32Array)[4999]);
    expect((copy.priceEur as Int32Array).buffer).not.toBe((batch.priceEur as Int32Array).buffer);
    expect(buffersOf(batch).every((b) => b.byteLength > 0)).toBe(true);
  });

  it('EX-NFR-9 — coût de la copie structurée à 100 000 lignes (une seule fois par jeu de données)', () => {
    const batch = makeBatch(100_000);
    const bytes = buffersOf(batch).reduce((s, b) => s + b.byteLength, 0);

    // Médiane de 5 copies : la mesure sert de budget opposable, pas d'assertion de perf machine.
    const samples: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const t0 = performance.now();
      structuredClone(batch);
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    const median = samples[2] as number;
    console.log(
      `[D8-01 copie structurée] lot 100 000 lignes — ${(bytes / 1024 / 1024).toFixed(2)} Mio de colonnes, ` +
        `copie médiane ${median.toFixed(1)} ms (5 mesures : ${samples.map((s) => s.toFixed(1)).join(', ')} ms)`,
    );
    expect(bytes).toBeGreaterThan(0);
    // Budget D8-01 : « attendu < 100 ms à 100k ». Marge large pour absorber la charge machine.
    expect(median).toBeLessThan(300);
  });
});
