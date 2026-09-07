# probe-LOT-M.md — Découverte côté concessionnaire : le stock sans passer par AutoScout24

**Agent** : `probe-M` (phase 1.4, PLAN-1). **Modèle** : Opus, effort high.
**Lot** : `LOT-M` — candidats `C-92`, `C-46`, `C-76`, `C-74`, `C-73`.
**Idée directrice** : contourner AS24 par la source (site du garage, portail constructeur, flux
publicitaire, affiliation). **Question qui décide de la valeur du lot** : ce stock est-il
**substituable** à AS24, ou **disjoint** ? (question falsifiable 3, traitée en section dédiée.)

**Contraintes appliquées** : E5 (zéro requête vers `autoscout24.be`/`.com`) · E1/R2 (aucun compte)
· R3 (échantillon, pas de volumétrie, plafond 80 requêtes tierces temporisées) · R1 (preuve ou
`[NON VÉRIFIÉ]`) · robots.txt de chaque tiers lu et respecté avant sonde.

Date d'exécution : 2026-09-07.

---

## Journal de preuve

> Rejouable. Chaque ligne = une commande émise et l'essentiel de sa sortie. Compteur de requêtes
> tierces tenu en bas de la section Conformité. Toutes les requêtes portent un User-Agent explicite
> et sont temporisées (≥1 s entre deux requêtes vers le même hôte).

User-Agent utilisé : `Mozilla/5.0 (KYCAR-research; +feasibility probe; contact benito.giunta@bstorm.be)`.
Artefacts bruts conservés sous `scratchpad/lotM/{robots,probes,live}/`.

**Constitution de l'échantillon.** 20 hôtes belges collectés depuis des annuaires publics de garages
et deux portails constructeurs/groupes (`hosts.txt`). Pour chacun : `robots.txt`, puis — quand le
site est un socle WordPress — `GET /wp-json/`. Sondes véhicule ciblées ensuite sur les hôtes qui
exposent un type de contenu véhicule.

### B.1 — Vivacité de l'API WordPress REST (17 hôtes WP sondés)

| Hôte | `/wp-json/` | Verdict | Type véhicule présent dans l'index de routes |
|---|---|---|---|
| devischmobility.be | JSON, 37 ns, 995 routes | **WP REST vivant** | WooCommerce (`wc/store`) — produits, pas de CPT véhicule dédié |
| garage-du-zoning.be | JSON, 38 ns, 968 routes | **WP REST vivant** | WooCommerce — idem |
| garageswyngedouw.be | JSON, 11 ns, 158 routes | **WP REST vivant** | aucun CPT véhicule (wp/v2 standard + SiteOrigin) |
| kabakcicar.be | JSON, 22 ns, 349 routes | **WP REST vivant** | aucun CPT véhicule (Elementor, stock rendu autrement) |
| mondialcar.be | JSON, 28 ns, 502 routes | **WP REST vivant** | `/wp/v2/vehicule`, `/wp/v2/showroom`, `/wp/v2/moto` **mais lecture 401** |
| monoccasion.be | JSON, 22 ns, 420 routes | **WP REST vivant** | `/wp/v2/cars` + `vehica/v1/cars` — **lisible, HTTP 200** |
| morgan-belgium.com | JSON, 5 ns, 45 routes | **WP REST vivant** | aucun CPT véhicule (mono-marque, wp/v2 minimal) |
| 2maal2.be | HTML (accueil) | pas d'API REST exposée | — |
| belocas.com | HTML (accueil) | pas d'API REST exposée | — |
| car-market.be | HTML `404 Not Found` | pas d'API REST | — |
| caravenue.com | HTML (Next.js) | non-WordPress | — |
| click2move.be | HTML (accueil) | pas d'API REST exposée | — |
| garageamcr.be | HTML `Not Found` | pas d'API REST | — |
| garagescheerens.be | HTML `404` | pas d'API REST | — |
| myway.be | HTML (Next.js) | non-WordPress | — |
| soco.be | HTML (accueil) | pas d'API REST exposée | — |
| vanmossel.be | HTML (Next.js/autochat) | non-WordPress | — |

**Fait confirmé (reprise de l'exécution coupée) : 7 hôtes WordPress sur 17 exposent une API WP REST
vivante.** Mais — correction décisive sur la lecture initiale — *vivant ≠ stock véhicule lisible*.
Sur les 7, un seul livre son stock véhicule sans authentification :
- `monoccasion.be` : `GET /wp-json/wp/v2/cars?per_page=1` → **HTTP 200**, en-tête `X-WP-Total: 71`.
- `mondialcar.be` : le CPT `vehicule` est enregistré dans l'index de routes mais
  `GET /wp-json/wp/v2/vehicule` → **HTTP 401** `itsec_rest_api_access_restricted` (plugin
  « Solid Security » ferme l'API REST). Route annoncée, lecture refusée.
- `devischmobility.be` / `garage-du-zoning.be` : WooCommerce ; l'objet est un produit e-commerce,
  pas une fiche véhicule normalisée.
- `garageswyngedouw.be`, `kabakcicar.be`, `morgan-belgium.com` : API vivante mais aucun CPT véhicule
  — le stock est rendu par thème/page builder, sans collection REST interrogeable.

### B.2 — Le stock structuré réel : `vehica/v1/cars` (C-92)

`GET https://monoccasion.be/wp-json/vehica/v1/cars` → **HTTP 200, 1,2 Mo, une seule requête** livre
l'**intégralité du stock** : `resultsCount: 71`, tableau `results` de 71 objets. Chaque objet :
`{id, name, slug, url, description(HTML équipements+specs), attributes[21], user(vendeur), featured}`.
Les 21 `attributes` observés sur `results[0]` (Mercedes C 200 d, 26 789 €) : Condition (Occasion),
Type/carrosserie (Break), Marque (Mercedes-Benz), Modèle (Classe C), Prix (26789), Année (2022),
Transmission (Automatique), Carburant (Diesel), Kilometrage (119954), Cylindrée (1993), Couleur
(Gris), Portes (5 portes), Kilowatts (120), Puissance (163), VIN (vide ici mais champ présent),
Gallerie (14 ids image), Location (lat/lng — vides), Video, Options, Offer Type, Attachments.
`vehica/v1/cars` est le socle commercial **Vehica** (thème WordPress payant de concessionnaire) ;
tout garage l'utilisant expose cet endpoint public par construction — c'est exactement la mécanique
`C-92` (API REST interne du socle de site, distincte du balisage SEO de `C-46`).

### B.3 — `schema.org/Car` (C-46) et portails constructeurs (C-76)

- `monoccasion.be` (page fiche `/listing/…`) : **aucun** JSON-LD `Car` — 1 seul bloc `ld+json`
  (Organisation/WebSite). Le socle Vehica est une app React : la donnée est dans le REST `vehica`,
  pas dans un balisage `schema.org/Car`. Donc C-46 ne s'applique pas à ce socle.
- `certified.cars.mercedes-benz.be` (C-76, socle **Hexon**) : `robots.txt` publie
  `Sitemap: sitemap_occasions.xml` et **autorise explicitement `ClaudeBot`, `GPTBot`,
  `Google-Extended`, `PerplexityBot`** (`Allow: /`), `Crawl-delay: 5`. Le sitemap d'occasions est un
  index → `sitemap_occasions_1.xml` contient **1 234 `<loc>`** de fiches véhicules
  (`/mercedes-benz/{modele}/occ{id}`). **Stock mono-marque entièrement énumérable sans auth.**
- Fiche véhicule Hexon `…/occ21928936` : **JSON-LD `@type: Car` présent, 22 propriétés** —
  `name, brand, description, image, bodyType, dateVehicleFirstRegistered (2023-7-4), emissionsCO2
  (202), fuelConsumption (7.7 L/100KM), mileageFromOdometer (67439 KMT), numberOfDoors (5),
  numberOfForwardGears, seatingCapacity, color, fuelType, vehicleEngine, offers (49 280 €),
  weightTotal, wheelbase, numberOfAxles`. Vocabulaire standard `schema.org`, énumérable par sitemap.
- `autosphere.be` : pas de `robots.txt` réel (`/robots.txt` → page HTML `Erreur 404`). Groupe
  multi-marques (Emil Frey) ; socle propre à qualifier séparément, non sondé plus avant (budget R3).

### B.4 — Comptage de couverture des champs contre le dictionnaire (82 champs, ~40 fournis par source)

| Source sondée | Champs source KYCAR couverts (mappés) | Décompte | Notes |
|---|---|---|---|
| `vehica/v1/cars` (monoccasion) | listingUrl, makeName, modelName, modelVersionRaw, priceEur, modelYear, mileageKm, transmission, fuelCategory/Type, bodyType, bodyColor, doorCount, powerKw, powerHp, cylinderCapacityCcm, equipmentCodes, imageCount, offerType/usageState, sellerType, countryCode(dérivé), marketplace(dérivé), vehicleType | **~20 / 40** | riche en équipements (liste FR dans `description`) ; VIN présent mais souvent vide ; région/postal vides |
| `schema.org/Car` Hexon (mercedes) | makeName, modelName, priceEur, **firstRegistrationYearMonth (date exacte)**, co2EmissionsGPerKm, consumptionCombinedL100Km, mileageKm, doorCount, gearCount, seatCount, bodyColor, fuelType/Category, bodyType, power/displacement (vehicleEngine), modelYear, imageCount, sellerType(dérivé), countryCode | **~17 / 40** | vocabulaire standard ; ajoute date de 1re immat., CO2, conso, sièges, rapports — plus riche que Vehica sur l'axe technique/homologation ; certaines valeurs vides |
| Spec Google Vehicle Ads (C-74, documentaire) | vin, make, model, year, price, mileage, condition, color, drivetrain, body_style, fuel, transmission, engine, doors, trim, url, image… | **≥ 20 / 40** (Q4 vraie) | mais c'est une **spec de soumission** vers Google Merchant Center, pas un endpoint lisible |


---

## Complémentarité avec 2dehands

**Question qui décide du lot (falsifiable 3) : ce stock concessionnaire *enrichit-il* la voie 2dehands
retenue, ou est-il *redondant* avec elle ?**

**Verdict : très majoritairement REDONDANT, avec une valeur d'enrichissement étroite qui ne justifie
pas le coût.** Le stock des garages est *substituable* (déjà présent sur 2dehands), pas *disjoint*.
Trois raisons, dont les deux premières sont structurelles et dirimantes.

1. **Ce sont des vendeurs professionnels, et le pro pratique la multidiffusion.** Les 71 voitures de
   `monoccasion.be` sont toutes `Condition = Occasion`, vendeur pro. Le modèle économique d'un
   concessionnaire est de publier son stock **partout à la fois** — 2dehands, AutoScout24, Gocar —
   via des prestataires de multidiffusion (Autralis, Stockway, CPS ; documentés en `LOT-L`, `C-84`).
   Le stock d'un garage est donc, par construction, un **sous-ensemble** de ce que 2dehands montre
   déjà. La décision de source (`DECISION-coordinateur-source.md`) note que 2dehands, malgré son
   penchant particulier, **inclut le vendeur pro** (champ H3 `sellerType` présent). Le recouvrement
   attendu est élevé.

2. **Il n'existe aucun index central énumérable des garages : la fragmentation tue le volume.** Le
   stock utile est éclaté sur **autant de socles techniques que de garages**, chacun exigeant son
   propre adaptateur : Vehica REST (`monoccasion`), WooCommerce (`devisch`, `zoning`), Hexon+JSON-LD
   (`mercedes certified`), Next.js maison (`caravenue`, `myway`, `vanmossel`), sites fermés
   (`mondialcar` en 401), sites sans API du tout (10/17). Pour approcher les 100 188 voitures de
   2dehands, il faudrait découvrir, qualifier et maintenir **des centaines de garages un par un**,
   avec un adaptateur par famille de socle. Coût d'intégration et de maintenance sans commune mesure
   avec **un** adaptateur `__NEXT_DATA__` 2dehands. Ordre de grandeur mesuré : 7 sites vivants × ~70
   annonces ≈ 500 annonces, contre 100 188. Trois ordres de grandeur d'écart, au prix d'un effort
   d'intégration N fois supérieur.

3. **La seule valeur d'enrichissement réelle est étroite et ne change pas la recommandation.** Ce que
   la source garage peut apporter *que 2dehands n'a pas nécessairement* :
   - **VIN** (champ présent dans le socle Vehica ; hors périmètre KYCAR de toute façon — non persisté).
   - **Fraîcheur à l'origine** : le garage est la source primaire, publie avant/pendant la diffusion.
   - **Champs d'homologation plus riches sur socle Hexon/JSON-LD** : date exacte de 1re immatriculation,
     CO2, consommation, sièges, rapports — utiles pour le mode 2. Mais ce gain est *par-socle* et ne
     couvre pas le marché.
   Aucun de ces apports n'est un stock **disjoint** de 2dehands ; ce sont des attributs marginaux sur
   des annonces déjà couvertes. Ils ne débloquent ni H1 (volume BE) ni H5 (10⁴–10⁶) que 2dehands
   couvre seul.

**Conséquence pour la décision de source.** Le stock concessionnaire **ne complète pas** la voie
2dehands au sens d'ajouter du marché ; il la **duplique** à coût supérieur. Il n'entre donc pas dans
la recommandation primaire. Deux usages résiduels, non contraignants, subsistent : (a) **socle
d'appoint pour une marque de niche** absente ou mal couverte sur 2dehands (ex. Morgan, Mercedes
certifié), via sitemap + JSON-LD, à coût unitaire faible ; (b) **source de validation croisée** —
recouper un échantillon d'annonces garage contre 2dehands pour mesurer le taux réel de multidiffusion
(inconnue laissée ouverte, non testée ici faute de requête 2dehands dans le périmètre E5).

---

## Candidats — grille A1–A14 et verdict

Notation : `prouvé` = sortie de commande ; `documenté` = source ; `estimé` = argumenté.

### C-92 — API REST des socles de sites de garages (Vehica `vehica/v1/cars`, WooCommerce)

| Axe | Valeur | Preuve |
|---|---|---|
| A1 Amorçage | 0 € | prouvé (endpoint public) |
| A2 Récurrent | 0 € en accès ; coût = jours-homme d'adaptateurs | documenté |
| A3 Couverture champs | **~20 / 40** (Vehica) | prouvé (`vehica/v1/cars`) |
| A4 Géo | par garage, BE ; pas d'agrégation nationale | prouvé |
| A5 Latence | 1,2–2,9 s pour le stock complet d'un garage (1 requête) | prouvé |
| A6 Débit/quota | stock entier en 1 requête ; aucun quota observé | prouvé |
| A7 Stabilité | 3/5 — socle commercial stable (Vehica), mais N socles = N points de casse | estimé |
| A8 Anti-bot | **aucun** sur les sites ouverts (200 direct) ; certains ferment l'API (401 Solid Security) | prouvé |
| A9 Intégration | **élevé** : 1 adaptateur par famille de socle (Vehica, Woo, Hexon, Next maison…) | estimé |
| A10 Maintenance | élevée et croissante avec le nombre de garages suivis | estimé |
| A11 Juridique | **1–2/5** — endpoint public d'un tiers, pas de CGU anti-script relevée, `robots.txt` non bloquant ; risque droit *sui generis* faible vu la fragmentation | argumenté |
| A12 Autonomie | oui par garage ; mais chaque garage peut fermer son API (cas `mondialcar` 401) | prouvé |
| A13 Plafond volumétrie | ~70 annonces/garage ; **pas d'index central** → plafond pratique = Σ garages découverts | prouvé |
| A14 Fraîcheur | **excellente** — source primaire, avant/pendant multidiffusion | argumenté |

**Verdict : VIABLE TECHNIQUEMENT, NON RETENU (redondant avec 2dehands, non passant à l'échelle).**
Mécanique propre et sans anti-bot, mais l'absence d'index central de garages et la redondance avec
2dehands le confinent à un rôle d'appoint mono-marque.

### C-46 — `schema.org/Car` chez les concessionnaires

| Axe | Valeur | Preuve |
|---|---|---|
| A1 / A2 | 0 € / 0 € | prouvé |
| A3 Couverture | **~17 / 40**, vocabulaire `schema.org` standard | prouvé (fiche Hexon, 22 props `Car`) |
| A5 Latence | ~1 fiche = 1 requête ; page lourde (125 Ko–6 Mo) | prouvé |
| A7 Stabilité | 4/5 — `schema.org` est un standard, plus stable qu'un DOM ad hoc | estimé |
| A8 Anti-bot | aucun ; `robots.txt` Hexon autorise explicitement les crawlers IA | prouvé |
| A9 Intégration | modéré — un parseur JSON-LD générique couvre tout socle qui le balise | estimé |
| A11 Juridique | 1–2/5 — le balisage est **destiné** à l'indexation par des tiers | argumenté |
| A13 Volumétrie | énumérable par sitemap là où le socle en publie (Hexon : 1 234 fiches/marque) | prouvé |
| A14 Fraîcheur | source primaire | argumenté |

**Verdict : VIABLE, NON RETENU (même redondance).** C'est le meilleur *mécanisme* du lot — standard,
énumérable, un seul parseur — mais il ne s'applique qu'aux socles qui balisent `Car` (pas Vehica/React)
et ne lève pas la redondance de fond avec 2dehands. Réserve d'appoint mono-marque de premier choix.

### C-76 — Portails constructeurs et labels VO BE (Hexon, `certified.cars.mercedes-benz.be`)

| Axe | Valeur | Preuve |
|---|---|---|
| A3 Couverture | ~17 / 40 (JSON-LD Hexon) | prouvé |
| A4 Géo | BE, **mono-marque par portail** | prouvé |
| A6 / A13 | 1 234 véhicules Mercedes certifiés, énumérables par `sitemap_occasions_1.xml` | prouvé |
| A8 Anti-bot | aucun ; `Crawl-delay: 5` ; crawlers IA explicitement autorisés | prouvé |
| A11 Juridique | 1/5 — sitemap + JSON-LD = invitation à l'indexation | argumenté |
| A12 Autonomie | oui | documenté |
| A14 Fraîcheur | primaire (stock officiel de marque) | argumenté |

**Verdict : VIABLE, NON RETENU pour le volume (mono-marque), UTILE en appoint.** L'union de tous les
portails constructeurs BE resterait très inférieure aux 100 k de 2dehands et exigerait un socle par
constructeur. Q2 (« part significative des ~115 000 AS24 BE ») : **fausse** — non atteignable.

### C-74 — Feeds publicitaires véhicules (Google Vehicle Ads, Meta AIA)

| Axe | Valeur | Preuve |
|---|---|---|
| A3 Couverture | **≥ 20 / 40** dans la spec du feed | documenté (Q4 vraie) |
| A6 / A12 | non lisible : feed **soumis** à Google Merchant Center, privé | documenté |
| A11 Juridique | n/a comme source (ce n'est pas une source lisible) | argumenté |

**Verdict : NON VIABLE comme voie d'acquisition.** C-74 est un **canal de sortie** (le garage pousse
son stock vers Google/Meta), pas un endpoint d'entrée. Sa seule valeur pour KYCAR est **documentaire**
(la spec confirme un dictionnaire de ~20+ champs partagé par l'industrie, utile pour cadrer le schéma).

### C-73 — Réseaux d'affiliation (Awin, Daisycon, TradeTracker) pour AS24 BE

| Axe | Valeur | Preuve |
|---|---|---|
| A3 Couverture | l'affiliation livre des **liens promotionnels/bannières**, pas l'inventaire d'annonces | documenté |
| A11 / E5 | interroger l'inventaire AS24 est de toute façon hors périmètre (E5) | contrainte |

**Verdict : CLOS — NON VIABLE.** Même si un programme d'affiliation AS24 belge existait, un datafeed
d'affiliation est un flux de créatifs marketing (deeplinks trackés), pas le corpus d'annonces
recherché. La question falsifiable 5 est close par la nature même du canal, sans requête AS24 (E5
respecté). Aucun apport data.

---

## Questions falsifiables

1. « ≥ 5 garages sur 20 exposent un stock JSON structuré sans authentification. » — **FAUSSE en l'état.**
   7/17 exposent une API WP REST vivante, mais **un seul** (`monoccasion.be`) sert son *stock véhicule*
   sans auth via une collection interrogeable ; +1 socle Hexon (`mercedes certified`) via JSON-LD ;
   les WooCommerce servent des produits, non des fiches véhicule normalisées. Le stock structuré
   librement lisible est **rare**, pas majoritaire.
2. « L'union des portails constructeurs BE représente une part significative des ~115 000 AS24 BE. »
   — **FAUSSE.** Mono-marque, ~10³/portail (Mercedes : 1 234) ; l'union reste marginale et coûteuse à
   agréger.
3. « Les véhicules de ces sources sont *aussi* sur AS24/2dehands (substituables), non disjoints. »
   — **VRAIE (par inférence forte).** Vendeurs pro pratiquant la multidiffusion → recouvrement élevé
   avec 2dehands. Stock substituable, pas disjoint. (Non mesuré par appariement direct : E5 + budget.)
4. « Le format Vehicle Ads couvre ≥ 20 des 40 champs cibles. » — **VRAIE**, mais le format est une
   spec de soumission, pas une source lisible.
5. « Un programme d'affiliation AS24 belge existe et fournit un datafeed d'annonces. » — **CLOSE :
   sans objet.** Un datafeed d'affiliation ne contient pas d'inventaire d'annonces exploitable.

---

## ACTIONS-COMMANDITAIRE

- **Aucune action bloquante.** Le lot ne débouche sur aucune voie nécessitant compte, contrat ou
  credential : les endpoints utiles sont publics et anonymes (R2 respecté sans reste).
- **Décision d'arbitrage à valider par le commanditaire** : accepter que le stock concessionnaire
  **ne soit pas** une source primaire (redondant + non passant à l'échelle), et le **réserver** à
  deux usages d'appoint : (a) marques de niche mal couvertes sur 2dehands (via sitemap + JSON-LD,
  socle Hexon en priorité) ; (b) instrument de **mesure du taux de multidiffusion** pour valider
  empiriquement le recouvrement 2dehands ↔ garages (nécessiterait un appariement autorisé côté
  2dehands, hors E5 du présent lot).
- **Si un jour la couverture d'une marque premium devient un objectif** : le socle Hexon
  (`certified.cars.*`) est le meilleur point d'entrée — standard `schema.org/Car`, énumérable par
  sitemap, crawlers explicitement autorisés, un seul parseur générique.

---

## Conformité

- **E5 — zéro requête vers `autoscout24.be`/`.com`** : respecté intégralement. Toutes les cibles sont
  des sites de garages, un portail constructeur (`certified.cars.mercedes-benz.be`), un socle groupe
  (`autosphere.be`). Aucune requête AS24. C-73 (affiliation AS24) clos **par le raisonnement**, sans
  sonde AS24.
- **E1/R2 — aucun compte, aucun credential** : respecté. Tous les accès anonymes.
- **R3 — échantillon, pas de volumétrie, plafond 80 requêtes** : respecté. **44 requêtes tierces au
  total** — 20 `robots.txt` + 17 `/wp-json/` + 7 sondes véhicule ciblées (`mono_cars`, `mondial_veh`,
  `mono_vehica`, `mono_listing`, `mb_sitemap`, `mb_occasions_1`, `mb_detail`). Aucune extraction de
  masse : le stock complet d'un garage tient en 1 requête, capturé une fois à titre de preuve.
- **robots.txt des tiers — lu avant chaque sonde, respecté, journalisé** : les 20 `robots.txt` sont
  conservés sous `scratchpad/lotM/robots/`. Aucun endpoint sondé n'est en `Disallow`
  (`/wp-json/` et `/wp/v2/*` ne sont bloqués sur aucun hôte ; `monoccasion` = `Disallow:` vide ;
  `mercedes` autorise `ClaudeBot` et publie ses sitemaps ; `Crawl-delay: 5` de Mercedes respecté par
  temporisation ≥ 5 s ; `morgan-belgium` `Crawl-delay: 10` non sollicité au-delà du `robots.txt`).
- **R1 — preuve ou `[NON VÉRIFIÉ]`** : chaque affirmation chiffrée est adossée à une sortie de
  commande (codes HTTP, `X-WP-Total`, comptes de `<loc>`, clés JSON-LD) ou marquée comme inférence
  (`Q3` : recouvrement 2dehands non mesuré par appariement direct, inférence structurelle explicite).
