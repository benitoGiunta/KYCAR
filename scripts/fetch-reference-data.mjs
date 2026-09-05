#!/usr/bin/env node
/**
 * Récupère le référentiel officiel AutoScout24 depuis son API publique de création d'annonces.
 *
 * Pourquoi cette source plutôt qu'un scraping du site :
 *  - www.autoscout24.be/robots.txt interdit ClaudeBot sur tout le site (Disallow: /) ;
 *  - listing-creation.api.autoscout24.com ne sert aucun robots.txt et expose /makes et
 *    /references en lecture, sans authentification (vérifié : HTTP 200, ~300 ms) ;
 *  - les valeurs obtenues sont les identifiants canoniques d'AutoScout24, pas des libellés
 *    reconstruits depuis du HTML.
 *
 * Portée : ce script ne récupère QUE des métadonnées de classification (marques, modèles,
 * carrosseries, carburants, équipements, couleurs, pays…). Il ne touche à aucune annonce.
 *
 * Usage :
 *   node scripts/fetch-reference-data.mjs                       # marketplace be, culture fr-BE
 *   node scripts/fetch-reference-data.mjs --marketplace de --culture de-DE
 *   node scripts/fetch-reference-data.mjs --culture en-GB --out data/reference/en
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const BASE = 'https://listing-creation.api.autoscout24.com';

/** VehicleType "C" = Voiture. Autres valeurs observées : B moto, L remorque, N caravane, X fourgon. */
const CAR_VEHICLE_TYPE = 'C';

/** Types de référentiels, relevés dans l'énumération ReferenceType de /assets/openapi/spec.yml */
const REFERENCE_TYPES = [
  'AvailabilityType', 'BatteryOwnershipType', 'BidirectionalChargingType', 'BedType',
  'BodyColor', 'BodyType', 'BrakeType', 'Co2Class', 'Country', 'DebitInterestType',
  'Drivetrain', 'EfficiencyClass', 'EngineCoolingSystem', 'EngineMountingType', 'Equipment',
  'EuEmissionStandard', 'Flooring', 'FridgePowerType', 'FuelCategory', 'FuelDeliveryType',
  'FuelType', 'GermanEmissionsSticker', 'IncludedService', 'Material', 'OfferType',
  'PlugType', 'PriceLabel', 'Steering', 'Transmission', 'UpholsteryColor', 'UpholsteryType',
  'VehicleType', 'InventoryTag',
];

const MARKETPLACES = ['at', 'be', 'ca', 'de', 'es', 'fr', 'it', 'lu', 'nl'];
const CULTURES = ['de-DE', 'de-AT', 'nl-BE', 'fr-BE', 'fr-FR', 'it-IT', 'es-ES', 'fr-LU', 'en-GB', 'nl-NL', 'fr-CA', 'en-CA'];

function parseArgs(argv) {
  const args = { marketplace: 'be', culture: 'fr-BE', out: 'data/reference', delayMs: 250 };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (key && value !== undefined && key in args) args[key] = key === 'delayMs' ? Number(value) : value;
  }
  if (!MARKETPLACES.includes(args.marketplace)) {
    throw new Error(`marketplace inconnu: ${args.marketplace} (attendu: ${MARKETPLACES.join(', ')})`);
  }
  if (!CULTURES.includes(args.culture)) {
    throw new Error(`culture inconnue: ${args.culture} (attendu: ${CULTURES.join(', ')})`);
  }
  return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * GET avec retry sur 429 et 5xx. Le contrat OpenAPI documente 429 RateLimitExceeded :
 * on recule exponentiellement plutôt que d'insister, pour ne pas se faire fermer la porte.
 */
async function getJson(path, { attempts = 4 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const startedAt = Date.now();
    try {
      const response = await fetch(`${BASE}${path}`, {
        headers: { accept: 'application/json', 'user-agent': 'kycar-reference-fetcher/1.0' },
        signal: AbortSignal.timeout(30_000),
      });
      const elapsedMs = Date.now() - startedAt;
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status} sur ${path}`);
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} sur ${path}`);
      return { data: await response.json(), elapsedMs, status: response.status };
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await sleep(1000 * 2 ** attempt);
    }
  }
  throw lastError;
}

/** Slug d'URL dérivé du libellé. EXTRAPOLÉ : l'API ne fournit pas les slugs du site public. */
function slugify(label) {
  return label
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return path;
}

async function main() {
  const { marketplace, culture, out, delayMs } = parseArgs(process.argv.slice(2));
  const fetchedAt = new Date().toISOString();
  const provenance = {
    source: `${BASE} (API officielle AutoScout24 de création d'annonces, endpoints de lecture publics non authentifiés)`,
    spec: `${BASE}/assets/openapi/spec.yml`,
    marketplace,
    culture,
    fetchedAt,
    evidenceNote: "id et name sont RELEVÉS auprès de l'API. Les slugs sont EXTRAPOLÉS par slugification du libellé : l'API ne les expose pas.",
  };

  console.log(`marketplace=${marketplace} culture=${culture} → ${out}`);

  // ---- Marques et modèles -------------------------------------------------
  // Attention aux noms de champs : la marque porte `vehicleTypes` (pluriel, tableau), le modèle
  // porte `vehicleType` (singulier, scalaire). Une marque peut être à la fois moto et voiture
  // (BMW : ["B","C"]), auquel cas seuls ses modèles `C` nous concernent.
  const makesResponse = await getJson(`/makes?marketplace=${marketplace}&culture=${encodeURIComponent(culture)}`);
  const rawMakes = makesResponse.data.makes ?? makesResponse.data;
  const makes = rawMakes.map((make) => ({
    id: make.id,
    label: make.name,
    slug: slugify(make.name),
    vehicleTypes: make.vehicleTypes ?? [],
    models: (make.models ?? []).map((model) => ({
      id: model.id,
      label: model.name,
      slug: slugify(model.name),
      vehicleType: model.vehicleType ?? null,
    })),
  }));
  const modelCount = makes.reduce((total, make) => total + make.models.length, 0);
  await writeJson(join(out, 'taxonomy-all.json'), { ...provenance, scope: 'tous types de véhicules', makeCount: makes.length, modelCount, makes });
  console.log(`  taxonomy-all.json  ${makes.length} marques, ${modelCount} modèles (tous véhicules)  (${makesResponse.elapsedMs} ms)`);

  // Vue voiture seule : c'est le périmètre de KYCAR. On la matérialise plutôt que de la
  // recalculer partout, et on garde la vue complète à côté pour ne rien perdre.
  const carMakes = makes
    .filter((make) => make.vehicleTypes.includes(CAR_VEHICLE_TYPE))
    .map((make) => ({ ...make, models: make.models.filter((model) => model.vehicleType === CAR_VEHICLE_TYPE) }))
    .filter((make) => make.models.length > 0);
  const carModelCount = carMakes.reduce((total, make) => total + make.models.length, 0);
  await writeJson(join(out, 'taxonomy.json'), {
    ...provenance, scope: `voitures uniquement (vehicleType "${CAR_VEHICLE_TYPE}")`,
    makeCount: carMakes.length, modelCount: carModelCount, makes: carMakes,
  });
  console.log(`  taxonomy.json      ${carMakes.length} marques, ${carModelCount} modèles (voitures)`);

  // ---- Référentiels d'attributs -------------------------------------------
  const index = [];
  for (const referenceType of REFERENCE_TYPES) {
    await sleep(delayMs);
    try {
      const { data, elapsedMs } = await getJson(
        `/references?referenceType=${referenceType}&marketplace=${marketplace}&culture=${encodeURIComponent(culture)}`,
      );
      const references = (data.references ?? data).map((reference) => ({
        id: reference.id,
        label: reference.name,
        vehicleType: reference.vehicleType ?? null,
        country: reference.country ?? null,
      }));
      await writeJson(join(out, 'references', `${referenceType}.json`), {
        ...provenance, referenceType, count: references.length, references,
      });
      index.push({ referenceType, count: references.length, status: 'OK', elapsedMs });
      console.log(`  ${referenceType.padEnd(28)} ${String(references.length).padStart(5)} valeurs  (${elapsedMs} ms)`);
    } catch (error) {
      index.push({ referenceType, count: 0, status: 'ERREUR', error: String(error.message ?? error) });
      console.error(`  ${referenceType.padEnd(28)} ÉCHEC — ${error.message ?? error}`);
    }
  }

  await writeJson(join(out, 'references', '_index.json'), { ...provenance, referenceTypes: index });
  const ok = index.filter((entry) => entry.status === 'OK');
  const total = ok.reduce((sum, entry) => sum + entry.count, 0);
  console.log(`\n${ok.length}/${REFERENCE_TYPES.length} référentiels récupérés, ${total} valeurs au total.`);
  if (ok.length < REFERENCE_TYPES.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
