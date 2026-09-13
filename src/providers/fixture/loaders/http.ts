/**
 * KYCAR — Chargeur HTTP des fixtures (navigateur)
 * =================================================================================================
 * Récupère les fichiers servis sous `/fixtures/*` par le plugin Vite `kycar-fixture-data` (en DEV
 * comme dans `dist/`). Aucune dépendance à Node : c'est LE chargeur du bundle.
 *
 * Quatre requêtes par ouverture de snapshot, pas une de plus : l'index du profil, le manifest
 * allégé, les agrégats précalculés (`baseline.json`, `D3-31`), puis le flux d'annonces. L'index
 * évite de découvrir les snapshots en tâtonnant (une requête 404 par répertoire supposé), et le flux
 * n'est jamais matérialisé (`ndjson.ts`).
 *
 * **MÉMORISATION DES TROIS PETITS DOCUMENTS** (`D3-31`). Index, manifest et baseline sont des
 * fichiers IMMUABLES d'un jeu versionné : la réponse est mémorisée PAR URL, dans le chargeur. Deux
 * raisons, toutes deux mesurables :
 *
 *   1. le bootstrap (`main.tsx`) les demande AVANT que les référentiels soient assemblés, pour que
 *      le réseau travaille pendant que le processeur assemble la taxonomie ; quand `openSnapshot`
 *      les redemande, ils sont déjà là, et l'ouverture ne coûte plus une latence 4G de plus ;
 *   2. le cache HTTP ne suffit pas : la recette `EX-NFR-9` mesure cache VIDÉ ET DÉSACTIVÉ
 *      (`Network.setCacheDisabled`), et l'étiquette de provenance relit l'index du profil. Sans
 *      mémorisation en mémoire, ce serait un aller-retour complet de plus sur le chemin critique.
 *
 * Seules les réponses RÉUSSIES sont mémorisées : un échec réseau doit rester réessayable
 * (`EX-NFR-21`), jamais figé. Le flux d'annonces, lui, n'est JAMAIS mémorisé — un `ReadableStream`
 * se consomme une fois.
 *
 * E5 — aucun réseau hors de l'origine de l'application : les URL sont RELATIVES, jamais absolues.
 */

import { BASELINE_FILE } from '../baseline-artifact';
import { selectSnapshot, type FixtureProfileIndex } from '../manifest';
import type { FixtureLoader } from './types';

/** Base publique des fixtures, servie par le plugin Vite (dev) et copiée dans `dist/` (build). */
export const FIXTURE_BASE = '/fixtures';

/** Manifest ALLÉGÉ servi à l'application : le manifest sans sa vérité terrain (plugin Vite). */
export const LIGHT_MANIFEST = 'manifest.min.json';

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

  /** Réponses JSON déjà obtenues (documents immuables d'un jeu versionné). */
  const memo = new Map<string, Promise<unknown>>();

  /** Mémorise la réponse RÉUSSIE ; un échec est oublié pour rester réessayable. */
  const json = <T>(url: string): Promise<T> => {
    const known = memo.get(url);
    if (known !== undefined) return known as Promise<T>;
    const pending = (async (): Promise<unknown> => {
      const res = await doFetch(url);
      if (!res.ok) fail(url, res.status);
      return (await res.json()) as unknown;
    })().catch((e: unknown) => {
      memo.delete(url);
      throw e;
    });
    memo.set(url, pending);
    return pending as Promise<T>;
  };

  /**
   * Lecture TOLÉRANTE d'un document OPTIONNEL : rend `null` sur 404, sur une réponse illisible et
   * sur un corps qui n'est pas du JSON — un serveur de développement répond volontiers la coquille
   * de l'application (200, `text/html`) à un chemin inconnu, et cela ne doit surtout pas ressembler
   * à un artefact. Le provider en fait un repli, jamais un échec.
   */
  const optionalJson = (url: string): Promise<unknown> => {
    const known = memo.get(url);
    if (known !== undefined) return known;
    const pending = (async (): Promise<unknown> => {
      const res = await doFetch(url);
      if (!res.ok) return null;
      const type = res.headers.get('content-type') ?? '';
      if (type.length > 0 && !type.includes('json')) return null;
      try {
        return (await res.json()) as unknown;
      } catch {
        return null;
      }
    })().catch(() => {
      memo.delete(url);
      return null;
    });
    memo.set(url, pending);
    return pending;
  };

  return {
    origin: base,

    async loadProfileIndex(profile) {
      return json<FixtureProfileIndex>(`${base}/${profile}/index.json`);
    },

    async loadManifest(profile, entry) {
      // Le manifest ALLÉGÉ d'abord (le complet moins sa vérité terrain, écrit par le plugin Vite) :
      // sur le profil `test`, `manifest.json` pèse 501 Kio dont 2 436 anomalies déclarées que
      // l'application ne lit jamais, et il est sur le chemin critique d'`EX-NFR-9`. Repli sur le
      // manifest complet s'il n'existe pas — un jeu servi par un autre hébergeur reste lisible.
      const light = `${base}/${profile}/${entry.dir}/${LIGHT_MANIFEST}`;
      const known = memo.get(light);
      if (known !== undefined) return known;
      const res = await doFetch(light);
      if (res.ok) {
        const body = (await res.json()) as unknown;
        memo.set(light, Promise.resolve(body));
        return body;
      }
      return json<unknown>(`${base}/${profile}/${entry.dir}/manifest.json`);
    },

    async loadBaseline(profile, entry) {
      return optionalJson(`${base}/${profile}/${entry.dir}/${BASELINE_FILE}`);
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

/**
 * PRÉCHARGEMENT des trois petits documents d'un profil (`D3-31`, cause (b) de `C-3.5-01` : « les
 * 15 référentiels finissent vers 1 250 ms et le snapshot ne commence qu'ensuite »).
 *
 * Appelé au tout début du bootstrap, il met le réseau au travail pendant que les référentiels sont
 * téléchargés et assemblés ; comme le chargeur MÉMORISE ces réponses, `openSnapshot` les retrouve
 * sans un aller-retour de plus. Ne LÈVE jamais : un préchargement raté n'est qu'un préchargement
 * raté — l'ouverture réelle refera la demande et, elle, dira ce qui manque.
 *
 * Rend le nombre de snapshots du profil (l'étiquette de provenance `EX-DATA-107` l'affiche), ou
 * `null` si l'index n'a pas pu être lu — jamais un chiffre inventé.
 */
export async function warmFixtureMeta(loader: FixtureLoader, profile: string): Promise<number | null> {
  try {
    const index = await loader.loadProfileIndex(profile);
    const entry = selectSnapshot(index);
    if (entry !== null) {
      await Promise.all([
        loader.loadManifest(profile, entry),
        loader.loadBaseline?.(profile, entry) ?? Promise.resolve(null),
      ]);
    }
    return index.snapshots.length;
  } catch {
    return null;
  }
}
