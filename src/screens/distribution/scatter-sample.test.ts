/**
 * KYCAR — Tests de l'échantillonnage déterministe G4 (lot D7, EX-DATA-99/100/100bis/101/103)
 * =================================================================================================
 * Vérifie : plafond K=5000 (EX-DATA-100), conservation intégrale des outliers, cas |A|≥K par
 * |opportunityScore| (EX-DATA-101), pas régulier sur listingId, compteurs d'EX-DATA-103, et surtout
 * l'INVARIANCE À LA PERMUTATION octet à octet (EX-DATA-100bis) — critère de succès n°4.
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

describe('sampleScatter — plafond et conservation des outliers (EX-DATA-100/101)', () => {
  it('ne trace jamais plus de K points, aucun outlier', () => {
    const n = 12000;
    const listingId = makeListingIds(n);
    const eligible = Int32Array.from({ length: n }, (_v, i) => i);
    const out = sampleScatter({ eligible, listingId, isOutlier: () => false });
    expect(out.rows.length).toBe(SCATTER_MAX_POINTS);
    expect(out.plottedCount).toBe(SCATTER_MAX_POINTS);
    expect(out.sampled).toBe(true);
    expect(out.outlierTruncated).toBe(false);
    expect(out.eligibleCount).toBe(n);
    expect(out.outlierCount).toBe(0);
  });

  it('conserve TOUS les outliers et complète par pas régulier (cas 3)', () => {
    const n = 8000;
    const listingId = makeListingIds(n);
    const eligible = Int32Array.from({ length: n }, (_v, i) => i);
    const outlierRows = new Set<number>();
    for (let i = 0; i < n; i += 40) outlierRows.add(i); // 200 outliers < K
    const out = sampleScatter({ eligible, listingId, isOutlier: (r) => outlierRows.has(r) });
    expect(out.rows.length).toBe(SCATTER_MAX_POINTS);
    expect(out.outlierCount).toBe(outlierRows.size);
    expect(out.outlierPlottedCount).toBe(outlierRows.size);
    expect(out.outlierTruncated).toBe(false);
    const kept = new Set(Array.from(out.rows));
    for (const r of outlierRows) expect(kept.has(r)).toBe(true); // chaque outlier tracé
  });

  it('garde toutes les lignes sous le plafond (sampled=false)', () => {
    const n = 300;
    const listingId = makeListingIds(n);
    const eligible = Int32Array.from({ length: n }, (_v, i) => i);
    const out = sampleScatter({ eligible, listingId, isOutlier: () => false });
    expect(out.rows.length).toBe(n);
    expect(out.sampled).toBe(false);
  });

  it('cas |A| ≥ K : trace les K outliers de plus grand |opportunityScore| (outlierTruncated)', () => {
    const n = 9000;
    const listingId = makeListingIds(n);
    const eligible = Int32Array.from({ length: n }, (_v, i) => i);
    // 6000 outliers > K ; score = valeur décroissante avec la ligne pour un contrôle simple.
    const isOutlier = (r: number): boolean => r < 6000;
    const opportunityScore = (r: number): number => (r < 6000 ? 6000 - r : 0); // ligne 0 = plus fort
    const out = sampleScatter({ eligible, listingId, isOutlier, opportunityScore });
    expect(out.outlierCount).toBe(6000);
    expect(out.rows.length).toBe(SCATTER_MAX_POINTS);
    expect(out.outlierTruncated).toBe(true);
    // Les K plus forts |score| sont les lignes 0..4999 ; toutes doivent être tracées.
    const kept = new Set(Array.from(out.rows));
    for (let r = 0; r < SCATTER_MAX_POINTS; r++) expect(kept.has(r)).toBe(true);
    expect(kept.has(5000)).toBe(false); // ligne juste sous le seuil non tracée
  });
});

describe('sampleScatter — déterminisme et invariance à la permutation (EX-DATA-100bis)', () => {
  it('échantillon IDENTIQUE octet à octet pour deux permutations des mêmes lignes (cas 3)', () => {
    const n = 15000;
    const listingId = makeListingIds(n);
    const outlierRows = new Set<number>();
    for (let i = 3; i < n; i += 97) outlierRows.add(i);
    const isOutlier = (r: number): boolean => outlierRows.has(r);

    const outA = sampleScatter({ eligible: permutedRows(n, 0xabcdef), listingId, isOutlier });
    const outB = sampleScatter({ eligible: permutedRows(n, 0x123456), listingId, isOutlier });

    expect(outA.rows.length).toBe(SCATTER_MAX_POINTS);
    expect(Array.from(outA.rows)).toEqual(Array.from(outB.rows));
  });

  it('échantillon IDENTIQUE pour deux permutations dans le cas |A| ≥ K', () => {
    const n = 12000;
    const listingId = makeListingIds(n, 3);
    const isOutlier = (r: number): boolean => r < 7000;
    const opportunityScore = (r: number): number => Math.sin(r) * 100; // scores variés, déterministes
    const outA = sampleScatter({ eligible: permutedRows(n, 0x11), listingId, isOutlier, opportunityScore });
    const outB = sampleScatter({ eligible: permutedRows(n, 0x22), listingId, isOutlier, opportunityScore });
    expect(Array.from(outA.rows)).toEqual(Array.from(outB.rows));
  });

  it('stable d’un appel à l’autre (aucun aléa non graine, EX-DATA-101)', () => {
    const n = 9000;
    const listingId = makeListingIds(n, 7);
    const eligible = permutedRows(n, 0x55aa55);
    const isOutlier = (r: number): boolean => r % 500 === 0;
    const first = sampleScatter({ eligible, listingId, isOutlier });
    const second = sampleScatter({ eligible, listingId, isOutlier });
    expect(Array.from(first.rows)).toEqual(Array.from(second.rows));
  });

  it('sortie triée par listingId croissant (ordre total EX-DATA-118)', () => {
    const n = 6000;
    const listingId = makeListingIds(n);
    const eligible = permutedRows(n, 0x999);
    const out = sampleScatter({ eligible, listingId, isOutlier: () => false });
    for (let i = 1; i < out.rows.length; i++) {
      const prev = out.rows[i - 1] as number;
      const cur = out.rows[i] as number;
      let cmp = 0;
      for (let b = 0; b < 16 && cmp === 0; b++) {
        cmp = (listingId[prev * 16 + b] as number) - (listingId[cur * 16 + b] as number);
      }
      expect(cmp).toBeLessThan(0);
    }
  });

  it('graine constante 0x4B594341 (traçabilité EX-DATA-100bis / EX-DATA-103)', () => {
    expect(SCATTER_SAMPLING_SEED).toBe(0x4b594341);
  });
});
