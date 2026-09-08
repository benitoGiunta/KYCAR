/**
 * Revue D8 (remédiation 2.8, `D8-34`) — effectifs de l'écran `G` en MODE 2.
 *
 * Constat de `fix-app-2` §7.3, rouvert par le fix-lead : l'écran `G` ouvert depuis l'écran B
 * affiche `—` sur chaque entrée. `app.tsx` dérive `screenGMakeCounts` de `marketPhase`, qui n'est
 * JAMAIS `loaded` en mode 2 (l'écran A n'a pas été monté), et `screen-g-model.ts::resolveCount`
 * rend `null` — donc `—` — pour toute clé absente d'une carte FOURNIE (`DR-060`). L'exigence
 * `EX-SCR-216` promet « son effectif d'offres » sur chaque entrée.
 *
 * Voie retenue par `D8-34` : le contrôleur publie les effectifs de la BASELINE, **déjà en mémoire**
 * après `start()`. La sonde éprouve les deux moitiés de la promesse — la valeur est juste, et elle
 * ne coûte AUCUN aller provider (c'est la condition d'`EX-NFR-9`).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DataController } from '../../../src/orchestration/data-controller';
import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { createMemorySnapshotCache } from '../../../src/persistence/snapshot-cache';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';
import type { ReferenceData } from '../../../src/types/reference';
import { countingProvider } from './_helpers';

const N = 20_000;
let ref: ReferenceData;
let inner: SyntheticDataProvider;

beforeAll(async () => {
  ref = loadReferenceDataFromDisk();
  inner = new SyntheticDataProvider({ referenceData: ref, listingCount: N, seed: 34 });
  await inner.openSnapshot();
});

function build(): { controller: DataController; counts: ReturnType<typeof countingProvider>['counts'] } {
  const { provider, counts } = countingProvider(inner);
  const controller = new DataController({ provider, referenceData: ref, cache: createMemorySnapshotCache() });
  return { controller, counts };
}

describe('R-D8-2.8-08 — `DataController.baselineMakeCounts` (D8-34)', () => {
  it('vaut `null` tant qu’aucun snapshot n’a été acquis — jamais une carte VIDE', () => {
    // Une carte vide serait FOURNIE au sens de `DR-060` : `resolveCount` rendrait `null` sur chaque
    // clé, c'est-à-dire « toutes les marques à — ». C'est exactement le défaut à corriger.
    const { controller } = build();
    expect(controller.baselineMakeCounts).toBeNull();
    controller.dispose();
  });

  it('après `start()`, porte l’effectif de CHAQUE marque de la baseline, et leur somme fait le jeu', async () => {
    const { controller } = build();
    const started = await controller.start();
    expect(started.status).not.toBe('error');

    const map = controller.baselineMakeCounts;
    expect(map, 'baselineMakeCounts est null après un start() réussi').not.toBeNull();
    const counts = map as ReadonlyMap<number, number>;
    expect(counts.size).toBeGreaterThan(0);

    // Vérité terrain : la baseline du provider elle-même, relue directement.
    const baseline = await inner.fetchBaselineAggregates(await inner.openSnapshot());
    expect(counts.size).toBe(baseline.rows.length);
    let sum = 0;
    for (const row of baseline.rows) {
      expect(counts.get(row.makeId), `marque ${row.makeId}`).toBe(row.listingCount);
      sum += row.listingCount;
    }
    expect(sum).toBe(N);
    controller.dispose();
  });

  it('sa lecture ne déclenche AUCUN aller provider (condition d’EX-NFR-9)', async () => {
    const { controller, counts } = build();
    await controller.start();
    const before = { ...counts, aggregates: counts.aggregates.length, listingColumns: counts.listingColumns.length };

    for (let i = 0; i < 5; i += 1) {
      const map = controller.baselineMakeCounts;
      expect(map).not.toBeNull();
      expect((map as ReadonlyMap<number, number>).size).toBeGreaterThan(0);
    }

    expect(counts.aggregates).toHaveLength(before.aggregates);
    expect(counts.listingColumns).toHaveLength(before.listingColumns);
    expect(counts.baseline).toBe(before.baseline);
    expect(counts.selectionCount).toBe(before.selectionCount);
    controller.dispose();
  });

  it('rend la MÊME carte d’une lecture à l’autre (mémoïsée : aucune reconstruction par rendu)', async () => {
    const { controller } = build();
    await controller.start();
    const first = controller.baselineMakeCounts;
    expect(first).not.toBeNull();
    expect((first as ReadonlyMap<number, number>).size).toBeGreaterThan(0);
    expect(controller.baselineMakeCounts).toBe(first);
    controller.dispose();
  });
});

describe('R-D8-2.8-09 — la coquille s’en sert en REPLI quand le marché n’est pas chargé', () => {
  const app = readFileSync(resolve(process.cwd(), 'src/app.tsx'), 'utf8');
  const memo = app.match(/const screenGMakeCounts = useMemo[\s\S]*?\n  \}, \[[^\]]*\]\);/)?.[0] ?? '';

  it('`screenGMakeCounts` retombe sur `controller.baselineMakeCounts`, et seulement en mode 2', () => {
    expect(memo, 'mémo screenGMakeCounts introuvable dans src/app.tsx').not.toBe('');
    expect(memo).toMatch(/controller\.baselineMakeCounts/);
    expect(memo).toMatch(/currentMode !== 'mode2'/);
    // Le chemin nominal (marché chargé sous filtres) est INCHANGÉ : les agrégats du marché priment.
    expect(memo).toMatch(/marketPhase\.data\.makeAggregates/);
  });
});
