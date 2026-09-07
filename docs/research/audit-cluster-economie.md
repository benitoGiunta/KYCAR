# audit-cluster-economie — Revue croisée du cluster économie et substitution

**Agent** : `audit-3`, phase 1.5 du `PLAN-1-data-acquisition.md`. Audite les rapports :
`probe-LOT-F.md`, `probe-LOT-GH.md`, `probe-LOT-E.md`, `probe-LOT-M.md`, `probe-LOT-I.md`,
`probe-LOT-LO.md`, `probe-LOT-PQ.md`, `probe-LOT-CD.md`. Mandat : cohérence transverse (unités R5,
dénominateur de couverture, sévérité A11, verdicts de dominance, taux `[NON VÉRIFIÉ]`), pas
re-investigation. Aucun test réseau exécuté (cluster documentaire) ; vérifications faites par
lecture croisée des sources déjà citées dans les 8 rapports et par lecture directe de
`FINDING-allowed-surface.md` et `docs/requirements/draft-data-dictionary.md` (documents sources,
pas des probes à auditer).

Convention de verdict : `FAUX` (affirmation contredite par la source qu'elle cite elle-même),
`NON PROUVÉ` (affirmation présentée comme acquise mais reposant sur une inférence non testée),
`INCOHÉRENT` (deux endroits du corpus se contredisent sans arbitrage), `OK` (vérifié, cohérent).

---

## 1. Dénominateur de couverture — TRANCHÉ

**Le dénominateur officiel est 40.** Deux preuves indépendantes le confirment :

1. `PLAN-1-data-acquisition.md`, axe A3 : « nb de champs utiles / **40** du dictionnaire cible ».
2. `FINDING-allowed-surface.md`, titre de la section 2.3 : **« Annonces réelles : 20 par page, 40
   champs chacune »** — le document source lui-même annonce 40 dans son titre.

**Mais la liste à puces de cette même section 2.3 n'énumère que 35 champs nommés** (recompté par
cet audit, puce par puce : identité 2, prix 5, classification 5, motorisation 2, carburant 5,
état 4, géographie 3, vendeur 4, divers 5 = **35**, pas 40). **L'écart de 5 champs est un défaut du
document source `FINDING-allowed-surface.md` lui-même**, pas une invention d'un agent de lot :
le titre promet 40, le corps n'en nomme que 35, et le document ne dit nulle part quels sont les 5
champs manquants.

**Verdict par lot** :

| Lot | Dénominateur utilisé | Verdict |
|---|---|---|
| `LOT-F` | **35**, explicitement justifié (« le document source parle de "40 champs" sans tous les nommer un par un… choix méthodologique documenté »), marqué `[BASE ~35/40 nommés]` partout | **OK** — c'est la seule sonde du cluster qui a repéré l'écart et l'a documenté au lieu de le silencier. Traitement exemplaire de R1. |
| `LOT-E` | 40 (axe A3 systématiquement noté « / 40 ») | **OK** — dénominateur officiel, correctement appliqué. |
| `LOT-I` | 40 (« 20 des 40 champs cibles », C-67 compté contre 40) | **OK**. |
| `LOT-LO` | 40 (C-19 : « 95 champs, très supérieur aux 40 champs cibles ») | **OK**. |
| `LOT-M` | 40, avec une clarification supplémentaire : « dictionnaire (82 champs, ~40 fournis par source) ». Le nombre 82 est **réel et sourcé** — `docs/requirements/draft-data-dictionary.md` ligne 1815 mentionne bien « les 82 champs de chaque annonce » comme le schéma KYCAR complet. LOT-M distingue donc correctement le schéma KYCAR total (82) du sous-ensemble « cible » comparable inter-lots (40), et compte ses candidats contre 40 dans le tableau réel. | **OK**, formulation de l'en-tête un peu elliptique mais non fautive une fois la source du 82 vérifiée. |
| `LOT-PQ` | Sans objet direct (le lot mesure une population de référence et des vendeurs de valorisation, pas une couverture de champs AS24 comparable) | **OK** — n'introduit pas de troisième dénominateur. |
| `LOT-CD` | 40 pour les questions falsifiables (« mêmes 40 champs par annonce ») **mais** affirme ailleurs que la surface autorisée porte « **~24 champs** déjà prouvés » — voir constat dédié ci-dessous. | **FAUX** sur le chiffre 24 (voir 1.1). |

### 1.1 — `probe-LOT-CD.md`, A3 de `C-06` et `C-07`, question falsifiable C-1 : **FAUX**

`LOT-CD` écrit à trois reprises que le payload `__NEXT_DATA__` « recoupe fortement les **~24 champs**
déjà prouvés sur la surface autorisée par `FINDING-allowed-surface.md` §2.3 » (lignes 89, 124, 519).
Cet audit a recompté §2.3 de `FINDING-allowed-surface.md` puce par puce : **35 champs sont nommés**,
pas 24 (détail au § 1 ci-dessus). Aucun autre document du plan (ni `probe-LOT-A.md`, ni
`FINDING-allowed-surface.md` lui-même) ne mentionne un sous-ensemble de 24 champs « prouvés » par
opposition à 35 « nommés » — la recherche croisée de cet audit sur ce chiffre ne retrouve **aucune**
autre occurrence de « 24 champs » dans tout `docs/research/`. Le chiffre 24 apparaît donc comme un
sous-comptage propre à `LOT-CD`, sans source.

**Correction proposée** : remplacer « ~24 champs » par « ~35 champs » aux trois occurrences
(lignes 89, 124, 519 de `probe-LOT-CD.md`), en reprenant la même référence `FINDING-allowed-surface.md`
§2.3 déjà citée par `LOT-CD` — c'est la même source, simplement mal comptée. Cela ne change aucun
verdict de `LOT-CD` (tous restent `VIABLE SOUS CONDITION` / `NON TRANCHÉE`), seulement la précision
d'un chiffre cité trois fois.

**Recommandation pour `compile-1`** : dans le tableau maître de la phase 1.6, exprimer **tous** les
comptages de champs contre le dénominateur **40** (le seul mandaté par le plan et par le titre de
`FINDING-allowed-surface.md` §2.3). Les comptages de `LOT-F` (exprimés « /35 ») restent valides en
valeur absolue (ex. memo23 ~28-30 champs) ; il suffit de les ré-étiqueter « X/40 » plutôt que « X/35 »
pour la comparabilité inter-lots — ne pas recalculer de pourcentage à partir du 35.

---

## 2. Cohérence des unités R5

### 2.1 Vérification de la méthode commune

`LOT-F` fixe la convention : hypothèse défavorable de 115 000 annonces BE/jour (source :
`FINDING-allowed-surface.md`, reprise par `candidates-final.md` section LOT-M), × 30 jours =
**3 450 000 annonces-équivalent/mois**, taux **1 USD ≈ 0,92 EUR** affiché comme ordre de grandeur non
vérifié en temps réel. `LOT-GH` reprend **exactement** cette même convention pour comparer
l'auto-hébergement à `LOT-F` (cite littéralement « l'hypothèse défavorable de `LOT-F`
(3 450 000 pages-équivalent/mois) » et le même taux de change) — recalcul vérifié par cet audit :
0,44 Go/1000 pages (1000 × 440 Ko = 440 000 Ko, conversion correcte) × 7-8,40 $/Go × 0,92 = **2,84 €
à 3,40 €/1000 pages**, chiffre reproduit à l'identique dans `probe-LOT-GH.md`. **OK** — c'est la
seule paire de lots du cluster qui partage une base de calcul chiffrée bout en bout, et elle est
correctement recalculée par cet audit sans écart.

Le volume de 115 000 annonces BE/j est lui-même corroboré de façon indépendante par `probe-LOT-E.md`
(estimation par proportion de la taille d'artefact compressé : **~107 000**, à 7 % de 115 000, deux
ancrages convergents) — cet audit note que la convergence est bonne mais rappelle, comme `LOT-E`
le fait lui-même, que l'hypothèse de proportionnalité taille-compressée/nombre-de-lignes n'est
« pas prouvée » : la convergence renforce la plausibilité, elle ne prouve pas le chiffre.

`LOT-M`, `LOT-I`, `LOT-LO`, `LOT-PQ` ne calculent **aucun** prix €/1000 annonces — chacun le
signale explicitement (« Sans objet », « R5 ne peut être renseigné », « aucun prix inventé ») plutôt
que de fabriquer une valeur. **OK**, cohérent avec R1/R4 : l'absence de prix n'est pas cachée.

`LOT-CD` ne calcule pas de prix propre à AS24 (aucun accès), mais cite correctement le prix
d'un substitut commercial déjà chiffré par `LOT-F` (Anysite, 2,67-3,01 €/1000, citation exacte) pour
`C-13` — **OK**, renvoi correct, pas de recalcul divergent.

### 2.2 — `probe-LOT-F.md`, section « Lecture d'ensemble », médiane ≈ 1,94 €/1000 : **INCOHÉRENT**

Le mandat demandait explicitement de vérifier si cette médiane est calculée sur des valeurs
homogènes. **Réponse : non, elle mélange deux catégories de valeurs de nature différente sans le
signaler à l'endroit où la médiane est calculée**, alors que `LOT-F` signale pourtant ces mêmes
réserves ailleurs dans le document :

- **Confirmées, ratio annonce connu sans hypothèse** : memo23 (0,83 €), solidcode (0,69 € à 2,76 €,
  déjà une fourchette), automation-lab (1,79 € à 2,76 €), Anysite PAYG (2,67 €, ratio 1
  crédit = 1 annonce publié noir sur blanc).
- **Non confirmées, présentées comme un point alors que ce sont des bornes hautes dépendant d'un
  ratio explicitement marqué `[NON VÉRIFIÉ]` ailleurs dans le même document** : Piloterr (2,08 €,
  le document dit lui-même que si 1 crédit = une page de ~20 annonces plutôt qu'une annonce, le
  vrai coût tombe à 0,10-0,13 €, soit un facteur ×20) et Carapis Professional (2,75 €, le document
  dit lui-même que le ratio annonces/appel est `[NON VÉRIFIÉ]` et appelle ce chiffre un « calcul
  naïf »).

Les six valeurs utilisées pour la médiane (0,83 ; 0,69 ; 1,79 ; 2,08 ; 2,67 ; 2,75) traitent donc
deux valeurs sur six (Piloterr et Carapis) comme des points de mesure au même titre que les quatre
autres, alors que le document les qualifie lui-même, dans les paragraphes qui précèdent
immédiatement, de bornes hautes sur un ratio non confirmé. La médiane de 1,94 €/1000 est donc
**correctement calculée arithmétiquement**, mais **présentée avec un degré de confiance supérieur
à ce que les données sous-jacentes permettent** — c'est une incohérence entre le corps du document
(qui documente scrupuleusement chaque réserve) et sa phrase de synthèse (qui les efface).

**Correction proposée** : recalculer la médiane sur les seules valeurs à ratio confirmé (Apify ×3 +
Anysite PAYG) : {0,69 ; 0,83 ; 1,79 ; 2,67}, médiane = **(0,83+1,79)/2 ≈ 1,31 €/1000 annonces**. La
conclusion qualitative du lot (« le prix médian est nettement sous le seuil de 5 €/1000 » — question
falsifiable n°3) **reste vraie** avec cette correction, et le seuil de 5 € reste très confortable ;
seul le chiffre précis « 1,94 » doit être requalifié en `compile-1` comme une estimation optimiste
plutôt qu'une médiane robuste. La comparaison de `LOT-GH` (2,84-3,40 € pour l'auto-hébergement)
reste valide sous la correction : elle dépasse même la médiane resserrée (1,31 €) et la totalité
des quatre valeurs confirmées sauf Anysite — le verdict de dominance de `LOT-F` sur l'auto-hébergement
(§ 3.1 ci-dessous) n'est donc **pas** affaibli par cette correction.

### 2.3 — Tableau des prix normalisés R5, vérifié par cet audit

| Candidat | Lot | €/1000 annonces (ou pages) | Statut du ratio | €/mois BE (3 450 000/mois) |
|---|---|---|---|---|
| Apify memo23 | `LOT-F` | 0,83 € | confirmé | 2 863 € |
| Apify solidcode | `LOT-F` | 0,69 à 2,76 € | confirmé (fourchette source contradictoire) | 2 380 à 9 522 € |
| Apify automation-lab | `LOT-F` | 1,79 à 2,76 € | confirmé | 6 176 à 9 522 € |
| Anysite.io PAYG | `LOT-F` | 2,67 € | **confirmé, le plus fiable du lot** | 9 212 € |
| Piloterr (Standard API) | `LOT-F` | 2,08-2,50 € (borne haute) **ou** 0,10-0,13 € (borne basse plausible) | **`[NON VÉRIFIÉ]` — ratio ×20 d'écart** | 7 176-8 625 € ou 359-431 € |
| Carapis Professional | `LOT-F` | 2,75 € (calcul naïf) | **`[NON VÉRIFIÉ]`** | 9 488 € (suppose un contrat volume non publié) |
| auto-api.com | `LOT-F` | non chiffrable | tarif sur devis | non calculable |
| ScrapingBee | `LOT-F` | non chiffrable | 3 inconnues combinées | non calculable |
| Scrapfly (ASP) | `LOT-GH` | non chiffrable (multiplicateur ASP non publié) | `[NON VÉRIFIÉ]` | non calculable |
| Scrape.do | `LOT-GH` | non chiffrable (ratio crédits/page réussie non publié) | `[NON VÉRIFIÉ]` | non calculable |
| Bright Data Web Unlocker | `LOT-GH` | 1,20-1,38 € | confirmé (pay only for success) | ≈ 4 100-4 750 € |
| Oxylabs Web Unblocker | `LOT-GH` | 1,82-2,29 € | confirmé | ≈ 6 280-7 900 € |
| Auto-hébergé PAYG (C-33/34) | `LOT-GH` | **2,84-3,40 €** (bande passante seule, hors CPU/échec) | confirmé pour la bande passante, borne basse pour le total réel | ≈ 9 800-11 730 € |
| Anysite `dealers/listings` (cité par `LOT-CD`) | `LOT-F`/`LOT-CD` | 2,67-3,01 € | confirmé | renvoi, pas recalculé |

Tous les autres candidats du cluster (`LOT-M`, `LOT-I`, `LOT-PQ`, `LOT-LO`) sont à **0 € d'accès**
(endpoints publics gratuits) ou **sur devis non chiffrable**, et le sont explicitement — aucune
fabrication de valeur détectée dans ces quatre lots.

---

## 3. Verdicts de dominance

### 3.1 — `LOT-GH` : auto-hébergé dominé par `LOT-F` — **OK, chiffré**

Le calcul (§ 2.3 ci-dessus) tient même après correction de la médiane `LOT-F` (§ 2.2) : la borne
basse de l'auto-hébergement (2,84 €) dépasse toutes les valeurs `LOT-F` à ratio confirmé sauf
Anysite (2,67 €, quasiment à égalité), et l'auto-hébergement ne compte que la bande passante — CPU,
maintenance et taux d'échec restent non chiffrés et pousseraient le coût réel plus haut, dans le sens
qui confirme la dominance. **Verdict maintenu, bien argumenté, chiffré des deux côtés.**

### 3.2 — `LOT-M` : concessionnaires « redondants » avec 2dehands — **NON PROUVÉ pour la substituabilité elle-même, chiffré pour l'échelle**

Deux affirmations distinctes sont fusionnées dans le verdict de `LOT-M`, et seule l'une des deux est
chiffrée :

1. **« Le volume potentiel des garages est trois ordres de grandeur sous 2dehands »** — **OK,
   chiffré** : 7 sites vivants × ~70 annonces ≈ 500, contre 100 188 pour 2dehands. Solide, mesuré.
2. **« Les véhicules des garages sont déjà présents sur 2dehands (substituables, pas disjoints) »**
   — **NON PROUVÉ**, et `LOT-M` le reconnaît lui-même dans sa question falsifiable 3 : « VRAIE (par
   inférence forte)… **Non mesuré par appariement direct** : E5 + budget ». C'est une inférence
   structurelle (les vendeurs professionnels pratiquent la multidiffusion) et non une mesure de
   recouvrement réel entre les deux corpus. Le mot « redondant » employé comme titre de section («
   Complémentarité avec 2dehands… Verdict : très majoritairement REDONDANT ») porte un poids de
   certitude que le corps du texte, plus prudent, ne revendique pas.

**Ce n'est pas un `FAUX`** — `LOT-M` documente honnêtement la limite dans sa question falsifiable —
mais le titre de section et le verdict en gras (« REDONDANT ») risquent d'être lus par `compile-1`
comme un fait établi plutôt que comme une inférence non vérifiée. **Recommandation** : `compile-1`
doit traiter la substituabilité concessionnaire↔2dehands comme une zone d'ombre matérielle au sens
de la phase 1.6 (S2), pas comme un fait acquis, et envisager le scénario défavorable (recouvrement
réel plus faible qu'anticipé, ce qui redonnerait de la valeur au stock concessionnaire comme
appoint). L'argument d'échelle (point 1) suffit de toute façon, seul, à écarter le stock
concessionnaire comme source primaire — la robustesse du verdict final ne dépend donc pas de
l'inférence non prouvée.

Aucun autre verdict de dominance non chiffré n'a été trouvé dans le cluster : les autres comparaisons
(`LOT-I` C-67 vs jeux Kaggle, `LOT-PQ` RDW vs Belgique, `LOT-LO` C-19 vs C-86/C-84) sont posées comme
des rôles complémentaires plutôt que des dominances tranchées, et n'appelaient donc pas de
chiffrage comparatif.

---

## 4. Sévérité de l'axe A11

### 4.1 — Cohérence inter-lots sur le mécanisme d'extraction tierce

`LOT-F` (C-31, C-22, C-25, C-29, C-30, C-24) et `LOT-GH` (C-23, C-26, C-27, C-28) notent tous **4/5**
pour le même mécanisme juridique (extraction/mise à disposition tierce d'un sous-ensemble de la base
AS24, contrat AS24 opposable au client final quel que soit l'intermédiaire, per `probe-LOT-K.md`).
**OK, cohérent** — les deux lots citent la même source (`probe-LOT-K.md`) pour justifier la note, et
l'appliquent uniformément à des mécanismes équivalents.

`LOT-CD` note **5/5** pour `C-09`/`C-10`/`C-11`/`C-12`/`C-13` (LOT-D, `Disallow` explicite
`User-agent: *`, sans exception, doublé d'une fermeture technique par gateway pour `C-09`/`C-10`) et
**4/5** pour `C-06`/`C-07`/`C-08` (LOT-C, chemins non couverts par une directive `Allow`, mécanisme
Handler-AGB identique mais sans `Disallow` universel aussi explicite). **OK** — c'est la gradation la
mieux justifiée du cluster : `LOT-CD` distingue correctement une interdiction absolue et sans
exception (5/5) d'une interdiction déduite de l'absence de permission (4/5), avec la preuve
(`probe-LOT-A.md`) citée pour chaque TLD.

### 4.2 — `probe-LOT-GH.md`, A11 de `C-33`/`C-34` (auto-hébergement) : **INCOHÉRENT, mineur**

Le tableau note **4/5**, identique à `LOT-G` (services managés). Mais le texte du verdict dit
explicitement : « A11 Exposition juridique | 4/5 — identique aux autres, **avec en plus** le fait
que l'opérateur assume seul le risque, **sans même le report contractuel partiel** qu'offrent les
CGU des fournisseurs `LOT-G` ». Un facteur aggravant est nommé (« en plus ») sans que la note
elle-même n'en tienne compte — si un facteur aggravant propre à `C-33`/`C-34` existe et est cité
explicitement, la note devrait logiquement être strictement supérieure à celle de `LOT-G`, pas
identique.

**Nuance qui limite la portée du constat** : le même document démontre par ailleurs (section «
Clause de conformité robots.txt ») que les CGU des fournisseurs `LOT-G` ne transfèrent **en réalité
aucun** risque contractuel à KYCAR non plus (« KYCAR resterait le sujet de droit exposé, exactement
comme s'il scrapait lui-même »). Le « report contractuel partiel » cité comme facteur aggravant pour
`C-33`/`C-34` est donc, par la propre analyse du document, **illusoire** pour `LOT-G` aussi — ce qui
rend en fait la note égale (4/5 = 4/5) défendable, mais alors la phrase « en plus… sans même le
report contractuel partiel » est de trop et sème la confusion : elle décrit un delta qui, selon
l'analyse du même document, n'existe pas en pratique.

**Correction proposée** : dans `probe-LOT-GH.md`, section `C-33`/`C-34`, retirer ou reformuler la
clause « en plus… sans même le report contractuel partiel qu'offrent les CGU des fournisseurs LOT-G »
— soit en la remplaçant par une note explicite du type « ce delta théorique est nul en pratique, cf.
section Clause de conformité robots.txt ci-dessus », soit en relevant la note à 5/5 si le
coordinateur juge le delta réel malgré l'analyse. **Ne change aucun verdict final** (les deux
familles restent `NON VIABLE`/`VIABLE SOUS CONDITION` bloquées par A11), c'est une clarification
rédactionnelle, pas une erreur de fond.

### 4.3 — Gradation A11 hors mécanisme d'extraction (LOT-M, LOT-I, LOT-PQ, LOT-LO) : **OK**

La gradation entre familles de mécanisme est cohérente et croissante avec le degré réel de
consentement/légitimité de la source :
- **1/5** : données fournies volontairement par un producteur consentant, sans requête vers AS24
  (`LOT-M` C-86/C-84/C-46/C-76 — le garage consent ; `LOT-PQ` C-77/C-78/C-79/C-90 — statistique
  publique officielle).
- **2/5** : accès contractuel légitime dont l'éligibilité de KYCAR est incertaine, ou objet vendu
  moins directement extrait (`LOT-I` C-67 — partenariat RWI/AS24 officiel mais usage scientifique
  requis ; `LOT-PQ` C-75 Autotelex — modèle hybride documenté ; `LOT-M` C-92 API REST d'un tiers
  sans CGU anti-script relevée).
- **3/5** : provenance non traçable ou silence structurel d'un vendeur sur sa méthode (`LOT-I` C-39
  Zenodo — provenance non traçable ; `LOT-PQ` C-57 INDICATA — silence de la source primaire sur 5
  pages lues, traité comme un signal aggravant plutôt qu'une preuve, correctement qualifié
  `argumenté` et non `prouvé`).
- **4/5** : extraction directe ou revente d'une extraction directe (`LOT-F`, `LOT-GH`, voir § 4.1).
- **5/5** : interdiction absolue sans exception (`LOT-CD` LOT-D, voir § 4.1).

Cette échelle est **cohérente sur l'ensemble du cluster** : aucun lot ne note un mécanisme
équivalent de façon significativement différente d'un autre lot, à l'exception mineure relevée en
§ 4.2. C'est un point fort transverse du cluster à signaler positivement à `compile-1`.

---

## 5. Taux de `[NON VÉRIFIÉ]` — `LOT-LO`

Le mandat signale 4 candidats de `LOT-LO` au-dessus de 25 % : `C-85` (57 %), `C-18` (36 %), `C-17`
(100 %), `C-47` (50 %). Examen candidat par candidat :

| Candidat | Taux | Nature de la justification | Verdict de l'audit |
|---|---|---|---|
| `C-85` | 57 % | Structurelle : trois angles de recherche indépendants échouent à nommer les « dix prestataires » ; sans ces noms, aucun tarif/schéma/couverture n'est documentable par construction | **OK** — indétermination réelle, pas du remplissage |
| `C-18` | 36 % | Structurelle, et **renforcée par un test exécuté** : deux lectures directes (SyncSpider, WPdealer) infirment la prémisse même du candidat (flux sortant, pas un canal de lecture tiers) — les axes non renseignés le sont parce que le mécanisme visé n'existe pas tel que supposé | **OK**, la meilleure des quatre justifications : elle repose sur un test réel, pas seulement une absence de source |
| `C-17` | 100 % | Structurelle et assumée explicitement comme un choix méthodologique honnête (« noter cette valeur à 100 % plutôt que de forcer des estimations sans fondement… est le choix le plus honnête au sens de R1 ») après deux angles de recherche indépendants stériles | **OK** — c'est le traitement le plus rigoureux du cluster pour un candidat dont l'existence même n'est pas établie |
| `C-47` | 50 % | **Priorisation de budget** (« le temps de sonde disponible a été priorisé sur l'Index [d'AUTO1] parce qu'il répond directement à l'idée directrice du lot »), pas une indétermination structurelle comme les trois autres | **NON PROUVÉ comme justification suffisante** — c'est un choix d'allocation de ressources, honnêtement déclaré, mais d'une nature différente des trois autres cas (« impossible à savoir » vs « pas eu le temps de vérifier »). La piste la plus prometteuse du candidat (CarNext via `moniteurautomobile.be`) est elle-même signalée par `LOT-LO` comme vérifiable « en 2 minutes » et reportée en `ACTIONS-COMMANDITAIRE` — ce qui confirme que le taux élevé n'est pas dû à l'absence de piste, mais à un arbitrage de temps. |

**Conclusion** : 3 des 4 dépassements sont bien justifiés au sens de S3 (indétermination structurelle
ou test négatif). Le 4ᵉ (`C-47`) est **honnêtement déclaré mais d'une justification plus faible** —
ce n'est pas du remplissage caché (le document ne dissimule rien), mais `compile-1` devrait le
traiter différemment des trois autres : une relance de 2 minutes sur la piste CarNext (déjà proposée
par `LOT-LO` lui-même en `ACTIONS-COMMANDITAIRE`) résoudrait vraisemblablement une bonne partie de ce
taux avant la compilation finale, ce qui n'est pas vrai pour `C-85`/`C-18`/`C-17`.

`LOT-PQ` présente un profil symétrique et cohérent avec `LOT-LO` (`C-57` 57 %, `C-75` 64 %, `C-56`
64 %, `C-90` 29 %, `C-41` 29 %) — tous justifiés par la fermeture structurelle des modèles B2B sur
devis, cas structurel comparable à `C-85`/`C-17` de `LOT-LO`. **OK**, cohérence transverse
satisfaisante entre les deux lots documentaires du cluster confrontés au même obstacle (opacité
commerciale B2B).

---

## Score de fiabilité par lot

**Méthode** : score de départ 100. Déductions : −15 par incohérence interne non résolue affectant un
chiffre repris ailleurs dans le plan (ex. médiane R5, chiffre de champs cité 3 fois) ; −8 par
affirmation présentée avec plus de certitude que sa preuve ne le permet mais sans impact sur le
verdict final ; −5 par faiblesse de justification ponctuelle honnêtement déclarée (ex. C-47) ;
+5 à +10 de bonus pour un traitement explicite et correct d'une ambiguïté qu'un autre lot du cluster
a laissée passer (auto-détection, auto-correction en cours de rédaction). Aucune déduction pour des
cellules `[NON VÉRIFIÉ]` correctement justifiées : R1/R4 récompensent la déclaration honnête d'une
inconnue, l'audit ne la pénalise pas.

| Lot | Score | Motif principal |
|---|---|---|
| `probe-LOT-PQ.md` | **92** | Le plus rigoureux du cluster : tests API réels (RDW), falsification directe d'une hypothèse dimensionnante (kilométrage RDW), traitement homogène des taux `[NON VÉRIFIÉ]`. Déduction mineure pour une granularité A11 inégale entre candidats de la même famille `LOT-P`. |
| `probe-LOT-E.md` | **90** | Preuve de première main exceptionnelle (API en production, historiques Git, tests reproductibles), dénominateur 40 correctement appliqué, hypothèses explicitement marquées comme telles (extrapolation du volume BE par taille d'artefact). |
| `probe-LOT-GH.md` | **88** | Méthode R5 rigoureusement alignée sur `LOT-F`, auto-correction remarquable d'une attribution erronée (Nimble/robots.txt) et d'un excès de `candidates-final.md` sur le dataset Bright Data. Déduction pour l'incohérence mineure de note A11 (§ 4.2). |
| `probe-LOT-I.md` | **87** | Lecture intégrale des documents primaires (PDF FDZ), distinctions fines et correctes (biais agrégé vs biais imputable à la publicité), dénominateur 40 correct. Légère dépendance à une source secondaire non re-vérifiable (article Medium, 403) pour AS24-CH/DE, bien signalée. |
| `probe-LOT-M.md` | **85** | Tests exécutés et concluants, argument d'échelle solide et chiffré, mais le verdict-titre de dominance (« REDONDANT ») porte plus de certitude que l'inférence sous-jacente (non mesurée par appariement direct) ne le permet — voir § 3.2. |
| `probe-LOT-F.md` | **78** | Le meilleur traitement du cluster sur le dénominateur 35/40 (transparence exemplaire), mais la médiane R5 mélange des valeurs confirmées et des bornes hautes non confirmées sans le re-signaler au moment du calcul — voir § 2.2. Conclusion qualitative non affectée, mais le chiffre « 1,94 € » doit être requalifié avant compilation. |
| `probe-LOT-LO.md` | **75** | Trouvaille majeure bien exploitée (`C-19`, dépôt SMG), 3 des 4 taux `[NON VÉRIFIÉ]` >25 % bien justifiés, mais `C-47` mélange indétermination structurelle et sous-investissement de budget sans le distinguer clairement — voir § 5. |
| `probe-LOT-CD.md` | **74** | Bonne rigueur méthodologique dans un mandat contraint (aucune sonde autorisée), section dichotomie de bonne qualité analytique, mais contient une erreur de fait reprise trois fois (« ~24 champs » au lieu de 35, source mal comptée) qui doit être corrigée avant `compile-1` — voir § 1.1. |

---

## Synthèse pour `compile-1`

1. **Dénominateur de couverture : 40**, tranché par le titre de `FINDING-allowed-surface.md` §2.3 et
   par l'axe A3 du plan. `LOT-F` a documenté un écart légitime (35 champs nommés sur 40 promis dans
   le document source) — conserver ses comptages en valeur absolue, réétiqueter en `/40`.
2. **Correction factuelle à porter** : `probe-LOT-CD.md`, remplacer « ~24 champs » par « ~35 champs »
   (3 occurrences, § 1.1 de cet audit).
3. **Correction de calcul à porter** : `probe-LOT-F.md`, la médiane R5 de 1,94 €/1000 doit être
   requalifiée — recalcul sur valeurs à ratio confirmé uniquement donne ≈ 1,31 €/1000 ; la conclusion
   qualitative (sous le seuil de 5 €) et le verdict de dominance sur `LOT-GH` survivent tous deux à
   la correction.
4. **Clarification rédactionnelle à porter** : `probe-LOT-GH.md`, la note A11 de `C-33`/`C-34` (4/5)
   est défendable mais sa justification textuelle (« en plus… sans le report contractuel partiel »)
   contredit l'analyse du même document — reformuler, pas re-noter.
5. **Zone d'ombre à traiter explicitement en phase 1.6** : la substituabilité concessionnaires↔2dehands
   (`LOT-M`) repose sur une inférence non mesurée, mais l'argument d'échelle (500 vs 100 188) suffit
   seul à écarter le stock concessionnaire comme source primaire — le scénario défavorable
   (recouvrement réel plus faible qu'anticipé) ne change donc pas la recommandation.
6. **Point fort transverse à noter positivement** : la gradation de l'axe A11 est cohérente sur
   l'ensemble du cluster (1/5 consentement → 5/5 interdiction absolue), avec une seule incohérence
   mineure (§ 4.2) qui n'affecte aucun verdict final.
