/**
 * KYCAR - Anomalies controlees et verite terrain (R-57, R-58 ; A-01 a A-24)
 * =================================================================================================
 * Deux principes, tous deux verifiables :
 *
 *  - R-57 : l'anomalie est injectee APRES le calcul de la valeur plausible, et la valeur plausible
 *    est conservee au manifest. Sans elle, la verite terrain n'est pas falsifiable.
 *  - R-58 : une annonce porte AU PLUS UNE anomalie de prix. Les selections de prix se font dans un
 *    ordre fixe, en retirant du vivier ce qui est deja pris.
 *
 * SELECTION A EFFECTIF EXACT. Une anomalie a 0,02 % au profil test represente QUATRE annonces : un
 * tirage de Bernoulli independant y a un ecart-type de 2, la sonde P-72 (+/- 20 % relatifs) serait
 * rouge une fois sur deux sans qu'aucun defaut ne l'explique. Le generateur selectionne donc les
 * `round(taux * N)` plus petites cles d'une course exponentielle `-ln(u) / w`, `u` etant un HACHAGE
 * PUR de l'annonce : l'effectif est exact, la structure conditionnelle (le poids `w`) est
 * respectee, et le flot principal n'est pas consomme.
 *
 * PROPRIETE DE SLOT, PAS D'ANNONCE. L'appartenance a une anomalie est attachee au SLOT de la
 * population, fixe au premier snapshot. Une annonce entrante herite du slot qu'elle occupe. C'est
 * ce qui rend simultanement vrai : l'effectif par anomalie est identique sur les trois snapshots,
 * et une survivante non revisee est identique champ a champ (contrainte 4, sonde P-70).
 */

import { pureUnit } from './prng.mjs';

const DOM_BASE = 0x4a0000;

/** Ordre de traitement ; les anomalies de prix sont exclusives entre elles (R-58). */
export const PRICE_ANOMALIES = ['A-23', 'A-20', 'A-24', 'A-01', 'A-02', 'A-10', 'A-11'];
export const OTHER_ANOMALIES = [
  'A-03', 'A-04', 'A-04b', 'A-05', 'A-09', 'A-09b', 'A-12', 'A-13', 'A-13b',
  'A-14', 'A-15', 'A-16', 'A-17', 'A-19', 'A-21', 'A-22',
];
export const CLONE_ANOMALIES = ['A-07', 'A-07b', 'A-08'];

/** Valeurs de prix sentinelles de A-01. */
const SENTINELS = [1, 11, 99, 111, 123, 150, 199, 249];

/** Domaine de hachage par identifiant d'anomalie (stable, jamais reordonne). */
const ALL_IDS = [...CLONE_ANOMALIES, ...PRICE_ANOMALIES, ...OTHER_ANOMALIES];
const domainOf = (id) => DOM_BASE + ALL_IDS.indexOf(id) * 7 + 1;

/** Taux specifie d'une anomalie (anomalies.json). */
export function rateOf(tables, id) {
  const a = tables.anomalies.anomalies.find((x) => x.id === id);
  return a ? a.rate : 0;
}

/**
 * Selectionne exactement `target` elements du vivier, par course exponentielle sur un hachage pur.
 * @param {number[]} pool indices de slot eligibles
 * @param {number} target effectif vise
 * @param {(i:number)=>number} weightOf poids conditionnel (1 = uniforme)
 */
function selectExact(pool, target, seed, domain, rowOf, weightOf) {
  if (target <= 0 || pool.length === 0) return [];
  const keyed = pool.map((i) => {
    const u = Math.max(1e-12, pureUnit(seed, domain, rowOf(i)));
    const w = weightOf ? Math.max(1e-9, weightOf(i)) : 1;
    return { i, k: -Math.log(u) / w };
  });
  keyed.sort((a, b) => (a.k === b.k ? a.i - b.i : a.k - b.k));
  return keyed.slice(0, Math.min(target, keyed.length)).map((x) => x.i).sort((a, b) => a - b);
}

/**
 * Attribue les roles de clonage (A-07, A-07b, A-08) aux slots. Le clone occupe le slot suivant sa
 * source, dans la meme marque : les effectifs par marque restent exacts (P-08) et le nombre de
 * lignes du fichier reste celui du profil (P-01).
 */
export function assignCloneRoles(listings, tables, seed, total) {
  const roles = new Array(listings.length).fill(null);
  const eligible = [];
  for (let j = 1; j < listings.length; j += 1) {
    if (listings[j].makeSlug !== listings[j - 1].makeSlug) continue;
    // Base des trois anomalies de doublon : annonces PROFESSIONNELLES (anomalies.json). En exigeant
    // que la source ET le clone soient deja professionnels, le role de clonage n'a besoin d'aucune
    // regeneration au premier snapshot.
    if (listings[j].sellerType !== 'D' || listings[j - 1].sellerType !== 'D') continue;
    eligible.push(j);
  }
  const taken = new Set();
  for (const id of CLONE_ANOMALIES) {
    const target = Math.round(rateOf(tables, id) * total);
    const pool = eligible.filter((j) => !taken.has(j) && !taken.has(j - 1) && roles[j - 1] === null);
    const picked = selectExact(pool, target, seed, domainOf(id), (i) => i, null);
    for (const j of picked) {
      roles[j] = { kind: id, src: j - 1 };
      taken.add(j);
      taken.add(j - 1);
    }
  }
  return roles;
}

/**
 * Attribue les anomalies de prix puis les autres aux slots (hors slots de clonage, qui portent deja
 * la leur). Retourne un tableau `slotAnomalies[j] = [{ id, params }]`.
 */
export function assignAnomalySlots(listings, roles, tables, seed, total, cellCount) {
  const slots = listings.map(() => []);
  const isClone = (j) => roles[j] !== null;
  const rowOf = (j) => listings[j].rowIndex;

  const base = [];
  for (let j = 0; j < listings.length; j += 1) if (!isClone(j)) base.push(j);

  /* ---- Anomalies de prix, exclusives (R-58) ------------------------------------------------------ */
  const used = new Set();
  const onRequestWeight = (j) => {
    const l = listings[j];
    if (l.sellerType !== 'D') return 0.005;
    return l.segment === 'luxe' || l.justPrice > 80000 ? 0.22 : 0.035;
  };
  for (const id of PRICE_ANOMALIES) {
    const target = Math.round(rateOf(tables, id) * total);
    let pool = base.filter((j) => !used.has(j));
    let weight = null;
    if (id === 'A-23' || id === 'A-20') weight = onRequestWeight;
    if (id === 'A-11') pool = pool.filter((j) => (cellCount.get(`${listings[j].makeId}|${listings[j].modelId}`) ?? 0) >= 30);
    const picked = selectExact(pool, target, seed, domainOf(id), rowOf, weight);
    for (const j of picked) {
      used.add(j);
      slots[j].push({ id });
    }
  }

  /* ---- Autres anomalies : bases conditionnelles, cumulables avec une anomalie de prix ------------ */
  const eligibleFor = (id, j) => {
    const l = listings[j];
    switch (id) {
      case 'A-03':
        return l.offerType === 'U' || l.offerType === 'J' || l.offerType === 'O';
      case 'A-13b':
        return true;
      case 'A-14':
        return l.fuelCategory === 'B' || l.fuelCategory === 'D' || l.fuelCategory === '2' || l.fuelCategory === '3';
      case 'A-15':
        return l.fuelCategory === 'B' || l.fuelCategory === 'D';
      case 'A-16':
        return l.fuelCategory === '2' || l.fuelCategory === '3';
      case 'A-05':
        // Une annonce de branche WLTP tres roulee (ou un ancetre WLTP, cas theorique) n'a AUCUNE
        // variante licite : la date future rendrait son rythme kilometrique implausible (P-100) et
        // la ferait sortir de la borne d'age de l'offerType O (P-85), tandis que la date de 1899 la
        // ferait passer du mauvais cote du seuil WLTP (P-61). Elle est ecartee du vivier.
        return l.branch !== 'WLTP' || futureVariantOk(l);
      default:
        return true;
    }
  };
  const usedField = new Map();
  for (const id of OTHER_ANOMALIES) {
    const target = Math.round(rateOf(tables, id) * total);
    const family = FIELD_FAMILY[id];
    const pool = base.filter((j) => {
      if (!eligibleFor(id, j)) return false;
      if (family && (usedField.get(family) ?? new Set()).has(j)) return false;
      return true;
    });
    // A-05 : la date hors bornes doit rester du MEME cote du seuil WLTP (2018-09) que la date
    // plausible, faute de quoi elle ferait echouer P-61 sur une annonce dont la branche de mesure
    // est correcte ; et la variante FUTURE ne doit pas rendre le rythme kilometrique implausible
    // (P-100). Le vivier est donc pondere vers les annonces ou la variante future est licite.
    const weight = id === 'A-05' ? (j) => (futureVariantOk(listings[j]) ? 4 : 1) : null;
    const picked = selectExact(pool, target, seed, domainOf(id), rowOf, weight);
    for (const j of picked) {
      slots[j].push({ id });
      if (family) {
        if (!usedField.has(family)) usedField.set(family, new Set());
        usedField.get(family).add(j);
      }
    }
  }
  return slots;
}

/** A-05 : la variante "annee + 2" n'est licite que sur une annonce WLTP (ou sans branche) peu roulee. */
export function futureVariantOk(l) {
  return l.branch !== 'NEDC' && l.mileage <= 95000 && l.offerType !== 'O';
}

/** Variante retenue pour A-05 : future si elle est licite, sinon 1899-12. */
function firstRegVariant(l, u) {
  if (!futureVariantOk(l)) return 'past';
  return l.branch === 'WLTP' || u < 0.8 ? 'future' : 'past';
}

/** Familles de champ : deux anomalies de la meme famille ne se cumulent pas sur une annonce. */
const FIELD_FAMILY = {
  'A-03': 'mileage',
  'A-04': 'mileage',
  'A-04b': 'mileage',
  'A-13': 'power',
  'A-13b': 'power',
  'A-09': 'version',
  'A-09b': 'version',
  'A-15': 'fuel',
  'A-16': 'fuel',
  'A-19': 'region',
  'A-21': 'region',
};

/**
 * Conditionne la generation d'une annonce entrante aux exigences de son slot : sans cela, une
 * anomalie de base conditionnelle disparaitrait au renouvellement et son effectif deriverait.
 */
export function slotConstraints(slotAnoms, role) {
  const out = {};
  if (role !== null) out.forceSellerType = 'D';
  for (const a of slotAnoms) {
    if (a.id === 'A-16' || a.id === 'A-14') out.forceThermalOrHybrid = a.id;
    if (a.id === 'A-15') out.forceFuel = 'BD';
    if (a.id === 'A-03') out.forceUsedOffer = true;
    if (a.id === 'A-11') out.pinModel = true;
  }
  return out;
}

/**
 * Applique les anomalies a une annonce et produit ses entrees de verite terrain.
 * @returns {object[]} entrees `groundTruth` (sans `listingId`, ajoute par l'appelant)
 */
export function applyAnomalies(listing, slotAnoms, ctx, seed, cellCount) {
  const out = [];
  const T = ctx.tables;
  const row = listing.rowIndex;
  const u = (k) => pureUnit(seed, DOM_BASE + 0x500 + k, row);

  for (const a of slotAnoms) {
    const id = a.id;
    listing.anomalies.push(id);
    switch (id) {
      case 'A-23':
        listing.priceStatus = 'ON_REQUEST';
        out.push({ anomaly: 'PRICE_ON_REQUEST', expected: { status: 'ON_REQUEST', fair: Math.round(listing.justPrice) } });
        break;
      case 'A-20':
        listing.priceStatus = 'ON_REQUEST_WITH_AMOUNT';
        out.push({
          anomaly: 'PRICE_ON_REQUEST_WITH_AMOUNT',
          expected: { status: 'ON_REQUEST', amount: listing.displayPrice },
        });
        break;
      case 'A-24':
        listing.priceStatus = 'MISSING';
        out.push({ anomaly: 'PRICE_MISSING_UNDECLARED', expected: { status: 'MISSING', fair: Math.round(listing.justPrice) } });
        break;
      case 'A-01': {
        const fair = listing.displayPrice;
        listing.displayPrice = SENTINELS[Math.floor(u(1) * SENTINELS.length)];
        out.push({
          anomaly: 'PRICE_SENTINEL_ABSOLUTE',
          expected: { flag: 'PRICE_SENTINEL_ABSOLUTE', injected: listing.displayPrice, fair },
        });
        break;
      }
      case 'A-02': {
        const fair = listing.displayPrice;
        listing.displayPrice = u(2) < 0.5 ? 5123456 : 9999999;
        out.push({ anomaly: 'PRICE_OUT_OF_RANGE', expected: { injected: listing.displayPrice, fair } });
        break;
      }
      case 'A-10': {
        const fair = listing.displayPrice;
        const high = u(3) < 0.5;
        listing.displayPrice = high
          ? Math.round(500000 + u(4) * 2500000)
          : Math.round(260 + u(4) * 220); // jamais sous 250 : sinon l'annonce devient une sentinelle
        out.push({
          anomaly: high ? 'OUTLIER_M1_HIGH' : 'OUTLIER_M1_LOW',
          expected: { method: 'M1', injected: listing.displayPrice, fair, factor: Math.round((listing.displayPrice / fair) * 1000) / 1000 },
        });
        break;
      }
      case 'A-11': {
        const fair = listing.displayPrice;
        const high = u(5) < 0.5;
        const factor = high ? 2.0 + u(6) * 1.2 : 0.3 + u(6) * 0.2;
        listing.displayPrice = Math.max(250, Math.round(fair * factor));
        out.push({
          anomaly: high ? 'OUTLIER_M2_HIGH' : 'OUTLIER_M2_LOW',
          expected: {
            method: 'M2',
            injected: listing.displayPrice,
            fair,
            factor: Math.round(factor * 1000) / 1000,
            cell: cellCount.get(`${listing.makeId}|${listing.modelId}`) ?? 0,
          },
        });
        break;
      }
      case 'A-03': {
        const fair = listing.mileage;
        listing.mileage = 0;
        out.push({ anomaly: 'SUSPECT_ZERO_MILEAGE', expected: { fair, offerType: listing.offerType } });
        break;
      }
      case 'A-04': {
        const fair = listing.mileage;
        const months = Math.max(listing.age * 12 + (12 - listing.month), 6);
        const formA = listing.age < 6 || u(7) < 0.6;
        if (formA) {
          // La borne de la contrainte 22 est 200 000 km/an : 65 000 a 95 000 km/an ne la franchit
          // PAS (voir DATASET-GEN.md §6, ecart EG-02). Le generateur porte le rythme a
          // 260 000-360 000 km/an pour que la detection annoncee soit effectivement possible.
          const perYear = 260000 + u(8) * 100000;
          listing.mileage = Math.min(1900000, Math.round(((months / 12) * perYear) / 100) * 100);
          if (listing.mileage * 12 <= 200000 * months) listing.mileage = Math.min(1900000, 200000 * Math.ceil(months / 12) + 100000);
        } else {
          listing.mileage = Math.round((200 + u(8) * 700) / 100) * 100;
        }
        out.push({
          anomaly: 'MILEAGE_IMPLAUSIBLE_FOR_AGE',
          detail: formA ? 'forme (a) rythme annuel hors borne' : 'forme (b) kilometrage trop faible pour l age',
          expected: { fair, injected: listing.mileage, form: formA ? 'a' : 'b', ageMonths: months },
        });
        break;
      }
      case 'A-04b': {
        const fair = listing.mileage;
        listing.mileage = 2400000 + Math.round((u(9) * 400000) / 100) * 100;
        out.push({ anomaly: 'MILEAGE_OUT_OF_RANGE', expected: { fair, injected: listing.mileage } });
        break;
      }
      case 'A-05': {
        const fair = `${listing.year}-${String(listing.month).padStart(2, '0')}`;
        // On n'ecrase QUE la valeur emise : l'age, les dates et le prix restent ceux du vehicule
        // plausible, sans quoi la valeur conservee au manifest ne serait plus falsifiable (R-57).
        listing.firstRegOverride =
          firstRegVariant(listing, u(10)) === 'future' ? `${ctx.capturedYear + 2}-04` : '1899-12';
        out.push({ anomaly: 'FIRST_REG_OUT_OF_RANGE', expected: { fair, injected: listing.firstRegOverride } });
        break;
      }
      case 'A-09': {
        const fair = listing.modelVersion;
        const noise = ['*** *** ***', '--- PROMO ---', '!!! !!!', '... ...'];
        listing.modelVersion = noise[Math.floor(u(11) * noise.length)];
        out.push({ anomaly: 'VERSION_FULLY_STRIPPED', expected: { fair, injected: listing.modelVersion } });
        break;
      }
      case 'A-09b': {
        const fair = listing.modelVersion;
        const formA = u(12) < 0.5;
        if (formA) {
          const foreign = ['Golf', 'Clio', 'Astra', 'Serie 3', 'Punto', 'Megane'];
          listing.modelVersion = `${fair} ${foreign[Math.floor(u(13) * foreign.length)]}`.slice(0, 121);
        } else {
          const wrongHp = Math.round((listing.powerHp * (1.35 + u(13) * 0.5)) / 5) * 5;
          listing.modelVersion = `${fair} ${wrongHp} ch`.slice(0, 121);
        }
        out.push({
          anomaly: 'VERSION_AMBIGUOUS',
          detail: formA ? 'forme (a) modele d une autre marque' : 'forme (b) puissance contredite',
          expected: { fair, injected: listing.modelVersion, form: formA ? 'a' : 'b' },
        });
        break;
      }
      case 'A-12':
        listing.completeness = 0.05 + u(14) * 0.2;
        listing.forceIncomplete = true;
        out.push({ anomaly: 'OTHER', detail: 'annonce incomplete : au moins 6 champs optionnels absents', expected: { latent: Math.round(listing.completeness * 1000) / 1000 } });
        break;
      case 'A-13': {
        const fair = listing.powerKw;
        listing.powerKw = u(15) < 0.5 ? 1 : 9999;
        listing.powerHp = Math.min(13600, Math.max(1, Math.round(listing.powerKw / 0.7355)));
        out.push({ anomaly: 'POWER_OUT_OF_RANGE', expected: { fair, injected: listing.powerKw } });
        break;
      }
      case 'A-13b': {
        const exact = Math.round(listing.powerKw / 0.7355);
        const dev = (0.06 + u(16) * 0.19) * (u(17) < 0.5 ? -1 : 1);
        listing.powerHp = Math.min(13600, Math.max(1, Math.round(exact * (1 + dev))));
        out.push({
          anomaly: 'POWER_UNIT_MISMATCH',
          expected: { power: listing.powerKw, powerHp: listing.powerHp, exact, deviationPct: Math.round(dev * 1000) / 10 },
        });
        break;
      }
      case 'A-14': {
        const fair = listing.co2;
        listing.co2 = 0;
        listing.co2Zero = true;
        out.push({ anomaly: 'CO2_ZERO_NON_BEV', expected: { fair, branch: listing.branch, fuelCategory: listing.fuelCategory } });
        break;
      }
      case 'A-15':
        listing.isPlugin = true;
        out.push({ anomaly: 'HYBRID_INCONSISTENT', expected: { fuelCategory: listing.fuelCategory, isPluginHybrid: true } });
        break;
      case 'A-16': {
        const branchA = u(18) < 0.5;
        listing.fuelCategoryAbsent = true;
        if (!branchA) listing.primaryFuelTypeAbsent = true;
        out.push({
          anomaly: 'HYBRID_CATEGORY_UNRESOLVED',
          detail: branchA ? 'branche EX-DATA-10 (repli creation vers recherche)' : 'branche EX-DATA-11 (hybride non resolu)',
          expected: { fair: listing.fuelCategory, branch: branchA ? 'EX-DATA-10' : 'EX-DATA-11' },
        });
        break;
      }
      case 'A-17':
        listing.mileageUnit = 'mi';
        out.push({ anomaly: 'UNIT_UNSUPPORTED', expected: { unit: 'mi', value: listing.mileage } });
        break;
      case 'A-19': {
        const fair = listing.countryCode;
        listing.countryCode = ['LU', 'FR', 'NL'][Math.floor(u(19) * 3)];
        out.push({ anomaly: 'REGION_UNRESOLVED', detail: 'pays hors marche', expected: { fair, injected: listing.countryCode } });
        break;
      }
      case 'A-21': {
        const fair = listing.prefix;
        listing.prefix = `0${Math.floor(u(20) * 10)}`;
        out.push({ anomaly: 'REGION_UNRESOLVED', detail: 'prefixe postal non resolu', expected: { fair, injected: listing.prefix } });
        break;
      }
      case 'A-22':
        listing.modelAbsent = true;
        out.push({ anomaly: 'MODEL_UNRESOLVED', expected: { fair: listing.modelId } });
        break;
      default:
        break;
    }
  }
  // Retablit la coherence kW/ch quand la puissance a bouge sans que A-13b soit portee.
  if (!listing.anomalies.includes('A-13b') && !listing.anomalies.includes('A-13')) {
    listing.powerHp = Math.min(13600, Math.max(1, Math.round(listing.powerKw / 0.7355)));
  }
  void T;
  return out;
}
