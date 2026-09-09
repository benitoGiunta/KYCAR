/**
 * KYCAR — sondes `P-60` … `P-64`, `P-95` … `P-99` : CO₂, consommation, branches de mesure, puissance.
 * =================================================================================================
 * Agent `data-review` (phase 3.3).
 */
import { describe, expect, it } from 'vitest';

import {
  type RawListing,
  ageYears,
  declaredIds,
  firstRegMonthIndex,
  loadProfile,
  measure,
  measurementBranch,
  pct,
  s0,
} from './harness';

/** Facteur physique g CO₂ par l/100 km (`emissions.json:co2`). */
const CO2_FACTOR: Record<string, number> = {
  B: 23.92,
  L: 23.92,
  M: 23.92,
  O: 23.92,
  '2': 23.92,
  D: 26.4,
  '3': 26.4,
  C: 18.1,
};

/** Tranches de `euEmissionStandard` par année de 1re immatriculation (`emissions.json`). */
const EURO_BY_YEAR = (year: number): string | undefined => {
  if (year <= 1996) return '1';
  if (year <= 2000) return '2';
  if (year <= 2005) return '3';
  if (year <= 2010) return '4';
  if (year <= 2014) return '5';
  if (year <= 2017) return '6';
  if (year === 2018) return '7';
  if (year <= 2020) return '9';
  if (year <= 2023) return '8';
  if (year <= 2026) return '10';
  return undefined;
};

/** Seuil WLTP de septembre 2018, en index de mois (`R-38`). */
const WLTP_THRESHOLD = 2018 * 12 + 8; // 2018-09

describe('P-60 … P-64 — cohérence CO₂ / consommation et branches de mesure', () => {
  it('P-60 — |CO₂ − conso × k| ≤ 6 g/km sur 100 % des thermiques renseignées, hors A-14', () => {
    let checked = 0;
    let bad = 0;
    let worst = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'CO2_ZERO_NON_BEV');
      for (const r of sn.rows) {
        if (declared.has(r.id)) continue;
        const k = r.fuelCategory === undefined ? undefined : CO2_FACTOR[r.fuelCategory];
        if (k === undefined) continue;
        const branch = measurementBranch(r);
        const co2 = branch === 'WLTP' ? r.wltp?.co2EmissionsCombined : r.co2Emissions;
        const cons = branch === 'WLTP' ? r.wltp?.consumptionCombined : r.consumption?.combined;
        if (co2 === undefined || cons === undefined) continue;
        checked += 1;
        const gap = Math.abs(co2 - cons * k);
        if (gap > worst) worst = gap;
        if (gap > 6) {
          bad += 1;
          if (sample === '') sample = `${r.id} CO₂ ${co2} vs ${(cons * k).toFixed(1)} (${r.fuelCategory})`;
        }
      }
    }
    measure('P-60', `${bad} écart(s) > 6 g/km sur ${checked} annonces contrôlées, écart maximal ${worst.toFixed(2)} g/km ${sample}`);
    expect(checked).toBeGreaterThan(100);
    expect(bad).toBe(0);
  });

  it('P-61 — la branche de mesure suit firstRegistrationDate (seuil 2018-09), 0 exception hors A-05', () => {
    let badWltp = 0;
    let badNedc = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'FIRST_REG_OUT_OF_RANGE');
      for (const r of sn.rows) {
        if (declared.has(r.id)) continue;
        const m = firstRegMonthIndex(r);
        if (m === undefined) continue;
        const branch = measurementBranch(r);
        if (branch === 'NONE') continue;
        if (m >= WLTP_THRESHOLD && branch !== 'WLTP') {
          badWltp += 1;
          if (sample === '') sample = `${r.id} ${String(r.firstRegistrationDate)} en branche ${branch}`;
        }
        if (m < WLTP_THRESHOLD && branch !== 'NEDC') {
          badNedc += 1;
          if (sample === '') sample = `${r.id} ${String(r.firstRegistrationDate)} en branche ${branch}`;
        }
      }
    }
    measure('P-61', `${badWltp} annonce(s) ≥ 2018-09 hors WLTP · ${badNedc} annonce(s) < 2018-09 hors NEDC ${sample}`);
    expect(badWltp).toBe(0);
    expect(badNedc).toBe(0);
  });

  it('P-62 — part sans branche de mesure dans [0,10 ; 0,20] globalement et > 0,30 au-delà de 17 ans', () => {
    const sn = s0();
    const none = sn.rows.filter((r) => measurementBranch(r) === 'NONE');
    const share = none.length / sn.rows.length;
    const old = sn.rows.filter((r) => {
      const a = ageYears(r, sn);
      return a !== undefined && a > 17;
    });
    const oldShare = old.filter((r) => measurementBranch(r) === 'NONE').length / old.length;
    measure('P-62', `${pct(share)} globalement · ${pct(oldShare)} au-delà de 17 ans (n=${old.length})`);
    expect(share).toBeGreaterThanOrEqual(0.1);
    expect(share).toBeLessThanOrEqual(0.2);
    expect(oldShare).toBeGreaterThan(0.3);
  });

  it('P-63 — 100 % des normes Euro correspondent à la tranche d’année d’emissions.json', () => {
    let bad = 0;
    let checked = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'FIRST_REG_OUT_OF_RANGE');
      for (const r of sn.rows) {
        if (r.euEmissionStandard === undefined || declared.has(r.id)) continue;
        const y = r.firstRegistrationDate === undefined ? undefined : Number(r.firstRegistrationDate.slice(0, 4));
        if (y === undefined || !Number.isFinite(y)) continue;
        checked += 1;
        if (r.euEmissionStandard !== EURO_BY_YEAR(y)) {
          bad += 1;
          if (sample === '') sample = `${r.id} ${y} → ${r.euEmissionStandard} (attendu ${String(EURO_BY_YEAR(y))})`;
        }
      }
    }
    measure('P-63', `${bad} écart(s) sur ${checked} normes renseignées ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-64 — CO₂ = 0 pour 100 % des électriques, JAMAIS porté par wltp.co2EmissionsCombined', () => {
    let nonZero = 0;
    let inWltpBlock = 0;
    let carried = 0;
    let total = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'CO2_ZERO_NON_BEV');
      for (const r of sn.rows) {
        if (r.fuelCategory !== 'E' || declared.has(r.id)) continue;
        total += 1;
        if (r.wltp?.co2EmissionsCombined !== undefined) {
          inWltpBlock += 1;
          if (sample === '') sample = `${r.id} wltp.co2EmissionsCombined = ${r.wltp.co2EmissionsCombined}`;
        }
        const nedc = r.co2Emissions;
        const fb = r.co2EmissionInGramPerKmWithFallback;
        if (nedc !== undefined || fb !== undefined) {
          carried += 1;
          if ((nedc !== undefined && nedc !== 0) || (fb !== undefined && fb !== 0)) {
            nonZero += 1;
            if (sample === '') sample = `${r.id} CO₂ ${String(nedc)} / repli ${String(fb)}`;
          }
        }
      }
    }
    measure(
      'P-64',
      `${total} électriques · ${carried} portent un CO₂ (NEDC ou repli) · ${nonZero} valeur(s) non nulle(s) · ${inWltpBlock} dans wltp.co2EmissionsCombined ${sample}`,
    );
    expect(nonZero).toBe(0);
    expect(inWltpBlock).toBe(0);
  });
});

describe('P-95 … P-99 — puissance, exclusivité des branches, champs de repli', () => {
  it('P-95 — |powerHp − round(power / 0,7355)| / powerHp ≤ 2 % hors A-13b', () => {
    let bad = 0;
    let checked = 0;
    let declaredCount = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'POWER_UNIT_MISMATCH', 'POWER_OUT_OF_RANGE');
      for (const r of sn.rows) {
        if (r.power === undefined || r.powerHp === undefined) continue;
        if (declared.has(r.id)) {
          declaredCount += 1;
          continue;
        }
        checked += 1;
        const expectedHp = Math.round(r.power / 0.7355);
        if (Math.abs(r.powerHp - expectedHp) / r.powerHp > 0.02) {
          bad += 1;
          if (sample === '') sample = `${r.id} ${r.power} kW → ${r.powerHp} ch (attendu ${expectedHp})`;
        }
      }
    }
    measure('P-95', `${bad} écart(s) > 2 % sur ${checked} annonces (${declaredCount} déclarées A-13/A-13b) ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-96 — aucune ligne ne porte à la fois wltp et co2Emissions / consumption.* / efficiencyClass', () => {
    let bad = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        if (r.wltp === undefined) continue;
        if (r.co2Emissions !== undefined || r.consumption !== undefined || r.efficiencyClass !== undefined) {
          bad += 1;
          if (sample === '') sample = r.id;
        }
      }
    }
    measure('P-96', `${bad} ligne(s) mélangeant les deux branches ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-97 — les champs …WithFallback portent exactement la valeur de la priorité wltp > NEDC > repli', () => {
    let badCo2 = 0;
    let badCons = 0;
    let missingCo2 = 0;
    let missingCons = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'CO2_ZERO_NON_BEV');
      for (const r of sn.rows as readonly RawListing[]) {
        const co2Source = r.wltp?.co2EmissionsCombined ?? r.co2Emissions;
        const consSource = r.wltp?.consumptionCombined ?? r.consumption?.combined;
        if (co2Source !== undefined) {
          if (r.co2EmissionInGramPerKmWithFallback === undefined) {
            missingCo2 += 1;
            if (sample === '') sample = `${r.id} CO₂ ${co2Source} sans repli`;
          } else if (!declared.has(r.id) && r.co2EmissionInGramPerKmWithFallback !== co2Source) {
            badCo2 += 1;
            if (sample === '') sample = `${r.id} repli ${r.co2EmissionInGramPerKmWithFallback} vs source ${co2Source}`;
          }
        }
        if (consSource !== undefined) {
          if (r.consumptionCombinedWithFallback === undefined) {
            missingCons += 1;
            if (sample === '') sample = `${r.id} conso ${consSource} sans repli`;
          } else if (r.consumptionCombinedWithFallback !== consSource) {
            badCons += 1;
            if (sample === '') sample = `${r.id} repli conso ${r.consumptionCombinedWithFallback} vs ${consSource}`;
          }
        }
      }
    }
    measure(
      'P-97',
      `CO₂ : ${badCo2} valeur(s) divergente(s), ${missingCo2} repli(s) manquant(s) · conso : ${badCons} divergente(s), ${missingCons} manquant(s) ${sample}`,
    );
    expect(badCo2).toBe(0);
    expect(badCons).toBe(0);
    expect(missingCo2).toBe(0);
    expect(missingCons).toBe(0);
  });

  it('P-98 — 100 % des isPluginHybrid = true ont fuelCategory ∈ {2, 3, O} hors A-15', () => {
    let bad = 0;
    let declaredCount = 0;
    let unknownFuel = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'HYBRID_INCONSISTENT');
      for (const r of sn.rows) {
        if (r.isPluginHybrid !== true) continue;
        // `fuelCategory` ABSENTE : l'annonce n'est pas « hors {2,3,O} », elle est indéterminée —
        // c'est la branche A-16 (`HYBRID_CATEGORY_UNRESOLVED`) et le taux d'absence propre du champ.
        if (r.fuelCategory === undefined) {
          unknownFuel += 1;
          continue;
        }
        const ok = r.fuelCategory === '2' || r.fuelCategory === '3' || r.fuelCategory === 'O';
        if (ok) continue;
        if (declared.has(r.id)) {
          declaredCount += 1;
          continue;
        }
        bad += 1;
        if (sample === '') sample = `${r.id} fuelCategory ${String(r.fuelCategory)}`;
      }
    }
    measure(
      'P-98',
      `${bad} incohérence(s) non déclarée(s), ${declaredCount} déclarée(s) A-15, ${unknownFuel} à carburant absent ${sample}`,
    );
    expect(bad).toBe(0);
  });

  it('P-99 — wltp.co2Class seulement en branche WLTP, efficiencyClass seulement en branche NEDC', () => {
    let badClass = 0;
    let badEff = 0;
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        const branch = measurementBranch(r);
        if (r.wltp?.co2Class !== undefined && branch !== 'WLTP') badClass += 1;
        if (r.efficiencyClass !== undefined && branch !== 'NEDC') badEff += 1;
      }
    }
    measure('P-99', `${badClass} co2Class hors WLTP · ${badEff} efficiencyClass hors NEDC`);
    expect(badClass).toBe(0);
    expect(badEff).toBe(0);
  });

  it('R-DATA-13 — cohérence croisée : CO₂ / énergie / puissance / année (au-delà de la spécification)', () => {
    // Une valeur affichée à l'utilisateur : un thermique de forte puissance ne peut pas émettre
    // moins qu'un petit moteur, et un CO₂ nul sur un thermique est une anomalie DÉCLARÉE.
    const sn = s0();
    let zeroOnThermal = 0;
    let declaredZero = 0;
    const declared = declaredIds(sn, 'CO2_ZERO_NON_BEV');
    const byPowerTier: Record<string, number[]> = { '<75': [], '75-110': [], '110-150': [], '>150': [] };
    for (const r of sn.rows) {
      const branch = measurementBranch(r);
      const co2 = branch === 'WLTP' ? r.wltp?.co2EmissionsCombined : r.co2Emissions;
      const fb = r.co2EmissionInGramPerKmWithFallback;
      const value = co2 ?? fb;
      if (value === undefined) continue;
      const thermal = r.fuelCategory !== undefined && CO2_FACTOR[r.fuelCategory] !== undefined;
      if (thermal && value === 0) {
        if (declared.has(r.id)) declaredZero += 1;
        else zeroOnThermal += 1;
      }
      if (!thermal || r.power === undefined || value === 0) continue;
      const tier = r.power < 75 ? '<75' : r.power < 110 ? '75-110' : r.power < 150 ? '110-150' : '>150';
      (byPowerTier[tier] as number[]).push(value);
    }
    const medians = Object.entries(byPowerTier).map(([k, v]) => {
      const s = [...v].sort((a, b) => a - b);
      return [k, s.length === 0 ? Number.NaN : (s[Math.floor(s.length / 2)] as number)] as const;
    });
    measure(
      'CROISE-co2',
      `CO₂ médian par palier de puissance : ${medians.map(([k, m]) => `${k} → ${m}`).join(' · ')} ; ` +
        `${zeroOnThermal} CO₂ nul non déclaré sur thermique (${declaredZero} déclarés A-14)`,
    );
    expect(zeroOnThermal).toBe(0);
    for (let i = 1; i < medians.length; i += 1) {
      expect(medians[i]?.[1], `paliers ${medians[i - 1]?.[0]} → ${medians[i]?.[0]}`).toBeGreaterThan(
        medians[i - 1]?.[1] as number,
      );
    }
  });
});
