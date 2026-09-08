/**
 * KYCAR — Logique pure de l'écran G, sélecteur marque/modèle (lot D5, finition, `EX-SCR-215`/`216`)
 * =================================================================================================
 * Recherche insensible à la casse et aux diacritiques (`skoda` trouve `Škoda`, `EX-SCR-216`), tri
 * par effectif décroissant puis alphabétique. Fonctions pures : testables sans DOM, et réutilisées
 * telles quelles par `ScreenG.tsx` pour ses gestionnaires.
 *
 * DETTE SIGNALÉE : « effectif d'offres dans le périmètre filtré courant » (`EX-SCR-216`) exige le
 * moteur d'agrégation (D4) réévalué à chaque ouverture de la modale sous les filtres actifs — hors
 * périmètre référentiel de D5 (`buildReferenceData`, D2, n'expose que `announcedCount`, la
 * dernière volumétrie connue de la source, PAS un recalcul local). Ce module accepte donc un
 * effectif déjà résolu par l'appelant (`counts` optionnel) et se rabat sur `announcedCount` sinon,
 * jamais sur `0` (`EX-SCR-89`/`ET-CHAMP-MANQUANT` : un effectif non calculable affiche `—`, pas `0`).
 */
import type { Make, Model } from '../../types/entities';
import type { ReferenceData } from '../../types/reference';

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export interface MakeRow {
  readonly make: Make;
  readonly count: number | null;
}
export interface ModelRow {
  readonly model: Model;
  readonly count: number | null;
}

function sortRows<T extends { readonly count: number | null }>(rows: T[], label: (r: T) => string): T[] {
  return rows.slice().sort((a, b) => {
    const ac = a.count ?? -1;
    const bc = b.count ?? -1;
    if (ac !== bc) return bc - ac;
    return label(a).localeCompare(label(b), 'fr');
  });
}

/** Marques filtrées par sous-chaîne de recherche (vide = tout le catalogue), triées par effectif. */
export function searchMakes(
  reference: ReferenceData,
  query: string,
  counts?: ReadonlyMap<number, number>,
): readonly MakeRow[] {
  const q = norm(query.trim());
  const filtered = q.length === 0 ? reference.makes : reference.makes.filter((m) => norm(m.label).includes(q));
  const rows = filtered.map((make) => ({ make, count: counts?.get(make.makeId) ?? make.announcedCount }));
  return sortRows(rows, (r) => r.make.label);
}

/** Modèles d'une marque, filtrés par sous-chaîne, triés par effectif. `makeId = undefined` = aucune
 * marque sélectionnée -> liste vide (le panneau droit reste vide tant qu'aucune marque n'est choisie). */
export function searchModels(
  reference: ReferenceData,
  makeId: number | undefined,
  query: string,
  counts?: ReadonlyMap<string, number>,
): readonly ModelRow[] {
  if (makeId === undefined) return [];
  const all = reference.modelsByMake.get(makeId) ?? [];
  const q = norm(query.trim());
  const filtered = q.length === 0 ? all : all.filter((m) => norm(m.label).includes(q));
  const rows = filtered.map((model) => ({
    model,
    count: counts?.get(`${model.makeId}:${model.modelId}`) ?? model.announcedCount,
  }));
  return sortRows(rows, (r) => r.model.label);
}

/** Sérialise la sélection de l'écran G au format relevé `makeId|modelId` (`EX-SCR-72`). Le
 * troisième/quatrième bloc (`modelLineId`/`version`) n'est pas produit par ce sélecteur simplifié
 * — dette signalée, `version0` reste un filtre texte libre séparé (`EX-SCR-71`). */
export function serializeMmmv(makeId: number, modelId: number | undefined): string {
  return modelId === undefined ? String(makeId) : `${makeId}|${modelId}`;
}

/** `true` si la sélection candidate diffère de l'état courant de l'écran appelant — `Appliquer`
 * est désactivé sinon (`EX-SCR-216` : « sélection inchangée »). */
export function isSameSelection(candidate: string, current: string | undefined): boolean {
  return candidate === (current ?? '');
}
