import { describe, expect, it } from 'vitest';
import { allFixtureRows, makeFixtureBatch, type FixtureRow } from './batch-fixture';
import { computeGroupStats, roundHalfAway } from './group-stats';
import { selectionImplausibleThreshold } from './implausible';
import {
  buildCategoryBars,
  buildDepreciation,
  buildMileageBoxes,
  buildPowerTiers,
  buildYearMedian,
} from '../screens/distribution/graphs-model';
import type { GroupStatSet } from './stats-protocol';

/**
 * TEST TEMPORAIRE DE NON-DIVERGENCE — à RETIRER par `fix-screens` (D8-07)
 * =================================================================================================
 * D8-07 fait du worker la SOURCE UNIQUE de `GROUPSTAT`, `NTILE`, des paliers de puissance et de
 * l'indice de dépréciation. Tant que la seconde implémentation de D7 existe encore sur le thread
 * principal (`src/screens/distribution/graphs-model.ts` + `group-stat.ts`), deux chiffres
 * différents peuvent s'afficher pour la même sélection. Ce test interdit cette divergence sur trois
 * sélections construites À L'INTÉRIEUR DU DOMAINE COMMUN aux deux implémentations.
 *
 * **`fix-screens` supprime CE FICHIER en même temps que `graphs-model.ts`/`group-stat.ts` cessent de
 * recalculer** : il n'a plus d'objet quand il n'y a plus qu'une implémentation.
 *
 * Trois divergences CONNUES de l'implémentation D7 par rapport à l'annexe A, que les sélections
 * ci-dessous évitent délibérément (c'est l'annexe A qui fait foi ; le code de D7 disparaît) :
 *   1. `buildDepreciation` retient les millésimes à `n ≥ 5` là où `EX-DATA-83quinquies` exige
 *      `n_price ≥ 12` — les sélections n'ont que des millésimes à `n ≥ 12` ;
 *   2. `ntile` de D7 découpe sur `⌊t·n/k⌋` là où `EX-DATA-83ter` pose `⌈t·n/k⌉` — les sélections ont
 *      un effectif MULTIPLE de 5, cas où les deux frontières coïncident ;
 *   3. `groupStat` de D7 forme un groupe pour la valeur INCONNUE, qu'`ARB-36` interdit — les
 *      sélections ne portent aucune clé inconnue sur les colonnes comparées.
 */

/** Une sélection de test : lignes + libellé, toutes à prix, année, kilométrage et puissance valides. */
function selection(name: string, rows: readonly FixtureRow[]): { name: string; rows: readonly FixtureRow[] } {
  return { name, rows };
}

/** `p` lignes par millésime, prix étagé par millésime, kilométrage et puissance tous distincts. */
function vintages(
  years: readonly number[],
  perYear: number,
  basePrice: (year: number) => number,
): FixtureRow[] {
  const rows: FixtureRow[] = [];
  let i = 0;
  for (const year of years) {
    for (let k = 0; k < perYear; k++) {
      rows.push({
        year,
        month: 1 + (k % 12),
        price: basePrice(year) + (k % 3) * 100,
        mileage: 10_000 + i * 733,
        powerKw: 60 + (i % 5) * 20,
        fuel: i % 3,
        sellerType: 1 + (i % 2),
        country: i % 2,
        evalCat: 1 + (i % 4),
        idRank: i,
      });
      i++;
    }
  }
  return rows;
}

const SELECTIONS = [
  selection('A — 5 millésimes × 12 (n = 60)', vintages([2019, 2020, 2021, 2022, 2023], 12, (y) => 8_000 + (y - 2019) * 2_500)),
  // Au moins TROIS millésimes par sélection : `buildDepreciation` (D7, EX-SCR-162) rend
  // `available = false` en deçà, et le domaine commun aux deux implémentations serait vide.
  selection('B — 3 millésimes × 15 (n = 45)', vintages([2020, 2021, 2022], 15, (y) => 14_000 + (y - 2020) * 3_000)),
  selection('C — 5 millésimes × 15 (n = 75)', vintages([2015, 2016, 2017, 2018, 2019], 15, (y) => 6_000 + (y - 2015) * 1_800)),
];

function engineOf(rows: readonly FixtureRow[]) {
  const batch = makeFixtureBatch(rows);
  const all = allFixtureRows(batch);
  const threshold = selectionImplausibleThreshold(batch, all);
  return { batch, all, threshold, stats: computeGroupStats(batch, all, threshold) };
}

function setOf(sets: readonly GroupStatSet[], key: string): GroupStatSet {
  return sets.find((s) => s.key === key) as GroupStatSet;
}

describe('D8-07 — non-divergence moteur (worker) / graphs-model (thread principal, à supprimer)', () => {
  for (const { name, rows } of SELECTIONS) {
    describe(name, () => {
      it('la sélection est bien dans le domaine commun (aucun prix implausible, aucune clé inconnue)', () => {
        const { threshold, stats } = engineOf(rows);
        const minPrice = Math.min(...rows.map((r) => r.price as number));
        expect(threshold).not.toBeNull();
        expect(minPrice).toBeGreaterThanOrEqual(threshold as number);
        for (const key of ['fuelCategory', 'sellerType', 'countryCode', 'yearBucket', 'powerTier']) {
          expect(setOf(stats.groupStats, key).unknownKeyCount).toBe(0);
        }
        expect(rows.length % 5).toBe(0);
      });

      it('GROUPSTAT catégoriel : mêmes effectifs et mêmes médianes que buildCategoryBars (G9/G12/G13/G15)', () => {
        const { batch, all, stats } = engineOf(rows);
        for (const column of ['fuelCategory', 'sellerType', 'countryCode', 'priceEvaluationCategory'] as const) {
          const d7 = new Map(buildCategoryBars(batch, all, column).map((b) => [b.key, b]));
          const engine = setOf(stats.groupStats, column);
          expect(engine.groups.length).toBe(d7.size);
          for (const g of engine.groups) {
            expect(d7.get(g.key)?.count).toBe(g.n);
            expect(d7.get(g.key)?.medianPrice).toBe(g.median);
          }
        }
      });

      it('GROUPSTAT par millésime : mêmes effectifs et mêmes médianes que buildYearMedian (G5)', () => {
        const { batch, all, stats } = engineOf(rows);
        const d7 = new Map(buildYearMedian(batch, all).map((p) => [p.year, p.stat]));
        const engine = setOf(stats.groupStats, 'yearBucket');
        expect(engine.groups.length).toBe(d7.size);
        for (const g of engine.groups) {
          expect(d7.get(g.key)?.n).toBe(g.n);
          expect(d7.get(g.key)?.median).toBe(g.median);
          expect(d7.get(g.key)?.p05).toBe(g.p05);
          expect(d7.get(g.key)?.p95).toBe(g.p95);
        }
      });

      it('indice de dépréciation : même base et mêmes indices que buildDepreciation (G6)', () => {
        const { batch, all, stats } = engineOf(rows);
        const d7 = buildDepreciation(buildYearMedian(batch, all));
        expect(d7.available).toBe(true);
        expect(stats.depreciationIndex.baseYear).toBe(d7.baseYear);
        const d7ByYear = new Map(d7.points.map((p) => [d7.baseYear - p.ageYears, p]));
        for (const entry of stats.depreciationIndex.entries) {
          const point = d7ByYear.get(entry.year);
          expect(point).toBeDefined();
          // D7 ne publie pas d'arrondi : la comparaison se fait à la décimale d'EX-DATA-83quinquies.
          expect(entry.index).toBe(roundHalfAway(point?.index as number, 1));
          if (entry.annualLossPct !== null) {
            expect(entry.annualLossPct).toBe(roundHalfAway(point?.annualLossPct as number, 1));
          }
        }
      });

      it('NTILE : mêmes tranches, mêmes bornes observées et mêmes effectifs que buildMileageBoxes (G10)', () => {
        const { batch, all, stats } = engineOf(rows);
        const d7 = buildMileageBoxes(batch, all);
        expect(d7.tileCount).toBe(5);
        expect(stats.ntiles.status).toBe('OK');
        expect(stats.ntiles.slices).toHaveLength(d7.tiles.length);
        for (let i = 0; i < d7.tiles.length; i++) {
          const mine = stats.ntiles.slices[i];
          const theirs = d7.tiles[i];
          expect(mine?.rank).toBe(theirs?.rank);
          expect(mine?.loObserved).toBe(theirs?.loObserved);
          expect(mine?.hiObserved).toBe(theirs?.hiObserved);
          expect(mine?.count).toBe(theirs?.stat.n);
        }
      });

      it('paliers de puissance : mêmes paliers non vides, mêmes effectifs et médianes que buildPowerTiers (G14)', () => {
        const { batch, all, stats } = engineOf(rows);
        const d7 = new Map(buildPowerTiers(batch, all).map((t) => [t.tierIndex, t]));
        const mine = stats.powerTiers.tiers.filter((t) => t.listingCount > 0);
        expect(mine.length).toBe(d7.size);
        for (const tier of mine) {
          expect(d7.get(tier.tier)?.stat.n).toBe(tier.n);
          expect(d7.get(tier.tier)?.stat.median).toBe(tier.median);
          expect(d7.get(tier.tier)?.loKw).toBe(tier.lowerKw);
          // D7 affiche la borne haute INCLUSIVE (`upperKw − 1`) ; le moteur publie l'EXCLUSIVE.
          expect(d7.get(tier.tier)?.hiKw).toBe(tier.upperKw - 1);
        }
      });
    });
  }
});
