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

**Table reprise et étendue par `ARB-41` (`T-06`)** : l'annexe C ne couvrait que quatre routes sur
six et aucun paramètre d'état d'interface. Table de remplacement, six lignes :

| ID | Route | Mode | Paramètres de chemin | Rôle |
|---|---|---|---|---|
| EX-NAV-1 | `/marche` | Mode 1 — exploration descendante | aucun | Écran de survol marque/modèle. |
| EX-NAV-2 | `/marche/:makeId-:makeSlug/:modelId-:modelSlug` | Mode 2 — analyse d'un modèle | `makeId`, `modelId` font foi ; les deux `slug` sont cosmétiques et déclenchent la redirection canonique d'`EX-SCR-140` s'ils ne correspondent pas | Écran de distribution (écran B) pour un couple marque/modèle précis. |
| EX-NAV-2bis | `/marche/:makeId-:makeSlug/:modelId-:modelSlug/annonces` | Mode 2 — sous-vue liste | idem | Écran D — liste des annonces individuelles du modèle (`A-02`). |
| EX-NAV-2ter | `/comparer` | — (comparaison) | aucun ; les modèles comparés sont dans `m` (`EX-NAV-10bis`) | Écran C — comparaison de modèles. |
| EX-NAV-3 | `/recherches` | — (gestion CRUD) | aucun | Liste des recherches sauvegardées (§C.1). N'affiche aucun résultat de marché ; pure gestion. |
| EX-NAV-4 | `/suivis` | — (gestion CRUD) | aucun | Écran F — liste des modèles suivis (§C.2), avec accès direct à la route de l'écran B pour chacun. |

Les anciennes routes `/` et `/modele/:makeId/:modelId` sont conservées en **lecture seule** et
redirigent par `replaceState` vers `/marche` et vers la route canonique de l'écran B, filtres
conservés.

**Décision — pourquoi le marque/modèle est un segment de chemin et non un paramètre de requête** :
`makeId`/`modelId` désignent l'**identité de la page** (quel marché est observé), pas un critère de
raffinement au sein d'une page. Les 97 autres filtres du bandeau, eux, raffinent le contenu de la
page courante sans en changer l'identité — ils restent en paramètres de requête. Ce découpage
reflète aussi la distinction du commanditaire entre les deux modes (00-CONTEXT.md : le mode 2 se
définit par le fait qu'un couple marque/modèle est *ciblé*, le mode 1 par son absence).

### A.2 Encodage de l'état de recherche dans l'URL

#### A.2.1 Principe de nommage — décision et justification

**EX-NAV-5** — Tout filtre retenu dans le périmètre KYCAR (§A.2.2, renvoi normatif à
`data/reference/filters-scope.json`) conserve **le nom de
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

#### A.2.2 Périmètre des filtres — renvoi normatif

La liste normative des filtres, leur périmètre et leur exposition sont portés par
`data/reference/filters-scope.json`, généré et vérifié par `scripts/build-filter-scope.mjs`
(`A-01`, `R-A01`). **Aucune table de portée n'est tenue en prose dans cette annexe.** Les exigences
`EX-NAV-*` d'encodage s'appliquent aux **77** filtres retenus.

> Historique : la version précédente de cette section tenait une table de portée en prose. Ce
> découpage était un rétrécissement de périmètre non autorisé (arbitrage `A-01`) et la table
> divergeait du fichier généré (constat `T-02` du stress-test) ; elle est donc supprimée et
> remplacée par ce renvoi, seule source qui ne peut plus diverger puisqu'elle est vérifiée par
> script à chaque génération.

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

Les **deux** bornes d'un intervalle sont **inclusives** : `<nom>from=a&<nom>to=b` sélectionne
`a ≤ x ≤ b`, `<nom>from=a` seul sélectionne `x ≥ a`, `<nom>to=b` seul sélectionne `x ≤ b`. Le
prédicat s'évalue sur le **champ canonique** du dictionnaire, dans son **unité canonique**
(`EX-DATA-4`, et `EX-SRCH-11bis` pour la conversion d'unité d'affichage). Pour un filtre d'année
(`fregfrom`/`fregto`, `modelyearfrom`/`modelyearto`), la comparaison porte sur l'**année
entière** (`firstRegistrationYear`, `modelYear`), **jamais** sur
`firstRegistrationYearMonth` : `fregto=2017` retient tous les millésimes 2017, janvier à
décembre. Une annonce dont le champ comparé est `INCONNU` **ne satisfait aucun** prédicat
d'intervalle et n'est jamais retenue par défaut. (`ARB-09`)

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

#### A.2.8 Paramètres d'état d'interface

**EX-NAV-10bis — table des paramètres d'état d'interface (`ARB-41`).** Distincts des paramètres de
filtre (§A.2.1 à §A.2.7), ces paramètres encodent un état d'interface (tri, dépliage, sélection de
brossage) et suivent néanmoins l'ordre canonique alphabétique d'`EX-NAV-9` et la règle « défaut non
émis » d'`EX-NAV-8` :

| Paramètre | Domaine | Défaut (non émis) | Entrée d'historique | Compte dans le plafond de 2 000 |
|---|---|---|---|---|
| `m` | liste de `<makeId>-<modelId>`, virgules, 1 à 4 entrées | absent | `pushState` | oui |
| `g<n>log` | `1` | absent | `replaceState` | oui |
| `grp` | liste des identifiants de groupes de filtres **dépliés**, virgules | absent (tous repliés sauf le primaire) | `replaceState` | oui |
| `mk` | liste de `makeId` de cartes dépliées, virgules | absent | `replaceState` | oui |
| `sort` | `offres` \| `median` \| `alpha` \| `modeles` | `offres` | `replaceState` | oui |
| `g4v` | `a` \| `b` | `a` | `replaceState` | oui |
| `selx` / `sely` | deux bornes numériques par axe, forme `<lo>-<hi>` | absent | `pushState` | oui |

Le paramètre de tri de l'écran A s'appelle `sort` et son domaine est celui de l'écran (ordre des
cartes-marques) : il n'a **aucun rapport** avec le paramètre `sort` d'AutoScout24, qui n'est exposé
que sur l'écran D (§B.6) — les deux ne coexistent jamais sur la même route.

La sélection de brossage du nuage de points (écran B) est encodée par les **bornes d'intervalle des
axes du graphe** (`selx`, `sely` ci-dessus), et **non** par une empreinte : une empreinte ne
restitue pas un sous-ensemble d'annonces. Une URL portant `selx`/`sely` restitue la même sélection de
brossage sur tout snapshot où les axes ont un sens. Le paramètre `sel` de l'écran D porte les mêmes
bornes, avec une sémantique de restriction d'affichage distincte (`draft-screens.md`).

### A.3 Comportement de l'historique navigateur

L'enjeu : si chaque frappe ou chaque case cochée crée une entrée d'historique, le retour arrière
devient inutilisable (des dizaines d'entrées pour un seul geste de raffinement). Si aucune entrée
n'est créée, le retour arrière du navigateur ramène l'utilisateur hors de l'application (ou à un état
de filtres bien antérieur) au lieu d'annuler le dernier changement.

**EX-NAV-12 — Décision retenue : une entrée d'historique est produite par changement de filtre
appliqué **et** par les paramètres marqués `pushState` dans `EX-NAV-10bis` ; les paramètres marqués
`replaceState` ne produisent jamais d'entrée d'historique (`ARB-41`).** Un changement de filtre
effectivement appliqué (post-debounce, voir §B.1) produit exactement une entrée d'historique
(`pushState`), jamais plus. Les valeurs intermédiaires d'un champ en cours de frappe ou d'un curseur
en cours de glissement ne touchent jamais l'URL (elles restent dans l'état local du contrôle) : elles
ne peuvent donc pas générer d'entrées à supprimer.

**EX-NAV-13 — Regroupement des changements rapprochés.** Si l'utilisateur modifie plusieurs filtres
dans une fenêtre d'inactivité de moins de **800 ms** entre deux changements (ex. cocher 4 cases
d'équipement à la suite), ces changements sont regroupés en **une seule** entrée d'historique
(`replaceState` pour chaque changement intermédiaire de la rafale, `pushState` uniquement au
changement qui clôt la fenêtre d'inactivité). Ce seuil de 800 ms réutilise le mécanisme de debounce
déjà nécessaire pour le recalcul (§B.1) : une seule minuterie sert les deux besoins.

**EX-NAV-14 — Cas toujours en `pushState`, indépendamment du regroupement** :
- changement de route (navigation mode 1 ↔ mode 2, ou vers un autre couple marque/modèle) ;
- réinitialisation globale ou par groupe (§B.4) ;
- pagination de la sous-vue liste d'annonces (`EX-NAV-2bis`, `EX-SRCH-23` — la sous-vue existe
  toujours depuis `A-02`, ce n'est plus conditionnel).

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

**EX-NAV-18** — Toute URL de la forme `/marche/:makeId-:makeSlug/:modelId-:modelSlug?<filtres>` doit
être ouvrable directement (nouvel onglet, lien partagé, favori) et reproduire **exactement** l'état
de distribution qu'elle décrit, sans dépendre d'une navigation préalable ni d'un état en mémoire.
Ceci est le mécanisme central de partageabilité exigé par le plan (« un état de filtres doit être
partageable par copie du lien et restaurable à l'identique ») : le rendu de l'écran est une fonction
pure de l'URL, il n'existe aucun état de filtre qui ne soit pas représentable dans l'URL.

Cette pureté est bornée par `EX-NAV-10` : tout état de filtre **dont la sérialisation canonique
tient sous 2 000 caractères** est représentable dans l'URL, et l'application refuse de construire
un état qui n'y tient pas (`EX-NAV-11`). « Tous les filtres sont encodables » (`A-01`) signifie que
**chacun** est encodable, non que **tous** le sont simultanément à leurs valeurs les plus larges.
Mesure de référence : les 77 filtres retenus posés chacun à une valeur non défaut plausible occupent
≈ 1 720 caractères, `eq` large compris ; la marge est donc réelle mais non infinie, et le cas de
dépassement est atteignable en élargissant deux ou trois filtres multi-valeurs. Un test du lot D4
construit l'état de filtres le plus large possible et vérifie que le refus d'`EX-NAV-11` se produit
**avec son message**, sans troncature ni perte silencieuse. (`ARB-56`)

**Limite connue du modèle de partage par URL pure.** Une valeur numérique tronquée en cours de
valeur par un transport externe (client de messagerie, éditeur de texte) reste syntaxiquement
valide et dans le domaine du filtre : elle n'est donc corrigée par aucune ligne de la table
d'`EX-NAV-21` et ne déclenche aucun signalement. L'application n'a aucun moyen de la détecter et
**n'en invente aucun** : aucune somme de contrôle, aucune signature, aucun paramètre de longueur
n'est ajouté à l'URL, car ils allongeraient le lien — cause première du problème — et casseraient
tout lien écrit à la main. La contre-mesure est l'**affichage systématique de la valeur** de chaque
filtre actif dans son jeton (`EX-SCR-75`, re-ciblée depuis `EX-SCR-176` — sans rapport avec les
jetons — par `R-A10`), de sorte que l'utilisateur lise `Prix : à partir de 50 €` et non `Prix`.
(`ARB-12`)

### A.6 États invalides

| ID | Situation | Comportement retenu | Justification |
|---|---|---|---|
| EX-NAV-19 | `makeId` absent de `taxonomy.json` | Écran d'erreur dédié « marque inconnue », avec un lien vers `/marche` conservant les autres filtres actifs | Un lien mal formé ou une taxonomie qui a évolué entre deux snapshots ne doit pas produire un écran vide silencieux |
| EX-NAV-20 | `modelId` n'appartenant pas à `makeId` | Même écran d'erreur, message « ce modèle n'existe pas pour cette marque » | Idem — distinct du cas précédent pour que le message soit actionnable |

**Exception unique à `EX-NAV-20`** : `modelId = 0` est la clé réservée « Modèle non identifié »
(`EX-DATA-72`) et **n'est jamais traitée comme un modèle inconnu**. La route
`/marche/:makeId-:makeSlug/0-modele-non-identifie` est valide et sert l'écran B en **mode
restreint** (`draft-screens.md`, `EX-SCR-113bis`). Toute autre valeur de `modelId` n'appartenant pas
à `makeId` produit l'écran d'erreur. (`ARB-59`)

**EX-NAV-21 — Valeur de filtre hors domaine au chargement d'une URL : une table unique de cinq
classes de correction (`ARB-11`).**

| Classe de défaut à la lecture d'une URL | Correction appliquée | Signalement |
|---|---|---|
| Code énuméré absent du vocabulaire (`fuel=Z`) | la valeur est **retirée** ; les autres valeurs du même filtre sont conservées ; si le filtre devient vide, il est retiré | `ET-URL-CORRIGEE` |
| Borne numérique hors du domaine relevé | **écrêtée** à la borne du domaine (`REF-filters.md`) | `ET-URL-CORRIGEE` |
| Borne numérique non numérique ou vide (`pricefrom=`, `pricefrom=abc`) | le paramètre est **retiré** | `ET-URL-CORRIGEE` |
| Intervalle inversé | bornes **permutées** (`EX-NAV-22`) | `ET-URL-CORRIGEE` |
| Paramètre inconnu de `filters-scope.json` | **ignoré** et retiré de l'URL canonique | `ET-URL-CORRIGEE` |

Dans tous les cas, l'URL est réécrite par `replaceState`, jamais `pushState`, et le reste de la
requête s'applique normalement. **Le mot « silencieusement » est supprimé** : aucune correction
d'URL n'est silencieuse — le bandeau non bloquant `ET-URL-CORRIGEE` (`draft-screens.md`,
`EX-SCR-38bis`) nomme le paramètre corrigé et la valeur retenue, au format
`Paramètre « <nom> » corrigé : <nature de la correction>, valeur retenue <valeur>`.

**EX-NAV-22 — Intervalle inversé reçu dans une URL au chargement, refus en saisie interactive
(`ARB-10`).** Intervalle inversé reçu **dans une URL au chargement** (`pricefrom > priceto`, ou
tout autre couple `from`/`to`) : les deux bornes sont **échangées**, l'URL est corrigée par
`replaceState`, et la correction est signalée par le bandeau `ET-URL-CORRIGEE` au format
`Paramètre « <nom> » corrigé : bornes interverties, intervalle retenu <a> – <b>`. Cette règle **ne
s'applique qu'au chargement d'une URL** : la saisie interactive dans un contrôle d'intervalle est
régie par `draft-screens.md` (`EX-SCR-68`), qui refuse le filtre et ne permute jamais. Les deux
comportements sont volontairement différents et cette différence est normative — l'auteur d'une URL
reçue n'est pas présent pour corriger sa saisie, celui qui tape dans le contrôle l'est.

### A.7 Cycle de vie du snapshot

**Décision (`ARB-49`) : un seul snapshot actif, acquisition au démarrage et sur action explicite,
aucune acquisition automatique en cours de session.** Justification : l'enveloppe mémoire de
l'application (≈ 274 Mo à `N = 10⁶`, `EX-DATA-112`) ne laisse pas la place à deux snapshots, et un
remplacement automatique changerait les chiffres sous les yeux de l'utilisateur au milieu d'une
analyse.

**EX-NAV-23 — un seul snapshot actif.** L'application détient **un** snapshot actif à la fois. Il
est acquis au démarrage et **remplacé** uniquement sur action explicite `Rafraîchir`, placée dans le
jeton de snapshot (`draft-screens.md`, `EX-SCR-43`). **Aucune acquisition automatique** n'a lieu en
cours de session : ni périodique, ni au retour de focus, ni à la navigation.

**EX-NAV-24 — ce que le remplacement purge.** Au remplacement d'un snapshot : le cache LRU de
sélections (`EX-DATA-109`) est **vidé**, le cache de jeux de données locaux (`EX-SRCH-9ter`) est
**vidé**, les agrégats précalculés de la sélection vide sont **recalculés**, et `CompareSelection`
(`EX-CRUD-13bis`) est **vidée**. Sont **conservées** intactes les trois entités CRUD persistées
(recherches sauvegardées, modèles suivis, historique récent) : elles portent des URL, non des
données de snapshot. L'état de filtres courant et la route sont conservés ; un filtre devenu sans
effet est traité par `draft-screens.md` (`EX-SCR-101`).

**EX-NAV-25 — signalement.** Après un remplacement, le bandeau non bloquant refermable `Nouvelles
données du <date du nouveau snapshot> — la page a été recalculée` est affiché une fois. Si le
nouveau snapshot a un `sourceKind = SYNTHETIC` différent du précédent, le signalement
d'`EX-DATA-107` s'affiche en plus et n'est pas refermable.

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

**EX-SRCH-1bis — regroupement des rafales de filtres de classe `R` (`ARB-57`).** Un contrôle de
classe `R` (§B.2bis) s'applique immédiatement (`EX-SRCH-1`, débounce 0 ms) **tant que** moins de
trois changements ont eu lieu dans les 300 ms écoulées. Au **troisième** changement dans cette
fenêtre, l'application entre en mode groupé : les changements suivants sont accumulés et un
**unique** recalcul est déclenché 200 ms après le dernier changement reçu. Un recalcul local en
cours n'est jamais interrompu, mais **au plus un** recalcul est en attente à tout instant : un
nouveau changement remplace le recalcul en attente au lieu de s'y ajouter — il n'existe donc jamais
de file. Dès l'entrée en mode groupé, l'état `ET-CHARGE-LOCAL` cède la place à `ET-CHARGE-MAJ`
(`draft-screens.md`, `EX-SCR-25`), qui **porte** un indicateur : l'interdiction d'indicateur ne vaut
que pour un recalcul unique sous 150 ms.

### B.2 Combinaison logique

**EX-SRCH-10 — Entre filtres différents : ET.** Deux filtres actifs simultanément (ex. `fuel=D` et
`body=4`) restreignent conjointement le résultat. Ceci n'est pas ambigu : c'est la seule lecture
cohérente avec la nature de contraintes de marché indépendantes (00-CONTEXT.md : « budget X,
carrosserie Y, pays Z » sont des contraintes cumulatives par construction).

**EX-SRCH-11 — À l'intérieur d'un filtre multi-valeurs « attribut unique du véhicule » : OU.** Pour
`fuel`, `body`, `gear`, `offer`, `cy`, `make`, `prevownersid` : une annonce porte **exactement un**
code de cet attribut à la fois, y compris quand ce code est une catégorie hybride — c'est la
structure du vocabulaire, non une propriété du véhicule, qui fonde le OU intra-filtre (`ARB-35`) —,
donc `fuel=B,D` signifie nécessairement « essence OU diesel ». Repris tel quel de `REF-filters.md`
(§Z1, qui l'établit sans réserve pour cette classe de filtres).

**EX-SRCH-11bis — unité d'évaluation d'un prédicat (`ARB-33`).** Tout prédicat de filtre s'évalue
sur le **champ canonique** du dictionnaire, dans son **unité canonique** (`EX-DATA-4`). Une borne
saisie dans une unité d'affichage est convertie vers l'unité canonique **sans arrondi
intermédiaire**, en double précision, avant comparaison. Pour `powertype = hp` :
`powerKw ≥ borne_ch × 0,7355` et `powerKw ≤ borne_ch × 0,7355`, la constante étant celle
d'`EX-DATA-36` (DIN 66036) et **aucune autre**. Le champ dérivé `powerHp` est un champ
d'**affichage** et n'est jamais le membre gauche d'un prédicat.

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

### B.2bis Composantes de l'état de filtres

**Décision (`ARB-42`) : l'état de filtres est scindé en deux composantes, et tout effectif est
explicitement relatif au jeu de données local.** Sans cette scission, un filtre qui exigerait un
rechargement de données (classe `T`) et un filtre qui s'applique en mémoire (classe `R`) n'auraient
aucun statut distinct, alors que les deux dépendent d'un mécanisme différent (`DataProvider` pour
les uns, calcul local pour les autres).

**EX-SRCH-9bis — scission de l'état de filtres.** L'état de filtres se décompose en deux composantes
disjointes et exhaustives : la **composante `T`**, formée des valeurs de tous les filtres de classe
`T` (`draft-screens.md`, `EX-SCR-57`), et la **composante `R`**, formée des valeurs de tous les
filtres de classe `R`. La composante `T` détermine le **jeu de données local** ; la composante `R`
s'applique **en mémoire** sur ce jeu, sans aucun accès réseau.

**EX-SRCH-9ter — `localDatasetKey` et acquisition.** La composante `T` est sérialisée selon la règle
canonique d'`EX-DATA-108` et hachée en `localDatasetKey`. À chaque valeur distincte de
`localDatasetKey` correspond **un appel `DataProvider` et un seul**, dont la réponse **remplace**
intégralement le jeu de données local — jamais de fusion, jamais d'union avec un jeu précédent. Les
réponses sont conservées dans un cache clefé par `(snapshotId, localDatasetKey)`, de 4 entrées au
plus, en éviction LRU. Le **retrait** d'un filtre `T` produit une nouvelle `localDatasetKey`, donc un
nouvel appel, servi par le cache s'il y est présent. La composante `T` vide a pour clé la chaîne
réservée `FULL`, qui désigne le snapshot complet.

**EX-SRCH-9quater — tout chiffre est relatif au jeu local.** Tout effectif, toute facette
(`draft-screens.md`, `EX-SCR-90`), tout agrégat, tout bucket et tout verdict d'outlier est calculé
**sur le jeu de données local courant**, jamais sur le snapshot complet quand celui-ci n'est pas le
jeu local. Dès que la composante `T` n'est pas vide, le bandeau `C3` (`draft-screens.md`) affiche en
outre `Jeu de données restreint par <k> filtre(s) rechargé(s) — <n> annonces`, de sorte qu'aucun
chiffre ne soit présenté sans son périmètre.

**EX-SRCH-9quinquies — décomposition de `selectionHash`.** `selectionHash` est le couple
`(localDatasetKey, refineHash)`, où `refineHash` est le hachage canonique de la seule composante `R`.
Le cache LRU de 32 entrées d'`EX-DATA-109` est clefé par ce couple ; une entrée dont la
`localDatasetKey` est évincée du cache de jeux locaux est évincée avec elle. Deux états de filtres
qui ne diffèrent que par leur composante `R` partagent donc leur jeu de données et jamais leurs
agrégats.

### B.3 Dépendances entre filtres

| ID | Filtre parent | Filtre enfant | Comportement au changement du parent |
|---|---|---|---|
| EX-SRCH-14 | Marque (`make` en mode 1, ou route en mode 2) | Modèle (route mode 2 uniquement) | Changer de marque en mode 2 (via un sélecteur, hors clic sur zone-modèle) **vide** le modèle : il n'existe aucune garantie qu'un `modelId` reste valide pour une nouvelle marque. L'utilisateur revient à un état « marque choisie, modèle à choisir », concrètement une redirection vers `/` avec `make` posé à la nouvelle marque. |
| EX-SRCH-15 | `zip` | `zipr` | Si `zip` est **vidé**, `zipr` est vidé aussi (un rayon sans centre n'a pas de sens). Si `zip` change vers un **autre code postal valide**, `zipr` est **conservé** : le rayon est un réglage indépendant de la valeur précise du centre. |
| EX-SRCH-16 | `powertype` | `powerfrom`/`powerto` | Changer d'unité (kW ↔ ch) **convertit** les bornes déjà saisies plutôt que de les vider — l'intention de l'utilisateur (une plage de puissance) est indépendante de l'unité d'affichage. La conversion applique la constante unique d'`EX-DATA-36` (`1 kW = 1/0,7355 ch`) ; aucune autre valeur de facteur n'apparaît dans le corpus (`ARB-33`). |
| EX-SRCH-17 | `fuel` | `bot`, `erfrom`, `erto` | Hors périmètre v1 (§A.2.2) : aucun comportement à spécifier. Mentionné pour mémoire si ces filtres sont réintroduits en v2. |

### B.4 Réinitialisation

**EX-SRCH-18 — Réinitialisation globale.** Un bouton unique ramène tous les filtres IN à leur absence
(URL sans aucun des paramètres de §A.2.2), **sans changer de route** : en mode 2, l'utilisateur reste
sur le même modèle avec un bandeau vide, il n'est pas renvoyé en mode 1. Produit une entrée
d'historique (EX-NAV-14). Cette règle est la seule qui s'applique : elle ne porte que sur les
prédicats utilisateur, jamais sur les valeurs injectées vers la source (`EX-SRCH-18bis`, `ARB-30`).

**EX-SRCH-18bis — valeurs injectées vers la source, distinctes de l'état de filtres (`ARB-30`).**
L'adaptateur `DataProvider` injecte dans toute requête vers la source les valeurs `atype=C`
(périmètre voiture, `A-01`), `ustate=A,N,U` (neuf, occasion **et accidentés**), `powertype` et
`pricetype` dans leur unité canonique, et `cy` selon le marketplace du snapshot. Ces valeurs **ne
sont jamais** présentées comme des filtres utilisateur, **jamais** sérialisées dans l'URL de
l'application, **jamais** comptées dans le badge de filtres actifs, et **jamais** remises à zéro
par une réinitialisation (globale ou par groupe).
**`ustate=A,N,U` et non `N,U`** : `N,U` amputerait le snapshot des véhicules accidentés, dont `A-01`
fait un facteur explicatif d'outlier de premier ordre ; l'utilisateur peut ensuite les exclure par le
filtre `damaged_listing`, qui est un filtre utilisateur exposé.

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

**EX-SRCH-23 — Tri et pagination de la sous-vue liste d'annonces (écran D).** La sous-vue « liste
d'annonces individuelles » **existe** sous l'écran de distribution (`EX-NAV-2bis`, utile pour
inspecter un outlier ligne par ligne) — l'arbitrage `A-02` l'a tranché, ce n'est plus une hypothèse
conditionnelle. Elle reprend `sort`/`desc` d'AutoScout24 tels quels, une pagination **côté client**
(les données étant déjà chargées en mémoire pour l'agrégation, cf. §D.1) avec une taille de page
fixe de **50 lignes**, sans paramètre `size` réglable par l'utilisateur : `size` est un filtre
`RETENU` de `data/reference/filters-scope.json`, mais reste hors périmètre du bandeau utilisateur
pour cet usage (exposition `SECONDAIRE`, groupe `Liste d'annonces`, `ARB-02`).

**EX-SRCH-24** — Le tri des **cartes-marques** du mode 1 (ordre d'affichage des marques) est un
besoin distinct, non couvert par le paramètre `sort` d'AutoScout24 (qui trie des annonces, pas des
marques) et indépendant de la sous-vue liste d'`EX-SRCH-23`. Ce tri relève de `draft-screens.md`
(contenu et disposition de l'écran), pas de ce document.

### B.7 Sélection trop large

**EX-SRCH-25 — Décision : aucun filtre minimum obligatoire.** Le mode 1 sans aucun filtre est un
état de départ légitime, explicitement décrit par 00-CONTEXT.md comme la définition même du mode 1
(« aucune marque/modèle saisi »). Imposer un filtre minimum contredirait le cas d'usage
d'exploration libre du marché.

**EX-SRCH-26 — Seuil d'avertissement, sans blocage.** Si le mode 1 sans filtre (ou avec des filtres
très larges) renvoie plus de **60 marques** avec au moins un résultat, un bandeau non bloquant
s'affiche : « `<n>` marques correspondent — affinez pour comparer » (texte harmonisé sur
`EX-SCR-32`, autorité de l'annexe B sur la disposition écran, `R-A09`), avec un raccourci vers les
filtres les plus discriminants (prix, carrosserie). Le nombre 60 est choisi comme un ordre de
grandeur au-delà duquel une grille de cartes-marques cesse d'être parcourable en un seul écran sans
défilement long, sans empêcher l'utilisateur de continuer. [amendée 2.6 — T-t]

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
| Modèles suivis | **Retenu** | accès direct à un modèle sans reposer les mêmes filtres à chaque visite |
| Historique des recherches récentes | **Retenu** | filet de sécurité, coût quasi nul |
| Export des données affichées | **Retenu** (agrégats uniquement) | positionnement explicite « outil d'analyse » |
| Annotations (annonce ou modèle) | **Écarté** | l'app n'est pas un CRM (00-CONTEXT.md) ; s'accroche à des identifiants d'annonces éphémères (H4) |
| Comparaison de plusieurs modèles | **Retenu** (`RES-4`) | écran C dédié, `EX-CRUD-13bis` (`ARB-43`) et la route `/comparer` (`EX-NAV-2ter`, `ARB-41`) l'établissent ; le motif « écarté » d'origine (3ᵉ mode non demandé) a été renversé par ces deux arbitrages postérieurs |

### C.1 Recherches sauvegardées

Un état de filtres nommé, capturé sous forme d'URL relative (chemin + requête, §A.2), aucune donnée
d'annonce n'est dupliquée.

| ID | Règle |
|---|---|
| EX-CRUD-1 | Champs : `id` (généré), `nom` (texte, 1-60 caractères, obligatoire), `url` (chemin + requête au moment de l'enregistrement), `mode` (1 ou 2, dérivé de `url`), `créée_le`, `dernier_accès_le`, **`effectifInitial`** (entier — l'effectif d'**annonces** de la sélection au moment de l'enregistrement, jamais un nombre de marques ni de modèles), **`snapshotInitial`** (`snapshotId` du snapshot actif à l'enregistrement), **`schemaVersion`** (`EX-CRUD-18`). `effectifInitial` et `snapshotInitial` sont **figés à la création et jamais réécrits**, y compris à l'ouverture de la recherche (`ARB-45`). |
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
| EX-CRUD-7 | Champs : `makeId`, `modelId`, `ajouté_le`. Pas de filtres stockés (rouvre la route canonique de l'écran B, `/marche/:makeId-:makeSlug/:modelId-:modelSlug` (`EX-NAV-2`), sans paramètre de filtre). |
| EX-CRUD-8 | Persistance locale uniquement, mêmes raisons que EX-CRUD-3. |
| EX-CRUD-9 | Cycle de vie : bouton « suivre »/« ne plus suivre » directement sur l'écran de distribution (bascule, pas de formulaire) ; suppression également possible depuis `/suivis` (EX-NAV-4). |
| EX-CRUD-10 | Limite : **30 modèles suivis**. Au-delà, ajout bloqué avec message équivalent à EX-CRUD-5. Aucune notification ni veille automatique n'est fournie (H4 : snapshot périodique, pas de flux temps réel — un mécanisme d'alerte sur nouveauté exigerait une infrastructure hors périmètre). |

### C.3 Historique des recherches récentes

Distinct des recherches sauvegardées : automatique, non nommé, capé bas, sans action explicite de
création — sert le cas « revenir sur une exploration précédente qu'on n'a pas pensé à sauvegarder ».

| ID | Règle |
|---|---|
| EX-CRUD-11 | Chaque navigation vers `/marche` ou vers la route canonique de l'écran B, `/marche/:makeId-:makeSlug/:modelId-:modelSlug` (`EX-NAV-1`, `EX-NAV-2`), avec un jeu de filtres différent du précédent enregistre une entrée (`url`, `visité_le`) en tête d'une liste FIFO. |
| EX-CRUD-12 | Limite stricte : **10 entrées**. Au-delà, la plus ancienne est supprimée silencieusement (pas d'action utilisateur requise, pas de confirmation). |
| EX-CRUD-13 | Seule action utilisateur possible sur cette entité : « vider l'historique » (suppression totale immédiate). Aucune création, modification ou suppression unitaire — l'historique n'est pas éditable, seulement consultable ou vidé en bloc. |

### C.3bis Sélection de comparaison (entité de session)

**EX-CRUD-13bis — `CompareSelection`, entité de session (`ARB-43`).**
`{ modelKeys: liste ordonnée de couples (makeId, modelId), 0 à 4 entrées }`.
**Portée** : l'onglet du navigateur. **Non persistée** : elle ne vit ni dans `localStorage`, ni
dans `IndexedDB`, ni dans l'URL tant que l'utilisateur n'est pas sur `/comparer` ; elle est perdue à
la fermeture de l'onglet, et **vidée** au remplacement du snapshot (`EX-NAV-24`).
**Plafond unique : 4 modèles.** Au-delà, tout contrôle d'ajout est **désactivé** avec l'infobulle
`4 modèles au maximum — retirez-en un pour en ajouter un autre` ; aucun ajout silencieux, aucun
surnuméraire ignoré. **Ajout et retrait** sont possibles depuis : la case de comparaison d'une
zone-modèle (écran A), le bouton `Comparer` de l'en-tête de l'écran B, et l'écran C lui-même.
**Doublons interdits** : ajouter un couple déjà présent est sans effet. **Navigation** : la
sélection survit à toute navigation interne, y compris un changement de route. **URL** : sur
`/comparer`, elle est sérialisée dans `m` (`EX-NAV-10bis`) ; l'ouverture d'une URL `/comparer?m=…`
**remplace** la sélection de session par celle de l'URL, en ignorant les entrées au-delà de la
quatrième et en signalant l'écrêtage par `ET-URL-CORRIGEE`. La clé réservée `modelId = 0` **ne peut
pas** entrer dans la sélection (`EX-NAV-20`).

### C.4 Export des données affichées

Exporte les **agrégats actuellement visibles à l'écran** ou une annonce individuelle limitée aux
colonnes autorisées, jamais un champ interdit par R3 : la donnée identifiant le vendeur n'entre
jamais dans le schéma KYCAR, cf. `FINDING-allowed-surface.md` §2.5 (`ARB-37`).

| ID | Règle |
|---|---|
| EX-CRUD-14 | Format : CSV, encodage UTF-8 avec BOM (compatibilité Excel FR), séparateur point-virgule (convention belge/française d'Excel, où la virgule est le séparateur décimal). |
| EX-CRUD-15 | Périmètre mode 1 : une ligne par couple marque/modèle actuellement affiché (respecte les filtres actifs), colonnes = les agrégats affichés sur la carte (nombre d'offres, fourchette de prix, fourchette d'année, fourchette de kilométrage — la liste exacte des colonnes relève de `draft-data-dictionary.md`). |
| EX-CRUD-16 | Périmètre mode 2 : le menu `Exporter` propose **exactement deux** entrées. (1) `CSV des annonces du périmètre` — une ligne par annonce de la sélection courante, colonnes d'`EX-DATA-123bis`, **aucun champ identifiant un vendeur** (R3). (2) `CSV des agrégats affichés` — une ligne par bucket de **chacun des trois histogrammes** imposés, le nom du graphe en première colonne. La notion d'« onglet actif » est **supprimée** : les trois histogrammes sont affichés côte à côte, il n'existe donc pas de graphe courant. Aucune entrée `PNG` : l'export d'image reste écarté par `EX-CRUD-17`. (`ARB-37`) |
| EX-CRUD-17 | **Hors périmètre v1, explicitement écarté** : export d'image (PNG/SVG) d'un graphique. Ajoute un pipeline de rendu hors-écran sans servir directement l'un des deux parcours cibles (l'utilisateur peut faire une capture d'écran manuelle) ; à reconsidérer si le besoin est confirmé après livraison. |

### C.6 Version de schéma et migration

**EX-CRUD-18 — version de schéma et migration (`ARB-50`).** Chaque enregistrement persisté porte
`schemaVersion` (entier, incrémenté à chaque changement de forme d'une entité CRUD ou du vocabulaire
de paramètres d'URL). À la lecture :
- `schemaVersion` égale à la version courante → l'entrée est utilisée telle quelle ;
- `schemaVersion` inférieure et une fonction de migration nommée existe → l'entrée est migrée **en
  mémoire**, utilisée, et **réécrite** en version courante, la réécriture étant la seule exception à
  `EX-CRUD-4` et portant sur la forme, jamais sur l'intention des filtres ;
- `schemaVersion` inférieure et aucune migration disponible → l'entrée est **conservée**, utilisable,
  et marquée à l'écran `à vérifier — enregistrée par une version antérieure de l'application` ;
- `schemaVersion` supérieure à la version courante → l'entrée est conservée, non ouvrable, et marquée
  `enregistrée par une version plus récente`.

**Aucune entrée n'est jamais supprimée silencieusement**, à aucune version. Un paramètre d'URL retiré
du vocabulaire est traité à l'ouverture par la table de corrections d'`EX-NAV-21`, donc signalé par
`ET-URL-CORRIGEE`.

### C.7 Concurrence entre onglets

**EX-CRUD-19 — concurrence entre onglets (`ARB-58`).** Toute écriture d'une entité CRUD est **relue
juste avant d'être écrite** (lecture-vérification-écriture) : si le plafond de l'entité (`EX-CRUD-5` :
50, `EX-CRUD-10` : 30, `EX-CRUD-12` : 10) est atteint entre la lecture initiale et l'écriture,
l'écriture est **refusée** avec le message de plafond, jamais appliquée en dépassement. Deux
écritures concurrentes ne peuvent jamais faire perdre une entrée existante : l'écriture porte sur
l'entrée ajoutée ou modifiée, jamais sur la réécriture de la collection entière. Chaque onglet
s'abonne à l'événement `storage` et **rafraîchit** sa liste affichée sans recharger la page ;
l'écran des recherches sauvegardées et l'écran des modèles suivis affichent alors la liste à jour.
**Justification** : `localStorage` n'offre aucune garantie transactionnelle entre onglets d'une même
origine, et le plafond dur promis par `EX-CRUD-5` n'est pas tenable sans cette relecture.

### C.8 Entités écartées — détail des motifs

- **Annotations sur une annonce ou un modèle** : écarté. Une annotation liée à un `id` d'annonce
  s'appuie sur un identifiant qui n'a de sens que pour la durée d'un snapshot (H4) — au snapshot
  suivant, l'annonce peut avoir disparu ou changé d'identifiant, orphelinant silencieusement la note.
  Une annotation liée à un modèle (pas une annonce) chevaucherait la fonction déjà remplie par les
  recherches sauvegardées et les modèles suivis, sans ajouter de valeur distincte. Surtout,
  00-CONTEXT.md exclut explicitement le positionnement CRM (« Ce n'est pas un CRM concessionnaire »).
- **Comparaison de plusieurs modèles côte à côte** — **reclassée `Retenu` (`RES-4`)**, n'est plus une
  entité écartée. Motif historique de l'écart initial, pour mémoire : elle constituait un troisième
  mode d'usage non demandé au cadrage (S6 de la phase 2.1 ne prévoyait que deux écrans obligatoires).
  Ce motif a été **renversé** par deux arbitrages du stress-test : `ARB-43` crée l'entité de session
  `CompareSelection` (`EX-CRUD-13bis`, § C.3bis) avec son plafond de 4 modèles, et `ARB-41` lui donne
  une route dédiée, `/comparer` (`EX-NAV-2ter`). La fonction est donc retenue et implémentée par
  l'écran C ; elle n'est plus détaillée ici mais en § C.3bis.

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

**EX-NFR-4bis — définition du percentile de performance (`ARB-38`).** Tout percentile de cette
section est le **percentile de rang le plus proche supérieur** : sur l'échantillon de mesures trié,
`p95 = x_{⌈0,95·n⌉}`, **sans interpolation**. Il est **distinct** du `Q` de type 7 utilisé pour les
statistiques de données (`draft-data-dictionary.md`, `EX-DATA-62`), réservé aux données, jamais aux
latences. Chaque cible est mesurée sur **au moins 100 exécutions** du geste décrit, sur le jeu de
référence d'`EX-NFR-1` et l'appareil de référence (`draft-screens.md`, `EX-SCR-100`), **chargement à
froid exclu**, et la campagne publie `n`, la médiane et le `p95`.

| ID | Opération | Cible | Percentile |
|---|---|---|---|
| EX-NFR-5 | Application d'un filtre (du recalcul déclenché à l'affichage mis à jour, hors delai de debounce lui-même) | ≤ 200 ms | p95 |
| EX-NFR-6 | Rendu d'un histogramme (prix, kilométrage ou année) jusqu'à 100 000 annonces en entrée | ≤ 300 ms | p95 |
| EX-NFR-7 | Rendu initial du nuage tri-dimensionnel (prix × année × kilométrage) jusqu'à 5 000 points (taille attendue d'une distribution par modèle) | ≤ 500 ms | p95 |
| EX-NFR-8 | Interaction (rotation, zoom) sur le nuage tri-dimensionnel une fois rendu | **aucune fenêtre glissante de 1 s ne descend sous 30 images/seconde dans au moins 95 % des fenêtres** d'une rotation continue de 10 s ; la mesure publie le nombre de fenêtres, le nombre de fenêtres en défaut et le débit minimal observé (`ARB-38`) | `EX-NFR-4bis` |
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

### D.9 Impression

**EX-NFR-31 — impression (`ARB-63`).** L'impression et l'export PDF d'un écran sont **hors
périmètre fonctionnel v1** : aucune mise en page d'impression n'est spécifiée, aucune table de
données n'est ajoutée pour l'impression. Une feuille `@media print` **minimale** est néanmoins
exigée, et son contenu est clos : les éléments collants (en-tête, bandeau de filtres, barre de
synthèse) perdent leur positionnement fixe ; les bandeaux d'état et le bandeau `C3` sont imprimés ;
le bandeau de filtres est remplacé par un résumé textuel des filtres actifs, un par ligne ; les
contrôles interactifs ne sont pas imprimés. Tout au-delà est une dette assumée, consignée comme
telle.

> Note de numérotation : la décision `ARB-63` cite cette exigence sous l'identifiant `EX-NFR-28`.
> Ce numéro est déjà occupé dans ce document par une exigence sans rapport (langue d'interface,
> D.8). Conformément à la règle « ne jamais renuméroter un identifiant existant, une création prend
> un identifiant neuf » de la méthode d'application, cette exigence reçoit l'identifiant neuf
> **`EX-NFR-31`**, le prochain disponible du préfixe. Le contenu normatif est repris **sans
> altération** ; seul le numéro diffère de celui écrit dans `REQ-STRESSTEST.md` § 4.3 et `ARB-63`.

---

## Annexe — Décompte des exigences de cette section

| Préfixe | Nombre d'exigences | Créations phase 2.2 (`ANNEXE-C`) |
|---|---|---|
| EX-NAV | 28 | +6 (`EX-NAV-2bis`, `EX-NAV-2ter`, `EX-NAV-10bis`, `EX-NAV-23` à `25`) |
| EX-SRCH | 34 | +7 (`EX-SRCH-1bis`, `EX-SRCH-9bis` à `9quinquies`, `EX-SRCH-11bis`, `EX-SRCH-18bis`) |
| EX-CRUD | 20 | +3 (`EX-CRUD-13bis`, `EX-CRUD-18`, `EX-CRUD-19`) |
| EX-NFR | 32 | +2 (`EX-NFR-4bis`, `EX-NFR-31`) |
| **Total** | **114** | **+18** |

> Décompte avant application de la liste `ANNEXE-C` de `reports/REQ-STRESSTEST.md` § 4.3 : EX-NAV 22,
> EX-SRCH 27, EX-CRUD 17, EX-NFR 30, total 96. Aucun identifiant préexistant n'a été renuméroté ; les
> 18 créations ci-dessus portent chacune un identifiant neuf ou un suffixe `bis`/`ter`/`quater`/
> `quinquies`, conformément à la méthode d'application de la phase 2.2.
