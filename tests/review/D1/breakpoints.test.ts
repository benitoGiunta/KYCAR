/**
 * Revue D1 — sonde EX-NFR-18 : les points de rupture exposés par `src/styles/breakpoints.ts`
 * correspondent aux valeurs documentées dans `DEV.md` (desktop >= 1280px, tablette 768-1279px,
 * mobile < 768px), et les chaînes `matchMedia` générées sont cohérentes avec ces bornes.
 */
import { describe, expect, it } from 'vitest';
import {
  BREAKPOINT_TABLET_MIN_PX,
  BREAKPOINT_DESKTOP_MIN_PX,
  MEDIA_QUERY_MOBILE,
  MEDIA_QUERY_TABLET,
  MEDIA_QUERY_DESKTOP,
} from '../../../src/styles/breakpoints';

describe('EX-NFR-18 — points de rupture', () => {
  it('tablette commence à 768px, desktop à 1280px (valeurs DEV.md)', () => {
    expect(BREAKPOINT_TABLET_MIN_PX).toBe(768);
    expect(BREAKPOINT_DESKTOP_MIN_PX).toBe(1280);
  });

  it('mobile = max-width 767px (juste sous le seuil tablette)', () => {
    expect(MEDIA_QUERY_MOBILE).toBe('(max-width: 767px)');
  });

  it('tablette = 768px..1279px', () => {
    expect(MEDIA_QUERY_TABLET).toBe('(min-width: 768px) and (max-width: 1279px)');
  });

  it('desktop = min-width 1280px', () => {
    expect(MEDIA_QUERY_DESKTOP).toBe('(min-width: 1280px)');
  });

  it('les trois plages sont contiguës et sans recouvrement (partition de l’axe des largeurs)', () => {
    // mobile: [0, 768), tablette: [768, 1280), desktop: [1280, +inf)
    expect(BREAKPOINT_TABLET_MIN_PX).toBeLessThan(BREAKPOINT_DESKTOP_MIN_PX);
  });
});
