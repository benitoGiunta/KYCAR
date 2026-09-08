/**
 * Revue D8 (remédiation 2.9b) — sondes `R-D8-2.9-01..06` : en MODE 2, un filtre de classe `T` posé
 * dans l'URL n'est ni appliqué ni DÉCLARÉ (constat `ACC-01`, décision `D8-41`).
 * =================================================================================================
 * Constat de la recette (`reports/ACCEPTANCE.md` §8, `ACC-01`, MAJEUR) :
 * `GET /marche/54-opel/1918-corsa?body=3` affiche « 1 352 offres » — l'effectif de la CELLULE
 * ENTIÈRE — sous un jeton « Carrosserie : Coupé × » actif, sans le bandeau `D8-20`
 * « Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) ». Cause : `enterMode2`
 * n'envoie au provider que `make=<id>;model=<id>` et ne calcule `unappliedFilterIds` que sur la
 * composante `R` (`buildRefinePredicates`) ; en mode 2 `bodyType` est de classe `T`
 * (`resolveFilterClass`, `EX-SCR-82` #44 / `EX-SCR-221`), il n'atteint donc NI le provider NI la
 * liste des filtres déclarés non appliqués — exactement ce que `D-03` interdit (« jamais ignoré en
 * silence ») et ce que `D8-20` disait avoir traité.
 *
 * Ces sondes éprouvent le CHEMIN DU CONTRÔLEUR (les sondes `R-D2-17`/`R-D3-20`/`R-D9-31`
 * éprouvaient `compileSelection` avec une requête épinglant déjà un modèle, jamais ce chemin), en
 * partant de l'URL RÉELLE par le codec `loadQuery` : `EX-NAV-18` (rechargement direct d'une URL de
 * mode 2) et la pose du filtre depuis le bandeau en mode 2 passent par le MÊME appel
 * `enterMode2(makeId, modelId, selection)` (`src/app.tsx`, clé d'effet `…:${currentQuery}:…`).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import { DataController } from '../../../src/orchestration/data-controller';
import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { createMemorySnapshotCache } from '../../../src/persistence/snapshot-cache';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';
import { loadQuery } from '../../../src/state/corrections';
import { partitionSelection } from '../../../src/state/tr-split';
import type { ReferenceData } from '../../../src/types/reference';
import { CORSA_MODEL_ID, OPEL_MAKE_ID, countingProvider, instrumentedEngineFactory } from './_helpers';

const N = 20_000;
let ref: ReferenceData;
let inner: SyntheticDataProvider;

function build(): { controller: DataController; counts: ReturnType<typeof countingProvider>['counts'] } {
  const { provider, counts } = countingProvider(inner);
  const { factory } = instrumentedEngineFactory();
  const controller = new DataController({ provider, referenceData: ref, engineFactory: factory, cache: createMemorySnapshotCache() });
  return { controller, counts };
}

beforeAll(async () => {
  ref = loadReferenceDataFromDisk();
  inner = new SyntheticDataProvider({ referenceData: ref, listingCount: N, seed: 17 });
  await inner.openSnapshot();
});

describe('ACC-01 / D8-41 — mode 2 : un filtre de classe T posé est DÉCLARÉ non appliqué', () => {
  it('R-D8-2.9-01 — `?body=3` sur /marche/54-opel/1918-corsa : `bodyType` est de classe T en mode 2 (prémisse du constat)', () => {
    const selection = loadQuery('?body=3').selection;
    expect(selection['bodyType']).toBeDefined();
    const { t, r } = partitionSelection(selection, 'mode2');
    expect(Object.keys(t)).toContain('bodyType');
    expect(Object.keys(r)).not.toContain('bodyType');
    // O15 : l'index carrosserie du référentiel est vide — le filtre n'est PAS résoluble au modèle.
    expect(ref.bodyTypeIndexAvailable).toBe(false);
  });

  it('R-D8-2.9-02 — `enterMode2(54, 1918, { bodyType })` reporte l’identifiant dans `unappliedFilterIds` (D-03, EX-SCR-221)', async () => {
    const { controller } = build();
    await controller.start();
    const selection = loadQuery('?body=3').selection;
    const payload = await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID, selection);
    expect(payload.unappliedFilterIds).toContain('bodyType');
    controller.dispose();
  });

  it('R-D8-2.9-03 — l’effectif publié reste celui de la CELLULE ENTIÈRE : déclaré, jamais amputé ni annulé (D8-20)', async () => {
    const { controller } = build();
    await controller.start();
    const bare = await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID, {});
    const filtered = await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID, loadQuery('?body=3').selection);
    expect(filtered.rows.length).toBe(bare.rows.length);
    expect(filtered.rows.length).toBe(filtered.batch.rowCount);
    expect(bare.unappliedFilterIds).toEqual([]);
    controller.dispose();
  });

  it('R-D8-2.9-04 — un filtre R appliqué n’est jamais déclaré : `?body=3&priceto=20000` filtre sur le prix ET nomme la seule carrosserie', async () => {
    const { controller } = build();
    await controller.start();
    const selection = loadQuery('?body=3&priceto=20000').selection;
    const payload = await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID, selection);
    expect(payload.unappliedFilterIds).toEqual(['bodyType']);
    expect(payload.rows.length).toBeGreaterThan(0);
    expect(payload.rows.length).toBeLessThan(payload.batch.rowCount);
    controller.dispose();
  });
});

describe('ACC-01 / D8-41 — la coquille rend la déclaration du mode 2 (câblage, lecture de source)', () => {
  const app = readFileSync(resolve(process.cwd(), 'src/app.tsx'), 'utf8');

  it('R-D8-2.9-05 — `bodyType` déclaré par `enterMode2` produit le bandeau normatif de `D8-20`', () => {
    expect(app).toMatch(/const unsupportedMode2 = mode2\?\.payload\?\.unappliedFilterIds \?\? \[\]/);
    expect(app).toMatch(/const bodyFilterUnapplied = unsupportedMode2\.includes\('bodyType'\)/);
    expect(app).toContain(
      'Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) — l’effectif affiché est complet, mais il ne tient pas compte de ce critère.',
    );
  });

  it('R-D8-2.9-06 — les AUTRES filtres T déclarés en mode 2 alimentent `ET-FILTRE-NON-APPLIQUE` (D-03), jamais le silence', () => {
    // La liste nommée par le bandeau générique est celle du MODE COURANT : en mode 2 celle de
    // `enterMode2` (moins `bodyType`, qui a son bandeau propre), en mode 1 celle du provider.
    expect(app).toMatch(
      /currentMode === 'mode2' \? unsupportedMode2\.filter\(\(id\) => id !== 'bodyType'\) : \(loadedData\?\.unappliedFilterIds \?\? \[\]\)/,
    );
  });
});
