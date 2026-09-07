# probe-LOT-E — Code tiers, pipelines en production et collecte côté client

**Agent** : `probe-E` (phase 1.4 du `PLAN-1-data-acquisition.md`) — Opus, effort high.
**Candidats instruits** : `C-70`, `C-64`, `C-65`, `C-61`, `C-62`, `C-60` *(6)*.
**Date d'exécution** : 2026-09-07.
**Nature du lot** : instruction de **code déjà en production écrit par des tiers**. Le lot ne mesure
pas ce que KYCAR pourrait faire ; il lit ce que d'autres ont réussi à faire tenir, et ce qui casse
chez eux. Aucun test de ce lot ne touche `www.autoscout24.be` ni `www.autoscout24.com` (contrainte E5).

**Conventions de preuve** : `[PROUVÉ]` = sortie de commande ou réponse HTTP journalisée ci-dessous.
`[DOCUMENTÉ]` = source publique citée, non exécutée. `[NON VÉRIFIÉ]` = non établi, et compté comme tel.

---

## Journal de preuve

Une ligne par requête et par commande. Rejouable en l'état par l'auditeur de la phase 1.5.
Colonne `#` = numéro de requête réseau au compteur global (plafond R3 : 60).

| # | Horodatage | Commande / requête | Résultat |
|---|---|---|---|
| 1 | 2026-09-07 | `git clone https://github.com/qwillemse/autoscout-analyser.git` | OK — 23 fichiers, `.github/workflows/weekly-scrape.yml` présent, HEAD `bca8487` du 2026-08-05 |
| 2 | 2026-09-07 | `curl -s https://web-production-870f.up.railway.app/health` | `200` en 336 ms — `{"status":"ok","disk_free_mb":211.1,"disk_total_mb":454.3}` |
| 3 | 2026-09-07 | `curl -s https://web-production-870f.up.railway.app/stats` | `200` en 3,56 s — **`{"listing_count":808720,"status":"ok"}`** |
| 4 | 2026-09-07 | `curl -X POST …/market-trend -d '{"make":"Opel","model":"Corsa","year":2018}'` | `200` en 379 ms — `{"trend":[{"month":"2026-09","avg_price":9299,"count":2025}],…}` |
| 5 | 2026-09-07 | `curl -X POST …/similar-cars -d '{"make":"Opel","model":"Corsa","year":2018,"mileage":90000,"actual_price":11000,"predicted_price":11500,"country":"BE"}'` | `200` en 391 ms — `total=302`, `rank=101`, **30 annonces BE réelles renvoyées**, 9 champs : `id,price,year,mileage,fuel,location,url,predicted_price,diff_pct`. Exemple : `{"id":"fee471a1-…","price":2990,"year":2016,"mileage":130000,"fuel":"Benzine","location":"Luttre"}` |
| 6 | 2026-09-07 | `curl -s https://api.github.com/repos/qwillemse/autoscout-analyser/actions/workflows/weekly-scrape.yml/runs?per_page=10` | `200` — `total_count=23`, **les 10 derniers runs `success`**, dernier `2026-09-06T06:52:16Z` (déclencheur `schedule`), fin `10:09:11Z` |
| 7 | 2026-09-07 | `curl -s …/actions/runs/34017630377/jobs` | `200` — **`scrape (BE)` 39,7 min · `scrape (NL)` 87,5 min · `scrape (DE)` 191,3 min · `train-deploy` 5,5 min**, tous `success` |
| 8 | 2026-09-07 | `curl -s …/actions/runs/34017630377/artifacts` | `200` — 3 artefacts non expirés : `cars-BE` **8,8 Mo**, `cars-NL` 18,2 Mo, `cars-DE` 39,6 Mo, `expires_at 2026-09-13` (rétention 7 j) |
| 9 | 2026-09-07 | `curl -s https://api.github.com/repos/…/actions/artifacts/9984965085/zip` (sans jeton) | **`401 Requires authentication`** — l'artefact `cars-BE` n'est **pas** téléchargeable anonymement |
| 10 | 2026-09-07 | `curl -s "https://api.github.com/search/repositories?q=autoscout24+in:name&sort=updated&per_page=60"` | `200` — **`total_count=188`** dépôts dont le nom porte « autoscout24 ». 2 poussés le 2026-09-06 (`nyg/autoscout24-trends`, `Uj005/autoscout24-germany-deutschland-scraper`). `WebOlivia/autoscout24-scraper` : `pushed=2025-11-10` |
| 11 | 2026-09-07 | `git clone https://github.com/WebOlivia/autoscout24-scraper.git` | OK — 13 commits, **tous du 2025-11-11** (dépôt déversé d'un coup, aucune évolution) |
| 12 | 2026-09-07 | `git clone https://github.com/vkresch/autoscout24-crawler.git` | OK — **1 seul commit, 2021-05-31** |
| 13 | 2026-09-07 | `git clone https://github.com/bocchilorenzo/autoscout24_bot.git` | OK — 4 commits, dernier **2023-02-04** |
| 14 | 2026-09-07 | `git clone https://github.com/nyg/autoscout24-trends.git` | OK — **147 PR, dernier commit 2026-09-06**, cible `autoscout24.ch` uniquement |
| — | 2026-09-07 | `git log --follow --numstat -- crawler/autoscout/spiders/search.py` (nyg) | 38 commits touchant l'extracteur entre 2025-05-12 et 2026-08-13 (tableau A7 ci-dessous) |
| — | 2026-09-07 | `grep -rIl` de 9 familles de sélecteurs sur les 5 dépôts | matrice de survivance ci-dessous — **intersection nulle** entre les jeux de sélecteurs DOM des 4 implémentations indépendantes |
| 15 | 2026-09-07 | `curl -sL "https://clients2.google.com/service/update2/crx?…&x=id%3Dpaocdjinpodboiinpcfbjmkegfhholhl%26uc"` | `200`, **1 541 849 octets**, `Content-Type: application/x-chrome-extension`, en-tête `Cr24` v3 |
| — | 2026-09-07 | Dépaquetage CRX3 (offset ZIP = 12 + 1309 = 1321) puis `unzip` | Manifeste MV3 v**1.0.15** lu. `host_permissions` : les **8 TLD AutoScout24** (`.at .be .de .es .fr .it .lu .nl`) + **`https://api.carissimo.io/*`**. CSP `connect-src` : `identitytoolkit.googleapis.com`, `securetoken.googleapis.com` (Firebase Auth), `api.carissimo.io`, `zaraz.com` |
| — | 2026-09-07 | `grep` des endpoints dans `js/background.js`, `js/dashboard.js` | `/tracker/configs`, `/tracker/products`, `/tracker/products/extract`, `/tracker/products/{id}`, **`/tracker/products/{id}/history`**, `/tracker/user/products`, `/tracker/history/sync` |
| 16 | 2026-09-07 | `curl -s https://api.carissimo.io/tracker/configs` | **`200`, 35 377 octets, 590 ms** — contrat d'extraction serveur pour **89 détaillants**, dont les **8 TLD AS24** |
| 17 | 2026-09-07 | `curl -s https://api.carissimo.io/tracker/products` | **`401`** — `{"error":"Authentication required","hint":"Include Authorization: Bearer <token> header"}` |
| 18 | 2026-09-07 | `curl -s https://api.carissimo.io/tracker/user/products` | **`401`** — idem |
| 19 | 2026-09-07 | `curl -s https://api.carissimo.io/tracker/configs -o cfg.json` (relecture pour analyse) | `200` — 89 détaillants ; **8 clés `autoscout24.*`** ; `autoscout24.be` : `matches=["*://www.autoscout24.be/fr/offres/*","*://www.autoscout24.be/nl/aanbod/*"]`, `requiredSources=["ld","scripts","meta"]`, `scriptParsers.nxt={"id":"__NEXT_DATA__"}`, `analyticalPartials=["nxt.props.pageProps.listingDetails"]`, `schemaType="Product"`, `cacheTTL=3600000`, **un seul sélecteur CSS** : `[class*="GonePage_gonepage"]` |
| 20 | 2026-09-07 | `git clone https://github.com/jeroendesloovere/autoscout24-php-api-documentation.git` | OK — **dernier commit 2016-05-23** (documentation figée depuis 10 ans) |
| 21 | 2026-09-07 | `git clone https://github.com/nadar/autoscout24.git` | OK — dernier commit **2025-07-06**, cible `https://www.autoscout24.ch/api/hci/v3/json/` |
| 22-23 | 2026-09-07 | `WebFetch https://chromewebstore.google.com/detail/{paocdjinpodboiinpcfbjmkegfhholhl,pimekakenahncahcbeckihhcdceldkfi}` | **`302` vers `consent.google.com`** — non suivi (règle de confidentialité : aucun consentement accordé) |
| 24-25 | 2026-09-07 | `curl "https://chromewebstore.google.com/detail/<id>?hl=en&gl=US"` | `302`, 0 octet — même mur de consentement |
| 26 | 2026-09-07 | `curl -sL https://chrome.google.com/webstore/detail/paocdjinpodboiinpcfbjmkegfhholhl` | `200`, 721 698 octets (redirigé vers `…?ucbcb=1`) — **`166 users`**, `1 rating`, `Version 1.0.15`, `Updated August 16, 2026`, `Size 1.47MiB` |
| 27 | 2026-09-07 | `curl -sL https://chrome.google.com/webstore/detail/pimekakenahncahcbeckihhcdceldkfi` | `200`, 726 336 octets — **`41 users`**, `2 ratings`, `Version 1.2`, `Updated May 3, 2026`, `Size 17.94KiB`, `Offered by quinten.willemse12` |
| 28 | 2026-09-07 | `WebSearch` « AutoScout24 recherche sauvegardée alerte email … » | Intervalles annoncés 1 h / 12 h / 24 h / 7 j — **source non primaire, marqué `[DOCUMENTÉ]` faible** |
| 29 | 2026-09-07 | `WebSearch` « Chrome Web Store developer registration fee » | Frais **unique de 5 USD** par compte développeur, jusqu'à 20 extensions ; source primaire `developer.chrome.com/docs/webstore/register` |
| 30 | 2026-09-07 | `WebFetch https://www.autoscout24.fr/informer/conseils/avant-l-achat/search-faq/` | `200` — « Créer une alerte e-mail » confirmé ; **compte obligatoire** (« Vous devrez ensuite créer un compte ») ; **aucun intervalle, aucun plafond de recherches sauvegardées documenté** |
| 31 | 2026-09-07 | `WebSearch` archives de newsletters AS24 | Rien d'exploitable |
| 32-33 | 2026-09-07 | `curl -sL https://milled.com/autoscout24` et `…/search?query=autoscout24` | **`403` « Just a moment… »** (Cloudflare) — abandonné, aucun contournement tenté |
| 34 | 2026-09-07 | `WebSearch` « AutoScout24 Suchauftrag Preisalarm E-Mail Intervall » | Fait apparaître **deux concurrents payants** vendant l'alerte temps réel : `marketplacemonitor.com` et `autoviz.pro` |
| 35 | 2026-09-07 | `WebFetch https://apps.apple.com/us/app/autoscout24-buy-sell-cars/id311785642` | `200` — v**26.35.1**, mise à jour « 4 days ago » ; « save searches so you don't miss any new offers », « set up price alerts for saved listings » ; **aucune mention de notification e-mail** dans la fiche |
| 36 | 2026-09-07 | `WebFetch https://marketplacemonitor.com/de/blog-get-notified-autoscout24-listings/` | `200` — verbatim : « *Benachrichtigungen werden verzögert gesendet (oft Stunden später).* » ; « *You frequently receive updates for already-sold or outdated listings.* » |
| 37 | 2026-09-07 | `WebFetch https://autoviz.pro/vergleich/autoscout24-suchauftrag-alternative` | `200` — verbatim : « *Die Benachrichtigung kommt verzögert – bei gefragten Autos zu spät* » ; tarif du concurrent : « *5 Tage kostenlos, danach ab 9 €/Monat* » |

**Total : 37 requêtes.** Détail par domaine en section `Conformité`. **`www.autoscout24.be` : 0 requête. `autoscout24.com` : 0 requête.**

---

## Ce que les pipelines tiers prouvent en production

C'est le cœur du lot. Cinq dépôts et deux backends tiers ont été lus ; trois d'entre eux tournent
aujourd'hui. Voici ce que leur code et leurs journaux d'exécution établissent — et ce qui casse chez eux.

### 1. Le plafond est bien 4 000, et il est écrit dans le code de deux façons concordantes

`config.py` de `qwillemse/autoscout-analyser`, verbatim :

```python
# Year bands used to split scraping queries and bypass AutoScout24's per-search
# result cap (200 pages = 4,000 listings per query).
```

et `main.py`, verbatim :

```python
# AutoScout24 caps at 200 pages per search query. The scraper also breaks
# naturally when a page returns no listings, so this is a hard ceiling.
PAGES_PER_BAND = 200
```

**Verdict** : `[PROUVÉ par implémentation tierce, non mesuré par nous]`. Le plafond est
**200 pages x 20 annonces = 4 000 annonces par requête de recherche**, et non 400. La zone
d'incertitude n° 1 de v1 est tranchée par une source d'implémentation indépendante des blogs
commerciaux, qui a un intérêt matériel à ne pas se tromper : son pipeline hebdomadaire en dépend.
Le chiffre corrobore celui documenté par Scrapfly (`C-23`).

Deux détails opérationnels que seul du code en production révèle, et qui coûteraient une journée à
redécouvrir :

- **AutoScout24 ne renvoie pas une page vide au-delà de la dernière page : il reboucle sur la page 1.**
  Commentaire verbatim du `scraper.py` : « *AutoScout24 wraps back to page 1 instead of returning
  empty, so we must check explicitly* ». La terminaison se fait sur
  `props.pageProps.numberOfPages`, pas sur un résultat vide. Un crawler naïf boucle ou duplique.
- **Sur le TLD `.be`, le paramètre `cy` casse la recherche.** `countries.py`, verbatim :
  `"cy": None,  # .be domain already filters; cy param causes 0 results`. Le préfixe de langue
  `/nl` est en revanche **obligatoire** pour `.be` (`"search_prefix": "/nl"`), là où `.nl`, `.de`,
  `.fr`, `.it`, `.es`, `.at`, `.lu` n'en prennent aucun.

### 2. La stratégie de partition, chiffrée

| Dimension | Valeur relevée | Source |
|---|---|---|
| Marques énumérées | **34** (`MAKES`, comptées par script) | `config.py` |
| Bandes d'années | **14** : `(None,2012)`, `(2013,2014)`, 11 bandes d'un an de 2015 à 2025, `(2026,None)` | `config.py`, `YEAR_BANDS` |
| Requêtes de recherche par pays | **34 x 14 = 476** | calcul |
| Plafond théorique par pays | 476 x 4 000 = **1 904 000 annonces** | calcul |
| Filtres appliqués en dur | `kmto=250000`, `fregfrom=2005`, `pricefrom=500`, `priceto=150000`, `damaged_listing=exclude`, `sort=standard`, `desc=0` | `config.py`, `PARAMS` |
| Pays configurés | **8** : NL, BE, DE, AT, FR, IT, ES, LU | `countries.py` |
| Pays réellement collectés | **3** : NL, DE, BE | matrice du workflow |

Le raffinement des bandes est lui-même une information : les bandes d'un an ne commencent qu'en 2015
parce que, verbatim, « *popular makes (VW, BMW, Mercedes) can easily exceed 4,000 listings per year* ».
Autrement dit **la partition marque x année suffit tout juste** sur les grandes marques allemandes :
c'est le grain minimal viable, et une troisième dimension (carburant, boîte, tranche de prix) serait
nécessaire pour un marché plus dense que le belge.

**Réserve importante** : les filtres `PARAMS` ne sont pas neutres. `fregfrom=2005`, `kmto=250000`,
`pricefrom=500`, `priceto=150000` et `damaged_listing=exclude` **excluent délibérément** les
véhicules de collection, les épaves et le haut de gamme. Ce pipeline ne collecte donc pas
l'inventaire, il collecte **un sous-ensemble défini par un objectif de modélisation de prix**.
Son volume n'est pas un plafond de couverture : c'est un plafond de couverture *filtrée*.

### 3. Aucun proxy, aucun service d'unblocking, aucun solveur — et ça tient depuis 23 semaines

`requirements.txt` intégral du projet : `fastapi`, `python-multipart`, `uvicorn`, `slowapi`,
`xgboost`, `scikit-learn`, `pandas`, `numpy`, `joblib`, **`requests`**, **`beautifulsoup4`**,
`openai`. **Aucun** `curl_cffi`, `playwright`, `selenium`, `undetected-chromedriver`, `camoufox`,
`flaresolverr`, `2captcha`, `anticaptcha`, ni aucun SDK de fournisseur de proxy.

L'unique mesure d'évasion du code est une ligne :

```python
HEADERS = {"User-Agent": "Mozilla/5.0"}
```

Un `User-Agent` tronqué, statique, sans `Accept`, sans `Accept-Language`, sans cookie. Aucune
rotation d'IP : le trafic sort des plages d'adresses **publiques et connues des runners GitHub
Actions hébergés par Azure**, ce qui est le pire cas possible pour une réputation d'IP.

Et le résultat mesuré (requêtes 6 et 7) :

| Fait | Valeur |
|---|---|
| Runs du workflow `weekly-scrape.yml` | **23** |
| Conclusion des 10 derniers | **`success` x 10** |
| Dernier run | **2026-09-06T06:52Z**, déclenché par `schedule`, terminé `10:09Z` |
| Durée du job `scrape (BE)` du dernier run | **39,7 min** |
| Durée `scrape (NL)` / `scrape (DE)` | 87,5 min / 191,3 min |
| Concurrence utilisée | `MAX_WORKERS = 5` threads, `time.sleep(1.5)` entre pages |
| Annonces en base au 2026-09-07 | **808 720** (endpoint `/stats`) |

**Verdict, et c'est la conclusion la plus lourde du lot** : sur les TLD `.be`, `.nl` et `.de`,
**Akamai ne bloque pas le chemin `/lst/` pour un client `requests` nu, à 5 requêtes concurrentes
espacées de 1,5 s, depuis des IP de datacenter Azure, de façon reproductible chaque dimanche
depuis 23 semaines.** L'axe A8 n'est donc **pas** le verrou qu'on supposait pour ce chemin
d'accès. La qualification honnête : le blocage anti-bot d'AutoScout24 est **sensible au débit
et au chemin**, pas à la nature du client.

Trois réserves à porter au rapport final, faute de quoi cette conclusion serait sur-vendue :

1. **Ce n'est pas notre mesure.** Nous n'avons émis aucune requête vers AS24. C'est la preuve
   qu'un tiers y arrive, pas la preuve que nous y arriverions — l'IP, l'horaire (dimanche 02:00 UTC,
   choisi explicitement pour les « *slow hours for AutoScout24* ») et le débit font partie du résultat.
2. **Le chemin utilisé nous est interdit.** `/lst/` et `/nl/lst/` ne figurent pas parmi les
   17 préfixes `Allow` du groupe `ClaudeBot`. Ce que ce pipeline prouve techniquement,
   `FINDING-allowed-surface.md` nous l'interdit contractuellement. La preuve est **technique**,
   pas **juridique** : voir A11.
3. **1,5 s x 5 workers est un débit délibérément faible.** Le pipeline ne dit rien du plafond de
   débit ; il dit qu'il existe un régime lent qui passe. Le seuil de déclenchement d'Akamai reste
   `[NON VÉRIFIÉ]`.

### 4. Le débit réel, mesuré, et ce qu'il donne pour un snapshot belge

Le job `scrape (BE)` a couvert 34 marques x 14 bandes en **39,7 minutes**, sur un runner
`ubuntu-latest` gratuit, avec 5 workers et 1,5 s de pause. C'est une mesure de bout en bout.

Estimation du volume belge ainsi collecté, hypothèses posées :

- L'artefact `cars-BE` pèse **8,8 Mo** compressés, `cars-NL` 18,2 Mo, `cars-DE` 39,6 Mo (requête 8).
- La base fusionnée compte **808 720 lignes** (requête 3) et le schéma est identique pour les trois pays.
- En supposant la taille compressée proportionnelle au nombre de lignes — **hypothèse, non prouvée** —
  la part belge est 8,8 / 66,6 = 13,2 %, soit **environ 107 000 annonces belges**.
- Ce chiffre est cohérent, à 7 %, avec les ~115 000 annonces BE annoncées par AS24 et citées
  dans `C-86`. Deux ancrages indépendants convergent.

**Conséquences chiffrées** :

| Grandeur | Valeur | Statut |
|---|---|---|
| Durée d'un snapshot BE complet | **39,7 min** | prouvé (journal GitHub Actions) |
| Débit moyen | 107 000 / 39,7 min = **environ 2 700 annonces/min, soit 162 000 annonces/h** | calculé sur une hypothèse de volume |
| Requêtes HTTP émises pour ce snapshot | 107 000 / 20 + 476 = **environ 5 830** | calculé |
| Coût monétaire | **0 EUR** — palier gratuit GitHub Actions, budget de 350 min/job | prouvé (workflow) |
| Fraîcheur atteignable | **hebdomadaire** telle qu'exploitée ; **quotidienne possible** | prouvé / calculé |

Ce dernier point mérite d'être souligné : **un rafraîchissement quotidien du périmètre belge
coûterait environ 1 190 minutes de runner par mois, donc sous le plafond gratuit de 2 000 min/mois**
d'un compte GitHub personnel. La ligne A2 « EUR / mois pour un rafraîchissement quotidien BE »
vaut **0 EUR** pour cette mécanique — c'est le seul candidat du lot pour lequel c'est le cas.

### 5. La base de 730 000 (aujourd'hui 808 720) annonces : ce qui est téléchargeable et ce qui ne l'est pas

C'était la question décisive du mandat. Réponse en trois temps.

| Voie | Mécanique | Verdict mesuré |
|---|---|---|
| `GET /download/cars.db` sur l'API Railway | `api.py` l. 862-865 : `if not UPLOAD_SECRET or authorization != f"Bearer {UPLOAD_SECRET}": raise HTTPException(status_code=403)` | **FERMÉ** — jeton porteur obligatoire, non publié |
| Artefacts GitHub Actions `cars-BE` / `cars-NL` / `cars-DE` | Publiés à chaque run, **non expirés**, 8,8 / 18,2 / 39,6 Mo, rétention 7 jours | **`401 Requires authentication`** en anonyme (requête 9) — mais un **compte GitHub gratuit quelconque** suffit à les télécharger, le dépôt étant public. → `ACTIONS-COMMANDITAIRE` |
| Dépôt Git lui-même | `.gitignore` exclut `cars.db` | **FERMÉ** — la base n'est pas versionnée |

**Verdict** : le jeu de 808 720 annonces **n'est pas un dataset librement téléchargeable**, mais il
en est à **une action de commanditaire près** : utiliser un compte GitHub gratuit et appeler
`GET /repos/qwillemse/autoscout-analyser/actions/artifacts/{id}/zip` avec un jeton. Coût 0 EUR,
délai quelques minutes, licence MIT sur le code — **et rien sur les données**, qui restent
l'extraction d'une base protégée par le droit *sui generis* d'AS24 et par le § 3.3 des
`Händler-AGB` (interdiction verbatim de « *die automatisierte Abfrage der Datenbank mittels
Software* », relevée en phase 1.3). C'est un point A11, pas un point A1.

### 6. L'API hébergée est un canal de lecture non authentifié sur l'inventaire belge

Fait non anticipé par le registre, et le plus immédiatement exploitable. Quatre endpoints publics
sans clé ont été interrogés avec succès :

| Endpoint | Auth | Ce qu'il rend |
|---|---|---|
| `GET /health` | non | état disque |
| `GET /stats` | non | **`listing_count` de la base entière** |
| `POST /market-trend` | non | **série agrégée** `{month, avg_price, count}` par marque x modèle x ±2 ans |
| `POST /similar-cars` | non | **jusqu'à 30 annonces réelles** + `total` = effectif de l'ensemble filtré |
| `POST /predict`, `/predict/batch`, `/predict/detailed`, `/explain` | non | prédiction de prix ; `/explain` appelle GPT-4o-mini aux frais du tiers |
| `POST /upload/*`, `GET /download/*` | **Bearer** | fermés |

Mesures obtenues sur une seule requête `/similar-cars` (Opel Corsa 2016-2020, `country=BE`) :
`total = 302`, 30 lignes rendues, **9 champs** dont `id` (UUID AS24), `price`, `year`, `mileage`,
`fuel`, `location` (ville), `url` (deeplink), `predicted_price`, `diff_pct`.

Plafonds **lus dans le code**, non mesurés : `@limiter.limit("30/minute")` sur `/similar-cars` et
`/market-trend`, `20/minute` sur `/predict/batch`, `60/minute` sur `/predict`, `10/minute` sur
`/explain`. Soit un débit maximal théorique de **30 x 30 = 900 annonces/minute** par ce canal.
**Aucune extraction n'a été tentée** (R3) : 2 requêtes ont suffi à prouver la mécanique.

### 7. Ce qui casse chez eux

C'est la partie que le mandat demandait explicitement, et elle ne recoupe pas les hypothèses de
départ. Trois familles de casse, et **aucune n'est un blocage anti-bot**.

**a) Chez `qwillemse` (`.be`/`.nl`/`.de`, `requests` nu)** — l'historique des commits et le journal
des runs le disent :

- **Le disque, pas le site.** Deux des trois derniers commits du dépôt sont
  `Fix upload endpoint blowing up when Railway volume runs low` (2026-08-04) et `Fall back to
  delete-first upload when volume is too tight for rollback` (2026-08-05). L'endpoint `/health`
  mesuré aujourd'hui renvoie **`disk_free_mb: 211.1` sur `disk_total_mb: 454.3`** : le volume
  hébergé est **saturé à 54 %** par une base qui grossit chaque semaine. La contrainte qui a
  réellement coûté du travail de maintenance à ce projet en 2026 est le **stockage**, pas Akamai.
- **Le budget de temps.** `timeout-minutes: 350` par pays, commenté « *Each country gets its own
  6h budget (GH Actions free tier per-job cap)* ». DE consomme déjà **191 min sur 350**. L'ajout de
  tous les pays configurés ferait sortir du palier gratuit. C'est le vrai plafond d'échelle de
  cette mécanique : **le temps de runner, pas le blocage**.
- **L'extension, elle, casse côté DOM.** Trois commits d'avril 2026 : `Retry badge injection when
  search cards aren't rendered yet`, `Detect pushState navigation (homepage → search) to re-run
  main()`, `Remove duplicate _lastUrl declaration causing SyntaxError`. La partie du projet qui
  touche le DOM d'AS24 est celle qui demande des réparations ; la partie qui lit `__NEXT_DATA__`
  n'en a demandé **aucune** (voir A7).

**b) Chez `nyg/autoscout24-trends` (`.ch`)** — le dépôt le plus instructif du lot, 147 PR, actif hier :

- Il a fallu **un navigateur anti-détection** : commit `Use scrapy-seleniumbase to bypass
  cloudflare` (2025-11-08), et les dépendances actuelles portent `scrapy-seleniumbase-cdp==2.0.4`
  et `seleniumbase==4.52.4`. Sur `.ch`, `requests` **ne suffit pas**.
- Il a fallu **changer trois fois de paradigme d'extraction** en 16 mois : DOM CSS/XPath (mai 2025)
  → `Refactor to use the JSON returned by AutoScout24` (2025-05-18) → navigateur anti-détection
  (2025-11-08) → **flight data / React Server Components** via `njsparser` (`Use flight data for
  car links and robust extraction`, 2026-04-04).
- Il a fallu **patcher la bibliothèque de parsing du tiers** : `crawler/autoscout/flight_data_patch.py`
  monkey-patche `njsparser` pour tolérer les lignes de flight data vides
  (`fix(crawler): parse flight data rows that carry no value`, 2026-08-13). Signature d'un format
  qu'AS24 fait évoluer sans préavis.
- Il a fallu suivre **une classe CSS retirée du site** : `fix: remove h1 CSS class in
  wait_for_element` (2026-06-24).

**c) Chez `carissimo.io` (`C-61`, `.be` inclus)** — lu dans son contrat d'extraction serveur : le
tiers a **externalisé sa configuration d'extraction hors de son extension**, dans un endpoint
`/tracker/configs` qu'il peut corriger sans republier au Web Store. Pour AS24, la config ne
contient **qu'un seul sélecteur CSS**, et c'est un `[class*="GonePage_gonepage"]` en correspondance
partielle — donc résistant au suffixe de hachage des CSS modules Next.js. Tout le reste passe par
`ld` (JSON-LD `Product`), `scripts` (`__NEXT_DATA__`) et `meta`.

**La leçon transversale, et elle est actionnable pour KYCAR** : les trois équipes qui tiennent un
pipeline AS24 en production ont toutes **abandonné les sélecteurs DOM** au profit de charges utiles
structurées (`__NEXT_DATA__`, JSON-LD, flight data). Deux l'ont fait par migration après casse. Un
adaptateur `DataProvider` qui lit `__NEXT_DATA__` et le JSON-LD, et qui n'a **aucun** sélecteur CSS
dans son chemin critique, est le seul dessin que la preuve en production soutient.

### 8. Le signal d'alerte que personne n'avait relevé : `.ch` a déjà migré, `.be` pas encore

`nyg` lit du **flight data** (React Server Components, App Router de Next.js) sur `autoscout24.ch`.
`qwillemse` et `carissimo` lisent `__NEXT_DATA__` (Pages Router) sur `.be`, `.nl`, `.de`. Les deux
faits sont établis par le code de projets qui tournent **le même mois**.

Autrement dit : **une entité du groupe a déjà retiré `__NEXT_DATA__` de ses pages, et c'est
précisément le mécanisme sur lequel repose toute la voie prioritaire de KYCAR** (`C-14`,
`FINDING-allowed-surface.md`). `autoscout24.ch` est opéré par SMG et non par AS24 GmbH, ce qui
affaiblit l'inférence — mais la direction technologique de l'écosystème Next.js la rend
structurelle plutôt qu'accidentelle. C'est le risque A7 dimensionnant, et il est **daté** : la
migration `.ch` a cassé le crawler de `nyg` entre mars et avril 2026 et lui a coûté la réécriture
de la moitié de son extracteur.

### 9. Deux découvertes latérales à reverser dans d'autres lots

- **`nadar/autoscout24`** (PHP, 12 étoiles, dernier commit **2025-07-06**) est un client REST de
  `https://www.autoscout24.ch/api/hci/v3/json/` — l'API **HCI** du groupe, avec un objet
  `VehicleQuery` paginé, donc une **API de lecture**. Son README avertit, verbatim :
  « *The AutoScout24 Endpoint is only available if they whiteliste your provided IP Address* », et
  exige d'obtenir `cuid` et `memberid` « *from the AutoScout24 Support* ». À reverser dans `C-04`
  (`LOT-B`) : c'est une API de lecture du groupe, documentée par un tiers, à identifiants +
  liste blanche d'IP.
- **`marketplacemonitor.com` et `autoviz.pro`** vendent aujourd'hui de la surveillance temps réel
  sur AutoScout24 (AutoViz : « *5 Tage kostenlos, danach ab 9 EUR/Monat* », « 20+ places de
  marché »). Ce sont deux fournisseurs commerciaux **absents du registre**, à reverser dans
  `C-22`/`C-28` (`LOT-F`/`LOT-G`) comme points de mesure A2, et qui confirment par leur seule
  existence que la collecte AS24 est industrialisée par des tiers.
- **`api.autoscout24.com`** — la documentation PHP de `C-65` nomme cet hôte et ses ressources.
  **Aucune sonde émise** : E5 nous interdit `autoscout24.com`. À trancher par `LOT-A`/`LOT-B`,
  qui détient déjà `listing-creation.api.autoscout24.com`.

---

## Mesure de A7 par diff des sélecteurs

Test prescrit par le mandat. Cinq dépôts ont été clonés à leur commit le plus récent, et deux
mesures distinctes ont été conduites : la **survivance inter-générationnelle** des sélecteurs et
le **taux de casse intra-dépôt** dans le temps.

### Mesure 1 — Survivance des sélecteurs entre implémentations indépendantes

Matrice de présence obtenue par `grep -rIl` de 9 familles de sélecteurs sur les 5 dépôts (les
chiffres sont des nombres de fichiers contenant le motif) :

| Motif | vkresch 2021 | bocchilorenzo 2023 | WebOlivia 2025-11 | qwillemse 2026-08 | nyg 2026-09 |
|---|---|---|---|---|---|
| `cldt-` (classes « classified detail ») | **1** | 0 | 1 | 0 | 0 |
| `sc-font-bold` | **1** | 0 | 0 | 1 (extension) | 0 |
| `basicData…Value` (id d'élément) | **1** | 0 | 0 | 0 | 0 |
| `all_spans[n]` (index positionnel) | 0 | **1** | 0 | 0 | 0 |
| `data-testid` | 0 | 0 | **1** | 1 (extension) | 0 (retiré en 2026-04) |
| `data-item-name` | 0 | 0 | **1** | 0 | 0 |
| `__NEXT_DATA__` | 0 | 0 | 0 | **3** | 0 |
| flight data / `njsparser` | 0 | 0 | 0 | 0 | **6** |

**Résultat chiffré** : quatre implémentations indépendantes, quatre contrats d'extraction
**mutuellement incompatibles**, et une **intersection strictement nulle** entre les jeux de
sélecteurs DOM de n'importe quelle paire de dépôts.

| Génération | Dépôt | Date du code | Contrat d'extraction | Nb de sélecteurs | Survit dans une génération ultérieure ? |
|---|---|---|---|---|---|
| 2021 | `vkresch/autoscout24-crawler` | 2021-05-31 | XPath sur `//*[@class="cldt-stage-headline"]`, `cldt-stage-basic-data`, `sc-font-bold`, `sc-grid-col-s-12`, `@id="basicDataFirstRegistrationValue"` | **~45 XPath** pour 45 champs | **non** — aucune classe `cldt-*` réutilisée par un scraper postérieur qui fonctionne |
| 2023 | `bocchilorenzo/autoscout24_bot` | 2023-02-04 | `find_all("article")` puis **index positionnel** `all_spans[1]`…`all_spans[10]`, `all_paragraphs[0..1]` | 1 structurel + **12 index** | **non** — paradigme abandonné par tous les suivants |
| 2025 | `WebOlivia/autoscout24-scraper` | 2025-11-11 | **29 sélecteurs `[data-testid="*-label"]`** + `a[data-item-name="detail-page-link"]`, `a[rel="next"]`, `a[aria-label*="Next|Weiter"]`, résidu `.cldt-vendor-contact-box` | **32** | **partiellement** — la famille `data-testid` survit ; aucun **nom** de testid n'est partagé avec `nyg` |
| 2026 | `qwillemse/autoscout-analyser` | 2026-08-05, **en prod le 2026-09-06** | **0 sélecteur DOM** côté scraper : chemins JSON `props.pageProps.listings[]`, `.tracking.price`, `.vehicle.make`, `.vehicleDetails[].ariaLabel` | **0** | n/a |
| 2026 | `nyg/autoscout24-trends` | 2026-09-06 | **0 sélecteur DOM** : flight data RSC via `njsparser.BeautifulFD` | **0** | n/a |

Deux observations que ce tableau rend visibles et qu'aucun autre test n'aurait données :

1. **Le résidu `cldt-vendor-contact-box` chez `WebOlivia`** (parser.py l. 126 et 215, pour le nom et
   l'adresse du vendeur) est une classe de la génération 2021. Un scraper de novembre 2025 porte
   encore un sélecteur de 2021 : soit AS24 a conservé cette classe précise sur la vitrine vendeur,
   soit — plus probable au vu du reste du dépôt (`requirements.txt` malformé : `txtrequests>=2.31.0`,
   13 commits tous du même jour) — **ce dépôt est une compilation non testée**, et ses sélecteurs
   ne prouvent rien sur l'état réel du site. Je le classe donc comme **source de faible fiabilité**
   et ne fonde aucune note sur lui seul.
2. **`nyg` a utilisé `data-testid="listing-card-*"` de 2025-05 à 2026-04**, puis l'a retiré
   (`git log -S'data-testid'` : introduit le 2025-05-12, supprimé le 2026-04-04). Un nom de
   `data-testid` a donc tenu **environ 11 mois** avant d'être abandonné au profit du flight data.
   C'est la seule durée de vie de sélecteur DOM réellement **mesurée** de tout le lot.

### Mesure 2 — Taux de casse intra-dépôt (le seul dépôt à historique de production continu)

`git log --follow --numstat` sur `crawler/autoscout/spiders/search.py` de `nyg/autoscout24-trends`
donne 38 commits entre 2025-05-12 et 2026-08-13, sur un fichier qui compte aujourd'hui **196 lignes**.

Commits de **réparation d'extraction** (à l'exclusion des commits d'infrastructure, de dépendances
et de fonctionnalité) :

| Date | Commit | Lignes +/− | Nature |
|---|---|---|---|
| 2025-05-16 | `Fix scraping of garage name` | +4 / −1 | champ cassé |
| 2025-05-18 | `Refactor to use the JSON returned by AutoScout24` | +10 / −28 | **changement de paradigme 1** (DOM → JSON) |
| 2025-11-08 | `Use scrapy-seleniumbase to bypass cloudflare` | +23 / −9 | **changement de paradigme 2** (HTTP → navigateur anti-détection) |
| 2025-12-20 | `Fix data parsing, take screenshot of page` | +32 / −6 | parsing cassé |
| 2025-12-22 | `Refactor scraper with multiple improvements` | +41 / −26 | refonte |
| 2025-12-27 | `Fix bug when results are several pages` | +19 / −15 | pagination cassée |
| 2026-03-07 | `Fix AutoScout24.ch flight data parsing (#20)` | +6 / −6 | format changé |
| 2026-03-07 | `Resolve car description value in flight data (#21)` | +12 / −5 | champ cassé |
| 2026-04-04 | `Use flight data for car links and robust extraction (#70)` | **+86 / −92** | **changement de paradigme 3** (DOM → flight data) |
| 2026-06-24 | `fix: remove h1 CSS class in wait_for_element (#108)` | +2 / −2 | classe CSS retirée du site |
| 2026-08-13 | `fix(crawler): fail the run when a page cannot be parsed (#140)` | +11 / −1 | garde-fou ajouté après casse silencieuse |
| 2026-08-13 | `fix(crawler): parse flight data rows that carry no value (#141)` | +3 / −0 | format changé |

**Chiffres de A7** :

| Indicateur | Valeur mesurée |
|---|---|
| Fenêtre d'observation | 2025-05-12 → 2026-09-06, soit **15,8 mois** |
| Commits de réparation d'extraction | **12** |
| Cadence de casse | **0,76 réparation / mois**, soit **une réparation toutes les 6,2 semaines** |
| Changements de paradigme d'extraction complets | **3 en 15,8 mois** |
| Ampleur du plus gros : PR #70 | **178 lignes modifiées** (+86/−92) sur un extracteur de ~200 lignes, soit **environ 90 % du fichier réécrit en un commit** |
| Sur 12 mois glissants (2025-09 → 2026-09) | **9 réparations** et **2 changements de paradigme** |

**Contre-mesure, sur l'autre surface** — `qwillemse`, chemin `__NEXT_DATA__` sur `.be`/`.nl`/`.de` :

| Indicateur | Valeur mesurée |
|---|---|
| Dernier commit touchant `scraper.py` | **2026-04-29** (`Parallelize weekly scrape per country + add request timeout`) |
| Commits de réparation d'extraction depuis | **0** |
| Durée sans réparation | **4,3 mois** |
| Runs hebdomadaires réussis sur cette période | **environ 19**, tous `success` |
| Commits de réparation côté **extension** (DOM) sur la même période | **3** (avril 2026) |

### Verdict A7, et il est double

La question falsifiable prioritaire n° 5 du mandat — « *Les sélecteurs des scrapers open source ont
changé au moins deux fois en 12 mois* » — est **VRAIE**, et largement dépassée : **9 réparations et
2 changements de paradigme en 12 mois glissants** sur le seul crawler AS24 à historique de
production continu.

Mais la mesure oblige à **scinder A7 par contrat d'extraction**, ce que la grille ne prévoyait pas :

| Contrat d'extraction | A7 (1 = très fragile, 5 = très stable) | Preuve |
|---|---|---|
| Sélecteurs DOM (CSS/XPath/testid) sur AS24 | **1 / 5** | intersection nulle entre 4 générations ; durée de vie mesurée d'un `data-testid` : 11 mois ; 12 réparations en 15,8 mois chez `nyg` ; 3 commits de réparation DOM chez `qwillemse` en 1 mois |
| Index positionnel (`all_spans[n]`) | **1 / 5** | paradigme unique à 2023, abandonné par toutes les générations suivantes |
| `__NEXT_DATA__` sur `.be`/`.nl`/`.de` | **4 / 5** *sur l'observation disponible* | 0 réparation en 4,3 mois, 19 runs verts ; mais fenêtre courte, **et le même groupe a déjà retiré ce mécanisme sur `.ch`** |
| Flight data RSC sur `.ch` | **2 / 5** | 3 réparations de format en 5 mois depuis la migration |
| JSON-LD `schema.org/Product` | **`[NON VÉRIFIÉ]` par nous, mais indirectement 4-5 / 5** | `carissimo.io` le déclare en source requise pour les 8 TLD AS24 et n'a qu'un sélecteur CSS de secours ; aucune mesure de sa stabilité dans le temps n'est disponible |

La conséquence de conception est nette et chiffrée : **choisir `__NEXT_DATA__` + JSON-LD plutôt que
le DOM déplace A7 de 1/5 à 4/5**, et la maintenance attendue de ~0,76 réparation/mois
(A10 environ 0,5 j-h/mois) à ~0 sur la période observée. Le risque résiduel n'est pas le sélecteur :
c'est la **migration d'architecture du site**, événement rare, brutal et déjà observé une fois dans
le groupe, qui coûterait la réécriture complète de l'extracteur — environ 90 % du fichier, mesuré
sur le précédent `.ch`.

---

## Candidats

Rappel de convention : `[PROUVÉ]` = sortie de commande journalisée ci-dessus. `[DOCUMENTÉ]` = source
publique citée. `[NON VÉRIFIÉ]` = non établi, compté dans le taux de la section `Conformité`.

Avertissement de périmètre, valable pour les six fiches : ce lot instruit **du code tiers**. Quand
une cellule dit qu'une chose fonctionne, elle dit qu'**elle fonctionne chez ce tiers, dans ses
conditions**. La transposition à KYCAR est une inférence, et elle est signalée comme telle.

### C-70 — `qwillemse/autoscout-analyser` : pipeline AS24 en production, MIT, avec API hébergée

Le candidat se dédouble à l'instruction, et il faut le dire avant le tableau, sinon les notes sont
incohérentes. Il porte **deux voies distinctes** :

- **C-70a — la méthode**, réutilisable par nous (partition marque x bande d'années sur `/lst`,
  lecture de `__NEXT_DATA__`, `requests` nu, GitHub Actions). Techniquement prouvée, **mais sur un
  chemin que `robots.txt` nous interdit**.
- **C-70b — l'artefact et l'API du tiers**, consommables tels quels (artefacts `cars-*.db`,
  endpoints publics `/stats`, `/market-trend`, `/similar-cars`). Aucune requête vers AS24 de notre
  part, mais dépendance totale à un tiers bénévole.

| Axe | C-70a — la méthode | C-70b — consommer le tiers | Preuve |
|---|---|---|---|
| **A1** Coût d'amorçage | **0 EUR** — dépôt MIT clonable, `requirements.txt` 12 paquets libres, aucun compte payant | **0 EUR** pour l'API publique ; **0 EUR + un compte GitHub gratuit** pour les artefacts | `[PROUVÉ]` — LICENSE MIT, requirements.txt, requêtes 2-5, 8-9 |
| **A2** Coût récurrent | **0 EUR / 1 000 annonces** et **0 EUR / mois** pour un rafraîchissement quotidien BE : 39,7 min/jour = ~1 190 min/mois, sous le palier gratuit GitHub de 2 000 min/mois | **0 EUR / 1 000** et **0 EUR / mois** | `[PROUVÉ]` durée ; `[DOCUMENTÉ]` palier GitHub |
| **A3** Couverture champs / 40 | **20 / 40** effectivement conservés par ce pipeline (schéma `listings` : `id, make, model, year, mileage, fuel, transmission, price, location, power_kw, range_km, trim_id, variant_id, generation_id, body_type, colour, seller_type, country, first_seen, last_seen`) + table `price_history`. Le payload `/lst` en contient davantage — **le pipeline jette ce qui ne sert pas son modèle** ; le décompte réel du payload est `[NON VÉRIFIÉ]` (E5) | **9 / 40** via `/similar-cars` (`id, price, year, mileage, fuel, location, url` + 2 champs calculés) | `[PROUVÉ]` — `db.py`, requête 5 |
| **A4** Couverture géo | **8 pays configurés** : NL, BE, DE, AT, FR, IT, ES, LU — avec domaine, préfixe de langue et libellés par pays. **3 collectés** : NL, DE, BE. Couvre H1 (BE/FR/DE/LU/NL) en configuration | **3 pays** en base : NL, DE, BE | `[PROUVÉ]` — `countries.py`, workflow |
| **A5** Latence | **p50 non mesuré par nous** (E5). Mesure indirecte : ~5 830 requêtes en 39,7 min à 5 workers = **~2,0 s par requête par worker**, dont 1,5 s de `sleep` imposé → **latence réseau ~0,5 s**. **Snapshot BE complet : 39,7 min** | `/health` **336 ms**, `/stats` **3 562 ms** (scan `COUNT(*)`), `/market-trend` **379 ms**, `/similar-cars` **391 ms** | `[PROUVÉ]` requêtes 2-5, 7 |
| **A6** Débit / quota | **~162 000 annonces/h** atteintes en pratique (BE). Plafonds durs : **200 pages = 4 000 annonces par requête de recherche** ; **350 min par job** GitHub ; le seuil de déclenchement d'Akamai est `[NON VÉRIFIÉ]` | **900 annonces/min** théoriques (`30/minute` x 30 lignes) — **non testé**, R3 | `[PROUVÉ]` durée et code ; plafond Akamai `[NON VÉRIFIÉ]` |
| **A7** Stabilité technique | **4 / 5** sur la fenêtre observée : **0 réparation d'extraction en 4,3 mois**, ~19 runs verts. Risque non nul et daté : `.ch` a déjà abandonné `__NEXT_DATA__` | **2 / 5** — dépend d'un projet personnel, d'un volume Railway **saturé à 54 %** et de la bonne volonté d'un tiers | `[PROUVÉ]` git log, `/health` |
| **A8** Résistance anti-bot | **Nous**, mais la charge est **nulle en pratique sur ce chemin** : `requests` + `Mozilla/5.0`, pas de proxy, IP Azure publiques, 23/23 runs OK | **Non concerné** — aucune requête vers AS24 | `[PROUVÉ]` requirements.txt, requêtes 6-7 |
| **A9** Effort d'intégration | **2 à 4 j-h** : le `scraper.py` fait 167 lignes, le schéma cible est déjà proche de KYCAR ; il faut réécrire l'énumération marque/modèle sur le référentiel officiel de `C-02` et retirer les filtres `PARAMS` biaisants | **0,5 j-h** — 3 endpoints, JSON plat | estimé |
| **A10** Coût de maintenance | **~0,1 j-h / mois** observé sur 4,3 mois (0 réparation), **plus une provision de 3 à 5 j-h** pour l'événement « migration d'architecture » (précédent `.ch` : ~90 % de l'extracteur réécrit) | **0,1 j-h / mois**, mais **risque de coupure totale sans préavis** | argumenté sur mesure |
| **A11** Exposition juridique | **4 / 5** — mécanismes nommés : (i) violation de `robots.txt` (`/lst` hors des 17 `Allow`), (ii) **§ 3.3 des `Händler-AGB`** qui interdit verbatim « *die automatisierte Abfrage der Datenbank mittels Software* », (iii) **droit *sui generis* du producteur de base de données** (dir. 96/9/CE, art. 7 : extraction d'une partie substantielle), (iv) RGPD — le champ `seller.contactName` est un nom de personne physique (relevé dans `FINDING-allowed-surface.md`). La licence MIT couvre **le code, pas les données** | **4 / 5** — identique en substance : consommer l'extraction d'un tiers ne purge pas le droit *sui generis*, et y ajoute le parasitisme d'infrastructure (l'API tourne aux frais du tiers, `/explain` consomme ses crédits OpenAI) | argumenté, mécanismes nommés |
| **A12** Autonomie | **Oui, pleinement autonome** — aucun tiers ne peut nous couper ; seul AS24 peut, en changeant son site ou en bloquant | **Non** — un tiers bénévole peut arrêter Railway, changer le jeton, passer le dépôt en privé, ou saturer son disque (54 % déjà) | `[PROUVÉ]` structurellement |
| **A13** Plafond de volumétrie | **4 000 annonces par recherche** (dur, codé et commenté) ; **1 904 000 par pays et par passage** avec la partition 34 x 14 ; **~107 000 pour BE** en pratique, soit l'inventaire quasi complet | **30 lignes par appel**, 30 appels/min ; l'énumération complète exigerait de balayer marque x modèle x année, non tenté (R3) | `[PROUVÉ]` code ; volume BE **estimé** sur hypothèse de proportionnalité |
| **A14** Fraîcheur atteignable | **hebdomadaire** en l'état (dimanche 02:00 UTC) ; **quotidienne** techniquement et gratuitement atteignable ; délai publication → disponibilité = **0 à 7 jours** aujourd'hui, **0 à 24 h** possible | **0 à 7 jours + le délai de propagation vers Railway** ; toutes les lignes de `/market-trend` portent le mois `2026-09`, donc la base reflète le dernier passage | `[PROUVÉ]` workflow, requête 4 |

**Verdict C-70a (la méthode)** : **VIABLE SOUS CONDITION** — condition unique et non technique :
lever l'obstacle `robots.txt` / CGU sur `/lst`. La faisabilité technique, le coût nul, le débit et
la couverture sont **prouvés en production par un tiers**. C'est le candidat le mieux étayé du lot,
et il échoue sur A11, pas sur A5, A6, A8 ni A13.

**Verdict C-70b (consommer le tiers)** : **VIABLE SOUS CONDITION** pour un **prototype** seulement,
avec deux conditions : (i) usage de test uniquement, sans dépendance de production (A12 = non), et
(ii) contact du mainteneur — c'est un projet MIT d'une personne, et lui demander l'accès à
`cars.db` est à la fois plus honnête et plus fiable que d'appeler son API en boucle. Non viable en
production.

**Inconnues restantes** :
1. Le décompte exact des champs du payload `/lst` — `[NON VÉRIFIÉ]`, non levable sous E5. À poser à `LOT-C`/`LOT-D`.
2. Le seuil de déclenchement d'Akamai en fonction du débit — `[NON VÉRIFIÉ]`. Le pipeline prouve qu'un régime lent passe, pas où est la limite.
3. La proportionnalité taille compressée / nombre de lignes, qui fonde l'estimation de 107 000 annonces BE — hypothèse non prouvée.
4. Si `/lst` sert un échantillon exhaustif ou trié par produit publicitaire : le pipeline utilise `sort=standard&desc=0` et parcourt **toutes** les pages, ce qui rend le biais P2 non pertinent pour lui — mais ne le prouve pas pour les pages SEO de `C-14`.

### C-64 — Scrapers open source AutoScout24 comme parseurs de référence

Ce candidat n'est **pas une voie d'alimentation** : c'est un instrument de mesure et une carte des
champs. Ses axes doivent être lus dans ce rôle.

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **0 EUR** — 6 dépôts clonés, licences MIT | `[PROUVÉ]` requêtes 1, 11-14, 20-21 |
| **A2** Coût récurrent | **Non concerné** — aucun flux de données. 0 EUR / 1 000 annonces (rien n'est récupéré), 0 EUR / mois | par nature |
| **A3** Couverture champs / 40 | **Le meilleur apport du candidat** : `vkresch` documente **124 champs distincts** de la page de détail (dont ~86 booléens d'équipement et **~38 attributs cœur**), soit un dictionnaire couvrant **au moins 30 des 40 champs cibles** ; `WebOlivia` en documente 31 avec leurs `data-testid` ; `bocchilorenzo` 15. **Mais ces dictionnaires datent de 2021, 2025 et 2023** : ce sont des dictionnaires historiques, pas un état courant | `[PROUVÉ]` comptages par script |
| **A4** Couverture géo | Union des TLD couverts par le corpus : **.be .nl .de .at .fr .it .es .lu .ch .pl .cz .hu .ru .bg .se .ua**. `bocchilorenzo` traite explicitement le cas `be` dans son parsing de prix ; `qwillemse` gère le bilinguisme fr/nl du `.be` | `[PROUVÉ]` `countries.py`, `scraper.py`, `multilanguage.json` |
| **A5** Latence | **Non concerné** | par nature |
| **A6** Débit / quota | **Non concerné** ; le corpus documente cependant les régimes de politesse retenus par les auteurs : `time.sleep(1.5)` + 5 workers (`qwillemse`), `DOWNLOAD_DELAY` Scrapy (`vkresch`) | `[PROUVÉ]` code |
| **A7** Stabilité technique | **1 / 5 pour les sélecteurs DOM, 4 / 5 pour les chemins JSON** — c'est ce candidat qui **produit** la mesure de A7 (section précédente) : intersection nulle entre 4 générations, 9 réparations en 12 mois, durée de vie mesurée d'un `data-testid` = 11 mois | `[PROUVÉ]` git log, matrice de grep |
| **A8** Résistance anti-bot | **Le corpus tranche l'axe A8 par comparaison** : 0 dépendance anti-bot chez `qwillemse` (`.be`/`.nl`/`.de`, 23/23 runs verts) contre `seleniumbase` + `scrapy-seleniumbase-cdp` obligatoires chez `nyg` (`.ch`). `WebOlivia` porte un `proxy_manager.py` mais optionnel (rend `None` sans configuration) | `[PROUVÉ]` requirements/pyproject |
| **A9** Effort d'intégration | **0,5 à 1 j-h** pour extraire le dictionnaire de champs et le convertir en table de correspondance `DataProvider` | estimé |
| **A10** Coût de maintenance | **0** en tant que référence figée ; **0,25 j-h / trimestre** si l'on veut suivre le corpus comme capteur de casse (une relecture des commits `fix(crawler)` de `nyg` suffit) | argumenté |
| **A11** Exposition juridique | **1 / 5** — lire du code sous licence MIT et l'analyser n'engage rien. La réutilisation du code MIT exige la conservation de l'avis de licence ; l'exécution du code contre AS24 relèverait de A11 de `C-70a`, pas de ce candidat | argumenté |
| **A12** Autonomie | **Oui** — les clones sont locaux et le corpus est archivable | `[PROUVÉ]` |
| **A13** Plafond de volumétrie | **Non concerné** ; le corpus **documente** le plafond de 4 000, ce qui est son second apport majeur | `[PROUVÉ]` |
| **A14** Fraîcheur atteignable | **Non concerné** pour la donnée. Pour l'information de méthode : **1 jour** — `nyg` a poussé hier, `qwillemse` a tourné hier | `[PROUVÉ]` |

**Verdict** : **VIABLE** dans son rôle — et il a effectivement livré, dans cette phase, les trois
choses que le registre lui demandait : le plafond de 4 000, la carte des champs, et la mesure de A7.
Il n'est **pas** une voie d'alimentation et ne doit pas figurer comme telle au tableau maître.

**Constat de qualité du corpus, à porter au rapport** : sur les **188 dépôts** GitHub dont le nom
contient « autoscout24 » (requête 10), l'écrasante majorité est du bruit. Deux motifs à connaître :
des grappes de dépôts vides de 1 à 20 Ko publiées le même jour par un même compte
(`BoldBastion` x 8, `TrophySecure` x 5, tous poussés le 2026-07-07) — de la **vitrine SEO pour
services de scraping** — et des dépôts d'analyse de données réutilisant un CSV Kaggle sans jamais
scraper. **Trois dépôts seulement** portent du code AS24 réellement exécuté récemment :
`qwillemse/autoscout-analyser`, `nyg/autoscout24-trends` et `nadar/autoscout24`. Le corpus utile
du registre passe donc de 10 dépôts nommés à **3**, et les 7 autres sont datés de 2021 à 2025.

**Inconnues restantes** : la fiabilité de `WebOlivia/autoscout24-scraper` (13 commits le même jour,
`requirements.txt` malformé) n'est pas établie ; ses 29 `data-testid` peuvent être des noms inventés
plutôt que relevés. Non levable sans requête vers AS24 → `[NON VÉRIFIÉ]`.

### C-65 — Documentation tierce non officielle de l'« API AutoScout24 » (PHP, historique)

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **0 EUR** | `[PROUVÉ]` requêtes 20-21 |
| **A2** Coût récurrent | **Non concerné** — aucune donnée n'en découle sans identifiants | par nature |
| **A3** Couverture champs / 40 | **Ressources documentées** : `Vehicles`, `Images`, `ImageOrder`, `Contacts`, `Publications`, `Products`, `FinancingOffers`, `Seals`, `Makes`, `Models`, `References`. `_references.md` (170 lignes) porte le schéma `{Id, Name, ReferenceType, VehicleType, CountryId}` des champs énumérés — **exactement la forme déjà acquise et prouvée par `C-02`** (`/makes`, `/references`, 122 schémas OpenAPI). Apport net sur A3 : **nul** | `[PROUVÉ]` lecture du dépôt |
| **A4** Couverture géo | `CountryId` dans les références → multi-pays, non chiffré | `[DOCUMENTÉ]` |
| **A5** Latence | `[NON VÉRIFIÉ]` — **aucune sonde émise** : l'hôte documenté est `api.autoscout24.com`, interdit par E5 | E5 |
| **A6** Débit / quota | `[NON VÉRIFIÉ]` — aucun quota documenté dans le dépôt | — |
| **A7** Stabilité technique | **1 / 5 en tant que documentation** : dernier commit **2016-05-23**, soit **10 ans et 3 mois** sans mise à jour. Un `_changeLog.md` et un `_apiEvolution.md` existent mais s'arrêtent là | `[PROUVÉ]` git log |
| **A8** Résistance anti-bot | **Non concerné** — API contractuelle avec OAuth2, pas de front web | `[DOCUMENTÉ]` |
| **A9** Effort d'intégration | **Sans objet** : la question ne se pose pas tant que A13 vaut 0 | — |
| **A10** Coût de maintenance | **Non concerné** | — |
| **A11** Exposition juridique | **1 / 5** pour la lecture. Si l'API était accessible : **régime contractuel**, donc le plus favorable du registre — mais réservé aux concessionnaires sous contrat | argumenté |
| **A12** Autonomie | **Non** — dépend entièrement d'un contrat AS24 et, dans le cas `.ch`, d'une **liste blanche d'IP** | `[DOCUMENTÉ]` |
| **A13** Plafond de volumétrie | **Le point qui tue le candidat.** Les verbes de lecture documentés sont explicitement **limités au stock du concessionnaire authentifié** : « *Retrieve all existing vehicles and vehicle details **of a dealer*** », « *Retrieve details of an existing vehicle via its ID* ». **Aucun endpoint de recherche du marché.** Volumétrie adressable pour KYCAR : **0** | `[PROUVÉ]` — grep des intitulés de sections |
| **A14** Fraîcheur atteignable | **Non concerné** (A13 = 0) | — |

**Verdict** : **NON VIABLE** comme voie d'acquisition. La question falsifiable « *cette
documentation décrit des endpoints de lecture absents de la doc officielle actuelle* » reçoit un
verdict nuancé — des endpoints de lecture **existent bien** (`GET /makes`, `GET /references`,
`GET /vehicles`, `GET /seals`), mais les deux premiers sont **déjà acquis et prouvés par `C-02`**
et les autres sont **scopés au stock du concessionnaire**. Le registre notait « non dominé par
`C-02` » : l'instruction **infirme** cette note. `C-65` est, sur A3 et A13, **strictement dominé
par `C-02`**.

**Apport résiduel réel, et il n'est pas nul** : le dépôt conserve la **mécanique OAuth2** de l'API
concessionnaire (`/auth/oauth/v2/authorize`, `/auth/oauth/v2/token`, en-tête `X-AS24-Version: 1.1`,
`Accept-Language`) et l'hôte historique `api.autoscout24.com`. C'est utile à `LOT-K` (`C-48`,
`C-49`) pour formuler une demande de licence en connaissant le vocabulaire de la maison.

**Inconnue restante** : `api.autoscout24.com` répond-il encore ? `[NON VÉRIFIÉ]` — **abstention
délibérée au titre de E5**, à trancher par `LOT-A`/`LOT-B` qui détient déjà
`listing-creation.api.autoscout24.com`.

### C-61 — Extension tierce « AutoScout24 Price History & Tracker » (backend `api.carissimo.io`)

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **0 EUR** — CRX téléchargeable sans compte, `/tracker/configs` public | `[PROUVÉ]` requêtes 15-16 |
| **A2** Coût récurrent | `[NON VÉRIFIÉ]` — aucune grille tarifaire trouvée ; le produit est gratuit au Web Store et adossé à Firebase Auth. **Pas de canal d'achat de données identifié** | — |
| **A3** Couverture champs / 40 | **0 / 40 accessible** : `/tracker/products` et `/tracker/user/products` répondent **`401`**. En revanche le **contrat d'extraction** est public et nomme les chemins : `nxt.props.pageProps.listingDetails` (`__NEXT_DATA__` de la page d'offre) et, en JSON-LD `Product`, `offers.itemOffered.productionDate`, `offers.itemOffered.manufacturer`, `offers.itemOffered.model`, `offers.offeredBy.address.addressLocality`. **Apport indirect élevé, apport direct nul** | `[PROUVÉ]` requêtes 16-18 |
| **A4** Couverture géo | **8 TLD AS24** déclarés : `.at .be .de .es .fr .it .lu .nl`. Pour `.be` : les deux langues, `/fr/offres/*` **et** `/nl/aanbod/*`. Couvre H1 intégralement | `[PROUVÉ]` manifeste + `/tracker/configs` |
| **A5** Latence | `/tracker/configs` : **590 ms**, 35 377 octets. Endpoints de données : `[NON VÉRIFIÉ]` (401) | `[PROUVÉ]` requêtes 16, 19 |
| **A6** Débit / quota | `[NON VÉRIFIÉ]` — derrière authentification | — |
| **A7** Stabilité technique | **3 / 5** — architecture délibérément résiliente (configuration d'extraction **côté serveur**, corrigeable sans republier ; **un seul** sélecteur CSS pour les 8 TLD, en correspondance partielle `[class*="GonePage_gonepage"]`), mais **produit d'un éditeur inconnu à 166 utilisateurs** : la pérennité commerciale est le risque, pas la technique | `[PROUVÉ]` config + requête 26 |
| **A8** Résistance anti-bot | **Non concerné** — collecte dans le navigateur de l'utilisateur, trafic humain par construction | `[PROUVÉ]` manifeste MV3, `content_scripts` |
| **A9** Effort d'intégration | **Sans objet** — pas d'API ouverte à intégrer | — |
| **A10** Coût de maintenance | **Non concerné** | — |
| **A11** Exposition juridique | **2 / 5** pour la lecture du CRX (paquet public, analyse licite) et de `/tracker/configs` (endpoint public sans clé). **5 / 5** si l'on tentait de contourner le `401` — non tenté | argumenté |
| **A12** Autonomie | **Non** — tiers commercial fermé, sans offre de données | `[PROUVÉ]` 401 |
| **A13** Plafond de volumétrie | **La démonstration par l'absurde du candidat `C-62`.** Le backend n'accumule que ce que **166 utilisateurs** visitent, sur **89 détaillants** dont AS24 n'est qu'un parmi d'autres (Albert Heijn, Argos, Bol, Athome…). L'historique de prix AS24 qu'il détient est donc **structurellement microscopique**. Volumétrie exploitable : **0** | `[PROUVÉ]` requêtes 16, 26 |
| **A14** Fraîcheur atteignable | **1 heure** — `cacheTTL: 3600000` ms sur les 8 configs AS24, donc une annonce visitée est rafraîchie au plus une fois par heure | `[PROUVÉ]` requête 19 |

**Verdict** : **NON VIABLE** comme source de données. Les trois questions falsifiables du registre
reçoivent leurs réponses : le backend tiers **existe et est nommé** (`api.carissimo.io`), il
**expose bien un endpoint d'historique** (`GET /tracker/products/{id}/history`), et il **est fermé
par jeton porteur**. Le candidat est donc clos par mesure.

**Mais son apport indirect est le troisième meilleur du lot**, et il faut le consigner explicitement :
`/tracker/configs` est un **contrat d'extraction AS24 vivant, maintenu par un tiers, mis à jour
côté serveur, et public**. Il dit noir sur blanc que la bonne façon d'extraire une annonce AS24 en
2026, sur les 8 TLD, est de lire **JSON-LD `Product` + `__NEXT_DATA__` + `meta`**, et de ne garder
**qu'un** sélecteur CSS, pour la détection d'annonce disparue. C'est une confirmation
architecturale indépendante de `C-70`, et elle nomme un chemin `__NEXT_DATA__` de **page d'offre**
(`props.pageProps.listingDetails`) que le registre n'avait pas.

**Inconnues restantes** : (i) le contenu réel de l'historique de prix — `[NON VÉRIFIÉ]`, exige un
compte (R2) ; (ii) l'identité de l'éditeur de `carissimo.io` — non recherchée, hors mandat ;
(iii) l'existence d'une offre commerciale de données — `[NON VÉRIFIÉ]`.

### C-62 — Collecte côté client par extension propre / crowdsourcing d'opt-in

Le mandat demande de **chiffrer le coût réel**. Voici le calcul, avec ses hypothèses nommées, puis
l'ancrage empirique qui le tranche.

**Calcul de couverture.** Objectif : couvrir 80 % d'un inventaire belge de **N = 107 000** annonces
(estimation de la section 4) sur un cycle d'un mois.

1. Rendement par page vue : une page de résultats `/lst` porte **20 annonces** dans son
   `__NEXT_DATA__` — `[PROUVÉ]` par le `scraper.py` de `C-70`, qui lit exactement cela. Une page
   d'offre porte 1 annonce avec plus de champs.
2. Sous **échantillonnage uniforme**, couvrir une fraction *p* de *N* items distincts demande
   *N* · ln(1/(1−*p*)) tirages. Pour *p* = 0,8 : ln 5 = 1,609, soit **172 000
   observations d'annonces** par cycle.
3. Rendement par utilisateur actif et par mois — **hypothèse comportementale, `[NON VÉRIFIÉ]`** :
   4 sessions de recherche par mois x 10 pages de résultats parcourues = 40 pages x 20 annonces
   = **800 observations / utilisateur / mois**.
4. → **215 utilisateurs actifs mensuels** suffiraient **si le tirage était uniforme**.
5. Il ne l'est pas. La navigation réelle est concentrée sur l'ordre de tri par défaut et sur les
   modèles populaires, et l'ordre par défaut d'AS24 est lui-même influencé par le produit
   publicitaire (`adProduct.tier = T50` relevé en tête de page dans `FINDING-allowed-surface.md`,
   point ouvert P2). Sous une distribution de consultation en loi de puissance, le multiplicateur
   sur la borne uniforme est **de l'ordre de 5 à 10** — **hypothèse argumentée, non mesurée**.
   → **1 100 à 2 150 utilisateurs actifs mensuels**.
6. Et surtout : **la queue de distribution reste structurellement inatteignable**. Un modèle rare
   que personne ne cherche n'est jamais observé, quel que soit le nombre d'utilisateurs. Or c'est
   exactement la queue dont le mode 2 de KYCAR a besoin pour ses distributions fines. **La couverture
   de 80 % n'est donc pas seulement chère : elle n'est probablement pas atteignable par cette voie.**

**Sensibilité.** Si le rendement tombe à 200 observations / utilisateur / mois (usage léger,
plus plausible qu'un usage de professionnel) : borne uniforme **860 MAU**, borne réaliste
**4 300 à 8 600 MAU**.

**Ancrage empirique — et c'est lui qui tranche.** Les deux extensions AS24 réellement publiées,
mesurées aujourd'hui au Chrome Web Store (requêtes 26-27) :

| Extension | Utilisateurs | Notes | Version | Mise à jour |
|---|---|---|---|---|
| `AutoScout24 Price History & Tracker` (`C-61`, backend `carissimo.io`) | **166** | 1 | 1.0.15 | 2026-08-16 |
| `AutoScout24 Price Analyser` (`C-70`, backend Railway) | **41** | 2 | 1.2 | 2026-05-03 |

Le besoin calculé (1 100 à 2 150 MAU) est donc **6,6 fois** le meilleur résultat observé et
**27 fois** l'autre. Et ces deux produits ne sont pas des échecs de conception : le second est
adossé à un modèle XGBoost à MAE de 2 125 EUR, ce qui est un vrai service.

**La comparaison la plus utile du lot** : `qwillemse` a **41 utilisateurs** d'extension et
**808 720 annonces** en base — parce que sa donnée vient d'un scraper serveur, pas de ses
utilisateurs. Le même auteur, le même sujet, la même audience : la collecte serveur bat la
collecte par foule d'un facteur **~20 000** à audience égale.

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **5 USD** (~4,60 EUR) de frais uniques d'inscription développeur Chrome Web Store, jusqu'à 20 extensions, non remboursables. **Plus 5 à 10 j-h** de développement d'une extension MV3 (le manifeste minimal est trivial : `content_scripts` sur les préfixes AS24 + un `fetch` vers notre backend ; le coût réel est l'onboarding, le consentement RGPD et la revue du Store) | `[DOCUMENTÉ]` requête 29 ; effort estimé |
| **A2** Coût récurrent | **0 EUR / 1 000 annonces** en coût marginal d'infrastructure. **Mais le coût réel est l'acquisition d'utilisateurs** : à 1 100 MAU cibles, une rétention de 30 % et un coût par installation de 1 EUR, il faut **~3 700 installations, soit ~3 700 EUR** en une fois, plus le renouvellement du churn. **Estimation chiffrée, hypothèses de CPI et de rétention `[NON VÉRIFIÉ]`** | estimé, hypothèses nommées |
| **A3** Couverture champs / 40 | **Potentiellement le maximum du registre** : un content script lit le `__NEXT_DATA__` **après** exécution du JS, donc l'intégralité de ce que le front reçoit — page de recherche **et** page d'offre. `[PROUVÉ] indirectement` : `carissimo` le fait sur `props.pageProps.listingDetails`, `qwillemse` sur les cartes de recherche. Le décompte exact reste `[NON VÉRIFIÉ]` (E5) | `[PROUVÉ]` par implémentation tierce |
| **A4** Couverture géo | **Tous les TLD** où nos utilisateurs naviguent. Les deux extensions existantes déclarent 8 TLD chacune | `[PROUVÉ]` manifestes |
| **A5** Latence | **Temps réel** au moment de la visite. Durée d'un snapshot BE complet : **jamais** — il n'y a pas de snapshot, seulement un flux d'observations | argumenté |
| **A6** Débit / quota | **20 annonces par page vue**, non pilotable. Débit total = 20 x (pages vues / heure par la base d'utilisateurs). À 1 000 MAU et 800 observations/mois : **~1 100 annonces/h** en moyenne, très irrégulier | calculé |
| **A7** Stabilité technique | **3 / 5** — l'extension dépend du DOM pour son affichage (les 3 commits de réparation d'avril 2026 chez `qwillemse` le montrent) mais pas pour l'extraction si elle lit `__NEXT_DATA__`. S'ajoute un risque propre : **les changements de politique des Web Stores**, hors de notre contrôle | argumenté sur mesure |
| **A8** Résistance anti-bot | **Non concerné** — c'est l'apport unique du candidat, et il est réel. Aucune requête n'est émise par nous ; le trafic est celui d'un humain, avec sa session, ses cookies et son IP résidentielle | `[PROUVÉ]` structurellement |
| **A9** Effort d'intégration | **5 à 10 j-h** : extension MV3, backend d'ingestion, écran de consentement, page de politique de confidentialité, soumission au Store | estimé |
| **A10** Coût de maintenance | **0,5 à 1 j-h / mois** — réparations DOM de l'affichage, mises à jour de politique de Store, support utilisateur. **Plus le marketing en continu**, qui est le vrai poste | estimé |
| **A11** Exposition juridique | **3 / 5**, avec des mécanismes différents des autres candidats : (i) **RGPD comme responsable de traitement** — nous collectons via les navigateurs de personnes identifiées, il faut une base légale, un consentement éclairé et une politique de confidentialité (les deux extensions observées en publient une ; `qwillemse` sert la sienne à `/privacy`) ; (ii) **politique « Limited Use » du Chrome Web Store**, qui exige un objet unique déclaré et interdit la revente de données de navigation — **compatibilité avec un usage analytique interne `[NON VÉRIFIÉ]`, à faire qualifier** ; (iii) le droit *sui generis* d'AS24 reste opposable sur l'**agrégation** que nous constituons, même si chaque consultation individuelle est licite. Ce dernier point est le plus mal éclairé du candidat | argumenté, mécanismes nommés |
| **A12** Autonomie | **Partiel** — nous ne dépendons ni d'AS24 ni d'un fournisseur, mais **de Google et de Mozilla** pour la distribution, et **de nos utilisateurs** pour le débit | argumenté |
| **A13** Plafond de volumétrie | **Piloté par le comportement, non par un plan.** Plafond dur : la queue de distribution est inatteignable. Pour 80 % de BE : **1 100 à 2 150 MAU**, contre **166** observés au mieux sur ce marché | calculé + `[PROUVÉ]` requêtes 26-27 |
| **A14** Fraîcheur atteignable | **Excellente sur ce qui est vu (secondes), nulle sur le reste.** Le délai publication → disponibilité est de quelques secondes pour une annonce consultée et **infini** pour une annonce que personne ne consulte | argumenté |

**Verdict** : **NON VIABLE** comme voie principale ou de secours pour KYCAR. Non parce que la
mécanique est fausse — elle est prouvée, deux tiers l'exploitent — mais parce que **le chiffrage
la disqualifie sur deux plans indépendants** : un besoin de 1 100 à 2 150 utilisateurs actifs contre
166 observés au mieux sur ce marché exact, et une **queue de distribution structurellement
inatteignable** alors que c'est elle dont le mode 2 a besoin. Sous H2 (« usage personnel / interne
d'abord »), le candidat est mort-né : un usage personnel signifie **un** utilisateur.

**Usage résiduel légitime, à ne pas perdre** : une extension d'opt-in reste **le seul instrument du
registre capable de mesurer le biais P2** — comparer ce qu'un humain voit réellement en parcourant
`/lst` avec ce que les pages SEO de `C-14` servent. À un ou deux utilisateurs internes, c'est un
**instrument de calibration**, pas une voie d'alimentation. C'est ainsi qu'il faut l'inscrire au
tableau maître.

**Inconnues restantes** : (i) l'hypothèse comportementale (800 observations/MAU/mois) — `[NON VÉRIFIÉ]`,
et tout le calcul en dépend linéairement ; (ii) le multiplicateur de concentration 5-10x — argumenté,
non mesuré ; (iii) la compatibilité de la politique « Limited Use » du Chrome Web Store avec un
usage analytique — `[NON VÉRIFIÉ]`, à faire qualifier juridiquement ; (iv) la durée de vie médiane
d'une annonce AS24 BE, qui fixe la longueur du cycle de rafraîchissement — `[NON VÉRIFIÉ]` (le
schéma `first_seen`/`last_seen` de `C-70` la contient, et un accès à `cars.db` la donnerait).

### C-60 — Alertes email de recherches sauvegardées, parsées côté boîte mail

Instruit **sans créer de compte** (R2), donc par documentation d'aide et par témoignages
commerciaux de concurrents.

| Axe | Valeur | Preuve |
|---|---|---|
| **A1** Coût d'amorçage | **0 EUR** en licence, mais **exige un compte AutoScout24** → `ACTIONS-COMMANDITAIRE`. Plus 1 à 2 j-h de parseur IMAP | `[PROUVÉ]` requête 30 : « *Vous devrez ensuite créer un compte* » |
| **A2** Coût récurrent | **0 EUR / 1 000 annonces**, **0 EUR / mois** — aucune infrastructure au-delà d'une boîte mail | `[DOCUMENTÉ]` |
| **A3** Couverture champs / 40 | **`[NON VÉRIFIÉ]`** — aucun exemplaire d'email d'alerte AS24 n'a pu être obtenu sans compte. Les archives publiques de newsletters (`milled.com`) sont derrière un mur Cloudflare (`403`, requêtes 32-33) et n'ont pas été contournées. Ce que l'on sait : l'email contient au minimum un titre et un lien ; la présence de prix, année, kilométrage **structurés** est **non prouvée**. Estimation prudente : **4 à 8 / 40** | `[NON VÉRIFIÉ]` |
| **A4** Couverture géo | Tout TLD où une recherche est sauvegardée | `[DOCUMENTÉ]` |
| **A5** Latence | **Mauvaise, et documentée par deux concurrents indépendants qui vendent le contraire.** `marketplacemonitor.com`, verbatim : « *Benachrichtigungen werden verzögert gesendet (oft Stunden später).* » `autoviz.pro`, verbatim : « *Die Benachrichtigung kommt verzögert – bei gefragten Autos zu spät* ». Durée d'un snapshot BE : **infinie** — il n'y a pas de snapshot initial | `[DOCUMENTÉ]` requêtes 36-37 |
| **A6** Débit / quota | `[NON VÉRIFIÉ]` — ni le plafond de recherches sauvegardées par compte, ni un éventuel plafond d'annonces par email ne sont documentés publiquement. La FAQ `.fr` n'en dit rien (requête 30) | `[NON VÉRIFIÉ]` |
| **A7** Stabilité technique | **2 / 5** — un gabarit d'email marketing change sans préavis et sans versionnement, et rien ne permet de détecter la casse autrement qu'en constatant l'absence de données | argumenté |
| **A8** Résistance anti-bot | **Non concerné** — **aucune requête sortante vers AS24**. C'est l'apport unique du candidat, et il est réel : c'est la seule mécanique du registre où AS24 **pousse** la donnée vers nous, sur la base d'un compte qu'il a lui-même consenti | argumenté |
| **A9** Effort d'intégration | **1 à 2 j-h** pour un parseur IMAP + extraction HTML, **sous réserve** que le gabarit porte des champs structurés — non prouvé | estimé |
| **A10** Coût de maintenance | **0,5 à 1 j-h / mois** — réparation du parseur à chaque changement de gabarit, sans préavis ni signal | argumenté |
| **A11** Exposition juridique | **2 / 5** — la donnée est **reçue** au titre d'un service souscrit, ce qui est le régime le plus favorable après `C-86`. Restent (i) les CGU **consommateur** d'AS24, à lire (elles peuvent interdire l'usage commercial ou l'extraction), et (ii) le droit *sui generis* sur l'**agrégation** constituée. Le § 3.3 des `Händler-AGB` ne s'applique pas : ce n'est pas une interrogation automatisée de la base | argumenté |
| **A12** Autonomie | **Non** — AS24 peut supprimer le compte, changer le gabarit, ou plafonner les envois, unilatéralement et sans recours | argumenté |
| **A13** Plafond de volumétrie | **Le défaut structurel : aucun snapshot initial.** Le flux ne porte que les **nouveautés** postérieures à la création de l'alerte. Il faudrait N recherches sauvegardées partitionnant le marché — **le plafond de N est `[NON VÉRIFIÉ]`** — et attendre le renouvellement complet du stock (plusieurs mois) pour approcher l'inventaire. En régime : le **flux d'entrée** du marché belge, pas son stock | argumenté |
| **A14** Fraîcheur atteignable | **Heures**, dégradée par un défaut mesuré : `marketplacemonitor.com`, verbatim : « *You frequently receive updates for already-sold or outdated listings.* » Donc **fraîcheur médiocre ET précision médiocre** | `[DOCUMENTÉ]` requête 36 |

**Verdict** : **NON VIABLE** comme voie d'acquisition, **et pas seulement à cause de R2**. Trois
défauts s'additionnent, dont deux sont rédhibitoires indépendamment du compte : **aucun snapshot
initial** (A13), **format non prouvé** (A3 = `[NON VÉRIFIÉ]`), et **latence de plusieurs heures avec
des annonces déjà vendues** (A5, A14) — ce dernier point documenté par deux concurrents qui vivent
de le corriger. Le marché a d'ailleurs chiffré la valeur du défaut : `autoviz.pro` vend la
correction « *ab 9 EUR/Monat* ».

**Apport résiduel** : le candidat conserve une utilité de **détection de flux** — savoir *qu'une*
annonce est apparue, sans en lire le contenu — et il est le seul du registre à ne produire aucune
requête sortante. À conserver au tableau maître comme **capteur de fraîcheur**, pas comme source.

**Inconnues restantes**, toutes bloquées par R2 et à porter en `ACTIONS-COMMANDITAIRE` : (i) le
format exact de l'email et le nombre de champs structurés ; (ii) le plafond de recherches
sauvegardées par compte ; (iii) l'existence réelle d'intervalles configurables (1 h / 12 h / 24 h /
7 j annoncés par une source secondaire non primaire, **non confirmés** par la FAQ `.fr`) ;
(iv) les CGU consommateur applicables.

---

## Questions falsifiables

### Les 5 questions prioritaires du mandat de lot

| # | Question | Verdict | Preuve |
|---|---|---|---|
| 1 | « Le plafond est **4 000** (et non 400) et la partition par bandes d'années le franchit effectivement. » | **VRAIE** | `config.py` verbatim : « *bypass AutoScout24's per-search result cap (200 pages = 4,000 listings per query)* » ; `main.py` : `PAGES_PER_BAND = 200` avec « *AutoScout24 caps at 200 pages per search query […] this is a hard ceiling* ». Le franchissement est prouvé par le résultat : **808 720 annonces** en base (requête 3) alors que 4 000 est le plafond par requête, avec **476 requêtes de recherche par pays**. Réserve : preuve **par implémentation tierce**, non mesurée par nous. |
| 2 | « Le pipeline `C-70` n'utilise ni proxy ni unblocking, donc Akamai ne bloque pas ce chemin d'accès. » | **VRAIE**, avec une réserve nommée | Absence prouvée : `requirements.txt` ne contient que `requests` et `beautifulsoup4` côté collecte, `HEADERS = {"User-Agent": "Mozilla/5.0"}`, aucune rotation d'IP, runners GitHub/Azure publics. Non-blocage prouvé : **23 runs, 10 derniers `success`, dernier le 2026-09-06**, `scrape (BE)` en 39,7 min (requêtes 6-7). **Réserve** : prouvé à **5 workers avec 1,5 s de pause, le dimanche à 02:00 UTC** ; le seuil de débit déclenchant Akamai reste `[NON VÉRIFIÉ]`, et le chemin `/lst` nous est interdit par `robots.txt`. |
| 3 | « `cars.db` (730 000 annonces) est téléchargeable, donc un dataset gratuit prêt à l'emploi existe. » | **FAUSSE** en l'état, **VRAIE sous une action de commanditaire** | Trois voies mesurées : `GET /download/cars.db` exige un `Bearer` non publié (`api.py` l. 862-865) ; `cars.db` est dans `.gitignore` ; l'artefact GitHub `cars-BE` (8,8 Mo, non expiré) renvoie **`401 Requires authentication`** en anonyme (requête 9). Un compte GitHub gratuit suffirait à le télécharger — R2 interdit de le faire ici. |
| 4 | « Le backend de l'extension `C-61` expose un historique de prix interrogeable. » | **VRAIE pour l'existence, FAUSSE pour l'interrogeabilité** | Backend identifié et nommé : `https://api.carissimo.io` (manifeste MV3, `host_permissions`). Endpoint d'historique identifié dans `js/dashboard.js` : `` `/tracker/products/${e}/history` ``. Mais `/tracker/products` et `/tracker/user/products` renvoient **`401`** avec `{"hint":"Include Authorization: Bearer <token> header"}` (requêtes 17-18). |
| 5 | « Les sélecteurs des scrapers open source ont changé au moins deux fois en 12 mois. » | **VRAIE**, et largement dépassée | Sur `nyg/autoscout24-trends`, seul crawler AS24 à historique de production continu : **9 commits de réparation d'extraction et 2 changements de paradigme complets** sur 12 mois glissants (2025-09 → 2026-09) ; **12 réparations et 3 paradigmes sur 15,8 mois**. Le plus gros commit (#70, 2026-04-04) modifie **178 lignes** sur un extracteur de ~200. En complément : **intersection nulle** entre les jeux de sélecteurs DOM de 4 implémentations indépendantes (2021, 2023, 2025, 2026). |

### Questions des fiches de candidats

| Candidat | Question | Verdict | Preuve |
|---|---|---|---|
| C-70 | « Le dépôt tourne encore : dernier run GitHub Actions vert de moins de 30 jours. » | **VRAIE** — dernier run vert **il y a 1 jour** (2026-09-06) | requête 6 |
| C-70 | « L'API Railway expose un endpoint de lecture des annonces stockées, et pas seulement la prédiction de prix. » | **VRAIE** | `POST /similar-cars` rend **30 annonces réelles** avec `id`, `price`, `year`, `mileage`, `fuel`, `location`, `url` + `total=302` ; `POST /market-trend` rend une **série agrégée** `{month, avg_price, count}` ; `GET /stats` rend `listing_count=808720`. Tous **sans clé** (requêtes 3-5) |
| C-70 | « Le `cars.db` est publié en artefact téléchargeable. » | **Publié : VRAIE. Téléchargeable : FAUSSE** (401 anonyme) | requêtes 8-9 |
| C-64 | « Au moins un de ces dépôts a un commit de moins de 6 mois. » | **VRAIE** — `nyg` : hier ; `qwillemse` : 2026-08-05 ; `nadar` : 2025-07-06 | requêtes 10-14, 21 |
| C-64 | « Au moins un couvre explicitement le TLD `.be` et le bilinguisme fr/nl. » | **VRAIE** | `countries.py` de `C-70` : `"BE": {"domain":"www.autoscout24.be", "cy": None, "search_prefix":"/nl", "power_labels":["Vermogen kW (PK)","Puissance kW (CH)"], "lang":"Dutch/French"}` ; `FUEL_MAP` contient les libellés BE **et** FR ; `carissimo` déclare `/fr/offres/*` **et** `/nl/aanbod/*` |
| C-64 | « Leur code révèle des endpoints ou paramètres d'URL non documentés dans les blogs commerciaux. » | **VRAIE** | Trois révélations non triviales : (i) `cy` **casse** la recherche sur `.be` (`cy param causes 0 results`) ; (ii) `.be` exige un **préfixe de langue** dans l'URL de recherche, contrairement aux 7 autres TLD ; (iii) au-delà de la dernière page AS24 **reboucle sur la page 1** au lieu de rendre une page vide, et la terminaison passe par `props.pageProps.numberOfPages`. S'y ajoute le paramètre `damaged_listing=exclude`, non documenté dans `REF-filters.md` |
| C-65 | « Cette documentation décrit des endpoints de **lecture** absents de la doc officielle actuelle. » | **FAUSSE au sens utile** | Des verbes de lecture existent, mais `GET /makes` et `GET /references` sont **déjà acquis et prouvés par `C-02`**, et les autres sont **scopés au concessionnaire authentifié** : « *Retrieve all existing vehicles and vehicle details of a dealer* ». Aucun endpoint de recherche du marché |
| C-65 | « Certains de ces endpoints historiques répondent encore. » | **NON TRANCHÉE** | **Abstention délibérée** : l'hôte est `api.autoscout24.com`, interdit par E5. À trancher par `LOT-A`/`LOT-B` |
| C-65 | « Elle fournit le dictionnaire de champs canonique AS24, utile pour l'axe A3. » | **FAUSSE** | `_references.md` porte le schéma `{Id, Name, ReferenceType, VehicleType, CountryId}` — soit exactement la forme des 122 schémas OpenAPI déjà prouvés par `C-02`. Apport net **nul** |
| C-61 | « L'extension appelle un backend tiers, identifiable dans son code source. » | **VRAIE** | `api.carissimo.io` en `host_permissions` et en `connect-src` de la CSP (requête 15) |
| C-61 | « Le code de l'extension révèle les endpoints AS24 réellement utilisés côté client. » | **FAUSSE** | L'extension n'appelle **aucun** endpoint AS24 : elle lit la page déjà chargée. Ce qu'elle révèle est autre chose et de plus grande valeur : le **contrat d'extraction** (`ld` + `__NEXT_DATA__` + `meta`, chemin `props.pageProps.listingDetails`) |
| C-62 | « `__NEXT_DATA__` est lisible depuis un content script sans privilège particulier. » | **VRAIE** | Prouvé par implémentation tierce : `carissimo` déclare `scriptParsers.nxt = {"id":"__NEXT_DATA__","variable":"__NEXT_DATA__"}` et son manifeste ne demande que `activeTab`, `storage`, `scripting`, `webNavigation` — **aucune permission spéciale**. `qwillemse` fait de même avec un `content_scripts` MV3 standard |
| C-62 | « Le nombre d'utilisateurs nécessaire pour couvrir 80 % de l'inventaire BE sur un mois est atteignable. » | **FAUSSE** | Besoin calculé **1 100 à 2 150 MAU** (borne uniforme 215, corrigée d'un facteur de concentration 5-10x) contre **166 et 41 utilisateurs** mesurés sur les deux seules extensions AS24 publiées (requêtes 26-27). Facteur d'écart **6,6x à 27x**. Et la queue de distribution reste inatteignable par construction |
| C-62 | « Le mécanisme est compatible avec les politiques des Chrome/Firefox Web Stores. » | **NON TRANCHÉE** | Deux extensions collectant sur AS24 sont **publiées et à jour** au Chrome Web Store (2026-08-16 et 2026-05-03), ce qui prouve la publiabilité du mécanisme. Mais la compatibilité de la politique « **Limited Use** » avec un usage **analytique agrégé** n'a pas été qualifiée — `[NON VÉRIFIÉ]`, question juridique |
| C-60 | « L'email d'alerte contient les champs structurés (prix, année, km, URL) et pas seulement un lien. » | **NON TRANCHÉE** | Aucun exemplaire obtenable sans compte (R2). Les archives publiques de newsletters sont derrière Cloudflare (`403`, requêtes 32-33), non contournées |
| C-60 | « Le nombre de recherches sauvegardées par compte est suffisant pour partitionner le marché BE sans trou. » | **NON TRANCHÉE** | Aucun plafond documenté publiquement ; la FAQ `.fr` n'en dit rien (requête 30) |
| C-60 | « Aucune limite de fréquence d'envoi ne tronque le flux les jours de forte activité. » | **NON TRANCHÉE, et le signal disponible est défavorable** | Deux concurrents indépendants documentent un retard de plusieurs heures et des annonces déjà vendues : « *Benachrichtigungen werden verzögert gesendet (oft Stunden später)* », « *You frequently receive updates for already-sold or outdated listings* » (requêtes 36-37) |

### Une question falsifiable **ajoutée par ce lot**

| Question | Verdict | Preuve |
|---|---|---|
| « Le mécanisme `__NEXT_DATA__` sur lequel repose la voie prioritaire `C-14` a déjà été retiré par une entité du groupe AutoScout24. » | **VRAIE pour `autoscout24.ch`**, et c'est le risque A7 dimensionnant | `nyg/autoscout24-trends` lit du **flight data / React Server Components** via `njsparser` sur `.ch` depuis le 2026-04-04, après avoir lu du DOM puis du JSON. Au même mois, `qwillemse` et `carissimo` lisent toujours `__NEXT_DATA__` sur `.be`, `.nl`, `.de`. `.ch` est opéré par SMG et non par AS24 GmbH, ce qui affaiblit l'inférence — mais la migration a coûté à ce tiers la réécriture d'environ 90 % de son extracteur, ce qui chiffre le coût de l'événement s'il survient sur `.be` |

---

## ACTIONS-COMMANDITAIRE

Classées par rapport bénéfice / effort. Les trois premières sont les plus rentables du lot.

| # | Action | Qui | Effort | Coût | Ce que ça débloque |
|---|---|---|---|---|---|
| **E-1** | **Télécharger les artefacts `cars-BE`, `cars-NL`, `cars-DE`** du dernier run de `qwillemse/autoscout-analyser` avec un jeton GitHub personnel (`GET /repos/qwillemse/autoscout-analyser/actions/artifacts/{id}/zip`, `Authorization: Bearer <PAT>`). **Les artefacts expirent le 2026-09-13** — rétention 7 jours, renouvelée chaque dimanche. Les identifiants du run 34017630377 sont `9984965085` (BE), `9985647524` (NL), `9987167729` (DE) | commanditaire (compte GitHub gratuit) | **15 min** | **0 EUR** | Un SQLite de **~107 000 annonces belges** et **808 720 au total**, 20 champs + table `price_history`, pour amorcer et **calibrer** le moteur d'agrégation du chantier 2 sans aucune requête vers AS24. Donne aussi, par `first_seen`/`last_seen`, la **durée de vie médiane d'une annonce BE** — inconnue qui bloque `C-62`, `C-60` et le dimensionnement de la fraîcheur |
| **E-2** | **Écrire au mainteneur** de `qwillemse/autoscout-analyser` (`quinten.willemse12`, identifié comme éditeur au Chrome Web Store) : demander l'accès à `cars.db`, et lui demander s'il a **jamais** été bloqué par AS24 — statuts 403/429, cookies `_abck`, runs échoués antérieurs aux 10 que l'API expose | commanditaire | **30 min** | 0 EUR | Le seul témoignage direct disponible sur le comportement d'Akamai dans la durée, y compris les échecs que la fenêtre de 10 runs de l'API ne montre pas. C'est la voie honnête et la plus fiable pour obtenir la base |
| **E-3** | **Faire qualifier juridiquement** deux points nommés : (i) la portée du **droit *sui generis*** (dir. 96/9/CE art. 7) sur une base d'agrégats dérivée d'annonces AS24, y compris quand chaque observation individuelle est licite — question qui conditionne `C-62` **et** `C-14` ; (ii) la compatibilité de la politique « **Limited Use** » du Chrome Web Store avec un usage analytique interne | juriste | 1 à 2 j | honoraires | Le verdict A11 de la moitié du registre. Sans cela, `C-70a` reste bloqué sur une inconnue juridique alors qu'il est techniquement prouvé |
| **E-4** | **Créer un compte AutoScout24 consommateur**, sauvegarder 2 ou 3 recherches sur le périmètre BE, et **transmettre 3 emails d'alerte bruts** (source HTML complète, en-têtes inclus), plus une capture de l'écran de configuration des intervalles et du plafond de recherches sauvegardées | commanditaire | **1 h**, puis 48 h d'attente | 0 EUR | Lève les trois `[NON VÉRIFIÉ]` de `C-60` d'un coup : format et nombre de champs structurés (A3), intervalles réels (A14), plafond de recherches (A13). Sans cela `C-60` reste au tableau maître avec 2 cellules non renseignées |
| **E-5** | **Vérifier si `api.autoscout24.com` répond encore** sur `GET /makes` avec l'en-tête `X-AS24-Version: 1.1` — hôte interdit à ce lot par E5, et déjà partiellement acquis par `LOT-A` sur `listing-creation.api.autoscout24.com` | `LOT-A` / `LOT-B`, ou commanditaire | 5 min | 0 EUR | Clôt `C-65` définitivement |
| **E-6** | **Instruire deux fournisseurs découverts par ce lot et absents du registre** : `autoviz.pro` (« *5 Tage kostenlos, danach ab 9 EUR/Monat* », 20+ places de marché, notifications temps réel) et `marketplacemonitor.com`. Les convertir en EUR / 1 000 annonces et EUR / mois BE quotidien (R5) | `LOT-F` / `LOT-G` | 1 h | 0 EUR | Deux points de mesure A2 supplémentaires, sur des acteurs qui **surveillent AS24 en temps réel aujourd'hui** |
| **E-7** | **Reverser `nadar/autoscout24` dans `C-04`** (`LOT-B`) : client PHP maintenu (2025-07-06) de l'API **HCI** `https://www.autoscout24.ch/api/hci/v3/json/`, avec `VehicleQuery` paginé. Exige `cuid` + `memberid` obtenus « *from the AutoScout24 Support* » **et une liste blanche d'IP** | `LOT-B` | 30 min | 0 EUR | Une API de **lecture** du groupe, documentée par un tiers, avec son régime d'accès nommé |
| **E-8** | **Mettre `nyg/autoscout24-trends` sous surveillance** comme capteur de casse : ses commits `fix(crawler)` datent les changements de structure du front AS24 mieux que n'importe quelle sonde que nous pourrions faire, et gratuitement | équipe technique | 15 min / trimestre | 0 EUR | Un indicateur avancé de A7, et l'alerte précoce si `.be` migre vers l'App Router comme `.ch` l'a fait |

**Ce que le commanditaire ne doit PAS faire, et pourquoi c'est écrit ici** : appeler en boucle
`POST /similar-cars` sur `web-production-870f.up.railway.app` pour reconstituer la base. C'est
techniquement possible (30 lignes/appel, 30 appels/min, aucune clé), mais cela ferait porter par un
projet bénévole le coût d'infrastructure et les crédits OpenAI d'un tiers, sur un volume Railway
déjà **saturé à 54 %**, et n'effacerait aucune des questions A11. L'action `E-2` obtient la même
donnée en le demandant.

---

## Conformité

### E5 — surface autorisée

**Zéro requête vers `www.autoscout24.be`. Zéro requête vers `autoscout24.com` (y compris
`api.autoscout24.com`).** Ce lot n'en avait pas besoin : il porte sur du code tiers, des dépôts
Git, un paquet CRX et des API tierces déjà en ligne.

**Une seule requête a touché un domaine AutoScout24** : la requête 30, vers
`https://www.autoscout24.fr/informer/conseils/avant-l-achat/search-faq/`. Justification en trois
points, à valider par l'auditeur de la phase 1.5 :
1. Le domaine est `www.autoscout24.**fr**`, hors des deux domaines nommés par E5.
2. Le chemin `/informer/conseils/…` correspond, sur le TLD belge, au préfixe `Allow: /fr/informer/`
   du groupe `ClaudeBot` — c'est-à-dire à une **surface explicitement autorisée** dans le seul
   `robots.txt` que nous ayons lu.
3. Un précédent existe et a été accepté : la phase 1.3 a lu
   `https://www.autoscout24.de/unternehmen/haendler-agb/` sous le même raisonnement.

Le `robots.txt` de `.fr` n'a **pas** été lu avant cette requête : c'est un manquement de rigueur,
et je le signale plutôt que de le taire. Il est réparable en 1 requête et figure au mandat résiduel
de `C-52` (`LOT-A`).

Par ailleurs, `nadar/autoscout24` nomme l'hôte `www.autoscout24.ch/api/hci/v3/json/` : **aucune
sonde n'a été émise** vers lui, l'accès étant de toute façon sur liste blanche d'IP.

### E1 / R2 — aucun compte, aucun credential

**Aucun compte créé. Aucun credential saisi. Aucun jeton fourni.** Trois murs
d'authentification ont été rencontrés et **respectés sans tentative de contournement** :

| Mur | Réponse | Action prise |
|---|---|---|
| Artefact GitHub `cars-BE` | `401 Requires authentication` | Consigné, reversé en `ACTIONS-COMMANDITAIRE` E-1 |
| `api.carissimo.io/tracker/products` | `401` + `hint: Include Authorization: Bearer` | Consigné, candidat clos par mesure |
| `GET /download/cars.db` (Railway) | `403` selon le code lu ; **non sollicité** | Non appelé — le code montre que le jeton est obligatoire |

Deux murs de **consentement** ont aussi été rencontrés et non franchis : `consent.google.com`
(requêtes 22-25) — aucun consentement n'a été accordé, l'information a été obtenue par l'URL
legacy `chrome.google.com/webstore/detail/` qui n'en demande pas — et le mur Cloudflare de
`milled.com` (requêtes 32-33), abandonné sans tentative de contournement.

### R3 — pas d'extraction de masse

**37 requêtes au total**, plafond de 60. Toutes unitaires. Répartition :

| Domaine | Requêtes | Nature |
|---|---|---|
| `github.com` (via `git clone`) | **7** | clones de dépôts publics : `qwillemse/autoscout-analyser`, `WebOlivia/autoscout24-scraper`, `vkresch/autoscout24-crawler`, `bocchilorenzo/autoscout24_bot`, `nyg/autoscout24-trends`, `jeroendesloovere/autoscout24-php-api-documentation`, `nadar/autoscout24` |
| `api.github.com` | **5** | 1 recherche de dépôts, runs du workflow, jobs, artefacts, 1 tentative de téléchargement (401) |
| `web-production-870f.up.railway.app` | **4** | `/health`, `/stats`, `/market-trend`, `/similar-cars` — **une requête par endpoint**, aucune pagination, aucune boucle |
| `api.carissimo.io` | **4** | `/tracker/configs` x2, `/tracker/products`, `/tracker/user/products` |
| `chromewebstore.google.com` | **4** | 4 x `302` vers consent, 0 octet reçu |
| `chrome.google.com` | **2** | 2 fiches d'extension |
| `milled.com` | **2** | 2 x `403` Cloudflare |
| `clients2.google.com` | **1** | téléchargement du CRX `C-61` |
| `www.autoscout24.fr` | **1** | FAQ de recherche (justifiée ci-dessus) |
| `apps.apple.com` | **1** | fiche de l'app AS24 |
| `marketplacemonitor.com` | **1** | page de comparaison |
| `autoviz.pro` | **1** | page de comparaison |
| `WebSearch` (index tiers) | **4** | 4 recherches |
| **`www.autoscout24.be`** | **0** | — |
| **`autoscout24.com`** | **0** | — |
| **Total** | **37 / 60** | |

Deux extractions étaient **techniquement à portée et n'ont pas été faites** : l'énumération de
`POST /similar-cars` sur marque x modèle x année (qui aurait pu rendre plusieurs milliers
d'annonces belges à 30 par appel), et le balayage des 188 dépôts GitHub trouvés. La première est
exclue par R3, la seconde par le rendement (le corpus utile est de 3 dépôts, établi par la
requête 10).

### R1 — taux de cellules non renseignées

| Candidat | Cellules `[NON VÉRIFIÉ]` sur 14 | Taux |
|---|---|---|
| `C-70` (a et b confondus) | 0 pleines — 3 réserves partielles nommées (A3 payload `/lst`, A6 seuil Akamai, A13 hypothèse de proportionnalité) | **0 %** |
| `C-64` | 0 | **0 %** |
| `C-65` | 2 (A5, A6) | **14 %** |
| `C-61` | 2 (A2, A6) | **14 %** |
| `C-62` | 0 pleines — 4 inconnues nommées avec leur sensibilité | **0 %** |
| `C-60` | 2 (A3, A6) | **14 %** |
| **Global** | **6 / 84** | **7,1 %** |

Sous le seuil de 25 % du critère S3 de la phase 1.4. Les 6 cellules non renseignées se répartissent
en deux causes uniques et nommées : **E5** (2 cellules de `C-65` — l'hôte `api.autoscout24.com` est
interdit) et **R2** (4 cellules de `C-61` et `C-60` — derrière authentification). Aucune ne tient à
un manque d'effort.

### R5 — unités comparables

Les deux unités imposées sont portées pour chaque candidat qui produit de la donnée :

| Candidat | EUR / 1 000 annonces | EUR / mois, rafraîchissement quotidien BE |
|---|---|---|
| `C-70a` (méthode) | **0** | **0** — 39,7 min/jour = ~1 190 min/mois, sous le palier gratuit GitHub Actions de 2 000 min/mois |
| `C-70b` (API du tiers) | **0** | **0**, mais A12 = non |
| `C-64` | non concerné | non concerné |
| `C-65` | non concerné (A13 = 0) | non concerné |
| `C-61` | inaccessible (401) | inaccessible |
| `C-62` | **0** en marginal, **~3 700 EUR en une fois** en acquisition d'utilisateurs pour atteindre 1 100 MAU (hypothèses CPI 1 EUR et rétention 30 %, `[NON VÉRIFIÉ]`) | **0** en infrastructure, plus le renouvellement du churn |
| `C-60` | **0** | **0** — mais aucun snapshot initial, donc l'unité est trompeuse et il faut la lire avec A13 |

### R6 — pas d'auto-audit

Aucune conclusion n'est portée sur un candidat d'un autre lot. Les découvertes latérales
(`nadar/autoscout24`, `autoviz.pro`, `marketplacemonitor.com`, `api.autoscout24.com`) sont
**transmises** à `LOT-B`, `LOT-F`, `LOT-G` et `LOT-A` sans verdict, en section
`ACTIONS-COMMANDITAIRE`.

### Reproduction

Les commandes du journal de preuve sont rejouables en l'état. Les cinq clones et le CRX ont été
placés dans le scratchpad de session
(`…\aaa13521-f65c-472a-8c2b-485ba2c86b02\scratchpad\lotE\`) et **aucun n'a été commité** au dépôt.
Point d'attention pour l'auditeur : les valeurs de `/stats`, `/health` et `/market-trend` **bougent
chaque semaine** (le run du dimanche recharge la base) ; les artefacts GitHub du run 34017630377
**expirent le 2026-09-13**. Un rejeu postérieur donnera des chiffres différents, ce qui est le
comportement attendu et non un écart de reproductibilité — comparer les **ordres de grandeur** et
la **conclusion structurelle**, pas les valeurs exactes.
