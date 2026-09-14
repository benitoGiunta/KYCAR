/**
 * KYCAR - Concessionnaires fictifs et palier publicitaire (R-27, R-28 ; D3-02, contraintes 11/12/15)
 * =================================================================================================
 * `seller.dealerBucket` est une cle PSEUDONYME : 32 bits de poids fort de `SHA-256(sel_profil ||
 * index)`, ecrits en 8 caracteres hexadecimaux minuscules. L'index du concessionnaire fictif
 * n'existe que dans ce module et n'est JAMAIS ecrit : la cle n'est pas reversible, et sa
 * distribution est uniforme (sonde P-81).
 *
 * L'appartenance a un bucket est une propriete du SLOT, pas de l'annonce : une annonce entrante
 * herite du bucket du slot qu'elle occupe, ce qui rend le bucket d'une survivante immuable
 * (contrainte 4, sonde P-70) et le jeu de buckets identique sur les trois snapshots (P-49).
 */

import { createHash } from 'node:crypto';

import { hashToUnit, combineKeys } from './prng.mjs';

const DOM_PREF = 0x9b17;
const DOM_TIER = 0x9c28;

/** Cle publiee d'un concessionnaire fictif : 8 hexa minuscules, non reversible. */
export function bucketKey(profile, index) {
  return createHash('sha256').update(`kycar-fixture-${profile}|${index}`).digest('hex').slice(0, 8);
}

/**
 * Tailles de stock en Zipf(0.85), bornees [3, 400], sommant EXACTEMENT au nombre d'annonces
 * professionnelles.
 */
export function bucketSizes(count, proCount, law) {
  const exponent = law.exponent;
  const [lo, hi] = law.bounds;
  const raw = new Float64Array(count);
  for (let r = 0; r < count; r += 1) raw[r] = 1 / Math.pow(r + 1, exponent);
  const sizes = new Int32Array(count);
  // Repartition proportionnelle bornee : on itere pour absorber la masse ecretee.
  let free = new Uint8Array(count).fill(1);
  let remaining = proCount;
  for (let pass = 0; pass < 8; pass += 1) {
    let mass = 0;
    for (let r = 0; r < count; r += 1) if (free[r]) mass += raw[r];
    if (mass <= 0) break;
    let changed = false;
    for (let r = 0; r < count; r += 1) {
      if (!free[r]) continue;
      const v = (raw[r] / mass) * remaining;
      if (v > hi) {
        sizes[r] = hi;
        free[r] = 0;
        remaining -= hi;
        changed = true;
      } else if (v < lo) {
        sizes[r] = lo;
        free[r] = 0;
        remaining -= lo;
        changed = true;
      }
    }
    if (!changed) break;
  }
  // Reste : plus fort reste sur les buckets libres.
  let mass = 0;
  for (let r = 0; r < count; r += 1) if (free[r]) mass += raw[r];
  const rem = [];
  let assigned = 0;
  for (let r = 0; r < count; r += 1) {
    if (!free[r]) continue;
    const v = (raw[r] / mass) * remaining;
    sizes[r] = Math.floor(v);
    assigned += sizes[r];
    rem.push({ r, f: v - sizes[r] });
  }
  rem.sort((a, b) => (b.f === a.f ? a.r - b.r : b.f - a.f));
  let seats = remaining - assigned;
  for (let k = 0; k < rem.length && seats > 0; k += 1, seats -= 1) sizes[rem[k].r] += 1;
  // Reparation : personne sous le plancher, somme exacte.
  let total = 0;
  for (let r = 0; r < count; r += 1) total += sizes[r];
  let delta = proCount - total;
  for (let r = 0; r < count && delta !== 0; r += 1) {
    if (delta > 0 && sizes[r] < hi) {
      const add = Math.min(delta, hi - sizes[r]);
      sizes[r] += add;
      delta -= add;
    }
  }
  for (let r = count - 1; r >= 0 && delta < 0; r -= 1) {
    if (sizes[r] > lo) {
      const cut = Math.min(-delta, sizes[r] - lo);
      sizes[r] -= cut;
      delta += cut;
    }
  }
  return sizes;
}

/**
 * Attribue un bucket a chaque slot professionnel et un palier publicitaire coherent avec la taille
 * du stock. Modifie `listings` en place (champs `dealerBucket` et `adTier` du slot).
 */
export function assignDealers(listings, ctx, profile, seed) {
  const sel = ctx.tables.sellers.dealerBucket;
  const count = sel.counts[profile];
  const proIdx = [];
  for (let i = 0; i < listings.length; i += 1) if (listings[i].sellerType === 'D') proIdx.push(i);
  const sizes = bucketSizes(count, proIdx.length, {
    exponent: 0.85,
    bounds: [3, 400],
  });

  // Marques preferees de chaque bucket : 1 a 3 marques tirees au prorata des parts (hachage pur).
  const makeTable = ctx.tables.makes.makes;
  const makeCum = new Float64Array(makeTable.length);
  {
    let acc = 0;
    for (let i = 0; i < makeTable.length; i += 1) {
      acc += makeTable[i].sharePct;
      makeCum[i] = acc;
    }
  }
  const pickMake = (u) => {
    const target = u * makeCum[makeCum.length - 1];
    let lo = 0;
    let hi = makeCum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (target < makeCum[mid]) hi = mid;
      else lo = mid + 1;
    }
    return makeTable[lo].slug;
  };

  const buckets = [];
  for (let r = 0; r < count; r += 1) {
    const h0 = hashToUnit(combineKeys(seed ^ DOM_PREF, r));
    const nPref = 1 + Math.floor(hashToUnit(combineKeys(seed ^ (DOM_PREF + 1), r)) * 3);
    const prefs = new Set();
    for (let k = 0; k < nPref; k += 1) prefs.add(pickMake(hashToUnit(combineKeys(seed ^ (DOM_PREF + 2 + k), r))));
    const share = sel.specialisation.shareOfStockOnPreferred[0] +
      h0 * (sel.specialisation.shareOfStockOnPreferred[1] - sel.specialisation.shareOfStockOnPreferred[0]);
    buckets.push({ r, key: bucketKey(profile, r), size: sizes[r], prefs: [...prefs], prefShare: share, taken: 0 });
  }

  // Files par marque (ordre stable = ordre des slots) et file globale.
  const byMake = new Map();
  for (const i of proIdx) {
    const s = listings[i].makeSlug;
    if (!byMake.has(s)) byMake.set(s, { list: [], p: 0 });
    byMake.get(s).list.push(i);
  }
  const used = new Uint8Array(listings.length);
  let globalPtr = 0;

  const takeFromMake = (slug) => {
    const q = byMake.get(slug);
    if (!q) return -1;
    while (q.p < q.list.length && used[q.list[q.p]]) q.p += 1;
    if (q.p >= q.list.length) return -1;
    const i = q.list[q.p];
    q.p += 1;
    used[i] = 1;
    return i;
  };
  const takeGlobal = () => {
    while (globalPtr < proIdx.length && used[proIdx[globalPtr]]) globalPtr += 1;
    if (globalPtr >= proIdx.length) return -1;
    const i = proIdx[globalPtr];
    globalPtr += 1;
    used[i] = 1;
    return i;
  };

  for (const b of buckets) {
    const target = b.size;
    const wanted = Math.round(target * b.prefShare);
    let taken = 0;
    let guard = 0;
    while (taken < wanted && guard < wanted * 4 + 8) {
      const slug = b.prefs[guard % b.prefs.length];
      const i = takeFromMake(slug);
      guard += 1;
      if (i < 0) continue;
      listings[i].dealerBucket = b.key;
      listings[i].bucketRank = b.r;
      taken += 1;
    }
    while (taken < target) {
      const i = takeGlobal();
      if (i < 0) break;
      listings[i].dealerBucket = b.key;
      listings[i].bucketRank = b.r;
      taken += 1;
    }
    b.taken = taken;
  }
  // Reliquat : les annonces professionnelles non servies rejoignent le plus gros bucket.
  for (const i of proIdx) {
    if (listings[i].dealerBucket === null) {
      listings[i].dealerBucket = buckets[0].key;
      listings[i].bucketRank = 0;
      buckets[0].taken += 1;
    }
  }

  /* ---- Palier publicitaire (R-28, contrainte 15) ------------------------------------------------ */
  const tiers = ctx.tables.sellers.adTier.amongPro;
  const basePresent = 1 - tiers.absent;
  const tierCodes = ['T20', 'T30', 'T40', 'T50'];
  const decile = (rank) => Math.min(9, Math.floor((rank / count) * 10));
  // Propension par decile, renormalisee pour que la part globale reste celle de sellers.json.
  let sum = 0;
  for (const i of proIdx) sum += Math.exp(0.18 * (4.5 - decile(listings[i].bucketRank)));
  const norm = proIdx.length > 0 ? (basePresent * proIdx.length) / sum : 1;
  for (const i of proIdx) {
    const d = decile(listings[i].bucketRank);
    const p = Math.min(0.75, Math.max(0.02, norm * Math.exp(0.18 * (4.5 - d))));
    const u = hashToUnit(combineKeys(seed ^ DOM_TIER, listings[i].rowIndex));
    if (u >= p) continue;
    const w = tierCodes.map((c, k) => tiers[c] * Math.exp(0.3 * k * (4.5 - d) * -0.2));
    const tot = w.reduce((a, b) => a + b, 0);
    const v = hashToUnit(combineKeys(seed ^ (DOM_TIER + 1), listings[i].rowIndex)) * tot;
    let acc = 0;
    for (let k = 0; k < tierCodes.length; k += 1) {
      acc += w[k];
      if (v < acc) {
        listings[i].adTier = tierCodes[k];
        break;
      }
    }
  }
  return { buckets, sizes };
}
