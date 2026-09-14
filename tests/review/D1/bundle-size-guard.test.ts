/**
 * Revue D1 — sondes sur la garde de budget de bundle (`tools/check-bundle-size.mjs`).
 *
 * Objectif (mission rev-D1, point 1) : prouver PAR EXÉCUTION que la garde échoue réellement
 * quand le bundle dépasse 300 Ko gzip (EX-NFR-10) et 400 Ko gzip pour le différé (EX-NFR-11), en
 * exécutant le script contre un manifest factice écrit dans un dossier temporaire — sans jamais
 * toucher au vrai `dist/` du dépôt.
 *
 * Méthode : le script est un exécutable Node autonome (il appelle `process.exit`), on le lance
 * donc en sous-processus avec `cwd` pointé sur le dossier temporaire, exactement comme
 * `npm run size` le fait pour `dist/` à la racine.
 */
import { describe, expect, it, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

const SCRIPT = resolve(__dirname, '../../../tools/check-bundle-size.mjs');

const createdDirs: string[] = [];

function makeFixtureDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'kycar-size-guard-'));
  createdDirs.push(dir);
  mkdirSync(join(dir, 'dist', '.vite'), { recursive: true });
  mkdirSync(join(dir, 'dist', 'assets'), { recursive: true });
  return dir;
}

/** Random bytes are ~incompressible: writing N bytes gives a gzip size very close to N, which
 * makes the fixture's gzip weight precisely controllable (unlike repetitive/text content). The
 * guard only gzips file bytes — it never parses the file as JavaScript — so content validity is
 * irrelevant to the probe. */
function writeChunk(dir: string, fileName: string, approxBytes: number): void {
  writeFileSync(join(dir, 'dist', 'assets', fileName), randomBytes(approxBytes));
}

function writeManifest(dir: string, manifest: Record<string, unknown>): void {
  writeFileSync(join(dir, 'dist', '.vite', 'manifest.json'), JSON.stringify(manifest, null, 2));
}

function runGuard(dir: string): { status: number; stdout: string } {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT], { cwd: dir, encoding: 'utf8' });
    return { status: 0, stdout };
  } catch (error) {
    const err = error as { status: number | null; stdout: string };
    return { status: err.status ?? 1, stdout: err.stdout };
  }
}

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('EX-NFR-10 — la garde échoue réellement au-delà de 300 Ko gzip (bundle initial)', () => {
  it('sous le budget (≈50 Ko gzip) : sortie 0, "OK: within budget"', () => {
    const dir = makeFixtureDir();
    writeChunk(dir, 'entry-abc123.js', 50 * 1024);
    writeManifest(dir, {
      'index.html': { file: 'assets/entry-abc123.js', isEntry: true },
    });
    const { status, stdout } = runGuard(dir);
    expect(status).toBe(0);
    expect(stdout).toContain('OK: within budget');
  });

  it('au-delà du budget (≈310 Ko gzip > 300 Ko) : sortie non nulle, message EX-NFR-10', () => {
    const dir = makeFixtureDir();
    writeChunk(dir, 'entry-abc123.js', 310 * 1024);
    writeManifest(dir, {
      'index.html': { file: 'assets/entry-abc123.js', isEntry: true },
    });
    const { status, stdout } = runGuard(dir);
    expect(status).not.toBe(0);
    expect(stdout).toMatch(/EX-NFR-10/);
  });

  it('un chunk atteint par import statique depuis l’entrée compte dans le total initial', () => {
    const dir = makeFixtureDir();
    writeChunk(dir, 'entry.js', 200 * 1024);
    writeChunk(dir, 'shared-chunk.js', 150 * 1024);
    writeManifest(dir, {
      'index.html': { file: 'assets/entry.js', isEntry: true, imports: ['src/shared.ts'] },
      'src/shared.ts': { file: 'assets/shared-chunk.js' },
    });
    // 200 + 150 = 350 Ko > 300 Ko : doit échouer, ce qui prouve que le graphe `imports` est bien
    // parcouru (pas seulement le chunk d'entrée isolé).
    const { status, stdout } = runGuard(dir);
    expect(status).not.toBe(0);
    expect(stdout).toMatch(/EX-NFR-10/);
  });
});

describe('EX-NFR-11 — la garde échoue réellement au-delà de 400 Ko gzip (bundle différé)', () => {
  it('chunk différé sous le budget (≈50 Ko gzip) : sortie 0', () => {
    const dir = makeFixtureDir();
    writeChunk(dir, 'entry.js', 50 * 1024);
    writeChunk(dir, 'heavy-chunk.js', 50 * 1024);
    writeManifest(dir, {
      'index.html': { file: 'assets/entry.js', isEntry: true, dynamicImports: ['src/heavy.ts'] },
      'src/heavy.ts': { file: 'assets/heavy-chunk.js' },
    });
    const { status, stdout } = runGuard(dir);
    expect(status).toBe(0);
    expect(stdout).toContain('OK: within budget');
  });

  it('chunk différé au-delà du budget (≈410 Ko gzip > 400 Ko) : sortie non nulle, message EX-NFR-11', () => {
    const dir = makeFixtureDir();
    writeChunk(dir, 'entry.js', 50 * 1024);
    writeChunk(dir, 'heavy-chunk.js', 410 * 1024);
    writeManifest(dir, {
      'index.html': { file: 'assets/entry.js', isEntry: true, dynamicImports: ['src/heavy.ts'] },
      'src/heavy.ts': { file: 'assets/heavy-chunk.js' },
    });
    const { status, stdout } = runGuard(dir);
    expect(status).not.toBe(0);
    expect(stdout).toMatch(/EX-NFR-11/);
  });
});

describe('R-D1-01 — un chunk présent dans dist/ mais absent du graphe manifest (cas réel du Worker) échappe totalement aux deux budgets', () => {
  it('un fichier .js surdimensionné, non référencé par le manifest (comme le chunk du Worker d’agrégation produit par le vrai build), ne doit pas pouvoir contourner EX-NFR-10/11', () => {
    const dir = makeFixtureDir();
    // Reproduit fidèlement `dist/.vite/manifest.json` du vrai build (racine du dépôt) : SEULE la
    // clé `index.html` y figure, sans aucune entrée pour `aggregation.worker-*.js`, alors que ce
    // fichier existe bel et bien dans `dist/assets/` (vérifié par `npm run build` une fois, cf.
    // rapport §2). Le worker est pourtant chargé par `main.tsx` au bootstrap, donc nécessaire au
    // premier affichage du mode 1 au sens d'EX-NFR-10 ("nécessaire au premier affichage du mode
    // 1"), qui ne restreint pas cette notion aux imports JS statiques.
    writeChunk(dir, 'entry.js', 60 * 1024); // sous le budget à lui seul
    writeChunk(dir, 'aggregation.worker-like.js', 500 * 1024); // délibérément énorme, non lié
    writeManifest(dir, {
      'index.html': { file: 'assets/entry.js', isEntry: true },
      // Pas d'entrée pour aggregation.worker-like.js : c'est exactement la situation observée
      // dans le vrai dist/.vite/manifest.json (aucune clé "worker" du tout, cf. rapport §2).
    });
    const { status } = runGuard(dir);
    // Constat attendu : le total mesuré (60 Ko) ignore les 500 Ko du chunk non référencé, la
    // garde répond donc "OK" alors qu'un téléchargement de 560 Ko est réellement nécessaire au
    // premier affichage du mode 1. Cette assertion encode le comportement REQUIS par EX-NFR-10
    // (échouer) ; elle échoue aujourd'hui, ce qui EST le constat R-D1-01 (voir rapport §2).
    expect(status).not.toBe(0);
  });
});
