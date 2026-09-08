/**
 * KYCAR — Filtres « sans effet » après un changement de snapshot (lot D5, phase 2.8 vague F3)
 * =================================================================================================
 * `EX-SCR-101` (`draft-screens.md` §4) : « **Le bandeau ne se réinitialise jamais tout seul.** Ni
 * sur navigation, ni sur erreur, ni sur changement de snapshot. Si un filtre devient invalide après
 * un changement de snapshot (par exemple un `modelId` disparu), il est conservé, marqué en ambre
 * avec l'infobulle `Ce modèle est absent du snapshot du <date>` et compté séparément :
 * `1 filtre sans effet`. » — mineur isolé n° 3 de `FINAL-VERIFICATION.md` §3.2(d), attribué par
 * `D8-31` à `fix-state-2`.
 *
 * POURQUOI UN MODULE À PART, ET NON UNE EXTENSION DE `corrections.ts` (mission, point 1a) :
 * `corrections.ts` documente en tête de fichier, depuis le lot D5, la raison pour laquelle il ne
 * prend PAS `ReferenceData` en paramètre — « la seule validation hors de portée de ce module est
 * référentielle (un `makeId`/`modelId` de `mmmv` existe-t-il réellement dans la taxonomie ?) : elle
 * exige `ReferenceData` et est du ressort du composant appelant ». `router.ts` reprend mot pour mot
 * la même frontière (`resolveTaxonomyRoute` est SÉPARÉE de `matchRoute`). Étendre `corrections.ts`
 * casserait cette frontière et, surtout, changerait la NATURE de `EX-NAV-21` : une correction
 * d'URL RETIRE ou MODIFIE une valeur, alors qu'`EX-SCR-101` exige exactement le contraire — le
 * filtre est **conservé**, seulement marqué. Ce module est donc le pendant référentiel de
 * `corrections.ts`, construit sur le même patron que `resolveTaxonomyRoute` : pur, sans DOM, sans
 * dépendance à `src/types`, la taxonomie passée en paramètre.
 *
 * PORTÉE RÉELLEMENT ATTEIGNABLE (E4 — hypothèse écrite comme hypothèse). Seul `mmmv` porte
 * aujourd'hui un domaine dépendant du snapshot : les domaines énumérés du bandeau sont figés dans
 * `filter-registry.ts` (sourcés une fois sur `data/reference/filters.json`), et la note de lot de ce
 * registre REFUSE explicitement de les indexer sur `ReferenceData.vocabularies` (deux collisions
 * d'homonymie documentées, `pe_category`/`KYCAR_PRICE_EVALUATION` et `ustate`/`KYCAR_USAGE_STATE`).
 * Un code énuméré ne peut donc pas « disparaître avec le snapshot » : il n'y a rien à étendre de ce
 * côté sans inventer une table filtre → vocabulaire que le lot a écartée. Le type `IneffectiveKind`
 * ci-dessous laisse néanmoins la place à ce cas (`MISSING_ENUM_CODE`) pour le jour où un provider
 * publiera son propre vocabulaire ; aucune valeur de ce genre n'est produite en v1.
 *
 * Un filtre NON APPLIQUÉ par le provider (`unsupportedFilterIds`/`unappliedFilterIds`, `D-03`,
 * `D8-20`, O15 pour `body` en mode 2) est un autre mécanisme, déjà porté par la coquille sous forme
 * de bandeau : ce module ne le duplique pas.
 */

import type { FilterValue, SelectionState } from './filter-types';

/** Identifiant du filtre taxonomique — seul domaine dépendant du snapshot en v1 (voir l'en-tête). */
const MMMV_FILTER_ID = 'makesModelsVariants';

/**
 * Clé réservée « Modèle non identifié » (`EX-DATA-72`) : `modelId = 0` n'est JAMAIS un modèle
 * disparu — `router.ts#resolveTaxonomyRoute` fait déjà la même exception, à la lettre.
 */
const UNIDENTIFIED_MODEL_ID = 0;

/** Entrée de taxonomie : ce module n'a besoin d'aucun champ, seulement de la PRÉSENCE de la clé. */
export interface IneffectiveTaxonomy {
  readonly makeById: ReadonlyMap<number, unknown>;
  readonly modelByKey: ReadonlyMap<string, unknown>;
}

export interface IneffectiveContext {
  /**
   * Taxonomie du snapshot COURANT (les deux index de `ReferenceData` suffisent). **Absente ⇒ aucun
   * filtre n'est déclaré sans effet** : tant que le référentiel n'est pas chargé, un filtre est
   * présumé valide — jamais l'inverse (un marquage ambre par défaut serait une valeur affichée
   * fausse, `A-04`).
   */
  readonly taxonomy?: IneffectiveTaxonomy;
  /** Date du snapshot courant (`SnapshotDescriptor.capturedAt`, ISO-8601) — sert au message. */
  readonly snapshotDate?: string | Date;
}

export type IneffectiveKind = 'MISSING_MAKE' | 'MISSING_MODEL' | 'MISSING_ENUM_CODE';

export interface IneffectiveReason {
  /** Filtre concerné (`FilterDef.id`) — c'est LUI qui est compté « sans effet ». */
  readonly filterId: string;
  /**
   * Jeton visé dans la zone (4), au sens de `labels.ts#buildActiveFilterTokens` (`ActiveFilterToken.key`)
   * — permet au rendu de marquer le SEUL niveau fautif (`makesModelsVariants:model`) et de laisser
   * l'autre intact.
   */
  readonly tokenKey: string;
  readonly kind: IneffectiveKind;
  /** Message normatif d'`EX-SCR-101`, prêt pour l'infobulle. */
  readonly message: string;
}

export interface IneffectiveFilters {
  /** Identifiants DISTINCTS des filtres sans effet — le cardinal du compteur d'`EX-SCR-101`. */
  readonly ids: readonly string[];
  readonly reasons: readonly IneffectiveReason[];
}

const EMPTY: IneffectiveFilters = { ids: [], reasons: [] };

/**
 * Date `fr-BE` au format `JJ/MM/AAAA` (`EX-SCR-101`, `EX-SCR-212`). `dateStyle: 'short'` est
 * volontairement écarté : en fr-BE il produit `2/09/26` (jour non paddé, année sur deux chiffres),
 * ce qui n'est pas la forme demandée. `null` si la date est absente ou illisible — le message se
 * replie alors sur « du snapshot courant » plutôt que d'afficher une date inventée.
 */
export function formatSnapshotDateFrBE(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

const MESSAGE_BY_KIND: Readonly<Record<IneffectiveKind, (suffix: string) => string>> = {
  MISSING_MAKE: (suffix) => `Cette marque est absente ${suffix}`,
  MISSING_MODEL: (suffix) => `Ce modèle est absent ${suffix}`,
  MISSING_ENUM_CODE: (suffix) => `Cette valeur est absente ${suffix}`,
};

function messageFor(kind: IneffectiveKind, date: string | null): string {
  return MESSAGE_BY_KIND[kind](date === null ? 'du snapshot courant' : `du snapshot du ${date}`);
}

/** `EX-SCR-101` : « compté séparément : `1 filtre sans effet` ». `null` à zéro — rien n'est rendu. */
export function ineffectiveFilterCountLabel(count: number): string | null {
  if (count <= 0) return null;
  return `${count} filtre${count > 1 ? 's' : ''} sans effet`;
}

/** Normalise une valeur de filtre en blocs non vides (`mmmv` : `make|model|line|version`). */
function toBlocks(value: FilterValue): string[] {
  const raw = Array.isArray(value) ? value : [value];
  return raw.map((v) => String(v)).filter((v) => v.length > 0);
}

/** `${makeId}:${modelId}` — même formule que `modelKey` de `src/types/reference.ts`, dupliquée
 * sciemment (ce module ne dépend d'aucun code hors `src/state`, comme `router.ts#modelKeyOf`). */
function modelKeyOf(makeId: number, modelId: number): string {
  return `${makeId}:${modelId}`;
}

/**
 * Constate, sans jamais rien retirer, quels filtres de `selection` sont devenus **sans effet** sur
 * la taxonomie du snapshot courant (`EX-SCR-101`).
 *
 * Un `mmmv` fautif compte pour **un** filtre sans effet, quel que soit le nombre de niveaux
 * fautifs : le compteur d'`EX-SCR-101` compte des FILTRES, pas des jetons. Une marque absente
 * emporte son modèle (le niveau enfant n'a plus de sens sans son parent) et ne produit donc qu'un
 * seul motif, celui de la marque.
 *
 * Fonction PURE : aucune lecture du DOM, aucune horloge, aucun effet de bord ; même entrée, même
 * sortie (le seul appel à `Intl` porte sur la date fournie par l'appelant).
 */
export function ineffectiveFilters(
  selection: SelectionState,
  context: IneffectiveContext = {},
): IneffectiveFilters {
  const taxonomy = context.taxonomy;
  if (taxonomy === undefined) return EMPTY;

  const raw = selection[MMMV_FILTER_ID];
  if (raw === undefined) return EMPTY;
  const blocks = toBlocks(raw);
  if (blocks.length === 0) return EMPTY;

  const date = formatSnapshotDateFrBE(context.snapshotDate ?? null);
  const reasons: IneffectiveReason[] = [];

  // Sélection MULTI-BLOCS : la zone (4) la rend en un jeton unique au cardinal
  // (`labels.ts#formatMmmvTokens`) ; le motif porte donc la clé du filtre, pas celle d'un niveau.
  const multi = blocks.length > 1;

  for (const block of blocks) {
    const [makeIdStr, modelIdStr] = block.split('|');
    const makeId = Number(makeIdStr);
    if (!Number.isFinite(makeId)) continue; // bloc illisible : ce n'est pas « sans effet », c'est mal formé
    if (!taxonomy.makeById.has(makeId)) {
      reasons.push({
        filterId: MMMV_FILTER_ID,
        tokenKey: multi ? MMMV_FILTER_ID : `${MMMV_FILTER_ID}:make`,
        kind: 'MISSING_MAKE',
        message: messageFor('MISSING_MAKE', date),
      });
      break; // la marque emporte le modèle : un seul motif suffit
    }
    if (modelIdStr === undefined || modelIdStr.length === 0) continue;
    const modelId = Number(modelIdStr);
    if (!Number.isFinite(modelId) || modelId === UNIDENTIFIED_MODEL_ID) continue;
    if (!taxonomy.modelByKey.has(modelKeyOf(makeId, modelId))) {
      reasons.push({
        filterId: MMMV_FILTER_ID,
        tokenKey: multi ? MMMV_FILTER_ID : `${MMMV_FILTER_ID}:model`,
        kind: 'MISSING_MODEL',
        message: messageFor('MISSING_MODEL', date),
      });
      break;
    }
  }

  if (reasons.length === 0) return EMPTY;
  const ids = [...new Set(reasons.map((r) => r.filterId))];
  return { ids, reasons };
}
