/**
 * Sonde de revue D5 — scission T/R de l'état de filtres (`EX-SRCH-9bis`/`ter`/`quinquies`,
 * ARCHITECTURE §5.1) et dépendances entre filtres (`EX-SCR-73`, `EX-SCR-88`(a)).
 */
import { describe, expect, it } from 'vitest';

import {
  FILTER_BY_ID,
  FILTER_DEFS,
  isDependencySatisfied,
  resolveFilterClass,
  tFilterIds,
} from '../../../src/state/filter-registry';
import type { SelectionState } from '../../../src/state/filter-types';
import { localDatasetKeyFor, partitionSelection, splitSelection } from '../../../src/state/tr-split';
import { FILTER_DEFAULTS } from '../../../src/state/filter-registry';
import { serializeQuery } from '../../../src/state/url-codec';

const OPTS = { filterDefaults: FILTER_DEFAULTS } as const;

describe('D5 — EX-SRCH-9bis : la scission T/R suit le registre', () => {
  it('les deux composantes sont disjointes et exhaustives, pour les deux modes', () => {
    const selection: SelectionState = {
      priceFrom: 5_000,
      fuelType: ['B'],
      gearType: ['A'],
      bodyType: ['4'],
      equipment: ['5'],
      sellerType: 'P',
    };
    for (const mode of ['mode1', 'mode2'] as const) {
      const { t, r } = partitionSelection(selection, mode);
      expect([...Object.keys(t), ...Object.keys(r)].sort()).toEqual(Object.keys(selection).sort());
      expect(Object.keys(t).filter((id) => id in r)).toEqual([]);
      for (const id of Object.keys(t)) {
        const def = FILTER_BY_ID.get(id);
        expect(def === undefined ? '?' : resolveFilterClass(def, mode)).toBe('T');
      }
      for (const id of Object.keys(r)) {
        const def = FILTER_BY_ID.get(id);
        expect(def === undefined ? '?' : resolveFilterClass(def, mode)).toBe('R');
      }
    }
  });

  it('EX-SCR-82 #44 — `body` est R en mode 1 et T en mode 2, et lui seul est dynamique', () => {
    expect(tFilterIds('mode1').has('bodyType')).toBe(false);
    expect(tFilterIds('mode2').has('bodyType')).toBe(true);
    const dynamic = FILTER_DEFS.filter((d) => d.cls === 'DYNAMIC_BODY').map((d) => d.param);
    expect(dynamic).toEqual(['body']);
    const only = [...tFilterIds('mode2')].filter((id) => !tFilterIds('mode1').has(id));
    expect(only).toEqual(['bodyType']);
  });

  it('`atype` n’entre dans aucune composante (valeur injectée, EX-SRCH-18bis)', () => {
    expect(tFilterIds('mode1').has('articleType')).toBe(false);
    expect(tFilterIds('mode2').has('articleType')).toBe(false);
  });

  it('EX-SRCH-9ter — un changement R ne change ni la localDatasetKey ni la partie T de l’URL', () => {
    const base: SelectionState = { gearType: ['A'], priceFrom: 5_000 };
    const withR: SelectionState = { ...base, sellerType: 'P', priceTo: 25_000 };
    expect(localDatasetKeyFor(withR, 'mode1')).toBe(localDatasetKeyFor(base, 'mode1'));

    const tPartOf = (s: SelectionState): string =>
      serializeQuery(partitionSelection(s, 'mode1').t, {}, OPTS);
    expect(tPartOf(withR)).toBe(tPartOf(base));
    expect(tPartOf(base)).toBe('gear=A');

    // ...et un changement T, lui, la change.
    const withT: SelectionState = { ...base, equipment: ['5'] };
    expect(localDatasetKeyFor(withT, 'mode1')).not.toBe(localDatasetKeyFor(base, 'mode1'));
  });

  it('EX-SRCH-9ter — la composante T vide a pour clé la chaîne réservée FULL', () => {
    expect(localDatasetKeyFor({ priceFrom: 5_000 }, 'mode1')).toBe('FULL');
    expect(splitSelection({}, 'mode1').selectionHash).toBe('FULL:EMPTY');
  });

  it('EX-NAV-8 — un défaut explicite et son absence produisent le même selectionHash', () => {
    expect(splitSelection({ powerType: 'kw', priceFrom: 5_000 }, 'mode1').selectionHash).toBe(
      splitSelection({ priceFrom: 5_000 }, 'mode1').selectionHash,
    );
  });
});

describe('D5 — EX-SCR-73 : dépendances entre filtres', () => {
  it('les 9 filtres de leasing sont inactionnables tant que `hasleasing` n’est pas posé', () => {
    const children = FILTER_DEFS.filter((d) => d.dependencies.includes('hasLeasing'));
    expect(children).toHaveLength(9);
    for (const child of children) {
      expect(isDependencySatisfied(child, {})).toBe(false);
      expect(isDependencySatisfied(child, { hasLeasing: '1' })).toBe(true);
    }
  });

  it('`bot`/`erfrom`/`erto` exigent un carburant électrique (2, 3 ou E), pas n’importe quel `fuel`', () => {
    for (const id of ['batteryOwnershipType', 'electricRangeFrom', 'electricRangeTo']) {
      const def = FILTER_BY_ID.get(id);
      expect(def).toBeDefined();
      if (def === undefined) continue;
      expect(isDependencySatisfied(def, { fuelType: ['B'] })).toBe(false);
      expect(isDependencySatisfied(def, { fuelType: ['E'] })).toBe(true);
      expect(isDependencySatisfied(def, { fuelType: ['2'] })).toBe(true);
    }
  });
});

describe('R-D5-08 — `powerfrom`/`powerto` : désactivés par défaut alors qu’EX-SCR-73 l’interdit', () => {
  it('R-D5-08 — EX-SCR-73 dit `powertype` « toujours posé, donc jamais désactivé »', () => {
    for (const id of ['powerFrom', 'powerTo']) {
      const def = FILTER_BY_ID.get(id);
      expect(def).toBeDefined();
      if (def === undefined) continue;
      // Sélection vide = état de départ légitime (`EX-SRCH-25`) : le contrôle Puissance doit
      // néanmoins être actionnable, `powertype` ayant une valeur par défaut relevée (`kw`).
      expect(isDependencySatisfied(def, {})).toBe(true);
    }
  });
});

describe('R-D5-17 — EX-SCR-73 : le retrait d’un parent laisse ses enfants dans l’URL', () => {
  it('R-D5-17 — sans `hasleasing`, les bornes de leasing restent sérialisées et appliquées', () => {
    const orphan: SelectionState = { leasingRateFrom: 200, leasingRateTo: 500 };
    const query = serializeQuery(orphan, {}, OPTS);
    // Contrôle désactivé (dépendance non satisfaite) mais valeur toujours dans l'URL : l'état
    // porte un prédicat que l'utilisateur ne peut plus ni voir ni retirer par son contrôle.
    expect(isDependencySatisfied(FILTER_BY_ID.get('leasingRateFrom')!, orphan)).toBe(false);
    expect(query).toBe('');
  });
});
