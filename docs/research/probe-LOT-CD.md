# probe-LOT-CD — Payloads du front Next.js (LOT-C) et endpoints internes nommés par le robots.txt (LOT-D)

**Agent** : `probe-CD` (phase 1.4 du `PLAN-1-data-acquisition.md`) — Sonnet, effort medium-high.
**Candidats instruits** : LOT-C = `C-06`, `C-07`, `C-08`, `C-66` *(4)* ; LOT-D = `C-09`, `C-10`,
`C-11`, `C-12`, `C-13` *(5)*.
**Date d'exécution** : 2026-09-07.

**Nature du mandat** : les deux lots sont marqués **« documentaire, aucune sonde »** dans
`candidates-final.md`. Ce n'est pas une préférence méthodologique mais une obligation : le
`robots.txt` d'AutoScout24 place `/lst?` en `Disallow` pour tous les agents (`C-06`), ne couvre les
chemins d'offre par aucune directive `Allow` (`C-07`, `C-08`), et place les cinq endpoints de LOT-D
en `Disallow` explicite pour le groupe `User-agent: *` — pas seulement pour les robots d'IA. Aucune
sonde n'est donc exécutée contre AutoScout24 dans ce document, sur **aucun** TLD du groupe (pas
seulement `.be`/`.com` : la prudence est étendue à `.de`, `.ch`, `.at`, `.fr`, `.nl`, `.lu` par
cohérence avec le mandat « documentaire strict » du registre gelé). Tout ce qui suit vient de
sources tierces : dépôts de code, articles techniques de fournisseurs de scraping, documentation
d'API commerciales qui reflètent ces endpoints, et les probes soeurs déjà publiées du même plan
(`probe-LOT-A.md`, `probe-LOT-B.md`), qui ont légitimement sondé la surface autorisée ou des hôtes
hors `www` ne servant aucun `robots.txt`.

**Convention de preuve (R4)** : `PROUVÉ` = établi par une exécution réelle contre AutoScout24 ou un
hôte AS24, journalisée dans un document de ce plan (typiquement `probe-LOT-A.md` ou
`probe-LOT-B.md`, jamais ce document). `DOCUMENTÉ` = affirmé par une source tierce identifiée,
non exécuté par nous. `[NON VÉRIFIÉ]` = ni l'un ni l'autre. **Aucune cellule de ce document ne peut
porter `PROUVÉ` sur la base d'une action de cet agent**, puisque cet agent n'exécute aucune requête
vers AutoScout24 — seul un renvoi vers une preuve d'un autre lot peut porter `PROUVÉ`.

---

## Attestation de conformité

- **Requêtes vers `autoscout24.be` ou `autoscout24.com` émises par cet agent : 0.**
- **Requêtes vers tout autre domaine `autoscout24.*` émises par cet agent : 0.**
- **Requêtes tierces émises par cet agent (R3, plafond 50) : voir compteur ci-dessous, mis à jour à
  chaque ajout.**
- Compteur courant : **17 / 50** (mis à jour au fil du document — voir Journal de preuve).

---

## Journal de preuve

`WebFetch` = lecture ciblée d'une URL tierce précise. `WebSearch` = requête à un moteur de
recherche (tiers), dont le résultat peut inclure des extraits indexés d'une page — cette pratique
est celle déjà validée par `candidates-final.md` (ex. `G2-K10`, `O-1`) : un extrait indexé est une
preuve `DOCUMENTÉ`, jamais `PROUVÉ`. Aucune ligne ci-dessous ne constitue une requête vers un
domaine `autoscout24.*` : les URL AS24 qui apparaissent sont des **résultats renvoyés** par le
moteur de recherche, jamais des cibles que cet agent a lui-même appelées.

| # | Horodatage | Source consultée | Type | Résultat en une phrase |
|---|---|---|---|---|
| 1 | 2026-09-07 | `WebFetch` `scrapfly.io/blog/posts/how-to-scrape-autoscout24` | tiers (fournisseur scraping) | `__NEXT_DATA__` documenté (255 Ko `/lst`, 134 Ko détail) ; plafond annoncé **200 pages × 20 = 4 000 annonces** |
| 2 | 2026-09-07 | `WebFetch` `roundproxies.com/blog/scrape-autoscout24/` | tiers (fournisseur scraping) | Même mécanique `__NEXT_DATA__` confirmée ; plafond annoncé **20 pages × 20 = 400 annonces** — **contredit la source n°1** |
| 3 | 2026-09-07 | `WebFetch` `scrape.do/blog/autoscout24-scraping/` | tiers (fournisseur scraping) | Aucune mention de `__NEXT_DATA__` ni de pagination chiffrée ; confirme la présence d'Akamai (fingerprinting, JS challenges) sans détail technique |
| 4 | 2026-09-07 | `WebFetch` `apify.com/memo23/autoscout24-scraper` | tiers (marketplace de scrapers) | Schéma détaillé de la page d'annonce (`prices.public.evaluation.category`, `seller.type`, etc.) ; **révèle que cet acteur utilise « l'API GraphQL mobile interne » avec repli sur `__NEXT_DATA__`** |
| 5 | 2026-09-07 | `WebFetch` `docs.anysite.io/api-reference/autoscout24/autoscout24dealerslistings` | tiers (API commerciale) | Primitive « stock par concessionnaire » confirmée commercialement : paramètres `dealer`, `count`, `sort` ; aucun nom d'endpoint AS24 sous-jacent révélé |
| 6 | 2026-09-07 | `WebSearch` `"listing-search-api/graphql" autoscout24` | moteur de recherche | Aucune source ne documente ce chemin par son nom exact ; renvoie vers l'API mobile interne et les scrapers déjà connus |
| 7 | 2026-09-07 | `WebSearch` `"ocs/api/graphql" OR "ocs.api.autoscout24"` | moteur de recherche | Aucune source ne documente ni ne décode « OCS » |
| 8 | 2026-09-07 | `WebSearch` `"react-listelements" OR "classified-list" autoscout24` | moteur de recherche | Confirme l'existence réelle et l'**indexation** de `autoscout24.com/classified-list/react-listelements/en?isSeoListPage=false&toguru=…` et de l'équivalent `.nl` — route vivante, paramètre `toguru` (feature-flag maison, cf. `@autoscout24/toguru-client`) |
| 9 | 2026-09-07 | `WebSearch` `"search-subscriptions" OR "new-results-count" autoscout24 saved search alert` | moteur de recherche | Confirme l'existence fonctionnelle des recherches sauvegardées (`autoscout24.de/search-subscriptions/de/`) ; aucun détail technique sur `new-results-count` |
| 10 | 2026-09-07 | `WebSearch` `"vip-showroom" OR "as24-search-funnel" autoscout24` | moteur de recherche | Révèle que « VIP Showroom » est un **produit publicitaire payant** de placement géographique/marque pour concessionnaires (90 zones postales, exclusivité marque×zone), pas nécessairement un accès brut au stock complet |
| 11 | 2026-09-07 | `WebSearch` `OCS meaning autoscout24 service` | moteur de recherche | Aucune source ne décode l'acronyme |
| 12 | 2026-09-07 | `WebSearch` `autoscout24 tech stack GraphQL federation microservices` | moteur de recherche | Résumé indexé de `tech.autoscout24.com` (non consulté directement) : architecture en microservices Scala/AWS avec un **« backend for frontend » qui expose une API GraphQL et agrège les services aval** — corrobore la nature de `C-09` |
| 13 | 2026-09-07 | `WebFetch` `medium.com/@martin.lechner/what-i-learned-in-my-first-year-at-autoscout24-…` | tiers (blog personnel) | **HTTP 403** — inatteignable, aucune donnée obtenue |
| 14 | 2026-09-07 | `WebSearch` `OCS team OR Offer Content Service OR Order Communication autoscout24 job` | moteur de recherche | Stérile — aucune offre d'emploi ni mention ne décode « OCS » |
| 15 | 2026-09-07 | `WebSearch` `autoscout24 "_next/data" buildId json route` | moteur de recherche | Aucune source ne confirme l'existence de cette route pour AS24 spécifiquement (seule la mécanique générique Next.js est documentée) |
| 16 | 2026-09-07 | `WebSearch` `autoscout24 GraphQL persisted query sha256Hash query hash scraper` | moteur de recherche | Confirme génériquement l'usage de hachages de requêtes persistées côté scraping GraphQL ; aucun détail spécifique à AS24 au-delà de ce que `probe-LOT-B.md` a déjà établi par analyse d'APK |
| 17 | 2026-09-07 | `WebFetch` `crawlee.dev/blog/graphql-persisted-query` | tiers (éditeur d'outil de crawling) | Méthodologie générique de reverse engineering des requêtes persistées (Zillow/Expedia en exemple) ; **aucune mention d'AutoScout24** |

**Sources locales consultées (ne comptent pas dans le quota R3, ce sont des documents du même
plan, déjà produits par d'autres agents sur la base de leurs propres requêtes déclarées)** :
`docs/research/candidates-v1.md`, `docs/research/candidates-v2.md`, `docs/research/candidates-final.md`,
`docs/research/FINDING-allowed-surface.md`, `docs/reference/AS24-REFERENCE-API.md`,
`docs/research/probe-LOT-A.md`, `docs/research/probe-LOT-B.md`, `docs/research/probe-LOT-E.md`,
`docs/research/probe-LOT-F.md`.

---

## LOT-C — payloads du front

Rappel du mandat : **aucune sonde**. Chaque candidat est noté sur les 14 axes avec le niveau de
preuve indiqué colonne par colonne. « ce qu'on ferait si l'accès devenait licite » clôt chaque fiche.

### C-06 — `__NEXT_DATA__` des pages de recherche `/lst`

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € — une requête HTTP suffit, aucun rendu JS nécessaire | DOCUMENTÉ (scrapfly, roundproxies) |
| A2 Coût récurrent | 0 € en direct ; le coût réel est celui de l'anti-bot à franchir (hors mandat de ce lot, voir `LOT-G`/`LOT-H`) | DOCUMENTÉ |
| A3 Couverture champs | Objets `vehicle`, `price`, `seller`, `location`, `tracking`, `vehicleDetails` par annonce servie — recoupe fortement les ~24 champs déjà **prouvés** sur la surface autorisée par `FINDING-allowed-surface.md` §2.3 (mêmes familles : prix, classification, motorisation, carburant, état, géographie, vendeur) | DOCUMENTÉ (scrapfly) — la correspondance avec la surface autorisée est une **inférence**, pas une preuve d'identité champ à champ |
| A4 Couverture géo | Le schéma d'URL documenté porte `cy=B` (Belgique) sur `.com`, et le motif est générique par TLD | DOCUMENTÉ |
| A5 Latence | Page ~255 Ko ; aucune mesure de latence publiée par les sources tierces | [NON VÉRIFIÉ] |
| A6 Débit / quota | Non documenté par les sources tierces consultées ; Akamai est nommément cité comme barrière (`scrape.do`) sans seuil chiffré | [NON VÉRIFIÉ] pour le débit, DOCUMENTÉ pour la présence d'un anti-bot |
| A7 Stabilité technique | 3/5, argumenté : `probe-LOT-E.md` montre par ailleurs (sur des scrapers de contenu voisin) une survivance de sélecteurs très variable d'un dépôt à l'autre ; `__NEXT_DATA__` est un contrat plus stable qu'un sélecteur CSS mais reste lié à la version du build Next.js | argumenté (par analogie avec `LOT-E`, pas une mesure directe sur `/lst`) |
| A8 Résistance anti-bot | Non concerné par ce document (aucune sonde) ; documenté ailleurs comme Akamai actif sur l'ensemble du front (`scrape.do`, et §2 de `AS24-REFERENCE-API.md` pour le blocage nommé de `ClaudeBot`) | DOCUMENTÉ |
| A9 Effort d'intégration | Faible si l'accès était licite : un parseur JSON, pas de rendu navigateur | estimé |
| A10 Coût de maintenance | Argumenté à 3/5 : dépend de la fréquence des refontes du front, non mesurée ici | argumenté |
| A11 Exposition juridique | 4/5 — le chemin est en `Disallow` explicite pour tous les agents (`FINDING-allowed-surface.md`), et le § 3.3 des `Händler-AGB` interdit verbatim « *die automatisierte Abfrage der Datenbank mittels Software* » (preuve déjà établie par `candidates-final.md`, `G2-K8`), même si ce texte est le contrat concessionnaire et non le contrat consommateur | argumenté, appuyé sur une preuve déjà journalisée ailleurs |
| A12 Autonomie | Dépend intégralement d'AS24 : tout changement de structure du payload ou renforcement d'Akamai coupe l'accès sans préavis | documenté |
| A13 Plafond de volumétrie | **Contradiction non résolue entre sources tierces** : scrapfly annonce 200 pages × 20 = 4 000 annonces/recherche, roundproxies annonce 20 pages × 20 = 400. Aucune sonde n'a pu trancher (mandat documentaire strict) | DOCUMENTÉ mais contradictoire — voir question falsifiable dédiée |
| A14 Fraîcheur atteignable | Page générée à la demande (SSR), donc fraîcheur immédiate si l'accès était licite | documenté |

**Verdict** : `VIABLE SOUS CONDITION` — la mécanique est solidement documentée par trois sources
indépendantes convergentes sur la présence et la forme du payload, mais (a) le plafond de
volumétrie exact reste contradictoire entre sources et (b) l'accès est interdit par le `robots.txt`
pour tous les agents et par le § 3.3 des `Händler-AGB` pour le contrat concessionnaire. La condition
est donc double : la levée de l'interdiction technique **et** une clarification du statut juridique.

**Ce qu'on ferait si l'accès devenait licite** : remplacer l'énumération page-par-page de `C-14`
(qui plafonne à ~25 annonces par segment, cf. `probe-LOT-A.md` §V.4) par une pagination `?page=N`
sur `/lst`, en découpant par marque × modèle × tranche de prix pour rester sous le plafond
(quel qu'il soit, 400 ou 4 000) segment par segment — exactement la mécanique de dichotomie
spécifiée plus bas. Le gain net serait la levée du biais produit-publicitaire mesuré par
`probe-LOT-A.md` sur la surface autorisée, **si et seulement si** `/lst` sert un tirage aussi biaisé
que les pages modèle (question non testée, à vérifier en premier si l'accès s'ouvre).

---

### C-07 — `__NEXT_DATA__` des pages de détail d'annonce

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € | DOCUMENTÉ |
| A2 Coût récurrent | 0 € en direct ; 1 requête par annonce (pas d'agrégation possible) | DOCUMENTÉ |
| A3 Couverture champs | **La plus riche du registre à ce niveau de preuve.** Le schéma détaillé publié par l'acteur Apify `memo23` (source n°4) énumère ~35 champs par annonce : identifiants, prix (`amountInEUR`, `netAmountInEUR`, `evaluation.category` — l'évaluation de prix AS24), spécifications complètes du véhicule (12 sous-champs), équipements catégorisés, 5 tailles d'image, vidéo 360°/YouTube, vendeur (dont `contactName`, échardé RGPD comme déjà noté par `FINDING-allowed-surface.md` §2.5), localisation avec coordonnées GPS. Recoupe et **dépasse** les ~24 champs déjà prouvés sur la surface autorisée (ajoute notamment les coordonnées GPS, la galerie multi-résolution, la vidéo) | DOCUMENTÉ (2 sources indépendantes : scrapfly pour la structure générale, apify/memo23 pour le détail exhaustif des champs) |
| A4 Couverture géo | 19 domaines documentés par un candidat voisin (`C-25`, cf. `probe-LOT-F.md`), Belgique nommée | DOCUMENTÉ (cross-lot) |
| A5 Latence | [NON VÉRIFIÉ] — aucune source tierce ne chiffre la latence de cette page spécifiquement |
| A6 Débit / quota | [NON VÉRIFIÉ] |
| A7 Stabilité technique | 3/5, argumenté : l'acteur `memo23` déclare recourir en priorité à « l'API GraphQL mobile interne » et **ne retomber sur `__NEXT_DATA__` qu'en repli** — signe indirect que le HTML est perçu par un opérateur commercial comme la voie la **moins** stable des deux, contrairement à l'intuition initiale du registre | argumenté, appuyé sur un choix d'architecture documenté d'un tiers qui a un intérêt direct à la fiabilité |
| A8 Résistance anti-bot | Non concerné (aucune sonde) ; Akamai actif sur l'ensemble du front, documenté | DOCUMENTÉ |
| A9 Effort d'intégration | Faible si licite : structure JSON déjà entièrement cartographiée par une source tierce, donc un parseur peut être écrit **sans jamais avoir vu une réponse réelle** | estimé |
| A10 Coût de maintenance | 3/5, argumenté | argumenté |
| A11 Exposition juridique | 4/5 — chemin d'offre non couvert par une directive `Allow` (`FINDING-allowed-surface.md`), même mécanisme juridique que `C-06` | argumenté |
| A12 Autonomie | non — dépend intégralement d'AS24 | documenté |
| A13 Plafond de volumétrie | Une requête = une annonce, donc pas de plafond de pagination propre à cet endpoint ; le plafond est celui de la découverte des slugs (dépend de `C-06` ou de `C-14`) | argumenté |
| A14 Fraîcheur atteignable | Immédiate (SSR à la demande) si licite | documenté |

**Verdict** : `VIABLE SOUS CONDITION` — même double condition que `C-06` (levée technique et
clarification juridique), avec une couverture de champs documentée plus riche que tout autre
candidat des deux lots.

**Ce qu'on ferait si l'accès devenait licite** : l'utiliser en complément ciblé de `C-06`/`C-14`,
uniquement pour les slugs déjà identifiés par une voie licite (agrégats de `C-14`, ou pagination de
`C-06` si ouverte) — jamais comme mécanisme de découverte primaire, puisqu'il coûte une requête par
annonce. Écarter systématiquement `seller.contactName` et les champs de contact direct à
l'ingestion, comme déjà prescrit par `FINDING-allowed-surface.md` §2.5 (R3 RGPD).

---

### C-08 — Routes `/_next/data/{buildId}/....json`

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € si la route existe | [NON VÉRIFIÉ — existence même de la route] |
| A2 Coût récurrent | Théoriquement inférieur à `C-06` (pas de HTML), mais non mesurable sans preuve d'existence | [NON VÉRIFIÉ] |
| A3 Couverture champs | Par construction, identique au payload `pageProps` de la page équivalente (même source de données côté serveur) — **si la route existe** | argumenté par déduction de l'architecture Next.js, non observé |
| A4 Couverture géo | Sans objet tant que l'existence n'est pas établie | [NON VÉRIFIÉ] |
| A5 Latence | [NON VÉRIFIÉ] |
| A6 Débit / quota | [NON VÉRIFIÉ] |
| A7 Stabilité technique | Plus fragile par nature que `C-06` : le segment `{buildId}` change à **chaque déploiement**, ce qui casse toute URL codée en dur ; il faudrait relire `__NEXT_DATA__.buildId` à chaque cycle | argumenté (mécanique générique Next.js, documentée par la PR/discussion officielle Vercel consultées) |
| A8 Résistance anti-bot | [NON VÉRIFIÉ] pour ce chemin spécifiquement | — |
| A9 Effort d'intégration | Sans objet | — |
| A10 Coût de maintenance | Supérieur à `C-06` du seul fait de la gestion du `buildId` | argumenté |
| A11 Exposition juridique | Le chemin n'est nommé dans **aucun** `robots.txt` relevé sur les 5 TLD instruits par `probe-LOT-A.md` (T1.4) — ni `Allow`, ni `Disallow` explicite. Un chemin non nommé sous un groupe `Disallow: /` général reste couvert par ce `Disallow` (le groupe `*` de chaque TLD est `Disallow: /` sauf exceptions nommées) : **l'absence de mention ne lève pas l'interdiction**, elle confirme seulement qu'aucune exception n'est déclarée pour lui | argumenté, appuyé sur la lecture des 5 `robots.txt` par `probe-LOT-A.md` |
| A12 Autonomie | non | documenté |
| A13 Plafond de volumétrie | [NON VÉRIFIÉ] |
| A14 Fraîcheur atteignable | [NON VÉRIFIÉ] |

**Verdict** : `NON VIABLE — existence non établie`. **Aucune des trois sources tierces qui décrivent
`C-06` en détail (scrapfly, roundproxies, scrape.do) ne mentionne cette route pour AutoScout24**, et
la recherche web dédiée (journal #15) ne remonte que la documentation générique de Next.js, jamais
un cas d'usage AS24. C'est un résultat négatif **de recherche**, pas une preuve d'inexistence : le
mandat documentaire strict interdit de le trancher par une requête `HEAD` triviale, qui aurait
réglé la question en une seule sonde si elle avait été autorisée.

**Ce qu'on ferait si l'accès devenait licite** : la première action serait justement cette sonde
élémentaire — un `HEAD` sur `/_next/data/{buildId}/fr/lst.json` avec le `buildId` lu dans
`__NEXT_DATA__` d'une page autorisée (`C-14` le fournit déjà, sans requête supplémentaire). Si 200,
cette voie remplace `C-06` avec un coût réseau inférieur (pas de HTML) ; si 404, cela confirme que
l'application utilise l'App Router ou un export qui supprime ces routes, et le candidat se ferme
définitivement.

---

### C-66 — Rejeu d'appels XHR observés dans le navigateur (protocole DevTools)

Ce candidat n'est pas de la même nature que les trois précédents : il ne prétend pas documenter un
payload, il **spécifie le protocole** que le commanditaire devra exécuter lui-même (aucune session
sur `autoscout24.be` n'est permise à cet agent). Le tableau A1–A14 est donc largement `argumenté`
ou `[NON VÉRIFIÉ]` par construction — sa valeur est ailleurs, dans le protocole lui-même.

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € (navigateur + onglet réseau), mais **exige une action du commanditaire** | documenté |
| A2 Coût récurrent | Sans objet — méthode de reconnaissance ponctuelle, pas un canal d'ingestion | argumenté |
| A3 Couverture champs | Produirait la liste **exhaustive et actuelle** des endpoints JSON du front, potentiellement au-delà des 5 nommés dans `robots.txt` — c'est son seul apport unique | argumenté |
| A4-A14 | Sans objet tant que le protocole n'est pas exécuté ; tous `[NON VÉRIFIÉ]` | — |

**Verdict** : `VIABLE SOUS CONDITION` — la condition est `ACTIONS-COMMANDITAIRE`, pas une inconnue
technique. Le protocole ci-dessous est prêt à l'emploi.

**Protocole DevTools (prêt à exécuter par le commanditaire, jamais par cet agent)** :
1. Ouvrir un navigateur non automatisé, session anonyme, sur `https://www.autoscout24.be/fr/`.
2. Ouvrir l'onglet Réseau, filtrer sur `Fetch/XHR`, activer « Préserver le journal ».
3. Exercer, dans l'ordre, chacune de ces interactions et noter, pour chaque appel déclenché : URL
   complète, méthode, code de statut, en-têtes de requête (en particulier tout en-tête non standard
   ou signature), taille de la réponse, et un extrait des 200 premiers caractères du corps :
   - Charger une page de recherche `/lst?...` et faire défiler jusqu'à la pagination.
   - Appliquer un filtre marque, puis un filtre prix, puis un filtre tri.
   - Ouvrir une annonce depuis la liste (sans rechargement complet si le routing client le permet).
   - Ouvrir la page d'un concessionnaire depuis une annonce.
   - Utiliser `/prijsschatting/` ou `/evaluationvoiture/` et compléter le formulaire jusqu'à
     obtenir un résultat.
   - Sauvegarder une recherche (si un compte est disponible — sinon noter l'appel déclenché par le
     bouton avant l'écran de connexion).
4. Exporter le journal complet au format **HAR**.
5. Livrer le HAR à cet agent (ou au successeur de ce lot) pour extraction hors ligne des URL, sans
   qu'aucune requête supplémentaire ne soit nécessaire.
6. **Note R3 opposable** : il s'agit d'une session de navigation manuelle unique, non d'une
   extraction répétée — elle reste dans l'esprit de la règle des sondes unitaires, mais son volume
   d'appels doit être journalisé dans le HAR livré, pas estimé a priori.

**Ce qu'on ferait si l'accès devenait licite** : ce protocole n'a pas besoin que l'accès devienne
licite pour être exécuté — il l'est déjà pour le commanditaire, qui navigue en personne physique et
non comme un agent automatisé nommé dans le `robots.txt`. C'est précisément pourquoi il est
classé en `ACTIONS-COMMANDITAIRE` (voir section dédiée) plutôt qu'en inconnue technique.

---

## LOT-D — endpoints internes

Les 5 candidats de ce lot sont en `Disallow` explicite pour le groupe `User-agent: *` sur les 5
TLD instruits par `probe-LOT-A.md` (T1.4), sans exception : ce n'est pas propre aux robots d'IA.
Aucune sonde. Note transversale utile aux 5 fiches : `probe-LOT-B.md` a établi par analyse
**statique** d'un APK public (`C-16`, candidat d'un autre lot, dont je ne conclus pas ici) que
l'application mobile embarque **115 documents GraphQL en clair**, dont un `schema.graphql` de
6 418 lignes, avec des opérations nommées `search_default.graphql`, `search_count.graphql`,
`filter_count.graphql`, `search_listings_ids.graphql`, `dealer_listings.graphql`, et que le schéma
nomme lui-même un backend REST interne `classified-search.a.autoscout24.com`. Je **cite** ce
résultat, journalisé et exécuté par `probe-B` et non par moi (R6 : je ne conclus pas sur `C-16`),
parce qu'il éclaire directement le mandat de ce lot : la même famille fonctionnelle
(« listing search ») existe côté mobile avec un schéma nommé, ce qui rend plausible — sans le
prouver — que `/listing-search-api/graphql` (web) et l'API mobile partagent tout ou partie de ce
schéma, vu la proximité des noms d'hôtes (`listing-search.api.autoscout24.com` trouvé par `probe-B`
via Certificate Transparency, distinct de mais voisin du chemin `/listing-search-api/graphql` du
`robots.txt` du site public).

### C-09 — Endpoint GraphQL interne `/listing-search-api/graphql` (voir sous-section dédiée ci-dessous)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € si l'accès devenait licite et non authentifié | argumenté, conditionnel |
| A2 Coût récurrent | Indéterminable : `probe-LOT-B.md` a établi que l'hôte voisin `listing-search.api.autoscout24.com` (hors `www`, donc légitimement sondé par ce lot voisin) répond **401 « Authentication required »** sur `/graphql`, y compris sans requête réelle — l'accès non authentifié est **fermé du côté hôte API**, indépendamment du blocage `robots.txt` côté site | **PROUVÉ par renvoi** — la preuve est de `probe-LOT-B.md`, journalisée là, pas ici |
| A3 Couverture champs | Potentiellement très large si le schéma web ressemble au schéma mobile (115 documents GraphQL, champs de recherche, de comptage, de facettes) — mais aucun texte de requête ni schéma **web** n'a été vu, seulement son analogue mobile | argumenté par analogie, non prouvé pour ce chemin précis |
| A4 Couverture géo | Chemin dupliqué par TLD selon le motif générique du site (`www.autoscout24.{be,de,fr,...}/listing-search-api/graphql`) | documenté par la structure même du `robots.txt`, répliquée sur 5 TLD (`probe-LOT-A.md`) |
| A5 Latence | [NON VÉRIFIÉ] |
| A6 Débit / quota | [NON VÉRIFIÉ] |
| A7 Stabilité technique | Sans objet tant que l'accès est fermé | — |
| A8 Résistance anti-bot | **L'authentification precède l'anti-bot** : `probe-LOT-B.md` montre un `401` avant même qu'un test Akamai puisse s'exprimer. Le premier obstacle n'est donc pas Akamai mais une clé de gateway (Mashery, cf. `probe-LOT-B.md`, en-têtes `mashery_api_key`) + OAuth (Okta) | **PROUVÉ par renvoi** |
| A9 Effort d'intégration | Sans objet : aucune clé disponible sans compte partenaire (R2) | — |
| A10 Coût de maintenance | Sans objet | — |
| A11 Exposition juridique | 5/5 — `Disallow` explicite `User-agent: *` sur 5 TLD (`probe-LOT-A.md`), et fermeture technique par gateway confirmée (`probe-LOT-B.md`) : double barrière, contractuelle et technique | argumenté, appuyé sur deux preuves croisées |
| A12 Autonomie | Dépendance totale et actuellement fermée | documenté |
| A13 Plafond de volumétrie | Sans objet | — |
| A14 Fraîcheur atteignable | Sans objet | — |

**Verdict** : `NON VIABLE en l'état`. Le chemin n'est documenté par **aucune** source tierce
publique sous son nom exact (journal #6), et l'hôte API voisin le plus probable est fermé par
gateway + OAuth (preuve croisée de `probe-LOT-B.md`). C'est le **verrou technique majeur du
dossier** au sens où le mandat le nomme — mais un verrou fermé des deux côtés (crawl et
authentification), pas seulement un verrou de `robots.txt`.

**Ce qu'on ferait si l'accès devenait licite (ou obtenu par contrat)** : voir la sous-section dédiée
ci-dessous, qui rassemble tout ce que les sources tierces permettent de dire sur son schéma
probable, ses paramètres et son authentification.

---

#### Sous-section dédiée : `/listing-search-api/graphql` — ce que les sources tierces établissent

**Sur le schéma** : aucune source publique ne documente le schéma **de ce chemin précis**
(recherche ciblée, journal #6, stérile). Ce qui est documenté est son **analogue mobile**, trouvé
par `probe-LOT-B.md` dans l'APK public d'AutoScout24 (v26.35.12) : un fichier `schema.graphql` de
6 418 lignes et 115 documents GraphQL nommés, dont l'opération racine observée est
`search { listingsByQueryString(queryString, locale, userData) { metadata{totalItems,totalPages}
listings{ details{…} } } }` — `queryString` étant décrite comme « la même chaîne de recherche URL
que le web » (citation de `probe-LOT-B.md`). Si le web et le mobile partagent ce schéma — hypothèse
plausible vu le nom de famille commun (« listing-search »/« listingsByQueryString ») mais **non
prouvée** — alors `/listing-search-api/graphql` accepterait une recherche paramétrée par la même
syntaxe que `?atype=C&cy=B&...` de `/lst`, et renverrait `totalItems`/`totalPages` en plus des
annonces : exactement l'oracle de comptage dont `C-12` cherche un équivalent, réuni avec la
recherche elle-même en un seul appel. **Ceci reste une inférence par analogie, marquée
`[NON VÉRIFIÉ — identité web/mobile du schéma]`.**

**Sur les paramètres** : par déduction du nom des documents mobiles trouvés (`search_count`,
`filter_count`, `search_listings_ids`), la famille comporterait au moins quatre opérations
distinctes : recherche paginée, comptage seul, comptage par facette, et récupération d'identifiants
seuls (utile pour un crawl incrémental sans re-télécharger les données complètes). Aucune n'est
confirmée exister côté web.

**Sur l'authentification** : ici la preuve est la plus solide du lot, parce qu'elle est **croisée**
entre deux angles indépendants :
1. `probe-LOT-B.md` : l'hôte `listing-search.api.autoscout24.com` (qui ne sert aucun `robots.txt`,
   donc légitimement sondable) répond **401 `Authentication required`** sur `/graphql`, et les
   en-têtes trouvés dans l'APK nomment une clé de gateway (**Mashery**, `mashery_api_key`) et un
   flux OAuth2 via **Okta** (`as24dealers.okta.com`, `auth-dealers.autoscout24.com`) — un parcours
   de connexion **concessionnaire** (`apps-login`, `sso-identity`).
2. Le résumé indexé du blog technique d'AutoScout24 (journal #12, `tech.autoscout24.com`, non
   consulté directement) décrit une architecture en microservices où « un backend for frontend
   fournit l'API GraphQL et agrège les services aval » — cohérent avec un point d'entrée GraphQL
   unique gardé par gateway plutôt qu'un accès public direct.

**Conclusion de la sous-section** : `/listing-search-api/graphql` est vraisemblablement gardé par
la même chaîne **clé de gateway + OAuth2/Okta** que son analogue mobile, ce qui voudrait dire que,
même si le `robots.txt` n'existait pas, l'accès non authentifié échouerait quand même. C'est un
résultat **documenté par analogie et par preuve croisée indirecte**, jamais `PROUVÉ` pour ce chemin
lui-même — la seule façon de trancher serait une sonde directe, interdite par le mandat.

---

### C-10 — Endpoint GraphQL interne `/ocs/api/graphql`

| Axe | Valeur | Preuve |
|---|---|---|
| A1–A2 | Sans objet — accès fermé par construction (`Disallow` + probable gateway, cf. `C-09`) | argumenté par analogie |
| A3 Couverture champs | **« OCS » reste indécodé.** Trois recherches ciblées (journal #7, #11, #14) ne trouvent aucune source qui nomme ce que « OCS » désigne — ni contenu CMS, ni service de commande, ni acronyme sectoriel reconnu | [NON VÉRIFIÉ] |
| A4–A14 | Sans objet, sauf A11 | — |
| A11 Exposition juridique | 5/5 — même `Disallow` explicite `User-agent: *` sur 5 TLD, et l'hôte hors-`www` le plus probable (`ocs.api.autoscout24.com`) a été sondé **par `probe-LOT-B.md`** (légitimement, hôte sans `robots.txt`) et répond **403** — fermé | **PROUVÉ par renvoi** (`probe-LOT-B.md`, ligne 18-19 de son journal) |

**Verdict** : `NON VIABLE en l'état`, et **davantage indécidable** que `C-09` : non seulement
l'accès est fermé (403 confirmé sur l'hôte API par `probe-LOT-B.md`), mais l'objet même du service
n'est identifiable par aucune source publique. La question falsifiable « OCS désigne un service
hors périmètre KYCAR » ne peut recevoir de verdict `VRAIE`/`FAUSSE` : elle reste `NON TRANCHÉE` par
absence totale de source, pas par preuve contraire.

**Ce qu'on ferait si l'accès devenait licite** : la première question à poser au commanditaire ou à
un contact partenaire AS24 serait précisément la signification de « OCS » — c'est une question à
6 mots qui débloquerait toute la fiche, alors qu'aucune recherche documentaire ne peut la résoudre.

---

### C-11 — Fragments SSR de liste : `/classified-list/react-listelements`

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € si licite | argumenté |
| A3 Couverture champs | Le chemin est **vivant et indexé** : la recherche (journal #8) retrouve des URL réelles et actuellement indexées,
`autoscout24.com/classified-list/react-listelements/en?isSeoListPage=false&toguru=…` et son
équivalent `.nl`, avec un paramètre `toguru` qui est le nom du système de feature-flags interne
d'AS24 (corroboré par le paquet npm `@autoscout24/toguru-client`, déjà inventorié dans
`candidates-final.md` `G2-K9`). Le paramètre `isSeoListPage=false` suggère un mode de rendu
**alternatif** au mode SEO — cohérent avec la fonction de fragment décrite dans la fiche `C-11` de
`candidates-v1.md` (rendu de liste par fragments, hors du HTML complet de `/lst`) | DOCUMENTÉ (route vivante confirmée par indexation, contenu du fragment non observé) |
| A5–A6, A9–A10, A13–A14 | [NON VÉRIFIÉ] — le contenu réel du fragment (HTML partiel ou JSON) n'est établi par aucune source | [NON VÉRIFIÉ] |
| A7 Stabilité technique | Argumenté à 3/5 : la présence d'un paramètre de feature-flag (`toguru`) sur cette route suggère qu'elle est **activement variée en production** (A/B testing), donc plus instable qu'un endpoint figé | argumenté |
| A11 Exposition juridique | 5/5 — même `Disallow` explicite | argumenté |
| A12 Autonomie | non | documenté |

**Verdict** : `VIABLE SOUS CONDITION` la plus **incertaine** du lot sur le contenu réel — c'est le
seul des 5 candidats dont l'**URL exacte et vivante** a été retrouvée par indexation tierce (pas
seulement déduite du `robots.txt`), mais dont le **corps de réponse** reste entièrement inconnu.

**Ce qu'on ferait si l'accès devenait licite** : demander (ou faire demander par le commanditaire
via le protocole DevTools de `C-66`) un exemple de réponse réelle sur cette route précise — elle est
la candidate la plus prometteuse du lot pour un accès **bon marché** (fragment, pas page complète)
si sa mécanique est confirmée être du JSON plutôt que du HTML.

---

### C-12 — Oracle de comptage `/search-subscriptions/api/new-results-count`

| Axe | Valeur | Preuve |
|---|---|---|
| A1–A2 | Sans objet, accès fermé | argumenté |
| A3 Couverture champs | Un entier (compte), pas un objet annonce — par construction, d'après le nom et la fonction déclarée (alerte de recherche sauvegardée). La fonctionnalité **produit** (recherches sauvegardées, `autoscout24.de/search-subscriptions/de/`) est confirmée vivante par indexation (journal #9), mais aucune source ne documente le format de réponse de cet endpoint précis | DOCUMENTÉ pour la fonctionnalité, [NON VÉRIFIÉ] pour le format |
| A11 Exposition juridique | 5/5 — `Disallow` explicite `User-agent: *` | argumenté |
| A12 Autonomie | non | documenté |

**Verdict** : `NON VIABLE en l'état` pour un accès direct — mais **la question qui compte n'est pas
son accès, c'est sa mécanique**, transposable. Voir la section dédiée ci-dessous : la reconstruction
de distributions par dichotomie ne dépend pas de cet endpoint précis, elle dépend de **n'importe
quel oracle de comptage**, et `probe-LOT-A.md` a déjà **prouvé** qu'un tel oracle existe et
fonctionne sur la surface autorisée (`listings.metadata.totalItems`, mesuré exhaustif et stable à
0,8 % près sur des dizaines de segments, cf. `probe-LOT-A.md` §V.2-V.5).

**Ce qu'on ferait si l'accès devenait licite** : l'utiliser en remplacement de `totalItems` comme
oracle de comptage — avec un avantage potentiel si (et seulement si) il accepte des critères plus
fins que « marque + modèle » (ex. tranche de prix, tranche de kilométrage), ce qu'aucune source ne
confirme ni n'infirme pour cet endpoint précis.

---

### C-13 — API vitrine concessionnaire : `/as24-search-funnel/api/vip-showroom`, `/api/dealer-detail/...`

| Axe | Valeur | Preuve |
|---|---|---|
| A1–A2 | Sans objet en direct ; **une primitive commerciale équivalente existe et son prix est connu** : Anysite.io facture « 20 crédits pour 20 résultats » sur son propre endpoint `POST /api/autoscout24/dealers/listings` (journal #5), soit 1 crédit = 1 annonce, converti par `probe-LOT-F.md` à environ **2,67 à 3,01 €/1 000 annonces** selon le plan | DOCUMENTÉ (prix d'un substitut commercial, pas de l'endpoint AS24 lui-même) |
| A3 Couverture champs | Le schéma Anysite (~19 champs : identité, prix brut, motorisation, carburant, image, vendeur, localisation géocodée) **ne contient aucun champ d'évaluation de prix AS24** (confirmé par `probe-LOT-F.md`) — si l'endpoint AS24 sous-jacent expose ce champ (comme le fait `C-07` sur les pages de détail), la primitive AS24 native serait strictement plus riche que son miroir commercial | DOCUMENTÉ pour le substitut (`probe-LOT-F.md`), argumenté par analogie pour l'original |
| A4 Couverture géo | Anysite ne documente aucun périmètre pays spécifique — « mécanique générique par concessionnaire, pas par pays » (`probe-LOT-F.md`) | DOCUMENTÉ |
| A7 Stabilité technique | Nuance importante trouvée par la recherche (journal #10) : le nom « **VIP Showroom** » désigne, côté portail concessionnaire AS24, un **produit publicitaire payant de placement géographique/marque** (90 zones postales, exclusivité marque×zone) et non nécessairement « l'inventaire complet d'un concessionnaire ». Le candidat `C-13` du registre gelé fusionnait peut-être deux fonctions distinctes : la vitrine promue (`vip-showroom`) et le détail concessionnaire (`dealer-detail`, `dealer_listings.graphql` trouvé côté mobile par `probe-LOT-B.md`). Cette dernière est la primitive que reflète réellement Anysite | argumenté — nuance nouvelle apportée par cette instruction, à corriger dans le registre |
| A11 Exposition juridique | 5/5 — `Disallow` explicite ; de plus, `probe-LOT-B.md` documente que `dealer_listings.graphql` existe côté mobile (donc la fonction est réelle) mais sous la même garde gateway/OAuth que `C-09` | argumenté, preuve croisée |
| A12 Autonomie | non | documenté |
| A13 Plafond de volumétrie | Aucun plafond documenté côté Anysite (« pas de plafond maximal explicite documenté », `probe-LOT-F.md`) — contrairement au plafond de ~25 annonces mesuré par `probe-LOT-A.md` sur la surface autorisée. Si cette absence de plafond se vérifie, **la primitive par concessionnaire contourne intégralement le biais produit-publicitaire mesuré sur `C-14`**, parce qu'elle énumère un stock fermé (un garage) plutôt qu'un tirage sur un marché ouvert | DOCUMENTÉ (absence de plafond documentée côté substitut commercial), argumenté pour l'original |

**Verdict** : `VIABLE SOUS CONDITION` — au sens où **la primitive existe et fonctionne**, prouvé
indirectement à double titre : commercialement par Anysite (`probe-LOT-F.md`) et techniquement par
la présence de `dealer_listings.graphql` dans le schéma mobile (`probe-LOT-B.md`). Ce qui manque
n'est pas la preuve d'existence, c'est l'accès licite et gratuit.

**Ce qu'on ferait si l'accès devenait licite** : énumérer les concessionnaires belges (par un
annuaire tiers, Traxio/Febiac, déjà cité dans `LOT-M`), puis paginer le stock de chacun via cette
primitive, sans le plafond de ~25 annonces qui affecte `C-14`. C'est la voie qui, **si elle
s'ouvrait**, réglerait le plus directement le point ouvert O9/P2 (représentativité), puisqu'elle
donnerait un stock exhaustif par concessionnaire plutôt qu'un tirage biaisé par le produit
publicitaire.

---

## Mécanique de reconstruction de distributions par dichotomie

**Principe.** Un oracle de comptage renvoie, pour un jeu de critères de recherche donné, le nombre
d'annonces qui les satisfont — sans jamais renvoyer les annonces elles-mêmes. `C-12` en est un
exemplaire interdit ; `listings.metadata.totalItems`, exposé sur la surface autorisée par `C-14` et
**prouvé exhaustif et stable** par `probe-LOT-A.md` (dispersion de 0,8 % sur des rappels répétés,
§V.2-V.5 de ce document), en est un exemplaire **licite**. Le mandat de ce lot demande de spécifier
la mécanique indépendamment de l'endpoint qui la porte, parce qu'elle est **transposable**.

### Comment un compte seul reconstruit une distribution

Soit une variable continue (prix, kilométrage, année) et un intervalle `[min, max]` connu par
ailleurs (le minimum et le maximum affichés par `priceInfo`, ou des bornes raisonnables du marché).
L'algorithme est une **recherche binaire répétée sur les bornes d'une requête à un paramètre** :

1. Interroger l'oracle avec le critère « valeur ≤ midpoint » pour obtenir le compte cumulé
   jusqu'à `midpoint = (min + max) / 2`.
2. Ce compte cumulé est un point de la **fonction de répartition** (CDF) de la variable.
3. Répéter récursivement sur `[min, midpoint]` et `[midpoint, max]` pour raffiner chaque tranche,
   ou plus simplement : interroger l'oracle à **N-1 seuils fixes et régulièrement espacés** entre
   `min` et `max` pour obtenir directement les **N buckets** d'un histogramme, sans recherche binaire
   du tout — la « dichotomie » n'est nécessaire que si l'on cherche des **quantiles précis**
   (médiane, p25, p75) plutôt qu'un histogramme à pas fixe.

### Nombre de requêtes pour un histogramme de N buckets

| Objectif | Requêtes nécessaires | Détail |
|---|---|---|
| **Histogramme à pas fixe, N buckets** | **N requêtes** (une par seuil supérieur de bucket, y compris le total lui-même qui peut servir de dernier seuil) — ou **N−1** si le total global est déjà connu par ailleurs (ex. `totalItems` de la page non filtrée) | Chaque requête donne le compte cumulé `count(x ≤ seuil_i)` ; le compte du bucket `i` s'obtient par soustraction `count(x ≤ seuil_i) − count(x ≤ seuil_{i-1})`. Coût **linéaire** en N. |
| **Une médiane (p50) seule, précision ε en valeur** | **⌈log2((max−min)/ε)⌉ requêtes** | Recherche binaire classique : chaque requête divise l'incertitude par 2. Pour un intervalle de prix de 50 000 € avec une précision cible de 50 €, cela fait `log2(1000) ≈ 10` requêtes. |
| **K quantiles arbitraires (ex. déciles, K=9), précision ε** | **K × ⌈log2((max−min)/ε)⌉ requêtes**, ou **K + quelques requêtes** si on réutilise les bornes déjà resserrées d'un quantile pour initialiser le suivant (les quantiles sont ordonnés, donc les intervalles de recherche binaire se contractent mutuellement) | Une implémentation naïve répète la recherche par quantile ; une implémentation qui partage l'état entre quantiles adjacents descend sous le linéaire en K. |
| **Histogramme adaptatif (buckets de largeur variable, egaux en effectif — un histogramme "equi-depth")** | **~N × log2(populationTotale/N) requêtes** dans le pire cas, en cherchant par dichotomie la borne de chaque bucket successif | Plus coûteux que le pas fixe, mais donne une résolution fine là où la densité est forte (utile pour les gammes de prix où la masse du marché se concentre) sans perdre de résolution dans les queues. |

**Précision atteignable** : bornée uniquement par (a) le pas de discrétisation choisi pour la
variable côté serveur (si le filtre n'accepte que des entiers, ε ne peut pas descendre sous 1 unité
de la variable) et (b) la **stabilité temporelle** de l'oracle — `probe-LOT-A.md` mesure une
dispersion de 1 sur 1 281 (0,08 %) au niveau modèle et de 42 sur 5 179 (0,8 %) au niveau marque
entre rappels espacés de plusieurs minutes, attribuée au vieillissement du cache. Cette dispersion
plafonne la précision réaliste d'un histogramme reconstruit à **environ 1 %**, pas moins, même avec
un nombre de requêtes arbitrairement grand.

### Limites de la mécanique

1. **Elle suppose un oracle qui accepte le critère qu'on veut dichotomiser.** `totalItems` sur la
   surface autorisée est indexé par marque/modèle, pas par tranche de prix : rien dans les preuves
   rassemblées par `probe-LOT-A.md` ne démontre qu'ajouter un paramètre de prix à l'URL d'une page
   modèle **change** la valeur de `totalItems` retournée (les essais de `probe-LOT-A.md` avec
   `?fuel=…&ft=…&sort=…` visaient à casser le cache CDN pour la capture-recapture, pas à vérifier un
   filtrage serveur réel — ce point est **`[NON VÉRIFIÉ]`**, et c'est la limite la plus importante de
   cette section : sans lui, la mécanique reconstruit une distribution **par modèle**, pas une
   distribution **de prix au sein d'un modèle**, ce qui est un problème différent et déjà couvert
   par `C-07`/`C-14` sur l'échantillon direct.
2. **Elle ne renvoie jamais les annonces**, seulement leur nombre : aucune valeur d'ancrage
   individuelle (aucun `id`, aucune image) — elle sert le mode 1 de KYCAR (comptages, distributions
   agrégées), jamais le mode 2 au niveau annonce.
3. **Un compte non plafonné et non arrondi est une hypothèse à vérifier**, pas un acquis : si
   l'oracle arrondit au-delà d'un seuil (pratique courante côté anti-scraping pour ne pas révéler la
   taille exacte d'un stock), la dichotomie perd sa précision aux extrémités de la distribution.
   Rien dans les sources tierces consultées ici ne confirme ni n'infirme un tel arrondi pour
   `C-12` ; `probe-LOT-A.md` **prouve** l'absence d'arrondi observable pour `totalItems`.
4. **Chaque requête reste une requête** : R3 (pas de volumétrie) borne le nombre de sondes
   qu'un agent de ce plan peut exécuter, mais un histogramme à N=20 buckets reconstruit
   quotidiennement pour un rafraîchissement de plusieurs centaines de segments marque/modèle
   multiplierait vite le volume — la mécanique doit être chiffrée en A6 (débit/quota) avant
   adoption en production, pas seulement validée en principe.

### Où cette mécanique est transposable

- **`C-14` / la surface autorisée elle-même** (déjà noté par le registre gelé) : `totalItems` par
  couple marque/modèle **est** un histogramme à pas grossier (un bucket par modèle) — la mécanique
  y est **déjà en production de fait**, sans qu'aucune dichotomie n'ait été nécessaire pour l'obtenir
  (une requête par segment suffit, le comptage est direct et non filtré).
- **`C-58`** (outil d'estimation de prix, `/prijsschatting/`, sous directive `Allow`) : si son appel
  interne renvoie une distribution plutôt qu'un point (question ouverte de `LOT-A`), c'est un
  second oracle licite, potentiellement filtrable par critère technique (année, kilométrage) plutôt
  que par seul modèle — à vérifier par `LOT-A`, hors mandat de ce document.
- **Tout portail tiers dont la page de recherche affiche un compte de résultats sans afficher
  l'intégralité des annonces** (`C-43`, `C-44` de `LOT-N` ; les portails constructeurs de `C-76`,
  `LOT-M`) : la même mécanique s'applique dès qu'un compte de résultats existe pour une requête
  paramétrée, indépendamment du site.
- **Les API commerciales qui exposent un paramètre `count` ou un total de résultats sans exposer
  systématiquement chaque annonce** (ex. tout endpoint de type `/search?...&count_only=true`, s'il
  existe chez l'un des fournisseurs de `LOT-F`/`LOT-G` — non vérifié ici, hors mandat).
- **Au-delà du domaine automobile** : c'est une mécanique générique de **model extraction / inférence
  de distribution par oracle de comptage**, documentée dans la littérature de sécurité des bases de
  données statistiques (« count query auditing ») — non retracée à une source spécifique dans ce
  document, mais c'est le principe qui sous-tend toute reconstruction de distribution à partir d'un
  moteur de recherche qui affiche un nombre de résultats, ce qui est la norme sur le web (moteurs de
  recherche généralistes, portails immobiliers, sites d'emploi).

---

## Questions falsifiables

Reprend les questions prioritaires des deux fiches de lot de `candidates-final.md`, plus celles
propres à chaque candidat listées dans `candidates-v1.md`.

### LOT-C

| # | Question | Verdict | Niveau de preuve |
|---|---|---|---|
| C-1 | « Le payload de `/lst` porte les mêmes 40 champs par annonce que la surface autorisée. » | **NON TRANCHÉE** — la structure documentée (`vehicle`, `price`, `seller`, `location`, `tracking`, `vehicleDetails`) recoupe fortement les ~24 champs déjà prouvés sur `C-14`, mais aucune source tierce ne publie une correspondance champ à champ exhaustive | DOCUMENTÉ, incomplet |
| C-2 | « Les routes `/_next/data/{buildId}` sont attestées et le `buildId` est lisible depuis une page autorisée. » | **FAUSSE pour la première partie** — aucune des sources tierces qui documentent `__NEXT_DATA__` en détail ne mentionne cette route pour AS24 ; la seconde partie (`buildId` lisible) est vraie par construction Next.js mais sans objet si la route n'existe pas | DOCUMENTÉ (absence de mention dans 3 sources indépendantes) |
| C-3 | « `numberOfPages` est plafonné dans le payload lui-même, ce qui prouverait le plafond sans le tester. » | **VRAIE sur le principe, mais valeur contradictoire** — `numberOfPages`/`numberOfResults` existe bien dans le payload documenté (scrapfly, roundproxies), mais les deux sources annoncent des plafonds différents (200 pages/4 000 annonces contre 20 pages/400) | DOCUMENTÉ, contradictoire — seule une sonde (hors mandat) tranche |
| C-4 | « Aucune source tierce ne décrit un paramètre de taille de page supérieur à 20. » | **VRAIE** — les trois sources consultées (scrapfly, roundproxies, scrape.do) et la primitive commerciale la plus proche (Anysite, `count` réglable) ne mentionnent jamais un paramètre de taille de page pour `/lst` lui-même ; seul le **nombre de pages** varie selon la source, jamais la taille d'une page | DOCUMENTÉ |

### LOT-D

| # | Question | Verdict | Niveau de preuve |
|---|---|---|---|
| D-1 | « La reconstruction de distributions par dichotomie fonctionne sur les compteurs de la surface autorisée, ce qui rend `C-12` inutile. » | **PARTIELLEMENT VRAIE** — `totalItems` fonctionne comme oracle de comptage **par segment marque/modèle** (prouvé par `probe-LOT-A.md`), donc `C-12` est effectivement rendu superflu pour cette granularité. Mais rien ne prouve qu'un filtre de prix/km/année change `totalItems` sur ces pages : pour une dichotomie **au sein** d'un modèle, la question reste `NON TRANCHÉE` | PROUVÉ par renvoi pour la granularité modèle ; [NON VÉRIFIÉ] pour la granularité infra-modèle |
| D-2 | « `C-29` fournit exactement la primitive de `C-13`, donc l'endpoint interdit n'a aucune valeur ajoutée pour nous. » | **PROBABLEMENT FAUSSE, nuancée** — `C-29` (Anysite) fournit une primitive **voisine** (stock par concessionnaire) mais sans le champ d'évaluation de prix AS24 (confirmé absent par `probe-LOT-F.md`), alors que l'analogue mobile trouvé par `probe-LOT-B.md` (`dealer_listings.graphql`) appartient à la même famille GraphQL que celle qui expose l'évaluation ailleurs (`C-07`). L'original garderait donc une valeur ajoutée sur au moins un champ | DOCUMENTÉ par recoupement de deux probes soeurs, non prouvé directement |
| D-3 | « Aucune source publique ne documente le schéma de `/listing-search-api/graphql`. » | **VRAIE pour ce chemin exact** — recherche ciblée stérile (journal #6). Un schéma **analogue** (mobile) est documenté par `probe-LOT-B.md`, mais rien ne prouve qu'il s'agit du même schéma que celui exposé (et fermé) sur ce chemin web précis | DOCUMENTÉ pour l'absence de source directe |
| D-4 | « `OCS` désigne un service dont la donnée est hors périmètre KYCAR. » | **NON TRANCHÉE** — trois recherches indépendantes (journal #7, #11, #14) ne trouvent aucune source qui décode l'acronyme, dans un sens comme dans l'autre | [NON VÉRIFIÉ] — absence totale de source, pas preuve contraire |

---

## ACTIONS-COMMANDITAIRE

| Candidat / objet | Action requise du commanditaire | Ce qu'elle débloque | Urgence |
|---|---|---|---|
| `C-66` | Exécuter le protocole DevTools spécifié ci-dessus (session navigateur réelle sur `autoscout24.be`, HAR exporté) et le livrer à cet agent ou à son successeur | Cartographie exhaustive et actuelle des endpoints JSON du front, y compris ceux absents du `robots.txt` — lève la principale incertitude de `C-11` (contenu réel du fragment) | **Haute** — c'est le seul moyen, dans les règles du plan, d'obtenir une preuve directe sur `C-06`, `C-08` (existence de `/_next/data/`), `C-11` |
| `C-09`, `C-10` | Poser à un contact commercial ou partenaire AS24 (le canal `C-48`/`C-01` de `LOT-K` s'y prête) deux questions fermées : (a) que signifie « OCS » ? (b) `/listing-search-api/graphql` et l'API mobile partagent-elles un schéma ? | Résout `D-4` immédiatement, et confirme ou infirme l'inférence par analogie de la sous-section dédiée à `C-09` | Moyenne — conditionnelle à ce qu'un canal de contact s'ouvre via `LOT-K` |
| `C-09` | Si un accès partenaire technique (`C-49`, `portal.services.as24.tech`) s'ouvre un jour, demander explicitement la documentation de gateway (Mashery) et le scope OAuth (Okta) nécessaires pour `/graphql` | Seule voie qui lèverait la fermeture technique confirmée par `probe-LOT-B.md`, indépendamment du `robots.txt` | Basse — hors de portée sans partenariat |
| `C-13` | Si `LOT-M` produit un annuaire de concessionnaires belges, le transmettre pour que la primitive Anysite (ou son équivalent AS24 si l'accès s'ouvre) puisse être testée dealer par dealer | Prépare l'exécution de la mécanique décrite dans « ce qu'on ferait si l'accès devenait licite » de `C-13` | Basse |

---

*Fin du document. Compteur final de requêtes tierces : **17 / 50**. Aucune requête vers un domaine
`autoscout24.*` n'a été émise par cet agent, sur aucun TLD.*

---

## ACTIONS-COMMANDITAIRE

*(à remplir)*
