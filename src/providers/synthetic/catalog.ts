/**
 * KYCAR — Catalogue de génération : pont entre les vocabulaires réels (D2) et les distributions D3
 * =================================================================================================
 * Le générateur travaille sur des INDICES d'octet (colonnes `Uint8Array`, EX-DATA-119) et non sur les
 * codes canoniques (chaînes « B », « 12 », « BE10 »…). Un octet ne peut pas porter une chaîne : la
 * convention de stockage retenue est donc **l'indice de la valeur dans le tableau `values` du
 * vocabulaire chargé** (0..len-1), la sentinelle `255` valant « inconnu » (EX-DATA-120).
 *
 * DETTE / CONTRAT INTER-LOTS SIGNALÉ : le schéma D2 (`columns.ts`) attache un vocabulaire à chaque
 * colonne énumérée mais ne FIGE pas explicitement « indice vs code ». L'octet impose l'indice ; le
 * moteur (D4) et l'état (D5) doivent décoder via le MÊME `ReferenceData` (ordre de `values` stable).
 * Ce module centralise la convention pour tout le lot D3.
 *
 * Les poids ci-dessous sont adossés aux CODES canoniques (robustes à l'ordre du fichier de
 * référence) : on résout chaque code présent dans le vocabulaire chargé, on lui associe son poids, et
 * les codes absents (selon le marché) sont simplement ignorés.
 */

import type { ReferenceData } from '../../types/reference';
import type { VocabularyName } from '../../types/vocabularies';

/** Distribution pondérée prête au tirage : indices d'octet + poids cumulés alignés. */
export interface WeightedDist {
  /** Indices d'octet (position dans `vocabulary.values`) des valeurs retenues. */
  readonly indices: readonly number[];
  /** Poids cumulés (même longueur qu'`indices`), pour `Prng.pickCumulative`. */
  readonly cumulative: readonly number[];
  /** Code canonique par indice d'octet, pour retrouver un code depuis la valeur stockée. */
  readonly codeByIndex: ReadonlyMap<number, string>;
  /** Indice d'octet par code canonique, pour le filtrage de sélection. */
  readonly indexByCode: ReadonlyMap<string, number>;
}

/** Construit une distribution pondérée à partir d'une table code→poids et du vocabulaire chargé. */
export function buildDist(
  ref: ReferenceData,
  vocabulary: VocabularyName,
  weightByCode: Readonly<Record<string, number>>,
  defaultWeight = 0,
): WeightedDist {
  const voc = ref.vocabularies.get(vocabulary);
  if (voc === undefined) {
    throw new Error(`catalog: vocabulaire ${vocabulary} absent du référentiel`);
  }
  const indices: number[] = [];
  const cumulative: number[] = [];
  const codeByIndex = new Map<number, string>();
  const indexByCode = new Map<string, number>();
  let acc = 0;
  voc.values.forEach((value, index) => {
    codeByIndex.set(index, value.code);
    indexByCode.set(value.code, index);
    const w = weightByCode[value.code] ?? defaultWeight;
    if (w <= 0) return;
    acc += w;
    indices.push(index);
    cumulative.push(acc);
  });
  if (indices.length === 0) {
    // Repli : aucune valeur pondérée reconnue → toutes équiprobables.
    let a = 0;
    voc.values.forEach((_value, index) => {
      a += 1;
      indices.push(index);
      cumulative.push(a);
    });
  }
  return { indices, cumulative, codeByIndex, indexByCode };
}

/** Indice d'octet d'un code dans un vocabulaire chargé (ou `null` si le code est absent). */
export function codeIndex(ref: ReferenceData, vocabulary: VocabularyName, code: string): number | null {
  const voc = ref.vocabularies.get(vocabulary);
  const i = voc?.values.findIndex((v) => v.code === code);
  return i === undefined || i < 0 ? null : i;
}

/* ------------------------------------------------------------------------------------------------ *
 * Tables de poids adossées aux codes canoniques réels (marché BE, cf. references/*.json).
 * Valeurs plausibles inspirées du parc belge ; elles n'ont pas vocation à l'exactitude statistique
 * (données SYNTHETIC, EX-DATA-107) mais à des distributions crédibles et testables.
 * ------------------------------------------------------------------------------------------------ */

/** KYCAR_FUEL_CATEGORY (10 codes, sans « T »). */
export const FUEL_WEIGHTS: Readonly<Record<string, number>> = {
  B: 42, // Essence
  D: 30, // Diesel
  '2': 9, // Électrique/Essence (PHEV)
  E: 8, // Électrique (BEV)
  '3': 2, // Électrique/Diesel
  L: 3, // GPL
  C: 2, // CNG
  M: 1, // Éthanol
  H: 1, // Hydrogène
  O: 2, // Autres
};

/** KYCAR_BODY_TYPE (9 codes voiture). */
export const BODY_WEIGHTS: Readonly<Record<string, number>> = {
  '4': 24, // SUV/4x4/Pick-Up
  '6': 22, // Berline
  '1': 16, // Citadine
  '5': 14, // Break
  '3': 6, // Coupé
  '12': 6, // Monospace
  '2': 4, // Cabriolet
  '13': 4, // Utilitaire
  '7': 4, // Autres
};

/** KYCAR_TRANSMISSION (A/M/S) — hors motorisation électrique (toujours automatique). */
export const TRANSMISSION_WEIGHTS: Readonly<Record<string, number>> = {
  M: 48, // Manuelle
  A: 44, // Automatique
  S: 8, // Semi-automatique
};

/** KYCAR_DRIVETRAIN (4/F/R). */
export const DRIVETRAIN_WEIGHTS: Readonly<Record<string, number>> = {
  F: 64, // Avant
  '4': 22, // 4x4
  R: 14, // Arrière
};

/** KYCAR_OFFER_TYPE (D/J/N/O/S/U). */
export const OFFER_WEIGHTS: Readonly<Record<string, number>> = {
  U: 70, // Occasion
  J: 12, // Récente
  N: 8, // Neuf
  D: 6, // Démonstration
  S: 3, // Pré-enregistrement
  O: 1, // Ancêtre
};

/** KYCAR_USAGE_STATE (A/N/U). */
export const USAGE_WEIGHTS: Readonly<Record<string, number>> = {
  U: 88, // État d'origine
  N: 10, // Neuf
  A: 2, // Accidenté
};

/** KYCAR_BODY_COLOR (14 codes). */
export const COLOR_WEIGHTS: Readonly<Record<string, number>> = {
  '11': 24, // Noir
  '6': 20, // Gris
  '14': 16, // Blanc
  '12': 12, // Argent
  '2': 9, // Bleu
  '10': 6, // Rouge
  '3': 3, // Brun
  '7': 3, // Vert
  '1': 2, // Beige
  '4': 1, // Bronze
  '5': 1, // Jaune
  '13': 1, // Mauve
  '15': 1, // Orange
  '16': 1, // Or
};

/** KYCAR_UPHOLSTERY_TYPE (AL/CL/FL/OT/PL/VL). */
export const UPHOLSTERY_WEIGHTS: Readonly<Record<string, number>> = {
  CL: 55, // Tissu
  FL: 22, // Cuir
  PL: 12, // Cuir partiel
  VL: 4, // Velours
  AL: 4, // Alcantara
  OT: 3, // Autres
};

/** KYCAR_SELLER_TYPE (P/D). */
export const SELLER_WEIGHTS: Readonly<Record<string, number>> = {
  D: 62, // Professionnel
  P: 38, // Particulier
};

/** KYCAR_REGION (11 codes NUTS-2) — pondérés grossièrement par population/parc. */
export const REGION_WEIGHTS: Readonly<Record<string, number>> = {
  BE21: 16, // Anvers
  BE23: 13, // Flandre-Orientale
  BE32: 12, // Hainaut
  BE25: 11, // Flandre-Occidentale
  BE10: 10, // Bruxelles
  BE24: 10, // Brabant flamand
  BE33: 10, // Liège
  BE22: 8, // Limbourg
  BE35: 4, // Namur
  BE31: 3, // Brabant wallon
  BE34: 3, // Luxembourg
};

/** KYCAR_AD_TIER (NONE/T20/T30/T40/T50). */
export const AD_TIER_WEIGHTS: Readonly<Record<string, number>> = {
  NONE: 75,
  T20: 10,
  T30: 8,
  T40: 5,
  T50: 2,
};
