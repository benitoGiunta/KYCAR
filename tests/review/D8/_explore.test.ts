/** Exploration temporaire (supprimée après usage) : géométrie du dataset synthétique par défaut. */
import { it } from 'vitest';

import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';
import { CORSA_MODEL_ID, OPEL_MAKE_ID, registrationYear } from './_helpers';

it('explore', async () => {
  const ref = loadReferenceDataFromDisk();
  const p = new SyntheticDataProvider({ referenceData: ref });
  const t0 = performance.now();
  const h = await p.openSnapshot();
  const t1 = performance.now();
  await p.fetchBaselineAggregates(h);
  const t2 = performance.now();
  const batch = p.getDataset().batch;
  const cells = new Map<string, number>();
  for (let i = 0; i < batch.rowCount; i += 1) {
    const k = `${batch.makeId[i]}:${batch.modelId[i]}`;
    cells.set(k, (cells.get(k) ?? 0) + 1);
  }
  const top = [...cells.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const gt = p.getGroundTruthOutliers();
  const gtByCell = new Map<string, number>();
  for (const o of gt) {
    const k = `${o.makeId}:${o.modelId}`;
    gtByCell.set(k, (gtByCell.get(k) ?? 0) + 1);
  }
  const topGt = [...gtByCell.entries()].filter(([k]) => (cells.get(k) ?? 0) >= 30 && !k.endsWith(':0')).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const corsa = `${OPEL_MAKE_ID}:${CORSA_MODEL_ID}`;
  const years = new Map<number, number>();
  for (let i = 0; i < batch.rowCount; i += 1) {
    if (batch.makeId[i] === OPEL_MAKE_ID && batch.modelId[i] === CORSA_MODEL_ID) {
      const y = registrationYear(batch, i);
      years.set(y, (years.get(y) ?? 0) + 1);
    }
  }
  const opelCells = [...cells.entries()].filter(([k]) => k.startsWith(`${OPEL_MAKE_ID}:`)).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const name = (k: string): string => {
    const [m, mo] = k.split(':').map(Number);
    return `${ref.makeById.get(m as number)?.label} ${ref.modelByKey.get(k)?.label ?? mo}`;
  };
  console.log(JSON.stringify({
    openSnapshotMs: Math.round(t1 - t0),
    baselineMs: Math.round(t2 - t1),
    cells: cells.size,
    corsa: cells.get(corsa),
    corsaYears: [...years.entries()].sort(),
    corsaGt: gtByCell.get(corsa) ?? 0,
    top: top.map(([k, n]) => [name(k), n]),
    opel: opelCells.map(([k, n]) => [name(k), n]),
    topGt: topGt.map(([k, n]) => [name(k), n, cells.get(k)]),
    gtTotal: gt.length,
    announcedCorsa: ref.modelByKey.get(corsa)?.announcedCount,
  }, null, 1));
});
