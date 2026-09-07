# probe-LOT-J — Archives, index et caches tiers

**Agent** : `probe-J`, phase 1.4 du `PLAN-1-data-acquisition.md`.
**Candidats** : `C-53` (Wayback), `C-54` (Common Crawl), `C-55` (API d'index), `C-71` (urlscan.io), `C-72` (HTTP Archive).
**Propriété du lot** : aucun test ne touche `www.autoscout24.be` ni `.com`. E5 non contraignante.
**Date d'exécution** : 2026-09-07.

---

## Journal de preuve

Chaque ligne est rejouable telle quelle par l'auditeur de la phase 1.5.

| # | Domaine | Commande | Résultat |
|---|---|---|---|
| J01 | web.archive.org | `curl -s "https://web.archive.org/cdx/search/cdx?url=autoscout24.be&matchType=domain&showNumPages=true&pageSize=5"` | HTTP 200, réponse `133`. 133 pages de 5 blocs zipnum. |
| J02 | web.archive.org | idem `&output=json&fl=urlkey&pageSize=5&page={0,44,88,132}` (4 requêtes) | 24 791 / 32 221 / 33 620 / 19 893 lignes. Volume domaine estimé ≈ 3,7 M captures. Motifs de chemin dominants dans l'échantillon : `nl/lst`, `fr/lst`, `aboutus/fr-be`, `test/…`. |
| J03 | web.archive.org | `curl -s "https://web.archive.org/cdx/search/cdx?url=www.autoscout24.be/fr/offres/&matchType=prefix&output=json&fl=timestamp,original,statuscode,mimetype,length"` | HTTP 200, 54,9 Mo, **291 366 captures**. |
| J04 | web.archive.org | idem avec `url=www.autoscout24.be/nl/aanbod/` | HTTP 200, 61,6 Mo, **328 989 captures**. |
| J05 | web.archive.org | idem avec `url=www.autoscout24.be/offres/` puis `/aanbod/`, `/annonces/`, `/fr/aanbod/` (4 requêtes) | 8 / 0 / 0 / 0 captures. Les seuls deux motifs de page d'offre sont `/fr/offres/` et `/nl/aanbod/`. |
| J06 | web.archive.org | `curl -sL "https://web.archive.org/web/{20190718153029,20210125142540,20260104021807,20171210093623}id_/<url d'offre>"` (4 requêtes) | HTTP 200 : 95 743 / 95 906 / 125 862 / 51 065 o. `__NEXT_DATA__` présent **uniquement** dans le snapshot 2026. |
| J07 | web.archive.org | 7 snapshots, un par semestre de `202201` à `202501` (7 requêtes) | HTTP 200 sur les 7. `__NEXT_DATA__` **présent sur les 7**. |
| J08 | web.archive.org | 4 snapshots `202105`, `202108`, `202110`, `202111` (4 requêtes) | HTTP 200 sur les 4, `__NEXT_DATA__` **absent sur les 4**. Encadre la migration Next.js : **entre 2021-11-27 et 2022-01-18**. |
| J09 | local | parse JSON des blocs `__NEXT_DATA__` de `202201`, `202307`, `202601` | Parse `OK` pour les 3. 88 887 / 53 621 / 85 053 octets. `props.pageProps.listingDetails` : 29 / 37 / 43 clés, 262 / 406 / 547 feuilles scalaires. |
| J10 | web.archive.org | `curl -s "https://web.archive.org/cdx/search/cdx?url=www.autoscout24.be/robots.txt&output=json&fl=timestamp,statuscode,digest,length&collapse=digest"` | HTTP 200, 427 263 o, **6 361 versions distinctes** du `robots.txt`, de **2001-05-18** au **2026-01-31**. Aucune capture postérieure à 2026-01-31. |
| J11 | web.archive.org | `curl -sL "https://web.archive.org/web/{20230130,20230915,20240501,20240915,20260101}id_/https://www.autoscout24.be/robots.txt"` (5 requêtes) | HTTP 200 : 2 790 / 2 856 / 2 856 / 1 745 / 1 918 o. `CCBot`, `GPTBot`, `ClaudeBot` **absents des cinq**. La version servie pour 20260101 s'auto-date `#MH, 16.12.2025`. |
| J12 | web.archive.org | idem `20250601id_` | HTTP 200, 1 614 o. `CCBot` absent, aucune directive `Allow: /fr/`. Fichier auto-daté `#LB, 13.02.2025`. |
| J13 | web.archive.org | `curl -s ".../cdx?url=www.autoscout24.be/fr/lst&matchType=prefix&fl=timestamp,statuscode&filter=statuscode:200"` puis idem `nl/lst` (2 requêtes) | HTTP 200, 21,0 Mo et 22,2 Mo. **806 449** et **855 350** captures HTTP 200 ; **1 959** et **1 928** jours de capture distincts. |
| J14 | web.archive.org | `.../cdx?url=www.autoscout24.be/fr/lst&matchType=prefix&fl=timestamp,original,length&filter=statuscode:200&from=2026&limit=6` | HTTP 200, 6 captures de `https://www.autoscout24.be/fr/lst` les 01/01, 02/01, 03/01, 04/01 (×2), 05/01 2026 — cadence quotidienne visible à l'œil nu. |
| J15 | web.archive.org | `curl -sL "https://web.archive.org/web/20260101185529id_/https://www.autoscout24.be/fr/lst"` | HTTP 200, 154 695 o. `__NEXT_DATA__` parse **OK** (211 346 o). `numberOfResults = 112 849`, `numberOfPages = 200`, `pageQuery.cy = "B"`, **19 annonces**, 65 feuilles scalaires par annonce. |
| J16 | index.commoncrawl.org | `curl -s "https://index.commoncrawl.org/collinfo.json"` | HTTP 200, 34 947 o, **127 collections**, de `CC-MAIN-2008-2009` à `CC-MAIN-2026-34`. |
| J17 | index.commoncrawl.org | `curl -s ".../<crawl>-index?url=autoscout24.be%2F*&showNumPages=true&output=json"` pour 4 crawls (4 requêtes) | HTTP 200 × 4. `{"pages":1,"blocks":1}` / `blocks:2` / `blocks:3` / `blocks:4` pour 2026-34 / 2025-26 / 2023-50 / 2020-34. |
| J18 | index.commoncrawl.org | `curl -s ".../<crawl>-index?url=autoscout24.be%2F*&output=json&limit=100000"` pour `CC-MAIN-2026-34`, `2025-26`, `2023-50`, `2020-34` (4 requêtes) | HTTP 200 × 4 ; 702 Ko / 2,17 Mo / 2,05 Mo / 328 Ko ; **1 179 / 3 792 / 3 647 / 615** enregistrements. Pages d'offre en HTTP 200 : **0 / 978 / 760 / 57**. |
| J19 | index.commoncrawl.org | `curl -s ".../<crawl>-index?url=autoscout24.be%2F*&output=json&limit=200"` pour les 4 mêmes crawls (4 requêtes) | HTTP 200 × 3 ; **HTTP 502 nginx** sur `CC-MAIN-2023-50` — indisponibilité transitoire, la requête suivante sur le même crawl a répondu 200. Sonde de forme, remplacée par J18. |
| J20 | urlscan.io | `curl -s "https://urlscan.io/api/v1/search/?q=<requête>&size=100"` — 9 requêtes de recherche | HTTP 200 × 8, HTTP 403 × 1 (`page.url:*…*` : « Regular Expressions and leading wildcard searches are not supported »). `page.domain:autoscout24.be` → `total: 0`. Contrôle `page.domain:github.com` → `total: 10000`. |
| J21 | urlscan.io | `curl -s "https://urlscan.io/dom/019cfbe5-a1be-7452-88df-340ddb234b0a/"` | **HTTP 403**, 40 o : `{"warning": "You're not logged in!"}`. L'accès au DOM exige un compte. |
| J22 | local | `command -v bq` ; `command -v gcloud` ; `bq version` | Aucune sortie ; `bash: bq: command not found`. **Aucune requête BigQuery n'a pu être émise, aucune ne l'a été.** |
| J23 | har.fyi | lecture documentaire de `har.fyi/guides/getting-started/` et `har.fyi/reference/tables/pages/` (2 requêtes) | Palier gratuit BigQuery **1 To/mois** ; `crawl.pages` ≈ **30 To/mois**, `crawl.requests` ≈ **199 To/mois** ; table partitionnée et clusterisée ; requête ciblée ≈ **1 Go** pour un mois. |
| J24 | httparchive.org | lecture documentaire de `httparchive.org/faq` | Liste d'URL issue du **Chrome UX Report** ; « does not crawl the website's other pages » — crawl de pages d'entrée, pas d'inventaire. |
| J25 | brave.com / serpapi.com | lecture documentaire des pages de tarifs (2 requêtes) | Brave *Search* : **5 $/1 000 requêtes**, 5 $ de crédit gratuit mensuel, **carte bancaire requise même sur le plan gratuit**. SerpApi : **250 recherches/mois gratuites**, puis 25 $/1 000 à 3,75 $/1 000 selon le palier. |

---

## Verdict sur la profondeur historique

**C'est la section dimensionnante du lot. Réponse : oui, la série temporelle de prix est
reconstructible, sur environ 35 000 annonces, et elle est déjà prouvée sur un cas concret.**

### 1. Comptes de captures — pages d'offre uniquement

Motif d'URL de page de détail : `www.autoscout24.be/fr/offres/…` et `www.autoscout24.be/nl/aanbod/…`.
Les trois autres motifs testés (`/offres/`, `/aanbod/`, `/annonces/` sans préfixe de langue) sont
vides ou quasi vides — 8 captures au total, ligne J05.

| Grandeur | `/fr/offres/` | `/nl/aanbod/` | Total |
|---|---|---|---|
| Captures indexées au CDX | 291 366 | 328 989 | **620 355** |
| dont HTTP 200 | 250 351 | 278 918 | **529 269** |
| dont 308 / 301 (redirection) | 22 785 | 27 791 | 50 576 |
| dont `warc/revisit` (contenu identique, dédupliqué) | 14 463 | 18 102 | 32 565 |
| dont **410 Gone** (annonce retirée) | 3 597 | 4 007 | **7 604** |
| dont 404 | 139 | 143 | 282 |
| URL distinctes (query retirée) | 113 317 | 113 599 | 226 916 |
| URL distinctes portant au moins un HTTP 200 | 103 176 | 102 803 | 205 979 |

Le compte qui compte n'est pas l'URL mais **l'annonce** : une même annonce existe en `fr` et en `nl`,
et son UUID est stable dans les deux. Après jointure sur l'UUID :

- **131 287 annonces distinctes** ont au moins une capture HTTP 200 ;
- 100 546 apparaissent côté `fr`, 99 864 côté `nl`, **69 123 dans les deux langues** — le
  recoupement bilingue **augmente mécaniquement la densité temporelle** de ces 69 123 annonces,
  puisque les deux versions sont capturées à des dates différentes.

Ordre de grandeur de référence : `FINDING-allowed-surface.md` situe l'inventaire BE courant à
environ 115 000 annonces. Le stock historique Wayback (131 287 annonces) est donc du même ordre de
grandeur que l'inventaire vivant d'un instant donné — mais étalé sur neuf ans, donc il ne s'y
substitue pas.

### 2. Profondeur

- Capture d'offre la plus ancienne : **2017-11-16 13:17:16 UTC**.
- Capture la plus récente au moment de la sonde : **2026-09-06 13:14:41 UTC**.
- **Profondeur brute : 8 ans et 10 mois, soit 3 217 jours.**

Distribution annuelle des captures, `fr` + `nl` :

| Année | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 (9 mois) |
|---|---|---|---|---|---|---|---|---|---|---|
| Captures | 195 | 433 | 6 031 | 5 826 | 9 627 | 25 817 | 42 788 | 55 019 | 97 237 | **377 382** |

La croissance est de trois ordres de grandeur entre 2017 et 2026. **La profondeur exploitable
réelle n'est pas 2017 mais 2022** : les cinq premières années ne pèsent que 22 112 captures, soit
**3,6 %** du total. 96,4 % du corpus est postérieur à janvier 2022.

Détail mensuel 2026, captures HTTP 200 : 01 → 48 351, 02 → 60 680, 03 → 75 251, 04 → 47 150,
05 → **129**, 06 → 33 944, 07 → 20 196, 08 → 9 048, 09 → 87. Le trou de mai 2026 — 129 captures
contre environ 50 000 les mois voisins — et la décroissance de juin à septembre sont des
**discontinuités d'archivage non contractuelles** : la source est un tiers bénévole, pas un flux.
C'est le risque A12 principal du candidat.

### 3. Densité temporelle — mesurée par annonce, en jours distincts

Sur les 131 287 annonces à au moins une capture 200, jointure bilingue faite, en comptant les
**jours de capture distincts** — deux captures le même jour ne font pas deux points de série :

| Nombre de jours de capture distincts | Nombre d'annonces |
|---|---|
| 1, aucune série possible | 96 262, soit 73,3 % |
| **au moins 2** | **35 025**, soit 26,7 % |
| au moins 3 | 20 546 |
| au moins 5 | 12 953 |
| au moins 10 | 6 258 |
| au moins 20 | 2 514 |

Sur les 35 025 annonces à au moins deux points :

- **étendue** (premier au dernier jour capturé) : médiane **15 jours**, moyenne 44 jours,
  p90 **109 jours**, maximum **1 860 jours**, soit 5 ans ;
- **intervalle entre deux captures consécutives**, 203 337 intervalles mesurés : médiane
  **1 jour**, moyenne 8 jours, p90 8 jours. **62,1 % des intervalles sont d'au plus 1 jour**,
  89,0 % d'au plus 7 jours, 95,0 % d'au plus 31 jours.

La densité est donc **très fine mais très courte** : quand une annonce est suivie, elle l'est
presque quotidiennement, mais le suivi ne dure typiquement que deux semaines.

Filtres de qualité pour une série de prix utilisable :

| Critère | Annonces éligibles |
|---|---|
| au moins 3 jours distincts **et** étendue d'au moins 30 jours | **7 629** |
| au moins 5 jours distincts **et** étendue d'au moins 60 jours | **2 692** |

### 4. Intégrité de `__NEXT_DATA__`

| Époque du snapshot | `__NEXT_DATA__` | Parse JSON | Clés `listingDetails` | Feuilles scalaires | Champs du dictionnaire cible retrouvés |
|---|---|---|---|---|---|
| 2017-12-10 | absent | — | — | — | via `title` et `meta description` seulement |
| 2019-07-18 | absent | — | — | — | idem |
| 2021-11-27 et avant | absent | — | — | — | idem |
| **2022-01-18** | présent | **OK** | 29 | 262 | **34 / 40** |
| 2023-07-29 | présent | **OK** | 37 | 406 | **37 / 40** |
| 2026-01-04 | présent | **OK** | 43 | 547 | **37 / 40** |

Les trois blocs parsent sans erreur : **aucune troncature**. Wayback conserve le HTML entier,
`__NEXT_DATA__` compris. Champs cibles non retrouvés dans `listingDetails` : `colour`,
`emissionClass`, `sellerType`. Pour ce dernier, `seller.type = "Dealer"` et `seller.isDealer`
existent, la cible est donc en réalité couverte sous un autre nom ; les deux autres sont à
chercher ailleurs dans le payload et restent `[NON VÉRIFIÉ]`.

Deux champs du payload archivé changent la portée du candidat.

- **`listingDetails.createdTimestampWithOffset`** — relevé `2024-05-02T15:16:08.781Z` sur une
  capture du 2026-01-04. C'est la **date de publication de l'annonce**. Elle est donc lisible sur
  une capture *unique* : même les 96 262 annonces à un seul point donnent leur âge de mise en
  ligne. Ce champ n'apparaît qu'à l'époque récente : il est absent de la liste des clés de 2022 et
  de 2023.
- **`listingDetails.seller.contactName`** — relevé `Patrick Merckx`. Le corpus archivé porte donc
  les mêmes données personnelles que la source vivante : la règle RGPD R3 s'applique identiquement
  à l'ingestion depuis Wayback.

### 5. Preuve directe qu'une série de prix existe

Annonce `ff6d1319-85be-4e8e-bdf0-bb08d5570e6f`, Ford Escort Cabrio, 95 000 km, 02/1995 :

| Date de capture | Langue | Prix lu dans `meta name="description"` |
|---|---|---|
| 2019-07-18 | fr | **1 550 €** |
| 2021-01-25 | nl | **999 €** |

Même annonce, même kilométrage, **−35,5 % de prix affiché sur 18 mois**, sur deux captures d'un
corpus antérieur à Next.js. C'est la démonstration que la décote *observée*, et non modélisée, est
mesurable par cette voie. Cette même annonce compte plus de dix captures étalées de 2019-07 à
2021-01.

### 6. Le prix est lisible sur toute la profondeur, y compris avant Next.js

Point non anticipé par le mandat, et il déplace la conclusion : les pages antérieures à Next.js
n'ont pas de `__NEXT_DATA__` mais elles portent le prix, le kilométrage, la première
immatriculation, la carrosserie, le carburant, le modèle et la ville **dans le `title` et le
`meta name="description"`**, dans un format constant.

- 2017 : `Trouvez votre occasion Audi QUATTRO à Arlon: Break | € 58.900,- | 16.289 km | 09/2016 | Diesel`
- 2019 : `Trouvez votre occasion Ford Escort à Norderstedt: Cabriolet | € 1.550,- | 95.000 km | 02/1995 | Essence`
- 2021 : `Vind uw tweedehands Ford Escort in Norderstedt: Cabriolet | € 999,- | 95.000 km | 02/1995 | Benzine`
- 2026 : `Trouve ta Abarth 124 Spider voiture de démonstration à Alleur : Cabriolet | € 31 …`

Le seul bloc `application/ld+json` de ces pages est un `@type: Organization` — AutoScout24
lui-même — et **pas un `Vehicle`** : il n'y a rien à en tirer. Mais la balise `description` suffit
à environ 7 champs, sur la totalité des 3 217 jours, et se lit dans le premier kilo-octet du
document, donc à coût de transfert quasi nul si l'on utilise une requête `Range`.
**`[NON VÉRIFIÉ]` : le support de l'en-tête `Range` par `web.archive.org` n'a pas été testé.**

### 7. Signal de vitesse d'écoulement — sous-produit du code 410

7 604 captures répondent **410 Gone** : AutoScout24 sert un 410 explicite quand l'annonce est
retirée. Croisé avec les captures 200 :

- **2 388 annonces** ont à la fois une capture 200 et une capture 410 ou 404 ;
- **2 270** ont leur premier 410 postérieur à leur dernier 200 — cas exploitable ;
- **fenêtre d'incertitude** sur la date de retrait, dernier 200 au premier 410 : médiane
  **1 jour**, p90 20 jours ; 1 871 cas à 7 jours ou moins, 2 106 à 31 jours ou moins ;
- **durée observée sur le marché**, premier 200 au premier 410, borne inférieure : médiane
  **10 jours**, p90 **57 jours**.

Combiné à `createdTimestampWithOffset`, cela donne une **durée de vie d'annonce vraie**, à un jour
près pour la médiane des 2 270 cas. Aucune autre voie du registre ne produit cette grandeur.

### 8. Verdict chiffré

| Question | Réponse mesurée |
|---|---|
| Combien de captures de pages d'offre ? | **620 355**, dont **529 269** en HTTP 200 |
| Combien d'annonces distinctes ? | **131 287** avec au moins un HTTP 200 |
| Sur quelle profondeur ? | **2017-11-16 au 2026-09-06**, soit 3 217 jours ; mais **96,4 % du corpus est postérieur à 2022-01** |
| À quelle densité ? | intervalle médian entre captures d'une même annonce : **1 jour** ; 89 % des intervalles d'au plus 7 jours ; étendue médiane de suivi : **15 jours** |
| `__NEXT_DATA__` intact ? | **Oui**, parse OK sur 3 snapshots d'époques différentes, 34 à 37 champs cibles sur 40. Présent à partir de la migration Next.js, encadrée entre **2021-11-27 et 2022-01-18** |
| Série de prix reconstructible ? | **OUI.** **35 025 annonces** à au moins 2 points, **20 546** à au moins 3, **7 629** à au moins 3 points sur au moins 30 jours, **2 692** à au moins 5 points sur au moins 60 jours. Prouvé sur un cas réel : −35,5 % en 18 mois |
| Ce que ce n'est pas | **Pas un panel représentatif.** 131 287 annonces sur neuf ans face à environ 115 000 annonces vivantes à un instant t : le taux de couverture instantané est de l'ordre du pourcent. Le biais de sélection — qui archive, et quoi — est **non mesuré** et probablement fort : les trois annonces les plus capturées sont des Audi RS6, Audi RS3 et BMW 730, c'est-à-dire du haut de gamme, pas la médiane du marché belge |

**Conclusion opérationnelle** : Wayback ne donne pas un inventaire, il donne un **panel
longitudinal non représentatif d'environ 35 000 annonces**. C'est inutilisable pour le mode 1 de
KYCAR — les agrégats de marché — et sans équivalent pour un axe d'analyse qui ne figure pas encore
au cahier des charges : décote observée, durée de vie d'annonce, écart entre prix d'affichage
initial et prix de retrait. La valeur du candidat est **analytique, pas volumétrique**, à condition
de traiter le biais, ce qui exige un dénominateur externe — `LOT-Q`.

---

## Complément Wayback — les pages de recherche `/lst`, seconde découverte du lot

Le mandat ne les demandait pas. Elles pèsent plus lourd que les pages d'offre.

| Motif | Captures HTTP 200 | Jours de capture distincts | Fenêtre |
|---|---|---|---|
| `www.autoscout24.be/fr/lst*` | **806 449** | **1 959** | 2018-07-18 → 2026-09-02 |
| `www.autoscout24.be/nl/lst*` | **855 350** | **1 928** | 2019-02-02 → 2026-08-28 |
| Total | **1 661 799** | — | — |

Couverture en jours par année pour `/fr/lst` : 2019 → 151 j, 2020 → 239 j, 2021 → 266 j,
2022 → 281 j, 2023 → 260 j, 2024 → 258 j, **2025 → 331 j sur 365 (90,7 %)**, 2026 → 171 j
sur 245 écoulés.

Contenu vérifié d'une capture (`20260101185529`, `https://www.autoscout24.be/fr/lst`,
154 695 octets récupérés, ligne J13) : `__NEXT_DATA__` présent, parse **OK**, 211 346 octets de
JSON, et `props.pageProps` contient

- **`numberOfResults = 112 849`** — le **compteur d'inventaire BE total** à la date de la capture.
  Comparaison : `FINDING-allowed-surface.md` retient environ 115 000 annonces vivantes. La grandeur
  est la même, datée au jour ;
- **`numberOfPages = 200`** — le **plafond de pagination**, lu dans le payload lui-même et non
  déduit d'un test. Avec 19 à 20 annonces par page, cela **borne toute recherche à environ 4 000
  annonces**, quel que soit `numberOfResults`. C'est la réponse à la troisième question falsifiable
  du `LOT-C`, obtenue sans requêter AutoScout24 ;
- `pageQuery = {"ustate":"N,U","sort":"standard","atype":"C","cy":"B","pricetype":"public",…}` —
  périmètre **Belgique** confirmé, cohérent avec H1 et avec P4 du `FINDING` ;
- `listings` : **19 annonces**, **65 feuilles scalaires chacune**, avec `id` (UUID),
  `price`, `vehicle`, `vehicleDetails`, `wltpValues`, `condition`, `location` (jusqu'à la rue),
  `seller`, `ratings`, `adTier`, `statistics`.

**Conséquence** : Wayback offre, en plus du panel longitudinal d'annonces, une **série temporelle
quasi quotidienne de l'inventaire BE total** sur la période Next.js (2022-01 → 2026-09), à un taux
de couverture journalier de 70 à 91 % selon l'année. Aucune autre voie du registre, gratuite ou
payante, ne fournit cet historique — et c'est un indicateur de marché de premier ordre :
tension de l'offre, saisonnalité, choc de volume.

`[NON VÉRIFIÉ]` : les captures antérieures à 2022 n'ont pas de `__NEXT_DATA__` ; que le compteur de
résultats soit lisible dans le HTML rendu de cette époque n'a pas été testé. La série pré-2022
reste donc hypothétique.

**Réserve de conformité à porter en A11** : `Disallow: /lst?` figure dans le groupe `User-agent: *`
du `robots.txt` d'AutoScout24 depuis au moins 2023 (relevé sur les versions archivées de 2023-01,
2023-09, 2024-05, 2024-09, 2025-06 et 2025-12). Ces 1,66 million de captures ont donc été
constituées **en méconnaissance de cette directive** par l'archiveur, l'Internet Archive
n'appliquant plus `robots.txt` à ses collectes. Nous n'en sommes pas l'auteur, mais l'exploiter
n'est pas neutre — voir la section juridique.

---

## Common Crawl — la directive `CCBot` est bien plus récente que supposé, et elle mord

### 1. Datation de l'ajout du groupe des agents d'IA au `robots.txt`

Fait par lecture des versions **archivées** du `robots.txt`, jamais sur le site vivant.

| Version archivée lue | Taille | `CCBot` | `GPTBot` | `ClaudeBot` | Directives `Allow: /fr/…` |
|---|---|---|---|---|---|
| 2023-01-30 | 2 790 o | absent | absent | absent | absentes |
| 2023-09-15 | 2 856 o | absent | absent | absent | absentes |
| 2024-05-01 | 2 856 o | absent | absent | absent | absentes |
| 2024-09-15 | 1 745 o | absent | absent | absent | absentes |
| 2025-06-01 (fichier auto-daté `#LB, 13.02.2025`) | 1 614 o | absent | absent | absent | absentes |
| 2026-01-01 (fichier auto-daté `#MH, 16.12.2025`) | 1 918 o | **absent** | absent | absent | **absentes** |
| 2026-09-06 — relevé de `FINDING-allowed-surface.md`, non rejoué ici (E5) | 2 756 o | **présent** | présent | présent | **17 présentes** |

Le `robots.txt` d'AutoScout24 Belgique **ne comportait aucun groupe d'agents d'IA au 16 décembre
2025**. Le groupe `GPTBot / ClaudeBot / Google-Extended / Applebot-Extended / CCBot` avec son
`Disallow: /` et ses 17 `Allow:` a donc été ajouté **entre le 2025-12-16 et le 2026-09-06** — une
fenêtre de moins de neuf mois, refermée il y a moins d'un an.

La dernière capture de `robots.txt` présente au CDX est du **2026-01-31** : Wayback ne permet pas
de resserrer davantage la fenêtre, et E5 interdit de le demander à la source. `[NON VÉRIFIÉ]` : la
date exacte de l'ajout. Elle est demandée en `ACTIONS-COMMANDITAIRE`.

Deux conséquences dépassent le `LOT-J` :

1. **La contrainte E5 est un fait d'espèce très récent.** Toute étude, tout dépôt de code, tout
   dataset public constitué avant 2026 l'a été sous un `robots.txt` qui ne visait pas les agents
   d'IA. Les candidats du registre qui s'appuient sur des collectes antérieures ne sont pas dans la
   même situation juridique que nous aujourd'hui.
2. **Les 17 préfixes `Allow:`** relevés par `FINDING-allowed-surface.md` sont eux aussi nouveaux :
   ils n'existaient pas en décembre 2025. Ce n'est pas une surface historique, c'est une **surface
   concédée**, donc révocable au même rythme qu'elle a été ouverte.

### 2. Couverture mesurée sur quatre crawls

Requête : `https://index.commoncrawl.org/<crawl>-index?url=autoscout24.be%2F*&output=json&limit=100000`.

| Crawl | Fenêtre de crawl | Enregistrements | HTTP 200 | Pages d'offre 200 | Pages `/lst` 200 | HTTP 410 |
|---|---|---|---|---|---|---|
| `CC-MAIN-2020-34` | 2020-08-03 → 08-15 | 615 | 510 | **57** | 326 | 50 |
| `CC-MAIN-2023-50` | 2023-11-28 → 12-11 | 3 647 | 2 553 | **760** | 1 095 | 243 |
| `CC-MAIN-2025-26` | 2025-06-12 → 06-25 | 3 792 | 2 749 | **978** | 964 | 506 |
| `CC-MAIN-2026-34` | 2026-08-07 → 08-19 | 1 179 | 1 152 | **0** | **0** | 0 |

`CC-MAIN-2020-34` : une ligne du flux JSON est tronquée côté réponse ; le compte de 615 est donc
une **borne inférieure**. Les trois autres crawls sont complets (0 ligne illisible).

### 3. La preuve nette : le crawl d'août 2026 est exactement la surface autorisée

Répartition des chemins des 1 152 pages en HTTP 200 de `CC-MAIN-2026-34` :

`fr/voiture` 361 · `nl/auto` 334 · `fr/informer` 227 · `nl/informeren` 191 · `robots.txt` 27 ·
`nl/consulent-elektrische-auto` 7 · `fr/conseiller-en-voitures` 3 · `fr/credit-auto` 1 ·
`nl/financiering` 1.

**Ces neuf chemins sont, à l'un près, les 17 préfixes `Allow:` du `robots.txt` actuel.** Aucune
page d'offre, aucune page `/lst`, rien hors de la liste blanche. CCBot a donc appliqué la nouvelle
directive **à la lettre, dès le premier crawl postérieur**, et le résultat est un miroir public de
la surface autorisée. C'est une confirmation indépendante et externe de la lecture faite par
`FINDING-allowed-surface.md` — la seule que nous ayons obtenue sans requêter AutoScout24.

À l'inverse, les crawls antérieurs sont exploitables et non contraints : 978 pages d'offre en juin
2025, 760 en décembre 2023, 57 en août 2020, avec en plus 964 et 1 095 pages `/lst` — soit, à 19-20
annonces par page, de l'ordre de **19 000 et 21 000 lignes d'annonces** pour ces deux seuls crawls.
Et 506 codes 410 dans le crawl de juin 2025 datent autant de retraits d'annonces.

### 4. Ce que la mesure vaut par crawl

Environ 1 000 pages d'offre et 1 000 pages `/lst` par crawl bimensuel, sur 127 collections
disponibles dont une centaine dans l'ère `/fr/offres/`. L'ordre de grandeur du corpus total
mobilisable — à **confirmer** crawl par crawl, non extrapolé ici comme un fait — serait de
quelques dizaines de milliers de pages d'offre et un volume comparable de pages de recherche.
C'est un ordre de grandeur **inférieur d'un facteur ~10 à Wayback** pour les pages d'offre, et
d'un facteur ~30 pour les pages de recherche. Common Crawl n'ajoute donc pas de volume : il ajoute
une **collecte robots-conforme, documentée, citable et rejouable**, ce que Wayback n'est pas.

---

## urlscan.io — le corpus attendu n'existe pas

Le candidat `C-71` reposait sur l'hypothèse « AS24 étant un domaine massivement scanné, il existe
très probablement un stock d'instantanés de pages d'annonces ». **L'hypothèse est fausse.**

| Requête (API de recherche anonyme, sans clé) | HTTP | `total` |
|---|---|---|
| `page.domain:autoscout24.be` | 200 | **0** |
| `page.domain:www.autoscout24.be` | 200 | **0** |
| `page.domain:autoscout24.be AND page.status:200` | 200 | **0** |
| `page.domain:autoscout24.de` | 200 | **0** |
| `domain:autoscout24.be` | 200 | 44 |
| `domain:www.autoscout24.be` | 200 | 11 |
| `task.domain:autoscout24.be` | 200 | 4 |
| `domain:autoscout24.com` | 200 | 461 |
| **contrôle** `page.domain:github.com` | 200 | 10 000 |

Le contrôle sur `github.com` prouve que l'API répond et que le champ `page.domain` fonctionne :
**zéro n'est un zéro mesuré, pas un échec de requête.**

Ce que sont réellement les 44 correspondances de `domain:autoscout24.be` — `domain` matche tout
domaine *contacté* par la page scannée, pas la page elle-même :

- **des sites de garages belges** qui pointent vers AS24 ou en embarquent un widget :
  `gibosch.com`, `piletteleuze.be`, `dreuw.be`, `dmcars-nieuwrode.com`, `rammotors.be`,
  `alili-automobile.be`, `dynamiccars.be`, `abcars.be`, `class-cars.be`, `autocentermertens.be`,
  `bcccars.be`, `garage-pulinx.be`… — c'est-à-dire, incidemment, une **confirmation externe de la
  piste du `LOT-M`** : ces garages ont bien un site propre et un stock en ligne ;
- **des domaines d'hameçonnage typosquattés** : `accounts-autoscout24.de`,
  `myarea-autoscout24.de`, `www.inserat-autoscout24.de`, tous servant
  `/login/twofactorauthentication.html`, et un WordPress compromis
  (`myblog-1ynq4udyuj.live-website.com/wp-includes/pomo/en/in.php`) pour les 4 hits de
  `task.domain`. **Aucun de ces 44 scans n'est un scan d'AutoScout24.**

Aucune page `www.autoscout24.be` n'a jamais fait l'objet d'un scan public conservé par urlscan.
Le corpus visé par `C-71` est vide.

### L'accès au DOM est fermé aux anonymes

```
GET https://urlscan.io/dom/019cfbe5-a1be-7452-88df-340ddb234b0a/
→ HTTP 403, 40 octets : {"warning": "You're not logged in!"}
```

L'endpoint `/dom/<uuid>/` — le seul intérêt propre du candidat, le DOM post-JS — **exige un
compte**. R2 et E1 interdisent d'en créer un. Même si le corpus existait, il serait inaccessible
dans notre cadre.

`C-71` échoue donc sur **deux causes indépendantes et cumulatives** : pas de corpus, pas d'accès.
La seule façon de faire naître le corpus serait de soumettre nous-mêmes les URL — ce qui est
précisément la question juridique ci-dessous, et c'est elle qui achève le candidat.

**Hypothèse explicative, `[NON VÉRIFIÉ]`** : `page.domain:autoscout24.de` renvoie aussi 0, alors
que 461 pages tierces contactent `autoscout24.com`. Aucun domaine national d'AutoScout24 n'a de
scan public. Il est plausible qu'Akamai réponde au scanner d'urlscan par un challenge, et que les
scans échoués ne soient pas indexés — ce qui rejoindrait l'axe A8. Non testé, et intestable sans
soumission.

---

## HTTP Archive — documentaire, aucune requête facturable lancée

### Impossibilité matérielle de lancer une requête, et donc de la facturer

```
command -v bq    → (rien)
command -v gcloud → (rien)
bq version       → bash: bq: command not found
```

Ni `bq` ni `gcloud` ne sont installés sur la machine d'exécution, et aucune clé de service n'est
disponible. **Aucune requête BigQuery — facturable ou en `--dry_run` — n'a pu être émise, et
aucune ne l'a été.** L'exigence du mandat (« estimer le coût par `--dry_run` avant toute requête
facturée ») est satisfaite par défaut : il n'y a eu aucune requête. Le `--dry_run` réel passe en
`ACTIONS-COMMANDITAIRE`.

### Chiffrage documenté du coût

| Élément | Valeur | Source |
|---|---|---|
| Palier gratuit BigQuery | **1 To de données traitées par mois** + 10 Go de stockage ; crédit de 300 $ pour un compte neuf | `har.fyi/guides/getting-started/` |
| Compte Google requis | **oui** ; facturation activée **optionnelle** | idem |
| Taille de `crawl.pages` | **≈ 30 To par mois de crawl** (octobre 2024) | idem |
| Taille de `crawl.requests` | **≈ 199 To par mois de crawl** (octobre 2024) | idem |
| Coût d'un `SELECT *` naïf sur un mois de `crawl.pages` | 30 To, soit **29 To hors palier** ; au tarif public BigQuery on-demand de 6,25 $/To, environ **181 $ pour une seule requête** | calcul sur les deux lignes précédentes |
| Table partitionnée et clusterisée | **oui** (`date`, `client`, `is_root_page`, `rank`, `page`) | `har.fyi/reference/tables/pages/` |
| Coût d'une requête ciblée sur les colonnes de clustering | **≈ 1 Go** pour un mois complet | idem |

**La quatrième question falsifiable du mandat se tranche donc en deux temps.** Une requête
ciblée — filtrer `date`, `client`, `page LIKE '%autoscout24.be%'` en ne sélectionnant que les
colonnes de clustering — tient largement dans le palier gratuit : **environ 1 Go, soit 0,1 % du
palier**. Une requête qui touche la colonne `payload` (JSON des résultats WebPageTest) ou, pire,
la table `crawl.requests` et ses corps de réponse, **ne tient pas** : 30 To et 199 To par mois de
crawl. Le risque de coût est réel mais **entièrement gouverné par la rédaction de la requête**, et
un `--dry_run` le mesure avant exécution.

### Ce que la table contient, et pourquoi cela clôt le candidat pour l'inventaire

La FAQ officielle est explicite sur le périmètre : « The HTTP Archive examines each URL in the
list, but does not crawl the website's other pages ». La liste d'URL est **issue du Chrome UX
Report**. Le crawl est donc, par construction, un crawl de **pages d'entrée**, pas d'inventaire.

Nuance à porter au dossier : le schéma de `crawl.pages` comporte une colonne `is_root_page`
(booléen, « whether page is origin root »), ce qui n'aurait aucun sens si seules les racines
étaient crawlées. La FAQ est donc probablement en retard sur le pipeline. **`[NON VÉRIFIÉ]`** :
combien d'URL `autoscout24.be` figurent par crawl mensuel, et si l'une d'elles est une page
d'offre. C'est exactement ce que le `--dry_run` puis la requête ciblée établiraient pour environ
1 Go — donc gratuitement.

En l'état, `C-72` reste ce que la fiche de `candidates-v2.md` anticipait : un instrument pour
l'**axe A7** — dater les changements de structure du front, l'évolution du `buildId`, l'apparition
et la disparition des blocs — et non une source d'annonces. Et sur cet axe précis, Wayback l'a déjà
fait mieux et gratuitement dans ce même rapport : la migration Next.js est datée à cinq semaines
près (ligne J08) et trois générations de `listingDetails` sont comptées (ligne J09), sans compte
Google et sans BigQuery.

---

## C-55 — index des moteurs via API : bloqué par R2, chiffré en documentaire

Aucune requête n'a été émise vers Brave, SerpApi ou Bing : les trois exigent une clé d'API, donc
un compte.

| Fournisseur | Palier gratuit | Carte bancaire pour le palier gratuit | Prix par 1 000 requêtes | Source |
|---|---|---|---|---|
| **Brave Search API** — plan *Search* | **5 $ de crédit par mois**, soit **1 000 requêtes/mois** à 5 $/1 000 ; 50 req/s | **Oui, requise** (mesure anti-fraude, non débitée sur le plan gratuit) | **5,00 $** | `brave.com/search/api/` |
| Brave — plan *Answers* | 5 $/mois de crédit ; 2 req/s | Oui | 4,00 $ + 5 $/M de tokens | idem |
| **SerpApi** — plan gratuit | **250 recherches/mois** | non précisé par la page de tarifs | — | `serpapi.com/pricing` |
| SerpApi — Starter | 1 000 recherches | — | **25,00 $** | idem |
| SerpApi — Developer | 5 000 recherches | — | **15,00 $** | idem |
| SerpApi — Production | 15 000 recherches | — | **10,00 $** | idem |
| SerpApi — Cloud 1M | 1 000 000 recherches | — | **3,75 $** | idem |

**Conversion R5.** Une requête de moteur rend au mieux une page de résultats — de l'ordre de 20
URL chez Brave, jusqu'à 100 chez SerpApi via le paramètre `num`. En retenant ces plafonds
nominaux :

| Fournisseur | € / 1 000 **URL découvertes** | € / mois pour un rafraîchissement quotidien du périmètre BE (~113 000 annonces) |
|---|---|---|
| Brave *Search* | 5 $ / 1 000 requêtes ÷ 20 URL = **0,25 $/1 000 URL** ≈ 0,23 € | 113 000 ÷ 20 = 5 650 requêtes/jour × 30 = 169 500 req/mois × 5 $/1 000 = **848 $/mois** ≈ 780 € |
| SerpApi *Cloud 1M* | 3,75 $ / 1 000 ÷ 100 URL = **0,0375 $/1 000 URL** ≈ 0,035 € | 113 000 ÷ 100 = 1 130 req/jour × 30 = 33 900 req/mois ; plan Big Data 275 $ → **275 $/mois** ≈ 253 € |

Ces chiffres sont un **plancher théorique** et non une prévision, pour trois raisons qui pèsent
plus que le prix.

1. **Un index de moteur n'est pas énumérable.** `site:autoscout24.be/fr/offres/` ne rend pas
   113 000 résultats : les moteurs plafonnent la pagination d'une requête à quelques centaines de
   résultats. Atteindre l'inventaire supposerait de partitionner la requête (par marque, modèle,
   ville, tranche de prix) jusqu'à ce que chaque partition tienne sous le plafond — un travail dont
   le coût réel est un multiple du calcul ci-dessus. **`[NON VÉRIFIÉ]`, et c'est le point
   dimensionnant du candidat.**
2. **Les *snippets* ne portent pas les 40 champs.** Ils portent le `<title>` et la
   `<meta description>`, dont ce rapport a prouvé le contenu exact (section 6 du verdict) :
   modèle, ville, carrosserie, prix, kilométrage, première immatriculation, carburant. **7 champs
   sur 40.** La deuxième question falsifiable de `C-55` est donc **tranchée : fausse pour les 40
   champs, vraie pour 7.** Une distribution prix × année × km est en revanche exactement ce que ces
   7 champs permettent — la question était mal posée dans la fiche v1.
3. **Rien ne garantit la fraîcheur ni l'exhaustivité de l'index.** Il n'y a aucun engagement de
   couverture, et l'ajout du groupe d'agents d'IA au `robots.txt` ne concerne pas Googlebot ni
   Bingbot, donc l'indexation des pages d'offre perdure — mais elle demeure un fait subi.

Le rendement de ce candidat n'est pas le prix, c'est la **découverte d'URL** : il fournit une liste
d'identifiants d'annonces vivantes que ni Wayback ni Common Crawl ne peuvent donner, et qu'aucun
sitemap n'offre puisqu'il n'y a pas de directive `Sitemap:` (`FINDING`, P6).
