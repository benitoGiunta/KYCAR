/**
 * KYCAR — SONDE DE CONTRAT de l'artefact d'agrégats précalculés (phase 3.5, `D3-31`)
 * =================================================================================================
 * Constat corrigé : `C-3.5-01` (`reports/remediation-2.8/mvp-integrate.md` §7.2) — sur le build de
 * production, en 4G simulée, l'écran A affichait son PREMIER CHIFFRE à 7 800 ms pour un budget
 * `EX-NFR-9` de 2 000 ms, parce que 2 677 Kio gzip d'annonces devaient être téléchargés ET ingérés
 * avant le moindre agrégat.
 *
 * La correction consiste à servir des agrégats mode 1 PRÉCALCULÉS (`baseline.json`) et à DIFFÉRER
 * les annonces. Un précalcul est une promesse : « ces chiffres sont ceux que le calcul complet
 * donnerait ». Cette sonde est ce qui rend la promesse vérifiable, sur quatre points :
 *
 *   1. **FIDÉLITÉ** — pour chaque snapshot COMMITÉ, l'artefact est identique, au bit près, à ce que
 *      `aggregateByMake(batch, null, 1)` calcule sur le lot réellement ingéré. C'est la sonde qui
 *      empêche l'optimisation de devenir une source de chiffres parallèle.
 *   2. **ANTÉRIORITÉ** — la baseline est servie AVANT que la première ligne d'annonce soit lue. Le
 *      chargeur est instrumenté : si le flux NDJSON avait déjà été consommé, le gain mesuré en 4G
 *      n'existerait pas.
 *   3. **REPLI** — sans artefact, tout fonctionne comme avant (mêmes valeurs), et la `coverageNote`
 *      le DIT. Un jeu servi par un autre hébergeur reste lisible.
 *   4. **REFUS** — un artefact qui ne correspond pas à ses octets est refusé AVANT de servir quoi
 *      que ce soit ; un artefact cohérent en apparence mais DÉMENTI par les annonces met le jeu en
 *      erreur explicite. Dans les deux cas, aucune valeur fausse n'est jamais affichée.
 *
 * Aucune I/O réseau (E5) : tout se lit sur disque, les cas 3 et 4 dans un mini-jeu temporaire.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { MakeAggregate } from '../../src/providers/DataProvider';
import { FixtureDataProvider } from '../../src/providers/fixture/FixtureDataProvider';
import {
  BASELINE_FILE,
  diffBaseline,
  isBaselineArtifact,
  type SnapshotBaselineArtifact,
} from '../../src/providers/fixture/baseline-artifact';
import { createNodeFixtureLoader, buildProfileIndexFromDisk } from '../../src/providers/fixture/loaders/node';
import type { FixtureLoader } from '../../src/providers/fixture/loaders/types';
import type { FixtureProfile } from '../../src/providers/fixture/manifest';
import { aggregateByMake } from '../../src/providers/synthetic/aggregate';
import { runBaseline } from '../../tools/dataset/baseline';
import { buildMiniFixtures, MINI_LATEST_SNAPSHOT_ID, MINI_PROFILE } from './fixtures/mini';
import { referenceData } from './subjects';

/** Racine des fixtures du dépôt. */
const FIXTURE_ROOT = resolve(process.cwd(), 'data/fixtures');

/** Les profils COMMITÉS que la sonde de fidélité exerce (le profil `perf` n'est pas commité). */
const COMMITTED_PROFILES: readonly FixtureProfile[] = ['dev', 'test'];

/** Provider sur un jeu disque, avec ou sans lecture de l'artefact. */
function providerOn(
  root: string,
  profile: FixtureProfile,
  snapshotId: string,
  options: { readonly useBaselineArtifact?: boolean; readonly loader?: FixtureLoader } = {},
): FixtureDataProvider {
  return new FixtureDataProvider({
    referenceData: referenceData(),
    profile,
    loader: options.loader ?? createNodeFixtureLoader(root),
    snapshotId,
    ...(options.useBaselineArtifact === undefined ? {} : { useBaselineArtifact: options.useBaselineArtifact }),
  });
}

/** Lit l'artefact commité d'un snapshot, en exigeant sa forme. */
function readArtifact(root: string, profile: string, dir: string): SnapshotBaselineArtifact {
  const path = resolve(root, profile, dir, BASELINE_FILE);
  const parsed = JSON.parse(readFileSync(path, 'utf-8')) as unknown;
  expect(isBaselineArtifact(parsed), `${profile}/${dir}/${BASELINE_FILE} a la forme attendue`).toBe(true);
  return parsed as SnapshotBaselineArtifact;
}

/* ================================================================================================
 * 1. FIDÉLITÉ — l'artefact commité EST le calcul complet
 * ============================================================================================== */

describe('D3-31 — les agrégats précalculés sont ceux du calcul complet', () => {
  for (const profile of COMMITTED_PROFILES) {
    it(`profil ${profile} : chaque baseline.json commité est identique au recalcul sur les annonces`, async () => {
      if (!existsSync(resolve(FIXTURE_ROOT, profile))) {
        // Un profil absent de l'arbre ne peut pas être prouvé — et ne doit pas être supposé.
        expect(existsSync(resolve(FIXTURE_ROOT, profile)), `profil ${profile} présent`).toBe(false);
        return;
      }
      const index = buildProfileIndexFromDisk(FIXTURE_ROOT, profile);
      expect(index.snapshots.length, `${profile} : snapshots trouvés`).toBeGreaterThan(0);

      for (const entry of index.snapshots) {
        const artifact = readArtifact(FIXTURE_ROOT, profile, entry.dir);
        // Le chemin d'ingestion COMPLÈTE, celui-là même qui servait avant `D3-31`.
        const provider = providerOn(FIXTURE_ROOT, profile, entry.snapshotId, { useBaselineArtifact: false });
        const handle = await provider.openSnapshot();
        const batch = await provider.whenIngested();
        const recomputed = {
          rows: aggregateByMake(batch, null, 1),
          selectionCount: batch.rowCount,
          ingest: provider.getIngestSummary(),
        };

        expect(
          diffBaseline(artifact, recomputed),
          `${profile}/${entry.dir} : artefact identique au recalcul`,
        ).toBeNull();
        // Et le lien aux OCTETS, qui est ce qui rend l'égalité ci-dessus opposable au fil du temps.
        expect(artifact.producedFrom.sha256).toBe(provider.getManifest().sha256);
        expect(artifact.snapshotId).toBe(handle.descriptor.snapshotId);
        expect(artifact.selectionCount).toBe(handle.descriptor.listingCount);
      }
    });
  }

  it('les DEUX chemins d’ouverture rendent le même descripteur et la même baseline', async () => {
    const profile: FixtureProfile = 'dev';
    if (!existsSync(resolve(FIXTURE_ROOT, profile))) return;
    const entry = buildProfileIndexFromDisk(FIXTURE_ROOT, profile).snapshots.at(-1);
    expect(entry, 'un snapshot dev').toBeDefined();
    const id = (entry as { snapshotId: string }).snapshotId;

    const fast = providerOn(FIXTURE_ROOT, profile, id);
    const full = providerOn(FIXTURE_ROOT, profile, id, { useBaselineArtifact: false });
    const hf = await fast.openSnapshot();
    const hc = await full.openSnapshot();

    // Tout ce que l'écran affiche vient du descripteur : il ne doit pas dépendre du chemin.
    const comparable = (d: typeof hf.descriptor): unknown => ({ ...d, coverageNote: undefined });
    expect(comparable(hf.descriptor)).toStrictEqual(comparable(hc.descriptor));
    expect((await fast.fetchBaselineAggregates(hf)).rows).toStrictEqual(
      (await full.fetchBaselineAggregates(hc)).rows,
    );
    // La note, elle, DIFFÈRE — et c'est voulu : elle dit par quel chemin les chiffres sont arrivés.
    expect(hf.descriptor.coverageNote).toMatch(/PRÉCALCULÉS/);
    expect(hc.descriptor.coverageNote).toMatch(/NON précalculés/);
  });
});

/* ================================================================================================
 * 2. ANTÉRIORITÉ — la baseline est servie avant que les annonces soient lues
 * ============================================================================================== */

/** Chargeur qui RETIENT le flux d'annonces jusqu'à `release()`, et compte les octets lus. */
function gatedLoader(inner: FixtureLoader): {
  readonly loader: FixtureLoader;
  release(): void;
  bytesRead(): number;
} {
  let open!: () => void;
  const gate = new Promise<void>((r) => {
    open = r;
  });
  let bytes = 0;
  const loader: FixtureLoader = {
    ...inner,
    async openListings(profile, entry) {
      const source = await inner.openListings(profile, entry);
      const reader = source.getReader();
      return new ReadableStream<Uint8Array>({
        async pull(controller) {
          await gate;
          const { done, value } = await reader.read();
          if (done || value === undefined) {
            controller.close();
            return;
          }
          bytes += value.byteLength;
          controller.enqueue(value);
        },
      });
    },
  };
  return { loader, release: () => open(), bytesRead: () => bytes };
}

describe('D3-31 — les annonces sont différées, la baseline ne l’est pas', () => {
  it('fetchBaselineAggregates répond alors que PAS UN OCTET d’annonce n’a été lu', async () => {
    const profile: FixtureProfile = 'dev';
    if (!existsSync(resolve(FIXTURE_ROOT, profile))) return;
    const entry = buildProfileIndexFromDisk(FIXTURE_ROOT, profile).snapshots.at(-1) as { snapshotId: string };
    const gate = gatedLoader(createNodeFixtureLoader(FIXTURE_ROOT));
    const provider = providerOn(FIXTURE_ROOT, profile, entry.snapshotId, { loader: gate.loader });

    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);

    // C'EST LE POINT : l'écran A a ses chiffres, et le fichier d'annonces n'a pas commencé à être lu.
    expect(gate.bytesRead(), 'octets d’annonces lus quand la baseline est servie').toBe(0);
    expect(baseline.rows.length, 'la baseline servie porte des marques').toBeGreaterThan(0);
    expect(baseline.selectionCount).toBe(handle.descriptor.listingCount);
    expect(provider.getLastIngestMs(), 'ingestion non terminée à la sortie d’openSnapshot').toBeNull();

    // Puis les annonces arrivent, et le mode 2 devient disponible sans rien changer aux chiffres.
    gate.release();
    const batch = await provider.whenIngested();
    expect(gate.bytesRead()).toBeGreaterThan(0);
    expect(batch.rowCount).toBe(baseline.selectionCount);
    expect(provider.getLastIngestMs()).not.toBeNull();
    expect(await provider.fetchBaselineAggregates(handle), '§9.3 garde-fou 1 : le MÊME objet').toBe(baseline);
  });

  it('une demande de mode 2 ATTEND les annonces au lieu de rendre un lot vide', async () => {
    const profile: FixtureProfile = 'dev';
    if (!existsSync(resolve(FIXTURE_ROOT, profile))) return;
    const entry = buildProfileIndexFromDisk(FIXTURE_ROOT, profile).snapshots.at(-1) as { snapshotId: string };
    const gate = gatedLoader(createNodeFixtureLoader(FIXTURE_ROOT));
    const provider = providerOn(FIXTURE_ROOT, profile, entry.snapshotId, { loader: gate.loader });
    const handle = await provider.openSnapshot();

    let resolved = false;
    const pending = provider.fetchListingColumns(handle, 'FULL').then((b) => {
      resolved = true;
      return b;
    });
    // Laisse tourner la boucle d'événements : sans les annonces, la promesse ne peut pas aboutir.
    await new Promise((r) => setTimeout(r, 20));
    expect(resolved, 'le lot mode 2 n’est pas rendu avant les annonces').toBe(false);

    gate.release();
    const batch = await pending;
    expect(batch.rowCount).toBeGreaterThan(0);
  });
});

/* ================================================================================================
 * 3 et 4. REPLI et REFUS — sur un mini-jeu temporaire, écrit hors du dépôt
 * ============================================================================================== */

/** Copie le mini-jeu dans un répertoire à nous, pour pouvoir y abîmer l'artefact sans rien casser. */
function miniWorkspace(name: string): { root: string; snapshotId: string } {
  const mini = buildMiniFixtures();
  const root = resolve(tmpdir(), `kycar-baseline-${name}`);
  rmSync(root, { recursive: true, force: true });
  const from = resolve(mini.root, MINI_PROFILE, MINI_LATEST_SNAPSHOT_ID);
  const to = resolve(root, MINI_PROFILE, MINI_LATEST_SNAPSHOT_ID);
  mkdirSync(to, { recursive: true });
  for (const file of ['listings.ndjson.gz', 'manifest.json']) {
    copyFileSync(resolve(from, file), resolve(to, file));
  }
  return { root, snapshotId: MINI_LATEST_SNAPSHOT_ID };
}

describe('D3-31 — un échec de transport sur les annonces reste réessayable', () => {
  it('la deuxième demande relance l’ingestion au lieu de rejouer le même rejet', async () => {
    const profile: FixtureProfile = 'dev';
    if (!existsSync(resolve(FIXTURE_ROOT, profile))) return;
    const entry = buildProfileIndexFromDisk(FIXTURE_ROOT, profile).snapshots.at(-1) as { snapshotId: string };
    const inner = createNodeFixtureLoader(FIXTURE_ROOT);
    let attempts = 0;
    const flaky: FixtureLoader = {
      ...inner,
      openListings(p2, e2) {
        attempts += 1;
        if (attempts === 1) return Promise.reject(new Error('coupure réseau simulée'));
        return inner.openListings(p2, e2);
      },
    };
    const provider = providerOn(FIXTURE_ROOT, profile, entry.snapshotId, { loader: flaky });

    // L'ouverture RÉUSSIT quand même : la baseline ne dépend pas du fichier d'annonces.
    const handle = await provider.openSnapshot();
    expect((await provider.fetchBaselineAggregates(handle)).rows.length).toBeGreaterThan(0);

    await expect(provider.fetchListingColumns(handle, 'FULL')).rejects.toThrow(/coupure réseau simulée/);
    // Deuxième demande : une NOUVELLE tentative, pas le même rejet mémorisé. C'est ce qui rend les
    // trois réessais d'`EX-NFR-21` autre chose qu'une répétition à vide.
    const batch = await provider.fetchListingColumns(handle, 'FULL');
    expect(batch.rowCount).toBeGreaterThan(0);
    expect(attempts).toBe(2);
  });
});

describe('D3-31 — sans artefact, avec un artefact périmé, avec un artefact démenti', () => {
  it('SANS artefact : mêmes valeurs, et la note de couverture le dit', async () => {
    const ws = miniWorkspace('missing');
    const provider = providerOn(ws.root, MINI_PROFILE as FixtureProfile, ws.snapshotId);
    const handle = await provider.openSnapshot();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const batch = await provider.whenIngested();

    expect(handle.descriptor.coverageNote).toMatch(/NON précalculés/);
    expect(baseline.rows).toStrictEqual(aggregateByMake(batch, null, 1));
    expect(baseline.selectionCount).toBe(batch.rowCount);
    // Le repli n'est pas un mode dégradé de la donnée : c'est le même résultat, plus lentement.
    expect(handle.descriptor.listingCount).toBe(batch.rowCount);
  });

  it('artefact d’un AUTRE snapshot : refusé, dit, et les agrégats sont recalculés', async () => {
    const ws = miniWorkspace('stale');
    // On produit un artefact valide, puis on le maquille en artefact d'un autre snapshot.
    await runBaseline({ profile: MINI_PROFILE as FixtureProfile, out: ws.root, check: false });
    const path = resolve(ws.root, MINI_PROFILE, ws.snapshotId, BASELINE_FILE);
    const artifact = JSON.parse(readFileSync(path, 'utf-8')) as SnapshotBaselineArtifact;
    const truth = { ...artifact };
    writeFileSync(path, JSON.stringify({ ...artifact, snapshotId: 'be-19700101T000000Z' }, null, 1), 'utf-8');

    const provider = providerOn(ws.root, MINI_PROFILE as FixtureProfile, ws.snapshotId);
    const handle = await provider.openSnapshot();
    expect(handle.descriptor.coverageNote).toMatch(/Agrégats précalculés REFUSÉS/);
    const baseline = await provider.fetchBaselineAggregates(handle);
    const batch = await provider.whenIngested();
    // Refusé ne veut pas dire perdu : les chiffres servis sont ceux du calcul complet.
    expect(baseline.rows).toStrictEqual(aggregateByMake(batch, null, 1));
    expect(baseline.rows.length).toBe(truth.rows.length);

    // Même refus quand ce sont les OCTETS qui ont changé sous l'artefact.
    writeFileSync(
      path,
      JSON.stringify({ ...artifact, producedFrom: { ...artifact.producedFrom, sha256: 'f'.repeat(64) } }, null, 1),
      'utf-8',
    );
    const second = providerOn(ws.root, MINI_PROFILE as FixtureProfile, ws.snapshotId);
    const h2 = await second.openSnapshot();
    expect(h2.descriptor.coverageNote).toMatch(/d’autres octets/);
  });

  it('artefact DÉMENTI par les annonces : erreur explicite, jamais un chiffre faux', async () => {
    const ws = miniWorkspace('tampered');
    await runBaseline({ profile: MINI_PROFILE as FixtureProfile, out: ws.root, check: false });
    const path = resolve(ws.root, MINI_PROFILE, ws.snapshotId, BASELINE_FILE);
    const artifact = JSON.parse(readFileSync(path, 'utf-8')) as SnapshotBaselineArtifact;
    // Une SEULE médiane de prix retouchée : l'artefact reste cohérent avec lui-même (mêmes
    // effectifs, même somme, même sha) — seul le recalcul sur les annonces peut le démentir.
    const first = artifact.rows[0] as MakeAggregate;
    const tampered = {
      ...artifact,
      rows: [{ ...first, price: { ...first.price, p50: (first.price.p50 ?? 0) + 1 } }, ...artifact.rows.slice(1)],
    };
    writeFileSync(path, JSON.stringify(tampered, null, 1), 'utf-8');

    const provider = providerOn(ws.root, MINI_PROFILE as FixtureProfile, ws.snapshotId);
    const handle = await provider.openSnapshot();
    // L'ouverture réussit : rien, à cet instant, ne permet encore de savoir que l'artefact ment.
    expect(handle.descriptor.coverageNote).toMatch(/PRÉCALCULÉS/);

    // À l'arrivée des annonces, l'écart est trouvé et NOMMÉ, en français, avec la marque en cause.
    await expect(provider.whenIngested()).rejects.toThrow(/ne correspondent pas aux annonces reçues/);
    await expect(provider.fetchAggregates(handle, '', 'MAKE')).rejects.toThrow(/ne correspondent pas/);
    // Et la baseline déjà servie n'est plus servie non plus : elle est devenue indéfendable.
    await expect(provider.fetchBaselineAggregates(handle)).rejects.toThrow(/prix|marque|annonces reçues/);
  });
});
