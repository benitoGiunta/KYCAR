/**
 * KYCAR — Fixtures locales pour les tests de l'adaptateur 2dehands (lot D9)
 * =================================================================================================
 * RÈGLE LICITE (§ en-tête du travail de ce lot) : AUCUNE donnée réelle copiée en masse. Les
 * annonces ci-dessous sont INVENTÉES, mais leur FORME (attributs `attributes`/`extendedAttributes`,
 * champs racine `itemId`/`vipUrl`/`priceInfo`/`location`) suit fidèlement ce que documente
 * `probe-LOT-N.md` (« Constat structurant n°2 »). Les identifiants de marque/modèle utilisés
 * (Opel=54, Opel Corsa=1918, Opel Astra=1916, Volkswagen=74, VW Golf=2084, VW Polo=2090) sont les
 * VRAIS identifiants de `data/reference/taxonomy.json`, pour que la résolution marque/modèle de
 * l'adaptateur soit testée contre le référentiel réel (pas un référentiel inventé).
 *
 * Ce module n'est PAS un fichier de test (pas de suffixe `.test.ts`) : c'est un aidant partagé,
 * chargé par les fichiers de test du dossier. N'exécute aucune I/O réseau.
 */

import { buildReferenceData, type RawFilters, type RawFiltersScope, type RawReferenceFile, type RawTaxonomy } from '../../types/reference';
import type { ReferenceData } from '../../types/reference';
import type { RawListing, RawSearchResponse } from './nextData';

/**
 * Charge le référentiel RÉEL du dépôt (`data/reference/*.json`) via `import.meta.glob`, comme
 * `src/types/reference.test.ts` (lot D2). Un seul chargement, mémoïsé, réutilisé par tous les tests
 * de ce dossier.
 */
let cached: ReferenceData | undefined;
export function loadRealReferenceData(): ReferenceData {
  if (cached !== undefined) return cached;

  const taxonomyMod = import.meta.glob('../../../data/reference/taxonomy.json', { eager: true, import: 'default' });
  const filtersMod = import.meta.glob('../../../data/reference/filters.json', { eager: true, import: 'default' });
  const scopeMod = import.meta.glob('../../../data/reference/filters-scope.json', { eager: true, import: 'default' });
  const refMods = import.meta.glob('../../../data/reference/references/*.json', { eager: true, import: 'default' });

  const taxonomy = Object.values(taxonomyMod)[0] as RawTaxonomy;
  const filters = Object.values(filtersMod)[0] as RawFilters;
  const filtersScope = Object.values(scopeMod)[0] as RawFiltersScope;

  const referenceFiles: Record<string, RawReferenceFile> = {};
  for (const [path, mod] of Object.entries(refMods)) {
    if (path.endsWith('_index.json')) continue;
    const file = mod as RawReferenceFile;
    referenceFiles[file.referenceType] = file;
  }

  cached = buildReferenceData({ taxonomy, referenceFiles, filters, filtersScope });
  return cached;
}

/** Enveloppe un `RawSearchResponse` dans le bloc `__NEXT_DATA__` d'une page HTML minimale. */
export function buildFixtureHtml(response: RawSearchResponse): string {
  const nextData = {
    props: { pageProps: { searchRequestAndResponse: response } },
  };
  return `<!doctype html><html><head></head><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
    nextData,
  )}</script></body></html>`;
}

/** Construit une annonce 2dehands inventée, de forme fidèle à `probe-LOT-N.md`. */
export function makeRawListing(overrides: {
  readonly itemId: string;
  readonly brand: string;
  readonly model: string;
  readonly priceCents?: number;
  readonly priceType?: string;
  readonly constructionYear?: string;
  readonly mileage?: string;
  readonly fuel?: string;
  readonly body?: string;
  readonly transmission?: string;
  readonly driveTrain?: string;
  readonly condition?: string;
  readonly advertiser?: string;
  readonly euronormBE?: string;
  readonly enginePowerKW?: string;
  readonly co2emission?: string;
  readonly numberOfSeatsBE?: string;
  readonly aantaldeurenBE?: string;
  /* --- Attributs exercés par la phase 2.8 (D8-08, D8-16 / FV-20) ------------------------------ */
  /** `EX-DATA-5` — unités déclarées par la source ; hors unité canonique, la conversion est refusée. */
  readonly mileageUnit?: string;
  readonly powerUnit?: string;
  readonly co2EmissionsUnit?: string;
  /** `EX-DATA-10` — code `KYCAR_FUEL_TYPE` (échelle de création), repli quand `fuel` est absent. */
  readonly fuelTypePrimary?: string;
  /** `EX-DATA-11` — hybride rechargeable déclaré : la catégorie reste INCONNUE sans `fuel`. */
  readonly isPluginHybrid?: string;
  /** `EX-DATA-35` — CO₂ par norme NOMMÉE ; `co2emission` reste le champ à repli, norme non déclarée. */
  readonly co2emissionWLTP?: string;
  readonly co2emissionNEDC?: string;
  /** `EX-SCR-203` / annexe A # 10 — champ BTW/TVA de la source (`Ja`/`Nee`, `Oui`/`Non`). */
  readonly btwVerrekenbaar?: string;
  /** `EX-DATA-43` — produit de mise en avant 2dehands (`DAGTOPPER`, `TOPADVERTENTIE`…). */
  readonly priorityProduct?: string;
  /** Champs additionnels non déclarés par `RawListing` mais plausibles dans une charge réelle — pour
   *  prouver que `normalize.ts` ne les recopie jamais (test R3). */
  readonly extraForbidden?: Record<string, unknown>;
}): RawListing {
  const attributes = [
    { key: 'brand', value: overrides.brand },
    { key: 'model', value: overrides.model },
  ];
  if (overrides.constructionYear !== undefined) attributes.push({ key: 'constructionYear', value: overrides.constructionYear });
  if (overrides.mileage !== undefined) attributes.push({ key: 'mileage', value: overrides.mileage });
  if (overrides.fuel !== undefined) attributes.push({ key: 'fuel', value: overrides.fuel });
  if (overrides.body !== undefined) attributes.push({ key: 'body', value: overrides.body });
  if (overrides.transmission !== undefined) attributes.push({ key: 'transmission', value: overrides.transmission });
  if (overrides.driveTrain !== undefined) attributes.push({ key: 'driveTrain', value: overrides.driveTrain });
  if (overrides.condition !== undefined) attributes.push({ key: 'condition', value: overrides.condition });
  if (overrides.advertiser !== undefined) attributes.push({ key: 'advertiser', value: overrides.advertiser });

  const extendedAttributes: { key: string; value: string }[] = [];
  if (overrides.euronormBE !== undefined) extendedAttributes.push({ key: 'euronormBE', value: overrides.euronormBE });
  if (overrides.enginePowerKW !== undefined) extendedAttributes.push({ key: 'enginePowerKW', value: overrides.enginePowerKW });
  if (overrides.co2emission !== undefined) extendedAttributes.push({ key: 'co2emission', value: overrides.co2emission });
  if (overrides.numberOfSeatsBE !== undefined) extendedAttributes.push({ key: 'numberOfSeatsBE', value: overrides.numberOfSeatsBE });
  if (overrides.aantaldeurenBE !== undefined) extendedAttributes.push({ key: 'aantaldeurenBE', value: overrides.aantaldeurenBE });
  // Phase 2.8 — les attributs d'unité, de repli carburant, de norme CO₂, de TVA et de produit de
  // mise en avant vivent dans `extendedAttributes`, comme les autres champs techniques relevés.
  for (const key of [
    'mileageUnit',
    'powerUnit',
    'co2EmissionsUnit',
    'fuelTypePrimary',
    'isPluginHybrid',
    'co2emissionWLTP',
    'co2emissionNEDC',
    'btwVerrekenbaar',
    'priorityProduct',
  ] as const) {
    const value = overrides[key];
    if (value !== undefined) extendedAttributes.push({ key, value });
  }

  return {
    itemId: overrides.itemId,
    vipUrl: `https://www.2dehands.be/v/auto-s/${overrides.itemId}`,
    priceInfo: { priceCents: overrides.priceCents, priceType: overrides.priceType },
    location: { cityName: 'Anvers', countryAbbreviation: 'BE', lat: 51.2194, long: 4.4025 },
    date: 'Vandaag',
    attributes,
    extendedAttributes,
    ...(overrides.extraForbidden ?? {}),
  };
}
