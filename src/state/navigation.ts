/**
 * KYCAR — Changement de marque et cible de navigation (lot D5, phase 2.8 vague F3)
 * =================================================================================================
 * `EX-SRCH-14` (`draft-behaviour.md` §B.3, table des dépendances entre filtres) : « Changer de
 * marque en mode 2 (via un sélecteur, hors clic sur zone-modèle) **vide** le modèle : il n'existe
 * aucune garantie qu'un `modelId` reste valide pour une nouvelle marque. L'utilisateur revient à un
 * état "marque choisie, modèle à choisir", concrètement une redirection vers `/marche` avec
 * `mmmv=<makeId>|||` posé à la nouvelle marque. » — sonde jamais écrite en 2.8
 * (`REMEDIATION-2.8.md` §7.1 point 2), attribuée par `D8-31` à `fix-state-2`.
 *
 * SOURCE DE VÉRITÉ UNIQUE. Ce module ne réimplémente rien : il DÉCIDE (quelle cible ?) et délègue la
 * construction de l'état à `router.ts#carryFiltersAcrossMode`, qui porte déjà les transitions
 * mode 1 ↔ mode 2 (`EX-NAV-15`/`16`/`17`, `D-09`). Le bandeau (`FilterBand.tsx`) et la coquille
 * (`src/app.tsx`) l'appellent tous deux, plutôt que de dupliquer la règle chacun de son côté.
 *
 * `<makeId>|||` ET `<makeId>` SONT LA MÊME VALEUR. La grammaire `mmmv` est
 * `make|model|modelLine|version` (`EX-SCR-72`) : `74|||` est `74` suivi de trois blocs de queue
 * VIDES. La forme CANONIQUE du dépôt est la forme courte — `screen-g-model.ts#serializeMmmv(make,
 * undefined)` produit `"74"`, `router.ts#carryFiltersAcrossMode` aussi, et `D8-04c` a été livrée et
 * ratifiée sous cette forme (`fix-app.md` §1 ligne 6). Émettre `74|||` ici créerait une SECONDE
 * écriture du même état, donc deux URL différentes pour une même sélection, contre `EX-NAV-8`/`9`
 * (canonicité). Ce module produit donc la forme courte, et `parseMmmvBlock` atteste que les deux
 * écritures se lisent à l'identique.
 *
 * Fonction PURE : aucune lecture du DOM, de l'historique ni de la route courante — l'appelant
 * fournit le mode, la sélection et le couple porté par la route.
 */

import type { MutableSelectionState, ScreenMode, SelectionState } from './filter-types';
import { carryFiltersAcrossMode, type ModeCarryPair } from './router';

/** Chemin de l'écran A (`EX-SCR-104`) — cible de la redirection d'`EX-SRCH-14`. */
export const MARKET_PATH = '/marche';

const MMMV_FILTER_ID = 'makesModelsVariants';

/** Un bloc `mmmv` exploitable : une marque, éventuellement un modèle. */
export interface MmmvBlock {
  readonly makeId: number;
  readonly modelId?: number;
}

/**
 * Lit UN bloc `mmmv` (`make`, `make|model`, `make|||`…). `null` si la valeur est absente, vide, non
 * numérique, ou porte PLUSIEURS blocs — une sélection multi-blocs n'est pas la désignation d'une
 * marque courante (même règle que `app.tsx#completeMmmvPair`, dont ce module généralise le cas).
 */
export function parseMmmvBlock(value: SelectionState[string] | undefined): MmmvBlock | null {
  if (value === undefined) return null;
  const blocks = (Array.isArray(value) ? value : [value]).map((v) => String(v)).filter((b) => b.length > 0);
  if (blocks.length !== 1) return null;
  const [makeIdStr, modelIdStr] = (blocks[0] as string).split('|');
  if (makeIdStr === undefined || !/^\d+$/.test(makeIdStr)) return null;
  const makeId = Number(makeIdStr);
  if (modelIdStr === undefined || modelIdStr.length === 0) return { makeId };
  if (!/^\d+$/.test(modelIdStr)) return { makeId };
  return { makeId, modelId: Number(modelIdStr) };
}

/** Écrit un bloc `mmmv` sous sa forme canonique (identique à `screen-g-model.ts#serializeMmmv`). */
export function serializeMmmvBlock(block: MmmvBlock): string {
  return block.modelId === undefined ? String(block.makeId) : `${block.makeId}|${block.modelId}`;
}

/**
 * `EX-SCR-103` (`D8-35`) — sélection vue par le contrôle taxonomique du bandeau. Sur l'écran B, le
 * couple courant n'est PAS dans la sélection : `carryFiltersAcrossMode` l'absorbe dans la route à
 * l'entrée en mode 2 (`EX-NAV-15`). Le contrôle `Marque / Modèle` doit néanmoins « afficher le
 * couple courant et, au clic, ouvrir le sélecteur `G` positionné sur ce couple » : cette fonction
 * réinjecte, POUR L'AFFICHAGE SEULEMENT, le bloc `mmmv` de la route.
 *
 * Retourne la sélection reçue TELLE QUELLE (même référence, donc aucune copie ni recalcul inutile)
 * hors du seul cas qui l'exige — mode 2 avec un couple de route connu. Ne mute jamais son entrée,
 * et n'est jamais utilisée pour sérialiser une URL : la route reste la seule porteuse du couple en
 * mode 2 (`EX-NAV-15`), sans quoi `mmmv` réapparaîtrait en double dans la requête.
 */
export function withRouteTaxonomy(
  selection: SelectionState,
  mode: ScreenMode,
  routePair: ModeCarryPair | undefined,
): SelectionState {
  if (mode !== 'mode2' || routePair === undefined) return selection;
  return { ...selection, [MMMV_FILTER_ID]: serializeMmmvBlock(routePair) };
}

export interface MakeChangeInput {
  /** Mode de l'écran DEPUIS lequel le choix est fait. */
  readonly mode: ScreenMode;
  /** Sélection de filtres courante (sans le couple taxonomique en mode 2, `EX-NAV-15`). */
  readonly selection: SelectionState;
  /** Marque — et éventuellement modèle — CHOISIE dans le sélecteur (écran G, `EX-SCR-72`). */
  readonly chosen: MmmvBlock;
  /**
   * Couple porté par la ROUTE en mode 2 (`matchRoute`). Absent en mode 1 ; absent en mode 2 tant
   * que l'appelant ne le fournit pas, auquel cas « même marque » n'est pas décidable et la règle
   * d'`EX-SRCH-14` s'applique par défaut (vider le modèle plutôt que laisser un `mmmv` orphelin).
   */
  readonly routePair?: ModeCarryPair;
}

export type MakeChangeOutcome =
  /** Mode 1 : le choix est un FILTRE, la route ne bouge pas. */
  | { readonly kind: 'filter'; readonly selection: MutableSelectionState }
  /** `EX-SRCH-14` : nouvelle marque en mode 2 → écran A, modèle vidé. */
  | { readonly kind: 'redirectToMarket'; readonly path: string; readonly selection: MutableSelectionState }
  /** Le choix désigne un MODÈLE : l'appelant navigue vers l'écran B de ce couple (`EX-NAV-15`). */
  | {
      readonly kind: 'goToModel';
      readonly pair: { readonly makeId: number; readonly modelId: number };
      readonly selection: MutableSelectionState;
    }
  /** Même marque, aucun modèle choisi : rien à faire (`EX-SCR-216` « sélection inchangée »). */
  | { readonly kind: 'unchanged'; readonly selection: MutableSelectionState };

/**
 * Résout la cible d'un changement de marque/modèle fait dans un sélecteur (`EX-SRCH-14`,
 * `EX-SRCH-8`, `EX-NAV-15`).
 *
 * Les quatre cas, dans cet ordre de priorité :
 *  1. **mode 1** — simple mise à jour du filtre `mmmv` ; la redirection vers l'écran B d'un couple
 *     complet reste le fait de la coquille (`D8-04b`, effet de `app.tsx`), pas de ce module.
 *  2. **mode 2, un modèle est choisi** — ce n'est pas un changement de marque au sens
 *     d'`EX-SRCH-14` (« hors clic sur zone-modèle ») mais la désignation d'un modèle : l'appelant
 *     entre en mode 2 sur ce couple, le bloc taxonomique étant ABSORBÉ par la route (`EX-NAV-15`).
 *  3. **mode 2, marque inchangée, sans modèle** — rien ne change.
 *  4. **mode 2, marque nouvelle, sans modèle** — `EX-SRCH-14` : retour à l'écran A, `mmmv` posé à
 *     la SEULE nouvelle marque (le modèle de la route quittée est vidé, il n'a aucune garantie de
 *     validité sous la nouvelle marque), tous les autres filtres partagés conservés.
 */
export function resolveMakeChange(input: MakeChangeInput): MakeChangeOutcome {
  const { mode, selection, chosen, routePair } = input;

  if (mode === 'mode1') {
    return {
      kind: 'filter',
      selection: { ...selection, [MMMV_FILTER_ID]: serializeMmmvBlock(chosen) },
    };
  }

  if (chosen.modelId !== undefined) {
    const withChoice: MutableSelectionState = { ...selection, [MMMV_FILTER_ID]: serializeMmmvBlock(chosen) };
    return {
      kind: 'goToModel',
      pair: { makeId: chosen.makeId, modelId: chosen.modelId },
      // `EX-NAV-15` : le bloc `mmmv` du couple choisi est absorbé par la route, jamais laissé
      // dans la requête — c'est exactement ce que fait `carryFiltersAcrossMode(mode1 → mode2)`.
      selection: carryFiltersAcrossMode(withChoice, 'mode1', 'mode2', {
        makeId: chosen.makeId,
        modelId: chosen.modelId,
      }),
    };
  }

  if (routePair !== undefined && routePair.makeId === chosen.makeId) {
    return { kind: 'unchanged', selection: { ...selection } };
  }

  return {
    kind: 'redirectToMarket',
    path: MARKET_PATH,
    // `EX-NAV-17` : retour en mode 1, le couple de la route est réinjecté dans `mmmv` — ici avec la
    // NOUVELLE marque et SANS modèle, ce qui est littéralement « `mmmv=<makeId>|||` posé à la
    // nouvelle marque » d'`EX-SRCH-14` (blocs de queue vides, voir l'en-tête de ce fichier).
    selection: carryFiltersAcrossMode(selection, 'mode2', 'mode1', { makeId: chosen.makeId }),
  };
}
