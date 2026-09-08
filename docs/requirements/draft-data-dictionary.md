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

**Ordre d'application, normatif** : **Normalisation puis Validation**. Toute borne de la colonne
Validation s'entend sur la valeur **déjà normalisée**, dans l'unité canonique d'`EX-DATA-4` et
après l'arrondi d'`EX-DATA-6`. Les bornes sont **inclusives** sauf mention contraire explicite.
Conséquence assumée et vérifiée champ par champ : le seuil de sentinelle devient de fait
`priceEur ≤ 249` puisque `249,60 €` se normalise en `250 €` ; `badgeDisplacementL = 0,55` se
normalise en `0,6` et devient valide ; `consumptionCombinedL100Km = 99,94` se normalise en `99,9`
et devient valide. Ces trois conséquences sont voulues : une valeur qui, une fois affichée, est
dans le domaine ne doit pas être rejetée pour un chiffre que l'application ne montre jamais.

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
Tout libellé provenant de `taxonomy.json` (`Make.label`, `Model.label`) est normalisé **NFC** au
chargement, comme toute chaîne du modèle.

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
| 3 | `snapshotId` | Identifiant du snapshot | `chaîne(32)` | 1 | DER | DÉRIVÉ : identifiant du lot d'ingestion, de la forme `<marketplace>-<capturedAt en YYYYMMDDTHHmmssZ>` | — | — | — | REJET |
| 4 | `observedAt` | Date d'observation | `timestamp` UTC | 1 | DER | `DÉRIVÉ : horodatage UTC du début du lot d'ingestion` | — | ISO-8601 à la seconde, suffixe `Z` | ≤ maintenant ; sinon REJET du snapshot entier | REJET |
| 5 | `marketplace` | Place de marché d'origine | `énum` | 1 | OBL | `DÉRIVÉ : domaine interrogé` ; `OAS:Marketplace` | `KYCAR_MARKETPLACE` | minuscules | ∈ vocabulaire ; sinon REJET | REJET |
| 6 | `vehicleType` | Type de véhicule | `énum` | 1 | OBL | `listings[].type` (OBSERVÉ, `[À CONFIRMER]`) ; `OAS:VehicleTypeId` | `KYCAR_VEHICLE_TYPE` | majuscule | doit valoir `C` ; sinon REJET | REJET |

**EX-DATA-14.** `listingUrl` est obligatoire et son absence provoque le rejet de l'annonce.
**Justification** : `00-CONTEXT.md` fonde l'architecture sur « un deeplink vers l'annonce
d'origine plutôt que dupliquer son contenu » — une annonce sans deeplink est un point de donnée
que l'utilisateur ne peut pas vérifier, donc invérifiable et sans valeur pour la détection
d'opportunité.

**EX-DATA-15.** Le couple `(snapshotId, listingId)` est la clé primaire de l'entité `Listing`.
**Ordre d'ingestion, total et normatif** : les réponses de la source sont traitées dans l'ordre
`(pageIndex croissant, positionDansPage croissante)`, où `pageIndex` est l'indice de la requête
dans le plan d'ingestion du snapshot et `positionDansPage` le rang de l'annonce dans le tableau
reçu. La **première** occurrence d'un `listingId` dans cet ordre est conservée ; les suivantes
sont écartées, et le compteur `snapshot.duplicateListingCount` est incrémenté de 1 par occurrence
écartée, sans erreur. Si deux occurrences d'un même `listingId` **diffèrent** sur l'un des champs
`priceEur`, `priceStatus`, `mileageKm` ou `firstRegistrationYearMonth`, l'occurrence conservée
porte `ingestFlags += DUPLICATE_VALUE_CONFLICT`, et le snapshot incrémente
`duplicateValueConflictCount`. Les valeurs écartées ne sont pas stockées.
**Justification** : l'ordre d'ingestion étant un artefact de collecte et non un ordre de
fraîcheur, il ne peut pas être présenté comme un choix de la valeur la plus juste ; il est en
revanche indispensable qu'il soit **reproductible**, et que l'annonce concernée soit distinguable
à l'écran d'une annonce dont le prix n'a jamais varié.
**Justification** : l'échantillonnage par modèle décrit en `FINDING-allowed-surface.md` § 2.3
peut servir la même annonce depuis deux pages modèle voisines, et un rejet dur ferait échouer un
snapshot pour une cause bénigne.

## A.3 Dictionnaire principal — bloc Prix

| # | Champ KYCAR | Libellé FR | Type / unité | Card. | Obl. | Source | Énum. | Normalisation | Validation | Si absent |
|---|---|---|---|---|---|---|---|---|---|---|
| 7 | `priceEur` | Prix affiché | `entier` (EUR) | 0..1 | OPT | `listings[].details.prices.public.amountInEUR.raw` (OBSERVÉ) ; `OAS:Price.price` (`minimum: 1`) | — | arrondi à l'euro entier ; `.formatted` **jamais** utilisé comme source | `p = 0` ou `p` non numérique → `priceStatus = MISSING`, `priceEur = INCONNU`, `ingestFlags += PRICE_MISSING_UNDECLARED` (**aucun rejet d'annonce**) · `p > 5 000 000` → `priceEur = INCONNU`, `ingestFlags += PRICE_OUT_OF_RANGE` (**aucun rejet d'annonce** : un véhicule de collection légitime au-dessus du plafond doit rester dans l'effectif du marché) · `1 ≤ p ≤ 5 000 000` → valide · `p < 250` → `ingestFlags += PRICE_SENTINEL_ABSOLUTE` (`EX-DATA-19`) et exclusion des statistiques de prix (annonce conservée) · **le verdict REJET est retiré du champ `priceEur`** : aucune valeur de prix ne provoque plus le rejet de l'annonce entière | INCONNU → `priceStatus` déduit (# 8) |
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

**EX-DATA-19 — les deux règles de prix sentinelle, à deux étages, sans rétroaction.**
(1) **`PRICE_SENTINEL_ABSOLUTE`** — étage **ingestion**, posé une fois par annonce :
`priceEur < 250`. Ne dépend de rien d'autre que l'annonce ; stocké dans `ingestFlags`.
(2) **`PRICE_IMPLAUSIBLE_IN_CELL`** — étage **analyse**, recalculé par cellule et par sélection,
**jamais stocké dans `ingestFlags`** : `priceEur < 0,10 × médianeRéf(C)`, où
`médianeRéf(C) = Q(V_price(C) privé des seules annonces portant PRICE_SENTINEL_ABSOLUTE, 0,50)`.
`PRICE_IMPLAUSIBLE_IN_CELL` **n'entre jamais** dans le calcul de `médianeRéf`. Le calcul est en
**un seul passage** — `filtrer l'absolu → médiane → marquer le relatif` — et **aucune itération,
aucune recherche de point fixe** n'est autorisée. La règle relative **ne s'applique pas** quand
`n_price(C) < 12` après retrait des sentinelles absolues ; la cellule `C` est celle
d'`EX-DATA-86`.
**Effectifs et statistiques** : les deux drapeaux **comptent** dans tout effectif (une annonce à
prix absurde reste une offre du marché) et sont **tous deux exclus** de `V_price`.
**Étiquetage** : parce que `PRICE_IMPLAUSIBLE_IN_CELL` dépend de la sélection, tout affichage qui
s'en prévaut nomme sa cellule au sens d'`A-07` et de `ARB-47`.
**Justification** : reprise de `R-A06` — le seuil absolu attrape le prix-placeholder, le seuil
relatif le prix crédible mais absurde dans son segment ; les deux étages suppriment la
circularité de la rédaction initiale. Le seuil absolu de 250 € reste celui que la source
elle-même annonce comme minimum d'occasion à 119 € (`priceInfo`,
`FINDING-allowed-surface.md` § 2.2), montant sous lequel aucun véhicule roulant ne s'échange.

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

`modelVersionRaw`, `fuelSourceLabelRaw` et tout champ dont le nom se termine par `Raw` sont du
**texte non maîtrisé** : ils sont rendus exclusivement comme **contenu textuel** (`textContent`,
interpolation auto-échappante d'un gabarit), **jamais** comme balisage (`innerHTML`,
`dangerouslySetInnerHTML`, `v-html` ou équivalent), et jamais comme valeur d'un attribut d'URL
(`href`, `src`) ni d'un gestionnaire d'événement. La même règle s'applique à leur reprise dans un
attribut `title` ou `aria-label`. Un test du lot D4 injecte `<img src=x onerror=…>` dans
`modelVersionInput` et vérifie que la chaîne apparaît **littérale** dans l'infobulle de `G4`
(`EX-SCR-158`) et dans la colonne « Version » de l'écran D (`EX-SCR-203`), et qu'aucune requête
réseau n'en découle.
**Justification** : la liste d'arrêt promotionnelle d'`EX-DATA-30` prouve que le champ porte déjà
du texte à risque ; l'absence d'exigence laissait le seul rempart à la convention du framework
choisi.

**EX-DATA-29 — pipeline de nettoyage, déterministe et ordonné.** Le pipeline s'applique
exactement dans cet ordre ; toute implémentation correcte produit la même sortie.

| Étape | Opération | Détail |
|---:|---|---|
| 1 | Normalisation Unicode | NFKC (et non NFC — pour replier les caractères pleine largeur et les exposants décoratifs) |
| 2 | Suppression des pictogrammes | tout point de code des plages U+1F000–U+1FAFF, U+2190–U+2BFF, U+2600–U+27BF, U+FE00–U+FE0F, U+E000–U+F8FF, U+200B–U+200F, U+2028–U+202F, plus U+200D |
| 3 | Suppression des marqueurs promotionnels | retrait de toute occurrence, comparaison insensible à la casse et aux diacritiques, des motifs de la liste d'arrêt versionnée `data/reference/version-stoplist.json` (contenu initial § A.5.2.1) |
| 4 | Suppression des séquences décoratives | toute suite de 2 caractères ou plus pris dans `* - _ = ~ ! . + # | / \ < >` est remplacée par un espace |
| 5 | Repli de la ponctuation résiduelle | tout caractère qui n'est ni lettre Unicode, ni chiffre, ni `. , - + /` est remplacé par un espace |
| 6 | Compactage | suites d'espaces → un espace, `trim`, puis troncature à 80 caractères sur une frontière de mot — dernier espace **à un index strictement inférieur à 80** ; **à défaut d'un tel espace, troncature dure à exactement 80 caractères**, sans chercher de frontière au-delà de la limite. La troncature ne coupe jamais à l'intérieur d'un groupe de graphèmes étendu (`ARB-24`) : si le 80ᵉ caractère est une marque combinante, la coupe recule jusqu'au début de son graphème |
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
| 74 | `countryCode` | Pays | `chaîne(2)` ISO-3166-1 alpha-2 | 1 | OBL | `listings[].location.countryCode` (OBSERVÉ) | — | majuscules ; **traduction obligatoire** du code marketplace vers l'ISO si la source sert un code marketplace (`B`→`BE`, `D`→`DE`, `A`→`AT`, `E`→`ES`, `F`→`FR`, `I`→`IT`, `L`→`LU`, `NL`→`NL`) | 2 lettres majuscules et code ISO existant sinon REJET — **exception nommée** : un code marketplace absent de la table de traduction (9ᵉ valeur non identifiée de `KYCAR_MARKETPLACE`) ne rejette pas l'annonce ; il donne `countryCode = INCONNU` + `MARKETPLACE_UNMAPPED` (`EX-DATA-40`) | REJET, sauf le cas de code marketplace non traduit ci-dessus → `INCONNU` |
| 75 | `regionCode` | Province / région | `énum` NUTS-2 | 0..1 | DER | `DÉRIVÉ : table § A.8 appliquée au code postal transitoire, puis code postal détruit` | `KYCAR_REGION` | majuscules, 4 caractères | ∈ vocabulaire du pays sinon INCONNU + `REGION_UNRESOLVED` | INCONNU |
| 76 | `regionName` | Libellé de la région | `chaîne(48)` | 0..1 | DER | `DÉRIVÉ : libellé de regionCode dans data/reference/regions-be.json` | — | libellé FR canonique | — | INCONNU |
| 77 | `postalCodePrefix2` | Zone postale (2 chiffres) | `chaîne(2)` | 0..1 | DER | `DÉRIVÉ : deux premiers caractères du code postal transitoire, puis code postal détruit` | — | conservé tel quel, chiffres uniquement | 2 chiffres sinon INCONNU | INCONNU |

**EX-DATA-40 — application de V4.** Le pays est stocké en **ISO-3166-1 alpha-2** et traduit vers
le code marketplace AutoScout24 **au moment de construire une requête source**, jamais avant.
**Justification** : les deux listes se recouvrent par accident et non par correspondance (`B` vaut
Belgique en recherche et n'existe pas comme code ISO belge, qui est `BE` ; `L` vaut Luxembourg en
recherche et Liberia en ISO) — le sens recherche→ISO est déterminé, le sens ISO→recherche l'est
aussi, mais un stockage en code propriétaire rendrait le modèle multi-pays de H1 inexploitable.

Le vocabulaire `KYCAR_MARKETPLACE` compte 9 valeurs et cette table en traduit 8. Le neuvième code
n'est **pas** identifié par les relevés disponibles : une valeur de marketplace absente de cette
table donne `countryCode = INCONNU`, `ingestFlags += MARKETPLACE_UNMAPPED`, et l'annonce est
**conservée** (aucun rejet). Aucune requête vers la source n'est construite pour un marketplace
non traduit. Le neuvième marché est **hors périmètre H1** ; l'identifier relève de la dette de
référentiel, pas de l'implémentation.

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

**EX-DATA-45 — vocabulaire `KYCAR_INGEST_FLAG`, 17 codes.**
`UNIT_UNSUPPORTED`, `ENUM_UNKNOWN`, `MODEL_UNRESOLVED`, `REGION_UNRESOLVED`,
`PRICE_SENTINEL_ABSOLUTE`, `PRICE_MISSING_UNDECLARED`, `PRICE_ON_REQUEST_WITH_AMOUNT`,
`PRICE_OUT_OF_RANGE`, `SUSPECT_ZERO_MILEAGE`, `MILEAGE_OUT_OF_RANGE`, `POWER_OUT_OF_RANGE`,
`POWER_UNIT_MISMATCH`, `FIRST_REG_UNPARSEABLE`, `FIRST_REG_OUT_OF_RANGE`,
`VERSION_FULLY_STRIPPED`, `DUPLICATE_VALUE_CONFLICT`, `MARKETPLACE_UNMAPPED`.
`PRICE_IMPLAUSIBLE_IN_CELL` n'appartient **pas** à ce vocabulaire : c'est un verdict d'analyse,
jamais un drapeau d'ingestion (`R-A06`).
Les variantes `ENUM_UNKNOWN_<VOCABULAIRE>`, `CO2_ZERO_NON_BEV`, `HYBRID_INCONSISTENT`,
`HYBRID_CATEGORY_UNRESOLVED`, `VERSION_POWER_MISMATCH` et `YEAR_OUT_OF_RANGE` sont des
sous-qualifications de `ENUM_UNKNOWN` et des drapeaux de champ, comptées dans le rapport
d'ingestion mais non dans le vocabulaire à 17 codes.

**EX-DATA-46.** Le rapport d'ingestion d'un snapshot publie, pour chaque code de
`KYCAR_INGEST_FLAG`, son effectif et son taux sur `listingCount`, plus le nombre d'annonces
rejetées par motif de rejet. Les codes `PRICE_OUT_OF_RANGE`, `DUPLICATE_VALUE_CONFLICT` et
`MARKETPLACE_UNMAPPED` y figurent au même titre que les autres.
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
**Note (D-14)** : les paramètres de requête utilisateur `zip` (alias `location`), `lat` et `lon`
sont **exclus du périmètre retenu** de `data/reference/filters-scope.json`, avec le motif
`R3_DONNEE_PERSONNELLE` — même traitement que `cid` (E14). Ce sont des **paramètres d'entrée de
recherche**, distincts des champs d'adresse ou de géolocalisation *stockés* dans une annonce (E8,
E11) : R3 les exclut aussi de ce rôle. Aucun filtre géographique fin n'existe en 2.6 ; le pays et
la région restent disponibles. Le test de balayage exigé par la présente exigence couvre les trois
paramètres. [amendée 2.6 — D-14]

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

---

# Partie B — Modèle d'agrégation

## B.0 Notations

**EX-DATA-59.** Définitions, valables pour toute la partie B.

| Symbole | Définition |
|---|---|
| `S` | le snapshot : l'ensemble des annonces retenues après ingestion |
| `σ` | la sélection : la conjonction des filtres posés par l'utilisateur, un prédicat sur une annonce |
| `Σ = { l ∈ S : σ(l) }` | la population sélectionnée |
| `N = |Σ|` | l'**effectif** de la sélection ; seul chiffre calculé sur toute la population |
| `m` | une métrique, `m ∈ { price, year, mileage }`, projetant une annonce sur `priceEur`, `firstRegistrationYear`, `mileageKm` |
| `V_m(A)` | l'**échantillon valide** de `m` sur une population `A` : le multiensemble des `m(l)` pour `l ∈ A` telles que `m(l)` est connue et non exclue par EX-DATA-60 |
| `n_m(A) = |V_m(A)|` | l'effectif valide de la métrique `m` |
| `V_m^↑` | l'échantillon valide trié par ordre croissant, `x_1 ≤ x_2 ≤ … ≤ x_n` |
| `Q(V, p)` | le quantile de niveau `p` de `V`, défini en B.1 |

**EX-DATA-60 — table des exclusions par métrique.** Un effectif et une statistique ne portent
jamais sur la même population : chaque statistique porte son propre dénominateur.

| Métrique `m` | Une annonce est exclue de `V_m` si |
|---|---|
| `price` | `priceStatus ≠ QUOTED` **ou** `ingestFlags ∋ PRICE_SENTINEL_ABSOLUTE` **ou** `ingestFlags ∋ PRICE_OUT_OF_RANGE` **ou** `PRICE_IMPLAUSIBLE_IN_CELL(C)` pour la cellule `C` du calcul en cours ; ce dernier terme n'existe que dans un calcul de cellule et n'a pas de sens au niveau du snapshot |
| `year` | `firstRegistrationYear` est `INCONNU` |
| `mileage` | `mileageKm` est `INCONNU` **ou** `ingestFlags ∋ SUSPECT_ZERO_MILEAGE` **ou** `ingestFlags ∋ MILEAGE_OUT_OF_RANGE` |

Les deux réglages d'`EX-SCR-95` sont les **seuls** paramètres utilisateur de cette table ; aucun
autre contrôle d'écran ne peut ajouter ni retirer une condition d'exclusion. La ligne `price`
ci-dessus est celle qu'impose `EX-DATA-19` (`R-A06`).

**EX-DATA-61.** Toute statistique publiée est accompagnée de trois nombres inséparables : la
valeur, son effectif `n_m`, et sa couverture `coverage_m = n_m / N` arrondie à 4 décimales.
Publier une statistique sans son effectif est interdit.
**Justification** : une médiane de prix sur 8 annonces et une médiane sur 1 281 annonces
s'affichent identiquement mais ne valent pas la même chose ; l'effectif est la seule information
qui permette au lecteur de trancher.

**EX-DATA-61bis — les trois couvertures, et l'interdiction du mot nu.** Trois rapports distincts
existent et portent trois noms qui ne sont jamais interchangeables :
• `sampleCoverage = listingCount / announcedCount`, arrondi à 4 décimales — **couverture
d'échantillon**, définie au seul niveau (marque) et (marque, modèle), `null` si `announcedCount`
est `INCONNU`, et **non définie sous filtre** (voir ci-dessous) ;
• `metricCoverage_m = n_m / N` (`EX-DATA-61`) — **couverture métrique** d'une statistique dans sa
sélection ;
• `priceQuotedShare = priceQuotedCount / listingCount` (`EX-DATA-17`) — **part de prix fermes**,
qui porte le seuil de 0,80 de `coverageWarning.price` et lui seul.
`sampleCoverage` **n'est publié que lorsque l'état de filtres est vide au sens d'`EX-SCR-27bis`**
(`ARB-29`) ; dès qu'un filtre est posé, il vaut `NON_APPLICABLE` et aucun consommateur ne peut le
substituer par un autre des trois rapports. L'emploi du mot « couverture » sans qualificatif est
interdit dans les quatre documents normatifs.
**Justification** : trois grandeurs sous un même mot, dont deux au même seuil de 80 %, ont produit
deux pastilles différentes pour la même zone-modèle et deux verdicts opposés sur le bandeau le
plus important de l'application.

## B.1 Le quantile — définition unique et non négociable

**EX-DATA-62.** Tout quantile de KYCAR est le **quantile de type 7** (interpolation linéaire entre
statistiques d'ordre, convention par défaut de R et de NumPy). Pour un échantillon trié
`x_1 ≤ … ≤ x_n` et `p ∈ [0, 1]` :

```
h = (n − 1) · p + 1
i = plancher(h)
f = h − i
Q(V, p) = x_1                        si n = 1
Q(V, p) = x_i                        si f = 0 ou i = n
Q(V, p) = x_i + f · (x_{i+1} − x_i)  sinon
```

**Justification** : il existe neuf définitions courantes du quantile empirique, qui divergent sur
les petits échantillons ; en imposer une par sa formule est la seule façon de garantir que deux
implémentations correctes des exigences produisent le même quartile.

**EX-DATA-63.** `Q` est calculé en **double précision** sur l'échantillon valide, sans arrondi
intermédiaire. L'arrondi n'a lieu qu'à la présentation, selon EX-DATA-6 et la table B.2.

## B.2 Statistiques descriptives par sélection

**EX-DATA-64.** Pour toute sélection `Σ` et toute métrique `m`, le bloc statistique est composé
des treize valeurs suivantes, sans exception ni variante.

| Statistique | Formule | Défini si | Arrondi de présentation |
|---|---|---|---|
| `count` | `N = |Σ|` | toujours | entier |
| `n` | `n_m(Σ)` | toujours | entier |
| `coverage` | `n_m / N` | `N ≥ 1` | 4 décimales |
| `min` | `x_1` | `n ≥ 1` | prix, km, année : entier |
| `max` | `x_n` | `n ≥ 1` | idem |
| `p05` | `Q(V_m, 0,05)` | `n ≥ 1` | prix : euro entier · km : entier · année : **plancher** |
| `q1` | `Q(V_m, 0,25)` | `n ≥ 1` | idem |
| `median` | `Q(V_m, 0,50)` | `n ≥ 1` | idem |
| `q3` | `Q(V_m, 0,75)` | `n ≥ 1` | idem |
| `p95` | `Q(V_m, 0,95)` | `n ≥ 1` | prix : euro entier · km : entier · année : **plafond** |
| `mean` | `(1/n) · Σ x_i` | `n ≥ 1` | prix et km : entier · année : 1 décimale |
| `sd` | `sqrt( (1/(n−1)) · Σ (x_i − mean)² )` | `n ≥ 2`, sinon **`null`** | prix et km : entier · année : 1 décimale |
| `iqr` | `q3 − q1` | `n ≥ 1` | comme `q1` |

Sur la colonne « Arrondi de présentation » : cet arrondi est celui d'`EX-DATA-6` et **prime sur
toute règle de format d'écran** ; l'export CSV applique le même arrondi que l'écran.
Les libellés d'affichage de `p05` et `p95` sont `P5` et `P95` (`EX-SCR-12`).

**EX-DATA-65.** L'écart-type est celui **d'échantillon**, dénominateur `n − 1` (correction de
Bessel), et vaut **`null`** — jamais `0` — pour `n = 1`.
**Justification** : un écart-type de `0` affirme que la dispersion est nulle, ce qui est faux ;
`null` affirme qu'elle est inconnue, ce qui est vrai.

**EX-DATA-66.** L'écart-type est calculé par l'**algorithme de Welford** en un passage, et non par
la formule `E[X²] − E[X]²`.
**Justification** : sur des prix de l'ordre de 10⁵ €, la formule des moments perd assez de chiffres
significatifs en double précision pour produire une variance négative sur des échantillons peu
dispersés, donc une racine carrée de nombre négatif.

**EX-DATA-67 — arrondi des bornes de fourchette.** Un quantile d'année est un réel ; la borne
basse affichée est son **plancher**, la borne haute son **plafond**. La même règle
plancher-plafond s'applique aux **bornes de kilométrage** (`EX-SCR-5`) et aux **bornes de prix**
quand l'arrondi de présentation n'est pas à l'unité. L'arrondi au plus proche reste réservé aux
**valeurs unitaires** (le kilométrage ou le prix d'une annonce), jamais aux bornes d'une
fourchette.
**Justification** : « de 2016,4 à 2021,6 » n'a pas de sens, et arrondir au plus proche produirait
une fourchette plus étroite que la réalité observée, alors que plancher-plafond garantit que la
fourchette affichée contient tous les millésimes retenus par les percentiles — et, généralisé,
que le véhicule le plus roulé de la sélection tombe toujours à l'intérieur de la fourchette
annoncée.

## B.3 Agrégat par marque — `MakeAggregate`

**EX-DATA-68.** Pour une sélection `Σ`, l'ensemble des agrégats par marque est `{ A_k : k ∈
makeIds(Σ) }` avec `A_k = { l ∈ Σ : l.makeId = k }`. Un agrégat n'est émis que si `|A_k| ≥ 1`.

| Champ | Formule | Type |
|---|---|---|
| `makeId`, `makeName` | clé de groupe | entier, chaîne |
| `listingCount` | `|A_k|` | entier |
| `modelCount` | `|{ l.modelId : l ∈ A_k, l.modelId ≠ INCONNU }|` | entier |
| `modelUnresolvedCount` | `|{ l ∈ A_k : l.modelId = INCONNU }|` | entier |
| `price`, `year`, `mileage` | bloc statistique complet (EX-DATA-64) sur `V_price(A_k)`, `V_year(A_k)`, `V_mileage(A_k)` | 3 × 13 valeurs |
| `priceQuotedCount`, `priceOnRequestCount`, `priceMissingCount` | comptages | entiers |
| `displayRange.price` | `[ p05, p95 ]` du bloc `price` | couple |
| `displayRange.year` | `[ plancher(p05), plafond(p95) ]` du bloc `year` | couple |
| `displayRange.mileage` | `[ p05, p95 ]` du bloc `mileage` | couple |
| `rawRange.{price,year,mileage}` | `[ min, max ]` de chaque bloc | 3 couples |
| `outlierCount.iqr`, `outlierCount.model` | § B.6 | entiers |
| `adTierDistribution` | effectif par code de `KYCAR_AD_TIER` | 5 entiers |
| `coverageWarning` | `{ price, year, mileage, samplingBias }` | 4 booléens |
| `rank` | position dans l'ordre de tri par défaut, 1-indexée | entier |
| `announcedCount` | effectif annoncé par la source pour ce périmètre : `listings.metadata.totalItems` au niveau marque, `topModels[].listingsCount` au niveau modèle. Niveau de preuve `OBSERVÉ`. **Si absent : `INCONNU`.** Ce champ est une propriété du snapshot et **n'est jamais recalculé sous filtre** : il est identique pour toutes les sélections d'un même snapshot | entier ou `INCONNU` |

**EX-DATA-69 — décision sur les bornes de fourchette.** La fourchette **affichée** d'une marque ou
d'un modèle est `[p05, p95]`, donc **robuste**. La fourchette **brute** `[min, max]` est calculée,
stockée et accessible au second plan (info-bulle, panneau de détail, export), mais n'est jamais la
valeur mise en avant.
**Justification** : le minimum brut d'un agrégat de marque est systématiquement un prix plancher de
contournement ou une épave — la source annonce elle-même 119 € comme minimum d'occasion — et une
carte affichant « Opel : de 119 € à 289 000 € » décrit les queues de distribution et non le
marché, alors que `[p05, p95]` décrit l'offre où se trouvent 90 % des annonces.

`displayRange` n'apparaît **que** sur l'écran A, et **jamais sans être nommé comme intervalle
central** (`(90 % des offres)`). Les écrans B et D et l'export CSV publient `rawRange`, sans
écrêtage. Les bornes d'axe des histogrammes ne sont pas des fourchettes et ne portent aucune
étiquette de fourchette (`R-A05`, `ARB-05`). Les libellés d'affichage de `p05` et `p95` sont `P5`
et `P95` (`EX-SCR-12`).

**EX-DATA-70 — ordre de tri par défaut.** Les agrégats de marque sont triés par `listingCount`
**décroissant**, égalités départagées par `makeName` **croissant** selon `EX-DATA-70bis`, égalités
résiduelles départagées par `makeId` croissant. Cet ordre est total au sens d'`EX-DATA-70ter`.
**Justification** : une comparaison sensible à la locale classerait `Škoda` avant ou après `Suzuki`
selon la machine, rendant l'ordre des cartes non reproductible et non testable.

**EX-DATA-70bis — comparaison de libellés, règle unique.** Toute comparaison de deux libellés à
des fins de tri ou de départage suit exactement cette procédure, et aucune autre :
(1) normalisation **NFD** ; (2) suppression des points de code de la plage `U+0300–U+036F`
(diacritiques combinants) ; (3) passage en **majuscules** par la table de correspondance Unicode
invariante de locale (`toUpperCase` sans argument de locale) ; (4) normalisation **NFC** ;
(5) comparaison **point de code par point de code**. Les chiffres sont comparés comme des
caractères : `Série 3` précède `Série 30`, et aucune comparaison numérique n'est appliquée.
**`Intl.Collator` est interdit** dans tout chemin de tri, de départage ou de hachage.
**Justification** : `Škoda` se classe bien avec `Skoda` (l'exigence produit d'`EX-SCR-119`), mais
sans dépendre de la version d'ICU du navigateur — la collation sensible à la locale classait
`Škoda` avant ou après `Suzuki` selon le poste, rendant `rank` non reproductible et non testable.

**EX-DATA-70ter — tout ordre publié est total.** Tout ordre de tri publié ou affiché comporte,
après sa clé primaire, les deux clés de départage suivantes, dans cet ordre : le libellé selon
`EX-DATA-70bis` croissant, puis l'identifiant technique croissant (`makeId`, `modelId`, ou
`listingId` en comparaison octet à octet sur la forme canonique minuscule). Une **clé primaire
indéfinie** (`null`) place l'élément **en fin** de l'ordre, dans les deux sens de tri, et n'est
**jamais** traitée comme `0`. La clé réservée `modelId = 0` (`EX-DATA-72`) est placée en dernier
parmi les modèles d'une marque, avant application des clés de départage.

**EX-DATA-71.** `modelCount` compte les modèles **distincts présents dans la sélection**, jamais
les modèles du référentiel.
**Justification** : le mode 1 répond à « ce que le marché propose à ces conditions », donc un modèle
absent de la sélection n'est pas une offre.

## B.4 Agrégat par couple marque/modèle — `ModelAggregate`

**EX-DATA-72.** Pour une sélection `Σ`, l'ensemble des agrégats par modèle est `{ B_{k,j} : (k,j)
∈ modelKeys(Σ) }` avec `B_{k,j} = { l ∈ Σ : l.makeId = k ∧ l.modelId = j }`, la clé réservée
`j = 0` (« Modèle non identifié ») portant les annonces dont `modelId` est `INCONNU`
(EX-DATA-20). La clé réservée `j = 0` porte le libellé canonique `Modèle non identifié` et le slug
`modele-non-identifie`, de sorte que la route de l'écran B soit constructible (`EX-NAV-20`,
`ARB-40`). Le contenu est **strictement identique** à celui de `MakeAggregate`, aux différences
suivantes près :

| Différence | Détail |
|---|---|
| clé | `(makeId, modelId)` au lieu de `makeId` |
| champs supprimés | `modelCount`, `modelUnresolvedCount` |
| champs ajoutés | `modelName` · `versionSampleCount = |{ l ∈ B : l.modelVersionClean ≠ INCONNU }|` · `topTrimTokens` : les 5 jetons de `trimTokens` les plus fréquents avec leur effectif, égalités départagées par ordre lexicographique croissant · `announcedCount` : effectif annoncé par la source pour ce périmètre, `topModels[].listingsCount`, preuve `OBSERVÉ`, **`INCONNU` si absent**, propriété du snapshot **jamais recalculée sous filtre** |
| ordre de tri par défaut | `listingCount` décroissant, puis `modelName` croissant (règle de comparaison d'EX-DATA-70), puis `modelId` croissant ; la clé `j = 0` est **toujours placée en dernier** quel que soit son effectif |

**Justification du placement en dernier de la clé `j = 0`** : « Modèle non identifié » est un
constat de qualité de donnée et non une offre du marché ; le laisser remonter en tête d'une carte
de marque à fort taux de non-résolution masquerait les vrais modèles.

**EX-DATA-73.** Un `ModelAggregate` est émis pour tout couple d'effectif au moins 1, sans seuil de
masquage. Le choix d'en afficher un sous-ensemble relève de la spécification d'écran ; le champ
`rank` existe pour que l'écran tranche sans recalculer.
**Justification** : masquer au niveau du modèle d'agrégation rendrait la somme des effectifs des
modèles inférieure à l'effectif de la marque, incohérence qu'aucun écran ne pourrait rattraper.

**EX-DATA-74 — cohérence de sommation.** Pour toute sélection `Σ` : `Σ_k listingCount(A_k) = N`,
et pour toute marque `k` : `Σ_j listingCount(B_{k,j}) = listingCount(A_k)`. De même pour toute
métrique `m` : `Σ_k n_m(A_k) = n_m(Σ)`.
**Justification** : c'est l'invariant qui prouve qu'aucune annonce n'a été perdue ni comptée deux
fois par le moteur d'agrégation, et il est directement exécutable comme test du lot D4.

## B.5 Buckets de distribution — règle de binning

**EX-DATA-75 — algorithme unique.** Les trois histogrammes (prix, kilométrage, année) sont produits
par **une seule** fonction `BIN(V, W, T, O)`, paramétrée différemment. Toute autre règle de
découpage est interdite. `V` est un échantillon valide, `W` une échelle finie de largeurs
autorisées, `T` le nombre de bins visé, `O` l'origine de la grille.

```
BIN(V, W, T, O) :
  n ← |V|
  si n = 0 :
      retourner { status: EMPTY, binWidth: null, bins: [], n: 0 }
  a ← Q(V, 0,01)
  b ← Q(V, 0,99)
  raw ← (b − a) / T
  w ← le plus petit u ∈ W tel que u ≥ raw ; s'il n'en existe aucun, w ← max(W)
  kLo ← plancher((a − O) / w)
  kHi ← plancher((b − O) / w)
  pour k de kLo à kHi :
      bins[k] ← { index: k, lo: O + k·w, hi: O + (k+1)·w, open: faux, count: 0 }
  under ← { index: kLo − 1, lo: −∞,            hi: O + kLo·w, open: vrai, count: 0 }
  over  ← { index: kHi + 1, lo: O + (kHi+1)·w, hi: +∞,        open: vrai, count: 0 }
  pour chaque x ∈ V :
      k ← plancher((x − O) / w)
      si k < kLo         : under.count ← under.count + 1
      sinon si k > kHi   : over.count  ← over.count  + 1
      sinon              : bins[k].count ← bins[k].count + 1
  sortie ← (under.count > 0 ? [under] : [])
        ++ [ bins[kLo] … bins[kHi] ]
        ++ (over.count  > 0 ? [over]  : [])
  retourner { status: OK, binWidth: w, bins: sortie, n: n,
              lowConfidence: (n < 12),
              underflowCount: under.count, overflowCount: over.count }
```

**EX-DATA-76 — appartenance à un bin.** Tout bin fermé est l'intervalle **semi-ouvert à droite**
`[lo, hi)`. Le bin de débordement bas est `(−∞, hi)`, le bin de débordement haut est `[lo, +∞)`.
Ces trois définitions couvrent `ℝ` sans recouvrement : toute valeur appartient à exactement un bin.
**Justification** : sans convention explicite, une valeur égale à une borne tombe dans un bin ou
dans son voisin selon l'implémentation, produisant deux histogrammes différents tous deux
« corrects ».

**EX-DATA-77 — paramétrage.** L'échelle de largeurs est **fixe** ; la largeur retenue est
**adaptative** au sein de cette échelle.

| Histogramme | `V` | `W` (largeurs autorisées) | `T` | `O` |
|---|---|---|---:|---:|
| Prix | `V_price(Σ)` | `{100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000}` (EUR) | 24 | 0 |
| Kilométrage | `V_mileage(Σ)` | `{1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000}` (km) | 24 | 0 |
| Année | `V_year(Σ)` | `{1}` (an) | 24 | 0 |

**Justification du choix « largeur adaptative sur échelle fixe »** : une largeur strictement fixe
est inutilisable, car la même règle doit décrire une sélection « Dacia sous 8 000 € » (étendue
6 000 €) et une sélection « Porsche » (étendue 250 000 €) — à 1 000 € de largeur, la première donne
6 bins et la seconde 250. Une largeur entièrement libre `(b−a)/T` donnerait en revanche des bornes
comme 4 037 €, illisibles et instables au moindre ajout d'annonce. L'échelle fixe de largeurs
rondes réconcilie les deux : lisible, stable par paliers, et adaptée à l'étendue.

**Justification de `T = 24`** : 24 barres tiennent dans la largeur d'un écran à ≈ 30 px par barre ;
au-delà de 40 les barres deviennent illisibles, en dessous de 12 la forme de la distribution
disparaît.

**Justification de l'écrêtage à `[Q(0,01), Q(0,99)]`** : sans lui, un seul véhicule de collection à
400 000 € dans une sélection de Corsa forcerait `w = 25 000 €` et écraserait toute la distribution
réelle dans deux barres.

**Justification de `W = {1}` pour l'année** : un bin d'année de largeur autre que 1 an mélangerait
des millésimes, alors que le millésime est l'unité naturelle de raisonnement de l'utilisateur ;
l'écrêtage à `[Q(0,01), Q(0,99)]` suffit à empêcher qu'une ancêtre de 1968 crée 50 bins vides,
puisqu'elle tombe dans le bin de débordement bas.

**EX-DATA-78 — bins vides intérieurs.** Un bin fermé d'effectif nul situé entre `kLo` et `kHi` est
**conservé** dans la sortie, avec `count = 0`.
**Justification** : supprimer un bin vide déformerait l'axe et donnerait à voir une distribution
continue là où il y a un trou, alors que le trou est précisément l'information — une année sans
offre ou une tranche de prix déserte est un fait de marché.

**EX-DATA-79 — bins de débordement.** Les bins ouverts ne sont émis que si leur effectif est
strictement positif, portent `open: true`, et **ne sont jamais représentés à l'échelle** : ils
occupent la même largeur graphique qu'un bin fermé. Ils s'étiquettent selon deux formes, et deux
seulement : bin de débordement bas `< <hi> <unité>`, bin de débordement haut `≥ <lo> <unité>`.
Ces deux formes sont exactes au regard d'`EX-DATA-76` ; les formes `> <borne>`, `<borne> +` et
`avant <AAAA>` sont **interdites**, y compris comme alias d'affichage. Leur effectif est aussi
publié séparément dans `underflowCount` et `overflowCount`.
**Justification** : un bin `[150 000 €, +∞)` dessiné à l'échelle serait infiniment large ; le
dessiner à largeur normale sans le marquer laisserait croire à une tranche de 5 000 €.

**EX-DATA-80 — effectif de 1 et petits effectifs.** Pour `n = 1`, `a = b`, donc `raw = 0` et
`w = min(W)` : l'algorithme produit exactement **un** bin fermé contenant l'unique valeur. Pour
`n < 12`, la sortie porte `lowConfidence: true` et l'écran accompagne l'histogramme d'une mention
d'effectif insuffisant.
**Justification du seuil 12** : c'est le seuil de la méthode M1 (§ B.6.1) ; en dessous, chacun des
quartiles repose sur moins de trois observations et la forme affichée est du bruit.

**EX-DATA-81 — sélection vide.** Pour `n = 0` : `status = EMPTY`, `bins = []`, `binWidth = null`.
Aucun bin fictif n'est émis, aucune largeur par défaut n'est inventée.

**EX-DATA-82 — déterminisme.** `BIN` ne consomme aucune source d'aléa, aucune horloge, aucune
locale, et aucun ordre d'itération dépendant de l'implémentation : sa sortie est fonction du seul
multiensemble `V` et de ses trois paramètres. Un test du lot D4 vérifie que deux exécutions sur
deux permutations du même échantillon produisent des sorties identiques octet à octet.
**Justification** : c'est la traduction exécutable de l'exigence « deux implémentations correctes
doivent produire exactement les mêmes bins ».

**EX-DATA-83 — entité produite.** Chaque bin est une instance de `DistributionBucket` :
`{ snapshotId, selectionHash, metric, index, lo, hi, open, count, share }` avec
`share = count / n` arrondi à 4 décimales. La somme des `count` sur les bins émis vaut exactement
`n_m`.

## B.5bis Agrégats par groupe

Cette section est la **source unique** des graphes `G5`, `G6`, `G7`, `G9`, `G10`, `G12`, `G13`,
`G14`, `G15` et de l'infobulle d'`EX-SCR-149` (`A-09`).

**EX-DATA-83bis — `GROUPSTAT(Σ, g, m)`.** Pour une sélection `Σ`, une **clé de groupe** `g` et une
métrique `m`, `GROUPSTAT` produit les groupes `G_v = { l ∈ Σ : g(l) = v }` et publie pour chacun :
la valeur de clé `v`, son libellé d'affichage, `listingCount(G_v)`, le **bloc statistique complet
d'`EX-DATA-64`** sur `V_m(G_v)`, et `n_m(G_v)` avec sa couverture au sens d'`EX-DATA-61`. Les clés
autorisées sont **exactement** : `fuelCategory`, `priceEvaluationCategory`, `sellerType`,
`countryCode`, `bodyType`, `transmission`, le bucket d'année produit par `BIN` (`EX-DATA-77`,
ligne Année), le rang de `NTILE(V_mileage(Σ), 5)` (`EX-DATA-83ter`) et le palier de puissance
d'`EX-DATA-83quater`. Aucune autre clé n'est admise sans amendement de cette exigence. `INCONNU`
**n'est jamais** une valeur de clé de groupe (`ARB-36`) : les annonces dont `g(l)` est `INCONNU` ne
forment pas de groupe et sont comptées dans un compteur `unknownKeyCount` publié à côté de
l'ensemble des groupes. L'ordre de publication des groupes est total : `listingCount` décroissant,
puis libellé croissant selon la règle de comparaison unique d'`EX-DATA-70bis` (`ARB-25`), puis
code de clé croissant.
**Justification** : neuf graphes de l'écran B demandent « la médiane et l'effectif par classe » ;
sans fonction unique, chaque développeur choisit sa méthode de quantile par groupe et son
traitement des classes inconnues, et les chiffres cessent d'être reproductibles — ce qu'`A-09`
interdit.
**Dette consignée (2.6, D-17)** : `GROUPSTAT`/`NTILE` ne sont **pas** implémentées dans le moteur
du worker en 2.6 — cette exigence n'est **pas tenue au sens strict** (protocole worker), motif mis
en dette plutôt qu'en correction : aucune valeur affichée n'est fausse, le calcul équivalent est
fait sur le thread principal en 78,6 ms p50 pour un budget de 300 ms (`EX-SCR-189`), et le coût
d'un module moteur complet plus l'extension du protocole worker dépasse le budget de la
remédiation 2.6. Reportée en 2.7.

**EX-DATA-83ter — `NTILE(V, k)`, tranches de rang.** Soit `V^↑ = x_1 ≤ … ≤ x_n` l'échantillon
valide trié et `k ≥ 2`. La tranche `t ∈ [1, k]` contient les rangs `i` tels que
`⌈(t−1)·n/k⌉ < i ≤ ⌈t·n/k⌉` ; les tailles obtenues valent donc `⌊n/k⌋` ou `⌈n/k⌉`, et jamais autre
chose. Chaque tranche publie `{ rang: t, loObserved, hiObserved, count }`, où `loObserved` et
`hiObserved` sont les valeurs des rangs extrêmes de la tranche. Une valeur en ex æquo à une
frontière **reste dans la tranche de rang le plus bas** : la coupure porte sur les rangs, jamais
sur les valeurs, de sorte que deux annonces de même kilométrage peuvent tomber dans deux tranches
voisines. Si `n < k`, `NTILE` produit `n` tranches d'un élément et publie
`status: DEGRADED, tranches: n`. `NTILE` est **déterministe** au sens d'`EX-DATA-82` : le tri est
fait par valeur croissante puis par `listingId` croissant, de sorte que deux permutations du même
multiensemble produisent la même partition octet à octet.
**Justification** : « quintile » désigne dans `EX-DATA-62` une borne de quantile, dont l'emploi sur
un échantillon concentré produit des tranches vides ; `G10` a besoin d'effectifs comparables,
propriété des tranches de rang et d'elles seules.

**EX-DATA-83quater — paliers de puissance.** Le palier d'une annonce est `⌊powerKw / 20⌋`, origine
`0`, largeur fixe **20 kW**, borne haute exclusive ; son libellé est
`<20·k> – <20·(k+1) − 1> kW`. Les paliers vides intérieurs sont conservés (même principe
qu'`EX-DATA-78`) ; aucun palier n'est émis au-delà de celui de la valeur maximale observée. Une
annonce dont `powerKw` est `INCONNU` n'entre dans aucun palier et compte dans `unknownKeyCount`.

**EX-DATA-83quinquies — indice de dépréciation.** Sur les groupes de
`GROUPSTAT(Σ, bucket d'année, price)` dont `n_price ≥ 12`, soit `y_max` le millésime **le plus
récent** satisfaisant ce seuil et `M(y)` la médiane de prix du groupe d'année `y`. Alors
`depreciationIndex(y) = 100 × M(y) / M(y_max)`, arrondi à 1 décimale, et `null` pour tout groupe
sous le seuil ; `annualLossPct(y) = 100 × (1 − M(y) / M(y+1))`, arrondi à 1 décimale, et `null` si
l'un des deux groupes est `null` ou si `y+1` est absent. La base `y_max` est **publiée** avec
l'indice. Aucune interpolation, aucune extrapolation, aucun lissage.
**Justification** : « base 100 » sans base nommée admet autant de courbes que de millésimes de
référence possibles, et la base doit être un groupe dont la médiane est publiable.

## B.6 Détection d'outliers

**EX-DATA-84 — principe.** KYCAR retient **deux méthodes de détection indépendantes** et **une
référence externe de contrôle**, jamais fusionnées en un score unique opaque.

| Identifiant | Nature | Rôle |
|---|---|---|
| **M1** | barrières de Tukey sur le logarithme du prix | détecteur, applicable dès `n ≥ 12` |
| **M2** | écart robuste au prix attendu par un modèle `prix ~ f(année, kilométrage)` | détecteur, applicable dès `n ≥ 30` |
| **M3** | comparaison à `priceEvaluationCategory` d'AutoScout24 | **contrôle**, jamais détecteur (EX-DATA-13) |

**EX-DATA-85 — vocabulaire `KYCAR_OUTLIER_FLAG`, 6 codes.** `LOW_PRICE_IQR`, `HIGH_PRICE_IQR`,
`LOW_PRICE_MODEL`, `HIGH_PRICE_MODEL`, `INSUFFICIENT_DATA`, `INSUFFICIENT_SPREAD`. Une annonce peut
porter plusieurs drapeaux ; détectée par les deux méthodes du même côté, elle porte les deux
drapeaux correspondants.

**EX-DATA-86 — cellule d'homogénéité.** Les deux méthodes comparent une annonce à une **cellule**
`C`, sous-ensemble de la sélection `Σ` et non du snapshot entier. La cellule est choisie par la
première règle satisfaite :

| Rang | Cellule | Condition d'usage | Méthodes |
|---:|---|---|---|
| 1 | `C₁ = { l ∈ Σ : makeId = k ∧ modelId = j ∧ firstRegistrationYear = y }` | `n_price(C₁) ≥ 12` | M1 seule |
| 2 | `C₂ = { l ∈ Σ : makeId = k ∧ modelId = j }` | `n_price(C₂) ≥ 12` (M1) ou `≥ 30` (M2) | M1, M2 |
| 3 | `C₃ = Σ` | `n_price(Σ) ≥ 12` (M1) ou `≥ 30` (M2) | M1, M2 |
| — | aucune | sinon | drapeau `INSUFFICIENT_DATA` |

Une annonce dont `firstRegistrationYear` est `INCONNU` **ne peut pas former de cellule de rang 1** :
son échelle de repli démarre à `C₂`. Réciproquement, une cellule `C₁` ne contient **jamais**
d'annonce d'année inconnue, y compris quand l'annonce évaluée en porte une.
**Règle générale** : `INCONNU` n'est **jamais** une valeur de clé d'agrégation, ni pour une cellule
d'homogénéité, ni pour un groupe de `GROUPSTAT` (`EX-DATA-83bis`), ni pour un bucket
d'histogramme. La **seule** exception du corpus est la clé réservée `modelId = 0` d'`EX-DATA-72`,
qui est une clé synthétique explicitement nommée et non une valeur inconnue laissée telle quelle.

M1 essaie `C₁`, puis `C₂`, puis `C₃`. M2 **n'essaie jamais `C₁`** et démarre à `C₂`.
**Justification du départ de M2 à `C₂`** : M2 régresse sur l'année, or `C₁` fixe l'année, donc la
variance de ce régresseur y est nulle par construction et son coefficient inestimable.
**Justification de la cellule prise dans `Σ` et non dans `S`** : les filtres de l'utilisateur
définissent le marché auquel il compare — signaler comme bon marché une berline diesel au regard
d'un snapshot national alors que l'utilisateur a filtré sur les coupés essence répondrait à une
autre question que la sienne.

**EX-DATA-87.** La cellule retenue et son effectif sont publiés avec chaque verdict :
`cellLevel ∈ {MODEL_YEAR, MODEL, SELECTION}`, `cellSize` et `implausibleInCellCount` — le nombre
d'annonces de la cellule écartées de `V_price` au titre de `PRICE_IMPLAUSIBLE_IN_CELL`
(`EX-DATA-19`) —, de sorte que l'écran puisse afficher combien d'annonces la cellule a écartées à
ce titre.
**Justification** : un écart de −30 % au prix attendu ne vaut pas la même chose mesuré contre
14 Corsa de 2017 ou contre 40 000 véhicules toutes marques confondues.

### B.6.1 M1 — barrières de Tukey sur le logarithme du prix

**EX-DATA-88.** Soit `C` la cellule retenue et `L = { ln(p) : p ∈ V_price(C) }`.

```
Q1  = Q(L, 0,25)
Q3  = Q(L, 0,75)
IQR = Q3 − Q1
si IQR = 0 : aucun drapeau, verdict INSUFFICIENT_SPREAD
lowFence  = exp( Q1 − 1,5 · IQR )
highFence = exp( Q3 + 1,5 · IQR )
pour une annonce de prix p :
    LOW_PRICE_IQR   si p < lowFence
    HIGH_PRICE_IQR  si p > highFence
score publié :  zIqr = ( ln p − Q(L, 0,50) ) / ( IQR / 1,349 )
```

Grandeurs publiées par verdict : `lowFence`, `highFence`, `zIqr`.

**Justification de la transformation logarithmique** : les prix de véhicules d'occasion sont
asymétriques à droite et se comparent multiplicativement (« 20 % moins cher »), pas
additivement. Sur prix bruts, `Q1 − 1,5·IQR` est fréquemment négatif, la barrière basse ne se
déclenche alors jamais et le côté bas — le seul qui intéresse un chasseur d'opportunités — devient
indétectable, tandis que la barrière haute signale des dizaines de véhicules simplement haut de
gamme.

**Justification de la constante 1,5** : c'est la constante canonique de Tukey ; sur un échantillon
log-normal elle signale environ 0,7 % des observations par queue, soit une liste de candidats
exploitable (≈ 9 annonces pour 1 281 Corsa belges) plutôt qu'une liste de plusieurs centaines.

**Justification du facteur 1,349** : sous hypothèse gaussienne `IQR ≈ 1,349·σ`, donc `IQR / 1,349`
est une estimation robuste de l'écart-type et `zIqr` s'exprime sur la même échelle que le score de
M2, ce qui rend les deux scores comparables et classables ensemble.

**EX-DATA-89.** `IQR = 0` (au moins la moitié de la cellule au même prix) donne
`INSUFFICIENT_SPREAD` et **aucun** drapeau, y compris pour une annonce très éloignée de ce prix
unique.
**Justification** : avec une barrière de largeur nulle, toute valeur différente de la médiane
serait signalée, ce qui ferait de la méthode un détecteur d'égalité et non de dispersion.

### B.6.2 M2 — écart au prix attendu par un modèle prix ~ f(année, kilométrage)

**EX-DATA-90 — spécification du modèle.** Sur la cellule `C` (rang 2 ou 3), soit `F` l'ensemble
d'ajustement : les annonces de `C` dont le prix, l'année et le kilométrage sont tous trois valides
au sens d'EX-DATA-60. `|F| ≥ 30` est requis, sinon `INSUFFICIENT_DATA`.

```
pour i ∈ F :
    y_i  = ln(p_i)
    ȳear = (1/|F|) · Σ firstRegistrationYear_i
    x1_i = firstRegistrationYear_i − ȳear
    x2_i = mileageKm_i / 10000
modèle :  y_i = β0 + β1·x1_i + β2·x2_i + ε_i
ajustement : moindres carrés ordinaires, équations normales
             ( XᵗX + λI ) β̂ = Xᵗy    avec λ = 10⁻⁹ · trace(XᵗX) / 3
             résolution par factorisation de Cholesky
```

**Justification du centrage de l'année et de l'échelle en 10 000 km** : sans centrage, la colonne
des années (≈ 2 020) et la constante sont quasi colinéaires et le système est mal conditionné en
double précision ; l'échelle en dizaines de milliers de kilomètres place les trois colonnes dans le
même ordre de grandeur et rend `β2` directement lisible comme « variation de log-prix par
10 000 km ».

**Justification du terme de régularisation `λ`** : il rend le système défini positif quelle que
soit l'entrée, donc la solution existe et est unique pour tout échantillon, y compris pathologique,
avec un biais très inférieur à la précision d'affichage (l'euro).

**Justification de la forme log-linéaire** : la dépréciation d'un véhicule est approximativement
multiplicative et constante par unité de temps et de distance, ce qu'un modèle log-linéaire capture
exactement avec trois paramètres ; un modèle plus riche serait impossible à ajuster de façon stable
sur les cellules de 30 à 100 annonces qui constituent le cas courant.

**EX-DATA-91 — dégénérescence des régresseurs.** Si `max(x1) = min(x1)`, le régresseur `x1` est
retiré ; si `max(x2) = min(x2)`, `x2` est retiré ; si les deux sont retirés, M2 n'est pas
applicable et le verdict est `INSUFFICIENT_SPREAD`. Le retrait est décidé **avant** l'ajustement,
sur ce test d'égalité exact, jamais sur un seuil de variance.
**Justification** : un seuil de variance introduirait une constante arbitraire dont dépendrait le
nombre de paramètres du modèle, et deux implémentations divergeraient sur les échantillons
frontaliers.

**EX-DATA-92 — score robuste.** Soit `r_i = y_i − ŷ_i` le résidu.

```
m_r = médiane(r)
MAD = médiane( |r_i − m_r| )
s   = 1,4826 · MAD
si s = 0 : verdict INSUFFICIENT_SPREAD, aucun drapeau
z_i = ( r_i − m_r ) / s
    LOW_PRICE_MODEL   si z_i ≤ −2,5
    HIGH_PRICE_MODEL  si z_i ≥ +2,5
prix attendu       :  p̂_i = exp( ŷ_i + m_r )
écart relatif      :  δ_i = p_i / p̂_i − 1
```

**Justification de l'échelle par MAD plutôt que par écart-type des résidus** : l'écart-type des
résidus est lui-même gonflé par les outliers que la méthode cherche, ce qui les masque (effet de
masquage) ; le MAD a un point de rupture de 50 % et reste insensible à eux. Le facteur 1,4826 rend
`s` comparable à un écart-type sous hypothèse gaussienne.

**Justification du seuil 2,5** : sur des résidus gaussiens, `|z| ≥ 2,5` couvre 1,24 % des
observations, soit ≈ 0,62 % par queue — comparable à M1, donc les deux méthodes produisent des
listes de candidats de tailles voisines et leur désaccord est informatif. Le seuil 3,0 donnerait
une espérance de 0,08 annonce signalée sur une cellule de 30, méthode inerte au cas courant ; le
seuil 2,0 en signalerait 4,6 %, liste trop longue pour être une liste d'opportunités.

**EX-DATA-93 — ajustement en exactement deux passes.** Passe 1 : ajustement sur `F`, calcul de `z`.
Passe 2 : ré-ajustement sur `F' = { i ∈ F : |z_i| < 3,5 }`, puis recalcul de `m_r`, `s` et de tous
les `z_i` **pour l'ensemble `F` complet** à partir des coefficients de la passe 2. Aucune itération
supplémentaire, aucun critère de convergence. Si `|F'| < 30`, la passe 2 est annulée et les
résultats de la passe 1 sont conservés.
**Justification** : une seule passe laisse les coefficients tirés par les outliers eux-mêmes ; une
itération jusqu'à convergence rend le résultat dépendant du critère d'arrêt et du nombre maximal
d'itérations, donc non reproductible. Deux passes exactement suppriment l'essentiel du biais et
restent spécifiables sans ambiguïté.

**EX-DATA-93bis — coefficient de détermination publié.** `R²` est calculé sur la **passe 2**
d'`EX-DATA-93`, sur l'ensemble d'ajustement `F` **complet** — jamais sur `F'` —, en échelle
`y = ln(p)` et non en euros :
`R² = 1 − SCR/SCT`, avec `SCR = Σ_{i∈F} (y_i − ŷ_i)²`, `SCT = Σ_{i∈F} (y_i − ȳ)²` et
`ȳ = (1/|F|)·Σ_{i∈F} y_i`, `ŷ_i` étant la prédiction des coefficients de la passe 2. Si
`SCT = 0`, alors `R² = null` et le verdict de la cellule est `INSUFFICIENT_SPREAD`. `R²` est
arrondi à 2 décimales selon `EX-DATA-6`, jamais tronqué.
**Justification** : l'annexe B affiche `R²` en clair sous le titre de `G8` et en fait un seuil
d'avertissement (`R² < 0,30`) ; sans passe, sans dénominateur et sans échelle fixés, deux
implémentations affichent deux nombres et déclenchent l'avertissement sur des sélections
différentes.

### B.6.3 Score d'opportunité et classement

**EX-DATA-94.** Le score publié pour le classement des opportunités est :

```
opportunityScore = −z_i       si M2 est applicable à l'annonce
opportunityScore = −zIqr_i    sinon, si M1 est applicable
opportunityScore = null       sinon
```

Les candidats sont classés par `opportunityScore` **décroissant**, égalités départagées par
`priceEur` croissant, puis par `listingId` croissant en comparaison octet à octet sur la forme
canonique minuscule.
**Justification de l'unification des deux échelles** : `z` et `zIqr` sont tous deux exprimés en
écarts-types robustes (EX-DATA-88), donc directement comparables ; sans cette normalisation, un
classement mêlant les deux méthodes trierait sur deux unités différentes.
**Justification de la préférence donnée à M2** : M2 tient compte de l'année et du kilométrage, donc
un écart qu'il signale est un écart de prix à caractéristiques comparables, alors que M1 signale
aussi un véhicule simplement plus vieux ou plus roulé que la médiane de sa cellule.

**EX-DATA-95.** Une annonce de verdict `INSUFFICIENT_DATA` ou `INSUFFICIENT_SPREAD` n'est **jamais**
classée parmi les opportunités, et n'est pas non plus comptée comme « non anormale » : l'écran
publie séparément `outlierEvaluatedCount` et `outlierNotEvaluatedCount`, dont la somme vaut
`priceQuotedCount`.
**Justification** : « pas d'anomalie détectée » et « anomalie non évaluable » sont deux états
distincts, et les confondre présenterait une absence de mesure comme une mesure rassurante.

### B.6.4 M3 — contrôle par la référence externe AutoScout24 (décision V5)

**EX-DATA-96.** Sur la sous-population `E = { l ∈ Σ : priceStatus = QUOTED ∧
priceEvaluationCategory ∉ {0, INCONNU} }`, on pose `cheap(l) ⟺ priceEvaluationCategory ∈ {1, 2}`
et `flaggedLow(l) ⟺ outlierFlags ∩ {LOW_PRICE_IQR, LOW_PRICE_MODEL} ≠ ∅`. Avec le tableau de
contingence 2×2 `(flaggedLow × cheap)` sur `E`, d'effectifs `a` (les deux vrais), `b` (signalé, non
cheap), `c` (non signalé, cheap), `d` (les deux faux), le rapport de contrôle publie :

| Indicateur | Formule |
|---|---|
| `precisionLow` | `a / (a + b)`, `null` si `a + b = 0` |
| `recallLow` | `a / (a + c)`, `null` si `a + c = 0` |
| `kappa` | `(p_o − p_e) / (1 − p_e)` avec `p_o = (a+d)/|E|` et `p_e = ((a+b)(a+c) + (c+d)(b+d)) / |E|²` |
| `evalCoverage` | `|E| / priceQuotedCount`, 4 décimales |

**EX-DATA-97.** Aucun seuil d'acceptation n'est imposé sur `precisionLow`, `recallLow` ou `kappa`.
L'exigence vérifiable est que **les quatre indicateurs soient calculés et publiés** dans le rapport
de test du lot D4, pour au moins trois cellules d'effectif supérieur à 200.
**Justification** : le modèle de prix d'AutoScout24 n'est pas publié, il intègre probablement des
variables que KYCAR n'a pas (équipement, historique, cote Eurotax) et porte sur son propre
périmètre — un désaccord n'est donc pas une preuve d'erreur de KYCAR, et fixer un seuil d'accord
ferait de la boîte noire la vérité de référence, ce qu'EX-DATA-13 interdit.

## B.7 Vue tri-dimensionnelle prix × année × kilométrage

**EX-DATA-98 — données strictement nécessaires par point tracé.**

| Champ | Rôle |
|---|---|
| `priceEur` | axe 1 |
| `firstRegistrationYearMonth` | axe 2 ; l'année s'en dérive par division entière |
| `mileageKm` | axe 3 |
| `fuelCategory` | encodage de couleur (`KYCAR_FUEL_CATEGORY`) |
| `outlierFlags`, `opportunityScore`, `expectedPriceEur` | mise en évidence et info-bulle |
| `listingId`, `listingUrl` | forage vers l'annonce d'origine |
| `makeName`, `modelName`, `modelVersionClean`, `powerKw` | contenu de l'info-bulle |
| `priceEvaluationCategory` | jeton d'évaluation AutoScout24 de l'infobulle, `EX-SCR-158` |

Aucun autre champ n'est transmis à la vue. **Justification** : la charge transmise par point
détermine directement la mémoire du rendu — **13 champs à ≈ 68 octets par point plafonnent à
≈ 340 Ko pour 5 000 points**, contre plusieurs mégaoctets si l'annonce entière était transmise. La
clause « aucun autre champ n'est transmis à la vue » reste entière : tout besoin d'un quatorzième
champ exige d'amender cette exigence.

**EX-DATA-99 — éligibilité au tracé.** Une annonce est éligible si et seulement si son **prix est
valide** au sens d'EX-DATA-60 — c'est-à-dire `priceStatus = QUOTED`, **et** ni
`PRICE_SENTINEL_ABSOLUTE`, **et** ni `PRICE_IMPLAUSIBLE_IN_CELL` pour la cellule du tracé en
cours (cohérent avec EX-DATA-16(e), EX-DATA-19 et `ARB-15`) — et si `firstRegistrationYear` et
`mileageKm` sont tous deux valides au sens d'EX-DATA-60. Les annonces non éligibles sont comptées
et **leur motif est ventilé** : `noPrice`, `noYear`, `noMileage`, `suspectValue` (ce dernier motif
couvre `PRICE_SENTINEL_ABSOLUTE` et `PRICE_IMPLAUSIBLE_IN_CELL`) — une annonce cumulant plusieurs
motifs est comptée dans le premier de cette liste qui s'applique, de sorte que la somme des
quatre compteurs et du nombre d'éligibles vaut exactement `N`. [amendée 2.6 — D-05]
**Justification de la ventilation** : sans elle, une nuée qui perd 40 % de sa sélection ne dit pas
pourquoi, et l'utilisateur conclut à un marché étroit au lieu d'un défaut de donnée.

**EX-DATA-100 — plafond de points.** `K = 5 000` points tracés au maximum.
**Justification** : 5 000 marques se dessinent en une trame à 60 Hz en rendu canvas sur une machine
de milieu de gamme, et au-delà la nuée sature visuellement — la lisibilité, qui est la raison d'être
de la vue, se dégrade sans qu'aucune information s'ajoute ; la forme au-delà de 5 000 points est
portée par la couche de densité d'EX-DATA-102, pas par les points.

**EX-DATA-101 — règle d'échantillonnage, déterministe et sans aléa.** Soit `Elig` l'ensemble
éligible, `n_e = |Elig|`, et `A = { l ∈ Elig : outlierFlags ∩ {LOW_PRICE_IQR, HIGH_PRICE_IQR,
LOW_PRICE_MODEL, HIGH_PRICE_MODEL} ≠ ∅ }`.

```
si n_e ≤ K :
    tracer Elig en entier ;  sampled = faux ; outlierTruncated = faux
sinon si |A| ≥ K :
    tracer les K annonces de A de plus grand |opportunityScore|,
      égalités départagées par listingId croissant
    sampled = vrai ; outlierTruncated = vrai
sinon :
    tracer A en entier
    B   ← Elig \ A, trié par listingId croissant
             (comparaison octet à octet, forme canonique minuscule)
    q   ← K − |A|
    pas ← |B| / q                       (réel, non arrondi)
    pour j de 0 à q − 1 : tracer B[ plancher( j · pas ) ]
    sampled = vrai ; outlierTruncated = faux
```

**Justification de la conservation intégrale des annonces signalées** : la vue existe pour isoler
visuellement ce qui sort de la nuée ; échantillonner les outliers reviendrait à jeter le sujet pour
garder le décor.

**Justification de l'échantillonnage systématique sur `listingId`** : un UUID v4 est indépendant du
prix, de l'année et du kilométrage, donc le sous-échantillon est non biaisé par rapport aux trois
axes ; l'ordre étant celui de l'identifiant, l'échantillon est reproductible sans générateur
pseudo-aléatoire ni graine à transporter, ce qui rend la vue identique d'une session à l'autre et
testable.

**EX-DATA-100bis — propriété : indépendance à l'ordre d'entrée.** L'échantillon tracé à l'écran
est **identique, octet à octet**, quelle que soit la permutation en entrée du multiensemble
éligible `Elig` : deux appels sur deux permutations de la même sélection produisent la même liste
de `listingId` tracés, dans le même ordre. C'est une **propriété**, satisfaite par
l'échantillonnage systématique et déterministe d'`EX-DATA-101`, qui trie `Elig` par `listingId`
avant tout tirage et n'emploie **ni générateur pseudo-aléatoire ni graine** — `EX-DATA-101` est
l'algorithme qui fait foi, `EX-DATA-100bis` n'en décrit pas un second. Aucune graine n'est
exportée ni affichée nulle part (la mention d'échantillonnage d'`EX-DATA-103` cite `n_e`, `K`, le
nombre de points et le mode, sans graine). `EX-DATA-100bis` satisfait la clause de déterminisme
d'`EX-DATA-82` : un test du lot D4 vérifie que deux permutations du même multiensemble produisent
le même échantillon octet à octet.
**Justification** : « graine fixée » ne fixait ni l'algorithme, ni l'ordre sur lequel il opère ;
sur une sélection de 40 000 annonces dont 12 outliers, deux implémentations conformes retenaient
typiquement 4 et 8 de ces outliers — l'annonce cherchée était présente ou absente sans qu'aucune
règle ne tranche. L'échantillonnage systématique sur `listingId` d'`EX-DATA-101` referme cette
question sans recourir à un générateur ni à une graine à transporter. [amendée 2.6 — D-06]

**EX-DATA-102 — couche de densité, toujours calculée.** Indépendamment du plafond de points, la vue
publie une grille `G = binsAnnée × binsKilométrage`, où les bins d'année et de kilométrage sont
**exactement ceux produits par `BIN`** pour la même sélection (EX-DATA-77), bins de débordement
compris. Pour chaque cellule non vide :

| Champ | Formule |
|---|---|
| `yearBinIndex`, `mileageBinIndex` | indices de bin |
| `count` | effectif de la cellule |
| `medianPrice` | `Q(V_price(cellule), 0,50)` |
| `p05Price`, `p95Price` | `Q(·, 0,05)` et `Q(·, 0,95)` |
| `share` | `count / n_e`, 4 décimales |

Les cellules d'effectif nul ne sont pas émises. Le nombre de cellules est borné par
`(24 + 2) × (24 + 2) = 676`.

**Justification de la réutilisation des bins de `BIN`** : la couche de densité et les deux
histogrammes marginaux décrivent alors la même partition, donc la somme des effectifs d'une colonne
de la grille est exactement l'effectif du bin d'année correspondant — invariant vérifiable par test
et cohérence visuelle entre les trois graphiques d'un même écran.

**EX-DATA-102bis — grille de densité prix × kilométrage.** La grille de `G7` réutilise sur chaque
axe **exactement** les bins produits par `BIN` pour la même sélection : bins de `V_price(Σ)` en
abscisse et bins de `V_mileage(Σ)` en ordonnée (`EX-DATA-77`), bins de débordement compris. Une
cellule est le produit cartésien de deux bins et publie
`{ priceBinIndex, mileageBinIndex, count }`. Une annonce n'entre dans la grille que si `priceEur`
et `mileageKm` sont tous deux valides au sens d'`EX-DATA-60` ; les autres sont ventilées comme en
`EX-DATA-99`, et la somme des `count` vaut exactement l'effectif éligible.
**Aucune grille hexagonale** : elle n'est pas dérivable des bins de `BIN` et rendrait le clic sur
une cellule non traduisible en filtre d'intervalle.

**EX-DATA-103.** Quand `sampled = true`, la vue affiche `n_e`, `K`, le nombre de points tracés et
la mention du mode d'échantillonnage. Quand `outlierTruncated = true`, elle affiche en plus le
nombre d'annonces signalées non tracées.
**Justification** : une nuée échantillonnée sans mention laisserait compter les points comme s'ils
étaient l'effectif, ce qui est la lecture la plus naturelle et serait fausse d'un facteur pouvant
atteindre 200.

## B.8 Invariants vérifiables du moteur d'agrégation

**EX-DATA-104.** Les huit invariants suivants sont chacun un test exécutable du lot D4.

| # | Invariant |
|---|---|
| I1 | `Σ_k listingCount(A_k) = N` |
| I2 | `∀k : Σ_j listingCount(B_{k,j}) = listingCount(A_k)` |
| I3 | `∀m : Σ_k n_m(A_k) = n_m(Σ)` |
| I4 | `∀m : Σ_{bins émis} count = n_m(Σ)` |
| I5 | `priceQuotedCount + priceOnRequestCount + priceMissingCount = N` |
| I6 | `outlierEvaluatedCount + outlierNotEvaluatedCount = priceQuotedCount` |
| I7 | `Σ_{cellules de G} count = n_e`, et pour toute colonne d'année la somme des effectifs de cellules vaut l'effectif du bin d'année correspondant |
| I8 | `BIN(permutation(V), …) = BIN(V, …)` octet à octet ; `min(V)` appartient au premier bin émis et `max(V)` au dernier |

---

# Partie C — Entités, volumétrie et index

## C.0 Inventaire des entités

**EX-DATA-105.** Le modèle compte **treize entités**, dont quatre seulement sont persistées par
snapshot.

| Entité | Rôle | Portée |
|---|---|---|
| `Snapshot` | un lot d'ingestion et ses métadonnées de qualité | persistée |
| `Listing` | une annonce, telle que décrite par la partie A | persistée |
| `Make`, `Model` | taxonomie de référence (295 marques, 4 955 modèles) | statique |
| `Enumeration`, `EnumValue` | les 27 vocabulaires nommés de § A.1 | statique |
| `Region`, `PostalRegionRange` | correspondance code postal → NUTS-2 | statique |
| `MakeAggregate` | agrégat par marque (§ B.3) | persistée pour la sélection vide, calculée sinon |
| `ModelAggregate` | agrégat par couple marque/modèle (§ B.4) | idem |
| `DistributionBucket` | un bin d'histogramme (§ B.5) | calculée |
| `SelectionStats` | bloc statistique de la sélection entière (§ B.2) | calculée |
| `OutlierVerdict` | verdict de détection par annonce (§ B.6) | calculée |
| `DensityCell` | cellule de la grille année × kilométrage (§ B.7) | calculée |

**`Make`** — clé primaire `makeId`.

| Champ | Type | Preuve | Si absent |
|---|---|---|---|
| `makeId` | entier | RELEVÉ | rejet de l'entrée de taxonomie |
| `label` | chaîne(60), NFC | RELEVÉ (`makes[].label`) | rejet de l'entrée |
| `slug` | chaîne(60) | RELEVÉ si fourni, sinon `[EXTRAPOLÉ]` par `SLUG(label)` | `SLUG(label)` |
| `announcedCount` | entier | OBSERVÉ | `INCONNU` (`ARB-01`) |

**`Model`** — clé primaire `(makeId, modelId)`.

| Champ | Type | Preuve | Si absent |
|---|---|---|---|
| `makeId`, `modelId` | entiers | RELEVÉ | rejet de l'entrée |
| `label` | chaîne(60), NFC | RELEVÉ (`topModels[].label`) | rejet de l'entrée |
| `slug` | chaîne(60) | RELEVÉ si fourni, sinon `[EXTRAPOLÉ]` par `SLUG(label)` | `SLUG(label)` |
| `bodyTypes` | tableau de `KYCAR_BODY_TYPE`, 0..n | RELEVÉ (`topModels[].bodyTypes`) | tableau vide, **jamais** `INCONNU` |
| `announcedCount` | entier | OBSERVÉ | `INCONNU` |

**`SLUG(s)`** : NFD → suppression des diacritiques `U+0300–U+036F` → minuscules invariantes de
locale → remplacement de toute suite de caractères hors `[a-z0-9]` par un tiret unique →
suppression des tirets de tête et de queue → troncature à 60 caractères sur une frontière de
tiret, à défaut troncature dure. `SLUG` est déterministe et testé sur les libellés `Série 3`,
`SUV/4x4/Pick-Up`, `Citroën`, `Cupra` et `Modèle non identifié`.
**Le `slug` n'est jamais utilisé pour résoudre une entité** : `makeId` et `modelId` font foi
(`EX-SCR-140`), le `slug` est cosmétique et un `slug` non canonique déclenche la redirection
canonique d'`EX-SCR-140`.

**EX-DATA-106 — `Snapshot`.**
`{ snapshotId, marketplace, capturedAt, sourceKind ∈ {REAL, SYNTHETIC}, providerVersion,
listingCount, rejectedCount, rejectedByReason: map, duplicateListingCount,
duplicateValueConflictCount, announcedListingCount, unknownCountByField: map,
ingestFlagCounts: map, versionStrippedRate, coverageNote }`.

**Complément du coordinateur — travail 40, absent de la liste d'arbitrage.** Les trois champs
`duplicateValueConflictCount`, `announcedListingCount` et `unknownCountByField` sont réclamés
respectivement par les décisions `ARB-54`, `ARB-01` et `ARB-64`, dont aucune n'avait de travail
correspondant sur cette entité — et `ARB-64` ne figurait pas du tout dans la liste `ANNEXE-A`.
L'écart laissait le document **incomplet au sens strict** : `EX-DATA-15` incrémente
`duplicateValueConflictCount`, un compteur que l'entité ne déclarait pas. Écart relevé par l'agent
d'application, qui a eu raison de ne pas l'ajouter de sa propre initiative.

- `duplicateValueConflictCount` — nombre d'annonces vues plusieurs fois dans le snapshot avec des
  valeurs divergentes sur un champ retenu. Compteur de qualité de source, pas de rejet.
- `announcedListingCount` — effectif total annoncé par la source pour le périmètre du snapshot.
  Dénominateur de `sampleCoverage` ; `INCONNU` si la source ne le fournit pas.
- `unknownCountByField` — pour chaque champ, le nombre d'annonces dont la valeur est absente ou
  inconnue. C'est ce qui rend la **couverture métrique** auditable plutôt que déclarative.
**EX-DATA-107.** `sourceKind` est obligatoire et affiché dans l'interface dès qu'il vaut
`SYNTHETIC`. **Ce n'est pas un champ porté par `AggregateResult` ni par `ListingColumnBatch`**
(interfaces gelées en 2.3, non amendées pour ce motif) : l'application l'obtient par la méthode
`describe()` du `DataProvider` ouvert, mise en regard du `snapshotId` que chaque objet servi porte
déjà — ce couple `describe()` + `snapshotId` suffit à identifier sans ambiguïté la provenance
d'un résultat affiché, sans qu'aucune entité calculée n'ait à porter elle-même l'étiquette.
**Justification** : le lot D3 produit un dataset synthétique avec outliers injectés, et un
utilisateur ne doit jamais pouvoir confondre une distribution générée avec un marché réel.
[amendée 2.6 — D-24]

**EX-DATA-108 — `selectionHash`.** Toute entité calculée est clefée par `selectionHash` :
les 16 premiers caractères hexadécimaux du SHA-256 de la sérialisation canonique de l'état de
filtres — filtres triés par identifiant KYCAR croissant, valeurs multiples triées par ordre
croissant de leur code, filtres à leur valeur par défaut omis, paires jointes par `;` sous la forme
`identifiant=valeur`. `selectionHash` est publié sous la forme `<localDatasetKey>:<refineHash>`
(`EX-SRCH-9quinquies`), où `refineHash` est le hachage de la seule composante `R` par cette même
règle de canonisation — la chaîne réservée `EMPTY` désignant sa valeur vide. La sélection
globalement vide (aucun filtre `T` ni `R`) a donc pour hachage la chaîne réservée `FULL:EMPTY`.
**Justification** : la même règle de canonisation sert de clé de cache, de clé d'entité calculée et
de base de l'URL partageable, donc deux états de filtres sémantiquement identiques ne peuvent pas
produire deux caches ni deux liens différents.

## C.1 Stratégie de calcul — précalcul ou calcul à la volée

**EX-DATA-109.** Décision par entité, chiffrée contre H5 (10⁴ à 10⁶ annonces par snapshot).

| Entité | Stratégie | Justification chiffrée |
|---|---|---|
| `Listing`, disposition colonnaire | **matérialisée une fois** à l'ingestion | 10⁶ × 44 octets ≈ 44 Mo de colonnes typées, plus 16 Mo d'identifiants binaires |
| `MakeAggregate` et `ModelAggregate` pour `selectionHash = EMPTY` | **précalculés** à l'ingestion, persistés avec le snapshot | 295 marques + 4 955 modèles = 5 250 agrégats × ≈ 320 octets ≈ 1,7 Mo ; le mode 1 sans filtre s'affiche alors sans aucun balayage |
| `MakeAggregate` et `ModelAggregate` pour toute autre sélection | **à la volée** | l'espace des sélections est d'au moins 2¹⁰¹ combinaisons (101 filtres relevés) : tout précalcul est impossible par construction, pas par choix |
| `DistributionBucket` | **à la volée** | dépend de la sélection ; au plus 26 bins par métrique, coût `O(n)` après le balayage de sélection |
| `SelectionStats` | **à la volée** | idem |
| `OutlierVerdict` | **à la volée** | dépend de la cellule d'homogénéité, elle-même dépendante de la sélection (EX-DATA-86) |
| `DensityCell` | **à la volée** | au plus 676 cellules (EX-DATA-102) |
| `Make`, `Model`, `Enumeration`, `Region` | **statiques**, chargées au démarrage | `filters.json` 97 Ko + `taxonomy.json` 692 Ko + 33 fichiers de références ≈ 200 Ko |
| cache de sélections | **LRU de 32 entrées** par `selectionHash`, **clefé par `(localDatasetKey, refineHash)`** ; l'interdiction de précalculer une sélection filtrée ne porte **pas** sur le jeu de données local, dont la mise en cache est exigée par `EX-SRCH-9ter` | rend le retour arrière et le changement d'onglet `O(1)` ; 32 × ≈ 400 Ko ≈ 13 Mo |

**Justification du refus de précalculer les agrégats filtrés** : avec 101 filtres relevés dont une
majorité multi-valeurs, le nombre d'états de filtres possibles dépasse 2¹⁰¹ ; même en se limitant
aux dix filtres les plus utilisés à cinq valeurs chacun, cela ferait 9,8 × 10⁶ jeux d'agrégats à
matérialiser pour un snapshot, soit plus de volume que le snapshot lui-même. Le balayage à la volée
est la seule stratégie qui reste bornée.

**EX-DATA-110 — budget de temps par opération, à `N = 10⁶`.** Ces chiffres sont des exigences, pas
des estimations, et sont mesurés par un test de performance du lot D4.

| Opération | Budget | Base du chiffre |
|---|---|---|
| Balayage de sélection (application de tous les filtres posés) | ≤ 60 ms | 10⁶ lignes × ≈ 12 lectures de colonne typée en un passage séquentiel |
| Regroupement par marque et par modèle | ≤ 40 ms | un passage avec index de groupe entier ; 5 250 accumulateurs de 8 valeurs en double précision = 336 Ko, tenant en cache L2 |
| Quantiles exacts des trois métriques sur la sélection entière | ≤ 50 ms | tri par comptage sur entiers bornés, `O(n + R)` |
| Quantiles exacts des trois métriques par groupe | ≤ 120 ms | tri par base LSD sur entiers, 4 passes, `O(n)` cumulé sur tous les groupes |
| Trois histogrammes + grille de densité | ≤ 20 ms | un passage, ≤ 676 + 78 compteurs |
| Détection M1 + M2 sur la sélection | ≤ 150 ms | M1 réutilise les quantiles déjà calculés ; M2 est deux résolutions d'un système 3×3 par cellule, plus deux passages sur `F` |
| Facettes et sélections dérivées | ≤ 90 ms | accumulation simultanée des compteurs de facette de tous les filtres de classe `R` dans le balayage de sélection (`EX-DATA-110bis`) |
| **Coût de calcul cumulé, tous postes synchrones** | **≈ 540 ms** | somme des postes ci-dessus |

**Ce chiffre n'est PAS le budget de réponse — précision du coordinateur (`R-A09`).** C'est le coût
de calcul cumulé à `N = 10⁶` si tous les postes étaient exécutés de façon synchrone avant le premier
affichage. Par la règle d'autorité `A-09`, les exigences de temps de réponse relèvent de
**l'annexe C** et d'elle seule : le budget opposable est `EX-NFR-5`, qui distingue deux postes —

- **recalcul des agrégats** : cible inchangée, **≤ 200 ms au 95ᵉ centile** ;
- **facettes et sélections dérivées** (le poste de 90 ms ci-dessus) : **différées d'au plus 100 ms**
  après l'affichage des chiffres principaux, leurs compteurs affichant `…` pendant l'écart.

**Motif de la séparation plutôt que du relèvement** : le stress-test avait établi que l'ajout du
poste de facettes portait le cumul de 450 à 540 ms, au-delà de la cible publiée. Relever la cible
pour que la mesure y entre aurait fait disparaître l'exigence en la satisfaisant par construction.
Différer les facettes préserve l'exigence *et* sert mieux l'usage : l'utilisateur voit d'abord les
chiffres qu'il est venu chercher. Le tableau ci-dessus reste utile comme modèle de coût — il dit où
part le temps — mais il ne fixe aucune cible.

**EX-DATA-110bis — facettes et sélections dérivées.** L'entité `FacetCount`
`{ snapshotId, selectionHash, filterId, code, count }` porte l'effectif d'une option de filtre.
`count` est l'effectif du **prédicat de la sélection privé de la totalité des prédicats du filtre
`filterId`**, augmenté du seul prédicat `filterId = code` : retirer une valeur laisse donc tomber
**toutes** les autres valeurs du même filtre, conformément à `EX-SCR-90`.
**Un seul balayage** : les compteurs de facette de tous les filtres de classe `R` sont accumulés
simultanément pendant le balayage de sélection, par la technique du « masque de prédicats moins
un » ; il est **interdit** de relancer un balayage par filtre ou par valeur.
Deux hachages dérivés sont définis et calculés dans ce même balayage :
• `selectionHashWithoutTaxonomy` — la sélection privée de tous les prédicats de taxonomie
(`make`, `mmmv`, `cat`, `mcat`, et la contrainte de route de l'écran B). C'est **la** sélection du
compteur `<n> offres` d'`EX-SCR-46`, et de lui seul.
• `selectionHashWithoutFilter(filterId)` — la sélection privée d'un filtre, base des `FacetCount`.
**Budget** : `EX-DATA-110` est complété d'un poste `facettes et sélections dérivées : 90 ms`, et le
total passe de 450 ms à **540 ms** à `N = 10⁶` ; à `N ≤ 10⁴` la règle de division par 100
d'`EX-DATA-113` s'applique inchangée.
`FacetCount` est **calculée**, jamais persistée : l'interdiction de précalculer une sélection
filtrée d'`EX-DATA-109` reste entière.

**EX-DATA-111 — quantiles exacts, jamais approchés.** Les trois métriques sont des entiers de
domaine borné (`price ∈ [1, 5·10⁶]`, `mileage ∈ [0, 1,5·10⁶]`, `year ∈ [1900, 2101]`). Les
quantiles sont donc calculés **exactement**, par tri par comptage pour la sélection entière et par
tri par base pour les groupes. Aucune approximation par histogramme, aucun t-digest, aucun
échantillonnage.
**Justification** : les deux familles d'algorithmes sont en `O(n)` sur des entiers bornés, donc
l'exactitude ne coûte rien de plus qu'une approximation, alors qu'un quantile approché rendrait
les invariants I1 à I8 invérifiables et ferait diverger deux implémentations correctes.

**EX-DATA-112 — mémoire de travail.** Tampons de comptage réutilisés entre appels et remis à zéro
sur la seule plage touchée. Le tampon de prix est un `Int32Array` alloué **sur la plage observée
du snapshot** : sa taille est `4 × (maxPriceObservé − minPriceObservé + 1)` octets, soit ≈ **4 Mo**
pour une plage observée de `10⁶ €` et **20 Mo au pire cas**, quand la plage observée couvre le
domaine entier `[1, 5·10⁶]` d'`EX-DATA-111`. Le tampon de kilométrage suit la même règle :
≈ **6 Mo** au pire cas (`1,5·10⁶ × 4`). Le tampon d'année : 808 octets.
**Enveloppe totale à `N = 10⁶`, pire cas** : 44 Mo de colonnes numériques et énumérées + 16 Mo
d'identifiants + **172 Mo de zone de chaînes** (`EX-DATA-121`, ≈ 180 octets par ligne) + 26 Mo de
tampons + 1,7 Mo d'agrégats de base + 1 Mo de référentiels + 13 Mo de cache ≈ **274 Mo**.
**Justification** : l'enveloppe tient avec une marge d'un **facteur 1,9** sous un budget d'onglet
de 512 Mo. La marge est suffisante pour le moteur de rendu et interdit toujours de conclure que la
borne haute de H5 oblige à une architecture serveur, mais elle ne laisse **pas** de place à un
second snapshot en mémoire — ce qui est la raison normative du « un seul snapshot actif à la
fois » de `ARB-49`. Le poste dominant est la zone de chaînes : c'est lui, et non les colonnes
numériques, qu'une optimisation devrait viser en premier (`listingUrl` étant reconstructible à
partir de `listingId` chez la plupart des sources).

**EX-DATA-113.** À `N ≤ 10⁴` (borne basse de H5), les budgets d'EX-DATA-110 sont divisés par 100 et
le total attendu est ≤ 10 ms : aucune stratégie particulière, aucun cache et aucune pagination
interne ne sont nécessaires. La conception est dimensionnée sur la borne haute et le cas bas en
découle.

## C.2 Clés, index et ordres

**EX-DATA-114 — clés primaires.**

| Entité | Clé primaire |
|---|---|
| `Snapshot` | `snapshotId` |
| `Listing` | `(snapshotId, listingId)` |
| `MakeAggregate` | `(snapshotId, selectionHash, makeId)` |
| `ModelAggregate` | `(snapshotId, selectionHash, makeId, modelId)` |
| `DistributionBucket` | `(snapshotId, selectionHash, metric, index)` |
| `SelectionStats` | `(snapshotId, selectionHash)` |
| `OutlierVerdict` | `(snapshotId, selectionHash, listingId, method)` |
| `DensityCell` | `(snapshotId, selectionHash, yearBinIndex, mileageBinIndex)` |
| `Make` | `makeId` · `Model` : `(makeId, modelId)` |
| `EnumValue` | `(vocabulary, code)` |
| `PostalRegionRange` | `(countryCode, lo)` avec contrainte de non-recouvrement des plages |

**EX-DATA-115 — index de la table `Listing`.**

| Index | Colonne(s) | Forme physique | Usage | Coût à `N = 10⁶` |
|---|---|---|---|---|
| `PK_LISTING` | `listingId` | table de hachage UUID → indice de ligne | forage d'un point du nuage vers son deeplink | ≈ 24 Mo |
| `IDX_MAKE` | `makeId` | `Int32Array` d'indices de ligne triée, plus un tableau d'offsets indexé par `makeId` | élagage du mode 1 | 4 Mo + 1,2 Ko |
| `IDX_MODEL` | `(makeId, modelId)` | idem, offsets sur clé composite | élagage du mode 2 | 4 Mo + 40 Ko |
| `IDX_PRICE_SORTED` | `priceEur` | `Int32Array` d'indices de ligne triée par prix croissant | bornes de prix, top-N, quantiles de la sélection vide | 4 Mo |
| `BITSET_FUEL`, `BITSET_BODY`, `BITSET_REGION`, `BITSET_COUNTRY`, `BITSET_TRANSMISSION` | colonne énumérée | un bitset par valeur du vocabulaire, 1 bit par ligne | intersection des filtres énumérés sans balayage | 125 Ko par valeur, ≈ 5,4 Mo au total |

**EX-DATA-115bis — index de la taxonomie.** La taxonomie statique (`Make`, `Model`, `EX-DATA-105`) porte en outre un
index par **`bodyTypes`** : pour chaque code de `KYCAR_BODY_TYPE`, l'ensemble des couples
`(makeId, modelId)` dont `Model.bodyTypes` contient ce code. Cet index est la **condition** de la
classe `R` du filtre primaire `Carrosserie` sur l'écran A (`EX-SCR-59`, `EX-SCR-221`) : sans lui,
le filtre `body` exigerait un rechargement et relèverait de la classe `T`. Un `Model` dont
`bodyTypes` est le tableau vide n'apparaît dans **aucune** entrée de cet index et ne satisfait
donc aucun prédicat `body`.

**EX-DATA-116 — stratégie d'élagage.** Si la sélection contraint `makeId` ou `(makeId, modelId)`,
le balayage part de `IDX_MAKE` ou `IDX_MODEL` au lieu de parcourir les `N` lignes. Le mode 2 est
alors en `O(m)`, `m` étant l'effectif du modèle — de l'ordre de 1 281 pour Opel Corsa en Belgique,
soit un facteur d'élagage supérieur à 700 par rapport à un balayage complet.
**Justification** : le mode 2 est par définition toujours filtré sur un couple marque/modèle, donc
l'élagage s'applique à 100 % de ses recalculs ; sans lui, le budget de 540 ms serait consommé pour
analyser 1 281 annonces.

**EX-DATA-117 — ce qui doit être trié et ce qui doit être groupé.**

| Besoin | Clé de tri ou de groupe | Ordre |
|---|---|---|
| Cartes-marques du mode 1 | groupe `makeId` ; tri `(listingCount desc, makeName asc, makeId asc)` | EX-DATA-70 |
| Zones-modèles d'une carte | groupe `(makeId, modelId)` ; tri `(listingCount desc, modelName asc, modelId asc)`, `modelId = 0` en dernier | EX-DATA-72 |
| Bins d'un histogramme | tri `index` croissant, bin de débordement bas en tête, bin de débordement haut en fin | EX-DATA-75 |
| Liste d'opportunités | tri `(opportunityScore desc, priceEur asc, listingId asc)` | EX-DATA-94 |
| Échantillonnage du nuage | tri `listingId` croissant octet à octet | EX-DATA-101 |
| Grille de densité | groupe `(yearBinIndex, mileageBinIndex)` ; tri lexicographique de ce couple | EX-DATA-102 |
| Quantiles | tri croissant de la métrique, par tri par comptage ou par base | EX-DATA-111 |

**EX-DATA-118.** Tout ordre de tri publié par le modèle d'agrégation est **total** : le dernier
critère de départage est toujours une clé unique (`makeId`, `modelId` ou `listingId`), de sorte
qu'aucun ordre ne dépend de la stabilité de l'algorithme de tri employé.
**Justification** : un tri non total rendrait l'ordre d'affichage dépendant de l'implémentation du
tri de la plate-forme, donc non reproductible entre deux navigateurs et non testable par
comparaison de sortie.

## C.3 Disposition physique de la table `Listing`

**EX-DATA-119.** `Listing` est stockée en **colonnes typées**, une par champ, et non en tableau
d'objets.
**Justification** : un balayage de sélection lit 3 à 12 champs sur 82 ; en disposition
ligne-par-ligne il traverserait l'intégralité des 82 champs de chaque annonce, soit un facteur 7 à
27 de lecture mémoire inutile, ce qui rendrait le budget de 60 ms d'EX-DATA-110 inatteignable.

| Colonne | Type physique | Octets/ligne |
|---|---|---:|
| `listingId` | `Uint8Array` de 16 octets par ligne (UUID binaire) | 16 |
| `priceEur` | `Int32Array`, sentinelle `−1` pour inconnu | 4 |
| `mileageKm` | `Int32Array`, sentinelle `−1` | 4 |
| `firstRegistrationYearMonth` | `Int32Array` encodé `12·année + (mois−1)`, sentinelle `−1` | 4 |
| `modelId` | `Int32Array`, `0` pour non résolu | 4 |
| `makeId` | `Int16Array` | 2 |
| `powerKw`, `co2EmissionsGPerKm ×10`, `consumptionCombinedL100Km ×10`, `electricRangeKm` | 4 × `Int16Array`, sentinelle `−1` | 8 |
| `modelYear` | `Int16Array`, sentinelle `−1` | 2 |
| `fuelCategory`, `bodyType`, `transmission`, `drivetrain`, `offerType`, `usageState`, `sellerType`, `regionCode`, `countryCode`, `priceStatus`, `priceEvaluationCategory`, `adTier`, `bodyColor`, `upholsteryType`, `euEmissionStandard`, `doorCount`, `seatCount`, `previousOwnerCount`, `imageCount` | 19 × `Uint8Array`, sentinelle `255` | 19 |
| drapeaux booléens et `ingestFlags` | 2 × `Uint16Array` de bits | 4 |
| **Total colonnes numériques et énumérées** | | **≈ 71** |
| `listingUrl`, `modelVersionRaw`, `modelVersionClean`, `fuelSourceLabelRaw`, `trimTokens` | zone de chaînes contiguë + `Uint32Array` d'offsets | ≈ 180 en moyenne |

**EX-DATA-120.** Les colonnes numériques utilisent une **sentinelle typée** pour l'inconnu
(`−1` pour les grandeurs positives, `255` pour les énumérations sur un octet), jamais `0` ni
`null`. Toute lecture d'une colonne teste la sentinelle avant d'utiliser la valeur.
**Justification** : `0` est une valeur légitime pour `mileageKm`, `co2EmissionsGPerKm` et
`previousOwnerCount` — l'employer comme marqueur d'inconnu créerait exactement la confusion que les
règles EX-DATA-38 et EX-DATA-49 cherchent à éviter, et un tableau de `null` interdirait les
tableaux typés donc le budget de performance.

**EX-DATA-121.** Les champs textuels (`listingUrl`, les trois champs de version, `fuelSourceLabelRaw`)
sont stockés hors des colonnes numériques, dans une zone contiguë adressée par offsets, et **ne
sont jamais lus pendant un balayage de sélection**, sauf si un filtre par mot-clé est posé.
**Justification** : ces cinq champs représentent à eux seuls plus de deux fois le volume de toutes
les colonnes numériques réunies ; les tenir à l'écart du chemin chaud est ce qui rend le budget de
balayage atteignable.

## C.4 Ce que le modèle ne contient pas

**EX-DATA-122.** Aucune entité, aucune colonne et aucun index ne porte de champ de la liste E1 à
E14 de § A.7. En particulier, il n'existe **aucun** index par vendeur, par code postal exact, par
ville ni par coordonnées géographiques — l'absence d'index est ici une conséquence mécanique de
l'absence de colonne, pas une décision d'optimisation.
**Justification** : R3 qualifie la contrainte de structurelle ; un index géographique fin serait la
preuve qu'une colonne interdite existe quelque part.

**EX-DATA-123.** Le modèle ne contient aucune entité de contact, de message, de mise en relation
ni de transaction.
**Justification** : `00-CONTEXT.md` exclut explicitement que l'application vende quoi que ce soit
ou mette en relation acheteur et vendeur, et une entité de ce type serait le premier pas vers la
republication que la position juridique du projet écarte.

**EX-DATA-123bis — colonnes d'export, par périmètre.** Encodage UTF-8 avec BOM, séparateur
point-virgule (`EX-CRUD-14`). Une valeur `INCONNU` s'écrit **cellule vide**, jamais `0` et jamais
`null`. Les nombres sont écrits avec la virgule décimale et sans séparateur de milliers. Les
arrondis sont ceux de l'écran (`EX-DATA-6`, `ARB-21`).
**Trois lignes de métadonnées** précèdent l'en-tête, chacune sur une seule cellule :
`# snapshot;<snapshotId>;<capturedAt ISO-8601>;<sourceKind>` ·
`# filtres;<chaîne de requête canonique complète, EX-NAV-9>` ·
`# couverture;<sampleCoverage ou NON_APPLICABLE>;<metricCoverage de la métrique principale>`.
**Agrégats mode 1**, une ligne par couple marque/modèle affiché :
`marque;modele;offres;prix_median;prix_p5;prix_p95;prix_min;prix_max;annee_min;annee_max;km_min;km_max;n_prix;n_annee;n_km`.
**Buckets mode 2**, une ligne par bucket : `graphe;index;borne_basse;borne_haute;ouvert;effectif;part`.
**Points de nuée** : `listing_id;prix;annee_mois;km;carburant;puissance_kw;prix_attendu;ecart_pct;score_opportunite;drapeaux_outlier;cellule;cellule_n;url`.
**Annonces** : les colonnes des points de nuée, plus `modele_version;type_vendeur;pays;region;etat_usage`.
**Nom de fichier** : `kycar_<perimetre>_<snapshotId>_<AAAAMMJJ>.csv`.

## C.5 Récapitulatif chiffré

| Grandeur | Valeur |
|---|---|
| Champs au dictionnaire principal | **82** |
| Champs exclus par conception | **21**, dont **14 au titre de R3** |
| Vocabulaires nommés | **27** |
| Entités | **13** |
| Exigences `EX-DATA-*` | **139** (127 d'origine + 12 créées par l'arbitrage du stress-test) |
| Méthodes de détection d'outlier | **2 détecteurs (M1, M2) + 1 contrôle externe (M3)** |
| Invariants exécutables du moteur d'agrégation | **8** |
| Budget de recalcul complet de page à `N = 10⁶` | **≤ 540 ms** |
| Enveloppe mémoire à `N = 10⁶`, pire cas | **≈ 274 Mo**, marge de facteur 1,9 sous 512 Mo |

---

# Annexe D — Décisions à soumettre au stress-test de la phase 2.2

**EX-DATA-124.** Les décisions suivantes sont prises par cet agent, sont défendables, et sont
**identifiées comme contestables** : elles doivent être attaquées nommément en phase 2.2 par
`st-ambiguity` et `st-adversarial`.

| # | Décision | Exigence | Angle d'attaque attendu |
|---|---|---|---|
| D-1 | La fourchette affichée d'une marque ou d'un modèle est `[p05, p95]` et non `[min, max]` | EX-DATA-69 | Un utilisateur qui cherche l'affaire cherche justement le minimum ; masquer le minimum brut au second plan peut cacher exactement l'annonce qu'il veut voir. La contre-lecture est qu'une carte doit afficher `[min, max]` et laisser la détection d'outlier trier le bon grain. |
| D-2 | Une annonce de prix inférieur à 250 € est conservée dans les effectifs mais exclue des statistiques de prix | EX-DATA-19 | Le seuil est un chiffre absolu sur un marché où existent des épaves à 200 € réellement vendues ; un seuil relatif (par exemple 5 % de la médiane de la cellule) serait défendable et donnerait un autre résultat. |
| D-3 | Les cellules de comparaison d'outlier sont prises dans la sélection filtrée `Σ`, non dans le snapshot `S` | EX-DATA-86 | Deux jeux de filtres différents donnent alors deux verdicts différents pour la même annonce, ce qui peut se lire comme une incohérence plutôt que comme une contextualisation. |

**EX-DATA-125.** Trois autres décisions sont signalées comme moins contestables mais non
triviales : le seuil de 12 annonces pour M1 et pour `lowConfidence` (EX-DATA-80, EX-DATA-88), le
plafond de 5 000 points du nuage (EX-DATA-100), et le choix de `firstRegistrationYear` plutôt que
`modelYear` comme axe année unique (EX-DATA-25).

**EX-DATA-126.** Deux éléments sont livrés avec une dette explicite, à solder avant le gel v1.0 :
la table code postal belge → province, marquée `[EXTRAPOLÉ]` et à confronter au fichier officiel
(EX-DATA-53), et la table de correspondance carburant création → recherche, marquée `[EXTRAPOLÉ]`
au titre de la décision V2 non confirmée (EX-DATA-10).

**EX-DATA-127.** Trois champs restent `[À CONFIRMER]` quant à leur porteur exact dans la donnée
observée : `offerType` (porteur probable `listings[].type`, EX-DATA-25 du dictionnaire),
`vehicleType` (même porteur candidat, § A.2 # 6) et le domaine de valeurs de
`publicationState` (§ A.4 # 28). Aucun des trois n'est utilisé comme clé d'agrégation, de sorte
qu'une confirmation contraire n'invalide aucun agrégat.
