# candidates-final.md — Registre GELÉ des voies d'acquisition (phase 1.3, agent `gap-review-2`)

**Nature du document** : registre **consolidé et définitif**. Il fusionne `candidates-v1.md`
(`C-01`…`C-66`), `candidates-v2.md` (`C-67`…`C-84`) et les ajouts de cette phase
(`C-85`…`C-92`, marqués `[AJOUT G2]`). Il **n'écrase ni v1 ni v2** : les fiches détaillées restent
dans ces deux fichiers, qui demeurent la source des mécaniques, des points d'entrée et des sources.
Ce document porte ce qu'eux ne portent pas : le **statut** de chaque candidat, le **motif** de chaque
écartement, et le **découpage en lots d'investigation** qui pilote la phase 1.4.

**Chiffres du gel** : **92 candidats**, `C-01` à `C-92`, **18 familles**.
**85 `RETENU_POUR_INVESTIGATION`**, **7 `ÉCARTÉ`**, répartis en **17 lots** (`LOT-A` … `LOT-Q`).

**Respect des contraintes de mission** :
- Aucun compte créé, aucun credential saisi (R2). Ce qui l'exige est consigné en `ACTIONS-COMMANDITAIRE`.
- **Zéro requête vers `autoscout24.be` et `autoscout24.com`**, y compris sur les 17 préfixes autorisés.
- 12 requêtes vers des tiers, toutes unitaires, aucune extraction de masse (quota 12/12 — journal en fin de document).
  Une seule visait un domaine AutoScout24 : `www.autoscout24.de/unternehmen/haendler-agb/`, page de
  conditions générales, hors des deux domaines interdits, et explicitement demandée par le mandat
  (« Cherche les CGU professionnelles […] sur tous les TLD »).

---

## Temps 1 — Ce que les trois angles légués ont donné

| Angle légué | Résultat | Conséquence |
|---|---|---|
| **1. Clause de transmission de données à des tiers des CGU pro (P2B art. 9)** | **PARTIELLEMENT FÉCOND — mais l'hypothèse centrale est INFIRMÉE.** Les `Händler-AGB` allemandes sont publiques et ont été lues. Le § 19.3 encadre bien la transmission de données à des tiers, mais en termes **génériques** : il **ne nomme aucun tiers**. L'espoir de v2 — « la clause nomme les revendeurs de données AS24 » — est donc infirmé pour le texte allemand. En revanche, deux clauses inattendues et décisives ont été relevées : le § 17.2 nomme une **« technische Schnittstelle »** de transmission de données au concessionnaire, et le § 3.3 **interdit contractuellement, verbatim, « die automatisierte Abfrage der Datenbank mittels Software »**. | Corrections `G2-K7` et `G2-K8`. `C-81` reste retenu mais son objet se déplace : ce n'est plus l'annuaire des revendeurs, c'est la **preuve écrite de l'interdiction d'extraction automatisée** (axe A11, hypothèse par défaut de `00-CONTEXT.md` désormais confirmée) et le **nom d'un canal d'export concessionnaire** (renforce `C-05` et `C-19`). Le texte **belge** reste à lire, et il est atteignable **licitement** : les préfixes `/fr/entreprise/` et `/nl/onderneming/` sont sous directive `Allow` — voir `LOT-K`. |
| **2. Organisation GitHub `autoscout24` et paquets npm/Maven publiés** | **STÉRILE, mais désormais CLOS PAR MESURE et non par absence de recherche.** Inventaire direct par API : l'organisation `AutoScout24` (id 60146476, vérifiée, créée le 21/01/2020) compte **4 dépôts publics et 0 gist** — trois exercices de recrutement (`as24-hiring-ai-node-js-car-listing`, `lm-hiring-ai-node-js-php-listing`, `as24-hiring-ai-java-spring-petclinic`) et `girls-day-2025`. Côté npm : le scope `@autoscout24` existe (`custom-events`, `toguru-client`) et AS24 publie aussi des paquets non scopés (`showcar-ui`, `as24-autocomplete`, `showcar-carousel`, `showcar-storage`, `carbon-core`). **Aucune constante d'endpoint, aucun hachage de requête persistée** au niveau des métadonnées d'index. | Correction `G2-K9`. Le **verrou n° 6 de v1** (hôte de l'API GraphQL mobile) **n'est pas soluble par cette voie**. Il ne reste, en public, que l'analyse **statique d'un APK** — d'où `C-16` et `C-88` réunis dans `LOT-B`. Le contenu des tarballs npm reste à grepper : c'est le seul résidu, et il est cadré par `C-88`. |
| **3. Offres d'emploi et interventions publiques d'Indicata / AutoUncle / theparking.eu / Carwow** | **PARTIELLEMENT FÉCOND, par une source inattendue.** Aucune offre d'emploi ni intervention en conférence n'a été atteinte : les requêtes mêlant « data engineer » et « scraping » sont intégralement captées par les fournisseurs de scraping eux-mêmes (ScraperAPI, Apify, Scrapfly, Firecrawl) — **vocabulaire à ne pas reprendre**. Mais la question de fond reçoit un premier élément documentaire : Indicata est décrite comme collectant sa donnée « *from OEM websites, classifieds, used car dealer and retailer websites* » — donc une **collecte web**, sans mention d'accord de portail. Et un angle voisin a livré la trouvaille majeure de la phase : AutoScout24 **alimente contractuellement une dizaine de prestataires de données** (→ `C-85`). | Correction `G2-K10`, nouveau candidat `C-85`. La question « accord ou crawl ? » n'est pas tranchée, mais elle est **déplacée** : il existe au moins un canal contractuel de sortie de données AS24 vers des tiers, et il est nommé — ce que ni la clause P2B ni les offres d'emploi n'avaient donné. Instruction transférée à `LOT-P` (Indicata/AutoUncle) et `LOT-L` (`C-85`). |

## Temps 1 — Axes propres de cette revue

Trois raisonnements imposés par le mandat, conduits sans reprendre le vocabulaire déclaré stérile
en v2 (A4 « stockbeheer/voorraadbeheer », A7 DSA art. 40, A13 RSS, A15 Postman, A16 llms.txt/MCP) :

- **Chaîne de valeur** — « qui possède déjà ces données et les revend ? » A produit `C-85`
  (les prestataires de données alimentés contractuellement par AS24) et `C-87` (AUTO1, l'acteur
  dominant du B2B européen, absent de v1 comme de v2).
- **Analogie** — « comment les comparateurs existants procèdent-ils ? » A produit `C-86`, le
  renversement du sens du flux : heycar et Carwow ne crawlent pas, ils **se font alimenter** par les
  concessionnaires. v1 et v2 n'envisagent la syndication que comme une porte d'entrée **chez AS24** ;
  jamais comme une porte d'entrée **chez nous**. C'est l'ajout le plus structurant de cette phase,
  parce qu'il est le seul candidat du registre dont l'exposition au droit *sui generis* d'AS24 et à
  Akamai est **nulle par construction**, sans être pour autant un simple substitut agrégé.
- **Contournement** — « quelles données équivalentes existent ailleurs ? » A produit `C-89` (espaces
  de données européens de la mobilité, famille 18 nouvelle), `C-90` (contrôle technique belge,
  troisième dénominateur du parc) et `C-92` (les API REST des socles logiciels des sites de garages,
  mécanique distincte du JSON-LD de `C-46`).

---

# Candidats ajoutés — `C-85` à `C-92`

Format de fiche de la phase 1.1. Les niveaux de preuve sont explicites : ce qui a été exécuté est
daté, ce qui ne l'a pas été porte `[NON VÉRIFIÉ]`.

## Famille 4 — Flux partenaires et syndication *(ajouts)*

### C-85 — Programme d'intégration d'AutoScout24 dans les systèmes des « data service providers » `[AJOUT G2]`
- **Famille** : 4 — Flux partenaires et syndication
- **Mécanique** : en juin 2025, la presse spécialisée du secteur rapporte qu'AutoScout24 approfondit sa collaboration avec les prestataires de données : **les dix plus grands *data service providers* ont intégré les statistiques véhicule d'AS24 dans leurs propres systèmes**, six d'entre eux prenant en charge les fonctions `HändlerIQ` (recommandations de prix et de qualité d'annonce pilotées par l'IA), et le déploiement porte sur des **données de performance temps réel** — vues d'annonce, leads, jours de présence du véhicule. Ce canal est corroboré de l'intérieur par le § 17.2 des `Händler-AGB` : « *Die Übermittlung einzelner Daten kann auch über eine technische Schnittstelle erfolgen* », l'accès aux **données agrégées** y étant conditionné à la souscription de paquets de services. Conséquence de chaîne de valeur : il existe une dizaine de tiers **contractuellement alimentés en données AutoScout24**, dont les produits sont accessibles commercialement sans passer par AS24 — et dont les conditions se négocient avec eux, pas avec AS24.
- **Point d'entrée connu** : `https://aimgroup.com/2025/06/24/autoscout24-deepens-collaboration-with-data-service-providers/` (**HTTP 403 sur fetch non authentifié le 2026-09-06** — contenu connu par le résumé indexé seulement) ; `https://www.autoscout24.de/unternehmen/haendler-agb/` § 17.2 ; presse professionnelle allemande à instruire (`autohaus.de`, `kfz-betrieb.vogel.de`)
- **Questions falsifiables à tester en 1.4** :
  - « Les dix prestataires sont nommables à partir de sources publiques. » (question la plus rentable du candidat : elle produit une liste d'interlocuteurs)
  - « La donnée transmise est au niveau **annonce**, ou seulement statistique agrégée sur les annonces du concessionnaire client. » (dimensionnante : le second cas ne donne accès qu'au stock du garage)
  - « Le programme couvre la Belgique, ou seulement l'Allemagne. »
  - « Au moins un de ces prestataires revend un accès à un tiers qui n'est pas concessionnaire AS24. »
  - « L'intégration est bidirectionnelle — le prestataire lit aussi le marché, pas seulement les métriques de son client. »
- **Sources** : résumé indexé de l'article AIM Group du 24/06/2025 ; `https://www.autoscout24.de/unternehmen/haendler-agb/` (§ 17.2 et § 19.3, lus le 2026-09-06)

### C-86 — Devenir soi-même destination de flux : réception d'un feed concessionnaire entrant `[AJOUT G2]`
- **Famille** : 4 — Flux partenaires et syndication
- **Mécanique** : renverser le sens du flux. Tout l'inventaire de v1 et v2 suppose que la donnée doit **sortir** d'AutoScout24. Or les portails récents ne collectent pas la donnée, ils **se font alimenter** : un concessionnaire pousse son stock vers les destinations qu'il choisit, depuis son DMS ou son prestataire de multidiffusion (`C-18`, `C-84`), au format XML/CSV normalisé, et ajouter une destination est une opération de configuration. C'est ainsi que heycar et Carwow ont constitué un inventaire sans crawler les portails installés. Pour KYCAR : se déclarer destination auprès d'un ou deux prestataires belges et recevoir le stock **avec l'accord du garage**. Profil radicalement différent du reste du registre — la donnée vient de son producteur, l'anti-bot est hors sujet (axe A8 « non concerné »), le droit *sui generis* d'AS24 est hors sujet (le producteur du contenu est le garage), et la fraîcheur est celle du DMS. **Limites structurelles** : couverture bornée aux garages consentants, aucun particulier, et un effort **commercial** là où les autres candidats demandent un effort technique.
- **Point d'entrée connu** : `https://www.autralis.com/en/modular-applications/sales/` ; `https://stockway.pro/` ; `https://www.cpsautosoft.be/` ; `https://www.marktplaatszakelijk.nl/automotive/alle-mogelijkheden/vms/` ; modèles de référence à documenter : heycar, Carwow, AutoUncle (2 600 sources)
- **Questions falsifiables à tester en 1.4** :
  - « Au moins un prestataire BE accepte techniquement l'ajout d'une destination tierce, sans agrément d'AutoScout24. » (question déterminante)
  - « Le format de feed entrant couvre au moins 20 des 40 champs du dictionnaire cible. »
  - « Il existe un format de feed de fait dans la filière (spec AS24 de `C-19`, ADF, ou format prestataire) réutilisable comme contrat d'entrée de `DataProvider`. »
  - « Le nombre de garages nécessaires pour approcher la représentativité du stock professionnel belge est atteignable (référence : ~115 000 annonces annoncées par AS24 BE). »
  - « Le contrat prestataire–garage n'interdit pas au garage de désigner une destination analytique. »
- **Sources** : `candidates-v2.md` `C-84` (prestataires nommés) ; `candidates-v1.md` `C-18`, `C-19`

## Famille 2 — Endpoints internes / reconnaissance *(ajout)*

### C-88 — Dépôts publics et paquets publiés par AutoScout24 : organisation GitHub et scope npm `[AJOUT G2]`
- **Famille** : 2 — Endpoints internes / reconnaissance
- **Mécanique** : AutoScout24 publie du code sous son propre nom, dans deux registres interrogeables sans compte. Inventaire **exécuté** le 2026-09-06 — organisation GitHub `AutoScout24` vérifiée, id 60146476, créée le 21/01/2020, **4 dépôts publics, 0 gist** : `as24-hiring-ai-node-js-car-listing`, `lm-hiring-ai-node-js-php-listing` (LeasingMarkt), `as24-hiring-ai-java-spring-petclinic`, `girls-day-2025`. npm : `@autoscout24/custom-events` (« *Typings for custom events across as24 pages* »), `@autoscout24/toguru-client`, et les paquets non scopés publiés par AS24 : `showcar-ui` (« *the pattern library that is used to build the frontend of AutoScout24* »), `as24-autocomplete`, `showcar-carousel`, `showcar-storage`, `carbon-core`. **Aucune constante d'endpoint ni hachage de requête persistée au niveau des métadonnées d'index** — le contenu des tarballs, lui, n'a pas été lu. Ce qui reste : télécharger les archives (`registry.npmjs.org/<pkg>/-/<pkg>-<v>.tgz`, sans compte) et y chercher `https://`, `graphql`, `sha256Hash`, `persistedQuery`, ainsi que les noms d'événements du contrat de tracking, qui décrivent le modèle de données du front.
- **Point d'entrée connu** : `https://api.github.com/orgs/AutoScout24/repos` (200) ; `https://registry.npmjs.org/-/v1/search?text=autoscout24` (200) ; tarballs npm ; `https://github.com/AutoScout24/as24-hiring-ai-node-js-car-listing`
- **Questions falsifiables à tester en 1.4** :
  - « Un tarball `@autoscout24/*` ou `showcar-*` contient au moins une URL d'API AutoScout24 en clair. »
  - « `custom-events` documente le contrat d'événements du front, donc les entités et les champs manipulés côté client. »
  - « Le dépôt d'exercice `as24-hiring-ai-node-js-car-listing` contient un modèle de données d'annonce, ou un jeu d'annonces d'exemple. » (un exercice de recrutement porte souvent une extraction réelle anonymisée)
  - « Il existe un artefact Maven `com.autoscout24` publié sur Maven Central. » (AS24 a historiquement publié des bibliothèques Scala)
  - « Aucun de ces artefacts ne contient de hachage de requête persistée. » (probablement vraie — auquel cas le verrou n° 6 se rabat entièrement sur `C-16`)
- **Sources** : `https://api.github.com/orgs/AutoScout24` (200, relevé le 2026-09-06) ; `https://registry.npmjs.org/-/v1/search?text=autoscout24` (200, 11 résultats)

## Famille 9 — Sources alternatives substituables *(ajouts)*

### C-87 — AUTO1 Group : marketplace B2B AUTO1.com, wirkaufendeinauto / AutoHero, prix de transaction `[AJOUT G2]`
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : AUTO1 Group est le premier marché B2B de véhicules d'occasion en Europe — achat direct au particulier sous les marques `wirkaufendeinauto` / `wijkopenautos` / `onzeautos` (Belgique incluse), revente à des dizaines de milliers d'acheteurs professionnels sur `AUTO1.com`, plus la marque de vente en ligne AutoHero. Même apport singulier que `C-80` (OPENLANE) — le **prix de transaction** contre le prix demandé — mais chez l'acteur dominant du segment et avec une présence belge établie. v1 nomme AUTOproff, eCarsTrade, CarNext et Autobiz (`C-47`) et **ignore AUTO1** ; v2 ajoute OPENLANE et l'ignore aussi. Le groupe, coté, publie par ailleurs des indices de prix et des rapports trimestriels, qui constituent des références de vérité gratuites au même titre que `C-50`.
- **Point d'entrée connu** : `https://www.auto1.com/` ; `https://www.auto1.com/en/investor-relations` (rapports, indices) ; `https://www.wijkopenautos.be/` ; `https://autohero.com/` ; à instruire : existence d'une documentation d'intégration pour acheteurs partenaires
- **Questions falsifiables à tester en 1.4** :
  - « Le catalogue AUTO1.com est consultable sans compte acheteur professionnel. » (probablement faux — c'est le point à trancher)
  - « Une documentation d'API ou d'intégration partenaire est publique. »
  - « Les rapports publics d'AUTO1 donnent des prix moyens par segment exploitables comme ancrage transactionnel, et à quelle maille. »
  - « Le volume belge exposé est significatif au regard de H5 (10⁴–10⁶ annonces). »
  - « Les prix de vente réels sont exposés, ou seulement des prix d'achat indicatifs au particulier. »
- **Sources** : `[NON VÉRIFIÉ]` — aucune requête émise vers ce domaine dans cette phase (quota de 12 requêtes épuisé). Candidat inscrit sur la base d'une lacune structurelle et nommée de `C-47`, à instruire en 1.4.

### C-92 — API REST publiques des socles logiciels des sites de concessionnaires `[AJOUT G2]`
- **Famille** : 9 — Sources alternatives substituables (découverte côté concessionnaire)
- **Mécanique** : mécanique distincte de `C-46` (balisage `schema.org/Car`), de `C-74` (feeds publicitaires) et de `C-76` (portails constructeurs) : on cible le **socle logiciel** du site du garage, pas son balisage. Une part notable des sites de garages BE/NL est bâtie sur WordPress avec un plugin automobile (CarSyncPro, WPdealer, Automotive Feed Import — tous nommés dans `C-18` comme intégrateurs AS24) ou sur un CMS de prestataire (Autralis, DealerOptic, CPS Autosoft). Ces socles exposent couramment, sans authentification, une **API REST publique** — `/wp-json/wp/v2/<type véhicule>`, `/wp-json/<plugin>/v1/…` — ou un endpoint de recherche AJAX qui rend le stock en JSON structuré. Le gain sur `C-46` est double : le JSON-LD n'expose que ce que le SEO exige, tandis que l'API du socle expose le **modèle interne** (champs, taxonomies, pagination), et elle n'a **aucun plafond de pagination** comparable à celui d'AS24. Et l'ironie utile : ces plugins **importent leur stock depuis AS24**, donc leur sortie est un miroir du contenu AS24 servi par un tiers qui n'est pas lié par le `robots.txt` d'AS24.
- **Point d'entrée connu** : `https://carsyncpro.com/blog/autoscout24-plugin-for-wordpress-for-car-dealers/` ; `https://syncspider.com/integrations/autoscout24-and-external-api/` ; annuaires de garages BE (Traxio, Febiac) pour constituer un échantillon ; motifs à sonder : `/wp-json/`, `/wp-json/wp/v2/types`, `/feed/`, `/vehicles.xml`
- **Questions falsifiables à tester en 1.4** :
  - « Sur un échantillon de 20 sites de garages belges, au moins 5 répondent 200 sur `/wp-json/` et exposent un type de contenu véhicule. »
  - « Les champs exposés couvrent prix, année, kilométrage, code postal — le minimum vital de KYCAR. »
  - « Le stock ainsi lisible recoupe les annonces AS24 du même garage (donc substituable) et non un stock disjoint. »
  - « Le `robots.txt` du site du garage n'interdit pas cet accès, et aucune CGU tierce ne s'y oppose. » (l'exposition juridique devient celle du garage, pas celle d'AS24 : à qualifier en A11)
  - « Le socle expose la source d'import (AS24), ce qui permettrait de dater la fraîcheur du miroir. »
- **Sources** : `https://carsyncpro.com/blog/autoscout24-plugin-for-wordpress-for-car-dealers/` (résultat indexé) ; `https://syncspider.com/integrations/autoscout24-and-external-api/` (résultat indexé) ; `candidates-v1.md` `C-18`

### C-91 — Intégrations low-code publiées au-dessus des scrapers AutoScout24 (n8n, Make, Zapier) `[AJOUT G2]`
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : `n8n-nodes-autoscout24-cars-scraper` v0.1.0, publié le 25/06/2026, est un nœud communautaire n8n dont la page d'accueil déclarée est `https://apify.com/bovi/autoscout24-cars-scraper` — donc une **façade d'orchestration sans code au-dessus d'un acteur Apify**, annoncée sur DE/FR/IT/NL/BE. Deux apports : la preuve que le canal Apify est déjà emballé pour l'automatisation d'entreprise, et la découverte d'acteurs Apify absents de la liste de `C-22` (`bovi`, `rigelbytes`, `3x1t`, `hello.datawizards`).
- **Statut** : **ÉCARTÉ** — voir la section des écartements. Les acteurs Apify découverts sont reversés dans `C-22` (correction `G2-K12`).
- **Sources** : `https://registry.npmjs.org/n8n-nodes-autoscout24-cars-scraper` (200, relevé le 2026-09-06)

## Famille 16 — Données publiques officielles du véhicule *(ajout)*

### C-90 — GOCA et le contrôle technique belge : statistiques d'inspection comme population de référence `[AJOUT G2]`
- **Famille** : 16 — Données publiques officielles du véhicule
- **Mécanique** : en Belgique, tout véhicule d'occasion doit passer un contrôle technique **avant** sa revente. Les organismes agréés (Autosécurité, AIBV, CTA, SBAT, Bureau Veritas…), fédérés par GOCA Vlaanderen et GOCA Wallonie-Bruxelles, réalisent plusieurs millions d'inspections par an et publient des **statistiques annuelles** : nombre d'inspections par type, âge du parc contrôlé, kilométrage relevé, taux de refus, ventilation régionale. Troisième dénominateur indépendant du marché belge, à côté de `C-77` (immatriculations DIV/Statbel) et de `C-79` (Car-Pass) — et le seul qui soit spécifiquement adossé à l'**acte de revente**. Sert exactement le point ouvert P2 de `FINDING-allowed-surface.md` : mesurer le biais d'un échantillon d'annonces contre une population connue.
- **Point d'entrée connu** : `https://www.goca.be/` ; `https://www.gocavlaanderen.be/` ; `https://www.autosecurite.be/` ; rapports annuels et communiqués des fédérations
- **Questions falsifiables à tester en 1.4** :
  - « GOCA publie des **distributions** (par âge, par kilométrage, par région) et pas seulement des totaux nationaux. »
  - « Les publications sont en format machine (CSV/XLSX) et non en PDF de communiqué. »
  - « Le volume d'inspections « en vue de la vente » est isolable, ce qui en ferait un dénominateur du flux d'occasion comparable au nombre de Car-Pass délivrés (855 169 en 2025). »
  - « Les données recoupent Car-Pass sans le dupliquer (Car-Pass = documents délivrés, GOCA = inspections réalisées). »
- **Sources** : `[NON VÉRIFIÉ]` — aucune requête émise dans cette phase. Candidat inscrit par raisonnement de contournement, à instruire dans `LOT-Q`.

## Famille 18 — Espaces de données réglementés et fédérés *(nouvelle famille)*

### C-89 — Espaces de données européens de la mobilité : Mobility Data Space, Catena-X, CEMDS `[AJOUT G2]`
- **Famille** : 18 — Espaces de données réglementés et fédérés (nouvelle)
- **Mécanique** : l'Union européenne a financé et mis en production des **places de marché de données fédérées**, où un fournisseur publie un jeu dans un catalogue et un consommateur y souscrit par contrat machine, sous un régime de souveraineté des données (architecture IDS / Gaia-X) : le **Mobility Data Space** allemand (opéré par DRM Datenraum Mobilität), **Catena-X** pour la chaîne de valeur automobile, et le **Common European Mobility Data Space** annoncé par la Commission. Le catalogue lui-même est en général consultable avant adhésion. Pendant institutionnel de `C-41` (marketplaces privées de données) et de `C-75` (fournisseurs commerciaux), avec un régime juridique et tarifaire entièrement différent : contrats-types, non-exclusivité, gratuité fréquente pour la recherche et les PME. Famille absente de v1 comme de v2, et **non couverte par l'angle A7 de v2**, qui portait sur le DSA et non sur les espaces de données.
- **Point d'entrée connu** : `https://mobility-dataspace.eu/` ; `https://catalog.mobility-dataspace.eu/` ; `https://catena-x.net/` ; `https://transport.ec.europa.eu/` (CEMDS)
- **Questions falsifiables à tester en 1.4** :
  - « Le catalogue du Mobility Data Space contient au moins un jeu de données de **prix ou d'annonces** de véhicules d'occasion. » (probablement faux — les jeux publiés portent surtout sur le trafic, le stationnement, les flottes)
  - « Le catalogue est consultable sans adhésion ni compte. »
  - « Un portail d'annonces ou un fournisseur de données automobiles (Autovista, JATO, RDC) y publie un jeu. »
  - « L'adhésion est ouverte à une entité privée non industrielle, et à quel coût. »
  - « Catena-X ne porte que de la donnée de chaîne d'approvisionnement et aucune donnée de marché de l'occasion. » (probablement vraie — à écrire noir sur blanc pour clore l'angle définitivement)
- **Sources** : `[NON VÉRIFIÉ]` — aucune requête émise dans cette phase. Candidat inscrit par raisonnement de contournement, à instruire dans `LOT-P`.

---

# Le registre gelé — 92 candidats

Une ligne par candidat, identifiants stables depuis v1, sans doublon. `RETENU` vaut
`RETENU_POUR_INVESTIGATION`. La colonne **Mandat / motif** porte, pour un retenu, la restriction
éventuelle de son instruction, et pour un écarté, le **motif en une phrase**.

## Famille 1 — API officielles AutoScout24

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-01 | SEARCH API officielle (GraphQL commercial) | RETENU | LOT-K | Seul canal officiel prétendant exposer de la **lecture** d'inventaire : à qualifier en prix et en périmètre. |
| C-02 | Listing Creation API (`listing-creation.api.autoscout24.com`) | RETENU | LOT-A | **Partiellement acquis et prouvé** (`AS24-REFERENCE-API.md`) : `/makes`, `/references`, spec OpenAPI 122 schémas sans authentification. Mandat : borner ce que l'hôte expose au-delà du référentiel. |
| C-03 | Listing Distribution API (`smg-automotive/autoscout24-api-specs`) | RETENU | LOT-B | Lire `openapi-listing-distribution.yaml` : un contrat de **distribution** d'annonces existe, son périmètre est inconnu. |
| C-04 | Portail développeurs AutoScout24.ch / SMG | RETENU | LOT-B | Mandat **documentaire** : le backend `.ch` est hors périmètre H1 comme source de données, mais c'est la seule documentation d'API du groupe lisible publiquement. |
| C-05 | API concessionnaire de statistiques / `HändlerIQ` | RETENU | LOT-K | Renforcé par le § 17.2 des `Händler-AGB` (données agrégées sur paquets souscrits) et par `C-85`. |

## Famille 2 — Endpoints internes du front web

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-06 | `__NEXT_DATA__` des pages de recherche `/lst` | RETENU | LOT-C | **Aucune sonde autorisée** (`Disallow: /lst?` pour tous les agents) : instruction documentaire par les implémentations tierces. |
| C-07 | `__NEXT_DATA__` des pages de détail | RETENU | LOT-C | Idem : documentaire seulement, chemin d'offre non couvert par une directive `Allow`. |
| C-08 | Routes `/_next/data/{buildId}/….json` | RETENU | LOT-C | Idem. Le `buildId` et la forme de la route sont documentables sans requête. |
| C-09 | GraphQL interne `/listing-search-api/graphql` | RETENU | LOT-D | `Disallow` explicite pour tous les agents : documentaire seulement. Le verrou technique majeur si un jour autorisé. |
| C-10 | GraphQL interne `/ocs/api/graphql` | RETENU | LOT-D | Idem. Décoder « OCS » et son schéma par sources tierces. |
| C-11 | Fragments SSR `/classified-list/react-listelements` | RETENU | LOT-D | Idem. |
| C-12 | Oracle de comptage `/search-subscriptions/api/new-results-count` | RETENU | LOT-D | Idem. Mécanique de reconstruction de distributions par dichotomie à spécifier même sans sonde — elle sert aussi sur la surface autorisée. |
| C-13 | Vitrine concessionnaire `/as24-search-funnel/api/vip-showroom`, `/api/dealer-detail/…` | RETENU | LOT-D | Idem. `C-29` (Anysite) en est la preuve indirecte et sera interrogé à sa place. |
| C-14 | **Pages SEO autorisées** `/fr/voiture/`, `/nl/auto/` | RETENU | LOT-A | **Priorité 1 du registre.** Partiellement prouvé : agrégats exhaustifs + 20 annonces/modèle × 40 champs. Restent P2 (représentativité) et P5 (débit). |
| C-82 | Énumération d'hôtes par les logs de Certificate Transparency | RETENU | LOT-B | Hôtes hors `www` : ne servent pas de `robots.txt`, donc sondables. L'hypothèse la plus rentable du registre si un hôte de **recherche** existe. |
| C-88 | Dépôts GitHub et paquets npm publiés par AS24 `[AJOUT G2]` | RETENU | LOT-B | Index inventorié (négatif) ; reste le contenu des tarballs. |

## Famille 3 — Endpoints de l'application mobile

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-15 | API GraphQL mobile interne (requêtes persistées) | RETENU | LOT-B | Verrou n° 6 de v1. Hôte inconnu ; `C-88` a échoué à le livrer ; reste `C-16`. |
| C-16 | Reverse engineering de l'app (APK / IPA) | RETENU | LOT-B | Mandat restreint à l'analyse **statique** d'un APK public (téléchargement + `grep`), exécutable sans appareil, sans compte et sans requête vers AS24. Le MITM dynamique va en `ACTIONS-COMMANDITAIRE`. |

## Famille 4 — Flux partenaires et syndication

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-17 | Iframe / vitrine embarquable concessionnaire | RETENU | LOT-L | Conçue pour être appelée depuis des origines tierces : régime de crawl à qualifier séparément. |
| C-18 | Plateformes de multidiffusion comme canal indirect (éditeurs branchés sur l'API AS24) | RETENU | LOT-L | Distinct de `C-84` : ici les éditeurs **lisent** l'inventaire AS24 par droits contractuels. |
| C-19 | Spécification de feed concessionnaire CSV/XML | RETENU | LOT-L | Dictionnaire de champs canonique d'entrée ; sert directement de contrat pour `C-86`. |
| C-20 | Propriétés du groupe (AUTOproff, LeasingMarkt, Smyle, Trader Corp.) | RETENU | LOT-O | Backends potentiellement moins durcis, même maison mère. |
| C-21 | Régie publicitaire AS24 Media (specs techniques) | **ÉCARTÉ** | — | **Strictement dominé** : ne contient aucune donnée d'annonce ; la taxonomie qu'il révélerait est déjà acquise et prouvée par `C-02`, et les chiffres de marché par `C-50`. |
| C-73 | Réseaux d'affiliation (Awin, Daisycon, TradeTracker) | RETENU | LOT-M | Existence du programme prouvée pour AS24 CH ; le datafeed reste à prouver. |
| C-74 | Feeds publicitaires véhicules (Google Vehicle Ads, Meta AIA) | RETENU | LOT-M | BE non desservie côté Google ; l'angle vaut pour NL/FR/DE et pour la **découverte de feeds** côté garages. |
| C-84 | Prestataires BE/NL de multidiffusion nommés (Autralis, Stockway, CPS) | RETENU | LOT-L | Détiennent le stock normalisé **avant** publication sur AS24. |
| C-85 | Programme AS24 → « data service providers » `[AJOUT G2]` | RETENU | LOT-L | Premier canal contractuel **nommé** de sortie de données AS24 vers des tiers. |
| C-86 | Devenir soi-même destination de flux entrant `[AJOUT G2]` | RETENU | LOT-L | Exposition juridique et anti-bot nulles par construction ; effort commercial à chiffrer. |

## Famille 5 — API tierces de scraping managé

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-22 | Apify — catalogue d'acteurs AS24 | RETENU | LOT-F | Liste d'acteurs élargie par `G2-K12` (`bovi`, `rigelbytes`, `3x1t`, `hello.datawizards`). |
| C-23 | Scrapfly (ASP anti-Akamai) | RETENU | LOT-G | Documente le plafond de 4 000 : à confronter à `C-70`. |
| C-24 | ScrapingBee — page produit « AutoScout24 API » | RETENU | LOT-F | Endpoint dédié annoncé : vérifier s'il existe vraiment ou s'il s'agit d'une page marketing générique. |
| C-25 | Piloterr — `/v2/autoscout24/search` et `/ad` | RETENU | LOT-F | Renvoie l'**évaluation de prix AS24**, signal analytique de premier ordre pour le mode 2. |
| C-26 | Scrape.do | RETENU | LOT-G | Point de comparaison de prix (R5) ; guide AS24 dédié publié. |
| C-27 | Bright Data (Scraper API, Web Unlocker, datasets) | RETENU | LOT-G | **Corrigé** : la page produit `datasets/autoscout24` existe (`G2-K12`), le dataset n'est plus supposé. |
| C-28 | Fournisseurs entreprise (Oxylabs, Zyte, Decodo, Nimble, Infatica) | RETENU | LOT-G | Instruits en bloc, un seul corpus de pages tarifaires. |
| C-29 | Anysite.io — `POST /api/autoscout24/dealers/listings` | RETENU | LOT-F | Preuve commerciale que la primitive « stock par concessionnaire » de `C-13` existe. |
| C-30 | Carapis — parseur AS24 multi-marchés | RETENU | LOT-F | Distingue explicitement les backends `.com` et `.ch`. |
| C-31 | auto-api.com — `/offers`, `/changes`, exports quotidiens | RETENU | LOT-F | **Structurellement la forme la plus proche du besoin** (snapshot + delta) : à qualifier en premier dans le lot. |
| C-32 | Recettes no-code (Webscraper.io, ScrapeIt, Parse.bot) | **ÉCARTÉ** | — | **Strictement dominé** : `C-22` couvre le même accès avec un meilleur rapport prix/couverture, et `C-64` couvre mieux l'apport résiduel (la carte des champs). |
| C-91 | Intégrations low-code n8n / Make / Zapier `[AJOUT G2]` | **ÉCARTÉ** | — | **Strictement dominé par `C-22`** : simple façade d'orchestration sur l'acteur Apify `bovi`, sans apport de couverture, de prix ni de champ. |

## Famille 6 — Navigateurs pilotés auto-hébergés

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-33 | Playwright / Puppeteer durci + proxies résidentiels BE | RETENU | LOT-H | Tests à mener contre une cible protégée par Akamai **autre qu'AS24**, jamais contre AS24. |
| C-34 | Navigateurs anti-fingerprint natifs (Camoufox, patchright, UC) | RETENU | LOT-H | Non dominé par `C-33` : le durcissement au niveau moteur passe où le patch par script échoue. |
| C-35 | Client HTTP à empreinte TLS usurpée (`curl_cffi`, JA3/JA4) | **ÉCARTÉ** | — | **Strictement dominé par `C-33` et `C-36`** : incapable d'exécuter le capteur Akamai (~10 % du problème), il n'est jamais une voie autonome mais un composant qui suppose un `_abck` obtenu par l'un des deux. |

## Famille 7 — Unblocking / résolution de challenge

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-36 | Web Unlocker / Web Unblocker managés | RETENU | LOT-G | Variante « le provider absorbe Akamai » de l'axe A8. |
| C-37 | Solveurs auto-hébergés / `sensor_data` Akamai | RETENU | LOT-H | Signal contraire à instruire : FlareSolverr mesuré à 0 % sur Cloudflare Enterprise ; sa valeur sur Akamai est une autre question. |

## Famille 8 — Datasets préexistants

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-38 | Datasets Kaggle AS24 | RETENU | LOT-I | Téléchargement exige un compte → `ACTIONS-COMMANDITAIRE` ; les métadonnées sont lisibles sans compte. |
| C-39 | Zenodo `autoscout24_dataset_20251108.csv` | RETENU | LOT-I | Téléchargeable sans compte, avec DOI : à qualifier en premier. |
| C-40 | Hugging Face Datasets | RETENU | LOT-I | Absence non démontrée en v1 : recherche directe sur le Hub à faire. |
| C-83 | Jeux académiques nommés (AS24-CH, AS24-DE, ProbSAINT) | RETENU | LOT-I | Coût nul, volume immédiat pour prototyper le moteur d'agrégation. |
| C-67 | FDZ Ruhr / RWI `RWI-GEO-CARMKT` | RETENU (périmètre restreint) | LOT-I | **Reclassé par `VERIF-C67-fdz.md`** : n'est **pas** une voie d'alimentation (DE seule, 2019-2024 clos, usage scientifique). Mandat exclusif : **instrument de mesure du biais** de l'échantillon de `C-14` (point ouvert O9). |
| C-41 | Marketplaces de données et data brokers (Datarade, PromptCloud, Marketcheck, Datatorq, Dataforce) | RETENU | LOT-P | Datatorq annonce nommément la Belgique : à qualifier en € / 1 000 annonces. |

## Famille 9 — Sources alternatives substituables

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-42 | Mobile.de Search API officielle | RETENU | LOT-N | Groupe distinct d'AS24, API de **recherche** officielle et documentée : le meilleur candidat « licite + lecture » du registre pour DE. |
| C-43 | Portails belges concurrents (Gocar, Moniteur Automobile, Vroom, 2dehands…) | RETENU | LOT-N | Volumes du même ordre qu'AS24 BE : substitution partielle crédible. |
| C-44 | Portails voisins multi-pays (La Centrale, Leboncoin, AutoTrader, Marktplaats) | RETENU | LOT-N | Sert H1 (schéma multi-pays), non redondant avec `C-43` (géographies disjointes). |
| C-45 | theparking.eu (scraping de ses pages) | RETENU | LOT-N | 403 déjà relevé sur un fetch non navigateur : qualifier filtrage d'UA contre anti-bot complet. |
| C-46 | `schema.org/Car` chez les concessionnaires | RETENU | LOT-M | Reconstruction de l'offre professionnelle sans passer par AS24. |
| C-47 | Plateformes B2B / remarketing (AUTOproff, eCarsTrade, CarNext, Autobiz) | RETENU | LOT-O | Flux souvent plus ouverts car destinés à des acheteurs pro. |
| C-68 | AutoUncle (méta-agrégateur, API commerciale) | RETENU | LOT-N | BE probablement hors couverture : question à poser d'emblée. |
| C-69 | API annoncée par theparking.eu | RETENU | LOT-N | Canal contractuel sur un miroir explicite d'AS24. |
| C-76 | Portails constructeurs et labels VO BE | RETENU | LOT-M | Socles techniques anciens (`objects.cgi`), sans anti-bot comparable. |
| C-80 | OPENLANE Connect / enchères B2B | RETENU | LOT-O | Apport unique : prix de **transaction**. Trancher si l'API est entrante seule. |
| C-87 | AUTO1 Group `[AJOUT G2]` | RETENU | LOT-O | Acteur dominant du B2B européen, présence BE, indices publics. |
| C-92 | API REST des socles de sites de garages `[AJOUT G2]` | RETENU | LOT-M | Mécanique distincte de `C-46` : modèle interne au lieu du balisage SEO, sans plafond de pagination. |

## Famille 10 — Partenariat ou licence directe avec AutoScout24

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-48 | Demande de licence via le canal SEARCH API | RETENU | LOT-K | Résout d'un coup A8, A11 et A12 s'il aboutit : le coût est la seule inconnue. |
| C-49 | Programme partenaire technique / TSP, `portal.services.as24.tech` | RETENU | LOT-K | Contenu réel du portail jamais lu (zone d'incertitude n° 3 de v1). |
| C-50 | Accès recherche / presse, rapports de marché AS24 | RETENU | LOT-K | Références de vérité gratuites pour valider un pipeline d'agrégation. |
| C-81 | Article 9 P2B : les CGU pro comme inventaire des canaux | RETENU | LOT-K | **Objet redéfini par `G2-K7`/`G2-K8`** : preuve de l'interdiction d'extraction (§ 3.3) et canal d'export nommé (§ 17.2) ; le texte **belge** reste à lire, licitement, sous `/fr/entreprise/`. |

## Famille 11 — Sitemaps et robots.txt

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-51 | Découverte d'un sitemap XML AutoScout24 | **ÉCARTÉ** | — | **Inexistant sur le TLD cible, par mesure** : aucune directive `Sitemap:` dans le `robots.txt` de `autoscout24.be`, et 404 sur `/sitemap.xml` comme sur `/sitemaps/sitemap-index.xml` (3 sondes journalisées en v1). Le résidu « un sitemap existe sur un autre TLD » est absorbé par `C-52` et `C-82`. |
| C-52 | `robots.txt` comme carte d'endpoints et référence de conformité | RETENU | LOT-A | Déjà exploité pour BE (`FINDING-allowed-surface.md`). Mandat résiduel : les `robots.txt` de `.fr`, `.de`, `.nl`, `.lu` — H1 est multi-pays et la surface autorisée peut y différer. |

## Famille 12 — Caches et archives tiers

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-53 | Wayback Machine (index CDX + snapshots) | RETENU | LOT-J | Seule voie donnant de la **profondeur historique** ; aucune requête vers AS24. |
| C-54 | Common Crawl (index + WARC) | RETENU | LOT-J | `CCBot` est en `Disallow: /` et CC respecte robots : couverture attendue faible, à mesurer sur les crawls antérieurs à la directive. |
| C-55 | Index des moteurs via API (SerpApi, Brave, Bing) | RETENU | LOT-J | `/lst?` non indexable, mais les pages de détail et les pages SEO le sont. |
| C-71 | urlscan.io (DOM post-JS déjà collecté) | RETENU | LOT-J | Apport unique : le DOM **après** exécution du JavaScript. Question juridique à porter en A11 (soumettre soi-même une URL = contournement par tiers interposé ?). |
| C-72 | HTTP Archive — corps de réponses en BigQuery | RETENU | LOT-J | Utile surtout pour la **structure** et l'axe A7 ; coût BigQuery à chiffrer. |

## Famille 13 — Valorisation et données de marché

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-56 | JD Power Europe (Autovista, Eurotax, Glass's, Schwacke) | RETENU | LOT-P | Couverture Belgique explicitement mentionnée ; référentiel + valeur de marché. |
| C-57 | INDICATA (Autorola) | RETENU | LOT-P | **Élément nouveau (`G2-K10`)** : décrite comme collectant depuis les sites OEM, les annonces et les sites de garages — donc collecte web, sans accord de portail mentionné. À confirmer sur source primaire. |
| C-58 | Outil d'estimation de prix AS24 (`/prijsschatting/`, `/evaluationvoiture/`) | RETENU | LOT-A | **Chemins sous directive `Allow`** : sondable licitement. L'endpoint consomme nécessairement une distribution de prix — accès indirect à l'agrégat. |
| C-59 | Décodeurs VIN et historiques (Vincario, carVertical, Autodata) | **ÉCARTÉ** | — | **Hors périmètre** : KYCAR n'ingère aucun VIN (H3 et règle RGPD R3) et ce canal ne produit ni annonce ni agrégat de marché ; la normalisation de variante qu'il apporterait est couverte par `C-02` (référentiel officiel prouvé) et `C-56`. |
| C-75 | Autotelex, RDC, JATO Dynamics | RETENU | LOT-P | Double casquette d'Autotelex (multidiffusion + vente de données) : position exactement visée. |

## Famille 14 — Autres voies

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-60 | Alertes email de recherches sauvegardées | RETENU | LOT-E | Exige un compte AS24 → `ACTIONS-COMMANDITAIRE`. Mandat en 1.4 : documenter la mécanique, la fraîcheur et le format des emails, et le fait qu'aucune requête sortante n'est émise. |
| C-61 | Extension tierce « AutoScout24 Price History & Tracker » | RETENU | LOT-E | Implique un backend historique déjà constitué : à identifier et à interroger. |
| C-62 | Collecte côté client par extension propre / opt-in | RETENU | LOT-E | Axe A8 « non concerné » ; couverture pilotée par le comportement des utilisateurs, non par un plan d'échantillonnage. |
| C-63 | Serveurs MCP au-dessus des scrapers AS24 | **ÉCARTÉ** | — | **Strictement dominé par `C-22`** : mêmes acteurs Apify comme source réelle, une couche d'intégration supplémentaire, aucun apport de couverture, de prix ni de champ. |
| C-64 | Scrapers open source comme parseurs de référence | RETENU | LOT-E | Carte des champs et des sélecteurs actuels ; date du dernier commit comme indicateur de ce qui fonctionne encore. |
| C-65 | Documentation tierce non officielle de l'« API AutoScout24 » (PHP) | RETENU | LOT-E | **Non** dominé par `C-02` : décrit une famille d'endpoints (recherche) que la spec de création ne couvre pas. Coût de lecture nul. |
| C-66 | Rejeu d'appels XHR observés dans le navigateur (DevTools) | RETENU | LOT-C | Produirait la liste exhaustive et actuelle des endpoints, mais suppose une session réelle sur AS24 : **hors de nos règles** → protocole à écrire, exécution en `ACTIONS-COMMANDITAIRE`. |
| C-70 | `qwillemse/autoscout-analyser` — pipeline en production | RETENU | LOT-E | **Priorité 2 du registre** : tranche à la fois le plafond de pagination, la technique de contournement par bandes d'années, et la question « Akamai bloque-t-il ce chemin ? ». |

## Famille 15 — Partenariats institutionnels de données

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-67 | *(voir famille 8, rattachement d'instruction `LOT-I`)* | RETENU (périmètre restreint) | LOT-I | Famille conservée pour mémoire : c'est le seul régime d'accès de ce type identifié, et sa mécanique doit rester visible même si son usage change. |

## Famille 16 — Données publiques officielles du véhicule

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-77 | Statbel / DIV / SPF Mobilité — immatriculations et parc BE | RETENU | LOT-Q | Population de référence du marché belge : instrument de mesure du biais (P2). |
| C-78 | RDW open data (NL) — registre complet, API Socrata, compteurs | RETENU | LOT-Q | Distribution réelle de kilométrage par âge, gratuite, sans anti-bot. |
| C-79 | Car-Pass (BE) — kilométrages et statistiques du marché VO | RETENU | LOT-Q | 855 169 documents en 2025 ≈ dénominateur du flux d'occasion belge. |
| C-90 | GOCA / contrôle technique BE `[AJOUT G2]` | RETENU | LOT-Q | Troisième dénominateur indépendant, adossé à l'acte de revente. |

## Famille 17 — Leviers réglementaires d'accès aux données

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-81 | *(voir famille 10, rattachement d'instruction `LOT-K`)* | RETENU | LOT-K | Famille conservée : elle produit de l'information **sur les canaux**, et c'est elle qui a permis de clore proprement l'angle DSA art. 40 (AS24 n'est pas VLOP). |

## Famille 18 — Espaces de données réglementés et fédérés *(nouvelle)*

| ID | Candidat | Statut | Lot | Mandat / motif |
|---|---|---|---|---|
| C-89 | Mobility Data Space, Catena-X, CEMDS `[AJOUT G2]` | RETENU | LOT-P | Régime juridique et tarifaire distinct de toutes les autres familles ; à clore ou à ouvrir en une seule investigation de catalogue. |

---

# Les 7 écartements, et pourquoi ils ne sont pas des renoncements

**Aucun candidat n'est écarté parce qu'il est difficile, cher, incertain ou juridiquement risqué** —
ce sont les axes A1, A2, A7 et A11 que la phase 1.4 doit précisément mesurer. Les sept écartements
tiennent tous à l'un des quatre motifs admis, et chaque domination nomme son dominant.

| ID | Motif admis | Écartement |
|---|---|---|
| C-21 | dominé | Régie AS24 Media : aucune donnée d'annonce ; taxonomie déjà prouvée par `C-02`, chiffres de marché par `C-50`. |
| C-32 | dominé | Recettes no-code : accès dominé par `C-22`, apport résiduel (carte des champs) dominé par `C-64`. |
| C-35 | dominé | `curl_cffi` : composant sans autonomie — n'est utilisable qu'avec un `_abck` produit par `C-33` ou `C-36`. |
| C-51 | inexistant | Sitemap : aucune directive `Sitemap:`, 404 sur les deux chemins canoniques — mesuré, pas supposé. |
| C-59 | hors périmètre | Décodeurs VIN : KYCAR n'ingère pas de VIN (H3, R3) et le canal ne produit ni annonce ni agrégat. |
| C-63 | dominé | Façades MCP : mêmes acteurs Apify que `C-22`, avec une dépendance de plus. |
| C-91 | dominé | Nœud n8n : façade d'orchestration sur l'acteur Apify `bovi`, entièrement contenu dans `C-22`. |

**Trois écartements que je me suis interdits**, et il faut le dire explicitement pour que la phase 1.4
ne les refasse pas par excès de zèle :
1. **Les candidats `C-06` à `C-13`** (endpoints internes interdits au crawl). Ils sont interdits *à
   nous* de sonder, ce qui n'est pas la même chose qu'être écartés du rapport de décision : leur
   coût, leur rendement et leur exposition juridique sont exactement ce que le commanditaire doit
   pouvoir lire avant de choisir. Ils restent retenus avec un **mandat documentaire strict**.
2. **`C-67`** (FDZ Ruhr). Son périmètre annoncé est infirmé, mais `VERIF-C67-fdz.md` établit qu'il
   change de rôle au lieu de disparaître : il devient l'instrument de mesure du biais de `C-14`.
   L'écarter reviendrait à perdre le seul étalon disponible du verrou du mode 2.
3. **Tous les fournisseurs de scraping managé apparemment redondants** (`C-23`, `C-26`, `C-28`,
   `C-36`). Leur mécanique est la même, mais l'axe A2 exige des **prix comparés** : chacun est un
   point de mesure, et écarter un point de mesure appauvrit le tableau final au lieu de le clarifier.
   Ils sont regroupés dans un même lot, ce qui règle le problème de coût d'instruction sans rien perdre.

---

# Corrections apportées à v1 et v2 par cette phase

| # | Cible | Constat | Preuve | Correction |
|---|---|---|---|---|
| G2-K7 | **`C-81`**, 3ᵉ question falsifiable : « Elles mentionnent une transmission de données à des tiers, ce qui nommerait des revendeurs de données AS24 existants » | **INFIRMÉE pour le texte allemand.** Le § 19.3 des `Händler-AGB` encadre la transmission à des tiers en termes purement génériques (« *nur, sofern das für die Erbringung der Dienste erforderlich ist oder AutoScout24 hierzu vertraglich… gesetzlich… oder auf Grundlage einer wirksamen Einwilligung berechtigt ist* ») et **ne nomme aucun tiers**. | fetch de `https://www.autoscout24.de/unternehmen/haendler-agb/`, 2026-09-06 | Reformuler l'attente : les CGU ne livrent pas l'annuaire des revendeurs. La chaîne de valeur doit être remontée par la **presse professionnelle** (→ `C-85`), pas par le contrat. |
| G2-K8 | **`00-CONTEXT.md`**, § juridique : « CGU AutoScout24 : le texte exact n'a pas pu être récupéré. Hypothèse par défaut […] l'extraction automatisée est contractuellement interdite. À confirmer. » | **CONFIRMÉE, verbatim et par écrit**, pour le contrat concessionnaire : le § 3.3 des `Händler-AGB` interdit « *die automatisierte Abfrage der Datenbank mittels Software* » ainsi que la copie de la base. **Réserve de portée** : c'est le contrat **B2B**. Le contrat consommateur (`Verbraucher-AGB`, publié séparément) n'a pas été lu, et c'est lui qui s'applique à un usage personnel non concessionnaire (H2). | idem | L'axe A11 dispose désormais d'un **mécanisme juridique nommé et cité**, et non d'une présomption de marché. À compléter en 1.4 par la lecture des `Verbraucher-AGB` et des conditions belges (`LOT-K`). |
| G2-K9 | **Angle A16 de v2** (« l'organisation GitHub existe, son contenu reste à inventorier ») et **verrou n° 6 de v1** (hôte de l'API GraphQL mobile) | **Angle CLOS par inventaire direct.** Organisation `AutoScout24` : 4 dépôts publics, 0 gist, dont 3 exercices de recrutement. npm : scope `@autoscout24` réel mais limité à des utilitaires de front (`custom-events`, `toguru-client`) et à un design system (`showcar-ui`, `as24-autocomplete`, `showcar-carousel`, `showcar-storage`, `carbon-core`). Aucune constante d'endpoint, aucun hachage de requête persistée au niveau de l'index. | `api.github.com/orgs/AutoScout24` (200) ; `registry.npmjs.org/-/v1/search?text=autoscout24` (200) | Le verrou n° 6 **ne se résout pas par les paquets publics**. Reste l'analyse statique d'APK (`C-16`) et le contenu des tarballs (`C-88`). Ne pas re-explorer la recherche indexée sur ce sujet. |
| G2-K10 | **`C-57`** (INDICATA), mode d'approvisionnement inconnu | Élément documentaire nouveau : INDICATA est décrite comme collectant sa donnée « *from OEM websites, classifieds, used car dealer and retailer websites* » — donc une **collecte web**, aucun accord de portail mentionné. Source secondaire, à confirmer sur source primaire. | résultat indexé, page société INDICATA | Orienter A11 et A12 de `C-57` : si le leader du segment collecte par le web, l'argument « il existe forcément un accord de portail » tombe. À vérifier sur `indicata.com/company/` en 1.4. |
| G2-K11 | **`C-27`** (Bright Data), « suggère l'existence […] d'un possible dataset AS24 sur devis » | **Existence documentée** : une page produit dédiée `brightdata.com/products/datasets/autoscout24` est indexée. Ce n'est plus une inférence. | résultat indexé | Reformuler `C-27` : le dataset AS24 de Bright Data existe comme produit ; restent son volume, sa fraîcheur, son périmètre et son prix. |
| G2-K12 | **`C-22`** (Apify), liste d'acteurs | Quatre acteurs AS24 absents de la liste de v1 apparaissent : `bovi`, `rigelbytes`, `3x1t/autoscout24-scraper-ppr`, `hello.datawizards/autoscout24-product-script`. Un nœud n8n communautaire emballe l'un d'eux. | résultats indexés ; `registry.npmjs.org/n8n-nodes-autoscout24-cars-scraper` (200) | Élargir le corpus de `C-22` à ces acteurs pour la comparaison de prix (R5). `C-91` est écarté comme doublon. |
| G2-K13 | **`FINDING-allowed-surface.md`**, usage de la surface autorisée | Observation non relevée jusqu'ici : parmi les 17 préfixes autorisés figurent `/fr/entreprise/` et `/nl/onderneming/` — l'**espace professionnel**, qui est l'emplacement naturel des conditions concessionnaires belges et des pages « devenir partenaire ». | lecture du `robots.txt` cité dans `FINDING-allowed-surface.md` | Les questions falsifiables de `C-81`, `C-19` et `C-49` relatives à la Belgique sont **testables licitement**, sans sortir de la surface autorisée. Inscrit comme test prioritaire de `LOT-K`. |

---

# Les lots d'investigation de la phase 1.4

17 lots, 3 à 6 candidats chacun, constitués sur un critère unique : **un lot = un outillage et un
corpus de sources**, pour qu'un seul agent l'instruise sans changer de méthode. Chaque lot porte son
profil d'agent, ses tests exécutables **sans compte et sans violer le `robots.txt`**, et ses
questions falsifiables prioritaires.

**Règle opposable à tous les lots** : aucune requête vers `www.autoscout24.be` ou `www.autoscout24.com`
en dehors des 17 préfixes `Allow` de `FINDING-allowed-surface.md`. Un candidat dont la sonde
exigerait un chemin interdit est instruit **documentairement**, et le protocole de test non exécuté
est écrit pour la section `ACTIONS-COMMANDITAIRE`.

## Vague 1 — les lots qui décident (à lancer en premier)

### LOT-A — Surface autorisée et endpoints AS24 publics non authentifiés
- **Candidats** : `C-14`, `C-58`, `C-02`, `C-52` *(4)*
- **Profil d'agent** : **investigation technique avec tests réels** — Opus, effort high. C'est le lot le plus chargé en preuve exécutable du plan.
- **Tests exécutables** :
  - `curl -A ClaudeBot` sur 3 pages `/fr/voiture/{marque}/` et 3 pages `/fr/voiture/{marque}/{marque}-{modèle}/`, extraction de `__NEXT_DATA__`, comptage de `listings.listings[]` et lecture de `listings.metadata.totalItems`.
  - **Test de représentativité (P2)** : comparer la distribution prix/km/année des 20 annonces servies à celle des agrégats du même segment, et vérifier la corrélation avec `adProduct.tier`. Répéter la même URL à 3 heures d'intervalle : l'échantillon tourne-t-il ?
  - **Test de pagination** : `?page=2` et paramètres de tri sur un chemin autorisé — la surface autorisée admet-elle une pagination, oui ou non ?
  - **Test de débit (P5)** : 20 requêtes espacées, mesure de p50 et détection de 429 / cookies `_abck` / `ak_bmsc`.
  - `/prijsschatting/` et `/evaluationvoiture/` : cartographier le formulaire et **l'appel qu'il émet** ; si cet appel part vers un chemin autorisé, mesurer ce qu'il renvoie (distribution ou point unique).
  - `listing-creation.api.autoscout24.com` : rejouer `/makes`, `/references`, `/assets/openapi/spec.yml` et chercher dans la spec tout chemin de **lecture** au-delà du référentiel.
  - `robots.txt` de `autoscout24.fr`, `.de`, `.nl`, `.lu` : la surface autorisée est-elle la même hors BE ?
- **Questions falsifiables prioritaires** :
  1. « L'échantillon de 20 annonces est biaisé par le produit publicitaire. » (verrou du mode 2)
  2. « La surface autorisée n'offre aucune pagination : le plafond est structurellement de 20 annonces par modèle. »
  3. « Le débit soutenable permet un snapshot complet (~5 250 requêtes, ~2,3 Go) en moins de 24 h. »
  4. « L'outil d'estimation renvoie une distribution de marché, et non un prix ponctuel. »
  5. « La surface autorisée est identique sur les autres TLD, donc H1 est servi par la même voie. »

### LOT-B — Hôtes hors front, spécifications et binaires : la surface non documentée
- **Candidats** : `C-82`, `C-03`, `C-04`, `C-88`, `C-15`, `C-16` *(6)*
- **Profil d'agent** : **investigation technique avec tests réels** — Opus, effort high.
- **Tests exécutables** :
  - `crt.sh?q=%25.autoscout24.com&output=json` et `%25.autoscout24.be` : une requête par domaine, extraction des noms d'hôtes, dédoublonnage.
  - Pour chaque hôte candidat `*.api.*` : **une seule** requête `HEAD`, puis si 200, un `GET` sur `/assets/openapi/spec.yml`, `/openapi.json`, `/swagger`, `/docs`, `/.well-known/`. Ces hôtes ne servent pas de `robots.txt` — raisonnement déjà validé pour `listing-creation`.
  - `git clone` de `smg-automotive/autoscout24-api-specs`, lecture de `openapi-listing-distribution.yaml` hors ligne, inventaire des opérations de lecture.
  - Téléchargement des tarballs npm `@autoscout24/*` et `showcar-*`, `grep -rE 'https?://[a-z0-9.-]*autoscout24|graphql|sha256Hash|persistedQuery'`.
  - APK : téléchargement depuis un miroir public, `unzip`, `strings`/`apktool`, `grep` des hôtes et des documents GraphQL. Aucune installation, aucun MITM, aucun compte.
- **Questions falsifiables prioritaires** :
  1. « Les logs CT révèlent au moins un hôte `*.api.autoscout24.*` de **recherche**, joignable sans authentification. » (l'hypothèse la plus rentable du registre)
  2. « `openapi-listing-distribution.yaml` décrit des opérations de lecture d'annonces, et pas seulement de dépôt. »
  3. « L'APK contient l'hôte de l'API GraphQL mobile en clair. » (résolution du verrou n° 6)
  4. « Aucun paquet npm public ne contient de hachage de requête persistée. »
  5. « Les hôtes découverts ne servent aucun `robots.txt`, donc aucune directive de crawl ne leur est opposable. »

### LOT-E — Code tiers, pipelines en production et collecte côté client
- **Candidats** : `C-70`, `C-64`, `C-65`, `C-61`, `C-62`, `C-60` *(6)*
- **Profil d'agent** : **investigation technique avec tests réels** — Opus, effort high. L'outillage est homogène : GitHub, Chrome Web Store, npm, et l'interrogation d'API tierces déjà en ligne.
- **Tests exécutables** :
  - `qwillemse/autoscout-analyser` : lire `scraper.py`, relever le plafond codé en dur et la stratégie de partition, vérifier la date du dernier run GitHub Actions, chercher l'absence de proxy/unblocker dans les dépendances, localiser l'URL de l'API Railway et l'interroger, vérifier si `cars.db` est publié en artefact téléchargeable.
  - Cloner 3 scrapers de `C-64` aux commits les plus récents et **diff des sélecteurs** : ce qui change révèle ce qui casse (axe A7).
  - Extension `C-61` : télécharger le paquet CRX depuis le Web Store, lire son manifeste et ses hôtes autorisés, identifier son backend, l'interroger.
  - `C-62` : mesurer le coût réel — écrire le manifeste minimal d'une extension de lecture de `__NEXT_DATA__` et estimer le nombre d'utilisateurs nécessaires pour un snapshot BE.
  - `C-60` : documenter le format d'alerte AS24 et la mécanique IMAP sans créer de compte (captures publiques, documentation d'aide).
- **Questions falsifiables prioritaires** :
  1. « Le plafond est 4 000 (et non 400) et la partition par bandes d'années le franchit effectivement. » (tranche la zone d'incertitude n° 1 de v1)
  2. « Le pipeline `C-70` n'utilise ni proxy ni unblocking, donc Akamai ne bloque pas ce chemin. » (question la plus précieuse du lot)
  3. « `cars.db` (730 000 annonces) est téléchargeable, donc un dataset gratuit prêt à l'emploi existe. »
  4. « Le backend de l'extension `C-61` expose un historique de prix interrogeable. »
  5. « Les sélecteurs des scrapers open source ont changé au moins deux fois en 12 mois. » (mesure de A7)

### LOT-F — Fournisseurs de scraping à endpoint AutoScout24 dédié
- **Candidats** : `C-31`, `C-22`, `C-25`, `C-29`, `C-30`, `C-24` *(6)*
- **Profil d'agent** : **investigation documentaire** (pricing, CGU, offres commerciales) — Sonnet, effort medium-high. Ordre d'instruction imposé : `C-31` d'abord, c'est la forme la plus proche du besoin.
- **Tests exécutables** : lecture des pages de documentation et de tarifs, relevé des schémas de réponse publiés, conversion systématique en **€ / 1 000 annonces** et en **€ / mois pour un rafraîchissement quotidien BE** (R5) ; relevé des périmètres pays annoncés ; relevé des CGU (droit d'usage analytique, revente, conservation) ; recherche d'un exemple de réponse publié pour compter les champs contre les 40 du dictionnaire cible. **Aucune création de compte** : les essais gratuits vont en `ACTIONS-COMMANDITAIRE`.
- **Questions falsifiables prioritaires** :
  1. « `auto-api.com` sert un delta (`/changes`) et un export quotidien complet, ce qui rend un snapshot BE trivial. »
  2. « Au moins un fournisseur documente la Belgique nommément et un volume BE. »
  3. « Le prix médian du marché est inférieur à 5 € / 1 000 annonces. »
  4. « Les CGU d'au moins un fournisseur autorisent l'usage analytique interne. »
  5. « Les réponses publiées couvrent au moins 20 des 40 champs cibles, évaluation de prix AS24 incluse (`C-25`). »

### LOT-J — Archives, index et caches tiers
- **Candidats** : `C-53`, `C-54`, `C-55`, `C-71`, `C-72` *(5)*
- **Profil d'agent** : **investigation technique avec tests réels** — Opus, effort high. Propriété remarquable du lot : **aucun test ne touche AutoScout24**.
- **Tests exécutables** :
  - API CDX Wayback : `url=autoscout24.be*&output=json&limit=…` pour compter les captures par motif d'URL, puis récupérer 2 snapshots de pages d'offre et vérifier l'intégrité de `__NEXT_DATA__`.
  - Index Common Crawl : requête sur `autoscout24.be` pour 3 crawls d'époques différentes, dont un antérieur à l'ajout de `CCBot` au `Disallow`.
  - urlscan.io : `page.domain:autoscout24.be` via l'API de recherche anonyme, puis récupération d'un `/dom/<uuid>/` et vérification du bloc `__NEXT_DATA__`.
  - HTTP Archive : estimation de coût par `--dry_run` BigQuery avant toute requête facturée ; vérifier la présence de `autoscout24.be` dans les tables de pages.
  - Une API d'index (Brave ou SerpApi, palier gratuit sans carte si possible, sinon documentaire) : compter les URL d'offres indexées.
- **Questions falsifiables prioritaires** :
  1. « Wayback contient assez de captures de pages d'offre pour reconstruire une série temporelle de prix. » (capacité qu'aucune autre voie gratuite n'offre)
  2. « urlscan.io conserve des DOM post-JS de pages d'annonces, `__NEXT_DATA__` intact. »
  3. « Common Crawl garde une couverture exploitable sur les crawls antérieurs à la directive `CCBot`. »
  4. « La requête HTTP Archive tient dans le palier gratuit de 1 To. »
  5. « Soumettre soi-même une URL AS24 à urlscan constituerait un contournement du `robots.txt` par tiers interposé. » (question **juridique**, à trancher en A11, pas techniquement)

## Vague 2 — les lots de substitution et de contournement

### LOT-M — Découverte côté concessionnaire : le stock sans passer par AutoScout24
- **Candidats** : `C-92`, `C-46`, `C-76`, `C-74`, `C-73` *(5)*
- **Profil d'agent** : **investigation technique avec tests réels** — Opus, effort high. Corpus homogène : des domaines tiers (garages, constructeurs, réseaux d'affiliation), jamais AS24.
- **Tests exécutables** : constituer un échantillon de 20 garages belges depuis un annuaire public ; pour chacun, `robots.txt` puis `/wp-json/`, `/wp-json/wp/v2/types`, `/feed/`, `/vehicles.xml`, `/sitemap.xml` ; extraction du JSON-LD `schema.org/Car` d'une page véhicule et comptage des propriétés ; `certified.cars.mercedes-benz.be/cgi/objects.cgi` et `autosphere.be` : énumérabilité et plafond de pagination ; lecture de la spec de feed Google Vehicle Ads et comptage des champs contre les 40 cibles ; profil Awin 29043 et recherche d'un programme AS24 **belge**.
- **Questions falsifiables prioritaires** :
  1. « Au moins 5 garages sur 20 exposent un stock JSON structuré sans authentification. »
  2. « L'union des portails constructeurs BE représente une part significative des ~115 000 annonces AS24 BE. »
  3. « Les véhicules de ces sources sont **aussi** sur AS24 (donc substituables) et non un stock disjoint. »
  4. « Le format Vehicle Ads couvre au moins 20 des 40 champs cibles. »
  5. « Un programme d'affiliation AS24 existe pour la Belgique et fournit un datafeed. » (probablement faux, à clore proprement) |

### LOT-N — Portails concurrents et méta-agrégateurs
- **Candidats** : `C-42`, `C-43`, `C-44`, `C-45`, `C-69`, `C-68` *(6)*
- **Profil d'agent** : **investigation technique avec tests réels** — Opus, effort high (le lot mêle sondes HTTP et lecture de documentation d'API).
- **Tests exécutables** : `robots.txt` des 8 portails cités, puis **une** requête de page de recherche sur les portails qui l'autorisent, avec relevé du code HTTP, de la présence d'un payload JSON et du nombre d'annonces par page ; lecture de la documentation publique de la Search API mobile.de (sandbox `services.mobile.de`) et comptage de ses champs ; theparking.eu : qualifier le 403 (variation d'`User-Agent`, une requête) et lire la page API ; AutoUncle B2B : relever le périmètre pays annoncé et la nature de l'objet servi (annonce contre valorisation).
- **Questions falsifiables prioritaires** :
  1. « La Search API mobile.de est utilisable sans statut concessionnaire. » (si vraie, c'est une voie licite et documentée pour DE)
  2. « Au moins deux portails belges n'ont pas d'anti-bot de niveau Akamai et autorisent leur recherche au crawl. »
  3. « L'API AutoUncle sert des annonces individuelles, et la Belgique est adressable. »
  4. « Le 403 de theparking.eu est un filtrage d'`User-Agent` trivial. »
  5. « L'union `C-43` + `C-44` couvre l'hypothèse H1 sans AS24. » (question de survie du produit si toutes les voies AS24 échouent)

### LOT-C — Payloads du front Next.js *(documentaire, aucune sonde)*
- **Candidats** : `C-06`, `C-07`, `C-08`, `C-66` *(4)*
- **Profil d'agent** : **investigation documentaire** — Sonnet, effort medium-high. **Contrainte dure : aucune requête vers AS24.** Tout se documente par sources tierces.
- **Tests exécutables** : reconstituer la forme des payloads depuis le code de `C-70` et de trois scrapers de `C-64` ; relever la liste des clés de `props.pageProps` documentée dans `FINDING-allowed-surface.md` (surface autorisée) et la comparer à celle décrite pour `/lst` par les sources tierces ; établir si les routes `/_next/data/` sont attestées par une source tierce ; **écrire le protocole DevTools de `C-66`** prêt à être exécuté par le commanditaire (liste des interactions, format de journal attendu).
- **Questions falsifiables prioritaires** :
  1. « Le payload de `/lst` porte les mêmes 40 champs par annonce que la surface autorisée. » (si vrai, `C-14` ne perd aucun champ, seulement du volume)
  2. « Les routes `/_next/data/{buildId}` sont attestées et le `buildId` est lisible depuis une page autorisée. »
  3. « `numberOfPages` est plafonné dans le payload lui-même, ce qui prouverait le plafond sans le tester. »
  4. « Aucune source tierce ne décrit un paramètre de taille de page supérieur à 20. »

### LOT-D — Endpoints internes nommés par le `robots.txt` *(documentaire, aucune sonde)*
- **Candidats** : `C-09`, `C-10`, `C-11`, `C-12`, `C-13` *(5)*
- **Profil d'agent** : **investigation documentaire** — Sonnet, effort medium-high. **Aucune requête** : ces cinq chemins sont en `Disallow` pour tous les agents.
- **Tests exécutables** : recherche de toute trace publique de ces endpoints (code tiers, tickets, réponses d'API de `C-29`/`C-30` qui les reflètent, historique de `C-65`) ; spécifier la mécanique de reconstruction par dichotomie de `C-12` et **la transposer sur la surface autorisée** (les compteurs `totalItems`/`listingsCount` de `C-14` sont un oracle licite au même titre) ; établir si la primitive « stock par concessionnaire » de `C-13` est intégralement couverte par `C-29`.
- **Questions falsifiables prioritaires** :
  1. « La reconstruction de distributions par dichotomie fonctionne sur les compteurs de la surface autorisée, ce qui rend `C-12` inutile. » (résultat qui simplifierait tout le produit)
  2. « `C-29` fournit exactement la primitive de `C-13`, donc l'endpoint interdit n'a aucune valeur ajoutée pour nous. »
  3. « Aucune source publique ne documente le schéma de `/listing-search-api/graphql`. »
  4. « `OCS` désigne un service dont la donnée est hors périmètre KYCAR. »

### LOT-G — Unblocking managé et proxies : qui absorbe Akamai
- **Candidats** : `C-23`, `C-26`, `C-27`, `C-28`, `C-36` *(5)*
- **Profil d'agent** : **investigation documentaire** — Sonnet, effort medium-high.
- **Tests exécutables** : relevé des tarifs publics et conversion en € / 1 000 annonces et € / mois BE (R5) ; relevé de ce que chaque fournisseur **affirme** sur Akamai et de ce qu'il **garantit** contractuellement (non-facturation des échecs, SLA) ; pour `C-27`, qualifier la page produit `datasets/autoscout24` : volume, fraîcheur, périmètre, prix, mode de livraison ; relever les clauses de conformité (« nous respectons le robots.txt de la cible » — clause fréquente et dirimante).
- **Questions falsifiables prioritaires** :
  1. « Le dataset AS24 de Bright Data existe comme produit livrable, avec un volume et un prix annoncés. »
  2. « Au moins un fournisseur d'unblocking s'engage contractuellement sur une cible Akamai. »
  3. « Les CGU de ces fournisseurs excluent les cibles dont le `robots.txt` interdit le crawl. » (si vraie, elle **annule** la famille 7 pour AS24 : c'est la question la plus décisive du lot)
  4. « Le coût d'un snapshot BE quotidien par cette voie dépasse 100 €/mois. »

### LOT-H — Franchissement auto-hébergé : navigateurs durcis et solveurs
- **Candidats** : `C-33`, `C-34`, `C-37` *(3)*
- **Profil d'agent** : **investigation technique avec tests réels** — Opus, effort high. **Les tests se font contre une cible protégée par Akamai autre qu'AutoScout24**, et jamais contre AS24 : on mesure la capacité de l'outil, pas la résistance de la cible interdite.
- **Tests exécutables** : lancer Playwright durci et Camoufox contre une cible de test Akamai publique, relever l'obtention d'un `_abck` valide et le temps de résolution ; monter FlareSolverr et mesurer son taux de réussite sur la même cible ; mesurer le coût CPU/RAM par page rendue ; relever les prix publics des proxies résidentiels BE au Go.
- **Questions falsifiables prioritaires** :
  1. « Un Chromium durci obtient un `_abck` valide sur une cible Akamai en moins de 10 s. »
  2. « Camoufox réussit là où le Chromium patché échoue. »
  3. « FlareSolverr est inopérant sur Akamai comme il l'est sur Cloudflare Enterprise. »
  4. « Le coût par 1 000 pages rendues, proxies résidentiels inclus, dépasse celui de `LOT-F`. » (si vrai, l'auto-hébergement n'a aucun sens économique)

### LOT-I — Datasets préexistants et jeux académiques
- **Candidats** : `C-39`, `C-38`, `C-40`, `C-83`, `C-67` *(5)*
- **Profil d'agent** : **investigation technique légère** — Sonnet, effort medium-high (téléchargements et inspection de schémas, pas d'anti-bot).
- **Tests exécutables** : télécharger le CSV Zenodo (`C-39`, sans compte), compter lignes, colonnes, pays, plage de dates, et croiser ses valeurs de marque/modèle avec `data/reference/taxonomy.json` ; lire les métadonnées Kaggle et HF sans compte (schémas, tailles, licences) ; rechercher les jeux `AutoScout24-CH` / `AutoScout24-DE` dans les dépôts institutionnels et lire la section « données » des articles ProbSAINT/TabResFlow ; pour `C-67`, lire la description de données FDZ et le dépôt `PThie/RWI-GEO-AS24` pour en extraire **le dictionnaire de variables**, puis formuler la mesure de biais de l'échantillon de `C-14`.
- **Questions falsifiables prioritaires** :
  1. « Au moins un dataset téléchargeable sans compte couvre la Belgique. »
  2. « Un dataset couvre au moins 20 des 40 champs cibles et se réconcilie avec la taxonomie officielle. »
  3. « `C-67` permet de **chiffrer** la déformation d'un échantillon de 20 annonces triées par produit publicitaire. » (mandat exclusif de ce candidat)
  4. « Les licences autorisent un usage analytique interne (H2) et non seulement la recherche. »
  5. « Aucun de ces jeux n'a moins de 6 mois. » (fraîcheur : le point de rupture avec H4)

## Vague 3 — les lots documentaires et institutionnels *(parallélisables sans contention)*

### LOT-K — Canaux officiels AutoScout24 : licence, partenariat, conditions
- **Candidats** : `C-01`, `C-48`, `C-49`, `C-05`, `C-81`, `C-50` *(6)*
- **Profil d'agent** : **investigation documentaire** (pricing, CGU, offres commerciales) — Sonnet, effort medium-high.
- **Tests exécutables** :
  - **Test licite nouveau (`G2-K13`)** : `/fr/entreprise/` et `/nl/onderneming/` sont sous directive `Allow`. Les crawler pour y trouver les **conditions professionnelles belges**, les pages « devenir partenaire » et toute mention d'un canal d'export. C'est le seul chemin autorisé qui puisse livrer le texte contractuel belge.
  - Lire les `Verbraucher-AGB` allemandes (contrat consommateur, applicable à H2) et les comparer au § 3.3 des `Händler-AGB`.
  - Comparer les conditions sur `.de`, `.at` (`gebrauchtwagen.at`, PDF public) et `.ch` (`b2b.autoscout24.ch`) pour isoler ce qui est propre à chaque marché.
  - `portal.services.as24.tech/api-docs` : relever ce qui est lisible sans compte (zone d'incertitude n° 3 de v1).
  - Recenser les publications de marché AS24 des 24 derniers mois et en extraire les valeurs de référence chiffrées pour la validation de pipeline.
- **Questions falsifiables prioritaires** :
  1. « Les conditions professionnelles **belges** sont accessibles sous un préfixe autorisé et décrivent nommément un canal d'export de données. »
  2. « Le contrat **consommateur** interdit aussi l'extraction automatisée. » (détermine A11 pour l'usage H2, qui est celui de KYCAR)
  3. « La SEARCH API existe encore et son canal commercial répond avec une grille tarifaire. »
  4. « `portal.services.as24.tech` expose une documentation lisible sans compte. »
  5. « AutoScout24 n'est pas désigné VLOP, donc l'article 40 du DSA n'ouvre aucun droit. » (clôture définitive de l'angle A7 de v2)

### LOT-L — Syndication concessionnaire : les flux qui existent déjà
- **Candidats** : `C-86`, `C-85`, `C-84`, `C-19`, `C-18`, `C-17` *(6)*
- **Profil d'agent** : **investigation documentaire** — Sonnet, effort medium-high. Ordre imposé : `C-86` d'abord, c'est le candidat structurant.
- **Tests exécutables** : lire les pages « intégrations / partenaires / destinations » d'Autralis, Stockway, CPS Autosoft, MovingCar, et les VMS référencés par Marktplaats Zakelijk ; relever la liste des destinations offertes et chercher la procédure d'**ajout** d'une destination ; retrouver la spécification de feed concessionnaire AS24 (générateur XML open source cité en `C-19`) et compter ses champs ; identifier les dix *data service providers* de `C-85` par la presse professionnelle allemande ; documenter le modèle heycar/Carwow d'alimentation par les concessionnaires.
- **Questions falsifiables prioritaires** :
  1. « Un prestataire BE documente publiquement la procédure d'ajout d'une destination de flux. » (si vraie, `C-86` devient le candidat le moins risqué du registre)
  2. « Les dix prestataires de `C-85` sont nommables, et au moins un est actif en Belgique. »
  3. « La spec de feed AS24 couvre au moins 30 des 40 champs cibles. » (c'est le contrat d'entrée d'AS24 : il **définit** le plafond de richesse de toute voie)
  4. « L'iframe vitrine de `C-17` est servie depuis un hôte AS24 sans `robots.txt` opposable. »
  5. « Les éditeurs de `C-18` acceptent de revendre un accès agrégé. »

### LOT-O — B2B, enchères et prix de transaction
- **Candidats** : `C-87`, `C-80`, `C-47`, `C-20` *(4)*
- **Profil d'agent** : **investigation documentaire** — Sonnet, effort medium-high.
- **Tests exécutables** : lire les pages publiques de catalogue et d'intégration d'AUTO1, OPENLANE, eCarsTrade, AUTOproff, CarNext ; relever ce qui est visible sans compte acheteur ; extraire des rapports publics et des communiqués les prix moyens par segment et par pays ; relever les volumes belges annoncés ; pour `C-20`, vérifier si une propriété du groupe (LeasingMarkt, AUTOproff, AutoTrader.ca) expose une API ou un feed public.
- **Questions falsifiables prioritaires** :
  1. « Au moins une plateforme B2B expose un catalogue avec prix sans compte professionnel. »
  2. « Les prix de transaction publiés sont convertibles en référence de marché B2C. » (l'apport unique de ce lot : ancrer les anomalies du mode 2 sur du réel, pas sur du demandé)
  3. « AutoTrader.ca (même groupe) expose une API publique dont le modèle de données préfigure celui d'AS24. »
  4. « Le volume belge exposé atteint 10⁴ véhicules. »

### LOT-P — Vendeurs de données de marché et places de données
- **Candidats** : `C-57`, `C-75`, `C-56`, `C-41`, `C-89` *(5)*
- **Profil d'agent** : **investigation documentaire** — Sonnet, effort medium-high.
- **Tests exécutables** : lire `developer.jato.com/apis`, `indicata.com/company/`, `autotelex.nl`, `rdc.nl`, les fiches Datarade (Datatorq pour la Belgique, Dataforce), et le catalogue `catalog.mobility-dataspace.eu` ; pour chaque acteur, établir la **nature de l'objet vendu** (annonce, agrégat, valorisation, spécification), le périmètre pays, et le prix ramené à R5 ; pour `C-57`, chercher sur source primaire la description du mode de collecte (élément `G2-K10` à confirmer).
- **Questions falsifiables prioritaires** :
  1. « INDICATA déclare publiquement collecter par le web, sans accord de portail. » (répond à la question la plus opaque du dossier)
  2. « Au moins un vendeur documente une API d'**offre de marché** belge, et non seulement des valorisations. »
  3. « Un prix est obtenable sans NDA et exprimable en € / 1 000 annonces. »
  4. « Le catalogue du Mobility Data Space ne contient aucune donnée d'annonce VO. » (clôture de la famille 18, ou son ouverture)
  5. « Ces fournisseurs tirent leurs données d'offre des portails, donc répercutent les restrictions d'AS24. » (question juridique dimensionnante pour toute la famille 13)

### LOT-Q — Données publiques officielles : la population de référence
- **Candidats** : `C-78`, `C-77`, `C-79`, `C-90` *(4)*
- **Profil d'agent** : **investigation technique légère** — Sonnet, effort medium-high (API Socrata, fichiers ouverts, aucun anti-bot).
- **Tests exécutables** : interroger l'API Socrata du RDW sans clé (`$select`, `$where`, `$limit`), relever la pagination et compter les champs ; télécharger un fichier Statbel d'immatriculations et vérifier si la ventilation descend au modèle ; relever les chiffres publiés par Car-Pass et GOCA et vérifier leur granularité ; **produire le tableau de la population de référence BE** (parc, mutations, âge, kilométrage) qui servira d'étalon au test de biais de `LOT-A`.
- **Questions falsifiables prioritaires** :
  1. « Le RDW sert des relevés de compteur au niveau véhicule par API sans clé. » (la variable la plus lourde à obtenir chez AS24, gratuite ici)
  2. « Statbel descend au niveau marque **et modèle**, ou s'arrête au segment. »
  3. « Le nombre de Car-Pass délivrés est un dénominateur valide du flux d'occasion belge. »
  4. « GOCA publie des distributions et non des moyennes. »
  5. « Aucun équivalent belge du RDW n'existe au niveau véhicule. » (probablement vraie — à clore définitivement)

## Récapitulatif des lots

| Lot | Candidats | Nb | Profil d'agent | Vague |
|---|---|---|---|---|
| LOT-A | C-14, C-58, C-02, C-52 | 4 | Technique, tests réels — Opus high | 1 |
| LOT-B | C-82, C-03, C-04, C-88, C-15, C-16 | 6 | Technique, tests réels — Opus high | 1 |
| LOT-E | C-70, C-64, C-65, C-61, C-62, C-60 | 6 | Technique, tests réels — Opus high | 1 |
| LOT-F | C-31, C-22, C-25, C-29, C-30, C-24 | 6 | Documentaire — Sonnet medium-high | 1 |
| LOT-J | C-53, C-54, C-55, C-71, C-72 | 5 | Technique, tests réels — Opus high | 1 |
| LOT-M | C-92, C-46, C-76, C-74, C-73 | 5 | Technique, tests réels — Opus high | 2 |
| LOT-N | C-42, C-43, C-44, C-45, C-69, C-68 | 6 | Technique, tests réels — Opus high | 2 |
| LOT-C | C-06, C-07, C-08, C-66 | 4 | Documentaire strict (aucune sonde) — Sonnet | 2 |
| LOT-D | C-09, C-10, C-11, C-12, C-13 | 5 | Documentaire strict (aucune sonde) — Sonnet | 2 |
| LOT-G | C-23, C-26, C-27, C-28, C-36 | 5 | Documentaire — Sonnet medium-high | 2 |
| LOT-H | C-33, C-34, C-37 | 3 | Technique, tests réels (cible tierce) — Opus high | 2 |
| LOT-I | C-39, C-38, C-40, C-83, C-67 | 5 | Technique légère — Sonnet medium-high | 2 |
| LOT-K | C-01, C-48, C-49, C-05, C-81, C-50 | 6 | Documentaire — Sonnet medium-high | 3 |
| LOT-L | C-86, C-85, C-84, C-19, C-18, C-17 | 6 | Documentaire — Sonnet medium-high | 3 |
| LOT-O | C-87, C-80, C-47, C-20 | 4 | Documentaire — Sonnet medium-high | 3 |
| LOT-P | C-57, C-75, C-56, C-41, C-89 | 5 | Documentaire — Sonnet medium-high | 3 |
| LOT-Q | C-78, C-77, C-79, C-90 | 4 | Technique légère — Sonnet medium-high | 3 |
| **Total** | | **85** | 7 lots techniques Opus, 10 lots Sonnet | |

**Pourquoi des vagues plutôt qu'un seul front de 17 agents** : la vague 1 contient les cinq lots dont
le résultat **change le mandat des autres**. Si `LOT-A` prouve que l'échantillon de la surface
autorisée est représentatif, les lots 5 à 7 (scraping, unblocking, navigateurs) perdent leur objet
et n'ont plus qu'à être chiffrés pour mémoire. Si `LOT-B` trouve un hôte de recherche non
authentifié, c'est tout le registre qui se réordonne. Si `LOT-J` livre une profondeur historique
gratuite, la question de la fraîcheur (H4) change de nature. Lancer les 17 lots simultanément fait
travailler 12 agents sur des hypothèses que 5 autres sont en train d'invalider.

---

# Déclaration de saturation

**Verdict : le champ est saturé sur l'axe technique et sur l'axe des acteurs. Il ne l'est pas
entièrement sur l'axe contractuel, et trois questions restent ouvertes par impossibilité d'accès —
pas par manque d'exploration.**

## Ce qui autorise à parler de saturation

1. **Trois passes indépendantes, trois rendements décroissants et un point de convergence.** v1 a
   produit 66 candidats et 14 familles ; v2 en a ajouté 18 et 3 familles, en déclarant l'axe
   technique déjà saturé par v1 ; cette passe a ajouté 8 candidats et 1 famille, dont **aucun** dans
   les familles 2, 5, 6, 7 sinon par inventaire direct (`C-88`) — c'est-à-dire qu'aucune nouvelle
   *technique*, aucun nouveau *fournisseur de scraping* et aucun nouvel *endpoint* n'a émergé de
   trois recherches indépendantes menées avec des vocabulaires différents. Quand trois agents
   adverses convergent sur le même inventaire technique, l'hypothèse la plus économique est que
   l'inventaire est complet.
2. **Les deux angles légués les plus prometteurs ont été fermés par mesure, pas abandonnés.**
   L'organisation GitHub et les paquets npm ont été **énumérés** (4 dépôts, 0 gist, 7 paquets) :
   c'est un résultat négatif solide, pas une absence de résultat. Les CGU professionnelles ont été
   **lues** : la clause de transmission à des tiers existe et ne nomme personne. Ces deux fermetures
   valent plus que dix candidats supplémentaires, parce qu'elles suppriment deux hypothèses qui
   auraient sinon flotté sur toute la phase 1.4.
3. **Les trois raisonnements imposés — contournement, chaîne de valeur, analogie — ont chacun
   produit, et produit du neuf, pas des variantes.** `C-86` (se faire alimenter au lieu d'extraire)
   n'est pas une nuance de `C-18` : c'est un renversement du sens du flux, avec un profil de risque
   nul là où tout le reste du registre en a un. `C-85` nomme un canal contractuel de sortie de
   données qu'aucune passe n'avait vu. `C-89` ouvre un régime juridique entier. Que ces axes aient
   produit trois mécaniques structurellement nouvelles, et non trente candidats de plus, est le
   signe d'un champ correctement couvert : ce qui manquait manquait en **nature**, pas en nombre.
4. **La taxonomie s'est stabilisée.** v1 a créé 14 familles, v2 en a ajouté 3, cette passe 1 seule
   — et cette dernière (18, espaces de données réglementés) est un régime d'accès, non une technique.
   Aucune des 92 fiches n'est orpheline de famille, et aucune famille ne compte un seul candidat sans
   raison structurelle.
5. **Le registre couvre les deux modes du produit, et pas seulement l'un.** Le mode 1 (agrégats) a
   une voie **prouvée, gratuite, autonome et licite** (`C-14`). Le mode 2 (distributions) a des
   candidats dans sept familles distinctes, dont un instrument de mesure de son propre biais
   (`C-67`). Un registre qui ne couvrirait qu'un mode serait lacunaire quel que soit son nombre de
   candidats ; celui-ci ne l'est pas.

## Ce qui reste ouvert, et pourquoi je n'ai pas pu le fermer

| # | Question ouverte | Pourquoi elle n'est pas fermée | Où elle est reprise |
|---|---|---|---|
| O-1 | **Les noms des dix « data service providers » alimentés en données AS24.** | L'article de presse qui les recense renvoie **HTTP 403** à un fetch non authentifié. La liste n'existe, à ma connaissance, que derrière ce paywall professionnel ou dans la presse allemande spécialisée que je n'ai pas eu le quota d'explorer (12/12 requêtes consommées). | `LOT-L`, question prioritaire 2. Piste : `autohaus.de`, `kfz-betrieb.vogel.de`. |
| O-2 | **Le texte des conditions professionnelles et consommateur AS24 pour la Belgique.** | Je n'ai lu que le contrat concessionnaire **allemand**. Le texte belge est probablement sous `/fr/entreprise/` ou `/nl/onderneming/` — préfixes **autorisés** — mais mes 12 requêtes étaient épuisées, et je m'étais interdit tout appel vers `autoscout24.be`. | `LOT-K`, test 1 et question prioritaire 1. C'est un test **licite** : `G2-K13` en établit la légitimité. |
| O-3 | **L'hôte de l'API GraphQL mobile (verrou n° 6 de v1).** | Fermé par les deux voies documentaires disponibles : la recherche indexée (angle A16 de v2) et l'inventaire des paquets publics (`C-88`, cette passe). Il ne reste que l'analyse d'un binaire, qui est une opération de phase 1.4, pas de phase 1.3. | `LOT-B`, question prioritaire 3. |
| O-4 | **Le mode d'approvisionnement réel d'Indicata et d'AutoUncle : accord ou crawl ?** | Un élément documentaire secondaire penche vers la collecte web pour Indicata, mais aucune source primaire n'a été lue, et les offres d'emploi visées par le mandat sont inatteignables par recherche indexée : le vocabulaire « data engineer + scraping » est intégralement capté par les vendeurs de scraping. **Vocabulaire à ne pas reprendre.** Voie de contournement pour 1.4 : les pages `/company/`, `/about/`, `/legal/` de ces acteurs, et leurs mentions légales. | `LOT-P`, question prioritaire 1 ; `LOT-N` pour AutoUncle. |
| O-5 | **L'existence d'un `llms.txt` ou d'un canal agentique AS24.** | Sa vérification exige une requête sur un chemin **hors des 17 préfixes autorisés** : structurellement interdit à tout agent de ce plan, et pas seulement à moi. Reste en `ACTIONS-COMMANDITAIRE` : seul le commanditaire peut consulter la racine du site depuis son navigateur. | `ACTIONS-COMMANDITAIRE`. |
| O-6 | **La représentativité de l'échantillon de 20 annonces par modèle.** | Ce n'est pas une lacune d'inventaire mais **le verrou du produit**, et sa résolution est une mesure, pas une recherche. Elle exige d'exécuter des requêtes sur la surface autorisée et de les comparer à une population de référence — c'est-à-dire `LOT-A` croisé avec `LOT-Q` et `LOT-I`. | `LOT-A` q1, `LOT-Q`, `LOT-I` q3. |

**Ce que je n'ai pas exploré et que j'assume de ne pas avoir exploré** : les canaux non publics
(forums privés de scraping, marchés gris de données, contacts directs avec des employés), qui
sortiraient du mandat et des règles R2/R3 ; et les langues autres que le français, l'anglais,
l'allemand et le néerlandais — un candidat de niche existant uniquement en italien, espagnol ou
polonais aurait échappé aux trois passes. Le risque résiduel est réel mais faible : les trois passes
ont couvert les quatre langues des marchés de l'hypothèse H1.

**Conclusion de saturation** : le registre est gelé à 92 candidats. Les découvertes marginales encore
possibles sont, par nature, des **variantes** de mécaniques déjà inventoriées, ou des **noms
d'acteurs** dans des familles déjà ouvertes — deux catégories dont la phase 1.4 se saisira mieux que
ne le ferait une quatrième passe de complétude, parce qu'elle les rencontrera en instruisant les
sources plutôt qu'en les cherchant à l'aveugle. **Le point de contrôle G1 est satisfait** : plus de
20 candidats, lots constitués, saturation déclarée et argumentée.

---

# ACTIONS-COMMANDITAIRE — consolidé et gelé

Reprend les tableaux de v1 et v2, en ajoute les actions issues de cette passe, et **retire** ce qui
n'est plus nécessaire. Aucune de ces actions n'a été exécutée : elles exigent toutes soit un compte,
soit un credential, soit une qualité juridique, soit une requête hors surface autorisée (R2).

| Candidat / objet | Action requise du commanditaire | Urgence pour 1.4 |
|---|---|---|
| `C-66`, `O-5` | **Ouvrir un navigateur sur `autoscout24.be`** et (a) journaliser les appels XHR selon le protocole que produira `LOT-C`, (b) vérifier l'existence de `/llms.txt`. Nous ne pouvons pas le faire : ces chemins sont hors des 17 préfixes autorisés. | **Haute** — débloque `C-06` à `C-13` et clôt `O-5`. |
| `C-16` | Fournir un appareil Android pour l'interception TLS (mitmproxy + `apk-mitm`), si l'analyse statique de `LOT-B` ne livre pas l'hôte mobile. | Moyenne — conditionnelle au résultat de `LOT-B`. |
| `C-22` à `C-32`, `C-36` | Ouvrir les comptes free-tier des fournisseurs de scraping (essais sans carte chez ScrapingBee, Piloterr, Scrapfly). Sans compte, `LOT-F` et `LOT-G` restent documentaires. | Moyenne. |
| `C-01`, `C-48` | Prise de contact commerciale : `searchapi@autoscout24.com`, +49 89 44456-1000. Demander une grille tarifaire écrite et le périmètre BE. | **Haute** — c'est la seule voie qui règle A8, A11 et A12 d'un coup. |
| `C-02`, `C-05`, `C-19`, `C-49`, `C-85` | Statut concessionnaire ou partenaire technique AS24, ou mise en relation avec un concessionnaire client consentant. Ouvre `HändlerIQ`, la spec de feed et le portail partenaire. | Moyenne. |
| `C-86` | **Prise de contact avec Autralis, Stockway ou CPS Autosoft** : « acceptez-vous d'ajouter une destination de flux pour un garage client consentant ? » Question commerciale, pas technique — seul le commanditaire peut la poser. | **Haute** — `C-86` est le candidat au risque juridique le plus faible du registre. |
| `C-38` | Compte Kaggle pour le téléchargement des datasets. | Basse. |
| `C-42` | Demande de `seller-key` / `site-key` Search API mobile.de. | **Haute** — la seule API de recherche officielle et documentée du marché. |
| `C-56`, `C-57`, `C-75`, `C-41` | Demandes de devis JD Power/Autovista, INDICATA, Autotelex, RDC, JATO, Datatorq — périmètre Benelux, prix ramené à € / 1 000 annonces (R5). | Moyenne. |
| `C-60` | Compte AutoScout24 pour créer les recherches sauvegardées et observer le format des alertes. | Basse. |
| `C-67` | **Uniquement si un rattachement académique existe** : convention FDZ Ruhr (`fdz@rwi-essen.de`). À ne pas traiter comme un prérequis — `VERIF-C67-fdz.md` établit que le produit ne doit pas en dépendre. Question à poser dans le même courrier : une version couvrant la **Belgique** est-elle datée ? | Basse. |
| `C-68`, `C-69`, `C-80`, `C-87` | Contacts commerciaux AutoUncle B2B, theparking.eu, OPENLANE, AUTO1 — avec la question de la couverture belge posée d'emblée. | Moyenne. |
| `C-71`, `C-72` | Compte gratuit urlscan.io (quota de recherche par clé) et compte Google Cloud (palier BigQuery gratuit). | Moyenne — `LOT-J` peut démarrer sans, en anonyme. |
| `C-73` | Inscription éditeur Awin / Daisycon / TradeTracker pour constater l'existence d'un datafeed AS24. | Basse. |
| `C-79`, `C-90` | Demande de données agrégées à Car-Pass et à GOCA (structures de mission légale : une demande motivée peut aboutir sans contrat). | Moyenne. |
| `C-81`, `O-2` | Si `LOT-K` ne trouve pas le texte belge sous `/fr/entreprise/` : fournir le texte des conditions professionnelles **et consommateur** AS24 pour la Belgique, que le commanditaire peut consulter sans que nous requêtions le site. | **Haute** — détermine l'axe A11 de tout le rapport. |
| `C-89` | Adhésion Mobility Data Space, **seulement si** `LOT-P` prouve qu'un jeu d'annonces VO y est publié. | Basse, conditionnelle. |

---

# Journal des requêtes de cette phase (quota 12/12)

| # | Requête | Résultat |
|---|---|---|
| 1 | `WebSearch` — `AutoScout24 "Allgemeine Geschäftsbedingungen" Händler Datenzugang "Weitergabe" Daten an Dritte gewerbliche Nutzer P2B Verordnung` | **FÉCOND.** Localise les `Händler-AGB` publiques sur `.de`, le PDF `gebrauchtwagen.at`, et l'AGB B2B `.ch`. Confirme l'existence d'un système de réclamation P2B art. 11. |
| 2 | `WebSearch` — `"powered by AutoScout24" white label used car search widget third party site licensed listings syndication partner` | **STÉRILE.** Aucun programme de syndication white-label AS24. Ne renvoie que des clones commerciaux, des plugins WordPress tiers et des scrapers déjà répertoriés. Seul apport : les plugins de sites de garages → `C-92`. **Angle clos, ne pas refaire.** |
| 3 | `WebFetch` — `https://www.autoscout24.de/unternehmen/haendler-agb/` | **FÉCOND, trouvaille juridique de la phase.** § 3.3 (interdiction verbatim de l'interrogation automatisée), § 17.2 (« technische Schnittstelle », données agrégées sur paquets), § 19.3 (transmission à des tiers, aucun tiers nommé) → `G2-K7`, `G2-K8`, `C-85`. |
| 4 | `curl` — `api.github.com/orgs/autoscout24/repos?per_page=100` | **STÉRILE au fond, concluant sur la forme.** 4 dépôts publics seulement → `G2-K9`. |
| 5-7 | `curl` — `api.github.com/orgs/AutoScout24`, `registry.npmjs.org/-/v1/search?text=scope:autoscout24`, `…?text=autoscout24` | **PARTIELLEMENT FÉCOND.** Org vérifiée, 4 dépôts, 0 gist ; scope `@autoscout24` réel (`custom-events`, `toguru-client`) ; paquets AS24 non scopés (`showcar-*`, `as24-autocomplete`, `carbon-core`) ; découverte de `n8n-nodes-autoscout24-cars-scraper` → `C-88`, `C-91`, `G2-K9`, `G2-K12`. |
| 8-9 | `curl` — arbre du dépôt `as24-hiring-ai-node-js-car-listing`, `registry.npmjs.org/n8n-nodes-autoscout24-cars-scraper` | Arbre non renvoyé (branche par défaut non résolue) — à reprendre en `LOT-B`. Le nœud n8n est une façade de l'acteur Apify `bovi` → `C-91` écarté. |
| 10 | `WebSearch` — `INDICATA OR AutoUncle job vacancy "data engineer" crawler scraping … conference talk` | **STÉRILE sur les offres d'emploi, PARTIELLEMENT FÉCOND sur le fond.** Le vocabulaire « data engineer + scraping » est intégralement capté par les vendeurs de scraping (ScraperAPI, Apify, Scrapfly, Firecrawl, ziprecruiter) : **ne pas refaire avec ce vocabulaire**. Seul apport : Indicata décrite comme collectant « from OEM websites, classifieds, dealer and retailer websites » → `G2-K10`. |
| 11 | `WebSearch` — `"licensed data from AutoScout24" OR "AutoScout24 als Datenlieferant" market data provider resells listing data OEM Marktbeobachtung` | **FÉCOND — trouvaille de chaîne de valeur de la phase.** Révèle le programme d'intégration AS24 → dix plus grands *data service providers*, `HändlerIQ`, données de performance temps réel → `C-85`. Révèle aussi la page produit `brightdata.com/products/datasets/autoscout24` → `G2-K11`. |
| 12 | `WebFetch` — article AIM Group du 24/06/2025 | **HTTP 403.** Les noms des dix prestataires restent inconnus → point ouvert `O-1`, transféré à `LOT-L`. |

**Aucune requête émise vers `www.autoscout24.be` ni `www.autoscout24.com`.** La requête n° 3 visait
`www.autoscout24.de`, hors des deux domaines interdits, sur une page de conditions générales, et au
titre exprès du mandat (« sur tous les TLD »). Aucune extraction de masse : chaque appel est unitaire.

---

# Traçabilité du gel

| Source | Apport au registre gelé | Statut |
|---|---|---|
| `candidates-v1.md` | `C-01` … `C-66`, familles 1 à 14 | conservé, non écrasé |
| `candidates-v2.md` | `C-67` … `C-84`, familles 15 à 17, journal de 18 angles | conservé, non écrasé |
| `FINDING-allowed-surface.md` | 17 préfixes autorisés, `C-14` partiellement prouvé, points ouverts P1–P6 | intégré (`LOT-A`, `G2-K13`) |
| `VERIF-C67-fdz.md` | Périmètre de `C-67` infirmé, reclassement en instrument de validation | intégré (statut à périmètre restreint, `LOT-I`) |
| `AS24-REFERENCE-API.md` | `/makes` et `/references` sans authentification, spec OpenAPI 122 schémas | intégré (`C-02` partiellement acquis, `LOT-A`) |
| `00-CONTEXT.md` | H1–H5, R3 RGPD, gradient de risque | intégré ; hypothèse juridique **confirmée** par `G2-K8` |
| Cette phase | `C-85` … `C-92`, famille 18, corrections `G2-K7` … `G2-K13`, 17 lots | **registre gelé** |
