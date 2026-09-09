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
  ageMonthsOf,
  applyAnomalies,
  assignAnomalySlots,
  assignCloneRoles,
  baseCount,
  rateOf,
  structuralCounts,
} from './anomalies.mjs';
import { freezeCellStats } from './cells.mjs';
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
  expectedPresence,
  makeListingId,
  missingnessFields,
  protectedKeysFor,
  serializeNdjson,
  sortRows,
  toAs24,
} from './serialize.mjs';

const DOM_EXIT = 0x6e0000;
const DOM_REVISE = 0x6f0000;
const DOM_CLONE = 0x700000;
const DOM_ENTRANT = 0x710000;
const DOM_ACCEPT = 0x720000;

const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);

/** Identifiant de lot au format du schema de manifest : `<marketplace>-<AAAAMMJJThhmmssZ>`. */
export function snapshotIdOf(marketplace, isoDate) {
  return `${marketplace}-${isoDate.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`;
}

/**
 * DR3-07 - COMPOSITION DES ENTRANTES : STATIONNARITE, PAS UNE INCLINAISON POSTULEE.
 *
 * `R-52` inclinait la loi d'AGE des entrantes de `exp(-0,02 a)` « pour que les arrivees soient un
 * peu plus recentes que le stock ». Cette inclinaison etait posee EN PLUS de la duree d'exposition,
 * alors que `R-50` enonce deja que les deux gouvernent la meme chose : « la composition du stock
 * vaut le flux d'entree multiplie par la duree moyenne d'exposition ». La chaine n'etait donc pas
 * stationnaire. Deux mecanismes la faisaient deriver dans le MEME sens :
 *
 *   - l'inclinaison d'age rajeunissait le flux entrant a chaque snapshot ;
 *   - la duree d'exposition croit avec le prix (`(prix/15000)^0,18`, R-50), donc les annonces BON
 *     MARCHE sortent plus vite ; un flux entrant tire sur la loi du STOCK ne les remplace pas
 *     assez vite, et le stock s'enrichit.
 *
 * Resultat mesure par la revue : la mediane de prix MONTAIT de 5,6 % en deux semaines, quand `P-69`
 * exige un recul. Sur les seules survivantes elle baissait bien (-0,3 %) : le defaut etait
 * entierement dans le renouvellement, pas dans les revisions.
 *
 * LA CORRECTION. La condition de stationnarite s'ecrit, pour TOUT profil `x` d'annonce (age, prix,
 * segment, vendeur - toutes les variables dont `d` depend) :
 *
 *     stock(x) = entrees(x) x d(x)      =>      entrees(x) proportionnel a stock(x) / d(x)
 *
 * `generateListing` tire deja sur la loi du STOCK. Il suffit donc d'ACCEPTER un candidat avec une
 * probabilite proportionnelle a `1 / d(x)`, ce que fait `acceptAsEntrant` : la loi d'entree devient
 * exactement `stock / d`, sur toutes les dimensions a la fois, et le stock cesse de deriver. Un seul
 * mecanisme remplace les deux, et l'inclinaison d'age postulee disparait - son signe n'etait meme
 * pas le bon.
 *
 * La borne basse de `d` (35 jours, R-50) sert de constante de normalisation : le taux d'acceptation
 * moyen vaut environ 0,5, et 24 tirages suffisent (probabilite d'echec inferieure a 1e-7).
 */
const DWELL_MIN_DAYS = 35;

function acceptAsEntrant(listing, seed, rowIndex, attempt) {
  const d = Math.max(DWELL_MIN_DAYS, listing.dwellDays);
  return pureUnit(seed, DOM_ACCEPT + attempt, rowIndex) < DWELL_MIN_DAYS / d;
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
  // DR3-07 : plus d'inclinaison d'age postulee ; la composition des entrantes est obtenue par
  // acceptation-rejet en `1 / d` (voir `acceptAsEntrant`), donc la loi de tirage reste celle du stock.
  ctx.entrantTilt = null;
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
    if (constraints.maxAgeMonths !== undefined && ageMonthsOf(l) > constraints.maxAgeMonths) continue;
    if (constraints.requireBranch !== undefined && l.branch !== constraints.requireBranch) continue;
    // DR3-07 : acceptation-rejet en `1 / d` - c'est ce qui rend la chaine stationnaire.
    if (!acceptAsEntrant(l, prep.seed, rowIndex, attempt)) continue;
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
    if (a.id === 'A-15') {
      c.requireFuel = ['B', 'D'];
      c.requireBranch = 'WLTP'; // DR3-05, voir `eligibleFor` dans anomalies.mjs
    }
    if (a.id === 'A-03') c.requireUsedOffer = true;
    // DR3-02 : le vivier d'A-04 est borne en age ; un slot A-04 doit rester occupe par une annonce
    // assez jeune, sinon l'anomalie redeviendrait indetectable au renouvellement du stock.
    if (a.id === 'A-04') c.maxAgeMonths = 72;
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
  // DR3-10 : les taux d'anomalie s'appliquent a la base que `anomalies.json` DECLARE. Les effectifs
  // de base structurels se mesurent sur les occupants ; l'esperance de presence de `powerHp` apres
  // le modele de completude exige que le calibrage soit fait AVANT le tirage des anomalies (il n'en
  // depend pas : il ne lit que le facteur latent, le type de vendeur et l'age).
  const missCalib = calibrateMissingness(occupants, fields, tables);
  const normalizer = missCalib.normalizer;
  const counts = structuralCounts(occupants, expectedPresence(occupants, fields, tables, missCalib, 'powerHp'));

  const roles = assignCloneRoles(occupants, tables, seed, counts);
  assignDealers(occupants, ctx, profileName, seed);
  applyAdTierPremium(occupants, tables);
  applyClonesAtOrigin(occupants, roles, tables, seed, profileName);
  const cellCount = new Map();
  for (const l of occupants) {
    const k = `${l.makeId}|${l.modelId}`;
    cellCount.set(k, (cellCount.get(k) ?? 0) + 1);
  }
  // DR3-08 / DR3-09 : statistiques de cellule du moteur, mesurees UNE fois sur le premier snapshot
  // et gelees (voir `cells.mjs`). Elles conditionnent le vivier d'A-10 et d'A-11 et la valeur
  // injectee ; les geler est ce qui garantit qu'une survivante non revisee garde son prix (P-70).
  const cellStats = freezeCellStats(occupants);
  const slotAnoms = assignAnomalySlots(occupants, roles, tables, seed, counts, cellCount, cellStats);
  const slotSeller = occupants.map((l) => l.sellerType);
  const slotBucket = occupants.map((l) => l.dealerBucket);
  const slotBucketRank = occupants.map((l) => l.bucketRank ?? null);
  const slotAdTier = occupants.map((l) => l.adTier);
  const slotConstraints = occupants.map((l, j) => constraintsOf(slotAnoms[j], roles[j], l));

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
          // DR3-06 - UNE REVISION QUI NE CHANGE PAS LE PRIX AFFICHE N'EST PAS UNE REVISION.
          //
          // Le tirage etait compte comme revision AVANT l'arrondi commercial (R-25) ; environ 40 %
          // des tirages retombaient sur la MEME valeur de grille, si bien que 10,2 % seulement des
          // survivantes voyaient leur prix affiche bouger pour 17,1 % declares au manifest, sous le
          // plancher de 14 % de `P-68`. On retire tant que l'arrondi ne mord pas, en gardant la
          // DIRECTION (la part a la baisse de `P-68` doit rester dans [80 %, 88 %]) et en
          // augmentant l'amplitude a chaque tentative ; a defaut, on saute d'un cran de grille.
          const dir = pureUnit(seed, DOM_REVISE + k * 3 + 1, l.rowIndex) < pr.direction.down ? -1 : 1;
          const med = dir < 0 ? pr.amplitude.medianDown : pr.amplitude.medianUp;
          const before = l.basePrice;
          let next = before;
          for (let attempt = 0; attempt < 8 && next === before; attempt += 1) {
            const z = pureUnit(seed, DOM_REVISE + k * 3 + 2 + attempt * 97, l.rowIndex);
            // L'amplitude reste bornee a la moitie du prix : au-dela, une revision a la baisse
            // produirait un prix nul ou negatif, que l'arrondi commercial ramenerait a 1 EUR - une
            // SENTINELLE non declaree (sonde R-DATA-18, la reciproque de la verite terrain).
            const amp = clamp(
              med * Math.exp(pr.amplitude.sigma * inverseNormal(z)) * (1 + attempt * 0.6),
              pr.amplitude.clamp[0],
              Math.min(0.5, pr.amplitude.clamp[1] * (1 + attempt * 0.6)),
            );
            next = commercialRound(before * (1 + dir * amp), tables.priceModel.commercialRounding.bands, l.uRound, l.uGrid);
          }
          if (next === before) {
            // Dernier recours : un pas de grille dans la direction tiree. Le prix RESTE une valeur
            // commerciale (P-39) et le mouvement est effectif.
            let step = Math.max(50, Math.round(before * 0.01));
            for (let g = 0; g < 12 && next === before; g += 1) {
              const candidate = commercialRound(
                Math.max(300, before + dir * step),
                tables.priceModel.commercialRounding.bands,
                l.uRound,
                l.uGrid,
              );
              if (candidate !== before) next = candidate;
              step *= 2;
            }
          }
          // Jamais sous 300 EUR : le domaine des prix revises ne doit pas croiser celui des
          // sentinelles absolues d'EX-DATA-19(1), qui sont une VERITE TERRAIN declaree.
          if (next < 300) next = before;
          if (next !== before) {
            l.basePrice = next;
            l.revisedAt = capturedAtMs;
            revisedCount += 1;
          }
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
      const gt = applyAnomalies(l, slotAnoms[j], ctx, seed, cellCount, cellStats);
      derivePriceFields(l, ctx, seed);
      // DR3-11 : un champ PORTEUR d'une anomalie declaree ne peut pas etre retire par le modele de
      // completude - la vérité terrain deviendrait invérifiable (DATASET-SPEC §6).
      const absent = applyMissingness(l, fields, tables, seed, missCalib, protectedKeysFor(l));
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
    counts,
    anomalyTargets: Object.fromEntries(
      tables.anomalies.anomalies
        .filter((a) => a.rate > 0)
        .map((a) => [
          a.id,
          {
            base: a.base,
            baseCount: baseCount(a.base, counts),
            target: Math.round(rateOf(tables, a.id) * baseCount(a.base, counts)),
          },
        ]),
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
