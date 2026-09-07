/**
 * KYCAR — Sentinelles typées du modèle colonnaire (EX-DATA-119 / EX-DATA-120)
 * =================================================================================================
 * Lot D2. Reprend octet à octet la décision d'`EX-DATA-120` et de `ARCHITECTURE.md` §2.2 :
 * l'inconnu est marqué par une **sentinelle typée**, **jamais `0` ni `null`** — car `0` est une
 * valeur légitime de `mileageKm`, `co2EmissionsGPerKm` et `previousOwnerCount`.
 *
 *   - Grandeurs positives (colonnes `Int32Array` / `Int16Array`)  → sentinelle `-1`.
 *   - Énumérations sur un octet (colonnes `Uint8Array`)           → sentinelle `255`.
 *   - `modelId` (`Int32Array`)                                    → `0` = « Modèle non résolu »
 *     (EX-DATA-72), qui n'est PAS une sentinelle d'inconnu mais une valeur métier réservée.
 *
 * Toute lecture d'une colonne teste la sentinelle AVANT d'utiliser la valeur (EX-DATA-120).
 */

/** Sentinelle d'inconnu des colonnes numériques signées (`Int32Array`, `Int16Array`). */
export const NUMERIC_UNKNOWN = -1 as const;

/** Sentinelle d'inconnu des colonnes énumérées sur un octet (`Uint8Array`). */
export const ENUM_UNKNOWN_BYTE = 255 as const;

/** Valeur réservée de `modelId` pour « Modèle non identifié » (EX-DATA-72) — pas une sentinelle. */
export const MODEL_ID_UNRESOLVED = 0 as const;

/**
 * Nombre de champs textuels par ligne dans `ListingColumnBatch.stringOffsets`.
 * Réexporté depuis `DataProvider.ts` (l'interface gelée fait foi) pour que le schéma colonnaire de
 * D2 et l'interface partagent une seule constante.
 */
export { STRINGS_PER_ROW } from '../providers/DataProvider';

/** Vrai si la valeur d'une colonne numérique signée est connue (différente de la sentinelle `-1`). */
export function isNumericKnown(value: number): boolean {
  return value !== NUMERIC_UNKNOWN;
}

/** Vrai si la valeur d'une colonne énumérée sur un octet est connue (différente de `255`). */
export function isEnumByteKnown(value: number): boolean {
  return value !== ENUM_UNKNOWN_BYTE;
}

/**
 * Lit une colonne numérique signée en repliant la sentinelle sur `null` (valeur inconnue).
 * `null` n'est jamais stocké dans la colonne (EX-DATA-120) ; il n'apparaît qu'en sortie de lecture.
 */
export function readNumeric(value: number): number | null {
  return value === NUMERIC_UNKNOWN ? null : value;
}

/** Lit une colonne énumérée sur un octet en repliant la sentinelle `255` sur `null`. */
export function readEnumByte(value: number): number | null {
  return value === ENUM_UNKNOWN_BYTE ? null : value;
}

/**
 * Encode une grandeur positive optionnelle vers sa colonne signée : `null`/`undefined` → `-1`.
 * Refuse une valeur négative connue (elle collisionnerait avec la sentinelle) — c'est un défaut de
 * normalisation en amont, jamais une donnée valide sur une grandeur déclarée positive.
 */
export function encodeNumeric(value: number | null | undefined): number {
  if (value === null || value === undefined) return NUMERIC_UNKNOWN;
  if (value < 0) {
    throw new RangeError(
      `encodeNumeric: valeur négative ${value} sur une grandeur positive — collision de sentinelle`,
    );
  }
  return value;
}

/**
 * Encode un code d'énumération sur un octet vers sa colonne : `null`/`undefined` → `255`.
 * Refuse un code hors `[0, 254]` (255 est réservé à l'inconnu).
 */
export function encodeEnumByte(code: number | null | undefined): number {
  if (code === null || code === undefined) return ENUM_UNKNOWN_BYTE;
  if (!Number.isInteger(code) || code < 0 || code > 254) {
    throw new RangeError(`encodeEnumByte: code ${code} hors du domaine [0, 254] d'un octet énuméré`);
  }
  return code;
}
