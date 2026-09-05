# draft-screens — Spécification des écrans KYCAR

> Section autonome produite par l'agent `req-screens` (phase 2.1 de `PLAN-2-app-build.md`),
> destinée à être assemblée par `req-lead` dans `REQUIREMENTS.md` (sections 5, 6 et 7 du
> contenu minimum imposé).
>
> **Sources utilisées** : `docs/00-CONTEXT.md` (intention, deux parcours cibles),
> `docs/requirements/REF-filters.md` (101 filtres, domaines de valeurs, zones d'ombre Z1–Z8),
> `docs/requirements/REF-vocabulary-reconciliation.md` (PIÈGE 1 sur `fuel`),
> `docs/research/FINDING-allowed-surface.md` (§2.1 `topModels`, §2.2 `priceInfo`,
> §2.3 les 40 champs d'annonce réellement relevés, §3 limites P1–P6).
>
> **Aucune requête réseau n'a été faite.** Aucune donnée n'est inventée : chaque affichage
> est rattaché à un champ relevé, et les affichages demandés par le commanditaire qui
> exigent un champ absent de la source sont signalés en **§8 — Champs manquants**.
>
> **Périmètre de cette section** : identité, structure, contenu, états, éléments interactifs et
> responsive de chaque écran, plus le composant partagé « bandeau de filtres ».
> Le dictionnaire de données appartient à `req-data`. La navigation détaillée, le débounce,
> la synchronisation d'URL et le CRUD appartiennent à `req-behaviour` : les routes et
> comportements cités ici sont **proposés** et doivent être réconciliés par `req-lead`.

---

## Sommaire

| § | Contenu | Exigences |
|---|---|---|
| 1 | Conventions transverses : unités, formats, échelles, jetons de mise en page | `EX-SCR-1` → `EX-SCR-22` |
| 2 | Catalogue des états dégradés (référencé par tous les écrans) | `EX-SCR-23` → `EX-SCR-39` |
| 3 | Coquille applicative, inventaire des écrans, carte de navigation | `EX-SCR-40` → `EX-SCR-54` |
| 4 | Composant partagé **C1 — Bandeau de filtres** (les 101 filtres) | `EX-SCR-55` → `EX-SCR-103` |
| 5 | **Écran A — Survol du marché** | `EX-SCR-104` → `EX-SCR-138` |
| 6 | **Écran B — Distribution d'un modèle** (11 graphes) | `EX-SCR-139` → `EX-SCR-192` |
| 7 | Écrans additionnels proposés (C, D, E, G) — marqués **AJOUT** | `EX-SCR-193` → `EX-SCR-215` |
| 8 | Champs manquants, affichages non réalisables, alternatives | `EX-SCR-216` → `EX-SCR-224` |
| 9 | Matrice de vérification | — |

Total : **224 exigences** `EX-SCR-*`.

---

## 1. Conventions transverses

Ces conventions sont normatives et s'appliquent à tous les écrans. Elles existent pour qu'aucun
développeur n'ait à décider d'un format d'affichage.

### 1.1 Formats numériques et textuels

`EX-SCR-1` — **Séparateur de milliers.** Tout entier ≥ 1 000 est affiché avec l'espace insécable
étroite U+202F comme séparateur de groupes de 3 chiffres, aucun séparateur décimal.
Exemples : `1 281`, `18 950`, `128 400`, `120 779`. Les exemples de ce document utilisent une
espace ordinaire pour la lisibilité ; l'implémentation utilise U+202F.
Implémentation de référence : `Intl.NumberFormat('fr-BE')` avec substitution du séparateur
retourné par U+202F, vérifiée par test unitaire sur les 6 valeurs ci-dessus.

`EX-SCR-2` — **Séparateur décimal.** La virgule. Exemples : `5,4 l/100 km`, `12,3 %`.
Aucun affichage n'excède 1 chiffre après la virgule, sauf `EX-SCR-9` (coordonnées).

`EX-SCR-3` — **Prix.** Format `<entier> €`, arrondi à l'euro par troncature vers le bas
(`Math.floor`), symbole `€` précédé d'une espace insécable U+00A0, jamais de décimales.
Exemple : `18 950 €`. Un prix nul ou absent suit `EX-SCR-36`.

`EX-SCR-4` — **Fourchette de prix.** Format `<min> – <max> €` : le symbole monétaire n'apparaît
qu'une fois, en fin de chaîne ; le séparateur est le tiret demi-cadratin U+2013 entouré d'espaces
insécables. Exemple : `4 200 – 21 900 €`. Si `min === max`, afficher la valeur seule : `9 500 €`.

`EX-SCR-5` — **Kilométrage.** Format `<entier> km`, arrondi à la centaine la plus proche
au-dessus de 10 000 km, à l'unité en dessous. Exemples : `8 421 km`, `128 400 km`.
Fourchette : `12 000 – 210 000 km` (même règle qu'`EX-SCR-4`).

`EX-SCR-6` — **Année.** Deux notations distinctes, jamais interchangées :
- **Année de première immatriculation** (champ `condition.firstRegistrationDate`) — format
  `MM/AAAA` sur les fiches et infobulles (`03/2017`), format `AAAA` sur les axes de graphe et les
  fourchettes (`2017`). Une fourchette s'écrit `2014 – 2021`.
- **Année-modèle** (champ `modelYear`) — format `AAAA` précédé du qualificatif `mod.` lorsqu'elle
  est affichée à côté d'une première immatriculation : `mod. 2018`. Les deux ne sont jamais
  additionnées ni moyennées ensemble.

`EX-SCR-7` — **Puissance.** Format `<kW> kW (<ch> ch)` lorsque les deux champs
`engine.power.kw.raw` et `engine.power.hp.raw` sont présents ; sinon la seule unité présente.
L'unité mise en avant sur les axes de graphe suit la valeur du filtre `powertype`
(`kw` par défaut, cf. REF-filters #35).

`EX-SCR-8` — **Consommation et CO₂.** `5,4 l/100 km` (1 décimale) et `128 g/km` (entier).
Ces deux champs (`consumption.combinedWithFallback`,
`co2emissionInGramPerKmWithFallback`) sont **présents dans la donnée d'annonce mais ne sont
filtrables par aucun paramètre** (REF-filters Z5). Ils sont donc affichables, jamais filtrables.

`EX-SCR-9` — **Géographie.** Pays affiché par son libellé français issu de l'énumération `cy`
(REF-filters #65) : `Belgique`, `Allemagne`… Code postal **tronqué à 2 chiffres suivis de `xx`**
(`10xx`, `90xx`) conformément à la contrainte RGPD de `00-CONTEXT.md`. La ville
(`location.city`) n'est **jamais affichée** : elle rend le vendeur particulier réidentifiable en
combinaison avec le modèle et le prix. Latitude/longitude ne sont jamais affichées ; elles
existent en interne avec 5 décimales pour le calcul de rayon.

`EX-SCR-10` — **Effectifs.** Format `<entier> offre` au singulier, `<entier> offres` au pluriel,
`aucune offre` pour zéro. Jamais `0 offre`.

`EX-SCR-11` — **Pourcentages.** Entier suivi d'une espace insécable et de `%`. Une valeur
strictement comprise entre 0 et 0,5 s'affiche `< 1 %`. Une valeur strictement comprise entre
99,5 et 100 s'affiche `> 99 %`. La somme affichée d'une répartition est corrigée par la méthode
du plus grand reste pour totaliser exactement `100 %`.

`EX-SCR-12` — **Statistiques.** Les libellés normatifs sont : `médiane`, `moyenne`, `min`, `max`,
`P10`, `P25`, `P75`, `P90`, `écart interquartile`. Le mot « moyenne » n'est jamais employé pour
désigner une médiane. Toute statistique affichée porte, en infobulle, l'effectif sur lequel elle
est calculée : `médiane 18 950 € (n = 47)`.

`EX-SCR-13` — **Troncature.** Tout libellé susceptible de dépasser sa boîte est tronqué sur une
seule ligne par `text-overflow: ellipsis`, avec l'intégralité du texte dans l'attribut `title`
et dans `aria-label`. Budgets de caractères avant troncature : nom de marque 22, nom de modèle
28, libellé de filtre actif 34, libellé d'axe 20. Aucun texte n'est tronqué au milieu d'un mot
par insertion manuelle de points de suspension dans la chaîne de données.

`EX-SCR-14` — **Langue.** L'intégralité de l'interface est en français de Belgique. Les libellés
d'énumération proviennent de la colonne « Libellé FR » de `REF-filters.md`, sans reformulation :
un libellé relevé (`SUV/4x4/Pick-Up`, `Voiture récente`, `Ancêtre`) est repris à l'identique,
même s'il est inhabituel, afin que l'utilisateur retrouve le vocabulaire de la source.

### 1.2 Échelles de graphe

`EX-SCR-15` — **Échelle par défaut : linéaire** sur les deux axes de tout graphe. Justification :
l'axe des effectifs d'un histogramme doit permettre la comparaison additive de deux barres, ce
qu'une échelle logarithmique interdit.

`EX-SCR-16` — **Bascule logarithmique conditionnelle.** Un axe d'effectif propose une bascule
`Échelle log` **uniquement** lorsque le rapport entre l'effectif du bucket le plus peuplé et
celui du bucket non vide le moins peuplé est ≥ 50. En dessous de 50, la bascule est absente du
DOM. La bascule n'est jamais active par défaut, et son état est mémorisé par graphe dans l'URL
(paramètre `g<n>log=1`), pas globalement.

`EX-SCR-17` — **Axe des prix : linéaire, jamais logarithmique par défaut.** Justification : le
parcours cible est « budget 20 000 € » ; un axe log rendrait illisible la position d'un budget
absolu. Une bascule log est offerte sur l'axe des prix du seul graphe `G7` (densité prix × km),
où l'étalement du haut de gamme écrase la masse.

`EX-SCR-18` — **Bornes d'axe.** Les axes sont bornés aux percentiles P1 et P99 de la donnée
affichée, arrondis vers l'extérieur au pas de bucket. Les points hors de ces bornes ne sont
**jamais supprimés** : ils sont regroupés dans un bucket de débord explicitement libellé
`< <borne>` et `> <borne>`, affiché avec une trame diagonale et un contour pointillé pour le
distinguer d'un bucket régulier. Justification : la détection d'outliers est l'objet de
l'application ; masquer les extrêmes détruirait la fonction.

`EX-SCR-19` — **Zéro obligatoire.** Tout axe portant un effectif ou une longueur de barre
commence à 0. Aucun axe d'effectif tronqué.

### 1.3 Jetons de mise en page

`EX-SCR-20` — **Points de rupture.** Trois régimes, et trois seulement :
`compact` < 768 px ; `intermédiaire` 768 px – 1279 px ; `large` ≥ 1280 px.
La largeur du contenu est plafonnée à 1 680 px, centrée, au-delà de 1 792 px de viewport.

`EX-SCR-21` — **Grille et rythme.** Gouttière de 16 px en `compact`, 20 px en `intermédiaire`,
24 px en `large`. Rayon de coin 8 px sur les cartes, 4 px sur les contrôles. Hauteur de cible
tactile minimale 44 × 44 px en `compact`, 32 × 32 px ailleurs.

`EX-SCR-22` — **Densité d'information cible, mesurable.** En régime `large` et à hauteur de
viewport 900 px : l'écran A présente **au moins 6 cartes-marques** et **au moins 24 zones-modèles**
sans défilement ; l'écran B présente **le bandeau de filtres replié + 2 graphes complets**
sans défilement. Ces deux chiffres sont des critères de recette mesurés par capture d'écran
automatisée à 1 440 × 900.

---

## 2. Catalogue des états dégradés

Ces états sont définis une fois et **référencés par identifiant** dans chaque écran. Chaque état
précise ce qui s'affiche et ce que l'utilisateur peut faire.

`EX-SCR-23` — **`ET-CHARGE-INIT` — premier chargement.** Squelette, jamais de spinner.
Le squelette reproduit la géométrie finale : rectangles gris à 8 % d'opacité aux dimensions
exactes des blocs attendus, animation de balayage de 1,4 s en boucle. Affiché après un délai
de **120 ms** (en dessous, rien n'est affiché, pour éviter le clignotement). Le bandeau de
filtres reste **entièrement interactif** pendant cet état. Aucun bouton d'action n'est désactivé
sauf `Exporter`.

`EX-SCR-24` — **`ET-CHARGE-MAJ` — recalcul après changement de filtre.** Le contenu précédent
**reste affiché**, atténué à 45 % d'opacité, non cliquable, surmonté d'une barre de progression
indéterminée de 3 px collée sous le bandeau de filtres. Un spinner circulaire de 24 px
n'apparaît qu'au-delà de **400 ms**, centré dans le bloc concerné. Jamais de squelette dans cet
état : remplacer un contenu valide par un squelette fait perdre le repère visuel.
L'utilisateur peut continuer à modifier les filtres ; la requête en cours est alors annulée.

`EX-SCR-25` — **`ET-CHARGE-LOCAL` — recalcul purement local** (filtre de classe R, cf. §4.2).
Aucun indicateur de chargement d'aucune sorte. Budget : 150 ms entre le clic et le
réaffichage complet, mesuré sur 100 000 annonces en mémoire. Au-delà de 150 ms, l'état bascule
sur `ET-CHARGE-MAJ`.

`EX-SCR-26` — **`ET-VIDE-FILTRES` — zéro résultat, filtres posés.** Bloc centré, largeur
maximale 480 px, comprenant : le titre `Aucune offre ne correspond`, une phrase indiquant le
nombre de filtres actifs (`12 filtres actifs restreignent la recherche.`), et **la liste des
3 filtres les plus restrictifs** avec pour chacun le nombre d'offres que son retrait
rendrait disponibles, sous forme de boutons de retrait :
`Prix ≤ 5 000 € — retirer (+ 1 208 offres)`. Le calcul est un « leave-one-out » sur les filtres
de classe R uniquement ; pour les filtres de classe T le compte est remplacé par `— retirer`
sans chiffre, et ce cas est signalé par l'absence de parenthèse, pas par une note.
Actions disponibles : retirer un filtre, `Réinitialiser tous les filtres`, `Enregistrer cette
recherche` (reste actif : une recherche vide est légitime pour une veille).

`EX-SCR-27` — **`ET-VIDE-SANS-FILTRE` — zéro résultat, aucun filtre posé.** Traité comme une
panne, pas comme un résultat : titre `Aucune donnée disponible`, mention du champ
`snapshot.date` du jeu de données courant, et bouton `Réessayer`. Justification : un marché
national ne peut pas être vide ; l'origine est nécessairement technique.

`EX-SCR-28` — **`ET-ERREUR-PROVIDER` — le `DataProvider` a échoué.** Bandeau rouge pleine
largeur sous l'en-tête, non refermable, portant : `Les données n'ont pas pu être chargées`, le
code d'erreur technique (`E-PROV-408`), l'horodatage de la tentative au format `HH:MM:SS`, et
deux boutons : `Réessayer` (relance la même requête) et `Afficher le dernier résultat connu`
(présent uniquement si un résultat est en cache, et il affiche alors `ET-PARTIEL-CACHE`).
Le contenu de la zone principale passe en `ET-VIDE-SANS-FILTRE`. Le bandeau de filtres reste
interactif afin que l'utilisateur puisse préparer une requête plus étroite.

`EX-SCR-29` — **`ET-PARTIEL-CACHE` — résultat servi depuis un cache périmé.** Bandeau ambre :
`Données du <JJ/MM/AAAA HH:MM> — le rafraîchissement a échoué`, bouton `Réessayer`. Tous les
chiffres affichés portent un astérisque en exposant renvoyant à ce bandeau. Aucun export n'est
possible dans cet état (bouton `Exporter` désactivé, motif en infobulle :
`Export indisponible sur des données non rafraîchies`).

`EX-SCR-30` — **`ET-PARTIEL-COUVERTURE` — l'échantillon ne couvre pas la population.**
C'est l'état **normal**, pas exceptionnel, compte tenu de la limite P1 de
`FINDING-allowed-surface.md` (20 annonces observées par page contre un total déclaré bien
supérieur). Il se manifeste par le **bandeau de couverture** défini en `EX-SCR-31`.

`EX-SCR-31` — **Bandeau de couverture (composant `C3`).** Présent sur tout écran affichant une
statistique calculée sur un échantillon. Contenu exact, sur une ligne :
`Statistiques calculées sur <n_obs> annonces observées sur <n_tot> annoncées — couverture <p> %`,
suivi d'un jeton coloré : vert si `p ≥ 80`, ambre si `20 ≤ p < 80`, rouge si `p < 20`.
Un lien `Pourquoi ?` ouvre un panneau latéral de 360 px reprenant textuellement les limites P1
et P2 de `FINDING-allowed-surface.md`, dont l'avertissement que **la représentativité de
l'échantillon n'est pas prouvée** (`adProduct.tier` suggère un tri influencé par le produit
publicitaire). Ce bandeau est **non refermable** lorsque `p < 20`.

`EX-SCR-32` — **`ET-TROP-RESULTATS` — la population dépasse le seuil de rendu.** Seuils :
écran A, plus de 40 marques à afficher ; écran B, plus de 20 000 annonces individuelles à
tracer. Comportement : le rendu n'est pas dégradé silencieusement. Un bandeau informatif
indique `<n> marques correspondent — 20 affichées, triées par nombre d'offres` (écran A) ou
`<n> annonces — la nuée affiche un échantillon aléatoire de 20 000 points (graine fixée)`
(écran B). Le bandeau porte le bouton `Tout afficher` qui active le rendu virtualisé (écran A)
ou le rendu par densité `G7` (écran B). Les **agrégats restent calculés sur la population
entière**, jamais sur l'échantillon d'affichage ; cette distinction est écrite dans l'infobulle
de chaque statistique concernée.

`EX-SCR-33` — **`ET-EFFECTIF-FAIBLE` — effectif insuffisant pour une statistique.** Trois
paliers, appliqués uniformément :
- `n = 0` → la statistique n'est pas affichée ; à sa place, le caractère `—` en gris.
- `1 ≤ n ≤ 4` → les valeurs brutes sont affichées mais **aucun percentile, aucune médiane,
  aucune bande interquartile, aucune régression** n'est calculée ; à leur place, la mention
  `n trop faible` et l'effectif exact.
- `5 ≤ n ≤ 9` → médiane, min et max affichés ; percentiles P10/P90, bande interquartile,
  régression et détection d'outliers **désactivés** ; un jeton ambre `n = 7` accolé au titre du
  graphe.
Au-delà de `n ≥ 10`, tout est calculé. Ces seuils sont uniques pour toute l'application et
testables par jeu de données de tailles 0, 1, 3, 5, 9 et 10.

`EX-SCR-34` — **`ET-CHAMP-MANQUANT` — une annonce n'a pas la valeur d'un champ affiché.**
La cellule affiche le caractère `—` (U+2014) en gris à 55 % d'opacité, avec
`aria-label="valeur non renseignée"`. L'annonce n'est **jamais écartée** de l'effectif total
pour autant : elle est écartée du seul agrégat qui utilise ce champ, et chaque agrégat affiche
son effectif propre. Une note sous le graphe indique
`<k> annonces exclues de ce graphe (année non renseignée)` dès que `k ≥ 1`.

`EX-SCR-35` — **`ET-CHAMP-ABSENT-SOURCE` — un champ n'existe pas dans la source.**
Distinct de `ET-CHAMP-MANQUANT`. Le bloc qui l'exigerait n'est pas rendu vide : il est
**absent du DOM**, et sa place est occupée par le bloc suivant. La liste des blocs ainsi
supprimés est consultable dans le panneau `Diagnostic des données` (`EX-SCR-53`). Aucun
« graphe vide » n'est jamais affiché.

`EX-SCR-36` — **Valeurs de prix non exploitables.** Trois cas distincts, et un rendu distinct
pour chacun :
- `prices.public.onRequestOnly = true` → afficher `Prix sur demande` ; l'annonce est **exclue**
  de tous les agrégats de prix et comptée dans une note `<k> annonces à prix sur demande`.
- prix ≤ 0 ou absent → traité comme `ET-CHAMP-MANQUANT`, exclu des agrégats de prix.
- prix > 0 mais < 100 € → conservé et **marqué comme suspect** (jeton `?` cliquable ouvrant
  l'infobulle `Prix inférieur à 100 € — probable annonce de pièce ou d'erreur de saisie`).
  Il reste dans l'agrégat : l'écarter reviendrait à masquer précisément l'anomalie recherchée.
  Un commutateur global `Écarter les prix < 100 €` existe dans le bandeau (`EX-SCR-95`).

`EX-SCR-37` — **`ET-HORS-LIGNE`.** Bandeau gris : `Hors ligne — affichage du dernier résultat
chargé`. Tous les contrôles de filtre de classe T sont désactivés avec l'infobulle
`Nécessite une connexion` ; les filtres de classe R restent actifs, puisqu'ils se recalculent
localement. C'est la justification opérationnelle de la distinction R/T.

`EX-SCR-38` — **Ordre de priorité des bandeaux.** Au plus **deux** bandeaux simultanés,
empilés dans cet ordre du haut vers le bas :
`ET-ERREUR-PROVIDER` > `ET-HORS-LIGNE` > `ET-PARTIEL-CACHE` > `ET-TROP-RESULTATS` >
`C3 couverture`. Les suivants sont repliés derrière un jeton `+2 avertissements` cliquable.
Hauteur totale des bandeaux plafonnée à 96 px ; au-delà, la zone devient défilante.

`EX-SCR-39` — **Aucun état n'est silencieux.** Toute exclusion de donnée, tout plafonnement,
tout calcul dégradé produit un texte visible à l'écran ou dans une infobulle atteignable en
un survol. Critère de recette : sur un jeu de données pathologique contenant 0 prix, 3 années
manquantes, 1 prix à 1 €, 1 prix sur demande et 12 000 annonces, **cinq** mentions distinctes
sont dénombrables à l'écran.

---

## 3. Coquille applicative, inventaire des écrans, navigation

### 3.1 Inventaire

| Réf. | Écran | Route proposée | Rôle dans le parcours | Statut |
|---|---|---|---|---|
| **A** | Survol du marché | `/marche?<filtres>` | Parcours 1 — exploration descendante | **imposé** |
| **B** | Distribution d'un modèle | `/marche/:makeId-:makeSlug/:modelId-:modelSlug?<filtres>` | Parcours 2 — analyse d'un modèle | **imposé** |
| **C** | Comparaison de modèles | `/comparer?m=<id>,<id>[,<id>][,<id>]&<filtres>` | Sortie du parcours 1 vers une décision | **AJOUT** |
| **D** | Annonces du modèle | `/marche/:makeId-:makeSlug/:modelId-:modelSlug/annonces?<filtres>` | Sortie du parcours 2 vers l'action | **AJOUT** |
| **E** | Recherches enregistrées | `/recherches` | Reprise d'un état d'analyse | **AJOUT** |
| **G** | Sélecteur marque / modèle | modale sur A, B, C, D | Rendre navigables 295 marques et 4 955 modèles | **AJOUT** |
| **S0** | Coquille (en-tête, bandeaux, pied) | — | Cadre commun | composant |

`EX-SCR-40` — Les écrans A et B sont les deux seuls écrans **obligatoires**. Les écrans C, D, E
et G sont des ajouts de l'agent `req-screens`, chacun justifié en §7 par une phrase, et chacun
peut être retiré du périmètre sans rendre A et B inopérants.

`EX-SCR-41` — **Aucun écran de détail d'annonce n'est spécifié, et c'est un choix.**
Justification : `00-CONTEXT.md` interdit de dupliquer le contenu d'une annonce
(« KYCAR conserve un lien (deeplink) vers l'annonce d'origine plutôt que de dupliquer son
contenu intégral ») et R3 interdit les champs vendeur. Une page de détail KYCAR n'apporterait
donc rien que la ligne de tableau de l'écran D n'apporte déjà, et créerait un risque de
republication. Le champ `details.webPage` est utilisé comme lien sortant, jamais comme source
d'un écran interne.

### 3.2 Coquille `S0`

```
+==========================================================================================+
| KYCAR   [ Survol du marche ]  [ Comparer (2) ]  [ Recherches (5) ]      Snapshot 06/09 (i)|  48 px
+==========================================================================================+
| (bandeaux d'etat empiles ici, 0 a 2, cf. EX-SCR-38)                            0..96 px  |
+==========================================================================================+
| C1 - BANDEAU DE FILTRES  (replie: 96 px  |  deplie: 320 px max, zone interne defilante)  |
+==========================================================================================+
| Fil d'Ariane :  Marche  >  Opel  >  Corsa                     123 456 offres  |  1 281 ici|  36 px
+==========================================================================================+
|                                                                                          |
|                          ZONE PRINCIPALE (ecran A, B, C, D ou E)                         |
|                                                                                          |
+==========================================================================================+
| Source : AutoScout24 - agregat non affilie | Donnees du 06/09/2026 | Diagnostic | Mentions|  32 px
+==========================================================================================+
```

`EX-SCR-42` — **En-tête, hauteur fixe 48 px**, collant en haut (`position: sticky; top: 0`).
Contenu de gauche à droite : marque textuelle `KYCAR` (retour à `/marche` en conservant les
filtres actifs), trois onglets de navigation principaux, et à droite le jeton de snapshot.

`EX-SCR-43` — **Jeton de snapshot.** Texte `Snapshot <JJ/MM>` suivi d'une icône
d'information. Au survol, infobulle donnant : la date-heure exacte du snapshot au format
`JJ/MM/AAAA HH:MM`, le nombre total d'annonces qu'il contient, le nombre de marques et de
modèles distincts, et le pays couvert. Si l'âge du snapshot dépasse **7 jours**, le jeton passe
en ambre ; au-delà de **30 jours**, en rouge avec le texte `Snapshot ancien (<n> jours)`.
Justification du seuil : H4 admet un snapshot périodique, mais un marché de l'occasion se
renouvelle sur quelques semaines ; au-delà de 30 jours les fourchettes de prix sont
matériellement fausses et l'utilisateur doit le savoir.

`EX-SCR-44` — **Compteurs d'onglet.** `Comparer (2)` et `Recherches (5)` portent entre
parenthèses le cardinal courant ; le compteur est absent quand il vaut 0, et l'onglet
`Comparer` est alors **désactivé** (opacité 45 %, `aria-disabled="true"`, infobulle
`Sélectionnez au moins 2 modèles depuis le survol du marché`).

`EX-SCR-45` — **Fil d'Ariane, hauteur fixe 36 px.** Segments : `Marché` > `<marque>` >
`<modèle>`. Chaque segment amont est cliquable et **conserve l'intégralité des filtres actifs**,
en retirant seulement les segments de taxonomie aval. Le segment courant n'est pas cliquable.
En régime `compact`, seuls les deux derniers segments sont affichés, précédés de `…` qui ouvre
un menu contenant les segments masqués.

`EX-SCR-46` — **Double compteur à droite du fil d'Ariane.** Deux nombres, séparés par une barre
verticale : à gauche, `<n> offres` = effectif après application des filtres **hors** taxonomie
marque/modèle ; à droite, `<n> ici` = effectif du périmètre affiché. Sur l'écran A les deux sont
égaux ; sur l'écran B le second est un sous-ensemble du premier. Justification : sans ce double
compteur, l'utilisateur ne peut pas savoir si un effectif faible vient de ses filtres ou de la
rareté du modèle.

`EX-SCR-47` — **Pied de page, hauteur fixe 32 px**, non collant. Contient obligatoirement la
mention `Source : AutoScout24 — agrégat non affilié`, la date du snapshot, le lien
`Diagnostic` et le lien `Mentions`. Justification de l'obligation : le positionnement
juridique de `00-CONTEXT.md` exige que la nature d'agrégat non affilié soit visible sur chaque
écran, pas seulement sur une page dédiée.

`EX-SCR-48` — En régime `compact`, l'en-tête tombe à 44 px, les trois onglets sont remplacés
par un bouton de menu de 44 × 44 px ouvrant un tiroir latéral plein écran, et le jeton de
snapshot ne conserve que son icône.

### 3.3 Navigation

`EX-SCR-49` — `/` redirige en `301` vers `/marche` sans paramètre.

`EX-SCR-50` — **Tout état d'écran est intégralement encodé dans l'URL** : filtres actifs, tri,
repliements de groupes de filtres, bascules d'échelle logarithmique, et sélection de brossage
sur un graphe. Critère de recette : copier l'URL, l'ouvrir dans une fenêtre vierge, et obtenir
un écran pixel-identique, y compris la sélection de brossage. Le détail du nommage des
paramètres appartient à `req-behaviour`.

`EX-SCR-51` — **Le passage A → B conserve tous les filtres** et ajoute uniquement le couple
marque/modèle. Le passage B → A par le fil d'Ariane conserve tous les filtres et retire
uniquement le couple marque/modèle. Aucun filtre n'est ajouté, supprimé ni réinitialisé
implicitement lors d'une navigation. Critère de recette : la chaîne de requête est
identique à un préfixe près.

`EX-SCR-52` — **Profondeur d'historique.** Chaque navigation d'écran empile une entrée
d'historique ; chaque changement de filtre **remplace** l'entrée courante après un délai de
stabilité de 600 ms, afin qu'un retour arrière ne défile pas frappe par frappe. Ce point est
partagé avec `req-behaviour` et doit être arbitré une seule fois.

`EX-SCR-53` — **Panneau `Diagnostic des données`**, ouvert depuis le pied de page, largeur
420 px, superposé à droite. Contenu : liste des champs attendus par les écrans, avec pour
chacun son état (`présent` / `absent de la source` / `présent mais vide sur <k> annonces`),
la liste des blocs supprimés par `ET-CHAMP-ABSENT-SOURCE`, le taux de couverture du snapshot
et le journal des 10 dernières erreurs de `DataProvider`. Justification : sans cet écran,
l'absence d'un graphe est indistinguable d'un bug.

`EX-SCR-54` — **Aucune fenêtre modale bloquante hors du sélecteur `G` et des confirmations de
suppression.** Toute information complémentaire passe par une infobulle ou un panneau latéral
refermable par la touche `Échap` et par un clic hors du panneau.

---

## 4. Composant partagé `C1` — Bandeau de filtres

C'est le composant le plus lourd de l'application : **101 filtres relevés**, dont il est
impossible d'afficher plus d'une dizaine simultanément. Cette section le spécifie une fois ;
les écrans A, B, C et D l'incluent à l'identique.

### 4.1 Anatomie

**Régime `large`, bandeau replié (hauteur 96 px) :**

```
+------------------------------------------------------------------------------------------+
| [Marque / Modele        v] [Prix         v] [Km          v] [1re immat.  v] [Carburant v]|
| [Carrosserie   v] [Boite  v] [Vendeur v] [Pays  v]   [ Rechercher un filtre... ]  [+ 92] |
+------------------------------------------------------------------------------------------+
| Actifs (5):  (Opel x) (Corsa x) (<= 20 000 EUR x) (Essence, Diesel x) (Belgique x)       |
|              [ Tout effacer ]        [ Enregistrer la recherche ]      1 281 offres      |
+------------------------------------------------------------------------------------------+
```

**Régime `large`, bandeau déplié (hauteur maximale 320 px, zone interne défilante) :**

```
+------------------------------------------------------------------------------------------+
| (ligne des 9 filtres primaires, identique ci-dessus)                        [ - Replier ]|
+------------------------------------------------------------------------------------------+
| [ Rechercher un filtre...                                    ]   14 filtres correspondent|
+-------------------+----------------------------------------------------------------------+
| GROUPES           | > Prix et valeur ............................. 4 actifs             |
|  Vehicule       2 | > Kilometrage ................................ 1 actif              |
|  Prix et valeur 4 | v Motorisation ............................... 2 actifs             |
|  Kilometrage    1 |     Puissance    [ 90 ] a [ 150 ]  ( ) kW  (o) ch                   |
|  Immat./annee   0 |     Cylindree    [    ] a [    ]  cm3                               |
|  Motorisation   2 |     Cylindres    [ ] 3  [ ] 4  [x] 6  [ ] 8  [ ] 10+   (i)          |
|  Carrosserie    0 |     Transmission [ ] 4x4 [ ] Avant [ ] Arriere         (i)          |
|  Ecologie       0 |     Boite        [x] Auto [ ] Manuelle [ ] Semi-auto   (T)          |
|  Equipements    0 |     Nouveaux conducteurs  [ ]                          (i)          |
|  Etat/historique1 | > Carrosserie et habitacle ................... 0 actif               |
|  Vendeur        1 | > Ecologie et electrique ..................... 0 actif               |
|  Geographie     1 | > Equipements (136) .......................... 0 actif               |
|  Financement    0 | > Etat et historique ......................... 1 actif               |
|  Fraicheur      0 | > Vendeur .................................... 1 actif               |
|                   | > Geographie ................................. 1 actif               |
|                   | > Financement et leasing (13) ................ 0 actif   (T)         |
|                   | > Fraicheur et achat en ligne ................ 0 actif   (T)         |
+-------------------+----------------------------------------------------------------------+
| Actifs (5): ... (identique)                                                              |
+------------------------------------------------------------------------------------------+
```

`EX-SCR-55` — Le bandeau comporte **exactement quatre zones**, dans cet ordre vertical :
(1) la **ligne primaire**, toujours visible ; (2) le **champ de recherche de filtre** ;
(3) le **panneau des groupes secondaires**, replié par défaut ; (4) la **ligne des filtres
actifs**, toujours visible dès qu'au moins un filtre est posé.

`EX-SCR-56` — Le bandeau est **collant** sous l'en-tête. Replié il occupe 96 px ; déplié il
occupe au maximum 320 px, sa zone (3) devenant défilante à l'intérieur. Il ne masque jamais
plus de 40 % de la hauteur du viewport. Sur l'écran B, cette persistance est une exigence
explicite du commanditaire : « sur la page de graphe, il est possible de mettre des filtres qui
s'appliquent directement sur toute la page ».

### 4.2 Classification des 101 filtres

`EX-SCR-57` — Chaque filtre du catalogue porte **exactement une** classe, qui détermine son
comportement d'exécution et son rendu :

| Classe | Définition | Comportement | Rendu |
|---|---|---|---|
| **R** — recalculable | le champ sous-jacent figure dans les 40 champs relevés en §2.3 de `FINDING-allowed-surface.md` | recalcul **local**, `ET-CHARGE-LOCAL`, ≤ 150 ms, aucun appel réseau | contrôle normal |
| **T** — transmis | aucun champ local ne porte l'information ; le filtre ne peut être appliqué que par le `DataProvider` | nouvel appel, `ET-CHARGE-MAJ`, débounce 400 ms | contrôle normal + jeton `T` en infobulle : `Filtre appliqué à la source — recharge les données` |
| **D** — désactivé documenté | filtre relevé mais **non activable** sur les marketplaces relevés | contrôle présent, `disabled`, non sérialisé dans l'URL | opacité 45 % + infobulle donnant le motif relevé |
| **X** — hors périmètre | filtre sans objet pour KYCAR | **absent du DOM** | listé en §4.7 avec son motif |

`EX-SCR-58` — La distinction R / T est **observable** : le jeton `T` doit être présent sur tous
les filtres de classe T et sur aucun filtre de classe R. Critère de recette : compter les
jetons `T` du DOM déplié et vérifier l'égalité avec le nombre de filtres de classe T du
tableau §4.7.

### 4.3 Filtres primaires — choix et justification

`EX-SCR-59` — Les filtres primaires sont **exactement neuf contrôles** couvrant douze
paramètres d'URL, plus le champ de recherche par mot-clé :

| # | Contrôle primaire | Paramètres | Classe |
|---|---|---|---|
| 1 | Marque / Modèle | `mmmv` | R |
| 2 | Prix | `pricefrom`, `priceto` | R |
| 3 | Kilométrage | `kmfrom`, `kmto` | R |
| 4 | 1ʳᵉ immatriculation | `fregfrom`, `fregto` | R |
| 5 | Carburant | `fuel` | R |
| 6 | Carrosserie | `body` | T (annonce) / R (modèle) |
| 7 | Boîte de vitesses | `gear` | T |
| 8 | Type de vendeur | `custtype` | R |
| 9 | Pays | `cy` | R |

`EX-SCR-60` — **Justification du choix, par quatre critères mesurables.** Un filtre est primaire
si et seulement s'il satisfait au moins trois des quatre critères suivants :

| Critère | Énoncé mesurable |
|---|---|
| **C1 — cité par le commanditaire** | le filtre apparaît nommément dans le parcours cible de `00-CONTEXT.md` (« budget 20 000 €, carrosserie coupé, Belgique, moins de 100 000 km ») ou est l'axe de navigation entre les deux écrans |
| **C2 — vérifiable à l'écran** | le champ sous-jacent figure en §2.3 de `FINDING-allowed-surface.md`, donc l'utilisateur peut contrôler l'effet du filtre sur les données affichées |
| **C3 — tient sur une ligne** | domaine ≤ 10 valeurs, ou 2 bornes numériques ; le contrôle replié n'excède pas 200 px de largeur |
| **C4 — pouvoir de segmentation** | le filtre découpe la population belge en au moins 3 classes représentant chacune ≥ 5 % des annonces |

Application :

| Contrôle | C1 | C2 | C3 | C4 | Score |
|---|---|---|---|---|---|
| Marque / Modèle | oui (axe A→B) | oui | oui (via `G`) | oui | 4 |
| Prix | oui (« budget 20 000 € ») | oui | oui | oui | 4 |
| Kilométrage | oui (« moins de 100 000 km ») | oui | oui | oui | 4 |
| 1ʳᵉ immatriculation | oui (axe du graphe tri-dimensionnel) | oui | oui | oui | 4 |
| Carburant | non | oui | oui (10 valeurs) | oui | 3 |
| Carrosserie | oui (« carrosserie coupé ») | non (annonce) | oui (9 valeurs) | oui | 3 |
| Boîte de vitesses | non | non | oui (3 valeurs) | oui | 2 + dérogation |
| Type de vendeur | non | oui | oui (2 valeurs) | oui | 3 |
| Pays | oui (« Belgique ») | oui | oui (9 valeurs) | oui | 4 |

`EX-SCR-61` — **Dérogation documentée pour `gear`.** La boîte de vitesses n'obtient que 2 points
(le champ est absent des 40 champs relevés en §2.3) mais est retenue en primaire car elle
partitionne le prix d'un même modèle de façon comparable à la carrosserie et constitue, avec le
carburant, le premier critère d'élimination d'un acheteur. Conséquence assumée et écrite :
`gear` est de classe T, il déclenche un rechargement, et **aucun graphe ne peut le représenter**
(cf. `EX-SCR-218`).

`EX-SCR-62` — **Filtres explicitement écartés du primaire, avec motif.** `eq` (136 valeurs,
échoue C3, et sémantique ET non prouvée — Z1) ; `pe_category` (échoue C1, et son usage comme
filtre primaire biaiserait la détection d'outliers que l'application doit produire elle-même) ;
`offer` (échoue C2 : le recouvrement `offer` / `ustate` n'est pas établi — Z4) ; `zip`+`zipr`
(échoue C2 sous contrainte RGPD : le code postal est tronqué à `10xx`, un rayon de 10 km n'est
donc pas restituable localement) ; `emclass` (échoue C4 en Belgique où Euro 6 domine, et
sémantique de borne non prouvée — Z2).

### 4.4 Contrôle par type de filtre

`EX-SCR-63` — **Énumération simple (1 valeur parmi n), n ≤ 4** → groupe de boutons radio
segmentés sur une ligne, la valeur par défaut présélectionnée et marquée `(défaut)`.
Concerne : `custtype`, `powertype`, `desc`.

`EX-SCR-64` — **Énumération simple, 5 ≤ n ≤ 12** → liste déroulante native `<select>`
comportant en première position l'option `Indifférent` qui **retire** le filtre.
Concerne : `emclass`, `ensticker`, `bot`, `prevownersid`, `zipr`, `adage`, `ustate`,
`ocs_listing`, `lstagr`, `sort`.

`EX-SCR-65` — **Énumération multi-valeurs, n ≤ 14** → liste de cases à cocher, disposée en
2 colonnes si `n > 6`, chaque libellé suivi de l'effectif courant entre parenthèses lorsque le
filtre est de classe R : `Essence (412)`. Sémantique **OU** affichée en tête du groupe :
`Au moins une de ces valeurs`. Concerne : `offer`, `fuel`, `body`, `gear`, `dtrain`,
`cylinders`, `bcol`, `icol`, `ptype`, `uph`, `cy`, `pe_category`, `sealor`.

`EX-SCR-66` — **Énumération multi-valeurs, n > 14** → panneau dédié avec champ de recherche
interne, liste virtualisée, effectif de sélection en tête (`3 équipements sélectionnés`) et
bouton `Tout décocher`. Concerne uniquement `eq` (136 valeurs). Le panneau affiche en tête
l'avertissement relevé : `Sémantique ET présumée, non prouvée (REF-filters Z1) — un cumul
d'équipements peut donner un résultat inattendu`.

`EX-SCR-67` — **Intervalle numérique (couple `<x>from` / `<x>to`)** → un seul contrôle
présentant deux champs de saisie numériques côte à côte séparés par le mot `à`, chacun doublé
d'une liste de paliers suggérés issue de `REF-filters.md` (par exemple pour `kmfrom`/`kmto` :
`2500, 5000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 125000,
150000, 175000, 200000`). **La saisie libre est acceptée** : les paliers sont des suggestions,
conformément au relevé. Un histogramme miniature de 32 px de haut est affiché au-dessus du
couple pour les filtres de classe R, montrant la distribution courante et la zone sélectionnée
en surbrillance. Concerne les 24 couples d'intervalle du catalogue retenus.

`EX-SCR-68` — **Validation d'intervalle.** Si `from > to`, les deux champs passent en bordure
rouge, le message `La borne basse dépasse la borne haute` s'affiche sous le contrôle, et le
filtre **n'est pas appliqué** ; l'ancienne valeur reste en vigueur. Aucune permutation
automatique des bornes : elle masquerait une faute de frappe. Si `from` ou `to` sort du domaine
relevé (par exemple une année < 1900 ou > 2027 pour `modelyearfrom`), la valeur est ramenée à
la borne du domaine et un message `Ramené à <valeur>` s'affiche pendant 4 s.

`EX-SCR-69` — **Booléen** → interrupteur à deux états `Non filtré` / `Actif`, jamais une case
à cocher tri-état. Un booléen faux **n'est pas émis** dans l'URL, conformément à la règle
d'omission des défauts relevée dans `REF-filters.md`. Concerne : `vatded`, `superdeal`,
`hasleasing`, `lstrinbo`, `lsenbo`, `lsavno`, `efeg`, `newdriver`, `crossborder`, `ot_osc`,
`dlv_tail`.

`EX-SCR-70` — **Géographique (`zip`, `zipr`, `crossborder`)** → contrôle composite unique
libellé `Localisation` : un champ texte de code postal ou de commune avec autocomplétion,
suivi d'une liste déroulante de rayon aux valeurs relevées
(`10, 20, 50, 100, 150, 200, 250, 300, 400` km) et d'un interrupteur
`Inclure au-delà de la frontière`. Le rayon et l'interrupteur sont **désactivés tant que le
champ de localisation est vide**, avec l'infobulle `Renseignez d'abord une localisation`.
Note affichée sous le contrôle : `Le code postal exact n'est pas conservé par KYCAR ; la
distance est calculée à la requête puis oubliée.`

`EX-SCR-71` — **Texte libre (`kwd`, `version0`, `cid`, `region`, `dlv_max`)** → champ texte
avec compteur de caractères. `kwd` est le seul exposé dans la ligne primaire, sous forme d'un
champ de 240 px placé dans la zone (2) et distinct du champ `Rechercher un filtre` — les deux
champs portent des libellés flottants différents (`Mot-clé dans l'annonce` et
`Rechercher un filtre`) afin de ne jamais être confondus. `cid` est de classe X (R3).

`EX-SCR-72` — **Structuré (`mmmv`)** → le contrôle primaire n'est pas une liste déroulante mais
un **bouton ouvrant le sélecteur `G`** (§7.4), qui seul peut présenter 295 marques et
4 955 modèles. Le bouton affiche : `Toutes les marques` si vide, `<Marque>` si une marque sans
modèle, `<Marque> <Modèle>` si un couple, et `<n> sélections` au-delà de 1. Le format de
sérialisation est celui relevé : `makeId|modelId|modelLineId|version`, blocs séparés par des
virgules, virgule littérale dans `version` échappée en `,,` puis encodée `%2C`.

`EX-SCR-73` — **Dépendances entre filtres.** Tout filtre dont `REF-filters.md` déclare une
dépendance est **désactivé** tant que son parent n'est pas posé, avec une infobulle nommant
le parent : `Nécessite « Offre de leasing disponible »`. Dépendances à implémenter :
`zipr`/`lat`/`lon`/`crossborder` ← `zip` ; `leasingratefrom`…`lstagr` (9 filtres) ←
`hasleasing` ; `bot`/`erfrom`/`erto` ← `fuel` contenant au moins une valeur électrique
(`2`, `3`, `E`) ; `sealor`/`version0` ← `mmmv` avec au moins une marque ; `powerfrom`/`powerto`
← `powertype` (toujours posé, donc jamais désactivé) ; `desc` ← `sort`.
Lorsqu'un parent est retiré, ses enfants sont retirés **avec une notification explicite** :
`3 filtres de leasing retirés` pendant 5 s, avec un bouton `Annuler`.

`EX-SCR-74` — **Filtres de classe D.** Trois filtres sont présents et désactivés, avec le motif
relevé en infobulle :
- `damaged_listing` — `Rejeté par le marketplace belge (newAccidentFilter = false)` ; le filtre
  actif équivalent est `ustate`, mis en avant juste au-dessus.
- `region` — `Domaine de valeurs non relevé et filtre désactivé à la source (REF-filters Z3)`.
- `dlv_max` — `Domaine de valeurs non relevé`.
Justification de leur présence malgré leur inutilité : l'exigence du commanditaire est « tous
les filtres qui sont actuellement possibles sur AutoScout » ; les retirer silencieusement
donnerait l'illusion d'un catalogue complet de 98 filtres.

### 4.5 Filtres actifs

`EX-SCR-75` — **Ligne des filtres actifs**, zone (4), visible dès qu'un filtre est posé,
hauteur 40 px extensible à 80 px puis défilante horizontalement. Chaque filtre actif est un
jeton de 28 px de haut portant : le libellé abrégé de la valeur, et une croix de retrait de
20 × 20 px. Format des jetons :
- énumération 1 valeur → `Essence ×`
- énumération 2 valeurs → `Essence, Diesel ×`
- énumération ≥ 3 valeurs → `Carburant : 4 valeurs ×`, l'énumération complète en infobulle
- intervalle à deux bornes → `18 000 – 25 000 € ×`
- intervalle à une borne → `≤ 100 000 km ×` ou `≥ 2015 ×`
- booléen → `TVA déductible ×`
- taxonomie → un jeton par niveau, `Opel ×` et `Corsa ×`, indépendamment retirables

`EX-SCR-76` — **Retrait individuel.** Un clic sur la croix retire **cette seule valeur** pour
une énumération multi-valeurs (le jeton `Essence, Diesel` se scinde en deux jetons dès qu'il
dépasse 2 valeurs, précisément pour rendre le retrait unitaire possible), et **les deux bornes**
pour un intervalle. Retirer un jeton de taxonomie de niveau supérieur retire aussi ses
descendants, avec la notification d'`EX-SCR-73`.

`EX-SCR-77` — **`Tout effacer`.** Bouton textuel qui remet tous les filtres à leur valeur par
défaut relevée — pas à « vide » : `atype` reste `C`, `ustate` reste `N,U`, `powertype` reste
`kw`, `pricetype` reste `public`. Le bouton est désactivé quand aucun filtre n'est actif.
Aucune confirmation : l'action est réversible par le retour arrière du navigateur.

`EX-SCR-78` — **Compteur de résultats** à l'extrémité droite de la zone (4), au format
`EX-SCR-10`, mis à jour à chaque changement. Pendant `ET-CHARGE-MAJ`, il affiche la valeur
précédente atténuée suivie de `…`, jamais `0`.

### 4.6 Recherche de filtre

`EX-SCR-79` — **Champ `Rechercher un filtre`**, zone (2), largeur 320 px en `large`. Il filtre
la liste des groupes et des contrôles sur trois index simultanés : le libellé français, le
libellé anglais relevé, et le nom du paramètre d'URL (`kmto`, `bcol`). Justification de
l'index sur le paramètre d'URL : il permet à un utilisateur avancé, ou à un test automatisé,
d'atteindre un filtre sans connaître son libellé.

`EX-SCR-80` — La recherche déplie automatiquement les groupes contenant une correspondance,
met en surbrillance jaune la sous-chaîne trouvée, et affiche `<n> filtres correspondent`.
Zéro correspondance affiche `Aucun filtre ne correspond à « <saisie> »` plus les 3 filtres les
plus proches par distance de Levenshtein ≤ 3.

`EX-SCR-81` — Le champ est atteignable au clavier par `/` depuis n'importe où dans
l'application, sauf lorsque le focus est déjà dans un champ de saisie. `Échap` le vide et
referme les groupes ouverts par la recherche.

### 4.7 Affectation des 101 filtres

`EX-SCR-82` — Le tableau suivant est normatif : chaque filtre du catalogue `REF-filters.md`
reçoit un groupe, une classe et un rang (primaire / secondaire). Aucun filtre n'est absent de
ce tableau. Il satisfait le critère S4 de la phase 2.1.

| # | Param | Groupe KYCAR | Rang | Classe | Champ local ou motif |
|---|---|---|---|---|---|
| 1 | `atype` | — | — | **X** | fixé à `C` ; KYCAR ne traite que les voitures |
| 2 | `mmmv` | Véhicule | **primaire** | R | `make.formatted`, `model.formatted` |
| 3 | `cat` | — | — | **X** | `newTaxonomyAvailable = false` : branche inactive à la source (Z6) |
| 4 | `mcat` | — | — | **X** | idem `cat` |
| 5 | `version0` | Véhicule | secondaire | T | dépend de `mmmv` ; `modelVersionInput` est du texte libre non normalisé |
| 6 | `offer` | État et historique | secondaire | T | recouvrement avec `usageState` non établi (Z4) |
| 7 | `kwd` | (zone 2, dédiée) | **primaire** | T | recherche titre côté source ; aucun titre d'annonce dans les 40 champs |
| 8 | `pricefrom` | Prix et valeur | **primaire** | R | `prices.public.amountInEUR.raw` |
| 9 | `priceto` | Prix et valeur | **primaire** | R | idem |
| 10 | `pricetype` | — | — | **X** | usage des codes `private`/`dealer` non prouvé (Z6) ; KYCAR fixe `public` |
| 11 | `vatded` | Prix et valeur | secondaire | R | `prices.public.taxDeductible` |
| 12 | `superdeal` | Prix et valeur | secondaire | R | `superDeal` |
| 13 | `pe_category` | Prix et valeur | secondaire | R | `prices.public.evaluation.category` |
| 14 | `financeratefrom` | Financement et leasing | secondaire | T | aucun champ de mensualité |
| 15 | `financerateto` | Financement et leasing | secondaire | T | idem |
| 16 | `hasleasing` | Financement et leasing | secondaire | T | idem |
| 17 | `leasingratefrom` | Financement et leasing | secondaire | T | idem, dép. `hasleasing` |
| 18 | `leasingrateto` | Financement et leasing | secondaire | T | idem |
| 19 | `lsdufrom` | Financement et leasing | secondaire | T | idem |
| 20 | `lsduto` | Financement et leasing | secondaire | T | idem |
| 21 | `lsyeinmifrom` | Financement et leasing | secondaire | T | idem |
| 22 | `lstrinbo` | Financement et leasing | secondaire | T | idem |
| 23 | `lsenbo` | Financement et leasing | secondaire | T | idem |
| 24 | `lsavno` | Financement et leasing | secondaire | T | idem |
| 25 | `lstagr` | Financement et leasing | secondaire | T | domaine RELEVÉ-PARTIEL, avertissement affiché |
| 26 | `efeg` | Financement et leasing | secondaire | T | aucun champ de prime |
| 27 | `tradeIn` | — | — | **X** | filtre transactionnel du parcours de vente AS24 ; sans effet sur la population analysée |
| 28 | `kmfrom` | Kilométrage | **primaire** | R | `condition.mileageInKm.raw` |
| 29 | `kmto` | Kilométrage | **primaire** | R | idem |
| 30 | `fregfrom` | Immatriculation et année | **primaire** | R | `condition.firstRegistrationDate` |
| 31 | `fregto` | Immatriculation et année | **primaire** | R | idem |
| 32 | `modelyearfrom` | Immatriculation et année | secondaire | R | `modelYear` |
| 33 | `modelyearto` | Immatriculation et année | secondaire | R | idem |
| 34 | `fuel` | Motorisation | **primaire** | R | `fuels.fuelCategory.raw` — voir PIÈGE 1 (`EX-SCR-84`) |
| 35 | `powertype` | Motorisation | secondaire | R | commutateur d'unité `engine.power.kw` / `.hp` |
| 36 | `powerfrom` | Motorisation | secondaire | R | `engine.power.*.raw` |
| 37 | `powerto` | Motorisation | secondaire | R | idem |
| 38 | `ccmfrom` | Motorisation | secondaire | T | aucun champ de cylindrée |
| 39 | `ccmto` | Motorisation | secondaire | T | idem |
| 40 | `cylinders` | Motorisation | secondaire | T | aucun champ ; masqué dans l'UI AS24 mais accepté (Z7) |
| 41 | `dtrain` | Motorisation | secondaire | T | aucun champ ; masqué dans l'UI AS24 (Z7) |
| 42 | `gear` | Motorisation | **primaire** | T | **aucun champ de boîte dans les 40 relevés** — dérogation `EX-SCR-61` |
| 43 | `newdriver` | Motorisation | secondaire | T | aucun champ |
| 44 | `body` | Carrosserie et habitacle | **primaire** | T / R | `topModels.bodyTypes` au niveau modèle ; rien au niveau annonce |
| 45 | `doorfrom` | Carrosserie et habitacle | secondaire | T | aucun champ |
| 46 | `doorto` | Carrosserie et habitacle | secondaire | T | idem |
| 47 | `seatsfrom` | Carrosserie et habitacle | secondaire | T | idem |
| 48 | `seatsto` | Carrosserie et habitacle | secondaire | T | idem |
| 49 | `bcol` | Carrosserie et habitacle | secondaire | T | idem |
| 50 | `ptype` | Carrosserie et habitacle | secondaire | T | idem |
| 51 | `icol` | Carrosserie et habitacle | secondaire | T | idem |
| 52 | `uph` | Carrosserie et habitacle | secondaire | T | idem |
| 53 | `emclass` | Écologie et électrique | secondaire | T | aucun champ ; sémantique de borne non prouvée (Z2) |
| 54 | `ensticker` | Écologie et électrique | secondaire | T | pertinence DE ; code `1` non émis |
| 55 | `bot` | Écologie et électrique | secondaire | T | aucun champ, dép. `fuel` électrique |
| 56 | `erfrom` | Écologie et électrique | secondaire | T | aucun champ d'autonomie |
| 57 | `erto` | Écologie et électrique | secondaire | T | idem |
| 58 | `eq` | Équipements | secondaire | T | aucun champ d'équipement ; sémantique ET présumée (Z1) |
| 59 | `ustate` | État et historique | secondaire | T | `usageState` présent mais correspondance non établie (Z4) |
| 60 | `damaged_listing` | État et historique | secondaire | **D** | rejeté par BE et `.com` |
| 61 | `prevownersid` | État et historique | secondaire | R | `condition.numberOfPreviousOwnersExtended.raw` ; sémantique « au plus » présumée (Z2) |
| 62 | `sealor` | État et historique | secondaire | T | aucun champ de label, dép. `mmmv` |
| 63 | `custtype` | Vendeur | **primaire** | R | `seller.type` |
| 64 | `cid` | — | — | **X** | **règle R3** : identifiant de vendeur, interdit dans le schéma |
| 65 | `cy` | Géographie | **primaire** | R | `location.countryCode` |
| 66 | `zip` | Géographie | secondaire | R (dégradé) | `location.zip` tronqué à `NNxx` : filtrage local à la précision de 2 chiffres seulement |
| 67 | `zipr` | Géographie | secondaire | T | exige la géolocalisation serveur, dép. `zip` |
| 68 | `lat` | — | — | **X** | dérivé du géocodage serveur, jamais exposé à l'utilisateur |
| 69 | `lon` | — | — | **X** | idem |
| 70 | `region` | Géographie | secondaire | **D** | domaine inconnu, désactivé à la source (Z3) |
| 71 | `crossborder` | Géographie | secondaire | T | dép. `zip` + `zipr` |
| 72 | `ot_osc` | Fraîcheur et achat en ligne | secondaire | T | aucun champ |
| 73 | `ocs_listing` | Fraîcheur et achat en ligne | secondaire | T | aucun champ |
| 74 | `dlv_max` | Fraîcheur et achat en ligne | secondaire | **D** | domaine non relevé |
| 75 | `dlv_tail` | Fraîcheur et achat en ligne | secondaire | T | aucun champ |
| 76 | `adage` | Fraîcheur et achat en ligne | secondaire | T | **aucune date de publication dans les 40 champs** ; seul `publication.isNew` existe |
| 77 | `sort` | (contrôle de tri, écrans A et D) | — | R | tri local sur les champs disponibles ; valeurs `financerate` et `leasing_rate` retirées (désactivées sur BE) |
| 78 | `desc` | (contrôle de tri) | — | R | dép. `sort` |
| 79 | `page` | — | — | **X** | pagination interne au `DataProvider`, jamais exposée |
| 80 | `size` | — | — | **X** | idem ; valeur observée `20` |
| 81–96 | `bedsfrom` … `grossweightto` | — | — | **X** (16 filtres) | propres à `atype ≠ C` (caravanes, utilitaires, engins) — hors périmètre voiture |
| 97 | `show_nfm` | — | — | **X** | paramètre technique injecté par le serveur |
| 98 | `search_id` | — | — | **X** | idem |
| 99 | `query_id` | — | — | **X** | idem |
| 100 | `tier_rotation` | — | — | **X** | idem |
| 101 | `mmm` | — | — | **X** | sérialisation legacy remplacée par `mmmv` |

`EX-SCR-83` — **Bilan de l'affectation** : 9 primaires · 55 secondaires · 3 désactivés
documentés (`damaged_listing`, `region`, `dlv_max`) · 2 contrôles de tri (`sort`, `desc`) ·
32 hors périmètre avec motif. Total 101. Critère de recette : la somme est vérifiée par un test
qui lit `data/reference/filters.json` et la table d'affectation, et échoue si un `param` du
premier n'a pas d'entrée dans la seconde.

`EX-SCR-84` — **PIÈGE 1 — collision de codes sur `fuel`.** Le contrôle `Carburant` utilise
exclusivement le **vocabulaire de recherche** (`2` = Électrique/Essence, `3` = Électrique/Diesel,
`B` = Essence, `D` = Diesel, `E` = Électrique…), conformément à
`REF-vocabulary-reconciliation.md`. Les codes `2` et `3` du vocabulaire de création ont une
signification incompatible et ne doivent **jamais** alimenter ce contrôle. Le champ
`fuels.primary.source` (libellés de création, du type `Super 95 / Essence 91 / …`) est
affichable en infobulle d'annonce mais n'alimente ni le filtre ni aucun agrégat.
Critère de recette : un test échoue si une valeur du contrôle `Carburant` provient d'un
fichier de `data/reference/references/`.

`EX-SCR-85` — **Sémantiques non prouvées, signalées à l'utilisateur.** Les quatre filtres dont
`REF-filters.md` déclare la sémantique présumée (`eq` → ET présumé ; `emclass` → « au moins »
présumé ; `prevownersid` → « au plus » présumé ; `ensticker` → « min. » présumé) portent une
icône `(?)` dont l'infobulle contient la mention `Sémantique présumée, non vérifiée à la
source`. Aucune de ces sémantiques n'est utilisée pour un calcul d'agrégat local.

### 4.8 Comportement, retours visuels et désactivations

`EX-SCR-86` — **Application immédiate.** Tout changement de filtre s'applique sans bouton
`Rechercher`. Aucune validation différée. Pour les champs de saisie textuelle et numérique, le
déclenchement a lieu au `blur`, à `Entrée`, ou après 400 ms d'inactivité de frappe, le premier
des trois. Pour les cases, radios et interrupteurs, au `change`.

`EX-SCR-87` — **Retour visuel de chaque contrôle.** Au survol : fond à 4 % de la couleur
d'accent. Au focus clavier : contour de 2 px de la couleur d'accent, décalé de 2 px, visible
sur fond clair comme sur fond sombre. Actif : fond de la couleur d'accent, texte inversé, et un
jeton correspondant apparaît **immédiatement** dans la zone (4), avant même la fin du recalcul.

`EX-SCR-88` — **Conditions de désactivation, exhaustives.** Un contrôle de filtre est désactivé
si et seulement si : (a) sa dépendance parente n'est pas posée (`EX-SCR-73`) ; (b) il est de
classe D (`EX-SCR-74`) ; (c) il est de classe T et l'application est hors ligne
(`EX-SCR-37`) ; (d) son domaine dépendant est vide — cas du sélecteur de modèle avant qu'une
marque soit choisie, et de `sealor` dont le domaine se restreint aux labels des marques
sélectionnées. Dans les quatre cas, l'infobulle donne le motif en une phrase. Aucun contrôle
n'est jamais désactivé sans infobulle.

`EX-SCR-89` — **Aucune option n'est masquée parce qu'elle donne zéro résultat.** Une valeur
d'énumération à effectif nul est affichée avec son effectif `(0)`, en gris, et reste cliquable :
l'utilisateur apprend ainsi que la valeur existe mais est absente du marché filtré. Seul le
tri les envoie en fin de liste. Justification : masquer les valeurs à zéro rendrait le
catalogue de filtres non auditable contre `REF-filters.md`.

`EX-SCR-90` — **Effectifs par option (`facettes`).** Les effectifs entre parenthèses ne sont
affichés que pour les filtres de **classe R**, et ils sont calculés « toutes contraintes
appliquées sauf le filtre courant » (facette leave-one-out). Pour les filtres de classe T,
aucune parenthèse n'est affichée — et non une parenthèse vide.

`EX-SCR-91` — **Compteur `+ 92`** sur le bouton de dépliement : il affiche le nombre de filtres
secondaires **non affichés** dans la ligne primaire, et non le total du catalogue. Sa valeur est
calculée, pas écrite en dur. Au survol, il devient `Afficher les 92 autres filtres`.

`EX-SCR-92` — **Repliement des groupes.** Chaque groupe secondaire est replié par défaut, sauf
ceux qui contiennent au moins un filtre actif, qui sont dépliés au chargement. L'état de
repliement de chaque groupe est encodé dans l'URL. Le titre de groupe replié affiche toujours
`<n> actifs` ou rien si zéro.

`EX-SCR-93` — **Ordre des groupes**, normatif, du plus utilisé au moins utilisé selon les
parcours cibles : Véhicule · Prix et valeur · Kilométrage · Immatriculation et année ·
Motorisation · Carrosserie et habitacle · Écologie et électrique · Équipements ·
État et historique · Vendeur · Géographie · Financement et leasing ·
Fraîcheur et achat en ligne. L'ordre ne dépend pas des filtres actifs : il est stable, pour que
la mémoire de position de l'utilisateur reste valide.

`EX-SCR-94` — **`Enregistrer la recherche`.** Bouton de la zone (4) ouvrant un champ de nom
prérempli par une description générée depuis les filtres actifs
(`Opel Corsa · ≤ 20 000 € · Belgique`), limité à 60 caractères. Le CRUD associé appartient à
`req-behaviour` ; l'écran E (§7.3) en est la vue.

`EX-SCR-95` — **Deux commutateurs d'assainissement, propres à KYCAR** et absents du catalogue
AutoScout24, placés en fin du groupe `Prix et valeur` sous le titre
`Assainissement KYCAR (hors AutoScout24)` : `Écarter les prix < 100 €` (défaut : inactif) et
`Écarter les annonces à prix sur demande` (défaut : actif, car un prix absent ne peut entrer
dans aucune distribution). Ils sont visuellement séparés par un filet et une mention
`Ces deux réglages sont propres à KYCAR` afin qu'on ne les confonge jamais avec un filtre
relevé.

`EX-SCR-96` — **Régime `intermédiaire` (768–1279 px).** La ligne primaire passe sur deux
lignes de contrôles (5 puis 4), hauteur du bandeau replié 132 px. Le champ
`Rechercher un filtre` perd son libellé et conserve son icône. Le panneau des groupes perd sa
colonne de gauche : les groupes deviennent un accordéon pleine largeur.

`EX-SCR-97` — **Régime `compact` (< 768 px).** Le bandeau se réduit à une **barre unique de
56 px** portant : un bouton `Filtres (5)` de 44 px de haut, le compteur de résultats, et un
défilement horizontal des jetons de filtres actifs. Le bouton ouvre une **feuille plein écran**
comportant l'intégralité des groupes en accordéon, un pied collant avec
`Réinitialiser` et `Voir les 1 281 offres`, et une croix de fermeture. Dans cette feuille, et
dans ce seul cas, l'application est **différée** : les filtres ne s'appliquent qu'à la
validation, afin d'éviter des rechargements successifs sur réseau mobile. Ce comportement est
signalé par le libellé du bouton de validation, qui affiche l'effectif projeté.

`EX-SCR-98` — En régime `compact`, l'histogramme miniature des contrôles d'intervalle
(`EX-SCR-67`) est supprimé, et la liste de paliers devient une liste déroulante native.

`EX-SCR-99` — **Accessibilité du bandeau.** Chaque groupe est un `<fieldset>` avec `<legend>`.
La zone (4) est une région `aria-live="polite"` annonçant `<n> filtres actifs, <n> offres`.
Le parcours au clavier suit l'ordre visuel ; `Tab` ne pénètre jamais dans un groupe replié.
Contraste minimal 4,5:1 pour tout texte, 3:1 pour les bordures de contrôle.

`EX-SCR-100` — **Budget de performance du bandeau.** Ouverture du panneau déplié en ≤ 100 ms
sur un appareil équivalent à un Moto G4 ; frappe dans `Rechercher un filtre` sans image perdue
au-delà de 16 ms par frappe, la liste des 101 filtres étant filtrée sur un index préconstruit
et non par parcours du DOM.

`EX-SCR-101` — **Le bandeau ne se réinitialise jamais tout seul.** Ni sur navigation, ni sur
erreur, ni sur changement de snapshot. Si un filtre devient invalide après un changement de
snapshot (par exemple un `modelId` disparu), il est conservé, marqué en ambre avec l'infobulle
`Ce modèle est absent du snapshot du <date>` et compté séparément :
`1 filtre sans effet`.

`EX-SCR-102` — **Nombre maximal de filtres actifs simultanés : aucun.** Les 66 paramètres
simultanés éprouvés lors du relevé de `REF-filters.md` constituent la borne de test :
un test automatisé pose 60 filtres et vérifie que la zone (4) reste utilisable (défilement,
retrait unitaire fonctionnel) et que l'URL produite est acceptée au rechargement.

`EX-SCR-103` — **Le bandeau est identique sur les écrans A, B, C et D** : même composant, même
état, même sérialisation. Aucune variante par écran, à l'exception du contrôle
`Marque / Modèle`, qui sur l'écran B affiche le couple courant et, au clic, ouvre le sélecteur
`G` positionné sur ce couple.
