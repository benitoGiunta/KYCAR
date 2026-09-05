# ST-complete — Chasse aux trous du document d'exigences v0.9

**Agent** : `st-complete`, phase 2.2 de `PLAN-2-app-build.md`
**Corpus audité** : `REQUIREMENTS.md` v0.9 · `draft-data-dictionary.md` (annexe A) ·
`draft-screens.md` (annexe B) · `draft-behaviour.md` (annexe C) · `ARBITRAGES-req-lead.md`
**Références de jugement** : `docs/00-CONTEXT.md`, `docs/research/FINDING-allowed-surface.md`,
`docs/plans/PLAN-2-app-build.md`
**Angle unique** : ce qui est **absent**. Aucune ambiguïté, aucun cas pathologique de données,
aucune contestation de décision n'est rapportée ici — trois autres angles les couvrent.
**Aucune requête réseau. Aucun document d'exigences modifié.**

**Ce qui a été écarté volontairement du rapport** : les 6 points ouverts et 2 dettes de la
section 12 de `REQUIREMENTS.md` (assumés, donc pas des oublis) · l'interface `DataProvider`
elle-même (livrable de la phase 2.3, critère S2) · les divergences de valeur entre annexes
(seuils de buckets, couleur de `G4`, périmètre de l'export, sémantique de `eq`), qui sont des
**contradictions** et non des absences · l'absence d'écran de détail d'annonce (`EX-SCR-41`) et
le graphe boîte de vitesses (`EX-SCR-218`), tous deux écartés par une décision écrite.

---

## Synthèse

| ID | Titre | Sévérité | Localisation |
|---|---|---|---|
| T-01 | L'effectif annoncé par la source n'est porté par aucun champ | BLOQUANT | annexe A § A.9 / annexe B `EX-SCR-31`, `115`, `116`, `210` |
| T-02 | La liste normative des 78 filtres retenus n'existe pas | BLOQUANT | `REQUIREMENTS.md` § 6 / A-01 / `EX-SCR-83` |
| T-03 | Les 11 graphes additionnels de l'écran B exigent des agrégats que l'annexe A ne définit pas | BLOQUANT | annexe B `EX-SCR-161`→`170` / annexe A § B.2–B.7 |
| T-04 | Effectifs par option de filtre et double compteur : aucune définition, aucun budget | BLOQUANT | `EX-SCR-26`, `46`, `90` / annexe A § B, `EX-DATA-110` |
| T-05 | Les entités `Make` et `Model` n'ont aucune définition de champs | BLOQUANT | `EX-DATA-105`, `114` / `EX-SCR-139`, `140`, `221`, `216` |
| T-06 | L'encodage d'URL des routes et de l'état d'interface de l'annexe B est absent de l'annexe C | BLOQUANT | annexe C § A.1–A.2 / `EX-SCR-50`, `16`, `92`, `123`, `152`, `185`, `202` |
| T-07 | La règle relative de prix sentinelle décidée en A-06 n'est écrite nulle part | BLOQUANT | A-06 / `EX-DATA-19`, `EX-DATA-60`, `EX-DATA-45` |
| T-08 | Le cycle de vie du jeu de données local face aux filtres de classe `T` n'est pas décrit | BLOQUANT | `EX-SCR-57`, `37` / `EX-DATA-34`, `EX-NFR-21` |
| T-09 | La sélection de comparaison n'a ni état, ni persistance, ni règle marque/modèle | BLOQUANT | `EX-SCR-44`, `111`, `118`, `194` / annexe C § C |
| T-10 | Quatre surfaces référencées sans écran ni contrôle | MAJEUR | `EX-NAV-4`, `EX-CRUD-9`→`13`, `15` / `EX-SCR-42`, `47`, `142` |
| T-11 | L'effectif de référence de l'écran E n'est pas un champ de l'entité | MAJEUR | `EX-SCR-212`, `213` / `EX-CRUD-1` |
| T-12 | Le sélecteur `G` n'a aucun état et aucune règle clavier | MAJEUR | `EX-SCR-215`, `216` |
| T-13 | L'étiquetage obligatoire de la base de comparaison d'outlier n'a aucun emplacement d'écran | MAJEUR | A-07 / `EX-DATA-87` / `EX-SCR-158`, `166`, `203` |
| T-14 | La fourchette brute secondaire et son étiquetage n'ont aucun emplacement dans la zone-modèle | MAJEUR | A-05 / `EX-SCR-112`, `113` |
| T-15 | La charge utile du point de nuée est incomplète pour la vue et l'infobulle spécifiées | MAJEUR | `EX-DATA-98` / `EX-SCR-151`, `158`, `159` |
| T-16 | Les colonnes de l'export CSV ne sont définies par aucune annexe | MAJEUR | `EX-CRUD-15`, `16` / `EX-SCR-187` / annexe A |
| T-17 | Le déclenchement du rafraîchissement et le remplacement d'un snapshot ne sont pas décrits | MAJEUR | absent partout (`EX-SCR-43`, `101`, `EX-NFR-21`→`22` en périphérie) |
| T-18 | Aucun versionnement ni migration des données persistées localement | MAJEUR | `EX-CRUD-1`→`13`, `EX-NFR-24`, `27` |
| T-19 | Les six états par écran ne sont pas atteints sur les écrans C et E | MAJEUR | `REQUIREMENTS.md` § 8 / `EX-SCR-200`, `214` |
| T-20 | Le fil d'Ariane n'est pas défini pour les écrans C, D et E | MINEUR | `EX-SCR-45` |
| T-21 | Un filtre retenu n'a pas de type de contrôle, et `EX-SCR-67` n'énumère pas son périmètre | MINEUR | `EX-SCR-63`→`72` (`lsyeinmifrom`) |
| T-22 | Le bandeau de correction de paramètre d'A-04 n'a ni identifiant d'état ni rang de pile | MINEUR | A-04 / `EX-SCR-38` |
| T-23 | Aucune exigence d'impression | MINEUR | absent partout |
| T-24 | Le taux de vide par champ exigé par le panneau Diagnostic n'est produit par aucun agrégat | MINEUR | `EX-SCR-53` / `EX-DATA-46`, `106` |

**Décompte** : 9 BLOQUANT · 10 MAJEUR · 5 MINEUR · **24 constats**.

---

## Fiches détaillées

### T-01 — L'effectif annoncé par la source n'est porté par aucun champ

- **Sévérité proposée** : BLOQUANT
- **Localisation** : annexe A § A.9 (`EX-DATA-57`), § B.3 (`EX-DATA-68`), § C.0 (`EX-DATA-106`) ;
  exigé par annexe B `EX-SCR-31`, `EX-SCR-115`, `EX-SCR-116`, `EX-SCR-210`, et par le glossaire
  de `REQUIREMENTS.md` § 2 (« Couverture d'échantillon »).
- **Le trou** : le dictionnaire des 82 champs, les entités `MakeAggregate`/`ModelAggregate` et
  l'entité `Snapshot` ne comportent **aucun champ portant `n_tot`**, l'effectif total annoncé par
  la source (`listings.metadata.totalItems`, `topModels.listingsCount` de
  `FINDING-allowed-surface.md` § 2.1 et § 2.3), alors que trois exigences d'écran l'affichent
  littéralement.
- **Pourquoi ça bloque** : le bandeau `C3` (`Statistiques calculées sur <n_obs> annonces observées
  sur <n_tot> annoncées — couverture <p> %`) est **non refermable** quand `p < 20`, l'indicateur de
  couverture de chaque zone-modèle en dépend, et `EX-SCR-116` distingue le cas `n_obs = 0 ∧
  n_tot > 0`. Sans champ source, un développeur doit inventer d'où vient `n_tot` — et le seul
  substitut disponible dans l'annexe A est `listingCount`, qui est l'effectif **observé**, ce qui
  produirait une couverture systématiquement égale à 100 % et retournerait le sens de
  l'avertissement le plus important de l'application. Le glossaire définit la notion et aucune
  annexe ne la calcule : `coverage_m = n_m / N` (`EX-DATA-61`) est la couverture d'une *métrique*
  dans la sélection, pas la couverture de l'échantillon face à la source.
- **Résolution proposée** : ajouter à l'annexe A (a) un champ d'entité `Snapshot`
  `announcedListingCount` ; (b) sur `MakeAggregate` et `ModelAggregate`, `announcedCount`
  (`OBSERVÉ`, source `listings.metadata.totalItems` pour la marque,
  `topModels[].listingsCount` pour le modèle), `Si absent : INCONNU` ; (c) l'exigence
  `sampleCoverage = listingCount / announcedCount`, 4 décimales, `null` si `announcedCount` est
  `INCONNU` ; (d) la règle d'affichage quand `announcedCount` est `INCONNU` : le bandeau `C3`
  affiche `couverture inconnue` et ne prend aucun jeton coloré — jamais 100 %.

### T-02 — La liste normative des 78 filtres retenus n'existe pas

- **Sévérité proposée** : BLOQUANT
- **Localisation** : `REQUIREMENTS.md` § 6 et § 11.3 · A-01 « Exclusions maintenues, et elles
  seules » · `EX-SCR-82`/`EX-SCR-83` · annexe C § A.2.2.
- **Le trou** : aucun document n'énumère les 78 filtres retenus, et les trois décomptes
  disponibles sont mutuellement incompatibles :
  - A-01 énumère ses exclusions : `cid` (1) + 16 filtres non-voiture + `search_id`, `query_id`,
    `tier_rotation`, `show_nfm`, `adage` (5) + `mmm`, `pricetype` (2) = **24**, alors que le même
    arbitrage conclut « Total exclu : 23. Total retenu : 78 » — 101 − 24 = **77**.
  - `EX-SCR-83` clôt l'arithmétique sur 13 primaires + 52 secondaires + 3 désactivés + 2 tris +
    **31 hors périmètre** = 101, soit **70 filtres exposés**, pas 78.
  - Annexe C § A.2.2 porte encore 22 IN / 4 conditionnels / 75 OUT, table que A-01 ordonne de
    corriger « à l'assemblage » sans que la correction ait eu lieu.
  - `adage` est exclu par A-01 et retenu (secondaire, classe `T`) par `EX-SCR-82` ligne 76 ;
    `damaged_listing` est déclaré « à conserver absolument » par A-01 et classé `D` (présent,
    désactivé, non sérialisé) par `EX-SCR-74`.
- **Pourquoi ça bloque** : le périmètre du livrable est le point le plus littéral de la demande du
  commanditaire (« tous les filtres qui sont actuellement possibles »), et le critère S4 de la
  phase 2.1 exige un statut par filtre. Un développeur du lot D5 ne peut ni construire le bandeau,
  ni écrire le test de complétude de `EX-SCR-83` (qui compare `filters.json` à une table dont les
  cardinaux sont faux), ni décider si `atype`, `cat`, `mcat`, `tradeIn`, `lat`, `lon`, `page`,
  `size` — classés `X` par l'annexe B mais non exclus par A-01 — comptent parmi les 78.
- **Résolution proposée** : faire de `EX-SCR-82` la table unique et normative, y ajouter une
  colonne `Statut A-01 : RETENU | EXCLU` par filtre, recalculer le bilan et l'inscrire une seule
  fois dans `REQUIREMENTS.md` § 6, trancher nommément les deux cas litigieux (`adage`,
  `damaged_listing`), et supprimer la table § A.2.2 de l'annexe C au profit d'un renvoi.

### T-03 — Les 11 graphes additionnels de l'écran B exigent des agrégats que l'annexe A ne définit pas

- **Sévérité proposée** : BLOQUANT
- **Localisation** : `EX-SCR-149`, `EX-SCR-161` à `EX-SCR-170` (G5, G6, G7, G9, G10, G12, G13,
  G14, G15) et `EX-SCR-164` ; annexe A § B.2 à § B.7.
- **Le trou** : l'annexe A, seule autorité sur la définition mathématique (A-09), ne définit que
  trois objets : le bloc de 13 statistiques pour `price`/`year`/`mileage`, `BIN` sur ces trois
  métriques, et une grille de densité **année × kilométrage**. Aucun des agrégats suivants n'y
  existe :
  - médiane et effectif **par classe d'une variable catégorielle** (G9 carburant, G12 évaluation,
    G13 type de vendeur, G15 pays) ;
  - médiane, P25, P75 **par bucket d'année** (G5) et prix médian par bucket dans l'infobulle des
    trois histogrammes imposés (`EX-SCR-149`) — l'entité `DistributionBucket` d'`EX-DATA-83` porte
    `{index, lo, hi, open, count, share}` et rien d'autre ;
  - l'indice de dépréciation base 100 et la perte annuelle en pourcentage (G6) ;
  - les **quintiles observés du kilométrage** et les cinq boîtes à moustaches associées (G10) ;
  - la grille hexagonale de densité **prix × kilométrage** (G7) — `EX-DATA-102` définit une grille
    `année × kilométrage`, une autre partition ;
  - les paliers de 20 kW et la médiane par palier (G14) ;
  - le **`R²`** affiché en clair sous le titre de G8 (`Modèle : … n = 312, R² = 0,71`), qui
    n'apparaît nulle part dans l'annexe A — ni sa formule, ni la passe de la régression à deux
    passes d'`EX-DATA-93` sur laquelle il est calculé, ni son dénominateur (`F` ou `F'`).
- **Pourquoi ça bloque** : dix des quatorze graphes de l'écran imposé n° 2 ne sont pas calculables
  à partir des définitions écrites. Chaque développeur devra inventer une méthode de quantile par
  groupe, un découpage en quintiles, une base de dépréciation et une définition de `R²` — donc les
  chiffres affichés ne seront reproductibles ni entre deux implémentations, ni contre un test.
  C'est exactement l'objet de la règle d'autorité A-09, qui interdit aux écrans de porter la
  formule.
- **Résolution proposée** : ajouter à l'annexe A une section « agrégats par groupe » définissant
  une fonction unique `GROUPSTAT(Σ, clé de groupe, métrique) → bloc de 13 statistiques
  d'EX-DATA-64`, applicable aux clés `fuelCategory`, `priceEvaluationCategory`, `sellerType`,
  `countryCode`, bucket d'année de `BIN`, quintile de `mileageKm` (avec la définition du quintile
  par `Q(V, k/5)`) et palier de puissance (pas de 20 kW, origine 0) ; y ajouter la définition de
  l'indice de dépréciation, la grille de densité `prix × kilométrage` réutilisant les bins de
  `BIN`, et la définition de `R²` (`1 − SCR/SCT` sur `F` complet, coefficients de la passe 2).

### T-04 — Effectifs par option de filtre et double compteur : aucune définition, aucun budget

- **Sévérité proposée** : BLOQUANT
- **Localisation** : `EX-SCR-26`, `EX-SCR-46`, `EX-SCR-89`, `EX-SCR-90`, `EX-SCR-97` ;
  annexe A § B et `EX-DATA-110`.
- **Le trou** : trois exigences d'écran demandent des effectifs calculés sur des sélections
  **autres** que la sélection courante, et aucune n'est définie par l'annexe A :
  - `EX-SCR-90` : effectif par valeur d'énumération, « toutes contraintes appliquées sauf le
    filtre courant » (facette *leave-one-out*), pour tous les filtres de classe `R` — soit
    plusieurs centaines de valeurs de domaine ;
  - `EX-SCR-26` : les 3 filtres les plus restrictifs avec, pour chacun, le nombre d'offres que son
    retrait rendrait disponibles ;
  - `EX-SCR-46` : le compteur `<n> offres`, défini comme l'effectif « après application des
    filtres **hors** taxonomie marque/modèle », donc une seconde sélection permanente.
  Aucune entité, aucun `selectionHash` dérivé, aucune règle de calcul et **aucun poste de budget**
  ne leur correspond : `EX-DATA-110` chiffre un balayage de sélection unique (60 ms) dans un total
  de 450 ms, et `EX-DATA-109` refuse tout précalcul de sélection filtrée.
- **Pourquoi ça bloque** : un développeur doit inventer la sémantique du *leave-one-out* (retire-t-on
  la valeur ou le filtre entier ? les autres valeurs du même filtre restent-elles ?), le nombre de
  balayages supplémentaires, et arbitrer seul entre l'exigence d'affichage et un budget de temps
  qui ne les prévoit pas. Les chiffres entre parenthèses du bandeau sont vus à chaque interaction :
  s'ils divergent d'une implémentation à l'autre, le bandeau devient l'élément le moins fiable de
  l'application.
- **Résolution proposée** : définir en annexe A une entité `FacetCount`
  `{snapshotHash, selectionHash, filterId, code, count}` avec la règle explicite « prédicat de la
  sélection privé de **tous** les prédicats du filtre courant » ; imposer un calcul en **un seul
  balayage** par accumulation simultanée des compteurs de facette ; ajouter un poste de budget
  chiffré à `EX-DATA-110` ; et définir la seconde sélection d'`EX-SCR-46` comme un `selectionHash`
  dérivé nommé (`selectionHashWithoutTaxonomy`), calculé dans le même balayage.

### T-05 — Les entités `Make` et `Model` n'ont aucune définition de champs

- **Sévérité proposée** : BLOQUANT
- **Localisation** : `EX-DATA-105` et `EX-DATA-114` (annexe A § C.0 et § C.2) ; exigé par
  `EX-SCR-139`, `EX-SCR-140`, `EX-SCR-216`, `EX-SCR-221`, `EX-SCR-59`.
- **Le trou** : les entités `Make` et `Model` sont nommées, dotées d'une clé primaire et d'une
  taille de fichier, mais **aucune table de champs ne les décrit** — contrairement aux 82 champs de
  `Listing`. Il en manque au moins trois que les écrans utilisent nommément :
  - `slug` de marque et de modèle, exigé par la route de l'écran B
    (`/marche/:makeId-:makeSlug/:modelId-:modelSlug`) et par la redirection canonique
    d'`EX-SCR-140` ;
  - `bodyTypes` au niveau modèle (`topModels.bodyTypes`), qui est la **seule** justification de la
    classe `R` du filtre primaire `Carrosserie` sur l'écran A (`EX-SCR-59`, `EX-SCR-221`) et du
    jeton de carrosserie de l'en-tête de l'écran B ;
  - le libellé canonique, référencé comme `makes[].label` par les champs 17 et 19 de `Listing`
    sans jamais être défini comme champ d'entité.
- **Pourquoi ça bloque** : sans `slug` dans le modèle, la route imposée de l'écran B n'est pas
  constructible ; sans `bodyTypes` au niveau modèle, le filtre `body` de l'écran A n'est pas
  applicable localement et sa classe `R` est fausse. Le développeur devra soit inventer une source,
  soit dériver le `slug` du libellé — ce que `EX-SCR-140` interdit implicitement en marquant les
  `slug` de la taxonomie comme `[EXTRAPOLÉ]` et le `modelId` comme faisant foi.
- **Résolution proposée** : ajouter en annexe A § C.0 deux tables de champs :
  `Make {makeId, label, slug, listingsCountAnnounced?}` et
  `Model {makeId, modelId, label, slug, bodyTypes: tableau<KYCAR_BODY_TYPE>(0..n),
  listingsCountAnnounced?}`, chacune avec son niveau de preuve (`slug` : `RELEVÉ` quand fourni par
  `topModels`, `[EXTRAPOLÉ]` sinon) et sa règle `Si absent`.

### T-06 — L'encodage d'URL des routes et de l'état d'interface de l'annexe B est absent de l'annexe C

- **Sévérité proposée** : BLOQUANT
- **Localisation** : annexe C § A.1 et § A.2 (`EX-NAV-1`→`11`) ; exigé par `EX-SCR-50`,
  `EX-SCR-16`, `EX-SCR-92`, `EX-SCR-120`, `EX-SCR-123`, `EX-SCR-152`, `EX-SCR-185`, `EX-SCR-194`,
  `EX-SCR-202`.
- **Le trou** : l'annexe C, seule autorité sur l'encodage d'URL (A-09), ne connaît que quatre
  routes (`/`, `/modele/:makeId/:modelId`, `/recherches`, `/suivis`) et ne mentionne ni les routes
  retenues par `REQUIREMENTS.md` § 5 (`/marche`, `/marche/:makeId-:makeSlug/:modelId-:modelSlug`,
  `…/annonces`, `/comparer`), ni **aucun** des paramètres d'état d'interface que `EX-SCR-50` rend
  obligatoires dans l'URL :
  - `m=<modelId>,…` de l'écran C ; `sel=<empreinte>` de l'écran D ;
  - bascule d'échelle logarithmique par graphe (`g<n>log=1`, nommée par l'annexe B seule) ;
  - état de repliement de chacun des 13 groupes de filtres ;
  - liste des `makeId` de cartes dépliées sur l'écran A ;
  - vue active de `G4` (`G4a`/`G4b`), sélection de brossage, tri des cartes-marques (4 options
    d'`EX-SCR-120`, sans rapport avec le domaine du paramètre `sort` d'AutoScout24).
  Le cas de la sélection de brossage est le plus net : `EX-SCR-202` l'encode en une **empreinte**,
  alors que `EX-SCR-50` exige qu'une URL ouverte dans une fenêtre vierge restitue « un écran
  pixel-identique, y compris la sélection de brossage » — une empreinte ne restitue pas un
  sous-ensemble d'annonces.
- **Pourquoi ça bloque** : le partage par lien est le mécanisme central de l'application
  (`EX-NAV-18`) et il est testé par égalité stricte de chaîne sérialisée (§ 11.1). Un développeur
  ne peut ni nommer ces paramètres, ni décider s'ils comptent dans le plafond de 2 000 caractères
  d'`EX-NAV-10`, ni décider s'ils produisent une entrée d'historique (`EX-NAV-12` ne parle que des
  filtres), ni reconstituer une sélection de brossage depuis une empreinte.
- **Résolution proposée** : compléter l'annexe C par (a) la table des 6 routes de
  `REQUIREMENTS.md` § 5 ; (b) une table des **paramètres d'état d'interface** (nom, domaine,
  valeur par défaut omise, entrée d'historique oui/non, comptabilisation dans le plafond) ;
  (c) une décision explicite sur la sélection de brossage : encodage par bornes d'intervalle sur
  les axes du graphe (restituable) ou renoncement écrit à sa restitution, `EX-SCR-50` étant alors
  amendé.

### T-07 — La règle relative de prix sentinelle décidée en A-06 n'est écrite nulle part

- **Sévérité proposée** : BLOQUANT
- **Localisation** : A-06 ; `EX-DATA-19`, `EX-DATA-45` (vocabulaire `KYCAR_INGEST_FLAG`),
  `EX-DATA-60` (table des exclusions par métrique).
- **Le trou** : A-06 décide l'**union de deux règles** — un prix est sentinelle s'il est inférieur
  à 250 € **ou** inférieur à 10 % de la médiane de sa cellule d'homogénéité. La seconde branche
  n'existe dans aucune exigence : `EX-DATA-19` ne fixe que le seuil absolu, le vocabulaire à 14
  drapeaux ne comporte aucun code pour le cas relatif, et `EX-DATA-60` n'exclut du calcul de prix
  que `SUSPECT_PRICE_FLOOR`.
- **Pourquoi ça bloque** : la règle relative n'est pas calculable au même étage que la règle
  absolue. `SUSPECT_PRICE_FLOOR` est un drapeau d'**ingestion** (`ingestFlags`, posé une fois par
  annonce), tandis que la médiane de la cellule d'homogénéité dépend de la **sélection** courante
  (`EX-DATA-86`) : la même annonce est donc sentinelle ou non selon les filtres, et il faut décider
  (a) à quel étage la règle s'applique, (b) si l'exclusion d'une annonce modifie la médiane qui
  sert à décider de l'exclusion — donc s'il y a une passe de stabilisation, (c) le comportement
  quand la cellule est trop petite pour avoir une médiane fiable. Aucun développeur ne peut
  trancher cela sans inventer une règle métier, et `EX-SCR-36` continue par ailleurs de raisonner
  sur un seuil de 100 €.
- **Résolution proposée** : écrire en annexe A une exigence `EX-DATA-19bis` : nouveau code
  `SUSPECT_PRICE_RELATIVE` (vocabulaire porté à 15) ; calcul **au niveau de la sélection**, jamais
  à l'ingestion ; médiane de référence calculée **avant** toute exclusion relative, sur
  `V_price(C)` déjà purgé des seuls `SUSPECT_PRICE_FLOOR`, en **une seule passe sans itération** ;
  règle non appliquée quand `n_price(C) < 12` ; ajout du nouveau code à `EX-DATA-60` ; et
  alignement d'`EX-SCR-36` et de son commutateur `EX-SCR-95` sur ce seuil unique.

### T-08 — Le cycle de vie du jeu de données local face aux filtres de classe `T` n'est pas décrit

- **Sévérité proposée** : BLOQUANT
- **Localisation** : `EX-SCR-57`, `EX-SCR-58`, `EX-SCR-37`, `EX-SCR-32` ; `EX-DATA-34`,
  `EX-DATA-109` ; `EX-NFR-21`.
- **Le trou** : la classification `R`/`T` est le pivot de tout le bandeau — 52 filtres secondaires
  sont majoritairement `T`. Or aucune exigence ne dit **ce que devient le jeu de données local
  quand un filtre `T` est appliqué** : le `DataProvider` renvoie-t-il un snapshot remplacé, un
  sous-ensemble fusionné, ou une réponse déjà agrégée ? Le résultat d'un filtre `T` est-il mis en
  cache par état de filtre `T` ? Les filtres `R` s'appliquent-ils ensuite au sous-ensemble reçu ou
  au snapshot complet ? Le retrait d'un filtre `T` exige-t-il un nouvel appel ?
- **Pourquoi ça bloque** : les réponses déterminent des comportements visibles et contradictoires
  entre eux : la promesse d'`EX-SCR-32` (« les agrégats restent calculés sur la population
  entière ») n'est tenable que si l'on sait ce qu'est la population ; les facettes de classe `R`
  d'`EX-SCR-90` changent de dénominateur selon la réponse ; `EX-SCR-37` (hors ligne : `R` actifs,
  `T` désactivés) suppose un jeu local persistant que rien ne définit ; le cache LRU de 32 entrées
  d'`EX-DATA-109` est clefé par `selectionHash` sans distinguer les composantes `R` et `T`. Deux
  développeurs produiront deux applications aux chiffres différents.
- **Résolution proposée** : ajouter une exigence transverse (annexe C, § filtrage) : l'état de
  filtres est scindé en une **composante `T`** qui définit le jeu de données local
  (`localDatasetKey`, un appel `DataProvider` par valeur distincte, mise en cache) et une
  **composante `R`** appliquée en mémoire sur ce jeu ; tout effectif, toute facette et tout agrégat
  sont explicitement relatifs au jeu de données local courant, et le bandeau `C3` en donne
  l'effectif ; `selectionHash` est décomposé en `(localDatasetKey, refineHash)`.

### T-09 — La sélection de comparaison n'a ni état, ni persistance, ni règle marque/modèle

- **Sévérité proposée** : BLOQUANT
- **Localisation** : `EX-SCR-44`, `EX-SCR-111`, `EX-SCR-118`, `EX-SCR-194`, `EX-SCR-197` ;
  annexe C § C (la comparaison multi-modèles est écartée comme entité persistée) ;
  `REQUIREMENTS.md` § 7.
- **Le trou** : l'écran C et l'onglet `Comparer (n)` reposent sur une « sélection de comparaison »
  dont rien ne dit où elle vit ni comment elle évolue. Aucune exigence ne définit : sa portée
  (session, onglet, persistée), son ajout/retrait hors de l'écran C, sa survie à une navigation ou
  à un changement de snapshot, son plafond réel (`EX-SCR-111` : 4 ; `EX-SCR-216` : 12 couples ;
  `EX-SCR-194` : 4 avec surnuméraires ignorés), et son encodage tant que l'utilisateur n'est pas
  sur `/comparer`. Le point le plus net : `EX-SCR-111` ajoute une **marque** à la sélection, alors
  que la route de l'écran C n'accepte que des `modelId` (`m=<modelId>,…`) et que `EX-SCR-196`
  compare des modèles — comparer deux marques n'a **aucune représentation**.
- **Pourquoi ça bloque** : le compteur d'onglet, la case de comparaison des cartes-marques et des
  zones-modèles, et la règle de désactivation à 4 sélections sont tous spécifiés au pixel alors que
  l'objet qu'ils manipulent n'existe pas. Un développeur doit inventer un magasin d'état, sa
  persistance et le sens de « comparer une marque » — trois décisions métier.
- **Résolution proposée** : trancher explicitement l'un des deux termes : soit
  (a) `EX-SCR-111` est retiré (la comparaison porte sur des modèles seulement) et une entité de
  session `CompareSelection {modelKeys: (makeId, modelId)[0..4], portée = onglet, non persistée,
  vidée au changement de snapshot}` est ajoutée à l'annexe C avec son cycle de vie et son
  plafond unique de 4 ; soit (b) l'écran C accepte des périmètres de marque, ce qui impose
  d'étendre sa route (`m=<makeId>-<modelId|*>`) et ses agrégats. Dans les deux cas, aligner les
  trois plafonds.

### T-10 — Quatre surfaces référencées sans écran ni contrôle

- **Sévérité proposée** : MAJEUR
- **Localisation** : `EX-NAV-4`, `EX-CRUD-9`, `EX-CRUD-10` (modèles suivis) · `EX-CRUD-11` à
  `EX-CRUD-13` (historique récent) · `EX-CRUD-15` (export mode 1) · `EX-SCR-47` (lien `Mentions`) ;
  inventaire des écrans `REQUIREMENTS.md` § 5 et `EX-SCR-42`, `EX-SCR-142`.
- **Le trou** : quatre fonctions retenues n'ont aucune spécification d'écran ni de point d'entrée.
  1. **Modèles suivis** : la route `/suivis` existe en annexe C et le CRUD est retenu, mais
     l'inventaire des écrans n'en comporte aucun, l'en-tête a « exactement trois onglets »
     (`EX-SCR-42`) qui ne l'incluent pas, et l'en-tête statistique de l'écran B a « trois boutons »
     (`EX-SCR-142`) parmi lesquels le bouton bascule « suivre » exigé par `EX-CRUD-9` ne figure pas.
  2. **Historique des recherches récentes** : entité complète (10 entrées FIFO, action « vider »),
     sans route, sans écran, sans composant, sans emplacement.
  3. **Export du mode 1** : `EX-CRUD-15` en définit le périmètre, mais aucun contrôle `Exporter`
     n'existe sur l'écran A — le menu `Exporter` n'est spécifié que dans l'en-tête de l'écran B
     (`EX-SCR-187`), tandis que `EX-SCR-23` et `EX-SCR-29` désactivent un bouton `Exporter` sans
     dire où il se trouve.
  4. **`Mentions`** : lien obligatoire du pied de page, sans écran ni contenu cible.
- **Pourquoi ça bloque** : chaque développeur placera ces surfaces ailleurs, avec un contenu
  différent ; l'onglet manquant rend `/suivis` inatteignable au clavier comme à la souris.
- **Résolution proposée** : soit retirer explicitement ces fonctions du périmètre v1 (elles ne
  sont exigées par aucun des deux parcours cibles), soit ajouter à l'annexe B : un écran F
  `Modèles suivis` sur `/suivis` avec son onglet d'en-tête et le bouton bascule dans l'en-tête de
  l'écran B (quatre boutons au lieu de trois), l'historique récent comme panneau latéral du
  sélecteur de recherche ou section de l'écran E, un contrôle `Exporter` dans la barre de synthèse
  de l'écran A, et une page statique `Mentions`.

### T-11 — L'effectif de référence de l'écran E n'est pas un champ de l'entité

- **Sévérité proposée** : MAJEUR
- **Localisation** : `EX-SCR-212`, `EX-SCR-213` ; `EX-CRUD-1`.
- **Le trou** : l'écran E affiche « l'effectif au moment de l'enregistrement, l'effectif actuel, et
  l'écart entre les deux au format `+ 34 offres depuis le 02/09` », présenté par `EX-SCR-213`
  comme « la valeur ajoutée de l'écran ». Les champs de l'entité `RechercheSauvegardée`
  (`EX-CRUD-1`) sont `id`, `nom`, `url`, `mode`, `créée_le`, `dernier_accès_le` : **aucun effectif
  n'est stocké**, et aucune exigence ne dit quel effectif est mémorisé (nombre d'offres ? de
  marques ? de modèles ?), à quel instant il est capturé, ni s'il est réactualisé à chaque ouverture
  (ce qui annulerait l'écart) ou figé (ce qui le rend permanent).
- **Pourquoi ça bloque** : la veille de marché, seule justification de l'écran, n'est pas
  implémentable en l'état ; deux développeurs produiront deux sémantiques d'écart incompatibles.
- **Résolution proposée** : ajouter à `EX-CRUD-1` les champs `effectifInitial` (entier, nombre
  d'annonces de la sélection au moment de l'enregistrement) et `snapshotInitial` (`snapshotId`),
  figés à la création et jamais réécrits ; préciser que l'effectif actuel est recalculé à
  l'ouverture de l'écran E, que l'écart n'est affiché que si `snapshotInitial ≠ snapshot courant`,
  et qu'il est masqué (jamais nul) si l'effectif actuel n'est pas calculable.

### T-12 — Le sélecteur `G` n'a aucun état et aucune règle clavier

- **Sévérité proposée** : MAJEUR
- **Localisation** : `EX-SCR-215`, `EX-SCR-216` ; catalogue des états `EX-SCR-23` à `EX-SCR-39`.
- **Le trou** : le sélecteur marque/modèle est qualifié de « quasi obligatoire » — c'est la seule
  voie d'accès à l'écran B en dehors d'un clic sur une zone-modèle — et il est le seul écran du
  document sans **aucun** état : ni `ET-CHARGE-INIT` (les effectifs par entrée dépendent du
  périmètre filtré courant, donc d'un calcul), ni état d'erreur, ni comportement quand la recherche
  interne ne renvoie aucune marque ou aucun modèle (`EX-SCR-80` définit ce cas pour la recherche de
  *filtre*, pas ici), ni condition de désactivation du bouton `Appliquer` (sélection vide ?
  inchangée ?), ni règle de navigation clavier entre les deux panneaux alors que `EX-NFR-14` exige
  100 % des contrôles atteignables au clavier et que `EX-SCR-54` fait de cette modale l'une des deux
  seules fenêtres bloquantes autorisées.
- **Pourquoi ça bloque** : le développeur inventera le comportement de la recherche vide et de
  `Appliquer` ; le piège de focus d'une modale bloquante non spécifié est par ailleurs le défaut
  d'accessibilité le plus probable de l'application.
- **Résolution proposée** : ajouter à `EX-SCR-216` les six états par identifiant du catalogue, le
  texte de la recherche sans correspondance sur chacun des deux panneaux, la condition de
  désactivation de `Appliquer`, et la règle de focus (piège de focus, `Échap`, retour du focus au
  contrôle appelant, `Tab` circulaire entre les deux panneaux).

### T-13 — L'étiquetage obligatoire de la base de comparaison d'outlier n'a aucun emplacement d'écran

- **Sévérité proposée** : MAJEUR
- **Localisation** : A-07 (« contrainte ajoutée, et elle est obligatoire ») ; `EX-DATA-87`
  (`cellLevel`, `cellSize` publiés) ; `EX-SCR-158`, `EX-SCR-164`, `EX-SCR-166`, `EX-SCR-203`,
  `EX-SCR-207`.
- **Le trou** : A-07 impose que « chaque affichage d'outlier doit nommer sa base de comparaison et
  son effectif », par exemple `écart calculé sur : Opel Corsa · 2017 · n = 143`. L'annexe A publie
  bien `cellLevel` et `cellSize`, mais **aucune exigence d'écran n'affiche ces deux valeurs** :
  l'infobulle de point de `G4` (5 lignes énumérées) ne les contient pas, la colonne « Écart au prix
  attendu » de l'écran D et son liseré `EX-SCR-207` non plus, les points hors moustaches de `G10`
  non plus ; seul `G8` affiche un `n` — celui de son propre ajustement, sans nommer le niveau de
  cellule.
- **Pourquoi ça bloque** : A-07 fonde explicitement la défendabilité de la décision sur cet
  étiquetage (« c'est l'étiquetage qui rend la décision défendable, pas le calcul »). Sans
  emplacement spécifié, il ne sera pas implémenté, ou le sera à quatre endroits différents.
- **Résolution proposée** : ajouter une exigence transverse à l'annexe B : tout élément affichant
  un verdict d'outlier ou un écart au prix attendu porte, à l'écran ou en infobulle, la chaîne
  normative `écart calculé sur : <périmètre de cellule> · n = <cellSize>` dérivée de `cellLevel`
  (`MODEL_YEAR` → `<Marque> <Modèle> · <année>`, `MODEL` → `<Marque> <Modèle>`, `SELECTION` →
  `sélection courante`) ; ajouter la ligne à l'infobulle de `G4` (6 lignes) et à l'infobulle de la
  colonne d'écart de l'écran D.

### T-14 — La fourchette brute secondaire et son étiquetage n'ont aucun emplacement dans la zone-modèle

- **Sévérité proposée** : MAJEUR
- **Localisation** : A-05 ; `EX-DATA-69` (`displayRange` / `rawRange`) ; `EX-SCR-112`,
  `EX-SCR-113`, `EX-SCR-109`, `EX-SCR-4`.
- **Le trou** : A-05 décide que l'écran A affiche `[p05, p95]` **en principal** et `[min, max]`
  **en secondaire discret**, et ajoute la contrainte que l'étiquetage doit dire quand `[p05, p95]`
  est affiché. L'annexe B ne porte ni l'un ni l'autre : `EX-SCR-113` énumère « le contenu exact de
  la zone-modèle, dans cet ordre, aucun élément optionnel » en 9 éléments dont une seule fourchette
  de prix, sans slot pour la fourchette brute ni pour son étiquette, et `EX-SCR-4` ne dit pas
  quelles bornes il formate. La bande fait 72 px et ses lignes sont chiffrées : il n'y a pas de
  place prévue.
- **Pourquoi ça bloque** : l'arbitrage qualifie l'absence d'étiquette de « mensonge par omission ».
  Le développeur devra inventer où placer une seconde fourchette dans une bande dont la
  composition est déclarée exacte, ou l'omettre.
- **Résolution proposée** : amender `EX-SCR-113` et `EX-SCR-109` : la fourchette principale est
  `displayRange` et porte le suffixe normatif `(90 % des offres)` ; la fourchette brute
  `rawRange` est affichée dans l'infobulle de la fourchette principale au format
  `min–max observés : <min> – <max> €`, sans consommer de hauteur ; l'écran B et l'écran D
  affichent `rawRange` en principal, conformément à A-05.

### T-15 — La charge utile du point de nuée est incomplète pour la vue et l'infobulle spécifiées

- **Sévérité proposée** : MAJEUR
- **Localisation** : `EX-DATA-98` (« aucun autre champ n'est transmis à la vue ») ; `EX-SCR-151`,
  `EX-SCR-153`, `EX-SCR-158`.
- **Le trou** : la liste close des champs transmis par point ne contient ni le **mois** de première
  immatriculation (seul `firstRegistrationYear` y figure) ni la **catégorie d'évaluation
  AutoScout24**. Or `EX-SCR-153` définit l'axe X de `G4b` comme la « date de première
  immatriculation, continue, graduations annuelles au 1ᵉʳ janvier » et `EX-SCR-158` exige dans
  l'infobulle `1ʳᵉ immat. <MM/AAAA>` puis « le jeton d'évaluation AutoScout24 (`Très bon prix` /
  `Bon prix` / `Prix correct`) s'il est présent ».
- **Pourquoi ça bloque** : la clause « aucun autre champ n'est transmis » est normative et
  justifiée par un budget mémoire. Le développeur doit soit violer l'annexe A, soit dégrader `G4b`
  en axe annuel discret et amputer l'infobulle — deux issues divergentes, sur le graphe qui porte
  la demande littérale du commanditaire.
- **Résolution proposée** : porter la charge utile d'`EX-DATA-98` à 13 champs en ajoutant
  `firstRegistrationYearMonth` (à la place de `firstRegistrationYear`, dont l'année se dérive) et
  `priceEvaluationCategory`, et recalculer l'enveloppe annoncée (≈ 300 Ko pour 5 000 points).

### T-16 — Les colonnes de l'export CSV ne sont définies par aucune annexe

- **Sévérité proposée** : MAJEUR
- **Localisation** : `EX-CRUD-15`, `EX-CRUD-16` ; `EX-SCR-187` ; annexe A (aucune section export).
- **Le trou** : `EX-CRUD-15` définit les colonnes de l'export du mode 1 comme « les agrégats
  affichés sur la carte — la liste exacte des colonnes relève de `draft-data-dictionary.md` », et
  l'annexe A **ne contient aucune spécification d'export** : ni liste de colonnes, ni ordre, ni
  en-têtes, ni format des valeurs nulles, ni règle de nommage de fichier. Le renvoi est circulaire.
  `EX-SCR-187` ajoute un en-tête de fichier (date de snapshot, chaîne de filtres, taux de
  couverture) dont le format n'est pas décrit non plus.
- **Pourquoi ça bloque** : l'export est un livrable CRUD retenu et un test de recette ; deux
  développeurs produiront deux fichiers de structures différentes, non comparables.
- **Résolution proposée** : ajouter en annexe A une section « exports » donnant, par périmètre
  (agrégats mode 1, buckets mode 2, points de nuée, annonces), la liste ordonnée des colonnes avec
  le nom d'en-tête exact et le champ KYCAR correspondant, la représentation du `INCONNU` (cellule
  vide, jamais `0`), et le format des trois lignes de métadonnées d'en-tête de fichier.

### T-17 — Le déclenchement du rafraîchissement et le remplacement d'un snapshot ne sont pas décrits

- **Sévérité proposée** : MAJEUR
- **Localisation** : absent partout ; périphérie : `EX-SCR-43`, `EX-SCR-101`, `EX-NFR-21`,
  `EX-NFR-22`, `EX-DATA-106`.
- **Le trou** : aucune exigence ne décrit **quand** l'application demande des données au
  `DataProvider` (au chargement uniquement ? périodiquement ? sur action utilisateur ?), s'il
  existe un contrôle de rafraîchissement, combien de snapshots coexistent localement, ce qui est
  purgé quand un snapshot remplace le précédent (cache LRU de 32 sélections, agrégats précalculés
  `selectionHash = EMPTY`, dernier snapshot mis en cache d'`EX-NFR-22`), et comment l'utilisateur
  est informé qu'un nouveau snapshot a remplacé celui qu'il lisait pendant sa session.
  `EX-SCR-101` traite le seul cas d'un filtre devenu sans effet ; `EX-SCR-43` traite le seul
  affichage de l'âge.
- **Pourquoi ça bloque** : c'est la question dont dépendent la fraîcheur affichée, la validité du
  cache et la cohérence des chiffres au sein d'une session. Un développeur choisira « une requête
  au chargement, aucun rafraîchissement » ou « une revalidation à chaque navigation » : deux
  applications au comportement observable différent.
- **Résolution proposée** : ajouter à l'annexe C une section « cycle de vie du snapshot » : un seul
  snapshot actif à la fois ; acquisition au démarrage et sur action explicite `Rafraîchir` placée
  dans le jeton de snapshot d'`EX-SCR-43` ; aucune acquisition automatique en cours de session ;
  au remplacement, purge du cache LRU et des agrégats précalculés, conservation des entités CRUD,
  et bandeau non bloquant `Nouvelles données du <date> — la page a été recalculée`.

### T-18 — Aucun versionnement ni migration des données persistées localement

- **Sévérité proposée** : MAJEUR
- **Localisation** : `EX-CRUD-1` à `EX-CRUD-13`, `EX-NFR-24`, `EX-NFR-27`.
- **Le trou** : trois entités sont persistées sans expiration dans `localStorage`/`IndexedDB`, et
  aucune exigence ne prévoit de numéro de version de schéma, de règle de migration, ni de
  comportement de lecture d'une entrée écrite par une version antérieure de l'application. Le cas
  est certain, pas hypothétique : une recherche sauvegardée est une **URL** dont le vocabulaire de
  paramètres évolue (T-02, T-06), et `EX-CRUD-4` interdit d'en modifier le contenu.
- **Pourquoi ça bloque** : sans règle, une évolution des paramètres transformera silencieusement
  50 recherches sauvegardées en liens partiellement corrigés (`EX-NAV-21`) sans que l'utilisateur
  sache lesquels ont changé de sens. Le développeur inventera sa propre stratégie.
- **Résolution proposée** : ajouter `EX-CRUD-*` : chaque enregistrement porte
  `schemaVersion` (entier) ; à la lecture, une entrée de version inférieure est migrée par une
  fonction nommée ou, à défaut de migration disponible, conservée et marquée
  `à vérifier — enregistrée par une version antérieure`, jamais supprimée silencieusement ; aucune
  entrée n'est jamais réécrite en lecture.

### T-19 — Les six états par écran ne sont pas atteints sur les écrans C et E

- **Sévérité proposée** : MAJEUR
- **Localisation** : `REQUIREMENTS.md` § 8 (« Six états spécifiés par écran ») ; `EX-SCR-200`
  (écran C), `EX-SCR-214` (écran E).
- **Le trou** : l'écran E ne spécifie que deux situations (liste vide, confirmation de suppression)
  et **aucun état de chargement ni d'erreur**, alors qu'il affiche un « effectif actuel » par
  carte, donc dépend d'un calcul et peut échouer. L'écran C ne spécifie que trois situations
  (chargement colonne par colonne, erreur d'une colonne, colonne à `n = 0`) et n'a ni état « zéro
  résultat pour toutes les colonnes », ni `ET-TROP-RESULTATS`, ni `ET-CHAMP-MANQUANT`. La règle de
  la section 8 est donc fausse pour deux des six écrans.
- **Pourquoi ça bloque** : ce sont précisément les états que les développeurs omettent quand ils ne
  sont pas écrits, et la matrice de recette § 11.1 prétend les vérifier écran par écran.
- **Résolution proposée** : compléter `EX-SCR-200` et `EX-SCR-214` par la liste des six états
  référencés par identifiant du catalogue, en indiquant explicitement « sans objet, motif : … »
  pour ceux qui ne s'appliquent pas — plutôt que de les omettre.

### T-20 — Le fil d'Ariane n'est pas défini pour les écrans C, D et E

- **Sévérité proposée** : MINEUR
- **Localisation** : `EX-SCR-45` ; écrans `EX-SCR-194`, `EX-SCR-202`, `EX-SCR-212`.
- **Le trou** : le fil d'Ariane est un élément de la coquille `S0`, donc présent sur tous les
  écrans, avec « segments : `Marché` > `<marque>` > `<modèle>` » et hauteur fixe. Rien ne dit ce
  qu'il affiche sur `/comparer`, sur `…/annonces` (un quatrième niveau serait attendu) et sur
  `/recherches`, ni quel est le chemin de retour depuis l'écran D vers l'écran B.
- **Pourquoi ça bloque** : chacun choisira ses segments ; le retour depuis la liste d'annonces
  vers la distribution n'a aucun contrôle nommé.
- **Résolution proposée** : compléter `EX-SCR-45` par une table des segments par route :
  `/comparer` → `Marché > Comparaison` ; `…/annonces` → `Marché > <marque> > <modèle> > Annonces`,
  le segment `<modèle>` ramenant à l'écran B avec les filtres conservés ; `/recherches` →
  `Marché > Recherches enregistrées`.

### T-21 — Un filtre retenu n'a pas de type de contrôle, et `EX-SCR-67` n'énumère pas son périmètre

- **Sévérité proposée** : MINEUR
- **Localisation** : `EX-SCR-63` à `EX-SCR-72`, en particulier `EX-SCR-67`.
- **Le trou** : `EX-SCR-67` couvre « les 24 couples d'intervalle du catalogue retenus » sans les
  énumérer, alors que toutes les autres exigences de type de contrôle listent nommément les filtres
  concernés. Le catalogue ne compte que 12 couples `from`/`to` (24 paramètres), et le paramètre
  `lsyeinmifrom` (kilométrage annuel de leasing, filtre 21) est une borne **isolée**, sans jumeau :
  il n'apparaît dans aucune des exigences `EX-SCR-63` à `EX-SCR-72` et n'a donc aucun type de
  contrôle.
- **Pourquoi ça bloque** : un filtre retenu sans contrôle ne sera pas construit, et le test de
  complétude d'`EX-SCR-83` ne le détecte pas puisqu'il vérifie l'affectation de groupe et de
  classe, pas l'affectation d'un contrôle.
- **Résolution proposée** : énumérer dans `EX-SCR-67` les 12 couples couverts, et ajouter un
  contrôle à borne unique (`au moins <valeur>`) pour `lsyeinmifrom` ; ajouter au test
  d'`EX-SCR-83` la vérification qu'un filtre non `X` a exactement un type de contrôle.

### T-22 — Le bandeau de correction de paramètre d'A-04 n'a ni identifiant d'état ni rang de pile

- **Sévérité proposée** : MINEUR
- **Localisation** : A-04 ; `EX-SCR-38` (pile de bandeaux) ; `EX-NAV-21`, `EX-NAV-22`.
- **Le trou** : A-04 crée un nouveau bandeau non bloquant nommant le paramètre corrigé et la valeur
  retenue. Il n'a pas d'identifiant d'état dans le catalogue `EX-SCR-23`→`39`, pas de rang dans la
  pile d'`EX-SCR-38` (limitée à deux bandeaux simultanés et 96 px), pas de texte normatif, et pas
  de durée de vie (persistant sur la page ? refermable ? disparaît au filtre suivant ?).
- **Pourquoi ça bloque** : avec un plafond de deux bandeaux, l'ordre de priorité décide si
  l'avertissement est vu ou replié derrière un jeton ; le choix sera fait au hasard.
- **Résolution proposée** : ajouter `ET-URL-CORRIGEE` au catalogue (texte
  `Paramètre « <nom> » corrigé : valeur retenue <valeur>`, refermable, disparaît au prochain
  changement de filtre) et l'insérer dans l'ordre d'`EX-SCR-38` entre `ET-TROP-RESULTATS` et
  `C3 couverture`.

### T-23 — Aucune exigence d'impression

- **Sévérité proposée** : MINEUR
- **Localisation** : absent partout.
- **Le trou** : aucune exigence ne traite l'impression ou l'export PDF d'un écran : ni feuille de
  style d'impression, ni décision de non-périmètre. L'impression n'est ni spécifiée, ni écartée —
  contrairement à l'export d'image, écarté explicitement par `EX-CRUD-17`.
- **Pourquoi ça bloque** : à défaut de décision, l'impression produira une capture des éléments
  collants et des bandeaux, sans les tables de données équivalentes ; c'est le genre de finition
  qu'on découvre après livraison.
- **Résolution proposée** : ajouter une exigence non fonctionnelle, au choix : « l'impression est
  hors périmètre v1 » (décision écrite), ou une feuille `@media print` minimale (en-tête et
  bandeau de filtres remplacés par un résumé textuel des filtres actifs, bandeaux d'état et
  couverture imprimés, graphes accompagnés de leur table de données d'`EX-SCR-188`).

### T-24 — Le taux de vide par champ exigé par le panneau Diagnostic n'est produit par aucun agrégat

- **Sévérité proposée** : MINEUR
- **Localisation** : `EX-SCR-53` ; `EX-DATA-46`, `EX-DATA-106`.
- **Le trou** : le panneau `Diagnostic des données` affiche, pour chaque champ attendu par les
  écrans, l'état `présent` / `absent de la source` / `présent mais vide sur <k> annonces`. Le
  rapport d'ingestion de l'annexe A publie les effectifs de drapeaux et les couvertures des trois
  métriques `price`/`year`/`mileage`, mais **aucun compteur de valeurs `INCONNU` par champ**.
- **Pourquoi ça bloque** : le troisième état du panneau n'est pas calculable ; le développeur
  ajoutera un comptage ad hoc sur un sous-ensemble de champs de son choix.
- **Résolution proposée** : ajouter à l'entité `Snapshot` un champ
  `unknownCountByField: map<champ, entier>` couvrant les champs listés en `EX-DATA-57` hors
  « diagnostic », alimenté à l'ingestion, et le rendre la source unique du panneau `EX-SCR-53`.

---

## Journal des huit parcours

### Parcours 1 — Par écran : états et éléments interactifs

**Couvert** : les 9 écrans et composants de l'inventaire (`S0`, `C1`, `C3`, A, B, C, D, E, G),
confrontés au catalogue des 13 états `ET-*` d'`EX-SCR-23`→`39` et à la règle des « six états par
écran » de `REQUIREMENTS.md` § 8 ; pour chaque élément interactif nommé, recherche de son action,
de sa cible, de son état désactivé et de la condition de désactivation.
**Trouvé** : T-12 (écran G sans aucun état ni règle clavier), T-19 (écrans C et E incomplets),
T-10 partiellement (contrôles manquants : bouton « suivre », `Exporter` du mode 1, cible du lien
`Mentions`), T-22 (bandeau A-04 sans identifiant).
**Vérifié sans trou** : les écrans A et B sont les mieux couverts du document — les six états y
sont nommés par identifiant et les conditions de désactivation des contrôles de filtre sont
déclarées exhaustives et le sont effectivement (`EX-SCR-88`, quatre cas plus infobulle
obligatoire).

### Parcours 2 — Par transition : matrice des navigations

**Couvert** : matrice 6 × 6 des transitions entre écrans, plus l'arrivée directe par lien sur
chaque route (nouvel onglet, favori, lien partagé), plus le comportement du bouton précédent.
**Trouvé** : T-06 (les routes retenues et l'état d'interface ne sont pas encodés par l'annexe C,
qui en est l'autorité ; la sélection de brossage de l'écran D n'est pas restituable depuis une
empreinte), T-20 (fil d'Ariane et chemin de retour de D, C, E), T-09 (aucun état pour la
sélection de comparaison, donc la transition A → C n'a pas d'objet à transporter).
**Vérifié sans trou** : les transitions A ↔ B sont couvertes deux fois et de façon concordante
(`EX-SCR-51`, `EX-NAV-15`→`17`) ; l'arrivée directe avec un `makeId`/`modelId` invalide est traitée
(`EX-NAV-19`, `EX-NAV-20`) ; la redirection sur `slug` erroné est traitée (`EX-SCR-140`).

### Parcours 3 — Par champ : rattachement des 82 champs, et réciproque

**Couvert** : les 82 champs du dictionnaire contre la table de rattachement `EX-DATA-57` (aucun
orphelin confirmé, y compris les 32 champs classés « diagnostic » dont `EX-DATA-58` assume la
non-exposition) ; puis le sens inverse, élément affiché par élément affiché, sur les écrans A, B, C,
D et E.
**Trouvé** : T-01 (`n_tot` affiché sur trois écrans, absent du modèle), T-05 (entités `Make` et
`Model` sans champs, alors que `slug` et `bodyTypes` sont exigés par les écrans), T-15 (charge utile
du point de nuée incomplète), T-11 (effectif de référence de l'écran E), T-24 (compteur de vides
par champ).
**Vérifié sans trou** : les 16 colonnes de l'écran D sont toutes rattachées à un champ relevé et la
liste des cinq colonnes interdites est explicite (`EX-SCR-203`, `EX-SCR-204`) ; les trois
fourchettes de la zone-modèle sont rattachées (leur *étiquetage* est un trou, T-14, pas leur
source).

### Parcours 4 — Par agrégat : calculabilité des 14 graphes et des agrégats

**Couvert** : les 14 graphes de l'écran B, les 4 rangées de l'écran C, les 2 agrégats
(`MakeAggregate`, `ModelAggregate`), la vue tri-dimensionnelle et la grille de densité, confrontés
un à un aux seules définitions mathématiques de l'annexe A (§ B.1 à § B.7).
**Trouvé** : T-03 (dix graphes exigent des agrégats par groupe, des quintiles, un indice de
dépréciation, une grille `prix × km` et un `R²` que l'annexe A ne définit pas), T-04 (facettes et
double compteur), T-07 (la règle relative de prix sentinelle décidée en A-06 n'existe dans aucune
exigence, et son étage de calcul est indécidable).
**Vérifié sans trou** : `G1`, `G2`, `G3` et `G4` — les quatre affichages exigés par le
commanditaire — sont intégralement calculables avec `BIN`, le bloc de 13 statistiques et
`EX-DATA-98`→`103` ; M1, M2 et M3 sont spécifiés au niveau de la formule, avec leurs seuils, leurs
cas dégénérés et leurs invariants I1 à I8.

### Parcours 5 — Par filtre : contrôle, encodage, application, dépendance

**Couvert** : les 101 filtres du catalogue, chacun contre quatre questions — contrôle d'interface,
encodage d'URL, application au dataset, comportement de dépendance — en croisant `EX-SCR-82`,
`EX-SCR-63`→`74`, `EX-NAV-5`→`11` et `EX-SRCH-1`→`20`.
**Trouvé** : T-02 (la liste des 78 n'existe pas et trois décomptes se contredisent), T-08 (le
devenir du jeu de données local sous un filtre de classe `T` n'est décrit nulle part, ce qui rend
indécidables l'effectif, les facettes et le cache), T-21 (`lsyeinmifrom` sans contrôle ;
`EX-SCR-67` sans périmètre énuméré).
**Vérifié sans trou** : contrairement à ce que la table obsolète de l'annexe C laissait craindre,
l'annexe B affecte bien un groupe, un rang et une classe à **chacun** des 101 filtres, y compris
aux 20 réintégrés par A-01 ; les dépendances parent-enfant sont couvertes (`EX-SCR-73`,
`EX-SRCH-14`→`17`) et le principe de nommage d'URL est générique donc applicable aux filtres
réintégrés (`EX-NAV-5`).

### Parcours 6 — Par exigence croisée : seuils, formules et méthodes invoqués d'une annexe à l'autre

**Couvert** : toutes les mentions, dans l'annexe B, d'un seuil, d'une formule ou d'une méthode, avec
recherche de leur définition en annexe A ; puis toutes les mentions, dans l'annexe A, d'un affichage
ou d'une obligation d'étiquetage, avec recherche de leur emplacement en annexe B ; puis les neuf
arbitrages, avec recherche de leur traduction en exigence.
**Trouvé** : T-03 (`R²`), T-07 (A-06), T-13 (A-07 : obligation d'étiquetage sans emplacement),
T-14 (A-05 : fourchette secondaire et étiquette sans emplacement), T-16 (colonnes d'export :
renvoi circulaire entre les annexes C et A).
**Vérifié sans trou** : A-02 (l'écran D existe et les quatre filtres de tri/pagination sont traités),
A-08 (`gear` primaire, classe `T`, graphe écarté — les trois volets sont écrits), A-09 (la règle
d'autorité est explicite et opposable).

### Parcours 7 — Par cycle de vie : ingestion, rafraîchissement, péremption, migration

**Couvert** : arrivée d'un snapshot, coexistence de deux snapshots, remplacement, péremption,
disparition d'un modèle entre deux snapshots, invalidation du cache, durée de vie des entités
persistées, versionnement de schéma.
**Trouvé** : T-17 (déclenchement de l'acquisition, remplacement et purge non décrits ; aucun
contrôle de rafraîchissement n'existe dans aucun écran), T-18 (aucun versionnement des données
locales alors qu'une recherche sauvegardée est une URL dont le vocabulaire évoluera).
**Vérifié sans trou** : la péremption **affichée** est traitée avec ses seuils (`EX-SCR-43` :
7 jours ambre, 30 jours rouge) ; la disparition d'un modèle est traitée du côté des filtres
(`EX-SCR-101`) et du côté des recherches enregistrées (`EX-SCR-213`) ; le doublon de `listingId`
au sein d'un snapshot est traité (`EX-DATA-15`).

### Parcours 8 — Par rôle non traité : premier lancement, hors ligne, chargement partiel, langue, impression, export

**Couvert** : premier lancement sans aucune donnée, échec du fournisseur, absence de connexion,
dataset partiellement chargé, changement de langue, impression, export.
**Trouvé** : T-23 (impression ni spécifiée ni écartée), T-16 (export : colonnes non définies),
T-10 (export du mode 1 sans contrôle).
**Vérifié sans trou** : le premier lancement sans données est traité et **qualifié de panne** et
non de résultat vide (`EX-SCR-27`, `EX-NFR-23`) ; l'échec du fournisseur est chiffré (délai
5 000 ms, 3 tentatives, intervalles croissants, repli sur cache daté — `EX-NFR-21`, `EX-NFR-22`,
`EX-SCR-28`, `EX-SCR-29`) ; le chargement partiel est traité à trois granularités (bandeau
`C3`, carte partielle `EX-SCR-132`, grille partielle `EX-SCR-133`) ; le changement de langue est
sans objet, l'interface étant mono-langue déclarée (`EX-NFR-28`), et la stratégie de surcharge des
libellés non traduits est spécifiée et mesurable (`EX-NFR-29`, `EX-NFR-30`).

**Parcours n'ayant produit aucun constat propre** : aucun. Les huit parcours ont chacun produit au
moins un constat, mais les parcours 1, 2 et 8 n'ont produit **aucun constat BLOQUANT propre** — les
neuf BLOQUANT proviennent des parcours 3, 4, 5 et 6, c'est-à-dire des croisements entre annexes
plutôt que de l'intérieur d'une annexe. C'est le résultat le plus notable de l'audit : chaque
annexe est complète dans son domaine, et les trous sont presque tous à leurs frontières.
