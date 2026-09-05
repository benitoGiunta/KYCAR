# API de référence AutoScout24 — découverte, portée et limites

**Statut** : vérifié par exécution le 2026-09-06. Toutes les affirmations chiffrées de ce document
proviennent d'une requête réelle dont la commande est indiquée.

## Ce qui a été trouvé

`listing-creation.api.autoscout24.com` est l'API officielle de **création d'annonces** d'AutoScout24,
réservée aux concessionnaires. Ses opérations d'écriture exigent une authentification OAuth.
Mais **deux familles d'endpoints de lecture y sont ouvertes, sans aucune authentification** :

| Endpoint | Contenu | Statut vérifié | Latence observée |
|---|---|---|---|
| `GET /makes` | Toutes les marques et leurs modèles, avec identifiants numériques AutoScout24 | 200 | ~490 ms |
| `GET /references?referenceType=<T>` | Domaine de valeurs d'un attribut de classification | 200 | 40–370 ms |
| `GET /assets/openapi/spec.yml` | Spécification OpenAPI complète, 122 schémas | 200 | — |
| `GET /assets/docs/*.md` | Documentation fonctionnelle, dont le modèle de données complet | 200 | — |

Et surtout, la spécification OpenAPI publique donne la liste exhaustive des types de référentiels,
ce qui évite de les devinerf : `ReferenceType` est une énumération de 33 valeurs.

## Pourquoi cette source et pas un scraping du site

`https://www.autoscout24.be/robots.txt` contient un bloc explicite :

```
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
Disallow: /
```

Le site interdit nommément `ClaudeBot` sur l'intégralité du domaine. Cette directive est respectée :
**aucune requête n'a été faite sur `www.autoscout24.be/*` ni `www.autoscout24.com/*`** — ni page de
recherche, ni sitemap, ni route `/_next/data/`.

L'hôte de l'API est distinct et ne sert aucun `robots.txt` (404), donc aucune règle de crawl n'y est
déclarée. Il n'est de toute façon pas interrogé en moissonnage : le harvester fait une requête par
type de référentiel, une fois, avec temporisation et recul exponentiel sur 429.

**Ce que cela ne résout pas** : cette API donne la *classification*, pas les *annonces*. Elle ne
contient aucun inventaire, aucun prix, aucun véhicule réel. Le problème du chargement des annonces
reste entièrement ouvert et relève du chantier 1.

## Ce que cela apporte au projet

1. **Le référentiel de filtres et la taxonomie ne sont plus une extrapolation.** Les valeurs, leurs
   identifiants et leurs libellés français viennent de la source canonique. C'était le principal
   risque de la phase 2.0 : spécifier un bandeau de filtres plausible mais faux.
2. **Le dictionnaire de données a une base officielle.** Les 122 schémas de la spec — en particulier
   `Listing` et `ListingPayload` — décrivent champ par champ ce qu'AutoScout24 modélise pour une
   annonce, avec types, contraintes et cardinalités. C'est la matière première de la phase 2.1.
3. **C'est gratuit, autonome et sans contrat.** Sur les deux critères du chantier 1 (gratuit + autonome),
   cette voie est acquise — mais uniquement pour la couche référentielle.

## Contenu récupéré

Reproductible par `node scripts/fetch-reference-data.mjs --marketplace be --culture fr-BE`.

### Taxonomie

| Fichier | Portée | Marques | Modèles |
|---|---|---|---|
| `data/reference/taxonomy.json` | voitures uniquement (`vehicleType` = `C`) | 295 | 4 955 |
| `data/reference/taxonomy-all.json` | tous types de véhicules | 1 080 | 13 263 |

Le champ `vehicleTypes` (pluriel, tableau) porté par la marque et `vehicleType` (singulier, scalaire)
porté par le modèle permettent le filtrage. Une marque peut être mixte : BMW est `["B","C"]`, moto
et voiture, et seuls ses modèles `C` nous concernent.

`VehicleType` : `B` moto, `C` voiture, `L` remorque, `N` caravane / camping-car, `X` fourgon.

### Référentiels d'attributs

31 des 33 types récupérés, 673 valeurs au total, dans `data/reference/references/`.
Les plus structurants pour KYCAR :

| Type | Valeurs | Exemples relevés (libellés `fr-BE`) |
|---|---|---|
| `BodyType` | 66 | `1` Citadine, `2` Cabriolet, `3` Coupé, `4` SUV/4x4/Pick-Up, `5` Break, `6` Berline, `12` Monospace |
| `Equipment` | 173 | le plus gros référentiel, base de la liste d'équipements filtrables |
| `Country` | 249 | — |
| `FuelType` | 16 | `1` Essence 91, `2` Super 95, `12` Électrique, `13` Hydrogène |
| `FuelCategory` | 11 | regroupement de plus haut niveau que `FuelType` |
| `BodyColor` | 14 | — |
| `UpholsteryColor` | 11 | — |
| `EuEmissionStandard` | 11 | — |
| `EfficiencyClass` | 10 | — |
| `Co2Class` | 7 | — |
| `OfferType` | 6 | `U` Occasion, `N` Neuf, `D` Démonstration, `J` Voiture récente, `S` Pré-enregistrement, `O` Ancêtre |
| `PlugType` | 6 | — |
| `PriceLabel` | 6 | — |
| `UpholsteryType` | 6 | — |
| `Transmission` | 3 | `A` Automatique, `M` Manuelle, `S` Semi-automatique |
| `Drivetrain` | 3 | — |

## Limites établies

| # | Limite | Preuve |
|---|---|---|
| L1 | **Pas d'annonces.** Cette API ne sert que de la classification. Le chargement de l'inventaire n'est pas résolu. | portée de la spec OpenAPI |
| L2 | **Le paramètre `marketplace` est inerte sur `/makes`.** Documenté comme filtrant, il ne change rien : `/makes`, `?marketplace=de`, `?marketplace=be` et `?marketplace=be&culture=fr-BE` rendent tous 1 080 marques et 13 263 modèles. | 4 requêtes comparées |
| L3 | **Pas de slugs d'URL.** L'API rend `id` et `name`, jamais le slug utilisé par le site. Les slugs de `taxonomy.json` sont produits par slugification et restent `[EXTRAPOLÉ]` — à ne pas utiliser pour construire une URL AutoScout24 sans vérification. | schéma de réponse |
| L4 | **Pas de niveau génération/version.** La taxonomie s'arrête au modèle. | schéma de réponse |
| L5 | **`EngineMountingType` et `Steering` sont déclarés mais non implémentés.** Les deux rendent `400 {"code":"unavailable-reference"}` quels que soient `culture` et `marketplace`. Dérive entre spec et implémentation. | 6 requêtes |
| L6 | **Localisation partielle.** Avec `culture=fr-BE`, certains libellés restent en anglais : `FuelType` rend « Vegetable oil », « Biogas », « Ethanol » à côté de « Essence 91 » et « Électrique ». Prévoir une table de surcharge côté KYCAR. | contenu de `FuelType.json` |
| L7 | **Référentiel de création, pas de recherche.** Ces valeurs décrivent ce qu'un concessionnaire peut *déclarer*. Les paramètres du *formulaire de recherche* du site public sont un ensemble voisin mais distinct, avec ses propres codes d'URL. Le mappage entre les deux reste à établir. | nature de l'API |
| L8 | **429 documenté.** La spec déclare une réponse `RateLimitExceeded` sans en publier le seuil. Le harvester temporise 250 ms et recule exponentiellement. Seuil réel inconnu. | spec OpenAPI |

L7 est la limite la plus importante à retenir pour la phase 2.0 : elle signifie que
`REF-filters.md` ne peut pas être déduit de cette seule API. Les codes de paramètres d'URL du
moteur de recherche public doivent venir d'ailleurs, et le site étant interdit au crawl,
ils viendront de sources tierces — donc avec un niveau de preuve inférieur.

## Fichiers vendorés

| Fichier | Taille | Pourquoi il est dans le dépôt |
|---|---|---|
| `docs/reference/vendor/as24-listing-creation-openapi.yml` | 270 Ko | 122 schémas, dont `Listing` et `ListingPayload` : source du dictionnaire de données de la phase 2.1. Figé pour que le document d'exigences reste reproductible même si l'API change. |
| `docs/reference/vendor/as24-data-models.md` | 873 Ko | Modèle de données commenté, lisible, avec les contraintes métier que le YAML n'exprime pas. |
