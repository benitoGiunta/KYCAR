/** Exploration temporaire (supprimée après usage) : identifiants hors taxonomie dans le dataset. */
import { it } from 'vitest';

import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/index';

it('explore-2', async () => {
  const ref = loadReferenceDataFromDisk();
  const p = new SyntheticDataProvider({ referenceData: ref, listingCount: 20000 });
  const h = await p.openSnapshot();
  const batch = p.getDataset().batch;
  const unknownMakes = new Map<number, number>();
  const unknownModels = new Map<string, number>();
  for (let i = 0; i < batch.rowCount; i += 1) {
    const m = batch.makeId[i] as number;
    const mo = batch.modelId[i] as number;
    if (!ref.makeById.has(m)) unknownMakes.set(m, (unknownMakes.get(m) ?? 0) + 1);
    else if (mo !== 0 && !ref.modelByKey.has(`${m}:${mo}`)) unknownModels.set(`${m}:${mo}`, (unknownModels.get(`${m}:${mo}`) ?? 0) + 1);
  }
  const base = await p.fetchBaselineAggregates(h);
  const unknownAgg = base.rows.filter((r) => !ref.makeById.has(r.makeId)).map((r) => [r.makeId, r.listingCount]);
  console.log(JSON.stringify({
    rows: batch.rowCount,
    unknownMakeIds: [...unknownMakes.entries()].slice(0, 10),
    unknownMakeRows: [...unknownMakes.values()].reduce((a, b) => a + b, 0),
    unknownModelKeys: [...unknownModels.entries()].slice(0, 10),
    unknownModelRows: [...unknownModels.values()].reduce((a, b) => a + b, 0),
    unknownAgg: unknownAgg.slice(0, 10),
    makeCount: ref.makes.length,
    modelCount: ref.models.length,
    sampleModel: ref.models.find((m) => m.modelId === 77474 || m.modelId === 75188),
  }));
});
