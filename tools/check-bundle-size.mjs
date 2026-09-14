#!/usr/bin/env node
/**
 * KYCAR - bundle size guard (lot D1).
 *
 * Enforces two budgets from `docs/requirements/draft-behaviour.md` D.3, wired to the choices
 * recorded in `docs/plans/ARCHITECTURE.md` S:1.3/7.1:
 *
 *   - EX-NFR-10: the initial JavaScript bundle (everything reachable from the entry via STATIC
 *     imports - what a first paint of mode 1 must download) must be <= 300 KiB gzip. Exceeding
 *     this is a hard failure (non-zero exit), by design: this is the "budget guard dès D1"
 *     required by the D1 success criteria in `docs/plans/PLAN-2-app-build.md` S:2.4.
 *   - EX-NFR-11: any chunk reachable only through a DYNAMIC `import()` (the future heavy/mode-2
 *     rendering bundle - see `src/screens/README.md`) has its own <= 400 KiB gzip budget,
 *     checked and reported the same way but kept informational while no such chunk exists yet.
 *
 * ORPHAN CHUNKS (DR-036). The manifest only records what the module graph reaches through
 * `imports`/`dynamicImports`. A Web Worker chunk is NOT in that graph: `new Worker(new URL(...))`
 * emits a separate file (`aggregation.worker-*.js`) that appears under no manifest key at all,
 * while `bootstrap()` instantiates it on the first paint of mode 1. Left alone, such a chunk could
 * grow without ever failing `npm run size` - a structural blind spot, not a thin margin. Every
 * `.js` file present in `dist/` but absent from the manifest is therefore counted in the INITIAL
 * budget and listed by name: a chunk that ships but is reachable by no static import is either
 * started at bootstrap (worker) or dead weight, and neither deserves to be invisible.
 *
 * Uses only Node's built-in `zlib`/`fs` - no extra dependency, per lot D1's dependency cap.
 *
 * Reads `dist/.vite/manifest.json` (`build.manifest: true` in `vite.config.ts`), which records,
 * per entry, which other chunks it reaches via static `imports` vs. `dynamicImports`. Only `.js`
 * files count towards these budgets: EX-NFR-10 literally says "bundle JavaScript initial" - CSS
 * and other assets are out of scope for this specific gate.
 *
 * Usage: `npm run build` first (produces `dist/`), then `npm run size`.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const MANIFEST_PATH = path.join(DIST_DIR, '.vite', 'manifest.json');

const BUDGET_INITIAL_BYTES = 300 * 1024;
const BUDGET_DEFERRED_BYTES = 400 * 1024;

function fail(message) {
  console.error(`[size] FAIL: ${message}`);
  process.exit(1);
}

if (!existsSync(MANIFEST_PATH)) {
  fail(
    `manifest not found at ${MANIFEST_PATH}. Run "npm run build" (with build.manifest: true in ` +
      'vite.config.ts) before "npm run size".',
  );
}

/** @typedef {{ file: string, isEntry?: boolean, imports?: string[], dynamicImports?: string[], css?: string[] }} ManifestEntry */

/** @type {Record<string, ManifestEntry>} */
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

function gzipSizeOfChunk(entry) {
  if (!entry.file.endsWith('.js')) {
    return 0;
  }
  const filePath = path.join(DIST_DIR, entry.file);
  if (!existsSync(filePath)) {
    fail(`manifest references ${entry.file}, but it is missing from ${DIST_DIR}.`);
  }
  const contents = readFileSync(filePath);
  return gzipSync(contents).length;
}

/**
 * Walks the manifest via `imports` (static) starting from `startKeys`, returning every manifest
 * key reached (roots included). Never crosses a `dynamicImports` edge.
 */
function collectStatic(startKeys) {
  const visited = new Set();
  const queue = [...startKeys];
  while (queue.length > 0) {
    const key = queue.shift();
    if (visited.has(key) || !manifest[key]) {
      continue;
    }
    visited.add(key);
    for (const dep of manifest[key].imports ?? []) {
      queue.push(dep);
    }
  }
  return visited;
}

const entryKeys = Object.keys(manifest).filter((key) => manifest[key]?.isEntry);
if (entryKeys.length === 0) {
  fail('no isEntry chunk found in the manifest - is build.manifest enabled in vite.config.ts?');
}

const initialSet = collectStatic(entryKeys);

// Roots of the deferred graph: every dynamic-import target reached from anything in the initial
// set (this is where a future D7 `import('./scatter-heavy')` will show up), then everything each
// of those reaches statically, excluding whatever the initial set already covers.
const dynamicRoots = new Set();
for (const key of initialSet) {
  for (const dep of manifest[key].dynamicImports ?? []) {
    dynamicRoots.add(dep);
  }
}
const deferredSet = new Set(
  [...collectStatic(dynamicRoots)].filter((key) => !initialSet.has(key)),
);

/** Every `.js` file actually present under `dist/`, as paths relative to `dist/`. */
function listShippedJsFiles(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === '.vite') continue; // manifest metadata, never shipped as code
      out.push(...listShippedJsFiles(path.join(dir, entry.name), rel));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(rel);
    }
  }
  return out;
}

/** Gzip size of a file given by its path relative to `dist/`. */
function gzipSizeOfFile(relFile) {
  return gzipSync(readFileSync(path.join(DIST_DIR, relFile))).length;
}

function summarize(label, keys) {
  let totalBytes = 0;
  const rows = [];
  for (const key of keys) {
    const size = gzipSizeOfChunk(manifest[key]);
    if (size > 0) {
      rows.push({ key, file: manifest[key].file, gzipBytes: size });
      totalBytes += size;
    }
  }
  rows.sort((a, b) => b.gzipBytes - a.gzipBytes);
  console.log(`\n[size] ${label}:`);
  for (const row of rows) {
    console.log(`  ${(row.gzipBytes / 1024).toFixed(2).padStart(8)} KiB  ${row.file}  (${row.key})`);
  }
  console.log(`  ${'-'.repeat(40)}`);
  console.log(`  ${(totalBytes / 1024).toFixed(2).padStart(8)} KiB  TOTAL`);
  return totalBytes;
}

// DR-036: chunks that ship but appear under no manifest key (the aggregation Web Worker, first of
// all) are attributed to the INITIAL budget, so the guard can never be blind to them.
const manifestFiles = new Set(Object.values(manifest).map((entry) => entry.file));
const orphanFiles = listShippedJsFiles(DIST_DIR).filter((file) => !manifestFiles.has(file));

function summarizeFiles(label, files) {
  let totalBytes = 0;
  const rows = files.map((file) => ({ file, gzipBytes: gzipSizeOfFile(file) }));
  rows.sort((a, b) => b.gzipBytes - a.gzipBytes);
  console.log(`\n[size] ${label}:`);
  for (const row of rows) {
    console.log(`  ${(row.gzipBytes / 1024).toFixed(2).padStart(8)} KiB  ${row.file}  (hors manifest)`);
    totalBytes += row.gzipBytes;
  }
  console.log(`  ${'-'.repeat(40)}`);
  console.log(`  ${(totalBytes / 1024).toFixed(2).padStart(8)} KiB  TOTAL`);
  return totalBytes;
}

const initialGraphBytes = summarize('initial bundle (static from entry) - EX-NFR-10', initialSet);
const orphanBytes =
  orphanFiles.length > 0
    ? summarizeFiles('chunks shipped outside the manifest graph (worker) - EX-NFR-10', orphanFiles)
    : 0;
const initialBytes = initialGraphBytes + orphanBytes;
const deferredBytes =
  deferredSet.size > 0
    ? summarize('deferred bundle (dynamic import) - EX-NFR-11', deferredSet)
    : (console.log('\n[size] no deferred (dynamically-imported) chunk yet - EX-NFR-11 not applicable in D1.'),
      0);

console.log(
  `\n[size] budgets: initial ${(initialBytes / 1024).toFixed(2)}/${BUDGET_INITIAL_BYTES / 1024} KiB gzip, ` +
    `deferred ${(deferredBytes / 1024).toFixed(2)}/${BUDGET_DEFERRED_BYTES / 1024} KiB gzip.`,
);

let hasHardFailure = false;

if (initialBytes > BUDGET_INITIAL_BYTES) {
  console.error(
    `[size] FAIL: initial bundle ${(initialBytes / 1024).toFixed(2)} KiB gzip exceeds the ` +
      `${BUDGET_INITIAL_BYTES / 1024} KiB budget (EX-NFR-10).`,
  );
  hasHardFailure = true;
}

if (deferredBytes > BUDGET_DEFERRED_BYTES) {
  console.error(
    `[size] FAIL: deferred bundle ${(deferredBytes / 1024).toFixed(2)} KiB gzip exceeds the ` +
      `${BUDGET_DEFERRED_BYTES / 1024} KiB budget (EX-NFR-11).`,
  );
  hasHardFailure = true;
}

if (hasHardFailure) {
  process.exit(1);
}

console.log('[size] OK: within budget.');
