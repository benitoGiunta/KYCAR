import { describe, expect, it } from 'vitest';
import { makeFixtureBatch, type FixtureRow } from './batch-fixture';
import { sampleScatter, SCATTER_MAX_POINTS } from './scatter';

/**
 * D8-07 — échantillon déterministe du nuage `G4` calculé DANS le worker (EX-DATA-99 à 103,
 * EX-DATA-118). Les trois branches d'`EX-DATA-101` sont éprouvées sur des plafonds `K` réduits, avec
 * des indices d'échantillonnage calculés à la main (`pas = |B| / q`, réel non arrondi).
 */

/** `n` lignes dont le `listingId` croît avec l'indice (ordre total d'EX-DATA-118 = ordre d'insertion). */
function batchOf(n: number): ReturnType<typeof makeFixtureBatch> {
  const rows: FixtureRow[] = Array.from({ length: n }, (_v, i) => ({ price: 10_000 + i, idRank: i }));
  return makeFixtureBatch(rows);
}

const allRows = (n: number): Int32Array => Int32Array.from({ length: n }, (_v, i) => i);

describe('EX-DATA-100 / EX-DATA-101 — plafond et règle d’échantillonnage', () => {
  it('le plafond dur vaut K = 5 000 points (EX-DATA-100)', () => {
    expect(SCATTER_MAX_POINTS).toBe(5000);
  });

  it('n_e ≤ K : tout est tracé, sampled = faux, sortie triée par listingId', () => {
    const batch = batchOf(6);
    const out = sampleScatter({
      eligible: allRows(6),
      listingId: batch.listingId,
      isOutlier: (row) => row === 2,
      maxPoints: 10,
    });
    expect(out.eligibleCount).toBe(6);
    expect(out.plottedCount).toBe(6);
    expect([...out.rows]).toEqual([0, 1, 2, 3, 4, 5]);
    expect(out.sampled).toBe(false);
    expect(out.outlierTruncated).toBe(false);
    expect(out.outlierCount).toBe(1);
    expect(out.outlierPlottedCount).toBe(1);
    expect(out.maxPoints).toBe(10);
  });

  it('n_e > K et |A| < K : A entier, puis pas régulier ⌊j · |B|/q⌋ sur B trié par listingId', () => {
    // 20 éligibles, K = 10, A = {0, 19} ⇒ |B| = 18, q = 8, pas = 2,25 :
    // ⌊j·2,25⌋ pour j = 0..7 → 0, 2, 4, 6, 9, 11, 13, 15 (positions dans B = [1..18]).
    const batch = batchOf(20);
    const out = sampleScatter({
      eligible: allRows(20),
      listingId: batch.listingId,
      isOutlier: (row) => row === 0 || row === 19,
      maxPoints: 10,
    });
    const bSorted = [...Array(18).keys()].map((i) => i + 1);
    const expected = [0, 19, ...[0, 2, 4, 6, 9, 11, 13, 15].map((i) => bSorted[i] as number)].sort(
      (a, b) => a - b,
    );
    expect([...out.rows]).toEqual(expected);
    expect(out.plottedCount).toBe(10);
    expect(out.sampled).toBe(true);
    expect(out.outlierTruncated).toBe(false);
    // EX-DATA-101 : les annonces signalées sont conservées INTÉGRALEMENT.
    expect(out.outlierPlottedCount).toBe(2);
    expect([...out.rows]).toContain(0);
    expect([...out.rows]).toContain(19);
  });

  it('|A| ≥ K : les K plus grands |opportunityScore| sont tracés et outlierTruncated est vrai', () => {
    // 12 signalées pour K = 4 : scores |…| = ligne, donc les lignes 11, 10, 9, 8 sont retenues.
    const batch = batchOf(12);
    const out = sampleScatter({
      eligible: allRows(12),
      listingId: batch.listingId,
      isOutlier: () => true,
      scoreOf: (row) => -row,
      maxPoints: 4,
    });
    expect([...out.rows]).toEqual([8, 9, 10, 11]);
    expect(out.outlierCount).toBe(12);
    expect(out.outlierPlottedCount).toBe(4);
    expect(out.sampled).toBe(true);
    expect(out.outlierTruncated).toBe(true);
  });

  it('EX-DATA-100bis — l’échantillon est identique octet à octet sur deux permutations de Elig', () => {
    const batch = batchOf(50);
    const straight = allRows(50);
    const reversed = Int32Array.from([...straight].reverse());
    const shuffled = Int32Array.from(
      [...straight].sort((a, b) => ((a * 7919) % 50) - ((b * 7919) % 50)),
    );
    const opts = {
      listingId: batch.listingId,
      isOutlier: (row: number) => row % 17 === 0,
      maxPoints: 20,
    };
    const a = sampleScatter({ eligible: straight, ...opts });
    const b = sampleScatter({ eligible: reversed, ...opts });
    const c = sampleScatter({ eligible: shuffled, ...opts });
    expect([...b.rows]).toEqual([...a.rows]);
    expect([...c.rows]).toEqual([...a.rows]);
    expect(a.sampled).toBe(true);
  });

  it('sélection vide : aucun point, aucun compteur inventé', () => {
    const batch = batchOf(0);
    const out = sampleScatter({
      eligible: new Int32Array(0),
      listingId: batch.listingId,
      isOutlier: () => false,
    });
    expect(out.plottedCount).toBe(0);
    expect(out.eligibleCount).toBe(0);
    expect(out.outlierCount).toBe(0);
    expect(out.sampled).toBe(false);
    expect(out.outlierTruncated).toBe(false);
  });
});
