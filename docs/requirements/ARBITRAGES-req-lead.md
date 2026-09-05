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
