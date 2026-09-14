/**
 * KYCAR — sondes `P-13` … `P-15`, `P-28` … `P-30`, `P-84`, `P-85`, `P-100` : âge, kilométrage, état.
 * =================================================================================================
 * Agent `data-review` (phase 3.3).
 */
import { describe, expect, it } from 'vitest';

import {
  ageMonths,
  ageYears,
  declaredIds,
  fuelFamily,
  loadProfile,
  measure,
  median,
  pct,
  s0,
} from './harness';

describe('P-13 … P-15 — loi d’âge', () => {
  it('P-13 — médiane de l’âge dans [6, 9]', () => {
    for (const snap of loadProfile()) {
      const ages = snap.rows.map((r) => ageYears(r, snap)).filter((a): a is number => a !== undefined);
      const m = median(ages);
      if (snap === s0()) measure('P-13', `médiane ${m} ans sur ${ages.length} annonces datées`);
      expect(m, snap.snapshotId).toBeGreaterThanOrEqual(6);
      expect(m, snap.snapshotId).toBeLessThanOrEqual(9);
    }
  });

  it('P-14 — part des annonces d’âge ≥ 20 ans dans [0,025 ; 0,055]', () => {
    const snap = s0();
    const ages = snap.rows.map((r) => ageYears(r, snap)).filter((a): a is number => a !== undefined);
    const share = ages.filter((a) => a >= 20).length / ages.length;
    measure('P-14', `${pct(share)} d’annonces de 20 ans et plus`);
    expect(share).toBeGreaterThanOrEqual(0.025);
    expect(share).toBeLessThanOrEqual(0.055);
  });

  it('P-15 — part des annonces d’âge ≥ 30 ans dans [0,002 ; 0,012]', () => {
    const snap = s0();
    const ages = snap.rows.map((r) => ageYears(r, snap)).filter((a): a is number => a !== undefined);
    const share = ages.filter((a) => a >= 30).length / ages.length;
    measure('P-15', `${pct(share)} d’annonces de 30 ans et plus`);
    expect(share).toBeGreaterThanOrEqual(0.002);
    expect(share).toBeLessThanOrEqual(0.012);
  });
});

describe('P-28 … P-30 — kilométrage', () => {
  it('P-28 — médiane du kilométrage des annonces d’âge 5 ans dans [66 000, 84 000]', () => {
    const snap = s0();
    const excluded = declaredIds(
      snap,
      'SUSPECT_ZERO_MILEAGE',
      'MILEAGE_OUT_OF_RANGE',
      'MILEAGE_IMPLAUSIBLE_FOR_AGE',
      'UNIT_UNSUPPORTED',
    );
    const km: number[] = [];
    for (const r of snap.rows) {
      if (excluded.has(r.id)) continue;
      if (ageYears(r, snap) !== 5) continue;
      if (r.mileage === undefined) continue;
      km.push(r.mileage);
    }
    const m = median(km);
    measure('P-28', `médiane ${m} km sur ${km.length} annonces d’âge 5 ans (anomalies de km exclues)`);
    expect(m).toBeGreaterThanOrEqual(66_000);
    expect(m).toBeLessThanOrEqual(84_000);
  });

  it('P-29 — rapport des médianes de kilométrage diesel / essence à 5 ans dans [1,30 ; 1,70]', () => {
    const snap = s0();
    const excluded = declaredIds(
      snap,
      'SUSPECT_ZERO_MILEAGE',
      'MILEAGE_OUT_OF_RANGE',
      'MILEAGE_IMPLAUSIBLE_FOR_AGE',
      'UNIT_UNSUPPORTED',
    );
    const d: number[] = [];
    const b: number[] = [];
    for (const r of snap.rows) {
      if (excluded.has(r.id) || r.mileage === undefined || ageYears(r, snap) !== 5) continue;
      const f = fuelFamily(r);
      if (f === 'D') d.push(r.mileage);
      else if (f === 'B') b.push(r.mileage);
    }
    const ratio = median(d) / median(b);
    measure('P-29', `diesel ${median(d)} km (n=${d.length}) / essence ${median(b)} km (n=${b.length}) = ${ratio.toFixed(3)}`);
    expect(ratio).toBeGreaterThanOrEqual(1.3);
    expect(ratio).toBeLessThanOrEqual(1.7);
  });

  it('P-30 — 100 % des kilométrages connus sont des multiples de 100', () => {
    let bad = 0;
    let sample = '';
    let known = 0;
    for (const snap of loadProfile()) {
      for (const r of snap.rows) {
        if (r.mileage === undefined) continue;
        known += 1;
        if (r.mileage % 100 !== 0) {
          bad += 1;
          if (sample === '') sample = `${r.id} mileage ${r.mileage}`;
        }
      }
    }
    measure('P-30', `${bad} valeur(s) non multiple de 100 sur ${known} connues ${sample}`);
    expect(bad).toBe(0);
  });
});

describe('P-84, P-85, P-100 — état du véhicule et plausibilité du kilométrage', () => {
  it('P-84 — mileage = 0 ⇒ offerType ∈ {N, S, D} hors A-03 ; accidentés dans [0,02 ; 0,05]', () => {
    const snap = s0();
    const declaredZero = declaredIds(snap, 'SUSPECT_ZERO_MILEAGE');
    let violations = 0;
    let sample = '';
    let zero = 0;
    for (const r of snap.rows) {
      if (r.mileage !== 0) continue;
      zero += 1;
      if (declaredZero.has(r.id)) continue;
      if (r.offerType === undefined || !['N', 'S', 'D'].includes(r.offerType)) {
        violations += 1;
        if (sample === '') sample = `${r.id} offerType ${String(r.offerType)}`;
      }
    }
    const accidented = snap.rows.filter((r) => r.usageState === 'A').length / snap.rows.length;
    measure(
      'P-84',
      `${zero} annonces à 0 km (${declaredZero.size} déclarées A-03), ${violations} violation(s) ${sample} ; accidentés ${pct(accidented)}`,
    );
    expect(violations).toBe(0);
    expect(accidented).toBeGreaterThanOrEqual(0.02);
    expect(accidented).toBeLessThanOrEqual(0.05);
  });

  it('P-85 — 100 % des offerType = O ont un âge ≥ 30 ans', () => {
    // Une annonce dont la date de 1re immatriculation est ABSENTE (modèle de complétude R-43) n'a
    // pas d'âge : elle ne peut ni confirmer ni contredire la borne. Elle est comptée à part, pas
    // comme une violation — l'inverse ferait passer une absence pour une donnée fausse.
    let bad = 0;
    let total = 0;
    let undated = 0;
    let sample = '';
    for (const snap of loadProfile()) {
      for (const r of snap.rows) {
        if (r.offerType !== 'O') continue;
        total += 1;
        const a = ageYears(r, snap);
        if (a === undefined) {
          undated += 1;
          continue;
        }
        if (a < 30) {
          bad += 1;
          if (sample === '') sample = `${r.id} âge ${a}`;
        }
      }
    }
    measure('P-85', `${total} annonces offerType = O, ${bad} sous 30 ans, ${undated} sans date ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-100 — mileage × 12 / max(âge en mois, 6) ≤ 200 000 hors A-04', () => {
    let bad = 0;
    let sample = '';
    let declared = 0;
    for (const snap of loadProfile()) {
      const excluded = declaredIds(snap, 'MILEAGE_IMPLAUSIBLE_FOR_AGE', 'MILEAGE_OUT_OF_RANGE', 'FIRST_REG_OUT_OF_RANGE');
      declared += excluded.size;
      for (const r of snap.rows) {
        if (excluded.has(r.id) || r.mileage === undefined) continue;
        const months = ageMonths(r, snap);
        if (months === undefined) continue;
        const rate = (r.mileage * 12) / Math.max(months, 6);
        if (rate > 200_000) {
          bad += 1;
          if (sample === '') sample = `${r.id} ${Math.round(rate)} km/an (${r.mileage} km, ${months} mois)`;
        }
      }
    }
    measure('P-100', `${bad} annonce(s) au-dessus de 200 000 km/an hors ${declared} déclarations ${sample}`);
    expect(bad).toBe(0);
  });

  it('R-DATA-04 — les formes (a) d’A-04 franchissent effectivement la borne de la contrainte 22 (EG-09)', () => {
    // `anomalies.json` prescrivait 65 000–95 000 km/an, qui ne franchit JAMAIS la borne de 200 000 :
    // la détection annoncée serait impossible. EG-09 porte le rythme à 260 000–360 000. La sonde
    // vérifie l'effet, pas la formule : 100 % des formes (a) doivent dépasser la borne.
    const snap = s0();
    const formA = snap.manifest.groundTruth.filter(
      (g) => g.anomaly === 'MILEAGE_IMPLAUSIBLE_FOR_AGE' && (g.expected as { form?: string } | undefined)?.form === 'a',
    );
    const byId = new Map(snap.rows.map((r) => [r.id, r]));
    let over = 0;
    for (const g of formA) {
      const r = byId.get(g.listingId);
      if (!r || r.mileage === undefined) continue;
      const months = ageMonths(r, snap);
      if (months === undefined) continue;
      if ((r.mileage * 12) / Math.max(months, 6) > 200_000) over += 1;
    }
    measure('EG-09', `${over}/${formA.length} formes (a) d’A-04 au-dessus de 200 000 km/an`);
    expect(formA.length).toBeGreaterThan(0);
    expect(over).toBe(formA.length);
  });
});
