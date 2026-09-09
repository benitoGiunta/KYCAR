/**
 * KYCAR - Composition du marche : marques, modeles, segments, annees (R-02 a R-06, R-10)
 * =================================================================================================
 * Trois briques :
 *
 *  1. `apportionMakes`   - R-02, apportionnement au plus fort reste sur `makes.json`, avec plancher
 *                          de presence sur les 120 premieres marques. Effectifs EXACTS, donc stables
 *                          d'un snapshot a l'autre (R-52, sonde P-66) et proportionnels au volume.
 *  2. `buildCatalog`     - R-03/R-04/R-10, catalogue par marque : modeles curates (part, segment,
 *                          fenetre de production) et modeles de queue en Zipf(1,15) avec fenetre
 *                          derivee d'un hachage stable. Indexe PAR ANNEE : un modele n'est tirable
 *                          que sur sa fenetre, ce qui rend `P-12` vraie par construction.
 *  3. `calibrateSegments`- R-05/R-06, reconciliation des deux lois de composition que la
 *                          specification pose SEPAREMENT : la part de modele dans la marque
 *                          (`models.json`) et la part de segment par annee (`segments.json` corrigee
 *                          du biais de stock). Elles ne sont pas compatibles telles quelles (voir
 *                          DATASET-GEN.md §6, ecart EG-01) ; le generateur en prend la reconciliation
 *                          d'entropie maximale : un ajustement proportionnel iteratif (IPF, 12 tours
 *                          amortis a 0,7) qui laisse les marges de marque intactes et amene la loi
 *                          P(segment | annee) sur sa cible. Deterministe, sans alea.
 */

import { hashToUnit } from './prng.mjs';
import { interpolate } from './tables.mjs';

/** Domaine de hachage de la fenetre de production d'un modele de queue. */
const DOM_WINDOW = 0x51ee1;

/**
 * R-02 - apportionnement au plus fort reste, puis plancher de presence.
 * @returns {{ counts: Int32Array, makes: object[] }} effectifs alignes sur `makes.json`
 */
export function apportionMakes(total, makesTable) {
  const makes = makesTable.makes;
  const n = makes.length;
  const counts = new Int32Array(n);
  const remainders = [];
  let assigned = 0;
  for (let i = 0; i < n; i += 1) {
    const exact = (total * makes[i].sharePct) / 100;
    const base = Math.floor(exact);
    counts[i] = base;
    assigned += base;
    remainders.push({ i, r: exact - base });
  }
  remainders.sort((a, b) => (b.r === a.r ? a.i - b.i : b.r - a.r));
  let seats = total - assigned;
  for (let k = 0; k < remainders.length && seats > 0; k += 1, seats -= 1) {
    counts[remainders[k].i] += 1;
  }

  // Plancher de presence : les `presenceFloorMakes` premieres marques (ordre de part decroissante,
  // qui est celui du fichier) recoivent au moins une annonce. Le siege est pris a la marque la plus
  // fournie du moment, ce qui borne la distorsion au strict necessaire.
  const floor = makesTable.presenceFloorMakes ?? 0;
  let moved = 0;
  for (let i = 0; i < Math.min(floor, n); i += 1) {
    if (counts[i] > 0) continue;
    let donor = 0;
    for (let j = 1; j < n; j += 1) if (counts[j] > counts[donor]) donor = j;
    if (counts[donor] <= 1) break;
    counts[donor] -= 1;
    counts[i] += 1;
    moved += 1;
  }
  return { counts, makes, movedForPresenceFloor: moved };
}

/** Loi d'age discretisee (R-09) : masse de l'intervalle (a-0.5, a+0.5] d'une log-normale. */
export function buildAgeLaw(ageTable) {
  const sigma = ageTable.ageDistribution.sigma;
  const mu = Math.log(7.0); // "ln(7.0)" de age-and-mileage.json
  const min = ageTable.ageDistribution.ageMin;
  const max = ageTable.ageDistribution.ageMax;
  const erf = (x) => {
    // Approximation d'Abramowitz-Stegun 7.1.26 (|erreur| < 1.5e-7), deterministe.
    const s = x < 0 ? -1 : 1;
    const a = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * a);
    const y =
      1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
        t *
        Math.exp(-a * a);
    return s * y;
  };
  const cdf = (x) => (x <= 0 ? 0 : 0.5 * (1 + erf((Math.log(x) - mu) / (sigma * Math.SQRT2))));
  const pmf = new Float64Array(max - min + 1);
  let sum = 0;
  for (let a = min; a <= max; a += 1) {
    const p = cdf(a + 0.5) - cdf(a - 0.5);
    pmf[a - min] = p;
    sum += p;
  }
  for (let i = 0; i < pmf.length; i += 1) pmf[i] /= sum;
  const cumulative = new Float64Array(pmf.length);
  let acc = 0;
  for (let i = 0; i < pmf.length; i += 1) {
    acc += pmf[i];
    cumulative[i] = acc;
  }
  return { min, max, pmf, cumulative };
}

/** Part de segment visee dans le STOCK a l'annee `y` (R-05 + biais d'exposition R-06). */
export function stockSegmentShares(segmentsTable, y) {
  const { pivots, values } = segmentsTable.segmentShareByYear;
  const bias = segmentsTable.stockBias;
  const segments = Object.keys(values);
  const raw = segments.map((s) => interpolate(pivots, values[s], y) * bias[s]);
  const total = raw.reduce((a, b) => a + b, 0);
  return { segments, shares: raw.map((v) => v / total) };
}

/**
 * R-03/R-04/R-10 - catalogue par marque, indexe par annee de premiere immatriculation.
 * @param {number} capturedYear annee du snapshot (borne haute des fenetres)
 */
export function buildCatalog(tables, capturedYear) {
  const minYear = capturedYear - 40;
  const curatedByMake = new Map();
  for (const m of tables.models.models) {
    if (!curatedByMake.has(m.makeSlug)) curatedByMake.set(m.makeSlug, []);
    curatedByMake.get(m.makeSlug).push(m);
  }
  const taxoByMake = new Map();
  for (const mk of tables.taxonomy.makes) {
    taxoByMake.set(
      mk.slug,
      mk.models.filter((x) => x.vehicleType === 'C'),
    );
  }
  const zipfExp = tables.models.tailZipfExponent;

  /** @type {Map<string, object>} */
  const byMake = new Map();
  for (const mk of tables.makes.makes) {
    const curated = (curatedByMake.get(mk.slug) ?? []).map((m) => ({
      curated: true,
      modelId: m.modelId,
      modelSlug: m.modelSlug,
      modelName: null,
      weight: m.shareInMake,
      segment: m.segment,
      from: m.yearFrom,
      to: Math.min(m.yearTo + 1, capturedYear),
      powerKwMedian: m.powerKwMedian,
    }));
    const curatedIds = new Set(curated.map((c) => c.modelId));
    const curatedMass = curated.reduce((a, c) => a + c.weight, 0);
    const tailMass = Math.max(0, 1 - curatedMass);
    const taxo = taxoByMake.get(mk.slug) ?? [];
    const tail = [];
    let rank = 0;
    for (const tm of taxo) {
      if (curatedIds.has(tm.id)) continue;
      rank += 1;
      const h1 = hashToUnit((tm.id ^ DOM_WINDOW) | 0);
      const h2 = hashToUnit((tm.id ^ (DOM_WINDOW + 1)) | 0);
      const from = 1985 + Math.floor(h1 * 35);
      const to = Math.min(from + 6 + Math.floor(h2 * 11), capturedYear);
      tail.push({
        curated: false,
        modelId: tm.id,
        modelSlug: tm.slug,
        modelName: tm.label,
        weight: 1 / Math.pow(rank, zipfExp),
        segment: null,
        from,
        to,
        powerKwMedian: null,
      });
    }
    const tailTotal = tail.reduce((a, x) => a + x.weight, 0);
    // Nom lisible des modeles curates : recupere dans la taxonomie (S9).
    const labelById = new Map(taxo.map((x) => [x.id, x.label]));
    for (const c of curated) c.modelName = labelById.get(c.modelId) ?? c.modelSlug;

    // Index par annee : quels modeles sont tirables, et avec quels poids de base.
    const years = new Map();
    for (let y = minYear; y <= capturedYear; y += 1) {
      const cur = curated.filter((c) => y >= c.from && y <= c.to);
      const tl = tail.filter((c) => y >= c.from && y <= c.to);
      if (cur.length === 0 && tl.length === 0) continue;
      const tlTotal = tl.reduce((a, x) => a + x.weight, 0);
      const tlCum = new Float64Array(tl.length);
      let acc = 0;
      for (let i = 0; i < tl.length; i += 1) {
        acc += tl[i].weight;
        tlCum[i] = acc;
      }
      years.set(y, {
        curated: cur,
        tail: tl,
        tailCum: tlCum,
        tailWeight: tl.length > 0 ? tailMass : 0,
        tailShareOfAll: tailTotal > 0 ? tlTotal / tailTotal : 0,
      });
    }
    byMake.set(mk.slug, { makeSlug: mk.slug, makeId: mk.makeId, curated, tail, years, curatedMass });
  }
  return { byMake, minYear, capturedYear };
}

/**
 * R-05/R-06 - calibrage IPF du tirage de modele pour que P(segment | annee) atteigne la cible de
 * stock sans toucher aux marges de marque. Retourne `tilt[segment][annee]` et, par (marque, annee),
 * les poids cumules definitifs.
 */
export function calibrateSegments(tables, catalog, makeShares) {
  const { minYear, capturedYear } = catalog;
  const target = new Map();
  for (let y = minYear; y <= capturedYear; y += 1) target.set(y, stockSegmentShares(tables.segments, y));
  const segments = target.get(capturedYear).segments;
  /** @type {Map<string, Float64Array>} tilt[segment] indexe par (annee - minYear) */
  const tilt = new Map();
  const span = capturedYear - minYear + 1;
  for (const s of segments) tilt.set(s, new Float64Array(span).fill(1));

  const segIndex = new Map(segments.map((s, i) => [s, i]));

  const measure = () => {
    const acc = new Float64Array(span * segments.length);
    for (const [slug, entry] of catalog.byMake) {
      const w = makeShares.get(slug) ?? 0;
      if (w <= 0) continue;
      for (const [y, yr] of entry.years) {
        const yi = y - minYear;
        let tot = yr.tailWeight;
        for (const c of yr.curated) tot += c.weight * tilt.get(c.segment)[yi];
        if (tot <= 0) continue;
        for (const c of yr.curated) {
          acc[yi * segments.length + segIndex.get(c.segment)] +=
            (w * c.weight * tilt.get(c.segment)[yi]) / tot;
        }
        const tgt = target.get(y).shares;
        for (let s = 0; s < segments.length; s += 1) {
          acc[yi * segments.length + s] += (w * yr.tailWeight * tgt[s]) / tot;
        }
      }
    }
    return acc;
  };

  for (let it = 0; it < 12; it += 1) {
    const acc = measure();
    for (let yi = 0; yi < span; yi += 1) {
      let tot = 0;
      for (let s = 0; s < segments.length; s += 1) tot += acc[yi * segments.length + s];
      if (tot <= 0) continue;
      const tgt = target.get(minYear + yi).shares;
      for (let s = 0; s < segments.length; s += 1) {
        const real = acc[yi * segments.length + s] / tot;
        if (real <= 0) continue;
        const arr = tilt.get(segments[s]);
        arr[yi] = Math.min(6, Math.max(0.15, arr[yi] * Math.pow(tgt[s] / real, 0.7)));
      }
    }
  }

  // Poids cumules definitifs par (marque, annee) : [modeles curates..., bloc de queue].
  for (const entry of catalog.byMake.values()) {
    for (const [y, yr] of entry.years) {
      const yi = y - minYear;
      const cum = new Float64Array(yr.curated.length + 1);
      let acc = 0;
      for (let i = 0; i < yr.curated.length; i += 1) {
        acc += yr.curated[i].weight * tilt.get(yr.curated[i].segment)[yi];
        cum[i] = acc;
      }
      acc += yr.tailWeight;
      cum[yr.curated.length] = acc;
      yr.cumulative = cum;
      yr.total = acc;
    }
  }
  return { tilt, target, segments, minYear };
}

/** Tire un segment dans la loi de stock de l'annee (modeles de queue, R-04). */
export function drawSegment(calibration, y, u) {
  const shares = calibration.target.get(y) ?? calibration.target.get(calibration.minYear);
  let acc = 0;
  for (let i = 0; i < shares.shares.length; i += 1) {
    acc += shares.shares[i];
    if (u < acc) return shares.segments[i];
  }
  return shares.segments[shares.segments.length - 1];
}
