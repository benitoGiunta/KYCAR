import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

/**
 * KYCAR — configuration de la SUITE DE CONTRAT des providers (`tests/contract/`).
 *
 * Phase 3.3 (PLAN-3 §3.3, critère S2) : les MÊMES cas exécutés sur `synthetic`, `fixture` et le mock
 * `tweedehands`. Un contrat de provider ne vaut que s'il est exercé sur plusieurs implémentations —
 * une seule ne prouve que sa propre cohérence avec elle-même.
 *
 * Séparée de `npm test` (suite unitaire + sondes de revue promues) et de `test:review` : ces trois
 * suites ont des vitesses et des durées de vie différentes, et la porte de la phase les lance
 * séparément. `fileParallelism: false` — sur 4 cœurs, un fichier à la fois par processus vitest
 * (discipline CPU du protocole, `CLAUDE.md` §4.1).
 *
 * Lancement : `npm run test:contract`.
 */
export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'node',
    include: ['tests/contract/**/*.test.ts'],
    fileParallelism: false,
    // L'ouverture d'un snapshot de fixtures lit et adapte plusieurs milliers de lignes ; le banc de
    // recalcul en rejoue une centaine. 60 s laissent la marge sans masquer un vrai blocage.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
