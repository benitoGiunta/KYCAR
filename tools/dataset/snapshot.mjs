/**
 * KYCAR - Assemblage d'un profil : population, trois snapshots, manifest (R-50 a R-56)
 * =================================================================================================
 * Le profil est une POPULATION DE SLOTS, fixee au premier snapshot : un slot porte sa marque
 * (apportionnement exact, R-02), son concessionnaire (R-27), son role eventuel de clonage et ses
 * anomalies. D'un snapshot a l'autre, un slot change d'occupant (sortie puis entree) mais ne change
 * jamais de proprietes. C'est ce qui rend simultanement vrais :
 *
 *   - `P-66` : l'effectif par marque est identique sur les trois snapshots ;
 *   - `P-72` : l'effectif de chaque anomalie l'est aussi ;
 *   - `P-49` : le jeu de `dealerBucket` est le meme partout ;
 *   - `P-70` : une survivante non revisee est identique champ a champ.
 *
 * Une annonce entrante est tiree sur un flot DEDIE, seme par son rang global : elle peut donc etre
 * retiree jusqu'a satisfaire les exigences de son slot (type de vendeur, base d'une anomalie
 * conditionnelle) sans decaler le flot des autres.
 */

import {
  applyAnomalies,
  assignAnomalySlots,
  assignCloneRoles,
  rateOf,
} from './anomalies.mjs';
import { assignDealers, bucketKey } from './dealers.mjs';
import { buildContext, commercialRound, generateListing, normalFromUnit } from './listing.mjs';
import {
  apportionMakes,
  buildAgeLaw,
  buildCatalog,
  calibrateSegments,
} from './population.mjs';
import { Prng, pureUnit } from './prng.mjs';
import {
  applyMissingness,
  assignDates,
  calibrateMissingness,
  derivePriceFields,
  makeListingId,
  missingnessFields,
  serializeNdjson,
  sortRows,
  toAs24,
} from './serialize.mjs';

const DOM_EXIT = 0x6e0000;
const DOM_REVISE = 0x6f0000;
const DOM_CLONE = 0x700000;
const DOM_ENTRANT = 0x710000;

const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);

/** Identifiant de lot au format du schema de manifest : `<marketplace>-<AAAAMMJJThhmmssZ>`. */
export function snapshotIdOf(marketplace, isoDate) {
  return `${marketplace}-${isoDate.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`;
}

/** Loi d'age des entrantes : loi du stock inclinee de exp(-0,02 a), renormalisee (R-52). */
function entrantAgeLaw(ageLaw) {
  const w = new Float64Array(ageLaw.pmf.length);
  for (let i = 0; i < w.length; i += 1) w[i] = ageLaw.pmf[i] * Math.exp(-0.02 * (ageLaw.min + i));
  const cumulative = new Float64Array(w.length);
  let acc = 0;
  for (let i = 0; i < w.length; i += 1) {
    acc += w[i];
    cumulative[i] = acc;
  }
  return { cumulative, total: acc };
}

/** Prepare tout ce qui ne depend que du profil et de la graine. */
export function prepareProfile(tables, profileName, seed) {
  const profile = tables.profiles.profiles.find((p) => p.name === profileName);
  if (!profile) throw new Error(`profil inconnu : ${profileName}`);
  const snaps = tables.profiles.snapshots;
  const capturedYear = new Date(snaps[0].observedAt).getUTCFullYear();
  const catalog = buildCatalog(tables, capturedYear);
  const makeShares = new Map(tables.makes.makes.map((m) => [m.slug, m.sharePct]));
  const calibration = calibrateSegments(tables, catalog, makeShares);
  const ctx = buildContext(tables, catalog, calibration, capturedYear);
  ctx.ageLaw = buildAgeLaw(tables.ageMileage);
  ctx.entrantTilt = entrantAgeLaw(ctx.ageLaw);
  const labelBySlug = new Map(tables.taxonomy.makes.map((m) => [m.slug, m.label]));
  const { counts, makes, movedForPresenceFloor } = apportionMakes(profile.listingsPerSnapshot, tables.makes);
  const slotMakes = [];
  for (let i = 0; i < makes.length; i += 1) {
    const ref = { slug: makes[i].slug, makeId: makes[i].makeId, label: labelBySlug.get(makes[i].slug) ?? makes[i].slug };
    for (let k = 0; k < counts[i]; k += 1) slotMakes.push(ref);
  }
  return { profile, ctx, slotMakes, counts, snaps, capturedYear, movedForPresenceFloor, seed };
}

/** Genere un occupant de slot sur un flot dedie, en respectant les exigences du slot. */
function makeOccupant(prep, slotIndex, rowIndex, constraints, tilt) {
  const { ctx, slotMakes } = prep;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const prng = new Prng((prep.seed ^ (DOM_ENTRANT + attempt * 0x2545f491) ^ (rowIndex * 0x9e3779b1)) | 0);
    const l = generateListing(ctx, prng, {
      make: slotMakes[slotIndex],
      rowIndex,
      ageTilt: tilt,
      pinModelId: constraints.pinModelId,
      forceSellerType: constraints.forceSellerType,
    });
    if (constraints.requireFuel && !constraints.requireFuel.includes(l.fuelCategory)) continue;
    return finalizeConstraints(l, constraints);
  }
  const prng = new Prng((prep.seed ^ DOM_ENTRANT ^ (rowIndex * 0x9e3779b1)) | 0);
  const l = generateListing(ctx, prng, {
    make: slotMakes[slotIndex],
    rowIndex,
    ageTilt: tilt,
    pinModelId: constraints.pinModelId,
    forceSellerType: constraints.forceSellerType,
  });
  if (constraints.requireFuel) l.fuelCategory = constraints.requireFuel[0];
  return finalizeConstraints(l, constraints);
}

function finalizeConstraints(l, constraints) {
  if (constraints.requireUsedOffer && !['U', 'J', 'O'].includes(l.offerType)) l.offerType = 'U';
  return l;
}

/** Exigences imposees par les anomalies d'un slot a son occupant. */
function constraintsOf(slotAnoms, role, s0Listing) {
  const c = {};
  if (role !== null || (s0Listing && s0Listing.sellerType === 'D')) c.forceSellerType = 'D';
  else if (s0Listing) c.forceSellerType = s0Listing.sellerType;
  for (const a of slotAnoms) {
    if (a.id === 'A-16') c.requireFuel = ['2', '3'];
    if (a.id === 'A-14') c.requireFuel = ['B', 'D', '2', '3'];
    if (a.id === 'A-15') c.requireFuel = ['B', 'D'];
    if (a.id === 'A-03') c.requireUsedOffer = true;
    if (a.id === 'A-11' && s0Listing) c.pinModelId = s0Listing.modelId;
  }
  return c;
}

/** Reprend la valeur plausible d'un occupant pour un snapshot donne (copie de travail). */
function workingCopy(l) {
  return {
    ...l,
    anomalies: [],
    priceStatus: 'QUOTED',
    displayPrice: l.basePrice,
    isTaxDeductible: null,
    netPrice: null,
    vatRate: null,
    isNegotiable: null,
    evaluationCategory: null,
    superDeal: false,
    msrp: null,
    firstRegOverride: undefined,
    fuelCategoryAbsent: false,
    primaryFuelTypeAbsent: false,
    modelAbsent: false,
    co2Zero: false,
    forceIncomplete: false,
    mileageUnit: 'km',
  };
}

/** Genere les trois snapshots d'un profil. */
export function generateProfile(tables, profileName, seed) {
  const prep = prepareProfile(tables, profileName, seed);
  const { ctx, profile, snaps, slotMakes } = prep;
  const N = profile.listingsPerSnapshot;
  const fields = missingnessFields(tables);

  /* ---- Premier snapshot : population plausible sur un flot unique --------------------------------- */
  const prng0 = new Prng(seed);
  /** @type {object[]} occupant courant de chaque slot */
  let occupants = new Array(N);
  for (let j = 0; j < N; j += 1) {
    occupants[j] = generateListing(ctx, prng0, { make: slotMakes[j], rowIndex: j });
  }
  let nextRow = N;

  /* ---- Proprietes de slot : clonage, concessionnaires, anomalies ---------------------------------- */
  const roles = assignCloneRoles(occupants, tables, seed, N);
  assignDealers(occupants, ctx, profileName, seed);
  applyAdTierPremium(occupants, tables);
  applyClonesAtOrigin(occupants, roles, tables, seed, profileName);
  const cellCount = new Map();
  for (const l of occupants) {
    const k = `${l.makeId}|${l.modelId}`;
    cellCount.set(k, (cellCount.get(k) ?? 0) + 1);
  }
  const slotAnoms = assignAnomalySlots(occupants, roles, tables, seed, N, cellCount);
  const slotSeller = occupants.map((l) => l.sellerType);
  const slotBucket = occupants.map((l) => l.dealerBucket);
  const slotBucketRank = occupants.map((l) => l.bucketRank ?? null);
  const slotAdTier = occupants.map((l) => l.adTier);
  const slotConstraints = occupants.map((l, j) => constraintsOf(slotAnoms[j], roles[j], l));

  /* ---- Calibrage du modele de completude : mesure UNE fois, puis gele (R-43) ---------------------- */
  const missCalib = calibrateMissingness(occupants, fields, tables);
  const normalizer = missCalib.normalizer;

  /* ---- Chaine des trois snapshots ---------------------------------------------------------------- */
  const results = [];
  const dyn = tables.dynamics;
  let previousId = null;
  let entered = N;
  let exited = 0;
  let revisedCount = 0;
  const isNewFlag = new Array(N).fill(false);

  for (let k = 0; k < snaps.length; k += 1) {
    const capturedAt = snaps[k].observedAt;
    const capturedAtMs = Date.parse(capturedAt);

    if (k > 0) {
      /* Sorties (R-51) : un slot de clonage suit le sort de sa source. */
      const exits = new Uint8Array(N);
      for (let j = 0; j < N; j += 1) {
        if (roles[j] !== null) continue;
        const p = 1 - Math.exp(-7 / occupants[j].dwellDays);
        if (pureUnit(seed, DOM_EXIT + k, occupants[j].rowIndex) < p) exits[j] = 1;
      }
      for (let j = 0; j < N; j += 1) if (roles[j] !== null && exits[roles[j].src]) exits[j] = 1;
      exited = 0;
      for (let j = 0; j < N; j += 1) if (exits[j]) exited += 1;
      entered = exited;

      /* Entrees (R-52) : autant que de sorties, dans la MEME marque (le slot ne change pas). */
      const next = occupants.slice();
      for (let j = 0; j < N; j += 1) {
        if (!exits[j] || roles[j] !== null) continue;
        next[j] = makeOccupant(prep, j, nextRow, slotConstraints[j], ctx.entrantTilt);
        next[j].dealerBucket = slotBucket[j];
        next[j].bucketRank = slotBucketRank[j];
        next[j].adTier = slotAdTier[j];
        next[j].sellerType = slotSeller[j];
        applyAdTierPremiumOne(next[j], tables);
        nextRow += 1;
        isNewFlag[j] = true;
      }
      for (let j = 0; j < N; j += 1) {
        if (!exits[j] || roles[j] === null) continue;
        next[j] = cloneFrom(next[roles[j].src], roles[j], nextRow, tables, seed);
        next[j].dealerBucket = roles[j].kind === 'A-07b' ? next[roles[j].src].dealerBucket : slotBucket[j];
        nextRow += 1;
        isNewFlag[j] = true;
      }
      for (let j = 0; j < N; j += 1) if (!exits[j]) isNewFlag[j] = false;
      occupants = next;

      /* Revisions de prix et derive du nombre d'images (R-53) : seuls champs mobiles. */
      revisedCount = 0;
      const pr = dyn.priceRevision;
      for (let j = 0; j < N; j += 1) {
        if (exits[j]) continue;
        const l = occupants[j];
        const u = pureUnit(seed, DOM_REVISE + k * 3, l.rowIndex);
        if (u < pr.shareOfSurvivors) {
          const dir = pureUnit(seed, DOM_REVISE + k * 3 + 1, l.rowIndex) < pr.direction.down ? -1 : 1;
          const med = dir < 0 ? pr.amplitude.medianDown : pr.amplitude.medianUp;
          const z = pureUnit(seed, DOM_REVISE + k * 3 + 2, l.rowIndex);
          const amp = clamp(med * Math.exp(pr.amplitude.sigma * inverseNormal(z)), pr.amplitude.clamp[0], pr.amplitude.clamp[1]);
          l.basePrice = commercialRound(l.basePrice * (1 + dir * amp), tables.priceModel.commercialRounding.bands, l.uRound, l.uGrid);
          l.revisedAt = capturedAtMs;
          revisedCount += 1;
        }
        if (pureUnit(seed, DOM_REVISE + k * 3 + 2, l.rowIndex + 7) < pr.imageCountDrift.shareOfSurvivors) {
          l.imageCount = Math.min(50, l.imageCount + 1 + Math.floor(pureUnit(seed, DOM_REVISE + k, l.rowIndex + 11) * 4));
          l.revisedAt = capturedAtMs;
        }
      }
    }

    /* ---- Dates, anomalies, prix derives, valeurs manquantes, projection ------------------------- */
    const rows = new Array(N);
    const groundTruth = [];
    for (let j = 0; j < N; j += 1) {
      const src = occupants[j];
      if (src.listingId === undefined) src.listingId = makeListingId(seed, src.rowIndex);
      if (src.createdAt === undefined) assignDates(src, capturedAtMs, seed, k > 0);
      if (src.revisedAt === capturedAtMs) {
        src.lastUpdatedAt = isoOf(
          Math.max(src.activatedMs, capturedAtMs - Math.floor(pureUnit(seed, DOM_REVISE, src.rowIndex) * 6 * 86400000)),
        );
      }

      const l = workingCopy(src);
      l.isNew = isNewFlag[j];
      const gt = applyAnomalies(l, slotAnoms[j], ctx, seed, cellCount);
      derivePriceFields(l, ctx, seed);
      const absent = applyMissingness(l, fields, tables, seed, missCalib);
      rows[j] = { o: toAs24(l, absent, ctx, { capturedAtMs }), slot: j };
      for (const g of gt) groundTruth.push({ listingId: l.listingId, ...g });
      src.working = l;
    }

    /* ---- Les trois anomalies de doublon : verite terrain de PAIRE ------------------------------- */
    for (let j = 0; j < N; j += 1) {
      const role = roles[j];
      if (role === null) continue;
      const src = occupants[role.src];
      const cl = occupants[j];
      if (role.kind === 'A-07') {
        // Meme ligne ecrite deux fois : la ligne du clone EST l'objet de sa source.
        rows[j].o = rows[role.src].o;
        groundTruth.push({
          listingId: src.listingId,
          anomaly: 'DUPLICATE_LISTING_ID',
          detail: 'identifiant ecrit deux fois dans le fichier',
          peerListingId: src.listingId,
          expected: { occurrences: 2 },
        });
      } else if (role.kind === 'A-07b') {
        groundTruth.push({
          listingId: cl.listingId,
          anomaly: 'DUPLICATE_VALUE_CONFLICT',
          detail: 'republication intra-vendeur, prix different',
          peerListingId: src.listingId,
          expected: {
            dealerBucket: cl.dealerBucket,
            price: cl.working.displayPrice,
            peerPrice: src.working.displayPrice,
          },
        });
      } else {
        groundTruth.push({
          listingId: cl.listingId,
          anomaly: 'CROSS_SELLER_DUPLICATE',
          detail: 'quasi-doublon inter-vendeurs',
          peerListingId: src.listingId,
          expected: {
            price: cl.working.displayPrice,
            peerPrice: src.working.displayPrice,
            mileage: cl.mileage,
            peerMileage: src.mileage,
            dealerBucket: cl.dealerBucket,
            peerDealerBucket: src.dealerBucket,
          },
        });
      }
    }

    sortRows(rows);
    const objects = rows.map((r) => r.o);
    const ser = serializeNdjson(objects);
    const snapshotId = snapshotIdOf('be', capturedAt);
    results.push({
      index: k,
      snapshotId,
      previousSnapshotId: previousId,
      capturedAt,
      capturedAtMs,
      objects,
      ser,
      groundTruth,
      delta: k === 0 ? null : { enteredCount: entered, exitedCount: exited, priceRevisedCount: revisedCount, carriedOverCount: N - entered },
      designSnapshotId: `be-fixture-${profileName}-${snaps[k].snapshotSuffix}-${(seed >>> 0).toString(16).padStart(8, '0')}`,
    });
    previousId = snapshotId;
  }

  return {
    profile,
    prep,
    results,
    normalizer,
    roles,
    slotAnoms,
    cellCount,
    anomalyTargets: Object.fromEntries(
      tables.anomalies.anomalies.filter((a) => a.rate > 0).map((a) => [a.id, Math.round(rateOf(tables, a.id) * N)]),
    ),
  };
}

const isoOf = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

/** Inverse de la loi normale : l'approximation d'Acklam, partagee avec `listing.mjs`. */
const inverseNormal = normalFromUnit;

/** Surcote publicitaire (R-20) : appliquee apres l'attribution du palier, avec le meme arrondi. */
function applyAdTierPremium(listings, tables) {
  for (const l of listings) applyAdTierPremiumOne(l, tables);
}

function applyAdTierPremiumOne(l, tables) {
  const premium = tables.priceModel.adTierPremium[l.adTier ?? 'NONE'] ?? 1;
  if (premium === 1) return;
  l.justPrice *= premium;
  l.displayPrice = commercialRound(l.justPrice, tables.priceModel.commercialRounding.bands, l.uRound, l.uGrid);
  l.basePrice = l.displayPrice;
}

/** Construit un clone (A-07b ou A-08) a partir de sa source. */
function cloneFrom(src, role, rowIndex, tables, seed) {
  const c = { ...src, rowIndex, listingId: undefined, createdAt: undefined };
  const u = (k) => pureUnit(seed, DOM_CLONE + k, rowIndex);
  if (role.kind === 'A-07') return c;
  if (role.kind === 'A-07b') {
    const f = 1 + (0.01 + u(1) * 0.03) * (u(2) < 0.5 ? -1 : 1);
    c.basePrice = commercialRound(src.basePrice * f, tables.priceModel.commercialRounding.bands, c.uRound, c.uGrid);
  } else {
    const f = 1 + (0.02 + u(1) * 0.07) * (u(2) < 0.5 ? -1 : 1);
    c.basePrice = commercialRound(src.basePrice * f, tables.priceModel.commercialRounding.bands, c.uRound, c.uGrid);
    c.mileage = Math.max(0, src.mileage + Math.round((u(3) * 400) / 100) * 100);
    c.modelVersion = reformulate(src.modelVersion, u(4));
  }
  c.displayPrice = c.basePrice;
  return c;
}

/** Reformulation de la version d'un quasi-doublon inter-vendeurs (A-08). */
function reformulate(text, u) {
  const parts = text.split(' ');
  if (parts.length > 2 && u < 0.5) return `${parts[0]} ${parts.slice(2).join(' ')} ${parts[1]}`.slice(0, 121);
  return `${text.toUpperCase()}`.slice(0, 121);
}

/** Applique les roles de clonage au premier snapshot (les occupants existent deja). */
export function applyClonesAtOrigin(occupants, roles, tables, seed, profileName) {
  const count = tables.sellers.dealerBucket.counts[profileName];
  for (let j = 0; j < occupants.length; j += 1) {
    const role = roles[j];
    if (role === null) continue;
    const src = occupants[role.src];
    const own = occupants[j];
    const clone = cloneFrom(src, role, own.rowIndex, tables, seed);
    clone.dealerBucket = role.kind === 'A-07b' ? src.dealerBucket : own.dealerBucket;
    clone.bucketRank = role.kind === 'A-07b' ? src.bucketRank : own.bucketRank;
    clone.adTier = own.adTier;
    if (role.kind === 'A-08') ensureDistinctBucket(clone, src, profileName, count, seed);
    occupants[j] = clone;
  }
}

/**
 * Contrainte 12 : un quasi-doublon inter-vendeurs porte deux `dealerBucket` DIFFERENTS. Quand
 * l'attribution a place les deux annonces chez le meme concessionnaire, le clone est deplace vers
 * le bucket voisin, choisi par hachage pur.
 */
function ensureDistinctBucket(clone, src, profileName, count, seed) {
  if (clone.dealerBucket !== src.dealerBucket) return;
  const start = Math.floor(pureUnit(seed, DOM_CLONE + 90, clone.rowIndex) * count);
  for (let d = 0; d < count; d += 1) {
    const r = (start + d) % count;
    const key = bucketKey(profileName, r);
    if (key !== src.dealerBucket) {
      clone.dealerBucket = key;
      clone.bucketRank = r;
      return;
    }
  }
}
