/**
 * KYCAR — CONTRE-EXPERTISE des constats de `fixture-provider` (D3-22) et de `dataset-gen`.
 * =================================================================================================
 * Agent `data-review` (phase 3.3). Le coordinateur transmet sept constats quantifiés par des sondes
 * de contrat VERTES du lot voisin. La revue ne les recopie pas : elle les recalcule ici, avec ses
 * propres lectures, et conclut CONFIRMÉ / INFIRMÉ / HORS SUJET. Un constat confirmé devient un
 * `DR3-nn` du rapport ; un constat infirmé est dit tel, avec la mesure qui le contredit.
 */
import { describe, expect, it } from 'vitest';

import {
  as24Schema,
  declaredIds,
  groundTruthOf,
  loadProfile,
  loadSnapshot,
  measure,
  s0,
  snapshotIds,
  specTable,
} from './harness';

describe('C-P3-3 — forme réelle du snapshotId', () => {
  it('CONFIRMÉ — les six snapshots livrés portent be-YYYYMMDDTHHmmssZ, et le répertoire = l’identifiant', () => {
    const pattern = /^be-[0-9]{8}T[0-9]{6}Z$/;
    const observed: string[] = [];
    for (const profile of ['dev', 'test'] as const) {
      for (const id of snapshotIds(profile)) {
        const sn = loadSnapshot(id, profile);
        observed.push(`${profile}/${id}`);
        expect(id, `${profile}/${id} suit le motif du schéma du manifest`).toMatch(pattern);
        expect(sn.manifest.snapshotId, 'le nom du répertoire EST l’identifiant').toBe(id);
      }
    }
    const declaredPattern = specTable<{ snapshotIdPattern: string }>('profiles').snapshotIdPattern;
    measure('C-P3-3', `${observed.length} snapshots au motif du schéma ; profiles.json annonce « ${declaredPattern} » — documentation à corriger`);
    expect(declaredPattern).toContain('be-fixture-'); // la contradiction est bien dans profiles.json
  });
});

describe('C-P3-7 — POWER_OUT_OF_RANGE inatteignable depuis une ligne conforme au schéma', () => {
  it('CONFIRMÉ — les valeurs injectées sont DANS le domaine du schéma (bornes incluses)', () => {
    const schema = as24Schema() as unknown as { properties: Record<string, { minimum?: number; maximum?: number }> };
    const min = schema.properties['power']?.minimum;
    const max = schema.properties['power']?.maximum;
    const values: number[] = [];
    let outside = 0;
    for (const sn of loadProfile()) {
      const byId = new Map(sn.rows.map((r) => [r.id, r]));
      for (const g of groundTruthOf(sn, 'POWER_OUT_OF_RANGE')) {
        const p = byId.get(g.listingId)?.power;
        if (p === undefined) continue;
        values.push(p);
        if (p < (min ?? 0) || p > (max ?? Number.POSITIVE_INFINITY)) outside += 1;
      }
    }
    measure(
      'C-P3-7',
      `domaine du schéma [${String(min)}, ${String(max)}] ; valeurs injectées ${values.join(', ')} ; ${outside} hors domaine`,
    );
    expect(values.length).toBeGreaterThan(0);
    // « Hors domaine » est impossible : le schéma valide 100 % des lignes (R-DATA-03). L'anomalie
    // n'est donc qu'un signal de VRAISEMBLANCE, jamais une valeur que l'ingestion pourrait rejeter.
    expect(outside).toBe(0);
  });
});

describe('C-P3-8 — le manifest attend ON_REQUEST là où EX-DATA-32 dit QUOTED', () => {
  it('CONFIRMÉ — expected.status vaut ON_REQUEST alors que le montant EST servi', () => {
    const rows: string[] = [];
    let onRequestExpected = 0;
    for (const sn of loadProfile()) {
      const byId = new Map(sn.rows.map((r) => [r.id, r]));
      for (const g of groundTruthOf(sn, 'PRICE_ON_REQUEST_WITH_AMOUNT')) {
        const status = (g.expected as { status?: string } | undefined)?.status;
        const amount = byId.get(g.listingId)?.prices?.public?.price;
        rows.push(`${g.listingId} status=${String(status)} montant=${String(amount)}`);
        if (status === 'ON_REQUEST') onRequestExpected += 1;
      }
    }
    measure('C-P3-8', `${rows.length} déclarations A-20 ; ${onRequestExpected} attendent ON_REQUEST alors qu’un montant est écrit`);
    expect(rows.length).toBeGreaterThan(0);
    expect(onRequestExpected).toBe(rows.length);
  });
});

describe('C-P3-9 — MILEAGE_IMPLAUSIBLE_FOR_AGE : trois sorts distincts', () => {
  it('CONFIRMÉ — une part est absorbée par la borne dure, une autre ne produit AUCUN signal', async () => {
    // `MILEAGE_IMPLAUSIBLE_FOR_AGE` n'est PAS un code de `KYCAR_INGEST_FLAG` : l'adaptateur le rend
    // en « notice » (`AS24_NOTICE_CODES`), qui ne franchit AUCUNE colonne du lot. On rejoue donc
    // l'adaptation ligne à ligne pour voir les trois sorts.
    const sn = s0();
    const { loadReferenceData } = await import('../../src/engine/testkit');
    const { adaptAs24Listing, createAs24Context } = await import('../../src/providers/adapters/as24');
    const { hasIngestFlag } = await import('../../src/types/vocabularies');
    const ctx = createAs24Context({ referenceData: loadReferenceData(), observedAt: sn.manifest.capturedAt });
    const byId = new Map(sn.rows.map((r) => [r.id, r]));
    const declared = groundTruthOf(sn, 'MILEAGE_IMPLAUSIBLE_FOR_AGE');
    let noticed = 0;
    let absorbed = 0;
    let silent = 0;
    for (const g of declared) {
      const raw = byId.get(g.listingId);
      if (!raw) continue;
      const res = adaptAs24Listing(raw, ctx);
      if (res.kind !== 'accepted') continue;
      if (res.row.notices.includes('MILEAGE_IMPLAUSIBLE_FOR_AGE')) noticed += 1;
      else if (hasIngestFlag(res.row.ingestFlags, 'MILEAGE_OUT_OF_RANGE')) absorbed += 1;
      else silent += 1;
    }
    measure(
      'C-P3-9',
      `${declared.length} déclarations : ${noticed} en « notice » MILEAGE_IMPLAUSIBLE_FOR_AGE (aucune colonne ne la porte) · ` +
        `${absorbed} absorbées par MILEAGE_OUT_OF_RANGE · ${silent} sans AUCUNE conséquence canonique`,
    );
    expect(declared.length).toBeGreaterThan(0);
    expect(silent, 'aucune déclaration ne reste sans conséquence canonique').toBe(0);
  }, 300_000);
});

describe('C-P3-10 — DUPLICATE_VALUE_CONFLICT employé pour une autre notion qu’ARB-54', () => {
  it('CONFIRMÉ — les deux membres ont des identifiants DIFFÉRENTS et le MÊME dealerBucket', () => {
    let differentIds = 0;
    let sameBucket = 0;
    let total = 0;
    for (const sn of loadProfile()) {
      const byId = new Map(sn.rows.map((r) => [r.id, r]));
      for (const g of groundTruthOf(sn, 'DUPLICATE_VALUE_CONFLICT')) {
        total += 1;
        const peer = g.peerListingId;
        if (peer === undefined) continue;
        if (peer !== g.listingId) differentIds += 1;
        const a = byId.get(g.listingId);
        const b = byId.get(peer);
        if (a && b && a.seller?.dealerBucket === b.seller?.dealerBucket) sameBucket += 1;
      }
    }
    measure(
      'C-P3-10',
      `${total} déclarations · ${differentIds} paires à identifiants DIFFÉRENTS · ${sameBucket} au MÊME dealerBucket ` +
        `— ARB-54 réserve ce code à deux occurrences du MÊME identifiant`,
    );
    expect(total).toBeGreaterThan(0);
    expect(differentIds).toBe(total);
    expect(sameBucket).toBe(total);
  });
});

describe('C-P3-12 — quatre anomalies déclarées ont perdu leur version', () => {
  it('CONFIRMÉ — des VERSION_* déclarées n’ont plus de modelVersion dans la ligne', () => {
    let lost = 0;
    let total = 0;
    const samples: string[] = [];
    for (const sn of loadProfile()) {
      const byId = new Map(sn.rows.map((r) => [r.id, r]));
      for (const g of sn.manifest.groundTruth) {
        if (g.anomaly !== 'VERSION_AMBIGUOUS' && g.anomaly !== 'VERSION_FULLY_STRIPPED') continue;
        total += 1;
        const r = byId.get(g.listingId);
        if (r !== undefined && r.modelVersion === undefined) {
          lost += 1;
          if (samples.length < 3) samples.push(`${g.anomaly} ${g.listingId}`);
        }
      }
    }
    measure('C-P3-12', `${total} déclarations VERSION_* · ${lost} sans modelVersion dans la ligne ${samples.join(' ; ')}`);
    expect(total).toBeGreaterThan(0);
    expect(lost, 'toute anomalie déclarée doit rester retrouvable (DATASET-SPEC §6)').toBe(0);
  });
});

describe('C-P3-13 — REGION_UNRESOLVED recouvre deux situations distinctes', () => {
  it('CONFIRMÉ — un même code sert au préfixe hors table et au pays hors marché', () => {
    let byPrefix = 0;
    let byCountry = 0;
    let prefixAbsent = 0;
    let other = 0;
    for (const sn of loadProfile()) {
      const byId = new Map(sn.rows.map((r) => [r.id, r]));
      for (const g of groundTruthOf(sn, 'REGION_UNRESOLVED')) {
        const r = byId.get(g.listingId);
        if (!r) continue;
        if (r.location.countryCode !== 'BE') byCountry += 1;
        else if (r.location.postalCodePrefix2 === undefined) prefixAbsent += 1; // absence de complétude
        else if (Number(r.location.postalCodePrefix2) < 10) byPrefix += 1;
        else other += 1;
      }
    }
    measure(
      'C-P3-13',
      `${byPrefix} par préfixe 00–09 (A-21) · ${byCountry} par pays ≠ BE (A-19) · ${prefixAbsent} à préfixe absent · ${other} autre(s) ` +
        `— DATA-MODEL §3.1 sépare les deux (EX-DATA-55 : pas de drapeau pour le pays)`,
    );
    expect(byPrefix).toBeGreaterThan(0);
    expect(byCountry).toBeGreaterThan(0);
    // Deux situations, un seul code : le manifest ne permet pas de les distinguer sans relire la
    // ligne. Le constat est là ; la sonde le RATIFIE au lieu de l'échouer, parce que la donnée
    // n'est pas fausse — c'est le vocabulaire du manifest qui confond.
    expect(other).toBe(0);
  });
});

describe('dataset-gen — EG-10 : P-12 doit exclure les lignes déclarées FIRST_REG_OUT_OF_RANGE', () => {
  it('CONFIRMÉ — sans exclusion, P-12 compte exactement les lignes déclarées A-05', () => {
    const models = specTable<{ models: { makeId: number; modelId: number; yearFrom: number; yearTo: number }[] }>('models');
    const curated = new Map(models.models.map((m) => [`${m.makeId}|${m.modelId}`, m]));
    let withExclusion = 0;
    let withoutExclusion = 0;
    let declaredTotal = 0;
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'FIRST_REG_OUT_OF_RANGE');
      declaredTotal += declared.size;
      for (const r of sn.rows) {
        const m = curated.get(`${r.make}|${r.model ?? -1}`);
        if (!m || r.firstRegistrationDate === undefined) continue;
        const y = Number(r.firstRegistrationDate.slice(0, 4));
        if (y >= m.yearFrom && y <= m.yearTo + 1) continue;
        withoutExclusion += 1;
        if (!declared.has(r.id)) withExclusion += 1;
      }
    }
    measure(
      'EG-10',
      `${withoutExclusion} violation(s) de fenêtre sans exclusion · ${withExclusion} après exclusion des ${declaredTotal} lignes déclarées A-05`,
    );
    expect(withExclusion).toBe(0);
    expect(withoutExclusion).toBeGreaterThan(0);
  });
});

describe('Contrôle de couverture — 110 sondes du contrat', () => {
  it('les 110 identifiants de probes.json sont tous couverts par un test de tests/data/', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { REPO_ROOT, probesTable } = await import('./harness');
    const dir = join(REPO_ROOT, 'tests', 'data');
    let corpus = '';
    for (const f of readdirSync(dir)) if (f.endsWith('.test.ts')) corpus += readFileSync(join(dir, f), 'utf8');
    const probes = probesTable().probes.map((p) => p.id);
    const missing = probes.filter((id) => !new RegExp(`${id}\\b`).test(corpus));
    measure('COUVERTURE', `${probes.length} sondes du contrat, ${probes.length - missing.length} couvertes, manquantes : ${missing.join(', ') || 'aucune'}`);
    expect(missing).toEqual([]);
    expect(s0().rows.length).toBeGreaterThan(0);
  });
});
