/**
 * KYCAR — Arbitrage des doublons d'un snapshot de fixtures (EX-DATA-15, ARB-54, D3-15)
 * =================================================================================================
 * `EX-DATA-15` dédoublonne sur `(snapshotId, listingId)`. Le lot D3 (synthétique) applique la règle
 * de la PREMIÈRE OCCURRENCE dans l'ordre d'ingestion ; `ARB-54` ajoute `DUPLICATE_VALUE_CONFLICT`
 * quand une occurrence écartée diverge sur l'un des quatre champs de `DUPLICATE_CONFLICT_FIELDS`.
 *
 * **D3-15 durcit la règle pour les fixtures** : « l'arbitrage des doublons ne dépend JAMAIS de
 * l'ordre du fichier ». Le tri du NDJSON est `(make, model, firstRegistrationDate, id)` — un ordre
 * de DIFFABILITÉ, choisi pour la compression et la revue, pas pour départager deux annonces. Faire
 * dépendre le contenu servi de cet ordre, c'est faire dépendre les chiffres affichés d'une décision
 * de sérialisation.
 *
 * Trois critères EXPLICITES, dans l'ordre, tous calculables sur les deux occurrences seules :
 *
 *   1. **complétude** — l'occurrence qui laisse le moins de champs INCONNUS gagne. C'est le critère
 *      de fond : entre deux descriptions du même véhicule, celle qui en dit le plus est celle qu'on
 *      sert.
 *   2. **date de mise à jour** — à complétude égale, la plus récente (`lastUpdatedAt` de la couche
 *      source) gagne. Elle ne franchit pas l'interface (D3-11) mais elle EXISTE dans le fichier, et
 *      elle est la seule mesure de fraîcheur disponible.
 *   3. **signature stable** — à égalité sur les deux premiers, la plus petite signature
 *      lexicographique gagne. Ce n'est pas un jugement de valeur : c'est un départage
 *      DÉTERMINISTE, sans lequel l'ordre du fichier reprendrait la main par la porte de derrière.
 *
 * La sortie est donc identique quel que soit l'ordre de lecture — ce que la suite de contrat
 * vérifie en rejouant le même fichier à l'envers.
 */

import { DUPLICATE_CONFLICT_FIELDS } from '../../types/shared-rules';
import type { CanonicalRow } from '../adapters/as24/adapt';

/** Une occurrence candidate : la ligne adaptée et ce que la couche source dit de sa fraîcheur. */
export interface DuplicateCandidate {
  readonly row: CanonicalRow;
  /** `lastUpdatedAt` de la couche source, ou `null`. Jamais stocké, jamais publié. */
  readonly sourceUpdatedAt: string | null;
}

/**
 * Signature stable d'une ligne, pour le critère 3. Elle porte les quatre champs d'`ARB-54` plus
 * l'identifiant : c'est exactement l'information sur laquelle un conflit de doublon se juge.
 */
export function duplicateSignature(row: CanonicalRow): string {
  return [
    row.listingId,
    row.priceEur,
    row.priceStatus,
    row.mileageKm,
    row.firstRegistrationYearMonth,
  ].join('|');
}

/**
 * Vrai si `candidate` doit REMPLACER `kept`. Application stricte des trois critères de D3-15, dans
 * l'ordre ; à égalité complète, `kept` est conservé (la fonction ne rend jamais `true` sur deux
 * occurrences identiques, ce qui la rend idempotente).
 */
export function preferCandidate(kept: DuplicateCandidate, candidate: DuplicateCandidate): boolean {
  // 1. Complétude.
  const keptUnknown = kept.row.unknownFields.length;
  const candUnknown = candidate.row.unknownFields.length;
  if (candUnknown !== keptUnknown) return candUnknown < keptUnknown;

  // 2. Fraîcheur déclarée par la couche source.
  const keptAt = kept.sourceUpdatedAt === null ? Number.NaN : Date.parse(kept.sourceUpdatedAt);
  const candAt = candidate.sourceUpdatedAt === null ? Number.NaN : Date.parse(candidate.sourceUpdatedAt);
  const keptKnown = Number.isFinite(keptAt);
  const candKnown = Number.isFinite(candAt);
  if (candKnown !== keptKnown) return candKnown; // une date connue prime sur une date absente
  if (candKnown && keptKnown && candAt !== keptAt) return candAt > keptAt;

  // 3. Départage déterministe.
  return duplicateSignature(candidate.row) < duplicateSignature(kept.row);
}

/**
 * Vrai si les deux occurrences divergent sur l'un des quatre champs d'`ARB-54`. La liste est
 * NORMATIVE et vit dans `src/types/shared-rules.ts` : un adaptateur qui en comparerait d'autres
 * produirait un `duplicateValueConflictCount` qui ne veut plus rien dire.
 */
export function hasDuplicateValueConflict(a: CanonicalRow, b: CanonicalRow): boolean {
  for (const field of DUPLICATE_CONFLICT_FIELDS) {
    if (a[field] !== b[field]) return true;
  }
  return false;
}
