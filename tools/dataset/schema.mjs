/**
 * KYCAR - Validation de schema du generateur (critere S2 de la phase 3.2)
 * =================================================================================================
 * `ajv` et `ajv-formats` sont deja des devDependencies du projet (aucune dependance ajoutee). Le
 * generateur les compile UNE fois et valide CHAQUE ligne a la generation : une ligne non conforme
 * n'est jamais ecrite. `data/schema/validate.mjs --ndjson` rejoue la meme validation sur le fichier
 * livre, avec sa garde R3 en plus.
 */

import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);

/** Compile les deux schemas et rend deux validateurs. */
export function buildValidators(listingSchema, manifestSchema) {
  const Ajv2020 = require_('ajv/dist/2020');
  const addFormats = require_('ajv-formats');
  const AjvCtor = Ajv2020.default ?? Ajv2020;
  const addFormatsFn = addFormats.default ?? addFormats;
  const ajv = new AjvCtor({ allErrors: false, strict: false });
  addFormatsFn(ajv);
  return {
    engine: `ajv ${require_('ajv/package.json').version}`,
    listing: ajv.compile(listingSchema),
    manifest: ajv.compile(manifestSchema),
  };
}

/** Message d'erreur court et exploitable pour un rejet. */
export function firstError(validate) {
  const e = (validate.errors ?? [])[0];
  return e ? `${e.instancePath || '/'} ${e.message}` : 'inconnu';
}
