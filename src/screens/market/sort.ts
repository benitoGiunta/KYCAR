/**
 * KYCAR — Tri de l'écran A (lot D6)
 * =================================================================================================
 * Implémente `EX-DATA-70`/`70bis`/`70ter`/`71`/`72` (comparaison de libellés, ordre total, clé
 * réservée `modelId = 0`) et les options de tri `EX-SCR-119`/`120`/`121`.
 *
 * IMPORTANT — pourquoi ce module re-trie ce que le moteur (D4) a déjà trié : `src/engine/aggregate.ts`
 * départage `listingCount` égal par `id` croissant SEUL, parce que le moteur ne connaît que les
 * colonnes (aucun accès à `Make`/`Model.label`, hors de son périmètre). `EX-DATA-70` exige un
 * départage par LIBELLÉ avant l'identifiant technique. Ce module recompose donc l'ordre normatif
 * complet une fois les libellés disponibles (`ReferenceData`, côté écran), sans réécrire le moteur.
 */

/** `EX-DATA-70bis` — comparaison de libellés, règle unique. NFD, retrait des diacritiques
 * combinants `U+0300`–`U+036F`, `toUpperCase()` sans argument de locale (invariant), NFC, puis
 * comparaison point de code par point de code. `Intl.Collator` est interdit sur ce chemin. */
export function compareLabels(a: string, b: string): number {
  const normalize = (s: string): string =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .normalize('NFC');
  const na = normalize(a);
  const nb = normalize(b);
  if (na < nb) return -1;
  if (na > nb) return 1;
  return 0;
}

/* ================================================================================================
 * Tri des marques — EX-SCR-119/120, EX-DATA-70/70ter
 * ============================================================================================== */

export type MakeSortField = 'offres' | 'median' | 'alpha' | 'modeles';
export type SortDirection = 'asc' | 'desc';

/** `EX-SCR-120` — sens par défaut de chacune des quatre options. */
export const MAKE_SORT_DEFAULT_DIRECTION: Readonly<Record<MakeSortField, SortDirection>> = {
  offres: 'desc',
  median: 'asc',
  alpha: 'asc',
  modeles: 'desc',
};

/** Libellés fr-BE des quatre options, pour le contrôle de tri de la barre de synthèse. */
export const MAKE_SORT_FIELD_LABEL: Readonly<Record<MakeSortField, string>> = {
  offres: "Nombre d'offres",
  median: 'Prix médian',
  alpha: 'Alphabétique',
  modeles: 'Nombre de modèles',
};

export interface SortableMakeRow {
  readonly makeId: number;
  readonly label: string;
  readonly listingCount: number;
  /** `price.p50` de l'agrégat, `null` si non calculable (`EX-DATA-70ter` : clé primaire indéfinie). */
  readonly medianPrice: number | null;
  /** Nombre de modèles distincts présents dans la sélection pour cette marque (`EX-DATA-71`),
   * calculé côté vue à partir des `ModelAggregate` (le champ n'existe pas dans `MakeAggregate`
   * réellement produit par le moteur — voir `view-model.ts`). */
  readonly modelCount: number;
}

function primaryKey(row: SortableMakeRow, field: MakeSortField): number | null {
  switch (field) {
    case 'offres':
      return row.listingCount;
    case 'median':
      return row.medianPrice;
    case 'modeles':
      return row.modelCount;
    case 'alpha':
      return null; // clé primaire = le libellé lui-même, traité séparément ci-dessous.
  }
}

/** Comparateur total (`EX-DATA-70ter`) pour une option de tri de marque donnée. Une clé primaire
 * `null` (ex. médiane non calculable) place la ligne en fin d'ordre, **dans les deux sens** — elle
 * n'est jamais traitée comme `0`. Le départage (libellé puis `makeId`) est TOUJOURS croissant,
 * indépendamment du sens de tri appliqué à la clé primaire. */
export function compareMakeRows(a: SortableMakeRow, b: SortableMakeRow, field: MakeSortField, direction: SortDirection): number {
  if (field === 'alpha') {
    const byLabel = compareLabels(a.label, b.label);
    const signed = direction === 'asc' ? byLabel : -byLabel;
    if (signed !== 0) return signed;
    return a.makeId - b.makeId;
  }

  const ka = primaryKey(a, field);
  const kb = primaryKey(b, field);
  if (ka === null || kb === null) {
    if (ka === null && kb === null) {
      // égalité de clé primaire indéfinie : départage normal ci-dessous.
    } else {
      return ka === null ? 1 : -1;
    }
  } else {
    const cmp = ka - kb;
    const signed = direction === 'asc' ? cmp : -cmp;
    if (signed !== 0) return signed;
  }

  const byLabel = compareLabels(a.label, b.label);
  if (byLabel !== 0) return byLabel;
  return a.makeId - b.makeId;
}

/** Trie une liste de marques selon l'option/sens donnés (copie — ne mute jamais l'entrée). */
export function sortMakeRows<T extends SortableMakeRow>(rows: readonly T[], field: MakeSortField, direction: SortDirection): readonly T[] {
  return [...rows].sort((a, b) => compareMakeRows(a, b, field, direction));
}

/* ================================================================================================
 * Tri des modèles au sein d'une carte — EX-SCR-121, EX-DATA-72
 * ============================================================================================== */

export interface SortableModelRow {
  readonly modelId: number;
  readonly label: string;
  readonly listingCount: number;
}

/** `EX-SCR-121` — effectif décroissant, libellé croissant (`EX-DATA-70bis`), `modelId` croissant ;
 * la clé réservée `modelId = 0` (« Modèle non identifié ») est **toujours** en dernier, quel que
 * soit son effectif (`EX-DATA-72`) — ce tri ne suit PAS le tri des marques et n'a pas de sens
 * inversible : il n'existe qu'une seule forme, non paramétrable par l'utilisateur. */
export function compareModelRows(a: SortableModelRow, b: SortableModelRow): number {
  if ((a.modelId === 0) !== (b.modelId === 0)) return a.modelId === 0 ? 1 : -1;
  if (a.listingCount !== b.listingCount) return b.listingCount - a.listingCount;
  const byLabel = compareLabels(a.label, b.label);
  if (byLabel !== 0) return byLabel;
  return a.modelId - b.modelId;
}

export function sortModelRows<T extends SortableModelRow>(rows: readonly T[]): readonly T[] {
  return [...rows].sort(compareModelRows);
}
