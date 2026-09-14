/**
 * Revue D1 — sondes point 6 (strictude TS + périmètre ESLint) et point 8 (dépendances).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '../../..');

function readJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, relPath), 'utf8')) as T;
}

describe('strictude TypeScript (tsconfig.json)', () => {
  const tsconfig = readJson<{ compilerOptions: Record<string, unknown> }>('tsconfig.json');

  it('strict, noUncheckedIndexedAccess, noUnusedLocals sont actifs', () => {
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    expect(tsconfig.compilerOptions.noUnusedLocals).toBe(true);
  });
});

describe('tsconfig.worker.json isole la lib WebWorker', () => {
  const workerConfig = readJson<{ compilerOptions: { lib: string[] } }>('tsconfig.worker.json');

  it('lib contient WebWorker et ne contient pas DOM', () => {
    expect(workerConfig.compilerOptions.lib).toContain('WebWorker');
    expect(workerConfig.compilerOptions.lib).not.toContain('DOM');
  });
});

describe('périmètre ESLint (eslint.config.js)', () => {
  const eslintSource = readFileSync(resolve(ROOT, 'eslint.config.js'), 'utf8');

  it('`tests/review` n’est listé dans aucun bloc `ignores`', () => {
    const ignoresBlocks = Array.from(eslintSource.matchAll(/ignores:\s*\[([^\]]*)\]/gs)).map(
      (m) => m[1] ?? '',
    );
    for (const block of ignoresBlocks) {
      expect(block).not.toMatch(/tests\/review/);
    }
  });

  it('`tests` (au sens large) n’est pas ignoré, ni `tools`', () => {
    const ignoresBlocks = Array.from(eslintSource.matchAll(/ignores:\s*\[([^\]]*)\]/gs)).map(
      (m) => m[1] ?? '',
    );
    for (const block of ignoresBlocks) {
      expect(block).not.toMatch(/(?<!\.claude\/)['"`]tests\//);
      expect(block).not.toMatch(/['"`]tools\//);
    }
  });
});

describe('EX-NFR-17 — build.target laissé au défaut Vite (pas de fallback legacy)', () => {
  const viteConfigSource = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf8');

  it('aucun `build.target` ES5/legacy n’est fixé explicitement dans vite.config.ts', () => {
    expect(viteConfigSource).not.toMatch(/target:\s*['"]es5['"]/i);
  });

  it('aucun plugin de fallback legacy (`@vitejs/plugin-legacy`) n’est utilisé', () => {
    expect(viteConfigSource).not.toMatch(/plugin-legacy/);
    const pkg = readJson<{ dependencies: Record<string, string>; devDependencies: Record<string, string> }>(
      'package.json',
    );
    expect(Object.keys(pkg.dependencies)).not.toContain('@vitejs/plugin-legacy');
    expect(Object.keys(pkg.devDependencies)).not.toContain('@vitejs/plugin-legacy');
  });
});

describe('point 8 — aucune dépendance runtime autre que preact', () => {
  const pkg = readJson<{ dependencies: Record<string, string> }>('package.json');

  it('`dependencies` ne contient que `preact`', () => {
    expect(Object.keys(pkg.dependencies)).toEqual(['preact']);
  });
});
