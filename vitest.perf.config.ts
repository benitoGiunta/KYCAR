import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

/**
 * KYCAR — configuration dédiée aux bancs de performance (`*.perf.test.ts`).
 *
 * Séparée du `npm test` par défaut (voir vite.config.ts) : ces bancs génèrent des datasets de
 * 100 000 annonces et exécutent des centaines de recalculs, ce qui prend ~100 s et sature le CPU.
 * En suite parallèle ils affamaient le heartbeat RPC de vitest et produisaient de faux timeouts
 * sur d'autres fichiers. Ici : un seul fichier à la fois, pas de parallélisme, timeouts larges.
 *
 * Lancement : `npm run test:perf`.
 */
export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'node',
    include: ['src/**/*.perf.test.ts'],
    fileParallelism: false,
    testTimeout: 300_000,
    hookTimeout: 300_000,
  },
});
