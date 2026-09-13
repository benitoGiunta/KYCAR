/**
 * KYCAR — `npm run data:baseline` : agrégats mode 1 PRÉCALCULÉS d'un profil de fixtures (D3-31)
 * =================================================================================================
 *   npm run data:baseline -- --profile dev|test|perf [--out data/fixtures] [--check]
 *
 * Écrit, à côté du `manifest.json` de chaque snapshot du profil, un fichier `baseline.json` :
 * les `MakeAggregate` de la sélection VIDE, l'effectif de cette sélection, et les statistiques
 * d'ingestion que le `SnapshotDescriptor` publie. C'est ce fichier — quelques dizaines de Kio —
 * que l'application télécharge pour peindre son premier chiffre, au lieu des 2 677 Kio gzip
 * d'annonces du profil `test` (constat `C-3.5-01`, budget `EX-NFR-9` de 2 000 ms).
 *
 * **CALCULÉ PAR LE CODE DU PROVIDER, PAS PAR UNE RÉIMPLÉMENTATION.** Le script instancie le VRAI
 * `FixtureDataProvider` avec le chargeur disque et `useBaselineArtifact: false` (il ne peut pas lire
 * l'artefact pour l'écrire), ouvre le snapshot par le chemin d'ingestion complète, puis sérialise ce
 * que le provider a calculé. Une réimplémentation en JS des percentiles, du dédoublonnage et des
 * drapeaux aurait produit un second moteur d'agrégation, condamné à diverger du premier — et la
 * divergence se serait vue sur des CHIFFRES AFFICHÉS.
 *
 * C'est pourquoi ce script est en TypeScript et lancé par `vite-node` (déjà présent avec vitest,
 * aucune dépendance ajoutée) : il importe les modules de `src/` tels quels.
 *
 * `--check` n'écrit rien et compare l'artefact existant à ce qui serait calculé : c'est le mode que
 * la porte de données emploie pour prouver qu'un artefact commité est bien celui de ses octets.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadReferenceDataFromDisk } from '../../src/orchestration/reference-fs';
import { FixtureDataProvider, FIXTURE_PROVIDER_VERSION } from '../../src/providers/fixture/FixtureDataProvider';
import {
  BASELINE_ARTIFACT,
  BASELINE_ARTIFACT_VERSION,
  BASELINE_FILE,
  diffBaseline,
  isBaselineArtifact,
  type SnapshotBaselineArtifact,
} from '../../src/providers/fixture/baseline-artifact';
import { createNodeFixtureLoader, buildProfileIndexFromDisk } from '../../src/providers/fixture/loaders/node';
import type { FixtureProfile } from '../../src/providers/fixture/manifest';

/** Identité de l'outil, écrite dans l'artefact (traçabilité `EX-DATA-106`). */
const PRODUCER = { name: 'kycar-baseline', version: '1.0.0' };

interface Options {
  readonly profile: FixtureProfile;
  readonly out: string;
  readonly check: boolean;
}

export function parseArgs(argv: readonly string[]): Options {
  let profile = 'dev';
  let out = 'data/fixtures';
  let check = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--profile') profile = argv[++i] ?? 'dev';
    else if (a === '--out') out = argv[++i] ?? 'data/fixtures';
    else if (a === '--check') check = true;
  }
  return { profile: profile as FixtureProfile, out, check };
}

/** Ce qu'un snapshot a produit, pour le compte rendu de la commande. */
interface SnapshotOutcome {
  readonly snapshotId: string;
  readonly rows: number;
  readonly selectionCount: number;
  readonly bytes: number;
  readonly openMs: number;
  readonly ingestMs: number | null;
  /** `null` = conforme ; sinon le premier écart trouvé (mode `--check`). */
  readonly mismatch: string | null;
}

/** Calcule (et écrit, sauf en `--check`) l'artefact de chaque snapshot d'un profil. */
export async function runBaseline(opts: Options): Promise<{ outcomes: SnapshotOutcome[]; failures: number }> {
  const root = resolve(process.cwd(), opts.out);
  const index = buildProfileIndexFromDisk(root, opts.profile);
  if (index.snapshots.length === 0) {
    throw new Error(`Profil « ${opts.profile} » sans snapshot dans ${root} (lancer npm run data:gen).`);
  }
  const referenceData = loadReferenceDataFromDisk();
  const outcomes: SnapshotOutcome[] = [];
  let failures = 0;

  for (const entry of index.snapshots) {
    const provider = new FixtureDataProvider({
      referenceData,
      profile: opts.profile,
      loader: createNodeFixtureLoader(root),
      snapshotId: entry.snapshotId,
      // L'artefact ne peut pas être sa propre source : on force le chemin d'ingestion complète.
      useBaselineArtifact: false,
      // Le hachage est vérifié ici, une fois, sur TOUS les profils : c'est le moment où la machine
      // a le temps de le faire, et c'est ce qui scelle l'artefact à des octets précis.
      verifySha256: true,
    });
    const handle = await provider.openSnapshot();
    await provider.whenIngested();
    const baseline = await provider.fetchBaselineAggregates(handle);
    const manifest = provider.getManifest();

    const artifact: SnapshotBaselineArtifact = {
      artifact: BASELINE_ARTIFACT,
      artifactVersion: BASELINE_ARTIFACT_VERSION,
      schemaVersion: manifest.schemaVersion,
      snapshotId: manifest.snapshotId,
      profile: opts.profile,
      producedBy: { ...PRODUCER, providerVersion: FIXTURE_PROVIDER_VERSION },
      producedFrom: { sha256: manifest.sha256, listingCount: manifest.listingCount },
      selectionCount: baseline.selectionCount,
      ingest: provider.getIngestSummary(),
      rows: baseline.rows,
    };
    // Indentation 1, comme les manifests du générateur : lisible en revue, et le gzip du serveur
    // ramène l'espace à presque rien sur le fil.
    const body = `${JSON.stringify(artifact, null, 1)}\n`;
    const path = resolve(root, opts.profile, entry.dir, BASELINE_FILE);

    let mismatch: string | null = null;
    if (opts.check) {
      if (!existsSync(path)) mismatch = 'artefact absent';
      else {
        const existing = JSON.parse(readFileSync(path, 'utf-8')) as unknown;
        if (!isBaselineArtifact(existing)) mismatch = 'artefact illisible ou de forme inattendue';
        else {
          mismatch = diffBaseline(existing, {
            rows: artifact.rows,
            selectionCount: artifact.selectionCount,
            ingest: artifact.ingest,
          });
          if (mismatch === null && existing.producedFrom.sha256 !== artifact.producedFrom.sha256) {
            mismatch = 'sha256 des octets sources différent de celui du manifest';
          }
        }
      }
      if (mismatch !== null) failures += 1;
    } else {
      writeFileSync(path, body, 'utf-8');
    }

    outcomes.push({
      snapshotId: manifest.snapshotId,
      rows: baseline.rows.length,
      selectionCount: baseline.selectionCount,
      bytes: Buffer.byteLength(body, 'utf-8'),
      openMs: provider.getLastOpenMs(),
      ingestMs: provider.getLastIngestMs(),
      mismatch,
    });
  }
  return { outcomes, failures };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const { outcomes, failures } = await runBaseline(opts);
  const lines: string[] = [`profil ${opts.profile}${opts.check ? ' (controle, aucune ecriture)' : ''}`];
  for (const o of outcomes) {
    lines.push(
      `  ${o.snapshotId}  ${String(o.rows).padStart(4)} marques  ` +
        `${String(o.selectionCount).padStart(7)} annonces  ${String((o.bytes / 1024).toFixed(1)).padStart(7)} Kio  ` +
        `ingestion ${String(o.ingestMs ?? o.openMs)} ms` +
        (opts.check ? `  ${o.mismatch === null ? 'CONFORME' : `ECART :: ${o.mismatch}`}` : ''),
    );
  }
  if (opts.check) lines.push(failures === 0 ? 'RESULTAT : artefacts conformes' : `RESULTAT : ${failures} ecart(s)`);
  process.stdout.write(`${lines.join('\n')}\n`);
  process.exitCode = failures === 0 ? 0 : 1;
}

/**
 * Exécution DIRECTE seulement. Sous `vite-node`, `process.argv[1]` est le binaire `vite-node`
 * lui-même (le chemin du script part dans `argv[2]`, après le `--`) ; sous vitest, c'est le binaire
 * de vitest. Ce test distingue donc la commande de l'import, sans dépendre d'une variable
 * d'environnement que le shell de Windows n'accepterait pas en préfixe de script npm.
 */
const invoker = process.argv[1] ?? '';
if (invoker.includes('vite-node') || invoker.endsWith('baseline.ts')) {
  await main();
}
