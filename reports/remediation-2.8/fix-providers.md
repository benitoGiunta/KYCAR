# fix-providers — phase 2.8 (remédiation post-vérification), cluster `src/providers`

**Agent `fix-providers` (Opus, effort high), 2026-09-08. Worktree `/home/user/kycar-wt/providers`,
branche `fix28/providers`, partie de `1226aeb` (fin de l'étape 0 `fix-foundation` + amendements
D8-21..D8-23).**

Mandat : `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` — **D8-08** (colonne TVA), **D8-10**
(entités `MakeAggregate`/`MetricStats`), **D8-16** (FV-20 : drapeaux et replis d'ingestion),
**D8-20** (filtre Carrosserie en mode 2), plus **D8-19** (sondes modifiées) et **D8-22** (`R-D3-02`).
Entrées lues : `reports/remediation-2.8/fix-foundation.md` §2 et §5 (symboles exacts),
`reports/FINAL-VERIFICATION.md` §7 (FV-02, FV-20) et §2.1 (`EX-DATA-5`, `10`, `11`, `14`, `17`, `35`,
`43`, `61`, `64`, `68`, `71`), `docs/requirements/draft-data-dictionary.md` annexe A,
`reports/remediation/fix-providers.md` (état après 2.6).

Périmètre d'écriture tenu : `src/providers/synthetic/`, `src/providers/tweedehands/`,
`tests/review/D3/`, `tests/review/D9/`, `reports/remediation-2.8/fix-providers.md`.
`src/providers/DataProvider.ts` n'a **pas** été touché — `diff docs/plans/DataProvider.ts
src/providers/DataProvider.ts` reste vide. Aucune écriture dans `src/types/`, `src/engine/`,
`docs/`, `tests/e2e/`, ni dans un autre worktree. Aucune dépendance ajoutée. Aucun appel réseau.

---

## 1. Point → sonde rouge → correction → preuve verte → statut

**Discipline D-32 tenue** : les 25 sondes de ce lot ont été écrites et commitées **rouges d'abord**
(commit `eef1599`, 9 échecs sur 11 en D3, 13 sur 13 en D9), avant toute ligne de correction.

| # | Point | Sonde rouge (avant) | Correction (fichiers) | Preuve verte | Statut |
|---|---|---|---|---|---|
| 1 | **D8-08** — `vatDeductible` généré, synthétique (`EX-SCR-203`, annexe A # 10) | `R-D3-14` : « expected 0 to be greater than 0 » (colonne allouée à `0` partout par l'étape 0) | `synthetic/generate.ts` (passe de présentation : particulier ⇒ `NO`, professionnel ⇒ part déductible / non déductible / résidu INCONNU, par `encodeVatDeductible`) | `✓ R-D3-14` → `vatDeductible : inconnu = 53, non = 1189, oui = 758 (pros = 1258, dont déductible = 758)` ; à 100 k : `inconnu = 2 554, non = 61 357, oui = 36 089` | **FAIT** |
| 2 | **D8-08** — `vatDeductible` déterministe | `R-D3-14b` | idem (tirage par hachage pur de la graine et de l'indice) | `✓ R-D3-14b` : deux jeux à graine identique sont égaux colonne à colonne, un jeu à graine + 1 en diffère | **FAIT** |
| 3 | **D8-08** — mapping BTW/TVA, provider réel | `R-D9-22` / `R-D9-22b` : `vatDeductible` n'existait pas sur `NormalizedListing` | `tweedehands/vocabularyMap.ts` (`readVatDeductibleAttribute`, `mapVatDeductible`, chemin de lecture documenté), `tweedehands/normalize.ts`, `tweedehands/testFixtures.ts` | `✓ R-D9-22` (`Ja`/`Nee`/`Oui`/`Non`), `✓ R-D9-22b` (absent ⇒ `null` + `unknownFields`, valeur non traduisible ⇒ `ENUM_UNKNOWN`) | **FAIT** |
| 4 | **D8-10 / FV-02** — `MakeAggregate.modelCount` synthétique | `R-D3-15` : `expected null to be 6` | `synthetic/aggregate.ts` (`distinctModelCountByMake`, dense) | `✓ R-D3-15` (comparaison ligne à ligne à une vérité terrain recalculée sur les colonnes, 96 marques), `✓ R-D3-15b` (suit la sélection : une sélection à un modèle rend `1`) ; à 100 k : `74:9340/120 · 13:8243/114 · 47:7961/355` | **FAIT** |
| 5 | **D8-10** — `modelCount` provider réel | `R-D9-23` : `expected null to be 2` | `tweedehands/aggregate.ts` (`distinctModelCount`, `null` sur échantillon vide) | `✓ R-D9-23` | **FAIT** (plancher d'échantillon assumé, §4.2) |
| 6 | **D8-10 / EX-DATA-17** — `coverageWarning` | `R-D9-24` : `expected undefined to be defined` | `tweedehands/aggregate.ts` (`coverageWarningOf`) | `✓ R-D9-24` (`price` vrai à 2 prix fermes sur 4, `year` vrai à `n = 0`, `mileage` faux à 4/4), `✓ R-D9-25b` (échantillon sain ⇒ `price` faux) | **FAIT** |
| 7 | **D8-10 / EX-DATA-43** — `adTierDistribution`, `samplingBias` | `R-D9-25` : `expected undefined to be defined` | `tweedehands/vocabularyMap.ts` (`mapAdTier`, `isAdTierRecognised`), `normalize.ts` (`adTier`), `aggregate.ts` (`adTierDistributionOf`, `samplingBiasOf`) | `✓ R-D9-25` : `adTierDistribution = {"NONE":1,"T20":0,"T30":1,"T40":0,"T50":2}`, somme = effectif, `samplingBias = true` à 75 % de promus ; `✓ R-D9-25b` (0 % ⇒ faux) | **FAIT** |
| 8 | **D8-10** — synthétique : les trois champs ABSENTS, justifiés | `R-D3-15c` (verte dès l'écriture : contrôle de non-régression) | `synthetic/SyntheticDataProvider.ts` (`SYNTHETIC_COVERAGE_NOTE` porte la justification) | `✓ R-D3-15c` : `coverageWarning`, `samplingBias`, `adTierDistribution` restent `undefined` sur toutes les lignes | **FAIT** (justification §4.1) |
| 9 | **D8-16 / EX-DATA-5** — `UNIT_UNSUPPORTED`, synthétique | `R-D3-16` : `expected 0 to be greater than 0` | `synthetic/generate.ts` (passe d'ingestion : une part des kilométrages INCONNUS l'est pour unité non convertible) | `✓ R-D3-16` : 3 annonces sur 2 000 (0,15 %), toutes à kilométrage INCONNU, compte égal à `ingestFlagCounts.UNIT_UNSUPPORTED` ; 303 à 100 k | **FAIT** |
| 10 | **D8-16 / EX-DATA-5** — `UNIT_UNSUPPORTED`, provider réel | `R-D9-26` : le drapeau n'était jamais posé | `tweedehands/vocabularyMap.ts` (`CANONICAL_UNITS`, `isCanonicalUnit`), `normalize.ts` (garde `unitAccepted` sur kilométrage, puissance, CO₂) | `✓ R-D9-26` : `mileageUnit = mi` ⇒ `UNIT_UNSUPPORTED` + `mileageKm = null` ; `powerUnit = hp` idem ; `mileageUnit = km` ⇒ valeur lue, aucun drapeau | **FAIT** |
| 11 | **D8-16 / EX-DATA-10** — repli carburant création → recherche | `R-D9-27` (réel), `R-D3-17` (synthétique) : `grep fuelTypePrimary src/providers` = 0 | `tweedehands/vocabularyMap.ts` (`FUEL_TYPE_TO_CATEGORY`, 16 lignes, copie fidèle de la table normative), `normalize.ts` (repli UNIQUEMENT si catégorie absente ET `fuelTypePrimary` présent) ; `synthetic/generate.ts` (part exerçant le repli) | `✓ R-D9-27` (`7` ⇒ `D`, `12` ⇒ `E`, la catégorie servie prime, `fuelCategorySource` distingue les deux) ; `✓ R-D3-17` : `FUEL_CATEGORY_FROM_FUEL_TYPE` = 13 / 2 000, 430 / 100 000 | **FAIT** |
| 12 | **D8-16 / EX-DATA-11** — `HYBRID_CATEGORY_UNRESOLVED` | `R-D9-28`, `R-D3-17` : `grep HYBRID_CATEGORY_UNRESOLVED src` = 0 | `tweedehands/normalize.ts` (hybride rechargeable sans catégorie ⇒ INCONNU + rapport) ; `synthetic/generate.ts` (part à `fuelCategory = ENUM_UNKNOWN_BYTE`) | `✓ R-D9-28` (`fuelCategory` nulle, jamais `B` ni `D`) ; `✓ R-D3-17` : `HYBRID_CATEGORY_UNRESOLVED` = 6 / 2 000, 225 / 100 000, et `ENUM_UNKNOWN` ≥ ce compte | **FAIT** |
| 13 | **D8-16 / EX-DATA-14** — annonce sans `listingUrl` REJETÉE et comptée | `R-D9-29`, `R-D3-18` : `normalize.ts` l.389 conservait l'annonce (FV-20) | `tweedehands/TweedehandsDataProvider.ts` (`reject('LISTING_URL_MISSING')`) ; `synthetic/generate.ts` (`countRejectedSourceCandidates`) + `SyntheticDataProvider.ts` (`rejectedCount`/`rejectedByReason` MESURÉS) | `✓ R-D9-29` : `rejets = {"LISTING_URL_MISSING":1}`, `listingCount = 1` sur 2 servies ; `✓ R-D3-18` : `{"LISTING_URL_MISSING":2}` à 2 000, `152` à 100 000, et **zéro** ligne du lot à URL vide | **FAIT** |
| 14 | **D8-16 / EX-DATA-35** — `co2Source` | `R-D9-30`, `R-D3-19` : `grep co2Source src/providers` = 0 | `tweedehands/normalize.ts` (`co2Source` déduit du CHAMP retenu : `co2emissionWLTP` ⇒ WLTP, `co2emissionNEDC` ⇒ NEDC, champ à repli ⇒ UNKNOWN) ; `SyntheticDataProvider.ts` (INCONNU sur 100 % du lot + justification) | `✓ R-D9-30` (les trois cas + le champ absent) ; `✓ R-D3-19` : `unknownCountByField.co2Source = 100 000` et `coverageNote` porte la justification | **FAIT** (justification §4.3) |
| 15 | **D8-20 / O15** — `bodyType` déclaré non appliqué en mode 2 | `R-D3-20` : `expected [] to include 'bodyType'` ; `R-D9-31` idem | `synthetic/selection.ts` (`pinsSingleModel`, déclaration sans prédicat) ; `tweedehands/selection.ts` (`blocking` séparé d'`unsupported`) + `TweedehandsDataProvider.ts` (passage de `bodyTypeIndexAvailable`) | `✓ R-D3-20` : `unsupportedFilterIds` contient `bodyType` ET `selectionCount` égale l'effectif sans carrosserie ; `✓ R-D3-20b` / `✓ R-D9-31b` : hors mode 2, le filtre est APPLIQUÉ et rien n'est déclaré | **FAIT** (arbitrage §4.4) |
| 16 | **D8-22** — `R-D3-02` sensible à la charge | `R-D3-02` rouge à 219 puis 252 ms (quatre agents actifs sur 4 cœurs) | `tests/review/D3/dataset-100k.test.ts` : médiane de 5 exécutions, **seuil inchangé** | `✓ R-D3-02` : `156 / 123 / 119 / 124 / 163 ms → médiane = 124 ms` (budget 200 ms) | **FAIT** (D-31, §3) |
| 17 | **R3 sur les champs ajoutés** | `R-D9-32` (rouge : les champs n'existaient pas) | — (garde inchangé, intangible) | `✓ R-D9-32` : `scanForbiddenFields` ne signale rien sur une annonce portant `vatDeductible`, `adTier`, `co2Source`, `fuelCategorySource`, `ingestReportFlags` ; `✓` sondes D3 « aucun nom de colonne du lot n'est un champ interdit R3 » et « 1 000 annonces reconverties en objets » | **FAIT** |

---

## 2. Ce qui N'A PAS été fait, et pourquoi — `MetricStats.iqr` / `MetricStats.coverage`

**Point 2 de la mission, non réalisable dans le périmètre d'écriture attribué.** À signaler au
fix-lead : ce résidu de D8-10 tombe entre deux clusters.

`MetricStats` n'est produit par AUCUN provider. `grep -rn MetricStats src/providers` = 0 : les deux
adaptateurs publient `MetricRange` (`min`/`max`/`p05`/`p50`/`p95`/`n`), l'entité de l'interface
GELÉE `DataProvider.ts`, qui n'a **ni** `iqr` **ni** `coverage` et que je ne peux pas amender
(`src/providers/DataProvider.ts` explicitement interdit, et déjà traité par l'étape 0).
`MetricStats.iqr` et `MetricStats.coverage` sont écrits en **quatre littéraux de
`src/engine/quantiles.ts`** (`metricStatsFromCounts`, `EMPTY_STATS`, `exactStatsBySort`), fichier du
périmètre **fix-engine**, où `fix-foundation` les a d'ailleurs explicitement attribués
(`reports/remediation-2.8/fix-foundation.md` §5 point 9 : « fix-engine : … `iqr` de `MetricStats` est
à sa portée immédiate ; `coverage` exige `N`, que `exactMetricStats` ne connaît pas — c'est
l'appelant qui devra le fournir »).

Je n'ai donc **pas** écrit de sonde rouge pour ce point : une sonde que je ne peux pas faire passer
laisserait la suite rouge à la fusion, ce qui coûterait plus qu'elle ne prouve. Le travail restant,
pour l'agent qui portera `src/engine` :

1. `metricStatsFromCounts` : remplacer les deux littéraux `iqr: null` par `iqr: q75 − q25` (les deux
   quantiles de type 7 sont déjà calculés dans la même expression) ; idem dans `exactStatsBySort`
   (`quantileFromSorted(sorted, P75) − quantileFromSorted(sorted, P25)`).
2. `coverage` : `n_m / N` (`EX-DATA-61`, `EX-DATA-64`) exige `N = |Σ|`, que `exactMetricStats` ne
   reçoit pas. Deux options : un paramètre `selectionCount` optionnel, ou un calcul chez l'appelant
   (`src/engine/aggregate.ts`, qui connaît `selectionCount`). `EMPTY_STATS` (`n = 0`) doit garder
   `coverage: null` **si `N` est inconnu**, mais `0` si `N ≥ 1` — `EX-DATA-64` définit `coverage`
   « si `N ≥ 1` », et `null` à `N ≥ 1` serait une seconde valeur d'inconnu pour une division
   parfaitement définie.
3. La sonde `tests/review/D4/quantiles-bin.test.ts` compare l'entité `MetricStats` ENTIÈRE par
   `toEqual` : elle devra être amendée dans le même commit (D-31), comme l'étape 0 l'a déjà fait
   une fois.

---

## 3. Sondes modifiées (D-31 / D8-19)

Une seule sonde existante a été touchée ; aucune n'a été modifiée dans son **intention**, aucune
sonde `it.fails` n'a été retournée en `it` par ce lot (les dettes levées ici n'en portaient pas).

| Sonde | Adaptation | Justification écrite |
|---|---|---|
| `tests/review/D3/dataset-100k.test.ts › R-D3-02` | L'échantillon UNIQUE de temps mural devient la **médiane de 5 exécutions**. Le fait mesuré (le chemin de premier affichage ne porte pas les annonces individuelles) et le **seuil de 200 ms** sont inchangés. | **D8-22, explicitement**. La marge réelle de cette sonde est d'environ 10 % : une mesure unique en fait un détecteur de charge machine autant que de régression. Elle passait à 175/190/178 ms isolée (mesures de `fix-foundation`) et a échoué à 234, 252, 359 ms pendant les exécutions à quatre agents sur quatre cœurs. La médiane est insensible à deux exécutions aberrantes sur cinq — ce qu'une moyenne ne serait pas — et une VRAIE régression déplace les cinq mesures, donc la médiane. Le budget n'est **pas** relâché. La justification est aussi écrite dans le fichier, au-dessus de l'assertion. |

**Sondes ajoutées : 25** (11 en D3, 14 en D9). La suite de revue passe de **800** à **825**.

Trois sondes de mon propre lot ont été récrites **avant leur première exécution verte**, quand
l'arbitrage de D8-20 a été tranché (§4.4) : `R-D9-31` pince désormais un modèle au lieu de demander
le niveau `MODEL`, et `R-D9-31b` a été ajoutée en contrôle positif. Elles n'ont jamais été vertes
avant cette réécriture : ce n'est pas une sonde « qui a révélé un problème » que l'on ajusterait
après coup, c'est la mise au point d'une sonde neuve. Signalé ici par transparence.

---

## 4. Arbitrages, avec leur justification

### 4.1 Le provider synthétique NE publie PAS `coverageWarning` / `samplingBias` / `adTierDistribution`

D8-10 dit « optionnels, renseignés par le provider réel seulement ». Ce n'est pas une commodité :
ces trois champs décrivent la **source** (part de prix fermes réellement servis, biais du produit
publicitaire, distribution des paliers). Sur un jeu GÉNÉRÉ, ils décriraient un biais qui n'existe
pas — `samplingBias` calculé sur la colonne `adTier` synthétique rendrait un verdict de
représentativité sur une distribution que le générateur a lui-même choisie. `R-D3-15c` fige cette
absence, et `SYNTHETIC_COVERAGE_NOTE` en porte la raison, lisible par l'écran Diagnostic.

### 4.2 Dénominateur de `coverageWarning` sur `AGGREGATE_SURFACE` : l'échantillon, pas `listingCount`

`EX-DATA-17` définit `priceCoverage = priceQuotedCount / listingCount`. Appliquée à la lettre sur
2dehands, cette formule divise un compteur mesuré sur l'ÉCHANTILLON lu (30 annonces/page) par un
compte EXHAUSTIF de facette (`totalResultCount`, ~5 220 pour Opel) : elle vaudrait ~0,006 pour
**toutes** les marques, l'avertissement serait toujours vrai et ne dirait plus rien. Le dénominateur
retenu est l'effectif de l'échantillon sur lequel les statistiques sont effectivement calculées —
exactement la règle que l'en-tête de `tweedehands/aggregate.ts` posait déjà pour `MetricRange.n`
(« porte le compte de l'échantillon utilisé, jamais `listingCount` »). La couverture d'échantillon
reste publiée à part (`sampleCoverage`), et `EX-DATA-61bis` est respectée : deux rapports NOMMÉS,
jamais le mot « couverture » nu. **À arbitrer par le fix-lead si l'annexe A doit être précisée sur ce
point** (une phrase de plus dans `EX-DATA-17` : « sur une source d'agrégats, le dénominateur est
l'effectif de l'échantillon retenu, et l'agrégat le déclare »).

### 4.3 `co2Source` sur le provider synthétique : INCONNU, et le dire

`ListingColumnBatch` (`EX-DATA-119`, interface gelée) n'a **aucune** colonne `co2Source`, et je ne
peux pas en ajouter une. La provenance de la mesure ne peut donc pas être portée par ligne côté
synthétique. Plutôt que de laisser le champ muet — le défaut exact que FV-20 constate —, le
descripteur déclare `unknownCountByField.co2Source = listingCount` et `coverageNote` explique
pourquoi. Côté provider réel, où la provenance vit dans `NormalizedListing`, `EX-DATA-35` est tenue
en entier. **Si le fix-lead veut la provenance par ligne côté synthétique, il faut un amendement
d'interface** (une 21ᵉ colonne d'un octet, ≈ +100 Ko à 100 k, sans effet sur `EX-NFR-3`).

### 4.4 D8-20 : « mode 2 » = la sélection pince UN modèle

D8-20 demande que `body` soit déclaré non appliqué « en mode 2 », et la mission précise
« `enterMode2` côté provider = `fetchListingColumns` / agrégats de modèle ». Aucun de ces deux
signaux n'est utilisable tel quel :

- `fetchListingColumns` rend un `ListingColumnBatch`, qui n'a **aucun** champ où loger une
  déclaration (interface gelée) ;
- `level === 'MODEL'` n'est **pas** l'entrée en mode 2 : **D8-02 (FV-02) fait précisément appeler
  `fetchAggregates('MODEL')` en mode 1**, pour les zones-modèles des cartes de l'écran A. Déclarer
  `body` non appliqué sur ce chemin aurait fait afficher des zones NON filtrées sous une carte
  filtrée — une régression introduite sur le dos de la correction de FV-02.

Critère retenu, unique et observable par les deux providers : **la sélection désigne un modèle
unique** (`model=<id>`, ou `makesModelsVariants` réduit à un couple `make|model` complet). C'est la
définition même de l'écran B (`EX-NAV-15` : un couple complet redirige vers B), et c'est la portée
exacte du bandeau normatif — « Filtre Carrosserie non appliqué **à ce modèle** (donnée
indisponible) ». Les zones-modèles de l'écran A, scopées par `makeScope` sans pincer de modèle,
continuent d'appliquer le filtre : la continuité A → B est expliquée par le bandeau, pas cassée par
un second effectif faux.

Second arbitrage, à l'intérieur du premier : `bodyType` est le **seul** identifiant déclaré qui ne
compile PAS en prédicat constamment faux. La règle « plancher honnête » de 2.6 (D-03/DR-005) vise un
filtre que le provider ne sait pas ÉVALUER ; ici il sait, au contraire, que le filtre **ne s'applique
pas** au modèle faute de `Model.bodyTypes` (O15). Publier 0 offre mentirait autant que publier un
effectif faussement filtré. Les deux `CompiledSelection` distinguent donc désormais les identifiants
**déclarés** (`unsupported`, ce que lit `unsupportedFilterIds`) des identifiants **bloquants**
(`blocking`, ce qui vide l'échantillon). « Jamais appliqué en silence, jamais ignoré en silence » :
l'effectif est complet ET l'écart est nommé.

### 4.5 `HYBRID_CATEGORY_UNRESOLVED` et `FUEL_CATEGORY_FROM_FUEL_TYPE` ne sont PAS des bits d'`ingestFlags`

`EX-DATA-45` fixe `KYCAR_INGEST_FLAG` à **17 codes** et dit explicitement, dans son dernier alinéa,
que `HYBRID_CATEGORY_UNRESOLVED` (avec `CO2_ZERO_NON_BEV`, `HYBRID_INCONSISTENT`…) est une
**sous-qualification d'`ENUM_UNKNOWN`**, « comptée dans le rapport d'ingestion mais **non** dans le
vocabulaire à 17 codes ». Les deux providers posent donc le bit `ENUM_UNKNOWN` **et** publient le
compte détaillé dans `ingestFlagCounts` (`Record<string, number>`, sans contrainte de clés).
Le vocabulaire gelé et la table `INGEST_FLAG_BIT` (D-01) sont intacts, `R-D2-18` (« les 17 drapeaux
tiennent ») reste verte, et rien n'a élargi `KYCAR_INGEST_FLAG` par la bande. `UNIT_UNSUPPORTED`, lui,
**appartient** aux 17 codes : il occupe bien son bit.

### 4.6 Déterminisme : hachage pur, jamais un tirage de plus dans la boucle du noyau

Toutes les proportions ajoutées au générateur (unité non gérée, repli carburant, hybride non résolu,
annonce sans deeplink, TVA) sont tirées par `hashToUnit(combineKeys(seed ^ domaine, ligne))` — un
hachage **pur**, sans état. Consommer un tirage supplémentaire du `Prng` du noyau aurait décalé tout
le flot aval : la vérité terrain des outliers, les effectifs de cellules, les taux d'inconnus et les
47 prix sentinelles auraient changé, et une dizaine de sondes vertes mesurant ces valeurs seraient
devenues fausses **sans qu'aucun défaut ne les ait causées**. La preuve est dans le rapport
d'ingestion à 100 000 : `MODEL_UNRESOLVED = 469`, `PRICE_SENTINEL_ABSOLUTE = 47`,
`PRICE_MISSING_UNDECLARED = 2 051`, `SUSPECT_ZERO_MILEAGE = 209` — **exactement** les valeurs
publiées par le rapport 2.6, à l'unité près.

---

## 5. Mesures

### 5.1 Budgets `EX-NFR-1` / `EX-NFR-3` (re-mesurés, D-30 : le budget prime)

| Grandeur | Avant 2.8 | Après 2.8 | Budget | Marge |
|---|---|---|---|---|
| `EX-NFR-1` — mémoire colonnaire à 100 000 | 17,27 Mo | **17,26 Mo** | 25 Mo | 31 % |
| `EX-NFR-3` — lot sérialisé gzip | 5,45 Mo | **5,47 Mo** | 6 Mo | 8,8 % |
| `EX-NFR-10` — bundle initial | 99,46 Kio gzip | **100,38 Kio gzip** | 300 Kio | 67 % |

Le coût de 2.8 sur `EX-NFR-3` est de **+0,02 Mo** : la colonne `vatDeductible` allouée par l'étape 0
existait déjà (100 000 octets à zéro, gratuits à la compression) ; la remplir de trois états lui
donne son entropie réelle. La marge de 8,8 % reste celle, déjà étroite, que D-30 avait consignée
pour `DR-126` — **aucune** régression de budget n'est imputable à ce lot.

### 5.2 `EX-NFR-9` — chemin de premier affichage

```
[rev-D3] chemin de 1er affichage (5 exécutions) : 156 / 123 / 119 / 124 / 163 ms
         → médiane = 124 ms (marge locale EX-NFR-9 ≈ 200 ms)
```

`modelCount` (D8-10) est le seul calcul ajouté à ce chemin. Il est **dense** (un `Int32Array` indexé
par `modelId`, une lecture et une écriture de tableau typé par ligne) : mesuré à ≈ 4 ms à
100 000 lignes, contre ≈ 8 ms pour la version à `Set` de clés composites que la première rédaction
utilisait. Soit 3 % du budget local.

### 5.3 Rapport d'ingestion à 100 000 annonces (graine par défaut)

```
ingestFlagCounts = {"UNIT_UNSUPPORTED":303,"ENUM_UNKNOWN":655,"MODEL_UNRESOLVED":469,
                    "PRICE_SENTINEL_ABSOLUTE":47,"PRICE_MISSING_UNDECLARED":2051,
                    "SUSPECT_ZERO_MILEAGE":209,"FUEL_CATEGORY_FROM_FUEL_TYPE":430,
                    "HYBRID_CATEGORY_UNRESOLVED":225}
rejectedByReason = {"LISTING_URL_MISSING":152}  (rejectedCount = 152)
unknownCountByField = {"priceEur":5908,"mileageKm":1262,"powerKw":1484,"modelYear":832,
                       "firstRegistrationYearMonth":597,"fuelCategory":225,"co2Source":100000}
vatDeductible = inconnu 2 554 · non 61 357 · oui 36 089
```

### 5.4 Vérifications de sortie

```
npx tsc --noEmit -p tsconfig.json           → 0 erreur
npx tsc --noEmit -p tsconfig.review.json    → 0 erreur
npm run build                               → tsc app + worker + vite build, 0 erreur / 0 warning
npm run lint  (eslint .)                    → vert
npx eslint src tests                        → vert
npx vitest run --no-file-parallelism src/providers          → 74 passed (74)
npx vitest run --config vitest.review.config.ts tests/review/D3 tests/review/D9 tests/review/patho
                                            → 0 échec
npm test                                    → 615 passed (615) puis 825 passed (825)
npm run size                                → initial 100,38 / 300 Kio gzip ; différé 0,00 / 400 Kio
```

**E5 — zéro appel réseau** : aucun `fetch` n'a été ajouté ; `tests/review/D9/no-network.test.ts`
reste verte ; les nouvelles fixtures (`mileageUnit`, `fuelTypePrimary`, `btwVerrekenbaar`,
`priorityProduct`, `co2emissionWLTP`…) sont construites en mémoire par `testFixtures.ts`.
**R3 intangible** : `scanForbiddenFields` inchangée, exercée sur tout objet produit (`R-D9-32`, plus
les trois sondes R3 de D3 sur 1 000 lignes reconverties, les noms de colonnes et les chaînes).

---

## 6. Ce que fix-app et fix-screens doivent savoir

1. **`MakeAggregate.modelCount` est désormais un NOMBRE** sur le provider synthétique (jamais `null`
   depuis l'agrégation : une marque sans modèle résolu porte `0`, qui est un fait mesuré). Sur le
   provider réel il vaut `null` quand l'échantillon de la marque est vide. La règle d'affichage de
   FV-02 reste celle de D8-02 : **`null` ⇒ « — », jamais `0`** ; `0` ⇒ « 0 modèles », qui est vrai.
2. **`coverageWarning`, `samplingBias`, `adTierDistribution` sont présents sur le provider RÉEL et
   absents sur le synthétique.** L'écran doit tester la présence (`!== undefined`) et ne jamais
   traiter l'absence comme un `false` : « non mesuré » n'est pas « pas de biais ». `adTierDistribution`
   publie les **5** codes de `KYCAR_AD_TIER`, y compris ceux à zéro.
3. **D8-20 — le bandeau.** `unsupportedFilterIds` contient `bodyType` (identifiant D5 ; le paramètre
   d'URL est `body`) dès que la sélection pince un modèle et qu'un filtre Carrosserie est posé.
   Sur ce cas précis, **l'effectif publié est complet et exploitable** : il ne faut PAS le refuser
   comme un plancher (contrairement au cas général de D-03), mais l'afficher avec le bandeau
   « Filtre Carrosserie non appliqué à ce modèle (donnée indisponible) ». La distinction est
   observable côté provider (`CompiledSelection.blocking` / `CompiledSourceSelection.blocking`) mais
   **n'est pas portée par l'interface `AggregateResult`** : si le contrôleur doit la connaître, il
   faudra soit un amendement d'interface, soit la convention « `unsupportedFilterIds === ['bodyType']`
   sur une sélection à un modèle ⇒ effectif complet ». **À trancher par le fix-lead.**
4. **`SnapshotDescriptor.ingestFlagCounts` porte désormais des clés HORS `KYCAR_INGEST_FLAG`**
   (`FUEL_CATEGORY_FROM_FUEL_TYPE`, `HYBRID_CATEGORY_UNRESOLVED`) — c'est conforme à `EX-DATA-45`,
   mais un panneau Diagnostic (D8-14) qui itérerait le vocabulaire à 17 codes les manquerait : il
   faut itérer les clés de l'objet.
5. **`SnapshotDescriptor.rejectedByReason` n'est plus vide côté synthétique** (`LISTING_URL_MISSING`,
   152 à 100 k) et `rejectedCount` est mesuré. `announcedListingCount` reste égal à `listingCount`
   (couverture d'échantillon 1,0) : un rejet d'ingestion se lit dans le rapport de rejets, pas dans
   la couverture d'échantillon — les confondre ferait tomber le « couverture 100 % » de l'écran A
   pour un motif qu'il ne mesure pas.
6. **La colonne `vatDeductible` est alimentée** : `readVatDeductible(code)` rend `null` pour
   l'inconnu (jamais `false`). Rendu attendu (rappel de `fix-foundation` §5.11) : cellule VIDE pour
   `null`, jeton « TVA déd. » pour `true` seulement. `R-D7-16` reste à fix-screens ; la colonne, elle,
   n'est plus vide — 36 089 « oui », 61 357 « non », 2 554 inconnus sur 100 000.
7. **`MetricStats.iqr` / `coverage` restent à `null`** : voir §2, c'est le périmètre de fix-engine.

---

## 7. Commits (worktree `fix28/providers`, rien n'est poussé — CLAUDE.md §1.3)

| SHA | Message |
|---|---|
| `eef1599` | Phase 2.8 (D-32): failing probes first for D8-08, D8-10, D8-16 and D8-20 |
| `638a38d` | Phase 2.8 (D8-08, D8-10, D8-16, D8-20): the real provider fills the 2.8 dictionary |
| `5305a3a` | Phase 2.8 (D8-08, D8-10, D8-16, D8-20): the synthetic provider fills the 2.8 dictionary |
| `4a968c1` | Phase 2.8 (D8-22, D-31): R-D3-02 measures the median of 5 runs, budget unchanged |
| `93ef206` | Phase 2.8: fix-providers report |
| (suivant) | Phase 2.8 (housekeeping): untrack the node_modules symlink of the worktree |

`src/providers/synthetic/selection.ts` (D8-20, part synthétique) a été emporté par le commit
`638a38d` au lieu de `5305a3a` : les deux commits ont utilisé `git add -A` et la modification était
déjà sur disque. Sans conséquence sur le contenu ni sur la fusion, signalé pour la lecture du journal.

Deux points d'intendance, signalés pour la lecture du journal :

- `src/providers/synthetic/selection.ts` (D8-20, part synthétique) a été emporté par `638a38d` au
  lieu de `5305a3a` : les deux commits ont utilisé `git add -A` et la modification était déjà sur
  disque. Sans conséquence sur le contenu ni sur la fusion.
- **`.gitignore` ne couvre pas le lien `node_modules` d'un worktree.** Le motif est `node_modules/`,
  avec une barre finale, qui ne matche qu'un RÉPERTOIRE ; dans un worktree, `node_modules` est un
  **lien symbolique** vers l'installation racine (jamais `npm ci`, D-50), donc un fichier. Un
  `git add -A` l'a indexé ; il a été retiré de l'index par `git rm --cached` (le lien lui-même est
  intact sur disque, le `node_modules` de la racine n'a jamais été en danger) et le worktree
  affiche de nouveau `?? node_modules`, exactement comme à mon arrivée. **Les quatre autres
  worktrees de la vague F1 sont exposés au même piège** : à vérifier avant chaque fusion. Ajouter
  `/node_modules` à `.gitignore` réglerait le cas pour tous, mais c'est une décision à l'échelle du
  dépôt, hors de mon périmètre — à trancher par le fix-lead.
