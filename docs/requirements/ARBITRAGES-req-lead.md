# Arbitrages du coordinateur `req-lead` — phase 2.1

Décisions prises par le coordinateur sur les points de conflit ou d'incertitude remontés par les
agents de la phase 2.1. Chaque arbitrage est repris dans `REQUIREMENTS.md` ; ce fichier conserve
le motif, pour que la phase 2.2 puisse le contester en connaissance de cause.

---

## A-01 — Périmètre des filtres : 22 retenus est un rétrécissement non autorisé

**Remontée** : `draft-behaviour.md` retient 22 filtres sur 101, en écarte 75 et laisse 4 conditionnels.

**Décision : infirmé.** Le périmètre est porté à **l'intégralité des filtres voiture d'AutoScout24**.

**Motif.** La demande du commanditaire est littérale : « l'idée c'est d'avoir **tous les filtres qui
sont actuellement possible** sur autoscout ». Ce n'est pas une préférence à optimiser, c'est le
périmètre du livrable. L'agent a appliqué un critère de pertinence analytique qui lui est propre
(« sert-il un des deux parcours cibles ? ») pour retirer des filtres que le commanditaire a demandés
nommément. Réduire le périmètre demandé n'est pas une décision d'agent.

**Confusion à dissiper** : l'agent a mélangé *périmètre* et *proéminence*. « Tous les filtres »
signifie que les 101 sont implémentés, encodables dans l'URL et applicables au dataset. Cela ne
signifie pas qu'ils sont tous visibles simultanément à l'écran — la hiérarchisation primaire /
secondaire relève de `draft-screens.md` et reste valide.

### Exclusions maintenues, et elles seules

| Motif | Filtres | Pourquoi l'exclusion tient |
|---|---|---|
| Règle R3 — donnée personnelle | `cid` (identifiant vendeur) | Contrainte structurelle de `00-CONTEXT.md`. Non négociable, et le commanditaire a dit ne pas vouloir les données vendeur. |
| Hors périmètre voiture | les 16 filtres propres à `atype≠C` (`bedsfrom`…`grossweightto`) | Caravanes, camping-cars, utilitaires lourds. KYCAR est un agrégateur voiture (`atype=C` fixé). Ce ne sont pas des filtres voiture. |
| Technique interne AutoScout24, pas un filtre utilisateur | `search_id`, `query_id`, `tier_rotation`, `show_nfm`, `adage` | Paramètres de télémétrie et de rotation publicitaire côté AS24. Ils ne décrivent pas un véhicule et n'ont pas d'équivalent dans notre dataset. |
| Doublon strict | `mmm` (legacy, remplacé par `mmmv`), `pricetype` (doublon de `custtype`) | Deux paramètres pour une même notion. On implémente la notion une fois ; l'URL accepte l'alias en lecture. |

**Total exclu : 24. Total retenu : 77.**

> **Correction du 2026-09-06** — la première rédaction annonçait 23 exclus et 78 retenus. Le compte
> était faux : la table ci-dessus énumère bien 24 exclusions (1 + 16 + 5 + 2), dont `bedType`, seule
> entrée du catalogue sans paramètre d'URL — le catalogue compte 101 entrées pour 100 paramètres.
> Erreur relevée par le constat T-02 du stress-test. **La liste normative n'est plus tenue en prose** :
> elle est générée dans `data/reference/filters-scope.json` par `scripts/build-filter-scope.mjs`, qui
> échoue si la partition ne tombe pas juste. C'est ce fichier qui fait foi, pas ce paragraphe.

### Exclusions annulées

| Motif invoqué | Filtres réintégrés | Pourquoi l'annulation |
|---|---|---|
| `J1` « secondaire » | `version0`, `pe_category`, `ccmfrom`/`ccmto`, `cylinders`, `dtrain`, `doorfrom`/`doorto`, `seatsfrom`/`seatsto`, `emclass`, `ensticker`, `bot`, `erfrom`/`erto` | Ce sont des filtres AutoScout24 réels et pertinents. La cylindrée, la transmission, la classe d'émission et l'autonomie électrique sont des axes d'analyse de marché légitimes — l'autonomie est même un déterminant de prix majeur sur l'électrique. |
| `J2` « cosmétique » | `bcol`, `icol`, `uph`, `ptype`, `sealor`, `superdeal`, `newdriver` | La couleur est loin d'être cosmétique en analyse de valeur résiduelle : elle influence le prix et le délai d'écoulement. C'est typiquement le genre de corrélation que KYCAR doit pouvoir révéler. |
| `J3` « financement hors périmètre analytique » | les 14 filtres de financement et de leasing | Le commanditaire a demandé tous les filtres. Par ailleurs la présence d'une offre de leasing est un signal sur le type de vendeur et sur le positionnement de l'annonce. |
| `J6` « redondant » | `damaged_listing` | Un véhicule accidenté est un **facteur explicatif d'outlier de premier ordre**. L'exclure, c'est se priver de l'explication la plus fréquente d'un prix anormalement bas. À conserver absolument. |
| `J8` « redondant avec un filtre retenu » | `modelyearfrom`, `modelyearto` | L'année-modèle n'est **pas** la date de première immatriculation. Un véhicule millésime 2017 peut être immatriculé en 2018. Les deux axes sont distincts et le commanditaire a cité « corsa 2017 » sans préciser lequel — raison de plus pour garder les deux. |

### Conséquence

`draft-behaviour.md` doit être corrigé à l'assemblage : la table de portée passe de 22 IN / 75 OUT
à 77 IN / 24 OUT, et les exigences `EX-NAV-*` d'encodage s'appliquent aux 77.

---

## A-02 — Sous-vue liste d'annonces : elle existe

**Remontée** : `draft-behaviour.md` laisse `sort`, `desc`, `page`, `size` conditionnels à
l'existence d'une sous-vue listant les annonces individuelles, qu'il ne peut pas décider seul.

**Décision : la sous-vue existe, et les 4 filtres passent IN.**

**Motif.** Le commanditaire décrit sa finalité mot pour mot : « pour éventuellement **cibler des
outliers** ». Un outlier repéré sur un nuage de points n'a de valeur que si l'on peut l'ouvrir et
lire l'annonce. Une application qui montre qu'une anomalie existe sans permettre de l'inspecter
s'arrête juste avant de rendre le service. La sous-vue est donc requise sur l'écran B, alimentée
par la sélection courante, et le champ `webPage` relevé sur la source fournit le lien vers l'annonce
d'origine — cohérent avec le principe de `00-CONTEXT.md` : lier plutôt que dupliquer.

---

## A-03 — Sémantique `eq` : le défaut provisoire ET est retenu, la réserve est maintenue

**Remontée** : la sémantique OU/ET du filtre équipements n'est pas prouvée (zone d'ombre Z1 de
`REF-filters.md`). L'agent a retenu ET par défaut en le signalant.

**Décision : maintenu, et la réserve est renforcée.**

**Motif.** Le raisonnement de l'agent est juste et mérite d'être souligné : KYCAR filtre **son
propre dataset**, il n'est donc pas tenu de reproduire le comportement du serveur AutoScout24. ET
est aussi la lecture que l'utilisateur attend spontanément — cocher « GPS » et « sièges chauffants »
veut dire « les deux », pas « l'un ou l'autre ».

**Ce qui est ajouté** : la sémantique doit être un **paramètre du moteur de filtrage**, pas une
constante en dur, afin qu'un basculement en OU ne coûte rien si la preuve arrive. Et l'interface
doit indiquer explicitement la sémantique appliquée — un filtre multi-valeurs dont la logique est
invisible produit des résultats que l'utilisateur ne sait pas interpréter.

Les 3 requêtes qui trancheraient (`eq=5`, `eq=23`, `eq=5,23` sur une page de recherche) portent sur
`/lst?`, interdit par le robots.txt. Le point part donc en `ACTIONS-COMMANDITAIRE`.

---

## A-04 — États invalides : correction permissive validée

**Remontée** : l'agent corrige silencieusement une valeur hors domaine ou un intervalle inversé, en
divergence assumée du 404 dur d'AutoScout24.

**Décision : validé, avec une réserve.**

**Motif.** Un lien partagé qui s'ouvre sur une page d'erreur parce qu'un paramètre a mal survécu à
une messagerie est un échec gratuit. La correction permissive est le bon choix pour un outil dont
l'état est destiné à circuler par lien.

**Réserve ajoutée** : « silencieusement » est de trop. Une correction non signalée fait analyser à
l'utilisateur un périmètre différent de celui qu'il croit avoir demandé — sur un outil d'analyse
c'est un défaut, pas une commodité. La correction doit rester permissive mais **visible** : un
bandeau non bloquant qui nomme le paramètre corrigé et la valeur retenue.

---

## A-05 — Fourchettes : l'écran décide, pas une règle globale

**Remontée** : `req-data` (décision D-1, `EX-DATA-69`) affiche `[p05, p95]` et non `[min, max]`, en
signalant la contre-lecture — l'utilisateur cherche précisément le minimum, et masquer le brut peut
cacher l'annonce visée.

**Décision : les deux, selon la finalité de l'écran.**

| Écran | Fourchette affichée | Motif |
|---|---|---|
| A — survol du marché, zone-modèle | `[p05, p95]` en principal, `[min, max]` en secondaire discret | La carte sert à **s'orienter**. `priceInfo` relevé sur la source donne un minimum réel de **119 €** pour l'Opel Corsa : une carte affichant « 119 € – 45 000 € » ne renseigne sur rien. |
| B — distribution, et écran D | `[min, max]` bruts, toujours | L'écran sert à **chasser**. Écrêter la queue de distribution y supprimerait l'objet de la recherche. |

**Motif du refus d'une règle unique.** La question « robuste ou brut ? » n'a pas de réponse
indépendante de l'usage. Sur la carte de survol, une valeur aberrante détruit la lisibilité de
centaines de cartes ; sur l'écran de distribution, c'est la valeur aberrante qui *est* l'information.
Trancher globalement, dans un sens ou dans l'autre, aurait cassé l'un des deux parcours cibles.

**Contrainte ajoutée** : quand `[p05, p95]` est affiché, l'étiquetage doit le dire — un intervalle
présenté comme « la fourchette » alors qu'il écrête 10 % des annonces est un mensonge par omission.

## A-06 — Prix sentinelle : les deux règles, en union

**Remontée** : `req-data` (décision D-2, `EX-DATA-19`) retient un seuil absolu de 250 € sous lequel
un prix est traité comme sentinelle, en notant qu'un seuil relatif à la médiane serait aussi défendable.

**Décision : union des deux règles.** Un prix est sentinelle s'il est inférieur à 250 €
**ou** inférieur à 10 % de la médiane de sa cellule d'homogénéité.

**Motif.** Les deux règles attrapent deux pathologies différentes, et aucune ne couvre l'autre.
Le seuil absolu attrape le prix-placeholder (`1 €`, `123 €`) qu'un vendeur saisit pour contourner
l'obligation de champ. Le seuil relatif attrape le prix crédible dans l'absolu mais absurde dans son
segment — 900 € sur un modèle dont la médiane est 28 000 €. Choisir l'un revient à laisser passer
l'autre famille, et ces prix faussent ensuite tous les agrégats de prix.

## A-07 — Base de comparaison de l'outlier : la sélection filtrée, mais nommée à l'écran

**Remontée** : `req-data` (décision D-3, `EX-DATA-86`) calcule les cellules d'outlier sur la sélection
filtrée et non sur le snapshot, ce qui fait qu'une même annonce reçoit des verdicts différents selon
les filtres — lisible comme une incohérence.

**Décision : la sélection filtrée est conservée. Ce n'est pas une incohérence, c'est la sémantique correcte.**

**Motif.** Le commanditaire décrit son geste : « je tape corsa 2017 et je vois la distribution des
offres pour éventuellement cibler des outliers ». Il **choisit son ensemble de comparaison en
filtrant**. Une anomalie n'existe que relativement à un référentiel ; changer le référentiel doit
changer le verdict, sinon le filtrage ne sert à rien. Une Corsa à 4 000 € est banale parmi toutes les
Corsa et remarquable parmi les Corsa 2017 à moins de 60 000 km — les deux verdicts sont justes.

**Contrainte ajoutée, et elle est obligatoire** : chaque affichage d'outlier doit nommer sa base de
comparaison et son effectif, par exemple « écart calculé sur : Opel Corsa · 2017 · n = 143 ».
Sans cette mention, l'utilisateur ne peut pas interpréter le verdict, et l'objection de `req-data`
devient fondée. C'est l'étiquetage qui rend la décision défendable, pas le calcul.

## A-08 — `gear` reste filtre primaire malgré l'absence du champ

**Conflit détecté par le coordinateur** entre deux livrables : `req-screens` retient `gear` (boîte de
vitesses) parmi les 9 contrôles primaires avec une dérogation documentée (2 critères sur 4), tout en
écartant le graphe de répartition par boîte au motif que **le champ est absent** des 40 champs relevés
sur la source.

**Décision : `gear` reste primaire, classé `T`, et le graphe reste écarté en v1.**

**Motif.** La boîte de vitesses est un critère de recherche de premier plan sur le marché belge de
l'occasion — automatique contre manuelle sépare le marché en deux et pèse sur le prix. La retirer du
primaire parce que notre échantillon actuel ne porte pas le champ reviendrait à laisser une limite
temporaire de la source dicter l'ergonomie durable du produit. Le filtre est donc exposé, et sa
classification `T` (rechargement via `DataProvider`) est exacte et suffit à informer l'utilisateur
du coût.

Le graphe, lui, ne peut pas être dessiné sans la donnée : il reste écarté, et rejoint la dette des
histogrammes CO₂ et consommation, à solder quand un adaptateur portera le champ.

## A-09 — Répartition de l'autorité entre les trois annexes

**Constat** : `req-screens` signale des chevauchements assumés avec `req-behaviour` (routes,
historique, débounce, CRUD des recherches) et avec `req-data` (seuils d'effectif, définition des
buckets, méthode de `G8`).

**Décision : une règle d'autorité par domaine, opposable en cas de divergence.**

| Domaine | Annexe qui fait foi | Ce que les autres peuvent en dire |
|---|---|---|
| Définition mathématique — buckets, statistiques, régressions, seuils d'effectif, normalisation | **Annexe A (données)** | Les autres décrivent l'usage et la présentation, jamais la formule |
| Disposition, contenu affiché, états visuels, encodages graphiques, hiérarchie des filtres | **Annexe B (écrans)** | Les autres n'imposent aucune disposition |
| Mécanique de navigation, encodage d'URL, historique, débounce, cycle de vie du CRUD, NFR chiffrées | **Annexe C (comportement)** | Les autres décrivent l'intention, jamais le mécanisme |

En cas de contradiction résiduelle non couverte par cette grille, l'arbitrage revient au coordinateur
et s'inscrit dans ce fichier. **Aucune divergence ne se résout en silence dans le code** : c'est
exactement le mode de défaillance que la phase 2.2 doit traquer.

---
---

# Révisions des arbitrages, après stress-test

Le stress-test de la phase 2.2 a produit 79 constats, dont trois visent directement des arbitrages
de ce fichier. Ils sont traités **ici et en premier**, avant l'arbitrage général : un arbitrage
défectueux est en entrée de plusieurs dizaines d'autres constats, et le corriger après aurait
imposé de reprendre leur résolution.

## R-A06 — `A-06` était circulaire. Reformulé.

**Constat `AMB-25`, retenu comme fondé.** La règle relative que j'avais posée — « un prix est
sentinelle s'il est inférieur à 10 % de la médiane de sa cellule » — est **logiquement circulaire** :
la médiane est calculée sur des prix dont on vient d'exclure des sentinelles, dont l'appartenance
dépend de cette médiane. Et je l'avais placée à l'ingestion alors que la cellule dépend de la
sélection, donc de filtres posés bien plus tard. Les deux défauts sont réels.

**Reformulation — deux drapeaux distincts, à deux étages distincts, sans rétroaction.**

| Drapeau | Étage | Règle | Dépend de |
|---|---|---|---|
| `PRICE_SENTINEL_ABSOLUTE` | **ingestion**, une fois par annonce | `prix < 250 €` | rien d'autre que l'annonce. Déterministe, stable, calculable au moment où l'annonce entre |
| `PRICE_IMPLAUSIBLE_IN_CELL` | **analyse**, recalculé par cellule et par sélection | `prix < 0,10 × médianeRéf(cellule)` | la cellule courante |

où **`médianeRéf(cellule)` est la médiane des prix de la cellule qui ne portent PAS
`PRICE_SENTINEL_ABSOLUTE`** — et rien d'autre. `PRICE_IMPLAUSIBLE_IN_CELL` n'entre jamais dans le
calcul de `médianeRéf`.

La circularité disparaît : un seul passage, pas de point fixe à chercher. Le calcul est
`filtrer l'absolu → médiane → marquer le relatif`, dans cet ordre, et jamais l'inverse.

**Conséquences à répercuter** : les deux drapeaux sont deux champs du dictionnaire, pas un seul.
Les statistiques de prix excluent les deux ; l'**effectif** compte les deux (une annonce à prix
absurde reste une offre du marché). Et parce que `PRICE_IMPLAUSIBLE_IN_CELL` dépend de la
sélection, il relève du même régime d'étiquetage que l'arbitrage `A-07` : l'écran doit nommer la
cellule sur laquelle le verdict est calculé.

**Ce que je maintiens** : l'union des deux règles (arbitrage `A-06` initial). Le constat portait sur
la mécanique, pas sur le principe. Deux pathologies distinctes exigent deux règles, et le
prix-placeholder à 1 € n'est pas le prix crédible-mais-absurde-dans-son-segment.

## R-A01 — `A-01` avait tranché le compte, pas le sens. Complété.

**Constat `AMB-33`, retenu comme fondé.** J'ai fixé le nombre de filtres retenus (77) sans définir
ce que « retenu » veut dire, alors que l'annexe B parle de filtres « exposés » (70). Trois lectures
du badge de comptage du bandeau en découlent, et — plus grave — **le périmètre de contrôle du
livrable le plus littéralement demandé par le commanditaire n'était pas déterminé**.

**Trois termes, trois définitions, aucune synonymie.**

| Terme | Définition | Cardinal |
|---|---|---|
| **`RETENU`** | Le filtre est implémenté : applicable au dataset, encodable et décodable dans l'URL, et couvert par un test | **77**, énumérés dans `data/reference/filters-scope.json` |
| **`EXPOSÉ`** | Le filtre a un contrôle atteignable par l'utilisateur dans le bandeau, primaire ou secondaire | **doit valoir 77** |
| **`PRIMAIRE`** | Le filtre est visible sans déplier de groupe | 9 contrôles / 13 paramètres |

**Décision : `EXPOSÉ` doit être égal à `RETENU`.** La demande est « tous les filtres qui sont
actuellement possible sur autoscout » ; un filtre implémenté mais sans contrôle serait invisible et
donc, du point de vue de l'utilisateur, absent. L'écart de 7 est un défaut à résorber, pas une
décision à ratifier : ces 7 filtres doivent être identifiés nommément et recevoir un contrôle.

**Un seul écart admis, et il doit être déclaré** : `atype`, fixé à `C` par conception et non exposé.
Il est `RETENU` et volontairement non `EXPOSÉ`. Toute autre asymétrie est un défaut.

**Conséquence sur le badge** : il compte les filtres **actifs**, c'est-à-dire posés par
l'utilisateur à une valeur non défaut, et jamais les filtres disponibles. Un badge qui compte les
possibilités n'informe sur rien.

## R-A05 — `A-05` n'avait pas été propagée. Portée précisée.

**Constats `ADV-02`, `ADV-03` et `AMB-20`, retenus comme fondés.** J'ai décidé quelle fourchette
s'affiche sur quel écran sans corriger les annexes, qui portent encore l'étiquette littérale
« prix min – prix max » sur la carte-marque, et qui n'affichent `[min, max]` nulle part sur
l'écran B. La décision était juste, l'exécution incomplète — une décision d'arbitrage non
répercutée ne vaut rien.

**Portée exacte du mot « toujours »**, qui était l'ambiguïté :

| Emplacement | Fourchette | Étiquette obligatoire |
|---|---|---|
| Carte-marque et zone-modèle, écran A | `[p05, p95]` | « fourchette centrale (90 % des offres) », et le `[min, max]` brut en libellé secondaire |
| En-tête de l'écran B | `[min, max]` | « du moins cher au plus cher », affichage obligatoire — c'était l'omission d'`ADV-03` |
| Axes des histogrammes, écran B | bornes issues du binning de l'annexe A | l'axe n'est pas une fourchette : aucune étiquette de fourchette |
| Infobulles de graphe | valeur du point ou du bucket | sans objet |
| Écran D et export CSV | `[min, max]` | valeurs brutes, aucun écrêtage |

**Règle générale qui lève l'ambiguïté** : `[p05, p95]` n'apparaît **que** sur l'écran A, et **jamais
sans être nommé comme intervalle central**. Partout ailleurs, les valeurs sont brutes. Un intervalle
écrêté présenté comme « la fourchette » est un mensonge par omission, et c'est précisément ce que
`ADV-02` a relevé.

---

# Décisions du coordinateur après application (phase 2.2, second tour)

Les trois agents d'application ont remonté 7 points qu'ils ne pouvaient pas trancher sans exercer
un jugement qui ne leur appartenait pas. Ils ont eu raison de s'arrêter : chacun est ci-dessous.

## R-A10 — `ARB-12` visait la mauvaise exigence. Re-ciblée, avec une exception déclarée.

**Blocage `B-59`, signalé et non contourné.** La décision `ARB-12` demandait d'inscrire dans
`EX-SCR-176` que le jeton d'un filtre actif affiche toujours son libellé **et sa valeur**. Or
`EX-SCR-176` porte « recalcul partiel interdit » et n'a aucun rapport avec les jetons. L'exigence
porteuse est **`EX-SCR-75`** (ligne des filtres actifs, format des six types de jetons).

**Décision** : `ARB-12` est re-ciblée sur `EX-SCR-75`. La même référence erronée figure dans
l'édition d'annexe C — `EX-NAV-18` renvoie à `EX-SCR-176` — et doit être corrigée de même.

**Exception déclarée, et c'est la vraie décision.** L'agent a relevé que `EX-SCR-75` affiche déjà la
valeur dans cinq de ses six formes, la sixième — « ≥ 3 valeurs » — affichant `Carburant : 4 valeurs`
avec les valeurs en infobulle. **Cette forme est maintenue telle quelle.** Étendre la règle à un
jeton portant 8 codes de carburant ferait déborder la ligne des filtres actifs et détruirait la
lisibilité de tous les autres jetons. La règle devient donc : *le jeton affiche son libellé et sa
valeur, sauf au-delà de 2 valeurs où il affiche son libellé et le cardinal, les valeurs restant
atteignables en infobulle*. L'exception est nommée dans l'exigence, pas laissée à l'implémentation.

## R-A11 — Classe des filtres anciennement `X` : `T`. Ratifié.

**À ratifier, remonté par `B-39`.** Aucune décision ne fixait la classe `R`/`T`/`D` des filtres qui
sortaient de la classe `X` supprimée, alors qu'`EX-SCR-57` exige exactement une classe par filtre.
L'agent les a portés à `T` par application directe de la définition.

**Ratifié.** Ce n'est pas un choix mais une conséquence : ces filtres n'ont aucun champ correspondant
dans les 40 champs relevés localement, donc ils ne peuvent pas être recalculés sans aller chercher
la donnée. `T` est la seule classe compatible avec la définition d'`EX-SCR-57`. La phrase de
dérivation écrite dans l'exigence est conservée : elle rend la classe recalculable au lieu d'être
une valeur posée.

## R-A12 — Le mot « couverture » : l'interdiction porte sur les énoncés, pas sur les identifiants.

**Question ouverte par `fix-annexe-B`.** `EX-DATA-61bis` interdit le mot « couverture » employé sans
qualificatif dans les quatre documents normatifs. Il subsiste une dizaine d'emplois, dont le nom
d'état `ET-PARTIEL-COUVERTURE` et le nom de composant `C3 couverture` — que la décision `ARB-32`
emploie elle-même.

**Décision : les identifiants et noms de composants sont exemptés ; les énoncés ne le sont pas.**

Le motif de l'interdiction était qu'une même grandeur nommée trois fois, dont deux au même seuil de
80 %, produisait deux pastilles contradictoires. Un identifiant ne porte pas de valeur et ne peut
donc pas contredire une mesure. Renommer en cascade `ET-PARTIEL-COUVERTURE` et `C3` casserait des
références dans les trois rapports de stress-test pour un gain nul.

**Contrainte compensatoire, obligatoire** : chaque identifiant contenant le mot doit être accompagné,
à l'endroit où il est défini, d'une ligne disant **laquelle des trois grandeurs il désigne**. Un nom
peut rester ambigu ; sa définition, non. C'est cette ligne qui ferme le défaut, pas le renommage.

## R-A13 — Deux éditions prescrites sans travail correspondant : mandatées.

**Remonté par `fix-annexe-B`.** Deux décisions prescrivaient une édition que la liste des 68 travaux
ne rattachait à aucun travail : `ARB-39` sur `EX-SCR-26`, et `ARB-47` sur `EX-SCR-207`.

**Décision** : les deux éditions sont mandatées. `ARB-47` est déjà couverte — l'agent l'a portée dans
`B-65`, qui rouvrait la même exigence, et il a eu raison de le signaler plutôt que de le taire.
`ARB-39` sur `EX-SCR-26` reste à appliquer et entre dans la liste des résidus.

**Ce que cet écart révèle** : les listes de travaux ont été dérivées à la main des décisions, et
deux prescriptions se sont perdues au passage. Le défaut n'est pas dans les décisions mais dans la
traduction en travaux — même mode de défaillance que le trou sur l'entité `Snapshot` en annexe A.
Une vérification systématique reste due : toute prescription d'édition figurant dans le corps d'une
décision doit avoir son travail. Elle est portée en résidu `RES-9`.

## R-A14 — `EX-SCR-111` en pierre tombale : ratifié.

`ARB-43` demandait de supprimer `EX-SCR-111` **et d'en reporter le motif**. L'agent a supprimé le
contenu normatif et laissé l'identifiant portant le motif, avec la mention qu'il n'est pas
réattribué.

**Ratifié.** L'identifiant est cité par `ST-complete.md` et par la matrice de traçabilité : le
supprimer entièrement aurait cassé ces références pour économiser trois lignes. Une pierre tombale
qui dit pourquoi l'exigence a disparu vaut mieux qu'un trou muet.

## R-A15 — Corrections factuelles ratifiées

- **`B-35`** — l'exigence annonçait « 24 couples » de filtres ; le fichier normatif n'en porte que
  12, plus un paramètre isolé. L'énumération est de 12 lignes. La source générée fait foi contre la
  prose, conformément à `T-02`.
- **`B-39`** — la décision nommait 5 filtres sortant de la classe `X` là où la table en portait 8.
  Résolu par la règle générative, sans jugement. Décompte final vérifié et clos :
  **77 retenus** (13 primaires / 60 secondaires / 3 désactivés / 1 non exposé) **+ 24 exclus = 101**.
- Trois propagations faites hors travaux nommés (nombre d'onglets, grille de `G7`, noms de champs de
  couverture) sont **ratifiées** : la décision appliquée rendait le texte environnant faux, et le
  laisser tel quel aurait mis l'annexe en contradiction avec elle-même.
