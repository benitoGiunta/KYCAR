/**
 * Revue D6 — constat complémentaire : `EX-SCR-132` (« résultat partiel par marque »).
 * =================================================================================================
 * `view-model.test.ts` (relancé) prouve déjà que `modelsUnavailable` vaut `true` et que
 * `modelZones` est vide quand `modelAggregates === 'unavailable'`. Ce fichier sonde ce que cet état
 * produit sur `medianPriceLine` — le texte du RÉSUMÉ DE MARQUE (`EX-SCR-109`), qui reste affiché tel
 * quel dans ce cas d'après `EX-SCR-132` (« la carte s'affiche avec son en-tête et son résumé »).
 */
import { describe, expect, it } from 'vitest';

import type { MakeAggregate, MetricRange } from '../../../src/providers/DataProvider';
import type { Make } from '../../../src/types/entities';
import { buildMakeCardViewModel } from '../../../src/screens/market/view-model';

function range(partial: Partial<MetricRange> = {}): MetricRange {
  return { min: null, max: null, p05: null, p50: null, p95: null, n: 0, ...partial };
}
function makeAgg(partial: Partial<MakeAggregate> = {}): MakeAggregate {
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, ...partial };
}
const VW: Make = { makeId: 1, label: 'Volkswagen', slug: 'volkswagen', announcedCount: null };

describe("R-D6-07 — EX-SCR-132 : quand le détail par modèle échoue, le résumé de marque affiche « 0 modèles » à côté d'une médiane RÉELLE et non nulle", () => {
  it(
    "l'agrégat de MARQUE (agg.price.p50) a réussi (12 480 offres, médiane 18 900 €) alors que le " +
      "détail des modèles a échoué (`modelAggregates: 'unavailable'`) : le résumé affiche pourtant " +
      "« 0 modèles · médiane 18 900 € », une contradiction interne qui FAUSSE la lecture (0 modèles " +
      'connus mais une médiane calculée sur 12 480 offres réparties dans des modèles).',
    () => {
      const agg = makeAgg({ makeId: 1, listingCount: 12480, price: range({ p50: 18900, n: 12480 }) });
      const card = buildMakeCardViewModel(agg, {
        make: VW,
        modelAggregates: 'unavailable',
        models: new Map(),
        hasUserFilters: false,
        hideSparseModels: false,
        isExpanded: false,
        modelsVisibleBeforeCollapse: 6,
      });
      expect(card.modelsUnavailable).toBe(true);
      expect(card.modelCount).toBe(0);
      // Constat : le texte contient bien un "0 modèles" ET une médiane numérique non nulle en même
      // temps — c'est la valeur affichée qui est fausse (contradictoire), pas seulement incomplète.
      expect(card.medianPriceLine).toContain('0 modèles');
      expect(card.medianPriceLine).toContain('médiane');
      expect(card.medianPriceLine).toMatch(/médiane 18.900.€/); // "." tolère l'espace fine insécable U+202F
    },
  );
});
