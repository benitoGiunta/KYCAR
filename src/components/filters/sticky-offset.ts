/**
 * KYCAR — Hauteur de la barre de filtres collante (`[amendée 3.6 — D3-46]` d'`EX-SCR-56`)
 * =================================================================================================
 * Avant `D3-46`, l'en-tête ET le bandeau collaient, l'un sous l'autre : il fallait mesurer la
 * hauteur de l'en-tête pour placer le bandeau (`--kycar-band-top`). Le retour du commanditaire
 * (« un tiers de la page bouffé ») a supprimé ce collage : l'en-tête et le fil d'Ariane défilent avec
 * la page, et seule la BARRE CONDENSÉE du bandeau (`.kycar-band-bar`) colle, à `top: 0`. Il n'y a
 * donc plus de décalage à publier sous l'en-tête.
 *
 * Reste un besoin : `scroll-padding-top` du document (`app.css`) doit valoir la hauteur de la barre,
 * sans quoi `scrollIntoView` (ancres, prise de focus, `EX-NFR-12`) amène le contenu SOUS la barre,
 * où il est recouvert. On la MESURE (elle varie avec le régime et l'état du brouillon) et on la
 * publie dans `--kycar-band-height`. `stickyTopPx` est PURE (testable sans DOM).
 */

/** Hauteur (en px, entier) publiée pour une barre de hauteur mesurée `height`. */
export function stickyTopPx(height: number): number {
  if (!Number.isFinite(height) || height <= 0) return 0;
  return Math.round(height);
}

/** Sélecteur de la barre collante du bandeau (`filter-band.css`, `.kycar-band-bar`). */
export const BAND_BAR_SELECTOR = '.kycar-band-bar';

/** Hauteur de la barre collante, publiée pour le `scroll-padding-top` du document. */
export const BAND_HEIGHT_VAR = '--kycar-band-height';

/**
 * Publie en continu la hauteur de la barre collante dans `--kycar-band-height` sur l'élément racine.
 * Rend une fonction d'arrêt (à appeler au démontage). Sans DOM, sans barre, ou sans
 * `ResizeObserver`, le comportement se dégrade sans jamais lever.
 */
export function observeBandHeight(bar: Element | null = null): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const root = document.documentElement;
  const target = bar ?? document.querySelector(BAND_BAR_SELECTOR);
  if (root === null || target === null) return () => undefined;

  const publish = (): void => {
    root.style.setProperty(BAND_HEIGHT_VAR, `${stickyTopPx(target.getBoundingClientRect().height)}px`);
  };
  publish();

  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(publish);
    ro.observe(target);
    return () => {
      ro.disconnect();
      root.style.removeProperty(BAND_HEIGHT_VAR);
    };
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', publish);
    return () => window.removeEventListener('resize', publish);
  }
  return () => undefined;
}
