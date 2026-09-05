# Comportement — Navigation, recherche/filtrage, CRUD, exigences non fonctionnelles

> Section rédigée par l'agent `req-behaviour` (phase 2.1). Ne couvre ni le dictionnaire de données
> (`draft-data-dictionary.md`) ni la disposition des écrans (`draft-screens.md`). Toute référence à
> un champ ou à un élément d'écran est un pointeur, pas une définition.
>
> Sources : `docs/00-CONTEXT.md`, `docs/plans/PLAN-2-app-build.md`, `docs/requirements/REF-filters.md`
> (101 filtres, tableau de synthèse + zones d'ombre Z1-Z8), `docs/research/FINDING-allowed-surface.md`
> (limites P1-P6).

---

## A. Navigation et URL

### A.1 Inventaire des routes

| ID | Route | Mode | Paramètres de chemin | Rôle |
|---|---|---|---|---|
| EX-NAV-1 | `/` | Mode 1 — exploration descendante | aucun | Écran de survol marque/modèle. Route par défaut de l'application. |
| EX-NAV-2 | `/modele/:makeId/:modelId` | Mode 2 — analyse d'un modèle | `makeId`, `modelId` (identifiants numériques `taxonomy.json`) | Écran de distribution pour un couple marque/modèle précis. |
| EX-NAV-3 | `/recherches` | — (gestion CRUD) | aucun | Liste des recherches sauvegardées (§C.1). N'affiche aucun résultat de marché ; pure gestion. |
| EX-NAV-4 | `/suivis` | — (gestion CRUD) | aucun | Liste des modèles suivis (§C.2), avec accès direct à `/modele/:makeId/:modelId` pour chacun. |

**Décision — pourquoi le marque/modèle est un segment de chemin et non un paramètre de requête** :
`makeId`/`modelId` désignent l'**identité de la page** (quel marché est observé), pas un critère de
raffinement au sein d'une page. Les 97 autres filtres du bandeau, eux, raffinent le contenu de la
page courante sans en changer l'identité — ils restent en paramètres de requête. Ce découpage
reflète aussi la distinction du commanditaire entre les deux modes (00-CONTEXT.md : le mode 2 se
définit par le fait qu'un couple marque/modèle est *ciblé*, le mode 1 par son absence).

### A.2 Encodage de l'état de recherche dans l'URL

#### A.2.1 Principe de nommage — décision et justification

**EX-NAV-5** — Tout filtre retenu dans le périmètre KYCAR (voir tableau §A.2.2) conserve **le nom de
paramètre d'URL relevé sur AutoScout24** (colonne « Paramètre d'URL » de `REF-filters.md`), sans
renommage. Trois raisons :
1. Règle R6 — le catalogue est relevé, pas inventé ; le réutiliser tel quel évite d'introduire un
   second vocabulaire non tracé.
2. L'adaptateur `DataProvider` réel (lot D9, conditionné au chantier 1) mappera vraisemblablement
   ses propres requêtes sur ce vocabulaire ; le réutiliser dans l'URL applicative supprime une
   couche de traduction.
3. Un lien KYCAR copié-collé reste lisible par quiconque a consulté `REF-filters.md`.

Exception : les concepts propres à KYCAR sans équivalent AutoScout24 reçoivent un nom KYCAR
explicite plutôt qu'un détournement d'un paramètre existant :
- `make` (multi-valeurs, liste de `makeId` séparés par virgule) — filtre marque du **mode 1
  uniquement**. Il n'est PAS `mmmv` : `mmmv` encode marque+modèle+version en un seul bloc structuré
  fait pour le mode « annonce individuelle » d'AutoScout24 ; le mode 1 de KYCAR ne filtre que sur la
  marque (le modèle n'existe pas encore comme critère à ce stade). Réutiliser `mmmv` avec des
  segments modèle/version vides aurait été plus ambigu qu'un paramètre dédié.

#### A.2.2 Table de correspondance — les 101 filtres relevés

Légende des motifs : **J1** économie de portée (ne sert aucun des deux parcours cibles, `00-CONTEXT.md`) ·
**J2** cosmétique/marketing, non structurant pour une analyse de marché · **J3** financement/leasing,
axe orthogonal aux deux parcours · **J4** paramètre technique interne AS24, sans objet derrière
`DataProvider` (R2) · **J5** interdit par R3 (identifiant vendeur) · **J6** domaine non exploitable
(zone d'ombre Z3/Z4/Z6 de `REF-filters.md`) · **J7** `atype≠C` : domaine vide pour les voitures ·
**J8** redondant avec un filtre déjà retenu · **J9** cœur d'un des deux parcours cibles ·
**J10** signal explicatif secondaire retenu pour l'investigation d'outliers en mode 2.

| # | Filtre | Décision | Paramètre KYCAR | Motif |
|---|---|---|---|---|
| 1 | `atype` | IN (fixé) | `atype` (toujours `C`, non exposé à l'utilisateur) | J9 |
| 2 | `mmmv` | OUT (remplacé) | — (voir `make` et routes) | J8 |
| 3 | `cat` | OUT | — | J6 |
| 4 | `mcat` | OUT | — | J6 |
| 5 | `version0` | OUT | — | J1 |
| 6 | `offer` | IN | `offer` | J9 |
| 7 | `kwd` | IN | `kwd` | J9 |
| 8 | `pricefrom` | IN | `pricefrom` | J9 |
| 9 | `priceto` | IN | `priceto` | J9 |
| 10 | `pricetype` | OUT | — | J6 |
| 11 | `vatded` | OUT | — | J3 |
| 12 | `superdeal` | OUT | — | J2 |
| 13 | `pe_category` | OUT (v1) | — | J1 |
| 14 | `financeratefrom` | OUT | — | J3 |
| 15 | `financerateto` | OUT | — | J3 |
| 16 | `hasleasing` | OUT | — | J3 |
| 17 | `leasingratefrom` | OUT | — | J3 |
| 18 | `leasingrateto` | OUT | — | J3 |
| 19 | `lsdufrom` | OUT | — | J3 |
| 20 | `lsduto` | OUT | — | J3 |
| 21 | `lsyeinmifrom` | OUT | — | J3 |
| 22 | `lstrinbo` | OUT | — | J3 |
| 23 | `lsenbo` | OUT | — | J3 |
| 24 | `lsavno` | OUT | — | J3 |
| 25 | `lstagr` | OUT | — | J3 |
| 26 | `efeg` | OUT | — | J3 |
| 27 | `tradeIn` | OUT | — | J3 |
| 28 | `kmfrom` | IN | `kmfrom` | J9 |
| 29 | `kmto` | IN | `kmto` | J9 |
| 30 | `fregfrom` | IN | `fregfrom` (libellé UI : « Année de ») | J9 |
| 31 | `fregto` | IN | `fregto` | J9 |
| 32 | `modelyearfrom` | OUT | — | J8 |
| 33 | `modelyearto` | OUT | — | J8 |
| 34 | `fuel` | IN | `fuel` | J9 |
| 35 | `powertype` | IN | `powertype` | J10 |
| 36 | `powerfrom` | IN | `powerfrom` | J10 |
| 37 | `powerto` | IN | `powerto` | J10 |
| 38 | `ccmfrom` | OUT | — | J1 |
| 39 | `ccmto` | OUT | — | J1 |
| 40 | `cylinders` | OUT | — | J1 |
| 41 | `dtrain` | OUT | — | J1 |
| 42 | `gear` | IN | `gear` | J9 |
| 43 | `newdriver` | OUT | — | J2 |
| 44 | `body` | IN | `body` | J9 |
| 45 | `doorfrom` | OUT | — | J1 |
| 46 | `doorto` | OUT | — | J1 |
| 47 | `seatsfrom` | OUT | — | J1 |
| 48 | `seatsto` | OUT | — | J1 |
| 49 | `bcol` | OUT | — | J2 |
| 50 | `ptype` | OUT | — | J2 |
| 51 | `icol` | OUT | — | J2 |
| 52 | `uph` | OUT | — | J2 |
| 53 | `emclass` | OUT (v1) | — | J1 |
| 54 | `ensticker` | OUT (v1) | — | J1 |
| 55 | `bot` | OUT (v1) | — | J1 |
| 56 | `erfrom` | OUT (v1) | — | J1 |
| 57 | `erto` | OUT (v1) | — | J1 |
| 58 | `eq` | IN | `eq` — **réserve Z1, voir EX-SRCH-12** | J10 |
| 59 | `ustate` | IN | `ustate` | J9 |
| 60 | `damaged_listing` | OUT | — | J6 |
| 61 | `prevownersid` | IN | `prevownersid` | J10 |
| 62 | `sealor` | OUT | — | J2 |
| 63 | `custtype` | IN | `custtype` | J9 (H3) |
| 64 | `cid` | **OUT — interdit** | — | J5 |
| 65 | `cy` | IN | `cy` | J9 (H1) |
| 66 | `zip` | IN | `zip` | J9 |
| 67 | `zipr` | IN | `zipr` (dépend de `zip`) | J9 |
| 68 | `lat` | OUT | — | J4 |
| 69 | `lon` | OUT | — | J4 |
| 70 | `region` | OUT | — | J6 (Z3 ; troncature régionale calculée par KYCAR lui-même à partir de `zip`, hors mécanisme de filtre) |
| 71 | `crossborder` | OUT | — | J1 |
| 72 | `ot_osc` | OUT | — | J1 |
| 73 | `ocs_listing` | OUT | — | J1 |
| 74 | `dlv_max` | OUT | — | J6 |
| 75 | `dlv_tail` | OUT | — | J1 |
| 76 | `adage` | OUT | — | J4 (non pertinent pour un snapshot périodique, H4) |
| 77 | `sort` | **CONDITIONNEL** | `sort` si une sous-vue liste d'annonces existe (dépend de `draft-screens.md`) | — |
| 78 | `desc` | CONDITIONNEL, idem | `desc` | — |
| 79 | `page` | CONDITIONNEL, idem | `page` | — |
| 80 | `size` | CONDITIONNEL, idem | `size` | — |
| 81-96 | (16 filtres propres à `atype≠C` : `bedsfrom`…`grossweightto`) | OUT | — | J7 |
| 97 | `show_nfm` | OUT | — | J4 |
| 98 | `search_id` | OUT | — | J4 |
| 99 | `query_id` | OUT | — | J4 |
| 100 | `tier_rotation` | OUT | — | J4 |
| 101 | `mmm` (legacy) | OUT | — | J8 |

**Bilan** : 22 filtres retenus fermement (IN), 4 conditionnels (`sort`/`desc`/`page`/`size`, arbitrés
par l'existence d'une sous-vue liste), 75 exclus et justifiés. Aucun filtre du catalogue n'est laissé
sans statut, conformément au critère S4 de la phase 2.1.

**Point ouvert transmis à `req-lead`** : les filtres 77-80 (tri/pagination) supposent qu'il existe,
sous l'écran de distribution, une sous-vue listant des annonces individuelles (par exemple pour
inspecter les outliers un par un). Cette sous-vue relève de `draft-screens.md`. Si elle n'existe pas,
77-80 basculent en OUT (J1) et ce document doit être corrigé en conséquence lors de l'assemblage.

#### A.2.3 Sérialisation multi-valeurs

**EX-NAV-6** — Toute valeur multiple (`fuel`, `body`, `gear`, `eq`, `cy`, `make`, …) est sérialisée en
**une seule occurrence du paramètre, valeurs jointes par une virgule** (`fuel=B,D`), à l'identique de
la règle relevée sur AutoScout24 (`REF-filters.md`, table de sérialisation, module `56702`). Aucun
paramètre répété, aucun séparateur `|` ou `;`. Raison : une seule implémentation de sérialisation
(`URLSearchParams` + `join(',')`) pour tout le bandeau, sans cas particulier.

#### A.2.4 Sérialisation des intervalles

**EX-NAV-7** — Tout intervalle est sérialisé en **deux paramètres jumeaux** `<nom>from` / `<nom>to`
(ex. `pricefrom`/`priceto`), reprenant la convention AS24. Une borne non posée par l'utilisateur n'est
**pas émise** (pas de valeur vide, pas de `-Infinity`) : `pricefrom=5000` seul signifie « prix ≥ 5000,
sans plafond ».

#### A.2.5 Valeurs vides et valeurs par défaut

**EX-NAV-8** — Un filtre à sa valeur par défaut n'est **jamais** émis dans l'URL (même règle
qu'AS24). Un filtre explicitement vidé par l'utilisateur voit son paramètre **retiré** de l'URL, il
n'est jamais réécrit avec une chaîne vide (`pricefrom=`) : une chaîne vide est une valeur invalide
distincte de « non posé », ce qui évite l'ambiguïté relevée sur `region` (Z3, où `region=` est
rejeté par le serveur AS24 lui-même).

#### A.2.6 Ordre canonique des paramètres

**EX-NAV-9** — Les paramètres de requête sont sérialisés dans un **ordre fixe et alphabétique par
nom de paramètre**, indépendamment de l'ordre dans lequel l'utilisateur les a renseignés. Deux états
de filtres identiques produisent donc systématiquement la **même chaîne de caractères** d'URL.
Raison : nécessaire pour (a) la déduplication des recherches sauvegardées (§C.1), qui compare des
URLs telles quelles, (b) la stabilité des tests automatisés qui comparent des URLs attendues, (c)
éviter qu'une même intention de recherche produise deux liens visuellement différents selon l'ordre
d'interaction de l'utilisateur.

#### A.2.7 Longueur maximale d'URL et dépassement

**EX-NAV-10** — Longueur maximale tolérée de l'URL complète (origine + chemin + requête) : **2000
caractères**, plafond usuel de compatibilité navigateurs/proxys/serveurs. Le filtre le plus
consommateur d'espace est `eq` (136 valeurs possibles, codes numériques joints par virgule :
jusqu'à environ 540 caractères pour une sélection large).

**EX-NAV-11** — Comportement au-delà du plafond : lorsqu'une modification de filtre ferait dépasser
2000 caractères, la modification est **refusée** (le filtre concerné n'est pas ajouté à l'état), et
un message inline signale « limite d'URL atteinte, retirez un filtre pour en ajouter un autre ». Le
filtre `eq`, seul filtre à cardinalité assez grande pour déclencher ce cas en pratique, est le
premier candidat à cette limite — aucune troncature silencieuse n'est appliquée : l'utilisateur voit
toujours l'état réellement actif.

### A.3 Comportement de l'historique navigateur

L'enjeu : si chaque frappe ou chaque case cochée crée une entrée d'historique, le retour arrière
devient inutilisable (des dizaines d'entrées pour un seul geste de raffinement). Si aucune entrée
n'est créée, le retour arrière du navigateur ramène l'utilisateur hors de l'application (ou à un état
de filtres bien antérieur) au lieu d'annuler le dernier changement.

**EX-NAV-12 — Décision retenue : un changement de filtre effectivement appliqué (post-debounce, voir
§B.1) produit exactement une entrée d'historique (`pushState`), jamais plus.** Les valeurs
intermédiaires d'un champ en cours de frappe ou d'un curseur en cours de glissement ne touchent
jamais l'URL (elles restent dans l'état local du contrôle) : elles ne peuvent donc pas générer
d'entrées à supprimer.

**EX-NAV-13 — Regroupement des changements rapprochés.** Si l'utilisateur modifie plusieurs filtres
dans une fenêtre d'inactivité de moins de **800 ms** entre deux changements (ex. cocher 4 cases
d'équipement à la suite), ces changements sont regroupés en **une seule** entrée d'historique
(`replaceState` pour chaque changement intermédiaire de la rafale, `pushState` uniquement au
changement qui clôt la fenêtre d'inactivité). Ce seuil de 800 ms réutilise le mécanisme de debounce
déjà nécessaire pour le recalcul (§B.1) : une seule minuterie sert les deux besoins.

**EX-NAV-14 — Cas toujours en `pushState`, indépendamment du regroupement** :
- changement de route (navigation mode 1 ↔ mode 2, ou vers un autre couple marque/modèle) ;
- réinitialisation globale ou par groupe (§B.4) ;
- pagination, si la sous-vue liste existe (filtre 79 conditionnel).

Raison : ce sont des actions que l'utilisateur perçoit comme des « étapes » distinctes de son
exploration, qu'il s'attend explicitement à pouvoir annuler une par une avec le bouton précédent.

### A.4 Navigation entre les deux écrans

**EX-NAV-15** — Passage du mode 1 au mode 2 (clic sur une zone-modèle d'une carte-marque) :
- les filtres partagés entre les deux modes (tous les filtres IN de §A.2.2 hors `make`, car le mode 2
  n'a plus besoin d'un filtre marque puisque la marque est dans le chemin) sont **conservés tels
  quels** dans la nouvelle URL ;
- `make` est retiré de l'URL (il n'a plus de sens : la marque est désormais fixée par le chemin) ;
- `makeId`/`modelId` du couple cliqué deviennent les segments de chemin.

**EX-NAV-16** — Retour du mode 2 au mode 1 (bouton « retour au marché », pas le bouton précédent du
navigateur) : les filtres partagés sont conservés, `make` est réinjecté avec pour seule valeur la
marque du modèle quitté (l'utilisateur revient sur *ce* marché, pas sur un marché vide). Le bouton
précédent du navigateur, lui, restaure l'état exact précédemment empilé (§A.3), qui peut différer.

**EX-NAV-17** — Changement de modèle à l'intérieur du mode 2 (ex. via `/suivis`, un lien interne, ou
la modification du couple marque/modèle) : tous les filtres partagés sont conservés à l'identique ;
seuls `makeId`/`modelId` changent. C'est la même logique que EX-NAV-15.

### A.5 Deep-linking

**EX-NAV-18** — Toute URL de la forme `/modele/:makeId/:modelId?<filtres>` doit être ouvrable
directement (nouvel onglet, lien partagé, favori) et reproduire **exactement** l'état de distribution
qu'elle décrit, sans dépendre d'une navigation préalable ni d'un état en mémoire. Ceci est le
mécanisme central de partageabilité exigé par le plan (« un état de filtres doit être partageable par
copie du lien et restaurable à l'identique ») : le rendu de l'écran est une fonction pure de l'URL, il
n'existe aucun état de filtre qui ne soit pas représentable dans l'URL.

### A.6 États invalides

| ID | Situation | Comportement retenu | Justification |
|---|---|---|---|
| EX-NAV-19 | `makeId` absent de `taxonomy.json` | Écran d'erreur dédié « marque inconnue », avec un lien vers `/` conservant les autres filtres actifs | Un lien mal formé ou une taxonomie qui a évolué entre deux snapshots ne doit pas produire un écran vide silencieux |
| EX-NAV-20 | `modelId` n'appartenant pas à `makeId` | Même écran d'erreur, message « ce modèle n'existe pas pour cette marque » | Idem — distinct du cas précédent pour que le message soit actionnable |
| EX-NAV-21 | Valeur de filtre hors domaine (code énuméré inconnu, ex. `fuel=Z`) | La valeur inconnue est **retirée silencieusement** de l'état de filtre au chargement, l'URL est corrigée par `replaceState` (jamais `pushState`), le reste de la requête s'applique normalement | Divergence assumée par rapport au comportement AS24 (qui répond 404, `REF-filters.md` §Règles transverses) : KYCAR est un outil de liens partagés, potentiellement recopiés après une évolution du référentiel ; un échec dur casserait un lien par ailleurs valide. La correction silencieuse d'URL garantit qu'une recopie ultérieure du lien soit déjà propre |
| EX-NAV-22 | Intervalle inversé (`pricefrom > priceto`, ou tout autre couple from/to) | Les deux bornes sont **échangées automatiquement** au chargement, une notice inline transitoire indique « valeurs de l'intervalle interverties » ; l'URL est corrigée par `replaceState` | Cohérent avec EX-NAV-21 : correction permissive plutôt que blocage, car l'intention de l'utilisateur (un intervalle, quel que soit son sens de saisie) est reconstructible sans ambiguïté |

---

## B. Recherche et filtrage

### B.1 Application des filtres par type de contrôle

| ID | Type de contrôle | Filtres concernés | Application | Debounce |
|---|---|---|---|---|
| EX-SRCH-1 | Case à cocher / bouton radio (valeur unique ou multiple, faible cardinalité) | `offer`, `fuel`, `gear`, `body`, `dtrain`(hors périmètre), `custtype`, `ustate`, `prevownersid`, `powertype` | Immédiate au changement | 0 ms |
| EX-SRCH-2 | Liste à cocher à forte cardinalité | `eq` (136 valeurs) | Différée, pour absorber la sélection de plusieurs cases à la suite | 250 ms après la dernière case cochée |
| EX-SRCH-3 | Curseur / intervalle à paliers (glissière) | bornes `pricefrom/to`, `kmfrom/to` lorsqu'un palier est cliqué | Au relâchement du curseur (`pointerup`), pas pendant le glissement | 150 ms après relâchement (absorbe un micro-ajustement tactile) |
| EX-SRCH-4 | Champ numérique en saisie libre | `pricefrom/to`, `kmfrom/to`, `powerfrom/to`, `fregfrom/to` en saisie manuelle | Différée après la dernière frappe | 500 ms |
| EX-SRCH-5 | Champ texte libre | `kwd` | Différée après la dernière frappe | 400 ms |
| EX-SRCH-6 | Champ code postal | `zip` | Différée, déclenche la résolution géographique une fois un format plausible atteint (4 chiffres BE) | 500 ms, et non déclenché avant 4 caractères saisis |
| EX-SRCH-7 | Sélecteur dépendant activé seulement après son parent | `zipr` (dépend de `zip`) | Immédiate au changement, contrôle désactivé tant que `zip` n'est pas valide | 0 ms |
| EX-SRCH-8 | Sélection marque (mode 1) / clic zone-modèle (navigation mode 2) | `make`, changement de route | Immédiate | 0 ms |
| EX-SRCH-9 | Bouton de réinitialisation (§B.4) | tout groupe ou la totalité | Immédiate | 0 ms |

Aucun contrôle du bandeau n'exige de validation explicite (pas de bouton « Rechercher ») : la
recherche se recalcule automatiquement dès qu'un filtre change, selon les délais ci-dessus. Ce choix
découle directement de la nature analytique de l'outil (l'utilisateur explore par petites touches
successives, cf. 00-CONTEXT.md « filtres applicables à la volée qui recalculent toute la page ») —
un bouton de validation ajouterait une étape sans bénéfice pour ce mode d'usage.

### B.2 Combinaison logique

**EX-SRCH-10 — Entre filtres différents : ET.** Deux filtres actifs simultanément (ex. `fuel=D` et
`body=4`) restreignent conjointement le résultat. Ceci n'est pas ambigu : c'est la seule lecture
cohérente avec la nature de contraintes de marché indépendantes (00-CONTEXT.md : « budget X,
carrosserie Y, pays Z » sont des contraintes cumulatives par construction).

**EX-SRCH-11 — À l'intérieur d'un filtre multi-valeurs « attribut unique du véhicule » : OU.** Pour
`fuel`, `body`, `gear`, `offer`, `cy`, `make`, `prevownersid` : une valeur de véhicule ne peut porter
qu'un seul code de cet attribut à la fois (une voiture a un seul carburant), donc `fuel=B,D` signifie
nécessairement « essence OU diesel ». Repris tel quel de `REF-filters.md` (§Z1, qui l'établit sans
réserve pour cette classe de filtres).

**EX-SRCH-12 — Cas `eq` (équipements) : exigence conditionnelle non tranchée, à ne pas confondre avec
EX-SRCH-11.** `REF-filters.md` (zone d'ombre Z1) établit explicitement que la sémantique OU/ET de
`eq` n'est **pas prouvée** côté AutoScout24, et recommande un test discriminant (comparer le nombre
de résultats pour `eq=5`, `eq=23`, `eq=5,23`) qui n'a pas été mené. Ce document ne tranche donc pas
silencieusement :

- **Lecture A (OU — élargissement)** : `eq=5,23` signifie « climatisation OU jantes alliage ».
  Cohérent avec le traitement uniforme des autres filtres multi-valeurs (EX-SRCH-11).
- **Lecture B (ET — cumul, présumé par le produit AS24)** : `eq=5,23` signifie « climatisation ET
  jantes alliage ». Cohérent avec l'intuition utilisateur (cocher plusieurs équipements pour
  restreindre) et avec la remarque produit de `REF-filters.md`.

**Décision d'implémentation par défaut, explicitement provisoire** : KYCAR filtre son **propre**
jeu de données ingéré (il ne relaie pas de requête live vers AutoScout24, cf. R2/`DataProvider`) — il
n'est donc pas structurellement contraint de reproduire le comportement serveur d'AS24. Faute de
preuve, ce document retient la **Lecture B (ET)** comme comportement par défaut du moteur
d'agrégation KYCAR, au motif que c'est la lecture qui correspond à l'usage déclaré (cumuler des
exigences d'équipement pour restreindre une recherche). **Ce choix doit être revu explicitement en
phase 2.2 (stress-test, agent `st-ambiguity`)** avant le gel v1.0 ; il ne doit pas être considéré
comme acquis avant cette revue.

**EX-SRCH-13** — Même réserve, de moindre ampleur, pour `sealor` (hors périmètre KYCAR de toute
façon, §A.2.2) et `pe_category` (hors périmètre v1).

### B.3 Dépendances entre filtres

| ID | Filtre parent | Filtre enfant | Comportement au changement du parent |
|---|---|---|---|
| EX-SRCH-14 | Marque (`make` en mode 1, ou route en mode 2) | Modèle (route mode 2 uniquement) | Changer de marque en mode 2 (via un sélecteur, hors clic sur zone-modèle) **vide** le modèle : il n'existe aucune garantie qu'un `modelId` reste valide pour une nouvelle marque. L'utilisateur revient à un état « marque choisie, modèle à choisir », concrètement une redirection vers `/` avec `make` posé à la nouvelle marque. |
| EX-SRCH-15 | `zip` | `zipr` | Si `zip` est **vidé**, `zipr` est vidé aussi (un rayon sans centre n'a pas de sens). Si `zip` change vers un **autre code postal valide**, `zipr` est **conservé** : le rayon est un réglage indépendant de la valeur précise du centre. |
| EX-SRCH-16 | `powertype` | `powerfrom`/`powerto` | Changer d'unité (kW ↔ ch) **convertit** les bornes déjà saisies (facteur 1 kW ≈ 1,359 ch) plutôt que de les vider — l'intention de l'utilisateur (une plage de puissance) est indépendante de l'unité d'affichage. |
| EX-SRCH-17 | `fuel` | `bot`, `erfrom`, `erto` | Hors périmètre v1 (§A.2.2) : aucun comportement à spécifier. Mentionné pour mémoire si ces filtres sont réintroduits en v2. |

### B.4 Réinitialisation

**EX-SRCH-18 — Réinitialisation globale.** Un bouton unique ramène tous les filtres IN à leur absence
(URL sans aucun des paramètres de §A.2.2), **sans changer de route** : en mode 2, l'utilisateur reste
sur le même modèle avec un bandeau vide, il n'est pas renvoyé en mode 1. Produit une entrée
d'historique (EX-NAV-14).

**EX-SRCH-19 — Réinitialisation par groupe.** Chaque groupe visuel du bandeau (ex. « Prix », «
Kilométrage et année », « Motorisation », « Équipements » — le découpage exact relève de
`draft-screens.md`) porte son propre bouton de réinitialisation, qui ne vide que les paramètres de
ce groupe.

**EX-SRCH-20 — Ce qui survit à tout reset.** La route (mode et couple marque/modèle en mode 2) n'est
jamais affectée par une réinitialisation, qu'elle soit globale ou par groupe : réinitialiser les
filtres n'est jamais interprété comme une intention de quitter l'écran courant.

### B.5 Effectif de résultats

**EX-SRCH-21** — Le compteur de résultats affiché est **toujours l'effectif réellement appliqué**,
recalculé au même moment que le contenu de l'écran (cartes-marques ou histogrammes) — il n'existe pas
de mode « aperçu avant application » distinct, puisque tous les filtres s'appliquent automatiquement
(§B.1). Le compteur et le contenu partagent donc un seul cycle de recalcul, déclenché par le même
debounce.

**EX-SRCH-22** — Pendant la fenêtre de debounce et le temps de recalcul, le compteur affiche un état
« en cours » (ex. valeur estompée) plutôt qu'un ancien chiffre présenté comme à jour, pour éviter
qu'un utilisateur lise un nombre déjà obsolète comme le résultat du filtre qu'il vient de poser.

### B.6 Tri et pagination

**EX-SRCH-23 — Conditionnel, dépend de `draft-screens.md` (voir aussi §A.2.2, filtres 77-80).** Si
une sous-vue « liste d'annonces individuelles » existe sous l'écran de distribution (utile pour
inspecter un outlier ligne par ligne) : elle reprend `sort`/`desc` d'AutoScout24 tels quels, une
pagination **côté client** (les données étant déjà chargées en mémoire pour l'agrégation, cf. §D.1)
avec une taille de page fixe de **50 lignes**, sans paramètre `size` réglable par l'utilisateur (`size`
reste donc hors périmètre même si `sort`/`desc`/`page` sont retenus). Si cette sous-vue n'existe pas,
aucun tri ni pagination n'est nécessaire : les écrans agrégés (cartes, histogrammes, nuage) n'ont pas
de notion de page.

**EX-SRCH-24** — En l'absence de sous-vue liste, le tri des **cartes-marques** du mode 1 (ordre
d'affichage des marques) est un besoin distinct, non couvert par le paramètre `sort` d'AutoScout24
(qui trie des annonces, pas des marques). Ce tri relève de `draft-screens.md` (contenu et disposition
de l'écran), pas de ce document.

### B.7 Sélection trop large

**EX-SRCH-25 — Décision : aucun filtre minimum obligatoire.** Le mode 1 sans aucun filtre est un
état de départ légitime, explicitement décrit par 00-CONTEXT.md comme la définition même du mode 1
(« aucune marque/modèle saisi »). Imposer un filtre minimum contredirait le cas d'usage
d'exploration libre du marché.

**EX-SRCH-26 — Seuil d'avertissement, sans blocage.** Si le mode 1 sans filtre (ou avec des filtres
très larges) renvoie plus de **60 marques** avec au moins un résultat, un bandeau non bloquant
s'affiche : « Xxx marques correspondent — affinez pour une vue plus lisible », avec un raccourci
vers les filtres les plus discriminants (prix, carrosserie). Le nombre 60 est choisi comme un ordre
de grandeur au-delà duquel une grille de cartes-marques cesse d'être parcourable en un seul écran
sans défilement long, sans empêcher l'utilisateur de continuer.

**EX-SRCH-27 — Aucun plafond de traitement côté moteur.** Le moteur d'agrégation doit rester capable
de traiter la borne haute de H5 (10⁶ annonces) sans filtre posé ; la limite de §EX-SRCH-26 est une
limite d'**affichage/lisibilité**, jamais une limite de **calcul** silencieusement tronquée (aucun
résultat n'est retiré de l'agrégat pour rester sous un plafond caché).

---

## C. CRUD

Le commanditaire n'a spécifié aucun CRUD ; les six candidats de la mission sont évalués un par un
contre les deux parcours cibles. Principe d'économie (« outil d'analyse, pas une usine ») : une
entité retenue doit réduire une friction réelle de l'un des deux parcours ; à défaut, elle est
écartée même si elle serait facile à construire.

| Candidat | Décision | Motif en un mot |
|---|---|---|
| Recherches sauvegardées | **Retenu** | partage/réutilisation d'un état de marché |
| Modèles suivis | **Retenu** | navigation rapide entre analyses répétées |
| Historique des recherches récentes | **Retenu** | filet de sécurité, coût quasi nul |
| Export des données affichées | **Retenu** (agrégats uniquement) | positionnement explicite « outil d'analyse » |
| Annotations (annonce ou modèle) | **Écarté** | l'app n'est pas un CRM (00-CONTEXT.md) ; s'accroche à des identifiants d'annonces éphémères (H4) |
| Comparaison de plusieurs modèles | **Écarté** | 3ᵉ mode non demandé ; partiellement couvert par les modèles suivis |

### C.1 Recherches sauvegardées

Un état de filtres nommé, capturé sous forme d'URL relative (chemin + requête, §A.2), aucune donnée
d'annonce n'est dupliquée.

| ID | Règle |
|---|---|
| EX-CRUD-1 | Champs : `id` (généré), `nom` (texte, 1-60 caractères, obligatoire), `url` (chemin + requête au moment de l'enregistrement), `mode` (1 ou 2, dérivé de `url`), `créée_le`, `dernier_accès_le`. |
| EX-CRUD-2 | Validation : `nom` non vide après suppression des espaces ; aucune contrainte d'unicité (les doublons sont autorisés, un avertissement non bloquant s'affiche si un `nom` identique existe déjà). |
| EX-CRUD-3 | Persistance : **locale uniquement** (`localStorage`/IndexedDB du navigateur) ; aucune synchronisation serveur, cohérent avec H2 (usage personnel) et l'absence de compte utilisateur. |
| EX-CRUD-4 | Cycle de vie : création explicite (action « Enregistrer cette recherche », disponible sur les deux écrans) ; renommage possible ; **pas de modification du contenu de l'URL enregistrée** — pour changer les filtres d'une recherche sauvegardée, l'utilisateur en crée une nouvelle et supprime l'ancienne (évite une UI d'édition dédiée pour un gain marginal) ; suppression immédiate, sans corbeille, avec confirmation inline (pas de modale bloquante). |
| EX-CRUD-5 | Limite : **50 recherches sauvegardées** maximum. Au-delà, la création est bloquée avec un message invitant à supprimer une entrée existante. |
| EX-CRUD-6 | Ouvrir une recherche sauvegardée navigue vers son `url` telle quelle (garantie par EX-NAV-18 : l'URL suffit à reconstituer l'état) et met à jour `dernier_accès_le`. |

### C.2 Modèles suivis

Une liste de raccourcis vers des couples marque/modèle du mode 2, sans filtres associés (le suivi
porte sur le modèle, pas sur une recherche particulière).

| ID | Règle |
|---|---|
| EX-CRUD-7 | Champs : `makeId`, `modelId`, `ajouté_le`. Pas de filtres stockés (rouvre `/modele/:makeId/:modelId` sans paramètres). |
| EX-CRUD-8 | Persistance locale uniquement, mêmes raisons que EX-CRUD-3. |
| EX-CRUD-9 | Cycle de vie : bouton « suivre »/« ne plus suivre » directement sur l'écran de distribution (bascule, pas de formulaire) ; suppression également possible depuis `/suivis` (EX-NAV-4). |
| EX-CRUD-10 | Limite : **30 modèles suivis**. Au-delà, ajout bloqué avec message équivalent à EX-CRUD-5. Aucune notification ni veille automatique n'est fournie (H4 : snapshot périodique, pas de flux temps réel — un mécanisme d'alerte sur nouveauté exigerait une infrastructure hors périmètre). |

### C.3 Historique des recherches récentes

Distinct des recherches sauvegardées : automatique, non nommé, capé bas, sans action explicite de
création — sert le cas « revenir sur une exploration précédente qu'on n'a pas pensé à sauvegarder ».

| ID | Règle |
|---|---|
| EX-CRUD-11 | Chaque navigation vers `/` ou `/modele/:makeId/:modelId` avec un jeu de filtres différent du précédent enregistre une entrée (`url`, `visité_le`) en tête d'une liste FIFO. |
| EX-CRUD-12 | Limite stricte : **10 entrées**. Au-delà, la plus ancienne est supprimée silencieusement (pas d'action utilisateur requise, pas de confirmation). |
| EX-CRUD-13 | Seule action utilisateur possible sur cette entité : « vider l'historique » (suppression totale immédiate). Aucune création, modification ou suppression unitaire — l'historique n'est pas éditable, seulement consultable ou vidé en bloc. |

### C.4 Export des données affichées

Exporte les **agrégats actuellement visibles à l'écran**, jamais une annonce individuelle avec ses
champs bruts (ce qui, de toute façon, ne contiendrait aucun champ interdit par R3 : la donnée
identifiant le vendeur n'entre jamais dans le schéma KYCAR, cf. `FINDING-allowed-surface.md` §2.5).

| ID | Règle |
|---|---|
| EX-CRUD-14 | Format : CSV, encodage UTF-8 avec BOM (compatibilité Excel FR), séparateur point-virgule (convention belge/française d'Excel, où la virgule est le séparateur décimal). |
| EX-CRUD-15 | Périmètre mode 1 : une ligne par couple marque/modèle actuellement affiché (respecte les filtres actifs), colonnes = les agrégats affichés sur la carte (nombre d'offres, fourchette de prix, fourchette d'année, fourchette de kilométrage — la liste exacte des colonnes relève de `draft-data-dictionary.md`). |
| EX-CRUD-16 | Périmètre mode 2 : une ligne par bucket de l'histogramme actuellement affiché (prix, kilométrage ou année selon l'onglet actif), colonnes = borne basse, borne haute, effectif. Le nuage tri-dimensionnel n'est pas exporté sous forme d'image (voir EX-CRUD-17) mais ses points sous-jacents peuvent l'être sous forme de lignes (prix, année, kilométrage, indicateur outlier). |
| EX-CRUD-17 | **Hors périmètre v1, explicitement écarté** : export d'image (PNG/SVG) d'un graphique. Ajoute un pipeline de rendu hors-écran sans servir directement l'un des deux parcours cibles (l'utilisateur peut faire une capture d'écran manuelle) ; à reconsidérer si le besoin est confirmé après livraison. |

### C.5 Entités écartées — détail des motifs

- **Annotations sur une annonce ou un modèle** : écarté. Une annotation liée à un `id` d'annonce
  s'appuie sur un identifiant qui n'a de sens que pour la durée d'un snapshot (H4) — au snapshot
  suivant, l'annonce peut avoir disparu ou changé d'identifiant, orphelinant silencieusement la note.
  Une annotation liée à un modèle (pas une annonce) chevaucherait la fonction déjà remplie par les
  recherches sauvegardées et les modèles suivis, sans ajouter de valeur distincte. Surtout,
  00-CONTEXT.md exclut explicitement le positionnement CRM (« Ce n'est pas un CRM concessionnaire »).
- **Comparaison de plusieurs modèles côte à côte** : écarté pour la v1. Constituerait un troisième
  mode d'usage non demandé par le commanditaire (qui n'en décrit que deux) et non prévu par le plan
  (deux écrans obligatoires seulement, S6 de la phase 2.1). La liste des modèles suivis (§C.2) permet
  déjà une comparaison informelle par navigation successive à faible coût d'implémentation ; construire
  un écran de comparaison dédié (tableau ou graphes superposés) est une extension possible mais non
  retenue ici, conformément à la consigne d'économie.

---

## D. Exigences non fonctionnelles chiffrées

### D.1 Volumétrie

| ID | Exigence |
|---|---|
| EX-NFR-1 | Le moteur d'agrégation doit rester fonctionnel (dans les cibles de temps de réponse de §D.2) pour un snapshot allant jusqu'à **10⁶ annonces** (borne haute de H5), et un jeu de données de référence pour le développement fixé à **100 000 annonces** (ordre de grandeur médian de H5, cohérent avec le relevé empirique de `FINDING-allowed-surface.md` : ~5 220 annonces pour la seule marque Opel en Belgique, extrapolé à l'échelle de ~300 marques). |
| EX-NFR-2 | Le référentiel marque/modèle chargé en mémoire couvre au moins **60 marques** (S3 de la phase 2.0) et, à terme, l'ensemble des marques du référentiel officiel — cible de conception : **300 marques**, **4 500 couples marque/modèle** (moyenne de 15 modèles/marque). |
| EX-NFR-3 | Taille du jeu de données de référence embarqué pour le développement (100 000 annonces, champs KYCAR uniquement, sans champs vendeur R3) : cible **≤ 25 Mo** non compressé, **≤ 6 Mo** compressé (gzip), sur la base d'un enregistrement moyen d'environ 250 octets une fois les champs interdits retirés. |
| EX-NFR-4 | Le référentiel marque/modèle (`taxonomy.json`) reste sous **1 Mo** compressé — il est chargé au démarrage de l'application, avant toute recherche. |

### D.2 Temps de réponse

| ID | Opération | Cible | Percentile |
|---|---|---|---|
| EX-NFR-5 | Application d'un filtre (du recalcul déclenché à l'affichage mis à jour, hors delai de debounce lui-même) | ≤ 200 ms | p95 |
| EX-NFR-6 | Rendu d'un histogramme (prix, kilométrage ou année) jusqu'à 100 000 annonces en entrée | ≤ 300 ms | p95 |
| EX-NFR-7 | Rendu initial du nuage tri-dimensionnel (prix × année × kilométrage) jusqu'à 5 000 points (taille attendue d'une distribution par modèle) | ≤ 500 ms | p95 |
| EX-NFR-8 | Interaction (rotation, zoom) sur le nuage tri-dimensionnel une fois rendu | ≥ 30 images/seconde soutenues | p95 |
| EX-NFR-9 | Chargement initial de l'application (premier affichage utile de l'écran de mode 1) sur une connexion simulée 4G (≈ 4 Mb/s, latence 150 ms) | ≤ 2000 ms | p95 |

### D.3 Taille du bundle et budget de chargement

| ID | Exigence |
|---|---|
| EX-NFR-10 | Bundle JavaScript initial (nécessaire au premier affichage du mode 1) : **≤ 300 Ko** compressé (gzip/brotli). |
| EX-NFR-11 | Toute bibliothèque de rendu graphique lourde (nuage 3D notamment) est chargée en différé (code-splitting), hors du bundle initial, avec un budget propre de **≤ 400 Ko** compressé, chargée seulement à l'entrée en mode 2. |

### D.4 Accessibilité

| ID | Exigence |
|---|---|
| EX-NFR-12 | Niveau visé : **WCAG 2.1 niveau AA**. |
| EX-NFR-13 | Contraste : ratio **≥ 4,5:1** pour le texte normal, **≥ 3:1** pour le texte large (≥ 18 pt ou 14 pt gras) et les éléments graphiques porteurs d'information (contours de barres, marqueurs). |
| EX-NFR-14 | Navigation clavier : 100 % des contrôles du bandeau de filtres et des actions d'écran (y compris les boutons de réinitialisation et les cartes-marques) atteignables et actionnables au clavier seul, ordre de tabulation correspondant à l'ordre visuel, indicateur de focus visible en permanence (jamais supprimé par CSS). |
| EX-NFR-15 | Compensation pour les graphiques (un graphique n'est, par nature, pas accessible à un lecteur d'écran) : chaque histogramme est accompagné d'un **tableau de données équivalent** (borne basse, borne haute, effectif par bucket), disponible en alternative textuelle consultable au clavier ; le nuage tri-dimensionnel est accompagné d'un **tableau des points sous-jacents** (prix, année, kilométrage, indicateur outlier) et d'un **résumé textuel des outliers détectés** (nombre, et écart au médian pour chacun). Aucune tentative de rendre le nuage 3D lui-même navigable au clavier/lecteur d'écran : c'est la table équivalente qui satisfait le critère WCAG 1.1.1. |
| EX-NFR-16 | Vérification : un contrôle automatisé (type axe-core) exécuté sur les deux écrans ne doit produire **aucune violation de niveau A ou AA**. |

### D.5 Navigateurs et résolutions supportés

| ID | Exigence |
|---|---|
| EX-NFR-17 | Navigateurs supportés : deux dernières versions majeures de Chrome, Firefox, Edge et Safari. |
| EX-NFR-18 | Points de rupture responsive : **desktop ≥ 1280 px**, **tablette 768-1279 px**, **mobile < 768 px**. |
| EX-NFR-19 | Le nuage tri-dimensionnel interactif est proposé en dessous de 768 px sous une forme dégradée : projection 2D (prix × kilométrage, année encodée par couleur) plutôt que désactivé purement, car l'interaction 3D tactile sur petit écran est jugée peu praticable ; les histogrammes et cartes-marques restent pleinement fonctionnels à toutes les largeurs ≥ 320 px. |

### D.6 Comportement hors ligne et en cas d'échec du fournisseur de données

| ID | Exigence |
|---|---|
| EX-NFR-20 | Aucun support hors ligne complet (pas de PWA installable) n'est requis en v1 — non demandé, et l'hypothèse H4 (snapshot périodique) réduit la valeur d'un mode hors ligne complet par rapport à son coût. |
| EX-NFR-21 | En cas d'échec du fournisseur de données (`DataProvider` renvoie une erreur ou dépasse un délai de **5000 ms**) : **3 tentatives** automatiques avec un intervalle croissant de **1000 ms, 2000 ms, 4000 ms**. |
| EX-NFR-22 | Si les 3 tentatives échouent : repli sur le **dernier snapshot mis en cache localement** s'il existe, avec un bandeau visible et non masquable indiquant sa date (« Données du JJ/MM/AAAA — dernière tentative de mise à jour échouée ») ; si aucun cache n'existe, écran d'erreur explicite avec un bouton « réessayer ». |
| EX-NFR-23 | Aucune erreur du fournisseur de données n'est présentée comme un résultat vide légitime (« 0 marque correspondante ») : les deux états sont visuellement et textuellement distincts. |

### D.7 Confidentialité

| ID | Exigence |
|---|---|
| EX-NFR-24 | Données stockées côté client (localStorage/IndexedDB), exhaustif : recherches sauvegardées (§C.1), modèles suivis (§C.2), historique récent (§C.3), préférences d'interface (langue, thème si applicable). Aucune autre donnée personnelle n'est stockée côté client. |
| EX-NFR-25 | Aucune de ces données n'est transmise à un serveur : toutes les entités CRUD de la section C sont **locales au navigateur**, il n'existe pas d'API de synchronisation dans le périmètre de ce document. |
| EX-NFR-26 | Cohérence avec R3 : aucun champ identifiant un vendeur particulier (nom, téléphone, email, adresse exacte, URL de contact autre que le deeplink public de l'annonce) ne transite jamais jusqu'au navigateur — le filtrage a lieu à l'ingestion, dans l'adaptateur `DataProvider` (cf. `FINDING-allowed-surface.md` §2.5 : « L'adaptateur devra écarter ces champs à l'ingestion, pas au stockage »), pas seulement dans le rendu. Le deeplink conservé pointe vers l'annonce d'origine, jamais vers une fiche vendeur. |
| EX-NFR-27 | Rétention : recherches sauvegardées et modèles suivis sont conservés **sans expiration automatique**, jusqu'à suppression explicite par l'utilisateur ou effacement des données du site par le navigateur. L'historique récent (§C.3) est borné par comptage (10 entrées, FIFO), pas par durée. |

### D.8 Internationalisation

| ID | Exigence |
|---|---|
| EX-NFR-28 | Langue d'interface unique en v1 : **français (fr-BE)**. |
| EX-NFR-29 | Stratégie de surcharge pour la limite L6 (référentiel officiel partiellement non traduit — ex. `prevownersid` sans libellé EN pour certains codes dans `REF-filters.md`) : une table de surcharge FR **propre à KYCAR**, distincte du référentiel source, fournit un libellé français pour **chaque** code énuméré utilisé par un filtre retenu (§A.2.2). Ordre de préférence pour peupler cette table : (1) libellé fr-BE relevé si disponible, (2) traduction française du libellé en-GB relevé si le fr-BE est absent, (3) libellé forgé manuellement et marqué `[EXTRAPOLÉ]` (cohérent avec R6) si aucun des deux n'existe. |
| EX-NFR-30 | Exigence mesurable : **0 libellé non-français** (code brut, ou libellé anglais non traduit) affiché à l'utilisateur, vérifiable par un contrôle automatisé qui énumère tous les codes de domaine effectivement utilisés par les écrans et les compare à la table de surcharge FR — toute valeur absente de cette table fait échouer le contrôle. |

---

## Annexe — Décompte des exigences de cette section

| Préfixe | Nombre d'exigences |
|---|---|
| EX-NAV | 22 |
| EX-SRCH | 27 |
| EX-CRUD | 17 |
| EX-NFR | 30 |
| **Total** | **96** |
