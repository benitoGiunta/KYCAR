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
 * Les six routes ADRESSABLES (`draft-screens.md` §3.1, annexe C §A.1, `DR-053`) :
 *   1. `market`            — écran A, `/marche`
 *   2. `modelDistribution` — écran B, `/marche/:makeId-:makeSlug/:modelId-:modelSlug`
 *   3. `modelListings`     — écran D, `/marche/:makeId-:makeSlug/:modelId-:modelSlug/annonces`
 *   4. `compare`           — écran C, `/comparer`
 *   5. `savedSearches`     — écran E, `/recherches`
 *   6. `followedModels`    — écran F, `/suivis`
 *
 * `notFound` (chemin non reconnu, générique, OU segment `makeId`/`modelId` mal formé) est un
 * SEPTIÈME nom technique, l'écran d'erreur générique — il ne compte pas parmi les six routes
 * adressables de l'annexe C (`DR-054` corrige la confusion antérieure qui le comptait comme la
 * sixième route à la place de `/suivis`).
 *
 * L'écran `G` (§7.4) n'est PAS une route non plus : c'est une modale superposée à A/B/C/D, portée
 * par l'état d'interface du composant appelant, jamais par le chemin.
 */

import type { MutableSelectionState, ScreenMode, SelectionState } from './filter-types';

export type RouteName =
  | 'market'
  | 'modelDistribution'
  | 'modelListings'
  | 'compare'
  | 'savedSearches'
  | 'followedModels'
  | 'notFound';

/** Les six routes ADRESSABLES de `draft-screens.md` §3.1, plus `notFound` (générique, `DR-054`). */
export const ROUTE_NAMES: readonly RouteName[] = [
  'market',
  'modelDistribution',
  'modelListings',
  'compare',
  'savedSearches',
  'followedModels',
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
/** Écran F, `/suivis` — modèles suivis (`EX-NAV-4`, `DR-053`). */
export interface FollowedModelsRoute {
  readonly name: 'followedModels';
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
  | FollowedModelsRoute
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

  if (first === 'suivis' && second === undefined) return { name: 'followedModels' };

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

  // Route HISTORIQUE `/modele/:makeId/:modelId` (annexe C §A.1 : « conservée en lecture seule,
  // redirige par `replaceState` »). Ni `makeId` ni `modelId` ne portent de slug dans cette forme
  // ancienne : les deux sont vides ici, à charge de l'appelant de les canoniser via
  // `resolveTaxonomyRoute` avant `replaceState` (`DR-054` ; le câblage réel est fix-app, `D-054`
  // → `DR-099`).
  if (first === 'modele' && second !== undefined && third !== undefined && segments.length === 3) {
    const makeId = Number(second);
    const modelId = Number(third);
    if (Number.isSafeInteger(makeId) && makeId >= 0 && Number.isSafeInteger(modelId) && modelId >= 0) {
      return { name: 'modelDistribution', makeId, makeSlug: '', modelId, modelSlug: '' };
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
    case 'followedModels':
      return '/suivis';
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

/**
 * Entrée minimale requise d'un `Make`/`Model` (D2, `src/types/reference.ts`) pour calculer le slug
 * CANONIQUE d'une route (`EX-SCR-140`, `DR-054`). `slug` est TOUJOURS posé par le chargeur réel de
 * D2 (`buildTaxonomy`, repli `slugify(label)`) ; ce module accepte néanmoins `label` seul (sans
 * `slug`) et calcule alors le même repli localement — ce module reste sans dépendance à
 * `src/types` (note de conception du fichier), formule dupliquée sciemment, comme `modelKeyOf`
 * duplique `modelKey`.
 */
export interface TaxonomyEntry {
  readonly label?: string;
  readonly slug?: string;
}

/** Sous-ensemble de `ReferenceData` (D2) nécessaire à la validation — évite un couplage fort au
 * type complet exporté par `src/types/reference.ts` (ce module n'importe QUE ce dont il a besoin). */
export interface TaxonomyLookup {
  readonly makeById: ReadonlyMap<number, TaxonomyEntry>;
  readonly modelByKey: ReadonlyMap<string, TaxonomyEntry>;
}

/** Même formule que `slugify` de `src/types/reference.ts` (non exportée là-bas), dupliquée ici
 * plutôt qu'importée — voir la note de type ci-dessus. */
function slugify(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

function canonicalSlug(entry: TaxonomyEntry, fallback: string): string {
  if (entry.slug !== undefined) return entry.slug;
  if (entry.label !== undefined) return slugify(entry.label);
  return fallback;
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
 * (`EX-NAV-19`/`20`), ET calcule ses slugs CANONIQUES (`EX-SCR-140`, `DR-054`) : un slug erroné (ou
 * absent, route historique `/modele/:makeId/:modelId`) n'empêche jamais l'affichage — l'identifiant
 * fait foi — mais la route retournée porte toujours le slug RELEVÉ dans la taxonomie, à charge de
 * l'appelant de comparer au slug REÇU et de `replaceState` vers `buildPath(resolved.route)` s'ils
 * diffèrent (le câblage dans la coquille est fix-app, `DR-099`). `modelId = 0` est la clé réservée
 * « Modèle non identifié » (`EX-DATA-72`) et n'est JAMAIS traité comme un modèle inconnu (exception
 * unique d'`EX-NAV-20`), à condition que `makeId` existe lui-même — son `modelSlug` d'origine est
 * conservé tel quel (aucune entrée de taxonomie ne le porte par construction).
 */
export function resolveTaxonomyRoute(
  route: ModelDistributionRoute | ModelListingsRoute,
  taxonomy: TaxonomyLookup,
): TaxonomyRouteResult {
  const make = taxonomy.makeById.get(route.makeId);
  if (make === undefined) {
    return { ok: false, error: { kind: 'unknownMake', makeId: route.makeId } };
  }
  const makeSlug = canonicalSlug(make, route.makeSlug);

  if (route.modelId === 0) {
    return { ok: true, route: { ...route, makeSlug } };
  }
  const model = taxonomy.modelByKey.get(modelKeyOf(route.makeId, route.modelId));
  if (model === undefined) {
    return {
      ok: false,
      error: { kind: 'unknownModel', makeId: route.makeId, modelId: route.modelId },
    };
  }
  const modelSlug = canonicalSlug(model, route.modelSlug);
  return { ok: true, route: { ...route, makeSlug, modelSlug } };
}

/* ================================================================================================
 * Transitions mode 1 ↔ mode 2 (`EX-NAV-15`/`16`/`17`, `D-09`, `DR-063`)
 * ================================================================================================
 * `EX-NAV-5` (annexe C) nomme un paramètre `make` distinct qui n'existe pas dans le registre : le
 * couple marque/modèle du mode 1 passe entièrement par `mmmv` (`makesModelsVariants`, annexe B,
 * `EX-SCR-59`/`72`) — arbitrage `D-09`, qui amende `EX-NAV-5`/`15`/`16`/`17` en ce sens (fix-docs).
 * Fonction PURE : ne lit ni le DOM ni l'historique, ne connaît pas la route active — l'appelant
 * (fix-app) lui donne `from`/`to` et le couple choisi, et branche le résultat sur `serializeQuery`.
 * ============================================================================================== */

/** Couple marque/modèle porté par la route en mode 2 (`modelId` absent = « toute la marque »,
 * bloc `mmmv` à un seul segment, `EX-SCR-72`). */
export interface ModeCarryPair {
  readonly makeId: number;
  readonly modelId?: number;
}

/**
 * Transporte une sélection de filtres d'un mode d'écran à l'autre :
 *  - mode 1 → mode 2 (`EX-NAV-15`/`16`) : le bloc `mmmv` du couple CHOISI est absorbé par la route
 *    (`/marche/:makeId-.../:modelId-...`) — retiré de la sélection retournée. Tout autre filtre
 *    PARTAGÉ (posé ou non) est conservé tel quel, y compris s'il n'a plus de sens en mode 2 (le
 *    contrôleur mode 2 applique sa propre scission T/R, `partitionSelection`, `D4`/`DR-006`).
 *  - mode 2 → mode 1 (`EX-NAV-17`) : le couple ACTIF de la route quittée est RÉINJECTÉ dans `mmmv`
 *    (`EX-SCR-72` : `makeId` seul, ou `makeId|modelId`), les autres filtres partagés inchangés.
 *  - même mode des deux côtés : identité (copie défensive), aucun couple à transporter.
 */
export function carryFiltersAcrossMode(
  selection: SelectionState,
  from: ScreenMode,
  to: ScreenMode,
  pair: ModeCarryPair,
): MutableSelectionState {
  const next: MutableSelectionState = { ...selection };
  if (from === to) return next;
  if (from === 'mode1' && to === 'mode2') {
    delete next['makesModelsVariants'];
    return next;
  }
  // from === 'mode2' && to === 'mode1'
  next['makesModelsVariants'] =
    pair.modelId === undefined ? String(pair.makeId) : `${pair.makeId}|${pair.modelId}`;
  return next;
}
