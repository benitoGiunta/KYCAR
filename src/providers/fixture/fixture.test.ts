/**
 * KYCAR — Tests unitaires du provider de fixtures (phase 3.3)
 * =================================================================================================
 * Les briques PURES : lecture en flux d'un NDJSON gzip, contrôle de version de schéma, choix du
 * snapshot, arbitrage des doublons. Le provider assemblé de bout en bout est exercé par la suite de
 * contrat (`tests/contract/`), sur un vrai jeu de fixtures.
 */

import { gzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import { looksGzipped, readNdjsonStream } from './ndjson';
import { createHttpFixtureLoader, LIGHT_MANIFEST } from './loaders/http';
import { checkSchemaVersion, selectSnapshot, isSnapshotManifest, isFixtureProfile } from './manifest';
import { duplicateSignature, hasDuplicateValueConflict, preferCandidate, type DuplicateCandidate } from './dedupe';
import type { CanonicalRow } from '../adapters/as24/adapt';

/** Flux d'octets à partir d'un tampon, découpé en morceaux pour exercer le rassemblage de lignes. */
function streamOf(bytes: Uint8Array, chunkSize = 7): ReadableStream<Uint8Array> {
  let at = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (at >= bytes.length) {
        controller.close();
        return;
      }
      controller.enqueue(bytes.subarray(at, Math.min(at + chunkSize, bytes.length)));
      at += chunkSize;
    },
  });
}

const encode = (s: string): Uint8Array => new TextEncoder().encode(s);

describe('fixture / ndjson — lecture EN FLUX, décompression reniflée', () => {
  it('découpe les lignes quel que soit le découpage des morceaux du flux', async () => {
    const text = '{"a":1}\n{"a":2}\n{"a":3}\n';
    for (const chunkSize of [1, 3, 7, 1024]) {
      const lines: string[] = [];
      const out = await readNdjsonStream(streamOf(encode(text), chunkSize), { onLine: (l) => lines.push(l) });
      expect(lines, `morceaux de ${chunkSize}`).toEqual(['{"a":1}', '{"a":2}', '{"a":3}']);
      expect(out.lineCount).toBe(3);
      expect(out.wasGzipped).toBe(false);
    }
  });

  it('transmet la dernière ligne même sans saut de ligne final, et ignore les lignes vides', async () => {
    const lines: string[] = [];
    await readNdjsonStream(streamOf(encode('{"a":1}\n\n{"a":2}')), { onLine: (l) => lines.push(l) });
    expect(lines).toEqual(['{"a":1}', '{"a":2}']);
  });

  it('retire un `\\r` de fin : un fichier produit sous Windows reste analysable ligne à ligne', async () => {
    const lines: string[] = [];
    await readNdjsonStream(streamOf(encode('{"a":1}\r\n{"a":2}\r\n')), { onLine: (l) => lines.push(l) });
    expect(lines).toEqual(['{"a":1}', '{"a":2}']);
  });

  it('reconnaît un flux gzip par ses OCTETS MAGIQUES, pas par un en-tête de réponse', async () => {
    const text = '{"a":1}\n{"a":2}\n';
    const gz = new Uint8Array(gzipSync(Buffer.from(text, 'utf-8')));
    expect(looksGzipped(gz)).toBe(true);
    expect(looksGzipped(encode(text))).toBe(false);
    const lines: string[] = [];
    const out = await readNdjsonStream(streamOf(gz, 5), { onLine: (l) => lines.push(l) });
    expect(out.wasGzipped).toBe(true);
    expect(lines).toEqual(['{"a":1}', '{"a":2}']);
    // Le MÊME contenu servi décompressé (cas d'un hébergeur qui décode lui-même) donne le même
    // résultat, sans configuration ni en-tête à lire.
    const plain: string[] = [];
    const outPlain = await readNdjsonStream(streamOf(encode(text)), { onLine: (l) => plain.push(l) });
    expect(outPlain.wasGzipped).toBe(false);
    expect(plain).toEqual(lines);
  });

  it('les caractères multi-octets ne sont pas coupés par la frontière d’un morceau', async () => {
    const text = '{"v":"Citroën C4 — édition"}\n';
    const lines: string[] = [];
    await readNdjsonStream(streamOf(encode(text), 3), { onLine: (l) => lines.push(l) });
    expect(JSON.parse(lines[0] as string)).toEqual({ v: 'Citroën C4 — édition' });
  });

  it('calcule le sha256 des octets DÉCOMPRESSÉS quand on le demande, et rien sinon', async () => {
    const text = '{"a":1}\n';
    const gz = new Uint8Array(gzipSync(Buffer.from(text, 'utf-8')));
    const withHash = await readNdjsonStream(streamOf(gz), { onLine: () => {}, hash: true });
    const plain = await readNdjsonStream(streamOf(encode(text)), { onLine: () => {}, hash: true });
    // Le hachage porte sur le NON compressé (DATA-MODEL §7-31) : les deux formes doivent coïncider.
    expect(withHash.sha256).toBe(plain.sha256);
    expect(withHash.sha256).toMatch(/^[0-9a-f]{64}$/);
    const without = await readNdjsonStream(streamOf(gz), { onLine: () => {} });
    expect(without.sha256).toBeNull();
  });
});

describe('fixture / manifest — version de schéma et choix du snapshot (DATA-MODEL §6)', () => {
  it('un MAJEUR inconnu refuse l’ouverture, avec un message fr-BE affichable', () => {
    const v = checkSchemaVersion('2.0.0', '1.0.0');
    expect(v.accepted).toBe(false);
    expect(v.message).toMatch(/incompatible/i);
    expect(v.message).toMatch(/Aucune annonce/i);
  });

  it('un MINEUR supérieur est accepté AVEC avertissement ; un mineur inférieur, sans réserve', () => {
    const up = checkSchemaVersion('1.4.0', '1.0.0');
    expect(up.accepted).toBe(true);
    expect(up.message).toMatch(/plus récent/i);
    const down = checkSchemaVersion('1.0.0', '1.4.0');
    expect(down.accepted).toBe(true);
    expect(down.message).toBeNull();
    expect(checkSchemaVersion('1.0.3', '1.0.0').accepted).toBe(true);
  });

  it('une version illisible refuse l’ouverture plutôt que de deviner', () => {
    expect(checkSchemaVersion('v1', '1.0.0').accepted).toBe(false);
    expect(checkSchemaVersion('', '1.0.0').accepted).toBe(false);
  });

  it('le snapshot par défaut est le plus récent par `capturedAt`, jamais par nom de répertoire', () => {
    const index = {
      profile: 'dev',
      snapshots: [
        { snapshotId: 'zzz', dir: 'zzz', capturedAt: '2026-09-07T06:00:00Z' },
        { snapshotId: 'aaa', dir: 'aaa', capturedAt: '2026-09-21T06:00:00Z' },
        { snapshotId: 'mmm', dir: 'mmm', capturedAt: '2026-09-14T06:00:00Z' },
      ],
    };
    expect(selectSnapshot(index)?.snapshotId).toBe('aaa');
    expect(selectSnapshot(index, 'zzz')?.snapshotId).toBe('zzz');
    // Un identifiant demandé et absent ne se replie PAS en silence sur un autre snapshot.
    expect(selectSnapshot(index, 'inconnu')).toBeNull();
    expect(selectSnapshot({ profile: 'dev', snapshots: [] })).toBeNull();
  });

  it('un manifest de forme incorrecte est reconnu comme tel (aucun type ne survit au JSON)', () => {
    expect(isSnapshotManifest({ snapshotId: 'a', capturedAt: 'b', schemaVersion: '1.0.0', listingCount: 1 })).toBe(true);
    expect(isSnapshotManifest({ snapshotId: 'a' })).toBe(false);
    expect(isSnapshotManifest(null)).toBe(false);
    expect(isFixtureProfile('test')).toBe(true);
    expect(isFixtureProfile('prod')).toBe(false);
  });
});

/** Ligne canonique minimale, pour exercer l'arbitrage sans construire un lot. */
function row(overrides: Partial<CanonicalRow> = {}): CanonicalRow {
  return {
    listingId: '0f7c5a1e-2b34-4c8d-9a10-5e6f7a8b9c0d',
    listingUrl: 'https://www.autoscout24.be/offres/x',
    priceEur: 10_000,
    mileageKm: 50_000,
    firstRegistrationYearMonth: 24_000,
    modelId: 2084,
    makeId: 74,
    modelYear: 2020,
    powerKw: 110,
    co2EmissionsGPerKmX10: 270,
    consumptionCombinedL100KmX10: 12,
    electricRangeKm: 62,
    fuelCategory: 0,
    bodyType: 0,
    transmission: 0,
    drivetrain: 0,
    offerType: 0,
    usageState: 0,
    sellerType: 0,
    regionCode: 0,
    countryCode: 0,
    priceStatus: 0,
    priceEvaluationCategory: 0,
    adTier: 0,
    bodyColor: 0,
    upholsteryType: 0,
    euEmissionStandard: 0,
    doorCount: 5,
    seatCount: 5,
    previousOwnerCount: 1,
    imageCount: 10,
    vatDeductible: 0,
    booleanFlags: 0,
    ingestFlags: 0,
    strings: ['https://www.autoscout24.be/offres/x', '', '', '', ''],
    dealerBucket: null,
    co2Source: 'WLTP',
    consumptionSource: 'WLTP',
    unknownFields: [],
    notices: [],
    ...overrides,
  };
}

describe('fixture / dedupe — arbitrage INDÉPENDANT de l’ordre du fichier (D3-15)', () => {
  const at = (iso: string | null): { sourceUpdatedAt: string | null } => ({ sourceUpdatedAt: iso });

  it('critère 1 — la plus COMPLÈTE gagne, quel que soit l’ordre de lecture', () => {
    const riche: DuplicateCandidate = { row: row({ unknownFields: [] }), ...at('2026-01-01T00:00:00Z') };
    const pauvre: DuplicateCandidate = { row: row({ unknownFields: ['priceEur', 'mileageKm'] }), ...at('2026-09-01T00:00:00Z') };
    // La complétude prime sur la fraîcheur : c'est l'ordre écrit des critères.
    expect(preferCandidate(riche, pauvre)).toBe(false);
    expect(preferCandidate(pauvre, riche)).toBe(true);
  });

  it('critère 2 — à complétude égale, la plus RÉCENTE gagne ; une date connue prime sur une absente', () => {
    const vieux: DuplicateCandidate = { row: row(), ...at('2026-01-01T00:00:00Z') };
    const neuf: DuplicateCandidate = { row: row(), ...at('2026-09-01T00:00:00Z') };
    expect(preferCandidate(vieux, neuf)).toBe(true);
    expect(preferCandidate(neuf, vieux)).toBe(false);
    const sansDate: DuplicateCandidate = { row: row(), ...at(null) };
    expect(preferCandidate(sansDate, vieux)).toBe(true);
    expect(preferCandidate(vieux, sansDate)).toBe(false);
  });

  it('critère 3 — à égalité, un départage DÉTERMINISTE, jamais l’ordre du fichier', () => {
    const a: DuplicateCandidate = { row: row({ priceEur: 10_000 }), ...at(null) };
    const b: DuplicateCandidate = { row: row({ priceEur: 20_000 }), ...at(null) };
    // La relation est ANTISYMÉTRIQUE : exactement l'un des deux remplace l'autre.
    expect(preferCandidate(a, b)).not.toBe(preferCandidate(b, a));
    expect(duplicateSignature(a.row)).not.toBe(duplicateSignature(b.row));
    // Idempotence : une occurrence identique ne remplace jamais celle qui est déjà retenue.
    expect(preferCandidate(a, { row: row({ priceEur: 10_000 }), ...at(null) })).toBe(false);
  });

  it('ARB-54 — le conflit de valeur porte sur les QUATRE champs normatifs, et sur eux seuls', () => {
    expect(hasDuplicateValueConflict(row(), row({ priceEur: 11_000 }))).toBe(true);
    expect(hasDuplicateValueConflict(row(), row({ mileageKm: 51_000 }))).toBe(true);
    expect(hasDuplicateValueConflict(row(), row({ priceStatus: 1 }))).toBe(true);
    expect(hasDuplicateValueConflict(row(), row({ firstRegistrationYearMonth: 24_001 }))).toBe(true);
    // Un champ hors des quatre ne fait PAS un conflit : le compteur d'ARB-54 doit rester lisible.
    expect(hasDuplicateValueConflict(row(), row({ imageCount: 42, powerKw: 90 }))).toBe(false);
  });
});


describe('fixture / chargeur HTTP — manifest allégé d’abord, repli sur le complet', () => {
  /** Faux `fetch` : rend 200 pour les chemins connus, 404 sinon, et journalise les URL demandées. */
  function fakeFetch(known: Readonly<Record<string, unknown>>): { impl: typeof fetch; urls: string[] } {
    const urls: string[] = [];
    const impl = ((input: RequestInfo | URL): Promise<Response> => {
      const url = String(input);
      urls.push(url);
      const body = known[url];
      if (body === undefined) return Promise.resolve(new Response('', { status: 404 }));
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    }) as typeof fetch;
    return { impl, urls };
  }

  const entry = { snapshotId: 'be-20260921T060000Z', dir: 'be-20260921T060000Z', capturedAt: '2026-09-21T06:00:00Z' };

  it('demande `manifest.min.json` en premier : la vérité terrain n’est pas sur le chemin critique', async () => {
    const { impl, urls } = fakeFetch({
      [`/fixtures/dev/${entry.dir}/${LIGHT_MANIFEST}`]: { snapshotId: entry.snapshotId, listingCount: 5000 },
    });
    const loader = createHttpFixtureLoader({ fetchImpl: impl });
    const manifest = (await loader.loadManifest('dev', entry)) as { listingCount: number };
    expect(manifest.listingCount).toBe(5000);
    expect(urls).toEqual([`/fixtures/dev/${entry.dir}/${LIGHT_MANIFEST}`]);
    // Le manifest complet n'a même pas été demandé : c'est tout l'objet de l'allègement.
    expect(urls.some((u) => u.endsWith('manifest.json'))).toBe(false);
  });

  it('se replie sur `manifest.json` quand l’allégé n’existe pas (jeu servi par un autre hébergeur)', async () => {
    const { impl, urls } = fakeFetch({
      [`/fixtures/dev/${entry.dir}/manifest.json`]: { snapshotId: entry.snapshotId, listingCount: 5000 },
    });
    const loader = createHttpFixtureLoader({ fetchImpl: impl });
    const manifest = (await loader.loadManifest('dev', entry)) as { listingCount: number };
    expect(manifest.listingCount).toBe(5000);
    expect(urls).toEqual([
      `/fixtures/dev/${entry.dir}/${LIGHT_MANIFEST}`,
      `/fixtures/dev/${entry.dir}/manifest.json`,
    ]);
  });

  it('une ressource absente donne un message qui NOMME l’URL, jamais un échec muet', async () => {
    const { impl } = fakeFetch({});
    const loader = createHttpFixtureLoader({ fetchImpl: impl });
    await expect(loader.loadProfileIndex('dev')).rejects.toThrow(/\/fixtures\/dev\/index\.json/);
    await expect(loader.openListings('dev', entry)).rejects.toThrow(/listings\.ndjson\.gz/);
  });

  it('les URL sont RELATIVES : aucune requête ne sort de l’origine de l’application (E5)', async () => {
    const { impl, urls } = fakeFetch({});
    const loader = createHttpFixtureLoader({ fetchImpl: impl });
    await loader.loadProfileIndex('dev').catch(() => undefined);
    await loader.loadManifest('dev', entry).catch(() => undefined);
    await loader.openListings('dev', entry).catch(() => undefined);
    expect(urls.length).toBeGreaterThan(0);
    for (const u of urls) expect(u.startsWith('/fixtures/'), u).toBe(true);
  });
});
