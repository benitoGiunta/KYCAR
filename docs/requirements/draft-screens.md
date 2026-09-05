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
| 7 | Écrans additionnels proposés (C, D, E, G) — marqués **AJOUT** | `EX-SCR-193` → `EX-SCR-216` |
| 8 | Champs manquants, affichages non réalisables, alternatives | `EX-SCR-217` → `EX-SCR-224` |
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

`EX-SCR-83` — **Bilan de l'affectation, arithmétiquement clos** :
**13** paramètres primaires (regroupés en 9 contrôles, cf. `EX-SCR-59`, `kwd` compris) ·
**52** secondaires · **3** désactivés documentés (`damaged_listing`, `region`, `dlv_max`) ·
**2** contrôles de tri (`sort`, `desc`) · **31** hors périmètre avec motif (dont les 16 filtres
propres à `atype ≠ C`). Somme : 13 + 52 + 3 + 2 + 31 = **101**.
Critère de recette : un test lit `data/reference/filters.json` (101 entrées) et la table
`EX-SCR-82`, échoue si un `param` du premier n'a pas exactement une entrée dans la seconde, et
vérifie les cinq cardinaux ci-dessus.

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

---

## 5. Écran A — Survol du marché

### 5.1 Identité

`EX-SCR-104` — **Nom** : « Survol du marché ». **Route** : `/marche?<filtres>`.
**Rôle** : réalise le parcours cible 1 de `00-CONTEXT.md` — l'utilisateur pose des contraintes
de marché et découvre *ce que le marché propose*, sans avoir nommé de marque.
**Condition d'affichage** : le filtre `mmmv` ne contient **aucun `modelId`**. Si `mmmv` contient
exactement un couple marque + modèle, la route redirige vers l'écran B ; si `mmmv` contient une
ou plusieurs marques sans modèle, l'écran A reste affiché et la liste des cartes est restreinte
à ces marques.

### 5.2 Structure

```
+==========================================================================================+
| S0 en-tete + bandeaux + C1 bandeau de filtres + fil d'Ariane                             |
+==========================================================================================+
| C3  Statistiques calculees sur 3 840 annonces observees sur 120 779 annoncees - 3 %  (i) |
+==========================================================================================+
| 42 marques - 318 modeles - 120 779 offres     Trier par [ Nombre d'offres v ] [ ^ ]      |  44 px
|                                               [ ] Masquer les modeles a moins de 3 offres|
+==========================================================================================+
|  +-----------------------------------+  +-----------------------------------+            |
|  | VOLKSWAGEN                 12 480 |  | BMW                        9 105  |  <- en-tete|
|  | 34 modeles - mediane 18 900 EUR   |  | 28 modeles - mediane 24 500 EUR   |  <- resume |
|  | 4 200 - 89 000 EUR | 2004-2026    |  | 3 900 - 168 000 EUR | 2003-2026   |            |
|  +-----------------------------------+  +-----------------------------------+            |
|  | Golf                      3 120 > |  | Serie 3                   2 004 > | <- zone-  |
|  |  8 900 - 32 500 EUR   2010 - 2025 |  |  9 500 - 64 000 EUR  2009 - 2025  |    modele |
|  |  12 000 - 240 000 km  med. 17 400 |  |  15 000 - 260 000 km med. 22 900  |            |
|  |  [#####____________]              |  |  [####_____________]              |            |
|  +-----------------------------------+  +-----------------------------------+            |
|  | Polo                      2 410 > |  | Serie 1                   1 702 > |            |
|  |  ...                              |  |  ...                              |            |
|  +-----------------------------------+  +-----------------------------------+            |
|  | (4 autres zones-modeles)          |  | (4 autres zones-modeles)          |            |
|  +-----------------------------------+  +-----------------------------------+            |
|  | + Afficher les 28 autres modeles  |  | + Afficher les 22 autres modeles  |  <- pied   |
|  +-----------------------------------+  +-----------------------------------+            |
|                                                                                          |
|  (grille de 3 colonnes en regime large ; 2 en intermediaire ; 1 en compact)              |
+==========================================================================================+
| 20 marques sur 295            [ Charger 12 marques de plus ]                             |
+==========================================================================================+
| S0 pied de page                                                                          |
+==========================================================================================+
```

`EX-SCR-105` — L'écran A comporte **exactement trois blocs** dans la zone principale, dans cet
ordre : (1) la **barre de synthèse et de tri**, hauteur fixe 44 px, collante sous le bandeau de
filtres ; (2) la **grille de cartes-marques** ; (3) le **pied de grille** portant le compteur
de progression et le bouton de chargement.

`EX-SCR-106` — **Barre de synthèse.** Contenu exact, de gauche à droite :
`<n> marques · <n> modèles · <n> offres` (séparateur point médian U+00B7, formats `EX-SCR-1`
et `EX-SCR-10`), puis la liste déroulante de tri, puis le bouton d'inversion de sens du tri,
puis la case `Masquer les modèles à moins de 3 offres`. Les trois cardinaux sont ceux de la
population filtrée, pas de la population affichée ; si les deux diffèrent
(`ET-TROP-RESULTATS`), la barre affiche en plus `— 20 marques affichées` en gris.

### 5.3 Anatomie de la carte-marque

`EX-SCR-107` — Une carte-marque est un bloc de largeur égale à sa colonne de grille
(min 320 px, max 520 px), composé de **quatre régions verticales** :

| Région | Hauteur | Contenu |
|---|---|---|
| **En-tête de marque** | 72 px | pastille + nom de la marque + effectif d'offres de la marque |
| **Résumé de marque** | 44 px | nombre de modèles, prix médian, fourchettes agrégées |
| **Liste de zones-modèles** | variable, 6 zones visibles puis repli | une zone par modèle |
| **Pied de carte** | 40 px | bouton de dépliement, ou rien si tous les modèles sont visibles |

`EX-SCR-108` — **En-tête de marque, contenu exact** : le nom de la marque en capitales, graisse
600, taille 16 px, tronqué à 22 caractères (`EX-SCR-13`) ; à droite, l'effectif total d'offres
de la marque dans le périmètre filtré, en graisse 700, taille 20 px, chiffres tabulaires.
**Aucun logo de marque n'est affiché** : les logos sont des marques déposées et leur
reproduction dans un agrégat non affilié ajouterait un risque juridique que `00-CONTEXT.md`
cherche précisément à contenir. À la place, une pastille carrée de 32 px portant les deux
premières lettres de la marque, sur une couleur dérivée de façon déterministe du `makeId`
(donc stable entre deux chargements et testable).

`EX-SCR-109` — **Résumé de marque, contenu exact**, sur deux lignes de 20 px :
ligne 1 — `<n> modèles · médiane <prix> €` ;
ligne 2 — `<prix min> – <prix max> €  |  <année min> – <année max>` (formats `EX-SCR-4` et
`EX-SCR-6`). Le kilométrage n'apparaît **pas** au niveau marque : agréger le kilométrage de
34 modèles hétérogènes produit une fourchette presque toujours égale à `0 – 400 000 km`, donc
sans information. Justification écrite ici afin qu'elle ne soit pas « corrigée » plus tard.

`EX-SCR-110` — **En-tête cliquable.** Un clic sur l'en-tête ou sur le résumé de marque
**ajoute la marque au filtre `mmmv`** et recharge l'écran A restreint à cette marque (l'écran A
reste affiché : une marque sans modèle ne suffit pas à ouvrir une distribution). Retour
visuel : élévation de la carte de 0 à 2 dp au survol, curseur `pointer`, contour de focus de
2 px au clavier.

`EX-SCR-111` — **Case de comparaison de marque.** Coin supérieur droit de la carte,
20 × 20 px, visible au survol de la carte et en permanence si cochée. Elle ajoute la **marque**
à la sélection de comparaison (écran C). Désactivée si 4 sélections sont déjà faites, avec
l'infobulle `Maximum 4 sélections`.

### 5.4 Anatomie de la zone-modèle

`EX-SCR-112` — Une zone-modèle est une bande de **72 px** de hauteur en régime `large`,
séparée de la précédente par un filet de 1 px, composée exactement de :

```
+---------------------------------------------------------------+
| Golf                                            3 120  >      |   ligne 1 : 22 px
|   8 900 - 32 500 EUR     2010 - 2025                     (o)  |   ligne 2 : 18 px
|   12 000 - 240 000 km    med. 17 400 EUR                      |   ligne 3 : 18 px
|   [##########_____________________]                           |   ligne 4 : 6 px + 8 px
+---------------------------------------------------------------+
```

`EX-SCR-113` — **Contenu exact de la zone-modèle**, dans cet ordre, aucun élément optionnel :
1. **Nom du modèle** — `model.formatted`, graisse 600, 14 px, tronqué à 28 caractères.
2. **Effectif d'offres** — format `EX-SCR-1` sans le mot « offres » (il serait répété 34 fois
   par carte) ; l'unité est portée par l'`aria-label` de la ligne : `Golf, 3 120 offres`.
3. **Chevron `>`** — indicateur d'ouverture de l'écran B.
4. **Fourchette de prix** — `EX-SCR-4`.
5. **Fourchette d'années de première immatriculation** — `EX-SCR-6`, forme `AAAA – AAAA`.
6. **Fourchette de kilométrage** — `EX-SCR-5`.
7. **Prix médian** — `méd. <prix> €`.
8. **Indicateur de couverture** — disque de 8 px, cf. `EX-SCR-115`.
9. **Barre de part relative** — barre horizontale de 6 px de haut dont la longueur est
   proportionnelle à `offres du modèle / offres du modèle le plus offert de cette marque`,
   pleine largeur = 100 %. Elle porte `aria-hidden="true"` : c'est une redondance visuelle de
   l'effectif déjà annoncé aux lecteurs d'écran.

`EX-SCR-114` — **Ces trois fourchettes plus l'effectif sont l'exigence textuelle du
commanditaire** (« le nombre d'offre de ce modèle de cette marque et la fourchette de prix,
d'année et de kilomètre »). Elles ne sont donc jamais masquées, à aucun régime responsive
(en `compact` elles passent sur quatre lignes, cf. `EX-SCR-135`).

`EX-SCR-115` — **Provenance des fourchettes, et honnêteté du chiffre.** `topModels` ne fournit
que `listingsCount`, et `priceInfo` ne fournit que des **minima**
(`FINDING-allowed-surface.md` §2.1 et §2.2). Les trois fourchettes et la médiane sont donc
calculées sur les **annonces effectivement observées**, dont le nombre est inférieur à
l'effectif annoncé. Conséquence normative : chaque zone-modèle affiche un **indicateur de
couverture** de 8 px — disque plein (couverture ≥ 80 %), à moitié plein (20–80 %), ou creux
(< 20 %) — dont l'infobulle indique
`Fourchettes calculées sur <n_obs> des <n_tot> offres`. Un disque creux impose en plus
l'affichage des trois fourchettes en italique. Sans cet indicateur, l'écran présenterait comme
une fourchette de marché ce qui n'est qu'une fourchette d'échantillon.

`EX-SCR-116` — **Cas `n_obs = 0` alors que `n_tot > 0`** (prévisible : `listingsCount` est
exhaustif par construction alors qu'aucune annonce n'a été échantillonnée). La zone-modèle
affiche l'effectif et, à la place des trois fourchettes, la mention unique
`Fourchettes indisponibles — aucune annonce échantillonnée`. Le chevron reste actif : l'écran B
affichera alors `ET-VIDE-FILTRES` avec ce même motif. **Aucun `0 – 0 €` n'est jamais affiché.**

`EX-SCR-117` — **Clic sur la zone-modèle** → navigation vers l'écran B pour ce couple
marque/modèle, filtres conservés (`EX-SCR-51`). Toute la bande de 72 px est la cible cliquable,
pas seulement le chevron. Retour visuel : fond à 4 % de l'accent au survol, contour de focus de
2 px au clavier, et le chevron se décale de 2 px vers la droite.

`EX-SCR-118` — **Case de comparaison de modèle.** Apparaît à gauche du nom au survol de la
bande, 18 × 18 px, et ajoute le **modèle** à la sélection de l'écran C. Un clic sur la case ne
déclenche pas la navigation (propagation arrêtée).

### 5.5 Tri, repliement, volumétrie

`EX-SCR-119` — **Ordre de tri des marques**, par défaut : effectif d'offres décroissant.
Égalité tranchée par ordre alphabétique croissant avec
`Intl.Collator('fr-BE', { sensitivity: 'base', numeric: true })` — de sorte que `Škoda` se
classe avec `Skoda` et que `Série 3` précède `Série 30`. Le tri est **total et déterministe** :
deux chargements identiques produisent le même ordre, ce qui est vérifiable par test.

`EX-SCR-120` — **Options de tri des marques**, exactement quatre :
`Nombre d'offres` (défaut, décroissant) · `Prix médian` (croissant par défaut) ·
`Alphabétique` (croissant) · `Nombre de modèles` (décroissant). Le bouton d'inversion applique
le sens contraire. Aucune option de tri ne repose sur un champ absent de §2.3.

`EX-SCR-121` — **Ordre de tri des modèles dans une carte** : effectif d'offres décroissant,
égalité tranchée par le même collateur. Ce tri **ne suit pas** celui des marques : trier les
marques par prix médian ne réordonne pas les modèles, car l'utilisateur attend de trouver le
modèle le plus offert en tête de chaque carte. Ce choix est écrit parce que les deux
comportements sont défendables et que l'ambiguïté serait relevée en phase 2.2.

`EX-SCR-122` — **Nombre de modèles visibles avant repli : 6.** Justification chiffrée : à
72 px par zone, 6 zones + 116 px d'en-tête et de résumé + 40 px de pied = 588 px, ce qui
permet d'afficher une carte-marque complète et le début de la suivante dans un viewport de
900 px, et satisfait `EX-SCR-22` (≥ 24 zones-modèles visibles avec 4 cartes sur 3 colonnes).
Si la marque compte exactement 7 modèles, les 7 sont affichés : déplier pour un seul modèle est
un clic inutile.

`EX-SCR-123` — **Pied de carte.** Bouton textuel pleine largeur
`+ Afficher les <n> autres modèles`, où `<n>` est exact. Une fois déplié, le libellé devient
`− Réduire à 6 modèles`. L'état déplié de chaque carte est encodé dans l'URL sous forme d'une
liste de `makeId`, afin que `EX-SCR-50` soit satisfait.

`EX-SCR-124` — **Marque à grand nombre de modèles (cas des 80 modèles).** Trois règles
cumulatives :
1. Au dépliement, la liste des zones-modèles devient **défilante à l'intérieur de la carte**,
   hauteur maximale 480 px (soit 6,6 zones visibles), avec une ombre portée haute et basse
   signalant le débord. La carte ne s'allonge donc jamais au-delà de 636 px.
2. Dès que la marque compte **plus de 12 modèles**, un **champ de recherche de modèle**
   apparaît dans le pied de carte au dépliement, pleine largeur, filtrant la liste par
   sous-chaîne insensible à la casse et aux diacritiques, avec un compteur
   `<k> modèles sur 80`.
3. Le rendu de la liste dépliée est **virtualisé** au-delà de 30 zones-modèles : au plus
   30 nœuds de zone existent simultanément dans le DOM par carte.
Volumétrie de référence : la taxonomie compte 295 marques et 4 955 modèles, soit 16,8 modèles
par marque en moyenne ; les marques généralistes dépassent largement cette moyenne, ce qui rend
la virtualisation obligatoire et non optionnelle.

`EX-SCR-125` — **Cas « aucun filtre posé ».** L'écran ne rend **pas** 295 cartes ni 4 955
zones. Comportement normatif :
- La grille affiche les **20 premières marques** par effectif d'offres décroissant.
- Un bandeau `ET-TROP-RESULTATS` indique
  `295 marques dans le snapshot — 20 affichées, triées par nombre d'offres` et porte le bouton
  `Afficher les 295 marques` (rendu virtualisé, `EX-SCR-127`).
- Un **bloc d'amorce** de 96 px est inséré au-dessus de la grille, contenant la phrase
  `Posez au moins un critère pour voir ce que le marché propose` et **quatre raccourcis**
  cliquables, chacun posant un jeu de filtres prédéfini : `Budget ≤ 10 000 €` ·
  `Budget ≤ 20 000 €` · `Moins de 100 000 km` · `Immatriculées depuis 2020`. Ces raccourcis ne
  sont **pas** des recommandations de marché : ce sont des amorces de filtre, et leur libellé le
  dit littéralement.
Justification des chiffres : 295 cartes × 588 px ≈ 173 000 px de hauteur cumulée et ≈ 1 770
zones-modèles repliées, soit un écran inexploitable ; et l'agrégation des 4 955 modèles
représente au pire ≈ 2,3 Go par snapshot d'après la limite P5 de
`FINDING-allowed-surface.md`.

`EX-SCR-126` — Le bloc d'amorce disparaît dès qu'au moins un filtre autre que `atype`, `cy`,
`ustate`, `sort`, `desc`, `powertype` et `pricetype` est posé — c'est-à-dire dès qu'un filtre
non injecté par défaut est actif. Il ne réapparaît pas après un `Tout effacer` de la même
session, sauf rechargement complet de la page : sa fonction est pédagogique, pas répétitive.

`EX-SCR-127` — **Rendu virtualisé de la grille.** Au-delà de 40 cartes, la grille est
virtualisée : au plus 12 cartes montées simultanément, hauteur de conteneur estimée depuis la
hauteur repliée (588 px) puis corrigée à la mesure réelle. Cible mesurée : défilement à
60 images par seconde sur 295 cartes, sur un appareil de milieu de gamme.

`EX-SCR-128` — **Case `Masquer les modèles à moins de 3 offres`**, défaut **inactif**.
Lorsqu'elle est active, les zones-modèles dont l'effectif est 1 ou 2 sont retirées et le pied
de carte indique `<n> modèles masqués (moins de 3 offres)`. Justification du défaut inactif :
un modèle à 1 offre est précisément le cas où un outlier est le plus probable ; le masquage
doit rester un choix explicite de l'utilisateur.

`EX-SCR-129` — **Pagination.** Aucune pagination numérotée. Défilement continu avec chargement
par lots de 12 cartes, déclenché à 600 px du bas de la grille, et bouton
`Charger 12 marques de plus` en repli lorsque l'observateur d'intersection est indisponible.
Un indicateur textuel `<n> marques sur <N>` est affiché en pied de grille en permanence.

### 5.6 États de l'écran A

`EX-SCR-130` — `ET-CHARGE-INIT` : 6 cartes-marques squelettes, chacune avec un en-tête, un
résumé et 6 zones-modèles squelettes, aux dimensions exactes définies ci-dessus. La barre de
synthèse affiche `— marques · — modèles · — offres`. Le nombre 6 est choisi pour remplir un
viewport de 900 px sans en dépasser, afin que la transition vers le contenu réel ne provoque
aucun saut de mise en page mesurable (décalage cumulé de mise en page cible : < 0,05).

`EX-SCR-131` — `ET-VIDE-FILTRES` : la grille est remplacée par le bloc d'`EX-SCR-26`. La barre
de synthèse affiche `0 marque · 0 modèle · aucune offre` et la liste de tri est désactivée avec
l'infobulle `Aucun résultat à trier`.

`EX-SCR-132` — **Résultat partiel par marque.** Si l'agrégat d'une marque est disponible mais
qu'aucun de ses modèles ne l'est, la carte s'affiche avec son en-tête et son résumé, et à la
place des zones-modèles la mention `Détail par modèle indisponible pour cette marque` plus un
bouton `Réessayer` portant sur cette seule carte. La carte reste cliquable au niveau marque.

`EX-SCR-133` — **Erreur partielle de grille.** Si `k` cartes sur `n` ont échoué, les cartes en
échec sont rendues en état d'erreur individuel (bordure ambre de 1 px, texte
`Chargement impossible`, bouton `Réessayer`) et un bandeau indique
`<k> marques sur <n> n'ont pas pu être chargées`. La grille n'est **jamais** vidée pour une
erreur partielle.

`EX-SCR-134` — **`ET-EFFECTIF-FAIBLE` appliqué à la zone-modèle.** Pour `1 ≤ n ≤ 4`, la
médiane est remplacée par `n trop faible` et les fourchettes restent affichées (min et max sont
définis dès `n = 1`, auquel cas `EX-SCR-4` produit une valeur unique). Pour `n = 1`, la
troisième ligne affiche `1 seule offre` à la place de `méd. …`, et la barre de part relative
est rendue à sa longueur réelle, jamais à zéro.

### 5.7 Responsive de l'écran A

`EX-SCR-135` — **Régime `compact` (< 768 px)** : grille à **1 colonne**, carte pleine largeur
moins 32 px. La zone-modèle passe de 72 à 96 px et se réorganise sur quatre lignes
(1 : nom + effectif ; 2 : prix ; 3 : années + km ; 4 : médiane + barre de part). La barre de
synthèse perd le cardinal `modèles` et ne conserve que `<n> marques · <n> offres` ; la liste de
tri devient un bouton de 44 px ouvrant une feuille de sélection. Le nombre de modèles visibles
avant repli passe de 6 à **4**. Le pied de grille reste visible.

`EX-SCR-136` — **Régime `intermédiaire` (768–1279 px)** : grille à **2 colonnes**,
zones-modèles inchangées à 72 px, 6 modèles visibles avant repli, case
`Masquer les modèles à moins de 3 offres` déplacée sur une seconde ligne de la barre de
synthèse (hauteur 68 px).

`EX-SCR-137` — **Régime `large` (≥ 1280 px)** : grille à **3 colonnes** jusqu'à 1 679 px, puis
**4 colonnes** à partir de 1 680 px de largeur de contenu. La colonne ne dépasse jamais
520 px : au-delà, la gouttière absorbe l'excédent.

`EX-SCR-138` — **Ce qui devient défilable, et ce qui ne se masque jamais.** Deviennent
défilables : la grille (verticalement), la liste dépliée d'une carte (verticalement, cf.
`EX-SCR-124`), la ligne des filtres actifs (horizontalement en `compact`). Ne se masquent
jamais, à aucun régime : l'effectif d'offres d'une marque, l'effectif d'offres d'un modèle, et
les trois fourchettes d'une zone-modèle — ce sont exactement les données demandées par le
commanditaire.

---

## 6. Écran B — Distribution d'un modèle

### 6.1 Identité

`EX-SCR-139` — **Nom** : « Distribution — <Marque> <Modèle> ».
**Route** : `/marche/:makeId-:makeSlug/:modelId-:modelSlug?<filtres>`.
**Rôle** : réalise le parcours cible 2 de `00-CONTEXT.md` — obtenir la distribution de l'offre
d'un couple marque/modèle afin d'y détecter les décalages.
**Condition d'affichage** : un `modelId` unique est déterminé, par la route ou par un `mmmv`
contenant exactement un couple marque + modèle. Si `mmmv` contient plusieurs modèles, la route
redirige vers l'écran C (comparaison).

`EX-SCR-140` — Les segments d'URL portent **à la fois** l'identifiant numérique et le `slug`,
séparés par un tiret (`20191-opel-adam`). L'identifiant numérique fait foi ; le `slug` est
cosmétique, et un `slug` erroné n'empêche pas l'affichage (redirection canonique vers le bon
`slug`). Justification : les `slug` de `data/reference/taxonomy.json` sont marqués
`[EXTRAPOLÉ]` alors que les `modelId` sont `RELEVÉ` et recoupés par `topModels`.

### 6.2 Structure

```
+==========================================================================================+
| S0 en-tete + bandeaux + C1 BANDEAU DE FILTRES (PERSISTANT) + fil d'Ariane                |
+==========================================================================================+
| C3  Statistiques calculees sur 20 annonces observees sur 1 281 annoncees - 2 %       (i) |
| (!) Representativite de l'echantillon non prouvee - lire Pourquoi ?                      |
+==========================================================================================+
| OPEL CORSA        1 281 offres | mediane 12 900 EUR | P25 9 900 EUR | P75 16 400 EUR     |
|                   km median 78 000 | 1re immat. mediane 2018 | 42 % particuliers         |  76 px
|                   [ Voir les 1 281 annonces > ]   [ Comparer ]   [ Exporter v ]          |
+==========================================================================================+
| G1 Offres par prix          | G2 Offres par kilometrage   | G3 Offres par annee          |
|   ____                      |    ______                   |       ___                    |  260 px
|  |    |__                   |   |      |__                |      |   |__                 |
|  |    |  |___               |   |      |  |___            |   ___|   |  |                |
|  +-----------------------   |   +----------------------    |  +------------------------   |
+==========================================================================================+
| G4  Prix x Annee x Kilometrage   [ Nuee empilee | Nuage prix-annee ]   [+][-][Reinit.]   |
|                                                                                          |
|  nb                                        | Couleur (annee)     | Taille (km)           |
|   ^                                        | 2005 [#######] 2026 |  o     O      ( )     |  480 px
|   |        o O @ o                         | annee non renseignee|  0  100 000  250 000+ |
|   |    o O @ @ O o o                       | (3) en gris         |                       |
|   +--------------------------------> prix  |                                             |
|   12 annonces regroupees dans le bucket de debord ">= 38 000 EUR"                        |
+==========================================================================================+
| G5 Prix median par annee              | G6 Depreciation (base 100)                       |  320 px
+==========================================================================================+
| G7 Densite prix x km                  | G8 Ecart au prix attendu (20 premiers)           |  360 px
+==========================================================================================+
| G9 Carburant | G10 Prix par tranche km | G12 Evaluation AS24 | G13 Type de vendeur       |  300 px
+==========================================================================================+
| G14 Prix median par puissance         | G15 Repartition par pays (si cy multiple)        |  280 px
+==========================================================================================+
| S0 pied de page                                                                          |
+==========================================================================================+
```

`EX-SCR-141` — L'écran B comporte **exactement quatre blocs** dans la zone principale :
(1) l'**en-tête statistique** de 76 px, collant sous le bandeau de filtres ;
(2) la **rangée des trois histogrammes imposés** ;
(3) la **vue tri-dimensionnelle `G4`**, seule à occuper toute la largeur ;
(4) la **grille des graphes additionnels** `G5` à `G15`.

`EX-SCR-142` — **En-tête statistique, contenu exact**, trois lignes :
ligne 1 — `<MARQUE> <MODÈLE>` puis, séparés par des barres verticales : `<n> offres`,
`médiane <prix> €`, `P25 <prix> €`, `P75 <prix> €` ;
ligne 2 — `km médian <km>`, `1ʳᵉ immat. médiane <AAAA>`, `<p> % particuliers` ;
ligne 3 — trois boutons : `Voir les <n> annonces` (écran D), `Comparer` (ajoute le modèle à la
sélection de l'écran C), `Exporter` (menu de `EX-SCR-187`).
Toute statistique de l'en-tête porte son effectif en infobulle (`EX-SCR-12`).

`EX-SCR-143` — **Le bandeau de filtres est persistant et s'applique à toute la page.**
C'est une exigence textuelle du commanditaire. Conséquence normative : **tous** les graphes de
l'écran B sont recalculés depuis le même ensemble filtré, dans la même transaction ; il
n'existe aucun graphe qui ignore un filtre. Critère de recette : après application d'un filtre
de classe R, la somme des effectifs de `G1`, celle de `G2`, celle de `G3` et l'effectif de
l'en-tête sont égales à l'effectif filtré, aux exclusions de `ET-CHAMP-MANQUANT` près, chacune
documentée par sa note d'exclusion `EX-SCR-178`.

`EX-SCR-144` — **Ordre des graphes, normatif** : `G1`, `G2`, `G3` (les trois imposés), puis
`G4` (la vue tri-dimensionnelle imposée), puis les additionnels par utilité décroissante pour
la détection d'outliers : `G5`, `G6`, `G7`, `G8`, `G9`, `G10`, `G12`, `G13`, `G14`, `G15`.
L'ordre est fixe et non personnalisable en v1 ; le rendre configurable serait une dette
assumée, pas une exigence.

### 6.3 Les trois histogrammes imposés

`EX-SCR-145` — **`G1` — Offres par prix.** Type : histogramme à barres verticales.
Axe X : prix, échelle **linéaire** (justification `EX-SCR-17`), unité `€`, bornes P1–P99
(`EX-SCR-18`), buckets de largeur égale calculée par la règle de Freedman-Diaconis puis
arrondie au multiple de 500 € le plus proche, avec un minimum de 8 et un maximum de
40 buckets. Axe Y : nombre d'offres, **linéaire**, départ à 0, bascule logarithmique
conditionnelle (`EX-SCR-16`). Étiquettes d'axe X aux bornes de bucket, une sur deux si la
largeur disponible est inférieure à 48 px par étiquette.

`EX-SCR-146` — **`G2` — Offres par kilométrage.** Identique à `G1`, unité `km`, largeur de
bucket arrondie au multiple de 5 000 km, minimum 8 et maximum 30 buckets, borne haute P99 avec
bucket de débord `≥ <borne> km`.

`EX-SCR-147` — **`G3` — Offres par année de première immatriculation.** Buckets de **1 an**,
sans calcul de largeur : l'année est la granularité naturelle et un bucket de 2,7 ans serait
illisible. Bornes : de l'année minimale observée à l'année maximale observée, **sans**
troncature P1/P99 — un modèle couvre 8 à 25 millésimes, la troncature n'apporterait rien et
masquerait les ancêtres, qui sont un cas d'outlier légitime. Si l'étendue dépasse 30 ans, les
années les plus anciennes sont regroupées dans un bucket de débord `avant <AAAA>`.

`EX-SCR-148` — **Encodage commun à `G1`–`G3`** : barres d'une seule couleur (accent à 70 %
d'opacité), **aucune couleur porteuse d'information** — la couleur est réservée à `G4`.
Espacement inter-barres de 2 px. Aucune barre d'effectif ≥ 1 ne mesure moins de 1 px de
hauteur : une classe à 1 offre doit rester visible, sinon la détection du cas isolé est perdue.

`EX-SCR-149` — **Interactions communes à `G1`–`G3`** :
- **Survol d'une barre** → infobulle : intervalle du bucket, effectif, part en pourcentage, et
  prix médian des offres du bucket (`G2`, `G3`) ou kilométrage médian du bucket (`G1`).
- **Clic sur une barre** → pose le filtre d'intervalle correspondant au bucket
  (`pricefrom`/`priceto`, `kmfrom`/`kmto`, `fregfrom`/`fregto`), donc recalcule toute la page.
  Retour visuel immédiat : la barre passe en accent plein et un jeton apparaît en zone (4) du
  bandeau avant même la fin du recalcul.
- **Brossage horizontal** (glisser sur l'axe) → pose l'intervalle de la plage brossée, arrondi
  aux bornes de bucket ; la plage est encodée dans l'URL.
- **`Ctrl` + clic** → sélection de plusieurs buckets non contigus ; l'intervalle posé est le
  plus petit englobant, et une note affiche
  `intervalle élargi aux bornes des buckets sélectionnés`.
- **Double-clic dans la zone de tracé** → retire le filtre posé par ce graphe.
**Aucun zoom molette** : il entrerait en conflit avec le défilement vertical de la page.

`EX-SCR-150` — **`G1`–`G3` à faible effectif.**
- `n = 0` → le graphe n'est pas tracé ; à sa place, un cadre de dimension identique portant
  `Aucune offre` centré. Le cadre est conservé pour que la mise en page ne saute pas.
- `n = 1` → une barre unique de hauteur 1, l'axe X couvrant `valeur ± 1 largeur de bucket`, la
  mention `1 offre — aucune distribution` sous le titre, et la bascule logarithmique absente
  du DOM.
- `n = 3` → au plus trois barres, largeur de bucket forcée à `(max − min) / 3` arrondie au pas
  de l'unité, jeton ambre `n = 3` accolé au titre, et aucune médiane en infobulle
  (`EX-SCR-33`).

### 6.4 `G4` — La vue tri-dimensionnelle

`EX-SCR-151` — **`G4` implémente littéralement la demande du commanditaire** — « un graphe
nombre d'offre - prix avec les points colorés par année et la taille des points liée au nombre
de km » — et propose l'alternative qu'il autorise explicitement (« ou un autre setup pour
afficher les 3 dimensions prix années km »). Le composant offre donc **deux vues commutables**,
une seule visible à la fois :

| Vue | Axe X | Axe Y | Couleur | Taille | Un point = |
|---|---|---|---|---|---|
| **`G4a` — Nuée empilée** (défaut si `n ≤ 400`) | prix, mêmes buckets que `G1` | rang d'empilement dans le bucket, donc **nombre d'offres** | année de 1ʳᵉ immatriculation | kilométrage | une annonce |
| **`G4b` — Nuage prix × année** (défaut si `n > 400`) | date de 1ʳᵉ immatriculation, continue | prix | kilométrage | puissance en kW, sinon taille fixe | une annonce |

`EX-SCR-152` — **`G4a` est la vue par défaut jusqu'à 400 annonces.** Justification chiffrée :
avec un diamètre de point maximal de 14 px et une hauteur de tracé de 400 px, un bucket ne peut
empiler plus de 28 points sans chevauchement ; au-delà d'environ 400 annonces réparties sur
14 buckets, la moyenne par bucket dépasse ce seuil et l'empilement dégénère en colonne opaque.
La bascule manuelle reste disponible dans les deux sens, et son état est encodé dans l'URL.

`EX-SCR-153` — **Échelles de `G4`.** `G4a` : axe X linéaire en prix, avec **exactement les
mêmes bornes et les mêmes buckets que `G1`**, afin que les deux graphes se lisent l'un sur
l'autre ; axe Y linéaire en effectif depuis 0. `G4b` : axe X linéaire en date de première
immatriculation (graduations annuelles au 1ᵉʳ janvier), axe Y linéaire en prix.
**Aucune échelle logarithmique dans `G4`** : elle romprait la correspondance visuelle avec
`G1` et `G3`, qui est la raison d'être de l'alignement des buckets.

`EX-SCR-154` — **Encodage couleur de `G4a` (année).** Rampe séquentielle continue à 5 arrêts,
de l'ancien au récent, **sûre en déficience de vision des couleurs** (aucune opposition
rouge/vert) et de luminance monotone pour rester lisible en niveaux de gris. Légende
obligatoire : barre de dégradé horizontale de 160 px portant l'année minimale, l'année médiane
et l'année maximale observées. Les annonces dont l'année est absente sont tracées en **gris
neutre**, avec l'entrée de légende `année non renseignée (<k>)` — jamais fondues dans la rampe.

`EX-SCR-155` — **Encodage taille de `G4a` (kilométrage).** **Aire** du disque proportionnelle
au kilométrage, donc rayon en racine carrée — jamais le rayon proportionnel, qui surévaluerait
les gros kilométrages d'un facteur 2 en aire perçue. Diamètre borné de 5 px à 14 px. Légende
obligatoire : trois disques témoins étiquetés `0 km`, `100 000 km`, `250 000 km et plus`.
Les kilométrages supérieurs à 250 000 km sont écrêtés au diamètre maximal et reçoivent un
contour pointillé de 1,5 px signalant l'écrêtage.

`EX-SCR-156` — **Encodage de `G4b`.** Couleur = kilométrage (même famille de rampe
séquentielle, légende en km) ; taille = puissance en kW lorsque le champ est présent, sinon
**taille fixe de 6 px** et mention `taille non porteuse d'information` dans la légende.
Justification de l'inversion des canaux : en nuage prix × année, c'est le kilométrage dont les
valeurs extrêmes doivent ressortir, et la couleur est un canal plus précis que la taille pour
une variable continue lue point par point.

`EX-SCR-157` — **Chevauchement et opacité.** Points à 55 % d'opacité, contour de 0,5 px à
100 % d'opacité pour que deux points superposés restent dénombrables. Au-delà de 5 000 points,
`G4b` bascule automatiquement d'un rendu SVG à un rendu `canvas`, et au-delà de 20 000 points
affiche le bandeau `ET-TROP-RESULTATS` avec la mention d'échantillonnage à graine fixée
(la graine est écrite dans l'infobulle, afin que deux utilisateurs voient le même échantillon).

`EX-SCR-158` — **Interactions de `G4`** :
- **Survol d'un point** → infobulle de 5 lignes : `modelVersionInput` tronqué à 40 caractères,
  `<prix> €`, `<km> km`, `1ʳᵉ immat. <MM/AAAA>`, puissance au format `EX-SCR-7`, plus le jeton
  d'évaluation AutoScout24 (`Très bon prix` / `Bon prix` / `Prix correct`) s'il est présent.
- **Clic sur un point** → ouvre l'annonce d'origine (`details.webPage`) dans un nouvel onglet,
  avec `rel="noopener noreferrer"`. C'est le seul lien sortant de l'application, conformément
  au choix d'architecture de `00-CONTEXT.md` (deeplink plutôt que duplication).
- **Brossage rectangulaire** (glisser dans la zone de tracé) → sélectionne un sous-ensemble
  d'annonces. La sélection **n'est pas un filtre** : elle met en surbrillance les mêmes
  annonces dans `G1`, `G2`, `G3`, `G7`, `G8` et `G10` (liaison croisée, `EX-SCR-184`), affiche
  un compteur `<n> annonces sélectionnées` et propose deux boutons :
  `Filtrer sur cette sélection` (convertit la sélection en filtres d'intervalle) et
  `Voir ces annonces` (écran D restreint à la sélection).
- **Zoom** : boutons `+`, `−` et `Réinitialiser` explicites, plus `Maj` + glisser pour un zoom
  rectangulaire. Aucun zoom molette (`EX-SCR-149`).
- **`Échap`** → annule la sélection de brossage.

`EX-SCR-159` — **`G4` à faible effectif.**
- `n = 1` → un point unique tracé au centre de la zone, axes bornés à `valeur ± 20 %` ;
  les légendes de couleur et de taille sont **remplacées** par les valeurs littérales
  (`année 2017`, `84 000 km`), car une rampe à un seul arrêt n'a aucun sens ; mention
  `1 offre` sous le titre.
- `n = 3` → trois points ; la rampe de couleur est remplacée par **trois pastilles discrètes**
  étiquetées de leurs années exactes, et trois disques témoins étiquetés de leurs kilométrages
  exacts. Brossage et zoom sont désactivés pour `n ≤ 3` (infobulle
  `Sélection inutile en dessous de 4 offres`).
- Seuil de bascule des légendes continues vers les légendes discrètes : `n < 8`.

`EX-SCR-160` — **`G4` sans année exploitable.** Si aucune annonce du périmètre ne porte de date
de première immatriculation, `G4a` conserve sa nuée mais la dimension couleur est remplacée par
une couleur unique, et la légende affiche `année non renseignée sur les <n> offres` ;
`G4b` devient indisponible, son onglet est désactivé avec l'infobulle
`Nécessite l'année de première immatriculation`.

### 6.5 Graphes additionnels retenus

Chaque graphe ci-dessous est **un ajout de l'agent `req-screens`**, en réponse à la demande
explicite « tu ajoutes également tout autre graphe agrégé utile ». Chacun est justifié par ce
qu'il révèle **et que les autres ne révèlent pas**.

`EX-SCR-161` — **`G5` — Prix médian par année de première immatriculation.**
Type : courbe en escalier de la médiane, bande interquartile P25–P75 en aire translucide, et
barres d'effectif en fond à 20 % d'opacité sur un second axe Y à droite.
Axes : X années (mêmes buckets que `G3`, linéaire) ; Y gauche prix (linéaire, départ à 0) ;
Y droit effectif (linéaire, départ à 0, plafonné au maximum de `G3`).
**Ce qu'il révèle et que les autres ne révèlent pas** : la tendance centrale *conditionnelle*
à l'année. `G1` donne la distribution globale des prix, `G3` celle des années, mais aucun des
deux ne dit à quel prix se négocie un millésime donné — or c'est exactement la référence
contre laquelle un outlier se définit.
Interactions : survol d'une année → `n`, médiane, P25, P75, min, max ; clic → pose
`fregfrom = fregto = <année>`.
Faible effectif : une année à `n ≤ 4` affiche ses points bruts sans bande interquartile et avec
un marqueur creux ; une année à `n = 0` **interrompt la courbe**, sans interpolation à travers
le trou — interpoler inventerait une donnée.

`EX-SCR-162` — **`G6` — Dépréciation, base 100.**
Type : courbe unique. Axe X : âge en années, `0` = année la plus récente comptant `n ≥ 5`,
linéaire. Axe Y : indice du prix médian, base 100 à l'âge 0, linéaire. Une seconde série en
pointillé donne la **perte annuelle en pourcentage** sur un axe Y droit.
**Ce qu'il révèle** : le *taux* de perte de valeur, et non son niveau. `G5` dit que la Corsa
2015 vaut 9 000 € ; `G6` dit qu'elle perd 11 % par an entre 3 et 6 ans puis 6 % ensuite. C'est
la seule vue qui rende comparables deux modèles de gammes différentes, donc la seule qui
permette d'affirmer « ce modèle décote anormalement vite ».
Faible effectif : le graphe est **remplacé** par la mention
`Dépréciation non calculable — il faut au moins 3 années comptant chacune 5 offres`, et non par
une courbe à deux points. Condition mesurable, donc testable.

`EX-SCR-163` — **`G7` — Densité prix × kilométrage.**
Type : carte de densité en cellules hexagonales, palette séquentielle mono-teinte à 5 classes
en quantiles d'effectif de cellule, légende à 5 crans avec les effectifs de bornes.
Axes : X kilométrage linéaire ; Y prix linéaire **avec bascule logarithmique** — seul graphe à
la proposer sur un axe de prix (`EX-SCR-17`).
**Ce qu'il révèle** : où se trouve la *masse* du marché quand la nuée de `G4` est saturée par
le sur-tracé, et surtout les **trous et les bimodalités** — deux amas séparés dans le plan
prix × km signalent deux populations (typiquement deux générations du modèle), ce qu'un nuage
opaque cache complètement.
Interactions : survol d'une cellule → effectif, plage de prix, plage de km, prix médian ;
clic → pose les deux intervalles de la cellule.
Faible effectif : en dessous de `n = 40`, `G7` **n'est pas tracé** et affiche
`Densité non pertinente en dessous de 40 offres — voir la nuée ci-dessus`. Justification du
seuil : 40 annonces sur une grille hexagonale donnent moins de 2 annonces par cellule occupée,
la densité n'apportant alors rien de plus que la nuée.

`EX-SCR-164` — **`G8` — Écart au prix attendu (les 20 premiers outliers).**
Type : diagramme en sucettes horizontales, une ligne par annonce, triées par écart croissant
(les plus sous-évaluées en haut). Axe X : écart, **centré sur 0**, échelle linéaire symétrique,
double étiquetage en euros et en pourcentage. Couleur : teinte froide pour un écart négatif
(moins cher qu'attendu), teinte chaude pour un écart positif ; ces deux teintes sont les seules
de la page à porter un signe, et la légende le dit.
Le prix attendu est le prix prédit par une **régression robuste** du prix sur l'année et sur le
logarithme du kilométrage, estimée sur le périmètre filtré courant. La méthode d'estimation
appartient au lot D4 ; l'écran exige seulement que la méthode soit **nommée à l'écran** sous le
titre, au format `Modèle : régression robuste prix ~ année + ln(km) — n = 312, R² = 0,71`.
**Ce qu'il révèle** : le classement des affaires *à âge et kilométrage comparables*. Aucun
autre graphe ne le fait : `G1` classe par prix absolu, ce qui met en tête les épaves ; `G4`
laisse l'œil faire le travail sur un nuage de 300 points. C'est le graphe qui répond
directement à « repérer les anomalies qui constituent des opportunités » de `00-CONTEXT.md`.
Interactions : clic sur une sucette → ouvre l'annonce d'origine ; survol → infobulle complète
de l'annonce, plus le prix attendu et l'écart.
Faible effectif : `G8` **n'est pas tracé** en dessous de `n = 30` et affiche
`Écart au prix attendu non calculable — il faut au moins 30 offres pour estimer un prix de
référence`. Si `R² < 0,30`, le graphe est tracé mais surmonté de l'avertissement ambre
`Le modèle explique moins de 30 % de la variance — les écarts sont peu fiables`.

`EX-SCR-165` — **`G9` — Répartition par carburant.**
Type : barres horizontales triées par effectif décroissant, une barre par valeur de
`fuels.fuelCategory.raw`, libellées avec les libellés FR relevés de l'énumération `fuel`
(`EX-SCR-14`). Chaque barre porte `<n> · <p> %` en bout, et le **prix médian de la classe** en
gris à droite. Axe X : effectif, linéaire, départ à 0.
**Ce qu'il révèle** : la composition du marché du modèle, invisible dans toute distribution
univariée, et le décalage de prix médian entre carburants — souvent l'explication première
d'une distribution de prix bimodale observée en `G1`.
Interactions : clic sur une barre → pose `fuel` sur cette valeur.
Faible effectif : une classe à `n ≤ 4` affiche son effectif mais pas son prix médian
(`EX-SCR-33`). Le graphe est tracé dès `n ≥ 1`.
**Barres horizontales, et non un anneau** : la comparaison de longueurs est plus précise que
celle d'angles, et 10 secteurs d'anneau sont illisibles.

`EX-SCR-166` — **`G10` — Prix par tranche de kilométrage.**
Type : boîtes à moustaches, 5 tranches définies par les **quintiles observés** du kilométrage —
et non par des paliers ronds, car les quintiles garantissent des effectifs comparables et donc
des boîtes comparables. Axe X : tranches (catégoriel ordonné, bornes affichées en km) ;
axe Y : prix, linéaire, départ à 0. Chaque boîte porte son effectif sous l'axe. Les valeurs
au-delà de 1,5 × l'écart interquartile sont tracées comme points individuels **cliquables**
(ouverture de l'annonce).
**Ce qu'il révèle** : la *dispersion* conditionnelle au kilométrage, et non la seule tendance.
`G5` et `G7` montrent où sont les prix ; `G10` montre où le marché est **incohérent** — une
tranche à fort écart interquartile signale un segment où le prix ne s'explique pas par le
kilométrage, donc l'endroit où chercher.
Faible effectif : en dessous de `n = 25`, le nombre de tranches est réduit à 3 ; en dessous de
`n = 15`, `G10` est remplacé par un nuage de points prix × km simple, avec la mention
`Effectif insuffisant pour des boîtes à moustaches (n = 12)`.

`EX-SCR-167` — **`G12` — Répartition par évaluation de prix AutoScout24.**
Type : barre empilée horizontale unique, 4 segments : `Très bon prix`, `Bon prix`,
`Prix correct`, `Non évalué`. Effectif et pourcentage inscrits dans chaque segment de largeur
≥ 40 px, les autres reportés en légende.
**Ce qu'il révèle** : le verdict de la source elle-même, disponible gratuitement dans
`prices.public.evaluation.category`. C'est un **contrôle croisé indépendant** de notre `G8` :
une annonce que `G8` classe très sous-évaluée alors qu'AutoScout24 ne la signale pas mérite un
examen, et réciproquement. Aucun autre graphe n'apporte un point de vue externe au nôtre.
Interactions : clic sur un segment → pose `pe_category`.
Note obligatoire sous le graphe : `Évaluation calculée par AutoScout24, méthode non publiée.`
Cette note évite qu'un utilisateur prenne ce segment pour un calcul de KYCAR.

`EX-SCR-168` — **`G13` — Répartition par type de vendeur.**
Type : deux barres horizontales (`Particulier`, `Professionnel`) portant chacune effectif,
pourcentage et prix médian, avec l'écart de médiane affiché entre les deux en euros et en
pourcentage.
**Ce qu'il révèle** : un facteur de confusion majeur du prix. Sans ce graphe, un prix bas est
interprété comme une opportunité alors qu'il traduit souvent une vente entre particuliers sans
garantie. C'est le seul axe vendeur autorisé par R3 et par l'hypothèse H3.
Interactions : clic → pose `custtype`.
Faible effectif : une classe à `n ≤ 4` n'affiche ni son prix médian ni l'écart.

`EX-SCR-169` — **`G14` — Prix médian par palier de puissance.**
Type : barres verticales, paliers de 20 kW (ou de 25 ch si `powertype = hp`), prix médian en
hauteur, effectif en étiquette au-dessus de chaque barre.
**Ce qu'il révèle** : que la dispersion de prix d'un « même modèle » est en grande partie une
dispersion de motorisation et de finition. `G1` n'attribue cette dispersion à rien ; `G14`
l'attribue à la puissance et permet de ne comparer que des annonces réellement comparables.
Faible effectif : les paliers à `n ≤ 4` sont tracés en contour pointillé, sans valeur de
médiane. Le graphe n'est pas tracé si moins de 3 paliers comptent `n ≥ 5`.

`EX-SCR-170` — **`G15` — Répartition par pays.**
Type : barres horizontales par `location.countryCode`, avec effectif, pourcentage et prix
médian. **Tracé uniquement si** le filtre `cy` porte plus d'une valeur, ou si le périmètre
contient plus d'un `countryCode` distinct ; sinon le bloc est absent du DOM. Ce n'est pas un
cas d'`ET-CHAMP-ABSENT-SOURCE` : le champ existe, c'est le graphe qui est sans objet.
**Ce qu'il révèle** : l'écart de prix transfrontalier, principale opportunité structurelle d'un
marché pan-européen (hypothèse H1), qu'aucune vue nationale ne peut montrer.

`EX-SCR-171` — **Aucun graphe n'affiche de tendance sans son effectif.** Toute courbe, toute
boîte, tout point agrégé porte son `n`, à l'écran ou en infobulle. Critère de recette : pour
chaque graphe agrégé, un test vérifie la présence de l'effectif dans l'infobulle de chaque
élément tracé.

### 6.6 Graphes écartés, et pourquoi

`EX-SCR-172` — Les graphes suivants ont été envisagés et **écartés**. Le motif est écrit pour
qu'aucun développeur ni relecteur ne les rajoute par défaut.

| Graphe écarté | Motif de rejet |
|---|---|
| **Anneau (donut) des carburants** | la comparaison d'angles est moins précise que celle de longueurs, et 10 valeurs de `fuel` produisent des secteurs illisibles. Remplacé par `G9`. |
| **Répartition par boîte de vitesses** | **le champ n'existe pas** parmi les 40 champs relevés en §2.3 de `FINDING-allowed-surface.md`. Utile, mais l'inventer serait une faute. Alternative en `EX-SCR-218`. |
| **Répartition par couleur extérieure** | champ absent de §2.3, et pouvoir explicatif faible sur le prix d'un modèle de grande diffusion. Double motif. |
| **Carte choroplèthe des provinces belges** | le filtre `region` a un domaine inconnu (Z3), le code postal est tronqué à `NNxx` par contrainte RGPD, et à 20 annonces observées par modèle chaque province compterait moins de 3 offres. Reporté, sous condition explicite : table CP → province produite **et** couverture ≥ 60 %. |
| **Évolution temporelle du prix médian** | exige plusieurs snapshots ; H4 prévoit un snapshot périodique mais aucun historique n'existe en v1. Condition de réactivation : ≥ 8 snapshots hebdomadaires consécutifs. |
| **Jauge ou score composite « affaire »** | un indicateur unique masque quelle dimension le porte, ce qui est l'inverse de l'objet de l'application. `G8` fournit un écart décomposable à sa place. |
| **Diagramme radar des caractéristiques** | l'ordre des axes est arbitraire et l'aire du polygone en dépend : la comparaison n'est pas reproductible. |
| **Sankey / diagramme de flux** | il n'existe aucun flux dans la donnée : un snapshot est un état, pas une transition. |
| **Nuage de mots sur `modelVersionInput`** | texte libre sans vocabulaire contrôlé ; le résultat est décoratif et non actionnable. |
| **Histogrammes du CO₂ et de la consommation** | les champs existent (§2.3) mais **aucun filtre ne les expose** (Z5) : ces graphes seraient les seuls non cliquables de la page et leur lecture ne conduirait à aucune action. Les valeurs restent affichées dans l'infobulle d'annonce et dans l'écran D. Reclassé en **dette**, pas en rejet définitif. |
| **Histogramme du nombre de propriétaires** | le champ existe (`numberOfPreviousOwnersExtended`) mais son domaine ne compte que 4 classes dont la sémantique de borne est présumée (Z2) ; l'information est portée sans perte par une colonne de l'écran D. |
| **Histogramme des équipements** | aucun champ d'équipement dans les 40 relevés ; et la sémantique du filtre `eq` est présumée (Z1). Deux inconnues superposées. |

### 6.7 États de l'écran B

`EX-SCR-173` — `ET-CHARGE-INIT` : squelettes aux dimensions exactes de chaque bloc — en-tête
statistique avec 6 pastilles de valeur, trois cadres d'histogramme de 260 px, un cadre `G4` de
480 px, puis les cadres additionnels. **Les axes ne sont pas dessinés** dans le squelette :
dessiner de faux axes suggérerait de fausses bornes.

`EX-SCR-174` — `ET-VIDE-FILTRES` sur l'écran B : les graphes sont retirés et remplacés par le
bloc d'`EX-SCR-26`, dont les suggestions de retrait de filtre sont ici particulièrement utiles.
L'en-tête statistique reste affiché avec `aucune offre` et un `—` pour chaque statistique.
Le bouton `Voir les 0 annonces` est désactivé, avec l'infobulle `Aucune annonce à lister`.

`EX-SCR-175` — **Avertissement de représentativité, obligatoire sur l'écran B.** Sous le
bandeau `C3`, une seconde ligne affiche
`Représentativité de l'échantillon non prouvée — lire Pourquoi ?` dès que la couverture est
< 100 %. Justification : la limite P2 de `FINDING-allowed-surface.md` établit que l'échantillon
de 20 annonces est probablement trié par produit publicitaire (`adProduct.tier`) et qu'« un
échantillon biaisé fausserait toute distribution ». L'écran B est **entièrement** constitué de
distributions ; taire cet avertissement rendrait l'écran trompeur. Cette ligne n'est pas
refermable tant que la couverture est < 100 %.

`EX-SCR-176` — **Recalcul partiel interdit.** Si un graphe échoue à se calculer, les autres
restent affichés et le graphe en échec est remplacé par un cadre de dimension identique portant
`Calcul impossible` et un bouton `Réessayer` local. Il n'existe **aucun** cas où un changement
de filtre laisse deux graphes sur des périmètres différents : chaque graphe porte en attribut
de données l'empreinte du jeu de filtres qui l'a produit, et un graphe dont l'empreinte diffère
de l'empreinte courante est rendu en `ET-CHARGE-MAJ`, jamais affiché comme valide.
Critère de recette : test comparant les empreintes des 14 graphes après un changement de
filtre.

`EX-SCR-177` — **`ET-TROP-RESULTATS` sur l'écran B.** Seuil : 20 000 annonces individuelles.
`G1`, `G2`, `G3`, `G5`, `G6`, `G7`, `G9`, `G10`, `G12`, `G13`, `G14` et `G15` restent calculés
sur la **population entière** ; seuls `G4` et `G8` travaillent différemment : `G4` trace
20 000 points échantillonnés à graine fixée, `G8` estime son modèle sur la population entière
mais n'affiche que les 20 premiers écarts. Cette asymétrie est écrite dans l'infobulle de `G4`
et dans celle de `G8`, pas seulement dans ce document.

`EX-SCR-178` — **Notes d'exclusion par graphe.** Sous chaque graphe, une ligne de 16 px en gris
à 60 % indique, dès que `k ≥ 1` : `<k> annonces exclues (<motif>)`. Motifs normatifs :
`prix sur demande`, `prix absent`, `année non renseignée`, `kilométrage non renseigné`,
`puissance non renseignée`. Le regroupement en bucket de débord n'est **pas** une exclusion et
porte un libellé distinct : `<k> annonces regroupées dans le bucket de débord`.

### 6.8 Responsive de l'écran B

`EX-SCR-179` — **Régime `large` (≥ 1280 px)** : `G1`, `G2`, `G3` sur une rangée de 3 colonnes
égales, hauteur 260 px. `G4` pleine largeur, hauteur 480 px, légendes à droite de la zone de
tracé. `G5` + `G6` sur 2 colonnes ; `G7` + `G8` sur 2 colonnes ;
`G9` + `G10` + `G12` + `G13` sur 4 colonnes ; `G14` + `G15` sur 2 colonnes.

`EX-SCR-180` — **Régime `intermédiaire` (768–1279 px)** : `G1`, `G2`, `G3` passent sur
2 colonnes, `G3` occupant seul la seconde rangée en pleine largeur. `G4` conserve la pleine
largeur, sa hauteur tombe à 400 px et ses deux légendes passent **sous** la zone de tracé au
lieu d'être à droite. Les graphes additionnels passent tous sur 2 colonnes, sauf `G8` qui reste
en pleine largeur : ses libellés d'annonce exigent de la largeur.

`EX-SCR-181` — **Régime `compact` (< 768 px)** : **1 colonne**, tous les graphes empilés ;
hauteurs : histogrammes 200 px, `G4` 320 px, additionnels 240 px. Réorganisations imposées :
- l'en-tête statistique passe de 3 à 5 lignes, sa rangée de boutons devenant défilable
  horizontalement ;
- les axes de `G1`–`G3` n'affichent plus qu'une étiquette sur trois ;
- `G4` **désactive le brossage rectangulaire** (impraticable au doigt) et le remplace par un
  **appui long** sur un point, qui ouvre l'infobulle en feuille basse avec un bouton
  `Ouvrir l'annonce` explicite — un clic direct sur un point de 6 px au doigt ouvrirait des
  liens sortants par erreur ;
- `G8` réduit sa liste de 20 à 10 sucettes, avec un bouton `Afficher 10 de plus` ;
- `G7` **n'est pas tracé** (une grille hexagonale de moins de 320 px de large ne porte plus
  d'information) et affiche à sa place `Densité disponible sur écran large`.

`EX-SCR-182` — **Ce qui ne se masque jamais, à aucun régime** : les trois histogrammes `G1`,
`G2`, `G3` ; la vue `G4` ; le bandeau de couverture `C3` ; l'avertissement de
représentativité ; le bandeau de filtres. Ce sont les éléments exigés par le commanditaire ou
nécessaires à une lecture honnête des chiffres.

`EX-SCR-183` — **Chaque graphe est défilable horizontalement dans son propre conteneur** si sa
largeur minimale de lisibilité n'est pas atteinte (280 px pour un histogramme, 320 px pour
`G4`, 360 px pour `G8`). Le corps de la page ne défile **jamais** horizontalement.

### 6.9 Interactions transverses de l'écran B

`EX-SCR-184` — **Liaison croisée (brossage et liaison).** Une sélection de brossage faite dans
`G4`, `G7` ou `G10` met en surbrillance les mêmes annonces dans tous les autres graphes : les
barres de `G1`–`G3` affichent la part sélectionnée en surimpression d'un accent secondaire, les
points non sélectionnés de `G4` tombent à 15 % d'opacité, et les barres de `G9`, `G12`, `G13`
et `G15` reçoivent un liseré proportionnel à la part sélectionnée. La surbrillance **ne modifie
aucun agrégat affiché** : convertir la sélection en filtre est un acte explicite
(`EX-SCR-158`).

`EX-SCR-185` — **Un seul mécanisme de sélection actif à la fois.** Ouvrir un brossage dans un
graphe annule celui d'un autre, avec une transition de 150 ms. Un compteur global
`<n> annonces sélectionnées — Effacer` est affiché en tête de la zone principale tant qu'une
sélection existe, et il est encodé dans l'URL (`EX-SCR-50`).

`EX-SCR-186` — **Cohérence des encodages entre graphes.** Une même variable reçoit toujours le
même encodage sur toute la page : l'année utilise la rampe `A` (`G4a`, graduations de `G5`), le
kilométrage la rampe `B` (`G4b`, `G7`), les catégories nominales la palette qualitative `Q` de
8 teintes (`G9`, `G12`, `G13`, `G15`), et le signe d'un écart les deux teintes divergentes de
`G8` — utilisées nulle part ailleurs. Aucune palette n'est choisie localement par un graphe.

`EX-SCR-187` — **Export.** Le menu `Exporter` propose exactement trois entrées :
`CSV des annonces du périmètre` (une ligne par annonce, colonnes limitées aux champs
autorisés — **aucun champ identifiant un vendeur**, cf. R3), `CSV des agrégats affichés` (une
ligne par bucket de chaque graphe, le nom du graphe en première colonne),
`PNG du graphe sélectionné` (2× la résolution d'affichage, titre, légende, effectif et date de
snapshot incrustés). Chaque export porte en en-tête de fichier la date du snapshot, la chaîne
de filtres complète et le taux de couverture. Le bouton est désactivé en `ET-PARTIEL-CACHE`
et en `ET-CHARGE-INIT`.

`EX-SCR-188` — **Accessibilité des graphes.** Chaque graphe possède : un `<h3>` visible, un
`aria-label` résumant sa lecture (`Histogramme des prix, 14 classes, mode entre 9 000 et
10 500 euros`), et un **tableau de données équivalent** déplié par un bouton
`Voir les données` (buckets et effectifs, ou lignes d'annonce pour `G8`). Cette table est la
seule voie d'accès conforme pour un lecteur d'écran ; **aucun graphe n'est livré sans elle**.
Clavier : `Tab` atteint le graphe, les flèches parcourent buckets ou points, `Entrée` déclenche
l'action de clic, `Échap` sort du graphe.

`EX-SCR-189` — **Budget de performance de l'écran B.** Premier tracé des 3 histogrammes en
≤ 400 ms après réception des données pour `n ≤ 20 000`. Recalcul complet des 14 graphes après
un filtre de classe R en ≤ 300 ms pour `n ≤ 20 000` et ≤ 1 200 ms pour `n ≤ 200 000`.
Tracé de `G4` à 60 images par seconde pendant un zoom, pour `n ≤ 5 000` points en SVG et
`n ≤ 100 000` en canvas.

`EX-SCR-190` — **Aucun graphe ne se redessine au survol d'un autre graphe.** La surbrillance de
liaison croisée est appliquée par changement de classe ou d'opacité, sans recalcul de mise à
l'échelle : un axe qui bouge au survol rend toute comparaison impossible.

`EX-SCR-191` — **Titre de chaque graphe, texte exact** : `G1` `Offres par prix` ·
`G2` `Offres par kilométrage` · `G3` `Offres par année` ·
`G4` `Prix × année × kilométrage` · `G5` `Prix médian par année` ·
`G6` `Dépréciation (base 100)` · `G7` `Densité prix × km` ·
`G8` `Écart au prix attendu` · `G9` `Répartition par carburant` ·
`G10` `Prix par tranche de kilométrage` · `G12` `Évaluation de prix AutoScout24` ·
`G13` `Type de vendeur` · `G14` `Prix médian par puissance` ·
`G15` `Répartition par pays`. Chaque titre est suivi de l'effectif du graphe entre parenthèses
lorsque celui-ci diffère de l'effectif de l'en-tête statistique.

`EX-SCR-192` — **Le numéro `G11` n'est pas attribué.** Il correspondait au graphe « effectif
par tranche d'âge », écarté pour redondance avec `G3` combiné à `G5`. Le trou de numérotation
est conservé pour que les références des rapports de revue restent stables.

---

## 7. Écrans additionnels proposés

Les quatre écrans de cette section sont des **ajouts de l'agent `req-screens`**. Chacun est
justifié en une phrase. Aucun n'est nécessaire au fonctionnement des écrans A et B, et chacun
peut être retiré du périmètre par `req-lead` sans casser les parcours cibles.

### 7.1 Écran C — Comparaison de modèles **[AJOUT]**

`EX-SCR-193` — **Justification en une phrase** : l'écran A produit naturellement une liste
courte de modèles candidats, et sans écran de comparaison l'utilisateur doit tenir plusieurs
distributions en mémoire en naviguant d'un écran B à l'autre.

`EX-SCR-194` — **Route** : `/comparer?m=<modelId>,<modelId>[,<modelId>][,<modelId>]&<filtres>`.
**Condition d'affichage** : de 2 à 4 identifiants de modèle. Avec 1 seul, redirection vers
l'écran B ; avec 0, redirection vers l'écran A. Au-delà de 4, les identifiants surnuméraires
sont ignorés et un bandeau indique `<k> sélections ignorées — maximum 4`.
Justification du plafond 4 : à 4 colonnes en régime `large` (1 680 px de contenu), chaque
colonne mesure 396 px, largeur en dessous de laquelle un histogramme cesse d'être lisible
(minimum de 280 px de zone de tracé plus les axes).

```
+==========================================================================================+
| S0 + C1 bandeau de filtres (partage, s'applique aux 4 colonnes simultanement)            |
+==========================================================================================+
| Comparer 3 modeles                          [ + Ajouter un modele ]  [ Tout retirer ]    |
+--------------------+--------------------+--------------------+--------------------------+
| OPEL CORSA       x | VW POLO          x | RENAULT CLIO     x |                          |
| 1 281 offres       | 2 410 offres       | 1 905 offres       |                          |
| med. 12 900 EUR    | med. 14 200 EUR    | med. 11 800 EUR    |                          |
| km med. 78 000     | km med. 71 000     | km med. 84 000     |                          |
| 1re immat. 2018    | 1re immat. 2019    | 1re immat. 2017    |                          |
+--------------------+--------------------+--------------------+--------------------------+
| G1 prix (echelle commune, bornes = union des 3 perimetres)                               |
|  [histogramme]     |  [histogramme]     |  [histogramme]     |                          |
+--------------------+--------------------+--------------------+--------------------------+
| G3 annee (echelle commune)                                                               |
+--------------------+--------------------+--------------------+--------------------------+
| G5 prix median par annee - SUPERPOSE en un seul graphe, une couleur par modele           |
+==========================================================================================+
```

`EX-SCR-195` — **Échelles communes obligatoires.** Tout graphe répété par colonne partage les
**mêmes bornes d'axe** sur toutes les colonnes, calculées sur l'union des périmètres comparés.
Un graphe dont les axes diffèrent d'une colonne à l'autre rendrait la comparaison visuelle
fausse ; c'est l'erreur la plus probable d'implémentation, d'où cette exigence explicite. Un
indicateur `échelle commune` est affiché à côté de chaque titre de rangée.

`EX-SCR-196` — **Graphes présents sur l'écran C, exactement quatre rangées** : `G1` par colonne,
`G3` par colonne, `G5` **superposé** (une courbe par modèle, une couleur de la palette `Q`,
légende commune), et une rangée `Synthèse` reprenant les statistiques de l'en-tête de l'écran B
sous forme de tableau à double entrée. `G4`, `G7` et `G8` ne sont **pas** répliqués : leur
lecture exige la largeur pleine, et la comparaison de quatre nuées superposées est illisible
(les points de deux modèles occupent la même région du plan prix × année).

`EX-SCR-197` — **Colonne vide.** Une colonne non pourvue affiche un bloc en pointillé de même
dimension portant `+ Ajouter un modèle`, qui ouvre le sélecteur `G`.

`EX-SCR-198` — **Retrait d'un modèle.** Croix dans l'en-tête de colonne ; le retrait recalcule
les bornes d'échelle communes et anime la fermeture de la colonne en 200 ms. Passer sous
2 modèles redirige vers l'écran B du modèle restant.

`EX-SCR-199` — **Responsive de l'écran C.** En `intermédiaire`, 2 colonnes visibles et la
rangée devient défilable horizontalement, avec des repères de colonne collants en haut. En
`compact`, le comparatif devient **un tableau unique** à une ligne par statistique et une
colonne par modèle, défilable horizontalement, et les histogrammes par colonne sont remplacés
par des sparklines de 60 × 24 px : à moins de 396 px de largeur, un histogramme complet n'est
pas lisible, et une sparkline au moins situe la forme de la distribution.

`EX-SCR-200` — **États de l'écran C** : `ET-CHARGE-INIT` colonne par colonne (chaque colonne
charge indépendamment) ; un modèle en erreur laisse sa colonne en état d'erreur individuel sans
affecter les autres ; un modèle à `n = 0` affiche sa colonne avec `aucune offre` et est **exclu
du calcul des bornes communes**.

### 7.2 Écran D — Annonces du modèle **[AJOUT]**

`EX-SCR-201` — **Justification en une phrase** : un outlier repéré sur un graphe n'a aucune
valeur si l'on ne peut pas ouvrir l'annonce correspondante, et l'écran D est la seule sortie de
l'application vers une action.

`EX-SCR-202` — **Route** :
`/marche/:makeId-:makeSlug/:modelId-:modelSlug/annonces?<filtres>[&sel=<empreinte>]`.
Le paramètre `sel` restreint la liste à une sélection de brossage venue de l'écran B.

`EX-SCR-203` — **Structure** : un tableau dense, une ligne par annonce, hauteur de ligne 44 px,
en-tête de colonne collant. Colonnes, dans cet ordre, **toutes issues de champs relevés en
§2.3** :

| Colonne | Champ source | Format | Triable |
|---|---|---|---|
| Version | `modelVersionInput` | texte tronqué à 40 car. | non (texte libre non normalisé) |
| Prix | `prices.public.amountInEUR.raw` | `EX-SCR-3` | oui |
| Écart au prix attendu | calculé (`G8`) | `± <n> € (± <p> %)` | oui |
| Km | `condition.mileageInKm.raw` | `EX-SCR-5` | oui |
| 1ʳᵉ immat. | `condition.firstRegistrationDate` | `MM/AAAA` | oui |
| Année-modèle | `modelYear` | `mod. AAAA` | oui |
| Puissance | `engine.power.*` | `EX-SCR-7` | oui |
| Carburant | `fuels.fuelCategory.formatted` | libellé FR relevé | oui |
| Conso. | `consumption.combinedWithFallback` | `EX-SCR-8` | oui |
| CO₂ | `co2emissionInGramPerKmWithFallback` | `EX-SCR-8` | oui |
| Propriétaires | `condition.numberOfPreviousOwnersExtended.raw` | entier | oui |
| Évaluation AS24 | `prices.public.evaluation.category` | jeton coloré | oui |
| Vendeur | `seller.type` | `Particulier` / `Professionnel` | oui |
| Pays / CP | `location.countryCode` + `location.zip` tronqué | `Belgique · 10xx` | oui |
| TVA | `prices.public.taxDeductible` | jeton `TVA déd.` ou vide | oui |
| — | `details.webPage` | bouton `Ouvrir ↗` | non |

`EX-SCR-204` — **Colonnes interdites.** Ne figurent dans ce tableau ni `seller.contactName`, ni
`seller.companyName`, ni `seller.id`, ni `location.city`, ni aucune image (`media.images[]`).
Motif : règle R3 et §2.5 de `FINDING-allowed-surface.md`, qui a relevé un **nom de personne
physique** dans `seller.contactName`. L'écran ne peut pas afficher ce qui n'entre pas dans le
schéma, et le schéma n'a pas de colonne pour cela. Critère de recette : un test échoue si l'un
de ces cinq noms de champ apparaît dans le code de l'écran D.

`EX-SCR-205` — **Miniatures d'image : écartées.** `media.images[]` existe mais afficher les
photos d'annonces reviendrait à republier le contenu de la source, ce que `00-CONTEXT.md`
exclut. Le lien sortant remplace la miniature. Décision écrite pour qu'elle ne soit pas
« oubliée » comme une simple omission.

`EX-SCR-206` — **Tri.** Par défaut : écart au prix attendu croissant (les meilleures affaires
en tête), ce qui est cohérent avec l'objet de l'application. Le tri par colonne est unique
(pas de tri multi-colonnes) ; le sens est indiqué par un chevron dans l'en-tête. Les valeurs
absentes sont **toujours placées en fin de tri**, quel que soit le sens, et non traitées comme
des zéros.

`EX-SCR-207` — **Ligne mise en évidence.** Une ligne dont l'écart au prix attendu est inférieur
au P10 des écarts reçoit un liseré gauche de 3 px de la teinte froide de `G8`. Aucune autre
mise en forme conditionnelle : au-delà d'un critère, un tableau coloré n'est plus lisible.

`EX-SCR-208` — **Volumétrie.** Rendu virtualisé au-delà de 200 lignes, au plus 60 lignes
montées. Aucune pagination numérotée. Compteur permanent `<n> annonces` en pied de tableau.

`EX-SCR-209` — **Responsive de l'écran D.** En `intermédiaire`, les colonnes `Année-modèle`,
`Conso.`, `CO₂` et `TVA` sont masquées et accessibles par un dépliement de ligne (chevron en
première colonne). En `compact`, le tableau devient une **liste de cartes** de 132 px, chacune
portant : version, prix, écart, km, première immatriculation, carburant, vendeur et le bouton
`Ouvrir ↗` ; l'en-tête de tri devient un bouton `Trier par …`.

`EX-SCR-210` — **États de l'écran D** : `ET-VIDE-FILTRES` avec le bloc d'`EX-SCR-26` ;
`ET-CHARGE-INIT` avec 12 lignes squelettes ; `ET-CHAMP-MANQUANT` cellule par cellule
(`EX-SCR-34`) ; `ET-PARTIEL-COUVERTURE` avec le bandeau `C3`, dont le libellé précise ici
`<n_obs> annonces listables sur <n_tot> annoncées` — la nuance est essentielle : l'écran D ne
peut lister que ce qui a été échantillonné.

### 7.3 Écran E — Recherches enregistrées **[AJOUT]**

`EX-SCR-211` — **Justification en une phrase** : un état d'analyse peut porter jusqu'à
60 filtres, et le reconstituer à la main serait plus long que l'analyse elle-même.

`EX-SCR-212` — **Route** : `/recherches`. **Structure** : liste verticale de cartes de 96 px,
une par recherche, portant : le nom donné par l'utilisateur (60 car. max), la description
générée des filtres actifs (tronquée à 2 lignes), le périmètre (`Toutes marques` ou
`<Marque> <Modèle>`), l'effectif au moment de l'enregistrement, l'effectif actuel, et l'écart
entre les deux au format `+ 34 offres depuis le 02/09`. Trois boutons par carte : `Ouvrir`,
`Renommer`, `Supprimer`.

`EX-SCR-213` — **L'écart d'effectif est la valeur ajoutée de l'écran** : il transforme une
recherche enregistrée en veille de marché. Un écart positif est affiché en teinte froide, un
écart négatif en gris. Si le périmètre n'est plus calculable (modèle absent du snapshot), la
carte affiche `Périmètre indisponible dans le snapshot du <date>` et le bouton `Ouvrir` reste
actif (`EX-SCR-101`).

`EX-SCR-214` — **États** : liste vide → bloc centré `Aucune recherche enregistrée` avec la
phrase `Enregistrez une recherche depuis le bandeau de filtres` et un bouton
`Aller au survol du marché`. Suppression → confirmation en ligne dans la carte
(`Supprimer « <nom> » ? [Supprimer] [Annuler]`), jamais une fenêtre modale. Le CRUD, la
persistance et les limites de nombre appartiennent à `req-behaviour`.

### 7.4 Écran G — Sélecteur marque / modèle **[AJOUT, quasi obligatoire]**

`EX-SCR-215` — **Justification en une phrase** : 295 marques et 4 955 modèles ne peuvent pas
tenir dans une liste déroulante, et le filtre `mmmv` est l'axe de navigation entre les deux
écrans imposés — sans ce sélecteur, l'écran B est inatteignable autrement que par un clic sur
une zone-modèle.

```
+============================================================+
| Selectionner marque et modele                          [x] |
+----------------------+-------------------------------------+
| [ Rechercher... ]    | [ Rechercher un modele...        ]  |
+----------------------+-------------------------------------+
| Volkswagen   12 480 >| [ ] Tous les modeles Opel     5 220 |
| BMW           9 105 >| [x] Corsa                     1 281 |
| Opel      *   5 220 v| [ ] Astra                       912 |
| Audi          4 980 >| [ ] Insignia                    441 |
| ...  (295 marques,   | [ ] Mokka                       388 |
|       virtualisees)  | ... (liste virtualisee)             |
+----------------------+-------------------------------------+
| 1 marque, 1 modele selectionnes    [ Annuler ] [ Appliquer ]|
+============================================================+
```

`EX-SCR-216` — **Structure à deux panneaux** : marques à gauche (largeur 280 px, liste
virtualisée, triée par effectif décroissant puis alphabétiquement), modèles de la marque
sélectionnée à droite. Chaque panneau a son propre champ de recherche, insensible à la casse et
aux diacritiques, filtrant par sous-chaîne. Chaque entrée porte son effectif d'offres dans le
périmètre filtré courant ; une entrée à effectif 0 reste affichée en gris et cliquable
(`EX-SCR-89`). Une case `Tous les modèles <Marque>` en tête du panneau droit pose la marque
sans modèle. Sélection multiple autorisée, plafonnée à **12 couples** (au-delà, la chaîne
`mmmv` devient ingérable et le bandeau des filtres actifs illisible) ; le dépassement affiche
`Maximum 12 sélections`. La modale est refermable par `Échap` et `Annuler` sans appliquer, et
`Appliquer` pose le filtre `mmmv` et ferme. En régime `compact`, les deux panneaux deviennent
deux étapes successives plein écran avec un bouton `Retour aux marques`.

---

## 8. Champs manquants, affichages non réalisables, alternatives

Cette section est la contrepartie de l'interdiction d'inventer des données. Elle recense chaque
affichage que la mission, le commanditaire ou le bon sens analytique appellerait, et pour lequel
la source relevée ne fournit pas le champ.

`EX-SCR-217` — **Les fourchettes de prix, d'année et de kilométrage de l'écran A ne sont pas
disponibles comme agrégat de la source.** `topModels` ne donne que `listingsCount` et
`priceInfo` ne donne que des minima (`FINDING-allowed-surface.md` §2.1 et §2.2).
**Alternative retenue** : calcul sur les annonces échantillonnées, avec l'indicateur de
couverture obligatoire d'`EX-SCR-115` et la mention `Fourchettes indisponibles` d'`EX-SCR-116`
lorsque l'échantillon est vide. **Ce que cela interdit** : présenter ces fourchettes comme des
fourchettes de marché sans qualificatif. Le libellé d'infobulle est normatif.

`EX-SCR-218` — **La boîte de vitesses n'existe pas dans les 40 champs d'annonce relevés.**
Conséquence : le filtre `gear` est de classe T (transmis à la source) et **aucun graphe de
répartition par boîte n'est spécifié**. **Alternatives, par ordre de préférence** :
(a) le `DataProvider` expose un indicateur de capacité `hasGearbox` et l'écran B rend un graphe
`G16 — Répartition par boîte` **uniquement** si cet indicateur est vrai, le bloc étant sinon
absent du DOM (`ET-CHAMP-ABSENT-SOURCE`) ; (b) à défaut, l'information reste accessible en
posant le filtre `gear` et en lisant la variation de l'en-tête statistique, ce qui est
explicitement documenté dans le panneau `Diagnostic`. **Ce qui est interdit** : dériver la boîte
par expression régulière sur `modelVersionInput` et l'afficher comme une donnée. Si cette
dérivation est un jour faite, elle doit porter une colonne `boîte (déduite)` et un jeton
`déduit` sur chaque valeur.

`EX-SCR-219` — **Aucune date de publication d'annonce n'est relevée.** Seul
`publication.isNew` existe. Conséquences : le filtre `adage` (En ligne depuis) est de classe T ;
**aucun affichage d'ancienneté d'annonce n'est spécifié** ; et le tri `age`
(« Annonces les plus récentes d'abord ») de l'énumération `sort` **n'est pas proposé** sur
l'écran D. **Alternative** : si le `DataProvider` fournit une date d'ingestion par annonce, une
colonne `Vue le` peut être ajoutée à l'écran D avec le libellé
`Date de première observation par KYCAR` — jamais `Mise en ligne le`, qui serait faux.

`EX-SCR-220` — **Champs présents mais non filtrables** : `consumption.combinedWithFallback` et
`co2emissionInGramPerKmWithFallback` (Z5). Conséquence : ils sont **affichés** (écran D,
infobulle de `G4`) et **jamais** proposés comme filtre, faute de paramètre à sérialiser. Aucun
graphe ne leur est consacré (`EX-SCR-172`, motif de non-cliquabilité).

`EX-SCR-221` — **La carrosserie n'est relevée qu'au niveau modèle** (`topModels.bodyTypes`), pas
au niveau annonce. Conséquence : le filtre `body` est de classe T sur l'écran B et de classe R
sur l'écran A ; et un jeton de carrosserie peut être affiché dans l'en-tête de l'écran B
(`Berline`) mais **aucun graphe de répartition par carrosserie n'est spécifié à l'intérieur d'un
modèle**, où elle est de toute façon constante ou quasi constante.

`EX-SCR-222` — **La province belge n'est pas obtenable de la source** : `region` a un domaine
inconnu et est désactivé (Z3), et le code postal est tronqué à `NNxx` par contrainte RGPD.
Conséquence : aucune vue géographique infranationale n'est spécifiée. **Alternative** : une
table de correspondance CP → province, produite par KYCAR, permettrait `G16b — Répartition par
province` ; cet écran est conditionné à la production de cette table **et** à une couverture
≥ 60 %, faute de quoi les effectifs par province tomberaient sous 3 (`EX-SCR-172`).

`EX-SCR-223` — **Sémantiques non prouvées propagées à l'écran.** Les filtres `eq` (ET présumé),
`emclass` et `ensticker` (« au moins » présumé) et `prevownersid` (« au plus » présumé) portent
l'icône d'`EX-SCR-85`. **Aucun agrégat local n'utilise ces sémantiques** : un agrégat construit
sur une sémantique présumée produirait un chiffre faux sans le signaler. C'est la raison pour
laquelle `prevownersid`, bien que de classe R, n'alimente aucun graphe et n'apparaît que comme
colonne brute de l'écran D.

`EX-SCR-224` — **Récapitulatif des blocs supprimés faute de champ.** Le panneau `Diagnostic`
(`EX-SCR-53`) liste, à chaque chargement, les blocs non rendus et leur motif, en reprenant
littéralement les identifiants de cette section : `G16 boîte de vitesses — champ absent
(EX-SCR-218)`, `colonne Vue le — champ absent (EX-SCR-219)`, `G16b province — champ absent
(EX-SCR-222)`, et tout bloc désactivé par `ET-CHAMP-ABSENT-SOURCE`. Critère de recette : le
panneau affiche au moins 3 entrées sur le jeu de données synthétique du lot D3.

---

## 9. Matrice de vérification

Chaque exigence est vérifiable. Le tableau ci-dessous donne le moyen de contrôle par famille ;
`req-lead` peut le ventiler exigence par exigence dans la matrice de traçabilité de
`REQUIREMENTS.md`.

| Famille | Exigences | Moyen de vérification |
|---|---|---|
| Formats d'affichage | `EX-SCR-1` → `EX-SCR-14` | tests unitaires de formatage sur un jeu de 30 valeurs limites (0, 1, 999, 1 000, 1 000 000, valeur nulle, valeur absente, négative) |
| Échelles de graphe | `EX-SCR-15` → `EX-SCR-19` | test d'instantané des bornes et du type d'échelle calculés, sur 5 distributions de référence (uniforme, log-normale, bimodale, à outlier unique, à effectif 1) |
| Jetons de mise en page | `EX-SCR-20` → `EX-SCR-22` | captures d'écran automatisées à 375 × 812, 1 024 × 768, 1 440 × 900, 1 920 × 1 080 ; comptage des cartes et zones visibles |
| États dégradés | `EX-SCR-23` → `EX-SCR-39` | 9 jeux de données pathologiques (0, 1, 3, 5, 9, 10, 20 000, 200 000 annonces ; provider en erreur ; cache périmé) ; assertion sur le texte affiché |
| Coquille et navigation | `EX-SCR-40` → `EX-SCR-54` | tests de bout en bout : conservation des filtres sur A→B→A, égalité de la chaîne de requête, reproduction d'un écran depuis son URL |
| Bandeau de filtres | `EX-SCR-55` → `EX-SCR-103` | test de complétude comparant `data/reference/filters.json` (101 entrées) à la table d'affectation `EX-SCR-82` ; test de 60 filtres simultanés ; comptage des jetons `T` |
| Écran A | `EX-SCR-104` → `EX-SCR-138` | tests de rendu sur 1, 6, 20, 40, 295 marques et sur une marque à 80 modèles ; assertion sur la présence des 3 fourchettes de chaque zone-modèle |
| Écran B | `EX-SCR-139` → `EX-SCR-192` | tests de rendu à `n` = 0, 1, 3, 5, 9, 10, 40, 400, 5 000, 20 000 ; test d'égalité des empreintes de filtre des 14 graphes ; test de présence de la table de données équivalente pour chaque graphe |
| Écrans additionnels | `EX-SCR-193` → `EX-SCR-216` | tests de rendu à 2, 3, 4 et 5 modèles comparés ; test d'échelle commune ; test d'absence des 5 champs interdits dans l'écran D |
| Champs manquants | `EX-SCR-217` → `EX-SCR-224` | test statique : aucun composant ne lit un champ absent de la liste des 40 champs autorisés ; le panneau `Diagnostic` recense au moins 3 blocs supprimés |
| Formulations mesurables | ensemble | revue lexicale automatisée : aucune occurrence de « rapide », « intuitif », « moderne », « clair », « performant », « ergonomique » sans chiffre ou critère observable dans la même phrase (critère S7 de la phase 2.1) |

### Notes de remise à `req-lead`

1. **Chevauchements assumés avec `req-behaviour`** : `EX-SCR-49` à `EX-SCR-52` (routes,
   historique, partageabilité), `EX-SCR-86` (débounce et application immédiate), `EX-SCR-94` et
   `EX-SCR-211` à `EX-SCR-214` (CRUD des recherches enregistrées). Ces points doivent être
   arbitrés une seule fois ; en cas de conflit, la version de `req-behaviour` prime et les
   exigences ci-dessus doivent être réécrites en référence, pas dupliquées.
2. **Chevauchements assumés avec `req-data`** : les seuils d'effectif d'`EX-SCR-33`, la
   définition des buckets (`EX-SCR-145` à `EX-SCR-147`) et la méthode de `G8` (`EX-SCR-164`)
   touchent au modèle d'agrégation. La présente section fixe les seuils **d'affichage** ;
   `req-data` doit fixer les définitions mathématiques et vérifier la cohérence des seuils.
3. **Trois arbitrages pris sans instruction du commanditaire**, à confirmer :
   la lecture littérale de « graphe nombre d'offre - prix » comme une nuée empilée `G4a`
   (`EX-SCR-151`) ; l'absence d'écran de détail d'annonce (`EX-SCR-41`) ; le plafond de
   20 marques affichées lorsque aucun filtre n'est posé (`EX-SCR-125`).
