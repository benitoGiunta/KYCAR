/**
 * KYCAR — Sondes transverses `patho` : SOLLICITATION (revue 2.5)
 * =================================================================================================
 * Rejeu des attaques par la SOLLICITATION d'`ST-adversarial.md` :
 *   - ADV-10 → `ARB-56` : les 77 filtres retenus posés simultanément vs le plafond de 2 000 caractères.
 *   - ADV-11 → `REJET-01` : `eq` à ses 136 valeurs sous sémantique ET (conservé comme preuve de risque).
 *   - ADV-12 → `ARB-57` : 20 changements de filtre de classe `R` en 1 s, via le contrôleur réel.
 *   - ADV-01 → `ARB-12` : lien tronqué par une messagerie, et la contre-mesure `EX-SCR-176`.
 */

import { describe, expect, it, vi } from 'vitest';

import { FILTER_DEFS } from '../../../src/state/filter-registry';
import type { FilterDef, MutableSelectionState } from '../../../src/state/filter-types';
import {
  assembleUrl,
  MAX_URL_LENGTH,
  serializeQuery,
  URL_BUDGET_EXCEEDED_MESSAGE,
  wouldExceedBudget,
} from '../../../src/state/url-codec';
import { loadQuery } from '../../../src/state/corrections';
import { buildActiveFilterTokens } from '../../../src/components/filters/labels';
import { InteractionController } from '../../../src/state/interaction';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';
import { loadRealReferenceData } from '../../../src/providers/tweedehands/testFixtures';

const ORIGIN = 'https://kycar.app/marche';

/** Premier code d'option DIFFÉRENT de la valeur par défaut du filtre (`EX-NAV-8` omet les défauts). */
function firstNonDefaultCode(def: FilterDef): string | undefined {
  const def0 = def.defaultValue === undefined ? undefined : String(def.defaultValue);
  return def.options?.find((o) => o.code !== def0)?.code;
}

/** Valeur non-défaut PLAUSIBLE pour un filtre donné (`ARB-56` : « une valeur non défaut plausible »). */
function plausibleValue(def: FilterDef): string | number | readonly string[] | undefined {
  switch (def.scopeType) {
    case 'enum_single':
      return firstNonDefaultCode(def);
    case 'enum_multi': {
      const code = firstNonDefaultCode(def);
      return code === undefined ? undefined : [code];
    }
    case 'boolean':
      return def.booleanTrueCode ?? '1';
    case 'range_min':
    case 'number': {
      const v = def.numericDomain?.steps?.[1] ?? def.numericDomain?.min ?? 1000;
      return def.defaultValue === v ? v + 1 : v;
    }
    case 'range_max':
      return def.numericDomain?.max ?? def.numericDomain?.steps?.slice(-1)[0] ?? 250000;
    case 'text':
    case 'geo_text':
      return 'sport';
    case 'structured_multi':
      return '54|1918';
  }
}

/** Sélection couvrant TOUS les filtres exposés du registre, chacun à une valeur non-défaut. */
function fullSelection(): MutableSelectionState {
  const selection: MutableSelectionState = {};
  for (const def of FILTER_DEFS) {
    if (def.cls === 'D' || def.nonExposed) continue;
    const v = plausibleValue(def);
    if (v !== undefined) selection[def.id] = v as never;
  }
  return selection;
}

describe('patho — sollicitation par les filtres (ADV-10 / ARB-56)', () => {
  it('SOL-77 — les 77 filtres retenus, chacun à une valeur plausible, tiennent sous 2 000 caractères', () => {
    const selection = fullSelection();
    const query = serializeQuery(selection, {});
    const url = assembleUrl(ORIGIN, query);

    // `ARB-56` : « les 77 filtres retenus posés chacun à une valeur non défaut plausible occupent
    // ≈ 1 720 caractères, `eq` large compris ; la marge est donc réelle mais non infinie. » Le
    // périmètre du registre a rétréci depuis (65 filtres exposés posables) : `D-14` (R3) retire
    // `location`/`lat`/`lon` (−3), `DR-052`/`EX-SRCH-18bis` marquent `nonExposed` `powerType`,
    // `hadAccident`, `countryType` (−3, valeurs injectées vers la source), `D-12`/`DR-066`
    // marquent `nonExposed` `page`/`pageSize` (−2, paramètres d'état d'interface). Le budget de
    // 2 000 caractères n'est qu'ENCORE PLUS confortablement respecté (moins de paramètres à
    // sérialiser) — c'est ce que ce test vérifie, le seuil bas suit le nouveau périmètre réel.
    expect(Object.keys(selection).length).toBeGreaterThanOrEqual(60);
    expect(url.withinBudget).toBe(true);
    expect(url.length).toBeLessThan(MAX_URL_LENGTH);
    // Aucune troncature : l'URL contient bien un paramètre par filtre posé.
    expect(query.split('&').length).toBe(Object.keys(selection).length);
  });

  it('SOL-77-LARGE — même TOUS les filtres énumérés à leur largeur maximale ne dépassent pas 2 000 caractères', () => {
    const selection = fullSelection();
    for (const def of FILTER_DEFS) {
      if (def.scopeType !== 'enum_multi' || def.options === undefined) continue;
      selection[def.id] = def.options.map((o) => o.code) as never;
    }
    const url = assembleUrl(ORIGIN, serializeQuery(selection, {}));
    // Mesure de référence de cette revue (à confronter au « ≈ 1 720 » d'`ARB-56`) : le pire cas
    // ÉNUMÉRABLE du registre reste sous le plafond. Le dépassement n'est atteignable que par les
    // champs libres / structurés (`kwd`, `mmmv`), traité par la sonde suivante.
    expect(url.length).toBeLessThan(MAX_URL_LENGTH);
    expect(url.length).toBeGreaterThan(1400);
    expect(url.withinBudget).toBe(true);
  });

  it('SOL-REFUS — au-delà du plafond, EX-NAV-11 refuse avec son message, sans troncature (ARB-56)', () => {
    const selection = fullSelection();
    for (const def of FILTER_DEFS) {
      if (def.scopeType !== 'enum_multi' || def.options === undefined) continue;
      selection[def.id] = def.options.map((o) => o.code) as never;
    }
    // Un état de filtres réellement atteignable : une sélection marque/modèle/version large.
    selection.makesModelsVariants = Array.from({ length: 100 }, (_v, i) => `54|${1900 + i}`).join(',');

    expect(wouldExceedBudget(ORIGIN, selection, {})).toBe(true);
    expect(URL_BUDGET_EXCEEDED_MESSAGE).toBe(
      "limite d'URL atteinte, retirez un filtre pour en ajouter un autre",
    );
    // Aucune troncature silencieuse : la sérialisation reste complète, c'est l'appelant qui refuse.
    const query = serializeQuery(selection, {});
    expect(query).toContain('eq=');
    expect(query).toContain('mmmv=');
  });

  it('SOL-EQ-136 — `eq` à 136 valeurs : sérialisation complète, sémantique ET signalée (REJET-01)', () => {
    const eq = FILTER_DEFS.find((d) => d.id === 'equipment');
    expect(eq?.options).toHaveLength(136);
    expect(eq?.semanticsWarning).toBe('EQ_AND_PRESUMED'); // l'avertissement d'A-03 est porté par le registre

    const query = serializeQuery({ equipment: eq!.options!.map((o) => o.code) }, {});
    expect(query.startsWith('eq=')).toBe(true);
    expect(query.split(',').length).toBe(136); // aucune valeur perdue
  });

  it('R-PATHO-12 — un filtre de classe T non pris en charge est ignoré SILENCIEUSEMENT : l’effectif affiché est celui du non-filtré', async () => {
    // `src/providers/synthetic/selection.ts` : « Un filtre non reconnu est IGNORÉ (aucune contrainte
    // ajoutée) et remonté dans `unsupported` » — mais `unsupported` n'est consommé par aucun
    // appelant. L'écran affiche donc `<n> offres` pour une sélection qui n'a pas été appliquée.
    const provider = new SyntheticDataProvider({
      referenceData: loadRealReferenceData(),
      listingCount: 3000,
      seed: 11,
    });
    const handle = await provider.openSnapshot();
    const total = await provider.fetchSelectionCount(handle, 'FULL');
    const withEquipment = await provider.fetchSelectionCount(handle, 'equipment=abs,nav,xen');

    // ATTENDU : soit le filtre est appliqué (effectif strictement inférieur), soit l'application
    // sait qu'il ne l'est pas (`unsupported` remonté à l'UI). Ni l'un ni l'autre n'est le cas.
    expect(withEquipment).toBeLessThan(total);
  });
});

describe('patho — rafale de filtres R (ADV-12 / ARB-57)', () => {
  it('SOL-RAFALE-20HZ — 20 changements en 1 s : au plus un recalcul en attente, jamais de file', () => {
    vi.useFakeTimers();
    try {
      let recomputes = 0;
      let reloads = 0;
      const urls: string[] = [];
      const controller = new InteractionController({
        replaceState: (u) => urls.push(u),
        pushState: (u) => urls.push(u),
        recomputeLocal: () => {
          recomputes += 1;
        },
        reload: () => {
          reloads += 1;
        },
      });

      // 20 changements de classe `R` à 50 ms d'intervalle (20 Hz pendant 1 s).
      for (let i = 0; i < 20; i += 1) {
        controller.scheduleChange({
          filterId: 'sellerType',
          gesture: 'discrete-change',
          control: 'radio-segmented',
          cls: 'R',
          commit: () => `${ORIGIN}?custtype=${i % 2 === 0 ? 'D' : 'P'}`,
        });
        vi.advanceTimersByTime(50);
      }

      // `EX-SRCH-1bis`/`ARB-57` : sous le seuil (2 premiers), recalcul immédiat ; ensuite mode groupé
      // avec AU PLUS un recalcul en attente — donc très loin des 20 recalculs empilés d'ADV-12.
      expect(recomputes).toBeLessThanOrEqual(4);
      expect(reloads).toBe(0);
      expect(controller.hasPendingRecompute).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(recomputes).toBeLessThanOrEqual(5);
      expect(controller.hasPendingRecompute).toBe(false);
      controller.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it('SOL-RAFALE-HISTORIQUE — la rafale produit UNE entrée d’historique, pas vingt (EX-NAV-13)', () => {
    vi.useFakeTimers();
    try {
      const pushed: string[] = [];
      const replaced: string[] = [];
      const controller = new InteractionController({
        replaceState: (u) => replaced.push(u),
        pushState: (u) => pushed.push(u),
        recomputeLocal: () => undefined,
        reload: () => undefined,
      });
      for (let i = 0; i < 20; i += 1) {
        controller.scheduleChange({
          filterId: 'sellerType',
          gesture: 'discrete-change',
          control: 'radio-segmented',
          cls: 'R',
          commit: () => `${ORIGIN}?custtype=${i}`,
        });
        vi.advanceTimersByTime(50);
      }
      vi.advanceTimersByTime(1000);
      // `DR-015` : le premier changement de la rafale OUVRE l'entrée d'historique (`pushState`),
      // les 19 suivants la mettent à jour en place (`replaceState`) — un seul `pushState` pour
      // toute la rafale, cohérent avec l'intitulé du test (« pas vingt »). Avant la correction
      // c'était l'inverse (`replaceState` d'abord, `pushState` à l'expiration), ce qui écrasait
      // l'entrée PRÉCÉDANT la rafale au lieu de créer la sienne (`R-D5-05`, non modifiée).
      expect(replaced).toHaveLength(19);
      expect(pushed).toHaveLength(1); // regroupement 800 ms
      controller.dispose();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('patho — lien tronqué par une messagerie (ADV-01 / ARB-12)', () => {
  it('SOL-TRONQUE — `pricefrom=5000` tronqué en `pricefrom=50` est accepté sans correction : limite déclarée', () => {
    const complet = loadQuery('pricefrom=5000&priceto=25000&fuel=B,D');
    expect(complet.corrections).toHaveLength(0);
    expect(complet.selection.priceFrom).toBe(5000);

    // (a) Troncature SOUS le domaine (`pricefrom=50`, domaine `[500, 100 000]`) : rattrapée par la
    // classe 2 d'`EX-NAV-21` — écrêtée ET signalée. Meilleur que ce qu'ADV-01 supposait.
    const sousDomaine = loadQuery('pricefrom=50');
    expect(sousDomaine.corrections.map((c) => c.kind)).toEqual(['NUMERIC_OUT_OF_DOMAIN']);
    expect(sousDomaine.selection.priceFrom).toBe(500);

    // (b) Troncature DANS le domaine (`priceto=25000` coupé en `2500`) : aucune règle ne s'applique,
    // aucun signalement — c'est exactement la limite qu'`ARB-12` déclare et n'entend pas corriger.
    const dansDomaine = loadQuery('pricefrom=5000&priceto=2500');
    expect(dansDomaine.corrections.map((c) => c.kind)).toEqual(['INVERTED_INTERVAL']);
    const dansDomaine2 = loadQuery('priceto=2500');
    expect(dansDomaine2.corrections).toHaveLength(0);
    expect(dansDomaine2.selection.priceTo).toBe(2500);
  });

  it('R-PATHO-13 — ARB-12 / EX-SCR-176 : le jeton d’un filtre actif n’affiche pas TOUJOURS son libellé', () => {
    // `ARB-12` fait de l'affichage du couple (libellé, valeur) la CONTRE-MESURE unique du lien
    // tronqué : « de sorte que l'utilisateur lise `Prix : à partir de 50 €` et non `Prix` ».
    // `EX-SCR-176` : « le jeton d'un filtre actif affiche TOUJOURS son libellé ET sa valeur ».
    const tokens = buildActiveFilterTokens({ priceFrom: 500, fuelType: ['B'] });
    const priceToken = tokens.find((t) => t.filterIds.includes('priceFrom'));
    const fuelToken = tokens.find((t) => t.filterIds.includes('fuelType'));

    expect(priceToken?.text).toContain('500'); // valeur : conforme
    expect(priceToken?.text).toContain('Prix'); // libellé : constaté absent (« ≥ 50 € »)
    expect(fuelToken?.text).toContain('Carburant'); // constaté : seul le libellé de la VALEUR
  });
});
