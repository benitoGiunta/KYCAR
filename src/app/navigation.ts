/**
 * KYCAR — Résolution de vue et navigation (lot D8)
 * =================================================================================================
 * La coquille rend une fonction PURE du chemin (EX-NAV-18). `matchRoute` (D5) reste la source de
 * vérité pour les six routes qu'il connaît ; il ne connaît PAS `/suivis` (écran F, EX-NAV-4) ni
 * `/mentions` (page statique, REQUIREMENTS.md l.158) — son test verrouille exactement six routes.
 * Plutôt que de modifier ce contrat D5 figé, la coquille reconnaît ces deux chemins additionnels
 * AVANT de déléguer à `matchRoute`. Divergence assumée et signalée dans le rapport de lot.
 *
 * `DR-099`/`DR-015` — les routes HÉRITÉES (`/`, `EX-SCR-49`, et `/modele/:makeId/:modelId`, annexe C
 * §A.1 « conservée en lecture seule ») sont reconnues par `matchRoute` et résolvent vers l'écran B :
 * la coquille les canonise ensuite par `replaceState` (`EX-SCR-140`), à partir de la route rendue par
 * `resolveTaxonomyRoute` (`routeOfView` ci-dessous fournit l'entrée de cette validation).
 */

import { matchRoute, type ModelDistributionRoute, type ModelListingsRoute } from '../state/router';

export type AppView =
  | { readonly kind: 'market' }
  | { readonly kind: 'modelDistribution'; readonly makeId: number; readonly makeSlug: string; readonly modelId: number; readonly modelSlug: string }
  | { readonly kind: 'modelListings'; readonly makeId: number; readonly makeSlug: string; readonly modelId: number; readonly modelSlug: string }
  | { readonly kind: 'compare' }
  | { readonly kind: 'savedSearches' }
  | { readonly kind: 'followed' }
  | { readonly kind: 'mentions' }
  | { readonly kind: 'notFound'; readonly path: string };

function bare(pathname: string): string {
  const p = pathname.split('?')[0]?.split('#')[0] ?? '';
  return p.replace(/\/+$/, '') || '/';
}

/** Résout un chemin en vue applicative. `/suivis` et `/mentions` d'abord, puis les six routes D5. */
export function resolveView(pathname: string): AppView {
  const p = bare(pathname);
  if (p === '/suivis') return { kind: 'followed' };
  if (p === '/mentions') return { kind: 'mentions' };
  const route = matchRoute(pathname);
  switch (route.name) {
    case 'market':
      return { kind: 'market' };
    case 'compare':
      return { kind: 'compare' };
    case 'savedSearches':
      return { kind: 'savedSearches' };
    case 'followedModels':
      // DR-053 (fix-state) : `/suivis` est désormais la sixième route de `matchRoute` ; le
      // court-circuit ci-dessus reste pour les chemins non canoniques (`/suivis/`).
      return { kind: 'followed' };
    case 'modelDistribution':
      return { kind: 'modelDistribution', makeId: route.makeId, makeSlug: route.makeSlug, modelId: route.modelId, modelSlug: route.modelSlug };
    case 'modelListings':
      return { kind: 'modelListings', makeId: route.makeId, makeSlug: route.makeSlug, modelId: route.modelId, modelSlug: route.modelSlug };
    case 'notFound':
      return { kind: 'notFound', path: route.path };
  }
}

/** Chemin+requête courants du navigateur (repli neutre hors navigateur / tests). */
export function currentLocation(): { pathname: string; search: string } {
  if (typeof window === 'undefined' || typeof window.location === 'undefined') {
    return { pathname: '/marche', search: '' };
  }
  return { pathname: window.location.pathname, search: window.location.search };
}

/**
 * Route D5 correspondant à une vue d'écran B/D — entrée de `resolveTaxonomyRoute` (`EX-NAV-19`/`20`,
 * `EX-SCR-140`). Les autres vues n'ont rien à valider contre la taxonomie.
 */
export function routeOfView(
  view: AppView,
): ModelDistributionRoute | ModelListingsRoute | null {
  if (view.kind === 'modelDistribution') {
    return { name: 'modelDistribution', makeId: view.makeId, makeSlug: view.makeSlug, modelId: view.modelId, modelSlug: view.modelSlug };
  }
  if (view.kind === 'modelListings') {
    return { name: 'modelListings', makeId: view.makeId, makeSlug: view.makeSlug, modelId: view.modelId, modelSlug: view.modelSlug };
  }
  return null;
}
