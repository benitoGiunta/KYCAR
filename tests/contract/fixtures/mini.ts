/**
 * KYCAR — Mini-jeu de fixtures DÉTERMINISTE pour la suite de contrat (phase 3.3)
 * =================================================================================================
 * `data/fixtures/` est le livrable de `dataset-gen` (phase 3.2), produit dans un autre worktree. La
 * suite de contrat ne peut pas l'attendre pour exister : elle a besoin d'un jeu **du même format**
 * — NDJSON gzip + `manifest.json` + `index.json` de profil — pour exercer le provider de bout en
 * bout dès maintenant.
 *
 * Ce module fabrique donc, À PARTIR DE `data/schema/examples/full.json` et par variations
 * déterministes, un profil de trois snapshots :
 *
 *   - `mini-1` et `mini-2` : ~200 lignes CONFORMES au schéma chacune, deux `capturedAt` distincts
 *     (le second est « le plus récent » : c'est lui que le provider doit choisir par défaut), avec
 *     un doublon d'identifiant délibéré et déclaré en vérité terrain ;
 *   - `mini-dirty` : quelques lignes délibérément NON conformes (R3, hôte étranger, identifiant
 *     illisible, `vehicleType` autre que voiture, JSON cassé) pour exercer `rejectedByReason` —
 *     elles ne sont PAS comptées comme « conformes au schéma », et le manifest le dit.
 *
 * **Écrit hors du dépôt** (répertoire temporaire du système) : un artefact binaire régénérable n'a
 * rien à faire dans git, et l'écrire hors de l'arbre supprime tout risque de le commiter par
 * inadvertance. La graine est fixe : deux exécutions produisent les mêmes octets, ce que la suite
 * de contrat vérifie.
 *
 * Module de TEST uniquement (`node:fs`, `node:zlib`) : aucun fichier de `src/` ne l'importe.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

/** Racine du mini-profil sur disque (créée à la demande). */
export const MINI_ROOT = resolve(tmpdir(), 'kycar-fixture-mini');
/** Nom du profil servi par ce jeu. */
export const MINI_PROFILE = 'dev';
/** Effectif de chaque snapshot conforme. */
export const MINI_LINES = 200;
/** Identifiant du snapshot le plus récent (celui que le provider choisit par défaut). */
export const MINI_LATEST_SNAPSHOT_ID = 'be-20260914T060000Z';
/** Identifiant du snapshot le plus ancien (choix explicite). */
export const MINI_OLDEST_SNAPSHOT_ID = 'be-20260907T060000Z';
/** Identifiant du snapshot volontairement sale (rejets d'ingestion). */
export const MINI_DIRTY_SNAPSHOT_ID = 'be-20260921T060000Z';

/** Générateur congruentiel 32 bits : même graine, mêmes octets (critère de déterminisme). */
function makePrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0x1_0000_0000;
  };
}

/** Couples `(make, model)` RÉELS de `data/reference/taxonomy.json` : la résolution est testée pour de vrai. */
const TAXONOMY: readonly (readonly [number, number, string, string])[] = [
  [74, 2084, 'Volkswagen', 'Golf'],
  [74, 2090, 'Volkswagen', 'Polo'],
  [54, 1918, 'Opel', 'Corsa'],
  [54, 1916, 'Opel', 'Astra'],
];

/** Préfixes postaux belges couvrant plusieurs régions NUTS-2 (`EX-DATA-52`). */
const PREFIXES: readonly string[] = ['10', '20', '30', '40', '50', '60', '70', '80', '90'];

/** UUID canonique déterministe dérivé d'un compteur (jamais aléatoire : le fichier doit être stable). */
function uuidOf(n: number): string {
  const hex = createHash('sha256').update(`kycar-mini-${n}`).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Ordre de clés FIXE, À TOUS LES NIVEAUX : condition du déterminisme octet à octet
 * (`DATA-MODEL` §7-25). Écrit à la main plutôt que par le second argument de `JSON.stringify` :
 * un remplaçant en TABLEAU filtre les propriétés de TOUS les niveaux par la même liste, ce qui
 * viderait silencieusement `prices.public` et `location` de leur contenu.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

function stableLine(listing: Record<string, unknown>): string {
  return stableStringify(listing);
}

interface BuiltSnapshot {
  readonly snapshotId: string;
  readonly capturedAt: string;
  readonly lines: readonly string[];
  readonly groundTruth: readonly Record<string, unknown>[];
}

/** Fabrique une ligne conforme au schéma, dérivée de `full.json`. */
function buildListing(base: Record<string, unknown>, i: number, rnd: () => number, capturedAt: string): Record<string, unknown> {
  const [make, model, makeName, modelName] = TAXONOMY[i % TAXONOMY.length] as readonly [number, number, string, string];
  const id = uuidOf(i);
  const year = 2014 + (i % 12);
  const month = 1 + (i % 12);
  const isDealer = i % 10 !== 0; // ~90 % de professionnels, dont un tiers de TVA déductible
  const price = 3_500 + Math.floor(rnd() * 42_000);
  const mileage = 5_000 + Math.floor(rnd() * 240_000);
  const nedcBranch = i % 3 === 0; // une annonce sur trois porte la branche NEDC (C-13, branches exclusives)

  const listing: Record<string, unknown> = {
    ...base,
    id,
    webPage: `https://www.autoscout24.be/offres/${id}`,
    make,
    makeName,
    model,
    modelName,
    modelVersion: `${(1.0 + (i % 9) / 10).toFixed(1)} ${modelName} Edition ${i % 5}`,
    productionYear: year,
    firstRegistrationDate: `${year}-${String(month).padStart(2, '0')}`,
    mileage,
    imageCount: 3 + (i % 20),
    previousOwnerCount: i % 4,
    createdAt: capturedAt,
    lastUpdatedAt: capturedAt,
    firstActivatedDate: capturedAt,
    location: { countryCode: 'BE', postalCodePrefix2: PREFIXES[i % PREFIXES.length] as string },
    seller: isDealer
      ? { type: 'D', dealerBucket: createHash('sha256').update(`bucket-${i % 17}`).digest('hex').slice(0, 8) }
      : { type: 'P' },
    prices: {
      public:
        i % 25 === 0
          ? { onRequestOnly: true } // ~4 % de prix sur demande (EX-DATA-17 : la part affichée reste >= 80 %)
          : {
              price,
              currency: 'EUR',
              isTaxDeductible: isDealer && i % 3 === 0,
              onRequestOnly: false,
              evaluation: { category: 1 + (i % 3) },
            },
    },
    publication: { status: 'Active', accurateState: 'active', isNew: i % 15 === 0 },
    superDeal: i % 31 === 0,
    hasVideo: i % 12 === 0,
  };

  if (i % 7 === 0) delete listing['adProduct']; // < 30 % de paliers publicitaires (EX-DATA-43)
  else listing['adProduct'] = { tier: (['T20', 'T30', 'T40', 'T50'] as const)[i % 4] };

  // Branches de mesure EXCLUSIVES (C-13) : `wltp` OU (`co2Emissions`, `consumption`, `efficiencyClass`).
  if (nedcBranch) {
    delete listing['wltp'];
    listing['co2Emissions'] = 95 + Math.floor(rnd() * 80);
    listing['consumption'] = { combined: Number((4 + rnd() * 5).toFixed(1)) };
    listing['efficiencyClass'] = 1 + (i % 10);
    listing['co2EmissionInGramPerKmWithFallback'] = listing['co2Emissions'];
    listing['consumptionCombinedWithFallback'] = (listing['consumption'] as { combined: number }).combined;
  } else {
    delete listing['co2Emissions'];
    delete listing['consumption'];
    delete listing['efficiencyClass'];
    const co2 = 20 + Math.floor(rnd() * 60);
    listing['wltp'] = {
      co2EmissionsCombined: co2,
      consumptionCombined: Number((1 + rnd() * 3).toFixed(1)),
      consumptionElectricCombined: Number((14 + rnd() * 6).toFixed(1)),
      co2Class: ([10, 20, 30, 40, 50, 60, 70] as const)[i % 7],
    };
    listing['co2EmissionInGramPerKmWithFallback'] = co2;
    listing['consumptionCombinedWithFallback'] = (listing['wltp'] as { consumptionCombined: number }).consumptionCombined;
  }

  return listing;
}

/** Construit un snapshot conforme de `MINI_LINES` lignes, doublon d'identifiant compris. */
function buildConformingSnapshot(base: Record<string, unknown>, snapshotId: string, capturedAt: string, seed: number): BuiltSnapshot {
  const rnd = makePrng(seed);
  const lines: string[] = [];
  for (let i = 0; i < MINI_LINES; i += 1) {
    lines.push(stableLine(buildListing(base, i, rnd, capturedAt)));
  }
  // Doublon d'identifiant DÉLIBÉRÉ (EX-DATA-15 / ARB-54) : la seconde occurrence porte un prix et un
  // kilométrage différents, donc un CONFLIT DE VALEUR, et elle est MOINS complète (pas d'équipement).
  const duplicate = buildListing(base, 0, makePrng(seed), capturedAt);
  duplicate['prices'] = { public: { price: 9_999, currency: 'EUR', onRequestOnly: false } };
  duplicate['mileage'] = 123_456;
  delete duplicate['equipment'];
  delete duplicate['appliedSeals'];
  lines.push(stableLine(duplicate));

  return {
    snapshotId,
    capturedAt,
    lines,
    groundTruth: [
      {
        listingId: uuidOf(0),
        anomaly: 'DUPLICATE_LISTING_ID',
        detail: 'deuxieme occurrence du meme identifiant, moins complete et divergente sur le prix',
        expected: { ingestFlag: 'DUPLICATE_VALUE_CONFLICT' },
      },
    ],
  };
}

/** Construit le snapshot volontairement sale : une ligne par motif de rejet. */
function buildDirtySnapshot(base: Record<string, unknown>, capturedAt: string): BuiltSnapshot {
  const good = buildListing(base, 1, makePrng(7), capturedAt);
  const lines: string[] = [
    stableLine(good),
    // R3 : un nom de propriété interdit — la ligne n'entre pas.
    stableLine({ ...buildListing(base, 2, makePrng(8), capturedAt), seller: { type: 'D', companyName: 'Garage exemple' } }),
    // EX-DATA-14 : hôte hors du domaine attendu.
    stableLine({ ...buildListing(base, 3, makePrng(9), capturedAt), webPage: 'https://www.example.com/offres/x' }),
    // # 1 : identifiant illisible.
    stableLine({ ...buildListing(base, 4, makePrng(10), capturedAt), id: 'pas-un-uuid' }),
    // # 6 : ce n'est pas une voiture.
    stableLine({ ...buildListing(base, 5, makePrng(11), capturedAt), vehicleType: 'B' }),
    // # 16 : marque absente de la taxonomie.
    stableLine({ ...buildListing(base, 6, makePrng(12), capturedAt), make: 999_999 }),
    // Ligne non parsable : le provider la compte, il ne s'arrête pas.
    '{"id": "tronquee"',
  ];
  return {
    snapshotId: MINI_DIRTY_SNAPSHOT_ID,
    capturedAt,
    lines,
    groundTruth: [],
  };
}

function writeSnapshot(root: string, profile: string, snap: BuiltSnapshot, seed: number): void {
  const dir = resolve(root, profile, snap.snapshotId);
  mkdirSync(dir, { recursive: true });
  const text = `${snap.lines.join('\n')}\n`;
  const bytes = Buffer.from(text, 'utf-8');
  const gz = gzipSync(bytes, { level: 9 });
  writeFileSync(resolve(dir, 'listings.ndjson.gz'), gz);
  const manifest = {
    snapshotId: snap.snapshotId,
    capturedAt: snap.capturedAt,
    marketplace: 'be',
    profile,
    seed,
    schemaVersion: '1.0.0',
    generator: { name: 'kycar-contract-mini', version: '1.0.0' },
    file: 'listings.ndjson.gz',
    listingCount: snap.lines.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sha256Gz: createHash('sha256').update(gz).digest('hex'),
    uncompressedBytes: bytes.byteLength,
    compressedBytes: gz.byteLength,
    previousSnapshotId: null,
    groundTruth: snap.groundTruth,
    note: 'Mini-jeu de la suite de contrat (phase 3.3). Sans rapport avec un jeu de fixtures reel.',
  };
  writeFileSync(resolve(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`, 'utf-8');
}

/** Ce que la construction du mini-jeu rend à la suite de contrat. */
export interface MiniFixtureSet {
  readonly root: string;
  readonly profile: string;
  readonly latestSnapshotId: string;
  readonly oldestSnapshotId: string;
  readonly dirtySnapshotId: string;
  /** Taille du fichier `.gz` du snapshot le plus récent, en octets. */
  readonly latestGzBytes: number;
}

/**
 * Écrit (ou réécrit) le mini-jeu et rend ses coordonnées. Idempotent et déterministe : appelé deux
 * fois, il produit les mêmes octets — la suite de contrat s'en sert pour prouver le déterminisme.
 */
export function buildMiniFixtures(root: string = MINI_ROOT): MiniFixtureSet {
  const base = JSON.parse(
    readFileSync(resolve(process.cwd(), 'data/schema/examples/full.json'), 'utf-8'),
  ) as Record<string, unknown>;
  mkdirSync(resolve(root, MINI_PROFILE), { recursive: true });

  writeSnapshot(root, MINI_PROFILE, buildConformingSnapshot(base, MINI_OLDEST_SNAPSHOT_ID, '2026-09-07T06:00:00Z', 0x4b594341), 0x4b594341);
  writeSnapshot(root, MINI_PROFILE, buildConformingSnapshot(base, MINI_LATEST_SNAPSHOT_ID, '2026-09-14T06:00:00Z', 0x4b594342), 0x4b594342);
  writeSnapshot(root, MINI_PROFILE, buildDirtySnapshot(base, '2026-09-21T06:00:00Z'), 0x4b594343);

  const gzPath = resolve(root, MINI_PROFILE, MINI_LATEST_SNAPSHOT_ID, 'listings.ndjson.gz');
  return {
    root,
    profile: MINI_PROFILE,
    latestSnapshotId: MINI_LATEST_SNAPSHOT_ID,
    oldestSnapshotId: MINI_OLDEST_SNAPSHOT_ID,
    dirtySnapshotId: MINI_DIRTY_SNAPSHOT_ID,
    latestGzBytes: existsSync(gzPath) ? readFileSync(gzPath).byteLength : 0,
  };
}
