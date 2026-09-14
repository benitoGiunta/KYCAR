/**
 * KYCAR — Tests de la géométrie des histogrammes G1–G3 (lot D7, EX-SCR-19/16)
 */

import { describe, it, expect } from 'vitest';
import type { DistributionBucket } from '../../types/index';
import { buildHistogram, bucketToIntervalFilters, histogramTable, LOG_TOGGLE_MIN_RATIO } from './histogram-model';

function bucket(index: number, lo: number, hi: number, count: number, open = false): DistributionBucket {
  return {
    snapshotId: 's',
    selectionHash: 'h',
    metric: 'price',
    index,
    lowerBound: lo,
    upperBound: hi,
    open,
    count,
    share: 0,
  };
}

describe('buildHistogram (EX-SCR-19 axe à 0)', () => {
  it('la barre du bin le plus peuplé atteint 1, un bin vide est à 0', () => {
    const buckets = [bucket(0, 0, 100, 10), bucket(1, 100, 200, 0), bucket(2, 200, 300, 40)];
    const m = buildHistogram('price', buckets);
    expect(m.maxCount).toBe(40);
    const tallest = m.bars.find((b) => b.count === 40);
    const empty = m.bars.find((b) => b.count === 0);
    expect(tallest?.heightFrac).toBeCloseTo(1, 5);
    expect(empty?.heightFrac).toBe(0); // départ à 0, EX-SCR-19
    expect(m.totalCount).toBe(50);
  });

  it('largeurs de créneau égales sommant à ~1', () => {
    const buckets = [bucket(0, 0, 100, 5), bucket(1, 100, 200, 8), bucket(2, 200, 300, 3)];
    const m = buildHistogram('price', buckets);
    const totalWidth = m.bars.reduce((s, b) => s + b.widthFrac, 0);
    expect(totalWidth).toBeCloseTo(1, 5);
  });
});

describe('bascule log conditionnelle (EX-SCR-16)', () => {
  it('offerte seulement si le ratio max/min-non-nul ≥ 50', () => {
    // ratio 100/1 = 100 ≥ 50 → disponible
    const wide = buildHistogram('price', [bucket(0, 0, 100, 100), bucket(1, 100, 200, 1)]);
    expect(wide.dynamicRange).toBe(100);
    expect(wide.logAvailable).toBe(true);
    // ratio 40/10 = 4 < 50 → absente
    const narrow = buildHistogram('price', [bucket(0, 0, 100, 40), bucket(1, 100, 200, 10)]);
    expect(narrow.logAvailable).toBe(false);
    expect(narrow.dynamicRange).toBeLessThan(LOG_TOGGLE_MIN_RATIO);
  });

  it('n’applique le log que si disponible ET demandé', () => {
    const buckets = [bucket(0, 0, 100, 100), bucket(1, 100, 200, 1)];
    const asked = buildHistogram('price', buckets, { log: true });
    expect(asked.logApplied).toBe(true);
    // Log compresse : le petit bin monte proportionnellement plus qu'en linéaire.
    const small = asked.bars.find((b) => b.count === 1);
    const linear = buildHistogram('price', buckets, { log: false }).bars.find((b) => b.count === 1);
    expect(small!.heightFrac).toBeGreaterThan(linear!.heightFrac);
  });

  it('ignore le log demandé si indisponible', () => {
    const buckets = [bucket(0, 0, 100, 40), bucket(1, 100, 200, 10)];
    const m = buildHistogram('price', buckets, { log: true });
    expect(m.logApplied).toBe(false);
  });
});

describe('table équivalente (EX-NFR-15)', () => {
  it('produit une ligne par bin avec libellé de plage, effectif, part', () => {
    const buckets = [bucket(0, 0, 100, 10), bucket(2, 200, Infinity, 3, true)];
    buckets[0] = { ...buckets[0]!, share: 0.77 };
    const m = buildHistogram('price', buckets);
    const table = histogramTable(m, (v) => (Number.isFinite(v) ? `${v}` : '∞'));
    expect(table.length).toBe(m.bars.length);
    expect(table[0]!.rangeLabel).toBe('0 – 100');
    // fr-BE (EX-NFR-28/30, DR-145) : virgule décimale + espace fine insécable avant `%`.
    expect(table[0]!.sharePct).toBe('77,0 %');
    // Bin de débordement haut : libellé « ≥ borne ».
    const openRow = table.find((r) => r.rangeLabel.startsWith('≥'));
    expect(openRow).toBeDefined();
  });
});

describe('bucketToIntervalFilters (DR-009, ARB-09/EX-SCR-149) — geste central du parcours 2', () => {
  it('bin fermé : `<x>from = lo`, `<x>to = hi - 1` (prix)', () => {
    expect(bucketToIntervalFilters(bucket(0, 10000, 15000, 7), 'price')).toEqual({
      priceFrom: 10000,
      priceTo: 14999,
    });
  });

  it('bin fermé : mêmes règles pour km et année, avec les identifiants de filtre attendus', () => {
    expect(bucketToIntervalFilters(bucket(0, 50000, 100000, 4), 'mileage')).toEqual({
      mileageFrom: 50000,
      mileageTo: 99999,
    });
    expect(bucketToIntervalFilters(bucket(0, 2015, 2018, 9), 'year')).toEqual({
      dateOfRegistrationFrom: 2015,
      dateOfRegistrationTo: 2017,
    });
  });

  it('débordement bas (`lowerBound = -Infinity`) : pas de borne basse, seule `to = hi - 1`', () => {
    expect(bucketToIntervalFilters(bucket(0, Number.NEGATIVE_INFINITY, 1000, 3, true), 'price')).toEqual({
      priceTo: 999,
    });
  });

  it('débordement haut (`upperBound = +Infinity`) : pas de borne haute, seule `from = lo`', () => {
    expect(bucketToIntervalFilters(bucket(2, 200000, Number.POSITIVE_INFINITY, 2, true), 'mileage')).toEqual({
      mileageFrom: 200000,
    });
  });

  it(
    'TEST DE RECETTE ARB-09 — effectif après clic = effectif de la barre : appliquer le filtre ' +
      'retourné (bornes INCLUSIVES `[lo, hi - 1]`, EX-NAV-7) sur le MÊME jeu de valeurs que celui ' +
      "qui a produit le bucket restitue EXACTEMENT son compte, aucune valeur adjacente en plus ou en moins",
    () => {
      // Jeu de valeurs couvrant trois classes de 1000 : [0,1000) x2, [1000,2000) x3, [2000,3000) x1.
      const values = [100, 900, 1000, 1500, 1999, 2500];
      const buckets: DistributionBucket[] = [
        bucket(0, 0, 1000, 2),
        bucket(1, 1000, 2000, 3),
        bucket(2, 2000, 3000, 1),
      ];
      for (const bar of buckets) {
        const filters = bucketToIntervalFilters(bar, 'price');
        const from = filters['priceFrom'] as number | undefined;
        const to = filters['priceTo'] as number | undefined;
        const count = values.filter((v) => (from === undefined || v >= from) && (to === undefined || v <= to)).length;
        expect(count, `bucket [${bar.lowerBound}, ${bar.upperBound})`).toBe(bar.count);
      }
    },
  );
});
