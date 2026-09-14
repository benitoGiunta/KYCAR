/**
 * KYCAR — Sondes de revue 2.10 · libellés humains et seuils de rendu (ACC-16, ACC-09/10, ACC-13)
 * =================================================================================================
 * Trois constats de la recette 2.9b dont la preuve est PURE (aucun DOM) :
 *   - `ACC-16` : le bandeau générique de non-application nommait un filtre par son identifiant de
 *     code (« le filtre gearType n'a pas pu être appliqué »). Le libellé humain existe dans le
 *     registre ; il lui manquait un accès depuis la couche de présentation.
 *   - `ACC-09`/`ACC-10` : les seuils de virtualisation existaient sans consommateur ; on éprouve ici
 *     la table de seuils qui les porte, dont les composants tirent désormais leurs fenêtres.
 *   - `ACC-13` : le budget de 150 ms d'`EX-SCR-25` est une CONSTANTE déclarée, pas un nombre semé
 *     dans un composant.
 */

import { describe, it, expect } from 'vitest';
import { filterDisplayLabel, filterDisplayLabels } from '../../../src/components/filters/labels';
import {
  GRID_VIRTUALIZATION_THRESHOLD,
  GRID_VIRTUALIZATION_MOUNTED_CARDS,
  MODEL_LIST_VIRTUALIZATION_THRESHOLD,
  CARD_MAX_HEIGHT_PX,
  MODEL_LIST_MAX_HEIGHT_PX,
  COLLAPSED_CARD_HEIGHT_PX,
  shouldVirtualizeGrid,
} from '../../../src/screens/market/thresholds';
import { RECALC_INDICATOR_DELAY_MS } from '../../../src/screens/distribution/DistributionScreen';

describe('2.10 · ACC-16 — le bandeau de non-application nomme les filtres en français (EX-SCR-1..4)', () => {
  it('R-2.10-16-01 — `gearType` se dit « Boîte de vitesses », `bodyType` « Carrosserie »', () => {
    expect(filterDisplayLabel('gearType')).toBe('Boîte de vitesses');
    expect(filterDisplayLabel('bodyType')).toBe('Carrosserie');
    // Le libellé rendu est EXACTEMENT celui que porte le jeton du bandeau : même registre, même mot.
    expect(filterDisplayLabel('gearType')).not.toBe('gearType');
  });

  it('R-2.10-16-02 — une liste est rendue en libellés, séparés par « , », dans l’ordre reçu', () => {
    expect(filterDisplayLabels(['gearType', 'bodyType'])).toBe('Boîte de vitesses, Carrosserie');
    expect(filterDisplayLabels([])).toBe('');
  });

  it('R-2.10-16-03 — un identifiant inconnu du registre est rendu tel quel, jamais masqué', () => {
    expect(filterDisplayLabel('filtreQuiNExistePas')).toBe('filtreQuiNExistePas');
  });
});

describe('2.10 · ACC-09/ACC-10 — seuils de virtualisation (EX-SCR-124 règle 3, EX-SCR-127)', () => {
  it('R-2.10-09-01 — les seuils sont ceux des exigences : 30 zones, 40 cartes, 12 montées', () => {
    expect(MODEL_LIST_VIRTUALIZATION_THRESHOLD).toBe(30);
    expect(GRID_VIRTUALIZATION_THRESHOLD).toBe(40);
    expect(GRID_VIRTUALIZATION_MOUNTED_CARDS).toBe(12);
    expect(shouldVirtualizeGrid(40)).toBe(false);
    expect(shouldVirtualizeGrid(41)).toBe(true);
  });

  it('R-2.10-09-02 — la géométrie d’EX-SCR-124/122 est déclarée, pas semée dans les feuilles', () => {
    expect(MODEL_LIST_MAX_HEIGHT_PX).toBe(480);
    expect(CARD_MAX_HEIGHT_PX).toBe(636);
    expect(COLLAPSED_CARD_HEIGHT_PX).toBe(588);
    // La carte dépliée ne peut pas être plus courte que sa liste : cohérence des deux plafonds.
    expect(CARD_MAX_HEIGHT_PX).toBeGreaterThan(MODEL_LIST_MAX_HEIGHT_PX);
  });
});

describe('2.10 · ACC-13 — budget de recalcul local (EX-SCR-25)', () => {
  it('R-2.10-13-01 — l’indicateur `ET-CHARGE-MAJ` n’est posé qu’au-delà de 150 ms', () => {
    expect(RECALC_INDICATOR_DELAY_MS).toBe(150);
  });
});
