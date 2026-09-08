/**
 * KYCAR — Sondes de revue D7 · nuage G4 (EX-DATA-99/100/100bis/101/103, EX-SCR-157, §9.2)
 * =================================================================================================
 * Vérification n°2 de la mission :
 *   - plafond `K = 5 000` (EX-DATA-100) réellement appliqué ;
 *   - EX-DATA-100bis : échantillon identique OCTET À OCTET entre plusieurs permutations d'entrée
 *     (trois permutations d'un même jeu de 20 000) ;
 *   - EX-DATA-101 vs EX-DATA-100bis : quelle des deux règles le code applique — prouvé par une
 *     ré-implémentation indépendante de l'algorithme d'EX-DATA-101 dans cette sonde ;
 *   - seuil de 20 000 de l'annexe B (`EX-SCR-157`, bandeau `ET-TROP-RESULTATS`) : présent dans le
 *     code (code mort) ou absent.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { compareListingId, decodeListingId } from '../../../src/engine/uuid';
import { computeEligibility } from '../../../src/screens/distribution/scatter-model';
import {
  sampleScatter,
  SCATTER_MAX_POINTS,
  SCATTER_SAMPLING_SEED,
} from '../../../src/screens/distribution/scatter-sample';
import { fixture, listingIdSequence } from './_helpers';

const DIST_DIR = join(process.cwd(), 'src', 'screens', 'distribution');

/** Permutation déterministe (mélange de Fisher-Yates piloté par un LCG à graine explicite). */
function permute(rows: Int32Array, seed: number): Int32Array {
  const out = Int32Array.from(rows);
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = out[i] as number;
    out[i] = out[j] as number;
    out[j] = tmp;
  }
  return out;
}

describe('D7 · G4 — plafond et échantillonnage (EX-DATA-100/100bis/101)', () => {
  const f = fixture(20000, 0xc4);
  const elig = computeEligibility(f.batch, f.rows);

  it('EX-DATA-99 : la ventilation des motifs de rejet et les éligibles somment exactement à N', () => {
    expect(elig.eligible.length + elig.noPrice + elig.noYear + elig.noMileage + elig.suspectValue).toBe(f.rows.length);
    expect(elig.eligible.length).toBeGreaterThan(SCATTER_MAX_POINTS);
  });

  it('EX-DATA-100 : le plafond K vaut 5 000 et n’est jamais dépassé sur 20 000 éligibles', () => {
    expect(SCATTER_MAX_POINTS).toBe(5000);
    const r = sampleScatter({ eligible: elig.eligible, listingId: f.batch.listingId, isOutlier: f.isOutlier, opportunityScore: f.opportunityScore });
    expect(r.plottedCount).toBe(5000);
    expect(r.rows.length).toBe(5000);
    expect(r.sampled).toBe(true);
  });

  it('EX-DATA-100bis : trois permutations du même jeu produisent le même échantillon octet à octet', () => {
    const inputs = [elig.eligible, permute(elig.eligible, 1), permute(elig.eligible, 7), permute(elig.eligible, 424242)];
    const signatures = inputs.map((rows) => {
      const r = sampleScatter({ eligible: rows, listingId: f.batch.listingId, isOutlier: f.isOutlier, opportunityScore: f.opportunityScore });
      return listingIdSequence(f.batch, r.rows);
    });
    // Les permutations sont bien distinctes en entrée…
    expect(listingIdSequence(f.batch, inputs[1] as Int32Array)).not.toBe(listingIdSequence(f.batch, inputs[0] as Int32Array));
    // …et l'échantillon de sortie est identique, chaîne pour chaîne.
    for (const sig of signatures) expect(sig).toBe(signatures[0]);
    expect(signatures[0]!.split('|')).toHaveLength(5000);
  });

  it('EX-DATA-118 : l’échantillon est rendu trié par listingId croissant (ordre total)', () => {
    const r = sampleScatter({ eligible: elig.eligible, listingId: f.batch.listingId, isOutlier: f.isOutlier, opportunityScore: f.opportunityScore });
    for (let i = 1; i < r.rows.length; i++) {
      expect(compareListingId(f.batch.listingId, r.rows[i - 1] as number, r.rows[i] as number)).toBeLessThan(0);
    }
  });

  it('EX-DATA-101 : le code applique le PAS RÉGULIER sur listingId (ré-implémentation indépendante)', () => {
    const K = SCATTER_MAX_POINTS;
    // Référence écrite ici depuis le pseudo-code d'EX-DATA-101, sans réutiliser le module revu.
    const A: number[] = [];
    const B: number[] = [];
    for (let i = 0; i < elig.eligible.length; i++) {
      const row = elig.eligible[i] as number;
      if (f.isOutlier(row)) A.push(row);
      else B.push(row);
    }
    expect(A.length).toBeGreaterThan(0);
    expect(A.length).toBeLessThan(K); // on est bien dans la 3ᵉ branche du pseudo-code
    B.sort((a, b) => compareListingId(f.batch.listingId, a, b));
    const q = K - A.length;
    const step = B.length / q;
    const picked: number[] = [];
    for (let j = 0; j < q; j++) picked.push(B[Math.floor(j * step)] as number);
    const expected = [...A, ...picked]
      .sort((a, b) => compareListingId(f.batch.listingId, a, b))
      .map((row) => decodeListingId(f.batch.listingId, row))
      .join('|');

    const r = sampleScatter({ eligible: elig.eligible, listingId: f.batch.listingId, isOutlier: f.isOutlier, opportunityScore: f.opportunityScore });
    expect(listingIdSequence(f.batch, r.rows)).toBe(expected);
    // Corollaire : tous les outliers éligibles sont conservés (EX-DATA-101, clause A entier).
    expect(r.outlierPlottedCount).toBe(r.outlierCount);
    expect(r.outlierTruncated).toBe(false);
  });

  it('EX-DATA-100bis (2e branche) : la graine 0x4B594341 est déclarée mais aucun mélange pseudo-aléatoire n’est implémenté', () => {
    expect(SCATTER_SAMPLING_SEED).toBe(0x4b594341);
    const code = readdirSync(DIST_DIR)
      .filter((n) => (n.endsWith('.ts') || n.endsWith('.tsx')) && !n.endsWith('.test.ts'))
      .map((n) => readFileSync(join(DIST_DIR, n), 'utf8'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '') // hors commentaires : les deux algorithmes y sont cités
      .replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/xoshiro/i); // aucun générateur xoshiro128** implémenté
    expect(code).not.toMatch(/fisher/i); // aucun mélange de Fisher-Yates implémenté
  });

  it('EX-DATA-101 (2e branche) : |A| ≥ K trace les K plus grands |opportunityScore| et signale la troncature', () => {
    const r = sampleScatter({
      eligible: elig.eligible,
      listingId: f.batch.listingId,
      isOutlier: () => true, // toutes les lignes signalées → |A| = n_e ≥ K
      opportunityScore: (row) => (row % 997) / 997,
      maxPoints: 100,
    });
    expect(r.plottedCount).toBe(100);
    expect(r.outlierTruncated).toBe(true);
    expect(r.outlierCount).toBe(elig.eligible.length);
    expect(r.outlierPlottedCount).toBe(100);
  });

  it('n_e ≤ K : aucun sous-tirage, sampled = faux, tout est tracé', () => {
    const small = elig.eligible.slice(0, 400);
    const r = sampleScatter({ eligible: small, listingId: f.batch.listingId, isOutlier: f.isOutlier, opportunityScore: f.opportunityScore });
    expect(r.sampled).toBe(false);
    expect(r.plottedCount).toBe(400);
    expect(r.eligibleCount).toBe(400);
  });
});

describe('D7 · G4 — seuils de 20 000 de l’annexe B (§9.2, EX-SCR-157)', () => {
  const sources = readdirSync(DIST_DIR)
    .filter((n) => n.endsWith('.ts') || n.endsWith('.tsx'))
    .filter((n) => !n.endsWith('.test.ts'))
    .map((n) => ({ name: n, text: readFileSync(join(DIST_DIR, n), 'utf8') }));

  it('aucun seuil de 20 000 points n’est codé (lecture §9.2 : K = 5 000 gouverne, le 20 000 est code mort)', () => {
    for (const s of sources) {
      const code = s.text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(code, `fichier ${s.name}`).not.toMatch(/\b20[_ ]?000\b/);
    }
  });

  it('R-D7-05 — le bandeau ET-TROP-RESULTATS d’EX-SCR-157 n’est implémenté nulle part dans le lot', () => {
    const all = sources.map((s) => s.text).join('\n');
    expect(all).toContain('ET-TROP-RESULTATS');
  });
});

describe('D7 · G4 — le banc de perf exerce bien un contexte Canvas 2D (EX-NFR-7/8)', () => {
  it('drawScatter émet un arc + un fill + un stroke PAR POINT sur le contexte reçu', async () => {
    const { drawScatter } = await import('../../../src/screens/distribution/scatter-render');
    const { makeProjector, buildScatterPoints } = await import('../../../src/screens/distribution/scatter-model');
    const f2 = fixture(2000, 0xc5);
    const elig2 = computeEligibility(f2.batch, f2.rows);
    const r = sampleScatter({ eligible: elig2.eligible, listingId: f2.batch.listingId, isOutlier: f2.isOutlier, opportunityScore: f2.opportunityScore });
    const points = buildScatterPoints(f2.batch, r.rows, { isOutlier: f2.isOutlier, opportunityScore: f2.opportunityScore });
    let arcs = 0;
    let fills = 0;
    let strokes = 0;
    let checksum = 0;
    const ctx = {
      fillStyle: '#000',
      strokeStyle: '#000',
      globalAlpha: 1,
      lineWidth: 1,
      clearRect: (): void => {},
      beginPath: (): void => {},
      arc: (x: number, y: number, rad: number): void => {
        arcs++;
        checksum += x + y + rad;
      },
      fill: (): void => {
        fills++;
      },
      stroke: (): void => {
        strokes++;
      },
      setLineDash: (): void => {},
      save: (): void => {},
      restore: (): void => {},
    };
    const proj = makeProjector({ width: 1000, height: 480, padLeft: 48, padRight: 160, padTop: 16, padBottom: 40 }, { lo: 0, hi: 1 }, { lo: 0, hi: 1 });
    const drawn = drawScatter(ctx, points, proj, 1000, 480, {
      variant: 'scatter',
      yearMin: 2000,
      yearMax: 2025,
      mileageMin: 0,
      mileageMax: 300000,
      selectedRows: null,
    });
    expect(drawn).toBe(points.length);
    expect(arcs).toBe(points.length);
    expect(fills).toBe(points.length);
    expect(strokes).toBe(points.length);
    expect(checksum).not.toBe(0); // la boucle n'est pas vide : les coordonnées sont réellement calculées
  });
});
