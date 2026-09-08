/**
 * KYCAR — Tests des graphes additionnels G5–G15 (lot D7, EX-SCR-161..170, EX-DATA-102bis)
 */

import { describe, it, expect } from 'vitest';
import { generateSyntheticDataset } from '../../engine/synthetic';
import { detectOutliers } from '../../engine/outliers';
import { isMileageValid, isPriceValid } from '../../engine/flags';
import { OutlierIndex } from '../outlier-index';
import {
  buildYearMedian,
  buildDepreciation,
  buildPriceMileageDensity,
  buildOutlierLollipops,
  buildCategoryBars,
  buildMileageBoxes,
  buildPowerTiers,
} from './graphs-model';
import { groupStat, ntile } from './group-stat';

function fixture(n: number, seed = 21) {
  const ds = generateSyntheticDataset({ rowCount: n, seed });
  const rows = Int32Array.from({ length: n }, (_v, i) => i);
  return { ds, batch: ds.batch, rows };
}

describe('GROUPSTAT / NTILE (EX-DATA-83bis/83ter)', () => {
  it('groupStat somme les effectifs par groupe = total valide', () => {
    const { batch, rows } = fixture(3000);
    const valid = (r: number): boolean => isPriceValid(batch.priceEur[r] as number, batch.priceStatus[r] as number, batch.ingestFlags[r] as number);
    const stats = groupStat(rows, (r) => batch.fuelCategory[r] as number, (r) => batch.priceEur[r] as number, valid);
    let totalValid = 0;
    for (let i = 0; i < rows.length; i++) if (valid(i)) totalValid++;
    expect(stats.reduce((s, g) => s + g.n, 0)).toBe(totalValid);
  });

  it('ntile produit des tranches d’effectifs quasi égaux', () => {
    const { batch, rows } = fixture(2000);
    const valid = (r: number): boolean => isMileageValid(batch.mileageKm[r] as number, batch.ingestFlags[r] as number) && isPriceValid(batch.priceEur[r] as number, batch.priceStatus[r] as number, batch.ingestFlags[r] as number);
    const tiles = ntile(rows, (r) => batch.mileageKm[r] as number, (r) => batch.priceEur[r] as number, valid, 5);
    expect(tiles.length).toBe(5);
    const sizes = tiles.map((t) => t.stat.n);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    // Bornes croissantes entre tranches.
    for (let i = 1; i < tiles.length; i++) expect(tiles[i]!.loObserved).toBeGreaterThanOrEqual(tiles[i - 1]!.loObserved);
  });
});

describe('G5 / G6 — médiane par année et dépréciation', () => {
  it('années ordonnées croissantes, médianes positives', () => {
    const { batch, rows } = fixture(4000);
    const ym = buildYearMedian(batch, rows);
    expect(ym.length).toBeGreaterThan(3);
    for (let i = 1; i < ym.length; i++) expect(ym[i]!.year).toBeGreaterThan(ym[i - 1]!.year);
    for (const y of ym) expect(y.stat.median!).toBeGreaterThan(0);
  });

  it('dépréciation base 100 = année récente, indices décroissants avec l’âge', () => {
    const { batch, rows } = fixture(6000);
    const ym = buildYearMedian(batch, rows);
    const dep = buildDepreciation(ym);
    expect(dep.available).toBe(true);
    const base = dep.points.find((p) => p.ageYears === 0);
    expect(base!.index).toBeCloseTo(100, 5);
    // Le synthétique déprécie de ~10%/an : l'indice baisse avec l'âge.
    const oldest = dep.points.reduce((a, b) => (b.ageYears > a.ageYears ? b : a));
    expect(oldest.index).toBeLessThan(100);
  });

  it('dépréciation non calculable sous 3 années à 5 offres', () => {
    const dep = buildDepreciation([
      { year: 2024, stat: { key: 2024, n: 10, median: 20000, p25: null, p75: null, p05: null, p95: null, min: null, max: null } },
    ]);
    expect(dep.available).toBe(false);
  });
});

describe('G7 — densité prix × km (EX-DATA-102bis)', () => {
  it('la somme des effectifs de cellule vaut l’effectif éligible', () => {
    const { batch, rows } = fixture(5000);
    const d = buildPriceMileageDensity(batch, rows);
    expect(d.available).toBe(true);
    const sum = d.cells.reduce((s, c) => s + c.count, 0);
    expect(sum).toBe(d.eligibleCount);
    expect(d.maxCount).toBeGreaterThan(0);
  });

  it('non calculable sous 40 offres', () => {
    const { batch } = fixture(5000);
    const d = buildPriceMileageDensity(batch, [0, 1, 2, 3, 4]);
    expect(d.available).toBe(false);
  });
});

describe('G8 — écart au prix attendu (EX-SCR-164)', () => {
  it('trie par opportunityScore décroissant et limite à 20', () => {
    const { batch, rows } = fixture(8000, 4);
    const out = detectOutliers(batch, rows, batch.snapshotId, 'sel');
    const idx = new OutlierIndex(out.verdicts);
    const lolli = buildOutlierLollipops(batch, rows, idx, 20);
    expect(lolli.length).toBeLessThanOrEqual(20);
    for (let i = 1; i < lolli.length; i++) {
      expect(lolli[i - 1]!.opportunityScore).toBeGreaterThanOrEqual(lolli[i]!.opportunityScore);
    }
  });
});

describe('G9/G12/G13/G15 — barres catégorielles (EX-SCR-165)', () => {
  it('barres triées par effectif décroissant, parts sommant ~100', () => {
    const { batch, rows } = fixture(4000);
    const bars = buildCategoryBars(batch, rows, 'fuelCategory');
    expect(bars.length).toBeGreaterThan(0);
    for (let i = 1; i < bars.length; i++) expect(bars[i - 1]!.count).toBeGreaterThanOrEqual(bars[i]!.count);
    const totalShare = bars.reduce((s, b) => s + b.sharePct, 0);
    expect(totalShare).toBeCloseTo(100, 2);
  });
});

describe('G10 / G14 — tranches km et paliers puissance', () => {
  it('G10 : 5 tranches au-dessus de 25 offres', () => {
    const { batch, rows } = fixture(3000);
    const boxes = buildMileageBoxes(batch, rows);
    expect(boxes.tileCount).toBe(5);
    expect(boxes.tiles.length).toBe(5);
  });

  it('G14 : paliers de 20 kW ordonnés, médianes positives', () => {
    const { batch, rows } = fixture(3000);
    const tiers = buildPowerTiers(batch, rows);
    expect(tiers.length).toBeGreaterThan(0);
    for (let i = 1; i < tiers.length; i++) expect(tiers[i]!.loKw).toBeGreaterThan(tiers[i - 1]!.loKw);
    for (const t of tiers) expect(t.hiKw).toBe(t.loKw + 19);
  });
});
