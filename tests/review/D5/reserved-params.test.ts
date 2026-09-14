/**
 * Revue D5 (remédiation 3.5, `fix-app-4`) — PARAMÈTRES RÉSERVÉS DE L'URL (`ACC-20`)
 * =================================================================================================
 * Constat de recette `ACC-20` (`reports/ACCEPTANCE.md` rev 3 §8) : toute URL portant `?provider=`
 * était réécrite SANS le paramètre par le correcteur d'URL (`EX-NAV-21` classe 5, « paramètre
 * inconnu ignoré ») alors même que la source demandée avait été appliquée par le registre
 * (`src/providers/registry.ts`, lu par `src/main.tsx` AVANT le routeur). Conséquences mesurées :
 * un `F5` ou la copie de l'URL après chargement revenaient à `fixture:test`, et le bandeau
 * `ET-URL-CORRIGEE` annonçait « ignoré » ce qui avait été appliqué — exactement ce que `D-03`
 * interdit.
 *
 * `DF-2` (PLAN-3) dit de `?provider=` : « le plus explicite, et **le seul qui se partage dans un
 * lien** ». Un paramètre qui ne survit pas à la première sérialisation d'URL ne se partage pas.
 *
 * Ces sondes verrouillent le CONTRAT DE CODEC (D5), indépendamment de la coquille :
 *   1. un paramètre RÉSERVÉ est reconnu — jamais classé « inconnu », jamais de correction émise ;
 *   2. il n'entre ni dans la sélection de filtres ni dans l'état d'interface (il n'est ni l'un ni
 *      l'autre : il est lu hors du routeur) ;
 *   3. il traverse un aller-retour `parse → serialize` SANS PERTE, y compris sa valeur `fixture:dev`
 *      (deux-points conservé lisible) et y compris quand elle est INCONNUE du registre — le repli
 *      de source est la décision du registre (`ET-SOURCE-REPLI`), pas une correction d'URL ;
 *   4. `carryReservedParams` reconduit le paramètre d'une URL à la suivante (choke point de
 *      navigation de la coquille) sans le dupliquer, sans toucher aux autres paramètres, et sans
 *      jamais reconduire un paramètre NON réservé (`zzzz=1` reste une correction `EX-NAV-21`).
 */
import { describe, expect, it } from 'vitest';

import { loadQuery } from '../../../src/state/corrections';
import {
  RESERVED_PARAMS,
  carryReservedParams,
  isReservedParam,
  reservedParamsOf,
  serializeQuery,
} from '../../../src/state/url-codec';
import { PROVIDER_URL_PARAM } from '../../../src/providers/registry';

describe('R-D5-ACC20-01 — `provider` est un paramètre RÉSERVÉ, jamais un filtre inconnu', () => {
  it('le nom du paramètre de bascule du registre figure dans la table des réservés', () => {
    expect(RESERVED_PARAMS).toContain(PROVIDER_URL_PARAM);
    expect(isReservedParam(PROVIDER_URL_PARAM)).toBe(true);
    expect(isReservedParam('zzzz')).toBe(false);
  });

  it('une URL portant `provider` ET un filtre ne produit AUCUNE correction (`EX-NAV-21` classe 5)', () => {
    const loaded = loadQuery('?priceto=20000&provider=synthetic');
    expect(loaded.corrections).toEqual([]);
    expect(loaded.selection).toEqual({ priceTo: 20000 });
    expect(loaded.reserved).toEqual({ provider: 'synthetic' });
    // Ni filtre ni état d'interface : le paramètre est lu par `main.tsx`, hors du routeur.
    expect(loaded.uiState['provider']).toBeUndefined();
  });

  it('une valeur INCONNUE du registre reste conservée, sans correction (le repli est dit par ET-SOURCE-REPLI)', () => {
    const loaded = loadQuery('?provider=carrosserie-de-mon-oncle');
    expect(loaded.corrections).toEqual([]);
    expect(loaded.reserved).toEqual({ provider: 'carrosserie-de-mon-oncle' });
  });

  it('un paramètre NON réservé et inconnu reste corrigé (la liste ne relâche pas EX-NAV-21)', () => {
    const loaded = loadQuery('?zzzz=1&priceto=20000');
    expect(loaded.corrections.map((c) => c.param)).toEqual(['zzzz']);
    expect(loaded.corrections[0]?.kind).toBe('UNKNOWN_PARAM');
  });
});

describe('R-D5-ACC20-02 — aller-retour `parse → serialize` sans perte', () => {
  it('la requête resérialisée porte encore le paramètre réservé, à sa place alphabétique (EX-NAV-9)', () => {
    const loaded = loadQuery('?priceto=20000&provider=synthetic');
    const q = serializeQuery(loaded.selection, {}, { reserved: loaded.reserved });
    expect(q).toBe('priceto=20000&provider=synthetic');
  });

  it('la valeur `fixture:dev` traverse le codec lisible (deux-points non ré-encodé)', () => {
    const loaded = loadQuery('?provider=fixture:dev&fregfrom=2017');
    expect(loaded.reserved).toEqual({ provider: 'fixture:dev' });
    const q = serializeQuery(loaded.selection, {}, { reserved: loaded.reserved });
    expect(q).toBe('fregfrom=2017&provider=fixture:dev');
    // Idempotence : relire la requête produite rend exactement le même état réservé.
    expect(loadQuery(`?${q}`).reserved).toEqual({ provider: 'fixture:dev' });
  });

  it('une valeur portant un caractère réservé d’URL est ré-encodée, jamais rendue ambiguë', () => {
    const loaded = loadQuery('?provider=a%26b%3Dc');
    expect(loaded.reserved).toEqual({ provider: 'a&b=c' });
    const q = serializeQuery(loaded.selection, {}, { reserved: loaded.reserved });
    expect(loadQuery(`?${q}`).reserved).toEqual({ provider: 'a&b=c' });
  });

  it('sans paramètre réservé, la requête sérialisée est INCHANGÉE (aucune régression de forme)', () => {
    const loaded = loadQuery('?priceto=20000');
    expect(loaded.reserved).toEqual({});
    expect(serializeQuery(loaded.selection, {}, { reserved: loaded.reserved })).toBe('priceto=20000');
  });
});

describe('R-D5-ACC20-03 — `carryReservedParams` reconduit la bascule d’une URL à la suivante', () => {
  it('relève les paramètres réservés d’une requête', () => {
    expect(reservedParamsOf('?priceto=20000&provider=synthetic')).toEqual({ provider: 'synthetic' });
    expect(reservedParamsOf('?priceto=20000')).toEqual({});
    expect(reservedParamsOf('')).toEqual({});
  });

  it('ajoute le paramètre réservé à une URL qui ne le porte pas, en respectant l’ordre EX-NAV-9', () => {
    expect(carryReservedParams('/marche?priceto=20000', '?provider=synthetic')).toBe(
      '/marche?priceto=20000&provider=synthetic',
    );
    expect(carryReservedParams('/marche', '?provider=synthetic')).toBe('/marche?provider=synthetic');
    expect(carryReservedParams('/marche/54-opel/1918-corsa?fregfrom=2017', '?provider=fixture:dev')).toBe(
      '/marche/54-opel/1918-corsa?fregfrom=2017&provider=fixture:dev',
    );
  });

  it('ne duplique jamais un paramètre déjà porté par l’URL cible (DR-051)', () => {
    expect(carryReservedParams('/marche?provider=synthetic', '?provider=fixture:dev')).toBe(
      '/marche?provider=synthetic',
    );
  });

  it('laisse l’URL cible mot pour mot quand la source ne porte aucun réservé (EX-SCR-140)', () => {
    const url = '/marche/54-opel/1918-corsa?fregfrom=2017&fregto=2017';
    expect(carryReservedParams(url, '?fregfrom=2017&fregto=2017')).toBe(url);
    expect(carryReservedParams(url, '')).toBe(url);
  });

  it('ne reconduit QUE les réservés — un paramètre inconnu reste corrigé par EX-NAV-21', () => {
    expect(carryReservedParams('/marche?priceto=20000', '?zzzz=1&provider=synthetic')).toBe(
      '/marche?priceto=20000&provider=synthetic',
    );
  });
});
