/**
 * KYCAR - Valeurs manquantes, projection sur la forme As24Listing, tri et serialisation
 * =================================================================================================
 * Trois etages, dans cet ordre, parce que l'ordre est ce qui rend les sondes exactes :
 *
 *  1. `derivePriceFields` - TVA, evaluation, superDeal, prix catalogue (R-23 a R-25). Calcules APRES
 *     les anomalies de prix : l'evaluation AutoScout24 porte sur le prix REELLEMENT affiche, c'est
 *     ce qui donne un sens au kappa d'EX-DATA-96 (correction C-1, sonde P-45).
 *  2. `applyMissingness` - R-43 a R-46. Absence STRUCTURELLE d'abord (le champ est sans objet, il
 *     n'entre dans aucun taux), puis absence de COMPLETUDE, `p_champ * m / E[m]`, ou `m` porte le
 *     facteur latent. La normalisation par `E[m]` est necessaire : sans elle le taux realise vaut
 *     0,55 fois le taux de reference et P-55 est rouge sur tous les champs (DATASET-GEN.md §6,
 *     ecart EG-03).
 *  3. `toAs24` - projection sur l'ordre de cles FIXE de la contrainte 25, une cle absente plutot
 *     qu'un `null` (R-33 levier 2), toutes les decimales arrondies AVANT serialisation
 *     (contrainte 24).
 */

import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

import { hashToU32, combineKeys, pureUnit } from './prng.mjs';

const DOM_ID = 0x1d0001;
const DOM_MISS = 0x3c0000;
const DOM_PRICE = 0x2b0001;
const DOM_DATE = 0x2c0001;

const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
const round1 = (x) => Math.round(x * 10) / 10;
/**
 * R-33 - le CO2 s'ecrit en ENTIER de g/km : c'est la precision de l'homologation, la contrainte 24
 * autorise "au plus une decimale", et la decimale de trop est un chiffre d'entropie par occurrence
 * sur trois champs (branche + repli). La coherence CO2/consommation reste testable a +/- 6 g/km
 * (P-60), tres au-dessus de l'arrondi.
 */
const roundCo2 = (x) => Math.round(x);

/** Identifiant d'annonce : 128 bits derives BIJECTIVEMENT de (graine, rang) - jamais de collision. */
export function makeListingId(seed, row) {
  const w = [0, 1, 2, 3].map((k) =>
    hashToU32(combineKeys((seed ^ (DOM_ID + k * 0x9e37)) | 0, row))
      .toString(16)
      .padStart(8, '0'),
  );
  return `${w[0]}-${w[1].slice(0, 4)}-${w[1].slice(4)}-${w[2].slice(0, 4)}-${w[2].slice(4)}${w[3]}`;
}

/** Deeplink : contient l'identifiant et l'hote du marche (contrainte 27, sonde P-105). */
export const webPageOf = (id) => `https://www.autoscout24.be/offres/${id}`;

/** Champs soumis au modele de completude (R-43) : cle du schema, taux de reference, eligibilite. */
export function missingnessFields(tables) {
  const b = tables.missingness.baseRates;
  /** @type {{key:string, base:number, eligible:(l:object)=>boolean}[]} */
  const f = [];
  // Certaines absences sont AUSSI produites par une anomalie declaree : leur taux doit etre retire
  // du taux de completude, sans quoi le total depasse `baseRates` et P-55 le voit (ici A-16, dont le
  // mecanisme est precisement l'absence de `fuelCategory`).
  const anomalyDriven = { fuelCategory: 0.001 };
  const add = (key, eligible) => {
    if (b[key] === undefined || b[key] <= 0) return;
    f.push({ key, base: Math.max(0, b[key] - (anomalyDriven[key] ?? 0)), eligible: eligible ?? (() => true) });
  };
  const elec = (l) => l.fuelCategory === 'E' || l.fuelCategory === '2' || l.fuelCategory === '3';
  const thermal = (l) => l.fuelCategory !== 'E' && l.fuelCategory !== 'H';
  add('makeName');
  add('modelVersion');
  add('productionYear');
  add('firstRegistrationDate');
  add('mileage');
  add('power');
  add('powerHp');
  add('cylinderCapacity', (l) => l.fuelCategory !== 'E');
  add('cylinderCount', (l) => l.fuelCategory !== 'E');
  add('gearCount');
  add('transmission');
  add('drivetrain');
  add('fuelCategory');
  add('primaryFuelType');
  add('additionalFuelTypes', (l) => l.additionalFuelTypes !== null);
  add('fuelSourceLabel');
  add('isPluginHybrid', (l) => l.fuelCategory === '2' || l.fuelCategory === '3');
  add('co2Emissions', (l) => l.branch === 'NEDC');
  add('consumption.combined', (l) => l.branch === 'NEDC' && thermal(l));
  add('consumption.electricCombined', (l) => l.branch === 'NEDC' && elec(l) && l.consumptionElectric !== null);
  add('wltp.co2EmissionsCombined', (l) => l.branch === 'WLTP' && thermal(l));
  add('wltp.consumptionCombined', (l) => l.branch === 'WLTP' && thermal(l));
  add('wltp.consumptionElectricCombined', (l) => l.branch === 'WLTP' && elec(l) && l.consumptionElectric !== null);
  add('wltp.co2Class', (l) => l.branch === 'WLTP');
  add('efficiencyClass', (l) => l.branch === 'NEDC');
  add('euEmissionStandard');
  add('electricRange', elec);
  add('battery.capacity', elec);
  add('battery.ownershipType', (l) => l.fuelCategory === 'E');
  add('hasParticleFilter', (l) => l.hasParticleFilter !== null);
  add('previousOwnerCount');
  add('hasFullServiceHistory');
  add('nextInspectionDate');
  add('wasCabOrRental');
  add('condition.hadAccident');
  add('usageState');
  add('offerType');
  add('bodyType');
  add('doorCount');
  add('seatCount');
  add('bodyColor');
  add('isMetallic');
  add('paintType');
  add('upholsteryType');
  add('upholsteryColor');
  add('equipment');
  add('location.postalCodePrefix2');
  add('hasVideo');
  add('publication.accurateState');
  return f;
}

/** Multiplicateur de completude d'une annonce (R-43) : facteur latent x vendeur x age. */
export function completenessMultiplier(listing, tables) {
  const lat = tables.missingness.latentCompleteness;
  const g = clamp(2 - 2 * listing.completeness, 0.15, 2.2);
  const h = lat.hSellerType[listing.sellerType];
  const k = Math.min(lat.kAge.cap, 1 + 0.045 * Math.max(listing.age - 8, 0));
  return g * h * k;
}

/** R-23 a R-25 - champs de prix derives, calcules apres les anomalies de prix. */
export function derivePriceFields(listing, ctx, seed) {
  const pm = ctx.tables.priceModel;
  const u = (k) => pureUnit(seed, DOM_PRICE + k, listing.rowIndex);
  const priceShown = listing.priceStatus === 'QUOTED' || listing.priceStatus === 'ON_REQUEST_WITH_AMOUNT';

  if (listing.sellerType === 'D' && priceShown) {
    if (u(1) >= pm.vat.unknownAmongPro) listing.isTaxDeductible = u(2) < pm.vat.isTaxDeductibleAmongPro;
  }
  if (listing.isTaxDeductible === true) {
    let net = Math.round(listing.displayPrice / 1.21);
    if (net >= listing.displayPrice) listing.displayPrice = net + 1;
    listing.netPrice = Math.max(1, net);
    listing.vatRate = 21.0;
  }
  if (priceShown) {
    // R-24 : `d = ln(prix affiche / prix juste) / sigma_p`. Le "prix juste" est celui que le MODELE
    // predit pour la cellule, RESIDU EXCLU : avec le residu, `d` vaut zero par construction, la
    // categorie vaut 3 partout et le kappa d'EX-DATA-96 retombe a zero - exactement le defaut C-1
    // que R-24 corrige (DATASET-GEN.md §6, ecart EG-09).
    const ev = pm.priceEvaluationCategory;
    const d = Math.log(listing.displayPrice / listing.fairPrice) / pm.residualSigma;
    let cat = d < -1.0 ? 1 : d < -0.2 ? 2 : d < 0.9 ? 3 : 4; // 4 = pas d'etiquette (echelle a 3 niveaux)
    if (u(3) < ev.confusionRate) cat = clamp(cat + (u(4) < 0.5 ? -1 : 1), 1, 4);
    listing.evaluationCategory = cat <= 3 ? cat : null;
  }
  listing.superDeal =
    listing.sellerType === 'D' &&
    (listing.evaluationCategory === 1 || listing.evaluationCategory === 2) &&
    u(5) < ctx.superDealRate;
  if (listing.sellerType === 'D' && listing.age <= 6 && u(6) < 0.375) {
    listing.msrp = Math.max(1, Math.round(listing.newPriceEstimate / 500) * 500);
  }
  listing.isNegotiable = u(7) < (listing.sellerType === 'P' ? 0.22 : 0.06) ? true : null;
}

/**
 * Calibrage du modele de completude, calcule UNE fois sur le premier snapshot puis GELE.
 *
 * Deux corrections sans lesquelles P-55 (taux d'absence a +/- 25 % relatifs de `baseRates`) est
 * rouge sur tous les champs :
 *
 *  - `normalizer` : `E[g(c) h k]` vaut 0,54, pas 1 ; sans division le taux realise vaut la moitie du
 *    taux de reference (ecart EG-03) ;
 *  - `scale[f]` : le produit `p_champ * m` est ECRETE a 0,98, ce qui retire de la masse aux champs a
 *    taux eleve (`paintType` 0,82 tombe a 0,65 mesure, sous le plancher de P-108). Un facteur par
 *    champ, resolu par dichotomie sur un sous-echantillon deterministe des `m`, retablit
 *    l'esperance exactement (ecart EG-09).
 */
export function calibrateMissingness(listings, fields, tables) {
  let acc = 0;
  for (const l of listings) acc += completenessMultiplier(l, tables);
  const normalizer = acc / listings.length;
  const step = Math.max(1, Math.floor(listings.length / 2048));
  const sample = [];
  for (let i = 0; i < listings.length; i += step) sample.push(completenessMultiplier(listings[i], tables) / normalizer);
  const scale = new Float64Array(fields.length).fill(1);
  for (let i = 0; i < fields.length; i += 1) {
    const base = fields[i].base;
    const mean = (sc) => {
      let sum = 0;
      for (const m of sample) sum += clamp(base * sc * m, 0, 0.98);
      return sum / sample.length;
    };
    if (mean(1) >= base - 1e-9) {
      let lo = 0.2;
      let hi = 12;
      for (let it = 0; it < 40; it += 1) {
        const mid = (lo + hi) / 2;
        if (mean(mid) > base) hi = mid;
        else lo = mid;
      }
      scale[i] = (lo + hi) / 2;
    } else {
      let lo = 1;
      let hi = 12;
      for (let it = 0; it < 40; it += 1) {
        const mid = (lo + hi) / 2;
        if (mean(mid) > base) hi = mid;
        else lo = mid;
      }
      scale[i] = (lo + hi) / 2;
    }
  }
  return { normalizer, scale };
}

/**
 * R-43 a R-46 - ensemble des cles absentes de la ligne. Le calibrage est celui du premier snapshot
 * du profil : il ne doit pas dependre du snapshot, sinon le motif d'absence d'une survivante
 * changerait (contrainte 4, sonde P-70).
 */
export function applyMissingness(listing, fields, tables, seed, calib) {
  const m = completenessMultiplier(listing, tables) / calib.normalizer;
  const absent = new Set();
  let count = 0;
  for (let i = 0; i < fields.length; i += 1) {
    const f = fields[i];
    if (!f.eligible(listing)) continue;
    const p = clamp(f.base * calib.scale[i] * m, 0, 0.98);
    if (pureUnit(seed, DOM_MISS + i * 3, listing.rowIndex) < p) {
      absent.add(f.key);
      count += 1;
    }
  }
  // A-12 : au moins 6 champs optionnels absents simultanement (le facteur latent est deja force
  // dans le premier centile ; on complete au besoin par les champs les plus souvent absents).
  if (listing.forceIncomplete && count < 6) {
    const ordered = fields
      .filter((f) => f.eligible(listing) && !absent.has(f.key))
      .sort((a, b) => b.base - a.base);
    for (const f of ordered) {
      if (count >= 6) break;
      absent.add(f.key);
      count += 1;
    }
  }
  listing.missingCount = count;
  return absent;
}

/**
 * R-33 - horodatage au QUART D'HEURE. La seconde et la minute d'une date de publication sont du
 * bruit : aucune sonde ne s'en sert (P-86 ne teste qu'un ORDRE, P-88 un mois), et elles coutent
 * trois a quatre chiffres d'entropie sur TROIS champs par ligne. Mesure : -177 Kio gz au profil
 * test, -45 Kio au profil dev, ce qui ramene les deux profils sous leur budget (DATASET-GEN.md §5).
 */
const TIME_GRAIN_MS = 15 * 60000;
const iso = (ms) => new Date(Math.floor(ms / TIME_GRAIN_MS) * TIME_GRAIN_MS).toISOString().replace(/\.\d{3}Z$/, 'Z');
const DAY = 86400000;

/** R-55bis - dates d'annonce, ordonnees et anterieures a la capture (contraintes 1 et 3). */
export function assignDates(listing, capturedAtMs, seed, isEntrant) {
  const u = (k) => pureUnit(seed, DOM_DATE + k, listing.rowIndex);
  const firstRegMs = Date.UTC(listing.year, listing.month - 1, 1);
  let created = isEntrant
    ? capturedAtMs - Math.floor(u(1) * 7 * DAY)
    : capturedAtMs - Math.floor(u(1) * listing.dwellDays * DAY);
  created = clamp(created, firstRegMs, capturedAtMs);
  let activated = created + Math.floor(u(2) * 36 * 3600000);
  activated = Math.min(activated, capturedAtMs);
  listing.createdAt = iso(created);
  listing.firstActivatedDate = iso(activated);
  listing.lastUpdatedAt = iso(activated);
  listing.lastUpdatedMs = activated;
  listing.createdMs = created;
  listing.activatedMs = activated;
}

/** Date de prochain controle technique, au mois, dans [capture - 24 mois, capture + 48 mois]. */
function nextInspection(listing, capturedAtMs) {
  const d = new Date(capturedAtMs);
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + listing.inspectionOffset;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * Projection sur la forme `As24Listing`, dans l'ordre de cles du schema (contrainte 25).
 * Une valeur inconnue est une CLE ABSENTE, jamais `null` (R-33).
 */
export function toAs24(l, absent, ctx, snap) {
  const has = (k) => !absent.has(k);
  const o = {};
  o.id = l.listingId;
  o.webPage = webPageOf(l.listingId);
  o.marketplace = 'be';
  o.vehicleType = 'C';
  o.make = l.makeId;
  if (has('makeName')) o.makeName = l.makeName;
  if (!l.modelAbsent) {
    o.model = l.modelId;
    o.modelName = l.modelName;
  }
  if (has('modelVersion')) o.modelVersion = l.modelVersion;
  if (has('productionYear')) o.productionYear = l.productionYear;
  if (has('firstRegistrationDate')) {
    o.firstRegistrationDate = l.firstRegOverride ?? `${l.year}-${String(l.month).padStart(2, '0')}`;
  }
  if (has('mileage')) {
    o.mileage = l.mileage;
    o.mileageUnit = l.mileageUnit;
  }
  if (has('power')) {
    o.power = l.powerKw;
    o.powerUnit = 'kW';
  }
  if (has('powerHp')) o.powerHp = l.powerHp;
  if (l.cylinderCapacity !== null && has('cylinderCapacity')) {
    o.cylinderCapacity = l.cylinderCapacity;
    o.cylinderCapacityUnit = 'ccm';
  }
  if (l.cylinderCount !== null && has('cylinderCount')) o.cylinderCount = l.cylinderCount;
  if (has('gearCount')) o.gearCount = l.gearCount;
  if (has('transmission')) o.transmission = l.transmission;
  if (has('drivetrain')) o.drivetrain = l.drivetrain;
  if (!l.fuelCategoryAbsent && has('fuelCategory')) o.fuelCategory = l.fuelCategory;
  if (!l.primaryFuelTypeAbsent && has('primaryFuelType')) o.primaryFuelType = l.primaryFuelType;
  if (l.additionalFuelTypes !== null && has('additionalFuelTypes')) o.additionalFuelTypes = l.additionalFuelTypes;
  if (has('fuelSourceLabel')) o.fuelSourceLabel = l.fuelSourceLabel;
  const pluginEligible = l.fuelCategory === '2' || l.fuelCategory === '3';
  if (l.isPlugin === true) o.isPluginHybrid = true;
  else if (pluginEligible && has('isPluginHybrid')) o.isPluginHybrid = false;

  // R-45 / sonde P-59 : les champs reserves a {E, 2, 3} ne sont servis que si la ligne DECLARE sa
  // categorie de carburant. Quand elle est absente (A-16, ou absence de completude), rien ne permet
  // plus de justifier une autonomie electrique : les champs partent avec elle.
  const categoryShown = o.fuelCategory !== undefined;
  const isElec = l.fuelCategory === 'E' && categoryShown;
  const elecEligible = (isElec || pluginEligible) && categoryShown;
  if (elecEligible) {
    const battery = {};
    if (isElec && l.batteryOwnership !== null && has('battery.ownershipType')) battery.ownershipType = l.batteryOwnership;
    if (l.batteryCapacity !== null && has('battery.capacity')) {
      battery.capacity = round1(l.batteryCapacity);
      battery.capacityUnit = 'kWh';
    }
    if (Object.keys(battery).length > 0) o.battery = battery;
  }

  /* ---- Une seule branche de mesure (contrainte 17, C-13) ---------------------------------------- */
  const thermal = !isElec && l.fuelCategory !== 'H';
  let co2Retained = null;
  let consRetained = null;
  if (l.branch === 'NEDC') {
    const co2Val = l.co2Zero ? 0 : l.co2;
    if (has('co2Emissions') && (thermal || isElec)) {
      o.co2Emissions = roundCo2(co2Val);
      o.co2EmissionsUnit = 'g/km';
      co2Retained = roundCo2(co2Val);
    }
    const cons = {};
    if (thermal && l.consumption !== null && has('consumption.combined')) {
      cons.combined = round1(l.consumption);
      consRetained = cons.combined;
    }
    if (l.consumptionElectric !== null && has('consumption.electricCombined')) cons.electricCombined = round1(l.consumptionElectric);
    if (Object.keys(cons).length > 0) {
      o.consumption = cons;
      if (cons.combined !== undefined) o.combinedUnit = 'l/100km';
      if (cons.electricCombined !== undefined) o.electricCombinedUnit = 'kWh/100km';
    }
  } else if (l.branch === 'WLTP') {
    const w = {};
    // Contrainte 18 : wltp.co2EmissionsCombined a pour minimum 1 ; le zero d'un electrique (et
    // celui de l'anomalie A-14) passe par co2EmissionInGramPerKmWithFallback.
    if (thermal && !l.co2Zero && has('wltp.co2EmissionsCombined')) {
      w.co2EmissionsCombined = roundCo2(Math.max(1, l.co2));
      co2Retained = w.co2EmissionsCombined;
    } else if (isElec || l.co2Zero) co2Retained = 0;
    if (thermal && l.consumption !== null && has('wltp.consumptionCombined')) {
      w.consumptionCombined = round1(l.consumption);
      consRetained = w.consumptionCombined;
      o.combinedUnit = 'l/100km';
    }
    if (l.consumptionElectric !== null && has('wltp.consumptionElectricCombined')) {
      w.consumptionElectricCombined = round1(l.consumptionElectric);
      o.electricCombinedUnit = 'kWh/100km';
    }
    if (has('wltp.co2Class')) w.co2Class = l.co2Zero ? 10 : l.co2Class;
    if (Object.keys(w).length > 0) o.wltp = w;
  } else {
    co2Retained = l.co2Zero ? 0 : isElec || l.fuelCategory === 'H' ? 0 : roundCo2(l.co2);
    consRetained = thermal && l.consumption !== null ? round1(l.consumption) : null;
    if (consRetained !== null) o.combinedUnit = 'l/100km';
  }
  if (co2Retained !== null) o.co2EmissionInGramPerKmWithFallback = clamp(roundCo2(co2Retained), 0, 1000);
  if (consRetained !== null) o.consumptionCombinedWithFallback = clamp(round1(consRetained), 0, 99.9);
  if (has('euEmissionStandard')) o.euEmissionStandard = l.euEmissionStandard;
  if (l.branch === 'NEDC' && has('efficiencyClass')) o.efficiencyClass = l.efficiencyClass;
  if (elecEligible && l.electricRange !== null && has('electricRange')) o.electricRange = l.electricRange;
  if (l.hasParticleFilter !== null && has('hasParticleFilter')) o.hasParticleFilter = l.hasParticleFilter;

  if (has('bodyType')) o.bodyType = l.bodyType;
  if (has('doorCount')) o.doorCount = l.doorCount;
  if (has('seatCount')) o.seatCount = l.seatCount;
  if (has('bodyColor')) o.bodyColor = l.bodyColor;
  if (has('isMetallic')) o.isMetallic = l.isMetallic;
  if (has('paintType')) o.paintType = l.paintType;
  if (has('upholsteryType')) o.upholsteryType = l.upholsteryType;
  if (has('upholsteryColor')) o.upholsteryColor = l.upholsteryColor;
  if (l.equipment.length > 0 && has('equipment')) o.equipment = l.equipment;
  if (l.appliedSeals !== null) o.appliedSeals = l.appliedSeals;
  if (has('offerType')) o.offerType = l.offerType;
  if (has('usageState')) o.usageState = l.usageState;
  if (has('condition.hadAccident')) o.condition = { hadAccident: l.hadAccident };
  if (has('previousOwnerCount')) o.previousOwnerCount = l.previousOwnerCount;
  if (has('hasFullServiceHistory')) o.hasFullServiceHistory = l.hasFullServiceHistory;
  if (has('nextInspectionDate')) o.nextInspectionDate = nextInspection(l, snap.capturedAtMs);
  if (has('wasCabOrRental')) o.wasCabOrRental = l.wasCabOrRental;
  if (l.warranty !== null) {
    o.warranty = l.warranty;
    o.warrantyUnit = 'Months';
    o.hasWarranty = l.hasWarranty;
  }

  /* ---- Prix (R-22, R-23 ; contraintes 5 a 10) --------------------------------------------------- */
  const pub = {};
  const priceShown = l.priceStatus === 'QUOTED' || l.priceStatus === 'ON_REQUEST_WITH_AMOUNT';
  if (priceShown) {
    pub.price = l.displayPrice;
    pub.currency = 'EUR';
    if (l.netPrice !== null) {
      pub.netPrice = l.netPrice;
      pub.vatRate = l.vatRate;
    }
  }
  if (l.isTaxDeductible !== null) pub.isTaxDeductible = l.isTaxDeductible;
  if (l.isNegotiable !== null) pub.isNegotiable = l.isNegotiable;
  if (l.priceStatus === 'ON_REQUEST' || l.priceStatus === 'ON_REQUEST_WITH_AMOUNT') pub.onRequestOnly = true;
  if (l.evaluationCategory !== null) pub.evaluation = { category: l.evaluationCategory };
  const prices = {};
  if (Object.keys(pub).length > 0) prices.public = pub;
  if (l.msrp !== null) prices.manufacturersSuggestedRetail = { price: l.msrp, currency: 'EUR' };
  if (Object.keys(prices).length > 0) o.prices = prices;
  o.superDeal = l.superDeal;
  if (l.adTier !== null) o.adProduct = { tier: l.adTier };
  const publication = { status: 'Active' };
  if (has('publication.accurateState')) publication.accurateState = l.accurateState;
  publication.isNew = l.isNew === true;
  o.publication = publication;
  o.createdAt = l.createdAt;
  o.lastUpdatedAt = l.lastUpdatedAt;
  o.firstActivatedDate = l.firstActivatedDate;
  o.imageCount = l.imageCount;
  if (has('hasVideo')) o.hasVideo = l.hasVideo;
  const location = { countryCode: l.countryCode };
  if (has('location.postalCodePrefix2')) location.postalCodePrefix2 = l.prefix;
  o.location = location;
  const seller = { type: l.sellerType };
  if (l.sellerType === 'D' && l.dealerBucket !== null) seller.dealerBucket = l.dealerBucket;
  o.seller = seller;
  void ctx;
  return o;
}

/** R-32 - ordre total du fichier : (makeId, modelId, firstRegistrationYearMonth, listingId). */
export function sortRows(rows) {
  rows.sort((a, b) => {
    if (a.o.make !== b.o.make) return a.o.make - b.o.make;
    const am = a.o.model ?? 0;
    const bm = b.o.model ?? 0;
    if (am !== bm) return am - bm;
    const af = a.o.firstRegistrationDate ?? '';
    const bf = b.o.firstRegistrationDate ?? '';
    if (af !== bf) return af < bf ? -1 : 1;
    return a.o.id < b.o.id ? -1 : a.o.id > b.o.id ? 1 : 0;
  });
  return rows;
}

/** Serialise en NDJSON, hache les octets NON COMPRESSES (contrainte 31) et compresse. */
export function serializeNdjson(objects) {
  const parts = new Array(objects.length);
  for (let i = 0; i < objects.length; i += 1) parts[i] = JSON.stringify(objects[i]);
  const text = `${parts.join('\n')}\n`;
  const raw = Buffer.from(text, 'utf8');
  const gz = gzipSync(raw, { level: 9, memLevel: 9, strategy: 1 /* Z_FILTERED */ });
  return {
    raw,
    gz,
    sha256: createHash('sha256').update(raw).digest('hex'),
    sha256Gz: createHash('sha256').update(gz).digest('hex'),
  };
}
