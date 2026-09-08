import { describe, expect, it } from 'vitest';
import { AggregationDataset } from '../../../src/engine/kernel';
import { decodeListingId } from '../../../src/engine/uuid';
import { OUTLIER_FLAG_VALUES } from '../../../src/types/index';
import { cellRows, makeBatch, type RowSpec } from './helpers';

/**
 * Revue D4 — seuils d'effectif M1 (n ≥ 12) / M2 (|F| ≥ 30) : ADV-06 (n = 10/11 → décision ARB-17 :
 * 5 ≤ n ≤ 11 aucune détection ; 12 ≤ n ≤ 29 M1 seule ; n ≥ 30 M1 + M2) et ADV-07 (discontinuité
 * M1 → M2 à n = 29 → 30, décision ARB-18 : assumée mais NOMMÉE — la méthode est publiée).
 * Cellule unique (marque 1, modèle 101) : C₂ = C₃ = Σ ; C₁ (modèle·année) < 12 partout.
 * La ligne 0 reçoit un prix ×0,1 (outlier bas certain pour M1 comme pour M2).
 */

function cellWithLowOutlier(n: number): { rows: RowSpec[]; outlierRow: number } {
  const rows = cellRows(n, { seed: 5, basePrice: 20_000 });
  const first = rows[0] as RowSpec;
  rows[0] = { ...first, price: Math.max(500, Math.round((first.price as number) * 0.1)) };
  return { rows, outlierRow: 0 };
}

function run(n: number) {
  const { rows, outlierRow } = cellWithLowOutlier(n);
  const batch = makeBatch(rows);
  const result = new AggregationDataset(batch).recalculate({ selectionHash: 'FULL:EMPTY' });
  const outlierId = decodeListingId(batch.listingId, outlierRow);
  return { result, outlierId, batch };
}

describe('ADV-06 / ARB-17 — n = 11 : aucune détection ; n = 12 : M1 seule', () => {
  it('n = 11 : evaluated = 0, notEvaluated = 11, aucun verdict ; les statistiques restent calculées (le masquage 5 ≤ n ≤ 11 relève de l’écran)', () => {
    const { result } = run(11);
    expect(result.selectionStats.priceQuotedCount).toBe(11);
    expect(result.selectionStats.outlierEvaluatedCount).toBe(0);
    expect(result.selectionStats.outlierNotEvaluatedCount).toBe(11);
    expect(result.outlierVerdicts).toEqual([]);
    expect(result.selectionStats.price.p50).not.toBeNull();
    expect(result.selectionStats.price.p05).not.toBeNull();
  });

  it('n = 1..11 : jamais de verdict, evaluated = 0 pour chaque effectif', () => {
    for (let n = 1; n <= 11; n++) {
      const { result } = run(n);
      expect(result.outlierVerdicts.length).toBe(0);
      expect(result.selectionStats.outlierEvaluatedCount).toBe(0);
      expect(result.selectionStats.outlierNotEvaluatedCount).toBe(n);
    }
  });

  it('n = 12 : M1 évalue les 12 annonces (IQR > 0), signale l’outlier ×0,1 en M1 seulement, cellLabel = MODEL, cellCount = 12', () => {
    const { result, outlierId } = run(12);
    expect(result.selectionStats.outlierEvaluatedCount).toBe(12);
    const v = result.outlierVerdicts.filter((x) => x.listingId === outlierId);
    expect(v.map((x) => x.method)).toEqual(['M1']);
    expect(v[0]?.flags).toContain('M1_LOW');
    expect(v[0]?.cellLabel).toBe('MODEL');
    expect(v[0]?.cellCount).toBe(12);
    expect(v[0]?.expectedPriceEur).toBeNull();
    expect(result.outlierVerdicts.some((x) => x.method === 'M2')).toBe(false);
  });

  // Promotion 2.6 (D-49) : sonde rouge convertie en it.fails — elle documente une dette consignée et se
  // signalera d elle-même (échec de it.fails) le jour où la dette est levée. Jamais skip.
  // DETTE DR-114 / D-45 : verdicts INSUFFICIENT_* exigeraient d étendre un vocabulaire gelé (6 → 8 codes) ; à instruire en 2.7 avec l annexe A.
  it.fails('R-D4-05 — n = 11 : EX-DATA-85/86/95 exigent un verdict INSUFFICIENT_DATA par annonce non évaluable ; le moteur n’en émet aucun et le vocabulaire gelé D2 ne contient pas ce code', () => {
    const { result } = run(11);
    const codes = OUTLIER_FLAG_VALUES.map((v) => v.code);
    console.log(`[vocab KYCAR_OUTLIER_FLAG] ${codes.join(', ')}`);
    expect(codes).toContain('INSUFFICIENT_DATA');
    expect(result.outlierVerdicts.filter((v) => v.flags.includes('INSUFFICIENT_DATA')).length).toBe(11);
  });
});

describe('ADV-07 / ARB-18 — n = 29 → 30 : bascule M1 → M2 du score, méthode publiée', () => {
  it('n = 29 : seule M1 est appliquée ; opportunityScore = −zIqr ; expectedPriceEur = null', () => {
    const { result, outlierId } = run(29);
    const v = result.outlierVerdicts.filter((x) => x.listingId === outlierId);
    expect(v.map((x) => x.method)).toEqual(['M1']);
    expect(result.outlierVerdicts.some((x) => x.method === 'M2')).toBe(false);
    expect(v[0]?.opportunityScore).not.toBeNull();
    expect(v[0]?.expectedPriceEur).toBeNull();
    expect(result.selectionStats.outlierEvaluatedCount).toBe(29);
  });

  it('n = 30 : M2 devient applicable (|F| = 30) ; un verdict M2 s’ajoute avec expectedPriceEur ; le score de l’annonce change de méthode (−zIqr → −z), la méthode est nommée sur chaque verdict', () => {
    const r29 = run(29);
    const r30 = run(30);
    const v29 = r29.result.outlierVerdicts.find((x) => x.listingId === r29.outlierId && x.method === 'M1');
    const v30m1 = r30.result.outlierVerdicts.find((x) => x.listingId === r30.outlierId && x.method === 'M1');
    const v30m2 = r30.result.outlierVerdicts.find((x) => x.listingId === r30.outlierId && x.method === 'M2');
    expect(v29).toBeDefined();
    expect(v30m1).toBeDefined();
    expect(v30m2).toBeDefined();
    expect(v30m2?.flags).toContain('M2_LOW');
    expect(v30m2?.expectedPriceEur).not.toBeNull();
    expect(v30m2?.cellLabel).toBe('MODEL');
    expect(v30m2?.cellCount).toBe(30);
    // Discontinuité ADV-07 : le score publié sur la même annonce n'est plus −zIqr mais −z (EX-DATA-94).
    expect(v30m1?.opportunityScore).toBe(v30m2?.opportunityScore);
    expect(v30m1?.opportunityScore).not.toBe(v29?.opportunityScore);
    console.log(
      `[ADV-07] n=29 : score(M1) = ${(v29?.opportunityScore as number).toFixed(3)} ; ` +
        `n=30 : score = ${(v30m2?.opportunityScore as number).toFixed(3)} (M2, prix attendu ${Math.round(v30m2?.expectedPriceEur as number)} €) — ` +
        `méthode publiée : ${[v30m1?.method, v30m2?.method].join('/')}`,
    );
    // Les deux méthodes sont distinguables : un classement ne mélange jamais les deux échelles (ARB-18).
    expect(new Set(r30.result.outlierVerdicts.map((x) => x.method))).toEqual(new Set(['M1', 'M2']));
  });
});

describe('Couverture des verdicts (EX-DATA-92/94, EX-SCR-203 « écart au prix attendu »)', () => {
  it('R-D4-06 — à n = 40 (M2 applicable à tout F), p̂ᵢ / δᵢ / opportunityScore doivent exister pour les 40 annonces ; le moteur ne publie de verdict que pour les annonces SIGNALÉES', () => {
    const { result } = run(40);
    expect(result.selectionStats.outlierEvaluatedCount).toBe(40);
    const withVerdict = new Set(result.outlierVerdicts.map((v) => v.listingId));
    console.log(`[couverture verdicts] n=40 évaluées=${result.selectionStats.outlierEvaluatedCount} ; annonces avec verdict=${withVerdict.size}`);
    expect(withVerdict.size).toBe(40);
  });
});

describe('EX-DATA-86/90 — choix de cellule M2 quand n_price(C₂) ≥ 30 mais |F(C₂)| < 30', () => {
  it('R-D4-07 — la cellule est choisie sur n_price (« première règle satisfaite ») et le verdict est INSUFFICIENT_DATA ; le moteur retombe sur C₃ et publie un verdict M2 au niveau SELECTION', () => {
    // Modèle A : 36 annonces à prix valide dont 16 SANS kilométrage (|F(A)| = 20 < 30, n_price = 36 ≥ 30).
    const a = cellRows(36, { makeId: 1, modelId: 101, basePrice: 20_000, seed: 3 }).map((r, i) => (i >= 20 ? { ...r, mileage: null } : r));
    const firstA = a[0] as RowSpec;
    a[0] = { ...firstA, price: Math.max(500, Math.round((firstA.price as number) * 0.1)) }; // outlier bas, km valide
    // Modèle B : 100 annonces complètes de la même marque (rend C₃ ajustable : |F(Σ)| = 120).
    const b = cellRows(100, { makeId: 1, modelId: 102, basePrice: 30_000, seed: 4 });
    const batch = makeBatch([...a, ...b]);
    const result = new AggregationDataset(batch).recalculate({ selectionHash: 'FULL:EMPTY' });
    const outlierId = decodeListingId(batch.listingId, 0);
    const m1 = result.outlierVerdicts.find((v) => v.listingId === outlierId && v.method === 'M1');
    const m2 = result.outlierVerdicts.find((v) => v.listingId === outlierId && v.method === 'M2');
    expect(m1?.cellLabel).toBe('MODEL'); // M1 : C₂, n_price = 36 ≥ 12
    console.log(`[cellule M2] n_price(C₂)=36, |F(C₂)|=20 → verdict M2 moteur : ${m2 ? `${m2.cellLabel} (cellCount ${m2.cellCount})` : 'aucun'}`);
    expect(m2).toBeUndefined();
  });
});
