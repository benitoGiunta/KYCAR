# Revue patho — rejeu transverse des cas pathologiques du stress-test 2.2
Agent : `rev-patho` · modèle Opus · effort high · 2026-09-08 · branche `claude/kycar-project-ffcplk`

**Angle** : pas de relecture lot par lot (c'est le travail des `rev-D*`), mais le **comportement de
bout en bout** — `DataProvider` → moteur (D4) → modèles de vue des écrans A/B/D — quand la donnée
est pathologique. L'attendu de chaque cas est la décision `ARB-xx` de `reports/REQ-STRESSTEST.md`,
jamais mon jugement.

**Commandes exécutées**

| Commande | Durée | Résultat |
|---|---|---|
| `npx vitest run --config vitest.review.config.ts tests/review/patho` | 6,8 s (mur) / 5,81 s (vitest) | **88 sondes : 68 vertes, 20 rouges** — les 20 rouges portent les 16 constats `R-PATHO-01` à `-16` (4 constats ont deux sondes : ingestion + moteur) ; `R-PATHO-17` est prouvé par la commande `grep` ci-dessous |
| `npx tsc --noEmit -p tsconfig.review.json` | 9 s | 0 erreur dans `tests/review/patho` (2 erreurs préexistantes dans `tests/review/D8/screens.test.ts`, hors périmètre) |
| `npx eslint tests/review/patho` | 4 s | 0 problème |
| `grep -rn 'onSelectBucket' src/` | — | 2 occurrences, **toutes deux dans `Histogram.tsx`** : aucun parent ne fournit le rappel |
| `grep -rn 'unsupported' src/ \| grep -v providers/synthetic/selection.ts` | — | **aucune occurrence** : le champ est produit et jamais lu |
| `grep -rn 'modelVersionClean' src/ \| grep -v '\.test\.'` | — | 8 occurrences, **aucune n'implémente le pipeline `EX-DATA-29`** |
| `grep -rn 'dangerouslySetInnerHTML\|innerHTML' src/screens/ src/components/` | — | **aucune** (E5/ARB-62 : rendu texte par défaut Preact) |
| `grep -rn 'fetch(\|autoscout24\|2dehands.be\|marktplaats' tests/review/patho/` | — | **aucun** : E5 respectée, le `fetcher` de D9 est substitué par une fixture |

**Sondes écrites** : `tests/review/patho/_fixtures.ts` (outillage : encodeur `ListingColumnBatch`
conforme au contrat gelé, `DataProvider` mock conforme, contrôleur d'invariants) puis
`volumetrie.test.ts`, `valeurs.test.ts`, `structure.test.ts`, `ingestion.test.ts`,
`sollicitation.test.ts`, `verite-affichee.test.ts`, `bloquants-st.test.ts`.
`src/` n'a pas été modifié. Rien n'est commité.

---

## 1. Verdict par critère de succès

Ma mission n'est pas rattachée à un lot : les « critères » que je vérifie sont les **propriétés
transverses** que PLAN-2 §2.5 rend opposables à l'ensemble (S1 « aucune valeur affichée fausse »,
S3 « les cas pathologiques 2.2 sont rejoués », S5 « R2/R3/E5 »).

| Critère | Énoncé | Verdict | Preuve (sonde / commande) |
|---|---|---|---|
| P1 | Aucune valeur affichée n'est fausse sous jeu pathologique | **NON ATTEINT** | `R-PATHO-01`, `-02`, `-03`, `-04`, `-09`, `-10`, `-12`, `-15` : une fourchette servie à l'écran A vaut `1 € – 10 000 000 €` sur trois annonces (`ingestion.test.ts`) |
| P2 | Les invariants I1/I2/I4/I5 tiennent sur tout jeu (sain → dégénéré) | **ATTEINT** | `verite-affichee.test.ts` : 18 sondes vertes sur 6 jeux (vide, unitaire, 100 cellules unitaires, valeurs absentes, `modelId = 0` + doublons, sain) + `VOL-200K` à 200 000 lignes |
| P3 | Volumétrie 0 / 1 / 100 cellules / 50 000 / 200 000 sans dégradation de vérité | **ATTEINT** | `volumetrie.test.ts` : 6/6 vertes ; `VOL-00` prouve qu'aucun `0 – 0 €` n'est fabriqué (`EX-SCR-116`) |
| P4 | Les paliers d'effectif `ARB-17` (12 / 30) sont uniques et respectés du moteur à l'écran | **PARTIELLEMENT ATTEINT** | `VAL-SEUIL-11/12/29/30` vertes (moteur ET `effectifTier` alignés) ; `R-PATHO-06` rouge : la zone-modèle publie `P5–P95` au palier `5 ≤ n ≤ 11` où `ARB-17` les désactive |
| P5 | L'étiquetage des fourchettes suit `ARB-19`/`ARB-20` (`[p05,p95]` nommée, `[min,max]` en secondaire) | **ATTEINT** | `VER-ETIQ-A` rejoue l'exemple littéral d'`ADV-02` (119 € / 289 000 €) : la ligne principale ne les contient pas, l'infobulle brute les porte |
| P6 | La sollicitation (78 filtres, `eq` 136, rafale 20 Hz, lien tronqué) ne casse rien | **ATTEINT** | `SOL-77`, `SOL-77-LARGE`, `SOL-REFUS`, `SOL-EQ-136`, `SOL-RAFALE-20HZ`, `SOL-RAFALE-HISTORIQUE`, `SOL-TRONQUE` : 7/7 vertes |
| P7 | Un filtre posé est appliqué, ou son inapplication est visible | **NON ATTEINT** | `R-PATHO-12` : `equipment` (classe `T`) est ignoré sans trace, l'effectif publié est celui du non-filtré |
| P8 | R3 : aucun champ vendeur ne franchit `DataProvider`, même sous charge adverse | **ATTEINT** | `ING-R3` : nom, téléphone, ville, latitude/longitude injectés dans le brut, absents du descripteur et des agrégats |
| P9 | E5 : aucune requête réseau dans le code exercé ni dans mes sondes | **ATTEINT** | grep (tableau ci-dessus) ; le `TweedehandsFetcher` est substitué par une fixture `__NEXT_DATA__` locale |
| P10 | R2 : toute donnée entre par `DataProvider` | **ATTEINT** | toutes mes sondes passent par un `DataProvider` conforme (`batchProvider`, `SyntheticDataProvider`, `TweedehandsDataProvider`) ; aucun accès direct au stockage |
| P11 | Le geste central du parcours 2 (clic sur une barre → filtre) fonctionne | **NON ATTEINT** | `R-PATHO-17` : `onSelectBucket` n'est fourni par aucun parent (grep A) — `ARB-09` n'a aucun point d'application |
| P12 | Budget `EX-NFR-5` sur un recalcul complet non élagué | **NON VÉRIFIABLE ici** | mesure hors périmètre (`rev-D4`/`rev-D7` détiennent `*.perf.test.ts`). Constat factuel : `VOL-200K` (génération + recalcul complet) prend **1,68 s** ; extrapolation linéaire à 10⁶ ≈ **8,4 s** — cohérent avec O17 (720–985 ms / 100 k). **Hypothèse (E4)** : extrapolation linéaire non mesurée. |

---

## 2. Constats

Sévérités : **BLOQUANT** = fausse une valeur affichée / viole R2-R3-E5 / casse un parcours cible ·
**MAJEUR** = exigence non tenue sans fausser le reste · **MINEUR** = cosmétique, dette documentaire.

| ID | Type | Sév. | Exigence(s) | Constat | Preuve d'exécution | Correction attendue | Fichiers |
|---|---|---|---|---|---|---|---|
| `R-PATHO-01` | ÉCART-EXIGENCE | **BLOQUANT** | `EX-DATA-19(1)`, `EX-DATA-60`, `ARB-13`, `ARB-15`, `ADV-04` | **Aucune ingestion du dépôt ne pose `PRICE_SENTINEL_ABSOLUTE`.** Le moteur l'honore correctement quand le drapeau est là (`VAL-PRIX-SENTINELLE-MOTEUR` verte), mais aucun provider ne le pose : une annonce à 1 € entre dans `V_price` et devient le **minimum de la fourchette servie à l'écran A**. | `ingestion.test.ts::R-PATHO-01` → `opel.price.min` = **1** (attendu 12 000) ; `valeurs.test.ts::R-PATHO-01` → `ingestFlags` = `[]` | Dans `mapListingToNormalized` (D9) et `generate.ts` (D3), poser `PRICE_SENTINEL_ABSOLUTE` dès `priceEur < 250`, incrémenter `ingestFlagCounts`. Sonde à faire passer : `ingestion.test.ts::R-PATHO-01`. | `src/providers/tweedehands/normalize.ts:145`, `src/providers/synthetic/generate.ts` |
| `R-PATHO-02` | ÉCART-EXIGENCE | MAJEUR | `ARB-16`, champ 7 `priceEur`, `ADV-16` | **`PRICE_OUT_OF_RANGE` n'est jamais posé.** Un prix de 10 000 000 € (au-dessus du plafond de validation de 5 000 000 €) est conservé tel quel et devient le **maximum publié**. | `ingestion.test.ts::R-PATHO-02` → `opel.price.max` = **10 000 000** (attendu 12 000) | Même point d'ingestion : `p > 5 000 000` ⇒ `priceEur = INCONNU` + `PRICE_OUT_OF_RANGE`, **sans rejet d'annonce** (le code respecte déjà « sans rejet » pour `p = 0`, sonde `VAL-PRIX-0` verte). | `src/providers/tweedehands/normalize.ts:68-80` |
| `R-PATHO-03` | ÉCART-EXIGENCE | **BLOQUANT** | `EX-DATA-19(2)`, `EX-DATA-60` ligne `price`, `EX-DATA-87`, `ARB-13` | **`PRICE_IMPLAUSIBLE_IN_CELL` n'est implémenté nulle part** (le vocabulaire le nomme, `flags.ts:50` renvoie au détecteur, `outliers.ts` ne le calcule pas). Une annonce à 900 € dans une cellule de médiane 12 000 € (< 0,10 × médianeRéf) reste dans `V_price` : `n_price` = 21 au lieu de 20 et le minimum publié tombe à 900 €. | `valeurs.test.ts::R-PATHO-03` → `price.n` = **21** (attendu 20) | Ajouter à `outliers.ts` (ou un module d'analyse dédié) le calcul en **un seul passage** d'`EX-DATA-19(2)` (`filtrer l'absolu → médiane → marquer le relatif`, aucune itération), l'appliquer à `V_price` par cellule et publier `implausibleInCellCount` (`EX-DATA-87`). | `src/engine/outliers.ts`, `src/engine/flags.ts:48-56` |
| `R-PATHO-04` | BUG | MAJEUR | `EX-DATA-111` (`mileageKm ∈ [0, 1 500 000]`), `EX-DATA-120` | **Un kilométrage négatif traverse l'ingestion et le moteur.** `parseNumeric` accepte le signe, aucune borne n'est appliquée, et `isMileageValid(-5)` est vrai (seul `-1` est la sentinelle) : `-5` devient le minimum de `V_mileage`. | `valeurs.test.ts::R-PATHO-04` → `mapListingToNormalized(mileage:'-5 km').mileageKm` = **-5** | Appliquer les bornes de `LISTING_NUMERIC_BOUNDS` à l'ingestion : hors `[0, 1 500 000]` ⇒ `INCONNU` + `MILEAGE_OUT_OF_RANGE` (le masque `MILEAGE_INVALID_MASK` du moteur existe déjà et n'attend que le drapeau). | `src/providers/tweedehands/normalize.ts:105`, `src/providers/tweedehands/vocabularyMap.ts:227` |
| `R-PATHO-05` | ÉCART-EXIGENCE | MINEUR | champ 13 `powerKw`, domaine `[1, 9999]` (`LISTING_NUMERIC_BOUNDS`) | **`powerKw = 0` est conservé comme valeur métier** au lieu de devenir `INCONNU` ; la colonne écran D affiche `0 kW`, indiscernable d'une puissance mesurée. La matrice `ST-adversarial` annonçait « tient — devient INCONNU proprement ». | `valeurs.test.ts::R-PATHO-05` → `ingested.powerKw` = **0**, `row.powerKw` = **0** (attendu `null`) | Même correctif générique que `R-PATHO-04` : borner à l'ingestion, sentinelle `-1` hors domaine. | `src/providers/tweedehands/normalize.ts:139` |
| `R-PATHO-06` | ÉCART-EXIGENCE | MAJEUR | `ARB-17` palier `5 ≤ n ≤ 11`, `EX-SCR-33`, `EX-SCR-113` #4 | **La zone-modèle publie la fourchette `P5–P95` à tous les paliers.** `view-model.ts` consulte `modelZoneMedianDisplay(n)` (médiane seule) mais **jamais `effectifTier(n)`** : à `n = 8`, `ARB-17` désactive « percentiles `P5`/`P95`, bande interquartile, régression et détection d'outliers », et la fourchette est pourtant affichée avec le libellé « fourchette centrale (90 % des offres) ». | `valeurs.test.ts::R-PATHO-06` → `zone.price.available` = **true** (attendu `false`) | Dans `buildModelZoneViewModel`, brancher `effectifTier(agg.price.n)` : `'trop-faible'`/`'reduite'` ⇒ `price/year/mileage` non disponibles, jeton ambre `n = <n>` (`ARB-17`). Sonde à faire passer telle quelle. | `src/screens/market/view-model.ts:140-190`, `src/screens/market/thresholds.ts:75` |
| `R-PATHO-07` | BUG | MAJEUR | `EX-DATA-89`, `EX-DATA-92`, invariant I6 | **Sous variance de prix strictement nulle, M2 déclare toutes les annonces « évaluées ».** Le test de dispersion `pass.s <= 0` ne capte que le zéro exact : avec un régresseur non dégénéré, le MAD vaut ≈ 1e-16 (bruit flottant) et passe. Aucun faux positif n'en découle (`VAL-VARIANCE-0` verte) mais `outlierEvaluatedCount` = 40 / `outlierNotEvaluatedCount` = 0 au lieu de 0 / 40 — deux chiffres publiés du panneau Diagnostic. Le cas colinéaire complet est, lui, correct (`VAL-VARIANCE-0-COLIN` verte). | `valeurs.test.ts::R-PATHO-07` → `outlierEvaluatedCount` = **40** (attendu 0) | Remplacer `if (pass.s <= 0)` par un seuil **relatif** à l'échelle des `y` (par ex. `s <= 1e-9 · max(1, |médiane(y)|)`) et émettre `INSUFFICIENT_SPREAD`. | `src/engine/outliers.ts:210` (`fitM2`) |
| `R-PATHO-08` | ÉCART-EXIGENCE | MAJEUR | `EX-SCR-113bis` (créé par `ARB-59`), `EX-DATA-86` | **La détection d'outliers traite `modelId = 0` comme un modèle ordinaire.** `ARB-59` impose que l'échelle de repli démarre à `C₃ = Σ` pour la clé réservée (« `C₁` et `C₂` exigent un `modelId` résolu »). Sur 40 annonces non résolues, les verdicts sont étiquetés `MODEL_YEAR` : l'écran nomme comme base de comparaison une cellule « marque · modèle · année » qui n'existe dans aucune taxonomie. | `structure.test.ts::R-PATHO-08` → `cellLabel` = **`MODEL_YEAR`** (attendu `SELECTION`) | Dans `detectOutliers`, ignorer `C₁`/`C₂` quand `modelId === MODEL_ID_UNRESOLVED` et démarrer à `C₃`. Le reste d'`ARB-59` est **conforme** (route valide, zone cliquable, slug — `STR-MODELID0` verte). | `src/engine/outliers.ts:262-330` |
| `R-PATHO-09` | ÉCART-EXIGENCE | **BLOQUANT** | `EX-DATA-15`, `ARB-54`, `ADV-05` | **Aucune déduplication par `listingId` nulle part dans la chaîne.** Deux occurrences du même `itemId` sont comptées deux fois dans l'échantillon mode 1 ; `duplicateListingCount` est écrit en dur à `0` par les deux providers. L'ordre d'ingestion total `(pageIndex, positionDansPage)` d'`ARB-54` n'est pas non plus matérialisé. | `ingestion.test.ts::R-PATHO-09` → `price.n` = **2**, `listingCount` = 2, `duplicateListingCount` = **0** (attendus 1/1/1) ; `structure.test.ts::R-PATHO-09 (moteur)` montre que le moteur ne rattrape pas | Déduplication à l'ingestion, dans l'ordre total d'`ARB-54`, avec `duplicateListingCount` alimenté ; à défaut, dédupliquer dans le moteur au chargement du batch (mais l'annexe A place la règle à l'ingestion). | `src/providers/tweedehands/TweedehandsDataProvider.ts:127`, `src/providers/synthetic/SyntheticDataProvider.ts:232` |
| `R-PATHO-10` | ÉCART-EXIGENCE | **BLOQUANT** | `ARB-54`, `EX-DATA-45`, `EX-DATA-106`, `EX-SCR-53`/`203` | **`DUPLICATE_VALUE_CONFLICT` n'est jamais posé** (le code existe dans le vocabulaire gelé, `vocabularies.ts:170`, et n'est écrit nulle part). Deux occurrences du même `listingId` à 12 900 € et 10 500 € produisent deux lignes d'écran D portant le **même identifiant et deux prix**, sans jeton `!` ni compteur. C'est le « mensonge plausible » d'`ADV-05` intact. | `ingestion.test.ts::R-PATHO-10` → `duplicateValueConflictCount` = **0**, `ingestFlagCounts.DUPLICATE_VALUE_CONFLICT` = **undefined** | Avec `R-PATHO-09` : à la déduplication, comparer `priceEur`, `priceStatus`, `mileageKm`, `firstRegistrationYearMonth` ; poser le drapeau sur l'occurrence conservée et incrémenter `duplicateValueConflictCount`. | mêmes fichiers que `R-PATHO-09` |
| `R-PATHO-11` | DETTE | MINEUR | `EX-DATA-29` étape 6, `ARB-61`, `ADV-17` | **Le pipeline de nettoyage `EX-DATA-29` n'existe pas** : aucun module ne produit `modelVersionClean` (le générateur synthétique écrit des chaînes déjà courtes, l'adaptateur D9 n'écrit pas du tout ce champ). La garantie `chaîne(80)` et le repli « à défaut d'espace, troncature dure à 80 » d'`ARB-61` n'ont donc aucun point d'application : une chaîne de 300 caractères sans espace traverse jusqu'au modèle de vue de l'écran D. | `structure.test.ts::R-PATHO-11` → `row.modelVersion.length` = **301** (attendu ≤ 80) ; grep C | Implémenter `EX-DATA-29` (7 étapes + repli `ARB-61` + coupe sur groupe de graphèmes `ARB-24`) dans un module partagé consommé par tout adaptateur, et l'appliquer à l'ingestion. | `src/providers/tweedehands/normalize.ts`, `src/providers/synthetic/generate.ts:478` |
| `R-PATHO-12` | BUG | **BLOQUANT** | `EX-SRCH-9ter`, `EX-DATA-108`, `A-01` | **Un filtre de classe `T` non pris en charge est ignoré silencieusement.** `compileSelection` produit une liste `unsupported` (le commentaire l'assume comme dette), mais **aucun appelant ne la lit** (grep B : zéro occurrence hors du fichier producteur). `fetchSelectionCount(handle, 'equipment=abs,nav,xen')` renvoie **exactement** l'effectif non filtré : l'écran affiche `<n> offres` pour une sélection qui n'a jamais été appliquée, et rien à l'écran ne le dit. | `sollicitation.test.ts::R-PATHO-12` → `withEquipment` = `total` = **3000** | Deux voies, l'une ou l'autre : (a) appliquer réellement les filtres manquants ; (b) faire remonter `unsupported` jusqu'au bandeau (état dégradé nommé) et interdire de publier un effectif présenté comme filtré. La voie (b) est le minimum pour ne pas mentir. | `src/providers/synthetic/selection.ts:139-146`, `src/providers/synthetic/SyntheticDataProvider.ts`, `src/orchestration/data-controller.ts` |
| `R-PATHO-13` | ÉCART-EXIGENCE | MAJEUR | `EX-SCR-176` (modifié par `ARB-12`), `ADV-01` | **Le jeton d'un filtre actif n'affiche pas toujours son libellé.** `ARB-12` fait de l'affichage du couple (libellé, valeur) **la contre-mesure unique** du lien tronqué : « l'utilisateur lit `Prix : à partir de 50 €` et non `Prix` ». Constaté : un intervalle rend `≥ 500 €` (valeur sans libellé) et une énumération à ≤ 2 valeurs rend `Essence` (valeur sans libellé). La contre-mesure d'`ARB-12` est donc à moitié en place. | `sollicitation.test.ts::R-PATHO-13` → `priceToken.text` = **`≥ 500 €`** (ne contient pas « Prix ») | Dans `formatIntervalToken` et `formatEnumToken`, préfixer systématiquement `${def.label} : `. Attention aux budgets de troncature (`ARB-24`). | `src/components/filters/labels.ts:86-133` |
| `R-PATHO-14` | ÉCART-EXIGENCE | MAJEUR | `EX-SRCH-18bis` (créé par `ARB-30`), `EX-SCR-77` | **`ustate`, `powertype` et `cy` sont traités comme des filtres utilisateur.** `EX-SRCH-18bis` en fait des valeurs **injectées vers la source**, « jamais sérialisées dans l'URL de l'application, jamais comptées dans le badge de filtres actifs, jamais remises à zéro par une réinitialisation ». Le registre les expose (`hadAccident` porte même le défaut relevé `N,U` qu'`ARB-30` écarte), la sérialisation les émet, et aucune injection `ustate=A,N,U` n'existe côté provider. | `bloquants-st.test.ts::R-PATHO-14` → `serializeQuery` = **`cy=B&powertype=hp&ustate=A`** | Sortir ces cinq paramètres du registre exposé (ou les marquer `nonExposed`), et matérialiser l'injection `EX-SRCH-18bis` dans les adaptateurs. Vérifier au passage l'articulation avec `damaged_listing` (classe `D`), que `ARB-30` désigne comme le seul filtre utilisateur d'accidentés. | `src/state/filter-registry.ts:462,494,503`, `src/state/url-codec.ts` |
| `R-PATHO-15` | ÉCART-EXIGENCE | **BLOQUANT** | `EX-SRCH-11bis` (créé par `ARB-33`), `EX-DATA-36`, `AMB-19` | **Aucune conversion d'unité avant évaluation d'un prédicat.** `powertype = hp` est un filtre reconnu du registre mais la borne `powerfrom = 100` est comparée telle quelle à la colonne `powerKw` : `powerType=hp;powerFrom=100` et `powerFrom=100` renvoient **le même effectif**. `ARB-33` cote ce constat BLOQUANT (« 640 offres contre 430 sur 1 281 »). Aucune occurrence de la constante 0,7355 dans `src/`. | `bloquants-st.test.ts::R-PATHO-15` → `enCh` = `enKw` = **2921 / 3000** | Convertir la borne vers l'unité canonique **sans arrondi intermédiaire** (`powerKw ≥ borne_ch × 0,7355`), en une seule constante nommée, avant compilation du prédicat — côté `compileSelection` (provider) et `compilePredicate` (moteur). | `src/providers/synthetic/selection.ts:52-63`, `src/engine/predicates.ts:98-126` |
| `R-PATHO-16` | ÉCART-EXIGENCE | MAJEUR | `EX-DATA-94`, `EX-SCR-206`, `EX-DATA-117` | **`opportunityScore` n'est publié que pour les annonces SIGNALÉES.** `EX-DATA-94` le définit pour toute annonce à laquelle M1 ou M2 **s'applique** (`null` seulement sinon) ; `detectOutliers` n'émet un `OutlierVerdict` que si un seuil est franchi. Sur 60 annonces toutes évaluées, l'index n'en porte qu'**une**. Conséquence directe : le tri par défaut de l'écran D (`EX-SCR-206`, « écart au prix attendu ») ne classe que les aberrations, toutes les autres lignes tombant en fin de liste avec un score `null`. | `verite-affichee.test.ts::R-PATHO-16` → `index.size` = **1** pour `outlierEvaluatedCount` = 60 | Publier `opportunityScore` (et `expectedPriceEur`/`deviationPct` quand M2 s'applique) pour **toute annonce évaluée**, en séparant « verdict d'aberration » et « score de classement » ; conserver `flags` vide pour les non signalées. | `src/engine/outliers.ts:400-470`, `src/screens/outlier-index.ts`, `src/screens/listings/listings-model.ts` |
| `R-PATHO-17` | CRITÈRE-NON-ATTEINT | **BLOQUANT** | `ARB-09` / `EX-SCR-149`, `AMB-10` | **Le clic sur une barre d'histogramme ne pose aucun filtre.** `Histogram.tsx` déclare `onSelectBucket?` et l'appelle, mais **aucun parent ne le fournit** (grep A : les deux seules occurrences du dépôt sont dans ce fichier). `ARB-09` qualifie ce geste de « geste central du parcours 2 » et impose la règle `<x>from = lo`, `<x>to = hi − u` avec un test de recette du lot D4 ; ni la règle ni le test n'existent. Le brossage, lui, est câblé et correct (`brushToIntervalFilters` pose `[min, max]` observés, cohérent avec des bornes inclusives). | grep A ; la sonde `bloquants-st.test.ts::ST-ARB09` **verte** prouve que le moteur honore bien `[lo, hi − 1]` : il ne manque que le câblage | Ajouter au modèle de vue de l'écran B une fonction `bucketToIntervalFilters(bucket, metric)` appliquant `hi − u` (et les deux cas de débordement), la brancher sur `onSelectBucket` dans `DistributionScreen`, et écrire le test de recette d'`ARB-09` (effectif après clic = effectif de la barre). | `src/screens/distribution/DistributionScreen.tsx:161-163`, `src/screens/distribution/Histogram.tsx:116` |

**Bilan** : **17 constats — 7 BLOQUANT · 8 MAJEUR · 2 MINEUR** (dont 1 dette documentaire).

---

## 3. Cas pathologiques rejoués

| Cas (ADV-xx / ST-xx / matrice) | Attendu (exigence, décision ARB) | Obtenu | Verdict |
|---|---|---|---|
| Effectif nul `n = 0` | `EX-DATA-81`, `EX-SCR-116` : aucun agrégat, aucun `0 – 0 €` | 0 agrégat, 0 bucket, `price.min = null`, écran A en `empty` | **CONFORME** |
| Effectif unitaire `n = 1` | matrice ADV : quantile défini, `sd = null`, bucket unique | `p50 = 9 990`, `stdDev = null`, 1 bucket, zone « 1 seule offre » | **CONFORME** |
| 1 annonce × 100 cellules | invariants tenus, aucune statistique de cellule | 100 zones, tous verdicts en `C₃`, I1/I2/I4/I5 verts | **CONFORME** |
| 200 000 annonces (cache module) | I1/I2/I4/I5, ≤ 26 bins/métrique | sommes exactes, 1,68 s ; extrapolation 10⁶ ≈ 8,4 s (**hypothèse E4**) | **CONFORME** (perf hors périmètre, cf. P12) |
| Cellule unique de 50 000 | M1/M2 sur `C₁`, pas de repli | tous les verdicts M1 en `MODEL_YEAR`, invariants verts | **CONFORME** |
| Prix `0 €` | `ARB-16` : `MISSING` + `INCONNU`, aucun rejet | exactement cela, `PRICE_MISSING_UNDECLARED` posé | **CONFORME** |
| Prix `1 €` | `ARB-13`/`ARB-15` : compté dans l'effectif, hors `V_price` | compté **et** dans `V_price` ; min publié = 1 € | **NON CONFORME — `R-PATHO-01`** |
| Prix `ON_REQUEST` / `MISSING` | `EX-DATA-16` : comptés, exclus des stats de prix | 12 comptés / 10 dans `V_price`, partition I5 exacte | **CONFORME** |
| Prix `10⁷` (aberrant) | `ARB-16` : `INCONNU` + `PRICE_OUT_OF_RANGE`, aucun rejet | conservé, devient le max publié | **NON CONFORME — `R-PATHO-02`** |
| Prix `900 €` dans cellule à 12 000 € | `EX-DATA-19(2)` : hors `V_price` | dans `V_price`, `n_price` 21 au lieu de 20 | **NON CONFORME — `R-PATHO-03`** |
| Année manquante | `EX-DATA-26` : exclusion métrique par métrique | `year.n` = 5/6, prix et km intacts | **CONFORME** |
| Année future (2099) | matrice ADV : « fragilité mineure », pas de rupture | comptée, absorbée par le bin de débordement, I4 tenu | **CONFORME** (fragilité inchangée : aucun drapeau de suspicion) |
| Km `0` (drapeauté) | `EX-DATA-38` + `SUSPECT_ZERO_MILEAGE` | hors `V_mileage`, compté dans l'effectif | **CONFORME** (moteur) |
| Km négatif | `EX-DATA-111` : hors domaine ⇒ `INCONNU` | `-5` conservé, devient le minimum | **NON CONFORME — `R-PATHO-04`** |
| Km `10⁶` | dans le domaine `[0, 1 500 000]` | accepté, max publié = 1 000 000 | **CONFORME** |
| Puissance `0` | domaine `[1, 9999]` ⇒ `INCONNU` | `0` conservé | **NON CONFORME — `R-PATHO-05`** |
| Variance nulle (même prix) | `EX-DATA-89/92` : `INSUFFICIENT_SPREAD`, 0 faux positif | 0 faux positif ✔ ; mais 40 « évaluées » | **PARTIEL — `R-PATHO-07`** |
| Colinéarité totale (prix ET km constants) | régresseurs retirés, 0 évaluée | exactement cela | **CONFORME** |
| Cellule `n = 11` | `ARB-17` : ni M1 ni M2 ; palier `reduite` | 0 verdict, `effectifTier(11) = 'reduite'` | **CONFORME** (moteur) / **NON CONFORME** à l'écran — `R-PATHO-06` |
| Cellule `n = 12` | M1 seule ; palier `sans-m2` | M1 > 0, M2 = 0, `effectifTier(12) = 'sans-m2'` | **CONFORME** |
| Cellule `n = 29` | M1 seule | M1 > 0, M2 = 0 | **CONFORME** |
| Cellule `n = 30` | M1 **et** M2 ; palier `complete` | M1 > 0, M2 > 0, `effectifTier(30) = 'complete'` | **CONFORME** |
| Bascule 29 → 30 (`ADV-07`) | `ARB-18` : discontinuité assumée, **méthode nommée** | bascule observée ; `methodLabel` produit les deux formes exactes | **CONFORME** |
| `modelId = 0` (`ADV-14`) | `ARB-59` : route valide, zone cliquable, slug `modele-non-identifie`, écran B restreint | route valide ✔, zone cliquable ✔, exclue des « n modèles » ✔, classée en dernier ✔ ; mais cellules `C₁`/`C₂` sur la clé réservée | **PARTIEL — `R-PATHO-08`** |
| Marque connue sans modèle résolu | agrégat marque non nul, « 0 modèles » | `listingCount = 12`, `modelCount = 0`, une zone « non identifié » | **CONFORME** (fragilité de lisibilité, déjà signalée par la matrice ADV) |
| Doublon exact, prix identiques (`ADV-05`) | `EX-DATA-15` : 1ʳᵉ occurrence conservée | les deux comptées, `duplicateListingCount = 0` | **NON CONFORME — `R-PATHO-09`** |
| Doublon, prix différents (`ADV-05`) | `ARB-54` : ordre total + `DUPLICATE_VALUE_CONFLICT` | aucun drapeau, deux prix pour un même `listingId` | **NON CONFORME — `R-PATHO-10`** |
| Même annonce sous deux pays | même règle de déduplication | comptée deux fois | **NON CONFORME** (même cause, `R-PATHO-09`) |
| Pays hors table (`ADV-15`) | `ARB-60` : `countryCode = INCONNU`, annonce conservée | conservée, `countryCode = null` | **CONFORME** (le drapeau `MARKETPLACE_UNMAPPED` n'est pas posé — dette de `R-PATHO-11`/famille) |
| `modelVersionRaw` 300 car. sans espace (`ADV-17`) | `ARB-61` : `modelVersionClean` ≤ 80, troncature dure | 301 caractères jusqu'au modèle de vue | **NON CONFORME — `R-PATHO-11`** |
| `modelVersionRaw` avec `<script>` (`ADV-18`) | `ARB-62` : rendu en **texte**, jamais en balisage | chaîne restituée littéralement ; CSV échappé ; aucun `innerHTML` dans `src/screens` ni `src/components` | **CONFORME** |
| 78 filtres posés (`ADV-10`) | `ARB-56` : ≈ 1 720 car., sous le plafond | **827 car.** aux valeurs plausibles ; **1 535 car.** avec TOUTES les énumérations à leur largeur maximale | **CONFORME** (chiffre d'`ARB-56` à réviser à la baisse, voir §5) |
| Refus au-delà de 2 000 car. | `EX-NAV-11` : refus explicite, aucune troncature | `wouldExceedBudget = true`, message normatif, sérialisation complète | **CONFORME** |
| `eq` à 136 valeurs (`ADV-11`) | `REJET-01` : non un défaut, conservé comme preuve de risque | 136 valeurs sérialisées sans perte, `semanticsWarning = EQ_AND_PRESUMED` porté par le registre | **CONFORME** |
| 20 changements de filtre `R` en 1 s (`ADV-12`) | `ARB-57` / `EX-SRCH-1bis` : ≤ 3 immédiats puis mode groupé, **au plus un** recalcul en attente | ≤ 4 recalculs, jamais de file, 1 seule entrée d'historique pour 20 changements | **CONFORME** |
| Lien tronqué (`ADV-01`) | `ARB-12` : limite déclarée, non corrigée ; contre-mesure = jeton (libellé + valeur) | troncature **sous** le domaine rattrapée et signalée (mieux qu'attendu) ; troncature **dans** le domaine acceptée sans signal (conforme à la limite déclarée) ; jeton sans libellé | **PARTIEL — `R-PATHO-13`** |
| Filtre `T` non pris en charge | effectif publié = effectif de la sélection appliquée | effectif du non-filtré, sans trace | **NON CONFORME — `R-PATHO-12`** |
| `T-01`/`AMB-15`/`AMB-28` → `ARB-01` | trois couvertures distinctes, `NON_APPLICABLE` sous filtre, jamais 100 % fabriqué | exactement cela ; bandeau `C3` non refermable sous 20 % | **CONFORME** |
| `AMB-01` → `ARB-21` | arrondi au plus proche, `Math.floor` interdit | `roundHalfAwayFromZero(12499,5) = 12500` | **CONFORME** |
| `AMB-02`/`AMB-22` → `ARB-25` | comparateur unique, `Intl.Collator` interdit, ordre total | diacritiques repliés, ordre stable et total sur libellés égaux | **CONFORME** |
| `AMB-04` → `ARB-28` | 20 seulement à l'amorce, virtualisation à 40 sans plafonnement, bandeau à 60 | table unique respectée ; carte à 100 modèles complète et virtualisée | **CONFORME** |
| `AMB-05` → `ARB-29` | état `SANS-FILTRE` défini une fois | `deriveScreenAState` unique, 6 états | **CONFORME** |
| `AMB-09` → `ARB-05` | `BIN` seul, largeur dans l'échelle finie, ≤ 26 bins, vides conservés, déterministe | tout vérifié, y compris l'invariance par permutation (I8) | **CONFORME** |
| `AMB-10` → `ARB-09` | bornes inclusives ; `[lo, hi − 1]` = effectif de la barre | prédicat inclusif ✔, `INCONNU` exclu ✔ ; **mais le clic n'est pas câblé** | **PARTIEL — `R-PATHO-17`** |
| `AMB-11` → `ARB-10` | intervalle inversé permuté au chargement, signalé | permuté, `INVERTED_INTERVAL` avec le message normatif | **CONFORME** |
| `AMB-12` → `ARB-11` | 5 classes de correction, toutes signalées | 4 classes exercées, toutes signalées, aucune correction muette | **CONFORME** |
| `AMB-13` → `ARB-30` | `ustate`/`powertype`/`cy` ne sont pas des filtres utilisateur | exposés, sérialisés, comptés | **NON CONFORME — `R-PATHO-14`** |
| `AMB-19` → `ARB-33` | prédicat sur le champ canonique, borne convertie | aucune conversion | **NON CONFORME — `R-PATHO-15`** |
| `AMB-27` → `ARB-35` | égalité stricte de code, `INCONNU` non retenu par défaut | exactement cela | **CONFORME** |
| `AMB-30` → `ARB-36` | `INCONNU` jamais clé d'agrégation ; cellule démarre à `C₂` | aucun bucket « année inconnue », aucun verdict `MODEL_YEAR` | **CONFORME** |
| `T-09` → `ARB-43` | plafond unique de 4, `modelId = 0` exclu, écrêtage signalé | `MAX_COMPARE = 4`, `clipped = true` | **CONFORME** |
| `ADV-02`/`ADV-03` → `ARB-19` | écran A : `[p05,p95]` nommée + `[min,max]` secondaire | exemple littéral d'`ADV-02` rejoué : conforme | **CONFORME** (écran B : l'en-tête `min – max` existe dans `DistributionScreen.tsx:149` mais son rendu n'est **pas vérifiable par exécution** en environnement `node`) |

---

## 4. Exigences vérifiées conformes (pour la matrice 2.7)

`EX-DATA-16(a)(b)(c)` · `EX-DATA-26` · `EX-DATA-38` (moteur) · `EX-DATA-59` · `EX-DATA-60` (moteur,
sur drapeau posé) · `EX-DATA-61bis` · `EX-DATA-64` · `EX-DATA-68`/`69` · `EX-DATA-70`/`70bis`/`70ter`
· `EX-DATA-71` · `EX-DATA-72` · `EX-DATA-75`/`76`/`77`/`78`/`79`/`81`/`82` · `EX-DATA-83` ·
`EX-DATA-86` (`C₁`/`C₂`/`C₃` hors clé réservée) · `EX-DATA-88` (seuil 12) · `EX-DATA-90` (seuil 30)
· `EX-DATA-91` (dégénérescence) · `EX-DATA-111` (bornes hautes) · `EX-DATA-117` · `EX-DATA-118` ·
`EX-DATA-119`/`120`/`121` (sentinelles, zone de chaînes) · `EX-DATA-123bis` (export) ·
`EX-NAV-6`/`7` (bornes inclusives, `INCONNU` exclu) · `EX-NAV-8`/`9` · `EX-NAV-10`/`11` (plafond,
refus, message) · `EX-NAV-12`/`13` · `EX-NAV-20` + exception `modelId = 0` · `EX-NAV-21` (4 classes)
· `EX-NAV-22` · `EX-SRCH-1` · `EX-SRCH-1bis` (`ARB-57`) · `EX-SCR-4`/`5`/`6` · `EX-SCR-12` (`P5`/`P95`)
· `EX-SCR-27bis` · `EX-SCR-31` · `EX-SCR-32` · `EX-SCR-33` (paliers, **côté moteur**) · `EX-SCR-109`
· `EX-SCR-113` (#2, #9) · `EX-SCR-115` · `EX-SCR-116` · `EX-SCR-121` · `EX-SCR-124`/`124bis` ·
`EX-SCR-127` · `EX-SCR-128` · `EX-SCR-164`/`203` (mention de méthode) · `EX-NFR-15` (table
équivalente) · `EX-NFR-26` / **R3** · **R2** · **E5**.
Invariants **I1, I2, I4, I5, I8** vérifiés sur six jeux ; **I6** vérifié partiellement (`R-PATHO-07`,
`R-PATHO-16`) ; **I7** non instruit (hors de mon angle).

---

## 5. Points ouverts / tensions instruits — faits établis, sans décision

- **O17 (perf, `EX-NFR-5`)** — fait mesuré : un recalcul **complet non élagué** de 200 000 lignes
  (génération incluse) prend **1,68 s** dans mon environnement. Extrapolation linéaire à 10⁶ ≈
  **8,4 s** (**hypothèse E4** : non mesurée, la mission interdit un banc 10⁶). Cohérent avec le
  chiffre d'O17 (720–985 ms / 100 k). La garantie de D8 (M1/M2 seulement après élagage) tient sur le
  chemin `enterMode2` que j'ai exercé (`integration.test.ts` le prouve déjà) ; la sonde `VOL-50K`
  montre qu'une cellule unique de 50 000 lignes reste traitée en 0,47 s.
- **`ARB-56`, chiffre de référence** — fait mesuré, à substituer au « ≈ 1 720 caractères » du
  rapport 2.2 : les 77 filtres retenus, chacun à une valeur non-défaut plausible, occupent
  **827 caractères** ; en portant **toutes** les énumérations multiples (dont `eq` à 136 valeurs) à
  leur largeur maximale, **1 535 caractères**. Le dépassement du plafond de 2 000 n'est donc pas
  atteignable par les seuls filtres énumérés : il l'est par les champs libres / structurés (`kwd`,
  `mmmv`) — ma sonde `SOL-REFUS` le provoque avec 100 couples marque/modèle. La conclusion
  normative d'`ARB-56` (borner `EX-NAV-18`, ne pas relever le plafond) reste valide ; seule
  l'estimation chiffrée est à corriger.
- **`ARB-12` / `ADV-01`, prémisse à nuancer** — fait établi : la troncature *sous* le domaine
  (`pricefrom=50`, domaine `[500, 100 000]`) **est** rattrapée et signalée par la classe 2
  d'`EX-NAV-21`. Seule la troncature *dans* le domaine (`priceto=25000` → `2500`) reste
  indétectable. La classe de risque déclarée par `ARB-12` est donc plus étroite qu'annoncée — et sa
  contre-mesure unique (le jeton) est à moitié en place (`R-PATHO-13`).
- **`ADV-07` / `ARB-18`, discontinuité 29 → 30** — fait établi : la bascule de méthode est réelle et
  observable (`VAL-BASCULE-29-30`) ; les deux libellés normatifs de méthode existent
  (`methodLabel`). Le **bandeau** « Méthode de score changée… » exigé par `ARB-18` n'a pas d'état
  observable au niveau des modèles de vue que j'ai exercés — instruit sans trancher : il relève
  d'un état de session (comparaison entre deux chargements) que je n'ai pas de moyen d'exercer sans
  DOM.
- **Écran B, en-tête `min – max` (`ARB-19` / `EX-SCR-142`)** — fait établi : la donnée existe
  (`MetricStats.min`/`max`) et le rendu est présent dans `DistributionScreen.tsx:149` avec le
  libellé normatif `du moins cher au plus cher`. **NON VÉRIFIABLE par exécution** dans mon
  périmètre : l'environnement `node` de `vitest.review.config.ts` ne monte pas de composant.
- **`ARB-30` vs source** — tension instruite, non tranchée : `ARB-30`/`EX-SRCH-18bis` désigne
  `damaged_listing` comme le filtre utilisateur d'accidentés, mais le registre le classe `D`
  (désactivé, motif « rejeté par le marketplace belge, `newAccidentFilter = false` »). Si ce motif
  est exact, l'utilisateur n'a **aucun** moyen d'exclure les accidentés une fois `ustate` retiré du
  bandeau (`R-PATHO-14`). Arbitrage nécessaire en 2.6.
- **`unsupported`, dette assumée devenue défaut** — fait établi : le commentaire de
  `src/providers/synthetic/selection.ts` documente honnêtement l'ignorance de certains filtres,
  mais la dette n'a jamais été rendue **visible à l'utilisateur** (`R-PATHO-12`). C'est la
  différence entre une dette et un mensonge affiché.

---

## 6. Résumé (12 lignes)

1. **88 sondes** écrites dans `tests/review/patho/` (7 fichiers + 1 module d'outillage), rejouant de
   bout en bout `DataProvider` → moteur → modèles de vue, sans réseau et sans DOM.
2. **51 cas pathologiques rejoués** (matrice `ST-adversarial` complète + 14 constats BLOQUANTS de
   `ST-complete`/`ST-ambiguity` dont la décision `ARB` est testable).
3. **Conformes : 34 cas.** Volumétrie (0, 1, 100 cellules, 50 000, 200 000), invariants I1/I2/I4/I5/I8
   sur six jeux, `BIN`, corrections d'URL, rafales `R`, `eq` 136, plafond d'URL, R2/R3/E5.
4. **Non conformes : 11 cas** — prix 1 €, prix 10⁷, prix implausible en cellule, km négatif,
   puissance 0, doublons (×3), filtre `T` ignoré, conversion ch→kW, `ustate` exposé.
5. **Partiellement conformes : 4 cas** — `modelId = 0` (outliers), variance nulle (compteur),
   `n = 5..11` à l'écran, lien tronqué (jeton).
6. **Non vérifiables : 2** — en-tête `min – max` de l'écran B et bandeau de bascule M1→M2 (rendu
   composant, environnement `node`) ; budget `EX-NFR-5` sur 10⁶ (extrapolé, hypothèse E4).
7. **17 constats** : **7 BLOQUANT** (`R-PATHO-01`, `-03`, `-09`, `-10`, `-12`, `-15`, `-17`),
   **8 MAJEUR** (`-02`, `-04`, `-06`, `-07`, `-08`, `-13`, `-14`, `-16`), **2 MINEUR** (`-05`, `-11`).
8. Le défaut le plus grave est **cumulatif** : rien n'est posé à l'ingestion (`PRICE_SENTINEL_ABSOLUTE`,
   `PRICE_OUT_OF_RANGE`, `DUPLICATE_VALUE_CONFLICT`, bornes km/puissance) — le moteur, lui, honore
   correctement tous les drapeaux qu'on lui donne.
9. Conséquence démontrée : une fourchette servie à l'écran A vaut **`1 € – 10 000 000 €`** sur un
   jeu de trois annonces dont deux sont saines.
10. Second défaut structurel : un filtre posé peut n'être **jamais appliqué** sans qu'aucun signal
    n'atteigne l'écran (`R-PATHO-12`), et le geste central du parcours 2 (clic sur une barre) n'est
    **pas câblé** (`R-PATHO-17`).
11. Toutes les sondes rouges sont laissées **en échec, sans `skip` ni assertion adoucie** : elles
    sont l'énoncé exécutable de ce que la phase 2.6 doit faire passer.
12. Rapport : **`reports/review/patho.md`** · sondes : **`tests/review/patho/`** · `src/` intact,
    aucun commit.
