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

**Total exclu : 23. Total retenu : 78.**

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
à 78 IN / 23 OUT, et les exigences `EX-NAV-*` d'encodage s'appliquent aux 78.

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
