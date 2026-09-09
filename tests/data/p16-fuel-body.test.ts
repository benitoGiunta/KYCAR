/**
 * KYCAR — sondes `P-16` … `P-27` : carburant, segments et carrosseries, boîte, couleurs.
 * =================================================================================================
 * Agent `data-review` (phase 3.3). Le SEGMENT n'est écrit nulle part (E-02) : les sondes par segment
 * le reconstituent depuis `models.json` pour les modèles curatés (D3-14) et le disent.
 */
import { describe, expect, it } from 'vitest';

import {
  IS_TEST_PROFILE,
  ageYears,
  decreasingViolations,
  firstRegYear,
  fuelFamily,
  increasingViolations,
  loadProfile,
  measure,
  pct,
  s0,
  segmentOf,
} from './harness';

const YEARS_MONOTONE = Array.from({ length: 11 }, (_, i) => 2016 + i); // 2016..2026

/**
 * Sonde dont la tolérance n'est pas atteignable au VOLUME `dev` (bruit d'échantillonnage, écart
 * EG-12) : elle est déclarée en échec attendu sur ce profil et pleinement exigée sur `test`, le
 * profil que l'application charge (D3-01). L'assertion n'est jamais adoucie.
 */
const devSamplingNoise = IS_TEST_PROFILE ? it : it.fails;

describe('P-16 … P-22 — mix de carburant', () => {
  it('P-16 — mix global B / D / hybrides / E', () => {
    const snap = s0();
    const n = snap.rows.length;
    const c = { B: 0, D: 0, HYB: 0, E: 0, X: 0, ABS: 0 };
    for (const r of snap.rows) {
      const f = fuelFamily(r);
      if (f === undefined) c.ABS += 1;
      else c[f] += 1;
    }
    const b = c.B / n;
    const d = c.D / n;
    const h = c.HYB / n;
    const e = c.E / n;
    measure('P-16', `B ${pct(b)} · D ${pct(d)} · hybrides ${pct(h)} · E ${pct(e)} · autres ${pct(c.X / n)} · absent ${c.ABS}`);
    expect(b).toBeGreaterThanOrEqual(0.52);
    expect(b).toBeLessThanOrEqual(0.59);
    expect(d).toBeGreaterThanOrEqual(0.23);
    expect(d).toBeLessThanOrEqual(0.29);
    expect(h).toBeGreaterThanOrEqual(0.11);
    expect(h).toBeLessThanOrEqual(0.16);
    expect(e).toBeGreaterThanOrEqual(0.035);
    expect(e).toBeLessThanOrEqual(0.058);
  });

  const shareByYear = (year: number, family: 'B' | 'D' | 'HYB' | 'E'): { share: number; n: number } => {
    const snap = s0();
    let n = 0;
    let hit = 0;
    for (const r of snap.rows) {
      if (firstRegYear(r) !== year) continue;
      const f = fuelFamily(r);
      if (f === undefined) continue;
      n += 1;
      if (f === family) hit += 1;
    }
    return { share: n === 0 ? Number.NaN : hit / n, n };
  };

  it('P-17 — part diesel des 1res immatriculations 2015 dans [0,40 ; 0,50] (écart E-01, D3-13)', () => {
    const { share, n } = shareByYear(2015, 'D');
    measure('P-17', `${pct(share)} de diesel parmi ${n} annonces de 2015`);
    expect(share).toBeGreaterThanOrEqual(0.4);
    expect(share).toBeLessThanOrEqual(0.5);
  });

  devSamplingNoise('P-18 — part diesel 2012 ∈ [0,55 ; 0,65] et 2024 ∈ [0,015 ; 0,045] (dev : EG-12)', () => {
    const a = shareByYear(2012, 'D');
    const b = shareByYear(2024, 'D');
    measure('P-18', `2012 ${pct(a.share)} (n=${a.n}) · 2024 ${pct(b.share)} (n=${b.n})`);
    expect(a.share).toBeGreaterThanOrEqual(0.55);
    expect(a.share).toBeLessThanOrEqual(0.65);
    expect(b.share).toBeGreaterThanOrEqual(0.015);
    expect(b.share).toBeLessThanOrEqual(0.045);
  });

  it('P-19 — part électrique des 1res immatriculations 2024 dans [0,19 ; 0,27]', () => {
    const { share, n } = shareByYear(2024, 'E');
    measure('P-19', `${pct(share)} d’électriques parmi ${n} annonces de 2024`);
    expect(share).toBeGreaterThanOrEqual(0.19);
    expect(share).toBeLessThanOrEqual(0.27);
  });

  it('P-20 — part diesel décroissante sur 2016..2026, une inversion tolérée', () => {
    const series = YEARS_MONOTONE.map((y) => shareByYear(y, 'D').share);
    const bad = decreasingViolations(series);
    measure('P-20', `${YEARS_MONOTONE.map((y, i) => `${y}:${((series[i] as number) * 100).toFixed(1)}`).join(' ')} — ${bad} inversion(s)`);
    expect(bad).toBeLessThanOrEqual(1);
  });

  it('P-21 — part diesel utilitaire / citadine ≥ 3 (segments curatés, D3-14)', () => {
    const snap = s0();
    const acc = new Map<string, { n: number; d: number }>();
    for (const r of snap.rows) {
      const seg = segmentOf(r);
      const f = fuelFamily(r);
      if (seg === undefined || f === undefined) continue;
      const a = acc.get(seg) ?? { n: 0, d: 0 };
      a.n += 1;
      if (f === 'D') a.d += 1;
      acc.set(seg, a);
    }
    const u = acc.get('utilitaire') ?? { n: 0, d: 0 };
    const c = acc.get('citadine') ?? { n: 0, d: 0 };
    const ratio = u.d / u.n / (c.d / c.n);
    measure(
      'P-21',
      `utilitaire ${pct(u.d / u.n)} (n=${u.n}) / citadine ${pct(c.d / c.n)} (n=${c.n}) = ${ratio.toFixed(2)}`,
    );
    expect(u.n).toBeGreaterThan(0);
    expect(c.n).toBeGreaterThan(0);
    expect(ratio).toBeGreaterThanOrEqual(3);
  });

  it('P-22 — part isPluginHybrid parmi fuelCategory = 2, années 2023-2026, dans [0,50 ; 0,70]', () => {
    const snap = s0();
    let n = 0;
    let plug = 0;
    for (const r of snap.rows) {
      if (r.fuelCategory !== '2') continue;
      const y = firstRegYear(r);
      if (y === undefined || y < 2023 || y > 2026) continue;
      if (r.isPluginHybrid === undefined) continue;
      n += 1;
      if (r.isPluginHybrid) plug += 1;
    }
    const share = plug / n;
    measure('P-22', `${pct(share)} de rechargeables sur ${n} annonces de catégorie 2 (2023-2026, champ renseigné)`);
    expect(share).toBeGreaterThanOrEqual(0.5);
    expect(share).toBeLessThanOrEqual(0.7);
  });
});

describe('P-23 … P-27 — carrosserie, boîte, couleurs', () => {
  devSamplingNoise('P-23 — part de la carrosserie SUV (code 4) parmi les ≥ 2022, dans [0,38 ; 0,52] (dev : EG-12)', () => {
    const snap = s0();
    let n = 0;
    let suv = 0;
    for (const r of snap.rows) {
      const y = firstRegYear(r);
      if (y === undefined || y < 2022) continue;
      if (r.bodyType === undefined) continue;
      n += 1;
      if (r.bodyType === 4) suv += 1;
    }
    const share = suv / n;
    measure('P-23', `${pct(share)} de SUV sur ${n} annonces de 2022 et après`);
    expect(share).toBeGreaterThanOrEqual(0.38);
    expect(share).toBeLessThanOrEqual(0.52);
  });

  it('P-24 — part de la carrosserie Coupé (code 3) dans [0,020 ; 0,035]', () => {
    const snap = s0();
    const known = snap.rows.filter((r) => r.bodyType !== undefined);
    const share = known.filter((r) => r.bodyType === 3).length / known.length;
    measure('P-24', `${pct(share)} de coupés sur ${known.length} annonces à carrosserie connue`);
    expect(share).toBeGreaterThanOrEqual(0.02);
    expect(share).toBeLessThanOrEqual(0.035);
  });

  it('R-DATA-07 — P-25 : boîtes A ou S, 2010 ≤ 30 %, 2024 ≥ 60 %, croissance monotone (1 inversion)', () => {
    const snap = s0();
    const shareAuto = (year: number): { share: number; n: number } => {
      let n = 0;
      let auto = 0;
      for (const r of snap.rows) {
        if (firstRegYear(r) !== year || r.transmission === undefined) continue;
        n += 1;
        if (r.transmission === 'A' || r.transmission === 'S') auto += 1;
      }
      return { share: n === 0 ? Number.NaN : auto / n, n };
    };
    const years = Array.from({ length: 17 }, (_, i) => 2010 + i);
    const series = years.map((y) => shareAuto(y).share);
    const bad = increasingViolations(series);
    const y2010 = shareAuto(2010);
    const y2024 = shareAuto(2024);
    measure(
      'P-25',
      `2010 ${pct(y2010.share)} (n=${y2010.n}) · 2024 ${pct(y2024.share)} (n=${y2024.n}) · ${bad} inversion(s) sur 2010..2026`,
    );
    expect(y2010.share).toBeLessThanOrEqual(0.3);
    expect(y2024.share).toBeGreaterThanOrEqual(0.6);
    expect(bad).toBeLessThanOrEqual(1);
  });

  it('P-26 — aucune annonce électrique à boîte manuelle', () => {
    let bad = 0;
    let sample = '';
    for (const snap of loadProfile()) {
      for (const r of snap.rows) {
        if (r.fuelCategory !== 'E') continue;
        if (r.transmission === 'M') {
          bad += 1;
          if (sample === '') sample = r.id;
        }
      }
    }
    measure('P-26', `${bad} électrique(s) à boîte manuelle ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-27 — part cumulée noir + gris + blanc + argent dans [0,68 ; 0,78]', () => {
    const snap = s0();
    const known = snap.rows.filter((r) => r.bodyColor !== undefined);
    const dark = new Set([11, 6, 14, 12]); // Noir, Gris, Blanc, Argent (references/BodyColor.json)
    const share = known.filter((r) => dark.has(r.bodyColor as number)).length / known.length;
    measure('P-27', `${pct(share)} sur ${known.length} annonces à couleur connue`);
    expect(share).toBeGreaterThanOrEqual(0.68);
    expect(share).toBeLessThanOrEqual(0.78);
  });

  it('R-DATA-05 — la carrosserie reste cohérente avec le segment curaté (table segments.json)', () => {
    // Contrôle croisé hors spec : `bodyTypeMapping` associe à chaque segment un ensemble FERMÉ de
    // carrosseries, plus 1 % de code 7 (« Autres »). Un écart au-delà de ce taux dirait que le
    // segment latent et la carrosserie écrite ne décrivent pas le même véhicule.
    const allowed: Record<string, number[]> = {
      citadine: [1],
      compacte: [1, 6],
      berline: [6],
      break: [5],
      suv: [4],
      monospace: [12],
      utilitaire: [13],
      sportive: [2, 3],
      luxe: [3, 4, 6],
    };
    const snap = s0();
    let n = 0;
    let other7 = 0;
    let bad = 0;
    let sample = '';
    for (const r of snap.rows) {
      const seg = segmentOf(r);
      if (seg === undefined || r.bodyType === undefined) continue;
      n += 1;
      if (r.bodyType === 7) {
        other7 += 1;
        continue;
      }
      if (!(allowed[seg] ?? []).includes(r.bodyType)) {
        bad += 1;
        if (sample === '') sample = `${r.id} segment ${seg} bodyType ${r.bodyType}`;
      }
    }
    measure('CROISE-carrosserie', `${bad} incohérence(s) sur ${n} annonces curatées, ${pct(other7 / n)} de code 7 ${sample}`);
    expect(bad).toBe(0);
    expect(other7 / n).toBeLessThanOrEqual(0.02);
  });

  it('R-DATA-06 — âge, énergie et cylindrée : un électrique n’a jamais de cylindrée', () => {
    let bad = 0;
    let sample = '';
    let electrics = 0;
    for (const snap of loadProfile()) {
      for (const r of snap.rows) {
        if (r.fuelCategory !== 'E') continue;
        electrics += 1;
        if (r.cylinderCapacity !== undefined || r.cylinderCount !== undefined) {
          bad += 1;
          if (sample === '') sample = `${r.id} ${String(r.cylinderCapacity)} ccm / ${String(r.cylinderCount)} cyl`;
        }
        void ageYears(r, snap);
      }
    }
    measure('CROISE-cylindree', `${bad} électrique(s) porteurs d’une cylindrée sur ${electrics} ${sample}`);
    expect(bad).toBe(0);
  });
});
