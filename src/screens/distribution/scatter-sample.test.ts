/**
 * KYCAR — Tests de l'échantillonnage déterministe G4 (lot D7)
 * =================================================================================================
 * Vérifie les garanties normatives du nuage : plafond K=5000 (EX-DATA-100), conservation intégrale
 * des outliers, déterminisme reproductible (EX-DATA-101) et INVARIANCE À LA PERMUTATION octet à octet
 * (EX-DATA-100bis) — critère de succès n°4 du lot.
 */

import { describe, it, expect } from 'vitest';
import {
  sampleScatter,
  SCATTER_MAX_POINTS,
  SCATTER_SAMPLING_SEED,
} from './scatter-sample';

/** Fabrique des `listingId` (16 octets/ligne) déterministes mais non ordonnés par indice de ligne. */
function makeListingIds(n: number, salt = 1): Uint8Array {
  const bytes = new Uint8Array(n * 16);
  let a = (0x1234567 ^ salt) >>> 0;
  for (let i = 0; i < n * 16; i++) {
    a = (Math.imul(a ^ (a >>> 15), 0x2c1b3c6d) + 0x9e3779b9) >>> 0;
    bytes[i] = a & 0xff;
  }
  return bytes;
}

/** Permute `[0, n)` de façon déterministe (Fisher-Yates à graine fixe). */
function permutedRows(n: number, seed: number): Int32Array {
  const rows = Int32Array.from({ length: n }, (_v, i) => i);
  let a = seed >>> 0;
  for (let i = n - 1; i > 0; i--) {
    a = (Math.imul(a ^ (a >>> 13), 0x85ebca6b) + 0x165667b1) >>> 0;
    const j = a % (i + 1);
    const tmp = rows[i] as number;
    rows[i] = rows[j] as number;
    rows[j] = tmp;
  }
  return rows;
}

describe('sampleScatter — plafond et conservation des outliers', () => {
  it('ne trace jamais plus de K points quand il n’y a pas d’outlier', () => {
    const n = 12000;
    const listingId = makeListingIds(n);
    const rows = Int32Array.from({ length: n }, (_v, i) => i);
    const out = sampleScatter({ rows, listingId, isOutlier: () => false });
    expect(out.rows.length).toBe(SCATTER_MAX_POINTS);
    expect(out.sampled).toBe(true);
    expect(out.eligibleCount).toBe(n);
    expect(out.outlierCount).toBe(0);
  });

  it('conserve TOUS les outliers et complète le budget avec des non-outliers', () => {
    const n = 8000;
    const listingId = makeListingIds(n);
    const rows = Int32Array.from({ length: n }, (_v, i) => i);
    // 200 outliers déterministes.
    const outlierRows = new Set<number>();
    for (let i = 0; i < n; i += 40) outlierRows.add(i);
    const out = sampleScatter({ rows, listingId, isOutlier: (r) => outlierRows.has(r) });
    expect(out.rows.length).toBe(SCATTER_MAX_POINTS);
    expect(out.outlierCount).toBe(outlierRows.size);
    // Chaque outlier est présent dans l'échantillon.
    const kept = new Set(Array.from(out.rows));
    for (const r of outlierRows) expect(kept.has(r)).toBe(true);
  });

  it('garde toutes les lignes quand l’effectif est sous le plafond', () => {
    const n = 300;
    const listingId = makeListingIds(n);
    const rows = Int32Array.from({ length: n }, (_v, i) => i);
    const out = sampleScatter({ rows, listingId, isOutlier: () => false });
    expect(out.rows.length).toBe(n);
    expect(out.sampled).toBe(false);
  });

  it('conserve tous les outliers même s’ils dépassent le plafond (budget non-outlier nul)', () => {
    const n = 7000;
    const listingId = makeListingIds(n);
    const rows = Int32Array.from({ length: n }, (_v, i) => i);
    const out = sampleScatter({
      rows,
      listingId,
      isOutlier: (r) => r < 6000, // 6000 outliers > K
    });
    expect(out.outlierCount).toBe(6000);
    expect(out.rows.length).toBe(6000); // outliers intégraux, 0 non-outlier
  });
});

describe('sampleScatter — déterminisme et invariance à la permutation (EX-DATA-100bis)', () => {
  it('produit un échantillon IDENTIQUE octet à octet pour deux permutations des mêmes lignes', () => {
    const n = 15000;
    const listingId = makeListingIds(n);
    const outlierRows = new Set<number>();
    for (let i = 3; i < n; i += 97) outlierRows.add(i);
    const isOutlier = (r: number): boolean => outlierRows.has(r);

    const permA = permutedRows(n, 0xabcdef);
    const permB = permutedRows(n, 0x123456);

    const outA = sampleScatter({ rows: permA, listingId, isOutlier });
    const outB = sampleScatter({ rows: permB, listingId, isOutlier });

    expect(outA.rows.length).toBe(SCATTER_MAX_POINTS);
    // Égalité stricte octet à octet des deux Int32Array.
    expect(Array.from(outA.rows)).toEqual(Array.from(outB.rows));
  });

  it('est stable d’un appel à l’autre (aucun aléa non graine, EX-DATA-101)', () => {
    const n = 9000;
    const listingId = makeListingIds(n, 7);
    const rows = permutedRows(n, 0x55aa55);
    const isOutlier = (r: number): boolean => r % 500 === 0;
    const first = sampleScatter({ rows, listingId, isOutlier });
    const second = sampleScatter({ rows, listingId, isOutlier });
    expect(Array.from(first.rows)).toEqual(Array.from(second.rows));
  });

  it('la sortie est triée par listingId (ordre total EX-DATA-118)', () => {
    const n = 6000;
    const listingId = makeListingIds(n);
    const rows = permutedRows(n, 0x999);
    const out = sampleScatter({ rows, listingId, isOutlier: () => false });
    for (let i = 1; i < out.rows.length; i++) {
      const prev = out.rows[i - 1] as number;
      const cur = out.rows[i] as number;
      // Comparaison octet à octet des UUID : strictement croissant.
      let cmp = 0;
      for (let b = 0; b < 16 && cmp === 0; b++) {
        cmp = (listingId[prev * 16 + b] as number) - (listingId[cur * 16 + b] as number);
      }
      expect(cmp).toBeLessThan(0);
    }
  });

  it('la graine constante est bien 0x4B594341 (traçabilité ARCHITECTURE §4.2)', () => {
    expect(SCATTER_SAMPLING_SEED).toBe(0x4b594341);
  });
});
