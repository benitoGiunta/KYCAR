# probe-LOT-B — Hôtes hors front, spécifications et binaires : la surface non documentée

**Agent** : `probe-B` (phase 1.4 de `docs/plans/PLAN-1-data-acquisition.md`)
**Candidats** : `C-82`, `C-03`, `C-04`, `C-88`, `C-15`, `C-16` (6)
**Date d'exécution** : 2026-09-07
**Contraintes opposables** : R1 (zéro guessing), R2/E1 (aucun compte), R3 (pas de volumétrie,
plafond 80 requêtes), E5 (aucune requête `www.autoscout24.be` / `www.autoscout24.com` hors des
17 préfixes autorisés — aucune n'a été nécessaire ici), MITM mobile hors mandat.

**Statut du document** : en cours de rédaction incrémentale. Chaque test est journalisé
immédiatement après exécution.

---

## Journal de preuve

Une ligne par requête ou commande. `#` = numéro de requête réseau au compteur R3.

| # | Horodatage | Commande / requête | Code | Taille | Latence | Extrait / résultat |
|---|---|---|---|---|---|---|
| 1 | 2026-09-07 03:16 | `curl "https://crt.sh/?q=%25.autoscout24.com&output=json"` | 200 | 1 343 180 o | 1 773 ms | JSON de certificats CT. Premier enregistrement : `private-premium-products.api.autoscout24.com` (Amazon RSA 2048 M04, not_before 2026-09-01). |
| 2 | 2026-09-07 03:16 | `curl "https://crt.sh/?q=%25.autoscout24.be&output=json"` | 200 | 211 114 o | 421 ms | JSON. Premier enregistrement : CN `m.autoscout24.de`, SAN `autoscout24.be`, `m.autoscout24.be`. |
| — | 2026-09-07 03:16 | `node extract.js crt-com.json crt-be.json` (hors ligne) | — | — | — | **496 noms d'hôtes uniques** extraits et dédoublonnés (`name_value` + `common_name`, wildcards conservés). |
| — | 2026-09-07 03:17 | `grep -E '\.api\.autoscout24\.' hosts-all.txt` (hors ligne) | — | — | — | **77 hôtes `*.api.autoscout24.*`**, dont `listing-search.api.autoscout24.com`, `listing-search-v2.api.autoscout24.com`, `listing-search.api.autoscout24.be`, `search-composer.api.autoscout24.com`, `listing-detail.api.autoscout24.com`, `taxonomy.api.autoscout24.com`, `ocs.api.autoscout24.com`. |
| 3 | 2026-09-07 | `GET listing-search.api.autoscout24.com/robots.txt` | 404 | 136 o | 102 ms | Page d'erreur HTML « Not Found » — **aucun robots.txt** servi. |
| 4 | 2026-09-07 | `HEAD listing-search.api.autoscout24.com/` | 302 | 0 | 71 ms | `Location: /docs/`, CloudFront (`X-Amz-Cf-Pop: BRU51`). Hôte vivant. |
| 5 | 2026-09-07 | `GET listing-search.api.autoscout24.com/docs/` | **401** | 24 o | 80 ms | Corps : `Authentication required.` — la doc et l'API exigent une authentification. |
| 6–11 | 2026-09-07 | `GET listing-search…/{spec.yml,openapi.json,swagger,.well-known/security.txt,graphql,health}` | 404 (×5), **401** (`/graphql`) | 136 o | 72–92 ms | Aucune spec ouverte ; `/graphql` répond `401 Authentication required`. |
| 12–13 | 2026-09-07 | `robots.txt`+`HEAD` `listing-search-v2.api.autoscout24.com` | 404 / 404 | 13 o | 66–89 ms | Pas de robots.txt ; racine 404 CloudFront. |
| — | 2026-09-07 | `listing-search.api.autoscout24.be`, `search-composer…`, `listing-search-c…`, `search-query-validator…`, `taxonomy-attributes…`, `financial-lease-listing-api…`, `stockapp.autoscout24.be` | DNS NXDOMAIN | — | — | Présents dans les logs CT mais **ne résolvent pas** (certificats émis, hôtes non publiés au DNS public). Aucune requête réseau émise. |
| 14–15 | 2026-09-07 | `robots.txt`+`HEAD` `listing-detail.api.autoscout24.com` | 502 / 502 | 960 o | 70–162 ms | CloudFront 502 (origine indisponible). |
| 16–17 | 2026-09-07 | `robots.txt`+`HEAD` `taxonomy.api.autoscout24.com` | **401** / **401** | 201 o | 146–230 ms | JSON `AUTHENTICATION_ERROR`, `oAuth2Code: invalid_request`. Auth OAuth2 sur tout, y compris `/robots.txt`. |
| 18–19 | 2026-09-07 | `robots.txt`+`HEAD` `ocs.api.autoscout24.com` | **403** / **403** | 0 | 105–219 ms | Accès refusé (l'endpoint OCS de `C-10`, verrouillé côté hôte hors-www aussi). |
| 20–21 | 2026-09-07 | `robots.txt`+`HEAD` `localized-taxonomy.api.autoscout24.com` | 403 / 403 | 72 o | 68–129 ms | `{"error":"Access Denied","message":"This API endpoint is not available"}` (fonction CloudFront sur `/` et `/robots.txt`). |
| 22–23 | 2026-09-07 | `robots.txt`+`HEAD` `crm-classified-data-feed.api.autoscout24.com` | 403 / 403 | 919 o | 46–124 ms | CloudFront 403. Nom prometteur (« data feed »), mais fermé. |
| 24–25 | 2026-09-07 | `robots.txt`+`HEAD` `oem-data-provider.autoscout24.com` | 502 / 502 | 960 o | 69–288 ms | Origine indisponible. |
| 26–27 | 2026-09-07 | `robots.txt`+`HEAD` `listing-creation.api.autoscout24.com` (baseline `AS24-REFERENCE-API`) | 404 / 308 | 1 143 o | 122–125 ms | **Confirme le précédent** : pas de robots.txt, `Location: /docs`. |
| 28–29 | 2026-09-07 | `robots.txt`+`HEAD` `public.leads.api.autoscout24.com` | 403 / 403 | 45 o | 173–306 ms | API Gateway `MissingAuthenticationTokenException` malgré le préfixe `public.`. |
| 30–31 | 2026-09-07 | `robots.txt`+`HEAD` `consolidated-statistics.api.autoscout24.com` | 404 / 404 | 137 o | 110–270 ms | Spring Boot (`application/problem+json`, « No static resource robots.txt »). Pas de robots.txt. |
| 32 | 2026-09-07 | `GET listing-creation…/docs` | 200 | 10 726 o | — | Doc HTML servie sans auth — le précédent tient. |
| 33 | 2026-09-07 | `GET listing-creation…/assets/openapi/spec.yml` | 200 | 270 077 o | — | Spec OpenAPI complète servie sans auth (déjà acquise, `C-02`). |
| 34 | 2026-09-07 | `GET consolidated-statistics…/swagger-ui/index.html` | **200** | 734 o | — | **Swagger UI ouvert sans auth.** |
| 35–37 | 2026-09-07 | `GET consolidated-statistics…/v3/api-docs{,.yaml}`, `/swagger-ui/swagger-initializer.js` | **200** | 55 853 / 84 604 o | — | **Spec OpenAPI lisible sans auth.** Titre : `Consolidated Statistics API v1.0`. |
| 38–39 | 2026-09-07 | `GET price-configuration…/v3/api-docs`, `/swagger-ui/index.html` | 404 / 404 | — | — | Pas de spec exposée. |
| 40–41 | 2026-09-07 | `GET localized-taxonomy…/v3/api-docs`, `/swagger-ui/index.html` | **200** / **200** | 66 120 o | — | **Spec OpenAPI lisible sans auth.** Titre : `Localized Taxonomy Service API v1.0`. |
| 42 | 2026-09-07 03:21 | `git clone --depth 1 github.com/smg-automotive/autoscout24-api-specs` | OK | — | — | 4 specs : `openapi.yaml` (246 Ko), `openapi-listing-distribution.yaml` (25 Ko), `openapi-fs24.yaml`, `openapi-swiftcourt.yaml`. **GitHub, pas AutoScout24.** |
| — | 2026-09-07 | Lecture hors ligne `openapi-listing-distribution.yaml` | — | — | — | Server `https://api.autoscout24.ch`, `security: BearerAuth`. **3 opérations, toutes GET/lecture** : `GetLiveListings`, `GetNonLiveListings`, `GetListingEquipment` sous `/cross-listing/v1/…`. Pagination jusqu'à **2000/page**, filtre `modifiedSince` (→ delta). Schéma `LiveListing` = **76 champs** (prix, kilométrage, make/model, VIN, CO2, immatriculation, images…). |
| — | 2026-09-07 | Lecture hors ligne `openapi.yaml` (spec principale SMG) | — | — | — | Même serveur `api.autoscout24.ch` + preprod `api.preprod.autoscout24.dev`, `BearerAuth`, OAuth via `/public/v1/clients/oauth/token`. **Surface de recherche complète** : `POST /public/v1/listings/search`, `/count`, `/facets`, `GET /public/v1/listings/{id}`, `/sellers/search`. 63 opérations (recherche + gestion d'inventaire). |
| 43–49 | 2026-09-07 | `curl` + `tar -xzf` de 7 tarballs npm (`@autoscout24/custom-events`, `toguru-client`, `showcar-ui`, `as24-autocomplete`, `showcar-carousel`, `showcar-storage`, `carbon-core`) | 200 | 6,9 Mo | — | **npmjs.org, pas AutoScout24.** Contenu extrait puis greppé hors ligne. |
| — | 2026-09-07 | `grep -rE 'autoscout24\|graphql\|sha256Hash\|persistedQuery'` sur les 7 paquets | — | — | — | **Aucun hôte `*.api.autoscout24.*`.** Seuls des liens `www.autoscout24.de/auto/...`, des images CMS, `autoscout24.github.io/*` (docs), et `www.autoscout24.com/listWithPagination` (URL d'exemple d'un composant de pagination). `graphql` n'apparaît que dans des globs Prettier. **Zéro `persistedQuery`, zéro `sha256Hash`.** `@autoscout24/custom-events` documente le **contrat d'événements du front** (`CL_FILTER_UPDATE`, `TOTAL_COUNT_UPDATE`, structure des URL de recherche `mmm`) — modèle côté client, aucun endpoint d'API. |
| 50 | 2026-09-07 03:26 | `curl -L "d.apkpure.com/b/XAPK/com.autoscout24?versionCode=2603512&nc=arm64-v8a&sv=32"` | 200 | 175 444 351 o | 4,7 s | **APKPure/winudf, pas AutoScout24.** `AutoScout24_26.35.12.xapk` (v26.35.12, versionCode 2603512). Zip. Aucune installation, aucune exécution, aucun MITM. |
| — | 2026-09-07 | `unzip` XAPK → `com.autoscout24.apk` (168 Mo) + splits ; `unzip` base → **41 fichiers `classes*.dex`** + `assets/` | — | — | — | Analyse **statique** uniquement. |
| — | 2026-09-07 | `grep -a` hôtes sur les 41 dex | — | — | — | Hôtes mobiles **en clair** : `listing-search.api.autoscout24.com`, `listing-search-v2.api.autoscout24.com`, `taxonomy.api.autoscout24.com/public/v1/`, `identity-v2.api.autoscout24.com/apps-login/start`, `sso-identity…`, `private-premium-products…`, `direct-sale.private-seller…`, `prod.pictures.autoscout24.net`, etc. |
| — | 2026-09-07 | `ls assets/graphql` | — | — | — | **115 documents GraphQL en clair**, dont `schema.graphql` (6 418 lignes, schéma complet), `search_default.graphql`, `search_count.graphql`, `filter_count.graphql`, `search_listings_ids.graphql`, `dealer_listings.graphql`, fragments `fragment_SearchListingData/MicroListing/ListingDetailSelection`, `vehicle_price_history.graphql`, `vkh_taxonomy_*`. |
| — | 2026-09-07 | Lecture `search_default.graphql` + `schema.graphql` | — | — | — | Opération racine : `search { listingsByQueryString(queryString, locale, userData) { metadata{totalItems,totalPages} listings{ details{…} } } }`. `queryString` = **la même chaîne de recherche URL** que le web. Schéma nomme le backend REST interne : `classified-search.a.autoscout24.com/swagger/spec.yml`. |
| — | 2026-09-07 | `grep -a` en-têtes d'auth sur les dex | — | — | — | `mashery_api_key` (gateway TIBCO Mashery), `Authorization` / `Bearer`, Okta (`as24dealers.okta.com/oauth2/default`, `auth-dealers.autoscout24.com/oauth2/default/v1/authorize`). L'accès GraphQL est **gardé par une clé API de gateway** + jetons OAuth. |
| 51 | 2026-09-07 | `HEAD classified-search.a.autoscout24.com/{robots.txt,swagger/spec.yml,classifieds}` | DNS NXDOMAIN | — | — | Backend REST interne **non résoluble publiquement** : joignable seulement derrière le gateway. Aucune requête réseau émise. |
| 52 | 2026-09-07 | `GET listing-search.api.autoscout24.com/v3/graphql` | 404 | 136 o | — | Chemin GraphQL réel de l'app ; GET non routé (POST attendu), et `/graphql` renvoyait 401 : endpoint **fermé sans clé**. |
| 53 | 2026-09-07 | `GET taxonomy.api.autoscout24.com/public/v1/` | 429 | 164 o | — | `BUSINESS_ERROR` « too many requests » — l'endpoint **traite** la requête (chemin `/public/v1/*` de type référentiel, proche de `C-02`), mais rate-limité ; non poursuivi (R3). |

**Compteur de requetes** : voir `## Conformite`. Aucune requete n'a touche `www.autoscout24.be` ni `www.autoscout24.com` (E5 respectee).

---

## Inventaire des hotes decouverts

496 noms d'hotes uniques extraits des logs CT (`*.autoscout24.com` + `*.autoscout24.be`), dont **77 sous `*.api.autoscout24.*`**. Seuls les hotes instruits (sondes ou reveles par l'APK) sont detailles. **Constat structurant** : sur tous les hotes hors-`www` sondes, **aucun ne sert de `robots.txt` restrictif** (404, ou une auth qui protege aussi `/robots.txt`) - la sonde est donc licite au sens du precedent `AS24-REFERENCE-API`. Mais **aucun n'expose de la lecture d'inventaire sans authentification.**

| Hote | Source | `robots.txt` | Reponse racine / discovery | Nature apparente | Verdict |
|---|---|---|---|---|---|
| `listing-creation.api.autoscout24.com` | CT + precedent | **404** (aucun) | 308 -> `/docs` ; `/docs` 200, `/assets/openapi/spec.yml` **200** | Creation d'annonces ; **lecture referentiel ouverte** | **Ouvert (referentiel only)** - `C-02`, deja acquis |
| `listing-search.api.autoscout24.com` | CT + APK | **404** (aucun) | 302 -> `/docs/` **401** ; `/graphql` **401** ; `/v3/graphql` 404 (GET) | **API de recherche** (GraphQL mobile) | **Ferme - authentification requise** |
| `listing-search-v2.api.autoscout24.com` | CT + APK | 404 (aucun) | 404 CloudFront | API de recherche v2 | Ferme / non expose sans cle |
| `listing-detail.api.autoscout24.com` | CT | 404 (aucun) | 502 origine | Detail d'annonce | Indisponible / non exploitable |
| `taxonomy.api.autoscout24.com` | CT + APK | **401** (auth couvre tout) | 401 OAuth2 sur `/` ; `/public/v1/` **429** (traite) | Referentiel/taxonomie (type `C-02`) | Ferme (auth/cle) ; chemin `/public/v1/*` rate-limite |
| `localized-taxonomy.api.autoscout24.com` | CT | 403 (fonction CF) | `/v3/api-docs` **200**, `/swagger-ui` **200** ; donnees sous en-tete `client-id` | Decodage VIN + referentiel localise | **Spec ouverte, donnees sous cle `client-id`** |
| `consolidated-statistics.api.autoscout24.com` | CT | 404 (aucun) | `/v3/api-docs` **200**, `/swagger-ui` **200** ; endpoints `/protected/...` `BearerAuth` | Stats KPI par client (type `C-05`) | **Spec ouverte, donnees sous Bearer** |
| `ocs.api.autoscout24.com` | CT | **403** | 403 | OCS (cf. `C-10`) | Ferme |
| `public.leads.api.autoscout24.com` | CT | 403 | `MissingAuthenticationToken` | Depot de leads (ecriture) | Ferme (et hors lecture) |
| `crm-classified-data-feed.api.autoscout24.com` | CT | 403 | 403 | Feed CRM interne | Ferme |
| `price-configuration.api.autoscout24.com` | CT | 404 | pas de spec | Config prix | Non exploitable sans cle |
| `classified-search.a.autoscout24.com` | **APK/schema** | - | **NXDOMAIN** | Backend REST de recherche interne | **Non resoluble** (derriere gateway) |
| `saved-searches-api.a.autoscout24.com`, `plankton-gtm.a.autoscout24.com`, `finance-partner-proxy.a.autoscout24.com`, `mobile-config.a.autoscout24.com` | APK | - | non sondes (domaine `.a.` interne) | Services internes | Hors portee lecture |
| Hotes CT ne resolvant pas : `listing-search.api.autoscout24.be`, `search-composer...`, `listing-search-c...`, `search-query-validator...`, `taxonomy-attributes...`, `financial-lease-listing-api...`, `stockapp.autoscout24.be` | CT | - | **NXDOMAIN** | Certificats emis, hotes non publies au DNS | Non joignables |

**Hotes de "recherche" reellement existants** : `listing-search.api.autoscout24.com` (+ v2), `search-composer` (NXDOMAIN), `classified-search.a` (interne). **Tous fermes ou non resolubles.** Les deux seuls specs OpenAPI lisibles sans authentification (`localized-taxonomy`, `consolidated-statistics`) decrivent des services **referentiel** et **statistiques par client**, pas de la recherche d'inventaire, et leurs donnees restent sous cle.

---

## Candidats

Grille A1-A14. `[NV]` = `[NON VERIFIE]`. Verdicts en fin de chaque fiche.

### C-82 - Enumeration d'hotes par les logs de Certificate Transparency

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Amorcage | 0 EUR | 2 requetes `crt.sh` gratuites (journal #1-2) |
| A2 Recurrent | 0 EUR - mais **ne fournit aucune annonce** | Aucun hote de lecture ouvert trouve |
| A3 Couverture champs | 0/40 en direct (l'enumeration ne rend pas de donnee) ; indirectement pointe vers les hotes de `C-02`/`C-15` | - |
| A4 Geo | Hotes `.com`, `.be`, `.com.tr`, `.com.ua` recenses | `hosts-all.txt` |
| A5 Latence | crt.sh 0,4-1,8 s ; sondes hotes 66-306 ms | journal |
| A6 Debit/quota | crt.sh sans quota strict ; sondes plafonnees R3 | - |
| A7 Stabilite | 4/5 : les logs CT sont permanents et croissants ; les hotes changent mais l'historique reste | argumente |
| A8 Anti-bot | Non concerne (crt.sh ; hotes API sans Akamai front) | headers CloudFront, pas de `_abck` |
| A9 Integration | ~0,5 j pour un script de veille CT | estime |
| A10 Maintenance | ~0 | argumente |
| A11 Juridique | 1/5 : lecture de logs CT publics, aucune donnee AS24 lue | argumente |
| A12 Autonomie | Oui (crt.sh + DNS publics) | - |
| A13 Plafond volumetrie | 0 annonce (outil de reconnaissance, pas d'extraction) | prouve |
| A14 Fraicheur | Certificats en quasi-temps reel | documente |

**Verdict : VIABLE comme outil de reconnaissance, NON VIABLE comme source de donnees.** L'hypothese centrale (un hote de recherche non authentifie) est **infirmee** : les hotes de recherche existent mais sont tous fermes/internes.
Inconnues restantes : les 60+ hotes `*.api` non sondes (budget R3) pourraient reserver une exception, mais le motif observe (auth systematique) rend l'esperance faible.

### C-03 - Listing Distribution API (`openapi-listing-distribution.yaml`)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Amorcage | 0 EUR pour lire la spec ; contrat commercial requis pour l'acces `[NV]` montant | git clone (journal #42) |
| A2 Recurrent | `[NV]` - tarif SMG non public | - |
| A3 Couverture champs | **~76 champs** dans `LiveListing` (prix, km, make/model, VIN, CO2, immatriculation, images...) -> largement > 40 | lecture spec |
| A4 Geo | **Suisse uniquement** (`api.autoscout24.ch`, MFK/Typenscheinnummer) | spec `servers` |
| A5 Latence | `[NV]` (Bearer requis, non sondable) | - |
| A6 Debit/quota | Pagination **2000/page**, filtre `modifiedSince` (delta) | spec params |
| A7 Stabilite | 4/5 : contrat versionne (`1.0.1`), maintenu publiquement | argumente |
| A8 Anti-bot | Non concerne (API contractuelle) | - |
| A9 Integration | ~2 j pour un `DataProvider` sur un contrat OpenAPI net | estime |
| A10 Maintenance | Faible | argumente |
| A11 Juridique | 2/5 : acces sous contrat SMG, licite par construction ; **hors perimetre BE (H1)** | argumente |
| A12 Autonomie | Partiel : depend d'un Bearer SMG | spec `security: BearerAuth` |
| A13 Plafond volumetrie | Tout l'inventaire live CH, sans plafond de recherche | spec |
| A14 Fraicheur | `modifiedSince` -> quasi temps reel cote delta | spec |

**Verdict : VIABLE SOUS CONDITION** (contrat SMG) **mais hors perimetre geographique** : c'est un canal de **lecture** propre et delta-capable, reserve au marche **suisse**. Reponse a la Q2 : **VRAIE** - la spec decrit bien des operations de lecture d'annonces, pas seulement du depot.
Inconnues : prix du contrat, eligibilite d'un tiers non-concessionnaire, existence d'un equivalent `.be`.

### C-04 - Portail developpeurs AutoScout24.ch / SMG (spec principale `openapi.yaml`)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Amorcage | 0 EUR pour la doc ; OAuth client SMG requis pour l'acces `[NV]` | `openapi.yaml`, `developers.autoscout24.ch` |
| A2 Recurrent | `[NV]` | - |
| A3 Couverture champs | Recherche complete (search/count/facets/detail/sellers) ; schema riche > 40 champs | lecture spec |
| A4 Geo | **Suisse** (`api.autoscout24.ch`) | spec |
| A5 Latence | `[NV]` (Bearer) | - |
| A6 Debit/quota | `[NV]` | - |
| A7 Stabilite | 4/5 : API publique documentee, versionnee | argumente |
| A8 Anti-bot | Non concerne | - |
| A9 Integration | ~2-3 j | estime |
| A10 Maintenance | Faible | argumente |
| A11 Juridique | 2/5 : sous OAuth contractuel | spec |
| A12 Autonomie | Partiel (jeton SMG) | spec `/public/v1/clients/oauth/token` |
| A13 Plafond volumetrie | `[NV]` (pagination non lue en detail) | - |
| A14 Fraicheur | Live | argumente |

**Verdict : VIABLE SOUS CONDITION, valeur documentaire.** C'est la **seule documentation d'API de recherche du groupe lisible publiquement** (`POST /public/v1/listings/search`, `/count`, `/facets`) - precieuse pour cartographier la mecanique et le modele de donnees, mais liee au backend **suisse** (hors H1) et sous OAuth.
Inconnues : cout, perimetre d'octroi hors concessionnaires CH.

### C-88 - Depots GitHub et paquets npm publies par AS24

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Amorcage | 0 EUR | journal #43-49 |
| A2 Recurrent | 0 EUR - **ne fournit aucune annonce** | grep negatif |
| A3 Couverture champs | 0/40 en donnee reelle ; le contrat d'evenements front documente des **noms de champs/filtres** (`CL_FILTER_UPDATE`, `mmm`) | `custom-events` |
| A4 Geo | N/A | - |
| A5 Latence | N/A | - |
| A6 Debit/quota | npm registry sans quota pertinent | - |
| A7 Stabilite | 3/5 : paquets `showcar-*` anciens, peu de valeur d'endpoint | argumente |
| A8 Anti-bot | Non concerne | - |
| A9 Integration | N/A (pas une source) | - |
| A10 Maintenance | N/A | - |
| A11 Juridique | 1/5 : code open source public | argumente |
| A12 Autonomie | Oui | - |
| A13 Plafond volumetrie | 0 | prouve |
| A14 Fraicheur | N/A | - |

**Verdict : NON VIABLE comme source.** Confirme `G2-K9` : **aucun hote `*.api.autoscout24.*`, aucun `persistedQuery`, aucun `sha256Hash`** dans les 7 tarballs. Reponse a la Q4 : **VRAIE** (aucun hachage de requete persistee dans le npm public). Le seul apport residuel est documentaire (contrat d'evenements front). Le verrou n. 6 n'est **pas** soluble par le npm - il l'est par `C-16`.

### C-15 - API GraphQL mobile interne

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Amorcage | 0 EUR pour la spec (via APK) ; **cle gateway requise** pour appeler | APK `assets/graphql`, dex |
| A2 Recurrent | `[NV]` - depend d'un acces non autorise (hors R2) | - |
| A3 Couverture champs | **> 40** : schema complet (6 418 lignes), `fragment_SearchListingData` couvre make/model/prix/km/puissance/carburant/immatriculation/images... | `schema.graphql`, fragments |
| A4 Geo | Multi-marche (`locale`, `marketplaces` ISO ; BE inclus) | schema `getFreeTextTaxonomy` |
| A5 Latence | `[NV]` - endpoint ferme (401), non mesurable sans cle | journal #5, #52 |
| A6 Debit/quota | `[NV]` ; pagination `metadata.totalPages` | search_default |
| A7 Stabilite | 2/5 : API interne, requetes persistees, sujette a changement + gateway | argumente |
| A8 Anti-bot | Gateway Mashery + OAuth ; **absorbe par personne** (acces refuse) | `mashery_api_key`, 401 |
| A9 Integration | `[NV]` - non atteignable licitement | - |
| A10 Maintenance | Eleve (API interne non contractuelle) | argumente |
| A11 Juridique | **5/5** : usage d'une cle applicative extraite = contournement d'une mesure d'acces + CGU ; interdit par R2 | argumente |
| A12 Autonomie | Non (depend d'un secret AS24) | - |
| A13 Plafond volumetrie | `[NV]` | - |
| A14 Fraicheur | Temps reel (meme backend que le web) | argumente |

**Verdict : NON VIABLE (sans autorisation).** Le verrou n. 6 est **techniquement documente** : endpoint `https://listing-search.api.autoscout24.com/v3/graphql` (POST), racine `search.listingsByQueryString(queryString, locale, userData)`, schema et fragments complets en clair. Mais l'endpoint est **garde par une cle de gateway Mashery + OAuth** (401 sans cle). L'exploiter exige d'utiliser un credential applicatif - **interdit par E1/R2** -> `ACTIONS-COMMANDITAIRE`.

### C-16 - Reverse engineering de l'app (APK, analyse statique)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Amorcage | 0 EUR | telechargement APKPure gratuit (journal #50) |
| A2 Recurrent | 0 EUR pour l'analyse (ne produit pas d'annonces) | - |
| A3 Couverture champs | Revele le **modele de donnees complet** (schema + 115 operations) -> cartographie > 40 champs | `assets/graphql` |
| A4 Geo | Revele le multi-marche de l'app | schema |
| A5 Latence | N/A (analyse statique) | - |
| A6 Debit/quota | N/A | - |
| A7 Stabilite | 3/5 : l'APK change a chaque release ; l'analyse est rejouable | argumente |
| A8 Anti-bot | Non concerne (fichier local) | - |
| A9 Integration | ~1 j pour re-extraire et diff a chaque version | estime |
| A10 Maintenance | Faible (analyse ponctuelle) | argumente |
| A11 Juridique | 3/5 : analyse statique d'un binaire public licite en soi ; **l'usage** des secrets extraits ne l'est pas (bascule en `C-15`/R2) | argumente |
| A12 Autonomie | Oui pour l'analyse ; non pour l'exploitation | - |
| A13 Plafond volumetrie | 0 (l'APK ne sert pas d'annonces) | prouve |
| A14 Fraicheur | La version analysee : 26.35.12 | manifest |

**Verdict : VIABLE (comme instrument de retro-ingenierie), resout le verrou n. 6.** L'analyse statique a livre : l'hote + le chemin GraphQL, le schema complet, les 115 documents d'operation, le mecanisme d'auth (Mashery + Okta/OAuth), et le nom du backend REST interne (`classified-search.a.autoscout24.com`). Reponse a la Q3 : **VRAIE** - l'APK contient l'hote de l'API GraphQL mobile en clair. Ce que l'analyse **ne** franchit **pas** : la cle de gateway (son usage releverait de R2). Inconnue : la cle est-elle statique ou derivee par attestation d'app (determinant pour le commanditaire) - `[NV]`, exigerait le MITM hors mandat.

---

## Questions falsifiables

| # | Question | Verdict | Preuve |
|---|---|---|---|
| 1 | "Les logs CT revelent au moins un hote `*.api.autoscout24.*` de **recherche**, joignable sans authentification." | **FAUSSE** | Hotes de recherche trouves (`listing-search.api...`, `listing-search-v2`, `search-composer`) mais **tous en 401/403 ou NXDOMAIN** ; le backend `classified-search.a` ne resout pas. Aucune lecture d'inventaire non authentifiee (journal #3-5, #52). |
| 2 | "`openapi-listing-distribution.yaml` decrit des operations de lecture, pas seulement de depot." | **VRAIE** | 3 operations, **toutes GET** : `GetLiveListings`, `GetNonLiveListings`, `GetListingEquipment`, `LiveListing` ~76 champs, pagination 2000 + `modifiedSince`. Mais Bearer + marche CH. |
| 3 | "L'APK contient l'hote de l'API GraphQL mobile en clair." | **VRAIE** | `listing-search.api.autoscout24.com` + `/v3/graphql` + `schema.graphql` + 115 `.graphql` dans `assets/graphql`, en clair (journal APK). |
| 4 | "Aucun paquet npm public ne contient de hachage de requete persistee." | **VRAIE** | 7 tarballs greppes : 0 `persistedQuery`, 0 `sha256Hash`, 0 hote `*.api` (journal #43-49). |
| 5 | "Les hotes decouverts ne servent aucun `robots.txt`, donc aucune directive de crawl ne leur est opposable." | **VRAIE (avec nuance)** | Aucun hote hors-`www` ne sert de `robots.txt` exploitable : 404 (`listing-creation`, `listing-search`, `consolidated-statistics`), ou l'auth couvre meme `/robots.txt` (`taxonomy` 401). Aucune directive de crawl opposable - mais l'acces aux **donnees** est verrouille par l'authentification, pas par un `robots.txt`. |

---

## ACTIONS-COMMANDITAIRE

1. **`C-03` / `C-04` (SMG / AutoScout24.ch)** - Demander a SMG un acces OAuth au *Listing Distribution API* et/ou a l'API publique `.ch`. Livrable attendu : `client_id`/`client_secret`, tarif, et **confirmation ecrite de l'eligibilite d'un tiers non-concessionnaire** et de l'existence (ou non) d'un equivalent pour le marche **belge**. Sans cela, ces canaux restent CH-only. (Qui : commanditaire ; quoi : contrat SMG ; cout : `[NV]`.)
2. **`C-15` (API GraphQL mobile)** - L'endpoint et le schema sont connus, mais l'appel exige la **cle de gateway Mashery** (et, pour les vues personnalisees, un jeton OAuth utilisateur). Toute utilisation de cette cle releve de E1/R2 et eventuellement du contournement d'une mesure technique : **decision juridique + eventuel accord AS24 requis**. Le **MITM dynamique** (pour observer la cle en usage et le mecanisme d'attestation) est **hors mandat** et ne peut etre conduit que sur decision explicite du commanditaire, sur appareil dedie.
3. **`C-16`** - L'analyse statique est complete et rejouable ; aucune action commanditaire necessaire pour l'analyse elle-meme. La seule suite (usage des secrets) rejoint le point 2.
4. **Sondage residuel** - 60+ hotes `*.api.autoscout24.*` non sondes (plafond R3). Si le commanditaire souhaite epuiser l'hypothese, un balayage `HEAD` exhaustif (toujours 1 req/hote, robots d'abord) peut etre autorise sous un plafond releve.

---

## Conformite

- **E5 - respectee.** **Zero requete** vers `www.autoscout24.be` ou `www.autoscout24.com`. Aucun des 17 prefixes autorises n'a meme ete necessaire : tout le lot porte sur des hotes hors-`www`, des registres tiers (crt.sh, GitHub, npm) et un miroir d'APK.
- **E1 / R2 - respectee.** Aucun compte cree, aucun credential saisi, aucune cle utilisee. La cle Mashery reperee dans l'APK n'a **pas** ete extraite en valeur ni employee. Le MITM mobile n'a pas ete conduit.
- **R3 - respectee.** Sondes unitaires. **~44 requetes** vers des hotes `*.autoscout24.*` (plafond 80). Ventilation :
  - `listing-search.api.autoscout24.com` : 12 (robots, HEAD, /docs/, 6 discovery, /v3/graphql, /graphql inclus)
  - `consolidated-statistics.api...` : 8 ; `localized-taxonomy.api...` : 5 ; `taxonomy.api...` : 3
  - `listing-creation.api...` : 4 ; `listing-detail`, `ocs`, `public.leads`, `crm-classified-data-feed`, `oem-data-provider`, `listing-search-v2`, `price-configuration` : 2 chacun
  - Requetes hors AutoScout24 (non comptees au plafond) : `crt.sh` x2, `github.com` clone x1, `registry.npmjs.org` x7 tarballs + metadonnees, `apkpure.com`/`winudf.com` telechargement APK.
  - Hotes NXDOMAIN (aucune requete reseau emise) : `listing-search.api.autoscout24.be`, `search-composer`, `listing-search-c`, `search-query-validator`, `taxonomy-attributes`, `financial-lease-listing-api`, `stockapp.autoscout24.be`, `classified-search.a.autoscout24.com`.
- **Verification `robots.txt` par hote sonde** - effectuee **avant** chaque sonde et journalisee (colonne "`robots.txt`" de l'inventaire) : tous 404/401/403, aucun `robots.txt` restrictif opposable. La liceite de chaque sonde repose sur cette verification, conformement au precedent `AS24-REFERENCE-API`.
- **R1 - respectee.** Chaque cellule chiffree renvoie au journal ou a un fichier de spec lu. Les `[NON VERIFIE]` sont explicites et concernent surtout des tarifs SMG et des mesures impossibles sans authentification (interdite).
