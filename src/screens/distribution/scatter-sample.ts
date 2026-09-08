/**
 * KYCAR — Échantillonnage déterministe du nuage G4 (lot D7, EX-DATA-100/100bis/101)
 * =================================================================================================
 * Le nuage G4 trace AU PLUS `K = 5 000` points (EX-DATA-100, plafond dur ; les seuils de 20 000 de
 * l'annexe B sont du code mort — ARCHITECTURE §9.2). L'échantillon est :
 *   - DÉTERMINISTE et REPRODUCTIBLE (EX-DATA-101) : aucun aléa non graine, la vue est identique d'une
 *     session à l'autre ;
 *   - INVARIANT À LA PERMUTATION des lignes d'entrée (EX-DATA-100bis) : deux ordres d'entrée
 *     différents produisent le MÊME échantillon, octet à octet ;
 *   - NON BIAISÉ : la clé de tirage est dérivée du `listingId` (UUID v4, indépendant des trois axes
 *     prix/année/km) via le brouilleur `xoshiro128**` à graine constante `0x4B594341` (ARCHITECTURE
 *     §4.2). Le `listingId` n'ayant aucune corrélation avec les axes, le sous-échantillon est neutre.
 *   - Les OUTLIERS sont CONSERVÉS INTÉGRALEMENT (EX-DATA-100/101) : ils échappent au sous-tirage.
 *
 * Module PUR (aucune globale DOM/Worker) : testable octet à octet hors navigateur.
 */

import { compareListingId } from '../../engine/uuid';

/** Graine constante du brouilleur d'échantillonnage (ARCHITECTURE §4.2 : `0x4B594341` = "KYCA"). */
export const SCATTER_SAMPLING_SEED = 0x4b594341;

/** Plafond dur de points tracés (EX-DATA-100). Les 20 000 de l'annexe B sont code mort (§9.2). */
export const SCATTER_MAX_POINTS = 5000;

/**
 * Brouilleur `xoshiro128**` (Blackman & Vigna) réduit à une clé déterministe par `listingId`.
 *
 * On n'a PAS besoin d'un flux pseudo-aléatoire ordonné : il faut une CLÉ pseudo-aléatoire STABLE et
 * indépendante de la position pour chaque annonce, afin que le tri par clé soit invariant à la
 * permutation. L'état 128 bits est initialisé à partir de la graine constante, puis les 16 octets de
 * l'UUID sont absorbés par le scrambler `**` de xoshiro ; la sortie finale est la clé de tirage.
 */
function scatterKey(bytes: Uint8Array, row: number): number {
  const base = row * 16;
  // État initial dérivé de la graine (splitmix32 sur la graine → 4 mots de 32 bits).
  let s0 = mix32(SCATTER_SAMPLING_SEED ^ 0x9e3779b9);
  let s1 = mix32(s0 ^ 0x85ebca6b);
  let s2 = mix32(s1 ^ 0xc2b2ae35);
  let s3 = mix32(s2 ^ 0x27d4eb2f);

  const rotl = (x: number, k: number): number => ((x << k) | (x >>> (32 - k))) >>> 0;
  const step = (): number => {
    // xoshiro128** : sortie = rotl(s1 * 5, 7) * 9.
    const out = (Math.imul(rotl(Math.imul(s1, 5) >>> 0, 7), 9) >>> 0);
    const t = (s1 << 9) >>> 0;
    s2 = (s2 ^ s0) >>> 0;
    s3 = (s3 ^ s1) >>> 0;
    s1 = (s1 ^ s2) >>> 0;
    s0 = (s0 ^ s3) >>> 0;
    s2 = (s2 ^ t) >>> 0;
    s3 = rotl(s3, 11);
    return out;
  };

  // Absorption des 16 octets de l'UUID : chaque octet perturbe l'état avant un pas.
  for (let i = 0; i < 16; i++) {
    s0 = (s0 ^ ((bytes[base + i] as number) + 1)) >>> 0;
    step();
  }
  // Deux pas de finalisation pour diffuser complètement.
  step();
  return step();
}

/** Diffuseur splitmix32 (initialisation d'état déterministe à partir de la graine). */
function mix32(x: number): number {
  let z = (x + 0x9e3779b9) >>> 0;
  z = (Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0) >>> 0;
  z = (Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0) >>> 0;
  return (z ^ (z >>> 15)) >>> 0;
}

/** Entrée de l'échantillonnage : les lignes éligibles et le prédicat d'outlier. */
export interface ScatterSampleInput {
  /** Lignes candidates (déjà élaguées + raffinées) à considérer pour le nuage. */
  readonly rows: Int32Array | readonly number[];
  /** Octets bruts des `listingId` (`ListingColumnBatch.listingId`), 16 par ligne. */
  readonly listingId: Uint8Array;
  /** Vrai si la ligne est un outlier (à conserver intégralement). */
  readonly isOutlier: (row: number) => boolean;
  /** Plafond de points tracés (défaut `SCATTER_MAX_POINTS`). */
  readonly maxPoints?: number;
}

/** Résultat de l'échantillonnage. */
export interface ScatterSampleResult {
  /** Lignes retenues, triées par `listingId` (ordre total, stable, EX-DATA-118). */
  readonly rows: Int32Array;
  /** Nombre d'outliers conservés (sous-ensemble de `rows`). */
  readonly outlierCount: number;
  /** Nombre de lignes éligibles avant sous-tirage. */
  readonly eligibleCount: number;
  /** Vrai si un sous-tirage a été appliqué (éligibles > plafond). */
  readonly sampled: boolean;
}

/**
 * Échantillonne les lignes du nuage G4 (EX-DATA-100/100bis/101).
 *
 * 1. Partition outliers / non-outliers.
 * 2. Les outliers sont TOUS conservés (jamais sous-tirés).
 * 3. Le budget restant (`K − #outliers`) est rempli par les non-outliers de plus petite clé de
 *    tirage (`scatterKey`), départage par `listingId`. Comme la clé ne dépend que du `listingId`, le
 *    résultat est invariant à l'ordre d'entrée.
 * 4. La sortie est triée par `listingId` : ordre de rendu stable et sortie testable octet à octet.
 */
export function sampleScatter(input: ScatterSampleInput): ScatterSampleResult {
  const { listingId, isOutlier } = input;
  const maxPoints = input.maxPoints ?? SCATTER_MAX_POINTS;
  const src = input.rows;
  const n = src.length;

  const outliers: number[] = [];
  const others: number[] = [];
  for (let i = 0; i < n; i++) {
    const row = src[i] as number;
    if (isOutlier(row)) outliers.push(row);
    else others.push(row);
  }

  const budget = Math.max(0, maxPoints - outliers.length);
  let keptOthers: number[];
  let sampled = false;
  if (others.length <= budget) {
    keptOthers = others;
  } else {
    sampled = true;
    // Tri par (clé de tirage, listingId) : sélection des `budget` plus petites clés. Le départage par
    // listingId garantit un ordre total même en cas d'égalité de clé (extrêmement rare).
    const keyed = others.map((row) => ({ row, key: scatterKey(listingId, row) }));
    keyed.sort((a, b) => (a.key - b.key) || compareListingId(listingId, a.row, b.row));
    keptOthers = keyed.slice(0, budget).map((e) => e.row);
  }

  const result = new Int32Array(outliers.length + keptOthers.length);
  let cursor = 0;
  for (const row of outliers) result[cursor++] = row;
  for (const row of keptOthers) result[cursor++] = row;
  // Ordre final déterministe : tri total par listingId (indépendant de la partition).
  const sortedRows = Array.from(result).sort((a, b) => compareListingId(listingId, a, b));

  return {
    rows: Int32Array.from(sortedRows),
    outlierCount: outliers.length,
    eligibleCount: n,
    sampled,
  };
}
