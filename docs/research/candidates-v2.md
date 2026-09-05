# candidates-v2.md — Revue de complétude no 1 (phase 1.2, agent `gap-review-1`)

**Nature du document** : complément adverse à `candidates-v1.md`, qui n'est **pas écrasé**.
v1 reste le registre de référence pour `C-01`…`C-66`. Ce document ajoute `C-67`…`C-84`,
porte des corrections factuelles à v1, et journalise les angles explorés — y compris les stériles.

**Posture** : aucune notation, aucun classement, aucun écartement (règle S4 de la phase 1.1
reconduite). La question directrice était : *quelle voie un ingénieur compétent, ou un concurrent
déjà en production, aurait-il trouvée que v1 ignore ?*

**Respect des contraintes** :
- Aucun compte créé, aucun credential saisi (R2). Les options qui l'exigent sont listées en fin de document.
- **Zéro requête** vers `www.autoscout24.be` ou `www.autoscout24.com`, y compris sur les 17 préfixes
  autorisés : aucune sonde n'était nécessaire pour ce mandat, qui porte sur les tiers.
- 4 requêtes de reconnaissance vers des tiers (quota de 10), toutes unitaires — journal ci-dessous.
  Le reste du travail est de la recherche indexée (WebSearch), en français, anglais, allemand et néerlandais.

---

## Verdict sur la complétude de v1

**Verdict : lacunaire — mais lacunaire d'une manière très asymétrique.**

v1 est **saturé sur l'axe technique** : familles 2, 5, 6, 7 (endpoints internes, scraping managé,
navigateurs pilotés, unblocking). Sur ces quatre familles, les recherches indépendantes menées ici
n'ont produit **aucun** fournisseur, technique ou endpoint que v1 ne nomme pas déjà. Sur ce terrain,
v1 est effectivement exhaustif et il faut le dire.

v1 est en revanche **lacunaire sur trois axes entiers**, et ces lacunes ne sont pas des oublis de
détail : ce sont des familles absentes de la taxonomie.

1. **L'axe institutionnel.** v1 ne connaît qu'un rapport de force binaire avec AutoScout24 : soit on
   extrait sans autorisation, soit on achète un contrat commercial (C-01, C-48, C-49). Il ignore
   qu'AutoScout24 a **institutionnalisé un troisième canal le 9 octobre 2025** : une *Datenpartnerschaft*
   avec le RWI-Leibniz-Institut, qui met ses données d'annonces à disposition de la recherche via le
   Forschungsdatenzentrum Ruhr, sous forme de **Scientific Use File avec DOI**
   (`10.7807/as24:carmkt:suf:v2`). Un fichier d'annonces au niveau ligne, légal, citable, gratuit pour
   une institution scientifique. C'est la lacune la plus grave de v1, parce que c'est la seule voie
   trouvée qui soit à la fois **licite, au niveau annonce et non hostile**. → `C-67`, famille 15 (nouvelle).
2. **L'axe des données publiques du véhicule.** v1 n'ouvre à aucun moment la question « quelles
   données officielles existent, gratuites, sans AS24 ? ». Aucune mention de Statbel/DIV, du RDW
   néerlandais (registre complet en open data, y compris les relevés de compteur), ni de Car-Pass —
   qui enregistre près de 23 millions de relevés kilométriques par an et 855 169 documents en 2025
   pour le seul marché belge. Ces sources ne donnent pas les prix demandés, mais elles donnent la
   **population de référence** (parc, mutations, âge, kilométrage réels) qui permet de mesurer le
   biais d'un échantillon AS24 — exactement le point ouvert P2 de `FINDING-allowed-surface.md`.
   → `C-77`, `C-78`, `C-79`, famille 16 (nouvelle).
3. **L'axe réglementaire comme levier documentaire.** v1 traite le droit uniquement comme un risque
   (axe A11), jamais comme un **outil d'énumération**. L'article 9 du règlement P2B (UE) 2019/1150
   oblige AutoScout24 à décrire, dans ses conditions professionnelles, l'accès technique et
   contractuel de ses vendeurs pro à leurs données, ainsi que ses transmissions de données à des
   tiers. Ce texte est la liste officielle, opposable, des canaux de sortie de données qui existent —
   écrite par AS24 lui-même. → `C-81`, famille 17 (nouvelle).

À quoi s'ajoutent des **oublis d'acteurs** difficilement défendables dans un inventaire qui se veut
exhaustif : v1 ne mentionne **pas une seule fois AutoUncle**, alors que c'est le premier
méta-agrégateur d'annonces européen (8,6 à 11 millions d'annonces, 2 600 sources, 14 pays) et qu'il
**vend une API** de valorisation et de données de marché. v1 nomme theparking.eu (C-45) mais ignore
que theparking.eu publie une page « API ». v1 nomme dix scrapers open source (C-64) mais ignore le
seul projet trouvé qui tourne **en production** avec 730 000 annonces, un rafraîchissement
hebdomadaire par GitHub Actions et une API hébergée.

Enfin, deux voies techniques classiques manquent : les **archives de DOM tierces** au-delà de Wayback
et Common Crawl (urlscan.io, HTTP Archive dans BigQuery, qui stockent des corps de réponse) et
l'**énumération d'hôtes par les logs de transparence de certificats** — méthode d'autant plus
pertinente que `AS24-REFERENCE-API.md` prouve qu'au moins un hôte AS24 sert de la donnée **sans
authentification** (`listing-creation.api.autoscout24.com`). S'il en existe un, la question « combien
d'autres ? » se pose, et v1 ne la pose pas : ses candidats C-06 à C-13 sont tous dérivés du
`robots.txt` du front, donc bornés par ce que le front expose.

**Total après cette revue : 84 candidats, `C-01` à `C-84`, 17 familles.**

---

## Candidats ajoutés

## Famille 15 — Partenariats institutionnels de données et centres de données de recherche *(nouvelle)*

### C-67 — FDZ Ruhr / RWI : Scientific Use File `RWI-GEO-CARMKT` d'annonces AutoScout24 `[AJOUT G1]`
- **Famille** : 15 — Partenariats institutionnels de données (nouvelle)
- **Mécanique** : le 9 octobre 2025, AutoScout24 et le RWI-Leibniz-Institut für Wirtschaftsforschung ont annoncé une *Datenpartnerschaft* : le Forschungsdatenzentrum Ruhr (FDZ Ruhr) diffuse désormais les **données d'annonces** d'AS24 (prix, équipement, kilométrage, information régionale fine) pour usage scientifique. Le jeu s'appelle `RWI-GEO-CARMKT` ; V1 couvre l'Allemagne 01/2024–06/2024, V2 l'Allemagne 01/2019–12/2024. Accès par **Scientific Use File** (données de fait anonymisées, exploitées dans l'institution) ou par séjour de chercheur invité, sur convention d'utilisation signée, pour la seule recherche scientifique. Le communiqué cite explicitement les autres marchés d'AS24 — **dont la Belgique** — comme périmètre de la partenariat.
- **Point d'entrée connu** : DOI V2 `http://doi.org/10.7807/as24:carmkt:suf:v2` ; description de données `https://hdl.handle.net/10419/334903` ; formulaire `https://www.rwi-essen.de/en/research-advice/further/research-data-center-ruhr-fdz/data-request` ; contact `fdz@rwi-essen.de`, Dr. Philipp Breidenbach ; code d'exploitation `https://github.com/PThie/RWI-GEO-AS24`
- **Questions falsifiables à tester en 1.4** :
  - « Le SUF contient les annonces **au niveau ligne** (une observation = une annonce) et non des agrégats. »
  - « Une version couvrant la **Belgique** existe, ou est annoncée avec une échéance. » (V1/V2 sont DE seulement — probablement fausse aujourd'hui)
  - « L'accès est ouvert à une entité non universitaire, ou exige une affiliation à un établissement scientifique. » (probablement l'affiliation → `ACTIONS-COMMANDITAIRE`)
  - « La convention d'utilisation autorise l'exploitation dans une application, ou la restreint à la publication scientifique. » (question dimensionnante pour KYCAR)
  - « Le dépôt `PThie/RWI-GEO-AS24` publie la liste des variables, donc le dictionnaire de champs, sans convention. »
- **Sources** : https://www.rwi-essen.de/presse/wissenschaftskommunikation/pressemitteilungen/detail/autoscout24-und-rwi-starten-datenpartnerschaft-neue-marktdaten-ermoeglichen-forschenden-tiefere-einblicke-in-die-transformation-der-mobilitaet ; https://www.rwi-essen.de/en/research-advice/further/research-data-center-ruhr-fdz/data-sets ; https://www.rwi-essen.de/en/publications/policy-advisory/project-reports/detail/fdz-data-description-data-on-the-used-7783 ; https://github.com/PThie/RWI-GEO-AS24 ; https://www.konsortswd.de/en/services/research/all-datacentres/fdz-ruhr/

## Famille 16 — Données publiques officielles du véhicule *(nouvelle)*

### C-77 — Statbel / DIV / SPF Mobilité : immatriculations et parc de véhicules belges en open data `[AJOUT G1]`
- **Famille** : 16 — Données publiques officielles du véhicule (nouvelle)
- **Mécanique** : Statbel produit ses statistiques véhicules à partir des données de la **DIV** (Direction pour l'Immatriculation des Véhicules, SPF Mobilité et Transports) : immatriculations de voitures **neuves et d'occasion** par région et par mois, et parc de véhicules ventilé (segment, carburant, âge, marque). Le SPF Mobilité publie en outre ses propres fichiers open data d'immatriculations. Ces données ne portent **aucun prix**, mais elles donnent la population réelle du marché belge : c'est la seule référence externe permettant de mesurer le **biais** d'un échantillon d'annonces (point ouvert P2 de `FINDING-allowed-surface.md`) et de pondérer les agrégats de KYCAR mode 1.
- **Point d'entrée connu** : `https://statbel.fgov.be/fr/themes/mobilite/circulation/parc-de-vehicules` ; `https://statbel.fgov.be/en/themes/mobility/traffic/registration-motor-vehicles` ; `https://mobilit.belgium.be/fr/documents/open-data/transport-routier/immatriculations-des-vehicules` ; `https://data.gov.be/fr/organisations/statbel` ; statistiques sectorielles `https://www.febiac.be/fr/statistiques` ; `https://www.iweps.be/indicateur-statistique/parc-automobile-immatriculations/`
- **Questions falsifiables à tester en 1.4** :
  - « La ventilation descend au niveau **marque, et modèle**, et pas seulement segment/carburant. » (marque documentée, modèle à prouver)
  - « Les mutations (immatriculations d'occasion) sont publiées à une maille mensuelle exploitable comme dénominateur de marché. »
  - « Les fichiers sont téléchargeables sans compte, en format machine (CSV/XLSX/API) et non en PDF. »
  - « Le périmètre distingue véhicules de particuliers et de sociétés, ce qui conditionne la comparabilité avec l'offre AS24. »
- **Sources** : https://statbel.fgov.be/fr/themes/mobilite/circulation/parc-de-vehicules ; https://statbel.fgov.be/en/themes/mobility/traffic/registration-motor-vehicles ; https://mobilit.belgium.be/fr/documents/open-data/transport-routier/immatriculations-des-vehicules ; https://data.gov.be/fr/organisations/statbel ; https://www.febiac.be/fr/statistiques ; https://www.iweps.be/indicateur-statistique/parc-automobile-immatriculations/

### C-78 — RDW open data (Pays-Bas) : registre complet des véhicules, API Socrata, relevés de compteur `[AJOUT G1]`
- **Famille** : 16 — Données publiques officielles du véhicule (nouvelle)
- **Mécanique** : le RDW néerlandais publie en **open data intégral et gratuit** l'ensemble des véhicules immatriculés aux Pays-Bas — caractéristiques techniques, carburant, dates, carrosserie — ainsi que des jeux relatifs aux **relevés kilométriques** (`tellerstanden`, `tellerstandoordeel`), servis par un portail Socrata avec API JSON et filtres. Pour un modèle de données multi-pays (H1 : BE/FR/DE/LU/NL), c'est un référentiel technique gratuit et une **distribution réelle de kilométrage par âge** : la variable la plus lourde à obtenir chez AS24, disponible ici sans anti-bot, sans quota et sans exposition juridique.
- **Point d'entrée connu** : `https://opendata.rdw.nl/` ; `https://www.rdw.nl/over-rdw/dienstverlening/open-data` ; jeu compteur `https://opendata.rdw.nl/Voertuigen/Open-Data-RDW-Tellerstandoordeel-Trend-Toelichting/jqs4-4kvw/data`
- **Questions falsifiables à tester en 1.4** :
  - « Les jeux véhicules sont interrogeables par API (SoQL/Socrata) sans clé, avec une pagination utilisable. »
  - « Un jeu porte les **relevés de compteur** au niveau véhicule, ou seulement un jugement agrégé de tendance. »
  - « La granularité marque/modèle/variante est réconciliable avec la taxonomie AS24 de `data/reference/taxonomy.json`. »
  - « Aucun équivalent belge n'existe au niveau véhicule (la DIV ne publie qu'agrégé). » (probablement vraie, RGPD)
- **Sources** : https://opendata.rdw.nl/ ; https://www.rdw.nl/over-rdw/dienstverlening/open-data ; https://opendata.rdw.nl/Voertuigen/Open-Data-RDW-Tellerstandoordeel-Trend-Toelichting/jqs4-4kvw/data ; https://en.wikipedia.org/wiki/RDW_(organization)

### C-79 — Car-Pass (Belgique) : base légale des kilométrages et statistiques du marché de l'occasion `[AJOUT G1]`
- **Famille** : 16 — Données publiques officielles du véhicule (nouvelle)
- **Mécanique** : Car-Pass détient, par obligation légale belge, l'historique kilométrique de tout véhicule d'occasion vendu en Belgique : garages, carrossiers, centres de contrôle technique et services pneus sont **tenus** de transmettre le relevé. Volumétrie 2025 : **855 169 documents Car-Pass délivrés** (donc ≈ le nombre de transactions d'occasion du pays) et **près de 23 millions de relevés traités**, dont plus de 20 % remontés automatiquement par des véhicules connectés. Car-Pass publie un bilan annuel chiffré (âge moyen 9,8 ans, 107 127 km en moyenne, 1 466 fraudes confirmées en 2025). Deux usages : vérité de terrain pour calibrer les distributions km/âge de KYCAR, et canal de demande de données agrégées auprès d'une structure de mission légale.
- **Point d'entrée connu** : `https://www.car-pass.be/` ; historique compteur `https://www.car-pass.be/en/private-individuals/i-want-to-buy-a-used-vehicle/what-is-on-the-car-pass-and-what-should-you-pay-attention-to/odometer-history` ; reprise presse du bilan `https://www.auto55.be/nieuws/35491-oudere-autos-en-fraude-tot-370000-km-dit-was-de-tweedehandsmarkt-in-2025`
- **Questions falsifiables à tester en 1.4** :
  - « Car-Pass publie ou peut fournir des **distributions** (km par âge, par marque) et pas seulement des moyennes nationales. »
  - « Le nombre de Car-Pass délivrés est un dénominateur valide du marché de l'occasion BE, comparable au flux d'annonces AS24. »
  - « Un accès données existe pour un tiers non professionnel de l'automobile. » (probablement non → `ACTIONS-COMMANDITAIRE`)
  - « Les données Car-Pass sont accessibles par VIN sans compte professionnel. » (probablement fausse, et hors périmètre RGPD de KYCAR)
- **Sources** : https://www.car-pass.be/ ; https://www.car-pass.be/en/private-individuals/i-want-to-buy-a-used-vehicle/what-is-on-the-car-pass-and-what-should-you-pay-attention-to/odometer-history ; https://www.auto55.be/nieuws/35491-oudere-autos-en-fraude-tot-370000-km-dit-was-de-tweedehandsmarkt-in-2025

## Famille 17 — Leviers réglementaires d'accès aux données *(nouvelle)*

### C-81 — Article 9 du règlement P2B : les CGU professionnelles comme inventaire officiel des canaux de données `[AJOUT G1]`
- **Famille** : 17 — Leviers réglementaires d'accès (nouvelle)
- **Mécanique** : le règlement (UE) 2019/1150 (P2B) impose à tout service d'intermédiation en ligne d'inclure **dans ses conditions générales** « une description de l'accès technique et contractuel, ou de son absence » des utilisateurs professionnels aux données fournies ou générées par le service, ainsi que la mention des transmissions de données à des tiers. Conséquence opérationnelle : les CGU professionnelles d'AutoScout24 contiennent, par obligation légale, la **liste opposable des canaux d'accès aux données** offerts aux vendeurs pro — c'est-à-dire la réponse officielle aux questions ouvertes de C-01, C-05, C-19 et C-49, sans avoir à passer par un commercial. Levier documentaire, pas technique : coût nul, aucune requête, aucune exposition. Compléments du même ordre : DSA art. 24(2) (publication obligatoire du nombre d'utilisateurs actifs mensuels, utile au dimensionnement) et DSA art. 40 (accès chercheur — **réservé aux VLOP/VLOSE** : AutoScout24 n'est pas désigné, donc levier inopérant ici, ce qui doit être écrit noir sur blanc pour ne pas être re-exploré).
- **Point d'entrée connu** : texte `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex:32019R1150` (art. 9) ; commentaire `https://www.cms-digitallaws.com/en/p2b/` ; CGU professionnelles AS24 à localiser (espace `/professional/`, contrats concessionnaires nationaux)
- **Questions falsifiables à tester en 1.4** :
  - « Les CGU professionnelles AS24 pour la Belgique sont publiquement accessibles sans compte. »
  - « Elles décrivent nommément au moins un canal d'export de données (API, feed, CSV) offert au vendeur professionnel. »
  - « Elles mentionnent une transmission de données à des tiers, ce qui nommerait des revendeurs de données AS24 existants. » (piste directe pour la chaîne de valeur en phase 1.3)
  - « AutoScout24 n'est pas désigné VLOP au titre du DSA, donc l'art. 40 n'ouvre aucun droit d'accès. » (probablement vraie — à confirmer sur la liste de la Commission)
- **Sources** : https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex:32019R1150 ; https://service.betterregulation.com/document/395813 ; https://www.cms-digitallaws.com/en/p2b/ ; https://www.hoganlovells.com/en/publications/who-gets-to-see-inside-the-eus-new-rules-on-data-access-under-article-40-of-the-dsa

## Ajouts rattachés aux familles existantes

### C-68 — AutoUncle : méta-agrégateur européen et son API commerciale de données de marché `[AJOUT G1]`
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : AutoUncle agrège depuis 2010 les annonces de **2 600 sources dans 14 pays européens** (8,6 à 11 millions d'annonces vivantes), AutoScout24 inclus, et en tire un moteur de valorisation. Il **vend** cet actif : une *Automotive API* de prix temps réel, reprises et valeurs résiduelles, et une offre entreprise « market insights » (demande, tendances, évolution des prix, panorama concurrentiel). C'est le cas d'espèce du raisonnement de chaîne de valeur : un tiers a déjà payé le coût d'agrégation et le revend sous contrat, ce qui déplace le problème de « comment extraire » vers « combien coûte l'accès ». **Réserve majeure** : la liste des 14 pays couverts ne comprend pas la Belgique (DE, AT, DK, IT, ES, PL, PT, SE, FI, RO, UK, NL, CH, FR), la BE étant présentée comme un marché d'expansion.
- **Point d'entrée connu** : `https://b2b.autouncle.com/en-gb/automotive-api` ; `https://b2b.autouncle.com/en-gb/autouncle-enterprise` ; site public `https://www.autouncle.com/` ; façades tierces `https://apify.com/lofomachines/autouncle-scraper/api`, `https://www.carapis.com/platforms/western-europe/autouncle`
- **Questions falsifiables à tester en 1.4** :
  - « L'API AutoUncle sert des **annonces** (objets individuels) ou seulement des **valorisations** agrégées. » (question dimensionnante)
  - « La Belgique est adressable, ou reste hors couverture. » (probablement hors couverture)
  - « Une grille tarifaire est obtenable sans NDA, et exprimable en € / 1 000 annonces (R5). »
  - « Les annonces exposées conservent la traçabilité de la source (AS24 vs autre portail), ce qui conditionne la comparabilité avec le périmètre AS24. »
- **Sources** : https://b2b.autouncle.com/en-gb/automotive-api ; https://b2b.autouncle.com/en-gb/autouncle-enterprise ; https://www.autouncle.com/ ; https://apify.com/lofomachines/autouncle-scraper/api ; https://www.carapis.com/platforms/western-europe/autouncle

### C-69 — API annoncée par theparking.eu `[AJOUT G1]`
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : au-delà du scraping de ses pages (déjà couvert par C-45), theparking.eu publie une page « api used » dédiée : l'agrégateur propose donc un **canal contractuel** sur son propre inventaire, qui inclut des pages par source dont `www.autoscout24.be`. L'intérêt est le même que C-68, mais avec un acteur dont v1 a déjà établi qu'il republie explicitement AS24 source par source. Son modèle d'entrée d'annonces est déclaratif (« 24 h après dépôt sur un site partenaire »), ce qui pose directement la question de la complétude de son miroir AS24.
- **Point d'entrée connu** : `https://www.theparking.eu/used-cars/api.html` — **sonde exécutée le 2026-09-06 : HTTP 403** sur un fetch non navigateur ; `https://www.theparking.eu/faq.html`
- **Questions falsifiables à tester en 1.4** :
  - « La page API décrit une API de **lecture d'annonces** et non un service de dépôt d'annonces destiné aux portails partenaires. »
  - « L'accès est self-service ou contractuel, et à quel prix. »
  - « Le 403 observé est un filtrage d'agent utilisateur, et non un blocage géographique ou un anti-bot complet. » (le 403 **contredit déjà partiellement** la 2ᵉ question falsifiable de C-45 : voir corrections)
- **Sources** : https://www.theparking.eu/used-cars/api.html (403 relevé) ; https://www.theparking.eu/faq.html ; https://www.theparking.eu/

### C-70 — `qwillemse/autoscout-analyser` : pipeline AS24 en production, MIT, avec API hébergée `[AJOUT G1]`
- **Famille** : 14 — Autres
- **Mécanique** : projet MIT qui fait déjà ce que KYCAR doit faire, et qui tourne. Son `scraper.py` « parcourt le JSON `__NEXT_DATA__` d'AutoScout24 par produit cartésien marques × bande d'années × pays », le **découpage par bande d'années servant explicitement à franchir le plafond de 4 000 annonces par recherche** ; les données s'accumulent dans un SQLite `cars.db` reconstruit **chaque semaine par GitHub Actions** ; un modèle XGBoost est entraîné sur **plus de 730 000 annonces** ; une API FastAPI déployée sur Railway sert les prédictions à une extension Chrome publiée sur le Chrome Web Store ; la normalisation multilingue carburant/transmission couvre NL/DE/FR/IT/ES. Trois apports distincts de C-64 (parseurs dormants) : la preuve qu'une méthode fonctionne **aujourd'hui à l'échelle**, un chiffre de plafond corroboré par une source d'implémentation indépendante, et une **API tierce déjà en ligne** potentiellement interrogeable.
- **Point d'entrée connu** : `https://github.com/qwillemse/autoscout-analyser` ; API FastAPI déployée sur Railway (URL à relever dans le dépôt) ; extension publiée sur le Chrome Web Store
- **Questions falsifiables à tester en 1.4** :
  - « Le plafond de 4 000 annonces par recherche est bien la valeur réelle, et le découpage par bande d'années le contourne effectivement. » (tranche la zone d'incertitude no 1 de v1)
  - « Le dépôt tourne encore : dernier run GitHub Actions vert de moins de 30 jours. »
  - « Le projet n'utilise ni proxy, ni service d'unblocking — ce qui prouverait qu'Akamai ne bloque pas ce chemin d'accès. » (question la plus précieuse du candidat)
  - « L'API Railway expose un endpoint de lecture des annonces stockées, et pas seulement la prédiction de prix. »
  - « Le `cars.db` est publié en artefact téléchargeable, donc constitue un dataset gratuit prêt à l'emploi. »
- **Sources** : https://github.com/qwillemse/autoscout-analyser

### C-71 — urlscan.io : instantanés de DOM déjà collectés sur des URL AutoScout24 `[AJOUT G1]`
- **Famille** : 12 — Caches et archives tiers
- **Mécanique** : urlscan.io conserve, pour chaque scan public, le **DOM complet** de la page (`https://urlscan.io/dom/<uuid>/`), les variables JavaScript globales et les requêtes réseau observées, et expose une API de recherche sur plus de 800 millions de scans historiques (par domaine, IP, ASN, hash). AS24 étant un domaine massivement scanné, il existe très probablement un stock d'instantanés de pages d'annonces et de recherche — donc de `__NEXT_DATA__` — récupérables **sans jamais requêter AS24**, sans subir Akamai et sans contrevenir à son `robots.txt`. Complète Wayback (C-53) et Common Crawl (C-54) par une source qu'aucun des deux n'offre : le DOM **après** exécution du JavaScript.
- **Point d'entrée connu** : `https://urlscan.io/docs/search/` (API de recherche) ; `https://urlscan.io/docs/api/` ; endpoint DOM `https://urlscan.io/dom/$uuid/` ; quotas gratuits documentés (5 000 scans publics, 1 000 recherches)
- **Questions falsifiables à tester en 1.4** :
  - « Une recherche `page.domain:autoscout24.be` renvoie des scans de pages **d'annonces** ou de recherche, pas seulement de la page d'accueil. »
  - « Le DOM stocké contient le bloc `__NEXT_DATA__` intégral et non tronqué. »
  - « La recherche est utilisable sans clé (quota anonyme) ou exige un compte gratuit. » (compte → `ACTIONS-COMMANDITAIRE`)
  - « La profondeur historique permet de reconstruire une série temporelle de prix, ce qu'aucune autre voie gratuite n'offre. »
  - « Soumettre soi-même des URL AS24 au scanner constituerait un contournement du `robots.txt` par tiers interposé. » (question **juridique** à trancher, pas technique — à porter dans A11)
- **Sources** : https://urlscan.io/docs/search/ ; https://urlscan.io/docs/api/ ; https://docs.urlscan.io/ ; https://docs.urlscan.io/apis/urlscan-openapi/scanning

### C-72 — HTTP Archive : corps de réponses HTML dans le jeu public BigQuery `[AJOUT G1]`
- **Famille** : 12 — Caches et archives tiers
- **Mécanique** : HTTP Archive exécute un crawl mensuel de plusieurs millions d'origines et publie l'intégralité des résultats en **jeu public BigQuery**, y compris les tables `*_requests_bodies` qui contiennent les **corps de réponse** (donc le HTML, donc `__NEXT_DATA__`) et les traces d'exécution. Une requête SQL sur les corps de réponse des pages `autoscout24.be` fournit un instantané mensuel gratuit et daté, sans aucune requête vers AS24. Limite structurelle attendue : le crawl porte principalement sur les pages d'accueil et un échantillon de pages secondaires, pas sur l'inventaire — donc utile pour la **structure** (schéma du JSON, évolution du build Next.js, détection de rupture, axe A7) plus que pour le volume.
- **Point d'entrée connu** : `https://httparchive.org/faq` ; jeu `httparchive` sur BigQuery ; guide `https://github.com/HTTPArchive/legacy.httparchive.org/blob/master/docs/bigquery-gettingstarted.md` ; `https://rviscomi.dev/2023/05/querying-parsed-html-in-bigquery/`
- **Questions falsifiables à tester en 1.4** :
  - « Des pages `autoscout24.be` figurent dans le crawl, et lesquelles (accueil seule, ou pages secondaires). »
  - « Les tables de corps de réponse contiennent le HTML complet des pages retenues, `__NEXT_DATA__` inclus. »
  - « Le coût de la requête reste dans le palier gratuit de BigQuery (1 To/mois) — les tables de corps sont volumineuses. » (risque de coût réel, à chiffrer pour A2)
  - « L'historique mensuel permet de dater les changements de structure du front AS24, donc d'alimenter l'axe A7. »
- **Sources** : https://httparchive.org/faq ; https://github.com/HTTPArchive/data-pipeline ; https://github.com/HTTPArchive/legacy.httparchive.org/blob/master/docs/bigquery-gettingstarted.md ; https://rviscomi.dev/2023/05/querying-parsed-html-in-bigquery/

### C-73 — Réseaux d'affiliation : programme partenaire AutoScout24 et flux produits `[AJOUT G1]`
- **Famille** : 4 — Flux partenaires et syndication
- **Mécanique** : AutoScout24 opère un **programme d'affiliation** (identifié chez Awin pour AutoScout24 CH, profil marchand 29043). Or les réseaux d'affiliation — Awin, Daisycon, TradeTracker, Tradedoubler — servent classiquement aux éditeurs affiliés un **flux produits** (datafeed CSV/XML) et des deeplinks, dans le cadre d'un contrat gratuit pour l'affilié. Si un tel flux existe pour une entité AS24, il constitue un accès **contractuellement autorisé** à un extrait d'inventaire, avec pour contrepartie l'envoi de trafic — modèle radicalement différent de tout ce qu'envisage v1. Piste à instruire pour l'entité belge et non seulement suisse.
- **Point d'entrée connu** : `https://ui.awin.com/merchant-profile/29043` (profil AutoScout24 CH) ; réseaux à interroger : `awin.com`, `daisycon.com`, `tradetracker.com`, `tradedoubler.com` ; comparatif de réseaux BE `https://www.varamedia.be/affiliate-marketing-agency/vergelijking-tradetracker-daisycon-awin-en-tradedoubler/`
- **Questions falsifiables à tester en 1.4** :
  - « Un programme d'affiliation AutoScout24 existe pour la **Belgique** et pas seulement pour la Suisse. »
  - « Le programme fournit un **datafeed d'annonces** et pas seulement des bannières et des deeplinks. » (probablement fausse pour une marketplace de véhicules — l'enjeu justifie néanmoins la vérification)
  - « L'inscription affilié est gratuite et n'exige pas un site éditeur qualifié. » (compte → `ACTIONS-COMMANDITAIRE`)
  - « Les conditions du programme autorisent un usage analytique du flux, ou le limitent à l'affichage promotionnel. »
- **Sources** : https://ui.awin.com/merchant-profile/29043 ; https://app.hienergyrocket.com/a/autoscout24-ch ; https://www.varamedia.be/affiliate-marketing-agency/vergelijking-tradetracker-daisycon-awin-en-tradedoubler/

### C-74 — Flux publicitaires véhicules des concessionnaires : Google Vehicle Ads, Meta AIA, plateformes de feed `[AJOUT G1]`
- **Famille** : 4 — Flux partenaires et syndication
- **Mécanique** : pour diffuser des *Vehicle ads*, un concessionnaire doit soumettre à Google Merchant Center un **fichier d'inventaire véhicules** (CSV, XML ou Google Sheets) portant marque, modèle, prix, kilométrage, état, disponibilité — la même donnée que l'annonce AS24. Ces fichiers sont fréquemment hébergés sur une **URL publique** du site du concessionnaire ou de son prestataire de flux, pour que Merchant Center vienne les chercher. Le même mécanisme existe côté Meta (*Automotive Inventory Ads*, catalogue véhicules). Et AutoScout24 est lui-même client d'une plateforme de gestion de flux (Productsup) pour son marketing de performance — preuve que l'inventaire circule déjà sous forme de feed normalisé. La voie consiste à découvrir ces feeds côté concessionnaires plutôt qu'à interroger AS24. **Limite documentée** : les Vehicle ads ne sont ouvertes qu'en AU/CA/JP/US et en bêta ouverte FR/DE/IT/NL/ES/UK — **la Belgique n'est pas listée**, ce qui affaiblit l'angle Google pour le périmètre H1 tout en le maintenant pour NL/FR/DE.
- **Point d'entrée connu** : `https://support.google.com/merchants/answer/11189169` (présentation) ; `https://support.google.com/merchants/answer/15312145` (activation, disponibilité par pays) ; `https://support.google.com/merchants/answer/11544533` (règles) ; `https://www.productsup.com/customers/autoscout24/` ; feeds à découvrir sur les domaines concessionnaires
- **Questions falsifiables à tester en 1.4** :
  - « Une part mesurable des concessionnaires belges expose un feed véhicules sur une URL publique devinable (`/feed`, `/vehicles.xml`, sous-domaine de prestataire). »
  - « Le format Vehicle ads couvre au moins 20 des 40 champs du dictionnaire cible KYCAR. »
  - « L'absence de la Belgique dans les marchés Vehicle ads implique l'absence de feeds côté concessionnaires BE. » (à infirmer — les prestataires produisent souvent le feed avant l'ouverture du marché)
  - « Meta *Automotive Inventory Ads* est disponible en Belgique, ce qui déplacerait l'angle de Google vers Meta. »
- **Sources** : https://support.google.com/merchants/answer/11189169 ; https://support.google.com/merchants/answer/15312145 ; https://support.google.com/merchants/answer/11544533 ; https://www.productsup.com/customers/autoscout24/ ; https://support.buyerbridge.com/knowledge/how-to-setup-google-vehicle-listing-ads

### C-75 — Fournisseurs de données véhicule du Benelux : Autotelex, RDC, JATO Dynamics `[AJOUT G1]`
- **Famille** : 13 — Services de valorisation exposant des données de marché
- **Mécanique** : trois acteurs que v1 ne nomme pas, alors qu'ils occupent précisément la position visée. **Autotelex** (NL) se présente comme leader de la donnée véhicule et exerce **les deux métiers** : il place l'inventaire de ses clients garages sur tous les grands portails, *et* vend de la donnée de marché — il détient donc simultanément le canal d'entrée et l'observation de sortie, et recrute des « analystes marktdata ». **RDC** (NL, plus de 40 ans) fait l'intégration de données automobiles pour la filière. **JATO Dynamics** (UK) vend l'intelligence de marché européenne aux constructeurs et aux réseaux, et — point décisif — publie un **portail développeurs avec une liste d'API**. Ces fournisseurs sont substituables aux annonces AS24 pour les agrégats de KYCAR et adressent nativement le Benelux.
- **Point d'entrée connu** : `https://autotelex.nl/` ; `https://www.rdc.nl/analyse-en-informatie` ; `https://developer.jato.com/apis` ; `https://www.jato.com/our-industries/retail/dealers` ; écosystème NL associé `https://www.marktplaatszakelijk.nl/automotive/alle-mogelijkheden/vms/`, `https://www.dcdw.nl/partners/`, `https://dealeroptic.com/`
- **Questions falsifiables à tester en 1.4** :
  - « Le portail développeurs JATO liste une API d'**offre de marché** (annonces, stocks) et non seulement de spécifications et d'immatriculations. »
  - « Autotelex ou RDC vendent des données de marché **belges**, et à quel prix ramené à € / 1 000 annonces (R5). »
  - « Au moins un des trois expose une documentation d'API lisible sans compte. »
  - « Leurs données d'offre proviennent des portails (dont AS24) — auquel cas leurs conditions répercutent les restrictions d'AS24. » (question juridique dimensionnante)
- **Sources** : https://autotelex.nl/vacatures/automotive-marktdata-analist-nl/ ; https://www.rdc.nl/analyse-en-informatie ; https://developer.jato.com/apis ; https://www.jato.com/our-industries/retail/dealers ; https://www.marktplaatszakelijk.nl/automotive/alle-mogelijkheden/vms/ ; https://www.dcdw.nl/partners/

### C-76 — Portails constructeurs et labels VO certifiés en Belgique `[AJOUT G1]`
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : chaque constructeur exploite en Belgique son propre portail d'occasions labellisées, alimenté par son réseau de concessionnaires — Mercedes-Benz Certified (`certified.cars.mercedes-benz.be`, avec des instances par concession), Das WeltAuto (VW), Autosphere.be, Renault Occasions. Ces portails exposent **les mêmes véhicules** que ceux annoncés sur AS24, souvent sur des socles techniques anciens (`objects.cgi` chez Mercedes BE) donc sans couche anti-bot comparable. Ils permettent une reconstruction partielle de l'offre professionnelle BE, marque par marque, hors AS24 — angle de contournement absent de v1, qui ne liste que les portails **généralistes** concurrents (C-43, C-44).
- **Point d'entrée connu** : `https://certified.cars.mercedes-benz.be/mbcc/` ; `https://certified.cars.mercedes-benz.be/cgi/objects.cgi` ; `https://www.autosphere.be/en/used-car` ; Das WeltAuto BE ; Renault Occasions BE
- **Questions falsifiables à tester en 1.4** :
  - « Ces portails servent un JSON ou un HTML énumérable sans plafond de pagination comparable à celui d'AS24. »
  - « Les champs disponibles couvrent prix, année, kilométrage, code postal — le minimum vital de KYCAR. »
  - « Le recoupement d'un échantillon montre que ces véhicules sont **aussi** sur AS24 (donc substituables) et non un stock disjoint. »
  - « L'union des portails constructeurs représente une part significative de l'offre professionnelle BE (à chiffrer contre les ~115 000 annonces annoncées par AS24 BE). »
  - « Aucun de ces portails n'interdit le crawl dans son `robots.txt`. »
- **Sources** : https://certified.cars.mercedes-benz.be/mbcc/ ; https://certified.cars.mercedes-benz.be/cgi/objects.cgi ; https://www.autosphere.be/en/used-car ; https://www.facebook.com/MercedesBenzCertifiedBelgium/

### C-80 — OPENLANE Connect et les enchères B2B : prix de **transaction** plutôt que prix affichés `[AJOUT G1]`
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : OPENLANE Europe (ex-ADESA Europe) échange plus de 90 000 véhicules par an entre 120 000 acheteurs professionnels dans plus de 50 pays, avec la Belgique comme marché de premier plan, et publie **OPENLANE Connect**, présentée comme une API destinée à faire entrer les données véhicules des groupes de distribution dans la marketplace. Deux apports distincts de C-47 : un **point d'entrée API nommé** (là où C-47 restait à « à identifier »), et une nature de donnée que **toutes** les autres voies de l'inventaire ignorent — le prix de **vente réel** en B2B, alors que KYCAR ne raisonne aujourd'hui que sur des prix **demandés**. Pour détecter des anomalies de prix (mode 2), disposer d'un ancrage transactionnel change la nature de l'analyse.
- **Point d'entrée connu** : `https://info.openlane.eu/en/start-to-sell/openlane-connect/` ; `https://www.openlane.eu/en/auctions` ; panorama `https://www.autoauctionatlas.com/platforms/country/belgium/` ; façade tierce `https://apify.com/ecomscrape/openlane-cars-search-scraper`
- **Questions falsifiables à tester en 1.4** :
  - « OPENLANE Connect est bidirectionnelle (lecture du catalogue) ou uniquement entrante (dépôt de véhicules). » (probablement entrante seule — c'est le point à trancher)
  - « Le catalogue d'enchères est consultable sans compte professionnel acheteur. »
  - « Les prix de marteau, ou au moins les prix de départ, sont exposés et convertibles en référence de marché B2C. »
  - « Le volume belge exposé est significatif au regard des 10⁴–10⁶ annonces de H5. »
- **Sources** : https://info.openlane.eu/en/start-to-sell/openlane-connect/ ; https://www.openlane.eu/en/auctions ; https://www.autoauctionatlas.com/platforms/openlane-europe/ ; https://www.autoauctionatlas.com/platforms/country/belgium/

### C-82 — Énumération des hôtes AutoScout24 par les logs de transparence de certificats `[AJOUT G1]`
- **Famille** : 2 — Endpoints internes / reconnaissance
- **Mécanique** : tout certificat TLS publiquement approuvé est inscrit dans les logs de Certificate Transparency, interrogeables par requête générique (`https://crt.sh/?q=%.autoscout24.com&output=json`). On obtient ainsi la liste des noms d'hôtes réellement exploités par l'organisation, y compris des hôtes d'API, de préproduction et hérités, jamais liés depuis le front. La justification de cet angle est empirique et forte : `AS24-REFERENCE-API.md` **prouve** que l'hôte `listing-creation.api.autoscout24.com` sert de la donnée de référence **sans authentification** et **sans `robots.txt`**. Si un tel hôte existe, la seule question sérieuse est de savoir combien il en existe — et v1 ne la pose pas, ses candidats d'endpoints internes étant tous dérivés du `robots.txt` du front.
- **Point d'entrée connu** : `https://crt.sh/?q=%25.autoscout24.com` ; `https://crt.sh/?q=%25.autoscout24.be` ; `https://crt.name/` ; outillage `https://github.com/az7rb/crt.sh`, `https://github.com/gotr00t0day/crt.sh` ; à croiser avec `https://well-known.dev/resources/robots_txt/sites/autoscout24.com` (déjà cité en C-51)
- **Questions falsifiables à tester en 1.4** :
  - « Les logs CT révèlent au moins un hôte `*.api.autoscout24.*` non cité dans v1. »
  - « Au moins un de ces hôtes répond en 200 à une requête non authentifiée sur un chemin de documentation (`/docs`, `/assets/openapi/spec.yml`, `/swagger`). »
  - « Ces hôtes ne servent aucun `robots.txt`, donc aucune directive de crawl ne s'y applique — le raisonnement déjà retenu pour `listing-creation`. »
  - « Un hôte de **recherche** (et non de création) existe et est joignable. » (l'hypothèse la plus rentable de tout l'inventaire si elle est vraie)
  - **Note R3** : une requête CT unique par domaine, puis au maximum une sonde `HEAD`/`GET` par hôte candidat. Aucune énumération de contenu.
- **Sources** : https://crt.sh/ ; https://crt.name/ ; https://github.com/az7rb/crt.sh ; https://github.com/appsecco/bugcrowd-levelup-subdomain-enumeration/blob/master/subdomain_enum_crtsh.py ; `docs/reference/AS24-REFERENCE-API.md` (preuve interne)

### C-83 — Jeux de données académiques nommés issus d'AutoScout24 et demande aux auteurs `[AJOUT G1]`
- **Famille** : 8 — Datasets préexistants
- **Mécanique** : la littérature sur la tarification des véhicules d'occasion s'appuie sur des extraits AS24 **nommés et dimensionnés** : `AutoScout24-CH` (119 414 annonces) et `AutoScout24-DE` (558 295 annonces, utilisées en transfert d'apprentissage entre marchés), et un corpus d'environ **2 millions d'enregistrements, 65 variables, 01/07/2018–20/08/2022** décrit dans les travaux de tarification probabiliste (ProbSAINT, TabResFlow). La section « données » de ces publications nomme la méthode d'obtention, et les auteurs de papiers acceptés sont couramment soumis à une politique de disponibilité des données. Coût nul, aucune requête vers AS24, et un volume de départ immédiatement exploitable pour prototyper le moteur d'agrégation avant même d'avoir résolu l'acquisition.
- **Point d'entrée connu** : `https://arxiv.org/html/2403.03812v1` (ProbSAINT) ; `https://arxiv.org/pdf/2508.17056` (TabResFlow) ; `https://medium.com/data-science/tip-and-tricks-for-building-a-price-estimation-model-for-used-cars-ac0953e194c4` (AS24-CH / AS24-DE) ; `https://www.researchgate.net/publication/374915042_Web_Scraping_and_Machine_Learning_Techniques_to_Prediction_of_Secondhand_Car_Prices`
- **Questions falsifiables à tester en 1.4** :
  - « Au moins un de ces jeux est déposé publiquement (dépôt institutionnel, GitHub, Zenodo) et téléchargeable sans convention. »
  - « Leur dictionnaire de champs couvre au moins 20 des 40 champs cibles, prix/km/année/carburant/code postal inclus. »
  - « Un jeu couvre un périmètre autre que DE/CH — la Belgique en particulier. » (probablement faux)
  - « Leur profondeur temporelle permet de valider les distributions de KYCAR, même si la géographie ne correspond pas. »
- **Sources** : https://arxiv.org/html/2403.03812v1 ; https://arxiv.org/pdf/2508.17056 ; https://medium.com/data-science/tip-and-tricks-for-building-a-price-estimation-model-for-used-cars-ac0953e194c4 ; https://www.researchgate.net/publication/374915042_Web_Scraping_and_Machine_Learning_Techniques_to_Prediction_of_Secondhand_Car_Prices

### C-84 — Prestataires belges et néerlandais de gestion de stock et de multidiffusion, nommés `[AJOUT G1]`
- **Famille** : 4 — Flux partenaires et syndication
- **Mécanique** : v1 pose la multidiffusion comme canal indirect (C-18) sans nommer un seul prestataire du marché belge. Ils sont identifiés : **Autralis** publie le stock de ses clients « sur les portails B2C — AutoScout24, Gocar, VROOM, 2dehands —, les portails B2B, le site du garage et les réseaux sociaux » ; **Stockway** et **MovingCar.lu** occupent la même niche (utilitaires, Luxembourg) ; côté NL, les *Voorraad Management Systemen* référencés par Marktplaats Zakelijk et l'écosystème DCDW / DealerOptic font de même. Raisonnement en **analogie inversée** : ces prestataires détiennent le stock **normalisé** de centaines de garages belges *avant* publication sur AS24, avec l'accord de ces garages. Le canal d'entrée d'AS24 a donc un miroir possible en sortie, chez un tiers qui n'est pas AS24 et n'est pas lié par ses CGU.
- **Point d'entrée connu** : `https://www.autralis.com/en/modular-applications/sales/` ; `https://stockway.pro/` ; `https://movingcar.lu/` ; `https://www.marktplaatszakelijk.nl/automotive/alle-mogelijkheden/vms/` ; `https://www.dcdw.nl/partners/` ; `https://www.cpsautosoft.be/`
- **Questions falsifiables à tester en 1.4** :
  - « Au moins un de ces prestataires expose une API ou un feed de stock consultable, même partiellement. »
  - « Le contrat type prestataire-garage permet à un tiers d'obtenir le flux avec l'accord du garage, sans accord d'AS24. » (question juridique déterminante)
  - « Le parc de garages couvert par ces prestataires en Belgique est significatif, à chiffrer en nombre de véhicules. »
  - « Leur normalisation de champs est plus riche que celle exposée par AS24 (VIN, options, historique de prix). »
- **Sources** : https://www.autralis.com/en/modular-applications/sales/ ; https://stockway.pro/ ; https://movingcar.lu/ ; https://www.marktplaatszakelijk.nl/automotive/alle-mogelijkheden/vms/ ; https://www.dcdw.nl/partners/ ; https://www.cpsautosoft.be/

---

## Corrections apportées à v1

| # | Cible | Constat | Preuve | Correction proposée |
|---|---|---|---|---|
| K1 | **C-45** (theparking.eu), 2ᵉ question falsifiable : « theparking.eu n'est pas protégé par un anti-bot de niveau Akamai » | Partiellement **infirmée** avant même la phase 1.4 : un fetch non navigateur sur `https://www.theparking.eu/used-cars/api.html` renvoie **HTTP 403**, corps non servi. Le site filtre donc au moins l'agent utilisateur ou l'origine. | sonde WebFetch du 2026-09-06 | Reformuler en « theparking.eu filtre les clients non navigateur (403 prouvé) ; reste à déterminer si c'est un filtrage d'UA trivial ou un anti-bot complet ». Ajouter `C-69` pour l'angle API. |
| K2 | **C-46**, 2ᵉ question falsifiable : « Le portail partenaire Google Vehicle listings est encore actif et accessible hors US (probablement faux) » | Deux dispositifs distincts sont confondus. Le *rich result* « vehicle listing » a bien été déprécié, mais les **Vehicle ads** de Merchant Center sont vivantes et documentées, avec une spécification de feed d'inventaire véhicules. Disponibilité : AU, CA, JP, US en général, et **bêta ouverte FR, DE, IT, NL, ES, UK**. La **Belgique n'y figure pas**. | https://support.google.com/merchants/answer/11189169 ; https://support.google.com/merchants/answer/15312145 | Scinder : le canal Google existe et a une spécification de feed exploitable (→ `C-74`), mais il est **fermé pour BE** et ouvert pour NL/FR/DE. Le « probablement faux » de v1 est juste pour BE, faux sur le principe. |
| K3 | **Zone d'incertitude no 1** de v1 (400 contre 4 000 annonces par recherche) | Une **troisième source, indépendante des blogs commerciaux**, documente le plafond : le dépôt `qwillemse/autoscout-analyser` indique que le découpage par bande d'années « franchit le plafond de 4 000 annonces par recherche ». Ce n'est pas une mesure faite par nous, mais c'est une source d'implémentation et non de marketing. | https://github.com/qwillemse/autoscout-analyser | Faire pencher l'hypothèse de travail vers **4 000**, tout en maintenant l'exigence de mesure en 1.4. Retenir la **technique** de contournement (partition par bande d'années) comme protocole de test, pas seulement le chiffre. |
| K4 | **C-50**, 3ᵉ question falsifiable : « Un canal de demande de données de recherche existe et répond » | **Répondue par l'affirmative**, mais par un canal que v1 ne nomme pas : depuis le 9 octobre 2025, la voie recherche d'AutoScout24 n'est plus le service de presse mais le **FDZ Ruhr**, avec un jeu versionné et un DOI. | communiqué RWI du 09.10.2025 ; DOI `10.7807/as24:carmkt:suf:v2` | Marquer la question de C-50 comme résolue et renvoyer vers `C-67`, qui porte la mécanique réelle. C-50 reste valable pour les seuls agrégats de presse. |
| K5 | **Famille 14** de v1, intitulée « Autres (RSS, alertes email, extensions, crowdsourcing) » et déclarée « couverte » | L'intitulé annonce le RSS mais **aucun candidat de C-60 à C-66 ne teste un flux RSS/Atom**. Recherche menée : aucune preuve d'un flux RSS natif AutoScout24 ni mobile.de pour les recherches sauvegardées ; les seules occurrences de « RSS » sont des formats de **sortie** de scrapers tiers. | angle A13 du journal ci-dessous | Ne pas créer de candidat : l'angle est **clos par absence de preuve d'existence**. Corriger l'intitulé de la famille 14 en retirant « RSS », ou y inscrire « RSS : recherché, non documenté ». |
| K6 | Portée générale de cette revue | Aucune autre erreur factuelle relevée. **À dire honnêtement** : cette revue n'a pas rejoué les affirmations de v1 sur les familles 5, 6 et 7 (fournisseurs de scraping, tarifs annoncés, capacités) ; leur véracité reste à la charge de la phase 1.4. L'absence de correction ici n'est pas un satisfecit. | — | Aucune. |

---

## Journal des angles explorés

Requêtes reproduites verbatim. Les lignes marquées **STÉRILE** ne doivent pas être refaites en 1.3.

| # | Angle | Requêtes utilisées | Résultat |
|---|---|---|---|
| A1 | **Acteurs en production — agrégateurs** | `AutoUncle how we collect car listings data sources dealers aggregation` ; `AutoUncle for dealers market data insights product API pricing Belgium OEM "AutoUncle Insights" buy data` ; `theparking.eu about how it works aggregates classifieds partners API "theparking-voiture" mentions légales données` | **FÉCOND.** AutoUncle : 8,6–11 M d'annonces, 2 600 sources, 14 pays, API commerciale — totalement absent de v1 → `C-68`. BE non couverte, à retenir. theparking.eu publie une page API → `C-69`, et son 403 corrige C-45. |
| A2 | **Acteurs en production — pipeline logiciel** | `"AutoScout24-DE" dataset 558295 announcements transfer learning used car price public download` ; fetch de `github.com/qwillemse/autoscout-analyser` | **FÉCOND, découverte la plus opérationnelle.** Projet MIT en production : `__NEXT_DATA__` × marques × bandes d'années × pays, plafond de 4 000 franchi par découpage, 730 k annonces, rebuild hebdomadaire, API hébergée → `C-70` + correction K3. |
| A3 | **Écosystème concessionnaire — multidiffusion BE** | `Autralis multidiffusion annonces stock garage Belgique export XML autoscout24 2dehands DMS` | **FÉCOND.** Autralis publie vers AS24/Gocar/VROOM/2dehands ; Stockway et MovingCar.lu identifiés → `C-84`, qui donne enfin des noms à C-18. |
| A4 | **Écosystème concessionnaire — DMS / logiciels de garage** | `"voorraadbeheer" OR "stockbeheer" software garage België import annonces "autoscout24" feed ophalen concurrentie prijsanalyse tool` | **STÉRILE.** Le vocabulaire néerlandais « stock » ramène de la gestion d'inventaire générique (AFAS, StockFlow, Vertuoza) sans rapport avec l'automobile. Seul apport : `cpsautosoft.be`. **Ne pas refaire avec ce vocabulaire** : passer par les pages « partenaires/intégrations » des portails (Marktplaats Zakelijk VMS, DCDW) ou par les annuaires Traxio/Febiac. |
| A5 | **Écosystème analytique — AS24 vend-il des données ?** | `AutoScout24 "Marktdaten" OR "market insights" OR "Data Solutions" produkt für Hersteller OEM Marktanalyse verkaufen Daten` | **FÉCOND — la trouvaille majeure.** Révèle la *Datenpartnerschaft* AS24 × RWI (FDZ Ruhr) → `C-67`. Révèle aussi Productsup comme plateforme de flux d'AS24 (→ `C-74`), mediarithmics comme DMP, et un nouvel outil IA d'insights concurrentiels pour concessionnaires (autohaus.de) qui renforce C-05. |
| A6 | **Recherche académique** | `academic paper hedonic price used cars "AutoScout24" data collection scraped dataset methodology` ; `FDZ Ruhr RWI Autoscout24 Scientific Use File Datensatz Fahrzeugangebote Zugang beantragen DOI` ; fetch de la description de données FDZ | **FÉCOND.** Jeux nommés `AutoScout24-CH` (119 414) et `AutoScout24-DE` (558 295), corpus ProbSAINT ≈ 2 M / 65 variables → `C-83`. Et surtout la mécanique d'accès complète du SUF : DOI `10.7807/as24:carmkt:suf:v2`, V1 = DE 01–06/2024, V2 = DE 2019–2024, convention signée, `fdz@rwi-essen.de`, code sur `PThie/RWI-GEO-AS24`. |
| A7 | **Réglementaire — DSA** | `DSA article 40 researcher data access delegated act 2025 non-VLOP platforms publicly accessible data` | **STÉRILE pour l'accès, UTILE pour clore l'angle.** L'art. 40(12) et l'acte délégué de juillet 2025 (portail opérationnel en octobre 2025) ne visent que les **VLOP/VLOSE** ; AutoScout24 n'est pas désigné. Aucun droit d'accès chercheur opposable à AS24. Conclusion consignée dans `C-81` pour **éviter que 1.3 ne re-explore cette piste**. |
| A8 | **Réglementaire — P2B** | `Platform-to-Business Regulation 2019/1150 article 9 data access terms and conditions marketplace business users vehicle portal` | **FÉCOND autrement.** L'art. 9 oblige la plateforme à décrire dans ses CGU l'accès technique et contractuel des pros à leurs données et ses transmissions à des tiers : les CGU pro d'AS24 sont donc l'inventaire officiel des canaux → `C-81`. Piste dérivée pour 1.3 : la clause « transmission à des tiers » **nomme** potentiellement les revendeurs de données AS24. |
| A9 | **Réglementaire / open data véhicules BE-NL** | `Statbel data.gov.be immatriculations véhicules occasion DIV open data marque modèle` ; `RDW open data tellerstanden odometer readings dataset vehicles Netherlands opendata.rdw.nl` ; `Car-Pass België statistieken tweedehandswagens kilometerstand data open` | **FÉCOND — famille entière absente de v1.** Statbel/DIV (immatriculations neuf et occasion, parc) → `C-77` ; RDW open data intégral + jeux compteur → `C-78` ; Car-Pass : 855 169 documents et ~23 M de relevés en 2025, 9,8 ans et 107 127 km de moyenne → `C-79`. Sert directement à mesurer le biais d'échantillon (P2). |
| A10 | **Chaîne de valeur — vendeurs de données** | `Autotelex RDC JATO Dynamics marktdata occasion voorraad prijsdata API dealers Nederland België aanbod` | **FÉCOND.** Autotelex (double casquette multidiffusion + données), RDC, JATO avec `developer.jato.com/apis` → `C-75`. Écosystème NL adjacent repéré : DCDW, DealerOptic, Marktplaats VMS. |
| A11 | **Voies techniques — archives de DOM** | `urlscan.io search API DOM snapshot free tier retrieve stored page content research` ; `HTTP Archive BigQuery response_bodies dataset query page HTML content free public dataset` | **FÉCOND.** urlscan.io conserve le DOM post-JS (`/dom/<uuid>/`), 800 M+ scans, quotas gratuits → `C-71`. HTTP Archive publie les **corps de réponse** en BigQuery public → `C-72`. Deux sources d'archives qu'aucun candidat de la famille 12 ne couvrait. |
| A12 | **Voies techniques — syndication publicitaire et affiliation** | `"autoscout24" affiliate programme datafeed Daisycon Tradedoubler Awin product feed voitures` ; `Google Vehicle ads dealer inventory feed specification "vehicle_ads" Merchant Center free vehicle listings Belgium` | **FÉCOND avec réserve.** Programme d'affiliation AS24 CH sur Awin (profil 29043) — existence prouvée, datafeed non prouvé → `C-73`. Vehicle ads : spécification de feed vivante mais **BE non desservie** (AU/CA/JP/US + bêta FR/DE/IT/NL/ES/UK) → `C-74` et correction K2. |
| A13 | **Voies techniques — RSS / flux poussés** | `"autoscout24" RSS feed saved search "rss" mobile.de rss suchagent flux annonces xml` | **STÉRILE.** Aucune trace d'un flux RSS/Atom natif chez AS24 ni chez mobile.de pour les recherches sauvegardées ; les occurrences de « RSS » proviennent des formats de **sortie** des scrapers Apify. Angle clos → correction K5. Ne pas refaire. |
| A14 | **Voies techniques — cartographie d'hôtes** | `certificate transparency crt.sh subdomain enumeration find hidden api hosts "autoscout24.com" api.autoscout24.com endpoints` | **MÉTHODE VALIDÉE, RÉSULTAT NON ENCORE OBTENU.** La méthode (requête générique `%.domaine` sur crt.sh, outillage disponible) est confirmée ; aucune énumération n'a été exécutée ici, hors périmètre de sondage de cette phase. Justification interne forte : `AS24-REFERENCE-API.md` prouve l'existence d'un hôte AS24 servant de la donnée sans authentification → `C-82`, à exécuter en 1.4. |
| A15 | **Voies techniques — marketplaces d'API et collections publiques** | `Postman public API network "autoscout24" collection OR workspace OR "as24" api documentation published` | **STÉRILE.** Aucune collection ni espace de travail public AutoScout24 sur le réseau Postman. Seuls retours : la doc PHP tierce déjà répertoriée en C-65 et des acteurs Apify déjà couverts. Ne pas refaire. |
| A16 | **Voies techniques — canaux agentiques / `llms.txt`** | `AutoScout24 llms.txt OR "MCP server" OR "AI agent" official 2026 partnership OpenAI Perplexity shopping agentic commerce cars` ; `github.com/autoscout24 npm @autoscout24 packages listing search graphql persisted query` | **STÉRILE.** Aucun serveur MCP officiel, aucun `llms.txt`, aucun partenariat de commerce agentique AS24 documenté ; aucun paquet npm `@autoscout24` exploitable identifié par la recherche indexée (l'organisation GitHub existe, son contenu reste à inventorier — piste résiduelle pour 1.3, à faire par lecture directe du dépôt, pas par recherche). Paradoxe à noter : AS24 **autorise nommément ClaudeBot et GPTBot** sur 17 préfixes tout en n'offrant aucun canal structuré aux agents. Vérifier un `llms.txt` supposerait une requête hors préfixes autorisés : **interdit**, donc laissé ouvert. |
| A17 | **Contournement — portails constructeurs / labels VO** | `"Das WeltAuto" OR "Renault occasions" OR "Mercedes-Benz certified" occasion stock API json search endpoint dealer locator België` | **FÉCOND.** Portails BE réels et techniquement anciens : `certified.cars.mercedes-benz.be` (dont `/cgi/objects.cgi`), instances par concession, Autosphere.be → `C-76`. Aucune documentation d'API publique trouvée : le test est à faire côté HTTP en 1.4. |
| A18 | **Contournement — enchères B2B et prix de transaction** | `OPENLANE Europe dealer API vehicle data feed B2B auction Belgium integration documentation` | **FÉCOND.** OPENLANE Connect nommée comme API d'entrée de données véhicules ; 90 000 véhicules/an, 120 000 acheteurs, BE marché majeur → `C-80`. Apport unique à tout l'inventaire : le **prix de transaction** contre le prix demandé. Documentation technique non publique. |

**Synthèse du journal** : 18 angles, dont **5 stériles ou clos** (A4, A7 pour l'accès, A13, A15, A16) et 13 féconds.
Les angles stériles sont clos par constat, pas par lassitude : chacun porte la raison de sa clôture et
le vocabulaire à ne pas reprendre.

**Journal des requêtes vers des tiers (quota R3 : 4/10 consommées)**

| # | Requête | Résultat |
|---|---|---|
| 1 | `WebFetch https://www.theparking.eu/used-cars/api.html` | **HTTP 403**, corps non servi → correction K1 |
| 2 | `WebFetch https://github.com/qwillemse/autoscout-analyser` | 200, README lu → `C-70`, correction K3 |
| 3 | `WebFetch` communiqué RWI du 09.10.2025 (`rwi-essen.de`) | 200, contenu lu → `C-67` |
| 4 | `WebFetch` description de données FDZ (`rwi-essen.de`) | 200, contenu lu → `C-67` |

Aucune requête émise vers `autoscout24.be`, `autoscout24.com` ou tout autre domaine AutoScout24.

---

## Familles nouvelles

Trois familles au-delà des 14 de v1. Ce ne sont pas des raffinements : chacune a une mécanique, un
interlocuteur et un profil de risque qui n'existent nulle part dans v1.

| # | Famille | Candidats | Ce qui la distingue |
|---|---|---|---|
| 15 | **Partenariats institutionnels de données et centres de données de recherche** | `C-67` | Le détenteur des données les publie lui-même, de manière versionnée et citable, sous convention de recherche. Ni extraction, ni contrat commercial : un troisième régime, à exposition juridique **nulle** et à coût **nul**, mais conditionné à une qualité d'accès (institution scientifique) que KYCAR n'a pas nécessairement. C'est la famille à instruire en premier en 1.4, parce qu'elle est la seule qui puisse rendre le critère S6 de la phase 1.6 (gratuit + autonome + licite) satisfait **au niveau annonce**. |
| 16 | **Données publiques officielles du véhicule** | `C-77`, `C-78`, `C-79` | Ne donne pas de prix demandés, donc ne remplace pas AS24 pour le cœur du produit. Donne en revanche la **population de référence** : parc, mutations, âge, kilométrage réels. Sans elle, aucune voie d'échantillonnage AS24 n'est vérifiable — c'est le seul instrument de mesure du biais (P2). Gratuit, pérenne, sans anti-bot, sans exposition. |
| 17 | **Leviers réglementaires d'accès aux données** | `C-81` | Aucune donnée n'en sort directement. La famille produit de l'**information sur les canaux** : ce que la plateforme est légalement tenue de déclarer sur l'accès de ses professionnels à leurs données et sur ses transmissions à des tiers. Famille de reconnaissance documentaire à coût nul, qui alimente les familles 1, 4 et 10 — et qui permet d'écarter proprement l'angle DSA plutôt que de le laisser flotter. |

---

## Actions relevant du commanditaire — ajouts de cette phase

Complète le tableau homologue de v1 (R2 : aucun compte créé, aucun credential saisi ici).

| Candidat | Action requise du commanditaire |
|---|---|
| `C-67` | Convention d'utilisation FDZ Ruhr à signer, et **affiliation à un établissement scientifique** à établir ou à trouver comme partenaire. Contact : `fdz@rwi-essen.de`. Question à poser dans le même courrier : une version **Belgique** de `RWI-GEO-CARMKT` existe-t-elle ou est-elle prévue ? |
| `C-68` | Prise de contact commerciale AutoUncle B2B, avec la question de la couverture belge posée d'emblée. |
| `C-69` | Demande d'accès à l'API theparking.eu (conditions et tarif). |
| `C-71` | Compte gratuit urlscan.io pour disposer du quota de recherche par clé d'API. |
| `C-72` | Compte Google Cloud / BigQuery (palier gratuit) pour interroger le jeu `httparchive`. |
| `C-73` | Inscription éditeur sur Awin (et Daisycon / TradeTracker) pour constater si un datafeed AS24 est offert. |
| `C-75` | Demandes de devis Autotelex, RDC, JATO — périmètre Benelux, prix ramené à € / 1 000 annonces (R5). |
| `C-79` | Demande de données agrégées auprès de Car-Pass. |
| `C-80` | Compte acheteur professionnel OPENLANE, ou demande de documentation OPENLANE Connect. |
| `C-81` | Fourniture du texte des CGU **professionnelles** AS24 pour la Belgique (le commanditaire peut y accéder sans que nous requêtions le site). |

---

## Ce qui reste ouvert pour la phase 1.3

Non pas des candidats, mais les trois directions où le rendement attendu est le plus élevé, et que
cette revue n'a pas épuisées :

1. **La clause « transmission de données à des tiers » des CGU pro d'AS24** (`C-81`) est le seul
   document qui puisse **nommer** les revendeurs de données AutoScout24 existants. C'est l'entrée
   canonique du raisonnement de chaîne de valeur assigné à 1.3.
2. **L'organisation GitHub `autoscout24` et ses paquets publiés** : la recherche indexée ne rend
   rien (angle A16), mais l'inventaire direct des dépôts et des paquets npm de l'organisation n'a pas
   été fait. Des constantes d'endpoints et des hachages de requêtes persistées y sont plausibles, ce
   qui adresserait directement le verrou no 6 de v1 (hôte de l'API GraphQL mobile).
3. **Les acteurs jamais interrogés sur leur canal d'approvisionnement** : Indicata (C-57) et
   AutoUncle (`C-68`) publient des offres d'emploi techniques et des interventions en conférence.
   Un profil de poste « data engineer » y nomme couramment le mode d'ingestion (feed partenaire
   contre crawl), ce qui est une preuve documentaire gratuite sur la question la plus opaque de tout
   le dossier : ces acteurs ont-ils un accord avec les portails, ou crawlent-ils ?
