/**
 * KYCAR — Sonde de revue 2.10 · `sel` à DEUX AXES (ACC-06 ; EX-SCR-158, EX-SCR-202, EX-NAV-10bis)
 * =================================================================================================
 * Constat de recette `ACC-06` (`reports/ACCEPTANCE.md` §8) : un brossage 2D de « 262 annonces
 * sélectionnées » conduit à un écran D qui annonce « 280 lignes affichées sur 508 » — `sel` ne
 * portait que l'intervalle de PRIX, l'axe X du brossage était perdu.
 *
 * `EX-NAV-10bis` décrit pourtant `sel` comme « deux bornes PAR AXE, même format que `selx`/`sely` »
 * et `EX-SCR-158` veut l'écran D « restreint à la sélection ». Cette sonde éprouve donc le codec de
 * `sel` sur les deux axes, en aller-retour, et la restriction effective des lignes.
 *
 * Elle est déposée dans `tests/review/D7/` parce que le module éprouvé (`url-state.ts`,
 * `brush-model.ts`) appartient au lot D7 ; le contrat D5 (`UI_STATE_PARAMS`, `loadQuery`) n'est lu
 * qu'en confrontation, jamais modifié. Nom explicite : sonde D5-like hébergée en D7.
 */

import { describe, it, expect } from 'vitest';
import {
  readDistributionUiState,
  writeDistributionUiState,
  readListingsSel,
  selMatches,
  EMPTY_UI_STATE,
  type SelRestriction,
} from '../../../src/screens/distribution/url-state';
import { brushToSelRestriction, BRUSH_ACCESSOR_SCATTER } from '../../../src/screens/distribution/brush-model';
import type { ScatterPoint } from '../../../src/screens/distribution/scatter-model';
import { loadQuery } from '../../../src/state/corrections';
import { UI_STATE_PARAMS } from '../../../src/state/url-codec';

/** Points synthétiques minimaux : seuls `row`, `priceEur`, `year`, `regYearMonth`, `mileageKm`
 * sont lus par le brossage et par la restriction. */
function point(row: number, priceEur: number, regYearMonth: number, mileageKm: number): ScatterPoint {
  return {
    row,
    priceEur,
    year: Math.trunc(regYearMonth / 100),
    regYearMonth,
    mileageKm,
    powerKw: 0,
    fuelCategory: 0,
    sellerType: 0,
    country: 0,
    modelYear: 0,
    priceEvaluationCategory: null,
    outlierFlags: 0,
    deviationPct: null,
  } as unknown as ScatterPoint;
}

describe('2.10 · ACC-06 — `sel` porte les DEUX axes du brossage (EX-SCR-158/202, EX-NAV-10bis)', () => {
  it('R-2.10-06-01 — aller-retour canonique : prix seul, prix + immatriculation, prix + km, les trois', () => {
    const priceOnly: SelRestriction = { from: 5450, to: 16300 };
    const withReg: SelRestriction = { from: 5450, to: 16300, axes: [{ metric: 'reg', from: 201301, to: 201812 }] };
    const withKm: SelRestriction = { from: 5450, to: 16300, axes: [{ metric: 'km', from: 12000, to: 98000 }] };
    const withBoth: SelRestriction = {
      from: 5450,
      to: 16300,
      axes: [
        { metric: 'reg', from: 201301, to: 201812 },
        { metric: 'km', from: 12000, to: 98000 },
      ],
    };

    for (const sel of [priceOnly, withReg, withKm, withBoth]) {
      const pairs = writeDistributionUiState({ ...EMPTY_UI_STATE, sel });
      const params = new URLSearchParams(pairs as [string, string][]);
      expect(readDistributionUiState(params).sel).toEqual(sel);
      expect(readListingsSel(params)).toEqual(sel);
    }

    // Forme canonique : un seul paramètre `sel`, axes en ordre fixe, sans caractère à échapper
    // (RFC 3986 « unreserved »).
    const raw = writeDistributionUiState({ ...EMPTY_UI_STATE, sel: withBoth })[0] as readonly [string, string];
    expect(raw[0]).toBe('sel');
    expect(raw[1]).toBe('5450-16300_r201301-201812_k12000-98000');
    expect(encodeURIComponent(raw[1])).toBe(raw[1]);
  });

  it('R-2.10-06-02 — compatibilité : `sel=<lo>-<hi>` (forme d’avant 2.10) reste lue comme un prix seul', () => {
    const loaded = loadQuery('sel=5450-16300');
    expect(loaded.corrections).toHaveLength(0);
    expect(UI_STATE_PARAMS.map((p) => p.param)).toContain('sel');
    const sel = readListingsSel(new URLSearchParams('sel=5450-16300'));
    expect(sel).toEqual({ from: 5450, to: 16300 });
    // Et une valeur illisible reste ignorée plutôt que bloquante.
    expect(readListingsSel(new URLSearchParams('sel=abc'))).toBeNull();
    expect(readListingsSel(new URLSearchParams('sel=5450-16300_z1-2'))).toEqual({ from: 5450, to: 16300 });
  });

  it('R-2.10-06-03 — un brossage 2D produit une restriction qui rend EXACTEMENT les lignes brossées', () => {
    // Cinq annonces : deux dans le rectangle brossé, trois hors — dont une que le nuage ne trace pas
    // (kilométrage à la sentinelle `NUMERIC_UNKNOWN`) mais dont le prix et l'année sont dans le
    // rectangle : c'est exactement la ligne de trop mesurée au rendu (684 pour 674 brossées).
    const points = [
      point(0, 8000, 201506, 90000),
      point(1, 9000, 201606, 80000),
      point(2, 8500, 202006, 40000), // prix DANS l'intervalle, année HORS du rectangle
      point(3, 20000, 201506, 30000), // année dans le rectangle, prix hors
    ];
    const brushX = { from: 201400, to: 201700 }; // axe X de G4b = `regYearMonth`
    const brushY = { from: 7000, to: 10000 }; // axe Y de G4b = prix
    const selected = new Set<number>();
    for (const p of points) {
      const x = BRUSH_ACCESSOR_SCATTER.x(p);
      const y = BRUSH_ACCESSOR_SCATTER.y(p);
      if (x >= brushX.from && x <= brushX.to && y >= brushY.from && y <= brushY.to) selected.add(p.row);
    }
    expect([...selected].sort()).toEqual([0, 1]);

    const sel = brushToSelRestriction(points, selected);
    expect(sel).not.toBeNull();
    expect(sel?.axes?.map((a) => a.metric)).toEqual(['reg', 'km']);

    // La restriction appliquée aux points tracés ne retient que les lignes brossées (ACC-06) …
    const kept = points.filter((p) => selMatches(sel, p.priceEur, p.regYearMonth, p.mileageKm)).map((p) => p.row);
    expect(kept).toEqual([0, 1]);
    // … et écarte l'annonce NON TRACÉE dont la métrique manquante porte la sentinelle `-1`.
    expect(selMatches(sel, 8500, 201512, -1)).toBe(false);
  });

  it('R-2.10-06-04 — la boîte englobante est toujours satisfaite par les lignes brossées', () => {
    const points = [point(0, 8000, 201506, 90000), point(1, 9000, 201606, 80000)];
    const sel = brushToSelRestriction(points, new Set([0, 1]));
    expect(sel).toEqual({
      from: 8000,
      to: 9000,
      axes: [
        { metric: 'reg', from: 201506, to: 201606 },
        { metric: 'km', from: 80000, to: 90000 },
      ],
    });
    for (const p of points) expect(selMatches(sel, p.priceEur, p.regYearMonth, p.mileageKm)).toBe(true);
  });

  it('R-2.10-06-05 — sélection vide : aucune restriction n’est fabriquée', () => {
    expect(brushToSelRestriction([point(0, 8000, 201506, 90000)], new Set())).toBeNull();
    expect(selMatches(null, 1, 2, 3)).toBe(true);
  });
});
