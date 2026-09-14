/**
 * Revue D8 — sonde n°8 : BUDGET DE CHARGEMENT (EX-NFR-4, EX-NFR-9, EX-NFR-10) et plugin
 * `kycar-reference-data` — mesure statique reproductible sur `dist/` (produit par `npm run build`,
 * exécuté UNE fois par la revue) et sur `data/reference/`.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REQUIRED_REFERENCE_FILES } from '../../../src/orchestration/reference-loader';
import { estimateStartupTransfer, FOUR_G_BYTES_PER_SEC } from './_helpers';

const ROOT = process.cwd();
const DIST = resolve(ROOT, 'dist');
const KIB = 1024;

describe('dist/ — plugin kycar-reference-data et budget bundle', () => {
  it('le build est présent (manifest) — préalable des mesures', () => {
    expect(existsSync(resolve(DIST, '.vite/manifest.json'))).toBe(true);
  });

  it('dist/reference/ contient chaque référentiel chargé au démarrage, octet pour octet identique à data/reference/', () => {
    const rels = ['taxonomy.json', 'filters.json', 'filters-scope.json', ...REQUIRED_REFERENCE_FILES.map((n) => `references/${n}.json`)];
    for (const rel of rels) {
      const built = resolve(DIST, 'reference', rel);
      expect(existsSync(built), rel).toBe(true);
      expect(readFileSync(built).equals(readFileSync(resolve(ROOT, 'data/reference', rel))), rel).toBe(true);
    }
  });

  it('aucun référentiel n’est inliné dans un chunk JS (marqueurs de taxonomy.json et filters.json absents des .js)', () => {
    const assets = resolve(DIST, 'assets');
    const js = readdirSync(assets).filter((f) => f.endsWith('.js'));
    expect(js.length).toBeGreaterThan(0);
    const taxonomy = readFileSync(resolve(ROOT, 'data/reference/taxonomy.json'), 'utf8');
    // Un extrait littéral peu probable dans du code : la première entrée « models » de la taxonomie.
    const marker = taxonomy.match(/"models":\s*\[\s*\{[^}]{20,120}\}/)?.[0] ?? '"label":"Ascona"';
    for (const f of js) {
      const src = readFileSync(resolve(assets, f), 'utf8');
      expect(src.includes(marker), f).toBe(false);
      expect(src.includes('"evidenceNote"'), f).toBe(false);
    }
  });

  it('EX-NFR-10 : bundle initial (statique depuis l’entrée) ≤ 300 Kio gzip ; EX-NFR-4 : taxonomy.json < 1 Mo gzip', () => {
    const est = estimateStartupTransfer(ROOT);
    expect(est.initialJsBytes).toBeGreaterThan(0);
    expect(est.initialJsBytes).toBeLessThanOrEqual(300 * KIB);
    const taxonomy = est.referenceFiles.find((f) => f.file === 'taxonomy.json');
    expect(taxonomy?.gzipBytes).toBeLessThan(1_000_000);
  });

  it('EX-NFR-9 (part transfert) : octets réellement transférés au démarrage et temps à 500 Ko/s, comparés au 900 Ko / 1,8 s d’ARCHITECTURE §9.3', () => {
    const est = estimateStartupTransfer(ROOT);
    const lines = est.referenceFiles.map((f) => `  ${(f.gzipBytes / KIB).toFixed(1).padStart(7)} Kio  ${f.file}`).join('\n');
    console.log(
      `[EX-NFR-9 transfert]\n  ${(est.initialJsBytes / KIB).toFixed(1).padStart(7)} Kio  JS initial (gzip)\n  ${(est.initialCssBytes / KIB).toFixed(1).padStart(7)} Kio  CSS initial (gzip)\n${lines}\n` +
        `  ${(est.referenceBytes / KIB).toFixed(1).padStart(7)} Kio  référentiels (gzip, ${est.referenceFiles.length} fichiers)\n` +
        `  ${(est.totalBytes / KIB).toFixed(1).padStart(7)} Kio  TOTAL → ${((est.totalBytes / FOUR_G_BYTES_PER_SEC) * 1000).toFixed(0)} ms de transfert pur, ${est.transferMs.toFixed(0)} ms avec 2 × 150 ms de latence\n` +
        `  (agrégats de base : 0 octet transféré — calculés en mémoire par le provider synthétique, voir parcours.test.ts pour le coût CPU)`,
    );
    expect(est.totalBytes).toBeLessThanOrEqual(900 * 1000);
    expect(est.transferMs).toBeLessThanOrEqual(1800);
  });
});
