import { cpSync, existsSync, createReadStream, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, extname, basename } from 'node:path';

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
 * KYCAR — Plugin de phase 3.3 : sert les FIXTURES du dépôt (`data/fixtures/`) sous `/fixtures/*`.
 *
 * Même principe que `kycar-reference-data` (D8) : des fichiers de DONNÉES servis en statique, jamais
 * inlinés dans un chunk JS — le chargement des fixtures est du RÉSEAU, pas du bundle, et
 * `npm run size` (EX-NFR-10) ne les voit donc pas.
 *
 * **Les `.ndjson.gz` sont servis TELS QUELS**, en `application/octet-stream`, **sans en-tête
 * `Content-Encoding`.** Deux raisons, dans cet ordre :
 *
 *   1. avec `Content-Encoding: gzip`, c'est le NAVIGATEUR qui décompresse, et le comportement
 *      dépendrait alors de la configuration de l'hébergeur — en dev, en `vite preview`, et chez un
 *      tiers, on n'aurait pas le même chemin de code. Servir les octets bruts et décompresser dans
 *      l'application par `DecompressionStream('gzip')` rend le chemin IDENTIQUE partout ;
 *   2. le flux reste alors un flux : le provider découpe ligne à ligne sans jamais matérialiser le
 *      fichier entier (budget mémoire ARB-55).
 *
 * Le client ne fait de toute façon pas confiance à l'en-tête : il RENIFLE les deux octets magiques
 * `1f 8b` (`src/providers/fixture/ndjson.ts`), ce qui le rend correct même si un hébergeur décide
 * de décoder à sa place.
 *
 * **`index.json` d'un profil** : le provider a besoin de connaître les snapshots d'un profil sans
 * tâtonner (une requête 404 par répertoire supposé). Si le générateur a écrit
 * `data/fixtures/<profil>/index.json`, il est servi tel quel ; sinon ce plugin le SYNTHÉTISE en
 * lisant le `capturedAt` de chaque `manifest.json`. Le provider ne dépend donc pas d'un fichier que
 * `dataset-gen` n'avait pas prévu.
 */
const FIXTURE_DIR = resolve(__dirname, 'data/fixtures');

/** Profils recopiés dans `dist/` au build. `perf` (3 x 100 000, non commité) en est exclu. */
const BUILT_FIXTURE_PROFILES: readonly string[] = ['dev', 'test'];

const FIXTURE_MIME: Readonly<Record<string, string>> = {
  '.json': 'application/json; charset=utf-8',
  '.ndjson': 'application/x-ndjson; charset=utf-8',
  '.gz': 'application/octet-stream',
};

/**
 * Manifest ALLÉGÉ : le manifest sans sa vérité terrain. Sur le profil `test`, `manifest.json` pèse
 * 501 Kio dont 2 436 anomalies déclarées — **1,3 Kio seulement** intéressent l'application, qui ne
 * lit jamais `groundTruth` (c'est le document du reviewer et des sondes). Le télécharger avant la
 * première ligne d'annonces coûterait un cinquième du budget de 2 s d'`EX-NFR-9`, pour rien.
 * Le fichier complet reste versionné et servi ; c'est le CHEMIN DE L'APPLICATION qui s'allège.
 */
function buildLightManifest(manifestPath: string): string | null {
  if (!existsSync(manifestPath)) return null;
  const full = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>;
  const light: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(full)) {
    if (key === 'groundTruth') continue;
    light[key] = value;
  }
  // `groundTruth` est OBLIGATOIRE au schéma de manifest : on ne le retire pas, on le VIDE, et on
  // dit où le trouver. Un manifest allégé reste ainsi conforme et ne se fait pas passer pour complet.
  light['groundTruth'] = [];
  light['note'] =
    `${String(full['note'] ?? '')} [manifest allege servi a l'application : groundTruth ` +
    `(${Array.isArray(full['groundTruth']) ? full['groundTruth'].length : 0} anomalies) retire du ` +
    `chemin critique, disponible dans manifest.json]`;
  return JSON.stringify(light, null, 1);
}

/** Nom du manifest allégé servi à l'application. */
const LIGHT_MANIFEST = 'manifest.min.json';

/** Fichiers de fixtures qui n'ont rien à faire dans `dist/` (provenance du générateur). */
const FIXTURE_BUILD_EXCLUDE: readonly string[] = ['generation.json'];

/** Index d'un profil, reconstruit depuis les manifests du disque et trié par `capturedAt`. */
function buildFixtureProfileIndex(profile: string): string | null {
  const dir = resolve(FIXTURE_DIR, profile);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return null;
  const snapshots: Array<Record<string, unknown>> = [];
  for (const name of readdirSync(dir).sort()) {
    const child = resolve(dir, name);
    if (!statSync(child).isDirectory()) continue;
    const manifestPath = resolve(child, 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    const m = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>;
    snapshots.push({
      snapshotId: typeof m['snapshotId'] === 'string' ? m['snapshotId'] : name,
      dir: name,
      capturedAt: typeof m['capturedAt'] === 'string' ? m['capturedAt'] : '',
      listingCount: m['listingCount'],
      file: m['file'],
    });
  }
  snapshots.sort(
    (a, b) => Date.parse(String(a['capturedAt'])) - Date.parse(String(b['capturedAt'])),
  );
  return JSON.stringify({ profile, snapshots }, null, 1);
}

function kycarFixtureData(): Plugin {
  return {
    name: 'kycar-fixture-data',
    configureServer(server) {
      server.middlewares.use('/fixtures', (req, res, next) => {
        const rawUrl = req.url ?? '/';
        const rel = decodeURIComponent(rawUrl.split('?')[0] ?? '/').replace(/^\/+/, '');
        // Défense : aucune remontée hors du dossier de fixtures.
        const filePath = resolve(FIXTURE_DIR, rel);
        if (!filePath.startsWith(FIXTURE_DIR) || rel.length === 0) {
          next();
          return;
        }
        // `<profil>/<snapshot>/manifest.min.json` synthétisé depuis le manifest complet.
        const asLight = new RegExp(`^([A-Za-z0-9_-]+)/([A-Za-z0-9_.-]+)/${LIGHT_MANIFEST}$`).exec(rel);
        if (asLight !== null && !existsSync(filePath)) {
          const body = buildLightManifest(
            resolve(FIXTURE_DIR, asLight[1] as string, asLight[2] as string, 'manifest.json'),
          );
          if (body === null) {
            next();
            return;
          }
          res.setHeader('Content-Type', FIXTURE_MIME['.json'] as string);
          res.end(body);
          return;
        }
        // `<profil>/index.json` synthétisé quand le générateur n'en a pas écrit.
        const asIndex = /^([A-Za-z0-9_-]+)\/index\.json$/.exec(rel);
        if (asIndex !== null && !existsSync(filePath)) {
          const body = buildFixtureProfileIndex(asIndex[1] as string);
          if (body === null) {
            next();
            return;
          }
          res.setHeader('Content-Type', FIXTURE_MIME['.json'] as string);
          res.end(body);
          return;
        }
        if (!existsSync(filePath)) {
          next();
          return;
        }
        // Les `.gz` partent BRUTS : aucun `Content-Encoding`, la décompression est côté client.
        res.setHeader('Content-Type', FIXTURE_MIME[extname(filePath)] ?? 'application/octet-stream');
        createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      if (!existsSync(FIXTURE_DIR)) return;
      for (const profile of BUILT_FIXTURE_PROFILES) {
        const from = resolve(FIXTURE_DIR, profile);
        if (!existsSync(from)) continue;
        const to = resolve(__dirname, 'dist/fixtures', profile);
        cpSync(from, to, {
          recursive: true,
          filter: (src) => !FIXTURE_BUILD_EXCLUDE.includes(basename(src)),
        });
        // Un manifest ALLÉGÉ par snapshot, servi à l'application ; le complet reste à côté.
        for (const name of readdirSync(to)) {
          const snapshotDir = resolve(to, name);
          if (!statSync(snapshotDir).isDirectory()) continue;
          const body = buildLightManifest(resolve(snapshotDir, 'manifest.json'));
          if (body !== null) writeFileSync(resolve(snapshotDir, LIGHT_MANIFEST), body, 'utf-8');
        }
        const indexPath = resolve(to, 'index.json');
        if (!existsSync(indexPath)) {
          const body = buildFixtureProfileIndex(profile);
          if (body !== null) {
            mkdirSync(to, { recursive: true });
            writeFileSync(indexPath, body, 'utf-8');
          }
        }
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
  plugins: [preact(), kycarReferenceData(), kycarFixtureData()],
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
