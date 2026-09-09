import { defineConfig } from 'vitest/config';

/**
 * KYCAR — configuration des SONDES DE DONNÉES (`tests/data/*.test.ts`, phase 3.3, `data-review`).
 *
 * Les sondes lisent les fixtures livrées (`data/fixtures/<profil>/`), les tables de
 * `docs/data/dataset-spec/` et l'adaptateur `src/providers/adapters/as24/`. Elles recalculent
 * chaque mesure : rien n'est repris de `tools/dataset/check.mjs`.
 *
 * Profil : `dev` par défaut (5 000 annonces × 3, rapide) ; `KYCAR_DATA_PROFILE=test` pour le profil
 * que l'application charge (20 000 × 3, D3-01). Les sondes de portée « snapshot test » se
 * neutralisent explicitement hors de ce profil.
 *
 * Un seul processus, sans isolation : les trois snapshots sont décompressés et analysés UNE FOIS
 * pour toute la suite (le cache de `harness.ts` est un module partagé). Isoler les fichiers
 * multiplierait par dix le coût de chargement sans rien prouver de plus.
 *
 * Lancement : `npm run test:data`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/data/**/*.test.ts'],
    fileParallelism: false,
    isolate: false,
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
