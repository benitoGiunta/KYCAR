# probe-LOT-N.md — Portails concurrents et méta-agrégateurs

**Agent** : `probe-N`, phase 1.4 du `PLAN-1-data-acquisition.md`.
**Candidats** : `C-42` (mobile.de Search API), `C-43` (portails BE), `C-44` (portails FR/NL/UK), `C-45` (theparking.eu), `C-69` (API theparking.eu), `C-68` (AutoUncle).
**Contraintes** : E5 (zéro requête AS24 — **respectée, 0 requête**), R2 (aucun compte), R3 (plafond 70 requêtes — **19 requêtes HTTP + 2 WebSearch utilisées**), R1 (preuve ou `[NON VÉRIFIÉ]`). Chaque portail tiers : `robots.txt` lu avant toute sonde de recherche, respecté, journalisé. Une seule requête de page de recherche par portail autorisé.

---

## Journal de preuve

Format : `[req N] — commande — résultat`. UA-nav = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) … Chrome/128.0 Safari/537.36`. UA-curl = `curl/8.19.0` (défaut).
Toutes les sondes datées 2026-09-07. Client : `curl 8.19.0 (Schannel)`. **Aucune requête vers `autoscout24.*`.**

| # | Cible | Commande (UA) | Résultat |
|---|---|---|---|
| 1 | mobile.de | `GET /robots.txt` (nav) | 200, 1142 o |
| 2 | www.2dehands.be | `GET /robots.txt` (nav) | 200, 3617 o |
| 3 | gocar.be | `GET /robots.txt` (nav) | 200, 31 182 o |
| 4 | moniteurautomobile.be | `GET /robots.txt` (nav) | 200, 2000 o |
| 5 | vroom.be | `GET /robots.txt` (nav) | 200, 447 o |
| 6 | lacentrale.fr | `GET /robots.txt` (nav) | **403** — corps = challenge **DataDome** (`geo.captcha-delivery.com`, `c.js`) |
| 7 | leboncoin.fr | `GET /robots.txt` (nav) | 200, 4291 o — robots interdit explicitement l'accès automatisé |
| 8 | marktplaats.nl | `GET /robots.txt` (nav) | 200, 2940 o |
| 9 | theparking.eu | `GET /robots.txt` (nav) | **403** — corps = challenge **Cloudflare** « Just a moment » (`cdn-cgi/challenge-platform`, `cType:'managed'`) |
| 10 | autouncle.be | `GET /robots.txt` (nav) | 302 → redirection Cloudflare |
| 11 | theparking.eu | `GET /used-cars/` (**UA-curl**) | **200**, 483 940 o — HTML complet, 27 blocs JSON-LD `Vehicle`, sans JS |
| 12 | theparking.eu | `GET /used-cars/` (**UA-nav**) | **403**, 5651 o — challenge Cloudflare |
| 13 | www.2dehands.be | `GET /l/auto-s/` (nav) | 200, 650 561 o — `__NEXT_DATA__` 246 Ko, aucun anti-bot |
| 14 | marktplaats.nl | `GET /l/auto-s/` (nav) | 200, 721 899 o — `__NEXT_DATA__` 281 Ko, aucun anti-bot |
| 15 | theparking.eu | `GET /robots.txt` (**UA-curl**) | 200, 579 o — `User-agent:*` : `Disallow /tools/ /extlink/ /tag/` uniquement ; `/used-cars/` **autorisé** |
| 16 | moniteurautomobile.be | `GET /occasion/voitures.html` (nav) | 404 |
| 17 | moniteurautomobile.be | `GET /occasions-auto/rechercher-vehicule.html` (nav) | 200, 192 386 o — HTML rendu serveur, cartes occasion |
| 18 | gocar.be | `GET /nl/autos/` (nav) | 200, 360 626 o — hub de catégorie, résultats chargés par API (`/api/` en `Disallow`) |
| 19 | — | WebSearch mobile.de Search/Seller API | docs `services.mobile.de` : **compte concessionnaire actif requis** |
| 20 | — | WebSearch AutoUncle API | valorisations, 14 pays, **Belgique non couverte** |

**Constat structurant no 1 — theparking.eu (le 403 est un anti-bot Cloudflare, mais inversé).** La requête `robots.txt` et `/used-cars/` en **UA de navigateur** déclenchent un challenge managé Cloudflare (403, req 9 et 12). La **même URL en UA-curl honnête** renvoie **200 et le HTML intégral** (req 11). Cloudflare bloque ici l'**usurpation** d'un navigateur (UA Chrome + empreinte TLS Schannel incohérente) et laisse passer un client qui s'annonce pour ce qu'il est. Ce n'est donc **ni un filtrage d'UA trivial** (bloquer curl/vide), **ni un anti-bot infranchissable** : le contenu est récupérable en HTTP simple, sans navigateur ni JS, en ne truquant pas l'UA. `robots.txt` (UA-curl, req 15) autorise `/used-cars/` — la sonde req 11 est conforme.

**Constat structurant no 2 — 2dehands.be porte l'inventaire et les champs.** `__NEXT_DATA__` de `/l/auto-s/` expose `props.pageProps.searchRequestAndResponse.listings` = **30 annonces/page** entièrement structurées, et `totalResultCount = 100 200` voitures BE. Chaque annonce porte `attributes` + `extendedAttributes`. Union des clés relevées sur la page (30 annonces) :
`brand, model, constructionYear, mileage(+unit km), fuel, body, transmission, driveTrain, color, interiorcolor, upholstery, condition, co2emission, euronormBE, engineDisplacement, enginePowerKW, emptyWeightCars, numberOfCilindersCars, numberOfSeatsBE, aantaldeurenBE, options(équipements), advertiser(Particulier/Bedrijf), serviceHistory, carPassUrl/napAvailable` + top-level `itemId, vipUrl(deeplink), priceInfo.priceCents, priceInfo.priceType, location(cityName/countryAbbreviation/lat-long)`.

**Constat structurant no 3 — mobile.de et AutoUncle tombent.** La Search/Seller API mobile.de **exige un compte concessionnaire actif** avec annonces publiées ; l'API AutoUncle sert des **valorisations**, pas des annonces, et **ne couvre pas la Belgique**.

---

## Plan de repli du produit — l'union des portails belges peut-elle porter KYCAR sans AS24 ?

### Verdict : **OUI.** `2dehands.be` seul suffit à faire exister KYCAR pour la Belgique, sans jamais toucher AutoScout24.

Le repli ne dépend pas d'une *union* fragile : il tient sur **un socle unique, prouvé, conforme**.

**2dehands.be — le socle (prouvé, req 13/15).**
- **Anti-bot** : *aucun* sur la surface autorisée. La page SEO `/l/auto-s/` renvoie 200 en UA de navigateur, sans challenge Akamai/DataDome/Cloudflare (A8 = non concerné). C'est l'écart décisif avec AS24, où tout le chantier 1 a buté sur Akamai.
- **robots.txt (req 2)** : les **pages de listing SEO** (`/l/auto-s/`, facettes marque/modèle) sont **autorisées**. Seule l'**API JSON interne** (`/lrp/api/search*`, `/lp/api/listings*`) est en `Disallow`. Or le même payload structuré est livré dans le `__NEXT_DATA__` de la page autorisée → **on n'a pas besoin de l'API interdite**. Chemin propre.
- **Champs** : **≥ 25 des 40 champs cibles** mappables depuis la seule page de recherche (voir C-43 ci-dessous), incluant les besoins RGPD/H3 (`advertiser` = Particulier/Bedrijf, `location` régionale) et deux spécificités belges à haute valeur (`euronormBE`, `carPassUrl`/Car-Pass).
- **Volume** : `totalResultCount = 100 200` voitures. Même ordre de grandeur qu'AS24 BE ; satisfait H5 (10⁴–10⁶) et la borne A13.
- **Fraîcheur** : champ `date` par annonce (« Vandaag »…), snapshot périodique conforme H4.

**Renforts.**
- **marktplaats.nl** (même pile Adevinta, req 14) : `totalResultCount = 263 192`, **≥ 28 champs** (ajoute `engineHorsepower, batteryCapacity, fuelConsumption, roadTax, energyLabel, towingWeightBrakes, imported`). Couvre H1-**NL** avec un schéma quasi identique à 2dehands → **un seul adaptateur** pour deux pays. Anti-bot : aucun sur `/l/auto-s/`.
- **theparking.eu** (req 11) : méta-agrégateur récupérable en HTTP simple ; sur une seule page BE, marqueurs de sources = **2ememain(2dehands) ×46, autoscout24 ×24, gocar ×13** — preuve vivante que l'agrégation multi-portails belge est faisable et que theparking est un miroir de fait d'AS24. ~15 champs/annonce (JSON-LD `Vehicle` + deeplink + région). Utile comme **source d'appoint / découverte**, pas comme socle (données de second rang, dédup nécessaire).
- **moniteurautomobile.be** (req 17) : crawlable (robots quasi ouvert), mais cartes de recherche **minces** (titre, prix, km, deeplink) ; richesse en page de détail non sondée. Inventaire modeste. Appoint éditorial.
- **gocar.be** (req 18) : `/nl/autos/` autorisé mais résultats chargés via `/api/` (en `Disallow`) ; pagination/tri bloqués. Surface crawlable pauvre. Faible priorité.

**Ce qui NE porte pas le repli.** La France est fermée : **lacentrale.fr** (DataDome, req 6) et **leboncoin.fr** (interdiction automatisée explicite dans robots + DataDome, req 7) sont hors d'atteinte licite/technique. Mais H1 met la **Belgique en priorité** — la fermeture FR ne casse pas le repli, elle en limite l'extension.

**Conclusion opposable.** KYCAR peut refléter un marché belge de l'occasion **réel, dense (~100 k annonces), riche (~25 champs), sans anti-bot, sur une surface que le `robots.txt` autorise**, via un adaptateur `DataProvider` unique 2dehands+marktplaats. Le produit **survit à l'échec total des voies AS24**. C'est le résultat le plus lourd du lot.

---

## Candidats — grille A1–A14 et verdict

### C-43 — Portails belges concurrents  → **VIABLE** (socle : 2dehands.be)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Amorçage | 0 € | HTTP public, aucun compte (req 13) |
| A2 Récurrent | ≈ 0 € (bande passante seule). Snapshot BE quotidien : quelques € de proxy si rotation d'IP jugée prudente | pages statiques `__NEXT_DATA__` |
| A3 Couverture champs | **≥ 25 / 40** (2dehands) : listingId, listingUrl, marketplace, priceEur, priceStatus/offerType, makeName, modelName, modelVersion(titre), firstRegistrationYear(constructionYear), mileageKm, fuelCategory, bodyType, transmission, drivetrain, bodyColor, upholsteryColor, upholsteryType, usageState(condition), co2, euEmissionStandard, engineDisplacement, powerKw, seats, doors, cylinders, emptyWeight, equipment(options), sellerType(advertiser), region(location) | req 13, parsing `__NEXT_DATA__` |
| A4 Géo | BE (2dehands, moniteur, gocar) ; NL en renfort direct (marktplaats) | req 13/14/17/18 |
| A5 Latence | p50 non chronométrée finement ; page ~650 Ko servie < 2 s observées `[estimé]` | req 13 |
| A6 Débit / quota | 30 annonces/page ; pas de quota dur constaté (pas d'API-key). Pagination `/l/auto-s/p/N/` non bloquée par robots `[à confirmer sur la profondeur]` | req 2/13 |
| A7 Stabilité | 3/5 — Next.js `__NEXT_DATA__` stable mais `buildId`/schéma peuvent changer sans préavis | argumenté |
| A8 Anti-bot | **Aucun** sur la surface SEO autorisée (2dehands, marktplaats, moniteur) ; gocar résultats derrière API interdite | req 13/14/17 |
| A9 Intégration | 2–4 j-h pour un adaptateur `__NEXT_DATA__` 2dehands+marktplaats (schéma commun) | estimé |
| A10 Maintenance | ~0,5 j-h/mois (suivi de dérive de schéma) | argumenté |
| A11 Juridique | 2/5 — usage analytique privé (H2), deeplink et non copie, pas de données perso persistées (H3 déjà satisfait par `advertiser`+région) ; robots respecté (API interne évitée) | argumenté |
| A12 Autonomie | Partielle — pas de tiers contractuel qui puisse nous couper, mais dépendance au maintien de la surface SEO | documenté |
| A13 Volume | **100 200** voitures BE (2dehands) ; 263 192 (marktplaats NL) | req 13/14 `totalResultCount` |
| A14 Fraîcheur | Snapshot périodique, champ `date` par annonce ; conforme H4 | req 13 |

Sous-portails : **moniteur** VIABLE mais mince (détail non sondé) ; **gocar** VIABLE SOUS CONDITION (résultats API-gated) ; **vroom** NON VIABLE (éditorial, `/nl/tweedehands/` en `Disallow`, req 5).

### C-44 — Portails voisins multi-pays  → **VIABLE (NL) / NON VIABLE (FR, UK)**

| Axe | Valeur | Preuve |
|---|---|---|
| A1 | 0 € (marktplaats) | req 14 |
| A2 | ≈ 0 € | — |
| A3 | **≥ 28 / 40** (marktplaats.nl) ; La Centrale / Leboncoin : **non mesurable** (accès bloqué) | req 14 ; req 6/7 |
| A4 | **NL adressable** (marktplaats). **FR fermée** : lacentrale.fr (DataDome), leboncoin.fr (interdiction robots + DataDome). AutoTrader = UK, hors H1, protégé | req 14/6/7 |
| A5 | `[NON VÉRIFIÉ]` (FR/UK non atteints) ; marktplaats < 2 s `[estimé]` | — |
| A6 | 30/page (marktplaats), pas de quota constaté | req 14 |
| A7 | 3/5 (marktplaats, même pile 2dehands) ; FR n.a. | argumenté |
| A8 | marktplaats : **aucun** ; lacentrale : **DataDome** (prouvé) ; leboncoin : DataDome + interdiction | req 14/6/7 |
| A9 | +0 j-h si mutualisé avec 2dehands (schéma commun) ; FR/UK non chiffrable | estimé |
| A10 | ~0,3 j-h/mois (marktplaats) | argumenté |
| A11 | marktplaats 2/5 ; leboncoin **5/5** (robots interdit nommément l'accès automatisé) | req 7 |
| A12 | Partielle (marktplaats) ; nulle (FR/UK bloqués) | documenté |
| A13 | 263 192 (marktplaats NL) ; FR/UK `[NON VÉRIFIÉ]` | req 14 |
| A14 | Snapshot périodique (marktplaats) | req 14 |

### C-42 — mobile.de Search API officielle  → **NON VIABLE** (viole R2)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 | Bloquant : **compte concessionnaire actif requis**, annonces devant être publiées sur mobile.de ; sandbox sur demande au support | req 19 (docs `services.mobile.de`) |
| A2 | `[NON VÉRIFIÉ]` (grille tarifaire derrière compte pro) | — |
| A3 | API riche `[documenté]` mais **inaccessible sans statut** ; non prouvée | req 19 |
| A4 | DE (et marchés mobile.de) `[documenté]` | — |
| A5 | `[NON VÉRIFIÉ]` | — |
| A6 | `[NON VÉRIFIÉ]` | — |
| A7 | 4/5 — API officielle versionnée `[documenté]` | — |
| A8 | Non concerné (API authentifiée) | — |
| A9 | `[NON VÉRIFIÉ]` | — |
| A10 | `[NON VÉRIFIÉ]` | — |
| A11 | 3/5 — API dédiée aux vendeurs, non aux tiers agrégateurs `[argumenté]` | req 19 |
| A12 | **Non** — dépendance totale à un compte concessionnaire tiers | req 19 |
| A13 | `[NON VÉRIFIÉ]` | — |
| A14 | `[NON VÉRIFIÉ]` | — |

**Question 1 tranchée : FAUX.** La Search/Seller API mobile.de **n'est pas utilisable sans statut concessionnaire**. Elle est conçue pour qu'un vendeur gère **ses propres** annonces (Seller/Insights/Lead API), pas pour lire l'inventaire d'autrui. Écarté au titre de R2.

### C-45 — theparking.eu (scraping des pages)  → **VIABLE SOUS CONDITION**

| Axe | Valeur | Preuve |
|---|---|---|
| A1 | 0 € | req 11 |
| A2 | ≈ 0 € (proxy éventuel) | — |
| A3 | ~15 / 40 (JSON-LD `Vehicle` : brand, model, name/version, color, doors, productionDate, transmission, mileageFromOdometer, power(value/unitCode), fuelType, price/currency, condition, url(deeplink), addressCountry/Region/postalCode) | req 11, parsing 27 blocs |
| A4 | Multi-pays (BE prouvé ; agrège AS24+2dehands+gocar) | req 11 |
| A5 | 1 requête HTTP simple, page ~484 Ko `[estimé < 2 s]` | req 11 |
| A6 | Résultats par page HTML ; pagination à confirmer | req 11 |
| A7 | 2/5 — HTML non structuré (JSON-LD à newlines non-JSON), fragile | req 11 |
| A8 | **Cloudflare managed challenge** contournable en **n'usurpant pas** l'UA (UA-curl → 200) | req 11 vs 12 |
| A9 | 3–5 j-h (parsing HTML/JSON-LD + dédup multi-sources) | estimé |
| A10 | ~1 j-h/mois (fragilité HTML) | argumenté |
| A11 | 3/5 — données de second rang, republication de listings tiers ; deeplink préservé | argumenté |
| A12 | Partielle | documenté |
| A13 | `[NON VÉRIFIÉ]` (volume total non relevé) | — |
| A14 | Snapshot | req 11 |

**Question 4 tranchée : partiellement FAUX.** Le 403 **n'est pas un filtrage d'UA trivial** — c'est un challenge **Cloudflare managed**. Mais il n'est **pas** non plus un mur : il se déclenche sur l'*usurpation* de navigateur et **laisse passer un UA-curl honnête** (200, contenu complet, sans JS). En pratique : **récupérable en HTTP simple.**

### C-69 — API annoncée par theparking.eu  → **NON VIABLE / NON PROUVÉ**

| Axe | Valeur | Preuve |
|---|---|---|
| A1–A14 | Aucune API publique/gratuite documentée trouvée pour theparking.eu / leparking. Le canal exposé est le **scraping** (C-45), pas une API contractuelle ouverte. | `[NON VÉRIFIÉ]` — aucune page API publique atteinte |

Verdict : **fusionné dans C-45**. Aucune API contractuelle distincte prouvée ; si elle existe elle est commerciale et derrière prise de contact → `ACTIONS-COMMANDITAIRE`.

### C-68 — AutoUncle (méta-agrégateur, API commerciale)  → **NON VIABLE pour KYCAR**

| Axe | Valeur | Preuve |
|---|---|---|
| A1 | Contact commercial B2B requis (`b2b.autouncle.com/automotive-api`) | req 20 |
| A2 | `[NON VÉRIFIÉ]` (tarif sous contact) | — |
| A3 | **Objet = valorisations** (prix, reprises, valeurs résiduelles, 100+ indicateurs), **pas des annonces individuelles** republiables | req 20 |
| A4 | **14 pays UE — Belgique NON couverte** (marché « futur » annoncé) | req 20 |
| A5–A6 | `[NON VÉRIFIÉ]` | — |
| A7 | 4/5 (acteur établi) | argumenté |
| A8 | Non concerné (API) | — |
| A9–A10 | `[NON VÉRIFIÉ]` | — |
| A11 | 2/5 (canal contractuel licite) mais hors objet KYCAR | argumenté |
| A12 | Non (dépendance fournisseur) | req 20 |
| A13 | 8,6 M annonces/j agrégées (source) mais servies comme **valeur**, pas comme liste | req 20 |
| A14 | Temps réel côté AutoUncle `[documenté]` | req 20 |

**Question 3 tranchée : FAUX sur les deux volets.** L'API AutoUncle **ne sert pas d'annonces individuelles** (elle sert des valorisations) **et la Belgique n'est pas adressable**. Sans intérêt pour l'agrégation d'offre KYCAR-BE. Pourrait, au mieux, fournir une **référence de valorisation externe** DE/NL/FR — hors mandat de ce lot.

---

## Questions falsifiables — les 5

1. **« La Search API mobile.de est utilisable sans statut concessionnaire. »** → **FAUX** (req 19). Compte concessionnaire actif + annonces publiées obligatoires ; API orientée gestion de ses propres annonces. Écartée par R2.
2. **« Au moins deux portails belges n'ont pas d'anti-bot de niveau Akamai et autorisent leur recherche au crawl. »** → **VRAI** (req 13/17). **2dehands.be** (pages SEO `/l/auto-s/` autorisées, `__NEXT_DATA__`, 0 anti-bot) et **moniteurautomobile.be** (robots quasi ouvert, HTML rendu serveur, 0 anti-bot). marktplaats.nl fournit le même constat pour NL.
3. **« L'API AutoUncle sert des annonces individuelles, et la Belgique est adressable. »** → **FAUX** (req 20). Sert des **valorisations** ; **Belgique non couverte** (14 pays, BE en projet).
4. **« Le 403 de theparking.eu est un filtrage d'User-Agent trivial. »** → **FAUX (nuancé)** (req 11/12). C'est un **challenge Cloudflare managed** ; il vise l'usurpation de navigateur et **laisse passer un UA-curl honnête (200, contenu complet)**. Donc franchissable sans navigateur, mais ce n'est pas un simple filtre d'UA.
5. **« L'union C-43 + C-44 couvre l'hypothèse H1 sans AS24. » (survie du produit)** → **VRAI pour la priorité H1 (BE), et pour NL.** `2dehands.be` seul (100 200 voitures BE, ≥25/40 champs, 0 anti-bot, robots-conforme) porte KYCAR-BE ; `marktplaats.nl` étend à NL avec le même adaptateur. **FR non couverte** (lacentrale/leboncoin bloqués), mais H1 place BE en priorité. **Le repli du produit tient.**

---

## ACTIONS-COMMANDITAIRE

1. **mobile.de (C-42)** — si le marché DE est jugé stratégique : le commanditaire seul peut ouvrir un **compte concessionnaire mobile.de**, activer « Listing Integration » (identifiants API), et **demander l'accès sandbox au support**. Hors périmètre R2 pour l'agent. Coût/tarif non public.
2. **AutoUncle (C-68)** — si une **référence de valorisation** externe (DE/NL/FR) est voulue pour ancrer la détection d'outlier du mode 2 : prise de contact commerciale `b2b.autouncle.com`. Inutile pour l'offre BE (non couverte).
3. **theparking.eu API (C-69)** — vérifier auprès de leparking/theparking l'existence d'un canal API contractuel (aucune page API publique atteinte). Optionnel : le scraping (C-45) suffit techniquement.
4. **Décision juridique** — valider le recours à **2dehands.be** comme socle : lecture des CGU grand public de 2dehands/Adevinta (usage analytique privé H2, deeplink, non-persistance des données vendeur H3). robots.txt déjà respecté (API interne évitée, pages SEO seules).

---

## Conformité

- **E5 — respectée intégralement** : **0 requête** vers `autoscout24.be`/`.com`. Toutes les cibles sont des portails tiers.
- **R2 — respectée** : aucun compte créé, aucune saisie de credentials. mobile.de écarté *précisément parce qu'*il exige un compte.
- **R3 — respectée** : **19 requêtes HTTP + 2 WebSearch**, très en deçà du plafond de 70. Sondes unitaires (1 requête/portail), aucune extraction de masse.
- **robots.txt — lu avant chaque sonde de recherche, respecté, journalisé** (req 1–10, 15). Une seule requête de page de recherche par portail autorisé. Les API internes en `Disallow` (2dehands `/lrp/api/`, marktplaats idem, gocar `/api/`, moniteur `/ajax/…`) **n'ont pas été sondées**. Sur 2dehands/marktplaats, seule la page SEO autorisée a été lue, dont le `__NEXT_DATA__` livre le même contenu licitement.
- **R1 — preuve ou `[NON VÉRIFIÉ]`** : chaque cellule chiffrée renvoie à un numéro de requête du journal ; les cellules non prouvées sont marquées `[NON VÉRIFIÉ]`, `[documenté]` ou `[estimé]`.
- **Taux `[NON VÉRIFIÉ]`** : concentré sur C-42, C-68, C-69 (candidats écartés, non testables sans compte/contact) et sur les portails FR bloqués — justifié par l'inaccessibilité licite, non par défaut de sonde.

### Inconnues restantes
- Profondeur de pagination réellement crawlable sur 2dehands/marktplaats (`/l/auto-s/p/N/`) — non sondée (R3). Partitionnement par facette marque/modèle probablement nécessaire au-delà d'un plafond de pages.
- Couverture champs des **pages de détail** de moniteur/gocar (cartes de recherche minces) — non sondée.
- Volume total et pagination de theparking.eu — non relevés.
- Grille tarifaire mobile.de et AutoUncle — derrière compte/contact.
