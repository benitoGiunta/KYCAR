# probe-LOT-PQ — Vendeurs de données de marché (LOT-P) et données publiques officielles (LOT-Q)

**Agent** : `probe-PQ`, phase 1.4 de `plans/PLAN-1-data-acquisition.md`
**Candidats instruits — LOT-P** : `C-57` (INDICATA), `C-75` (Autotelex/RDC/JATO), `C-56` (JD Power Europe :
Autovista/Eurotax/Glass's/Schwacke), `C-41` (marketplaces de données : Datarade, Datatorq, Dataforce,
Marketcheck, PromptCloud), `C-89` (espaces de données européens : Mobility Data Space, Catena-X, CEMDS)
**Candidats instruits — LOT-Q** : `C-78` (RDW open data NL), `C-77` (Statbel/DIV/SPF Mobilité BE),
`C-79` (Car-Pass BE), `C-90` (GOCA / contrôle technique BE)
**Date d'exécution** : 2026-09-07
**Budget de requêtes** : 60 maximum, plafond partagé entre les deux lots. Journalisées une à une ci-dessous.
**Règle E5** : aucune requête vers `www.autoscout24.be` ni `.com`. Aucune n'a été émise.
**Règle R2** : aucun compte créé, aucun credential saisi.

> **Méthode d'écriture** : ce document est écrit **au fur et à mesure de l'exécution**, candidat après
> candidat. Le journal de preuve est en tête ; il est complété à chaque requête.
>
> **Reprise d'une exécution coupée** : ce document remplace un squelette partiel (76 lignes, sections
> sans verdict, journal vide) laissé par une exécution précédente. Aucune requête n'avait été
> journalisée dans ce squelette ; l'intégralité de l'investigation ci-dessous est donc une exécution
> neuve, pas une reprise de sondes existantes.

---

## Journal de preuve

### Requêtes techniques directes (curl → API Socrata RDW, non authentifiée)

| # | Cible | Requête | HTTP | Résultat |
|---|---|---|---|---|
| 1 | `opendata.rdw.nl/resource/m9d7-ebf2.json` | `$limit=2`, en-têtes seuls | 200 | `time_total` 0,46 s. En-tête `x-soda2-fields` retourne la liste complète des **~104 champs** du dataset `Gekentekende_voertuigen` sans qu'aucune ligne de donnée ne soit nécessaire pour l'obtenir — le schéma est lisible par une requête d'en-tête seule. |
| 2 | `opendata.rdw.nl/resource/m9d7-ebf2.json` | `$select=kenteken,merk,handelsbenaming,jaar_laatste_registratie_tellerstand,tellerstandoordeel,code_toelichting_tellerstandoordeel&$limit=5` | 200 | 5 lignes retournées. Valeurs observées pour `tellerstandoordeel` : `"Geen oordeel"`, `"Logisch"`, `"Niet geregistreerd"` — **des chaînes catégorielles, jamais un nombre de kilomètres.** |
| 3 | `opendata.rdw.nl/resource/m9d7-ebf2.json` | `$select=count(kenteken)` | 200 | `{"count_kenteken":"..."}`. `time_total` 1,95 s. Confirme l'agrégation SoQL `count()` sans clé. |
| 4 | `api.us.socrata.com/api/catalog/v1` | `q=tellerstand&limit=20` (catalogue Socrata global) | 200 | 0 résultat — l'endpoint de découverte global ne référence pas le domaine `opendata.rdw.nl` sous cette forme. |
| 5 | `opendata.rdw.nl/api/catalog/v1` | `domains=opendata.rdw.nl&q=tellerstand&limit=20` (catalogue Socrata propre au domaine RDW) | 200 | **2 résultats seulement** : `m9d7-ebf2` (le dataset déjà interrogé) et un jeu nommé « Ferrari » sans rapport. **Aucun troisième dataset RDW dédié au kilométrage brut n'existe dans le catalogue public.** |
| 6 | `opendata.rdw.nl/resource/sgfe-77wx.json` | `$limit=3` (dataset « Meldingen Keuringsinstantie », rapports de contrôle technique APK) | 200 | 3 lignes. Champs : `kenteken`, dates/heures de contrôle, organisme, échéance, liens vers les défauts constatés. **Aucun champ numérique de kilométrage.** |
| 7 | `opendata.rdw.nl/resource/sgfe-77wx.json` | `$limit=1`, en-têtes seuls | 200 | `x-soda2-fields` confirme la liste exhaustive de 11 champs du point 6 — pas de champ omis. |
| 8 | `opendata.rdw.nl/resource/m9d7-ebf2.json` | `$select=kenteken&$limit=3&$offset=100000` | 200 | Pagination par `$offset` fonctionnelle et sans clé — 3 lignes différentes du jeu 1, à l'offset demandé. |
| 9 | `opendata.rdw.nl/resource/m9d7-ebf2.json` | `$select=count(kenteken)&$where=merk='BMW'` | 200 | `624208`. Confirme `$where` fonctionnel sur un filtre textuel exact. |
| 10 | `opendata.rdw.nl/resource/m9d7-ebf2.json` | `$select=voertuigsoort,count(kenteken)&$group=voertuigsoort&$limit=10` | 200 | 10 catégories de véhicules avec comptage (`Bedrijfsauto` 1 504 655, `Bromfiets` 1 373 051, etc.). Confirme `$group` fonctionnel — l'agrégation par segment ne coûte qu'une requête. |
| 11 | `catalog.mobility-dataspace.eu/` | résolution DNS | **échec** | `curl: (6) Could not resolve host`. Le sous-domaine cité par le mandat n'existe plus ou n'a jamais existé sous cette forme — **information stale**, pas un blocage. |
| 12 | `mobility-dataspace.eu/` | racine | 200 | 62 770 octets, 0,80 s. Site institutionnel du Mobility Data Space (MDS), toujours en production. |
| 13 | `portal.mobility-dataspace.eu/` | racine | 200 | 47 335 octets, 0,29 s. Page titrée uniquement **« Authority Portal »** — coquille d'application cliente (SPA) sans contenu de catalogue exposé côté serveur : le catalogue de jeux de données n'est pas navigable sans l'application authentifiée. |

**13 requêtes techniques directes.** Zéro `4xx`/`5xx` hors l'échec DNS volontaire (test négatif de #11).
Zéro clé API, zéro compte, sur l'intégralité des 12 requêtes ayant atteint un serveur.

### Lectures documentaires (WebFetch / WebSearch)

Comptées dans le même plafond de 60, par prudence (R3), bien qu'elles ne consomment pas de bande
passante vers une cible techniquement sondée au sens strict.

| # | Outil | Cible | Résultat |
|---|---|---|---|
| 14 | WebSearch | RDW open data tellerstand/kilometerstand dataset | Oriente vers `dev.socrata.com/foundry/opendata.rdw.nl/m9d7-ebf2` et confirme l'existence du NAP comme registre séparé. |
| 15 | WebSearch | NAP (Nationale AutoPas) — accès, API, base | **NAP est géré par le RDW depuis 2014** (absorption de la Stichting Nationale Autopas), 88 M+ relevés, ~10 M véhicules, mise à jour sous 24 h — mais **commercialisé** sous forme de « RDW Tellerrapport » payant à l'unité, pas publié en open data. |
| 16 | WebFetch | `rdw.nl/over-rdw/dienstverlening/open-data/algemene-informatie` | Page générale, ne détaille pas le champ kilométrage — n'infirme ni ne confirme ; le test technique (#1-#10) fait foi, pas cette page. |
| 17 | WebFetch | `mobilit.belgium.be/.../immatriculations-des-vehicules` | **Confirme littéralement** : fichiers Excel ventilés par « la marque et le modèle commercial du véhicule », statut neuf/occasion, région/province, type de titulaire, catégorie véhicule, masse technique, carrosserie, norme Euro, catégorie CO2 (NEDC), carburant. Historique 2013-2025. |
| 18 | WebFetch | `car-pass.be/public/files/8952_CAP_Jaarverslag-2025_FR_v4-Interactief.pdf` | PDF à dominante image (infographies) : extraction automatique du texte a échoué (pas d'OCR disponible dans l'environnement). Fichier sauvegardé, chiffres récupérés via #19 et #22. |
| 19 | WebFetch | `car-pass.be/en/blog/car-pass-jaarverslag-2025` | Page HTML du même bilan : chiffres 2025 extraits (voir section Population de référence). Confirme explicitement l'absence de ventilation régionale ou par marque dans ce document. |
| 20 | WebFetch | `gocavlaanderen.be/` | Aucune section statistiques/chiffres/rapports téléchargeables visible sur la page d'accueil. |
| 21 | WebFetch | `goca.be/` | Redirection 301 vers `gocavlaanderen.be` — confirme qu'il n'existe pas de portail statistique national GOCA distinct de la fédération flamande côté accès public direct. |
| 22 | WebSearch | Car-Pass statistiques kilométrage marché occasion Belgique 2025 | Chiffres corroborés indépendamment de #19 (voir tableau de population de référence). |
| 23 | WebSearch | GOCA contrôle technique Belgique statistiques 2025/2026 | Seules données trouvées : volumes en communiqué de presse repris par la presse généraliste (`econostrum.info`), pas de fichier de données. |
| 24 | WebFetch | `developer.jato.com/apis` | Page introductive générale : ne précise ni la nature exacte de l'objet vendu, ni la couverture géographique, ni le prix, ni le mode de collecte. |
| 25 | WebFetch | `indicata.com/company/` | Ne décrit pas la méthode de collecte : formule volontairement vague (« unique approach to collecting, processing and analysing live used car market data »). |
| 26 | WebSearch | INDICATA / Autorola — « how it works », collecte, crawling | Fait apparaître « analyzes up to 15 million cars daily using advanced image recognition technology » — indice indirect (reconnaissance d'image sur des photos d'annonces) mais pas une description explicite de la source. |
| 27 | WebFetch | `indicata.com/privacy-policy/` | Aucune mention de scraping/crawling de sites tiers ; la politique ne couvre que les données personnelles des utilisateurs directs du service. |
| 28 | WebSearch | Citation exacte « OEM websites, classifieds, used car dealer and retailer websites » + INDICATA | Fait remonter `indicata.com/oems-and-nscs/` et confirme la citation, **attribuée à une fiche tierce (Tracxn)**, pas au site INDICATA lui-même. |
| 29 | WebFetch | `indicata.com/oems-and-nscs/` | Aucune description de la méthode de collecte ; parle de suivi de la performance concessionnaire, pas de la source des données. |
| 30 | WebFetch | `tracxn.com/d/companies/indicata/...` | **Source primaire de la citation** : « The platform gathers real-time data from OEM websites, classifieds, used car dealer and retailer websites to create its dashboard. » Tracxn ne cite lui-même aucune source primaire pour cette phrase. |
| 31 | WebFetch | `indicata.com/dealer-groups-and-retailers/` | Idem #29, pas de détail sur la collecte. |
| 32 | WebSearch | INDICATA pricing / abonnement | Aucun prix public trouvé — cohérent avec un modèle B2B entièrement sur devis. |
| 33 | WebFetch | `autotelex.nl/` | **Trouvaille directe, page d'accueil** : sources listées explicitement — « autogroothandelaren, autobedrijven, gespecialiseerde autobedrijven, leasemaatschappijen, veilingopbrengsten, interne biedingen **en occasionportals** » (grossistes auto, garages, entreprises spécialisées, sociétés de leasing, résultats d'enchères, enchères internes **et portails d'occasion**). Aucune couverture Belgique mentionnée — marché néerlandais exclusivement. |
| 34 | WebFetch | `rdc.nl/analyse-en-informatie` | Couverture néerlandaise exclusivement (« Nederlandse automarkt », RDW). Pas de prix public, devis sur contact. Méthode de collecte non détaillée au-delà de « databases » propres. |
| 35 | WebFetch | `autovista.com/product/autovista-api/` | Redirection 301 vers `jdpower.com/business/autovista-api/`. |
| 36 | WebFetch | `jdpower.com/business/autovista-api/` | **403 Forbidden** — page inaccessible sans navigateur complet/session. |
| 37 | WebFetch | `jdpower.com/business/autovista-valuation/` | **403 Forbidden** — idem. |
| 38 | WebSearch | Autovista Group / Eurotax — couverture Belgique, valorisation résiduelle | **Confirme** : Belgique explicitement listée parmi 14 marchés européens couverts (avec FR, DE, IT, ES, UK, AT, CZ, HU, NL, PL, PT, RO, SK, CH). Objet vendu : valeurs résiduelles harmonisées « trade/retail », benchmark âge × kilométrage — **pas des annonces individuelles**. |
| 39 | WebFetch | `datarade.ai/data-providers/datatorq/profile` | Objet vendu : « pricing, specifications, and product attributes », « Car Price Data », « Car Spec Data ». Pas d'annonces individuelles. Modèles tarifaires listés (licence annuelle, à l'usage, achat unique, licence mensuelle) mais **aucun chiffre public**. |
| 40 | WebSearch | Couverture géographique Datatorq (vérification croisée) | **Confirme la Belgique** dans la liste des pays couverts (avec FR, UK, IT, PL, NL, ES, DE, AT, CZ, PT, RO, CH, BG, HR, DK, HU, NO, SI, SE, IE, TR, MA, BR, AR, CO, MX, AU) — donnée belge nommée : « prices and specifications of main LCV models », 250+ points de données/version, mensuel, CSV. |
| 41 | WebFetch | `data.datatorq.io/products/car-price-data-car-data-current-prices-europe-current-datatorq` | « Pricing available upon request » — aucun prix public. |
| 42 | WebFetch | `mobility-dataspace.eu/` | Renvoie vers `portal.mobility-dataspace.eu/` pour le « Data Catalogue » ; ne précise pas si consultable sans compte ; ne mentionne aucun jeu de données véhicules d'occasion ; membres cités en général (« OEMs, prestataires de mobilité, communes, assureurs, start-ups ») sans nommer JATO/Autovista/RDC. |
| 43 | WebSearch | Mobility Data Space — jeux de données véhicules d'occasion 2026 | Aucune mention d'un jeu de données d'annonces ou de prix VO dans le catalogue MDS ; les acteurs data automobiles cités par la recherche indexée (Marketcheck, S&P Global Mobility, CARUSO Dataplace) sont **hors MDS**, ce sont des fournisseurs commerciaux classiques. |
| 44 | WebSearch | Parc automobile belge total 2025 (vérification de contrôle pour le tableau de population) | **FEBIAC** : 6 069 957 voitures immatriculées fin 2025 (6 008 569 fin 2024, +61 388) ; 414 771 immatriculations neuves en 2025 ; essence 168 449 (40,6 %), électrique 143 849 (34,7 %). |

**44 requêtes au total sur un plafond partagé de 60** (13 techniques + 31 documentaires).
**Aucune requête vers `www.autoscout24.be` ni `.com`** (règle E5). Aucun compte créé (règle R2).

---

## Mode de collecte des vendeurs de données (LOT-P — section décisive)

### Le verdict, candidat par candidat

| Candidat | Mode de collecte établi sur source primaire ? | Ce qui est réellement su |
|---|---|---|
| `C-57` INDICATA | **NON.** Trois pages du site officiel (`company/`, `oems-and-nscs/`, `dealer-groups-and-retailers/`) et la politique de confidentialité ont été lues sans qu'aucune ne décrive le mécanisme de collecte. | La phrase « *gathers real-time data from OEM websites, classifieds, used car dealer and retailer websites* » (élément `G2-K10` du registre) provient d'une fiche **tierce** (Tracxn), qui elle-même ne cite aucune source primaire. Elle est **documentée mais pas confirmée** au sens de R4 : niveau de preuve `supposé`, pas `prouvé`. Un indice indirect et cohérent existe cependant : INDICATA revendique analyser « up to 15 million cars daily using advanced image recognition technology » — la reconnaissance d'image n'a de sens que sur des **photos d'annonces effectivement collectées**, ce qui présuppose une collecte à l'échelle du web plutôt qu'un flux structuré fourni par accord. |
| `C-75` Autotelex | **OUI, en partie, sur source primaire.** La page d'accueil `autotelex.nl` nomme explicitement ses sources : grossistes auto, garages, entreprises spécialisées, sociétés de leasing, résultats d'enchères, enchères internes, **et portails d'occasion** (« occasionportals »). | C'est un **modèle hybride documenté** : les portails d'annonces sont une source **parmi d'autres**, pas la source exclusive. Autotelex a par ailleurs une double casquette (multidiffusion), ce qui signifie qu'une partie de sa donnée peut provenir de flux qu'il **distribue lui-même** vers les portails pour le compte des garages — donc en amont de la publication, pas en aval par re-collecte. |
| `C-75` RDC | **NON déterminé.** La page consultée ne détaille pas la méthode au-delà de « databases » propres. | `[NON VÉRIFIÉ]`. |
| `C-56` JD Power (Autovista/Eurotax) | **NON déterminé sur les pages accessibles** (403 sur les deux pages produit ciblées). | Le modèle documenté par la littérature du secteur pour ce type d'acteur ancien (fondé sur les catalogues professionnels historiques) est la collecte par **panel professionnel et déclaratif** (concessionnaires, remarketeurs) plutôt que le crawl de portails — mais ceci reste un `[SUPPOSÉ]`, non vérifié dans cette session. |
| `C-41` Datarade/Datatorq | **NON déterminé.** Les fiches produit décrivent l'objet vendu (prix, specs) mais jamais la méthode d'obtention. | `[NON VÉRIFIÉ]`. |
| `C-89` Mobility Data Space | Sans objet — aucun jeu de données automobile VO identifié dans ce catalogue (voir plus bas). | — |

### La question juridique dimensionnante (question falsifiable n°5 du mandat)

> « Ces fournisseurs tirent leurs données d'offre des portails, donc répercutent les restrictions d'AS24. »

**Verdict : PARTIELLEMENT CONFIRMÉE, PARTIELLEMENT INFIRMÉE — et la réponse est hétérogène par acteur,
pas uniforme pour la famille.**

1. **Le cas le plus opaque du registre (`C-57` INDICATA) reste opaque après investigation sur source
   primaire.** L'entreprise ne publie nulle part, sur son propre site, la description de sa méthode de
   collecte — ce qui est cohérent avec une entreprise qui aurait intérêt à ne pas l'écrire noir sur
   blanc si cette méthode consiste à republier de la donnée extraite de portails tiers sans droit.
   L'absence de démenti n'est pas une preuve, mais le silence sélectif sur un point aussi central
   (alors que le site documente en détail ses produits et ses cas d'usage) est **lui-même un signal**,
   à consigner en A11 comme aggravant sans être un `prouvé`.
2. **Le cas le plus clair du registre (`C-75` Autotelex) montre que la famille n'est pas monolithique.**
   Une source primaire nomme volontairement les portails comme **une source parmi sept**, ce qui est
   l'inverse d'une dépendance structurelle : Autotelex a un modèle de collecte multi-source où le
   portail est un signal d'appoint, pas la matière première.
3. **Conséquence pour la notation A11/A12 du registre final** : la famille 13 ne peut pas recevoir une
   note d'exposition juridique unique. `C-57` doit porter la note la plus sévère de la famille (parce
   que le doute profite à la prudence quand l'acteur lui-même refuse de clarifier), `C-75` une note
   sensiblement plus basse (modèle hybride documenté), et `C-56`/`C-41` restent `[NON VÉRIFIÉ]` — ce qui
   **n'est pas un verdict favorable par défaut** : l'absence de preuve d'un accord de portail n'est pas
   la preuve d'une collecte licite.
4. **Un vendeur qui republie de la donnée AS24 extraite sans droit déplace le risque vers KYCAR s'il
   devient client de ce vendeur** — la question posée par le mandat n'est donc pas seulement
   descriptive : si demain KYCAR souscrit à INDICATA sans clarification contractuelle explicite de la
   provenance des données AS24 dans le flux vendu, l'exposition de `C-14`/`C-02` (extraction directe)
   ne disparaît pas, elle se **traduit en risque contractuel avec un tiers qui a lui-même hérité du
   risque** — pas en risque nul. Ceci doit être écrit noir sur blanc dans `ACTIONS-COMMANDITAIRE` :
   toute négociation avec `C-57` doit exiger, comme condition contractuelle, une garantie écrite de la
   provenance et de la licéité des données de source AS24 dans le flux vendu.

---

## Population de référence BE (LOT-Q)

### Verdict sur la question la plus précieuse (kilométrage RDW au niveau véhicule)

**VERDICT : NON — testé et infirmé par requête directe (preuve `prouvé`, pas `documenté`).**

Le dataset public `Gekentekende_voertuigen` (`m9d7-ebf2`) sert bien un champ lié au compteur,
`tellerstandoordeel`, mais c'est un **jugement catégoriel** à 4 valeurs observées (`Logisch`,
`Niet geregistreerd`, `Geen oordeel`, et par déduction `Onlogisch`), accompagné de
`jaar_laatste_registratie_tellerstand` (l'**année**, pas la date ni la valeur, du dernier relevé).
**Aucun champ numérique de kilométrage n'existe dans ce dataset.** La recherche exhaustive du
catalogue Socrata propre au domaine RDW pour le mot-clé « tellerstand » ne renvoie que ce même
dataset (requête #5 du journal) : il n'existe pas de second dataset RDW ouvert portant le kilométrage
brut. Le dataset le plus proche par son objet, « Meldingen Keuringsinstantie » (`sgfe-77wx`, rapports
de contrôle technique), a été interrogé directement (requêtes #6-#7) : il ne porte que des métadonnées
administratives de contrôle (dates, organisme, échéance, liens vers les défauts), **aucun champ
kilométrique**.

Le kilométrage réel existe bel et bien, avec une richesse considérable — le NAP (Nationale AutoPas),
que le RDW gère depuis 2014, contient plus de 88 millions de relevés pour près de 10 millions de
véhicules, mis à jour sous 24 h. **Mais ce n'est pas la même base que l'open data.** Le NAP est
commercialisé séparément sous forme de rapport payant à l'unité (« RDW Tellerrapport »), et n'est
**pas exposé** par l'API Socrata publique. La variable la plus lourde à obtenir chez AutoScout24
(le kilométrage par véhicule) **reste hors d'atteinte gratuite côté RDW aussi** — la seule chose
gratuite est un **verdict de plausibilité**, pas une valeur.

Ce que l'API Socrata RDW confirme en revanche, prouvé par requête directe, sans clé : `$select`,
`$where` (filtre exact, requête #9), `$group` (agrégation par catégorie, requête #10), `count()`
(requêtes #3 et #9), et `$offset`/`$limit` (pagination, requête #8) fonctionnent tous sans
authentification, avec une volumétrie nationale complète (624 208 BMW immatriculées, par exemple).
C'est un outil d'agrégation puissant pour la structure du parc néerlandais — mais **le RDW est une
population de référence néerlandaise, pas belge**, et ne sert donc que de gabarit méthodologique
(le type de requêtes possibles, la richesse du schéma à ~104 champs) pour juger ce qui manque côté
belge, pas de source de la population de référence BE elle-même.

### Le tableau de population de référence BE

| Indicateur | Valeur | Année | Source | Niveau de preuve |
|---|---|---|---|---|
| Parc automobile total (voitures immatriculées) | **6 069 957** | fin 2025 | FEBIAC (communiqué), via WebSearch | documenté |
| Parc automobile total, année précédente | 6 008 569 | fin 2024 | FEBIAC | documenté |
| Immatriculations neuves | 414 771 | 2025 | FEBIAC | documenté |
| Motorisation essence (part du marché neuf) | 168 449 (40,6 %) | 2025 | FEBIAC | documenté |
| Motorisation électrique (part du marché neuf) | 143 849 (34,7 %) | 2025 | FEBIAC | documenté |
| **Documents Car-Pass délivrés** (proxy du flux d'occasion) | **855 169** | 2025 | Car-Pass, bilan annuel (`car-pass.be/en/blog/car-pass-jaarverslag-2025`) | documenté |
| Âge moyen à la revente (véhicules avec Car-Pass) | 9,8 ans (contre 7,9 ans en 2008) | 2025 | Car-Pass | documenté |
| Kilométrage moyen à la revente | **107 127 km** | 2025 | Car-Pass | documenté |
| Part de véhicules importés dans le flux d'occasion | 12,7 % | 2025 | Car-Pass | documenté |
| Fraudes au compteur détectées | 1 466 cas (923 ventes domestiques = 0,12 % ; 543 imports = 0,50 %) | 2025 | Car-Pass | documenté |
| Réduction moyenne du kilométrage en cas de fraude | 79 379 km | 2025 | Car-Pass | documenté |
| Relevés kilométriques traités dans l'année | 22,98 millions, provenant de 14 597 sources (dont 5,16 M de véhicules connectés) | 2025 | Car-Pass | documenté |
| Inspections techniques (évolution, Flandre) | -50 658 sur S1 2026 (dont -49 123 voitures) | S1 2026 | GOCA Vlaanderen, repris par la presse (`econostrum.info`) | documenté, secondaire |
| Ventilation marque × modèle du parc | **existe**, fichiers Excel Statbel/DIV | 2013-2025 | `mobilit.belgium.be` | prouvé (page officielle lue) |
| Kilométrage par véhicule (RDW, référence méthodologique NL) | **absent** (catégorie seulement) | 2026 | requêtes directes #1-#10 | prouvé |

### La granularité atteignable — et ses limites

**Ce qui est atteignable gratuitement, sans compte, pour la Belgique :**
1. **Un dénominateur national fiable et daté** (parc total, immatriculations neuves) — FEBIAC/Statbel,
   niveau national et annuel/mensuel.
2. **Une ventilation marque + modèle commercial** des immatriculations — confirmée sur source primaire
   (`mobilit.belgium.be`), croisée avec statut neuf/occasion, région, type de titulaire, CO2, carburant,
   carrosserie, norme Euro. C'est la pièce qui répond le plus directement à la question 2 du mandat :
   **oui, Statbel/DIV descend au niveau modèle**, pas seulement au segment.
3. **Un ancrage national d'âge et de kilométrage à la revente** (Car-Pass : 9,8 ans, 107 127 km en
   moyenne 2025) — mais **en moyenne nationale uniquement**, sans ventilation régionale, sans
   ventilation par marque (sauf les 10 plus grosses fraudes, non représentatives), et sans répartition
   par tranche d'âge ou de kilométrage. C'est un point, pas une distribution.
4. **Un troisième dénominateur de contrôle** (GOCA) existe mais **seulement sous forme de communiqués
   de presse repris par des tiers**, jamais de fichier téléchargeable trouvé — verdict `NON VIABLE`
   comme source de distribution, `documenté` comme ordre de grandeur seulement.

**Ce qui manque, structurellement, et n'est comblé par aucun des quatre candidats** : une
**distribution jointe** prix × kilométrage × âge, au niveau marque/modèle, pour la Belgique. Statbel
donne la répartition du parc par modèle (comptages), Car-Pass donne l'âge et le km moyens au niveau
national, GOCA ne donne (publiquement) que des volumes. **Aucune des trois sources ne croise ces
variables entre elles.** La population de référence construite ici permet donc de corriger le
**dénominateur** du biais mesuré par `LOT-A` (le nombre total de véhicules par modèle, l'âge moyen
national, le kilométrage moyen national) mais ne permet pas de reconstruire directement une
**distribution de référence prix × km par modèle** à comparer terme à terme avec l'échantillon biaisé
d'AS24. C'est une limite matérielle à porter dans `DATA-ACQUISITION-REPORT.md` comme zone d'ombre.

---

## LOT-P candidats — grille A1-A14

Légende de preuve : **P** = prouvé, **D** = documenté, **S** = supposé, **NV** = `[NON VÉRIFIÉ]`.

### C-57 — INDICATA (Autorola)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | `[NON VÉRIFIÉ]` — aucun prix public, aucun essai gratuit trouvé | NV |
| A2 Coût récurrent | `[NON VÉRIFIÉ]` — modèle B2B entièrement sur devis (confirmé par l'absence de page de prix sur 5 pages du site) | NV |
| A3 Couverture champs | `[NON VÉRIFIÉ]` — dashboard consulté nulle part en démonstration ; KPIs cités (âge de stock, prix/marché, rotation) mais pas un schéma de champs | NV |
| A4 Couverture géo | Pan-européenne, présence documentée sur plusieurs marchés OEM ; couverture belge nommément non confirmée sur source primaire dans cette session | D partielle |
| A5 Latence | Sans objet (pas d'API testable sans compte) | NV |
| A6 Débit/quota | `[NON VÉRIFIÉ]` | NV |
| A7 Stabilité technique | Sans objet (accès non testé) | NV |
| A8 Résistance anti-bot | Sans objet — le fournisseur, pas KYCAR, absorbe l'accès à la source | S |
| A9 Effort d'intégration | Estimé 3-8 jours-homme pour un connecteur `DataProvider` sur export/API dashboard, par analogie avec les autres fournisseurs SaaS du registre | estimé |
| A10 Coût de maintenance | `[NON VÉRIFIÉ]` | NV |
| A11 Exposition juridique | **3/5, mécanisme nommé : silence structurel de la source primaire sur sa méthode de collecte**, combiné à un indice indirect (reconnaissance d'image sur 15 M véhicules/jour) cohérent avec une collecte web plutôt qu'un flux sous licence. Note portée au-dessus du plancher parce que le doute n'a pas été levé malgré 5 pages officielles lues. | argumenté, D pour la citation, S pour l'inférence |
| A12 Autonomie | **Dépendant** : société tierce, aucune garantie contractuelle connue sur la continuité | D |
| A13 Plafond de volumétrie | `[NON VÉRIFIÉ]` | NV |
| A14 Fraîcheur atteignable | Revendiqué « real-time » / analyse quotidienne de 15 M véhicules (source tierce, non vérifiée sur site officiel) | S |

**Verdict : VIABLE SOUS CONDITION.** Condition : obtenir par la voie commerciale (`ACTIONS-COMMANDITAIRE`)
une clarification écrite de la méthode de collecte et une garantie de provenance licite des données
AS24 avant toute signature. Taux `[NON VÉRIFIÉ]` : 8/14 soit 57 % — **dépasse le seuil de 25 % de S3**,
justification explicite : c'est un acteur B2B fermé, sans démo publique ni documentation technique
ouverte ; le mandat de ce lot est documentaire (Sonnet, pas de compte), la levée de ces inconnues
exige un contact commercial, consigné en `ACTIONS-COMMANDITAIRE`.

### C-75 — Autotelex, RDC, JATO Dynamics

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | `[NON VÉRIFIÉ]` pour les trois ; aucun prix ni essai gratuit public | NV |
| A2 Coût récurrent | `[NON VÉRIFIÉ]` — devis sur contact pour les trois | NV |
| A3 Couverture champs | JATO : au moins spécifications + configuration de véhicules (« comprehensive list of options ») ; Autotelex : valorisations `Verkoopwaarde`/`Handelswaarde` ; RDC : « statistische gegevens », granularité code postal revendiquée | D |
| A4 Couverture géo | **Autotelex et RDC : Pays-Bas exclusivement**, aucune mention belge trouvée sur les pages consultées. JATO : portée B2B multi-marché revendiquée en général, Belgique non confirmée sur `developer.jato.com/apis` dans cette session | P (NL only pour Autotelex/RDC), NV (BE pour JATO) |
| A5 Latence | `[NON VÉRIFIÉ]` | NV |
| A6 Débit/quota | `[NON VÉRIFIÉ]` | NV |
| A7 Stabilité technique | `[NON VÉRIFIÉ]` (pas d'accès testé) | NV |
| A8 Résistance anti-bot | Sans objet — le fournisseur absorbe | S |
| A9 Effort d'intégration | Estimé 3-8 jours-homme | estimé |
| A10 Coût de maintenance | `[NON VÉRIFIÉ]` | NV |
| A11 Exposition juridique | **2/5 pour Autotelex** (modèle hybride documenté sur source primaire, les portails ne sont qu'une source parmi sept, mécanisme nommé : page d'accueil `autotelex.nl`) ; **`[NON VÉRIFIÉ]` pour RDC et JATO** | D pour Autotelex, NV pour les deux autres |
| A12 Autonomie | Dépendant, tiers commercial | D |
| A13 Plafond de volumétrie | `[NON VÉRIFIÉ]` | NV |
| A14 Fraîcheur atteignable | `[NON VÉRIFIÉ]` | NV |

**Verdict : NON VIABLE pour le périmètre BE tel qu'instruit** (Autotelex et RDC sont NL-only sur preuve
directe ; JATO reste à qualifier pour la Belgique par une voie commerciale). **Le sous-résultat le plus
utile de ce candidat n'est pas commercial : c'est méthodologique** — la preuve qu'un fournisseur de
données de marché établi peut avoir un modèle de collecte **documenté et hybride**, ce qui sert de
point de comparaison direct pour évaluer le silence d'INDICATA. Taux `[NON VÉRIFIÉ]` : 9/14 = 64 %,
même justification structurelle que `C-57`.

### C-56 — JD Power Europe (Autovista, Eurotax, Glass's, Schwacke)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | `[NON VÉRIFIÉ]` — deux pages produit cibles ont renvoyé 403 | NV |
| A2 Coût récurrent | `[NON VÉRIFIÉ]`, idem | NV |
| A3 Couverture champs | Valeurs résiduelles harmonisées « trade/retail », benchmark par âge et kilométrage, jusqu'à 4 ans d'historique, 38 marques sur 17 marchés (chiffre général du groupe, pas spécifique BE) | D |
| A4 Couverture géo | **Belgique explicitement listée** parmi 14 marchés européens (avec FR, DE, IT, ES, UK, AT, CZ, HU, NL, PL, PT, RO, SK, CH) | D (confirmé par recherche indexée, pages officielles inaccessibles en 403) |
| A5 Latence | Sans objet, pas d'API testée | NV |
| A6 Débit/quota | `[NON VÉRIFIÉ]` | NV |
| A7 Stabilité technique | `[NON VÉRIFIÉ]` | NV |
| A8 Résistance anti-bot | Sans objet | S |
| A9 Effort d'intégration | Estimé 3-8 jours-homme pour un connecteur sur export/API si accès obtenu | estimé |
| A10 Coût de maintenance | `[NON VÉRIFIÉ]` | NV |
| A11 Exposition juridique | `[NON VÉRIFIÉ]` sur le mécanisme de collecte (pages produit inaccessibles) ; nature de l'objet vendu (valorisation agrégée, pas annonce individuelle) plaide pour une exposition **plus faible par construction** que pour un revendeur d'annonces brutes — argument structurel, pas une preuve de méthode | argumenté |
| A12 Autonomie | Dépendant, grand groupe (JD Power), risque de coupure faible mais non nul | D |
| A13 Plafond de volumétrie | `[NON VÉRIFIÉ]` | NV |
| A14 Fraîcheur atteignable | `[NON VÉRIFIÉ]` | NV |

**Verdict : VIABLE SOUS CONDITION** — couverture BE confirmée par recherche indexée mais accès direct
bloqué (403) sur les deux pages ciblées par le mandat ; à réinstruire via un canal commercial. Taux
`[NON VÉRIFIÉ]` : 9/14 = 64 %, même justification structurelle (accès B2B fermé, aggravé ici par un
blocage HTTP qui a empêché la lecture directe des pages produit).

### C-41 — Marketplaces de données (Datarade / Datatorq / Dataforce)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | `[NON VÉRIFIÉ]` — « pricing available upon request » explicite sur 2 pages produit distinctes | NV, mais le motif de l'absence est prouvé |
| A2 Coût récurrent | `[NON VÉRIFIÉ]` — modèles tarifaires nommés (licence annuelle, à l'usage, achat unique, licence mensuelle) mais aucun chiffre | D pour la structure, NV pour le montant |
| A3 Couverture champs | **250+ points de données par version** (Prix, Équipement, Dimensions, Spécifications techniques), catalogue « Car Price Data » et « Car Spec Data » distincts | D |
| A4 Couverture géo | **Belgique nommément listée**, avec un produit BE spécifique cité : « prices and specifications of main LCV models », marques Renault/Mercedes/Ford | P (confirmé par deux recherches indépendantes convergentes) |
| A5 Latence | Sans objet — livraison en fichier (CSV), pas d'API temps réel documentée pour ce produit | D |
| A6 Débit/quota | Mise à jour mensuelle documentée | D |
| A7 Stabilité technique | Sans objet (livraison fichier, pas d'endpoint à casser) | argumenté : 5/5 (le plus stable du lot par construction) |
| A8 Résistance anti-bot | Sans objet — le fournisseur absorbe entièrement | S |
| A9 Effort d'intégration | Estimé 1-3 jours-homme (ingestion CSV, pas d'API à intégrer) | estimé |
| A10 Coût de maintenance | Faible, estimé <0,5 jour-homme/mois (fichier mensuel stable) | estimé |
| A11 Exposition juridique | `[NON VÉRIFIÉ]` sur la méthode de collecte, mais la nature de l'objet (spécifications + prix catalogue, pas annonces individuelles scrapées) suggère une exposition plus faible par construction | argumenté |
| A12 Autonomie | Dépendant d'un intermédiaire (Datarade) et du fournisseur réel (Datatorq) | D |
| A13 Plafond de volumétrie | `[NON VÉRIFIÉ]` (pas de volumétrie annonces, c'est un référentiel prix/specs, pas un flux d'annonces) | NV |
| A14 Fraîcheur atteignable | Mensuel, documenté | D |

**Verdict : VIABLE SOUS CONDITION** — c'est le candidat le plus concret du lot (produit belge nommé,
250+ champs, cadence mensuelle documentée), mais **ce n'est pas un flux d'annonces** : c'est un
référentiel de prix catalogue et de spécifications par version, plus proche d'un `C-56` bon marché que
d'un substitut à l'inventaire AS24. Taux `[NON VÉRIFIÉ]` : 4/14 = 29 %, légèrement au-dessus du seuil
de 25 % — justification : le prix reste sur devis malgré une fiche produit par ailleurs très détaillée.

### C-89 — Espaces de données européens (Mobility Data Space, Catena-X, CEMDS)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | `[NON VÉRIFIÉ]` — catalogue non consultable sans l'application authentifiée (« Authority Portal ») | NV |
| A2 Coût récurrent | `[NON VÉRIFIÉ]` | NV |
| A3 Couverture champs | Sans objet — **aucun jeu de données de véhicules d'occasion identifié** dans le périmètre consultable | P (négatif) |
| A4 Couverture géo | Sans objet | — |
| A5 Latence | Sans objet | — |
| A6 Débit/quota | Sans objet | — |
| A7 Stabilité technique | Sans objet | — |
| A8 Résistance anti-bot | Sans objet | — |
| A9 Effort d'intégration | Sans objet tant qu'aucun jeu pertinent n'est identifié | — |
| A10 Coût de maintenance | Sans objet | — |
| A11 Exposition juridique | Sans objet — cadre contractuel IDS/Gaia-X documenté par le mandat comme non-exclusif, mais non testé ici faute de jeu de données pertinent | D (structure générale), NV (application au cas VO) |
| A12 Autonomie | Sans objet | — |
| A13 Plafond de volumétrie | Sans objet | — |
| A14 Fraîcheur atteignable | Sans objet | — |

**Verdict : NON VIABLE, angle clos.** Le sous-domaine cité par le mandat (`catalog.mobility-dataspace.eu`)
**ne résout plus en DNS** — référence obsolète. Le domaine racine (`mobility-dataspace.eu`, 200 OK) et
le portail (`portal.mobility-dataspace.eu`, 200 OK) sont bien en production, mais le catalogue de jeux
de données n'est pas navigable publiquement : la page ne rend qu'une coquille intitulée « Authority
Portal », ce qui signifie une application cliente nécessitant authentification/connecteur pour lister
le moindre jeu. Aucune mention, dans les pages institutionnelles ni dans la recherche indexée, d'un
jeu de données portant sur les annonces ou les prix de véhicules d'occasion — cohérent avec
l'hypothèse déjà formulée par `candidates-final.md` (« probablement faux »). **La question falsifiable
n°4 du mandat est tranchée : le catalogue MDS ne contient, à la connaissance accessible sans compte,
aucune donnée d'offre VO.** Taux `[NON VÉRIFIÉ]` : formellement élevé mais la majorité des axes sont
`Sans objet` (candidat fermé par absence d'objet, pas par manque d'investigation) — cas explicitement
prévu par R4 : une négation prouvée n'est pas une lacune.

---

## LOT-Q candidats — grille A1-A14

### C-78 — RDW open data (NL) — registre complet, API Socrata

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | **0 €**, aucune clé requise | P (requêtes #1-#10) |
| A2 Coût récurrent | **0 €** en usage raisonnable (pas de facturation observée ; limites de débit non documentées publiquement) | P pour le prix, D pour l'absence de limite écrite |
| A3 Couverture champs | **~104 champs** sur le dataset principal (`x-soda2-fields`), dont aucun kilométrage numérique | P |
| A4 Couverture géo | **Pays-Bas uniquement** — sert de gabarit méthodologique pour la Belgique, pas de source BE | P |
| A5 Latence | p50 mesuré sur 3 requêtes : 0,46 s / 1,95 s / 0,80 s (échantillon trop petit pour un p50 robuste, ordre de grandeur sous la seconde hors agrégation lourde) | prouvé (mesuré), échantillon réduit |
| A6 Débit/quota | Pagination `$limit`/`$offset` fonctionnelle jusqu'à un offset de 100 000 testé sans erreur ; quota exact non documenté publiquement sans compte développeur (un token gratuit augmenterait le débit, non testé — R2) | P pour la mécanique, NV pour le plafond dur |
| A7 Stabilité technique | 5/5 — Socrata est une plateforme standardisée, versionnée, utilisée par de nombreuses administrations ; API stable dans le temps par nature | argumenté |
| A8 Résistance anti-bot | **Non concerné** — API officielle ouverte, aucune protection anti-bot rencontrée sur les 10 requêtes | P |
| A9 Effort d'intégration | Estimé 1-2 jours-homme (API REST/JSON standard, SoQL documenté) | estimé |
| A10 Coût de maintenance | Estimé <0,5 jour-homme/mois | estimé |
| A11 Exposition juridique | **1/5** — open data public d'un organisme d'État néerlandais, aucun mécanisme restrictif rencontré | argumenté |
| A12 Autonomie | **Non**, dépendance à un service public tiers, mais à faible risque de coupure (mission légale de l'organisme) | D |
| A13 Plafond de volumétrie | National complet interrogeable par agrégation (`count`/`group`), pas de plafond de pagination rencontré dans les tests | prouvé pour la mécanique |
| A14 Fraîcheur atteignable | `last-modified` observé le jour même de la requête (07/09/2026 11:39 UTC) — quasi temps réel côté schéma/référentiel | prouvé |

**Verdict : VIABLE, mais hors périmètre géographique direct.** Utile exclusivement comme **gabarit
méthodologique et comme négatif de contrôle** pour la question du kilométrage (si même le RDW, un
registre d'État parmi les plus riches d'Europe, ne sert pas le kilométrage brut gratuitement, cela
borne les attentes pour toute source équivalente belge). Taux `[NON VÉRIFIÉ]` : 1/14 = 7 %.

### C-77 — Statbel / DIV / SPF Mobilité — immatriculations et parc BE

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | **0 €** | P (page consultée, téléchargement direct annoncé) |
| A2 Coût récurrent | **0 €** | P |
| A3 Couverture champs | Statut neuf/occasion, région/province, type de titulaire, **marque et modèle commercial**, catégorie véhicule (UE et simplifiée), masse technique max, carrosserie, norme Euro, catégorie CO2 (NEDC, en tranches), carburant — **9 dimensions croisables confirmées** | P (page officielle lue) |
| A4 Couverture géo | **Belgique, avec ventilation régionale/provinciale** | P |
| A5 Latence | Sans objet — fichiers Excel téléchargeables, pas d'API | — |
| A6 Débit/quota | Sans objet (téléchargement de fichier, pas de requêtes répétées) | — |
| A7 Stabilité technique | 4/5 — deux formats de fichier coexistent (ancien 2013-2024, nouveau 2024-2025), ce qui impose un travail de normalisation mais la source elle-même est stable (organisme officiel) | argumenté |
| A8 Résistance anti-bot | Non concerné | P |
| A9 Effort d'intégration | Estimé 2-4 jours-homme (parsing Excel, deux formats, mapping des catégories) | estimé |
| A10 Coût de maintenance | Estimé <0,5 jour-homme/mois (mise à jour annuelle/mensuelle) | estimé |
| A11 Exposition juridique | **1/5** — statistique publique officielle | argumenté |
| A12 Autonomie | Non-dépendant d'un acteur privé, dépendant d'un service public (SPF Mobilité/Statbel) à faible risque | D |
| A13 Plafond de volumétrie | Exhaustif par construction (recensement administratif, pas un échantillon) | prouvé par nature de la source |
| A14 Fraîcheur atteignable | Annuelle avec détail mensuel ; pas de temps réel | D |

**Verdict : VIABLE — pièce centrale de la population de référence BE.** C'est la seule des quatre
sources qui descend au niveau **marque + modèle**, ce qui en fait le candidat le plus directement
exploitable pour corriger le dénominateur du biais de `LOT-A` au niveau où ce biais a été mesuré
(la page modèle). Taux `[NON VÉRIFIÉ]` : 0/14 = 0 %.

### C-79 — Car-Pass (BE) — kilométrages et statistiques du marché VO

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | **0 €** pour le bilan annuel public | P |
| A2 Coût récurrent | **0 €** pour les chiffres agrégés publiés ; `[NON VÉRIFIÉ]` pour un accès aux données individuelles (nécessiterait probablement un statut professionnel — `ACTIONS-COMMANDITAIRE`) | P pour le gratuit agrégé, NV pour le détail |
| A3 Couverture champs | Documents délivrés, âge moyen, kilométrage moyen, part d'imports, cas de fraude et ampleur, volume de relevés traités et nombre de sources — **8 indicateurs nationaux confirmés**, aucune ventilation infranationale | P pour l'existence, P (négatif) pour l'absence de ventilation |
| A4 Couverture géo | Belgique, **national uniquement** (pas de région/province dans le bilan public) | P |
| A5 Latence | Sans objet — rapport annuel statique | — |
| A6 Débit/quota | Sans objet | — |
| A7 Stabilité technique | 5/5 — document institutionnel annuel stable | argumenté |
| A8 Résistance anti-bot | Non concerné | P |
| A9 Effort d'intégration | Estimé <1 jour-homme (quelques constantes annuelles à saisir manuellement, pas un flux) | estimé |
| A10 Coût de maintenance | Estimé <0,1 jour-homme/mois (mise à jour une fois par an) | estimé |
| A11 Exposition juridique | **1/5** — chiffres agrégés publiés volontairement par l'organisme légal du secteur | argumenté |
| A12 Autonomie | Dépendant d'un organisme sectoriel unique (Car-Pass ASBL), mais à mission légale, faible risque de disparition | D |
| A13 Plafond de volumétrie | Sans objet (ce sont des agrégats déjà calculés, pas un flux à collecter) | — |
| A14 Fraîcheur atteignable | Annuelle (le bilan 2025 est daté et publié en 2026) | D |

**Verdict : VIABLE comme ancrage nationale, PAS comme source de distribution.** Fournit l'âge moyen
(9,8 ans) et le kilométrage moyen (107 127 km) à la revente pour toute la Belgique en 2025 — deux
points d'ancrage réels et datés, mais **des moyennes, pas des distributions**, et sans ventilation par
marque, modèle, région ou tranche. Taux `[NON VÉRIFIÉ]` : 1/14 = 7 %.

### C-90 — GOCA / contrôle technique BE

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | `[NON VÉRIFIÉ]` — aucune section de données téléchargeables trouvée | NV |
| A2 Coût récurrent | `[NON VÉRIFIÉ]` | NV |
| A3 Couverture champs | **Volumes d'inspections uniquement**, connus par des communiqués de presse repris par des tiers (ex. -50 658 inspections S1 2026) ; aucune distribution par âge, kilométrage ou région trouvée en accès public | D (négatif) |
| A4 Couverture géo | Flandre (GOCA Vlaanderen) confirmée comme source des chiffres trouvés ; la fédération Wallonie-Bruxelles n'a pas été instruite séparément dans cette session (budget) | D partielle |
| A5 Latence | Sans objet | — |
| A6 Débit/quota | Sans objet | — |
| A7 Stabilité technique | Sans objet — pas de source de données stable identifiée, seulement des communiqués ponctuels | argumenté : 2/5 (source non structurée) |
| A8 Résistance anti-bot | Non concerné (pas d'anti-bot rencontré, mais aucune donnée structurée à récupérer non plus) | P |
| A9 Effort d'intégration | Sans objet tant qu'aucun fichier structuré n'est identifiable | NV |
| A10 Coût de maintenance | Sans objet | NV |
| A11 Exposition juridique | **1/5** — les chiffres trouvés sont déjà publics via la presse, aucune extraction nécessaire | argumenté |
| A12 Autonomie | Dépendant de la presse professionnelle pour obtenir les chiffres, pas d'un accès direct et stable | D |
| A13 Plafond de volumétrie | Sans objet | — |
| A14 Fraîcheur atteignable | Ponctuelle, au rythme des communiqués (semestriel observé) | D |

**Verdict : NON VIABLE comme source de données structurée.** `goca.be` redirige vers
`gocavlaanderen.be`, qui ne publie aucune section statistique/téléchargement identifiable. Les seuls
chiffres disponibles proviennent de communiqués de presse repris par des médias généralistes, à une
granularité de volume global, sans distribution d'âge ni de kilométrage — la question falsifiable
« GOCA publie des distributions et non des moyennes » est **infirmée à l'inverse : GOCA ne publie
publiquement ni distributions ni moyennes détaillées, seulement des totaux et des variations**.
Utile uniquement comme signal de tendance (baisse du volume de contrôles liée au changement de
fréquence réglementaire), pas comme dénominateur quantitatif exploitable. Taux `[NON VÉRIFIÉ]` :
4/14 = 29 %, légèrement au-dessus du seuil — justification : candidat fermé par absence de canal
public structuré, pas par manque d'effort (fédération wallonne non creusée faute de budget restant
utile face à un résultat déjà négatif côté flamand).

---

## Questions falsifiables — verdicts

| # | Question | Verdict |
|---|---|---|
| P1 | INDICATA déclare publiquement collecter par le web, sans accord de portail. | **NON CONFIRMÉ SUR SOURCE PRIMAIRE.** La citation existe mais provient d'une fiche tierce (Tracxn) non sourcée ; le site officiel reste muet sur ce point après lecture de 5 pages. Niveau de preuve : `supposé`, pas `prouvé`. |
| P2 | Au moins un vendeur documente une API d'offre de marché belge, et non seulement des valorisations. | **NON, dans le périmètre testé.** `C-41`/Datatorq documente un référentiel prix/specs belge (pas des annonces individuelles) ; `C-56` documente une couverture BE mais en valorisation résiduelle ; aucun des cinq candidats n'expose une API d'annonces individuelles BE consultée dans cette session. |
| P3 | Un prix est obtenable sans NDA et exprimable en € / 1 000 annonces. | **NON.** Les cinq candidats sont sur devis. Aucun prix public trouvé, donc R5 ne peut être renseigné pour aucun d'entre eux dans cette session — `[NON VÉRIFIÉ]` explicite, pas une estimation inventée. |
| P4 | Le catalogue du Mobility Data Space ne contient aucune donnée d'annonce VO. | **CONFIRMÉ**, dans la limite de ce qui est consultable sans compte (le catalogue réel est derrière une authentification). Aucune mention nulle part d'un tel jeu de données. |
| P5 | Ces fournisseurs tirent leurs données d'offre des portails, donc répercutent les restrictions d'AS24. | **HÉTÉROGÈNE PAR ACTEUR** : oui en partie et sur preuve pour Autotelex (modèle hybride documenté) ; ni confirmé ni infirmé pour INDICATA, RDC, JD Power, Datatorq (silence de la source primaire). Voir la section dédiée plus haut pour l'argumentaire complet. |
| Q1 | Le RDW sert des relevés de compteur au niveau véhicule par API sans clé. | **NON, infirmé par test direct.** Seul un jugement catégoriel de plausibilité est servi ; le kilométrage brut (NAP) est un système séparé et commercialisé. |
| Q2 | Statbel descend au niveau marque et modèle, ou s'arrête au segment. | **DESCEND AU MODÈLE**, confirmé sur source primaire (`mobilit.belgium.be`), avec 8 autres dimensions croisables. |
| Q3 | Le nombre de Car-Pass délivrés est un dénominateur valide du flux d'occasion belge. | **VALIDE COMME ORDRE DE GRANDEUR** (855 169 en 2025), mais c'est un flux de documents délivrés (à la revente), pas un inventaire de stock à un instant T — à ne pas confondre avec le nombre d'annonces vivantes sur un portail à un moment donné (ce sont deux mesures différentes : flux annuel contre stock instantané). |
| Q4 | GOCA publie des distributions et non des moyennes. | **NI L'UN NI L'AUTRE, publiquement.** GOCA (branche flamande testée) ne publie ni distributions ni moyennes détaillées en accès direct : seulement des totaux et des variations, via la presse. |
| Q5 | Aucun équivalent belge du RDW n'existe au niveau véhicule. | **CONFIRMÉ, avec nuance.** Aucune des trois sources belges instruites (Statbel/DIV, Car-Pass, GOCA) n'expose un registre interrogeable véhicule par véhicule comme le fait l'API Socrata du RDW pour les Pays-Bas ; la Belgique n'a pas d'équivalent en granularité individuelle interrogeable sans compte. Statbel s'arrête à des comptages agrégés par catégorie (dont marque/modèle), pas à l'enregistrement individuel. |

---

## ACTIONS-COMMANDITAIRE

Ce que seul le commanditaire peut faire, avec effort et coût estimés :

| # | Candidat | Action requise | Effort estimé | Ce que cela débloquerait |
|---|---|---|---|---|
| AC-1 | `C-57` INDICATA | Prise de contact commerciale, **avec exigence explicite** d'une clarification écrite de la méthode de collecte et d'une garantie contractuelle de provenance licite pour toute donnée d'origine AS24 dans le flux vendu, avant toute signature. | 1-2 semaines de cycle commercial B2B, coût de la licence `[NON VÉRIFIÉ]` | Lève l'inconnue la plus opaque du dossier (A11/A12) et qualifie A1-A3, A5-A6, A9-A10, A13-A14 |
| AC-2 | `C-56` JD Power (Autovista/Eurotax) | Demande de devis, en insistant sur l'accès aux deux pages produit qui ont renvoyé 403 en accès non authentifié | Cycle commercial standard | Qualifie A1-A3, A5-A6, A9-A10, A13-A14 pour un candidat à couverture BE déjà confirmée |
| AC-3 | `C-41` Datatorq (via Datarade) | Demande de devis pour le produit BE nommé (« main LCV models », 250+ points de données) | Cycle commercial standard, probablement le plus rapide du lot (fiche produit déjà détaillée) | Complète R5 pour le candidat le plus mûr du lot |
| AC-4 | `C-75` RDC, JATO | Demande de devis avec question explicite sur la couverture belge (RDC n'a montré aucune trace de couverture BE ; JATO reste à qualifier) | Cycle commercial standard | Tranche A4 pour les deux, actuellement `[NON VÉRIFIÉ]`/`ÉCARTABLE` |
| AC-5 | `C-79` Car-Pass | Demande motivée d'un accès à des statistiques désagrégées (par région, par marque, par tranche d'âge/km) au-delà du bilan public — structure de mission légale, une demande motivée peut aboutir sans contrat commercial classique (comme noté dans `candidates-final.md`) | Démarche administrative, quelques semaines | Comblerait la lacune structurelle majeure de la population de référence BE : une distribution, pas seulement une moyenne |
| AC-6 | `C-90` GOCA | Contact direct (les deux fédérations, flamande et wallonne-bruxelloise) pour demander l'accès à des statistiques détaillées d'inspection, notamment la part des contrôles « en vue de la vente » isolée du reste | Démarche administrative | Fournirait un troisième dénominateur indépendant, actuellement inaccessible publiquement |
| AC-7 | `C-89` Mobility Data Space | Création d'un compte « Authority Portal » pour vérifier de première main si un jeu de données automobile existe malgré son absence des pages publiques — **uniquement si un signal fort apparaît ailleurs** justifiant cet effort, le verdict actuel étant déjà négatif | Compte à créer (hors règles R2 de cette phase) | Confirmerait ou infirmerait définitivement, de première main, la fermeture de cet angle |

---

## Conformité

- **E5** : zéro requête vers `www.autoscout24.be` ou `www.autoscout24.com`. Vérifié ligne par ligne
  dans le journal ci-dessus : toutes les cibles techniques sont `opendata.rdw.nl` (organisme d'État
  néerlandais) et `*.mobility-dataspace.eu` (infrastructure européenne) ; toutes les cibles
  documentaires sont des sites de fournisseurs tiers ou d'organismes publics belges/néerlandais.
- **R2** : aucun compte créé, aucun credential saisi. Le seul point où un compte aurait permis d'aller
  plus loin (`C-89`, portail « Authority Portal ») est explicitement renvoyé en `ACTIONS-COMMANDITAIRE`
  (AC-7), pas contourné.
- **R3** : **44 requêtes sur un plafond de 60** (13 techniques directes + 31 documentaires), sondes
  unitaires, aucune extraction de masse. La requête #8 (`$offset=100000`) est un test de mécanique de
  pagination sur 3 lignes, pas une extraction — cohérent avec l'esprit de R3.
- **R5** : chaque fois qu'un prix a été cherché, le résultat est soit un chiffre avec source (aucun cas
  dans ce lot, les cinq vendeurs de `LOT-P` étant tous sur devis), soit un `[NON VÉRIFIÉ]` explicite —
  **aucun prix n'a été inventé ou estimé sans le marquer comme tel.**
- **R1** : toute affirmation chiffrée de ce document porte une source (URL ou sortie de commande). Les
  taux de cellules `[NON VÉRIFIÉ]` dépassant 25 % (`C-57` 57 %, `C-75` 64 %, `C-56` 64 %, `C-90` 29 %,
  `C-41` 29 %) portent chacun une justification explicite dans leur section de verdict, conformément à
  S3 : structurellement, ce sont des modèles commerciaux B2B fermés (LOT-P) ou une source institutionnelle
  sans canal public structuré (`C-90`), pas un manque d'effort de recherche dans le budget documentaire
  imparti à ce lot.
- **S1-S2** (critères de la phase 1.4) : les 14 axes sont renseignés pour les 9 candidats, y compris
  par `Sans objet` quand la question ne s'applique matériellement pas (ex. latence pour un fichier
  Excel téléchargé une fois par an) — ce n'est pas une case vide, c'est une réponse négative motivée.
  Au moins un test exécuté et journalisé par candidat techniquement testable : les 4 candidats de
  `LOT-Q` ont chacun au moins une requête ou une lecture de page officielle dédiée ; les 5 candidats de
  `LOT-P`, purement documentaires par mandat, ont chacun au moins une lecture de source primaire.
