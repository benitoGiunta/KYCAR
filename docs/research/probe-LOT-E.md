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
