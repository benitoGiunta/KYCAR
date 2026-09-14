import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

/**
 * KYCAR — configuration dédiée aux SONDES DE REVUE (`tests/review/D<n>/*.test.ts`).
 *
 * Phase 2.5 (revue de développement, PLAN-2 §2.5) : chaque agent de revue écrit des tests qui
 * confrontent son lot à ses critères de succès et aux cas pathologiques du stress-test 2.2. Une
 * sonde qui ÉCHOUE est un constat (elle porte l'identifiant du constat dans son titre) ; elle
 * reste en échec jusqu'à ce que la phase 2.6 (remédiation) la fasse passer — c'est « le même test
 * que celui qui a révélé le problème » exigé par PLAN-2 §2.6 S2.
 *
 * Séparée du `npm test` par défaut pour que la suite de production reste verte pendant la revue.
 * À la clôture de 2.6, les sondes sont promues dans la suite par défaut (vite.config.ts).
 *
 * Lancement : `npm run test:review` (tout) ou `npx vitest run --config vitest.review.config.ts tests/review/D4`.
 */
export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'node',
    include: ['tests/review/**/*.test.ts'],
    // Les revues tournent en parallèle sur 4 cœurs : un fichier à la fois par processus vitest.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
