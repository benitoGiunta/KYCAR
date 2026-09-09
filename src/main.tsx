/**
 * KYCAR — Bootstrap réel de l'application (lot D8, source choisie par registre depuis la phase 3.3)
 * =================================================================================================
 * Assemble le câblage de PRODUCTION et monte la coquille `<App>` :
 *   1. `loadReferenceData()`        — taxonomie + vocabulaires servis sous `/reference/*` (EX-NFR-4).
 *   2. `resolveProvider()`          — la SOURCE est choisie par le registre (`src/providers/registry.ts`)
 *                                     selon `?provider=` puis `VITE_KYCAR_PROVIDER`, à défaut
 *                                     `fixture:test` (D3-01). Une spécification inconnue ou non
 *                                     câblée retombe sur le défaut AVEC un avertissement écrit dans
 *                                     la `coverageNote` du snapshot — jamais un repli muet.
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
import { resolveProvider } from './providers/registry';
import { createHttpFixtureLoader } from './providers/fixture/loaders/http';
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

  const referenceData = await loadReferenceData();
  // Bascule sans recompilation (DF-2) : `?provider=fixture:dev`, `?provider=synthetic`, …
  const selection = resolveProvider({
    referenceData,
    search: window.location.search,
    env: import.meta.env as unknown as Record<string, string | undefined>,
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

  render(
    <App
      controller={controller}
      referenceData={referenceData}
      stores={stores}
      providerSpec={selection.spec}
      providerWarning={selection.warning}
      fixtureSnapshotCount={await countFixtureSnapshots(selection.spec)}
    />,
    mountNode,
  );
}

/**
 * Nombre de snapshots du profil de fixtures servi, pour l'étiquette de provenance (`EX-DATA-107` :
 * « profil test, 3 snapshots »). Lu de l'INDEX du profil — le même fichier, par le même chargeur,
 * que celui que le provider ouvre juste après : la réponse est en cache HTTP, et le chiffre est
 * RELEVÉ au lieu d'être écrit en dur dans un écran. Toute erreur rend `null` : la phrase dégrade
 * alors en « (profil test) » plutôt que d'annoncer un nombre faux.
 */
async function countFixtureSnapshots(spec: string): Promise<number | null> {
  if (!spec.startsWith('fixture:')) return null;
  try {
    const index = await createHttpFixtureLoader().loadProfileIndex(spec.slice('fixture:'.length));
    return index.snapshots.length;
  } catch {
    return null;
  }
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
