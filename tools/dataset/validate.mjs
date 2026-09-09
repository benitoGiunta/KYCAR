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
 *      `data/schema/validate.mjs`, dont ce script est le pendant pour les fixtures).
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
      return { dir, id: d, gz, raw, manifest, lines };
    });
}

export function runValidation(opts) {
  const tables = loadTables();
  const validators = buildValidators(tables.listingSchema, tables.manifestSchema);
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
  }

  const totalGz = snaps.reduce((a, s) => a + s.gz.length, 0);
  const profile = tables.profiles.profiles.find((p) => p.name === opts.profile);
  check(totalGz <= profile.sizeBudgetGzBytes, `${opts.profile} budget gz`, `${totalGz} / ${profile.sizeBudgetGzBytes} octets`);
  return { report, failures };
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
