/**
 * KYCAR — Outillage commun des sondes de revue du lot D3 (phase 2.5)
 * =================================================================================================
 * Ce module N'EST PAS une sonde (il ne porte pas `.test.ts`) : il porte le cache de module du
 * dataset 100 000 annonces, pour respecter la discipline CPU du protocole (« au plus deux
 * générations de 100k »). La première génération sert TOUTES les analyses ; la seconde ne sert
 * qu'au contrôle de déterminisme.
 *
 * Aucun accès réseau (E5) : les référentiels sont lus sur disque par le chargeur Node de D2/D8.
 */

import { gzipSync } from 'node:zlib';

import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import type { ReferenceData } from '../../../src/types/reference';
import type { ListingColumnBatch } from '../../../src/providers/DataProvider';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/SyntheticDataProvider';
import { DEFAULT_LISTING_COUNT, DEFAULT_SEED, type InjectedOutlier } from '../../../src/providers/synthetic/generate';

/** Référentiels D2, chargés une seule fois. */
let refCache: ReferenceData | null = null;
export function reference(): ReferenceData {
  refCache ??= loadReferenceDataFromDisk();
  return refCache;
}

export interface Dataset {
  readonly provider: SyntheticDataProvider;
  readonly batch: ListingColumnBatch;
  readonly outliers: readonly InjectedOutlier[];
  /** Durée de `openSnapshot()` en ms (génération du dataset comprise). */
  readonly openMs: number;
}

async function build(seed: number, count: number): Promise<Dataset> {
  const provider = new SyntheticDataProvider({ referenceData: reference(), seed, listingCount: count });
  const t0 = performance.now();
  await provider.openSnapshot();
  const openMs = performance.now() - t0;
  return { provider, batch: provider.getDataset().batch, outliers: provider.getGroundTruthOutliers(), openMs };
}

/* --- Génération n° 1 (analyses) et n° 2 (déterminisme) : DEUX générations 100k au maximum ------- */

let primaryCache: Promise<Dataset> | null = null;
/** Dataset de référence : 100 000 annonces, graine par défaut — exactement le câblage de `main.tsx`. */
export function primary(): Promise<Dataset> {
  primaryCache ??= build(DEFAULT_SEED, DEFAULT_LISTING_COUNT);
  return primaryCache;
}

let twinCache: Promise<Dataset> | null = null;
/** Jumeau à graine identique — utilisé UNIQUEMENT par la sonde de déterminisme. */
export function twin(): Promise<Dataset> {
  twinCache ??= build(DEFAULT_SEED, DEFAULT_LISTING_COUNT);
  return twinCache;
}

/* --- Mesures ----------------------------------------------------------------------------------- */

/** Vues typées d'un lot, dans l'ordre stable de `Object.values`. */
export function views(batch: ListingColumnBatch): { name: string; view: ArrayBufferView }[] {
  const out: { name: string; view: ArrayBufferView }[] = [];
  for (const [name, value] of Object.entries(batch)) {
    if (ArrayBuffer.isView(value)) out.push({ name, view: value as ArrayBufferView });
  }
  return out;
}

/** Empreinte mémoire : somme des octets détenus par les colonnes typées ET la zone de chaînes. */
export function memoryBytes(batch: ListingColumnBatch): { total: number; columns: number; strings: number } {
  let columns = 0;
  let strings = 0;
  for (const { name, view } of views(batch)) {
    if (name === 'stringBlob' || name === 'stringOffsets') strings += view.byteLength;
    else columns += view.byteLength;
  }
  return { total: columns + strings, columns, strings };
}

/** Sérialise le lot en un buffer contigu (colonnes + zone de chaînes), prêt à compresser. */
export function serialize(batch: ListingColumnBatch): Uint8Array {
  const vs = views(batch);
  const total = vs.reduce((a, v) => a + v.view.byteLength, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const { view } of vs) {
    out.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength), cursor);
    cursor += view.byteLength;
  }
  return out;
}

/** Taille gzip (niveau par défaut) du buffer sérialisé — sonde EX-NFR-3. */
export function gzipBytes(data: Uint8Array): number {
  return gzipSync(data).byteLength;
}

/** Hachage FNV-1a 32 bits d'une vue d'octets (empreinte de colonne, pour le déterminisme). */
export function fnv1a(view: ArrayBufferView): number {
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) {
    h ^= bytes[i] as number;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Empreinte par colonne d'un lot : `nom → hash`. */
export function columnHashes(batch: ListingColumnBatch): Record<string, number> {
  const out: Record<string, number> = {};
  for (const { name, view } of views(batch)) out[name] = fnv1a(view);
  return out;
}

/* --- Statistiques ------------------------------------------------------------------------------ */

/** Rangs moyens (gestion des ex æquo) d'un tableau de valeurs. */
function ranks(values: readonly number[]): number[] {
  const order = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const r = new Array<number>(values.length);
  let k = 0;
  while (k < order.length) {
    let j = k;
    while (j + 1 < order.length && (order[j + 1] as { v: number }).v === (order[k] as { v: number }).v) j += 1;
    const avg = (k + j) / 2 + 1;
    for (let t = k; t <= j; t += 1) r[(order[t] as { i: number }).i] = avg;
    k = j + 1;
  }
  return r;
}

/** Corrélation de Spearman signée entre deux séries de même longueur (`null` si dégénérée). */
export function spearman(xs: readonly number[], ys: readonly number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const rx = ranks(xs);
  const ry = ranks(ys);
  const mx = rx.reduce((a, b) => a + b, 0) / n;
  const my = ry.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    const a = (rx[i] as number) - mx;
    const b = (ry[i] as number) - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

/** Décode les `STRINGS_PER_ROW` champs textuels d'une ligne. */
export function rowStrings(batch: ListingColumnBatch, row: number, fields = 5): string[] {
  const dec = new TextDecoder();
  const out: string[] = [];
  for (let f = 0; f < fields; f += 1) {
    const s = batch.stringOffsets[row * fields + f] as number;
    const e = batch.stringOffsets[row * fields + f + 1] as number;
    out.push(dec.decode(batch.stringBlob.subarray(s, e)));
  }
  return out;
}

/**
 * Reconstruit une ligne du lot colonnaire en OBJET (vue logique), pour le balayage R3
 * `scanForbiddenFields`. Les noms de propriété sont exactement ceux des colonnes du lot.
 */
export function rowAsObject(batch: ListingColumnBatch, row: number): Record<string, unknown> {
  const [listingUrl, modelVersionRaw, modelVersionClean, fuelSourceLabelRaw, trimTokens] = rowStrings(batch, row);
  const obj: Record<string, unknown> = {
    listingId: Array.from(batch.listingId.subarray(row * 16, row * 16 + 16)),
    listingUrl,
    modelVersionRaw,
    modelVersionClean,
    fuelSourceLabelRaw,
    trimTokens,
  };
  for (const { name, view } of views(batch)) {
    if (name === 'listingId' || name === 'stringBlob' || name === 'stringOffsets') continue;
    obj[name] = (view as unknown as ArrayLike<number>)[row];
  }
  return obj;
}
