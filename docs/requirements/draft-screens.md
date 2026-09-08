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

`EX-SCR-3` — **Prix.** Format `<entier> €`, **arrondi selon `EX-DATA-6`** (au plus proche, demi
vers l'infini en valeur absolue) ; **`Math.floor` et toute troncature vers le bas sont
interdits**. Symbole `€` précédé d'une espace insécable U+00A0, jamais de décimales. Exemple :
`18 950 €`. Un prix nul ou absent suit `EX-SCR-36`.

`EX-SCR-4` — **Fourchette de prix.** Format `<min> – <max> €` : le symbole monétaire n'apparaît
qu'une fois, en fin de chaîne ; le séparateur est le tiret demi-cadratin U+2013 entouré d'espaces
insécables. Exemple : `4 200 – 21 900 €`. Si les deux bornes sont **égales après l'arrondi de
présentation** (`EX-SCR-3`), afficher la valeur seule : `9 500 €`. La comparaison ne porte jamais
sur les valeurs en double précision d'`EX-DATA-63`. Ce format ne décide **pas** quelles bornes il
met en forme : l'écran A met en forme `displayRange`, les écrans B et D `rawRange` (`R-A05`).

`EX-SCR-5` — **Kilométrage.** Format `<entier> km`, arrondi à la centaine la plus proche
au-dessus de 10 000 km, à l'unité en dessous. Exemples : `8 421 km`, `128 400 km`.
Fourchette : `12 000 – 210 000 km` (même règle qu'`EX-SCR-4`).
Les **bornes d'une fourchette** ne suivent pas l'arrondi à la centaine la plus proche : borne
basse au **plancher** de centaine, borne haute au **plafond** de centaine, même principe
qu'`EX-DATA-67`, de sorte que la fourchette affichée contienne toujours toutes les valeurs
observées. L'arrondi à la centaine la plus proche est réservé aux **valeurs unitaires** (le
kilométrage d'une annonce). Exemple : `min = 10 049`, `max = 210 049` → `10 000 – 210 100 km`.
Si les deux bornes sont **égales après l'arrondi de présentation**, afficher la valeur seule ; la
comparaison ne porte jamais sur les valeurs en double précision d'`EX-DATA-63`.

`EX-SCR-6` — **Année.** Deux notations distinctes, jamais interchangées :
- **Année de première immatriculation** (champ `condition.firstRegistrationDate`) — format
  `MM/AAAA` sur les fiches et infobulles (`03/2017`), format `AAAA` sur les axes de graphe et les
  fourchettes (`2017`). Une fourchette s'écrit `2014 – 2021`.
- **Année-modèle** (champ `modelYear`) — format `AAAA` précédé du qualificatif `mod.` lorsqu'elle
  est affichée à côté d'une première immatriculation : `mod. 2018`. Les deux ne sont jamais
  additionnées ni moyennées ensemble.
Si les deux bornes d'une fourchette d'années sont **égales après l'arrondi de présentation**,
afficher la valeur seule : `2017`. La comparaison ne porte jamais sur les valeurs en double
précision d'`EX-DATA-63`.

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
99,5 et 100 s'affiche `> 99 %`. La somme affichée d'une répartition est corrigée par la
**méthode du plus grand reste** pour totaliser exactement `100 %`. **À reste égal**, le point est
attribué à la classe de plus grand **effectif brut**, puis — à effectif égal — à la première par
libellé selon `EX-DATA-70bis`. La correction du plus grand reste s'applique **avant** les
substitutions `< 1 %` et `> 99 %`, qui sont purement typographiques et **ne modifient pas** la
valeur corrigée : une répartition dont la somme des libellés ne fait pas visuellement 100 % à
cause d'une substitution porte la mention `arrondis` en infobulle. Une classe dont la part
corrigée vaut `0` s'affiche `0 %` et non `< 1 %`.

`EX-SCR-12` — **Statistiques.** Les libellés normatifs sont : `médiane`, `moyenne`, `min`, `max`,
**`P5`**, `P25`, `P75`, **`P95`**, `écart interquartile`. `P10` et `P90` ne sont **pas** des
statistiques de KYCAR : l'annexe A ne les définit pas et aucun écran ne les affiche. Le mot
« moyenne » n'est jamais employé pour désigner une médiane. Toute statistique affichée porte, en
infobulle, l'effectif sur lequel elle est calculée : `médiane 18 950 € (n = 47)`.

`EX-SCR-13` — **Troncature.** Tout libellé susceptible de dépasser sa boîte est tronqué sur une
seule ligne par `text-overflow: ellipsis`, avec l'intégralité du texte dans l'attribut `title`
et dans `aria-label`. Budgets de caractères avant troncature : nom de marque 22, nom de modèle
28, libellé de filtre actif 34, libellé d'axe 20. Aucun texte n'est tronqué au milieu d'un mot
par insertion manuelle de points de suspension dans la chaîne de données. Les budgets sont
exprimés en **groupes de graphèmes étendus** (`Intl.Segmenter('fr', {granularity:'grapheme'})`
ou équivalent) et la troncature ne coupe **jamais** à l'intérieur d'un graphème.

`EX-SCR-14` — **Langue.** L'intégralité de l'interface est en français de Belgique. Les libellés
d'énumération proviennent de la colonne « Libellé FR » de `REF-filters.md`, sans reformulation :
un libellé relevé (`SUV/4x4/Pick-Up`, `Voiture récente`, `Ancêtre`) est repris à l'identique,
même s'il est inhabituel, afin que l'utilisateur retrouve le vocabulaire de la source.

### 1.2 Échelles de graphe

`EX-SCR-15` — **Échelle par défaut : linéaire** sur les deux axes de tout graphe. Justification :
l'axe des effectifs d'un histogramme doit permettre la comparaison additive de deux barres, ce
qu'une échelle logarithmique interdit.

`EX-SCR-16` — **Bascule logarithmique conditionnelle.** Un axe d'effectif propose une bascule
`Échelle log` **uniquement** lorsque le rapport entre l'effectif du **bin fermé**
(`open = false`) le plus peuplé et celui du **bin fermé non vide** le moins peuplé est ≥ 50. Les
bins de débordement, qui ne sont jamais représentés à l'échelle (`EX-DATA-79`), n'entrent **ni**
au numérateur **ni** au dénominateur. S'il existe moins de deux bins fermés non vides, la
bascule est **absente du DOM**. En dessous de 50, la bascule est absente du DOM. La bascule n'est
jamais active par défaut, et son état est mémorisé par graphe dans l'URL (paramètre
`g<n>log=1`), pas globalement.

`EX-SCR-17` — **Axe des prix : linéaire, jamais logarithmique par défaut.** Justification : le
parcours cible est « budget 20 000 € » ; un axe log rendrait illisible la position d'un budget
absolu. Une bascule log est offerte sur l'axe des prix du seul graphe `G7` (densité prix × km),
où l'étalement du haut de gamme écrase la masse.

`EX-SCR-18` — **Bornes d'axe.** Les axes d'un **histogramme** sont bornés par la grille de `BIN`
(`EX-DATA-75`) ; cette exigence n'introduit aucun autre niveau de percentile. Les axes d'un
graphe **qui n'est pas un histogramme** (`G4`, `G7`, `G10`) sont bornés à `Q(V, 0,01)` et
`Q(V, 0,99)` de la donnée tracée, au sens d'`EX-DATA-62`. Les points hors bornes ne sont
**jamais supprimés** : dans un histogramme ils sont portés par les bins de débordement
d'`EX-DATA-79` ; dans un graphe de nuée ils sont tracés sur la bordure de la zone de tracé avec
un marqueur de dépassement dont l'effectif est affiché. Un bin de débordement est affiché avec
une trame diagonale et un contour pointillé pour le distinguer d'un bin régulier, et son
**étiquette est celle d'`EX-DATA-79`** — les formes `< <borne>` et `> <borne>` propres à cette
exigence sont supprimées.
**Justification** : « P1 » et « P99 » n'étaient rattachés à aucune définition de quantile et
introduisaient deux niveaux de percentile que l'annexe A ne publie pas. La détection d'outliers
est l'objet de l'application ; masquer les extrêmes détruirait la fonction.

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
sauf `Exporter` — le contrôle `Exporter` visé étant celui de la **barre de synthèse de
l'écran A** (`EX-SCR-107`, `ARB-44`), et sur l'écran B celui de l'en-tête (`EX-SCR-142`).

`EX-SCR-24` — **`ET-CHARGE-MAJ` — recalcul après changement de filtre.** Le contenu précédent
**reste affiché**, atténué à 45 % d'opacité, non cliquable, surmonté d'une barre de progression
indéterminée de 3 px collée sous le bandeau de filtres. Un spinner circulaire de 24 px
n'apparaît qu'au-delà de **400 ms**, centré dans le bloc concerné. Jamais de squelette dans cet
état : remplacer un contenu valide par un squelette fait perdre le repère visuel.
L'utilisateur peut continuer à modifier les filtres ; la requête en cours est alors annulée.

`EX-SCR-25` — **`ET-CHARGE-LOCAL` — recalcul purement local** (filtre de classe R, cf. §4.2).
Aucun indicateur de chargement d'aucune sorte. Budget : 150 ms entre le clic et le
réaffichage complet, mesuré sur 100 000 annonces en mémoire. Au-delà de 150 ms, l'état bascule
sur `ET-CHARGE-MAJ`. L'interdiction de tout indicateur vaut pour un recalcul **unique** ; en
mode groupé (`EX-SRCH-1bis`), l'état passe à `ET-CHARGE-MAJ` et l'indicateur apparaît.

`EX-SCR-26` — **`ET-VIDE-FILTRES` — zéro résultat, filtres posés.** Bloc centré, largeur
maximale 480 px, comprenant : le titre `Aucune offre ne correspond`, une phrase indiquant le
nombre de filtres actifs (`12 filtres actifs restreignent la recherche.`), et **la liste des
3 filtres les plus restrictifs** — ceux dont le `FacetCount` du retrait complet
(`selectionHashWithoutFilter(filterId)`, `EX-DATA-110bis`) est le plus élevé —, sous forme de
boutons de retrait au format normatif `retirer « <libellé> » : <k> offres de plus`, `k` étant la
différence entre l'effectif de `selectionHashWithoutFilter(filterId)` et l'effectif courant
(`ARB-39`). Le calcul est un « leave-one-out » sur les filtres de classe R uniquement ; pour un
filtre de classe T, dont le retrait rechargerait le jeu de données local, le bouton affiche
`retirer « <libellé> »` sans chiffre, et ce cas est signalé par l'absence de la mention
« offres de plus », pas par une note séparée.
Actions disponibles : retirer un filtre, `Réinitialiser tous les filtres`, `Enregistrer cette
recherche` (reste actif : une recherche vide est légitime pour une veille).

`EX-SCR-27` — **`ET-VIDE-SANS-FILTRE` — zéro résultat dans l'état `SANS-FILTRE`
(`EX-SCR-27bis`).** Traité comme une **panne** : un jeu de données local vide sans aucun prédicat
utilisateur ne peut être qu'un défaut d'ingestion ou de fourniture. Titre
`Aucune donnée disponible`, mention du champ `snapshot.date` du jeu de données courant, et
bouton `Réessayer`.

`EX-SCR-27bis` — **État `SANS-FILTRE`, définition unique.** L'application est dans l'état
`SANS-FILTRE` lorsque l'**état de filtres utilisateur** est vide, c'est-à-dire lorsque aucun
prédicat n'est appliqué au jeu de données local (`EX-SRCH-18`, `ARB-30`). Les valeurs que
l'adaptateur `DataProvider` injecte dans une requête vers la source (`atype`, `ustate`,
`powertype`, `pricetype`, `cy`) **ne sont pas** des filtres utilisateur et n'ont aucun effet sur
cet état. La contrainte de route de l'écran B (`makeId`, `modelId`) n'est pas un filtre non
plus. Cet état est référencé **par son nom** par `EX-SCR-27`, `EX-SCR-31`, `EX-SCR-125`,
`EX-SCR-126` et `EX-SCR-91`, et sa définition n'est répétée nulle part ailleurs.

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
`Export indisponible sur des données non rafraîchies`). Le contrôle `Exporter` visé est celui de
la **barre de synthèse de l'écran A** (`EX-SCR-107`, `ARB-44`), et sur l'écran B celui de
l'en-tête (`EX-SCR-142`).

`EX-SCR-30` — **`ET-PARTIEL-COUVERTURE` — l'échantillon ne couvre pas la population.**
C'est l'état **normal**, pas exceptionnel, compte tenu de la limite P1 de
`FINDING-allowed-surface.md` (20 annonces observées par page contre un total déclaré bien
supérieur). Il se manifeste par le **bandeau de couverture** défini en `EX-SCR-31`.
**Désambiguïsation (`R-A12`)** : cet identifiant désigne la **couverture d'échantillon**
(`sampleCoverage = listingCount / announcedCount`, `EX-DATA-61bis`) — jamais la couverture
métrique (`metricCoverage_m`) ni la part de prix fermes (`priceQuotedShare`).

`EX-SCR-31` — **`C3` — bandeau de couverture d'échantillon.**
**Désambiguïsation (`R-A12`)** : le composant `C3`, y compris sous son nom usuel « `C3 couverture` »,
désigne exclusivement la **couverture d'échantillon** (`sampleCoverage`, `EX-DATA-61bis`) — jamais
la couverture métrique (`metricCoverage_m`) ni la part de prix fermes (`priceQuotedShare`).
Quand l'état de filtres est vide
(`EX-SCR-27bis`) et que `sampleCoverage` n'est pas `null`, le bandeau affiche
`Statistiques calculées sur <listingCount> annonces observées sur <announcedCount> annoncées —
couverture <p> %`, où `p = 100 × sampleCoverage` arrondi selon `EX-SCR-11`. Jeton vert si
`p ≥ 80`, ambre si `20 ≤ p < 80`, rouge si `p < 20` ; le bandeau est **non refermable** quand
`p < 20`. Deux cas sans jeton coloré et sans pourcentage :
- `announcedCount` est `INCONNU` → `Couverture d'échantillon inconnue — la source n'annonce pas
  d'effectif total pour ce périmètre`. **Jamais 100 %.**
- au moins un filtre est posé → `Couverture d'échantillon non applicable sous filtre —
  <listingCount> annonces observées`.
Le bandeau ne prend jamais `listingCount` pour `announcedCount`.
Un lien `Pourquoi ?` ouvre un panneau latéral de 360 px reprenant textuellement les limites P1
et P2 de `FINDING-allowed-surface.md`, dont l'avertissement que **la représentativité de
l'échantillon n'est pas prouvée** (`adProduct.tier` suggère un tri influencé par le produit
publicitaire).

`EX-SCR-32` — **`ET-TROP-RESULTATS` — la population dépasse le seuil de rendu.** Seuil : écran A,
franchissement de **60 marques** avec au moins un résultat (`EX-SCR-124bis`). Comportement : le
rendu n'est pas dégradé silencieusement. Un bandeau informatif indique
`<n> marques correspondent — affinez pour comparer` (écran A). Le bandeau porte le bouton
`Tout afficher` qui active le rendu virtualisé. Ni le seuil de « plus de 40 marques » ni la
mention « 20 affichées » n'appartiennent plus à cette exigence : les seuils de l'écran A sont
portés par `EX-SCR-124bis` et par lui seul. **`ET-TROP-RESULTATS` ne s'applique pas au nuage `G4`
de l'écran B** (`EX-SCR-177`) : au-delà de `K = 5 000` (`EX-DATA-100`), c'est `EX-SCR-157` qui
gouverne, sans seuil à 20 000 ni graine (`EX-DATA-101` est sans aléa, `EX-DATA-100bis`). Sous ce
régime, les **agrégats restent calculés sur la population entière**, jamais sur l'échantillon
d'affichage — la distinction est écrite dans l'infobulle de chaque statistique concernée — et le
nombre d'outliers annoncé par la nuée et par sa table équivalente (`EX-NFR-15`) est **celui de la
population entière**, jamais celui de l'échantillon tracé. [amendée 2.6 — D-06, D-08]

`EX-SCR-33` — **`ET-EFFECTIF-FAIBLE` — effectif insuffisant pour une statistique.**
**Dans toute cette exigence, `n` désigne `n_m(Σ)` au sens d'`EX-DATA-59` pour la métrique de la
statistique concernée — jamais l'effectif de sélection `N`, qui n'est soumis à aucun palier et
s'affiche toujours tel quel.** Quatre paliers, appliqués uniformément :
- `n = 0` → la statistique n'est pas affichée ; à sa place, le caractère `—` en gris.
- `1 ≤ n ≤ 4` → les valeurs brutes sont affichées, mais **aucun percentile, aucune médiane,
  aucune bande interquartile, aucune régression, aucune détection d'outlier** ; à leur place, la
  mention `n trop faible` et l'effectif exact.
- `5 ≤ n ≤ 11` → médiane, min et max affichés ; percentiles `P5`/`P95`, bande interquartile,
  régression et détection d'outliers **désactivés** ; jeton ambre `n = <n>` accolé au titre.
- `12 ≤ n ≤ 29` → tout est calculé **sauf** la méthode M2 et tout ce qui en dépend : `G8`, le
  prix attendu, `expectedPriceEur`, la colonne « Écart au prix attendu » de l'écran D et le
  liseré d'`EX-SCR-207`. Seule **M1** est disponible (`EX-DATA-84` à `EX-DATA-89`) ; l'écran
  affiche `Prix attendu non calculable — il faut au moins 30 offres comparables`.
- `n ≥ 30` → tout est calculé, M1 et M2 comprises.
Ces seuils sont **uniques pour toute l'application**, valent 12 pour M1 et 30 pour M2
conformément à `EX-DATA-86` et `EX-DATA-90`, et sont testables par jeux de données de tailles
0, 1, 3, 5, 9, 11, 12, 29 et 30.

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
- `prices.public.onRequestOnly = true` → afficher `Prix sur demande`. L'annonce **compte dans
  tout effectif** (`EX-DATA-16(a)`) et est **exclue de toute statistique de prix**, de
  l'histogramme des prix, des deux méthodes de détection et du nuage (`EX-DATA-16(b)` à
  `(e)`) ; elle est comptée dans la note `<k> annonces à prix sur demande`.
- prix absent, ou prix rejeté par la validation du champ 7 → traité comme
  `ET-CHAMP-MANQUANT`, compté dans l'effectif, exclu des statistiques de prix.
- prix **strictement inférieur à 250 €** (`EX-DATA-19`, seuil unique de l'application) →
  l'annonce porte `PRICE_SENTINEL_ABSOLUTE`, **compte dans tout effectif**, et est **exclue de
  `V_price`** au sens d'`EX-DATA-60` : elle n'entre ni dans la médiane, ni dans `G1`, ni dans
  M1, ni dans M2. Elle **reste visible** : jeton `?` cliquable ouvrant l'infobulle
  `Prix inférieur à 250 € — probable annonce de pièce ou erreur de saisie ; exclue des
  statistiques de prix, comptée dans l'effectif`, et elle apparaît dans la liste d'annonces de
  l'écran D. **Le seuil de 100 € est supprimé de cette exigence** : il n'existe plus qu'un seul
  seuil de sentinelle absolue dans l'application.

`EX-SCR-37` — **`ET-HORS-LIGNE`.** Bandeau gris : `Hors ligne — affichage du dernier résultat
chargé`. Tous les contrôles de filtre de classe T sont désactivés avec l'infobulle
`Nécessite une connexion` ; les filtres de classe R restent actifs, puisqu'ils se recalculent
localement. C'est la justification opérationnelle de la distinction R/T. Hors ligne, le jeu de
données local courant est celui de la dernière `localDatasetKey` servie ; les filtres de classe
`T` sont désactivés parce qu'ils exigeraient une nouvelle `localDatasetKey`, et les filtres `R`
restent actifs parce qu'ils s'appliquent en mémoire sur ce jeu (`EX-SRCH-9bis`).

`EX-SCR-38` — **Ordre de priorité des bandeaux.** Au plus **deux** bandeaux simultanés,
empilés dans cet ordre du haut vers le bas :
`ET-ERREUR-PROVIDER` > `ET-HORS-LIGNE` > `ET-PARTIEL-CACHE` > `ET-TROP-RESULTATS` >
`C3 couverture`. Les suivants sont repliés derrière un jeton `+2 avertissements` cliquable.
Hauteur totale des bandeaux plafonnée à 96 px ; au-delà, la zone devient défilante.
**Exception unique au plafond** : le bandeau `C3 couverture` en état non refermable
(`sampleCoverage < 0,20`, `EX-SCR-31`) n'est **jamais** replié et **ne compte pas** dans le
plafond de deux bandeaux ; il s'affiche alors en troisième position et la hauteur maximale de
la zone passe de 96 px à **144 px**. Repliabilité, bandeau par bandeau :
`ET-ERREUR-PROVIDER` non repliable · `ET-HORS-LIGNE` repliable · `ET-PARTIEL-CACHE` repliable ·
`ET-TROP-RESULTATS` repliable · `ET-URL-CORRIGEE` repliable (`ARB-11`) ·
`C3 couverture` repliable **sauf** en état non refermable. L'ordre de priorité devient :
`ET-ERREUR-PROVIDER` > `ET-HORS-LIGNE` > `ET-PARTIEL-CACHE` > `ET-TROP-RESULTATS` >
`ET-URL-CORRIGEE` > `C3 couverture`.

`EX-SCR-38bis` — **`ET-URL-CORRIGEE` — un paramètre d'URL a été corrigé au chargement.**
Bandeau non bloquant, refermable, texte
`Paramètre « <nom> » corrigé : <nature de la correction>, valeur retenue <valeur>` ; une ligne
par paramètre corrigé, au plus trois lignes puis `et <k> autres paramètres corrigés`. Il
s'insère dans l'ordre de priorité d'`EX-SCR-38` **entre `ET-TROP-RESULTATS` et
`C3 couverture`**. Durée de vie : il disparaît au prochain changement de filtre par
l'utilisateur, jamais avant, et n'est pas restauré par un retour arrière vers la même URL
corrigée.

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
filtres actifs), **exactement quatre** onglets de navigation principaux — `Marché`,
`Comparer (n)`, `Recherches`, `Suivis (n)` —, et à droite le jeton de snapshot. `n` est
l'effectif de l'entité correspondante, l'onglet portant son compteur uniquement quand `n ≥ 1`.

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

| Route | Segments | Comportement du dernier lien actif |
|---|---|---|
| `/marche` | `Marché` | — |
| `/marche/:makeId-:makeSlug/:modelId-:modelSlug` | `Marché > <marque> > <modèle>` | `<marque>` ramène à `/marche` avec `make` posé et les autres filtres conservés |
| `…/annonces` | `Marché > <marque> > <modèle> > Annonces` | `<modèle>` ramène à l'écran B, **filtres conservés** ; c'est le chemin de retour nommé de l'écran D |
| `/comparer` | `Marché > Comparaison` | `Marché` ramène à `/marche`, filtres conservés |
| `/recherches` | `Marché > Recherches enregistrées` | idem |
| `/suivis` | `Marché > Modèles suivis` | idem |

La hauteur du fil d'Ariane est fixe quel que soit le nombre de segments ; un segment trop long
est tronqué selon `EX-SCR-13`, jamais replié sur deux lignes.

`EX-SCR-46` — **Double compteur à droite du fil d'Ariane.** Deux nombres, séparés par une barre
verticale : à gauche, `<n> offres` = effectif après application des filtres **hors** taxonomie
marque/modèle ; à droite, `<n> ici` = effectif du périmètre affiché. L'effectif du compteur
`<n> offres` est celui de `selectionHashWithoutTaxonomy` (`EX-DATA-110bis`), avec l'infobulle
`offres correspondant à vos filtres, toutes marques et tous modèles confondus`. Sur l'écran A
les deux sont égaux ; sur l'écran B le second est un sous-ensemble du premier. Justification :
sans ce double compteur, l'utilisateur ne peut pas savoir si un effectif faible vient de ses
filtres ou de la rareté du modèle.

`EX-SCR-47` — **Pied de page, hauteur fixe 32 px**, non collant. Contient obligatoirement la
mention `Source : AutoScout24 — agrégat non affilié`, la date du snapshot, le lien
`Diagnostic` et le lien `Mentions`. Le lien `Mentions` ouvre une **page statique** `/mentions`,
sans donnée de marché, sans état dégradé, hors de l'inventaire des écrans fonctionnels.
Justification de l'obligation : le positionnement juridique de `00-CONTEXT.md` exige que la
nature d'agrégat non affilié soit visible sur chaque écran, pas seulement sur une page dédiée.

`EX-SCR-48` — En régime `compact`, l'en-tête tombe à 44 px, les **quatre** onglets d'`EX-SCR-42`
sont remplacés
par un bouton de menu de 44 × 44 px ouvrant un tiroir latéral plein écran, et le jeton de
snapshot ne conserve que son icône.

### 3.3 Navigation

`EX-SCR-49` — `/` redirige en `301` vers `/marche` sans paramètre.

`EX-SCR-50` — **Tout état d'écran est intégralement encodé dans l'URL** : filtres actifs, tri,
repliements de groupes de filtres, bascules d'échelle logarithmique, et sélection de brossage
sur un graphe. Critère de recette : copier l'URL, l'ouvrir dans une fenêtre vierge, et obtenir
un écran pixel-identique, y compris la sélection de brossage. Le détail du nommage des
paramètres appartient à `req-behaviour`.
La sélection de brossage est encodée par les **bornes d'intervalle des axes du graphe**
(`selx`, `sely` d'`EX-NAV-10bis`), et **non** par une empreinte : une empreinte ne restitue pas
un sous-ensemble d'annonces. Une URL portant `selx`/`sely` restitue la même sélection de
brossage sur tout snapshot où les axes ont un sens, et la restitution est **exacte** au sens de
cette exigence. Le paramètre `sel` de l'écran D porte les mêmes bornes, avec la sémantique de
restriction d'affichage d'`ARB-34`. Toute mention d'une « empreinte » de sélection est
supprimée.

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
et le journal des 10 dernières erreurs de `DataProvider`. L'état
`présent mais vide sur <k> annonces` lit `unknownCountByField[<champ>]` (`EX-DATA-106`) et rien
d'autre : aucun comptage ad hoc n'est autorisé ailleurs. Le panneau affiche en outre
`duplicateValueConflictCount` (`EX-DATA-106`), au format
`<k> annonces reçues en deux versions aux valeurs différentes`. Justification : sans cet écran,
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
| [Carrosserie v] [Boite v] [Vendeur v] [Pays v] [Rechercher un filtre] [3 filtres actifs] |
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

La classe `R` du filtre primaire `Carrosserie` en mode 1 est justifiée par `Model.bodyTypes`
(`EX-DATA-105`) ; si `bodyTypes` est un tableau vide pour un modèle, ce modèle **ne satisfait
aucun** prédicat `body` et la note d'exclusion `EX-SCR-178` annonce
`<k> modèles sans carrosserie renseignée`.

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
Concerne : `emclass`, `ensticker`, `bot`, `prevownersid`, `zipr`, `ustate`,
`ocs_listing`, `lstagr`, `sort`. `adage` est **exclu du périmètre** par `filters-scope.json`
(motif `TELEMETRIE_AS24`) : il n'a donc ni contrôle ni classe et ne figure pas dans cette liste.

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
en surbrillance. Concerne **exactement** les couples `from`/`to` retenus par
`filters-scope.json` (types `range_min` et `range_max` appariés par préfixe de nom), énumérés
nominativement ici :

| Couple | Libellé relevé | Groupe |
|---|---|---|
| `pricefrom` / `priceto` | Prix de | `prix` |
| `financeratefrom` / `financerateto` | Mensualité de financement de | `prix` |
| `leasingratefrom` / `leasingrateto` | Loyer de leasing de | `prix` |
| `lsdufrom` / `lsduto` | Durée de leasing de | `prix` |
| `kmfrom` / `kmto` | Kilométrage de | `kilometrage` |
| `fregfrom` / `fregto` | Première immatriculation de | `immatriculation` |
| `modelyearfrom` / `modelyearto` | Année-modèle de | `immatriculation` |
| `powerfrom` / `powerto` | Puissance de | `motorisation` |
| `ccmfrom` / `ccmto` | Cylindrée de | `motorisation` |
| `doorfrom` / `doorto` | Nombre de portes (min) | `carrosserie` |
| `seatsfrom` / `seatsto` | Nombre de places (min) | `carrosserie` |
| `erfrom` / `erto` | Autonomie électrique de | `ecologie` |

Un paramètre de borne **isolée**, sans jumeau dans le catalogue — cas de `lsyeinmifrom`
(kilométrage annuel de leasing) — reçoit un contrôle à **borne unique**, libellé
`au moins <valeur>`, sérialisé comme un `from` seul (`EX-NAV-7`). Tout filtre de
`filters-scope.json` de type `range_min` sans `range_max` de même préfixe relève de ce contrôle.

`EX-SCR-68` — **Validation d'intervalle.** Si `from > to`, les deux champs passent en bordure
rouge, le message `La borne basse dépasse la borne haute` s'affiche sous le contrôle, et le
filtre **n'est pas appliqué** ; l'ancienne valeur reste en vigueur. Aucune permutation
automatique des bornes : elle masquerait une faute de frappe. Cette règle porte
**exclusivement** sur la saisie interactive dans le contrôle. Un intervalle inversé **reçu dans
une URL** est permuté par `EX-NAV-22` : l'auteur d'une URL reçue n'est pas présent pour corriger
sa saisie, celui qui tape dans le contrôle l'est. Si `from` ou `to` sort du domaine
relevé (par exemple une année < 1900 ou > 2027 pour `modelyearfrom`), la valeur est **ramenée à
la borne du domaine** et un message inline `Ramené à <valeur>` s'affiche pendant 4 s ; à
l'arrivée par URL, la même correction est signalée par `ET-URL-CORRIGEE` (`EX-NAV-21`,
`EX-SCR-38bis`) et non par ce message.

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

`EX-SCR-71` — **Texte libre (`kwd`, `version0`, `region`, `dlv_max`)** → champ texte
avec compteur de caractères. `kwd` est le seul exposé dans la ligne primaire, sous forme d'un
champ de 240 px placé dans la zone (2) et distinct du champ `Rechercher un filtre` — les deux
champs portent des libellés flottants différents (`Mot-clé dans l'annonce` et
`Rechercher un filtre`) afin de ne jamais être confondus. `cid` est **exclu du périmètre** par
`filters-scope.json` (motif `R3_DONNEE_PERSONNELLE`) : il n'a ni contrôle ni classe, et la
mention « `cid` est de classe X (R3) » est supprimée avec la classe `X` (`ARB-02`).

`EX-SCR-72` — **Structuré (`mmmv`)** → le contrôle primaire n'est pas une liste déroulante mais
un **bouton ouvrant le sélecteur `G`** (§7.4), qui seul peut présenter 295 marques et
4 955 modèles. Le bouton affiche : `Toutes les marques` si vide, `<Marque>` si une marque sans
modèle, `<Marque> <Modèle>` si un couple, et `<n> sélections` au-delà de 1. Le format de
sérialisation est celui relevé : `makeId|modelId|modelLineId|version`, blocs séparés par des
virgules, virgule littérale dans `version` échappée en `,,` puis encodée `%2C`.

`EX-SCR-72bis` — **Règle d'exposition par défaut, générative.** Tout filtre
`perimetre = RETENU` de `filters-scope.json` qui n'est **pas** nommé dans le `Concerne` d'une
exigence `EX-SCR-63` à `EX-SCR-72` reçoit, **sans exception et sans décision supplémentaire**,
un contrôle `exposition = SECONDAIRE`, placé dans le groupe visuel correspondant à son champ
`group`, du type déterminé par son champ `type` selon cette table :

| `type` de `filters-scope.json` | Contrôle attribué | Exigence de forme |
|---|---|---|
| `enum_single`, domaine ≤ 4 valeurs | boutons radio segmentés | `EX-SCR-63` |
| `enum_single`, domaine de 5 à 12 valeurs | liste déroulante avec `Indifférent` | `EX-SCR-64` |
| `enum_single`, domaine > 12 valeurs | panneau dédié à recherche interne | `EX-SCR-66` |
| `enum_multi`, domaine ≤ 14 valeurs | cases à cocher | `EX-SCR-65` |
| `enum_multi`, domaine > 14 valeurs | panneau dédié à recherche interne | `EX-SCR-66` |
| `range_min` **et** `range_max` de même préfixe | couple d'intervalle | `EX-SCR-67` |
| `range_min` **sans** `range_max` de même préfixe | contrôle à borne unique `au moins <valeur>` | `EX-SCR-67` amendé par `ARB-53` |
| `number` | champ numérique unique, paliers suggérés si le domaine en fournit | `EX-SCR-67` |
| `boolean` | interrupteur à deux états | `EX-SCR-69` |
| `text` | champ texte à compteur de caractères | `EX-SCR-71` |
| `geo_text` | contrôle composite `Localisation` | `EX-SCR-70` |
| `structured_multi` | bouton ouvrant le sélecteur `G` | `EX-SCR-72` |

**Correspondance des groupes** : le champ `group` de `filters-scope.json` désigne le groupe
visuel du bandeau ; un `group` sans groupe visuel correspondant crée un groupe replié portant
son libellé, plutôt que de laisser le filtre sans emplacement.
**Seul écart admis** : `atype`, `RETENU` et volontairement `NON_EXPOSE` (`R-A01`).
**Critère de recette** : un test du lot D4 énumère `filters-scope.json`, applique cette table et
**échoue** si un filtre `RETENU` autre qu'`atype` n'a aucun contrôle, ou en a deux.

`EX-SCR-73` — **Dépendances entre filtres.** Tout filtre dont `REF-filters.md` déclare une
dépendance est **désactivé** tant que son parent n'est pas posé, avec une infobulle nommant
le parent : `Nécessite « Offre de leasing disponible »`. Dépendances à implémenter :
`zipr`/`lat`/`lon`/`crossborder` ← `zip` ; `leasingratefrom`…`lstagr` (9 filtres) ←
`hasleasing` ; `bot`/`erfrom`/`erto` ← `fuel` contenant au moins une valeur électrique
(`2`, `3`, `E`) ; `sealor`/`version0` ← `mmmv` avec au moins une marque ; `powerfrom`/`powerto`
← `powertype` (toujours posé, donc jamais désactivé) ; `desc` ← `sort`.
La liste `2`, `3`, `E` sert **uniquement** à décider l'activation d'un contrôle enfant ; elle ne
définit **aucun** prédicat de filtre et ne rend pas les codes `2` et `3` équivalents à `E`.
Le prédicat de `powerfrom`/`powerto` est celui d'`EX-SRCH-11bis` : il s'évalue sur le champ
canonique `powerKw`, dans son unité canonique ; le contrôle affiche la valeur dans l'unité
choisie et convertit à l'évaluation, sans arrondi intermédiaire.
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

**Le jeton d'un filtre actif affiche toujours son libellé et sa valeur** (`ARB-12`, re-ciblée sur
cette exigence par `R-A10` — la précédente cible `EX-SCR-176` n'avait aucun rapport avec les
jetons) ; un jeton qui n'affiche que le nom du filtre est interdit. **Exception maintenue** : au-delà
de 2 valeurs, le jeton affiche son libellé et le **cardinal** (`Carburant : 4 valeurs`), les valeurs
restant atteignables en infobulle — étendre l'affichage complet à un jeton portant 8 codes ferait
déborder la ligne des filtres actifs et détruirait la lisibilité des autres jetons.

`EX-SCR-76` — **Retrait individuel.** Un clic sur la croix retire **cette seule valeur** pour
une énumération multi-valeurs (le jeton `Essence, Diesel` se scinde en deux jetons dès qu'il
dépasse 2 valeurs, précisément pour rendre le retrait unitaire possible), et **les deux bornes**
pour un intervalle. Retirer un jeton de taxonomie de niveau supérieur retire aussi ses
descendants, avec la notification d'`EX-SCR-73`.

`EX-SCR-77` — **`Tout effacer`.** Bouton textuel qui **retire tout prédicat utilisateur** : à
l'issue de l'action, aucun filtre n'est appliqué au jeu de données local et l'URL ne porte aucun
paramètre de filtre (`EX-SRCH-18`, règle unique). L'application entre dans l'état
`SANS-FILTRE` (`EX-SCR-27bis`). **Les valeurs `atype`, `ustate`, `powertype`, `pricetype` et
`cy` ne sont pas remises à une valeur par défaut, parce qu'elles ne sont pas des filtres
utilisateur** : ce sont des valeurs que l'adaptateur `DataProvider` injecte dans une requête
vers la source (`EX-SRCH-18bis`), invisibles dans le bandeau. La route survit (`EX-SRCH-20`).
Le bouton est désactivé quand aucun filtre n'est actif. Aucune confirmation : l'action est
réversible par le retour arrière du navigateur.

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

`EX-SCR-82` — **Table d'exposition.** Le tableau suivant est normatif : chaque filtre du
catalogue reçoit un groupe, une classe, un **périmètre** et une **exposition**. Aucun filtre
n'est absent de ce tableau. Il satisfait le critère S4 de la phase 2.1.

La table porte deux colonnes **non interchangeables** : `perimetre ∈ {RETENU, EXCLU}`, recopiée
de `data/reference/filters-scope.json` **sans retouche**, et
`exposition ∈ {PRIMAIRE, SECONDAIRE, DESACTIVE, NON_EXPOSE}`. Contrainte inscrite dans
l'exigence :
> Tout filtre `perimetre = RETENU` a `exposition ≠ NON_EXPOSE`, à la **seule** exception
> d'`atype`, déclarée nommément. La classe `X` (« hors périmètre, absent du DOM ») est
> **supprimée** de cette table : elle confondait périmètre et exposition. Les cinq filtres
> précédemment classés `X` — `atype`, `cat`, `mcat`, `page`, `size` — reçoivent :
> `atype` → `NON_EXPOSE` (écart déclaré) ; `cat`, `mcat` → `SECONDAIRE`, groupe
> `Véhicule (taxonomie)` ; `page`, `size` → `SECONDAIRE`, groupe `Liste d'annonces`, exposés
> sur l'écran D uniquement et sérialisés (`A-02` fait exister la sous-vue).

Les filtres `perimetre = RETENU` qui ne sont nommés dans le `Concerne` d'aucune exigence
`EX-SCR-63` à `EX-SCR-72` reçoivent leur contrôle et leur emplacement par la règle générative
d'`EX-SCR-72bis`. Un filtre retenu dont la colonne « Champ local ou motif » établit qu'aucun
champ du modèle local ne le porte est de **classe `T`** par application directe de la définition
d'`EX-SCR-57`.

| # | Param | Groupe KYCAR | `perimetre` | `exposition` | Classe | Champ local ou motif |
|---|---|---|---|---|---|---|
| 1 | `atype` | Véhicule | `RETENU` | `NON_EXPOSE` | T | fixé à `C` ; KYCAR ne traite que les voitures |
| 2 | `mmmv` | Véhicule | `RETENU` | `PRIMAIRE` | R | `make.formatted`, `model.formatted` |
| 3 | `cat` | Véhicule (taxonomie) | `RETENU` | `SECONDAIRE` | T | `newTaxonomyAvailable = false` : branche inactive à la source (Z6) |
| 4 | `mcat` | Véhicule (taxonomie) | `RETENU` | `SECONDAIRE` | T | idem `cat` |
| 5 | `version0` | Véhicule | `RETENU` | `SECONDAIRE` | T | dépend de `mmmv` ; `modelVersionInput` est du texte libre non normalisé |
| 6 | `offer` | État et historique | `RETENU` | `SECONDAIRE` | T | recouvrement avec `usageState` non établi (Z4) |
| 7 | `kwd` | (zone 2, dédiée) | `RETENU` | `PRIMAIRE` | T | recherche titre côté source ; aucun titre d'annonce dans les 40 champs |
| 8 | `pricefrom` | Prix et valeur | `RETENU` | `PRIMAIRE` | R | `prices.public.amountInEUR.raw` |
| 9 | `priceto` | Prix et valeur | `RETENU` | `PRIMAIRE` | R | idem |
| 10 | `pricetype` | — | `EXCLU` | `NON_EXPOSE` | — | usage des codes `private`/`dealer` non prouvé (Z6) ; KYCAR fixe `public` |
| 11 | `vatded` | Prix et valeur | `RETENU` | `SECONDAIRE` | R | `prices.public.taxDeductible` |
| 12 | `superdeal` | Prix et valeur | `RETENU` | `SECONDAIRE` | R | `superDeal` |
| 13 | `pe_category` | Prix et valeur | `RETENU` | `SECONDAIRE` | R | `prices.public.evaluation.category` |
| 14 | `financeratefrom` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | aucun champ de mensualité |
| 15 | `financerateto` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | idem |
| 16 | `hasleasing` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | idem |
| 17 | `leasingratefrom` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | idem, dép. `hasleasing` |
| 18 | `leasingrateto` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | idem |
| 19 | `lsdufrom` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | idem |
| 20 | `lsduto` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | idem |
| 21 | `lsyeinmifrom` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | idem |
| 22 | `lstrinbo` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | idem |
| 23 | `lsenbo` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | idem |
| 24 | `lsavno` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | idem |
| 25 | `lstagr` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | domaine RELEVÉ-PARTIEL, avertissement affiché |
| 26 | `efeg` | Financement et leasing | `RETENU` | `SECONDAIRE` | T | aucun champ de prime |
| 27 | `tradeIn` | Prix et valeur | `RETENU` | `SECONDAIRE` | T | filtre transactionnel du parcours de vente AS24 ; sans effet sur la population analysée |
| 28 | `kmfrom` | Kilométrage | `RETENU` | `PRIMAIRE` | R | `condition.mileageInKm.raw` |
| 29 | `kmto` | Kilométrage | `RETENU` | `PRIMAIRE` | R | idem |
| 30 | `fregfrom` | Immatriculation et année | `RETENU` | `PRIMAIRE` | R | `condition.firstRegistrationDate` |
| 31 | `fregto` | Immatriculation et année | `RETENU` | `PRIMAIRE` | R | idem |
| 32 | `modelyearfrom` | Immatriculation et année | `RETENU` | `SECONDAIRE` | R | `modelYear` |
| 33 | `modelyearto` | Immatriculation et année | `RETENU` | `SECONDAIRE` | R | idem |
| 34 | `fuel` | Motorisation | `RETENU` | `PRIMAIRE` | R | `fuels.fuelCategory.raw` — voir PIÈGE 1 (`EX-SCR-84`) |
| 35 | `powertype` | Motorisation | `RETENU` | `SECONDAIRE` | R | commutateur d'unité `engine.power.kw` / `.hp` |
| 36 | `powerfrom` | Motorisation | `RETENU` | `SECONDAIRE` | R | `engine.power.*.raw` |
| 37 | `powerto` | Motorisation | `RETENU` | `SECONDAIRE` | R | idem |
| 38 | `ccmfrom` | Motorisation | `RETENU` | `SECONDAIRE` | T | aucun champ de cylindrée |
| 39 | `ccmto` | Motorisation | `RETENU` | `SECONDAIRE` | T | idem |
| 40 | `cylinders` | Motorisation | `RETENU` | `SECONDAIRE` | T | aucun champ ; masqué dans l'UI AS24 mais accepté (Z7) |
| 41 | `dtrain` | Motorisation | `RETENU` | `SECONDAIRE` | T | aucun champ ; masqué dans l'UI AS24 (Z7) |
| 42 | `gear` | Motorisation | `RETENU` | `PRIMAIRE` | T | **aucun champ de boîte dans les 40 relevés** — dérogation `EX-SCR-61` |
| 43 | `newdriver` | Motorisation | `RETENU` | `SECONDAIRE` | T | aucun champ |
| 44 | `body` | Carrosserie et habitacle | `RETENU` | `PRIMAIRE` | T / R | `topModels.bodyTypes` au niveau modèle ; rien au niveau annonce |
| 45 | `doorfrom` | Carrosserie et habitacle | `RETENU` | `SECONDAIRE` | T | aucun champ |
| 46 | `doorto` | Carrosserie et habitacle | `RETENU` | `SECONDAIRE` | T | idem |
| 47 | `seatsfrom` | Carrosserie et habitacle | `RETENU` | `SECONDAIRE` | T | idem |
| 48 | `seatsto` | Carrosserie et habitacle | `RETENU` | `SECONDAIRE` | T | idem |
| 49 | `bcol` | Carrosserie et habitacle | `RETENU` | `SECONDAIRE` | T | idem |
| 50 | `ptype` | Carrosserie et habitacle | `RETENU` | `SECONDAIRE` | T | idem |
| 51 | `icol` | Carrosserie et habitacle | `RETENU` | `SECONDAIRE` | T | idem |
| 52 | `uph` | Carrosserie et habitacle | `RETENU` | `SECONDAIRE` | T | idem |
| 53 | `emclass` | Écologie et électrique | `RETENU` | `SECONDAIRE` | T | aucun champ ; sémantique de borne non prouvée (Z2) |
| 54 | `ensticker` | Écologie et électrique | `RETENU` | `SECONDAIRE` | T | pertinence DE ; code `1` non émis |
| 55 | `bot` | Écologie et électrique | `RETENU` | `SECONDAIRE` | T | aucun champ, dép. `fuel` électrique |
| 56 | `erfrom` | Écologie et électrique | `RETENU` | `SECONDAIRE` | T | aucun champ d'autonomie |
| 57 | `erto` | Écologie et électrique | `RETENU` | `SECONDAIRE` | T | idem |
| 58 | `eq` | Équipements | `RETENU` | `SECONDAIRE` | T | aucun champ d'équipement ; sémantique ET présumée (Z1) |
| 59 | `ustate` | État et historique | `RETENU` | `SECONDAIRE` | T | `usageState` présent mais correspondance non établie (Z4) |
| 60 | `damaged_listing` | État et historique | `RETENU` | `DESACTIVE` | **D** | rejeté par BE et `.com` |
| 61 | `prevownersid` | État et historique | `RETENU` | `SECONDAIRE` | R | `condition.numberOfPreviousOwnersExtended.raw` ; sémantique « au plus » présumée (Z2) |
| 62 | `sealor` | État et historique | `RETENU` | `SECONDAIRE` | T | aucun champ de label, dép. `mmmv` |
| 63 | `custtype` | Vendeur | `RETENU` | `PRIMAIRE` | R | `seller.type` |
| 64 | `cid` | — | `EXCLU` | `NON_EXPOSE` | — | **règle R3** : identifiant de vendeur, interdit dans le schéma |
| 65 | `cy` | Géographie | `RETENU` | `PRIMAIRE` | R | `location.countryCode` |
| 66 | `zip` | Géographie | `RETENU` | `SECONDAIRE` | R (dégradé) | `location.zip` tronqué à `NNxx` : filtrage local à la précision de 2 chiffres seulement |
| 67 | `zipr` | Géographie | `RETENU` | `SECONDAIRE` | T | exige la géolocalisation serveur, dép. `zip` |
| 68 | `lat` | Géographie | `RETENU` | `SECONDAIRE` | T | dérivé du géocodage serveur, jamais exposé à l'utilisateur |
| 69 | `lon` | Géographie | `RETENU` | `SECONDAIRE` | T | idem |
| 70 | `region` | Géographie | `RETENU` | `DESACTIVE` | **D** | domaine inconnu, désactivé à la source (Z3) |
| 71 | `crossborder` | Géographie | `RETENU` | `SECONDAIRE` | T | dép. `zip` + `zipr` |
| 72 | `ot_osc` | Fraîcheur et achat en ligne | `RETENU` | `SECONDAIRE` | T | aucun champ |
| 73 | `ocs_listing` | Fraîcheur et achat en ligne | `RETENU` | `SECONDAIRE` | T | aucun champ |
| 74 | `dlv_max` | Fraîcheur et achat en ligne | `RETENU` | `DESACTIVE` | **D** | domaine non relevé |
| 75 | `dlv_tail` | Fraîcheur et achat en ligne | `RETENU` | `SECONDAIRE` | T | aucun champ |
| 76 | `adage` | — | `EXCLU` | `NON_EXPOSE` | — | **aucune date de publication dans les 40 champs** ; seul `publication.isNew` existe |
| 77 | `sort` | (contrôle de tri, écrans A et D) | `RETENU` | `SECONDAIRE` | R | tri local sur les champs disponibles ; valeurs `financerate` et `leasing_rate` retirées (désactivées sur BE) |
| 78 | `desc` | (contrôle de tri) | `RETENU` | `SECONDAIRE` | R | dép. `sort` |
| 79 | `page` | Liste d'annonces | `RETENU` | `SECONDAIRE` | T | pagination interne au `DataProvider`, jamais exposée |
| 80 | `size` | Liste d'annonces | `RETENU` | `SECONDAIRE` | T | idem ; valeur observée `20` |
| 81–96 | `bedsfrom` … `grossweightto` | — | `EXCLU` | `NON_EXPOSE` | — | propres à `atype ≠ C` (caravanes, utilitaires, engins) — hors périmètre voiture |
| 97 | `show_nfm` | — | `EXCLU` | `NON_EXPOSE` | — | paramètre technique injecté par le serveur |
| 98 | `search_id` | — | `EXCLU` | `NON_EXPOSE` | — | idem |
| 99 | `query_id` | — | `EXCLU` | `NON_EXPOSE` | — | idem |
| 100 | `tier_rotation` | — | `EXCLU` | `NON_EXPOSE` | — | idem |
| 101 | `mmm` | — | `EXCLU` | `NON_EXPOSE` | — | sérialisation legacy remplacée par `mmmv` |

`EX-SCR-83` — **Bilan de l'affectation, arithmétiquement clos** :
**77** `RETENU` dont **76** `EXPOSÉ` (13 paramètres primaires, le reste secondaire ou
désactivé) et **1** `NON_EXPOSE` déclaré (`atype`) ; **24** `EXCLU`. Total catalogue : **101**.
Détail de l'exposition des 76 : 13 `PRIMAIRE` (regroupés en 9 contrôles, cf. `EX-SCR-59`,
`kwd` compris) · 60 `SECONDAIRE` · 3 `DESACTIVE` documentés (`damaged_listing`, `region`,
`dlv_max`).
Le test de complétude compare `filters-scope.json` à cette table sur les **deux colonnes**,
**échoue** si un `RETENU` est `NON_EXPOSE` hors `atype`, et **échoue** si un filtre non exclu
n'a pas exactement un type de contrôle (`ARB-53`). Il vérifie en outre que tout filtre non
exclu possède **exactement un** type de contrôle parmi ceux d'`EX-SCR-63` à `EX-SCR-72` ;
le test échoue s'il en possède zéro ou deux.

`EX-SCR-84` — **PIÈGE 1 — collision de codes sur `fuel`.** Le contrôle `Carburant` utilise
exclusivement le **vocabulaire de recherche** (`2` = Électrique/Essence, `3` = Électrique/Diesel,
`B` = Essence, `D` = Diesel, `E` = Électrique…), conformément à
`REF-vocabulary-reconciliation.md`. Les codes `2` et `3` du vocabulaire de création ont une
signification incompatible et ne doivent **jamais** alimenter ce contrôle. Le champ
`fuels.primary.source` (libellés de création, du type `Super 95 / Essence 91 / …`) est
affichable en infobulle d'annonce mais n'alimente ni le filtre ni aucun agrégat.
Critère de recette : un test échoue si une valeur du contrôle `Carburant` provient d'un
fichier de `data/reference/references/`.
Le prédicat du filtre `Carburant` est l'**égalité stricte** de `fuelCategory` à l'un des codes
cochés : `fuel=B` ne sélectionne **jamais** les codes `2` ni `3`, qui sont des catégories
distinctes et non des sous-catégories d'essence ou de diesel ; `fuel=E` ne sélectionne
**jamais** `2` ni `3` non plus. Le contrôle affiche les dix codes du vocabulaire, hybrides
compris, comme dix cases indépendantes, avec le texte d'aide
`Les hybrides ont leur propre catégorie : cochez-la explicitement`. Le clic sur une barre de
`G9` (`EX-SCR-165`) pose le code exact de la barre, de sorte que l'effectif de la page après
clic soit exactement celui de la barre.

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

`EX-SCR-91` — **Compteur du bandeau replié** : il affiche le nombre de filtres **posés par
l'utilisateur à une valeur autre que leur défaut relevé**, et non le nombre de filtres
disponibles (`R-A01`). Format `<k> filtres actifs`, absent du DOM quand `k = 0`. Sa valeur est
**calculée**, jamais écrite en dur ; le `[+ 92]` de la maquette d'`EX-SCR-55` est supprimé et
remplacé par `[3 filtres actifs]` à titre d'illustration. Au survol, le compteur devient
`Afficher les filtres secondaires`.

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

`EX-SCR-95` — **Deux réglages d'assainissement, propres à KYCAR** et absents du catalogue
AutoScout24, placés en fin du groupe `Prix et valeur` sous le titre
`Assainissement KYCAR (hors AutoScout24)`. **Ces deux réglages ne sont pas des filtres : ils ne
modifient jamais l'effectif d'une sélection (`EX-DATA-16(a)`) et n'agissent que sur
l'échantillon valide `V_price` au sens d'`EX-DATA-60`.** Libellés normatifs :
- `Exclure des statistiques de prix : les annonces à prix sur demande` — **défaut : actif**,
  sans effet observable puisque `EX-DATA-16(b)` l'impose déjà inconditionnellement ; le réglage
  est présent pour être **explicite**, et le désactiver est impossible (contrôle affiché
  coché et désactivé, infobulle `imposé par EX-DATA-16`).
- `Exclure des statistiques de prix : les prix sous le seuil de sentinelle (250 €)` —
  **défaut : actif**, conformément à `EX-DATA-60`. Le décocher **réintègre** dans `V_price` les
  annonces portant `PRICE_SENTINEL_ABSOLUTE`, et fait alors apparaître le bandeau
  `Statistiques de prix incluant les prix sentinelles — lecture non standard`.
Ils sont visuellement séparés par un filet et par la mention `Ces deux réglages sont propres à
KYCAR` ; ils ne comptent jamais dans le badge de filtres actifs (`R-A01`).

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
ligne 2 — `<borne basse> – <borne haute> €  |  <année min> – <année max>` (formats `EX-SCR-4`
et `EX-SCR-6`), où les deux bornes de prix sont celles de `displayRange` (`[p05, p95]`,
`EX-DATA-69`) et **jamais** `[min, max]`. La fourchette porte le suffixe normatif
`(90 % des offres)`. Le libellé secondaire, en 11 px gris, affiche
`du moins cher au plus cher : <min> – <max> €` à partir de `rawRange`. Les variables de ce
gabarit ne s'appellent plus `prix min`/`prix max`.
Le kilométrage n'apparaît **pas** au niveau marque : agréger le kilométrage de
34 modèles hétérogènes produit une fourchette presque toujours égale à `0 – 400 000 km`, donc
sans information. Justification écrite ici afin qu'elle ne soit pas « corrigée » plus tard.

`EX-SCR-110` — **En-tête cliquable.** Un clic sur l'en-tête ou sur le résumé de marque
**ajoute la marque au filtre `mmmv`** et recharge l'écran A restreint à cette marque (l'écran A
reste affiché : une marque sans modèle ne suffit pas à ouvrir une distribution). Retour
visuel : élévation de la carte de 0 à 2 dp au survol, curseur `pointer`, contour de focus de
2 px au clavier.

`EX-SCR-111` — **SUPPRIMÉE** (`ARB-43`). Cette exigence portait la case de comparaison de
**marque** de la carte-marque. Motif de la suppression, reporté ici : « la comparaison porte sur
des modèles ; comparer deux marques n'a aucune représentation dans la route ni dans les agrégats
de colonne de l'écran C (`ARB-43`) ». Aucune case de comparaison n'existe donc sur la
carte-marque ; l'ajout à la sélection de comparaison se fait par la case de la **zone-modèle**
(`EX-SCR-118`), par le bouton `Comparer` de l'en-tête de l'écran B (`EX-SCR-142`) et par
l'écran C lui-même (`EX-CRUD-13bis`). **L'identifiant `EX-SCR-111` n'est pas réattribué** et
aucune exigence n'est renumérotée : il est cité par les rapports de stress-test et par la
matrice de traçabilité.

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
4. **Fourchette de prix** — `displayRange` au format `EX-SCR-4`, suivie du suffixe
   `(90 % des offres)`. La fourchette brute `rawRange` est portée par l'**infobulle** de cet
   élément, au format `du moins cher au plus cher : <min> – <max> €`, et ne consomme aucune
   hauteur : la bande reste à 72 px et la liste des neuf éléments reste close.
5. **Fourchette d'années de première immatriculation** — `EX-SCR-6`, forme `AAAA – AAAA`.
6. **Fourchette de kilométrage** — `EX-SCR-5`.
7. **Prix médian** — `méd. <prix> €`.
8. **Indicateur de couverture** — disque de 8 px, cf. `EX-SCR-115`.
9. **Barre de part relative** — barre horizontale de 6 px de haut dont la longueur est
   proportionnelle à `offres du modèle / offres du modèle le plus offert de cette marque`,
   pleine largeur = 100 %. Elle porte `aria-hidden="true"` : c'est une redondance visuelle de
   l'effectif déjà annoncé aux lecteurs d'écran.
La zone-modèle de clé réservée `modelId = 0` reste **entièrement cliquable** et mène à l'écran B
en mode restreint (`EX-SCR-113bis`) ; son nom affiché est `Modèle non identifié` et son slug
canonique `modele-non-identifie`.

`EX-SCR-113bis` — **Écran B en mode « Modèle non identifié ».** Atteint par
`modelId = 0`. L'en-tête statistique affiche `<MARQUE> · Modèle non identifié` et le bandeau
non refermable `Ces annonces n'ont pas pu être rattachées à un modèle du référentiel — les
distributions par modèle ne s'appliquent pas`. Les graphes `G1`, `G2`, `G3`, `G4`, `G9`, `G13`,
`G15` sont rendus ; `G5`, `G6`, `G8`, `G10`, `G14` sont **absents du DOM**
(`ET-CHAMP-ABSENT-SOURCE`, `EX-SCR-35`), leur motif étant listé au panneau Diagnostic. La
détection d'outlier démarre l'échelle de repli à `C₃ = Σ` : `C₁` et `C₂` exigent un `modelId`
résolu. Le bouton `Comparer` est désactivé, infobulle `un modèle non identifié ne peut pas être
comparé`.

`EX-SCR-114` — **Ces trois fourchettes plus l'effectif sont l'exigence textuelle du
commanditaire** (« le nombre d'offre de ce modèle de cette marque et la fourchette de prix,
d'année et de kilomètre »). Elles ne sont donc jamais masquées, à aucun régime responsive
(en `compact` elles passent sur quatre lignes, cf. `EX-SCR-135`).

`EX-SCR-115` — **Provenance des fourchettes, et honnêteté du chiffre.** `topModels` ne fournit
que `listingsCount`, et `priceInfo` ne fournit que des **minima**
(`FINDING-allowed-surface.md` §2.1 et §2.2). Les trois fourchettes et la médiane sont donc
calculées sur les **annonces effectivement observées**, dont le nombre est inférieur à
l'effectif annoncé. Conséquence normative : chaque zone-modèle affiche un **indicateur de
couverture** de 8 px, piloté par **`sampleCoverage`** (`EX-DATA-61bis`) et par lui seul — disque
plein (`sampleCoverage ≥ 0,80`), à moitié plein (`0,20 ≤ sampleCoverage < 0,80`), ou creux
(`sampleCoverage < 0,20`) — dont l'infobulle indique
`Fourchettes calculées sur <listingCount> des <announcedCount> offres`. Quand `sampleCoverage`
vaut `null` ou `NON_APPLICABLE`, le disque est remplacé par un tiret cadratin gris et son
infobulle dit `couverture d'échantillon indisponible`. La mise en italique des trois fourchettes
reste attachée au seul cas `sampleCoverage < 0,20`. Sans cet indicateur, l'écran présenterait
comme une fourchette de marché ce qui n'est qu'une fourchette d'échantillon.

`EX-SCR-116` — **Cas `listingCount = 0 ∧ announcedCount > 0`** (prévisible : `announcedCount`
est exhaustif par construction alors qu'aucune annonce n'a été échantillonnée). La zone-modèle
affiche l'effectif et, à la place des trois fourchettes, la mention unique
`Fourchettes indisponibles — aucune annonce échantillonnée`. Le chevron reste actif : l'écran B
affichera alors `ET-VIDE-FILTRES` avec ce même motif. **Aucun `0 – 0 €` n'est jamais affiché.**

`EX-SCR-117` — **Clic sur la zone-modèle** → navigation vers l'écran B pour ce couple
marque/modèle, filtres conservés (`EX-SCR-51`). Toute la bande de 72 px est la cible cliquable,
pas seulement le chevron. Retour visuel : fond à 4 % de l'accent au survol, contour de focus de
2 px au clavier, et le chevron se décale de 2 px vers la droite.

`EX-SCR-118` — **Case de comparaison de modèle.** Apparaît à gauche du nom au survol de la
bande, 18 × 18 px, et ajoute le **modèle** à la sélection de comparaison `CompareSelection`
(`EX-CRUD-13bis`). Un clic sur la case ne déclenche pas la navigation (propagation arrêtée).
**Plafond unique : 4 modèles.** Au-delà, la case est **désactivée** avec l'infobulle
`4 modèles au maximum — retirez-en un pour en ajouter un autre` ; aucun ajout silencieux, aucun
surnuméraire ignoré. Ajouter un couple déjà présent est sans effet. La clé réservée
`modelId = 0` **ne peut pas** entrer dans la sélection (`EX-SCR-113bis`).

### 5.5 Tri, repliement, volumétrie

`EX-SCR-119` — **Ordre de tri des marques**, par défaut : effectif d'offres décroissant.
Égalité tranchée selon `EX-DATA-70bis` et `EX-DATA-70ter` — de sorte que `Škoda` se classe avec
`Skoda`, sans dépendre du navigateur. Le tri est **total et déterministe** : deux chargements
identiques produisent le même ordre, ce qui est vérifiable par test.

`EX-SCR-120` — **Options de tri des marques**, exactement quatre :
`Nombre d'offres` (défaut, décroissant) · `Prix médian` (croissant par défaut) ·
`Alphabétique` (croissant) · `Nombre de modèles` (décroissant). Le bouton d'inversion applique
le sens contraire. Aucune option de tri ne repose sur un champ absent de §2.3.
Chacune des quatre options est un ordre **total** au sens d'`EX-DATA-70ter` : clé primaire de
l'option, puis libellé (`EX-DATA-70bis`), puis `makeId` croissant. Une clé primaire indéfinie
— typiquement une médiane de prix `null` parce que toutes les annonces de la marque sont à prix
sur demande — place la marque **en fin** de l'ordre dans les deux sens, et jamais à la valeur
`0`. Le tri n'est jamais un tri stable sur l'état antérieur de l'écran : deux chargements de la
même URL produisent la même grille.

`EX-SCR-121` — **Ordre de tri des modèles dans une carte** : effectif d'offres décroissant,
égalité tranchée selon `EX-DATA-70ter`. La clé réservée `modelId = 0` (`Modèle non identifié`)
est placée **en dernier** parmi les modèles d'une marque, avant application des clés de
départage. Ce tri **ne suit pas** celui des marques : trier les
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

`EX-SCR-124bis` — **Table unique des seuils de l'écran A.**

| Seuil | Effet | Exigence |
|---|---|---|
| état sans filtre (`EX-SCR-27bis`) | 20 cartes rendues + bloc d'amorce + bouton `Afficher les <n> marques` | `EX-SCR-125` |
| `> 40` cartes à rendre | grille **virtualisée**, au plus 12 cartes montées simultanément ; **aucun plafonnement du nombre de cartes accessibles** | `EX-SCR-127` |
| `> 60` marques avec au moins un résultat | bandeau non bloquant `<n> marques correspondent — affinez pour comparer` | `EX-SRCH-26` |

Aucun autre seuil de rendu n'existe sur l'écran A. Le nombre 20 n'apparaît **que** dans la
première ligne.

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

`EX-SCR-126` — Le bloc d'amorce disparaît dès que l'application quitte l'état `SANS-FILTRE`
(`EX-SCR-27bis`). Il ne réapparaît pas après un `Tout effacer` de la même
session, sauf rechargement complet de la page : sa fonction est pédagogique, pas répétitive.

`EX-SCR-127` — **Rendu virtualisé de la grille.** Au-delà de 40 cartes, la grille est
virtualisée : au plus 12 cartes montées simultanément, hauteur de conteneur estimée depuis la
hauteur repliée (588 px) puis corrigée à la mesure réelle. La virtualisation **ne plafonne
jamais le nombre de cartes accessibles** : elle ne plafonne que le nombre de cartes montées dans
le DOM. Cible mesurée : défilement à 60 images par seconde sur 295 cartes, sur un appareil de
milieu de gamme.

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

`EX-SCR-134` — **`ET-EFFECTIF-FAIBLE` appliqué à la zone-modèle.** Les paliers d'`EX-SCR-33`
s'appliquent sans exception à la zone-modèle — ce sont les mêmes paliers pour toute l'application,
il n'existe pas de variante propre à l'écran A. Pour `1 ≤ n ≤ 4`, la médiane est remplacée par
`n trop faible` et les fourchettes restent affichées (min et max sont définis dès `n = 1`, auquel
cas `EX-SCR-4` produit une valeur unique). Pour `n = 1`, la troisième ligne affiche `1 seule
offre` à la place de `méd. …`, et la barre de part relative est rendue à sa longueur réelle,
jamais à zéro. Pour `5 ≤ n ≤ 11`, `P5`/`P95` sont **masqués** et remplacés par le jeton ambre
`n = <n>` accolé au titre de la zone-modèle, conformément à `EX-SCR-33` ; min et max restent
affichés. `effectifTier` (au sens d'`EX-SCR-33`) est la source unique de ces paliers dans la
zone-modèle. [amendée 2.6 — D-04]

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
`médiane <prix> €`, `P25 <prix> €`, `P75 <prix> €`, **`min <prix> € – max <prix> €`**. Cette
cinquième donnée est `rawRange.price` (`EX-DATA-68`), affichage **obligatoire** (`R-A05`),
étiquetée `du moins cher au plus cher`. Elle n'est jamais écrêtée, jamais remplacée par
`[p05, p95]`, et jamais masquée à un régime responsive ;
ligne 2 — `km médian <km>`, `1ʳᵉ immat. médiane <AAAA>`, `<p> % particuliers` ;
ligne 3 — **quatre** boutons : `Voir les <n> annonces` (écran D), `Comparer` (ajoute le modèle à
la sélection de comparaison, `EX-CRUD-13bis`), **`Suivre` / `Ne plus suivre`** (bascule exigée
par `EX-CRUD-9`), `Exporter` (menu de `EX-SCR-187`).
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
Axe X : prix, échelle **linéaire** (justification `EX-SCR-17`), unité `€`. **Les buckets, leurs
bornes, leur largeur et leurs bins de débordement sont exactement ceux produits par
`BIN(V_price(Σ), W, T, O)` au sens d'`EX-DATA-75` et d'`EX-DATA-77` ; cette exigence ne décrit
que l'habillage et n'énonce aucune règle de découpage, aucune borne d'axe et aucun plafond de
nombre de buckets.** Axe Y : nombre d'offres, **linéaire**, départ à 0, bascule logarithmique
conditionnelle (`EX-SCR-16`). Étiquettes d'axe X aux bornes de bucket, une sur deux si la
largeur disponible est inférieure à 48 px par étiquette. Les bins `open = true` sont rendus en
trame diagonale et contour pointillé, et étiquetés selon `EX-DATA-79`.

`EX-SCR-146` — **`G2` — Offres par kilométrage.** Identique à `G1`, unité `km`, **buckets
produits par `BIN(V_mileage(Σ), W, T, O)` (`EX-DATA-77`, ligne Kilométrage) ; cette exigence ne
fixe aucune largeur, aucune borne et aucun plafond de nombre de buckets.** Le bin de
débordement haut est étiqueté selon `EX-DATA-79`.

`EX-SCR-147` — **`G3` — Offres par année de première immatriculation.** Identique à `G1`, unité
« année de première immatriculation », **buckets produits par `BIN(V_year(Σ), {1}, 24, 0)`
(`EX-DATA-77`, ligne Année) : un bin par millésime entre les bornes de la grille, plus les bins
de débordement d'`EX-DATA-79` s'ils sont non vides. L'écrêtage à `Q(0,01)`/`Q(0,99)` n'est pas
facultatif et le regroupement « avant `<AAAA>` » est supprimé au profit du bin de débordement
bas**, étiqueté selon `EX-DATA-79`.

`EX-SCR-148` — **Encodage commun à `G1`–`G3`** : barres d'une seule couleur (accent à 70 %
d'opacité), **aucune couleur porteuse d'information** — la couleur est réservée à `G4`.
Espacement inter-barres de 2 px. Aucune barre d'effectif ≥ 1 ne mesure moins de 1 px de
hauteur : une classe à 1 offre doit rester visible, sinon la détection du cas isolé est perdue.

`EX-SCR-149` — **Interactions communes à `G1`–`G3`** :
- **Survol d'une barre** → infobulle : intervalle du bucket, effectif, part en pourcentage, et
  **prix médian du bucket issu de `GROUPSTAT(Σ, bucket de la métrique du graphe, price)`**
  (`EX-DATA-83bis`) pour `G2` et `G3`, ou kilométrage médian du bucket pour `G1`.
- **Clic sur une barre** → pose `<x>from = lo` et `<x>to = hi − u`, où `u` est l'unité canonique
  du champ (`1 €`, `1 km`, `1 an`) et `[lo, hi)` le bin d'`EX-DATA-76`, de sorte que l'effectif
  affiché après recalcul soit **exactement** celui de la barre cliquée. Sur un bin de
  débordement bas `(−∞, hi)`, seul `<x>to = hi − u` est posé ; sur un bin de débordement haut
  `[lo, +∞)`, seul `<x>from = lo` est posé. Un test de recette du lot D4 vérifie l'égalité entre
  l'effectif de la barre et l'effectif de la page après clic, sur les trois histogrammes et sur
  les deux bins de débordement. Retour visuel immédiat : la barre passe en accent plein et un
  jeton apparaît en zone (4) du bandeau avant même la fin du recalcul.
- **Brossage horizontal** (glisser sur l'axe) → l'intervalle posé est
  `[lo du premier bin brossé, hi du dernier bin brossé − u]` ; la plage est encodée dans l'URL.
- **`Ctrl` + clic** → sélection de plusieurs buckets non contigus ; l'intervalle posé est le
  plus petit englobant, borne haute diminuée de `u`, et une note affiche
  `intervalle élargi aux bornes des buckets sélectionnés`.
- **Double-clic dans la zone de tracé** → retire le filtre posé par ce graphe.
**Aucun zoom molette** : il entrerait en conflit avec le défilement vertical de la page.

`EX-SCR-150` — **`G1`–`G3` à faible effectif.** Dans toute cette exigence, `n` désigne
`n_m(Σ)` (`EX-SCR-33`) pour la **métrique du graphe** : `n_price` pour `G1`, `n_mileage` pour
`G2`, `n_year` pour `G3` — jamais l'effectif de sélection `N`.
- `n_m = 0` → le graphe n'est pas tracé ; à sa place, un cadre de dimension identique portant
  `Aucune offre` centré. Le cadre est conservé pour que la mise en page ne saute pas.
- `n_m = 1` → une barre unique de hauteur 1, l'axe X couvrant `valeur ± 1 largeur de bucket`, la
  mention `1 offre — aucune distribution` sous le titre, et la bascule logarithmique absente
  du DOM.
- `n_m = 3` → au plus trois barres sur la grille de `BIN` (`EX-SCR-145`), jeton ambre
  `n = 3` accolé au titre, et aucune médiane en infobulle (`EX-SCR-33`).

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

`EX-SCR-157` — **Chevauchement, opacité et échantillonnage.** Points à 55 % d'opacité, contour de
0,5 px à 100 % d'opacité pour que deux points superposés restent dénombrables. Au-delà de
5 000 points, `G4b` bascule automatiquement d'un rendu SVG à un rendu `canvas` **et**, au même
seuil `K = 5 000` (`EX-DATA-100`, qui gouverne), affiche la mention d'échantillonnage
d'`EX-DATA-103` (`n_e`, `K`, le nombre de points tracés, le mode d'échantillonnage). **Il
n'existe pas de second seuil à 20 000** : le bandeau `ET-TROP-RESULTATS` ne s'applique pas au
nuage. Aucune graine n'est affichée — `EX-DATA-101` n'en emploie aucune (`EX-DATA-100bis`).
[amendée 2.6 — D-06, D-08]

`EX-SCR-158` — **Interactions de `G4`** :
- **Survol d'un point** → infobulle de **6 lignes** : `modelVersionInput` tronqué à
  40 caractères, `<prix> €`, `<km> km`, `1ʳᵉ immat. <MM/AAAA>`, puissance au format `EX-SCR-7`,
  plus le jeton d'évaluation AutoScout24 (`Très bon prix` / `Bon prix` / `Prix correct`) s'il
  est présent ; la **sixième ligne** est la chaîne d'étiquetage de la base de comparaison
  d'`EX-SCR-158bis`.
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

`EX-SCR-158bis` — **Étiquetage obligatoire de la base de comparaison.** Tout élément qui affiche
un verdict d'outlier, un écart au prix attendu, un `opportunityScore` ou un liseré dérivé de
l'un des trois porte, à l'écran ou dans son infobulle, la chaîne normative
`écart calculé sur : <périmètre> · n = <cellSize>`, dérivée de `cellLevel` (`EX-DATA-87`) :
`MODEL_YEAR` → `<Marque> <Modèle> · <année>` ; `MODEL` → `<Marque> <Modèle>` ;
`SELECTION` → `sélection courante`. Elle est suivie de la mention de méthode d'`ARB-18`. Aucun
verdict d'outlier n'est affiché sans cette chaîne : un test de recette du lot D4 vérifie la
présence de la chaîne partout où un verdict est rendu.

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
**Médiane, P25 et P75 par bucket d'année issus de `GROUPSTAT(Σ, bucket d'année, price)`**
(`EX-DATA-83bis`).
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
Type : courbe unique. Axe X : âge en années, linéaire. Axe Y : indice du prix médian, linéaire.
Une seconde série en pointillé donne la **perte annuelle en pourcentage** sur un axe Y droit.
**Indice et perte annuelle issus d'`EX-DATA-83quinquies`** ; la base est affichée dans le titre
au format `base 100 = <y_max>`.
**Ce qu'il révèle** : le *taux* de perte de valeur, et non son niveau. `G5` dit que la Corsa
2015 vaut 9 000 € ; `G6` dit qu'elle perd 11 % par an entre 3 et 6 ans puis 6 % ensuite. C'est
la seule vue qui rende comparables deux modèles de gammes différentes, donc la seule qui
permette d'affirmer « ce modèle décote anormalement vite ».
Faible effectif : le graphe est **remplacé** par la mention
`Dépréciation non calculable — il faut au moins 3 années comptant chacune 5 offres`, et non par
une courbe à deux points. Condition mesurable, donc testable.

`EX-SCR-163` — **`G7` — Densité prix × kilométrage.**
Type : carte de densité en **cellules issues d'`EX-DATA-102bis`** — produit cartésien des bins
de `BIN` sur chaque axe, bins de débordement compris ; **aucune grille hexagonale**. Palette
séquentielle mono-teinte à 5 classes en quantiles d'effectif de cellule, légende à 5 crans avec
les effectifs de bornes.
Axes : X kilométrage linéaire ; Y prix linéaire **avec bascule logarithmique** — seul graphe à
la proposer sur un axe de prix (`EX-SCR-17`).
**Ce qu'il révèle** : où se trouve la *masse* du marché quand la nuée de `G4` est saturée par
le sur-tracé, et surtout les **trous et les bimodalités** — deux amas séparés dans le plan
prix × km signalent deux populations (typiquement deux générations du modèle), ce qu'un nuage
opaque cache complètement.
Interactions : survol d'une cellule → effectif, plage de prix, plage de km, prix médian ;
clic → pose les deux intervalles de la cellule.
Faible effectif : en dessous de `n = 40`, `G7` **n'est pas tracé** et affiche
`Densité non calculable en dessous de 40 offres — voir la nuée ci-dessus`. Justification du
seuil : 40 annonces sur la grille d'`EX-DATA-102bis` donnent moins de 2 annonces par cellule
occupée, la densité n'apportant alors rien de plus que la nuée.

`EX-SCR-164` — **`G8` — Écart au prix attendu (les 20 premiers outliers).**
Type : diagramme en sucettes horizontales, une ligne par annonce, triées par `opportunityScore`
**décroissant** au sens d'`EX-DATA-94`, égalités départagées par `priceEur` croissant puis
`listingId` croissant — les plus sous-évaluées en haut. Le double étiquetage euros/pourcentage
reste un pur affichage et ne définit **aucun** ordre. Axe X : écart, **centré sur 0**, échelle
linéaire symétrique, double étiquetage en euros et en pourcentage. Couleur : teinte froide pour
un écart négatif (moins cher qu'attendu), teinte chaude pour un écart positif ; ces deux teintes
sont les seules de la page à porter un signe, et la légende le dit.
Le prix attendu est `expectedPriceEur = p̂` de la **méthode M2**, définie par `EX-DATA-90` à
`EX-DATA-93`. Cet écran ne porte **aucune formule** : toute expression de la forme
fonctionnelle du modèle y est interdite (`A-09`). L'écran affiche sous le titre le libellé
normatif, mot pour mot :
`Modèle : ln(prix) ~ (année − moyenne) + km/10 000 — échelle robuste MAD — n = <|F|>, R² = <R²>`,
où `<|F|>` est `|F|` d'`EX-DATA-90` et `<R²>` le coefficient d'`EX-DATA-93bis`, formaté selon
`EX-SCR-2` (deux décimales, virgule décimale). L'écart affiché est `δ = p/p̂ − 1`
(`EX-DATA-92`) ; le double étiquetage euros/pourcentage reste un pur affichage.
Tout classement d'opportunité affiche la **méthode** qui l'a produit, à côté de l'étiquetage de
cellule d'`EX-SCR-158bis`, sous l'une des deux formes exactes :
`score : écart au prix attendu (M2)` ou `score : écart robuste au prix de la cellule (M1)`.
Quand la cellule franchit le seuil de 30 entre deux chargements, le bandeau non bloquant
`Méthode de score changée : la cellule atteint 30 offres, le classement passe à l'écart au prix
attendu` est affiché une fois, refermable. Les deux scores ne sont **jamais** mélangés dans un
même classement ni dans une même colonne.
**Ce qu'il révèle** : le classement des affaires *à âge et kilométrage comparables*. Aucun
autre graphe ne le fait : `G1` classe par prix absolu, ce qui met en tête les épaves ; `G4`
laisse l'œil faire le travail sur un nuage de 300 points. C'est le graphe qui répond
directement à « repérer les anomalies qui constituent des opportunités » de `00-CONTEXT.md`.
Interactions : clic sur une sucette → ouvre l'annonce d'origine ; survol → infobulle complète
de l'annonce, plus le prix attendu et l'écart.
Faible effectif : `G8` **n'est pas tracé** en dessous de `n_price = 30` (`EX-SCR-33`) et affiche
`Écart au prix attendu non calculable — il faut au moins 30 offres pour estimer un prix de
référence`. Si `R² < 0,30` (`EX-DATA-93bis`), le graphe est tracé mais surmonté de
l'avertissement ambre
`Le modèle explique moins de 30 % de la variance — les écarts sont peu fiables`.

`EX-SCR-165` — **`G9` — Répartition par carburant.**
Type : barres horizontales triées par effectif décroissant, une barre par valeur de
`fuels.fuelCategory.raw`, libellées avec les libellés FR relevés de l'énumération `fuel`
(`EX-SCR-14`). Chaque barre porte `<n> · <p> %` en bout, et le **prix médian de la classe** en
gris à droite. Axe X : effectif, linéaire, départ à 0.
**Ce qu'il révèle** : la composition du marché du modèle, invisible dans toute distribution
univariée, et le décalage de prix médian entre carburants — souvent l'explication première
d'une distribution de prix bimodale observée en `G1`.
**Classes et prix médians issus de `GROUPSTAT(Σ, fuelCategory, price)`** (`EX-DATA-83bis`) ; les
annonces à clé `INCONNU` ne forment pas de barre et sont annoncées par la note d'exclusion
`EX-SCR-178`.
Interactions : clic sur une barre → pose `fuel` sur cette valeur.
Faible effectif : une classe à `n_price ≤ 4` affiche son effectif mais pas son prix médian
(`EX-SCR-33`). Le graphe est tracé dès `n_price ≥ 1`.
**Barres horizontales, et non un anneau** : la comparaison de longueurs est plus précise que
celle d'angles, et 10 secteurs d'anneau sont illisibles.

`EX-SCR-166` — **`G10` — Prix par tranche de kilométrage.**
Type : boîtes à moustaches, **5 tranches de rang issues de `NTILE(V_mileage(Σ), 5)`**
(`EX-DATA-83ter`) ; chaque boîte porte son effectif et ses bornes `loObserved – hiObserved`.
Deux tranches partageant une même borne observée l'affichent toutes les deux, suivie de
l'indice de tranche (`3/5`), de sorte qu'aucun libellé ne soit dupliqué à l'identique. Les
tranches de rang garantissent des effectifs comparables, donc des boîtes comparables, ce que des
paliers ronds ne garantissent pas. Axe X : tranches (catégoriel ordonné, bornes affichées en
km) ; axe Y : prix, linéaire, départ à 0. Les valeurs au-delà de 1,5 × l'écart interquartile
sont tracées comme points individuels **cliquables** (ouverture de l'annonce) ; ces points hors
moustaches portent dans leur infobulle la chaîne d'étiquetage d'`EX-SCR-158bis`.
**Ce qu'il révèle** : la *dispersion* conditionnelle au kilométrage, et non la seule tendance.
`G5` et `G7` montrent où sont les prix ; `G10` montre où le marché est **incohérent** — une
tranche à fort écart interquartile signale un segment où le prix ne s'explique pas par le
kilométrage, donc l'endroit où chercher.
Faible effectif : en dessous de `n_mileage = 25`, le nombre de tranches est réduit à 3 ; en
dessous de `n_mileage = 15`, `G10` est remplacé par un nuage de points prix × km simple, avec
la mention `Effectif insuffisant pour des boîtes à moustaches (n = <n_mileage>)`.

`EX-SCR-167` — **`G12` — Répartition par évaluation de prix AutoScout24.**
Type : barre empilée horizontale unique, 4 segments : `Très bon prix`, `Bon prix`,
`Prix correct`, `Non évalué`. Effectif et pourcentage inscrits dans chaque segment de largeur
≥ 40 px, les autres reportés en légende.
**Ce qu'il révèle** : le verdict de la source elle-même, disponible gratuitement dans
`prices.public.evaluation.category`. C'est un **contrôle croisé indépendant** de notre `G8` :
une annonce que `G8` classe très sous-évaluée alors qu'AutoScout24 ne la signale pas mérite un
examen, et réciproquement. Aucun autre graphe n'apporte un point de vue externe au nôtre.
**Classes et prix médians issus de `GROUPSTAT(Σ, priceEvaluationCategory, price)`**
(`EX-DATA-83bis`) ; les annonces à clé `INCONNU` ne forment pas de segment et sont annoncées par
la note d'exclusion `EX-SCR-178`.
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
**Classes et prix médians issus de `GROUPSTAT(Σ, sellerType, price)`** (`EX-DATA-83bis`) ; les
annonces à clé `INCONNU` ne forment pas de barre et sont annoncées par la note d'exclusion
`EX-SCR-178`.
Interactions : clic → pose `custtype`.
Faible effectif : une classe à `n_price ≤ 4` n'affiche ni son prix médian ni l'écart.

`EX-SCR-169` — **`G14` — Prix médian par palier de puissance.**
Type : barres verticales, **paliers issus d'`EX-DATA-83quater`** (largeur fixe 20 kW, borne
haute exclusive, libellé `<20·k> – <20·(k+1) − 1> kW`), prix médian en hauteur, effectif en
étiquette au-dessus de chaque barre.
**Ce qu'il révèle** : que la dispersion de prix d'un « même modèle » est en grande partie une
dispersion de motorisation et de finition. `G1` n'attribue cette dispersion à rien ; `G14`
l'attribue à la puissance et permet de ne comparer que des annonces réellement comparables.
Faible effectif : les paliers à `n_price ≤ 4` sont tracés en contour pointillé, sans valeur de
médiane. Le graphe n'est pas tracé si moins de 3 paliers comptent `n_price ≥ 5`.

`EX-SCR-170` — **`G15` — Répartition par pays.**
Type : barres horizontales par `location.countryCode`, avec effectif, pourcentage et prix
médian. **Classes et prix médians issus de `GROUPSTAT(Σ, countryCode, price)`**
(`EX-DATA-83bis`) ; les annonces à clé `INCONNU` ne forment pas de barre et sont annoncées par
la note d'exclusion `EX-SCR-178`. **Tracé uniquement si** le filtre `cy` porte plus d'une
valeur, ou si le périmètre
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
sur la **population entière**. **`G4` est hors du périmètre d'`ET-TROP-RESULTATS`** : son propre
régime au-delà de `K = 5 000` est celui d'`EX-SCR-157` (`EX-DATA-100`), sans seuil à 20 000 ni
graine. Seul `G8` travaille différemment au-delà du seuil de 20 000 : il estime son modèle sur la
population entière mais n'affiche que les 20 premiers écarts. Cette asymétrie est écrite dans
l'infobulle de `G8`. [amendée 2.6 — D-08]

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
- `G7` **n'est pas tracé** (la grille d'`EX-DATA-102bis` sur moins de 320 px de large ne porte
  plus d'information) et affiche à sa place `Densité disponible sur écran large`.

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
(`EX-SCR-158`). Ce **bouton de conversion** est libellé `Convertir la sélection en filtre` ;
c'est le **seul** chemin qui change la sélection `Σ` : il pose les filtres d'intervalle
englobant la sélection brossée et retire `sel`. Tant qu'il n'est pas actionné, `sel` est une
**restriction d'affichage** et jamais un filtre (`EX-SCR-202`).

`EX-SCR-185` — **Un seul mécanisme de sélection actif à la fois.** Ouvrir un brossage dans un
graphe annule celui d'un autre, avec une transition de 150 ms. Un compteur global
`<n> annonces sélectionnées — Effacer` est affiché en tête de la zone principale tant qu'une
sélection existe, et il est encodé dans l'URL (`EX-SCR-50`).

`EX-SCR-186` — **Cohérence des encodages entre graphes.** Une même variable reçoit toujours le
même encodage sur toute la page : l'année utilise la rampe `A` (`G4a`, graduations de `G5`), le
kilométrage la rampe `B` (`G4b`, `G7`), les catégories nominales la palette qualitative `Q` de
8 teintes (`G9`, `G12`, `G13`, `G15`), et le signe d'un écart les deux teintes divergentes de
`G8` — utilisées nulle part ailleurs. Aucune palette n'est choisie localement par un graphe.

`EX-SCR-187` — **Emplacement et état du bouton `Exporter`.** Le bouton est placé en ligne 3 de
l'en-tête statistique de l'écran B (`EX-SCR-142`) et, sur l'écran A, dans la barre de synthèse
(`EX-SCR-107`, `ARB-44`). Il ouvre un menu. Cette exigence ne décrit **que l'emplacement et
l'état** du bouton : le **nombre d'entrées**, leur **libellé** et le **périmètre des lignes**
sont fixés par `EX-CRUD-16` ; les **colonnes** et l'**en-tête de fichier** par
`EX-DATA-123bis`. Le bouton est désactivé en `ET-PARTIEL-CACHE` et en `ET-CHARGE-INIT`, avec le
motif en infobulle.

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
l'écran B ; avec 0, redirection vers l'écran A. Le **plafond unique est de 4 modèles**
(`EX-CRUD-13bis`) : l'ouverture d'une URL `/comparer?m=…` **remplace** la sélection de session
par celle de l'URL, en ignorant les entrées au-delà de la quatrième et en signalant l'écrêtage
par `ET-URL-CORRIGEE` (`EX-SCR-38bis`). La mention « les identifiants surnuméraires sont
ignorés » et le bandeau `<k> sélections ignorées — maximum 4` sont **supprimés** : hors
chargement d'URL, aucun ajout au-delà de 4 n'est possible, tout contrôle d'ajout étant désactivé.
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
Les bornes communes et la largeur `w` sont celles de `BIN(V, W, T, O)` appliqué à l'**union des
échantillons valides** des colonnes comparées : `V = ⋃ V_m(colonne)` pour la métrique du
graphe. Sont **exclues de ce calcul** les colonnes dont `n_m < 12` (`EX-DATA-80`,
`lowConfidence`) ; si toutes les colonnes sont sous ce seuil, la rangée affiche
`échelle commune non calculable — effectifs trop faibles` et chaque colonne est rendue avec sa
propre grille, l'indicateur passant de `échelle commune` à `échelles indépendantes`. La grille
ainsi obtenue est **imposée à chaque colonne** : seuls les effectifs varient d'une colonne à
l'autre. Au retrait d'une colonne (`EX-SCR-198`), l'union est recalculée et la transition
s'anime vers la nouvelle grille.

`EX-SCR-196` — **Graphes présents sur l'écran C, exactement quatre rangées** : `G1` par colonne,
`G3` par colonne, `G5` **superposé** (une courbe par modèle, une couleur de la palette `Q`,
légende commune), et une rangée `Synthèse` reprenant les statistiques de l'en-tête de l'écran B
sous forme de tableau à double entrée. `G4`, `G7` et `G8` ne sont **pas** répliqués : leur
lecture exige la largeur pleine, et la comparaison de quatre nuées superposées est illisible
(les points de deux modèles occupent la même région du plan prix × année).

`EX-SCR-197` — **Colonne vide.** Une colonne non pourvue affiche un bloc en pointillé de même
dimension portant `+ Ajouter un modèle`, qui ouvre le sélecteur `G`. Le contrôle est
**désactivé** dès que la sélection atteint le plafond unique de 4 modèles
(`EX-CRUD-13bis`), avec l'infobulle `4 modèles au maximum — retirez-en un pour en ajouter un
autre` ; aucun ajout silencieux, aucun surnuméraire ignoré.

`EX-SCR-198` — **Retrait d'un modèle.** Croix dans l'en-tête de colonne ; le retrait recalcule
les bornes d'échelle communes et anime la fermeture de la colonne en 200 ms. Passer sous
2 modèles redirige vers l'écran B du modèle restant.

`EX-SCR-199` — **Responsive de l'écran C.** En `intermédiaire`, 2 colonnes visibles et la
rangée devient défilable horizontalement, avec des repères de colonne collants en haut. En
`compact`, le comparatif devient **un tableau unique** à une ligne par statistique et une
colonne par modèle, défilable horizontalement, et les histogrammes par colonne sont remplacés
par des sparklines de 60 × 24 px : à moins de 396 px de largeur, un histogramme complet n'est
pas lisible, et une sparkline au moins situe la forme de la distribution.

`EX-SCR-200` — **États de l'écran C**, par identifiant :
- `ET-CHARGE-INIT` — squelette par colonne, chargement colonne par colonne (chaque colonne
  charge indépendamment).
- `ET-ERREUR-PROVIDER` — un modèle en erreur laisse sa colonne en état d'erreur individuel sans
  affecter les autres, les autres colonnes restant rendues.
- `ET-VIDE-FILTRES` — une colonne à `n = 0` affiche `aucune offre` ; **et le cas nouveau où
  toutes les colonnes sont à `n = 0`** : texte
  `Aucun des modèles comparés n'a d'offre sous ces filtres — élargissez vos critères`, les
  colonnes restant présentes avec leur en-tête.
- `ET-TROP-RESULTATS` — sans objet, motif : l'écran compare au plus 4 modèles et ne trace
  aucune nuée.
- `ET-CHAMP-MANQUANT` — `—` par cellule de la rangée `Synthèse`, note d'exclusion par colonne.
- `ET-EFFECTIF-FAIBLE` — jeton ambre par colonne, seuils d'`EX-SCR-33`.
**Exclusion du calcul des bornes communes** : sont exclues les colonnes dont `n_m < 12`, seuil
unique d'`EX-SCR-195` ; une colonne exclue du calcul des bornes est **néanmoins rendue** sur la
grille commune, avec son jeton d'effectif faible.

### 7.2 Écran D — Annonces du modèle **[AJOUT]**

`EX-SCR-201` — **Justification en une phrase** : un outlier repéré sur un graphe n'a aucune
valeur si l'on ne peut pas ouvrir l'annonce correspondante, et l'écran D est la seule sortie de
l'application vers une action.

`EX-SCR-202` — **Route** :
`/marche/:makeId-:makeSlug/:modelId-:modelSlug/annonces?<filtres>[&sel=<lo>-<hi>]`.
Le paramètre `sel` **restreint la liste affichée** et rien d'autre : la sélection `Σ` qui fonde
les agrégats, les cellules d'homogénéité (`EX-DATA-86`) et les écarts au prix attendu reste
celle des filtres de l'URL, **sans** `sel`. L'écran affiche en tête
`<n> lignes affichées sur <N> de la sélection — écarts calculés sur les <N>`, ce qui satisfait
l'étiquetage obligatoire d'`A-07`. Un bouton `Convertir la sélection en filtre` (`EX-SCR-184`)
est le **seul** chemin qui change `Σ` : il pose les filtres d'intervalle englobant la sélection
brossée et retire `sel`.
`sel` porte les **bornes d'intervalle des axes du graphe** (`selx`, `sely` d'`EX-NAV-10bis`),
et **non** une empreinte : une empreinte ne restitue pas un sous-ensemble d'annonces. Toute
mention d'une « empreinte » de sélection est supprimée.

`EX-SCR-203` — **Structure** : un tableau dense, une ligne par annonce, hauteur de ligne 44 px,
en-tête de colonne collant. Colonnes, dans cet ordre, **toutes issues de champs relevés en
§2.3** :

| Colonne | Champ source | Format | Triable |
|---|---|---|---|
| Version | `modelVersionInput` | texte tronqué à 40 car. | non (texte libre non normalisé) |
| Prix | `prices.public.amountInEUR.raw` | `EX-SCR-3` | oui |
| Écart au prix attendu | `δ = p/p̂ − 1` (`EX-DATA-92`), `p̂` étant `expectedPriceEur` de la **méthode M2** (`EX-DATA-90` à `EX-DATA-93`) — cette colonne ne porte **aucune formule de forme fonctionnelle** (`A-09`) | `± <n> € (± <p> %)` | oui |
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

Précisions normatives sur ce tableau :
- La colonne « Écart au prix attendu » porte dans son **infobulle de colonne** la chaîne
  d'étiquetage de la base de comparaison d'`EX-SCR-158bis`, suivie de la mention de méthode
  sous l'une des deux formes exactes `score : écart au prix attendu (M2)` ou
  `score : écart robuste au prix de la cellule (M1)`. Les deux scores ne sont **jamais**
  mélangés dans une même colonne.
- Tout ordre de tri de ce tableau est **total** au sens d'`EX-DATA-70ter` ; tout départage
  alphabétique se fait selon `EX-DATA-70bis`.
- Une annonce portant `DUPLICATE_VALUE_CONFLICT` (`EX-DATA-15`) porte un jeton `!` dont
  l'infobulle dit `deux versions de cette annonce ont été reçues dans ce snapshot avec des
  valeurs différentes`.
- La colonne « Version » rend `modelVersionRaw` / `modelVersionInput` en **contenu textuel**
  exclusivement (`EX-DATA-28`), jamais en balisage.

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

`EX-SCR-206` — **Tri.** Par défaut : `opportunityScore` **décroissant** (`EX-DATA-94`), avec le
même départage que `EX-SCR-164` — `priceEur` croissant puis `listingId` croissant — soit les
meilleures affaires en tête. Quand `opportunityScore` est `null` pour toutes les lignes, l'ordre
par défaut bascule sur `priceEur` croissant puis `listingId` croissant, et l'en-tête de colonne
l'indique. Le tri par colonne est unique
(pas de tri multi-colonnes) ; le sens est indiqué par un chevron dans l'en-tête. Les valeurs
absentes sont **toujours placées en fin de tri**, quel que soit le sens, et non traitées comme
des zéros.

`EX-SCR-207` — **Ligne mise en évidence.** Une ligne dont l'écart au prix attendu est inférieur
au `P10 des écarts` reçoit un liseré gauche de 3 px de la teinte froide de `G8`. Le
`P10 des écarts` est le **décile inférieur de `δ`** (`EX-DATA-92`), calculé sur **tout le
périmètre de l'écran D** — jamais sur les 20 lignes de `G8` — au sens d'`EX-DATA-62`, et
exprimé en **pourcentage**. Le liseré porte dans son **infobulle de ligne** la chaîne
d'étiquetage de la base de comparaison d'`EX-SCR-158bis`, suivie de la mention de méthode
(M1 / M2). Aucune autre mise en forme conditionnelle : au-delà d'un critère, un tableau coloré
n'est plus lisible.

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
`<listingCount> annonces listables sur <announcedCount> annoncées` — la nuance est essentielle :
l'écran D ne peut lister que ce qui a été échantillonné.

### 7.3 Écran E — Recherches enregistrées **[AJOUT]**

`EX-SCR-211` — **Justification en une phrase** : un état d'analyse peut porter jusqu'à
60 filtres, et le reconstituer à la main serait plus long que l'analyse elle-même.

`EX-SCR-212` — **Route** : `/recherches`. **Structure** : liste verticale de cartes de 96 px,
une par recherche, portant : le nom donné par l'utilisateur (60 car. max), la description
générée des filtres actifs (tronquée à 2 lignes), le périmètre (`Toutes marques` ou
`<Marque> <Modèle>`), l'effectif au moment de l'enregistrement, l'effectif actuel, et l'écart
entre les deux au format `+ 34 offres depuis le 02/09`. Trois boutons par carte : `Ouvrir`,
`Renommer`, `Supprimer`.
L'écran porte en outre un **panneau latéral `Recherches récentes`** listant les 10 entrées FIFO
d'`EX-CRUD-11`, avec l'action unique `Vider l'historique` (`EX-CRUD-13`) et **aucune suppression
unitaire**.

`EX-SCR-213` — **L'écart d'effectif est la valeur ajoutée de l'écran** : il transforme une
recherche enregistrée en veille de marché. L'effectif actuel est **recalculé à l'ouverture de
l'écran E**, sur le snapshot courant. L'écart `+ <k> offres depuis le <date de création>` n'est
affiché **que si** `snapshotInitial ≠ snapshotId courant` **et** si l'effectif actuel est
calculable ; sinon il est **masqué**, et jamais affiché à `0` ni à `+ 0`. Quand l'effectif
actuel n'est pas calculable, la carte affiche `effectif actuel indisponible` (`EX-SCR-214`).
L'écart est un nombre d'annonces, avec son signe, et jamais un pourcentage. Un écart positif est
affiché en teinte froide, un écart négatif en gris. Si le périmètre n'est plus calculable
(modèle absent du snapshot), la carte affiche `Périmètre indisponible dans le snapshot du
<date>` et le bouton `Ouvrir` reste actif (`EX-SCR-101`).

`EX-SCR-214` — **États de l'écran E**, par identifiant :
- `ET-CHARGE-INIT` — l'effectif actuel de chaque carte dépend d'un calcul : squelette de la
  ligne d'effectif, le nom et la date restant affichés.
- `ET-ERREUR-PROVIDER` — l'effectif actuel n'est pas calculable : la carte affiche
  `effectif actuel indisponible`, l'écart est **masqué et jamais affiché à 0**, et la recherche
  reste ouvrable.
- `ET-VIDE-FILTRES` — liste vide → bloc centré `Aucune recherche enregistrée` avec la phrase
  `Enregistrez une recherche depuis le bandeau de filtres` et un bouton
  `Aller au survol du marché`.
- `ET-TROP-RESULTATS` — sans objet, motif : la liste est plafonnée à 50 entrées par
  `EX-CRUD-5`.
- `ET-CHAMP-MANQUANT` — `snapshotInitial` absent d'une entrée écrite par une version
  antérieure : l'écart est masqué et la carte porte la mention de migration d'`EX-CRUD-18`.
- `ET-EFFECTIF-FAIBLE` — sans objet, motif : l'écran n'affiche aucune statistique, seulement
  des effectifs.
Suppression → confirmation en ligne dans la carte
(`Supprimer « <nom> » ? [Supprimer] [Annuler]`), jamais une fenêtre modale. Le CRUD, la
persistance et les limites de nombre appartiennent à `req-behaviour`.

`EX-SCR-214bis` — **Écran F — `Modèles suivis`.** Route `/suivis` (`EX-NAV-4`). **Structure** :
une carte par modèle suivi, portant la marque, le modèle, la date d'ajout, l'effectif actuel et
un bouton `Ne plus suivre`. Le plafond de 30 entrées d'`EX-CRUD-10` est signalé dans l'en-tête
de l'écran, au format `<n> / 30 modèles suivis` ; au plafond, tout contrôle `Suivre` est
désactivé avec l'infobulle `30 modèles au maximum — retirez-en un pour en ajouter un autre`.
**États**, par identifiant, sur le modèle d'`ARB-51` :
`ET-CHARGE-INIT` (l'effectif actuel de chaque carte dépend d'un calcul : squelette de la ligne
d'effectif, la marque, le modèle et la date d'ajout restant affichés) ·
`ET-ERREUR-PROVIDER` (l'effectif actuel n'est pas calculable : la carte affiche
`effectif actuel indisponible`, jamais `0`) · `ET-VIDE-FILTRES` (liste vide → bloc centré
`Aucun modèle suivi` avec la phrase `Suivez un modèle depuis l'en-tête de l'écran B` et un
bouton `Aller au survol du marché`) · `ET-TROP-RESULTATS` (sans objet, motif : la liste est
plafonnée à 30 entrées par `EX-CRUD-10`) · `ET-CHAMP-MANQUANT` (`—` par valeur non renseignée,
jamais `0`) · `ET-EFFECTIF-FAIBLE` (sans objet, motif : l'écran n'affiche aucune statistique,
seulement des effectifs).

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
virtualisée, triée par effectif décroissant puis départagée selon `EX-DATA-70ter`), modèles de
la marque sélectionnée à droite. Chaque panneau a son propre champ de recherche, insensible à la
casse et aux diacritiques, filtrant par sous-chaîne. Chaque entrée porte son effectif d'offres
dans le périmètre filtré courant ; une entrée à effectif 0 reste affichée en gris et cliquable
(`EX-SCR-89`). Une case `Tous les modèles <Marque>` en tête du panneau droit pose la marque
sans modèle. La modale est refermable par `Échap` et `Annuler` sans appliquer, et
`Appliquer` pose le filtre `mmmv` et ferme. En régime `compact`, les deux panneaux deviennent
deux étapes successives plein écran avec un bouton `Retour aux marques`.

**États**, par identifiant du catalogue : `ET-CHARGE-INIT` (les effectifs par entrée dépendent
du périmètre filtré courant, donc d'un calcul : squelette de 12 lignes par panneau, aucun
effectif affiché) · `ET-ERREUR-PROVIDER` (message
`Liste des marques indisponible — réessayer`, la modale restant ouverte) · `ET-VIDE-FILTRES`
(aucune marque n'a de résultat sous les filtres courants : texte
`Aucune marque ne correspond à vos filtres — <bouton> Ignorer les filtres`) ·
`ET-EFFECTIF-FAIBLE` (sans objet, motif : le sélecteur n'affiche aucune statistique) ·
`ET-TROP-RESULTATS` (sans objet, motif : les deux panneaux sont virtualisés par construction) ·
`ET-CHAMP-MANQUANT` (une entrée sans effectif calculable affiche `—`, jamais `0`).
**Recherche sans correspondance**, sur chacun des deux panneaux :
`Aucune marque ne contient « <saisie> »` et `Aucun modèle ne contient « <saisie> »`, avec un
bouton `Effacer la recherche`. La recherche porte sur le libellé normalisé par
`EX-DATA-70bis`, de sorte que `skoda` trouve `Škoda`.
**`Appliquer`** est désactivé si et seulement si aucune marque n'est sélectionnée, ou si la
sélection est **identique** à l'état courant de l'écran appelant ; l'infobulle de l'état
désactivé dit `sélectionnez une marque` ou `sélection inchangée`.
**Focus** : la modale est un piège de focus ; `Tab` circule à l'intérieur des deux panneaux
dans l'ordre `champ de recherche marque → liste des marques → champ de recherche modèle →
liste des modèles → Annuler → Appliquer` ; `Échap` ferme sans appliquer ; à la fermeture, le
focus **retourne au contrôle appelant**. `Flèche gauche`/`Flèche droite` passent d'un panneau à
l'autre, `Début`/`Fin` vont au premier et au dernier élément du panneau focalisé.
**Plafond** : la sélection de comparaison est plafonnée à **4 modèles** (`EX-CRUD-13bis`) ;
toute mention de « 12 couples » est supprimée de cette exigence. Au plafond, tout contrôle
d'ajout est désactivé avec l'infobulle
`4 modèles au maximum — retirez-en un pour en ajouter un autre` ; aucun ajout silencieux, aucun
surnuméraire ignoré.

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
modèle**, où elle est de toute façon constante ou quasi constante. La classe `R` du filtre
`Carrosserie` en mode 1 est justifiée par `Model.bodyTypes` (`EX-DATA-105`) ; un modèle dont
`bodyTypes` est un tableau vide **ne satisfait aucun** prédicat `body`, et la note d'exclusion
`EX-SCR-178` annonce `<k> modèles sans carrosserie renseignée`.

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
