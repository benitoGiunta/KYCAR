/**
 * KYCAR - Generation d'une annonce PLAUSIBLE (R-04 a R-49)
 * =================================================================================================
 * Ce module produit la valeur plausible de chaque champ. Les anomalies (R-57) sont injectees APRES,
 * par `anomalies.mjs`, et les valeurs manquantes (R-43 a R-46) sont appliquees en dernier, par
 * `missing.mjs` : c'est l'ordre qu'impose la vérite terrain (une anomalie doit conserver la valeur
 * plausible qu'elle ecrase).
 *
 * L'objet rendu est un enregistrement INTERNE (champs a plat, plus les variables latentes segment,
 * juste prix, duree d'exposition, langue, facteur de completude). `serialize.mjs` le projette sur la
 * forme `As24Listing`, dans l'ordre de cles fixe de la contrainte 25.
 *
 * Ordre des tirages FIGE (R-30) : toute modification de l'ordre change les octets produits a graine
 * egale. Les traits rares passent par le hachage pur de `prng.mjs` et ne consomment pas ce flot.
 */

import { buildAgeLaw, drawSegment, stockSegmentShares } from './population.mjs';
import { hashToUnit, combineKeys } from './prng.mjs';
import { interpolate, interpolateMap } from './tables.mjs';

/** Inverse de la fonction de repartition normale (Acklam), deterministe. */
export function normalFromUnit(u) {
  const p = Math.min(1 - 1e-12, Math.max(1e-12, u));
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
const round1 = (x) => Math.round(x * 10) / 10;
const logit = (p) => Math.log(p / (1 - p));
const sigmoid = (x) => 1 / (1 + Math.exp(-x));

/** Domaines de hachage stable, par famille de traits. */
export const DOM = {
  MODEL_DISPERSION: 0x11a1,
  DEALER_SALT: 0x21b2,
  MISSING: 0x31c3,
  ANOMALY: 0x41d4,
  CLONE: 0x51e5,
  LANGUAGE: 0x61f6,
};

/** Ventilation du code de carburant agrege X en codes reels du vocabulaire (hypothese HG-02). */
const X_SPLIT = { L: 0.55, C: 0.2, M: 0.1, H: 0.05, O: 0.1 };

/** Couleur de sellerie : table de poids assumee (hypothese HG-03), vocabulaire KYCAR_UPHOLSTERY_COLOR. */
const UPHOLSTERY_COLOR = { 1: 0.45, 2: 0.2, 3: 0.12, 4: 0.07, 5: 0.05, 6: 0.04, 7: 0.03, 8: 0.02, 9: 0.01, 10: 0.005, 11: 0.005 };

/** Etat de publication : ensemble FIXE de 4 chaines, jamais inventees ligne a ligne (sellers.json). */
export const ACCURATE_STATES = ['active', 'activeMarketable', 'activeReserved', 'activeHighlighted'];

/** Codes de type de carburant (KYCAR_FUEL_TYPE) par categorie, et libelle du referentiel. */
const FUEL_TYPE_BY_CATEGORY = {
  B: [[2, 'Super 95'], [5, 'Super E10 95'], [1, 'Essence 91'], [3, 'Super Plus 98'], [6, 'Super Plus E10 98'], [4, 'Essence E10 91']],
  D: [[7, 'Diesel'], [8, 'Diesel ecologique']],
  E: [[12, 'Electrique']],
  2: [[5, 'Super E10 95'], [2, 'Super 95']],
  3: [[7, 'Diesel']],
  L: [[9, 'Gaz de petrole liquefie']],
  C: [[10, 'Gaz naturel H'], [11, 'Gaz naturel L']],
  M: [[16, 'Ethanol']],
  H: [[13, 'Hydrogene']],
  O: [[14, 'Vegetable oil'], [15, 'Biogas']],
};

/**
 * Vocabulaire de finition par langue, ordonne par niveau de gamme (R-04, R-36). Les libelles sont
 * volontairement COURTS (<= 8 caracteres) : c'est le premier levier de taille de R-33 (§8.3), et la
 * finition reste identifiable et coherente avec le segment et l'annee.
 */
const TRIM_WORDS = {
  fr: ['Access', 'Active', 'Confort', 'Elegance', 'Allure', 'Business', 'Exec', 'Sport', 'Premium'],
  nl: ['Base', 'Trend', 'Comfort', 'Style', 'Business', 'Highline', 'Elegance', 'Sport', 'Excl'],
  de: ['Basis', 'Trend', 'Comfort', 'Style', 'Business', 'Ambiente', 'Elegance', 'Sport', 'Exklusiv'],
};

/** R-33 levier 2 : plafond effectif du nombre de codes d'equipement ecrits (34 dans equipment.json). */
export const MAX_EQUIPMENT_CODES = 18;

/** Motorisations textuelles par categorie de carburant (jeton moteur de `modelVersion`). */
const ENGINE_TAG = { B: ['TSI', 'GDI', 'VTi', 'T'], D: ['TDI', 'dCi', 'HDi', 'CDI'], 2: ['e-Hybrid', 'HEV', 'Hybrid'], 3: ['e-TDI', 'Hybrid D'], E: ['EV', 'Electric', 'e-Drive'], L: ['LPG'], C: ['CNG'], M: ['E85'], H: ['FCEV'], O: ['Flex'] };

/** Construit, une fois par profil, toutes les distributions derivees du generateur. */
export function buildContext(tables, catalog, calibration, capturedYear) {
  const seg = tables.segments;
  const segments = calibration.segments;

  // Les tables de poids portent une cle `$comment` (et parfois `default`) : seules les entrees
  // NUMERIQUES sont des poids de tirage.
  const cumOf = (weights) => {
    const keys = Object.keys(weights).filter((k) => typeof weights[k] === 'number' && k !== 'default');
    const cum = new Float64Array(keys.length);
    let acc = 0;
    for (let i = 0; i < keys.length; i += 1) {
      acc += weights[keys[i]];
      cum[i] = acc;
    }
    return { keys, cum };
  };

  const bySegment = new Map();
  for (const s of segments) {
    bySegment.set(s, {
      bodyType: cumOf(seg.bodyTypeMapping[s]),
      doorCount: cumOf(seg.doorCount[s]),
      seatCount: cumOf(seg.seatCount[s]),
      drivetrain: cumOf(seg.drivetrain[s]),
      upholstery: cumOf(seg.upholsteryType[s] ?? seg.upholsteryType.default),
      newPrice: seg.newPriceEur[s],
      powerMedian: seg.powerKw[s][0],
      powerSigma: seg.powerKw[s][1],
      a2: seg.transmissionByYearAndSegment.a2[s],
      dwell: tables.dynamics.dwellDays.mSegment[s],
      consumptionA: tables.emissions.consumptionCombined.aSegment[s],
    });
  }

  // Loi de carburant par (segment, annee), etalonnee du flux vers le stock (R-13 a R-15).
  const fuelCodes = ['B', 'D', '2', '3', 'E', 'X'];
  const mix = tables.fuelYear.newRegistrationMixByYear;
  const mixYears = Object.keys(mix).filter((k) => /^[0-9]+$/.test(k)).map(Number).sort((a, b) => a - b);
  const stockCoef = tables.fuelYear.stockCoefficient;
  const fuelByYearSegment = new Map();
  for (let y = catalog.minYear; y <= capturedYear; y += 1) {
    const base = fuelCodes.map((f, i) =>
      Math.max(0, interpolate(mixYears, mixYears.map((yy) => mix[String(yy)][i]), y)) * stockCoef[f],
    );
    for (const s of segments) {
      const adj = tables.fuelYear.segmentAdjustment[s];
      const w = base.map((v, i) => v * adj[fuelCodes[i]]);
      const total = w.reduce((a, b) => a + b, 0);
      const cum = new Float64Array(w.length);
      let acc = 0;
      for (let i = 0; i < w.length; i += 1) {
        acc += w[i] / total;
        cum[i] = acc;
      }
      fuelByYearSegment.set(`${s}|${y}`, cum);
    }
  }

  const xSplit = cumOf(X_SPLIT);
  const colors = cumOf(seg.bodyColor);
  const upholsteryColor = cumOf(UPHOLSTERY_COLOR);

  // Prefixes postaux (R-35) et provinces (R-34).
  const geo = tables.geography;
  const prefixCum = new Float64Array(geo.prefixes.length);
  {
    let acc = 0;
    for (let i = 0; i < geo.prefixes.length; i += 1) {
      acc += geo.prefixes[i].weightPct;
      prefixCum[i] = acc;
    }
  }
  const nuts2ByPrefix = new Map(geo.prefixes.map((p) => [p.prefix, p.nuts2]));
  const regionByNuts2 = new Map(geo.provinces.map((p) => [p.nuts2, p.region]));

  // Classes de marque du modele de prix (R-17).
  const brand = tables.priceModel.brandCoefficient;
  const brandClass = new Map();
  for (const s of brand.budgetMakes) brandClass.set(s, brand.budget);
  for (const s of brand.premiumMakes) brandClass.set(s, brand.premium);
  for (const s of brand.exotiqueMakes) brandClass.set(s, brand.exotique);

  // Equipements (R-47 a R-49) : 34 codes parametres + le reste du vocabulaire voiture.
  const eqTable = tables.equipment;
  const paramCodes = eqTable.codes.map((c) => ({ code: Number(c.code), p0: c.p0, a: c.a, b: c.b }));
  const paramSet = new Set(paramCodes.map((c) => c.code));
  const allCodes = tables.listingSchema.$defs.equipmentCode.enum;
  const otherCodes = allCodes.filter((c) => !paramSet.has(c)).map((c) => ({ code: c, p0: eqTable.otherCodes.p0, a: eqTable.otherCodes.a, b: {} }));
  const equipmentCodes = paramCodes.concat(otherCodes).sort((x, y) => x.code - y.code);
  const sealCodes = tables.listingSchema.$defs.sealCode.enum;

  // R-33 (levier 2) et coherence interne de la specification : le modele logit d'`equipment.json`
  // produit une mediane de 27 codes chez un professionnel la ou `missingness.json`
  // (equipmentCountByseller) en annonce 16, et 17 contre 8 chez un particulier. Le decalage de
  // logit ci-dessous est calibre UNE fois, sans alea, pour que le nombre moyen de codes atteigne la
  // mediane annoncee : la loi reste celle de la specification, sa position est ramenee sur la
  // valeur que la specification annonce elle-meme (DATASET-GEN.md §6, ecart EG-05). C'est aussi le
  // premier poste de taille du fichier.
  const ageWeights = buildAgeLaw(tables.ageMileage);
  const equipmentOffset = {};
  for (const type of ['D', 'P']) {
    const target = tables.missingness.equipmentCountByseller[type].median;
    const cSel = tables.equipment.cSellerType[type];
    const meanCount = (delta) => {
      let acc = 0;
      let w = 0;
      for (let y = catalog.minYear; y <= capturedYear; y += 1) {
        const py = ageWeights.pmf[capturedYear - y] ?? 0;
        if (py <= 0) continue;
        const shares = stockSegmentShares(seg, y);
        for (let si = 0; si < shares.segments.length; si += 1) {
          const sName = shares.segments[si];
          const ws = py * shares.shares[si];
          let n = 0;
          for (const code of equipmentCodes) {
            const b = code.b[sName] ?? tables.equipment.bSegmentDefault;
            n += sigmoid(logit(code.p0) + code.a * (y - 2015) + b + cSel + delta);
          }
          acc += ws * Math.min(n, tables.equipment.maxCodes);
          w += ws;
        }
      }
      return acc / w;
    };
    let lo = -6;
    let hi = 2;
    for (let it = 0; it < 40; it += 1) {
      const mid = (lo + hi) / 2;
      if (meanCount(mid) > target) hi = mid;
      else lo = mid;
    }
    equipmentOffset[type] = (lo + hi) / 2;
  }

  // Norme Euro par annee (R-40), lue depuis la table textuelle d'emissions.json.
  const euroByYear = (y) => {
    if (y <= 1996) return '1';
    if (y <= 2000) return '2';
    if (y <= 2005) return '3';
    if (y <= 2010) return '4';
    if (y <= 2014) return '5';
    if (y <= 2017) return '6';
    if (y <= 2018) return '7';
    if (y <= 2020) return '9';
    if (y <= 2023) return '8';
    return '10';
  };

  // R-25 - `isSuperDeal.rateAmongEligible` (0,28) et `aggregatedRate` (0,041) ne peuvent pas etre
  // vrais ensemble : la part d'annonces en categorie 1 ou 2 vaut Phi(-0,2) = 42 % du modele, donc
  // 0,28 donnerait 8 % de superDeal la ou P-83 attend [2,5 %, 5,5 %]. Le generateur retient
  // l'AGREGAT, qui est la valeur que la sonde mesure (DATASET-GEN.md §6, ecart EG-09).
  const phiLow = 0.42074; // P(Z < -0.2)
  const superDealRate = Math.min(
    tables.priceModel.isSuperDeal.rateAmongEligible,
    tables.priceModel.isSuperDeal.aggregatedRate / (tables.sellers.sellerTypeShare.D * phiLow),
  );

  return {
    tables,
    superDealRate,
    catalog,
    calibration,
    capturedYear,
    segments,
    bySegment,
    fuelCodes,
    fuelByYearSegment,
    xSplit,
    colors,
    upholsteryColor,
    geo,
    prefixCum,
    nuts2ByPrefix,
    regionByNuts2,
    brandClass,
    equipmentCodes,
    equipmentOffset,
    sealCodes,
    euroByYear,
    isMetallicByColor: seg.isMetallicByColor,
  };
}

/** Choisit une cle dans une table cumulee preparee par `cumOf`. */
function pickKey(dist, u) {
  const { keys, cum } = dist;
  const target = u * cum[cum.length - 1];
  for (let i = 0; i < cum.length; i += 1) if (target < cum[i]) return keys[i];
  return keys[keys.length - 1];
}

/**
 * Genere une annonce plausible pour la marque donnee.
 * @param {object} ctx contexte prepare par `buildContext`
 * @param {import('./prng.mjs').Prng} prng flot principal
 * @param {object} opt { make, rowIndex, ageTilt, pinModelId }
 */
export function generateListing(ctx, prng, opt) {
  const T = ctx.tables;
  const entry = ctx.catalog.byMake.get(opt.make.slug);
  const capturedYear = ctx.capturedYear;

  /* ---- 1. Age et annee de premiere immatriculation (R-09, R-10) -------------------------------- */
  const ageLaw = ctx.ageLaw;
  let age = pickAge(ageLaw, prng.nextFloat(), opt.ageTilt);
  let year = capturedYear - age;
  if (!entry.years.has(year)) {
    let found = -1;
    for (let d = 1; d <= 45 && found < 0; d += 1) {
      if (entry.years.has(year - d)) found = year - d;
      else if (entry.years.has(year + d) && year + d <= capturedYear) found = year + d;
    }
    if (found < 0) found = capturedYear;
    year = found;
    age = capturedYear - year;
  }
  const yearEntry = entry.years.get(year);

  /* ---- 2. Modele et segment (R-03, R-04, R-05) ------------------------------------------------- */
  let model = null;
  if (opt.pinModelId !== undefined) {
    model =
      yearEntry.curated.find((c) => c.modelId === opt.pinModelId) ??
      yearEntry.tail.find((c) => c.modelId === opt.pinModelId) ??
      null;
    prng.nextFloat();
  }
  if (model === null) {
    const u = prng.nextFloat() * yearEntry.total;
    let idx = 0;
    while (idx < yearEntry.cumulative.length - 1 && u >= yearEntry.cumulative[idx]) idx += 1;
    if (idx < yearEntry.curated.length) {
      model = yearEntry.curated[idx];
    } else {
      const v = prng.nextFloat() * yearEntry.tailCum[yearEntry.tailCum.length - 1];
      let j = 0;
      while (j < yearEntry.tailCum.length - 1 && v >= yearEntry.tailCum[j]) j += 1;
      model = yearEntry.tail[j];
    }
  }
  const segment =
    model.segment ?? drawSegment(ctx.calibration, year, hashToUnit(combineKeys(model.modelId, opt.rowIndex)));
  const S = ctx.bySegment.get(segment);

  const monthMax = year === capturedYear ? 9 : 12;
  const month = 1 + Math.floor(prng.nextFloat() * monthMax);

  /* ---- 3. Carburant (R-13 a R-16) --------------------------------------------------------------- */
  const fuelCum = ctx.fuelByYearSegment.get(`${segment}|${year}`);
  const uf = prng.nextFloat();
  let fi = 0;
  while (fi < fuelCum.length - 1 && uf >= fuelCum[fi]) fi += 1;
  let fuelCategory = ctx.fuelCodes[fi];
  if (fuelCategory === 'X') fuelCategory = pickKey(ctx.xSplit, prng.nextFloat());
  else prng.nextFloat();

  const pluginShare = interpolateMap(T.fuelYear.pluginShareWithinCode2, year);
  const isPlugin = (fuelCategory === '2' || fuelCategory === '3') && prng.nextFloat() < pluginShare;

  /* ---- 4. Motorisation (R-17, contrainte 16) --------------------------------------------------- */
  const powerMedian = model.powerKwMedian ?? S.powerMedian;
  let powerKw = Math.round(powerMedian * Math.exp(S.powerSigma * prng.nextGaussian()));
  powerKw = Math.round(clamp(powerKw, T.segments.powerKwBounds[0], T.segments.powerKwBounds[1]));
  const powerHp = Math.round(powerKw / 0.7355);

  const isElectric = fuelCategory === 'E';
  const displacementFactor = fuelCategory === 'D' || fuelCategory === '3' ? 14.5 : 12.5;
  const cylinderCapacity = isElectric
    ? null
    : Math.round(clamp(powerKw * displacementFactor * Math.exp(0.16 * prng.nextGaussian()), 700, 6500));
  const cylinderCount = isElectric
    ? null
    : cylinderCapacity < 1150
      ? 3
      : cylinderCapacity < 2600
        ? 4
        : cylinderCapacity < 3600
          ? 6
          : 8;

  const tSeg = T.segments.transmissionByYearAndSegment;
  const pAuto = sigmoid(tSeg.a0 + tSeg.a1 * (year - 2015) + S.a2);
  const uAuto = prng.nextFloat();
  const uSemi = prng.nextFloat();
  let transmission = 'M';
  if (isElectric || uAuto < pAuto) transmission = uSemi < tSeg.shareSemiAutoAmongAuto ? 'S' : 'A';
  const gearCount = isElectric ? 1 : transmission === 'M' ? 5 + (prng.nextFloat() < 0.35 ? 1 : 0) : 6 + Math.floor(prng.nextFloat() * 4);
  const drivetrain = pickKey(S.drivetrain, prng.nextFloat());

  /* ---- 5. Carrosserie et couleurs (R-08) --------------------------------------------------------- */
  let bodyType = Number(pickKey(S.bodyType, prng.nextFloat()));
  if (prng.nextFloat() < T.segments.bodyTypeOtherRate) bodyType = 7;
  const doorCount = Number(pickKey(S.doorCount, prng.nextFloat()));
  const seatCount = Number(pickKey(S.seatCount, prng.nextFloat()));
  const bodyColor = Number(pickKey(ctx.colors, prng.nextFloat()));
  const isMetallic = prng.nextFloat() < (ctx.isMetallicByColor[String(bodyColor)] ?? ctx.isMetallicByColor.default);
  const uPaint = prng.nextFloat();
  const paintType = isMetallic ? (uPaint < 0.85 ? 'M' : uPaint < 0.95 ? 'P' : 'S') : uPaint < 0.8 ? 'U' : 'O';
  const upholsteryType = pickKey(S.upholstery, prng.nextFloat());
  const upholsteryColor = Number(pickKey(ctx.upholsteryColor, prng.nextFloat()));

  /* ---- 6. Kilometrage (R-11) --------------------------------------------------------------------- */
  const km = T.ageMileage.mileage;
  const mf = (km.annualKmByFuel[fuelCategory] ?? 12500) * 1.1746;
  const medianKm = mf * Math.pow(Math.max(age, 0.4), km.gamma);
  let mileage = medianKm * Math.exp(0.35 * prng.nextGaussian());
  mileage = Math.round(clamp(mileage, km.bounds[0], km.bounds[1]) / km.roundingKm) * km.roundingKm;

  /* ---- 7. Etat, type d'offre, proprietaires (R-12) ----------------------------------------------- */
  const pAccident = clamp(0.025 + 0.0015 * age, 0, 0.08);
  const usageState = age === 0 ? 'N' : prng.nextFloat() < pAccident ? 'A' : 'U';
  const uOffer = prng.nextFloat();
  let offerType;
  if (age === 0 && mileage < 1000) offerType = 'N';
  else if (age === 0) offerType = 'D';
  else if (age <= 1) offerType = uOffer < 0.25 ? 'S' : uOffer < 0.8 ? 'J' : 'D';
  else if (age <= 3) offerType = uOffer < 0.72 ? 'J' : 'U';
  else if (age >= 30) offerType = uOffer < 0.55 ? 'O' : 'U';
  else offerType = 'U';
  const hadAccident = usageState === 'A' ? true : prng.nextFloat() < 0.06;
  let previousOwnerCount = 1 + poisson(prng, 0.16 * age);
  previousOwnerCount = Math.min(9, previousOwnerCount);
  const hasFullServiceHistory = prng.nextFloat() < clamp(0.72 - 0.02 * age, 0.12, 0.9);
  const inspectionOffset = -24 + Math.floor(prng.nextFloat() * 73);
  const wasCabOrRental = prng.nextFloat() < 0.03;

  /* ---- 8. Vendeur et geographie (R-26, R-34 a R-37) ---------------------------------------------- */
  const sel = T.sellers;
  let oddsD = Math.exp(logit(sel.sellerTypeShare.D) - 0.085 * (age - 8)) * (sel.sellerTypeBySegment[segment] ?? 1);
  const pD = oddsD / (1 + oddsD);
  const uSeller = prng.nextFloat();
  const sellerType = opt.forceSellerType ?? (uSeller < pD ? 'D' : 'P');

  const uPrefix = prng.nextFloat() * 100;
  let pi = 0;
  while (pi < ctx.prefixCum.length - 1 && uPrefix >= ctx.prefixCum[pi]) pi += 1;
  const prefix = ctx.geo.prefixes[pi];
  const langCum = Object.entries(prefix.language);
  const uLang = prng.nextFloat();
  let language = langCum[0][0];
  {
    let acc = 0;
    for (const [code, w] of langCum) {
      acc += w;
      if (uLang < acc) {
        language = code;
        break;
      }
    }
  }
  if (sellerType === 'D' && language !== 'de' && prng.nextFloat() < 0.04) language = language === 'fr' ? 'nl' : 'fr';
  else prng.nextFloat();

  /* ---- 9. Prix (R-17 a R-25) --------------------------------------------------------------------- */
  const pm = T.priceModel;
  const brandCoef = ctx.brandClass.get(opt.make.slug) ?? pm.brandCoefficient.generaliste;
  const modelDispersion = Math.exp(
    pm.modelDispersionSigma * normalFromUnit(hashToUnit(combineKeys(model.modelId, DOM.MODEL_DISPERSION))),
  );
  const lambda = isElectric ? pm.depreciation.lambdaElectric : pm.depreciation.lambda;
  const dAge = Math.max(pm.depreciation.D0 * Math.exp(-lambda * age), pm.depreciation.floor);
  const kMileage = clamp(Math.exp(-pm.mileageFactor.beta * ((mileage - medianKm) / 100000)), 0.45, 1.35);
  const tSeller = pm.sellerPremium[sellerType];
  const residual = Math.exp(pm.residualSigma * prng.nextGaussian());
  const fairPrice =
    T.segments.newPriceScale *
    S.newPrice *
    brandCoef *
    (pm.fuelNewPremium[fuelCategory] ?? 1) *
    Math.pow(powerKw / S.powerMedian, pm.powerExponent) *
    modelDispersion *
    dAge *
    kMileage *
    tSeller;
  const justPrice = fairPrice * residual;

  const uRound = prng.nextFloat();
  const uGrid = prng.nextFloat();
  const displayPrice = commercialRound(justPrice, pm.commercialRounding.bands, uRound, uGrid);
  const newPriceEstimate =
    T.segments.newPriceScale *
    S.newPrice *
    brandCoef *
    (pm.fuelNewPremium[fuelCategory] ?? 1) *
    Math.pow(powerKw / S.powerMedian, pm.powerExponent) *
    modelDispersion;

  /* ---- 10. Emissions (R-38 a R-42) --------------------------------------------------------------- */
  const em = T.emissions;
  const noBranchRate = age < 10 ? em.branchRule.AUCUNE.rate.ageInf10 : age <= 17 ? em.branchRule.AUCUNE.rate.age10a17 : em.branchRule.AUCUNE.rate.ageSup17;
  const hasBranch = prng.nextFloat() >= noBranchRate;
  const isWltp = year > 2018 || (year === 2018 && month >= 9);
  const cc = em.consumptionCombined;
  let consumption = null;
  let consumptionElectric = null;
  if (isElectric) {
    consumptionElectric = round1(
      clamp((13.8 + 0.03 * powerKw) * (1 - 0.006 * (year - 2015)) * Math.exp(0.07 * prng.nextGaussian()), 11, 30),
    );
    prng.nextGaussian();
  } else {
    const base = (S.consumptionA + 0.021 * (powerKw - S.powerMedian)) * (cc.fFuel[fuelCategory] ?? 1) * (1 - 0.011 * (year - 2010));
    let v = base * Math.exp(0.09 * prng.nextGaussian());
    if (!isWltp) v *= 0.79;
    consumption = round1(clamp(v, 2.2, 22.0));
    if (isPlugin) {
      consumptionElectric = round1(clamp((15.5 + 0.03 * powerKw) * Math.exp(0.07 * prng.nextGaussian()), 11, 30));
    } else prng.nextGaussian();
  }
  const kCarbon = fuelCategory === 'D' || fuelCategory === '3' ? 26.4 : fuelCategory === 'C' ? 18.1 : 23.92;
  const co2 = isElectric || fuelCategory === 'H' ? 0 : round1(consumption * kCarbon);

  let electricRange = null;
  let batteryCapacity = null;
  let batteryOwnership = null;
  if (isElectric || fuelCategory === '2' || fuelCategory === '3') {
    const er = isElectric ? em.electricRange.E : em.electricRange.PHEV;
    const med = isElectric ? clamp(115 + 14.5 * (year - 2012), 90, 620) : clamp(36 + 2.6 * (year - 2014), 25, 110);
    electricRange = Math.max(1, Math.round(med * Math.exp((isElectric ? er.sigma : er.sigma) * prng.nextGaussian())));
    batteryCapacity = round1(Math.max(0.1, (electricRange / (isElectric ? 5.6 : 4.4)) * Math.exp((isElectric ? 0.1 : 0.12) * prng.nextGaussian())));
    if (isElectric) {
      const uo = prng.nextFloat();
      batteryOwnership = uo < 0.93 ? '1' : uo < 0.99 ? '2' : '3';
    } else prng.nextFloat();
  } else {
    prng.nextGaussian();
    prng.nextGaussian();
    prng.nextFloat();
  }

  const co2Class = co2 <= 0 ? 10 : co2 <= 60 ? 20 : co2 <= 100 ? 30 : co2 <= 130 ? 40 : co2 <= 160 ? 50 : co2 <= 200 ? 60 : 70;
  const efficiencyClass = co2 <= 60 ? 1 : co2 <= 90 ? 2 : co2 <= 110 ? 3 : co2 <= 130 ? 4 : co2 <= 150 ? 5 : co2 <= 175 ? 6 : co2 <= 200 ? 7 : 8;
  const euEmissionStandard = ctx.euroByYear(year);
  const hasParticleFilter =
    fuelCategory === 'D' || fuelCategory === '3' ? (year >= 2011 ? true : prng.nextFloat() < 0.35) : null;
  if (hasParticleFilter === null) prng.nextFloat();

  /* ---- 11. Carburant declare (types et libelle) --------------------------------------------------- */
  const ftList = FUEL_TYPE_BY_CATEGORY[fuelCategory] ?? FUEL_TYPE_BY_CATEGORY.O;
  const ft = ftList[Math.floor(prng.nextFloat() * ftList.length)];
  const primaryFuelType = ft[0];
  let additionalFuelTypes = null;
  if (fuelCategory === '2' || fuelCategory === '3') additionalFuelTypes = [12];
  else if (fuelCategory === 'L') additionalFuelTypes = [2];
  else if (fuelCategory === 'C') additionalFuelTypes = [2];
  const fuelSourceLabel = additionalFuelTypes === null ? ft[1] : `${ft[1]} / Electrique`;

  /* ---- 12. Equipements (R-47 a R-49) -------------------------------------------------------------- */
  const eq = [];
  const cSeller = T.equipment.cSellerType[sellerType];
  for (const code of ctx.equipmentCodes) {
    const b = code.b[segment] ?? T.equipment.bSegmentDefault;
    const p = sigmoid(logit(code.p0) + code.a * (year - 2015) + b + cSeller + ctx.equipmentOffset[sellerType]);
    if (prng.nextFloat() < p) eq.push(code.code);
  }
  // R-33 levier 2 : plafond ramene de 34 a 24 codes pour tenir le budget gz du profil test.
  const equipment = eq.slice(0, Math.min(T.equipment.maxCodes, MAX_EQUIPMENT_CODES));

  /* ---- 13. Vendeur professionnel : images, video, garantie, labels -------------------------------- */
  const img = sel.imageCount[sellerType];
  let imageCount = poisson(prng, img.lambda);
  imageCount = clamp(imageCount, img.min, Math.min(img.max, 50));
  if (prng.nextFloat() < sel.imageCount.zeroImageRate) imageCount = 0;
  const hasVideo = prng.nextFloat() < sel.hasVideo[sellerType];
  const uWarranty = prng.nextFloat();
  let warranty = null;
  let hasWarranty = null;
  if (sellerType === 'D') {
    if (uWarranty < 0.58) {
      warranty = [12, 24, 36][Math.floor(prng.nextFloat() * 3)];
      hasWarranty = true;
    } else if (uWarranty < 0.7) {
      warranty = 0;
      hasWarranty = false;
      prng.nextFloat();
    } else prng.nextFloat();
  } else prng.nextFloat();
  let appliedSeals = null;
  if (sellerType === 'D' && prng.nextFloat() < 0.22) {
    const n = prng.nextFloat() < 0.6 ? 1 : 2;
    const set = new Set();
    for (let i = 0; i < n; i += 1) set.add(ctx.sealCodes[Math.floor(prng.nextFloat() * ctx.sealCodes.length)]);
    appliedSeals = [...set].sort((a, b) => a - b);
  } else {
    prng.nextFloat();
    prng.nextFloat();
  }

  /* ---- 14. Facteur latent de completude (R-43) et texte de version (R-04, R-36) -------------------- */
  const completeness = betaSixTwo(prng);
  const productionYear = prng.nextFloat() < 0.25 ? Math.max(1900, year - 1) : year;
  const modelVersion = buildVersion(prng, { language, segment, year, fuelCategory, powerKw, cylinderCapacity, transmission, doorCount, isPlugin });

  /* ---- 15. Duree d'exposition (R-50) -------------------------------------------------------------- */
  const dw = T.dynamics.dwellDays;
  const dwellDays = clamp(
    68 * S.dwell * Math.pow(Math.max(displayPrice, 2000) / 15000, 0.18) * (1 + 0.012 * (age - 8)) * dw.mSeller[sellerType],
    35,
    130,
  );

  return {
    rowIndex: opt.rowIndex,
    makeSlug: opt.make.slug,
    makeId: opt.make.makeId,
    makeName: opt.make.label,
    modelId: model.modelId,
    modelSlug: model.modelSlug,
    modelName: model.modelName,
    curated: model.curated,
    segment,
    year,
    month,
    age,
    productionYear,
    modelVersion,
    fuelCategory,
    isPlugin,
    primaryFuelType,
    additionalFuelTypes,
    fuelSourceLabel,
    powerKw,
    powerHp,
    cylinderCapacity,
    cylinderCount,
    gearCount,
    transmission,
    drivetrain,
    mileage,
    bodyType,
    doorCount,
    seatCount,
    bodyColor,
    isMetallic,
    paintType,
    upholsteryType,
    upholsteryColor,
    equipment,
    offerType,
    usageState,
    hadAccident,
    previousOwnerCount,
    hasFullServiceHistory,
    inspectionOffset,
    wasCabOrRental,
    sellerType,
    dealerBucket: null,
    adTier: null,
    appliedSeals,
    imageCount,
    hasVideo,
    warranty,
    hasWarranty,
    prefix: prefix.prefix,
    countryCode: ctx.geo.countryCode,
    language,
    justPrice,
    fairPrice,
    displayPrice,
    basePrice: displayPrice,
    newPriceEstimate,
    uRound,
    uGrid,
    priceStatus: 'QUOTED',
    isTaxDeductible: null,
    netPrice: null,
    vatRate: null,
    isNegotiable: null,
    evaluationCategory: null,
    superDeal: false,
    msrp: null,
    branch: hasBranch ? (isWltp ? 'WLTP' : 'NEDC') : 'NONE',
    consumption,
    consumptionElectric,
    co2,
    co2Class,
    efficiencyClass,
    euEmissionStandard,
    electricRange,
    batteryCapacity,
    batteryOwnership,
    hasParticleFilter,
    completeness,
    dwellDays,
    mileageUnit: 'km',
    anomalies: [],
    accurateState: ACCURATE_STATES[Math.floor(hashToUnit(combineKeys(opt.rowIndex, 0x7a11)) * ACCURATE_STATES.length)],
  };
}

/** Age tire dans la loi discretisee ; `tilt` incline la loi des entrantes (R-52, exp(-0,02 a)). */
function pickAge(law, u, tilt) {
  if (!tilt) {
    let lo = 0;
    let hi = law.cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (u < law.cumulative[mid]) hi = mid;
      else lo = mid + 1;
    }
    return law.min + lo;
  }
  const target = u * tilt.total;
  let lo = 0;
  let hi = tilt.cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (target < tilt.cumulative[mid]) hi = mid;
    else lo = mid + 1;
  }
  return law.min + lo;
}

/** Poisson tronquee par la methode de Knuth (deterministe, flot principal). */
function poisson(prng, lambda) {
  if (lambda <= 0) {
    prng.nextFloat();
    return 0;
  }
  const l = Math.exp(-Math.min(lambda, 30));
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= prng.nextFloat();
  } while (p > l && k < 200);
  return k - 1;
}

/** Beta(6, 2) = 6e statistique d'ordre de 7 uniformes (exact, 7 tirages du flot principal). */
function betaSixTwo(prng) {
  const u = [];
  for (let i = 0; i < 7; i += 1) u.push(prng.nextFloat());
  u.sort((a, b) => a - b);
  return u[5];
}

/**
 * R-21 - arrondi commercial : terminaison tiree dans la bande, puis recalage sur le pas.
 *
 * `uGrid` porte la reconciliation de R-21 avec sa propre sonde : la table de terminaisons de
 * `price-model.json` somme a 1, donc TOUT prix recevrait une terminaison commerciale (mesure : 98,9
 * %), alors que P-39 attend une part dans [70 %, 88 %] et R-21 annonce 78 %. Une part
 * `RAW_PRICE_SHARE` des prix reste donc affichee A L'EURO, comme le fait une partie du marche
 * (DATASET-GEN.md §6, ecart EG-07).
 */
export const RAW_PRICE_SHARE = 0.2;

export function commercialRound(price, bands, u, uGrid = 0) {
  if (uGrid < RAW_PRICE_SHARE) return Math.max(1, Math.round(price));
  const band = bands.find((b) => price <= b.maxEur) ?? bands[bands.length - 1];
  const endings = Object.keys(band.endings);
  let acc = 0;
  let ending = Number(endings[endings.length - 1]);
  for (const e of endings) {
    acc += band.endings[e];
    if (u < acc) {
      ending = Number(e);
      break;
    }
  }
  const step = band.step;
  const value = step * Math.round((price - ending) / step) + ending;
  return Math.max(1, Math.round(value));
}

/** R-04/R-36 - texte de version : borne, dans la langue du prefixe, sans contact ni URL (P-107). */
function buildVersion(prng, o) {
  const parts = [];
  if (o.fuelCategory === 'E') {
    parts.push(`${Math.round(o.powerKw)} kW`);
  } else if (o.cylinderCapacity) {
    parts.push((Math.round(o.cylinderCapacity / 100) / 10).toFixed(1));
  }
  const tags = ENGINE_TAG[o.fuelCategory] ?? ENGINE_TAG.B;
  parts.push(tags[Math.floor(prng.nextFloat() * tags.length)]);
  const trims = TRIM_WORDS[o.language] ?? TRIM_WORDS.fr;
  const tier = clamp(Math.floor((o.year - 2004) / 3) + Math.floor(prng.nextFloat() * 4) - 1, 0, trims.length - 1);
  parts.push(trims[tier]);
  // R-33 levier 1 : la verbosite de `modelVersion` est le premier levier de taille. Les jetons de
  // boite et de portes sont RETIRES : ils repetent `transmission` et `doorCount`, deja servis en
  // clair, donc leur suppression ne retire aucune information du fichier (DATASET-GEN.md §5).
  prng.nextFloat();
  prng.nextFloat();
  prng.nextFloat();
  prng.nextFloat();
  const text = parts.join(' ');
  return text.length > 121 ? text.slice(0, 121) : text;
}
