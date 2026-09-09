/**
 * KYCAR — Manifest d'un snapshot de fixtures et index d'un profil (phase 3.3)
 * =================================================================================================
 * Miroir typé de `data/schema/snapshot-manifest.schema.json` (D3-03), plus le contrôle de version
 * de schéma qu'`docs/data/DATA-MODEL.md` §6 impose au provider AVANT de lire la moindre ligne :
 *
 *   - **majeur inconnu** → REFUS d'ouverture, message explicite en fr-BE (`EX-NFR-28`), aucune ligne
 *     servie. Un schéma majeur inconnu peut avoir renommé ou retypé n'importe quel champ : servir
 *     « ce qu'on reconnaît » produirait des colonnes silencieusement vides, c'est-à-dire une valeur
 *     fabriquée.
 *   - **mineur supérieur** → acceptation AVEC avertissement : par construction, un mineur n'ajoute
 *     que de l'optionnel, que le provider ignore sans se tromper.
 *   - **mineur ou correctif inférieur** → acceptation sans réserve.
 *
 * Le `snapshotId` est un identifiant OPAQUE (interface gelée, `SnapshotId`) : le provider ne
 * l'interprète jamais. C'est ce qui le rend insensible à la forme retenue par le générateur —
 * `snapshot-manifest.schema.json` la contraint (`<marché>-<AAAAMMJJTHHmmssZ>`) alors que
 * `docs/data/dataset-spec/profiles.json` en annonce une autre (`be-fixture-<profil>-…`). Le
 * provider n'a pas à trancher : il lit, il ne décode pas. L'écart est remonté à `data-review`.
 */

/** Profil de volume (D3-01) : `test` est le profil de l'application, `dev` celui des tests. */
export type FixtureProfile = 'dev' | 'test' | 'perf';

/** Les trois profils, dans l'ordre croissant de volume. */
export const FIXTURE_PROFILES: readonly FixtureProfile[] = ['dev', 'test', 'perf'];

/** Vrai si `value` nomme un profil de fixtures. */
export function isFixtureProfile(value: string): value is FixtureProfile {
  return (FIXTURE_PROFILES as readonly string[]).includes(value);
}

/** Une anomalie déclarée en vérité terrain (`manifest.groundTruth`). */
export interface GroundTruthEntry {
  readonly listingId: string;
  readonly anomaly: string;
  readonly detail?: string;
  readonly peerListingId?: string;
  readonly expected?: Readonly<Record<string, unknown>>;
}

/** Manifest d'un snapshot, tel qu'il est déposé à côté de `listings.ndjson.gz`. */
export interface SnapshotManifest {
  readonly snapshotId: string;
  readonly capturedAt: string;
  readonly marketplace?: string;
  readonly profile: string;
  readonly seed: number;
  readonly schemaVersion: string;
  readonly generator?: { readonly name: string; readonly version: string };
  readonly file?: string;
  readonly listingCount: number;
  readonly sha256: string;
  readonly sha256Gz?: string;
  readonly uncompressedBytes?: number;
  readonly compressedBytes?: number;
  readonly previousSnapshotId?: string | null;
  readonly delta?: Readonly<Record<string, number>>;
  readonly groundTruth: readonly GroundTruthEntry[];
  readonly note?: string;
}

/** Une entrée de l'index d'un profil : de quoi choisir un snapshot sans lire tous les manifests. */
export interface FixtureSnapshotEntry {
  /** Identifiant opaque, tel qu'il figure dans le manifest. */
  readonly snapshotId: string;
  /** Nom du RÉPERTOIRE qui porte le snapshot — pas nécessairement l'identifiant. */
  readonly dir: string;
  /** `capturedAt` du manifest : c'est LUI qui ordonne les snapshots, jamais le nom du répertoire. */
  readonly capturedAt: string;
  readonly listingCount?: number;
  readonly file?: string;
}

/** Index d'un profil : la liste de ses snapshots, la plus récente en dernier. */
export interface FixtureProfileIndex {
  readonly profile: string;
  readonly snapshots: readonly FixtureSnapshotEntry[];
}

/** Version de schéma que ce provider implémente (`DATA-MODEL` §6 : `$id` et `x-kycar-schema-version`). */
export const SUPPORTED_SCHEMA_VERSION = '1.0.0';

/** Verdict du contrôle de version de schéma. */
export interface SchemaVersionVerdict {
  readonly accepted: boolean;
  /** Message fr-BE affichable tel quel (`EX-NFR-28`) quand le snapshot est refusé ou réservé. */
  readonly message: string | null;
}

function parseSemver(value: string): readonly [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (m === null) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Applique la règle de `DATA-MODEL` §6. Rend un VERDICT plutôt que de lever : c'est l'appelant
 * (le provider) qui décide de refuser l'ouverture, et il doit pouvoir citer le message.
 */
export function checkSchemaVersion(
  manifestVersion: string,
  supported: string = SUPPORTED_SCHEMA_VERSION,
): SchemaVersionVerdict {
  const got = parseSemver(manifestVersion);
  const mine = parseSemver(supported);
  if (got === null || mine === null) {
    return {
      accepted: false,
      message:
        `Version de schéma illisible dans le manifest (« ${manifestVersion} ») : ` +
        'le jeu de données ne peut pas être ouvert.',
    };
  }
  if (got[0] !== mine[0]) {
    return {
      accepted: false,
      message:
        `Jeu de données au schéma ${manifestVersion}, incompatible avec la version ${supported} ` +
        'que cette application sait lire. Aucune annonce n’a été chargée : un changement majeur de ' +
        'schéma peut avoir renommé ou retypé n’importe quel champ.',
    };
  }
  if (got[1] > mine[1]) {
    return {
      accepted: true,
      message:
        `Jeu de données au schéma ${manifestVersion}, plus récent que la version ${supported} lue ` +
        'par cette application : les champs ajoutés depuis sont ignorés.',
    };
  }
  return { accepted: true, message: null };
}

/**
 * Choisit un snapshot dans l'index : celui dont l'identifiant est demandé, ou — à défaut — le PLUS
 * RÉCENT au sens de `capturedAt` (jamais au sens du nom du répertoire, qui n'a pas à être ordonné).
 * Rend `null` si l'index est vide ou si l'identifiant demandé n'y figure pas : le provider en fait
 * un message, pas un repli silencieux sur un autre snapshot.
 */
export function selectSnapshot(
  index: FixtureProfileIndex,
  snapshotId?: string,
): FixtureSnapshotEntry | null {
  if (index.snapshots.length === 0) return null;
  if (snapshotId !== undefined) {
    return index.snapshots.find((s) => s.snapshotId === snapshotId || s.dir === snapshotId) ?? null;
  }
  let latest = index.snapshots[0] as FixtureSnapshotEntry;
  for (const entry of index.snapshots) {
    if (Date.parse(entry.capturedAt) > Date.parse(latest.capturedAt)) latest = entry;
  }
  return latest;
}

/** Contrôle de forme minimal d'un manifest lu depuis un fichier (aucun type ne survit au JSON). */
export function isSnapshotManifest(value: unknown): value is SnapshotManifest {
  if (value === null || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m['snapshotId'] === 'string' &&
    typeof m['capturedAt'] === 'string' &&
    typeof m['schemaVersion'] === 'string' &&
    typeof m['listingCount'] === 'number'
  );
}
