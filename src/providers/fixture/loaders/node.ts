/**
 * KYCAR — Chargeur disque des fixtures (Node / vitest UNIQUEMENT)
 * =================================================================================================
 * **CE MODULE IMPORTE `node:fs` ET NE DOIT JAMAIS ENTRER DANS LE BUNDLE NAVIGATEUR** (leçon
 * `HANDOFF.md` §7.7, pendant de `src/orchestration/reference-fs.ts`). Il n'est réexporté par AUCUN
 * barrel de production : seuls des fichiers de test l'importent, par son chemin.
 *
 * Il sert le MÊME contrat `FixtureLoader` que le chargeur HTTP, donc le même code d'adaptation, de
 * dédoublonnage et d'agrégation tourne sous vitest et dans le navigateur. Deux chemins de
 * chargement différents auraient rendu chaque sonde verte incapable de dire quoi que ce soit de
 * l'application.
 *
 * L'index d'un profil est LU s'il existe (`<profil>/index.json`, écrit par le générateur ou par le
 * plugin Vite) et SYNTHÉTISÉ sinon, en parcourant les répertoires et en lisant leur `capturedAt` —
 * exactement ce que fait le plugin. Le provider ne dépend donc pas de la présence d'un fichier que
 * `dataset-gen` n'a peut-être pas prévu.
 */

import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { resolve } from 'node:path';

import type { FixtureProfileIndex, FixtureSnapshotEntry } from '../manifest';
import { DEFAULT_LISTINGS_FILE } from './http';
import type { FixtureLoader } from './types';

/** Racine des fixtures sur disque (défaut : `data/fixtures` du dépôt). */
export const DEFAULT_FIXTURE_ROOT = 'data/fixtures';

/** Construit un chargeur disque. `root` est absolu, ou relatif au répertoire de travail. */
export function createNodeFixtureLoader(root: string = DEFAULT_FIXTURE_ROOT): FixtureLoader {
  const abs = resolve(process.cwd(), root);
  return {
    origin: abs,

    loadProfileIndex(profile) {
      return Promise.resolve(buildProfileIndexFromDisk(abs, profile));
    },

    loadManifest(profile, entry) {
      const path = resolve(abs, profile, entry.dir, 'manifest.json');
      return Promise.resolve(JSON.parse(readFileSync(path, 'utf-8')) as unknown);
    },

    openListings(profile, entry) {
      const file = entry.file ?? DEFAULT_LISTINGS_FILE;
      const path = resolve(abs, profile, entry.dir, file);
      if (!existsSync(path)) {
        throw new Error(`Fichier d'annonces introuvable : ${path}`);
      }
      // `Readable.toWeb` rend un `ReadableStream` du DOM : le provider lit exactement le même type
      // de flux que celui d'une réponse `fetch`.
      return Promise.resolve(Readable.toWeb(createReadStream(path)) as ReadableStream<Uint8Array>);
    },
  };
}

/**
 * Index d'un profil, lu depuis `<profil>/index.json` s'il existe, sinon reconstruit en lisant le
 * `manifest.json` de chaque sous-répertoire. Les snapshots sont rendus triés par `capturedAt`
 * CROISSANT : « le plus récent » est le dernier, quel que soit le nom des répertoires.
 */
export function buildProfileIndexFromDisk(root: string, profile: string): FixtureProfileIndex {
  const dir = resolve(root, profile);
  if (!existsSync(dir)) {
    throw new Error(
      `Profil de fixtures « ${profile} » absent de ${root}. Générez-le (npm run data:gen) ou ` +
        'choisissez un autre profil.',
    );
  }
  const published = resolve(dir, 'index.json');
  if (existsSync(published)) {
    const parsed = JSON.parse(readFileSync(published, 'utf-8')) as FixtureProfileIndex;
    if (Array.isArray(parsed.snapshots)) return parsed;
  }
  const snapshots: FixtureSnapshotEntry[] = [];
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
      listingCount: typeof m['listingCount'] === 'number' ? m['listingCount'] : undefined,
      file: typeof m['file'] === 'string' ? m['file'] : undefined,
    });
  }
  snapshots.sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
  return { profile, snapshots };
}
