/**
 * KYCAR — Sondes de revue D3 (phase 2.8) : dictionnaire d'ingestion et agrégats du provider SYNTHÉTIQUE
 * =================================================================================================
 * Sondes écrites AVANT la correction (D-32), pour les décisions du fix-lead :
 *
 *   - **D8-08** (`EX-SCR-203` colonne « TVA », annexe A champ # 10) — `vatDeductible` est GÉNÉRÉE et
 *     plausible, déterministe à graine fixe.
 *   - **D8-10** (`EX-DATA-68` / `EX-DATA-71`, FV-02) — `MakeAggregate.modelCount` est CALCULÉ (les
 *     modèles distincts PRÉSENTS dans la sélection), jamais `null` ni `0` par défaut.
 *   - **D8-16** (FV-20) — `UNIT_UNSUPPORTED` (`EX-DATA-5`), repli carburant création → recherche
 *     (`EX-DATA-10`) et `HYBRID_CATEGORY_UNRESOLVED` (`EX-DATA-11`), rejet d'une annonce sans
 *     `listingUrl` (`EX-DATA-14`), provenance de mesure `co2Source` (`EX-DATA-35`).
 *   - **D8-20** (O15) — le filtre `bodyType` est DÉCLARÉ non appliqué quand la sélection désigne un
 *     modèle unique (entrée mode 2), jamais appliqué en silence ni ignoré en silence.
 *
 * Dataset RÉDUIT (2 000 annonces) : la discipline CPU du protocole réserve les deux générations
 * 100 000 à `dataset-100k.test.ts`. Aucun accès réseau (E5).
 */

import { beforeAll, describe, expect, it } from 'vitest';

import type { MakeAggregate, ModelAggregate, SnapshotHandle } from '../../../src/providers/DataProvider';
import { loadReferenceDataFromDisk } from '../../../src/orchestration/reference-fs';
import { SyntheticDataProvider } from '../../../src/providers/synthetic/SyntheticDataProvider';
import type { ReferenceData } from '../../../src/types/reference';
import { MODEL_ID_UNRESOLVED, VAT_DEDUCTIBLE } from '../../../src/types/sentinels';
import { INGEST_FLAG_BIT } from '../../../src/types/vocabularies';

let ref: ReferenceData;
const N = 2000;
const SEED = 7;

beforeAll(() => {
  ref = loadReferenceDataFromDisk();
});

async function open(seed = SEED): Promise<{ provider: SyntheticDataProvider; handle: SnapshotHandle }> {
  const provider = new SyntheticDataProvider({ referenceData: ref, listingCount: N, seed });
  const handle = await provider.openSnapshot();
  return { provider, handle };
}

/** Indice d'octet d'un code dans un vocabulaire nommé (les colonnes stockent l'INDICE, pas le code). */
function codeIndex(vocabulary: string, code: string): number {
  const voc = ref.vocabularies.get(vocabulary as never);
  return voc === undefined ? -1 : voc.values.findIndex((v) => v.code === code);
}

/* ================================================================================================
 * D8-08 — colonne TVA (EX-SCR-203, annexe A champ # 10 `isTaxDeductible`)
 * ============================================================================================== */

describe('D3 §2.8 — D8-08 : la colonne `vatDeductible` est alimentée', () => {
  it('R-D3-14 — `vatDeductible` porte les trois états, les particuliers ne sont jamais « déductible »', async () => {
    const { provider } = await open();
    const batch = provider.getDataset().batch;
    const privateIdx = codeIndex('KYCAR_SELLER_TYPE', 'P');
    expect(privateIdx).toBeGreaterThanOrEqual(0);

    let unknown = 0;
    let no = 0;
    let yes = 0;
    let privateYes = 0;
    let proYes = 0;
    let proCount = 0;
    for (let i = 0; i < batch.rowCount; i += 1) {
      const v = batch.vatDeductible[i] as number;
      if (v === VAT_DEDUCTIBLE.UNKNOWN) unknown += 1;
      else if (v === VAT_DEDUCTIBLE.NO) no += 1;
      else if (v === VAT_DEDUCTIBLE.YES) yes += 1;
      else throw new Error(`vatDeductible hors domaine tri-état : ${v}`);
      const isPrivate = (batch.sellerType[i] as number) === privateIdx;
      if (isPrivate && v === VAT_DEDUCTIBLE.YES) privateYes += 1;
      if (!isPrivate) {
        proCount += 1;
        if (v === VAT_DEDUCTIBLE.YES) proYes += 1;
      }
    }
    console.log(
      `[rev-D3 2.8] vatDeductible : inconnu = ${unknown}, non = ${no}, oui = ${yes} ` +
        `(pros = ${proCount}, dont déductible = ${proYes})`,
    );
    // Un particulier ne facture pas la TVA (annexe A champ # 10) : jamais « déductible ».
    expect(privateYes).toBe(0);
    // Les trois états sont exercés : la colonne alimente réellement la colonne « TVA » de l'écran D.
    expect(yes).toBeGreaterThan(0);
    expect(no).toBeGreaterThan(0);
    expect(unknown).toBeGreaterThan(0);
    // Part plausible de professionnels déductibles : ni marginale, ni universelle.
    expect(proYes / Math.max(1, proCount)).toBeGreaterThan(0.2);
    expect(proYes / Math.max(1, proCount)).toBeLessThan(0.9);
  });

  it('R-D3-14b — `vatDeductible` est déterministe à graine fixe et varie avec la graine', async () => {
    const a = (await open(SEED)).provider.getDataset().batch.vatDeductible;
    const b = (await open(SEED)).provider.getDataset().batch.vatDeductible;
    const c = (await open(SEED + 1)).provider.getDataset().batch.vatDeductible;
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(Array.from(a)).not.toEqual(Array.from(c));
  });
});

/* ================================================================================================
 * D8-10 — `MakeAggregate.modelCount` (EX-DATA-68 / EX-DATA-71, FV-02)
 * ============================================================================================== */

describe('D3 §2.8 — D8-10 : `modelCount` est calculé, jamais 0 par défaut', () => {
  it('R-D3-15 — `modelCount` = modèles DISTINCTS de la marque dans la sélection (baseline)', async () => {
    const { provider, handle } = await open();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const batch = provider.getDataset().batch;

    // Vérité terrain recalculée à partir des colonnes : modèles distincts, `modelId = 0` exclu.
    const truth = new Map<number, Set<number>>();
    for (let i = 0; i < batch.rowCount; i += 1) {
      const modelId = batch.modelId[i] as number;
      if (modelId === MODEL_ID_UNRESOLVED) continue;
      const makeId = batch.makeId[i] as number;
      let set = truth.get(makeId);
      if (set === undefined) {
        set = new Set<number>();
        truth.set(makeId, set);
      }
      set.add(modelId);
    }

    expect(baseline.rows.length).toBeGreaterThan(0);
    for (const row of baseline.rows) {
      expect(row.modelCount, `makeId ${row.makeId}`).toBe(truth.get(row.makeId)?.size ?? 0);
    }
    const withModels = baseline.rows.filter((r) => (r.modelCount ?? 0) > 0);
    console.log(
      `[rev-D3 2.8] modelCount : ${withModels.length}/${baseline.rows.length} marques portent au moins un modèle`,
    );
    expect(withModels.length).toBeGreaterThan(0);
  });

  it('R-D3-15b — `modelCount` suit la SÉLECTION (jamais le référentiel) et reste calculé sous filtre', async () => {
    const { provider, handle } = await open();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const biggest = [...baseline.rows].sort((a, b) => b.listingCount - a.listingCount)[0] as MakeAggregate;

    const filtered = (await provider.fetchAggregates(
      handle,
      `make=${biggest.makeId}`,
      'MAKE',
    )) as { rows: readonly MakeAggregate[] };
    const scoped = filtered.rows.find((r) => r.makeId === biggest.makeId) as MakeAggregate;
    expect(scoped.modelCount).not.toBeNull();
    expect(scoped.modelCount).toBe(biggest.modelCount);

    // Une sélection étroite (un seul modèle) ne peut pas porter plus d'un modèle distinct.
    const models = (await provider.fetchAggregates(handle, `make=${biggest.makeId}`, 'MODEL', biggest.makeId)) as {
      rows: readonly ModelAggregate[];
    };
    const oneModel = models.rows.find((r) => r.modelId !== MODEL_ID_UNRESOLVED) as ModelAggregate;
    const narrowed = (await provider.fetchAggregates(
      handle,
      `make=${biggest.makeId};model=${oneModel.modelId}`,
      'MAKE',
    )) as { rows: readonly MakeAggregate[] };
    expect((narrowed.rows[0] as MakeAggregate).modelCount).toBe(1);
  });

  it('R-D3-15c — le provider SYNTHÉTIQUE ne publie ni `coverageWarning`, ni `samplingBias`, ni `adTierDistribution`', async () => {
    // D8-10 : ces trois champs sont RÉSERVÉS au provider réel (propriétés de la source). Les publier
    // depuis un dataset généré reviendrait à inventer un biais d'échantillonnage qui n'existe pas.
    const { provider, handle } = await open();
    const baseline = await provider.fetchBaselineAggregates(handle);
    for (const row of baseline.rows) {
      expect(row.coverageWarning).toBeUndefined();
      expect(row.samplingBias).toBeUndefined();
      expect(row.adTierDistribution).toBeUndefined();
    }
  });
});

/* ================================================================================================
 * D8-16 (FV-20) — drapeaux et replis d'ingestion
 * ============================================================================================== */

describe('D3 §2.8 — D8-16 : les replis d’ingestion du dictionnaire sont exercés', () => {
  it('R-D3-16 — EX-DATA-5 : `UNIT_UNSUPPORTED` est posé et le champ concerné vaut INCONNU', async () => {
    const { provider } = await open();
    const batch = provider.getDataset().batch;
    const bit = 1 << INGEST_FLAG_BIT.UNIT_UNSUPPORTED;
    let flagged = 0;
    let flaggedWithKnownMileage = 0;
    for (let i = 0; i < batch.rowCount; i += 1) {
      if (((batch.ingestFlags[i] as number) & bit) === 0) continue;
      flagged += 1;
      if ((batch.mileageKm[i] as number) !== -1) flaggedWithKnownMileage += 1;
    }
    console.log(`[rev-D3 2.8] UNIT_UNSUPPORTED : ${flagged} annonces`);
    expect(flagged).toBeGreaterThan(0);
    // Proportion FAIBLE : le repli est exercé, pas généralisé.
    expect(flagged / batch.rowCount).toBeLessThan(0.02);
    // « Aucune conversion n'est devinée » : le champ non convertible vaut INCONNU.
    expect(flaggedWithKnownMileage).toBe(0);
    expect(provider.getDataset().ingestFlagCounts.UNIT_UNSUPPORTED).toBe(flagged);
  });

  it('R-D3-17 — EX-DATA-10/11 : repli carburant et `HYBRID_CATEGORY_UNRESOLVED` sont exercés et comptés', async () => {
    const { provider, handle } = await open();
    const counts = handle.descriptor.ingestFlagCounts;
    console.log(`[rev-D3 2.8] rapport d'ingestion : ${JSON.stringify(counts)}`);
    // EX-DATA-10 : le repli création → recherche est UTILISÉ (compté au rapport d'ingestion).
    expect(counts.FUEL_CATEGORY_FROM_FUEL_TYPE ?? 0).toBeGreaterThan(0);
    // EX-DATA-11 : un hybride rechargeable sans catégorie n'est JAMAIS rattaché à `B` ou `D`.
    expect(counts.HYBRID_CATEGORY_UNRESOLVED ?? 0).toBeGreaterThan(0);
    // Sous-qualification d'`ENUM_UNKNOWN` (EX-DATA-45) : le vocabulaire gelé à 17 codes est intact.
    const batch = provider.getDataset().batch;
    const bit = 1 << INGEST_FLAG_BIT.ENUM_UNKNOWN;
    let enumUnknown = 0;
    for (let i = 0; i < batch.rowCount; i += 1) if (((batch.ingestFlags[i] as number) & bit) !== 0) enumUnknown += 1;
    expect(enumUnknown).toBeGreaterThanOrEqual(counts.HYBRID_CATEGORY_UNRESOLVED as number);
  });

  it('R-D3-18 — EX-DATA-14 : une annonce sans `listingUrl` est REJETÉE et comptée par motif', async () => {
    const { provider, handle } = await open();
    const d = handle.descriptor;
    console.log(
      `[rev-D3 2.8] rejets : ${JSON.stringify(d.rejectedByReason)} (total ${d.rejectedCount})`,
    );
    expect(d.rejectedByReason.LISTING_URL_MISSING ?? 0).toBeGreaterThan(0);
    expect(d.rejectedCount).toBeGreaterThanOrEqual(d.rejectedByReason.LISTING_URL_MISSING as number);
    // Aucune annonce SANS URL ne franchit l'adaptateur : le rejet est effectif, pas déclaratif.
    const batch = provider.getDataset().batch;
    let emptyUrl = 0;
    for (let i = 0; i < batch.rowCount; i += 1) {
      const start = batch.stringOffsets[i * 5] as number;
      const end = batch.stringOffsets[i * 5 + 1] as number;
      if (end - start === 0) emptyUrl += 1;
    }
    expect(emptyUrl).toBe(0);
  });

  it('R-D3-19 — EX-DATA-35 : `co2Source` est déclaré INCONNU, avec justification au descripteur', async () => {
    const { handle } = await open();
    const d = handle.descriptor;
    // Le lot colonnaire GELÉ (EX-DATA-119) n'a aucune colonne `co2Source` : la provenance ne peut
    // pas être stockée par ligne. Elle est donc INCONNUE sur 100 % des lignes, et le DIT.
    expect(d.unknownCountByField.co2Source).toBe(d.listingCount);
    expect(d.coverageNote ?? '').toMatch(/co2Source|provenance de la mesure/i);
  });
});

/* ================================================================================================
 * D8-20 — filtre `bodyType` en mode 2 (O15)
 * ============================================================================================== */

describe('D3 §2.8 — D8-20 : le filtre Carrosserie en mode 2', () => {
  it('R-D3-20 — sélection pinçant un modèle : `bodyType` est DÉCLARÉ non appliqué et n’est pas appliqué', async () => {
    const { provider, handle } = await open();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const biggest = [...baseline.rows].sort((a, b) => b.listingCount - a.listingCount)[0] as MakeAggregate;
    const models = (await provider.fetchAggregates(handle, `make=${biggest.makeId}`, 'MODEL', biggest.makeId)) as {
      rows: readonly ModelAggregate[];
    };
    const model = [...models.rows]
      .filter((r) => r.modelId !== MODEL_ID_UNRESOLVED)
      .sort((a, b) => b.listingCount - a.listingCount)[0] as ModelAggregate;

    const pinned = `makesModelsVariants=${biggest.makeId}|${model.modelId}`;
    const withoutBody = await provider.fetchSelectionCount(handle, pinned);
    const withBody = await provider.fetchAggregates(handle, `${pinned};bodyType=1`, 'MODEL', biggest.makeId);

    // O15 : l'index carrosserie du référentiel est VIDE — le filtre ne peut pas être appliqué au
    // modèle. Il est DÉCLARÉ (bandeau `ET-FILTRE-NON-APPLIQUE`), jamais appliqué en silence.
    expect(ref.bodyTypeIndexAvailable).toBe(false);
    expect(withBody.unsupportedFilterIds).toContain('bodyType');
    expect(withBody.selectionCount).toBe(withoutBody);
  });

  it('R-D3-20b — hors mode 2 (aucun modèle pincé), `bodyType` est APPLIQUÉ et rien n’est déclaré', async () => {
    const { provider, handle } = await open();
    const all = await provider.fetchSelectionCount(handle, '');
    const filtered = await provider.fetchAggregates(handle, 'bodyType=1', 'MAKE');
    expect(filtered.unsupportedFilterIds).toEqual([]);
    expect(filtered.selectionCount).toBeGreaterThan(0);
    expect(filtered.selectionCount).toBeLessThan(all);
  });
});
