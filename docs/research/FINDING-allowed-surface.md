# Constat vérifié — la surface autorisée par `robots.txt` porte des données de marché

**Statut** : prouvé par exécution le 2026-09-06. Répond par l'affirmative à la première question
falsifiable du candidat `C-14` de `candidates-v1.md`. À reprendre en phase 1.4 comme candidat
prioritaire.

## 1. Lecture exacte du `robots.txt` — E5 était trop restrictive

`https://www.autoscout24.be/robots.txt` (HTTP 200, 2 756 octets, relevé le 2026-09-06).
Le groupe qui nous concerne s'étend des lignes 19 à 43 :

```
19  User-agent: GPTBot
20  User-agent: ClaudeBot
21  User-agent: Google-Extended
22  User-agent: Applebot-Extended
23  User-agent: CCBot
24  Disallow: /
25
26  Allow: /fr/informer/
27  Allow: /fr/voiture/
28  Allow: /fr/conseiller-en-voitures/
29  Allow: /fr/vendre-voiture/
30  Allow: /fr/vendre-moto/
31  Allow: /fr/credit-auto/
32  Allow: /fr/entreprise/
33
34  Allow: /nl/informeren/
35  Allow: /nl/auto/
36  Allow: /nl/consulent-elektrische-auto/
37  Allow: /nl/auto-verkopen/
38  Allow: /nl/motor-verkopen/
39  Allow: /nl/financiering/
40  Allow: /nl/onderneming/
41
42  Allow: /evaluationvoiture/
43  Allow: /prijsschatting/
44
45  User-agent: *
```

**Point de droit technique** : un groupe robots.txt court jusqu'au prochain `User-agent:`, qui
n'arrive qu'à la ligne 45. Les 17 directives `Allow:` des lignes 26 à 43 appartiennent donc au
**même groupe** que `ClaudeBot`, et non au groupe `*`. Par la règle du chemin le plus long
(RFC 9309, § 2.2.2), `Allow: /fr/voiture/` l'emporte sur `Disallow: /` pour toute URL sous ce préfixe.

**Correction de E5** : la contrainte n'est pas « aucune requête sur le site », mais
« uniquement les 17 préfixes ci-dessus ». Les pages de recherche `/lst?`, les pages d'offre
`/fr/offres/…`, les endpoints internes et tout le reste demeurent interdits.

Autres relevés du même fichier :
- **Aucune directive `Sitemap:`** — la découverte par sitemap n'est pas offerte.
- Le groupe `*` interdit nommément les endpoints internes que le candidat `C-09`/`C-10` visait :
  `/listing-search-api/graphql`, `/ocs/api/graphql`, `/search-subscriptions/api/new-results-count`,
  `/classified-list/react-listelements`, `/as24-search-funnel/api/vip-showroom`. Ils sont donc
  interdits à *tous* les agents, pas seulement aux agents d'IA.

## 2. Ce que contient la surface autorisée

Sondes exécutées sur des chemins autorisés uniquement :

| URL | HTTP | Taille | `totalItems` | Annonces incluses |
|---|---|---|---|---|
| `/fr/voiture/` | 200 | 394 Ko | — | — |
| `/fr/voiture/opel/` | 200 | 439 Ko | **5 220** | 20 |
| `/fr/voiture/opel/opel-corsa/` | 200 | 443 Ko | **1 281** | 20 |
| `/evaluationvoiture/` | 200 | 353 Ko | — | — |
| `/fr/informer/` | 200 | 477 Ko | — | — |
| `/fr/voiture/opel/corsa/` | **404** | — | — | le slug modèle est `opel-corsa`, pas `corsa` |

Chaque page porte un `<script id="__NEXT_DATA__">` exploitable (122 Ko de JSON pour la page marque).
`props.pageProps` expose notamment :

`contentful`, `modelTechDataSpecsRanges`, `techDataFacts`, `traderKeySpecifications`,
`contentApiData`, `adacData`, `ratings`, `reviews`, `interlinking`,
`additionalInterlinkingGroups`, `allEvsData`, `priceInfo`, `topModels`, `awards`, `recalls`,
`listings`, `listPageInfo`, `alternativeModelsData`, `scores`, `trimComparisonData`.

### 2.1 — Agrégats par modèle : `topModels`

```json
{ "modelId": "20191", "title": "Opel Adam",
  "slug": "https://www.autoscout24.be/fr/voiture/opel/opel-adam/",
  "bodyTypes": ["Berline"], "listingsCount": 0 }
```

Trois choses en découlent :
1. `modelId` **correspond exactement** aux identifiants du référentiel officiel — `20191` est bien
   Adam dans `data/reference/taxonomy.json`. Les deux sources se recoupent, ce qui les valide l'une
   par l'autre.
2. `slug` donne le **vrai slug d'URL**, ce qui lève le point ouvert O5 pour les modèles atteignables
   par cette voie. Le format est `<marque>-<modèle>`, pas `<modèle>` — d'où le 404 sur `corsa`.
3. `listingsCount` est un **agrégat par modèle**, exactement la granularité du mode 1 de KYCAR.

### 2.2 — Fourchettes de prix : `priceInfo`

```json
[ { "type": "buyingNew",  "minPrice": { "value": "15 981,- €" } },
  { "type": "buyingUsed", "minPrice": { "value": "119,- €" } },
  { "type": "financing",  "minPrice": { "value": "1,- €" } } ]
```

Minima seulement, pas de distribution. Utile mais insuffisant seul.

### 2.3 — Annonces réelles : 20 par page, 40 champs chacune

`listings.metadata.totalItems` donne le total (5 220 pour Opel BE), `listings.listings[]` en
contient 20. Les champs relevés sur une annonce :

- **identité** : `id` (UUID), `details.webPage` (deeplink)
- **prix** : `prices.public.amountInEUR.raw`, `.formatted`, `taxDeductible`, `onRequestOnly`,
  et `prices.public.evaluation.category` — l'évaluation de prix calculée par AutoScout24
- **classification** : `make.formatted`, `model.formatted`, `modelVersionInput`, `type`, `modelYear`
- **motorisation** : `engine.power.kw.raw`, `engine.power.hp.raw`
- **carburant** : `fuels.fuelCategory.raw` + `.formatted`, `fuels.primary.source`,
  `consumption.combinedWithFallback`, `co2emissionInGramPerKmWithFallback`
- **état** : `condition.firstRegistrationDate`, `condition.mileageInKm.raw`,
  `condition.numberOfPreviousOwnersExtended.raw`, `usageState`
- **géographie** : `location.countryCode`, `location.zip`, `location.city`
- **vendeur** : `seller.id`, `seller.type`, `seller.companyName`, `seller.contactName`
- **divers** : `adProduct.tier`, `media.images[]`, `superDeal`, `publication.accurateState`, `publication.isNew`

Les champs `co2emissionInGramPerKm` et `consumption` sont **présents dans la donnée d'annonce**
alors qu'aucun *filtre* ne les expose. C'est cohérent avec la section Z5 de `REF-filters.md` :
absence de filtre ne signifie pas absence de champ.

### 2.4 — Confirmation directe de la réconciliation des vocabulaires

Une même annonce porte **les deux vocabulaires simultanément** :
- `fuels.fuelCategory.raw = "B"` → vocabulaire de **recherche**
- `fuels.primary.source = "Super 95 / Essence 91 / Super Plus 98 / …"` → libellés du vocabulaire de **création**

C'est la validation empirique de `REF-vocabulary-reconciliation.md` : les deux niveaux
d'abstraction coexistent dans la donnée, et l'exigence V1 (deux champs distincts,
`fuelCategory` et `fuelType`) est confirmée par la source elle-même.

### 2.5 — Alerte RGPD confirmée par la donnée

`seller.contactName` contient un **nom de personne physique** (relevé : « Youssef Yaghzar »,
vendeur professionnel). Le champ existe et est servi. La règle R3 — aucune colonne pour les
identifiants vendeur dans le schéma KYCAR — n'est donc pas une précaution théorique : c'est le
filtre qui empêchera cette donnée d'entrer. L'adaptateur `DataProvider` devra **écarter ces champs
à l'ingestion**, pas au stockage.

## 3. Portée réelle et limites

| # | Limite | Preuve |
|---|---|---|
| P1 | **20 annonces par page, pas de pagination observée** sur ces pages. Plafond théorique : 20 × ~4 955 modèles ≈ 99 000 annonces, contre un `totalItems` de 5 220 pour la seule marque Opel. La couverture est donc très partielle. | comptage sur 2 pages |
| P2 | **L'échantillon n'est probablement pas aléatoire.** `adProduct.tier` = `T50` sur la première annonce suggère un tri influencé par le produit publicitaire. Un échantillon biaisé fausserait toute distribution. **À prouver ou infirmer en 1.4 — c'est la question dimensionnante.** | inférence, `[NON VÉRIFIÉ]` |
| P3 | Les **agrégats** (`totalItems`, `listingsCount`) sont en revanche exhaustifs par construction, et couvrent exactement le mode 1 de KYCAR. | nature du champ |
| P4 | Périmètre géographique : `listPageInfo.heroInventory.searchParams = "cy=B"` indique un périmètre **Belgique**, cohérent avec H1. Répond à la 3ᵉ question de `C-14`. | contenu du JSON |
| P5 | Volumétrie de crawl : énumérer 295 marques et 4 955 modèles représente ~5 250 requêtes de ~440 Ko, soit ~2,3 Go par snapshot. Coûteux mais praticable ; le débit soutenable est inconnu. | calcul, débit `[NON VÉRIFIÉ]` |
| P6 | Aucune directive `Sitemap:` : l'énumération doit passer par `topModels` et `interlinking`, de proche en proche. | contenu du robots.txt |

## 4. Ce que ce constat change pour les deux chantiers

**Chantier 1.** Une voie **gratuite, autonome et conforme à `robots.txt`** existe, ce qui est le
critère S6 de la phase 1.6. Elle est acquise pour les **agrégats** et pour un **échantillon** de
20 annonces par modèle. Elle ne l'est pas pour l'inventaire exhaustif. Le candidat `C-14` passe
donc en tête des priorités de la phase 1.4, avec deux questions à trancher :
la représentativité de l'échantillon (P2) et le débit soutenable (P5).

**Chantier 2.** Le mode 1 de KYCAR — cartes par marque, zones par modèle, nombre d'offres et
fourchettes — est alimentable **dès maintenant** par cette voie. Le mode 2, les distributions
fines, exige soit un échantillon plus large, soit une autre source. Cela ne change pas
l'architecture : les deux modes passent par `DataProvider`, et un adaptateur peut servir les
agrégats réels tout en laissant les distributions au dataset synthétique.

## 5. Reproduction

```bash
curl -s -A 'ClaudeBot' https://www.autoscout24.be/fr/voiture/opel/ \
  | grep -o '<script id="__NEXT_DATA__"[^>]*>.*</script>'
```

7 requêtes ont été faites au total pour établir ce constat, toutes sur des préfixes autorisés.
