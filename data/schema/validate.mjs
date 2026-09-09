#!/usr/bin/env node
/**
 * KYCAR — validation des schemas de la couche source et de leurs exemples (phase 3.1, S2)
 * =================================================================================================
 * Valide chaque exemple de `data/schema/examples/` contre le schema qui le gouverne, et sort en
 * ERREUR si un exemple attendu VALIDE echoue, ou si un exemple attendu INVALIDE passe. Le second
 * sens est le seul qui prouve que la barriere R3 du schema mord (critere S4 de la phase 3.1).
 *
 * Usage :
 *   node data/schema/validate.mjs                 # valide les exemples du depot
 *   node data/schema/validate.mjs --ndjson <f>    # valide en plus chaque ligne d'un NDJSON
 *                                                 # (utilise par le generateur de la phase 3.2)
 *
 * Dependance : `ajv` >= 8 (draft 2020-12) et `ajv-formats`, devDependencies du projet. Si elles ne
 * sont pas resolvables, le script bascule sur un validateur INTERNE qui couvre exactement le
 * sous-ensemble de JSON Schema employe par les deux schemas (type, enum, const, required,
 * additionalProperties, properties, items, $ref local, $defs, minimum/maximum, minLength/maxLength,
 * pattern, uniqueItems, maxItems, allOf/if/then, format uuid/date-time/uri). Le repli est signale
 * dans la sortie : il ne dispense jamais de la validation ajv en integration.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = join(HERE, 'examples');
const require_ = createRequire(import.meta.url);

/** Exemples du depot : fichier -> { schema, valid }. `valid: false` DOIT etre rejete. */
const CASES = [
  { file: 'minimal.json', schema: 'as24-listing.schema.json', valid: true },
  { file: 'full.json', schema: 'as24-listing.schema.json', valid: true },
  { file: 'full-nedc.json', schema: 'as24-listing.schema.json', valid: true },
  { file: 'invalid-r3.json', schema: 'as24-listing.schema.json', valid: false },
  { file: 'invalid-date.json', schema: 'as24-listing.schema.json', valid: false },
  { file: 'manifest.json', schema: 'snapshot-manifest.schema.json', valid: true },
];

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/* ================================================================================================
 * Validateur : ajv si disponible, repli interne sinon
 * ============================================================================================== */

function buildAjvValidator(schemas) {
  // Bascule de test : `KYCAR_SCHEMA_VALIDATOR=fallback` force le repli interne, pour comparer les
  // deux moteurs sur les memes cas sans desinstaller ajv.
  if (process.env.KYCAR_SCHEMA_VALIDATOR === 'fallback') return null;
  let Ajv2020;
  let addFormats;
  try {
    Ajv2020 = require_('ajv/dist/2020');
    addFormats = require_('ajv-formats');
  } catch {
    return null;
  }
  const AjvCtor = Ajv2020.default ?? Ajv2020;
  const addFormatsFn = addFormats.default ?? addFormats;
  const ajv = new AjvCtor({ allErrors: true, strict: false });
  addFormatsFn(ajv);
  const compiled = new Map();
  for (const [name, schema] of schemas) compiled.set(name, ajv.compile(schema));
  return {
    engine: `ajv ${require_('ajv/package.json').version}`,
    validate(name, data) {
      const fn = compiled.get(name);
      const ok = fn(data);
      return { ok, errors: ok ? [] : fn.errors.map((e) => `${e.instancePath || '/'} ${e.message}`) };
    },
  };
}

/* ---- Repli interne : sous-ensemble de draft 2020-12 reellement employe ------------------------ */

const FORMATS = {
  uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
  uri: /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/\S+$/,
};

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v === 'number' ? 'number' : typeof v;
}

function typeMatches(expected, actual) {
  if (expected === 'number') return actual === 'number' || actual === 'integer';
  return expected === actual;
}

function deref(schema, root) {
  if (!schema || typeof schema.$ref !== 'string') return schema;
  const path = schema.$ref.replace(/^#\//, '').split('/');
  let node = root;
  for (const seg of path) node = node?.[seg.replace(/~1/g, '/').replace(/~0/g, '~')];
  if (!node) throw new Error(`$ref non resolu : ${schema.$ref}`);
  return node;
}

function validateNode(schema, data, root, path, errors) {
  const s = deref(schema, root);
  if (s === true || s === undefined) return;

  if (s.const !== undefined && data !== s.const) {
    errors.push(`${path} doit valoir ${JSON.stringify(s.const)}`);
    return;
  }
  if (Array.isArray(s.enum) && !s.enum.some((v) => v === data)) {
    errors.push(`${path} hors enumeration`);
    return;
  }
  if (s.type !== undefined) {
    const actual = typeOf(data);
    const expected = Array.isArray(s.type) ? s.type : [s.type];
    if (!expected.some((t) => typeMatches(t, actual))) {
      errors.push(`${path} type ${actual}, attendu ${expected.join('|')}`);
      return;
    }
  }

  const actual = typeOf(data);
  if (actual === 'string') {
    if (s.minLength !== undefined && data.length < s.minLength) errors.push(`${path} trop court`);
    if (s.maxLength !== undefined && data.length > s.maxLength) errors.push(`${path} trop long`);
    if (s.pattern !== undefined && !new RegExp(s.pattern).test(data)) errors.push(`${path} ne respecte pas le motif`);
    if (s.format !== undefined && FORMATS[s.format] && !FORMATS[s.format].test(data)) {
      errors.push(`${path} format ${s.format} invalide`);
    }
  }
  if (actual === 'number' || actual === 'integer') {
    if (s.minimum !== undefined && data < s.minimum) errors.push(`${path} < minimum`);
    if (s.maximum !== undefined && data > s.maximum) errors.push(`${path} > maximum`);
  }
  if (actual === 'array') {
    if (s.maxItems !== undefined && data.length > s.maxItems) errors.push(`${path} trop d'elements`);
    if (s.uniqueItems === true) {
      const seen = new Set(data.map((v) => JSON.stringify(v)));
      if (seen.size !== data.length) errors.push(`${path} elements non uniques`);
    }
    if (s.items) data.forEach((v, i) => validateNode(s.items, v, root, `${path}[${i}]`, errors));
  }
  if (actual === 'object') {
    for (const key of s.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) errors.push(`${path}/${key} requis et absent`);
    }
    const props = s.properties ?? {};
    for (const [key, value] of Object.entries(data)) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        validateNode(props[key], value, root, `${path}/${key}`, errors);
      } else if (s.additionalProperties === false) {
        errors.push(`${path}/${key} propriete non autorisee`);
      }
    }
  }

  for (const sub of s.allOf ?? []) validateNode(sub, data, root, path, errors);
  if (s.if) {
    const probe = [];
    validateNode(s.if, data, root, path, probe);
    if (probe.length === 0 && s.then) validateNode(s.then, data, root, path, errors);
    if (probe.length > 0 && s.else) validateNode(s.else, data, root, path, errors);
  }
}

function buildFallbackValidator(schemas) {
  return {
    engine: 'validateur interne (ajv absent) — sous-ensemble draft 2020-12',
    validate(name, data) {
      const root = schemas.get(name);
      const errors = [];
      validateNode(root, data, root, '', errors);
      return { ok: errors.length === 0, errors };
    },
  };
}

/* ================================================================================================
 * Execution
 * ============================================================================================== */

function main() {
  const schemaNames = readdirSync(HERE).filter((f) => f.endsWith('.schema.json')).sort();
  const schemas = new Map(schemaNames.map((n) => [n, readJson(join(HERE, n))]));

  const validator = buildAjvValidator(schemas) ?? buildFallbackValidator(schemas);
  const lines = [];
  lines.push(`moteur : ${validator.engine}`);
  lines.push(`schemas : ${schemaNames.join(', ')}`);

  let failures = 0;
  for (const c of CASES) {
    const data = readJson(join(EXAMPLES, c.file));
    const { ok, errors } = validator.validate(c.schema, data);
    const passed = ok === c.valid;
    if (!passed) failures += 1;
    const attendu = c.valid ? 'VALIDE' : 'REJETE';
    const obtenu = ok ? 'valide' : 'rejete';
    lines.push(
      `${passed ? 'OK  ' : 'ECHEC'} ${c.file.padEnd(20)} attendu ${attendu.padEnd(6)} obtenu ${obtenu}` +
        (ok || c.valid === false ? '' : ` :: ${errors.join(' | ')}`) +
        (!ok && c.valid === false ? ` :: motif ${errors.join(' | ')}` : ''),
    );
  }

  const ndjsonIdx = process.argv.indexOf('--ndjson');
  if (ndjsonIdx !== -1) {
    const file = resolve(process.argv[ndjsonIdx + 1] ?? '');
    const content = readFileSync(file, 'utf8');
    const rows = content.split('\n').filter((l) => l.length > 0);
    let bad = 0;
    rows.forEach((line, i) => {
      const { ok, errors } = validator.validate('as24-listing.schema.json', JSON.parse(line));
      if (!ok && bad < 10) lines.push(`ECHEC ligne ${i + 1} :: ${errors.join(' | ')}`);
      if (!ok) bad += 1;
    });
    lines.push(`${bad === 0 ? 'OK  ' : 'ECHEC'} ${file} : ${rows.length - bad}/${rows.length} lignes valides`);
    failures += bad === 0 ? 0 : 1;
  }

  lines.push(failures === 0 ? 'RESULTAT : tous les cas conformes' : `RESULTAT : ${failures} cas non conforme(s)`);
  process.stdout.write(`${lines.join('\n')}\n`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main();
