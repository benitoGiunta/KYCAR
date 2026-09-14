/**
 * KYCAR — Bootstrap réel de l'application (lot D8, source choisie par registre depuis la phase 3.3)
 * =================================================================================================
 * Assemble le câblage de PRODUCTION et monte la coquille `<App>` :
 *   0. `warmFixtureMeta()`          — **D3-31** : dès la première ligne du bootstrap, les trois
 *                                     petits documents du jeu de fixtures (index du profil, manifest
 *                                     allégé, agrégats précalculés) sont demandés, SANS être
 *                                     attendus. Cause (b) de `C-3.5-01` : les 15 référentiels
 *                                     finissaient vers 1 250 ms et le snapshot ne commençait
 *                                     qu'ensuite. Le chargeur mémorise ses réponses, donc
 *                                     `openSnapshot` les retrouve sans un aller-retour de plus.
 *   1. `loadReferenceData()`        — taxonomie + vocabulaires servis sous `/reference/*` (EX-NFR-4).
 *   2. `resolveProvider()`          — la SOURCE est choisie par le registre (`src/providers/registry.ts`)
 *                                     selon `?provider=` puis `VITE_KYCAR_PROVIDER`, à défaut
 *                                     `fixture:test` (D3-01). Une spécification inconnue ou non
 *                                     câblée retombe sur le défaut AVEC un avertissement écrit dans
 *                                     la `coverageNote` du snapshot — jamais un repli muet. La
 *                                     spécification amorcée est EXPOSÉE à la coquille (`bootSource`,
 *                                     `ACC-26`) : une navigation interne vers une URL qui nomme une
 *                                     AUTRE source devient une navigation complète, qui repasse
 *                                     ici — l'URL ne peut donc jamais nommer une source que
 *                                     l'application ne sert pas.
 *   3. `createAggregationEngine()`  — moteur piloté par le vrai Web Worker (calcul hors thread de
 *                                     rendu, ARCHITECTURE §1.3) ; injecté dans le contrôleur.
 *   4. `new DataController(...)`    — hôte d'orchestration (réessais, repli cache, chargement
 *                                     progressif) ; `start()` est déclenché par `<App>` au montage.
 * Le cache de snapshot vit dans IndexedDB (EX-NFR-22) ; les collections CRUD dans localStorage.
 */
import { render } from 'preact';

import { App, type AppStores } from './app';
import { DataController } from './orchestration/data-controller';
import { loadReferenceData } from './orchestration/reference-loader';
import { createAggregationEngine } from './engine/index';
import { SyntheticDataProvider } from './providers/synthetic/index';
import { resolveProvider, resolveProviderSpec, type ProviderSpec } from './providers/registry';
import { bootSourceOf } from './app/source-navigation';
import { createHttpFixtureLoader, warmFixtureMeta } from './providers/fixture/loaders/http';
import type { FixtureLoader } from './providers/fixture/loaders/types';
import {
  createSavedSearchStore,
  createFollowedModelStore,
  createRecentHistoryStore,
  createPreferencesStore,
  createIndexedDbSnapshotCache,
} from './persistence/index';
import './styles/tokens.css';
import './styles/print.css';

async function bootstrap(): Promise<void> {
  const mountNode = document.getElementById('app');
  if (!mountNode) throw new Error('KYCAR: #app mount node not found in index.html');

  const search = window.location.search;
  const env = import.meta.env as unknown as Record<string, string | undefined>;

  // `D3-31` — LE RÉSEAU D'ABORD, LES RÉFÉRENTIELS ENSUITE, LES DEUX EN MÊME TEMPS. La SPÉCIFICATION
  // de source se résout sans référentiels (`resolveProviderSpec` est pure) : on peut donc lancer le
  // préchargement des métadonnées du jeu AVANT d'attendre la taxonomie, au lieu d'attendre l'une
  // pour commencer l'autre. Le chargeur est celui que le provider recevra : ses réponses sont
  // mémorisées, rien n'est demandé deux fois.
  const fixtureLoader = createHttpFixtureLoader();
  const early = resolveProviderSpec({ search, env });
  const warming = warmFixtureProfile(fixtureLoader, early.spec);

  const referenceData = await loadReferenceData();
  // Bascule sans recompilation (DF-2) : `?provider=fixture:dev`, `?provider=synthetic`, …
  const selection = resolveProvider({
    referenceData,
    search,
    env,
    fixtureLoader,
  });
  if (selection.warning !== null) {
    // L'avertissement voyage AUSSI par la `coverageNote` du snapshot et — depuis la phase 3.5 — par
    // le bandeau `ET-SOURCE-REPLI` de la coquille : la console sert la mise au point, elle ne le
    // remplace pas. La `coverageNote` seule ne suffisait pas : aucun écran ne l'affiche.
    console.warn(`KYCAR — ${selection.warning}`);
  }
  const controller = new DataController({
    provider: selection.provider,
    referenceData,
    // `EX-DATA-107` (DR-095) : repli mode 2 explicite, CONSERVÉ tel quel en phase 3.3. Le provider
    // retenu par le registre sert déjà le mode 2 (fixture comme synthétique) ; le jour où un
    // provider RÉEL mode 1 seul le remplace (D9, `mode2.kind = UNAVAILABLE`), l'entrée en mode 2
    // bascule sur ce repli SYNTHETIC étiqueté au lieu d'échouer. Instance paresseuse : son jeu de
    // données n'est généré qu'au premier `openSnapshot` sur ELLE, donc jamais ici.
    mode2Fallback: new SyntheticDataProvider({ referenceData }),
    engineFactory: () => createAggregationEngine(),
    cache: createIndexedDbSnapshotCache(),
    // `D-29` : point d'injection du cache IndexedDB de baseline d'un provider `AGGREGATE_SURFACE`
    // (`baselineCache`, voir `persistence/baseline-cache.ts`). Il n'est PAS passé ici : `DR-104`
    // (`D-18`) interdit de câbler le provider réel tant qu'AC-01 n'est pas levée — la dette est
    // consignée dans `reports/remediation/fix-app.md`.
  });

  const stores: AppStores = {
    saved: createSavedSearchStore(),
    followed: createFollowedModelStore(),
    recent: createRecentHistoryStore(),
    preferences: createPreferencesStore(),
  };

  // Relevé du préchargement quand la spécification retenue est bien celle qui a été préchargée
  // (elle l'est toujours : même entrée, même fonction pure) ; sinon on relève celle qui est servie.
  const fixtureSnapshotCount =
    selection.spec === early.spec ? await warming : await warmFixtureProfile(fixtureLoader, selection.spec);

  render(
    <App
      controller={controller}
      referenceData={referenceData}
      stores={stores}
      providerSpec={selection.spec}
      bootSource={bootSourceOf(search, env)}
      providerWarning={selection.warning}
      fixtureSnapshotCount={fixtureSnapshotCount}
    />,
    mountNode,
  );
}

/**
 * Précharge les métadonnées du profil de fixtures servi et rend son nombre de snapshots, pour
 * l'étiquette de provenance (`EX-DATA-107` : « profil test, 3 snapshots »).
 *
 * Le chiffre est RELEVÉ de l'index du profil — le même fichier, par le même chargeur MÉMORISANT que
 * celui que le provider emploiera juste après : ni requête en double (le cache HTTP est désactivé
 * dans la recette `EX-NFR-9`), ni chiffre écrit en dur dans un écran. Une erreur rend `null` : la
 * phrase dégrade alors en « (profil test) » plutôt que d'annoncer un nombre faux.
 */
function warmFixtureProfile(loader: FixtureLoader, spec: ProviderSpec): Promise<number | null> {
  if (!spec.startsWith('fixture:')) return Promise.resolve(null);
  return warmFixtureMeta(loader, spec.slice('fixture:'.length));
}

void bootstrap().catch((err: unknown) => {
  const mountNode = document.getElementById('app');
  if (mountNode) {
    mountNode.innerHTML =
      '<main role="alert" style="padding:1.5rem;font-family:system-ui"><h1>KYCAR</h1>' +
      '<p>Le référentiel n’a pas pu être chargé. Rechargez la page ou réessayez plus tard.</p></main>';
  }
  console.error('KYCAR bootstrap failed', err);
});
