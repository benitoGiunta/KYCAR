/**
 * KYCAR - responsive breakpoints (EX-NFR-18, docs/requirements/draft-behaviour.md D.4).
 *
 * Single source of truth for D5-D8: import these constants (or the matching CSS custom
 * properties below) instead of hardcoding pixel values in a `matchMedia` call or a media query.
 *
 *   desktop : >= 1280px
 *   tablet  :  768px - 1279px
 *   mobile  :  < 768px
 *
 * EX-NFR-19 additionally requires the 3D-ish scatter plot (G4) to degrade to a 2D projection
 * below 768px rather than disable outright; histograms and brand/model cards stay fully
 * functional down to 320px. That behaviour belongs to D7/D6, not D1 - this file only fixes the
 * numbers so every lot agrees on them.
 */

export const BREAKPOINT_TABLET_MIN_PX = 768;
export const BREAKPOINT_DESKTOP_MIN_PX = 1280;

export const MEDIA_QUERY_MOBILE = `(max-width: ${BREAKPOINT_TABLET_MIN_PX - 1}px)`;
export const MEDIA_QUERY_TABLET = `(min-width: ${BREAKPOINT_TABLET_MIN_PX}px) and (max-width: ${BREAKPOINT_DESKTOP_MIN_PX - 1}px)`;
export const MEDIA_QUERY_DESKTOP = `(min-width: ${BREAKPOINT_DESKTOP_MIN_PX}px)`;
