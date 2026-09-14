# fix-engine — vague F1 de la phase 2.6

**Agent `fix-engine` (Opus, effort high), 2026-09-08. Worktree `/home/user/kycar-wt/engine`, branche
`fix/engine`.** Périmètre d'écriture : `src/engine/`, `src/worker/`, `src/types/`, `tools/`,
`vite.config.ts`, `package.json`, `tsconfig*.json`, `data/reference/`, plus ce rapport et les sondes
de `tests/review/` explicitement justifiées ci-dessous (D-31).

Mandat : `reports/DEV-REVIEW.md` §3 (toutes les lignes de cluster `fix-engine`), §6.2 pour l'ordre,
et `reports/remediation/FIX-LEAD-DECISIONS.md` D-05, D-08 (côté moteur), D-14, D-17, D-20, D-31,
D-32, D-34.

---

## 0. Résultat en un coup d'œil

| Mesure | Avant | Après |
|---|---|---|
| Sondes de revue rouges (`npm run test:review`, comptage par `it`) | 212 | **177** |
| Sondes passées au vert par ce cluster | — | **38** |
| Sondes nouvellement rouges | — | **3** (toutes hors périmètre d'écriture, §5) |
| Suite par défaut (`npm test`) | 551 | **584 dont 582 verts** (§6) |
| Recalcul FULL non élagué, N = 100 000 | p50 590 ms / p95 **657 ms** | p50 168,3 ms / p95 **187,2 ms** — `EX-NFR-5` TENUE |
| Index retenus à N = 100 000 (`EX-DATA-112`) | **82,0 Mo** | **2,5 Mo** (budget de sonde : ≤ 12,5 Mo) |
| Construction des index | 203 ms | 117 ms |
| Bundle initial mesuré (`npm run size`) | 69,16 Kio (chunk worker INVISIBLE) | 79,58 Kio / 300 Kio, **worker compris** |

---

## 1. Constat → correction → preuve → statut

Les commandes sont lancées depuis le worktree. `RV` abrège
`npx vitest run --config vitest.review.config.ts`.

| # | Constat | Correction (fichiers) | Preuve (commande + extrait) | Statut |
|---|---|---|---|---|
| 1 | **D-34** — `EX-DATA-116` : le balayage élagué et le balayage complet ne rendent pas les mêmes chiffres. `candidateRows` concaténait les tranches d'index marque par marque sans les refusionner en ordre croissant ; les deux chemins sommaient les mêmes valeurs dans un ORDRE différent, `β̂` de M2 différait d'un ulp et l'arrondi à 9 chiffres de `deviationPct` basculait (`24106.360448583` contre `…582`) | `src/engine/scan.ts` : `mergeSortedSlices` rend une liste de lignes globalement croissante (contrôle de frontière, tri numérique `Int32Array.sort()` seulement si nécessaire) | `RV tests/review/D4/pruning-facets-density.test.ts` → avant : `1 failed | 7 passed` ; après : `Tests 8 passed (8)` | **CORRIGÉ** |
| 2 | **DR-002** (BLOQUANT) — la sentinelle RELATIVE `PRICE_IMPLAUSIBLE_IN_CELL` (`prix < 0,10 × médianeRéf(C)`, `n_price(C) ≥ 12`) n'est implémentée nulle part : une annonce à 300 € dans une cellule à 15 000 € tire les barrières M1 et l'ajustement M2 et ressort signalée ; `implausibleInCellCount` n'est pas publié ; `cellCount` inclut les implausibles | `src/engine/implausible.ts` (**nouveau** : ratio 0,10, seuil 12, seuil de la cellule `C₃`), `src/engine/outliers.ts` (`CellSample` par cellule : `V_price(C)` trié → médiane → marquage relatif → barrière M1 sur ce qui reste ; annonce marquée ni évaluée ni signalée, aucun repli vers une cellule plus grossière ; `implausibleInCellIds` et `selectionImplausibleThreshold` publiés), `src/types/entities.ts` (`OutlierVerdict.implausibleInCellCount`) | `RV tests/review/D4/sentinels-eligibility.test.ts` → `✓ R-D4-03 …` et `✓ R-D4-04 — cellCount … (41)` | **CORRIGÉ** pour le périmètre mandaté ; **R-PATHO-03 reste rouge**, voir §3 n° 1 |
| 3 | **DR-008** (BLOQUANT) — aucune conversion d'unité avant évaluation d'un prédicat : `powerType=hp;powerFrom=100` et `powerFrom=100` rendent le même effectif | `src/engine/predicates.ts` : `RangeBoundUnit`, champ `unit` sur un prédicat de plage, `canonicalBounds` convertit par `hpToKw` (symbole unique de `src/types`), **sans arrondi intermédiaire**, et refuse l'unité `hp` sur toute autre colonne. Test de lot **nouveau** `src/engine/predicates.test.ts` | `npx vitest run src/engine/predicates.test.ts` → `Tests 4 passed (4)`, dont « la même borne en chevaux vaut 100 × 0,7355 = 73,55 kW et retient strictement plus de lignes » | **CORRIGÉ côté moteur** ; `R-PATHO-15` passe par `fetchSelectionCount` → exige la moitié `compileSelection` de **fix-providers** (§4) |
| 4 | **DR-032** — `RECALCULATE` sans scope exécute M1/M2 sur la sélection non élaguée, régression M2 à `C₃ = 100 000` lignes comprise ; p95 = 632,7 ms | `src/engine/kernel.ts` : `OUTLIER_UNPRUNED_MAX_ROWS = 25 000`, `outliersSkipped: 'UNPRUNED_SELECTION'` publié sur `RecalcResult`, verdicts vides, `evaluated = 0`, `notEvaluated = priceQuotedCount` (I6 tient) | `RV tests/review/D4/full-100k.test.ts` → `[O17 API] sans scope : pruned=false, verdicts M2@SELECTION=0, M1@SELECTION=0` ; `✓ R-D4-12` | **CORRIGÉ** |
| 5 | **DR-028** (D-05) — une annonce `QUOTED` porteuse de `PRICE_SENTINEL_ABSOLUTE` est comptée éligible au nuage/densité | `src/engine/density.ts` : éligibilité = **prix valide** au sens de D-05 (`QUOTED` ∧ valeur connue ∧ ¬sentinelle absolue ∧ ¬implausible en cellule) | `RV tests/review/D4/sentinels-eligibility.test.ts` → `✓ R-D4-01 … (n_e = 40)` | **CORRIGÉ** |
| 6 | **DR-029** — la ventilation des motifs de non-éligibilité n'est publiée par aucun champ | `src/engine/density.ts` (`IneligibleBreakdown` calculé dans le même passage que la grille, même ordre que l'écran), `src/engine/kernel.ts` (`RecalcResult.ineligible`) | `RV …/sentinels-eligibility.test.ts` → `✓ R-D4-02` ; `RV …/pruning-facets-density.test.ts` → `n_e + noPrice + noYear + noMileage + suspectValue = selectionCount` | **CORRIGÉ** |
| 7 | **DR-030** — le moteur ne publie un verdict que pour les annonces SIGNALÉES : à n = 40, une seule annonce porte `expectedPriceEur`/`deviationPct`/`opportunityScore` | `src/engine/outliers.ts` : un verdict par annonce ÉVALUÉE, `flags` vide si aucune barrière franchie ; l'UUID canonique n'est décodé qu'une fois par annonce | `RV tests/review/D4/thresholds-m1m2.test.ts` → `✓ R-D4-06 (40 annonces avec verdict)` ; `RV tests/review/patho/verite-affichee.test.ts` → `✓ R-PATHO-16` | **CORRIGÉ** ; câblage attendu de **fix-screens** (§4 n° 1) |
| 8 | **DR-031** — `modelId = 0` traité comme un modèle ordinaire : verdicts étiquetés `MODEL_YEAR` sur une clé réservée | `src/engine/outliers.ts` : la clé réservée ne forme ni ne rejoint `C₁`/`C₂` ; l'échelle de repli démarre à `C₃` | `RV tests/review/patho/structure.test.ts` → `✓ R-PATHO-08` | **CORRIGÉ** |
| 9 | **DR-035** — sous variance de prix nulle, M2 déclare 40 annonces « évaluées » sur un MAD de bruit flottant (`pass.s <= 0` ne capte que le zéro exact) | `src/engine/outliers.ts` : le test porte sur la dispersion robuste de la RÉPONSE, relative à `|médiane(y)|` (`M2_SPREAD_EPS = 1e-9`) | `RV tests/review/patho/valeurs.test.ts` → `✓ R-PATHO-07` et `✓ VAL-VARIANCE-0` | **CORRIGÉ** — écart au libellé de DEV-REVIEW justifié §2 n° 3 |
| 10 | **DR-033** — les index retiennent 82 Mo à N = 100 000 (`PK_LISTING` = 100 000 cordes UUID, ≈ 809 o/clé) ; extrapolation ≈ 820 Mo à 10⁶ | `src/engine/uuid.ts` (chaîne PLATE par `String.fromCharCode` sur deux tables d'unités de code ; `parseListingId`, `compareListingIdToBytes`), `src/engine/index-build.ts` (`ListingPrimaryKey` : ordre de lignes trié sur les 16 octets, recherche dichotomique). Test de lot **nouveau** `src/engine/index-build.test.ts` | `RV tests/review/D4/full-100k.test.ts` → `retenu Δ index = 2.5 Mo … 100 000 clés UUID décodées = 6.2 Mo (65 o/clé)` ; `✓ R-D4-13` | **CORRIGÉ** |
| 11 | **DR-019** — le codec ne protège pas les trois séparateurs réservés dans les valeurs : `{keyword:'break', page:'2'}` et `{keyword:'break;page=2'}` partagent un `selectionHash` | `src/types/selection.ts` : `escapeFilterValue`/`unescapeFilterValue` (pourcentage, `%` en premier), appliqués AVANT déduplication, tri et hachage | `RV tests/review/D2/selection-codec.test.ts` → `Tests 9 passed (9)` (`✓ R-D2-03`, `✓ R-D2-04`) | **CORRIGÉ** |
| 12 | **DR-020** — `LISTING_NUMERIC_BOUNDS.modelYear.max = 2101` fige une borne que le dictionnaire lie à `observedAt.year + 1` | `src/types/validation.ts` : `defaultModelYearMax(observedAtYear)`, option `observedAtYear` de `validateListingRecord` | `RV tests/review/D2/dictionary-fields.test.ts` → `✓ R-D2-10` | **CORRIGÉ** |
| 13 | **DR-021** — `listingId` n'est ni contrôlé en forme ni en présence | `src/types/validation.ts` : `LISTING_ID_PATTERN` + code `LISTING_ID_MALFORMED` ; `LISTING_MANDATORY_FIELDS` contrôlés sous l'option `requireMandatory` | `RV …/dictionary-fields.test.ts` → `✓ R-D2-11` ; `npx vitest run src/types/validation.test.ts` | **CORRIGÉ** — présence en opt-in, justifié §2 n° 4 |
| 14 | **DR-022** — aucun contrôle d'hôte sur `listingUrl` | `src/types/validation.ts` : contrôle d'hôte paramétré (`listingUrlDomain`, défaut `autoscout24`), code `LISTING_URL_HOST_UNEXPECTED` | `RV …/dictionary-fields.test.ts` → `✓ R-D2-12` | **CORRIGÉ** |
| 15 | **DR-023** — `countryCode` rattachée à `KYCAR_MARKETPLACE` alors que le champ # 74 est ISO-3166-1 alpha-2 (`L` = Luxembourg en recherche, Liberia en ISO) | `src/types/columns.ts` : `vocabulary: null` (le compte de 27 vocabulaires est préservé) | `RV …/dictionary-fields.test.ts` → `✓ R-D2-13` | **CORRIGÉ** |
| 16 | **DR-024** — `ReferenceData` n'expose aucun index modèle → carrosserie, ni vide ni marqué indisponible (solde d'O15) | `src/types/reference.ts` : `modelsByBodyType` + `bodyTypeIndexAvailable` | `RV tests/review/D2/reference-loader.test.ts` → `✓ R-D2-17` | **CORRIGÉ** |
| 17 | **DR-025** — les étapes 3 et 7 à 10 d'`EX-DATA-29` manquent : les deux fichiers de référence sont absents du dépôt | `data/reference/version-stoplist.json` (**nouveau**, 40 motifs d'`EX-DATA-30` avec leur langue), `data/reference/version-lexicon.json` (**nouveau**, 28 mentions fermées), `src/types/shared-rules.ts` (étape 3 par liste d'arrêt fournie ; `parseModelVersion` = étapes 7 à 10), `src/types/reference.ts` (entrées et sorties `versionStoplist`/`versionDriveBadges`), `src/engine/testkit.ts` (chargement) | `npx vitest run src/types/shared-rules.test.ts` → `Tests 23 passed (23)`, dont « le fichier de référence porte les 40 motifs initiaux et le lexique ses 28 mentions » | **CORRIGÉ pour la part moteur/données** ; consommation à l'ingestion = **fix-providers** (§4 n° 3) |
| 18 | **DR-026** (D-14) — `filters-scope.json` RETIENT `location` (param `zip`, E8), `lat` et `lon` (E11) | `data/reference/filters-scope.json` : les trois passent dans `exclus` avec `exclusion: R3_DONNEE_PERSONNELLE` et leur motif ; `totalRetenus` 77 → 74 ; `src/types/reference.ts` (`RawScopeEntry.exclusion`/`motif`) ; **nouveau** `src/types/r3-sweep.test.ts` = test de balayage exigé par `EX-DATA-49` | `RV tests/review/D2/r3-repository-scan.test.ts` → `✓ R-D2-21` ; `npx vitest run src/types/r3-sweep.test.ts` → `Tests 5 passed (5)` | **CORRIGÉ** ; **action requise de fix-state**, §4 n° 2 |
| 19 | **DR-027** — `scanForbiddenFields` ne lit que les noms de propriété : `{id:'lat', param:'lat'}` traverse le garde | `src/types/validation.ts` : `R3_IDENTIFIER_VALUE_KEYS`, `scanForbiddenIdentifiers`, et le même contrôle intégré à `scanForbiddenFields` (garde ÉLARGI, jamais relâché) | `RV …/r3-repository-scan.test.ts` → `✓ R-D2-22` | **CORRIGÉ** |
| 20 | **DR-036** — `check-bundle-size.mjs` ne parcourt que le graphe du manifest : le chunk du Worker (9,11 Ko gzip), instancié dès `bootstrap()`, n'apparaît sous aucune clé et peut grossir sans faire échouer `npm run size` | `tools/check-bundle-size.mjs` : tout `.js` présent dans `dist/` et absent du manifest est attribué au budget INITIAL et listé nommément | `RV tests/review/D1/bundle-size-guard.test.ts` → `Tests 6 passed (6)` (`✓ R-D1-01`) ; `npm run build && npm run size` → `10.42 KiB assets/aggregation.worker-*.js (hors manifest)` … `budgets: initial 79.58/300 KiB` | **CORRIGÉ** |
| 21 | **DR-034** — ni `GROUPSTAT`, ni `NTILE`, ni paliers, ni indice de dépréciation, ni `R²`, ni `SAMPLE` dans le worker | aucune ligne | — | **DETTE (D-17)** : « aucune valeur affichée fausse, D7 calcule les mêmes valeurs sous budget 78,6 ms p50 / 300 ms ; coût = module moteur complet + protocole. Reportée en 2.7 avec `EX-DATA-83bis` explicitement marquée non tenue. » |
| 22 | **DR-105** — `vin`, `licencePlate`, `belgianCarpassMileageUrl` (E15–E17) absents de `R3_FORBIDDEN_FIELD_NAMES` | aucune ligne | `RV tests/review/D2/r3-guard.test.ts` → `× R-D2-02` (inchangé) | **DETTE (§6.5)** : « `EX-DATA-49` ne cite littéralement que E1–E14 ; l'extension relève du RGPD, pas de R3, et aucun de ces champs n'existe dans le schéma. » |
| 23 | **DR-106** — `canonicalize` trie les PAIRES `id=valeur` au lieu des identifiants | `src/types/selection.ts` : tri sur `ids` avant sérialisation | `RV …/selection-codec.test.ts` → `✓ R-D2-05` | **CORRIGÉ** |
| 24 | **DR-107** — `checkI2` n'itère que sur les agrégats marque : un agrégat modèle orphelin n'est jamais confronté | `src/types/invariants.ts` : contrôle sur l'UNION des marques des deux côtés | `RV tests/review/D2/invariants-mutation.test.ts` → `✓ R-D2-06` | **CORRIGÉ** |
| 25 | **DR-108** — `checkI7` n'itère que sur les indices d'année présents dans les cellules | `src/types/invariants.ts` : itération sur l'union `cells ∪ yearBucketCountByIndex` | `RV …/invariants-mutation.test.ts` → `✓ R-D2-07` | **CORRIGÉ** |
| 26 | **DR-109** — la validation ne relie jamais `priceStatus` à `priceEur` | `src/types/validation.ts` : code `PRICE_STATUS_INCONSISTENT` | `RV tests/review/D2/sentinels-prices.test.ts` → `✓ R-D2-09` | **CORRIGÉ** |
| 27 | **DR-110** — `buildReferenceData` indexe par `file.referenceType` sans le valider | `src/types/reference.ts` : erreur nommée si `referenceType` est vide ou incohérent avec sa clé | `RV tests/review/D2/reference-loader.test.ts` → `✓ R-D2-14` (sonde corrigée, §2 n° 1) | **CORRIGÉ** |
| 28 | **DR-111** — un fichier de référence de forme fausse lève un `TypeError` brut | `src/types/reference.ts` : contrôle `Array.isArray(file.references)` et erreur nommant le fichier et le vocabulaire | `RV …/reference-loader.test.ts` → `✓ R-D2-15` | **CORRIGÉ** |
| 29 | **DR-112** — `data/reference/postal-regions-be.json` n'existe pas ; le mécanisme d'`exceptions` d'`EX-DATA-54` n'existe pas | aucune ligne | `RV …/reference-loader.test.ts` → `× R-D2-16` (inchangé) | **DETTE (§6.5)** : « exige une source externe officielle (Statbel/bpost) que **E5** interdit de collecter en session. La couverture actuelle est exhaustive (9 000 codes, plages disjointes et contiguës) et la dette est visible à l'exécution (`[EXTRAPOLÉ]`). » |
| 30 | **DR-113** — les longueurs maximales du dictionnaire ne sont exprimées par aucune constante | `src/types/validation.ts` : `LISTING_STRING_BOUNDS`, `LISTING_TRIM_TOKENS_MAX`, code `STRING_TOO_LONG` | `RV tests/review/D2/open-points.test.ts` → `✓ R-D2-20` | **CORRIGÉ** |
| 31 | **DR-114** — aucun verdict `INSUFFICIENT_DATA`/`INSUFFICIENT_SPREAD` par annonce ; le vocabulaire gelé ne porte pas ces deux codes | aucune ligne conservée (implémentation écrite puis retirée) | `RV tests/review/D4/thresholds-m1m2.test.ts` → `× R-D4-05` (inchangé) | **NON FAIT**, motif §3 n° 2 |
| 32 | **DR-115** — quand `n_price(C₂) ≥ 30` mais `|F(C₂)| < 30`, le moteur retombe sur `C₃` et publie un verdict M2 `SELECTION` | `src/engine/outliers.ts` : la cellule M2 est celle de la PREMIÈRE RÈGLE SATISFAITE (`n_price`) ; pas de repli vers `C₃` quand `C₂` la satisfait | `RV …/thresholds-m1m2.test.ts` → `✓ R-D4-07` | **CORRIGÉ** |
| 33 | **DR-116** — un `priceStatus` hors vocabulaire traverse le moteur en silence : `quoted+onRequest+missing ≠ N`, le moteur viole son propre I5 | `src/engine/aggregate.ts` (partition exhaustive : tout statut autre que `QUOTED`/`ON_REQUEST` est un prix indisponible), `src/engine/kernel.ts` (`assertPriceStatusVocabulary` au chargement → `WORKER_ERROR` nommé) | `RV tests/review/D4/invariants-mutation.test.ts` → `✓ R-D4-08` ; `Tests 10 passed (10)` | **CORRIGÉ** |
| 34 | **DR-117** — trois demandes concurrentes du même `selectionHash` avant la première réponse déclenchent 3 calculs worker | `src/engine/client.ts` : `Map<hash, Promise>` des recalculs en vol, retirée au règlement (un échec ne se mémorise pas) | `RV tests/review/D4/lru-cache.test.ts` → `✓ R-D4-09` (`3 demandes identiques en vol → 1 appel worker`) | **CORRIGÉ** |
| 35 | **DR-118** — un `kind` inconnu fait `postMessage(undefined)` ; le client lit `undefined.id` | `src/worker/aggregation.worker.ts` : `default` qui lève ; `id` lu en accès optionnel dans le `catch` | `RV tests/review/D4/worker-protocol.test.ts` → `✓ R-D4-10` | **CORRIGÉ** |
| 36 | **DR-119** — `terminate()` vide `pending` sans rejeter : une promesse en vol n'est jamais réglée | `src/worker/client.ts` : rejet nommé de toutes les entrées avant `worker.terminate()` | `RV …/worker-protocol.test.ts` → `✓ R-D4-11` | **CORRIGÉ** |
| 37 | **DR-120** — le rapport de lot ne publie M3 que sur la sélection entière | `src/engine/outliers.groundtruth.test.ts` : promotion de la sonde `EX-DATA-97` (3 cellules > 200) dans la suite du lot | `npx vitest run src/engine/outliers.groundtruth.test.ts` → `Tests 6 passed (6)`, trois lignes `[M3 cellule marque …] |E|=6217 …` | **CORRIGÉ** |
| 38 | **DR-121** — `outlierNotEvaluatedCount` est calculé par soustraction : I6 ne peut jamais échouer | `src/engine/outliers.ts` : comptage explicite des non évaluées (prix hors `V_price`, implausibles en cellule, évaluables non évaluées) | `RV tests/review/D4/invariants-mutation.test.ts` → `✓ I6 — contrôle indépendant` | **CORRIGÉ** |
| 39 | **DR-122** — `MetricStats` publie 10 des 13 valeurs d'`EX-DATA-64` ; `MakeAggregate` ne porte ni `modelCount`, ni `displayRange`, ni `rank` | aucune ligne | — | **DETTE (§6.5)** : « extension d'entités gelées en 2.3 pour des valeurs dérivables au rendu ; le reste est un arbitrage d'interface qui n'a aucun effet visible. » |
| 40 | **DR-012, DR-013** | — | — | **DÉJÀ FAIT** par `fix-foundation` (étape 0), vérifié vert ici |

---

## 2. Sondes modifiées (D-31) — justification exigence par exigence

Cinq fichiers de `tests/review/` ont été touchés. Aucune assertion normative n'a été affaiblie ; les
cinq modifications sont justifiées par une exigence citée.

| Sonde | Modification | Justification |
|---|---|---|
| `tests/review/D2/reference-loader.test.ts › R-D2-14` | La sonde construisait elle-même l'objet pollué avec `[String(index.referenceType)]` — donc littéralement la clé `"undefined"`, puisque le « fait » VERT juste au-dessus établit que `_index.json` ne porte pas de `referenceType` — puis affirmait que cette clé n'existait pas. **Assertion insatisfaisable**, et qui n'exerçait à aucun moment le chargeur. Elle appelle désormais `buildReferenceData` avec la table polluée et attend l'erreur nommée | **DR-110**, colonne « correction attendue » : « valider que chaque entrée porte un `referenceType` non vide cohérent avec sa clé, **avec une erreur nommée** ». L'intention de la sonde (rejet nommé plutôt que clé `undefined`) est conservée telle quelle |
| `tests/review/patho/valeurs.test.ts › VAL-SEUIL-%i` | La valeur « franchement écartée » du jeu d'essai passe de 1 200 € à 4 000 € | À 1 200 € elle tombe SOUS `0,10 × médianeRéf(C) = 1 250 €` et porte donc `PRICE_IMPLAUSIBLE_IN_CELL` (**EX-DATA-19(2)**), ce qui l'exclut de `V_price(C)` et interdit de l'évaluer : la sonde n'aurait plus aucune annonce signalable et mesurerait la sentinelle relative au lieu des paliers 12 / 30 qu'elle vise. Les assertions (paliers, méthodes disponibles, `effectifTier`) sont inchangées |
| `tests/review/D4/pruning-facets-density.test.ts › EX-DATA-102 / I7` | Le recalcul indépendant de `n_e` applique la lecture **D-05** (prix VALIDE : `QUOTED` ∧ ¬sentinelle absolue ∧ ¬`PRICE_IMPLAUSIBLE_IN_CELL`) au lieu de la lecture littérale « statut seul ». Les trois chiffres restent imprimés. Une assertion est AJOUTÉE : la ventilation ferme `selectionCount` | **D-05** amende `EX-DATA-99` (« Éligibilité nuage/densité = prix valide ») ; fix-docs réécrit l'exigence. La sonde encodait la lecture d'AVANT l'amendement |
| `tests/review/D4/full-100k.test.ts` et `src/engine/outliers.groundtruth.test.ts` (rappel M1/M2) | Le rappel est mesuré sur les injectés qui restent ÉVALUABLES (hors `PRICE_IMPLAUSIBLE_IN_CELL`) ; le rappel BRUT reste imprimé à côté | **EX-DATA-19(2)** : un injecté dont le prix tombe sous `0,10 × médianeRéf(C)` est un prix implausible, pas une aberration — il sort de `V_price(C)` et ne peut pas être « retrouvé ». Mesuré : **139 des 283** injectés M1 du dataset D3 sont dans ce cas. Le rappel évaluable est de **100 % (144/144)** pour M1 et **100 % (76/76)** pour M2 en cellules `|F| ≥ 30`. C'est le côté injecteur de **DR-123** (fix-providers), et `DEV-REVIEW` §6.4 n° 6 reporte explicitement la re-mesure du rappel M1 après `DR-038` |
| `tests/review/D8/parcours.test.ts` (parcours 2) | Le rappel de la cellule substitut est mesuré sur les injectés dont le prix reste au-dessus de `0,10 × médiane` de la cellule, recalculée hors moteur dans la sonde | Même justification **EX-DATA-19(2)**. Sur la cellule substitut : 3 injectés dont **1 évaluable**, retrouvé |

**Aucune sonde d'échec n'a eu à être ajoutée au titre de D-32** : les quatre constats visés par D-32
(DR-011, DR-071, DR-072, DR-103) appartiennent à d'autres clusters. Les constats de ce cluster
étaient tous portés par une sonde déjà ROUGE, sauf DR-008 dont la moitié moteur n'était couverte par
aucune sonde exécutable côté moteur : un test de lot neuf (`src/engine/predicates.test.ts`) a été
écrit pour elle, et il échoue bien sur le code d'avant (aucune conversion : `enCh === enKw`).

---

## 3. Points non résolus dans le périmètre, avec leur motif

### 1. `R-PATHO-03` reste rouge — la portée de la sentinelle relative sur les statistiques §B.2

`DEV-REVIEW` cite `R-PATHO-03` (`price.n` = 21 au lieu de 20) parmi les preuves de DR-002. Cette
sonde n'assertionne pas sur les verdicts mais sur `selectionStats.price.n` et `price.min`,
c'est-à-dire sur le bloc statistique §B.2 de la sélection. La correction mandatée par la mission et
par la colonne « correction attendue » de DEV-REVIEW est explicitement **« dans `detectOutliers` »**,
et porte sur `src/engine/outliers.ts` et `src/types/entities.ts`.

J'ai implémenté et **mesuré** l'extension au bloc §B.2 (filtrage de `V_price(Σ)`, des groupes marque
et modèle — obligatoire pour préserver I3 — et de l'histogramme des prix — I4). Résultat mesuré sur
la suite de revue complète : `R-PATHO-03` passe au vert et **cinq sondes vertes tombent** :

- `patho/verite-affichee › VER-ETIQ-A` : `agg.price.min` passe de 119 € à 10 400 € — c'est
  l'exemple littéral d'`ADV-02` (« Opel : 119 € – 289 000 € ») que `ARB-19` traite par l'étiquetage ;
- `D7/histogrammes › somme des barres de G1` et `D4/invariants-mutation › I6 — contrôle indépendant` :
  les deux recalculent `V_price` hors moteur avec la règle ABSOLUE seule ;
- `D4/full-100k › EX-DATA-19 — audit des prix < 250 €` : sonde DOCUMENTAIRE de **DR-001**
  (fix-providers) ; l'exclusion relative masque le défaut qu'elle mesure (`min(V_price)` passe de
  < 250 € à 950 €) ;
- plus la ventilation `suspectValue` mesurée à 2 193 lignes sur 94 084 à N = 100 000 (seuil
  `C₃ = 935 €`).

Le dictionnaire lui-même (§ V_price, table des exclusions) écrit que le terme
`PRICE_IMPLAUSIBLE_IN_CELL(C)` « n'existe que dans un calcul de cellule et **n'a pas de sens au
niveau du snapshot** », ce qui est précisément le cas de `recalculate(FULL:EMPTY)`. J'ai donc retenu
le périmètre mandaté (chemin d'analyse M1/M2 + éligibilité nuage/densité par D-05) et **je m'arrête
sur ce point** : étendre `V_price` de §B.2 à la sentinelle relative est un arbitrage de fix-lead, pas
une correction locale. Il est chiffré ci-dessus, prêt à être tranché.

### 2. `DR-114` non fait — arbitrage D2 manquant et sondes contradictoires

La colonne « correction attendue » commence par « **Arbitrage D2** (ajouter les 2 codes) ». Aucun
arbitrage n'existe dans `FIX-LEAD-DECISIONS.md`. J'ai implémenté puis retiré la correction complète ;
voici ce qu'elle coûte, mesuré :

1. `KYCAR_OUTLIER_FLAG` passe de **6 à 8 codes** — le vocabulaire gelé de D2 avait renommé les quatre
   codes d'`EX-DATA-85` (`M1_LOW`… au lieu de `LOW_PRICE_IQR`…) et ajouté les deux codes d'accord,
   atteignant le même total de 6 SANS les deux codes de non-évaluation. Il faut donc modifier la
   sonde verte `reference-loader › KYCAR_OUTLIER_FLAG = 6` et faire amender §A.1 par fix-docs ;
2. émettre un verdict par annonce non évaluable **contredit quatre sondes vertes** qui exigent
   « aucun verdict » sous n = 12, dont **deux dans le fichier même de `R-D4-05`**
   (`n = 11 : … aucun verdict` et `n = 1..11 : jamais de verdict`) plus `VAL-VARIANCE-0` et
   `VAL-SEUIL-11` de `patho`.

Aucune valeur affichée n'est fausse aujourd'hui : une annonce non évaluable n'est simplement pas
classée. **Statut : NON FAIT**, à trancher par le fix-lead (ajouter les 2 codes et retourner les
quatre sondes, ou consigner en dette).

### 3. Écart assumé sur le libellé de DR-035

DEV-REVIEW propose `s <= 1e-9 · max(1, |médiane(y)|)` sur les RÉSIDUS. Mesuré sur une cellule de 40
annonces au même prix : `s = 9,26e-7` contre un seuil de `9,62e-9` — la **ridge d'EX-DATA-90 pose un
plancher numérique** très au-dessus de tout epsilon relatif appliqué aux résidus, et le test proposé
ne capte donc rien. Le seuil relatif est appliqué à la dispersion robuste de la **réponse**
(`MAD(y)` contre `|médiane(y)|`), qui vaut exactement 0 dans ce cas et qui est ce qu'`EX-DATA-89`
nomme (« au moins la moitié de la cellule au même prix »). `R-PATHO-07` et `VAL-VARIANCE-0` sont
verts.

---

## 4. Ce que les autres clusters doivent savoir

### 1. fix-screens — `OutlierIndex.has()` ne veut plus dire « signalée »

`DR-030` fait publier un `OutlierVerdict` pour **toute annonce évaluée**, `flags` vide quand aucune
barrière n'est franchie. Conséquence directe : `src/screens/outlier-index.ts` indexe désormais toutes
les annonces évaluées, et `DistributionScreen.tsx` l. 98
(`isOutlier: (row) => outlierIndex.has(decodeListingId(...))`) répond « oui » pour toutes.
**À corriger côté fix-screens** : l'appartenance à `A` (`EX-DATA-101`), les sucettes et la colonne
« signalée » doivent tester `flags.length > 0`, pas la présence d'une entrée. Tant que ce n'est pas
fait, **une sonde D7 reste rouge** :
`D7/nuage-g4 › EX-DATA-101 : le code applique le PAS RÉGULIER sur listingId` (`|A|` dépasse `K`, la
3ᵉ branche du pseudo-code n'est plus exercée). La sonde de budget `EX-SCR-189` est repassée verte
d'elle-même après DR-033 (UUID à plat).

Nouveaux champs consommables sans recalcul sur le thread principal :
`RecalcResult.ineligible: { noPrice, noYear, noMileage, suspectValue }` (DR-029, remplace
`computeEligibility`), `RecalcResult.outliersSkipped` (DR-032, motif typé quand M1/M2 sont omis),
`OutlierVerdict.implausibleInCellCount` (DR-002, EX-DATA-87 : « combien d'annonces la cellule a
écartées à ce titre »).

### 2. fix-state — les trois filtres géographiques fins (D-14), action REQUISE

`data/reference/filters-scope.json` ne retient plus `location` (param `zip`), `lat` ni `lon`
(77 → 74 retenus). D-14 attribue à fix-state le retrait des trois du registre. **Tant que ce n'est
pas fait :**

- `src/state/filter-registry.test.ts` — 2 tests ROUGES de la suite par défaut :
  « porte exactement les 77 filtres retenus » (attendu 74) et « résout les dépendances (paramètres) »
  (`radius` déclare `dependencies: ['zip']`, qui ne se résout plus) ;
- `tests/review/D5/…` — 2 sondes rouges de même cause.

Correction attendue : retirer les trois entrées de `src/state/filter-registry.ts`, porter le compte à
**74** dans son test, et décider du sort de la dépendance `zip` de `radius` (un rayon sans point de
départ n'a plus d'objet — le retrait de `radius` est cohérent avec « aucun filtre géographique fin en
2.6 », mais il n'est pas ordonné par D-14 et je ne l'ai pas fait).

### 3. fix-providers

- **DR-008** : `compileSelection` doit convertir la borne de puissance avec le MÊME symbole
  `hpToKw` (`src/types`), sans arrondi intermédiaire. Côté moteur, un prédicat de plage porte
  désormais `unit?: 'canonical' | 'hp'` (`src/engine/predicates.ts`). `R-PATHO-15` ne passera au vert
  qu'avec cette moitié.
- **DR-025** : `cleanModelVersion(raw, { stoplist })` applique l'étape 3 dès que la liste d'arrêt
  versionnée lui est fournie ; `parseModelVersion(raw, { stoplist, tokenStoplist, driveBadgeLexicon })`
  rend `trimTokens`, `badgeDisplacementL`, `badgePower` et `driveBadges`. Les deux référentiels sont
  dans `data/reference/` et exposés par `ReferenceData.versionStoplist` / `versionDriveBadges`. Le
  contrôle d'écart de 10 % et `VERSION_POWER_MISMATCH` (étape 9) relèvent de l'ingestion, qui seule
  connaît `powerKw`.
- **DR-123 / DR-038, constat neuf et chiffré** : les outliers bas injectés à `fair × [0,14 ; 0,24]`
  avec plancher 300 € tombent, pour **139 des 283** injectés M1, SOUS `0,10 × médianeRéf` de leur
  cellule. Au sens d'`EX-DATA-19(2)` ce sont des prix implausibles, pas des aberrations : aucun
  détecteur ne peut ni ne doit les retrouver. L'injecteur doit placer les outliers bas **au-dessus**
  de `0,10 × médiane de la cellule` pour que la vérité terrain reste mesurable.
- `AggregationDataset` REFUSE désormais un lot dont une ligne porte un `priceStatus` hors
  `KYCAR_PRICE_STATUS` (DR-116) : le générateur doit n'émettre que `QUOTED`/`ON_REQUEST`/`MISSING`.

### 4. fix-app

- `RecalcResult` porte trois champs neufs (`ineligible`, `outliersSkipped`, et `m3` inchangé) ; ils
  traversent le protocole worker sans modification de `src/worker/messages.ts`.
- **DR-032** : quand `outliersSkipped === 'UNPRUNED_SELECTION'`, `outlierVerdicts` est vide **par
  construction** et non parce qu'il n'y a pas d'aberration — l'écran doit le dire (le motif est typé
  et publié). Le seuil est `OUTLIER_UNPRUNED_MAX_ROWS = 25 000` (`src/engine/kernel.ts`).
- `AggregationEngine.recalculate` coalesce les demandes en vol (DR-117) ; `terminate()` rejette
  désormais les promesses en vol (DR-119), ce qui rend `dispose()`/`enterMode2()` observables.

### 5. fix-docs

- `EX-DATA-99` : lecture D-05 (« prix valide ») à écrire ; la ventilation `noPrice`/`noYear`/
  `noMileage`/`suspectValue` est désormais publiée par le moteur.
- §A.1, ligne `KYCAR_OUTLIER_FLAG` : le compte de 6 est atteint SANS `INSUFFICIENT_DATA` ni
  `INSUFFICIENT_SPREAD`, que `EX-DATA-85` nomme pourtant — à porter à 8 si le fix-lead tranche
  DR-114 (§3 n° 2).
- Champ # 74 `countryCode` : la colonne ne porte plus de vocabulaire nommé (DR-023) ; le décodage
  s'adosse à `references/Country.json`, hors des 27 vocabulaires.
- `EX-DATA-30` : la liste d'arrêt est désormais un fichier versionné du dépôt
  (`data/reference/version-stoplist.json`, 40 motifs) — la phrase « les six dernières entrées » ne
  correspond pas au décompte (huit entrées sont des amorces de coordonnées de contact) ; le fichier
  marque chaque entrée `kind: promo | contact` plutôt que de figer un rang.

---

## 5. Sondes nouvellement rouges (3), toutes hors périmètre d'écriture

| Sonde | Cause | Qui corrige |
|---|---|---|
| `D7/nuage-g4 › EX-DATA-101 : PAS RÉGULIER sur listingId` | `DR-030` : `OutlierIndex.has()` répond « évaluée », pas « signalée » ; `A` dépasse `K` | **fix-screens** (§4 n° 1) |
| `D5 › les 77 filtres RETENUS sont tous présents dans le registre` | `DR-026` / D-14 : le périmètre retenu passe à 74 | **fix-state** (§4 n° 2) |
| `D5 › le registre n'ajoute aucun filtre hors périmètre` | idem | **fix-state** |

---

## 6. Vérifications finales

```
npx tsc --noEmit -p tsconfig.json          → 0 erreur
npx tsc --noEmit -p tsconfig.worker.json   → 0 erreur
npx tsc --noEmit -p tsconfig.review.json   → 0 erreur
npx eslint src tests tools                 → 0 problème
npm run build                              → 0 erreur, 0 warning
npm run size                               → initial 79.58/300 KiB gzip (chunk worker COMPRIS), OK
npm test                                   → Test Files 51 passed | 1 failed (52)
                                             Tests 582 passed | 2 failed (584)
                                             les 2 échecs = src/state/filter-registry.test.ts (§4 n° 2)
npm run test:review                        → 177 rouges (212 avant), 38 sondes passées au vert
npm run test:perf                          → 7 tests verts, chiffres ci-dessous
```

Suite par défaut : **551 → 584 tests** (+33 : `predicates.test.ts` 4, `index-build.test.ts` 4,
`r3-sweep.test.ts` 5, `validation.test.ts` +7, `selection.test.ts` +4, `shared-rules.test.ts` +8,
`outliers.groundtruth.test.ts` +1). Aucun test existant de la suite par défaut n'a vu une assertion
affaiblie ; les deux seuls échecs sont ceux que D-14 confie à fix-state.

### Banc de performance (`npm run test:perf`, une seule exécution, N = 100 000)

| Mesure | Avant (rapport D4 / DEV-REVIEW) | Après |
|---|---|---|
| Recalcul FULL non filtré, 100 exécutions | p50 590 ms · **p95 657 ms** · cible NON tenue | p50 168,3 ms · **p95 187,2 ms** · max 205,3 ms · **cible `EX-NFR-5` TENUE** |
| Premier effectif retenu au-delà de 200 ms (banc O17) | 44 186 lignes | **93 397 lignes** |
| Recalcul d'une sélection élaguée (marque la plus peuplée, m = 6 623) | p50 28,2 ms · p95 37,1 ms | p50 32,0 ms · p95 37,0 ms |
| Facettes différées (8 filtres) | ≤ 100 ms | p50 19,2 ms · p95 20,5 ms |
| Construction des index | 203 ms | **117 ms** |
| Mémoire retenue par les index | **82,0 Mo** | **2,5 Mo** |

L'effet de la garde DR-032 est net sur le chemin non élagué (657 → 187 ms p95) et **nul sur le chemin
élagué**, qui est le chemin nominal du mode 2 : la garde ne s'y applique jamais (`pruned === true`).
Le léger surcoût du chemin élagué (28,2 → 32,0 ms p50) vient de DR-030 (un verdict par annonce
évaluée, soit ≈ 6 600 verdicts au lieu de ≈ 40 sur la plus grosse marque) ; il est compensé par le
décodage d'UUID à plat de DR-033 et reste à 37 ms au p95, très en deçà des 200 ms.

---

## 7. Commits

| SHA | Message |
|---|---|
| `29bddf3` | Phase 2.6 (D-34): merge pruned index slices in canonical row order |
| `415fae8` | Phase 2.6 (DR-002): relative price sentinel PRICE_IMPLAUSIBLE_IN_CELL in the outlier detector |
| `92561da` | Phase 2.6 (DR-008): convert a power bound to the canonical unit before compiling the predicate |
| `9c1cdd1` | Phase 2.6 (DR-032): guard M1 and M2 behind pruning or a row ceiling |
| `658a6df` | Phase 2.6 (DR-028, DR-029): scatter and density eligibility is a valid price, with the reasons broken down |
| `448cc08` | Phase 2.6 (DR-030, DR-031, DR-035): a verdict per evaluated listing, reserved model key starts at C3, relative spread test |
| `72ca722` | Phase 2.6 (DR-033): PK_LISTING as a sorted row index, and flat uuid decoding |
| `a75f4f9` | Phase 2.6 (DR-019, DR-106): escape the reserved separators and sort filters by identifier |
| `873ab15` | Phase 2.6 (DR-020..023, DR-027, DR-109, DR-113): dictionary controls the validator was missing |
| `4db9ccd` | Phase 2.6 (DR-024, DR-025, DR-026, DR-110, DR-111): body type index, version pipeline data, and the three fine geo filters |
| `cf7311e` | Phase 2.6 (DR-036): the bundle guard counts the chunks shipped outside the manifest graph |
| `6378286` | Phase 2.6 (DR-107, DR-108, DR-115..DR-121): invariants with teeth, cell choice, protocol and cache |

Rien n'est poussé : le push relève du coordinateur (`CLAUDE.md` §1.3).
