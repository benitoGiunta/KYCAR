/**
 * KYCAR - Couverture fonctionnelle des filtres (R-61, sonde P-82)
 * =================================================================================================
 * Un filtre que les donnees n'alimentent pas est un filtre que la recette ne peut pas exercer : il
 * doit etre NOMME, jamais decouvert a l'usage. Ce module calcule, pour chaque filtre retenu de
 * `data/reference/filters-scope.json` de classe enumeree ou bornee, le nombre de valeurs distinctes
 * representees dans le snapshot, et publie la liste de ceux qui n'en ont pas au moins deux.
 *
 * La correspondance filtre -> champ de la couche source est explicite : un filtre sans champ
 * correspondant au dictionnaire KYCAR (financement, leasing, prime, rayon, vignette) est declare
 * non alimente PAR CONSTRUCTION, ce que §11 de DATASET-SPEC annonce deja.
 */

/** Classes de filtre couvertes par P-82. */
const COVERED = new Set(['enum_single', 'enum_multi', 'range_min', 'range_max']);

/** Filtre -> chemin du champ source qui l'alimente ; `null` = aucun champ au dictionnaire. */
export const FILTER_FIELD = {
  articleType: 'vehicleType',
  offer: 'offerType',
  priceFrom: 'prices.public.price',
  priceTo: 'prices.public.price',
  vatReportable: 'prices.public.isTaxDeductible',
  priceEvaluation: 'prices.public.evaluation.category',
  financeRateFrom: null,
  financeRateTo: null,
  leasingRateFrom: null,
  leasingRateTo: null,
  leasingDurationFrom: null,
  leasingDurationTo: null,
  leasingYearlyIncludedMileageFrom: null,
  leasingTargetGroup: null,
  mileageFrom: 'mileage',
  mileageTo: 'mileage',
  dateOfRegistrationFrom: 'firstRegistrationDate',
  dateOfRegistrationTo: 'firstRegistrationDate',
  dateOfModelYearFrom: 'productionYear',
  dateOfModelYearTo: 'productionYear',
  fuelType: 'fuelCategory',
  powerType: 'powerUnit',
  powerFrom: 'power',
  powerTo: 'power',
  engineMotorSizeFrom: 'cylinderCapacity',
  engineMotorSizeTo: 'cylinderCapacity',
  engineType: 'cylinderCount',
  driveTrain: 'drivetrain',
  gearType: 'transmission',
  bodyType: 'bodyType',
  doorFrom: 'doorCount',
  doorTo: 'doorCount',
  numberOfSeatsFrom: 'seatCount',
  numberOfSeatsTo: 'seatCount',
  bodyColor: 'bodyColor',
  paintwork: 'paintType',
  interiorColor: 'upholsteryColor',
  upholstery: 'upholsteryType',
  emissionClass: 'euEmissionStandard',
  emissionSticker: null,
  batteryOwnershipType: 'battery.ownershipType',
  electricRangeFrom: 'electricRange',
  electricRangeTo: 'electricRange',
  equipment: 'equipment',
  hadAccident: 'usageState',
  hadAccidentNew: 'condition.hadAccident',
  numberOfOwners: 'previousOwnerCount',
  seals: 'appliedSeals',
  sellerType: 'seller.type',
  countryType: 'location.countryCode',
  radius: null,
  ocsListing: null,
  sortTypes: null,
  descType: null,
};

const read = (o, path) => {
  let v = o;
  for (const p of path.split('.')) {
    if (v === undefined || v === null) return undefined;
    v = v[p];
  }
  return v;
};

/**
 * @returns {{ fueled: string[], unfueled: {id:string, param:string, reason:string}[] }}
 */
export function filterCoverage(objects, filtersScope) {
  const covered = filtersScope.retenus.filter((f) => COVERED.has(f.type));
  const distinct = new Map();
  for (const f of covered) {
    const path = FILTER_FIELD[f.id];
    if (path) distinct.set(f.id, new Set());
  }
  for (const o of objects) {
    for (const [id, set] of distinct) {
      if (set.size >= 3) continue;
      const v = read(o, FILTER_FIELD[id]);
      if (v === undefined) continue;
      if (Array.isArray(v)) for (const x of v.slice(0, 3)) set.add(x);
      else set.add(v);
    }
  }
  const fueled = [];
  const unfueled = [];
  for (const f of covered) {
    const path = FILTER_FIELD[f.id];
    if (path === undefined) {
      unfueled.push({ id: f.id, param: f.param, reason: 'aucune correspondance declaree' });
      continue;
    }
    if (path === null) {
      unfueled.push({ id: f.id, param: f.param, reason: 'aucun champ correspondant au dictionnaire KYCAR' });
      continue;
    }
    const n = distinct.get(f.id).size;
    if (n >= 2) fueled.push(f.id);
    else unfueled.push({ id: f.id, param: f.param, reason: `${n} valeur(s) distincte(s) dans le snapshot` });
  }
  return { fueled, unfueled, coveredCount: covered.length };
}
