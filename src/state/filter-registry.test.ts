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
 * `data/reference/filters-scope.json`, seule source normative des identifiants/paramètres — SOUS
 * RÉSERVE de `D-14` (`R3_DONNEE_PERSONNELLE`) : `location`/`lat`/`lon` sont retirés du registre par
 * fix-state QUEL QUE SOIT le contenu du fichier de scope (fix-engine les retire de son côté,
 * séparément, potentiellement pas encore fusionné dans ce worktree). `radius`/`crossBorder`
 * perdent en conséquence leur dépendance envers `location`, qui n'existe plus. Ce test est donc
 * robuste aux deux états du fichier (77 avant la fusion de fix-engine, 74 après).
 */
describe('registre des filtres — complétude contre filters-scope.json', () => {
  const retenus = filtersScope.retenus as ReadonlyArray<{
    readonly id: string;
    readonly param: string;
    readonly label: string;
    readonly type: string;
    readonly dependencies: readonly string[];
  }>;

  /** `D-14` : retirés du registre, quel que soit le contenu du fichier de scope. */
  const REMOVED_BY_D14: ReadonlySet<string> = new Set(['location', 'lat', 'lon']);
  /** Dépendance envers `location` retirée en conséquence (`D-14`) — leur prérequis a disparu. */
  const DEPENDENCY_DROPPED_BY_D14: ReadonlySet<string> = new Set(['radius', 'crossBorder']);
  /** `DR-055` : dépendance envers `powerType` retirée (`EX-SCR-73` : « toujours posé, jamais
   * désactivé » — `powertype` porte une `defaultValue`, une fausse dépendance le désactivait par
   * défaut). `filters-scope.json` conserve encore cette dépendance côté relevé brut. */
  const DEPENDENCY_DROPPED_BY_DR055: ReadonlySet<string> = new Set(['powerFrom', 'powerTo']);

  it('porte les filtres retenus moins ceux exclus par D-14, ni plus ni moins', () => {
    const scopeIds = new Set(retenus.map((r) => r.id).filter((id) => !REMOVED_BY_D14.has(id)));
    const defIds = new Set(FILTER_DEFS.map((d) => d.id));
    expect(defIds).toEqual(scopeIds);
  });

  it('reprend param/label/type à l’identique pour chacun des filtres non exclus par D-14', () => {
    for (const r of retenus) {
      if (REMOVED_BY_D14.has(r.id)) continue;
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
      if (
        REMOVED_BY_D14.has(r.id) ||
        DEPENDENCY_DROPPED_BY_D14.has(r.id) ||
        DEPENDENCY_DROPPED_BY_DR055.has(r.id)
      ) continue;
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
 * Bilan arithmétique clos `EX-SCR-83`, mis à jour par la remédiation 2.6 : `D-14` retire 3 filtres
 * du registre (`location`/`lat`/`lon`, R3) ; `DR-052`/`D-15` marquent `nonExposed` trois filtres
 * supplémentaires — valeurs injectées vers la source (`powerType`, `hadAccident`, `countryType`,
 * `EX-SRCH-18bis`/`ARB-30`) — en plus de `atype` ; `D-12`/`DR-066` marquent `nonExposed` `page` et
 * `pageSize` (paramètres d'état d'interface, retirés de la ligne primaire, jamais des filtres). Le
 * décompte passe donc de 77/76+1/13/60 à 74/68+6/12/53.
 */
describe('registre des filtres — bilan EX-SCR-83 (mis à jour DR-052/D-12/D-14/D-15)', () => {
  it('compte 6 filtres NON_EXPOSE : atype, powerType, hadAccident, countryType, page, pageSize', () => {
    const nonExposed = FILTER_DEFS.filter((d) => d.nonExposed === true);
    expect(nonExposed.map((d) => d.id)).toEqual([
      'articleType',
      'powerType',
      'hadAccident',
      'countryType',
      'page',
      'pageSize',
    ]);
  });

  it('compte exactement 12 paramètres primaires (countryType retiré, D-15)', () => {
    expect(PRIMARY_FILTER_DEFS.length).toBe(12);
  });

  it('compte exactement 3 filtres de classe D, documentés', () => {
    expect(DISABLED_FILTER_IDS.size).toBe(3);
    expect([...DISABLED_FILTER_IDS].sort()).toEqual(['deliverableInsertion', 'hadAccidentNew', 'region']);
    for (const id of DISABLED_FILTER_IDS) {
      expect(FILTER_BY_ID.get(id)?.disabledReason, `motif manquant pour ${id}`).toBeTruthy();
    }
  });

  it('compte 53 filtres secondaires (exposés, non primaires, non désactivés, non non-exposés)', () => {
    const secondary = FILTER_DEFS.filter(
      (d) => !d.primary && !d.nonExposed && d.cls !== 'D',
    );
    expect(secondary.length).toBe(53);
  });

  it('chaque filtre exposé a exactement un type de contrôle non "none"', () => {
    // `lat`/`lon` (dérivés, jamais montrés, EX-SCR-82 #68/69) sont retirés du registre par `D-14` :
    // plus besoin de les excepter ici, ils n'apparaissent simplement plus dans `FILTER_DEFS`.
    for (const d of FILTER_DEFS) {
      if (d.nonExposed) continue;
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
  // `D-14` retire `location`/`lat`/`lon` du registre (R3) : `radius`/`crossBorder` perdaient sinon
  // toute dépendance satisfaisable (leur prérequis aurait disparu) — ils ne dépendent plus de
  // `location`, `crossBorder` ne dépend plus que de `radius`.
  it('radius (zipr) et lat/lon n’existent plus dans le registre (D-14, R3)', () => {
    expect(FILTER_BY_ID.get('lat')).toBeUndefined();
    expect(FILTER_BY_ID.get('lon')).toBeUndefined();
    const radius = FILTER_BY_ID.get('radius')!;
    expect(radius).toBeDefined();
    expect(radius.dependencies).toEqual([]);
  });

  it('crossBorder exige radius (zipr), plus de dépendance envers zip (D-14)', () => {
    const crossBorder = FILTER_BY_ID.get('crossBorder')!;
    expect(isDependencySatisfied(crossBorder, {})).toBe(false);
    expect(isDependencySatisfied(crossBorder, { radius: '50' })).toBe(true);
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
