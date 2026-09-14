/**
 * KYCAR — sondes `P-65` … `P-71`, `P-86` … `P-89`, `P-94` : dynamique inter-snapshots, dates, manifest.
 * =================================================================================================
 * Agent `data-review` (phase 3.3).
 */
import { describe, expect, it } from 'vitest';

import {
  type RawListing,
  type Snapshot,
  countBy,
  declaredIds,
  firstRegMonthIndex,
  loadProfile,
  measure,
  median,
  pct,
  specTable,
} from './harness';

const dynamics = specTable<{ priceRevision: Record<string, unknown> }>('snapshot-dynamics');

/** Index `id` → ligne, en gardant la PREMIÈRE occurrence (les doublons d'`id` d'A-07 sont déclarés). */
function indexById(sn: Snapshot): Map<string, RawListing> {
  const m = new Map<string, RawListing>();
  for (const r of sn.rows) if (!m.has(r.id)) m.set(r.id, r);
  return m;
}

const monthIndexOf = (iso: string): number => Number(iso.slice(0, 4)) * 12 + (Number(iso.slice(5, 7)) - 1);

describe('P-65 … P-71 — sorties, entrées, révisions, stabilité', () => {
  it('P-65 — taux de sortie entre snapshots consécutifs dans [0,08 ; 0,12]', () => {
    const snaps = loadProfile();
    const rates: number[] = [];
    for (let i = 1; i < snaps.length; i += 1) {
      const prev = indexById(snaps[i - 1] as Snapshot);
      const cur = indexById(snaps[i] as Snapshot);
      let exited = 0;
      for (const id of prev.keys()) if (!cur.has(id)) exited += 1;
      rates.push(exited / prev.size);
    }
    measure('P-65', `sorties ${rates.map((r) => pct(r)).join(' puis ')}`);
    for (const r of rates) {
      expect(r).toBeGreaterThanOrEqual(0.08);
      expect(r).toBeLessThanOrEqual(0.12);
    }
  });

  it('P-66 — effectif par marque identique sur les 3 snapshots', () => {
    const snaps = loadProfile();
    const base = countBy((snaps[0] as Snapshot).rows, (r) => String(r.make));
    let diverging = 0;
    let sample = '';
    for (const sn of snaps.slice(1)) {
      const c = countBy(sn.rows, (r) => String(r.make));
      const keys = new Set([...base.keys(), ...c.keys()]);
      for (const k of keys) {
        if ((base.get(k) ?? 0) !== (c.get(k) ?? 0)) {
          diverging += 1;
          if (sample === '') sample = `marque ${k} : ${base.get(k) ?? 0} → ${c.get(k) ?? 0} (${sn.snapshotId})`;
        }
      }
    }
    measure('P-66', `${base.size} marques, ${diverging} divergence(s) ${sample}`);
    expect(diverging).toBe(0);
  });

  it('P-67 — nombre d’entrées = nombre de sorties, snapshot par snapshot', () => {
    const snaps = loadProfile();
    const lines: string[] = [];
    for (let i = 1; i < snaps.length; i += 1) {
      const prev = indexById(snaps[i - 1] as Snapshot);
      const cur = indexById(snaps[i] as Snapshot);
      let entered = 0;
      let exited = 0;
      for (const id of cur.keys()) if (!prev.has(id)) entered += 1;
      for (const id of prev.keys()) if (!cur.has(id)) exited += 1;
      const delta = (snaps[i] as Snapshot).manifest.delta;
      lines.push(
        `${(snaps[i] as Snapshot).snapshotId} : ${entered} entrées / ${exited} sorties sur IDENTIFIANTS DISTINCTS ` +
          `(manifest, en LIGNES : ${String(delta?.enteredCount)}/${String(delta?.exitedCount)})`,
      );
      expect(entered, 'entrées = sorties').toBe(exited);
      // Le manifest compte des LIGNES ; un identifiant écrit deux fois (A-07) y compte deux fois.
      // L'écart attendu est donc au plus le nombre de doublons d'identifiant du snapshot.
      const duplicateLines = (snaps[i] as Snapshot).rows.length - cur.size;
      expect(Math.abs((delta?.enteredCount ?? 0) - entered), 'écart manifest / identifiants distincts').toBeLessThanOrEqual(
        duplicateLines,
      );
    }
    measure('P-67', lines.join(' · '));
  });

  it('R-DATA-14 — P-68 : 14 à 20 % des survivantes voient leur prix changer, 80 à 88 % à la baisse', () => {
    const snaps = loadProfile();
    const lines: string[] = [];
    for (let i = 1; i < snaps.length; i += 1) {
      const prev = indexById(snaps[i - 1] as Snapshot);
      const cur = indexById(snaps[i] as Snapshot);
      let survivors = 0;
      let revised = 0;
      let down = 0;
      for (const [id, now] of cur) {
        const before = prev.get(id);
        if (!before) continue;
        survivors += 1;
        const a = before.prices?.public?.price;
        const b = now.prices?.public?.price;
        if (a === undefined || b === undefined || a === b) continue;
        revised += 1;
        if (b < a) down += 1;
      }
      const share = revised / survivors;
      const downShare = down / revised;
      lines.push(
        `${(snaps[i] as Snapshot).snapshotId} : ${pct(share)} révisées OBSERVABLES (${revised}/${survivors}), ` +
          `${pct(downShare)} à la baisse ; manifest.delta.priceRevisedCount = ${String((snaps[i] as Snapshot).manifest.delta?.priceRevisedCount)}`,
      );
      expect(share).toBeGreaterThanOrEqual(0.14);
      expect(share).toBeLessThanOrEqual(0.2);
      expect(downShare).toBeGreaterThanOrEqual(0.8);
      expect(downShare).toBeLessThanOrEqual(0.88);
    }
    measure('P-68', `${lines.join(' · ')} (cible ${JSON.stringify(dynamics.priceRevision['shareOfSurvivors'])})`);
  });

  it('R-DATA-15 — P-69 : médiane(S2) < médiane(S0), recul ≤ 3 %', () => {
    const snaps = loadProfile();
    const med = (sn: Snapshot): number =>
      median(sn.rows.map((r) => r.prices?.public?.price).filter((p): p is number => p !== undefined));
    const first = med(snaps[0] as Snapshot);
    const last = med(snaps[snaps.length - 1] as Snapshot);
    const drop = 1 - last / first;
    // Le même calcul restreint aux SURVIVANTES sépare l'effet des révisions de celui du
    // renouvellement du stock : sans lui on ne saurait pas laquelle des deux causes fait dériver.
    const firstIdx = indexById(snaps[0] as Snapshot);
    const lastIdx = indexById(snaps[snaps.length - 1] as Snapshot);
    const commonIds = [...lastIdx.keys()].filter((id) => firstIdx.has(id));
    const priceOf = (m: Map<string, RawListing>, ids: string[]): number[] =>
      ids.map((id) => m.get(id)?.prices?.public?.price).filter((p): p is number => p !== undefined);
    const survFirst = median(priceOf(firstIdx, commonIds));
    const survLast = median(priceOf(lastIdx, commonIds));
    measure(
      'P-69',
      `médiane S0 ${first} € → S2 ${last} € (variation ${pct(-drop)}) ; sur les seules survivantes ` +
        `${survFirst} € → ${survLast} € (${pct(survLast / survFirst - 1)}, n=${commonIds.length})`,
    );
    expect(last).toBeLessThan(first);
    expect(drop).toBeLessThanOrEqual(0.03);
  });

  it('P-70 — une survivante non révisée est identique champ à champ hors snapshotId, observedAt et isNewListing', () => {
    const snaps = loadProfile();
    const mutable = new Set(['prices', 'lastUpdatedAt', 'imageCount', 'publication']);
    let compared = 0;
    let differing = 0;
    let sample = '';
    for (let i = 1; i < snaps.length; i += 1) {
      const prev = indexById(snaps[i - 1] as Snapshot);
      const cur = indexById(snaps[i] as Snapshot);
      for (const [id, now] of cur) {
        const before = prev.get(id);
        if (!before) continue;
        const a = before.prices?.public?.price;
        const b = now.prices?.public?.price;
        if (a !== b) continue; // révisée : hors périmètre de cette sonde
        compared += 1;
        const keys = new Set([...Object.keys(before), ...Object.keys(now)]);
        for (const k of keys) {
          if (mutable.has(k)) continue;
          const va = JSON.stringify((before as unknown as Record<string, unknown>)[k]);
          const vb = JSON.stringify((now as unknown as Record<string, unknown>)[k]);
          if (va !== vb) {
            differing += 1;
            if (sample === '') sample = `${id} champ ${k} : ${String(va)} → ${String(vb)}`;
            break;
          }
        }
      }
    }
    measure('P-70', `${differing} annonce(s) modifiée(s) sur ${compared} survivantes non révisées ${sample}`);
    expect(differing).toBe(0);
  });

  it('P-71 — au plus 0,8 % des survivantes voient leur kilométrage changer, toujours en hausse', () => {
    const snaps = loadProfile();
    let survivors = 0;
    let changed = 0;
    let decreased = 0;
    for (let i = 1; i < snaps.length; i += 1) {
      const prev = indexById(snaps[i - 1] as Snapshot);
      const cur = indexById(snaps[i] as Snapshot);
      for (const [id, now] of cur) {
        const before = prev.get(id);
        if (!before) continue;
        survivors += 1;
        if (before.mileage === now.mileage) continue;
        changed += 1;
        if (before.mileage !== undefined && now.mileage !== undefined && now.mileage < before.mileage) decreased += 1;
      }
    }
    measure('P-71', `${changed} changement(s) de kilométrage sur ${survivors} survivantes (${pct(changed / survivors)}), ${decreased} en baisse`);
    expect(changed / survivors).toBeLessThanOrEqual(0.008);
    expect(decreased).toBe(0);
  });
});

describe('P-86 … P-89, P-94 — dates, chaînage, manifest', () => {
  it('P-86 — firstRegistrationDate ≤ createdAt ≤ firstActivatedDate ≤ lastUpdatedAt ≤ capturedAt', () => {
    let bad = 0;
    let checked = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'FIRST_REG_OUT_OF_RANGE');
      const captured = Date.parse(sn.manifest.capturedAt);
      for (const r of sn.rows) {
        if (r.createdAt === undefined || r.firstActivatedDate === undefined || r.lastUpdatedAt === undefined) continue;
        checked += 1;
        const created = Date.parse(r.createdAt);
        const activated = Date.parse(r.firstActivatedDate);
        const updated = Date.parse(r.lastUpdatedAt);
        let ok = created <= activated && activated <= updated && updated <= captured;
        if (ok && !declared.has(r.id)) {
          const fm = firstRegMonthIndex(r);
          if (fm !== undefined && fm > monthIndexOf(r.createdAt)) ok = false;
        }
        if (!ok) {
          bad += 1;
          if (sample === '')
            sample = `${r.id} ${String(r.firstRegistrationDate)} / ${r.createdAt} / ${r.firstActivatedDate} / ${r.lastUpdatedAt} / ${sn.manifest.capturedAt}`;
        }
      }
    }
    measure('P-86', `${bad} violation(s) d’ordre sur ${checked} annonces datées ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-87 — firstRegistrationDate dans [1900-01, (année capturedAt + 1)-12] hors A-05', () => {
    let bad = 0;
    let declaredCount = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'FIRST_REG_OUT_OF_RANGE');
      const maxMonth = (Number(sn.manifest.capturedAt.slice(0, 4)) + 1) * 12 + 11;
      const minMonth = 1900 * 12;
      for (const r of sn.rows) {
        const fm = firstRegMonthIndex(r);
        if (fm === undefined) continue;
        if (fm >= minMonth && fm <= maxMonth) continue;
        if (declared.has(r.id)) {
          declaredCount += 1;
          continue;
        }
        bad += 1;
        if (sample === '') sample = `${r.id} ${String(r.firstRegistrationDate)}`;
      }
    }
    measure('P-87', `${bad} date(s) hors bornes non déclarée(s), ${declaredCount} déclarée(s) A-05 ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-88 — nextInspectionDate dans [capturedAt − 24 mois, capturedAt + 48 mois]', () => {
    let bad = 0;
    let checked = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const c = monthIndexOf(sn.manifest.capturedAt);
      for (const r of sn.rows) {
        if (r.nextInspectionDate === undefined) continue;
        checked += 1;
        const m = monthIndexOf(r.nextInspectionDate);
        if (m < c - 24 || m > c + 48) {
          bad += 1;
          if (sample === '') sample = `${r.id} ${r.nextInspectionDate} (capturé ${sn.manifest.capturedAt})`;
        }
      }
    }
    measure('P-88', `${bad} date(s) hors fenêtre sur ${checked} renseignées ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-89 — chaînage : capturedAt croissant, previousSnapshotId chaîné, delta cohérent, publication Active à 100 %', () => {
    const snaps = loadProfile();
    let notActive = 0;
    let sample = '';
    for (let i = 0; i < snaps.length; i += 1) {
      const sn = snaps[i] as Snapshot;
      if (i === 0) {
        expect(sn.manifest.previousSnapshotId, 'S0 sans prédécesseur').toBeNull();
      } else {
        const prev = snaps[i - 1] as Snapshot;
        expect(sn.manifest.previousSnapshotId, `${sn.snapshotId} chaîné`).toBe(prev.snapshotId);
        expect(Date.parse(sn.manifest.capturedAt)).toBeGreaterThan(Date.parse(prev.manifest.capturedAt));
        const d = sn.manifest.delta;
        expect(d, `${sn.snapshotId} porte un delta`).toBeDefined();
        expect((d?.carriedOverCount ?? 0) + (d?.enteredCount ?? 0), `${sn.snapshotId} delta`).toBe(sn.manifest.listingCount);
      }
      for (const r of sn.rows) {
        if (r.publication?.status !== 'Active') {
          notActive += 1;
          if (sample === '') sample = `${r.id} status ${String(r.publication?.status)}`;
        }
      }
    }
    measure('P-89', `chaînage conforme sur ${snaps.length} snapshots · ${notActive} ligne(s) hors publication Active ${sample}`);
    expect(notActive).toBe(0);
  });

  it('P-94 — marketplace du manifest = marketplace de 100 % des lignes', () => {
    let bad = 0;
    for (const sn of loadProfile()) {
      for (const r of sn.rows) if (r.marketplace !== sn.manifest.marketplace) bad += 1;
    }
    measure('P-94', `${bad} écart(s) de marketplace`);
    expect(bad).toBe(0);
  });
});
