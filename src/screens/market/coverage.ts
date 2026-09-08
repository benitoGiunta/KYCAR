/**
 * KYCAR — Couverture d'échantillon de l'écran A (lot D6)
 * =================================================================================================
 * `EX-DATA-61bis` : `sampleCoverage = listingCount / announcedCount`, définie au seul niveau
 * (marque) et (marque, modèle), jamais recalculée sous filtre (elle vaut alors `NON_APPLICABLE`,
 * pas `null` — les deux se distinguent par leur CAUSE, pas par leur rendu : `EX-SCR-115` les
 * affiche tous deux en tiret gris avec la même infobulle).
 *
 * DETTE SIGNALÉE, confirmée par lecture directe (ne pas re-"corriger" en silence) : aucune source
 * de ce dépôt ne peuple jamais `Make.announcedCount`/`Model.announcedCount` —
 * `src/types/reference.ts::buildTaxonomy` les fixe à `null` inconditionnellement (`taxonomy.json` ne
 * porte pas ce champ), et `src/engine/aggregate.ts` fixe `MakeAggregate.sampleCoverage`/
 * `ModelAggregate.sampleCoverage` à `null` inconditionnellement (« laissé à null, renseigné par le
 * rendu » — précisément ce module). Par conséquent, TANT QUE la taxonomie statique ne porte pas ces
 * effectifs, `sampleCoverageOf(...)` produit structurellement `null` pour toute marque/modèle, et le
 * disque `EX-SCR-115` s'affiche toujours en tiret. Ce module reste correct pour le jour où la donnée
 * existera (il ne fait aucune hypothèse fausse), et le rendu honnête aujourd'hui (tiret, jamais un
 * faux 100 %) est justement ce qu'exige `EX-SCR-115`/`ET-CHAMP-ABSENT-SOURCE`.
 *
 * Le bandeau `C3` (`EX-SCR-31`), lui, fonctionne réellement : il porte sur la couverture de SNAPSHOT
 * (`SnapshotDescriptor.listingCount`/`announcedListingCount`), que les providers (D3/D9) peuplent.
 */

import { formatInteger, formatPercent } from './format';

export type SampleCoverage = number | null | 'NON_APPLICABLE';

/** `EX-DATA-61bis` — calcule `sampleCoverage`, arrondie à 4 décimales. `NON_APPLICABLE` si au moins
 * un filtre utilisateur est posé (la couverture d'échantillon n'est définie que pour le snapshot
 * complet). `null` si `announcedCount` est `INCONNU`. Ne prend jamais `listingCount` pour
 * `announcedCount` (l'appelant doit fournir les deux, distinctement). */
export function sampleCoverageOf(listingCount: number, announcedCount: number | null, hasUserFilters: boolean): SampleCoverage {
  if (hasUserFilters) return 'NON_APPLICABLE';
  if (announcedCount === null) return null;
  const ratio = announcedCount === 0 ? 0 : listingCount / announcedCount;
  return Math.round(ratio * 10000) / 10000;
}

export type CoverageDiscLevel = 'plein' | 'mi-plein' | 'creux' | 'indisponible';

/** `EX-SCR-115` — plein (`>= 0,80`), mi-plein (`[0,20 ; 0,80[`), creux (`< 0,20`), ou le tiret
 * `'indisponible'` pour `null`/`'NON_APPLICABLE'` (même rendu, même infobulle, causes distinctes). */
export function coverageDiscLevel(coverage: SampleCoverage): CoverageDiscLevel {
  if (coverage === null || coverage === 'NON_APPLICABLE') return 'indisponible';
  if (coverage >= 0.8) return 'plein';
  if (coverage >= 0.2) return 'mi-plein';
  return 'creux';
}

/** Infobulle du disque, selon le cas (`EX-SCR-115`). */
export function coverageDiscTooltip(coverage: SampleCoverage, listingCount: number, announcedCount: number | null): string {
  if (coverage === null || coverage === 'NON_APPLICABLE') return 'couverture d’échantillon indisponible';
  return `Fourchettes calculées sur ${listingCount} des ${announcedCount ?? 0} offres`;
}

/** `EX-SCR-115` — la mise en italique des trois fourchettes est réservée au seul cas d'une
 * couverture NUMÉRIQUE effectivement inférieure à 0,20 : `null`/`NON_APPLICABLE` n'italicisent rien
 * (ce sont des cas d'indisponibilité de la donnée, pas de faible couverture avérée). */
export function shouldItalicizeRanges(coverage: SampleCoverage): boolean {
  return typeof coverage === 'number' && coverage < 0.2;
}

/* ================================================================================================
 * Bandeau C3 — couverture d'échantillon de snapshot (EX-SCR-31)
 * ============================================================================================== */

export type C3Tone = 'vert' | 'ambre' | 'rouge' | 'neutre';

export interface C3Banner {
  readonly text: string;
  readonly tone: C3Tone;
  /** `EX-SCR-31`/`38` : non refermable quand `p < 20`. */
  readonly dismissible: boolean;
}

function toneForPercent(p: number): C3Tone {
  if (p >= 80) return 'vert';
  if (p >= 20) return 'ambre';
  return 'rouge';
}

/** `EX-SCR-31` — construit le bandeau `C3`, avec les nombres au format `EX-SCR-1`/`11`. */
export function buildC3Banner(input: {
  readonly listingCount: number;
  readonly announcedListingCount: number | null;
  readonly hasUserFilters: boolean;
}): C3Banner {
  if (input.hasUserFilters) {
    return {
      text: `Couverture d’échantillon non applicable sous filtre — ${formatInteger(input.listingCount)} annonces observées`,
      tone: 'neutre',
      dismissible: true,
    };
  }
  if (input.announcedListingCount === null) {
    return {
      text: 'Couverture d’échantillon inconnue — la source n’annonce pas d’effectif total pour ce périmètre',
      tone: 'neutre',
      dismissible: true,
    };
  }
  const ratio = input.announcedListingCount === 0 ? 0 : input.listingCount / input.announcedListingCount;
  const p = Math.round(ratio * 10000) / 100; // pourcentage, 2 décimales internes avant arrondi d'affichage
  const tone = toneForPercent(p);
  return {
    text: `Statistiques calculées sur ${formatInteger(input.listingCount)} annonces observées sur ${formatInteger(input.announcedListingCount)} annoncées — couverture ${formatPercent(p)}`,
    tone,
    dismissible: tone !== 'rouge',
  };
}
