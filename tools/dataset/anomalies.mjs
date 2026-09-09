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

import { m1CellFor } from './cells.mjs';
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

/** Population de reference du taux, telle qu'`anomalies.json` la NOMME (champ `base`). */
export function baseOf(tables, id) {
  const a = tables.anomalies.anomalies.find((x) => x.id === id);
  return a ? a.base : 'toutes';
}

const THERMAL_CATEGORIES = new Set(['B', 'D', '2', '3', 'L', 'C', 'M', 'O']);

/**
 * DR3-10 - EFFECTIF VISE D'UNE ANOMALIE, SUR SA BASE DECLAREE.
 *
 * Le generateur appliquait TOUS les taux a l'effectif TOTAL du snapshot (`round(taux x N)`) alors
 * qu'`anomalies.json` nomme, anomalie par anomalie, la population de reference du taux. Cinq
 * groupes en sortaient : `A-07` / `A-07b` / `A-08` (base « annonces professionnelles », 68,7 % du
 * stock) de +46 %, `A-16` de +658 %, `A-20` de +3 189 %. Le champ `base` annoncait une chose, le
 * fichier en produisait une autre.
 *
 * `counts` porte les effectifs que le generateur connait au moment du tirage :
 *   - `total`       effectif du snapshot ;
 *   - `pro`         annonces professionnelles ;
 *   - `usedOffer`   annonces d'`offerType` U, J ou O ;
 *   - `thermal`     annonces thermiques ;
 *   - `hybrid`      annonces hybrides (categories 2 et 3) ;
 *   - `quoted`      annonces a prix affiche - connu des que A-23, A-20 et A-24 sont tires, parce
 *                   que ce sont EXACTEMENT les trois anomalies qui retirent le prix affiche ;
 *   - `onRequest`   annonces a prix sur demande (A-23 + A-20) ;
 *   - `withPowerHp` esperance du nombre d'annonces portant `powerHp` apres le modele de completude.
 */
export function baseCount(base, counts) {
  if (base.startsWith('annonces a prix affiche')) return counts.quoted;
  if (base === 'annonces professionnelles') return counts.pro;
  if (base === "annonces d'offerType U, J ou O") return counts.usedOffer;
  if (base === 'annonces thermiques') return counts.thermal;
  if (base === 'annonces hybrides') return counts.hybrid;
  if (base === 'annonces portant powerHp') return counts.withPowerHp;
  if (base === 'annonces a prix sur demande') return counts.onRequest;
  return counts.total;
}

/** Effectif vise = `round(taux x base declaree)`. */
export function targetOf(tables, id, counts) {
  return Math.round(rateOf(tables, id) * baseCount(baseOf(tables, id), counts));
}

/** Effectifs de base mesures sur les occupants du snapshot (hors bases dependant du prix). */
export function structuralCounts(listings, withPowerHp) {
  let pro = 0;
  let usedOffer = 0;
  let thermal = 0;
  let hybrid = 0;
  for (const l of listings) {
    if (l.sellerType === 'D') pro += 1;
    if (l.offerType === 'U' || l.offerType === 'J' || l.offerType === 'O') usedOffer += 1;
    if (THERMAL_CATEGORIES.has(l.fuelCategory)) thermal += 1;
    if (l.fuelCategory === '2' || l.fuelCategory === '3') hybrid += 1;
  }
  return {
    total: listings.length,
    pro,
    usedOffer,
    thermal,
    hybrid,
    withPowerHp: Math.round(withPowerHp ?? listings.length),
    quoted: listings.length,
    onRequest: 0,
  };
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
export function assignCloneRoles(listings, tables, seed, counts) {
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
    // DR3-10 : les trois anomalies de doublon declarent la base « annonces professionnelles ».
    const target = targetOf(tables, id, counts);
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
export function assignAnomalySlots(listings, roles, tables, seed, counts, cellCount, stats) {
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
  // DR3-10 : les bases « annonces a prix affiche » et « annonces a prix sur demande » ne sont
  // connues qu'une fois tirees les TROIS anomalies qui deplacent le statut de prix (A-23, A-20,
  // A-24). L'ordre de `PRICE_ANOMALIES` les place en tete ; les compteurs sont tenus a jour au fur
  // et a mesure, et la base d'A-20 - qui est elle-meme une annonce a prix sur demande - se resout
  // par un point fixe de deux iterations (le taux vaut 1,3 %, la suite converge immediatement).
  const live = { ...counts };
  const onRequestBase = (extra) => live.onRequest + extra;
  for (const id of PRICE_ANOMALIES) {
    let target;
    if (id === 'A-20') {
      let t = 0;
      for (let it = 0; it < 4; it += 1) t = Math.round(rateOf(tables, id) * onRequestBase(t));
      target = t;
    } else {
      target = targetOf(tables, id, live);
    }
    let pool = base.filter((j) => !used.has(j));
    let weight = null;
    if (id === 'A-23' || id === 'A-20') weight = onRequestWeight;
    if (id === 'A-11') {
      pool = pool.filter((j) => {
        if ((cellCount.get(`${listings[j].makeId}|${listings[j].modelId}`) ?? 0) < 30) return false;
        // DR3-09 : la cellule doit porter un ajustement M2 EXPLOITABLE, sinon l'annonce injectee
        // n'est pas evaluee et le rappel annonce est inatteignable par construction.
        const fit = stats?.fitC2.get(`${listings[j].makeId}|${listings[j].modelId}`);
        return fit !== undefined && fit.ok;
      });
    }
    if (id === 'A-10') {
      // DR3-08 : M1 n'evalue que les annonces dont une cellule de la cascade atteint 12 prix.
      pool = pool.filter((j) => m1CellFor(stats, listings[j]).chosen !== null);
    }
    const picked = selectExact(pool, target, seed, domainOf(id), rowOf, weight);
    for (const j of picked) {
      used.add(j);
      slots[j].push({ id });
    }
    if (id === 'A-23' || id === 'A-20') {
      live.onRequest += picked.length;
      live.quoted -= picked.length;
    }
    if (id === 'A-24') live.quoted -= picked.length;
  }
  // Les effectifs de base realises (prix affiche, prix sur demande) sont rendus a l'appelant : le
  // rapport lateral publie l'attendu de chaque anomalie SUR SA BASE, pas sur N (DR3-10).
  counts.quoted = live.quoted;
  counts.onRequest = live.onRequest;

  /* ---- Autres anomalies : bases conditionnelles, cumulables avec une anomalie de prix ------------ */
  const eligibleFor = (id, j) => {
    const l = listings[j];
    switch (id) {
      case 'A-04':
        // DR3-02 : la forme (a) doit franchir la borne de la contrainte 22 (200 000 km/an) SANS
        // franchir la borne dure du champ (#59, 1 500 000 km), qui rendrait le kilometrage INCONNU
        // et remplacerait le signal attendu par `MILEAGE_OUT_OF_RANGE`. Les deux bornes ne sont
        // conciliables que sous 90 mois d'age : au-dela, `1 500 000 / (mois/12)` tombe sous
        // 200 000 km/an et AUCUN kilometrage licite n'est implausible. Le vivier est donc borne en
        // age - c'est la seule facon de tenir le « 100 % des formes (a) » d'`aRetrouver`.
        return ageMonthsOf(l) <= A04_MAX_AGE_MONTHS;
      case 'A-03':
        return l.offerType === 'U' || l.offerType === 'J' || l.offerType === 'O';
      case 'A-13b':
        return true;
      case 'A-14':
        return l.fuelCategory === 'B' || l.fuelCategory === 'D' || l.fuelCategory === '2' || l.fuelCategory === '3';
      case 'A-15':
        // DR3-05 : l'anomalie pose `isPluginHybrid = true` sur une annonce thermique. Toute sonde
        // qui definit la population « electrique ou rechargeable » par ce champ (c'est le cas de la
        // table d'eligibilite de P-55) ramasse alors des lignes dont la consommation electrique est
        // STRUCTURELLEMENT absente. En bornant le vivier a la branche WLTP, la contamination porte
        // sur une population de 2 000 lignes au lieu des 100 lignes electriques de branche NEDC,
        // ou elle deplacait le taux mesure de 6 points. Le vivier reste par ailleurs le plus
        // realiste : `isPluginHybrid` est un champ des annonces RECENTES.
        return (l.fuelCategory === 'B' || l.fuelCategory === 'D') && l.branch === 'WLTP';
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
    const target = targetOf(tables, id, live);
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

/** Age en mois d'une annonce a la capture, au sens de la contrainte 22 (au moins 6 mois). */
export function ageMonthsOf(l) {
  return Math.max(l.age * 12 + (12 - l.month), 6);
}

/**
 * DR3-02 - age maximal du vivier d'`A-04`. A 84 mois, le rythme maximal compatible avec la borne
 * dure de 1 450 000 km vaut `1 450 000 x 12 / 84 = 207 143 km/an` : la marge sur les 200 000 km/an
 * de la contrainte 22 n'est plus que de 3,6 %, que l'arrondi au centieme de kilometre pourrait
 * manger. A 72 mois elle vaut 20,8 %, ce qui est sûr.
 */
const A04_MAX_AGE_MONTHS = 72;

/** DR3-02 - plafond de kilometrage de la forme (a) : sous la borne dure #59 (1 500 000 km). */
const A04_MILEAGE_CAP = 1450000;

/** DR3-09 - nombre d'ecarts robustes `s` entre le prix attendu de la cellule et la valeur injectee. */
const M2_INJECTION_K = 3.4;

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
  // DR3-02 : A-05 rejoint la famille du kilometrage. Le rythme annuel de la contrainte 22 se calcule
  // a partir de la DATE de premiere immatriculation : sur une annonce dont la date est deliberement
  // hors bornes (A-05), l'age n'est pas calculable, l'adaptateur ne pose aucun signalement, et la
  // declaration A-04 reste sans consequence canonique (constat C-P3-9, 1 cas sur 60 mesure).
  'A-03': 'mileage',
  'A-04': 'mileage',
  'A-04b': 'mileage',
  'A-05': 'mileage',
  // DR3-02 : A-17 (unite `mi`) rend le kilometrage INCONNU des l'ingestion (`UNIT_UNSUPPORTED`,
  // EX-DATA-5). Cumulee a A-03 ou A-04, elle EFFACE leur consequence canonique : le rythme annuel
  // n'est plus calculable et aucun signalement ne tombe. Meme famille, donc jamais cumulees.
  'A-17': 'mileage',
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
    if (a.id === 'A-04') out.maxAgeMonths = A04_MAX_AGE_MONTHS;
    if (a.id === 'A-11') out.pinModel = true;
  }
  return out;
}

/**
 * Applique les anomalies a une annonce et produit ses entrees de verite terrain.
 * @returns {object[]} entrees `groundTruth` (sans `listingId`, ajoute par l'appelant)
 */
export function applyAnomalies(listing, slotAnoms, ctx, seed, cellCount, stats) {
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
        // DR3-18 : `EX-DATA-32` est NORMATIF et l'adaptateur le suit deja - un montant servi AVEC le
        // drapeau « sur demande » donne le statut canonique QUOTED plus le drapeau
        // `PRICE_ON_REQUEST_WITH_AMOUNT`, jamais ON_REQUEST. Le manifest annoncait l'inverse : il
        // attendait de l'ingestion une chose que le dictionnaire lui interdit (constat C-P3-8).
        out.push({
          anomaly: 'PRICE_ON_REQUEST_WITH_AMOUNT',
          expected: { status: 'QUOTED', flag: 'PRICE_ON_REQUEST_WITH_AMOUNT', amount: listing.displayPrice },
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
        // DR3-08 - M1 SE MESURE DANS LA CELLULE, PAS EN EUROS ABSOLUS.
        //
        // L'ancienne injection basse tirait 260-480 EUR « pour ne jamais descendre sous la
        // sentinelle absolue de 250 EUR ». Ce garde-fou etait INOPERANT : `EX-DATA-19(2)` retire de
        // `V_price(C)` tout prix sous `0,10 x medianeRef(C)`, soit 1 595 EUR dans une cellule a
        // 15 950 EUR. 32 des 50 M1 injectes tombaient dans cette tranche, portaient
        // `PRICE_IMPLAUSIBLE_IN_CELL` et n'etaient JAMAIS evalues : rappel mesure 36 % pour 90 %
        // annonces. La valeur est desormais choisie dans la fenetre ou M1 peut la voir :
        //   plancher  = 1,10 x seuil relatif de la cellule (au-dessus, donc dans `V_price`) ;
        //   plafond   = 0,70 x barriere basse de Tukey     (en dessous, donc SIGNALEE).
        // La marge de 30 % sous la barriere absorbe le deplacement des quantiles que l'injection
        // elle-meme provoque dans une cellule de douze annonces.
        const fair = listing.displayPrice;
        const cell = m1CellFor(stats, listing);
        // On ne contraint que par les cellules `C1` et `C2` : `C3 = Sigma` n'est retenue par le
        // moteur qu'a defaut des deux autres, et son seuil relatif (0,10 x mediane globale) y est
        // PLUS HAUT que sa propre barriere basse - aucune valeur basse n'y est signalable.
        const bounded = cell.candidates.filter((c) => c.scope !== 'SELECTION');
        let high = u(3) < 0.5;
        let injected = null;
        if (!high && bounded.length > 0) {
          const floor = Math.max(260, ...bounded.map((c) => 1.1 * (c.threshold ?? 0)));
          const ceil = 0.7 * Math.min(...bounded.map((c) => c.lowFence));
          if (floor < ceil) injected = Math.round(floor + (0.15 + u(4) * 0.7) * (ceil - floor));
        }
        if (injected === null) high = true;
        if (high) {
          const fence = Math.max(fair, ...cell.candidates.map((c) => c.highFence));
          injected = Math.min(4900000, Math.round(fence * (1.6 + u(4) * 1.4)));
        }
        listing.displayPrice = injected;
        out.push({
          anomaly: high ? 'OUTLIER_M1_HIGH' : 'OUTLIER_M1_LOW',
          expected: {
            method: 'M1',
            injected: listing.displayPrice,
            fair,
            factor: Math.round((listing.displayPrice / fair) * 1000) / 1000,
            cellMedian: cell.chosen === null ? null : Math.round(cell.chosen.median),
            cellN: cell.chosen === null ? 0 : cell.chosen.n,
          },
        });
        break;
      }
      case 'A-11': {
        // DR3-09 - LE SIGMA DU MODELE DE PRIX N'EST PAS CELUI QUE M2 MESURE.
        //
        // Les facteurs 0,30-0,50 et 2,0-3,2 etaient calibres sur `sigma_p = 0,20`, le residu du
        // MODELE DE PRIX du generateur. M2 (`EX-DATA-90/92`) regresse `ln(prix) ~ annee + km` dans
        // la cellule `(marque, modele)`, ou subsistent les variances de carburant, de puissance et
        // de type de vendeur : l'ecart robuste `s` y est nettement superieur a 0,20, et un facteur
        // 2,0 ne franchit pas `|z| >= 2,5`. Rappel mesure 51 % pour 85 % annonces, 25 injectes
        // evalues et NON signales.
        //
        // Le generateur mesure desormais `s` par le MEME calcul que le moteur (`cells.mjs`, gele au
        // premier snapshot) et place la valeur a `k = 3,4` ecarts robustes du prix ATTENDU par la
        // regression de la cellule : `z` vaut alors +/- 3,4 par construction, pour un seuil a 2,5 -
        // 36 % de marge, qui couvre le deplacement de `m_r` et de la MAD provoque par l'injection.
        const fair = listing.displayPrice;
        const key = `${listing.makeId}|${listing.modelId}`;
        const fit = stats?.fitC2.get(key);
        const sample = stats?.sampleC2.get(key);
        const s = fit !== undefined && fit.ok ? fit.s : 0.2;
        const expectedPrice = fit !== undefined && fit.ok ? fit.expectedFor(listing.year, listing.mileage) : fair;
        let high = u(5) < 0.5;
        let injected = Math.round(expectedPrice * Math.exp((high ? 1 : -1) * M2_INJECTION_K * s));
        // Rester DANS `V_price(C2)` : sous `0,10 x medianeRef`, l'annonce serait ecartee de la
        // cellule et M2 ne l'evaluerait pas davantage que M1.
        const floor = Math.max(260, 1.1 * (sample?.threshold ?? 0));
        if (!high && injected < floor) {
          high = true;
          injected = Math.round(expectedPrice * Math.exp(M2_INJECTION_K * s));
        }
        injected = Math.min(4900000, Math.max(260, injected));
        listing.displayPrice = injected;
        out.push({
          anomaly: high ? 'OUTLIER_M2_HIGH' : 'OUTLIER_M2_LOW',
          expected: {
            method: 'M2',
            injected: listing.displayPrice,
            fair,
            factor: Math.round((listing.displayPrice / fair) * 1000) / 1000,
            robustSigma: Math.round(s * 1000) / 1000,
            zTarget: high ? M2_INJECTION_K : -M2_INJECTION_K,
            cell: cellCount.get(key) ?? 0,
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
        // DR3-02 - UNE SEULE FORME, PARCE QU'UNE SEULE EST DETECTABLE.
        //
        // La forme (b) (« kilometrage trop faible pour l'age ») n'a AUCUNE consequence canonique :
        // la contrainte 22 ne borne que le HAUT du rythme annuel, et aucun drapeau d'`EX-DATA-45`
        // ne nomme le cas inverse. Elle etait declaree au manifest sans etre retrouvable - meme
        // classe que les drapeaux inatteignables de D3-16. Elle est RETIREE : A-04 n'emet plus que
        // la forme (a), et son effectif entier est detectable.
        //
        // Le rythme est plafonne pour que le kilometrage reste SOUS la borne dure du champ
        // (1 450 000 km < 1 500 000, #59) : au-dela, l'adaptateur rendrait le kilometrage INCONNU
        // et poserait `MILEAGE_OUT_OF_RANGE` a la place du signalement attendu. Le vivier est borne
        // a 72 mois d'age (voir `A04_MAX_AGE_MONTHS`) pour que les deux bornes soient conciliables.
        const fair = listing.mileage;
        const months = ageMonthsOf(listing);
        const perYearCap = (A04_MILEAGE_CAP * 12) / months;
        const perYear = Math.min(260000 + u(8) * 100000, perYearCap);
        listing.mileage = Math.min(A04_MILEAGE_CAP, Math.round(((months / 12) * perYear) / 100) * 100);
        out.push({
          anomaly: 'MILEAGE_IMPLAUSIBLE_FOR_AGE',
          detail: 'forme (a) rythme annuel hors borne',
          expected: {
            fair,
            injected: listing.mileage,
            form: 'a',
            ageMonths: months,
            perYearKm: Math.round((listing.mileage * 12) / months),
          },
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
        // DR3-18 : `detail` est la SEULE facon de separer les deux situations que DATA-MODEL §3.1
        // distingue ; ses deux valeurs sont normees par `anomalies.json:detailNorme`.
        out.push({ anomaly: 'REGION_UNRESOLVED', detail: 'pays hors marche', expected: { fair, injected: listing.countryCode, flagExpected: false } });
        break;
      }
      case 'A-21': {
        const fair = listing.prefix;
        listing.prefix = `0${Math.floor(u(20) * 10)}`;
        out.push({ anomaly: 'REGION_UNRESOLVED', detail: 'prefixe postal non resolu', expected: { fair, injected: listing.prefix, flagExpected: true } });
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
