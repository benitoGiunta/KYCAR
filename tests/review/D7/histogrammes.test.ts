/**
 * KYCAR — Sondes de revue D7 · histogrammes G1–G3 (EX-SCR-19/16/143/145/148/150, EX-NFR-15)
 * =================================================================================================
 * Vérification n°1 de la mission : somme des barres = effectif de la métrique, sentinelles,
 * bucket vide au milieu, valeur unique (n = 1), n = 0 (état vide), axes et étiquettes fr-BE.
 *
 * Les composants sans hook (`Histogram`) sont appelés comme des fonctions pures et leur arbre de
 * VNodes est inspecté (environnement `node`, aucun DOM — cf. `_helpers.ts`).
 */

import { describe, it, expect } from 'vitest';
import type { DistributionBucket } from '../../../src/types/index';
import { NUMERIC_UNKNOWN } from '../../../src/types/index';
import { isPriceValid, isYearValid } from '../../../src/engine/flags';
import { buildHistogram, histogramTable } from '../../../src/screens/distribution/histogram-model';
import { Histogram } from '../../../src/screens/distribution/Histogram';
import { formatMetric } from '../../../src/screens/distribution/format';
import { fixture, findAll, byType, textOf } from './_helpers';

function bucket(index: number, lo: number, hi: number, count: number, open = false): DistributionBucket {
  return { snapshotId: 's', selectionHash: 'h', metric: 'price', index, lowerBound: lo, upperBound: hi, open, count, share: 0 };
}

const NOOP = (): void => {};

describe('D7 · G1–G3 — somme des barres et sentinelles (EX-SCR-143, EX-DATA-120)', () => {
  const f = fixture(4000, 0xa1);

  it('la somme des barres de G1 égale le nombre de lignes à prix valide (sentinelles exclues)', () => {
    // Sonde AMENDÉE (D-31, justification D-44). `V_price` d'EX-DATA-60 écarte les DEUX sentinelles
    // d'EX-DATA-19 : l'absolue (drapeau d'ingestion) et la RELATIVE à la cellule
    // (`prix < 0,10 × médianeRéf(C₃ = Σ)`, posée à l'analyse). Le recomptage indépendant refait les
    // deux passes du moteur ; sans la seconde il comparait la somme des barres à un échantillon
    // plus large que celui que le moteur bine, et le titre de la sonde (« sentinelles exclues »)
    // n'était tenu qu'à moitié.
    const valides: number[] = [];
    let sentinels = 0;
    for (let r = 0; r < f.batch.rowCount; r++) {
      const p = f.batch.priceEur[r] as number;
      if (p === NUMERIC_UNKNOWN) sentinels++;
      if (isPriceValid(p, f.batch.priceStatus[r] as number, f.batch.ingestFlags[r] as number)) valides.push(p);
    }
    const tri = Float64Array.from(valides).sort();
    const mediane =
      tri.length === 0 ? null
      : tri.length % 2 === 1 ? (tri[(tri.length - 1) / 2] as number)
      : ((tri[tri.length / 2 - 1] as number) + (tri[tri.length / 2] as number)) / 2;
    const seuil = mediane !== null && tri.length >= 12 ? 0.1 * mediane : null;
    const validPrice = seuil === null ? valides.length : valides.filter((p) => p >= seuil).length;
    const model = buildHistogram('price', f.recalc.priceHistogram);
    const sumBars = model.bars.reduce((s, b) => s + b.count, 0);
    expect(sentinels).toBeGreaterThan(0); // la fixture porte bien des sentinelles
    expect(sumBars).toBe(validPrice);
    expect(model.totalCount).toBe(validPrice);
    expect(sumBars).toBeLessThan(f.batch.rowCount); // les non-cotées ne sont jamais comptées
  });

  it('la somme des barres de G3 égale le nombre de lignes à année valide', () => {
    let validYear = 0;
    for (let r = 0; r < f.batch.rowCount; r++) {
      if (isYearValid(f.batch.firstRegistrationYearMonth[r] as number)) validYear++;
    }
    const model = buildHistogram('year', f.recalc.yearHistogram);
    expect(model.bars.reduce((s, b) => s + b.count, 0)).toBe(validYear);
  });
});

describe('D7 · G1–G3 — cas de bord de la géométrie (EX-SCR-19/150)', () => {
  it('un bucket vide AU MILIEU conserve son créneau et une hauteur nulle', () => {
    const m = buildHistogram('price', [bucket(0, 0, 1000, 12), bucket(1, 1000, 2000, 0), bucket(2, 2000, 3000, 7)]);
    expect(m.bars).toHaveLength(3);
    const middle = m.bars[1]!;
    expect(middle.count).toBe(0);
    expect(middle.heightFrac).toBe(0);
    expect(middle.widthFrac).toBeCloseTo(m.bars[0]!.widthFrac, 10);
    expect(middle.xFrac).toBeGreaterThan(m.bars[0]!.xFrac);
  });

  it('valeur unique (n = 1) : une barre pleine hauteur, bascule log absente du DOM (EX-SCR-150)', () => {
    const m = buildHistogram('price', [bucket(0, 9000, 9500, 1)]);
    expect(m.bars).toHaveLength(1);
    expect(m.bars[0]!.heightFrac).toBe(1);
    expect(m.logAvailable).toBe(false);
    const tree = Histogram({ graphId: 'G1', title: 'Offres par prix', metric: 'price', buckets: [bucket(0, 9000, 9500, 1)], log: false, onToggleLog: NOOP });
    expect(findAll(tree, (n) => n.type === 'input')).toHaveLength(0); // aucune case « Échelle log »
  });

  it('n = 0 : le modèle ne produit aucune barre et aucun effectif', () => {
    const m = buildHistogram('price', []);
    expect(m.bars).toHaveLength(0);
    expect(m.totalCount).toBe(0);
    expect(m.maxCount).toBe(0);
    expect(histogramTable(m, formatMetric)).toHaveLength(0);
  });

  it('R-D7-01 — n = 0 : EX-SCR-150 exige un cadre portant « Aucune offre » ; le composant n’en rend aucun', () => {
    const tree = Histogram({ graphId: 'G1', title: 'Offres par prix', metric: 'price', buckets: [], log: false, onToggleLog: NOOP });
    expect(textOf(tree)).toContain('Aucune offre');
  });

  it('R-D7-02 — n = 1 : EX-SCR-150 exige la mention « 1 offre — aucune distribution » sous le titre', () => {
    const tree = Histogram({ graphId: 'G1', title: 'Offres par prix', metric: 'price', buckets: [bucket(0, 9000, 9500, 1)], log: false, onToggleLog: NOOP });
    expect(textOf(tree)).toContain('1 offre — aucune distribution');
  });
});

describe('D7 · G1–G3 — rendu SVG (EX-SCR-148/145) et table équivalente (EX-NFR-15)', () => {
  const many: DistributionBucket[] = [bucket(0, 0, 1000, 100000), bucket(1, 1000, 2000, 1), bucket(2, 2000, 3000, 25)];

  it('EX-SCR-148 : une barre d’effectif 1 face à un maximum de 100 000 mesure au moins 1 px', () => {
    const tree = Histogram({ graphId: 'G1', title: 'Offres par prix', metric: 'price', buckets: many, log: false, onToggleLog: NOOP });
    const rects = findAll(tree, byType('rect')).filter((r) => typeof r.props['height'] === 'number');
    const heights = rects.map((r) => r.props['height'] as number);
    expect(heights.filter((h) => h > 0)).toHaveLength(3);
    expect(Math.min(...heights.filter((h) => h > 0))).toBeGreaterThanOrEqual(1);
  });

  it('EX-NFR-15 : la table de données équivalente est fournie au cadre, une ligne par bin', () => {
    const tree = Histogram({ graphId: 'G1', title: 'Offres par prix', metric: 'price', buckets: many, log: false, onToggleLog: NOOP });
    const tables = findAll(tree, byType('table'));
    expect(tables.length).toBeGreaterThanOrEqual(1);
    const bodyRows = findAll(tables[0], byType('tr'));
    expect(bodyRows.length).toBe(1 + many.length); // ligne d’en-tête + une ligne par bin
    const th = findAll(tables[0], byType('th'));
    expect(th.every((n) => n.props['scope'] === 'col')).toBe(true);
  });

  const NNBSP = '\u202f'; // espace fine insécable, séparateur de milliers fr-BE
  const openBuckets = [
    bucket(0, Number.NEGATIVE_INFINITY, 1000, 4, true),
    bucket(1, 1000, 2000, 9),
    bucket(2, 2000, Number.POSITIVE_INFINITY, 2, true),
  ];

  it('étiquettes fr-BE : espace fine + € / km, bins de débordement en inégalité (EX-DATA-79)', () => {
    const rows = histogramTable(buildHistogram('price', openBuckets), formatMetric);
    expect(rows[0]!.rangeLabel.startsWith('< ')).toBe(true);
    expect(rows[2]!.rangeLabel.startsWith('\u2265 ')).toBe(true);
    expect(rows[1]!.rangeLabel).toBe(`1${NNBSP}000${NNBSP}\u20ac \u2013 2${NNBSP}000${NNBSP}\u20ac`);
    const km = histogramTable(buildHistogram('mileage', [bucket(0, 10000, 20000, 3)]), formatMetric);
    expect(km[0]!.rangeLabel).toBe(`10${NNBSP}000${NNBSP}km \u2013 20${NNBSP}000${NNBSP}km`);
  });

  it('R-D7-04 \u2014 la part de la table \u00e9quivalente est \u00e9crite avec un point d\u00e9cimal (fr-BE exige la virgule, EX-NFR-28/30)', () => {
    const rows = histogramTable(buildHistogram('price', openBuckets), formatMetric);
    const share = rows[1]!.sharePct;
    expect(share.endsWith(`${NNBSP}%`)).toBe(true);
    expect(share).not.toContain('.');
  });

  it('R-D7-03 — EX-SCR-145 : aucune étiquette d’axe X n’est rendue (seul l’axe des effectifs est étiqueté)', () => {
    const tree = Histogram({ graphId: 'G1', title: 'Offres par prix', metric: 'price', buckets: many, log: false, onToggleLog: NOOP });
    const texts = findAll(tree, byType('text'));
    // Attendu : 2 étiquettes d’axe Y (0 et max) + au moins une étiquette de borne de bucket.
    expect(texts.length).toBeGreaterThan(2);
  });
});
