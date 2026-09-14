import { describe, expect, it } from 'vitest';

import { buildC3Banner, coverageDiscLevel, sampleCoverageOf, shouldItalicizeRanges } from './coverage';

const NNBSP = ' ';
const NBSP = ' ';

describe('sampleCoverageOf — EX-DATA-61bis', () => {
  it('NON_APPLICABLE dès qu’un filtre utilisateur est posé, quel que soit announcedCount', () => {
    expect(sampleCoverageOf(100, 200, true)).toBe('NON_APPLICABLE');
    expect(sampleCoverageOf(100, null, true)).toBe('NON_APPLICABLE');
  });

  it('null si announcedCount est INCONNU, sans filtre posé', () => {
    expect(sampleCoverageOf(100, null, false)).toBeNull();
  });

  it('calcule le ratio arrondi à 4 décimales, sans filtre posé', () => {
    expect(sampleCoverageOf(3840, 120779, false)).toBeCloseTo(0.0318, 4);
  });

  it('ne divise jamais par zéro : announcedCount = 0 -> 0, pas NaN', () => {
    expect(sampleCoverageOf(0, 0, false)).toBe(0);
  });
});

describe('coverageDiscLevel — EX-SCR-115', () => {
  it.each([
    [0.8, 'plein'],
    [1, 'plein'],
    [0.79, 'mi-plein'],
    [0.2, 'mi-plein'],
    [0.19, 'creux'],
    [0, 'creux'],
    [null, 'indisponible'],
    ['NON_APPLICABLE', 'indisponible'],
  ] as const)('%p -> %s', (coverage, expected) => {
    expect(coverageDiscLevel(coverage)).toBe(expected);
  });
});

describe('shouldItalicizeRanges — EX-SCR-115', () => {
  it('italicise seulement une couverture numérique < 0,20', () => {
    expect(shouldItalicizeRanges(0.19)).toBe(true);
    expect(shouldItalicizeRanges(0.2)).toBe(false);
  });

  it('n’italicise jamais null ou NON_APPLICABLE (indisponibilité, pas faible couverture avérée)', () => {
    expect(shouldItalicizeRanges(null)).toBe(false);
    expect(shouldItalicizeRanges('NON_APPLICABLE')).toBe(false);
  });
});

describe('buildC3Banner — EX-SCR-31', () => {
  it('exemple normatif : 3 840 sur 120 779, sans filtre', () => {
    const banner = buildC3Banner({ listingCount: 3840, announcedListingCount: 120779, hasUserFilters: false });
    expect(banner.text).toBe(
      `Statistiques calculées sur 3${NNBSP}840 annonces observées sur 120${NNBSP}779 annoncées — couverture 3${NBSP}%`,
    );
    expect(banner.tone).toBe('rouge');
    expect(banner.dismissible).toBe(false);
  });

  it('jeton vert si p >= 80, refermable', () => {
    const banner = buildC3Banner({ listingCount: 90, announcedListingCount: 100, hasUserFilters: false });
    expect(banner.tone).toBe('vert');
    expect(banner.dismissible).toBe(true);
  });

  it('jeton ambre si 20 <= p < 80', () => {
    const banner = buildC3Banner({ listingCount: 50, announcedListingCount: 100, hasUserFilters: false });
    expect(banner.tone).toBe('ambre');
    expect(banner.dismissible).toBe(true);
  });

  it('announcedCount INCONNU -> texte dédié, jamais 100 %', () => {
    const banner = buildC3Banner({ listingCount: 50, announcedListingCount: null, hasUserFilters: false });
    expect(banner.text).toBe('Couverture d’échantillon inconnue — la source n’annonce pas d’effectif total pour ce périmètre');
    expect(banner.text).not.toMatch(/100/);
    expect(banner.tone).toBe('neutre');
  });

  it('au moins un filtre posé -> couverture non applicable, sans pourcentage', () => {
    const banner = buildC3Banner({ listingCount: 50, announcedListingCount: 100, hasUserFilters: true });
    expect(banner.text).toBe('Couverture d’échantillon non applicable sous filtre — 50 annonces observées');
    expect(banner.text).not.toMatch(/%/);
  });

  it('ne prend jamais listingCount pour announcedCount', () => {
    const banner = buildC3Banner({ listingCount: 100, announcedListingCount: 100, hasUserFilters: false });
    expect(banner.text).toContain('sur 100 annonces observées sur 100 annoncées');
  });
});
