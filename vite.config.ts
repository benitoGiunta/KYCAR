/// <reference types="vitest/config" />
import preact from '@preact/preset-vite';
import { defineConfig } from 'vitest/config';

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
  plugins: [preact()],
  build: {
    manifest: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
