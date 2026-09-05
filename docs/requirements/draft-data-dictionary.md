# Dictionnaire de données et modèle d'agrégation KYCAR

> Section autonome produite par l'agent `req-data` de la phase 2.1 du plan `PLAN-2-app-build.md`.
> Destinée à l'assemblage dans `REQUIREMENTS.md` (sections imposées 3 et 4).
> Chaque exigence porte un identifiant `EX-DATA-<n>`. Chaque décision contestable porte sa
> justification en une phrase, préfixée **Justification**.

## Sommaire

- Partie A — Dictionnaire de données des annonces (A.0 à A.9)
- Partie B — Modèle d'agrégation (B.0 à B.8)
- Partie C — Entités, volumétrie et index (C.0 à C.5)
- Annexe D — Décisions à contester en phase 2.2

---

# Partie A — Dictionnaire de données des annonces

## A.0 Conventions et niveaux de preuve

**EX-DATA-1.** Tout champ du modèle de données KYCAR est nommé en anglais, en `camelCase`, sans
abréviation autre que les unités (`Km`, `Kw`, `Hp`, `Eur`, `GPerKm`, `L100Km`, `Kwh`, `Ccm`).
Aucun champ ne porte un nom dont la lecture dépend du contexte — en particulier, **aucun champ
nommé `fuel`** n'existe (application de la décision V1).

**EX-DATA-2.** Colonnes du dictionnaire :

| Colonne | Contenu |
|---|---|
| `#` | numéro d'ordre stable dans le dictionnaire |
| Champ KYCAR | identifiant technique |
| Libellé FR | libellé métier affichable |
| Type / unité | `entier`, `décimal(d)` (d décimales), `énum(<VOCABULAIRE>)`, `chaîne(n)` (n = longueur max), `booléen`, `date(YYYY-MM)`, `timestamp`, `tableau<T>(min..max)` ; unité entre parenthèses |
| Card. | `1` obligatoire simple, `0..1` optionnel simple, `0..n` collection |
| Obl. | `OBL` obligatoire, `OPT` optionnel, `DER` dérivé (jamais fourni par la source) |
| Source | chemin exact dans la donnée observée (`FINDING-allowed-surface.md` § 2.3), ou `OAS:<chemin>` pour le schéma OpenAPI `as24-listing-creation-openapi.yml`, ou `DÉRIVÉ : <formule>` |
| Énum. | vocabulaire nommé de rattachement (§ A.1) |
| Normalisation | transformation appliquée à l'ingestion, unité canonique |
| Validation | bornes de plausibilité et verdict hors bornes |
| Si absent | `REJET` (l'annonce entière est écartée), `DÉFAUT=<v>`, `INCONNU` (valeur nulle + exclusion des agrégats concernés) |

**EX-DATA-3.** Niveaux de preuve, repris de la règle R6 :
`OBSERVÉ` = champ relevé sur une annonce réelle (`FINDING-allowed-surface.md` § 2.3) ·
`SCHÉMA` = champ présent dans l'OpenAPI officiel mais non relevé sur une annonce ·
`DÉRIVÉ` = calculé par KYCAR · `[À CONFIRMER]` = présence ou sémantique non établie.
Un champ `SCHÉMA` absent des annonces réelles reste dans le dictionnaire mais **ne peut porter
aucune exigence d'écran** ; il vaut `INCONNU` par défaut.

**EX-DATA-4.** Unités canoniques imposées à l'ingestion, quelle que soit l'unité de la source :
prix en **euro entier** (EUR), kilométrage en **kilomètre entier** (km), puissance en **kilowatt
entier** (kW), CO₂ en **gramme par kilomètre à une décimale** (g/km), consommation thermique en
**litre par 100 km à une décimale** (l/100km), consommation électrique en **kWh/100 km à une
décimale**, autonomie en **kilomètre entier**, cylindrée en **cm³ entier**, dates de véhicule au
**mois calendaire** (`YYYY-MM`), horodatages en **UTC ISO-8601**.
**Justification** : l'OpenAPI expose des champs `*Unit` (`powerUnit`, `mileageUnit`,
`co2EmissionsUnit`, `combinedUnit`, `emptyWeightUnit`…) qui prouvent que la source peut livrer
des unités impériales ; sans unité canonique imposée, une agrégation mélangerait des miles et
des kilomètres sans erreur visible.

**EX-DATA-5.** Toute conversion d'unité à l'ingestion est **refusée** si le champ `*Unit`
correspondant est présent et vaut une unité non gérée : l'annonce est alors marquée
`ingestFlags += UNIT_UNSUPPORTED` et le champ concerné vaut `INCONNU`. Aucune conversion n'est
devinée.

**EX-DATA-6.** L'arrondi de tout décimal est **arrondi au plus proche, demi vers l'infini en
valeur absolue** (`round-half-away-from-zero`). L'arrondi bancaire est interdit.
**Justification** : deux implémentations correctes doivent produire le même chiffre au centime,
et `round-half-even` diffère de `round-half-up` sur un cas sur vingt aux bornes de bins.

**EX-DATA-7.** Toute normalisation de chaîne applique, dans cet ordre : normalisation Unicode
**NFC**, suppression des caractères de contrôle U+0000–U+001F et U+007F–U+009F, remplacement de
toute suite d'espaces Unicode par un espace simple U+0020, `trim`. Cette normalisation est
appliquée **avant** toute comparaison, tout hachage et toute troncature.

## A.1 Vocabulaires nommés

**EX-DATA-8.** Toute valeur énumérée du modèle KYCAR appartient à un **vocabulaire nommé**
explicitement, chargé depuis un fichier du dépôt. Aucun code énuméré n'est interprété sans que
son vocabulaire soit connu. Un code reçu et absent de son vocabulaire déclenche
`ingestFlags += ENUM_UNKNOWN_<VOCABULAIRE>` et le champ vaut `INCONNU` — **jamais** un
rattachement au code le plus proche.

| Vocabulaire KYCAR | n (périmètre voiture) | Origine | Fichier de vérité |
|---|---:|---|---|
| `KYCAR_FUEL_CATEGORY` | 10 | vocabulaire de **recherche** AutoScout24 | `data/reference/filters.json` → `enumerations.fuel` ; recoupé par `references/FuelCategory.json` (11 valeurs dont `T` réservée aux motos) |
| `KYCAR_FUEL_TYPE` | 16 | vocabulaire de **création** AutoScout24 | `data/reference/references/FuelType.json` |
| `KYCAR_OFFER_TYPE` | 6 | recherche ∩ création (identiques, V-verdict IDENTIQUES) | `references/OfferType.json` |
| `KYCAR_USAGE_STATE` | 3 | recherche (`ustate` : `A`, `N`, `U`) | `filters.json` → `ustate` |
| `KYCAR_TRANSMISSION` | 3 | identiques | `references/Transmission.json` |
| `KYCAR_DRIVETRAIN` | 3 | identiques | `references/Drivetrain.json` |
| `KYCAR_BODY_TYPE` | 9 | recherche ⊂ création ; **restreint aux 9 codes voiture** | `references/BodyType.json` filtré `vehicleType ∋ "C"` |
| `KYCAR_BODY_COLOR` | 14 | identiques | `references/BodyColor.json` |
| `KYCAR_PAINT_TYPE` | 5 | recherche seule (`ptype`) | `filters.json` → `ptype` |
| `KYCAR_UPHOLSTERY_TYPE` | 6 | identiques | `references/UpholsteryType.json` |
| `KYCAR_UPHOLSTERY_COLOR` | 11 | identiques | `references/UpholsteryColor.json` |
| `KYCAR_EU_EMISSION_STANDARD` | 11 | identiques | `references/EuEmissionStandard.json` |
| `KYCAR_CO2_CLASS` | 7 | création seule (`10`=A … `70`=G) | `references/Co2Class.json` |
| `KYCAR_EFFICIENCY_CLASS` | 10 | création seule | `references/EfficiencyClass.json` |
| `KYCAR_BATTERY_OWNERSHIP` | 3 | identiques | `references/BatteryOwnershipType.json` |
| `KYCAR_EQUIPMENT` | 132 | intersection recherche ∩ création, périmètre voiture | `references/Equipment.json` filtré `vehicleType ∋ "C"` |
| `KYCAR_SEAL` | 14 | recherche seule (`sealor`, BE fr-BE) | `filters.json` → `sealor` |
| `KYCAR_SELLER_TYPE` | 2 | recherche (`custtype` : `P`, `D`) | `filters.json` → `custtype` |
| `KYCAR_PRICE_EVALUATION` | 6 | **CRÉÉ** — échelle de création `PriceLabel` retenue comme canonique | `references/PriceLabel.json` + table de projection § A.1.2 |
| `KYCAR_AD_TIER` | 5 | OpenAPI `Tier` + valeur `NONE` créée | `OAS:components.schemas.Tier` |
| `KYCAR_MARKETPLACE` | 9 | OpenAPI `Marketplace` | `OAS:components.schemas.Marketplace` |
| `KYCAR_VEHICLE_TYPE` | 1 | `C` seul dans le périmètre | `references/VehicleType.json` |
| `KYCAR_REGION` | 11 (BE) | **CRÉÉ** — NUTS-2 2021 | table § A.8 |
| `KYCAR_PRICE_STATUS` | 3 | **CRÉÉ** | § A.5.3 |
| `KYCAR_MEASUREMENT_STANDARD` | 3 | **CRÉÉ** (`WLTP`, `NEDC`, `UNKNOWN`) | § A.5.5 |
| `KYCAR_INGEST_FLAG` | 14 | **CRÉÉ** | § A.6 |
| `KYCAR_OUTLIER_FLAG` | 6 | **CRÉÉ** | § B.6 |
| `KYCAR_PUBLICATION_STATE` | `[À CONFIRMER]` | `publication.accurateState` relevé, domaine non énuméré | — |

**EX-DATA-9 — application de V1, collision de codes carburant.** `KYCAR_FUEL_CATEGORY` et
`KYCAR_FUEL_TYPE` sont deux vocabulaires **disjoints par construction** portés par deux champs
distincts, `fuelCategory` et `fuelTypePrimary`. Toute fonction qui décode un code carburant prend
le vocabulaire en paramètre explicite ; il est interdit d'exposer une fonction de décodage à un
seul argument. Le code `2` vaut « Électrique/Essence » dans `KYCAR_FUEL_CATEGORY` et « Super 95 »
dans `KYCAR_FUEL_TYPE`, et le code `3` vaut « Électrique/Diesel » contre « Super Plus 98 ».
**Justification** : l'erreur est silencieuse — aucune exception, aucune valeur invalide, seulement
un hybride essence transformé en essence Super 95, ce qui fausse ensuite toute distribution par
carburant.

**EX-DATA-10.** La table de correspondance `KYCAR_FUEL_TYPE → KYCAR_FUEL_CATEGORY` est
*many-to-one*, marquée `[EXTRAPOLÉ]` (décision V2 non encore confirmée) et n'est utilisée
**qu'en repli** quand `fuelCategory` est absent et `fuelTypePrimary` présent :

| Codes `KYCAR_FUEL_TYPE` | → `KYCAR_FUEL_CATEGORY` |
|---|---|
| `1`, `4`, `5`, `6` (Essence 91, E10 91, Super E10 95, Super Plus E10 98) | `B` Essence |
| `2`, `3` (Super 95, Super Plus 98) | `B` Essence |
| `7`, `8` (Diesel, Diesel écologique) | `D` Diesel |
| `9` (GPL) | `L` GPL |
| `10`, `11` (Gaz naturel H, L) | `C` CNG |
| `12` (Électrique) | `E` Électrique |
| `13` (Hydrogène) | `H` Hydrogène |
| `16` (Ethanol) | `M` Ethanol |
| `14`, `15` (Vegetable oil, Biogas) | `O` Autres |

**EX-DATA-11.** Aucun code de `KYCAR_FUEL_TYPE` ne projette sur `2` (Électrique/Essence) ni `3`
(Électrique/Diesel). La catégorie hybride est donc **inatteignable par ce repli** : quand
`fuelCategory` est absent et que `isPluginHybrid` vaut vrai, `fuelCategory` vaut `INCONNU` et
l'annonce est marquée `ingestFlags += HYBRID_CATEGORY_UNRESOLVED`, jamais rattachée à `B` ou `D`.
**Justification** : rattacher un hybride essence à « Essence » gonflerait la catégorie Essence et
viderait la catégorie hybride, exactement l'erreur que V1 cherche à empêcher.

### A.1.2 Projection des deux échelles d'évaluation de prix (décision V5)

**EX-DATA-12.** Le vocabulaire canonique de l'évaluation de prix est l'échelle **à 6 niveaux** de
`PriceLabel` (création). L'échelle à 3 niveaux `pe_category` (recherche) y est projetée :

| `pe_category` (recherche) | `KYCAR_PRICE_EVALUATION` (canonique) | Libellé | Preuve |
|---|---|---|---|
| — | `0` | Inconnu | `PriceLabel` |
| `1` Très bon prix | `1` | Offre top | `[EXTRAPOLÉ]` — alignement ordinal |
| `2` Bon prix | `2` | Bonne offre | `[EXTRAPOLÉ]` |
| `3` Prix correct | `3` | Offre équitable | `[EXTRAPOLÉ]` |
| (aucun filtre) | `4` | Un peu cher | `PriceLabel` |
| (aucun filtre) | `5` | Cher | `PriceLabel` |

**Justification** : les rangs ordinaux se correspondent un pour un sur les trois premiers niveaux
et l'échelle de création est un sur-ensemble strict, donc la projection ne perd aucune information
et n'en invente aucune ; elle reste `[EXTRAPOLÉ]` car aucune annonce portant les deux codes n'a
été relevée.

**EX-DATA-13.** `priceEvaluationCategory` est conservé comme **référence externe de détection
d'outlier** (décision V5). Il n'entre dans **aucune** de nos méthodes de détection (§ B.6) : il
sert exclusivement à mesurer l'accord entre nos méthodes et celle d'AutoScout24 (§ B.6.4).
**Justification** : le modèle de prix d'AutoScout24 n'est pas publié, donc l'utiliser comme
entrée ferait de KYCAR un miroir d'une boîte noire au lieu d'un détecteur indépendant.

## A.2 Dictionnaire principal — bloc Identité et provenance

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `listingId` | Identifiant d'annonce | `chaîne(36)` UUID | 1 | OBL | `listings[].id` (OBSERVÉ) ; `OAS:BaseSharedAllSellersNoImages.id` | — | minuscules, forme canonique 8-4-4-4-12 | doit correspondre à `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` ; sinon REJET | REJET |
| 2 | `listingUrl` | Lien vers l'annonce d'origine | `chaîne(512)` URL | 1 | OBL | `listings[].details.webPage` (OBSERVÉ) | — | schéma forcé `https`, fragment et paramètres de campagne (`utm_*`, `cldtidx`, `search_id`, `query_id`) supprimés | hôte doit appartenir au domaine `autoscout24.<tld>` ; sinon REJET | REJET |
| 3 | `snapshotId` | Identifiant du snapshot | `chaîne(32)` | 1 | DER | `DÉRIVÉ : identifiant du lot d'ingestion, `<marketplace>-<capturedAt en YYYYMMDDTHHmmssZ>`` | — | — | — | REJET |
| 4 | `observedAt` | Date d'observation | `timestamp` UTC | 1 | DER | `DÉRIVÉ : horodatage UTC du début du lot d'ingestion` | — | ISO-8601 à la seconde, suffixe `Z` | ≤ maintenant ; sinon REJET du snapshot entier | REJET |
| 5 | `marketplace` | Place de marché d'origine | `énum` | 1 | OBL | `DÉRIVÉ : domaine interrogé` ; `OAS:Marketplace` | `KYCAR_MARKETPLACE` | minuscules | ∈ vocabulaire ; sinon REJET | REJET |
| 6 | `vehicleType` | Type de véhicule | `énum` | 1 | OBL | `listings[].type` (OBSERVÉ, `[À CONFIRMER]`) ; `OAS:VehicleTypeId` | `KYCAR_VEHICLE_TYPE` | majuscule | doit valoir `C` ; sinon REJET | REJET |

**EX-DATA-14.** `listingUrl` est obligatoire et son absence provoque le rejet de l'annonce.
**Justification** : `00-CONTEXT.md` fonde l'architecture sur « un deeplink vers l'annonce
d'origine plutôt que dupliquer son contenu » — une annonce sans deeplink est un point de donnée
que l'utilisateur ne peut pas vérifier, donc invérifiable et sans valeur pour la détection
d'opportunité.

**EX-DATA-15.** Le couple `(snapshotId, listingId)` est la clé primaire de l'entité `Listing`.
Un `listingId` en doublon **au sein d'un même snapshot** provoque la conservation de la première
occurrence rencontrée dans l'ordre d'ingestion et un compteur
`snapshot.duplicateListingCount += 1` ; l'occurrence suivante est écartée sans erreur.
**Justification** : l'échantillonnage par modèle décrit en `FINDING-allowed-surface.md` § 2.3
peut servir la même annonce depuis deux pages modèle voisines, et un rejet dur ferait échouer un
snapshot pour une cause bénigne.

## A.3 Dictionnaire principal — bloc Prix

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 7 | `priceEur` | Prix affiché | `entier` (EUR) | 0..1 | OPT | `listings[].details.prices.public.amountInEUR.raw` (OBSERVÉ) ; `OAS:Price.price` (`minimum: 1`) | — | arrondi à l'euro entier ; `.formatted` **jamais** utilisé comme source | `1 ≤ p ≤ 5 000 000` sinon REJET · `p < 250` → `ingestFlags += SUSPECT_PRICE_FLOOR` et exclusion des statistiques de prix (annonce conservée) | INCONNU → `priceStatus` déduit (# 8) |
| 8 | `priceStatus` | État du prix | `énum` | 1 | DER | `DÉRIVÉ` : `QUOTED` si `priceEur` connu ; `ON_REQUEST` si `priceEur` absent et `priceOnRequestOnly = true` ; `MISSING` sinon | `KYCAR_PRICE_STATUS` | — | exhaustif par construction | — |
| 9 | `priceOnRequestOnly` | Prix sur demande | `booléen` | 1 | OPT | `listings[].details.prices.public.onRequestOnly` (OBSERVÉ) | — | — | — | DÉFAUT=`false` |
| 10 | `isTaxDeductible` | TVA récupérable | `booléen` | 0..1 | OPT | `listings[].details.prices.public.taxDeductible` (OBSERVÉ) ; `OAS:PublicPrice.isTaxDeductible` | — | — | — | INCONNU |
| 11 | `priceEvaluationCategory` | Évaluation du prix par la source | `énum` | 0..1 | OPT | `listings[].details.prices.public.evaluation.category` (OBSERVÉ) | `KYCAR_PRICE_EVALUATION` | projection § A.1.2 | ∈ vocabulaire sinon INCONNU + `ENUM_UNKNOWN_PRICE_EVALUATION` | DÉFAUT=`0` (Inconnu) |
| 12 | `isSuperDeal` | Label SuperDeal | `booléen` | 0..1 | OPT | `listings[].superDeal` (OBSERVÉ) | — | — | — | DÉFAUT=`false` |
| 13 | `netPriceEur` | Prix hors TVA | `entier` (EUR) | 0..1 | OPT | `OAS:PublicPrice.netPrice` (SCHÉMA) | — | arrondi à l'euro | `1 ≤ n < priceEur` sinon INCONNU | INCONNU |
| 14 | `vatRatePercent` | Taux de TVA | `décimal(1)` (%) | 0..1 | OPT | `OAS:PublicPrice.vatRate` (SCHÉMA) | — | 1 décimale, troncature au-delà (règle de la source) | `0 ≤ v ≤ 100` sinon INCONNU | INCONNU |
| 15 | `msrpEur` | Prix catalogue constructeur | `entier` (EUR) | 0..1 | OPT | `OAS:PricesShared.manufacturersSuggestedRetail.price` (SCHÉMA) | — | arrondi à l'euro | `1 ≤ m ≤ 5 000 000` sinon INCONNU | INCONNU |

**EX-DATA-16 — règle du prix sur demande.** Une annonce dont `priceStatus ≠ QUOTED` :
(a) **compte** dans tout effectif (`listingCount` d'un agrégat marque ou modèle, effectif d'une
sélection) ;
(b) est **exclue** de toute statistique de prix (moyenne, médiane, quartiles, écart-type, min,
max, percentiles) ;
(c) est **exclue** de l'histogramme des prix ;
(d) est **exclue** des deux méthodes de détection d'outlier (§ B.6) ;
(e) est **exclue** du nuage tri-dimensionnel (§ B.7), qui exige un prix sur l'un de ses trois axes ;
(f) est **incluse** dans les histogrammes de kilométrage et d'année, et dans les statistiques de
ces deux métriques, si ces champs sont par ailleurs connus.
**Justification** : le prix sur demande est une information sur l'offre (elle existe) mais pas sur
le prix (il est inconnu) — la compter dans l'effectif et l'exclure des distributions est la seule
lecture qui ne mente sur aucun des deux chiffres.

**EX-DATA-17.** Tout agrégat qui publie une statistique de prix publie conjointement
`priceQuotedCount`, `priceOnRequestCount`, `priceMissingCount` et
`priceCoverage = priceQuotedCount / listingCount` arrondi à 4 décimales. Quand
`priceCoverage < 0,80`, l'agrégat porte `coverageWarning.price = true`.
**Justification** : un prix médian calculé sur 40 % d'une population n'est pas faux, il est non
représentatif — le seuil rend cette réserve mesurable au lieu de l'abandonner à l'appréciation.

**EX-DATA-18.** `priceStatus = MISSING` (prix absent **sans** `onRequestOnly`) est un état
distinct de `ON_REQUEST`, marqué `ingestFlags += PRICE_MISSING_UNDECLARED`, et compté séparément.
**Justification** : `ON_REQUEST` est une décision du vendeur, `MISSING` est un défaut d'extraction
— les confondre masquerait une régression de l'adaptateur `DataProvider`.

**EX-DATA-19.** Le seuil `SUSPECT_PRICE_FLOOR` est fixé à **250 €**.
**Justification** : la source elle-même annonce un minimum d'occasion de 119 € (`priceInfo`,
`FINDING-allowed-surface.md` § 2.2), montant sous lequel aucun véhicule roulant ne s'échange —
c'est un prix d'appel ou de contournement, et l'inclure tirerait tout minimum de fourchette et
toute borne basse d'histogramme vers une valeur qui ne décrit aucun marché.

## A.4 Dictionnaire principal — bloc Classification, offre et état administratif

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 16 | `makeId` | Identifiant de marque | `entier` | 1 | OBL | `DÉRIVÉ : recherche de listings[].make.formatted normalisé dans data/reference/taxonomy.json` ; `OAS:BaseSharedAllSellersNoImages.make` | — | résolution insensible à la casse et aux diacritiques sur le libellé normalisé (EX-DATA-7) | doit exister dans `taxonomy.json` (295 marques) sinon REJET | REJET |
| 17 | `makeName` | Marque | `chaîne(50)` | 1 | OBL | `taxonomy.json` → `makes[].label` (canonique) ; `listings[].make.formatted` (brut) | — | **le libellé canonique du référentiel prime sur le libellé de l'annonce** | non vide | REJET |
| 18 | `modelId` | Identifiant de modèle | `entier` | 0..1 | OPT | `DÉRIVÉ : recherche de listings[].model.formatted dans taxonomy.json, restreinte aux modèles de makeId` ; `OAS:...model` | — | idem `makeId` | doit exister dans les modèles de `makeId` (4 955 modèles au total) sinon INCONNU + `MODEL_UNRESOLVED` | INCONNU |
| 19 | `modelName` | Modèle | `chaîne(50)` | 0..1 | OPT | `taxonomy.json` → `makes[].models[].label` (canonique) ; `listings[].model.formatted` (brut) | — | libellé canonique du référentiel prioritaire | non vide | INCONNU |
| 20 | `modelVersionRaw` | Version déclarée (brute) | `chaîne(121)` | 0..1 | OPT | `listings[].modelVersionInput` (OBSERVÉ) ; `OAS:...modelVersion` (`maxLength: 121`) | — | EX-DATA-7 puis troncature à 121 | — | INCONNU |
| 21 | `modelVersionClean` | Version déclarée (nettoyée) | `chaîne(80)` | 0..1 | DER | `DÉRIVÉ : pipeline § A.5.2 appliqué à modelVersionRaw` | — | § A.5.2 | — | INCONNU |
| 22 | `trimTokens` | Jetons de finition | `tableau<chaîne(24)>(0..12)` | 0..n | DER | `DÉRIVÉ : § A.5.2 étape 7` | — | majuscules, tri lexicographique croissant, doublons supprimés | ≤ 12 jetons, surplus tronqué | tableau vide |
| 23 | `badgeDisplacementL` | Cylindrée annoncée au badge | `décimal(1)` (l) | 0..1 | DER | `DÉRIVÉ : § A.5.2 étape 8` | — | 1 décimale | `0,6 ≤ d ≤ 8,0` sinon INCONNU | INCONNU |
| 24 | `modelYear` | Année-modèle | `entier` (année) | 0..1 | OPT | `listings[].modelYear` (OBSERVÉ) ; `OAS:...productionYear` | — | entier | `1900 ≤ y ≤ observedAt.year + 1` sinon INCONNU + `YEAR_OUT_OF_RANGE` | INCONNU |
| 25 | `offerType` | Type d'annonce | `énum` | 0..1 | OPT | `OAS:Listing.offerType` (SCHÉMA) ; porteur probable `listings[].type` `[À CONFIRMER]` | `KYCAR_OFFER_TYPE` | majuscule | ∈ vocabulaire sinon INCONNU | INCONNU |
| 26 | `usageState` | État d'usage / accidenté | `énum` | 0..1 | OPT | `listings[].usageState` (OBSERVÉ) | `KYCAR_USAGE_STATE` | majuscule | ∈ {`A`,`N`,`U`} sinon INCONNU | INCONNU |
| 27 | `hadAccident` | A subi un accident | `booléen` | 0..1 | OPT | `OAS:Condition.hadAccident` (SCHÉMA) | — | — | — | INCONNU |
| 28 | `publicationState` | État de publication | `chaîne(32)` | 0..1 | OPT | `listings[].publication.accurateState` (OBSERVÉ) | `KYCAR_PUBLICATION_STATE` `[À CONFIRMER]` | EX-DATA-7 | domaine inconnu : conservé tel quel, jamais utilisé comme filtre | INCONNU |
| 29 | `isNewListing` | Annonce récente | `booléen` | 0..1 | OPT | `listings[].publication.isNew` (OBSERVÉ) | — | — | — | DÉFAUT=`false` |

**EX-DATA-20.** `makeId` et `modelId` sont résolus **contre `data/reference/taxonomy.json`** et
jamais inventés à partir du libellé de l'annonce. Une marque non résolue provoque le rejet de
l'annonce ; un modèle non résolu la conserve avec `modelId = INCONNU`, l'annonce alimentant alors
l'agrégat de sa marque et un agrégat modèle réservé `modelId = 0` intitulé « Modèle non
identifié ».
**Justification** : `FINDING-allowed-surface.md` § 2.1 prouve que les `modelId` de la source
coïncident avec ceux du référentiel (`20191` = Opel Adam dans les deux), donc la résolution est
fiable ; en revanche perdre l'annonce entière pour un modèle non reconnu détruirait l'effectif de
marque, qui est le chiffre du mode 1.

**EX-DATA-21.** `modelVersionRaw` et `modelVersionClean` sont conservés, `trimTokens` est dérivé,
et **aucun des trois n'est jamais une clé de regroupement d'agrégat**. Ils alimentent uniquement
une facette de recherche par mot-clé et l'affichage du libellé d'une annonce.
**Justification** : c'est du texte libre saisi par le vendeur — le regrouper produirait autant de
« modèles » que d'orthographes, et une distribution par version serait une distribution de fautes
de frappe.

## A.5 Traitement des points durs

### A.5.1 `firstRegistrationDate` — format `MM/YYYY`

**EX-DATA-22.** La source observée sert `condition.firstRegistrationDate` au format `MM/YYYY`
(vocabulaire de recherche) tandis que l'OpenAPI déclare `format: year-month`, exemple `2015-01`
(vocabulaire de création). KYCAR **stocke une chaîne de 7 caractères `YYYY-MM`** (type
`date(YYYY-MM)`), lexicographiquement ordonnable, et **non** un type date/heure.
**Justification** : la source ne connaît pas le jour ; matérialiser un `DATE` obligerait à
inventer un jour (`01`), ce qui transformerait une donnée mensuelle en donnée journalière fausse
et rendrait tout calcul d'âge en jours illusoirement précis.

**EX-DATA-23 — parsing.** Les deux formes sont acceptées à l'ingestion, dans cet ordre d'essai :
`^(?<y>\d{4})-(?<m>0[1-9]|1[0-2])$` puis `^(?<m>0[1-9]|1[0-2])/(?<y>\d{4})$`. Toute autre forme
donne `INCONNU` + `ingestFlags += FIRST_REG_UNPARSEABLE`. **Aucune tolérance** sur un mois `00`
ou `13`, ni sur une année à 2 chiffres.

**EX-DATA-24 — champs dérivés de la date de première immatriculation.**

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|
| 30 | `firstRegistrationYearMonth` | Première immatriculation | `date(YYYY-MM)` | 0..1 | OPT | `listings[].condition.firstRegistrationDate` (OBSERVÉ) ; `OAS:...firstRegistrationDate` | EX-DATA-23 | `1900-01 ≤ v ≤ (observedAt.year+1)-12` sinon INCONNU + `FIRST_REG_OUT_OF_RANGE` | INCONNU |
| 31 | `firstRegistrationYear` | Année de première immatriculation | `entier` (année) | 0..1 | DER | `DÉRIVÉ : entier(sous-chaîne(firstRegistrationYearMonth, 1, 4))` | — | `1900 ≤ y ≤ observedAt.year + 1` | INCONNU |
| 32 | `firstRegistrationMonth` | Mois de première immatriculation | `entier` (1..12) | 0..1 | DER | `DÉRIVÉ : entier(sous-chaîne(firstRegistrationYearMonth, 6, 2))` | — | `1 ≤ m ≤ 12` | INCONNU |
| 33 | `vehicleAgeMonths` | Âge du véhicule | `entier` (mois) | 0..1 | DER | `DÉRIVÉ : 12·(observedAt.year − firstRegistrationYear) + (observedAt.month − firstRegistrationMonth)` | — | `0 ≤ a ≤ 1 500` sinon INCONNU | INCONNU |
| 34 | `mileagePerYearKm` | Kilométrage annuel moyen | `entier` (km/an) | 0..1 | DER | `DÉRIVÉ : arrondi(mileageKm × 12 / max(vehicleAgeMonths, 6))` | — | `0 ≤ v ≤ 200 000` sinon INCONNU ; requiert `mileageKm` **et** `vehicleAgeMonths` connus | INCONNU |

**EX-DATA-25 — dérivation de l'année pour les distributions.** L'axe « année » de tous les
agrégats et de tous les histogrammes est **`firstRegistrationYear`**, jamais `modelYear`.
**Justification** : `modelYear` est l'année-modèle constructeur, décalée d'un à deux ans par
rapport à la mise en circulation et absente d'une partie des annonces ; mélanger les deux dans un
même histogramme superposerait deux référentiels temporels différents. `modelYear` reste dans le
dictionnaire comme attribut d'annonce et comme filtre (`modelyearfrom`/`modelyearto`), sans jamais
alimenter l'axe année.

**EX-DATA-26 — date de première immatriculation absente.** L'annonce est **conservée**, compte
dans tout effectif, et est **exclue** : des statistiques d'année, de l'histogramme d'année, du
nuage tri-dimensionnel, et de la méthode M2 de détection d'outlier (§ B.6.2) qui a besoin de
l'année comme régresseur. Elle reste **incluse** dans les statistiques et l'histogramme de prix et
de kilométrage, et dans la méthode M1. Tout agrégat publie
`yearKnownCount` et `yearCoverage = yearKnownCount / listingCount`.
**Justification** : rejeter l'annonce détruirait le seul chiffre exhaustif du mode 1 (l'effectif)
pour cause d'un attribut secondaire ; la contamination est évitée par exclusion métrique par
métrique, pas par exclusion de l'annonce.

**EX-DATA-27.** Il est interdit d'imputer `firstRegistrationYear` depuis `modelYear`, depuis
`productionYear`, ou depuis une régression sur le kilométrage. Une année inconnue reste inconnue.
**Justification** : l'imputation créerait des points de nuée artificiels exactement sur la droite
de tendance, ce qui écraserait la dispersion résiduelle sur laquelle repose la méthode M2.

### A.5.2 `modelVersionInput` — texte libre pollué

**EX-DATA-28 — décision.** `modelVersionInput` est **conservé** sous trois formes : brute
(`modelVersionRaw`, valeur d'affichage et de traçabilité), nettoyée (`modelVersionClean`, valeur
d'affichage compacte et cible de la recherche par mot-clé) et jetonisée (`trimTokens`, facette).
**Justification** : le champ porte la seule information de finition disponible — sans lui, deux
annonces « Opel Corsa » à 8 000 € d'écart sont indiscernables et l'écart passe pour une anomalie
de prix alors qu'il oppose une entrée de gamme à une version sportive ; le supprimer déplacerait
ce bruit dans la détection d'outlier.

**EX-DATA-29 — pipeline de nettoyage, déterministe et ordonné.** Le pipeline s'applique
exactement dans cet ordre ; toute implémentation correcte produit la même sortie.

| Étape | Opération | Détail |
|---:|---|---|
| 1 | Normalisation Unicode | NFKC (et non NFC — pour replier les caractères pleine largeur et les exposants décoratifs) |
| 2 | Suppression des pictogrammes | tout point de code des plages U+1F000–U+1FAFF, U+2190–U+2BFF, U+2600–U+27BF, U+FE00–U+FE0F, U+E000–U+F8FF, U+200B–U+200F, U+2028–U+202F, plus U+200D |
| 3 | Suppression des marqueurs promotionnels | retrait de toute occurrence, comparaison insensible à la casse et aux diacritiques, des motifs de la liste d'arrêt versionnée `data/reference/version-stoplist.json` (contenu initial § A.5.2.1) |
| 4 | Suppression des séquences décoratives | toute suite de 2 caractères ou plus pris dans `* - _ = ~ ! . + # | / \ < >` est remplacée par un espace |
| 5 | Repli de la ponctuation résiduelle | tout caractère qui n'est ni lettre Unicode, ni chiffre, ni `. , - + /` est remplacé par un espace |
| 6 | Compactage | suites d'espaces → un espace, `trim`, puis troncature à 80 caractères **sur une frontière de mot** (dernier espace avant la limite) |
| 7 | Jetonisation | découpe sur l'espace ; un jeton est retenu s'il fait 2 à 24 caractères, s'il n'est pas exclusivement numérique, et s'il n'appartient pas à la liste d'arrêt de jetons ; passage en majuscules ; déduplication ; tri lexicographique croissant par point de code ; 12 premiers conservés |
| 8 | Extraction de cylindrée au badge | premier appariement de `(?<!\d)([0-8])[.,]([0-9])(?!\d)` ; valeur `x,y` retenue si comprise entre 0,6 et 8,0 |
| 9 | Extraction de puissance au badge | premier appariement de `(?<!\d)(\d{2,3})\s?(ch|cv|hp|pk|kw|kW|PS)(?![a-z])` ; conservé dans `badgePowerRaw` avec son unité ; si l'écart relatif à `powerKw`/`powerHp` dépasse 10 %, `ingestFlags += VERSION_POWER_MISMATCH` — la valeur du badge **ne remplace jamais** `powerKw` |
| 10 | Détection de mentions de motorisation | appariement du lexique fermé `data/reference/version-lexicon.json` (`quattro`, `xdrive`, `4matic`, `awd`, `4x4`, `tdi`, `tsi`, `tfsi`, `hdi`, `bluehdi`, `dci`, `cdti`, `crdi`, `ecoboost`, `bluetec`, `hybrid`, `phev`, `mhev`, `e-tron`, `gtd`, `gti`, `gte`, `amg`, `m-sport`, `s-line`, `r-line`, `n-line`, `st-line`) → `driveBadges` |

### A.5.2.1 Liste d'arrêt promotionnelle initiale

**EX-DATA-30.** Contenu initial de `data/reference/version-stoplist.json`, versionné, extensible
par ajout uniquement (jamais par retrait silencieux), chaque entrée portant sa langue :
`promo`, `promotie`, `actie`, `action`, `solde`, `soldes`, `koopje`, `topdeal`, `top deal`,
`super deal`, `bonne affaire`, `occasion du mois`, `nieuw binnen`, `nouvelle arrivee`,
`tva deductible`, `tva recuperable`, `btw aftrekbaar`, `btw recupereerbaar`, `vat deductible`,
`garantie 12 mois`, `garantie 24 mois`, `waarborg`, `carpass`, `car-pass`, `1e main`,
`eerste eigenaar`, `prix a discuter`, `prijs bespreekbaar`, `financement`, `financiering`,
`leasing possible`, `reprise possible`, `tel `, `gsm `, `whatsapp`, `www.`, `.be`, `.nl`, `.com`,
`@`.
**Justification** : les six dernières entrées ne sont pas promotionnelles mais des amorces de
coordonnées de contact — les retirer ici est la deuxième barrière R3, après l'exclusion des champs
vendeur, pour du texte libre où un numéro de téléphone se glisse régulièrement.

**EX-DATA-31.** Si `modelVersionClean` est vide après nettoyage alors que `modelVersionRaw` était
non vide, `ingestFlags += VERSION_FULLY_STRIPPED` et `modelVersionClean` vaut `INCONNU`. Le
compteur agrégé `versionStrippedRate` est publié par snapshot.
**Justification** : un taux de dépouillement total qui grimpe signale une liste d'arrêt devenue
trop agressive, ce qui doit être mesurable et non découvert par hasard.

### A.5.3 `prices.public.onRequestOnly` — annonce sans prix affiché

Traité par EX-DATA-16 à EX-DATA-18. Le vocabulaire `KYCAR_PRICE_STATUS` compte 3 codes :

| Code | Libellé FR | Condition |
|---|---|---|
| `QUOTED` | Prix affiché | `priceEur` connu et valide |
| `ON_REQUEST` | Prix sur demande | `priceEur` absent et `priceOnRequestOnly = true` |
| `MISSING` | Prix indisponible | `priceEur` absent et `priceOnRequestOnly ≠ true` |

**EX-DATA-32.** Le cas `priceEur` **connu** et `priceOnRequestOnly = true` (contradiction de la
source) est résolu en faveur du montant : `priceStatus = QUOTED`, plus
`ingestFlags += PRICE_ON_REQUEST_WITH_AMOUNT`.
**Justification** : un montant servi est une donnée, un drapeau contradictoire est une intention
d'affichage — jeter le montant perdrait de l'information vérifiable au profit d'un booléen.

### A.5.4 `evaluation.category` — référence externe (V5)

Traité par EX-DATA-12 et EX-DATA-13. Usage exclusif : mesure d'accord § B.6.4.

### A.5.5 Champs présents dans la donnée sans filtre correspondant

**EX-DATA-33.** `co2EmissionsGPerKm` et `consumptionCombinedL100Km` sont **relevés dans la donnée
d'annonce** (`FINDING-allowed-surface.md` § 2.3 :
`co2emissionInGramPerKmWithFallback`, `consumption.combinedWithFallback`) alors qu'aucun filtre
AutoScout24 ne les expose (`REF-filters.md`, zone d'ombre Z5). Ils sont donc :
**utilisables en agrégat et en affichage, non utilisables comme filtre de parité avec la source**.
KYCAR peut néanmoins offrir un filtre **local** sur ces champs, marqué dans l'interface comme
« filtre KYCAR, sans équivalent sur la source », puisqu'il s'applique au snapshot déjà chargé.
**Justification** : `REF-filters.md` Z5 établit que l'absence de filtre n'est pas l'absence de
champ ; interdire l'agrégation sur une donnée disponible reviendrait à s'aligner sur une limite de
l'interface source au lieu de la dépasser, ce qui est exactement la valeur ajoutée de KYCAR.

**EX-DATA-34.** Tout filtre KYCAR sans équivalent AutoScout24 est marqué
`sourceParity: false` dans le catalogue de filtres et **ne peut jamais être sérialisé dans une
requête vers la source**. Un filtre `sourceParity: false` posé par l'utilisateur s'applique
en aval, sur le snapshot local.
**Justification** : `REF-filters.md` établit qu'un paramètre inconnu fait répondre 404 à la
source (`enable-404-for-invalid-parameter`), donc émettre un filtre local dans une URL source
casserait la requête entière.

**EX-DATA-35 — provenance de la mesure.** `co2Source` distingue WLTP de NEDC parce que les deux
normes ne sont pas comparables (l'OpenAPI interdit explicitement de renseigner les deux :
« Forbidden if NEDC consumption values are set »). Règle de dérivation : `WLTP` si
`OAS:wltp.co2EmissionsCombined` ou `wltp.consumptionCombined` est la source retenue ; `NEDC` si
`OAS:co2Emissions` ou `consumption.combined` l'est ; `UNKNOWN` si la valeur vient du champ
d'annonce `…WithFallback`, dont la norme n'est pas déclarée.
**Justification** : agréger une consommation NEDC et une consommation WLTP dans une même moyenne
produit un chiffre sans signification, l'écart systématique entre les deux normes étant de l'ordre
de 20 % ; la colonne de provenance permet de segmenter au lieu de mélanger.

## A.6 Dictionnaire principal — blocs Motorisation, Carburant, Écologie, État, Carrosserie, Équipements, Géographie, Vendeur, Métadonnées

### Bloc Motorisation

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 35 | `powerKw` | Puissance | `entier` (kW) | 0..1 | OPT | `listings[].engine.power.kw.raw` (OBSERVÉ) ; `OAS:...power` (`1..9999`) | — | unité canonique kW | `1 ≤ p ≤ 9 999` sinon INCONNU + `POWER_OUT_OF_RANGE` | INCONNU |
| 36 | `powerHp` | Puissance | `entier` (ch) | 0..1 | DER | `DÉRIVÉ : arrondi(powerKw / 0,7355)` ; contrôle contre `listings[].engine.power.hp.raw` | — | dérivé du kW, **jamais** stocké depuis la source | écart au `hp.raw` de la source > 2 % → `ingestFlags += POWER_UNIT_MISMATCH` | INCONNU |
| 37 | `cylinderCapacityCcm` | Cylindrée | `entier` (cm³) | 0..1 | OPT | `OAS:...cylinderCapacity` (SCHÉMA) | — | cm³ | `1 ≤ c ≤ 99 999` sinon INCONNU | INCONNU |
| 38 | `cylinderCount` | Nombre de cylindres | `entier` | 0..1 | OPT | `OAS:...cylinderCount` (SCHÉMA) | — | — | `1 ≤ n ≤ 99` sinon INCONNU | INCONNU |
| 39 | `gearCount` | Nombre de rapports | `entier` | 0..1 | OPT | `OAS:...gearCount` (SCHÉMA) | — | — | `1 ≤ n ≤ 9` sinon INCONNU | INCONNU |
| 40 | `transmission` | Boîte de vitesses | `énum` | 0..1 | OPT | `OAS:...transmission` (SCHÉMA) | `KYCAR_TRANSMISSION` | majuscule | ∈ {`A`,`M`,`S`} sinon INCONNU | INCONNU |
| 41 | `drivetrain` | Roues motrices | `énum` | 0..1 | OPT | `OAS:...drivetrain` (SCHÉMA) | `KYCAR_DRIVETRAIN` | majuscule | ∈ {`4`,`F`,`R`} sinon INCONNU | INCONNU |

**EX-DATA-36.** La puissance canonique est le **kilowatt**, et les chevaux en sont dérivés par le
facteur `1 kW = 1/0,7355 ch` (cheval-vapeur métrique, DIN 66036).
**Justification** : l'OpenAPI déclare `power` en kW comme entrée unique et précise que les
chevaux « will automatically be derived from this value » — reprendre les deux depuis la source
introduirait deux chiffres divergeant par arrondi entre lesquels aucune règle d'arbitrage
n'existe.

### Bloc Carburant — application stricte de V1

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 42 | `fuelCategory` | Catégorie de carburant | `énum` | 0..1 | OPT | `listings[].fuels.fuelCategory.raw` (OBSERVÉ, valeur relevée `"B"`) ; `OAS:...fuelCategory` | `KYCAR_FUEL_CATEGORY` | majuscule pour les codes alphabétiques ; les codes `2` et `3` restent des chaînes | ∈ vocabulaire sinon INCONNU + `ENUM_UNKNOWN_FUEL_CATEGORY` | INCONNU, puis repli EX-DATA-10 si `fuelTypePrimary` connu |
| 43 | `fuelTypePrimary` | Type de carburant précis | `énum` | 0..1 | OPT | `OAS:...primaryFuelType` (SCHÉMA) | `KYCAR_FUEL_TYPE` | chaîne numérique | ∈ vocabulaire (16 codes) sinon INCONNU | INCONNU |
| 44 | `fuelTypesAdditional` | Carburants additionnels | `tableau<énum>(0..8)` | 0..n | OPT | `OAS:...additionalFuelTypes` (SCHÉMA) | `KYCAR_FUEL_TYPE` | tri croissant numérique, doublons supprimés | chaque code ∈ vocabulaire, sinon le code fautif est retiré | tableau vide |
| 45 | `fuelSourceLabelRaw` | Libellé de source d'énergie | `chaîne(160)` | 0..1 | OPT | `listings[].fuels.primary.source` (OBSERVÉ, valeur relevée `"Super 95 / Essence 91 / Super Plus 98 / …"`) | — | EX-DATA-7 puis troncature à 160 | jamais décodé comme un code, **affichage seul** | INCONNU |
| 46 | `isPluginHybrid` | Hybride rechargeable | `booléen` | 0..1 | OPT | `OAS:...isPluginHybrid` (SCHÉMA) ; `DÉRIVÉ` en repli : vrai si `fuelCategory ∈ {2,3}` | — | — | cohérence : si vrai alors `fuelCategory ∈ {2,3,O}` (contrainte de l'OpenAPI) sinon `ingestFlags += HYBRID_INCONSISTENT` | INCONNU |
| 47 | `batteryOwnership` | Propriété de la batterie | `énum` | 0..1 | OPT | `OAS:...battery` / `references/BatteryOwnershipType.json` (SCHÉMA) | `KYCAR_BATTERY_OWNERSHIP` | — | ∈ {`1`,`2`,`3`} sinon INCONNU | INCONNU |
| 48 | `batteryCapacityKwh` | Capacité de la batterie | `décimal(1)` (kWh) | 0..1 | OPT | `OAS:Battery.capacity` (SCHÉMA) | — | 1 décimale | `0,1 ≤ c ≤ 500,0` sinon INCONNU | INCONNU |

**EX-DATA-37.** `fuelSourceLabelRaw` est un libellé du vocabulaire de création, servi comme texte
(`"Super 95 / Essence 91 / Super Plus 98 / …"`). Il est **interdit** de le rétro-décoder vers un
code de `KYCAR_FUEL_TYPE` ou de `KYCAR_FUEL_CATEGORY`.
**Justification** : la valeur relevée énumère plusieurs types séparés par des barres obliques,
donc elle ne dénote pas un code unique ; en extraire un code choisirait arbitrairement l'un des
membres de la liste.

### Bloc Écologie

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 49 | `co2EmissionsGPerKm` | Émissions de CO₂ | `décimal(1)` (g/km) | 0..1 | OPT | `listings[].co2emissionInGramPerKmWithFallback` (OBSERVÉ) ; `OAS:wltp.co2EmissionsCombined` ou `OAS:co2Emissions` | — | 1 décimale, troncature au-delà (règle de la source) | `0 ≤ c ≤ 1 000` sinon INCONNU ; `c = 0` admis uniquement si `fuelCategory = E`, sinon `ingestFlags += CO2_ZERO_NON_BEV` et INCONNU | INCONNU |
| 50 | `co2Source` | Norme de mesure du CO₂ | `énum` | 0..1 | DER | `DÉRIVÉ : EX-DATA-35` | `KYCAR_MEASUREMENT_STANDARD` | — | — | DÉFAUT=`UNKNOWN` |
| 51 | `consumptionCombinedL100Km` | Consommation mixte | `décimal(1)` (l/100km) | 0..1 | OPT | `listings[].consumption.combinedWithFallback` (OBSERVÉ) ; `OAS:wltp.consumptionCombined` ou `OAS:Consumption.combined` | — | 1 décimale | `0,1 ≤ v ≤ 99,9` (bornes de la source) sinon INCONNU | INCONNU |
| 52 | `consumptionElectricKwh100Km` | Consommation électrique | `décimal(1)` (kWh/100km) | 0..1 | OPT | `OAS:wltp.consumptionElectricCombined` ; `OAS:Consumption.electricCombined` (déprécié) | — | 1 décimale ; le champ WLTP prime sur le champ déprécié | `0,1 ≤ v ≤ 99,9` sinon INCONNU | INCONNU |
| 53 | `consumptionSource` | Norme de mesure de la consommation | `énum` | 0..1 | DER | `DÉRIVÉ : EX-DATA-35` | `KYCAR_MEASUREMENT_STANDARD` | — | — | DÉFAUT=`UNKNOWN` |
| 54 | `euEmissionStandard` | Norme Euro | `énum` | 0..1 | OPT | `OAS:...euEmissionStandard` (SCHÉMA) | `KYCAR_EU_EMISSION_STANDARD` | chaîne | ∈ vocabulaire (11 codes) sinon INCONNU | INCONNU |
| 55 | `co2Class` | Classe CO₂ | `énum` | 0..1 | OPT | `OAS:wltp.co2Class` (SCHÉMA) | `KYCAR_CO2_CLASS` | — | ∈ {`10`,`20`,`30`,`40`,`50`,`60`,`70`} sinon INCONNU | INCONNU |
| 56 | `efficiencyClass` | Classe d'efficacité énergétique | `énum` | 0..1 | OPT | `OAS:...efficiencyClass` (SCHÉMA) | `KYCAR_EFFICIENCY_CLASS` | — | ∈ vocabulaire (10 codes) sinon INCONNU | INCONNU |
| 57 | `electricRangeKm` | Autonomie électrique | `entier` (km) | 0..1 | OPT | `OAS:...electricRange` (SCHÉMA) | — | km | `1 ≤ r ≤ 10 000` (bornes de la source) sinon INCONNU | INCONNU |
| 58 | `hasParticleFilter` | Filtre à particules | `booléen` | 0..1 | OPT | `OAS:...hasParticleFilter` (SCHÉMA) | — | — | — | INCONNU |

### Bloc État et usage

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 59 | `mileageKm` | Kilométrage | `entier` (km) | 0..1 | OPT | `listings[].condition.mileageInKm.raw` (OBSERVÉ) ; `OAS:...mileage` | — | unité canonique km ; conversion refusée si `mileageUnit` ∉ {`km`} (EX-DATA-5) | `0 ≤ m ≤ 1 500 000` sinon INCONNU + `MILEAGE_OUT_OF_RANGE` · `m = 0` admis sans réserve si `offerType ∈ {N,S,D}` ; sinon `ingestFlags += SUSPECT_ZERO_MILEAGE` et exclusion des statistiques de kilométrage | INCONNU |
| 60 | `previousOwnerCount` | Nombre de propriétaires précédents | `entier` | 0..1 | OPT | `listings[].condition.numberOfPreviousOwnersExtended.raw` (OBSERVÉ) ; `OAS:...previousOwnerCount` | — | entier | `0 ≤ n ≤ 99` sinon INCONNU | INCONNU |
| 61 | `hasFullServiceHistory` | Carnet d'entretien complet | `booléen` | 0..1 | OPT | `OAS:...hasFullServiceHistory` (SCHÉMA) | — | — | — | INCONNU |
| 62 | `nextInspectionYearMonth` | Prochain contrôle technique | `date(YYYY-MM)` | 0..1 | OPT | `OAS:...nextInspectionDate` (SCHÉMA) | — | EX-DATA-23 | `observedAt − 24 mois ≤ v ≤ observedAt + 48 mois` sinon INCONNU | INCONNU |
| 63 | `wasCabOrRental` | Ex-taxi, location ou auto-école | `booléen` | 0..1 | OPT | `OAS:...wasCabOrRental` (SCHÉMA) | — | — | — | INCONNU |

**EX-DATA-38 — kilométrage nul.** Un kilométrage de 0 km sur une annonce dont `offerType` vaut
`U` (occasion), `J` (voiture récente) ou `O` (ancêtre), ou dont `offerType` est inconnu, est traité
comme une valeur sentinelle : l'annonce compte dans les effectifs et est exclue des statistiques,
de l'histogramme et de la méthode M2 pour le kilométrage.
**Justification** : `mileageKm = 0` est la valeur par défaut d'un formulaire non rempli aussi
souvent qu'un fait ; l'admettre sans réserve créerait un pic artificiel à l'origine de
l'histogramme de kilométrage et tirerait la régression M2 vers le bas.

### Bloc Carrosserie et habitacle

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 64 | `bodyType` | Carrosserie | `énum` | 0..1 | OPT | `OAS:...bodyType` (SCHÉMA) | `KYCAR_BODY_TYPE` | chaîne numérique | ∈ 9 codes voiture sinon INCONNU + `ENUM_UNKNOWN_BODY_TYPE` | INCONNU |
| 65 | `doorCount` | Nombre de portes | `entier` | 0..1 | OPT | `OAS:...doorCount` (SCHÉMA) | — | — | `1 ≤ n ≤ 9` sinon INCONNU | INCONNU |
| 66 | `seatCount` | Nombre de places | `entier` | 0..1 | OPT | `OAS:...seatCount` (SCHÉMA) | — | — | `1 ≤ n ≤ 99` sinon INCONNU | INCONNU |
| 67 | `bodyColor` | Couleur extérieure | `énum` | 0..1 | OPT | `OAS:...bodyColor` (SCHÉMA) | `KYCAR_BODY_COLOR` | chaîne numérique | ∈ 14 codes sinon INCONNU | INCONNU |
| 68 | `isMetallic` | Peinture métallisée | `booléen` | 0..1 | OPT | `OAS:...isMetallic` (SCHÉMA) | — | — | — | INCONNU |
| 69 | `paintType` | Type de peinture | `énum` | 0..1 | OPT | `filters.json` → `ptype` (SCHÉMA) | `KYCAR_PAINT_TYPE` | majuscule | ∈ 5 codes sinon INCONNU | INCONNU |
| 70 | `upholsteryType` | Sellerie | `énum` | 0..1 | OPT | `OAS:...upholsteryType` (SCHÉMA) | `KYCAR_UPHOLSTERY_TYPE` | majuscules | ∈ 6 codes sinon INCONNU | INCONNU |
| 71 | `upholsteryColor` | Couleur intérieure | `énum` | 0..1 | OPT | `OAS:...upholsteryColor` (SCHÉMA) | `KYCAR_UPHOLSTERY_COLOR` | chaîne numérique | ∈ 11 codes sinon INCONNU | INCONNU |

### Bloc Équipements et labels

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 72 | `equipmentCodes` | Équipements | `tableau<énum>(0..132)` | 0..n | OPT | `OAS:...equipment` (SCHÉMA) | `KYCAR_EQUIPMENT` | tri croissant numérique, doublons supprimés | code hors périmètre voiture retiré silencieusement ; code hors vocabulaire → retiré + `ENUM_UNKNOWN_EQUIPMENT` | tableau vide |
| 73 | `sealCodes` | Labels d'occasion certifiée | `tableau<énum>(0..14)` | 0..n | OPT | `OAS:ListingSharedDealerOnly.appliedSeals` (SCHÉMA) ; `filters.json` → `sealor` | `KYCAR_SEAL` | tri croissant | code hors vocabulaire retiré | tableau vide |

**EX-DATA-39.** Un `equipmentCodes` vide est **indistinguable** d'un équipement non renseigné.
Aucun agrégat ne publie de taux de présence d'équipement sans publier conjointement
`equipmentDeclaredCount = |{annonces dont equipmentCodes est non vide}|`, et tout taux
d'équipement est calculé **sur ce dénominateur**, jamais sur `listingCount`.
**Justification** : compter les annonces sans équipement déclaré comme des annonces sans
équipement transformerait un défaut de saisie en absence de fonctionnalité et sous-estimerait
mécaniquement tout taux d'équipement.

### Bloc Géographie

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 74 | `countryCode` | Pays | `chaîne(2)` ISO-3166-1 alpha-2 | 1 | OBL | `listings[].location.countryCode` (OBSERVÉ) | — | majuscules ; **traduction obligatoire** du code marketplace vers l'ISO si la source sert un code marketplace (`B`→`BE`, `D`→`DE`, `A`→`AT`, `E`→`ES`, `F`→`FR`, `I`→`IT`, `L`→`LU`, `NL`→`NL`) | 2 lettres majuscules et code ISO existant sinon REJET | REJET |
| 75 | `regionCode` | Province / région | `énum` NUTS-2 | 0..1 | DER | `DÉRIVÉ : table § A.8 appliquée au code postal transitoire, puis code postal détruit` | `KYCAR_REGION` | majuscules, 4 caractères | ∈ vocabulaire du pays sinon INCONNU + `REGION_UNRESOLVED` | INCONNU |
| 76 | `regionName` | Libellé de la région | `chaîne(48)` | 0..1 | DER | `DÉRIVÉ : libellé de regionCode dans data/reference/regions-be.json` | — | libellé FR canonique | — | INCONNU |
| 77 | `postalCodePrefix2` | Zone postale (2 chiffres) | `chaîne(2)` | 0..1 | DER | `DÉRIVÉ : deux premiers caractères du code postal transitoire, puis code postal détruit` | — | conservé tel quel, chiffres uniquement | 2 chiffres sinon INCONNU | INCONNU |

**EX-DATA-40 — application de V4.** Le pays est stocké en **ISO-3166-1 alpha-2** et traduit vers
le code marketplace AutoScout24 **au moment de construire une requête source**, jamais avant.
**Justification** : les deux listes se recouvrent par accident et non par correspondance (`B` vaut
Belgique en recherche et n'existe pas comme code ISO belge, qui est `BE` ; `L` vaut Luxembourg en
recherche et Liberia en ISO) — le sens recherche→ISO est déterminé, le sens ISO→recherche l'est
aussi, mais un stockage en code propriétaire rendrait le modèle multi-pays de H1 inexploitable.

### Bloc Vendeur — seuls les attributs non identifiants

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 78 | `sellerType` | Type de vendeur | `énum` | 0..1 | OPT | `listings[].seller.type` (OBSERVÉ) | `KYCAR_SELLER_TYPE` | majuscule ; projection `private`→`P`, `dealer`→`D` si la source sert les libellés de `pricetype` | ∈ {`P`,`D`} sinon INCONNU | INCONNU |

**EX-DATA-41 — arbitrage de V3.** Le champ canonique du type de vendeur est `sellerType` sur le
vocabulaire `KYCAR_SELLER_TYPE` (`P`/`D`), issu de `custtype`. `pricetype` (`private`/`dealer`)
est traité comme un **alias d'entrée** projeté sur ce vocabulaire, et n'existe pas comme champ.
**Justification** : `REF-filters.md` note que `pricetype` est injecté par le serveur avec la
valeur `public` — absente du couple `private`/`dealer` — et sa zone d'ombre Z6 doute que les trois
codes partagent réellement le même paramètre ; `custtype` est le seul des deux dont le domaine à
deux valeurs est relevé sans réserve.

**EX-DATA-42.** Les attributs vendeur retenus sont **exactement trois**, conformément à H3 :
`sellerType` (# 78), `countryCode` (# 74) et `regionCode` (# 75). Aucun quatrième attribut vendeur
n'existe dans le schéma.

### Bloc Métadonnées d'annonce et diagnostic

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 79 | `adTier` | Palier publicitaire | `énum` | 0..1 | OPT | `listings[].adProduct.tier` (OBSERVÉ, valeur relevée `T50`) ; `OAS:Tier` | `KYCAR_AD_TIER` | majuscules | ∈ {`NONE`,`T20`,`T30`,`T40`,`T50`} sinon INCONNU | DÉFAUT=`NONE` |
| 80 | `imageCount` | Nombre de photos | `entier` | 0..1 | DER | `DÉRIVÉ : cardinalité de listings[].media.images` — **les URL ne sont pas conservées** | — | — | `0 ≤ n ≤ 50` (borne `maxItems` de la source) ; au-delà, plafonné à 50 | DÉFAUT=`0` |
| 81 | `hasVideo` | Présence d'une vidéo | `booléen` | 0..1 | DER | `DÉRIVÉ : vrai si OAS:youtubeVideoUrl est non vide — l'URL n'est pas conservée` | — | — | — | DÉFAUT=`false` |
| 82 | `ingestFlags` | Anomalies d'ingestion | `tableau<énum>(0..14)` | 0..n | DER | `DÉRIVÉ : cumul des drapeaux posés par les règles de validation` | `KYCAR_INGEST_FLAG` | tri lexicographique | — | tableau vide |

**EX-DATA-43.** `adTier` est conservé **exclusivement à des fins de diagnostic de
représentativité**. Tout agrégat publie la distribution de `adTier` de sa sélection, et un
agrégat dont la part de `adTier ≠ NONE` dépasse **30 %** porte
`coverageWarning.samplingBias = true`.
**Justification** : `FINDING-allowed-surface.md` limite P2 tient pour non vérifiée la
représentativité de l'échantillon de 20 annonces par page et cite `adProduct.tier = T50` comme
indice d'un tri influencé par le produit publicitaire — sans ce compteur, un biais
d'échantillonnage se propagerait dans toutes les distributions sans laisser de trace.

**EX-DATA-44.** `imageCount` et `hasVideo` sont des **compteurs**, pas des références : aucune URL
d'image ni de vidéo n'est persistée.
**Justification** : `00-CONTEXT.md` fonde l'architecture sur l'agrégat et non la copie ; stocker
les URL de médias reviendrait à dupliquer le contenu de l'annonce, ce que la position sur le droit
sui generis des bases de données cherche précisément à éviter.

**EX-DATA-45 — vocabulaire `KYCAR_INGEST_FLAG`, 14 codes.**
`UNIT_UNSUPPORTED`, `ENUM_UNKNOWN`, `MODEL_UNRESOLVED`, `REGION_UNRESOLVED`,
`SUSPECT_PRICE_FLOOR`, `PRICE_MISSING_UNDECLARED`, `PRICE_ON_REQUEST_WITH_AMOUNT`,
`SUSPECT_ZERO_MILEAGE`, `MILEAGE_OUT_OF_RANGE`, `POWER_OUT_OF_RANGE`, `POWER_UNIT_MISMATCH`,
`FIRST_REG_UNPARSEABLE`, `FIRST_REG_OUT_OF_RANGE`, `VERSION_FULLY_STRIPPED`.
Les variantes `ENUM_UNKNOWN_<VOCABULAIRE>`, `CO2_ZERO_NON_BEV`, `HYBRID_INCONSISTENT`,
`HYBRID_CATEGORY_UNRESOLVED`, `VERSION_POWER_MISMATCH` et `YEAR_OUT_OF_RANGE` sont des
sous-qualifications de `ENUM_UNKNOWN` et des drapeaux de champ, comptées dans le rapport
d'ingestion mais non dans le vocabulaire à 14 codes.

**EX-DATA-46.** Le rapport d'ingestion d'un snapshot publie, pour chaque code de
`KYCAR_INGEST_FLAG`, son effectif et son taux sur `listingCount`, plus le nombre d'annonces
rejetées par motif de rejet.
**Justification** : c'est le seul moyen vérifiable par exécution (règle R4) de constater qu'un
adaptateur `DataProvider` s'est dégradé, et ce rapport est le critère de succès mesurable du
lot D9.

## A.7 Champs exclus par conception

**EX-DATA-47.** Les champs suivants **n'existent dans aucune table, aucun type, aucune colonne et
aucun index** du modèle KYCAR. La contrainte est structurelle (règle R3) : l'adaptateur
`DataProvider` les **écarte à l'ingestion**, avant tout stockage, et un champ de cette liste
présent dans une structure de données du code est un échec de build.

| # | Champ de la source | Motif | Référence |
|---|---|---|---|
| E1 | `listings[].seller.id` | **R3** — identifiant de vendeur | R3 ; H3 |
| E2 | `listings[].seller.companyName` | **R3** — identifiant de vendeur | R3 |
| E3 | `listings[].seller.contactName` | **R3** — nom de personne physique, relevé sur la source | R3 ; `FINDING-allowed-surface.md` § 2.5 |
| E4 | numéro de téléphone du vendeur (tout chemin) | **R3** — coordonnée de contact | R3 ; `00-CONTEXT.md` § RGPD |
| E5 | adresse électronique du vendeur (tout chemin) | **R3** — coordonnée de contact | R3 |
| E6 | URL de contact ou de formulaire vendeur | **R3** — URL de contact | R3 |
| E7 | URL du site ou de la vitrine du vendeur | **R3** — identifiant de vendeur | R3 |
| E8 | `listings[].location.zip` (valeur exacte) | **R3** — adresse exacte ; troncature régionale imposée | `00-CONTEXT.md` : « Le code postal est tronqué au niveau régional » |
| E9 | `listings[].location.city` | **R3** — adresse exacte à la commune | `00-CONTEXT.md` |
| E10 | rue et numéro (tout chemin) | **R3** — adresse exacte | R3 |
| E11 | `lat` / `lon` du vendeur ou du véhicule | **R3** — adresse exacte, géolocalisation | R3 ; `REF-filters.md` (le serveur géocode `zip=1000` en `lat=50.84553&lon=4.3557`) |
| E12 | `description` (texte libre de l'annonce) | **R3 étendu** — porte régulièrement nom, téléphone et adresse | R3 ; `OAS:...description` (`maxLength: 10000`) |
| E13 | `condition.description` (texte libre d'état) | **R3 étendu** — même motif | R3 ; `OAS:Condition.description` |
| E14 | `cid` (identifiant client/concessionnaire de la recherche) | **R3** — identifiant de vendeur | R3 ; `REF-filters.md` filtre # 64 |
| E15 | `vin` | RGPD — donnée indirectement identifiante rattachable à une personne | `00-CONTEXT.md` § RGPD ; `OAS:...vin` |
| E16 | `licencePlate` | RGPD — plaque rattachable à un titulaire | `OAS:...licencePlate` |
| E17 | `belgianCarpassMileageUrl` | RGPD — document nominatif accessible par URL | `OAS:...belgianCarpassMileageUrl` |
| E18 | `media.images[].previewUrl` et tout URL d'image | Contenu dupliqué — `imageCount` seul est conservé | `00-CONTEXT.md` ; EX-DATA-44 |
| E19 | `youtubeVideoUrl` | Contenu dupliqué — `hasVideo` seul est conservé | EX-DATA-44 |
| E20 | `offerReferenceId`, `crossReferenceId` | Hors périmètre — références de gestion internes au vendeur | `OAS:ListingSummary` |
| E21 | `hsn`, `tsn`, `natCode`, `schwackeCode`, `eCode` | Hors périmètre — clés de référentiels tiers payants, sans usage analytique | `OAS:BaseSharedAllSellersNoImages` |

**Répartition des motifs** : **14 champs exclus par R3** (E1 à E14, dont 2 au titre de R3 étendu
pour le texte libre), 3 par RGPD hors R3 littéral (E15 à E17), 2 pour contenu dupliqué (E18, E19),
2 hors périmètre (E20, E21). **Total : 21 champs exclus.**

**EX-DATA-48.** Le code postal exact est une **valeur transitoire** : il existe uniquement dans la
portée locale de la fonction de normalisation géographique de l'adaptateur, le temps de calculer
`regionCode` et `postalCodePrefix2`, puis il est hors de portée. Il n'est écrit dans aucune
structure persistante, aucun journal, aucun message d'erreur et aucun cache.
**Justification** : `00-CONTEXT.md` qualifie la mitigation de « structurelle » et précise que « le
schéma de données ne prévoit aucune colonne pour les accueillir » — un code postal conservé « en
attendant » dans un journal de debug rendrait la mitigation conventionnelle au lieu de
structurelle.

**EX-DATA-49.** Un test automatisé du lot D2 échoue si un identifiant de la liste E1 à E14
apparaît, comme nom de propriété, de colonne, de clé JSON ou de paramètre, dans le code source, le
schéma de persistance ou un jeu de données du dépôt.
**Justification** : c'est la traduction du critère de succès S5 générique des lots de dev en
vérification exécutable, telle qu'exigée par R4.

## A.8 Code postal → région : table de correspondance belge

**EX-DATA-50 — décision.** L'axe géographique régional de KYCAR est **calculé par KYCAR à partir
du code postal**, et non délégué au paramètre `region` d'AutoScout24.
**Justification** : `REF-filters.md` zone d'ombre Z3 établit que `region` est désactivé sur les
deux places de marché relevées (`provinceAndNationalBasedLocationSearch = false`), que la taxonomie
n'expose aucune liste de régions, et qu'une valeur vide est rejetée par le serveur — le domaine de
valeurs est donc inconnu et le paramètre inexploitable.

**EX-DATA-51 — vocabulaire.** `KYCAR_REGION` utilise les codes **NUTS-2 (nomenclature 2021)**
comme identifiants de région.
**Justification** : NUTS-2 est un identifiant stable, public, et défini pour les cinq pays de H1
(BE, FR, DE, LU, NL), donc le modèle de données ne se ferme pas à la Belgique ; un code inventé ou
un libellé de province obligerait à réinventer la clé au premier pays ajouté.

**EX-DATA-52 — table BE.** Correspondance code postal belge → province, par plages contiguës
disjointes couvrant `1000` à `9999`. Chaque plage est inclusive aux deux bornes.

| # | Plage de codes postaux | Province / Région | `regionCode` (NUTS-2) | Région administrative |
|---:|---|---|---|---|
| 1 | 1000 – 1299 | Région de Bruxelles-Capitale | `BE10` | Bruxelles-Capitale |
| 2 | 1300 – 1499 | Brabant wallon | `BE31` | Wallonie |
| 3 | 1500 – 1999 | Brabant flamand | `BE24` | Flandre |
| 4 | 2000 – 2999 | Anvers | `BE21` | Flandre |
| 5 | 3000 – 3499 | Brabant flamand | `BE24` | Flandre |
| 6 | 3500 – 3999 | Limbourg | `BE22` | Flandre |
| 7 | 4000 – 4999 | Liège | `BE33` | Wallonie |
| 8 | 5000 – 5999 | Namur | `BE35` | Wallonie |
| 9 | 6000 – 6599 | Hainaut | `BE32` | Wallonie |
| 10 | 6600 – 6999 | Luxembourg | `BE34` | Wallonie |
| 11 | 7000 – 7999 | Hainaut | `BE32` | Wallonie |
| 12 | 8000 – 8999 | Flandre-Occidentale | `BE25` | Flandre |
| 13 | 9000 – 9999 | Flandre-Orientale | `BE23` | Flandre |

13 plages, **11 valeurs distinctes de `regionCode`** (10 provinces + la Région de
Bruxelles-Capitale, qui n'est pas une province).

**EX-DATA-53 — niveau de preuve.** Cette table est marquée **`[EXTRAPOLÉ]`** : elle reproduit la
structure d'attribution par milliers du plan de numérotation postal belge, sans avoir été
confrontée à un fichier officiel. Elle est correcte pour les plages, et peut se tromper sur un
petit nombre de communes limitrophes dont le code postal a été attribué hors de la plage de leur
province. **Obligation** : avant le gel de `REQUIREMENTS.md` en v1.0, la table est confrontée au
fichier officiel des codes postaux belges (source Statbel ou bpost) et chaque écart constaté est
ajouté comme exception explicite dans `data/reference/postal-regions-be.json`.
**Justification** : présenter une table de correspondance construite de mémoire comme un relevé
violerait la règle R6 ; la marquer et prévoir sa confrontation est la seule issue honnête.

**EX-DATA-54 — structure du fichier.** `data/reference/postal-regions-be.json` porte deux
sections : `ranges` (les 13 plages ci-dessus) et `exceptions` (liste de couples
`{postalCode, regionCode}`). **La résolution consulte `exceptions` d'abord, `ranges` ensuite.**
Un code postal qui n'appartient à aucune plage donne `regionCode = INCONNU` et
`ingestFlags += REGION_UNRESOLVED`.

**EX-DATA-55 — pays hors Belgique.** Pour `countryCode ∉ {BE}`, aucune table code postal → NUTS-2
n'est fournie en v1 : `regionCode = INCONNU` et l'agrégation géographique se fait sur
`countryCode` et `postalCodePrefix2`. Les annonces concernées comptent dans tous les effectifs et
sont exclues des seuls agrégats par région.
**Justification** : H1 pose la Belgique en priorité avec un schéma ouvert aux autres pays —
ouvrir le schéma sans inventer quatre tables non relevées respecte à la fois H1 et R6.

**EX-DATA-56 — granularité minimale.** Il est interdit d'exposer, dans une interface ou un export,
un agrégat géographique dont l'effectif est inférieur à **5 annonces** pour une granularité plus
fine que le pays. Un tel agrégat est replié sur le niveau pays.
**Justification** : un agrégat régional à une ou deux annonces réidentifie de fait un vendeur
particulier dans une petite province, ce que la troncature au niveau régional cherche à empêcher ;
le seuil de 5 est la pratique statistique courante de suppression des petites cellules.

## A.9 Rattachement des champs (support du critère S5)

**EX-DATA-57.** Aucun champ du dictionnaire n'est orphelin. Rattachement par usage :

| Usage | Champs (par numéro) |
|---|---|
| Clé d'agrégation | 16, 17, 18, 19, 74, 75 |
| Métrique d'agrégat et d'histogramme | 7, 31, 59 |
| Statistique secondaire d'agrégat | 8, 11, 24, 33, 34, 35, 49, 51, 60, 79, 80 |
| Axe du nuage tri-dimensionnel | 7, 31, 59 (+ 42 pour la couleur, 1 et 2 pour le forage) |
| Entrée de détection d'outlier | 7, 31, 59, 16, 18 |
| Référence externe d'outlier | 11 |
| Filtre à parité source | 24, 25, 26, 35, 40, 41, 42, 54, 55, 57, 59, 60, 64, 65, 66, 67, 69, 70, 71, 72, 73, 74, 75, 78, 7, 10, 12 |
| Filtre local KYCAR (`sourceParity: false`) | 49, 51, 34, 80 |
| Affichage de la carte ou de la ligne d'annonce | 1, 2, 17, 19, 20, 21, 30, 35, 36, 42, 45, 59, 64 |
| Diagnostic d'ingestion et de représentativité | 3, 4, 5, 6, 13, 14, 15, 22, 23, 28, 29, 37, 38, 39, 43, 44, 46, 47, 48, 50, 52, 53, 56, 58, 61, 62, 63, 68, 76, 77, 81, 82 |

**EX-DATA-58.** Un champ classé exclusivement en « diagnostic » est chargé en mémoire mais n'est
pas exposé dans les écrans du mode 1 ni du mode 2. Il reste accessible par l'export d'annonces et
par le rapport d'ingestion.
