/**
 * KYCAR — Échantillonnage déterministe du nuage G4 (lot D7, EX-DATA-99/100/100bis/101/103)
 * =================================================================================================
 * Le nuage G4 trace AU PLUS `K = 5 000` points (EX-DATA-100, plafond dur ; les seuils de 20 000 de
 * l'annexe B sont code mort — ARCHITECTURE §9.2, tension signalée). L'échantillon est déterministe,
 * reproductible et INVARIANT À LA PERMUTATION des lignes d'entrée (EX-DATA-100bis, critère de succès
 * n°4). Cette implémentation suit l'ALGORITHME OPÉRATIONNEL d'EX-DATA-101, qui est concret et
 * testable octet à octet :
 *
 *   si n_e ≤ K            : tracer Elig entier, trié par listingId croissant
 *   sinon si |A| ≥ K      : tracer les K outliers de plus grand |opportunityScore|
 *                            (égalités départagées par listingId croissant), puis réordonner par
 *                            listingId ; outlierTruncated = vrai
 *   sinon                 : tracer A entier ; B = Elig \ A trié par listingId ; pas = |B|/q réel ;
 *                            tracer B[plancher(j·pas)] pour j ∈ [0, q[ ; q = K − |A|
 *   (sortie toujours réordonnée par listingId croissant avant transmission)
 *
 * DIVERGENCE DE SOURCE SIGNALÉE (non corrigée) : EX-DATA-101 spécifie un pas régulier sur `listingId`
 * « sans générateur pseudo-aléatoire ni graine », tandis qu'EX-DATA-100bis spécifie un mélange
 * `xoshiro128**` à graine `0x4B594341` + Fisher-Yates. Les deux sont en TENSION. On implémente
 * EX-DATA-101 (pas régulier) : il est le seul énoncé procédural complet, il est trivialement
 * reproductible et invariant à la permutation (il trie par `listingId` avant de sous-tirer), et c'est
 * la variante que la clause de déterminisme d'EX-DATA-82 rend testable. La graine constante est
 * conservée ci-dessous pour la traçabilité et l'affichage d'EX-DATA-103. Écart remonté au rapport de
 * lot pour arbitrage 2.6.
 *
 * Module PUR (aucune globale DOM/Worker) : testable octet à octet hors navigateur.
 */

import { compareListingId } from '../../engine/uuid';

// Graine `0x4B594341` retirée en 2.6 (D-06) : EX-DATA-101 (pas régulier) fait foi, aucune graine n'a d'objet.

/** Plafond dur de points tracés (EX-DATA-100). Les 20 000 de l'annexe B sont code mort (§9.2). */
export const SCATTER_MAX_POINTS = 5000;

/** Entrée de l'échantillonnage. Les lignes sont supposées DÉJÀ éligibles (EX-DATA-99). */
export interface ScatterSampleInput {
  /** Ensemble éligible `Elig` (EX-DATA-99) : lignes candidates au tracé. */
  readonly eligible: Int32Array | readonly number[];
  /** Octets bruts des `listingId` (`ListingColumnBatch.listingId`), 16 par ligne. */
  readonly listingId: Uint8Array;
  /** Appartenance de la ligne à `A` (outlier signalé : `outlierFlags ∩ {LOW/HIGH_*} ≠ ∅`). */
  readonly isOutlier: (row: number) => boolean;
  /** `opportunityScore` de la ligne (départage du cas `|A| ≥ K`), `null` si non évalué. */
  readonly opportunityScore?: (row: number) => number | null;
  /** Plafond de points tracés (défaut `SCATTER_MAX_POINTS`). */
  readonly maxPoints?: number;
}

/** Résultat de l'échantillonnage, avec les compteurs d'EX-DATA-103. */
export interface ScatterSampleResult {
  /** Lignes tracées, triées par `listingId` croissant (ordre total EX-DATA-118). */
  readonly rows: Int32Array;
  /** Effectif éligible `n_e`. */
  readonly eligibleCount: number;
  /** Nombre de points effectivement tracés. */
  readonly plottedCount: number;
  /** Nombre total d'outliers éligibles `|A|`. */
  readonly outlierCount: number;
  /** Nombre d'outliers effectivement tracés. */
  readonly outlierPlottedCount: number;
  /** Vrai si un sous-tirage a été appliqué (`n_e > K`). */
  readonly sampled: boolean;
  /** Vrai si des outliers signalés n'ont PAS pu être tracés (`|A| ≥ K`, EX-DATA-103). */
  readonly outlierTruncated: boolean;
}

/** Trie une liste de lignes par `listingId` croissant (octet à octet), sans muter l'entrée. */
function sortByListingId(rows: readonly number[], listingId: Uint8Array): number[] {
  return [...rows].sort((a, b) => compareListingId(listingId, a, b));
}

/**
 * Échantillonne les lignes du nuage G4 selon EX-DATA-101.
 * Invariant à la permutation : chaque branche trie par `listingId` (ordre total indépendant de
 * l'ordre d'entrée) avant tout sous-tirage, et la sortie est re-triée par `listingId`.
 */
export function sampleScatter(input: ScatterSampleInput): ScatterSampleResult {
  const { listingId, isOutlier } = input;
  const scoreOf = input.opportunityScore ?? (() => null);
  const K = input.maxPoints ?? SCATTER_MAX_POINTS;
  const src = input.eligible;
  const nE = src.length;

  const A: number[] = [];
  const B: number[] = [];
  for (let i = 0; i < nE; i++) {
    const row = src[i] as number;
    if (isOutlier(row)) A.push(row);
    else B.push(row);
  }

  // Cas 1 : tout tient sous le plafond.
  if (nE <= K) {
    const rows = Int32Array.from(sortByListingId([...A, ...B], listingId));
    return {
      rows,
      eligibleCount: nE,
      plottedCount: rows.length,
      outlierCount: A.length,
      outlierPlottedCount: A.length,
      sampled: false,
      outlierTruncated: false,
    };
  }

  // Cas 2 : les outliers seuls saturent le plafond → K meilleurs |opportunityScore|.
  if (A.length >= K) {
    const ranked = [...A].sort((a, b) => {
      const sa = Math.abs(scoreOf(a) ?? 0);
      const sb = Math.abs(scoreOf(b) ?? 0);
      if (sb !== sa) return sb - sa; // |score| décroissant
      return compareListingId(listingId, a, b); // départage listingId croissant
    });
    const chosen = ranked.slice(0, K);
    const rows = Int32Array.from(sortByListingId(chosen, listingId));
    return {
      rows,
      eligibleCount: nE,
      plottedCount: rows.length,
      outlierCount: A.length,
      outlierPlottedCount: rows.length,
      sampled: true,
      outlierTruncated: true,
    };
  }

  // Cas 3 : A entier + pas régulier sur B (trié par listingId).
  const Bsorted = sortByListingId(B, listingId);
  const q = K - A.length;
  const step = Bsorted.length / q; // réel, non arrondi (EX-DATA-101)
  const picked: number[] = [];
  for (let j = 0; j < q; j++) {
    const idx = Math.floor(j * step);
    picked.push(Bsorted[idx] as number);
  }
  const rows = Int32Array.from(sortByListingId([...A, ...picked], listingId));
  return {
    rows,
    eligibleCount: nE,
    plottedCount: rows.length,
    outlierCount: A.length,
    outlierPlottedCount: A.length,
    sampled: true,
    outlierTruncated: false,
  };
}
