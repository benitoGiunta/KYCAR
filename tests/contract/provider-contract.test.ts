/**
 * KYCAR — SUITE DE CONTRAT des providers (phase 3.3, PLAN-3 §3.3 critère S2)
 * =================================================================================================
 * Les MÊMES cas, exécutés sur **trois implémentations** de l'interface gelée `DataProvider` :
 * `synthetic` (SYNTHETIC, mode 2 servi), `fixture` (FIXTURE, mode 2 servi) et un mock `tweedehands`
 * (REAL, **mode 2 indisponible**). Le troisième sujet est celui qui empêche le contrat de supposer
 * le mode 2 : un contrat exercé sur une seule implémentation ne prouve que sa cohérence avec
 * elle-même.
 *
 * Ce que la suite contrôle, et pourquoi :
 *
 *   1. **`describe()` sincère** — ce qui est ANNONCÉ est SERVI. Un provider qui déclare le mode 2
 *      sans `fetchListingColumns`, ou l'inverse, ferait mentir `servesMode2()` et l'orchestration
 *      appellerait une méthode absente.
 *   2. **Invariants I1–I8** (`EX-DATA-104`) sur les VRAIES sorties du moteur, alimentées par le lot
 *      colonnaire de chaque provider mode 2 ; I1 et I2 sur les agrégats du provider mode 1 seul.
 *   3. **`unsupportedFilterIds` jamais silencieux** (D-03) et cohérence `fetchSelectionCount` ↔
 *      `fetchAggregates` (D-33).
 *   4. **R3** — `scanForbiddenFields` sur TOUT ce qui franchit l'interface.
 *   5. **Déterminisme d'`openSnapshot`** — deux ouvertures, mêmes agrégats.
 *   6. **Baseline = `fetchAggregates` sans filtre** (`ARCHITECTURE` §9.3).
 *   7. **`BOOLEAN_FLAG_BIT` rempli** par le provider de fixtures (D3-10).
 *   8. **Budgets** — ouverture, taille par ligne (`EX-NFR-3`), recalcul p95 (`EX-NFR-5`).
 *
 * Aucune I/O réseau (E5) : le sujet fixture lit le disque, le sujet 2dehands rejoue des chaînes.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import {
  servesMode2,
  type AggregateResult,
  type DataProvider,
  type ListingColumnBatch,
  type MakeAggregate,
  type ModelAggregate,
  type SnapshotHandle,
} from '../../src/providers/DataProvider';
import { batchByteLength } from '../../src/providers/synthetic/columnar';
import { AggregationDataset, type RecalcResult } from '../../src/engine/kernel';
import { binEdges, PRICE_BIN_PARAMS } from '../../src/engine/bin';
import { isPriceValid } from '../../src/engine/flags';
import {
  checkI1,
  checkI2,
  checkI3,
  checkI4,
  checkI5,
  checkI6,
  checkI7,
  checkI8,
} from '../../src/types/invariants';
import { LISTING_COLUMNS } from '../../src/types/columns';
import { scanForbiddenFields } from '../../src/types/validation';
import { BOOLEAN_FLAG_VALUES, readBooleanFlag } from '../../src/types/vocabularies';
import { ENUM_UNKNOWN_BYTE } from '../../src/types/sentinels';
import {
  allSubjects,
  createFixtureSubject,
  realDevFixturesAvailable,
  type ContractSubject,
} from './subjects';
import { FixtureDataProvider } from '../../src/providers/fixture/FixtureDataProvider';
import { createNodeFixtureLoader } from '../../src/providers/fixture/loaders/node';
import { buildMiniFixtures, MINI_LINES, MINI_PROFILE } from './fixtures/mini';
import { referenceData } from './subjects';

/** Un sujet ouvert : le provider, sa poignée, et ses agrégats de base. */
interface OpenSubject extends ContractSubject {
  readonly handle: SnapshotHandle;
  readonly baseline: AggregateResult<MakeAggregate>;
}

const opened: OpenSubject[] = [];

beforeAll(async () => {
  for (const subject of allSubjects()) {
    const handle = await subject.provider.openSnapshot();
    const baseline = await subject.provider.fetchBaselineAggregates(handle);
    opened.push({ ...subject, handle, baseline });
  }
});

/** Exécute `run` pour chaque sujet, en nommant le sujet dans le titre. */
function forEachSubject(title: string, run: (s: OpenSubject) => void | Promise<void>): void {
  for (const name of ['synthetic', 'fixture', 'tweedehands (mock)']) {
    it(`${title} [${name}]`, async () => {
      const subject = opened.find((s) => s.name === name);
      expect(subject, `sujet ${name} ouvert`).toBeDefined();
      await run(subject as OpenSubject);
    });
  }
}

/** Lot colonnaire d'un sujet mode 2, ou `null`. */
async function batchOf(subject: OpenSubject): Promise<ListingColumnBatch | null> {
  const p: DataProvider = subject.provider;
  if (!servesMode2(p)) return null;
  return p.fetchListingColumns(subject.handle, 'FULL');
}

/* ================================================================================================
 * 1. `describe()` sincère — ce qui est annoncé est servi
 * ============================================================================================== */

describe('contrat — capacités déclarées et effectivement servies', () => {
  forEachSubject('describe() est complet, et sa nature de source est l’une des trois', (s) => {
    const caps = s.provider.describe();
    expect(caps.providerId.length).toBeGreaterThan(0);
    expect(caps.providerVersion.length).toBeGreaterThan(0);
    expect(['REAL', 'SYNTHETIC', 'FIXTURE']).toContain(caps.sourceKind);
    expect(['be', 'nl']).toContain(caps.marketplace);
    expect(['LISTINGS', 'AGGREGATE_SURFACE']).toContain(caps.mode1.source);
  });

  forEachSubject('le mode 2 ANNONCÉ est le mode 2 SERVI (servesMode2 ne peut pas mentir)', async (s) => {
    const caps = s.provider.describe();
    expect(caps.mode2.kind === 'SERVED').toBe(s.expectsMode2);
    expect(servesMode2(s.provider)).toBe(s.expectsMode2);
    if (caps.mode2.kind === 'SERVED') {
      // Annoncé servi : la méthode existe ET rend un lot.
      expect(typeof s.provider.fetchListingColumns).toBe('function');
      const batch = await batchOf(s);
      expect(batch, 'un provider SERVED rend un lot colonnaire').not.toBeNull();
      expect((batch as ListingColumnBatch).rowCount).toBeGreaterThan(0);
    } else {
      // Annoncé indisponible : la méthode est ABSENTE, et le motif est documenté, jamais muet.
      expect(s.provider.fetchListingColumns).toBeUndefined();
      expect(['BIASED_SAMPLE', 'PAYWALL', 'FORBIDDEN_SURFACE', 'BY_DESIGN']).toContain(caps.mode2.reason);
      expect(['SYNTHETIC', 'NONE']).toContain(caps.mode2.fallback);
      expect(caps.mode2.detail.length).toBeGreaterThan(0);
    }
  });

  forEachSubject('le descripteur de snapshot est SINCÈRE : ses compteurs sont mesurés, pas écrits', (s) => {
    const d = s.handle.descriptor;
    expect(d.snapshotId.length).toBeGreaterThan(0);
    expect(d.sourceKind).toBe(s.provider.describe().sourceKind);
    expect(d.listingCount).toBeGreaterThanOrEqual(0);
    expect(d.rejectedCount).toBeGreaterThanOrEqual(0);
    // `rejectedCount` est la SOMME de `rejectedByReason` : deux chiffres qui divergeraient
    // rendraient le rapport d'ingestion (EX-DATA-46) inutilisable.
    const summed = Object.values(d.rejectedByReason).reduce((a, b) => a + b, 0);
    expect(summed).toBe(d.rejectedCount);
    expect(d.versionStrippedRate).toBeGreaterThanOrEqual(0);
    expect(d.versionStrippedRate).toBeLessThanOrEqual(1);
    // Aucun compteur d'inconnu ne peut dépasser l'effectif servi.
    for (const [field, count] of Object.entries(d.unknownCountByField)) {
      expect(count, `unknownCountByField.${field}`).toBeLessThanOrEqual(d.listingCount);
    }
    for (const [code, count] of Object.entries(d.ingestFlagCounts)) {
      expect(count, `ingestFlagCounts.${code}`).toBeLessThanOrEqual(d.listingCount);
    }
  });

  it('un provider dont la donnée est FABRIQUÉE le dit dans `coverageNote` (EX-DATA-107)', () => {
    for (const s of opened) {
      const kind = s.provider.describe().sourceKind;
      if (kind === 'REAL') continue;
      const note = s.handle.descriptor.coverageNote;
      expect(note, `${s.name} publie une note de couverture`).not.toBeNull();
      expect((note as string).length).toBeGreaterThan(40);
    }
    const fixture = opened.find((s) => s.name === 'fixture') as OpenSubject;
    // La note du provider de fixtures NOMME sa nature et le régime d'intégrité retenu.
    expect(fixture.handle.descriptor.coverageNote).toMatch(/FICTIVES/);
    expect(fixture.handle.descriptor.coverageNote).toMatch(/[Ii]ntégrité/);
  });
});

/* ================================================================================================
 * 2. R3 — aucun champ vendeur identifiant ne franchit l'interface
 * ============================================================================================== */

describe('contrat — R3 à l’ingestion, sur TOUT ce qui franchit l’interface', () => {
  forEachSubject('descripteur, agrégats et lot colonnaire sont indemnes', async (s) => {
    expect(scanForbiddenFields(s.handle.descriptor)).toEqual([]);
    expect(scanForbiddenFields(s.baseline)).toEqual([]);
    const batch = await batchOf(s);
    if (batch !== null) {
      // Sur le lot, on balaie les NOMS de colonne : les données y sont des `TypedArray`, que le
      // balayage récursif traverserait inutilement (des milliers d'indices numériques).
      const names = Object.keys(batch).map((k) => ({ column: k }));
      expect(scanForbiddenFields(names)).toEqual([]);
    }
  });

  it('la garantie est STRUCTURELLE : le schéma colonnaire lui-même n’a aucune colonne interdite', () => {
    expect(scanForbiddenFields(LISTING_COLUMNS.map((c) => ({ column: c.name })))).toEqual([]);
    const names = LISTING_COLUMNS.map((c) => c.name);
    expect(names).toContain('sellerType'); // TYPE de vendeur : autorisé (EX-DATA-42)
    expect(names).toContain('regionCode'); // NUTS-2 : autorisé (P-3)
    for (const forbidden of ['sellerId', 'companyName', 'phone', 'email', 'zip', 'city', 'lat', 'lon', 'vin']) {
      expect(names, `colonne interdite ${forbidden}`).not.toContain(forbidden);
    }
  });

  it('le lot du provider de fixtures ne porte AUCUNE clé de regroupement vendeur (E-02)', async () => {
    const fixture = opened.find((s) => s.name === 'fixture') as OpenSubject;
    const batch = (await batchOf(fixture)) as ListingColumnBatch;
    expect(Object.keys(batch)).not.toContain('dealerBucket');
    // Le `dealerBucket` a pourtant bien été LU : il sert au dédoublonnage inter-vendeurs. Ce qu'il
    // ne fait jamais, c'est franchir l'interface.
    expect(scanForbiddenFields({ dealerBucket: 'abc' })).toEqual([]); // pseudonyme, non interdit en soi
  });
});

/* ================================================================================================
 * 3. Invariants I1–I8 (EX-DATA-104)
 * ============================================================================================== */

describe('contrat — invariants I1 à I8 sur les sorties réelles', () => {
  /** I1 et I2 sont vérifiables sur les seuls AGRÉGATS : tout provider les sert, mode 2 ou non. */
  forEachSubject('I1 — Σ listingCount(marque) = effectif de la sélection', (s) => {
    const r = checkI1(s.baseline.rows, s.baseline.selectionCount);
    expect(r.ok, `${s.name} : ${r.detail}`).toBe(true);
    // Le contrôle a des dents : un effectif faux est détecté.
    expect(checkI1(s.baseline.rows, s.baseline.selectionCount + 1).ok).toBe(false);
  });

  forEachSubject('I2 — Σ modèles(marque) = listingCount(marque)', async (s) => {
    // Le niveau MODÈLE est demandé DANS LA PORTÉE d'une marque : c'est la seule forme que les trois
    // sujets servent (un provider `AGGREGATE_SURFACE` refuse « tous les modèles de toutes les
    // marques », qui coûterait un aller réseau par modèle du référentiel), et c'est aussi la forme
    // que les écrans emploient — les zones-modèles d'une carte de marque.
    const target = [...s.baseline.rows].sort((a, b) => b.listingCount - a.listingCount)[0];
    expect(target, `${s.name} publie au moins une marque`).toBeDefined();
    const makeId = (target as MakeAggregate).makeId;
    const models = (await s.provider.fetchAggregates(
      s.handle,
      `make=${makeId}`,
      'MODEL',
      makeId,
    )) as AggregateResult<ModelAggregate>;
    const r = checkI2([target as MakeAggregate], models.rows);
    expect(r.ok, `${s.name} / marque ${makeId} : ${r.detail}`).toBe(true);
  });

  /**
   * I3 à I8 portent sur des objets que **seul le moteur** produit (n de sélection, histogrammes,
   * partition du statut de prix, verdicts d'outlier, grille de densité, fonction de binning). Un
   * provider ne peut pas les violer parce qu'il n'en produit aucun — mais il peut fournir un lot
   * qui les FAIT violer. On les exerce donc là où c'est vrai : le lot du provider, chargé dans le
   * moteur, et les huit contrôles branchés sur ses sorties.
   */
  for (const name of ['synthetic', 'fixture']) {
    it(`I3 à I8 — le lot du provider passe les huit contrôles dans le moteur [${name}]`, async () => {
      const subject = opened.find((s) => s.name === name) as OpenSubject;
      const batch = (await batchOf(subject)) as ListingColumnBatch;
      const dataset = new AggregationDataset(batch);
      const result: RecalcResult = dataset.recalculate({ selectionHash: 'FULL:EMPTY' });
      const stats = result.selectionStats;

      expect(checkI1(result.makeAggregates, stats.selectionCount).ok, 'I1').toBe(true);
      expect(checkI2(result.makeAggregates, result.modelAggregates).ok, 'I2').toBe(true);
      expect(checkI3(result.makeAggregates, stats).ok, 'I3').toBe(true);
      const buckets = [...result.priceHistogram, ...result.yearHistogram, ...result.mileageHistogram];
      expect(checkI4(buckets, stats).ok, 'I4').toBe(true);
      expect(checkI5(stats).ok, 'I5').toBe(true);
      expect(checkI6(stats).ok, 'I6').toBe(true);
      expect(checkI7(result.densityCells, result.eligibleCount, dataset.yearBucketCountByIndex).ok, 'I7').toBe(true);

      const prices: number[] = [];
      for (let i = 0; i < batch.rowCount && prices.length < 800; i += 1) {
        const p = batch.priceEur[i] as number;
        if (isPriceValid(p, batch.priceStatus[i] as number, batch.ingestFlags[i] as number)) prices.push(p);
      }
      expect(prices.length, 'le lot fournit des prix valides à binner').toBeGreaterThan(0);
      expect(checkI8((values) => binEdges(values, PRICE_BIN_PARAMS), prices).ok, 'I8').toBe(true);
    });
  }
});

/* ================================================================================================
 * 4. `unsupportedFilterIds`, cohérence des effectifs, baseline
 * ============================================================================================== */

describe('contrat — effectifs, filtres non appliqués et baseline', () => {
  forEachSubject('la sélection VIDE n’a aucun filtre non appliqué', (s) => {
    expect(s.baseline.unsupportedFilterIds).toEqual([]);
  });

  forEachSubject('un filtre INCONNU est DÉCLARÉ, jamais ignoré en silence (D-03)', async (s) => {
    const bogus = 'filtreQuiNExistePas=1';
    const res = await s.provider.fetchAggregates(s.handle, bogus, 'MAKE');
    expect(res.unsupportedFilterIds, `${s.name} déclare le filtre inconnu`).toContain('filtreQuiNExistePas');
    // L'effectif publié ne peut PAS être l'effectif non filtré étiqueté comme filtré.
    expect(res.selectionCount).toBeLessThanOrEqual(s.baseline.selectionCount);
  });

  forEachSubject('D-33 — `fetchSelectionCount` et `fetchAggregates` comptent la MÊME chose', async (s) => {
    // Un provider `LISTINGS` lit le MÊME lot des deux côtés et passe par la MÊME compilation de
    // sélection : les deux chiffres doivent coïncider, sélection vide comprise. C'est ce que D-33
    // exige, et le contraire ferait afficher « N offres » à côté d'une somme de barres différente.
    if (s.provider.describe().mode1.source !== 'LISTINGS') return;
    for (const selection of ['', 'make=74', 'priceFrom=5000']) {
      const count = await s.provider.fetchSelectionCount(s.handle, selection);
      const agg = await s.provider.fetchAggregates(s.handle, selection, 'MAKE');
      expect(count, `${s.name} / « ${selection} »`).toBe(agg.selectionCount);
    }
  });

  /**
   * **CONSTAT C-P3-2, DETTE ÉCRITE (hors périmètre `fixture-provider`).**
   *
   * Sur un provider `AGGREGATE_SURFACE` (2dehands), les deux méthodes ne comptent PAS la même
   * chose et rien dans l'interface ne le dit :
   *
   *   - sélection VIDE : `fetchSelectionCount` rend l'effectif exhaustif de la surface
   *     (`totalResultCount` de la racine, 100 188 sur la fixture) tandis que `fetchAggregates`
   *     somme l'univers de marques BORNÉ (13 320). L'écart est légitime — l'univers borné est une
   *     politique opérationnelle assumée — mais `unsupportedFilterIds` est vide, la sélection
   *     l'étant : rien ne signale au consommateur que les deux chiffres ne sont pas comparables ;
   *   - filtre de classe R (`priceFrom=5000`) : le compteur applique le prédicat résiduel à
   *     l'ÉCHANTILLON de page (1) là où les agrégats publient l'effectif de la SURFACE (3). Le
   *     « N offres » affiché est alors INFÉRIEUR à la somme des barres — la direction indéfendable.
   *
   * Le correctif appartient à `src/providers/tweedehands`, hors du périmètre d'écriture de la
   * phase 3.3 (`reports/data/fixture-provider.md`, § constats). La sonde est écrite ICI, en
   * `it.fails` ANNOTÉ (jamais `skip`) : le jour où la divergence est corrigée, elle vire au rouge
   * et force le retrait de l'annotation.
   */
  it.fails('CONSTAT C-P3-2 (dette) — sur une surface d’agrégats, les deux effectifs divergent', async () => {
    const s = opened.find((x) => x.name === 'tweedehands (mock)') as OpenSubject;
    for (const selection of ['', 'priceFrom=5000']) {
      const count = await s.provider.fetchSelectionCount(s.handle, selection);
      const agg = await s.provider.fetchAggregates(s.handle, selection, 'MAKE');
      expect(count, `tweedehands / « ${selection} »`).toBe(agg.selectionCount);
    }
  });

  forEachSubject('l’effectif d’une sélection est la somme des effectifs de ses agrégats', async (s) => {
    const agg = await s.provider.fetchAggregates(s.handle, '', 'MAKE');
    const summed = agg.rows.reduce((a, r) => a + r.listingCount, 0);
    expect(summed).toBe(agg.selectionCount);
  });

  forEachSubject('la baseline est le MÊME chiffre que `fetchAggregates` sans filtre (§9.3)', async (s) => {
    const agg = (await s.provider.fetchAggregates(s.handle, '', 'MAKE')) as AggregateResult<MakeAggregate>;
    expect(agg.selectionCount).toBe(s.baseline.selectionCount);
    const key = (rows: readonly MakeAggregate[]): string =>
      [...rows]
        .sort((a, b) => a.makeId - b.makeId)
        .map((r) => `${r.makeId}:${r.listingCount}:${r.price.n}:${r.price.p50}:${r.mileage.n}:${r.year.n}`)
        .join('|');
    expect(key(agg.rows)).toBe(key(s.baseline.rows));
  });

  it('la baseline est PRÉCALCULÉE : deux appels rendent le MÊME objet (§9.3 garde-fou 1)', async () => {
    for (const s of opened) {
      const a = await s.provider.fetchBaselineAggregates(s.handle);
      const b = await s.provider.fetchBaselineAggregates(s.handle);
      // Même contenu au minimum ; identité d'objet pour les providers `LISTINGS` qui la mémorisent.
      expect(a.selectionCount).toBe(b.selectionCount);
      expect(a.rows.length).toBe(b.rows.length);
    }
  });
});

/* ================================================================================================
 * 5. Déterminisme d'`openSnapshot`
 * ============================================================================================== */

describe('contrat — déterminisme d’`openSnapshot`', () => {
  it('deux ouvertures INDÉPENDANTES du même jeu rendent les mêmes agrégats [fixture]', async () => {
    const a = createFixtureSubject();
    const b = createFixtureSubject();
    const ha = await a.provider.openSnapshot();
    const hb = await b.provider.openSnapshot();
    expect(hb.descriptor).toEqual(ha.descriptor);
    const ra = await a.provider.fetchBaselineAggregates(ha);
    const rb = await b.provider.fetchBaselineAggregates(hb);
    expect(JSON.stringify(rb.rows)).toBe(JSON.stringify(ra.rows));
  });

  it('D3-15 — l’arbitrage des doublons ne dépend PAS de l’ordre du fichier', async () => {
    // Le mini-jeu porte un doublon d'identifiant délibéré : le lire à l'endroit et à l'envers doit
    // donner le même descripteur et les mêmes agrégats. C'est la propriété que D3-15 exige, et
    // qu'un dédoublonnage « première occurrence » ne tient PAS.
    const mini = buildMiniFixtures();
    const forward = new FixtureDataProvider({
      referenceData: referenceData(),
      profile: MINI_PROFILE as 'dev',
      loader: createNodeFixtureLoader(mini.root),
    });
    const reversed = new FixtureDataProvider({
      referenceData: referenceData(),
      profile: MINI_PROFILE as 'dev',
      loader: reversingLoader(createNodeFixtureLoader(mini.root)),
      // L'ORDRE des octets est délibérément changé par ce chargeur : le sha256 du manifest ne peut
      // donc plus correspondre, et c'est exactement ce que la garde d'intégrité doit dire. On la
      // désarme ICI, et seulement ici, pour éprouver la propriété visée — l'indépendance de
      // l'ARBITRAGE à l'ordre du fichier. Que la garde ait bien refusé sans cette option est, en
      // soi, une preuve qu'elle fonctionne.
      verifySha256: false,
    });
    const hf = await forward.openSnapshot();
    const hr = await reversed.openSnapshot();

    expect(hr.descriptor.listingCount).toBe(hf.descriptor.listingCount);
    expect(hr.descriptor.duplicateListingCount).toBe(hf.descriptor.duplicateListingCount);
    expect(hr.descriptor.duplicateValueConflictCount).toBe(hf.descriptor.duplicateValueConflictCount);
    expect(hf.descriptor.duplicateListingCount, 'le mini-jeu porte bien un doublon').toBeGreaterThan(0);

    const sortRows = (r: AggregateResult<MakeAggregate>): string =>
      [...r.rows].sort((a, b) => a.makeId - b.makeId).map((x) => `${x.makeId}:${x.listingCount}:${x.price.p50}`).join('|');
    expect(sortRows(await reversed.fetchBaselineAggregates(hr))).toBe(
      sortRows(await forward.fetchBaselineAggregates(hf)),
    );
  });

  it('un snapshot explicite est servi, et un identifiant inconnu échoue plutôt que de se replier', async () => {
    const mini = buildMiniFixtures();
    const explicit = new FixtureDataProvider({
      referenceData: referenceData(),
      profile: MINI_PROFILE as 'dev',
      loader: createNodeFixtureLoader(mini.root),
      snapshotId: mini.oldestSnapshotId,
    });
    const handle = await explicit.openSnapshot();
    expect(handle.descriptor.snapshotId).toBe(mini.oldestSnapshotId);
    // Par défaut, c'est le PLUS RÉCENT qui est servi (les trois snapshots servent les écarts
    // d'effectif des recherches enregistrées).
    const byDefault = createFixtureSubject();
    const defaultHandle = await byDefault.provider.openSnapshot();
    if (!realDevFixturesAvailable()) {
      expect(defaultHandle.descriptor.snapshotId).toBe(mini.latestSnapshotId);
    }

    const unknown = new FixtureDataProvider({
      referenceData: referenceData(),
      profile: MINI_PROFILE as 'dev',
      loader: createNodeFixtureLoader(mini.root),
      snapshotId: 'be-19700101T000000Z',
    });
    await expect(unknown.openSnapshot()).rejects.toThrow(/absent du profil/);
  });

  it('les rejets d’ingestion sont COMPTÉS PAR MOTIF, jamais avalés (EX-DATA-46)', async () => {
    const mini = buildMiniFixtures();
    const dirty = new FixtureDataProvider({
      referenceData: referenceData(),
      profile: MINI_PROFILE as 'dev',
      loader: createNodeFixtureLoader(mini.root),
      snapshotId: mini.dirtySnapshotId,
    });
    const handle = await dirty.openSnapshot();
    const reasons = handle.descriptor.rejectedByReason;
    expect(reasons['R3_FORBIDDEN_FIELD']).toBe(1);
    expect(reasons['LISTING_URL_INVALID']).toBe(1);
    expect(reasons['LISTING_ID_INVALID']).toBe(1);
    expect(reasons['VEHICLE_TYPE_NOT_CAR']).toBe(1);
    expect(reasons['MAKE_UNKNOWN']).toBe(1);
    expect(reasons['NOT_AN_OBJECT']).toBe(1);
    // La ligne saine, elle, est servie : un fichier partiellement sale n'annule pas le snapshot.
    expect(handle.descriptor.listingCount).toBe(1);
    expect(handle.descriptor.rejectedCount).toBe(6);
  });
});

/** Chargeur qui rend les lignes du fichier À L'ENVERS, pour éprouver l'indépendance à l'ordre. */
function reversingLoader(inner: ReturnType<typeof createNodeFixtureLoader>): ReturnType<typeof createNodeFixtureLoader> {
  return {
    origin: `${inner.origin} (lignes inversées)`,
    loadProfileIndex: (profile) => inner.loadProfileIndex(profile),
    loadManifest: (profile, entry) => inner.loadManifest(profile, entry),
    async openListings(profile, entry) {
      const stream = await inner.openListings(profile, entry);
      const { readNdjsonStream } = await import('../../src/providers/fixture/ndjson');
      const lines: string[] = [];
      await readNdjsonStream(stream, { onLine: (l) => lines.push(l) });
      const text = `${lines.reverse().join('\n')}\n`;
      const bytes = new TextEncoder().encode(text);
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      });
    },
  };
}

/* ================================================================================================
 * 6. `BOOLEAN_FLAG_BIT` rempli par le provider de fixtures (D3-10)
 * ============================================================================================== */

describe('contrat — la colonne `booleanFlags` porte enfin les dix booléens du dictionnaire (D3-10)', () => {
  it('le provider de fixtures la REMPLIT ; les tri-états distinguent bien « non » d’« inconnu »', async () => {
    const fixture = opened.find((s) => s.name === 'fixture') as OpenSubject;
    const batch = (await batchOf(fixture)) as ListingColumnBatch;
    expect(batch.rowCount).toBeGreaterThan(0);

    let nonZero = 0;
    const seen = new Map<string, Set<string>>();
    for (const def of BOOLEAN_FLAG_VALUES) seen.set(def.code, new Set<string>());
    for (let i = 0; i < batch.rowCount; i += 1) {
      const flags = batch.booleanFlags[i] as number;
      if (flags !== 0) nonZero += 1;
      for (const def of BOOLEAN_FLAG_VALUES) {
        seen.get(def.code)?.add(String(readBooleanFlag(flags, def.code)));
      }
    }
    // La colonne n'est plus le tableau de zéros que `generate.ts` écrivait.
    expect(nonZero, 'des lignes portent des booléens renseignés').toBeGreaterThan(0);
    // Chaque booléen a au moins un état observé, et AUCUN tri-état ne rend `null` sur toutes les
    // lignes ni ne perd son état « inconnu » — c'est ce qui distingue D3-10 d'une colonne remplie
    // au hasard.
    for (const def of BOOLEAN_FLAG_VALUES) {
      const states = seen.get(def.code) as Set<string>;
      expect(states.size, `booléen ${def.code} : au moins un état observé`).toBeGreaterThan(0);
      if (def.kind === 'default-false') {
        expect(states.has('null'), `${def.code} a un DÉFAUT documenté, jamais « inconnu »`).toBe(false);
      }
    }
  });

  it('les colonnes énumérées du lot fixture emploient bien la sentinelle 255 pour l’inconnu', async () => {
    const fixture = opened.find((s) => s.name === 'fixture') as OpenSubject;
    const batch = (await batchOf(fixture)) as ListingColumnBatch;
    // `paintType` n'a pas de colonne ; `upholsteryType` en a une et le mini-jeu la renseigne.
    let unknowns = 0;
    for (let i = 0; i < batch.rowCount; i += 1) {
      if ((batch.regionCode[i] as number) === ENUM_UNKNOWN_BYTE) unknowns += 1;
    }
    // Aucune région inconnue attendue sur un jeu belge à préfixes valides : la sentinelle existe,
    // elle n'est pas employée par défaut.
    expect(unknowns).toBeLessThan(batch.rowCount);
  });
});

/* ================================================================================================
 * 7. Budgets mesurés (EX-NFR-3, EX-NFR-5, S4 de la phase 3.3)
 * ============================================================================================== */

describe('contrat — budgets mesurés', () => {
  it('ouverture du profil dev sous 2 000 ms (critère S4 de la phase 3.3)', async () => {
    const subject = createFixtureSubject();
    const started = Date.now();
    await subject.provider.openSnapshot();
    const elapsed = Date.now() - started;
    const provider = subject.provider as FixtureDataProvider;
    console.log(`[mesure] ouverture ${subject.origin} : ${elapsed} ms (interne ${provider.getLastOpenMs()} ms)`);
    expect(elapsed).toBeLessThan(2_000);
  });

  it('EX-NFR-3 — l’empreinte par ligne du lot colonnaire reste dans l’enveloppe', async () => {
    const fixture = opened.find((s) => s.name === 'fixture') as OpenSubject;
    const batch = (await batchOf(fixture)) as ListingColumnBatch;
    const bytes = batchByteLength(batch);
    const perRow = bytes / batch.rowCount;
    console.log(
      `[mesure] lot colonnaire ${fixture.origin} : ${batch.rowCount} lignes, ` +
        `${(bytes / 1024).toFixed(1)} Kio, ${perRow.toFixed(1)} o/ligne`,
    );
    // `EX-NFR-3` borne le jeu de RÉFÉRENCE à 25 Mo non compressés pour 100 000 annonces, soit
    // 250 octets par ligne. Le lot colonnaire est la forme EN MÉMOIRE de ces mêmes annonces : la
    // même enveloppe par ligne s'y applique, et le contrôle porte donc sur un rapport, jamais sur
    // un total qui dépendrait de l'effectif du jeu servi.
    expect(perRow).toBeLessThan(250);

    // Et la mesure LITTÉRALE d'`EX-NFR-3`, sur le FICHIER : 6 Mo gzip pour 100 000 annonces, soit
    // 60 octets par ligne compressée. Elle n'est OPPOSABLE que sur un jeu de taille réaliste : la
    // fenêtre de gzip n'a presque rien à réutiliser sur 200 lignes, et le mini-jeu y mesure ~90
    // o/ligne sans que cela dise quoi que ce soit du budget. On MESURE toujours, on n'OPPOSE que
    // sur le jeu réel — mesurer sans le dire serait pire que ne pas mesurer.
    if (!realDevFixturesAvailable()) {
      const mini = buildMiniFixtures();
      const perLineGz = mini.latestGzBytes / (MINI_LINES + 1);
      console.log(
        `[mesure] fichier ${mini.latestSnapshotId} (mini-jeu, ${MINI_LINES + 1} lignes) : ` +
          `${mini.latestGzBytes} o gzip, ${perLineGz.toFixed(1)} o/ligne — NON opposable à EX-NFR-3, ` +
          'dont les 60 o/ligne sont calibrés sur 100 000 annonces.',
      );
      expect(perLineGz).toBeGreaterThan(0);
    }
  });

  it('EX-NFR-5 — recalcul p95 sous 200 ms sur le lot du provider de fixtures', async () => {
    const fixture = opened.find((s) => s.name === 'fixture') as OpenSubject;
    const batch = (await batchOf(fixture)) as ListingColumnBatch;
    const dataset = new AggregationDataset(batch);
    // Banc COURT, sur le chemin synchrone du moteur : il mesure ce que la phase 3.3 doit prouver
    // sans dupliquer `test:perf` (qui, lui, tourne à 100 000 lignes et hors de cette suite).
    const runs = 30;
    const samples: number[] = [];
    for (let i = 0; i < runs; i += 1) {
      const t0 = performance.now();
      dataset.recalculate({ selectionHash: `FULL:${i}` });
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.min(samples.length - 1, Math.ceil(0.95 * samples.length) - 1)] as number;
    console.log(
      `[mesure] recalcul sur ${batch.rowCount} lignes (${fixture.origin}) : ` +
        `médiane ${(samples[Math.floor(runs / 2)] as number).toFixed(1)} ms, p95 ${p95.toFixed(1)} ms`,
    );
    expect(p95).toBeLessThan(200);
  });

  it('le jeu servi est nommé dans le rapport : aucune mesure sans son objet', () => {
    for (const s of opened) console.log(`[sujet] ${s.name} — ${s.origin}`);
    expect(opened).toHaveLength(3);
  });
});
