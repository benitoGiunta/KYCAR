/**
 * KYCAR — Règles métier PARTAGÉES de la couche schéma (lot D2)
 * =================================================================================================
 * Étape 0 de la remédiation 2.6 (`reports/remediation/FIX-LEAD-DECISIONS.md` §C). Ce module porte
 * les seuils, facteurs, clés et fonctions pures que PLUSIEURS lots doivent partager et qu'aucune
 * couche ne portait : chacun était jusqu'ici réinventé (ou absent) dans les providers, le moteur et
 * les écrans. Les définir ici en fait une source unique ; le BRANCHEMENT dans les providers et le
 * moteur relève des clusters de la vague F1, pas de ce module.
 *
 * Module PUR : aucune globale, aucune I/O, aucun état. Les chaînes qu'il produit sont des DONNÉES,
 * jamais du balisage — le rendu (JSX) les échappe.
 *
 * | Symbole | Exigence | Constat de revue |
 * |---|---|---|
 * | `PRICE_SENTINEL_ABSOLUTE_EUR`, `isPriceSentinelAbsolute` | EX-DATA-19(1), EX-DATA-60, ARB-15 | DR-001 |
 * | `HP_TO_KW`, `hpToKw`                                     | EX-SRCH-11bis (ARB-33), EX-DATA-36 | DR-008 |
 * | `listingKey`                                             | EX-DATA-15, ARB-54 | DR-003 |
 * | `DUPLICATE_CONFLICT_FIELDS`                              | ARB-54, EX-DATA-45 | DR-004 |
 * | `MODEL_VERSION_CLEAN_MAX`, `cleanModelVersion`           | EX-DATA-29 étape 6, ARB-61/ADV-17, ARB-24 | DR-025 |
 * | `parseFirstRegistrationYearMonth`                        | EX-DATA-22, EX-DATA-23 | FV §3.2(d), D8-31 |
 *
 * `MODEL_UNRESOLVED_ID` n'est PAS redéfini ici : la couche l'exporte déjà, sous le nom
 * `MODEL_ID_UNRESOLVED` (`sentinels.ts`, valeur `0`, EX-DATA-72). Un deuxième nom pour la même
 * valeur créerait exactement la duplication que cette étape supprime.
 */

import type { SnapshotId } from '../providers/DataProvider';
import { NUMERIC_UNKNOWN } from './sentinels';
import { setIngestFlag } from './vocabularies';

/* ================================================================================================
 * 1. SENTINELLE DE PRIX ABSOLUE (EX-DATA-19(1), EX-DATA-60 — DR-001)
 * ============================================================================================== */

/**
 * Seuil de la sentinelle de prix ABSOLUE, en euros (EX-DATA-19(1)) : une annonce dont le prix
 * affiché est strictement inférieur à ce seuil porte `PRICE_SENTINEL_ABSOLUTE` dans `ingestFlags`.
 * Étage INGESTION, posé une fois par annonce, indépendant de toute sélection — à ne pas confondre
 * avec `PRICE_IMPLAUSIBLE_IN_CELL`, verdict d'ANALYSE recalculé par cellule et jamais stocké.
 */
export const PRICE_SENTINEL_ABSOLUTE_EUR = 250;

/**
 * Vrai si `priceEur` est un prix CONNU sous le seuil absolu d'EX-DATA-19(1). L'annonce reste
 * comptée dans tout effectif (ARB-15) ; elle est seulement exclue de l'échantillon valide de prix
 * `V_price` (EX-DATA-60).
 *
 * Un prix inconnu — `null` (vue décodée) ou la sentinelle `-1` (colonne brute, EX-DATA-120) — n'est
 * PAS une sentinelle absolue : il n'y a pas de prix à juger.
 */
export function isPriceSentinelAbsolute(priceEur: number | null | undefined): boolean {
  if (priceEur === null || priceEur === undefined) return false;
  if (priceEur === NUMERIC_UNKNOWN) return false;
  return priceEur < PRICE_SENTINEL_ABSOLUTE_EUR;
}

/* ================================================================================================
 * 2. CONVERSION CHEVAL-VAPEUR → KILOWATT (ARB-33, EX-DATA-36 — DR-008)
 * ============================================================================================== */

/**
 * Facteur UNIQUE de conversion cheval-vapeur métrique (DIN 66036) → kilowatt : `1 ch = 0,7355 kW`.
 * Aucune autre valeur de ce facteur n'existe dans le corpus (ARB-33) ni ne doit exister dans le
 * dépôt : toute borne saisie en ch se compare à la colonne `powerKw` après passage par `hpToKw`.
 */
export const HP_TO_KW = 0.7355;

/**
 * Convertit une puissance en chevaux vers des kilowatts, SANS arrondi intermédiaire (ARB-33) : la
 * valeur rendue est le produit exact en virgule flottante. Un prédicat de sélection compare cette
 * valeur telle quelle à `powerKw` (`powerKw >= hpToKw(borne)`) ; arrondir ici déplacerait la
 * frontière de la borne et changerait l'effectif.
 */
export function hpToKw(hp: number): number {
  return hp * HP_TO_KW;
}

/* ================================================================================================
 * 3. CLÉ PRIMAIRE D'UNE ANNONCE (EX-DATA-15, ARB-54 — DR-003)
 * ============================================================================================== */

/**
 * Clé primaire de l'entité `Listing` : le couple `(snapshotId, listingId)` d'EX-DATA-15, rendu sous
 * forme de chaîne comparable. C'est le pivot du dédoublonnage d'ARB-54 (première occurrence dans
 * l'ordre d'ingestion total conservée) et la clé d'index des annonces d'un snapshot.
 *
 * `listingId` est un UUID : sa forme canonique est en minuscules, la clé la normalise donc pour que
 * deux écritures de casse différente du même identifiant produisent la même clé.
 */
export function listingKey(snapshotId: SnapshotId, listingId: string): string {
  return `${snapshotId}:${listingId.toLowerCase()}`;
}

/* ================================================================================================
 * 4. CHAMPS COMPARÉS SUR UN DOUBLON (ARB-54 — DR-004)
 * ============================================================================================== */

/**
 * Les QUATRE champs — et seulement ceux-là — dont la divergence entre deux occurrences d'un même
 * `listingId` lève `DUPLICATE_VALUE_CONFLICT` sur l'occurrence conservée et incrémente
 * `Snapshot.duplicateValueConflictCount` (ARB-54, EX-DATA-15). La liste est normative : un
 * adaptateur qui en compare d'autres produit un compteur qui ne veut plus rien dire.
 */
export const DUPLICATE_CONFLICT_FIELDS = [
  'priceEur',
  'priceStatus',
  'mileageKm',
  'firstRegistrationYearMonth',
] as const;

/** Nom d'un champ comparé sur un doublon (ARB-54). */
export type DuplicateConflictField = (typeof DUPLICATE_CONFLICT_FIELDS)[number];

/* ================================================================================================
 * 5. NETTOYAGE DE `modelVersionClean` (EX-DATA-29, ARB-61/ADV-17, ARB-24 — DR-025)
 * ============================================================================================== */

/**
 * Longueur maximale de `modelVersionClean`, en points de code (annexe A # 21 : `chaîne(80)`,
 * EX-DATA-29 étape 6).
 */
export const MODEL_VERSION_CLEAN_MAX = 80;

/** Options de `cleanModelVersion` : la liste d'arrêt est une donnée versionnée, pas une constante. */
export interface CleanModelVersionOptions {
  /** Motifs de l'étape 3 (`data/reference/version-stoplist.json`, EX-DATA-30). Défaut : aucun. */
  readonly stoplist?: readonly string[];
}

/**
 * Étape 2 d'EX-DATA-29 — plages de pictogrammes et de symboles décoratifs, plus la zone privée.
 * Les liants invisibles sont retirés séparément (`INVISIBLE_JOINERS`) pour que chaque classe reste
 * lisible et qu'aucune ne mêle un pictogramme à son sélecteur de variante.
 */
const PICTOGRAM_RANGES =
  /[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{2600}-\u{27BF}\u{E000}-\u{F8FF}]/gu;

/** Étape 2 d'EX-DATA-29 — séparateurs invisibles et liant sans chasse (ZWJ). */
const INVISIBLE_SEPARATORS = /[\u{200B}-\u{200F}\u{2028}-\u{202F}]/gu;

/** Étape 2 d'EX-DATA-29 — sélecteurs de variante (VS1..VS16), retirés à part de tout pictogramme. */
const VARIATION_SELECTORS = /[\u{FE00}-\u{FE0F}]/gu;

/** Étape 4 d'EX-DATA-29 : suite de 2 caractères ou plus pris dans la palette décorative. */
const DECORATIVE_RUNS = /[*\-_=~!.+#|/\\<>]{2,}/gu;

/**
 * Étape 5 d'EX-DATA-29 : tout ce qui n'est ni lettre, ni chiffre, ni `. , - + /`. Les marques
 * combinantes (`\p{M}`) sont conservées avec leur lettre : les retirer viderait ARB-24 de son objet
 * et changerait l'orthographe d'une version décomposée (« Citroën » servi en `e` + tréma).
 */
const RESIDUAL_PUNCTUATION = /[^\p{L}\p{M}\p{N}.,\-+/]/gu;

/** Marque combinante — une coupe ne doit jamais séparer une marque de sa base (ARB-24). */
const COMBINING_MARK = /\p{M}/u;

/** Repli d'une chaîne pour la comparaison de la liste d'arrêt : minuscules, diacritiques retirés. */
function foldForStoplist(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase();
}

/**
 * Étape 3 d'EX-DATA-29 — retrait des marqueurs promotionnels de la liste d'arrêt versionnée
 * (`data/reference/version-stoplist.json`, contenu initial d'EX-DATA-30). Comparaison insensible à
 * la CASSE et aux DIACRITIQUES : le repli s'applique au texte comme au motif, et la coupe se fait
 * sur les index du texte replié — le repli NFKD ne change pas le nombre d'unités de code des lettres
 * latines couvertes par la liste, chaque marque combinante retirée étant reportée sur l'index.
 */
function stripPromotionalMarkers(value: string, stoplist: readonly string[]): string {
  if (stoplist.length === 0) return value;
  let out = value;
  for (const pattern of stoplist) {
    const needle = foldForStoplist(pattern);
    if (needle.length === 0) continue;
    for (;;) {
      const at = foldForStoplist(out).indexOf(needle);
      if (at < 0) break;
      out = `${out.slice(0, at)} ${out.slice(at + needle.length)}`;
    }
  }
  return out;
}

/**
 * Nettoie une version déclarée en texte libre selon `EX-DATA-29`, jusqu'à la troncature d'ARB-61.
 *
 * Étapes appliquées ici (ordre normatif d'EX-DATA-29) :
 *   1. normalisation Unicode NFKC ;
 *   2. suppression des pictogrammes et des séparateurs invisibles ;
 *   4. remplacement des suites décoratives (≥ 2 caractères de `* - _ = ~ ! . + # | / \ < >`) ;
 *   5. repli de la ponctuation résiduelle sur l'espace ;
 *   6. compactage des espaces, `trim`, puis troncature à `MODEL_VERSION_CLEAN_MAX` points de code
 *      sur une FRONTIÈRE DE MOT — le dernier espace d'index strictement inférieur à la limite ; à
 *      défaut d'un tel espace, troncature DURE à exactement la limite, sans chercher au-delà
 *      (ARB-61/ADV-17). La coupe ne sépare jamais une marque combinante de sa base (ARB-24).
 *
 * L'étape 3 (retrait des marqueurs promotionnels) s'applique dès que l'appelant fournit la liste
 * d'arrêt versionnée d'EX-DATA-30 (`ReferenceData.versionStoplist`, chargée depuis
 * `data/reference/version-stoplist.json`) ; sans elle, aucun marqueur n'est retiré — la liste est
 * une DONNÉE versionnée, jamais une constante du code.
 *
 * Les étapes 7 à 10 (jetonisation, cylindrée et puissance au badge, lexique de motorisation)
 * produisent des CHAMPS DISTINCTS (`trimTokens`, `badgeDisplacementL`, `badgePowerRaw`,
 * `driveBadges`), pas `modelVersionClean` : elles sont exposées par `parseModelVersion`.
 *
 * Le résultat est une DONNÉE textuelle, rendue par le seul contenu textuel — aucune échappement
 * n'est appliqué ici, et aucun n'est requis : la couche de rendu échappe. Une chaîne vide en sortie
 * alors que l'entrée ne l'était pas est le cas d'EX-DATA-31 (`VERSION_FULLY_STRIPPED`), que
 * l'appelant traite ; cette fonction ne pose aucun drapeau.
 */
export function cleanModelVersion(
  raw: string | null | undefined,
  options: CleanModelVersionOptions = {},
): string {
  if (raw === null || raw === undefined) return '';

  const step2 = raw
    .normalize('NFKC')
    .replace(VARIATION_SELECTORS, '')
    .replace(INVISIBLE_SEPARATORS, '')
    .replace(PICTOGRAM_RANGES, '');

  const normalized = stripPromotionalMarkers(step2, options.stoplist ?? [])
    .replace(DECORATIVE_RUNS, ' ')
    .replace(RESIDUAL_PUNCTUATION, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

  const points = Array.from(normalized);
  if (points.length <= MODEL_VERSION_CLEAN_MAX) return normalized;

  const lastSpace = points.lastIndexOf(' ', MODEL_VERSION_CLEAN_MAX - 1);
  if (lastSpace > 0) return points.slice(0, lastSpace).join('').trimEnd();

  // Aucune frontière de mot sous la limite : troncature dure, reculée hors d'un groupe de graphèmes.
  let cut = MODEL_VERSION_CLEAN_MAX;
  while (cut > 0 && COMBINING_MARK.test(points[cut] as string)) cut -= 1;
  return points.slice(0, cut).join('');
}

/* ---- EX-DATA-29 étapes 7 à 10 : champs dérivés de la version déclarée ------------------------- */

/** Longueur d'un jeton de finition retenu (annexe A # 22 : `chaîne(24)`, étape 7). */
export const TRIM_TOKEN_MAX_LENGTH = 24;
/** Nombre de jetons de finition conservés (annexe A # 22, étape 7). */
export const TRIM_TOKENS_MAX = 12;

/** Étape 8 — cylindrée au badge : `x,y` avec `x ∈ [0,8]`, retenue si `0,6 ≤ d ≤ 8,0`. */
const BADGE_DISPLACEMENT = /(?<!\d)([0-8])[.,]([0-9])(?!\d)/u;
/** Étape 9 — puissance au badge, avec son unité déclarée. */
const BADGE_POWER = /(?<!\d)(\d{2,3})\s?(ch|cv|hp|pk|kw|kW|PS)(?![a-z])/u;

/** Puissance relevée au badge de la version déclarée (étape 9). Ne remplace JAMAIS `powerKw`. */
export interface BadgePower {
  readonly value: number;
  /** Unité telle qu'elle est écrite dans le texte (`ch`, `cv`, `hp`, `pk`, `kw`, `kW`, `PS`). */
  readonly unit: string;
  /** Forme brute conservée dans `badgePowerRaw`. */
  readonly raw: string;
}

/** Champs dérivés de la version déclarée (EX-DATA-29 étapes 7 à 10). */
export interface ParsedModelVersion {
  /** `modelVersionClean` (étapes 1 à 6). */
  readonly clean: string;
  /** Étape 7 : jetons de finition, majuscules, dédupliqués, triés, 12 au plus. */
  readonly trimTokens: readonly string[];
  /** Étape 8 : cylindrée au badge en litres, ou `null`. */
  readonly badgeDisplacementL: number | null;
  /** Étape 9 : puissance au badge, ou `null`. */
  readonly badgePower: BadgePower | null;
  /** Étape 10 : mentions de motorisation du lexique FERMÉ, dans l'ordre du lexique. */
  readonly driveBadges: readonly string[];
}

/** Options de `parseModelVersion`. */
export interface ParseModelVersionOptions extends CleanModelVersionOptions {
  /** Liste d'arrêt de JETONS de l'étape 7 (repli sur la liste d'arrêt promotionnelle). */
  readonly tokenStoplist?: readonly string[];
  /** Lexique FERMÉ de l'étape 10 (`data/reference/version-lexicon.json`). Défaut : aucun. */
  readonly driveBadgeLexicon?: readonly string[];
}

/**
 * Applique les étapes 7 à 10 d'EX-DATA-29 sur une version déclarée, en plus du nettoyage des étapes
 * 1 à 6. Fonction PURE : aucune donnée n'est codée en dur, la liste d'arrêt et le lexique sont
 * fournis par le référentiel versionné.
 *
 * Étape 7 — jetonisation : découpe sur l'espace ; un jeton est retenu s'il fait 2 à 24 caractères,
 * s'il n'est pas exclusivement numérique, et s'il n'appartient pas à la liste d'arrêt de jetons ;
 * majuscules ; déduplication ; tri lexicographique croissant par point de code ; 12 premiers.
 * Étape 8 — cylindrée au badge : premier appariement, retenu si `0,6 ≤ d ≤ 8,0`.
 * Étape 9 — puissance au badge : premier appariement, conservé AVEC son unité ; la valeur du badge
 * ne remplace jamais `powerKw` (le contrôle d'écart de 10 % et `VERSION_POWER_MISMATCH` relèvent de
 * l'ingestion, qui seule connaît `powerKw`).
 * Étape 10 — mentions de motorisation : appariement du lexique FERMÉ, jamais une déduction.
 */
export function parseModelVersion(
  raw: string | null | undefined,
  options: ParseModelVersionOptions = {},
): ParsedModelVersion {
  const clean = cleanModelVersion(raw, options);

  const tokenStop = new Set((options.tokenStoplist ?? []).map((t) => foldForStoplist(t)));
  const tokens = new Set<string>();
  for (const piece of clean.split(' ')) {
    const token = piece.trim();
    const points = Array.from(token);
    if (points.length < 2 || points.length > TRIM_TOKEN_MAX_LENGTH) continue;
    if (/^\p{N}+$/u.test(token)) continue;
    if (tokenStop.has(foldForStoplist(token))) continue;
    tokens.add(token.toUpperCase());
  }
  const trimTokens = [...tokens].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).slice(0, TRIM_TOKENS_MAX);

  let badgeDisplacementL: number | null = null;
  const displacement = BADGE_DISPLACEMENT.exec(clean);
  if (displacement !== null) {
    const value = Number(`${displacement[1] as string}.${displacement[2] as string}`);
    if (value >= 0.6 && value <= 8.0) badgeDisplacementL = value;
  }

  let badgePower: BadgePower | null = null;
  const power = BADGE_POWER.exec(clean);
  if (power !== null) {
    badgePower = { value: Number(power[1] as string), unit: power[2] as string, raw: power[0] };
  }

  // Le lexique est écrit sous une forme canonique (`s-line`, `m-sport`) que le texte libre écrit
  // indifféremment « S line », « S-Line » ou « Sline » : l'appariement replie les séparateurs des
  // DEUX côtés. Il reste un appariement du lexique FERMÉ, jamais une déduction.
  const foldBadge = (value: string): string => foldForStoplist(value).replace(/[\s\-_]/gu, '');
  const folded = foldBadge(clean);
  const driveBadges: string[] = [];
  for (const badge of options.driveBadgeLexicon ?? []) {
    const needle = foldBadge(badge);
    if (needle.length > 0 && folded.includes(needle)) driveBadges.push(badge);
  }

  return { clean, trimTokens, badgeDisplacementL, badgePower, driveBadges };
}

/* ================================================================================================
 * 6. PREMIÈRE IMMATRICULATION (EX-DATA-22, EX-DATA-23 — D8-31)
 * ============================================================================================== */

/**
 * Les DEUX seules formes admises par `EX-DATA-23`, dans l'ordre d'essai normatif :
 * `YYYY-MM` (vocabulaire de CRÉATION, `format: year-month` de l'OpenAPI) puis `MM/YYYY`
 * (vocabulaire de RECHERCHE, la forme observée). Les motifs sont ANCRÉS et le mois y est énuméré
 * (`0[1-9]|1[0-2]`) : ni `00`, ni `13`, ni un mois sur un chiffre, ni une année sur deux chiffres
 * ne peuvent traverser. C'est l'« aucune tolérance » du dictionnaire, écrit dans l'expression et
 * non laissé à une vérification ultérieure qu'un appelant pourrait oublier.
 */
const FIRST_REG_CREATION_FORM = /^(\d{4})-(0[1-9]|1[0-2])$/u;
const FIRST_REG_SEARCH_FORM = /^(0[1-9]|1[0-2])\/(\d{4})$/u;

/**
 * Résultat du parsing d'`EX-DATA-23`. Il porte À LA FOIS la valeur et le drapeau : c'est la seule
 * façon de garantir qu'aucun chemin d'ingestion ne pose la valeur `INCONNU` en oubliant
 * `FIRST_REG_UNPARSEABLE` — l'écart relevé en 2.7 (le drapeau n'était posé nulle part).
 */
export interface ParsedFirstRegistration {
  /**
   * La valeur stockée par KYCAR : une chaîne de 7 caractères `YYYY-MM` (`EX-DATA-22`, annexe A
   * champ 30), ou `null` = `INCONNU`. Jamais une date journalière : la source ne connaît pas le jour.
   */
  readonly yearMonth: string | null;
  /** Année sur 4 chiffres, ou `null`. Le contrôle de bornes est celui de l'annexe A (champ 31). */
  readonly year: number | null;
  /** Mois dans `1..12`, ou `null`. */
  readonly month: number | null;
  /**
   * Forme COLONNAIRE de la valeur : `12·année + (mois − 1)`, l'encodage `Int32` de la colonne
   * `firstRegistrationYearMonth` (`columns.ts`), ou la sentinelle `NUMERIC_UNKNOWN` (`EX-DATA-120`).
   */
  readonly encoded: number;
  /**
   * Vrai si la valeur était PRÉSENTE et illisible. Un champ ABSENT (`null` / `undefined`) vaut
   * `INCONNU` sans drapeau : l'annexe A (champ 30, colonne « Si absent ») ne réclame un drapeau que
   * pour une valeur servie et non interprétable, et `EX-DATA-23` ne parle que des FORMES reçues.
   * HYPOTHÈSE (E4) : une chaîne VIDE est traitée comme une valeur servie illisible, donc drapeautée
   * — la source a bien émis le champ.
   */
  readonly unparseable: boolean;
  /** Le masque `ingestFlags` reçu, augmenté de `FIRST_REG_UNPARSEABLE` le cas échéant. */
  readonly ingestFlags: number;
}

/**
 * `EX-DATA-23` — parsing de `firstRegistrationYearMonth`.
 *
 * Essaie `YYYY-MM` puis `MM/YYYY` ; toute autre forme donne `INCONNU` **et**
 * `ingestFlags += FIRST_REG_UNPARSEABLE`. Aucune tolérance : ni mois `00`/`13`, ni année à
 * 2 chiffres, ni espaces d'encadrement (les motifs sont ancrés — un `trim` silencieux
 * transformerait « aucune tolérance » en « une tolérance non écrite »).
 *
 * Ce module ne fait PAS le contrôle de bornes de l'annexe A (`1900-01 ≤ v ≤ (observedAt.year+1)-12`,
 * drapeau `FIRST_REG_OUT_OF_RANGE`) : c'est une validation d'annexe A, portée par `validation.ts` et
 * les adaptateurs, sur une valeur déjà LUE. Les deux étages restent distincts, comme leurs deux
 * drapeaux.
 *
 * @param raw valeur servie par la source (`condition.firstRegistrationDate`), `null`/`undefined` si
 *   le champ est absent.
 * @param ingestFlags masque `ingestFlags` de l'annonce en cours (défaut `0`) — retourné augmenté,
 *   jamais muté.
 */
export function parseFirstRegistrationYearMonth(
  raw: string | null | undefined,
  ingestFlags = 0,
): ParsedFirstRegistration {
  const absent: ParsedFirstRegistration = {
    yearMonth: null,
    year: null,
    month: null,
    encoded: NUMERIC_UNKNOWN,
    unparseable: false,
    ingestFlags,
  };
  if (raw === null || raw === undefined) return absent;

  const creation = FIRST_REG_CREATION_FORM.exec(raw);
  const search = creation === null ? FIRST_REG_SEARCH_FORM.exec(raw) : null;
  const year = creation !== null ? Number(creation[1]) : search !== null ? Number(search[2]) : null;
  const month = creation !== null ? Number(creation[2]) : search !== null ? Number(search[1]) : null;
  if (year === null || month === null) {
    return { ...absent, unparseable: true, ingestFlags: setIngestFlag(ingestFlags, 'FIRST_REG_UNPARSEABLE') };
  }
  return {
    yearMonth: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`,
    year,
    month,
    encoded: 12 * year + (month - 1),
    unparseable: false,
    ingestFlags,
  };
}
