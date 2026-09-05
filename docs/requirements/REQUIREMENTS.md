# KYCAR — Document d'exigences

**Version 0.9 — soumis au stress-test de la phase 2.2. Non gelé.**
Assemblé par le coordinateur `req-lead` le 2026-09-06.

---

## 0. Structure de ce document, et pourquoi il est un index

Ce document est **normatif et complet**, mais il n'est pas monolithique. Les exigences détaillées
vivent dans trois annexes, elles-mêmes normatives :

| Annexe | Fichier | Domaine | Exigences |
|---|---|---|---|
| **A** | [`draft-data-dictionary.md`](draft-data-dictionary.md) | Dictionnaire de données, modèle d'agrégation, détection d'outliers, entités | 127 · `EX-DATA-1…127` |
| **B** | [`draft-screens.md`](draft-screens.md) | Écrans, bandeau de filtres, graphes, états, responsive | 224 · `EX-SCR-1…224` |
| **C** | [`draft-behaviour.md`](draft-behaviour.md) | Navigation, URL, recherche, CRUD, exigences non fonctionnelles | 96 · `EX-NAV/SRCH/CRUD/NFR` |
| **Arbitrages** | [`ARBITRAGES-req-lead.md`](ARBITRAGES-req-lead.md) | 9 décisions du coordinateur, avec leur motif | A-01…A-09 |

**Total : 447 exigences**, identifiants uniques, aucun trou de numérotation (vérifié par script).

**Pourquoi un index et non un document unique.** Recopier ici 3 907 lignes d'annexes produirait deux
versions de chaque exigence, qui divergeraient au premier correctif de la phase 2.6. Un document
d'exigences dont on ne sait plus quelle copie fait foi ne remplit plus sa fonction. Les annexes sont
donc la source unique de leur domaine ; ce document porte ce qu'aucune annexe ne peut porter seule :
l'objet du produit, le glossaire commun, les arbitrages entre annexes, la règle d'autorité et la
matrice de traçabilité.

**Documents de référence factuelle** — non normatifs, mais opposables comme preuve :
`00-CONTEXT.md` · `REF-filters.md` · `REF-taxonomy.md` · `REF-vocabulary-reconciliation.md` ·
`../reference/AS24-REFERENCE-API.md` · `../research/FINDING-allowed-surface.md`

---

## 1. Objet de l'application

KYCAR est un **agrégateur analytique du marché de l'occasion AutoScout24**. AutoScout24 présente des
annonces ; KYCAR présente la **structure statistique de l'offre**, et les anomalies qui s'en détachent.

L'utilisateur ne cherche pas une voiture. Il cherche à comprendre un marché, puis à y repérer ce qui
n'y est pas à sa place. Toute exigence de ce document sert l'un des deux parcours suivants ; une
exigence qui ne sert ni l'un ni l'autre doit être justifiée explicitement ou retirée.

### Parcours 1 — Exploration descendante *(aucune marque ni modèle saisi)*

L'utilisateur pose des contraintes de marché — « budget 20 000 €, coupé, Belgique » — et veut voir
ce que le marché propose à ces conditions : quelles marques, quels modèles, combien d'offres chacun,
et dans quelles fourchettes de prix, d'année et de kilométrage.
→ **Écran A**, une carte par marque, une zone par modèle dans la carte.

### Parcours 2 — Analyse d'un modèle *(marque et modèle ciblés)*

L'utilisateur cible un couple précis — « Opel Corsa 2017 » — et veut la distribution de l'offre pour
détecter les décalages : effectifs par prix, par kilométrage, par année, et une lecture conjointe
des trois dimensions permettant d'isoler visuellement ce qui sort de la nuée. Les filtres restent
actifs et recalculent toute la page.
→ **Écran B**, puis **écran D** pour ouvrir l'annonce suspecte.

### Ce que l'application n'est pas

Ni un site d'annonces — elle ne vend rien et ne met personne en relation. Ni un CRM concessionnaire.
Elle ne stocke ni ne republie les coordonnées des vendeurs : le schéma n'a aucune colonne pour les
accueillir (règle R3, et 21 champs explicitement exclus en annexe A).

---

## 2. Glossaire

Un terme, une définition. Tout emploi divergent dans une annexe est un défaut à signaler en phase 2.2.

| Terme | Définition |
|---|---|
| **Annonce** (*listing*) | Une offre de vente unitaire publiée sur AutoScout24, identifiée par un UUID stable |
| **Snapshot** | L'ensemble des annonces récupérées en une passe d'ingestion, à une date donnée |
| **Sélection** | Le sous-ensemble du snapshot satisfaisant l'état de filtres courant |
| **Cellule d'homogénéité** | Groupe d'annonces jugées comparables pour la détection d'outlier — par défaut `(marque, modèle, année)`, avec repli documenté en annexe A |
| **Agrégat marque** / **agrégat modèle** | Effectif et statistiques descriptives d'une sélection groupée par marque, ou par couple marque-modèle |
| **Bucket** | Intervalle de valeurs d'un histogramme, dont la règle de découpage est déterministe (annexe A) |
| **Outlier** | Annonce dont le prix s'écarte significativement de sa cellule d'homogénéité, au sens de M1 ou M2 (annexe A) |
| **Fourchette** | Intervalle affiché des valeurs observées. `[p05, p95]` sur l'écran A, `[min, max]` sur les écrans B et D (arbitrage A-05) |
| **Vocabulaire de recherche** | Jeu de codes du moteur de recherche public AutoScout24 (`fuel=B`) |
| **Vocabulaire de création** | Jeu de codes de l'API officielle de création d'annonces (`FuelType=1`). **Distinct du précédent, et incompatible sur certains codes** — voir `REF-vocabulary-reconciliation.md` |
| **Filtre `R`** | Filtre recalculable localement, sans accès réseau, en 150 ms ou moins |
| **Filtre `T`** | Filtre exigeant un rechargement via `DataProvider` |
| **`DataProvider`** | Interface unique par laquelle toute donnée entre dans l'application |
| **Couverture d'échantillon** | Rapport entre le nombre d'annonces détenues et l'effectif total annoncé par la source, pour une sélection donnée |

---

## 3. Dictionnaire de données → **Annexe A**

82 champs en 13 blocs, 27 vocabulaires nommés, 21 champs exclus par conception dont 14 au titre de
la règle R3, 8 invariants exécutables.

Points structurants, dont le motif est en annexe :
`firstRegistrationDate` stocké en chaîne `YYYY-MM` et non en date · absence de valeur traitée par
exclusion métrique par métrique, **imputation interdite** · `modelVersionInput` conservé en trois
formes, jamais clé d'agrégation · `onRequestOnly` compté dans l'effectif et exclu de cinq usages ·
code postal exact jamais persisté ni journalisé, agrégation en NUTS-2, seuil de suppression des
petites cellules à 5 annonces.

**Deux dettes à solder avant le gel v1.0** : la table des plages postales belges est `[EXTRAPOLÉ]` et
doit être confrontée au fichier officiel ; la table de correspondance carburant création → recherche
(décision V2 de la réconciliation) est déduite des libellés, non relevée.

---

## 4. Modèle d'agrégation et détection d'outliers → **Annexe A**

Trois méthodes, dont deux productrices de verdict et une de contrôle :

| Réf. | Méthode | Rôle |
|---|---|---|
| **M1** | Barrières de Tukey (constante 1,5) sur `ln(prix)`, applicable à `n ≥ 12` | Détection non paramétrique, robuste, sans hypothèse de forme |
| **M2** | Régression `ln(prix) = β₀ + β₁·(année − moyenne) + β₂·(km/10 000)`, échelle robuste par MAD (1,4826), seuil `\|z\| ≥ 2,5`, `n ≥ 30` | **Le cœur de la valeur** : classe les affaires *à âge et kilométrage comparables* |
| **M3** | `priceEvaluationCategory` d'AutoScout24 | **Contrôle externe seulement**, sans seuil d'acceptation ; précision, rappel et kappa publiés |

M1 et M2 sont unifiées sur une échelle d'écarts-types robustes (facteur `IQR/1,349`) pour permettre
un classement mêlé.

**Pourquoi M2 porte la valeur** : un prix bas sur un histogramme brut peut n'être qu'une voiture
vieille et très roulée — information nulle. M2 neutralise l'âge et le kilométrage et isole ce qui
reste inexpliqué. M3 est un second avis indépendant : deux méthodes qui désignent la même annonce
constituent un signal ; deux méthodes qui divergent constituent une question.

---

## 5. Inventaire des écrans → **Annexe B**

| Réf. | Écran | Route | Origine |
|---|---|---|---|
| S0 | Coquille — en-tête, bandeaux, fil d'Ariane, panneau Diagnostic | — | composant |
| C1 | **Bandeau de filtres** — les 78 filtres retenus, spécifié une fois | partagé | composant |
| C3 | Bandeau de couverture d'échantillon | partagé | composant |
| **A** | **Survol du marché** | `/marche?<filtres>` | **imposé** |
| **B** | **Distribution d'un modèle** | `/marche/:makeId-:makeSlug/:modelId-:modelSlug` | **imposé** |
| C | Comparaison de 2 à 4 modèles | `/comparer?m=…` | ajout justifié |
| D | Annonces du modèle, table et deeplink | `…/annonces` | ajout, requis par A-02 |
| E | Recherches enregistrées, avec écart d'effectif servant de veille | `/recherches` | ajout justifié |
| G | Sélecteur marque/modèle — 295 marques, 4 955 modèles | modale | ajout justifié |

**Pas d'écran de détail d'annonce** : `00-CONTEXT.md` interdit de dupliquer le contenu source et R3
interdit les champs vendeur. Le deeplink vers l'annonce d'origine suffit. C'est une décision, pas un oubli.

---

## 6. Bandeau de filtres → **Annexe B** pour la forme, **Annexe C** pour l'encodage

**Périmètre : 78 filtres retenus sur 101** (arbitrage A-01). 23 exclus, et eux seuls : `cid`
(règle R3), les 16 filtres non-voiture, 5 paramètres de télémétrie AutoScout24, 2 doublons stricts.

Hiérarchie à trois niveaux — 9 contrôles primaires toujours visibles couvrant 13 paramètres,
secondaires repliés par groupe, recherche de filtre. Le choix des primaires est justifié en annexe B
par quatre critères mesurables, avec une dérogation documentée pour `gear` (arbitrage A-08).

Chaque filtre porte sa classification `R` / `T` / `D` / `X` selon que son champ figure ou non parmi
les 40 champs relevés sur la source. Bilan clos : 13 + 52 + 3 + 2 + 31 = 101.

---

## 7. Navigation, recherche et CRUD → **Annexe C**

Encodage d'URL reprenant verbatim les paramètres AutoScout24, ordre canonique alphabétique, plafond
2 000 caractères avec refus explicite plutôt que troncature silencieuse. Un `pushState` par filtre
appliqué, rafales de moins de 800 ms regroupées.

**CRUD retenu** : recherches sauvegardées, modèles suivis, historique récent, export CSV des
agrégats affichés. **Écartés** : annotations (positionnement CRM exclu), comparaison multi-modèles
comme entité persistée (couverte par l'écran C et les modèles suivis).

---

## 8. États dégradés et gestion d'erreur → **Annexe B** §états, **Annexe C** §NFR

Six états spécifiés par écran : vide, chargement, erreur, résultat partiel, trop de résultats,
champ manquant. Deux règles transverses issues des arbitrages :

- **Jamais de valeur fabriquée.** Une fourchette sans échantillon affiche « fourchettes
  indisponibles », jamais `0 – 0 €`.
- **Aucune correction silencieuse.** Un paramètre d'URL corrigé est signalé par un bandeau non
  bloquant qui nomme le paramètre et la valeur retenue (arbitrage A-04).

---

## 9. Exigences non fonctionnelles → **Annexe C**

30 exigences chiffrées : volumétrie (hypothèse H5, 10⁴ à 10⁶ annonces par snapshot), temps de
réponse par opération avec percentile visé, budget de bundle, accessibilité et compensation
textuelle des graphes, navigateurs et résolutions, comportement en cas d'échec du `DataProvider`,
confidentialité et rétention, stratégie de surcharge des libellés non traduits par la source
(limite L6).

---

## 10. Confidentialité et conformité

| # | Exigence | Origine |
|---|---|---|
| **P-1** | Aucun champ identifiant un vendeur particulier n'existe dans le schéma. Contrainte structurelle, pas conventionnelle. 21 champs exclus, dont 14 au titre de R3 | `00-CONTEXT.md` R3 |
| **P-2** | Le filtrage des champs interdits s'applique **à l'ingestion**, dans l'adaptateur `DataProvider`, et non au stockage | `FINDING-allowed-surface.md` §2.5 — `seller.contactName` contient un nom de personne physique, servi tel quel par la source |
| **P-3** | Le code postal exact est une valeur transitoire : jamais persistée, jamais journalisée. Agrégation en NUTS-2, suppression des cellules de moins de 5 annonces | annexe A |
| **P-4** | KYCAR conserve un deeplink vers l'annonce d'origine plutôt que d'en dupliquer le contenu | `00-CONTEXT.md` |
| **P-5** | Aucune requête vers `autoscout24.be` ou `.com` en dehors des 17 préfixes que le `robots.txt` autorise nommément à `ClaudeBot` | contrainte E5, `FINDING-allowed-surface.md` §1 |
| **P-6** | Le positionnement juridique reste une **hypothèse documentée**, non une conclusion : CGU non récupérées, droit *sui generis* des bases de données applicable | `00-CONTEXT.md`, point ouvert O1 |

---

## 11. Matrice de traçabilité

### 11.1 — Exigences vers moyen de contrôle

| Domaine | Exigences | Moyen de vérification | Phase |
|---|---|---|---|
| Dictionnaire de données | `EX-DATA-1…82` | Validation de schéma exécutable + les 8 invariants sur le dataset synthétique et sur un échantillon réel | 2.5 |
| Agrégation et buckets | `EX-DATA-83…110` | Tests unitaires à jeux de valeurs connues, dont les cas dégénérés `n=0,1,3` | 2.5 |
| Détection d'outliers M1/M2 | `EX-DATA-111…120` | Tests sur outliers injectés volontairement par le générateur du lot D3, plus M3 en contrôle croisé | 2.5 |
| Écrans et graphes | `EX-SCR-1…224` | Inspection dirigée écran par écran contre la maquette structurelle, plus les 6 états par écran | 2.5 |
| Navigation et URL | `EX-NAV-*` | Tests aller-retour : état → URL → état, égalité stricte de la chaîne sérialisée | 2.5 |
| Recherche et filtrage | `EX-SRCH-*` | Tests des 78 filtres, dont dépendances parent-enfant et intervalles inversés | 2.5 |
| CRUD | `EX-CRUD-*` | Tests de cycle de vie et de limite de nombre | 2.5 |
| Non fonctionnel | `EX-NFR-*` | Mesure chiffrée contre la cible, au percentile déclaré | 2.5 |
| Confidentialité | `P-1…P-6` | Test d'absence : aucun champ interdit dans le schéma, le code, ni les données produites | 2.5 |

### 11.2 — Parcours cibles vers écrans

| Parcours | Écrans | Exigence de bout en bout |
|---|---|---|
| 1 — Exploration descendante | C1 → A → G | Poser un budget et une carrosserie, obtenir des cartes-marques avec effectifs et fourchettes, ouvrir un modèle |
| 2 — Analyse d'un modèle | A → B → D | Ouvrir un modèle, lire les distributions, resserrer un filtre, identifier un outlier, ouvrir l'annonce d'origine |

Ces deux parcours sont **exercés de bout en bout** en phase 2.7, journal d'exécution à l'appui.

### 11.3 — Couverture des filtres relevés

Les 101 filtres de `REF-filters.md` reçoivent chacun un statut : 78 retenus et spécifiés, 23 exclus
avec motif nommé (arbitrage A-01). **Aucun filtre du catalogue n'est laissé sans statut** — critère
de succès S4 de la phase 2.1.

### 11.4 — Couverture des champs

Chaque champ de l'annexe A est rattaché à au moins un écran ou à un agrégat. **Aucun champ orphelin**
— critère S5. Les champs `co2Emission` et `consumption` sont l'exception documentée : présents dans
la source, sans filtre correspondant, ils alimentent une dette de graphe explicite plutôt que d'être
retirés.

---

## 12. Ce que ce document ne tranche pas

Honnêteté de cadrage : les points suivants sont **ouverts et le restent** à la sortie de la phase 2.1.
Ils sont énumérés ici pour que la phase 2.2 ne les découvre pas comme des trous.

| # | Point ouvert | Conséquence assumée |
|---|---|---|
| O1 | Texte exact des CGU AutoScout24 | Le positionnement juridique reste une hypothèse |
| O7 | Sémantique OU/ET du filtre équipements (`eq`) | Défaut ET, paramétrable, affiché à l'écran (A-03). Les 3 requêtes qui trancheraient portent sur `/lst?`, interdit |
| O9 | **Représentativité de l'échantillon de 20 annonces par modèle** | Verrou du parcours 2. L'avertissement est **non refermable** sur l'écran B, qui n'est fait que de distributions. C-67 (données FDZ) est l'instrument de mesure candidat, pas une source produit |
| O12 | Plafond de 4 000 annonces par recherche | Impose un partitionnement de l'espace de recherche pour tout snapshot national |
| Dette 1 | Table des plages postales belges `[EXTRAPOLÉ]` | À confronter au fichier officiel avant le gel v1.0 |
| Dette 2 | Table carburant création → recherche déduite des libellés | À relever avant tout usage en écriture |

---

## 13. Journal des versions

| Version | Date | Contenu |
|---|---|---|
| 0.9 | 2026-09-06 | Assemblage des 3 annexes, 447 exigences, 9 arbitrages du coordinateur. Soumis au stress-test |
| 1.0 | — | À produire par `st-arbiter` en phase 2.2, après résolution de tous les constats bloquants et majeurs |
