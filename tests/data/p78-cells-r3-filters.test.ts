/**
 * KYCAR — sondes `P-78` … `P-82`, `P-107` : densité de cellules, R3, alimentation des filtres.
 * =================================================================================================
 * Agent `data-review` (phase 3.3). La garde R3 est étendue à `data/` (D3-12) : balayage du
 * VOCABULAIRE D'INSTANCE (toutes les clés de tous les objets), jamais des mots-clés d'un
 * méta-schéma, et exclusion nominative de `data/schema/examples/invalid-*.json`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PROFILE,
  REPO_ROOT,
  type RawListing,
  chiSquarePValue,
  chiSquareUniform,
  collectKeys,
  collectStrings,
  firstRegYear,
  loadGenerationReport,
  loadProfile,
  measure,

  price,
  s0,
} from './harness';

describe('P-78, P-79 — densité des cellules d’homogénéité', () => {
  it('P-78 — cellules (marque, modèle, année) à n_price ≥ 12', () => {
    const min = PROFILE === 'test' ? 150 : 10;
    const sn = s0();
    const cells = new Map<string, number>();
    for (const r of sn.rows) {
      if (price(r) === undefined || r.model === undefined) continue;
      const y = firstRegYear(r);
      if (y === undefined) continue;
      const k = `${r.make}|${r.model}|${y}`;
      cells.set(k, (cells.get(k) ?? 0) + 1);
    }
    const dense = [...cells.values()].filter((c) => c >= 12).length;
    measure('P-78', `${dense} cellules (marque, modèle, année) à n_price ≥ 12 sur ${cells.size} (plancher ${min})`);
    expect(dense).toBeGreaterThanOrEqual(min);
  });

  it('P-79 — cellules (marque, modèle) à n_price ≥ 30', () => {
    const min = PROFILE === 'test' ? 90 : 20;
    const sn = s0();
    const cells = new Map<string, number>();
    for (const r of sn.rows) {
      if (price(r) === undefined || r.model === undefined) continue;
      const k = `${r.make}|${r.model}`;
      cells.set(k, (cells.get(k) ?? 0) + 1);
    }
    const dense = [...cells.values()].filter((c) => c >= 30).length;
    measure('P-79', `${dense} cellules (marque, modèle) à n_price ≥ 30 sur ${cells.size} (plancher ${min})`);
    expect(dense).toBeGreaterThanOrEqual(min);
  });
});

describe('P-80, P-81, P-107 — R3 sur les fixtures et sur data/', () => {
  it('P-80 — aucune clé d’instance des fixtures ne figure dans EX-DATA-47 E1..E17', async () => {
    const { R3_FORBIDDEN_FIELD_NAMES } = await import('../../src/types/validation');
    const norm = (s: string): string => s.toLowerCase().replace(/[_\-\s]/g, '');
    const keys = new Set<string>();
    for (const sn of loadProfile()) {
      for (const r of sn.rows) collectKeys(r, keys);
      collectKeys(sn.manifest, keys);
    }
    const offenders = [...keys].filter((k) => R3_FORBIDDEN_FIELD_NAMES.has(norm(k)));
    measure('P-80', `${keys.size} clés d’instance distinctes balayées, ${offenders.length} interdite(s) ${offenders.join(', ')}`);
    expect(offenders).toEqual([]);
  });

  it('R-DATA-21 — D3-12 : garde R3 étendue à data/, hors examples/invalid-*.json', async () => {
    const { R3_FORBIDDEN_FIELD_NAMES } = await import('../../src/types/validation');
    const norm = (s: string): string => s.toLowerCase().replace(/[_\-\s]/g, '');
    const roots = [join(REPO_ROOT, 'data', 'schema'), join(REPO_ROOT, 'data', 'fixtures'), join(REPO_ROOT, 'docs', 'data', 'dataset-spec')];
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) {
          walk(p);
          continue;
        }
        if (!name.endsWith('.json')) continue;
        // D3-12 : les exemples NÉGATIFS du schéma nomment délibérément un champ interdit — c'est
        // leur objet. Ils sont exclus PAR NOM, jamais par un motif large.
        if (/^invalid-.*\.json$/.test(name)) continue;
        files.push(p);
      }
    };
    for (const r of roots) walk(r);
    const offenders: string[] = [];
    for (const f of files) {
      const parsed = JSON.parse(readFileSync(f, 'utf8')) as unknown;
      // VOCABULAIRE D'INSTANCE seulement : pour un JSON Schema, les clés du méta-schéma
      // (`description`, `properties`…) ne sont pas des noms de champ KYCAR.
      const subject = f.includes(`${'schema'}/`) && f.endsWith('.schema.json') ? instanceVocabularyOfSchema(parsed) : parsed;
      const keys = collectKeys(subject);
      for (const k of keys) if (R3_FORBIDDEN_FIELD_NAMES.has(norm(k))) offenders.push(`${f} → ${k}`);
    }
    measure('R3-data', `${files.length} fichiers JSON balayés sous data/schema, data/fixtures et docs/data/dataset-spec ; ${offenders.length} clé(s) interdite(s)`);
    expect(offenders).toEqual([]);
  });

  it('P-107 — aucun téléphone, courriel ou URL dans le moindre texte des fixtures', () => {
    // Un numéro belge : indicatif `+32` ou un `0` initial, puis 8 à 9 chiffres, séparateurs admis.
    const PHONE = /(?:\+\s?32|\b0)[1-9](?:[\s./-]?[0-9]){7,9}\b/;
    const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
    const URL = /(?:https?:\/\/|www\.)[A-Za-z0-9-]/;
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const offenders: string[] = [];
    let scanned = 0;
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        for (const { path, value } of collectStrings(r)) {
          // `webPage` EST une URL par construction (deeplink d'annonce, P-105) : c'est le seul champ
          // où une URL est licite, et elle ne porte aucune coordonnée de vendeur. `id` est un UUID
          // canonique imposé par le schéma : sa forme hexadécimale n'est pas un numéro de téléphone.
          if (path === 'webPage') continue;
          if (path === 'id' && UUID.test(value)) continue;
          scanned += 1;
          if (PHONE.test(value) || EMAIL.test(value) || URL.test(value)) {
            offenders.push(`${sn.snapshotId} ${r.id} ${path} = ${value}`);
          }
        }
      }
    }
    measure('P-107', `${scanned} chaînes balayées (hors webPage), ${offenders.length} occurrence(s) ${offenders.slice(0, 3).join(' ; ')}`);
    expect(offenders).toEqual([]);
  });

  it('P-81 — la distribution des 32 bits de dealerBucket est uniforme au khi-deux (p > 0,01)', () => {
    const sn = s0();
    const buckets = new Set<string>();
    for (const r of sn.rows) {
      const b = r.seller?.dealerBucket;
      if (b !== undefined) buckets.add(b);
    }
    // Un octet par position : 4 tests de khi-deux à 256 cases sur les valeurs DISTINCTES (une clé
    // par concessionnaire, pas une par annonce — sinon la loi de stock de Zipf dominerait le test).
    const results: string[] = [];
    let worst = 1;
    for (let byteIndex = 0; byteIndex < 4; byteIndex += 1) {
      const counts = new Array<number>(256).fill(0);
      for (const b of buckets) {
        const v = Number.parseInt(b.slice(byteIndex * 2, byteIndex * 2 + 2), 16);
        counts[v] = (counts[v] as number) + 1;
      }
      const { chi2, df } = chiSquareUniform(counts);
      const p = chiSquarePValue(chi2, df);
      worst = Math.min(worst, p);
      results.push(`octet ${byteIndex} : χ² ${chi2.toFixed(1)} (df ${df}), p ${p.toFixed(4)}`);
    }
    // Contrôle de non-réversibilité : aucune corrélation de rang entre la clé lue comme entier et
    // l'effectif du regroupement (un index ordonné laisserait cette corrélation).
    const sizes = new Map<string, number>();
    for (const r of sn.rows) {
      const b = r.seller?.dealerBucket;
      if (b !== undefined) sizes.set(b, (sizes.get(b) ?? 0) + 1);
    }
    const pairs = [...sizes.entries()].map(([k, n]) => [Number.parseInt(k, 16), n] as const);
    const rank = (xs: number[]): number[] => {
      const order = xs.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
      const out = new Array<number>(xs.length);
      order.forEach(([, i], r) => {
        out[i] = r;
      });
      return out;
    };
    const rx = rank(pairs.map((p) => p[0]));
    const ry = rank(pairs.map((p) => p[1]));
    const n = rx.length;
    const mx = (n - 1) / 2;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (let i = 0; i < n; i += 1) {
      sxy += ((rx[i] as number) - mx) * ((ry[i] as number) - mx);
      sxx += ((rx[i] as number) - mx) ** 2;
      syy += ((ry[i] as number) - mx) ** 2;
    }
    const spearman = sxy / Math.sqrt(sxx * syy);
    measure('P-81', `${buckets.size} clés distinctes · ${results.join(' · ')} · corrélation de rang clé/effectif ${spearman.toFixed(4)}`);
    expect(worst).toBeGreaterThan(0.01);
    expect(Math.abs(spearman)).toBeLessThan(0.2);
  });
});

describe('P-82 — alimentation des filtres retenus', () => {
  /** Valeur de filtre lue sur une annonce, par paramètre retenu. */
  const FIELD_OF_FILTER: Record<string, (r: RawListing) => unknown> = {
    offer: (r) => r.offerType,
    priceFrom: (r) => r.prices?.public?.price,
    priceTo: (r) => r.prices?.public?.price,
    priceEvaluation: (r) => r.prices?.public?.evaluation?.category,
    mileageFrom: (r) => r.mileage,
    mileageTo: (r) => r.mileage,
    dateOfRegistrationFrom: (r) => r.firstRegistrationDate,
    dateOfRegistrationTo: (r) => r.firstRegistrationDate,
    dateOfModelYearFrom: (r) => r.productionYear,
    dateOfModelYearTo: (r) => r.productionYear,
    fuelType: (r) => r.fuelCategory,
    powerFrom: (r) => r.power,
    powerTo: (r) => r.power,
    engineMotorSizeFrom: (r) => r.cylinderCapacity,
    engineMotorSizeTo: (r) => r.cylinderCapacity,
    engineType: (r) => r.primaryFuelType,
    driveTrain: (r) => r.drivetrain,
    gearType: (r) => r.transmission,
    bodyType: (r) => r.bodyType,
    doorFrom: (r) => r.doorCount,
    doorTo: (r) => r.doorCount,
    numberOfSeatsFrom: (r) => r.seatCount,
    numberOfSeatsTo: (r) => r.seatCount,
    bodyColor: (r) => r.bodyColor,
    paintwork: (r) => r.paintType,
    interiorColor: (r) => r.upholsteryColor,
    upholstery: (r) => r.upholsteryType,
    emissionClass: (r) => r.euEmissionStandard,
    batteryOwnershipType: (r) => r.battery?.ownershipType,
    electricRangeFrom: (r) => r.electricRange,
    electricRangeTo: (r) => r.electricRange,
    equipment: (r) => (r.equipment ?? []).join(','),
    hadAccident: (r) => r.condition?.hadAccident,
    hadAccidentNew: (r) => r.usageState,
    numberOfOwners: (r) => r.previousOwnerCount,
    seals: (r) => (r.appliedSeals ?? []).join(','),
    sellerType: (r) => r.seller?.type,
    countryType: (r) => r.location.countryCode,
    articleType: (r) => r.vehicleType,
    powerType: (r) => r.powerUnit,
  };

  it('P-82 — chaque filtre déclaré alimenté a au moins 2 valeurs distinctes ; les non alimentés sont publiés', () => {
    const sn = s0();
    const report = loadGenerationReport(sn) as {
      filterCoverage?: { fueled?: string[]; unfueled?: { id: string; param: string; reason: string }[] };
    };
    const fueled = report.filterCoverage?.fueled ?? [];
    const unfueled = report.filterCoverage?.unfueled ?? [];
    expect(fueled.length, 'le rapport latéral publie la liste des filtres alimentés').toBeGreaterThan(0);
    expect(unfueled.length, 'le rapport latéral publie la liste des filtres NON alimentés').toBeGreaterThan(0);

    const distinct = (id: string): number | undefined => {
      const f = FIELD_OF_FILTER[id];
      if (f === undefined) return undefined;
      const seen = new Set<string>();
      for (const r of sn.rows) {
        const v = f(r);
        if (v === undefined || v === '') continue;
        seen.add(String(v));
      }
      return seen.size;
    };

    const degenerate: string[] = [];
    const unmapped: string[] = [];
    for (const id of fueled) {
      const n = distinct(id);
      if (n === undefined) {
        unmapped.push(id);
        continue;
      }
      if (n < 2) degenerate.push(`${id} (${n} valeur)`);
    }
    // Les deux filtres déclarés « une seule valeur » doivent EFFECTIVEMENT n'en avoir qu'une.
    const single = unfueled.filter((u) => u.reason.includes('valeur(s) distincte'));
    const singleWrong: string[] = [];
    for (const u of single) {
      const n = distinct(u.id);
      if (n !== undefined && n >= 2) singleWrong.push(`${u.id} annoncé mono-valeur mais ${n} valeurs`);
    }
    measure(
      'P-82',
      `${fueled.length} filtres annoncés alimentés (${fueled.length - unmapped.length} recalculés par le reviewer), ` +
        `${degenerate.length} dégénéré(s) ${degenerate.join(', ')} · ${unfueled.length} non alimentés publiés ` +
        `(dont ${single.length} mono-valeur : ${single.map((u) => u.id).join(', ')}) · non recalculables : ${unmapped.join(', ') || 'aucun'}`,
    );
    expect(degenerate).toEqual([]);
    expect(singleWrong).toEqual([]);
  });
});

/**
 * Réduit un JSON Schema à son VOCABULAIRE D'INSTANCE : les noms de propriétés qu'il décrit, pas les
 * mots-clés du méta-schéma (`description`, `properties`, `required`…). D3-12.
 */
function instanceVocabularyOfSchema(schema: unknown): unknown {
  const out: Record<string, unknown> = {};
  const walk = (node: unknown, into: Record<string, unknown>): void => {
    if (node === null || typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    const props = o['properties'];
    if (props !== null && typeof props === 'object') {
      for (const [k, v] of Object.entries(props as Record<string, unknown>)) {
        const child: Record<string, unknown> = {};
        into[k] = child;
        walk(v, child);
      }
    }
    for (const key of ['items', '$defs', 'allOf', 'anyOf', 'oneOf', 'dependentSchemas', 'then', 'else']) {
      const v = o[key];
      if (Array.isArray(v)) for (const x of v) walk(x, into);
      else if (v !== null && typeof v === 'object') walk(v, into);
    }
  };
  walk(schema, out);
  return out;
}

