/**
 * KYCAR — SONDE DE CONTRAT : la baseline du provider EST le calcul du MOTEUR (phase 3.5, `DR3-20`)
 * =================================================================================================
 * Constat corrigé : `DR3-20` (MAJEUR, `reports/data/DATA-REVIEW.md` §10.5, arbitrage `D3-37`). Les
 * agrégats mode 1 du provider par défaut — et les six `baseline.json` commités qui les figent —
 * suivaient trois conventions qui ne sont PAS celles du dictionnaire ni celles du moteur :
 *
 *   1. quantiles au RANG LE PLUS PROCHE `x_⌈p·n⌉` au lieu du **type 7** qu'`EX-DATA-62` impose comme
 *      « définition unique et non négociable » (6 954/6 954 quantiles de l'artefact reproduits par le
 *      rang le plus proche, 3 653 seulement par le type 7) ;
 *   2. échantillon de prix privé de la seule sentinelle ABSOLUE, sans la sentinelle RELATIVE
 *      d'`EX-DATA-19(2)` que le moteur applique (274 lignes au profil test, 83 au profil dev) ;
 *   3. axe année tiré de `modelYear`, qu'`EX-DATA-25` interdit explicitement (« jamais `modelYear` »).
 *
 * Deux implémentations d'un même contrat servaient donc deux définitions, et l'écran A (provider)
 * contredisait l'écran B (moteur) sur la même sélection.
 *
 * CE QUE LA SONDE PROUVE, ET POURQUOI ELLE EST CONSTRUITE AINSI
 * -------------------------------------------------------------------------------------------------
 * `baseline-artifact.test.ts` compare l'artefact à `aggregateByMake`, c'est-à-dire à LA FONCTION QUI
 * L'A PRODUIT : elle est par construction aveugle à `DR3-20`. Cette sonde-ci compare l'artefact à un
 * TIERS — `aggregate()` du moteur (`src/engine/aggregate.ts`), qui sert l'écran B — sur le lot
 * complet non filtré, la sélection même dont la baseline est l'agrégat.
 *
 *   §1  FIDÉLITÉ AU MOTEUR — pour chaque snapshot commité de `dev` et de `test`, chaque ligne de
 *       `baseline.json` est égale CHAMP À CHAMP au `MakeAggregate` du moteur : `listingCount`, et
 *       `min`/`max`/`p05`/`p50`/`p95`/`n` des trois métriques. L'ordre des lignes aussi
 *       (`EX-DATA-70` : `listingCount` décroissant, `makeId` croissant).
 *   §2  NON-RÉGRESSION SANS DONNÉES — sur des lots CONSTRUITS À LA MAIN (n = 2, 3, 4, 20), les
 *       quantiles du provider valent ceux du type 7 calculés à la main, littéral par littéral. Ces
 *       cas-là survivent à n'importe quelle régénération des NDJSON : ils ne lisent aucun fichier.
 *
 * AUCUNE VALEUR DE FIXTURE N'EST FIGÉE ICI. §1 ne compare que deux calculs faits dans le même
 * processus sur les mêmes octets ; §2 ne lit pas les fixtures. La sonde reste donc valable quand le
 * générateur régénère `dev` et `test` — ce qui est le cas dans la même vague (lot `data-fix-2`).
 *
 * Aucune I/O réseau (E5) : tout se lit sur disque.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { aggregate } from '../../src/engine/aggregate';
import { PRICE_STATUS_QUOTED } from '../../src/engine/flags';
import type { MakeAggregate, MetricRange, ModelAggregate } from '../../src/providers/DataProvider';
import { FixtureDataProvider } from '../../src/providers/fixture/FixtureDataProvider';
import {
  BASELINE_FILE,
  isBaselineArtifact,
  type SnapshotBaselineArtifact,
} from '../../src/providers/fixture/baseline-artifact';
import { buildProfileIndexFromDisk, createNodeFixtureLoader } from '../../src/providers/fixture/loaders/node';
import type { FixtureProfile } from '../../src/providers/fixture/manifest';
import { aggregateByMake, aggregateByModel } from '../../src/providers/synthetic/aggregate';
import type { MetricColumns } from '../../src/providers/synthetic/generate';
import { MODEL_ID_UNRESOLVED, NUMERIC_UNKNOWN } from '../../src/types/sentinels';
import { referenceData } from './subjects';

/** Racine des fixtures du dépôt. */
const FIXTURE_ROOT = resolve(process.cwd(), 'data/fixtures');

/** Les profils COMMITÉS (le profil `perf` n'est pas versionné). */
const COMMITTED_PROFILES: readonly FixtureProfile[] = ['dev', 'test'];

/** Les six champs de l'entité gelée `MetricRange`. */
const RANGE_FIELDS = ['min', 'max', 'p05', 'p50', 'p95', 'n'] as const;
/** Les trois métriques d'un agrégat de marque. */
const METRICS = ['price', 'mileage', 'year'] as const;

/* ================================================================================================
 * §1. FIDÉLITÉ AU MOTEUR — `baseline.json` == `aggregate()` de `src/engine`
 * ============================================================================================== */

/** Lit l'artefact commité d'un snapshot, en exigeant sa forme. */
function readArtifact(profile: string, dir: string): SnapshotBaselineArtifact {
  const path = resolve(FIXTURE_ROOT, profile, dir, BASELINE_FILE);
  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as unknown;
  expect(isBaselineArtifact(parsed), `${profile}/${dir}/${BASELINE_FILE} a la forme attendue`).toBe(true);
  return parsed as SnapshotBaselineArtifact;
}

/**
 * `modelCount` RECALCULÉ ici, indépendamment du provider (`EX-DATA-71` : modèles DISTINCTS présents
 * dans la sélection, la clé réservée `modelId = 0` exclue). Le moteur, lui, publie `null` pour ce
 * champ (`D8-10` : « champ obligatoire, valeur neutre tant que le calcul n'est pas branché ») : il
 * ne peut donc pas servir de tiers ici, et la sonde compte elle-même plutôt que de croire l'artefact.
 */
function distinctModelCountByMake(batch: {
  rowCount: number;
  makeId: ArrayLike<number>;
  modelId: ArrayLike<number>;
}): Map<number, number> {
  const seen = new Map<number, Set<number>>();
  for (let i = 0; i < batch.rowCount; i += 1) {
    const modelId = batch.modelId[i] as number;
    if (modelId === MODEL_ID_UNRESOLVED) continue;
    const makeId = batch.makeId[i] as number;
    let set = seen.get(makeId);
    if (set === undefined) {
      set = new Set<number>();
      seen.set(makeId, set);
    }
    set.add(modelId);
  }
  return new Map([...seen].map(([makeId, set]) => [makeId, set.size]));
}

describe('DR3-20 — la baseline commitée est le calcul du MOTEUR, champ à champ', () => {
  for (const profile of COMMITTED_PROFILES) {
    it(`profil ${profile} : chaque baseline.json est égale aux MakeAggregate d'aggregate() du moteur`, async () => {
      if (!existsSync(resolve(FIXTURE_ROOT, profile))) {
        // Un profil absent de l'arbre ne peut pas être prouvé — et ne doit pas être supposé.
        expect(existsSync(resolve(FIXTURE_ROOT, profile)), `profil ${profile} présent`).toBe(false);
        return;
      }
      const index = buildProfileIndexFromDisk(FIXTURE_ROOT, profile);
      expect(index.snapshots.length, `${profile} : snapshots trouvés`).toBeGreaterThan(0);

      for (const entry of index.snapshots) {
        const artifact = readArtifact(profile, entry.dir);
        const provider = new FixtureDataProvider({
          referenceData: referenceData(),
          profile,
          loader: createNodeFixtureLoader(FIXTURE_ROOT),
          snapshotId: entry.snapshotId,
          // Chemin d'ingestion COMPLÈTE : on veut les octets, pas l'artefact qu'on met à l'épreuve.
          useBaselineArtifact: false,
        });
        const handle = await provider.openSnapshot();
        const batch = await provider.whenIngested();

        // La sélection VIDE, dont la baseline est l'agrégat : TOUTES les lignes, aucun filtre.
        const rows = new Int32Array(batch.rowCount);
        for (let i = 0; i < batch.rowCount; i += 1) rows[i] = i;
        const engine = aggregate(batch, rows, entry.snapshotId, 'baseline');

        const where = `${profile}/${entry.dir}`;
        expect(artifact.selectionCount, `${where} : selectionCount`).toBe(engine.selectionCount);
        expect(
          artifact.rows.map((r) => r.makeId),
          `${where} : mêmes marques, dans le même ordre (EX-DATA-70)`,
        ).toStrictEqual(engine.makeAggregates.map((a) => a.makeId));

        const modelCounts = distinctModelCountByMake(batch);
        for (let k = 0; k < artifact.rows.length; k += 1) {
          const row = artifact.rows[k] as MakeAggregate;
          const ref = engine.makeAggregates[k] as MakeAggregate;
          const who = `${where} marque ${row.makeId}`;
          expect(row.listingCount, `${who} : listingCount`).toBe(ref.listingCount);
          for (const metric of METRICS) {
            const got = row[metric] as MetricRange;
            const want = ref[metric] as MetricRange;
            for (const field of RANGE_FIELDS) {
              expect(got[field], `${who} : ${metric}.${field}`).toBe(want[field]);
            }
          }
          // `sampleCoverage` et `modelCount` : le moteur publie `null` pour les DEUX (`D8-10`,
          // `D8-23` — `announcedCount` n'est pas dans le lot colonnaire, `modelCount` n'est pas
          // branché côté moteur). Ils ne peuvent donc pas être comparés au moteur ; ils sont
          // vérifiés contre leur définition, jamais contre une valeur figée.
          expect(ref.sampleCoverage, `${who} : le moteur ne calcule pas sampleCoverage`).toBeNull();
          expect(ref.modelCount, `${who} : le moteur ne calcule pas modelCount`).toBeNull();
          expect(row.sampleCoverage, `${who} : sampleCoverage de la sélection vide`).toBe(1);
          expect(row.modelCount, `${who} : modelCount (EX-DATA-71)`).toBe(modelCounts.get(row.makeId) ?? 0);
        }
        await provider.closeSnapshot(handle);
      }
    });
  }
});

/* ================================================================================================
 * §1bis. LE MÊME ACCORD SOUS FILTRE — l'autre branche d'accumulation du provider
 * ============================================================================================== */

/**
 * §1 n'exerce que le chemin DENSE d'`aggregateByMake` (`rowIndices === null`), celui de la baseline.
 * Le chemin d'une sélection FILTRÉE passe par `accumulate`, une autre boucle — et c'est celle que
 * l'écran A emploie dès que l'utilisateur pose un filtre. Elle est confrontée au même tiers, sur une
 * sélection déterministe qui ne dépend d'aucune valeur du jeu (un index sur trois) : le seuil relatif
 * d'`EX-DATA-19(2)` y est recalculé sur cette sélection-là, comme `EX-DATA-86` l'exige.
 */
describe('DR3-20 — sous filtre aussi, le provider calcule ce que le moteur calcule', () => {
  it('marques ET modèles d’une sélection filtrée : mêmes MetricRange que aggregate() du moteur', async () => {
    const profile: FixtureProfile = 'dev';
    if (!existsSync(resolve(FIXTURE_ROOT, profile))) return;
    const entry = buildProfileIndexFromDisk(FIXTURE_ROOT, profile).snapshots.at(-1);
    expect(entry, 'un snapshot dev').toBeDefined();
    const { snapshotId } = entry as { snapshotId: string };

    const provider = new FixtureDataProvider({
      referenceData: referenceData(),
      profile,
      loader: createNodeFixtureLoader(FIXTURE_ROOT),
      snapshotId,
      useBaselineArtifact: false,
    });
    const handle = await provider.openSnapshot();
    const batch = await provider.whenIngested();

    // Une ligne sur trois : reproductible, sans rapport avec le contenu, non vide à tout effectif.
    const picked: number[] = [];
    for (let i = 0; i < batch.rowCount; i += 3) picked.push(i);
    expect(picked.length, 'sélection non vide').toBeGreaterThan(0);

    const engine = aggregate(batch, Int32Array.from(picked), snapshotId, 'filtree');
    const makes = aggregateByMake(batch, picked, null);
    const models = aggregateByModel(batch, picked, null, undefined);

    expect(
      makes.map((a) => a.makeId),
      'mêmes marques, même ordre',
    ).toStrictEqual(engine.makeAggregates.map((a) => a.makeId));
    for (let k = 0; k < makes.length; k += 1) {
      const got = makes[k] as MakeAggregate;
      const want = engine.makeAggregates[k] as MakeAggregate;
      expect(got.listingCount, `marque ${got.makeId} : listingCount`).toBe(want.listingCount);
      for (const metric of METRICS) {
        for (const field of RANGE_FIELDS) {
          expect(
            (got[metric] as MetricRange)[field],
            `marque ${got.makeId} : ${metric}.${field}`,
          ).toBe((want[metric] as MetricRange)[field]);
        }
      }
    }

    const modelKey = (a: { makeId: number; modelId: number }): string => `${a.makeId}:${a.modelId}`;
    const engineModels = new Map<string, ModelAggregate>(
      engine.modelAggregates.map((a) => [modelKey(a), a] as const),
    );
    expect(models.length, 'mêmes couples marque/modèle').toBe(engine.modelAggregates.length);
    for (const got of models) {
      const key = modelKey(got);
      const want = engineModels.get(key);
      expect(want, `couple ${key} publié par le moteur`).toBeDefined();
      const ref = want as ModelAggregate;
      expect(got.listingCount, `${key} : listingCount`).toBe(ref.listingCount);
      for (const metric of METRICS) {
        for (const field of RANGE_FIELDS) {
          expect((got[metric] as MetricRange)[field], `${key} : ${metric}.${field}`).toBe(
            (ref[metric] as MetricRange)[field],
          );
        }
      }
    }
    await provider.closeSnapshot(handle);
  });
});

/* ================================================================================================
 * §2. NON-RÉGRESSION SANS DONNÉES — le type 7, calculé à la main
 * ============================================================================================== */

/** Une annonce du lot construit à la main. */
interface HandRow {
  readonly price: number;
  readonly mileage: number;
  /** Année de PREMIÈRE IMMATRICULATION (EX-DATA-25). */
  readonly year: number;
  /** Année-modèle, DÉLIBÉRÉMENT différente : aucun agrégat ne doit la lire. */
  readonly modelYear: number;
  readonly makeId?: number;
}

/** Lot colonnaire minimal, entièrement écrit à la main : aucune fixture, aucun générateur. */
function handBatch(listings: readonly HandRow[]): MetricColumns {
  const n = listings.length;
  const col = (pick: (r: HandRow) => number): Int32Array => Int32Array.from(listings, pick);
  return {
    rowCount: n,
    priceEur: col((r) => r.price),
    mileageKm: col((r) => r.mileage),
    modelYear: col((r) => r.modelYear),
    makeId: col((r) => r.makeId ?? 1),
    modelId: new Int32Array(n).fill(MODEL_ID_UNRESOLVED),
    ingestFlags: new Uint32Array(n),
    priceStatus: new Uint8Array(n).fill(PRICE_STATUS_QUOTED),
    firstRegistrationYearMonth: col((r) => 12 * r.year),
  };
}

/** Construit `n` annonces dont seuls les prix comptent (kilométrage et années constants). */
function pricedRows(prices: readonly number[]): HandRow[] {
  return prices.map((price) => ({ price, mileage: 100_000, year: 2020, modelYear: 1900 }));
}

/** L'unique agrégat de marque d'un lot construit à la main. */
function soleAggregate(listings: readonly HandRow[]): MakeAggregate {
  const rows = aggregateByMake(handBatch(listings), null, 1);
  expect(rows.length, 'une seule marque dans le lot construit à la main').toBe(1);
  return rows[0] as MakeAggregate;
}

describe('EX-DATA-62 — les quantiles du provider sont ceux du type 7, calculés à la main', () => {
  /**
   * Chaque cas porte DEUX attendus pour le même quantile :
   *
   *   - `hand` — la valeur du calcul à la main en arithmétique exacte, celle qu'`EX-DATA-62` écrit
   *     (`h = (n−1)·p + 1`, `i = plancher(h)`, `f = h − i`, `Q = x_i + f·(x_{i+1} − x_i)`) ;
   *   - `exact` — le MÊME calcul en binaire64, tel que la formule du dictionnaire le produit quand
   *     `f` n'est pas représentable (`0,95` ne l'est pas : à n = 4, `f = 0,8499999999999996`, d'où
   *     `p95 = 8 949,999999999996` et non `8 950`).
   *
   * `EX-DATA-63` interdit tout arrondi intermédiaire : la valeur SERVIE est `exact`, l'écart à `hand`
   * est le résidu de représentation, absorbé par l'arrondi de PRÉSENTATION d'`EX-DATA-64` (euro
   * entier pour le prix). Vérifier les deux, c'est prouver à la fois la formule et sa stabilité.
   */
  interface QuantileCase {
    readonly name: string;
    readonly prices: readonly number[];
    readonly n: number;
    readonly hand: readonly [number, number, number];
    readonly exact: readonly [number, number, number];
  }

  const cases: readonly QuantileCase[] = [
    {
      // n = 2, le cas de DR3-20 : marque 16420 du profil test — rang le plus proche 2 990 €,
      // type 7 = 2 990 + 0,5 · (20 995 − 2 990) = 11 992,5 (écart relatif 85,8 %).
      name: 'n = 2 — {2 990, 20 995}',
      prices: [20_995, 2_990],
      n: 2,
      // h = 1,05 / 1,50 / 1,95 → 2 990 + f · 18 005.
      hand: [3_890.25, 11_992.5, 20_094.75],
      exact: [3_890.250000000001, 11_992.5, 20_094.75],
    },
    {
      name: 'n = 3 — {1 000, 2 000, 6 000}',
      prices: [6_000, 1_000, 2_000],
      n: 3,
      // h = 1,10 → 1 000 + 0,10 · 1 000 ; h = 2,00 → f = 0 → x_2 ; h = 2,90 → 2 000 + 0,90 · 4 000.
      hand: [1_100, 2_000, 5_600],
      exact: [1_100, 2_000, 5_600],
    },
    {
      name: 'n = 4 — {1 000, 2 000, 3 000, 10 000}',
      prices: [3_000, 10_000, 1_000, 2_000],
      n: 4,
      // h = 1,15 → 1 000 + 0,15 · 1 000 ; h = 2,50 → 2 000 + 0,50 · 1 000 ; h = 3,85 → 3 000 + 0,85 · 7 000.
      hand: [1_150, 2_500, 8_950],
      exact: [1_150, 2_500, 8_949.999999999996],
    },
    {
      // n = 20 : la règle relative d'EX-DATA-19(2) S'APPLIQUE (n ≥ 12) et n'exclut rien —
      // médianeRéf = 19 500, seuil = 1 950, le plus petit prix vaut 10 000.
      name: 'n = 20 — 10 000 à 29 000 par pas de 1 000',
      prices: Array.from({ length: 20 }, (_, k) => 10_000 + 1_000 * (19 - k)),
      n: 20,
      // h = 1,95 → 10 000 + 0,95 · 1 000 ; h = 10,50 → 19 000 + 0,50 · 1 000 ; h = 19,05 → 28 000 + 0,05 · 1 000.
      hand: [10_950, 19_500, 28_050],
      exact: [10_950, 19_500, 28_050],
    },
  ];

  for (const c of cases) {
    it(`${c.name}`, () => {
      const agg = soleAggregate(pricedRows(c.prices));
      expect(agg.listingCount, 'listingCount').toBe(c.prices.length);
      expect(agg.price.n, 'n de V_price').toBe(c.n);
      expect(agg.price.min, 'min').toBe(Math.min(...c.prices));
      expect(agg.price.max, 'max').toBe(Math.max(...c.prices));
      const got = [agg.price.p05, agg.price.p50, agg.price.p95] as const;
      const labels = ['p05', 'p50', 'p95'] as const;
      for (let k = 0; k < 3; k += 1) {
        expect(got[k], `${labels[k]} : calcul à la main (EX-DATA-62)`).toBeCloseTo(c.hand[k] as number, 6);
        expect(got[k], `${labels[k]} : double précision sans arrondi (EX-DATA-63)`).toBe(c.exact[k] as number);
      }
    });
  }

  it("EX-DATA-63 — le quantile n'est pas arrondi par le provider (l'arrondi est de présentation)", () => {
    const agg = soleAggregate(pricedRows([2_990, 20_995]));
    expect(Number.isInteger(agg.price.p50), 'p50 arrondi à l’entier').toBe(false);
    expect(agg.price.p50, 'p50 exact en double précision').toBe(11_992.5);
  });
});

describe("EX-DATA-19(2) — la sentinelle relative sort le prix de V_price, jamais l'annonce de l'effectif", () => {
  // 20 annonces : un prix absurde à 300 € (au-dessus des 250 € de la sentinelle ABSOLUE, donc
  // conservé à l'étage ingestion) et 19 prix de 10 000 à 28 000 €.
  // médianeRéf = Q({300, 10 000 … 28 000}, 0,50) = x_10 + 0,5 · (x_11 − x_10) = 18 000 + 500 = 18 500.
  // Seuil = 0,10 × 18 500 = 1 850 ; 300 < 1 850 → l'annonce sort de V_price (n passe de 20 à 19).
  const prices = [300, ...Array.from({ length: 19 }, (_, k) => 10_000 + 1_000 * k)];

  it("l'annonce reste COMPTÉE (ARB-15) mais sort de l'échantillon de prix", () => {
    const agg = soleAggregate(pricedRows(prices));
    expect(agg.listingCount, "l'annonce reste dans l'effectif").toBe(20);
    expect(agg.price.n, 'V_price privé du prix implausible').toBe(19);
    expect(agg.price.min, 'le minimum publié est celui de V_price').toBe(10_000);
    expect(agg.price.p05, 'p05 : h = 1,90 → 10 000 + 0,90 · 1 000').toBe(10_900);
    expect(agg.price.p50, 'p50 : h = 10,00 → f = 0 → x_10').toBe(19_000);
    // 27 100 à la main ; 27 099,999999999996 en binaire64 (f = 0,09999999999999964), non arrondi
    // par le provider (EX-DATA-63) — l'arrondi à l'euro entier est de présentation (EX-DATA-64).
    expect(agg.price.p95, 'p95 : h = 18,10 → 27 000 + 0,10 · 1 000').toBeCloseTo(27_100, 6);
    expect(agg.price.p95, 'p95 : double précision').toBe(27_099.999999999996);
  });

  it("sous 12 prix valides la règle ne s'applique pas : le prix absurde reste dans V_price", () => {
    const agg = soleAggregate(pricedRows([300, 10_000, 20_000]));
    expect(agg.price.n, 'n = 3 < 12 : aucun retrait relatif').toBe(3);
    expect(agg.price.min, 'le prix absurde est toujours le minimum').toBe(300);
  });
});

describe("EX-DATA-25 — l'axe année d'un agrégat est firstRegistrationYear, jamais modelYear", () => {
  it('les deux colonnes diffèrent, et seul firstRegistrationYear alimente l’agrégat', () => {
    const agg = soleAggregate([
      { price: 10_000, mileage: 50_000, year: 2016, modelYear: 2001 },
      { price: 12_000, mileage: 60_000, year: 2018, modelYear: 2002 },
      { price: 14_000, mileage: 70_000, year: 2020, modelYear: 2003 },
    ]);
    expect(agg.year.min, 'min').toBe(2016);
    expect(agg.year.max, 'max').toBe(2020);
    expect(agg.year.p50, 'p50 (type 7 sur {2016, 2018, 2020})').toBe(2018);
    // L'année n'échappe pas au type 7 : p05 = 2 016,2 et p95 = 2 019,8, arrondis à la
    // PRÉSENTATION par plancher et plafond (EX-DATA-64), jamais par le provider (EX-DATA-63).
    expect(agg.year.p05, 'p05 (type 7, non arrondi)').toBeCloseTo(2016.2, 6);
    expect(agg.year.p95, 'p95 (type 7, non arrondi)').toBeCloseTo(2019.8, 6);
    expect(agg.year.n, 'trois années connues').toBe(3);
  });

  it('EX-DATA-26 — une première immatriculation inconnue sort de V_year sans sortir de l’effectif', () => {
    const rows: HandRow[] = [
      { price: 10_000, mileage: 50_000, year: 2016, modelYear: 2016 },
      { price: 12_000, mileage: 60_000, year: 2020, modelYear: 2020 },
    ];
    const batch = handBatch(rows);
    (batch.firstRegistrationYearMonth as Int32Array)[1] = NUMERIC_UNKNOWN;
    const agg = aggregateByMake(batch, null, 1)[0] as MakeAggregate;
    expect(agg.listingCount, "l'annonce reste comptée").toBe(2);
    expect(agg.year.n, 'une seule année connue').toBe(1);
    expect(agg.year.p50, 'p50 sur un singleton').toBe(2016);
  });
});
