/**
 * KYCAR — Routeur maison (lot D5, finition)
 * =================================================================================================
 * Six routes (`docs/requirements/draft-screens.md` §3.1, `EX-SCR-40`/`41`), aucune librairie
 * tierce (`docs/plans/ARCHITECTURE.md` §1.3/§7.1 D5). Le rendu est une fonction PURE du chemin
 * (`EX-NAV-18`) : `matchRoute(pathname)` ne lit ni le DOM ni l'historique, ne connaît pas la
 * requête (`?...`, propriété du codec `url-codec.ts`) et ne valide PAS `makeId`/`modelId` contre la
 * taxonomie — cette validation référentielle exige `ReferenceData` (D2) et est du ressort de
 * l'écran appelant (D6/D7/D8), exactement comme `corrections.ts` documente sa propre limite
 * référentielle. Un chemin qui ne correspond à aucun des cinq motifs connus résout en `notFound`
 * (le sixième « route », l'écran d'erreur générique) — la distinction entre « chemin mal formé » et
 * « makeId/modelId inconnu de la taxonomie » (`EX-NAV-19`/`20`) est déplacée dans
 * `resolveTaxonomyRoute` ci-dessous, qui prend `ReferenceData` en paramètre et reste néanmoins pure.
 *
 * Les six routes (`draft-screens.md` §3.1) :
 *   1. `market`            — écran A, `/marche`
 *   2. `modelDistribution` — écran B, `/marche/:makeId-:makeSlug/:modelId-:modelSlug`
 *   3. `modelListings`     — écran D, `/marche/:makeId-:makeSlug/:modelId-:modelSlug/annonces`
 *   4. `compare`           — écran C, `/comparer`
 *   5. `savedSearches`     — écran E, `/recherches`
 *   6. `notFound`          — chemin non reconnu (générique) OU segment `makeId`/`modelId` mal formé
 *
 * L'écran `G` (§7.4) n'est PAS une septième route : c'est une modale superposée à A/B/C/D, portée
 * par l'état d'interface du composant appelant, jamais par le chemin.
 */

export type RouteName =
  | 'market'
  | 'modelDistribution'
  | 'modelListings'
  | 'compare'
  | 'savedSearches'
  | 'notFound';

/** Les six noms de route, dans l'ordre de `draft-screens.md` §3.1 (pour un test d'exhaustivité). */
export const ROUTE_NAMES: readonly RouteName[] = [
  'market',
  'modelDistribution',
  'modelListings',
  'compare',
  'savedSearches',
  'notFound',
];

export interface MarketRoute {
  readonly name: 'market';
}
export interface ModelDistributionRoute {
  readonly name: 'modelDistribution';
  readonly makeId: number;
  readonly makeSlug: string;
  readonly modelId: number;
  readonly modelSlug: string;
}
export interface ModelListingsRoute {
  readonly name: 'modelListings';
  readonly makeId: number;
  readonly makeSlug: string;
  readonly modelId: number;
  readonly modelSlug: string;
}
export interface CompareRoute {
  readonly name: 'compare';
}
export interface SavedSearchesRoute {
  readonly name: 'savedSearches';
}
/** Chemin non reconnu — distinct de l'écran d'erreur `EX-NAV-19`/`20` (marque/modèle inconnu de la
 * taxonomie), qui exige `ReferenceData` et est résolu par `resolveTaxonomyRoute`, pas ici. */
export interface NotFoundRoute {
  readonly name: 'notFound';
  readonly path: string;
}

export type Route =
  | MarketRoute
  | ModelDistributionRoute
  | ModelListingsRoute
  | CompareRoute
  | SavedSearchesRoute
  | NotFoundRoute;

/** `:id-:slug` — l'id est la partie normative, le slug est cosmétique (jamais revalidé ici). */
const ID_SLUG_RE = /^(\d+)-(.+)$/;

function splitPath(pathname: string): string[] {
  // Ignore un `?...`/`#...` éventuellement collé (défense en profondeur : l'appelant est censé
  // avoir déjà séparé chemin et requête via `url-codec.ts`, mais un chemin complet ne doit jamais
  // faire échouer silencieusement le routeur).
  const bare = pathname.split('?')[0]?.split('#')[0] ?? '';
  return bare.split('/').filter((s) => s.length > 0);
}

function parseIdSlug(segment: string | undefined): { id: number; slug: string } | null {
  if (segment === undefined) return null;
  const m = ID_SLUG_RE.exec(segment);
  if (m === null) return null;
  const idStr = m[1];
  const slug = m[2];
  if (idStr === undefined || slug === undefined) return null;
  const id = Number(idStr);
  if (!Number.isSafeInteger(id) || id < 0) return null;
  return { id, slug };
}

/**
 * Résout un chemin (sans requête) en une des six routes. Pure : même entrée, même sortie, aucun
 * effet de bord (`EX-NAV-18`).
 */
export function matchRoute(pathname: string): Route {
  const segments = splitPath(pathname);

  if (segments.length === 0) return { name: 'market' };
  const [first, second, third, fourth] = segments;

  if (first === 'marche' && second === undefined) return { name: 'market' };

  if (first === 'comparer' && second === undefined) return { name: 'compare' };

  if (first === 'recherches' && second === undefined) return { name: 'savedSearches' };

  if (first === 'marche' && second !== undefined && third !== undefined) {
    const make = parseIdSlug(second);
    const model = parseIdSlug(third);
    if (make !== null && model !== null) {
      const base = {
        makeId: make.id,
        makeSlug: make.slug,
        modelId: model.id,
        modelSlug: model.slug,
      };
      if (fourth === undefined) {
        return { name: 'modelDistribution', ...base };
      }
      if (fourth === 'annonces' && segments.length === 4) {
        return { name: 'modelListings', ...base };
      }
    }
  }

  return { name: 'notFound', path: pathname };
}

/** Reconstruit le chemin (sans requête) d'une route — inverse de `matchRoute` sur les 5 routes
 * adressables (`notFound` n'a pas de forme canonique, elle porte le chemin reçu tel quel). */
export function buildPath(route: Route): string {
  switch (route.name) {
    case 'market':
      return '/marche';
    case 'compare':
      return '/comparer';
    case 'savedSearches':
      return '/recherches';
    case 'modelDistribution':
      return `/marche/${route.makeId}-${route.makeSlug}/${route.modelId}-${route.modelSlug}`;
    case 'modelListings':
      return `/marche/${route.makeId}-${route.makeSlug}/${route.modelId}-${route.modelSlug}/annonces`;
    case 'notFound':
      return route.path;
  }
}

/* ================================================================================================
 * Validation référentielle (EX-NAV-19/20) — séparée de `matchRoute`, qui reste pure et sans données
 * ============================================================================================== */

/** Sous-ensemble de `ReferenceData` (D2) nécessaire à la validation — évite un couplage fort au
 * type complet exporté par `src/types/reference.ts` (ce module n'importe QUE ce dont il a besoin). */
export interface TaxonomyLookup {
  readonly makeById: ReadonlyMap<number, unknown>;
  readonly modelByKey: ReadonlyMap<string, unknown>;
}

export type TaxonomyRouteError =
  | { readonly kind: 'unknownMake'; readonly makeId: number }
  | { readonly kind: 'unknownModel'; readonly makeId: number; readonly modelId: number };

export type TaxonomyRouteResult =
  | { readonly ok: true; readonly route: ModelDistributionRoute | ModelListingsRoute }
  | { readonly ok: false; readonly error: TaxonomyRouteError };

/** Clé composite `${makeId}:${modelId}` — reprend le format de `modelKey` de `src/types/reference.ts`
 * sans l'importer (ce module ne dépend d'aucun code hors `src/state`), même formule, testée contre
 * l'export réel dans `router.test.ts`. */
function modelKeyOf(makeId: number, modelId: number): string {
  return `${makeId}:${modelId}`;
}

/**
 * Valide une route `modelDistribution`/`modelListings` déjà matchée contre la taxonomie chargée
 * (`EX-NAV-19`/`20`). `modelId = 0` est la clé réservée « Modèle non identifié »
 * (`EX-DATA-72`) et n'est JAMAIS traité comme un modèle inconnu (exception unique d'`EX-NAV-20`),
 * à condition que `makeId` existe lui-même.
 */
export function resolveTaxonomyRoute(
  route: ModelDistributionRoute | ModelListingsRoute,
  taxonomy: TaxonomyLookup,
): TaxonomyRouteResult {
  if (!taxonomy.makeById.has(route.makeId)) {
    return { ok: false, error: { kind: 'unknownMake', makeId: route.makeId } };
  }
  if (route.modelId === 0) return { ok: true, route };
  if (!taxonomy.modelByKey.has(modelKeyOf(route.makeId, route.modelId))) {
    return {
      ok: false,
      error: { kind: 'unknownModel', makeId: route.makeId, modelId: route.modelId },
    };
  }
  return { ok: true, route };
}
