import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  HistoryBurstGrouper,
  InteractionController,
  RClassBurstCoordinator,
} from './interaction';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('HistoryBurstGrouper — EX-NAV-12/13', () => {
  it('un changement isolé produit un replaceState immédiat puis un pushState après 800 ms', () => {
    const replaceState = vi.fn();
    const pushState = vi.fn();
    const grouper = new HistoryBurstGrouper({ replaceState, pushState });

    grouper.onApplied('/marche?fuel=D');
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(pushState).not.toHaveBeenCalled();

    vi.advanceTimersByTime(800);
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledWith('/marche?fuel=D');
  });

  it('une rafale de changements < 800 ms entre eux ne produit qu’UNE seule entrée pushState', () => {
    const replaceState = vi.fn();
    const pushState = vi.fn();
    const grouper = new HistoryBurstGrouper({ replaceState, pushState });

    grouper.onApplied('/marche?eq=1');
    vi.advanceTimersByTime(200);
    grouper.onApplied('/marche?eq=1,2');
    vi.advanceTimersByTime(200);
    grouper.onApplied('/marche?eq=1,2,3');
    vi.advanceTimersByTime(200);
    grouper.onApplied('/marche?eq=1,2,3,4');

    // Chaque changement intermédiaire réécrit l'URL par replaceState, jamais pushState.
    expect(replaceState).toHaveBeenCalledTimes(4);
    expect(pushState).not.toHaveBeenCalled();

    // Écoulement de la fenêtre d'inactivité de 800 ms depuis le DERNIER changement.
    vi.advanceTimersByTime(800);
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledWith('/marche?eq=1,2,3,4');
  });

  it('forcePush (EX-NAV-14) court-circuite le regroupement et pousse immédiatement', () => {
    const replaceState = vi.fn();
    const pushState = vi.fn();
    const grouper = new HistoryBurstGrouper({ replaceState, pushState });

    grouper.onApplied('/marche?fuel=D');
    grouper.forcePush('/marche/16-opel/1174-corsa');
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledWith('/marche/16-opel/1174-corsa');

    // La rafale annulée par forcePush ne doit pas produire un second pushState plus tard.
    vi.advanceTimersByTime(2000);
    expect(pushState).toHaveBeenCalledTimes(1);
  });

  it('isGrouping reflète l’état de la fenêtre en cours', () => {
    const grouper = new HistoryBurstGrouper({ replaceState: vi.fn(), pushState: vi.fn() });
    expect(grouper.isGrouping).toBe(false);
    grouper.onApplied('/marche?fuel=D');
    expect(grouper.isGrouping).toBe(true);
    vi.advanceTimersByTime(800);
    expect(grouper.isGrouping).toBe(false);
  });
});

describe('RClassBurstCoordinator — EX-SRCH-1bis', () => {
  it('sous le seuil de 3 changements en 300 ms, chaque changement recalcule immédiatement', () => {
    const recompute = vi.fn();
    const coord = new RClassBurstCoordinator({ recompute });

    coord.notifyChange();
    coord.notifyChange();
    expect(recompute).toHaveBeenCalledTimes(2);
    expect(coord.hasPendingRecompute).toBe(false);
  });

  it('au 3e changement dans la fenêtre, un SEUL recalcul reste en attente (jamais de file)', () => {
    const recompute = vi.fn();
    const coord = new RClassBurstCoordinator({ recompute, windowMs: 300, thresholdCount: 3, trailingMs: 200 });

    coord.notifyChange(); // 1er : immédiat
    coord.notifyChange(); // 2e : immédiat
    coord.notifyChange(); // 3e : entre en mode groupé, planifie un recalcul à +200ms
    expect(recompute).toHaveBeenCalledTimes(2);
    expect(coord.hasPendingRecompute).toBe(true);

    coord.notifyChange(); // 4e : remplace le recalcul planifié, n'en ajoute pas un second
    coord.notifyChange(); // 5e : idem
    expect(recompute).toHaveBeenCalledTimes(2); // toujours 2 : aucun recalcul supplémentaire déclenché
    expect(coord.hasPendingRecompute).toBe(true);

    vi.advanceTimersByTime(200);
    expect(recompute).toHaveBeenCalledTimes(3); // le recalcul unique en attente s'exécute enfin
    expect(coord.hasPendingRecompute).toBe(false);
  });

  it('après le recalcul groupé, un nouveau changement isolé redémarre en mode immédiat', () => {
    const recompute = vi.fn();
    const coord = new RClassBurstCoordinator({ recompute, windowMs: 300, thresholdCount: 3, trailingMs: 200 });
    coord.notifyChange();
    coord.notifyChange();
    coord.notifyChange();
    vi.advanceTimersByTime(200);
    expect(recompute).toHaveBeenCalledTimes(3);

    coord.notifyChange();
    expect(recompute).toHaveBeenCalledTimes(4); // immédiat de nouveau, pas de résidu de l'état groupé
  });
});

describe('InteractionController — composition débounce + historique + recalcul', () => {
  function makeController() {
    const replaceState = vi.fn();
    const pushState = vi.fn();
    const recomputeLocal = vi.fn();
    const reload = vi.fn();
    const controller = new InteractionController({
      replaceState,
      pushState,
      recomputeLocal,
      reload,
    });
    return { controller, replaceState, pushState, recomputeLocal, reload };
  }

  it('un changement de filtre classe R, discret, s’applique à 0 ms et recalcule localement', () => {
    const { controller, recomputeLocal, reload, replaceState } = makeController();
    controller.scheduleChange({
      filterId: 'fuelType',
      gesture: 'discrete-change',
      control: 'checkbox-list',
      cls: 'R',
      commit: () => '/marche?fuel=D',
    });
    expect(replaceState).toHaveBeenCalledWith('/marche?fuel=D');
    expect(recomputeLocal).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it('un changement de filtre classe T recharge le DataProvider plutôt que de recalculer localement', () => {
    const { controller, recomputeLocal, reload } = makeController();
    controller.scheduleChange({
      filterId: 'equipment',
      gesture: 'discrete-change',
      control: 'panel-search-multi',
      cls: 'T',
      commit: () => '/marche?eq=1',
    });
    vi.advanceTimersByTime(250); // EX-SRCH-2
    expect(reload).toHaveBeenCalledTimes(1);
    expect(recomputeLocal).not.toHaveBeenCalled();
  });

  it('une rafale rapide sur un même filtre annule les commits intermédiaires (dernier gagne)', () => {
    const { controller } = makeController();
    const commit = vi.fn(() => '/marche?kwd=x');
    controller.scheduleChange({ filterId: 'keyword', gesture: 'keystroke', control: 'text-field', cls: 'T', commit });
    vi.advanceTimersByTime(100);
    controller.scheduleChange({ filterId: 'keyword', gesture: 'keystroke', control: 'text-field', cls: 'T', commit });
    vi.advanceTimersByTime(100);
    // Toujours dans la fenêtre de 400 ms depuis le dernier geste : aucun commit encore.
    expect(commit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('une rafale de changements R < 800 ms produit une seule entrée d’historique et au plus un recalcul en attente', () => {
    const { controller, pushState, recomputeLocal } = makeController();
    let n = 0;
    const commit = () => `/marche?eq=${++n}`;

    // Cases à cocher, EX-SRCH-1 : 0 ms, application immédiate à chaque geste.
    for (let i = 0; i < 5; i++) {
      controller.scheduleChange({
        filterId: 'priceEvaluation',
        gesture: 'discrete-change',
        control: 'checkbox-list',
        cls: 'R',
        commit,
      });
      vi.advanceTimersByTime(50); // rafale rapprochée, bien sous 300 ms ET 800 ms
    }

    // EX-SRCH-1bis : au plus un recalcul en attente à tout instant (jamais de file).
    expect(controller.hasPendingRecompute || recomputeLocal.mock.calls.length >= 2).toBe(true);

    // EX-NAV-13 : la rafale entière (5 changements en 250 ms) tient sous 800 ms d'inactivité —
    // aucune entrée d'historique définitive tant que la fenêtre n'est pas écoulée.
    expect(pushState).not.toHaveBeenCalled();
    vi.advanceTimersByTime(800);
    expect(pushState).toHaveBeenCalledTimes(1);

    // Et le recalcul groupé, s'il restait en attente, a fini par s'exécuter — jamais en file.
    vi.advanceTimersByTime(500);
    expect(controller.hasPendingRecompute).toBe(false);
  });

  it('forcePush pousse une entrée définitive hors débounce (changement de route, EX-NAV-14)', () => {
    const { controller, pushState } = makeController();
    controller.forcePush('/marche/16-opel/1174-corsa');
    expect(pushState).toHaveBeenCalledWith('/marche/16-opel/1174-corsa');
  });

  it('dispose annule toute minuterie en attente sans invoquer les callbacks', () => {
    const { controller, recomputeLocal, pushState } = makeController();
    controller.scheduleChange({
      filterId: 'keyword',
      gesture: 'keystroke',
      control: 'text-field',
      cls: 'T',
      commit: () => '/marche?kwd=x',
    });
    controller.dispose();
    vi.advanceTimersByTime(5000);
    expect(recomputeLocal).not.toHaveBeenCalled();
    expect(pushState).not.toHaveBeenCalled();
  });
});
