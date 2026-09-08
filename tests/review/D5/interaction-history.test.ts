/**
 * Sonde de revue D5 — débounce (`EX-SRCH-1`…`8`, `EX-SRCH-1bis`) et historique navigateur
 * (`EX-NAV-12`/`13`/`14`), confrontés aux délais chiffrés de l'annexe C.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POSTAL_CODE_MIN_CHARS, resolveDebounceMs } from '../../../src/state/debounce-policy';
import {
  HistoryBurstGrouper,
  InteractionController,
  RClassBurstCoordinator,
} from '../../../src/state/interaction';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('D5 — EX-SRCH-1…8 : les délais chiffrés de l’annexe C', () => {
  it('chaque ligne normative de la table §B.1 est appliquée à la valeur exacte', () => {
    const table: ReadonlyArray<readonly [string, number]> = [
      ['EX-SRCH-1 cases/radio', resolveDebounceMs('offer', 'discrete-change', 'checkbox-list')],
      ['EX-SRCH-2 eq', resolveDebounceMs('equipment', 'discrete-change', 'panel-search-multi')],
      ['EX-SRCH-3 curseur', resolveDebounceMs('priceFrom', 'slider-commit', 'range-pair')],
      ['EX-SRCH-4 numérique', resolveDebounceMs('priceFrom', 'keystroke', 'range-pair')],
      ['EX-SRCH-5 texte', resolveDebounceMs('keyword', 'keystroke', 'text-field')],
      ['EX-SRCH-6 code postal', resolveDebounceMs('location', 'keystroke', 'geo-composite')],
      ['EX-SRCH-7 zipr', resolveDebounceMs('radius', 'discrete-change', 'select-indifferent')],
      ['EX-SRCH-8 mmmv', resolveDebounceMs('makesModelsVariants', 'selection-immediate', 'structured-picker')],
    ];
    expect(table.map(([, ms]) => ms)).toEqual([0, 250, 150, 500, 400, 500, 0, 0]);
    expect(POSTAL_CODE_MIN_CHARS).toBe(4);
  });
});

describe('D5 — EX-SRCH-1bis : regroupement des rafales de classe R (3 en 300 ms, 200 ms de traîne)', () => {
  it('sous le seuil, chaque changement recalcule ; au 3ᵉ, un seul recalcul est planifié', () => {
    const recompute = vi.fn();
    const coord = new RClassBurstCoordinator({ recompute });
    coord.notifyChange();
    coord.notifyChange();
    expect(recompute).toHaveBeenCalledTimes(2);
    coord.notifyChange();
    expect(recompute).toHaveBeenCalledTimes(2);
    expect(coord.hasPendingRecompute).toBe(true);
    vi.advanceTimersByTime(200);
    expect(recompute).toHaveBeenCalledTimes(3);
    coord.dispose();
  });

  it('20 changements R en rafale ne produisent jamais de file : au plus un recalcul en attente', () => {
    const recompute = vi.fn();
    const coord = new RClassBurstCoordinator({ recompute });
    for (let i = 0; i < 20; i++) {
      coord.notifyChange();
      vi.advanceTimersByTime(10);
      expect(coord.hasPendingRecompute || recompute.mock.calls.length > 0).toBe(true);
    }
    vi.advanceTimersByTime(300);
    // 2 recalculs immédiats (sous le seuil) + 1 recalcul groupé, jamais 20.
    expect(recompute).toHaveBeenCalledTimes(3);
    coord.dispose();
  });
});

describe('D5 — EX-NAV-12/13/14 : entrées d’historique', () => {
  it('20 changements rapprochés (< 800 ms) ne produisent qu’UNE entrée pushState', () => {
    const replaceState = vi.fn();
    const pushState = vi.fn();
    const grouper = new HistoryBurstGrouper({ replaceState, pushState });
    for (let i = 0; i < 20; i++) {
      grouper.onApplied(`/marche?eq=${i}`);
      vi.advanceTimersByTime(100);
    }
    expect(pushState).not.toHaveBeenCalled();
    vi.advanceTimersByTime(800);
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledWith('/marche?eq=19');
    expect(replaceState).toHaveBeenCalledTimes(20);
    grouper.dispose();
  });

  it('EX-NAV-14 — forcePush court-circuite le regroupement et absorbe la rafale en cours', () => {
    const pushState = vi.fn();
    const grouper = new HistoryBurstGrouper({ replaceState: vi.fn(), pushState });
    grouper.onApplied('/marche?fuel=D');
    grouper.forcePush('/marche/16-opel/1174-corsa');
    vi.advanceTimersByTime(5_000);
    expect(pushState).toHaveBeenCalledTimes(1);
    grouper.dispose();
  });

  it('EX-NAV-12 — un filtre T déclenche un rechargement, un filtre R un recalcul local', () => {
    const recomputeLocal = vi.fn();
    const reload = vi.fn();
    const controller = new InteractionController({
      replaceState: vi.fn(),
      pushState: vi.fn(),
      recomputeLocal,
      reload,
    });
    controller.scheduleChange({
      filterId: 'gearType',
      gesture: 'discrete-change',
      control: 'checkbox-list',
      cls: 'T',
      commit: () => '/marche?gear=A',
    });
    controller.scheduleChange({
      filterId: 'sellerType',
      gesture: 'discrete-change',
      control: 'radio-segmented',
      cls: 'R',
      commit: () => '/marche?custtype=P',
    });
    expect(reload).toHaveBeenCalledTimes(1);
    expect(recomputeLocal).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it('EX-NAV-12 — les valeurs intermédiaires d’une frappe ne touchent jamais l’URL', () => {
    const commit = vi.fn(() => '/marche?kwd=coupe');
    const replaceState = vi.fn();
    const controller = new InteractionController({
      replaceState,
      pushState: vi.fn(),
      recomputeLocal: vi.fn(),
      reload: vi.fn(),
    });
    for (let i = 0; i < 'coupe'.length; i++) {
      controller.scheduleChange({
        filterId: 'keyword',
        gesture: 'keystroke',
        control: 'text-field',
        cls: 'T',
        commit,
      });
      vi.advanceTimersByTime(50);
    }
    expect(commit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(replaceState).toHaveBeenCalledTimes(1);
    controller.dispose();
  });
});

describe('R-D5-05 — historique : replaceState avant pushState détruit l’état précédent', () => {
  /** Pile d'historique minimale, sémantique navigateur : `replaceState` écrase l'entrée courante. */
  function makeStack(initial: string): {
    stack: string[];
    replaceState: (url: string) => void;
    pushState: (url: string) => void;
  } {
    const stack = [initial];
    return {
      stack,
      replaceState: (url: string) => {
        stack[stack.length - 1] = url;
      },
      pushState: (url: string) => {
        stack.push(url);
      },
    };
  }

  it('R-D5-05 — après un changement isolé, le bouton précédent ne revient pas à l’état d’avant', () => {
    const h = makeStack('/marche');
    const grouper = new HistoryBurstGrouper({ replaceState: h.replaceState, pushState: h.pushState });
    grouper.onApplied('/marche?fuel=D');
    vi.advanceTimersByTime(800);
    grouper.dispose();
    // Attendu (EX-NAV-12) : ['/marche', '/marche?fuel=D'] — le retour arrière défait le filtre.
    expect(h.stack).toEqual(['/marche', '/marche?fuel=D']);
  });

  it('R-D5-05 — une rafale de 20 changements écrase aussi l’entrée d’origine', () => {
    const h = makeStack('/marche');
    const grouper = new HistoryBurstGrouper({ replaceState: h.replaceState, pushState: h.pushState });
    for (let i = 0; i < 20; i++) {
      grouper.onApplied(`/marche?eq=${i}`);
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(800);
    grouper.dispose();
    expect(h.stack).toEqual(['/marche', '/marche?eq=19']);
  });
});

describe('R-D5-14 — EX-SRCH-6 : `zip` appliqué avant 4 caractères saisis', () => {
  it('R-D5-14 — une saisie de 2 caractères est committée après 500 ms', () => {
    const commit = vi.fn(() => '/marche?zip=10');
    const controller = new InteractionController({
      replaceState: vi.fn(),
      pushState: vi.fn(),
      recomputeLocal: vi.fn(),
      reload: vi.fn(),
    });
    // Câblage identique à `GeoComposite.tsx` : chaque frappe est transmise telle quelle.
    controller.scheduleChange({
      filterId: 'location',
      gesture: 'keystroke',
      control: 'geo-composite',
      cls: 'R',
      commit,
    });
    vi.advanceTimersByTime(500);
    controller.dispose();
    // EX-SRCH-6 : « non déclenché avant 4 caractères saisis ».
    expect(commit).not.toHaveBeenCalled();
  });
});

describe('R-D5-18 — classe dynamique `body` : le contrôleur recharge même en mode 1', () => {
  it('R-D5-18 — un changement `DYNAMIC_BODY` déclenche `reload`, jamais `recomputeLocal`', () => {
    const recomputeLocal = vi.fn();
    const reload = vi.fn();
    const controller = new InteractionController({
      replaceState: vi.fn(),
      pushState: vi.fn(),
      recomputeLocal,
      reload,
    });
    controller.scheduleChange({
      filterId: 'bodyType',
      gesture: 'discrete-change',
      control: 'checkbox-list',
      cls: 'DYNAMIC_BODY',
      commit: () => '/marche?body=4',
    });
    controller.dispose();
    // En mode 1, `body` est de classe R (`Model.bodyTypes`, EX-SCR-59/82 #44) : le recalcul doit
    // être local. Le contrôleur ne connaît pas le mode et recharge inconditionnellement.
    expect({ reload: reload.mock.calls.length, recomputeLocal: recomputeLocal.mock.calls.length }).toEqual({
      reload: 0,
      recomputeLocal: 1,
    });
  });
});
