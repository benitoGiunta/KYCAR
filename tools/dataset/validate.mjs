#!/usr/bin/env node
/**
 * KYCAR - `npm run data:validate` : rejoue la validation d'un profil deja genere
 * =================================================================================================
 *   npm run data:validate -- --profile dev|test|perf [--out data/fixtures]
 *
 * Ce que la commande verifie, snapshot par snapshot :
 *   1. le manifest est conforme a `snapshot-manifest.schema.json` ;
 *   2. `manifest.sha256` est bien celui des octets NON COMPRESSES du NDJSON (contrainte 31, P-109),
 *      et `sha256Gz` celui du fichier livre ;
 *   3. `listingCount` est le nombre de lignes ;
 *   4. CHAQUE ligne est conforme a `as24-listing.schema.json` (critere S2) ;
 *   5. aucune cle de la couche source ne figure sur la liste R3 d'`EX-DATA-47` (meme garde que
 *      `data/schema/validate.mjs`, dont ce script est le pendant pour les fixtures) ;
 *   6. l'artefact d'agregats precalcules `baseline.json` (D3-31) est present, conforme a
 *      `snapshot-baseline.schema.json`, lie AUX MEMES OCTETS (snapshotId, sha256, schemaVersion du
 *      manifest) et coherent avec lui-meme (somme des effectifs par marque = selectionCount =
 *      ingest.listingCount ; lineCount = retenues + rejetees + doublons ; aucune metrique dont
 *      l'effectif depasse celui de sa marque).
 *
 * Ce que ce script NE fait PAS, et qui est fait ailleurs : RECALCULER la baseline sur les annonces
 * pour la comparer a l'artefact. Ce controle-la exige le code d'agregation du provider (TypeScript)
 * et vit donc dans `npm run data:baseline -- --check` et dans la sonde de contrat
 * `tests/contract/baseline-artifact.test.ts`. Ici, on verifie la FORME et la COHERENCE INTERNE, en
 * Node pur, sans dependre de `src/`.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { buildValidators, firstError } from './schema.mjs';
import { loadTables, ROOT } from './tables.mjs';

/** Noms de champ interdits par R3 (copie de `data/schema/validate.mjs`, meme source de verite). */
const R3_FORBIDDEN = new Set([
  'sellerid', 'companyname', 'contactname', 'phone', 'phonenumber', 'telephone', 'mobile',
  'mobilephone', 'email', 'emailaddress', 'mail', 'contacturl', 'formurl', 'sellerurl', 'dealerurl',
  'website', 'websiteurl', 'homepage', 'zip', 'zipcode', 'postalcode', 'postcode', 'city', 'town',
  'municipality', 'street', 'streetname', 'housenumber', 'address', 'addressline', 'lat', 'lon',
  'lng', 'latitude', 'longitude', 'geolocation', 'description', 'cid', 'sellername', 'dealername',
  'vendorname', 'sellercompanyname', 'vin', 'vehicleidentificationnumber', 'chassisnumber',
  'licenceplate', 'licenseplate', 'numberplate', 'registrationplate', 'plate', 'kenteken',
  'belgiancarpassmileageurl', 'carpassmileageurl', 'carpassurl',
]);

const normalizeKey = (k) => k.toLowerCase().replace(/[_\-\s]/g, '');

export function parseArgs(argv) {
  const out = { profile: 'test', out: 'data/fixtures' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--profile') out.profile = argv[++i];
    else if (argv[i] === '--out') out.out = argv[++i];
  }
  return out;
}

/** Lit les snapshots d'un profil, dans l'ordre chronologique de leur identifiant. */
export function readProfile(outDir, profile) {
  const root = join(ROOT, outDir, profile);
  if (!existsSync(root)) throw new Error(`profil non genere : ${root} (lancer npm run data:gen)`);
  return readdirSync(root)
    .filter((d) => /^[a-z]{2}-\d{8}T\d{6}Z$/.test(d))
    .sort()
    .map((d) => {
      const dir = join(root, d);
      const gz = readFileSync(join(dir, 'listings.ndjson.gz'));
      const raw = gunzipSync(gz);
      const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
      const lines = raw.toString('utf8').split('\n').filter((l) => l.length > 0);
      // Artefact d'agregats precalcules (D3-31) : `null` s'il n'a pas ete genere.
      const baselinePath = join(dir, 'baseline.json');
      const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : null;
      return { dir, id: d, gz, raw, manifest, lines, baseline };
    });
}

export function runValidation(opts) {
  const tables = loadTables();
  const validators = buildValidators(tables.listingSchema, tables.manifestSchema, tables.baselineSchema);
  const snaps = readProfile(opts.out, opts.profile);
  const report = [];
  let failures = 0;
  const check = (ok, label, detail) => {
    if (!ok) failures += 1;
    report.push(`${ok ? 'OK   ' : 'ECHEC'} ${label}${detail ? ` :: ${detail}` : ''}`);
  };

  check(snaps.length === 3, `${opts.profile} : 3 snapshots`, `${snaps.length} trouve(s)`);
  let previous = null;
  for (const s of snaps) {
    check(validators.manifest(s.manifest), `${s.id} manifest conforme au schema`, firstError(validators.manifest));
    const sha = createHash('sha256').update(s.raw).digest('hex');
    check(sha === s.manifest.sha256, `${s.id} sha256 des octets non compresses`, `${sha.slice(0, 16)} vs ${String(s.manifest.sha256).slice(0, 16)}`);
    const shaGz = createHash('sha256').update(s.gz).digest('hex');
    check(shaGz === s.manifest.sha256Gz, `${s.id} sha256Gz du fichier livre`, shaGz.slice(0, 16));
    check(s.lines.length === s.manifest.listingCount, `${s.id} listingCount`, `${s.lines.length} lignes`);
    check(
      s.manifest.previousSnapshotId === previous,
      `${s.id} chainage previousSnapshotId`,
      `${s.manifest.previousSnapshotId} attendu ${previous}`,
    );
    previous = s.id;

    let bad = 0;
    let firstMsg = '';
    const keys = new Set();
    for (const line of s.lines) {
      const o = JSON.parse(line);
      if (!validators.listing(o)) {
        bad += 1;
        if (bad === 1) firstMsg = firstError(validators.listing);
      }
      collectKeys(o, keys);
    }
    check(bad === 0, `${s.id} ${s.lines.length} lignes conformes au schema`, bad ? `${bad} rejet(s), premier : ${firstMsg}` : '');
    const offenders = [...keys].filter((k) => R3_FORBIDDEN.has(normalizeKey(k)));
    check(offenders.length === 0, `${s.id} garde R3 sur ${keys.size} cles distinctes`, offenders.join(', '));

    const gtIds = new Set(s.lines.map((l) => JSON.parse(l).id));
    const missing = s.manifest.groundTruth.filter((g) => !gtIds.has(g.listingId)).length;
    check(missing === 0, `${s.id} verite terrain : ${s.manifest.groundTruth.length} entrees rattachees a une ligne`, `${missing} orpheline(s)`);

    checkBaseline(check, s, validators);
  }

  const totalGz = snaps.reduce((a, s) => a + s.gz.length, 0);
  const profile = tables.profiles.profiles.find((p) => p.name === opts.profile);
  check(totalGz <= profile.sizeBudgetGzBytes, `${opts.profile} budget gz`, `${totalGz} / ${profile.sizeBudgetGzBytes} octets`);
  return { report, failures };
}

/**
 * D3-31 - l'artefact d'agregats precalcules d'un snapshot. Il est OBLIGATOIRE sur un profil genere :
 * son absence n'est pas une option de confort, c'est le retour au chargement de 2,7 Mio avant le
 * premier chiffre que `C-3.5-01` a mesure a 7 800 ms. La commande le dit donc en ECHEC, et non en
 * remarque.
 */
function checkBaseline(check, s, validators) {
  const b = s.baseline;
  if (b === null) {
    check(false, `${s.id} agregats precalcules (baseline.json)`, 'absent — lancer npm run data:baseline');
    return;
  }
  check(validators.baseline(b), `${s.id} baseline conforme au schema`, firstError(validators.baseline));
  check(b.snapshotId === s.manifest.snapshotId, `${s.id} baseline : snapshotId du manifest`, `${b.snapshotId}`);
  check(
    b.producedFrom?.sha256 === s.manifest.sha256,
    `${s.id} baseline : calculee sur les octets du manifest`,
    `${String(b.producedFrom?.sha256).slice(0, 16)} vs ${String(s.manifest.sha256).slice(0, 16)}`,
  );
  check(
    b.schemaVersion === s.manifest.schemaVersion,
    `${s.id} baseline : version de schema du manifest`,
    `${b.schemaVersion} vs ${s.manifest.schemaVersion}`,
  );
  check(
    b.producedFrom?.listingCount === s.manifest.listingCount,
    `${s.id} baseline : effectif annonce du manifest`,
    `${b.producedFrom?.listingCount} vs ${s.manifest.listingCount}`,
  );
  const summed = (b.rows ?? []).reduce((a, r) => a + r.listingCount, 0);
  check(
    summed === b.selectionCount,
    `${s.id} baseline : somme des ${(b.rows ?? []).length} effectifs par marque = selectionCount`,
    `${summed} vs ${b.selectionCount}`,
  );
  check(
    b.ingest?.listingCount === b.selectionCount,
    `${s.id} baseline : effectif d ingestion = selectionCount`,
    `${b.ingest?.listingCount} vs ${b.selectionCount}`,
  );
  // Identite d'ingestion : chaque ligne lue est retenue, rejetee, ou doublon d'une retenue.
  const accounted = b.ingest.listingCount + b.ingest.rejectedCount + b.ingest.duplicateListingCount;
  check(
    accounted === b.ingest.lineCount && b.ingest.lineCount === s.lines.length,
    `${s.id} baseline : ${b.ingest.lineCount} lignes lues = retenues + rejetees + doublons`,
    `${b.ingest.listingCount} + ${b.ingest.rejectedCount} + ${b.ingest.duplicateListingCount} = ${accounted}, fichier ${s.lines.length}`,
  );
  // Une metrique ne peut pas etre calculee sur plus d'annonces que la marque n'en compte.
  const overflow = (b.rows ?? []).filter(
    (r) => r.price.n > r.listingCount || r.mileage.n > r.listingCount || r.year.n > r.listingCount,
  );
  check(
    overflow.length === 0,
    `${s.id} baseline : effectif de chaque metrique <= effectif de sa marque`,
    overflow.map((r) => r.makeId).join(', '),
  );
  // Les bornes sont nulles si et seulement si l'echantillon valide est vide (jamais un 0 mesure).
  const badNulls = (b.rows ?? []).filter((r) =>
    ['price', 'mileage', 'year'].some((k) => (r[k].n === 0) !== (r[k].p50 === null)),
  );
  check(
    badNulls.length === 0,
    `${s.id} baseline : bornes nulles si et seulement si n = 0`,
    badNulls.map((r) => r.makeId).join(', '),
  );
}

function collectKeys(node, out) {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const v of node) collectKeys(v, out);
    return;
  }
  for (const [k, v] of Object.entries(node)) {
    out.add(k);
    collectKeys(v, out);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { report, failures } = runValidation(opts);
  report.push(failures === 0 ? 'RESULTAT : profil conforme' : `RESULTAT : ${failures} controle(s) en echec`);
  process.stdout.write(`${report.join('\n')}\n`);
  process.exitCode = failures === 0 ? 0 : 1;
}

if (process.argv[1] && process.argv[1].endsWith('tools/dataset/validate.mjs')) main();
