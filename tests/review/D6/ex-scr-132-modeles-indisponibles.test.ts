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
  // D8-10 : `modelCount` devient un champ OBLIGATOIRE de `MakeAggregate` (valeur neutre `null`).
  return { makeId: 1, listingCount: 0, price: range(), mileage: range(), year: range(), sampleCoverage: null, modelCount: null, ...partial };
}
const VW: Make = { makeId: 1, label: 'Volkswagen', slug: 'volkswagen', announcedCount: null };

describe("R-D6-07 — EX-SCR-132 (DR-011, CORRIGÉ) : quand le détail par modèle échoue, le résumé de marque n'affiche plus « 0 modèles » à côté d'une médiane RÉELLE et non nulle", () => {
  // D-32 : cette sonde était VERTE en documentant le défaut (« 0 modèles · médiane 18 900 € », une
  // contradiction interne). Conformément au protocole (écrire la sonde d'échec, la voir rouge,
  // corriger, la voir verte), les deux assertions qui figeaient le comportement fautif sont
  // remplacées par les assertions du comportement corrigé (`view-model.ts::buildMakeCardViewModel`,
  // DR-011) — la médiane réellement connue reste publiée, mais plus aux côtés d'un « 0 modèles »
  // trompeur.
  it(
    "l'agrégat de MARQUE (agg.price.p50) a réussi (12 480 offres, médiane 18 900 €) alors que le " +
      "détail des modèles a échoué (`modelAggregates: 'unavailable'`) : le résumé ne prétend plus " +
      '« 0 modèles » — il indique explicitement l’indisponibilité du détail, sans perdre la médiane ' +
      'réellement calculée.',
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
      // D8-02/D8-19 (FV-02) : `modelCount` vient désormais de `agg.modelCount` (D8-10), jamais d'un
      // comptage sur `modelAggregates` — le fixture ci-dessus ne le renseigne pas (`makeAgg()` pose
      // `modelCount: null`), donc la valeur attendue passe de `0` (ancien comptage local, toujours
      // nul quand `modelAggregates === 'unavailable'`) à `null` (non calculé, jamais un 0 par défaut).
      expect(card.modelCount).toBeNull();
      // Corrigé (DR-011) : plus jamais « 0 modèles » à côté d'une médiane non nulle — la ligne dit
      // l'indisponibilité du détail, jamais un cardinal zéro trompeur.
      expect(card.medianPriceLine).not.toContain('0 modèles');
      expect(card.medianPriceLine).toMatch(/indisponible/i);
      expect(card.medianPriceLine).toContain('médiane');
      expect(card.medianPriceLine).toMatch(/médiane 18.900.€/); // "." tolère l'espace fine insécable U+202F
    },
  );
});
