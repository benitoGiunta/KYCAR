/**
 * KYCAR — Adaptateur 2dehands (lot D9) : formes brutes de `__NEXT_DATA__` et extraction
 * =================================================================================================
 * Formes du JSON embarqué dans la page SEO `/l/auto-s/` de 2dehands.be / marktplaats.nl, telles que
 * documentées par `probe-LOT-N.md` (« Constat structurant n°2 ») : chaque annonce porte `attributes`
 * + `extendedAttributes` (paires clé/valeur), plus des champs racine (`itemId`, `vipUrl`, `priceInfo`,
 * `location`, `date`). Ces types sont volontairement permissifs (`[key: string]: unknown` sur
 * `RawListing`) : la charge réelle peut porter davantage de champs que ceux déclarés ici — y compris,
 * potentiellement, des champs vendeur identifiants (E1..E14, §A.7). `normalize.ts` ne LIT jamais ces
 * champs additionnels : il ne fait QUE projeter, un par un, les champs explicitement mappés
 * ci-dessous vers le vocabulaire KYCAR. C'est la garantie R3 « à l'ingestion » (P-2, EX-NFR-26).
 */

/** Une paire attribut de 2dehands (`attributes[]` / `extendedAttributes[]`). */
export interface RawAttribute {
  readonly key: string;
  readonly value: string;
}

export interface RawPriceInfo {
  readonly priceCents?: number;
  readonly priceType?: string;
}

/**
 * Géolocalisation de l'annonce. JAMAIS lue par `normalize.ts` au-delà de `countryAbbreviation`
 * (marché) : `cityName`/`lat`/`long` sont des champs E9/E11 interdits par R3 s'ils devaient être
 * recopiés tels quels dans une structure KYCAR — l'adaptateur ne les recopie donc jamais.
 */
export interface RawLocation {
  readonly cityName?: string;
  readonly countryAbbreviation?: string;
  readonly lat?: number;
  readonly long?: number;
}

/**
 * Une annonce brute telle que servie par `__NEXT_DATA__`. L'index de signature `[key: string]:
 * unknown` documente que la charge réelle peut porter des propriétés non déclarées ici (ex. un futur
 * bloc `seller.{phone,contactName}` ajouté par 2dehands sans préavis, cf. A7 = 3/5 stabilité,
 * `probe-LOT-N.md`) : `normalize.ts` ne les touche jamais, par construction (allowlist, pas spread).
 */
export interface RawListing {
  readonly itemId: string;
  readonly vipUrl: string;
  readonly priceInfo?: RawPriceInfo;
  readonly location?: RawLocation;
  readonly date?: string;
  readonly attributes?: readonly RawAttribute[];
  readonly extendedAttributes?: readonly RawAttribute[];
  readonly [key: string]: unknown;
}

/**
 * `props.pageProps.searchRequestAndResponse` d'une page de recherche autorisée. `totalResultCount`
 * est EXHAUSTIF par construction (DECISION-coordinateur-source.md) ; `listings` n'est qu'un
 * ÉCHANTILLON (30/page, probe-LOT-N req 13) — jamais la population complète au-delà de la page lue.
 */
export interface RawSearchResponse {
  readonly totalResultCount: number;
  readonly listings: readonly RawListing[];
}

interface NextDataShape {
  readonly props?: {
    readonly pageProps?: {
      readonly searchRequestAndResponse?: {
        readonly totalResultCount?: unknown;
        readonly listings?: unknown;
      };
    };
  };
}

/** Isole le contenu du `<script id="__NEXT_DATA__">` d'une page HTML. */
export function extractNextDataScript(html: string): string {
  const match = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  const content = match?.[1];
  if (content === undefined) {
    throw new Error('TweedehandsDataProvider: bloc __NEXT_DATA__ introuvable dans la page');
  }
  return content;
}

/**
 * Parse une page de recherche autorisée en `RawSearchResponse` typé. Lève si la forme attendue
 * (`searchRequestAndResponse.{totalResultCount,listings}`) n'est pas au rendez-vous — signal de
 * dérive de schéma (A7, `probe-LOT-N.md`) plutôt qu'un agrégat silencieusement faux.
 */
export function parseSearchResponse(html: string): RawSearchResponse {
  const json = extractNextDataScript(html);
  const parsed = JSON.parse(json) as NextDataShape;
  const response = parsed.props?.pageProps?.searchRequestAndResponse;
  if (
    response === undefined ||
    typeof response.totalResultCount !== 'number' ||
    !Array.isArray(response.listings)
  ) {
    throw new Error(
      'TweedehandsDataProvider: forme de __NEXT_DATA__ inattendue (searchRequestAndResponse manquant ou malformé)',
    );
  }
  return { totalResultCount: response.totalResultCount, listings: response.listings as readonly RawListing[] };
}

/** Recherche la première valeur d'une clé d'attribut, dans `attributes` puis `extendedAttributes`. */
export function getAttr(listing: RawListing, key: string): string | undefined {
  const norm = key.toLowerCase();
  const pools = [listing.attributes, listing.extendedAttributes];
  for (const pool of pools) {
    if (pool === undefined) continue;
    for (const attr of pool) {
      if (attr.key.toLowerCase() === norm) return attr.value;
    }
  }
  return undefined;
}

/** Toutes les valeurs d'une clé d'attribut répétable (ex. `options`), dans l'ordre d'apparition. */
export function getAllAttrValues(listing: RawListing, key: string): readonly string[] {
  const norm = key.toLowerCase();
  const values: string[] = [];
  const pools = [listing.attributes, listing.extendedAttributes];
  for (const pool of pools) {
    if (pool === undefined) continue;
    for (const attr of pool) {
      if (attr.key.toLowerCase() === norm) values.push(attr.value);
    }
  }
  return values;
}
