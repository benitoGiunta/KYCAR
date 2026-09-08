/**
 * KYCAR — Sondes de revue D3 : contrat `DataProvider`, étiquetage SYNTHETIC, compilation de sélection
 * =================================================================================================
 * Phase 2.5 (`rev-D3`). Sondes LÉGÈRES (dataset réduit) : elles n'ont pas besoin des 100 000
 * annonces, dont la génération est réservée à `dataset-100k.test.ts` (discipline CPU du protocole :
 * deux générations 100k au maximum sur l'ensemble des sondes).
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { servesMode2 } from '../../../src/providers/DataProvider';
import type { SnapshotHandle } from '../../../src/providers/DataProvider';
import type { ReferenceData } from '../../../src/types/reference';
import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/SyntheticDataProvider';
import { compileSelection } from '../../../src/providers/synthetic/selection';
import { serializeSelection } from '../../../src/types/selection';
import { FILTER_DEFAULTS } from '../../../src/state/filter-registry';

let ref: ReferenceData;
const N = 2000;

beforeAll(() => {
  ref = loadReferenceDataFromDisk();
});

async function open(): Promise<{ provider: SyntheticDataProvider; handle: SnapshotHandle }> {
  const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: N, seed: 7 });
  const handle = await provider.openSnapshot();
  return { provider, handle };
}

describe('D3 §6.3 — capacités déclarées', () => {
  it('sourceKind SYNTHETIC, mode1 LISTINGS, mode2 SERVED, servesMode2() = true', async () => {
    const { provider } = await open();
    const caps = provider.describe();
    expect(caps.sourceKind).toBe('SYNTHETIC');
    expect(caps.mode1.source).toBe('LISTINGS');
    expect(caps.mode2.kind).toBe('SERVED');
    if (caps.mode2.kind === 'SERVED') expect(caps.mode2.maxSampleSize).toBeNull();
    expect(servesMode2(provider)).toBe(true);
    expect(typeof provider.fetchListingColumns).toBe('function');
    expect(typeof provider.fetchListingsByIds).toBe('function');
  });

  it('les 8 méthodes de l’interface sont présentes et `closeSnapshot` est idempotente', async () => {
    const { provider, handle } = await open();
    for (const m of [
      'describe',
      'openSnapshot',
      'closeSnapshot',
      'fetchBaselineAggregates',
      'fetchAggregates',
      'fetchSelectionCount',
      'fetchListingColumns',
      'fetchListingsByIds',
    ]) {
      expect(typeof (provider as unknown as Record<string, unknown>)[m]).toBe('function');
    }
    await provider.closeSnapshot(handle);
    await provider.closeSnapshot(handle);
    // Après fermeture, le provider sert toujours (dataset conservé, régénérable à l'identique).
    expect((await provider.fetchSelectionCount(handle, '')).valueOf()).toBe(N);
  });
});

describe('D3 — EX-DATA-107 : propagation de l’étiquette SYNTHETIC', () => {
  it('le descripteur de snapshot porte sourceKind = SYNTHETIC et une note de couverture explicite', async () => {
    const { handle } = await open();
    expect(handle.descriptor.sourceKind).toBe('SYNTHETIC');
    expect(handle.descriptor.providerVersion).toBe('D3-1.0.0');
    expect(handle.descriptor.coverageNote).toContain('SYNTHETIC');
    expect(handle.descriptor.announcedListingCount).toBe(N);
  });

  it('tout objet servi (agrégats, lot d’annonces, forage) référence le snapshot SYNTHETIC par son `snapshotId`', async () => {
    const { provider, handle } = await open();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const aggregates = await provider.fetchAggregates(handle, `make=${baseline.rows[0]?.makeId}`, 'MAKE');
    const batch = await provider.fetchListingColumns(handle, 'FULL');
    const subset = await provider.fetchListingColumns(handle, `make=${baseline.rows[0]?.makeId}`);
    const byIds = await provider.fetchListingsByIds(handle, [provider.getGroundTruthOutliers()[0]?.listingId ?? '']);
    for (const id of [baseline.snapshotId, aggregates.snapshotId, batch.snapshotId, subset.snapshotId, byIds.snapshotId]) {
      expect(id).toBe(handle.descriptor.snapshotId);
      expect(id).toContain('synthetic');
    }
    // Constat documenté (voir rapport §2, R-D3-11) : AUCUN objet servi ne porte de champ `sourceKind` —
    // le type gelé `AggregateResult`/`ListingColumnBatch` n'en a pas ; l'étiquetage dépend de
    // l'appelant qui conserve le descripteur ou rappelle `describe()`.
    const carriesField = (o: object): boolean => 'sourceKind' in o;
    console.log(
      `[rev-D3] champs de AggregateResult = ${Object.keys(baseline).join(',')} ; ` +
        `champ sourceKind porté : baseline ${carriesField(baseline)}, batch ${carriesField(batch)}`,
    );
    expect([carriesField(baseline), carriesField(batch)]).toEqual([false, false]);
  });
});

describe('D3 — contrat de sélection, non-fusion et périmètre de filtrage', () => {
  it('R-D3-11 — `fetchBaselineAggregates` publie un selectionHash (`FULL:EMPTY`) là où l’interface attend une `SelectionQuery`', async () => {
    // `AggregateResult.selection` est typé `SelectionQuery` : « la sélection effectivement appliquée
    // (canonique) », c'est-à-dire la sérialisation d'EX-NAV-9/EX-DATA-108 — la chaîne VIDE pour la
    // sélection vide. `FULL:EMPTY` en est le HACHAGE (EX-DATA-108), pas la sérialisation.
    const { provider, handle } = await open();
    const baseline = await provider.fetchBaselineAggregates(handle);
    expect(baseline.selection).toBe('');
  });

  it('fetchListingColumns(FULL) rend le lot complet marqué FULL ; une composante T filtrée rend un sous-lot distinct', async () => {
    const { provider, handle } = await open();
    const full = await provider.fetchListingColumns(handle, 'FULL');
    expect(full.localDatasetKey).toBe('FULL');
    expect(full.rowCount).toBe(N);
    const makeId = full.makeId[0] as number;
    const subset = await provider.fetchListingColumns(handle, `make=${makeId}`);
    expect(subset.localDatasetKey).not.toBe('FULL');
    expect(subset.rowCount).toBeGreaterThan(0);
    expect(subset.rowCount).toBeLessThan(N);
    for (let i = 0; i < subset.rowCount; i += 1) expect(subset.makeId[i]).toBe(makeId);
    // Contrat de non-fusion : deux appels rendent le même sous-lot, jamais une union.
    const again = await provider.fetchListingColumns(handle, `make=${makeId}`);
    expect(again.rowCount).toBe(subset.rowCount);
    expect(again.localDatasetKey).toBe(subset.localDatasetKey);
  });

  it('R-D3-12 — des filtres D5 dont la colonne EXISTE dans le lot sont ignorés silencieusement', async () => {
    // `DataController.loadMarket` sérialise la sélection par IDENTIFIANT de filtre D5
    // (`serializeSelection`) et la passe à `fetchAggregates`. Tout identifiant absent de
    // `ENUM_FILTERS`/`RANGE_FILTERS` est ignoré : l'écran A affiche alors le chiffre NON filtré
    // alors que le bandeau montre le filtre posé.
    const { provider, handle } = await open();
    const batch = await provider.fetchListingColumns(handle, 'FULL');
    // Preuve du format réellement transmis par D8 : `serializeSelection` sérialise par IDENTIFIANT
    // de filtre D5, pas par paramètre d'URL.
    const query = serializeSelection({ fuelType: ['E'], bodyType: ['4'] }, { defaults: FILTER_DEFAULTS });
    expect(query).toBe('bodyType=4;fuelType=E');
    // Identifiants D5 (`src/state/filter-registry.ts`) dont la colonne existe dans `ListingColumnBatch`.
    const implementable: Record<string, string> = {
      makesModelsVariants: 'makeId/modelId',
      fuelType: 'fuelCategory',
      gearType: 'transmission',
      dateOfRegistrationFrom: 'firstRegistrationYearMonth',
      dateOfRegistrationTo: 'firstRegistrationYearMonth',
      countryType: 'countryCode',
      numberOfOwners: 'previousOwnerCount',
      doorFrom: 'doorCount',
      doorTo: 'doorCount',
      numberOfSeatsFrom: 'seatCount',
      numberOfSeatsTo: 'seatCount',
      electricRangeFrom: 'electricRangeKm',
      electricRangeTo: 'electricRangeKm',
      emissionClass: 'euEmissionStandard',
      priceEvaluation: 'priceEvaluationCategory',
    };
    const ignored: string[] = [];
    for (const id of Object.keys(implementable)) {
      const compiled = compileSelection(batch, `${id}=1`, ref);
      if (compiled.unsupported.includes(id)) ignored.push(`${id}→${implementable[id]}`);
    }
    // Effet observable : un filtre carburant posé ne change pas l'effectif servi.
    const total = await provider.fetchSelectionCount(handle, '');
    const filtered = await provider.fetchSelectionCount(handle, 'fuelType=E');
    console.log(
      `[rev-D3] filtres D5 implémentables mais ignorés (${ignored.length}/${Object.keys(implementable).length}) : ` +
        `${ignored.join(', ')} ; fetchSelectionCount('') = ${total} vs ('fuelType=E') = ${filtered}`,
    );
    expect(ignored).toEqual([]);
  });

  it('les filtres reconnus filtrent effectivement (make, bodyType, priceFrom/To, powerFrom/To)', async () => {
    const { provider, handle } = await open();
    const batch = await provider.fetchListingColumns(handle, 'FULL');
    const makeId = batch.makeId[0] as number;
    const byMake = await provider.fetchSelectionCount(handle, `make=${makeId}`);
    let expected = 0;
    for (let i = 0; i < batch.rowCount; i += 1) if (batch.makeId[i] === makeId) expected += 1;
    expect(byMake).toBe(expected);

    const cheap = await provider.fetchSelectionCount(handle, 'priceTo=5000');
    let expectedCheap = 0;
    for (let i = 0; i < batch.rowCount; i += 1) {
      const p = batch.priceEur[i] as number;
      if (p !== -1 && p <= 5000) expectedCheap += 1;
    }
    expect(cheap).toBe(expectedCheap);
    expect(cheap).toBeGreaterThan(0);
    expect(cheap).toBeLessThan(N);
  });

  it('E5 — aucun accès réseau : `fetch` n’est jamais appelé par le provider', async () => {
    const globalWithFetch = globalThis as unknown as { fetch?: unknown };
    const original = globalWithFetch.fetch;
    let calls = 0;
    globalWithFetch.fetch = (): never => {
      calls += 1;
      throw new Error('appel réseau interdit (E5)');
    };
    try {
      const { provider, handle } = await open();
      await provider.fetchBaselineAggregates(handle);
      await provider.fetchListingColumns(handle, 'FULL');
    } finally {
      globalWithFetch.fetch = original;
    }
    expect(calls).toBe(0);
  });
});
