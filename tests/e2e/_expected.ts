/**
 * KYCAR — attendus de la recette navigateur, DÉRIVÉS DES FIXTURES (phase 3.5, `D3-17` / `D3-24`)
 * =================================================================================================
 * ## Pourquoi ce module existe
 *
 * Jusqu'à la phase 2.9 la recette portait sur le provider SYNTHÉTIQUE (100 000 annonces générées à
 * la volée) et ses attendus étaient des CONSTANTES relevées à la main (`P1_EXPECTED = { makes: 107,
 * offers: 2632 }`). La phase 3 remplace la source par défaut par un jeu de fixtures versionné
 * (`fixture:test`, `D3-01`) : les 58 échecs identiques sur les trois projets constatés en `D3-24`
 * ne disaient rien de l'application — ils disaient que les constantes décrivaient un autre corpus.
 *
 * Les recopier à la main sur le nouveau corpus aurait reproduit la panne à la prochaine
 * régénération des fixtures (`data-fix`, phase 3.4). **Toute valeur attendue qui DÉPEND DES DONNÉES
 * est donc calculée par programme, ici, à partir des fixtures elles-mêmes** ; seuls les seuils
 * NORMATIFS restent figés (budgets de performance, formats d'affichage, plafonds de persistance) :
 * ceux-là ne viennent pas des données, ils viennent des exigences.
 *
 * ## Méthode de dérivation
 *
 * On ne réimplémente pas la sélection : on rejoue le **câblage de production**, en Node, sur les
 * mêmes octets que ceux servis au navigateur.
 *
 *   1. `loadReferenceDataFromDisk()` — les référentiels du dépôt, ceux que le plugin Vite sert ;
 *   2. `FixtureDataProvider` sur le profil `test` avec le chargeur DISQUE (`createNodeFixtureLoader`),
 *      qui sert le contrat `FixtureLoader` que sert aussi le chargeur HTTP : même flux, même
 *      décompression, même adaptateur as24 → canonique, mêmes rejets d'ingestion, même
 *      dédoublonnage. Le SNAPSHOT retenu est celui que retient l'application : le plus RÉCENT du
 *      profil (l'index est trié par `capturedAt` croissant, le provider prend le dernier) ;
 *   3. `DataController` avec le moteur D4 exécuté in-process (`createInProcessEngineClient`, le
 *      même code que celui du Web Worker) — donc les mêmes agrégats, aux mêmes arrondis ;
 *   4. `loadMarket(selection)` / `enterMode2(...)` avec EXACTEMENT la sélection du parcours testé.
 *
 * Ce que le navigateur affiche est donc confronté à ce que le même code calcule sur le même jeu :
 * un écart signale une faute d'affichage, jamais une constante périmée.
 *
 * ## Coût et mise en cache
 *
 * L'ouverture du snapshot (20 000 annonces, 2,7 Mio gzip) est faite UNE FOIS par processus de
 * travail Playwright et mémorisée (`derived()` renvoie toujours la même promesse). Les tests
 * n'attendent donc ce calcul qu'au premier appel.
 *
 * ## Ce que ce module ne fait pas
 *
 * Il ne connaît aucune valeur en dur. S'il n'arrive pas à ouvrir les fixtures, il échoue bruyamment
 * : un attendu manquant doit arrêter la recette, jamais la laisser passer avec un chiffre inventé.
 */
import { DataController } from '../../src/orchestration/data-controller';
import { createInProcessEngineClient } from '../../src/orchestration/engine-inprocess';
import { loadReferenceDataFromDisk } from '../../src/orchestration/reference-fs';
import { loadQuery } from '../../src/state/corrections';
import { createMemorySnapshotCache } from '../../src/persistence/snapshot-cache';
import { FixtureDataProvider } from '../../src/providers/fixture/FixtureDataProvider';
import { createNodeFixtureLoader } from '../../src/providers/fixture/loaders/node';

/** Profil de fixtures servi par l'application (`D3-01`). */
export const E2E_FIXTURE_PROFILE = 'test';

/** Identifiants du couple Opel Corsa, pivot du parcours 2 (`00-CONTEXT.md`). */
export const OPEL_MAKE_ID = 54;
export const CORSA_MODEL_ID = 1918;

/** Cardinaux de la barre de synthèse de l'écran A (`EX-SCR-106`). */
export interface MarketCounts {
  readonly makes: number;
  readonly offers: number;
  /** Modèles DISTINCTS publiés par les agrégats de marque (`EX-DATA-68`), ou `null` si non publié. */
  readonly models: number | null;
}

/** Tous les attendus dérivés dont la suite a besoin. */
export interface DerivedExpectations {
  /** Snapshot effectivement servi : le plus récent du profil. */
  readonly snapshotId: string;
  readonly capturedAt: string;
  /** Annonces INGÉRÉES (dénominateur de la barre de synthèse sans filtre). */
  readonly listingCount: number;
  readonly rejectedCount: number;
  /** Écran A sans aucun filtre. */
  readonly unfiltered: MarketCounts;
  /** Écran A avec la sélection du parcours 1 (`?body=3&kmto=100000&priceto=20000`). */
  readonly p1: MarketCounts;
  /** Écran A avec la sélection DENSE (`DENSE_QUERY`), support des tests de densité. */
  readonly dense: MarketCounts;
  /** Effectif de la cellule Opel Corsa, toutes années (`EX-SCR-142`). */
  readonly corsaTotal: number;
  /** Effectif de la cellule Opel Corsa restreinte à 2017. */
  readonly corsa2017: number;
  /** Effectif de la cellule Volkswagen Golf, repère de densité du parcours de comparaison. */
  readonly golfTotal: number;
}

/**
 * Chaîne d'URL du parcours 1 (`00-CONTEXT.md`) : coupé, ≤ 100 000 km, ≤ 20 000 €. La SÉLECTION est
 * décodée par le décodeur d'URL DE L'APPLICATION (`loadQuery`, `EX-NAV-9`) plutôt que réécrite à la
 * main : c'est la seule manière de garantir que le calcul porte sur ce que la barre d'adresse dit.
 */
export const P1_QUERY = '?body=3&kmto=100000&priceto=20000';

/** Chaîne d'URL du filtre d'année du parcours 2. */
export const P2_YEAR_QUERY = '?fregfrom=2017&fregto=2017';

/**
 * Sélection DENSE de l'écran A — un seul filtre large. Elle existe parce que le parcours 1 est
 * volontairement ÉTROIT (coupé ≤ 20 000 € ≤ 100 000 km) : au profil `test` il ne retient que
 * quelques dizaines d'offres, sous le seuil `n = 12` d'`EX-SCR-33`/`114` et très en deçà du seuil
 * de virtualisation de 40 cartes (`EX-SCR-127`). Les tests dont le SUJET est la densité — grille
 * virtualisée, repli des zones-modèles, libellé de fourchette centrale — s'exercent donc sur cette
 * sélection-ci, et les tests du PARCOURS restent sur la sienne. Chacun mesure ce qu'il annonce.
 */
export const DENSE_QUERY = '?priceto=20000';

/** Modèle Golf, second repère de densité (`E-06` de `DATASET-SPEC.md`). */
const VW_MAKE_ID = 74;
const GOLF_MODEL_ID = 2084;

let cached: Promise<DerivedExpectations> | null = null;

/** Les attendus, calculés au premier appel puis mémorisés pour tout le processus de travail. */
export function derived(): Promise<DerivedExpectations> {
  cached ??= compute();
  return cached;
}

async function compute(): Promise<DerivedExpectations> {
  const referenceData = loadReferenceDataFromDisk();
  const provider = new FixtureDataProvider({
    referenceData,
    profile: E2E_FIXTURE_PROFILE as 'test',
    loader: createNodeFixtureLoader(),
  });
  const controller = new DataController({
    provider,
    referenceData,
    engineFactory: () => createInProcessEngineClient(),
    cache: createMemorySnapshotCache(),
  });

  const start = await controller.start();
  const descriptor = start.descriptor;
  if (descriptor === null || descriptor === undefined) {
    throw new Error('attendus E2E : le snapshot de fixtures n’a pas pu être ouvert (data/fixtures/test manquant ?)');
  }

  const unfiltered = countsOf(await controller.loadMarket({}));
  const p1 = countsOf(await controller.loadMarket(loadQuery(P1_QUERY).selection));
  const dense = countsOf(await controller.loadMarket(loadQuery(DENSE_QUERY).selection));

  // `EX-SCR-142` — l'effectif Σ de l'écran B est le nombre de LIGNES retenues après les filtres R
  // (`Mode2Payload.rows`), c'est-à-dire exactement ce que l'en-tête statistique affiche.
  const corsaTotal = (await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID, {})).rows.length;
  const corsa2017 = (
    await controller.enterMode2(OPEL_MAKE_ID, CORSA_MODEL_ID, loadQuery(P2_YEAR_QUERY).selection)
  ).rows.length;
  const golfTotal = (await controller.enterMode2(VW_MAKE_ID, GOLF_MODEL_ID, {})).rows.length;

  return {
    snapshotId: descriptor.snapshotId,
    capturedAt: descriptor.capturedAt,
    listingCount: descriptor.listingCount,
    rejectedCount: descriptor.rejectedCount,
    unfiltered,
    p1,
    dense,
    corsaTotal,
    corsa2017,
    golfTotal,
  };
}

/** Les mêmes cardinaux que ceux composés par `SummaryBar` (`EX-SCR-106`, `marketModelCardinal`). */
function countsOf(data: {
  readonly makeAggregates: readonly { readonly listingCount: number; readonly modelCount: number | null }[];
}): MarketCounts {
  let offers = 0;
  let models: number | null = 0;
  for (const agg of data.makeAggregates) {
    offers += agg.listingCount;
    if (models !== null) models = agg.modelCount === null ? null : models + agg.modelCount;
  }
  return { makes: data.makeAggregates.length, offers, models };
}
