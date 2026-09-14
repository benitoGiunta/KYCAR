/**
 * Sonde de revue D5 — `EX-SRCH-14` (`D8-31` ; `REMEDIATION-2.8.md` §7.1 point 2 : « les deux sondes
 * à écrire en 2.8 n'ont pas été écrites », `grep -rn 'EX-SRCH-14' tests/` → 0)
 * =================================================================================================
 * `draft-behaviour.md` §B.3, `EX-SRCH-14` : « Changer de marque en mode 2 (via un sélecteur, hors
 * clic sur zone-modèle) **vide** le modèle : il n'existe aucune garantie qu'un `modelId` reste
 * valide pour une nouvelle marque. L'utilisateur revient à un état "marque choisie, modèle à
 * choisir", concrètement une redirection vers `/marche` avec `mmmv=<makeId>|||` posé à la nouvelle
 * marque. »
 *
 * ÉTAT AVANT CORRECTION (établi, pas supposé) : le seul sélecteur de marque atteignable en mode 2
 * est le contrôle `Marque / Modèle` de la ligne primaire du bandeau (`EX-SCR-103` : « sur l'écran B
 * il affiche le couple courant et, au clic, ouvre le sélecteur G positionné sur ce couple »), dont
 * `ScreenG#onApply(mmmv)` retombe dans `FilterBand#handleChange` → `applyToSelection` →
 * `assembleUrl(props.originAndPath, …)`. `originAndPath` étant le chemin de l'écran B, appliquer
 * une NOUVELLE marque produisait `/marche/54-opel/1918-corsa?mmmv=74` : la route restait sur
 * l'ancien couple et un `mmmv` orphelin s'ajoutait — ni redirection, ni modèle vidé.
 *
 * `<makeId>|||` et `<makeId>` sont la MÊME valeur au sens de la grammaire `mmmv`
 * (`make|model|modelLine|version`, blocs de queue vides) : `parseMmmvBlock` le prouve ci-dessous,
 * et la forme CANONIQUE retenue par le dépôt est la forme courte (`screen-g-model.ts#serializeMmmv`,
 * `router.ts#carryFiltersAcrossMode`, `D-09`). La sonde éprouve la SÉMANTIQUE (« la nouvelle marque,
 * aucun modèle ») sur les deux écritures, pas une écriture particulière.
 */
import { describe, expect, it } from 'vitest';

import { loadQuery } from '../../../src/state/corrections';
import { FILTER_DEFAULTS } from '../../../src/state/filter-registry';
import type { SelectionState } from '../../../src/state/filter-types';
import { parseMmmvBlock, resolveMakeChange } from '../../../src/state/navigation';
import { assembleUrl, serializeQuery } from '../../../src/state/url-codec';

/** Filtres partagés posés avant le changement de marque — ils doivent TOUS survivre. */
const OTHER_FILTERS: SelectionState = { priceTo: 20000, fuelType: ['B', 'D'], mileageTo: 120000 };

describe('R-D5-2.8-03 — `parseMmmvBlock` : la grammaire `mmmv` et ses blocs de queue vides', () => {
  it('`74` = marque seule', () => {
    expect(parseMmmvBlock('74')).toEqual({ makeId: 74 });
  });
  it('`74|||` = la MÊME marque seule (blocs modèle/ligne/version vides)', () => {
    expect(parseMmmvBlock('74|||')).toEqual({ makeId: 74 });
  });
  it('`74|2084` = couple complet', () => {
    expect(parseMmmvBlock('74|2084')).toEqual({ makeId: 74, modelId: 2084 });
  });
  it('valeur vide, non numérique ou multi-blocs = aucun couple exploitable', () => {
    expect(parseMmmvBlock('')).toBeNull();
    expect(parseMmmvBlock('abc')).toBeNull();
    expect(parseMmmvBlock(['74', '54'])).toBeNull();
    expect(parseMmmvBlock(undefined)).toBeNull();
  });
});

describe('R-D5-2.8-04 — EX-SRCH-14 : changer de marque en mode 2 vide le modèle et redirige', () => {
  it('nouvelle marque ≠ marque de la route → redirection `/marche`, `mmmv` à la SEULE nouvelle marque', () => {
    const out = resolveMakeChange({
      mode: 'mode2',
      selection: OTHER_FILTERS,
      routePair: { makeId: 54, modelId: 1918 },
      chosen: { makeId: 74 },
    });
    expect(out.kind).toBe('redirectToMarket');
    if (out.kind !== 'redirectToMarket') return;
    expect(out.path).toBe('/marche');
    // Sémantique exigée : la NOUVELLE marque, AUCUN modèle (`<makeId>|||` ≡ `<makeId>`).
    expect(parseMmmvBlock(out.selection['makesModelsVariants'])).toEqual({ makeId: 74 });
  });

  it('les autres filtres posés sont TOUS conservés par la redirection', () => {
    const out = resolveMakeChange({
      mode: 'mode2',
      selection: OTHER_FILTERS,
      routePair: { makeId: 54, modelId: 1918 },
      chosen: { makeId: 74 },
    });
    expect(out.selection['priceTo']).toBe(20000);
    expect(out.selection['fuelType']).toEqual(['B', 'D']);
    expect(out.selection['mileageTo']).toBe(120000);
  });

  it('l’URL produite est CANONIQUE : rechargée, elle ne déclenche aucune correction `EX-NAV-21`', () => {
    const out = resolveMakeChange({
      mode: 'mode2',
      selection: OTHER_FILTERS,
      routePair: { makeId: 54, modelId: 1918 },
      chosen: { makeId: 74 },
    });
    const url = assembleUrl(
      out.kind === 'redirectToMarket' ? out.path : '/marche',
      serializeQuery(out.selection, {}, { filterDefaults: FILTER_DEFAULTS }),
    ).url;
    const search = url.slice(url.indexOf('?'));
    const reloaded = loadQuery(search);
    expect(reloaded.corrections).toEqual([]);
    expect(parseMmmvBlock(reloaded.selection['makesModelsVariants'])).toEqual({ makeId: 74 });
    expect(reloaded.selection['priceTo']).toBe(20000);
  });

  it('MÊME marque que la route, sans modèle choisi → rien ne change (aucune redirection)', () => {
    const out = resolveMakeChange({
      mode: 'mode2',
      selection: OTHER_FILTERS,
      routePair: { makeId: 54, modelId: 1918 },
      chosen: { makeId: 54 },
    });
    expect(out.kind).toBe('unchanged');
    expect(out.selection).toEqual(OTHER_FILTERS);
  });

  it('un couple COMPLET choisi en mode 2 est une désignation de modèle, pas un changement de marque', () => {
    const out = resolveMakeChange({
      mode: 'mode2',
      selection: OTHER_FILTERS,
      routePair: { makeId: 54, modelId: 1918 },
      chosen: { makeId: 74, modelId: 2084 },
    });
    expect(out.kind).toBe('goToModel');
    if (out.kind !== 'goToModel') return;
    expect(out.pair).toEqual({ makeId: 74, modelId: 2084 });
    // `EX-NAV-15` : le bloc taxonomique est ABSORBÉ par la route, jamais laissé dans la requête.
    expect(out.selection['makesModelsVariants']).toBeUndefined();
    expect(out.selection['priceTo']).toBe(20000);
  });
});

describe('R-D5-2.8-05 — EX-SRCH-14 : en mode 1, un changement de marque reste un simple filtre', () => {
  it('mode 1 → mise à jour de `mmmv`, aucune redirection', () => {
    const out = resolveMakeChange({
      mode: 'mode1',
      selection: { ...OTHER_FILTERS, makesModelsVariants: '54' },
      chosen: { makeId: 74 },
    });
    expect(out.kind).toBe('filter');
    expect(parseMmmvBlock(out.selection['makesModelsVariants'])).toEqual({ makeId: 74 });
    expect(out.selection['priceTo']).toBe(20000);
  });

  it('mode 1, couple complet → `mmmv` complet (la redirection vers B est le fait de la coquille, D8-04b)', () => {
    const out = resolveMakeChange({
      mode: 'mode1',
      selection: {},
      chosen: { makeId: 74, modelId: 2084 },
    });
    expect(out.kind).toBe('filter');
    expect(parseMmmvBlock(out.selection['makesModelsVariants'])).toEqual({ makeId: 74, modelId: 2084 });
  });

  it('mode 2 sans couple de route connu : la règle d’`EX-SRCH-14` s’applique quand même', () => {
    // En mode 2 la marque courante n'est portée QUE par la route (`carryFiltersAcrossMode` retire
    // `mmmv` de la sélection à l'entrée) : sans `routePair`, on ne peut pas conclure « même marque »,
    // et l'exigence demande alors de vider le modèle plutôt que de laisser un `mmmv` orphelin.
    const out = resolveMakeChange({ mode: 'mode2', selection: OTHER_FILTERS, chosen: { makeId: 74 } });
    expect(out.kind).toBe('redirectToMarket');
    expect(parseMmmvBlock(out.selection['makesModelsVariants'])).toEqual({ makeId: 74 });
  });
});
