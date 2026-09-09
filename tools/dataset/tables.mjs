/**
 * KYCAR - Chargement et preparation des tables du generateur de fixtures (phase 3.2)
 * =================================================================================================
 * Les quinze tables de `docs/data/dataset-spec/*.json` sont lues TELLES QUELLES (aucune valeur n'est
 * recopiee dans le code), avec le referentiel `data/reference/` (taxonomie AutoScout24, perimetre
 * des filtres) et les deux schemas JSON de `data/schema/`. Chaque fichier est hache (SHA-256) : le
 * manifest publie le hachage combine et le rapport lateral la table complete, pour qu'un reviewer
 * sache exactement sur quels parametres un snapshot a ete produit.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..');

const SPEC_DIR = join(ROOT, 'docs', 'data', 'dataset-spec');
const REF_DIR = join(ROOT, 'data', 'reference');
const SCHEMA_DIR = join(ROOT, 'data', 'schema');

/** Noms des quinze tables de parametres, dans l'ordre du §9 de DATASET-SPEC. */
export const SPEC_TABLES = [
  'profiles',
  'makes',
  'models',
  'segments',
  'fuel-year',
  'age-and-mileage',
  'price-model',
  'emissions',
  'sellers',
  'geography',
  'missingness',
  'equipment',
  'snapshot-dynamics',
  'anomalies',
  'probes',
];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function readJsonHashed(path, into, key) {
  const raw = readFileSync(path);
  into[key] = sha256(raw);
  return JSON.parse(raw.toString('utf8'));
}

/** Interpolation lineaire sur une suite de pivots croissants (extrapolation plate hors bornes). */
export function interpolate(pivots, values, x) {
  if (x <= pivots[0]) return values[0];
  const last = pivots.length - 1;
  if (x >= pivots[last]) return values[last];
  for (let i = 0; i < last; i += 1) {
    if (x >= pivots[i] && x <= pivots[i + 1]) {
      const t = (x - pivots[i]) / (pivots[i + 1] - pivots[i]);
      return values[i] + t * (values[i + 1] - values[i]);
    }
  }
  return values[last];
}

/** Interpolation sur une table { annee: valeur } a cles numeriques. */
export function interpolateMap(map, x) {
  const keys = Object.keys(map)
    .filter((k) => /^[0-9]+$/.test(k))
    .map(Number)
    .sort((a, b) => a - b);
  return interpolate(
    keys,
    keys.map((k) => map[String(k)]),
    x,
  );
}

/** Poids cumules a partir d'une table { cle: poids }. Retourne { keys, cumulative, total }. */
export function cumulativeOf(weightByKey) {
  const keys = Object.keys(weightByKey);
  const cumulative = new Float64Array(keys.length);
  let acc = 0;
  for (let i = 0; i < keys.length; i += 1) {
    acc += weightByKey[keys[i]];
    cumulative[i] = acc;
  }
  return { keys, cumulative, total: acc };
}

/** Charge toutes les tables et prepare les structures derivees du generateur. */
export function loadTables() {
  /** @type {Record<string, string>} */
  const hashes = {};
  /** @type {Record<string, unknown>} */
  const t = {};
  for (const name of SPEC_TABLES) {
    t[name] = readJsonHashed(join(SPEC_DIR, `${name}.json`), hashes, `dataset-spec/${name}.json`);
  }
  const taxonomy = readJsonHashed(join(REF_DIR, 'taxonomy.json'), hashes, 'reference/taxonomy.json');
  const filtersScope = readJsonHashed(
    join(REF_DIR, 'filters-scope.json'),
    hashes,
    'reference/filters-scope.json',
  );
  const listingSchema = readJsonHashed(
    join(SCHEMA_DIR, 'as24-listing.schema.json'),
    hashes,
    'schema/as24-listing.schema.json',
  );
  const manifestSchema = readJsonHashed(
    join(SCHEMA_DIR, 'snapshot-manifest.schema.json'),
    hashes,
    'schema/snapshot-manifest.schema.json',
  );
  // Le document de specification lui-meme : sa version est le hachage de son texte.
  const specDoc = readFileSync(join(ROOT, 'docs', 'data', 'DATASET-SPEC.md'));
  hashes['DATASET-SPEC.md'] = sha256(specDoc);

  const combined = sha256(
    Object.keys(hashes)
      .sort()
      .map((k) => `${k}:${hashes[k]}`)
      .join('\n'),
  );

  return {
    profiles: t['profiles'],
    makes: t['makes'],
    models: t['models'],
    segments: t['segments'],
    fuelYear: t['fuel-year'],
    ageMileage: t['age-and-mileage'],
    priceModel: t['price-model'],
    emissions: t['emissions'],
    sellers: t['sellers'],
    geography: t['geography'],
    missingness: t['missingness'],
    equipment: t['equipment'],
    dynamics: t['snapshot-dynamics'],
    anomalies: t['anomalies'],
    probes: t['probes'],
    taxonomy,
    filtersScope,
    listingSchema,
    manifestSchema,
    hashes,
    combinedHash: combined,
  };
}

/** Codes d'equipement du vocabulaire voiture, tels que le schema les autorise. */
export function equipmentVocabulary(listingSchema) {
  return listingSchema.$defs.equipmentCode.enum.slice();
}

/** Codes de label de qualite (appliedSeals) autorises par le schema. */
export function sealVocabulary(listingSchema) {
  return listingSchema.$defs.sealCode.enum.slice();
}
