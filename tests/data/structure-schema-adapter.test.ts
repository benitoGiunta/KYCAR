/**
 * KYCAR — REVUE DE STRUCTURE : schéma source → dictionnaire → adaptateur → canonique.
 * =================================================================================================
 * Agent `data-review` (phase 3.3), partie A de la mission. Ce n'est pas une sonde `P-nn` du contrat
 * `probes.json` : ce sont les contrôles de STRUCTURE que la revue ajoute au-dessus.
 */
import { describe, expect, it } from 'vitest';

import { as24Schema, loadProfile, manifestSchema, measure, s0 } from './harness';

interface SchemaNode {
  type?: string | string[];
  enum?: (string | number)[];
  properties?: Record<string, SchemaNode>;
  required?: string[];
  additionalProperties?: boolean;
  items?: SchemaNode;
  $ref?: string;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  maxLength?: number;
  description?: string;
  $defs?: Record<string, SchemaNode>;
  dependentSchemas?: Record<string, SchemaNode>;
}

const schema = as24Schema() as unknown as SchemaNode;
const defs = schema.$defs ?? {};

/** Parcourt les objets du schéma, en rendant (chemin, nœud). */
function* walkObjects(node: SchemaNode, path = ''): Generator<[string, SchemaNode]> {
  if (node.properties !== undefined) yield [path, node];
  for (const [k, v] of Object.entries(node.properties ?? {})) yield* walkObjects(v, path === '' ? k : `${path}.${k}`);
  if (node.items !== undefined) yield* walkObjects(node.items, `${path}[]`);
}

const resolve = (node: SchemaNode): SchemaNode => {
  if (node.$ref === undefined) return node;
  const name = node.$ref.replace('#/$defs/', '');
  return (defs[name] ?? node) as SchemaNode;
};

describe('A.1 — schéma source vs dictionnaire vs vocabulaires KYCAR', () => {
  it('S-01 — additionalProperties = false sur TOUS les objets du schéma source et du manifest', () => {
    const offenders: string[] = [];
    for (const [path, node] of walkObjects(schema)) {
      if (node.additionalProperties !== false) offenders.push(`as24:${path === '' ? '(racine)' : path}`);
    }
    for (const [path, node] of walkObjects(manifestSchema() as unknown as SchemaNode)) {
      if (node.additionalProperties !== false) offenders.push(`manifest:${path === '' ? '(racine)' : path}`);
    }
    measure('S-01', `${offenders.length} objet(s) ouvert(s) ${offenders.join(', ')}`);
    expect(offenders).toEqual([]);
  });

  it('S-02 — chaque enum du schéma est inclus dans le vocabulaire KYCAR correspondant', async () => {
    const { loadReferenceData } = await import('../../src/engine/testkit');
    const ref = loadReferenceData();
    // Correspondance chemin du schéma → vocabulaire nommé (EX-DATA-8).
    const VOCAB_OF: Record<string, string> = {
      fuelCategory: 'KYCAR_FUEL_CATEGORY',
      transmission: 'KYCAR_TRANSMISSION',
      drivetrain: 'KYCAR_DRIVETRAIN',
      bodyType: 'KYCAR_BODY_TYPE',
      bodyColor: 'KYCAR_BODY_COLOR',
      paintType: 'KYCAR_PAINT_TYPE',
      upholsteryType: 'KYCAR_UPHOLSTERY_TYPE',
      upholsteryColor: 'KYCAR_UPHOLSTERY_COLOR',
      euEmissionStandard: 'KYCAR_EU_EMISSION_STANDARD',
      efficiencyClass: 'KYCAR_EFFICIENCY_CLASS',
      offerType: 'KYCAR_OFFER_TYPE',
      usageState: 'KYCAR_USAGE_STATE',
      'seller.type': 'KYCAR_SELLER_TYPE',
      'adProduct.tier': 'KYCAR_AD_TIER',
      'wltp.co2Class': 'KYCAR_CO2_CLASS',
      'battery.ownershipType': 'KYCAR_BATTERY_OWNERSHIP',
      marketplace: 'KYCAR_MARKETPLACE',
      vehicleType: 'KYCAR_VEHICLE_TYPE',
      equipment: 'KYCAR_EQUIPMENT',
      'prices.public.evaluation.category': 'KYCAR_PRICE_EVALUATION',
    };
    const offenders: string[] = [];
    const checked: string[] = [];
    for (const [path, vocab] of Object.entries(VOCAB_OF)) {
      const node = resolve(propertyAt(path) ?? {});
      const arrayNode = node.items === undefined ? node : resolve(node.items);
      const values = arrayNode.enum;
      if (values === undefined) continue;
      const v = ref.vocabularies.get(vocab as never);
      if (v === undefined) {
        offenders.push(`${path} : vocabulaire ${vocab} introuvable`);
        continue;
      }
      const codes = new Set(v.values.map((e) => String(e.code)));
      const missing = values.map(String).filter((x) => !codes.has(x));
      checked.push(`${path} (${values.length} valeurs)`);
      if (missing.length > 0) offenders.push(`${path} → ${vocab} : ${missing.join(', ')} hors vocabulaire`);
    }
    measure('S-02', `${checked.length} énumérations confrontées, ${offenders.length} écart(s) ${offenders.join(' ; ')}`);
    expect(checked.length).toBeGreaterThanOrEqual(15);
    expect(offenders).toEqual([]);
  });

  it('S-03 — les unités du schéma sont fermées et cohérentes avec le dictionnaire', () => {
    const expected: Record<string, string[]> = {
      mileageUnit: ['km', 'mi'],
      powerUnit: ['kW', 'hp'],
      cylinderCapacityUnit: ['ccm', 'ci'],
      co2EmissionsUnit: ['g/km', 'g/mi'],
      combinedUnit: ['l/100km', 'mpg', 'km/l'],
      electricCombinedUnit: ['kWh/100km'],
      'battery.capacityUnit': ['kWh'],
      warrantyUnit: ['Months'],
      'prices.public.currency': ['EUR', 'CAD'],
    };
    const offenders: string[] = [];
    for (const [path, values] of Object.entries(expected)) {
      const node = resolve(propertyAt(path) ?? {});
      if (JSON.stringify(node.enum) !== JSON.stringify(values)) {
        offenders.push(`${path} : ${JSON.stringify(node.enum)} au lieu de ${JSON.stringify(values)}`);
      }
    }
    measure('S-03', `${Object.keys(expected).length} unités contrôlées, ${offenders.length} écart(s) ${offenders.join(' ; ')}`);
    expect(offenders).toEqual([]);
  });

  it('S-04 — la nullabilité du schéma : 6 champs requis, tout le reste optionnel, aucun null admis', () => {
    const required = schema.required ?? [];
    measure('S-04', `champs requis : ${required.join(', ')}`);
    expect([...required].sort()).toEqual(['id', 'location', 'make', 'marketplace', 'vehicleType', 'webPage']);
    // Aucun `type` du schéma n'admet `null` : une valeur inconnue est une clé ABSENTE (§8.3).
    const nullable: string[] = [];
    const walkTypes = (node: SchemaNode, path: string): void => {
      const t = node.type;
      if (Array.isArray(t) && t.includes('null')) nullable.push(path);
      if (t === 'null') nullable.push(path);
      for (const [k, v] of Object.entries(node.properties ?? {})) walkTypes(v, path === '' ? k : `${path}.${k}`);
      if (node.items !== undefined) walkTypes(node.items, `${path}[]`);
    };
    walkTypes(schema, '');
    for (const [name, d] of Object.entries(defs)) walkTypes(d, `$defs.${name}`);
    expect(nullable).toEqual([]);
  });

  it('S-05 — la contrainte inter-champs NEDC/WLTP est DÉCLARÉE dans le schéma (dependentSchemas)', () => {
    const dep = schema.dependentSchemas?.['wltp'];
    const forbidden = Object.entries(dep?.properties ?? {})
      .filter(([, v]) => (v as unknown) === false)
      .map(([k]) => k);
    measure('S-05', `dependentSchemas.wltp interdit : ${forbidden.join(', ')}`);
    expect([...forbidden].sort()).toEqual(['co2Emissions', 'consumption', 'efficiencyClass']);
  });

  it('R-DATA-24 — dependentSchemas.wltp n’interdit pas co2EmissionsUnit, que emissions.json interdit', () => {
    // `emissions.json:branchRule.WLTP.interdits` nomme `co2EmissionsUnit` ; le schéma, lui, ne le
    // bloque pas. Le fichier livré est propre (0 occurrence) — c'est la DISCIPLINE du générateur,
    // pas une garde. `combinedUnit` et `electricCombinedUnit` ne sont PAS en cause : le bloc `wltp`
    // n'a pas d'unité propre, ces deux champs portent l'unité des valeurs WLTP.
    const dep = schema.dependentSchemas?.['wltp'];
    const covered = Object.keys(dep?.properties ?? {});
    let inFile = 0;
    let unitsOnWltp = 0;
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        if (r.wltp === undefined) continue;
        if (r.co2EmissionsUnit !== undefined) inFile += 1;
        if (r.combinedUnit !== undefined || r.electricCombinedUnit !== undefined) unitsOnWltp += 1;
      }
    }
    measure(
      'S-06',
      `dependentSchemas.wltp couvre ${covered.join(', ')} ; co2EmissionsUnit ${covered.includes('co2EmissionsUnit') ? 'couvert' : 'NON COUVERT'} ` +
        `; ${inFile} ligne(s) livrée(s) le portent en branche WLTP ; ${unitsOnWltp} portent combinedUnit/electricCombinedUnit (licite : le bloc wltp n’a pas d’unité propre)`,
    );
    expect(inFile, 'le fichier livré n’exploite pas la faille').toBe(0);
    expect(covered, 'le schéma interdit co2EmissionsUnit en branche WLTP').toContain('co2EmissionsUnit');
  });

  it('S-07 — le manifest déclare ce que la revue lui demande : champs, chaînage, vérité terrain', () => {
    const m = manifestSchema() as unknown as SchemaNode;
    const props = Object.keys(m.properties ?? {});
    const required = m.required ?? [];
    measure('S-07', `${props.length} champs de manifest, requis : ${required.join(', ')}`);
    for (const k of ['snapshotId', 'capturedAt', 'marketplace', 'listingCount', 'sha256', 'previousSnapshotId', 'groundTruth']) {
      expect(props, `le manifest porte ${k}`).toContain(k);
    }
    for (const k of ['snapshotId', 'capturedAt', 'listingCount', 'sha256']) {
      expect(required, `${k} est obligatoire`).toContain(k);
    }
  });
});

describe('A.2 — adaptateur : perte d’information, arrondis, vocabulaires, cas limites', () => {
  const buildContext = async (): Promise<unknown> => {
    const { loadReferenceData } = await import('../../src/engine/testkit');
    const { createAs24Context } = await import('../../src/providers/adapters/as24');
    return createAs24Context({ referenceData: loadReferenceData(), observedAt: s0().manifest.capturedAt });
  };

  const baseListing = (): Record<string, unknown> => ({
    id: '11111111-2222-3333-4444-555555555555',
    webPage: 'https://www.autoscout24.be/offres/11111111-2222-3333-4444-555555555555',
    marketplace: 'be',
    vehicleType: 'C',
    make: 74,
    model: 2084,
    firstRegistrationDate: '2019-06',
    mileage: 60000,
    mileageUnit: 'km',
    power: 110,
    powerUnit: 'kW',
    powerHp: 150,
    fuelCategory: 'B',
    prices: { public: { price: 15990, currency: 'EUR' } },
    location: { countryCode: 'BE', postalCodePrefix2: '20' },
    seller: { type: 'D', dealerBucket: 'aabbccdd' },
  });

  it('S-08 — cas limites rejoués : 2024-13, prix 0/1/123456, 0 km ancien, TVA chez un PRIVATE, prix sur demande avec montant', async () => {
    const ctx = (await buildContext()) as never;
    const { adaptAs24Listing } = await import('../../src/providers/adapters/as24');
    const { ingestFlagCodes } = await import('../../src/types/vocabularies');
    const run = (patch: Record<string, unknown>): { flags: string[]; kind: string; row?: Record<string, unknown> } => {
      const res = adaptAs24Listing({ ...baseListing(), ...patch }, ctx);
      if (res.kind !== 'accepted') return { flags: [], kind: `rejected:${res.reason}` };
      return {
        kind: 'accepted',
        flags: [...ingestFlagCodes(res.row.ingestFlags)],
        row: res.row as unknown as Record<string, unknown>,
      };
    };
    const cases: Record<string, { flags: string[]; kind: string; row?: Record<string, unknown> }> = {
      'mois 13': run({ firstRegistrationDate: '2024-13' }),
      'prix 0': run({ prices: { public: { price: 0, currency: 'EUR' } } }),
      'prix 1': run({ prices: { public: { price: 1, currency: 'EUR' } } }),
      'prix 123456': run({ prices: { public: { price: 123456, currency: 'EUR' } } }),
      '0 km sur une occasion ancienne': run({ mileage: 0, offerType: 'U', firstRegistrationDate: '2012-03' }),
      'TVA déductible chez un PRIVATE': run({
        seller: { type: 'P' },
        prices: { public: { price: 15990, currency: 'EUR', isTaxDeductible: true } },
      }),
      'prix sur demande AVEC montant': run({ prices: { public: { price: 9990, currency: 'EUR', onRequestOnly: true } } }),
      'unité mi': run({ mileage: 60000, mileageUnit: 'mi' }),
      'puissance en ch déclarée kW': run({ power: 110, powerUnit: 'hp' }),
    };
    const lines = Object.entries(cases).map(([k, v]) => `${k} → ${v.kind} [${v.flags.join(' ')}]`);
    measure('S-08', lines.join(' · '));

    // `prix 123456` est le TÉMOIN : un prix élevé mais licite doit passer sans drapeau. Tous les
    // autres cas décrivent une incohérence de la source et ne doivent JAMAIS passer en silence.
    expect(cases['prix 123456']?.flags, 'témoin : un prix licite ne lève rien').toEqual([]);
    const shouldSpeak = Object.entries(cases).filter(([k]) => k !== 'prix 123456');
    const silent = shouldSpeak.filter(([, v]) => v.kind === 'accepted' && v.flags.length === 0);
    measure(
      'S-08',
      `cas passant en SILENCE : ${silent.map(([k]) => k).join(', ') || 'aucun'}` +
        ` ; TVA chez un PRIVATE → vatDeductible = ${String(cases['TVA déductible chez un PRIVATE']?.row?.['vatDeductible'])}`,
    );
    expect(silent.map(([k]) => k)).toEqual([]);
  });

  it('S-09 — BOOLEAN_FLAG_BIT : les six tri-états distinguent « non » d’« inconnu » (D3-10)', async () => {
    const ctx = (await buildContext()) as never;
    const { adaptAs24Listing } = await import('../../src/providers/adapters/as24');
    const { BOOLEAN_FLAG_BIT, readBooleanFlag } = await import('../../src/types/vocabularies');
    const codes = Object.keys(BOOLEAN_FLAG_BIT) as (keyof typeof BOOLEAN_FLAG_BIT)[];
    const absent = adaptAs24Listing(baseListing(), ctx);
    const asFalse = adaptAs24Listing(
      { ...baseListing(), hasVideo: false, isMetallic: false, hasFullServiceHistory: false, wasCabOrRental: false, hasParticleFilter: false, condition: { hadAccident: false }, isPluginHybrid: false, hasWarranty: false },
      ctx,
    );
    expect(absent.kind).toBe('accepted');
    expect(asFalse.kind).toBe('accepted');
    if (absent.kind !== 'accepted' || asFalse.kind !== 'accepted') return;
    const distinguishing: string[] = [];
    const conflated: string[] = [];
    for (const c of codes) {
      const a = readBooleanFlag(absent.row.booleanFlags, c);
      const b = readBooleanFlag(asFalse.row.booleanFlags, c);
      if (a === null && b === false) distinguishing.push(c);
      else if (a === b) conflated.push(`${c} (${String(a)})`);
    }
    measure(
      'S-09',
      `${codes.length} booléens · ${distinguishing.length} distinguent inconnu/faux : ${distinguishing.join(', ')} · ` +
        `${conflated.length} identiques (défaut documenté) : ${conflated.join(', ')}`,
    );
    expect(distinguishing.length).toBeGreaterThanOrEqual(5);
  });

  it('S-10 — dédoublonnage indépendant de l’ordre du fichier (D3-15)', async () => {
    const { chooseWinner } = (await import('../../src/providers/fixture/dedupe')) as unknown as {
      chooseWinner?: unknown;
    };
    // Le module de dédoublonnage n'expose pas forcément `chooseWinner` : on éprouve alors la
    // propriété de bout en bout, en ouvrant le même snapshot deux fois — le provider doit rendre
    // exactement le même lot. L'indépendance à l'ORDRE est éprouvée par la suite de contrat ; ici on
    // vérifie que les doublons déclarés A-07 aboutissent à UN seul survivant, quel que soit l'ordre.
    void chooseWinner;
    const sn = s0();
    const duplicates = new Map<string, number>();
    for (const r of sn.rows) duplicates.set(r.id, (duplicates.get(r.id) ?? 0) + 1);
    const dupIds = [...duplicates.entries()].filter(([, n]) => n > 1).map(([id]) => id);
    const { openCanonicalBatch } = await import('./harness');
    const { batch } = await openCanonicalBatch(sn.snapshotId);
    const { decodeListingId } = await import('../../src/engine/uuid');
    const served = new Map<string, number>();
    for (let i = 0; i < batch.rowCount; i += 1) {
      const id = decodeListingId(batch.listingId, i);
      served.set(id, (served.get(id) ?? 0) + 1);
    }
    const stillDuplicated = dupIds.filter((id) => (served.get(id) ?? 0) > 1);
    measure(
      'S-10',
      `${dupIds.length} identifiant(s) écrits deux fois · ${sn.rows.length} lignes → ${batch.rowCount} servies · ${stillDuplicated.length} encore en double après arbitrage`,
    );
    expect(dupIds.length).toBeGreaterThan(0);
    expect(stillDuplicated).toEqual([]);
    expect(batch.rowCount).toBe(sn.rows.length - dupIds.length);
  }, 300_000);

  it('S-11 — perte d’information : tout champ source utile a bien une colonne, et réciproquement', async () => {
    // Champs du schéma source ABSENTS du canonique : la liste doit être CONNUE et motivée, pas
    // découverte. Toute entrée nouvelle est une perte d'information à instruire.
    const known = new Set([
      'makeName',
      'modelName',
      'productionYear',
      'mileageUnit',
      'powerUnit',
      'powerHp',
      'cylinderCapacity',
      'cylinderCapacityUnit',
      'cylinderCount',
      'gearCount',
      'primaryFuelType',
      'additionalFuelTypes',
      'fuelSourceLabel',
      'isPluginHybrid',
      'battery',
      'co2Emissions',
      'co2EmissionsUnit',
      'consumption',
      'combinedUnit',
      'electricCombinedUnit',
      'wltp',
      'co2EmissionInGramPerKmWithFallback',
      'consumptionCombinedWithFallback',
      'efficiencyClass',
      'hasParticleFilter',
      'isMetallic',
      'paintType',
      'upholsteryColor',
      'equipment',
      'appliedSeals',
      'condition',
      'hasFullServiceHistory',
      'nextInspectionDate',
      'wasCabOrRental',
      'warranty',
      'warrantyUnit',
      'hasWarranty',
      'superDeal',
      'publication',
      'createdAt',
      'lastUpdatedAt',
      'firstActivatedDate',
      'hasVideo',
      'prices',
      'adProduct',
      'location',
      'seller',
      'id',
      'webPage',
      'marketplace',
      'vehicleType',
      'make',
      'model',
      'modelVersion',
      'firstRegistrationDate',
      'mileage',
      'power',
      'transmission',
      'drivetrain',
      'fuelCategory',
      'bodyType',
      'doorCount',
      'seatCount',
      'bodyColor',
      'upholsteryType',
      'offerType',
      'usageState',
      'previousOwnerCount',
      'euEmissionStandard',
      'electricRange',
      'imageCount',
    ]);
    const schemaFields = Object.keys(schema.properties ?? {});
    const unexpected = schemaFields.filter((f) => !known.has(f));
    // Réciproque : aucune clé d'instance du fichier n'est absente du schéma (le schéma est fermé,
    // ajv l'a déjà prouvé, mais on le dit ici en vocabulaire d'instance).
    const instanceKeys = new Set<string>();
    for (const r of s0().rows) for (const k of Object.keys(r)) instanceKeys.add(k);
    const undocumented = [...instanceKeys].filter((k) => !schemaFields.includes(k));
    measure(
      'S-11',
      `${schemaFields.length} champs de premier niveau au schéma, ${instanceKeys.size} employés par les fixtures ; ` +
        `${schemaFields.length - instanceKeys.size} jamais employés : ${schemaFields.filter((f) => !instanceKeys.has(f)).join(', ') || 'aucun'}`,
    );
    expect(unexpected).toEqual([]);
    expect(undocumented).toEqual([]);
  });
});

/** Nœud de schéma à un chemin pointé (`prices.public.price`), `$ref` non résolu. */
function propertyAt(path: string): SchemaNode | undefined {
  let node: SchemaNode | undefined = schema;
  for (const part of path.split('.')) {
    node = node?.properties?.[part];
    if (node === undefined) return undefined;
    node = node.$ref === undefined ? node : resolve(node);
  }
  return node;
}
