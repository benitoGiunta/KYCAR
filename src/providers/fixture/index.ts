/**
 * KYCAR — Barrel du provider de fixtures (phase 3.3)
 * =================================================================================================
 * **Ne réexporte PAS `loaders/node.ts`** : ce module importe `node:fs` et n'a rien à faire dans le
 * graphe du bundle navigateur (leçon `HANDOFF.md` §7.7). Les tests l'importent par son chemin.
 */

export { FixtureDataProvider, FIXTURE_PROVIDER_VERSION, type FixtureProviderOptions } from './FixtureDataProvider';

export {
  FIXTURE_PROFILES,
  SUPPORTED_SCHEMA_VERSION,
  checkSchemaVersion,
  isFixtureProfile,
  isSnapshotManifest,
  selectSnapshot,
  type FixtureProfile,
  type FixtureProfileIndex,
  type FixtureSnapshotEntry,
  type GroundTruthEntry,
  type SchemaVersionVerdict,
  type SnapshotManifest,
} from './manifest';

export {
  DEFAULT_LISTINGS_FILE,
  FIXTURE_BASE,
  createHttpFixtureLoader,
  type HttpFixtureLoaderOptions,
} from './loaders/http';

export type { FixtureLoader } from './loaders/types';

export {
  looksGzipped,
  readNdjsonStream,
  type NdjsonReadOptions,
  type NdjsonReadResult,
} from './ndjson';

export {
  duplicateSignature,
  hasDuplicateValueConflict,
  preferCandidate,
  type DuplicateCandidate,
} from './dedupe';
