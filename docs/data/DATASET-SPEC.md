# KYCAR — Spécification du jeu de données fictif (phase 3.1, agent `dataset-design`)

**Portée** : ce document dit **quelles valeurs** portent les annonces fictives et **avec quelle loi**.
Il ne dit pas quels *champs* existent — c'est `docs/data/DATA-MODEL.md` (agent `data-model`, **livré
et fusionné**) qui les fixe, en trois couches (source `As24Listing` → adaptateur → canonique
`src/types`), avec le JSON Schema `data/schema/as24-listing.schema.json`. **Les champs sont nommés ici
par leur chemin dans le schéma source** (`prices.public.price`, `location.postalCodePrefix2`,
`wltp.consumptionCombined`…) ; le numéro entre parenthèses renvoie au dictionnaire
(`docs/requirements/draft-data-dictionary.md`, annexe A). Les **31 contraintes de cohérence** du §7 de
`DATA-MODEL.md` sont reprises une à une au **§12**, chacune rattachée à la règle ou à l'anomalie qui
la porte.

**Exécutant** : `dataset-gen` (phase 3.2). **Contrôleur** : `data-review` (phase 3.3), qui écrit ses
sondes d'après `dataset-spec/probes.json` et les fait passer **sans les modifier** (D-31/D-32).

Les tables chiffrées sont dans `docs/data/dataset-spec/*.json` — quinze fichiers, lus tels quels par
le générateur. Ce document porte les **formules**, les **justifications** et les **sondes**.

> **Longueur** : la mission plafonnait ce document à 500 lignes hors JSON. L'alignement demandé en
> cours de rédaction ajoute le §12 (les 31 contraintes, 46 lignes), 8 lignes d'anomalies, la table
> des branches de mesure et la refonte géographique — d'où ~740 lignes. Rien n'a été ajouté hors
> périmètre : le dépassement est celui de l'alignement.

---

## 0. Résumé et hypothèses majeures

### 0.1 Ce que produit la spécification

Un marché belge de l'occasion (`marketplace = be`, `location.countryCode = BE`, `vehicleType = C`) observé en
**trois snapshots hebdomadaires** (2026-09-07, -14, -21), à trois volumes : `dev` 5 000, `test`
20 000 (profil de l'application, D3-01), `perf` 100 000 annonces **par snapshot**.

**61 règles** (`R-01` … `R-61`), **26 anomalies** actives à vérité terrain (`A-01` … `A-24`, deux
retirées à l'alignement), **110 sondes** (`P-01` … `P-110`, dont `P-86` … `P-109` couvrent une à une
les 31 contraintes de `DATA-MODEL.md` §7).

### 0.2 Le fil directeur : stock = flux × durée d'exposition

Régler la composition du **stock** d'annonces sur les statistiques d'**immatriculation**, qui
décrivent un **flux**, est l'erreur qui guette tout générateur d'annonces : les deux diffèrent du
facteur **durée d'exposition**. Cette spécification pose donc **un seul paramètre**, `d`, dont
découlent deux conséquences mesurables séparément : la **composition du stock** — un coupé, qui reste
100 jours en vitrine, est sur-représenté par rapport à sa part d'immatriculation (`R-06`) — et le
**taux de sortie hebdomadaire** `1 − exp(−7/d)` (`R-51`). Réglées indépendamment, `P-65` (sorties
∈ [8 %, 12 %]) et `P-23`/`P-24` (composition) mesureraient deux modèles différents ; ici elles
mesurent le même. Valeurs obtenues : durée moyenne **67,5 j**, sortie moyenne **10,31 %/semaine**,
extrêmes 5,2 % et 16,8 %.

### 0.3 Hypothèses majeures (E4 : écrites comme hypothèses, chiffrées)

| # | Hypothèse | Valeur | Pourquoi ce n'est pas un relevé |
|---|---|---|---|
| H1 | Le **stock d'annonces** a la composition du **flux d'immatriculations d'occasion 2025** (S3) corrigé par la durée d'exposition | coefficients `r_f` de `fuel-year.json` | aucune source ne publie la composition d'un stock d'annonces belge |
| H2 | Parts de marché **par marque** au-delà du rang 5 | table `makes.json`, 50 marques nommées, queue de Zipf(1.05) | seul l'**ordre** des 5 premières est publié (S3) |
| H3 | **Segment**, **fenêtre de production** et **puissance médiane** des 217 modèles curatés | `models.json` | connaissance publique des gammes, jamais un relevé statistique |
| H4 | Vendeurs **70 % PRO / 30 % PRIVÉ** | `sellers.json` | S3 donne 90,2 % d'*acheteurs* particuliers, pas la structure des *vendeurs* ; S14 atteste un inventaire à dominante professionnelle (`adProduct.tier`) |
| H5 | Parts par **segment** et par année | `segments.json` | aucune série belge par carrosserie ; ancrage : SUV = 54 % des immatriculations européennes 2024 (S6) |
| H7 | Dépréciation **13,5 %/an**, décote initiale **15 %** | `price-model.json` | ordres de grandeur européens usuels |
| H8 | Surcote professionnelle **+6 %** | `price-model.json` | justifiée par la garantie légale de 12 mois due par un professionnel en Belgique, non mesurée |
| H9 | **35 %** des annonces professionnelles à TVA déductible | `price-model.json` | 61,6 % des immatriculations neuves 2024 sont des sociétés (S1), mais la revente passe majoritairement par le régime de la marge |
| H13 | **Tous** les taux de valeurs manquantes | `missingness.json` | aucune publication ne donne de taux de complétude par champ ; ils sont choisis pour qu'aucune branche de repli du dictionnaire ne reste inexercée |
| H15 | Durée d'exposition de référence **68 jours** | `snapshot-dynamics.json` | contrainte conjointement par la cible de sortie 8–12 % et par la composition du stock |

Hypothèses secondaires H6, H10, H11, H12, H14 : voir le champ `source` de chaque JSON.

### 0.4 Écarts assumés — décisions dues avant la porte G9a

| # | Écart | Décision demandée |
|---|---|---|
| **E-01** | La mission cite en exemple « part diesel 2015 ∈ [55 %, 65 %] ». Le modèle donne **45,1 %**, parce que le mix d'occasion 2025 relevé (26 % de diesel, S3) impose `r_D = 0,53` : les diesels de 2015 ont massivement quitté le marché belge (export, casse, zones de basses émissions de Bruxelles 2018, Anvers 2017, Gand 2020). La sonde `P-17` retient **[40 %, 50 %]**. | confirmer que la source S3 prime sur la valeur illustrative |
| **E-02** | `segment` n'est **aucun champ KYCAR** : c'est une variable latente du générateur qui conditionne carrosserie, puissance, portes, sièges, prix neuf et durée d'exposition. Elle n'est pas écrite dans la couche source. | à aligner sur `DATA-MODEL.md` : si `As24Listing` porte un champ de catégorie (`vkhFilters`/`cat`), le générateur peut l'écrire |
| ~~E-03~~ | **Tranché par D3-06** : la couche source ne porte **ni code postal exact ni commune**, seulement `location.countryCode` et `location.postalCodePrefix2`. La première rédaction de cette spec générait 79 communes ; elle est **remplacée** par une pondération au **préfixe à 2 chiffres** (§ 4.2). Un fichier versionné est une structure **persistante** : `EX-DATA-48` interdit d'y écrire le code postal exact, même fictif. | close |
| ~~E-04~~ | **Résolu par le schéma** : `createdAt`, `firstActivatedDate` et `lastUpdatedAt` existent dans la couche source. La durée d'exposition devient **observable**, et le delta inter-snapshots est vérifiable directement (`P-86`, `P-89`). | close |
| **E-05** | Le fichier est **trié** par `(make, model, firstRegistrationDate, id)`. Cet ordre améliore le taux de compression et fixe l'ordre d'ingestion sur lequel `EX-DATA-15` arbitre les doublons. | confirmer avec `dataset-gen` (impact sur l'audit de doublons) |
| **E-07** | Deux anomalies de la première rédaction sont **retirées** : `A-06` (`FIRST_REG_UNPARSEABLE`) et `A-18` (`LISTING_URL_MISSING`). Toutes deux sont **inatteignables depuis une ligne conforme au schéma** — le motif `yearMonth` rejette `2024-13`, et `webPage` est requis. `MARKETPLACE_UNMAPPED` l'est aussi (énum fermée + contrainte 14). Les déclarer en vérité terrain reviendrait à annoncer une détection que le fichier ne peut pas produire (contrainte 23). | prendre acte ; ces trois drapeaux restent couverts par les tests unitaires de l'adaptateur |
| **E-08** | L'échelle d'évaluation de prix de la **source** n'a que **3 niveaux** (`1`, `2`, `3`) : les niveaux canoniques `4` (un peu cher) et `5` (cher) n'existent pas dans un `As24Listing`. Une annonce chère n'est **pas étiquetée** — le champ est absent. Le κ d'`EX-DATA-96` n'est donc mesurable **que du côté bas** (`P-45`). | prendre acte ; `EX-DATA-12` le prévoit déjà |
| **E-06** | Les valeurs attendues des parcours (`P1_EXPECTED` 107 marques / 2 632 offres, `P2_EXPECTED` 1 352 Corsa, `ACCEPTANCE.md` §4) sont établies sur le générateur synthétique à 100 000 annonces. Elles **changent** : profil test à 20 000, nouvelles parts de marché, nouveau modèle de prix. | `mvp-integrate` recalcule et justifie ; ordres de grandeur attendus au §1.4 |

### 0.5 Ce qui est repris du générateur actuel, ce qui est corrigé

`src/providers/synthetic/` est conservé (D3-04) et sert de base.

**Repris** : le PRNG `xoshiro128**` et le tirage par table ; la génération en deux phases ; le
**tirage par hachage pur** `hashToUnit(combineKeys(seed ^ domaine, ligne))` pour les traits rares,
qui évite de décaler le flot principal ; la concentration marque/modèle (`popularity.ts`, DR-038) ;
la distinction M1 absolu / M2 relatif à la cellule avec le plancher à 250 € sur `M1_LOW` (sous ce
seuil l'annonce devient une sentinelle, sort de `V_price`, et la vérité terrain devient
infalsifiable) ; l'exclusion mutuelle sentinelle / outlier.

**Corrigé, avec le motif** :

| # | Défaut du générateur actuel | Correction |
|---|---|---|
| C-1 | `priceEvaluationCategory` est tirée d'un **bruit gaussien indépendant du prix** (`evalNoise`). M3 est alors décorrélé du juste prix : le κ d'`EX-DATA-96` vaut zéro par construction et le contrôle croisé ne mesure rien. | `R-24` : la catégorie est **dérivée** de `ln(prix/juste prix)/σ_p` par seuils, puis brouillée d'un cran avec probabilité 0,12. κ attendu ∈ [0,25 ; 0,60] (`P-45`). |
| C-2 | Marque et modèle sont tirés **multinomialement** : les effectifs par marque dérivent d'un tirage à l'autre et d'un profil à l'autre. | `R-02` : **apportionnement au plus fort reste** sur les parts. Les effectifs sont exacts (`P-08` : ±1) et proportionnels au volume du profil. |
| C-3 | Aucune **fenêtre de production** : un VW T-Roc de 1998 est généré. | `R-10` : l'âge est tiré conditionnellement à `[yearFrom, yearTo+1]` du modèle (curaté ou dérivé par hachage). Sonde `P-12` = 0 violation. |
| C-4 | Le kilométrage attendu est `âge × 14 000` **quel que soit le carburant** ; un diesel très kilométré est donc pénalisé comme un essence. | `R-11` : médiane `m_f · âge^0,90`, `m_f` par carburant (essence 12 500, diesel 19 000, PHEV diesel 25 500 km/an — S7, S8). |
| C-5 | Le prix neuf est un produit de deux **hachages sans signification** (`brandMul`, `segment`) : aucune marque n'est chère, aucun segment n'est cher, et le nuage prix/km n'a pas de structure de marché. | `R-17` : prix neuf = segment × classe de marque × carburant × puissance^0,55 × dispersion par modèle. |
| C-6 | Le mix carburant est **constant sur toutes les années** (`FUEL_WEIGHTS`) : un diesel de 2024 est aussi probable qu'un diesel de 2012. | `R-13`/`R-14` : matrice année × carburant calée sur les immatriculations belges (S1, S5, S10) et ramenée au stock (S3). |
| C-7 | Les taux d'inconnu sont **partitionnés par un seul tirage** : une annonce porte au plus **une** valeur inconnue, et les absences sont **indépendantes** entre champs. Les annonces bâclées réelles le sont sur tous leurs champs. | `R-43` : facteur latent de complétude `c ~ Beta(6,2)`, modulé par le type de vendeur et l'âge. Sonde de corrélation `P-57`. |
| C-8 | Les régions sont pondérées « grossièrement », sans structure infra-provinciale. | `R-34`/`R-35` : population Statbel 2025 par province × correction régionale relevée (S3), puis **90 préfixes postaux** pondérés (D3-06). |
| C-9 | Le générateur ne produit **qu'un snapshot** : aucune dynamique, aucun delta. | `R-50` … `R-56` : trois snapshots, sorties, entrées, révisions de prix. |
| C-10 | Les versions sont un assemblage de mots **sans lien avec le véhicule** et le budget de taille est saturé. | `R-04`/`R-33` : la version reste bornée, mais la finition est cohérente avec le segment et l'année, et les leviers de taille sont ordonnés. |
| C-11 | Le générateur ne connaît **qu'une branche de mesure** : il produirait CO₂, consommation **et** classe d'efficacité ensemble. L'OpenAPI l'interdit (`efficiencyClass` est du côté NEDC) et le schéma **rejette** la ligne. | `R-38` : la branche est choisie par la date de première immatriculation, `wltp.*` **XOR** `co2Emissions`/`consumption.*`/`efficiencyClass` (contrainte 17, C-13 de `DATA-MODEL.md`). |
| C-12 | Le générateur ne produit **aucune date d'annonce** : la durée d'exposition n'est observable nulle part. | `R-55bis` : `createdAt`, `firstActivatedDate`, `lastUpdatedAt`, ordonnés et cohérents avec `capturedAt` (contraintes 1 et 4). |

---

## 1. Cadre — `profiles.json`, `snapshot-dynamics.json`

### 1.1 Marché et volumes (`R-01`)

`marketplace = be`, un seul pays. Trois profils, trois snapshots chacun,
`snapshotId = be-fixture-<profil>-<AAAAMMJJ>-<graine hex>`.

| Profil | Annonces / snapshot | Commité | Budget gz | Marques distinctes | Cellules `(mq, md, an)` n ≥ 12 | Cellules `(mq, md)` n ≥ 30 |
|---|---:|---|---:|---:|---:|---:|
| `dev` | 5 000 | oui | 2 Mio | ≥ 120 | ≥ 10 | ≥ 20 |
| `test` | 20 000 | oui | **8 Mio** (3 fichiers) | ≥ 150 | ≥ 150 | ≥ 90 |
| `perf` | 100 000 | non | 40 Mio | ≥ 290 | ≥ 1 000 | ≥ 400 |

Ces planchers sont la **condition d'existence** d'`EX-DATA-86` (cellule de rang 1 à `n ≥ 12`) et
d'`EX-DATA-90` (`|F| ≥ 30`). Mesures du modèle : test = **168 marques**, 1 612 modèles, **199**
cellules année, **122** cellules modèle.

### 1.2 Langue du seul champ textuel (`R-36`)

Le seul texte libre d'un `As24Listing` est **`modelVersion`** (les libellés de marque, de modèle et de
finition sont des codes). Sa langue suit la région linguistique du **préfixe postal** : néerlandais
pour les cinq provinces flamandes, français pour les cinq provinces wallonnes, `fr` 0,80 / `nl` 0,20
sur les préfixes `10`–`12` (Bruxelles), `de` 0,55 sur le préfixe `47` (communauté germanophone,
79 537 habitants dans la province de Liège). **4 %** des annonces professionnelles d'un préfixe
néerlandophone sont rédigées en français et réciproquement (concessionnaires frontaliers). Sonde
`P-54`. **Contrainte 29** : `modelVersion` ne contient jamais de téléphone, de courriel ni d'URL —
la liste d'arrêt les retirerait, mais ils auraient existé dans un fichier versionné, ce que R3
interdit (`P-107`).

### 1.3 Dynamique inter-snapshots (`R-50` … `R-56`)

- **Sorties** : `p = 1 − exp(−7/d)`, `d` en jours (§ 0.2). Moyenne 10,31 %/semaine, sonde `P-65`
  ∈ [8 %, 12 %]. Une sortie est une vente **ou** un retrait : aucun champ ne les distingue.
- **Entrées** : autant que de sorties, **marque par marque** (`R-52`). L'effectif par marque est donc
  **identique sur les trois snapshots** (`P-66`) — les valeurs attendues du parcours P1 ne dérivent
  pas. Le modèle d'une entrante est retiré dans la marque : les effectifs par modèle fluctuent
  légèrement, ce qui donne matière à l'analyse de delta. Loi d'âge des entrantes inclinée de
  `exp(−0,02 · âge)` : les arrivées sont un peu plus récentes que le stock.
- **Révisions de prix** : 17 % des survivantes, 84 % à la baisse (médiane −3,5 %), 16 % à la hausse
  (médiane +2,5 %), amplitude log-normale bornée [1 %, 22 %], repassée par l'arrondi commercial.
  Effet agrégé : la médiane recule d'environ 0,5 %/semaine (`P-69`).
- **Stables** (contrainte 4) : une annonce reconduite garde son `id`, son `createdAt` et son
  `firstActivatedDate` ; **seuls** `prices.public.price`, `lastUpdatedAt` et `imageCount` peuvent
  bouger. Tout autre champ modifié est un défaut, pas une variante (`P-70`).
- **Identifiants** : une survivante **conserve** son `id` ; une entrante en reçoit un neuf, jamais
  réutilisé (`R-55`, `P-104`).
- **Dates** (`R-55bis`, contraintes 1 et 3) : `firstRegistrationDate` (au mois) ≤ `createdAt` ≤
  `firstActivatedDate` ≤ `lastUpdatedAt` ≤ `manifest.capturedAt` ; `createdAt` est tiré à
  `capturedAt(S0) − ancienneté`, l'ancienneté suivant la loi d'exposition tronquée (moyenne `d/2` en
  régime stationnaire) ; `lastUpdatedAt` n'avance qu'au snapshot où l'annonce est **révisée**.
  `nextInspectionDate` ∈ [`capturedAt` − 24 mois, `capturedAt` + 48 mois]. Sondes `P-86`, `P-88`.
- **Kilométrage** : il **ne change jamais** entre deux snapshots — la contrainte 4 ne l'autorise pas,
  et un vendeur ne remet pas son compteur à jour chaque semaine (`P-71`). La « correction de
  kilométrage » de la première rédaction est **retirée**.
- **Chaînage** (contrainte 4) : `capturedAt` strictement croissant, `previousSnapshotId` chaîné,
  `delta.carriedOverCount + delta.enteredCount = listingCount`, `publication.status = Active` sur
  100 % des lignes (`P-89`).

### 1.4 Effet attendu sur les parcours cibles

Ordres de grandeur au profil `test`, à confirmer par `mvp-integrate` : P1 (`body=3` + `priceto=20000`
+ `kmto=100000`) ≈ **500 coupés** avant filtres, ≈ **230–280 offres** après, sur ≈ 45 marques. P2 :
**Opel Corsa ≈ 505** (dont ≈ 59 en 2021, ≈ 50 en 2019), VW Golf ≈ 748, BMW 320 ≈ 197, famille
Série 3 ≈ 437.

---

## 2. Composition — `makes.json`, `models.json`, `segments.json`, `fuel-year.json`, `equipment.json`

### 2.1 Marques (`R-02`)

50 marques **nommées** (part explicite, somme 95,95 %), 245 marques de **queue** en loi de Zipf
d'exposant 1,05 sur 4,05 %. Ancrage relevé : l'ordre des cinq premières marques d'occasion 2025
(S3) — Volkswagen, BMW, Mercedes, Peugeot, Opel. Les parts individuelles sont extrapolées (H2).

**Apportionnement au plus fort reste** : répartition de `N` proportionnelle aux parts, les restes
départageant les sièges. Les effectifs sont donc **exacts**, **proportionnels** au volume du profil
et **stables entre snapshots** (`R-52`). **Plancher de présence** : les 120 premières marques
reçoivent au moins une annonce à tout profil (au profil `dev`, 39 annonces déplacées, 0,8 %).

### 2.2 Modèles (`R-03`, `R-04`)

**217 modèles curatés** sur 21 marques (`models.json`), couvrant **71,8 %** des annonces : part dans
la marque, **segment**, **fenêtre de production**, **puissance médiane**. Ancrage relevé (S4) : Golf
29 120, Polo 21 299, Corsa 18 567, Série 3 16 138, Série 1 14 793 immatriculations d'occasion 2025.

Les modèles non curatés reçoivent une part de Zipf(1,15) sur l'ordre du référentiel, un segment tiré
par **hachage stable** dans la loi `P(segment | année)` et une fenêtre de production dérivée du même
hachage (début uniforme 1985–2019, durée 6–16 ans).

**Familles** (`models.json:families`) : la taxonomie AutoScout24 éclate la BMW Série 3 en `316`,
`318`, `320`, `330` et la Classe C en `c-180`, `c-200`, `c-220`. Le parcours cible parlant de
« BMW Série 3 », `P-11` porte sur la **famille** et `P-10` sur le **modèle** le plus dense (`320`).

### 2.3 Segments et carrosseries (`R-05`, `R-06`, `R-08`)

Neuf segments latents : citadine, compacte, berline, break, SUV, monospace, utilitaire léger,
sportive, luxe. Parts **par année d'immatriculation** interpolées entre 2005, 2015, 2020 et 2026
(SUV 4 % → 45 %, monospace 8 % → 2 %) ; ancrage : 54 % de SUV dans les immatriculations européennes
2024 (S6). Le stock corrige ces parts par `stockBias` (§ 0.2) : coupés et luxe ×1,45 à ×1,50,
citadines ×0,85.

Le segment détermine ensuite, par tables : `bodyType` (+ 1 % de code `7 Autres`), `doorCount`,
`seatCount`, `drivetrain`, `upholsteryType`. La **boîte** suit
`p_auto = σ(−0,85 + 0,155·(année−2015) + a_segment)`, toute motorisation électrique étant **forcée**
en automatique (`P-26`). Couleurs : noir 23,5 %, gris 20,5 %, blanc 16,5 %, argent 11,5 % — cumul
72 % (`P-27`).

### 2.4 Matrice segment × énergie × année (`R-13` … `R-16`)

Trois étages, chiffrés dans `fuel-year.json` : **(1) flux** — mix des immatriculations **neuves** par
année, points relevés (S1, S5, S10) et interpolation linéaire (H6) : diesel 75 % en 2010 → 35,7 % en
2018 → 16,4 % en 2022 → 4,9 % en 2024 → 3,5 % en 2025, BEV 10,3 % en 2022 → 19,6 % en 2023 → 28,5 %
en 2024 ; **(2) stock** — `P(carburant | année) ∝ mix_neuf(année, f) · r_f`, renormalisé, avec
`r = {B 1,000 · D 0,530 · hybrides 0,927 · E 0,697 · autres 0,352}` **étalonné** pour que l'agrégat
sur la loi d'âge reproduise le mix d'occasion 2025 relevé (S3 : 55,6 / 26,0 / 13,3 / 4,6) — obtenu
**55,51 / 25,96 / 13,28 / 4,59** ; `r_D = 0,53` a un sens physique : les diesels anciens quittent le
marché belge (export, casse, zones de basses émissions) ; **(3) segment** — multiplicateur
`(segment, carburant)` appliqué avant renormalisation dans la cellule `(année, segment)`, diesel
×2,60 en utilitaire, ×0,45 en citadine, ×0,35 en sportive.

Valeurs de référence des sondes `P-17` … `P-21` :

| Année de 1ʳᵉ immat. | diesel | essence | hybrides | électrique |
|---|---:|---:|---:|---:|
| 2012 | 60,0 % | 37,2 % | 1,7 % | 0,1 % |
| 2015 | 45,1 % | 51,0 % | — | — |
| 2018 | 23,3 % | 68,4 % | 6,4 % | 1,0 % |
| 2020 | 15,7 % | 60,5 % | 18,9 % | 4,1 % |
| 2022 | 10,0 % | 56,4 % | 24,8 % | 8,3 % |
| 2024 | 3,0 % | 48,1 % | 25,7 % | 22,9 % |

La catégorie `2` (Électrique/Essence) couvre hybrides **et** hybrides rechargeables : `isPluginHybrid`
les sépare, avec une part interpolée (40 % en 2015, 70 % en 2020, 62 % en 2024, `P-22`).

### 2.5 Équipements (`R-47` … `R-49`)

`logit p = logit(p₀) + a·(année − 2015) + b_segment + c_vendeur`, tirage indépendant par code, coupe
à 34 codes. 34 codes portent des paramètres explicites (`equipment.json`) ; les 98 autres codes
voiture ont `p₀ = 0,03`, ce qui garantit que le vocabulaire entier est représenté. Apple CarPlay
`a = 0,34` (quasi absent avant 2015, majoritaire après 2022), jantes acier `a = −0,06` avec
`b_utilitaire = +1,3`. Médiane 16 (PRO) / 8 (PRIVÉ) — c'est aussi un **poste de taille** (§ 8.3).

---

## 3. Âge, kilométrage, prix — `age-and-mileage.json`, `price-model.json`

### 3.1 Âge (`R-09`, `R-10`)

Loi **log-normale discrétisée** sur l'âge entier, `μ = ln 7,0`, `σ = 0,58`, bornée à 40 ans, tirée
**conditionnellement à la fenêtre de production** du modèle (`R-10`, `P-12`). Mode 5 ans, **médiane
7 ans**, moyenne 8,23 ; `P(âge ≤ 3) = 11,6 %`, `P(âge ≥ 20) = 3,75 %`, `P(âge ≥ 25) = 1,42 %`,
`P(âge ≥ 30) = 0,53 %` — les oldtimers, à qui est réservé l'`offerType = O` (`P-85`). Ancrage : âge
médian à l'immatriculation d'occasion 7 ans 9 mois, parc belge ≈ 10 ans (S3), privées 9,1 ans (S2).

### 3.2 Kilométrage (`R-11`)

`km ~ LogNormale(ln m(âge, carburant), 0,35)`, `m = m_f · max(âge, 0,4)^0,90` — l'exposant
`γ = 0,90 < 1` traduit la décroissance du kilométrage annuel avec l'âge sans paramètre
supplémentaire. `m_f = 1,1746 · k_f`, `k_f` = kilométrage annuel moyen : essence 12 500, diesel
19 000, hybride essence 17 000, **hybride diesel 25 500**, électrique **19 300** (S8), GPL/CNG
16 000. Arrondi à 100 km (`P-30`), bornes [0, 420 000]. Contrôle : médiane à 5 ans ≈ **74 500 km**
(`P-28` ∈ [66 000, 84 000]), rapport diesel/essence à âge égal ≈ 1,5 (`P-29`). Ancrage :
12 000–15 000 km/an en Belgique, repères à 3 ans essence 40–50 000 / diesel 55–75 000 km (S7).

### 3.3 Prix (`R-17` … `R-25`)

```
prix_juste = 1,32 · S_segment · B_marque · F_carburant · (kW / kW_réf)^0,55
             · exp(N(0, 0,25))_modèle          ← dispersion FIXE par modelId
             · D(âge) · K(km) · T_vendeur
             · exp(N(0, 0,20))                 ← résidu de cellule
```

- `S_segment` 22 000 € (citadine) à 95 000 € (luxe) ; `1,32` = constante d'étalonnage globale.
  `B_marque` : budget 0,82 · généraliste 1,00 · premium 1,30 · exotique 2,60 (listes dans le JSON).
  `T_vendeur` : PRO ×1,06 (H8), particulier ×1,00 ; palier publicitaire ×1,00 à ×1,05.
- **Dépréciation** `D(âge) = max(0,85 · exp(−λ·âge), 0,05)`, `λ = 0,135` (13,5 %/an, H7),
  `λ = 0,168` pour l'électrique — les valeurs résiduelles des VE ont chuté plus vite entre 2023 et
  2025. Valeurs : 0,743 (1 an), 0,567 (3), 0,433 (5), 0,221 (10), 0,112 (15).
- **Kilométrage** `K = clamp(exp(−0,55 · (km − m(âge, f)) / 100 000), 0,45, 1,35)`. **La forme
  log-linéaire en km est celle qu'`EX-DATA-90` ajuste** (`y = β₀ + β₁·année + β₂·km/10⁴`) : le jeu de
  données est **bien spécifié** pour le modèle que le moteur estime, et le `R²` d'`EX-DATA-93bis` a
  un sens.
- **Dispersion par modèle** : tirage fixé par `model`. Elle écarte les modèles entre eux **sans**
  ajouter de variance *dans* une cellule d'homogénéité — la détectabilité de M2 reste celle
  qu'annonce `σ_p = 0,20`.

**Contrôles Monte-Carlo (120 000 tirages)** : médiane **15 815 €**, moyenne **19 831 €**, P10 4 407,
P25 8 642, P75 26 253, P90 39 556 ; 12 % sous 5 000 €, 5 % au-dessus de 50 000 € ;
`corr(prix, âge) = −0,530`, `corr(ln prix, âge) = −0,742` ; OLS `β₁ = +0,0768`/an,
`β₂ = −0,0381`/10 000 km (`P-31` … `P-36`). Repère externe : prix moyen d'une occasion 22 323 € en
août 2024 (S11) — le modèle est 11 % en dessous, écart assumé (le stock modélisé est plus âgé que le
panier de cette publication).

**Arrondis commerciaux** (`R-21`) : terminaison tirée dans `{990 : 0,38 · 950 : 0,24 · 900 : 0,16 ·
500 : 0,10 · 000 : 0,12}` puis `prix = 1000·round((juste − e)/1000) + e` ; grille de 100 € avec
`{0, 50, 90}` sous 1 500 €, de 5 000 € au-dessus de 100 000 €. Part attendue **78 %** (`P-39`).

**Statut de prix** (`R-22`) : il n'existe **aucun champ `priceStatus`** dans la couche source — le
statut est porté par la **forme** de `prices.public` (contraintes 5 et 6). `QUOTED` : `price` présent
avec sa `currency = EUR`. `ON_REQUEST` : `onRequestOnly = true` **et** `price` absent — 0,5 % chez les
particuliers, 3,5 % chez les professionnels, **22 %** chez les professionnels du segment luxe ou
au-dessus de 80 000 €, agrégat visé **[2 %, 5 %]** (`P-40`, `A-23`). `MISSING` : `price` absent
**sans** `onRequestOnly`, 0,6 %, déclaré `PRICE_MISSING_UNDECLARED` (`EX-DATA-18`, `P-41`, `A-24`).
**Plancher de couverture** (contrainte 10) : la part d'annonces à prix affiché reste **≥ 80 %** —
valeur visée **96,4 %** —, faute de quoi `coverageWarning.price` serait vrai sur tous les agrégats et
n'avertirait plus de rien (`P-92`).

**TVA** (`R-23`, contraintes 7 et 8) : `prices.public.isTaxDeductible` **absent à 100 % chez les
particuliers** (`P-42`), vrai pour **35 %** des annonces professionnelles renseignées (H9), inconnu
pour 6 % d'entre elles. `netPrice` et `vatRate` existent **si et seulement si** la TVA est déductible
(`P-44`) ; `netPrice = round(price / 1,21)` avec `netPrice < price` strictement, et `vatRate = 21.0`
à **une seule décimale** (`P-91`).

**Puissance** : log-normale par segment (66 kW citadine à 230 kW luxe, `σ` 0,28–0,35), remplacée par
la médiane du modèle curaté ; bornes [35, 600] kW.

**CO₂ et consommation** (`R-38` … `R-42`, `emissions.json`) — **une seule branche de mesure par
annonce** (contrainte 17, C-13 : le schéma **rejette** la ligne qui les mélange) :

| Branche | Condition | Champs servis | Champs interdits |
|---|---|---|---|
| **WLTP** | `firstRegistrationDate ≥ 2018-09` | `wltp.consumptionCombined`, `wltp.consumptionElectricCombined`, `wltp.co2EmissionsCombined`, `wltp.co2Class` | `co2Emissions`, `consumption.*`, **`efficiencyClass`** |
| **NEDC** | `firstRegistrationDate < 2018-09` | `co2Emissions`, `consumption.combined`, `consumption.electricCombined`, **`efficiencyClass`** | tout le bloc `wltp` |
| **aucune** | 6 % sous 10 ans, 18 % de 10 à 17 ans, **42 %** au-delà | `co2EmissionInGramPerKmWithFallback`, `consumptionCombinedWithFallback` seuls | — |

La troisième ligne est la **seule** façon de produire `co2Source = UNKNOWN` (`EX-DATA-35`, `P-62`).
`wltp.co2Class` n'existe qu'en branche WLTP, `efficiencyClass` qu'en branche NEDC (`P-99`).

La consommation est tirée par `(a_segment + 0,021·(kW − kW_réf)) · f_carburant ·
(1 − 0,011·(année − 2010)) · exp(N(0, 0,09))`, minorée de 21 % en branche NEDC (l'homologation
sous-estimait la consommation réelle) ; puis **le CO₂ en est déduit** par le facteur physique du
carburant — essence 23,92 g/L·100 km, diesel 26,40, CNG 18,10 (S15). Aucun bruit indépendant : c'est
ce qui rend la cohérence **testable exactement** (`P-60`, ±6 g/km). Un **électrique en branche WLTP**
ne peut pas porter 0 dans `wltp.co2EmissionsCombined` (minimum 1 du schéma, contrainte 18) : son zéro
passe par `co2EmissionInGramPerKmWithFallback` (`P-64`). Les champs `…WithFallback` portent
**exactement** la valeur retenue par la priorité `wltp > NEDC > repli` (contrainte 17, `P-97`).
Toutes les consommations, CO₂ et capacités de batterie s'écrivent avec **au plus une décimale**
(contrainte 24, `P-102`) : le générateur arrondit **avant** sérialisation, `multipleOf: 0.1` étant
faux en virgule flottante binaire.

**`prices.public.evaluation.category`** (`R-24`, correction C-1, écart E-08) : l'échelle **source**
n'a que trois niveaux. Seuils sur `d = ln(prix/juste)/σ_p` : `d < −1,0` → `1` (très bon prix),
`−1,0 ≤ d < −0,2` → `2`, `−0,2 ≤ d < 0,9` → `3`, `d ≥ 0,9` → **champ absent** (la source n'étiquette
pas les annonces chères). Déplacement d'un cran avec probabilité 0,12. C'est un **contrôle externe
imparfait mais corrélé** — la seule forme qui donne un sens au κ d'`EX-DATA-96`, mesurable **du seul
côté bas** (`P-45`). `superDeal` : professionnels seulement, catégories 1–2 seulement, 4,1 %
(`P-83`).

**Puissance en chevaux** (contrainte 16) : `powerHp = round(power / 0,7355)`, écart licite ≤ 2 % ;
au-delà, l'annonce est déclarée `POWER_UNIT_MISMATCH` — c'est la sonde d'`EX-DATA-36` (`P-95`,
`A-13b`). **Garantie** : `warranty` et `hasWarranty` chez les professionnels seulement, cohérents
entre eux (`warranty = 0` interdit `hasWarranty = true`).

---

## 4. Vendeurs et géographie — `sellers.json`, `geography.json`

### 4.1 Vendeurs (`R-26` … `R-29`)

**70 % PRO / 30 % PRIVÉ** (H4), modulé par segment (luxe ×1,9 sur la cote, citadine ×0,65) et par âge
(`logit P(D) = logit 0,70 − 0,085·(âge − 8)` : ≈ 40 % à 20 ans). Sonde `P-46`.

**`seller.dealerBucket`** (D3-02) : 90 / 320 / 1 500 concessionnaires **fictifs** selon le profil ;
taille de stock en Zipf(0,85) bornée [3, 400] — **au moins 3 annonces par bucket**, un regroupement
d'une seule annonce n'en étant pas un (contrainte 12, `P-93`) ; spécialisation sur 1 à 3 marques
couvrant 55 à 75 % du stock. La clé publiée est **8 caractères hexadécimaux minuscules**
(`^[0-9a-f]{8}$`, sans préfixe) = 32 bits de `SHA-256(sel_profil ‖ index)` : **stable sur les trois
snapshots** d'un profil (`P-49`), différente d'un profil à l'autre, **non réversible** — l'index
n'existe que dans le générateur et n'est jamais écrit (`P-81` : uniformité au khi-deux).
`seller.type = P` ⇒ `dealerBucket` **absent** (contrainte 11, `P-47`).

Palier publicitaire `adProduct.tier` : professionnels seulement ; l'**absence** du champ vaut `NONE`
dans le canonique. Part globale de tier **présent : 18,2 %**, plafonnée par la **contrainte 15** à
< 30 % — au-delà, `coverageWarning.samplingBias` serait vrai partout et le diagnostic de
représentativité perdrait son sens (`P-50`). Images : Poisson tronquée λ = 14 (PRO) / 7 (PRIVÉ),
bornée à **50** (contrainte 28), 0,6 % d'annonces sans image. Vidéo 9 % / 2 %. `publication.status`
vaut **toujours** `Active` : une annonce inactive n'est jamais servie par la surface de lecture.

**Rien d'identifiant** : les 21 champs d'`EX-DATA-47` (E1–E21) n'ont aucune table dans cette
spécification — le générateur n'a **pas la matière** pour les produire (`P-80`).

### 4.2 Géographie au préfixe postal (`R-34` … `R-37`, D3-06)

La couche source ne porte **que** `location.countryCode` et `location.postalCodePrefix2` : ni code
postal exact, ni commune, ni coordonnées. Un fichier de fixtures **est** une structure persistante,
et `EX-DATA-48` réserve le code postal complet à la portée locale d'un adaptateur de source réelle.
Le générateur **ne forme jamais** de code postal à quatre chiffres, pas même en mémoire.

Poids d'une province = **cible régionale × (population de la province / population de la région)**.
Cible régionale relevée (S3) : Flandre 55 %, Wallonie 37 %, Bruxelles 8 %. Population Statbel au
1ᵉʳ janvier 2025 (S2), total 11 825 551 habitants. Somme des poids = 100,0 (`P-51`).

| NUTS-2 | Province | Pop. 2025 | Poids | Préfixes (`EX-DATA-52`) |
|---|---|---:|---:|---|
| BE10 | Bruxelles-Capitale | 1 255 795 | 8,000 | 10–12 |
| BE21 | Anvers | 1 921 189 | 15,393 | 20–29 |
| BE22 | Limbourg | 904 919 | 7,250 | 35–39 |
| BE23 | Flandre-Orientale | 1 602 532 | 12,839 | 90–99 |
| BE24 | Brabant flamand | 1 204 541 | 9,651 | 15–19, 30–34 |
| BE25 | Flandre-Occidentale | 1 231 585 | 9,868 | 80–89 |
| BE31 | Brabant wallon | 415 381 | 4,148 | 13–14 |
| BE32 | Hainaut | 1 365 328 | 13,634 | 60–65, 70–79 |
| BE33 | Liège | 1 122 925 | 11,214 | 40–49 |
| BE34 | Luxembourg | 296 008 | 2,956 | 66–69 |
| BE35 | Namur | 505 348 | 5,046 | 50–59 |

Les 13 plages d'`EX-DATA-52` commencent toutes sur un **multiple de 100** : le préfixe à 2 chiffres
suffit à résoudre la province, sans perte (contrainte 13). Le poids d'un préfixe **dans** sa province
vaut `40 + Σ(populations communales connues du bloc, en milliers)`, renormalisé sur le poids de la
province (H10) — la constante 40 représente la population du bloc hors des 79 communes de référence.
Cela donne une densité plausible : `20` (Anvers-ville et sa proche périphérie) pèse 4,76 % du pays,
`10` (Bruxelles-ville) 5,13 %, contre 0,26 % pour un préfixe rural.

**`REGION_UNRESOLVED`** (`R-37`, `A-21`) : l'intervalle `10`–`99` couvrant sans trou, le seul moyen
d'exercer ce drapeau par le préfixe est d'émettre un préfixe **`00`–`09`** — 0,4 % des annonces
(`P-53`). Un second chemin existe (`A-19`, 0,05 %) : `location.countryCode ≠ BE`, qui rend
`regionCode` inconnu quel que soit le préfixe (`EX-DATA-55`). Le profil `be` ne contient aucune autre
annonce transfrontalière : le filtre `countryType`/`cy` reste à une valeur et le graphe G15 par pays
est masqué.

---

## 5. Valeurs manquantes — `missingness.json` (`R-43` … `R-46`)

**Deux natures d'absence, jamais confondues.** **(1) Structurelle** (`R-45`) : le champ est **sans
objet** — autonomie électrique d'un diesel, TVA déductible d'un particulier, cylindrée d'un
électrique, `efficiencyClass` d'une annonce WLTP. Absence à 100 %, ce n'est pas un défaut de
complétude et cela n'entre dans aucun taux (`P-59`). **(2) De complétude** (`R-43`, `R-46`) :
`p_effectif = p_champ · g(c) · h(vendeur) · k(âge)`, facteur latent `c ~ Beta(6, 2)` par annonce,
`g(c) = clamp(2 − 2c, 0,15, 2,2)`, `h = {PRO 0,75 · PRIVÉ 1,55}`,
`k = 1 + 0,045·max(âge − 8, 0)` plafonné à 2,2. **Une seule variable latente produit la corrélation**
entre absences : une annonce bâclée l'est sur tous ses champs, ce qu'un tirage indépendant par champ
ne reproduit jamais (`P-57` ∈ [0,10 ; 0,40]). *(Une troisième nature, l'absence provoquant un rejet
d'ingestion, est retirée à l'alignement : `webPage` étant requis par le schéma, la ligne serait
rejetée à la génération — écart E-07.)*

Taux de référence `p_champ` — **clés = chemins du schéma source** (table complète dans le JSON),
jamais uniformes, de 0 % (`id`, `webPage`, `make`, `location.countryCode`, `seller.type`) à 88 %
(`prices.manufacturersSuggestedRetail.price`). `mileage` 1,8 % · `power` 2,5 % · `productionYear`
6,0 % · `drivetrain` 12 % · `co2Emissions` 18 % · `euEmissionStandard` 22 % · `cylinderCount` 26 % ·
`wltp.co2Class` 28 % · `upholsteryType` 28 % · `gearCount` 31 % · `efficiencyClass` 34 % ·
`previousOwnerCount` 38 % · `nextInspectionDate` 62 % · `wasCabOrRental` et `appliedSeals` 78 % ·
**`paintType` 82 %** (contrainte 30 : le champ n'a jamais été observé sur la source, un remplissage
systématique ferait passer une hypothèse pour un fait — `P-108`). Sondes `P-55` (±25 % relatifs),
`P-56` (écart-type des taux > 0,15 : la non-uniformité est **mesurée**), `P-58` (l'équipement manque
1,8 fois plus souvent chez les particuliers).

Les taux sont choisis pour qu'**aucune branche de repli atteignable ne reste inexercée** :
`EX-DATA-5` (unité non gérée), `EX-DATA-10` (repli création → recherche), `EX-DATA-11` (hybride non
résolu), `EX-DATA-18` (prix absent non déclaré), `EX-DATA-32` (prix sur demande), `EX-DATA-52`
(préfixe non résolu), `EX-DATA-72` (modèle non identifié) reçoivent chacune au moins 20 annonces au
profil `test`. Les branches **inatteignables** depuis une ligne conforme au schéma
(`FIRST_REG_UNPARSEABLE`, `LISTING_URL_MISSING`, `MARKETPLACE_UNMAPPED`) ne sont **pas** exercées ici
et ne figurent pas au manifest (contrainte 23, `P-101`).

---

## 6. Anomalies contrôlées — `anomalies.json` (`R-57`, `R-58`, `A-01` … `A-24`)

**Principe** (`R-57`) : une anomalie est **injectée après** le calcul de la valeur plausible, et la
valeur plausible est **conservée au manifest**. Une anomalie dont la valeur plausible n'est pas
conservée n'est pas une vérité terrain : elle n'est pas falsifiable. **Exclusion mutuelle** (`R-58`) :
une annonce porte au plus une anomalie **de prix**.

| Id | Anomalie | Code manifest | Taux | Détection attendue |
|---|---|---|---:|---|
| A-01 | prix sentinelle (1, 11, 99, 111, 123, 150, 199, 249 €) | `PRICE_SENTINEL_ABSOLUTE` | 0,10 % | drapeau à l'ingestion, exclusion de `V_price` |
| A-02 | prix hors domaine (> 5 000 000 €) | `PRICE_OUT_OF_RANGE` | 0,02 % | valeur mise à INCONNU |
| A-03 | 0 km alors que `offerType ∉ {N, S, D}` | `SUSPECT_ZERO_MILEAGE` | 0,25 % | exclusion de `V_mileage` (contrainte 21) |
| A-04 | kilométrage implausible pour l'âge (deux formes) | `MILEAGE_IMPLAUSIBLE_FOR_AGE` | 0,30 % | borne `km·12/âge_mois ≤ 200 000` (contrainte 22) |
| A-04b | kilométrage hors domaine (> 2 000 000 km) | `MILEAGE_OUT_OF_RANGE` | 0,03 % | valeur mise à INCONNU |
| A-05 | 1ʳᵉ immatriculation hors bornes (année + 2, ou 1899-12) | `FIRST_REG_OUT_OF_RANGE` | 0,08 % | valeur INCONNUE, aucune cellule de rang 1 |
| ~~A-06~~ | ~~date non analysable~~ | — | — | **retirée** : inatteignable (contrainte 23) |
| A-07 | même `id` écrit deux fois | `DUPLICATE_LISTING_ID` | 0,10 % | unicité violée volontairement (contrainte 26) |
| A-07b | republication intra-vendeur, prix différent de 1–4 % | `DUPLICATE_VALUE_CONFLICT` | 0,25 % | audit de doublons |
| A-08 | quasi-doublon inter-vendeurs (prix ±2–9 %, km ±0–400) | `CROSS_SELLER_DUPLICATE` | 0,80 % | paire à `dealerBucket` **différents** + `peerListingId` |
| A-09 | version entièrement dépouillée au nettoyage | `VERSION_FULLY_STRIPPED` | 0,40 % | `modelVersionClean` vide |
| A-09b | version ambiguë (autre marque ; puissance contredite) | `VERSION_AMBIGUOUS` | 1,10 % | recherche par mots-clés, sonde version/puissance |
| A-10 | **outlier M1** (haut 500 k–3 M€ ; bas 260–480 €) | `OUTLIER_M1_LOW/HIGH` | 0,25 % | barrières de Tukey, rappel ≥ 90 % |
| A-11 | **outlier M2** (facteur 0,30–0,50 ou 2,0–3,2 ; `\|z\| ≥ 3,5`) | `OUTLIER_M2_LOW/HIGH` | 0,35 % | écart robuste au modèle, rappel ≥ 85 % |
| A-12 | annonce incomplète (≥ 6 champs optionnels absents) | `OTHER` | 2,00 % | rapport d'ingestion, aucune exclusion |
| A-13 | puissance hors domaine (1 ou 9999) | `POWER_OUT_OF_RANGE` | 0,05 % | valeur mise à INCONNU |
| A-13b | `powerHp` s'écarte de 6 à 25 % de `power / 0,7355` | `POWER_UNIT_MISMATCH` | 0,06 % | sonde d'`EX-DATA-36` (contrainte 16) |
| A-14 | CO₂ nul sur thermique | `CO2_ZERO_NON_BEV` | 0,12 % | drapeau, valeur écartée des moyennes |
| A-15 | `isPluginHybrid` avec `fuelCategory ∉ {2, 3, O}` | `HYBRID_INCONSISTENT` | 0,08 % | **pas de correction silencieuse** (contrainte 19) |
| A-16 | `fuelCategory` absente sur un hybride (deux branches) | `HYBRID_CATEGORY_UNRESOLVED` | 0,10 % | `EX-DATA-10` et `EX-DATA-11` |
| A-17 | `mileageUnit = mi` | `UNIT_UNSUPPORTED` | 0,45 % | conversion **refusée** |
| ~~A-18~~ | ~~annonce sans deeplink~~ | — | — | **retirée** : `webPage` requis par le schéma |
| A-19 | `location.countryCode ≠ BE` | `REGION_UNRESOLVED` | 0,05 % | `regionCode` INCONNU (`EX-DATA-55`) |
| A-20 | prix sur demande **avec** montant | `PRICE_ON_REQUEST_WITH_AMOUNT` | 0,04 % | montant non retenu (contrainte 5) |
| A-21 | préfixe postal `00`–`09` | `REGION_UNRESOLVED` | 0,40 % | seul chemin par le préfixe (contrainte 13) |
| A-22 | champ `model` absent | `MODEL_UNRESOLVED` | 1,20 % | zone `modelId = 0` (`EX-DATA-72`) |
| A-23 | prix sur demande (décision de vendeur, déclarée) | `PRICE_ON_REQUEST` | 3,00 % | compte dans l'effectif, jamais dans `V_price` |
| A-24 | prix absent **sans** `onRequestOnly` | `PRICE_MISSING_UNDECLARED` | 0,60 % | état distinct d'`ON_REQUEST` (contrainte 6) |

Taux cumulé **12,18 %** (dont 3,6 points pour les deux états de prix déclarés `A-23`/`A-24`, qui ne
sont pas des défauts). Le manifest publie pour chacune le **code**, l'effectif, le taux réalisé et la
liste des `id` **avec valeur avant et après** ; `A-10` et `A-11` portent en outre la méthode, le
drapeau attendu et le juste prix, `A-08` porte `peerListingId`. **Ce que le reviewer doit retrouver**
est écrit anomalie par anomalie dans `anomalies.json` (champ `aRetrouver`).

**Corollaire de la contrainte `DATA-MODEL` §7** : une violation **délibérée** d'une contrainte de
cohérence est licite **à la seule condition** d'être déclarée dans `manifest.groundTruth` avec son
code. Les codes de l'énumération du manifest sont tous couverts, **sauf** `FIRST_REG_UNPARSEABLE` et
`MARKETPLACE_UNMAPPED`, inatteignables (`P-101`).

Deux garde-fous hérités du générateur actuel et conservés : `M1_LOW` ne descend **jamais** sous
250 € (sinon l'annonce devient une sentinelle, sort de `V_price` et la vérité terrain devient
invérifiable) ; les M1 et les M2 injectés sont **disjoints**, ce qui rend mesurable le taux d'accord
`M1_M2_AGREE_*`.

---

## 7. Sondes attendues — `probes.json` (`P-01` … `P-110`)

`probes.json` est le **contrat** entre `dataset-design`, `dataset-gen` et `data-review` : identifiant,
règle visée, famille, statistique, tolérance, portée (snapshot / profil). Le reviewer les écrit et
les fait passer **sans les modifier** ; le générateur les traite comme une spécification, jamais
comme un test à ajuster. **110 sondes** : `P-01` … `P-85` couvrent les distributions de cette
spécification, `P-86` … `P-109` couvrent **une à une les 31 contraintes de cohérence** de
`DATA-MODEL.md` §7 (colonne `regle` = `DM-nn`, table de correspondance au §12), `P-110` la couverture
de la table curatée de modèles.

Exemples de tolérances : diesel 2015 ∈ [40 %, 50 %] (`P-17`, écart E-01) · médiane km à 5 ans
∈ [66 000, 84 000] (`P-28`) · `corr(ln prix, âge) < −0,65` (`P-33`) · TVA déductible chez les
particuliers = 0 % (`P-42`) · 100 % des couples code postal/commune dans la table (`P-52`) ·
`ON_REQUEST` ∈ [2 %, 5 %] (`P-40`) · sorties inter-snapshots ∈ [8 %, 12 %] (`P-65`) · effectif par
marque identique sur les trois snapshots (`P-66`) · rappel de M1 ≥ 90 % (`P-75`).

**Sonde de couverture fonctionnelle** (`P-82`, `R-61`) : chaque filtre retenu de
`data/reference/filters-scope.json` de classe énumérée ou bornée doit avoir **au moins deux valeurs
distinctes** représentées dans le snapshot, **ou** figurer dans la liste des filtres non alimentés
publiée par le manifest. Un filtre que les données n'alimentent pas est un filtre qui ne peut pas
être exercé par la recette : il doit être **nommé**, jamais découvert à l'usage.

---

## 8. Déterminisme et taille — `profiles.json` (`R-30` … `R-33`)

### 8.1 Déterminisme

Graine par défaut **`0x4B594341`** ; graine du snapshot `k` = saut du flot `xoshiro128**` depuis
celle du profil, les trois snapshots restant reproductibles séparément. **Ordre des tirages figé**
ligne par ligne : tout trait rare (repli d'ingestion, anomalie, valeur manquante) est tiré par
**hachage pur** `hash(graine ⊕ domaine, ligne)` et **ne consomme pas** le flot principal — sans quoi
ajouter une règle décalerait tout l'aval et invaliderait des sondes vertes qu'aucun défaut n'a
cassées. Sondes `P-03` (mêmes octets à graine égale), `P-04` (≥ 99 % d'`id` différents sinon).

### 8.2 Ordre du fichier et des clés (`R-32`, écart E-05)

Tri des **lignes** par `(make, model, firstRegistrationDate, id)`. Les lignes voisines partagent
leurs préfixes : le taux de compression y gagne, et l'ordre d'ingestion sur lequel `EX-DATA-15`
arbitre les doublons est fixé (`P-06`). Ordre des **clés** JSON fixe et identique sur toutes les
lignes (contrainte 25, `P-103`) : c'est à la fois une condition du déterminisme octet à octet et le
premier levier de compression. `manifest.sha256` porte sur les octets **non compressés** — la sortie
gzip dépend de la version de zlib et ne prouverait rien (contrainte 31, `P-109`).

### 8.3 Budget de taille (`R-33`)

Profil `test` : 3 × 20 000 = 60 000 lignes pour **8 Mio** gz, soit **139,8 octets par ligne
compressée**. Recommandations, dans l'ordre où elles doivent être appliquées :

1. **Codes, jamais libellés** : `"D"` et non `"Diesel"`, `"11"` et non `"Noir"`. Les libellés sont au
   référentiel, pas dans les données.
2. **Champ absent, jamais `null`** : une valeur inconnue est une **clé absente**. Cela réalise le
   modèle de valeurs manquantes du §5, supprime 6 à 10 octets par champ absent, et c'est ce que le
   schéma attend (`additionalProperties: false` partout, aucun `null` admis).
3. **Ordre de clés identique sur toutes les lignes** : la fenêtre de gzip réutilise le motif.
4. **Images comptées, jamais listées** : `imageCount` seul (`EX-DATA-44`, E18), borné à 50.
5. **Aucun espace superflu** ; une ligne = un objet JSON compact.
6. **Équipements en codes numériques** dans un tableau ; c'est le poste variable dominant.

Leviers si le budget est dépassé, dans cet ordre : (1) réduire la verbosité de `modelVersion` ;
(2) abaisser `maxCodes` d'équipement de 34 à 24 ; (3) sortir le profil `dev` du dépôt. L'`id` est
conservé en forme canonique 8-4-4-4-12 minuscule (contrainte 26) par fidélité à AutoScout24, au prix
de 4 octets par ligne — c'est un choix assumé, pas un oubli ; `webPage` en coûte une cinquantaine et
n'est pas compressible autrement que par le préfixe commun, que le tri du fichier maximise.
**La mesure est obligatoire à la génération** (`P-05`).

---

## 9. Paramètres lisibles machine — `docs/data/dataset-spec/*.json`

Quinze fichiers, chacun porteur d'une clé `source` (relevés **et** hypothèses) et d'un `$comment`
renvoyant aux règles.

| Fichier | Contenu | Règles |
|---|---|---|
| `profiles.json` | profils, snapshots, graines, budgets, ordre du fichier | R-01, R-30 … R-33 |
| `makes.json` | 295 marques, parts, apportionnement, plancher de présence | R-02 |
| `models.json` | 217 modèles curatés (part, segment, fenêtre, kW), familles, queue | R-03, R-04 |
| `segments.json` | segments par année, biais de stock, carrosserie, portes, sièges, boîte, couleurs, sellerie, prix neuf, puissance | R-05 … R-08, R-17 |
| `fuel-year.json` | mix neuf par année, coefficients de stock, ajustement segment, part PHEV, autonomie, batterie | R-13 … R-16 |
| `age-and-mileage.json` | loi d'âge, fenêtres de production, kilométrage, état, type d'offre, propriétaires | R-09 … R-12 |
| `price-model.json` | dépréciation, facteur km, primes, arrondis, statut, TVA, évaluation, superDeal | R-17 … R-25 |
| `emissions.json` | consommation, CO₂, `co2Source`, norme Euro, classes, filtre à particules | R-38 … R-42 |
| `sellers.json` | PRO/PRIVÉ, `dealerBucket`, palier publicitaire, images, champs exclus | R-26 … R-29 |
| `geography.json` | 11 provinces pondérées, **90 préfixes postaux**, langues | R-34 … R-37 |
| `missingness.json` | facteur latent, taux par champ, absences structurelles | R-43 … R-46 |
| `equipment.json` | 34 codes paramétrés + résiduels | R-47 … R-49 |
| `snapshot-dynamics.json` | durée d'exposition, sorties, entrées, révisions | R-50 … R-56 |
| `anomalies.json` | 26 anomalies actives (+ 2 retirées) : code manifest, taux, mécanisme, détection, exigence, ce que le reviewer retrouve | R-57, R-58 |
| `probes.json` | 110 sondes : règle, statistique, tolérance, portée | contrat |

---

## 10. Sources

Relevées par recherche publique le **2026-09-09**. Aucune requête vers `autoscout24.*`, `2dehands`
ou `marktplaats` (E5) : les constats issus d'AutoScout24 proviennent de relevés antérieurs déjà
versionnés dans le dépôt (S9, S14).

| # | Source | Ce qui en est tiré |
|---|---|---|
| S1 | FEBIAC, *Analyse du marché automobile belge en 2024* — `https://www.febiac.be/fr/news/analyse-du-marche-automobile-belge-en-2024` | mix neuf 2024 : essence 41,8 %, BEV 28,5 %, PHEV 14,9 %, HEV 9,2 %, diesel 4,9 % ; occasion 2024 : essence 55,1 %, diesel 30,6 % ; sociétés 61,6 % du neuf |
| S2 | Statbel, population légale au 1ᵉʳ janvier 2025, via Moustique — `https://www.moustique.be/notre-epoque/les-infos/2025/06/11/voici-combien-il-y-a-dhabitants-dans-chaque-province-de-belgique-au-total-on-se-rapproche-des-12-millions-EZK5XWGJ6ZG6JD6WVEUTF3QPKM/` | population des 10 provinces + Bruxelles, total 11 825 551 ; communauté germanophone 79 537 |
| S3 | TRAXIO, *Immatriculations automobiles 2025* — `https://www.traxio.be/fr/articles/immatriculations-automobiles-2025-poursuite-de-la-hausse-des-vehicules-d-occasion-0-9-qui-representent-desormais-63-9-du-marche-total` | 734 165 occasions (63,9 % du marché) ; classement des marques ; mix occasion essence 55,6 / diesel 26,0 / hybride 13,3 / électrique 4,6 ; 90,2 % de particuliers ; âge médian 7 ans 9 mois ; Flandre 55 / Wallonie 37 / Bruxelles 8 |
| S4 | TRAXIO, mêmes données, classement des modèles | Golf 29 120 · Polo 21 299 · Corsa 18 567 · Série 3 16 138 · Série 1 14 793 |
| S5 | RTBF, *Voitures diesel : plus que 3 % des immatriculations neuves* — `https://www.rtbf.be/article/11723650` | diesel neuf 35,7 % (2018), 31,1 % (2019), 3,5 % (2025), 2,8 % (S1 2026) ; pic historique ≈ 80 % |
| S6 | Auto-Infos / Motor1, segments européens 2024 — `https://www.auto-infos.fr/article/les-segments-b-et-c-suv-dominent-encore-le-marche-europeen.286021` | SUV = 54 % des immatriculations européennes 2024 |
| S7 | Moniteur Automobile, *Quel kilométrage pour une occasion de trois ans* — `https://www.moniteurautomobile.be/conseils-auto/generalites/cest-quoi-le-bon-kilometrage-pour-une-voiture-doccasion-de-trois-ans.html` | 12 000–15 000 km/an en Belgique ; repères à 3 ans : essence 40–50 000, diesel 55–75 000, hybride 35–55 000, électrique 30–55 000 km |
| S8 | Car-Pass, rapport annuel 2024 (relayé par la presse spécialisée) | hybride rechargeable diesel 25 463 km/an ; électrique 19 281 km/an |
| S9 | `data/reference/taxonomy.json` et `data/reference/references/*.json` (relevés AutoScout24 du 2026-09-05, versionnés) | 295 marques, 4 955 modèles, vocabulaires : 132 équipements voiture, 9 carrosseries, 11 catégories de carburant, 14 couleurs, 11 normes Euro |
| S10 | RTBF / FEBIAC, bilans 2022 et 2023 — `https://www.rtbf.be/article/pour-la-troisieme-annee-consecutive-le-nombre-de-vehicules-immatricules-a-baisse-en-2022-11146597` | 2022 : essence 48,9 %, diesel 16,4 %, PHEV 16,2 %, BEV 10,3 % ; 2023 : essence 43,7 %, BEV 19,6 % |
| S11 | mozzeno, *Le prix d'une voiture en Belgique (2025)* — `https://www.mozzeno.com/fr/blog/prix-voiture-occasion/` (403 au moment de la relecture, valeurs relevées par la recherche) | prix moyen d'une occasion 24 382 € (août 2023) → 22 323 € (août 2024) |
| S12 | `docs/plans/PLAN-3-fixture-data-mvp.md` §3.1–3.2 | volumes, budget gz, critères S1–S5 |
| S13 | `reports/data/DATA-LEAD-DECISIONS.md` | D3-01 profil par défaut, D3-02 `dealerBucket`, D3-03 NDJSON gz, D3-04 générateur conservé |
| S14 | `docs/research/FINDING-allowed-surface.md` §2.3, §2.5, P2 | 40 champs servis par la source réelle ; `seller.contactName` porte un nom de personne (R3) ; `adProduct.tier` atteste un inventaire à dominante professionnelle |
| S15 | Facteurs d'émission carbone des carburants routiers (valeurs de référence européennes) | essence 2 392 g CO₂/L, diesel 2 640 g CO₂/L |
| S16 | Calendrier WLTP européen | homologation obligatoire pour toute immatriculation neuve à partir du 1ᵉʳ septembre 2018 |
| S17 | `docs/requirements/draft-data-dictionary.md` `EX-DATA-52` | 13 plages de codes postaux → 11 codes NUTS-2, toutes alignées sur des multiples de 100 |
| S18 | `docs/data/DATA-MODEL.md` (agent `data-model`) et `data/schema/*.schema.json` | chemins de champ `As24Listing`, D3-06 (préfixe postal seul), C-13 (exclusion NEDC/WLTP), les 31 contraintes du §7, énumération `groundTruth[].anomaly` du manifest |

---

## 11. Critères S3 de la phase 3.1 — liste de contrôle

> S3 : « `DATASET-SPEC.md` : chaque distribution a une **formule**, des **paramètres chiffrés**, une
> **justification** et une **sonde**. »

| Distribution | Formule | Paramètres | Justification | Sonde | ✓ |
|---|---|---|---|---|---|
| Parts de marque | apportionnement + Zipf(1,05) | `makes.json` (295) | S3 (ordre relevé), H2 | P-07 … P-09 | ✅ |
| Parts de modèle | table curatée + Zipf(1,15) | `models.json` (217) | S4 (volumes relevés), H3 | P-10, P-11 | ✅ |
| Fenêtre de production | conditionnement de la loi d'âge | `models.json`, hachage | correction C-3 | P-12 | ✅ |
| Segments par année | interpolation 4 pivots | `segments.json` | S6, H5 | P-23, P-24 | ✅ |
| Biais de stock | flux × durée d'exposition | `stockBias`, 0,85–1,50 | §0.2 | P-24, P-65 | ✅ |
| Carrosserie / portes / sièges / roues motrices | tables par segment | `segments.json` | vocabulaire S9 | P-23, P-24 | ✅ |
| Boîte de vitesses | logistique en année × segment | `a₀ = −0,85`, `a₁ = 0,155` | électrification | P-25, P-26 | ✅ |
| Couleur / sellerie | tables pondérées | `segments.json` | H5 | P-27 | ✅ |
| Âge | log-normale discrétisée | `μ = ln 7,0`, `σ = 0,58` | S3 (médiane 7 a 9 m), S2 | P-13 … P-15 | ✅ |
| Carburant × année | mix neuf × `r_f` × ajustement segment | `fuel-year.json` | S1, S5, S10 → S3 (étalonnage) | P-16 … P-21 | ✅ |
| Part PHEV | interpolation | 40 % → 62 % | S1 (HEV/PHEV 2024) | P-22 | ✅ |
| Kilométrage | log-normale, médiane `m_f · âge^0,90` | `k_f` par carburant, `σ = 0,35` | S7, S8 | P-28 … P-30 | ✅ |
| Prix | produit log-normal, dépréciation exponentielle | `λ = 0,135` / `0,168`, `β = 0,55`, `σ_p = 0,20` | H7, forme d'`EX-DATA-90` | P-31 … P-38 | ✅ |
| Arrondis commerciaux | terminaison tirée puis recalage | 990/950/900/500/000 | usage du marché | P-39 | ✅ |
| Statut de prix | tirage conditionnel vendeur × segment | 0,5 / 3,5 / 22 % | H4, luxe | P-40, P-41 | ✅ |
| TVA déductible | conditionnel PRO | 35 %, inconnu 6 % | S1, H9 | P-42 … P-44 | ✅ |
| Évaluation de prix (M3) | seuils sur `ln(prix/juste)/σ_p` + brouillage 0,12, **3 niveaux** | `price-model.json` | correction C-1, écart E-08 | P-45 | ✅ |
| Puissance | log-normale par segment | 66 → 230 kW | H3 | (P-35 indirect) | ✅ |
| Consommation | linéaire en kW, décroissante en année | `emissions.json` | H12 | P-60 | ✅ |
| CO₂ | **dérivé** de la consommation | 23,92 / 26,40 / 18,10 | S15 (physique) | P-60, P-64 | ✅ |
| Branche de mesure | WLTP **XOR** NEDC, par date de 1ʳᵉ immat. | seuil 2018-09 | S16, S18 (C-13) | P-61, P-96, P-99 | ✅ |
| `co2Source = UNKNOWN` | aucune branche, seuls les `…WithFallback` | 6 / 18 / 42 % | `EX-DATA-35` | P-62, P-97 | ✅ |
| `wltp.co2Class` / `efficiencyClass` | seuils sur CO₂, **branches exclusives** | `emissions.json` | S18 (C-13) | P-99 | ✅ |
| Norme Euro | table par année | `emissions.json` | S9 | P-63 | ✅ |
| Type de vendeur | logistique en âge × segment | 70/30 | H4, S14 | P-46 | ✅ |
| `dealerBucket` | Zipf(0,85) sur le stock + hachage salé | 90 / 320 / 1 500 | D3-02 | P-47 … P-49, P-81 | ✅ |
| Palier publicitaire | table PRO, croissante avec le stock | `sellers.json` | S14 | P-50 | ✅ |
| Provinces | cible régionale × population | `geography.json` | S2, S3 | P-51 | ✅ |
| Préfixes postaux | poids = `40 + Σ pop. communale connue`, renormalisé | 90 préfixes | H10, S17, D3-06 | P-52, P-53 | ✅ |
| Langue de `modelVersion` | région linguistique du préfixe + 4 % de croisement | `geography.json` | H11 | P-54, P-107 | ✅ |
| Valeurs manquantes | `p_champ · g(c) · h(vendeur) · k(âge)` | 60 taux, `Beta(6,2)` | H13, correction C-7 | P-55 … P-59 | ✅ |
| Équipements | logit en année × segment × vendeur | 34 codes + résiduel | H14 | (P-55, P-58) | ✅ |
| Durée d'exposition | `68 · m_seg · (P/15 000)^0,18 · (1 + 0,012(âge−8)) · m_vendeur` | `snapshot-dynamics.json` | H15, §0.2 | P-65 | ✅ |
| Sorties / entrées | `1 − exp(−7/d)`, entrées = sorties par marque | mesuré 10,31 % | §0.2 | P-65 … P-67 | ✅ |
| Révisions de prix | log-normale, 84 % à la baisse | 17 %, médiane 3,5 % | marché stationnaire | P-68 … P-71 | ✅ |
| Anomalies A-01 … A-20 | injection après valeur plausible | `anomalies.json` | EX-DATA-5/10/11/14/15/18/19/23/45/88/90 | P-72 … P-77 | ✅ |
| Densité de cellules | plancher par profil | 150 / 90 au profil test | EX-DATA-86, 90 | P-78, P-79 | ✅ |
| Dates d'annonce | ancienneté = loi d'exposition tronquée, ordre imposé | `snapshot-dynamics.json` | S18 (contraintes 1, 3, 4) | P-86, P-88 | ✅ |
| Déterminisme et taille | graine, ordre des lignes et des clés, budget, hachage | `profiles.json` | S12, S18 | P-01 … P-06, P-103, P-109 | ✅ |

**Non couvert, assumé** : `financeRate*`, `leasing*`, `governmentBonus`, `tradeIn`, `buyOnline`,
`radius`, `crossBorder`, `newDriver`, `emissionSticker` (vignette allemande) — filtres retenus au
catalogue mais **sans champ correspondant** au dictionnaire KYCAR. Le manifest les publie dans la
liste des **filtres non alimentés** (`P-82`) plutôt que de les laisser découvrir à la recette.


---

## 12. Alignement `DATA-MODEL.md` — les 31 contraintes de cohérence

`DATA-MODEL.md` §7 énumère 31 contraintes inter-champs que le JSON Schema ne peut pas exprimer.
Chacune est ici portée par une **règle** de génération (`R-nn`) ou, quand la violation est
**délibérée**, par une **anomalie déclarée** (`A-nn`) — ce que la contrainte autorise expressément.
Chacune a sa sonde.

| # | Contrainte | Portée par | Sonde |
|---:|---|---|---|
| 1 | ordre `firstRegistrationDate ≤ createdAt ≤ firstActivatedDate ≤ lastUpdatedAt ≤ capturedAt` | `R-55bis` (dates dérivées de la loi d'exposition) | `P-86` |
| 2 | `firstRegistrationDate ∈ [1900-01, (capturedAt.year+1)-12]` | `R-10` (fenêtres de production) ; violation déclarée **`A-05`** | `P-87` |
| 3 | `nextInspectionDate ∈ [capturedAt − 24 m, + 48 m]` | `R-55bis` | `P-88` |
| 4 | chaînage des snapshots ; annonce reconduite : seuls prix, `lastUpdatedAt`, `imageCount` bougent | `R-52`, `R-53`, `R-54` | `P-89`, `P-70`, `P-71` |
| 5 | `onRequestOnly = true` ⇒ `price` absent | `R-22` ; violation déclarée **`A-20`** | `P-90`, `P-40` |
| 6 | `price` absent sans drapeau ⇒ `PRICE_MISSING_UNDECLARED` | `R-22` ; déclarée **`A-24`** | `P-41` |
| 7 | `isTaxDeductible = true` ⇒ `seller.type = D` (≈ 35 % des pros) | `R-23` | `P-42`, `P-43` |
| 8 | `netPrice < price` ; `vatRate` à une décimale ; `currency = EUR` | `R-23` | `P-44`, `P-91` |
| 9 | `price < 250` ⇒ sentinelle ; `> 5 000 000` ⇒ hors domaine | **`A-01`**, **`A-02`** | `P-77`, `P-72` |
| 10 | part de prix affichés ≥ 80 % (valeur visée 96,4 %) | `R-22` (plancher de couverture) | `P-92` |
| 11 | `dealerBucket` présent ⟺ `seller.type = D` | `R-27` | `P-47` |
| 12 | un bucket groupe ≥ 3 annonces ; doublon inter-vendeurs = buckets différents + `peerListingId` | `R-27` ; **`A-08`** | `P-93`, `P-48` |
| 13 | `countryCode = BE` ; préfixe ∈ `10`..`99` ; `00`..`09` ⇒ `REGION_UNRESOLVED` | `R-34`, `R-35`, `R-37` ; **`A-21`**, **`A-19`** | `P-52`, `P-53` |
| 14 | `manifest.marketplace` = `marketplace` de chaque ligne | `R-01` | `P-94` |
| 15 | part d'`adProduct.tier` présent < 30 % (valeur visée 18,2 %) | `R-28` (plafond) | `P-50` |
| 16 | `powerHp = round(power / 0,7355)`, écart licite ≤ 2 % | `R-17` ; violation déclarée **`A-13b`** | `P-95` |
| 17 | une seule branche de mesure ; `…WithFallback` = valeur retenue | `R-38`, `R-38bis` | `P-96`, `P-97`, `P-61` |
| 18 | électrique : CO₂ = 0 hors `wltp.co2EmissionsCombined` | `R-38` (règle électrique WLTP) ; **`A-14`** pour le CO₂ nul sur thermique | `P-64` |
| 19 | `isPluginHybrid` ⇒ `fuelCategory ∈ {2, 3, O}` | `R-16` ; violation déclarée **`A-15`** | `P-98` |
| 20 | champs électriques réservés à `{E, 2, 3}` ; `cylinder*` absents pour `E` | `R-45` (absences structurelles) | `P-59`, `P-99` |
| 21 | `mileage = 0` admis seulement si `offerType ∈ {N, S, D}` | `R-12` ; violation déclarée **`A-03`** | `P-84` |
| 22 | `mileage × 12 / max(âge_mois, 6) ≤ 200 000` | `R-11` ; violation déclarée **`A-04`** | `P-100` |
| 23 | ne pas déclarer `FIRST_REG_UNPARSEABLE` | anomalie **`A-06` retirée** (écart E-07) | `P-101` |
| 24 | au plus une décimale sur consommations, CO₂, batterie | `R-38ter` (arrondi avant sérialisation) | `P-102` |
| 25 | ordre des clés stable | `R-32` | `P-103` |
| 26 | `id` unique, minuscules, 8-4-4-4-12 | `R-55` ; violation déclarée **`A-07`**, **`A-07b`** | `P-104` |
| 27 | `webPage` contient l'`id` et l'hôte du marché | `R-30` (dérivation déterministe) | `P-105` |
| 28 | `imageCount ≤ 50` ; `equipment` sans doublon | `R-29`, `R-48` | `P-106` |
| 29 | `modelVersion` sans téléphone, courriel ni URL | `R-36`, `R-04` ; **`A-09`**, **`A-09b`** restent dans le texte licite | `P-107` |
| 30 | `paintType` majoritairement absent | `R-46` (taux 82 %) | `P-108` |
| 31 | `manifest.sha256` sur les octets non compressés | `R-30`, `R-33` | `P-109` |

**Conséquences de l'alignement sur la première rédaction** : deux anomalies retirées (`A-06`,
`A-18`), une famille géographique entièrement refaite (79 communes → 90 préfixes), une branche de
mesure introduite (`efficiencyClass` n'est plus servie qu'en NEDC), l'échelle d'évaluation ramenée à
trois niveaux, `dealerBucket` reformaté sans préfixe, `adTier` ramené de 34 % à 18,2 % pour tenir
sous le plafond de la contrainte 15, et 25 sondes ajoutées.
