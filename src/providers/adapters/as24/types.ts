/**
 * KYCAR — Couche SOURCE `As24Listing` (phase 3.3, adaptateur `as24 → canonique`)
 * =================================================================================================
 * Miroir TypeScript de `data/schema/as24-listing.schema.json` (`$id`
 * `https://kycar.local/schema/as24-listing/1.0.0`, draft 2020-12), décrit champ à champ par
 * `docs/data/DATA-MODEL.md` §2. Le SCHÉMA fait foi : ce module ne fait que le typer pour que
 * l'adaptateur lise des noms plutôt que des index, et il n'ajoute AUCUN champ.
 *
 * Six champs sont obligatoires (`id`, `webPage`, `marketplace`, `vehicleType`, `make`, `location`) ;
 * tout le reste est optionnel, parce qu'une annonce réelle a des trous et que la colonne « Obl. » du
 * dictionnaire — non l'inverse — fixe la nullabilité. **Un champ absent est une clé ABSENTE, jamais
 * `null`** (`DATASET-SPEC` §8.3 règle 2, `additionalProperties: false` partout).
 *
 * R3 STRUCTURELLE (`DATA-MODEL` §5) : aucun champ vendeur identifiant, aucun code postal exact,
 * aucune ville, aucune coordonnée, aucun texte libre d'annonce, aucune URL de média. `seller` n'a
 * que deux propriétés (`type`, `dealerBucket` pseudonyme) et `location` que deux
 * (`countryCode`, `postalCodePrefix2`). Ce type ne peut donc pas non plus les accueillir — mais le
 * type n'est pas la garde : la garde est `scanForbiddenFields`, appliquée à l'OBJET REÇU avant
 * toute adaptation (`adapt.ts`), parce qu'un JSON lu d'un fichier n'obéit à aucun type.
 *
 * Toutes les propriétés sont `readonly` : l'adaptateur ne mute jamais son entrée.
 */

/** `marketplace` — OAS `Marketplace`, 9 valeurs (D3-07 : la 9ᵉ est `ca`, le Canada). */
export type As24Marketplace = 'at' | 'be' | 'ca' | 'de' | 'es' | 'fr' | 'it' | 'lu' | 'nl';

/** Bloc `battery` (OAS `BatteryCommon`). */
export interface As24Battery {
  readonly ownershipType?: string;
  readonly capacity?: number;
  readonly capacityUnit?: string;
}

/** Bloc `consumption` — **branche NEDC** (exclusive du bloc `wltp`, C-13). */
export interface As24Consumption {
  readonly combined?: number;
  /** Déprécié par l'OpenAPI ; `wltp.consumptionElectricCombined` prime (# 52). */
  readonly electricCombined?: number;
}

/** Bloc `wltp` — **branche WLTP** (exclusive de `consumption` / `co2Emissions` / `efficiencyClass`). */
export interface As24Wltp {
  readonly co2EmissionsCombined?: number;
  readonly consumptionCombined?: number;
  readonly consumptionElectricCombined?: number;
  readonly co2Class?: number;
}

/** Bloc `prices.public` (OAS `PublicPrice`). */
export interface As24PublicPrice {
  readonly price?: number;
  readonly currency?: string;
  readonly netPrice?: number;
  readonly vatRate?: number;
  readonly isTaxDeductible?: boolean;
  readonly isNegotiable?: boolean;
  readonly onRequestOnly?: boolean;
  readonly evaluation?: { readonly category?: number };
}

/** Bloc `prices`. */
export interface As24Prices {
  readonly public?: As24PublicPrice;
  readonly manufacturersSuggestedRetail?: { readonly price: number; readonly currency: string };
}

/** Bloc `location` — R3 : deux propriétés, jamais davantage (D3-06). */
export interface As24Location {
  readonly countryCode: string;
  readonly postalCodePrefix2?: string;
}

/** Bloc `seller` — R3 : type de vendeur et clé pseudonyme de regroupement, rien d'autre (D3-02). */
export interface As24Seller {
  readonly type?: string;
  /** 8 hexadécimaux, hachage salé d'un identifiant FICTIF, non réversible. Ne franchit jamais
   *  l'interface `DataProvider` (aucune colonne, écart E-02) : il sert au dédoublonnage. */
  readonly dealerBucket?: string;
}

/** Une annonce à la forme AutoScout24 : une ligne du NDJSON d'un snapshot de fixtures. */
export interface As24Listing {
  // --- Identité, provenance, classification (§2.1) --------------------------------------------
  readonly id: string;
  readonly webPage: string;
  readonly marketplace: As24Marketplace | string;
  readonly vehicleType: string;
  readonly make: number;
  readonly makeName?: string;
  readonly model?: number;
  readonly modelName?: string;
  readonly modelVersion?: string;
  readonly productionYear?: number;
  readonly offerType?: string;
  readonly usageState?: string;
  readonly condition?: { readonly hadAccident?: boolean };
  readonly publication?: {
    readonly status?: string;
    readonly accurateState?: string;
    readonly isNew?: boolean;
  };
  readonly createdAt?: string;
  readonly lastUpdatedAt?: string;
  readonly firstActivatedDate?: string;

  // --- Prix (§2.2) -----------------------------------------------------------------------------
  readonly prices?: As24Prices;
  readonly superDeal?: boolean;

  // --- Motorisation, carburant, écologie (§2.3) ------------------------------------------------
  readonly power?: number;
  readonly powerUnit?: string;
  readonly powerHp?: number;
  readonly cylinderCapacity?: number;
  readonly cylinderCapacityUnit?: string;
  readonly cylinderCount?: number;
  readonly gearCount?: number;
  readonly transmission?: string;
  readonly drivetrain?: string;
  readonly fuelCategory?: string;
  readonly primaryFuelType?: number;
  readonly additionalFuelTypes?: readonly number[];
  readonly fuelSourceLabel?: string;
  readonly isPluginHybrid?: boolean;
  readonly battery?: As24Battery;
  readonly co2Emissions?: number;
  readonly co2EmissionsUnit?: string;
  readonly consumption?: As24Consumption;
  readonly combinedUnit?: string;
  readonly electricCombinedUnit?: string;
  readonly wltp?: As24Wltp;
  readonly co2EmissionInGramPerKmWithFallback?: number;
  readonly consumptionCombinedWithFallback?: number;
  readonly euEmissionStandard?: string;
  readonly efficiencyClass?: number;
  readonly electricRange?: number;
  readonly hasParticleFilter?: boolean;

  // --- État, carrosserie, équipements (§2.4) ---------------------------------------------------
  readonly firstRegistrationDate?: string;
  readonly mileage?: number;
  readonly mileageUnit?: string;
  readonly previousOwnerCount?: number;
  readonly hasFullServiceHistory?: boolean;
  readonly nextInspectionDate?: string;
  readonly wasCabOrRental?: boolean;
  readonly warranty?: number;
  readonly warrantyUnit?: string;
  readonly hasWarranty?: boolean;
  readonly bodyType?: number;
  readonly doorCount?: number;
  readonly seatCount?: number;
  readonly bodyColor?: number;
  readonly isMetallic?: boolean;
  readonly paintType?: string;
  readonly upholsteryType?: string;
  readonly upholsteryColor?: number;
  readonly equipment?: readonly number[];
  readonly appliedSeals?: readonly number[];

  // --- Médias, publicité, géographie, vendeur (§2.5) --------------------------------------------
  readonly imageCount?: number;
  readonly hasVideo?: boolean;
  readonly adProduct?: { readonly tier?: string };
  readonly location: As24Location;
  readonly seller?: As24Seller;
}
