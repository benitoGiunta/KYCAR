/**
 * Revue D6 — item 3 : seuils d'effectif (4 paliers, `EX-SCR-33`/`ARB-17`) et `ADV-06`.
 * =================================================================================================
 * `ADV-06` (BLOQUANT, `ARB-17`) : à `n = 10` ou `n = 11`, `EX-SCR-33` promet une régression (jeton
 * ambre, statistiques réduites) que les seuils de M1 (`≥ 12`) et M2 (`≥ 30`) interdisent de calculer.
 * `ARB-17` a réglé cela en fixant `n = n_m(Σ)` (jamais `N`) et un quatrième palier — implémenté par
 * `thresholds.ts::effectifTier` et testé aux bornes exactes par le lot (`thresholds.test.ts`,
 * 0/1/3/4/5/9/11/12/29/30/1000).
 *
 * Ce fichier sonde deux choses au-delà de ce que le lot a déjà prouvé :
 *   (a) la borne manquante `n = 10` (entre les deux valeurs citées nommément par `ADV-06`) ;
 *   (b) si le palier `EX-SCR-33` (n=5..11 → « percentiles P5/P95 ... désactivés ») est réellement
 *       APPLIQUÉ à la fourchette centrale de la zone-modèle de l'écran A, qui EST un P5/P95.
 */
import { describe, expect, it } from 'vitest';

import type { MetricRange, ModelAggregate } from '../../../src/providers/DataProvider';
import type { Model } from '../../../src/types/entities';
import { effectifTier } from '../../../src/screens/market/thresholds';
import { buildModelZoneViewModel } from '../../../src/screens/market/view-model';

function range(partial: Partial<MetricRange> = {}): MetricRange {
  return { min: null, max: null, p05: null, p50: null, p95: null, n: 0, ...partial };
}
function modelAgg(partial: Partial<ModelAggregate> & { modelId: number }): ModelAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, ...partial };
}
const CORSA: Model = { makeId: 1, modelId: 50, label: 'Corsa', slug: 'corsa', bodyTypes: [], announcedCount: null };

describe("ADV-06 — bornes n=10 et n=11 : le palier 'reduite' ([5,11]) ne promet plus M1/M2", () => {
  it('n = 10 -> reduite (borne manquante du jeu de test du lot, mentionnée nommément par ADV-06)', () => {
    expect(effectifTier(10)).toBe('reduite');
  });
  it('n = 11 -> reduite, PAS sans-m2 : M1 (>=12) n’est donc jamais promise à n=11', () => {
    expect(effectifTier(11)).toBe('reduite');
  });
  it('n = 12 -> sans-m2 : la frontière exacte où M1 devient disponible (EX-DATA-86)', () => {
    expect(effectifTier(12)).toBe('sans-m2');
  });
});

describe(
  "R-D6-02 — EX-SCR-33 (n=5..11 → « percentiles P5/P95 ... désactivés »), CORRIGÉ (D-04 : EX-SCR-33 " +
    "prévaut sur EX-SCR-134) : `effectifTier` est désormais invoqué par `view-model.ts` dans les " +
    'trois fourchettes de la zone-modèle (`priceCentralRange`/`yearCentralRange`/`mileageCentralRange`).',
  () => {
    // D-32 : cette sonde était VERTE en documentant le défaut (elle anticipait elle-même, en
    // commentaire, l'inversion attendue « une fois l'arbitrage rendu »). D-04 ayant tranché en
    // faveur d'EX-SCR-33, les deux assertions qui figeaient l'ANCIEN comportement (P5/P95 affiché
    // sans condition, aucun jeton) sont remplacées par celles du comportement normatif : le
    // protocole d'écriture d'abord rouge puis vert a été suivi (`npx vitest run` sur ce fichier avant
    // la correction de `view-model.ts` → rouge ; après → vert, voir `reports/remediation/fix-
    // screens.md`).
    it("un modèle à n_price = 8 (palier 'reduite') masque désormais le P5-P95 numérique et porte le jeton ambre n = 8", () => {
      const agg = modelAgg({
        modelId: 50,
        listingCount: 8,
        price: range({ min: 9000, max: 15000, p05: 9500, p50: 12000, p95: 14500, n: 8 }),
      });
      const zone = buildModelZoneViewModel(agg, CORSA, 8, false);
      expect(effectifTier(agg.price.n)).toBe('reduite');
      expect(zone.price.available).toBe(false);
      expect(zone.price.lowSampleToken).toBe('n = 8');
    });

    it("le jeton ambre « n = <n> » existe désormais dans le modèle de vue pour le palier 'reduite' (EX-SCR-33 l'exige au titre de la statistique)", () => {
      const agg = modelAgg({ modelId: 50, listingCount: 8, price: range({ p05: 9500, p95: 14500, n: 8 }) });
      const zone = buildModelZoneViewModel(agg, CORSA, 8, false);
      expect(zone.price.lowSampleToken).toBe('n = 8');
    });
  },
);
