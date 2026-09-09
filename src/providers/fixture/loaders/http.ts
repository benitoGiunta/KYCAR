/**
 * KYCAR — Chargeur HTTP des fixtures (navigateur)
 * =================================================================================================
 * Récupère les fichiers servis sous `/fixtures/*` par le plugin Vite `kycar-fixture-data` (en DEV
 * comme dans `dist/`). Aucune dépendance à Node : c'est LE chargeur du bundle.
 *
 * Trois requêtes par ouverture de snapshot, pas une de plus : l'index du profil, le manifest, puis
 * le flux d'annonces. L'index évite de découvrir les snapshots en tâtonnant (une requête 404 par
 * répertoire supposé), et le flux n'est jamais matérialisé (`ndjson.ts`).
 *
 * E5 — aucun réseau hors de l'origine de l'application : les URL sont RELATIVES, jamais absolues.
 */

import type { FixtureProfileIndex } from '../manifest';
import type { FixtureLoader } from './types';

/** Base publique des fixtures, servie par le plugin Vite (dev) et copiée dans `dist/` (build). */
export const FIXTURE_BASE = '/fixtures';

/** Nom par défaut du fichier d'annonces d'un snapshot (`manifest.file` prime quand il est là). */
export const DEFAULT_LISTINGS_FILE = 'listings.ndjson.gz';

/** Options du chargeur HTTP. */
export interface HttpFixtureLoaderOptions {
  /** Base des fixtures (défaut `/fixtures`). Relative, toujours. */
  readonly base?: string;
  /** Injection pour les tests ; défaut : le `fetch` global. */
  readonly fetchImpl?: typeof fetch;
}

function fail(url: string, status: number): never {
  throw new Error(
    `Jeu de données indisponible (${status}) : ${url}. Vérifiez que les fixtures sont bien servies ` +
      'sous /fixtures (plugin kycar-fixture-data).',
  );
}

/** Construit un chargeur HTTP des fixtures. */
export function createHttpFixtureLoader(options: HttpFixtureLoaderOptions = {}): FixtureLoader {
  const base = options.base ?? FIXTURE_BASE;
  const doFetch = options.fetchImpl ?? ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init));

  const json = async <T>(url: string): Promise<T> => {
    const res = await doFetch(url);
    if (!res.ok) fail(url, res.status);
    return (await res.json()) as T;
  };

  return {
    origin: base,

    async loadProfileIndex(profile) {
      return json<FixtureProfileIndex>(`${base}/${profile}/index.json`);
    },

    async loadManifest(profile, entry) {
      return json<unknown>(`${base}/${profile}/${entry.dir}/manifest.json`);
    },

    async openListings(profile, entry) {
      const file = entry.file ?? DEFAULT_LISTINGS_FILE;
      const url = `${base}/${profile}/${entry.dir}/${file}`;
      const res = await doFetch(url);
      if (!res.ok) fail(url, res.status);
      if (res.body === null) {
        throw new Error(`Jeu de données vide : ${url} (réponse sans corps).`);
      }
      return res.body;
    },
  };
}
