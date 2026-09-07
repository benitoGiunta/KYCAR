# probe-LOT-F — Fournisseurs de scraping à endpoint AutoScout24 dédié

**Agent** : `probe-F`, phase 1.4 du plan `PLAN-1-data-acquisition.md`. Profil **documentaire**
(pricing, CGU, offres commerciales, schémas de réponse publiés). Aucune sonde de masse, aucune
création de compte, aucun essai gratuit démarré (R2/E1). Zéro requête vers `autoscout24.be`/`.com`
(E5).

**Candidats du lot** (ordre d'instruction imposé par le mandat) : `C-31` (auto-api.com) → `C-22`
(Apify) → `C-25` (Piloterr) → `C-29` (Anysite.io) → `C-30` (Carapis) → `C-24` (ScrapingBee).

**Référentiel des 40 champs cibles** utilisé pour la couverture (source : `FINDING-allowed-surface.md`
§ 2.3, champs réellement observés dans une annonce AS24 sur la surface autorisée) :

1. `id` (UUID annonce) — 2. `details.webPage` (deeplink) — 3. `prices.public.amountInEUR.raw` —
4. `prices.public.amountInEUR.formatted` — 5. `prices.public.taxDeductible` — 6.
`prices.public.onRequestOnly` — 7. `prices.public.evaluation.category` (évaluation prix AS24) — 8.
`make.formatted` — 9. `model.formatted` — 10. `modelVersionInput` — 11. `type` (carrosserie) — 12.
`modelYear` — 13. `engine.power.kw.raw` — 14. `engine.power.hp.raw` — 15. `fuels.fuelCategory.raw`
— 16. `fuels.fuelCategory.formatted` — 17. `fuels.primary.source` — 18.
`consumption.combinedWithFallback` — 19. `co2emissionInGramPerKmWithFallback` — 20.
`condition.firstRegistrationDate` — 21. `condition.mileageInKm.raw` — 22.
`condition.numberOfPreviousOwnersExtended.raw` — 23. `usageState` — 24. `location.countryCode` —
25. `location.zip` — 26. `location.city` — 27. `seller.id` — 28. `seller.type` — 29.
`seller.companyName` — 30. `seller.contactName` (exclu par H3/RGPD côté KYCAR mais présent chez
AS24) — 31. `adProduct.tier` — 32. `media.images[]` — 33. `superDeal` — 34.
`publication.accurateState` — 35. `publication.isNew`.

Ce référentiel compte 35 champs nommés explicitement dans `FINDING-allowed-surface.md` (le document
source parle de « 40 champs » sans tous les nommer un par un) ; il est utilisé tel quel comme base
de comptage, marqué `[BASE ~35/40 nommés]` partout où il sert. C'est un choix méthodologique
documenté, pas un guessing : le mandat renvoie explicitement à § 2.3.

---

## Journal de preuve

*(rempli au fur et à mesure, un candidat après l'autre — ordre imposé)*

### C-31 — auto-api.com

| URL consultée | Date | Ce qui en a été tiré |
|---|---|---|
| `https://auto-api.com/` | 2026-09-07 | Positionnement : agrégateur multi-plateformes (« 100M+ listings », « 15+ platforms », « 50+ data fields »), couvre nommément Encar, Mobile.de, **AutoScout24**, Che168, Guazi, Dongchedi, Dubicars, Dubizzle, +9 autres. Endpoints listés : `/offers`, `/changes`, `/offer`, `POST /api/v1/offer/info`. Trois exports fichiers : `all_active`, `new_daily`, `removed_daily` (CSV/JSON/XLSX). Aucune page `/pricing` liée. Aucune mention de pays précis ni de volume pour AutoScout24 spécifiquement — seuls des chiffres agrégés toutes plateformes confondues. |
| `https://auto-api.com/documentation` | 2026-09-07 | `/changes` : flux delta documenté, paramètre requis `change_id`, retourne `change_type` ∈ {`added`, `changed`, `removed`}. **Aucune fréquence de rafraîchissement chiffrée n'est publiée** (« changes feed », sans SLA). Exports quotidiens confirmés : « fresh daily files available for download », séparateur `|` pour le CSV. **Aucun exemple JSON spécifique à AutoScout24** n'est publié dans la doc — l'exemple donné est pour Encar, avec des champs génériques (`inner_id`, `mark`, `model`, `year`, `price`, `km_age`, `engine_type`, `transmission_type`). Pas d'évaluation de prix mentionnée dans cet exemple. |
| `https://auto-api.com/pricing` | 2026-09-07 | **HTTP 404.** Aucune page de tarification publiée à cette adresse. |
| `https://auto-api.com/platforms` | 2026-09-07 | **HTTP 404.** Pas de page dédiée par plateforme. |
| `https://auto-api.com/terms-of-service` | 2026-09-07 | CGU lues. Usage autorisé cité : « market research, competitive analysis, inventory management », « creative applications ». **Aucune clause explicite** sur l'usage analytique interne, sur la revente/redistribution, ni sur la durée de conservation autorisée. Clause de non-garantie molle : « we recommend validating business-critical decisions with multiple data points » (données de marketplaces dynamiques, changent vite). Aucune clause d'indemnisation ou de transfert de responsabilité juridique liée à la collecte sur sites tiers protégés. |
| `https://auto-api.com/contacts` | 2026-09-07 | Pas de page de tarifs, pas de formulaire de devis en ligne, pas d'essai gratuit visible. Tarif obtenu uniquement sur contact direct (email `access@auto-api.com`, ~3 min de réponse annoncée ; Telegram `@autodatabase`, ~1 min). Aucune carte bancaire mentionnée à ce stade (le tarif lui-même n'étant pas public, impossible de savoir si l'essai/devis en exige une). |
| `https://auto-api.com/autoscout24` | 2026-09-07 | **Page dédiée trouvée** (absente de `/platforms`, atteinte par recherche indépendante). **Confirme explicitement que `/changes` et l'export quotidien complet s'appliquent à AutoScout24 nommément** : « Daily data exports with current content ready for download » et « changes feed (added/changed/removed) » sont énoncés sur la page spécifique à ce fournisseur, pas seulement au niveau produit générique. AutoScout24 y est décrit comme opérant « dans 18 pays depuis 1998 », **« over 2 million active listings »** au global — **la Belgique n'est toujours pas nommée** et aucun volume n'est ventilé par pays. Exemple JSON avec `"price_eur": 3490` (confirme un champ prix numérique en euros) mais **aucune évaluation/estimation de prix** dans cet exemple. Toujours aucun tarif : « Get API Access » renvoie vers le contact, « Access provided within 2 minutes » annoncé. |

**Verdict sur la question la plus discriminante** : **VRAIE.**
`auto-api.com` publie un endpoint `/changes` (delta added/changed/removed) et un export quotidien
complet (`all_active`/`new_daily`/`removed_daily`), et une page produit **dédiée à AutoScout24**
(`/autoscout24`, distincte de la doc générique) confirme explicitement que ces deux mécanismes lui
sont applicables — ce n'est donc pas seulement une promesse de plateforme, c'est une promesse
nommée pour ce fournisseur précis. Un snapshot belge quotidien, mécaniquement, y devient trivial
**si l'accès et le prix se confirment** — ce qui reste `[NON VÉRIFIÉ]` : aucune grille tarifaire
n'est publiée nulle part sur le site (voir plus bas), aucun volume belge n'est isolé (le chiffre
public est global, « 2M+ » toutes zones AS24 confondues sur 18 pays), et l'évaluation de prix AS24
n'apparaît dans aucun exemple consulté. **Ce candidat prend la tête du lot sur le critère mécanique
(delta + export complet, le plus net des 6)**, mais le classement définitif dépend d'un prix et
d'un volume BE que seul un contact commercial direct peut lever — reporté en
`ACTIONS-COMMANDITAIRE`.

**Frein rédhibitoire pour R5** : **aucune grille tarifaire n'est publiée**, ni en $/1000, ni en
abonnement, ni en crédit. Le prix est communiqué uniquement sur devis après contact commercial.
La normalisation R5 est donc **impossible à chiffrer pour ce candidat** — colonne `[NON VÉRIFIÉ —
tarif sur devis]` dans le tableau comparatif ci-dessous.

### C-22 — Apify (catalogue d'acteurs AutoScout24)

| URL consultée | Date | Ce qui en a été tiré |
|---|---|---|
| `https://apify.com/memo23/autoscout24-scraper` | 2026-09-07 | Tarification **pay-per-event** : **$0,90 / 1 000 résultats**, sans abonnement obligatoire ni facturation d'usage de plateforme séparée annoncée sur cette page. Schéma de sortie riche : prix (`prices.public.amountInEUR`, formaté et brut, fiscalité, négociabilité, **`evaluation` category** — la catégorie d'évaluation de prix AS24 **est présente**), specs véhicule (marque, modèle, carrosserie, année, km, carburant, transmission, puissance kW/hp, cylindrée, transmission intégrale, places, portes), état (première immatriculation, historique accident, propriétaires précédents), équipements catégorisés, médias (résolutions multiples, 360°, vidéo YouTube), vendeur (type, société, téléphones, email, localisation), localisation (pays, code postal, ville, rue, GPS), administratif (statut de publication, date de création, fourchette d'évaluation de prix, palier publicitaire, garantie). **Couverture : 9 domaines AS24** — Allemagne, Autriche, Luxembourg, Italie, Espagne, France, **Belgique**, Pays-Bas, plus `.com` pan-européen (Suisse `.ch` exclue, backend distinct). `maxItems` plafonne les résultats par run ; pas de plafond dur de pagination documenté pour une seule recherche au-delà des réglages standard. |
| `https://apify.com/solidcode/autoscout24-scraper/api` | 2026-09-07 | Tarification **pay-per-event**, deux chiffres relevés sur la page (incohérence de présentation entre le titre et la section tarifs détaillée) : **$0,75 / 1 000 résultats** (titre) vs **$3,00 / 1 000 annonces** (section tarification) — écart × 4 sur la même page, à traiter comme deux bornes distinctes, pas comme une valeur unique. Exemple de coût donné : 10 000 annonces ≈ 30 $. Frais de plateforme Apify (calcul/stockage) facturés séparément selon l'abonnement. Schéma : `listingId`, `make`, `model`, `variant`, `price`/`priceFormatted`, **`priceEvaluation`** (présente), `mileage`, `firstRegistration`, `fuelType`, `transmission`, `power`, vendeur (`sellerType`, `sellerName`, `contactName`, `phone`, `sellerRating`), localisation (`country`, `city`, `zipCode`, `street`). Couverture annoncée **« 18+ domaines »** incluant explicitement `.be` — plus large que memo23 (Pologne, Roumanie, Croatie en sus), mais nombre de pays incohérent avec le chiffre concurrent (9 vs 18+), signe que ces pages marketing ne sont pas des sources d'audit fiables au chiffre près. |
| `https://apify.com/automation-lab/autoscout24-scraper` | 2026-09-07 | Tarification **pay-per-event**, structure paliers : **« from $1,95 / 1 000 »**, mais avec un détail contradictoire relevé par l'outil de lecture — « $0,003 par annonce sur le plan gratuit, jusqu'à $0,0012 sur le plan Diamond (−60 %) », soit *plus bas* que le prix d'appel annoncé (0,003 $ × 1000 = 3 $, pas 1,95 $). Les 20 premières annonces sont gratuites sur tous les plans. Belgique **explicitement nommée**, dans les « 9 pays AS24 » (mêmes 9 que memo23). **`priceEvaluation`/`evaluation.category` absente** de ce schéma de sortie d'après la description — cet acteur ne sert pas l'évaluation de prix, contrairement à memo23 et solidcode. |
| `https://apify.com/terms-of-use` → redirigé vers `https://docs.apify.com/legal/general-terms-and-conditions` | 2026-09-07 | CGU plateforme Apify (s'appliquent par-dessus les CGU propres de chaque acteur, non lues séparément — hors budget). § 5.9 : les *Usage Data* (métriques d'utilisation) appartiennent exclusivement à Apify. § 5.8 : les *Customer Data* (i.e. les données extraites) restent à l'utilisateur, sous licence accordée à Apify pour opérer le service. § 5.2 interdit de reproduire/partager/distribuer *« the Website or the Services »* — formulation qui vise la plateforme Apify elle-même ; **elle ne tranche pas explicitement la revente des données extraites par l'acteur**, point à ne pas sur-interpréter. § 11.1 : la responsabilité légale de la source des données extraites (« *Customer Data that you are authorized to access* ») retombe sur l'utilisateur — Apify ne valide pas la légalité de la collecte. § 15.6 : suppression des données selon la politique de rétention d'Apify après résiliation, sans délai chiffré publié avant résiliation. |

**Verdict couverture** : les schémas des 3 acteurs consultés couvrent largement au-delà de 30 des
35 champs du référentiel `§ 2.3` — prix brut/formaté, évaluation de prix (2 acteurs sur 3), marque,
modèle, carrosserie, année, km, carburant, puissance, immatriculation, propriétaires précédents,
pays/code postal/ville, vendeur (type/société/contact), images, palier publicitaire, statut de
publication. C'est la **meilleure couverture nominale du lot**, avec un signal fort et vérifié :
`evaluation.category` / `priceEvaluation` est bien servi chez memo23 et solidcode.

**Verdict Belgique** : nommée explicitement chez les 3 acteurs consultés (9 pays chez memo23 et
automation-lab, « 18+ domaines » chez solidcode). Aucun volume BE isolé n'est publié — seuls des
volumes agrégés toutes recherches confondues sont visibles côté Apify Store (nombre d'exécutions,
pas nombre d'annonces).

**Verdict prix** : dispersion large et incohérences internes aux pages elles-mêmes (solidcode :
0,75 vs 3,00 $/1000 sur la même fiche ; automation-lab : 1,95 $ annoncé vs 3 $ recalculé depuis le
détail par annonce). Traité au tableau R5 comme une **fourchette bornée par candidat**, jamais une
valeur unique, pour ne pas donner une fausse précision.

### C-25 — Piloterr (`/v2/autoscout24/search` et `/v2/autoscout24/ad`)

| URL consultée | Date | Ce qui en a été tiré |
|---|---|---|
| `https://docs.piloterr.com/autoscout24-search` | 2026-09-07 | Endpoint `GET /v2/autoscout24/search`, coût **1 crédit / appel**. Champs documentés : marque, modèle, variante, carburant, transmission, kilométrage, cylindrée, type, prix, ville, code postal, code pays, vendeur (id, type, nom, société, téléphones), boîte de vitesses, année d'immatriculation, odomètre. **Puissance moteur absente du schéma documenté ; l'évaluation de prix AS24 (`evaluation.category`) est absente de CET endpoint précisément** — contredit l'hypothèse initiale du mandat pour `/search`. **19 domaines supportés** listés en clair : `.de, .be, .es, .fr, .it, .lu, .nl, .at, .bg, .cz, .com, .hr, .pl, .ro, .ru, .se, .com.tr, .com.ua, .hu` — **Belgique explicitement nommée**. Le nombre de résultats retournés par appel/crédit n'est pas documenté — point non tranché, dimensionnant pour R5 (voir plus bas). |
| `https://www.piloterr.com/library/autoscout24-search` | 2026-09-07 | Page produit : « 1 credit = 1 request ». Essai gratuit **« Start free (+500 credits) », aucune carte bancaire requise**. Pas d'exemple de schéma complet publié sur cette page (renvoie vers la doc technique). |
| `https://www.piloterr.com/library/autoscout24-ad` (recherche via WebSearch, la page produit `/product/autoscout24-search` a renvoyé HTTP 403 en accès direct) | 2026-09-07 | Endpoint `GET/POST /v2/autoscout24/ad` (détail d'une annonce par URL), **1 crédit / appel**. Un résumé indexé du site déclare explicitement : « The endpoint returns price **with market evaluation**, vehicle specs, seller info, images, and equipment » — ce qui confirme que **l'évaluation de prix AS24 est servie par `/ad`, mais pas par `/search`** (nuance par rapport au motif de lot qui l'attribuait au candidat globalement). La page elle-même, en lecture directe, ne publie pas d'exemple JSON détaillé ni ne confirme le nom exact du champ d'évaluation — donc `[NON VÉRIFIÉ — nom de champ exact]`, mais la présence fonctionnelle de l'évaluation est corroborée par deux sources indépendantes (résumé indexé + description produit). Essai gratuit identique (+500 crédits, sans CB). |
| `https://piloterr.com/pricing` | 2026-09-07 | Grille tarifaire complète : **Premium 49 $/mois = 18 000 crédits (7 req/s) ; Premium+ 99 $/mois = 40 000 crédits (10 req/s) ; Startup 249 $/mois = 110 000 crédits (15 req/s)**. Tarif « Standard API » (catégorie dont relèvent `/search` et `/ad`, ni JS rendering ni WebUnlocker) : **2,72 $/1000 crédits (Premium), 2,48 $/1000 (Premium+), 2,26 $/1000 (Startup)**. Essai gratuit confirmé ici aussi : +500 crédits, sans carte bancaire. |
| `https://www.piloterr.com/terms` | 2026-09-07 | CGU : aucune clause explicite sur l'usage analytique interne, la revente ou la durée de conservation. § 8 : Piloterr *« assumes that you use the […] Services legally and ethically and that you have obtained permission, if necessary »* — présomption de légalité posée sur l'utilisateur, pas de garantie donnée par Piloterr. § 9 : l'utilisateur doit indemniser Piloterr contre toute réclamation de tiers liée à son usage. Responsabilité légale de la collecte intégralement reportée sur le client. |

**Verdict couverture** : `/search` seul plafonne autour de 20-22 champs du référentiel (pas de
puissance moteur, pas d'évaluation de prix, pas d'image confirmée). `/ad` complète avec
l'évaluation de prix et vraisemblablement plus de champs (équipements, images) mais son schéma
détaillé n'a pas pu être lu directement (403 sur la page produit). Combinés, les deux endpoints
couvrent probablement 25-30 champs, mais ceci reste `[NON VÉRIFIÉ]` pour la partie `/ad` faute
d'accès direct au schéma.

**Point dimensionnant pour R5** : ni `/search` ni `/ad` ne documentent le nombre d'annonces
retournées par appel/crédit. Si `/search` retourne une page de résultats (typiquement ~20 annonces
comme observé sur la surface autorisée AS24 elle-même, `FINDING-allowed-surface.md` § 2.3), le
coût réel par annonce individuelle serait à diviser encore par ~20 par rapport au coût par crédit —
information non publiée, donc non extrapolée ici : signalé `[NON VÉRIFIÉ — ratio annonces/crédit]`.

### C-29 — Anysite.io (`POST /api/autoscout24/dealers/listings`)

| URL consultée | Date | Ce qui en a été tiré |
|---|---|---|
| `https://docs.anysite.io/api-reference/autoscout24/autoscout24dealerslistings` | 2026-09-07 | Endpoint `POST /api/autoscout24/dealers/listings` : récupère l'inventaire d'un concessionnaire AS24 par slug/URL. Paramètres : `dealer`, `count` (obligatoire, pas de plafond maximal explicite documenté), `timeout`, `article_type`, `sort`, `descending`. Authentification par header `access-token`. **Champs de réponse** : `id`, `url`, `make`, `model`, `model_group`, `variant`, `model_version`, `price`, `mileage_km`, `first_registration`, `power_kw`/`power_hp`, `fuel`, `transmission`, `body_type`, `displacement_cc`, `is_new`, `is_damaged`, `offer_type`, `image`/`images`, objet `seller` (contact, type), objet `location` (coordonnées géo). **Aucun champ d'évaluation de prix AS24 documenté** — seul le prix brut est servi. **Tarification en crédits mentionnée sur cette page précise** : « 20 crédits par 20 résultats » → **1 crédit = 1 annonce** pour cet endpoint spécifiquement, ratio propre le plus explicite du lot. Aucun exemple pour un domaine `.be` particulier ; le mécanisme est générique par concessionnaire, pas par pays. |
| `https://anysite.io/pricing/` | 2026-09-07 | Grille tarifaire (lue en direct, plus fiable que le résumé indexé de la recherche qui donnait des chiffres différents — Starter 49 $/700 crédits selon l'index vs les chiffres ci-dessous en lecture directe, écart non résolu, à noter comme instabilité de la page marketing) : **Starter 49 $/mois = 15 000 crédits ; Growth 200 $/mois = 100 000 ; Scale 300 $/mois = 190 000 ; Pro 549 $/mois = 425 000 ; Enterprise 1 199 $/mois = 1 200 000.** Recharge à la demande (pay-as-you-go) : **2,90 $ / 1 000 crédits**, minimum 20 $, abonnement actif requis. Aucun coût par endpoint spécifique republié sur cette page (renvoi vers la doc technique, qui elle donne le ratio pour AS24). |

**Verdict couverture** : ~19 champs identifiés contre le référentiel, sans évaluation de prix — le
plus faible des 3 candidats déjà instruits sur cet axe.

**Verdict prix (le plus directement chiffrable du lot)** : le ratio 1 crédit = 1 annonce, combiné à
la recharge PAYG à 2,90 $/1000 crédits, donne un prix **directement lisible en $/1000 annonces :
2,90 $** en PAYG, et **3,27 $/1000 au plan Starter (49 $ / 15 000 crédits)**, décroissant jusqu'à
**1,00 $/1000 au plan Enterprise (1 199 $ / 1 200 000 crédits)**. C'est le seul candidat du lot dont
le prix par annonce se déduit sans hypothèse sur le nombre de résultats par appel.

**CGU** : non lues séparément pour Anysite dans cette phase — quota du lot concentré sur les
tarifs et schémas des 6 candidats désignés ; à noter en inconnue résiduelle.

### C-30 — Carapis (parseur AS24 multi-marchés)

| URL consultée | Date | Ce qui en a été tiré |
|---|---|---|
| `https://docs.carapis.com/parsers/autoscout24.com/api-reference` | 2026-09-07 | **Échec technique** : `getaddrinfo ENOTFOUND docs.carapis.com` — le sous-domaine `docs.` n'a pas résolu depuis l'environnement de la sonde au moment du test. Contournement : page produit sur le domaine principal. |
| `https://carapis.com/platforms/western-europe/autoscout24` | 2026-09-07 | Page produit lue avec succès. Modèle tarifaire non détaillé ici, renvoi vers `/pricing`. Champs annoncés par groupe : identité (marque, modèle, finition, année, date d'immatriculation), spécifications (puissance kW/PS, carburant, norme d'émission, transmission, équipements), état (kilométrage), prix (« tarif annoncé » seul — **aucune évaluation de prix AS24 mentionnée**), contexte (concessionnaire, localisation, galerie photo). **« 18 marchés » annoncés sans liste nommée** — Allemagne, Italie, Espagne, France et « pays nordiques » cités en exemples, **la Belgique n'est pas nommée explicitement** sur cette page. Distinction `.com`/`.ch` confirmée : `.com` = plateforme principale (~46,6 M visites/mois annoncées), `.ch` = site suisse séparé, même groupe — cohérent avec la distinction déjà actée dans le registre (`candidates-final.md`, C-30). Aucun volume par marché, aucun plafond de pagination documenté sur cette page. |
| `https://carapis.com/pricing` | 2026-09-07 | Trois plans : **Starter 99 $/mois (ou 950 $/an) — 10 000 appels API/mois, accès à 5 marketplaces au choix ; Professional 299 $/mois (ou 2 870 $/an) — 100 000 appels API/mois, accès à plus de 200 marketplaces ; Enterprise — sur devis, appels illimités.** Essai gratuit **14 jours, sans carte bancaire**, accès complet aux fonctionnalités du plan choisi. Réductions annoncées par recherche complémentaire (non vérifiées en détail ici) : -20 % concessionnaires européens enregistrés, -50 % programme startup, remises volume Enterprise. |

**Verdict couverture** : ~13-15 champs identifiés contre le référentiel — la **couverture la plus
faible du lot** parmi les candidats déjà instruits, et pas d'évaluation de prix.

**Verdict prix** : « appel API » n'est **pas défini comme équivalent à une annonce** dans la
documentation lue — s'il correspond à une page de résultats plutôt qu'à un enregistrement unitaire,
le prix par annonce serait bien inférieur au calcul naïf. Calcul naïf (1 appel = 1 annonce, hypothèse
**non confirmée**, affichée comme borne haute) : Starter 99 $/10 000 = **9,90 $/1000** ; Professional
299 $/100 000 = **2,99 $/1000**. Signalé `[NON VÉRIFIÉ — ratio annonces/appel]`, le plus incertain
des 4 chiffrages de prix obtenus jusqu'ici dans ce lot.

**Belgique** : non nommée sur les pages consultées — seul le total « 18 marchés » est publié.

### C-24 — ScrapingBee (page produit « AutoScout24 API »)

| URL consultée | Date | Ce qui en a été tiré |
|---|---|---|
| `https://www.scrapingbee.com/scrapers/autoscout24-api/` | 2026-09-07 | **Verdict tranché sur la question du mandat** : ce n'est **pas** un endpoint dédié à AutoScout24 avec schéma propre. C'est une **page marketing générique** au-dessus de l'API HTML/rendu générale de ScrapingBee : l'utilisateur fournit lui-même l'URL AS24 cible et utilise `render_js=true` plus `extract_rules` (sélecteurs CSS) ou `ai_extract_rules` (langage naturel) pour structurer la sortie — **aucun schéma de champs propre à AutoScout24 n'est publié ni garanti**, et aucun exemple de réponse JSON concret n'est montré sur la page. Belgique **non mentionnée**. Essai gratuit : **1 000 crédits gratuits, sans carte bancaire**. |
| `https://www.scrapingbee.com/pricing/` | 2026-09-07 | Plans mensuels : **Hobby 19 $/75 000 crédits ; Freelance 49 $/250 000 ; Startup 99 $/1 000 000 ; Business 249 $/3 000 000 ; Business+ 599 $/8 000 000.** Coût unitaire décroissant avec le plan (19$/75k ≈ 0,253 $/1000 crédits ; 599$/8M ≈ 0,075 $/1000 crédits), mais le coût par *requête* dépend en plus des options activées (voir ligne suivante) — la page pricing seule ne suffit pas à chiffrer un coût par annonce. |
| `https://help.scrapingbee.com/en/article/credit-system-explained-1h2ackp/` | 2026-09-07 (contenu daté du 07/08/2026 par la source elle-même) | Grille de coût par requête, publiée et datée : **proxy classique sans JS = 1 crédit ; proxy classique avec JS = 5 ; proxy premium sans JS = 10 ; proxy premium avec JS = 25 ; proxy stealth = 75.** Un site protégé par Akamai (le cas d'AS24, cookies `_abck`/`ak_bmsc` déjà documentés ailleurs dans le registre) nécessite vraisemblablement au minimum le palier **premium + JS (25 crédits)**, voire **stealth (75 crédits)** pour une fiabilité réelle — choix non tranchable sans essai réel, donc traité comme une fourchette. |

**Verdict couverture** : **non chiffrable** — aucun schéma de champs publié pour AutoScout24
spécifiquement ; la couverture dépend entièrement des `extract_rules` que l'utilisateur écrirait
lui-même. `0/40` au sens strict de « champs publiés par le fournisseur », bien que la donnée brute
HTML contienne potentiellement tous les champs si l'utilisateur sait où les extraire (mérite d'être
noté, sans être compté comme couverture prouvée).

**Verdict prix** : dépend de trois inconnues combinées — (a) le palier de proxy requis pour
franchir Akamai (25 ou 75 crédits/requête, `[NON VÉRIFIÉ]`), (b) le nombre d'annonces obtenues par
requête si l'on cible une page de recherche plutôt qu'une page de détail (`[NON VÉRIFIÉ]`), (c) le
plan d'abonnement retenu. Ceci en fait le candidat du lot dont le prix par 1000 annonces est **le
plus large en fourchette et le moins directement vérifiable**, malgré une grille de crédits par
requête, elle, parfaitement publiée et datée.

**CGU** : non lues séparément dans cette phase (quota du lot concentré sur les 6 fournisseurs
désignés) ; inconnue résiduelle.

---

## Tableau comparatif des coûts, normalisé R5

**Hypothèse de volumétrie explicite pour la colonne « € / mois »** : rafraîchissement quotidien
complet du périmètre belge, estimé à **~115 000 annonces** (référence citée dans
`candidates-final.md`, section LOT-M, comme volume AS24 BE de référence). En l'absence de mécanisme
de delta confirmé et chiffré chez la quasi-totalité des candidats de ce lot, l'hypothèse retenue est
le **cas défavorable** : une ré-extraction complète du périmètre chaque jour, soit
**115 000 × 30 = 3 450 000 annonces-équivalent par mois**. Calcul affiché pour chaque candidat :
`€/mois = (€/1000 annonces) × 3 450`. Taux de change utilisé pour les prix publiés en dollars :
**1 USD ≈ 0,92 EUR, hypothèse affichée, non vérifiée en temps réel** — à traiter comme un ordre de
grandeur, pas une valeur d'audit financier.

| Fournisseur | € / 1 000 annonces (calcul, source) | € / mois — rafraîchissement quotidien BE (115 000 annonces/j × 30) | Remarque clé |
|---|---|---|---|
| **C-31 auto-api.com** | **`[NON VÉRIFIÉ — aucun tarif publié]`** — pas de page `/pricing`, tarif uniquement sur devis. | Non calculable. | Seul candidat à documenter un delta (`/changes`) confirmé pour AS24 : *si* le tarif se négocie sur la base du delta plutôt que du volume total, le calcul ci-dessus (pensé pour une ré-extraction complète) ne s'applique même pas — structurellement le moins cher *si* le delta quotidien réel est petit devant 115 000. Mais aucun chiffre n'existe pour le vérifier. |
| **C-22 Apify — memo23** | 0,90 $ → **≈ 0,83 €** (source : page acteur, pay-per-event) | 0,83 × 3 450 ≈ **2 863 €/mois** | Seul acteur du lot à combiner prix connu + couverture large + évaluation de prix confirmée + Belgique nommée. |
| **C-22 Apify — solidcode** | 0,75 $ à 3,00 $ → **≈ 0,69 € à 2,76 €** (deux chiffres incohérents sur la même page, affichés en fourchette) | 0,69×3450 ≈ **2 380 €** à 2,76×3450 ≈ **9 522 €/mois** | Fourchette large : la page elle-même se contredit (titre vs section tarifs). |
| **C-22 Apify — automation-lab** | « from » 1,95 $ à 3,00 $ recalculé → **≈ 1,79 € à 2,76 €** | ≈ **6 176 € à 9 522 €/mois** | Pas d'évaluation de prix dans ce schéma — moins complet que memo23/solidcode. |
| **C-25 Piloterr** (`/search` + `/ad`, palier Standard API) | 2,26 $ à 2,72 $ (par 1000 **crédits**, 1 crédit = 1 requête) → **≈ 2,08 € à 2,50 €**, **`[NON VÉRIFIÉ — ratio annonces/requête]`** : si `/search` renvoie une page de ~20 annonces par crédit comme la surface autorisée AS24 elle-même (`FINDING-allowed-surface.md` § 2.3), le coût réel par annonce serait ÷20, soit ≈ 0,10 à 0,13 €/1000. | Borne haute (1 crédit = 1 annonce) : ≈ **7 176 € à 8 625 €/mois**. Borne basse plausible (1 crédit = page de 20) : ≈ **359 € à 431 €/mois**. Écart × 20 non tranché. | Le candidat dont le prix affiché est le plus trompeur sans connaître le ratio requête/annonce — priorité de clarification en `ACTIONS-COMMANDITAIRE`. |
| **C-29 Anysite.io** (endpoint `dealers/listings`, ratio **confirmé** 1 crédit = 1 annonce) | PAYG 2,90 $ → **≈ 2,67 €** (le plus fiable du lot, ratio publié noir sur blanc) ; plans par abonnement de 3,27 $ (Starter) à 1,00 $ (Enterprise) → **≈ 3,01 € à 0,92 €** | PAYG : 2,67×3450 ≈ **9 212 €/mois**. Plan Enterprise (si le volume mensuel de 1,2 M crédits inclus suffisait — il ne suffit pas, 3,45 M requis) : ≈ **3 174 €/mois** pour la part couverte par l'abonnement, le reste (2,25 M crédits) en PAYG à 2,90 $/1000 ≈ 6 003 €, total combiné ≈ **9 177 €/mois** — même ordre de grandeur que le PAYG pur : aucune économie d'échelle significative à ce volume. | Mécanique par **concessionnaire**, pas par recherche de marché : inadapté tel quel au mode 1 de KYCAR (vue de marché), utile seulement en agrégeant de nombreux concessionnaires un par un. |
| **C-30 Carapis** | Starter 9,90 $, Professional 2,99 $ (par 1000 **appels API**, ratio annonces/appel **`[NON VÉRIFIÉ]`**) → **≈ 9,11 € et 2,75 €** | Professional (naïf) : 2,75×3450 ≈ **9 488 €/mois**, mais le plan Professional n'inclut que 100 000 appels/mois — trop court d'un facteur ~34 pour couvrir 3,45 M/mois, donc ce chiffre suppose un contrat volume/Enterprise non publié. | Couverture la plus faible du lot, Belgique non nommée : candidat le moins avancé du lot sur les trois axes (prix, champs, géographie). |
| **C-24 ScrapingBee** | **Non chiffrable** — dépend de 3 inconnues combinées (palier de proxy nécessaire pour Akamai : 25 ou 75 crédits/requête ; nombre d'annonces par requête ; plan d'abonnement). Borne théorique la plus large : de 0,075 $/1000 crédits (Business+) × 25 crédits/requête = 1,875 $/1000 requêtes, à 0,253 $/1000 crédits (Hobby) × 75 crédits/requête = 18,975 $/1000 requêtes — et ceci est un prix **par requête**, pas par annonce. | Non calculable sans hypothèse supplémentaire non fournie par le fournisseur. | Ce n'est pas un produit dédié AS24 : la page est une façade marketing sur l'API générique. Verdict tranché plus haut. |

**Lecture d'ensemble** : sur les points de prix directement comparables (C-22 dans ses 3 variantes,
C-25 en borne haute, C-29, C-30 en calcul naïf), les valeurs **€/1000 annonces** se situent
majoritairement entre **0,69 € et 2,76 €**, avec deux valeurs hautes isolées (Carapis Starter à
9,11 €, Anysite PAYG/Piloterr borne haute autour de 2,5-2,9 €). La **médiane** des 6 valeurs les
plus directement publiées (0,83 ; 0,69 ; 1,79 ; 2,08 ; 2,67 ; 2,75) est **≈ 1,94 €/1000 annonces**,
nettement sous le seuil de 5 €/1000 posé par la question falsifiable n° 3. Traduit en coût mensuel
pour le périmètre BE sous l'hypothèse défavorable (pas de delta, ré-extraction complète
quotidienne), l'ordre de grandeur observé pour les candidats structurés en JSON est de
**2 400 € à 9 500 € par mois** — un delta fonctionnel comme celui promis par `auto-api.com`,
*s'il se confirme et se chiffre*, changerait cet ordre de grandeur de façon spectaculaire, ce qui
est exactement l'enjeu de la question la plus discriminante du lot.

---

## Couverture des champs

Comptage contre le référentiel `[BASE ~35/40 nommés]` défini en tête de document (source :
`FINDING-allowed-surface.md` § 2.3).

| Fournisseur | Champs couverts / 35 (estimation par lecture de la doc, `documenté` non `prouvé`) | Évaluation de prix AS24 servie ? |
|---|---|---|
| C-31 auto-api.com | ~10-12 (générique, exemple donné pour Encar pas AS24 ; un seul champ prix confirmé pour AS24, `price_eur`) | **Non** — absente de l'exemple AS24 consulté. |
| C-22 Apify — memo23 | **~28-30**, la meilleure couverture nominale du lot | **Oui** — `evaluation` category présente et documentée. |
| C-22 Apify — solidcode | ~18-20 | **Oui** — `priceEvaluation` présente et nommée. |
| C-22 Apify — automation-lab | ~15-17 | **Non** — absente du schéma documenté. |
| C-25 Piloterr `/search` seul | ~18-20 | **Non** sur `/search`. |
| C-25 Piloterr `/search` + `/ad` combinés | ~25-28 (estimation, `/ad` non lu en détail — 403) | **Oui sur `/ad`** — corroboré par deux sources indépendantes, nom exact du champ `[NON VÉRIFIÉ]`. |
| C-29 Anysite.io | ~19 | **Non** — seul le prix brut est servi. |
| C-30 Carapis | ~13-15, la plus faible du lot | **Non** — seul le « tarif annoncé » est servi. |
| C-24 ScrapingBee | **Non chiffrable** — aucun schéma propre, dépend des `extract_rules` que le client écrirait lui-même. | **Indéterminé** — dépend entièrement de l'implémentation client. |

**Meilleure couverture obtenue dans le lot** : **Apify / memo23**, avec l'évaluation de prix AS24
servie de surcroît — c'est le seul candidat qui coche simultanément « large couverture » et
« évaluation de prix », les deux axes demandés par le mandat.

---

## Candidats

### C-31 — auto-api.com

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Coût d'amorçage | `[NON VÉRIFIÉ]` — aucun essai gratuit publié, aucun tarif d'entrée visible | documenté (absence) |
| A2 Coût récurrent | `[NON VÉRIFIÉ]` — aucune grille tarifaire publiée ; voir tableau R5 | documenté (absence) |
| A3 Couverture champs | ~10-12/35, `documenté` (exemple générique Encar, pas AS24) | documenté |
| A4 Couverture géo | Mondiale annoncée (« 18 pays depuis 1998 » pour AS24 elle-même) ; **Belgique non nommée**, aucun volume par pays | documenté |
| A5 Latence | `[NON VÉRIFIÉ]` | — |
| A6 Débit/quota | `[NON VÉRIFIÉ]` | — |
| A7 Stabilité technique | argumenté 3/5 — produit établi (multi-plateformes, doc mature) mais AS24 n'y est pas mis en avant nommément, risque que ce backend soit moins prioritaire pour le fournisseur | argumenté |
| A8 Résistance anti-bot | le fournisseur (produit géré, promesse implicite), non prouvé par test | argumenté |
| A9 Effort d'intégration | estimé 1-2 j — schéma JSON générique probable, mais aucun exemple AS24 précis pour calibrer un parseur | estimé |
| A10 Coût de maintenance | argumenté faible — fournisseur absorbe la casse | argumenté |
| A11 Exposition juridique | 4/5 — extraction et revente de tout ou partie de la base AS24 par un tiers non-signataire, exposé au droit *sui generis* (Directive 96/9/CE) et aux CGU consommateur AS24 non lues ; CGU du fournisseur lui-même silencieuses sur la revente/conservation | argumenté |
| A12 Autonomie | oui — dépendance totale à un fournisseur tiers dont on ne connaît même pas le prix | documenté |
| A13 Plafond de volumétrie | `[NON VÉRIFIÉ]` — export quotidien complet suppose l'absence de plafond mais aucun chiffre publié | documenté (partiel) |
| A14 Fraîcheur atteignable | **potentiellement quotidienne par construction** si le delta et l'export se confirment au prix annoncé — meilleur axe du candidat | argumenté |

**Verdict : VIABLE SOUS CONDITION.** La mécanique (delta + export quotidien complet, confirmée
nommément pour AS24) est la plus prometteuse du lot pour un snapshot BE praticable. La condition
bloquante est double et non levée par la documentation publique : **le prix** (aucune grille, tarif
sur devis) et **le volume/couverture belge** (aucun chiffre par pays). Inconnues restantes : prix,
volume BE, fréquence réelle du flux `/changes`, exhaustivité du schéma AS24 (l'exemple lu est
générique Encar).

### C-22 — Apify (catalogue d'acteurs, 3 instruits sur les 6 recensés par `candidates-final.md`)

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Coût d'amorçage | pay-per-event sans abonnement minimum obligatoire annoncé sur les 3 pages ; montant exact d'un crédit d'essai Apify générique `[NON VÉRIFIÉ]` dans cette phase (hors des 3 pages ciblées) | documenté (partiel) |
| A2 Coût récurrent | 0,69 à 2,76 €/1000 selon l'acteur — voir tableau R5 | documenté |
| A3 Couverture champs | ~15 à ~30/35 selon l'acteur — memo23 en tête | documenté |
| A4 Couverture géo | 9 à 18+ domaines AS24 selon l'acteur ; **Belgique nommée par les 3** | documenté |
| A5 Latence | `[NON VÉRIFIÉ]` (aucun test réel exécuté, R2/R3) | — |
| A6 Débit/quota | `maxItems` paramétrable par run, pas de plafond dur documenté au-delà des réglages standard | documenté |
| A7 Stabilité technique | argumenté 3/5 — marché Apify mature, plusieurs acteurs concurrents sur la même cible signe une demande réelle et un historique de maintenance actif, mais pas de mesure directe de casse dans cette phase | argumenté |
| A8 Résistance anti-bot | le fournisseur (acteur géré), non prouvé par test dans cette phase | argumenté |
| A9 Effort d'intégration | estimé 0,5-1 j — schéma JSON structuré et documenté, proche du référentiel cible | estimé |
| A10 Coût de maintenance | argumenté faible — la casse est absorbée par le mainteneur de l'acteur, pas par KYCAR | argumenté |
| A11 Exposition juridique | 4/5 — même mécanisme que `C-31` (extraction + mise à disposition tierce d'un sous-ensemble de la base AS24) ; CGU plateforme Apify reportent la responsabilité légale sur l'utilisateur (§ 11.1) | argumenté |
| A12 Autonomie | oui | documenté |
| A13 Plafond de volumétrie | non documenté au-delà de `maxItems` réglable | documenté (partiel) |
| A14 Fraîcheur atteignable | à la demande — pas de mécanisme de delta documenté chez ces 3 acteurs, fraîcheur = fréquence de relance payante par le client | argumenté |

**Verdict : VIABLE SOUS CONDITION.** Le candidat le **plus solide du lot sur le plan documentaire**
— prix publié (avec dispersion), Belgique nommée par les 3 acteurs consultés, couverture large,
évaluation de prix AS24 confirmée chez 2 acteurs sur 3. La condition qui empêche un `VIABLE` sans
réserve est l'absence de tout test réel (interdit par R2/R3 dans cette phase documentaire) et une
exposition juridique non négligeable (A11 = 4/5) commune à tout le lot. Inconnues restantes :
fiabilité réelle en production, volume BE exact atteignable par run, texte complet des CGU propres
à chaque acteur (non lues, seules les CGU plateforme Apify l'ont été).

### C-25 — Piloterr

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € — essai gratuit +500 crédits, sans carte bancaire, confirmé sur 2 pages indépendantes | documenté |
| A2 Coût récurrent | 2,08 à 2,50 €/1000 (borne haute, ratio 1 crédit=1 annonce non confirmé) à 0,10-0,13 €/1000 (borne basse si 1 crédit = page de ~20) | documenté avec réserve majeure |
| A3 Couverture champs | ~18-20 sur `/search` seul, ~25-28 combiné avec `/ad` (estimation, `/ad` non lu en détail) | documenté (partiel) |
| A4 Couverture géo | 19 domaines nommés en clair, **Belgique explicitement listée** | documenté |
| A5 Latence | `[NON VÉRIFIÉ]` | — |
| A6 Débit/quota | 7 à 15 req/s selon plan (documenté) | documenté |
| A7 Stabilité technique | argumenté 3/5 — produit avec doc structurée et plans payants matures | argumenté |
| A8 Résistance anti-bot | le fournisseur, non prouvé par test | argumenté |
| A9 Effort d'intégration | estimé 1 j — deux endpoints à orchestrer (`/search` puis `/ad` pour l'évaluation), schéma partiellement documenté | estimé |
| A10 Coût de maintenance | argumenté faible | argumenté |
| A11 Exposition juridique | 4/5 — même mécanisme ; CGU Piloterr placent explicitement la responsabilité légale sur l'utilisateur (§ 8-9) | argumenté |
| A12 Autonomie | oui | documenté |
| A13 Plafond de volumétrie | `[NON VÉRIFIÉ]` — pagination de `/search` non documentée | documenté (absence) |
| A14 Fraîcheur atteignable | à la demande, pas de delta documenté | argumenté |

**Verdict : VIABLE SOUS CONDITION.** Le candidat dont l'essai gratuit est le **plus net à activer**
(carte bancaire non requise, confirmé deux fois) — recommandé en premier en
`ACTIONS-COMMANDITAIRE` précisément parce qu'il lèverait l'inconnue la plus dimensionnante de tout
le lot : le ratio annonces/crédit, qui fait varier le coût mensuel BE d'un facteur **20** dans cette
instruction documentaire. Inconnues restantes : ratio annonces/crédit, schéma exact de `/ad`, nom
exact du champ d'évaluation.

### C-29 — Anysite.io

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Coût d'amorçage | free tier annoncé par une source indexée (100 crédits/mois) `[NON VÉRIFIÉ]` en lecture directe dans cette phase | documenté (partiel) |
| A2 Coût récurrent | 0,92 à 3,01 €/1000 selon plan ; 2,67 €/1000 en PAYG — le ratio annonces/crédit est ici le seul du lot **confirmé noir sur blanc** (« 20 crédits pour 20 résultats ») | documenté, ratio prouvé par la doc |
| A3 Couverture champs | ~19/35, pas d'évaluation de prix | documenté |
| A4 Couverture géo | mécanisme par **concessionnaire**, indépendant d'un paramètre pays ; aucun exemple `.be` fourni | documenté (partiel) |
| A5 Latence | `[NON VÉRIFIÉ]` | — |
| A6 Débit/quota | `count` sans plafond maximal explicite documenté | documenté (partiel) |
| A7 Stabilité technique | argumenté 3/5 | argumenté |
| A8 Résistance anti-bot | le fournisseur | argumenté |
| A9 Effort d'intégration | estimé 1-2 j — l'objet servi est un stock par concessionnaire, pas une recherche de marché : nécessite une couche d'agrégation supplémentaire pour servir le mode 1 de KYCAR | estimé |
| A10 Coût de maintenance | argumenté faible pour l'extraction elle-même, mais coût d'orchestration (lister puis interroger de nombreux concessionnaires) à charge de KYCAR | argumenté |
| A11 Exposition juridique | 4/5 — même mécanisme | argumenté |
| A12 Autonomie | oui | documenté |
| A13 Plafond de volumétrie | non plafonné par recherche documentée, mais l'unité native est le concessionnaire, pas le marché | documenté |
| A14 Fraîcheur atteignable | à la demande, pas de delta documenté | argumenté |

**Verdict : VIABLE SOUS CONDITION**, avec une réserve structurelle propre à ce candidat : son objet
natif est le **stock d'un concessionnaire nommé**, pas une recherche de marché — il faudrait
d'abord constituer un répertoire de concessionnaires BE puis les interroger un par un, ce qui le
rapproche de la famille `LOT-M` (découverte côté concessionnaire) plus que d'un scraper de marché
classique. C'est en revanche le prix le **plus directement vérifiable** de tout le lot grâce au
ratio crédit/annonce publié explicitement.

### C-30 — Carapis

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € pendant 14 jours, sans carte bancaire, confirmé | documenté |
| A2 Coût récurrent | 2,75 à 9,11 €/1000 (calcul naïf, ratio annonces/appel `[NON VÉRIFIÉ]`) | documenté avec réserve majeure |
| A3 Couverture champs | ~13-15/35, la plus faible du lot | documenté |
| A4 Couverture géo | « 18 marchés » annoncés sans liste nommée ; **Belgique non nommée** | documenté (absence) |
| A5 Latence | `[NON VÉRIFIÉ]` | — |
| A6 Débit/quota | 10 000 ou 100 000 appels/mois selon plan | documenté |
| A7 Stabilité technique | argumenté 3/5 | argumenté |
| A8 Résistance anti-bot | le fournisseur | argumenté |
| A9 Effort d'intégration | estimé 1-2 j | estimé |
| A10 Coût de maintenance | argumenté faible | argumenté |
| A11 Exposition juridique | 4/5 — même mécanisme | argumenté |
| A12 Autonomie | oui | documenté |
| A13 Plafond de volumétrie | plafonné par appels/mois (10k-100k), sévère au regard des 115 000 annonces/j visées | documenté |
| A14 Fraîcheur atteignable | à la demande, pas de delta documenté | argumenté |

**Verdict : VIABLE SOUS CONDITION, le plus faible du lot sur 3 axes cumulés** (couverture, prix
chiffrable, Belgique nommée). Le sous-domaine `docs.carapis.com` n'a de surcroît pas résolu au
moment de la sonde (`ENOTFOUND`), ce qui a limité la lecture directe du schéma de réponse à une page
de contournement moins détaillée — inconnue résiduelle à lever en priorité si ce candidat devait
être retenu.

### C-24 — ScrapingBee

| Axe | Valeur | Niveau de preuve |
|---|---|---|
| A1 Coût d'amorçage | 0 € — 1000 crédits gratuits, sans carte bancaire, confirmé | documenté |
| A2 Coût récurrent | non chiffrable en €/1000 annonces (3 inconnues combinées) ; grille de crédits/requête, elle, publiée et datée | documenté (partiel) |
| A3 Couverture champs | non chiffrable — aucun schéma propre à AS24 | documenté (absence) |
| A4 Couverture géo | aucune, produit générique | documenté (absence) |
| A5 Latence | annoncée « 1-5 s » par la page marketing, non mesurée indépendamment | `[NON VÉRIFIÉ]` (source marketing) |
| A6 Débit/quota | dépend du plan (crédits/mois), pas de règle spécifique à AS24 | documenté |
| A7 Stabilité technique | argumenté 2/5 — le client porte l'intégralité du travail de maintenance des `extract_rules`, contrairement aux autres candidats du lot | argumenté |
| A8 Résistance anti-bot | **partagée** — le fournisseur gère la couche proxy/JS, mais c'est le **client** qui doit choisir et payer le bon palier (classique/premium/stealth), donc une partie du risque anti-bot reste à sa charge, contrairement aux autres candidats | argumenté |
| A9 Effort d'intégration | estimé 2-3 j — écriture et maintenance des `extract_rules`/`ai_extract_rules` par KYCAR, aucun schéma prêt à l'emploi | estimé |
| A10 Coût de maintenance | argumenté plus élevé que le reste du lot — la casse du sélecteur/de l'extraction retombe sur KYCAR, pas sur le fournisseur | argumenté |
| A11 Exposition juridique | 4/5 — même mécanisme sous-jacent (extraction automatisée de la base AS24), sans le confort d'un schéma dédié qui aurait pu signaler une relation contractuelle ou une garantie plus poussée avec la cible | argumenté |
| A12 Autonomie | oui | documenté |
| A13 Plafond de volumétrie | non documenté, générique | documenté (absence) |
| A14 Fraîcheur atteignable | à la demande, pas de delta | argumenté |

**Verdict : NON VIABLE en l'état pour l'usage visé par ce lot** (« fournisseur à endpoint AS24
dédié ») — la question du mandat était justement de vérifier si un endpoint dédié existe
réellement ou s'il s'agit d'une façade marketing : **c'est une façade**. Le produit sous-jacent
(API HTML générique + règles d'extraction) reste utilisable en théorie, mais alors ScrapingBee sort
du périmètre de ce lot et rejoint la famille générique déjà couverte par `LOT-G` (Scrape.do,
Bright Data, Oxylabs et consorts), qui documente déjà ce type d'offre.

---

## Questions falsifiables

1. **« `auto-api.com` sert un delta (`/changes`) et un export quotidien complet, ce qui rend un
   snapshot BE trivial. »** → **VRAIE.** Source : `https://auto-api.com/documentation` et surtout
   `https://auto-api.com/autoscout24` (page dédiée), qui nomme explicitement AutoScout24 pour les
   deux mécanismes. Réserve : « trivial » suppose un prix et un volume BE praticables, tous deux
   `[NON VÉRIFIÉ]` faute de grille tarifaire publique.

2. **« Au moins un fournisseur documente la Belgique nommément et un volume BE. »** → **FAUSSE**,
   au sens strict de la question posée (nom **et** volume). La Belgique est nommée explicitement
   par 3 des 6 candidats (`C-22` — les 3 acteurs Apify consultés — et `C-25` Piloterr), mais
   **aucun des 6 fournisseurs ne publie de volume d'annonces spécifique à la Belgique** : tous les
   chiffres de volume trouvés (« 100M+ listings », « 2M+ active listings », etc.) sont globaux,
   toutes plateformes ou tous pays confondus.

3. **« Le prix médian du marché est inférieur à 5 € / 1 000 annonces. »** → **VRAIE.** Sur les 6
   valeurs les plus directement publiées et comparables (memo23 0,83 € ; solidcode 0,69 € ;
   automation-lab 1,79 € ; Piloterr borne haute 2,08 € ; Anysite PAYG 2,67 € ; Carapis Professional
   naïf 2,75 €), la médiane est **≈ 1,94 €/1000 annonces**, nettement sous le seuil. Seule une
   valeur isolée (Carapis Starter naïf, 9,11 €) le dépasse largement, et elle repose sur un ratio
   annonces/appel non confirmé.

4. **« Les CGU d'au moins un fournisseur autorisent l'usage analytique interne. »** → **VRAIE, avec
   nuance.** Les CGU de `auto-api.com` autorisent explicitement l'usage des données pour
   « market research, competitive analysis, inventory management » — fonctionnellement équivalent
   à un usage analytique interne, sans reprendre la formule exacte. Aucune des autres CGU lues
   (Apify plateforme, Piloterr) ne l'autorise ni ne l'interdit explicitement ; elles sont **silencieuses**
   sur ce point précis et concentrent leurs clauses sur le report de responsabilité légale vers
   l'utilisateur plutôt que sur la définition des usages autorisés.

5. **« Les réponses publiées couvrent au moins 20 des 40 champs cibles, évaluation de prix AS24
   incluse (`C-25`). »** → **NON TRANCHÉE pour `C-25` spécifiquement.** `/search` seul ne dépasse
   pas ~20 champs et ne sert pas l'évaluation ; `/ad` la sert d'après un résumé indexé mais le
   schéma détaillé n'a pas pu être lu en direct (403 sur la page produit), donc le nombre exact de
   champs combiné et le nom exact du champ d'évaluation restent non confirmés de première main.
   **La question est en revanche VRAIE pour le lot pris dans son ensemble** : `C-22` (Apify,
   memo23 et solidcode) dépasse 20 champs et sert l'évaluation de prix, de façon confirmée par
   lecture directe des deux pages produit.

---

## ACTIONS-COMMANDITAIRE

Aucun compte n'a été créé, aucun essai gratuit n'a été démarré dans cette phase (R2/E1). Ce qui
suit est ce que le commanditaire peut faire, avec ce que chaque essai permettrait de mesurer.

| Fournisseur | Essai proposé | Ce que ça mesurerait | Temps estimé | Carte bancaire ? |
|---|---|---|---|---|
| **C-31 auto-api.com** | Contact commercial direct (email `access@auto-api.com` ou Telegram `@autodatabase`), demande de devis + confirmation explicite du périmètre AS24-BE | Le prix réel, le volume BE disponible, la fréquence réelle du flux `/changes` pour AS24, et si un devis exige un engagement contractuel avant tout test technique | Réponse annoncée en 1-3 minutes, mais négociation/devis réaliste sous 1-2 jours ouvrés | Non mentionnée ; pas d'essai gratuit visible, donc **inconnue tant qu'un devis n'a pas été demandé** |
| **C-22 Apify (memo23, solidcode ou automation-lab)** | Créer un compte Apify (plateforme generaliste, hors des 3 pages ciblées par ce lot) et exécuter un des acteurs sur un petit volume BE (une marque, quelques centaines d'annonces) | Couverture réelle des champs, présence effective de `evaluation.category`/`priceEvaluation`, débit réel atteint, comportement de l'acteur face à Akamai en conditions réelles | 15-30 minutes de setup + quelques minutes d'exécution | `[NON VÉRIFIÉ dans cette phase]` — la page acteur elle-même n'a pas été instruite sur ce point précis (hors des 6 pages ciblées) |
| **C-25 Piloterr** | Utiliser les +500 crédits gratuits sur `/v2/autoscout24/search` puis `/v2/autoscout24/ad` sur un domaine `.be` | **Le ratio exact annonces/crédit** (l'inconnue la plus dimensionnante du lot, facteur ×20 sur le coût mensuel estimé), le schéma complet de `/ad` et le nom exact du champ d'évaluation | 10-15 minutes | **Non requise**, confirmé deux fois (page pricing et page produit) |
| **C-29 Anysite.io** | Utiliser le free tier annoncé (100 crédits/mois selon une source indexée, non confirmée en lecture directe) sur `dealers/listings` pour un concessionnaire BE connu | Confirmation empirique du ratio 1 crédit = 1 annonce en conditions réelles, latence réelle, complétude du schéma sur un concessionnaire belge réel | 10 minutes | `[NON VÉRIFIÉ dans cette phase]` |
| **C-30 Carapis** | Essai gratuit 14 jours (confirmé sans CB) sur le parseur AutoScout24, un marché belge si disponible | Le ratio réel « appel API » → nombre d'annonces (inconnue majeure de ce candidat), et si la Belgique est effectivement couverte malgré son absence de mention explicite dans la documentation marketing | 20-30 minutes | **Non requise**, confirmé |
| **C-24 ScrapingBee** | Utiliser les 1000 crédits gratuits (confirmé sans CB) pour tester `render_js=true` + `premium_proxy=true` sur une page AS24 autorisée (ex. `/fr/voiture/opel/`, sous directive `Allow` du `robots.txt`) | Si le palier « premium + JS » (25 crédits) suffit à obtenir la page sans blocage Akamai, ou si le palier « stealth » (75 crédits) est nécessaire — ceci fixerait enfin un coût réel par requête pour ce candidat | 10 minutes | **Non requise**, confirmé |

---

## Conformité

- **E1 / R2** : aucun compte créé, aucun credential saisi, aucun essai gratuit démarré dans cette
  phase. Les 6 essais gratuits identifiés (Apify, Piloterr, Anysite, Carapis, ScrapingBee — auto-api.com
  n'en propose pas) sont intégralement reportés en `ACTIONS-COMMANDITAIRE` ci-dessus, avec ce qu'ils
  mesureraient, le temps estimé et l'exigence ou non d'une carte bancaire. **C'est une limite du
  dispositif** imposée par le mandat, pas un renoncement : plusieurs inconnues dimensionnantes
  (ratio annonces/crédit chez Piloterr et Carapis, ratio réel pour Anysite, palier anti-bot requis
  chez ScrapingBee) ne peuvent être levées que par un test réel, hors du périmètre de cette phase.
- **E5** : **zéro requête émise vers `www.autoscout24.be` ou tout domaine `autoscout24.com`/`.be`**
  dans cette phase. Toutes les sondes ont ciblé les 6 fournisseurs tiers et leurs domaines de
  documentation (`apify.com`, `docs.apify.com`, `piloterr.com`, `docs.piloterr.com`, `anysite.io`,
  `docs.anysite.io`, `carapis.com`, `docs.carapis.com` — échec DNS —, `scrapingbee.com`,
  `help.scrapingbee.com`, `auto-api.com`).
- **R3** : **aucun test d'extraction, aucune requête vers un endpoint de démonstration sans clé
  n'a été exécutée** — ce lot étant purement documentaire (pricing, CGU, schémas publiés), le
  plafond de 50 requêtes fixé pour les sondes techniques ne s'applique pas au sens strict, mais il
  est respecté a fortiori : **28 requêtes `WebFetch`** (dont 3 échecs — 2× HTTP 404, 1× échec DNS —
  et 1 redirection non poursuivie sur `google.com`) et **7 requêtes `WebSearch`** ont été utilisées
  pour localiser et lire des pages de documentation publique, soit **35 requêtes au total**, aucune
  d'entre elles n'étant une extraction de données AutoScout24 elle-même.
- Aucune violation constatée. Les inconnues résiduelles sont documentées ci-dessus par candidat et
  reportées explicitement en `ACTIONS-COMMANDITAIRE` plutôt que devinées.

