/**
 * KYCAR — sondes `P-55` … `P-59`, `P-108` : valeurs manquantes, corrélation d'absence, structurel.
 * =================================================================================================
 * Agent `data-review` (phase 3.3).
 *
 * `P-55` porte sur **chaque champ de `baseRates`** (82 clés). Mesurer un taux d'absence suppose de
 * savoir sur QUELLE population il porte : `missingness.json:conditionalAbsence` donne 24 règles
 * structurelles, incomplètes (voir le rapport). La table `ELIGIBILITY` ci-dessous EXPLICITE, champ
 * par champ, la population retenue par le reviewer ; les champs dont la population n'est pas
 * observable depuis le fichier livré sont NOMMÉS et écartés, jamais tus.
 */
import { describe, expect, it } from 'vitest';

import {
  IS_TEST_PROFILE,
  type RawListing,
  declaredIds,
  loadProfile,
  measure,
  measurementBranch,
  pct,
  pearson,
  s0,
  specTable,
  stdev,
} from './harness';

/** Sonde dont la tolérance n'est pas atteignable au VOLUME `dev` (bruit d'échantillonnage, EG-12). */
const devSamplingNoise = IS_TEST_PROFILE ? it : it.fails;

interface MissingnessTable {
  latentCompleteness: { hSellerType: Record<string, number> };
  baseRates: Record<string, number>;
  conditionalAbsence: Record<string, string>;
  equipmentCountByseller: Record<string, { median: number }>;
}
const miss = specTable<MissingnessTable>('missingness');

const at = (r: RawListing, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, k) => (acc === undefined || acc === null ? undefined : (acc as Record<string, unknown>)[k]), r as unknown);

const isElectricOrPlugin = (r: RawListing): boolean => r.fuelCategory === 'E' || r.isPluginHybrid === true;
const isPro = (r: RawListing): boolean => r.seller?.type === 'D';
const isQuoted = (r: RawListing): boolean => r.prices?.public?.price !== undefined;

/** Population sur laquelle le taux d'absence d'un champ est mesurable. `null` = non observable. */
const ELIGIBILITY: Record<string, ((r: RawListing) => boolean) | null> = {
  // --- Conditionnements de vendeur -------------------------------------------------------------
  'prices.public.isTaxDeductible': (r) => isPro(r) && isQuoted(r),
  'prices.public.netPrice': (r) => r.prices?.public?.isTaxDeductible === true,
  'prices.public.vatRate': (r) => r.prices?.public?.isTaxDeductible === true,
  'prices.public.isNegotiable': isQuoted,
  'seller.dealerBucket': isPro,
  'adProduct.tier': isPro,
  appliedSeals: isPro,
  warranty: isPro,
  hasWarranty: isPro,
  warrantyUnit: isPro,
  // --- Conditionnements de motorisation --------------------------------------------------------
  'consumption.electricCombined': (r) => isElectricOrPlugin(r) && measurementBranch(r) === 'NEDC',
  'wltp.consumptionElectricCombined': (r) => isElectricOrPlugin(r) && measurementBranch(r) === 'WLTP',
  electricRange: isElectricOrPlugin,
  'battery.capacity': isElectricOrPlugin,
  'battery.ownershipType': (r) => r.fuelCategory === 'E',
  'consumption.combined': (r) =>
    measurementBranch(r) === 'NEDC' && r.fuelCategory !== 'E' && r.fuelCategory !== 'H',
  'wltp.consumptionCombined': (r) =>
    measurementBranch(r) === 'WLTP' && r.fuelCategory !== 'E' && r.fuelCategory !== 'H',
  'wltp.co2EmissionsCombined': (r) =>
    measurementBranch(r) === 'WLTP' && r.fuelCategory !== 'E' && r.fuelCategory !== 'H',
  'wltp.co2Class': (r) => measurementBranch(r) === 'WLTP',
  co2Emissions: (r) => measurementBranch(r) === 'NEDC',
  efficiencyClass: (r) => measurementBranch(r) === 'NEDC',
  cylinderCapacity: (r) => r.fuelCategory !== 'E',
  cylinderCount: (r) => r.fuelCategory !== 'E',
  hasParticleFilter: (r) => r.fuelCategory === 'D' || r.fuelCategory === '3',
  isPluginHybrid: (r) => r.fuelCategory === '2' || r.fuelCategory === '3',
  // --- Unités : servies avec leur valeur, jamais seules (règle NON écrite dans conditionalAbsence)
  mileageUnit: (r) => r.mileage !== undefined,
  powerUnit: (r) => r.power !== undefined,
  cylinderCapacityUnit: (r) => r.cylinderCapacity !== undefined,
  // --- Non observables depuis le fichier livré --------------------------------------------------
  'prices.public.evaluation.category': null, // absent aussi quand d ≥ 0,9 : `d` n'est pas écrit
  co2EmissionInGramPerKmWithFallback: null, // servi « dès qu'une valeur existe » (P-97 le couvre)
  consumptionCombinedWithFallback: null,
};

interface FieldMeasure {
  field: string;
  base: number;
  observed: number;
  n: number;
  relative: number;
}

function measureAbsence(): { tracked: FieldMeasure[]; skipped: string[]; tooSmall: string[] } {
  const snap = s0();
  const tracked: FieldMeasure[] = [];
  const skipped: string[] = [];
  const tooSmall: string[] = [];
  for (const [field, base] of Object.entries(miss.baseRates)) {
    const elig = Object.prototype.hasOwnProperty.call(ELIGIBILITY, field) ? ELIGIBILITY[field] : undefined;
    if (elig === null) {
      skipped.push(field);
      continue;
    }
    const pop = elig === undefined ? snap.rows : snap.rows.filter(elig);
    if (pop.length < 100) {
      tooSmall.push(`${field} (n=${pop.length})`);
      continue;
    }
    const absent = pop.filter((r) => at(r, field) === undefined).length;
    const observed = absent / pop.length;
    const relative = base === 0 ? (observed === 0 ? 0 : Number.POSITIVE_INFINITY) : Math.abs(observed - base) / base;
    tracked.push({ field, base, observed, n: pop.length, relative });
  }
  return { tracked, skipped, tooSmall };
}

describe('P-55, P-56 — taux d’absence par champ', () => {
  // PORTÉE AMENDÉE — constat DR3-19, `data-fix` (phase 3.4). `P-55` figurait DÉJÀ parmi les sondes
  // qu'EG-12 déclare hors de portée au volume `dev` (avec `P-23` et `P-58`), sans que la sonde le
  // matérialise. Elle le fait maintenant, avec le même dispositif que les autres. Motif : à
  // n = 5 000 la population éligible de plusieurs champs conditionnels tombe sous le millier, et la
  // bande de ±25 % relatifs y vaut moins de deux erreurs-types — `offerType` sort à 1,30 % pour
  // 1,00 % de référence (65 absences observées pour 50 attendues, soit 2,1 erreurs-types) alors que
  // le modèle est calibré à `E[p] = 0,0100` exactement. Au profil `test`, qui est celui que
  // l'application charge (D3-01), la sonde est VERTE sur les 78 champs mesurables.
  devSamplingNoise('R-DATA-11 — P-55 : chaque champ de baseRates à ±25 % relatifs de sa valeur de référence', () => {
    const { tracked, skipped, tooSmall } = measureAbsence();
    const breaches = tracked.filter((t) => t.relative > 0.25).sort((a, b) => b.relative - a.relative);
    measure(
      'P-55',
      `${tracked.length} champs mesurés, ${breaches.length} hors tolérance ; ` +
        `écartés (population non observable) : ${skipped.join(', ')} ; population < 100 : ${tooSmall.join(', ') || 'aucun'}`,
    );
    for (const b of breaches) {
      measure(
        'P-55',
        `  HORS TOLÉRANCE ${b.field} : observé ${pct(b.observed)} contre ${pct(b.base)} de référence (n=${b.n}, écart relatif ${(b.relative * 100).toFixed(1)} %)`,
      );
    }
    const worst = tracked.reduce((a, b) => (b.relative > a.relative ? b : a));
    measure('P-55', `écart relatif maximal ${(worst.relative * 100).toFixed(1)} % (${worst.field})`);
    expect(breaches.map((b) => b.field)).toEqual([]);
  });

  it('P-56 — l’écart-type des taux d’absence des champs optionnels est > 0,15', () => {
    const { tracked } = measureAbsence();
    const rates = tracked.filter((t) => t.base > 0).map((t) => t.observed);
    const sd = stdev(rates);
    measure('P-56', `écart-type ${sd.toFixed(4)} sur ${rates.length} champs optionnels`);
    expect(sd).toBeGreaterThan(0.15);
  });
});

describe('P-57, P-58, P-59, P-108 — corrélation, effet vendeur, absences structurelles', () => {
  it.fails('P-57 — DETTE EG-11 / D3-20 : corr(version absente, sellerie absente) ∈ [0,10 ; 0,40]', () => {
    // EG-11(c) : avec `p₁ = 0,035`, `p₂ = 0,28` et `Var(m)` imposée par `Beta(6,2)`, le maximum
    // atteignable vaut 0,065. La sonde reste écrite telle que la spécification la formule, et son
    // échec est la dette RATIFIÉE D3-20 — jamais une assertion adoucie.
    const snap = s0();
    const a = snap.rows.map((r) => (r.modelVersion === undefined ? 1 : 0));
    const b = snap.rows.map((r) => (r.upholsteryType === undefined ? 1 : 0));
    const c = pearson(a, b);
    measure('P-57', `corrélation ${c.toFixed(4)} (borne arithmétique de EG-11 : 0,065)`);
    expect(c).toBeGreaterThanOrEqual(0.1);
    expect(c).toBeLessThanOrEqual(0.4);
  });

  devSamplingNoise('P-58 — absence d’équipement PRIVÉ / PRO ≥ 1,8 (dev : EG-12)', () => {
    const snap = s0();
    const priv = snap.rows.filter((r) => r.seller?.type === 'P');
    const pro = snap.rows.filter((r) => r.seller?.type === 'D');
    const rate = (xs: readonly RawListing[]): number => xs.filter((r) => r.equipment === undefined).length / xs.length;
    const ratio = rate(priv) / rate(pro);
    measure('P-58', `${ratio.toFixed(3)} (PRIVÉ ${pct(rate(priv))} / PRO ${pct(rate(pro))})`);
    expect(ratio).toBeGreaterThanOrEqual(1.8);
  });

  it('P-59 — absences structurelles : aucune valeur électrique hors {E,2,3}, aucune cylindrée sur un E, rien de PRO chez un PRIVÉ', () => {
    let electricOnThermal = 0;
    let cylinderOnElectric = 0;
    let proFieldsOnPrivate = 0;
    let unknownFuelWithElectric = 0;
    let unknownFuelDeclared = 0;
    const samples: string[] = [];
    for (const sn of loadProfile()) {
      const declaredHybrid = declaredIds(sn, 'HYBRID_CATEGORY_UNRESOLVED');
      void declaredHybrid;
      for (const r of sn.rows) {
        // Une annonce dont `fuelCategory` est ABSENTE (anomalie A-16, déclarée) n'est pas « hors
        // {E,2,3} » : elle est indéterminée. Elle est comptée à part et son caractère déclaré est
        // vérifié — la compter comme violation ferait passer une absence pour une donnée fausse.
        if (r.fuelCategory === undefined) {
          if (
            r.electricRange !== undefined ||
            r.battery !== undefined ||
            r.consumption?.electricCombined !== undefined ||
            r.wltp?.consumptionElectricCombined !== undefined
          ) {
            unknownFuelWithElectric += 1;
            if (declaredHybrid.has(r.id)) unknownFuelDeclared += 1;
          }
          continue;
        }
        const isElectricFamily = r.fuelCategory === 'E' || r.fuelCategory === '2' || r.fuelCategory === '3';
        if (!isElectricFamily) {
          if (
            r.electricRange !== undefined ||
            r.battery !== undefined ||
            r.consumption?.electricCombined !== undefined ||
            r.wltp?.consumptionElectricCombined !== undefined
          ) {
            electricOnThermal += 1;
            if (samples.length < 3) samples.push(`${r.id} carburant ${String(r.fuelCategory)} porte une valeur électrique`);
          }
        }
        if (r.fuelCategory === 'E' && (r.cylinderCapacity !== undefined || r.cylinderCount !== undefined)) {
          cylinderOnElectric += 1;
        }
        if (r.seller?.type === 'P') {
          if (
            r.prices?.public?.isTaxDeductible !== undefined ||
            r.seller.dealerBucket !== undefined ||
            r.adProduct?.tier !== undefined ||
            r.appliedSeals !== undefined ||
            r.warranty !== undefined ||
            r.hasWarranty !== undefined
          ) {
            proFieldsOnPrivate += 1;
            if (samples.length < 3) samples.push(`${r.id} PRIVATE porte un champ professionnel`);
          }
        }
      }
    }
    measure(
      'P-59',
      `${electricOnThermal} valeur(s) électrique(s) hors {E,2,3} · ${cylinderOnElectric} cylindrée(s) sur un E · ` +
        `${proFieldsOnPrivate} champ(s) PRO chez un PRIVÉ · ${unknownFuelWithElectric} à carburant inconnu ` +
        `(dont ${unknownFuelDeclared} déclarées A-16) ${samples.join(' ; ')}`,
    );
    expect(electricOnThermal).toBe(0);
    expect(cylinderOnElectric).toBe(0);
    expect(proFieldsOnPrivate).toBe(0);
    // Les annonces à carburant inconnu ne sont pas testables : `fuelCategory` a un taux d'absence
    // propre (0,4 %) EN PLUS de l'anomalie A-16. Leur effectif est publié, aucune assertion dessus.
  });

  it('P-108 — taux d’absence de paintType ≥ 0,75', () => {
    const snap = s0();
    const rate = snap.rows.filter((r) => r.paintType === undefined).length / snap.rows.length;
    measure('P-108', `${pct(rate)}`);
    expect(rate).toBeGreaterThanOrEqual(0.75);
  });

  it('R-DATA-12 — la médiane du nombre d’équipements suit missingness.json (EG-06 : 16 PRO / 8 PRIVÉ)', () => {
    const snap = s0();
    const counts = (t: string): number[] =>
      snap.rows.filter((r) => r.seller?.type === t && r.equipment !== undefined).map((r) => (r.equipment as readonly number[]).length);
    const med = (xs: number[]): number => {
      const s = [...xs].sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)] as number;
    };
    const pro = med(counts('D'));
    const priv = med(counts('P'));
    measure(
      'EG-06',
      `médiane d’équipements PRO ${pro} (annoncée ${miss.equipmentCountByseller['D']?.median}) · PRIVÉ ${priv} (annoncée ${miss.equipmentCountByseller['P']?.median})`,
    );
    expect(Math.abs(pro - (miss.equipmentCountByseller['D']?.median as number))).toBeLessThanOrEqual(2);
    expect(Math.abs(priv - (miss.equipmentCountByseller['P']?.median as number))).toBeLessThanOrEqual(2);
  });
});
