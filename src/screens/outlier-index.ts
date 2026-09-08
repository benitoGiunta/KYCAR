/**
 * KYCAR — Index des verdicts d'outlier par annonce (lot D7)
 * =================================================================================================
 * Le moteur (D4) publie des `OutlierVerdict` par `(listingId, method)` : une même annonce peut porter
 * un verdict M1 ET un verdict M2. Les écrans B/D en ont besoin agrégés par annonce :
 *   - appartenance à `A` (nuée G4, écrêtage EX-DATA-101) ;
 *   - `opportunityScore` (tri EX-SCR-206/G8) ;
 *   - `expectedPriceEur` / `deviationPct` (colonne écart, EX-SCR-203) ;
 *   - étiquetage de la base de comparaison (EX-SCR-158bis) : `cellLabel`, `cellCount`, méthode.
 *
 * Règle d'agrégation : M2 (écart au prix attendu par régression) prime pour `expectedPriceEur` et la
 * mention de méthode dès qu'il est présent (EX-SCR-164 : au-delà de 30 offres, le score passe à M2) ;
 * sinon M1. Le `opportunityScore` retenu est celui de plus grande valeur absolue.
 *
 * Module PUR : testable sans DOM.
 */

import type { OutlierVerdict } from '../types/index';

/** Vue agrégée d'une annonce signalée. */
export interface OutlierEntry {
  readonly listingId: string;
  readonly flags: readonly string[];
  readonly method: 'M1' | 'M2';
  readonly opportunityScore: number | null;
  readonly expectedPriceEur: number | null;
  readonly deviationPct: number | null;
  readonly cellLabel: string | null;
  readonly cellCount: number;
}

/** Index par `listingId`. */
export class OutlierIndex {
  private readonly byId = new Map<string, OutlierEntry>();

  constructor(verdicts: readonly OutlierVerdict[]) {
    for (const v of verdicts) {
      const prev = this.byId.get(v.listingId);
      this.byId.set(v.listingId, mergeVerdict(prev, v));
    }
  }

  has(listingId: string): boolean {
    return this.byId.has(listingId);
  }

  get(listingId: string): OutlierEntry | undefined {
    return this.byId.get(listingId);
  }

  get size(): number {
    return this.byId.size;
  }

  /** Score d'opportunité agrégé, ou `null`. */
  scoreOf(listingId: string): number | null {
    return this.byId.get(listingId)?.opportunityScore ?? null;
  }
}

function mergeVerdict(prev: OutlierEntry | undefined, v: OutlierVerdict): OutlierEntry {
  if (prev === undefined) {
    return {
      listingId: v.listingId,
      flags: [...v.flags],
      method: v.method === 'M3' ? 'M1' : v.method,
      opportunityScore: v.opportunityScore,
      expectedPriceEur: v.expectedPriceEur,
      deviationPct: v.deviationPct,
      cellLabel: v.cellLabel,
      cellCount: v.cellCount,
    };
  }
  const flags = Array.from(new Set([...prev.flags, ...v.flags]));
  // M2 (écart au prix attendu par régression) prime pour l'écart et la méthode affichée.
  const preferM2Source = v.method === 'M2';
  const score =
    Math.abs(v.opportunityScore ?? 0) > Math.abs(prev.opportunityScore ?? 0)
      ? v.opportunityScore
      : prev.opportunityScore;
  return {
    listingId: prev.listingId,
    flags,
    method: prev.method === 'M2' || v.method === 'M2' ? 'M2' : 'M1',
    opportunityScore: score,
    expectedPriceEur: preferM2Source ? v.expectedPriceEur : prev.expectedPriceEur ?? v.expectedPriceEur,
    deviationPct: preferM2Source ? v.deviationPct : prev.deviationPct ?? v.deviationPct,
    cellLabel: preferM2Source ? v.cellLabel : prev.cellLabel ?? v.cellLabel,
    cellCount: preferM2Source ? v.cellCount : prev.cellCount || v.cellCount,
  };
}

/**
 * Chaîne normative d'étiquetage de la base de comparaison (EX-SCR-158bis) : dérivée de `cellLabel`
 * (`MODEL_YEAR` / `MODEL` / `SELECTION`) et de `cellCount`. Le périmètre marque/modèle/année exact
 * est fourni par l'appelant (il connaît la sélection courante) ; à défaut, on rend le niveau brut.
 */
export function comparisonBaseLabel(
  entry: Pick<OutlierEntry, 'cellLabel' | 'cellCount'>,
  perimeter?: { makeModel?: string; year?: number },
): string {
  let scope: string;
  switch (entry.cellLabel) {
    case 'MODEL_YEAR':
      scope = perimeter?.makeModel && perimeter.year !== undefined
        ? `${perimeter.makeModel} · ${perimeter.year}`
        : 'modèle · année';
      break;
    case 'MODEL':
      scope = perimeter?.makeModel ?? 'modèle';
      break;
    case 'SELECTION':
      scope = 'sélection courante';
      break;
    default:
      scope = 'sélection courante';
  }
  return `écart calculé sur : ${scope} · n = ${entry.cellCount}`;
}

/** Mention de méthode normative (EX-SCR-164/203). */
export function methodLabel(method: 'M1' | 'M2'): string {
  return method === 'M2'
    ? 'score : écart au prix attendu (M2)'
    : 'score : écart robuste au prix de la cellule (M1)';
}
