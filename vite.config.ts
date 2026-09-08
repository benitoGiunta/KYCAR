import { cpSync, existsSync, createReadStream } from 'node:fs';
import { resolve, extname } from 'node:path';

import preact from '@preact/preset-vite';
import { defineConfig, type Plugin } from 'vitest/config';

/**
 * KYCAR — Plugin d'intégration D8 : sert les référentiels statiques du dépôt (`data/reference/`) sous
 * `/reference/*` SANS les dupliquer dans le dépôt ni les inliner dans le bundle JS (garde EX-NFR-10).
 *
 * - En DEV : un middleware sert `data/reference/<...>` sur les requêtes `/reference/<...>`.
 * - Au BUILD : l'arbre `data/reference/` est copié dans `dist/reference/` (assets statiques, hors des
 *   chunks JS du manifest — donc invisibles de `npm run size`).
 *
 * SIGNALÉ (dette d'intégration) : ce plugin est le SEUL point où D8 retouche un fichier d'un autre
 * lot (vite.config.ts, D1). Il ne change rien au budget ni au pipeline ; il branche le fetch au
 * démarrage (EX-NFR-4), explicitement laissé à D8 par `src/types/reference.ts`.
 */
const REFERENCE_DIR = resolve(__dirname, 'data/reference');
const MIME: Readonly<Record<string, string>> = {
  '.json': 'application/json; charset=utf-8',
};

function kycarReferenceData(): Plugin {
  return {
    name: 'kycar-reference-data',
    configureServer(server) {
      server.middlewares.use('/reference', (req, res, next) => {
        const rawUrl = req.url ?? '/';
        const rel = decodeURIComponent(rawUrl.split('?')[0] ?? '/').replace(/^\/+/, '');
        // Défense: pas de remontée hors du dossier de référence.
        const filePath = resolve(REFERENCE_DIR, rel);
        if (!filePath.startsWith(REFERENCE_DIR) || rel.length === 0 || !existsSync(filePath)) {
          next();
          return;
        }
        res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream');
        createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      if (existsSync(REFERENCE_DIR)) {
        cpSync(REFERENCE_DIR, resolve(__dirname, 'dist/reference'), { recursive: true });
      }
    },
  };
}

/**
 * KYCAR - Vite config (lot D1).
 *
 * Bundle budgets (docs/plans/ARCHITECTURE.md S:1.3, S:7.1 D1):
 *   - EX-NFR-10: initial JS bundle <= 300 KiB gzip. Enforced by `npm run size`
 *     (tools/check-bundle-size.mjs), which reads `dist/.vite/manifest.json` (enabled below) and
 *     sums the gzip size of every chunk reachable from the entry via *static* imports only.
 *   - EX-NFR-11: any heavy rendering library (a future 3D/WebGL scatter plot notably) must be
 *     code-split via a dynamic `import()`, loaded only when mode 2 is entered, with its own
 *     <= 400 KiB gzip budget. No such module exists yet in D1 (S:7.1 explicitly does not require
 *     heavy code this early) - the manifest-based split is what makes a future
 *     `import('./scatter-heavy')` in D7 land in a *separate* chunk, invisible to the 300 KiB
 *     gate above and checked against its own 400 KiB budget by the same script. See
 *     `src/screens/README.md` for the expected mount point.
 *
 * `build.target` is left at Vite's default (native ES modules, matches EX-NFR-17's "last two
 * majors of Chrome/Firefox/Edge/Safari" - all of them support baseline ESM output without a
 * legacy fallback bundle, which would itself blow the 300 KiB budget).
 */
export default defineConfig({
  plugins: [preact(), kycarReferenceData()],
  build: {
    manifest: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Plusieurs tests fonctionnels génèrent de gros datasets synthétiques (jusqu'à 100k) ; sous
    // charge parallèle le défaut de 5 s déborde par famine CPU (temps CPU réel ~2 s). 30 s laisse
    // la marge sans masquer un vrai blocage. Les bancs de perf lourds restent hors de cette suite.
    testTimeout: 30_000,
    // Les bancs de perf (*.perf.test.ts) sont lourds (100k, ~100 s) et fausseraient le heartbeat
    // RPC de vitest en suite parallèle. Ils sont exclus du `npm test` par défaut et lancés à la
    // demande via `npm run test:perf` (vitest.perf.config.ts, mono-thread, gros timeout).
    // Depuis la clôture de la phase 2.6 (D-49), `npm test` enchaîne cette suite ET les sondes de
    // revue promues (`vitest.review.config.ts`, un fichier à la fois, 60 s) ; les 8 sondes d'une
    // dette consignée sont en `it.fails` annoté, jamais `skip`.
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.perf.test.ts'],
  },
});
