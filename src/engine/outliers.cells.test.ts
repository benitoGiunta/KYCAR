import { describe, expect, it } from 'vitest';
import { allFixtureRows, makeFixtureBatch, type FixtureRow } from './batch-fixture';
import { detectOutliers } from './outliers';
import { AggregationDataset } from './kernel';
import { OUTLIER_NOT_EVALUABLE_CODES } from '../types/index';

/**
 * D8-07 (statistiques de cellule et `R²` — EX-DATA-86/87/93bis, EX-SCR-164) et D8-09 (verdicts
 * `INSUFFICIENT_DATA` / `INSUFFICIENT_SPREAD` — EX-DATA-85/86/89/95).
 *
 * Le `R²` est confronté à un ORACLE INDÉPENDANT : quand `EX-DATA-91` retire le régresseur
 * kilométrage (kilométrage constant sur la cellule), le modèle se réduit à une régression simple de
 * `y = ln(p)` sur l'année centrée, dont le coefficient de détermination est le CARRÉ DU COEFFICIENT
 * DE CORRÉLATION de Pearson — formule fermée que le test calcule en cinq lignes, sans réutiliser
 * une seule ligne du moteur.
 */

function run(rows: readonly FixtureRow[]) {
  const batch = makeFixtureBatch(rows);
  return { batch, out: detectOutliers(batch, allFixtureRows(batch), 'snap', 'sel') };
}

/** `r²` de Pearson entre deux séries — oracle indépendant du `R²` d'une régression SIMPLE. */
function pearsonR2(xs: readonly number[], ys: readonly number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = (xs[i] as number) - mx;
    const dy = (ys[i] as number) - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return (sxy * sxy) / (sxx * syy);
}

describe('EX-DATA-93bis — R² de la passe 2, publié par cellule', () => {
  /**
   * 40 annonces d'une même cellule `C₂`, kilométrage CONSTANT (le régresseur `x2` est retiré par
   * `EX-DATA-91`), millésimes 2010…2019, et `ln(prix)` affine en l'année plus une perturbation
   * déterministe de faible amplitude (aucune ne franchit `|z| = 3,5`, la passe 2 refait donc
   * l'ajustement sur `F' = F` et les coefficients sont ceux des moindres carrés sur `F`).
   */
  const rows: FixtureRow[] = Array.from({ length: 40 }, (_v, i) => {
    const year = 2010 + (i % 10);
    const noise = [0.02, -0.03, 0.01, -0.015][i % 4] as number;
    return {
      makeId: 1,
      modelId: 101,
      year,
      month: 1 + (i % 12),
      mileage: 50_000,
      price: Math.round(Math.exp(9 + 0.08 * (year - 2014.5) + noise)),
      idRank: i,
    };
  });

  it('R² = 1 − SCR/SCT sur F complet, en échelle ln(p), arrondi à 2 décimales', () => {
    const { batch, out } = run(rows);
    const cell = out.cellStats.find((c) => c.cellLevel === 'MODEL');
    expect(cell).toBeDefined();
    expect(cell?.fitCount).toBe(40);

    const years: number[] = [];
    const lnPrices: number[] = [];
    for (let row = 0; row < batch.rowCount; row++) {
      years.push(Math.floor((batch.firstRegistrationYearMonth[row] as number) / 12));
      lnPrices.push(Math.log(batch.priceEur[row] as number));
    }
    const expected = Math.round(pearsonR2(years, lnPrices) * 100) / 100;
    expect(cell?.rSquared).toBe(expected);
    expect(cell?.rSquared).toBeGreaterThan(0.3);
    expect(cell?.rSquaredWarning).toBe(false);
  });

  it('ajustement PARFAIT : R² = 1,00 (aucune perturbation, prix exactement log-linéaire)', () => {
    const perfect: FixtureRow[] = Array.from({ length: 40 }, (_v, i) => {
      const year = 2010 + (i % 10);
      return {
        year,
        month: 1 + (i % 12),
        mileage: 20_000 + i * 1_000,
        price: Math.round(Math.exp(9 + 0.1 * (year - 2014.5) - 0.02 * ((20_000 + i * 1_000) / 10_000))),
        idRank: i,
      };
    });
    const cell = run(perfect).out.cellStats.find((c) => c.cellLevel === 'MODEL');
    expect(cell?.rSquared).toBe(1);
    expect(cell?.rSquaredWarning).toBe(false);
  });

  it('EX-SCR-164 — l’avertissement R² < 0,30 est posé quand le modèle n’explique presque rien', () => {
    // Prix alternés indépendants de l'année et du kilométrage : le modèle ne peut rien expliquer.
    const noisy: FixtureRow[] = Array.from({ length: 40 }, (_v, i) => ({
      year: 2010 + (i % 10),
      month: 1 + (i % 12),
      mileage: 20_000 + i * 1_000,
      price: i % 2 === 0 ? 12_000 : 24_000,
      idRank: i,
    }));
    const cell = run(noisy).out.cellStats.find((c) => c.cellLevel === 'MODEL');
    expect(cell?.rSquared).not.toBeNull();
    expect(cell?.rSquared as number).toBeLessThan(0.3);
    expect(cell?.rSquaredWarning).toBe(true);
  });

  it('dispersion nulle : R² = null (SCT = 0), MAD = 0 mesuré, et jamais 0 « par défaut »', () => {
    const flat: FixtureRow[] = Array.from({ length: 40 }, (_v, i) => ({
      year: 2010 + (i % 10),
      month: 1 + (i % 12),
      mileage: 20_000 + i * 1_000,
      price: 15_000,
      idRank: i,
    }));
    const cell = run(flat).out.cellStats.find((c) => c.cellLevel === 'MODEL');
    expect(cell?.rSquared).toBeNull();
    expect(cell?.rSquaredWarning).toBe(false);
    expect(cell?.median).toBe(15_000);
    expect(cell?.mad).toBe(0);
    expect(cell?.fitCount).toBe(0); // M2 n'est pas applicable : aucun ajustement n'a été fait
  });
});

describe('EX-DATA-86 / EX-DATA-87 — la cellule retenue est publiée avec ses statistiques', () => {
  it('cellLevel, effectif hors implausibles, médiane et MAD de V_price(C)', () => {
    // 12 annonces d'un même modèle et d'une même année ⇒ cellule de rang 1 (MODEL_YEAR).
    const prices = [10_000, 10_200, 10_400, 10_600, 10_800, 11_000, 11_200, 11_400, 11_600, 11_800, 12_000, 12_200];
    const { out } = run(prices.map((price, i) => ({ year: 2018, month: 1 + (i % 12), price, idRank: i })));
    const cell = out.cellStats.find((c) => c.cellLevel === 'MODEL_YEAR');
    expect(cell).toBeDefined();
    expect(cell?.n).toBe(12);
    // Type 7 sur 12 valeurs : h = 6,5 ⇒ (11 000 + 11 200)/2 = 11 100.
    expect(cell?.median).toBe(11_100);
    // |p − 11 100| trié : 100, 100, 300, 300, 500, 500, 700, 700, 900, 900, 1 100, 1 100 ; le MAD est
    // lui aussi une MÉDIANE de type 7 (EX-DATA-62) : h = 6,5 ⇒ 500 + 0,5 · (700 − 500) = 600.
    expect(cell?.mad).toBe(600);
    expect(cell?.implausibleInCellCount).toBe(0);
    expect(cell?.fitCount).toBe(0); // M2 démarre à 30 : aucune régression sur 12 annonces
  });
});

describe('D8-09 — un verdict par annonce NON ÉVALUABLE (EX-DATA-85/86/89/95)', () => {
  const cellOf = (n: number, price = 20_000): FixtureRow[] =>
    Array.from({ length: n }, (_v, i) => ({
      year: 2015 + (i % 6),
      month: 1 + (i % 12),
      mileage: 30_000 + i * 1_000,
      price: price + i * 137,
      idRank: i,
    }));

  it('aucune cellule à n_price ≥ 12 : INSUFFICIENT_DATA pour CHAQUE annonce, score null', () => {
    const { out } = run(cellOf(11));
    expect(out.verdicts).toHaveLength(11);
    expect(out.verdicts.flatMap((v) => v.flags)).toEqual(Array(11).fill('INSUFFICIENT_DATA'));
    expect(out.verdicts.every((v) => v.opportunityScore === null)).toBe(true);
    expect(out.verdicts.every((v) => v.expectedPriceEur === null)).toBe(true);
    expect(out.evaluation.evaluated).toBe(0);
    expect(out.evaluation.notEvaluable.INSUFFICIENT_DATA).toBe(11);
    expect(out.evaluation.notEvaluable.INSUFFICIENT_SPREAD).toBe(0);
    expect(out.evaluation.notEvaluableTotal).toBe(11);
  });

  it('EX-DATA-89 — IQR(ln p) = 0 : INSUFFICIENT_SPREAD, et AUCUN drapeau de détection', () => {
    const flat: FixtureRow[] = Array.from({ length: 20 }, (_v, i) => ({
      year: 2018,
      month: 1 + (i % 12),
      mileage: 30_000 + i * 1_000,
      price: 15_000,
      idRank: i,
    }));
    const { out } = run(flat);
    expect(out.verdicts).toHaveLength(20);
    expect(out.verdicts.every((v) => v.flags.includes('INSUFFICIENT_SPREAD'))).toBe(true);
    expect(out.verdicts.every((v) => v.flags.length === 1)).toBe(true);
    expect(out.evaluation.notEvaluable.INSUFFICIENT_SPREAD).toBe(20);
    expect(out.evaluation.evaluated).toBe(0);
  });

  it('les deux codes appartiennent au vocabulaire gelé et à ses codes de non-évaluabilité', () => {
    const codes = new Set(run(cellOf(11)).out.verdicts.flatMap((v) => v.flags));
    for (const code of codes) expect(OUTLIER_NOT_EVALUABLE_CODES as readonly string[]).toContain(code);
  });

  it('EX-DATA-95 — évaluées et non évaluables sont deux états distincts, et leur somme est exacte', () => {
    // 12 annonces à prix dispersé (évaluables) + 3 sans prix affiché + 1 à prix sur demande.
    const rows: FixtureRow[] = [
      ...cellOf(12),
      { price: null, status: 'MISSING', idRank: 90 },
      { price: null, status: 'MISSING', idRank: 91 },
      { price: null, status: 'MISSING', idRank: 92 },
      { price: null, status: 'ON_REQUEST', idRank: 93 },
    ];
    const batch = makeFixtureBatch(rows);
    const recalc = new AggregationDataset(batch).recalculate({ selectionHash: 'FULL:EMPTY' });
    const counters = recalc.outlierEvaluation;
    expect(counters).toBeDefined();
    const e = counters as NonNullable<typeof counters>;
    // Invariant I6 (EX-DATA-104) plus sa ventilation D8-09.
    expect(e.evaluated + e.notEvaluableTotal + e.priceExcluded + e.implausibleInCell).toBe(
      recalc.selectionStats.priceQuotedCount,
    );
    expect(e.notEvaluableTotal + e.priceExcluded + e.implausibleInCell).toBe(
      recalc.selectionStats.outlierNotEvaluatedCount,
    );
    expect(e.evaluated).toBe(recalc.selectionStats.outlierEvaluatedCount);
    expect(e.evaluated).toBe(12);
    expect(e.notEvaluableTotal).toBe(0);
  });

  it('EX-DATA-19(2) — une annonce implausible en cellule ne reçoit AUCUN verdict, pas même de non-évaluabilité', () => {
    const rows: FixtureRow[] = [...cellOf(12), { year: 2016, mileage: 40_000, price: 900, idRank: 99 }];
    const { batch, out } = run(rows);
    expect(out.evaluation.implausibleInCell).toBe(1);
    expect(out.implausibleInCellIds.size).toBe(1);
    const implausibleId = [...out.implausibleInCellIds][0] as string;
    expect(out.verdicts.some((v) => v.listingId === implausibleId)).toBe(false);
    expect(batch.rowCount).toBe(13);
  });
});
