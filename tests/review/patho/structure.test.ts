/**
 * KYCAR — Sondes transverses `patho` : STRUCTURE (revue 2.5)
 * =================================================================================================
 * Rejeu des attaques par la STRUCTURE d'`ST-adversarial.md` : `modelId = 0` (ADV-14 → `ARB-59`),
 * marque connue sans modèle résolu, doublon exact à prix identiques puis différents (ADV-05 →
 * `ARB-54`), annonce présente dans deux pays, `modelVersionRaw` de 300 caractères sans espace
 * portant `<script>` (ADV-17/18 → `ARB-61`/`ARB-62`), pays hors table (ADV-15 → `ARB-60`).
 */

import { describe, expect, it } from 'vitest';

import { AggregationDataset } from '../../../src/engine/index';
import { loadReferenceData, openSyntheticProvider } from '../../../src/engine/testkit';
import { decodeListingId } from '../../../src/engine/uuid';
import { servesMode2 } from '../../../src/providers/DataProvider';
import { TweedehandsDataProvider } from '../../../src/providers/tweedehands/TweedehandsDataProvider';
import type { TweedehandsFetcher } from '../../../src/providers/tweedehands/fetcher';
import type { RawSearchResponse } from '../../../src/providers/tweedehands/nextData';
import {
  buildFixtureHtml,
  loadRealReferenceData,
  makeRawListing,
} from '../../../src/providers/tweedehands/testFixtures';
import { hasIngestFlag } from '../../../src/types/vocabularies';
import { matchRoute, resolveTaxonomyRoute } from '../../../src/state/router';
import type { ModelDistributionRoute } from '../../../src/state/router';
import { buildListingRow, readListingString, STRING_FIELD } from '../../../src/screens/listings/listing-fields';
import { exportListingsCsv } from '../../../src/screens/listings/csv-export';
import { OutlierIndex } from '../../../src/screens/outlier-index';
import {
  buildMakeCardViewModel,
  MODEL_NON_IDENTIFIE_LABEL,
  MODEL_NON_IDENTIFIE_SLUG,
} from '../../../src/screens/market/view-model';
import { ENUM_UNKNOWN_BYTE } from '../../../src/types/sentinels';
import { buildBatch, cell, checkInvariants, recalcOf, type RowSpec } from './_fixtures';

/** Charge utile adverse d'ADV-17/ADV-18 : 300 caractères sans espace, balise active incluse. */
const ADVERSE_VERSION = `<script>alert(document.cookie)</script>${'A'.repeat(300 - 38)}`;

describe('patho — structure de la taxonomie', () => {
  it('STR-MODELID0 — la zone « Modèle non identifié » est cliquable et sa route est valide (ARB-59)', async () => {
    const recalc = await recalcOf([
      ...cell(20, { makeId: 54, modelId: 1918 }),
      ...cell(8, { makeId: 54, modelId: 0, basePrice: 9000 }),
    ]);

    const card = buildMakeCardViewModel(recalc.makeAggregates[0]!, {
      make: undefined,
      modelAggregates: recalc.modelAggregates,
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: true,
      modelsVisibleBeforeCollapse: 6,
    });

    const unresolved = card.modelZones.find((z) => z.isUnresolved);
    expect(unresolved).toBeDefined();
    expect(unresolved!.label).toBe(MODEL_NON_IDENTIFIE_LABEL);
    expect(unresolved!.slug).toBe(MODEL_NON_IDENTIFIE_SLUG);
    expect(unresolved!.listingCount).toBe(8);
    // `EX-DATA-71` : la clé réservée ne compte pas parmi les « n modèles » du résumé.
    expect(card.modelCount).toBe(1);
    // `EX-DATA-117` : la zone réservée est classée en dernier.
    expect(card.modelZones[card.modelZones.length - 1]!.isUnresolved).toBe(true);

    // `ARB-59` / `EX-NAV-20` : la route `/…/0-modele-non-identifie` est VALIDE, jamais l'écran d'erreur.
    const route = matchRoute('/marche/54-opel/0-modele-non-identifie');
    expect(route.name).toBe('modelDistribution');
    const verdict = resolveTaxonomyRoute(route as ModelDistributionRoute, {
      makeById: new Map([[54, {}]]),
      modelByKey: new Map(), // aucune entrée `54:0` dans la taxonomie : c'est le cas d'ADV-14
    });
    expect(verdict.ok).toBe(true);
  });

  it('R-PATHO-08 — ARB-59 / EX-SCR-113bis : pour modelId = 0, la détection d’outliers ne démarre pas à C₃', async () => {
    // `EX-SCR-113bis` : « La détection d'outlier démarre l'échelle de repli à `C₃ = Σ` : `C₁` et
    // `C₂` exigent un `modelId` résolu. » Ici, 40 annonces non résolues d'une même marque.
    const recalc = await recalcOf(
      Array.from({ length: 40 }, (_v, i) => ({
        makeId: 54,
        modelId: 0,
        year: 2017,
        month: 1 + (i % 12),
        priceEur: i === 0 ? 1400 : 11500 + (i % 6) * 300,
        mileageKm: 30000 + i * 1200,
      })),
    );
    expect(recalc.outlierVerdicts.length).toBeGreaterThan(0);
    for (const v of recalc.outlierVerdicts) {
      expect(v.cellLabel).toBe('SELECTION'); // constaté : MODEL_YEAR / MODEL sur une clé réservée
    }
  });

  it('STR-MARQUE-SANS-MODELE — marque connue, aucun modèle résolu : agrégat marque non nul, « 0 modèles »', async () => {
    const recalc = await recalcOf(cell(12, { makeId: 74, modelId: 0 }));
    const card = buildMakeCardViewModel(recalc.makeAggregates[0]!, {
      make: undefined,
      modelAggregates: recalc.modelAggregates,
      models: new Map(),
      hasUserFilters: false,
      hideSparseModels: false,
      isExpanded: true,
      modelsVisibleBeforeCollapse: 6,
    });
    expect(card.listingCount).toBe(12);
    expect(card.modelCount).toBe(0);
    expect(card.medianPriceLine).toContain('0 modèles'); // « fragilité mineure » de la matrice ADV
    expect(card.modelZones).toHaveLength(1);
    expect(card.modelZones[0]!.isUnresolved).toBe(true);
  });
});

describe('patho — doublons (ADV-05 → ARB-54)', () => {
  /** Deux occurrences du MÊME `listingId`, prix éventuellement divergents. */
  function duplicate(priceA: number, priceB: number): RowSpec[] {
    const id = new Uint8Array(16).fill(0xab);
    return [
      ...cell(12, { basePrice: 12000 }),
      { priceEur: priceA, listingIdBytes: id, mileageKm: 55000 },
      { priceEur: priceB, listingIdBytes: id, mileageKm: 55000 },
    ];
  }

  /** Fetcher de fixture (aucun réseau, E5) : rejoue UNE réponse pour toute requête. */
  function tweedehandsOn(listings: RawSearchResponse['listings']): TweedehandsDataProvider {
    const html = buildFixtureHtml({ totalResultCount: 5220, listings });
    const fetcher: TweedehandsFetcher = { fetchSearchPage: (): Promise<string> => Promise.resolve(html) };
    return new TweedehandsDataProvider({
      referenceData: loadRealReferenceData(),
      marketplace: 'be',
      fetcher,
      makeUniverse: [{ makeId: 54, slug: 'opel' }],
    });
  }

  const corsa = (itemId: string, priceCents: number): ReturnType<typeof makeRawListing> =>
    makeRawListing({ itemId, brand: 'Opel', model: 'Corsa', priceCents, mileage: '60000 km', constructionYear: '2019' });

  // Sondes REQUALIFIÉES (D-46, justification D-31). Elles exigeaient que le MOTEUR rattrape un lot
  // porteur de doublons. Le fix-lead a tranché : la déduplication d'`EX-DATA-15` est une
  // responsabilité d'INGESTION (DR-003/004, livrées par fix-providers) ; une seconde passe dans le
  // moteur doublerait le coût du chemin synchrone sans qu'aucune exigence la demande. Ce qui doit
  // être prouvé est donc l'autre moitié : le moteur ne reçoit JAMAIS de lot porteur de doublons,
  // quel que soit le provider. Le constat « le moteur compte ce qu'on lui donne » reste mesuré ici,
  // en tête, pour que la requalification ne masque rien.
  it('R-PATHO-09 (moteur) — le moteur ne déduplique pas ; les DEUX providers ne lui livrent que des lots dédupliqués', async () => {
    // 1. Constat assumé : sur un lot FABRIQUÉ porteur de deux fois le même `listingId`, le moteur
    //    compte deux annonces. Aucune passe de déduplication n'existe dans `src/engine`.
    const recalc = await recalcOf(duplicate(12900, 12900));
    expect(recalc.selectionStats.selectionCount).toBe(14);
    expect(recalc.selectionStats.price.n).toBe(14);

    // 2. Provider SYNTHÉTIQUE — le seul qui serve des lots colonnaires au moteur (mode 2) : le lot
    //    livré ne porte aucun `listingId` en double, et le descripteur le MESURE (EX-DATA-15).
    const synth = await openSyntheticProvider(loadReferenceData(), 5000, 7);
    const handleS = await synth.openSnapshot();
    expect(servesMode2(synth)).toBe(true);
    const batchS = await synth.fetchListingColumns(handleS, 'FULL');
    const seen = new Set<string>();
    let collisions = 0;
    for (let row = 0; row < batchS.rowCount; row += 1) {
      const id = decodeListingId(batchS.listingId, row);
      if (seen.has(id)) collisions += 1;
      else seen.add(id);
    }
    expect(collisions).toBe(0);
    expect(handleS.descriptor.duplicateListingCount).toBe(0);

    // 3. Provider RÉEL (`AGGREGATE_SURFACE`) : il ne sert aucun lot au moteur (mode 2 indisponible),
    //    et l'échantillon qui porte ses agrégats est dédupliqué — la seconde occurrence est écartée,
    //    comptée, jamais servie.
    const real = tweedehandsOn([corsa('dup-m1', 1290000), corsa('dup-m1', 1290000)]);
    expect(servesMode2(real)).toBe(false);
    const handleR = await real.openSnapshot();
    const opel = (await real.fetchBaselineAggregates(handleR)).rows[0]!;
    expect(opel.price.n).toBe(1);
    expect(handleR.descriptor.listingCount).toBe(1);
    expect(handleR.descriptor.duplicateListingCount).toBe(1);
  });

  it('R-PATHO-10 (moteur) — doublon à prix divergents : le conflit est tranché ET signalé à l’ingestion, jamais deux prix pour un listingId', async () => {
    // 1. Constat assumé, même lot fabriqué : le moteur laisse passer les deux prix.
    const recalc = await recalcOf(duplicate(12900, 10500));
    expect(recalc.selectionStats.price.n).toBe(14);

    const batch = buildBatch(duplicate(12900, 10500));
    const rowA = buildListingRow(batch, 12, new OutlierIndex([]));
    const rowB = buildListingRow(batch, 13, new OutlierIndex([]));
    expect(rowA.listingId).toBe(rowB.listingId); // même identifiant, deux prix
    expect(rowA.priceEur).not.toBe(rowB.priceEur);

    // 2. Provider RÉEL : `ARB-54` appliqué — une seule occurrence conservée (la PREMIÈRE de l'ordre
    //    total), porteuse de `DUPLICATE_VALUE_CONFLICT`, et le prix divergent n'entre dans aucun
    //    agrégat servi.
    const real = tweedehandsOn([corsa('dup-m2', 1290000), corsa('dup-m2', 1050000)]);
    const handleR = await real.openSnapshot();
    const opel = (await real.fetchBaselineAggregates(handleR)).rows[0]!;
    expect(opel.price.n).toBe(1);
    expect(opel.price.min).toBe(12900);
    expect(handleR.descriptor.duplicateValueConflictCount).toBe(1);
    expect(handleR.descriptor.ingestFlagCounts.DUPLICATE_VALUE_CONFLICT).toBe(1);

    // 3. Provider SYNTHÉTIQUE : aucun conflit à signaler, parce qu'aucun doublon n'existe.
    const synth = await openSyntheticProvider(loadReferenceData(), 5000, 7);
    const handleS = await synth.openSnapshot();
    expect(handleS.descriptor.duplicateValueConflictCount).toBe(0);
    const batchS = await synth.fetchListingColumns(handleS, 'FULL');
    let flagged = 0;
    for (let row = 0; row < batchS.rowCount; row += 1) {
      if (hasIngestFlag(batchS.ingestFlags[row] as number, 'DUPLICATE_VALUE_CONFLICT')) flagged += 1;
    }
    expect(flagged).toBe(0);
  });

  it('STR-DEUX-PAYS — la même annonce reçue sous deux pays reste comptée deux fois (même cause qu’ADV-05)', async () => {
    const id = new Uint8Array(16).fill(0x5c);
    const recalc = await recalcOf([
      { priceEur: 18000, listingIdBytes: id, countryCode: 0 },
      { priceEur: 18000, listingIdBytes: id, countryCode: 1 },
    ]);
    expect(recalc.selectionStats.selectionCount).toBe(2);
    // Constat de fond identique à `R-PATHO-09` ; consigné ici pour la traçabilité du cas.
  });
});

describe('patho — pays hors table et texte adverse', () => {
  it('STR-PAYS-INCONNU — un code pays hors table reste INCONNU, l’annonce est conservée (ARB-60)', async () => {
    const recalc = await recalcOf([
      ...cell(5, {}),
      { priceEur: 13000, countryCode: ENUM_UNKNOWN_BYTE },
    ]);
    expect(recalc.selectionStats.selectionCount).toBe(6); // aucun rejet

    const batch = buildBatch([{ priceEur: 13000, countryCode: ENUM_UNKNOWN_BYTE }]);
    const row = buildListingRow(batch, 0, new OutlierIndex([]));
    expect(row.countryCode).toBeNull(); // INCONNU, jamais un code fabriqué
  });

  it('STR-VERSION-ADVERSE — la charge utile traverse la chaîne en TEXTE littéral, jamais en balisage (ARB-62)', () => {
    const batch = buildBatch([
      { priceEur: 12000, strings: ['https://patho.local/l/0', ADVERSE_VERSION, '', '', ''] },
    ]);
    // La zone de chaînes restitue la charge utile OCTET À OCTET (aucune interprétation).
    expect(readListingString(batch, 0, STRING_FIELD.modelVersionRaw)).toBe(ADVERSE_VERSION);

    const row = buildListingRow(batch, 0, new OutlierIndex([]));
    expect(row.modelVersion).toBe(ADVERSE_VERSION);

    // Export CSV : la cellule est échappée, la charge reste inerte et ne casse pas la structure.
    const csv = exportListingsCsv([row], {
      snapshotId: 'patho',
      capturedAt: '2026-09-01T00:00:00Z',
      sourceKind: 'SYNTHETIC',
      filterQuery: '',
      sampleCoverage: 'NON_APPLICABLE',
      metricCoverage: '',
    });
    expect(csv).toContain('<script>'); // texte, pas balisage : aucune ré-écriture silencieuse
    expect(csv.split('\n').filter((l) => l.length > 0)).toHaveLength(5); // 3 méta + en-tête + 1 ligne
  });

  it('R-PATHO-11 — ADV-17 / ARB-61 : rien n’applique la troncature à 80 caractères de modelVersionClean', () => {
    // `EX-DATA-29` étape 6 + `ARB-61` : `modelVersionClean` est une `chaîne(80)` ; à défaut d'espace
    // dans les 80 premiers caractères, troncature DURE à exactement 80. Aucun module du dépôt
    // n'implémente ce pipeline : la valeur traverse jusqu'au modèle de vue de l'écran D.
    const batch = buildBatch([
      { priceEur: 12000, strings: ['https://patho.local/l/0', ADVERSE_VERSION, ADVERSE_VERSION, '', ''] },
    ]);
    const row = buildListingRow(batch, 0, new OutlierIndex([]));
    expect(row.modelVersion.length).toBeLessThanOrEqual(80);
  });
});

describe('patho — invariants sous jeux structurellement pathologiques', () => {
  it('STR-INVARIANTS — sommes marque/modèle et buckets restent exacts avec modelId = 0 et doublons', () => {
    const specs: RowSpec[] = [
      ...cell(20, { makeId: 54, modelId: 1918 }),
      ...cell(9, { makeId: 54, modelId: 0, basePrice: 8000 }),
      ...cell(15, { makeId: 74, modelId: 2084, basePrice: 20000 }),
      { priceEur: null, makeId: 74, modelId: 2084 },
    ];
    const recalc = new AggregationDataset(buildBatch(specs)).recalculate({ selectionHash: 'struct' });
    const inv = checkInvariants(recalc);

    expect(inv.selectionCount).toBe(45);
    expect(inv.makeSum).toBe(45);
    expect(inv.makeCountsMatchModelSums).toBe(true);
    expect(inv.priceBucketSum).toBe(inv.priceN);
    expect(inv.yearBucketSum).toBe(inv.yearN);
    expect(inv.mileageBucketSum).toBe(inv.mileageN);
    expect(inv.priceStatusPartitionOk).toBe(true);
  });
});
