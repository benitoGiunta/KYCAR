/**
 * KYCAR — Contrôleur débounce + historique (lot D5, finition)
 * =================================================================================================
 * Implémente `docs/plans/ARCHITECTURE.md` §5.3 et `docs/requirements/draft-behaviour.md` §A.3/§B.1 :
 *
 *   - Débounce par type de contrôle/geste (`EX-SRCH-1`…`8`), délégué à `debounce-policy.ts` — un
 *     timer par filtre, remis à zéro à chaque nouveau geste sur ce même filtre (dernier gagne).
 *   - Une entrée d'historique par filtre EFFECTIVEMENT appliqué (post-debounce) ; regroupement des
 *     rafales de moins de 800 ms en une seule entrée (`EX-NAV-13`) : le PREMIER changement d'une
 *     rafale ouvre une entrée d'historique NEUVE par `pushState` (`EX-NAV-12`), chaque changement
 *     SUIVANT de la même rafale met à jour cette même entrée par `replaceState` ; l'écoulement de
 *     la fenêtre d'inactivité de 800 ms ne produit PLUS d'entrée supplémentaire, elle a déjà été
 *     créée au premier changement (`DR-015` : corrige un défaut où l'ordre inverse —
 *     `replaceState` d'abord, `pushState` à l'expiration — écrasait l'entrée PRÉCÉDANT la rafale au
 *     lieu de créer la sienne propre, rendant le bouton précédent inopérant).
 *     `forcePush` couvre les cas toujours `pushState` d'`EX-NAV-14` (changement de route,
 *     réinitialisation, pagination), qui court-circuitent le regroupement.
 *   - Regroupement des rafales de filtres de classe `R` (`EX-SRCH-1bis`) : sous le seuil de
 *     3 changements en 300 ms, chaque changement recalcule immédiatement ; au 3ᵉ changement dans la
 *     fenêtre, l'application entre en mode groupé et un SEUL recalcul est planifié 200 ms après le
 *     dernier changement reçu — un nouveau changement REMPLACE le recalcul en attente, jamais ne
 *     s'y ajoute (« au plus un recalcul en attente à tout instant », aucune file).
 *
 * Ce module ne connaît ni l'état de sélection ni le codec d'URL : il reçoit de l'appelant un
 * `computeUrl()` (rappelé APRÈS que l'appelant a appliqué le changement, pour lire l'URL à jour) et
 * des callbacks `replaceState`/`pushState`/`recomputeLocal`/`reload`. Ce découplage le rend
 * testable sans DOM ni horloge réelle (minuteries natives `setTimeout`, contrôlables par
 * `vi.useFakeTimers()`).
 */

import { resolveDebounceMs, type InteractionGesture } from './debounce-policy';
import type { ControlKind, FilterClass } from './filter-types';

export interface HistoryBurstOptions {
  /** Fenêtre d'inactivité groupant les rafales en une seule entrée d'historique (`EX-NAV-13`). */
  readonly groupWindowMs?: number;
  readonly replaceState: (url: string) => void;
  readonly pushState: (url: string) => void;
}

/**
 * Regroupeur d'historique (`EX-NAV-12`/`13`). Isolé de la logique de débounce de recalcul : un
 * appel à `onApplied(url)` est fait pour CHAQUE filtre effectivement appliqué (post-debounce),
 * quelle que soit sa classe T/R.
 */
export class HistoryBurstGrouper {
  private readonly groupWindowMs: number;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly opts: HistoryBurstOptions) {
    this.groupWindowMs = opts.groupWindowMs ?? 800;
  }

  /** Un filtre vient d'être appliqué (post-debounce). Premier changement d'une rafale (aucune
   * fenêtre d'inactivité en cours) : `pushState`, qui CRÉE l'entrée d'historique de cette rafale
   * (`EX-NAV-12` : le bouton précédent doit revenir à l'état d'AVANT ce changement, jamais
   * l'écraser). Changement suivant de la MÊME rafale (fenêtre encore ouverte) : `replaceState`, qui
   * met à jour cette même entrée sans en produire une seconde (`EX-NAV-13`). Dans les deux cas, la
   * fenêtre de 800 ms est relancée ; à son expiration, rien de plus ne se produit — l'entrée existe
   * déjà et porte la dernière valeur reçue (`DR-015`). */
  onApplied(url: string): void {
    const isFirstOfBurst = this.timer === null;
    if (this.timer !== null) clearTimeout(this.timer);
    if (isFirstOfBurst) {
      this.opts.pushState(url);
    } else {
      this.opts.replaceState(url);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
    }, this.groupWindowMs);
  }

  /** Cas toujours `pushState`, indépendamment du regroupement (`EX-NAV-14`) : changement de route,
   * réinitialisation globale/par groupe, pagination. Annule toute rafale en cours — elle est
   * absorbée par cette entrée définitive plutôt que de produire une entrée supplémentaire plus tard. */
  forcePush(url: string): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.opts.pushState(url);
  }

  /** Vrai tant qu'une rafale est en cours de regroupement (utile aux tests et au diagnostic). */
  get isGrouping(): boolean {
    return this.timer !== null;
  }

  dispose(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}

export interface RClassBurstOptions {
  /** Fenêtre glissante d'observation des changements (`EX-SRCH-1bis`), défaut 300 ms. */
  readonly windowMs?: number;
  /** Nombre de changements dans la fenêtre à partir duquel le mode groupé s'active, défaut 3. */
  readonly thresholdCount?: number;
  /** Délai du recalcul unique une fois en mode groupé, défaut 200 ms après le dernier changement. */
  readonly trailingMs?: number;
  readonly now?: () => number;
  readonly recompute: () => void;
}

/**
 * Absorbeur de rafales pour les filtres de classe `R` (`EX-SRCH-1bis`, `ARB-57`). Sous le seuil,
 * chaque `notifyChange()` déclenche un recalcul immédiat (débounce 0 ms, `EX-SRCH-1`). Une fois le
 * seuil atteint dans la fenêtre, un SEUL recalcul reste planifiable à la fois : un nouveau
 * changement annule et remplace le recalcul en attente au lieu de s'y ajouter.
 */
export class RClassBurstCoordinator {
  private readonly windowMs: number;
  private readonly thresholdCount: number;
  private readonly trailingMs: number;
  private readonly now: () => number;
  private timestamps: number[] = [];
  private grouped = false;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly opts: RClassBurstOptions) {
    this.windowMs = opts.windowMs ?? 300;
    this.thresholdCount = opts.thresholdCount ?? 3;
    this.trailingMs = opts.trailingMs ?? 200;
    this.now = opts.now ?? (() => Date.now());
  }

  notifyChange(): void {
    const t = this.now();
    this.timestamps.push(t);
    this.timestamps = this.timestamps.filter((ts) => t - ts <= this.windowMs);

    if (!this.grouped) {
      if (this.timestamps.length < this.thresholdCount) {
        this.opts.recompute();
        return;
      }
      this.grouped = true;
    }

    // Mode groupé : au plus un recalcul en attente — un nouveau changement remplace le précédent.
    if (this.pendingTimer !== null) clearTimeout(this.pendingTimer);
    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = null;
      this.grouped = false;
      this.timestamps = [];
      this.opts.recompute();
    }, this.trailingMs);
  }

  /** Vrai s'il existe actuellement un recalcul planifié et non encore exécuté. */
  get hasPendingRecompute(): boolean {
    return this.pendingTimer !== null;
  }

  dispose(): void {
    if (this.pendingTimer !== null) clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
  }
}

export interface InteractionControllerOptions {
  readonly replaceState: (url: string) => void;
  readonly pushState: (url: string) => void;
  /** Recalcul local, sans réseau (filtre de classe R appliqué). */
  readonly recomputeLocal: () => void;
  /** Rechargement `DataProvider` (filtre de classe T appliqué). */
  readonly reload: () => void;
  readonly historyGroupWindowMs?: number;
  readonly rBurstOptions?: Omit<RClassBurstOptions, 'recompute'>;
}

export interface ScheduleChangeInput {
  readonly filterId: string;
  readonly gesture: InteractionGesture;
  readonly control: ControlKind;
  readonly cls: FilterClass;
  /**
   * Applique la valeur à l'état de sélection de l'appelant ET retourne l'URL canonique résultante
   * (`serializeQuery`/`assembleUrl`, D5-core). Appelé UNE FOIS, au terme du débounce, jamais avant —
   * les valeurs intermédiaires d'un champ en cours de frappe ne touchent jamais l'état ni l'URL
   * (`EX-NAV-12`).
   */
  readonly commit: () => string;
  /** Longueur de la valeur brute en cours de saisie, quand elle est connue de l'appelant — seul
   * signal dont dispose `resolveDebounceMs` pour appliquer le seuil de caractères d'`EX-SRCH-6`
   * (`DR-058`) : un filtre gouverné par un tel seuil (`location`) sans longueur fournie n'est
   * JAMAIS committé (repli conservateur), cohérent avec « non déclenché avant N caractères ». */
  readonly valueLength?: number;
}

/**
 * Contrôleur composite : débounce par filtre (table `EX-SRCH-1`…`8`) → `commit()` de l'appelant →
 * alimente à la fois le regroupeur d'historique et (si classe `R`) l'absorbeur de rafales locales,
 * ou (si classe `T`) déclenche directement un rechargement.
 */
export class InteractionController {
  private readonly history: HistoryBurstGrouper;
  private readonly rBurst: RClassBurstCoordinator;
  private readonly pendingByFilter = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly opts: InteractionControllerOptions) {
    this.history = new HistoryBurstGrouper({
      groupWindowMs: opts.historyGroupWindowMs,
      replaceState: opts.replaceState,
      pushState: opts.pushState,
    });
    this.rBurst = new RClassBurstCoordinator({
      ...opts.rBurstOptions,
      recompute: opts.recomputeLocal,
    });
  }

  /** Planifie un changement de filtre selon le débounce de son geste (`EX-SRCH-1`…`8`). Un nouveau
   * geste sur le MÊME filtre avant l'échéance annule et remplace le précédent (dernier gagne). */
  scheduleChange(input: ScheduleChangeInput): void {
    const ms = resolveDebounceMs(input.filterId, input.gesture, input.control, input.valueLength);
    const existing = this.pendingByFilter.get(input.filterId);
    if (existing !== undefined) clearTimeout(existing);
    this.pendingByFilter.delete(input.filterId);

    // `EX-SRCH-6` (`DR-058`) : sous le seuil de caractères, aucun commit n'est JAMAIS planifié —
    // pas même différé — jusqu'à ce qu'un geste ultérieur atteigne le seuil.
    if (!Number.isFinite(ms)) return;

    const fire = (): void => {
      this.pendingByFilter.delete(input.filterId);
      const url = input.commit();
      this.history.onApplied(url);
      // `DR-137` : seules les classes RÉSOLUES `'T'`/`'R'` atteignent ce contrôleur —
      // `resolveFilterClass` a déjà tranché `DYNAMIC_BODY` en amont (`filter-registry.ts`). Un
      // appelant qui transmettrait encore `DYNAMIC_BODY` ici serait un défaut de câblage, pas un
      // cas normal à couvrir silencieusement.
      if (input.cls === 'T') {
        this.opts.reload();
      } else {
        this.rBurst.notifyChange();
      }
    };

    if (ms <= 0) {
      fire();
      return;
    }
    this.pendingByFilter.set(
      input.filterId,
      setTimeout(fire, ms),
    );
  }

  /** Cas toujours `pushState`, hors débounce (`EX-NAV-14`) : route, réinitialisation, pagination. */
  forcePush(url: string): void {
    this.history.forcePush(url);
  }

  get isGroupingHistory(): boolean {
    return this.history.isGrouping;
  }

  get hasPendingRecompute(): boolean {
    return this.rBurst.hasPendingRecompute;
  }

  /** Annule toute minuterie en attente (démontage du bandeau, changement de snapshot). */
  dispose(): void {
    for (const t of this.pendingByFilter.values()) clearTimeout(t);
    this.pendingByFilter.clear();
    this.history.dispose();
    this.rBurst.dispose();
  }
}
