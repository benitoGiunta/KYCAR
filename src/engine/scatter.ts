/**
 * KYCAR — Échantillon déterministe du nuage G4, calculé DANS le worker (D8-07, EX-DATA-99..103)
 * =================================================================================================
 * `EX-DATA-101` est l'algorithme qui fait foi (`EX-DATA-100bis` en est la PROPRIÉTÉ, pas un second
 * algorithme) : aucun générateur pseudo-aléatoire, aucune graine, tri par `listingId` avant tout
 * sous-tirage, donc échantillon identique octet à octet quelle que soit la permutation d'entrée.
 *
 *   si n_e ≤ K            : tracer `Elig` en entier ;                      sampled = faux
 *   sinon si |A| ≥ K      : tracer les K annonces de A de plus grand |opportunityScore|,
 *                           égalités départagées par `listingId` croissant ; outlierTruncated = vrai
 *   sinon                 : tracer A en entier ; B ← Elig \ A trié par `listingId` ;
 *                           q ← K − |A| ; pas ← |B| / q (réel, NON arrondi) ;
 *                           pour j de 0 à q−1 : tracer B[⌊j·pas⌋]
 *
 * La sortie est triée par `listingId` croissant (ordre total `EX-DATA-118`) et publiée avec les
 * compteurs d'`EX-DATA-103` — `eligibleCount`, `plottedCount`, `outlierCount`, `sampled`,
 * `outlierTruncated`, `maxPoints` : une nuée échantillonnée dont on tairait le sous-tirage se lit
 * comme l'effectif entier, faux d'un facteur pouvant atteindre 200.
 *
 * Miroir exact de `src/screens/distribution/scatter-sample.ts`, que D7 supprime une fois ce champ
 * rempli (source unique, D8-07). Module PUR.
 */

import { compareListingId } from './uuid';
import type { ScatterSampleSummary } from './stats-protocol';

/** Plafond dur de points tracés `K` (EX-DATA-100). Les 20 000 de l'annexe B sont code mort (§9.2). */
export const SCATTER_MAX_POINTS = 5000;

/** Entrée de l'échantillonnage : lignes DÉJÀ éligibles au sens d'`EX-DATA-99`. */
export interface ScatterSampleInput {
  /** Ensemble éligible `Elig` (EX-DATA-99). */
  readonly eligible: Int32Array;
  /** Octets bruts des `listingId` (16 par ligne). */
  readonly listingId: Uint8Array;
  /** Appartenance à `A` : l'annonce porte au moins un drapeau `LOW_*` / `HIGH_*` (EX-DATA-101). */
  readonly isOutlier: (row: number) => boolean;
  /** `opportunityScore` de la ligne (départage du cas `|A| ≥ K`), `null` si non évaluée. */
  readonly scoreOf?: (row: number) => number | null;
  /** Plafond `K` (défaut `SCATTER_MAX_POINTS`). */
  readonly maxPoints?: number;
}

/** Trie des lignes par `listingId` croissant (octet à octet), sans muter l'entrée. */
function sortByListingId(rows: readonly number[], listingId: Uint8Array): number[] {
  return [...rows].sort((a, b) => compareListingId(listingId, a, b));
}

/** Échantillonne le nuage G4 selon `EX-DATA-101` et publie les compteurs d'`EX-DATA-103`. */
export function sampleScatter(input: ScatterSampleInput): ScatterSampleSummary {
  const { listingId, isOutlier } = input;
  const scoreOf = input.scoreOf ?? ((): number | null => null);
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
      maxPoints: K,
    };
  }

  // Cas 2 : les annonces signalées saturent à elles seules le plafond.
  if (A.length >= K) {
    const ranked = [...A].sort((a, b) => {
      const sa = Math.abs(scoreOf(a) ?? 0);
      const sb = Math.abs(scoreOf(b) ?? 0);
      if (sb !== sa) return sb - sa;
      return compareListingId(listingId, a, b);
    });
    const rows = Int32Array.from(sortByListingId(ranked.slice(0, K), listingId));
    return {
      rows,
      eligibleCount: nE,
      plottedCount: rows.length,
      outlierCount: A.length,
      outlierPlottedCount: rows.length,
      sampled: true,
      outlierTruncated: true,
      maxPoints: K,
    };
  }

  // Cas 3 : `A` en entier, puis pas régulier sur `B` trié par `listingId`.
  const bSorted = sortByListingId(B, listingId);
  const q = K - A.length;
  const step = bSorted.length / q; // réel, NON arrondi (EX-DATA-101)
  const picked: number[] = [];
  for (let j = 0; j < q; j++) picked.push(bSorted[Math.floor(j * step)] as number);
  const rows = Int32Array.from(sortByListingId([...A, ...picked], listingId));
  return {
    rows,
    eligibleCount: nE,
    plottedCount: rows.length,
    outlierCount: A.length,
    outlierPlottedCount: A.length,
    sampled: true,
    outlierTruncated: false,
    maxPoints: K,
  };
}
