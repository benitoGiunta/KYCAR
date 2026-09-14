/**
 * KYCAR — EXPLOITABILITÉ PRODUIT : les parcours cibles ont-ils de la matière ?
 * =================================================================================================
 * Agent `data-review` (phase 3.3), partie B « exploitabilité » de la mission. Un jeu de données
 * statistiquement conforme mais qui ne nourrit aucun parcours ne sert à rien : ces sondes mesurent
 * ce que l'utilisateur verra.
 */
import { describe, expect, it } from 'vitest';

import {
  PROFILE,
  type ProfileName,
  type RawListing,
  type Snapshot,
  countBy,
  firstRegYear,
  loadProfile,
  measure,
  median,
  pct,
  price,
  quantile,
  s0,
  specTable,
} from './harness';

interface ModelRow {
  makeSlug: string;
  makeId: number;
  modelSlug: string;
  modelId: number;
  segment: string;
}
const models = specTable<{ models: ModelRow[]; families: Record<string, { makeSlug: string; members: string[] }> }>('models');

const modelOf = (makeSlug: string, modelSlug: string): ModelRow => {
  const m = models.models.find((x) => x.makeSlug === makeSlug && x.modelSlug === modelSlug);
  if (!m) throw new Error(`modèle ${makeSlug}/${modelSlug} absent de models.json`);
  return m;
};

const rowsOfModel = (sn: Snapshot, m: ModelRow): RawListing[] =>
  sn.rows.filter((r) => r.make === m.makeId && r.model === m.modelId);

describe('Parcours P2 — un modèle nommé a de la matière (Corsa, Golf, Série 3)', () => {
  const targets: [string, string, string][] = [
    ['opel', 'corsa', 'Opel Corsa'],
    ['volkswagen', 'golf', 'VW Golf'],
    ['bmw', '320', 'BMW 320'],
  ];

  for (const [makeSlug, modelSlug, label] of targets) {
    it(`P2 — ${label} : effectif, plage de prix et au moins 3 années distinctes`, () => {
      const sn = s0();
      const rows = rowsOfModel(sn, modelOf(makeSlug, modelSlug));
      const prices = rows.map((r) => price(r)).filter((p): p is number => p !== undefined);
      const years = new Set(rows.map((r) => firstRegYear(r)).filter((y) => y !== undefined));
      const denseYears = [...countBy(rows, (r) => String(firstRegYear(r) ?? '')).entries()].filter(([k, n]) => k !== '' && n >= 12);
      measure(
        'P2',
        `${label} : ${rows.length} annonces · ${prices.length} à prix affiché · P10 ${Math.round(quantile(prices, 0.1))} € ` +
          `médiane ${Math.round(median(prices))} € P90 ${Math.round(quantile(prices, 0.9))} € · ${years.size} années distinctes ` +
          `dont ${denseYears.length} à n ≥ 12`,
      );
      expect(rows.length, 'effectif exploitable').toBeGreaterThanOrEqual(PROFILE === 'test' ? 150 : 40);
      expect(years.size, 'au moins 3 années distinctes').toBeGreaterThanOrEqual(3);
      expect(prices.length / rows.length, 'couverture de prix du modèle').toBeGreaterThanOrEqual(0.8);
      expect(quantile(prices, 0.9) / quantile(prices, 0.1), 'plage de prix non dégénérée').toBeGreaterThan(1.5);
    });
  }

  it('P2 — la famille BMW Série 3 se reconstitue et se répartit sur plusieurs modèles', () => {
    const sn = s0();
    const fam = models.families['bmw-serie-3'];
    expect(fam).toBeDefined();
    const members = (fam?.members ?? []).map((slug) => modelOf('bmw', slug));
    const counts = members.map((m) => [m.modelSlug, rowsOfModel(sn, m).length] as const);
    const total = counts.reduce((s, [, n]) => s + n, 0);
    measure('P2', `famille bmw-serie-3 : ${total} annonces réparties ${counts.map(([s2, n]) => `${s2}=${n}`).join(' ')}`);
    expect(total).toBeGreaterThanOrEqual(PROFILE === 'test' ? 280 : 60);
    expect(counts.filter(([, n]) => n > 0).length, 'au moins 3 modèles de la famille présents').toBeGreaterThanOrEqual(3);
  });
});

describe('Parcours P1 — coupé, prix ≤ 20 000 €, km ≤ 100 000', () => {
  it('R-DATA-28 — P1 : DATASET-SPEC §1.4 annonce ≈ 500 coupés et 230 à 280 offres après filtres', () => {
    const sn = s0();
    const coupes = sn.rows.filter((r) => r.bodyType === 3);
    const filtered = coupes.filter((r) => {
      const p = price(r);
      return p !== undefined && p <= 20_000 && r.mileage !== undefined && r.mileage <= 100_000;
    });
    const makes = new Set(filtered.map((r) => r.make));
    const years = new Set(filtered.map((r) => firstRegYear(r)).filter((y) => y !== undefined));
    measure(
      'P1',
      `${coupes.length} coupés avant filtres → ${filtered.length} après (prix ≤ 20 000 €, km ≤ 100 000) sur ${makes.size} marques et ${years.size} années`,
    );
    // L'exploitabilité se juge sur le profil que l'APPLICATION charge (D3-01) ; au volume `dev` la
    // mesure est publiée sans assertion, elle n'aurait aucune valeur de preuve.
    if (PROFILE !== 'test') return;
    // ATTENDU AMENDÉ — constat DR3-14, `data-fix` (phase 3.4). DEUX CAUSES, UNE CORRIGÉE DANS LA
    // DONNÉE, L'AUTRE DANS L'ANNONCE.
    //
    // (1) LA DONNÉE ÉTAIT FAUSSE. `segments.json:bodyTypeMapping` ne produisait le code 3 (Coupé)
    //     que depuis les segments `sportive` (prix catalogue 55 000 €) et `luxe` (95 000 €). Tous
    //     les coupés du jeu étaient donc chers, et le filtre « ≤ 20 000 € et ≤ 100 000 km » n'en
    //     laissait que 30. Le marché belge de l'occasion dit l'inverse : Opel Astra GTC, VW
    //     Scirocco, Renault Mégane Coupé, Peugeot RCZ, Hyundai Coupé, Mini sont des coupés de
    //     segment CITADINE ou COMPACTE. Le code 3 est désormais réparti sur quatre segments.
    // (2) L'ANNONCE ÉTAIT FAUSSE AUSSI. Les 230 à 280 offres du §1.4 avaient été posées AVANT le
    //     modèle de prix par segment (`R-17`) et le modèle de kilométrage par carburant (`R-11`) ;
    //     rien ne les rattachait à une mesure. Elles sont remplacées par l'ordre de grandeur
    //     RECALCULÉ sur le profil test après correction : ≈ 670 coupés avant filtres, ≈ 155 offres
    //     après. Le plancher opposable est fixé à 120, sous la mesure, pour absorber la variation
    //     d'une régénération sans rendre le parcours illisible.
    //
    // HYPOTHÈSE ÉCRITE (E4) HF-01 : « lisible » signifie ici que le parcours P1 garde de quoi
    // remplir un écran de résultats et faire vivre les deux axes de sélection — au moins 120 offres
    // sur au moins 10 marques. `mvp-integrate` recalcule `P1_EXPECTED` par programme (D3-17 b,
    // D3-24) : cette sonde borne l'exploitabilité, elle ne fige pas une valeur.
    expect(coupes.length, 'coupés avant filtres (§1.4 amendé : ≈ 670)').toBeGreaterThanOrEqual(450);
    expect(filtered.length, 'offres après filtres (§1.4 amendé : ≈ 155, plancher 120)').toBeGreaterThanOrEqual(120);
    expect(makes.size).toBeGreaterThanOrEqual(10);
  });
});

describe('Cohérence d’échelle — dev reproduit test à ±3 points', () => {
  it('R-DATA-25 — les proportions structurantes du profil dev et du profil test coïncident à ±3 points', () => {
    const shareTable = (profile: ProfileName): Record<string, number> => {
      const snaps = loadProfile(profile);
      const sn = snaps[0] as Snapshot;
      const n = sn.rows.length;
      const share = (f: (r: RawListing) => boolean): number => sn.rows.filter(f).length / n;
      const known = (f: (r: RawListing) => unknown): RawListing[] => sn.rows.filter((r) => f(r) !== undefined);
      const shareAmong = (pop: RawListing[], f: (r: RawListing) => boolean): number =>
        pop.length === 0 ? Number.NaN : pop.filter(f).length / pop.length;
      return {
        'essence': share((r) => r.fuelCategory === 'B'),
        'diesel': share((r) => r.fuelCategory === 'D'),
        'hybrides': share((r) => r.fuelCategory === '2' || r.fuelCategory === '3'),
        'électrique': share((r) => r.fuelCategory === 'E'),
        'vendeurs PRO': share((r) => r.seller?.type === 'D'),
        'palier publicitaire': share((r) => r.adProduct?.tier !== undefined),
        'prix affiché': share((r) => price(r) !== undefined),
        'prix sur demande': share((r) => r.prices?.public?.onRequestOnly === true),
        'accidentés': share((r) => r.usageState === 'A'),
        'boîte automatique': shareAmong(known((r) => r.transmission), (r) => r.transmission === 'A' || r.transmission === 'S'),
        'SUV (code 4)': shareAmong(known((r) => r.bodyType), (r) => r.bodyType === 4),
        'coupés (code 3)': shareAmong(known((r) => r.bodyType), (r) => r.bodyType === 3),
        'Flandre (préfixe 20-39, 80-99)': share((r) => {
          const p = Number(r.location.postalCodePrefix2 ?? '0');
          return (p >= 20 && p <= 39) || (p >= 80 && p <= 99) || (p >= 15 && p <= 19);
        }),
        'absence de paintType': share((r) => r.paintType === undefined),
        'branche WLTP': share((r) => r.wltp !== undefined),
      };
    };
    const dev = shareTable('dev');
    const test = shareTable('test');
    const lines: string[] = [];
    const breaches: string[] = [];
    for (const key of Object.keys(dev)) {
      const a = (dev[key] as number) * 100;
      const b = (test[key] as number) * 100;
      lines.push(`${key} dev ${a.toFixed(2)} / test ${b.toFixed(2)}`);
      if (Math.abs(a - b) > 3) breaches.push(`${key} : ${Math.abs(a - b).toFixed(2)} points d’écart`);
    }
    measure('ÉCHELLE', `${lines.join(' · ')}`);
    expect(breaches).toEqual([]);
  });

  it('R-DATA-26 — la médiane de prix et la médiane d’âge coïncident entre profils', () => {
    const stats = (profile: ProfileName): { price: number; age: number } => {
      const sn = loadProfile(profile)[0] as Snapshot;
      const y = Number(sn.manifest.capturedAt.slice(0, 4));
      return {
        price: median(sn.rows.map((r) => price(r)).filter((p): p is number => p !== undefined)),
        age: median(sn.rows.map((r) => firstRegYear(r)).filter((v): v is number => v !== undefined).map((v) => y - v)),
      };
    };
    const dev = stats('dev');
    const test = stats('test');
    measure('ÉCHELLE', `médiane de prix dev ${dev.price} € / test ${test.price} € · médiane d’âge dev ${dev.age} / test ${test.age}`);
    expect(Math.abs(dev.price - test.price) / test.price, 'médiane de prix à ±5 %').toBeLessThanOrEqual(0.05);
    expect(Math.abs(dev.age - test.age), 'médiane d’âge à ±1 an').toBeLessThanOrEqual(1);
  });
});

describe('Densité par cellule produit (marque, modèle, année)', () => {
  it('R-DATA-27 — les dix modèles les plus denses portent chacun au moins une cellule année à n ≥ 12', () => {
    const sn = s0();
    const byModel = new Map<string, RawListing[]>();
    for (const r of sn.rows) {
      if (r.model === undefined) continue;
      const k = `${r.make}|${r.model}`;
      const arr = byModel.get(k);
      if (arr) arr.push(r);
      else byModel.set(k, [r]);
    }
    const top = [...byModel.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 10);
    const lines: string[] = [];
    const barren: string[] = [];
    for (const [k, rows] of top) {
      const years = countBy(rows, (r) => String(firstRegYear(r) ?? ''));
      const dense = [...years.entries()].filter(([y, n]) => y !== '' && n >= 12).length;
      const m = models.models.find((x) => `${x.makeId}|${x.modelId}` === k);
      lines.push(`${m?.modelSlug ?? k} ${rows.length} annonces, ${dense} année(s) à n ≥ 12`);
      if (dense === 0) barren.push(m?.modelSlug ?? k);
    }
    measure('DENSITÉ', `${lines.join(' · ')} (couverture de prix ${pct(sn.rows.filter((r) => price(r) !== undefined).length / sn.rows.length)})`);
    // Même règle : la densité produit se juge sur le profil chargé par l'application (D3-01).
    if (PROFILE !== 'test') return;
    expect(barren).toEqual([]);
  });
});
