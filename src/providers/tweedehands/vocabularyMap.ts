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

/**
 * Jetons HYBRIDES, testés EN PREMIER (DR-041). `REF-vocabulary-reconciliation.md` PIÈGE 1 /
 * décision V1 : `KYCAR_FUEL_CATEGORY` porte deux codes dédiés — `2` (Électrique/Essence) et `3`
 * (Électrique/Diesel). Écraser un hybride sur son carburant primaire (`B`/`D`) est exactement
 * l'erreur silencieuse que le document interdit nommément : « une donnée fausse qui fausse ensuite
 * toute distribution par carburant ». Un libellé hybride porte DEUX jetons de motorisation ; c'est
 * la combinaison, pas le premier jeton, qui détermine le code.
 */
const HYBRID_TOKENS: ReadonlyMap<string, string> = new Map([
  ['dieselelektrisch', '3'],
  ['elektrischdiesel', '3'],
  ['dieselelectrique', '3'],
  ['electriquediesel', '3'],
  ['benzineelektrisch', '2'],
  ['elektrischbenzine', '2'],
  ['essenceelectrique', '2'],
  ['electriqueessence', '2'],
]);

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

/** Code de repli `KYCAR_FUEL_CATEGORY` = « Autres » : motorisation RELEVÉE mais atypique (DR-041). */
const FUEL_OTHER = 'O';

/**
 * `fuel` (2dehands) → `KYCAR_FUEL_CATEGORY`.
 *
 *   1. un libellé hybride est reconnu comme tel et rend `2` ou `3` — jamais son carburant primaire ;
 *   2. sinon le premier jeton simple reconnu l'emporte (préfixe avant `/` d'abord) ;
 *   3. une valeur PRÉSENTE mais non reconnue rend `O` (« Autres »), code réel du vocabulaire qui
 *      n'était jamais produit, et l'appelant lève `ENUM_UNKNOWN` (`isFuelCategoryRecognised`).
 *
 * `undefined` (attribut absent) rend `null` : il n'y a rien à traduire, donc rien à signaler.
 */
export function mapFuelCategory(rawValue: string | undefined): string | null {
  if (rawValue === undefined) return null;
  const hybrid = matchToken(rawValue, HYBRID_TOKENS);
  if (hybrid !== null) return hybrid;
  const primary = rawValue.split(/[/,]/)[0] ?? rawValue;
  return matchToken(primary, FUEL_TOKENS) ?? matchToken(rawValue, FUEL_TOKENS) ?? FUEL_OTHER;
}

/** Vrai si `rawValue` est une motorisation RECONNUE (et non le repli « Autres »). */
export function isFuelCategoryRecognised(rawValue: string | undefined): boolean {
  if (rawValue === undefined) return false;
  if (matchToken(rawValue, HYBRID_TOKENS) !== null) return true;
  const primary = rawValue.split(/[/,]/)[0] ?? rawValue;
  return matchToken(primary, FUEL_TOKENS) !== null || matchToken(rawValue, FUEL_TOKENS) !== null;
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

/**
 * Vrai si la carrosserie est RECONNUE — par opposition au repli « Autres » (DR-044). Le repli reste
 * un code valide du vocabulaire, mais il ne dit PAS la même chose qu'une reconnaissance : sans ce
 * prédicat, une valeur inconnue était absorbée en donnée plausible, sans drapeau ni champ inconnu.
 */
export function isBodyTypeRecognised(rawValue: string | undefined): boolean {
  return rawValue !== undefined && matchToken(rawValue, BODY_TYPE_TOKENS) !== null;
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

/** Vrai si l'état est RECONNU — par opposition au repli « état d'origine » (DR-044). */
export function isUsageStateRecognised(rawValue: string | undefined): boolean {
  return rawValue !== undefined && matchToken(rawValue, USAGE_STATE_TOKENS) !== null;
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

/**
 * Alias de marque relevés sur un portail belge (DR-130) : formes courtes et commerciales qu'aucune
 * égalité de libellé ne résout. Clé = libellé REPLIÉ de l'alias, valeur = libellé replié de la
 * marque du référentiel. La table reste petite et EXPLICITE : elle ne devine rien, elle traduit des
 * formes observées. Une marque non résolue n'est plus perdue en silence — `normalize.ts` recense
 * `makeId` dans `unknownFields`, ce qui rend la perte auditable au rapport d'ingestion.
 */
const MAKE_ALIASES: ReadonlyMap<string, string> = new Map([
  ['vw', 'volkswagen'],
  ['mercedes', 'mercedesbenz'],
  ['merc', 'mercedesbenz'],
  ['ds', 'dsautomobiles'],
  ['landrover', 'landrover'],
  ['range rover', 'landrover'],
  ['rangerover', 'landrover'],
  ['alfa', 'alfaromeo'],
  ['citroen', 'citroen'],
  ['vauxhall', 'opel'],
  ['skoda', 'skoda'],
  ['mini cooper', 'mini'],
  ['minicooper', 'mini'],
  ['chevy', 'chevrolet'],
  ['bmwi', 'bmw'],
]);

/**
 * Résout un libellé de marque 2dehands (`brand`) vers le `makeId` du référentiel, ou `null`.
 * Égalité de libellé replié d'abord (accents, casse et séparateurs neutralisés), puis table d'alias.
 */
export function resolveMakeId(referenceData: ReferenceData, brandRaw: string | undefined): number | null {
  if (brandRaw === undefined) return null;
  const folded = foldLabel(brandRaw);
  const target = MAKE_ALIASES.get(folded) ?? folded;
  for (const make of referenceData.makes) {
    if (foldLabel(make.label) === target || foldLabel(make.slug) === target) return make.makeId;
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

/* ================================================================================================
 * Pays et région — EX-DATA-40 (ARB-60/ADV-15), EX-DATA-53 (O14) — DR-046
 * ============================================================================================== */

/**
 * `location.countryAbbreviation` (2dehands) → code pays ISO 3166-1 alpha-2 (annexe A champ « pays »).
 * La surface autorisée sert déjà l'abréviation ; elle n'était simplement jamais traduite, si bien
 * qu'aucun `countryCode` n'existait et que le repli d'`ARB-60` (`MARKETPLACE_UNMAPPED`) restait
 * inatteignable. Table EXPLICITE : une abréviation hors table rend `null`, et l'appelant lève
 * `MARKETPLACE_UNMAPPED` — jamais un code inventé.
 */
const COUNTRY_ABBREVIATION_TO_ISO: ReadonlyMap<string, string> = new Map([
  ['be', 'BE'],
  ['nl', 'NL'],
  ['lu', 'LU'],
  ['fr', 'FR'],
  ['de', 'DE'],
  ['at', 'AT'],
  ['es', 'ES'],
  ['it', 'IT'],
]);

/** Traduit l'abréviation de pays de la source en ISO alpha-2, ou `null` si elle est hors table. */
export function mapCountryCode(rawValue: string | undefined): string | null {
  if (rawValue === undefined) return null;
  return COUNTRY_ABBREVIATION_TO_ISO.get(foldToken(rawValue)) ?? null;
}

/**
 * Région NUTS-2 (`KYCAR_REGION`, EX-DATA-53). La surface autorisée n'expose AUCUN code postal (P-3,
 * `probe-LOT-N.md`) : la seule dérivation licite — code postal → NUTS-2 — n'a pas d'entrée. La
 * région reste donc INCONNUE, et c'est `REGION_UNRESOLVED` qui rend cette couverture NULLE visible
 * au rapport d'ingestion (EX-DATA-46) au lieu de la laisser muette (DR-046). Router `cityName` vers
 * une région serait une extrapolation non vérifiable : l'adaptateur ne le fait pas.
 */
export function mapRegionCode(): null {
  return null;
}

/* ================================================================================================
 * Phase 2.8 — D8-08, D8-16 : TVA déductible, unités source, repli carburant, palier publicitaire
 * ============================================================================================== */

/**
 * **D8-08 / `EX-SCR-203`, annexe A champ # 10 `isTaxDeductible`.** Sur la surface autorisée, la
 * déductibilité de la TVA est portée par un attribut BOOLÉEN TEXTUEL, servi en néerlandais sur
 * 2dehands.be (`btwVerrekenbaar`, littéralement « TVA récupérable ») et en français sur les pages
 * francophones (`tvaDeductible`). Les deux clés sont lues, dans cet ordre, par
 * `readVatDeductibleAttribute` — CHEMIN DOCUMENTÉ pour la revue :
 *
 * ```
 * __NEXT_DATA__.props.pageProps.searchRequestAndResponse.listings[]
 *   .attributes[]         { key: "btwVerrekenbaar" | "tvaDeductible", value: "Ja" | "Nee" }
 *   .extendedAttributes[] (même forme — `getAttr` balaye les deux réservoirs, dans cet ordre)
 * ```
 *
 * Trois états, jamais deux : `Ja`/`Oui`/`true` ⇒ `true` ; `Nee`/`Non`/`false` ⇒ `false` ; attribut
 * ABSENT ⇒ `null` (INCONNU), qui devient le code `0` de la colonne tri-état `vatDeductible`. Une
 * valeur PRÉSENTE mais non traduisible reste `null` et l'appelant lève `ENUM_UNKNOWN` : c'est une
 * dérive de la source, pas un « non déductible ».
 */
const VAT_ATTRIBUTE_KEYS: readonly string[] = ['btwVerrekenbaar', 'tvaDeductible', 'btw', 'tva'];

const VAT_TRUE_TOKENS: readonly string[] = ['ja', 'oui', 'true', 'yes', 'btwverrekenbaar', 'tvadeductible'];
const VAT_FALSE_TOKENS: readonly string[] = ['nee', 'non', 'false', 'no', 'geenbtw', 'sanstva'];

/** Lit l'attribut BTW/TVA d'une annonce brute (première clé servie parmi `VAT_ATTRIBUTE_KEYS`). */
export function readVatDeductibleAttribute(listing: RawListing): string | undefined {
  for (const key of VAT_ATTRIBUTE_KEYS) {
    const value = getAttr(listing, key);
    if (value !== undefined) return value;
  }
  return undefined;
}

/** Traduit la valeur BTW/TVA de la source en booléen tri-état (`null` = INCONNU). */
export function mapVatDeductible(rawValue: string | undefined): boolean | null {
  if (rawValue === undefined) return null;
  const folded = foldToken(rawValue);
  if (folded.length === 0) return null;
  if (VAT_TRUE_TOKENS.includes(folded)) return true;
  if (VAT_FALSE_TOKENS.includes(folded)) return false;
  return null;
}

/**
 * `EX-DATA-4` — unités CANONIQUES du dictionnaire KYCAR, par champ. `EX-DATA-5` : « toute conversion
 * d'unité à l'ingestion est REFUSÉE si le champ `*Unit` correspondant est présent et vaut une unité
 * non gérée ». Ces tables énumèrent donc les seules formes ACCEPTÉES ; tout le reste (`mi`, `hp`,
 * `g/mi`…) refuse la conversion, met le champ à INCONNU et lève `UNIT_UNSUPPORTED`. Aucune
 * conversion n'est devinée — pas même `mi → km`, dont le facteur est pourtant connu : la règle
 * interdit de deviner, et une source qui change d'unité sans préavis doit se voir, pas se convertir.
 */
const CANONICAL_UNITS: Readonly<Record<string, readonly string[]>> = {
  mileageUnit: ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'],
  powerUnit: ['kw', 'kilowatt', 'kilowatts'],
  co2EmissionsUnit: ['gkm', 'ggkm', 'grkm', 'gramkm', 'grammekm', 'gramperkm'],
  combinedUnit: ['l100km', 'liter100km', 'litre100km'],
};

/** Attribut `*Unit` de la source associé à chaque champ numérique soumis à `EX-DATA-5`. */
export const UNIT_ATTRIBUTE_BY_FIELD: Readonly<Record<string, keyof typeof CANONICAL_UNITS>> = {
  mileageKm: 'mileageUnit',
  powerKw: 'powerUnit',
  co2EmissionsGPerKm: 'co2EmissionsUnit',
};

/**
 * `EX-DATA-5` — vrai si l'unité SERVIE par la source est celle du dictionnaire KYCAR. Une unité
 * absente (`undefined`) n'est PAS une unité non gérée : la source ne déclare rien, la valeur est
 * donc lue dans l'unité canonique documentée par l'attribut lui-même (`enginePowerKW`, `mileage` en
 * km) — c'est le cas nominal de cette surface.
 */
export function isCanonicalUnit(unitAttribute: string, rawValue: string | undefined): boolean {
  if (rawValue === undefined) return true;
  const accepted = CANONICAL_UNITS[unitAttribute];
  if (accepted === undefined) return true;
  return accepted.includes(foldToken(rawValue));
}

/**
 * **`EX-DATA-10`** — table de correspondance `KYCAR_FUEL_TYPE` (échelle de CRÉATION, 16 codes) →
 * `KYCAR_FUEL_CATEGORY` (échelle de RECHERCHE), *many-to-one*, marquée `[EXTRAPOLÉ]` par l'annexe A.
 * Elle n'est utilisée **qu'en repli** : `fuelCategory` absent ET `fuelTypePrimary` présent. Copie
 * fidèle de la table normative, ligne à ligne.
 *
 * **`EX-DATA-11`** — aucun code ne projette sur `2` (Électrique/Essence) ni `3` (Électrique/Diesel) :
 * la catégorie hybride est INATTEIGNABLE par ce repli, et c'est voulu. Un hybride rechargeable sans
 * catégorie servie reste INCONNU (`HYBRID_CATEGORY_UNRESOLVED`), jamais rattaché à `B` ou `D`.
 */
const FUEL_TYPE_TO_CATEGORY: ReadonlyMap<string, string> = new Map([
  ['1', 'B'], // Essence 91
  ['2', 'B'], // Super 95
  ['3', 'B'], // Super Plus 98
  ['4', 'B'], // E10 91
  ['5', 'B'], // Super E10 95
  ['6', 'B'], // Super Plus E10 98
  ['7', 'D'], // Diesel
  ['8', 'D'], // Diesel écologique
  ['9', 'L'], // GPL
  ['10', 'C'], // Gaz naturel H
  ['11', 'C'], // Gaz naturel L
  ['12', 'E'], // Électrique
  ['13', 'H'], // Hydrogène
  ['14', 'O'], // Vegetable oil
  ['15', 'O'], // Biogas
  ['16', 'M'], // Ethanol
]);

/** Repli `EX-DATA-10` : code `KYCAR_FUEL_TYPE` → code `KYCAR_FUEL_CATEGORY`, ou `null` hors table. */
export function mapFuelCategoryFromFuelType(rawValue: string | undefined): string | null {
  if (rawValue === undefined) return null;
  return FUEL_TYPE_TO_CATEGORY.get(rawValue.trim()) ?? null;
}

/** Jetons booléens de la source (NL/FR/anglais) — `undefined` et forme inconnue rendent `false`. */
export function parseSourceBoolean(rawValue: string | undefined): boolean {
  if (rawValue === undefined) return false;
  return VAT_TRUE_TOKENS.includes(foldToken(rawValue));
}

/**
 * **`EX-DATA-43`** — palier publicitaire (`adTier`, `KYCAR_AD_TIER` : `NONE`, `T20`, `T30`, `T40`,
 * `T50`). 2dehands nomme ses produits de mise en avant (`priorityProduct`) : `DAGTOPPER` (annonce du
 * jour, le plus visible) et `TOPADVERTENTIE` (annonce en tête de liste). La projection vers les
 * paliers `T*` d'AutoScout24 est `[EXTRAPOLÉ]` — les deux échelles ne sont pas publiées l'une en
 * fonction de l'autre — mais elle est ORDINALE et explicite : le produit le plus visible reçoit le
 * palier le plus élevé. Un produit ABSENT vaut `NONE` (défaut de l'annexe A champ 79), une valeur
 * présente mais hors table reste non reconnue et l'appelant lève `ENUM_UNKNOWN`.
 */
const AD_TIER_TOKENS: ReadonlyMap<string, string> = new Map([
  ['dagtopper', 'T50'],
  ['topadvertentie', 'T30'],
  ['topannonce', 'T30'],
  ['blikvanger', 'T20'],
  ['urgent', 'T20'],
]);

/** `priorityProduct` (2dehands) → code `KYCAR_AD_TIER`. Absent ⇒ `NONE` (annexe A champ 79). */
export function mapAdTier(rawValue: string | undefined): string {
  if (rawValue === undefined) return 'NONE';
  return matchToken(rawValue, AD_TIER_TOKENS) ?? 'NONE';
}

/** Vrai si le produit de mise en avant SERVI est reconnu (et non replié en silence sur `NONE`). */
export function isAdTierRecognised(rawValue: string | undefined): boolean {
  return rawValue !== undefined && matchToken(rawValue, AD_TIER_TOKENS) !== null;
}
