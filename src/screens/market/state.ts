/**
 * KYCAR — États de l'écran A (lot D6)
 * =================================================================================================
 * `deriveScreenAState` est la fonction UNIQUE qui décide dans lequel des 6 états rendables l'écran
 * se trouve, à partir de ce que l'orchestration (D8, ou un harnais de test) a obtenu du
 * `DataProvider`/moteur. Aucun composant ne réimplémente cette décision — il ne fait qu'un `switch`
 * exhaustif sur `.kind` (`noFallthroughCasesInSwitch` de `tsconfig.json` le garantit).
 *
 * Correspondance avec le catalogue `EX-SCR-23`..`39` (`docs/requirements/draft-screens.md` §2) :
 *   - `'loading'`       → `ET-CHARGE-INIT` (`EX-SCR-23`/`130`, squelette).
 *   - `'provider-error'`→ `ET-ERREUR-PROVIDER` (`EX-SCR-28`).
 *   - `'empty'`         → `ET-VIDE-FILTRES` (`EX-SCR-26`) si un filtre est posé, sinon
 *                         `ET-VIDE-SANS-FILTRE` (`EX-SCR-27`, traité comme une panne).
 *   - `'partial'`       → `EX-SCR-133` (cartes en échec partiel de la grille).
 *   - `'no-filter'`     → `SANS-FILTRE` (`EX-SCR-27bis`/`125`/`126` : amorce + 20 premières marques).
 *   - `'ready'`         → rendu nominal, grille complète filtrée.
 * `ET-CHARGE-MAJ`/`ET-CHARGE-LOCAL` (`EX-SCR-24`/`25`) et le partiel PAR CARTE (`EX-SCR-132`, un
 * agrégat de marque sans ses modèles) sont des recouvrements TRANSITOIRES ou LOCAUX, pas des états
 * d'écran entiers — ils restent portés respectivement par un composant de recouvrement (hors
 * périmètre de ce module d'état) et par `MakeCardViewModel.modelsUnavailable` (`view-model.ts`).
 */

import type { MakeAggregate, ModelAggregate } from '../../providers/DataProvider';

export interface RestrictiveFilterHint {
  readonly filterId: string;
  readonly label: string;
  /** `EX-SCR-26` : différence d'effectif au retrait de ce filtre seul (« leave-one-out »).
   * `null` pour un filtre de classe `T` (dont le retrait rechargerait le jeu de données local) :
   * le bouton affiche alors le libellé seul, sans chiffre. */
  readonly gain: number | null;
}

export interface ScreenALoadedData {
  readonly makeAggregates: readonly MakeAggregate[];
  /** Par `makeId`, les agrégats de modèle de cette marque, ou `'unavailable'` si leur chargement a
   * échoué alors que la marque elle-même a réussi (`EX-SCR-132`). Une entrée absente de la map
   * n'est pas encore résolue au moment de l'appel (le composant appelant garantit une entrée par
   * `makeId` de `makeAggregates` avant de construire cet objet, dans son propre cycle de rendu). */
  readonly modelAggregatesByMake: ReadonlyMap<number, readonly ModelAggregate[] | 'unavailable'>;
  readonly hasUserFilters: boolean;
  readonly activeFilterCount: number;
  readonly topRestrictiveFilters: readonly RestrictiveFilterHint[];
  /** `snapshot.date`/`capturedAt`, pour `EX-SCR-27`. */
  readonly snapshotDate: string;
  /** `EX-SCR-133` : marques dont l'agrégat lui-même a échoué à charger (distinct de `EX-SCR-132`,
   * où la marque a réussi mais pas ses modèles). */
  readonly failedMakeIds: ReadonlySet<number>;
  /** `n` de `<k> marques sur <n> n'ont pas pu être chargées` (`EX-SCR-133`) : le nombre de marques
   * dont le chargement a été TENTÉ, `failedMakeIds.size + makeAggregates.length` en général (sauf
   * chevauchement impossible par construction : un `makeId` en échec n'a pas d'agrégat). */
  readonly totalMakesAttempted: number;
}

export type LoadPhase =
  | { readonly phase: 'loading' }
  | { readonly phase: 'error'; readonly errorCode: string; readonly attemptedAt: string; readonly hasCachedResult: boolean }
  | { readonly phase: 'loaded'; readonly data: ScreenALoadedData };

export type ScreenAState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'provider-error'; readonly errorCode: string; readonly attemptedAt: string; readonly hasCachedResult: boolean }
  | { readonly kind: 'empty'; readonly reason: 'no-filter'; readonly snapshotDate: string }
  | {
      readonly kind: 'empty';
      readonly reason: 'filters';
      readonly activeFilterCount: number;
      readonly topRestrictive: readonly RestrictiveFilterHint[];
    }
  | { readonly kind: 'partial'; readonly data: ScreenALoadedData; readonly failedMakeIds: ReadonlySet<number>; readonly totalMakesAttempted: number }
  | { readonly kind: 'no-filter'; readonly data: ScreenALoadedData }
  | { readonly kind: 'ready'; readonly data: ScreenALoadedData };

/** Les 6 étiquettes rendables, pour un test exhaustif (`Object.values` d'un enum n'existant pas en
 * TS pour un type union — cette liste est la source de vérité du dénombrement « 6 états »). */
export const SCREEN_A_STATE_KINDS = ['loading', 'provider-error', 'empty', 'partial', 'no-filter', 'ready'] as const;

export function deriveScreenAState(load: LoadPhase): ScreenAState {
  if (load.phase === 'loading') return { kind: 'loading' };
  if (load.phase === 'error') {
    return { kind: 'provider-error', errorCode: load.errorCode, attemptedAt: load.attemptedAt, hasCachedResult: load.hasCachedResult };
  }

  const data = load.data;
  if (data.makeAggregates.length === 0) {
    if (!data.hasUserFilters) return { kind: 'empty', reason: 'no-filter', snapshotDate: data.snapshotDate };
    return { kind: 'empty', reason: 'filters', activeFilterCount: data.activeFilterCount, topRestrictive: data.topRestrictiveFilters };
  }

  if (data.failedMakeIds.size > 0) {
    return { kind: 'partial', data, failedMakeIds: data.failedMakeIds, totalMakesAttempted: data.totalMakesAttempted };
  }

  if (!data.hasUserFilters) return { kind: 'no-filter', data };
  return { kind: 'ready', data };
}
