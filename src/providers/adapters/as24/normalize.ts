/**
 * KYCAR — Primitives de NORMALISATION de l'adaptateur `as24 → canonique`
 * =================================================================================================
 * `EX-DATA-2` fixe l'ordre : **normalisation, PUIS validation**. Toute borne s'entend donc sur une
 * valeur déjà exprimée dans l'unité canonique (`EX-DATA-4`) et déjà arrondie (`EX-DATA-6`), et toute
 * chaîne a déjà subi `EX-DATA-7` avant la moindre comparaison, le moindre hachage et la moindre
 * troncature.
 *
 * Module PUR : aucune I/O, aucun état, aucune globale. Chaque fonction porte l'exigence qu'elle
 * applique — c'est ce qui rend la table §3.1 de `docs/data/DATA-MODEL.md` vérifiable ligne à ligne.
 */

/**
 * `EX-DATA-6` — arrondi **demi vers l'infini en valeur absolue** (« half away from zero »).
 * L'arrondi bancaire est explicitement INTERDIT : `Math.round` est déjà faux pour les négatifs
 * (`Math.round(-0.5) === -0`), et `toFixed` arrondit sur la représentation décimale, pas sur la
 * valeur. On arrondit donc à la main, sur la valeur mise à l'échelle.
 *
 * @param value valeur à arrondir.
 * @param decimals nombre de décimales conservées (0 = entier).
 */
export function roundHalfAwayFromZero(value: number, decimals = 0): number {
  if (!Number.isFinite(value)) return Number.NaN;
  const factor = 10 ** decimals;
  const scaled = value * factor;
  const rounded = scaled < 0 ? -Math.floor(-scaled + 0.5) : Math.floor(scaled + 0.5);
  return rounded / factor;
}

/**
 * TRONCATURE (et non arrondi) à `decimals` décimales, pour les champs dont `DATA-MODEL` §3.1 dit
 * explicitement « troncature au-delà » : `vatRate` (# 14, règle de la source), `co2Emissions`
 * (# 49) et les consommations (# 51, # 52). Tronquer, c'est ne jamais inventer un dixième que la
 * source n'a pas servi.
 *
 * L'échelle passe par un arrondi à 6 décimales AVANT la troncature : sans lui, `5.6 * 10` vaut
 * `55.99999999999999` en binaire et la troncature rendrait `5.5` — la valeur SERAIT changée par le
 * codage flottant, pas par la règle.
 */
export function truncateDecimals(value: number, decimals = 1): number {
  if (!Number.isFinite(value)) return Number.NaN;
  const factor = 10 ** decimals;
  const scaled = roundHalfAwayFromZero(value * factor, 6);
  const truncated = scaled < 0 ? Math.ceil(scaled) : Math.floor(scaled);
  return truncated / factor;
}

/**
 * Caractères de contrôle Unicode (C0 hors tabulation et sauts de ligne, DEL, C1) retirés par
 * `EX-DATA-7`. Écrits en séquences d'échappement : un caractère de contrôle littéral dans une
 * source est invisible en revue et se perd à la première copie.
 */
// La classe de caractères de CONTRÔLE est précisément l'objet de la règle `EX-DATA-7` : les
// retirer d'une chaîne source est le travail de normalisation, pas une inattention d'écriture.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu;

/**
 * `EX-DATA-7` — normalisation de TOUTE chaîne avant comparaison, hachage ou troncature :
 * NFC, retrait des caractères de contrôle (tabulation et saut de ligne compris, repliés sur
 * l'espace), compactage des espaces, `trim`.
 *
 * Rend `null` pour une entrée absente OU vide après normalisation : « une chaîne vide » n'est pas
 * une valeur du dictionnaire, c'est un INCONNU (le schéma source impose d'ailleurs `minLength: 1`
 * à tous les champs textuels).
 */
export function normalizeText(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  // Chemin RAPIDE, sans changement de sémantique : une chaîne faite uniquement d'imprimables ASCII,
  // sans espace de bord ni espace double, est déjà sa propre forme normalisée — NFC est l'identité
  // sur l'ASCII, il n'y a aucun caractère de contrôle à retirer et aucun espace à compacter. Ce cas
  // couvre la quasi-totalité des champs d'une annonce (codes, identifiants, URL) et évite quatre
  // passes d'expression régulière par champ, sur ~18 champs par ligne et 20 000 lignes par snapshot.
  if (ASCII_ALREADY_NORMAL.test(raw)) return raw.length === 0 ? null : raw;
  const out = raw
    .normalize('NFC')
    .replace(/[\t\n\r]/gu, ' ')
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/gu, ' ')
    .trim();
  return out.length === 0 ? null : out;
}

/** Tronque à `max` POINTS DE CODE (jamais à `max` unités UTF-16 : une paire de substituts compte 1). */
export function truncateCodePoints(value: string, max: number): string {
  const points = Array.from(value);
  return points.length <= max ? value : points.slice(0, max).join('');
}

/**
 * Paramètres de campagne retirés de `listingUrl` (# 2). La liste est CLOSE et nommée par
 * `DATA-MODEL` §3.1 : `utm_*`, `cldtidx`, `search_id`, `query_id`. Retirer davantage changerait le
 * deeplink ; en retirer moins ferait de deux URL de la même annonce deux chaînes différentes.
 */
const CAMPAIGN_PARAM = /^(utm_.*|cldtidx|search_id|query_id)$/i;

/**
 * Chaîne DÉJÀ normalisée au sens d'`EX-DATA-7` : imprimables ASCII (`\x20`-`\x7E`), sans espace en
 * tête ni en fin, sans espace double. Le motif est volontairement STRICT — au moindre doute, la
 * chaîne repasse par le chemin complet.
 */
const ASCII_ALREADY_NORMAL = /^(?:[\x21-\x7E]+(?: [\x21-\x7E]+)*)?$/;

/** URL `https` sans identifiants, sans port, sans requête et sans fragment : rien à nettoyer. */
const FAST_HTTPS_URL = /^https:\/\/([A-Za-z0-9.-]+)(\/[^?#]*)?$/;

/** Résultat du nettoyage d'un deeplink d'annonce. */
export interface NormalizedListingUrl {
  /** URL nettoyée, ou `null` si elle est inexploitable (à rejeter, `EX-DATA-14`). */
  readonly url: string | null;
  /** Hôte de l'URL, en minuscules, ou `null`. */
  readonly host: string | null;
}

/**
 * `# 2` — normalise le deeplink public : schéma forcé `https`, fragment supprimé, paramètres de
 * campagne retirés, `EX-DATA-7`, puis troncature à 512 points de code (annexe A).
 *
 * Ne juge PAS l'hôte : le contrôle de domaine (`autoscout24.<tld>`, `EX-DATA-14`) est une
 * VALIDATION, faite après, par l'adaptateur — l'ordre d'`EX-DATA-2`.
 */
export function normalizeListingUrl(raw: string | null | undefined): NormalizedListingUrl {
  const text = normalizeText(raw);
  if (text === null) return { url: null, host: null };
  // Chemin RAPIDE : une URL `https` sans requête ni fragment n'a ni schéma à forcer, ni paramètre de
  // campagne à retirer, ni fragment à couper — le nettoyage est l'identité. Construire un objet
  // `URL`, itérer ses paramètres et le re-sérialiser coûterait, pour rien, sur chaque ligne.
  const direct = FAST_HTTPS_URL.exec(text);
  if (direct !== null) return { url: truncateCodePoints(text, 512), host: (direct[1] as string).toLowerCase() };
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return { url: null, host: null };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { url: null, host: null };
  parsed.protocol = 'https:';
  parsed.hash = '';
  for (const key of [...parsed.searchParams.keys()]) {
    if (CAMPAIGN_PARAM.test(key)) parsed.searchParams.delete(key);
  }
  const host = parsed.host.toLowerCase();
  return { url: truncateCodePoints(parsed.toString(), 512), host };
}

/**
 * `EX-DATA-14` — l'hôte appartient-il au domaine attendu ? Vrai pour `autoscout24.<tld>` et pour
 * ses sous-domaines (`www.autoscout24.be`), faux pour un homographe (`notautoscout24.be`) : la
 * comparaison porte sur une FRONTIÈRE d'étiquette, jamais sur une sous-chaîne.
 */
export function hostMatchesDomain(host: string | null, domain = 'autoscout24'): boolean {
  if (host === null) return false;
  const labels = host.toLowerCase().split('.');
  // `<domaine>.<tld>` : l'avant-dernière étiquette doit être exactement le domaine.
  return labels.length >= 2 && labels[labels.length - 2] === domain.toLowerCase();
}

/** Forme canonique d'un `listingId` (annexe A # 1) : UUID 8-4-4-4-12 en minuscules. */
export const LISTING_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * `# 1` — encode un UUID canonique sur **16 octets binaires** (`ListingColumnBatch.listingId`,
 * `EX-DATA-119`). L'entrée doit déjà être normalisée et validée : cette fonction ne juge rien.
 */
export function uuidToBytes(uuid: string, out: Uint8Array, offset = 0): void {
  let byte = 0;
  for (let i = 0; i < uuid.length; i += 1) {
    const c = uuid.charCodeAt(i);
    if (c === 0x2d) continue; // '-'
    const hi = hexValue(c);
    const lo = hexValue(uuid.charCodeAt(i + 1));
    out[offset + byte] = (hi << 4) | lo;
    byte += 1;
    i += 1;
  }
}

function hexValue(code: number): number {
  if (code >= 0x30 && code <= 0x39) return code - 0x30; // 0-9
  if (code >= 0x61 && code <= 0x66) return code - 0x61 + 10; // a-f
  return 0;
}

/**
 * Table de traduction `EX-DATA-40` — code de MARCHÉ (recherche AutoScout24) → ISO-3166-1 alpha-2.
 * D3-07 ajoute `ca → CA` : la 9ᵉ valeur de `KYCAR_MARKETPLACE` est le Canada, prouvé par
 * l'OpenAPI du dépôt. Le drapeau `MARKETPLACE_UNMAPPED` (`ARB-60`) reste la sortie de secours pour
 * un code hors de cette table, servi par une source réelle.
 */
export const MARKETPLACE_CODE_TO_ISO: Readonly<Record<string, string>> = Object.freeze({
  B: 'BE',
  D: 'DE',
  A: 'AT',
  E: 'ES',
  F: 'FR',
  I: 'IT',
  L: 'LU',
  NL: 'NL',
  CA: 'CA',
});

/**
 * Correspondance ISO → code du vocabulaire `KYCAR_MARKETPLACE`, seul vocabulaire auquel la colonne
 * `countryCode` (un octet) est adossée dans le lot colonnaire : la valeur stockée est l'INDEX du
 * code dans ce vocabulaire (convention posée par `generate.ts` / `selection.ts`, D3). Un pays ISO
 * valide hors de ces neuf marchés n'a donc pas de place dans la colonne : il vaut INCONNU, sans
 * drapeau — c'est une limite d'INTERFACE, pas un défaut de donnée, et elle est comptée dans
 * `unknownCountByField.countryCode`.
 */
export const ISO_TO_MARKETPLACE_CODE: Readonly<Record<string, string>> = Object.freeze({
  BE: 'be',
  NL: 'nl',
  DE: 'de',
  AT: 'at',
  ES: 'es',
  FR: 'fr',
  IT: 'it',
  LU: 'lu',
  CA: 'ca',
});
