# KYCAR — Document d'exigences

**Version 1.0 — GELÉ le 2026-09-06.**
Assemblé par le coordinateur `req-lead`, éprouvé par le stress-test de la phase 2.2, et gelé après
résolution de la totalité des constats bloquants et majeurs.

Ce document est désormais la **source de vérité fonctionnelle** du chantier 2. Toute modification
ultérieure passe par une nouvelle version et un journal d'écart : aucune décision prise en cours de
développement ne reste dans le code sans remonter ici (règle R1 du plan 2).

---

## 0. Structure de ce document, et pourquoi il est un index

Ce document est **normatif et complet**, mais il n'est pas monolithique. Les exigences détaillées
vivent dans trois annexes, elles-mêmes normatives :

| Annexe | Fichier | Domaine | Exigences |
|---|---|---|---|
| **A** | [`draft-data-dictionary.md`](draft-data-dictionary.md) | Dictionnaire de données, modèle d'agrégation, détection d'outliers, entités | **140** · `EX-DATA-*` |
| **B** | [`draft-screens.md`](draft-screens.md) | Écrans, bandeau de filtres, graphes, états, responsive | **231** · `EX-SCR-*` |
| **C** | [`draft-behaviour.md`](draft-behaviour.md) | Navigation, URL, recherche, CRUD, exigences non fonctionnelles | **114** · `EX-NAV/SRCH/CRUD/NFR-*` |
| **Arbitrages** | [`ARBITRAGES-req-lead.md`](ARBITRAGES-req-lead.md) | 15 décisions du coordinateur, avec leur motif | `A-01…A-09`, `R-A01`, `R-A05`, `R-A06`, `R-A10…R-A15` |

**Total : 485 exigences**, identifiants uniques, aucun trou de numérotation, vérifié par script
annexe par annexe. Un seul identifiant est en pierre tombale volontaire, `EX-SCR-111` : son contenu
normatif est supprimé mais l'identifiant subsiste avec le motif, parce qu'il est cité par un rapport
de stress-test et par la matrice de traçabilité.

**Traçabilité de la source normative des filtres** : le périmètre des filtres n'est pas tenu en
prose. Il est **généré** dans `data/reference/filters-scope.json` par `scripts/build-filter-scope.mjs`,
qui échoue si la partition ne tombe pas juste — **74 retenus + 27 exclus = 101** (`D-14` retire
`zip`, `lat`, `lon` du périmètre retenu). Aucune liste écrite à la main ne fait foi contre ce
fichier. [amendée 2.8 — D8-13]

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
| **Fourchette** | Intervalle affiché des valeurs observées. `[P5, P95]` sur l'écran A, `[min, max]` sur les écrans B et D (arbitrage A-05, portée précisée par `R-A05`). **`[P5, P95]` n'apparaît que sur l'écran A, et jamais sans être nommé « fourchette centrale (90 % des offres) »** : un intervalle écrêté présenté comme « la fourchette » est un mensonge par omission. Les libellés de percentile s'écrivent `P5` et `P95` |
| **Vocabulaire de recherche** | Jeu de codes du moteur de recherche public AutoScout24 (`fuel=B`) |
| **Vocabulaire de création** | Jeu de codes de l'API officielle de création d'annonces (`FuelType=1`). **Distinct du précédent, et incompatible sur certains codes** — voir `REF-vocabulary-reconciliation.md` |
| **Filtre `R`** | Filtre recalculable localement, sans accès réseau, en 150 ms ou moins |
| **Filtre `T`** | Filtre exigeant un rechargement via `DataProvider` |
| **`DataProvider`** | Interface unique par laquelle toute donnée entre dans l'application |
| **« couverture » employé seul** | **Interdit dans les quatre documents normatifs.** Trois grandeurs distinctes portaient ce nom, dont deux au même seuil de 80 % — d'où deux pastilles contradictoires pour la même zone-modèle (constats `AMB-15`, `T-01`). Le mot ne s'emploie plus qu'avec son qualificatif, parmi les trois ci-dessous |
| **Couverture d'échantillon** (`sampleCoverage`) | `listingCount / announcedCount`. Définie aux seuls niveaux (marque) et (marque, modèle), `null` si l'effectif annoncé est inconnu. **Publiée uniquement quand l'état de filtres est vide** ; dès qu'un filtre est posé elle vaut `NON_APPLICABLE`, et aucun consommateur ne peut lui substituer une des deux autres |
| **Couverture métrique** (`metricCoverage`) | `n_m / N` — part de la sélection sur laquelle une statistique donnée est calculable |
| **Part de prix fermes** (`priceQuotedShare`) | `priceQuotedCount / listingCount` — porte le seuil de 0,80 de l'avertissement de prix, et lui seul |

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
| C1 | **Bandeau de filtres** — les 77 filtres retenus, spécifié une fois | partagé | composant |
| C3 | Bandeau de couverture d'échantillon | partagé | composant |
| **A** | **Survol du marché** | `/marche?<filtres>` | **imposé** |
| **B** | **Distribution d'un modèle** | `/marche/:makeId-:makeSlug/:modelId-:modelSlug` | **imposé** |
| C | Comparaison de 2 à 4 modèles | `/comparer?m=…` | ajout justifié |
| D | Annonces du modèle, table et deeplink | `…/annonces` | ajout, requis par A-02 |
| E | Recherches enregistrées, avec écart d'effectif servant de veille | `/recherches` | ajout justifié |
| F | Modèles suivis | `/suivis` | ajout, requis par `EX-CRUD-9` |
| G | Sélecteur marque/modèle — 295 marques, 4 955 modèles | modale | ajout justifié |
| — | Mentions et méthodologie — page statique : sources, périmètre, limites connues | `/mentions` | ajout, contrepartie de la règle « aucune valeur fabriquée » |

**Pas d'écran de détail d'annonce** : `00-CONTEXT.md` interdit de dupliquer le contenu source et R3
interdit les champs vendeur. Le deeplink vers l'annonce d'origine suffit. C'est une décision, pas un oubli.

---

## 6. Bandeau de filtres → **Annexe B** pour la forme, **Annexe C** pour l'encodage

**Périmètre : 74 filtres retenus sur 101** (arbitrage A-01). 27 exclus, et eux seuls : `cid`,
`zip`, `lat`, `lon` (règle R3, `D-14`), les 16 filtres non-voiture, 5 paramètres de télémétrie
AutoScout24, 2 doublons stricts. [amendée 2.8 — D8-13]

Hiérarchie à trois niveaux — 8 contrôles primaires toujours visibles couvrant 12 paramètres
(`cy` retiré du primaire, `D-15` : c'est une valeur injectée par le `DataProvider` selon le
marketplace du snapshot, pas un filtre utilisateur), secondaires repliés par groupe, recherche de
filtre. Le choix des primaires est justifié en annexe B par quatre critères mesurables, avec une
dérogation documentée pour `gear` (arbitrage A-08). [amendée 2.8 — D8-13]

Trois termes, définis sans synonymie par la révision `R-A01` : **`RETENU`** = implémenté,
applicable au dataset, encodable dans l'URL et couvert par un test (**74**, énumérés dans
`data/reference/filters-scope.json`) · **`EXPOSÉ`** = doté d'un contrôle atteignable par
l'utilisateur (**68**, plus six écarts déclarés — `atype`, `powertype`, `ustate`, `cy`, `page`,
`size` — valeurs injectées par le `DataProvider` ou paramètres d'état d'interface de l'écran D,
jamais un filtre utilisateur) · **`PRIMAIRE`** = visible sans déplier de groupe (8 contrôles,
12 paramètres). [amendée 2.8 — D8-13]

Le badge de comptage du bandeau compte les filtres **actifs** — posés à une valeur non défaut —
et jamais les filtres disponibles : un badge qui compte les possibilités n'informe sur rien.

Chaque filtre retenu porte sa classification `R` / `T` / `D` selon le coût de son application :
`R` recalculable localement en 150 ms ou moins, `T` exigeant un rechargement via `DataProvider`,
`D` en dette faute de champ dans la source. La classe `X` a été supprimée : elle mélangeait les
filtres exclus dans une classification qui ne porte que sur les retenus, ce qui produisait un
bilan de 101 là où la section ne parle que des 74 (constat `T-02`).

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
champ manquant. **Un état sans objet sur un écran donné est déclaré comme tel, avec son motif** —
l'omission et l'inapplicabilité ne se distinguaient pas, ce qui rendait la règle invérifiable.

Les seuils d'effectif sont **quatre paliers** et non un seuil unique, chacun avec ce qui est
calculé et ce qui est masqué à ce palier ; la spécification est continue au passage de chaque
palier, l'affichage ne saute pas (constats `ADV-06`, `ADV-07`).

Deux règles transverses issues des arbitrages :

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

**Budget de recalcul — arbitrage `P-07`, ratifié par le coordinateur.** Le stress-test a établi que
le poste de calcul des facettes portait le budget de 450 à 540 ms, dépassant la cible publiée. Deux
issues étaient possible : relever le budget affiché, ou séparer les postes. **Le budget est séparé,
pas relevé** — le recalcul des **agrégats** garde sa cible de 200 ms au 95ᵉ centile, et les
**facettes** sont différées d'au plus 100 ms après l'affichage des chiffres principaux, leurs
compteurs affichant `…` pendant l'écart.

Motif de la ratification : gonfler un budget pour qu'une mesure y entre revient à faire disparaître
l'exigence en la satisfaisant par construction. Différer les facettes préserve l'exigence *et* sert
mieux l'utilisateur, qui voit les chiffres qui l'intéressent d'abord. La mémoire relève du même
principe — le total recalculé par l'arbitre est d'environ 274 Mo, soit une marge de facteur 1,9 sur
la cible, et c'est la marge réelle qui est publiée, pas une marge confortable obtenue en oubliant un
poste (constats `ADV-08`, `ADV-09`).

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
| Méthode de `G8` — **une seule formule** | `EX-DATA-90` à `EX-DATA-93bis` | Le graphe `G8` ne porte aucune formule : il renvoie à M2. Contrôle : aucune régression n'est définie ailleurs qu'en annexe A, et le `R²` publié est celui de la passe 2 sur échelle log, `null` si la somme des carrés totaux est nulle | 2.5 |
| Écrans et graphes | `EX-SCR-1…224` | Inspection dirigée écran par écran contre la maquette structurelle, plus les 6 états par écran | 2.5 |
| Navigation et URL | `EX-NAV-*` | Tests aller-retour : état → URL → état, égalité stricte de la chaîne sérialisée | 2.5 |
| Recherche et filtrage | `EX-SRCH-*` | Tests des 77 filtres, dont dépendances parent-enfant et intervalles inversés | 2.5 |
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

Les 101 filtres de `REF-filters.md` reçoivent chacun un statut : 74 retenus et spécifiés, 27 exclus
avec motif nommé (arbitrage A-01, `D-14`). **Aucun filtre du catalogue n'est laissé sans statut** —
critère de succès S4 de la phase 2.1. [amendée 2.8 — D8-13]

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
| O7 | Sémantique OU/ET du filtre équipements (`eq`) | Défaut ET, paramétrable, affiché à l'écran (A-03). Les 3 requêtes qui trancheraient portent sur `/lst?`, interdit. **Argument quantitatif versé au dossier** (`ADV-11`, rejeté comme défaut mais conservé comme preuve de risque) : sous sémantique ET, une sélection de `eq` proche de son maximum rend un résultat vide de façon déterministe — de l'ordre de `0,5^136`. Si la preuve arrive, elle pèsera en faveur du OU |
| O9 | **Représentativité de l'échantillon de 20 annonces par modèle** | Verrou du parcours 2. L'avertissement est **non refermable** sur l'écran B, qui n'est fait que de distributions. C-67 (données FDZ) est l'instrument de mesure candidat, pas une source produit |
| O12 | Plafond de 4 000 annonces par recherche | Impose un partitionnement de l'espace de recherche pour tout snapshot national |
| Dette 1 | Table des plages postales belges `[EXTRAPOLÉ]` | À confronter au fichier officiel avant le gel v1.0 |
| Dette 2 | Table carburant création → recherche déduite des libellés | À relever avant tout usage en écriture |

---

## 13. Journal des versions

| Version | Date | Contenu |
|---|---|---|
| 0.9 | 2026-09-06 | Assemblage des 3 annexes, 447 exigences, 9 arbitrages du coordinateur. Soumis au stress-test |
| **1.0** | **2026-09-06** | **GELÉ. 485 exigences.** Voir le détail ci-dessous |
| **1.1** | **2026-09-08** | **Remédiation 2.6, `fix-docs`.** Aucune exigence créée ni supprimée, aucun identifiant renuméroté. 30 exigences amendées (annexes A, B, C) contre les décisions de `reports/remediation/FIX-LEAD-DECISIONS.md` et les tensions §5.2/§5.3/§6.5 de `reports/DEV-REVIEW.md`. Détail ci-dessous |
| **1.2** | **2026-09-08** | **Remédiation 2.8, `fix-docs`.** Aucune exigence créée ni supprimée, aucun identifiant renuméroté. Amendements contre `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` (constats `FV-xx` de `reports/FINAL-VERIFICATION.md` §7) : décomptes de filtres et de primaires corrigés (`D8-13`), vocabulaire d'outliers porté à 8 codes (`D8-09`), garde R3 étendue (`D8-11`), colonne TVA de l'interface physique (`D8-08`), agrégats `modelCount`/`iqr`/`coverage`/champs optionnels (`D8-10`, `D8-23`), dette `D-17` levée (`D8-07`), dettes produit et externes consignées (`D8-15`, `D8-18`, `D8-20`). Détail ci-dessous |
| **1.3** | **2026-09-08** | **Remédiation 2.8, vague F3, `fix-docs-2`.** Aucune exigence créée ni supprimée, aucun identifiant renuméroté. Amendements contre `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` §E (arbitrages après `fix-verify` rev 1) : dénominateur de `coverageWarning`/`priceCoverage` sur une source d'agrégats précisé (`D8-32`), dette d'interface gelée `co2Source` du provider synthétique consignée (`D8-32`), version bornée d'`EX-SCR-159` ratifiée (`D8-32`), portée de `count` dans le bloc statistique précisée (`D8-32`, hypothèse sur `D8-30`), décompte des filtres retenus (`REF-filters.md`, `ARBITRAGES-req-lead.md`) aligné sur 74 (`D8-32`), dette architecturale des effectifs de facette en mode 1 ratifiée (`D8-29`). Détail ci-dessous |

### Journal des amendements 2.8, vague F3 (v1.2 → v1.3)

Chaque exigence amendée porte la marque `[amendée 2.8 — D8-xx]` en fin de texte, au même titre
que la vague précédente (v1.1 → v1.2) : la remédiation reste celle de la **phase 2.8**, cette
vague F3 n'introduit pas de nouvelle phase. Aucune formule ni disposition n'est réécrite au-delà
de ce que la décision citée impose.

| Identifiant | Fichier | Nature de l'amendement | Décision |
|---|---|---|---|
| `EX-DATA-17` | draft-data-dictionary.md | Précision : sur une source d'agrégats (mode 1), le dénominateur de `priceCoverage`/`coverageWarning.price` est l'effectif de l'échantillon calculé, pas `listingCount` ; règle `listingCount` inchangée sur un jeu chargé | `D8-32` |
| `EX-DATA-35` | draft-data-dictionary.md | Dette d'interface gelée consignée : `co2Source` du provider synthétique figé `UNKNOWN` et déclaré (`unknownCountByField`, `coverageNote`), faute de colonne dans `DataProvider` v1 ; levée prévue en v2 de l'interface | `D8-32` |
| `EX-SCR-159` | draft-screens.md (§6.4) | Version bornée livrée en 2.8 ratifiée : légende continue atténuée à `n ≤ 3`, sans recentrage à `n = 1` ni pastilles/valeurs littérales ; seuil et désactivation du brossage conformes ; passage à la version complète consigné comme dette de présentation non bloquante | `D8-32` |
| `EX-DATA-64` | draft-data-dictionary.md | Précision : `count` porté par le conteneur de l'agrégat (`SelectionStats`/`MakeAggregate`), pas répété dans chaque `MetricStats` ; bloc de treize valeurs réparti conteneur + `MetricStats`, sous hypothèse que `D8-30` (calcul de `iqr`/`coverage`) est livré par `fix-engine-2` | `D8-32` |
| `EX-SCR-65`, `EX-SCR-89`, `EX-SCR-90` | draft-screens.md | Dette architecturale ratifiée : en mode 1 (agrégats servis sans ligne, `O17`), les effectifs de facette `(n)` et le marquage `(0)` ne sont pas affichés (aucun jeu chargé pour les calculer) ; aucune valeur inventée ; corrigé en mode 2 (`D8-05`) ; levée conditionnée à une décision produit ou à `DataProvider.facets()` (v2) | `D8-29` |
| `REF-filters.md` (fiche `zipr`) | REF-filters.md | Note ajoutée : statut KYCAR de `zip`/`zipr` (`EXCLU`/`RETENU`) rappelé, dépendance de `zipr` à `zip` devenue résiduelle et sans effet | `D8-32` |
| `ARBITRAGES-req-lead.md` (R-A15) | ARBITRAGES-req-lead.md | Note ajoutée : le décompte historique « 77 retenus + 24 exclus » de la phase 2.2 est dépassé par `D8-13` ; décompte courant 74 retenus + 27 exclus, recompté ligne à ligne sur `EX-SCR-82` et confirmé contre `filters-scope.json` | `D8-32` |

### Journal des amendements 2.6 (v1.0 → v1.1)

Chaque exigence amendée porte la marque `[amendée 2.6 — D-xx]` (ou `T-xx`/`O-xx`) en fin de texte.
Aucune formule ni disposition n'est réécrite au-delà de ce que la décision citée impose.

| Identifiant | Annexe | Nature de l'amendement | Décision |
|---|---|---|---|
| `EX-DATA-49` | A | Note : `zip`/`location`, `lat`, `lon` exclus du périmètre retenu, motif `R3_DONNEE_PERSONNELLE` | `D-14` |
| `EX-DATA-83bis` | A | Dette consignée : `GROUPSTAT`/`NTILE` non implémentées dans le worker en 2.6, reportées en 2.7 | `D-17` |
| `EX-DATA-99` | A | Éligibilité au tracé requalifiée en « prix valide » au sens d'`EX-DATA-60` (au lieu de `priceStatus = QUOTED` seul) | `D-05` |
| `EX-DATA-100bis` | A | Requalifiée en propriété (identité octet à octet entre permutations), satisfaite par `EX-DATA-101` ; algorithme `xoshiro128**`/Fisher-Yates et graine `0x4B594341` retirés | `D-06` |
| `EX-DATA-104` (I7) | A | La marginale de la grille de densité est précisée comme portant sur l'ensemble éligible `Elig`, pas sur `V_year(Σ)` | `D-25` |
| `EX-DATA-105` | A | Décompte corrigé : quatorze entités (au lieu de treize) | `O16` |
| `EX-DATA-107` | A | Précision : `sourceKind` n'est pas un champ d'`AggregateResult`/`ListingColumnBatch` ; identifié par `describe()` + `snapshotId` | `D-24` |
| `EX-DATA-108` | A | Précision : une règle de canonisation, appliquée à deux espaces d'identifiants distincts (KYCAR, AutoScout24) | `D-23` |
| `EX-DATA-119` (§ C.3, table physique) | A | `makeId` : `Int16Array` → `Int32Array` ; `ingestFlags` : `Uint16Array` → `Uint32Array` ; total colonnes ≈ 71 → ≈ 75 | `D-01`, `D-02` |
| § A.1 (table des vocabulaires, `KYCAR_INGEST_FLAG`) | A | Décompte corrigé : 14 → 17 codes | `D-01` |
| § C.5 (récapitulatif chiffré, « Entités ») | A | Décompte corrigé : 13 → 14 | `O16` |
| `EX-SCR-114` | B | Précision : « jamais masquées » porte sur la présence des fourchettes ; leur contenu suit les paliers ARB-17 (`EX-SCR-33`) | `D-36` |
| `EX-SRCH-6`, `EX-SRCH-7` | C | Sans objet : `zip`/`zipr` exclus du périmètre (motif R3, D-14) | `D-37` |
| `EX-NAV-5` | C | Paramètre KYCAR `make` retiré ; `mmmv` est le seul paramètre marque/modèle, en mode 1 comme en mode 2 | `D-09` |
| `EX-NAV-10bis` | C | Ajout des paramètres d'état d'interface `page`, `size`, `sel` (hors `selectionHash`, ne changent jamais `Σ`) | `D-11`, `D-12` |
| `EX-NAV-15` | C | Transition mode 1 → mode 2 réécrite autour de `mmmv` (absorbé par la route) au lieu de `make` | `D-09` |
| `EX-NAV-16` | C | Retour mode 2 → mode 1 réécrit : `mmmv` réinjecté (segment modèle vide) au lieu de `make` | `D-09` |
| `EX-NAV-17` | C | Référence à `make` remplacée par `mmmv` | `D-09` |
| `EX-SRCH-18bis` | C | `damaged_listing` confirmé en classe `D` ; absence de contrôle utilisateur « accidentés » en 2.6 consignée comme dette produit | `D-15` (`ARB-30`) |
| `EX-SRCH-26` | C | Texte du bandeau harmonisé sur `EX-SCR-32` (« affinez pour comparer ») | `T-t` |
| `EX-CRUD-19` | C | Schéma de stockage précisé : une clé `localStorage` par entrée + une clé d'index, `mutate` n'écrit jamais la collection entière | `D-16` |
| `ARB-12` (limite du partage par URL pure) | C | Portée du risque de troncature non détectable restreinte à la troncature *dans* le domaine ; la troncature *hors* domaine est rattrapée par `EX-NAV-21` | `T-s` |
| `ARB-56` (longueur de référence de l'URL) | C | Chiffres corrigés : 827 / 1 535 / 1 649 caractères (au lieu de « ≈ 1 720 ») ; conclusion normative inchangée | `T-r` |
| `EX-SCR-32` | B | Seuil `ET-TROP-RESULTATS` de l'écran B (20 000, graine) retiré ; ne s'applique plus qu'à l'écran A | `D-06`, `D-08` |
| `EX-SCR-57` | B | Débounce de la classe `T` : renvoi à la table `EX-SRCH-1…8` au lieu d'un délai unique de 400 ms | `D-19` |
| `EX-SCR-76` | B | Retrait unitaire au-delà de 2 valeurs déplacé dans l'infobulle/popover du jeton (le jeton reste unique) | `D-10` |
| `EX-SCR-86` | B | Débounce du champ numérique corrigé à 500 ms + `blur` + `Entrée` | `D-19` |
| `EX-SCR-134` | B | Palier `5 ≤ n ≤ 11` (`P5`/`P95` masqués, jeton) câblé sur la zone-modèle, aligné sur `EX-SCR-33` | `D-04` |
| `EX-SCR-157` | B | Requalifiée : `K = 5 000` gouverne seul ; seuil à 20 000 et graine retirés | `D-06`, `D-08` |
| `EX-SCR-158` | B | Brossage : un bouton (`Convertir la sélection en filtre`) plus un lien (`Voir ces annonces`) au lieu de deux boutons | `D-26` |
| `EX-SCR-177` | B | `G4` sorti du périmètre d'`ET-TROP-RESULTATS` (§6.7) | `D-08` |
| `EX-SCR-194` | B | Format de `m` corrigé en `<makeId>-<modelId>` | `D-13` |
| `EX-SCR-208` | B | Rendu virtualisé remplacé par la pagination client de 50 lignes | `D-27` |

### Journal des amendements 2.8 (v1.1 → v1.2)

Chaque exigence amendée porte la marque `[amendée 2.8 — D8-xx]` en fin de texte. Aucune formule ni
disposition n'est réécrite au-delà de ce que la décision citée impose ; une divergence avec une
exigence non citée par le fix-lead est consignée en § Conflits résiduels de
`reports/remediation-2.8/fix-docs.md`, non tranchée ici.

| Identifiant | Annexe | Nature de l'amendement | Décision |
|---|---|---|---|
| `EX-NFR-8` | C | « rotation continue de 10 s » remplacée par « interaction continue (pan/zoom) », alignée sur `D-07`/ARCHITECTURE §9.1 ; aucune scène 3D | `D8-13` |
| `EX-SCR-59` | B | Huit contrôles primaires (au lieu de neuf) couvrant onze paramètres (au lieu de douze) : `Pays` (`cy`) retiré, valeur injectée par le `DataProvider` selon `EX-SRCH-18bis` | `D8-13` |
| `EX-SCR-82` | B | Exception `NON_EXPOSE` étendue de un à six filtres retenus (`atype`, `powertype`, `ustate`, `cy`, `page`, `size`) ; `zip`/`lat`/`lon` passés `EXCLU` (`D-14`) | `D8-13` |
| `EX-SCR-83` | B | Bilan corrigé : 74 `RETENU` (68 `EXPOSÉ` = 12 primaires + 53 secondaires + 3 désactivés, 6 `NON_EXPOSE`) + 27 `EXCLU` = 101 | `D8-13` |
| `EX-SCR-9` | B | Retrait de la mention d'un usage interne de `lat`/`lon` pour un calcul de rayon, jamais construit ; dette externe `D-14` documentée | `D8-18` |
| REQUIREMENTS §0, §6, §11.3 | — | Décomptes corrigés : 74 retenus + 27 exclus (au lieu de 77 + 24) ; 8 contrôles primaires / 12 paramètres (au lieu de 9 / 13) | `D8-13` |
| Annexe A §C.5 | A | Décompte corrigé : 140 exigences `EX-DATA-*` (au lieu de 139) | `D8-13` |
| `EX-DATA-85` | A | 8 codes (au lieu de 6), nommage aligné sur le vocabulaire gelé du code : `M1_LOW`/`M1_HIGH`/`M2_LOW`/`M2_HIGH` (au lieu de `LOW_PRICE_IQR`/`HIGH_PRICE_IQR`/`LOW_PRICE_MODEL`/`HIGH_PRICE_MODEL`), ajout de `M1_M2_AGREE_LOW`/`M1_M2_AGREE_HIGH` | `D8-09` |
| § A.1 (table des vocabulaires, `KYCAR_OUTLIER_FLAG`) | A | Décompte corrigé : 6 → 8 codes | `D8-09` |
| `EX-DATA-96`, `EX-DATA-101` | A | Renvois harmonisés vers le nommage `M1_LOW`/`M1_HIGH`/`M2_LOW`/`M2_HIGH` | `D8-09` |
| `EX-DATA-49` | A | Garde étendue de E1–E14 à E1–E17 (RGPD `vin`/`licencePlate`/`belgianCarpassMileageUrl`, variantes de noms normalisées) | `D8-11` |
| `EX-DATA-119` (§ C.3, table physique) | A | Colonne `vatDeductible` (`Uint8Array`, sentinelle `0`) ajoutée : 20 colonnes énumérées sur un octet (au lieu de 19), ≈ 76 colonnes numériques et énumérées, +1 octet/ligne | `D8-08` |
| `EX-DATA-68` | A | Précision : `modelCount` obligatoire (`null` si non calculé, jamais `0`) ; `coverageWarning`/`samplingBias`/`adTierDistribution` optionnels ; `rank`/`displayRange`/`makeName` dérivés au rendu, non portés par l'entité | `D8-10`, `D8-23` |
| `EX-DATA-83bis` | A | Dette `D-17` levée : `GROUPSTAT`/`NTILE` calculées dans le worker, source unique, recalcul du thread principal retiré | `D8-07` |
| `EX-SCR-95` | B | Dette produit consignée : réglages « Assainissement KYCAR » non implémentés, hors budget 2.8 | `D8-15` |
| `EX-DATA-53` | A | Dette externe ratifiée : confrontation au fichier officiel Statbel/bpost hors contrôle du projet | `D8-18` |
| `EX-SRCH-12` | C | Dette externe ratifiée : sémantique `eq` non tranchable localement (E5 interdit les requêtes live), point ouvert `O7` | `D8-18` |
| `EX-SCR-221` | B | Dette externe (`O15`) et mitigation documentées : bandeau « Filtre Carrosserie non appliqué à ce modèle » en mode 2 | `D8-18`, `D8-20` |

### Ce qui s'est passé entre 0.9 et 1.0

| Étape | Résultat |
|---|---|
| Stress-test à trois angles cloisonnés | **79 constats** — 24 trous (`st-complete`), 37 ambiguïtés (`st-ambiguity`), 18 attaques réussies sur 38 (`st-adversarial`) |
| Arbitrage | **65 décisions** après fusion de 14 constats en 11 groupes · **1 rejet** motivé par preuve · **5 re-cotations**, dont 2 à la hausse |
| Application | **130 travaux appliqués sur 131** · 1 bloqué et signalé, jamais deviné · **38 exigences créées** |
| Résidus | **11 soldés sur 11** · balayage systématique des 65 décisions, 1 prescription manquante trouvée et appliquée |
| Arbitrages du coordinateur | 9 initiaux, dont **3 révisés** après stress-test (`R-A01`, `R-A05`, `R-A06`) et **6 ajoutés** après application (`R-A10…R-A15`) |

**Critère de gel : zéro constat bloquant ou majeur ouvert.** Satisfait. Les 10 constats mineurs sont
tous décidés, et 8 dettes sont consignées explicitement plutôt qu'abandonnées en silence.

### Les trois défauts que le stress-test a corrigés et qui auraient coûté le plus cher

1. **Deux formules de régression concurrentes** pour la détection d'outliers, dont le **signe de
   l'écart s'inversait** sur la même annonce : la même voiture était soit une bonne affaire, soit
   surévaluée, selon l'annexe consultée. Rien ne plantait ; le classement d'affaires était faux.
   C'était le cœur de la valeur du produit.
2. **Trois grandeurs différentes nommées « couverture »**, dont deux au même seuil de 80 %, ce qui
   produisait deux pastilles contradictoires pour la même zone-modèle.
3. **Deux règles de binning concurrentes**, donnant 32 barres de 1 000 € contre 17 barres de
   2 000 € sur le même modèle — et donc des infobulles, des clics-filtre et un export tous
   différents.

Les trois sont des **contradictions entre annexes**, aucune n'était visible depuis une seule annexe.
C'est le diagnostic de `st-complete`, et il vaut d'être retenu pour la suite du projet :
*chaque annexe était complète dans son domaine ; les défauts étaient à leurs frontières.*
