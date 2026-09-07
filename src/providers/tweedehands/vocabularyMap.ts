/**
 * KYCAR — Adaptateur 2dehands (lot D9) : re-cartographie du vocabulaire 2dehands → dictionnaire KYCAR
 * =================================================================================================
 * `DECISION-coordinateur-source.md` : « 2dehands a son propre modèle d'attributs
 * (`constructionYear`, `mileage`, `fuel`, `body`, `model`…) qui recoupe ~25 des 40 champs [KYCAR]
 * mais avec ses propres codes. Un travail de re-cartographie est nécessaire. » C'est ce fichier.
 *
 * Chaque fonction ci-dessous prend une valeur BRUTE 2dehands (texte libre NL/FR observé sur le
 * marché belge, `probe-LOT-N.md` « Constat structurant n°2 ») et retourne soit un CODE du
 * vocabulaire KYCAR nommé correspondant (`vocabularies.ts`), soit `null` si non reconnu (inconnu
 * typé, jamais une valeur inventée). Les tables de tokens sont volontairement PLATES et EXPLICITES
 * (pas d'heuristique floue) : chaque entrée est une traduction directe, auditable, d'un token
 * observé vers un code réel du référentiel AutoScout24 repris comme dictionnaire KYCAR (`reference.ts`).
 *
 * DETTE DE MAPPING (documentée, non résolue par ce lot — voir rapport de lot D9) : `color`,
 * `interiorcolor`, `upholstery`, `engineDisplacement`, `emptyWeightCars`, `numberOfCilindersCars`,
 * `options`, `serviceHistory`, `carPassUrl`/`napAvailable` n'ont pas de table de correspondance
 * fiable construite ici — soit parce que le schéma KYCAR n'a pas de colonne correspondante
 * (`emptyWeightCars`, `numberOfCilindersCars`, `engineDisplacement` : hors périmètre du schéma
 * colonnaire, `columns.ts`), soit parce qu'une réconciliation texte-libre → code fiable exigerait un
 * travail dédié hors du périmètre de ce lot (`color`/`interiorcolor`/`upholstery`/`options`).
 * `regionCode` n'est également PAS mappé : 2dehands n'expose, sur la page autorisée, qu'une ville et
 * des coordonnées (`location.cityName`/`lat`/`long`) — dérivable en NUTS-2 seulement via un code
 * postal (P-3), absent de la charge. Router `cityName` vers `regionCode` sans code postal serait une
 * extrapolation non vérifiable ; l'adaptateur laisse `regionCode` INCONNU plutôt que d'inventer.
 */

import type { ReferenceData } from '../../types/reference';
import type { RawListing } from './nextData';
import { getAttr } from './nextData';

/** Normalise un jeton de texte libre pour comparaison : minuscule, accents retirés, espaces/tirets ôtés. */
function foldToken(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\s\-_/]+/g, '');
}

/** Cherche dans une table `{ jetons: code }` la première clé dont un jeton apparaît dans `value`. */
function matchToken(value: string, table: ReadonlyMap<string, string>): string | null {
  const folded = foldToken(value);
  for (const [token, code] of table) {
    if (folded.includes(token)) return code;
  }
  return null;
}

/* ================================================================================================
 * KYCAR_FUEL_CATEGORY — attribut 2dehands `fuel`
 * ============================================================================================== */

/** Jeton NL/FR replié → code `KYCAR_FUEL_CATEGORY` (references/FuelCategory.json, table §A.1). */
const FUEL_TOKENS: ReadonlyMap<string, string> = new Map([
  ['elektrisch', 'E'],
  ['electrique', 'E'],
  ['diesel', 'D'],
  ['benzine', 'B'],
  ['essence', 'B'],
  ['lpg', 'L'],
  ['cng', 'C'],
  ['aardgas', 'C'],
  ['waterstof', 'H'],
  ['hydrogene', 'H'],
  ['ethanol', 'M'],
]);

/**
 * `fuel` (2dehands) → `KYCAR_FUEL_CATEGORY`. Un libellé hybride (« Hybride diesel/elektrisch ») porte
 * les deux jetons : la carburant PRIMAIRE (celui qui apparaît AVANT le séparateur, cohérent avec la
 * convention AS24 observée `fuels.fuelCategory.raw` = carburant primaire, `FINDING-allowed-surface.md`
 * §2.4) l'emporte — recherche du premier jeton dans l'ORDRE DE LA TABLE ne suffit pas ici, donc on
 * teste explicitement le préfixe avant `/`.
 */
export function mapFuelCategory(rawValue: string | undefined): string | null {
  if (rawValue === undefined) return null;
  const primary = rawValue.split(/[/,]/)[0] ?? rawValue;
  return matchToken(primary, FUEL_TOKENS) ?? matchToken(rawValue, FUEL_TOKENS);
}

/* ================================================================================================
 * KYCAR_BODY_TYPE — attribut 2dehands `body`, restreint aux 9 codes voiture (carOnly, vocabularies.ts)
 * ============================================================================================== */

const BODY_TYPE_TOKENS: ReadonlyMap<string, string> = new Map([
  ['hatchback', '1'],
  ['citadine', '1'],
  ['stadsauto', '1'],
  ['cabriolet', '2'],
  ['cabrio', '2'],
  ['coupe', '3'],
  ['suv', '4'],
  ['terreinwagen', '4'],
  ['pickup', '4'],
  ['break', '5'],
  ['stationwagen', '5'],
  ['combi', '5'],
  ['estate', '5'],
  ['sedan', '6'],
  ['berline', '6'],
  ['monospace', '12'],
  ['mpv', '12'],
  ['ruimtewagen', '12'],
  ['bestelwagen', '13'],
  ['utilitaire', '13'],
  ['van', '13'],
]);

/** Code de repli `KYCAR_BODY_TYPE` = « Autres » (carrosserie relevée mais non reconnue). */
const BODY_TYPE_OTHER = '7';

/** `body` (2dehands) → `KYCAR_BODY_TYPE`. `null` si l'attribut est absent (jamais si présent mais atypique : Autres). */
export function mapBodyType(rawValue: string | undefined): string | null {
  if (rawValue === undefined) return null;
  return matchToken(rawValue, BODY_TYPE_TOKENS) ?? BODY_TYPE_OTHER;
}

/* ================================================================================================
 * KYCAR_TRANSMISSION — attribut 2dehands `transmission`
 * ============================================================================================== */

const TRANSMISSION_TOKENS: ReadonlyMap<string, string> = new Map([
  ['semiautomaat', 'S'],
  ['semiautomatique', 'S'],
  ['halfautomaat', 'S'],
  ['automaat', 'A'],
  ['automatique', 'A'],
  ['handgeschakeld', 'M'],
  ['manuelle', 'M'],
  ['manueel', 'M'],
]);

export function mapTransmission(rawValue: string | undefined): string | null {
  if (rawValue === undefined) return null;
  return matchToken(rawValue, TRANSMISSION_TOKENS);
}

/* ================================================================================================
 * KYCAR_DRIVETRAIN — attribut 2dehands `driveTrain`
 * ============================================================================================== */

const DRIVETRAIN_TOKENS: ReadonlyMap<string, string> = new Map([
  ['vierwielaandrijving', '4'],
  ['integrale', '4'],
  ['4x4', '4'],
  ['4wd', '4'],
  ['awd', '4'],
  ['voorwielaandrijving', 'F'],
  ['tractionavant', 'F'],
  ['avant', 'F'],
  ['achterwielaandrijving', 'R'],
  ['propulsion', 'R'],
  ['arriere', 'R'],
]);

export function mapDrivetrain(rawValue: string | undefined): string | null {
  if (rawValue === undefined) return null;
  return matchToken(rawValue, DRIVETRAIN_TOKENS);
}

/* ================================================================================================
 * KYCAR_USAGE_STATE — attribut 2dehands `condition`
 * ============================================================================================== */

const USAGE_STATE_TOKENS: ReadonlyMap<string, string> = new Map([
  ['nieuw', 'N'],
  ['neuf', 'N'],
  ['beschadigd', 'A'],
  ['accident', 'A'],
]);

/** `condition` (2dehands) → `KYCAR_USAGE_STATE` ; repli sur `U` (« état d'origine », le cas dominant
 *  d'un marché de l'occasion) quand l'attribut est présent mais ne porte aucun des deux jetons. */
export function mapUsageState(rawValue: string | undefined): string | null {
  if (rawValue === undefined) return null;
  return matchToken(rawValue, USAGE_STATE_TOKENS) ?? 'U';
}

/* ================================================================================================
 * KYCAR_SELLER_TYPE — attribut 2dehands `advertiser` (Particulier/Bedrijf, probe-LOT-N §A.3)
 * ============================================================================================== */

/** `advertiser` (2dehands) → `KYCAR_SELLER_TYPE` (filters.json#customerType : `P`=Particulier, `D`=Professionnel). */
export function mapSellerType(rawValue: string | undefined): string | null {
  if (rawValue === undefined) return null;
  const folded = foldToken(rawValue);
  if (folded.includes('particulier')) return 'P';
  if (folded.includes('bedrijf') || folded.includes('professionnel') || folded.includes('dealer')) return 'D';
  return null;
}

/* ================================================================================================
 * KYCAR_EU_EMISSION_STANDARD — attribut 2dehands `euronormBE`
 * ============================================================================================== */

/**
 * Construit un index jeton replié → code à partir du VRAI vocabulaire chargé (`references/
 * EuEmissionStandard.json`), plutôt qu'une table dupliquée en dur : les libellés AS24 (« Euro 6d-TEMP »,
 * « Euro 6b »…) et la valeur 2dehands (« Euro 6d-temp », « EURO6B »…) se replient sur la même clé
 * (minuscule, accents et séparateurs ôtés), donc la correspondance reste correcte si le référentiel
 * évolue.
 */
export function buildEuroStandardIndex(referenceData: ReferenceData): ReadonlyMap<string, string> {
  const voc = referenceData.vocabularies.get('KYCAR_EU_EMISSION_STANDARD');
  const index = new Map<string, string>();
  if (voc === undefined) return index;
  for (const v of voc.values) index.set(foldToken(v.label), v.code);
  return index;
}

/** `euronormBE` (2dehands) → `KYCAR_EU_EMISSION_STANDARD`, via l'index dynamique ci-dessus. */
export function mapEuEmissionStandard(
  rawValue: string | undefined,
  euroIndex: ReadonlyMap<string, string>,
): string | null {
  if (rawValue === undefined) return null;
  const folded = foldToken(rawValue);
  return euroIndex.get(folded) ?? null;
}

/* ================================================================================================
 * Champs numériques — parsing tolérant (unités NL/FR embarquées, ex. « 90.000 km »)
 * ============================================================================================== */

/** Extrait le premier nombre décimal d'une chaîne (accepte `.`/`,` comme séparateur de milliers/décimale). */
export function parseNumeric(rawValue: string | undefined): number | null {
  if (rawValue === undefined) return null;
  const cleaned = rawValue.replace(/[.\s](?=\d{3}(\D|$))/g, '').replace(',', '.');
  const match = /-?\d+(\.\d+)?/.exec(cleaned);
  if (match === null) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

/** Extrait un entier (arrondi) — pour les champs qui n'admettent pas de décimale (année, portes...). */
export function parseInteger(rawValue: string | undefined): number | null {
  const n = parseNumeric(rawValue);
  return n === null ? null : Math.round(n);
}

/* ================================================================================================
 * Marque / modèle — résolution contre la taxonomie de référence (`data/reference/taxonomy.json`)
 * ============================================================================================== */

function foldLabel(s: string): string {
  return foldToken(s);
}

/** Résout un libellé de marque 2dehands (`brand`) vers le `makeId` du référentiel, ou `null`. */
export function resolveMakeId(referenceData: ReferenceData, brandRaw: string | undefined): number | null {
  if (brandRaw === undefined) return null;
  const folded = foldLabel(brandRaw);
  for (const make of referenceData.makes) {
    if (foldLabel(make.label) === folded || foldLabel(make.slug) === folded) return make.makeId;
  }
  return null;
}

/**
 * Résout un libellé de modèle 2dehands (`model`) vers le `modelId` du référentiel, scopé à une
 * marque déjà résolue. Retourne `MODEL_ID_UNRESOLVED` (0, EX-DATA-72) — jamais `null` — quand la
 * marque est connue mais le modèle ne matche aucune entrée : c'est la valeur métier réservée du
 * schéma KYCAR pour « modèle non identifié », pas une sentinelle d'inconnu.
 */
export function resolveModelId(
  referenceData: ReferenceData,
  makeId: number,
  modelRaw: string | undefined,
): number {
  if (modelRaw === undefined) return 0;
  const folded = foldLabel(modelRaw);
  const models = referenceData.modelsByMake.get(makeId) ?? [];
  for (const model of models) {
    if (foldLabel(model.label) === folded || foldLabel(model.slug) === folded) return model.modelId;
  }
  return 0;
}

/** Lit et déplie un attribut 2dehands nommé, ré-exporté pour les modules aval (`normalize.ts`). */
export function readAttr(listing: RawListing, key: string): string | undefined {
  return getAttr(listing, key);
}
