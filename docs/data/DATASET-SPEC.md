# KYCAR — Spécification du jeu de données fictif (phase 3.1, agent `dataset-design`)

**Portée** : ce document dit **quelles valeurs** portent les annonces fictives et **avec quelle loi**.
Il ne dit pas quels *champs* existent — c'est `docs/data/DATA-MODEL.md` (agent `data-model`) qui les
fixe, en trois couches (source `As24Listing` → adaptateur → canonique `src/types`). Les champs cités
ici le sont **au nom du dictionnaire** (`docs/requirements/draft-data-dictionary.md`, annexe A,
82 champs) ; toute divergence de nommage se règle en faveur de `DATA-MODEL.md` (§ 0.4).

**Exécutant** : `dataset-gen` (phase 3.2). **Contrôleur** : `data-review` (phase 3.3), qui écrit ses
sondes d'après `dataset-spec/probes.json` et les fait passer **sans les modifier** (D-31/D-32).

Les tables chiffrées sont dans `docs/data/dataset-spec/*.json` — quinze fichiers, lus tels quels par
le générateur. Ce document porte les **formules**, les **justifications** et les **sondes**.

---

## 0. Résumé et hypothèses majeures

### 0.1 Ce que produit la spécification

Un marché belge de l'occasion (`marketplace = be`, `countryCode = B`, `vehicleType = C`) observé en
**trois snapshots hebdomadaires** (2026-09-07, -14, -21), à trois volumes : `dev` 5 000, `test`
20 000 (profil de l'application, D3-01), `perf` 100 000 annonces **par snapshot**.

**61 règles** (`R-01` … `R-61`), **20 anomalies** à vérité terrain (`A-01` … `A-20`),
**85 sondes** (`P-01` … `P-85`).

### 0.2 Le fil directeur : stock = flux × durée d'exposition

Une erreur de conception guette tout générateur d'annonces : régler la composition du **stock**
d'annonces sur les statistiques d'**immatriculation**, qui décrivent un **flux**. Les deux diffèrent
d'un facteur, la **durée d'exposition** d'une annonce sur le marché. Cette spécification pose donc
**un seul paramètre**, la durée d'exposition `d`, dont découlent **deux conséquences mesurables
séparément** :

- la **composition du stock** — un coupé, qui reste 100 jours en vitrine, est sur-représenté dans les
  annonces par rapport à sa part d'immatriculation (`R-06`, `segments.json:stockBias`) ;
- le **taux de sortie hebdomadaire** entre snapshots, `1 − exp(−7/d)` (`R-51`).

Un jeu de données où ces deux grandeurs sont réglées indépendamment est incohérent : la sonde `P-65`
(sorties ∈ [8 %, 12 %]) et les sondes de composition (`P-23`, `P-24`) mesurent alors deux modèles
différents. Ici elles mesurent le même. Valeurs obtenues : durée moyenne **67,5 j**, taux de sortie
moyen **10,31 %/semaine**, extrêmes 5,2 % et 16,8 %.

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
| **E-03** | Le **code postal** et la **commune** sont générés dans la couche **source** (`location.zip`, `location.city`), alors qu'`EX-DATA-47` les exclut (E8, E9) de la couche **canonique**. `EX-DATA-48` les qualifie de valeurs **transitoires** de l'adaptateur. Ils sont ici **purement fictifs et sans vendeur attaché** : le risque R3 est nul, et sans eux la normalisation géographique (`regionCode`, `postalCodePrefix2`, `REGION_UNRESOLVED`) n'est exercée par aucune donnée. | à aligner sur `DATA-MODEL.md` (couche source) ; si le modèle les refuse aussi en source, la spec se replie sur `regionCode` seul et les sondes `P-52`/`P-53` tombent |
| **E-04** | Aucun champ du dictionnaire ne porte la **date de publication** ni l'**ancienneté** d'une annonce. La durée d'exposition reste **interne** au générateur ; seul `isNewListing` en est observable. | si `As24Listing` porte `publication.*` (le plan cite « dates de publication »), le générateur les écrira et `P-65` gagne une vérification directe |
| **E-05** | Le fichier est **trié** par `(makeId, modelId, firstRegistrationYearMonth, listingId)`. Cet ordre améliore le taux de compression et fixe l'ordre d'ingestion sur lequel `EX-DATA-15` arbitre les doublons. | confirmer avec `dataset-gen` (impact sur l'audit de doublons) |
| **E-06** | Les valeurs attendues des parcours (`P1_EXPECTED` 107 marques / 2 632 offres, `P2_EXPECTED` 1 352 Corsa, `ACCEPTANCE.md` §4) sont établies sur le générateur synthétique à 100 000 annonces. Elles **changent** : profil test à 20 000, nouvelles parts de marché, nouveau modèle de prix. | `mvp-integrate` recalcule et justifie ; ordres de grandeur attendus au §1.4 |

### 0.5 Ce qui est repris du générateur actuel, ce qui est corrigé

`src/providers/synthetic/` est conservé (D3-04) et sert de base.

**Repris** : le PRNG `xoshiro128**` déterministe et le tirage par table ; la génération en deux
phases ; le **tirage par hachage pur** `hashToUnit(combineKeys(seed ^ domaine, ligne))` pour les
traits rares, qui évite de décaler le flot principal (contrainte de déterminisme documentée dans
`generate.ts`) ; le principe de la concentration marque/modèle (`popularity.ts`, DR-038) ; la
distinction M1 absolu / M2 relatif à la cellule, avec le plancher à 250 € sur `M1_LOW` (sous ce
seuil l'annonce devient une sentinelle, sort de `V_price` et la vérité terrain deviendrait
infalsifiable) ; l'exclusion mutuelle sentinelle / outlier ; les drapeaux d'ingestion par table
unique `INGEST_FLAG_BIT`.

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
| C-8 | Les régions sont pondérées « grossièrement » et il n'y a **ni code postal ni commune**. | `R-34`/`R-35` : population Statbel 2025 par province × correction régionale relevée (S3), 79 communes avec leur code postal réel. |
| C-9 | Le générateur ne produit **qu'un snapshot** : aucune dynamique, aucun delta. | `R-50` … `R-56` : trois snapshots, sorties, entrées, révisions de prix. |
| C-10 | Les versions sont un assemblage de mots **sans lien avec le véhicule** et le budget de taille est saturé. | `R-04`/`R-33` : la version reste bornée, mais la finition est cohérente avec le segment et l'année, et les leviers de taille sont ordonnés. |

---

## 1. Cadre — `profiles.json`, `snapshot-dynamics.json`

### 1.1 Marché et volumes (`R-01`)

`marketplace = be`, un seul pays : le filtre `countryType`/`cy` reste à une valeur et le graphe G15
par pays est masqué (comportement déjà constaté en recette). Trois profils, trois snapshots chacun,
`snapshotId = be-fixture-<profil>-<AAAAMMJJ>-<graine hex>`.

| Profil | Annonces / snapshot | Commité | Budget gz | Marques distinctes | Cellules `(mq, md, an)` n ≥ 12 | Cellules `(mq, md)` n ≥ 30 |
|---|---:|---|---:|---:|---:|---:|
| `dev` | 5 000 | oui | 2 Mio | ≥ 120 | ≥ 10 | ≥ 20 |
| `test` | 20 000 | oui | **8 Mio** (3 fichiers) | ≥ 150 | ≥ 150 | ≥ 90 |
| `perf` | 100 000 | non | 40 Mio | ≥ 290 | ≥ 1 000 | ≥ 400 |

Ces planchers sont la **condition d'existence** des règles d'effectif : `EX-DATA-86` (cellule de
rang 1 à `n ≥ 12`) et `EX-DATA-90` (`|F| ≥ 30`). Mesures du modèle (§ 2.2) : test = **168 marques**,
1 612 modèles, **199** cellules année, **122** cellules modèle.

### 1.2 Langues des libellés (`R-36`)

La langue suit la **commune** du véhicule : néerlandais pour les cinq provinces flamandes, français
pour les cinq provinces wallonnes, `fr` 0,80 / `nl` 0,20 à Bruxelles, `de` pour les codes postaux
4700–4790 (communauté germanophone, 79 537 habitants dans la province de Liège). **4 %** des annonces
professionnelles d'une commune néerlandophone sont rédigées en français et réciproquement
(concessionnaires frontaliers). Sonde `P-54`.

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
- **Stables** : une survivante non révisée est **identique champ à champ**, hors `snapshotId`,
  `observedAt` et `isNewListing` (`P-70`). C'est ce qui rend un diff de snapshots lisible.
- **Identifiants** : une survivante **conserve** son `listingId` ; une entrante en reçoit un neuf,
  jamais réutilisé (`R-55`).
- **Kilométrage** : il **ne change pas** entre deux snapshots — un vendeur ne remet pas son compteur
  à jour chaque semaine. Exception : 0,6 % de corrections (`P-71`).

### 1.4 Effet attendu sur les parcours cibles

Ordres de grandeur au profil `test` (20 000), à confirmer par `mvp-integrate` :
P1 (`body=3` + `priceto=20000` + `kmto=100000`) ≈ **500 coupés** avant filtres de prix et de
kilométrage, ≈ **230–280 offres** après, réparties sur ≈ 45 marques. P2 : **Opel Corsa ≈ 505
annonces**, dont ≈ 59 de première immatriculation 2021 et ≈ 50 de 2019 ; VW Golf ≈ 748 ; BMW 320
≈ 197, famille Série 3 ≈ 437.

---

## 2. Composition — `makes.json`, `models.json`, `segments.json`, `fuel-year.json`, `equipment.json`

### 2.1 Marques (`R-02`)

50 marques **nommées** (part explicite, somme 95,95 %), 245 marques de **queue** en loi de Zipf
d'exposant 1,05 sur 4,05 %. Ancrage relevé : l'ordre des cinq premières marques d'occasion 2025
(S3) — Volkswagen, BMW, Mercedes, Peugeot, Opel. Les parts individuelles sont extrapolées (H2).

**Apportionnement au plus fort reste** : `n_marque = ` répartition de `N` proportionnelle aux parts,
les restes départageant les sièges. Deux conséquences : les effectifs sont **exacts** et
**proportionnels** au volume du profil, et ils sont **stables entre snapshots** (`R-52`).
**Plancher de présence** : les 120 premières marques reçoivent au moins une annonce, quel que soit le
profil (au profil `dev` cela déplace 39 annonces, soit 0,8 %).

### 2.2 Modèles (`R-03`, `R-04`)

**217 modèles curatés** sur 21 marques (`models.json`), couvrant **71,8 %** des annonces : part dans
la marque, **segment**, **fenêtre de production**, **puissance médiane**. Ancrage relevé (S4) : Golf
29 120, Polo 21 299, Corsa 18 567, Série 3 16 138, Série 1 14 793 immatriculations d'occasion 2025.

Les modèles non curatés reçoivent une part de Zipf(1,15) sur l'ordre du référentiel, un segment tiré
par **hachage stable** dans la loi `P(segment | année)` et une fenêtre de production dérivée du même
hachage (début uniforme 1985–2019, durée 6–16 ans).

**Familles** (`models.json:families`) : la taxonomie AutoScout24 éclate la BMW Série 3 en `316`,
`318`, `320`, `330` et la Mercedes Classe C en `c-180`, `c-200`, `c-220`. Le parcours cible parle de
« BMW Série 3 » ; la sonde `P-11` porte donc sur la **famille**, la sonde `P-10` sur le **modèle
unique** le plus dense (`320`).

### 2.3 Segments et carrosseries (`R-05`, `R-06`, `R-08`)

Neuf segments latents : citadine, compacte, berline, break, SUV, monospace, utilitaire léger,
sportive, luxe. Parts **par année d'immatriculation** interpolées entre 2005, 2015, 2020 et 2026
(SUV 4 % → 45 %, monospace 8 % → 2 %) ; ancrage : 54 % de SUV dans les immatriculations européennes
2024 (S6). Le stock corrige ces parts par `stockBias` (§ 0.2) : coupés et luxe ×1,45 à ×1,50,
citadines ×0,85.

Le segment détermine ensuite, par tables : carrosserie `KYCAR_BODY_TYPE` (+ 1 % de code `7 Autres`),
portes, sièges, roues motrices, sellerie. La **boîte** suit une logistique
`p_auto = σ(−0,85 + 0,155·(année−2015) + a_segment)` — toute motorisation électrique est **forcée**
en automatique (`P-26` = 0 exception). Couleurs : noir 23,5 %, gris 20,5 %, blanc 16,5 %,
argent 11,5 % — cumul 72 % (`P-27`).

### 2.4 Matrice segment × énergie × année (`R-13` … `R-16`)

Trois étages, tous chiffrés dans `fuel-year.json` :

1. **Flux** : mix des immatriculations **neuves** par année, points relevés (S1, S5, S10) et
   interpolation linéaire entre eux (H6). Diesel 75 % en 2010 → 35,7 % en 2018 → 16,4 % en 2022 →
   4,9 % en 2024 → 3,5 % en 2025 ; BEV 10,3 % en 2022 → 19,6 % en 2023 → 28,5 % en 2024.
2. **Stock** : `P(carburant | année) ∝ mix_neuf(année, f) · r_f`, renormalisé.
   `r = {B 1,000 · D 0,530 · hybrides 0,927 · E 0,697 · autres 0,352}`, **étalonné** pour que
   l'agrégat sur la loi d'âge reproduise le mix d'occasion relevé 2025 (S3 : essence 55,6 %, diesel
   26,0 %, hybrides 13,3 %, électrique 4,6 %). Résultat obtenu : **55,51 / 25,96 / 13,28 / 4,59**.
   `r_D = 0,53` a un sens physique : les diesels anciens quittent le marché belge (export, casse,
   zones de basses émissions).
3. **Segment** : multiplicateur `(segment, carburant)` appliqué avant renormalisation dans la cellule
   `(année, segment)` — diesel ×2,60 en utilitaire, ×0,45 en citadine, ×0,35 en sportive.

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
voiture du référentiel ont `p₀ = 0,03`, ce qui garantit que le vocabulaire entier est représenté.
Effet attendu : Apple CarPlay `a = 0,34` (quasi absent avant 2015, majoritaire après 2022), jantes
acier `a = −0,06` avec `b_utilitaire = +1,3`. Médiane : 16 équipements chez un professionnel, 8 chez
un particulier — c'est aussi un **poste de taille** (§ 8.3).

---

## 3. Âge, kilométrage, prix — `age-and-mileage.json`, `price-model.json`

### 3.1 Âge (`R-09`, `R-10`)

Loi **log-normale discrétisée** sur l'âge entier, `μ = ln 7,0`, `σ = 0,58`, bornée à 40 ans.
Mode 5 ans, **médiane 7 ans**, moyenne 8,23 ans ; `P(âge ≤ 3) = 11,6 %`, `P(âge ≥ 20) = 3,75 %`,
`P(âge ≥ 25) = 1,42 %`, `P(âge ≥ 30) = 0,53 %` — c'est la population des oldtimers, à laquelle est
réservé le type d'offre `O (Ancêtre)` (`P-85`). Ancrage : âge médian à l'immatriculation d'occasion
7 ans 9 mois, parc belge ≈ 10 ans (S3), voitures privées 9,1 ans (S2).

L'âge est tiré **conditionnellement à la fenêtre de production** du modèle (`R-10`, `P-12`).

### 3.2 Kilométrage (`R-11`)

`km ~ LogNormale(ln m(âge, carburant), 0,35)`, avec `m = m_f · max(âge, 0,4)^0,90`.
L'exposant `γ = 0,90 < 1` traduit la décroissance du kilométrage annuel avec l'âge sans paramètre
supplémentaire. `m_f = 1,1746 · k_f`, `k_f` = kilométrage annuel moyen : essence 12 500, diesel
19 000, hybride essence 17 000, **hybride diesel 25 500**, électrique **19 300** (S8), GPL/CNG 16 000.
Arrondi à 100 km (`P-30`), bornes [0, 420 000].

Contrôle : médiane à 5 ans ≈ **74 500 km** (sonde `P-28` ∈ [66 000, 84 000]), rapport diesel/essence
à âge égal ≈ 1,5 (`P-29`). Ancrage : 12 000–15 000 km/an en Belgique, repères à 3 ans essence
40–50 000 km / diesel 55–75 000 km (S7).

### 3.3 Prix (`R-17` … `R-25`)

```
prix_juste = 1,32 · S_segment · B_marque · F_carburant · (kW / kW_réf)^0,55
             · exp(N(0, 0,25))_modèle          ← dispersion FIXE par modelId
             · D(âge) · K(km) · T_vendeur
             · exp(N(0, 0,20))                 ← résidu de cellule
```

- `S_segment` : 22 000 € (citadine) à 95 000 € (luxe) ; `1,32` est la constante d'étalonnage globale.
- `B_marque` : budget 0,82 · généraliste 1,00 · premium 1,30 · exotique 2,60 (listes dans
  `price-model.json`).
- **Dépréciation** `D(âge) = max(0,85 · exp(−λ·âge), 0,05)`, `λ = 0,135` (13,5 %/an, H7),
  `λ = 0,168` pour l'électrique — les valeurs résiduelles des VE ont chuté plus vite entre 2023 et
  2025. Valeurs : 0,743 à 1 an, 0,567 à 3 ans, 0,433 à 5 ans, 0,221 à 10 ans, 0,112 à 15 ans.
- **Kilométrage** `K = clamp(exp(−0,55 · (km − m(âge, f)) / 100 000), 0,45, 1,35)`.
  **La forme log-linéaire en km est celle qu'`EX-DATA-90` ajuste** (`y = β₀ + β₁·année + β₂·km/10⁴`) :
  le jeu de données est donc **bien spécifié** pour le modèle que le moteur estime, et le `R²` publié
  par `EX-DATA-93bis` a un sens.
- **Dispersion par modèle** : tirage fixé par `modelId`. Elle écarte les modèles entre eux **sans**
  ajouter de variance *à l'intérieur* d'une cellule d'homogénéité — la détectabilité de M2 reste
  celle qu'annonce `σ_p = 0,20`.
- `T_vendeur` : PRO ×1,06 (H8), particulier ×1,00 ; palier publicitaire ×1,00 à ×1,05.

**Contrôles Monte-Carlo (120 000 tirages)** : médiane **15 815 €**, moyenne **19 831 €**,
P10 4 407 €, P25 8 642 €, P75 26 253 €, P90 39 556 € ; 12 % sous 5 000 €, 5 % au-dessus de 50 000 € ;
`corr(prix, âge) = −0,530`, `corr(ln prix, âge) = −0,742` ; OLS `β₁ = +0,0768` par année,
`β₂ = −0,0381` par 10 000 km. Sondes `P-31` … `P-36`. Ordre de grandeur externe : prix moyen d'une
occasion 22 323 € en août 2024 (S11) — le modèle est 11 % en dessous, écart assumé (le parc d'annonces
modélisé est plus âgé que le panier moyen de cette publication).

**Arrondis commerciaux** (`R-21`) : une terminaison est tirée dans `{990 : 0,38 · 950 : 0,24 ·
900 : 0,16 · 500 : 0,10 · 000 : 0,12}` puis `prix = 1000·round((juste − e)/1000) + e` ; grille de
100 € avec terminaisons `{0, 50, 90}` sous 1 500 €, de 5 000 € au-dessus de 100 000 €. Part attendue
de terminaisons commerciales : **78 %** (`P-39` ∈ [70 %, 88 %]).

**Statut de prix** (`R-22`) : `ON_REQUEST` 0,5 % chez les particuliers, 3,5 % chez les
professionnels, **22 %** chez les professionnels du segment luxe ou au-dessus de 80 000 € — agrégat
visé **[2 %, 5 %]** (`P-40`). `MISSING` 0,6 %, toujours accompagné de `PRICE_MISSING_UNDECLARED`
(`EX-DATA-18`, `P-41`).

**TVA** (`R-23`) : `isTaxDeductible` **absent à 100 % chez les particuliers** (`P-42`), vrai pour
**35 %** des annonces professionnelles renseignées (H9), inconnu pour 6 % d'entre elles.
`netPriceEur` et `vatRatePercent` existent **si et seulement si** la TVA est déductible (`P-44`).

**Puissance** : log-normale par segment (66 kW citadine à 230 kW luxe, `σ` 0,28–0,35), remplacée par
la médiane du modèle quand il est curaté ; bornes [35, 600] kW ; `powerHp = round(kW / 0,7355)`.

**CO₂ et consommation** (`R-38` … `R-42`, `emissions.json`) : la consommation est tirée
(`a_segment + 0,021·(kW − kW_réf)) · f_carburant · (1 − 0,011·(année − 2010)) · exp(N(0, 0,09))`,
puis **le CO₂ en est déduit** par le facteur physique du carburant — essence 23,92 g/L·100 km, diesel
26,40, CNG 18,10 (S15). Aucun bruit indépendant : c'est ce qui rend la cohérence **testable
exactement** (`P-60`, tolérance ±6 g/km). `co2Source = WLTP` pour toute première immatriculation
≥ **2018-09**, `NEDC` avant (S16), `UNKNOWN` 6 % sous 10 ans et **42 %** au-delà de 17 ans (`P-61`,
`P-62`). Les valeurs NEDC sont minorées de 21 % par rapport à la formule WLTP. CO₂ = 0 pour 100 % des
électriques (`P-64`).

**`priceEvaluationCategory`** (`R-24`, correction C-1) : catégorie par seuils sur
`d = ln(prix/juste)/σ_p`, puis déplacement d'un cran avec probabilité 0,12. C'est un **contrôle
externe imparfait mais corrélé** — la seule forme qui donne un sens au κ d'`EX-DATA-96` (`P-45`).
`isSuperDeal` : professionnels seulement, catégories 1–2 seulement, 4,1 % au total (`P-83`).

---

## 4. Vendeurs et géographie — `sellers.json`, `geography.json`

### 4.1 Vendeurs (`R-26` … `R-29`)

**70 % PRO / 30 % PRIVÉ** (H4), modulé par segment (luxe ×1,9 sur la cote, citadine ×0,65) et par âge
(`logit P(D) = logit 0,70 − 0,085·(âge − 8)` : ≈ 40 % à 20 ans). Sonde `P-46`.

**`dealerBucket`** (D3-02) : 90 / 320 / 1 500 concessionnaires **fictifs** selon le profil ; taille de
stock en Zipf(0,85) bornée [3, 400] ; spécialisation sur 1 à 3 marques couvrant 55 à 75 % du stock.
La clé publiée est `bkt_` + 8 caractères hexadécimaux = 32 bits de `SHA-256(sel_profil ‖ index)` :
**stable sur les trois snapshots** d'un profil (`P-49`), différente d'un profil à l'autre, et
**non réversible** — l'index n'existe que dans le générateur et n'est jamais écrit (`P-81` :
distribution uniforme au khi-deux). `sellerType = P` ⇒ `dealerBucket` **absent** (`P-47`).

Palier publicitaire `adTier` : professionnels seulement, 34 % à un palier non nul, probabilité
croissante avec la taille du stock (`P-50`). Images : Poisson tronquée λ = 14 (PRO) / 7 (PRIVÉ),
0,6 % d'annonces sans image. Vidéo 9 % / 2 %.

**Rien d'identifiant** : les 21 champs d'`EX-DATA-47` (E1–E21) n'ont aucune table dans cette
spécification — le générateur n'a **pas la matière** pour les produire (`P-80`).

### 4.2 Géographie (`R-34` … `R-37`)

Poids d'une province = **cible régionale × (population de la province / population de la région)**.
Cible régionale relevée (S3) : Flandre 55 %, Wallonie 37 %, Bruxelles 8 %. Population Statbel au
1ᵉʳ janvier 2025 (S2), total 11 825 551 habitants. Somme des poids = 100,0 (`P-51`).

| NUTS-2 | Province | Pop. 2025 | Poids | Codes postaux |
|---|---|---:|---:|---|
| BE10 | Bruxelles-Capitale | 1 255 795 | 8,000 | 1000–1299 |
| BE21 | Anvers | 1 921 189 | 15,393 | 2000–2999 |
| BE22 | Limbourg | 904 919 | 7,250 | 3500–3999 |
| BE23 | Flandre-Orientale | 1 602 532 | 12,839 | 9000–9999 |
| BE24 | Brabant flamand | 1 204 541 | 9,651 | 1500–1999, 3000–3499 |
| BE25 | Flandre-Occidentale | 1 231 585 | 9,868 | 8000–8999 |
| BE31 | Brabant wallon | 415 381 | 4,148 | 1300–1499 |
| BE32 | Hainaut | 1 365 328 | 13,634 | 6000–6599, 7000–7999 |
| BE33 | Liège | 1 122 925 | 11,214 | 4000–4999 |
| BE34 | Luxembourg | 296 008 | 2,956 | 6600–6999 |
| BE35 | Namur | 505 348 | 5,046 | 5000–5999 |

La **commune** est tirée au poids dans la province parmi 79 communes réelles (H10) ; **le code postal
est celui de la commune**, jamais tiré séparément : la cohérence `(code postal, commune, province)`
est garantie par construction (`P-52`, `P-53`). 0,4 % des annonces portent un code postal hors plage
(saisie fautive) : l'adaptateur pose `REGION_UNRESOLVED`.

---

## 5. Valeurs manquantes — `missingness.json` (`R-43` … `R-46`)

**Trois natures d'absence, jamais confondues.**

1. **Structurelle** (`R-45`) : le champ est **sans objet** — autonomie électrique d'un diesel, TVA
   déductible d'un particulier, cylindrée d'un électrique. Absence à 100 %, ce n'est pas un défaut de
   complétude et cela ne compte dans aucun taux (`P-59`).
2. **De complétude** (`R-43`, `R-46`) : `p_effectif = p_champ · g(c) · h(vendeur) · k(âge)` avec un
   facteur latent `c ~ Beta(6, 2)` par annonce, `g(c) = clamp(2 − 2c, 0,15, 2,2)`,
   `h = {PRO 0,75 · PRIVÉ 1,55}`, `k = 1 + 0,045·max(âge − 8, 0)` plafonné à 2,2.
   **Une seule variable latente produit la corrélation** entre absences : une annonce bâclée l'est
   sur tous ses champs, ce qu'un tirage indépendant par champ ne reproduit jamais (`P-57` : corrélation
   attendue ∈ [0,10 ; 0,40]).
3. **De rejet** (`A-18`) : la ligne source est écrite puis **rejetée** par l'adaptateur
   (`listingUrl` absent, `EX-DATA-14`). Elle n'entre pas dans le lot ; le motif figure au rapport
   d'ingestion.

Taux de référence `p_champ` (extraits, table complète dans le JSON) : jamais uniformes, de 0 %
(`listingId`, `makeId`, `priceStatus`, `sellerType`) à 88 % (`msrpEur`). `mileageKm` 1,8 % ·
`powerKw` 2,5 % · `modelYear` 6,0 % · `drivetrain` 12 % · `co2EmissionsGPerKm` 18 % ·
`euEmissionStandard` 22 % · `cylinderCount` 26 % · `upholsteryType` 28 % · `gearCount` 31 % ·
`previousOwnerCount` 38 % · `hasParticleFilter` 45 % · `co2Class` 55 % · `nextInspectionYearMonth`
62 % · `wasCabOrRental` et `sealCodes` 78 %. Sondes `P-55` (±25 % relatifs), `P-56` (écart-type des
taux > 0,15 : la non-uniformité est **mesurée**), `P-58` (l'équipement manque 1,8 fois plus souvent
chez les particuliers).

Les taux sont choisis pour qu'**aucune branche de repli du dictionnaire ne reste inexercée** :
`EX-DATA-5` (unité non gérée), `EX-DATA-10` (repli création → recherche), `EX-DATA-11` (hybride non
résolu), `EX-DATA-14` (rejet), `EX-DATA-18` (prix absent non déclaré), `EX-DATA-23` (date non
analysable) reçoivent chacune au moins 20 annonces au profil `test`.

---

## 6. Anomalies contrôlées — `anomalies.json` (`R-57`, `R-58`, `A-01` … `A-20`)

**Principe** (`R-57`) : une anomalie est **injectée après** le calcul de la valeur plausible, et la
valeur plausible est **conservée au manifest**. Une anomalie dont la valeur plausible n'est pas
conservée n'est pas une vérité terrain : elle n'est pas falsifiable. **Exclusion mutuelle** (`R-58`) :
une annonce porte au plus une anomalie **de prix**.

| Id | Anomalie | Taux | Détection attendue | Exigence |
|---|---|---:|---|---|
| A-01 | prix sentinelle (1, 11, 99, 111, 123, 150, 199, 249 €) | 0,10 % | `PRICE_SENTINEL_ABSOLUTE`, exclusion de `V_price` | EX-DATA-19(1), 60 |
| A-02 | prix placeholder haut (123456, 999999) | 0,02 % | `M1_HIGH` ou `PRICE_OUT_OF_RANGE` | EX-DATA-88, 45 |
| A-03 | 0 km sur véhicule ≥ 2 ans | 0,25 % | `SUSPECT_ZERO_MILEAGE`, exclusion de `V_mileage` | EX-DATA-60 |
| A-04 | kilométrage incohérent (65–95 000 km/an ; ou 200–900 km à ≥ 6 ans) | 0,30 % | aucun rejet : point extrême du nuage, poids sur `x₂` de M2 | EX-DATA-90, 102bis |
| A-05 | première immatriculation **future** (année + 2) | 0,08 % | `FIRST_REG_OUT_OF_RANGE`, valeur INCONNUE | EX-DATA-24 |
| A-06 | date non analysable (`2024-13`, `13/2024`, `00/2019`, `24-05`) | 0,08 % | `FIRST_REG_UNPARSEABLE`, aucune tolérance | EX-DATA-23 |
| A-07 | doublon **exact** intra-vendeur | 0,35 % | audit de doublons, sans conflit de valeur | EX-DATA-15, ARB-54 |
| A-08 | quasi-doublon **inter-vendeurs** (prix ±2–9 %, km ±0–400) | 0,80 % | `DUPLICATE_VALUE_CONFLICT` | EX-DATA-15, 45 |
| A-09 | version ambiguë (modèle d'une autre marque ; puissance contredite ; bruit intégral) | 1,50 % | `VERSION_FULLY_STRIPPED`, `VERSION_POWER_MISMATCH` | A.5.2, EX-DATA-45 |
| A-10 | **outlier M1** (haut 500 k–3 M€ ; bas 260–480 €) | 0,25 % | `M1_LOW` / `M1_HIGH`, rappel ≥ 90 % | EX-DATA-88, 89 |
| A-11 | **outlier M2** (facteur 0,30–0,50 ou 2,0–3,2 ; `|z| ≥ 3,5`) | 0,35 % | `M2_LOW` / `M2_HIGH`, rappel ≥ 85 % | EX-DATA-90, 92, 93 |
| A-12 | annonce incomplète (≥ 6 champs optionnels absents) | 2,00 % | rapport d'ingestion, aucune exclusion | EX-DATA-46, 61 |
| A-13 | puissance hors domaine | 0,05 % | `POWER_OUT_OF_RANGE` | EX-DATA-45 |
| A-14 | CO₂ nul sur thermique | 0,12 % | `CO2_ZERO_NON_BEV` | EX-DATA-45 |
| A-15 | hybride incohérent (`isPluginHybrid` + essence) | 0,08 % | `HYBRID_INCONSISTENT`, **pas de correction silencieuse** | EX-DATA-11, 45 |
| A-16 | catégorie de carburant non résolue (deux branches) | 0,20 % | `ENUM_UNKNOWN` / `HYBRID_CATEGORY_UNRESOLVED` | EX-DATA-10, 11 |
| A-17 | unité de kilométrage `mi` | 0,45 % | `UNIT_UNSUPPORTED`, conversion **refusée** | EX-DATA-5, 45 |
| A-18 | annonce sans deeplink | 0,15 % | **rejet** `LISTING_URL_MISSING` | EX-DATA-14, 46 |
| A-19 | marketplace non mappé (`BE` au lieu de `B`) | 0,03 % | `MARKETPLACE_UNMAPPED` | EX-DATA-45, 46 |
| A-20 | prix sur demande **avec** montant | 0,04 % | `PRICE_ON_REQUEST_WITH_AMOUNT`, montant non retenu | EX-DATA-45 |

Taux cumulé **7,20 %** d'annonces porteuses d'au moins une anomalie. Le manifest publie pour chacune
l'effectif, le taux réalisé et la liste des `listingId` **avec valeur avant et après** ; A-10 et A-11
portent en outre la méthode, le drapeau attendu et le juste prix. **Ce que le reviewer doit
retrouver** est écrit anomalie par anomalie dans `anomalies.json` (champ `aRetrouver`).

Deux garde-fous hérités du générateur actuel et conservés : `M1_LOW` ne descend **jamais** sous
250 € (sinon l'annonce devient une sentinelle, sort de `V_price` et la vérité terrain devient
invérifiable) ; les M1 et les M2 injectés sont **disjoints**, ce qui rend mesurable le taux d'accord
`M1_M2_AGREE_*`.

---

## 7. Sondes attendues — `probes.json` (`P-01` … `P-85`)

`probes.json` est le **contrat** entre `dataset-design`, `dataset-gen` et `data-review` : identifiant,
règle visée, famille, statistique, tolérance, portée (snapshot / profil). Le reviewer les écrit et
les fait passer **sans les modifier** ; le générateur les traite comme une spécification, jamais
comme un test à ajuster. Répartition : volume et déterminisme 6 · taxonomie 6 · âge et fenêtres 4 ·
carburant 7 · segments et attributs 5 · kilométrage 3 · prix 13 · TVA 3 · vendeurs 6 · géographie 4 ·
manquants 5 · émissions 5 · snapshots 7 · anomalies 6 · cellules 2 · R3 2 · filtres 1.

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

Graine par défaut **`0x4B594341`**. Graine du snapshot `k` : saut du flot `xoshiro128**` depuis la
graine du profil — les trois snapshots sont indépendants et reproductibles séparément. **Ordre des
tirages figé** ligne par ligne et documenté dans le générateur : tout trait rare (repli d'ingestion,
anomalie, valeur manquante) est tiré par **hachage pur** `hash(graine ⊕ domaine, ligne)` et **ne
consomme pas** le flot principal — sans quoi ajouter une règle décalerait tout l'aval et invaliderait
des sondes vertes sans qu'aucun défaut ne les ait causées. Sondes `P-03` (mêmes octets à graine
égale) et `P-04` (≥ 99 % de `listingId` différents à graine différente).

### 8.2 Ordre du fichier (`R-32`, écart E-05)

Tri par `(makeId, modelId, firstRegistrationYearMonth, listingId)`. Les lignes voisines partagent
leurs préfixes : le taux de compression y gagne, et l'ordre d'ingestion sur lequel `EX-DATA-15`
arbitre les doublons est fixé (`P-06`).

### 8.3 Budget de taille (`R-33`)

Profil `test` : 3 × 20 000 = 60 000 lignes pour **8 Mio** gz, soit **139,8 octets par ligne
compressée**. Recommandations, dans l'ordre où elles doivent être appliquées :

1. **Codes, jamais libellés** : `"D"` et non `"Diesel"`, `"11"` et non `"Noir"`. Les libellés sont au
   référentiel, pas dans les données.
2. **Champ absent, jamais `null`** : une valeur inconnue est une **clé absente**. Cela réalise le
   modèle de valeurs manquantes du §5 et supprime 6 à 10 octets par champ absent.
3. **Ordre de clés identique sur toutes les lignes** : la fenêtre de gzip réutilise le motif.
4. **Images comptées, jamais listées** : `imageCount` seul (`EX-DATA-44`, E18).
5. **Aucun espace superflu** ; une ligne = un objet JSON compact.
6. **Équipements en codes numériques** dans un tableau ; c'est le poste variable dominant.

Leviers si le budget est dépassé, dans cet ordre : (1) réduire la verbosité de `modelVersionRaw` ;
(2) abaisser `maxCodes` d'équipement de 34 à 24 ; (3) sortir le profil `dev` du dépôt. Le
`listingId` est conservé en forme canonique 8-4-4-4-12 par fidélité à AutoScout24, au prix de
4 octets par ligne — c'est un choix assumé, pas un oubli. **La mesure est obligatoire à la
génération** (`P-05`).

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
| `geography.json` | 11 provinces pondérées, 79 communes, langues | R-34 … R-37 |
| `missingness.json` | facteur latent, taux par champ, absences structurelles | R-43 … R-46 |
| `equipment.json` | 34 codes paramétrés + résiduels | R-47 … R-49 |
| `snapshot-dynamics.json` | durée d'exposition, sorties, entrées, révisions | R-50 … R-56 |
| `anomalies.json` | 20 anomalies : taux, mécanisme, détection, exigence, ce que le reviewer retrouve | R-57, R-58 |
| `probes.json` | 85 sondes : règle, statistique, tolérance, portée | contrat |

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
| Évaluation de prix (M3) | seuils sur `ln(prix/juste)/σ_p` + brouillage 0,12 | `price-model.json` | correction C-1 | P-45 | ✅ |
| Puissance | log-normale par segment | 66 → 230 kW | H3 | (P-35 indirect) | ✅ |
| Consommation | linéaire en kW, décroissante en année | `emissions.json` | H12 | P-60 | ✅ |
| CO₂ | **dérivé** de la consommation | 23,92 / 26,40 / 18,10 | S15 (physique) | P-60, P-64 | ✅ |
| `co2Source` | seuil 2018-09 + taux d'inconnu par âge | 6 / 18 / 42 % | S16 | P-61, P-62 | ✅ |
| Norme Euro | table par année | `emissions.json` | S9 | P-63 | ✅ |
| Type de vendeur | logistique en âge × segment | 70/30 | H4, S14 | P-46 | ✅ |
| `dealerBucket` | Zipf(0,85) sur le stock + hachage salé | 90 / 320 / 1 500 | D3-02 | P-47 … P-49, P-81 | ✅ |
| Palier publicitaire | table PRO, croissante avec le stock | `sellers.json` | S14 | P-50 | ✅ |
| Provinces | cible régionale × population | `geography.json` | S2, S3 | P-51 | ✅ |
| Communes et codes postaux | tirage au poids, code postal porté par la commune | 79 communes | H10 | P-52, P-53 | ✅ |
| Langue des libellés | langue de la commune + 4 % de croisement | `geography.json` | H11 | P-54 | ✅ |
| Valeurs manquantes | `p_champ · g(c) · h(vendeur) · k(âge)` | 60 taux, `Beta(6,2)` | H13, correction C-7 | P-55 … P-59 | ✅ |
| Équipements | logit en année × segment × vendeur | 34 codes + résiduel | H14 | (P-55, P-58) | ✅ |
| Durée d'exposition | `68 · m_seg · (P/15 000)^0,18 · (1 + 0,012(âge−8)) · m_vendeur` | `snapshot-dynamics.json` | H15, §0.2 | P-65 | ✅ |
| Sorties / entrées | `1 − exp(−7/d)`, entrées = sorties par marque | mesuré 10,31 % | §0.2 | P-65 … P-67 | ✅ |
| Révisions de prix | log-normale, 84 % à la baisse | 17 %, médiane 3,5 % | marché stationnaire | P-68 … P-71 | ✅ |
| Anomalies A-01 … A-20 | injection après valeur plausible | `anomalies.json` | EX-DATA-5/10/11/14/15/18/19/23/45/88/90 | P-72 … P-77 | ✅ |
| Densité de cellules | plancher par profil | 150 / 90 au profil test | EX-DATA-86, 90 | P-78, P-79 | ✅ |
| Déterminisme et taille | graine, ordre, budget | `profiles.json` | S12 | P-01 … P-06 | ✅ |

**Non couvert, assumé** : `financeRate*`, `leasing*`, `governmentBonus`, `tradeIn`, `buyOnline`,
`radius`, `crossBorder`, `newDriver`, `emissionSticker` (vignette allemande) — filtres retenus au
catalogue mais **sans champ correspondant** au dictionnaire KYCAR. Le manifest les publie dans la
liste des **filtres non alimentés** (`P-82`) plutôt que de les laisser découvrir à la recette.
