# KYCAR — Générateur de fixtures : mode d'emploi et rapport (phase 3.2, agent `dataset-gen`)

**Périmètre** : ce document dit **comment** produire les fixtures, **où** chaque règle
`R-01 … R-61` et chaque anomalie `A-01 … A-24` de `docs/data/DATASET-SPEC.md` est implémentée, **ce
qui a été mesuré** et **où le générateur s'écarte de la spécification et pourquoi**. Il ne redéfinit
aucune valeur : les paramètres restent dans les quinze tables `docs/data/dataset-spec/*.json`, lues
telles quelles à l'exécution.

**Amont** : `docs/data/DATA-MODEL.md` (couche source, 31 contraintes), `data/schema/*.schema.json`,
`docs/data/DATASET-SPEC.md` (61 règles, 26 anomalies, 110 sondes), `reports/data/DATA-LEAD-DECISIONS.md`
(D3-01 … D3-17). **Aval** : `data-review` (phase 3.3) écrit les 110 sondes d'après `probes.json` et
les fait passer **sans les modifier** (D-31/D-32) ; `fixture-provider` (3.3) lit les fixtures.

---

## 1. Usage

```bash
npm run data:gen      -- --profile dev|test|perf [--seed <n>] [--out data/fixtures]
npm run data:validate -- --profile dev|test|perf [--out data/fixtures]
npm run data:check    -- --profile dev|test|perf [--out data/fixtures] [--no-regen]
```

`data:gen` écrit, pour chacun des **trois snapshots hebdomadaires** du profil :

| Fichier | Contenu |
|---|---|
| `data/fixtures/<profil>/<snapshotId>/listings.ndjson.gz` | une annonce `As24Listing` par ligne, triée `(make, model, firstRegistrationDate, id)` (R-32, E-05) |
| `data/fixtures/<profil>/<snapshotId>/manifest.json` | conforme à `snapshot-manifest.schema.json` : graine, `schemaVersion`, `capturedAt`, `listingCount`, `sha256` des octets **non compressés**, `delta`, **vérité terrain** anomalie par anomalie |
| `data/fixtures/<profil>/<snapshotId>/generation.json` | rapport latéral : version de la spec, hachage des quinze tables et des deux schémas, calibrages, effectifs visés par anomalie, filtres non alimentés, mesures (voir écart **EG-04**) |

`snapshotId` suit le **schéma du manifest** (`^[a-z]{2}-[0-9]{8}T[0-9]{6}Z$`), soit
`be-20260907T060000Z`. L'identifiant de conception de `profiles.json`
(`be-fixture-test-20260907-4b594341`) est publié dans `generation.json` (écart **EG-02**).

- Graine par défaut **`0x4B594341` = 1 264 141 121** (`profiles.json.defaultSeed`).
- `perf` n'est **jamais commité** : `.gitignore` porte `data/fixtures/perf/`.
- `data:gen` **valide chaque ligne** contre `as24-listing.schema.json` pendant la génération et sort
  en erreur si une seule ligne est rejetée. Aucun fichier `listings.invalid.ndjson.gz` n'est produit :
  `dataset-design` n'a prévu **aucune** ligne délibérément non conforme (E-07 retire `A-06` et
  `A-18`, D3-16 subordonnait la ligne invalide à cette prévision).
- `data:check` marque `DETTE` (et non `ECART`) les trois constats déjà tranchés au §6 : la porte du
  générateur reste fermée sur tout le reste.

---

## 2. Architecture du générateur

**Choix de langage — JavaScript ESM `.mjs` avec JSDoc typé.** `tsx` n'est pas installé, le projet
n'a pas de chaîne de compilation pour `tools/` (`tsconfig.json` n'inclut que `src` et
`vite.config.ts`), et un répertoire `tools/dataset/dist/` ajouterait une étape de build à un
livrable que `data-review` doit pouvoir relancer d'une seule commande. Le générateur est donc du
JavaScript ESM exécuté par `node`, dans le même style que `tools/check-bundle-size.mjs`, qui a déjà
son bloc de globals dans `eslint.config.js`. **Aucune dépendance ajoutée** : `ajv` et `ajv-formats`
sont déjà en `devDependencies`.

**Réutilisation de `src/providers/synthetic/` (D3-04).** `prng.ts` est **porté verbatim** dans
`tools/dataset/prng.mjs` (même état 128 bits en entiers signés, même séquence `xoshiro128**`, même
table de 8 192 gaussiennes), plus le polynôme de saut standard exigé par
`profiles.json.snapshotSeedRule`. L'import direct du TypeScript est **impraticable** : pas de `tsx`,
pas de build. `catalog.ts` et `popularity.ts` ne sont **pas** réutilisés : ils dépendent des types
applicatifs (`ReferenceData`, `VocabularyName`) que le référentiel brut ne porte pas, et la
correction **C-2** de DATASET-SPEC remplace de toute façon leur tirage multinomial par
l'apportionnement de `makes.json`.

```
tools/dataset/
  prng.mjs        xoshiro128**, hashToUnit / hashToU32 / combineKeys / pureUnit, jump()
  tables.mjs      chargement + SHA-256 des 15 tables, du référentiel et des 2 schémas ; interpolations
  population.mjs  R-02 apportionnement · R-03/R-04/R-10 catalogue indexé par année · R-05/R-06 calibrage IPF
  listing.mjs     R-04 à R-49 : une annonce PLAUSIBLE (segment, âge, carburant, puissance, km, prix,
                  émissions, équipements, vendeur, géographie, version, durée d'exposition)
  dealers.mjs     R-27/R-28 : concessionnaires fictifs (Zipf 0,85, clé SHA-256 salée) et palier publicitaire
  anomalies.mjs   R-57/R-58 : rôles de clonage, affectation par slot à effectif EXACT, injection, vérité terrain
  serialize.mjs   R-23 à R-25 (prix dérivés) · R-43 à R-46 (valeurs manquantes) · R-30 à R-33
                  (identifiants, dates, ordre des clés, tri, NDJSON, gzip, SHA-256)
  snapshot.mjs    R-50 à R-56 : population de slots, sorties, entrées, révisions, chaînage
  filters.mjs     R-61 / P-82 : couverture fonctionnelle des filtres retenus
  schema.mjs      compilation ajv des deux schémas
  generate.mjs / validate.mjs / check.mjs   les trois commandes
```

### 2.1 L'idée centrale : une **population de slots**

Le profil est une population de **slots**, fixée au premier snapshot. Un slot porte sa **marque**
(issue de l'apportionnement, donc exacte), son **concessionnaire**, son éventuel **rôle de clonage**
et ses **anomalies**. D'un snapshot à l'autre un slot change d'occupant — sortie puis entrée — mais
jamais de propriétés. Quatre sondes deviennent vraies **par construction** :

| Sonde | Ce que la structure garantit |
|---|---|
| `P-66` | l'effectif par marque est identique sur les trois snapshots |
| `P-72` | l'effectif de chaque anomalie l'est aussi |
| `P-49` | le jeu de `dealerBucket` est le même partout |
| `P-70` | une survivante non révisée est identique champ à champ |

Une annonce **entrante** est tirée sur un **flot dédié**, semé par son rang global : elle peut donc
être retirée jusqu'à satisfaire les exigences de son slot (type de vendeur, base d'une anomalie
conditionnelle, modèle épinglé pour `A-11`) **sans décaler** le flot des autres annonces.

### 2.2 Sélection d'anomalie à effectif **exact**

`A-02` vaut 0,02 % : **quatre** annonces au profil test. Un tirage de Bernoulli indépendant y a un
écart-type de 2 — `P-72` (± 20 % relatifs) serait rouge une fois sur deux sans qu'aucun défaut ne
l'explique. Le générateur sélectionne donc les `round(taux × N)` plus petites clés d'une **course
exponentielle** `−ln(u)/w`, où `u` est un **hachage pur** de l'annonce et `w` un poids conditionnel
(`A-23` : 0,5 % chez un particulier, 3,5 % chez un professionnel, 22 % chez un professionnel du
segment luxe ou au-dessus de 80 000 €). L'effectif est **exact**, la structure conditionnelle est
respectée, et le flot principal n'est pas consommé (R-30).

### 2.3 Ordre des opérations

```
1. tables + catalogue + calibrage IPF des segments      (aucun aléa, entièrement déterministe)
2. apportionnement des marques -> slots
3. population S0 sur le flot principal                  (valeurs PLAUSIBLES)
4. rôles de clonage (A-07, A-07b, A-08)                 propriétés de slot
5. concessionnaires + palier publicitaire -> surcote de prix, re-arrondi
6. affectation des anomalies aux slots                  effectifs exacts
7. calibrage du modèle de complétude (gelé pour le profil)
8. pour chaque snapshot k : sorties, entrées, révisions, puis par annonce :
   dates -> anomalies (injection APRÈS la valeur plausible) -> prix dérivés
        -> valeurs manquantes -> projection As24Listing -> tri -> NDJSON -> SHA-256 -> gzip
```

---

## 3. Correspondance règle → module et fonction

| Règle | Où | Note |
|---|---|---|
| R-01 marché, volumes, snapshots | `snapshot.mjs:prepareProfile`, `generate.mjs` | `marketplace = be`, `vehicleType = C`, `countryCode = BE` |
| R-02 apportionnement au plus fort reste + plancher de présence | `population.mjs:apportionMakes` | mesuré : 0 siège déplacé aux profils dev et test |
| R-03 / R-04 modèles curatés et queue Zipf(1,15) | `population.mjs:buildCatalog` | segment d'un modèle de queue tiré par annonce dans la loi de stock (voir **EG-03**) |
| R-05 / R-06 segments par année × biais de stock | `population.mjs:calibrateSegments` | ajustement proportionnel itératif (voir **EG-01**) |
| R-07 boîte de vitesses | `listing.mjs` (logistique `a0/a1/a2`) | électrique forcé en `A` (`P-26`) |
| R-08 carrosserie, portes, sièges, roues motrices, couleurs, sellerie | `listing.mjs` (tables par segment) | + 1 % de code `7 Autres` |
| R-09 / R-10 âge log-normal conditionné à la fenêtre de production | `population.mjs:buildAgeLaw`, `listing.mjs` | année indisponible → année **la plus proche** disponible dans la marque (voir **EG-05**) |
| R-11 kilométrage | `listing.mjs` | `m_f · max(âge, 0,4)^0,90`, σ 0,35, arrondi 100 km |
| R-12 état, type d'offre, propriétaires | `listing.mjs` | `offerType = O` réservé aux 30 ans et plus |
| R-13 … R-16 carburant : flux → stock → segment, part PHEV | `listing.mjs:buildContext` (369 lois `(segment, année)`) | code agrégé `X` ventilé par `X_SPLIT` (hypothèse **HG-02**) |
| R-17 … R-20 prix juste, dépréciation, facteur km, primes | `listing.mjs` | dispersion par modèle : hachage stable ; surcote publicitaire appliquée après l'attribution du palier |
| R-21 arrondi commercial | `listing.mjs:commercialRound` | + part de prix laissés à l'euro (voir **EG-07**) |
| R-22 statut de prix | `anomalies.mjs` (`A-23`, `A-24`, `A-20`), `serialize.mjs:toAs24` | porté par la **forme** de `prices.public` |
| R-23 TVA | `serialize.mjs:derivePriceFields` | `netPrice`/`vatRate` si et seulement si `isTaxDeductible = true` |
| R-24 évaluation de prix (M3) | `serialize.mjs:derivePriceFields` | seuils sur `ln(prix affiché / prix juste **hors résidu**)` (voir **EG-08**) |
| R-25 `superDeal` | `serialize.mjs:derivePriceFields` | taux ramené sur l'agrégat visé (voir **EG-08**) |
| R-26 type de vendeur | `listing.mjs` | logistique en âge, cote multipliée par segment |
| R-27 `dealerBucket` | `dealers.mjs` | Zipf(0,85) bornée [3, 400], clé = 32 bits de `SHA-256(sel_profil ‖ index)` |
| R-28 palier publicitaire | `dealers.mjs` | propension croissante avec le décile de stock, renormalisée sur 26 % des professionnels |
| R-29 images, vidéo, labels, garantie | `listing.mjs` | Poisson tronquée, borne 50 |
| R-30 / R-31 déterminisme, identifiants | `prng.mjs`, `serialize.mjs:makeListingId` | identifiant = 4 mots 32 bits **bijectifs** de `(graine, rang)` : aucune collision possible |
| R-32 ordre du fichier et des clés | `serialize.mjs:sortRows`, `toAs24` | ordre des clés = ordre des `properties` du schéma |
| R-33 budget de taille | `serialize.mjs`, `listing.mjs` | leviers appliqués et mesurés au §5.2 |
| R-34 … R-37 géographie au préfixe | `listing.mjs`, `A-19`, `A-21` | aucun code postal à quatre chiffres n'est jamais formé, même en mémoire |
| R-36 langue de `modelVersion` | `listing.mjs:buildVersion` | croisement fr/nl 4 % chez les professionnels, `de` sur le préfixe 47 |
| R-38 … R-42 branche de mesure, consommation, CO₂, classes, Euro | `listing.mjs`, `serialize.mjs:toAs24` | WLTP **XOR** NEDC ; `…WithFallback` = valeur retenue |
| R-38ter décimales | `serialize.mjs` (`round1`, `roundCo2`) | arrondi **avant** sérialisation |
| R-43 … R-46 valeurs manquantes | `serialize.mjs:calibrateMissingness`, `applyMissingness` | facteur latent `Beta(6,2)` = 6ᵉ statistique d'ordre de 7 uniformes (exact) |
| R-47 … R-49 équipements | `listing.mjs` (logit, 132 codes) | décalage de logit calibré (voir **EG-06**) |
| R-50 … R-56 dynamique inter-snapshots | `snapshot.mjs:generateProfile` | sorties `1 − exp(−7/d)`, entrées = sorties **marque par marque** |
| R-55bis dates | `serialize.mjs:assignDates` | ordre `firstReg ≤ createdAt ≤ firstActivated ≤ lastUpdated ≤ capturedAt` |
| R-57 / R-58 anomalies | `anomalies.mjs` | injection après la valeur plausible, exclusion mutuelle des anomalies de prix |
| R-59 densité de cellules | conséquence de R-02/R-03 | mesurée : 268 cellules année, 159 cellules modèle au profil test |
| R-60 garde R3 | `validate.mjs` | 100 clés distinctes, 0 interdite |
| R-61 couverture des filtres | `filters.mjs` | 15 filtres non alimentés sur 53, nommés au manifest |

---

## 4. Anomalies : mécanisme et vérité terrain

Chaque entrée du manifest porte `listingId`, `anomaly` (code de l'énumération du schéma), un `detail`
quand la nature l'exige, `expected` (valeur **plausible** conservée et valeur **injectée**) et
`peerListingId` pour les trois anomalies de paire. Effectifs **mesurés au profil test**, snapshot S0 —
identiques aux deux autres snapshots par construction (§2.1).

| Id | Code manifest | Visé | Réalisé | Mécanisme et vérité terrain publiée |
|---|---|---:|---:|---|
| A-01 | `PRICE_SENTINEL_ABSOLUTE` | 20 | 20 | prix remplacé par une valeur de `{1, 11, 99, 111, 123, 150, 199, 249}` ; `expected = { flag, injected, fair }` |
| A-02 | `PRICE_OUT_OF_RANGE` | 4 | 4 | prix porté à 5 123 456 ou 9 999 999 ; `{ injected, fair }` |
| A-03 | `SUSPECT_ZERO_MILEAGE` | 50 | 50 | `mileage = 0` sur `offerType ∈ {U, J, O}` ; `{ fair, offerType }` |
| A-04 | `MILEAGE_IMPLAUSIBLE_FOR_AGE` | 60 | 60 | forme (a) rythme 260 000–360 000 km/an (voir **EG-09**), forme (b) 200–900 km sur 6 ans et plus ; `{ fair, injected, form, ageMonths }` |
| A-04b | `MILEAGE_OUT_OF_RANGE` | 6 | 6 | `mileage` porté au-delà de 2 000 000 km, multiple de 100 |
| A-05 | `FIRST_REG_OUT_OF_RANGE` | 16 | 16 | `2028-04` ou `1899-12`, variante choisie pour rester du bon côté du seuil WLTP (voir **EG-10**) |
| A-07 | `DUPLICATE_LISTING_ID` | 20 | 20 | la **même ligne** est écrite deux fois ; `peerListingId` = le même identifiant, `{ occurrences: 2 }` |
| A-07b | `DUPLICATE_VALUE_CONFLICT` | 50 | 50 | republication par le **même** `dealerBucket`, prix à ± 1–4 % ; `{ dealerBucket, price, peerPrice }` |
| A-08 | `CROSS_SELLER_DUPLICATE` | 160 | 160 | même véhicule, `dealerBucket` **différents** (garanti par construction), prix ± 2–9 %, km + 0–400, version reformulée |
| A-09 | `VERSION_FULLY_STRIPPED` | 80 | 80 | `modelVersion` réduite à du bruit typographique ; `{ fair, injected }` |
| A-09b | `VERSION_AMBIGUOUS` | 220 | 220 | (a) nom de modèle d'une autre marque, (b) puissance contredite de plus de 30 % |
| A-10 | `OUTLIER_M1_LOW` / `_HIGH` | 50 | 32 + 18 | haut 500 k–3 M€, bas 260–480 € (**jamais** sous 250 €) ; `{ method, injected, fair, factor }` |
| A-11 | `OUTLIER_M2_LOW` / `_HIGH` | 70 | 38 + 32 | facteur 0,30–0,50 ou 2,0–3,2, sur des cellules `(make, model)` à `n ≥ 30` ; `{ …, cell }` |
| A-12 | `OTHER` | 400 | 400 | facteur latent forcé sous 0,25 **et** complément jusqu'à 6 champs optionnels absents ; `detail` obligatoire |
| A-13 | `POWER_OUT_OF_RANGE` | 10 | 10 | `power = 1` ou `9999` ; `powerHp` recalculé pour rester cohérent |
| A-13b | `POWER_UNIT_MISMATCH` | 12 | 12 | `powerHp` écarté de 6 à 25 % ; `{ power, powerHp, exact, deviationPct }` |
| A-14 | `CO2_ZERO_NON_BEV` | 24 | 24 | CO₂ nul sur un thermique ; en branche WLTP le zéro passe par `co2EmissionInGramPerKmWithFallback` (minimum 1 du schéma) |
| A-15 | `HYBRID_INCONSISTENT` | 16 | 16 | `isPluginHybrid = true` avec `fuelCategory ∈ {B, D}` — **aucune** correction silencieuse |
| A-16 | `HYBRID_CATEGORY_UNRESOLVED` | 20 | 20 | `fuelCategory` absente ; branche `EX-DATA-10` (repli par `primaryFuelType`) ou `EX-DATA-11` (les deux absents) |
| A-17 | `UNIT_UNSUPPORTED` | 90 | 90 | `mileageUnit = mi`, valeur inchangée |
| A-19 | `REGION_UNRESOLVED` | 10 | 10 | `countryCode ∈ {LU, FR, NL}` ; `detail = pays hors marche` |
| A-20 | `PRICE_ON_REQUEST_WITH_AMOUNT` | 8 | 8 | `onRequestOnly = true` **et** `price` présent |
| A-21 | `REGION_UNRESOLVED` | 80 | 80 | préfixe `00`–`09` ; `detail = prefixe postal non resolu` |
| A-22 | `MODEL_UNRESOLVED` | 240 | 240 | `model` **et** `modelName` absents ; `makeName` et `modelVersion` restent servis |
| A-23 | `PRICE_ON_REQUEST` | 600 | 600 | `onRequestOnly = true`, `price` absent |
| A-24 | `PRICE_MISSING_UNDECLARED` | 120 | 120 | `price` absent **sans** `onRequestOnly` |

**26 anomalies actives sur 26**, 27 codes distincts émis (`A-10` et `A-11` se dédoublent en `_LOW` /
`_HIGH`, `A-19` et `A-21` partagent `REGION_UNRESOLVED`). Les deux codes **inatteignables**
(`FIRST_REG_UNPARSEABLE`, `MARKETPLACE_UNMAPPED`) ne figurent nulle part (`P-101`). `A-06` et `A-18`
sont retirées par E-07 et ne sont pas implémentées.

**Exclusion mutuelle (R-58)** : les sept anomalies de prix sont sélectionnées dans un ordre fixe, en
retirant du vivier ce qui est déjà pris ; les anomalies non tarifaires qui touchent le **même champ**
(kilométrage, puissance, version, carburant, région) sont exclusives entre elles par une table de
familles. Mesure : 0 annonce à deux anomalies de prix (`P-74`).

---

## 5. Mesures

### 5.1 Hachages et volumes des fixtures commitées

Graine `1264141121` (`0x4B594341`), générateur `kycar-dataset-gen 1.0.0`, `schemaVersion 1.0.0`,
validateur `ajv 8.20.0`, spécification `DATASET-SPEC.md` sha256 `1fe1a07fa7577538…`, hachage combiné
des 15 tables et des 2 schémas `adb5a528a096d31d…`.

| Profil | Snapshot | Lignes | `sha256` (octets non compressés) | gz | brut |
|---|---|---:|---|---:|---:|
| dev | `be-20260907T060000Z` | 5 000 | `d39cda8a1058fcc874e9234abfd8ed67ee8dcc4e59f08014e7be1dc9c28f5e6f` | 688 425 | 7 432 599 |
| dev | `be-20260914T060000Z` | 5 000 | `62ec40bab848625c274a72ae40d320880961a969c4cfec7086df27a9faa5731f` | 695 106 | 7 430 788 |
| dev | `be-20260921T060000Z` | 5 000 | `4d0dc9598b7af0ee54c55a74e61b4e9f291382680b5b79b30e59e0210fae8644` | 697 968 | 7 437 390 |
| test | `be-20260907T060000Z` | 20 000 | `a32412b671ec393b2d9afd145f61fd18f6f43adfd6cc187733f5378741ccfa9e` | 2 700 910 | 29 689 712 |
| test | `be-20260914T060000Z` | 20 000 | `81f2d33523d5df8aaa68197de54d3ededa1dfe0048b55d0fc1e67702be892c98` | 2 725 327 | 29 696 814 |
| test | `be-20260921T060000Z` | 20 000 | `d523412bcee34eb5d3417acee09e174435d201ac57910e3eed67163bfd337ea8` | 2 741 424 | 29 710 613 |

| Profil | Total gz | Budget | Marge | Octets/ligne gz | Budget/ligne |
|---|---:|---:|---:|---:|---:|
| dev | **2 081 499** (1,985 Mio) | 2 097 152 | 0,7 % | 138,8 | 139,8 |
| test | **8 167 661** (7,789 Mio) | 8 388 608 | **2,6 %** | 136,1 | 139,8 |
| perf | 39 951 498 (38,10 Mio) | 41 943 040 | 4,7 % | 133,2 | — |

Poids ajouté au dépôt : `data/fixtures/dev` 2,4 Mio, `data/fixtures/test` 9,3 Mio (dont 1,5 Mio de
manifests, qui n'entrent pas dans le budget gz de la spécification). `perf` n'est pas commité.

**Delta inter-snapshots (profil test)** : S0→S1 2 094 sorties / 2 094 entrées / 3 055 révisions ;
S1→S2 2 020 / 2 020 / 3 052. Taux de sortie 10,5 % puis 10,1 % (`P-65` ∈ [8 %, 12 %]).

### 5.2 Budget de taille : leviers appliqués

Le modèle produit 1 430 octets bruts par ligne. Sans intervention le profil test pesait **8,86 Mio**
gz, soit 5,6 % au-dessus du budget. Leviers appliqués, **dans l'ordre du §8.3** de DATASET-SPEC, avec
le gain mesuré sur les trois snapshots :

| # | Levier | Gain | Ce qui n'est pas perdu |
|---:|---|---:|---|
| 1 | verbosité de `modelVersion` : jetons de boîte et de portes retirés, libellés de finition ramenés à 8 caractères | 320 Kio | `transmission` et `doorCount` sont servis **en clair** par ailleurs |
| 2 | `maxCodes` d'équipement ramené de 34 à **18** | 105 Kio | la médiane visée par `missingness.json` est 16 (PRO) / 8 (PRIVÉ) : le plafond ne mord que sur la queue |
| — | recalage du logit d'équipement sur la médiane annoncée (voir **EG-06**) | 340 Kio | la **loi** reste celle d'`equipment.json`, seule sa position bouge |
| — | CO₂ écrit en **entier** de g/km | 93 Kio | la contrainte 24 autorise « au plus une décimale » ; `P-60` tolère ± 6 g/km |
| — | horodatages au **quart d'heure** | 181 Kio | `P-86` ne teste qu'un **ordre**, `P-88` un **mois** |
| — | `gzip` `memLevel 9`, stratégie `Z_FILTERED` | 45 Kio | aucun effet sur le contenu |
| 3 | sortir `dev` du dépôt | **non appliqué** | PLAN-3 §3.2 exige `dev` commité |

### 5.3 Temps

| Profil | Génération | Total (génération + validation ajv de toutes les lignes + gzip + écriture) |
|---|---:|---:|
| dev | 1,6 s | 2,5 s |
| test | 5,1 s | 7,0 s |
| perf | **32,5 s** | **42,5 s** |

`perf` : 300 000 lignes générées **et intégralement validées** contre le schéma, en 42,5 s — sous le
seuil de 60 s du critère S5, validation comprise.

### 5.4 Autocontrôle `npm run data:check`

**70 sondes rejouées.** Profil `test` : **0 écart**, 3 dettes consignées au §6 (`P-10` et `P-11` → **EG-01**, `P-57` → **EG-11**). Profil `dev` : 3 écarts supplémentaires, tous imputables au **bruit d'échantillonnage** du
volume réduit (voir **EG-11**).

Relevé du profil `test`, snapshot S0 :

| Sonde | Mesure | Tolérance |
|---|---|---|
| P-01 volume | 20 000 / 20 000 / 20 000 | exact |
| P-03 régénération à graine égale | `sha256` et `sha256Gz` identiques | exact |
| P-05 taille gz | 7,805 Mio | ≤ 8 Mio |
| P-06 ordre du fichier | croissant | exact |
| P-07 marques distinctes | 262 | ≥ 150 |
| P-08 apportionnement | écart max 0 | ± 1 |
| P-12 fenêtres de production | 0 violation | 0 |
| P-13 médiane d'âge | 7 ans | [6, 9] |
| P-16 mix carburant | 54,5 / 27,2 / 13,2 / 4,4 % | [52-59] / [23-29] / [11-16] / [3,5-5,8] |
| P-17 diesel 2015 | 44,0 % | [40 %, 50 %] |
| P-19 électrique 2024 | 22,6 % | [19 %, 27 %] |
| P-23 SUV parmi ≥ 2022 | 38,2 % | [38 %, 52 %] |
| P-24 coupé | 2,40 % | [2,0 %, 3,5 %] |
| P-25 boîte auto 2010 / 2024 | 0,167 / 0,696 | ≤ 0,30 / ≥ 0,60 |
| P-26 électrique à boîte manuelle | 0 | 0 |
| P-27 noir+gris+blanc+argent | 72,1 % | [68 %, 78 %] |
| P-28 médiane km à 5 ans | 74 800 | [66 000, 84 000] |
| P-30 multiples de 100 | 0 écart | 100 % |
| P-31 médiane des prix | 16 158 € | [13 500, 18 500] |
| P-33 corr(ln prix, âge) | −0,708 | < −0,65 |
| P-39 terminaisons commerciales | 79,3 % | [70 %, 88 %] |
| P-40 `ON_REQUEST` | 3,04 % | [2 %, 5 %] |
| P-42 TVA chez un particulier | 0 | 0 |
| P-44 `netPrice` | 0 écart | exact |
| P-46 vendeurs professionnels | 68,7 % | [67 %, 73 %] |
| P-47 `dealerBucket` ⟺ type D | 0 écart | exact |
| P-50 palier publicitaire | 18,0 % | [14 %, 24 %] et < 30 % |
| P-51 Flandre / Wallonie / Bruxelles | 54,8 / 37,2 / 8,0 % | ± 2 points |
| P-52 préfixes hors table | 0 non déclaré (78 déclarés `00`–`09`) | exact |
| P-55 écart relatif max aux taux d'absence | 15,0 % (`power` 2,9 % contre 2,5 %) | ≤ 25 % |
| P-56 écart-type des taux d'absence | 0,23 | > 0,15 |
| P-58 absence d'équipement PRIVÉ / PRO | 2,19 | ≥ 1,8 |
| P-59 absences structurelles | 0 écart | 0 |
| P-61 / P-96 branches de mesure | 0 écart | 0 |
| P-62 sans branche de mesure | 14,4 % | [10 %, 20 %] |
| P-65 taux de sortie | 10,5 % / 10,1 % | [8 %, 12 %] |
| P-66 effectif par marque | identique | exact |
| P-70 survivantes non révisées | 0 écart | exact |
| P-71 kilométrage inchangé | 0 changement | exact |
| P-72 effectifs par anomalie | 26/26 exacts | ± 20 % |
| P-73 vérité terrain | 0 orpheline | 100 % |
| P-74 exclusion mutuelle des prix | 0 | 0 |
| P-78 / P-79 densité de cellules | 268 / 159 | ≥ 150 / ≥ 90 |
| P-83 `superDeal` | 3,91 % | [2,5 %, 5,5 %] |
| P-84 accidentées | 3,70 % | [2 %, 5 %] |
| P-85 `offerType = O` | 0 écart | 100 % ≥ 30 ans |
| P-92 couverture de prix | 96,4 % | ≥ 80 % |
| P-99 classes exclusives | 0 écart | 0 |
| P-100 plausibilité km/an | 0 écart | 100 % |
| P-101 codes inatteignables | 0 | 0 |
| P-102 décimales | 0 ligne | 100 % |
| P-103 ordre des clés | stable | 100 % |
| P-104 unicité des identifiants | 0 non déclaré | exact |
| P-105 deeplink | 100 % | 100 % |
| P-107 texte libre sans contact | 0 occurrence | 0 |
| P-108 absence de `paintType` | 82,7 % | ≥ 75 % |
| P-110 couverture curatée | 68,3 % | ≥ 65 % |

**Filtres non alimentés (`P-82`, R-61)** — 15 sur 53 filtres retenus de classe énumérée ou bornée,
publiés au manifest et détaillés dans `generation.json` :

- **sans champ correspondant au dictionnaire KYCAR** (déjà annoncés au §11 de DATASET-SPEC) :
  `financeratefrom`, `financerateto`, `leasingratefrom`, `leasingrateto`, `lsdufrom`, `lsduto`,
  `lsyeinmifrom`, `lstagr`, `ensticker`, `zipr`, `ocs_listing`, `sort`, `desc` ;
- **une seule valeur représentée** : `atype` (`vehicleType = C` partout) et `powertype`
  (`powerUnit = kW` partout).

---

## 6. Écarts à la spécification

Chaque écart porte l'identifiant de la règle ou de la sonde concernée. Aucun n'est silencieux :
`data:check` affiche `EG-01` et `EG-10` en `DETTE`, les autres sont des choix d'implémentation dont
la mesure est publiée ci-dessus.

### EG-01 — `R-03` / `R-05` sont **incompatibles** : arbitrage en faveur de la loi de segment (`P-10`, `P-11`, `P-23`, `P-24`)

`models.json` fixe la part d'un modèle **dans sa marque** ; `segments.json` fixe la part d'un segment
**par année**, corrigée du biais de stock. Les deux lois portent sur la même marge et **ne sont pas
compatibles** : la table curatée implique 26,9 % de citadines et 19,9 % de SUV, quand la loi de stock
en veut 17,5 % et 27,1 %. La citadine ne peut pas être ramenée par la seule queue non curatée (il y
faudrait une part **négative**).

Balayage mesuré du paramètre d'inclinaison `θ` appliqué à la correction de segment (`θ = 0` : parts
de modèle intactes ; `θ = 1` : loi de segment atteinte) :

| θ | SUV ≥ 2022 (P-23 ∈ [0,38 ; 0,52]) | coupé (P-24 ∈ [0,020 ; 0,035]) | golf (≥ 650) | polo (≥ 480) | corsa (≥ 440) | Série 1 (≥ 280) |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0,264 ✗ | 0,0151 ✗ | 762 | 560 | 553 | 359 |
| 0,25 | 0,293 ✗ | 0,0170 ✗ | 736 | 508 | 511 | 328 |
| 0,5 | 0,323 ✗ | 0,0193 ✗ | 702 | 456 ✗ | 468 | 299 |
| 0,75 | 0,354 ✗ | 0,0219 ✓ | 660 | 403 ✗ | 425 ✗ | 270 ✗ |
| **1** | **0,384 ✓** | **0,0249 ✓** | 611 ✗ | 351 ✗ | 383 ✗ | 242 ✗ |

**Aucune** valeur de `θ` ne satisfait les deux familles de sondes. Le générateur retient **θ = 1** :
c'est la reconciliation d'**entropie maximale** (elle respecte exactement les marges de marque de
`R-02` **et** la loi `P(segment | année)` de `R-05`/`R-06`, en restant au plus près des parts de
modèle) ; les valeurs de `P-10`, `P-11` et du §1.4 de DATASET-SPEC ont été calculées **sans** la
contrainte de segment (`0,11 × 0,34 × 20 000 = 748` est exactement la part de marque × part dans la
marque). `P-24` est en outre le matériau du parcours cible P1 (≈ 500 coupés annoncés au §1.4 :
mesuré **480**), et `P-23` porte le fait de marché le plus structurant du jeu.

**Mesuré au profil test** : golf 590, polo 383, corsa 357, BMW 320 **204 ✓**, famille Série 3
**416 ✓**, famille Série 1 261, couverture curatée **68,3 % ✓**. **Décision due au coordinateur avant
G9a** : soit ratifier θ = 1 et faire abaisser les seuils de `P-10`/`P-11` par `dataset-design`, soit
retenir θ = 0,25 et faire élargir `P-23`/`P-24`.

### EG-02 — format de `snapshotId` : le **schéma du manifest** prime sur `profiles.json`

`profiles.json` annonce `be-fixture-<profil>-<AAAAMMJJ>-<graine hex>` (25 à 30 caractères), que
`snapshot-manifest.schema.json` **rejette** (`maxLength 32`, motif `^[a-z]{2}-[0-9]{8}T[0-9]{6}Z$`).
Le critère S2 impose la conformité au schéma : `snapshotId = be-20260907T060000Z`. La forme de
`profiles.json` est conservée sous `designSnapshotId` dans `generation.json` et rappelée dans
`manifest.note`. Le nom du **répertoire** reprend `snapshotId`, le profil étant déjà porté par le
répertoire parent.

### EG-03 — segment d'un modèle **non curaté** : tiré par annonce, pas par hachage de modèle

`R-04` prescrit un segment « tiré par hachage stable dans la loi `P(segment | année)` ». L'année
n'est connue **qu'après** le choix du modèle, et un hachage par `modelId` figerait le segment
indépendamment de l'année, ce qui vide la loi de son sens. Le générateur tire le segment d'un modèle
de queue **par annonce**, dans la loi de stock de son année ; la **fenêtre de production** reste,
elle, dérivée du hachage stable du `modelId` comme prescrit. Le segment n'est **écrit nulle part**
(E-02), la variation est donc invisible dans le fichier.

### EG-04 — le manifest est **fermé** : les paramètres de génération vont dans `generation.json`

`snapshot-manifest.schema.json` porte `additionalProperties: false` ; la version de la spécification,
le hachage des quinze tables, les filtres non alimentés (`P-82`) et les calibrages n'y ont **aucun
champ**. Ils sont résumés dans `note` (2 000 caractères) et détaillés dans `generation.json`, déposé
dans le même répertoire. `P-82` exige que les filtres non alimentés soient « publiés par le
manifest » : ils le sont, par le champ `note` (liste des paramètres) et par le fichier latéral (avec
le motif de chaque non-alimentation).

### EG-05 — `R-10` : année indisponible dans la marque

L'âge est tiré dans la loi marginale, **puis** conditionné à la fenêtre de production. Quand aucune
marque n'a de modèle disponible à l'année tirée (marque récente, année très ancienne), le générateur
retient l'année **disponible la plus proche** plutôt que de renormaliser la loi d'âge dans la marque :
la loi d'âge globale est ainsi mieux préservée. Mesure : médiane 7 ans (`P-13` ∈ [6, 9]), 3,60 % de
20 ans et plus (`P-14` ∈ [2,5 %, 5,5 %]), 0,61 % de 30 ans et plus (`P-15` ∈ [0,2 %, 1,2 %]),
**0 violation** de fenêtre (`P-12`).

### EG-06 — `equipment.json` et `missingness.json` se contredisent sur le nombre d'équipements

Le modèle logit d'`equipment.json` produit une médiane de **27** codes chez un professionnel et
**17** chez un particulier ; `missingness.json:equipmentCountByseller` annonce **16** et **8**. Le
générateur conserve la **loi** (logit en année × segment × vendeur) et lui applique un décalage de
logit par type de vendeur, calibré une fois, sans aléa, pour que le nombre moyen atteigne la valeur
annoncée. Mesure après calibrage et plafond à 18 : médiane **16** (PRO) / **7** (PRIVÉ). C'est aussi
le premier poste de taille du fichier (§5.2).

### EG-07 — `R-21` et `P-39` se contredisent sur la part de prix arrondis

La table de terminaisons de `price-model.json` somme à 1 : **tout** prix reçoit une terminaison
commerciale (mesuré 98,9 %), quand `R-21` annonce 78 % et `P-39` attend [70 %, 88 %]. Le générateur
laisse **20 %** des prix affichés **à l'euro**, comme le fait une partie du marché. Mesure : 79,3 %.

### EG-08 — `R-24` : le « prix juste » de l'évaluation est celui **hors résidu de cellule** ; `R-25` : l'agrégat prime

(a) `R-24` pose `d = ln(prix affiché / prix juste)/σ_p`. Si le « prix juste » inclut le résidu
`exp(N(0, σ_p))` du prix, alors `d ≈ 0` pour toute annonce, la catégorie vaut 3 partout et le κ
d'`EX-DATA-96` retombe à **zéro** — exactement le défaut **C-1** que `R-24` corrige. Le générateur
prend donc le prix **prédit par le modèle pour la cellule, résidu exclu**. Distribution obtenue au
profil test : catégorie 1 **15,8 %**, 2 **24,2 %**, 3 **36,1 %**, champ absent **24,0 %**.

(b) `isSuperDeal.rateAmongEligible = 0,28` et `aggregatedRate = 0,041` ne peuvent pas être vrais
ensemble : la part d'annonces en catégorie 1 ou 2 vaut `Φ(−0,2) = 42 %`, donc 0,28 donnerait **8 %**
de `superDeal` là où `P-83` attend [2,5 %, 5,5 %]. Le générateur retient l'**agrégat**, qui est la
valeur que la sonde mesure : taux parmi les éligibles ramené à 0,139. Mesure : **3,91 %**.

### EG-09 — `A-04` forme (a) : 65 000–95 000 km/an ne franchit **pas** la borne de la contrainte 22

`anomalies.json` prescrit « `mileage` porté à `age × 65 000` à `95 000` km, ce qui fait franchir la
borne ». La borne de la contrainte 22 est `mileage × 12 / max(age_mois, 6) ≤ 200 000`, c'est-à-dire
**200 000 km par an** : un rythme de 65 000 à 95 000 km/an ne la franchit jamais, et la détection
annoncée (« 100 % des formes (a) dépassent la borne ») serait **impossible**. Le générateur porte le
rythme à **260 000–360 000 km/an**, borné à 1 900 000 km pour rester sous le seuil de `A-04b`.
Mesure : 100 % des formes (a) au-dessus de la borne, `P-100` à 0 écart.

### EG-10 — `A-05` : une date hors bornes contamine trois autres sondes

Une date de première immatriculation hors bornes fausse mécaniquement l'âge, donc la branche de
mesure (`P-61`), le rythme kilométrique (`P-100`), la borne d'ancêtre (`P-85`) et la fenêtre de
production (`P-12`). Trois de ces quatre effets sont **évités par construction** : le vivier de
`A-05` exclut les annonces où aucune variante n'est licite, et la variante retenue reste du **même
côté du seuil WLTP** que la date plausible (`2028-04` pour une annonce de branche WLTP peu roulée et
non ancêtre, `1899-12` sinon). Le quatrième, `P-12`, n'a **aucune** solution : une date hors bornes
est hors de toute fenêtre de production par définition. **`data-review` doit exclure les lignes
déclarées `FIRST_REG_OUT_OF_RANGE` de `P-12`, exactement comme `P-87` le fait déjà** — c'est ce que
le corollaire du §6 de DATASET-SPEC autorise (« une violation délibérée est licite à la seule
condition d'être déclarée »). `data:check` applique cette exclusion et le dit dans son code.

### EG-11 — modèle de complétude : deux corrections nécessaires, une limite arithmétique

(a) `E[g(c) · h · k] = 0,563`, pas 1 : appliqué littéralement, `p_champ · g(c) · h(vendeur) · k(âge)`
donne un taux d'absence réalisé **44 % inférieur** au taux de référence, et `P-55` (± 25 % relatifs)
serait rouge sur **tous** les champs. Le générateur divise par cette espérance, mesurée une fois sur
le premier snapshot et **gelée** pour le profil (la geler est nécessaire à `P-70`).

(b) Le produit est écrêté à 0,98 (une probabilité ne dépasse pas 1), ce qui retire de la masse aux
champs à taux élevé : `paintType` (0,82) tombait à **65,5 %**, sous le plancher de `P-108`. Un
facteur par champ, résolu par dichotomie sur un sous-échantillon déterministe, rétablit l'espérance
exactement. Mesure après correction : `paintType` **82,7 %**, écart relatif maximal sur les 30 champs
suivis **15,0 %** (`P-55` ≤ 25 %).

(c) **Limite non corrigeable** : `P-57` attend `corr(1[version absente], 1[sellerie absente])`
∈ [0,10 ; 0,40] et `missingness.json` annonce [0,15 ; 0,35]. Pour deux indicatrices conditionnellement
indépendantes de multiplicateur commun `m`, la corrélation vaut
`p₁p₂·Var(m) / √(p₁(1−p₁)p₂(1−p₂))`. Avec `p₁ = 0,035` (`modelVersion`), `p₂ = 0,28`
(`upholsteryType`) et `Var(m) = 0,55` — la variance qu'**impose** `Beta(6, 2)` — le maximum
atteignable vaut **0,065** ; il faudrait `Var(m) ≥ 0,85` pour atteindre 0,10. Mesuré : **0,076**. La
sonde est donc inatteignable **avec les paramètres de la spécification elle-même** ; la corriger
demanderait soit une autre loi latente, soit un couple de champs à taux plus élevés. Consigné, non
contourné.

### EG-12 — profil `dev` : trois sondes dans le bruit d'échantillonnage

À 5 000 annonces, `P-23` (36,9 % contre un plancher à 38 % pour une valeur de conception à 38,1 % —
tout écart d'échantillonnage la fait basculer), `P-55` (`offerType` 1,3 % contre 1,0 %, soit 65
absences observées pour 50 attendues, 2 σ) et `P-58` (1,75 contre 1,8) sortent de leur tolérance. Ce
ne sont **pas** des défauts du générateur : les mêmes sondes sont vertes au profil `test`, qui est le
profil que l'application charge (D3-01). Les tolérances relatives de `P-55` sont structurellement
inatteignables au volume `dev` pour les champs dont le taux de référence est inférieur à 1 %.

### Hypothèses ajoutées par le générateur (E4)

Trois valeurs manquaient aux tables ; elles sont **assumées, chiffrées et localisées** :

| # | Hypothèse | Valeur | Où |
|---|---|---|---|
| HG-01 | Ventilation du code de carburant agrégé `X` de `fuel-year.json` en codes réels du vocabulaire | GPL 0,55 · CNG 0,20 · éthanol 0,10 · hydrogène 0,05 · autres 0,10 | `listing.mjs:X_SPLIT` |
| HG-02 | Loi de `upholsteryColor` (aucune table dans la spécification) | 11 codes, noir dominant à 0,45 | `listing.mjs:UPHOLSTERY_COLOR` |
| HG-03 | Cylindrée et nombre de cylindres (aucune formule dans la spécification) | `12,5 × kW` en essence, `14,5 × kW` en diesel, log-normale σ 0,16, bornes [700, 6 500] ccm ; cylindres par seuils de cylindrée | `listing.mjs` |
| HG-04 | `publication.accurateState` : ensemble fixe de 4 chaînes, jamais inventées ligne à ligne (exigé par `sellers.json`) | `active`, `activeMarketable`, `activeReserved`, `activeHighlighted` | publié dans `generation.json` |

### Constat hors périmètre — `npm run lint` n'était **pas** vert à la prise en main

`data/schema/validate.mjs` (livrable de la phase 3.1) porte **5 erreurs** `no-undef` sur `process` :
`eslint.config.js` ne donne les globals Node qu'à `tools/**/*.mjs`. Vérifié sur `HEAD` **avant** toute
modification de cette phase (`git stash` puis `npx eslint data/schema/validate.mjs`). `data/schema/`
et `eslint.config.js` sont **hors du périmètre d'écriture** de `dataset-gen` : le constat est
consigné, pas corrigé. Les treize fichiers de `tools/dataset/` sont **lint-propres**, et
`npx tsc --noEmit -p tsconfig.json` reste vert (le générateur n'est pas dans `src/`).

---

## 7. Critères de la phase 3.2 — preuve

| # | Critère | Preuve | Verdict |
|---|---|---|---|
| **S1** | déterminisme prouvé | `npm run data:check` sonde `P-03` : le profil est **régénéré en mémoire** à partir de la graine du manifest et les `sha256` (octets non compressés) **et** `sha256Gz` sont comparés à ceux des fichiers livrés — identiques sur les 3 snapshots des profils `dev` et `test`. Deux générations consécutives dans deux répertoires distincts donnent des fichiers `.gz` **octet à octet identiques** (vérifié par `sha256sum`). Deux graines différentes donnent **100 %** d'identifiants différents (`P-04`, seuil 99 %). Aucune source d'entropie dans le générateur : ni `Math.random`, ni `Date.now`, ni `crypto.randomBytes` ; `capturedAt` vient de `profiles.json` ; toutes les tables d'objets sont parcourues dans un ordre fixé par le fichier source ou par un tri explicite. | ✅ |
| **S2** | 100 % des lignes valides au schéma | `data:gen` valide **chaque ligne** avec `ajv 8.20.0` pendant la génération et sort en erreur au premier rejet ; `npm run data:validate` rejoue la validation sur le fichier livré : **20 000 / 20 000** lignes conformes sur chacun des 3 snapshots du profil test, **5 000 / 5 000** sur `dev`, **100 000 / 100 000** sur `perf`. Garde R3 : 100 clés distinctes, **0 interdite**. Aucun fichier de lignes non conformes n'est produit (E-07). | ✅ |
| **S3** | volumes et tailles | dev 3 × 5 000 et test 3 × 20 000 **commités**, perf 3 × 100 000 généré et **ignoré par git**. Total gz : test **8 167 661 octets ≤ 8 388 608** (marge 2,6 %), dev **2 081 499 ≤ 2 097 152**, perf **39 951 498 ≤ 41 943 040**. Mesure obligatoire faite à chaque génération et affichée (`TENU` / `DEPASSE de x %`). Leviers du §8.3 appliqués dans l'ordre, gains mesurés au §5.2. | ✅ |
| **S4** | manifest avec vérité terrain | manifest conforme au schéma (vérifié par `ajv` à l'écriture **et** par `data:validate`), portant graine, `schemaVersion`, `capturedAt`, `listingCount`, `sha256` des octets **non compressés** (contrainte 31), `sha256Gz`, `previousSnapshotId` chaîné, `delta`, et **2 436 entrées de vérité terrain** par snapshot au profil test (612 au profil dev) couvrant les **26 anomalies actives** et les **27 codes** correspondants, avec valeur plausible conservée et `peerListingId` sur les trois anomalies de paire. 0 entrée orpheline (`P-73`). Ni `FIRST_REG_UNPARSEABLE` ni `MARKETPLACE_UNMAPPED` (`P-101`). | ✅ |
| **S5** | génération perf < 60 s | **32,5 s** de génération pure, **42,5 s** en incluant la validation ajv des 300 000 lignes, la compression et l'écriture. | ✅ |
