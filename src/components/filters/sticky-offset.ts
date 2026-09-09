/**
 * KYCAR — Décalage de collage du bandeau de filtres (`EX-SCR-56`, ACC-02)
 * =================================================================================================
 * `EX-SCR-56` : « le bandeau est COLLANT SOUS L'EN-TÊTE ». Deux éléments frères ne peuvent pas se
 * coller l'un sous l'autre en CSS seul : `top` doit valoir la hauteur de l'en-tête, qui varie avec
 * le régime, le fil d'Ariane et les bandeaux d'état empilés (`EX-SCR-38`). On la MESURE donc, et on
 * la publie dans la variable `--kycar-band-top` que `app.css` lit sur `.kycar-filter-bar`.
 *
 * Le module est réduit à deux fonctions : `stickyTopPx` est PURE (testable sans DOM) et arrondit la
 * hauteur mesurée ; `observeHeaderHeight` branche un `ResizeObserver` (repli sur `resize` quand il
 * n'existe pas) et rend sa fonction d'arrêt. Aucun style n'est écrit ailleurs que dans cette
 * variable, et rien n'est fait hors navigateur.
 */

/** Valeur de `top` (en px, entier) pour un en-tête de hauteur `headerHeight`. */
export function stickyTopPx(headerHeight: number): number {
  if (!Number.isFinite(headerHeight) || headerHeight <= 0) return 0;
  return Math.round(headerHeight);
}

/** Sélecteur de l'en-tête collant de la coquille (`app.css`, `.kycar-header`). */
export const APP_HEADER_SELECTOR = '.kycar-header';

/** Nom de la variable CSS lue par `.kycar-filter-bar` (`app.css`). */
export const BAND_TOP_VAR = '--kycar-band-top';

/** Sélecteur du conteneur collant du bandeau (`app.css`, `.kycar-filter-bar`). */
export const BAND_BAR_SELECTOR = '.kycar-filter-bar';

/** Hauteur du bandeau collant, publiée pour le `scroll-padding-top` du document. */
export const BAND_HEIGHT_VAR = '--kycar-band-height';

/**
 * Publie en continu la hauteur de l'en-tête dans `--kycar-band-top` sur l'élément racine. Rend une
 * fonction d'arrêt (à appeler au démontage). Sans DOM, sans en-tête, ou sans `ResizeObserver`, le
 * comportement se dégrade sans jamais lever : la variable garde son défaut (`0px`), le bandeau colle
 * alors au haut du viewport plutôt qu'au bas de l'en-tête.
 */
export function observeHeaderHeight(): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const root = document.documentElement;
  const header = document.querySelector(APP_HEADER_SELECTOR);
  if (root === null || header === null) return () => undefined;
  const bar = document.querySelector(BAND_BAR_SELECTOR);

  const publish = (): void => {
    root.style.setProperty(BAND_TOP_VAR, `${stickyTopPx(header.getBoundingClientRect().height)}px`);
    // `--kycar-band-height` alimente le `scroll-padding-top` du document (`app.css`) : sans lui,
    // `scrollIntoView` amène le contenu SOUS l'en-tête et le bandeau collants, où il est recouvert.
    if (bar !== null) {
      root.style.setProperty(BAND_HEIGHT_VAR, `${stickyTopPx(bar.getBoundingClientRect().height)}px`);
    }
  };
  publish();

  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(publish);
    ro.observe(header);
    if (bar !== null) ro.observe(bar);
    return () => ro.disconnect();
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', publish);
    return () => window.removeEventListener('resize', publish);
  }
  return () => undefined;
}
