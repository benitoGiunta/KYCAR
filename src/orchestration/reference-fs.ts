/**
 * KYCAR — Chargeur de référentiels côté Node (tests d'intégration D8 uniquement)
 * =================================================================================================
 * Pendant de `reference-loader.ts` (fetch navigateur) pour l'environnement de test vitest (node) : il
 * lit les mêmes JSON depuis `data/reference/` sur le disque et assemble le `RawReferenceInputs` de D2.
 * N'est JAMAIS importé par le bundle navigateur (il importe `node:fs`) — réservé aux `*.test.ts`.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildReferenceData, type RawReferenceFile, type RawReferenceInputs, type ReferenceData } from '../types/reference';
import { REQUIRED_REFERENCE_FILES } from './reference-loader';

const REFERENCE_DIR = resolve(process.cwd(), 'data/reference');

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(REFERENCE_DIR, rel), 'utf-8')) as T;
}

/** Assemble les entrées brutes des référentiels depuis `data/reference/` (disque). */
export function readRawReferenceInputs(): RawReferenceInputs {
  const taxonomy = readJson<RawReferenceInputs['taxonomy']>('taxonomy.json');
  const filters = readJson<RawReferenceInputs['filters']>('filters.json');
  const filtersScope = readJson<RawReferenceInputs['filtersScope']>('filters-scope.json');
  const referenceFiles: Record<string, RawReferenceFile> = {};
  for (const name of REQUIRED_REFERENCE_FILES) {
    const file = readJson<RawReferenceFile>(`references/${name}.json`);
    referenceFiles[file.referenceType ?? name] = file;
  }
  return { taxonomy, filters, filtersScope, referenceFiles };
}

/** Construit la structure de référence typée (D2) à partir du disque, pour les tests. */
export function loadReferenceDataFromDisk(): ReferenceData {
  return buildReferenceData(readRawReferenceInputs());
}
