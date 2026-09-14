/**
 * KYCAR — Adaptateur 2dehands (lot D9) : construction d'URL et accès réseau restreint
 * =================================================================================================
 * RÈGLE LICITE NON NÉGOCIABLE (chantier 1, `DECISION-coordinateur-source.md`,
 * `probe-LOT-N.md` req 2/13/15) : seule la page SEO de recherche voitures `/l/auto-s/` (et ses
 * facettes marque/modèle/pagination) est autorisée par `robots.txt`. L'API JSON interne
 * (`/lrp/api/*`, `/lp/api/*`) est en `Disallow` et n'est JAMAIS visée — le même contenu structuré
 * est de toute façon livré par le `__NEXT_DATA__` de la page autorisée (pas besoin de l'API interdite).
 *
 * `buildSearchUrl`/`assertAllowedUrl` sont PURES (aucune I/O) : elles sont testées à l'unité sans
 * réseau. `createHttpTweedehandsFetcher` est la SEULE fonction qui appelle `fetch` — elle n'est
 * JAMAIS invoquée par les tests de ce lot (garantie « aucun appel réseau live », critère D9 #5) ;
 * elle sert uniquement de câblage par défaut pour un futur déploiement (D8).
 */

/** Les deux marchés portés par la même pile Adevinta (probe-LOT-N req 13/14). */
export type TweedehandsMarketplace = 'be' | 'nl';

export interface TweedehandsSearchRequest {
  readonly marketplace: TweedehandsMarketplace;
  /** Slug de marque (ex. `opel`), omis pour l'agrégat racine (toutes marques). */
  readonly brandSlug?: string;
  /** Slug de modèle (ex. `corsa`), exige `brandSlug`. */
  readonly modelSlug?: string;
  /** Page 1-indexée (`/p/N/` au-delà de la page 1). */
  readonly page: number;
}

/** Point d'entrée réseau injectable — c'est CE point que les tests substituent par une fixture. */
export interface TweedehandsFetcher {
  fetchSearchPage(request: TweedehandsSearchRequest): Promise<string>;
}

const ORIGIN_BY_MARKETPLACE: Readonly<Record<TweedehandsMarketplace, string>> = {
  be: 'https://www.2dehands.be',
  nl: 'https://www.marktplaats.nl',
};

/** Chemin racine autorisé par `robots.txt` (probe-LOT-N req 2/13/14) : la page SEO de recherche. */
const SEARCH_PATH = '/l/auto-s';

/**
 * Préfixes explicitement en `Disallow` (API interne) — jamais visés, quel que soit l'appelant.
 * `DECISION-coordinateur-source.md` : « on lit ce qui est autorisé, pas l'API interne ».
 */
const FORBIDDEN_PATH_PREFIXES: readonly string[] = ['/lrp/api/', '/lp/api/'];

/** Pagination licite plafonnée mesurée par le coordinateur (audit 1.5) : au-delà, hors périmètre. */
export const MAX_ALLOWED_PAGE_NUMBER = 167;

/**
 * Caractères LICITES dans un segment de chemin (RFC 3986 `pchar` : `unreserved / sub-delims / : / @`).
 * Tout le reste — `?`, `#`, `/`, `%`, l'espace, les caractères de contrôle — est percent-encodé :
 * sans cela, un slug portant `?` ou `#` SORTAIT du chemin de recherche et le garde de licéité ne le
 * voyait plus (DR-128).
 */
const PATH_SEGMENT_SAFE = /[A-Za-z0-9\-._~!$&'()*+,;=:@]/;

/** Encode un segment de chemin : conserve les `pchar` de la RFC 3986, encode tout le reste. */
export function encodePathSegment(segment: string): string {
  let out = '';
  for (const char of segment) {
    if (PATH_SEGMENT_SAFE.test(char)) {
      out += char;
      continue;
    }
    for (const byte of new TextEncoder().encode(char)) {
      out += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    }
  }
  return out;
}

/**
 * Construit l'URL de la page de recherche autorisée pour une requête. Lève si hors périmètre.
 *
 * DR-128 : la page est VALIDÉE contre la plage licite mesurée (`1..MAX_ALLOWED_PAGE_NUMBER`, audit
 * 1.5) — une page `0`, `-1` ou `1.5` construisait auparavant une URL absurde, et la page 5 000 une
 * URL hors périmètre licite ; et chaque segment est ENCODÉ, pour qu'aucun slug ne puisse sortir du
 * chemin de recherche.
 */
export function buildSearchUrl(request: TweedehandsSearchRequest): string {
  if (request.modelSlug !== undefined && request.brandSlug === undefined) {
    throw new Error('TweedehandsDataProvider: modelSlug exige brandSlug');
  }
  if (!Number.isInteger(request.page) || request.page < 1 || request.page > MAX_ALLOWED_PAGE_NUMBER) {
    throw new Error(
      `TweedehandsDataProvider: page hors de la plage licite 1..${MAX_ALLOWED_PAGE_NUMBER} : ${request.page}`,
    );
  }
  const origin = ORIGIN_BY_MARKETPLACE[request.marketplace];
  const segments = [SEARCH_PATH];
  if (request.brandSlug !== undefined) segments.push(encodePathSegment(request.brandSlug));
  if (request.modelSlug !== undefined) segments.push(encodePathSegment(request.modelSlug));
  let path = `${segments.join('/')}/`;
  if (request.page > 1) path += `p/${request.page}/`;
  const url = origin + path;
  assertAllowedUrl(url);
  return url;
}

/**
 * Garde de licéité : lève si `url` n'est pas sur une origine 2dehands/marktplaats connue, si elle ne
 * porte pas le préfixe `/l/auto-s/` autorisé par `robots.txt`, ou si elle vise un préfixe interdit
 * (API interne). Appelée par `buildSearchUrl` ET par le fetcher réel (double garde, défense en
 * profondeur) avant tout accès réseau.
 */
export function assertAllowedUrl(url: string): void {
  const origin = Object.values(ORIGIN_BY_MARKETPLACE).find((o) => url.startsWith(o));
  if (origin === undefined) {
    throw new Error(`TweedehandsDataProvider: URL hors des origines autorisées : ${url}`);
  }
  const pathAndRest = url.slice(origin.length);
  for (const forbidden of FORBIDDEN_PATH_PREFIXES) {
    if (pathAndRest.includes(forbidden)) {
      throw new Error(`TweedehandsDataProvider: préfixe interdit par robots.txt (API interne) visé : ${url}`);
    }
  }
  // Garde de FRONTIÈRE de segment : `/l/auto-s-motoren/` ne doit PAS matcher `/l/auto-s` (un simple
  // `startsWith` le laisserait passer à tort — le préfixe autorisé s'arrête à une frontière `/`).
  const isOnSearchPath = pathAndRest === SEARCH_PATH || pathAndRest.startsWith(`${SEARCH_PATH}/`);
  if (!isOnSearchPath) {
    throw new Error(
      `TweedehandsDataProvider: chemin hors du préfixe autorisé par robots.txt (${SEARCH_PATH}) : ${url}`,
    );
  }
}

/**
 * Implémentation réseau réelle. JAMAIS appelée dans les tests de ce lot (§ RÈGLE LICITE) : câblage
 * de production uniquement, branché par un lot d'intégration ultérieur (D8). N'accède qu'aux URL
 * validées par `buildSearchUrl`/`assertAllowedUrl` ci-dessus.
 */
export function createHttpTweedehandsFetcher(): TweedehandsFetcher {
  return {
    async fetchSearchPage(request: TweedehandsSearchRequest): Promise<string> {
      const url = buildSearchUrl(request);
      assertAllowedUrl(url); // défense en profondeur : jamais retiré même si buildSearchUrl change
      const response = await fetch(url, {
        // UA identifié (probe-LOT-N req 13) : aucun anti-bot rencontré sur cette surface autorisée.
        headers: { 'User-Agent': 'ClaudeBot' },
      });
      if (!response.ok) {
        throw new Error(`TweedehandsDataProvider: HTTP ${response.status} sur ${url}`);
      }
      return response.text();
    },
  };
}
