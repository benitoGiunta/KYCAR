import { describe, expect, it } from 'vitest';

import { formatMonthYear, formatYear, formatYearStat } from './format';

describe('formatYear — usage générique (catégorie d’axe, année-modèle, point de nuage)', () => {
  it('arrondit au plus proche, sans position de quantile (usage hors table B.2)', () => {
    expect(formatYear(2017.4)).toBe('2017');
    expect(formatYear(2017.6)).toBe('2018');
  });
});

describe('formatYearStat — EX-DATA-64 (table B.2), ACC-17 : plancher/plafond selon la position', () => {
  // Reproduction exacte de l'écart relevé par la recette (ACC-17) : « 1ʳᵉ immat. médiane » de
  // l'écran B utilisait `formatYear` (arrondi au plus proche) au lieu du plancher normatif de la
  // position `médiane` (table B.2 : « idem » p05, plancher). Exemple cité : Toyota Corolla,
  // médiane d'année 2018,5 -> l'écran affichait « 2019 », la table exige le plancher « 2018 ».
  it("position 'p05' (couvre médiane/q1/q3) : plancher, jamais au plus proche — 2018,5 -> 2018", () => {
    expect(formatYearStat(2018.5, 'p05')).toBe('2018');
  });

  it("position 'p95' : plafond — 2023,1 -> 2024", () => {
    expect(formatYearStat(2023.1, 'p95')).toBe('2024');
  });

  it("position 'raw' (valeur observée, jamais interpolée) : au plus proche", () => {
    expect(formatYearStat(2018.5, 'raw')).toBe('2019');
    expect(formatYearStat(2018.4, 'raw')).toBe('2018');
  });

  it('une année déjà entière donne le même résultat quelle que soit la position', () => {
    expect(formatYearStat(2018, 'p05')).toBe('2018');
    expect(formatYearStat(2018, 'p95')).toBe('2018');
    expect(formatYearStat(2018, 'raw')).toBe('2018');
  });
});

describe('formatMonthYear — repli sur valeur hors domaine (non touché par ACC-17)', () => {
  it('reste inchangé : caractère d’absence normatif sur une valeur négative', () => {
    expect(formatMonthYear(-1)).toBe('—');
  });
});
