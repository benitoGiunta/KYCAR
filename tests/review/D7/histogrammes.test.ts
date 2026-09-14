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

// D8-24 (EX-SCR-149) : brossage horizontal, `Ctrl` + clic, double-clic. `Histogram` reste un
// composant SANS hook — comme le reste de ce fichier, on APPELLE la fonction directement (aucun
// rendu Preact) et on INVOQUE les gestionnaires attachés aux VNodes `<rect>`/`<svg>` avec de faux
// événements ; c'est exactement la même technique que le reste du fichier, poussée jusqu'aux
// interactions (aucun DOM/jsdom disponible dans cet environnement de sonde, `environment: 'node'`).
describe('D7 · G1–G3 — interactions (EX-SCR-149, D8-24)', () => {
  const five: DistributionBucket[] = [
    bucket(0, 0, 1000, 4),
    bucket(1, 1000, 2000, 6),
    bucket(2, 2000, 3000, 9),
    bucket(3, 3000, 4000, 2),
    bucket(4, 4000, 5000, 5),
  ];

  function render(graphId: string, onSelectBucket: (b: unknown) => void, onClearFilter?: (m: unknown) => void) {
    const tree = Histogram({
      graphId,
      title: 'Offres par prix',
      metric: 'price',
      buckets: five,
      log: false,
      onToggleLog: NOOP,
      onSelectBucket: onSelectBucket as never,
      onClearFilter: onClearFilter as never,
    });
    const rects = findAll(tree, byType('rect')).filter((r) => typeof r.props['onClick'] === 'function');
    const svg = findAll(tree, byType('svg'))[0]!;
    return { rects, svg };
  }

  it('clic simple (sans `Ctrl`) pose le bucket exact — comportement inchangé', () => {
    const calls: unknown[] = [];
    const { rects } = render('G1-simple', (b) => calls.push(b));
    (rects[2]!.props['onClick'] as (e: { ctrlKey: boolean }) => void)({ ctrlKey: false });
    expect(calls).toEqual([five[2]]);
  });

  it('`Ctrl` + clic accumule des buckets NON CONTIGUS et pose l’enveloppe la plus petite qui les englobe', () => {
    const calls: unknown[] = [];
    const { rects } = render('G1-ctrl-accumule', (b) => calls.push(b));
    const onClick = (i: number, ctrlKey: boolean): void => (rects[i]!.props['onClick'] as (e: { ctrlKey: boolean }) => void)({ ctrlKey });
    onClick(1, true); // sélection {1} → enveloppe = bucket 1 seul
    onClick(3, true); // sélection {1, 3} → enveloppe = [lo(1), hi(3)]
    expect(calls).toEqual([
      { lowerBound: 1000, upperBound: 2000 },
      { lowerBound: 1000, upperBound: 4000 },
    ]);
  });

  it('`Ctrl` + clic sur un bucket déjà sélectionné le RETIRE de la sélection (pose l’enveloppe réduite)', () => {
    const calls: unknown[] = [];
    const { rects } = render('G1-ctrl-retire', (b) => calls.push(b));
    const onClick = (i: number, ctrlKey: boolean): void => (rects[i]!.props['onClick'] as (e: { ctrlKey: boolean }) => void)({ ctrlKey });
    onClick(1, true);
    onClick(3, true);
    onClick(1, true); // retire le bucket 1 : ne reste que {3}
    expect(calls).toHaveLength(3);
    expect(calls[2]).toEqual({ lowerBound: 3000, upperBound: 4000 });
  });

  it('`Ctrl` + clic qui retire le DERNIER bucket sélectionné ne pose rien (sélection vide)', () => {
    const calls: unknown[] = [];
    const { rects } = render('G1-ctrl-vide', (b) => calls.push(b));
    const onClick = (i: number, ctrlKey: boolean): void => (rects[i]!.props['onClick'] as (e: { ctrlKey: boolean }) => void)({ ctrlKey });
    onClick(2, true);
    onClick(2, true); // retire le seul bucket sélectionné
    expect(calls).toHaveLength(1); // un seul appel, celui de la première sélection
  });

  it('un clic simple APRÈS un `Ctrl` + clic repart d’une sélection propre (pas de fusion avec l’ancienne)', () => {
    const calls: unknown[] = [];
    const { rects } = render('G1-ctrl-puis-simple', (b) => calls.push(b));
    const click = (i: number, ctrlKey: boolean): void => (rects[i]!.props['onClick'] as (e: { ctrlKey: boolean }) => void)({ ctrlKey });
    click(0, true);
    click(4, false); // clic simple : ignore le bucket 0 précédemment `Ctrl`-cliqué
    expect(calls[calls.length - 1]).toEqual(five[4]);
    // Un `Ctrl` + clic qui suit repart bien à zéro (pas de fusion avec le bucket 0 d’avant) :
    click(1, true);
    expect(calls[calls.length - 1]).toEqual({ lowerBound: 1000, upperBound: 2000 });
  });

  it('brossage horizontal (mousedown → mouseenter × N → mouseup) pose l’intervalle [lo du premier bin, hi du dernier bin]', () => {
    const calls: unknown[] = [];
    const { rects, svg } = render('G1-brush', (b) => calls.push(b));
    (rects[0]!.props['onMouseDown'] as () => void)();
    (rects[1]!.props['onMouseEnter'] as () => void)();
    (rects[2]!.props['onMouseEnter'] as () => void)();
    (svg.props['onMouseUp'] as () => void)();
    expect(calls).toEqual([{ lowerBound: 0, upperBound: 3000 }]); // bucket 0 → bucket 2
  });

  it('un brossage qui ne quitte jamais son bucket de départ (mousedown/mouseup sans déplacement) ne pose rien (c’est un simple clic)', () => {
    const calls: unknown[] = [];
    const { rects, svg } = render('G1-brush-nul', (b) => calls.push(b));
    (rects[2]!.props['onMouseDown'] as () => void)();
    (svg.props['onMouseUp'] as () => void)();
    expect(calls).toHaveLength(0);
  });

  it('quitter la zone de tracé en cours de brossage (`mouseleave`) le termine, comme `mouseup`', () => {
    const calls: unknown[] = [];
    const { rects, svg } = render('G1-brush-leave', (b) => calls.push(b));
    (rects[1]!.props['onMouseDown'] as () => void)();
    (rects[3]!.props['onMouseEnter'] as () => void)();
    (svg.props['onMouseLeave'] as () => void)();
    expect(calls).toEqual([{ lowerBound: 1000, upperBound: 4000 }]);
  });

  it('double-clic dans la zone de tracé retire le filtre posé par CE graphe (`onClearFilter`, métrique du graphe)', () => {
    const cleared: unknown[] = [];
    const { svg } = render('G1-dblclick', NOOP, (m) => cleared.push(m));
    (svg.props['onDblClick'] as () => void)();
    expect(cleared).toEqual(['price']);
  });

  it('un double-clic remet à zéro la sélection `Ctrl` en cours (le `Ctrl` + clic suivant repart de zéro)', () => {
    const calls: unknown[] = [];
    const { rects, svg } = render('G1-dblclick-reset', (b) => calls.push(b));
    const click = (i: number, ctrlKey: boolean): void => (rects[i]!.props['onClick'] as (e: { ctrlKey: boolean }) => void)({ ctrlKey });
    click(0, true);
    (svg.props['onDblClick'] as () => void)();
    click(4, true);
    expect(calls[calls.length - 1]).toEqual({ lowerBound: 4000, upperBound: 5000 }); // bucket 4 seul, pas fusionné avec 0
  });
});
