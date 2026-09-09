/**
 * KYCAR — sondes `P-31` … `P-45`, `P-83`, `P-90` … `P-92` : prix, TVA, évaluation, statut de prix.
 * =================================================================================================
 * Agent `data-review` (phase 3.3).
 */
import { describe, expect, it } from 'vitest';

import {
  IS_TEST_PROFILE,
  MILEAGE_ANOMALY_CODES,
  PRICE_ANOMALY_CODES,
  PROFILE,
  type RawListing,
  ageYears,
  cohenKappa,
  declaredIds,
  firstRegYear,
  increasingViolations,
  loadProfile,
  loadSnapshot,
  measure,
  mean,
  median,
  ols2,
  openCanonicalBatch,
  pct,
  pearson,
  price,
  priceStatus,
  s0,
  segmentOf,
  snapshotIds,
  stratifiedMedianRatio,
} from './harness';

/** Sonde dont la tolérance n'est pas atteignable au VOLUME `dev` (bruit d'échantillonnage, EG-12). */
const devSamplingNoise = IS_TEST_PROFILE ? it : it.fails;

const snap = (): ReturnType<typeof s0> => s0();

/** Annonces à prix affiché, anomalies de prix DÉCLARÉES écartées (hypothèse écrite, harness §12). */
function quotedClean(): RawListing[] {
  const excluded = declaredIds(snap(), ...PRICE_ANOMALY_CODES);
  return snap().rows.filter((r) => price(r) !== undefined && !excluded.has(r.id));
}

describe('P-31 … P-36 — niveau, dispersion et structure des prix', () => {
  it('P-31 — médiane des prix affichés dans [13 500, 18 500]', () => {
    const clean = quotedClean().map((r) => price(r) as number);
    const raw = snap()
      .rows.map((r) => price(r))
      .filter((p): p is number => p !== undefined);
    const m = median(clean);
    measure('P-31', `médiane ${m} € (n=${clean.length}) ; sans exclusion ${median(raw)} € (n=${raw.length})`);
    expect(m).toBeGreaterThanOrEqual(13_500);
    expect(m).toBeLessThanOrEqual(18_500);
  });

  it('P-32 — rapport moyenne / médiane des prix affichés dans [1,15 ; 1,40]', () => {
    const clean = quotedClean().map((r) => price(r) as number);
    const raw = snap()
      .rows.map((r) => price(r))
      .filter((p): p is number => p !== undefined);
    const ratio = mean(clean) / median(clean);
    measure(
      'P-32',
      `${ratio.toFixed(3)} (moyenne ${Math.round(mean(clean))} €) ; sans exclusion ${(mean(raw) / median(raw)).toFixed(3)}`,
    );
    expect(ratio).toBeGreaterThanOrEqual(1.15);
    expect(ratio).toBeLessThanOrEqual(1.4);
  });

  const agedClean = (): { p: number[]; age: number[] } => {
    const p: number[] = [];
    const age: number[] = [];
    for (const r of quotedClean()) {
      const a = ageYears(r, snap());
      if (a === undefined) continue;
      p.push(price(r) as number);
      age.push(a);
    }
    return { p, age };
  };

  it('P-33 — corr(ln prix, âge) < −0,65', () => {
    const { p, age } = agedClean();
    const c = pearson(p.map((x) => Math.log(x)), age);
    measure('P-33', `${c.toFixed(4)} sur ${p.length} annonces`);
    expect(c).toBeLessThan(-0.65);
  });

  it('P-34 — corr(prix, âge) < −0,45', () => {
    const { p, age } = agedClean();
    const c = pearson(p, age);
    measure('P-34', `${c.toFixed(4)} sur ${p.length} annonces`);
    expect(c).toBeLessThan(-0.45);
  });

  it('P-35 — OLS ln(prix) ~ année centrée + km/10 000 : β1 ∈ [0,055 ; 0,100], β2 ∈ [−0,055 ; −0,022]', () => {
    const excludedKm = declaredIds(snap(), ...MILEAGE_ANOMALY_CODES);
    const y: number[] = [];
    const years: number[] = [];
    const km: number[] = [];
    for (const r of quotedClean()) {
      const yr = firstRegYear(r);
      if (yr === undefined || r.mileage === undefined || excludedKm.has(r.id)) continue;
      y.push(Math.log(price(r) as number));
      years.push(yr);
      km.push(r.mileage / 10_000);
    }
    const my = mean(years);
    const { beta1, beta2 } = ols2(y, years.map((v) => v - my), km);
    measure('P-35', `β1 ${beta1.toFixed(5)} · β2 ${beta2.toFixed(5)} sur n=${y.length}`);
    expect(beta1).toBeGreaterThanOrEqual(0.055);
    expect(beta1).toBeLessThanOrEqual(0.1);
    expect(beta2).toBeGreaterThanOrEqual(-0.055);
    expect(beta2).toBeLessThanOrEqual(-0.022);
  });

  it('P-36 — prix médian par année de 1re immatriculation croissant sur 2008..2024 (1 inversion)', () => {
    const clean = quotedClean();
    const years = Array.from({ length: 17 }, (_, i) => 2008 + i);
    const series = years.map((yy) => median(clean.filter((r) => firstRegYear(r) === yy).map((r) => price(r) as number)));
    const bad = increasingViolations(series);
    measure('P-36', `${years.map((yy, i) => `${yy}:${series[i]}`).join(' ')} — ${bad} inversion(s)`);
    expect(bad).toBeLessThanOrEqual(1);
  });
});

describe('P-37, P-38, P-39 — primes et arrondis', () => {
  const ageBucket = (r: RawListing): string | undefined => {
    const a = ageYears(r, snap());
    if (a === undefined) return undefined;
    return a <= 3 ? '0-3' : a <= 6 ? '4-6' : a <= 10 ? '7-10' : '11+';
  };
  const powerBucket = (r: RawListing): string | undefined => {
    const k = r.power;
    if (k === undefined) return undefined;
    return k < 75 ? 'a' : k < 110 ? 'b' : k < 150 ? 'c' : 'd';
  };

  devSamplingNoise('P-37 — prime électrique 5 à 25 % à segment, âge et puissance comparables (dev : bruit)', () => {
    const res = stratifiedMedianRatio(
      quotedClean(),
      (r) => {
        const s = segmentOf(r);
        const a = ageBucket(r);
        const p = powerBucket(r);
        return s === undefined || a === undefined || p === undefined ? undefined : `${s}|${a}|${p}`;
      },
      (r) => (r.fuelCategory === 'E' ? 'A' : r.fuelCategory === 'B' ? 'B' : undefined),
      (r) => price(r),
      3,
    );
    measure('P-37', `E/B = ${res.ratio.toFixed(4)} sur ${res.strata} strates appariées (poids ${res.weight})`);
    expect(res.strata).toBeGreaterThan(5);
    expect(res.ratio).toBeGreaterThanOrEqual(1.05);
    expect(res.ratio).toBeLessThanOrEqual(1.25);
  });

  devSamplingNoise('P-38 — prime professionnelle PRO/PRIVÉ dans [1,02 ; 1,12] à segment et âge comparables (dev : bruit)', () => {
    const res = stratifiedMedianRatio(
      quotedClean(),
      (r) => {
        const s = segmentOf(r);
        const a = ageYears(r, snap());
        return s === undefined || a === undefined ? undefined : `${s}|${a}`;
      },
      (r) => (r.seller?.type === 'D' ? 'A' : r.seller?.type === 'P' ? 'B' : undefined),
      (r) => price(r),
      5,
    );
    measure('P-38', `PRO/PRIVÉ = ${res.ratio.toFixed(4)} sur ${res.strata} strates appariées (poids ${res.weight})`);
    expect(res.strata).toBeGreaterThan(5);
    expect(res.ratio).toBeGreaterThanOrEqual(1.02);
    expect(res.ratio).toBeLessThanOrEqual(1.12);
  });

  it('P-39 — part des prix se terminant par 990, 950, 900, 500 ou 000 dans [0,70 ; 0,88]', () => {
    const endings = new Set([990, 950, 900, 500, 0]);
    const clean = quotedClean();
    const share = clean.filter((r) => endings.has((price(r) as number) % 1000)).length / clean.length;
    measure('P-39', `${pct(share)} sur ${clean.length} prix affichés (écart EG-07 : 20 % laissés à l’euro)`);
    expect(share).toBeGreaterThanOrEqual(0.7);
    expect(share).toBeLessThanOrEqual(0.88);
  });
});

describe('P-40 … P-44, P-90 … P-92 — statut de prix, TVA, formes de montant', () => {
  it('P-40 — part de ON_REQUEST dans [0,02 ; 0,05]', () => {
    for (const sn of loadProfile()) {
      const share = sn.rows.filter((r) => priceStatus(r) === 'ON_REQUEST').length / sn.rows.length;
      if (sn.snapshotId === snap().snapshotId) measure('P-40', `${pct(share)}`);
      expect(share, sn.snapshotId).toBeGreaterThanOrEqual(0.02);
      expect(share, sn.snapshotId).toBeLessThanOrEqual(0.05);
    }
  });

  it('P-41 — part de MISSING dans [0,004 ; 0,009] et 100 % déclarés PRICE_MISSING_UNDECLARED', () => {
    const sn = snap();
    const declared = declaredIds(sn, 'PRICE_MISSING_UNDECLARED');
    const missing = sn.rows.filter((r) => priceStatus(r) === 'MISSING');
    const undeclared = missing.filter((r) => !declared.has(r.id));
    const share = missing.length / sn.rows.length;
    measure('P-41', `${pct(share)} (${missing.length} annonces), ${undeclared.length} non déclarée(s)`);
    expect(share).toBeGreaterThanOrEqual(0.004);
    expect(share).toBeLessThanOrEqual(0.009);
    expect(undeclared.length).toBe(0);
  });

  it('P-42 — aucun particulier ne porte isTaxDeductible', () => {
    let bad = 0;
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        if (r.seller?.type !== 'P') continue;
        if (r.prices?.public?.isTaxDeductible !== undefined) bad += 1;
      }
    }
    measure('P-42', `${bad} annonce(s) PRIVATE portant isTaxDeductible`);
    expect(bad).toBe(0);
  });

  it('P-43 — TVA déductible chez les PRO renseignés dans [0,31 ; 0,39]', () => {
    const sn = snap();
    const known = sn.rows.filter((r) => r.seller?.type === 'D' && r.prices?.public?.isTaxDeductible !== undefined);
    const share = known.filter((r) => r.prices?.public?.isTaxDeductible === true).length / known.length;
    measure('P-43', `${pct(share)} sur ${known.length} annonces PRO à champ renseigné`);
    expect(share).toBeGreaterThanOrEqual(0.31);
    expect(share).toBeLessThanOrEqual(0.39);
  });

  it('P-44 — netPrice présent ⟺ isTaxDeductible = vrai, et net = round(prix / 1,21) ± 1', () => {
    let mismatchPresence = 0;
    let mismatchValue = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        const p = r.prices?.public;
        if (!p) continue;
        const deductible = p.isTaxDeductible === true;
        if (deductible !== (p.netPrice !== undefined)) {
          mismatchPresence += 1;
          if (sample === '') sample = `${r.id} déductible=${String(deductible)} netPrice=${String(p.netPrice)}`;
        }
        if (p.netPrice !== undefined && p.price !== undefined) {
          if (Math.abs(p.netPrice - Math.round(p.price / 1.21)) > 1) {
            mismatchValue += 1;
            if (sample === '') sample = `${r.id} net ${p.netPrice} vs ${Math.round(p.price / 1.21)}`;
          }
        }
      }
    }
    measure('P-44', `${mismatchPresence} écart(s) de présence, ${mismatchValue} écart(s) de valeur ${sample}`);
    expect(mismatchPresence).toBe(0);
    expect(mismatchValue).toBe(0);
  });

  it('P-90 — 100 % des onRequestOnly = true ont price ABSENT hors A-20', () => {
    let bad = 0;
    let declared = 0;
    for (const sn of loadProfile()) {
      const decl = declaredIds(sn, 'PRICE_ON_REQUEST_WITH_AMOUNT');
      for (const r of sn.rows) {
        if (r.prices?.public?.onRequestOnly !== true) continue;
        if (r.prices.public.price === undefined) continue;
        if (decl.has(r.id)) {
          declared += 1;
          continue;
        }
        bad += 1;
      }
    }
    measure('P-90', `${bad} annonce(s) ON_REQUEST avec montant non déclarée(s), ${declared} déclarée(s) A-20`);
    expect(bad).toBe(0);
  });

  it('P-91 — netPrice < price, vatRate à une seule décimale, currency = EUR dès qu’un montant est servi', () => {
    let badLt = 0;
    let badVat = 0;
    let badCur = 0;
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        const p = r.prices?.public;
        if (!p) continue;
        if (p.netPrice !== undefined && p.price !== undefined && !(p.netPrice < p.price)) badLt += 1;
        if (p.vatRate !== undefined && !/^\d+(\.\d)?$/.test(String(p.vatRate))) badVat += 1;
        if ((p.price !== undefined || p.netPrice !== undefined) && p.currency !== 'EUR') badCur += 1;
      }
      const msrp = sn.rows.filter((r) => r.prices?.manufacturersSuggestedRetail !== undefined);
      badCur += msrp.filter((r) => r.prices?.manufacturersSuggestedRetail?.currency !== 'EUR').length;
    }
    measure('P-91', `${badLt} net ≥ prix · ${badVat} vatRate à plus d’une décimale · ${badCur} devise ≠ EUR`);
    expect(badLt).toBe(0);
    expect(badVat).toBe(0);
    expect(badCur).toBe(0);
  });

  it('P-92 — part d’annonces à prix affiché ≥ 0,80', () => {
    for (const sn of loadProfile()) {
      const share = sn.rows.filter((r) => priceStatus(r) === 'QUOTED').length / sn.rows.length;
      if (sn.snapshotId === snap().snapshotId) measure('P-92', `${pct(share)}`);
      expect(share, sn.snapshotId).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('P-83 — isSuperDeal : PRO seulement, catégories 1-2 seulement, taux dans [0,025 ; 0,055]', () => {
    const sn = snap();
    const sd = sn.rows.filter((r) => r.superDeal === true);
    const nonPro = sd.filter((r) => r.seller?.type !== 'D').length;
    const badCat = sd.filter((r) => {
      const c = r.prices?.public?.evaluation?.category;
      return c !== 1 && c !== 2;
    }).length;
    const rate = sd.length / sn.rows.length;
    measure('P-83', `${pct(rate)} (${sd.length}) · ${nonPro} hors PRO · ${badCat} hors catégories 1-2`);
    expect(nonPro).toBe(0);
    expect(badCat).toBe(0);
    expect(rate).toBeGreaterThanOrEqual(0.025);
    expect(rate).toBeLessThanOrEqual(0.055);
  });
});

describe('P-45 — contrôle externe M3 (κ d’EX-DATA-96)', () => {
  it('R-DATA-08 — P-45 : κ entre evaluation.category ∈ {1,2} et le verdict M1_LOW dans [0,25 ; 0,60]', async () => {
    // La mesure passe par l'ADAPTATEUR et le MOTEUR de production : c'est le κ que l'application
    // affichera. Le κ maximal atteignable pour les deux taux de base observés est publié avec la
    // mesure — sans lui, on ne peut pas dire si la sonde échoue sur la donnée ou sur l'arithmétique.
    const sid = snapshotIds()[0] as string;
    const sn = loadSnapshot(sid);
    expect(sn.snapshotId).toBe(sid);
    const { batch } = await openCanonicalBatch(sid);
    const { detectOutliers } = await import('../../src/engine/outliers');
    const { decodeListingId } = await import('../../src/engine/uuid');
    const rows = Int32Array.from({ length: batch.rowCount }, (_v, i) => i);
    const res = detectOutliers(batch, rows, batch.snapshotId, 'FULL:EMPTY');

    const catByListing = new Map<string, number>();
    for (let i = 0; i < batch.rowCount; i += 1) {
      catByListing.set(decodeListingId(batch.listingId, i), batch.priceEvaluationCategory[i] as number);
    }
    const a: boolean[] = [];
    const b: boolean[] = [];
    for (const v of res.verdicts) {
      if (v.method !== 'M1' || v.cellCount < 30) continue;
      const c = catByListing.get(v.listingId);
      if (c === undefined || c === 0) continue; // 0 = « Inconnu » du vocabulaire à 6 niveaux
      a.push(c === 1 || c === 2);
      b.push(v.flags.includes('M1_LOW'));
    }
    const kappa = cohenKappa(a, b);
    const pa = a.filter(Boolean).length / a.length;
    const pb = b.filter(Boolean).length / b.length;
    const pe = pa * pb + (1 - pa) * (1 - pb);
    const kappaMax = (1 - Math.abs(pa - pb) - pe) / (1 - pe);
    measure(
      'P-45',
      `κ = ${kappa.toFixed(4)} sur n=${a.length} (cellules n_price ≥ 30) ; P(cat ∈ {1,2}) = ${pct(pa)}, ` +
        `P(M1_LOW) = ${pct(pb)} ⇒ κ maximal atteignable ${kappaMax.toFixed(4)}`,
    );
    expect(a.length).toBeGreaterThan(100);
    expect(kappa).toBeGreaterThanOrEqual(0.25);
    expect(kappa).toBeLessThanOrEqual(0.6);
  }, 300_000);
});

describe('Cohérences croisées de prix (au-delà de la spécification)', () => {
  it('R-DATA-09 — TVA déductible ⇒ vendeur professionnel, sur les 3 snapshots', () => {
    let bad = 0;
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        if (r.prices?.public?.isTaxDeductible === true && r.seller?.type !== 'D') bad += 1;
      }
    }
    measure('CROISE-tva', `${bad} annonce(s) à TVA déductible hors PRO (profil ${PROFILE})`);
    expect(bad).toBe(0);
  });

  it('R-DATA-10 — une garantie n’est annoncée que chez un professionnel, et warranty = 0 n’est jamais « garanti »', () => {
    let badSeller = 0;
    let badZero = 0;
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        if ((r.warranty !== undefined || r.hasWarranty !== undefined) && r.seller?.type !== 'D') badSeller += 1;
        if (r.warranty === 0 && r.hasWarranty === true) badZero += 1;
      }
    }
    measure('CROISE-garantie', `${badSeller} garantie(s) hors PRO · ${badZero} warranty = 0 avec hasWarranty = true`);
    expect(badSeller).toBe(0);
    expect(badZero).toBe(0);
  });
});
