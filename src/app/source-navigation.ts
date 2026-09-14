/**
 * KYCAR — La source SERVIE suit l'URL COURANTE (remédiation `ACC-26`, phase 3.5)
 * =================================================================================================
 * **Règle** : *l'URL est la déclaration partageable de la source (`DF-2`, `D-03`) ; la source servie
 * est toujours celle que l'URL courante nomme.*
 *
 * `main.tsx` choisit le provider **une seule fois**, au démarrage, d'après `window.location.search`
 * (`resolveProviderSpec`) : le registre, le chargeur de fixtures, le moteur et le contrôleur sont
 * assemblés autour de cette décision. Une navigation INTERNE (`pushState`) ne les traverse pas.
 * Jusqu'à `ACC-26`, rouvrir une recherche enregistrée sous `?provider=synthetic` depuis une page
 * amorcée par défaut écrivait donc une URL qui NOMME `synthetic` pendant que l'écran SERVAIT le jeu
 * de fixtures — un mensonge silencieux, exactement ce que `D-03` interdit, et la carte de l'écran E
 * en tirait un écart entre DEUX sources (« − 64 785 offres depuis le 14/09 »).
 *
 * Ce module est la fonction de décision de ce cas, PURE et testable : à partir de l'URL cible, de la
 * requête courante et de la spécification amorcée, il rend l'URL finale (réservés d'`ACC-20`
 * reconduits) et le MODE de navigation :
 *
 *   - `internal` — la cible résout la MÊME spécification que l'amorçage : `pushState`, rien ne bouge
 *     du côté des données, aucun rechargement inutile ;
 *   - `full` — la cible résout une AUTRE spécification : `window.location.assign`, et `main.tsx`
 *     ré-amorce l'application sur la source que l'URL nomme.
 *
 * Deux propriétés valent d'être dites, parce qu'elles sont ce qui rend la règle applicable :
 *   1. la spécification de la cible est celle que le REGISTRE retiendrait, repli compris : une
 *      valeur inconnue ou non câblée retombe sur le défaut, donc ne déclenche AUCUN rechargement
 *      quand l'amorçage est déjà le défaut — sans quoi une URL fautive rechargerait en boucle ;
 *   2. la décision est IDEMPOTENTE : rejouée sur la cible d'une navigation complète, une fois
 *      celle-ci amorcée, elle rend `internal`. Aucune boucle possible (sonde `R-D8-ACC26-02`).
 */

import {
  DEFAULT_PROVIDER_SPEC,
  PROVIDER_URL_PARAM,
  resolveProviderSpec,
  type ProviderSpec,
} from '../providers/registry';
import { carryReservedParams, reservedParamsOf } from '../state/url-codec';

/**
 * Ce que la coquille doit savoir de l'amorçage pour décider. `main.tsx` le construit une fois et le
 * passe en propriété : la coquille ne relit JAMAIS `window.location.search` pour deviner la source
 * servie — l'URL a pu être réécrite cent fois depuis le démarrage.
 */
export interface BootSource {
  /** Spécification RETENUE au démarrage, après repli éventuel : la source réellement servie. */
  readonly spec: ProviderSpec;
  /**
   * Spécification que retiendrait une URL SANS `?provider=` (variable de build, à défaut `D3-01`).
   * C'est la source d'une cible qui ne nomme rien — le cas des recherches enregistrées d'avant
   * `ACC-20` et des liens internes écrits sans paramètre.
   */
  readonly specWithoutUrlParam: ProviderSpec;
}

/** Amorçage neutre : la source par défaut (`D3-01`). Repli hors navigateur et en test. */
export const DEFAULT_BOOT_SOURCE: BootSource = {
  spec: DEFAULT_PROVIDER_SPEC,
  specWithoutUrlParam: DEFAULT_PROVIDER_SPEC,
};

/** Mode d'une navigation : dans le document courant, ou en rechargeant le document. */
export type NavigationMode = 'internal' | 'full';

/** Décision de navigation : l'URL finale, son mode, et les deux spécifications comparées. */
export interface PlannedNavigation {
  /** URL à écrire (paramètres réservés d'`ACC-20` reconduits depuis la requête courante). */
  readonly target: string;
  readonly mode: NavigationMode;
  /** Spécification que l'URL cible NOMME, après résolution par le registre (repli compris). */
  readonly targetSpec: ProviderSpec;
  /** Spécification amorcée, donc servie par le document courant. */
  readonly bootSpec: ProviderSpec;
}

/**
 * Construit l'amorçage à partir des mêmes entrées que `main.tsx` : la requête de démarrage et
 * l'environnement de build. Les deux champs sont résolus par le REGISTRE, jamais réinterprétés ici.
 */
export function bootSourceOf(
  search: string | null,
  env?: Readonly<Record<string, string | undefined>> | null,
): BootSource {
  return {
    spec: resolveProviderSpec({ search, env }).spec,
    specWithoutUrlParam: resolveProviderSpec({ search: '', env }).spec,
  };
}

/**
 * Spécification qu'une URL NOMME, du point de vue d'un amorçage donné. Une URL sans `?provider=` ne
 * nomme rien : elle vaut la source « sans paramètre » (variable de build ou défaut).
 */
export function specOfUrl(url: string, boot: BootSource = DEFAULT_BOOT_SOURCE): ProviderSpec {
  const q = url.indexOf('?');
  const requested = q === -1 ? undefined : reservedParamsOf(url.slice(q))[PROVIDER_URL_PARAM];
  if (requested === undefined) return boot.specWithoutUrlParam;
  // Le registre, et lui seul, dit ce qu'une valeur vaut : inconnue ou non câblée, elle retombe sur
  // le défaut (`ET-SOURCE-REPLI`). La valeur est réencodée pour traverser `URLSearchParams` telle
  // quelle (un `&` ou un `=` dans la valeur ne doit pas devenir un second paramètre).
  return resolveProviderSpec({ search: `?${PROVIDER_URL_PARAM}=${encodeURIComponent(requested)}` }).spec;
}

/** Décision seule, sur une URL DÉJÀ finale (réservés reconduits). */
export type SourceNavigationDecision = Omit<PlannedNavigation, 'target'>;

/**
 * Compare la source que l'URL (finale) NOMME à celle qui est SERVIE, et rend le mode de navigation.
 * C'est l'unique arbitre d'`ACC-26` : `navigate` l'applique après la reconduction des réservés
 * d'`ACC-20` (que le point de passage garde visible, `R-D8-ACC20-04`), l'écran E l'applique par
 * `planNavigation` — la même fonction, donc la même décision : ce que la carte annonce est
 * exactement ce que « Ouvrir » fera.
 */
export function decideSourceNavigation(
  url: string,
  boot: BootSource = DEFAULT_BOOT_SOURCE,
): SourceNavigationDecision {
  const targetSpec = specOfUrl(url, boot);
  return { targetSpec, bootSpec: boot.spec, mode: targetSpec === boot.spec ? 'internal' : 'full' };
}

/**
 * Reconduit les paramètres réservés (`ACC-20`) PUIS décide (`ACC-26`) : la planification complète
 * d'une navigation, telle que `navigate` l'exécute en deux temps.
 */
export function planNavigation(
  url: string,
  currentSearch: string,
  boot: BootSource = DEFAULT_BOOT_SOURCE,
): PlannedNavigation {
  const target = carryReservedParams(url, currentSearch);
  return { target, ...decideSourceNavigation(target, boot) };
}

/**
 * Libellé COURT d'une source, pour la nommer dans une phrase (`EX-SCR-212`/`213` : « source :
 * synthétique — ouvrir pour recalculer »). Le registre porte des libellés COMPLETS, faits pour une
 * étiquette de provenance (« Jeu synthétique généré à la volée (100 000 annonces) ») : illisibles au
 * milieu d'une carte de recherche enregistrée.
 */
const SHORT_SOURCE_LABELS: Readonly<Record<ProviderSpec, string>> = {
  'fixture:test': 'fixtures, profil test',
  'fixture:dev': 'fixtures, profil dev',
  'fixture:perf': 'fixtures, profil perf',
  synthetic: 'synthétique',
  tweedehands: '2dehands',
};

/** Libellé court d'une spécification ; la spécification elle-même si elle est hors registre. */
export function shortSourceLabel(spec: ProviderSpec | string): string {
  return SHORT_SOURCE_LABELS[spec as ProviderSpec] ?? spec;
}
