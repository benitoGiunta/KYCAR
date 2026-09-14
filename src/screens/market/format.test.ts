import { describe, expect, it } from 'vitest';

import {
  formatFirstRegistrationMonthYear,
  formatInteger,
  formatMileage,
  formatMileageRange,
  formatModelYear,
  formatOfferCount,
  formatPercent,
  formatPrice,
  formatPriceRange,
  formatYearRange,
  roundHalfAwayFromZero,
  roundYearForPresentation,
  roundMileageUnit,
  truncateGraphemes,
} from './format';

const NNBSP = ' ';
const NBSP = ' ';
const EN_DASH = '–';

describe('formatInteger — EX-SCR-1 (séparateur de milliers U+202F)', () => {
  it.each([
    [0, '0'],
    [1, '1'],
    [999, '999'],
    [1000, `1${NNBSP}000`],
    [1281, `1${NNBSP}281`],
    [18950, `18${NNBSP}950`],
    [128400, `128${NNBSP}400`],
    [120779, `120${NNBSP}779`],
    [1000000, `1${NNBSP}000${NNBSP}000`],
  ])('formate %i en %s', (n, expected) => {
    expect(formatInteger(n)).toBe(expected);
  });

  it('conserve le signe négatif sans imposer de règle normative absente', () => {
    expect(formatInteger(-5)).toBe('-5');
  });
});

describe('roundHalfAwayFromZero — EX-SCR-3 / EX-DATA-6', () => {
  it('arrondit au plus proche, demi vers l’infini en valeur absolue', () => {
    expect(roundHalfAwayFromZero(18950.4)).toBe(18950);
    expect(roundHalfAwayFromZero(18950.5)).toBe(18951);
    expect(roundHalfAwayFromZero(-18950.5)).toBe(-18951);
    expect(roundHalfAwayFromZero(0)).toBe(0);
  });

  it('n’utilise jamais Math.floor (aucune troncature vers le bas)', () => {
    // 18950.9 tronqué vers le bas donnerait 18950 ; l’arrondi au plus proche donne 18951.
    expect(roundHalfAwayFromZero(18950.9)).toBe(18951);
  });
});

describe('formatPrice — EX-SCR-3', () => {
  it('formate un prix avec NBSP devant €, sans décimale', () => {
    expect(formatPrice(18950)).toBe(`18${NNBSP}950${NBSP}€`);
  });

  it('exemple normatif exact', () => {
    expect(formatPrice(18950)).toBe(`18${NNBSP}950${NBSP}€`);
  });
});

describe('formatPriceRange — EX-SCR-4', () => {
  it('exemple normatif : 4 200 – 21 900 €', () => {
    expect(formatPriceRange(4200, 21900)).toBe(`4${NNBSP}200${NBSP}${EN_DASH}${NBSP}21${NNBSP}900${NBSP}€`);
  });

  it('collapse sur valeur unique quand les deux bornes coïncident après arrondi', () => {
    expect(formatPriceRange(9500, 9500)).toBe(`9${NNBSP}500${NBSP}€`);
    expect(formatPriceRange(9500.4, 9500.49)).toBe(`9${NNBSP}500${NBSP}€`);
  });

  it('le symbole € n’apparaît qu’une seule fois, en fin de chaîne', () => {
    const s = formatPriceRange(1000, 2000);
    expect(s.match(/€/g)).toHaveLength(1);
    expect(s.endsWith('€')).toBe(true);
  });
});

describe('roundMileageUnit — EX-SCR-5 (valeur unitaire)', () => {
  it('arrondit à l’unité en dessous de 10 000 km', () => {
    expect(roundMileageUnit(8421)).toBe(8421);
  });

  it('arrondit à la centaine au-dessus de 10 000 km', () => {
    expect(roundMileageUnit(128421)).toBe(128400);
    expect(roundMileageUnit(128450)).toBe(128500);
  });
});

describe('formatMileage', () => {
  it('exemples normatifs', () => {
    expect(formatMileage(8421)).toBe(`8${NNBSP}421${NBSP}km`);
    expect(formatMileage(128400)).toBe(`128${NNBSP}400${NBSP}km`);
  });
});

describe('formatMileageRange — EX-SCR-5 (bornes de fourchette, plancher/plafond de centaine)', () => {
  it('exemple normatif exact : min 10 049, max 210 049 -> 10 000 – 210 100 km', () => {
    expect(formatMileageRange(10049, 210049)).toBe(`10${NNBSP}000${NBSP}${EN_DASH}${NBSP}210${NNBSP}100${NBSP}km`);
  });

  it('exemple normatif : 12 000 – 210 000 km', () => {
    expect(formatMileageRange(12000, 210000)).toBe(`12${NNBSP}000${NBSP}${EN_DASH}${NBSP}210${NNBSP}000${NBSP}km`);
  });

  it('le plancher/plafond de centaine s’applique même sous 10 000 km (règle de fourchette, pas de valeur unitaire)', () => {
    expect(formatMileageRange(50, 150)).toBe(`0${NBSP}${EN_DASH}${NBSP}200${NBSP}km`);
  });

  it('collapse sur valeur unique quand les deux bornes arrondies coïncident (valeur exacte, multiple de 100)', () => {
    expect(formatMileageRange(10000, 10000)).toBe(`10${NNBSP}000${NBSP}km`);
  });

  it('ne collapse pas une valeur unique non multiple de 100 : le plancher/plafond reste distinct', () => {
    // Un seul relevé à 8 421 km affiche quand même une fourchette [8 400, 8 500] : le plancher/
    // plafond de centaine garantit que la fourchette contient la valeur, jamais qu'elle l'égale.
    expect(formatMileageRange(8421, 8421)).toBe(`8${NNBSP}400${NBSP}${EN_DASH}${NBSP}8${NNBSP}500${NBSP}km`);
  });

  it('l’unité km n’apparaît qu’une seule fois', () => {
    const s = formatMileageRange(1000, 2000);
    expect(s.match(/km/g)).toHaveLength(1);
  });
});

describe('formatYearRange — EX-SCR-6', () => {
  it('exemple normatif : 2014 – 2021', () => {
    expect(formatYearRange(2014, 2021)).toBe(`2014${NBSP}${EN_DASH}${NBSP}2021`);
  });

  it('collapse sur année unique', () => {
    expect(formatYearRange(2017, 2017)).toBe('2017');
  });
});

describe('formatYearRange — EX-DATA-64 (table B.2), ACC-17 : plancher p05, plafond p95', () => {
  // Reproduction exacte de l'écart relevé par la recette (ACC-17, `reports/ACCEPTANCE.md` §8) :
  // p05 = 2016,8 / p95 = 2022,1 (Volkswagen, P1) — l'application (avant correction) arrondissait au
  // plus proche (« 2017 – 2022 ») au lieu du plancher/plafond normatif (« 2016 – 2023 »).
  it("exemple normatif de la recette (VW, P1) : p05 = 2016,8 -> plancher 2016, p95 = 2022,1 -> plafond 2023", () => {
    expect(formatYearRange(2016.8, 2022.1)).toBe(`2016${NBSP}${EN_DASH}${NBSP}2023`);
  });

  it('p95 non entier arrondit TOUJOURS au plafond, jamais au plus proche (2023,1 -> 2024, pas 2023)', () => {
    expect(formatYearRange(2020, 2023.1)).toBe(`2020${NBSP}${EN_DASH}${NBSP}2024`);
  });

  it('p05 non entier arrondit TOUJOURS au plancher, jamais au plus proche (2009,5 -> 2009, pas 2010)', () => {
    expect(formatYearRange(2009.5, 2015)).toBe(`2009${NBSP}${EN_DASH}${NBSP}2015`);
  });

  it("positions 'raw' (bornes OBSERVÉES min/max, jamais interpolées) : arrondi au plus proche, PAS plancher/plafond — repli [min, max] de `view-model.ts::lowSampleRange`", () => {
    expect(formatYearRange(2016.8, 2022.1, 'raw', 'raw')).toBe(`2017${NBSP}${EN_DASH}${NBSP}2022`);
  });

  it('une année déjà entière ne change de résultat sous aucune position (rétrocompatible avec les appels à 2 arguments)', () => {
    expect(formatYearRange(2014, 2021)).toBe(formatYearRange(2014, 2021, 'p05', 'p95'));
  });
});

describe('roundYearForPresentation — EX-DATA-64 (table B.2), ACC-17', () => {
  it("'p05' (couvre aussi q1/médiane/q3, arrondi « idem » de la table) : plancher", () => {
    expect(roundYearForPresentation(2018.9, 'p05')).toBe(2018);
  });
  it("'p95' : plafond", () => {
    expect(roundYearForPresentation(2018.1, 'p95')).toBe(2019);
  });
  it("'raw' (valeur observée) : au plus proche, demi vers l'infini", () => {
    expect(roundYearForPresentation(2018.5, 'raw')).toBe(2019);
    expect(roundYearForPresentation(2018.4, 'raw')).toBe(2018);
  });
});

describe('formatModelYear — EX-SCR-6', () => {
  it('exemple normatif : mod. 2018', () => {
    expect(formatModelYear(2018)).toBe(`mod.${NBSP}2018`);
  });
});

describe('formatFirstRegistrationMonthYear — EX-SCR-6', () => {
  it('exemple normatif : 03/2017', () => {
    expect(formatFirstRegistrationMonthYear('2017-03-15T00:00:00.000Z')).toBe('03/2017');
  });

  it('complète le mois à deux chiffres', () => {
    expect(formatFirstRegistrationMonthYear('2017-01-01T00:00:00.000Z')).toBe('01/2017');
  });
});

describe('formatOfferCount — EX-SCR-10', () => {
  it('zéro -> aucune offre, jamais 0 offre', () => {
    expect(formatOfferCount(0)).toBe('aucune offre');
  });

  it('singulier à 1', () => {
    expect(formatOfferCount(1)).toBe('1 offre');
  });

  it('pluriel au-delà de 1', () => {
    expect(formatOfferCount(2)).toBe('2 offres');
    expect(formatOfferCount(3120)).toBe(`3${NNBSP}120 offres`);
  });
});

describe('formatPercent — EX-SCR-11', () => {
  it('bande basse ouverte substituée par < 1 %', () => {
    expect(formatPercent(0.1)).toBe(`<${NBSP}1${NBSP}%`);
  });

  it('valeur nulle affiche 0 %, jamais < 1 %', () => {
    expect(formatPercent(0)).toBe(`0${NBSP}%`);
  });

  it('bande haute ouverte substituée par > 99 %', () => {
    expect(formatPercent(99.9)).toBe(`>${NBSP}99${NBSP}%`);
  });

  it('valeur pleine affiche 100 %, jamais > 99 %', () => {
    expect(formatPercent(100)).toBe(`100${NBSP}%`);
  });

  it('arrondit une valeur ordinaire à l’entier', () => {
    expect(formatPercent(3.2)).toBe(`3${NBSP}%`);
    expect(formatPercent(80)).toBe(`80${NBSP}%`);
  });
});

describe('truncateGraphemes — EX-SCR-13', () => {
  it('ne tronque pas un texte sous le budget', () => {
    const r = truncateGraphemes('BMW', 22);
    expect(r).toEqual({ display: 'BMW', truncated: false, full: 'BMW' });
  });

  it('tronque au budget avec points de suspension, et porte le texte intégral', () => {
    const long = 'A'.repeat(30);
    const r = truncateGraphemes(long, 22);
    expect(r.truncated).toBe(true);
    expect(r.display).toBe(`${'A'.repeat(22)}…`);
    expect(r.full).toBe(long);
  });

  it('ne coupe jamais à l’intérieur d’un graphème étendu (emoji drapeau, combinant)', () => {
    // 'é' composé (e + combining acute) est un seul graphème étendu : ne doit pas être scindé.
    const combining = `é${'x'.repeat(25)}`; // é (2 code units) + 25 x = 26 graphèmes
    const r = truncateGraphemes(combining, 1);
    expect(r.truncated).toBe(true);
    expect(r.display.startsWith('é')).toBe(true);
  });

  it('respecte exactement le budget de 22 pour un nom de marque à la limite', () => {
    const exact = 'A'.repeat(22);
    expect(truncateGraphemes(exact, 22).truncated).toBe(false);
    expect(truncateGraphemes(`${exact}A`, 22).truncated).toBe(true);
  });
});
