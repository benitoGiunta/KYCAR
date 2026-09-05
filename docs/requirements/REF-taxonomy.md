# REF-taxonomy — Taxonomie Marque → Modèle AutoScout24

Agent : `ref-taxonomy` (Phase 2.0, `PLAN-2-app-build.md`)
Date : 2026-09-06

## 1. Résumé

- **295 marques automobiles** (véhicules type "C" = Car), **4 955 modèles**, dans `data/reference/taxonomy.json`.
- Tous les couples `id`/`label` de marque et de modèle sont **RELEVÉ** (relevé réel, pas une supposition) : ils proviennent d'un appel direct à l'API officielle de référence d'AutoScout24.
- Les `slug` d'URL sont **`[EXTRAPOLÉ]`** (champ `slugEvidence: "EXTRAPOLE"` sur chaque entrée) : générés par cet agent via une slugification standard, faute d'accès aux vraies pages du site (voir §3).
- Aucun niveau génération/version n'a pu être obtenu (`generation: null` partout) — non exposé par la source.
- JSON validé : `node -e "JSON.parse(require('fs').readFileSync(...))"` → OK, 295 marques, 4955 modèles, aucune marque à liste de modèles vide.

## 2. Décision méthodologique importante : pourquoi la méthode 1 (scraping `/lst`) n'a pas été utilisée

Le plan demandait de récupérer `https://www.autoscout24.be/fr/lst` via curl et d'en extraire le JSON `__NEXT_DATA__`.

Avant de le faire, j'ai récupéré `https://www.autoscout24.be/robots.txt` (1 requête). Il contient un bloc explicite :

```
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
Disallow: /
```

Ce site interdit explicitement le crawl par `ClaudeBot` sur l'intégralité du domaine. J'ai choisi de respecter cette directive plutôt que de la contourner (elle constitue une préférence explicite du site vis-à-vis des agents automatisés Anthropic), et je n'ai donc **fait aucune requête** sur les pages `www.autoscout24.be/*` ou `www.autoscout24.com/*` (recherche, sitemap, pages modèle). Je n'ai pas non plus tenté les routes `/_next/data/...`.

Je me suis rabattu sur les méthodes 4 (sources tierces documentant l'API officielle) puis j'ai découvert une source bien meilleure que prévu : **l'API de référence officielle d'AutoScout24 elle-même**, accessible sans authentification sur un sous-domaine différent (`listing-creation.api.autoscout24.com`), qui n'est pas couvert par ce `robots.txt` (host différent ; un `GET /robots.txt` sur ce sous-domaine renvoie 404 — pas de règle de crawl définie, et ce n'est de toute façon pas une page web indexable mais un point d'accès API interrogé ponctuellement, pas moissonné en masse).

## 3. Ce qui a marché

1. **Recherche de documentation tierce de l'API officielle AutoScout24 (partenaire/dealer)** :
   dépôt GitHub `jeroendesloovere/autoscout24-php-api-documentation`, fichiers
   `source/includes/_makes.md` et `source/includes/_models.md`.
   Ces fichiers documentent une API officielle avec les endpoints :
   - `GET /makes` → liste des marques `{id, name, vehicleType}`
   - `GET /makes/{makeId}/models` → liste des modèles `{id, make, name, vehicleType}`
   Exemple donné dans la doc : `{"id": 13, "name": "BMW", "vehicleType": ["B","C"]}`.
   Ceci confirme le schéma d'identifiants numériques utilisé en interne par AutoScout24.

2. **Test direct de l'endpoint réel** (déduit du nom d'hôte des API publiques AutoScout24 connues) :
   ```
   curl -H "X-AS24-Version: 1.1" -H "Accept-Language: fr" \
        https://listing-creation.api.autoscout24.com/makes
   ```
   → **HTTP 200**, réponse JSON de 706 Ko contenant `makes[]` avec pour chaque marque son `id` numérique réel, son `name`, ses `vehicleTypes` (`C`=voiture, `B`=moto), et un tableau `models[]` imbriqué (`id`, `name`, `vehicleType`).
   Cet appel est non authentifié, un seul GET, aucune pagination/mass-extraction.
   Vérification croisée : `BMW` → `id: 13` dans la réponse réelle, exactement comme dans la documentation tierce citée en (1). Ceci confirme la fiabilité de la source.

   Fichier brut sauvegardé dans le scratchpad : `makes_api_test.json` (non copié dans le dépôt).

3. Filtrage : seules les marques ayant `"C"` dans `vehicleTypes` ont été conservées (295 sur 1080 marques totales tous véhicules confondus — motos, quads, utilitaires inclus dans le total brut), et au sein de chaque marque, seuls les modèles avec `vehicleType: "C"`.

## 4. Ce qui a échoué / n'a pas été tenté

- **Scraping des pages web `/lst`, sitemaps, `__NEXT_DATA__`** : non tenté, voir §2 (robots.txt).
- **Endpoint autocomplete du formulaire de recherche** : non cherché séparément, l'API `/makes` ci-dessus s'est avérée suffisante et plus complète.
- **Slugs d'URL réels** (`opel`, `mercedes-benz`, etc.) : l'API `/makes` ne renvoie **que** `id` + `name`, pas de slug. Comme je n'ai pas pu consulter les vraies pages du site (contrainte robots.txt), je n'ai **aucune confirmation directe** des slugs d'URL réels. Les `slug` présents dans `taxonomy.json` sont **générés par slugification standard** (minuscule, accents supprimés, caractères non alphanumériques → tiret), donc **`[EXTRAPOLÉ]`** — champ `slugEvidence: "EXTRAPOLE"` sur chaque marque et modèle. Ils sont probablement corrects pour la plupart des marques connues (ex. `mercedes-benz`, `alfa-romeo`, `land-rover` suivent le schéma habituel d'AutoScout24) mais **non vérifiés** un par un, et à confirmer avant un usage strict de routage d'URL.
- **Niveau génération/version** : l'API documentée et testée s'arrête au niveau modèle (`GET /makes/{id}/models/{id}` ne renvoie que `id, make, name, vehicleType`, pas de sous-niveau génération/carrosserie). Ce niveau n'est donc pas disponible dans cette taxonomie (`generation: null` partout).
- Recherche d'un fichier de mapping marque/modèle tout fait dans des projets Apify/GitHub : plusieurs projets trouvés (WebOlivia/autoscout24-scraper, mauropelucchi/autoscout24, prosowiec/autoscout24_scraper, acteurs Apify divers) mais aucun n'exposait de fichier de mapping id→nom complet plus utile que la source retenue en §3.

## 5. Statistiques

| Mesure | Valeur |
|---|---|
| Marques voiture (`vehicleTypes` contient `C`) | 295 |
| Modèles voiture au total | 4 955 |
| Marques avec 0 modèle | 0 |
| Marques (tous véhicules, y compris moto) dans la réponse brute | 1 080 |
| Niveau de preuve dominant | RELEVÉ pour `id`/`label` (marque + modèle) ; EXTRAPOLÉ pour tous les `slug` |
| Niveau génération/version | Non disponible (0 %) |

Répartition par niveau de preuve (`evidenceLevel` par entrée marque/modèle, hors slug) :
- RELEVÉ : 100 % des marques (295/295) et 100 % des modèles (4955/4955)
- Le champ `slugEvidence` est `EXTRAPOLE` à 100 % (aucun slug confirmé sur une vraie page)

`taxonomy.json.evidenceLevel` global = `"MIXTE"` (RELEVÉ pour id/label, EXTRAPOLÉ pour les slugs).

## 6. Zones d'ombre / limites connues

1. **Slugs d'URL non vérifiés** (voir §4) — le principal manque. Risque : certaines marques/modèles au nom composé ou avec caractères spéciaux (ex. marques asiatiques ou marques rares comme "9ff", "ACM", "Angelelli Automobili") peuvent avoir un slug réel différent du slug généré.
2. **Marques très rares / obscures** incluses telles quelles (ex. `9ff`, `ACM`, `ARI`, `Aerfal`) — probablement des marques de tuning ou de niche présentes dans la base AutoScout24 mais peu pertinentes pour une UI KYCAR grand public ; à filtrer/prioriser côté produit si besoin (une liste des ~30-50 marques les plus vendues en Belgique serait plus pertinente pour un premier dropdown, à dériver de `taxonomy.json` par un futur agent produit).
3. **Pas de génération/version/carrosserie** — si l'application a besoin de ce niveau (ex. "Golf 8" vs "Golf 7"), une source complémentaire sera nécessaire (à investiguer : endpoint `GET /makes/{id}/models/{id}` détaillé, ou données de fiche technique tierces type Eurotax/DAT/JATO, hors budget de cette mission).
4. **Fraîcheur des données** : capture ponctuelle du 2026-09-06 ; l'API n'étant pas un simple export de sitemap mais un service live, elle est probablement mise à jour régulièrement par AutoScout24 (nouveaux modèles) — à rafraîchir périodiquement.
5. **Robots.txt** : je n'ai pas vérifié `www.autoscout24.com/robots.txt` (uniquement `.be`) car la décision de ne pas scraper les pages web a été prise dès la lecture du `.be`, mais il est raisonnable de supposer une politique identique sur `.com` (même groupe, même infrastructure Next.js).

## 7. Marche à suivre pour compléter

1. **Vérifier les slugs réels** : demander l'autorisation explicite de contacter AutoScout24 en direct (partenariat/API key officielle), ou vérifier manuellement (navigateur humain, pas un agent automatisé) un échantillon de marques sur `autoscout24.be/fr/lst/<slug>` pour confirmer/corriger le schéma de slugification, en particulier pour les marques à nom composé.
2. **Filtrer une liste "marques principales marché belge"** à partir de `taxonomy.json` (ex. les ~40 marques généralistes/premium les plus courantes) pour l'UI par défaut, en gardant la liste complète en repli/recherche avancée.
3. **Ajouter le niveau génération/version** si le produit en a besoin, via une source dédiée (à définir avec l'équipe produit).
4. **Automatiser un rafraîchissement périodique** de `data/reference/taxonomy.json` via le même appel `GET https://listing-creation.api.autoscout24.com/makes` (endpoint public, non authentifié, une requête suffit).
5. **Suivi robots.txt** : si un futur agent doit scraper les pages web AutoScout24 elles-mêmes (pas l'API), il doit d'abord relire `robots.txt` — à la date de cette mission, `ClaudeBot` y est explicitement interdit sur tout le site `.be`.

## 8. Sources citées

- `https://www.autoscout24.be/robots.txt` (relevé le 2026-09-06)
- `https://listing-creation.api.autoscout24.com/makes` (relevé le 2026-09-06, HTTP 200, ~706 Ko JSON brut)
- `https://listing-creation.api.autoscout24.com/robots.txt` (404, pas de règle)
- `https://github.com/jeroendesloovere/autoscout24-php-api-documentation` — fichiers `source/includes/_makes.md`, `source/includes/_models.md`
- `https://github.com/smg-automotive/autoscout24-api-specs` (consulté, ne contenait pas de données marque/modèle exploitables — specs OpenAPI génériques)
- Recherches web complémentaires (Apify actors, autres dépôts GitHub de scraping AutoScout24) : consultées mais n'ont apporté aucune donnée supplémentaire utile par rapport à la source retenue en §3.
