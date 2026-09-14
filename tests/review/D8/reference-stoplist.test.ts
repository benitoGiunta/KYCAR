/**
 * Revue D8 (phase 3.5, `mvp-integrate`) — sonde de la LISTE D'ARRÊT versionnée (`D3-21`, `C-P3-11`).
 * =================================================================================================
 * Constat de `fixture-provider` (§ C-P3-11) : `data/reference/version-stoplist.json` et
 * `data/reference/version-lexicon.json` sont versionnés, servis par le plugin Vite
 * `kycar-reference-data`… et lus par AUCUN des deux chargeurs. `RawReferenceInputs.versionStoplist`
 * et `.versionLexicon` restaient donc `undefined` en production comme sous vitest, si bien que
 * `ReferenceData.versionStoplist` valait `[]` : **l'étape 3 du pipeline `EX-DATA-29` était inerte
 * dans toute l'application**, et avec elle la deuxième barrière `R3` sur le seul texte libre
 * conservé (`kind = contact` de la liste : « tel », « @ », « www. »…).
 *
 * Aucune fuite ne s'est produite sur les fixtures (propres par construction) ; le risque porte sur
 * toute source réelle. La sonde ci-dessous exerce les DEUX chargeurs — Node (`reference-fs.ts`) et
 * navigateur (`reference-loader.ts`, `fetch` simulé sur les mêmes fichiers du dépôt) — puis le
 * pipeline complet jusqu'à `cleanModelVersion`, pour qu'un retrait silencieux de l'un des deux
 * branchements redevienne rouge.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadReferenceDataFromDisk, readRawReferenceInputs } from '../../../src/orchestration/reference-fs';
import { fetchRawReferenceInputs } from '../../../src/orchestration/reference-loader';
import { buildReferenceData } from '../../../src/types/reference';
import { cleanModelVersion } from '../../../src/types/shared-rules';

const ROOT = process.cwd();
const REFERENCE_DIR = resolve(ROOT, 'data/reference');

/** Motifs du fichier versionné, lus ici SANS passer par le chargeur : c'est la vérité de référence. */
const rawStoplist = JSON.parse(readFileSync(resolve(REFERENCE_DIR, 'version-stoplist.json'), 'utf8')) as {
  entries: readonly { pattern: string; kind?: string }[];
};
const rawLexicon = JSON.parse(readFileSync(resolve(REFERENCE_DIR, 'version-lexicon.json'), 'utf8')) as {
  driveBadges: readonly string[];
};

describe('R-D8-3.5-01 — la liste d’arrêt EX-DATA-30 est CHARGÉE par les deux chargeurs (D3-21)', () => {
  it('chargeur Node (reference-fs) : versionStoplist et versionLexicon sont dans les entrées brutes', () => {
    const raw = readRawReferenceInputs();
    expect(raw.versionStoplist, 'version-stoplist.json non lu par reference-fs.ts').toBeDefined();
    expect(raw.versionStoplist?.entries.length).toBe(rawStoplist.entries.length);
    expect(raw.versionLexicon, 'version-lexicon.json non lu par reference-fs.ts').toBeDefined();
    expect(raw.versionLexicon?.driveBadges.length).toBe(rawLexicon.driveBadges.length);
  });

  it('chargeur Node : ReferenceData.versionStoplist / versionDriveBadges ne sont plus vides', () => {
    const ref = loadReferenceDataFromDisk();
    expect(ref.versionStoplist.length).toBeGreaterThan(0);
    expect(ref.versionDriveBadges.length).toBeGreaterThan(0);
    // La deuxième barrière R3 : les amorces de coordonnées de contact sont bien du lot.
    const contactPatterns = rawStoplist.entries.filter((e) => e.kind === 'contact').map((e) => e.pattern);
    expect(contactPatterns.length).toBeGreaterThan(0);
    for (const pattern of contactPatterns) expect(ref.versionStoplist).toContain(pattern);
  });

  it('chargeur navigateur (reference-loader) : les deux fichiers sont récupérés sous /reference', async () => {
    const seen: string[] = [];
    const original = globalThis.fetch;
    // `fetch` simulé sur les fichiers du dépôt : on prouve le CHEMIN du chargeur navigateur (les
    // URL qu'il demande et l'assemblage qu'il en fait), sans réseau (E5).
    globalThis.fetch = ((input: RequestInfo | URL): Promise<Response> => {
      const url = String(input);
      seen.push(url);
      const rel = url.replace(/^\/reference\//, '');
      const body = readFileSync(resolve(REFERENCE_DIR, rel), 'utf8');
      return Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }) as typeof globalThis.fetch;
    try {
      const raw = await fetchRawReferenceInputs();
      expect(seen).toContain('/reference/version-stoplist.json');
      expect(seen).toContain('/reference/version-lexicon.json');
      const ref = buildReferenceData(raw);
      expect(ref.versionStoplist.length).toBe(rawStoplist.entries.length);
      expect(ref.versionDriveBadges.length).toBe(rawLexicon.driveBadges.length);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('étape 3 d’EX-DATA-29 : une version porteuse d’un motif de la liste est NEUTRALISÉE', () => {
    const ref = loadReferenceDataFromDisk();
    const cleaned = cleanModelVersion('--- PROMO --- 1.4 Turbo', { stoplist: ref.versionStoplist });
    expect(cleaned).not.toMatch(/promo/i);
    expect(cleaned).toContain('1.4 Turbo');
    // Sans la liste (état d'avant D3-21), le marqueur SURVIT : la sonde dit ce qui changeait.
    expect(cleanModelVersion('--- PROMO --- 1.4 Turbo', { stoplist: [] })).toMatch(/PROMO/);
  });

  it('deuxième barrière R3 : une amorce de coordonnées est retirée du texte libre', () => {
    const ref = loadReferenceDataFromDisk();
    const cleaned = cleanModelVersion('1.2 TSI tel 0470 12 34 56', { stoplist: ref.versionStoplist });
    expect(cleaned.toLowerCase()).not.toMatch(/\btel\b/);
    expect(cleaned).toContain('1.2 TSI');
  });
});

afterEach(() => {
  // Aucun état global à défaire hors du `fetch` restauré dans son propre `finally`.
});
