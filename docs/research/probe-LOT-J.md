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

---

## Question juridique de la soumission à un tiers

> « Soumettre soi-même une URL AutoScout24 à urlscan constituerait-il un contournement du
> `robots.txt` par tiers interposé ? »

Question non technique, à trancher sur l'axe A11. **Aucune soumission n'a été exécutée**, ni à
urlscan, ni au *Save Page Now* de l'Internet Archive, ni à aucun autre service de capture — la
question devait être tranchée d'abord. Elle l'est ci-dessous.

Elle n'est pas académique dans ce lot : `C-71` n'a **aucun** scan public d'AutoScout24 (section
urlscan). La soumission n'est donc pas une commodité, c'est **le seul chemin** par lequel le
candidat pourrait exister. La réponse à cette question est donc son verdict.

### Thèse — oui, c'est un contournement

1. **L'article 4(3) de la directive (UE) 2019/790 s'adresse à l'acteur, pas au robot.** Le groupe
   `GPTBot / ClaudeBot / Google-Extended / Applebot-Extended / CCBot` suivi de `Disallow: /` et de
   17 `Allow:` est une **réservation de droits lisible par machine** au sens de l'article 4(3),
   c'est-à-dire un *opt-out* à l'exception de fouille de textes et de données. Cette réservation
   n'est pas opposable à un *user-agent*, elle est opposable à **l'usage** : la fouille. Le
   bénéficiaire de la fouille, ici, ce serait nous. Changer de route de récupération ne change pas
   qui fouille. C'est l'argument le plus fort, et il ne dépend pas de la valeur normative du
   `robots.txt`.
2. **Nous serions la cause *but-for* de la requête.** Sans notre soumission, aucune requête n'est
   émise vers l'URL en cause. Le scanner d'urlscan n'agirait pas de son propre chef sur une page
   d'offre belge — la preuve empirique en est qu'il ne l'a jamais fait en 800 millions de scans.
   L'interposition d'un tiers ne crée pas d'auteur intermédiaire : elle crée un instrument.
3. **Le raisonnement de la CJEU dans `Innoweb` (C-202/12) regarde l'effet économique, pas la
   route.** Un métamoteur qui interroge la base d'autrui « en temps réel » a été jugé la
   *réutiliser*, bien qu'il n'en stockât rien. Le juge a suivi le résultat — mettre à disposition
   le contenu de la base d'autrui — et non le trajet technique. Un scanner tiers piloté par nous
   est, dans cette logique, notre outil.
4. **Le droit *sui generis* du producteur de base de données** (directive 96/9/CE, art. 7, transposé
   au livre XI du Code de droit économique belge) couvre l'« extraction » **et** la
   « réutilisation » d'une partie substantielle. L'extraction est attribuée à celui qui l'organise.
   Le fait que le transfert matériel soit accompli par un tiers non averti ne déplace pas
   l'imputation.
5. **Un test d'intention élémentaire suffit à disqualifier la manœuvre** : nous chercherions le
   tiers *parce que* la voie directe nous est fermée. C'est la définition d'un contournement.
   L'abus de droit, en droit belge des obligations, sanctionne précisément l'usage d'une faculté
   dans un but étranger à sa destination.

### Antithèse — non, ce n'en est pas un

1. **`robots.txt` n'est pas une norme juridique.** La RFC 9309 se qualifie elle-même de protocole
   d'exclusion *volontaire*. Elle n'attache d'obligation qu'au comportement du client qu'elle
   nomme dans le champ `User-agent`. Le scanner d'urlscan est un agent distinct, avec son propre
   *user-agent* et sa propre politique ; qu'il honore ou non le `robots.txt` d'une cible est **sa**
   décision de conformité, pas la nôtre. Nous, nous n'émettons aucune requête vers AutoScout24.
2. **Une soumission unitaire n'est pas un crawl.** Le protocole régit l'exploration automatisée.
   Une soumission déclenche **une** récupération d'**une** URL, ce que le service documente comme
   l'équivalent d'une visite de navigateur. Or une visite humaine de page d'offre est manifestement
   permise : la page est publique, servie sans authentification, et AutoScout24 la monétise. Sous
   R3, notre volumétrie serait de l'ordre de quelques unités.
3. **Aucune mesure technique de protection n'est franchie.** Pas de mot de passe, pas de péage, pas
   de défi Akamai résolu, pas de cookie `_abck` forgé. Le `robots.txt` est **déclaratoire, non
   protecteur** : il n'est donc pas une MTP au sens de l'article 6 de la directive 2001/29, et
   l'article 550bis du Code pénal belge — accès non autorisé à un système informatique — suppose le
   franchissement d'un obstacle d'accès, absent ici.
4. **L'exception de l'article 3 de la directive 2019/790** — fouille aux fins de recherche
   scientifique par un organisme de recherche — n'est pas invocable par KYCAR, mais elle rappelle
   que la réservation de l'article 4(3) ne rend pas l'acte *illicite en soi* : elle le fait
   simplement sortir de l'exception, ce qui ne mord que si l'usage constitue par ailleurs une
   reproduction protégée. Un prix, un kilométrage et une date d'immatriculation sont des
   **données factuelles non protégeables** prises isolément.
5. **Le service tiers assume publiquement sa politique.** Si urlscan choisit d'ignorer un
   `robots.txt`, ce choix l'engage. Nous ne pouvons pas être tenus responsables de la politique de
   conformité d'un opérateur indépendant sur la seule base d'une soumission d'URL.

### Ce qui départage, et la conclusion

Les deux thèses ne portent pas sur le même objet, et c'est ce qui permet de trancher. L'antithèse
est solide **sur le terrain du `robots.txt` lui-même** : non, le `robots.txt` d'AutoScout24 ne nous
oblige pas *nous*, il oblige des *user-agents*, et nous n'en pilotons aucun. La thèse est solide
**sur un autre terrain** : celui de la réservation de fouille de l'article 4(3), qui est adressée à
l'exploitant de la fouille et non au robot, et qui survit intégralement à un changement de route.

**La ligne de partage n'est donc pas « qui émet la requête » mais « lire une archive qui existe »
contre « provoquer la naissance d'une archive ».**

- **Lire une archive préexistante** (`C-53`, `C-54`, `C-72`) : nous n'émettons aucune requête vers
  AutoScout24 et nous n'en causons aucune. La constitution de l'archive est le fait propre de
  l'archiveur et relève de sa conformité. Notre exposition résiduelle est **en aval** — droit *sui
  generis* sur la réutilisation d'une partie substantielle, et RGPD sur `seller.contactName` — et
  elle n'a rien à voir avec le `robots.txt`.
- **Soumettre nous-mêmes une URL** : nous devenons la cause unique et le bénéficiaire unique d'une
  récupération portant sur une ressource que la réservation de l'article 4(3) nous ferme, dans un
  but de fouille. La route est différente, l'acte réservé est le même.

**Conclusion : oui.** Soumettre soi-même une URL AutoScout24 à urlscan — ou au *Save Page Now* de
l'Internet Archive, ou à tout service équivalent — **constitue un contournement de la réservation
portée par le `robots.txt`, par tiers interposé.** Pas parce que le `robots.txt` serait
juridiquement contraignant en lui-même : il ne l'est pas. Mais parce que le groupe d'agents d'IA
ajouté entre décembre 2025 et septembre 2026 est une **réservation de fouille opposable à l'acteur
de la fouille**, et que la route de récupération est indifférente à cette opposabilité.

**Notation A11 qui en découle, et qui est reprise dans les tableaux de candidats :**

| Acte | A11 | Mécanisme juridique nommé |
|---|---|---|
| Lire l'index CDX ou l'index Common Crawl | **1 / 5** | aucun acte réservé : métadonnées d'URL, aucun contenu |
| Lire des snapshots existants et en extraire des faits (prix, km, date) | **3 / 5** | droit *sui generis*, art. 7 dir. 96/9 et livre XI CDE : réutilisation d'une partie substantielle d'une base ; RGPD sur `seller.contactName` |
| Lire des snapshots de `/lst`, chemin en `Disallow` pour `*` depuis au moins 2023 | **3 / 5** | même mécanisme ; la méconnaissance de la directive est le fait de l'archiveur, pas le nôtre, et il n'existe pas en matière civile de règle du « fruit de l'arbre empoisonné » |
| **Soumettre une URL à un scanner tiers** | **4 / 5** | contournement de la réservation art. 4(3) dir. 2019/790 par tiers interposé ; imputation de l'extraction à l'organisateur |
| Crawler nous-mêmes hors des 17 préfixes autorisés | **5 / 5** | violation directe de la réservation, plus les CGU |

**Règle opérationnelle à porter au rapport final** : dans tout le `LOT-J`, l'interdiction n'est pas
seulement de requêter `autoscout24.be` — c'est de **provoquer** une requête vers `autoscout24.be`,
par quelque intermédiaire que ce soit. Le *Save Page Now* de Wayback tombe sous cette règle
exactement comme urlscan, et cela retire au candidat `C-53` toute possibilité de **densifier** la
série de prix : nous ne pouvons que lire ce que l'archive contient déjà.

---

## Candidats

Notation : `prouvé` = sortie de commande dans le journal ci-dessus ; `documenté` = source citée ;
`estimé` = calcul explicite ; `[NON VÉRIFIÉ]` = non établi.

### C-53 — Wayback Machine : index CDX + snapshots — **VIABLE**

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **0 €**. Aucun compte, aucune clé, aucune inscription. 37 requêtes émises sans authentification. | prouvé (J01–J15) |
| **A2** Coût récurrent | **0 € / 1 000 annonces** et **0 € / mois**. Le seul coût est le temps machine et la bande passante entrante : les captures d'offre pèsent 51 à 155 Ko chacune, soit ≈ **53 Go** pour les 529 269 captures en HTTP 200. | prouvé (tailles mesurées) |
| **A3** Couverture champs | **37 / 40** sur les pages d'offre de l'ère Next.js (2022-01 →), avec 262 à 547 feuilles scalaires dans `listingDetails`. **7 / 40** sur l'ère antérieure via `<title>` + `<meta description>`. Pages `/lst` : **65 feuilles par annonce**, 19 annonces par page. Non retrouvés : `colour`, `emissionClass` ; `sellerType` couvert par `seller.type`. | prouvé (J09, J15) |
| **A4** Couverture géo | **Belgique**, prouvé par `pageQuery.cy = "B"` et `location.countryCode = "BE"`. Les autres domaines nationaux d'AutoScout24 sont adressables par la même mécanique — non mesuré ici. | prouvé pour BE ; `[NON VÉRIFIÉ]` pour les autres pays |
| **A5** Latence | CDX : **0,58 s** pour un `showNumPages`, **1,71 s** p50 pour une page d'index, 12,3 s pour 291 366 lignes (54,9 Mo). Snapshots : p50 ≈ **1,9 s** (mesures : 1,31 / 1,37 / 2,39 / 4,99 s sur 4 fetches, plus 12 autres du même ordre). **Durée d'un « snapshot BE » complet** : les 529 269 captures d'offre à 1,9 s ≈ **279 h en séquentiel**, ≈ 70 h à 4 requêtes parallèles. Le sous-ensemble utile (les ~238 000 captures des 35 025 annonces à série) ≈ **126 h**, ≈ 31 h à 4 parallèles. La série d'inventaire quotidien (1 959 captures de `/fr/lst`) ≈ **1 h**. | prouvé (temps `curl`) puis estimé par extrapolation explicite |
| **A6** Débit / quota | **37 requêtes émises sur `web.archive.org`, dont 22 récupérations de snapshot, sans un seul 429 ni blocage.** Aucun plafond dur documenté publiquement pour l'API CDX. L'Internet Archive pratique un *throttling* dont le seuil n'est pas publié. | prouvé pour 37 req ; **`[NON VÉRIFIÉ]`** pour le seuil |
| **A7** Stabilité technique | **4 / 5**. L'archive est immuable par nature : un snapshot déjà pris ne change plus, donc un parseur qui fonctionne aujourd'hui fonctionnera demain sur les mêmes données. Le coût de maintenance est reporté sur la **diversité des formats** : trois générations de `listingDetails` (29 / 37 / 43 clés) plus l'ère pré-Next.js exigent **quatre** parseurs, pas un. | argumenté sur J09 |
| **A8** Résistance anti-bot | **Non concerné.** Akamai n'est jamais rencontré : aucune requête vers AutoScout24. Le seul obstacle possible est le *throttling* de l'Internet Archive. | prouvé |
| **A9** Effort d'intégration | **6 à 9 jours-homme** pour un adaptateur `DataProvider` : 1 j pour l'énumération CDX, 1 j pour le téléchargement à débit contrôlé et la reprise, **3 à 4 j pour les quatre parseurs** et leur réconciliation en un schéma unique, 1 j pour la jointure bilingue par UUID, 1 à 2 j pour le rattachement `410` / `createdTimestampWithOffset`. | estimé |
| **A10** Coût de maintenance | **0,25 à 0,5 j-h / mois**. L'archive ne casse pas ; seule l'ère courante peut introduire une génération de payload supplémentaire, au rythme constaté d'environ une par 18 mois. | argumenté |
| **A11** Exposition juridique | **3 / 5**. Voir la section juridique. Mécanismes nommés : droit *sui generis* du producteur de base de données (art. 7 dir. 96/9/CE, livre XI CDE) pour la réutilisation d'une partie substantielle ; RGPD sur `seller.contactName`, présent dans le corpus archivé et donc à écarter **à l'ingestion**. Aucune exposition sur l'axe `robots.txt` tant que l'on se borne à lire l'existant. **Le *Save Page Now* est interdit** par la conclusion de la section juridique. | argumenté |
| **A12** Autonomie | **Partiel.** Dépendance à un tiers unique, une organisation à but non lucratif, qui peut ralentir, restreindre ou retirer des contenus sur demande. Le trou d'archivage de mai 2026 (129 captures contre ~50 000 les mois voisins) et la décroissance de juin à septembre 2026 sont la démonstration mesurée de cette dépendance. Mitigation : la donnée est **rapatriable en une fois** — une fois 53 Go copiés, plus aucune dépendance. | prouvé (distribution mensuelle) |
| **A13** Plafond de volumétrie | **131 287 annonces distinctes historiques** (borne dure, le corpus est fini) ; **35 025** exploitables en série ; **1 661 799** captures de pages de recherche portant 19-20 annonces chacune. Par jour, le plafond est celui du *throttling*, non du corpus. Ne se rafraîchit pas : c'est un stock, pas un flux. | prouvé |
| **A14** Fraîcheur atteignable | **Délai de 1 à 2 jours pour les pages `/lst`** — capture du 2026-09-02 disponible, sonde du 2026-09-07 — et **1 jour pour les pages d'offre** (capture la plus récente : 2026-09-06 13:14 UTC). Mais la fraîcheur est **subie** : elle dépend de la cadence d'un tiers, et nous ne pouvons pas la provoquer sans violer la conclusion juridique. Compatible avec H4 (« snapshot périodique acceptable ») **si** la cadence de l'archiveur se maintient — ce que rien ne garantit. | prouvé pour le délai, argumenté pour la fiabilité |

**Verdict : `VIABLE`** — mais pas pour ce que le registre attendait. Viable comme **source
d'historique** : panel longitudinal de 35 025 annonces, série quasi quotidienne de l'inventaire BE
total sur 1 959 jours, et durée de vie d'annonce sur 2 270 cas. **Non viable comme source
d'inventaire courant** : le stock est un stock, il ne se rafraîchit qu'au bon vouloir d'un tiers, et
son biais de sélection est fort et non mesuré.

**Inconnues restantes** : seuil de *throttling* de l'Internet Archive ; support de l'en-tête
`Range` (qui diviserait par ~100 le coût de lecture des pages pré-2022) ; représentativité du panel
face au parc belge réel — mesurable par croisement avec `LOT-Q` ; lisibilité du compteur
d'inventaire dans les captures `/lst` antérieures à 2022.

### C-54 — Common Crawl : index + WARC — **VIABLE SOUS CONDITION**

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **0 €** via `index.commoncrawl.org` (13 requêtes, aucune authentification). L'index columnaire sur S3 et l'accès Athena supposent un compte AWS → hors R2. | prouvé pour l'index HTTP |
| **A2** Coût récurrent | **0 € / 1 000 annonces**, **0 € / mois** par l'index HTTP et les récupérations WARC par `Range` sur `data.commoncrawl.org`. Par Athena, le coût AWS serait à chiffrer — hors périmètre R2. | documenté |
| **A3** Couverture champs | **37 / 40 attendus**, par identité de payload avec `C-53` : ce sont les mêmes pages d'offre du même site aux mêmes époques. **Non rejoué sur un WARC dans cette sonde** — le plafond de 70 requêtes a été consacré à la question dimensionnante de la profondeur historique. | **`[NON VÉRIFIÉ]`**, documenté par identité de source |
| **A4** Couverture géo | Belgique prouvée (`autoscout24.be` présent dans 4 crawls sur 4). Les autres domaines nationaux relèvent de la même mécanique. | prouvé pour BE |
| **A5** Latence | **p50 ≈ 4,2 s** par requête d'index (mesures : 0,77 / 0,87 / 3,07 / 3,34 / 4,23 / 5,50 / 6,30 s). Durée d'un balayage complet des ~100 crawls de l'ère `/fr/offres/` : ≈ **7 min** pour l'index seul ; la récupération de ~100 000 pages WARC est du même ordre que `C-53` rapporté au volume, soit ≈ **50 h en séquentiel**. | prouvé puis estimé |
| **A6** Débit / quota | 13 requêtes émises, **1 échec transitoire HTTP 502 nginx** (J19), rejoué avec succès. Aucun quota dur publié ; le service demande de la modération. Taux d'échec observé : **1 / 13 = 7,7 %** — un client doit donc réessayer. | prouvé |
| **A7** Stabilité technique | **5 / 5**. Les crawls publiés sont figés et versionnés (`CC-MAIN-AAAA-SS`), l'index est rejouable à l'identique, et le corpus est citable dans un rapport. C'est le seul candidat du lot dont une mesure est **reproductible par un tiers à l'octet près**. | argumenté |
| **A8** Résistance anti-bot | **Non concerné.** Aucune requête vers AutoScout24. | prouvé |
| **A9** Effort d'intégration | **4 à 6 j-h**, dont 2 à 3 j de parseurs **réutilisables tels quels depuis `C-53`** : mêmes payloads, même schéma cible. En pratique, un adaptateur `C-53` déjà écrit se branche sur Common Crawl pour ≈ **1,5 j** de plus. | estimé |
| **A10** Coût de maintenance | **0,1 j-h / mois**. Un nouveau crawl paraît tous les deux mois ; l'intégration est un ajout de collection à une liste. | argumenté |
| **A11** Exposition juridique | **2 / 5** — **le plus faible du lot pour une source de contenu**, et c'est son principal mérite. Common Crawl **respecte le `robots.txt`**, ce que ce rapport prouve directement : le crawl d'août 2026 ne contient plus que les 17 préfixes `Allow:`. Les crawls antérieurs à l'ajout du groupe d'agents d'IA (2025-12-16 au plus tôt) ont donc été **collectés en conformité avec le `robots.txt` de leur époque**, et cette conformité est publiquement vérifiable. Reste le droit *sui generis* en aval et le RGPD, comme pour `C-53`. | prouvé (J18) puis argumenté |
| **A12** Autonomie | **Partiel**, avec la même mitigation que `C-53` : le corpus est rapatriable. Dépendance à une fondation à but non lucratif, mais les crawls passés restent publiés et les copies miroir S3 existent. |  documenté |
| **A13** Plafond de volumétrie | **0 page d'offre** pour tout crawl postérieur à la directive. **978** (juin 2025), **760** (déc. 2023), **≥ 57** (août 2020) pour les crawls antérieurs, plus 964 et 1 095 pages `/lst` — soit ≈ 19 000 et 21 000 lignes d'annonces sur ces deux crawls. Extrapolé aux ~100 crawls de l'ère `/fr/offres/` : ordre de **quelques dizaines de milliers de pages d'offre**, à confirmer crawl par crawl. **Le plafond est décroissant et désormais nul : le corpus ne s'enrichira plus.** | prouvé sur 4 crawls, extrapolation marquée comme telle |
| **A14** Fraîcheur atteignable | **Nulle pour les annonces.** Le dernier crawl exploitable date de **décembre 2025 au plus tard** (dernière version du `robots.txt` sans groupe d'IA), et le crawl d'août 2026 rend 0 page d'offre. Pour les pages de la surface autorisée, la fraîcheur est de l'ordre de **3 semaines** (crawl du 2026-08-07 au 08-19, index consulté le 2026-09-07). Incompatible avec H4 pour l'inventaire. | prouvé |

**Verdict : `VIABLE SOUS CONDITION`.** La condition n'est pas technique, elle est **temporelle** :
le candidat n'est viable que sur les crawls antérieurs à l'ajout du groupe d'agents d'IA, et ce
corpus est **définitivement clos**. Sa valeur propre est la **conformité prouvée et citable**, ce
qu'aucune autre source de contenu du registre n'offre : c'est le corpus à utiliser pour tout ce qui
doit être défendable, et la référence d'étalonnage des parseurs de `C-53`. Sa valeur volumétrique
est marginale — un facteur ~10 sous Wayback.

**Bénéfice inattendu, et il dépasse le lot** : le crawl `CC-MAIN-2026-34` est un **miroir public de
la surface autorisée** — 1 152 pages en HTTP 200, toutes sous les 17 préfixes `Allow:`, aucune
autre. Il constitue une **validation externe et indépendante** de la lecture de
`FINDING-allowed-surface.md`, et un moyen d'obtenir une partie du contenu de `C-14` **sans émettre
une seule requête vers AutoScout24**. À signaler au `LOT-A`.

**Inconnues restantes** : intégrité de `__NEXT_DATA__` dans un WARC (non rejoué) ; volume exact
cumulé sur les ~100 crawls ; date exacte du dernier crawl exploitable.

### C-55 — Index des moteurs via API — **NON VIABLE en l'état (R2)**

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **Bloquant sous R2.** Brave : compte **et carte bancaire requise** même pour le plan gratuit. SerpApi : compte requis, 250 recherches/mois gratuites. Aucun palier utilisable sans inscription. **0 requête émise.** | documenté (J25) |
| **A2** Coût récurrent | Brave : **5,00 $ / 1 000 requêtes**, ≈ **0,23 € / 1 000 URL découvertes** à 20 résultats par requête ; **≈ 780 € / mois** pour un rafraîchissement quotidien BE. SerpApi : de 25,00 à 3,75 $ / 1 000 recherches selon le palier ; ≈ **0,035 € / 1 000 URL** et **≈ 253 € / mois** (plan Big Data, 100 résultats par recherche). | documenté puis calculé (R5) |
| **A3** Couverture champs | **7 / 40** — et le chiffre est **prouvé**, non supposé : les *snippets* reprennent `<title>` et `<meta description>`, dont ce rapport a établi le contenu exact sur quatre époques (modèle, ville, carrosserie, prix, kilométrage, première immatriculation, carburant). | prouvé indirectement (section 6) |
| **A4** Couverture géo | Tout pays indexé par le moteur ; `site:autoscout24.be` cible la Belgique, `site:autoscout24.de` l'Allemagne, etc. | documenté |
| **A5** Latence | `[NON VÉRIFIÉ]` — aucune requête émise (R2). Les deux fournisseurs annoncent des SLA de l'ordre de quelques centaines de ms ; non mesuré. Durée d'un snapshot BE : 5 650 requêtes Brave à ~0,5 s ≈ **47 min**, ou 1 130 requêtes SerpApi ≈ 10 min — **estimation non mesurée**. | `[NON VÉRIFIÉ]` |
| **A6** Débit / quota | Brave : **50 req/s** sur le plan *Search*, 2 req/s sur *Answers*. SerpApi : plafond mensuel par palier, pas de plafond par seconde publié. | documenté |
| **A7** Stabilité technique | **3 / 5**. L'API est stable, mais le **contenu** de l'index ne l'est pas : nous ne contrôlons ni ce qui est indexé, ni quand il est désindexé, ni le plafond de pagination par requête. | argumenté |
| **A8** Résistance anti-bot | **Le fournisseur absorbe tout** : c'est son propre index qui répond, jamais AutoScout24. Aucun contact avec Akamai. | documenté |
| **A9** Effort d'intégration | **2 à 3 j-h** pour l'appel et le parsing des *snippets*, **plus 3 à 5 j-h** pour la stratégie de **partitionnement de requêtes** sans laquelle l'énumération est plafonnée. Total **5 à 8 j-h**. | estimé |
| **A10** Coût de maintenance | **0,5 j-h / mois** : suivi des évolutions du format de *snippet* et des plafonds de pagination. | argumenté |
| **A11** Exposition juridique | **2 / 5**. Le groupe d'agents d'IA du `robots.txt` **ne vise pas** Googlebot ni Bingbot : l'indexation des pages d'offre est licite et perdure. Nous lisons un index tiers licitement constitué. Restent les CGU du fournisseur d'API — qui interdisent fréquemment la reconstitution d'une base à partir des résultats : **clause à lire avant tout engagement**, et c'est le vrai point de vigilance. | argumenté |
| **A12** Autonomie | **Non.** Double dépendance : au fournisseur d'API, qui facture et peut couper, et au moteur, qui décide de ce qui est indexé. | documenté |
| **A13** Plafond de volumétrie | Brave gratuit : **1 000 requêtes/mois** ≈ 20 000 URL/mois. Le plafond réel n'est pas le quota mais **la non-énumérabilité d'un index** : une requête `site:` ne rend que quelques centaines de résultats, quel qu'en soit le nombre total. **`[NON VÉRIFIÉ]` et dimensionnant.** | documenté pour le quota, `[NON VÉRIFIÉ]` pour l'énumérabilité |
| **A14** Fraîcheur atteignable | Fraîcheur de l'index du moteur : typiquement quelques jours à quelques semaines pour une page de détail, non contractuelle. `[NON VÉRIFIÉ]` pour AutoScout24 spécifiquement. | `[NON VÉRIFIÉ]` |

**Verdict : `NON VIABLE` en l'état, par R2** — l'inscription et, chez Brave, la carte bancaire, sont
des conditions d'entrée que l'agent ne peut pas franchir. Le candidat n'est pas *invalide* : il
redevient instruisible dès que le commanditaire fournit une clé. Son rendement propre n'est pas la
donnée mais la **découverte d'URL d'annonces vivantes** — la seule voie du lot qui en produise,
puisqu'il n'existe aucune directive `Sitemap:` (`FINDING`, P6). En cela il est **complémentaire** de
`C-53` et `C-54`, qui ne connaissent que le passé.

**Inconnues restantes** : énumérabilité réelle d'un index par requêtes `site:` partitionnées ;
texte des CGU sur la reconstitution de base ; nombre effectif d'URL d'offres indexées.

### C-71 — urlscan.io — **NON VIABLE**

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | 0 € pour la recherche anonyme. **Mais l'accès au DOM exige un compte** → bloquant sous R2. | prouvé (J20, J21) |
| **A2** Coût récurrent | Sans objet : **le corpus est vide**. 0 € / 1 000 annonces parce que 0 annonce. | prouvé |
| **A3** Couverture champs | **0 / 40.** Aucun scan public dont la page finale soit `autoscout24.be`. | prouvé (J20) |
| **A4** Couverture géo | **Aucune.** `page.domain:autoscout24.be` → 0 ; `page.domain:autoscout24.de` → 0. Aucun domaine national d'AutoScout24 n'a de scan public. | prouvé |
| **A5** Latence | Recherche anonyme : réponse immédiate, non chronométrée précisément. Sans objet pour un corpus vide. | prouvé (HTTP 200 sur 8 requêtes) |
| **A6** Débit / quota | Recherche anonyme fonctionnelle sur 9 requêtes ; quotas anonymes non publiés. Quotas annoncés pour un compte gratuit : 5 000 scans et 1 000 recherches (source : fiche `candidates-v2.md`, non revérifiée ici). | prouvé pour 9 req ; `[NON VÉRIFIÉ]` pour les quotas |
| **A7** Stabilité technique | **1 / 5** — un corpus vide n'a pas de stabilité. La syntaxe de recherche a par ailleurs des restrictions dures : les jokers en tête et les expressions régulières sont refusés par un HTTP 403. | prouvé |
| **A8** Résistance anti-bot | **Le scanner l'absorberait** s'il scannait. Hypothèse non testée : que le zéro observé soit précisément le fait d'Akamai bloquant le scanner. | `[NON VÉRIFIÉ]` |
| **A9** Effort d'intégration | **Sans objet** — rien à intégrer. Pour mémoire, 2 à 3 j-h si un corpus existait. | estimé |
| **A10** Coût de maintenance | Sans objet. | — |
| **A11** Exposition juridique | **4 / 5** — la note la plus élevée du lot. Le seul moyen de faire exister le corpus est de **soumettre les URL nous-mêmes**, ce que la section juridique conclut être un **contournement de la réservation de l'art. 4(3) par tiers interposé**. | argumenté |
| **A12** Autonomie | **Non.** Dépendance totale à un tiers commercial, pour un corpus qui n'existe pas. | prouvé |
| **A13** Plafond de volumétrie | **0 annonce.** | prouvé |
| **A14** Fraîcheur atteignable | **Sans objet** : aucune donnée, à aucune date. | prouvé |

**Verdict : `NON VIABLE`**, sur **trois** causes indépendantes et cumulatives : le corpus attendu
est vide (mesuré, avec contrôle positif) ; l'accès au DOM est fermé aux anonymes (HTTP 403) ; et la
seule voie de constitution du corpus est juridiquement fermée par la conclusion de la section
juridique. **Aucune des trois n'est levable par un effort technique.**

**Sous-produit à conserver** : les 44 correspondances de `domain:autoscout24.be` sont une liste de
sites de garages belges pointant vers AutoScout24 — un échantillon prêt à l'emploi pour le
`LOT-M` — et une liste de domaines d'hameçonnage typosquattant la marque, sans intérêt pour KYCAR
mais à ne pas confondre avec la source.

**Inconnues restantes** : la cause du zéro (Akamai contre absence d'intérêt des scanneurs) ; ce que
contiendrait un DOM post-JS d'AutoScout24 s'il existait. Les deux sont **intestables sans
soumission**, donc closes.

### C-72 — HTTP Archive / BigQuery — **NON VIABLE pour l'inventaire, dominé pour A7**

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **Compte Google requis** → bloquant sous R2. `bq` et `gcloud` absents de la machine : **aucune requête n'a pu être émise**. Facturation activée non nécessaire pour rester dans le palier gratuit. | prouvé (J22), documenté (J23) |
| **A2** Coût récurrent | Palier gratuit **1 To/mois**. Requête ciblée sur les colonnes de clustering : **≈ 1 Go/mois**, soit **0,1 % du palier — gratuit**. Requête touchant `payload` ou `crawl.requests` : **30 To et 199 To par mois de crawl**, soit **≈ 181 $ pour un seul `SELECT *`** sur `crawl.pages` à 6,25 $/To hors palier. **€ / 1 000 annonces : non calculable — la table ne contient pas d'annonces.** | documenté (J23) puis calculé |
| **A3** Couverture champs | **0 / 40 champs d'annonce.** Le crawl est un crawl de pages d'entrée (« does not crawl the website's other pages »), issu du Chrome UX Report. Pour la **structure**, la colonne `payload` porte le HTML et donc `__NEXT_DATA__`. | documenté (J24) |
| **A4** Couverture géo | Toute origine présente dans CrUX, donc `autoscout24.be` comme `.de`, `.nl`, etc. **Présence effective non vérifiée** : elle exige la requête, donc le compte. | `[NON VÉRIFIÉ]` |
| **A5** Latence | `[NON VÉRIFIÉ]` — aucune requête émise. Ordre de grandeur BigQuery pour ~1 Go : quelques secondes. Un « snapshot BE » n'a pas de sens ici : la table rend 1 à 2 lignes par mois de crawl. | `[NON VÉRIFIÉ]` |
| **A6** Débit / quota | **1 To de données traitées par mois** ; le débit n'est pas la contrainte, le volume balayé l'est. | documenté |
| **A7** Stabilité technique | **5 / 5** intrinsèquement — jeu public, mensuel, versionné, requêtable en SQL. Mais **dominé sur son propre terrain** : ce rapport a daté la migration Next.js à cinq semaines près (J08) et compté trois générations de `listingDetails` (J09) **sans compte Google et sans BigQuery**. | argumenté |
| **A8** Résistance anti-bot | **Non concerné.** | documenté |
| **A9** Effort d'intégration | **1 à 2 j-h** pour une requête SQL et son export. Aucun adaptateur `DataProvider` : la source ne sert pas d'annonces. | estimé |
| **A10** Coût de maintenance | **0,1 j-h / mois**. | argumenté |
| **A11** Exposition juridique | **1 / 5** — la plus faible du lot. Jeu de données public, financé et hébergé par Google, expressément destiné à la recherche ; les pages retenues sont des pages d'entrée, et la surface d'entrée d'AutoScout24 est en `Allow` pour `*`. | argumenté |
| **A12** Autonomie | **Non.** Dépendance à Google Cloud pour l'exécution, et à HTTP Archive pour la publication. | documenté |
| **A13** Plafond de volumétrie | **De l'ordre de 1 à 2 lignes par mois de crawl** — une page d'entrée × deux profils client (desktop, mobile). Le schéma comporte une colonne `is_root_page`, ce qui suggère que des pages secondaires sont crawlées depuis 2022 et que la FAQ est en retard ; **le nombre effectif d'URL `autoscout24.be` par crawl reste `[NON VÉRIFIÉ]`**, et c'est exactement ce qu'un `--dry_run` puis une requête ciblée à ~1 Go établiraient gratuitement. | documenté ; `[NON VÉRIFIÉ]` pour le compte |
| **A14** Fraîcheur atteignable | **Mensuelle**, avec un décalage de publication de quelques jours à quelques semaines. Compatible avec H4 dans l'absolu, mais sans objet : il n'y a pas d'annonces à rafraîchir. | documenté |

**Verdict : `NON VIABLE` pour l'inventaire** — la table ne contient pas d'annonces, par construction
du crawl et non par accident. **Dominé pour l'axe A7** par `C-53`, qui rend la même information de
structure, sur une profondeur plus fine, sans compte et sans risque de facturation.
**`[NON VÉRIFIÉ]` unique et cheap à lever** : la présence et le nombre d'URL `autoscout24.be` par
crawl, à établir par un `--dry_run` puis une requête ciblée d'environ 1 Go — donc gratuitement, dès
que le commanditaire ouvre un compte Google.

**Inconnues restantes** : nombre d'URL `autoscout24.be` par crawl ; existence de pages secondaires
au-delà de la racine ; contenu réel de `payload` pour ces pages.
