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
