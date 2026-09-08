/**
 * KYCAR — Suggestions de retrait « leave-one-out » de l'état `ET-VIDE-FILTRES` (coquille)
 * =================================================================================================
 * `EX-SCR-26` (« retirer « <libellé> » : <k> offres de plus ») et `EX-SCR-174` (le même bloc sur
 * l'écran B, livré par `fix-screens-2` en F3) exigent un chiffre : `<k>` est une valeur AFFICHÉE à
 * l'utilisateur, donc jamais une estimation. Ce module la calcule exactement, en rejouant les
 * prédicats du moteur sur le lot colonnaire déjà chargé — la même mécanique que
 * `DataController.enterMode2`, qui dérive `rows` en compilant `buildRefinePredicates` sur `batch`.
 *
 * Pourquoi ici et pas dans le contrôleur : le calcul n'a de sens qu'en mode 2 (`O17` interdit de
 * charger les colonnes en mode 1 — cf. `fix-app.md` §3), il porte sur un lot DÉJÀ élagué au couple
 * marque/modèle (~10³ lignes : un balayage par filtre actif est trivial et n'emprunte aucun chemin
 * réseau), et il n'ajoute aucun état au contrôleur. `ScreenALoadedData.topRestrictiveFilters` reste
 * `[]` côté mode 1, où le calcul exigerait un balayage des 100 000 annonces (dette signalée dans
 * `data-controller.ts`, hors de la portée de `D8-31`).
 *
 * Module PUR : aucun DOM, aucun hook, aucun état — éprouvé par `tests/review/D8/shell-wiring-f3.test.ts`.
 */
import { buildActiveFilterTokens, type TokenTaxonomyReference } from '../components/filters/labels';
import { compilePredicates } from '../engine/predicates';
import { buildRefinePredicates } from '../orchestration/refine-predicates';
import type { RestrictiveFilterHint } from '../screens/market/state';
import type { SelectionState } from '../state/filter-types';
import type { SelectionInput } from '../types/index';
import { FILTER_BY_ID } from '../state/filter-registry';
import { partitionSelection } from '../state/tr-split';
import type { ListingColumnBatch } from '../types/index';
import type { ReferenceData } from '../types/reference';

/** `EX-SCR-26` — au plus trois suggestions de retrait. */
export const TOP_RESTRICTIVE_MAX = 3;

/**
 * Retrait d'un filtre depuis une suggestion (`EX-SCR-26`) ou depuis un jeton : un patch de
 * sélection à passer à `applyFilters`. Une BORNE d'intervalle emporte sa jumelle — le jeton du
 * bandeau représente le couple (`EX-SCR-75`), le laisser à moitié posé afficherait un filtre que
 * l'utilisateur croit avoir retiré.
 */
export function removalPatchFor(filterId: string): SelectionInput {
  const out: Record<string, undefined> = { [filterId]: undefined };
  const paired = FILTER_BY_ID.get(filterId)?.pairedWith;
  if (paired !== undefined) out[paired] = undefined;
  // Même convention que `histogram-model.ts::clearMetricFilters` : un patch de RETRAIT porte des
  // clés à `undefined`, qu'`App.applyFilters` traduit en `delete`. `SelectionInput` n'admet pas
  // `undefined` dans son type de valeur ; la conversion est explicite et locale, pas silencieuse.
  return out as unknown as SelectionInput;
}

/**
 * Effectif d'une sélection sur un lot colonnaire déjà chargé — exactement le calcul de `rows` dans
 * `DataController.enterMode2` (mêmes `partitionSelection`/`buildRefinePredicates`/`compilePredicates`,
 * donc la même vérité : aucune règle de filtrage n'est réécrite ici).
 */
export function countMatchingRows(
  batch: ListingColumnBatch,
  selection: SelectionState,
  referenceData: ReferenceData,
): number {
  const { r } = partitionSelection(selection, 'mode2');
  const { refine } = buildRefinePredicates(r, referenceData);
  const compiled = compilePredicates(batch, refine);
  if (compiled.length === 0) return batch.rowCount;
  let n = 0;
  for (let i = 0; i < batch.rowCount; i += 1) {
    let ok = true;
    for (const p of compiled) {
      if (!p.test(i)) {
        ok = false;
        break;
      }
    }
    if (ok) n += 1;
  }
  return n;
}

/**
 * `EX-SCR-26`/`EX-SCR-174` — les filtres les plus restrictifs de la sélection courante, mesurés un
 * par un (« leave-one-out ») sur le lot chargé.
 *
 * - Un JETON du bandeau = une suggestion (un intervalle est un seul filtre pour l'utilisateur) ; le
 *   libellé est celui du jeton (`buildActiveFilterTokens`), jamais un nom de paramètre d'URL.
 * - Un filtre de classe `T` n'est pas appliqué localement (il est absorbé par la route ou servi par
 *   la source) : son retrait rechargerait le jeu de données, le gain n'est donc pas calculable ici
 *   et vaut `null` — le bouton s'affiche alors SANS chiffre, conformément à `EX-SCR-26`.
 * - Un retrait qui ne rend AUCUNE offre de plus n'est pas une suggestion : proposer
 *   « 0 offres de plus » serait un conseil faux.
 */
export function topRestrictiveFilters(args: {
  readonly selection: SelectionState;
  readonly batch: ListingColumnBatch;
  readonly referenceData: ReferenceData & TokenTaxonomyReference;
  readonly baselineCount: number;
  readonly limit?: number;
}): readonly RestrictiveFilterHint[] {
  const limit = args.limit ?? TOP_RESTRICTIVE_MAX;
  const measured: RestrictiveFilterHint[] = [];
  const transverse: RestrictiveFilterHint[] = [];

  for (const token of buildActiveFilterTokens(args.selection, args.referenceData)) {
    const ids = token.filterIds;
    if (ids.length === 0) continue;
    const filterId = ids[0] as string;
    const isTransverse = ids.every((id) => FILTER_BY_ID.get(id)?.cls === 'T');
    if (isTransverse) {
      transverse.push({ filterId, label: token.text, gain: null });
      continue;
    }
    const without = { ...args.selection } as Record<string, unknown>;
    for (const id of ids) delete without[id];
    const gain = countMatchingRows(args.batch, without as SelectionState, args.referenceData) - args.baselineCount;
    if (gain > 0) measured.push({ filterId, label: token.text, gain });
  }

  measured.sort((a, b) => (b.gain as number) - (a.gain as number));
  return [...measured, ...transverse].slice(0, limit);
}
