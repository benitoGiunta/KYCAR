/**
 * KYCAR — sondes `P-72` … `P-77`, `P-101` : anomalies contrôlées et vérité terrain.
 * =================================================================================================
 * Agent `data-review` (phase 3.3). La vérité terrain est le cœur du jeu : une anomalie déclarée que
 * l'on ne retrouve pas dans les lignes, ou une ligne anormale que le manifest ne déclare pas, rend
 * le jeu inutilisable pour valider un détecteur.
 */
import { describe, expect, it } from 'vitest';

import {
  IS_TEST_PROFILE,
  PROFILE,
  type RawListing,
  type Snapshot,
  groundTruthOf,
  loadProfile,
  loadSnapshot,
  measure,
  openCanonicalBatch,
  pct,
  priceStatus,
  s0,
  snapshotIds,
  specTable,
} from './harness';

interface AnomalyDef {
  id: string;
  anomalyCode: string;
  rate: number;
  base: string;
}
const anomalies = specTable<{ anomalies: AnomalyDef[] }>('anomalies');

const THERMAL = new Set(['B', 'D', '2', '3', 'L', 'C', 'M', 'O']);

/** Effectif de la population de base d'une anomalie, telle que `anomalies.json` la nomme. */
function baseCount(sn: Snapshot, base: string): number {
  const rows = sn.rows;
  if (base.startsWith('annonces a prix affiche')) return rows.filter((r) => priceStatus(r) === 'QUOTED').length;
  if (base === 'annonces professionnelles') return rows.filter((r) => r.seller?.type === 'D').length;
  if (base === "annonces d'offerType U, J ou O")
    return rows.filter((r) => r.offerType === 'U' || r.offerType === 'J' || r.offerType === 'O').length;
  if (base === 'annonces thermiques') return rows.filter((r) => r.fuelCategory !== undefined && THERMAL.has(r.fuelCategory)).length;
  if (base === 'annonces hybrides') return rows.filter((r) => r.fuelCategory === '2' || r.fuelCategory === '3').length;
  if (base === 'annonces portant powerHp') return rows.filter((r) => r.powerHp !== undefined).length;
  if (base === 'annonces a prix sur demande') return rows.filter((r) => priceStatus(r) === 'ON_REQUEST').length;
  return rows.length; // « toutes »
}

describe('P-72 … P-74, P-101 — effectifs, vérité terrain, exclusion mutuelle', () => {
  it('R-DATA-19 — P-72 : effectif réalisé de chaque anomalie à ±20 % relatifs de son taux SUR SA BASE', () => {
    const sn = s0();
    const declared = new Map<string, number>();
    for (const g of sn.manifest.groundTruth) declared.set(g.anomaly, (declared.get(g.anomaly) ?? 0) + 1);

    // Une anomalie peut porter DEUX codes (A-10 « LOW / HIGH », A-11) : la spécification ne dit
    // rien de la répartition entre les deux, on regroupe donc les codes d'une même anomalie et on
    // compare la SOMME. Deux anomalies peuvent inversement partager un code (A-19 et A-21) : on les
    // somme aussi. Le groupe est la plus petite unité que la spécification chiffre.
    const groupOf = new Map<string, string>();
    const expectedByGroup = new Map<string, { expected: number; onTotal: number; ids: string[]; codes: string[] }>();
    for (const a of anomalies.anomalies) {
      if (a.rate === 0) continue;
      const codes = a.anomalyCode.split(' / ').map((c) => c.trim());
      const key = codes.join('+');
      const merged = codes.map((c) => groupOf.get(c)).find((g) => g !== undefined) ?? key;
      for (const c of codes) groupOf.set(c, merged);
      const e = expectedByGroup.get(merged) ?? { expected: 0, onTotal: 0, ids: [], codes: [] };
      e.expected += a.rate * baseCount(sn, a.base);
      e.onTotal += a.rate * sn.rows.length;
      e.ids.push(a.id);
      for (const c of codes) if (!e.codes.includes(c)) e.codes.push(c);
      expectedByGroup.set(merged, e);
    }
    const breaches: string[] = [];
    const lines: string[] = [];
    for (const [group, e] of [...expectedByGroup].sort((a, b) => a[0].localeCompare(b[0]))) {
      const got = e.codes.reduce((n, c) => n + (declared.get(c) ?? 0), 0);
      const rel = Math.abs(got - e.expected) / e.expected;
      lines.push(
        `${group} (${e.ids.join('+')}) réalisé ${got} · attendu sur base déclarée ${e.expected.toFixed(1)} (${(rel * 100).toFixed(0)} %) · attendu sur N ${e.onTotal.toFixed(1)}`,
      );
      if (rel > 0.2) breaches.push(`${group} : ${got} déclarées pour ${e.expected.toFixed(1)} attendues (${(rel * 100).toFixed(0)} %)`);
      if (IS_TEST_PROFILE) expect(got, `${group} jamais nul au profil test`).toBeGreaterThan(0);
    }
    measure('P-72', `${expectedByGroup.size} groupes d’anomalie · ${lines.join(' · ')}`);
    expect(breaches).toEqual([]);
  });

  it('R-DATA-20 — P-73 : 100 % des listingId du manifest existent ET portent la valeur injectée', () => {
    let missing = 0;
    let total = 0;
    let valueLost = 0;
    const lostSamples: string[] = [];
    for (const sn of loadProfile()) {
      const byId = new Map<string, RawListing[]>();
      for (const r of sn.rows) {
        const arr = byId.get(r.id);
        if (arr) arr.push(r);
        else byId.set(r.id, [r]);
      }
      for (const g of sn.manifest.groundTruth) {
        total += 1;
        const rows = byId.get(g.listingId);
        if (!rows) {
          missing += 1;
          continue;
        }
        // Contrôle de la valeur injectée quand le manifest la publie sous une forme exploitable.
        const exp = g.expected as Record<string, unknown> | undefined;
        const injected = exp?.['injected'];
        if (injected === undefined) continue;
        const carried = rows.some((r) => {
          const candidates = [
            r.mileage,
            r.power,
            r.powerHp,
            r.prices?.public?.price,
            r.prices?.public?.netPrice,
            r.firstRegistrationDate,
            r.modelVersion,
            r.location.postalCodePrefix2,
            r.location.countryCode,
            r.co2Emissions,
            r.wltp?.co2EmissionsCombined,
            r.fuelCategory,
          ];
          return candidates.some((v) => v !== undefined && String(v) === String(injected));
        });
        if (!carried) {
          valueLost += 1;
          if (lostSamples.length < 4) lostSamples.push(`${g.anomaly} ${g.listingId} injecté « ${String(injected)} »`);
        }
      }
    }
    measure(
      'P-73',
      `${total} déclarations · ${missing} orpheline(s) · ${valueLost} valeur(s) injectée(s) introuvable(s) dans la ligne ${lostSamples.join(' ; ')}`,
    );
    expect(missing).toBe(0);
    expect(valueLost).toBe(0);
  });

  it('P-74 — aucune annonce ne porte deux anomalies de prix', () => {
    const priceCodes = new Set([
      'PRICE_SENTINEL_ABSOLUTE',
      'PRICE_OUT_OF_RANGE',
      'OUTLIER_M1_LOW',
      'OUTLIER_M1_HIGH',
      'OUTLIER_M2_LOW',
      'OUTLIER_M2_HIGH',
      'PRICE_ON_REQUEST_WITH_AMOUNT',
      'PRICE_ON_REQUEST',
      'PRICE_MISSING_UNDECLARED',
    ]);
    let doubled = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const count = new Map<string, string[]>();
      for (const g of sn.manifest.groundTruth) {
        if (!priceCodes.has(g.anomaly)) continue;
        const arr = count.get(g.listingId) ?? [];
        arr.push(g.anomaly);
        count.set(g.listingId, arr);
      }
      for (const [id, codes] of count) {
        if (codes.length > 1) {
          doubled += 1;
          if (sample === '') sample = `${id} : ${codes.join(' + ')}`;
        }
      }
    }
    measure('P-74', `${doubled} annonce(s) portant deux anomalies de prix ${sample}`);
    expect(doubled).toBe(0);
  });

  it('P-101 — ni FIRST_REG_UNPARSEABLE ni MARKETPLACE_UNMAPPED dans manifest.groundTruth', () => {
    let bad = 0;
    for (const sn of loadProfile()) {
      for (const g of sn.manifest.groundTruth) {
        if (g.anomaly === 'FIRST_REG_UNPARSEABLE' || g.anomaly === 'MARKETPLACE_UNMAPPED') bad += 1;
      }
    }
    measure('P-101', `${bad} occurrence(s) de code inatteignable`);
    expect(bad).toBe(0);
  });
});

describe('P-75 … P-77 — le moteur retrouve-t-il ce que le manifest annonce ?', () => {
  it('R-DATA-16 — P-75 : au moins 90 % des M1 injectés sont signalés quand la cellule a n_price ≥ 12', async () => {
    const sid = snapshotIds()[0] as string;
    const sn = loadSnapshot(sid);
    const { batch } = await openCanonicalBatch(sid);
    const { detectOutliers } = await import('../../src/engine/outliers');
    const rows = Int32Array.from({ length: batch.rowCount }, (_v, i) => i);
    const res = detectOutliers(batch, rows, batch.snapshotId, 'FULL:EMPTY');
    const injected = new Set(
      [...groundTruthOf(sn, 'OUTLIER_M1_LOW'), ...groundTruthOf(sn, 'OUTLIER_M1_HIGH')].map((g) => g.listingId),
    );
    let flagged = 0;
    let excludedInCell = 0;
    for (const id of injected) {
      if (res.m1FlaggedIds.has(id)) flagged += 1;
      else if (res.implausibleInCellIds.has(id)) excludedInCell += 1;
    }
    const recall = flagged / injected.size;
    measure(
      'P-75',
      `${flagged}/${injected.size} M1 injectés signalés (${pct(recall)}) ; ${excludedInCell} écartés de V_price(C) ` +
        `par PRICE_IMPLAUSIBLE_IN_CELL (prix < 0,10 × médianeRéf(C)) — le plancher absolu de 250 € de DATASET-SPEC §6 ne les protège pas`,
    );
    expect(injected.size).toBeGreaterThan(0);
    expect(recall).toBeGreaterThanOrEqual(0.9);
  }, 300_000);

  it('R-DATA-17 — P-76 : au moins 85 % des M2 injectés sont signalés M2_LOW ou M2_HIGH', async () => {
    const sid = snapshotIds()[0] as string;
    const sn = loadSnapshot(sid);
    const { batch } = await openCanonicalBatch(sid);
    const { detectOutliers } = await import('../../src/engine/outliers');
    const rows = Int32Array.from({ length: batch.rowCount }, (_v, i) => i);
    const res = detectOutliers(batch, rows, batch.snapshotId, 'FULL:EMPTY');
    const injected = [...groundTruthOf(sn, 'OUTLIER_M2_LOW'), ...groundTruthOf(sn, 'OUTLIER_M2_HIGH')];
    const verdictById = new Map(res.verdicts.filter((v) => v.method === 'M2').map((v) => [v.listingId, v]));
    let flagged = 0;
    let evaluatedNotFlagged = 0;
    let noVerdict = 0;
    let worstMissedDeviation = 0;
    for (const g of injected) {
      if (res.m2FlaggedIds.has(g.listingId)) {
        flagged += 1;
        continue;
      }
      const v = verdictById.get(g.listingId);
      if (!v) {
        noVerdict += 1;
        continue;
      }
      evaluatedNotFlagged += 1;
      worstMissedDeviation = Math.max(worstMissedDeviation, Math.abs(v.deviationPct ?? 0));
    }
    const recall = flagged / injected.length;
    measure(
      'P-76',
      `${flagged}/${injected.length} M2 injectés signalés (${pct(recall)}) ; ${evaluatedNotFlagged} évalués mais non signalés ` +
        `(écart au modèle atteignant ${worstMissedDeviation.toFixed(1)} %), ${noVerdict} sans verdict M2`,
    );
    expect(injected.length).toBeGreaterThan(0);
    expect(recall).toBeGreaterThanOrEqual(0.85);
  }, 300_000);

  it('P-77 — aucune annonce PRICE_SENTINEL_ABSOLUTE n’entre dans un quantile de prix publié', async () => {
    const sid = snapshotIds()[0] as string;
    const sn = loadSnapshot(sid);
    const { batch } = await openCanonicalBatch(sid);
    const { detectOutliers } = await import('../../src/engine/outliers');
    const rows = Int32Array.from({ length: batch.rowCount }, (_v, i) => i);
    const res = detectOutliers(batch, rows, batch.snapshotId, 'FULL:EMPTY');
    const sentinels = new Set(groundTruthOf(sn, 'PRICE_SENTINEL_ABSOLUTE').map((g) => g.listingId));
    const withVerdict = res.verdicts.filter((v) => sentinels.has(v.listingId)).length;
    measure(
      'P-77',
      `${sentinels.size} sentinelle(s) déclarée(s) · ${withVerdict} porteuse(s) d’un verdict · ${res.evaluation.priceExcluded} exclue(s) de V_price au sens absolu (profil ${PROFILE})`,
    );
    expect(sentinels.size).toBeGreaterThan(0);
    expect(withVerdict).toBe(0);
    expect(res.evaluation.priceExcluded).toBeGreaterThanOrEqual(sentinels.size);
  }, 300_000);
});

describe('Vérité terrain — la réciproque : aucune ligne anormale hors manifest', () => {
  it('R-DATA-18 — détecteurs simples : sentinelles, rythme kilométrique, dates impossibles, prix hors domaine', () => {
    const SENTINEL_PRICES = new Set([1, 11, 99, 111, 123, 150, 199, 249]);
    let sentinelUndeclared = 0;
    let outOfRangeUndeclared = 0;
    let kmRateUndeclared = 0;
    let dateUndeclared = 0;
    const samples: string[] = [];
    for (const sn of loadProfile()) {
      const declared = new Map<string, Set<string>>();
      for (const g of sn.manifest.groundTruth) {
        const s = declared.get(g.listingId) ?? new Set<string>();
        s.add(g.anomaly);
        declared.set(g.listingId, s);
      }
      const captured = Number(sn.manifest.capturedAt.slice(0, 4)) * 12 + (Number(sn.manifest.capturedAt.slice(5, 7)) - 1);
      for (const r of sn.rows) {
        const codes = declared.get(r.id) ?? new Set<string>();
        const p = r.prices?.public?.price;
        if (p !== undefined && SENTINEL_PRICES.has(p) && !codes.has('PRICE_SENTINEL_ABSOLUTE')) {
          sentinelUndeclared += 1;
          if (samples.length < 4) samples.push(`${r.id} prix sentinelle ${p} non déclaré`);
        }
        if (p !== undefined && p > 5_000_000 && !codes.has('PRICE_OUT_OF_RANGE')) outOfRangeUndeclared += 1;
        if (r.mileage !== undefined && r.mileage > 2_000_000 && !codes.has('MILEAGE_OUT_OF_RANGE')) kmRateUndeclared += 1;
        if (r.firstRegistrationDate !== undefined) {
          const fm = Number(r.firstRegistrationDate.slice(0, 4)) * 12 + (Number(r.firstRegistrationDate.slice(5, 7)) - 1);
          if ((fm > captured + 12 || fm < 1900 * 12) && !codes.has('FIRST_REG_OUT_OF_RANGE')) {
            dateUndeclared += 1;
            if (samples.length < 4) samples.push(`${r.id} 1re immat. ${r.firstRegistrationDate} non déclarée`);
          }
        }
      }
    }
    measure(
      'RECIPROQUE',
      `${sentinelUndeclared} prix sentinelle · ${outOfRangeUndeclared} prix hors domaine · ${kmRateUndeclared} km hors domaine · ${dateUndeclared} date impossible, non déclarés ${samples.join(' ; ')}`,
    );
    expect(sentinelUndeclared).toBe(0);
    expect(outOfRangeUndeclared).toBe(0);
    expect(kmRateUndeclared).toBe(0);
    expect(dateUndeclared).toBe(0);
  });
});
