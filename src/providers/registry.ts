/**
 * KYCAR — Registre des providers et bascule par paramètre (phase 3.3, PLAN-3 §3.3)
 * =================================================================================================
 * **DF-2 du PLAN-3** : « brancher une autre source = écrire un adaptateur, sans toucher au moteur ni
 * aux écrans ; la bascule de provider est un paramètre, pas une recompilation. » Ce module est la
 * moitié « paramètre » de cette phrase ; l'autre moitié est `src/providers/adapters/`.
 *
 * PRIORITÉ DE RÉSOLUTION, dans cet ordre :
 *
 *   1. le paramètre d'URL `?provider=<spec>` — le plus explicite, et le seul qui se partage dans un
 *      lien ; il l'emporte donc sur tout le reste ;
 *   2. la variable de build `VITE_KYCAR_PROVIDER` — le choix d'un déploiement ;
 *   3. le DÉFAUT `fixture:test` (D3-01) — trois snapshots de 20 000 annonces fictives.
 *
 * **Une spécification inconnue ne casse rien et ne se tait pas** : on retombe sur le défaut ET on
 * écrit un avertissement dans la `coverageNote` du snapshot, que la coquille affiche déjà. C'est la
 * règle D-03 appliquée à la sélection de source : jamais appliqué en silence, jamais ignoré en
 * silence — et cela n'exige AUCUNE retouche d'`app.tsx`.
 *
 * `tweedehands` figure au registre mais n'est PAS câblé : `D-18` / `DR-104` interdisent de brancher
 * le provider réel tant qu'`AC-01` n'est pas levée. Le registre le DIT plutôt que de faire semblant
 * de l'ignorer — un choix explicite refusé avec son motif vaut mieux qu'une entrée absente.
 */

import type { DataProvider, SourceKind } from './DataProvider';
import type { ReferenceData } from '../types/reference';
import { SyntheticDataProvider } from './synthetic/SyntheticDataProvider';
import { FixtureDataProvider } from './fixture/FixtureDataProvider';
import { createHttpFixtureLoader } from './fixture/loaders/http';
import type { FixtureLoader } from './fixture/loaders/types';
import type { FixtureProfile } from './fixture/manifest';

/** Les spécifications de source reconnues. */
export type ProviderSpec = 'fixture:test' | 'fixture:dev' | 'fixture:perf' | 'synthetic' | 'tweedehands';

/** Spécification par défaut de l'application (D3-01). */
export const DEFAULT_PROVIDER_SPEC: ProviderSpec = 'fixture:test';

/** Nom du paramètre d'URL de bascule. */
export const PROVIDER_URL_PARAM = 'provider';

/** Nom de la variable d'environnement de build. */
export const PROVIDER_ENV_VAR = 'VITE_KYCAR_PROVIDER';

/** Ce que le registre SAIT d'une source, avant même de l'instancier. */
export interface ProviderRegistryEntry {
  readonly spec: ProviderSpec;
  /** Libellé fr-BE, affichable tel quel. */
  readonly label: string;
  readonly sourceKind: SourceKind;
  /** Sert-elle le mode 2 (distributions fines) ? */
  readonly servesMode2: boolean;
  /** Est-elle CÂBLABLE aujourd'hui ? `false` = refusée avec son motif, jamais silencieusement. */
  readonly wired: boolean;
  /** Motif de non-câblage, ou précision utile. */
  readonly note: string;
}

/**
 * Le registre. Une ligne par source ; **ajouter une source, c'est ajouter une ligne ici et un
 * adaptateur dans `src/providers/adapters/`** — rien d'autre ne bouge.
 */
export const PROVIDER_REGISTRY: readonly ProviderRegistryEntry[] = [
  {
    spec: 'fixture:test',
    label: 'Fixtures — profil test (3 x 20 000 annonces fictives)',
    sourceKind: 'FIXTURE',
    servesMode2: true,
    wired: true,
    note: 'Source par défaut de l’application (D3-01).',
  },
  {
    spec: 'fixture:dev',
    label: 'Fixtures — profil dev (3 x 5 000 annonces fictives)',
    sourceKind: 'FIXTURE',
    servesMode2: true,
    wired: true,
    note: 'Profil réduit : ouverture rapide, utilisé par les tests et la mise au point.',
  },
  {
    spec: 'fixture:perf',
    label: 'Fixtures — profil perf (3 x 100 000 annonces fictives)',
    sourceKind: 'FIXTURE',
    servesMode2: true,
    wired: true,
    note: 'Profil des bancs de performance. Non commité : à générer avant usage (npm run data:gen).',
  },
  {
    spec: 'synthetic',
    label: 'Jeu synthétique généré à la volée (100 000 annonces)',
    sourceKind: 'SYNTHETIC',
    servesMode2: true,
    wired: true,
    note: 'Conservé pour les bancs et comme repli de mode 2 (EX-DATA-107, D3-04).',
  },
  {
    spec: 'tweedehands',
    label: '2dehands — marché réel, agrégats seuls',
    sourceKind: 'REAL',
    servesMode2: false,
    wired: false,
    note:
      'NON CÂBLÉ : D-18 / DR-104 interdisent de brancher le provider réel tant que la contrainte ' +
      'AC-01 n’est pas levée. Le mode 2 y est de toute façon indisponible (échantillon biaisé par ' +
      'la publicité).',
  },
];

/** Index du registre par spécification. */
export const PROVIDER_BY_SPEC: ReadonlyMap<ProviderSpec, ProviderRegistryEntry> = new Map(
  PROVIDER_REGISTRY.map((e) => [e.spec, e]),
);

/** Vrai si `value` nomme une spécification du registre. */
export function isProviderSpec(value: string): value is ProviderSpec {
  return PROVIDER_BY_SPEC.has(value as ProviderSpec);
}

/** Résultat de la résolution d'une spécification, avant instanciation. */
export interface ResolvedSpec {
  /** Spécification RETENUE (après repli éventuel). */
  readonly spec: ProviderSpec;
  /** Ce qui avait été demandé, tel quel, ou `null` si rien ne l'avait été. */
  readonly requested: string | null;
  /** D'où venait la demande retenue. */
  readonly origin: 'url' | 'env' | 'default';
  /** Vrai si la demande a été refusée et remplacée par le défaut. */
  readonly fellBack: boolean;
  /** Message fr-BE expliquant le repli, ou `null`. */
  readonly warning: string | null;
}

/** Sources d'une résolution : la chaîne de recherche de l'URL et l'environnement de build. */
export interface ResolveSpecInputs {
  /** `window.location.search`, ou une chaîne équivalente. */
  readonly search?: string | null;
  /** `import.meta.env`, ou un objet équivalent. */
  readonly env?: Readonly<Record<string, string | undefined>> | null;
}

/**
 * Applique la priorité `?provider=` > `VITE_KYCAR_PROVIDER` > défaut, et le repli explicite sur une
 * spécification inconnue ou non câblée.
 */
export function resolveProviderSpec(inputs: ResolveSpecInputs = {}): ResolvedSpec {
  const fromUrl = readUrlParam(inputs.search ?? null);
  const fromEnv = (inputs.env ?? {})[PROVIDER_ENV_VAR] ?? null;
  const requested = fromUrl ?? fromEnv;
  const origin: ResolvedSpec['origin'] = fromUrl !== null ? 'url' : fromEnv !== null ? 'env' : 'default';

  if (requested === null) {
    return { spec: DEFAULT_PROVIDER_SPEC, requested: null, origin, fellBack: false, warning: null };
  }
  if (!isProviderSpec(requested)) {
    return {
      spec: DEFAULT_PROVIDER_SPEC,
      requested,
      origin,
      fellBack: true,
      warning:
        `Source de données « ${requested} » inconnue : l’application est revenue à la source par ` +
        `défaut (${DEFAULT_PROVIDER_SPEC}). Sources reconnues : ` +
        `${PROVIDER_REGISTRY.map((e) => e.spec).join(', ')}.`,
    };
  }
  const entry = PROVIDER_BY_SPEC.get(requested) as ProviderRegistryEntry;
  if (!entry.wired) {
    return {
      spec: DEFAULT_PROVIDER_SPEC,
      requested,
      origin,
      fellBack: true,
      warning:
        `Source de données « ${requested} » non branchée : ${entry.note} L’application est revenue ` +
        `à la source par défaut (${DEFAULT_PROVIDER_SPEC}).`,
    };
  }
  return { spec: requested, requested, origin, fellBack: false, warning: null };
}

/** Lit `?provider=` dans une chaîne de recherche, sans dépendre de `window`. */
function readUrlParam(search: string | null): string | null {
  if (search === null || search.length === 0) return null;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const value = params.get(PROVIDER_URL_PARAM);
  return value === null || value.trim().length === 0 ? null : value.trim();
}

/** Options d'instanciation. */
export interface ResolveProviderOptions extends ResolveSpecInputs {
  readonly referenceData: ReferenceData;
  /** Accès aux fichiers de fixtures ; défaut : le chargeur HTTP (`/fixtures`). */
  readonly fixtureLoader?: FixtureLoader;
  /** Snapshot explicite d'un profil de fixtures (à défaut, le plus récent). */
  readonly snapshotId?: string;
  /** Force la spécification, en ignorant l'URL et l'environnement (tests, bancs). */
  readonly forceSpec?: ProviderSpec;
}

/** Provider instancié, avec la trace de ce qui a été demandé et de ce qui a été retenu. */
export interface ResolvedProvider extends ResolvedSpec {
  readonly provider: DataProvider;
  readonly entry: ProviderRegistryEntry;
}

/**
 * Instancie le provider désigné par la spécification résolue.
 *
 * L'avertissement de repli est transmis au provider de fixtures par `coverageWarning`, donc écrit
 * dans la `coverageNote` du `SnapshotDescriptor` : il remonte jusqu'à l'utilisateur par le chemin
 * qui existe déjà, sans toucher à `app.tsx` ni aux écrans.
 */
export function resolveProvider(options: ResolveProviderOptions): ResolvedProvider {
  const resolved =
    options.forceSpec === undefined
      ? resolveProviderSpec(options)
      : { spec: options.forceSpec, requested: options.forceSpec, origin: 'default' as const, fellBack: false, warning: null };
  const entry = PROVIDER_BY_SPEC.get(resolved.spec) as ProviderRegistryEntry;

  if (resolved.spec === 'synthetic') {
    return {
      ...resolved,
      entry,
      provider: new SyntheticDataProvider({ referenceData: options.referenceData }),
    };
  }

  const profile = resolved.spec.slice('fixture:'.length) as FixtureProfile;
  return {
    ...resolved,
    entry,
    provider: new FixtureDataProvider({
      referenceData: options.referenceData,
      profile,
      loader: options.fixtureLoader ?? createHttpFixtureLoader(),
      snapshotId: options.snapshotId,
      coverageWarning: resolved.warning,
    }),
  };
}
