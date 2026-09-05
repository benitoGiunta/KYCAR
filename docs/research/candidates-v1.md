# candidates-v1.md — Inventaire exhaustif des voies d'acquisition (phase 1.1, agent `sweep-1`)

**Statut** : inventaire brut. **Aucune notation, aucun classement, aucun écartement.**
Chaque fiche est une hypothèse d'accès à documenter/tester en phase 1.4.

**Portée** : charger l'inventaire d'annonces de voitures d'occasion AutoScout24, priorité Belgique
(`autoscout24.be`, bilingue `/fr/` + `/nl/`), avec un modèle de données multi-pays (BE/FR/DE/LU/NL).

## Journal des sondes de reconnaissance exécutées (respect de R3 — 5 requêtes max vers autoscout24.be)

| # | Requête | Résultat |
|---|---|---|
| 1 | `curl https://www.autoscout24.be/robots.txt` (corps) | HTTP 200, 108 lignes |
| 2 | même URL, mesure du code HTTP | `200` |
| 3 | même URL, capture complète + `grep -i sitemap` | **aucune directive `Sitemap:`** dans le fichier |
| 4 | `curl -o /dev/null https://www.autoscout24.be/sitemap.xml` | `http=404 size=19840 type=text/html` |
| 5 | `curl -o /dev/null https://www.autoscout24.be/sitemaps/sitemap-index.xml` | `http=404 size=19840 type=text/html` |

Quota R3 vers `autoscout24.be` : **5/5 consommées**. Aucune autre requête émise vers ce domaine.

### Extrait de preuve — `robots.txt` de `www.autoscout24.be` (récupéré le 2026-09-06, commentaire de fin `#MG, 20.08.2026`)

Blocs notables, cités verbatim :

```
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
Disallow: /
```

```
Allow: /fr/informer/
Allow: /fr/voiture/
Allow: /nl/auto/
Allow: /evaluationvoiture/
Allow: /prijsschatting/
```

```
User-agent: *
...
Disallow: /lst?
Disallow: /lst/?
Disallow: /nl/lst?
Disallow: /fr/lst?
Disallow: /classified-list/react-listelements
Disallow: /classified-detail/recommendations
Disallow: /classified-detail/navigation/
Disallow: /as24-search-funnel/api/vip-showroom
Disallow: /as24-search-funnel/direct-finance-api-query
Disallow: /as24-search-funnel/details/
Disallow: /as24-search-funnel/dealer-certification/
Disallow: /listing-search-api/graphql
Disallow: /api/dealer-detail/direct-finance-api-query
Disallow: /ocs/api/graphql
Disallow: /search-subscriptions/api/new-results-count
Disallow: /dealer-detail/
Disallow: /dealer-statistics
Disallow: /dealerarea/
Disallow: /haendler/   /autobedrijven/   /garages/   /profesionales/   /concessionari/   /dealerinfo/   /professional/
Disallow: /smyle/details/
Disallow: /listing-creation-entry-point
Disallow: /listing-form/
Disallow: /partner-experience/
Disallow: /frontend-metrics
Disallow: /favorites
Disallow: /account
Disallow: /cockpit/
```

Ce fichier est en lui-même une **carte d'endpoints internes** : il nomme explicitement
`/listing-search-api/graphql`, `/ocs/api/graphql`, `/search-subscriptions/api/new-results-count`,
`/classified-list/react-listelements` et `/as24-search-funnel/api/vip-showroom`. Ces noms
alimentent les candidats C-09 à C-14.

### Correction factuelle portée au brief de mission

Le brief supposait que **Mobile.de appartient au même groupe qu'AutoScout24**. Les sources
consultées disent le contraire, et cela change la nature du candidat « source alternative
substituable » :

- AutoScout24 a été racheté à Scout24 AG par **Hellman & Friedman** (2020) ; le groupe possède
  **LeasingMarkt.de** (2020), **AUTOproff** (2022, B2B wholesale) et **Trader Corporation /
  AutoTrader.ca / AutoHebdo.net** (fin 2024), plus **Smyle**.
- **Mobile.de** est opéré par mobile.de GmbH, ligne Adevinta / Kleinanzeigen — donc un **groupe
  distinct**, ce qui explique qu'il expose, lui, une **Search API officielle documentée
  publiquement** (voir C-42).
- **heycar** est une coentreprise constructeurs (VW/Renault), également hors groupe AutoScout24.
- **Vroom.be** appartient à **Mobly** (Belgique), hors groupe AutoScout24.

Sources : https://hf.com/portfolio/autoscout24/ , https://www.autoscout24.com/company/press-releases/autoscout24-to-acquire-a-majority-stake-in-digital-wholesale-platform-autoproff/ , https://www.thomabravo.com/press-releases/autoscout24-finalizes-agreement-to-acquire-trader-corporation , https://services.mobile.de/ , https://pitchbook.com/profiles/company/125997-04

---

# Fiches candidats

## Famille 1 — API officielles AutoScout24

### C-01 — AutoScout24 SEARCH API (officielle, GraphQL, commerciale)
- **Famille** : 1 — API officielles AutoScout24
- **Mécanique** : AutoScout24 commercialise depuis son portail concessionnaires allemand une « SEARCH API » présentée comme un accès GraphQL aux données de marché : attributs véhicule, tendances de prix, durée de mise en ligne, analyse régionale, « des millions d'annonces ». Contractualisation par email/téléphone, pas de self-service. C'est le seul canal officiel qui prétende exposer de la **lecture** d'inventaire.
- **Point d'entrée connu** : page produit `https://www.autoscout24.de/haendlerportal/schnittstelle-search-api/` ; contact `searchapi@autoscout24.com`, +49 89 44456-1000. Endpoint GraphQL réel : à identifier (probablement sous `*.api.autoscout24.com` ou `portal.services.as24.tech`).
- **Questions falsifiables à tester en 1.4** :
  - « La SEARCH API expose l'inventaire **complet** du marché, pas seulement l'inventaire du concessionnaire titulaire du contrat. » (peut être fausse)
  - « Le périmètre pays adressable inclut la Belgique (`.be`), pas seulement `.de`. »
  - « Il existe une grille tarifaire publique ou obtenable sans NDA. »
  - « L'accès est ouvert à une entité non-concessionnaire (éditeur d'application analytique). »
- **Sources** : https://www.autoscout24.de/haendlerportal/schnittstelle-search-api/ ; https://scrapfly.io/blog/posts/how-to-scrape-autoscout24

### C-02 — AutoScout24 Listing Creation API (officielle, write-only)
- **Famille** : 1 — API officielles AutoScout24
- **Mécanique** : API REST documentée publiquement (Swagger) qui gère le cycle de vie d'une annonce pour un concessionnaire enregistré : création, upload d'images, publication, mise à jour, suppression. Plusieurs sources la qualifient de *write-only* : ni endpoint de recherche, ni endpoint de navigation.
- **Point d'entrée connu** : `https://listing-creation.api.autoscout24.com/docs` ; spec brute `https://listing-creation.api.autoscout24.com/assets/swagger/spec/index.html` ; redirection historique `https://autoscout24.github.io/api/`
- **Questions falsifiables à tester en 1.4** :
  - « La spec OpenAPI ne contient **aucun** verbe `GET` de collection permettant de relire un inventaire, même le sien. » (à vérifier dans le YAML, pas sur la foi des blogs)
  - « Aucun endpoint de cette API n'est appelable sans clé concessionnaire. »
  - « La spec ne référence aucun autre service AS24 lisible (host voisin, `$ref` externe). »
- **Sources** : https://listing-creation.api.autoscout24.com/docs ; https://listing-creation.api.autoscout24.com/assets/swagger/spec/index.html ; https://scrapfly.io/blog/posts/how-to-scrape-autoscout24

### C-03 — AutoScout24 Listing Distribution API (spec partenaire publiée sur GitHub)
- **Famille** : 1 — API officielles AutoScout24
- **Mécanique** : le dépôt `smg-automotive/autoscout24-api-specs` se présente comme le dépôt des specs « Public and Partners' AutoScout24 API ». Il contient notamment `openapi-listing-distribution.yaml` — donc un contrat d'API de **distribution d'annonces** —, plus `openapi.yaml`, `openapi-fs24.yaml`, `openapi-swiftcourt.yaml`.
- **Point d'entrée connu** : `https://github.com/smg-automotive/autoscout24-api-specs` (fichiers YAML lisibles sans compte) ; portail associé `https://portal.services.as24.tech/api-docs`
- **Questions falsifiables à tester en 1.4** :
  - « `openapi-listing-distribution.yaml` décrit un flux **sortant** (AS24 → partenaire) d'annonces, et pas seulement un flux entrant. »
  - « Les `servers:` déclarés dans ces YAML pointent vers des hosts réellement joignables depuis Internet. »
  - « Ces specs couvrent le périmètre pan-européen et non uniquement le périmètre SMG / Suisse. »
- **Sources** : https://github.com/smg-automotive/autoscout24-api-specs ; https://portal.services.as24.tech/api-docs

### C-04 — Portail développeurs AutoScout24.ch / SMG Swiss Marketplace Group
- **Famille** : 1 — API officielles AutoScout24
- **Mécanique** : `autoscout24.ch` est opéré par SMG Swiss Marketplace Group, sur un **backend entièrement différent** du reste du groupe (fait confirmé indirectement : les scrapers commerciaux excluent `.ch` de leurs recherches par filtre). SMG publie un portail développeurs avec API Reference, Swagger UI et specs OpenAPI, et des guides de migration depuis « HCI JSON APIs » et « DMS APIs ».
- **Point d'entrée connu** : `https://developers.autoscout24.ch/` ; specs `https://github.com/smg-automotive/autoscout24-api-specs`
- **Questions falsifiables à tester en 1.4** :
  - « Le portail SMG expose une API de **recherche/lecture** d'annonces (pas seulement upload DMS concessionnaire). »
  - « Une clé d'API SMG donne accès à des données au-delà du périmètre suisse. » (probablement fausse — à prouver)
  - « Les anciennes "HCI JSON APIs" ont des endpoints encore vivants et non authentifiés. »
- **Sources** : https://developers.autoscout24.ch/ ; https://apify.com/memo23/autoscout24-scraper ; https://github.com/smg-automotive/autoscout24-api-specs

### C-05 — API concessionnaire de statistiques / performance (analogue « Insights »)
- **Famille** : 1 — API officielles AutoScout24
- **Mécanique** : le `robots.txt` BE bloque `/dealer-statistics`, `/dealer-rating/`, `/cockpit/`, `/partner-experience/` — signe qu'un espace concessionnaire expose des métriques (impressions, vues, positionnement concurrentiel). Le concurrent direct mobile.de documente publiquement une « Insights API » qui compare une annonce à des véhicules similaires : l'existence d'un équivalent AS24 est plausible et à vérifier.
- **Point d'entrée connu** : `https://www.autoscout24.be/dealer-statistics`, `https://www.autoscout24.be/cockpit/` (accès à identifier) ; analogue documenté : `https://services.mobile.de/docs/insights-api.html`
- **Questions falsifiables à tester en 1.4** :
  - « AutoScout24 expose une API de type Insights, documentée, listable sans compte. »
  - « Ces endpoints répondent en 401/403 et non en 404, ce qui prouverait leur existence. »
  - « Les données Insights contiennent des agrégats de marché (distribution de prix par modèle) exploitables sans posséder d'annonces. »
- **Sources** : sonde robots.txt ci-dessus ; https://services.mobile.de/docs/insights-api.html

---

## Famille 2 — Endpoints internes du front web

### C-06 — `__NEXT_DATA__` des pages de recherche `/lst`
- **Famille** : 2 — Endpoints internes du front web
- **Mécanique** : le front AutoScout24 est une application Next.js ; chaque page de résultats intègre un `<script id="__NEXT_DATA__">` contenant l'intégralité du payload en JSON. Sur une page de recherche (~255 KB), `props.pageProps.listings` contient un tableau de 20 annonces, `props.pageProps.numberOfResults` le total, `props.pageProps.numberOfPages` le nombre de pages. Une requête HTTP = 20 annonces structurées, sans rendu JS.
- **Point d'entrée connu** : `https://www.autoscout24.be/{fr|nl}/lst?atype=C&cy=B&sort=standard&ustate=N%2CU&page=N` (schéma `.com` documenté : `https://www.autoscout24.com/lst?atype=C&cy=D&...&page=1`)
- **Questions falsifiables à tester en 1.4** :
  - « La pagination est plafonnée à 20 pages × 20 annonces = 400 annonces par requête. » — **les sources se contredisent** : Scrapfly annonce 200 pages / 4 000 annonces, roundproxies documente `page=1..20`. Ce désaccord doit être tranché par mesure.
  - « `numberOfResults` est exact et non arrondi/plafonné. »
  - « Le contournement du plafond par découpage de facettes (marque × modèle × tranche de prix × code postal) permet d'atteindre l'inventaire BE complet. »
  - « `props.pageProps.listings` sur `.be` porte les mêmes champs que sur `.com`. »
- **Sources** : https://scrapfly.io/blog/posts/how-to-scrape-autoscout24 ; https://roundproxies.com/blog/scrape-autoscout24/ ; https://scrape.do/blog/autoscout24-scraping/

### C-07 — `__NEXT_DATA__` des pages de détail d'annonce
- **Famille** : 2 — Endpoints internes du front web
- **Mécanique** : sur une page d'annonce (~134 KB), `props.pageProps.listingDetails` porte la fiche complète : valeurs numériques brutes (`priceRaw`, `mileageInKmRaw`), listes d'équipements, galerie d'images, bloc contact vendeur. C'est la source la plus riche en champs par annonce, au prix d'une requête par annonce.
- **Point d'entrée connu** : `https://www.autoscout24.com/offers/{slug}` ; slugs localisés : `/angebote/` (DE/AT), `/annunci/` (IT) ; à identifier pour `.be` (`/fr/...`, `/nl/...`)
- **Questions falsifiables à tester en 1.4** :
  - « `listingDetails` couvre au moins 30 des 40 champs du dictionnaire cible. »
  - « Le slug de détail belge est déductible du champ `url` renvoyé par la page de recherche, sans requête supplémentaire. »
  - « Le bloc contact vendeur peut être ignoré côté parseur sans casser la désérialisation (contrainte RGPD H3). »
- **Sources** : https://scrapfly.io/blog/posts/how-to-scrape-autoscout24 ; https://apify.com/memo23/autoscout24-scraper

### C-08 — Routes de données Next.js `/_next/data/{buildId}/....json`
- **Famille** : 2 — Endpoints internes du front web
- **Mécanique** : une application Next.js à pages sert, pour chaque route, un JSON équivalent à `__NEXT_DATA__` sous `/_next/data/{buildId}/{locale}/{route}.json`. Si AutoScout24 l'expose, on obtient le même payload sans HTML, à un coût réseau bien plus faible. Le `buildId` est lisible dans `__NEXT_DATA__` et change à chaque déploiement.
- **Point d'entrée connu** : à identifier — forme attendue `https://www.autoscout24.be/_next/data/{buildId}/fr/lst.json?...`. Non listé dans `robots.txt`.
- **Questions falsifiables à tester en 1.4** :
  - « Les routes `/_next/data/` existent et renvoient 200 avec le payload de recherche. » (peut être fausse : App Router ou export statique la supprime)
  - « Le `buildId` est présent dans `__NEXT_DATA__.buildId` et suffit à construire l'URL. »
  - « Ces routes sont moins surveillées par Akamai que les pages HTML. »
- **Sources** : https://roundproxies.com/blog/scrape-autoscout24/ ; https://scrapfly.io/blog/posts/how-to-scrape-autoscout24 ; sonde robots.txt ci-dessus

### C-09 — Endpoint GraphQL interne `/listing-search-api/graphql`
- **Famille** : 2 — Endpoints internes du front web
- **Mécanique** : le `robots.txt` belge interdit explicitement `/listing-search-api/graphql`. Un tel chemin, nommé « listing search api », est très probablement le backend GraphQL qui alimente les pages `/lst`. S'il accepte des requêtes arbitraires (ou au moins des requêtes persistées connues), il donne l'accès direct à la recherche avec un contrôle total de la pagination et des champs.
- **Point d'entrée connu** : `https://www.autoscout24.be/listing-search-api/graphql` (et son équivalent sur chaque TLD du groupe)
- **Questions falsifiables à tester en 1.4** :
  - « L'endpoint répond à une requête POST GraphQL non authentifiée. »
  - « L'introspection GraphQL est activée. » (probablement fausse en production — à prouver)
  - « Il accepte des requêtes libres et non uniquement des `sha256Hash` de requêtes persistées. »
  - « Sa pagination n'est pas plafonnée aux mêmes 20/200 pages que le front. »
- **Sources** : sonde `robots.txt` autoscout24.be (extrait ci-dessus) ; https://www.autoscout24.de/haendlerportal/schnittstelle-search-api/ (confirme qu'AS24 fait du GraphQL)

### C-10 — Endpoint GraphQL interne `/ocs/api/graphql`
- **Famille** : 2 — Endpoints internes du front web
- **Mécanique** : second endpoint GraphQL nommé dans le `robots.txt` belge, distinct du précédent. « OCS » est à décoder (Online Car Sales ? Offer/Content Service ?). Un second schéma GraphQL peut exposer des données de catalogue, de valorisation ou de contenu éditorial utiles au dictionnaire de champs.
- **Point d'entrée connu** : `https://www.autoscout24.be/ocs/api/graphql`
- **Questions falsifiables à tester en 1.4** :
  - « `/ocs/api/graphql` répond 200/400 (donc existe) et non 404. »
  - « Son schéma est différent de celui de `/listing-search-api/graphql`. »
  - « Il expose des données d'annonces et non seulement du contenu CMS. »
- **Sources** : sonde `robots.txt` autoscout24.be (extrait ci-dessus)

### C-11 — Fragments SSR de liste : `/classified-list/react-listelements`
- **Famille** : 2 — Endpoints internes du front web
- **Mécanique** : chemin interdit au crawl, dont le nom indique un endpoint qui rend les *éléments de liste* de résultats — vestige ou brique d'une architecture de rendu par fragments. Un tel endpoint renvoie souvent du HTML partiel ou du JSON de liste avec une pagination propre, hors du plafond de la page de recherche.
- **Point d'entrée connu** : `https://www.autoscout24.be/classified-list/react-listelements` ; voisins de la même famille : `/seals/classified-list-item`, `/seals/classified-detail`, `/classified-detail/recommendations`, `/classified-detail/navigation/`
- **Questions falsifiables à tester en 1.4** :
  - « Cet endpoint est encore actif et accepte des paramètres de recherche. »
  - « `/classified-detail/recommendations` renvoie une liste d'annonces similaires exploitable comme mécanisme de découverte par voisinage (graphe d'annonces). »
  - « `/classified-detail/navigation/` renvoie l'annonce précédente/suivante d'une recherche, permettant une énumération séquentielle. »
- **Sources** : sonde `robots.txt` autoscout24.be (extrait ci-dessus)

### C-12 — Oracle de comptage `/search-subscriptions/api/new-results-count`
- **Famille** : 2 — Endpoints internes du front web
- **Mécanique** : endpoint lié aux recherches sauvegardées, qui renvoie un **nombre de nouveaux résultats** pour un jeu de critères. Même s'il ne renvoie pas les annonces, un oracle de comptage rapide et non plafonné permet (a) de reconstruire des distributions par dichotomie sur les facettes prix/année/km — ce qui est exactement le produit visé par KYCAR mode 1 — et (b) de piloter un découpage optimal des requêtes de C-06.
- **Point d'entrée connu** : `https://www.autoscout24.be/search-subscriptions/api/new-results-count`
- **Questions falsifiables à tester en 1.4** :
  - « Cet endpoint est appelable sans session authentifiée. »
  - « Il accepte un jeu de critères arbitraire et renvoie un compte exact (non plafonné, non arrondi). »
  - « Le compte renvoyé est cohérent avec `numberOfResults` de la page HTML pour les mêmes critères. »
- **Sources** : sonde `robots.txt` autoscout24.be (extrait ci-dessus)

### C-13 — API vitrine concessionnaire : `/as24-search-funnel/api/vip-showroom` et `/api/dealer-detail/...`
- **Famille** : 2 — Endpoints internes du front web
- **Mécanique** : le `robots.txt` bloque `/as24-search-funnel/api/vip-showroom`, `/as24-search-funnel/details/`, `/api/dealer-detail/direct-finance-api-query`, `/dealer-detail/`, et les pages concessionnaires localisées (`/garages/`, `/autobedrijven/`, `/concessionari/`…). L'inventaire national peut être reconstruit **par concessionnaire** : énumérer les garages, puis paginer le stock de chacun. Un service tiers (Anysite) commercialise déjà exactement cette primitive, ce qui prouve indirectement qu'elle existe.
- **Point d'entrée connu** : `https://www.autoscout24.be/as24-search-funnel/api/vip-showroom` ; `https://www.autoscout24.be/dealer-detail/...` ; primitive tierce équivalente : `POST https://api.anysite.io/api/autoscout24/dealers/listings` (paramètre `dealer` = slug)
- **Questions falsifiables à tester en 1.4** :
  - « L'endpoint vitrine renvoie l'inventaire complet d'un concessionnaire sans plafond de 400/4 000 annonces. »
  - « Il existe un moyen d'énumérer exhaustivement les slugs concessionnaires belges. »
  - « La part de l'inventaire BE détenue par des professionnels (donc couverte par cette voie) est majoritaire — le reste étant des annonces de particuliers non rattachées à un garage. »
- **Sources** : sonde `robots.txt` autoscout24.be ; https://docs.anysite.io/api-reference/autoscout24/autoscout24dealerslistings

### C-14 — Pages SEO explicitement autorisées : `/fr/voiture/{marque}/{modèle}` et `/nl/auto/...`
- **Famille** : 2 — Endpoints internes du front web
- **Mécanique** : le `robots.txt` **autorise** nommément `/fr/voiture/`, `/nl/auto/`, `/fr/informer/`, `/nl/informeren/`, ainsi que `/evaluationvoiture/` et `/prijsschatting/`. Ce sont des pages de contenu marque/modèle/carrosserie qui affichent des agrégats (prix moyens, modèles disponibles, alternatives) — exactement la granularité du mode 1 de KYCAR — et dont le crawl est contractuellement toléré.
- **Point d'entrée connu** : `https://www.autoscout24.be/fr/voiture/`, `https://www.autoscout24.be/fr/voiture/kgm/`, `https://www.autoscout24.be/nl/auto/carrosserie/hatchback/`
- **Questions falsifiables à tester en 1.4** :
  - « Ces pages autorisées contiennent, dans leur `__NEXT_DATA__`, des agrégats chiffrés (nb d'offres, fourchettes de prix) par couple marque/modèle. »
  - « L'ensemble des couples marque/modèle est énumérable en suivant uniquement des chemins autorisés par `robots.txt`. »
  - « Les agrégats affichés sont calculés sur le périmètre BE et pas sur un périmètre pan-européen. »
- **Sources** : sonde `robots.txt` autoscout24.be ; https://www.autoscout24.be/fr/voiture/ ; https://www.autoscout24.be/nl/auto/carrosserie/hatchback/

---

## Famille 3 — Endpoints de l'application mobile

### C-15 — API GraphQL mobile interne (requêtes persistées)
- **Famille** : 3 — Endpoints de l'application mobile
- **Mécanique** : un acteur commercial (memo23 sur Apify) déclare utiliser « l'API GraphQL mobile interne d'AutoScout24 » comme chemin **primaire** (pur HTTP + JSON, sans navigateur, ~150 annonces en moins de 30 s), avec repli sur `__NEXT_DATA__` « si l'API mobile renvoie des erreurs, par exemple des hashes de requêtes persistées rotés ». C'est la preuve la plus forte de l'existence d'un endpoint mobile lisible, avec un mécanisme APQ (`sha256Hash`) à extraire du binaire.
- **Point d'entrée connu** : à identifier (host distinct de `www.autoscout24.be` ; candidats `*.api.autoscout24.com` / `*.as24.tech`). Marqueur d'existence : mention explicite de « rotated persisted-query hashes ».
- **Questions falsifiables à tester en 1.4** :
  - « Un endpoint GraphQL mobile répond sans authentification utilisateur (seule une clé/app-id statique est requise). »
  - « Les hashes de requêtes persistées tournent à chaque release d'app, ce qui impose un pipeline de re-extraction. »
  - « Cette API n'applique pas le plafond de pagination du front web. »
  - « Elle couvre le périmètre `.be` et pas seulement `.de`. »
- **Sources** : https://apify.com/memo23/autoscout24-scraper ; https://scrapfly.io/blog/posts/how-to-scrape-autoscout24

### C-16 — Reverse engineering de l'app (APK Android / IPA iOS) pour cartographier les endpoints
- **Famille** : 3 — Endpoints de l'application mobile
- **Mécanique** : installer l'app, intercepter le trafic TLS avec mitmproxy (certificat local, `apk-mitm` pour neutraliser le certificate pinning sur Android 7+), et journaliser hosts, headers, tokens et hashes APQ. Méthode documentée pour ce cas d'usage précis (marketplaces de voitures d'occasion). Alternative statique : décompiler l'APK et grepper les URLs et les documents GraphQL.
- **Point d'entrée connu** : `com.autoscout24` (Google Play), `id311785642` (App Store), `ch.autoscout24.autoscout24` (variante SMG Suisse) ; outillage `https://mitmproxy.org/`, `apk-mitm`
- **Questions falsifiables à tester en 1.4** :
  - « L'app n'utilise pas de certificate pinning strict, ou celui-ci est neutralisable par `apk-mitm`. »
  - « Les documents GraphQL complets sont présents en clair dans l'APK, ce qui rendrait la rotation de hash contournable. »
  - « Les headers d'authentification de l'app sont statiques (clé embarquée) plutôt que dérivés d'une attestation d'intégrité (Play Integrity / App Attest). »
- **Sources** : https://eherreros.com/scraping/scraping-used-cars-api/ (référencée par la recherche ; **domaine non résolu à la date de la sonde — `[NON VÉRIFIÉ]`**) ; https://github.com/user1342/Awesome-Android-Reverse-Engineering ; https://play.google.com/store/apps/details?id=com.autoscout24 ; https://apps.apple.com/us/app/autoscout24-buying-leasing/id311785642

---

## Famille 4 — Flux partenaires et syndication

### C-17 — Iframe / vitrine embarquable fournie aux concessionnaires
- **Famille** : 4 — Flux partenaires et syndication
- **Mécanique** : AutoScout24 fournit aux concessionnaires un lien iframe à poser sur leur propre site pour afficher leur stock courant. Cet iframe est servi par un host AutoScout24, sur une URL paramétrée par identifiant concessionnaire — donc un rendu d'inventaire potentiellement plus permissif que le front principal, et déjà conçu pour être appelé depuis des origines tierces.
- **Point d'entrée connu** : à identifier (URL de l'iframe côté AS24) ; documentation intermédiaire : `https://www.wp-dealer.com/autoscout24-wordpress-integration/`, `https://carsyncpro.com/blog/autoscout24-plugin-for-wordpress-for-car-dealers/`
- **Questions falsifiables à tester en 1.4** :
  - « L'URL de l'iframe est devinable/énumérable à partir d'un identifiant concessionnaire public. »
  - « L'iframe est servi sans vérification de `Referer`/`Origin`. »
  - « Le HTML de l'iframe contient les champs structurés utiles, pas seulement un rendu visuel. »
- **Sources** : https://www.wp-dealer.com/autoscout24-wordpress-integration/ ; https://carsyncpro.com/blog/autoscout24-plugin-for-wordpress-for-car-dealers/ ; https://sayhello.ch/en/portfolio/auto-kaempf/

### C-18 — Plateformes de multidiffusion d'annonces comme canal indirect
- **Famille** : 4 — Flux partenaires et syndication
- **Mécanique** : des éditeurs (AutoPult, Autaxo, SyncSpider, WPdealer, CarSyncPro, Automotive Feed Import) sont branchés sur l'API officielle AS24 et savent **importer** l'inventaire depuis un ou plusieurs comptes concessionnaires AS24 vers un site tiers. Ils opèrent donc déjà une lecture d'inventaire via des droits contractuels ; leur offre d'import est un point d'accès potentiel (revente, mode agrégé, ou spec de leur propre API).
- **Point d'entrée connu** : `https://autopult.de/en/multi-listing/` ; `https://autaxo.de/en/features/marketplace-integrations/` ; `https://syncspider.com/integrations/autoscout24/` ; `https://wordpress.org/plugins/automotive-feed-import/`
- **Questions falsifiables à tester en 1.4** :
  - « Au moins un de ces éditeurs expose une API de lecture d'inventaire AS24 accessible à un tiers non concessionnaire. »
  - « L'import multi-comptes est techniquement un `GET` sur une API AS24 documentée, dont le nom est identifiable dans leur documentation. »
  - « Le code source du plugin WordPress libre (`automotive-feed-import`) révèle l'endpoint AS24 réellement appelé. »
- **Sources** : https://autopult.de/en/multi-listing/ ; https://autaxo.de/en/features/marketplace-integrations/ ; https://syncspider.com/integrations/autoscout24/ ; https://wordpress.org/plugins/automotive-feed-import/ ; https://www.aishoppingfeeds.com/channels/autoscout24/

### C-19 — Spécification de feed concessionnaire CSV/XML (voie « devenir partenaire technique »)
- **Famille** : 4 — Flux partenaires et syndication
- **Mécanique** : AutoScout24 accepte des feeds concessionnaires en CSV et via API ; un générateur XML tiers pour AS24 existe en open source. La spec de ce format décrit le dictionnaire de champs canonique d'AS24. Voie d'accès : obtenir le statut de fournisseur technique (TSP) ou de partenaire de distribution, ce qui ouvre en général un canal bidirectionnel.
- **Point d'entrée connu** : `https://github.com/MarcoAcquaviva/Autoscout24-XML` ; `https://www.aishoppingfeeds.com/channels/autoscout24/` ; formulaire partenaire à identifier sur `service.autoscout24.com/dealer/`
- **Questions falsifiables à tester en 1.4** :
  - « La spec de feed AS24 est publique et fournit le dictionnaire de champs complet (utile même sans accès aux données). »
  - « Le statut de partenaire technique est ouvert à un éditeur qui n'apporte pas d'inventaire. »
  - « Le canal partenaire inclut un flux descendant (annonces du marché) et pas seulement un flux montant. »
- **Sources** : https://github.com/MarcoAcquaviva/Autoscout24-XML ; https://www.aishoppingfeeds.com/channels/autoscout24/ ; https://service.autoscout24.com/dealer/s/?language=en_US

### C-20 — Propriétés du groupe AutoScout24 : AUTOproff, LeasingMarkt.de, Smyle, Trader Corp.
- **Famille** : 4 — Flux partenaires et syndication
- **Mécanique** : le groupe possède la plateforme d'enchères B2B **AUTOproff** (2022), **LeasingMarkt.de** (2020), **Smyle** (abonnement auto ; `robots.txt` BE bloque `/smyle/details/`) et **Trader Corporation** (AutoTrader.ca, AutoHebdo.net, depuis fin 2024). Ces propriétés partagent probablement des briques de données et exposent chacune leurs propres API/feeds, potentiellement moins durcis que le front AS24.
- **Point d'entrée connu** : `https://www.autoproff.com/` ; `https://www.leasingmarkt.de/` ; `https://www.autoscout24.be/smyle/details/` ; `https://www.autotrader.ca/`
- **Questions falsifiables à tester en 1.4** :
  - « Au moins une propriété du groupe expose une API de recherche publique documentée. »
  - « Les annonces AUTOproff/LeasingMarkt recoupent l'inventaire AS24 (mêmes identifiants d'annonce). »
  - « Le périmètre géographique de ces propriétés couvre la Belgique. » (probablement faux pour LeasingMarkt et Trader — à prouver)
- **Sources** : https://www.autoscout24.com/company/press-releases/autoscout24-to-acquire-a-majority-stake-in-digital-wholesale-platform-autoproff/ ; https://www.thomabravo.com/press-releases/autoscout24-finalizes-agreement-to-acquire-trader-corporation ; https://autovista24.autovistagroup.com/news/autoscout24-expands-portfolio-majority-stake-automotive-business/ ; sonde robots.txt (`/smyle/details/`)

### C-21 — Régie publicitaire AutoScout24 Media (spécifications techniques publiques)
- **Famille** : 4 — Flux partenaires et syndication
- **Mécanique** : AS24 publie un PDF « Technical Specifications — AS24 Media » destiné aux annonceurs. Les kits média décrivent souvent les paramètres de ciblage disponibles (marque, modèle, segment de prix, géographie), ce qui révèle la taxonomie interne et parfois des endpoints de ciblage/inventaire publicitaire interrogeables.
- **Point d'entrée connu** : `https://assets.ctfassets.net/uaddx06iwzdz/4lLemsUJchDpmUMHSo6ngl/86ac842804472d325a9af2bee896761c/20200729_TechnicalSpecifications_AS24Media_EN.pdf`
- **Questions falsifiables à tester en 1.4** :
  - « Le kit média expose des volumes d'inventaire par pays/marque/segment utilisables comme référence de complétude. »
  - « Il nomme des endpoints ou des paramètres d'URL de ciblage réutilisables. »
  - « L'espace Contentful `uaddx06iwzdz` sert d'autres documents AS24 énumérables. »
- **Sources** : https://assets.ctfassets.net/uaddx06iwzdz/4lLemsUJchDpmUMHSo6ngl/86ac842804472d325a9af2bee896761c/20200729_TechnicalSpecifications_AS24Media_EN.pdf

---

## Famille 5 — API tierces de scraping managé

### C-22 — Apify : catalogue d'acteurs AutoScout24 (pay-per-result)
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : une douzaine d'acteurs concurrents ciblent AS24 sur Apify, appelables en REST/MCP, facturés à l'événement. L'acteur `memo23` annonce 0,90 $/1 000 résultats, 9 pays (DE/AT/LU/IT/ES/FR/BE/NL/.com), 99,6 % de runs réussis, `.ch` non supporté par filtre ; `solidcode` annonce 0,80 $/1 000. D'autres exposent des exemples préconfigurés (leads concessionnaires, monitoring de nouvelles annonces, voitures < 5 000 €).
- **Point d'entrée connu** : `https://apify.com/memo23/autoscout24-scraper` ; `https://apify.com/solidcode/autoscout24-scraper/api` ; `https://apify.com/automation-lab/autoscout24-scraper` ; `https://apify.com/scrapesage/autoscout24-scraper` ; `https://apify.com/rigelbytes/autoscout24-scraper/api` ; `https://apify.com/3x1t/autoscout24-scraper` ; `https://apify.com/ivanvs/autoscout-scraper` ; `https://apify.com/fayoussef/autoscout24` ; `https://apify.com/crawlerbros/autoscout24-scraper/api/mcp` ; `https://apify.com/3x1t/autoscout24-ch-scraper-ppe`
- **Questions falsifiables à tester en 1.4** :
  - « Ces acteurs héritent du plafond de pagination du front (400 ou 4 000 annonces par URL de recherche). »
  - « Le prix de 0,80–0,90 $/1 000 résultats tient à l'échelle d'un snapshot BE complet (~115 000 annonces annoncées sur `autoscout24.be`). »
  - « Un compte Apify gratuit permet de prouver la mécanique sans engagement. » — **création de compte interdite par R2 : à consigner en `ACTIONS-COMMANDITAIRE`.**
  - « Les champs livrés couvrent le dictionnaire cible sans le bloc contact vendeur (contrainte H3). »
- **Sources** : https://apify.com/memo23/autoscout24-scraper ; https://apify.com/solidcode/autoscout24-scraper/api ; https://apify.com/automation-lab/autoscout24-scraper ; https://apify.com/scrapesage/autoscout24-scraper/examples/autoscout24-monitor-new-listings ; https://www.autoscout24.be/nl/

### C-23 — Scrapfly (Web Scraping API + ASP anti-Akamai)
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : API de scraping générique ; on lui passe l'URL `/lst` et les options `asp=True` (bypass Akamai), `render_js=True`, `country="BE"` (routage IP résidentielle), puis on parse soi-même `__NEXT_DATA__`. Facturation 1–25 crédits par requête selon les options ; coût moyen annoncé ~4,90 $/1 000 requêtes ; non-facturation des échecs.
- **Point d'entrée connu** : `https://scrapfly.io/docs/scrape-api/billing` ; guide dédié `https://scrapfly.io/blog/posts/how-to-scrape-autoscout24`
- **Questions falsifiables à tester en 1.4** :
  - « `asp=True` seul suffit sur `autoscout24.be` sans `render_js`, ce qui divise le coût en crédits. »
  - « Le coût réel par 1 000 **annonces** (et non par requête) est ≈ 4,90 $/50 = 0,25 $ compte tenu de 20 annonces par requête. »
  - « Le routage `country=BE` est disponible et donne les résultats du périmètre belge. »
- **Sources** : https://scrapfly.io/blog/posts/how-to-scrape-autoscout24 ; https://scrapfly.io/docs/scrape-api/billing ; https://scrapeway.com/web-scraping-api/scrapfly

### C-24 — ScrapingBee — endpoint « AutoScout24 API » dédié
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : ScrapingBee commercialise une page produit « AutoScout24 API » présentée comme dispensant de gérer proxies et navigateurs, avec extraction structurée. 1 000 crédits offerts, sans carte. Facturation des seules requêtes réussies.
- **Point d'entrée connu** : `https://www.scrapingbee.com/scrapers/autoscout24-api/`
- **Questions falsifiables à tester en 1.4** :
  - « C'est un vrai endpoint dédié avec schéma de sortie AS24, et non une page marketing pointant vers l'API généraliste. »
  - « Le tier gratuit de 1 000 crédits est activable sans carte bancaire. » (création de compte → R2, à consigner)
  - « Le débit permet un snapshot BE quotidien dans une fenêtre de moins de 6 h. »
- **Sources** : https://www.scrapingbee.com/scrapers/autoscout24-api/

### C-25 — Piloterr — scrapers AutoScout24 documentés (search + ad)
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : deux endpoints documentés, `/v2/autoscout24/search` et `/v2/autoscout24/ad`. Le second renvoie « le prix avec évaluation de marché, les specs véhicule, le vendeur, les images et les équipements » — donc la notation de prix AS24 elle-même, qui est un signal analytique de premier ordre pour la détection d'outliers visée par KYCAR. 50 crédits d'essai.
- **Point d'entrée connu** : `https://www.piloterr.com/scrapers/autoscout24` ; `https://www.piloterr.com/library/autoscout24-search` ; `https://www.piloterr.com/library/autoscout24-ad`
- **Questions falsifiables à tester en 1.4** :
  - « L'endpoint `search` accepte des filtres de facettes (pays, marque, prix, km) et pas seulement une URL brute. »
  - « Le champ d'évaluation de marché (`Preisbewertung`) est effectivement restitué et exploitable. »
  - « La documentation est lisible sans compte, et le schéma de réponse y est complet. »
- **Sources** : https://www.piloterr.com/scrapers/autoscout24 ; https://www.piloterr.com/library/autoscout24-search ; https://www.piloterr.com/library/autoscout24-ad

### C-26 — Scrape.do
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : API proxy/unblocking généraliste avec un guide dédié « Scraping AutoScout24: How to Extract Car Listings Without Getting Blocked », qui décrit le duo Akamai + `__NEXT_DATA__` et le paramétrage nécessaire (rendu JS, géo-ciblage).
- **Point d'entrée connu** : `https://scrape.do/blog/autoscout24-scraping/`
- **Questions falsifiables à tester en 1.4** :
  - « Le guide contient des paramètres exacts reproductibles (et pas seulement un argumentaire). »
  - « Le géo-ciblage Belgique est proposé. »
  - « Le tarif au 1 000 requêtes est publié sans devis. »
- **Sources** : https://scrape.do/blog/autoscout24-scraping/

### C-27 — Bright Data (Scraper API + Web Unlocker + datasets préconstitués)
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : plateforme intégrant l'un des plus grands réseaux de proxies résidentiels (obtenus par SDK d'opt-in installés chez des particuliers), une « Browser API » branchable sur Playwright/Puppeteer, des Scraper APIs prêtes à l'emploi, et un catalogue de **datasets déjà collectés**. Bright Data publie une page produit scraper pour La Centrale, ce qui suggère l'existence d'équivalents automobiles et un possible dataset AS24 sur devis.
- **Point d'entrée connu** : `https://brightdata.com/` ; `https://docs.brightdata.com/scraping-automation/scraping-browser/introduction` ; `https://brightdata.com/products/web-scraper/la-centrale`
- **Questions falsifiables à tester en 1.4** :
  - « Un dataset AutoScout24 (ou un scraper AS24 dédié) figure au catalogue Bright Data. »
  - « Le périmètre proposé inclut la Belgique avec un historique. »
  - « Le tarif au 1 000 enregistrements est publié dans le catalogue, sans passer par un commercial. »
- **Sources** : https://brightdata.com/ ; https://docs.brightdata.com/scraping-automation/scraping-browser/introduction ; https://brightdata.com/products/web-scraper/la-centrale

### C-28 — Fournisseurs entreprise : Oxylabs, Zyte, Decodo, Nimble, Infatica
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : même primitive (Web Scraper API + réseau résidentiel + couche d'unblocking) chez plusieurs acteurs. Oxylabs revendique 100 M+ d'IP sur 195 pays avec Web Scraper API, Web Unblocker et une couche d'extraction assistée par IA ; Infatica propose un ciblage pays/région/ville/ISP ; Zyte est centré sur le workflow d'API de scraping.
- **Point d'entrée connu** : `https://oxylabs.io/blog/best-web-scraping-api` ; `https://infatica.io/scraper-api/` ; `https://decodo.com/blog/akamai-bypass` ; `https://www.nimbleway.com/blog/bright-data-alternatives`
- **Questions falsifiables à tester en 1.4** :
  - « Au moins un de ces fournisseurs publie explicitement le support d'Akamai Bot Manager v4 avec un SLA de taux de succès. »
  - « Le ciblage IP résidentiel Belgique est disponible chez au moins deux d'entre eux. »
  - « Le ticket d'entrée mensuel est inférieur à un seuil compatible avec un usage personnel (H2). »
- **Sources** : https://oxylabs.io/blog/best-web-scraping-api ; https://infatica.io/scraper-api/ ; https://decodo.com/blog/akamai-bypass ; https://stackbriefly.com/blog/web-scraping-apis-2026-bright-data-oxylabs-zyte-scrapingbee-apify

### C-29 — Anysite.io — endpoint `POST /api/autoscout24/dealers/listings`
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : endpoint documenté qui renvoie l'inventaire courant d'un concessionnaire AS24 à partir de son slug. Paramètres : `dealer`, `count`, `article_type` (C/B/N/X/L), `sort` (standard, price, year, mileage, power, age, distance…), `descending`, `timeout`. Retour : marque, modèle, variante, année, km, puissance, carburant, boîte, cylindrée, prix, pays/CP/ville/coordonnées, vendeur, images, drapeaux d'état. Tarif : 20 crédits pour 20 résultats.
- **Point d'entrée connu** : `https://docs.anysite.io/api-reference/autoscout24/autoscout24dealerslistings`
- **Questions falsifiables à tester en 1.4** :
  - « Anysite expose aussi un endpoint de **recherche** AS24 (et pas seulement par concessionnaire) — à vérifier dans le reste de l'API reference. »
  - « `count` accepte des valeurs élevées permettant de vider un concessionnaire en une requête. »
  - « Le champ `country` permet de filtrer la Belgique. »
  - « Le coût de 1 crédit/résultat se traduit en € par 1 000 annonces compétitif face à Apify. »
- **Sources** : https://docs.anysite.io/api-reference/autoscout24/autoscout24dealerslistings

### C-30 — Carapis — parseur AutoScout24 multi-marchés
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : API REST unifiée annoncée sur 200+ marketplaces automobiles (Encar, Mobile.de, AutoTrader, Avito, Che168, AutoScout24…), avec pages dédiées AS24 `.com` et AS24 `.ch` — donc une distinction explicite des deux backends. Annonce « 18 pays, ~2,5 M d'annonces » pour AS24, plus historique de prix et « market intelligence ».
- **Point d'entrée connu** : `https://docs.carapis.com/parsers/autoscout24.com/api-reference` ; `https://carapis.com/parsers/autoscout24.com/quick-start` ; `https://www.carapis.com/platforms/western-europe/autoscout24-ch` ; `https://docs.carapis.com/parsers/autoscout24.com/faq`
- **Questions falsifiables à tester en 1.4** :
  - « Le "pricing history" est réellement disponible, ce qui donnerait un historique impossible à reconstruire soi-même. »
  - « La documentation nomme un endpoint de recherche par facettes avec filtre pays = BE. »
  - « Le quota et le tarif sont publiés (et pas seulement "contactez-nous"). »
- **Sources** : https://docs.carapis.com/parsers/autoscout24.com/intro ; https://docs.carapis.com/parsers/autoscout24.com/api-reference ; https://carapis.com/parsers/autoscout24.com/quick-start ; https://www.carapis.com/platforms/western-europe/autoscout24-ch

### C-31 — auto-api.com — catalogue AS24 avec endpoints `/offers`, `/changes` et exports quotidiens
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : service qui expose ~2 M d'annonces AS24 actives via 4 endpoints — `/offers` (liste paginée filtrable par marque, modèle, prix, année, km, motorisation, boîte, couleur, carrosserie), `/changes` (delta : ajouts, modifications, suppressions), `/change_id` (curseur par date), `/offer` (détail par `inner_id`) — plus des **exports quotidiens** en CSV pipe-delimited / JSON / Excel en trois fichiers : `all_active`, `new_daily`, `removed_daily`. Détection des nouvelles annonces annoncée sous 60 s. C'est structurellement la forme la plus proche de ce que consomme un agrégateur analytique (snapshot + delta).
- **Point d'entrée connu** : `https://auto-api.com/autoscout24`
- **Questions falsifiables à tester en 1.4** :
  - « La Belgique fait partie des 18 pays couverts. » (la doc ne la nomme pas explicitement — question ouverte)
  - « L'export `all_active` est livrable en un fichier unique, ce qui supprimerait tout problème de plafond de pagination. »
  - « Le tarif existe sous forme publique ou obtenable sans NDA. »
  - « `/changes` permet un rafraîchissement quotidien pour un coût très inférieur à un re-snapshot complet. »
- **Sources** : https://auto-api.com/autoscout24

### C-32 — Services de recettes no-code / marketplaces de scrapers : Webscraper.io, ScrapeIt, Parse.bot
- **Famille** : 5 — API tierces de scraping managé
- **Mécanique** : plateformes qui publient des « recettes » ou wrappers REST prêts pour AS24 : Webscraper.io propose un sitemap AS24 pour son extension/cloud, ScrapeIt un data scraper `autoscout24.com`, Parse.bot des API REST non officielles au-dessus de portails publics (démontré sur La Centrale). Intérêt : la recette encode déjà la structure des pages, réutilisable comme spécification de parseur.
- **Point d'entrée connu** : `https://webscraper.io/marketplace/autoscout24-vehicles-listings-scraper` ; `https://www.scrapeit.io/scraper/autoscout24.com` ; `https://parse.bot/marketplace/`
- **Questions falsifiables à tester en 1.4** :
  - « Le sitemap Webscraper.io AS24 est téléchargeable/lisible sans compte et documente les sélecteurs actuels. »
  - « Ces plateformes gèrent Akamai côté cloud (et non seulement dans l'extension navigateur de l'utilisateur). »
  - « Un wrapper REST AS24 existe déjà chez Parse.bot. »
- **Sources** : https://webscraper.io/marketplace/autoscout24-vehicles-listings-scraper ; https://www.scrapeit.io/scraper/autoscout24.com ; https://parse.bot/marketplace/3448478d-df2a-4662-b464-e92c4142c14b/lacentrale-fr-api

---

## Famille 6 — Navigateurs pilotés auto-hébergés + proxies résidentiels

### C-33 — Playwright / Puppeteer durci + proxies résidentiels BE
- **Famille** : 6 — Navigateurs pilotés auto-hébergés
- **Mécanique** : lancer un Chromium réel avec `--disable-blink-features=AutomationControlled`, viewport 1920×1080, timezone/locale cohérentes avec le pays cible, masquage de `navigator.webdriver` injecté avant chargement, attente `networkidle` pour laisser le challenge se résoudre, puis extraction de `__NEXT_DATA__`. Un navigateur réel « passe la plupart des contrôles Akamai » ; la montée en volume exige la rotation de proxies résidentiels du pays cible.
- **Point d'entrée connu** : outillage local ; sortie visée identique à C-06/C-07
- **Questions falsifiables à tester en 1.4** :
  - « Un Chromium headless durci obtient un `_abck` valide sur `autoscout24.be` depuis une IP résidentielle belge. »
  - « Le coût par annonce (CPU + proxy) reste inférieur au tarif Apify de 0,80–0,90 $/1 000. »
  - « Une session validée reste réutilisable sur N requêtes, ce qui amortit le coût du challenge. »
- **Sources** : https://roundproxies.com/blog/scrape-autoscout24/ ; https://scrapfly.io/blog/posts/how-to-bypass-akamai-anti-scraping ; https://dev.to/vhub_systems_ed5641f65d59/how-to-bypass-akamai-bot-detection-in-2026-39lj

### C-34 — Navigateurs anti-fingerprint natifs : Camoufox, patchright, undetected-chromedriver
- **Famille** : 6 — Navigateurs pilotés auto-hébergés
- **Mécanique** : au lieu de patcher un Chromium standard par script, utiliser un build durci où l'usurpation d'empreinte est intégrée au niveau du navigateur. Camoufox est un build Firefox conçu pour le scraping avec spoofing d'empreinte au niveau moteur. undetected-chromedriver reste la brique de base de plusieurs solveurs.
- **Point d'entrée connu** : projet Camoufox ; `https://gist.github.com/0xdevalias/b34feb567bd50b37161293694066dd53` (recension d'outils anti-anti-bot)
- **Questions falsifiables à tester en 1.4** :
  - « Camoufox passe Akamai Bot Manager v4 sur `autoscout24.be` là où Playwright patché échoue. »
  - « Le débit d'un build Firefox durci est suffisant pour un snapshot BE quotidien sur une seule machine. »
  - « Ces projets sont maintenus activement (dernier commit < 3 mois), donc soutenables en maintenance. »
- **Sources** : https://decodo.com/blog/akamai-bypass ; https://gist.github.com/0xdevalias/b34feb567bd50b37161293694066dd53 ; https://dev.to/vhub_systems_ed5641f65d59/how-to-bypass-akamai-bot-detection-in-2026-5h3k

### C-35 — Client HTTP à empreinte TLS usurpée (curl_cffi / impersonation JA3-JA4), sans navigateur
- **Famille** : 6 — Navigateurs pilotés auto-hébergés (variante sans navigateur)
- **Mécanique** : `curl_cffi` s'appuie sur libcurl-impersonate pour reproduire l'empreinte TLS et HTTP/2 d'un Chrome réel. Coût par requête très bas, mais **incapable d'exécuter le script capteur d'Akamai** : pas de `_abck` valide, pas d'empreinte canvas/WebGL, pas de données comportementales. Une source estime que cela ne couvre qu'« environ 10 % du problème Akamai ». Voie viable seulement si un cookie `_abck` obtenu ailleurs (navigateur, service tiers) est réinjectable.
- **Point d'entrée connu** : bibliothèque `curl_cffi` (Python)
- **Questions falsifiables à tester en 1.4** :
  - « Un `GET` `curl_cffi` avec `impersonate="chrome"` sur `autoscout24.be` renvoie 200 avec `__NEXT_DATA__` complet, sans cookie préalable. » (probablement faux — à mesurer)
  - « Un `_abck` obtenu par un navigateur réel reste valide et transférable dans des requêtes `curl_cffi` ultérieures, et pour combien de requêtes. »
  - « L'architecture hybride (1 navigateur pour le cookie, N requêtes HTTP bon marché) réduit le coût d'un ordre de grandeur. »
- **Sources** : https://dev.to/vhub_systems_ed5641f65d59/how-to-bypass-akamai-bot-detection-in-2026-5h3k ; https://scrapfly.io/blog/posts/how-to-bypass-akamai-anti-scraping

---

## Famille 7 — Services d'unblocking / résolution de challenge

### C-36 — Web Unlocker / Web Unblocker managés (Bright Data, Oxylabs, ZenRows)
- **Famille** : 7 — Unblocking / résolution de challenge
- **Mécanique** : produits qui prennent une URL et rendent le HTML final, en absorbant eux-mêmes la chaîne Akamai (réputation IP, JA3/JA4, télémétrie JS, biométrie comportementale, continuité de session). On reste maître du parseur (`__NEXT_DATA__`) et on externalise uniquement le franchissement. C'est la variante « qui absorbe Akamai = le provider » de l'axe A8.
- **Point d'entrée connu** : `https://brightdata.com/` (Web Unlocker) ; Oxylabs Web Unblocker ; ZenRows
- **Questions falsifiables à tester en 1.4** :
  - « Le taux de succès mesuré sur `autoscout24.be/lst` est supérieur à 95 % sur un échantillon de sondes. »
  - « Le prix par requête réussie est publié, et la facturation exclut les échecs. »
  - « Le produit fournit le HTML complet avec `__NEXT_DATA__` intact et non un DOM post-nettoyage. »
- **Sources** : https://brightdata.com/ ; https://oxylabs.io/blog/best-web-scraping-api ; https://scrapewise.ai/blogs/bypass-cloudflare-akamai-perimeterx-web-scraping-2026

### C-37 — Solveurs auto-hébergés et solveurs de `sensor_data` Akamai
- **Famille** : 7 — Unblocking / résolution de challenge
- **Mécanique** : FlareSolverr expose un proxy local qui pilote Selenium + undetected-chromedriver pour résoudre le challenge et rendre les cookies. Des services spécialisés annoncent générer directement le `sensor_data` Akamai et donc le `_abck`. Signal contraire à documenter : FlareSolverr est mesuré à 0 % de réussite sur cibles Cloudflare Enterprise en avril 2026 — sa pertinence sur Akamai est à établir séparément.
- **Point d'entrée connu** : FlareSolverr (auto-hébergé) ; `https://scrapebadger.com/akamai-bypass`
- **Questions falsifiables à tester en 1.4** :
  - « FlareSolverr résout le challenge Akamai d'`autoscout24.be` (et non seulement Cloudflare). » (à considérer comme probablement fausse)
  - « Un service de génération de `sensor_data` produit un `_abck` accepté par `autoscout24.be`. »
  - « Le coût par cookie valide, multiplié par le nombre de sessions nécessaires, reste inférieur au coût d'un unblocker managé. »
- **Sources** : https://scrapebadger.com/akamai-bypass ; https://scrapewise.ai/blogs/bypass-cloudflare-akamai-perimeterx-web-scraping-2026 ; https://voidmob.com/blog/how-to-bypass-akamai-bot-detection-2026

---

## Famille 8 — Datasets préexistants

### C-38 — Datasets Kaggle AutoScout24
- **Famille** : 8 — Datasets préexistants
- **Mécanique** : plusieurs jeux publics extraits d'AS24, téléchargeables : `clkmuhammed/autoscout24-car-listings-dataset` (~120 K annonces multi-marchés européens, validé par Pydantic/Pandas, snapshot 2025, avec prix, specs, efficacité énergétique, équipements), `huseyincenik/as24-cars`, `ander289386/cars-germany`, `mexwell/autoscout-data`, `promptcloud/autoscout-automotive-data`. Coût nul, fraîcheur figée.
- **Point d'entrée connu** : `https://www.kaggle.com/datasets/clkmuhammed/autoscout24-car-listings-dataset` ; `https://www.kaggle.com/datasets/huseyincenik/as24-cars` ; `https://www.kaggle.com/datasets/ander289386/cars-germany` ; `https://www.kaggle.com/datasets/mexwell/autoscout-data` ; `https://www.kaggle.com/datasets/promptcloud/autoscout-automotive-data`
- **Questions falsifiables à tester en 1.4** :
  - « Au moins un de ces datasets contient un champ pays avec des annonces belges en quantité exploitable. »
  - « Le schéma couvre les 3 axes du mode 2 de KYCAR (prix × année × kilométrage) sur un même enregistrement. »
  - « Le téléchargement est possible sans compte Kaggle. » (probablement faux → `ACTIONS-COMMANDITAIRE` au titre de R2)
- **Sources** : https://www.kaggle.com/datasets/clkmuhammed/autoscout24-car-listings-dataset/data ; https://www.kaggle.com/datasets/huseyincenik/as24-cars ; https://www.kaggle.com/datasets/ander289386/cars-germany/data ; https://www.kaggle.com/datasets/mexwell/autoscout-data ; https://www.kaggle.com/datasets/promptcloud/autoscout-automotive-data

### C-39 — Dataset Zenodo `autoscout24_dataset_20251108.csv`
- **Famille** : 8 — Datasets préexistants
- **Mécanique** : dépôt académique Zenodo hébergeant un CSV AS24 daté du 08/11/2025, avec DOI, téléchargeable directement, sous licence explicite. Intérêt spécifique : la datation dans le nom de fichier suggère une série potentiellement récurrente, donc un historique.
- **Point d'entrée connu** : `https://zenodo.org/records/17643343`
- **Questions falsifiables à tester en 1.4** :
  - « Le fichier est téléchargeable en anonyme et sa licence autorise un usage analytique. »
  - « Il existe d'autres dépôts du même auteur formant une série temporelle. »
  - « Le CSV contient un champ pays/localisation permettant d'isoler la Belgique. »
- **Sources** : https://zenodo.org/records/17643343

### C-40 — Hugging Face Datasets (recherche de jeux AS24 / annonces automobiles européennes)
- **Famille** : 8 — Datasets préexistants
- **Mécanique** : le Hub HF héberge des datasets tabulaires accessibles par la bibliothèque `datasets`, par parquet et par une API de requêtes serveur, sans compte pour les jeux publics. Voie à instruire par recherche directe sur le Hub, non couverte par les résultats obtenus (les recherches génériques ont renvoyé Kaggle/Zenodo et non HF).
- **Point d'entrée connu** : `https://huggingface.co/datasets?search=autoscout24` (à instruire)
- **Questions falsifiables à tester en 1.4** :
  - « Il existe au moins un dataset AutoScout24 sur Hugging Face. » (peut être fausse — aucune preuve à ce stade)
  - « Un tel dataset serait interrogeable par l'API datasets-server sans téléchargement complet. »
- **Sources** : recherche « autoscout24 dataset kaggle huggingface car listings » — n'a retourné **aucun** résultat Hugging Face, ce qui est en soi un signal à confirmer.

### C-41 — Marketplaces de données et data brokers automobiles (Datarade, PromptCloud, Marketcheck, Datatorq, Dataforce)
- **Famille** : 8 — Datasets préexistants / data brokers
- **Mécanique** : Datarade agrège des fournisseurs vendant des données automobiles par API, CSV ou intégration : prix de véhicules courants par pays (Belgique nommément incluse chez Datatorq), immatriculations (Dataforce/IRIS, 40 pays), parcs, annonces. Marketcheck se présente comme le fournisseur de référence d'inventaires (surtout US). PromptCloud vend du scraping sur mesure et publie déjà un dataset AutoScout sur Kaggle.
- **Point d'entrée connu** : `https://datarade.ai/data-categories/car-price-data` ; `https://datarade.ai/data-products/car-price-data-car-data-current-prices-global-current-datatorq` ; `https://www.marketcheck.com/apis/pricing/` ; `https://datarade.ai/data-categories/automotive-data/providers`
- **Questions falsifiables à tester en 1.4** :
  - « Un fournisseur Datarade livre des **annonces individuelles** belges (et pas seulement des prix agrégés). »
  - « La source de ces données est nommée et inclut AutoScout24. »
  - « Un tarif d'entrée est affiché sur la fiche produit sans demande de devis. »
- **Sources** : https://datarade.ai/data-categories/car-price-data ; https://datarade.ai/data-products/car-price-data-car-data-current-prices-global-current-datatorq ; https://datarade.ai/data-categories/automotive-data ; https://www.marketcheck.com/apis/pricing/

---

## Famille 9 — Sources alternatives substituables

### C-42 — Mobile.de Search API (officielle, documentée publiquement)
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : mobile.de (groupe **distinct** d'AutoScout24 — voir la correction factuelle en tête de document) documente publiquement trois API REST : **Search API**, Seller API et Insights API, avec sandbox à `https://services.mobile.de/`, identification par `seller-key` et `site-key` par pays. C'est le cas rare d'une marketplace automobile européenne majeure avec une API de **recherche** officielle et documentée.
- **Point d'entrée connu** : `https://services.mobile.de/docs/search-api.html` ; `https://services.mobile.de/` ; `https://services.mobile.de/manual/changelog.html`
- **Questions falsifiables à tester en 1.4** :
  - « La Search API permet de rechercher **tout** l'inventaire, pas seulement celui d'un `seller-key` donné. »
  - « Il existe un `site-key` couvrant la Belgique. » (probablement faux : mobile.de est DE-centré — à prouver)
  - « L'accès à la Search API est ouvert sans être concessionnaire ni TSP. »
  - « La sandbox est explorable sans credentials. »
- **Sources** : https://services.mobile.de/docs/search-api.html ; https://services.mobile.de/ ; https://services.mobile.de/docs/seller-api.html ; https://services.mobile.de/docs/insights-api.html

### C-43 — Portails belges concurrents : Gocar.be, Moniteur Automobile, Vroom.be, Autoccasion, Youcar.be, 2dehands/2ememain
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : le marché BE est couvert par plusieurs portails dont les volumes annoncés sont du même ordre qu'AS24 : Moniteur Automobile ~120 000 occasions, Gocar.be (ex-Autovlan) ~50 000, plus 2dehands/2ememain (Adevinta), Vroom.be (Mobly), Autoccasion, Youcar.be, Autolive. AutoScout24.be annonce ~115 000 véhicules. Substituer ou compléter la source réduit la dépendance à AS24 sans changer le produit.
- **Point d'entrée connu** : `https://www.moniteurautomobile.be/occasions-auto/rechercher-vehicule.html` ; `https://gocar.be/` ; `https://www.youcar.be/fr` ; `https://www.2dehands.be/` ; `https://www.vroom.be/`
- **Questions falsifiables à tester en 1.4** :
  - « Au moins un portail BE expose son inventaire en JSON sans protection anti-bot de niveau Akamai. »
  - « Le recouvrement d'inventaire entre AS24.be et Moniteur/Gocar est faible, donc les sources sont complémentaires et non redondantes. »
  - « Les champs disponibles suffisent au dictionnaire cible de 40 champs. »
- **Sources** : https://www.moniteurautomobile.be/accueil.html ; https://www.moniteurautomobile.be/occasions-auto/rechercher-vehicule.html ; https://ahrefs.com/websites/gocar.be/competitors ; https://www.guide-achat-vente-auto.be/sites-auto-occasion-belgique.html ; https://www.caroom.fr/guide/importation/pourquoi-mandataires-moins-cher/provenance-voitures/import-belgique/sites-auto ; https://www.autoscout24.be/nl/

### C-44 — Portails voisins pour le modèle multi-pays : La Centrale, Leboncoin, AutoTrader, Autotrack, Marktplaats
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : chacun de ces portails a un écosystème de scrapers et parfois une API interne exploitable — La Centrale (n° 2 français, ~1/3 des ventes VO FR, API interne mentionnée jusqu'aux numéros de téléphone), Leboncoin (champs prix/marque/modèle/année/km/carburant/boîte/puissance/couleur/vendeur/localisation), AutoTrader (pas d'API officielle correcte), Marktplaats (NL), Autotrack (NL). Ils servent l'hypothèse H1 (schéma multi-pays) même si AS24 reste la cible primaire.
- **Point d'entrée connu** : `https://apify.com/consummate_joy/lacentrale-scraper` ; `https://apify.com/devilscrapes/leboncoin-france-cars/output-schema` ; `https://www.scrapingbee.com/scrapers/autotrader-api/` ; `https://apify.com/haketa/marktplaats-scraper` ; `https://www.carapis.com/platforms/western-europe/la-centrale`
- **Questions falsifiables à tester en 1.4** :
  - « L'API interne de La Centrale est appelable directement, sans intermédiaire commercial. »
  - « Le schéma de données de ces portails est réductible au même modèle canonique que AS24 (donc un `DataProvider` par portail, pas un modèle par portail). »
  - « Au moins un de ces portails a une couverture Belgique non nulle. »
- **Sources** : https://apify.com/consummate_joy/lacentrale-scraper ; https://apify.com/devilscrapes/leboncoin-france-cars/output-schema ; https://apify.com/piotrv1001/leboncoin-listings-scraper ; https://www.scrapingbee.com/scrapers/autotrader-api/ ; https://apify.com/haketa/marktplaats-scraper ; https://parse.bot/marketplace/3448478d-df2a-4662-b464-e92c4142c14b/lacentrale-fr-api

### C-45 — Méta-agrégateur tiers déjà constitué : theparking.eu
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : theparking.eu est un moteur de recherche d'occasions qui agrège « plusieurs millions » d'annonces de milliers de sites, avec des pages dédiées par source — dont `www.autoscout24.be`, `.fr`, `.ch`, `.it`. Autrement dit, un tiers a **déjà** résolu le problème d'agrégation et republie AS24 sous son propre domaine, probablement sans la même couche anti-bot.
- **Point d'entrée connu** : `https://www.theparking.eu/used-cars/www.autoscout24.be.html` ; `https://www.theparking.eu/`
- **Questions falsifiables à tester en 1.4** :
  - « Les pages theparking.eu par source permettent d'énumérer les annonces AS24.be avec les champs prix/année/km. »
  - « theparking.eu n'est pas protégé par un anti-bot de niveau Akamai. »
  - « Le délai d'apparition annoncé (~24 h) est compatible avec H4 (snapshot périodique). »
  - « L'inventaire AS24.be qu'il expose est complet et non un sous-échantillon. »
- **Sources** : https://www.theparking.eu/used-cars/www.autoscout24.be.html ; https://www.theparking.eu/ ; https://www.theparking.eu/used-cars/www.autoscout24.html

### C-46 — Données structurées `schema.org/Car` chez les concessionnaires et index Google Vehicle listings
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : les concessionnaires publient leur stock en JSON-LD `schema.org/Car` (30+ propriétés : VIN, `mileageFromOdometer`, carburant, moteur, boîte, transmission, prix, disponibilité) sur leur propre site, et pouvaient l'envoyer à Google via un portail partenaire « vehicle listings ». Cela permet de reconstruire l'offre professionnelle **sans passer par AS24 du tout**. Réserve à documenter : le rich result Google dédié a été déprécié en septembre 2025 et n'était disponible qu'aux US.
- **Point d'entrée connu** : `https://schema.org/Car` ; portail partenaire Google Vehicle listings (statut à vérifier) ; sites concessionnaires BE individuels
- **Questions falsifiables à tester en 1.4** :
  - « Une part significative des concessionnaires belges publie du JSON-LD `Car`/`Vehicle` complet sur son propre site. »
  - « Le portail partenaire Google Vehicle listings est encore actif et accessible hors US. » (probablement faux)
  - « L'univers des sites concessionnaires BE est énumérable (via les pages `/garages/` d'AS24 ou un annuaire Febiac/Traxio). »
- **Sources** : https://schema.org/Car ; https://searchengineland.com/google-adds-new-vehicle-listings-structured-data-433292 ; https://www.schemaapp.com/schema-app-news/new-vehicle-listing-structured-data-on-google/ ; https://omisido.com/vehicle-listing-car-structured-data/ ; https://cmlabs.co/en-id/news/structured-data-for-vehicle-listings

### C-47 — Plateformes B2B / remarketing : AUTOproff, eCarsTrade, CarNext, Autobiz
- **Famille** : 9 — Sources alternatives substituables
- **Mécanique** : les plateformes d'enchères et de remarketing B2B publient des inventaires structurés et des analyses de prix européens. eCarsTrade publie des analyses de prix VO européens ; AUTOproff appartient au groupe AS24. Ces flux sont souvent plus ouverts que les marketplaces B2C car destinés à des professionnels acheteurs.
- **Point d'entrée connu** : `https://www.autoproff.com/` ; `https://ecarstrade.com/blog/used-car-prices-in-europe` ; CarNext, Autobiz (à identifier)
- **Questions falsifiables à tester en 1.4** :
  - « Au moins une de ces plateformes expose un catalogue interrogeable sans compte professionnel. »
  - « Leur inventaire belge est significatif en volume. »
  - « Les prix B2B sont convertibles en prix de marché B2C exploitables par KYCAR (ou bien c'est un marché disjoint — auquel cas la substitution échoue). »
- **Sources** : https://www.autoproff.com/blog/press-release-autoscout24-takes-full-ownership ; https://ecarstrade.com/blog/used-car-prices-in-europe

---

## Famille 10 — Partenariat ou licence directe avec AutoScout24

### C-48 — Demande de licence de données via le canal SEARCH API
- **Famille** : 10 — Partenariat / licence directe
- **Mécanique** : contacter AutoScout24 sur le canal commercial déjà identifié pour la SEARCH API (`searchapi@autoscout24.com`, +49 89 44456-1000) et demander une licence d'accès en lecture pour un usage analytique. Résout d'un coup les axes A8 (anti-bot non concerné), A11 (exposition juridique) et A12 (autonomie contractuelle plutôt que technique).
- **Point d'entrée connu** : `searchapi@autoscout24.com` ; `https://www.autoscout24.de/haendlerportal/schnittstelle-search-api/` ; support pro `https://service.autoscout24.com/dealer/s/?language=en_US`
- **Questions falsifiables à tester en 1.4** :
  - « AutoScout24 accepte de contractualiser avec une entité non-concessionnaire pour un usage analytique. »
  - « Le ticket d'entrée est chiffrable et compatible avec H2 (usage personnel/interne). »
  - « Le contrat autorise la persistance des données et pas seulement l'affichage à la volée. »
  - **Note R2** : cette voie exige une prise de contact au nom du commanditaire → `ACTIONS-COMMANDITAIRE`.
- **Sources** : https://www.autoscout24.de/haendlerportal/schnittstelle-search-api/ ; https://service.autoscout24.com/dealer/s/?language=en_US

### C-49 — Programme partenaire technique / TSP et accès `portal.services.as24.tech`
- **Famille** : 10 — Partenariat / licence directe
- **Mécanique** : AS24 opère un portail développeurs (`portal.services.as24.tech/api-docs`) et publie ses specs partenaires sur GitHub — donc un programme partenaire formalisé existe. mobile.de documente explicitement la notion de **TSP** (fournisseur de services technique agissant pour le compte de concessionnaires) ; l'équivalent AS24 est à identifier. `robots.txt` bloque `/partner-experience/`, indice d'un espace partenaire en production.
- **Point d'entrée connu** : `https://portal.services.as24.tech/api-docs` ; `https://github.com/smg-automotive/autoscout24-api-specs` ; `https://www.autoscout24.be/partner-experience/`
- **Questions falsifiables à tester en 1.4** :
  - « Le portail développeurs est consultable sans compte et liste des API de lecture. » (le fetch initial n'a rendu que le titre → à re-sonder)
  - « L'inscription partenaire est ouverte en self-service. »
  - « Le statut partenaire donne accès à des données au-delà du périmètre des concessionnaires mandants. »
- **Sources** : https://portal.services.as24.tech/api-docs ; https://github.com/smg-automotive/autoscout24-api-specs ; https://services.mobile.de/manual/seller-api-legacy.html ; sonde robots.txt

### C-50 — Accès recherche / presse : rapports de marché AutoScout24 comme source d'agrégats
- **Famille** : 10 — Partenariat / licence directe
- **Mécanique** : AS24 publie régulièrement des analyses de marché chiffrées à partir de ses propres données (prix moyen VO 2025 : Belgique 25 000 € (+43 % vs 2019), Allemagne 27 800 €, Autriche 29 500 €, Pays-Bas 24 300 €, Italie 21 300 € ; marché européen 2024 : demande +17 %, offre +5 %, prix −6 % à 24 592 € en moyenne). Ces publications sont libres, donnent des **références de vérité** pour valider un pipeline d'agrégation, et ouvrent un canal de demande de données plus fines (service presse / études).
- **Point d'entrée connu** : `https://www.autoscout24.com/company/press-releases/` ; publications LinkedIn AutoScout24 ; `https://swissmarketplace.group/media-release/` (baromètre AS24.ch)
- **Questions falsifiables à tester en 1.4** :
  - « Les rapports publics contiennent des agrégats au niveau marque/modèle et pas seulement au niveau pays. »
  - « Ils fournissent une valeur de contrôle utilisable pour valider la complétude d'un snapshot BE (prix moyen attendu ≈ 25 000 €). »
  - « Un canal de demande de données de recherche existe et répond. »
- **Sources** : https://www.linkedin.com/posts/autoscout24_europes-used-car-market-trends-prices-activity-7425193799905165312-PSi1 ; https://www.fleeteurope.com/en/remarketing/europe/features/will-used-car-prices-continue-slide-2025-not-everybody-agrees ; https://swissmarketplace.group/media-release/autoscout24-market-barometer-car-buyers-are-actively-using-comparison-tools-but-still-delaying-buying-a-car-depending-on-the-type-of-vehicle/

---

## Famille 11 — Sitemaps et robots.txt

### C-51 — Découverte du ou des sitemaps XML d'AutoScout24
- **Famille** : 11 — Sitemaps et robots.txt
- **Mécanique** : un sitemap listerait directement les URL d'annonces, permettant une énumération exhaustive **sans passer par la recherche paginée** — donc sans son plafond. **Résultat des sondes** : le `robots.txt` d'`autoscout24.be` ne contient **aucune** directive `Sitemap:` ; `/sitemap.xml` et `/sitemaps/sitemap-index.xml` renvoient tous deux **404** avec un corps HTML de 19 840 octets. Le sitemap existe donc ailleurs, ou pas du tout sur ce TLD. Contre-exemple utile : `motoscout24.ch` déclare bien `https://www.motoscout24.ch/sitemap.xml` dans son robots.txt.
- **Point d'entrée connu** : `https://www.autoscout24.be/sitemap.xml` (404 prouvé), `https://www.autoscout24.be/sitemaps/sitemap-index.xml` (404 prouvé) ; à explorer : `.de` / `.com`, sous-domaines, déclaration Search Console uniquement, `https://www.motoscout24.ch/robots.txt` comme modèle
- **Questions falsifiables à tester en 1.4** :
  - « Un sitemap AS24 accessible existe sur un autre TLD ou un autre chemin. »
  - « Si un sitemap existe, il liste des URL d'**annonces individuelles** et pas seulement des pages SEO marque/modèle. »
  - « Le corps HTML de 19 840 octets servi en 404 est une vraie page d'erreur applicative et non un challenge Akamai déguisé. »
- **Sources** : sondes 3-4-5 du journal ci-dessus ; https://www.motoscout24.ch/robots.txt ; https://well-known.dev/resources/robots_txt/sites/autoscout24.com ; https://www.autoscout24.de/robots.txt

### C-52 — `robots.txt` comme carte d'endpoints et comme référence de conformité
- **Famille** : 11 — Sitemaps et robots.txt
- **Mécanique** : double usage. (a) **Reconnaissance** : le fichier a déjà livré 5 endpoints internes non documentés (C-09 à C-13). (b) **Conformité** : il définit un périmètre explicitement autorisé (`/fr/voiture/`, `/nl/auto/`, `/prijsschatting/`, `/evaluationvoiture/`) et un blocage nominatif de `ClaudeBot`, `GPTBot`, `CCBot`, `Google-Extended`, `Applebot-Extended` — élément matériel pour l'axe A11.
- **Point d'entrée connu** : `https://www.autoscout24.be/robots.txt` (200, 108 lignes, prouvé) ; comparables `https://www.autoscout24.de/robots.txt`, `https://well-known.dev/resources/robots_txt/sites/autoscout24.com`
- **Questions falsifiables à tester en 1.4** :
  - « Les `robots.txt` des autres TLD AS24 exposent des endpoints internes **différents** de ceux du TLD belge. »
  - « L'historique du fichier (via Wayback) révèle des endpoints retirés mais encore vivants. »
  - « Le blocage nominatif des agents d'IA ne s'étend pas juridiquement à un client HTTP non identifié comme tel. » (question à trancher en A11, réponse potentiellement défavorable)
- **Sources** : sondes 1-2-3 du journal ci-dessus ; https://www.autoscout24.de/robots.txt ; https://well-known.dev/resources/robots_txt/sites/autoscout24.com

---

## Famille 12 — Caches et archives tiers

### C-53 — Wayback Machine : index CDX + snapshots archivés
- **Famille** : 12 — Caches et archives tiers
- **Mécanique** : l'API CDX permet de lister toutes les captures d'un domaine (`urlkey`, `timestamp`, `original`, `mimetype`, `statuscode`, `digest`, `length`), avec pagination et requêtes parallèles par blocs zipnum pour les requêtes de niveau domaine. On énumère les URL `/offers/*` archivées, puis on récupère les snapshots — dont le `__NEXT_DATA__` intact. Bénéfice singulier : **profondeur historique** (annonces disparues, évolutions de prix), impossible à reconstituer autrement.
- **Point d'entrée connu** : `https://web.archive.org/cdx/search/cdx?url=autoscout24.be*&output=json` ; doc `https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md`
- **Questions falsifiables à tester en 1.4** :
  - « Le CDX contient un volume exploitable d'URL de détail `autoscout24.be` (> 10 000). »
  - « Les snapshots archivés conservent le `<script id="__NEXT_DATA__">` complet. »
  - « La couverture d'archivage est suffisamment dense dans le temps pour construire une série de prix. » (probablement fausse pour un inventaire exhaustif — à mesurer)
  - « Le taux de requêtes toléré par web.archive.org permet de reconstituer un périmètre BE. »
- **Sources** : https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md ; https://alexwlchan.net/notes/2024/list-captures-in-the-wayback-machine/ ; https://www.tinyutils.net/blog/wayback-machine-api-guide ; https://apify.com/automation-lab/wayback-machine-cdx-extractor/api

### C-54 — Common Crawl : index columnaire + WARC
- **Famille** : 12 — Caches et archives tiers
- **Mécanique** : les crawls mensuels de Common Crawl sont interrogeables par l'index CDX ou par le columnar index (Athena/DuckDB) pour extraire les pages d'un domaine, puis récupérer les segments WARC correspondants — gratuit et sans toucher AS24. **Obstacle prouvé** : le `robots.txt` belge inclut `CCBot` dans le bloc `Disallow: /`, et Common Crawl respecte robots.txt. La couverture attendue est donc faible à nulle pour les crawls récents, et à mesurer sur les crawls antérieurs à l'ajout de cette directive.
- **Point d'entrée connu** : `https://index.commoncrawl.org/` ; columnar index sur S3 `s3://commoncrawl/cc-index/table/cc-main/warc/`
- **Questions falsifiables à tester en 1.4** :
  - « L'index Common Crawl contient des URL `autoscout24.be` dans un crawl récent. » (**probablement fausse** au vu du blocage `CCBot` — c'est précisément la question à falsifier)
  - « Des crawls antérieurs contiennent un volume exploitable, ce qui donnerait un jeu historique gratuit. »
  - « Les pages archivées portent le `__NEXT_DATA__` (donc l'ère Next.js) et non une version antérieure du site. »
- **Sources** : sonde robots.txt (bloc `CCBot` / `Disallow: /`) ; https://index.commoncrawl.org/

### C-55 — Index des moteurs de recherche via API (SerpApi, Brave Search API, Bing)
- **Famille** : 12 — Caches et archives tiers
- **Mécanique** : interroger des index tiers avec des requêtes `site:autoscout24.be/...` pour énumérer des URL d'annonces indexées, et lire les snippets (qui portent souvent prix/année/km). Brave maintient un index indépendant, exposé par API. Réserve structurelle : `robots.txt` interdit `/lst?` aux crawlers, donc les pages de recherche ne sont pas indexées ; les pages de détail et les pages SEO marque/modèle, elles, le sont potentiellement.
- **Point d'entrée connu** : `https://serpapi.com/` ; Brave Search API ; Bing Web Search API
- **Questions falsifiables à tester en 1.4** :
  - « Un index tiers renvoie des URL de pages de détail `autoscout24.be` en volume significatif. »
  - « Les snippets suffisent à alimenter les distributions prix × année × km sans visiter la page. » (probablement faux — à mesurer)
  - « Le coût par 1 000 URL découvertes est inférieur à celui du scraping direct. »
- **Sources** : https://dev.to/dmitryzub/scrape-brave-search-organic-results-with-python-2lg9 ; sonde robots.txt (`Disallow: /lst?`)

---

## Famille 13 — Services de valorisation automobile exposant des données de marché

### C-56 — JD Power Europe : Autovista / Eurotax / Glass's / Schwacke (API et data feeds)
- **Famille** : 13 — Valorisation automobile
- **Mécanique** : JD Power réunit Autovista, Eurotax, Glass's et Schwacke et commercialise `AutovistaVALUATION` (valeurs résiduelles harmonisées par marché européen), `AutovistaSPEC` (specs rafraîchies quotidiennement, harmonisées, couverture EV/hybride) et une `Autovista API` intégrable, avec couverture Belgique explicitement mentionnée. Ce n'est pas de l'annonce individuelle mais du référentiel véhicule + valeur de marché — ce qui couvre une partie du besoin analytique (référence de prix pour détecter les outliers) et fournit un dictionnaire véhicule canonique.
- **Point d'entrée connu** : `https://autovista.com/product/autovista-api/` ; `https://www.jdpower.com/business/autovista-api/` ; `https://www.jdpower.com/business/autovista-valuation/` ; `https://www.jdpower.com/business/autovistaspec/` ; `https://eurotax.es/product/data-api-solutions/`
- **Questions falsifiables à tester en 1.4** :
  - « L'API Autovista fournit des **distributions** de prix observés et pas seulement une valeur ponctuelle par véhicule. »
  - « La Belgique est un marché souscriptible individuellement. »
  - « Un tarif d'entrée existe pour un petit volume / usage non-professionnel. » (probablement faux)
  - « `AutovistaSPEC` permet de normaliser les variantes AS24 (résolution marque/modèle/version), ce qui serait utile même sans souscrire aux valorisations. »
- **Sources** : https://autovista.com/product/autovista-api/ ; https://www.jdpower.com/business/autovista-api/ ; https://www.jdpower.com/business/autovista-valuation/ ; https://www.jdpower.com/business/autovistaspec/ ; https://www.jdpower.com/business/data-feeds-solutions/ ; https://eurotax.es/product/data-api-solutions/

### C-57 — INDICATA (Autorola) — intelligence de marché VO fondée sur les annonces
- **Famille** : 13 — Valorisation automobile
- **Mécanique** : INDICATA se positionne sur la « used vehicle decision making intelligence » : son modèle repose sur l'observation de l'offre en ligne (stocks, vitesse de rotation, jours de stock, indices de prix) par marché. C'est fonctionnellement **le produit que KYCAR veut construire**, déjà commercialisé — donc à la fois un concurrent, une source potentielle et une preuve de faisabilité du modèle de données.
- **Point d'entrée connu** : `https://indicata.com/`
- **Questions falsifiables à tester en 1.4** :
  - « INDICATA couvre le marché belge. »
  - « INDICATA expose une API ou un export de données à ses clients (et pas seulement un dashboard). »
  - « Ses sources d'annonces sont nommées publiquement et incluent AutoScout24 — ce qui documenterait la voie de licence utilisée par un acteur établi. »
- **Sources** : https://indicata.com/

### C-58 — Outil d'estimation de prix AutoScout24 lui-même (`/prijsschatting/`, `/evaluationvoiture/`, Preisbewertung)
- **Famille** : 13 — Valorisation automobile
- **Mécanique** : AS24 opère un outil d'estimation grand public dont les chemins sont **explicitement autorisés** dans `robots.txt` (`Allow: /evaluationvoiture/`, `Allow: /prijsschatting/`), et une notation de prix par annonce (« Preisbewertung », déployée dès 2017) restituée jusque dans les API tierces (Piloterr renvoie « price with market evaluation »). L'endpoint qui alimente l'estimation consomme nécessairement une distribution de prix du marché : c'est un accès indirect à l'agrégat, sur un chemin toléré.
- **Point d'entrée connu** : `https://www.autoscout24.be/prijsschatting/` ; `https://www.autoscout24.be/evaluationvoiture/` ; endpoint XHR sous-jacent à identifier
- **Questions falsifiables à tester en 1.4** :
  - « L'outil d'estimation appelle un endpoint JSON qui renvoie une distribution ou une fourchette de prix pour un couple marque/modèle/année/km. »
  - « Cet endpoint est appelable sans session et sans formulaire complet. »
  - « Son chemin tombe sous une directive `Allow`, donc son usage automatisé n'est pas interdit par `robots.txt`. »
  - « La notation `Preisbewertung` par annonce est présente dans `__NEXT_DATA__` (elle serait alors récupérée gratuitement avec C-06/C-07). »
- **Sources** : sonde robots.txt (`Allow: /prijsschatting/`, `Allow: /evaluationvoiture/`) ; https://aimgroup.com/2017/03/12/autoscout24-rolls-out-price-rating-tool-for-buyers/ ; https://www.piloterr.com/library/autoscout24-ad

### C-59 — Décodeurs VIN et historiques véhicule : Vincario/VIN Decoder, carVertical, Autodata
- **Famille** : 13 — Valorisation automobile
- **Mécanique** : API qui, à partir d'un VIN, renvoient la spécification usine complète, et parfois un historique (kilométrages relevés, annonces passées, sinistres). Rôle dans l'architecture : **enrichissement et normalisation** des variantes plutôt que source d'inventaire — mais carVertical construit son historique à partir d'annonces archivées, ce qui en fait une source indirecte d'annonces passées.
- **Point d'entrée connu** : `https://vindecoder.eu/` (Vincario) ; `https://www.carvertical.com/` ; `https://en.wikipedia.org/wiki/Autodata`
- **Questions falsifiables à tester en 1.4** :
  - « Les annonces AS24 exposent un VIN exploitable. » (probablement faux pour la plupart — à mesurer sur `__NEXT_DATA__`)
  - « carVertical restitue des annonces passées avec prix et kilométrage, donc un historique de marché. »
  - « Un tier gratuit de décodage VIN existe, suffisant pour normaliser les variantes. »
- **Sources** : https://en.wikipedia.org/wiki/Autodata ; https://datarade.ai/data-categories/car-data

---

## Famille 14 — Autres voies

### C-60 — Alertes email de recherches sauvegardées, parsées côté boîte mail
- **Famille** : 14 — Autres
- **Mécanique** : AS24 envoie un email dès qu'une nouvelle annonce correspond aux critères d'une recherche sauvegardée, et propose des alertes de baisse de prix sur les favoris. En créant N recherches sauvegardées partitionnant le marché BE, on reçoit un flux poussé d'annonces nouvelles, parsable en IMAP — sans requête sortante vers AS24, donc sans exposition anti-bot. Fraîcheur excellente, mais couverture limitée aux **nouveautés** (pas de snapshot initial).
- **Point d'entrée connu** : fonction « recherche sauvegardée / alerte email » du compte AS24 ; endpoint interne associé `/search-subscriptions/api/new-results-count` (cf. C-12)
- **Questions falsifiables à tester en 1.4** :
  - « L'email d'alerte contient les champs structurés (prix, année, km, URL) et pas seulement un lien. »
  - « Le nombre de recherches sauvegardées par compte est suffisant pour partitionner le marché BE sans trou. »
  - « Aucune limite de fréquence d'envoi ne tronque le flux les jours de forte activité. »
  - **Note R2** : exige un compte AS24 → `ACTIONS-COMMANDITAIRE`.
- **Sources** : https://apps.apple.com/us/app/autoscout24-buying-leasing/id311785642 ; https://play.google.com/store/apps/details?id=com.autoscout24 ; sonde robots.txt (`/search-subscriptions/api/new-results-count`)

### C-61 — Extension navigateur tierce existante « AutoScout24 Price History & Tracker »
- **Famille** : 14 — Autres
- **Mécanique** : une extension Chrome publiée suit l'historique de prix des annonces AS24. Pour tenir un historique, elle doit disposer d'un backend qui accumule les prix observés par ses utilisateurs — donc un jeu de données historique déjà constitué, et un modèle de collecte (crowdsourcing côté client) reproductible.
- **Point d'entrée connu** : `https://chromewebstore.google.com/detail/autoscout24-price-history/paocdjinpodboiinpcfbjmkegfhholhl`
- **Questions falsifiables à tester en 1.4** :
  - « L'extension appelle un backend tiers, identifiable dans son code source (le CRX est téléchargeable et lisible). »
  - « Ce backend expose une API d'historique de prix interrogeable. »
  - « Le code de l'extension révèle les endpoints AS24 réellement utilisés côté client. »
- **Sources** : https://chromewebstore.google.com/detail/autoscout24-price-history/paocdjinpodboiinpcfbjmkegfhholhl

### C-62 — Collecte côté client par extension propre / crowdsourcing d'opt-in
- **Famille** : 14 — Autres
- **Mécanique** : déplacer la collecte dans le navigateur d'utilisateurs réels et consentants : l'extension lit le `__NEXT_DATA__` des pages que l'utilisateur visite déjà et l'envoie au backend. Le trafic est indiscernable d'un usage humain, donc Akamai n'est pas concerné (axe A8 « non concerné »). C'est le mécanisme même des réseaux résidentiels de Bright Data et d'Infatica (opt-in individuel, sans collecte de données personnelles). Limite : couverture pilotée par le comportement des utilisateurs, non par un plan d'échantillonnage.
- **Point d'entrée connu** : architecture à construire ; précédents : `https://brightdata.com/` (réseau pair), `https://infatica.io/`
- **Questions falsifiables à tester en 1.4** :
  - « `__NEXT_DATA__` est lisible depuis un content script sans privilège particulier. »
  - « Le nombre d'utilisateurs nécessaire pour couvrir 80 % de l'inventaire BE sur un mois est atteignable. » (probablement pas, sous H2 « usage personnel » — question dimensionnante)
  - « Le mécanisme est compatible avec les politiques des Chrome/Firefox Web Stores. »
- **Sources** : https://brightdata.com/ ; https://infatica.io/ ; https://thunderbit.com/blog/top-data-collection-companies

### C-63 — Serveurs MCP exposant des scrapers AutoScout24
- **Famille** : 14 — Autres
- **Mécanique** : plusieurs acteurs Apify publient une façade MCP de leur scraper AS24, appelable comme outil par un agent. Voie d'intégration à faible effort pour un prototype (l'adaptateur `DataProvider` devient un client MCP), mais superposant une dépendance de plus.
- **Point d'entrée connu** : `https://apify.com/crawlerbros/autoscout24-scraper/api/mcp` ; `https://apify.com/fortuitous_pirate/wayback-cdx-scraper/api/mcp`
- **Questions falsifiables à tester en 1.4** :
  - « Le serveur MCP renvoie les mêmes champs que l'API REST de l'acteur, sans troncature. »
  - « Il est appelable depuis un backend applicatif et pas seulement depuis un client de chat. »
  - « Le surcoût par rapport à l'appel REST direct est nul. »
- **Sources** : https://apify.com/crawlerbros/autoscout24-scraper/api/mcp ; https://apify.com/fortuitous_pirate/wayback-cdx-scraper/api/mcp

### C-64 — Scrapers open source AutoScout24 réutilisables comme parseurs de référence
- **Famille** : 14 — Autres
- **Mécanique** : un écosystème GitHub actif cible AS24 dans plusieurs langages et pour plusieurs TLD : `WebOlivia/autoscout24-scraper` (multi-pays, prix/features/dealer), `vkresch/autoscout24-crawler` (Scrapy), `lorenzoelia/autoscout24_scraping`, `prosowiec/autoscout24_scraper`, `0Baris/autoscout24-scraper`, `mauropelucchi/autoscout24`, `bocchilorenzo/autoscout24_bot` (`.it`, notification Telegram), `cashlo/go-scrape-autoscout24` (`.nl`, Go), `aolieman/auto-scrapers`. Valeur immédiate : la **carte des champs** et des sélecteurs actuels, et la date du dernier commit comme indicateur de ce qui fonctionne encore.
- **Point d'entrée connu** : `https://github.com/topics/autoscout24` ; `https://github.com/WebOlivia/autoscout24-scraper` ; `https://github.com/vkresch/autoscout24-crawler` ; `https://github.com/cashlo/go-scrape-autoscout24` ; `https://github.com/bocchilorenzo/autoscout24_bot` ; `https://github.com/lorenzoelia/autoscout24_scraping` ; `https://github.com/prosowiec/autoscout24_scraper` ; `https://github.com/0Baris/autoscout24-scraper` ; `https://github.com/mauropelucchi/autoscout24` ; `https://github.com/aolieman/auto-scrapers`
- **Questions falsifiables à tester en 1.4** :
  - « Au moins un de ces dépôts a un commit de moins de 6 mois, ce qui indiquerait une méthode encore fonctionnelle. »
  - « Au moins un couvre explicitement le TLD `.be` et le bilinguisme fr/nl. »
  - « Leur code révèle des endpoints ou paramètres d'URL non documentés dans les blogs commerciaux. »
- **Sources** : https://github.com/topics/autoscout24 ; https://github.com/WebOlivia/autoscout24-scraper ; https://github.com/vkresch/autoscout24-crawler ; https://github.com/cashlo/go-scrape-autoscout24 ; https://github.com/bocchilorenzo/autoscout24_bot ; https://github.com/lorenzoelia/autoscout24_scraping ; https://github.com/prosowiec/autoscout24_scraper ; https://github.com/0Baris/autoscout24-scraper ; https://github.com/mauropelucchi/autoscout24 ; https://github.com/aolieman/auto-scrapers

### C-65 — Documentation tierce non officielle de l'« API AutoScout24 » (PHP, historique)
- **Famille** : 14 — Autres
- **Mécanique** : deux dépôts GitHub hébergent une « AutoScout24 API documentation » réécrite en dehors d'AS24 (`jeroendesloovere/autoscout24-php-api-documentation`, fork `enricocaputo/...`), avec un fichier `_references.md`. Cette documentation de tierce partie décrit un état antérieur de l'API et peut nommer des endpoints, des champs et des sémantiques disparus de la documentation officielle actuelle.
- **Point d'entrée connu** : `https://github.com/jeroendesloovere/autoscout24-php-api-documentation` ; `https://github.com/jeroendesloovere/autoscout24-php-api-documentation/blob/master/source/includes/_references.md` ; `https://github.com/enricocaputo/autoscout24-php-api-documentation`
- **Questions falsifiables à tester en 1.4** :
  - « Cette documentation décrit des endpoints de **lecture** absents de la doc officielle actuelle. »
  - « Certains de ces endpoints historiques répondent encore. »
  - « Elle fournit le dictionnaire de champs canonique AS24, utile pour l'axe A3 même sans accès. »
- **Sources** : https://github.com/jeroendesloovere/autoscout24-php-api-documentation ; https://github.com/jeroendesloovere/autoscout24-php-api-documentation/blob/master/source/includes/_references.md ; https://github.com/enricocaputo/autoscout24-php-api-documentation

### C-66 — Rejeu d'appels XHR observés dans le navigateur (cartographie DevTools exhaustive)
- **Famille** : 14 — Autres / reconnaissance méthodique
- **Mécanique** : plutôt que d'inférer les endpoints depuis `robots.txt`, ouvrir une session navigateur réelle sur `autoscout24.be`, exercer chaque interaction (filtres, tri, pagination, facettes, carte, favoris, estimation de prix, vitrine concessionnaire) et journaliser tous les appels XHR/fetch avec leurs payloads et headers. Cela produit la liste **exhaustive et actuelle** des endpoints, y compris ceux absents de `robots.txt`, et les headers minimaux à reproduire.
- **Point d'entrée connu** : session navigateur locale ; onglet Network / export HAR ; cibles à couvrir : `/lst`, page de détail, page concessionnaire, `/prijsschatting/`
- **Questions falsifiables à tester en 1.4** :
  - « Le front appelle au moins un endpoint JSON de recherche non nommé dans `robots.txt`. »
  - « Les appels de facettes (compteurs par marque/modèle) sont servis par un endpoint distinct et bon marché. »
  - « Les headers requis se limitent à un jeu statique reproductible (pas de signature calculée en JS). »
  - **Note R3** : à cadrer strictement — une session de navigation manuelle reste dans l'esprit de la règle des sondes unitaires, mais le volume doit être journalisé.
- **Sources** : méthode ; corroborée par https://scrapfly.io/blog/posts/how-to-scrape-autoscout24 et par la sonde robots.txt

---

# Couverture des familles

| # | Famille | Candidats rattachés | État |
|---|---|---|---|
| 1 | API officielles AutoScout24 (write-only, partenaires, dealer) | C-01, C-02, C-03, C-04, C-05 | couverte |
| 2 | Endpoints internes du front web (`__NEXT_DATA__`, `/_next/data/`, REST/GraphQL internes, XHR) | C-06, C-07, C-08, C-09, C-10, C-11, C-12, C-13, C-14 (+ C-66 pour la cartographie XHR) | couverte |
| 3 | Endpoints de l'application mobile (iOS/Android) | C-15, C-16 | couverte |
| 4 | Flux partenaires et syndication (feeds concessionnaires, XML dealer export, agrégateurs B2B, multidiffusion) | C-17, C-18, C-19, C-20, C-21 | couverte |
| 5 | API tierces de scraping managé | C-22, C-23, C-24, C-25, C-26, C-27, C-28, C-29, C-30, C-31, C-32 | couverte |
| 6 | Navigateurs pilotés auto-hébergés + proxies résidentiels | C-33, C-34, C-35 | couverte |
| 7 | Services d'unblocking / résolution de challenge | C-36, C-37 | couverte |
| 8 | Datasets préexistants (Kaggle, HuggingFace, marketplaces, data brokers) | C-38, C-39, C-40, C-41 | couverte |
| 9 | Sources alternatives substituables | C-42, C-43, C-44, C-45, C-46, C-47 | couverte |
| 10 | Partenariat ou licence directe avec AutoScout24 | C-48, C-49, C-50 | couverte |
| 11 | Sitemaps et robots.txt | C-51, C-52 | couverte |
| 12 | Caches et archives tiers (Wayback, Common Crawl, moteurs) | C-53, C-54, C-55 | couverte |
| 13 | Services de valorisation automobile exposant des données de marché | C-56, C-57, C-58, C-59 | couverte |
| 14 | Autres (RSS, alertes email, extensions, crowdsourcing) | C-60, C-61, C-62, C-63, C-64, C-65, C-66 | couverte |

**Aucune famille écartée.** Les 14 familles du mandat sont représentées par au moins deux candidats.
Total : **66 candidats**, identifiants `C-01` à `C-66`.

## Voies découvertes au-delà du cadrage initial

Aucune famille entièrement nouvelle n'a été créée : les voies découvertes hors du cadrage initial ont
été rattachées aux familles existantes plutôt que d'inflater la taxonomie. Elles sont signalées ici
parce qu'elles n'étaient pas anticipées par le brief :

- **Oracle de comptage sans données** (C-12) — reconstruire des distributions par dichotomie sur un
  endpoint qui ne renvoie qu'un entier. Rattaché à la famille 2.
- **Reconstruction par concessionnaire** (C-13, C-17, C-29) — contourner le plafond de la recherche
  en énumérant les vitrines professionnelles. Rattaché aux familles 2, 4 et 5.
- **Périmètre explicitement autorisé par `robots.txt`** (C-14, C-58) — les pages SEO marque/modèle et
  l'outil d'estimation sont sous directive `Allow`, ce qui change l'analyse de l'axe A11 pour ces
  chemins précis. Rattaché aux familles 2 et 13.
- **Méta-agrégateur tiers déjà constitué** (C-45) — un tiers republie l'inventaire AS24 sous son
  propre domaine, sans la même couche anti-bot. Rattaché à la famille 9.
- **Backends d'outils grand public existants** (C-61) — une extension de suivi de prix implique un
  backend historique déjà constitué. Rattaché à la famille 14.

## Zones d'incertitude à porter en 1.2 / 1.3

1. **Contradiction non résolue sur le plafond de pagination** : Scrapfly annonce 200 pages × 20 =
   4 000 annonces par recherche ; roundproxies documente `page=1..20`, soit 400. Cette valeur
   conditionne tout le dimensionnement (axe A13) et n'a **pas** été mesurée en 1.1.
2. **Aucune mesure de la réaction d'Akamai** sur `autoscout24.be` : les 5 sondes autorisées ont porté
   sur `robots.txt` et `sitemap.xml`, pas sur `/lst`. Le comportement anti-bot est donc
   `[NON VÉRIFIÉ]`.
3. **`developers.autoscout24.ch` et `portal.services.as24.tech`** n'ont rendu que leur titre au fetch :
   contenu réel non lu, inventaire d'API officielles potentiellement incomplet.
4. **`https://eherreros.com/scraping/scraping-used-cars-api/`** (référencée comme traitant
   précisément du reverse engineering d'API de marketplaces auto) : domaine non résolu à la date de
   la sonde. Source à retrouver via cache/archive.
5. **Aucun dataset Hugging Face trouvé** : absence non démontrée, à instruire par recherche directe
   sur le Hub (C-40).
6. **Hôte réel de l'API GraphQL mobile (C-15) inconnu** : son identification est probablement le
   verrou le plus déterminant de tout l'inventaire.

## Actions relevant du commanditaire (R2 — aucun compte créé, aucun credential saisi)

Consignées ici pour alimenter la section `ACTIONS-COMMANDITAIRE` de la phase 1.6 :

| Candidat | Action requise du commanditaire |
|---|---|
| C-01, C-48 | Prise de contact commerciale avec `searchapi@autoscout24.com` |
| C-02, C-05, C-19, C-49 | Statut concessionnaire ou partenaire technique AS24 |
| C-22 à C-32 | Ouverture des comptes free-tier des fournisseurs de scraping managé |
| C-38 | Compte Kaggle pour le téléchargement des datasets |
| C-42 | Demande de `seller-key` / accès Search API mobile.de |
| C-56, C-57 | Demande de devis JD Power / Autovista et INDICATA |
| C-60 | Compte AutoScout24 pour créer les recherches sauvegardées |
