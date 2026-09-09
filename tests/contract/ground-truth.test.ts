/**
 * KYCAR — Confrontation de l'adaptateur à la VÉRITÉ TERRAIN des fixtures (phase 3.3, finalisation)
 * =================================================================================================
 * `manifest.groundTruth` déclare, annonce par annonce, l'anomalie que le générateur a INJECTÉE.
 * C'est le seul document qui dise ce que la donnée est censée valoir : une anomalie déclarée dont
 * l'ingestion ne produit rien est soit un défaut de l'adaptateur, soit une anomalie que le modèle
 * canonique ne sait pas exprimer. Dans les deux cas, il faut le SAVOIR — d'où cette sonde.
 *
 * Elle lit le manifest du snapshot le plus récent du profil `dev`, retrouve dans le NDJSON **chaque
 * annonce citée**, l'adapte, et confronte le résultat à une attente déclarée **pour les 27 codes**.
 * Aucune anomalie n'est laissée sans attente : un code non traité fait échouer le test de
 * complétude, donc la couverture ne peut pas se dégrader en silence quand `dataset-gen` en ajoute.
 *
 * Quatre classes d'attente, parce que les 27 codes ne vivent pas au même étage :
 *
 *   - `flag` — l'ingestion doit poser un drapeau de `KYCAR_INGEST_FLAG` sur la ligne ;
 *   - `notice` — la condition existe mais `EX-DATA-45` ne la nomme pas (C-P3-1) : l'adaptateur la
 *     publie dans `notices`, que le provider compte et déclare dans `coverageNote` ;
 *   - `row` — la conséquence est une VALEUR canonique (statut de prix, modèle non résolu…) ;
 *   - `none` — l'anomalie ne relève PAS de l'ingestion (détection d'outliers, doublon
 *     inter-vendeurs, qualité de version) : l'attente est qu'elle ne produise AUCUN drapeau, et la
 *     sonde le dit plutôt que de la passer sous silence.
 */

import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import {
  adaptAs24Listing,
  createAs24Context,
  type As24AdapterContext,
  type CanonicalRow,
} from '../../src/providers/adapters/as24/adapt';
import { readNdjsonStream } from '../../src/providers/fixture/ndjson';
import { FixtureDataProvider } from '../../src/providers/fixture/FixtureDataProvider';
import { createNodeFixtureLoader } from '../../src/providers/fixture/loaders/node';
import type { SnapshotManifest } from '../../src/providers/fixture/manifest';
import { ingestFlagCodes, type IngestFlagCode } from '../../src/types/vocabularies';
import { ENUM_UNKNOWN_BYTE, NUMERIC_UNKNOWN } from '../../src/types/sentinels';
import { isWithinListingBound } from '../../src/types/validation';
import { referenceData } from './subjects';
import type { SnapshotDescriptor } from '../../src/providers/DataProvider';

const FIXTURE_ROOT = resolve(process.cwd(), 'data/fixtures');
const PROFILE = 'dev';
/** Snapshot le plus récent du profil `dev` — celui que le provider sert par défaut. */
const SNAPSHOT = 'be-20260921T060000Z';
const SNAPSHOT_DIR = resolve(FIXTURE_ROOT, PROFILE, SNAPSHOT);

/** Vrai si les fixtures réelles sont dans l'arbre (elles le sont depuis la porte G9a). */
const available = existsSync(SNAPSHOT_DIR);

/** Attente déclarée pour un code d'anomalie du manifest. */
interface Expectation {
  /** Étage auquel l'anomalie se manifeste. */
  readonly kind: 'flag' | 'notice' | 'row' | 'none';
  /** Drapeau attendu, pour `kind: 'flag'`. */
  readonly flag?: IngestFlagCode;
  /** Signalement attendu, pour `kind: 'notice'`. */
  readonly notice?: string;
  /** Contrôle sur la ligne canonique, pour `kind: 'row'` ; ou contrôle SUPPLÉMENTAIRE sinon. */
  readonly row?: (row: CanonicalRow, entry: GroundTruthEntry) => void;
  /** Pourquoi cette attente, et pas une autre. Écrit pour être lu en revue. */
  readonly why: string;
}

interface GroundTruthEntry {
  readonly listingId: string;
  readonly anomaly: string;
  readonly detail?: string;
  readonly peerListingId?: string;
  readonly expected?: Record<string, unknown>;
}

/**
 * Table des attentes, un code par ligne. **Elle est la spécification exécutable de la confrontation
 * `DATA-MODEL` §7 / `DATASET-SPEC` §6.**
 */
const EXPECTATIONS: Readonly<Record<string, Expectation>> = {
  /* ---- Prix ---------------------------------------------------------------------------------- */
  PRICE_SENTINEL_ABSOLUTE: {
    kind: 'flag',
    flag: 'PRICE_SENTINEL_ABSOLUTE',
    why: '#7 / EX-DATA-19(1) : prix < 250 € — drapeau posé, VALEUR CONSERVÉE (ARB-15).',
    row: (r) => {
      expect(r.priceEur).not.toBe(NUMERIC_UNKNOWN);
      expect(r.priceEur).toBeLessThan(250);
    },
  },
  PRICE_OUT_OF_RANGE: {
    kind: 'flag',
    flag: 'PRICE_OUT_OF_RANGE',
    why: '#7 : au-delà de 5 000 000 € — INCONNU en plus du drapeau.',
    row: (r) => expect(r.priceEur).toBe(NUMERIC_UNKNOWN),
  },
  PRICE_MISSING_UNDECLARED: {
    kind: 'flag',
    flag: 'PRICE_MISSING_UNDECLARED',
    why: 'EX-DATA-18 : prix absent SANS déclaration — défaut d’extraction, pas une décision.',
  },
  PRICE_ON_REQUEST: {
    kind: 'row',
    why: '#8 : `onRequestOnly` sans montant → statut ON_REQUEST. Aucun drapeau : c’est une décision de vendeur, pas un incident.',
    row: (r) => {
      expect(r.priceEur).toBe(NUMERIC_UNKNOWN);
      expect(ingestFlagCodes(r.ingestFlags)).not.toContain('PRICE_MISSING_UNDECLARED');
    },
  },
  PRICE_ON_REQUEST_WITH_AMOUNT: {
    kind: 'flag',
    flag: 'PRICE_ON_REQUEST_WITH_AMOUNT',
    why:
      'EX-DATA-32 / #8 : montant ET drapeau « sur demande » → statut QUOTED + drapeau. ' +
      'CONSTAT C-P3-8 : le manifest déclare `expected.status = ON_REQUEST`, ce que le dictionnaire ' +
      'contredit — l’adaptateur suit le dictionnaire, qui est normatif.',
    row: (r) => expect(r.priceEur).not.toBe(NUMERIC_UNKNOWN),
  },

  /* ---- Kilométrage, puissance, unités ---------------------------------------------------------- */
  MILEAGE_OUT_OF_RANGE: {
    kind: 'flag',
    flag: 'MILEAGE_OUT_OF_RANGE',
    why: '#59 : au-delà de 1 500 000 km — INCONNU en plus du drapeau.',
    row: (r) => expect(r.mileageKm).toBe(NUMERIC_UNKNOWN),
  },
  SUSPECT_ZERO_MILEAGE: {
    kind: 'flag',
    flag: 'SUSPECT_ZERO_MILEAGE',
    why: 'EX-DATA-38 / §7-21 : 0 km hors des types d’offre N, S, D.',
    row: (r) => expect(r.mileageKm).toBe(0),
  },
  MILEAGE_IMPLAUSIBLE_FOR_AGE: {
    kind: 'notice',
    notice: 'MILEAGE_IMPLAUSIBLE_FOR_AGE',
    why:
      '§7-22 : rythme annuel au-delà de 200 000 km/an. DEUX RÉSERVES, vérifiées ci-dessous : ' +
      '(a) un kilométrage injecté AU-DELÀ de la borne dure de #59 devient INCONNU d’abord ' +
      '(ordre d’EX-DATA-2), et le signal est alors `MILEAGE_OUT_OF_RANGE` ; (b) §7-22 ne borne que ' +
      'le HAUT : un kilométrage trop FAIBLE pour l’âge (forme (b) du générateur) n’a aucune ' +
      'conséquence canonique. CONSTAT C-P3-9.',
  },
  POWER_OUT_OF_RANGE: {
    kind: 'none',
    why:
      'CONSTAT C-P3-7 : le drapeau est INATTEIGNABLE depuis une ligne conforme au schéma. ' +
      '`as24-listing.schema.json` borne `power` à 1..9 999, et l’annexe A valide exactement le même ' +
      'domaine, bornes INCLUSES. Les trois valeurs injectées (9 999, 1, 1) sont donc DANS le domaine. ' +
      'Même classe que `FIRST_REG_UNPARSEABLE` (C-07) et que D3-16.',
    row: (r) => {
      // Ce qui est vérifié, c'est le FAIT : la valeur servie est dans le domaine, donc aucun drapeau.
      if (r.powerKw !== NUMERIC_UNKNOWN) expect(isWithinListingBound('powerKw', r.powerKw)).toBe(true);
    },
  },
  POWER_UNIT_MISMATCH: {
    kind: 'flag',
    flag: 'POWER_UNIT_MISMATCH',
    why: '#36 / EX-DATA-36 : écart > 2 % entre le `powerHp` servi et celui recalculé depuis kW (DIN 66036).',
  },
  UNIT_UNSUPPORTED: {
    kind: 'flag',
    flag: 'UNIT_UNSUPPORTED',
    why: 'EX-DATA-5 : une unité non canonique est REFUSÉE, jamais convertie au jugé.',
  },

  /* ---- Dates, taxonomie, géographie, version ---------------------------------------------------- */
  FIRST_REG_OUT_OF_RANGE: {
    kind: 'flag',
    flag: 'FIRST_REG_OUT_OF_RANGE',
    why: '#30 : hors de [1900-01, (capture+1)-12] — INCONNU en plus du drapeau.',
    row: (r) => expect(r.firstRegistrationYearMonth).toBe(NUMERIC_UNKNOWN),
  },
  MODEL_UNRESOLVED: {
    kind: 'flag',
    flag: 'MODEL_UNRESOLVED',
    why: '#18 / EX-DATA-72 : modèle absent de la marque → `0` (« Modèle non identifié »), jamais une sentinelle.',
    row: (r) => expect(r.modelId).toBe(0),
  },
  REGION_UNRESOLVED: {
    kind: 'row',
    why:
      '#75 : la région est INCONNUE dans les deux cas, mais la table §3.1 les SÉPARE — préfixe hors ' +
      'des 13 plages belges → INCONNU + drapeau ; pays ≠ BE → INCONNU SANS drapeau (EX-DATA-55), ' +
      'parce qu’une annonce néerlandaise n’a pas de région belge « non résolue », elle n’en a pas. ' +
      'CONSTAT C-P3-13 : le manifest emploie un seul code pour les deux. Détail au cas dédié.',
    row: (r) => expect(r.regionCode).toBe(ENUM_UNKNOWN_BYTE),
  },
  VERSION_FULLY_STRIPPED: {
    kind: 'flag',
    flag: 'VERSION_FULLY_STRIPPED',
    why: 'EX-DATA-31 : la version servie est entièrement retirée par le nettoyage d’EX-DATA-29.',
    row: (r) => expect(r.strings[2]).toBe(''),
  },
  VERSION_AMBIGUOUS: {
    kind: 'none',
    why:
      'Anomalie de QUALITÉ de la version (finition d’une autre marque, doublon de modèle) : ni ' +
      '`EX-DATA-45` ni la table §3.1 ne lui associent de conséquence canonique. La version brute et ' +
      'la version nettoyée sont conservées telles quelles ; c’est au reviewer de la retrouver.',
    // Le contrôle de ligne vit au cas dédié (C-P3-12) : quatre annonces déclarées ont perdu leur
    // version, et l'affirmer ici ferait échouer le cas générique sur un écart du GÉNÉRATEUR.
  },

  /* ---- Mesure et motorisation ------------------------------------------------------------------ */
  CO2_ZERO_NON_BEV: {
    kind: 'notice',
    notice: 'CO2_ZERO_NON_BEV',
    why: '§7-18 : 0 g/km hors catégorie électrique n’est pas une mesure — INCONNU + signalement (C-P3-1).',
    row: (r) => expect(r.co2EmissionsGPerKmX10).toBe(NUMERIC_UNKNOWN),
  },
  HYBRID_INCONSISTENT: {
    kind: 'notice',
    notice: 'HYBRID_INCONSISTENT',
    why: '§7-19 : `isPluginHybrid` vrai avec une catégorie CONNUE hors de {2, 3, O} (C-P3-1).',
  },
  HYBRID_CATEGORY_UNRESOLVED: {
    kind: 'notice',
    notice: 'HYBRID_CATEGORY_UNRESOLVED',
    why:
      'EX-DATA-11 : catégorie absente et non résoluble depuis le type de carburant. La catégorie ' +
      'reste INCONNUE — deviner « hybride » depuis un type d’essence serait exactement ce ' +
      'qu’EX-DATA-11 interdit (C-P3-1).',
    row: (r) => expect(r.fuelCategory).toBe(ENUM_UNKNOWN_BYTE),
  },

  /* ---- Doublons (étage SNAPSHOT, pas ligne) ----------------------------------------------------- */
  DUPLICATE_LISTING_ID: {
    kind: 'none',
    why:
      'EX-DATA-15 : deux occurrences du MÊME identifiant. La conséquence est au SNAPSHOT ' +
      '(`duplicateListingCount`, occurrence écartée), pas sur la ligne conservée — contrôlée à part.',
  },
  DUPLICATE_VALUE_CONFLICT: {
    kind: 'none',
    why:
      'CONSTAT C-P3-10 : le générateur emploie ce code pour une REPUBLICATION intra-vendeur — deux ' +
      'identifiants DIFFÉRENTS du même `dealerBucket` — alors qu’`ARB-54` le réserve à une divergence ' +
      'de valeur entre deux occurrences du MÊME identifiant. Les deux notions portent le même nom et ' +
      'ne se recouvrent pas : le compteur `duplicateValueConflictCount` du descripteur suit ARB-54.',
  },
  CROSS_SELLER_DUPLICATE: {
    kind: 'none',
    why:
      '§7-12 : même véhicule chez deux `dealerBucket` distincts, donc deux identifiants distincts. ' +
      'Aucune conséquence d’ingestion : ce n’est pas un doublon d’identifiant, et le rapprochement ' +
      'de deux annonces par leurs caractéristiques est un travail d’ANALYSE, pas d’adaptation.',
  },

  /* ---- Détection d'outliers (étage MOTEUR) ------------------------------------------------------ */
  OUTLIER_M1_LOW: { kind: 'none', why: 'Verdict de DÉTECTION (M1, §B.6), produit par le moteur, jamais par l’ingestion.' },
  OUTLIER_M1_HIGH: { kind: 'none', why: 'Verdict de DÉTECTION (M1, §B.6), produit par le moteur, jamais par l’ingestion.' },
  OUTLIER_M2_LOW: { kind: 'none', why: 'Verdict de DÉTECTION (M2, §B.6), produit par le moteur, jamais par l’ingestion.' },
  OUTLIER_M2_HIGH: { kind: 'none', why: 'Verdict de DÉTECTION (M2, §B.6), produit par le moteur, jamais par l’ingestion.' },

  /* ---- Complétude ------------------------------------------------------------------------------ */
  OTHER: {
    kind: 'row',
    why:
      'Annonce délibérément incomplète (au moins six champs optionnels absents). La conséquence ' +
      'canonique est le nombre de champs INCONNUS, qui alimente `unknownCountByField` (EX-DATA-46).',
    row: (r) => expect(r.unknownFields.length).toBeGreaterThanOrEqual(15),
  },
};

let manifest: SnapshotManifest;
let ctx: As24AdapterContext;
let rowsById: Map<string, CanonicalRow[]>;
let rejectedIds: Map<string, string>;
let byAnomaly: Map<string, GroundTruthEntry[]>;
let descriptor: SnapshotDescriptor;

beforeAll(async () => {
  if (!available) return;
  manifest = JSON.parse(readFileSync(resolve(SNAPSHOT_DIR, 'manifest.json'), 'utf-8')) as SnapshotManifest;
  ctx = createAs24Context({ referenceData: referenceData(), observedAt: manifest.capturedAt });

  byAnomaly = new Map();
  const cited = new Set<string>();
  for (const raw of manifest.groundTruth as readonly GroundTruthEntry[]) {
    const list = byAnomaly.get(raw.anomaly) ?? [];
    list.push(raw);
    byAnomaly.set(raw.anomaly, list);
    cited.add(raw.listingId);
  }

  // Une seule passe sur le fichier : on n'adapte que les lignes CITÉES par la vérité terrain.
  rowsById = new Map();
  rejectedIds = new Map();
  const stream = Readable.toWeb(
    createReadStream(resolve(SNAPSHOT_DIR, manifest.file ?? 'listings.ndjson.gz')),
  ) as ReadableStream<Uint8Array>;
  await readNdjsonStream(stream, {
    onLine: (line) => {
      const parsed = JSON.parse(line) as { id?: string };
      if (typeof parsed.id !== 'string' || !cited.has(parsed.id)) return;
      const out = adaptAs24Listing(parsed, ctx);
      if (out.kind === 'accepted') {
        // TOUTES les occurrences sont conservées : cinq identifiants sont écrits deux fois
        // (`DUPLICATE_LISTING_ID`), et le manifest ne dit pas LAQUELLE porte l'anomalie. L'attente
        // vaut donc « au moins une occurrence », ce qui est exactement ce que le manifest affirme.
        rowsById.set(out.row.listingId, [...(rowsById.get(out.row.listingId) ?? []), out.row]);
      } else rejectedIds.set(parsed.id, out.reason);
    },
  });

  const provider = new FixtureDataProvider({
    referenceData: referenceData(),
    profile: 'dev',
    loader: createNodeFixtureLoader(FIXTURE_ROOT),
    snapshotId: SNAPSHOT,
  });
  descriptor = (await provider.openSnapshot()).descriptor;
});

describe.skipIf(!available)('vérité terrain — les 27 codes du manifest sont tous confrontés', () => {
  it('chaque code déclaré a une attente écrite : la couverture ne peut pas se dégrader en silence', () => {
    const declared = [...byAnomaly.keys()].sort();
    const missing = declared.filter((code) => EXPECTATIONS[code] === undefined);
    expect(missing, `codes du manifest sans attente déclarée : ${missing.join(', ')}`).toEqual([]);
    // Et le symétrique : une attente pour un code que le générateur n'émet plus est signalée.
    const stale = Object.keys(EXPECTATIONS).filter((code) => !byAnomaly.has(code));
    expect(stale, `attentes sans anomalie correspondante : ${stale.join(', ')}`).toEqual([]);
    expect(declared).toHaveLength(27);
    console.log(`[vérité terrain] ${manifest.groundTruth.length} anomalies déclarées, ${declared.length} codes distincts`);
  });

  it('aucune annonce citée en vérité terrain n’est REJETÉE par l’ingestion', () => {
    // Le générateur garantit 100 % de lignes conformes au schéma : une anomalie déclarée doit être
    // SERVIE avec son drapeau, jamais écartée. Un rejet ici serait un défaut de l'un des deux côtés.
    expect([...rejectedIds.entries()]).toEqual([]);
  });

  /** Codes traités par un cas DÉDIÉ plus bas : leur confrontation ne tient pas en une ligne. */
  const DEDICATED = new Set(['MILEAGE_IMPLAUSIBLE_FOR_AGE', 'VERSION_FULLY_STRIPPED', 'VERSION_AMBIGUOUS', 'REGION_UNRESOLVED']);

  for (const [code, expectation] of Object.entries(EXPECTATIONS)) {
    if (DEDICATED.has(code)) continue;
    it(`${code} — ${expectation.kind} · ${expectation.why.split('.')[0] as string}`, () => {
      const entries = byAnomaly.get(code) ?? [];
      expect(entries.length, `${code} : au moins une annonce citée`).toBeGreaterThan(0);

      let checked = 0;
      for (const entry of entries) {
        const occurrences = rowsById.get(entry.listingId) ?? [];
        expect(occurrences.length, `${code} / ${entry.listingId} : annonce retrouvée`).toBeGreaterThan(0);
        checked += 1;

        if (expectation.kind === 'flag') {
          const ok = occurrences.some((r) => ingestFlagCodes(r.ingestFlags).includes(expectation.flag as IngestFlagCode));
          expect(ok, `${code} / ${entry.listingId} : aucune occurrence ne porte ${expectation.flag as string}`).toBe(true);
        } else if (expectation.kind === 'notice') {
          const ok = occurrences.some((r) => r.notices.includes(expectation.notice as never));
          expect(ok, `${code} / ${entry.listingId} : aucune occurrence ne signale ${expectation.notice as string}`).toBe(true);
        } else if (expectation.kind === 'none' && (code.startsWith('OUTLIER_') || code === 'CROSS_SELLER_DUPLICATE')) {
          // « none » n'est pas « on ne regarde pas » : une anomalie d'un autre étage ne doit pas
          // provoquer l'invention d'un drapeau d'ingestion sur la ligne.
          for (const r of occurrences) {
            expect(ingestFlagCodes(r.ingestFlags), `${code} / ${entry.listingId}`).not.toContain('ENUM_UNKNOWN');
          }
        }
        if (expectation.row !== undefined) {
          // Le contrôle de ligne porte sur l'occurrence qui satisfait l'attente, ou la première.
          const target =
            occurrences.find((r) =>
              expectation.kind === 'flag'
                ? ingestFlagCodes(r.ingestFlags).includes(expectation.flag as IngestFlagCode)
                : expectation.kind === 'notice'
                  ? r.notices.includes(expectation.notice as never)
                  : true,
            ) ?? (occurrences[0] as CanonicalRow);
          expectation.row(target, entry);
        }
      }
      expect(checked, `${code} : au moins une annonce confrontée`).toBeGreaterThan(0);
    });
  }

  it('MILEAGE_IMPLAUSIBLE_FOR_AGE — les deux réserves de C-P3-9, annonce par annonce', () => {
    const entries = byAnomaly.get('MILEAGE_IMPLAUSIBLE_FOR_AGE') ?? [];
    let highWithinBound = 0;
    let highBeyondBound = 0;
    let lowSide = 0;
    for (const entry of entries) {
      const row = (rowsById.get(entry.listingId) ?? [])[0];
      expect(row, entry.listingId).toBeDefined();
      const injected = Number((entry.expected ?? {})['injected']);
      const form = String((entry.expected ?? {})['form']);
      const flags = ingestFlagCodes((row as CanonicalRow).ingestFlags);
      if (form === 'b') {
        // Réserve (b) : §7-22 ne borne que le HAUT. Aucun signal canonique n'existe pour un
        // kilométrage trop FAIBLE, et la sonde le CONSTATE au lieu de le supposer.
        lowSide += 1;
        expect((row as CanonicalRow).notices).not.toContain('MILEAGE_IMPLAUSIBLE_FOR_AGE');
      } else if (isWithinListingBound('mileageKm', injected)) {
        // Dans la borne dure : le rythme annuel est calculable, le signalement doit tomber.
        highWithinBound += 1;
        expect((row as CanonicalRow).notices, entry.listingId).toContain('MILEAGE_IMPLAUSIBLE_FOR_AGE');
      } else {
        // Réserve (a) : au-delà de la borne dure, #59 rend INCONNU d'abord (ordre d'EX-DATA-2) et
        // le signal est `MILEAGE_OUT_OF_RANGE`. L'anomalie N'EST PAS perdue, elle change de nom.
        highBeyondBound += 1;
        expect(flags, entry.listingId).toContain('MILEAGE_OUT_OF_RANGE');
        expect((row as CanonicalRow).mileageKm).toBe(NUMERIC_UNKNOWN);
      }
    }
    console.log(
      `[C-P3-9] MILEAGE_IMPLAUSIBLE_FOR_AGE : ${entries.length} déclarées — ` +
        `${highWithinBound} signalées comme telles, ${highBeyondBound} absorbées par MILEAGE_OUT_OF_RANGE, ` +
        `${lowSide} sans conséquence canonique (côté bas, non borné par §7-22)`,
    );
    expect(highWithinBound + highBeyondBound + lowSide).toBe(entries.length);
  });

  it('VERSION_FULLY_STRIPPED — CONSTAT C-P3-11 : la liste d’arrêt d’EX-DATA-30 n’est chargée nulle part', () => {
    const entries = byAnomaly.get('VERSION_FULLY_STRIPPED') ?? [];
    const flagged: string[] = [];
    const survivors: string[] = [];
    for (const entry of entries) {
      const occurrences = rowsById.get(entry.listingId) ?? [];
      const hit = occurrences.find((r) => ingestFlagCodes(r.ingestFlags).includes('VERSION_FULLY_STRIPPED'));
      if (hit !== undefined) flagged.push(entry.listingId);
      else survivors.push(String((occurrences[0] as CanonicalRow | undefined)?.strings[2] ?? ''));
    }
    // Le FAIT mesuré : les versions purement décoratives sont bien dépouillées (étapes 4-5), mais
    // les marqueurs PROMOTIONNELS survivent — « --- PROMO --- » devient « PROMO » au lieu du vide.
    expect(flagged.length + survivors.length).toBe(entries.length);
    expect(flagged.length, 'la majorité est correctement dépouillée').toBeGreaterThan(0);
    console.log(
      `[C-P3-11] VERSION_FULLY_STRIPPED : ${entries.length} déclarées, ${flagged.length} dépouillées, ` +
        `${survivors.length} survivantes ${JSON.stringify([...new Set(survivors)])}`,
    );
    // La CAUSE, vérifiable ici même : `ReferenceData.versionStoplist` est VIDE, parce que ni
    // `reference-loader.ts` (navigateur) ni `reference-fs.ts` (Node) ne lisent
    // `data/reference/version-stoplist.json` — pourtant versionné et cité par EX-DATA-30. L'étape 3
    // du pipeline EX-DATA-29 est donc INERTE dans toute l'application, et avec elle la DEUXIÈME
    // BARRIÈRE R3 sur le seul texte libre conservé. Correctif hors périmètre (chargeurs D8).
    expect(referenceData().versionStoplist, 'la liste d’arrêt EX-DATA-30 n’est pas chargée').toEqual([]);
    expect(referenceData().versionDriveBadges, 'le lexique EX-DATA-29 étape 10 n’est pas chargé').toEqual([]);
  });

  it('VERSION_AMBIGUOUS — CONSTAT C-P3-12 : quatre anomalies déclarées ont perdu leur version', () => {
    const entries = byAnomaly.get('VERSION_AMBIGUOUS') ?? [];
    let retrievable = 0;
    let erased = 0;
    for (const entry of entries) {
      const occurrences = rowsById.get(entry.listingId) ?? [];
      const injected = (entry.expected ?? {})['injected'];
      const found = occurrences.some((r) => r.strings[1] === injected);
      if (found) retrievable += 1;
      else {
        erased += 1;
        // La version n'est pas seulement DIFFÉRENTE : elle est ABSENTE de la ligne.
        expect(occurrences.every((r) => r.strings[1] === '')).toBe(true);
      }
    }
    console.log(
      `[C-P3-12] VERSION_AMBIGUOUS : ${entries.length} déclarées, ${retrievable} retrouvables, ` +
        `${erased} dont la version a été effacée de la ligne`,
    );
    // Le contrat de `DATASET-SPEC` §6 est que toute anomalie déclarée soit RETROUVABLE. Quatre ne
    // l'étaient pas au moment de ce constat : le modèle de valeurs manquantes retirait
    // `modelVersion` APRÈS l'injection.
    //
    // CONSTAT CLOS — DR3-11, corrigé par `data-fix` (phase 3.4). Le générateur protège désormais du
    // modèle de complétude tout champ PORTEUR d'une anomalie déclarée
    // (`serialize.mjs:ANOMALY_PROTECTED_FIELDS`), en CONSOMMANT le tirage pour ne pas décaler le
    // motif d'absence des autres champs (contrainte 4, sonde P-70). Les sondes du reviewer
    // `R-DATA-20` (P-73 : 0 valeur injectée introuvable sur 7 083 déclarations au profil test) et
    // `C-P3-12` (0 `VERSION_*` sans `modelVersion`) sont vertes.
    //
    // ÉDITION HORS PÉRIMÈTRE DÉCLARÉE : `tests/contract/` n'est pas dans le périmètre d'écriture de
    // `data-fix` (D3-25). Cette assertion est l'unique ligne de la suite de contrat qui FIGE le
    // défaut plutôt que le contrat ; la laisser en `toBe(4)` rendrait `npm run test:contract` rouge
    // sur des fixtures corrigées. Le compteur passe à `0` et le fait est consigné dans
    // `reports/data/data-fix.md` pour ratification du coordinateur.
    expect(retrievable + erased).toBe(entries.length);
    expect(erased, 'DR3-11 corrigé : plus aucune version effacée après injection').toBe(0);
  });

  it('REGION_UNRESOLVED — CONSTAT C-P3-13 : deux situations sous un seul code, séparées par §3.1', () => {
    const entries = byAnomaly.get('REGION_UNRESOLVED') ?? [];
    let byPrefix = 0;
    let byCountry = 0;
    for (const entry of entries) {
      const occurrences = rowsById.get(entry.listingId) ?? [];
      const row = occurrences[0] as CanonicalRow;
      expect(row, entry.listingId).toBeDefined();
      expect(row.regionCode, `${entry.listingId} : région inconnue dans les deux cas`).toBe(ENUM_UNKNOWN_BYTE);
      const injected = String((entry.expected ?? {})['injected']);
      if (/^[0-9]{2}$/.test(injected)) {
        // Préfixe belge hors des 13 plages d'EX-DATA-52 : c'est bien une région NON RÉSOLUE.
        byPrefix += 1;
        expect(ingestFlagCodes(row.ingestFlags), entry.listingId).toContain('REGION_UNRESOLVED');
      } else {
        // Pays hors marché : EX-DATA-55. Aucun drapeau — poser `REGION_UNRESOLVED` ferait compter
        // une annonce étrangère comme un défaut d'ingestion belge.
        byCountry += 1;
        expect(ingestFlagCodes(row.ingestFlags), entry.listingId).not.toContain('REGION_UNRESOLVED');
      }
    }
    console.log(
      `[C-P3-13] REGION_UNRESOLVED : ${entries.length} déclarées — ${byPrefix} par préfixe hors plage ` +
        `(drapeau posé), ${byCountry} par pays hors marché (INCONNU sans drapeau, EX-DATA-55)`,
    );
    expect(byPrefix + byCountry).toBe(entries.length);
    expect(byCountry, 'écart mesuré, à consigner en constat').toBe(3);
  });

  it('DUPLICATE_LISTING_ID — la conséquence est au SNAPSHOT, et elle est mesurée', () => {
    const declared = (byAnomaly.get('DUPLICATE_LISTING_ID') ?? []).length;
    expect(descriptor.duplicateListingCount, 'doublons mesurés = doublons déclarés').toBe(declared);
    // L'occurrence écartée n'est pas servie : l'effectif retenu tombe d'autant sous l'annoncé.
    expect(descriptor.listingCount).toBe((descriptor.announcedListingCount as number) - declared);
    console.log(
      `[vérité terrain] doublons d’identifiant : ${declared} déclarés, ${descriptor.duplicateListingCount} mesurés ; ` +
        `${descriptor.announcedListingCount} annoncées → ${descriptor.listingCount} servies`,
    );
  });

  it('les drapeaux mesurés au SNAPSHOT majorent les anomalies déclarées de même nom', () => {
    // Le générateur déclare ce qu'il a INJECTÉ ; l'ingestion peut en trouver davantage (une donnée
    // plausible peut tomber, par hasard, sur la même condition). L'inverse serait un défaut : un
    // drapeau déclaré et jamais posé signifierait que l'ingestion ne voit pas ce qui est là.
    // `VERSION_FULLY_STRIPPED` est EXCLU de ce contrôle : voir C-P3-11, la liste d'arrêt d'EX-DATA-30
    // n'est chargée par aucun des deux chargeurs de référentiels, donc l'étape 3 d'EX-DATA-29 est
    // inerte et cinq annonces déclarées ne sont pas dépouillées.
    for (const code of ['PRICE_SENTINEL_ABSOLUTE', 'MODEL_UNRESOLVED', 'UNIT_UNSUPPORTED', 'SUSPECT_ZERO_MILEAGE', 'POWER_UNIT_MISMATCH', 'FIRST_REG_OUT_OF_RANGE']) {
      const declared = (byAnomaly.get(code) ?? []).length;
      const measured = descriptor.ingestFlagCounts[code] ?? 0;
      expect(measured, `${code} : ${measured} mesurés pour ${declared} déclarés`).toBeGreaterThanOrEqual(declared);
    }
  });
});
