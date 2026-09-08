import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildReferenceData,
  type RawFilters,
  type RawFiltersScope,
  type RawReferenceFile,
  type RawTaxonomy,
  type ReferenceData,
} from '../../types/reference';
import { servesMode2 } from '../DataProvider';
import type { ListingColumnBatch } from '../DataProvider';
import { NUMERIC_UNKNOWN } from '../../types/sentinels';
import { SyntheticDataProvider } from './SyntheticDataProvider';
import { batchByteLength } from './columnar';
import type { InjectedOutlier } from './generate';

/**
 * Suite de vérification exécutable du lot D3. Charge les VRAIS référentiels du dépôt via
 * `import.meta.glob` (même mécanisme que `reference.test.ts` de D2), puis contrôle les six critères
 * de succès : build/déterminisme/taille/mode 2/outliers/étiquetage SYNTHETIC.
 */

const taxonomyMod = import.meta.glob('../../../data/reference/taxonomy.json', { eager: true, import: 'default' });
const filtersMod = import.meta.glob('../../../data/reference/filters.json', { eager: true, import: 'default' });
const scopeMod = import.meta.glob('../../../data/reference/filters-scope.json', { eager: true, import: 'default' });
const refMods = import.meta.glob('../../../data/reference/references/*.json', { eager: true, import: 'default' });

function loadReference(): ReferenceData {
  const taxonomy = Object.values(taxonomyMod)[0] as RawTaxonomy;
  const filters = Object.values(filtersMod)[0] as RawFilters;
  const filtersScope = Object.values(scopeMod)[0] as RawFiltersScope;
  const referenceFiles: Record<string, RawReferenceFile> = {};
  for (const [path, mod] of Object.entries(refMods)) {
    if (path.endsWith('_index.json')) continue;
    const file = mod as RawReferenceFile;
    referenceFiles[file.referenceType] = file;
  }
  return buildReferenceData({ taxonomy, referenceFiles, filters, filtersScope });
}

/** Sérialise un lot en un seul buffer binaire compact (colonnes + zone de chaînes) pour le gzip. */
function serializeBatch(batch: ListingColumnBatch): Uint8Array {
  const views: ArrayBufferView[] = [];
  for (const value of Object.values(batch)) {
    if (ArrayBuffer.isView(value)) views.push(value);
  }
  const total = views.reduce((a, v) => a + v.byteLength, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const v of views) {
    out.set(new Uint8Array(v.buffer, v.byteOffset, v.byteLength), cursor);
    cursor += v.byteLength;
  }
  return out;
}

/** Compresse un buffer via l'API web `CompressionStream` (disponible en environnement node de test). */
async function gzipSize(data: Uint8Array): Promise<number> {
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  void writer.write(data);
  void writer.close();
  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return chunks.reduce((a, c) => a + c.byteLength, 0);
}

/** Fences de Tukey (k=1,5) sur un tableau de valeurs. */
function tukeyFences(values: number[], k = 1.5): { lo: number; hi: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p: number): number => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))] as number;
  const q1 = q(0.25);
  const q3 = q(0.75);
  const iqr = q3 - q1;
  return { lo: q1 - k * iqr, hi: q3 + k * iqr };
}

let ref: ReferenceData;

beforeAll(() => {
  ref = loadReference();
});

describe('SyntheticDataProvider — capacités et étiquetage', () => {
  it('déclare SYNTHETIC / LISTINGS / mode2 SERVED, et servesMode2() vaut true', () => {
    const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: 1000 });
    const caps = provider.describe();
    expect(caps.sourceKind).toBe('SYNTHETIC');
    expect(caps.mode1.source).toBe('LISTINGS');
    expect(caps.mode2.kind).toBe('SERVED');
    if (caps.mode2.kind === 'SERVED') expect(caps.mode2.maxSampleSize).toBeNull();
    expect(servesMode2(provider)).toBe(true);
  });

  it('propage sourceKind = SYNTHETIC jusqu’au SnapshotDescriptor (EX-DATA-107)', async () => {
    const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: 1000 });
    const handle = await provider.openSnapshot();
    expect(handle.descriptor.sourceKind).toBe('SYNTHETIC');
    expect(handle.descriptor.listingCount).toBe(1000);
    expect(handle.descriptor.announcedListingCount).toBe(1000);
    expect(handle.descriptor.marketplace).toBe('be');
  });
});

describe('SyntheticDataProvider — déterminisme (graine fixée)', () => {
  it('deux générations à même graine sont identiques octet à octet', async () => {
    const a = new SyntheticDataProvider({ referenceData: ref, listingCount: 5000, seed: 12345 });
    const b = new SyntheticDataProvider({ referenceData: ref, listingCount: 5000, seed: 12345 });
    await a.openSnapshot();
    await b.openSnapshot();
    const ba = serializeBatch(a.getDataset().batch);
    const bb = serializeBatch(b.getDataset().batch);
    expect(ba.length).toBe(bb.length);
    expect(Buffer.from(ba).equals(Buffer.from(bb))).toBe(true);
    // Vérité terrain identique elle aussi.
    expect(JSON.stringify(a.getGroundTruthOutliers())).toBe(JSON.stringify(b.getGroundTruthOutliers()));
  });

  it('une graine différente produit un dataset différent', async () => {
    const a = new SyntheticDataProvider({ referenceData: ref, listingCount: 5000, seed: 1 });
    const b = new SyntheticDataProvider({ referenceData: ref, listingCount: 5000, seed: 2 });
    await a.openSnapshot();
    await b.openSnapshot();
    const ba = serializeBatch(a.getDataset().batch);
    const bb = serializeBatch(b.getDataset().batch);
    expect(Buffer.from(ba).equals(Buffer.from(bb))).toBe(false);
  });
});

describe('SyntheticDataProvider — mode 1 (agrégats)', () => {
  it('les agrégats de base couvrent la taxonomie et somment à N (I1)', async () => {
    const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: 20000, seed: 7 });
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);
    expect(baseline.selectionCount).toBe(20000);
    const total = baseline.rows.reduce((a, r) => a + r.listingCount, 0);
    expect(total).toBe(20000);
    // Métriques entières bornées (EX-DATA-111) et percentiles ordonnés.
    const top = baseline.rows[0];
    expect(top).toBeDefined();
    if (top && top.price.n > 0) {
      expect(Number.isInteger(top.price.p50)).toBe(true);
      expect(top.price.min as number).toBeLessThanOrEqual(top.price.p50 as number);
      expect(top.price.p50 as number).toBeLessThanOrEqual(top.price.max as number);
    }
    // Couverture publiée seulement pour la sélection vide.
    expect(top?.sampleCoverage).toBe(1);
  });

  it('filtre correctement une sélection make= et compte la sélection', async () => {
    const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: 20000, seed: 7 });
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const someMake = baseline.rows[0]?.makeId as number;
    const selection = `make=${someMake}`;
    const count = await provider.fetchSelectionCount(handle, selection);
    expect(count).toBe(baseline.rows[0]?.listingCount);
    const agg = await provider.fetchAggregates(handle, selection, 'MAKE');
    expect(agg.rows).toHaveLength(1);
    expect(agg.rows[0]?.makeId).toBe(someMake);
    expect(agg.selectionCount).toBe(count);
    expect(agg.rows[0]?.sampleCoverage).toBeNull();
  });
});

describe('SyntheticDataProvider — mode 2 (échantillon fin)', () => {
  it('fetchListingColumns(FULL) rend le lot complet étiqueté FULL, sans colonne vendeur (R3)', async () => {
    const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: 3000, seed: 7 });
    const handle = await provider.openSnapshot();
    expect(servesMode2(provider)).toBe(true);
    const batch = await provider.fetchListingColumns(handle, 'FULL');
    expect(batch.rowCount).toBe(3000);
    expect(batch.localDatasetKey).toBe('FULL');
    const keys = Object.keys(batch);
    for (const forbidden of ['sellerId', 'zip', 'zipCode', 'city', 'phone', 'email', 'street', 'lat', 'lon']) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it('fetchListingsByIds retrouve des annonces par identifiant', async () => {
    const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: 3000, seed: 7 });
    const handle = await provider.openSnapshot();
    const outliers = provider.getGroundTruthOutliers();
    const ids = outliers.slice(0, 5).map((o) => o.listingId);
    const batch = await provider.fetchListingsByIds(handle, ids);
    expect(batch.rowCount).toBe(ids.length);
  });
});

describe('SyntheticDataProvider — outliers injectés (vérité terrain)', () => {
  let provider: SyntheticDataProvider;
  let outliers: readonly InjectedOutlier[];
  let batch: ListingColumnBatch;

  beforeAll(async () => {
    provider = new SyntheticDataProvider({ referenceData: ref, listingCount: 60000, seed: 7 });
    await provider.openSnapshot();
    outliers = provider.getGroundTruthOutliers();
    batch = provider.getDataset().batch;
  });

  it('émet une vérité terrain non vide, et le prix stocké est bien le prix injecté', () => {
    expect(outliers.length).toBeGreaterThan(50);
    for (const o of outliers) {
      expect(batch.priceEur[o.rowIndex]).toBe(o.injectedPriceEur);
      expect(o.injectedPriceEur).not.toBe(o.fairPriceEur);
      expect(o.injectedPriceEur).toBeGreaterThanOrEqual(1);
      expect(o.injectedPriceEur).toBeLessThanOrEqual(5_000_000);
    }
  });

  it('les outliers M1 (absolus) tombent hors des fences de Tukey sur ln(prix) global', () => {
    // M1 = anomalie absolue : un simple garde global sur ln(prix) suffit à la confirmer sans D4.
    const lnPrices: number[] = [];
    for (let i = 0; i < batch.rowCount; i += 1) {
      const p = batch.priceEur[i] as number;
      if (p !== NUMERIC_UNKNOWN && p > 0) lnPrices.push(Math.log(p));
    }
    const { lo, hi } = tukeyFences(lnPrices);
    const m1 = outliers.filter((o) => o.method === 'M1');
    const caught = m1.filter((o) => {
      const l = Math.log(o.injectedPriceEur);
      return l < lo || l > hi;
    });
    console.log(`[D3] M1 hors fences globales = ${caught.length}/${m1.length}`);
    expect(m1.length).toBeGreaterThan(0);
    expect(caught.length / m1.length).toBeGreaterThan(0.98);
  });

  it('les outliers M2 (relatifs) tombent hors d’un garde de cellule (marque × tranche d’année)', () => {
    // M2 = anomalie relative à la cellule année/km : un garde de Tukey par cellule homogène la
    // confirme, là où une fence globale ne la verrait pas. Cellule = (marque, modèle, tranche 3 ans).
    const cellKey = (makeId: number, modelId: number, year: number): string =>
      `${makeId}:${modelId}:${Math.floor(year / 3)}`;
    const byCell = new Map<string, number[]>();
    for (let i = 0; i < batch.rowCount; i += 1) {
      const p = batch.priceEur[i] as number;
      if (p === NUMERIC_UNKNOWN || p <= 0) continue;
      const key = cellKey(batch.makeId[i] as number, batch.modelId[i] as number, batch.modelYear[i] as number);
      const arr = byCell.get(key) ?? [];
      arr.push(Math.log(p));
      byCell.set(key, arr);
    }
    const fenceByCell = new Map<string, { lo: number; hi: number }>();
    for (const [key, arr] of byCell) if (arr.length >= 6) fenceByCell.set(key, tukeyFences(arr, 1.5));

    const keyOf = (o: InjectedOutlier): string =>
      cellKey(o.makeId, o.modelId, batch.modelYear[o.rowIndex] as number);
    const m2 = outliers.filter((o) => o.method === 'M2');
    const testable = m2.filter((o) => fenceByCell.has(keyOf(o)));
    const caught = testable.filter((o) => {
      const f = fenceByCell.get(keyOf(o)) as { lo: number; hi: number };
      const l = Math.log(o.injectedPriceEur);
      return l < f.lo || l > f.hi;
    });
    console.log(`[D3] M2 hors cellule = ${caught.length}/${testable.length} (sur ${m2.length} M2)`);
    expect(testable.length).toBeGreaterThan(10);
    expect(caught.length / testable.length).toBeGreaterThan(0.9);
  });
});

describe('SyntheticDataProvider — cibles de taille EX-NFR-1/3 (100 000 annonces)', () => {
  it('génère 100 000 annonces sous 25 Mo en mémoire et 6 Mo gzip', async () => {
    const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: 100_000, seed: 7 });
    const handle = await provider.openSnapshot();
    const batch = await provider.fetchListingColumns(handle, 'FULL');
    expect(batch.rowCount).toBe(100_000);

    const memBytes = batchByteLength(batch);
    const serialized = serializeBatch(batch);
    const gz = await gzipSize(serialized);

    const memMb = memBytes / (1024 * 1024);
    const gzMb = gz / (1024 * 1024);
    // Traces de mesure (visibles dans la sortie de test).
    console.log(`[D3] mémoire colonnaire = ${memMb.toFixed(2)} Mo ; gzip sérialisé = ${gzMb.toFixed(2)} Mo`);

    expect(memMb).toBeLessThanOrEqual(25);
    expect(gzMb).toBeLessThanOrEqual(6);
  });
});
