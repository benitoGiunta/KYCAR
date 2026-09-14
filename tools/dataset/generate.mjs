#!/usr/bin/env node
/**
 * KYCAR - `npm run data:gen` : generateur de fixtures deterministe (phase 3.2)
 * =================================================================================================
 *   npm run data:gen -- --profile dev|test|perf [--seed <n>] [--out data/fixtures]
 *
 * Ecrit, pour chacun des trois snapshots hebdomadaires du profil :
 *   data/fixtures/<profil>/<snapshotId>/listings.ndjson.gz   une annonce As24Listing par ligne
 *   data/fixtures/<profil>/<snapshotId>/manifest.json        conforme a snapshot-manifest.schema.json
 *   data/fixtures/<profil>/<snapshotId>/generation.json       rapport lateral (parametres, mesures)
 *
 * Le manifest est un document FERME (`additionalProperties: false`) : les parametres de generation
 * utiles au reviewer (version de la specification, hachage des quinze tables, filtres non alimentes,
 * effectifs par anomalie) ne peuvent pas y figurer champ par champ. Ils sont resumes dans `note` et
 * detailles dans `generation.json`, depose a cote (DATASET-GEN.md §6, ecart EG-04).
 */

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { filterCoverage } from './filters.mjs';
import { buildValidators, firstError } from './schema.mjs';
import { generateProfile } from './snapshot.mjs';
import { loadTables, ROOT } from './tables.mjs';

const GENERATOR = { name: 'kycar-dataset-gen', version: '1.0.0' };

export function parseArgs(argv) {
  const out = { profile: 'dev', seed: null, out: 'data/fixtures', quiet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--profile') out.profile = argv[++i];
    else if (a === '--seed') out.seed = Number(argv[++i]);
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--quiet') out.quiet = true;
  }
  return out;
}

/** Statistiques rapides publiees dans le rapport lateral. */
function measure(objects) {
  let priced = 0;
  let onRequest = 0;
  let pro = 0;
  const makes = new Set();
  const models = new Set();
  for (const o of objects) {
    makes.add(o.make);
    if (o.model !== undefined) models.add(`${o.make}|${o.model}`);
    const p = o.prices?.public;
    if (p?.price !== undefined) priced += 1;
    if (p?.onRequestOnly === true) onRequest += 1;
    if (o.seller.type === 'D') pro += 1;
  }
  return {
    distinctMakes: makes.size,
    distinctModelCells: models.size,
    pricedShare: priced / objects.length,
    onRequestShare: onRequest / objects.length,
    proShare: pro / objects.length,
  };
}

export function runGeneration(opts) {
  const tables = loadTables();
  const seed = opts.seed === null || Number.isNaN(opts.seed) ? Number(tables.profiles.defaultSeed) : opts.seed >>> 0;
  const validators = buildValidators(tables.listingSchema, tables.manifestSchema);
  const started = process.hrtime.bigint();
  const generated = generateProfile(tables, opts.profile, seed);
  const genNs = process.hrtime.bigint() - started;

  const outRoot = join(ROOT, opts.out, opts.profile);
  if (existsSync(outRoot)) rmSync(outRoot, { recursive: true, force: true });
  mkdirSync(outRoot, { recursive: true });

  const summary = [];
  let invalid = 0;
  for (const snap of generated.results) {
    for (let i = 0; i < snap.objects.length; i += 1) {
      if (!validators.listing(snap.objects[i])) {
        invalid += 1;
        if (invalid <= 5) {
          process.stderr.write(
            `ECHEC schema ${snap.snapshotId} ligne ${i + 1} (${snap.objects[i].id}) : ${firstError(validators.listing)}\n`,
          );
        }
      }
    }

    const dir = join(outRoot, snap.snapshotId);
    mkdirSync(dir, { recursive: true });
    const manifest = {
      snapshotId: snap.snapshotId,
      capturedAt: snap.capturedAt,
      marketplace: tables.profiles.marketplace,
      profile: opts.profile,
      seed,
      schemaVersion: tables.listingSchema['x-kycar-schema-version'],
      generator: GENERATOR,
      file: 'listings.ndjson.gz',
      listingCount: snap.objects.length,
      sha256: snap.ser.sha256,
      sha256Gz: snap.ser.sha256Gz,
      uncompressedBytes: snap.ser.raw.length,
      compressedBytes: snap.ser.gz.length,
      previousSnapshotId: snap.previousSnapshotId,
      groundTruth: snap.groundTruth,
      note: '',
    };
    if (snap.delta) manifest.delta = snap.delta;

    const coverage = filterCoverage(snap.objects, tables.filtersScope);
    const stats = measure(snap.objects);
    const byAnomaly = {};
    for (const g of snap.groundTruth) byAnomaly[g.anomaly] = (byAnomaly[g.anomaly] ?? 0) + 1;

    manifest.note = [
      `generateur ${GENERATOR.name} ${GENERATOR.version}, graine ${seed}, profil ${opts.profile}.`,
      `specification DATASET-SPEC.md sha256 ${tables.hashes['DATASET-SPEC.md'].slice(0, 16)},`,
      `hachage combine des 15 tables et des 2 schemas ${tables.combinedHash.slice(0, 16)}.`,
      `identifiant de conception (profiles.json) ${snap.designSnapshotId}.`,
      `${snap.groundTruth.length} entrees de verite terrain sur ${snap.objects.length} lignes.`,
      `${coverage.unfueled.length} filtres non alimentes sur ${coverage.coveredCount} retenus de classe enumeree ou bornee`,
      `(${coverage.unfueled.map((u) => u.param).join(' ')}).`,
      'Parametres complets, mesures et correspondances : generation.json depose a cote.',
    ].join(' ').slice(0, 2000);

    if (!validators.manifest(manifest)) {
      throw new Error(`manifest non conforme (${snap.snapshotId}) : ${firstError(validators.manifest)}`);
    }

    writeFileSync(join(dir, 'listings.ndjson.gz'), snap.ser.gz);
    writeFileSync(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`);
    writeFileSync(
      join(dir, 'generation.json'),
      `${JSON.stringify(
        {
          $comment:
            'Rapport lateral du generateur : ce que le manifest ferme ne peut pas porter. Aucune donnee ' +
            "d'annonce ici, seulement des parametres et des mesures.",
          snapshotId: snap.snapshotId,
          designSnapshotId: snap.designSnapshotId,
          profile: opts.profile,
          seed,
          generator: GENERATOR,
          specVersionSha256: tables.hashes['DATASET-SPEC.md'],
          tableSha256: tables.hashes,
          combinedSha256: tables.combinedHash,
          schemaValidator: validators.engine,
          missingnessNormalizer: generated.normalizer,
          apportionment: { movedForPresenceFloor: generated.prep.movedForPresenceFloor },
          anomalyTargets: generated.anomalyTargets,
          groundTruthByCode: byAnomaly,
          stats,
          filterCoverage: coverage,
          accurateStateVocabulary: ['active', 'activeMarketable', 'activeReserved', 'activeHighlighted'],
        },
        null,
        1,
      )}\n`,
    );

    summary.push({
      snapshotId: snap.snapshotId,
      lines: snap.objects.length,
      gz: snap.ser.gz.length,
      raw: snap.ser.raw.length,
      sha256: snap.ser.sha256,
      delta: snap.delta,
      unfueled: coverage.unfueled.length,
      groundTruth: snap.groundTruth.length,
    });
  }

  return { summary, invalid, seed, ms: Number(genNs / 1000000n), profile: opts.profile, outRoot, budgetGzBytes: generated.profile.sizeBudgetGzBytes };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const r = runGeneration(opts);
  const totalGz = r.summary.reduce((a, s) => a + s.gz, 0);
  const lines = [];
  lines.push(`profil ${r.profile} · graine ${r.seed} · ${r.ms} ms`);
  for (const s of r.summary) {
    lines.push(
      `  ${s.snapshotId}  ${String(s.lines).padStart(7)} lignes  ${String((s.gz / 1024).toFixed(0)).padStart(6)} Kio gz  ` +
        `${String((s.raw / 1024 / 1024).toFixed(2)).padStart(6)} Mio brut  sha256 ${s.sha256.slice(0, 16)}  ` +
        `vt ${String(s.groundTruth).padStart(5)}` +
        (s.delta ? `  entrees ${s.delta.enteredCount} sorties ${s.delta.exitedCount} revisions ${s.delta.priceRevisedCount}` : ''),
    );
  }
  const budget = r.budgetGzBytes;
  lines.push(
    `  total gz ${totalGz} octets = ${(totalGz / 1024 / 1024).toFixed(3)} Mio  ` +
      `(${(totalGz / (r.summary[0].lines * 3)).toFixed(1)} octets/ligne)  budget ${budget} octets  ` +
      `${totalGz <= budget ? 'TENU' : `DEPASSE de ${(((totalGz - budget) / budget) * 100).toFixed(1)} %`}`,
  );
  lines.push(r.invalid === 0 ? '  OK   100 % des lignes conformes au schema' : `  ECHEC ${r.invalid} ligne(s) non conforme(s)`);
  process.stdout.write(`${lines.join('\n')}\n`);
  process.exitCode = r.invalid === 0 ? 0 : 1;
}

if (process.argv[1] && process.argv[1].endsWith('generate.mjs')) main();
