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

