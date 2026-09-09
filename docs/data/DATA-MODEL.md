# DATA-MODEL — modèle de données en trois couches (source AS24 → adaptateur → canonique)

> Livrable de l'agent `data-model`, phase 3.1 du `PLAN-3-fixture-data-mvp.md`. Périmètre : la
> **structure**. Les distributions, volumes et corrélations sont le livrable de `dataset-design`
> (`docs/data/DATASET-SPEC.md`) ; ce document lui fixe seulement les **contraintes de cohérence**
> que le schéma ne sait pas exprimer (§7).
>
> Sources normatives lues : `docs/requirements/draft-data-dictionary.md` (82 champs numérotés,
> `EX-DATA-1` à `EX-DATA-123bis`), `docs/reference/vendor/as24-listing-creation-openapi.yml`
> (schéma officiel AutoScout24, 7 194 lignes), `docs/research/FINDING-allowed-surface.md` §2.3
> (champs relevés sur une annonce réelle), `docs/research/AUTOSCOUT24-PROVIDER-OPTIONS.md` §2,
> `src/types/` (entités canoniques, colonnes, vocabulaires, règles partagées, garde R3),
> `src/providers/DataProvider.ts` (**interface gelée**), `data/reference/` (taxonomie et 33
> référentiels), `reports/data/DATA-LEAD-DECISIONS.md` (D3-00 à D3-05).
>
> Livrables associés : `data/schema/as24-listing.schema.json`,
> `data/schema/snapshot-manifest.schema.json`, `data/schema/examples/*.json`,
> `data/schema/validate.mjs`.

---

## 1. Vue en trois couches

```
   ┌──────────────────────────────────────────────────────────────────────────────────┐
   │ COUCHE 1 — SOURCE       As24Listing (1 objet JSON par annonce, forme AutoScout24) │
   │ data/schema/as24-listing.schema.json  ·  JSON Schema draft 2020-12                │
   │ 90 champs feuilles répartis en 12 groupes · additionalProperties: false partout    │
   │ Nommage : OpenAPI Listing Creation quand le champ y existe ; sinon nom cohérent    │
   │ avec le style AS24, marqué [LECTURE] (champ d'annonce publique hors OpenAPI).      │
   │ R3 STRUCTURELLE : aucun champ vendeur identifiant, aucun code postal exact, aucune │
   │ ville, aucune coordonnée, aucun texte libre, aucune URL d'image ou de vidéo (§5).  │
   │ Portage : NDJSON gzip, une ligne par annonce (D3-03) + manifest.json par snapshot. │
   └───────────────────────────────────┬──────────────────────────────────────────────┘
                                       │
                                       │  ADAPTATEUR as24 → canonique  (§3)
                                       │  1. Normalisation  (unités EX-DATA-4, arrondi EX-DATA-6,
                                       │     chaînes EX-DATA-7, vocabulaires EX-DATA-8)
                                       │  2. PUIS Validation (bornes EX-DATA-2, ordre normatif)
                                       │  3. Drapeau d'ingestion en cas d'échec (EX-DATA-45,
                                       │     `setIngestFlag` / `INGEST_FLAG_BIT`)
                                       │  4. Valeur « Si absent » (REJET / DÉFAUT / INCONNU)
                                       v
   ┌──────────────────────────────────────────────────────────────────────────────────┐
   │ COUCHE 2 — CANONIQUE    les 14 entités de `src/types` (EX-DATA-105)               │
   │ Vue LOGIQUE : `Listing` (columns.ts) — 82 champs du dictionnaire, inconnu = null   │
   │ Vue PHYSIQUE : `ListingColumnBatch` (DataProvider.ts, GELÉE) — 33 colonnes typées  │
   │ + 5 champs textuels = 38 descripteurs ; sentinelles −1 / 255 / tri-état 0          │
   │ (EX-DATA-119/120)                                                                  │
   │ Snapshot ← manifest.json ; Make/Model ← data/reference/taxonomy.json ;             │
   │ Enumeration/EnumValue ← data/reference/references/*.json + vocabulaires CRÉÉS ;    │
   │ Region/PostalRegionRange ← table EX-DATA-52.                                       │
   └───────────────────────────────────┬──────────────────────────────────────────────┘
                                       │  DataProvider (interface gelée, R2)
                                       v
   ┌──────────────────────────────────────────────────────────────────────────────────┐
   │ COUCHE 3 — APPLICATION  moteur d'agrégation, écrans, exports — ne connaissent      │
   │ NI la source NI l'adaptateur (DF-2 : brancher une autre source = écrire un         │
   │ adaptateur, sans toucher au moteur ni aux écrans).                                 │
   └──────────────────────────────────────────────────────────────────────────────────┘
```

**Ce que la couche 1 n'est pas.** Elle n'est pas une copie de la réponse d'une API AutoScout24 :
elle en est la forme **expurgée par R3** (§5) et **restreinte au périmètre voiture**. Trois écarts
de forme, assumés et documentés :

1. les champs interdits par `EX-DATA-47` (E1–E21) n'y ont **aucune place**, y compris ceux que la
   source réelle sert (`seller.companyName`, `location.zip`, `location.city`, `description`, `vin`,
   `media.images[].previewUrl`) ;
2. les champs de **cardinalité** remplacent les collections dont seul le compte est retenu
   (`imageCount` au lieu de `images[]`, `hasVideo` au lieu de `youtubeVideoUrl`, `EX-DATA-44`) ;
3. la localisation est servie **déjà tronquée** (`location.postalCodePrefix2`), parce qu'un fichier
   de fixtures est une structure **persistante** et qu'`EX-DATA-48` interdit au code postal exact
   d'exister ailleurs que dans la portée locale d'une fonction (décision proposée **D3-06**, §5).

**Ce que l'adaptateur n'est pas.** Il n'invente rien : tout champ absent de la source reste
`INCONNU` ou prend le `DÉFAUT` déclaré par le dictionnaire, jamais une valeur devinée
(`EX-DATA-5`, `EX-DATA-8`, `EX-DATA-11`).

---

## 2. Couche source — schéma `As24Listing`

`data/schema/as24-listing.schema.json` · `$id: https://kycar.local/schema/as24-listing/1.0.0` ·
draft 2020-12 · `additionalProperties: false` sur l'objet racine et sur les **12 objets imbriqués**.

**Obligatoires (6)** : `id`, `webPage`, `marketplace`, `vehicleType`, `make`, `location`
(dont `location.countryCode`). Trois obligations **conditionnelles** (`dependentRequired`) s'y
ajoutent : un `prices.public.price` exige sa `currency`, un `netPrice` et un `vatRate` exigent le
`price` auquel ils se rapportent — une annonce à prix sur demande n'a, elle, ni montant ni devise à
déclarer. Une **exclusion** (`dependentSchemas`) complète le dispositif : la présence du bloc
`wltp` interdit `consumption`, `co2Emissions` **et** `efficiencyClass`, que l'OpenAPI range tous
les trois du côté NEDC (« Forbidden if NEDC consumption values are set »). Une annonce déclare donc
**une seule branche de mesure**, ce qui est aussi la condition de dérivation de `co2Source` et de
`consumptionSource` (`EX-DATA-35`). Ce sont exactement les champs dont le dictionnaire dit **REJET**
quand ils manquent (`EX-DATA` # 1, 2, 5, 6, 16, 74). Tout le reste est optionnel : une annonce
réelle a des trous, et la colonne « Obl. » du dictionnaire — non l'inverse — fixe la nullabilité.

**Colonne « Provenance »** : `OAS` = propriété de l'OpenAPI Listing Creation, reprise au nom près ·
`LECTURE` = champ relevé sur une annonce publique (`FINDING-allowed-surface.md` §2.3), absent de
l'OpenAPI · `OAS-DÉRIVÉ` = cardinalité ou présence d'une structure OpenAPI dont le contenu est
exclu par R3 · `LECTURE-TRONQUÉ` = champ de lecture servi **déjà réduit** par R3 · `KYCAR` = champ
créé par le projet.

### 2.1 Identité, provenance, classification

| Chemin | Type | Oblig. | Provenance | Vocabulaire | → # |
|---|---|:--:|---|---|--:|
| `id` | chaîne, `format: uuid`, motif 8-4-4-4-12 minuscule | oui | OAS `id` (guid) | — | 1 |
| `webPage` | chaîne ≤ 512, `format: uri`, hôte `autoscout24.<tld>` | oui | LECTURE `details.webPage` | — | 2 |
| `marketplace` | chaîne | oui | OAS `Marketplace` | 9 valeurs `at be ca de es fr it lu nl` | 5 |
| `vehicleType` | `const: "C"` | oui | OAS `VehicleTypeId` | `KYCAR_VEHICLE_TYPE` (1) | 6 |
| `make` | entier 1..2³¹−1 | oui | OAS `make` | `taxonomy.json` (295, ids 6..53 488) | 16 |
| `makeName` | chaîne ≤ 60 | non | LECTURE `make.formatted` | — (contrôle seul) | 17 |
| `model` | entier 1..2³¹−1 | non | OAS `model` | `taxonomy.json` (4 955, ids 1 600..79 983) | 18 |
| `modelName` | chaîne ≤ 50 | non | OAS `modelName` | — (contrôle seul) | 19 |
| `modelVersion` | chaîne 1..121 | non | OAS `modelVersion` | — (texte libre vendeur) | 20 |
| `productionYear` | entier 1900..2100 | non | OAS+LECTURE (C-04) | — | 24 |
| `offerType` | chaîne | non | OAS `Listing.offerType` | `KYCAR_OFFER_TYPE` (6) | 25 |
| `usageState` | chaîne | non | LECTURE `usageState` | `KYCAR_USAGE_STATE` (A N U) | 26 |
| `condition.hadAccident` | booléen | non | OAS `Condition.hadAccident` | — | 27 |
| `publication.status` | chaîne | non | OAS `PublicationStatus` | `Active` \| `Inactive` | — |
| `publication.accurateState` | chaîne ≤ 32 | non | LECTURE `publication.accurateState` | domaine `[À CONFIRMER]` | 28 |
| `publication.isNew` | booléen | non | LECTURE `publication.isNew` | — | 29 |
| `createdAt` | chaîne `date-time` | non | OAS `ListingSummary.createdAt` | — | E-01 |
| `lastUpdatedAt` | chaîne `date-time` | non | OAS `ListingSummary.lastUpdatedAt` | — | E-01 |
| `firstActivatedDate` | chaîne `date-time` | non | OAS `firstActivatedDate` | — | E-01 |

### 2.2 Prix

| Chemin | Type | Oblig. | Provenance | Vocabulaire | → # |
|---|---|:--:|---|---|--:|
| `prices.public.price` | entier ≥ 1 | non | OAS `Price.price` | — | 7 |
| `prices.public.currency` | chaîne | *si `price` présent* | OAS `Price.currency` | `EUR` \| `CAD` | — |
| `prices.public.onRequestOnly` | booléen | non | LECTURE `prices.public.onRequestOnly` | — | 9 |
| `prices.public.isTaxDeductible` | booléen | non | OAS `PublicPrice.isTaxDeductible` | — | 10 |
| `prices.public.netPrice` | entier ≥ 1 | non | OAS `PublicPrice.netPrice` | — | 13 |
| `prices.public.vatRate` | nombre 0..100 | non | OAS `PublicPrice.vatRate` | — | 14 |
| `prices.public.isNegotiable` | booléen | non | OAS `PublicPrice.isNegotiable` | — | E-04 |
| `prices.public.evaluation.category` | entier | non | LECTURE `evaluation.category` | échelle recherche `1 2 3` | 11 |
| `prices.manufacturersSuggestedRetail.price` | entier ≥ 1 | non | OAS `PricesShared` | — | 15 |
| `prices.manufacturersSuggestedRetail.currency` | chaîne | oui *(si le bloc est présent)* | OAS | `EUR` \| `CAD` | — |
| `superDeal` | booléen | non | LECTURE `superDeal` | — | 12 |

### 2.3 Motorisation, carburant, écologie

| Chemin | Type | Oblig. | Provenance | Vocabulaire | → # |
|---|---|:--:|---|---|--:|
| `power` | entier 1..9 999 | non | OAS `power` | — | 35 |
| `powerUnit` | chaîne | non | OAS `powerUnit` | `kW` \| `hp` | (garde EX-DATA-5) |
| `powerHp` | entier 1..13 600 | non | LECTURE `engine.power.hp.raw` | — | 36 (contrôle) |
| `cylinderCapacity` | entier 1..99 999 | non | OAS `cylinderCapacity` | — | 37 |
| `cylinderCapacityUnit` | chaîne | non | OAS | `ccm` \| `ci` | (garde) |
| `cylinderCount` | entier 1..99 | non | OAS | — | 38 |
| `gearCount` | entier 1..9 | non | OAS | — | 39 |
| `transmission` | chaîne | non | OAS | `KYCAR_TRANSMISSION` (A M S) | 40 |
| `drivetrain` | chaîne | non | OAS | `KYCAR_DRIVETRAIN` (4 F R) | 41 |
| `fuelCategory` | chaîne | non | OAS + LECTURE | `KYCAR_FUEL_CATEGORY` (10) | 42 |
| `primaryFuelType` | entier 1..16 | non | OAS `primaryFuelType` | `KYCAR_FUEL_TYPE` (16) | 43 |
| `additionalFuelTypes` | tableau ≤ 8, unique | non | OAS | `KYCAR_FUEL_TYPE` | 44 |
| `fuelSourceLabel` | chaîne ≤ 160 | non | LECTURE `fuels.primary.source` | — (jamais décodé) | 45 |
| `isPluginHybrid` | booléen | non | OAS | — | 46 |
| `battery.ownershipType` | chaîne | non | OAS `BatteryCommon` | `KYCAR_BATTERY_OWNERSHIP` (3) | 47 |
| `battery.capacity` | nombre 0..999 999 | non | OAS (C-05) | — kWh | 48 |
| `battery.capacityUnit` | chaîne | non | OAS | `kWh` | (garde) |
| `co2Emissions` | nombre 0..10 000 | non | OAS `co2Emissions` (**NEDC**) | — g/km | 49 + 50=NEDC |
| `co2EmissionsUnit` | chaîne | non | OAS | `g/km` \| `g/mi` | (garde) |
| `consumption.combined` | nombre 0,1..99,9 | non | OAS `Consumption` (**NEDC**) | — l/100km | 51 + 53=NEDC |
| `consumption.electricCombined` | nombre 0,1..99,9 | non | OAS (déprécié) | — kWh/100km | 52 |
| `combinedUnit` | chaîne | non | OAS | `l/100km` \| `mpg` \| `km/l` | (garde) |
| `electricCombinedUnit` | chaîne | non | OAS | `kWh/100km` | (garde) |
| `wltp.co2EmissionsCombined` | nombre 1..10 000 | non | OAS `WltpCommon` (**WLTP**) | — | 49 + 50=WLTP |
| `wltp.consumptionCombined` | nombre 0,1..10 000 | non | OAS (**WLTP**) | — | 51 + 53=WLTP |
| `wltp.consumptionElectricCombined` | nombre 0,1..10 000 | non | OAS (**WLTP**) | — | 52 (prioritaire) |
| `wltp.co2Class` | entier | non | OAS | `KYCAR_CO2_CLASS` (7) | 55 |
| `co2EmissionInGramPerKmWithFallback` | nombre 0..1 000 | non | LECTURE | — norme **non déclarée** | 49 + 50=UNKNOWN |
| `consumptionCombinedWithFallback` | nombre 0..99,9 | non | LECTURE | — norme **non déclarée** | 51 + 53=UNKNOWN |
| `euEmissionStandard` | chaîne | non | OAS | `KYCAR_EU_EMISSION_STANDARD` (11) | 54 |
| `efficiencyClass` | entier | non | OAS (**branche NEDC**, C-13) | `KYCAR_EFFICIENCY_CLASS` (10) | 56 |
| `electricRange` | entier 1..10 000 | non | OAS | — km | 57 |
| `hasParticleFilter` | booléen | non | OAS | — | 58 |

### 2.4 État, carrosserie, équipements

| Chemin | Type | Oblig. | Provenance | Vocabulaire | → # |
|---|---|:--:|---|---|--:|
| `firstRegistrationDate` | chaîne `^\d{4}-(0[1-9]\|1[0-2])$` | non | OAS (`year-month`) | — | 30 |
| `mileage` | entier 0..10⁸ | non | OAS `mileage` | — | 59 |
| `mileageUnit` | chaîne | non | OAS `mileageUnit` | `km` \| `mi` | (garde EX-DATA-5) |
| `previousOwnerCount` | entier 0..99 | non | OAS | — | 60 |
| `hasFullServiceHistory` | booléen | non | OAS | — | 61 |
| `nextInspectionDate` | chaîne `YYYY-MM` | non | OAS | — | 62 |
| `wasCabOrRental` | booléen | non | OAS | — | 63 |
| `warranty` | entier 0..999 | non | OAS `ListingSharedDealerOnly` | — mois | E-03 |
| `warrantyUnit` | chaîne | non | OAS | `Months` | E-03 |
| `hasWarranty` | booléen | non | OAS | — | E-03 |
| `bodyType` | entier | non | OAS | `KYCAR_BODY_TYPE` (9 codes voiture) | 64 |
| `doorCount` | entier 1..9 | non | OAS | — | 65 |
| `seatCount` | entier 1..99 | non | OAS | — | 66 |
| `bodyColor` | entier | non | OAS | `KYCAR_BODY_COLOR` (14) | 67 |
| `isMetallic` | booléen | non | OAS | — | 68 |
| `paintType` | chaîne | non | LECTURE (**H-01**, non observé) | `KYCAR_PAINT_TYPE` (5) | 69 |
| `upholsteryType` | chaîne | non | OAS | `KYCAR_UPHOLSTERY_TYPE` (6) | 70 |
| `upholsteryColor` | entier | non | OAS | `KYCAR_UPHOLSTERY_COLOR` (11) | 71 |
| `equipment` | tableau ≤ 132, unique | non | OAS `equipment` | `KYCAR_EQUIPMENT` (132 voiture) | 72 |
| `appliedSeals` | tableau ≤ 14, unique | non | OAS `appliedSeals` | `KYCAR_SEAL` (14) | 73 |

### 2.5 Médias, publicité, géographie, vendeur

| Chemin | Type | Oblig. | Provenance | Vocabulaire | → # |
|---|---|:--:|---|---|--:|
| `imageCount` | entier 0..50 | non | OAS-DÉRIVÉ (cardinalité de `images[]`) | — | 80 |
| `hasVideo` | booléen | non | OAS-DÉRIVÉ (présence de `youtubeVideoUrl`) | — | 81 |
| `adProduct.tier` | chaîne | non | LECTURE `adProduct.tier` | `OAS:Tier` (T20 T30 T40 T50) | 79 |
| `location.countryCode` | chaîne `^[A-Z]{2}$` | **oui** | LECTURE `location.countryCode` | ISO-3166-1 alpha-2 | 74 |
| `location.postalCodePrefix2` | chaîne `^[0-9]{2}$` | non | LECTURE-TRONQUÉ | — | 77 → 75, 76 |
| `seller.type` | chaîne | non | LECTURE `seller.type` | `KYCAR_SELLER_TYPE` (P D) | 78 |
| `seller.dealerBucket` | chaîne `^[0-9a-f]{8}$` | non | KYCAR (D3-02) | — pseudonyme non réversible | E-02 |

**Total : 90 champs feuilles, 12 groupes imbriqués.** Décompte par provenance : **69 OAS**,
**16 LECTURE**, **1 OAS+LECTURE** (`productionYear`, C-04), **2 OAS-DÉRIVÉ** (`imageCount`,
`hasVideo`), **1 LECTURE-TRONQUÉ** (`location.postalCodePrefix2`), **1 KYCAR**
(`seller.dealerBucket`). Parmi les 69 champs OAS, **8 sont des champs d'unité** (`mileageUnit`,
`powerUnit`, `cylinderCapacityUnit`, `battery.capacityUnit`, `co2EmissionsUnit`, `combinedUnit`,
`electricCombinedUnit`, `warrantyUnit`) et **2 des devises** : ils ne sont **jamais stockés** et ne
servent qu'à la garde `EX-DATA-5` (aucune conversion devinée).

---

## 3. Adaptateur `as24 → canonique`

**Ordre normatif** (`EX-DATA-2`) : **normalisation, PUIS validation**. Toute borne s'entend sur la
valeur déjà normalisée, dans l'unité canonique d'`EX-DATA-4` et après l'arrondi d'`EX-DATA-6`
(demi vers l'infini en valeur absolue ; l'arrondi bancaire est interdit). Toute chaîne subit
`EX-DATA-7` (NFC, retrait des caractères de contrôle, espaces compactés, `trim`) **avant** toute
comparaison, tout hachage et toute troncature.

**Pose d'un drapeau** : `ingestFlags = setIngestFlag(ingestFlags, '<CODE>')`
(`src/types/vocabularies.ts`, table `INGEST_FLAG_BIT`, colonne `Uint32Array`, D-01/DR-013). Un
drapeau n'est **jamais** une valeur : le champ concerné prend `INCONNU` en plus du drapeau, sauf
mention contraire.

**Cible canonique** : la colonne « → colonne » indique le port de sortie — `LCB` = colonne de
`ListingColumnBatch` (interface **gelée**, traverse le provider), `str` = zone de chaînes du même
lot, `SNAP` = `SnapshotDescriptor`, `—` = champ du dictionnaire **sans colonne** dans l'interface v1
(il vit dans la vue logique `Listing` et dans l'adaptateur, mais ne franchit pas l'interface : voir
l'écart **E-07**, §4).

### 3.1 Table champ à champ — les 82 champs du dictionnaire

| # | Champ KYCAR | `As24Listing.<chemin>` | Normalisation | Validation → drapeau | Si absent | → colonne |
|--:|---|---|---|---|---|---|
| 1 | `listingId` | `id` | minuscules, forme 8-4-4-4-12 ; encodé sur 16 octets binaires | motif UUID sinon **REJET** de l'annonce | REJET | LCB `listingId` |
| 2 | `listingUrl` | `webPage` | schéma forcé `https`, fragment et paramètres de campagne (`utm_*`, `cldtidx`, `search_id`, `query_id`) supprimés, `EX-DATA-7` | hôte ∈ `autoscout24.<tld>` sinon **REJET** (`EX-DATA-14`) | REJET | str [0] |
| 3 | `snapshotId` | *manifest* `snapshotId` | — (déjà de la forme `<marketplace>-<YYYYMMDDTHHmmssZ>`) | motif du manifest sinon REJET du snapshot | REJET | SNAP |
| 4 | `observedAt` | *manifest* `capturedAt` | ISO-8601 à la seconde, suffixe `Z` | ≤ maintenant sinon **REJET du snapshot entier** | REJET | SNAP |
| 5 | `marketplace` | `marketplace` | minuscules | ∈ `KYCAR_MARKETPLACE` sinon REJET | REJET | SNAP |
| 6 | `vehicleType` | `vehicleType` | majuscule | doit valoir `C` sinon REJET | REJET | — (invariant) |
| 7 | `priceEur` | `prices.public.price` | arrondi à l'euro entier ; `.formatted` jamais utilisé | `p > 5 000 000` → INCONNU + `PRICE_OUT_OF_RANGE` · `p < 250` → `PRICE_SENTINEL_ABSOLUTE` (valeur conservée, exclue des statistiques de prix) · aucun rejet d'annonce | INCONNU, `priceStatus` déduit | LCB `priceEur` |
| 8 | `priceStatus` | **DÉRIVÉ** de # 7 et # 9 | `QUOTED` si `priceEur` connu ; `ON_REQUEST` si absent et `onRequestOnly` vrai ; `MISSING` sinon | exhaustif par construction ; # 7 connu **et** # 9 vrai → `QUOTED` + `PRICE_ON_REQUEST_WITH_AMOUNT` (`EX-DATA-32`) | — | LCB `priceStatus` |
| 9 | `priceOnRequestOnly` | `prices.public.onRequestOnly` | — | — ; absent **sans** montant → `PRICE_MISSING_UNDECLARED` (`EX-DATA-18`) | DÉFAUT `false` | — (bit proposé, D3-10) |
| 10 | `isTaxDeductible` | `prices.public.isTaxDeductible` | — | — | INCONNU → colonne `vatDeductible` = 0 (tri-état D8-08) | LCB `vatDeductible` |
| 11 | `priceEvaluationCategory` | `prices.public.evaluation.category` | projection 3 → 6 niveaux (`EX-DATA-12`) | ∈ vocabulaire sinon INCONNU + `ENUM_UNKNOWN` | DÉFAUT `0` (Inconnu) | LCB `priceEvaluationCategory` |
| 12 | `isSuperDeal` | `superDeal` | — | — | DÉFAUT `false` | — (bit proposé) |
| 13 | `netPriceEur` | `prices.public.netPrice` | arrondi à l'euro | `1 ≤ n < priceEur` sinon INCONNU | INCONNU | — |
| 14 | `vatRatePercent` | `prices.public.vatRate` | 1 décimale, **troncature** au-delà (règle de la source) | `0 ≤ v ≤ 100` sinon INCONNU | INCONNU | — |
| 15 | `msrpEur` | `prices.manufacturersSuggestedRetail.price` | arrondi à l'euro | `1 ≤ m ≤ 5 000 000` sinon INCONNU | INCONNU | — |
| 16 | `makeId` | `make` | — (entier servi tel quel) | doit exister dans `taxonomy.json` (295) sinon **REJET** ; `makeName` divergent est ignoré (colonne « Normalisation » du champ # 17, C-08) | REJET | LCB `makeId` (Int32, D-02) |
| 17 | `makeName` | `taxonomy.json` → `makes[].label` ; `makeName` en contrôle | NFC ; **le libellé du référentiel prime** | non vide | REJET | — (référentiel) |
| 18 | `modelId` | `model` | — | doit exister parmi les modèles de `makeId` sinon `0` + `MODEL_UNRESOLVED` | `0` (« Modèle non identifié ») | LCB `modelId` |
| 19 | `modelName` | `taxonomy.json` → `makes[].models[].label` | NFC ; libellé du référentiel prioritaire | non vide | INCONNU | — (référentiel) |
| 20 | `modelVersionRaw` | `modelVersion` | `EX-DATA-7` puis troncature à 121 | — | INCONNU | str [1] |
| 21 | `modelVersionClean` | **DÉRIVÉ** de # 20 | pipeline `EX-DATA-29` étapes 1–6 (`cleanModelVersion`) | vide après nettoyage alors que # 20 non vide → INCONNU + `VERSION_FULLY_STRIPPED` | INCONNU | str [2] |
| 22 | `trimTokens` | **DÉRIVÉ** de # 20 | `EX-DATA-29` étape 7 ; majuscules, tri lexicographique, dédoublonné | ≤ 12 jetons, surplus tronqué | tableau vide | str [4] |
| 23 | `badgeDisplacementL` | **DÉRIVÉ** de # 20 | `EX-DATA-29` étape 8 ; 1 décimale | `0,6 ≤ d ≤ 8,0` sinon INCONNU | INCONNU | — |
| 24 | `modelYear` | `productionYear` | entier | `1900 ≤ y ≤ observedAt.year + 1` sinon INCONNU + `YEAR_OUT_OF_RANGE` | INCONNU | LCB `modelYear` |
| 25 | `offerType` | `offerType` | majuscule | ∈ `KYCAR_OFFER_TYPE` sinon INCONNU | INCONNU | LCB `offerType` |
| 26 | `usageState` | `usageState` | majuscule | ∈ {`A`,`N`,`U`} sinon INCONNU | INCONNU | LCB `usageState` |
| 27 | `hadAccident` | `condition.hadAccident` | — | — | INCONNU | — (bit tri-état proposé) |
| 28 | `publicationState` | `publication.accurateState` | `EX-DATA-7` | domaine inconnu : conservé tel quel, **jamais** un filtre | INCONNU | — |
| 29 | `isNewListing` | `publication.isNew` | — | — | DÉFAUT `false` | — (bit proposé) |
| 30 | `firstRegistrationYearMonth` | `firstRegistrationDate` | `EX-DATA-23` : `^(\d{4})-(0[1-9]\|1[0-2])$` puis, pour une source réelle, `^(0[1-9]\|1[0-2])/(\d{4})$` ; encodé `12·année + (mois−1)` | forme invalide → INCONNU + `FIRST_REG_UNPARSEABLE` · `1900-01 ≤ v ≤ (observedAt.year+1)-12` sinon INCONNU + `FIRST_REG_OUT_OF_RANGE` | INCONNU | LCB `firstRegistrationYearMonth` |
| 31 | `firstRegistrationYear` | **DÉRIVÉ** de # 30 | `entier(sous-chaîne(v,1,4))` | `1900 ≤ y ≤ observedAt.year + 1` | INCONNU | — (décodé de # 30) |
| 32 | `firstRegistrationMonth` | **DÉRIVÉ** de # 30 | `entier(sous-chaîne(v,6,2))` | `1 ≤ m ≤ 12` | INCONNU | — (décodé de # 30) |
| 33 | `vehicleAgeMonths` | **DÉRIVÉ** de # 30 et # 4 | `12·(obs.year − reg.year) + (obs.month − reg.month)` | `0 ≤ a ≤ 1 500` sinon INCONNU | INCONNU | — (calculé) |
| 34 | `mileagePerYearKm` | **DÉRIVÉ** de # 59 et # 33 | `arrondi(mileageKm × 12 / max(vehicleAgeMonths, 6))` | `0 ≤ v ≤ 200 000` sinon INCONNU ; exige # 59 **et** # 33 connus | INCONNU | — (calculé) |
| 35 | `powerKw` | `power` (+ `powerUnit`) | unité canonique kW ; `powerUnit ∉ {kW}` → refus de conversion + `UNIT_UNSUPPORTED` (`EX-DATA-5`) | `1 ≤ p ≤ 9 999` sinon INCONNU + `POWER_OUT_OF_RANGE` | INCONNU | LCB `powerKw` |
| 36 | `powerHp` | **DÉRIVÉ** de # 35 ; `powerHp` en contrôle | `arrondi(powerKw / 0,7355)` (`EX-DATA-36`, DIN 66036) ; **jamais** stocké depuis la source | écart au `powerHp` source > 2 % → `POWER_UNIT_MISMATCH` | INCONNU | — (recalculé) |
| 37 | `cylinderCapacityCcm` | `cylinderCapacity` (+ `cylinderCapacityUnit`) | cm³ ; unité autre → `UNIT_UNSUPPORTED` | `1 ≤ c ≤ 99 999` sinon INCONNU | INCONNU | — |
| 38 | `cylinderCount` | `cylinderCount` | — | `1 ≤ n ≤ 99` sinon INCONNU | INCONNU | — |
| 39 | `gearCount` | `gearCount` | — | `1 ≤ n ≤ 9` sinon INCONNU | INCONNU | — |
| 40 | `transmission` | `transmission` | majuscule | ∈ {`A`,`M`,`S`} sinon INCONNU | INCONNU | LCB `transmission` |
| 41 | `drivetrain` | `drivetrain` | majuscule | ∈ {`4`,`F`,`R`} sinon INCONNU | INCONNU | LCB `drivetrain` |
| 42 | `fuelCategory` | `fuelCategory` | majuscule pour les codes alphabétiques ; `2` et `3` restent des **chaînes** | ∈ `KYCAR_FUEL_CATEGORY` sinon INCONNU + `ENUM_UNKNOWN` | INCONNU, puis repli `EX-DATA-10` depuis # 43 ; hybride non résoluble → `HYBRID_CATEGORY_UNRESOLVED` (`EX-DATA-11`) | LCB `fuelCategory` |
| 43 | `fuelTypePrimary` | `primaryFuelType` | entier → **chaîne** numérique (vocabulaire distinct de # 42, `EX-DATA-9`) | ∈ `KYCAR_FUEL_TYPE` (16) sinon INCONNU | INCONNU | — |
| 44 | `fuelTypesAdditional` | `additionalFuelTypes` | entiers → chaînes, tri croissant, dédoublonné | code hors vocabulaire **retiré** | tableau vide | — |
| 45 | `fuelSourceLabelRaw` | `fuelSourceLabel` | `EX-DATA-7` puis troncature à 160 | **jamais décodé** vers un code (`EX-DATA-37`) | INCONNU | str [3] |
| 46 | `isPluginHybrid` | `isPluginHybrid` | — | vrai ⇒ `fuelCategory ∈ {2,3,O}` sinon `HYBRID_INCONSISTENT` | INCONNU | — (bit tri-état proposé) |
| 47 | `batteryOwnership` | `battery.ownershipType` | — | ∈ {`1`,`2`,`3`} sinon INCONNU | INCONNU | — |
| 48 | `batteryCapacityKwh` | `battery.capacity` | 1 décimale (`EX-DATA-6`) | `0,1 ≤ c ≤ 500,0` sinon INCONNU (C-05) | INCONNU | — |
| 49 | `co2EmissionsGPerKm` | `wltp.co2EmissionsCombined` **sinon** `co2Emissions` **sinon** `co2EmissionInGramPerKmWithFallback` | 1 décimale, troncature au-delà ; unité `g/km` (garde `co2EmissionsUnit`) | `0 ≤ c ≤ 1 000` sinon INCONNU ; `c = 0` admis **seulement** si `fuelCategory = E`, sinon `CO2_ZERO_NON_BEV` + INCONNU | INCONNU | LCB `co2EmissionsGPerKmX10` |
| 50 | `co2Source` | **DÉRIVÉ** : quel champ de # 49 a été retenu | `WLTP` si `wltp.*` · `NEDC` si `co2Emissions` · `UNKNOWN` si `…WithFallback` (`EX-DATA-35`) | — | DÉFAUT `UNKNOWN` | — (**dette D8-32**, C-03) |
| 51 | `consumptionCombinedL100Km` | `wltp.consumptionCombined` **sinon** `consumption.combined` **sinon** `consumptionCombinedWithFallback` | 1 décimale ; unité `l/100km` (garde `combinedUnit`) | `0,1 ≤ v ≤ 99,9` sinon INCONNU | INCONNU | LCB `consumptionCombinedL100KmX10` |
| 52 | `consumptionElectricKwh100Km` | `wltp.consumptionElectricCombined` **sinon** `consumption.electricCombined` (déprécié) | 1 décimale ; le champ WLTP prime | `0,1 ≤ v ≤ 99,9` sinon INCONNU | INCONNU | — |
| 53 | `consumptionSource` | **DÉRIVÉ** : quel champ de # 51 a été retenu | même règle que # 50 | — | DÉFAUT `UNKNOWN` | — (**dette D8-32**) |
| 54 | `euEmissionStandard` | `euEmissionStandard` | chaîne | ∈ vocabulaire (11) sinon INCONNU | INCONNU | LCB `euEmissionStandard` |
| 55 | `co2Class` | `wltp.co2Class` (**branche WLTP seule**) | entier → chaîne | ∈ {`10`…`70`} sinon INCONNU | INCONNU | — |
| 56 | `efficiencyClass` | `efficiencyClass` (**branche NEDC seule**, C-13) | entier → chaîne | ∈ vocabulaire (10) sinon INCONNU | INCONNU | — |
| 57 | `electricRangeKm` | `electricRange` | km | `1 ≤ r ≤ 10 000` sinon INCONNU | INCONNU | LCB `electricRangeKm` |
| 58 | `hasParticleFilter` | `hasParticleFilter` | — | — | INCONNU | — (bit tri-état proposé) |
| 59 | `mileageKm` | `mileage` (+ `mileageUnit`) | unité canonique km ; `mileageUnit ∉ {km}` → refus + `UNIT_UNSUPPORTED` | `0 ≤ m ≤ 1 500 000` sinon INCONNU + `MILEAGE_OUT_OF_RANGE` · `m = 0` admis sans réserve si `offerType ∈ {N,S,D}`, sinon `SUSPECT_ZERO_MILEAGE` et exclusion des statistiques de kilométrage | INCONNU | LCB `mileageKm` |
| 60 | `previousOwnerCount` | `previousOwnerCount` | entier | `0 ≤ n ≤ 99` sinon INCONNU | INCONNU | LCB `previousOwnerCount` |
| 61 | `hasFullServiceHistory` | `hasFullServiceHistory` | — | — | INCONNU | — (bit tri-état proposé) |
| 62 | `nextInspectionYearMonth` | `nextInspectionDate` | `EX-DATA-23` | `observedAt − 24 mois ≤ v ≤ observedAt + 48 mois` sinon INCONNU | INCONNU | — |
| 63 | `wasCabOrRental` | `wasCabOrRental` | — | — | INCONNU | — (bit tri-état proposé) |
| 64 | `bodyType` | `bodyType` | entier → chaîne numérique | ∈ 9 codes voiture sinon INCONNU + `ENUM_UNKNOWN` | INCONNU | LCB `bodyType` |
| 65 | `doorCount` | `doorCount` | — | `1 ≤ n ≤ 9` sinon INCONNU | INCONNU | LCB `doorCount` |
| 66 | `seatCount` | `seatCount` | — | `1 ≤ n ≤ 99` sinon INCONNU | INCONNU | LCB `seatCount` |
| 67 | `bodyColor` | `bodyColor` | entier → chaîne numérique | ∈ 14 codes sinon INCONNU | INCONNU | LCB `bodyColor` |
| 68 | `isMetallic` | `isMetallic` | — | — | INCONNU | — (bit tri-état proposé) |
| 69 | `paintType` | `paintType` (**H-01**) | majuscule | ∈ 5 codes sinon INCONNU | INCONNU | — |
| 70 | `upholsteryType` | `upholsteryType` | majuscules | ∈ 6 codes sinon INCONNU | INCONNU | LCB `upholsteryType` |
| 71 | `upholsteryColor` | `upholsteryColor` | entier → chaîne numérique | ∈ 11 codes sinon INCONNU | INCONNU | — |
| 72 | `equipmentCodes` | `equipment` | entiers → chaînes, tri croissant, dédoublonné | code hors périmètre voiture **retiré silencieusement** ; code hors vocabulaire retiré + `ENUM_UNKNOWN` | tableau vide (**indistinguable** d'un non-renseigné, `EX-DATA-39`) | — |
| 73 | `sealCodes` | `appliedSeals` | entiers → chaînes, tri croissant | code hors vocabulaire retiré | tableau vide | — |
| 74 | `countryCode` | `location.countryCode` | majuscules ; traduction obligatoire d'un code marketplace vers l'ISO (`B`→`BE`, `D`→`DE`, `A`→`AT`, `E`→`ES`, `F`→`FR`, `I`→`IT`, `L`→`LU`, `NL`→`NL`, **`ca`→`CA` : voir C-01**) | 2 lettres et code ISO existant sinon REJET ; code marketplace non traduit → INCONNU + `MARKETPLACE_UNMAPPED` (aucun rejet) | REJET, sauf cas ci-dessus | LCB `countryCode` |
| 75 | `regionCode` | **DÉRIVÉ** de `location.postalCodePrefix2` | table `EX-DATA-52` (13 plages, 11 codes NUTS-2) ; toutes les plages commencent sur un multiple de 100, donc le préfixe à 2 chiffres suffit et ne perd rien | hors plage → INCONNU + `REGION_UNRESOLVED` ; `countryCode ≠ BE` → INCONNU (`EX-DATA-55`) | INCONNU | LCB `regionCode` |
| 76 | `regionName` | **DÉRIVÉ** de # 75 | libellé FR canonique (`REGION_VALUES`, `src/types/vocabularies.ts` — C-11) | — | INCONNU | — (décodé de # 75) |
| 77 | `postalCodePrefix2` | `location.postalCodePrefix2` | chiffres uniquement, tel quel | 2 chiffres sinon INCONNU | INCONNU | — |
| 78 | `sellerType` | `seller.type` | majuscule ; alias d'entrée `private`→`P`, `dealer`→`D` (`EX-DATA-41`) | ∈ {`P`,`D`} sinon INCONNU | INCONNU | LCB `sellerType` |
| 79 | `adTier` | `adProduct.tier` | majuscules | ∈ {`T20`,`T30`,`T40`,`T50`} sinon INCONNU ; **absence du champ** = `NONE` | DÉFAUT `NONE` | LCB `adTier` |
| 80 | `imageCount` | `imageCount` | — (déjà une cardinalité ; **aucune URL** conservée) | `0 ≤ n ≤ 50`, au-delà plafonné à 50 | DÉFAUT `0` | LCB `imageCount` |
| 81 | `hasVideo` | `hasVideo` | — (déjà un booléen de présence ; **aucune URL**) | — | DÉFAUT `false` | — (bit proposé) |
| 82 | `ingestFlags` | **DÉRIVÉ** : cumul des drapeaux ci-dessus | masque positionnel `Uint32`, `INGEST_FLAG_BIT` | — | masque `0` | LCB `ingestFlags` |

**Couverture : 82 / 82 champs du dictionnaire.** Aucune ligne n'est vide.

### 3.2 Champs du dictionnaire sans équivalent dans la source, justifiés

**Dix-huit** champs n'ont **aucun** chemin `As24Listing` : ils sont produits par KYCAR (deux
premières lignes du tableau). **Trois autres** — # 77, 80, 81 — ont bien un chemin source, mais qui
porte une valeur **substituée** à ce que la source réelle sert : c'est la substitution qui est
justifiée, pas l'absence (deux dernières lignes). Chacun des 21 apparaît quand même dans la table
§3.1, avec la mention **DÉRIVÉ** ou la provenance qui le fonde.

| Motif | Champs (numéros) | Justification |
|---|---|---|
| Métadonnée de lot (manifest, pas annonce) | 3, 4 | `snapshotId` et `observedAt` décrivent l'**ingestion**, pas le véhicule (`EX-DATA-106`). |
| Résolution contre le référentiel | 17, 19 | Le libellé canonique de `taxonomy.json` prime sur celui de l'annonce (champs # 17 et # 19, `EX-DATA-20`) ; le libellé source ne sert qu'au contrôle. |
| Dérivé d'un autre champ canonique | 8, 21, 22, 23, 31, 32, 33, 34, 36, 50, 53, 75, 76, 82 | Calculs déterministes de l'adaptateur (`EX-DATA-24`, `EX-DATA-29`, `EX-DATA-35`, `EX-DATA-36`, `EX-DATA-52`) — les reprendre de la source créerait deux chiffres divergents sans règle d'arbitrage. |
| **Substitution** : compteur à la place d'un contenu exclu | 80, 81 | `imageCount` et `hasVideo` **remplacent** `images[]` et `youtubeVideoUrl`, exclus par `EX-DATA-44` / `EX-DATA-47` E18–E19. Le chemin source existe, son contenu n'est pas celui de la source réelle. |
| **Substitution** : valeur réduite par R3 avant persistance | 77 (et 75, 76 qui en dérivent) | Le code postal exact n'existe que dans la portée locale d'un adaptateur de source réelle (`EX-DATA-48`) ; la couche source **fixture**, persistée, ne porte que le préfixe (D3-06). |

### 3.3 Symétrique — champs de la source sans équivalent canonique

| Réf. | Champ source | Décision |
|---|---|---|
| E-01 | `createdAt`, `lastUpdatedAt`, `firstActivatedDate` | **Aucun champ de date d'annonce n'existe dans le dictionnaire.** Conservés dans la couche source : ils fondent les contraintes de cohérence temporelle (§7) et rendent le delta inter-snapshots vérifiable par `data-review`. Non ingérés en v1 (aucune colonne, aucun besoin d'écran identifié). Décision proposée **D3-11**. |
| E-02 | `seller.dealerBucket` | Ne franchit **jamais** l'interface `DataProvider` (aucune colonne, R3). Sert au générateur (doublons inter-vendeurs, biais publicitaire) et aux sondes du reviewer, qui lisent le NDJSON. |
| E-03 | `warranty`, `warrantyUnit`, `hasWarranty` | Présents dans l'OpenAPI (`ListingSharedDealerOnly`), absents du dictionnaire. Conservés côté source (le commanditaire les a nommés), non ingérés faute d'exigence d'écran. |
| E-04 | `prices.public.isNegotiable` | Idem : OpenAPI, absent du dictionnaire, non ingéré. |
| E-05 | `mileageUnit`, `powerUnit`, `co2EmissionsUnit`, `combinedUnit`, `electricCombinedUnit`, `cylinderCapacityUnit`, `battery.capacityUnit`, `warrantyUnit`, `currency` | **Consommés puis jetés** : ils arment la garde `EX-DATA-5` et ne sont jamais stockés. C'est leur rôle. |
| E-06 | `publication.status` | Statut de publication OpenAPI (`Active`/`Inactive`), distinct de `accurateState` (# 28) dont le domaine reste `[À CONFIRMER]`. Sert de contrainte de génération (§7), non ingéré. |
| E-07 | 42 champs du dictionnaire **sans colonne** dans `ListingColumnBatch` | Voir §4, écart E-07 : la vue logique `Listing` en compte 82, l'interface gelée n'en transporte que 40. Ce n'est pas un défaut de l'adaptateur mais la capacité de l'interface v1. |

---

## 4. Écarts et contradictions

Sévérités : **MAJEUR** = fausse une valeur affichée, une décision d'architecture ou un énoncé
normatif ; **MINEUR** = incohérence documentaire sans effet mesuré ; **INFO** = tranché ici, tracé
pour mémoire. Les points marqués « **à trancher** » exigent une décision du coordinateur : ils
touchent une interface gelée, un vocabulaire gelé ou un énoncé du dictionnaire.

| Réf. | Sévérité | Constat | Ce que j'ai fait | Décision proposée |
|---|---|---|---|---|
| **C-01** | **MAJEUR — à trancher** | `EX-DATA-40` et `src/types/vocabularies.ts` tiennent la **9ᵉ** valeur de `KYCAR_MARKETPLACE` pour non identifiée (code réservé `UNKNOWN_9`, drapeau `MARKETPLACE_UNMAPPED` en repli). L'OpenAPI **du dépôt** (`components.schemas.Marketplace`) énumère les 9 valeurs : `at, be, **ca**, de, es, fr, it, lu, nl` — la neuvième est le **Canada**. `components.schemas.Culture` le confirme (`fr-CA`, `en-CA`), et `Price.currency` admet `CAD`. La preuve était dans le dépôt depuis l'ingestion du schéma. | Le schéma source énumère les 9 codes réels, `ca` compris. | **D3-07** : remplacer `UNKNOWN_9` par `ca` dans `MARKETPLACE_VALUES`, compléter la table de traduction d'`EX-DATA-40` par `ca → CA`, et constater que `MARKETPLACE_UNMAPPED` devient **inatteignable** pour les 9 codes connus (le drapeau reste, comme garde de régression). Touche un vocabulaire gelé → coordinateur. |
| **C-02** | MINEUR | Cardinalité de `KYCAR_INGEST_FLAG` : la table `§A.1` annonce **14** codes, `EX-DATA-45` en énumère **17**, et le champ # 82 borne le tableau à `0..14`. Le code a tranché (`Uint32Array`, 17 codes, D-01/DR-013) et l'a signalé sans corriger le texte. | Je retiens les **17** codes d'`EX-DATA-45` (le manifest y adosse sa vérité terrain). | Corriger `§A.1` et le type du champ # 82 dans le dictionnaire (`0..17`). Travail de documentation, pas d'arbitrage. |
| **C-03** | **MAJEUR — à trancher** | `co2Source` (# 50) et `consumptionSource` (# 53) sont exigés par `EX-DATA-35` mais **n'ont aucune colonne** dans `ListingColumnBatch` (dette `D8-32`). Le motif écrit de la dette est que « le provider synthétique n'a pas accès à un champ source pour la dériver » — **ce motif tombe** : la couche source fixture porte les trois branches (`wltp.*`, NEDC, `…WithFallback`), donc un `FixtureDataProvider` **peut** dériver la provenance ligne par ligne. La dette n'est plus un manque de donnée mais un manque de **capacité d'interface**. | J'ai modélisé les trois branches dans le schéma source et écrit la règle de priorité (§3.1 # 49–53). | **D3-08**, deux options : (a) v2 de `ListingColumnBatch` avec une colonne `measurementSource` d'un octet (2 bits utiles, ≈ +100 Ko à 100 000 lignes, sans effet sur `EX-NFR-3`) ; (b) statu quo, le provider fixture publie `co2Source = UNKNOWN` **et** le déclare dans `unknownCountByField` / `coverageNote`. Je recommande (a) : le coût est nul et la dette est autrement rouverte à chaque source réelle. |
| **C-04** | MINEUR | `productionYear` est déclaré `type: string` dans l'OpenAPI, alors que la donnée d'annonce observée (`listings[].modelYear`) et le dictionnaire (# 24, `entier`) attendent un entier. | Le schéma source retient l'**entier** (1900..2100). | Aucune : l'entier est la seule forme exploitable pour la validation de borne d'`EX-DATA-24`. Tracé ici. |
| **C-05** | MINEUR | `Battery.capacity` est `integer` 0..999 999 dans l'OpenAPI ; le dictionnaire # 48 attend `décimal(1)` borné `0,1..500,0`. Trois écarts : type, borne basse, borne haute. | Le schéma source accepte un `number` 0..999 999 (fidélité à la source) ; la borne KYCAR s'applique à la validation d'ingestion, hors bornes → INCONNU. | Aucune (le champ ne traverse pas l'interface). Tracé. |
| **C-06** | MINEUR — **contraignant pour la génération** | `wltp.co2EmissionsCombined` porte `minimum: 1` : un véhicule **électrique à 0 g/km ne peut pas être exprimé dans le bloc WLTP**. Or le champ # 49 admet explicitement `c = 0` quand `fuelCategory = E`. | Le schéma reprend la borne de la source. | Aucune décision : contrainte de génération écrite en §7 (un BEV porte son 0 g/km par `co2Emissions` ou par le champ `…WithFallback`). |
| **C-07** | MINEUR | `firstRegistrationDate` : l'OpenAPI sert `YYYY-MM`, la surface de recherche observée sert `MM/YYYY`. `EX-DATA-23` accepte les deux. | La couche source **fixture** n'accepte qu'une forme (`YYYY-MM`). | Aucune. Conséquence : la seconde branche d'`EX-DATA-23` et le drapeau `FIRST_REG_UNPARSEABLE` sont **inatteignables depuis une ligne conforme au schéma** ; ils restent couverts par les tests unitaires de l'adaptateur, qui construisent leurs enregistrements à la main (§7, contrainte 23). |
| **C-08** | INFO | `EX-DATA-20` résout `makeId` par **recherche du libellé** `make.formatted` dans `taxonomy.json`, alors que l'OpenAPI sert `make` comme **identifiant entier**. Deux chemins de résolution pour un même champ. | La couche source sert l'identifiant ; le libellé (`makeName`) est un contrôle. En cas de divergence, l'identifiant fait foi et le libellé est ignoré — le champ # 17 dit déjà que « le libellé canonique du référentiel prime sur le libellé de l'annonce ». Aucun drapeau nouveau. | Aucune : tranché par la colonne « Normalisation » du champ # 17. |
| **C-09** | INFO | `listings[].type` est donné comme porteur de `vehicleType` (# 6, OBSERVÉ) **et** comme « porteur probable » d'`offerType` (# 25, `[À CONFIRMER]`). Un même chemin ne peut pas porter les deux. | La couche source les sépare (`vehicleType` et `offerType`). | Aucune pour les fixtures ; l'ambiguïté reste à lever pour un adaptateur de source **réelle**. |
| **C-10** | MINEUR | `paintType` (# 69) est sourcé sur `filters.json → ptype`, c'est-à-dire un **paramètre de recherche**, pas un champ d'annonce : ni l'OpenAPI ni le relevé d'annonce ne portent la couleur de peinture. Le champ n'a donc, en toute rigueur, **aucune source**. | Conservé dans la couche source, marqué **H-01 : hypothèse** (E4) — « champ supposé exister sur l'annonce parce qu'un filtre l'expose ». | Contrainte §7 : `dataset-design` renseigne `paintType` sur une **minorité** d'annonces et le déclare, pour que l'hypothèse reste visible dans les taux d'inconnu plutôt que masquée par un remplissage systématique. |
| **C-11** | MINEUR | `EX-DATA-54` exige `data/reference/postal-regions-be.json` (plages + exceptions) et le champ # 76 cite `data/reference/regions-be.json` : **ni l'un ni l'autre n'existe** dans le dépôt. Les deux contenus vivent en dur dans `src/types/vocabularies.ts` (`BE_POSTAL_RANGES`, `REGION_VALUES`). | L'adaptateur consomme les constantes du code, qui sont conformes à la table `EX-DATA-52`. | Dette de référentiel, à joindre à `D8-18` (confrontation Statbel/bpost, dette externe déjà admise). Aucun effet sur les fixtures. |
| **C-12** | INFO | `EX-DATA-105` écrit « quatorze entités » et `PLAN-3` / `ARCHITECTURE` disent « treize » ; `entities.ts` en type quatorze. | Je compte **14** entités et les confirme toutes couvertes (§ ci-dessous). | Déjà signalé en 2.4 ; correction documentaire. |
| **C-13** | MINEUR — **contraignant pour la génération** | L'OpenAPI range `efficiencyClass` du **côté NEDC** : le bloc `wltp` est « Forbidden if NEDC consumption values are set (`consumption`, `co2Emissions` **or `efficiencyClass`**) ». Le dictionnaire présente # 55 `co2Class` et # 56 `efficiencyClass` comme deux champs optionnels indépendants, sans dire qu'ils appartiennent à **deux branches exclusives** : une annonce mesurée WLTP porte `wltp.co2Class`, une annonce mesurée NEDC porte `efficiencyClass`. | Le schéma source **encode l'exclusion** (`dependentSchemas.wltp`) : les deux exemples complets sont donc complémentaires, `full.json` pour la branche WLTP, `full-nedc.json` pour la branche NEDC. | Aucune décision : contrainte de génération §7-17, désormais vérifiée par le schéma. |
| **E-07** | **MAJEUR — à trancher** | **42 des 82 champs du dictionnaire ne traversent pas `ListingColumnBatch`** : l'interface gelée compte 33 colonnes typées et 5 champs textuels (38 descripteurs), dont **37 seulement** portent un champ numéroté du dictionnaire — `booleanFlags` n'en porte aucun — auxquels s'ajoutent `snapshotId`, `observedAt` et `marketplace` portés par `SnapshotDescriptor`, soit **40 champs sur 82**. Parmi les absents, **10 sont des booléens** (# 9, 12, 27, 29, 46, 58, 61, 63, 68, 81) et la colonne `booleanFlags` (`Uint16Array`, 16 bits) **existe déjà, vide** : `generate.ts` y écrit `0` avec le commentaire « sémantique réservée à un lot ultérieur ». | Arithmétique : 4 de ces booléens ont un `DÉFAUT` documenté (# 9, 12, 29, 81 → `false`) et tiennent sur **1 bit** ; les 6 autres valent `INCONNU` si absents (# 27, 46, 58, 61, 63, 68) et exigent **2 bits** (valeur + connu). Total **4 × 1 + 6 × 2 = 16 bits exactement** : les dix booléens du dictionnaire tiennent dans `booleanFlags` **sans aucune modification de l'interface gelée**. | **D3-10** : définir dans `src/types` une table `BOOLEAN_FLAG_BIT` sur le modèle d'`INGEST_FLAG_BIT` (source unique du couple bit ↔ champ, comme l'a exigé DR-013), et la faire honorer par le provider fixture. Sinon, écrire la dette : dix champs du dictionnaire restent inaccessibles aux écrans alors que leur place physique est allouée et inutilisée. |
| **E-08** | MINEUR | Le dictionnaire ne définit **aucune date de publication d'annonce** (§3.3 E-01), alors que `PLAN-3` demande trois snapshots hebdomadaires avec un delta de 8–12 % d'entrées/sorties et des prix révisés. Sans champ canonique, « annonce récente » se réduit au booléen # 29 `isNewListing`. | Les trois dates OpenAPI sont dans la couche source ; le delta est déclaré dans le manifest (`delta`, `previousSnapshotId`) et vérifiable sur le NDJSON. | **D3-11** : accepter que le delta reste **vérifiable en couche source et manifest**, sans champ canonique en v1 ; ou ouvrir un champ `listedSinceYearMonth` au dictionnaire. Je recommande la première branche : aucune exigence d'écran ne réclame la date. |

**Hypothèses écrites comme hypothèses (E4).**

- **H-01** — `paintType` est supposé exister sur l'annonce parce qu'un filtre de recherche l'expose
  (`REF-filters.md` Z5 : « l'absence de filtre n'est pas l'absence de champ » — la réciproque, elle,
  n'est **pas** établie). Non observé, absent de l'OpenAPI.
- **H-02** — Le domaine de `publication.accurateState` (# 28) reste inconnu ; la valeur `active`
  employée dans les exemples est **plausible, non relevée**. Le champ n'est jamais un filtre.
- **H-03** — La forme du deeplink `webPage` (`https://www.autoscout24.be/offres/<uuid>`) est une
  reconstruction plausible : `FINDING-allowed-surface.md` atteste l'existence du champ, pas son
  gabarit. Seule la contrainte d'hôte (`autoscout24.<tld>`) est normative (`EX-DATA` # 2).
- **H-04** — La correspondance `evaluation.category` (3 niveaux) → `KYCAR_PRICE_EVALUATION`
  (6 niveaux) reste `[EXTRAPOLÉ]` au sens d'`EX-DATA-12` : aucune annonce portant les deux codes
  n'a été relevée.

### 4.1 Couche canonique — les 14 entités couvrent-elles le besoin ?

| Entité | Alimentée par | Verdict |
|---|---|---|
| `Snapshot` | `manifest.json` (snapshotId, capturedAt, seed → providerVersion, listingCount) + compteurs accumulés par l'adaptateur | **Couverte.** `sourceKind` vaudra `SYNTHETIC` ou une valeur `FIXTURE` selon la décision de `fixture-provider` (hors de mon périmètre : `SourceKind` est gelé à `'REAL' \| 'SYNTHETIC'`, l'extension est un point de la phase 3.3). |
| `Listing` | `As24Listing` via §3.1 | **Couverte en vue logique**, partiellement en vue physique — écart **E-07**. |
| `Make`, `Model` | `data/reference/taxonomy.json` | **Couvertes.** `Model.bodyTypes` reste le tableau vide (dette déjà signalée : `taxonomy.json` ne porte pas ce champ). |
| `Enumeration`, `EnumValue` | `data/reference/references/*.json`, `filters.json`, vocabulaires CRÉÉS | **Couvertes.** Le schéma source ré-énumère les mêmes codes ; la sonde de 3.3 doit vérifier l'égalité des ensembles (§8, S2). |
| `Region`, `PostalRegionRange` | table `EX-DATA-52` (via `BE_POSTAL_RANGES`) | **Couvertes** — sous réserve C-11 (fichiers de référence absents). |
| `MakeAggregate`, `ModelAggregate`, `DistributionBucket`, `SelectionStats`, `OutlierVerdict`, `DensityCell` | calculées par le moteur | **Couvertes**, aucune donnée source supplémentaire nécessaire. |

**Aucune entité manquante.** Les deux seuls champs que la source apporte et que le dictionnaire
exige sans que l'interface les transporte sont `co2Source` et `consumptionSource` (**C-03**) ; les
dix booléens de **E-07** sont exigés par le dictionnaire et disposent d'une place physique
inutilisée. Ces deux points sont des **décisions du coordinateur** : je ne modifie pas une interface
gelée.

---

## 5. R3 par construction

**Ce que le schéma interdit, et comment.**

1. **`additionalProperties: false` partout** — sur l'objet racine et sur les 12 objets imbriqués.
   Un champ interdit n'est pas « filtré » : il **fait échouer la validation**, donc la génération
   (`dataset-gen` valide chaque ligne, critère S2 de la phase 3.2). C'est la différence entre une
   mitigation structurelle et une mitigation conventionnelle exigée par `00-CONTEXT.md`.
2. **`seller` n'a que deux propriétés déclarées** : `type` (`P`/`D`) et `dealerBucket`. `seller.id`,
   `companyName`, `contactName`, un téléphone, un courriel, une URL de vitrine ou une adresse sont
   rejetés par la règle 1. C'est exactement ce que prouve `examples/invalid-r3.json`.
3. **`location` n'a que deux propriétés déclarées** : `countryCode` (ISO-2) et `postalCodePrefix2`
   (2 chiffres). Ni `zip`, ni `city`, ni `street`, ni `lat`/`lon` (E8–E11).
4. **Aucun champ de texte libre d'annonce** : ni `description` (E12), ni `condition.description`
   (E13). Le seul texte libre conservé est `modelVersion`, que le pipeline `EX-DATA-29` nettoie et
   dont la **liste d'arrêt** `version-stoplist.json` retire déjà les amorces de coordonnées
   (`tel `, `gsm `, `whatsapp`, `www.`, `.be`, `.nl`, `.com`, `@`) — deuxième barrière R3
   (`EX-DATA-30`).
5. **Aucune URL de média** : `imageCount` (entier, ≤ 50) remplace `images[]` et son `previewUrl`
   (E18) ; `hasVideo` (booléen) remplace `youtubeVideoUrl` (E19).
6. **Aucune donnée RGPD indirecte** : ni `vin` (E15), ni `licencePlate` (E16), ni
   `belgianCarpassMileageUrl` (E17). Ni les clés de référentiels tiers `hsn`, `tsn`, `natCode`,
   `schwackeCode`, `eCode` (E21), ni `offerReferenceId` / `crossReferenceId` (E20).
7. **`dealerBucket` est pseudonyme et non réversible** (D3-02) : 8 caractères hexadécimaux issus du
   hachage **salé** d'un identifiant **fictif**, sans table de correspondance publiée. Il ne
   franchit jamais l'interface `DataProvider` (aucune colonne : E-02). Il est **interdit** quand
   `seller.type = P` (§7, contrainte 4) : un particulier n'est pas un groupe.

**Décision proposée D3-06 — pourquoi la couche source ne porte pas le code postal exact.** La
mission de cadrage évoquait une « localisation vendeur au niveau code postal/ville/pays ». Trois
énoncés normatifs s'y opposent : `EX-DATA-47` E8 (code postal exact) et E9 (ville) les excluent du
modèle ; `EX-DATA-48` qualifie le code postal exact de **valeur transitoire**, écrite « dans aucune
structure persistante, aucun journal, aucun message d'erreur et aucun cache » ; le critère **S4** de
la phase 3.1 exige « zéro champ R3 dans la couche source ». Un fichier de fixtures versionné dans
le dépôt **est** une structure persistante. La couche source porte donc `postalCodePrefix2`,
c'est-à-dire la valeur **déjà tronquée** que l'adaptateur d'une source réelle produirait.

**Cette troncature ne perd rien.** Les 13 plages d'`EX-DATA-52` commencent toutes sur un multiple de
100 (1000, 1300, 1500, 2000, 3000, 3500, 4000, 5000, 6000, 6600, 7000, 8000, 9000), et un code
postal belge fait exactement 4 chiffres : le préfixe à deux chiffres détermine donc la plage **sans
ambiguïté**, et `regionCode` se dérive exactement comme depuis le code complet. La contrainte R3 ne
coûte ici aucune information analytique.

**Preuve exécutable (critère S4).** `node data/schema/validate.mjs` porte une **garde R3** : elle
collecte les 100 noms de propriété que le schéma autorise dans une instance, plus toutes les clés
présentes dans les exemples valides, et les confronte à la liste `R3_FORBIDDEN_FIELD_NAMES`
recopiée de `src/types/validation.ts` (y compris la règle des formes aplaties `sellerId`,
`dealerName`…). Sortie du 2026-09-09 :

```
OK   R3 schema source : 100 noms de propriete declares, 0 interdit(s)
OK   R3 exemples valides : 124 cles distinctes, 0 interdite(s)
```

**Deux avertissements pour `data-review` et pour toute extension du balayage `EX-DATA-49`.**

- Le **document de schéma** emploie légitimement le mot-clé JSON Schema `description`, qui figure
  sur la liste R3 (E12). Un balayage naïf de `data/schema/*.json` produirait un faux positif sur
  chaque annotation. Le garde doit porter sur le **vocabulaire d'instance** (`properties`, `$defs`,
  `items`), jamais sur les mots-clés du méta-schéma — c'est ce que fait `validate.mjs`.
- `data/schema/examples/invalid-r3.json` **contient délibérément** `seller.companyName` : c'est le
  contre-exemple dont la raison d'être est d'être **rejeté**. Il joue le même rôle que le bloc
  `exclus` de `filters-scope.json`, que le balayage R3 actuel écarte explicitement et pour le même
  motif (« R3 porte sur ce que KYCAR **retient** »). Si le balayage est étendu à `data/`, il doit
  écarter `data/schema/examples/invalid-*.json` **par nom**, et le dire.

---

## 6. Versionnement

**Une seule version gouverne le couple** `as24-listing.schema.json` + `snapshot-manifest.schema.json`
(ils sont publiés ensemble et l'un référence l'autre par la sémantique du manifest). Elle apparaît
à trois endroits, qui doivent coïncider :

1. `$id` du schéma : `https://kycar.local/schema/as24-listing/<version>` ;
2. l'annotation `x-kycar-schema-version` en tête de chaque schéma ;
3. le champ **obligatoire** `schemaVersion` de chaque `manifest.json`.

**Règle d'évolution (semver appliqué à un schéma de données).**

| Changement | Incrément | Exemples |
|---|---|---|
| Ajout d'un champ **optionnel** ; élargissement d'une borne ; **ajout** d'une valeur à une énumération ouverte (`anomalyKind`, vocabulaire enrichi côté AS24) ; ajout d'un champ optionnel au manifest | **MINEUR** | ajouter `location.regionCodeHint` ; ajouter `VERSION_TRUNCATED` à `anomalyKind` |
| Correction qui ne change ni le domaine ni la structure : formulation d'une `description`, exemple, motif rendu strictement équivalent | **CORRECTIF** | reformuler une description ; corriger une coquille dans un motif sans changer le langage reconnu |
| **Retrait** ou **renommage** d'un champ ; passage d'optionnel à **requis** ; **rétrécissement** d'une borne ou d'une énumération ; changement de type ou d'unité ; changement de sémantique à nom constant | **MAJEUR** | renommer `webPage` ; rendre `firstRegistrationDate` requis ; retirer `ca` de `marketplace` ; passer `mileage` en miles |

**Contrat du provider.** Le `FixtureDataProvider` lit `manifest.schemaVersion` **avant** toute
ligne et applique :

- **majeur inconnu** (majeur du manifest ≠ majeur que le provider implémente) → **refus**
  d'ouverture du snapshot, message explicite (`EX-NFR-28`, fr-BE), aucune ligne servie. Un schéma
  majeur inconnu peut avoir renommé ou retypé n'importe quel champ : servir « ce qu'on reconnaît »
  produirait des colonnes silencieusement vides.
- **mineur supérieur** à celui du provider → **acceptation**, avec un avertissement journalisé : par
  construction, un mineur n'ajoute que de l'optionnel, que le provider ignore sans se tromper.
- **mineur ou correctif inférieur** → acceptation sans réserve.

**Conséquence pour `dataset-gen`** : régénérer des fixtures après un changement **majeur** oblige à
régénérer **les trois snapshots** de chaque profil commité et à réécrire leur manifest ; un
changement mineur n'y oblige pas. C'est ce qui rend le coût d'un renommage visible **avant** de le
décider.

---

## 7. Ce que `dataset-design` et `dataset-gen` doivent respecter

Contraintes de **cohérence inter-champs** que le JSON Schema ne peut pas exprimer. Chacune est
opposable : `data-review` (phase 3.3) en fait une sonde. Une violation **délibérée** est licite à la
seule condition d'être déclarée dans `manifest.groundTruth` avec le code d'anomalie correspondant.

**Temps**

1. `firstRegistrationDate` (au mois) ≤ `createdAt` ≤ `firstActivatedDate` ≤ `lastUpdatedAt` ≤
   `manifest.capturedAt`. Aucune date d'annonce n'est postérieure à la capture (`EX-DATA` # 4 :
   `observedAt ≤ maintenant`, sinon le snapshot entier est rejeté).
2. `firstRegistrationDate ≤ (capturedAt.year + 1)-12` et `≥ 1900-01` (# 30) ; au-delà, déclarer
   `FIRST_REG_OUT_OF_RANGE`.
3. `nextInspectionDate ∈ [capturedAt − 24 mois, capturedAt + 48 mois]` (# 62).
4. Sur trois snapshots hebdomadaires : `capturedAt` strictement croissant, `previousSnapshotId`
   chaîné, et `delta.carriedOverCount + delta.enteredCount = listingCount`. Une annonce reconduite
   garde son `id`, son `createdAt` et son `firstActivatedDate` ; seuls le prix, `lastUpdatedAt` et
   `imageCount` peuvent bouger.

**Prix et TVA**

5. `prices.public.onRequestOnly = true` ⇒ `prices.public.price` **absent**. Le cas contraire
   (montant **et** drapeau) est licite mais doit être déclaré `PRICE_ON_REQUEST_WITH_AMOUNT` : il
   exerce `EX-DATA-32`.
6. `prices.public.price` absent **et** `onRequestOnly` absent ou faux ⇒ à déclarer
   `PRICE_MISSING_UNDECLARED` (`EX-DATA-18` : c'est un défaut d'extraction, pas une décision de
   vendeur).
7. `isTaxDeductible = true` ⇒ `seller.type = "D"`. Un particulier ne facture pas de TVA
   récupérable. (`dataset-design` vise ≈ 35 % des professionnels.)
8. `netPrice < price` (`EX-DATA` # 13) ; `vatRate` à **une** décimale ; `currency = "EUR"` sur les
   marchés `be` et `nl`.
9. `price < 250` ⇒ déclarer `PRICE_SENTINEL_ABSOLUTE` ; `price > 5 000 000` ⇒ déclarer
   `PRICE_OUT_OF_RANGE`. Après normalisation à l'euro, le seuil de sentinelle est **de fait**
   `≤ 249` (`EX-DATA-2`, conséquence assumée).
10. La part d'annonces à prix affiché doit rester **≥ 80 %** de l'effectif, faute de quoi
    `coverageWarning.price` est vrai sur **tous** les agrégats (`EX-DATA-17`) et l'avertissement ne
    signale plus rien.

**Vendeur et géographie**

11. `seller.dealerBucket` présent **si et seulement si** `seller.type = "D"`.
12. Un `dealerBucket` regroupe plusieurs annonces (c'est son objet) ; un doublon **inter-vendeurs**
    est une paire d'annonces au même véhicule et à `dealerBucket` **différents**, déclarée
    `CROSS_SELLER_DUPLICATE` avec `peerListingId`.
13. `location.countryCode = "BE"` pour le marché `be` ; `location.postalCodePrefix2` ∈ `10`..`99`
    — les codes postaux belges couvrent `1000`..`9999` sans trou, donc tout préfixe de cet
    intervalle résout une région. Un préfixe `00`..`09` ne résout rien : à déclarer
    `REGION_UNRESOLVED`. La densité par préfixe est le livrable de `dataset-design` (pondération par
    population).
14. `manifest.marketplace` = `marketplace` de **chaque** ligne du fichier.
15. La part d'annonces à `adProduct.tier` présent doit rester **< 30 %**, sans quoi
    `coverageWarning.samplingBias` est vrai partout (`EX-DATA-43`) et le diagnostic de
    représentativité perd son sens.

**Motorisation, mesure, écologie**

16. `powerHp = arrondi(power / 0,7355)` quand `powerUnit = "kW"` (soit `power × 1,35962`, mêmes
    six premiers chiffres). Un écart **> 2 %** est licite mais doit être déclaré
    `POWER_UNIT_MISMATCH` — c'est la sonde d'`EX-DATA-36`.
17. **Une seule branche de mesure par annonce** : soit le bloc `wltp.*`, soit le triplet
    (`co2Emissions`, `consumption.*`, `efficiencyClass`), **jamais les deux** — l'OpenAPI l'interdit
    explicitement (« Forbidden if NEDC consumption values are set (`consumption`, `co2Emissions` or
    `efficiencyClass`) ») et `EX-DATA-35` en fait la condition de `co2Source`. **Cette contrainte
    est la seule de cette liste que le schéma sait exprimer** : elle est encodée en
    `dependentSchemas` et une ligne qui la viole est rejetée à la génération. Les champs
    `…WithFallback`, s'ils accompagnent une branche, doivent porter **exactement** la valeur retenue
    par la priorité `wltp > NEDC > fallback`, sinon deux chiffres différents décriraient la même
    annonce — cela, en revanche, reste une sonde.
18. `fuelCategory = "E"` (électrique) ⇒ CO₂ = 0 porté par `co2Emissions` **ou** par
    `co2EmissionInGramPerKmWithFallback`, **jamais** par `wltp.co2EmissionsCombined`, dont le
    minimum OpenAPI est 1 (C-06). Un CO₂ à 0 sur une autre catégorie doit être déclaré
    `CO2_ZERO_NON_BEV`.
19. `isPluginHybrid = true` ⇒ `fuelCategory ∈ {"2", "3", "O"}` (contrainte OpenAPI reprise par la
    colonne « Validation » du champ # 46) ; sinon déclarer `HYBRID_INCONSISTENT`.
20. `electricRange`, `battery.*` et les consommations électriques ne sont renseignés que pour
    `fuelCategory ∈ {"E", "2", "3"}` ; `cylinderCapacity` et `cylinderCount` sont absents pour
    `fuelCategory = "E"`.
21. `mileage = 0` n'est admis sans réserve que si `offerType ∈ {"N", "S", "D"}` ; sinon déclarer
    `SUSPECT_ZERO_MILEAGE` (`EX-DATA-38`).
22. Kilométrage plausible : `mileage × 12 / max(âge_en_mois, 6) ≤ 200 000` (# 34). Les bandes
    réalistes par segment et par âge sont le livrable de `dataset-design` ; au-delà de la borne,
    déclarer `MILEAGE_IMPLAUSIBLE_FOR_AGE`.

**Forme du fichier et déterminisme**

23. Le drapeau `FIRST_REG_UNPARSEABLE` est **inatteignable** depuis une ligne conforme au schéma
    (C-07) : ne pas le déclarer en vérité terrain ; il reste couvert par les tests unitaires de
    l'adaptateur, qui fabriquent leurs enregistrements.
24. **Décimales** : les valeurs de consommation, de CO₂ et de capacité de batterie portent **au plus
    une** décimale et doivent être écrites telles quelles (`5.6`, jamais `5.6000000000000005`). Le
    schéma **ne peut pas** l'imposer : `multipleOf: 0.1` est faux en virgule flottante binaire
    (`5.6 / 0.1 ≠ 56`). C'est une sonde de `data-review`, pas une règle de schéma.
25. **Ordre des clés stable** : le générateur émet les propriétés dans un ordre fixe et documenté.
    Le déterminisme « même graine = mêmes octets » (critère S1 de 3.2) porte sur les octets du
    NDJSON, donc sur l'ordre de sérialisation autant que sur les valeurs.
26. `listingId` **unique** dans un snapshot, sauf doublons injectés déclarés
    (`DUPLICATE_LISTING_ID`, `DUPLICATE_VALUE_CONFLICT`) ; minuscules, forme 8-4-4-4-12.
27. `webPage` contient l'`id` de l'annonce et pointe l'hôte du marché (`www.autoscout24.be` pour
    `be`) : c'est ce que la validation d'`EX-DATA` # 2 contrôle, et c'est l'hypothèse **H-03**.
28. `imageCount ≤ 50` (borne `maxItems` de la source) ; `equipment` sans doublon.
29. `modelVersion` ne contient **jamais** un numéro de téléphone, un courriel ou une URL — ils
    seraient retirés par la liste d'arrêt (`EX-DATA-30`) mais auraient existé dans un fichier
    versionné, ce que R3 interdit. Une part d'annonces dont `modelVersion` est **entièrement**
    dépouillée par le nettoyage est réaliste : la déclarer `VERSION_FULLY_STRIPPED`.
30. `paintType` (H-01, C-10) reste **majoritairement absent** : le champ n'a jamais été observé, et
    un remplissage systématique ferait passer une hypothèse pour un fait.
31. `manifest.sha256` porte sur les octets **non compressés** du NDJSON (la sortie gzip dépend de la
    version de zlib et ne prouve pas le déterminisme) ; `sha256Gz`, optionnel, vérifie le fichier
    livré.

---

## 8. Critères de succès de la phase 3.1 — preuves

| Critère | Verdict | Preuve |
|---|---|---|
| **S1** — `DATA-MODEL.md` couvre 100 % des champs du dictionnaire (champ → source AS24 → canonique, ou « sans équivalent, justifié ») | **ATTEINT** | Table §3.1 : **82 lignes numérotées de 1 à 82**, une par champ du dictionnaire, chacune avec son chemin source ou la mention **DÉRIVÉ**. Table §3.2 : les 21 champs sans chemin source, classés par motif. Table §3.3 : le symétrique (champs source sans équivalent canonique). Contrôle : `grep -cE '^\| *[0-9]+ \| ' docs/data/DATA-MODEL.md` → 82. |
| **S2** — JSON Schema valide (ajv, devDep) sur un exemple minimal et un exemple complet | **ATTEINT** | `node data/schema/validate.mjs` → `moteur : ajv 8.20.0` ; `minimal.json` **valide**, `full.json` **valide**, `full-nedc.json` **valide** (branche NEDC, exclusive de la branche WLTP par C-13 : les deux exemples se partagent les champs, `full.json` couvrant `wltp.*` et `full-nedc.json` couvrant `co2Emissions`, `consumption.*` et `efficiencyClass`), `manifest.json` **valide** contre le schéma de manifest ; `invalid-r3.json` **rejeté** (`/seller must NOT have additional properties`), `invalid-date.json` **rejeté** (motif `firstRegistrationDate`). Le script **sort en erreur** si un cas « valide » échoue ou si un cas « invalide » passe. Le même script tourne sans ajv (`KYCAR_SCHEMA_VALIDATOR=fallback`, validateur interne) et rend le **même verdict** sur les six cas. |
| **S3** — `DATASET-SPEC.md` : chaque distribution a une formule, des paramètres chiffrés, une justification et une sonde | **hors périmètre** | Livrable de `dataset-design`. Ce document lui fournit les 31 contraintes de cohérence de §7 et les codes d'anomalie du manifest. |
| **S4** — zéro champ R3 dans la couche source | **ATTEINT** | §5. Preuve exécutable dans `validate.mjs` : `R3 schema source : 100 noms de propriete declares, 0 interdit(s)` et `R3 exemples valides : 124 cles distinctes, 0 interdite(s)`, confrontés à la liste `R3_FORBIDDEN_FIELD_NAMES` de `src/types/validation.ts` (E1–E17, formes aplaties comprises). La barrière est **structurelle** : `additionalProperties: false` sur les 13 objets du schéma, et `seller` / `location` réduits à deux propriétés chacun. |

**Commande unique de vérification**

```bash
node data/schema/validate.mjs        # 8 contrôles, sortie 0 attendue
```

---

## 9. Journal des décisions proposées au coordinateur

| Réf. | Objet | Pourquoi je ne tranche pas |
|---|---|---|
| **D3-06** | La couche source porte `location.postalCodePrefix2`, jamais le code postal exact ni la ville | La mission de cadrage évoquait « code postal / ville » ; `EX-DATA-47`/`48` et le critère S4 disent l'inverse. J'ai tranché **dans le sens de R3** et je le remonte : la décision engage la forme des fixtures. |
| **D3-07** | La 9ᵉ valeur de `KYCAR_MARKETPLACE` est `ca` (Canada), pas `UNKNOWN_9` | Modifie un **vocabulaire gelé** et l'énoncé d'`EX-DATA-40`. |
| **D3-08** | `co2Source` / `consumptionSource` : v2 de `ListingColumnBatch` (1 octet) ou statu quo déclaré | Modifie une **interface gelée** (dette `D8-32`, dont le motif écrit ne tient plus). |
| **D3-10** | Définir `BOOLEAN_FLAG_BIT` : 10 booléens du dictionnaire tiennent **exactement** dans les 16 bits de `booleanFlags`, déjà alloués et inutilisés | Donne une sémantique à une colonne gelée ; concerne `src/types` et le provider, hors de mon périmètre d'écriture. |
| **D3-11** | Pas de champ canonique de date de publication en v1 ; le delta inter-snapshots reste vérifiable en couche source et manifest | Décide de ne **pas** étendre le dictionnaire ; à acter pour que `data-review` ne l'exige pas. |

*(Les identifiants D3-06 à D3-11 sont proposés ; leur attribution définitive appartient au
coordinateur, `reports/data/DATA-LEAD-DECISIONS.md`.)*
