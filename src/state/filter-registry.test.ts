import { describe, expect, it } from 'vitest';
import filtersScope from '../../data/reference/filters-scope.json';
import {
  DISABLED_FILTER_IDS,
  FILTER_BY_ID,
  FILTER_BY_PARAM,
  FILTER_DEFS,
  GROUP_LABELS,
  GROUP_ORDER,
  PRIMARY_FILTER_DEFS,
  isDependencySatisfied,
  resolveFilterClass,
  tFilterIds,
} from './filter-registry';

/**
 * Test de complétude (critère de recette `EX-SCR-82`/`83`) : compare le registre de D5 à
 * `data/reference/filters-scope.json`, seule source normative des 77 identifiants/paramètres.
 */
describe('registre des filtres — complétude contre filters-scope.json', () => {
  const retenus = filtersScope.retenus as ReadonlyArray<{
    readonly id: string;
    readonly param: string;
    readonly label: string;
    readonly type: string;
    readonly dependencies: readonly string[];
  }>;

  it('porte exactement les 77 filtres retenus, ni plus ni moins', () => {
    expect(filtersScope.totalRetenus).toBe(77);
    expect(FILTER_DEFS.length).toBe(77);
    const scopeIds = new Set(retenus.map((r) => r.id));
    const defIds = new Set(FILTER_DEFS.map((d) => d.id));
    expect(defIds).toEqual(scopeIds);
  });

  it('reprend param/label/type à l’identique pour chacun des 77', () => {
    for (const r of retenus) {
      const d = FILTER_BY_ID.get(r.id);
      expect(d, `filtre manquant : ${r.id}`).toBeDefined();
      expect(d?.param).toBe(r.param);
      expect(d?.label).toBe(r.label);
      expect(d?.scopeType).toBe(r.type);
    }
  });

  it('résout les dépendances (paramètres) de filters-scope.json vers les mêmes filtres (par id)', () => {
    const paramToId = new Map(retenus.map((r) => [r.param, r.id]));
    for (const r of retenus) {
      if (r.dependencies.length === 0) continue;
      const d = FILTER_BY_ID.get(r.id);
      const expectedIds = r.dependencies.map((p) => paramToId.get(p) ?? p).sort();
      const actualIds = [...(d?.dependencies ?? [])].sort();
      expect(actualIds, `dépendances de ${r.id}`).toEqual(expectedIds);
    }
  });

  it('n’a aucun doublon de param ni d’id', () => {
    expect(FILTER_BY_PARAM.size).toBe(FILTER_DEFS.length);
    expect(FILTER_BY_ID.size).toBe(FILTER_DEFS.length);
  });

  it('a un groupe visuel connu et ordonné pour chaque filtre', () => {
    for (const d of FILTER_DEFS) {
      expect(GROUP_ORDER, `groupe inconnu pour ${d.id}: ${d.group}`).toContain(d.group);
      expect(GROUP_LABELS[d.group]).toBeDefined();
    }
  });
});

/**
 * Bilan arithmétique clos `EX-SCR-83` : 77 RETENU dont 76 EXPOSÉ (13 primaires en 9 contrôles,
 * 60 secondaires, 3 désactivés documentés) et 1 NON_EXPOSE (`atype`).
 */
describe('registre des filtres — bilan EX-SCR-83', () => {
  it('compte 1 seul filtre NON_EXPOSE (atype)', () => {
    const nonExposed = FILTER_DEFS.filter((d) => d.nonExposed === true);
    expect(nonExposed.map((d) => d.id)).toEqual(['articleType']);
  });

  it('compte exactement 13 paramètres primaires', () => {
    expect(PRIMARY_FILTER_DEFS.length).toBe(13);
  });

  it('compte exactement 3 filtres de classe D, documentés', () => {
    expect(DISABLED_FILTER_IDS.size).toBe(3);
    expect([...DISABLED_FILTER_IDS].sort()).toEqual(['deliverableInsertion', 'hadAccidentNew', 'region']);
    for (const id of DISABLED_FILTER_IDS) {
      expect(FILTER_BY_ID.get(id)?.disabledReason, `motif manquant pour ${id}`).toBeTruthy();
    }
  });

  it('compte 60 filtres secondaires (exposés, non primaires, non désactivés, non non-exposés)', () => {
    const secondary = FILTER_DEFS.filter(
      (d) => !d.primary && !d.nonExposed && d.cls !== 'D',
    );
    expect(secondary.length).toBe(60);
  });

  it('chaque filtre exposé (hors atype) a exactement un type de contrôle non "none"', () => {
    for (const d of FILTER_DEFS) {
      if (d.nonExposed) continue;
      if (d.id === 'lat' || d.id === 'lon') continue; // dérivés, jamais montrés (EX-SCR-82 #68/69)
      expect(d.control, `contrôle manquant pour ${d.id}`).not.toBe('none');
    }
  });
});

describe('classe T/R/D — jeton observable (EX-SCR-58)', () => {
  it('body est la seule classe dynamique, R en mode 1 et T en mode 2', () => {
    const body = FILTER_BY_ID.get('bodyType');
    expect(body?.cls).toBe('DYNAMIC_BODY');
    expect(resolveFilterClass(body!, 'mode1')).toBe('R');
    expect(resolveFilterClass(body!, 'mode2')).toBe('T');
  });

  it('tFilterIds inclut body en mode 2 mais pas en mode 1', () => {
    expect(tFilterIds('mode2').has('bodyType')).toBe(true);
    expect(tFilterIds('mode1').has('bodyType')).toBe(false);
  });

  it('tFilterIds exclut systématiquement atype (jamais un filtre utilisateur)', () => {
    expect(tFilterIds('mode1').has('articleType')).toBe(false);
    expect(tFilterIds('mode2').has('articleType')).toBe(false);
  });

  it('tout filtre de classe T fixe apparaît dans tFilterIds pour les deux modes', () => {
    const fixedT = FILTER_DEFS.filter((d) => d.cls === 'T' && !d.nonExposed);
    for (const d of fixedT) {
      expect(tFilterIds('mode1').has(d.id), d.id).toBe(true);
      expect(tFilterIds('mode2').has(d.id), d.id).toBe(true);
    }
  });
});

describe('dépendances entre filtres (EX-SRCH-14..17, EX-SCR-73)', () => {
  it('zipr/lat/lon désactivés tant que zip est vide', () => {
    const radius = FILTER_BY_ID.get('radius')!;
    const lat = FILTER_BY_ID.get('lat')!;
    expect(isDependencySatisfied(radius, {})).toBe(false);
    expect(isDependencySatisfied(lat, {})).toBe(false);
    expect(isDependencySatisfied(radius, { location: '1000' })).toBe(true);
  });

  it('crossBorder exige zip ET zipr', () => {
    const crossBorder = FILTER_BY_ID.get('crossBorder')!;
    expect(isDependencySatisfied(crossBorder, { location: '1000' })).toBe(false);
    expect(isDependencySatisfied(crossBorder, { location: '1000', radius: '50' })).toBe(true);
  });

  it('les 9 filtres de leasing exigent hasLeasing', () => {
    const ids = [
      'leasingRateFrom', 'leasingRateTo', 'leasingDurationFrom', 'leasingDurationTo',
      'leasingYearlyIncludedMileageFrom', 'leasingTradeInBonus', 'leasingEnvironmentBonus',
      'leasingAvailableNow', 'leasingTargetGroup',
    ];
    for (const id of ids) {
      const d = FILTER_BY_ID.get(id)!;
      expect(isDependencySatisfied(d, {}), id).toBe(false);
      expect(isDependencySatisfied(d, { hasLeasing: true }), id).toBe(true);
    }
  });

  it('bot/erfrom/erto exigent fuel contenant un code électrique (2, 3, E) — pas seulement "posé"', () => {
    const bot = FILTER_BY_ID.get('batteryOwnershipType')!;
    expect(isDependencySatisfied(bot, { fuelType: ['B'] })).toBe(false);
    expect(isDependencySatisfied(bot, { fuelType: ['B', 'E'] })).toBe(true);
    expect(isDependencySatisfied(bot, { fuelType: '3' })).toBe(true);
  });

  it('sealor/version0 exigent mmmv posé', () => {
    const seals = FILTER_BY_ID.get('seals')!;
    const version = FILTER_BY_ID.get('version')!;
    expect(isDependencySatisfied(seals, {})).toBe(false);
    expect(isDependencySatisfied(version, { makesModelsVariants: '9' })).toBe(true);
  });

  it('desc exige sort posé', () => {
    const desc = FILTER_BY_ID.get('descType')!;
    expect(isDependencySatisfied(desc, {})).toBe(false);
    expect(isDependencySatisfied(desc, { sortTypes: 'price' })).toBe(true);
  });
});

describe('options énumérées — 0 code brut (EX-NFR-30, échantillon)', () => {
  it('chaque option de chaque filtre enum a un libellé distinct de son code', () => {
    for (const d of FILTER_DEFS) {
      if (!d.options) continue;
      for (const o of d.options) {
        expect(o.label.length, `${d.id}=${o.code} sans libellé`).toBeGreaterThan(0);
        // `numberOfOwners` fait exception légitime : "1"/"2"/"3" sont des DÉNOMBREMENTS dont la
        // valeur affichée est authentiquement le chiffre (EX-NFR-30 vise les codes de vocabulaire
        // non traduits, pas les comptes numériques qui s'affichent naturellement tels quels).
        if (d.id === 'numberOfOwners') continue;
        expect(o.label, `${d.id}=${o.code} affiche son code brut`).not.toBe(o.code);
      }
    }
  });

  it('equipment porte ses 136 valeurs (EX-NAV-10 mesure de référence)', () => {
    expect(FILTER_BY_ID.get('equipment')?.options?.length).toBe(136);
  });
});
