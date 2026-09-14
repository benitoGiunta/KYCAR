/**
 * KYCAR — Fixtures partagées des vérifications D4 (lot D4)
 * =================================================================================================
 * Utilitaire de TEST/BANC (jamais importé par le runtime) : charge les VRAIS référentiels du dépôt
 * via `import.meta.glob` (même mécanisme que `reference.test.ts` / `synthetic.test.ts`), et instancie
 * le `SyntheticDataProvider` de D3 comme source de données réaliste pour la jonction D3↔D4.
 *
 * Vit dans `src/engine/` (le lot D4 n'écrit que sous son propre dossier). Aucun barrel partagé touché.
 */

import {
  buildReferenceData,
  type RawFilters,
  type RawFiltersScope,
  type RawReferenceFile,
  type RawTaxonomy,
  type RawVersionLexicon,
  type RawVersionStoplist,
  type ReferenceData,
} from '../types/reference';
import { SyntheticDataProvider } from '../providers/synthetic/SyntheticDataProvider';

const taxonomyMod = import.meta.glob('../../data/reference/taxonomy.json', { eager: true, import: 'default' });
const filtersMod = import.meta.glob('../../data/reference/filters.json', { eager: true, import: 'default' });
const scopeMod = import.meta.glob('../../data/reference/filters-scope.json', { eager: true, import: 'default' });
const refMods = import.meta.glob('../../data/reference/references/*.json', { eager: true, import: 'default' });
const stoplistMod = import.meta.glob('../../data/reference/version-stoplist.json', { eager: true, import: 'default' });
const lexiconMod = import.meta.glob('../../data/reference/version-lexicon.json', { eager: true, import: 'default' });

/** Assemble les référentiels D2 à partir des fichiers du dépôt. */
export function loadReferenceData(): ReferenceData {
  const taxonomy = Object.values(taxonomyMod)[0] as RawTaxonomy;
  const filters = Object.values(filtersMod)[0] as RawFilters;
  const filtersScope = Object.values(scopeMod)[0] as RawFiltersScope;
  const referenceFiles: Record<string, RawReferenceFile> = {};
  for (const [path, mod] of Object.entries(refMods)) {
    if (path.endsWith('_index.json')) continue;
    const file = mod as RawReferenceFile;
    referenceFiles[file.referenceType] = file;
  }
  return buildReferenceData({
    taxonomy,
    referenceFiles,
    filters,
    filtersScope,
    versionStoplist: Object.values(stoplistMod)[0] as RawVersionStoplist,
    versionLexicon: Object.values(lexiconMod)[0] as RawVersionLexicon,
  });
}

/** Ouvre un provider synthétique D3 déjà chargé (dataset généré, vérité terrain disponible). */
export async function openSyntheticProvider(
  ref: ReferenceData,
  listingCount: number,
  seed = 7,
): Promise<SyntheticDataProvider> {
  const provider = new SyntheticDataProvider({ referenceData: ref, listingCount, seed });
  await provider.openSnapshot();
  return provider;
}

/** Percentile (type 7 arrondi bas, suffisant pour un rapport de latence) d'un tableau de durées. */
export function percentile(samplesMs: readonly number[], p: number): number {
  const sorted = [...samplesMs].sort((a, b) => a - b);
  if (sorted.length === 0) return NaN;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx] as number;
}
