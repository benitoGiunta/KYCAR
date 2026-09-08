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
 *
 * `MODEL_UNRESOLVED_ID` n'est PAS redéfini ici : la couche l'exporte déjà, sous le nom
 * `MODEL_ID_UNRESOLVED` (`sentinels.ts`, valeur `0`, EX-DATA-72). Un deuxième nom pour la même
 * valeur créerait exactement la duplication que cette étape supprime.
 */

import type { SnapshotId } from '../providers/DataProvider';
import { NUMERIC_UNKNOWN } from './sentinels';

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
 * NON appliquées ici, faute de référentiel dans le dépôt : l'étape 3 (liste d'arrêt promotionnelle
 * `data/reference/version-stoplist.json`, EX-DATA-30) et les étapes 7 à 10 (jetonisation, cylindrée
 * et puissance au badge, lexique de motorisation). Elles s'insèrent dans cette fonction sans en
 * changer la signature ; leur portage est le reste de DR-025.
 *
 * Le résultat est une DONNÉE textuelle, rendue par le seul contenu textuel — aucune échappement
 * n'est appliqué ici, et aucun n'est requis : la couche de rendu échappe. Une chaîne vide en sortie
 * alors que l'entrée ne l'était pas est le cas d'EX-DATA-31 (`VERSION_FULLY_STRIPPED`), que
 * l'appelant traite ; cette fonction ne pose aucun drapeau.
 */
export function cleanModelVersion(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) return '';

  const normalized = raw
    .normalize('NFKC')
    .replace(VARIATION_SELECTORS, '')
    .replace(INVISIBLE_SEPARATORS, '')
    .replace(PICTOGRAM_RANGES, '')
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
