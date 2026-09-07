/**
 * KYCAR — Registre normatif des 77 filtres retenus + `atype` non exposé (lot D5)
 * =================================================================================================
 * Source de vérité pour CE fichier : `docs/requirements/draft-screens.md` §4 (`EX-SCR-55`…`103`),
 * table d'affectation `EX-SCR-82` (groupe visuel KYCAR, classe T/R/D, exposition), croisée avec
 * `data/reference/filters-scope.json` (id/param/label/type/group/dependencies bruts, 77 retenus) et
 * `data/reference/filters.json` (domaines énumérés et numériques, déjà en français — vérifié
 * exhaustivement : chaque code utilisé par un filtre retenu porte un `label_fr`, aucune lacune
 * `EX-NFR-29` à combler par une table de dérogation séparée en v1).
 *
 * DÉCISION DE LOT — pourquoi ce fichier n'utilise PAS `ReferenceData.vocabularies` (D2) pour les
 * libellés d'option : les vocabulaires nommés de D2 décodent des CHAMPS de données (`Listing.*`),
 * pas nécessairement le domaine exact d'un PARAMÈTRE DE RECHERCHE. Deux collisions le prouvent :
 *   - `pe_category` (filtre, 3 niveaux `1..3` "Très bon prix"…) IS DISTINCT de
 *     `KYCAR_PRICE_EVALUATION` (vocabulaire D2, 6 niveaux `0..5`, verdict d'outlier calculé) ;
 *   - `ustate` (filtre, 3 valeurs composites `"N,U"`/`"A,N,U"`/`"A"`) IS DISTINCT de
 *     `KYCAR_USAGE_STATE` (vocabulaire D2, 3 codes simples `A`/`N`/`U` d'un champ `Listing`).
 * D5 possède donc son propre domaine d'option par filtre, sourcé une fois depuis `filters.json`,
 * plutôt que de risquer une confusion silencieuse entre deux vocabulaires homonymes.
 *
 * DIVERGENCE SIGNALÉE (non silencieuse) — groupe visuel : `filters-scope.json` porte un champ
 * `group` plus grossier (ex. tous les filtres de financement/leasing y sont classés `prix`) que la
 * colonne « Groupe KYCAR » de la table normative `EX-SCR-82` (qui les classe `Financement et
 * leasing`, distinct de `Prix et valeur`). `EX-SCR-72bis` dit pourtant que le champ `group` de
 * `filters-scope.json` « désigne le groupe visuel ». Ce fichier retient la colonne `EX-SCR-82`
 * (plus fine, explicitement normative filtre par filtre) plutôt que le champ `group` brut, car
 * `EX-SCR-93` (ordre des groupes) énumère nommément « Financement et leasing » et
 * « Fraîcheur et achat en ligne » comme groupes distincts — un ordre impossible à respecter si tous
 * ces filtres restaient regroupés sous `prix`/`divers`. Test de complétude ci-contre
 * (`filter-registry.test.ts`) vérifié contre `filters-scope.json` sur id/param/label/type/dépendances
 * uniquement (pas sur le champ `group` brut, sciemment resupplanté).
 */

import type { EnumOption, FilterDef, NumericDomain } from './filter-types';

/* ================================================================================================
 * Groupes visuels (EX-SCR-93 — ordre normatif, stable, indépendant des filtres actifs)
 * ============================================================================================== */

export const GROUP_ORDER: readonly string[] = [
  'vehicule',
  'vehicule_taxonomie',
  'prix',
  'kilometrage',
  'immatriculation',
  'motorisation',
  'carrosserie',
  'ecologie',
  'equipements',
  'etat_historique',
  'vendeur',
  'geographie',
  'financement',
  'fraicheur',
  'tri', // écrans A/D, hors accordéon du bandeau (contrôle de tri dédié)
  'liste_annonces', // écran D uniquement (page/size)
];

export const GROUP_LABELS: Readonly<Record<string, string>> = {
  vehicule: 'Véhicule',
  vehicule_taxonomie: 'Véhicule (taxonomie)',
  prix: 'Prix et valeur',
  kilometrage: 'Kilométrage',
  immatriculation: 'Immatriculation et année',
  motorisation: 'Motorisation',
  carrosserie: 'Carrosserie et habitacle',
  ecologie: 'Écologie et électrique',
  equipements: 'Équipements',
  etat_historique: 'État et historique',
  vendeur: 'Vendeur',
  geographie: 'Géographie',
  financement: 'Financement et leasing',
  fraicheur: 'Fraîcheur et achat en ligne',
  tri: 'Tri',
  liste_annonces: "Liste d'annonces",
};

/* ================================================================================================
 * Aides de construction des options énumérées (libellés FR déjà résolus, EX-NFR-29/30)
 * ============================================================================================== */

function opts(pairs: ReadonlyArray<readonly [string | number, string]>): EnumOption[] {
  return pairs.map(([code, label]) => ({ code: String(code), label }));
}

const OFFER_OPTS = opts([
  ['N', 'Neuf'],
  ['U', 'Occasion'],
  ['J', "Voiture récente"],
  ['O', 'Ancêtre'],
  ['D', 'Voiture de démonstration'],
  ['S', 'Pré-enregistrement'],
]);

const PE_CATEGORY_OPTS = opts([
  [1, 'Très bon prix'],
  [2, 'Bon prix'],
  [3, 'Prix correct'],
]);

const LEASING_TARGET_GROUP_OPTS = opts([
  ['private', 'Particulier'],
  ['business', 'Entreprise'],
  ['private&business', 'Particulier/entreprise'],
]);

const FUEL_OPTS = opts([
  ['2', 'Electrique/Essence'],
  ['3', 'Electrique/Diesel'],
  ['B', 'Essence'],
  ['C', 'CNG'],
  ['D', 'Diesel'],
  ['E', 'Electrique'],
  ['H', 'Hydrogène'],
  ['L', 'GPL'],
  ['M', 'Ethanol'],
  ['O', 'Autres'],
]);

const POWER_TYPE_OPTS = opts([
  ['kw', 'kW'],
  ['hp', 'CH'],
]);

const CYLINDERS_OPTS = opts([
  ['3', '3 cylindres'],
  ['4', '4 cylindres'],
  ['6', '6 cylindres'],
  ['8', '8 cylindres'],
  ['10plus', '10+ cylindres'],
]);

const DRIVE_TRAIN_OPTS = opts([
  ['4', '4x4'],
  ['F', 'Avant'],
  ['R', 'Arrière'],
]);

const GEAR_OPTS = opts([
  ['A', 'Boîte automatique'],
  ['M', 'Boîte manuelle'],
  ['S', 'Semi-automatique'],
]);

const BODY_TYPE_OPTS = opts([
  [1, 'Citadine'],
  [2, 'Cabriolet'],
  [3, 'Coupé'],
  [4, 'SUV/4x4/Pick-Up'],
  [5, 'Break'],
  [6, 'Berline'],
  [12, 'Monospace'],
  [13, 'Utilitaire'],
  [7, 'Autres'],
]);

const BODY_COLOR_OPTS = opts([
  [1, 'Beige'],
  [2, 'Bleu'],
  [3, 'Brun'],
  [4, 'Bronze'],
  [5, 'Jaune'],
  [6, 'Gris'],
  [7, 'Vert'],
  [10, 'Rouge'],
  [11, 'Noir'],
  [12, 'Argent'],
  [13, 'Mauve'],
  [14, 'Blanc'],
  [15, 'Orange'],
  [16, 'Or'],
]);

const PAINTWORK_OPTS = opts([
  ['M', 'Métallisé'],
  ['O', 'Autres'],
  ['P', 'Nacré'],
  ['S', 'Mica'],
  ['U', 'Uni'],
]);

const INTERIOR_COLOR_OPTS = opts([
  [1, 'Beige'],
  [2, 'Noir'],
  [3, 'Gris'],
  [4, 'Brun'],
  [5, 'Autres'],
  [6, 'Bleu'],
  [7, 'Rouge'],
  [8, 'Vert'],
  [9, 'Jaune'],
  [10, 'Orange'],
  [11, 'Blanc'],
]);

const UPHOLSTERY_OPTS = opts([
  ['AL', 'Alcantara'],
  ['CL', 'Tissu'],
  ['FL', 'Cuir'],
  ['OT', 'Autres'],
  ['PL', 'Cuir partiel'],
  ['VL', 'Velours'],
]);

const EMISSION_CLASS_OPTS = opts([
  [1, 'Euro 1'],
  [2, 'Euro 2'],
  [3, 'Euro 3'],
  [4, 'Euro 4'],
  [5, 'Euro 5'],
  [6, 'Euro 6'],
  [11, 'Euro 6b'],
  [7, 'Euro 6c'],
  [8, 'Euro 6d'],
  [9, 'Euro 6d-TEMP'],
  [10, 'Euro 6e'],
]);

const EMISSION_STICKER_OPTS = opts([
  [1, 'Aucune classification environnementale'],
  [2, 'min. 2 (Rouge)'],
  [3, 'min. 3 (Jaune)'],
  [4, 'min. 4 (Vert)'],
  [5, 'min. 5 (Bleu)'],
]);

const BATTERY_OWNERSHIP_OPTS = opts([
  [1, 'Incluse'],
  [2, 'Louée'],
  [3, 'Sans batterie'],
]);

/** Équipements (`eq`, 136 valeurs) — `data/reference/filters.json#filters[id=equipment].domain`. */
const EQUIPMENT_PAIRS: ReadonlyArray<readonly [number, string]> = [
  [187, '360° caméra'], [11, '4x4'], [1, 'ABS'], [134, 'Accoudoir'],
  [123, 'Affichage tête haute'], [40, 'Aides au stationnement'], [45, 'Airbag arrière'],
  [46, 'Airbag avant'], [2, 'Airbag conducteur'], [3, 'Airbag passager'],
  [32, 'Airbags latéraux'], [18, 'Alarme'], [157, "Alerte de franchissement involontaire de lignes"],
  [222, 'Android Auto'], [26, 'Anti-démarrage'], [31, 'Anti-patinage'], [221, 'Apple CarPlay'],
  [148, "Assistant au freinage d'urgence"], [137, 'Assistant de démarrage en côte'],
  [147, 'Assistant de vision nocturne'], [189, 'Assistant feux de route'], [20, 'Attache remorque'],
  [174, 'Auvent'], [158, "Avertisseur d'angle mort"], [122, 'Bluetooth'],
  [130, "Caméra d'aide au stationnement"], [129, "Capteurs d'aide au stationnement arrière"],
  [128, "Capteurs d'aide au stationnement avant"], [132, 'CD'], [251, 'Certificat de batterie'],
  [250, 'Charge bidirectionnelle'], [223, 'Chargeur smartphone à induction'],
  [52, 'Chauffage auxiliaire'], [5, 'Climatisation'], [30, 'Climatisation automatique'],
  [242, 'Climatisation automatique, 3 zones'], [243, 'Climatisation automatique, 4 zones'],
  [241, 'Climatisation automatique, bi-zone'], [156, 'Commande vocale'], [173, 'Compatible E-10'],
  [48, 'Conduite à droite'], [44, 'Coupe vent (pour cabriolet)'], [238, 'Déflecteur'],
  [126, 'Détecteur de lumière'], [127, 'Détecteur de pluie'], [162, 'Détection des panneaux routiers'],
  [12, 'Direction assistée'], [124, 'Dispositif mains libres'], [219, "Éclairage d'ambiance"],
  [224, 'Écran multifonction entièrement numérique'], [159, 'Ecran tactile'],
  [36, 'Equipement handicapé'], [42, 'ESP'], [19, 'Feux anti-brouillard'],
  [214, 'Feux de route non éblouissants'], [160, 'Fonction TV'], [170, 'Fonctionne au biodiesel'],
  [240, 'Frein de stationnement électronique'], [139, 'Hayon arrière électrique'],
  [220, 'Hotspot Wi-Fi'], [125, 'Isofix'], [212, 'Jantes acier'], [15, 'Jantes alliage'],
  [217, 'Kit de dépannage'], [218, 'Kit fumeur'], [141, 'LED phare de jour'],
  [227, 'Limiteur de vitesse'], [43, 'MP3'], [41, 'Ordinateur de bord'], [231, 'Pack hiver'],
  [112, 'Pack Sport'], [151, 'Palettes de changement de vitesses'], [135, 'Pare-brise chauffant'],
  [140, 'Phares au LED'], [39, 'Phares au Xénon'], [230, 'Phares bi-xénon'], [115, 'Phares de jour'],
  [118, 'Phares directionnels'], [239, 'Phares Full LED'], [213, 'Phares laser'], [210, 'Pneus été'],
  [25, 'Pneus neige'], [211, 'Pneus tout temps saisons'], [249, 'Pompe à chaleur'],
  [152, 'Porte coulissante'], [245, 'Porte coulissante droite'], [244, 'Porte coulissante gauche'],
  [27, 'Porte-bagages'], [29, 'Pot catalytique'], [237, "Prolongateur d'autonomie"], [10, 'Radio'],
  [138, 'Radio numérique'], [233, 'Réglage électrique du siège arrière'],
  [133, 'Régulateur de distance'], [38, 'Régulateur de vitesse'],
  [225, "Rétroviseur intérieur anti-éblouissement automatique"],
  [121, 'Rétroviseurs latéraux électriques'], [215, 'Roue de secours'], [216, 'Roue de urgence'],
  [6, 'Sellerie cuir'], [226, 'Séparateur pour coffre'], [143, 'Siège à réglage lombaire'],
  [229, 'Siège passager repliable'], [248, 'Sièges arrière chauffant'],
  [21, 'Sièges arrières 1/3 - 2/3'], [34, 'Sièges chauffants'], [16, 'Sièges électriques'],
  [145, 'Sièges massants'], [117, 'Sièges sport'], [154, 'Sièges ventilés'], [155, 'Soundsystem'],
  [113, 'Start/Stop automatique'], [228, 'Streaming audio intégré'], [144, 'Suspension pneumatique'],
  [116, 'Suspension sport'], [131, "Système d'aide au stationnement automatique"],
  [149, "Système d'appel d'urgence"], [232, "Système d'avertissement de distance"],
  [150, 'Système de contrôle de la pression pneus'],
  [146, 'Système de détection de la somnolence'], [23, 'Système de navigation'],
  [190, 'Système de nettoyage des phares'], [111, 'Taxi ou voiture de location'],
  [4, 'Toit ouvrant'], [50, 'Toit panoramique'], [119, 'Trappe à ski'], [28, 'Tuning'],
  [161, 'USB'], [17, 'Verrouillage centralisé'], [47, 'Verrouillage centralisé avec télécommande'],
  [153, 'Verrouillage centralisé sans clé'], [13, 'Vitres électriques'], [54, 'Vitres teintées'],
  [136, 'Volant chauffant'], [142, 'Volant en cuir'], [114, 'Volant multifonctions'],
];
const EQUIPMENT_OPTS = opts(EQUIPMENT_PAIRS);

const USAGE_STATE_OPTS = opts([
  ['N,U', 'Ne pas montrer'],
  ['A,N,U', 'Montrer aussi'],
  ['A', 'Montrer seulement'],
]);

const DAMAGED_LISTING_OPTS = opts([
  ['exclude', 'Ne pas montrer'],
  ['include', 'Montrer aussi'],
  ['damaged-only', 'Montrer seulement'],
]);

const NUMBER_OF_OWNERS_OPTS = opts([
  [1, '1'],
  [2, '2'],
  [3, '3'],
  [4, '4+'],
]);

/** Labels (label programme) — `data/reference/filters.json#filters[id=seals].domain`. */
const SEALS_OPTS = opts([
  [249, 'BMW Motorrad Premium Selection'],
  [247, 'Hyundai H PROMISE'],
  [216, 'Ford Approved'],
  [156, 'Opel Select'],
  [134, 'Peugeot Occasions'],
  [118, 'My Way'],
  [271, 'Aston Martin Timeless'],
  [112, 'Jaguar Approved'],
  [295, 'Lamborghini Certified Pre-Owned'],
  [315, 'Porsche Approved'],
  [111, 'Land Rover Approved'],
  [223, 'Bentley PRE-OWNED'],
  [226, 'Audi Approved Plus'],
  [241, 'KIA Used Cars'],
]);

const SELLER_TYPE_OPTS = opts([
  ['P', 'Particulier'],
  ['D', 'Professionnel'],
]);

const COUNTRY_TYPE_OPTS = opts([
  ['A', 'Autriche'],
  ['B', 'Belgique'],
  ['D', 'Allemagne'],
  ['E', 'Espagne'],
  ['F', 'France'],
  ['I', 'Italie'],
  ['L', 'Luxembourg'],
  ['NL', 'Pays-Bas'],
  // Code "" (« Europe », absence de restriction) exclu du domaine sélectionnable : voir
  // note de lot plus bas (RADIUS_OPTS) — une valeur qui SIGNIFIE « pas de filtre » ne peut
  // pas cohabiter avec la règle EX-NAV-8 (jamais de code vide sérialisé) sans ambiguïté.
]);

const RADIUS_KM: readonly number[] = [10, 20, 50, 100, 150, 200, 250, 300, 400];
const RADIUS_OPTS = opts(RADIUS_KM.map((km) => [km, `${km} km`] as const));

const OCS_LISTING_OPTS = opts([
  ['ocs-only', 'Uniquement achat en ligne'],
  ['include', 'Inclure'],
  ['exclude', 'Exclure'],
]);

/** `sort` — tri AS24, écran D uniquement (distinct du `sort` d'état d'interface écran A, EX-NAV-10bis). */
const SORT_TYPES_OPTS = opts([
  ['standard', 'Résultats standards'],
  ['price', 'Prix'],
  ['year', 'Année'],
  ['mileage', 'Kilométrage'],
  ['power', 'Puissance'],
  ['make', 'Marque/Modèle'],
  ['distance', 'Selon la distance'],
  // 'age' (tri par ancienneté d'annonce) retiré : aucune date de publication relevée (EX-SCR-219).
  // 'financerate' / 'leasing_rate' retirés : désactivés sur BE (EX-SCR-82 #77).
]);

const DESC_TYPE_OPTS = opts([
  ['0', 'Ordre croissant'],
  ['1', 'Ordre décroissant'],
]);

/* ================================================================================================
 * Domaines numériques (EX-SCR-67), sourcés une fois de `filters.json`
 * ============================================================================================== */

const PRICE_DOMAIN: NumericDomain = {
  min: 500,
  max: 100000,
  freeInput: true,
  steps: [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12500, 15000, 17500, 20000, 25000, 30000, 40000, 50000, 75000, 100000],
};
const FINANCE_RATE_DOMAIN: NumericDomain = { steps: [50, 100, 200, 300, 400, 500, 600, 700] };
const LEASING_DURATION_DOMAIN: NumericDomain = { steps: [12, 24, 36, 48, 60, 72] };
const LEASING_MILEAGE_DOMAIN: NumericDomain = { steps: [10000, 15000, 20000, 25000, 30000] };
const MILEAGE_DOMAIN: NumericDomain = {
  freeInput: true,
  steps: [2500, 5000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 125000, 150000, 175000, 200000],
};
const REGISTRATION_YEAR_DOMAIN: NumericDomain = { min: 1900, max: 2026 };
const MODEL_YEAR_DOMAIN: NumericDomain = { min: 1900, max: 2027 };
/** Puissance et cylindrée : aucun min/max relevé (filters.json). Plancher physique 0, non borné en haut. */
const POWER_DOMAIN: NumericDomain = { min: 0 };
const ENGINE_SIZE_DOMAIN: NumericDomain = { min: 0 };
const DOOR_DOMAIN: NumericDomain = { min: 2, max: 7 };
const SEATS_DOMAIN: NumericDomain = { min: 1, max: 12 };
const ELECTRIC_RANGE_DOMAIN: NumericDomain = { steps: [80, 120, 180, 250, 350, 450, 550] };
/** Coordonnées géographiques : bornes mathématiques universelles, pas un relevé filters.json. */
const LATITUDE_DOMAIN: NumericDomain = { min: -90, max: 90 };
const LONGITUDE_DOMAIN: NumericDomain = { min: -180, max: 180 };
const PAGE_DOMAIN: NumericDomain = { min: 1, max: 20 };
/** `pageSize` : un seul palier observé (20) dans le relevé ; borne haute large pragmatique, non relevée. */
const PAGE_SIZE_DOMAIN: NumericDomain = { min: 1, max: 100 };

/* ================================================================================================
 * Le registre : 77 filtres retenus + `atype` (RETENU, NON_EXPOSE) — table EX-SCR-82
 * ============================================================================================== */

/** Champs communs par défaut, pour alléger la déclaration littérale ci-dessous. */
function def(partial: Omit<FilterDef, 'dependencies' | 'primary'> & {
  readonly dependencies?: readonly string[];
  readonly primary?: boolean;
}): FilterDef {
  return {
    dependencies: partial.dependencies ?? [],
    primary: partial.primary ?? false,
    ...partial,
  };
}

export const FILTER_DEFS: readonly FilterDef[] = [
  // --- Véhicule ------------------------------------------------------------------------------
  def({ id: 'articleType', param: 'atype', label: 'Type de véhicule', group: 'vehicule', scopeType: 'enum_single', control: 'none', cls: 'T', nonExposed: true }),
  def({ id: 'makesModelsVariants', param: 'mmmv', label: 'Marque / Modèle / Version', group: 'vehicule', scopeType: 'structured_multi', control: 'structured-picker', cls: 'R', primary: true }),
  def({ id: 'vkhFilters', param: 'cat', label: 'Catégorie taxonomique (nouvelle taxonomie)', group: 'vehicule_taxonomie', scopeType: 'structured_multi', control: 'structured-picker', cls: 'T', dependencies: ['makesModelsVariants'], disabledReason: 'Branche taxonomique inactive à la source (newTaxonomyAvailable = false)' }),
  def({ id: 'vkhFiltersModelCat', param: 'mcat', label: 'Catégorie modèle (nouvelle taxonomie)', group: 'vehicule_taxonomie', scopeType: 'structured_multi', control: 'structured-picker', cls: 'T', dependencies: ['vkhFilters'], disabledReason: 'Branche taxonomique inactive à la source (newTaxonomyAvailable = false)' }),
  def({ id: 'version', param: 'version0', label: 'Version / finition', group: 'vehicule', scopeType: 'text', control: 'text-field', cls: 'T', dependencies: ['makesModelsVariants'] }),
  def({ id: 'offer', param: 'offer', label: "Type d'annonce / état du véhicule", group: 'etat_historique', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'T', options: OFFER_OPTS }),
  def({ id: 'keyword', param: 'kwd', label: 'Recherche par mots-clés', group: 'vehicule', scopeType: 'text', control: 'text-field', cls: 'T', primary: true }),

  // --- Prix et valeur --------------------------------------------------------------------------
  def({ id: 'priceFrom', param: 'pricefrom', label: 'Prix de', group: 'prix', scopeType: 'range_min', control: 'range-pair', cls: 'R', primary: true, pairedWith: 'priceTo', numericDomain: PRICE_DOMAIN, unit: 'EUR' }),
  def({ id: 'priceTo', param: 'priceto', label: 'Prix à', group: 'prix', scopeType: 'range_max', control: 'range-pair', cls: 'R', primary: true, pairedWith: 'priceFrom', numericDomain: PRICE_DOMAIN, unit: 'EUR' }),
  def({ id: 'vatReportable', param: 'vatded', label: 'TVA déductible / récupérable', group: 'prix', scopeType: 'boolean', control: 'boolean-toggle', cls: 'R', booleanTrueCode: '1' }),
  def({ id: 'superDeal', param: 'superdeal', label: 'SuperDeal', group: 'prix', scopeType: 'boolean', control: 'boolean-toggle', cls: 'R', booleanTrueCode: '1' }),
  def({ id: 'priceEvaluation', param: 'pe_category', label: 'Évaluation du prix', group: 'prix', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'R', options: PE_CATEGORY_OPTS }),
  def({ id: 'tradeIn', param: 'tradeIn', label: 'Reprise de mon véhicule', group: 'prix', scopeType: 'boolean', control: 'boolean-toggle', cls: 'T', booleanTrueCode: '1' }),

  // --- Financement et leasing --------------------------------------------------------------------
  def({ id: 'financeRateFrom', param: 'financeratefrom', label: 'Mensualité de financement de', group: 'financement', scopeType: 'range_min', control: 'range-pair', cls: 'T', pairedWith: 'financeRateTo', numericDomain: FINANCE_RATE_DOMAIN, unit: 'EUR/mois' }),
  def({ id: 'financeRateTo', param: 'financerateto', label: 'Mensualité de financement à', group: 'financement', scopeType: 'range_max', control: 'range-pair', cls: 'T', pairedWith: 'financeRateFrom', numericDomain: FINANCE_RATE_DOMAIN, unit: 'EUR/mois' }),
  def({ id: 'hasLeasing', param: 'hasleasing', label: 'Offre de leasing disponible', group: 'financement', scopeType: 'boolean', control: 'boolean-toggle', cls: 'T', booleanTrueCode: '1' }),
  def({ id: 'leasingRateFrom', param: 'leasingratefrom', label: 'Loyer de leasing de', group: 'financement', scopeType: 'range_min', control: 'range-pair', cls: 'T', pairedWith: 'leasingRateTo', dependencies: ['hasLeasing'], numericDomain: FINANCE_RATE_DOMAIN, unit: 'EUR/mois' }),
  def({ id: 'leasingRateTo', param: 'leasingrateto', label: 'Loyer de leasing à', group: 'financement', scopeType: 'range_max', control: 'range-pair', cls: 'T', pairedWith: 'leasingRateFrom', dependencies: ['hasLeasing'], numericDomain: FINANCE_RATE_DOMAIN, unit: 'EUR/mois' }),
  def({ id: 'leasingDurationFrom', param: 'lsdufrom', label: 'Durée de leasing de', group: 'financement', scopeType: 'range_min', control: 'range-pair', cls: 'T', pairedWith: 'leasingDurationTo', dependencies: ['hasLeasing'], numericDomain: LEASING_DURATION_DOMAIN, unit: 'mois' }),
  def({ id: 'leasingDurationTo', param: 'lsduto', label: 'Durée de leasing à', group: 'financement', scopeType: 'range_max', control: 'range-pair', cls: 'T', pairedWith: 'leasingDurationFrom', dependencies: ['hasLeasing'], numericDomain: LEASING_DURATION_DOMAIN, unit: 'mois' }),
  def({ id: 'leasingYearlyIncludedMileageFrom', param: 'lsyeinmifrom', label: 'Kilométrage annuel inclus (min)', group: 'financement', scopeType: 'range_min', control: 'range-single', cls: 'T', dependencies: ['hasLeasing'], numericDomain: LEASING_MILEAGE_DOMAIN, unit: 'km/an' }),
  def({ id: 'leasingTradeInBonus', param: 'lstrinbo', label: 'Bonus de reprise (leasing)', group: 'financement', scopeType: 'boolean', control: 'boolean-toggle', cls: 'T', dependencies: ['hasLeasing'], booleanTrueCode: '1' }),
  def({ id: 'leasingEnvironmentBonus', param: 'lsenbo', label: 'Bonus écologique (leasing)', group: 'financement', scopeType: 'boolean', control: 'boolean-toggle', cls: 'T', dependencies: ['hasLeasing'], booleanTrueCode: '1' }),
  def({ id: 'leasingAvailableNow', param: 'lsavno', label: 'Disponible immédiatement (leasing)', group: 'financement', scopeType: 'boolean', control: 'boolean-toggle', cls: 'T', dependencies: ['hasLeasing'], booleanTrueCode: '1' }),
  def({ id: 'leasingTargetGroup', param: 'lstagr', label: 'Groupe cible du leasing', group: 'financement', scopeType: 'enum_single', control: 'select-indifferent', cls: 'T', dependencies: ['hasLeasing'], options: LEASING_TARGET_GROUP_OPTS }),
  def({ id: 'governmentBonus', param: 'efeg', label: "Prime à l'achat / bonus étatique", group: 'financement', scopeType: 'boolean', control: 'boolean-toggle', cls: 'T', booleanTrueCode: '1' }),

  // --- Kilométrage -----------------------------------------------------------------------------
  def({ id: 'mileageFrom', param: 'kmfrom', label: 'Kilométrage de', group: 'kilometrage', scopeType: 'range_min', control: 'range-pair', cls: 'R', primary: true, pairedWith: 'mileageTo', numericDomain: MILEAGE_DOMAIN, unit: 'km' }),
  def({ id: 'mileageTo', param: 'kmto', label: 'Kilométrage à', group: 'kilometrage', scopeType: 'range_max', control: 'range-pair', cls: 'R', primary: true, pairedWith: 'mileageFrom', numericDomain: MILEAGE_DOMAIN, unit: 'km' }),

  // --- Immatriculation et année ------------------------------------------------------------------
  def({ id: 'dateOfRegistrationFrom', param: 'fregfrom', label: 'Première immatriculation de', group: 'immatriculation', scopeType: 'range_min', control: 'range-pair', cls: 'R', primary: true, pairedWith: 'dateOfRegistrationTo', numericDomain: REGISTRATION_YEAR_DOMAIN, unit: 'année' }),
  def({ id: 'dateOfRegistrationTo', param: 'fregto', label: 'Première immatriculation à', group: 'immatriculation', scopeType: 'range_max', control: 'range-pair', cls: 'R', primary: true, pairedWith: 'dateOfRegistrationFrom', numericDomain: REGISTRATION_YEAR_DOMAIN, unit: 'année' }),
  def({ id: 'dateOfModelYearFrom', param: 'modelyearfrom', label: 'Année-modèle de', group: 'immatriculation', scopeType: 'range_min', control: 'range-pair', cls: 'R', pairedWith: 'dateOfModelYearTo', numericDomain: MODEL_YEAR_DOMAIN, unit: 'année' }),
  def({ id: 'dateOfModelYearTo', param: 'modelyearto', label: 'Année-modèle à', group: 'immatriculation', scopeType: 'range_max', control: 'range-pair', cls: 'R', pairedWith: 'dateOfModelYearFrom', numericDomain: MODEL_YEAR_DOMAIN, unit: 'année' }),

  // --- Motorisation ------------------------------------------------------------------------------
  def({ id: 'fuelType', param: 'fuel', label: 'Carburant', group: 'motorisation', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'R', primary: true, options: FUEL_OPTS }),
  def({ id: 'powerType', param: 'powertype', label: 'Unité de puissance', group: 'motorisation', scopeType: 'enum_single', control: 'radio-segmented', cls: 'R', options: POWER_TYPE_OPTS }),
  def({ id: 'powerFrom', param: 'powerfrom', label: 'Puissance de', group: 'motorisation', scopeType: 'range_min', control: 'range-pair', cls: 'R', pairedWith: 'powerTo', dependencies: ['powerType'], numericDomain: POWER_DOMAIN }),
  def({ id: 'powerTo', param: 'powerto', label: 'Puissance à', group: 'motorisation', scopeType: 'range_max', control: 'range-pair', cls: 'R', pairedWith: 'powerFrom', dependencies: ['powerType'], numericDomain: POWER_DOMAIN }),
  def({ id: 'engineMotorSizeFrom', param: 'ccmfrom', label: 'Cylindrée de', group: 'motorisation', scopeType: 'range_min', control: 'range-pair', cls: 'T', pairedWith: 'engineMotorSizeTo', numericDomain: ENGINE_SIZE_DOMAIN, unit: 'cm3' }),
  def({ id: 'engineMotorSizeTo', param: 'ccmto', label: 'Cylindrée à', group: 'motorisation', scopeType: 'range_max', control: 'range-pair', cls: 'T', pairedWith: 'engineMotorSizeFrom', numericDomain: ENGINE_SIZE_DOMAIN, unit: 'cm3' }),
  def({ id: 'engineType', param: 'cylinders', label: 'Nombre de cylindres', group: 'motorisation', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'T', options: CYLINDERS_OPTS }),
  def({ id: 'driveTrain', param: 'dtrain', label: 'Transmission (roues motrices)', group: 'motorisation', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'T', options: DRIVE_TRAIN_OPTS }),
  def({ id: 'gearType', param: 'gear', label: 'Boîte de vitesses', group: 'motorisation', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'T', primary: true, options: GEAR_OPTS }),
  def({ id: 'newDriver', param: 'newdriver', label: 'Pour les nouveaux conducteurs', group: 'motorisation', scopeType: 'boolean', control: 'boolean-toggle', cls: 'T', booleanTrueCode: '1' }),

  // --- Carrosserie et habitacle -----------------------------------------------------------------
  def({ id: 'bodyType', param: 'body', label: 'Carrosserie', group: 'carrosserie', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'DYNAMIC_BODY', primary: true, options: BODY_TYPE_OPTS }),
  def({ id: 'doorFrom', param: 'doorfrom', label: 'Nombre de portes (min)', group: 'carrosserie', scopeType: 'range_min', control: 'range-pair', cls: 'T', pairedWith: 'doorTo', numericDomain: DOOR_DOMAIN }),
  def({ id: 'doorTo', param: 'doorto', label: 'Nombre de portes (max)', group: 'carrosserie', scopeType: 'range_max', control: 'range-pair', cls: 'T', pairedWith: 'doorFrom', numericDomain: DOOR_DOMAIN }),
  def({ id: 'numberOfSeatsFrom', param: 'seatsfrom', label: 'Nombre de places (min)', group: 'carrosserie', scopeType: 'range_min', control: 'range-pair', cls: 'T', pairedWith: 'numberOfSeatsTo', numericDomain: SEATS_DOMAIN }),
  def({ id: 'numberOfSeatsTo', param: 'seatsto', label: 'Nombre de places (max)', group: 'carrosserie', scopeType: 'range_max', control: 'range-pair', cls: 'T', pairedWith: 'numberOfSeatsFrom', numericDomain: SEATS_DOMAIN }),
  def({ id: 'bodyColor', param: 'bcol', label: 'Couleur extérieure', group: 'carrosserie', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'T', options: BODY_COLOR_OPTS }),
  def({ id: 'paintwork', param: 'ptype', label: 'Type de peinture', group: 'carrosserie', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'T', options: PAINTWORK_OPTS }),
  def({ id: 'interiorColor', param: 'icol', label: 'Couleur intérieure', group: 'carrosserie', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'T', options: INTERIOR_COLOR_OPTS }),
  def({ id: 'upholstery', param: 'uph', label: 'Revêtement / sellerie', group: 'carrosserie', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'T', options: UPHOLSTERY_OPTS }),

  // --- Écologie et électrique ----------------------------------------------------------------------
  def({ id: 'emissionClass', param: 'emclass', label: "Norme Euro / classe d'émission", group: 'ecologie', scopeType: 'enum_single', control: 'select-indifferent', cls: 'T', options: EMISSION_CLASS_OPTS, semanticsWarning: 'AT_LEAST_PRESUMED' }),
  def({ id: 'emissionSticker', param: 'ensticker', label: 'Vignette environnementale', group: 'ecologie', scopeType: 'enum_single', control: 'select-indifferent', cls: 'T', options: EMISSION_STICKER_OPTS, semanticsWarning: 'AT_LEAST_PRESUMED' }),
  def({ id: 'batteryOwnershipType', param: 'bot', label: 'Propriété de la batterie', group: 'ecologie', scopeType: 'enum_single', control: 'select-indifferent', cls: 'T', dependencies: ['fuelType'], options: BATTERY_OWNERSHIP_OPTS }),
  def({ id: 'electricRangeFrom', param: 'erfrom', label: 'Autonomie électrique de', group: 'ecologie', scopeType: 'range_min', control: 'range-pair', cls: 'T', pairedWith: 'electricRangeTo', dependencies: ['fuelType'], numericDomain: ELECTRIC_RANGE_DOMAIN, unit: 'km' }),
  def({ id: 'electricRangeTo', param: 'erto', label: 'Autonomie électrique à', group: 'ecologie', scopeType: 'range_max', control: 'range-pair', cls: 'T', pairedWith: 'electricRangeFrom', dependencies: ['fuelType'], numericDomain: ELECTRIC_RANGE_DOMAIN, unit: 'km' }),

  // --- Équipements ---------------------------------------------------------------------------------
  def({ id: 'equipment', param: 'eq', label: 'Équipement', group: 'equipements', scopeType: 'enum_multi', control: 'panel-search-multi', cls: 'T', options: EQUIPMENT_OPTS, semanticsWarning: 'EQ_AND_PRESUMED' }),

  // --- État et historique --------------------------------------------------------------------------
  def({ id: 'hadAccident', param: 'ustate', label: 'Véhicule accidenté (BE/EU)', group: 'etat_historique', scopeType: 'enum_single', control: 'select-indifferent', cls: 'T', options: USAGE_STATE_OPTS }),
  def({ id: 'hadAccidentNew', param: 'damaged_listing', label: 'Véhicule accidenté (variante récente)', group: 'etat_historique', scopeType: 'enum_single', control: 'radio-segmented', cls: 'D', options: DAMAGED_LISTING_OPTS, disabledReason: 'Rejeté par le marketplace belge (newAccidentFilter = false)' }),
  def({ id: 'numberOfOwners', param: 'prevownersid', label: 'Nombre de propriétaires précédents', group: 'etat_historique', scopeType: 'enum_single', control: 'select-indifferent', cls: 'R', options: NUMBER_OF_OWNERS_OPTS, semanticsWarning: 'AT_MOST_PRESUMED' }),
  def({ id: 'seals', param: 'sealor', label: "Label / programme d'occasion certifiée", group: 'etat_historique', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'T', dependencies: ['makesModelsVariants'], options: SEALS_OPTS }),

  // --- Vendeur ---------------------------------------------------------------------------------------
  def({ id: 'sellerType', param: 'custtype', label: 'Type de vendeur', group: 'vendeur', scopeType: 'enum_single', control: 'radio-segmented', cls: 'R', primary: true, options: SELLER_TYPE_OPTS }),

  // --- Géographie ------------------------------------------------------------------------------------
  def({ id: 'countryType', param: 'cy', label: 'Pays', group: 'geographie', scopeType: 'enum_multi', control: 'checkbox-list', cls: 'R', primary: true, options: COUNTRY_TYPE_OPTS }),
  def({ id: 'location', param: 'zip', label: 'Ville / code postal', group: 'geographie', scopeType: 'geo_text', control: 'geo-composite', cls: 'R' }),
  def({ id: 'radius', param: 'zipr', label: 'Rayon', group: 'geographie', scopeType: 'enum_single', control: 'select-indifferent', cls: 'T', dependencies: ['location'], options: RADIUS_OPTS }),
  def({ id: 'lat', param: 'lat', label: 'Latitude', group: 'geographie', scopeType: 'number', control: 'none', cls: 'T', dependencies: ['location'], numericDomain: LATITUDE_DOMAIN }),
  def({ id: 'lon', param: 'lon', label: 'Longitude', group: 'geographie', scopeType: 'number', control: 'none', cls: 'T', dependencies: ['location'], numericDomain: LONGITUDE_DOMAIN }),
  def({ id: 'region', param: 'region', label: 'Région / province', group: 'geographie', scopeType: 'text', control: 'text-field', cls: 'D', dependencies: ['countryType'], disabledReason: 'Domaine de valeurs non relevé et filtre désactivé à la source' }),
  def({ id: 'crossBorder', param: 'crossborder', label: 'Inclure les véhicules au-delà de la frontière', group: 'geographie', scopeType: 'boolean', control: 'boolean-toggle', cls: 'T', dependencies: ['location', 'radius'], booleanTrueCode: '1' }),

  // --- Fraîcheur et achat en ligne ---------------------------------------------------------------------
  def({ id: 'buyOnline', param: 'ot_osc', label: 'Achat en ligne (Smyle / OCS)', group: 'fraicheur', scopeType: 'boolean', control: 'boolean-toggle', cls: 'T', booleanTrueCode: '1' }),
  def({ id: 'ocsListing', param: 'ocs_listing', label: 'Annonces achat-en-ligne', group: 'fraicheur', scopeType: 'enum_single', control: 'select-indifferent', cls: 'T', options: OCS_LISTING_OPTS }),
  def({ id: 'deliverableInsertion', param: 'dlv_max', label: 'Offres avec livraison (portée max)', group: 'fraicheur', scopeType: 'text', control: 'text-field', cls: 'D', disabledReason: 'Domaine de valeurs non relevé' }),
  def({ id: 'smyleTail', param: 'dlv_tail', label: 'Élargir aux offres livrables', group: 'fraicheur', scopeType: 'boolean', control: 'boolean-toggle', cls: 'T', booleanTrueCode: '1' }),

  // --- Tri (écrans A et D — jamais coexistants, EX-NAV-10bis) -------------------------------------------
  def({ id: 'sortTypes', param: 'sort', label: 'Critère de tri', group: 'tri', scopeType: 'enum_single', control: 'select-indifferent', cls: 'R', options: SORT_TYPES_OPTS }),
  def({ id: 'descType', param: 'desc', label: 'Sens du tri', group: 'tri', scopeType: 'enum_single', control: 'radio-segmented', cls: 'R', dependencies: ['sortTypes'], options: DESC_TYPE_OPTS }),

  // --- Liste d'annonces (écran D uniquement) -----------------------------------------------------------
  def({ id: 'page', param: 'page', label: 'Page', group: 'liste_annonces', scopeType: 'number', control: 'number-field', cls: 'T', numericDomain: PAGE_DOMAIN }),
  def({ id: 'pageSize', param: 'size', label: 'Taille de page', group: 'liste_annonces', scopeType: 'number', control: 'number-field', cls: 'T', numericDomain: PAGE_SIZE_DOMAIN }),
];

/* ================================================================================================
 * Index dérivés
 * ============================================================================================== */

export const FILTER_BY_ID: ReadonlyMap<string, FilterDef> = new Map(FILTER_DEFS.map((d) => [d.id, d]));
export const FILTER_BY_PARAM: ReadonlyMap<string, FilterDef> = new Map(FILTER_DEFS.map((d) => [d.param, d]));

/** Filtres réellement exposés dans le bandeau (exclut `atype`, seul `NON_EXPOSE`). */
export const EXPOSED_FILTER_DEFS: readonly FilterDef[] = FILTER_DEFS.filter((d) => d.nonExposed !== true);

export const PRIMARY_FILTER_DEFS: readonly FilterDef[] = FILTER_DEFS.filter((d) => d.primary);

/** Filtres de classe D (désactivés, jamais sérialisés) — exactement 3 (EX-SCR-83). */
export const DISABLED_FILTER_IDS: ReadonlySet<string> = new Set(
  FILTER_DEFS.filter((d) => d.cls === 'D').map((d) => d.id),
);

/**
 * Résout la classe EFFECTIVE d'un filtre pour un mode d'écran donné. Seul `bodyType` est
 * dynamique (`EX-SCR-82` #44, `EX-SCR-221`) : `R` en mode 1 (modèle, `Model.bodyTypes`), `T` en
 * mode 2 (annonce, aucun champ local). Tous les autres filtres ont une classe fixe.
 */
export function resolveFilterClass(def: FilterDef, mode: 'mode1' | 'mode2'): 'T' | 'R' | 'D' {
  if (def.cls === 'DYNAMIC_BODY') return mode === 'mode1' ? 'R' : 'T';
  return def.cls;
}

/** L'ensemble des identifiants de classe `T` pour un mode donné (pour le codec D2, EX-SRCH-9bis). */
export function tFilterIds(mode: 'mode1' | 'mode2'): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const d of FILTER_DEFS) {
    if (d.nonExposed) continue; // atype : injecté par l'adaptateur, jamais un filtre utilisateur
    if (resolveFilterClass(d, mode) === 'T') ids.add(d.id);
  }
  return ids;
}

/** Vrai si `filterId` a une valeur non vide dans `selection` (posé). */
function isPosed(selection: Readonly<Record<string, unknown>>, filterId: string): boolean {
  const v = selection[filterId];
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.length > 0;
  return true;
}

/** Codes carburant électriques (`fuel`), pour la dépendance spéciale de `bot`/`erfrom`/`erto` (EX-SCR-73). */
const ELECTRIC_FUEL_CODES: ReadonlySet<string> = new Set(['2', '3', 'E']);

/**
 * Un filtre est actionnable si et seulement si ses dépendances sont satisfaites (`EX-SCR-73`,
 * `EX-SCR-88`(a)). Ne couvre PAS les conditions (b)-(d) d'`EX-SCR-88` (classe D, hors-ligne,
 * domaine dépendant vide) : celles-ci sont du ressort du composant, qui connaît le mode réseau et
 * le domaine résolu.
 */
export function isDependencySatisfied(def: FilterDef, selection: Readonly<Record<string, unknown>>): boolean {
  if (def.dependencies.length === 0) return true;
  if (def.id === 'batteryOwnershipType' || def.id === 'electricRangeFrom' || def.id === 'electricRangeTo') {
    const fuel = selection['fuelType'];
    const codes = Array.isArray(fuel) ? fuel.map(String) : fuel !== undefined && fuel !== null ? [String(fuel)] : [];
    return codes.some((c) => ELECTRIC_FUEL_CODES.has(c));
  }
  return def.dependencies.every((parentId) => isPosed(selection, parentId));
}
