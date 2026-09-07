# probe-LOT-LO — Syndication concessionnaire (LOT-L) et B2B / prix de transaction (LOT-O)

**Agent** : `probe-LO` (phase 1.4 du `PLAN-1-data-acquisition.md`) — Sonnet, effort medium-high.
**Candidats instruits** : LOT-L = `C-86`, `C-85`, `C-84`, `C-19`, `C-18`, `C-17` *(6, ordre imposé
`C-86` d'abord)* ; LOT-O = `C-87`, `C-80`, `C-47`, `C-20` *(4)*.
**Date d'exécution** : 2026-09-07.
**Reprise** : une exécution précédente avait été coupée avant d'écrire ; ce document repart de
zéro et n'hérite d'aucune preuve d'une tentative antérieure.

**Nature du mandat** : documentaire pour l'essentiel. **E5 — zéro requête vers `www.autoscout24.be`
ou `autoscout24.com`** : respecté intégralement, y compris pour les pages de spécification (voir
`C-19` ci-dessous, où la source retenue est un dépôt GitHub tiers et non un hôte `autoscout24.*`).
Par prudence, aucune requête n'a non plus été émise vers un autre TLD `autoscout24.*` (`.de`, `.ch`,
`.at`, `.nl`) : le mandat de ce lot dit explicitement « Cibles = plateformes tierces », plus strict
que le E5 minimal du registre gelé. Deux résultats de recherche ont fait apparaître des titres
`autoscout24.ch` (aide DMS) sans qu'aucune requête n'ait été émise vers ce domaine — ils sont cités
comme piste non explorée, pas comme preuve.

**Convention de preuve (R4)** : `PROUVÉ` = établi par une exécution réelle et journalisée dans ce
document contre la source citée. `DOCUMENTÉ` = affirmé par une source tierce identifiée et lue par
cet agent. `argumenté` = inférence raisonnée à partir de preuves documentées. `[NON VÉRIFIÉ]` = ni
l'un ni l'autre — absence de source, pas preuve contraire.

---

## Attestation de conformité

- **Requêtes vers `autoscout24.be` ou `autoscout24.com` émises par cet agent : 0.**
- **Requêtes vers tout autre domaine `autoscout24.*` émises par cet agent : 0.**
- **Aucun compte créé, aucun credential saisi (R2/E1).** Un seul HTTP 403 rencontré
  (`openlane.eu/en/auctions`) est un blocage serveur sur une requête anonyme, pas une tentative
  d'authentification.
- **Compteur de requêtes tierces (R3, plafond 60) : 45 / 60** — voir journal ci-dessous.

---

## Journal de preuve

| # | Cible | Requête / méthode | Résultat en une phrase |
|---|---|---|---|
| 1 | `autralis.com` | `WebFetch` page « Sales » | Publie sur B2C/B2B « en un instant » (dont AS24) ; **aucune procédure publique d'ajout de destination** |
| 2 | `stockway.pro` | `WebFetch` accueil | Multidiffusion vers « plus de 25-30 sites partenaires » ; lien navigation « Devenir partenaire » repéré |
| 3 | `cpsautosoft.be` | `WebFetch` accueil | Intégrations nommées : IVO-online (Informex), Schadeautos.nl, Mobile.de — **AS24 non nommé** sur cette page |
| 4 | `marktplaatszakelijk.nl/automotive/alle-mogelijkheden/vms/` | `WebFetch` page VMS | ~13 VMS partenaires listés (Autodata, Autotelex, Hexon, VWE…) ; mention générique d'un « koppeling (API) », aucune procédure d'ajout de destination |
| 5 | `movingcar.lu` | `WebFetch` accueil | Multidiffusion confirmée vers AS24, Mobile.de, LeBonCoin ; **aucune documentation d'intégration publique** |
| 6 | `stockway.pro/devenir-partenaire` | `WebFetch` | **Trouvaille décisive** : « notre équipe technique peut prendre en charge votre format de flux, sans aucun coût » + notification automatique quand un client Stockway sélectionne le site partenaire ; Stockway ne s'immisce pas dans la relation commerciale du partenaire ; **procédure = contact direct, pas de self-service** |
| 7 | `dcdw.nl/partners/` | `WebFetch` page partenaires | Liste de partenaires (dont Autotelex, capacité de diffusion multi-portails) ; **aucune procédure technique publiée** |
| 8 | `WebSearch` — heycar ajout de destination/portail | requête | Stérile — FAQ heycar UK atteinte, aucun détail technique d'intégration dealer |
| 9 | `WebSearch` — Carwow ingestion de flux, documentation technique | requête | **Fécond** — révèle le centre d'aide public `dealer-help.carwow.co.uk`, articles nommés sur le flux « bespoke » |
| 10 | `dealer-help.carwow.co.uk/.../how-do-i-send-a-bespoke-feed-to-carwow` | `WebFetch` | Procédure publique : SFTP/FTP (`files.carwow.com`, ports 21/22), clients recommandés Cyberduck/FileZilla |
| 11 | `dealer-help.carwow.co.uk/.../can-i-set-up-a-bespoke-stock-feed` | `WebFetch` | Gabarit CSV nommé : champs obligatoires Stock ID, Model, Colour, Stock Type, RRP, Offer ; 3 options « Pricing Requirement » |
| 12 | `github.com/MarcoAcquaviva/Autoscout24-XML` | `WebFetch` page dépôt | Dépôt confirmé (2 commits, 0 star) ; contenu du script non visible sur la page rendue |
| 13 | `aishoppingfeeds.com/channels/autoscout24/` | `WebFetch` | **HTTP 404** |
| 14 | `raw.githubusercontent.com/MarcoAcquaviva/.../Autoscout_Generator.php` | `WebFetch` fichier brut | **48 balises XML distinctes** extraites du générateur (structure `vehicle_data > vehicles > vehicle`, prix, équipements, médias) |
| 15 | `WebSearch` — spec de feed AS24, champs dealer XML | requête | Révèle `github.com/smg-automotive/autoscout24-api-specs` — **trouvaille majeure de la phase** |
| 16 | `github.com/smg-automotive/autoscout24-api-specs` | `WebFetch` page dépôt | Dépôt officiel Swiss Marketplace Group (maison mère d'AutoScout24 Suisse) : 4 specs OpenAPI publiques — `openapi.yaml`, `openapi-fs24.yaml`, `openapi-listing-distribution.yaml`, `openapi-swiftcourt.yaml` |
| 17 | `aishoppingfeeds.com/channels/autoscout24` (sans `/` final) | `WebFetch` | **HTTP 404** — page inexistante sous les deux formes testées |
| 18 | `raw.githubusercontent.com/.../openapi-listing-distribution.yaml` (branche `main`) | `WebFetch` | API de **distribution en lecture seule**, authentification Bearer obligatoire, schéma `LiveListing` : **52 champs distincts** |
| 19 | idem, branche `master` | `WebFetch` | Confirmation croisée : **76 champs distincts** en comptant les objets imbriqués (`seller`, équipements) — écart avec #18 dû à la granularité de comptage, pas au contenu |
| 20 | `raw.githubusercontent.com/.../openapi.yaml` (branche `main`) | `WebFetch` résumé | API bidirectionnelle (recherche + gestion d'inventaire vendeur), schéma `ListingResponse` estimé « 100+ champs », Bearer OAuth2 client-credentials |
| 21 | idem, extraction exhaustive de `ListingResponse` | `WebFetch` ciblé | **95 champs distincts** dénombrés (81 propriétés directes + 14 propriétés d'objets imbriqués `boot`, `consumption`, `leasing`, `warranty`) |
| 22 | `WebSearch` — data service providers AS24, autohaus.de | requête | Confirme « les dix plus grands *data service providers* », 6/10 avec HändlerIQ ; **aucun nom** |
| 23 | `WebSearch` — kfz-betrieb.vogel.de, HändlerIQ 2025 | requête | Révèle l'article `kfz-betrieb.vogel.de/autoscout-24-will-partnerschaft-mit-datendienstleistern-ausbauen` |
| 24 | `kfz-betrieb.vogel.de/autoscout-24-will-partnerschaft...` | `WebFetch` | **Aucun nom d'entreprise cité** ; aucune portée géographique précisée au-delà de l'Allemagne |
| 25 | `autohaus.de/.../autoscout24-staerkt-digitale-schnittstellen...` | `WebFetch` | **Aucun nom cité** ; portée explicitement allemande (« Sales Chief Germany », « la filière allemande ») |
| 26 | `WebSearch` — Datendienstleister DAT Schwacke Carforce iSecke | requête | DAT et Schwacke documentés comme fournisseurs de données de valorisation généraux, **jamais confirmés nommément** comme faisant partie des « dix » |
| 27 | `WebSearch` — HändlerIQ DMS carLo/autoline/DVSE | requête | Stérile pour les noms ; révèle `help.autoscout24.ch/.../DMS-API` en titre de résultat (domaine AS24, **non requêté** par cohérence avec E5 étendu) |
| 28 | `syncspider.com/integrations/autoscout24-and-external-api/` | `WebFetch` | Confirme un flux **sortant** (stock du concessionnaire → AS24), pas un canal de lecture pour un tiers |
| 29 | `wp-dealer.com/autoscout24-wordpress-integration/` | `WebFetch` | Synchronisation bidirectionnelle **via API**, **aucune mention d'iframe** ni de widget hébergé AS24 |
| 30 | `WebSearch` — parc de garages Autralis/Stockway/CPS Belgique | requête | Stérile sur les volumes ; confirme Stockway spécialisé **véhicules industriels/utilitaires**, pas le marché VP généraliste |
| 31 | `auto1.com/en/investor-relations` | `WebFetch` | Page = interface de connexion ; mention « plus de 30 000 véhicules inspectés » ; **aucune donnée de prix moyen accessible sans compte** |
| 32 | `wijkopenautos.be` | `WebFetch` | Site de rachat, pas de catalogue ; renvoie vers **Autohero** comme vitrine consommateur séparée |
| 33 | `info.openlane.eu/en/start-to-sell/openlane-connect/` | `WebFetch` | Confirme **entrante seule** : « Send vehicle data straight from your own system into OPENLANE Sell » |
| 34 | `openlane.eu/en/auctions` | `WebFetch` | **HTTP 403** — catalogue non accessible en anonyme (test exécuté, échec constaté) |
| 35 | `ecarstrade.com/blog/used-car-prices-in-europe` | `WebFetch` | Cite l'indice AUTO1 Group (−4,8 % en glissement annuel, mars 2025) et une prévision **Autovista Group nommant explicitement la Belgique** comme marché à la plus forte baisse attendue en 2025 |
| 36 | `autoproff.com` | `WebFetch` | Connexion/inscription requise ; aucune donnée de prix ; lien vers `autoproff.be` |
| 37 | `WebSearch` — AUTO1 Group rapport trimestriel, prix moyen, Belgique | requête | Révèle `auto1-group.com/index/` — **trouvaille majeure du lot O** — et les chiffres Q1 2026 (248 779 unités, +21,9 %) |
| 38 | `autoproff.be` | `WebFetch` | Page de sélection de langue seulement ; confirme l'existence d'une entité belge, aucun contenu exploitable |
| 39 | `auto1-group.com/index/` | `WebFetch` | **AUTO1 Group Price Index** : ~5,8 à 6,2 M de transactions B2B réelles depuis janvier 2015, ajustement saisonnier, écrêtage des percentiles 0,5–99,5 ; **indice relatif uniquement (base 100), agrégat paneuropéen, aucune ventilation pays** |
| 40 | `auto1-group.com/press/.../auto1-group-price-index-march-2026/` | `WebFetch` | Détail mars 2026 : indice 139,3 (+1,2 % m/m) ; ventilation par carburant seulement ; **Belgique non mentionnée** |
| 41 | `autohero.com` | `WebFetch` | **Catalogue consultable sans compte**, confirmé actif en Belgique (domaine `nl-be`, Car-Pass, téléphone BE), tranches de prix affichées (`< 15 000 €` … `> 30 000 €`) |
| 42 | `WebSearch` — CarNext.com / Autobiz catalogue Belgique | requête | CarNext référencé comme vendeur sur `moniteurautomobile.be` (portail tiers belge grand public) ; Autobiz confirmé actif dans 22 marchés dont la Belgique, mais comme **API de valorisation**, pas de catalogue |
| 43 | `WebSearch` — LeasingMarkt.de / AutoTrader.ca API publique | requête | **Aucune API officielle documentée** ; seuls des scrapers tiers non officiels (Apify) confirment l'existence d'un catalogue interrogeable de facto |
| 44 | `WebSearch` — iframe AS24 hébergé, `showcase`/`widget.autoscout24` | requête | Stérile — aucune URL d'iframe AS24 retrouvée ; seules les intégrations API (WPdealer, CarSyncPro) apparaissent |
| 45 | `moniteurautomobile.be/vendeur-id--9417--carnext-com-aartselaar/...` | `WebFetch` | Page d'accueil du site rendue au lieu de la fiche vendeur (limite de l'outil de fetch) ; existence du profil vendeur confirmée par le résultat de recherche #42, contenu non vérifié directement |

**Sources locales consultées (hors quota R3)** : `docs/plans/PLAN-1-data-acquisition.md`,
`docs/research/candidates-final.md`, `docs/research/candidates-v1.md`,
`docs/research/candidates-v2.md`, `docs/00-CONTEXT.md`, `docs/research/probe-LOT-CD.md` (référence
de format).

---

## Devenir destination de flux — `C-86`

**Question du mandat : une procédure publique d'ajout de destination existe-t-elle, et chez qui ?**

**Réponse : partiellement.** Aucun des cinq prestataires belgo-luxembourgo-néerlandais nommés par le
registre (Autralis, Stockway, CPS Autosoft, MovingCar, l'écosystème VMS de Marktplaats Zakelijk) ne
publie de documentation technique en libre accès (pas de spec API, pas de format de flux, pas de
formulaire self-service). **Un seul, Stockway, publie une page dédiée** (`/devenir-partenaire`,
journal #6) qui **confirme que le mécanisme existe** : Stockway prend en charge le format de flux du
partenaire « sans aucun coût », notifie automatiquement le partenaire quand un client Stockway le
sélectionne comme destination, et ne s'immisce pas dans la relation commerciale qui suit. C'est la
preuve la plus directe obtenue dans ce lot que **la syndication concessionnaire fonctionne bien comme
un réseau à adhésion**, où ajouter une destination est une opération de configuration côté
prestataire — exactement l'hypothèse de la fiche `C-86`.

**Ce que cette page ne dit pas, et qui reste la vraie inconnue** : la procédure documentée est un
**contact commercial**, pas un self-service, et rien n'indique le critère d'éligibilité d'un
« site partenaire ». Les exemples cités par Stockway et par les pages équivalentes des autres
prestataires sont systématiquement des **portails d'annonces avec trafic acheteur** (AutoScout24,
Gocar, VROOM, 2dehands, sites B2B sectoriels) — jamais un outil analytique sans vitrine publique
d'annonces. KYCAR ne matche pas ce profil. La question falsifiable du mandat («*au moins un
prestataire accepte techniquement l'ajout d'une destination tierce, sans agrément d'AutoScout24*»)
est donc **vraie sur le plan technique et procédural**, mais **son applicabilité à un demandeur du
profil de KYCAR est `[NON VÉRIFIÉ]`** — seule une prise de contact réelle (`ACTIONS-COMMANDITAIRE`)
peut trancher.

**Nuance supplémentaire trouvée (journal #30)** : Stockway se décrit lui-même comme spécialisé dans
les **véhicules industriels** (poids lourds, utilitaires, matériel BTP et agricole), pas le marché
généraliste des véhicules particuliers que vise KYCAR (H5). C'est le prestataire le plus documenté
du lot sur la procédure d'ajout de destination, mais probablement le moins pertinent sur le
périmètre de flotte. Autralis et CPS Autosoft, plus généralistes, ne documentent aucune procédure.

**Modèle heycar/Carwow** : la recherche indépendante (journal #9-11) trouve chez Carwow un centre
d'aide public et détaillé (`dealer-help.carwow.co.uk`) documentant la mécanique **de réception** de
flux (SFTP/FTP, gabarit CSV à champs nommés, 3 options de règle de prix). C'est la confirmation
externe que « se faire alimenter plutôt que crawler » est un modèle industriel réel et documenté —
mais Carwow documente le **flux entrant depuis un concessionnaire déjà partenaire**, pas la
procédure pour qu'un tiers **devienne lui-même une destination** parmi lesquelles le concessionnaire
choisit. Aucune source, ni Carwow ni heycar (silencieux sur ce point, journal #8), ne documente cette
direction précise de la question.

---

## Plafond de richesse du feed AS24 — `C-19`

**Question du mandat : combien de champs porte la spec de feed ?**

**Réponse chiffrée, avec une réserve de portée.** Le générateur XML open source cité par la fiche
`C-19` (`MarcoAcquaviva/Autoscout24-XML`, journal #12/#14) est un script ancien et minimal :
**48 balises XML distinctes**, dont plusieurs structurelles (`stx3`, `vehicle_data`, `vehicles`) et
non des champs de données. Trop pauvre pour servir de plafond de richesse représentatif.

La recherche indépendante (journal #15) a trouvé une source bien plus riche et **plus officielle** :
le dépôt public **`github.com/smg-automotive/autoscout24-api-specs`**, maintenu par Swiss
Marketplace Group — la maison mère d'AutoScout24 Suisse. Ce dépôt publie **quatre spécifications
OpenAPI** :

| Fichier | Nature | Champs comptés |
|---|---|---|
| `openapi.yaml` | API bidirectionnelle — recherche **et** gestion d'inventaire vendeur (POST/PUT de fiches), authentification OAuth2 client-credentials | **95 champs distincts** sur le schéma `ListingResponse` (81 propriétés directes + 14 dans les objets imbriqués `boot`, `consumption`, `leasing`, `warranty`) — journal #20-21 |
| `openapi-listing-distribution.yaml` | API de **distribution en lecture seule** vers des tiers, Bearer obligatoire — le pendant technique probable de la « technische Schnittstelle » du § 17.2 des `Händler-AGB` citée par `C-85` | 52 à 76 champs selon la granularité de comptage (avec ou sans objets imbriqués `seller`, équipements) — journal #18-19 |
| `openapi-fs24.yaml` | Non instruit (hors budget de requêtes) | — |
| `openapi-swiftcourt.yaml` | Non instruit (hors budget de requêtes) | — |

**Le plafond de richesse retenu est donc de l'ordre de 90 à 100 champs** (schéma `ListingResponse`
de l'API principale), très supérieur aux 40 champs du dictionnaire cible de KYCAR. **Conséquence
directe pour `C-86`** : si un contrat d'entrée `DataProvider` calqué sur ce schéma était obtenu (via
`C-86` ou via un accès partenaire), le plafond de richesse ne serait **jamais le facteur limitant** —
n'importe lequel des 40 champs cibles trouverait presque certainement un correspondant dans ce
dictionnaire, à un renommage près (ex. `makeKey`/`modelKey` plutôt que `brand`/`model`, cohérent avec
le style de nommage déjà observé côté mobile par `probe-LOT-B.md`).

**Réserve de portée, à ne pas dissimuler** : ce dépôt appartient à **Swiss Marketplace Group**
(marché suisse), pas nommément à AutoScout24 Belgique ou Allemagne. Deux éléments atténuent le
risque que ce soit hors sujet : (a) `C-88` a déjà établi que l'organisation AutoScout24 publie du
code sous une architecture de composants partagés (`showcar-ui`, `carbon-core`) suggérant un socle
technique commun aux marchés du groupe ; (b) la nature du schéma (marque, modèle, carrosserie,
kilométrage, CO2, transmission, batterie électrique, leasing…) est générique à l'automobile
européenne et sans aucun champ spécifiquement suisse (canton, plaque, etc.) observé dans l'extraction.
**`[NON VÉRIFIÉ]`** : que ce schéma soit identique, et non seulement analogue, au feed accepté pour
un concessionnaire belge ou allemand. C'est la question la plus rentable à poser si un canal
`C-01`/`C-48`/`LOT-K` s'ouvre.

---

## Prix de transaction comme ancrage — `LOT-O`

**Question du mandat : une référence de prix de transaction belge est-elle obtenable ?**

**Réponse : un signal directionnel oui, une valeur absolue non — sur source gratuite.**

1. **AUTO1 Group Price Index** (`auto1-group.com/index/`, journal #39-40) est la meilleure source
   trouvée : un indice **mensuel, public et gratuit**, construit sur **~5,8 à 6,2 millions de
   transactions B2B réelles** depuis janvier 2015, avec écrêtage des percentiles extrêmes (0,5–99,5)
   et ajustement saisonnier — une méthodologie documentée et sérieuse, sur des **prix payés**, pas
   des prix demandés. C'est exactement l'ancrage que le mandat cherche, sur le principe. **Mais** il
   ne publie qu'un **indice relatif** (base 100 = janvier 2015, valeur 139,3 en mars 2026), agrégé à
   l'échelle **paneuropéenne**, ventilé uniquement par type de carburant — **aucune valeur absolue en
   euros, aucune ventilation par pays, la Belgique n'apparaît dans aucun communiqué consulté.**
   Utilisable pour dater et quantifier une **tendance** de marché (ex. confirmer qu'un dépôt anormal
   de prix affichés suit ou contredit la tendance B2B du mois), pas pour calibrer un niveau de prix
   absolu par segment belge.
2. **Autovista Group**, cité par un article tiers (`ecarstrade.com`, journal #35), **nomme
   explicitement la Belgique** dans sa prévision 2025 : parmi les marchés européens, la Belgique est
   celui où la **plus forte baisse de valeur** est attendue. C'est un signal **qualitatif et
   belgo-spécifique**, mais un seul point, non chiffré en euros, non daté avec la précision d'un
   indice mensuel, et rapporté de troisième main (article qui cite le rapport, pas le rapport
   lui-même — non localisé dans ce lot).
3. **AutoHero** (journal #41), la marque de vente en ligne d'AUTO1, est un **catalogue consultable
   sans compte, actif en Belgique**, avec des tranches de prix affichées. Ce n'est pas un ancrage de
   *marché* (c'est le stock propre d'AUTO1, déjà acheté et reconditionné, donc un échantillon
   biaisé par construction vers le haut de gamme du reconditionné) mais c'est une source de **prix
   affichés belges, gratuite et immédiatement exploitable** en complément, à ne pas confondre avec un
   prix de transaction B2B.

**Verdict de synthèse** : le meilleur ancrage transactionnel gratuit disponible est **paneuropéen et
relatif** (AUTO1 Index), complété par un **signal belge qualitatif** (Autovista/Autovista Group cité
par un tiers) et par un **échantillon de prix affichés belges** sans lien avec la transaction
(AutoHero). Aucune des trois sources ne fournit, seule, la grandeur R5 demandée
(€/1 000 annonces, €/mois BE) — parce qu'aucune n'est un service d'accès à la donnée facturé à la
requête : ce sont des publications éditoriales gratuites, pas des API. **`R5` ne s'applique donc à
aucun des trois** en l'état ; il s'appliquerait si un accès plus fin (rapport trimestriel complet
AUTO1, service payant Autovista/EurotaxGlass's) était contractualisé — hors périmètre R2/R3 de cette
phase.

---

## LOT-L candidats

### `C-86` — Devenir soi-même destination de flux entrant

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € documenté chez Stockway (« sans aucun coût ») ; probablement variable chez les autres, non publié | DOCUMENTÉ (Stockway) / `[NON VÉRIFIÉ]` (autres) |
| A2 Coût récurrent | Aucun tarif publié ; le modèle Stockway est décrit comme gratuit pour le partenaire, financé côté client Stockway (le garage) | DOCUMENTÉ (principe), `[NON VÉRIFIÉ]` (montant) |
| A3 Couverture champs | Bornée par le format de flux du prestataire, potentiellement aussi riche que le feed AS24 lui-même (`C-19`, ~95 champs) si le prestataire répercute le même dictionnaire ; aucun exemple de flux réellement reçu n'a été observé | argumenté par renvoi à `C-19`, non prouvé pour un flux réel |
| A4 Couverture géo | Belgique et Luxembourg pour les 5 prestataires cités ; aucun n'est présenté comme actif hors BE/NL/LU | DOCUMENTÉ |
| A5 Latence | Fraîcheur du DMS du garage, pas de latence réseau à proprement parler ; non chiffrée par les sources | `[NON VÉRIFIÉ]` |
| A6 Débit / quota | Sans plafond documenté — la donnée est poussée, pas requêtée | argumenté |
| A7 Stabilité technique | 2/5, argumenté à la baisse : le canal dépend d'une relation commerciale bilatérale avec chaque prestataire, pas d'un contrat technique stable et documenté ; aucun changement de format anticipable sans être soi-même partenaire | argumenté |
| A8 Résistance anti-bot | **Non concerné, par construction** — la donnée est livrée par son producteur, aucun anti-bot à franchir | DOCUMENTÉ (mécanique même du candidat) |
| A9 Effort d'intégration | Faible côté parsing (format probablement XML/CSV standard de filière) mais élevé côté négociation : contact commercial nommé requis (Stockway), critère d'éligibilité de KYCAR non couvert par le profil documenté (« site partenaire » à trafic acheteur) | argumenté |
| A10 Coût de maintenance | Faible techniquement, mais dépend d'une relation commerciale à entretenir (renouvellement, respect d'un cahier des charges de « site partenaire » non documenté) | argumenté |
| A11 Exposition juridique | **1/5 — la plus faible du registre.** Le producteur du contenu est le garage, qui consent explicitement à la destination ; ni le droit *sui generis* d'AS24 (le contenu n'est pas extrait de sa base), ni son `robots.txt`, ni ses `Händler-AGB` ne s'appliquent, puisqu'aucune requête n'est jamais adressée à AS24 | argumenté, mécanisme nommé |
| A12 Autonomie | **Partiel** — dépendance à la volonté du prestataire d'ajouter KYCAR comme destination, et à celle de chaque garage de le sélectionner ; réversible unilatéralement par l'un ou l'autre | documenté |
| A13 Plafond de volumétrie | Fonction du nombre de garages consentants ; aucun chiffre de parc publié par les 5 prestataires (journal #30, stérile). Référence de dimensionnement citée par la fiche : ~115 000 annonces AS24 BE (`FINDING-allowed-surface.md`) — non recoupée ici | `[NON VÉRIFIÉ]` |
| A14 Fraîcheur atteignable | Celle du DMS du garage — potentiellement quasi temps réel, à la discrétion du prestataire | argumenté |

**Verdict** : `VIABLE SOUS CONDITION` — le mécanisme est confirmé publiquement chez au moins un
prestataire (Stockway), avec le profil d'exposition juridique et anti-bot le plus favorable du
registre entier. La condition est double et non technique : (a) un contact commercial réel doit
confirmer l'éligibilité d'un demandeur au profil analytique, non annonceur (`ACTIONS-COMMANDITAIRE`),
et (b) le nombre de garages consentants atteignables reste à chiffrer, sans quoi le candidat livre un
échantillon de représentativité inconnue plutôt qu'un inventaire.

**Taux `[NON VÉRIFIÉ]`** : 3/14 axes (21 %) — sous le seuil de 25 % de S3.

---

### `C-85` — Programme AS24 → « data service providers »

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | Inconnu — aucun des dix prestataires n'est nommé, donc aucun tarif d'accès n'est documentable | `[NON VÉRIFIÉ]` |
| A2 Coût récurrent | Idem | `[NON VÉRIFIÉ]` |
| A3 Couverture champs | Décrite par la presse comme des **statistiques de performance** (vues, leads, jours de présence) et des données agrégées conditionnées à des paquets de services (§ 17.2 `Händler-AGB`, déjà établi par `candidates-final.md`) — **pas explicitement le niveau annonce** | DOCUMENTÉ (nature), `[NON VÉRIFIÉ]` (granularité exacte) |
| A4 Couverture géo | **Allemagne uniquement dans les deux sources lues** (journal #24-25) ; aucune mention de la Belgique, en positif ou en négatif | DOCUMENTÉ pour l'Allemagne, `[NON VÉRIFIÉ]` pour la Belgique |
| A5 Latence | Décrite comme « temps réel » par la presse pour les métriques de performance, sans chiffre | DOCUMENTÉ (qualitatif) |
| A6 Débit / quota | Non documenté | `[NON VÉRIFIÉ]` |
| A7 Stabilité technique | 2/5, argumenté : programme en expansion active (« further partner connections … in preparation »), donc probablement encore instable dans sa forme contractuelle | argumenté |
| A8 Résistance anti-bot | Non concerné — canal contractuel, pas un crawl | argumenté |
| A9 Effort d'intégration | Indéterminable sans connaître un des dix prestataires | `[NON VÉRIFIÉ]` |
| A10 Coût de maintenance | Idem | `[NON VÉRIFIÉ]` |
| A11 Exposition juridique | 2/5, argumenté : canal contractuel légitime côté AS24-prestataire ; l'exposition de KYCAR dépendrait des conditions du **prestataire**, elles-mêmes inconnues | argumenté |
| A12 Autonomie | Non — double dépendance (AS24 puis le prestataire retenu) | documenté |
| A13 Plafond de volumétrie | Sans objet tant que la granularité (annonce vs agrégat) n'est pas tranchée | `[NON VÉRIFIÉ]` |
| A14 Fraîcheur atteignable | « Temps réel » revendiqué par la presse pour les métriques de performance | DOCUMENTÉ (qualitatif) |

**Verdict** : `NON VIABLE en l'état — verrou d'identification non levé`. La question la plus
rentable du candidat (« les dix prestataires sont nommables ») reste **non tranchée** : trois angles
de recherche indépendants (presse professionnelle, DMS/logiciels de gestion nommés, recherche croisée
avec Schwacke/DAT) n'ont produit aucun nom. Le point ouvert `O-1` hérité de `candidates-final.md`
**n'est pas résolu par ce lot** — il reste ouvert, et la couverture géographique documentée
(Allemagne uniquement) affaiblit sa pertinence pour KYCAR/BE indépendamment même de la question des
noms.

**Taux `[NON VÉRIFIÉ]`** : 8/14 (57 %) — **dépasse le seuil de 25 % de S3.** Justification explicite :
le candidat est structurellement indéterminable sans lever le verrou d'identification des dix
prestataires, verrou qui résiste à la presse professionnelle accessible sans abonnement (l'article
AIM Group source, déjà noté `HTTP 403` par `candidates-final.md`, n'a pas été retenté ici : E5/R3
n'autorisent pas de contournement de paywall).

---

### `C-84` — Prestataires BE/NL nommés de multidiffusion

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € pour consulter les sites publics des 5 prestataires ; coût d'intégration réel non publié | DOCUMENTÉ (consultation), `[NON VÉRIFIÉ]` (intégration) |
| A2 Coût récurrent | Non publié par aucun des 5 | `[NON VÉRIFIÉ]` |
| A3 Couverture champs | Renvoie à `C-19`/`C-86` — potentiellement ~95 champs si le format de flux suit le dictionnaire AS24 | argumenté par renvoi |
| A4 Couverture géo | Belgique (Autralis, CPS Autosoft), Luxembourg (MovingCar, Stockway), Pays-Bas (écosystème Marktplaats Zakelijk/DCDW) — confirmé par les 5 pages consultées | PROUVÉ (par cet agent, lecture directe) |
| A5-A6 | Sans objet — flux poussé par le producteur, pas de notion de débit/latence de requête | argumenté |
| A7 Stabilité technique | 2/5 — dépend d'une relation commerciale bilatérale par prestataire, aucune garantie de continuité documentée | argumenté |
| A8 Résistance anti-bot | Non concerné | argumenté |
| A9 Effort d'intégration | Élevé : **5 relations commerciales distinctes** à négocier séparément pour espérer une couverture significative du parc, contre une seule pour `C-19`/`C-85` si ceux-ci s'ouvraient | argumenté |
| A10 Coût de maintenance | Élevé pour la même raison — 5 canaux à surveiller indépendamment | argumenté |
| A11 Exposition juridique | 1/5, même mécanisme que `C-86` — la donnée vient du garage consentant, pas d'AS24 | argumenté |
| A12 Autonomie | Partiel, dépendance à 5 tiers indépendants plutôt qu'à un seul (dilue le risque de coupure totale mais multiplie les frictions) | documenté |
| A13 Plafond de volumétrie | **`[NON VÉRIFIÉ]`** — aucun chiffre de parc publié (journal #30, recherche dédiée stérile) ; nuance découverte : Stockway cible les **véhicules industriels**, pas le marché VP généraliste de KYCAR — réduit le parc utile réel en dessous de ce que la fiche v1 supposait | DOCUMENTÉ pour la nuance (Stockway), `[NON VÉRIFIÉ]` pour le chiffre |
| A14 Fraîcheur atteignable | Celle du DMS de chaque garage, a priori quasi temps réel | argumenté |

**Verdict** : `VIABLE SOUS CONDITION` — mécaniquement identique à `C-86` (dont il partage 3 des 5
prestataires), avec un effort d'intégration multiplié par le nombre de relations à établir. Sa
valeur ajoutée propre par rapport à `C-86` est la **diversité géographique** (BE+LU+NL) plutôt qu'un
mécanisme différent. Nuance nouvelle et défavorable : au moins un des cinq prestataires cités
(Stockway) sert un segment de marché hors périmètre H5.

**Taux `[NON VÉRIFIÉ]`** : 3/14 (21 %).

---

### `C-19` — Spécification de feed concessionnaire

Développé en détail dans la section dédiée ci-dessus. Tableau A1–A14 :

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € — les deux spécifications lues (générateur XML, dépôt SMG) sont publiques et gratuites | PROUVÉ (lecture directe) |
| A2 Coût récurrent | Sans objet — la spec elle-même n'est pas un service facturé ; le canal d'accès aux données réelles (`C-85`/`C-86`/`C-01`) porte le coût réel | argumenté |
| A3 Couverture champs | **95 champs distincts** sur le schéma `ListingResponse` de `openapi.yaml` (SMG), 48 sur le générateur XML v1 (obsolète/minimal), 52-76 sur `openapi-listing-distribution.yaml` selon la granularité | **PROUVÉ** (extraction directe des 3 sources) |
| A4 Couverture géo | Le dépôt est celui de Swiss Marketplace Group — porte donc nommément le marché **suisse** ; extrapolation aux autres marchés du groupe argumentée mais non confirmée | DOCUMENTÉ pour la Suisse, argumenté au-delà |
| A5-A6 | Sans objet — c'est une spec, pas un canal d'accès en direct | — |
| A7 Stabilité technique | Le dépôt GitHub porte un historique versionné et des noms de branche (`main`) cohérents avec une maintenance active — signe positif de stabilité documentaire, 4/5 | argumenté |
| A8 Résistance anti-bot | Sans objet — c'est une spécification, pas un endpoint interrogé | — |
| A9 Effort d'intégration | **Faible si un accès au canal réel s'ouvre** : le schéma cible (champs, types) est déjà entièrement documenté publiquement, un adaptateur `DataProvider` peut être écrit avant même d'avoir accès aux données | estimé |
| A10 Coût de maintenance | Fonction de la fréquence des révisions du schéma amont, non mesurée sur la durée | `[NON VÉRIFIÉ]` |
| A11 Exposition juridique | Sans objet propre — la spec elle-même est publique sur GitHub, la lire n'expose à rien ; l'exposition réelle est celle du canal d'accès choisi (`C-85`, `C-86`, ou un partenariat direct) | argumenté |
| A12 Autonomie | Sans objet pour la spec seule | — |
| A13 Plafond de volumétrie | Sans objet — une spec de champs, pas un canal de débit | — |
| A14 Fraîcheur atteignable | Sans objet propre | — |

**Verdict** : `VIABLE` **en tant qu'artefact de dictionnaire de champs** — c'est la découverte la
plus solide et la mieux prouvée du lot L. Ce n'est **pas un canal d'accès aux données** en soi : sa
valeur est de fixer, avec preuve chiffrée, le plafond de richesse que n'importe quel autre candidat
du lot (`C-86`, `C-84`, `C-85`, un partenariat `LOT-K`) pourrait atteindre au mieux. 7 des 14 axes
sont `Sans objet` par nature (ce n'est pas un canal), ce qui est cohérent avec S1 (aucune cellule
vide, mais toutes ne portent pas une valeur numérique).

**Taux `[NON VÉRIFIÉ]`** : 1/14 (7 %).

---

### `C-18` — Plateformes de multidiffusion comme canal indirect

| Axe | Valeur | Preuve |
|---|---|---|
| A1-A2 | 0 € pour consulter la documentation publique ; coût d'un accès de lecture non documenté | DOCUMENTÉ / `[NON VÉRIFIÉ]` |
| A3 Couverture champs | Renvoie à `C-19` si le flux est au format AS24 ; non confirmé pour SyncSpider ou WPdealer spécifiquement | argumenté |
| A4 Couverture géo | Éditeurs actifs sur plusieurs marchés européens (DE principalement pour Autopult/Autaxo, générique pour SyncSpider/WPdealer) | DOCUMENTÉ |
| A5-A6 | Sans objet documenté | `[NON VÉRIFIÉ]` |
| A7 Stabilité technique | 3/5, argumenté | argumenté |
| A8 Résistance anti-bot | Non concerné — accès contractuel côté éditeur, pas un crawl | argumenté |
| A9 Effort d'intégration | Élevé et **la fiche est affaiblie par cette instruction** : SyncSpider, testé directement (journal #28), documente un flux **sortant** (dealer → AS24), pas un canal de **lecture** pour un tiers comme l'hypothèse de la fiche v1 le supposait. WPdealer documente une synchronisation bidirectionnelle **via API**, mais dans un contexte d'un seul compte concessionnaire, pas d'un accès agrégé multi-concessionnaires pour un tiers analytique | **PROUVÉ (affaiblissement) par lecture directe pour SyncSpider** ; argumenté pour la portée générale du candidat |
| A10 Coût de maintenance | `[NON VÉRIFIÉ]` | — |
| A11 Exposition juridique | 3/5, argumenté — l'éditeur agit sous ses propres droits contractuels avec AS24, la revente d'un accès agrégé à un tiers n'est confirmée par aucune source | argumenté |
| A12 Autonomie | Non — dépend des droits contractuels de l'éditeur avec AS24, hors de portée de KYCAR | documenté |
| A13-A14 | `[NON VÉRIFIÉ]` | — |

**Verdict** : `NON VIABLE en l'état`, revu à la baisse par rapport à la fiche v1. Les deux tests
exécutés (SyncSpider, WPdealer) **contredisent partiellement l'hypothèse structurante du candidat** :
aucun des deux éditeurs testés ne documente publiquement un canal de **lecture** d'inventaire AS24
ouvert à un tiers ; les deux documentent une mécanique de **poussée** vers AS24 (le sens inverse de
`C-86`, pas une variante). La question falsifiable prioritaire du mandat de lot (« au moins un de ces
éditeurs expose une API de lecture d'inventaire AS24 accessible à un tiers non concessionnaire ») est
donc `PROBABLEMENT FAUSSE` sur l'échantillon testé, `NON TRANCHÉE` pour Autopult/Autaxo (non testés,
budget de requêtes orienté vers les trouvailles à plus fort rendement).

**Taux `[NON VÉRIFIÉ]`** : 5/14 (36 %) — **dépasse le seuil de S3.** Justification : la fiche
suppose une mécanique (lecture tierce) que les deux tests exécutés ne confirment pas ; les axes
A5/A6/A13/A14 ne peuvent être estimés pour une mécanique dont l'existence même est infirmée pour
l'échantillon testé.

---

### `C-17` — Iframe / vitrine embarquable

| Axe | Valeur | Preuve |
|---|---|---|
| A1-A14 | **Le candidat repose sur une prémisse non confirmée.** La recherche dédiée (journal #44) et la lecture directe de la page de référence de la fiche v1 (`wp-dealer.com`, journal #29) ne retrouvent **aucune mention d'un iframe hébergé par AS24** ni d'un motif d'URL de ce type. Les deux sources qui documentent l'intégration WordPress d'AS24 décrivent exclusivement une synchronisation **par API** (import/export de fiches), jamais un widget embarquable. | Recherche stérile sur 2 angles indépendants — résultat négatif de recherche, pas preuve d'inexistence |

**Verdict** : `NON VIABLE — existence non établie`, dans les mêmes termes que `C-08` de
`probe-LOT-CD.md`. Aucune des trois sources qui documentent en détail l'écosystème d'intégration
AS24 pour les concessionnaires (`wp-dealer.com`, `carsyncpro.com` déjà cité par `candidates-v1.md`,
et la recherche ciblée de ce lot) ne mentionne d'iframe. C'est un résultat négatif de recherche : la
seule façon de trancher serait une session DevTools sur le portail concessionnaire AS24 lui-même
(hors périmètre E5/E1 de cet agent) — protocole déjà spécifié pour un autre candidat par
`probe-LOT-CD.md` (`C-66`) et transposable ici en `ACTIONS-COMMANDITAIRE`.

**Taux `[NON VÉRIFIÉ]`** : 14/14 (100 %) — **justification explicite** : le candidat entier dépend
d'un artefact (l'iframe et son URL) dont deux angles de recherche indépendants ne confirment pas
l'existence publique. Noter cette valeur à 100 % plutôt que de forcer des estimations sans fondement
sur les 14 axes est le choix le plus honnête au sens de R1.

---

## LOT-O candidats

### `C-87` — AUTO1 Group

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € pour l'indice de prix et le catalogue AutoHero ; le catalogue B2B `AUTO1.com` exige un compte acheteur professionnel (non créé, R2) | PROUVÉ (AutoHero, Index) / documenté (blocage B2B) |
| A2 Coût récurrent | Sans objet pour l'Index (gratuit, éditorial) ; non documenté pour un accès B2B | argumenté |
| A3 Couverture champs | AutoHero : marque, modèle, prix (par tranche), a priori kilométrage/année en fiche détail (non vérifié) ; Index : prix agrégé, carburant seulement | DOCUMENTÉ (AutoHero, superficiel) / `[NON VÉRIFIÉ]` (fiche détail) |
| A4 Couverture géo | Belgique confirmée pour AutoHero (domaine `nl-be`, Car-Pass, téléphone BE) ; Index paneuropéen sans ventilation pays | **PROUVÉ** (AutoHero) |
| A5-A6 | Non mesuré ; site consulté une seule fois, pas de test de débit (R3) | `[NON VÉRIFIÉ]` |
| A7 Stabilité technique | 3/5, argumenté — site de production grand public, changements probables mais non historicisés ici | argumenté |
| A8 Résistance anti-bot | Non testé (mandat documentaire strict, pas de sonde technique) | `[NON VÉRIFIÉ]` |
| A9 Effort d'intégration | Élevé si l'objectif est un miroir de marché (AutoHero n'est que le stock propre d'AUTO1, pas le marché) ; faible si l'objectif est seulement l'indice de tendance (donnée déjà agrégée, à copier périodiquement) | argumenté |
| A10 Coût de maintenance | Faible pour l'Index (publication mensuelle stable) | argumenté |
| A11 Exposition juridique | 2/5 pour l'Index et AutoHero (contenus édités et publiés volontairement par AUTO1 pour diffusion publique, pas une extraction contestée) ; indéterminé pour un accès B2B non instruit | argumenté |
| A12 Autonomie | Non — dépend de la continuité de publication d'AUTO1 | documenté |
| A13 Plafond de volumétrie | AutoHero : stock propre d'AUTO1, ordre de grandeur non chiffré ici ; Index : une valeur par mois, pas un volume d'annonces | `[NON VÉRIFIÉ]` |
| A14 Fraîcheur atteignable | Index mensuel ; AutoHero a priori proche du temps réel (site de vente actif) | DOCUMENTÉ (Index), argumenté (AutoHero) |

**Verdict** : `VIABLE SOUS CONDITION` pour un usage **d'ancrage de tendance** (l'Index) et
**complémentaire, non substitutif**, pour AutoHero (catalogue de revente propre, échantillon biaisé
vers le reconditionné). `NON VIABLE en l'état` pour un accès B2B au catalogue AUTO1.com complet, qui
exige un compte acheteur professionnel (R2 l'interdit).

**Taux `[NON VÉRIFIÉ]`** : 4/14 (29 %) — légèrement au-dessus du seuil. Justification : le candidat
recouvre trois objets de nature différente (Index, AutoHero, catalogue B2B fermé) et seul le premier
a été instruit en profondeur ; le temps de sonde disponible a été priorisé sur l'Index parce qu'il
répond directement à l'idée directrice du lot (l'ancrage transactionnel).

---

### `C-80` — OPENLANE Connect

| Axe | Valeur | Preuve |
|---|---|---|
| A1-A2 | Sans objet — accès fermé, aucun tarif public | argumenté |
| A3 Couverture champs | Sans objet — API confirmée entrante seule (dépôt de véhicules par le vendeur), pas un schéma de lecture exposé publiquement | **PROUVÉ** (page produit lue en détail, journal #33) |
| A4 Couverture géo | La page ne mentionne pas explicitement la Belgique dans son contenu (seuls les sélecteurs de langue `nl-BE`/`fr-BE` existent), mais la fiche `candidates-v1.md` situe déjà OPENLANE Europe comme actif dans plus de 50 pays avec la Belgique en marché de premier plan | DOCUMENTÉ (renvoi à la fiche v1, non revérifié pour respecter R3) |
| A5-A6 | Sans objet | — |
| A7 Stabilité technique | Sans objet, canal fermé | — |
| A8 Résistance anti-bot | **Testé directement** : `openlane.eu/en/auctions` répond **HTTP 403** à une requête anonyme (journal #34) — barrière active, nature exacte (géoblocage, anti-bot, mur de connexion) non diagnostiquée plus finement (hors mandat documentaire) | **PROUVÉ** (test exécuté et journalisé) |
| A9-A10 | Sans objet, accès fermé | — |
| A11 Exposition juridique | 2/5, argumenté — canal contractuel B2B, aucune extraction en cause si l'accès restait fermé | argumenté |
| A12 Autonomie | Non | documenté |
| A13-A14 | Sans objet | — |

**Verdict** : `NON VIABLE en l'état`. La question falsifiable prioritaire du mandat de lot
(« OPENLANE Connect est bidirectionnelle ou uniquement entrante ») est **tranchée : entrante
seule**, confirmée par la documentation produit elle-même, sans ambiguïté. Le second test
(catalogue d'enchères sans compte) a été **exécuté et journalisé** : échec HTTP 403. Le candidat
apporte, comme documenté par sa fiche v2, un point d'entrée nommé et une nature de donnée
(transaction réelle) — mais aucun des deux canaux testés n'y donne accès sans compte professionnel.

**Taux `[NON VÉRIFIÉ]`** : 0/14 (0 %) — tous les axes portent soit une preuve, soit un « sans objet »
argumenté par la fermeture confirmée du canal.

---

### `C-47` — Plateformes B2B / remarketing (AUTOproff, eCarsTrade, CarNext, Autobiz)

| Axe | Valeur | Preuve |
|---|---|---|
| A1-A2 | 0 € pour la lecture éditoriale (blog eCarsTrade) ; compte requis pour AUTOproff (confirmé, journal #36) | DOCUMENTÉ (blocage), PROUVÉ (blog libre) |
| A3 Couverture champs | Le blog eCarsTrade ne porte pas de fiche véhicule, seulement des indices de prix agrégés cités de tiers (AUTO1, Autovista Group) | DOCUMENTÉ |
| A4 Couverture géo | AUTOproff confirmé actif en Belgique (`autoproff.be` existe, journal #38) ; CarNext référencé comme vendeur sur un portail belge grand public (`moniteurautomobile.be`, journal #42, non vérifié en profondeur) ; Autobiz confirmé actif dans 22 marchés européens dont la Belgique, mais comme fournisseur d'API de valorisation, pas de catalogue | DOCUMENTÉ pour les 3 |
| A5-A6 | `[NON VÉRIFIÉ]` | — |
| A7 Stabilité technique | `[NON VÉRIFIÉ]` | — |
| A8 Résistance anti-bot | Non testé (mandat documentaire) | `[NON VÉRIFIÉ]` |
| A9 Effort d'intégration | Élevé pour AUTOproff (compte requis, R2 l'interdit) ; **piste inattendue et non instruite en profondeur** pour CarNext, dont le stock apparaîtrait sur un portail tiers grand public déjà public (`moniteurautomobile.be`) — si confirmé, ce serait un accès de facto sans négociation avec CarNext lui-même | argumenté (AUTOproff), `[NON VÉRIFIÉ]` (CarNext, piste ouverte) |
| A10 Coût de maintenance | `[NON VÉRIFIÉ]` | — |
| A11 Exposition juridique | 2/5 pour la lecture d'un portail tiers grand public déjà indexé (CarNext via Moniteur Automobile, si confirmé) — régime différent d'un accès direct à AUTOproff | argumenté |
| A12 Autonomie | Non pour les 4 | documenté |
| A13-A14 | `[NON VÉRIFIÉ]` | — |

**Verdict** : `VIABLE SOUS CONDITION` pour la seule piste CarNext-via-portail-tiers, qui n'a **pas pu
être confirmée dans le budget de ce lot** (la page ciblée a rendu l'accueil du site plutôt que la
fiche vendeur, journal #45 — limite de l'outil, pas un résultat négatif). `NON VIABLE en l'état` pour
AUTOproff (compte requis) et pour Autobiz comme source de catalogue (ce n'est pas sa fonction). Le
blog eCarsTrade n'est pas un canal de données, seulement un relais éditorial déjà couvert par
l'analyse de `C-87`.

**Taux `[NON VÉRIFIÉ]`** : 7/14 (50 %) — **dépasse largement le seuil de S3.** Justification
explicite : ce candidat regroupe 4 objets hétérogènes (marketplace fermée, blog, revendeur de
flotte, API de valorisation), et le budget de requêtes de ce lot double (L+O, plafond commun de 60)
a été prioritairement alloué aux trois trouvailles à plus fort rendement du document (le dépôt
SMG pour `C-19`, l'Index AUTO1 pour l'ancrage transactionnel, la procédure Stockway pour `C-86`).
La piste CarNext/Moniteur Automobile mérite une relance ciblée, signalée en
`ACTIONS-COMMANDITAIRE`.

---

### `C-20` — Propriétés du groupe AutoScout24 (AUTOproff, LeasingMarkt, Smyle, Trader Corp)

| Axe | Valeur | Preuve |
|---|---|---|
| A1-A2 | 0 € pour consulter les pages publiques ; aucune API commerciale publique trouvée à tarifer | DOCUMENTÉ |
| A3 Couverture champs | Sans objet — aucune API publique documentée pour AutoTrader.ca ou LeasingMarkt.de (journal #43) ; seuls des scrapers tiers non officiels (Apify) confirment l'existence d'un catalogue interrogeable de facto, sans schéma publié par le propriétaire | DOCUMENTÉ (absence d'API officielle) |
| A4 Couverture géo | AUTOproff confirmé Belgique (`.be`) ; LeasingMarkt et Trader Corp restent DE et Canada respectivement, sans extension BE documentée | DOCUMENTÉ |
| A5-A14 | Sans objet en l'absence d'API officielle sur les deux propriétés testées ; Smyle déjà documenté bloqué au `robots.txt` AS24 BE par `candidates-v1.md` (non revérifié ici, hors cible tierce du mandat E5) | argumenté / renvoi |
| A11 Exposition juridique | 3/5, argumenté — l'existence de scrapers tiers commerciaux pour AutoTrader.ca (Apify) suggère que l'absence d'API officielle n'empêche pas techniquement un accès, mais en dehors de toute autorisation du propriétaire | argumenté |

**Verdict** : `NON VIABLE en l'état`. La question falsifiable prioritaire du mandat (« au moins une
propriété du groupe expose une API de recherche publique documentée ») est **tranchée : fausse**
pour les deux propriétés testées (LeasingMarkt.de, AutoTrader.ca) — seuls des contournements non
officiels existent, hors mandat R2/E1. AUTOproff, déjà instruit sous `C-47`, reste fermé sans compte.

**Taux `[NON VÉRIFIÉ]`** : 2/14 (14 %) — sous le seuil, la plupart des axes étant tranchés par
« sans objet argumenté » plutôt que par une inconnue réelle.

---

## Questions falsifiables

| # | Question | Verdict | Niveau de preuve |
|---|---|---|---|
| L-1 | « Un prestataire BE documente publiquement la procédure d'ajout d'une destination de flux. » | **VRAIE, avec réserve** — Stockway documente le mécanisme et le contact ; aucun des 4 autres ne le fait ; l'éligibilité d'un profil analytique (KYCAR) n'est **pas** confirmée par cette documentation | DOCUMENTÉ, condition d'application NON TRANCHÉE |
| L-2 | « Les dix prestataires de `C-85` sont nommables, et au moins un est actif en Belgique. » | **FAUSSE pour la première partie** — trois angles de recherche indépendants ne nomment aucun des dix ; la seconde partie est **NON TRANCHÉE** car la couverture géographique documentée du programme est allemande uniquement | DOCUMENTÉ (silence des sources), échec de 3 angles de recherche |
| L-3 | « La spec de feed AS24 est publique et fournit le dictionnaire de champs complet. » | **VRAIE**, avec une réserve de portée géographique (source Suisse/SMG plutôt que BE/DE nommément) — **95 champs comptés**, très supérieur aux 40 cibles de KYCAR | **PROUVÉ** (extraction directe de 3 fichiers OpenAPI publics) |
| L-4 | « L'iframe vitrine de `C-17` est servie depuis un hôte AS24 sans `robots.txt` opposable. » | **NON TRANCHÉE, tendance négative** — deux angles de recherche indépendants ne retrouvent aucune trace publique de cet iframe ; toute la documentation d'intégration trouvée décrit une mécanique API, jamais un widget | Recherche stérile sur 2 angles — résultat négatif, pas preuve contraire |
| L-5 | « Les éditeurs de `C-18` acceptent de revendre un accès agrégé. » | **PROBABLEMENT FAUSSE pour l'échantillon testé** — SyncSpider documente un flux sortant (dealer → AS24), pas un canal de lecture tiers ; WPdealer documente une synchronisation par compte, pas un accès agrégé | DOCUMENTÉ (lecture directe de 2 sources sur 4 nommées par la fiche) |
| O-1 | « OPENLANE Connect est bidirectionnelle, ou uniquement entrante. » | **TRANCHÉE : entrante seule.** Confirmé textuellement par la documentation produit | **PROUVÉ** |
| O-2 | « Le catalogue B2B (AUTO1, OPENLANE) est consultable sans compte acheteur professionnel. » | **FAUSSE pour les deux testés** — AUTO1.com exige un compte (page de connexion) ; OPENLANE renvoie HTTP 403 sur sa page d'enchères | **PROUVÉ** (2 tests exécutés) |
| O-3 | « Une référence de prix de transaction belge est obtenable gratuitement. » | **PARTIELLEMENT VRAIE** — un indice de tendance paneuropéen robuste existe (AUTO1 Index, ~6M transactions réelles) mais sans ventilation BE ni valeur absolue ; un signal qualitatif belge existe (Autovista Group cité par un tiers) mais non chiffré et de troisième main | DOCUMENTÉ, incomplet sur les deux volets |
| O-4 | « Au moins une propriété du groupe AS24 (`C-20`) expose une API publique documentée. » | **FAUSSE** pour LeasingMarkt.de et AutoTrader.ca ; AUTOproff reste fermé sans compte | DOCUMENTÉ (absence confirmée par recherche ciblée) |

---

## ACTIONS-COMMANDITAIRE

| Candidat / objet | Action requise du commanditaire | Ce qu'elle débloque | Urgence |
|---|---|---|---|
| `C-86` | Contacter Stockway (page « Devenir partenaire ») et Autralis directement, en présentant explicitement le profil de KYCAR (outil analytique interne, pas un portail d'annonces concurrent) : « acceptez-vous d'ajouter une destination analytique, avec l'accord explicite d'un garage client, sans agrément d'AutoScout24 ? » | Seule façon de trancher L-1 pour un profil hors du gabarit « site partenaire à trafic acheteur » documenté publiquement | **Haute** — c'est le candidat au risque juridique le plus faible du registre entier |
| `C-85` | Obtenir l'article AIM Group du 24/06/2025 (payant, `HTTP 403` en accès anonyme) via un abonnement professionnel, ou poser directement la question des dix noms à un contact commercial AS24 si un canal s'ouvre via `LOT-K` | Résout L-2 ; sans ces noms, `C-85` reste un canal contractuel connu mais inactionnable | Moyenne |
| `C-19` | Si un canal partenaire (`C-01`/`C-48`/`LOT-K`) s'ouvre, demander explicitement si le schéma exposé pour un concessionnaire belge ou allemand est identique à celui du dépôt public `smg-automotive/autoscout24-api-specs` (marché suisse) | Confirme ou infirme l'extrapolation de portée du plafond de richesse à 95 champs | Moyenne |
| `C-47` | Relancer la vérification de la fiche vendeur CarNext.com sur `moniteurautomobile.be/vendeur-id--9417--carnext-com-aartselaar/` (l'outil de cette session a rendu l'accueil du site au lieu de la fiche ciblée) — une consultation manuelle en 2 minutes tranche la piste | Confirme ou infirme un accès de facto au stock CarNext BE via un portail tiers déjà public, sans négociation avec CarNext | Basse-moyenne, coût de vérification très faible |
| `C-17` | Exécuter le protocole DevTools déjà spécifié par `probe-LOT-CD.md` (`C-66`) sur le portail concessionnaire AS24, en cherchant spécifiquement un appel vers un hôte de type `showcase`/`widget`/`iframe.autoscout24.*` lors de la configuration d'une vitrine concessionnaire | Seul moyen, dans les règles du plan, de confirmer ou de clore définitivement l'existence de l'iframe | Basse — le candidat est déjà `NON VIABLE — existence non établie`, cette action ne fait que clarifier une classification négative |
| `C-87` | Si un accès B2B AUTO1.com ou OPENLANE devient souhaitable, ouvrir un compte acheteur professionnel (R2/E1 l'interdisent à cet agent) et documenter les CGU d'usage des données obtenues | Seule voie d'accès au catalogue B2B complet, hors périmètre de cette phase | Basse |

---

## Conformité

- **Requêtes vers `autoscout24.be` ou `autoscout24.com` : 0.**
- **Requêtes vers tout autre domaine `autoscout24.*` (y compris `.ch`, `.de` vus en titre de
  résultat de recherche) : 0.** Deux résultats de `WebSearch` ont fait apparaître des titres
  `autoscout24.ch` (aide DMS) ; aucune requête n'a été émise vers ce domaine, par cohérence avec la
  restriction du mandat de ce lot (« Cibles = plateformes tierces »), plus stricte que le E5 minimal
  du registre gelé.
- **Aucun compte créé, aucun credential saisi (R2/E1).** Le seul blocage rencontré
  (`openlane.eu/en/auctions`, HTTP 403) est un refus serveur sur une requête anonyme non modifiée.
- **R3 — plafond 60 requêtes tierces : 45/60 utilisées**, toutes unitaires, aucune extraction de
  masse. Le journal ci-dessus est rejouable ligne à ligne par l'auditeur de la phase 1.5.
- **R5 — prix ramenés à l'unité commune** : appliqué là où un tarif existe (aucun cas dans ce
  document — tous les candidats testés sont soit gratuits/documentaires, soit fermés sans tarif
  public). Noté explicitement `Sans objet` plutôt que simulé, conformément à R1.
- **S3 — taux de `[NON VÉRIFIÉ]` par candidat** : dépassé pour 4 candidats sur 10 (`C-85` 57 %,
  `C-18` 36 %, `C-17` 100 %, `C-47` 50 %), chacun avec une justification explicite dans sa section
  de verdict — conformément à la clause d'exception de S3.
- **R6** : ce document ne conclut sur aucun candidat instruit par un autre lot ; les renvois vers
  `probe-LOT-A.md`, `probe-LOT-B.md`, `probe-LOT-CD.md`, `probe-LOT-J.md` et `FINDING-allowed-surface.md`
  sont des citations de leurs preuves déjà journalisées ailleurs, jamais une ré-exécution.

---

*Fin du document. Compteur final de requêtes tierces : **45 / 60**. Aucune requête vers un domaine
`autoscout24.*` n'a été émise par cet agent, sur aucun TLD.*
