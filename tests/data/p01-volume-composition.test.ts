/**
 * KYCAR — sondes `P-01` … `P-12` et `P-110` : volume, déterminisme, taille, ordre, composition.
 * =================================================================================================
 * Agent `data-review` (phase 3.3). Chaque `it` porte l'identifiant de la sonde du contrat
 * (`docs/data/dataset-spec/probes.json`) et, en cas d'échec, l'identifiant du constat `R-DATA-nn`.
 * Les mesures sont recalculées ici ; rien n'est repris de `tools/dataset/check.mjs`.
 */
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  IS_TEST_PROFILE,
  LISTINGS_PER_SNAPSHOT,
  PROFILE,
  REPO_ROOT,
  buildValidators,
  countBy,
  declaredIds,
  firstRegYear,
  loadProfile,
  measure,
  pct,
  s0,
  specTable,
} from './harness';

interface MakeRow {
  slug: string;
  makeId: number;
  sharePct?: number;
  class?: string;
}
interface ModelRow {
  makeSlug: string;
  makeId: number;
  modelSlug: string;
  modelId: number;
  shareInMake: number;
  segment: string;
  yearFrom: number;
  yearTo: number;
  powerKwMedian: number;
}
interface ModelsTable {
  models: ModelRow[];
  families: Record<string, { makeSlug: string; members: string[] }>;
}
interface ProfilesTable {
  snapshots: { index: number; snapshotSuffix: string; observedAt: string; label: string }[];
  snapshotIdPattern: string;
  profiles: { name: string; listingsPerSnapshot: number; sizeBudgetGzBytes: number; minDistinctMakes: number }[];
}

const makesTable = specTable<{ makes: MakeRow[] }>('makes');
const modelsTable = specTable<ModelsTable>('models');
const profilesTable = specTable<ProfilesTable>('profiles');

/** Sonde de portée « snapshot test » dont l'échec est une DETTE ratifiée (D3-19). */
const ratifiedDebt = IS_TEST_PROFILE ? it.fails : it;

describe('P-01 … P-06 — volume, déterminisme, taille, ordre', () => {
  it('P-01 — effectif de chaque snapshot = listingsPerSnapshot du profil, exactement', () => {
    const snaps = loadProfile();
    const counts = snaps.map((s) => s.rows.length);
    measure('P-01', `effectifs ${counts.join(' / ')} (attendu ${LISTINGS_PER_SNAPSHOT[PROFILE]})`);
    for (const s of snaps) {
      expect(s.rows.length).toBe(LISTINGS_PER_SNAPSHOT[PROFILE]);
      expect(s.manifest.listingCount).toBe(LISTINGS_PER_SNAPSHOT[PROFILE]);
    }
  });

  it('P-02 — trois snapshots, capturedAt conformes à profiles.json', () => {
    const snaps = loadProfile();
    measure('P-02', `${snaps.length} snapshots, capturedAt ${snaps.map((s) => s.manifest.capturedAt).join(' ')}`);
    expect(snaps.length).toBe(3);
    for (let i = 0; i < 3; i += 1) {
      expect(snaps[i]?.manifest.capturedAt).toBe(profilesTable.snapshots[i]?.observedAt);
      expect(snaps[i]?.manifest.profile).toBe(PROFILE);
    }
  });

  it("R-DATA-01 — P-02 : le snapshotId livré est conforme au motif de profiles.json", () => {
    // `profiles.json:snapshotIdPattern` annonce `be-fixture-<profil>-<AAAAMMJJ>-<graine hex 8>` ;
    // le générateur écrit `be-20260907T060000Z` (écart EG-02, motivé par le motif et le maxLength
    // du schéma du manifest). Les deux documents de la MÊME spécification se contredisent : la
    // sonde P-02 telle qu'elle est écrite (« identifiants conformes à profiles.json ») ne peut pas
    // être verte. Constat DR3 : c'est `profiles.json` qui doit être amendé.
    const ids = loadProfile().map((s) => s.snapshotId);
    measure('P-02b', `snapshotId livrés ${ids.join(' ')} ; motif annoncé « ${profilesTable.snapshotIdPattern} »`);
    for (const id of ids) {
      expect(id, `snapshotId ${id} vs motif ${profilesTable.snapshotIdPattern}`).toMatch(
        /^be-fixture-(dev|test|perf)-\d{8}-[0-9a-f]{8}$/,
      );
    }
  });

  it('P-03 — régénération à graine égale : mêmes octets', async () => {
    const tablesMod = (await import(new URL('../../tools/dataset/tables.mjs', import.meta.url).href)) as {
      loadTables: () => unknown;
    };
    const snapMod = (await import(new URL('../../tools/dataset/snapshot.mjs', import.meta.url).href)) as {
      generateProfile: (
        tables: unknown,
        profile: string,
        seed: number,
      ) => { results: { snapshotId: string; ser: { sha256: string; sha256Gz: string; gz: Uint8Array } }[] };
    };
    const snaps = loadProfile();
    const seed = snaps[0]?.manifest.seed as number;
    const regen = snapMod.generateProfile(tablesMod.loadTables(), PROFILE, seed);
    const lines: string[] = [];
    for (const s of snaps) {
      const r = regen.results.find((x) => x.snapshotId === s.snapshotId);
      lines.push(`${s.snapshotId} ${r?.ser.sha256.slice(0, 12) ?? 'absent'}`);
      expect(r, `snapshot ${s.snapshotId} régénéré`).toBeDefined();
      expect(r?.ser.sha256).toBe(s.manifest.sha256);
      expect(r?.ser.sha256).toBe(s.sha256);
      expect(r?.ser.gz.length).toBe(s.gzBytes);
    }
    measure('P-03', `graine ${seed} : ${lines.join(' · ')} — identiques au manifest et au fichier livré`);
  });

  it('P-04 — deux graines différentes : au moins 99 % des listingId diffèrent', async () => {
    const tablesMod = (await import(new URL('../../tools/dataset/tables.mjs', import.meta.url).href)) as {
      loadTables: () => unknown;
    };
    const snapMod = (await import(new URL('../../tools/dataset/snapshot.mjs', import.meta.url).href)) as {
      generateProfile: (
        tables: unknown,
        profile: string,
        seed: number,
      ) => { results: { snapshotId: string; objects: { id: string }[] }[] };
    };
    const base = s0();
    const other = snapMod.generateProfile(tablesMod.loadTables(), PROFILE, (base.manifest.seed ^ 0x5eed1234) >>> 0);
    const first = other.results[0];
    expect(first).toBeDefined();
    const mine = new Set(base.rows.map((r) => r.id));
    let same = 0;
    for (const o of first?.objects ?? []) if (mine.has(o.id)) same += 1;
    const differing = 1 - same / (first?.objects.length ?? 1);
    measure('P-04', `${pct(differing)} d'identifiants différents (${same} communs)`);
    expect(differing).toBeGreaterThanOrEqual(0.99);
  });

  it('P-05 — somme des 3 fichiers gz du profil test ≤ 8 Mio', () => {
    const root = join(REPO_ROOT, 'data', 'fixtures', 'test');
    let total = 0;
    for (const s of ['be-20260907T060000Z', 'be-20260914T060000Z', 'be-20260921T060000Z']) {
      total += statSync(join(root, s, 'listings.ndjson.gz')).size;
    }
    measure('P-05', `${total} octets gz (budget 8 388 608, marge ${pct(1 - total / 8_388_608)})`);
    expect(total).toBeLessThanOrEqual(8 * 1024 * 1024);
  });

  it('P-06 — lignes croissantes sur (makeId, modelId, firstRegistrationYearMonth, listingId)', () => {
    // Convention de tri retenue pour un champ ABSENT : il précède toute valeur présente (c'est
    // l'ordre effectif du fichier ; aucune autre convention ne le rend croissant).
    const key = (r: { make: number; model?: number; firstRegistrationDate?: string; id: string }): [
      number,
      number,
      string,
      string,
    ] => [r.make, r.model ?? -1, r.firstRegistrationDate ?? '', r.id];
    let violations = 0;
    let firstBad = '';
    for (const snap of loadProfile()) {
      for (let i = 1; i < snap.rows.length; i += 1) {
        const a = key(snap.rows[i - 1] as never);
        const b = key(snap.rows[i] as never);
        let cmp = 0;
        for (let j = 0; j < 4; j += 1) {
          const x = a[j] as number | string;
          const y = b[j] as number | string;
          if (x < y) {
            cmp = -1;
            break;
          }
          if (x > y) {
            cmp = 1;
            break;
          }
        }
        if (cmp > 0) {
          violations += 1;
          if (firstBad === '') firstBad = `${snap.snapshotId} ligne ${i + 1} : ${JSON.stringify(a)} > ${JSON.stringify(b)}`;
        }
      }
    }
    measure('P-06', `${violations} inversion(s) sur les 3 snapshots ${firstBad}`);
    expect(violations).toBe(0);
  });
});

describe('P-07 … P-12, P-110 — marques, modèles, fenêtres de production', () => {
  it('P-07 — nombre de marques distinctes', () => {
    const min = PROFILE === 'test' ? 150 : 120;
    for (const snap of loadProfile()) {
      const n = new Set(snap.rows.map((r) => r.make)).size;
      if (snap === s0()) measure('P-07', `${n} marques distinctes (plancher ${min})`);
      expect(n, `${snap.snapshotId}`).toBeGreaterThanOrEqual(min);
    }
  });

  it('P-08 — effectif de chaque marque nommée = round(N × sharePct/100) à ±1', () => {
    const snap = s0();
    const counts = countBy(snap.rows, (r) => String(r.make));
    let maxDev = 0;
    let worst = '';
    for (const m of makesTable.makes) {
      if (typeof m.sharePct !== 'number') continue;
      const expected = Math.round((snap.rows.length * m.sharePct) / 100);
      const got = counts.get(String(m.makeId)) ?? 0;
      const dev = Math.abs(got - expected);
      if (dev > maxDev) {
        maxDev = dev;
        worst = `${m.slug} attendu ${expected} obtenu ${got}`;
      }
    }
    measure('P-08', `écart maximal ${maxDev} (${worst})`);
    expect(maxDev).toBeLessThanOrEqual(1);
  });

  it('P-09 — ordre des 5 premières marques', () => {
    const snap = s0();
    const counts = countBy(snap.rows, (r) => String(r.make));
    const byId = new Map(makesTable.makes.map((m) => [m.makeId, m.slug]));
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => byId.get(Number(id)) ?? `?${id}`);
    measure('P-09', `top 5 = ${top.join(', ')}`);
    expect(top).toEqual(['volkswagen', 'bmw', 'mercedes-benz', 'peugeot', 'opel']);
  });

  const modelIdOf = (makeSlug: string, modelSlug: string): ModelRow => {
    const m = modelsTable.models.find((x) => x.makeSlug === makeSlug && x.modelSlug === modelSlug);
    if (!m) throw new Error(`modèle ${makeSlug}/${modelSlug} absent de models.json`);
    return m;
  };

  ratifiedDebt(
    'P-10 — DETTE EG-01 / D3-19 : effectifs golf ≥ 650, polo ≥ 480, corsa ≥ 440, 320 ≥ 170 (profil test)',
    () => {
      const snap = s0();
      const count = (makeSlug: string, modelSlug: string): number => {
        const m = modelIdOf(makeSlug, modelSlug);
        return snap.rows.filter((r) => r.make === m.makeId && r.model === m.modelId).length;
      };
      const golf = count('volkswagen', 'golf');
      const polo = count('volkswagen', 'polo');
      const corsa = count('opel', 'corsa');
      const b320 = count('bmw', '320');
      measure('P-10', `golf ${golf} · polo ${polo} · corsa ${corsa} · 320 ${b320}`);
      if (!IS_TEST_PROFILE) return;
      expect(golf).toBeGreaterThanOrEqual(650);
      expect(polo).toBeGreaterThanOrEqual(480);
      expect(corsa).toBeGreaterThanOrEqual(440);
      expect(b320).toBeGreaterThanOrEqual(170);
    },
  );

  ratifiedDebt('P-11 — DETTE EG-01 / D3-19 : familles bmw-serie-3 et bmw-serie-1 ≥ 280 (profil test)', () => {
    const snap = s0();
    const famCount = (fam: string): number => {
      const f = modelsTable.families[fam];
      if (!f) throw new Error(`famille ${fam} absente`);
      const ids = f.members.map((s) => modelIdOf(f.makeSlug, s));
      return snap.rows.filter((r) => ids.some((m) => r.make === m.makeId && r.model === m.modelId)).length;
    };
    const s3 = famCount('bmw-serie-3');
    const s1 = famCount('bmw-serie-1');
    measure('P-11', `bmw-serie-3 ${s3} · bmw-serie-1 ${s1}`);
    if (!IS_TEST_PROFILE) return;
    expect(s3).toBeGreaterThanOrEqual(280);
    expect(s1).toBeGreaterThanOrEqual(280);
  });

  it('P-12 — aucune année de 1re immatriculation hors de la fenêtre du modèle curaté', () => {
    // Exclusion des lignes déclarées `FIRST_REG_OUT_OF_RANGE` : le corollaire du §6 de DATASET-SPEC
    // rend licite une violation DÉCLARÉE, et P-87 pose déjà la même exclusion (écart EG-10).
    const curated = new Map(modelsTable.models.map((m) => [`${m.makeId}|${m.modelId}`, m]));
    let violations = 0;
    let sample = '';
    let excluded = 0;
    for (const snap of loadProfile()) {
      const declared = declaredIds(snap, 'FIRST_REG_OUT_OF_RANGE');
      for (const r of snap.rows) {
        if (declared.has(r.id)) {
          excluded += 1;
          continue;
        }
        const m = curated.get(`${r.make}|${r.model ?? -1}`);
        const y = firstRegYear(r);
        if (!m || y === undefined) continue;
        if (y < m.yearFrom || y > m.yearTo + 1) {
          violations += 1;
          if (sample === '') sample = `${m.makeSlug}/${m.modelSlug} ${y} hors [${m.yearFrom}, ${m.yearTo + 1}]`;
        }
      }
    }
    measure('P-12', `${violations} violation(s) sur les modèles curatés (${excluded} lignes A-05 exclues) ${sample}`);
    expect(violations).toBe(0);
  });

  it('P-110 — couverture de la table curatée ≥ 65 %', () => {
    const curated = new Set(modelsTable.models.map((m) => `${m.makeId}|${m.modelId}`));
    const snap = s0();
    let hit = 0;
    for (const r of snap.rows) if (r.model !== undefined && curated.has(`${r.make}|${r.model}`)) hit += 1;
    const share = hit / snap.rows.length;
    measure('P-110', `${pct(share)} des annonces portent un modelId curaté`);
    expect(share).toBeGreaterThanOrEqual(0.65);
  });
});

describe('Manifest — cohérence interne du document de vérité terrain', () => {
  it('R-DATA-02 — listingCount, sha256, sha256Gz et tailles du manifest se vérifient sur le fichier livré', () => {
    for (const snap of loadProfile()) {
      expect(snap.manifest.listingCount, `${snap.snapshotId} listingCount`).toBe(snap.rows.length);
      expect(snap.manifest.sha256, `${snap.snapshotId} sha256 (octets non compressés)`).toBe(snap.sha256);
      expect(snap.manifest.sha256Gz, `${snap.snapshotId} sha256Gz`).toBe(snap.sha256Gz);
      expect(snap.manifest.uncompressedBytes, `${snap.snapshotId} uncompressedBytes`).toBe(snap.uncompressedBytes);
      expect(snap.manifest.compressedBytes, `${snap.snapshotId} compressedBytes`).toBe(snap.gzBytes);
      expect(snap.manifest.marketplace).toBe('be');
    }
    measure('MANIFEST', 'listingCount, sha256, sha256Gz, tailles : 3/3 snapshots conformes');
  });

  it('R-DATA-03 — manifests ET 100 % des lignes livrées conformes aux deux schémas', () => {
    const v = buildValidators();
    let invalid = 0;
    let firstError = '';
    for (const snap of loadProfile()) {
      expect(v.manifest(snap.manifest), `${snap.snapshotId} manifest : ${JSON.stringify(v.manifest.errors)}`).toBe(
        true,
      );
      for (let i = 0; i < snap.rows.length; i += 1) {
        if (!v.listing(snap.rows[i])) {
          invalid += 1;
          if (firstError === '') {
            const e = (v.listing.errors ?? [])[0];
            firstError = `${snap.snapshotId} ligne ${i + 1} : ${e?.instancePath ?? '/'} ${e?.message ?? '?'}`;
          }
        }
      }
    }
    measure('SCHEMA', `${v.engine} : 3/3 manifests conformes, ${invalid} ligne(s) non conforme(s) ${firstError}`);
    expect(invalid).toBe(0);
  });
});
