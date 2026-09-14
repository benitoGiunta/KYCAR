# REF-filters — Catalogue des filtres de recherche AutoScout24 (voitures d'occasion)

> Document de référence de la phase 2.0 du plan `PLAN-2-app-build.md`. Spécification source du bandeau de filtres KYCAR.
> Règle R6 : ce catalogue est **relevé**, pas inventé. Chaque valeur porte son niveau de preuve.

| | |
|---|---|
| Marketplaces relevés | `autoscout24.be` (fr-BE) et `autoscout24.com` (en-GB) |
| Build front relevé | `as24-search-funnel_main-20260904153933` |
| Date du relevé | 2026-09-06 |
| Filtres documentés | **101** entrées, **100** paramètres d'URL distincts |
| Fichier de données | `data/reference/filters.json` |

---

## Méthode et provenance

### Principe

Le front de recherche AutoScout24 est une application Next.js (`as24-search-funnel`). Trois gisements de vérité ont été exploités, dans cet ordre :

1. **`<script id="__NEXT_DATA__">` de la page de résultats** — porte `props.pageProps.taxonomy`, qui contient les **domaines de valeurs** complets de chaque énumération (code technique + libellé localisé), ainsi que `props.pageProps.translations` (libellés d'interface) et `props.pageProps.marketplaceFeatureToggles.filters` (quels filtres sont actifs sur quel marketplace).
2. **Le bundle JavaScript, chunk `5007`** — porte la **table de sérialisation filtre → paramètre d'URL** (module webpack `55200`, objet `t5`), les **valeurs par défaut** (module `95983`, objet `Wg`) et la **fonction de sérialisation** (module `56702`, fonction `C`). C'est cette table qui donne le nom réel de chaque paramètre d'URL — elle n'est pas devinée.
3. **Vérification empirique par requête réelle** — le marketplace a `togglingInfo['enable-404-for-invalid-parameter'] = true`, donc **un paramètre inconnu fait répondre 404**. Une requête HTTP 200 dont le `pageQuery` renvoie les paramètres vaut donc double preuve : nom valide *et* paramètre effectivement pris en compte côté serveur.

### Requêtes effectuées (15 au total vers autoscout24, budget respecté)

| # | Requête | Ce qu'elle a produit |
|---|---|---|
| 1 | `GET https://www.autoscout24.be/fr/lst?atype=C&cy=B&desc=0&search_id=1&sort=standard&ustate=N%2CU` | HTTP 200, 820 622 octets. `__NEXT_DATA__` (243 051 octets) : 72 clés de `taxonomy`, 558 clés de `translations`, `marketplaceFeatureToggles.filters`, `interlinking`, `recommendedFiltersArgs`. **120 779 résultats** annoncés pour la Belgique. |
| 2-5 | `GET .../chunks/pages/lst-609f097e4cd4f49b.js`, `.../8511-…js`, `.../9713-…js`, `.../9278-…js` | Chunks trop petits — aucun mapping. Cadrage négatif utile : le chunk `lst` n'est qu'un stub de code-splitting listant ses dépendances `[9713,585,2239,1362,2791,5007,2653,4629,8465,1709,8511,4406,4300,4592,4914,2312,1883,2888,9774,179]`. |
| 6-13 | `GET .../chunks/pages/_app-6a360044f3d26f11.js` + `4300`, `4629`, `8465`, `5007`, `2653`, `4592`, `4914` (un seul `curl --parallel`) | **Chunk `5007` = la table de sérialisation complète.** `_app` = les constantes (`64538.Hy = 20` taille de page, `jV = "standard"` tri par défaut, `Yp = "0"` sens par défaut). |
| 14 | `GET https://www.autoscout24.be/fr/lst?` + **66 paramètres** posés simultanément | **HTTP 200**, 528 335 octets. `pageQuery` a renvoyé **63 des 66 paramètres repris en écho**. `zip=1000` a été géocodé par le serveur en `lat=50.84553&lon=4.3557`. Titre généré : « 0 résultats pour voitures xdrive boîte manuelle occasion à Bruxelles » — preuve que les filtres sont appliqués et non ignorés. |
| 15 | `GET https://www.autoscout24.com/lst?atype=C&cy=D&damaged_listing=include&mmmv=54%7C1409%7C%7C&ustate=N%2CU&sort=age&desc=1&size=20&powertype=hp&powerfrom=90&custtype=P&region=&lstagr=private` | **HTTP 200**. Libellés **anglais** de toutes les énumérations. `mmmv=54|1409||` accepté et **`taxonomy.models['54']` peuplé** → preuve de la dépendance marque → modèle. `lstagr=private` accepté. `damaged_listing` et `region=` **rejetés** (absents de `pageQuery`). |

### Ce qui a échoué ou n'a rien donné

- **La recherche documentaire tierce est inutilisable pour ce livrable.** Deux recherches web (Apify, Scrapfly, ScrapingBee, Piloterr, scrape.do) ne renvoient que des noms de paramètres d'*acteurs de scraping* (`priceFrom`, `yearFrom`, `mileageTo`, `fuelType`, `condition`…) qui sont les entrées de leurs propres schémas, **pas** les paramètres d'URL d'AutoScout24. Aucune source tierce consultée ne documente correctement `zipr`, `uph`, `ptype`, `sealor`, `pe_category`, `ensticker` ou `lsyeinmifrom`. Le catalogue ci-dessous ne doit donc **rien** à ces sources : il vient à 100 % du front AutoScout24 lui-même. Conséquence : **aucun filtre n'est coté `DOCUMENTÉ`** — ils sont soit relevés, soit partiellement relevés.
- **Un premier `grep` insensible à la casse sur le HTML a produit un faux positif** (il matchait les clés camelCase de `taxonomy` comme `priceFrom`, non les paramètres d'URL lowercase). Les noms de paramètres n'apparaissent nulle part dans le HTML servi — d'où le passage obligé par le bundle JS.
- **`taxonomy.models`, `modelGroups`, `modelLines`, `modelVariants`, `modelGenerations`, `motorTypes`, `trimLines` sont vides** sur une recherche sans marque. C'est la dépendance décrite plus bas, pas une lacune du relevé.
- **`damaged_listing` n'a pu être activé sur aucun des deux marketplaces** (BE et .com le rejettent tous les deux : `newAccidentFilter=false`, `supportsDamagedOption=false`).
- **Aucun compte créé, aucun identifiant saisi** (règle R2).

### Règles transverses relevées (elles s'appliquent à tout le catalogue)

| Règle | Contenu | Preuve |
|---|---|---|
| **Multi-valeurs** | **Une seule occurrence du paramètre, valeurs jointes par une virgule.** Jamais de pipe, jamais de répétition du paramètre. La virgule est encodée `%2C`. | Chunk `5007`, module `56702`, fonction `C` : `("number[]"===a.type\|\|"string[]"===a.type)&&Array.isArray(i)?i.length&&(r[a.name]=i.join(",")):i&&(r[a.name]=String(i))`. Confirmé par l'écho `fuel="B,D"`, `body="5,6"`, `eq="5,23,37"`. |
| **Exception multi-valeurs** | Le paramètre **legacy `mmm`** est le seul à être **répété** : `&mmm=…&mmm=…`. | Chunk `5007`, fonction `N` : `` `&mmm=${t.join("&mmm=")}` ``. |
| **Booléens** | Sérialisés via `String(valeur)`. Valeurs reprises en écho par le serveur : `1` (transmise telle quelle) et `true` (`hasleasing`). Un booléen faux n'est **pas** émis. | Même fonction `C` ; écho `pageQuery`. |
| **Omission des défauts** | Un filtre à sa valeur par défaut n'est pas émis dans l'URL. | Objet `Wg` (module `95983`) comparé au `pageQuery` d'une recherche vierge. |
| **Paramètre invalide** | Le serveur répond **404**. | `togglingInfo['enable-404-for-invalid-parameter'] = true`. |
| **Paramètres toujours présents** | `atype`, `cy`, `ustate`, `sort`, `desc`, `powertype`, `pricetype`, `show_nfm`, `query_id`, `tier_rotation` sont injectés par le serveur même sur une recherche vierge. | `pageQuery` de la requête 1. |

---

## Tableau de synthèse

Niveaux de preuve : `RELEVÉ` = paramètre, type et domaine lus dans une source AutoScout24 réelle · `RELEVÉ-PARTIEL` = paramètre relevé mais domaine incomplet ou comportement non confirmé · `DOCUMENTÉ` = source tierce uniquement (aucun cas) · `[EXTRAPOLÉ]` = hypothèse.

| # | Filtre | Paramètre d'URL | Type | Cardinalité | Défaut | Dépendance | Preuve |
|---|---|---|---|---|---|---|---|
| 1 | Type de véhicule / *Vehicle type* | `atype` | énumération simple | 1 | `C` | — | RELEVÉ |
| 2 | Marque / Modèle / Version / *Make / Model / Version* | `mmmv` | structuré multi-valeurs | n (séparateur `,`) | vide (trois barres verticales) | — | RELEVÉ |
| 3 | Catégorie taxonomique (nouvelle taxonomie) / *Taxonomy category* | `cat` | structuré multi-valeurs | n (séparateur `,`) | — | `mmmv` | RELEVÉ |
| 4 | Catégorie modèle (nouvelle taxonomie) / *Model category* | `mcat` | structuré multi-valeurs | n (séparateur `,`) | — | `cat` | RELEVÉ |
| 5 | Version / finition / *Version / trim* | `version0` | texte libre | 1 | — | `mmmv` | RELEVÉ |
| 6 | Type d'annonce / état du véhicule / *Vehicle condition / offer type* | `offer` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 7 | Recherche par mots-clés / *Keyword search* | `kwd` | texte libre | 1 | — | — | RELEVÉ |
| 8 | Prix de / *Price from* | `pricefrom` | intervalle (borne min) | 1 | — | — | RELEVÉ |
| 9 | Prix à / *Price to* | `priceto` | intervalle (borne max) | 1 | — | — | RELEVÉ |
| 10 | Base d'affichage du prix / *Price display basis* | `pricetype` | énumération simple | 1 | `public` | — | RELEVÉ-PARTIEL |
| 11 | TVA déductible / récupérable / *VAT deductible* | `vatded` | booléen | 0-1 | `false` | — | RELEVÉ |
| 12 | SuperDeal / *SuperDeal* | `superdeal` | booléen | 0-1 | — | — | RELEVÉ |
| 13 | Évaluation du prix / *Price evaluation* | `pe_category` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 14 | Mensualité de financement de / *Finance rate from* | `financeratefrom` | intervalle (borne min) | 1 | — | — | RELEVÉ |
| 15 | Mensualité de financement à / *Finance rate to* | `financerateto` | intervalle (borne max) | 1 | — | — | RELEVÉ |
| 16 | Offre de leasing disponible / *Leasing offer available* | `hasleasing` | booléen | 0-1 | — | — | RELEVÉ |
| 17 | Loyer de leasing de / *Leasing rate from* | `leasingratefrom` | intervalle (borne min) | 1 | — | `hasleasing` | RELEVÉ |
| 18 | Loyer de leasing à / *Leasing rate to* | `leasingrateto` | intervalle (borne max) | 1 | — | `hasleasing` | RELEVÉ |
| 19 | Durée de leasing de / *Leasing duration from* | `lsdufrom` | intervalle (borne min) | 1 | — | `hasleasing` | RELEVÉ |
| 20 | Durée de leasing à / *Leasing duration to* | `lsduto` | intervalle (borne max) | 1 | — | `hasleasing` | RELEVÉ |
| 21 | Kilométrage annuel inclus (min) / *Yearly included mileage from* | `lsyeinmifrom` | intervalle (borne min) | 1 | — | `hasleasing` | RELEVÉ |
| 22 | Bonus de reprise (leasing) / *Trade-in bonus* | `lstrinbo` | booléen | 0-1 | — | `hasleasing` | RELEVÉ |
| 23 | Bonus écologique (leasing) / *Environment bonus* | `lsenbo` | booléen | 0-1 | — | `hasleasing` | RELEVÉ |
| 24 | Disponible immédiatement (leasing) / *Available now* | `lsavno` | booléen | 0-1 | — | `hasleasing` | RELEVÉ |
| 25 | Groupe cible du leasing / *Leasing target group* | `lstagr` | énumération simple | 1 | — | `hasleasing` | RELEVÉ-PARTIEL |
| 26 | Prime à l'achat / bonus étatique / *Government bonus* | `efeg` | booléen | 0-1 | `false` | — | RELEVÉ |
| 27 | Reprise de mon véhicule / *Trade-in* | `tradeIn` | booléen | 0-1 | — | — | RELEVÉ |
| 28 | Kilométrage de / *Mileage from* | `kmfrom` | intervalle (borne min) | 1 | — | — | RELEVÉ |
| 29 | Kilométrage à / *Mileage to* | `kmto` | intervalle (borne max) | 1 | — | — | RELEVÉ |
| 30 | Première immatriculation de / *First registration from* | `fregfrom` | intervalle (borne min) | 1 | — | — | RELEVÉ |
| 31 | Première immatriculation à / *First registration to* | `fregto` | intervalle (borne max) | 1 | — | — | RELEVÉ |
| 32 | Année-modèle de / *Model year from* | `modelyearfrom` | intervalle (borne min) | 1 | — | — | RELEVÉ |
| 33 | Année-modèle à / *Model year to* | `modelyearto` | intervalle (borne max) | 1 | — | — | RELEVÉ |
| 34 | Carburant / *Fuel type* | `fuel` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 35 | Unité de puissance / *Power unit* | `powertype` | énumération simple | 1 | `kw` | — | RELEVÉ |
| 36 | Puissance de / *Power from* | `powerfrom` | intervalle (borne min) | 1 | — | `powertype` | RELEVÉ |
| 37 | Puissance à / *Power to* | `powerto` | intervalle (borne max) | 1 | — | `powertype` | RELEVÉ |
| 38 | Cylindrée de / *Engine size from* | `ccmfrom` | intervalle (borne min) | 1 | — | — | RELEVÉ |
| 39 | Cylindrée à / *Engine size to* | `ccmto` | intervalle (borne max) | 1 | — | — | RELEVÉ |
| 40 | Nombre de cylindres / *Cylinders* | `cylinders` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 41 | Transmission (roues motrices) / *Drivetrain* | `dtrain` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 42 | Boîte de vitesses / *Transmission* | `gear` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 43 | Pour les nouveaux conducteurs / *For new drivers* | `newdriver` | booléen | 0-1 | — | — | RELEVÉ |
| 44 | Carrosserie / *Body type* | `body` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 45 | Nombre de portes (min) / *Doors from* | `doorfrom` | intervalle (borne min) | 1 | — | — | RELEVÉ |
| 46 | Nombre de portes (max) / *Doors to* | `doorto` | intervalle (borne max) | 1 | — | — | RELEVÉ |
| 47 | Nombre de places (min) / *Seats from* | `seatsfrom` | intervalle (borne min) | 1 | — | — | RELEVÉ |
| 48 | Nombre de places (max) / *Seats to* | `seatsto` | intervalle (borne max) | 1 | — | — | RELEVÉ |
| 49 | Couleur extérieure / *Exterior colour* | `bcol` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 50 | Type de peinture / *Paintwork* | `ptype` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 51 | Couleur intérieure / *Interior colour* | `icol` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 52 | Revêtement / sellerie / *Upholstery* | `uph` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 53 | Norme Euro / classe d'émission / *Emission class* | `emclass` | énumération simple | 1 | — | — | RELEVÉ |
| 54 | Vignette environnementale / *Emission sticker* | `ensticker` | énumération simple | 1 | `1` | — | RELEVÉ |
| 55 | Propriété de la batterie / *Battery ownership* | `bot` | énumération simple | 1 | — | `fuel` | RELEVÉ |
| 56 | Autonomie électrique de / *Electric range from* | `erfrom` | intervalle (borne min) | 1 | — | `fuel` | RELEVÉ |
| 57 | Autonomie électrique à / *Electric range to* | `erto` | intervalle (borne max) | 1 | — | `fuel` | RELEVÉ |
| 58 | Équipement / *Equipment* | `eq` | énumération multi-valeurs | n (séparateur `,`) | (vide) | — | RELEVÉ |
| 59 | Véhicule accidenté (BE/EU) / *Damaged vehicle (BE/EU)* | `ustate` | énumération simple | 1 | `N,U` | — | RELEVÉ |
| 60 | Véhicule accidenté (variante récente) / *Damaged listing* | `damaged_listing` | énumération simple | 1 | `exclude` | — | RELEVÉ-PARTIEL |
| 61 | Nombre de propriétaires précédents / *Previous owners* | `prevownersid` | énumération simple | 1 | — | — | RELEVÉ |
| 62 | Label / programme d'occasion certifiée / *Seal / certified pre-owned programme* | `sealor` | énumération multi-valeurs | n (séparateur `,`) | (vide) | `mmmv` | RELEVÉ |
| 63 | Type de vendeur / *Seller type* | `custtype` | énumération simple | 1 | — | — | RELEVÉ |
| 64 | Identifiant du vendeur / *Dealer / customer id* | `cid` | texte libre | 1 | — | — | RELEVÉ |
| 65 | Pays / *Country* | `cy` | énumération multi-valeurs | n (séparateur `,`) | — | — | RELEVÉ |
| 66 | Ville / code postal / *City / postcode* | `zip` | géographique | 1 | — | — | RELEVÉ |
| 67 | Rayon / *Radius* | `zipr` | énumération simple | 1 | — | `zip` | RELEVÉ |
| 68 | Latitude / *Latitude* | `lat` | numérique | 1 | — | `zip` | RELEVÉ |
| 69 | Longitude / *Longitude* | `lon` | numérique | 1 | — | `zip` | RELEVÉ |
| 70 | Région / province / *Region / province* | `region` | texte libre | 1 | — | `cy` | RELEVÉ-PARTIEL |
| 71 | Inclure les véhicules au-delà de la frontière / *Cross-border* | `crossborder` | booléen | 0-1 | `false` | `zip`, `zipr` | RELEVÉ |
| 72 | Achat en ligne (Smyle / OCS) / *Buy online* | `ot_osc` | booléen | 0-1 | — | — | RELEVÉ |
| 73 | Annonces achat-en-ligne / *Online-checkout listings* | `ocs_listing` | énumération simple | 1 | — | — | RELEVÉ |
| 74 | Offres avec livraison (portée max) / *Deliverable insertion* | `dlv_max` | texte libre | 1 | — | — | RELEVÉ-PARTIEL |
| 75 | Élargir aux offres livrables / *Deliverable tail* | `dlv_tail` | booléen | 0-1 | — | — | RELEVÉ |
| 76 | En ligne depuis / *Online since* | `adage` | énumération simple | 1 | — | — | RELEVÉ |
| 77 | Critère de tri / *Sort criterion* | `sort` | énumération simple | 1 | `standard` | — | RELEVÉ |
| 78 | Sens du tri / *Sort direction* | `desc` | énumération simple | 1 | `0` | `sort` | RELEVÉ |
| 79 | Page / *Page* | `page` | numérique | 1 | `1` | — | RELEVÉ |
| 80 | Taille de page / *Page size* | `size` | numérique | 1 | `20` | — | RELEVÉ |
| 81 | Nombre de lits (min) / *Beds from* | `bedsfrom` | intervalle (borne min) | 1 | — | `atype` | RELEVÉ |
| 82 | Nombre de lits (max) / *Beds to* | `bedsto` | intervalle (borne max) | 1 | — | `atype` | RELEVÉ |
| 83 | Nombre de lits / *Number of beds* | `beds` | énumération multi-valeurs | n (séparateur `,`) | (vide) | `atype` | RELEVÉ |
| 84 | Type de lit / *Bed type* | **aucun** | énumération multi-valeurs | n (séparateur `,`) | (vide) | `atype` | RELEVÉ-PARTIEL |
| 85 | Nombre d'extensions (slide-out) / *Slide-outs* | `sout` | énumération multi-valeurs | n (séparateur `,`) | (vide) | `atype` | RELEVÉ |
| 86 | Empattement de / *Wheelbase from* | `wbfrom` | intervalle (borne min) | 1 | — | `atype` | RELEVÉ |
| 87 | Empattement à / *Wheelbase to* | `wbto` | intervalle (borne max) | 1 | — | `atype` | RELEVÉ |
| 88 | Poids à vide de / *Empty weight from* | `ewfrom` | intervalle (borne min) | 1 | — | `atype` | RELEVÉ |
| 89 | Poids à vide à / *Empty weight to* | `ewto` | intervalle (borne max) | 1 | — | `atype` | RELEVÉ |
| 90 | Longueur totale de / *Total length from* | `totlenfrom` | intervalle (borne min) | 1 | — | `atype` | RELEVÉ |
| 91 | Longueur totale à / *Total length to* | `totlento` | intervalle (borne max) | 1 | — | `atype` | RELEVÉ |
| 92 | Heures de fonctionnement de / *Engine hours from* | `ehfrom` | intervalle (borne min) | 1 | — | `atype` | RELEVÉ |
| 93 | Heures de fonctionnement à / *Engine hours to* | `ehto` | intervalle (borne max) | 1 | — | `atype` | RELEVÉ |
| 94 | Nombre d'essieux / *Number of axles* | `axlenumber` | numérique | 1 | — | `atype` | RELEVÉ |
| 95 | Poids total autorisé de / *Gross weight from* | `grossweightfrom` | intervalle (borne min) | 1 | — | `atype` | RELEVÉ |
| 96 | Poids total autorisé à / *Gross weight to* | `grossweightto` | intervalle (borne max) | 1 | — | `atype` | RELEVÉ |
| 97 | [technique] Nouveau modèle de financement / *[technical] new finance model* | `show_nfm` | booléen | 0-1 | `true` | — | RELEVÉ |
| 98 | [technique] Identifiant de recherche / *[technical] search id* | `search_id` | texte libre | 1 | — | — | RELEVÉ |
| 99 | [technique] Identifiant de requête / *[technical] query id* | `query_id` | texte libre | 1 | — | — | RELEVÉ |
| 100 | [technique] Rotation des paliers d'annonces / *[technical] tier rotation* | `tier_rotation` | booléen | 0-1 | `true` | — | RELEVÉ |
| 101 | [legacy] Marque/modèle (paramètre répété) / *[legacy] make/model (repeated param)* | `mmm` | structuré multi-valeurs | n (séparateur `,`) | — | — | RELEVÉ |

**Répartition** : 95 `RELEVÉ`, 6 `RELEVÉ-PARTIEL`, 0 `DOCUMENTÉ`, 0 `[EXTRAPOLÉ]`.

**Répartition par catégorie** : Véhicule de base 7 · Prix, financement et leasing 20 · Kilométrage 2 · Immatriculation et année 4 · Motorisation 10 · Carrosserie et habitacle 9 · Écologie et électrique 5 · Équipements 1 · État et historique 4 · Vendeur 2 · Géographie 7 · Divers, achat en ligne et fraîcheur 5 · Tri et pagination 4 · Filtres propres aux autres types de véhicules (atype ≠ C) 16 · Paramètres techniques (non-filtres) 5.

---

## Fiches détaillées par filtre

### Véhicule de base

#### `atype` — Type de véhicule

- **Libellé FR** : Type de véhicule · **Libellé EN** : Vehicle type
- **Identifiant interne AS24** : `articleType`
- **Type** : énumération simple
- **Valeur par défaut** : `C` · **obligatoire**
- **Dépendances** : aucune
- **Domaine de valeurs** (10 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `C` | Voiture | Car |
  | `B` | Moto | Bike |
  | `N` | Caravane / camping-car | Caravan |
  | `X` | Utilitaire | Transporter |
  | `L` | Remorque | Trailer |
  | `O` | Bateau | Boats |
  | `W` | Engin nautique | Watercraft |
  | `S` | Motoneige | Snowmobiles |
  | `E` | Engin de chantier | Heavy equipment |
  | `A` | Engin agricole | Farm equipment |

- **Remarque** : Détermine tout le reste du domaine de filtres. KYCAR = atype=C.

#### `mmmv` — Marque / Modèle / Version

- **Libellé FR** : Marque / Modèle / Version · **Libellé EN** : Make / Model / Version
- **Identifiant interne AS24** : `makesModelsVariants`
- **Type** : structuré multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Format de valeur** : makeId|modelId|modelLineId|version — répété séparé par des virgules ; une virgule littérale dans <version> est échappée en ',,' puis ré-encodée en %2C
- **Valeur par défaut** : `|||`
- **Dépendances** : aucune
- **Remarque** : Le domaine des modèles (taxonomy.models) n'est peuplé qu'une fois un makeId posé — vérifié : mmmv=54|1409|| a peuplé taxonomy.models['54'].

#### `cat` — Catégorie taxonomique (nouvelle taxonomie)

- **Libellé FR** : Catégorie taxonomique (nouvelle taxonomie) · **Libellé EN** : Taxonomy category
- **Identifiant interne AS24** : `vkhFilters`
- **Type** : structuré multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Format de valeur** : ma<makeId>[gr<modelGroupId>|mo<modelId>][_<version>]
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `mmmv`
- **Remarque** : Voie alternative à mmmv. Inactive sur BE/COM au relevé (pageProps.newTaxonomyAvailable=false).

#### `mcat` — Catégorie modèle (nouvelle taxonomie)

- **Libellé FR** : Catégorie modèle (nouvelle taxonomie) · **Libellé EN** : Model category
- **Identifiant interne AS24** : `vkhFiltersModelCat`
- **Type** : structuré multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `cat`

#### `version0` — Version / finition

- **Libellé FR** : Version / finition · **Libellé EN** : Version / trim
- **Identifiant interne AS24** : `version`
- **Type** : texte libre
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `mmmv`
- **Remarque** : Sérialisé UNIQUEMENT si makeId ET modelId sont posés sur le 1er bloc mmmv. Variantes legacy : version0/version1/version2 avec le paramètre legacy mmm.

#### `offer` — Type d'annonce / état du véhicule

- **Libellé FR** : Type d'annonce / état du véhicule · **Libellé EN** : Vehicle condition / offer type
- **Identifiant interne AS24** : `offer`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (6 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `N` | Neuf | New |
  | `U` | Occasion | Used |
  | `J` | Voiture récente | Employee's car |
  | `O` | Ancêtre | Antique / Classic |
  | `D` | Voiture de démonstration | Demonstration |
  | `S` | Pré-enregistrement | Pre-registered |


#### `kwd` — Recherche par mots-clés

- **Libellé FR** : Recherche par mots-clés · **Libellé EN** : Keyword search
- **Identifiant interne AS24** : `keyword`
- **Type** : texte libre
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : Recherche dans les titres d'annonces (translations listfilters.keyword.helper).


### Prix, financement et leasing

#### `pricefrom` — Prix de

- **Libellé FR** : Prix de · **Libellé EN** : Price from
- **Identifiant interne AS24** : `priceFrom`
- **Type** : intervalle (borne min) · **unité** : EUR
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : min `500` · max `100000` · paliers proposés dans l'UI : `500`, `1000`, `1500`, `2000`, `2500`, `3000`, `4000`, `5000`, `6000`, `7000`, `8000`, `9000`, `10000`, `12500`, `15000`, `17500`, `20000`, `25000`, `30000`, `40000`, `50000`, `75000`, `100000` · **saisie libre acceptée** (les paliers ne sont que des suggestions du sélecteur)

#### `priceto` — Prix à

- **Libellé FR** : Prix à · **Libellé EN** : Price to
- **Identifiant interne AS24** : `priceTo`
- **Type** : intervalle (borne max) · **unité** : EUR
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : min `500` · max `100000` · paliers proposés dans l'UI : `500`, `1000`, `1500`, `2000`, `2500`, `3000`, `4000`, `5000`, `6000`, `7000`, `8000`, `9000`, `10000`, `12500`, `15000`, `17500`, `20000`, `25000`, `30000`, `40000`, `50000`, `75000`, `100000` · **saisie libre acceptée** (les paliers ne sont que des suggestions du sélecteur)

#### `pricetype` — Base d'affichage du prix

- **Libellé FR** : Base d'affichage du prix · **Libellé EN** : Price display basis
- **Identifiant interne AS24** : `priceTypeTech`
- **Type** : énumération simple
- **Valeur par défaut** : `public`
- **Dépendances** : aucune
- **Domaine de valeurs** (3 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `public` | Prix public | Public price |
  | `private` | Particulier | Private |
  | `dealer` | Professionnel | Dealer |

- **Remarque** : pricetype=public est injecté par défaut par le serveur (relevé dans pageQuery). Les codes 'private'/'dealer' viennent de taxonomy.priceType ; leur usage sur ce paramètre n'a pas été prouvé.

#### `vatded` — TVA déductible / récupérable

- **Libellé FR** : TVA déductible / récupérable · **Libellé EN** : VAT deductible
- **Identifiant interne AS24** : `vatReportable`
- **Type** : booléen
- **Valeur par défaut** : `false`
- **Dépendances** : aucune
- **Domaine de valeurs** (1 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `1` | Uniquement TVA déductible | VAT deductible only |

- **Remarque** : Actif sur BE (searchMask.priceFilter.vatReportable=true), inactif sur .com.

#### `superdeal` — SuperDeal

- **Libellé FR** : SuperDeal · **Libellé EN** : SuperDeal
- **Identifiant interne AS24** : `superDeal`
- **Type** : booléen
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : Actif sur BE (filters.superDeal=true), inactif sur .com.

#### `pe_category` — Évaluation du prix

- **Libellé FR** : Évaluation du prix · **Libellé EN** : Price evaluation
- **Identifiant interne AS24** : `priceEvaluation`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (3 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `1` | Très bon prix | Very good price |
  | `2` | Bon prix | Good price |
  | `3` | Prix correct | Fair price |

- **Remarque** : Domaine non vide sur BE, vide sur .com (taxonomy.priceEvaluation=[]).

#### `financeratefrom` — Mensualité de financement de

- **Libellé FR** : Mensualité de financement de · **Libellé EN** : Finance rate from
- **Identifiant interne AS24** : `financeRateFrom`
- **Type** : intervalle (borne min) · **unité** : EUR/mois
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : paliers proposés dans l'UI : `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`

#### `financerateto` — Mensualité de financement à

- **Libellé FR** : Mensualité de financement à · **Libellé EN** : Finance rate to
- **Identifiant interne AS24** : `financeRateTo`
- **Type** : intervalle (borne max) · **unité** : EUR/mois
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : paliers proposés dans l'UI : `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`

#### `hasleasing` — Offre de leasing disponible

- **Libellé FR** : Offre de leasing disponible · **Libellé EN** : Leasing offer available
- **Identifiant interne AS24** : `hasLeasing`
- **Type** : booléen
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : Écho serveur observé : hasleasing=true.

#### `leasingratefrom` — Loyer de leasing de

- **Libellé FR** : Loyer de leasing de · **Libellé EN** : Leasing rate from
- **Identifiant interne AS24** : `leasingRateFrom`
- **Type** : intervalle (borne min) · **unité** : EUR/mois
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `hasleasing`
- **Domaine de valeurs** : paliers proposés dans l'UI : `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`

#### `leasingrateto` — Loyer de leasing à

- **Libellé FR** : Loyer de leasing à · **Libellé EN** : Leasing rate to
- **Identifiant interne AS24** : `leasingRateTo`
- **Type** : intervalle (borne max) · **unité** : EUR/mois
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `hasleasing`
- **Domaine de valeurs** : paliers proposés dans l'UI : `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`

#### `lsdufrom` — Durée de leasing de

- **Libellé FR** : Durée de leasing de · **Libellé EN** : Leasing duration from
- **Identifiant interne AS24** : `leasingDurationFrom`
- **Type** : intervalle (borne min) · **unité** : mois
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `hasleasing`
- **Domaine de valeurs** : paliers proposés dans l'UI : `12`, `24`, `36`, `48`, `60`, `72`

#### `lsduto` — Durée de leasing à

- **Libellé FR** : Durée de leasing à · **Libellé EN** : Leasing duration to
- **Identifiant interne AS24** : `leasingDurationTo`
- **Type** : intervalle (borne max) · **unité** : mois
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `hasleasing`
- **Domaine de valeurs** : paliers proposés dans l'UI : `12`, `24`, `36`, `48`, `60`, `72`

#### `lsyeinmifrom` — Kilométrage annuel inclus (min)

- **Libellé FR** : Kilométrage annuel inclus (min) · **Libellé EN** : Yearly included mileage from
- **Identifiant interne AS24** : `leasingYearlyIncludedMileageFrom`
- **Type** : intervalle (borne min) · **unité** : km/an
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `hasleasing`
- **Domaine de valeurs** : paliers proposés dans l'UI : `10000`, `15000`, `20000`, `25000`, `30000`

#### `lstrinbo` — Bonus de reprise (leasing)

- **Libellé FR** : Bonus de reprise (leasing) · **Libellé EN** : Trade-in bonus
- **Identifiant interne AS24** : `leasingTradeInBonus`
- **Type** : booléen
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `hasleasing`

#### `lsenbo` — Bonus écologique (leasing)

- **Libellé FR** : Bonus écologique (leasing) · **Libellé EN** : Environment bonus
- **Identifiant interne AS24** : `leasingEnvironmentBonus`
- **Type** : booléen
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `hasleasing`

#### `lsavno` — Disponible immédiatement (leasing)

- **Libellé FR** : Disponible immédiatement (leasing) · **Libellé EN** : Available now
- **Identifiant interne AS24** : `leasingAvailableNow`
- **Type** : booléen
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `hasleasing`

#### `lstagr` — Groupe cible du leasing

- **Libellé FR** : Groupe cible du leasing · **Libellé EN** : Leasing target group
- **Identifiant interne AS24** : `leasingTargetGroup`
- **Type** : énumération simple
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `hasleasing`
- **Domaine de valeurs** (3 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `private` | Particulier | Private |
  | `business` | Entreprise | Business |
  | `private&business` | Particulier/entreprise | Private/Business |

- **Remarque** : taxonomy.leasingTargetGroup est vide sur BE et .com ; les codes viennent du mapping de tracking (module 92526) et 'private' a été accepté et repris en écho par le serveur.

#### `efeg` — Prime à l'achat / bonus étatique

- **Libellé FR** : Prime à l'achat / bonus étatique · **Libellé EN** : Government bonus
- **Identifiant interne AS24** : `governmentBonus`
- **Type** : booléen
- **Valeur par défaut** : `false`
- **Dépendances** : aucune

#### `tradeIn` — Reprise de mon véhicule

- **Libellé FR** : Reprise de mon véhicule · **Libellé EN** : Trade-in
- **Identifiant interne AS24** : `tradeIn`
- **Type** : booléen
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : Seul paramètre du catalogue en camelCase.


### Kilométrage

#### `kmfrom` — Kilométrage de

- **Libellé FR** : Kilométrage de · **Libellé EN** : Mileage from
- **Identifiant interne AS24** : `mileageFrom`
- **Type** : intervalle (borne min) · **unité** : km
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : paliers proposés dans l'UI : `2500`, `5000`, `10000`, `20000`, `30000`, `40000`, `50000`, `60000`, `70000`, `80000`, `90000`, `100000`, `125000`, `150000`, `175000`, `200000` · **saisie libre acceptée** (les paliers ne sont que des suggestions du sélecteur)

#### `kmto` — Kilométrage à

- **Libellé FR** : Kilométrage à · **Libellé EN** : Mileage to
- **Identifiant interne AS24** : `mileageTo`
- **Type** : intervalle (borne max) · **unité** : km
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : paliers proposés dans l'UI : `2500`, `5000`, `10000`, `20000`, `30000`, `40000`, `50000`, `60000`, `70000`, `80000`, `90000`, `100000`, `125000`, `150000`, `175000`, `200000` · **saisie libre acceptée** (les paliers ne sont que des suggestions du sélecteur)


### Immatriculation et année

#### `fregfrom` — Première immatriculation de

- **Libellé FR** : Première immatriculation de · **Libellé EN** : First registration from
- **Identifiant interne AS24** : `dateOfRegistrationFrom`
- **Type** : intervalle (borne min) · **unité** : année
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : min `1900` · max `2026` · pas `1`

#### `fregto` — Première immatriculation à

- **Libellé FR** : Première immatriculation à · **Libellé EN** : First registration to
- **Identifiant interne AS24** : `dateOfRegistrationTo`
- **Type** : intervalle (borne max) · **unité** : année
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : min `1900` · max `2026` · pas `1`

#### `modelyearfrom` — Année-modèle de

- **Libellé FR** : Année-modèle de · **Libellé EN** : Model year from
- **Identifiant interne AS24** : `dateOfModelYearFrom`
- **Type** : intervalle (borne min) · **unité** : année
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : min `1900` · max `2027` · pas `1`

#### `modelyearto` — Année-modèle à

- **Libellé FR** : Année-modèle à · **Libellé EN** : Model year to
- **Identifiant interne AS24** : `dateOfModelYearTo`
- **Type** : intervalle (borne max) · **unité** : année
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : min `1900` · max `2027` · pas `1`


### Motorisation

#### `fuel` — Carburant

- **Libellé FR** : Carburant · **Libellé EN** : Fuel type
- **Identifiant interne AS24** : `fuelType`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (10 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `2` | Electrique/Essence | Electric/Gasoline |
  | `3` | Electrique/Diesel | Electric/Diesel |
  | `B` | Essence | Gasoline |
  | `C` | CNG | CNG |
  | `D` | Diesel | Diesel |
  | `E` | Electrique | Electric |
  | `H` | Hydrogène | Hydrogen |
  | `L` | GPL | LPG |
  | `M` | Ethanol | Ethanol |
  | `O` | Autres | Others |


#### `powertype` — Unité de puissance

- **Libellé FR** : Unité de puissance · **Libellé EN** : Power unit
- **Identifiant interne AS24** : `powerType`
- **Type** : énumération simple
- **Valeur par défaut** : `kw`
- **Dépendances** : aucune
- **Domaine de valeurs** (2 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `hp` | CH | hp |
  | `kw` | kW | kW |

- **Remarque** : Détermine l'unité de powerfrom/powerto. Défaut null sur le marketplace CA.

#### `powerfrom` — Puissance de

- **Libellé FR** : Puissance de · **Libellé EN** : Power from
- **Identifiant interne AS24** : `powerFrom`
- **Type** : intervalle (borne min) · **unité** : dépend de powertype (kW ou ch)
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `powertype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `powerto` — Puissance à

- **Libellé FR** : Puissance à · **Libellé EN** : Power to
- **Identifiant interne AS24** : `powerTo`
- **Type** : intervalle (borne max) · **unité** : dépend de powertype (kW ou ch)
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `powertype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `ccmfrom` — Cylindrée de

- **Libellé FR** : Cylindrée de · **Libellé EN** : Engine size from
- **Identifiant interne AS24** : `engineMotorSizeFrom`
- **Type** : intervalle (borne min) · **unité** : cm3
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `ccmto` — Cylindrée à

- **Libellé FR** : Cylindrée à · **Libellé EN** : Engine size to
- **Identifiant interne AS24** : `engineMotorSizeTo`
- **Type** : intervalle (borne max) · **unité** : cm3
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `cylinders` — Nombre de cylindres

- **Libellé FR** : Nombre de cylindres · **Libellé EN** : Cylinders
- **Identifiant interne AS24** : `engineType`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (5 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `3` | 3 cylindres | 3 cylinder |
  | `4` | 4 cylindres | 4 cylinder |
  | `6` | 6 cylindres | 6 cylinder |
  | `8` | 8 cylindres | 8 cylinder |
  | `10plus` | 10+ cylindres | 10+ cylinder |

- **Remarque** : filters.isEngineTypeEnabled=false sur BE et .com : masqué dans l'UI mais accepté en URL (vérifié).

#### `dtrain` — Transmission (roues motrices)

- **Libellé FR** : Transmission (roues motrices) · **Libellé EN** : Drivetrain
- **Identifiant interne AS24** : `driveTrain`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (3 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `4` | 4x4 | 4WD |
  | `F` | Avant | Front Wheel Drive |
  | `R` | Arrière | Rear Wheel Drive |

- **Remarque** : filters.isDriveTrainEnabled=false sur BE et .com : masqué dans l'UI mais accepté en URL (vérifié).

#### `gear` — Boîte de vitesses

- **Libellé FR** : Boîte de vitesses · **Libellé EN** : Transmission
- **Identifiant interne AS24** : `gearType`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (3 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `A` | Boîte automatique | Automatic |
  | `M` | Boîte manuelle | Manual |
  | `S` | Semi-automatique | Semi-automatic |


#### `newdriver` — Pour les nouveaux conducteurs

- **Libellé FR** : Pour les nouveaux conducteurs · **Libellé EN** : For new drivers
- **Identifiant interne AS24** : `newDriver`
- **Type** : booléen
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : searchMask.powerFilter.newDriver=false sur BE/.com. Libellé UI : listfilters.power.modal.newdriver.


### Carrosserie et habitacle

#### `body` — Carrosserie

- **Libellé FR** : Carrosserie · **Libellé EN** : Body type
- **Identifiant interne AS24** : `bodyType`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (9 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `1` | Citadine | Compact |
  | `2` | Cabriolet | Convertible |
  | `3` | Coupé | Coupe |
  | `4` | SUV/4x4/Pick-Up | SUV/Off-Road/Pick-Up |
  | `5` | Break | Station Wagon |
  | `6` | Berline | Sedan |
  | `12` | Monospace | Van |
  | `13` | Utilitaire | Transporter |
  | `7` | Autres | Other |


#### `doorfrom` — Nombre de portes (min)

- **Libellé FR** : Nombre de portes (min) · **Libellé EN** : Doors from
- **Identifiant interne AS24** : `doorFrom`
- **Type** : intervalle (borne min)
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : valeurs : `2`, `3`, `4`, `5`, `6`, `7`

#### `doorto` — Nombre de portes (max)

- **Libellé FR** : Nombre de portes (max) · **Libellé EN** : Doors to
- **Identifiant interne AS24** : `doorTo`
- **Type** : intervalle (borne max)
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : valeurs : `2`, `3`, `4`, `5`, `6`, `7`

#### `seatsfrom` — Nombre de places (min)

- **Libellé FR** : Nombre de places (min) · **Libellé EN** : Seats from
- **Identifiant interne AS24** : `numberOfSeatsFrom`
- **Type** : intervalle (borne min)
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : valeurs : `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`

#### `seatsto` — Nombre de places (max)

- **Libellé FR** : Nombre de places (max) · **Libellé EN** : Seats to
- **Identifiant interne AS24** : `numberOfSeatsTo`
- **Type** : intervalle (borne max)
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** : valeurs : `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`

#### `bcol` — Couleur extérieure

- **Libellé FR** : Couleur extérieure · **Libellé EN** : Exterior colour
- **Identifiant interne AS24** : `bodyColor`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (14 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `1` | Beige | Beige |
  | `2` | Bleu | Blue |
  | `3` | Brun | Brown |
  | `4` | Bronze | Bronze |
  | `5` | Jaune | Yellow |
  | `6` | Gris | Grey |
  | `7` | Vert | Green |
  | `10` | Rouge | Red |
  | `11` | Noir | Black |
  | `12` | Argent | Silver |
  | `13` | Mauve | Violet |
  | `14` | Blanc | White |
  | `15` | Orange | Orange |
  | `16` | Or | Gold |


#### `ptype` — Type de peinture

- **Libellé FR** : Type de peinture · **Libellé EN** : Paintwork
- **Identifiant interne AS24** : `paintwork`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (5 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `M` | Métallisé | Metallic |
  | `O` | Autres | Others |
  | `P` | Nacré | Perl Effect |
  | `S` | Mica | Mica (Stoned) |
  | `U` | Uni | Uni/Basic |

- **Remarque** : searchMask.exteriorColorAndPaintworkFilter.paintworkFilter=true sur BE.

#### `icol` — Couleur intérieure

- **Libellé FR** : Couleur intérieure · **Libellé EN** : Interior colour
- **Identifiant interne AS24** : `interiorColor`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (11 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `1` | Beige | Beige |
  | `2` | Noir | Black |
  | `3` | Gris | Grey |
  | `4` | Brun | Brown |
  | `5` | Autres | Other |
  | `6` | Bleu | Blue |
  | `7` | Rouge | Red |
  | `8` | Vert | Green |
  | `9` | Jaune | Yellow |
  | `10` | Orange | Orange |
  | `11` | Blanc | White |


#### `uph` — Revêtement / sellerie

- **Libellé FR** : Revêtement / sellerie · **Libellé EN** : Upholstery
- **Identifiant interne AS24** : `upholstery`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** (6 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `AL` | Alcantara | Alcantara |
  | `CL` | Tissu | Cloth |
  | `FL` | Cuir | Full leather |
  | `OT` | Autres | Other |
  | `PL` | Cuir partiel | Part leather |
  | `VL` | Velours | Velour |



### Écologie et électrique

#### `emclass` — Norme Euro / classe d'émission

- **Libellé FR** : Norme Euro / classe d'émission · **Libellé EN** : Emission class
- **Identifiant interne AS24** : `emissionClass`
- **Type** : énumération simple
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** (11 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `1` | Euro 1 | Euro 1 |
  | `2` | Euro 2 | Euro 2 |
  | `3` | Euro 3 | Euro 3 |
  | `4` | Euro 4 | Euro 4 |
  | `5` | Euro 5 | Euro 5 |
  | `6` | Euro 6 | Euro 6 |
  | `11` | Euro 6b | Euro 6b |
  | `7` | Euro 6c | Euro 6c |
  | `8` | Euro 6d | Euro 6d |
  | `9` | Euro 6d-TEMP | Euro 6d-TEMP |
  | `10` | Euro 6e | Euro 6e |

- **Remarque** : Sémantique 'au moins' (min. Euro N) présumée d'après l'UI ; non prouvée par relevé.

#### `ensticker` — Vignette environnementale

- **Libellé FR** : Vignette environnementale · **Libellé EN** : Emission sticker
- **Identifiant interne AS24** : `emissionSticker`
- **Type** : énumération simple
- **Valeur par défaut** : `1`
- **Dépendances** : aucune
- **Domaine de valeurs** (5 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `1` | Aucune classification environnementale | None |
  | `2` | min. 2 (Rouge) | min. 2 (Red) |
  | `3` | min. 3 (Jaune) | min. 3 (Yellow) |
  | `4` | min. 4 (Vert) | min. 4 (Green) |
  | `5` | min. 5 (Bleu) | min. 5 (Blue) |

- **Remarque** : Le code 1 ('Aucune classification') est mappé sur null : le paramètre n'est alors PAS émis. searchMask.environmentFilter.emissionSticker=false sur BE/.com (pertinent surtout pour DE).

#### `bot` — Propriété de la batterie

- **Libellé FR** : Propriété de la batterie · **Libellé EN** : Battery ownership
- **Identifiant interne AS24** : `batteryOwnershipType`
- **Type** : énumération simple
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `fuel`
- **Domaine de valeurs** (3 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `1` | Incluse | Included |
  | `2` | Louée | Rented |
  | `3` | Sans batterie | Excluded |


#### `erfrom` — Autonomie électrique de

- **Libellé FR** : Autonomie électrique de · **Libellé EN** : Electric range from
- **Identifiant interne AS24** : `electricRangeFrom`
- **Type** : intervalle (borne min) · **unité** : km
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `fuel`
- **Domaine de valeurs** : paliers proposés dans l'UI : `80`, `120`, `180`, `250`, `350`, `450`, `550`
- **Remarque** : searchMask.fuelTypeFilter.electricRange=false sur BE/.com : masqué dans l'UI mais accepté en URL (vérifié).

#### `erto` — Autonomie électrique à

- **Libellé FR** : Autonomie électrique à · **Libellé EN** : Electric range to
- **Identifiant interne AS24** : `electricRangeTo`
- **Type** : intervalle (borne max) · **unité** : km
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `fuel`
- **Domaine de valeurs** : paliers proposés dans l'UI : `80`, `120`, `180`, `250`, `350`, `450`, `550`


### Équipements

#### `eq` — Équipement

- **Libellé FR** : Équipement · **Libellé EN** : Equipment
- **Identifiant interne AS24** : `equipment`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **ET (présumé)**
- **Valeur par défaut** : liste vide
- **Dépendances** : aucune
- **Domaine de valeurs** : 136 valeurs — voir la section [Énumérations](#énumérations).
- **Remarque** : 136 valeurs relevées pour atype=C sur autoscout24.be/fr. La sémantique ET (cumul d'équipements) est déduite de l'usage produit, non prouvée par relevé — voir zones d'ombre. Les codes 37/49/53/110/120 sont aussi exposés séparément dans le bloc 'Garantie et historique' (taxonomy.conditionEquipment).


### État et historique

#### `ustate` — Véhicule accidenté (BE/EU)

- **Libellé FR** : Véhicule accidenté (BE/EU) · **Libellé EN** : Damaged vehicle (BE/EU)
- **Identifiant interne AS24** : `hadAccident`
- **Type** : énumération simple
- **Valeur par défaut** : `N,U`
- **Dépendances** : aucune
- **Domaine de valeurs** (3 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `N,U` | Ne pas montrer | Do not show |
  | `A,N,U` | Montrer aussi | Show also |
  | `A` | Montrer seulement | Show only |

- **Remarque** : Toujours présent dans l'URL. La virgule est encodée %2C. Attention : la valeur mélange état-du-véhicule (N/U) et accidenté (A).

#### `damaged_listing` — Véhicule accidenté (variante récente)

- **Libellé FR** : Véhicule accidenté (variante récente) · **Libellé EN** : Damaged listing
- **Identifiant interne AS24** : `hadAccidentNew`
- **Type** : énumération simple
- **Valeur par défaut** : `exclude`
- **Dépendances** : aucune
- **Domaine de valeurs** (3 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `exclude` | Ne pas montrer | Do not show |
  | `include` | Montrer aussi | Show also |
  | `damaged-only` | Montrer seulement | Show only |

- **Remarque** : Paramètre présent dans la table de sérialisation mais REJETÉ par le serveur BE et .com au relevé (absent de pageQuery dans les deux tests). Actif seulement là où searchMask.warrantyAndHistoryAndSealsFilter.newAccidentFilter=true. Mutuellement exclusif avec ustate.

#### `prevownersid` — Nombre de propriétaires précédents

- **Libellé FR** : Nombre de propriétaires précédents · **Libellé EN** : Previous owners
- **Identifiant interne AS24** : `numberOfOwners`
- **Type** : énumération simple
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** (4 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `1` | 1 | — |
  | `2` | 2 | — |
  | `3` | 3 | — |
  | `4` | 4+ | — |

- **Remarque** : Sémantique 'au plus N' présumée d'après les libellés (1, 2, 3, 4+ — le code 4 est libellé '>3' dans le code).

#### `sealor` — Label / programme d'occasion certifiée

- **Libellé FR** : Label / programme d'occasion certifiée · **Libellé EN** : Seal / certified pre-owned programme
- **Identifiant interne AS24** : `seals`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : `mmmv`
- **Domaine de valeurs** (14 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `249` | BMW Motorrad Premium Selection | BMW Motorrad Premium Selection |
  | `247` | Hyundai H PROMISE | Hyundai H PROMISE |
  | `216` | Ford Approved | Ford Approved |
  | `156` | Opel Select | Opel Select |
  | `134` | Peugeot Occasions | Peugeot Occasions |
  | `118` | My Way | My Way |
  | `271` | Aston Martin Timeless | Aston Martin Timeless |
  | `112` | Jaguar Approved | Jaguar Approved |
  | `295` | Lamborghini Certified Pre-Owned | Lamborghini Certified Pre-Owned |
  | `315` | Porsche Approved | Porsche Approved |
  | `111` | Land Rover Approved | Land Rover Approved |
  | `223` | Bentley PRE-OWNED | Bentley PRE-OWNED |
  | `226` | Audi Approved Plus | Audi Approved Plus |
  | `241` | KIA Used Cars | KIA Used Cars |

- **Remarque** : Chaque label est rattaché à une ou plusieurs marques (champ makes). Le domaine est spécifique au pays/culture. searchMask.warrantyAndHistoryAndSealsFilter.seals=true sur BE.


### Vendeur

#### `custtype` — Type de vendeur

- **Libellé FR** : Type de vendeur · **Libellé EN** : Seller type
- **Identifiant interne AS24** : `sellerType`
- **Type** : énumération simple
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** (2 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `P` | Particulier | Private |
  | `D` | Professionnel | Dealer |


#### `cid` — Identifiant du vendeur

- **Libellé FR** : Identifiant du vendeur · **Libellé EN** : Dealer / customer id
- **Identifiant interne AS24** : `customerId`
- **Type** : texte libre
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : Restreint la recherche à un vendeur donné. À EXCLURE du périmètre KYCAR (règle R3 : aucun champ identifiant un vendeur particulier).


### Géographie

#### `cy` — Pays

- **Libellé FR** : Pays · **Libellé EN** : Country
- **Identifiant interne AS24** : `countryType`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** (9 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `` | Europe | Europe |
  | `A` | Autriche | Austria |
  | `B` | Belgique | Belgium |
  | `D` | Allemagne | Germany |
  | `E` | Espagne | Spain |
  | `F` | France | France |
  | `I` | Italie | Italy |
  | `L` | Luxembourg | Luxembourg |
  | `NL` | Pays-Bas | Netherlands |

- **Remarque** : Le code 'eu' correspond à la valeur littérale 'D,A,B,E,F,I,L,NL'. Le marketplace CA ajoute 'CA'. Valeur effective par défaut = pays du marketplace (B sur autoscout24.be).

#### `zip` — Ville / code postal

- **Libellé FR** : Ville / code postal · **Libellé EN** : City / postcode
- **Identifiant interne AS24** : `location`
- **Type** : géographique
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : Géocodé par le serveur : zip=1000 a produit lat=50.84553 et lon=4.3557 dans pageQuery.

#### `zipr` — Rayon

- **Libellé FR** : Rayon · **Libellé EN** : Radius
- **Identifiant interne AS24** : `radius`
- **Type** : énumération simple · **unité** : km
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `zip`
- **Domaine de valeurs** : `10`, `20`, `50`, `100`, `150`, `200`, `250`, `300`, `400`
- **Remarque** : N'a de sens qu'avec zip (ou lat/lon). filters.defaultRadius100=false sur BE/.com.
- **Statut KYCAR (`D8-32`, 2.8, cf. `draft-screens.md` `EX-SCR-82` #66-67)** : `zip` (#66) est
  `EXCLU` du périmètre retenu (règle R3, `D-14`) alors que `zipr` (#67) reste **`RETENU`** — la
  dépendance à `zip` devient résiduelle et sans effet (`zipr` n'a de toute façon aucun champ
  local, classe `T` : la géolocalisation exacte n'est ni collectée ni recalculée par KYCAR).
  Ratifié par le fix-lead : le maintien de `zipr` en `RETENU` n'est pas remis en cause par
  l'exclusion de sa dépendance, faute d'effet d'exécution (aucune valeur ni filtre n'en dépend).

#### `lat` — Latitude

- **Libellé FR** : Latitude · **Libellé EN** : Latitude
- **Identifiant interne AS24** : `lat`
- **Type** : numérique
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `zip`
- **Remarque** : Dérivé automatiquement de zip par le serveur, mais acceptable en entrée.

#### `lon` — Longitude

- **Libellé FR** : Longitude · **Libellé EN** : Longitude
- **Identifiant interne AS24** : `lon`
- **Type** : numérique
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `zip`

#### `region` — Région / province

- **Libellé FR** : Région / province · **Libellé EN** : Region / province
- **Identifiant interne AS24** : `region`
- **Type** : texte libre
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `cy`
- **Remarque** : Paramètre présent dans la table de sérialisation ; domaine de valeurs NON relevé (filters.provinceAndNationalBasedLocationSearch=false et searchMask.shared.enableProvinceCodeInLocation=false sur BE/.com). Une valeur vide est rejetée par le serveur.

#### `crossborder` — Inclure les véhicules au-delà de la frontière

- **Libellé FR** : Inclure les véhicules au-delà de la frontière · **Libellé EN** : Cross-border
- **Identifiant interne AS24** : `crossBorder`
- **Type** : booléen
- **Valeur par défaut** : `false`
- **Dépendances** : `zip`, `zipr`


### Divers, achat en ligne et fraîcheur

#### `ot_osc` — Achat en ligne (Smyle / OCS)

- **Libellé FR** : Achat en ligne (Smyle / OCS) · **Libellé EN** : Buy online
- **Identifiant interne AS24** : `buyOnline`
- **Type** : booléen
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune

#### `ocs_listing` — Annonces achat-en-ligne

- **Libellé FR** : Annonces achat-en-ligne · **Libellé EN** : Online-checkout listings
- **Identifiant interne AS24** : `ocsListing`
- **Type** : énumération simple
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** (3 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `ocs-only` | Uniquement achat en ligne | Online only |
  | `include` | Inclure | Include |
  | `exclude` | Exclure | Exclude |

- **Remarque** : Défaut = 'include' sur le marketplace DE, null ailleurs (module 95983). Le serveur .com l'a injecté à 'include' au relevé.

#### `dlv_max` — Offres avec livraison (portée max)

- **Libellé FR** : Offres avec livraison (portée max) · **Libellé EN** : Deliverable insertion
- **Identifiant interne AS24** : `deliverableInsertion`
- **Type** : texte libre
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : Paramètre présent dans la table de sérialisation ; domaine de valeurs NON relevé.

#### `dlv_tail` — Élargir aux offres livrables

- **Libellé FR** : Élargir aux offres livrables · **Libellé EN** : Deliverable tail
- **Identifiant interne AS24** : `smyleTail`
- **Type** : booléen
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : Lié à pageProps.deliverableTailTotalItems.

#### `adage` — En ligne depuis

- **Libellé FR** : En ligne depuis · **Libellé EN** : Online since
- **Identifiant interne AS24** : `onlineSince`
- **Type** : énumération simple · **unité** : jours
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Domaine de valeurs** (8 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `1` | 1 jour | 1 day |
  | `2` | 2 jours | 2 days |
  | `3` | 3 jours | 3 days |
  | `4` | 4 jours | 4 days |
  | `5` | 5 jours | 5 days |
  | `6` | 6 jours | 6 days |
  | `7` | 1 semaine | 1 week |
  | `14` | 2 semaines | 2 weeks |



### Tri et pagination

#### `sort` — Critère de tri

- **Libellé FR** : Critère de tri · **Libellé EN** : Sort criterion
- **Identifiant interne AS24** : `sortTypes`
- **Type** : énumération simple
- **Valeur par défaut** : `standard`
- **Dépendances** : aucune
- **Domaine de valeurs** (10 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `price` | Prix | Price |
  | `financerate` | Rate | Rate |
  | `make` | Marque/Modèle | Make/Model |
  | `leasing_rate` | Leasing Rate | Leasing Rate |
  | `year` | Année | First registration |
  | `mileage` | Kilométrage | Mileage |
  | `power` | Puissance | Power |
  | `age` | Annonces les plus récentes d'abord | Latest offers first |
  | `standard` | Résultats standards | Best results |
  | `distance` | Selon la distance | By distance |

- **Remarque** : Le mapping de sérialisation expose aussi 'model_year' (absent de taxonomy.sortingKeys) ; à l'inverse 'make' apparaît dans taxonomy.sortingKeys mais PAS dans le mapping de sérialisation. 'distance' exige un zip. 'financerate' et 'leasing_rate' sont désactivés sur BE (filters.sorting.*=false).

#### `desc` — Sens du tri

- **Libellé FR** : Sens du tri · **Libellé EN** : Sort direction
- **Identifiant interne AS24** : `descType`
- **Type** : énumération simple
- **Valeur par défaut** : `0`
- **Dépendances** : `sort`
- **Domaine de valeurs** (2 valeurs, exhaustif) :

  | Code | Libellé FR | Libellé EN |
  |---|---|---|
  | `0` | Ordre croissant | Ascending |
  | `1` | Ordre décroissant | Descending |


#### `page` — Page

- **Libellé FR** : Page · **Libellé EN** : Page
- **Identifiant interne AS24** : `page`
- **Type** : numérique
- **Valeur par défaut** : `1`
- **Dépendances** : aucune
- **Domaine de valeurs** : min `1` · max `20` · pas `1` · note : 20 = limite documentée par sources tierces, non prouvée par relevé
- **Remarque** : pageProps.numberOfPages a renvoyé 200 pour 120 779 résultats (soit 200 x 20 = 4000 annonces exposables au maximum ; la limite pratique de 20 pages annoncée par les sources tierces n'a pas été vérifiée).

#### `size` — Taille de page

- **Libellé FR** : Taille de page · **Libellé EN** : Page size
- **Identifiant interne AS24** : `pageSize`
- **Type** : numérique
- **Valeur par défaut** : `20`
- **Dépendances** : aucune
- **Domaine de valeurs** : valeur observée : `20`
- **Remarque** : Sérialisé côté client uniquement pour le marketplace CA, mais accepté et repris en écho par le serveur BE et .com. Constante 64538.Hy = 20.


### Filtres propres aux autres types de véhicules (atype ≠ C)

#### `bedsfrom` — Nombre de lits (min)

- **Libellé FR** : Nombre de lits (min) · **Libellé EN** : Beds from
- **Identifiant interne AS24** : `bedsFrom`
- **Type** : intervalle (borne min)
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).
- **Remarque** : Domaine vide pour atype=C (camping-cars / caravanes).

#### `bedsto` — Nombre de lits (max)

- **Libellé FR** : Nombre de lits (max) · **Libellé EN** : Beds to
- **Identifiant interne AS24** : `bedsTo`
- **Type** : intervalle (borne max)
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `beds` — Nombre de lits

- **Libellé FR** : Nombre de lits · **Libellé EN** : Number of beds
- **Identifiant interne AS24** : `numberOfBeds`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : `atype`
- **Domaine de valeurs** : `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`

#### `(aucun paramètre)` — Type de lit

- **Libellé FR** : Type de lit · **Libellé EN** : Bed type
- **Identifiant interne AS24** : `bedType`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU (présumé, par analogie avec les autres enum_multi)**
- **Valeur par défaut** : liste vide
- **Dépendances** : `atype`
- **Domaine de valeurs** : **NON RELEVÉ — taxonomy.bedType est vide pour atype=C**
- **Remarque** : taxonomy.bedType existe mais est vide pour atype=C, et AUCUN paramètre d'URL correspondant n'a été trouvé dans la table de sérialisation. Entrée conservée pour l'exhaustivité du relevé : c'est le seul filtre de taxonomy sans paramètre d'URL identifié.

#### `sout` — Nombre d'extensions (slide-out)

- **Libellé FR** : Nombre d'extensions (slide-out) · **Libellé EN** : Slide-outs
- **Identifiant interne AS24** : `slideOutCount`
- **Type** : énumération multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Valeur par défaut** : liste vide
- **Dépendances** : `atype`
- **Domaine de valeurs** : `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`

#### `wbfrom` — Empattement de

- **Libellé FR** : Empattement de · **Libellé EN** : Wheelbase from
- **Identifiant interne AS24** : `wheelbaseFrom`
- **Type** : intervalle (borne min) · **unité** : mm
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `wbto` — Empattement à

- **Libellé FR** : Empattement à · **Libellé EN** : Wheelbase to
- **Identifiant interne AS24** : `wheelbaseTo`
- **Type** : intervalle (borne max) · **unité** : mm
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `ewfrom` — Poids à vide de

- **Libellé FR** : Poids à vide de · **Libellé EN** : Empty weight from
- **Identifiant interne AS24** : `weightFrom`
- **Type** : intervalle (borne min) · **unité** : kg
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `ewto` — Poids à vide à

- **Libellé FR** : Poids à vide à · **Libellé EN** : Empty weight to
- **Identifiant interne AS24** : `weightTo`
- **Type** : intervalle (borne max) · **unité** : kg
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `totlenfrom` — Longueur totale de

- **Libellé FR** : Longueur totale de · **Libellé EN** : Total length from
- **Identifiant interne AS24** : `lengthFrom`
- **Type** : intervalle (borne min) · **unité** : mm
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `totlento` — Longueur totale à

- **Libellé FR** : Longueur totale à · **Libellé EN** : Total length to
- **Identifiant interne AS24** : `lengthTo`
- **Type** : intervalle (borne max) · **unité** : mm
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `ehfrom` — Heures de fonctionnement de

- **Libellé FR** : Heures de fonctionnement de · **Libellé EN** : Engine hours from
- **Identifiant interne AS24** : `hoursFrom`
- **Type** : intervalle (borne min) · **unité** : h
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `ehto` — Heures de fonctionnement à

- **Libellé FR** : Heures de fonctionnement à · **Libellé EN** : Engine hours to
- **Identifiant interne AS24** : `hoursTo`
- **Type** : intervalle (borne max) · **unité** : h
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).

#### `axlenumber` — Nombre d'essieux

- **Libellé FR** : Nombre d'essieux · **Libellé EN** : Number of axles
- **Identifiant interne AS24** : `numberOfAxles`
- **Type** : numérique
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Remarque** : taxonomy.numberOfAxles vide pour atype=C.

#### `grossweightfrom` — Poids total autorisé de

- **Libellé FR** : Poids total autorisé de · **Libellé EN** : Gross weight from
- **Identifiant interne AS24** : `grossWeightFrom`
- **Type** : intervalle (borne min) · **unité** : kg
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).
- **Remarque** : Libellé UI FR : 'Poids total du véhicule' (listfilters.loadCapacity.title).

#### `grossweightto` — Poids total autorisé à

- **Libellé FR** : Poids total autorisé à · **Libellé EN** : Gross weight to
- **Identifiant interne AS24** : `grossWeightTo`
- **Type** : intervalle (borne max) · **unité** : kg
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : `atype`
- **Domaine de valeurs** : non borné dans la source (entier libre).


### Paramètres techniques (non-filtres)

#### `show_nfm` — [technique] Nouveau modèle de financement

- **Libellé FR** : [technique] Nouveau modèle de financement · **Libellé EN** : [technical] new finance model
- **Identifiant interne AS24** : `_showNfm`
- **Type** : booléen
- **Valeur par défaut** : `true`
- **Dépendances** : aucune
- **Remarque** : Injecté par le serveur, non exposé comme filtre.

#### `search_id` — [technique] Identifiant de recherche

- **Libellé FR** : [technique] Identifiant de recherche · **Libellé EN** : [technical] search id
- **Identifiant interne AS24** : `_searchId`
- **Type** : texte libre
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune

#### `query_id` — [technique] Identifiant de requête

- **Libellé FR** : [technique] Identifiant de requête · **Libellé EN** : [technical] query id
- **Identifiant interne AS24** : `_queryId`
- **Type** : texte libre
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : Régénéré à chaque requête (valeurs relevées : 'rmsoxpszbb', '55996etl6i').

#### `tier_rotation` — [technique] Rotation des paliers d'annonces

- **Libellé FR** : [technique] Rotation des paliers d'annonces · **Libellé EN** : [technical] tier rotation
- **Identifiant interne AS24** : `_tierRotation`
- **Type** : booléen
- **Valeur par défaut** : `true`
- **Dépendances** : aucune

#### `mmm` — [legacy] Marque/modèle (paramètre répété)

- **Libellé FR** : [legacy] Marque/modèle (paramètre répété) · **Libellé EN** : [legacy] make/model (repeated param)
- **Identifiant interne AS24** : `_mmmLegacy`
- **Type** : structuré multi-valeurs
- **Multi-valeurs** : séparateur `,` (une seule occurrence du paramètre) · sémantique **OU**
- **Format de valeur** : mmm=makeId|modelId|modelLineId — répété : &mmm=...&mmm=... ; la version part dans &version<N>=
- **Valeur par défaut** : aucune (filtre non posé)
- **Dépendances** : aucune
- **Remarque** : Voie de sérialisation alternative à mmmv (fonction N du module 56702). Noms réservés legacy : ['mmm','version','version0','version1','version2'].


---

## Énumérations

Tables réutilisables. Toutes sont **exhaustives pour `atype=C`** sur `autoscout24.be/fr` sauf mention contraire. Les libellés FR viennent de `autoscout24.be/fr`, les EN de `autoscout24.com`.

### `offer` — Type d'annonce / état du véhicule — 6 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `N` | Neuf | New |
| `U` | Occasion | Used |
| `J` | Voiture récente | Employee's car |
| `O` | Ancêtre | Antique / Classic |
| `D` | Voiture de démonstration | Demonstration |
| `S` | Pré-enregistrement | Pre-registered |

### `body` — Carrosserie — 9 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `1` | Citadine | Compact |
| `2` | Cabriolet | Convertible |
| `3` | Coupé | Coupe |
| `4` | SUV/4x4/Pick-Up | SUV/Off-Road/Pick-Up |
| `5` | Break | Station Wagon |
| `6` | Berline | Sedan |
| `12` | Monospace | Van |
| `13` | Utilitaire | Transporter |
| `7` | Autres | Other |

### `fuel` — Carburant — 10 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `2` | Electrique/Essence | Electric/Gasoline |
| `3` | Electrique/Diesel | Electric/Diesel |
| `B` | Essence | Gasoline |
| `C` | CNG | CNG |
| `D` | Diesel | Diesel |
| `E` | Electrique | Electric |
| `H` | Hydrogène | Hydrogen |
| `L` | GPL | LPG |
| `M` | Ethanol | Ethanol |
| `O` | Autres | Others |

### `gear` — Boîte de vitesses — 3 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `A` | Boîte automatique | Automatic |
| `M` | Boîte manuelle | Manual |
| `S` | Semi-automatique | Semi-automatic |

### `dtrain` — Roues motrices — 3 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `4` | 4x4 | 4WD |
| `F` | Avant | Front Wheel Drive |
| `R` | Arrière | Rear Wheel Drive |

### `cylinders` — Nombre de cylindres — 5 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `3` | 3 cylindres | 3 cylinder |
| `4` | 4 cylindres | 4 cylinder |
| `6` | 6 cylindres | 6 cylinder |
| `8` | 8 cylindres | 8 cylinder |
| `10plus` | 10+ cylindres | 10+ cylinder |

### `bcol` — Couleur extérieure — 14 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `1` | Beige | Beige |
| `2` | Bleu | Blue |
| `3` | Brun | Brown |
| `4` | Bronze | Bronze |
| `5` | Jaune | Yellow |
| `6` | Gris | Grey |
| `7` | Vert | Green |
| `10` | Rouge | Red |
| `11` | Noir | Black |
| `12` | Argent | Silver |
| `13` | Mauve | Violet |
| `14` | Blanc | White |
| `15` | Orange | Orange |
| `16` | Or | Gold |

### `ptype` — Type de peinture — 5 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `M` | Métallisé | Metallic |
| `O` | Autres | Others |
| `P` | Nacré | Perl Effect |
| `S` | Mica | Mica (Stoned) |
| `U` | Uni | Uni/Basic |

### `icol` — Couleur intérieure — 11 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `1` | Beige | Beige |
| `2` | Noir | Black |
| `3` | Gris | Grey |
| `4` | Brun | Brown |
| `5` | Autres | Other |
| `6` | Bleu | Blue |
| `7` | Rouge | Red |
| `8` | Vert | Green |
| `9` | Jaune | Yellow |
| `10` | Orange | Orange |
| `11` | Blanc | White |

### `uph` — Revêtement / sellerie — 6 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `AL` | Alcantara | Alcantara |
| `CL` | Tissu | Cloth |
| `FL` | Cuir | Full leather |
| `OT` | Autres | Other |
| `PL` | Cuir partiel | Part leather |
| `VL` | Velours | Velour |

### `emclass` — Norme Euro / classe d'émission — 11 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `1` | Euro 1 | Euro 1 |
| `2` | Euro 2 | Euro 2 |
| `3` | Euro 3 | Euro 3 |
| `4` | Euro 4 | Euro 4 |
| `5` | Euro 5 | Euro 5 |
| `6` | Euro 6 | Euro 6 |
| `11` | Euro 6b | Euro 6b |
| `7` | Euro 6c | Euro 6c |
| `8` | Euro 6d | Euro 6d |
| `9` | Euro 6d-TEMP | Euro 6d-TEMP |
| `10` | Euro 6e | Euro 6e |

### `ensticker` — Vignette environnementale — 5 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `1` | Aucune classification environnementale | None |
| `2` | min. 2 (Rouge) | min. 2 (Red) |
| `3` | min. 3 (Jaune) | min. 3 (Yellow) |
| `4` | min. 4 (Vert) | min. 4 (Green) |
| `5` | min. 5 (Bleu) | min. 5 (Blue) |

### `bot` — Propriété de la batterie — 3 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `1` | Incluse | Included |
| `2` | Louée | Rented |
| `3` | Sans batterie | Excluded |

### `custtype` — Type de vendeur — 2 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `P` | Particulier | Private |
| `D` | Professionnel | Dealer |

### `pricetype` — Type de prix (domaine partiel) — 2 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `private` | Particulier | Private |
| `dealer` | Professionnel | Dealer |

### `pe_category` — Évaluation du prix — 3 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `1` | Très bon prix | Very good price |
| `2` | Bon prix | Good price |
| `3` | Prix correct | Fair price |

### `prevownersid` — Nombre de propriétaires précédents — 4 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `1` | 1 | — |
| `2` | 2 | — |
| `3` | 3 | — |
| `4` | 4+ | — |

### `adage` — En ligne depuis (jours) — 8 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `1` | 1 jour | 1 day |
| `2` | 2 jours | 2 days |
| `3` | 3 jours | 3 days |
| `4` | 4 jours | 4 days |
| `5` | 5 jours | 5 days |
| `6` | 6 jours | 6 days |
| `7` | 1 semaine | 1 week |
| `14` | 2 semaines | 2 weeks |

### `sort` — Critères de tri — 10 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `price` | Prix | Price |
| `financerate` | Rate | Rate |
| `make` | Marque/Modèle | Make/Model |
| `leasing_rate` | Leasing Rate | Leasing Rate |
| `year` | Année | First registration |
| `mileage` | Kilométrage | Mileage |
| `power` | Puissance | Power |
| `age` | Annonces les plus récentes d'abord | Latest offers first |
| `standard` | Résultats standards | Best results |
| `distance` | Selon la distance | By distance |

### `cy` — Pays — 9 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `` | Europe | Europe |
| `A` | Autriche | Austria |
| `B` | Belgique | Belgium |
| `D` | Allemagne | Germany |
| `E` | Espagne | Spain |
| `F` | France | France |
| `I` | Italie | Italy |
| `L` | Luxembourg | Luxembourg |
| `NL` | Pays-Bas | Netherlands |

### `powertype` — Unité de puissance — 2 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `hp` | CH | hp |
| `kw` | kW | kW |

### Bloc « Garantie et historique » — sous-ensemble de `eq` — 5 valeurs

| Code | Libellé FR | Libellé EN |
|---|---|---|
| `37` | Garantie | Guarantee |
| `49` | Avec carnet d'entretien | With full service history |
| `53` | Filtre à particules | Particulate filter |
| `110` | Voiture non-fumeur | Non-smoking vehicle |
| `120` | HU/AU nouveau | HU/AU new |

### `sealor` — Labels / programmes d'occasion certifiée (BE, fr-BE) — 14 valeurs

Domaine **spécifique au pays et à la culture**. Chaque label est rattaché à un ou plusieurs `makeId` : le filtre n'a de sens qu'avec la marque correspondante.

| Code | Label | `makeId` concernés |
|---|---|---|
| `249` | BMW Motorrad Premium Selection | `13` |
| `247` | Hyundai H PROMISE | `33` |
| `216` | Ford Approved | `29` |
| `156` | Opel Select | `54` |
| `134` | Peugeot Occasions | `55` |
| `118` | My Way | `74`, `64`, `65`, `9`, `51802` |
| `271` | Aston Martin Timeless | `8` |
| `112` | Jaguar Approved | `37` |
| `295` | Lamborghini Certified Pre-Owned | `41` |
| `315` | Porsche Approved | `57` |
| `111` | Land Rover Approved | `15641` |
| `223` | Bentley PRE-OWNED | `11` |
| `226` | Audi Approved Plus | `9` |
| `241` | KIA Used Cars | `39` |

### `eq` — Équipements — 136 valeurs (exhaustif pour `atype=C`, fr-BE)

| Code | Libellé FR |
|---|---|
| `1` | ABS |
| `2` | Airbag conducteur |
| `3` | Airbag passager |
| `4` | Toit ouvrant |
| `5` | Climatisation |
| `6` | Sellerie cuir |
| `10` | Radio |
| `11` | 4x4 |
| `12` | Direction assistée |
| `13` | Vitres électriques |
| `15` | Jantes alliage |
| `16` | Sièges électriques |
| `17` | Verrouillage centralisé |
| `18` | Alarme |
| `19` | Feux anti-brouillard |
| `20` | Attache remorque |
| `21` | Sièges arrières 1/3 - 2/3 |
| `23` | Système de navigation |
| `25` | Pneus neige |
| `26` | Anti-démarrage |
| `27` | Porte-bagages |
| `28` | Tuning |
| `29` | Pot catalytique |
| `30` | Climatisation automatique |
| `31` | Anti-patinage |
| `32` | Airbags latéraux |
| `34` | Sièges chauffants |
| `36` | Equipement handicapé |
| `38` | Régulateur de vitesse |
| `39` | Phares au Xénon |
| `40` | Aides au stationnement |
| `41` | Ordinateur de bord |
| `42` | ESP |
| `43` | MP3 |
| `44` | Coupe vent (pour cabriolet) |
| `45` | Airbag arrière |
| `46` | Airbag avant |
| `47` | Verrouillage centralisé avec télécommande |
| `48` | Conduite à droite |
| `50` | Toit panoramique |
| `52` | Chauffage auxiliaire |
| `54` | Vitres teintées |
| `111` | Taxi ou voiture de location |
| `112` | Pack Sport |
| `113` | Start/Stop automatique |
| `114` | Volant multifonctions |
| `115` | Phares de jour |
| `116` | Suspension sport |
| `117` | Sièges sport |
| `118` | Phares directionnels |
| `119` | Trappe à ski |
| `121` | Rétroviseurs latéraux électriques |
| `122` | Bluetooth |
| `123` | Affichage tête haute |
| `124` | Dispositif mains libres |
| `125` | Isofix |
| `126` | Détecteur de lumière |
| `127` | Détecteur de pluie |
| `128` | Capteurs d'aide au stationnement avant |
| `129` | Capteurs d'aide au stationnement arrière |
| `130` | Caméra d'aide au stationnement |
| `131` | Système d'aide au stationnement automatique |
| `132` | CD |
| `133` | Régulateur de distance |
| `134` | Accoudoir |
| `135` | Pare-brise chauffant |
| `136` | Volant chauffant |
| `137` | Assistant de démarrage en côte |
| `138` | Radio numérique |
| `139` | Hayon arrière électrique |
| `140` | Phares au LED |
| `141` | LED phare de jour |
| `142` | Volant en cuir |
| `143` | Siège à réglage lombaire |
| `144` | Suspension pneumatique |
| `145` | Sièges massants |
| `146` | Système de détection de la somnolence |
| `147` | Assistant de vision nocturne |
| `148` | Assistant au freinage d'urgence |
| `149` | Système d'appel d'urgence |
| `150` | Système de contrôle de la pression pneus |
| `151` | Palettes de changement de vitesses |
| `152` | Porte coulissante |
| `153` | Verrouillage centralisé sans clé |
| `154` | Sièges ventilés |
| `155` | Soundsystem |
| `156` | Commande vocale |
| `157` | Alerte de franchissement involontaire de lignes |
| `158` | Avertisseur d'angle mort |
| `159` | Ecran tactile |
| `160` | Fonction TV |
| `161` | USB |
| `162` | Détection des panneaux routiers |
| `170` | Fonctionne au biodiesel |
| `173` | Compatible E-10 |
| `174` | Auvent |
| `187` | 360° caméra |
| `189` | Assistant feux de route |
| `190` | Système de nettoyage des phares |
| `210` | Pneus été |
| `211` | Pneus tout temps saisons |
| `212` | Jantes acier |
| `213` | Phares laser |
| `214` | Feux de route non éblouissants |
| `215` | Roue de secours |
| `216` | Roue de urgence |
| `217` | Kit de dépannage |
| `218` | Kit fumeur |
| `219` | Éclairage d'ambiance |
| `220` | Hotspot Wi-Fi |
| `221` | Apple CarPlay |
| `222` | Android Auto |
| `223` | Chargeur smartphone à induction |
| `224` | Écran multifonction entièrement numérique |
| `225` | Rétroviseur intérieur anti-éblouissement automatique |
| `226` | Séparateur pour coffre |
| `227` | Limiteur de vitesse |
| `228` | Streaming audio intégré |
| `229` | Siège passager repliable |
| `230` | Phares bi-xénon |
| `231` | Pack hiver |
| `232` | Système d'avertissement de distance |
| `233` | Réglage électrique du siège arrière |
| `237` | Prolongateur d'autonomie |
| `238` | Déflecteur |
| `239` | Phares Full LED |
| `240` | Frein de stationnement électronique |
| `241` | Climatisation automatique, bi-zone |
| `242` | Climatisation automatique, 3 zones |
| `243` | Climatisation automatique, 4 zones |
| `244` | Porte coulissante gauche |
| `245` | Porte coulissante droite |
| `248` | Sièges arrière chauffant |
| `249` | Pompe à chaleur |
| `250` | Charge bidirectionnelle |
| `251` | Certificat de batterie |

Les cinq codes exposés séparément dans le bloc « Garantie et historique » (`taxonomy.conditionEquipment`) sont : `37` Garantie, `49` Avec carnet d'entretien, `53` Filtre à particules, `110` Voiture non-fumeur, `120` HU/AU nouveau. Le code source (module `41593`) nomme en plus un ensemble « garantie et historique » restreint : `{37, 49, 110, 120}`, et une énumération plus large de labels dont `83` DEKRA_SEAL, `138` CAR_PASS, `284` NEW_CAR, `316` SPOTICAR — ces derniers relèvent de `sealor`, pas de `eq`.

### Paliers d'intervalles proposés par les sélecteurs

Ces listes sont les **suggestions du sélecteur**, pas des contraintes : les champs prix et kilométrage acceptent la saisie libre (`free_input`).

| Filtre | Paramètres | Paliers |
|---|---|---|
| Prix | `pricefrom` / `priceto` | 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12500, 15000, 17500, 20000, 25000, 30000, 40000, 50000, 75000, 100000 (EUR) |
| Kilométrage | `kmfrom` / `kmto` | 2500, 5000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 125000, 150000, 175000, 200000 (km) |
| Loyer de leasing | `leasingratefrom` / `leasingrateto` | 50, 100, 200, 300, 400, 500, 600, 700 (EUR/mois) |
| Durée de leasing | `lsdufrom` / `lsduto` | 12, 24, 36, 48, 60, 72 (mois) |
| Km annuel inclus | `lsyeinmifrom` | 10000, 15000, 20000, 25000, 30000 (km/an) |
| Mensualité de financement | `financeratefrom` / `financerateto` | 50, 100, 200, 300, 400, 500, 600, 700 (EUR/mois) |
| Autonomie électrique | `erfrom` / `erto` | 80, 120, 180, 250, 350, 450, 550 (km) |
| Rayon | `zipr` | 10, 20, 50, 100, 150, 200, 250, 300, 400 (km) |
| Nombre de portes | `doorfrom` / `doorto` | 2, 3, 4, 5, 6, 7 |
| Nombre de places | `seatsfrom` / `seatsto` | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 |
| Première immatriculation | `fregfrom` / `fregto` | 1900 → 2026, pas de 1 an (127 valeurs, ordre décroissant dans l'UI) |
| Année-modèle | `modelyearfrom` / `modelyearto` | 1900 → 2027, pas de 1 an (128 valeurs) |

### `atype` — Types de véhicules (mapping de sérialisation complet)

| Code | Type | Libellé |
|---|---|---|
| `C` | Car | Voiture |
| `B` | Bike | Moto |
| `N` | Caravan | Caravane / camping-car |
| `X` | Transporter | Utilitaire |
| `L` | Trailer | Remorque |
| `O` | Boats | Bateau |
| `W` | Watercraft | Engin nautique |
| `S` | Snowmobiles | Motoneige |
| `E` | Heavy equipment | Engin de chantier |
| `A` | Farm equipment | Engin agricole |

> Seul `atype=C` est dans le périmètre KYCAR. Les autres valeurs expliquent la présence, dans la table de sérialisation, des 16 filtres du groupe « autres `atype` » (lits, empattement, essieux, heures moteur…) dont le domaine est vide pour les voitures.

---

## Zones d'ombre

Ce qui n'a **pas** pu être établi, et pourquoi. Aucune de ces lacunes n'a été comblée par une supposition présentée comme un relevé.

### Z1 — Sémantique booléenne intra-filtre : OU ou ET ? (impact fort sur KYCAR)

La table de sérialisation donne le **séparateur** (virgule) mais **jamais la sémantique** appliquée côté moteur de recherche. Pour les énumérations de type « attribut unique du véhicule » (`fuel`, `body`, `gear`, `bcol`, `uph`…) la sémantique **OU** est logiquement contrainte : une voiture n'a qu'un carburant, donc `fuel=B,D` ne peut être qu'un OU. Le catalogue les cote donc `OU` sans réserve.

En revanche pour **`eq` (équipements)**, `OU` et `ET` sont tous deux cohérents avec la mécanique observée, et le produit suggère `ET` (on cumule des exigences d'équipement). **Cette sémantique est marquée « ET (présumé) » dans `filters.json` et n'est pas prouvée.** Le test discriminant — comparer `numberOfResults` pour `eq=5`, `eq=23` et `eq=5,23` — n'a pas été mené : il aurait coûté 3 requêtes supplémentaires au-delà du budget de 15. **Recommandation** : trancher par 3 requêtes dédiées avant de figer `EX-FILTRE-eq` en phase 2.1. Même réserve, moindre, pour `sealor` et `pe_category`.

### Z2 — Sémantique des bornes des énumérations ordonnées

`emclass` (norme Euro) et `prevownersid` (propriétaires précédents) sont sérialisés comme des **entiers uniques**, pas comme des intervalles. Le produit suggère une lecture « au moins Euro N » / « au plus N propriétaires », renforcée par le libellé du code `4` de `prevownersid` (`4+` dans la taxonomy, `>3` dans le code) et par la forme des libellés de `ensticker` (`min. 2`, `min. 3`…). **Ni l'une ni l'autre n'est prouvée par relevé** : rien dans le code client ne dit si le serveur applique `=`, `>=` ou `<=`. À vérifier par comparaison de compteurs.

### Z3 — `region` : paramètre relevé, domaine inconnu

`region` (type `string`) est dans la table de sérialisation, mais :
- `filters.provinceAndNationalBasedLocationSearch = false` et `searchMask.shared.enableProvinceCodeInLocation = false` sur BE **et** sur `.com` — le filtre est désactivé sur les deux marketplaces relevés ;
- `taxonomy` n'expose **aucune** liste de régions ;
- une valeur vide (`region=`) est rejetée par le serveur (absente de `pageQuery`).

Le **domaine de valeurs est donc inconnu**. C'est la lacune la plus gênante pour KYCAR, dont l'hypothèse H1 est « Belgique en priorité » et dont le RGPD impose (00-CONTEXT.md) de **tronquer le code postal au niveau régional** : le seul axe géographique effectivement relevé est le couple `zip` + `zipr`, c'est-à-dire un code postal exact plus un rayon. **Conséquence d'architecture** : la troncature régionale devra être calculée par KYCAR à partir du code postal (table de correspondance CP → province belge à produire), et non déléguée à un filtre `region` d'AutoScout24 qui n'est pas exploitable.

### Z4 — `damaged_listing` non activable, et `ustate` mélange deux dimensions

Deux paramètres concurrents décrivent l'état accidenté :
- `ustate` (actif) mélange **état du véhicule** et **accidenté** dans une seule valeur : `N,U` = neuf+occasion sans accidentés, `A,N,U` = avec accidentés, `A` = accidentés seuls. Il n'existe **aucun moyen relevé** de demander « occasion seule, sans les neuves » via `ustate` — c'est `offer=U` qui joue ce rôle, sur un axe séparé. Le recouvrement exact entre `ustate` et `offer` **n'a pas été établi**.
- `damaged_listing` (`exclude` / `include` / `damaged-only`) est plus propre mais **rejeté par les deux marketplaces relevés** (`newAccidentFilter=false`, `supportsDamagedOption=false`). Impossible de vérifier sa sémantique ni son exclusivité réelle avec `ustate`.

### Z5 — Filtres demandés par la mission et absents du catalogue AutoScout24

Ces filtres ont été **cherchés et ne sont pas filtrables** — l'absence est un résultat, pas un oubli :

| Filtre attendu | Statut relevé |
|---|---|
| **CO2 de / à** | **Aucun paramètre.** Ni dans la table de sérialisation, ni dans `taxonomy`. L'écologie est filtrable par `emclass`, `ensticker`, `bot`, `erfrom`/`erto` uniquement. |
| **Consommation de / à** | **Aucun paramètre.** `marketplaceFeatureToggles.footnotes.fuel` ne concerne que l'affichage de mentions légales. |
| **Puissance de charge, temps de charge, type de prise** | **Aucun paramètre.** Le domaine électrique se limite à `bot`, `erfrom`, `erto`, plus les équipements `250` Charge bidirectionnelle, `251` Certificat de batterie, `249` Pompe à chaleur, `237` Prolongateur d'autonomie. |
| **Capacité batterie (kWh)** | **Aucun paramètre.** Seule la *propriété* de la batterie (`bot`) est filtrable, pas sa capacité. |
| **Contrôle technique / prêt à immatriculer** | Pas de paramètre dédié : passe par l'équipement `120` (« HU/AU nouveau ») via `eq`. `searchMask...insuranceHuAu=false` sur BE. |
| **Garantie, entretien complet, non-fumeur** | Pas de paramètres dédiés : équipements `37`, `49`, `110` via `eq`. |
| **Présence de photos / de vidéo** | **Aucun paramètre.** Cherché dans la table de sérialisation et dans `taxonomy` : absent. |
| **Date de mise en ligne précise** | Pas de date : `adage` est une **ancienneté en jours**, bornée à 14 (8 valeurs discrètes). Aucune borne supérieure ni intervalle. |
| **Nombre de résultats par page arbitraire** | `size` existe mais n'a été observé qu'à `20`. Les autres valeurs n'ont pas été testées. |

### Z6 — Domaines dépendants non énumérables sans requête supplémentaire

- **`mmmv` / modèles / versions** : le domaine des modèles n'existe qu'une fois une marque posée (vérifié : `mmmv=54|1409||` a peuplé `taxonomy.models['54']` avec la liste des modèles Opel). L'énumération complète marque → modèle → variante est **hors périmètre de ce document** : elle relève du livrable `REF-taxonomy.md` / `data/reference/taxonomy.json` de l'agent `ref-taxonomy`. Ce document ne fournit que le **format de sérialisation** du filtre.
- **`modelVariants`, `modelGenerations`, `motorTypes`, `trimLines`** sont des clés de `taxonomy` **présentes mais vides** sur les deux relevés, et `newTaxonomyAvailable = false`. La branche `cat` / `mcat` de la « nouvelle taxonomie » est donc **codée mais inactive** sur BE et `.com` au moment du relevé. Son domaine de valeurs n'a pas pu être relevé, seul son format (`ma<makeId>gr<groupId>` / `ma<makeId>mo<modelId>`, suffixe `_<version>`) l'a été.
- **`dlv_max`** (offres avec livraison) : paramètre relevé, domaine de valeurs non relevé.
- **`lstagr`** (groupe cible du leasing) : `taxonomy.leasingTargetGroup` est vide sur les deux marketplaces. Les trois codes (`private`, `business`, `private&business`) proviennent du mapping de *tracking* (module `92526`) et non de la table de filtres ; `lstagr=private` a été accepté par le serveur, ce qui les rend plausibles mais pas exhaustifs.
- **`pricetype`** : `public` est injecté par le serveur ; `private` et `dealer` viennent de `taxonomy.priceType`. Que ces trois codes partagent réellement le même paramètre **n'est pas prouvé** — il est possible que `taxonomy.priceType` alimente un autre contrôle (affichage TVA comprise / hors TVA, cf. `dualprice-feature-be = true`).

### Z7 — Variabilité par marketplace : un filtre relevé n'est pas un filtre disponible

`marketplaceFeatureToggles.filters` montre que **le même code sert des marketplaces aux bandeaux différents**. Sur BE et `.com`, plusieurs filtres sont présents dans la table de sérialisation, **acceptés par le serveur**, mais **masqués dans l'interface** : `cylinders` (`isEngineTypeEnabled=false`), `dtrain` (`isDriveTrainEnabled=false`), `erfrom`/`erto` (`fuelTypeFilter.electricRange=false`), `ensticker` (`environmentFilter.emissionSticker=false`), `newdriver` (`powerFilter.newDriver=false`). Inversement `vatded`, `superdeal` et `pe_category` sont actifs sur BE mais pas sur `.com`.

Conséquence pour KYCAR : **le catalogue de ce document est celui du back-end**, pas celui d'une interface donnée. C'est le bon niveau pour spécifier un bandeau de filtres — mais un filtre coté `RELEVÉ` ici peut ne jamais apparaître dans l'UI AutoScout24 belge. La colonne « Remarque » de chaque fiche signale ces cas.

### Z8 — Plafond de pagination non établi

`pageProps.numberOfPages` a renvoyé **200** pour 120 779 résultats belges, ce qui suggère un plafond d'exposition à 200 × 20 = **4 000 annonces par recherche**. Les sources tierces de scraping annoncent plutôt un plafond à **20 pages** (400 annonces). **Ni l'un ni l'autre n'a été vérifié** : aucune requête sur une page élevée n'a été tentée. C'est un point dimensionnant pour l'hypothèse H5 (10⁴ à 10⁶ annonces par snapshot) : si le plafond réel est de 4 000 annonces par requête, un snapshot national exige une **stratégie de partitionnement de l'espace de recherche** (par marque, par tranche de prix…), ce qui est un sujet du chantier 1.

---

## Annexe — Fichier de données

`data/reference/filters.json` — JSON valide, 101 entrées.

```
{
  meta:         { source, extracted_at, build, primary_evidence[5], evidence_levels,
                  multi_value_rule, boolean_rule, default_omission_rule, invalid_param_behaviour }
  filters[ 101 ]: { id, param, label_fr, label_en, group, type, cardinality, separator,
                  semantics, value_format, unit, domain, default, required, dependencies,
                  evidence, note }
  enumerations: { 36 tables — offer, bodyType, fuelType, gearing, drivetrain, upholstery, bodyPainting, bodyColor, … }
}
```
