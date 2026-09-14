# fix-engine-2 — vague F3 de la phase 2.8

**Agent `fix-engine-2` (Opus, effort high), 2026-09-08. Worktree `/home/user/kycar-wt/engine2`,
branche `fix28/engine2`, partie de `feb90aa`.** Mandat : `FIX-LEAD-DECISIONS-2.8.md` §E — **D8-30**
(résidu `DR-122` : `MetricStats.iqr` / `MetricStats.coverage`) et **D8-31** pour la part
`EX-DATA-23` (parsing de `firstRegistrationYearMonth`), sous **D8-19** (sondes modifiées) et
**D8-33** (ne pas commiter `reports/e2e/results.json`).

Entrées lues : `CLAUDE.md`, `docs/plans/REVIEW-PROTOCOL.md`, `FIX-LEAD-DECISIONS-2.8.md` §A/§B/§E,
`reports/REMEDIATION-2.8.md` §7.1 points 1 et 3 et §7.2 point 4, `reports/remediation-2.8/fix-engine.md`
§6.4 et `fix-providers.md` §2 (le résidu que chacun a renvoyé à l'autre),
`docs/requirements/draft-data-dictionary.md` `EX-DATA-22`/`23` (l. 315-334), `EX-DATA-61`/`61bis`
(l. 849-870), `EX-DATA-64` (l. 897-914), `EX-DATA-68` (l. 945), et l'interface gelée
`src/providers/DataProvider.ts` (via `src/types/entities.ts`, type `MetricStats`).

Périmètre d'écriture respecté : `src/engine/`, `src/types/`, `tests/review/D2/`, `tests/review/D4/`
et ce rapport. **Aucune écriture** dans `src/providers`, `src/screens`, `src/state`,
`src/components`, `src/app*`, `src/worker/` (rien n'y était à changer, voir §2.4), `docs/`,
`tests/e2e/`, ni dans `reports/e2e/results.json`. Aucun réseau (E5), aucun compte (E1), aucune
question posée (E3), toute hypothèse écrite comme telle (E4), aucun champ vendeur identifiant (R3).
Rien n'est poussé (CLAUDE.md §1.3).

Identité git du worktree vérifiée : `benitognt@gmail.com` / `Benito Giunta`.

---

## 1. Résumé

| Point | Décision | État | Preuve |
|---|---|---|---|
| `MetricStats.iqr` et `MetricStats.coverage` publiés `null` | **D8-30** | **CORRIGÉ** | `R-D4-2.8-01…04` : **11 rouges sur 14** avant, **14 vertes** après |
| `EX-DATA-23` — parsing de `firstRegistrationYearMonth` | **D8-31** | **CORRIGÉ** (la règle n'existait dans aucun module) | `R-D2-2.8-01…03` : **12 rouges sur 12** avant, **12 vertes** après |

Deux commits, dans l'ordre :

| Commit | Objet | Fichiers |
|---|---|---|
| `6c1b548` | D8-30 — calcul d'`iqr` et de `coverage` | `src/engine/quantiles.ts`, `src/engine/aggregate.ts`, `tests/review/D4/metric-stats-iqr-coverage.test.ts` (nouveau), `tests/review/D4/quantiles-bin.test.ts` (amendée) |
| `426b32b` | EX-DATA-23 — parsing sans tolérance | `src/types/shared-rules.ts`, `src/types/index.ts`, `tests/review/D2/first-registration-parsing.test.ts` (nouveau) |

---

## 2. Point 1 — D8-30 : `MetricStats.iqr` et `MetricStats.coverage` (`EX-DATA-61`, `EX-DATA-64`)

### 2.1 Constat repris et vérifié à l'arrivée (`feb90aa`)

`grep -n 'iqr:' src/engine/quantiles.ts` → quatre littéraux `null` (l. 106, 137, 180, 255), dont un
commentaire qui désignait nommément les deux agents. `fix-providers.md` §2 établit que `MetricStats`
n'est produit par **aucun** provider (`grep -rn MetricStats src/providers` = 0) : les adaptateurs
publient `MetricRange`. Vérifié de mon côté par `grep -rn "stdDev" src/ --include=*.ts` : hors la
déclaration du type (`src/types/entities.ts` l. 176), **`src/engine/quantiles.ts` est le seul module
du dépôt qui construise un `MetricStats`** — trois sites (`metricStatsFromCounts`, la constante
`EMPTY_STATS`, `exactStatsBySort`). Le résidu était donc entièrement dans mon périmètre.

Conséquence produit : `EX-DATA-64` publiait 10 valeurs sur 13 (`§7.2` point 4 : `count` est porté par
le conteneur `SelectionStats.selectionCount`, ratifié par `D8-32(4)`) ; `EX-DATA-61` — « toute
statistique publiée est accompagnée de trois nombres inséparables : la valeur, son effectif `n_m`, et
sa couverture » — n'était tenue qu'à deux tiers sur la sélection.

### 2.2 Sonde d'échec, écrite d'abord (D-31 / D-32)

`tests/review/D4/metric-stats-iqr-coverage.test.ts` — identifiants `R-D4-2.8-01` à `R-D4-2.8-04`,
14 cas.

| Sonde | Ce qu'elle exige |
|---|---|
| `R-D4-2.8-01` | `iqr = q3 − q1` sur `{10,20,30,40,50}` (q1 = 20, q3 = 40, iqr = 20) ; `iqr = 0` à `n = 1` (valeur réelle, pas un inconnu) ; identité sur le chemin de **tri comparatif** (domaine creux) ; `null` à `n = 0` |
| `R-D4-2.8-02` | `coverage = round₄(n/N)` : 5/8 = 0,625 ; 1/3 = **0,3333** ; 2/3 = **0,6667** (arrondi au plus proche, pas troncature) ; `n = N` → 1 ; `n = 0, N ≥ 1` → **0** ; `N` omis → `null` ; `N = 0` → `null` |
| `R-D4-2.8-03` | même contrat sur `metricStatsFromCounts` (comptages à trous : q1 = 11,5, q3 = 14, iqr = 2,5, coverage = 0,8) |
| `R-D4-2.8-04` | bout en bout par le protocole du moteur (`AggregationDataset.recalculate`) : `N` vaut `SelectionStats.selectionCount` (40) et non le total du snapshot ; `price.coverage = 0,8` à `n = 32` ; **cohérence avec `GroupStatEntry`** (`R-D8-07-01`) sur un jeu bâti pour que la sélection forme un GROUPE UNIQUE : même `iqr`, même rapport `n/N` |

**Rouge avant la correction** (`npx vitest run --config vitest.review.config.ts --no-file-parallelism
tests/review/D4/metric-stats-iqr-coverage.test.ts`, sur `feb90aa` + la seule sonde) :

```
 ❯ tests/review/D4/metric-stats-iqr-coverage.test.ts (14 tests | 11 failed) 26ms
   AssertionError: expected null to be 20   // Object.is equality   (R-D4-2.8-01, iqr)
   AssertionError: expected null to be 0.625                        (R-D4-2.8-02, coverage)
   AssertionError: expected null to be 3875                         (R-D4-2.8-04, selectionStats.price.iqr)
   AssertionError: expected 3875 to be close to null                (R-D4-2.8-04, cohérence GroupStatEntry)
 Test Files  1 failed (1)
      Tests  11 failed | 3 passed (14)
```

Les **3 cas verts avant** sont ceux qui exigent `null` : `iqr` à `n = 0`, `coverage` à `N` omis, et
`coverage` à `N = 0`. Ce sont des preuves de conformité (le défaut ne les faisait pas échouer, ce qui
est précisément pourquoi le défaut a survécu à 2.5 et à 2.6) ; elles sont conservées telles quelles.

**Vert après** : `Test Files 1 passed (1) · Tests 14 passed (14)`.

### 2.3 Correction

`src/engine/quantiles.ts` :

1. Deux fonctions privées nouvelles : `coverageOf(n, selectionCount)` — `null` si `N` est
   `null`/omis/`< 1`, sinon `round₄(n/N)` — et `emptyStats(selectionCount)`, qui remplace la
   constante `EMPTY_STATS` (une constante ne pouvait pas porter un `coverage` dépendant de `N`).
2. `metricStatsFromCounts` : `iqr: p75 − p25` sur les **mêmes** variables que les deux quantiles
   publiés (`p25` et `p75` sont extraits en constantes locales), et `coverage: coverageOf(n, N)`.
   Recalculer les quantiles une seconde fois aurait ouvert la porte à deux valeurs divergentes pour
   la même statistique.
3. `exactStatsBySort` : les deux mêmes expressions, pour que les **deux réalisations exactes du même
   tri** (comptage / tri comparatif) rendent le même bloc de treize valeurs — c'est l'invariant que
   la sonde `R-D4-2.8-01` vérifie sur un domaine creux.
4. Paramètre `selectionCount?: number | null` ajouté **en dernière position** sur
   `metricStatsFromCounts`, `exactMetricStats` et `exactStatsBySort`. Optionnel : aucun appelant
   existant ne casse, et l'absence de `N` reste une réponse honnête (`coverage: null`) plutôt qu'un
   chiffre inventé.

**Choix d'arrondi, motivé.** `coverage` est arrondie à 4 décimales **dans le calcul**, alors
qu'`EX-DATA-63` interdit l'arrondi intermédiaire des quantiles. Ce n'est pas une contradiction :
`EX-DATA-61` énonce l'arrondi dans la **définition** de la grandeur (« sa couverture
`coverage_m = n_m / N` arrondie à 4 décimales »), et la table d'`EX-DATA-64` la donne « définie si
`N ≥ 1` », colonne « 4 décimales ». Le dépôt arrondit déjà de la même façon deux taux voisins :
`DistributionBucket.share` (`src/engine/bin.ts` l. 178, `Math.round(x * 1e4) / 1e4`) et
`evalCoverage` (`src/engine/outliers.ts` l. 974). Trois taux publiés côte à côte ne peuvent pas être
arrondis de trois manières. **Hypothèse (E4)** : si le commanditaire voulait la valeur brute et
l'arrondi à la seule présentation, un seul point du code change (`coverageOf`) et la sonde
`R-D4-2.8-02` dit exactement quelles valeurs bougent.

**`n = 0` avec `N ≥ 1` → `coverage = 0`, pas `null`.** Retenu tel que le proposait `fix-providers.md`
§2 point 2 : `0 / N` est parfaitement défini, et un `null` y serait un second inconnu pour une
division qui n'en est pas un. `iqr`, lui, reste `null` à `n = 0` (`EX-DATA-64` : « défini si `n ≥ 1` »).

### 2.4 Appelants vérifiés pour `N` (la question du dénominateur)

`grep -rn "metricStatsFromCounts\|exactStatsBySort\|exactMetricStats\|iqr:" src/` — inventaire complet
des sites, et ce qui a été fait de chacun :

| Site | `N` disponible ? | Décision |
|---|---|---|
| `src/engine/aggregate.ts` l. 249-251 (`priceStats`, `yearStats`, `mileageStats`) | **oui** : la variable `n` du balayage, publiée telle quelle en `AggregateOutput.selectionCount` puis en `SelectionStats.selectionCount` (`src/engine/kernel.ts` l. 275) | `exactMetricStats(sel…, n)` — les trois métriques partagent le dénominateur `\|Σ\|`. Commentaire posé dans le code : ce n'est ni le total du snapshot, ni `priceQuotedCount` |
| `src/engine/aggregate.ts` l. 71 `metricRangeFromValues` (agrégats marque et modèle) | oui (`g.listingCount`) mais **sans effet observable** | **`N` non passé**, et documenté dans le code : `toMetricRange` ne retient que `min`/`max`/`p05`/`p50`/`p95`/`n`, l'entité **gelée** `MetricRange` n'ayant ni `iqr` ni `coverage`. Publier la couverture d'un agrégat marque/modèle exigerait d'amender `DataProvider.ts` — interdit (voir §4) |
| `src/engine/index.ts` l. 106-107 | ré-export seul | inchangé ; le paramètre optionnel ne casse aucun consommateur |
| `src/worker/` | — | **aucune construction de `MetricStats`** : le worker publie le `RecalcResult` du noyau (`grep -rn "stdDev" src/worker` = 0). Les statistiques D8-07 (`GroupStatEntry`, `CellStat`, `NtileSlice`, paliers) ont leurs **propres** entités dans `src/engine/stats-protocol.ts` et n'utilisent pas `MetricStats` : `groupStats` et `cellStats` n'ont donc rien reçu |
| `src/engine/group-stats.ts` l. 259-290 (`entryOf`) | oui (`bucket.listingCount`) | **inchangé** : `GroupStatEntry.iqr` et `.coverage` étaient déjà calculés (D8-07) et leur dénominateur est `listingCount(G_v)` — le groupe, pas la sélection —, ce qu'exige `EX-DATA-61` appliquée au groupe. Voir la réserve §6 point 2 sur son arrondi |
| `src/engine/outliers.ts` l. 196 (`iqr` de la cellule M1) | — | grandeur différente (l'IQR de la cellule d'outliers), déjà calculée, hors D8-30 |
| `src/screens/…`, `tests/review/D7/…` | — | littéraux de fixtures, hors périmètre |

### 2.5 Sonde existante modifiée — justification (D-31, obligatoire)

`tests/review/D4/quantiles-bin.test.ts`, cas « `n = 0` : bloc entièrement nul » (l. ~45-51).

- **Ce que la sonde figeait.** Son `toEqual` compare l'entité `MetricStats` ENTIÈRE, `iqr: null` et
  `coverage: null` compris. Le fix-lead (`D8-30`) et `REMEDIATION-2.8` §7.1 l'ont désignée comme
  figeant le défaut, et son amendement « dans le même commit » a été explicitement demandé.
- **Vérification faite avant de la toucher.** Le `toEqual` porte sur `exactMetricStats([])`, donc
  `n = 0` **et** `N` inconnu : après la correction, `iqr: null, coverage: null` reste la réponse
  **juste et normative** (`EX-DATA-64` : `iqr` défini si `n ≥ 1`, `coverage` si `N ≥ 1`). La sonde
  **repasse verte sans modification**. Elle ne bloquait donc pas la correction ; elle était
  seulement **aveugle** — elle ne disait rien pour `n ≥ 1`, ce qui est exactement l'espace où les
  quatre littéraux `null` ont survécu à deux phases de revue.
- **Ce que j'ai fait, et ce que je n'ai pas fait.** **Aucune assertion n'est affaiblie, aucune n'est
  supprimée** : le `toEqual` d'origine est conservé au caractère près. J'ai ajouté (a) un
  commentaire qui dit ce que ce cas prouve et ce qu'il ne prouve pas, et (b) **un cas voisin**,
  `exactMetricStats([], 25)`, qui exige `coverage: 0` — le cas que le `toEqual` d'origine ne pouvait
  pas voir. La sonde est donc **renforcée**, pas relâchée.
- Aucune autre sonde du dépôt n'a été modifiée. `grep -rn "iqr" tests/` : les seules autres
  occurrences sont des fixtures `GroupStatEntry` de D7 et `R-D8-07-01`, toutes intactes et vertes.

### 2.6 `EX-NFR-5` — non-régression de performance

`npx vitest run --config vitest.perf.config.ts` (une seule exécution, dans mon worktree) :

```
[perf recalc élagué] plus grande marque (m=9283) : p50=79.6ms p95=94.7ms max=118.0ms
[perf facettes] 8 filtres : p50=18.9ms p95=21.5ms
[EX-NFR-7] points=5000 p50=1.24ms p95=3.19ms
[EX-NFR-8] frames=7872 windows=91 failing=0 okRatio=100.0%
 Test Files  2 passed (2) · Tests  7 passed (7)   (42,70 s)
```

Le budget `EX-NFR-5` (p95 < 200 ms à 100 000 lignes) est tenu, y compris le cas `FULL` (pire cas non
filtré) qui est vert. Attendu : la correction ajoute **deux soustractions et une division par bloc**,
soit `O(1)` par `MetricStats`, à raison de trois blocs par recalcul.

---

## 3. Point 2 — `EX-DATA-23` : parsing de `firstRegistrationYearMonth` (D8-31)

### 3.1 Constat — la sonde n'était pas « une couverture manquante », la règle était absente

Contrôle de 2.7 rejoué : `grep -rln FIRST_REG_UNPARSEABLE tests/ src/` → **une seule occurrence**,
`src/types/vocabularies.ts` l. 173 (la déclaration du vocabulaire). Élargi :
`grep -rn "firstRegistrationDate\|year-month\|MM/YYYY\|YYYY-MM" src/` → **aucun module ne parse la
date de première immatriculation**. La mission supposait le parsing présent dans
`src/types/shared-rules.ts` : il n'y était pas (les exports du module étaient
`PRICE_SENTINEL_ABSOLUTE_EUR`, `isPriceSentinelAbsolute`, `HP_TO_KW`, `hpToKw`, `listingKey`,
`DUPLICATE_CONFLICT_FIELDS`, `cleanModelVersion`, `parseModelVersion` et leurs constantes).

**Ce n'est donc pas une couverture manquante comblée : c'est une exigence non implémentée.** La
sonde est rouge du premier coup pour la meilleure des raisons — la fonction n'existe pas.

### 3.2 Sonde d'échec, écrite d'abord

`tests/review/D2/first-registration-parsing.test.ts` — identifiants `R-D2-2.8-01` à `R-D2-2.8-03`,
12 cas, couvrant exactement la liste de la mission et un peu plus.

| Sonde | Cas |
|---|---|
| `R-D2-2.8-01` | `2015-01` et `03/2021` (les deux formes, dans l'ordre d'essai) ; les deux formes du même mois donnent la même chaîne de **7 caractères** et le même encodage colonnaire `12·y + (m−1)` ; les 12 mois valides sous les deux formes |
| `R-D2-2.8-02` | refus de `2024-00`, `2024-13`, `00/2024`, `13/2024`, `05/24`, `24-05`, `2024/05`, `05-2024`, `2024-5`, `5/2024`, chaîne **vide**, `' 2024-05 '`, `2024-05-17`, `inconnu` — chacun : `yearMonth === null`, `encoded === NUMERIC_UNKNOWN`, `unparseable === true`, drapeau posé. Plus le cas **champ absent** (`null`/`undefined`) : INCONNU **sans** drapeau |
| `R-D2-2.8-03` | le drapeau est bien celui de la table bit ↔ code (`INGEST_FLAG_BIT.FIRST_REG_UNPARSEABLE === 12`, masque `1 << 12`, `ingestFlagCodes` rend exactement `['FIRST_REG_UNPARSEABLE']`), le masque d'entrée est **préservé** (le drapeau s'ajoute à `ENUM_UNKNOWN` + `MILEAGE_OUT_OF_RANGE` sans les écraser), et une forme valide laisse le masque **strictement inchangé** |

**Rouge avant** : `Tests 12 failed (12)` — `TypeError: parseFirstRegistrationYearMonth is not a function`.
**Vert après** : `Test Files 1 passed (1) · Tests 12 passed (12)`.

### 3.3 Correction — `src/types/shared-rules.ts` (et lui seul, plus son ré-export)

Section 6 nouvelle : `parseFirstRegistrationYearMonth(raw, ingestFlags = 0)` →
`ParsedFirstRegistration { yearMonth, year, month, encoded, unparseable, ingestFlags }`.

- Les deux motifs sont **ancrés** et le mois y est **énuméré** : `^(\d{4})-(0[1-9]|1[0-2])$` puis
  `^(0[1-9]|1[0-2])\/(\d{4})$`. « Aucune tolérance » est ainsi écrit **dans l'expression**, et non
  laissé à une vérification ultérieure qu'un appelant pourrait oublier : `00`, `13`, un mois sur un
  chiffre et une année sur deux chiffres ne peuvent pas traverser.
- **Le résultat porte à la fois la valeur et le drapeau** (`ingestFlags` reçu, augmenté de
  `FIRST_REG_UNPARSEABLE` par `setIngestFlag`, jamais muté en place). C'est délibéré : l'écart de
  2.7 était précisément qu'une valeur INCONNU pouvait être posée sans le drapeau. Avec cette forme,
  un chemin d'ingestion ne peut pas les dissocier.
- `encoded` rend la forme **colonnaire** `12·année + (mois − 1)`, celle de la colonne `Int32`
  `firstRegistrationYearMonth` (`src/types/columns.ts` l. 73 ; encodage confirmé par
  `src/providers/synthetic/generate.ts` l. 883 et le décodage `Math.floor(ym / 12)` de
  `src/providers/synthetic/selection.ts` l. 289), ou `NUMERIC_UNKNOWN` (`EX-DATA-120`).
- Le contrôle de **bornes** de l'annexe A (`1900-01 ≤ v ≤ (observedAt.year+1)-12`, drapeau
  `FIRST_REG_OUT_OF_RANGE`) n'est **pas** fait ici : c'est un étage de validation distinct, porté par
  `src/types/validation.ts` et les adaptateurs, sur une valeur déjà lue. Les deux étages restent
  séparés, comme leurs deux drapeaux.
- `src/types/index.ts` ré-exporte la fonction et le type, pour que les providers puissent la brancher
  sans importer un chemin profond.

**Deux hypothèses, écrites comme telles (E4), toutes deux dans le commentaire de la fonction :**

1. **Champ absent (`null` / `undefined`) → INCONNU SANS drapeau.** `EX-DATA-23` ne parle que des
   *formes reçues* ; l'annexe A champ 30, colonne « Si absent », dit « INCONNU » sans réclamer de
   drapeau. Drapeauter une absence rendrait `FIRST_REG_UNPARSEABLE` indiscernable de
   « champ optionnel non servi », donc muet.
2. **Chaîne VIDE → INCONNU AVEC drapeau.** La source a émis le champ ; sa valeur est illisible.
   C'est la lecture que la mission demandait de couvrir et elle est sondée explicitement.
3. Corollaire assumé : `' 2024-05 '` (espaces d'encadrement) est **refusé**. Un `trim` silencieux
   transformerait « aucune tolérance » en « une tolérance non écrite ». Sondé explicitement, pour
   que le choix soit visible et réversible en une ligne s'il devait être tranché autrement.

---

## 4. Effets sur l'interface gelée — aucun

Aucune signature de `src/providers/DataProvider.ts` n'est touchée ; le fichier n'est pas ouvert en
écriture. `iqr` et `coverage` **existaient déjà** dans le type `MetricStats` (`src/types/entities.ts`
l. 166-188, posés par fix-foundation à l'étape 0 sous `D8-10`) : la vague F3 ne fait que **calculer**
ce que l'entité publiait déjà. Les trois signatures modifiées (`metricStatsFromCounts`,
`exactMetricStats`, `exactStatsBySort`) sont **internes au moteur** et le paramètre ajouté est
**optionnel**, donc rétro-compatible.

**Un point où j'ai cru devoir changer une signature — et ne l'ai pas fait** : `MakeAggregate` et
`ModelAggregate` portent des `MetricRange` (`min`/`max`/`p05`/`p50`/`p95`/`n`), alors qu'`EX-DATA-68`
décrit « bloc statistique complet (EX-DATA-64) … 3 × 13 valeurs ». Publier `iqr` et `coverage` par
marque exigerait d'ajouter des champs à `MetricRange`, entité de l'interface **gelée**. Non fait,
consigné ici (§6 point 1) pour le coordinateur.

Les trois portes de type sont vertes : `npx tsc --noEmit -p tsconfig.json`, `-p tsconfig.worker.json`,
`-p tsconfig.review.json` — **0 erreur** chacune.

---

## 5. Portes exécutées dans le worktree (périmètre seulement)

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p tsconfig.json` | **0 erreur** |
| `npx tsc --noEmit -p tsconfig.worker.json` | **0 erreur** |
| `npx tsc --noEmit -p tsconfig.review.json` | **0 erreur** |
| `npx eslint src/engine src/worker src/types tests/review/D2 tests/review/D4` | **0 erreur, 0 avertissement** |
| `npx vitest run --no-file-parallelism src/engine src/worker src/types` | **17 fichiers, 152 tests, tous verts** (9,93 s) |
| `npx vitest run --config vitest.review.config.ts --no-file-parallelism tests/review/D2 tests/review/D4` | **22 fichiers, 238 tests, tous verts** (dont 26 nouveaux : 14 en D4, 12 en D2) |
| `npx vitest run --config vitest.perf.config.ts` | **2 fichiers, 7 tests, verts** — `EX-NFR-5` tenu (§2.6) |

La suite complète (`npm test`, `npm run build`, `npm run test:e2e`) n'a pas été lancée : elle relève
du coordinateur (CLAUDE.md §4.1). `reports/e2e/results.json` n'a pas été touché (**D8-33**) ;
`git status` le confirme, aucun des deux commits ne le contient.

---

## 6. Points hors périmètre, à remonter au coordinateur

1. **`EX-DATA-68` — le bloc de 13 valeurs par marque et par modèle.** `MakeAggregate.price/year/
   mileage` sont des `MetricRange` (6 valeurs), pas des `MetricStats` (13). `EX-DATA-64` est donc
   tenue **sur la sélection** (12 valeurs sur 13 publiées par l'entité + `count` porté par le
   conteneur, soit 13/13 après ce commit, conformément à `D8-32(4)`) mais **pas** sur les agrégats
   marque/modèle. Lever cela suppose un amendement de l'interface gelée (v2 de `DataProvider`), donc
   une décision de fix-lead ; ce n'est pas une correction que je pouvais faire. Aucune valeur
   affichée n'est fausse : les champs n'existent pas, ils ne mentent pas.
2. **`GroupStatEntry.coverage` n'est PAS arrondie à 4 décimales** (`src/engine/group-stats.ts`
   l. 285 : `n / listingCount` brut), là où `MetricStats.coverage` l'est désormais, comme
   `DistributionBucket.share` et l'`evalCoverage` d'`outliers.ts`. Les deux grandeurs ont des
   dénominateurs différents (le groupe / la sélection), donc aucune incohérence d'affichage
   immédiate, et ma sonde `R-D4-2.8-04` compare après `round₄` pour ne pas figer l'écart. Le
   fichier est dans mon périmètre, mais **modifier l'arrondi d'une valeur publiée depuis D8-07 sans
   sonde qui l'exige serait une correction non prouvée** (le grief `D8-27`) : je l'ai laissée. Si le
   fix-lead veut l'uniformiser, c'est une ligne et une sonde.
3. **`EX-DATA-23` n'a aucun appelant vivant.** `parseFirstRegistrationYearMonth` est posée, sondée et
   exportée, mais **aucun chemin d'ingestion ne l'appelle**, pour une raison documentée et non pour
   un oubli :
   - `src/providers/tweedehands/normalize.ts` **l. 352-355** : « la surface autorisée ne sert AUCUNE
     date de première immatriculation ; l'imputer depuis `modelYear` est explicitement interdit
     (EX-DATA-25/27, DR-017) » → `const firstRegistrationYear: number | null = null;` inconditionnel.
     Il n'y a donc pas de chaîne à parser dans l'adaptateur réel.
   - `src/providers/synthetic/generate.ts` **l. 883** construit la colonne arithmétiquement
     (`12 * modelYear + regMonth`) : aucune chaîne n'est parsée non plus.
   **Conséquence pour la matrice 2.7** : `EX-DATA-23` est désormais **implémentée et prouvée en tant
   que règle** (12 sondes), mais son branchement reste sans objet tant qu'aucune source ne sert le
   champ. `src/providers` est hors de mon périmètre d'écriture : si le coordinateur veut le
   branchement (par exemple sur un futur adaptateur, ou un test de contrat provider), la ligne
   exacte à modifier est `src/providers/tweedehands/normalize.ts` l. 353, et la fonction à appeler
   est `parseFirstRegistrationYearMonth(readAttr(raw, '<attribut de date>'), ingestFlags)`.
4. **Observation, hors `EX-DATA-23`** : `src/screens/market/format.ts` l. 107
   (`formatFirstRegistrationMonthYear`) construit un `new Date(isoDate)` sans garde. Sur une entrée
   que le parsing d'ingestion refuserait (`2024-13`), il rendrait `NaN/NaN` à l'écran. C'est un
   étage de **présentation**, dans `src/screens` (périmètre `fix-screens-2`), et son propre
   commentaire renvoie le repli `ET-CHAMP-MANQUANT` à l'appelant ; je le signale sans le corriger.

---

## 7. Ce que je n'ai pas fait, et pourquoi

- **Aucune modification de `src/worker/`** : rien n'y construit de `MetricStats` (vérifié, §2.4). Le
  périmètre m'était ouvert ; il n'y avait pas de travail.
- **Aucune promotion de sonde `it.fails` en `it`** : `grep -rn "it.fails" tests/review/D2 tests/review/D4`
  ne rend qu'une occurrence, `R-D2-16` (`tests/review/D2/reference-loader.test.ts` l. 184,
  `EX-DATA-54` : exceptions communales du référentiel), qui ne porte ni sur `D8-30` ni sur
  `EX-DATA-23` et que je laisse intacte. `D8-19` ne s'applique donc pas à ce lot.
- **Aucun push** : la branche `fix28/engine2` porte deux commits, à fusionner par le coordinateur
  (`engine-2 → state-2 → screens-2 → docs-2`, `FIX-LEAD-DECISIONS-2.8.md` §E).
