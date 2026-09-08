import { describe, expect, it } from 'vitest';

import {
  DEBOUNCE_CHECKBOX_BURST_MS,
  DEBOUNCE_DEPENDENT_IMMEDIATE_MS,
  DEBOUNCE_DISCRETE_MS,
  DEBOUNCE_NUMERIC_TYPED_MS,
  DEBOUNCE_POSTAL_CODE_MS,
  DEBOUNCE_SELECTION_IMMEDIATE_MS,
  DEBOUNCE_SLIDER_COMMIT_MS,
  DEBOUNCE_TEXT_TYPED_MS,
  resolveDebounceMs,
} from './debounce-policy';

/**
 * Chaque cas reprend littéralement une cellule de `docs/requirements/draft-behaviour.md` §B.1
 * (`EX-SRCH-1`…`8`), par filtre nommé plutôt que par seul `ControlKind` générique.
 */
describe('résolution du débounce — table EX-SRCH-1…8', () => {
  it('EX-SRCH-1 — cases/radios/interrupteurs : 0 ms', () => {
    expect(resolveDebounceMs('fuelType', 'discrete-change', 'checkbox-list')).toBe(DEBOUNCE_DISCRETE_MS);
    expect(resolveDebounceMs('sellerType', 'discrete-change', 'radio-segmented')).toBe(0);
    expect(resolveDebounceMs('vatReportable', 'discrete-change', 'boolean-toggle')).toBe(0);
    expect(resolveDebounceMs('hadAccident', 'discrete-change', 'select-indifferent')).toBe(0);
  });

  it('EX-SRCH-2 — eq (liste à cocher à forte cardinalité) : 250 ms', () => {
    expect(resolveDebounceMs('equipment', 'discrete-change', 'panel-search-multi')).toBe(
      DEBOUNCE_CHECKBOX_BURST_MS,
    );
  });

  it('EX-SRCH-3 — pricefrom/to, kmfrom/to au relâchement du curseur : 150 ms', () => {
    expect(resolveDebounceMs('priceFrom', 'slider-commit', 'range-pair')).toBe(DEBOUNCE_SLIDER_COMMIT_MS);
    expect(resolveDebounceMs('mileageTo', 'slider-commit', 'range-pair')).toBe(DEBOUNCE_SLIDER_COMMIT_MS);
  });

  it('EX-SRCH-4 — champ numérique en saisie libre : 500 ms, y compris price/km tapés au clavier', () => {
    expect(resolveDebounceMs('priceFrom', 'keystroke', 'range-pair')).toBe(DEBOUNCE_NUMERIC_TYPED_MS);
    expect(resolveDebounceMs('powerFrom', 'keystroke', 'range-pair')).toBe(DEBOUNCE_NUMERIC_TYPED_MS);
    expect(resolveDebounceMs('dateOfRegistrationFrom', 'keystroke', 'range-pair')).toBe(
      DEBOUNCE_NUMERIC_TYPED_MS,
    );
  });

  it('EX-SRCH-5 — texte libre (kwd) : 400 ms', () => {
    expect(resolveDebounceMs('keyword', 'keystroke', 'text-field')).toBe(DEBOUNCE_TEXT_TYPED_MS);
  });

  it('EX-SRCH-6 — code postal : 500 ms', () => {
    expect(resolveDebounceMs('location', 'keystroke', 'geo-composite')).toBe(DEBOUNCE_POSTAL_CODE_MS);
  });

  it('EX-SRCH-7 — sélecteur dépendant (zipr) : immédiat, 0 ms', () => {
    expect(resolveDebounceMs('radius', 'keystroke', 'select-indifferent')).toBe(
      DEBOUNCE_DEPENDENT_IMMEDIATE_MS,
    );
  });

  it('EX-SRCH-8 — sélection marque / changement de route : immédiat, 0 ms', () => {
    expect(resolveDebounceMs('makesModelsVariants', 'selection-immediate', 'structured-picker')).toBe(
      DEBOUNCE_SELECTION_IMMEDIATE_MS,
    );
  });

  it('replie sur le texte libre (400 ms) un filtre texte non nommé explicitement', () => {
    expect(resolveDebounceMs('version', 'keystroke', 'text-field')).toBe(DEBOUNCE_TEXT_TYPED_MS);
  });
});
