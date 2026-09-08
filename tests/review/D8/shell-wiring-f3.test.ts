/**
 * Revue D8 (remédiation 2.8, vague F3) — sondes de CÂBLAGE de la coquille pour les props livrées
 * par `fix-state-2` (§5) et `fix-screens-2` (§8).
 *
 * Deux familles de preuves, complémentaires :
 *
 *  - **Câblage** (`R-D8-2.8-01`..`03`) : la coquille `App` utilise des hooks et ne peut pas être
 *    montée sans DOM dans cet environnement (vitest `node`) ; ces sondes lisent donc le SOURCE de
 *    `src/app.tsx`, exactement comme `shell-static.test.ts` et `shell-wiring-2.8.test.ts`. Elles
 *    garantissent qu'un prop retiré par mégarde soit vu par `npm test`, sans attendre la recette.
 *  - **Comportement** (`R-D8-2.8-04`..`07`) : le calcul que la coquille pose derrière ces props —
 *    `src/app/restrictive-filters.ts` — est un module PUR, éprouvé sur un vrai lot colonnaire du
 *    provider synthétique et sur les vrais prédicats du moteur. C'est là qu'un chiffre faux serait
 *    attrapé : `EX-SCR-26` affiche « <k> offres de plus », une valeur lue par l'utilisateur.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  TOP_RESTRICTIVE_MAX,
  countMatchingRows,
  removalPatchFor,
  topRestrictiveFilters,
} from '../../../src/app/restrictive-filters';
import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';
import type { SelectionState } from '../../../src/state/filter-types';
import type { ListingColumnBatch } from '../../../src/types/index';
import type { ReferenceData } from '../../../src/types/reference';
import { CORSA_MODEL_ID, OPEL_MAKE_ID } from './_helpers';

const ROOT = process.cwd();
const app = readFileSync(resolve(ROOT, 'src/app.tsx'), 'utf8');

/** Extrait le bloc JSX d'un montage de composant (`<Nom` … premier `/>` de fermeture au même niveau). */
function mountOf(name: string): string {
  const start = app.indexOf(`<${name}`);
  if (start < 0) return '';
  const end = app.indexOf('\n        />', start);
  return end < 0 ? app.slice(start, start + 4000) : app.slice(start, end + 10);
}

describe('R-D8-2.8-01 — `FilterBand` : les trois props listées par fix-state-2 §5', () => {
  const band = mountOf('FilterBand');

  it('`snapshotDate` vient du descripteur de snapshot, SANS `?? null` (le prop n’accepte pas `null`)', () => {
    // `EX-SCR-101` — la date vaut DÉCLARATION : « la taxonomie servie est celle de ce snapshot ».
    expect(band, 'montage de FilterBand introuvable dans src/app.tsx').not.toBe('');
    expect(band).toContain('snapshotDate={descriptor?.capturedAt}');
    expect(band).not.toContain('snapshotDate={descriptor?.capturedAt ?? null}');
  });

  it('`routePair` porte le couple de la ROUTE en mode 2, et rien ailleurs (EX-SRCH-14)', () => {
    expect(band).toMatch(/routePair=\{/);
    expect(band).toMatch(/view\.kind === 'modelDistribution' \|\| view\.kind === 'modelListings'/);
    expect(band).toMatch(/makeId: view\.makeId, modelId: view\.modelId/);
  });

  it('`onSelectModel` route vers `goToModel` (EX-NAV-15 : la coquille seule sait bâtir les slugs)', () => {
    expect(band).toMatch(/onSelectModel=\{\(pair\) => goToModel\(pair\.makeId, pair\.modelId\)\}/);
  });
});

describe('R-D8-2.8-02 — `DistributionScreen` : les cinq props listées par fix-screens-2 §8.1', () => {
  const screen = mountOf('DistributionScreen');

  it('`activeFilterCount` vient de `countActiveFilters` — la MÊME valeur que le bandeau', () => {
    expect(screen, 'montage de DistributionScreen introuvable').not.toBe('');
    expect(screen).toContain('activeFilterCount={countActiveFilters(selection)}');
    expect(app).toMatch(/import \{[^}]*countActiveFilters[^}]*\} from '\.\/components\/filters\/band-model'/);
  });

  it('`topRestrictiveFilters` vient du calcul « leave-one-out » de la coquille, jamais d’un littéral', () => {
    expect(screen).toContain('topRestrictiveFilters={emptySelectionHints}');
    expect(app).toMatch(/topRestrictiveFilters\b[\s\S]{0,400}?from '\.\/app\/restrictive-filters'|from '\.\/app\/restrictive-filters'/);
  });

  it('`onRemoveFilter` retire le filtre ENTIER (bornes appariées comprises) et pousse l’URL', () => {
    expect(screen).toMatch(/onRemoveFilter=\{\(filterId: string\) => applyFilters\(removalPatchFor\(filterId\)\)\}/);
  });

  it('`onResetAllFilters` et `onSaveSearch` sont câblés sur les mêmes chemins que l’écran A', () => {
    expect(screen).toMatch(/onResetAllFilters=\{\(\) =>/);
    expect(screen).toMatch(/onSaveSearch=\{\(\) => saveCurrentSearch\(defaultSearchName\(\)\)\}/);
  });
});

describe('R-D8-2.8-03 — `SavedSearchesScreen` : les deux props listées par fix-screens-2 §8.2', () => {
  const saved = app.match(/<SavedSearchesScreen[\s\S]*?\n          \/>/)?.[0] ?? '';

  it('`currentSnapshotId` vient du descripteur (condition d’EX-SCR-213), `taxonomy` du référentiel', () => {
    expect(saved, 'montage de SavedSearchesScreen introuvable').not.toBe('');
    expect(saved).toContain('currentSnapshotId={descriptor?.snapshotId}');
    expect(saved).toContain('taxonomy={referenceData}');
  });
});

// -------------------------------------------------------------------------------------------------
// Comportement du calcul posé derrière `topRestrictiveFilters` / `onRemoveFilter`.
// -------------------------------------------------------------------------------------------------

const N = 20_000;
let ref: ReferenceData;
let batch: ListingColumnBatch;

beforeAll(async () => {
  ref = loadReferenceDataFromDisk();
  const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: N, seed: 17 });
  const handle = await provider.openSnapshot();
  batch = await provider.fetchListingColumns(handle, `make=${OPEL_MAKE_ID};model=${CORSA_MODEL_ID}`);
});

describe('R-D8-2.8-04 — `countMatchingRows` compte ce que le mode 2 compte, sur le lot élagué', () => {
  it('sélection vide = tout le lot ; un filtre borné = un sous-ensemble STRICT et cohérent', () => {
    expect(batch.rowCount).toBeGreaterThan(0);
    expect(countMatchingRows(batch, {}, ref)).toBe(batch.rowCount);

    const cheap = countMatchingRows(batch, { priceTo: '3000' } as SelectionState, ref);
    const dear = countMatchingRows(batch, { priceTo: '100000' } as SelectionState, ref);
    expect(cheap).toBeLessThan(dear);
    expect(dear).toBeLessThanOrEqual(batch.rowCount);
    // Vérité terrain lue directement sur la colonne, sans passer par les prédicats.
    let truth = 0;
    for (let i = 0; i < batch.rowCount; i += 1) if (batch.priceEur[i] !== undefined && (batch.priceEur[i] as number) <= 3000) truth += 1;
    expect(cheap).toBe(truth);
  });

  it('une sélection IMPOSSIBLE rend 0 — c’est l’état ET-VIDE-FILTRES de l’écran B (EX-SCR-174)', () => {
    const impossible = { priceFrom: '900000', priceTo: '1000000' } as unknown as SelectionState;
    expect(countMatchingRows(batch, impossible, ref)).toBe(0);
  });
});

describe('R-D8-2.8-05 — `topRestrictiveFilters` : le gain annoncé EST le gain mesuré', () => {
  it('« <k> offres de plus » = effectif au retrait de ce seul filtre, jamais un nombre inventé', () => {
    // Sélection à effectif nul : un prix hors domaine du lot, plus un kilométrage bas.
    const selection = { priceFrom: '900000', mileageTo: '5000' } as unknown as SelectionState;
    expect(countMatchingRows(batch, selection, ref)).toBe(0);

    const hints = topRestrictiveFilters({ selection, batch, referenceData: ref, baselineCount: 0 });
    expect(hints.length).toBeGreaterThan(0);
    for (const h of hints) {
      if (h.gain === null) continue;
      const without = { ...selection } as Record<string, unknown>;
      delete without[h.filterId];
      const paired = removalPatchFor(h.filterId);
      for (const id of Object.keys(paired)) delete without[id];
      expect(h.gain, h.filterId).toBe(countMatchingRows(batch, without as SelectionState, ref));
      expect(h.gain).toBeGreaterThan(0);
    }
  });

  it('les suggestions sont triées par gain DÉCROISSANT et plafonnées à trois (EX-SCR-26)', () => {
    const selection = {
      priceFrom: '900000',
      mileageTo: '5000',
      fuelType: '1',
      gearType: '1',
      bodyType: '3',
    } as unknown as SelectionState;
    const hints = topRestrictiveFilters({ selection, batch, referenceData: ref, baselineCount: 0 });
    expect(hints.length).toBeLessThanOrEqual(TOP_RESTRICTIVE_MAX);
    expect(TOP_RESTRICTIVE_MAX).toBe(3);
    const gains = hints.filter((h) => h.gain !== null).map((h) => h.gain as number);
    expect([...gains].sort((a, b) => b - a)).toEqual(gains);
  });

  it('un libellé de suggestion est celui du JETON du bandeau — jamais un identifiant de paramètre', () => {
    const selection = { priceFrom: '900000' } as unknown as SelectionState;
    const [hint] = topRestrictiveFilters({ selection, batch, referenceData: ref, baselineCount: 0 });
    expect(hint).toBeDefined();
    expect(hint?.label).toMatch(/Prix/);
    expect(hint?.label).not.toMatch(/pricefrom|priceFrom/);
  });

  it('un filtre de classe `T` est proposé SANS chiffre (`gain: null`) — son retrait recharge le lot', () => {
    const selection = { keyword: 'zzz-aucune-annonce' } as unknown as SelectionState;
    const hints = topRestrictiveFilters({ selection, batch, referenceData: ref, baselineCount: 0 });
    expect(hints).toHaveLength(1);
    expect(hints[0]?.filterId).toBe('keyword');
    expect(hints[0]?.gain).toBeNull();
  });
});

describe('R-D8-2.8-06 — `removalPatchFor` retire le filtre ENTIER', () => {
  it('une borne d’intervalle emporte sa jumelle (sinon le jeton resterait à moitié posé)', () => {
    expect(removalPatchFor('priceTo')).toEqual({ priceTo: undefined, priceFrom: undefined });
    expect(removalPatchFor('mileageFrom')).toEqual({ mileageFrom: undefined, mileageTo: undefined });
  });

  it('un filtre sans jumelle ne retire que lui-même', () => {
    expect(removalPatchFor('fuelType')).toEqual({ fuelType: undefined });
    expect(removalPatchFor('makesModelsVariants')).toEqual({ makesModelsVariants: undefined });
  });

  it('un identifiant inconnu ne fabrique rien d’autre que son propre retrait', () => {
    expect(removalPatchFor('filtre-inexistant')).toEqual({ 'filtre-inexistant': undefined });
  });
});

describe('R-D8-2.8-07 — aucune suggestion inventée', () => {
  it('sélection vide ⇒ aucune suggestion (le bloc EX-SCR-26 rend alors ses seules actions)', () => {
    expect(topRestrictiveFilters({ selection: {}, batch, referenceData: ref, baselineCount: 0 })).toEqual([]);
  });

  it('un filtre dont le retrait ne rend AUCUNE offre de plus n’est pas suggéré', () => {
    // `priceFrom` seul vide déjà la sélection : retirer `superDeal` ne change rien, donc il ne
    // doit pas apparaître avec un « 0 offres de plus ».
    const selection = { priceFrom: '900000', superDeal: '1' } as unknown as SelectionState;
    const hints = topRestrictiveFilters({ selection, batch, referenceData: ref, baselineCount: 0 });
    expect(hints.map((h) => h.filterId)).not.toContain('superDeal');
  });
});
