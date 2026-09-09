/**
 * KYCAR — sondes `P-102` … `P-106`, `P-109` : forme du fichier (décimales, ordre des clés, identité).
 * =================================================================================================
 * Agent `data-review` (phase 3.3). Ces sondes portent sur le TEXTE du NDJSON, pas sur l'objet
 * analysé : `multipleOf: 0.1` est faux en virgule flottante binaire, et l'ordre des clés disparaît
 * dès qu'on relit l'objet dans un dictionnaire trié.
 */
import { describe, expect, it } from 'vitest';

import { declaredIds, loadProfile, measure, pct, s0 } from './harness';

/** Champs numériques soumis à la contrainte « au plus une décimale » (contrainte 24). */
const ONE_DECIMAL_FIELDS = [
  'co2Emissions',
  'co2EmissionsCombined',
  'consumptionCombined',
  'consumptionElectricCombined',
  'combined',
  'electricCombined',
  'capacity',
  'co2EmissionInGramPerKmWithFallback',
  'consumptionCombinedWithFallback',
  'vatRate',
];

describe('P-102 … P-106, P-109 — forme du fichier livré', () => {
  it('P-102 — consommations, CO₂ et capacités s’écrivent avec au plus une décimale (contrôle TEXTUEL)', () => {
    const pattern = new RegExp(`"(?:${ONE_DECIMAL_FIELDS.join('|')})":-?\\d+\\.\\d\\d+`);
    let bad = 0;
    let sample = '';
    let lines = 0;
    for (const sn of loadProfile()) {
      for (const line of sn.rawLines) {
        lines += 1;
        const m = pattern.exec(line);
        if (m) {
          bad += 1;
          if (sample === '') sample = m[0];
        }
      }
    }
    measure('P-102', `${bad} ligne(s) sur ${lines} portant plus d’une décimale ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-103 — les clés JSON apparaissent dans le même ordre sur 100 % des lignes', () => {
    // « Même ordre » ne veut pas dire « mêmes clés » : une ligne à champs absents doit rester une
    // SOUS-SUITE d'un ordre total unique. On reconstruit cet ordre par tri topologique des
    // précédences observées ; un CYCLE prouve que deux lignes se contredisent.
    let violations = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const succ = new Map<string, Set<string>>();
      const nodes = new Set<string>();
      for (const line of sn.rawLines) {
        const keys = topLevelKeys(line);
        for (const k of keys) nodes.add(k);
        for (let j = 1; j < keys.length; j += 1) {
          const a = keys[j - 1] as string;
          const b = keys[j] as string;
          const set = succ.get(a) ?? new Set<string>();
          set.add(b);
          succ.set(a, set);
        }
      }
      const indeg = new Map<string, number>();
      for (const n of nodes) indeg.set(n, 0);
      for (const [, tos] of succ) for (const t of tos) indeg.set(t, (indeg.get(t) ?? 0) + 1);
      const queue = [...nodes].filter((n) => (indeg.get(n) ?? 0) === 0);
      const order: string[] = [];
      while (queue.length > 0) {
        const n = queue.shift() as string;
        order.push(n);
        for (const t of succ.get(n) ?? []) {
          const d = (indeg.get(t) ?? 0) - 1;
          indeg.set(t, d);
          if (d === 0) queue.push(t);
        }
      }
      if (order.length !== nodes.size) {
        violations += 1;
        if (sample === '') sample = `${sn.snapshotId} : ordre des clés CYCLIQUE (${nodes.size - order.length} clés hors tri)`;
        continue;
      }
      const rank = new Map(order.map((k, i) => [k, i]));
      for (let i = 0; i < sn.rawLines.length; i += 1) {
        const keys = topLevelKeys(sn.rawLines[i] as string);
        for (let j = 1; j < keys.length; j += 1) {
          if ((rank.get(keys[j] as string) as number) < (rank.get(keys[j - 1] as string) as number)) {
            violations += 1;
            if (sample === '') sample = `${sn.snapshotId} ligne ${i + 1} : ${keys[j - 1]} avant ${keys[j]}`;
            break;
          }
        }
      }
      if (sn.snapshotId === s0().snapshotId) {
        measure('P-103', `${nodes.size} clés de premier niveau, ordre total ${order.length === nodes.size ? 'unique' : 'CONTRADICTOIRE'} ; ${violations} ligne(s) en écart ${sample}`);
      }
    }
    expect(violations).toBe(0);
  });

  it('P-104 — id unique hors A-07, minuscule, forme 8-4-4-4-12', () => {
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    let malformed = 0;
    let undeclaredDuplicate = 0;
    let declaredDuplicate = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      const declared = declaredIds(sn, 'DUPLICATE_LISTING_ID');
      const seen = new Map<string, number>();
      for (const r of sn.rows) {
        if (!UUID.test(r.id)) {
          malformed += 1;
          if (sample === '') sample = r.id;
        }
        seen.set(r.id, (seen.get(r.id) ?? 0) + 1);
      }
      for (const [id, n] of seen) {
        if (n === 1) continue;
        if (declared.has(id)) declaredDuplicate += 1;
        else {
          undeclaredDuplicate += 1;
          if (sample === '') sample = `${id} × ${n} non déclaré`;
        }
      }
    }
    measure('P-104', `${malformed} identifiant(s) mal formé(s) · ${declaredDuplicate} doublon(s) déclaré(s) A-07 · ${undeclaredDuplicate} non déclaré(s) ${sample}`);
    expect(malformed).toBe(0);
    expect(undeclaredDuplicate).toBe(0);
  });

  it('P-105 — webPage contient l’id et l’hôte du marché (www.autoscout24.be pour be)', () => {
    let bad = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        if (!r.webPage.includes(r.id) || !r.webPage.startsWith('https://www.autoscout24.be/')) {
          bad += 1;
          if (sample === '') sample = `${r.id} → ${r.webPage}`;
        }
      }
    }
    measure('P-105', `${bad} deeplink(s) non conforme(s) ${sample}`);
    expect(bad).toBe(0);
  });

  it('P-106 — imageCount ≤ 50 ; equipment et appliedSeals sans doublon', () => {
    let overImages = 0;
    let dupEquipment = 0;
    let dupSeals = 0;
    let maxImages = 0;
    for (const sn of loadProfile()) {
      for (const r of sn.rows) {
        if (r.imageCount !== undefined) {
          maxImages = Math.max(maxImages, r.imageCount);
          if (r.imageCount > 50) overImages += 1;
        }
        if (r.equipment !== undefined && new Set(r.equipment).size !== r.equipment.length) dupEquipment += 1;
        if (r.appliedSeals !== undefined && new Set(r.appliedSeals).size !== r.appliedSeals.length) dupSeals += 1;
      }
    }
    measure('P-106', `imageCount maximal ${maxImages} · ${overImages} au-dessus de 50 · ${dupEquipment} équipement(s) en doublon · ${dupSeals} sceau(x) en doublon`);
    expect(overImages).toBe(0);
    expect(dupEquipment).toBe(0);
    expect(dupSeals).toBe(0);
  });

  it('P-109 — manifest.sha256 porte les octets NON COMPRESSÉS ; sha256Gz vérifie le fichier livré', () => {
    const lines: string[] = [];
    for (const sn of loadProfile()) {
      lines.push(`${sn.snapshotId} sha256 ${sn.manifest.sha256 === sn.sha256 ? 'OK' : 'ÉCART'} · gz ${sn.manifest.sha256Gz === sn.sha256Gz ? 'OK' : 'ÉCART'}`);
      expect(sn.manifest.sha256, `${sn.snapshotId} : sha256 des octets non compressés`).toBe(sn.sha256);
      // Contrôle croisé : le hachage du manifest ne doit PAS être celui du fichier gz.
      expect(sn.manifest.sha256).not.toBe(sn.sha256Gz);
      if (sn.manifest.sha256Gz !== undefined) expect(sn.manifest.sha256Gz).toBe(sn.sha256Gz);
    }
    measure('P-109', lines.join(' · '));
  });

  it('R-DATA-22 — aucune valeur `null` dans le fichier : une valeur inconnue est une CLÉ ABSENTE (§8.3)', () => {
    let nulls = 0;
    let sample = '';
    for (const sn of loadProfile()) {
      for (let i = 0; i < sn.rawLines.length; i += 1) {
        if (/:\s*null[,}]/.test(sn.rawLines[i] as string)) {
          nulls += 1;
          if (sample === '') sample = `${sn.snapshotId} ligne ${i + 1}`;
        }
      }
    }
    measure('FORME-null', `${nulls} ligne(s) portant un null ${sample}`);
    expect(nulls).toBe(0);
  });

  it('R-DATA-23 — le fichier est compact : aucune ligne ne porte d’espace hors chaîne (§8.3 règle 5)', () => {
    let spaced = 0;
    for (const sn of loadProfile()) {
      for (const line of sn.rawLines) {
        if (/[}\],]\s|\s[:{[]|":\s/.test(line.replace(/"(?:[^"\\]|\\.)*"/g, '""'))) spaced += 1;
      }
    }
    const total = loadProfile().reduce((s, sn) => s + sn.rawLines.length, 0);
    measure('FORME-compact', `${spaced} ligne(s) sur ${total} portant un espace de mise en forme (${pct(spaced / total)})`);
    expect(spaced).toBe(0);
  });
});

/** Clés de PREMIER NIVEAU d'une ligne NDJSON, dans l'ordre du texte. */
function topLevelKeys(line: string): string[] {
  const keys: string[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let start = -1;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i] as string;
    if (inString) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') {
        inString = false;
        if (depth === 1 && start >= 0) {
          // Une chaîne fermée au niveau 1 est une clé si le caractère suivant est « : ».
          if (line[i + 1] === ':') keys.push(line.slice(start + 1, i));
        }
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      escaped = false;
      start = i;
      continue;
    }
    if (c === '{' || c === '[') depth += 1;
    else if (c === '}' || c === ']') depth -= 1;
  }
  return keys;
}
