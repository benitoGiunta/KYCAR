#!/usr/bin/env node
/**
 * KYCAR - `npm run data:check` : autocontrole du generateur (ce n'est PAS la revue)
 * =================================================================================================
 *   npm run data:check -- --profile dev|test|perf [--out data/fixtures]
 *
 * Rejoue un SOUS-ENSEMBLE des sondes `P-nn` de `docs/data/dataset-spec/probes.json` - les plus
 * structurantes : volumes, ordre du fichier, marques, fenetres de production, ages, carburants,
 * kilometrage, prix, TVA, vendeurs, geographie, branches de mesure, dynamique inter-snapshots,
 * anomalies et verite terrain, forme du fichier. Les tolerances sont celles de la specification, pas
 * celles du generateur.
 *
 * Cette commande est la PORTE DU GENERATEUR, pas la revue : `data-review` (phase 3.3) ecrit les 110
 * sondes d'apres `probes.json` et les fait passer SANS LES MODIFIER (D-31/D-32). Un ecart signale ici
 * est un ecart que le reviewer retrouvera ; l'absence d'ecart ici ne prejuge pas des 80 autres.
 */

import { generateProfile } from './snapshot.mjs';
import { loadTables } from './tables.mjs';
import { parseArgs as parseValidateArgs, readProfile } from './validate.mjs';

const median = (a) => {
  if (a.length === 0) return NaN;
  const s = a.slice().sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const pearson = (xs, ys) => {
  const n = xs.length;
  if (n < 2) return NaN;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i += 1) {
    sx += xs[i];
    sy += ys[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  return num / Math.sqrt(dx * dy);
};

const price = (o) => o.prices?.public?.price;
const yearOf = (o) => (o.firstRegistrationDate ? Number(o.firstRegistrationDate.slice(0, 4)) : null);

export function runCheck(opts) {
  const tables = loadTables();
  const snaps = readProfile(opts.out, opts.profile);
  const profile = tables.profiles.profiles.find((p) => p.name === opts.profile);
  const N = profile.listingsPerSnapshot;
  const capturedYear = new Date(tables.profiles.snapshots[0].observedAt).getUTCFullYear();
  const rows = [];
  // Trois etats : OK, ECART (defaut du generateur) et DETTE (ecart a la specification deja tranche
  // et consigne dans DATASET-GEN.md §6 ; il est AFFICHE, jamais masque, mais ne ferme pas la porte).
  const add = (id, label, value, ok, debt) => rows.push({ id, label, value, ok, debt: ok ? null : (debt ?? null) });

  const parsed = snaps.map((s) => s.lines.map((l) => JSON.parse(l)));
  const s0 = parsed[0];

  /* ---- P-03 / S1 : le fichier livre est-il celui que la graine du manifest reproduit ? ------------- */
  if (!opts.noRegen) {
    const regen = generateProfile(tables, opts.profile, snaps[0].manifest.seed);
    const same = regen.results.every((r, i) => r.ser.sha256 === snaps[i].manifest.sha256);
    add('P-03', 'regeneration a graine egale : memes octets NDJSON', same ? 'sha256 identiques' : 'DIVERGENT', same);
    const gzSame = regen.results.every((r, i) => r.ser.sha256Gz === snaps[i].manifest.sha256Gz);
    add('P-03b', 'regeneration a graine egale : memes octets gz', gzSame ? 'sha256Gz identiques' : 'DIVERGENT', gzSame);
  }

  /* ---- Volumes, ordre, forme --------------------------------------------------------------------- */
  add('P-01', 'effectif de chaque snapshot', parsed.map((p) => p.length).join('/'), parsed.every((p) => p.length === N));
  add('P-02', 'nombre de snapshots', String(snaps.length), snaps.length === 3);
  const totalGz = snaps.reduce((a, s) => a + s.gz.length, 0);
  add('P-05', `taille gz totale / budget`, `${(totalGz / 1048576).toFixed(3)} / ${(profile.sizeBudgetGzBytes / 1048576).toFixed(0)} Mio`, totalGz <= profile.sizeBudgetGzBytes);
  let ordered = true;
  for (let i = 1; i < s0.length; i += 1) {
    const a = s0[i - 1];
    const b = s0[i];
    const k = (o) => [o.make, o.model ?? 0, o.firstRegistrationDate ?? '', o.id];
    const ka = k(a);
    const kb = k(b);
    for (let d = 0; d < 4; d += 1) {
      if (ka[d] === kb[d]) continue;
      if (ka[d] > kb[d]) ordered = false;
      break;
    }
  }
  add('P-06', 'ordre (make, model, 1re immat., id)', ordered ? 'croissant' : 'INVERSION', ordered);
  // L'ordre de reference est celui des `properties` du schema source : chaque ligne doit en etre une
  // SOUS-SUITE croissante (une cle absente ne casse pas l'ordre).
  const refOrder = Object.keys(tables.listingSchema.properties);
  const orderOk = s0.every((o) => {
    let p = -1;
    for (const x of Object.keys(o)) {
      const i = refOrder.indexOf(x);
      if (i < 0 || i <= p) return false;
      p = i;
    }
    return true;
  });
  add('P-103', 'ordre des cles identique sur toutes les lignes', orderOk ? 'stable' : 'DIVERGENT', orderOk);
  const dupIds = new Map();
  for (const o of s0) dupIds.set(o.id, (dupIds.get(o.id) ?? 0) + 1);
  const declaredDup = new Set(snaps[0].manifest.groundTruth.filter((g) => g.anomaly === 'DUPLICATE_LISTING_ID').map((g) => g.listingId));
  const undeclared = [...dupIds].filter(([id, n]) => n > 1 && !declaredDup.has(id)).length;
  add('P-104', 'unicite des id hors doublons declares', `${undeclared} non declare(s)`, undeclared === 0);
  const deep = s0.every((o) => o.webPage.includes(o.id) && o.webPage.startsWith('https://www.autoscout24.be/'));
  add('P-105', 'webPage contient l id et l hote du marche', deep ? '100 %' : 'ECART', deep);
  const contact = /(\+?\d[\d .]{7,})|@|https?:\/\//;
  const textBad = s0.filter((o) => o.modelVersion && contact.test(o.modelVersion)).length;
  add('P-107', 'aucun contact ni URL dans modelVersion', `${textBad} occurrence(s)`, textBad === 0);

  /* ---- Marques et modeles ------------------------------------------------------------------------ */
  const makeCount = new Map();
  for (const o of s0) makeCount.set(o.make, (makeCount.get(o.make) ?? 0) + 1);
  add('P-07', 'marques distinctes', String(makeCount.size), makeCount.size >= profile.minDistinctMakes);
  let worst = 0;
  for (const m of tables.makes.makes.filter((x) => x.class === 'NOMMEE')) {
    const expected = Math.round((N * m.sharePct) / 100);
    worst = Math.max(worst, Math.abs((makeCount.get(m.makeId) ?? 0) - expected));
  }
  add('P-08', 'ecart max a l apportionnement (marques nommees)', `${worst}`, worst <= 1);
  const curated = new Map(tables.models.models.map((m) => [`${m.makeId}|${m.modelId}`, m]));
  const curatedShare = s0.filter((o) => o.model !== undefined && curated.has(`${o.make}|${o.model}`)).length / N;
  add('P-110', 'part des annonces sur un modele curate', `${(curatedShare * 100).toFixed(1)} %`, curatedShare >= 0.65);
  // P-12 exclut les lignes DECLAREES FIRST_REG_OUT_OF_RANGE, exactement comme P-87 : une date hors
  // bornes est hors de toute fenetre de production par construction (DATASET-GEN.md §6, note EG-08).
  const declaredFirstReg = new Set(
    snaps[0].manifest.groundTruth.filter((g) => g.anomaly === 'FIRST_REG_OUT_OF_RANGE').map((g) => g.listingId),
  );
  let windowViolations = 0;
  for (const o of s0) {
    if (o.model === undefined || declaredFirstReg.has(o.id)) continue;
    const m = curated.get(`${o.make}|${o.model}`);
    const y = yearOf(o);
    if (!m || y === null) continue;
    if (y < m.yearFrom || y > m.yearTo + 1) windowViolations += 1;
  }
  add('P-12', 'annonces hors fenetre de production', String(windowViolations), windowViolations === 0);

  /* ---- Age, carburant, kilometrage --------------------------------------------------------------- */
  const ages = s0.map(yearOf).filter((y) => y !== null && y >= 1900 && y <= capturedYear).map((y) => capturedYear - y);
  const medAge = median(ages);
  add('P-13', 'mediane de l age', `${medAge} ans`, medAge >= 6 && medAge <= 9);
  const fuelCount = new Map();
  for (const o of s0) if (o.fuelCategory) fuelCount.set(o.fuelCategory, (fuelCount.get(o.fuelCategory) ?? 0) + 1);
  const totalFuel = [...fuelCount.values()].reduce((a, b) => a + b, 0);
  const share = (c) => (fuelCount.get(c) ?? 0) / totalFuel;
  const hyb = share('2') + share('3');
  add('P-16', 'mix carburant B / D / hybrides / E',
    `${(share('B') * 100).toFixed(1)} / ${(share('D') * 100).toFixed(1)} / ${(hyb * 100).toFixed(1)} / ${(share('E') * 100).toFixed(1)} %`,
    share('B') >= 0.52 && share('B') <= 0.59 && share('D') >= 0.23 && share('D') <= 0.29 && hyb >= 0.11 && hyb <= 0.16 && share('E') >= 0.035 && share('E') <= 0.058);
  const dieselOf = (y) => {
    const sub = s0.filter((o) => yearOf(o) === y && o.fuelCategory);
    return sub.length === 0 ? NaN : sub.filter((o) => o.fuelCategory === 'D').length / sub.length;
  };
  const d2015 = dieselOf(2015);
  add('P-17', 'part diesel des 1res immat. 2015', `${(d2015 * 100).toFixed(1)} %`, d2015 >= 0.4 && d2015 <= 0.5);
  const e2024 = (() => {
    const sub = s0.filter((o) => yearOf(o) === 2024 && o.fuelCategory);
    return sub.filter((o) => o.fuelCategory === 'E').length / sub.length;
  })();
  add('P-19', 'part electrique des 1res immat. 2024', `${(e2024 * 100).toFixed(1)} %`, e2024 >= 0.19 && e2024 <= 0.27);
  const manualElectric = s0.filter((o) => o.fuelCategory === 'E' && o.transmission === 'M').length;
  add('P-26', 'electriques a boite manuelle', String(manualElectric), manualElectric === 0);
  const km5 = s0.filter((o) => capturedYear - (yearOf(o) ?? 0) === 5 && o.mileage !== undefined && o.mileageUnit === 'km').map((o) => o.mileage);
  const medKm5 = median(km5);
  add('P-28', 'mediane du kilometrage a 5 ans', `${medKm5}`, medKm5 >= 66000 && medKm5 <= 84000);
  const notRound = s0.filter((o) => o.mileage !== undefined && o.mileage % 100 !== 0).length;
  add('P-30', 'kilometrages multiples de 100', `${notRound} ecart(s)`, notRound === 0);

  /* ---- Prix ---------------------------------------------------------------------------------------- */
  const priced = s0.filter((o) => price(o) !== undefined);
  const sentinels = new Set(snaps[0].manifest.groundTruth.filter((g) => ['PRICE_SENTINEL_ABSOLUTE', 'PRICE_OUT_OF_RANGE', 'OUTLIER_M1_LOW', 'OUTLIER_M1_HIGH', 'OUTLIER_M2_LOW', 'OUTLIER_M2_HIGH'].includes(g.anomaly)).map((g) => g.listingId));
  const clean = priced.filter((o) => !sentinels.has(o.id));
  const medPrice = median(clean.map(price));
  add('P-31', 'mediane des prix affiches', `${medPrice} EUR`, medPrice >= 13500 && medPrice <= 18500);
  const withAge = clean.filter((o) => yearOf(o) !== null);
  const corr = pearson(withAge.map((o) => Math.log(price(o))), withAge.map((o) => capturedYear - yearOf(o)));
  add('P-33', 'correlation ln(prix) / age', corr.toFixed(3), corr < -0.65);
  const endings = new Set([990, 950, 900, 500, 0]);
  const roundShare = clean.filter((o) => endings.has(price(o) % 1000)).length / clean.length;
  add('P-39', 'part des terminaisons commerciales', `${(roundShare * 100).toFixed(1)} %`, roundShare >= 0.7 && roundShare <= 0.88);
  const onRequest = s0.filter((o) => o.prices?.public?.onRequestOnly === true).length / N;
  add('P-40', 'part ON_REQUEST', `${(onRequest * 100).toFixed(2)} %`, onRequest >= 0.02 && onRequest <= 0.05);
  const vatPrivate = s0.filter((o) => o.seller.type === 'P' && o.prices?.public?.isTaxDeductible !== undefined).length;
  add('P-42', 'TVA renseignee chez un particulier', String(vatPrivate), vatPrivate === 0);
  const netBad = s0.filter((o) => {
    const p = o.prices?.public;
    if (!p) return false;
    const hasNet = p.netPrice !== undefined;
    if (hasNet !== (p.isTaxDeductible === true && p.price !== undefined)) return true;
    return hasNet && !(p.netPrice < p.price && Math.abs(p.netPrice - Math.round(p.price / 1.21)) <= 1);
  }).length;
  add('P-44', 'netPrice present ssi TVA deductible, = round(prix/1,21)', `${netBad} ecart(s)`, netBad === 0);
  const pricedShare = priced.length / N;
  add('P-92', 'part d annonces a prix affiche', `${(pricedShare * 100).toFixed(1)} %`, pricedShare >= 0.8);

  /* ---- Vendeurs, publicite, geographie ------------------------------------------------------------ */
  const proShare = s0.filter((o) => o.seller.type === 'D').length / N;
  add('P-46', 'part de vendeurs professionnels', `${(proShare * 100).toFixed(1)} %`, proShare >= 0.67 && proShare <= 0.73);
  const bucketBad = s0.filter((o) => (o.seller.dealerBucket !== undefined) !== (o.seller.type === 'D')).length;
  add('P-47', 'dealerBucket present ssi vendeur professionnel', `${bucketBad} ecart(s)`, bucketBad === 0);
  const bucketSize = new Map();
  for (const o of s0) if (o.seller.dealerBucket) bucketSize.set(o.seller.dealerBucket, (bucketSize.get(o.seller.dealerBucket) ?? 0) + 1);
  const minBucket = Math.min(...bucketSize.values());
  add('P-93', 'effectif minimal d un dealerBucket', `${minBucket} (${bucketSize.size} buckets)`, minBucket >= 3);
  const tierShare = s0.filter((o) => o.adProduct?.tier !== undefined).length / N;
  add('P-50', 'part d annonces a palier publicitaire', `${(tierShare * 100).toFixed(1)} %`, tierShare < 0.3 && tierShare >= 0.14 && tierShare <= 0.24);
  const prefixTable = new Map(tables.geography.prefixes.map((p) => [p.prefix, p.nuts2]));
  const regionByNuts = new Map(tables.geography.provinces.map((p) => [p.nuts2, p.region]));
  const regions = { VLG: 0, WAL: 0, BRU: 0 };
  let outOfTable = 0;
  for (const o of s0) {
    const p = o.location.postalCodePrefix2;
    if (p === undefined) continue;
    const n = prefixTable.get(p);
    if (!n) {
      outOfTable += 1;
      continue;
    }
    regions[regionByNuts.get(n)] += 1;
  }
  const totalRegion = regions.VLG + regions.WAL + regions.BRU;
  const pct = (v) => (v / totalRegion) * 100;
  add('P-51', 'repartition Flandre / Wallonie / Bruxelles',
    `${pct(regions.VLG).toFixed(1)} / ${pct(regions.WAL).toFixed(1)} / ${pct(regions.BRU).toFixed(1)} %`,
    Math.abs(pct(regions.VLG) - 55) <= 2 && Math.abs(pct(regions.WAL) - 37) <= 2 && Math.abs(pct(regions.BRU) - 8) <= 2);
  const unresolvedDeclared = new Set(snaps[0].manifest.groundTruth.filter((g) => g.anomaly === 'REGION_UNRESOLVED').map((g) => g.listingId));
  const outOfTableUndeclared = s0.filter((o) => {
    const p = o.location.postalCodePrefix2;
    return p !== undefined && !prefixTable.has(p) && !unresolvedDeclared.has(o.id);
  }).length;
  add('P-52', 'prefixes hors table non declares', `${outOfTableUndeclared} (dont ${outOfTable} declares 00-09)`, outOfTableUndeclared === 0);

  /* ---- Absences structurelles et branches de mesure ------------------------------------------------ */
  const structural = s0.filter((o) => {
    const elec = o.fuelCategory === 'E' || o.fuelCategory === '2' || o.fuelCategory === '3';
    if (!elec && (o.electricRange !== undefined || o.battery !== undefined)) return true;
    if (o.fuelCategory === 'E' && (o.cylinderCapacity !== undefined || o.cylinderCount !== undefined)) return true;
    if (o.seller.type === 'P' && (o.prices?.public?.isTaxDeductible !== undefined || o.seller.dealerBucket !== undefined || o.adProduct !== undefined || o.appliedSeals !== undefined || o.warranty !== undefined)) return true;
    return false;
  }).length;
  add('P-59', 'absences structurelles respectees', `${structural} ecart(s)`, structural === 0);
  let branchBad = 0;
  for (const o of s0) {
    const y = o.firstRegistrationDate;
    const hasWltp = o.wltp !== undefined;
    const hasNedc = o.co2Emissions !== undefined || o.consumption !== undefined || o.efficiencyClass !== undefined;
    if (hasWltp && hasNedc) branchBad += 1;
    else if (y && y >= '2018-09' && hasNedc) branchBad += 1;
    else if (y && y < '2018-09' && hasWltp) branchBad += 1;
  }
  add('P-61/P-96', 'exclusion des branches de mesure WLTP / NEDC', `${branchBad} ecart(s)`, branchBad === 0);
  const noBranch = s0.filter((o) => o.wltp === undefined && o.co2Emissions === undefined && o.consumption === undefined && o.efficiencyClass === undefined).length / N;
  add('P-62', 'part d annonces sans branche de mesure', `${(noBranch * 100).toFixed(1)} %`, noBranch >= 0.1 && noBranch <= 0.2);
  const classBad = s0.filter((o) => (o.wltp?.co2Class !== undefined && o.wltp === undefined) || (o.efficiencyClass !== undefined && o.wltp !== undefined)).length;
  add('P-99', 'co2Class en WLTP, efficiencyClass en NEDC', `${classBad} ecart(s)`, classBad === 0);
  const declaredMileage = new Set(snaps[0].manifest.groundTruth.filter((g) => g.anomaly === 'MILEAGE_IMPLAUSIBLE_FOR_AGE' || g.anomaly === 'MILEAGE_OUT_OF_RANGE').map((g) => g.listingId));
  let kmBad = 0;
  for (const o of s0) {
    if (o.mileage === undefined || declaredMileage.has(o.id)) continue;
    const y = yearOf(o);
    if (y === null) continue;
    const months = Math.max((capturedYear - y) * 12, 6);
    if ((o.mileage * 12) / months > 200000) kmBad += 1;
  }
  add('P-100', 'plausibilite km/an hors anomalie declaree', `${kmBad} ecart(s)`, kmBad === 0);

  /* ---- Densite de cellules ------------------------------------------------------------------------- */
  const cellYear = new Map();
  const cellModel = new Map();
  for (const o of priced) {
    if (o.model === undefined || !o.firstRegistrationDate) continue;
    const ky = `${o.make}|${o.model}|${o.firstRegistrationDate.slice(0, 4)}`;
    cellYear.set(ky, (cellYear.get(ky) ?? 0) + 1);
    const km = `${o.make}|${o.model}`;
    cellModel.set(km, (cellModel.get(km) ?? 0) + 1);
  }
  const n12 = [...cellYear.values()].filter((v) => v >= 12).length;
  const n30 = [...cellModel.values()].filter((v) => v >= 30).length;
  add('P-78', 'cellules (marque, modele, annee) a n >= 12', String(n12), n12 >= profile.minCellsModelYearN12);
  add('P-79', 'cellules (marque, modele) a n >= 30', String(n30), n30 >= profile.minCellsModelN30);

  /* ---- Dynamique inter-snapshots -------------------------------------------------------------------- */
  const idSets = parsed.map((p) => new Set(p.map((o) => o.id)));
  const exitRates = [];
  for (let k = 1; k < parsed.length; k += 1) {
    const gone = [...idSets[k - 1]].filter((id) => !idSets[k].has(id)).length;
    exitRates.push(gone / idSets[k - 1].size);
  }
  add('P-65', 'taux de sortie entre snapshots', exitRates.map((r) => `${(r * 100).toFixed(1)} %`).join(' / '), exitRates.every((r) => r >= 0.08 && r <= 0.12));
  let makeStable = true;
  const counts0 = new Map();
  for (const o of parsed[0]) counts0.set(o.make, (counts0.get(o.make) ?? 0) + 1);
  for (let k = 1; k < parsed.length; k += 1) {
    const c = new Map();
    for (const o of parsed[k]) c.set(o.make, (c.get(o.make) ?? 0) + 1);
    for (const [m, v] of counts0) if ((c.get(m) ?? 0) !== v) makeStable = false;
  }
  add('P-66', 'effectif par marque identique sur les 3 snapshots', makeStable ? 'identique' : 'DERIVE', makeStable);
  const byId0 = new Map(parsed[0].map((o) => [o.id, o]));
  let mutated = 0;
  for (const o of parsed[1]) {
    const prev = byId0.get(o.id);
    if (!prev) continue;
    // Une annonce revisee est hors du perimetre de P-70 ; P-68, ci-dessous, la compte a part.
    if (o.lastUpdatedAt !== prev.lastUpdatedAt) continue;
    const a = { ...o, publication: { ...o.publication, isNew: false } };
    const b = { ...prev, publication: { ...prev.publication, isNew: false } };
    if (JSON.stringify(a) !== JSON.stringify(b)) mutated += 1;
  }
  add('P-70', 'survivantes non revisees identiques champ a champ', `${mutated} ecart(s)`, mutated === 0);
  // DR3-06 - LE CONTROLE P-68 NE PROUVAIT RIEN. Il passait `true` en dur (aucune tolerance evaluee)
  // et comptait « prix OU images ». La revue a mesure 10,2 % de prix affiches reellement modifies
  // pour une tolerance de [14 %, 20 %] : le controle etait aveugle a un ecart de quatre points.
  // Il mesure desormais ce que la sonde mesure - la part de survivantes dont le PRIX AFFICHE change
  // entre deux snapshots, et la part de ces changements qui sont des baisses - avec les tolerances
  // de la specification.
  const revisionShare = (a, b) => {
    const before = new Map(a.map((o) => [o.id, o]));
    let survivors = 0;
    let changed = 0;
    let down = 0;
    for (const o of b) {
      const prev = before.get(o.id);
      if (!prev) continue;
      survivors += 1;
      const p0 = price(prev);
      const p1 = price(o);
      if (p0 === undefined || p1 === undefined || p0 === p1) continue;
      changed += 1;
      if (p1 < p0) down += 1;
    }
    return { share: changed / survivors, down: changed === 0 ? NaN : down / changed, changed, survivors };
  };
  const rev = [revisionShare(parsed[0], parsed[1]), revisionShare(parsed[1], parsed[2])];
  const revOk = rev.every((r) => r.share >= 0.14 && r.share <= 0.2 && r.down >= 0.8 && r.down <= 0.88);
  add(
    'P-68',
    'part de survivantes dont le PRIX AFFICHE change, et part a la baisse',
    rev.map((r) => `${(r.share * 100).toFixed(2)} % (${r.changed}/${r.survivors}) dont ${(r.down * 100).toFixed(1)} % a la baisse`).join(' | '),
    revOk,
  );
  // DR3-07 : la mediane de prix doit RECULER entre le premier et le dernier snapshot (au plus 3 %).
  const medOf = (objs) => median(objs.map(price).filter((p) => p !== undefined));
  const med0 = medOf(parsed[0]);
  const medLast = medOf(parsed[parsed.length - 1]);
  const drop = 1 - medLast / med0;
  add('P-69', 'derive de la mediane de prix S0 -> S2', `${med0} -> ${medLast} EUR (${(-drop * 100).toFixed(2)} %)`, drop >= 0 && drop <= 0.03);
  let kmChanged = 0;
  for (const o of parsed[1]) {
    const prev = byId0.get(o.id);
    if (prev && prev.mileage !== o.mileage) kmChanged += 1;
  }
  add('P-71', 'kilometrage inchange entre snapshots', `${kmChanged} changement(s)`, kmChanged === 0);

  /* ---- Anomalies et verite terrain ------------------------------------------------------------------ */
  const gtByCode = new Map();
  for (const g of snaps[0].manifest.groundTruth) gtByCode.set(g.anomaly, (gtByCode.get(g.anomaly) ?? 0) + 1);
  const anomalyRows = [];
  let anomalyOk = true;
  // DR3-10 - LA BASE DECLAREE, PAS N. Le controle prenait `N` pour denominateur de TOUS les taux,
  // exactement comme le generateur : il ne pouvait donc pas voir que cinq anomalies etaient hors
  // tolerance sur la base qu'`anomalies.json` declare (jusqu'a +3 189 % pour A-20). Les effectifs de
  // base sont recomptes ici sur les lignes LIVREES, indépendamment du generateur.
  const THERMAL = new Set(['B', 'D', '2', '3', 'L', 'C', 'M', 'O']);
  const statusOf = (o) => (o.prices?.public?.onRequestOnly === true ? 'ON_REQUEST' : price(o) !== undefined ? 'QUOTED' : 'MISSING');
  const baseCounts = {
    total: s0.length,
    pro: s0.filter((o) => o.seller?.type === 'D').length,
    usedOffer: s0.filter((o) => ['U', 'J', 'O'].includes(o.offerType)).length,
    thermal: s0.filter((o) => o.fuelCategory !== undefined && THERMAL.has(o.fuelCategory)).length,
    hybrid: s0.filter((o) => o.fuelCategory === '2' || o.fuelCategory === '3').length,
    withPowerHp: s0.filter((o) => o.powerHp !== undefined).length,
    quoted: s0.filter((o) => statusOf(o) === 'QUOTED').length,
    onRequest: s0.filter((o) => statusOf(o) === 'ON_REQUEST').length,
  };
  const baseOf = (b) => {
    if (b.startsWith('annonces a prix affiche')) return baseCounts.quoted;
    if (b === 'annonces professionnelles') return baseCounts.pro;
    if (b === "annonces d'offerType U, J ou O") return baseCounts.usedOffer;
    if (b === 'annonces thermiques') return baseCounts.thermal;
    if (b === 'annonces hybrides') return baseCounts.hybrid;
    if (b === 'annonces portant powerHp') return baseCounts.withPowerHp;
    if (b === 'annonces a prix sur demande') return baseCounts.onRequest;
    return baseCounts.total;
  };
  for (const a of tables.anomalies.anomalies) {
    if (a.rate <= 0) continue;
    const target = a.rate * baseOf(a.base);
    const codes = a.anomalyCode.split('/').map((c) => c.trim()).filter((c) => c !== '(sans objet)');
    const got = codes.reduce((acc, c) => acc + (gtByCode.get(c) ?? 0), 0);
    const shared = codes.some((c) => tables.anomalies.anomalies.filter((x) => x.anomalyCode.includes(c)).length > 1);
    const ok = shared ? got >= Math.floor(target) : Math.abs(got - target) <= Math.max(1, target * 0.2);
    if (!ok) anomalyOk = false;
    anomalyRows.push(`${a.id}:${got}/${target.toFixed(1)}@${baseOf(a.base)}`);
  }
  add('P-72', 'effectifs par anomalie (realise / attendu SUR SA BASE @ effectif de base)', anomalyRows.join(' '), anomalyOk);
  const ids0 = idSets[0];
  const orphan = snaps[0].manifest.groundTruth.filter((g) => !ids0.has(g.listingId)).length;
  add('P-73', 'verite terrain rattachee a une ligne du snapshot', `${orphan} orpheline(s)`, orphan === 0);
  const pricedAnomalies = ['PRICE_ON_REQUEST', 'PRICE_MISSING_UNDECLARED', 'PRICE_ON_REQUEST_WITH_AMOUNT', 'PRICE_SENTINEL_ABSOLUTE', 'PRICE_OUT_OF_RANGE', 'OUTLIER_M1_LOW', 'OUTLIER_M1_HIGH', 'OUTLIER_M2_LOW', 'OUTLIER_M2_HIGH'];
  const perListing = new Map();
  for (const g of snaps[0].manifest.groundTruth) {
    if (!pricedAnomalies.includes(g.anomaly)) continue;
    perListing.set(g.listingId, (perListing.get(g.listingId) ?? 0) + 1);
  }
  const twoPrice = [...perListing.values()].filter((v) => v > 1).length;
  add('P-74', 'exclusion mutuelle des anomalies de prix', `${twoPrice} annonce(s) a deux`, twoPrice === 0);
  const forbidden = snaps[0].manifest.groundTruth.filter((g) => g.anomaly === 'FIRST_REG_UNPARSEABLE' || g.anomaly === 'MARKETPLACE_UNMAPPED').length;
  add('P-101', 'codes inatteignables absents du manifest', `${forbidden}`, forbidden === 0);
  const crossBad = snaps[0].manifest.groundTruth.filter((g) => g.anomaly === 'CROSS_SELLER_DUPLICATE' && g.expected && g.expected.dealerBucket === g.expected.peerDealerBucket).length;
  add('P-93b', 'doublons inter-vendeurs a buckets differents', `${crossBad} ecart(s)`, crossBad === 0);

  /* ---- Composition : modeles, segments, boite, couleurs, etat ------------------------------------- */
  const modelIdOf = (makeSlug, modelSlug) => {
    const m = tables.models.models.find((x) => x.makeSlug === makeSlug && x.modelSlug === modelSlug);
    return m ? m.modelId : -1;
  };
  const countModel = (makeSlug, modelSlug) => s0.filter((o) => o.model === modelIdOf(makeSlug, modelSlug)).length;
  const golf = countModel('volkswagen', 'golf');
  const polo = countModel('volkswagen', 'polo');
  const corsa = countModel('opel', 'corsa');
  const b320 = countModel('bmw', '320');
  add('P-10', 'effectifs golf / polo / corsa / 320', `${golf} / ${polo} / ${corsa} / ${b320} (seuils 650 / 480 / 440 / 170)`,
    opts.profile !== 'test' || (golf >= 650 && polo >= 480 && corsa >= 440 && b320 >= 170), 'EG-01');
  const famCount = (name) => {
    const f = tables.models.families[name];
    return f.members.reduce((a, ms) => a + countModel(f.makeSlug, ms), 0);
  };
  const f3 = famCount('bmw-serie-3');
  const f1 = famCount('bmw-serie-1');
  add('P-11', 'familles bmw-serie-3 / bmw-serie-1', `${f3} / ${f1} (seuil 280)`, opts.profile !== 'test' || (f3 >= 280 && f1 >= 280), 'EG-01');
  const recent = s0.filter((o) => o.firstRegistrationDate && o.firstRegistrationDate >= '2022');
  const suv = recent.filter((o) => o.bodyType === 4).length / recent.length;
  // DR3-19 : EG-12 nomme les sondes dont la tolerance n'est pas atteignable au VOLUME dev. La liste
  // passe de trois a sept (P-18, P-23, P-37, P-38, P-45, P-55, P-58) ; ici, seules celles que ce
  // controle rejoue sont marquees. Au profil test elles restent OPPOSABLES.
  const devNoise = opts.profile === 'test' ? null : 'EG-12';
  add('P-23', 'part de carrosserie SUV parmi les 1res immat. >= 2022', `${(suv * 100).toFixed(1)} %`, suv >= 0.38 && suv <= 0.52, devNoise);
  const coupe = s0.filter((o) => o.bodyType === 3).length / N;
  add('P-24', 'part de carrosserie coupe', `${(coupe * 100).toFixed(2)} %`, coupe >= 0.02 && coupe <= 0.035);
  const autoShare = (y) => {
    const sub = s0.filter((o) => o.firstRegistrationDate && o.firstRegistrationDate.startsWith(String(y)) && o.transmission);
    return sub.length === 0 ? NaN : sub.filter((o) => o.transmission !== 'M').length / sub.length;
  };
  const a2010 = autoShare(2010);
  const a2024 = autoShare(2024);
  add('P-25', 'part de boites automatiques 2010 / 2024', `${a2010.toFixed(3)} / ${a2024.toFixed(3)}`, a2010 <= 0.3 && a2024 >= 0.6);
  const colored = s0.filter((o) => o.bodyColor !== undefined);
  const dark = colored.filter((o) => [11, 6, 14, 12].includes(o.bodyColor)).length / colored.length;
  add('P-27', 'part cumulee noir + gris + blanc + argent', `${(dark * 100).toFixed(1)} %`, dark >= 0.68 && dark <= 0.78);
  const older20 = s0.filter((o) => (yearOf(o) ?? 9999) <= capturedYear - 20 && (yearOf(o) ?? 0) >= 1900).length / N;
  add('P-14', 'part des annonces de 20 ans et plus', `${(older20 * 100).toFixed(2)} %`, older20 >= 0.025 && older20 <= 0.055);
  const older30 = s0.filter((o) => (yearOf(o) ?? 9999) <= capturedYear - 30 && (yearOf(o) ?? 0) >= 1900).length / N;
  add('P-15', 'part des annonces de 30 ans et plus', `${(older30 * 100).toFixed(2)} %`, older30 >= 0.002 && older30 <= 0.012);
  // Une annonce sans date de 1re immatriculation n'a pas d'age : la borne de P-85 ne s'y applique pas.
  const oldtimerBad = s0.filter((o) => o.offerType === 'O' && yearOf(o) !== null && yearOf(o) > capturedYear - 30).length;
  add('P-85', 'offerType O reserve aux 30 ans et plus', `${oldtimerBad} ecart(s)`, oldtimerBad === 0);
  const accidented = s0.filter((o) => o.usageState === 'A').length / s0.filter((o) => o.usageState !== undefined).length;
  add('P-84', 'part d annonces accidentees', `${(accidented * 100).toFixed(2)} %`, accidented >= 0.02 && accidented <= 0.05);
  const superDeal = s0.filter((o) => o.superDeal === true);
  const superOk = superDeal.every((o) => o.seller.type === 'D' && [1, 2].includes(o.prices?.public?.evaluation?.category));
  add('P-83', 'superDeal : PRO et categorie 1-2 seulement, taux global', `${((superDeal.length / N) * 100).toFixed(2)} % ${superOk ? '' : 'HORS BASE'}`,
    superOk && superDeal.length / N >= 0.025 && superDeal.length / N <= 0.055);

  /* ---- Valeurs manquantes -------------------------------------------------------------------------- */
  const presence = presenceRates(s0, tables);
  let worstField = null;
  let worstDev = 0;
  const breaches = [];
  for (const [key, { rate, base, n }] of presence) {
    const dev = base === 0 ? 0 : Math.abs(rate - base) / base;
    if (dev > 0.25) breaches.push(`${key} ${(rate * 100).toFixed(2)} % vs ${(base * 100).toFixed(2)} % (n=${n})`);
    if (dev > worstDev) {
      worstDev = dev;
      worstField = `${key} ${(rate * 100).toFixed(1)} % vs ${(base * 100).toFixed(1)} % (n=${n})`;
    }
  }
  add(
    'P-55',
    `taux d absence de ${presence.size} champs a +/- 25 % relatifs (${presence.skipped.length} ecarte(s) : ${presence.skipped.join(', ')})`,
    breaches.length === 0 ? `ecart max ${(worstDev * 100).toFixed(1)} % (${worstField})` : `HORS TOLERANCE ${breaches.join(' | ')}`,
    breaches.length === 0,
    devNoise,
  );
  const rates = [...presence.values()].map((v) => v.rate);
  const mu = rates.reduce((a, b) => a + b, 0) / rates.length;
  const sd = Math.sqrt(rates.reduce((a, b) => a + (b - mu) ** 2, 0) / rates.length);
  add('P-56', 'ecart-type des taux d absence (non-uniformite)', sd.toFixed(3), sd > 0.15);
  const corrAbs = (fa, fb) => {
    const a = s0.map((o) => (fa(o) ? 1 : 0));
    const b = s0.map((o) => (fb(o) ? 1 : 0));
    return pearson(a, b);
  };
  const c57 = corrAbs((o) => o.modelVersion === undefined, (o) => o.upholsteryType === undefined);
  add('P-57', 'correlation entre absences (version, sellerie)', c57.toFixed(3), c57 >= 0.1 && c57 <= 0.4, 'EG-11');
  const priv = s0.filter((o) => o.seller.type === 'P');
  const pro = s0.filter((o) => o.seller.type === 'D');
  const ratio = (priv.filter((o) => o.equipment === undefined).length / priv.length) /
    (pro.filter((o) => o.equipment === undefined).length / pro.length);
  add('P-58', 'absence d equipement PRIVE / PRO', ratio.toFixed(2), ratio >= 1.8, devNoise);
  const paint = s0.filter((o) => o.paintType === undefined).length / N;
  add('P-108', 'taux d absence de paintType', `${(paint * 100).toFixed(1)} %`, paint >= 0.75);
  const de47 = s0.filter((o) => o.location.postalCodePrefix2 === '47').length;
  add('P-54', 'annonces du prefixe germanophone 47', String(de47), de47 > 0);

  /* ---- Forme des nombres --------------------------------------------------------------------------- */
  const decimalBad = snaps[0].lines.filter((l) => /"(co2Emissions|co2EmissionsCombined|consumptionCombined|consumptionElectricCombined|combined|electricCombined|capacity|co2EmissionInGramPerKmWithFallback|consumptionCombinedWithFallback)":-?\d+\.\d\d+/.test(l)).length;
  add('P-102', 'au plus une decimale (comparaison textuelle)', `${decimalBad} ligne(s)`, decimalBad === 0);
  const marketBad = s0.filter((o) => o.marketplace !== snaps[0].manifest.marketplace).length;
  add('P-94', 'marketplace de chaque ligne = celui du manifest', `${marketBad} ecart(s)`, marketBad === 0);

  return rows;
}

/**
 * DR3-05 - TAUX D'ABSENCE REALISE, SUR TOUS LES CHAMPS ET SUR LEUR POPULATION ELIGIBLE.
 *
 * L'ancienne version ne suivait que 30 champs, tous INCONDITIONNELS, nommes dans une liste en dur :
 * les 52 autres taux de `baseRates` n'etaient controles par personne, et c'est precisement parmi les
 * champs CONDITIONNELS que la revue a trouve les trois ecarts de DR3-05 (jusqu'a -69 % relatifs).
 * Toutes les cles de `baseRates` sont desormais mesurees, chacune sur la population que
 * `missingness.json:conditionalAbsence` lui donne. Trois champs dont la population n'est pas
 * observable depuis le fichier livre sont NOMMES et ecartes, jamais tus ; les populations de moins
 * de 100 lignes sont ecartees pour la meme raison que dans la sonde du reviewer : a cet effectif la
 * bande de +/- 25 % relatifs vaut moins de deux erreurs-types et ne mesure plus rien.
 */
function presenceRates(objects, tables) {
  const base = tables.missingness.baseRates;
  const at = (o, path) => path.split('.').reduce((acc, k) => (acc === undefined || acc === null ? undefined : acc[k]), o);
  const elec = (o) => o.fuelCategory === 'E' || o.isPluginHybrid === true;
  const pro = (o) => o.seller?.type === 'D';
  const branch = (o) => (o.wltp !== undefined ? 'WLTP' : o.co2Emissions !== undefined || o.consumption !== undefined || o.efficiencyClass !== undefined ? 'NEDC' : 'NONE');
  // `null` = population non observable depuis le fichier livre ; absent = tout le snapshot.
  const quoted = (o) => price(o) !== undefined;
  const ELIGIBLE = {
    'prices.public.isTaxDeductible': (o) => pro(o) && quoted(o),
    'prices.public.isNegotiable': quoted,
    'prices.public.netPrice': (o) => o.prices?.public?.isTaxDeductible === true,
    'prices.public.vatRate': (o) => o.prices?.public?.isTaxDeductible === true,
    'prices.public.currency': (o) => o.prices?.public?.price !== undefined,
    'prices.public.evaluation.category': null,
    'seller.dealerBucket': pro,
    'adProduct.tier': pro,
    appliedSeals: pro,
    warranty: pro,
    hasWarranty: pro,
    warrantyUnit: pro,
    'consumption.electricCombined': (o) => elec(o) && branch(o) === 'NEDC',
    'consumption.combined': (o) => o.fuelCategory !== 'E' && o.fuelCategory !== 'H' && branch(o) === 'NEDC',
    'wltp.consumptionElectricCombined': (o) => elec(o) && branch(o) === 'WLTP',
    'wltp.consumptionCombined': (o) => o.fuelCategory !== 'E' && o.fuelCategory !== 'H' && branch(o) === 'WLTP',
    'wltp.co2EmissionsCombined': (o) => o.fuelCategory !== 'E' && o.fuelCategory !== 'H' && branch(o) === 'WLTP',
    'wltp.co2Class': (o) => branch(o) === 'WLTP',
    co2Emissions: (o) => branch(o) === 'NEDC',
    efficiencyClass: (o) => branch(o) === 'NEDC',
    electricRange: elec,
    'battery.capacity': elec,
    'battery.ownershipType': (o) => o.fuelCategory === 'E',
    cylinderCapacity: (o) => o.fuelCategory !== 'E',
    cylinderCount: (o) => o.fuelCategory !== 'E',
    hasParticleFilter: (o) => o.fuelCategory === 'D' || o.fuelCategory === '3',
    isPluginHybrid: (o) => o.fuelCategory === '2' || o.fuelCategory === '3',
    mileageUnit: (o) => o.mileage !== undefined,
    powerUnit: (o) => o.power !== undefined,
    cylinderCapacityUnit: (o) => o.cylinderCapacity !== undefined,
    co2EmissionsUnit: (o) => o.co2Emissions !== undefined,
    'battery.capacityUnit': (o) => at(o, 'battery.capacity') !== undefined,
    co2EmissionInGramPerKmWithFallback: null,
    consumptionCombinedWithFallback: null,
  };
  const out = new Map();
  const skipped = [];
  for (const key of Object.keys(base)) {
    if (base[key] <= 0) continue;
    const rule = Object.prototype.hasOwnProperty.call(ELIGIBLE, key) ? ELIGIBLE[key] : undefined;
    if (rule === null) {
      skipped.push(`${key} (population non observable)`);
      continue;
    }
    const pop = rule === undefined ? objects : objects.filter(rule);
    if (pop.length < 100) {
      skipped.push(`${key} (n=${pop.length})`);
      continue;
    }
    const missing = pop.filter((o) => at(o, key) === undefined).length;
    out.set(key, { rate: missing / pop.length, base: base[key], n: pop.length });
  }
  out.skipped = skipped;
  return out;
}

function main() {
  const opts = parseValidateArgs(process.argv.slice(2));
  opts.noRegen = process.argv.includes('--no-regen');
  const rows = runCheck(opts);
  const w = Math.max(...rows.map((r) => r.label.length));
  const out = rows.map(
    (r) => `${r.ok ? 'OK   ' : r.debt ? 'DETTE' : 'ECART'} ${r.id.padEnd(10)} ${r.label.padEnd(w)}  ${r.value}${r.debt ? `  [${r.debt}]` : ''}`,
  );
  const bad = rows.filter((r) => !r.ok && !r.debt);
  const debts = rows.filter((r) => !r.ok && r.debt);
  out.push('');
  out.push(
    `${rows.length} sondes rejouees, ${bad.length} ecart(s)${bad.length ? ` : ${bad.map((r) => r.id).join(', ')}` : ''}` +
      `, ${debts.length} dette(s) consignee(s)${debts.length ? ` : ${debts.map((r) => `${r.id} ${r.debt}`).join(', ')}` : ''}`,
  );
  process.stdout.write(`${out.join('\n')}\n`);
  process.exitCode = bad.length === 0 ? 0 : 1;
}

if (process.argv[1] && process.argv[1].endsWith('tools/dataset/check.mjs')) main();
