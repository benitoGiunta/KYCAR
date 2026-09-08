# fix-engine — vague F1 de la phase 2.8

**Agent `fix-engine` (Opus, effort high), 2026-09-08. Worktree `/home/user/kycar-wt/engine`, branche
`fix28/engine`, partie de `1226aeb`.** Mandat : `FIX-LEAD-DECISIONS-2.8.md` **D8-07** (statistiques
dans le worker, dette D-17 levée), **D8-09** (verdicts `INSUFFICIENT_DATA` / `INSUFFICIENT_SPREAD`,
dette D-45 levée), **D8-19** (sondes modifiées) et **D8-22**. Entrées lues :
`reports/remediation-2.8/fix-foundation.md` (types posés à l'étape 0), `src/worker/README.md`,
`reports/FINAL-VERIFICATION.md` §7 ligne **FV-10** et §3.2(a),
`docs/requirements/draft-data-dictionary.md` annexe A (§B.5bis, §B.6, §B.7),
`src/screens/distribution/graphs-model.ts` (seconde implémentation D7),
`reports/remediation/fix-engine.md` §3 (contexte DR-114 / R-PATHO-03).

Périmètre d'écriture respecté : `src/engine/`, `src/worker/README.md`, `tests/review/D4/`,
`tests/review/patho/`, `reports/remediation-2.8/`. **Aucune écriture** dans `src/providers`,
`src/state`, `src/components`, `src/screens`, `src/app*`, `src/orchestration`, `src/persistence`,
`docs/`, `tests/e2e/`, `src/worker/client.ts` (réservé à fix-app, D8-01), ni dans l'interface gelée
`DataProvider.ts`. Rien n'est poussé (CLAUDE.md §1.3 : le push relève du coordinateur).

---

## 1. Exigence / décision → implémentation → preuve → statut

| # | Exigence / décision | Implémentation (fichier, formule appliquée) | Preuve | Statut |
|---|---|---|---|---|
| 1 | **D8-07 / EX-DATA-83bis** — `GROUPSTAT(Σ, g, m)` | `src/engine/group-stats.ts` (`computeGroupStats`) : les **neuf** clés admises, exactement, dans l'ordre de l'annexe ; par groupe `G_v` : `listingCount(G_v)`, `n_price(G_v)`, `coverage = n/listingCount` (EX-DATA-61), médiane, `P5`, `P95` et `IQR = q3 − q1` en quantile de **type 7** (EX-DATA-62) ; `INCONNU` ne forme AUCUN groupe et va dans `unknownKeyCount` (ARB-36) ; ordre total `listingCount` décroissant → libellé `EX-DATA-70bis` → code croissant | test `src/engine/group-stats.test.ts` (5 cas, valeurs à la main : médiane 30 000, `P5` 12 000, `P95` 48 000, couverture 2/3) ; sonde `R-D8-07-01` (2 cas) | **FAIT** |
| 2 | **D8-07 / EX-DATA-83ter** — `NTILE(V_mileage(Σ), 5)` | idem, `computeNtile` : tranche `t` = rangs `⌈(t−1)n/k⌉ < i ≤ ⌈t·n/k⌉` en arithmétique **entière** (`⌈a/b⌉ = ⌊(a+b−1)/b⌋`, aucun flottant aux frontières) ; tri par valeur puis `listingId` octet à octet (EX-DATA-82) ; ex æquo à une frontière **dans la tranche de rang le plus bas** ; `n < k` ⇒ `n` tranches d'un élément et `status: 'DEGRADED'` | test (4 cas : tailles `[2,1,2,1,1]` à `n=7`, ex æquo réparti sur deux tranches, DEGRADED, invariance par permutation) ; sonde `R-D8-07-02` (2 cas) | **FAIT** |
| 3 | **D8-07 / EX-DATA-83quater** — paliers de puissance | idem, `computePowerTiers` : palier `⌊powerKw / 20⌋`, largeur fixe 20 kW, **borne haute exclusive** (`upperKw = 20·(k+1)`), libellé `<20·k> – <20·(k+1) − 1> kW` ; paliers vides **intérieurs** conservés, aucun au-delà du maximum observé ; `powerKw` inconnu ou nul → `unknownKeyCount` | test (paliers `[0,1,2,3,4]` dont trois vides, libellé `80 – 99 kW`, borne 100 exclusive) ; sonde `R-D8-07-03` | **FAIT** |
| 4 | **D8-07 / EX-DATA-83quinquies** — indice de dépréciation | idem, `computeDepreciationIndex` : sur les groupes d'année à `n_price ≥ 12`, `index(y) = 100 × M(y) / M(y_max)` et `annualLossPct(y) = 100 × (1 − M(y) / M(y+1))`, arrondis à **1 décimale** demi vers l'infini (EX-DATA-6) ; `y_max` = millésime le plus **récent** au-dessus du seuil, **publié** dans `baseYear` ; `null` sous le seuil et si `y+1` manque ; aucune interpolation ni lissage ; les millésimes sous le seuil restent publiés avec leur `n` et leur médiane | test (base 2023, index `[null, 60, 75, 90, 100]`, pertes `10 / 16,7 / 20`, `baseYear = null` si aucun millésime n'atteint 12) ; sonde `R-D8-07-04` | **FAIT** |
| 5 | **D8-07 / EX-DATA-93bis, EX-SCR-164 (FV-10)** — `R²` publié | `src/engine/outliers.ts`, `fitM2` : `R² = 1 − SCR/SCT` avec `SCR = Σ_{i∈F}(y_i − ŷ_i)²`, `SCT = Σ_{i∈F}(y_i − ȳ)²`, sur `F` **complet** (jamais `F'`), en échelle `y = ln(p)`, `ŷ_i` prédit par les coefficients de la **passe 2** et **sans** le recentrage `m_r` ; arrondi à 2 décimales (EX-DATA-6) ; `SCT = 0` ⇒ `null` | test `src/engine/outliers.cells.test.ts` — **oracle indépendant** : kilométrage constant ⇒ `x2` retiré (EX-DATA-91) ⇒ régression simple ⇒ `R² = r²` de **Pearson**, recalculé en 5 lignes dans le test ; plus ajustement parfait → `1,00` ; plus prix alternés → `< 0,30` et avertissement posé ; sonde `R-D8-07-05` (2 cas) | **FAIT** |
| 6 | **D8-07 / EX-DATA-86, EX-DATA-87** — statistiques de cellule | idem : chaque cellule **retenue** (par M1 ou par M2) publie `cellLevel`, `cellKey` entière, `cellLabel`, `n` hors `PRICE_IMPLAUSIBLE_IN_CELL`, `median` et `mad` de `V_price(C)`, `fitCount = |F|`, `implausibleInCellCount`, `rSquared`, `rSquaredWarning` | test (cellule `MODEL_YEAR` de 12 : `n = 12`, médiane 11 100, MAD 600 — tous deux médianes de **type 7** ; `fitCount = 0` car M2 démarre à 30) ; sonde `R-D8-07-05` | **FAIT** |
| 7 | **D8-07 / EX-DATA-99 à 103, EX-DATA-118** — `SAMPLE` | `src/engine/scatter.ts` (`sampleScatter`) : les trois branches d'`EX-DATA-101` (`n_e ≤ K` ; `|A| ≥ K` → `K` plus grands `|opportunityScore|` et `outlierTruncated` ; sinon `A` entier + pas **réel non arrondi** `|B|/q`, `B[⌊j·pas⌋]`), sortie triée par `listingId` octet à octet, compteurs d'`EX-DATA-103` publiés avec `maxPoints`. Aucune graine, aucun PRNG. `Elig` est celui de la grille de densité (D-05), publié par `density.ts` | test `src/engine/scatter.test.ts` (6 cas, dont les indices `0, 2, 4, 6, 9, 11, 13, 15` calculés à la main pour `pas = 2,25`, et l'invariance à trois permutations) ; sonde `R-D8-07-06` (2 cas) | **FAIT** |
| 8 | **D8-09 / EX-DATA-85, 86, 89, 95 (DR-114)** — verdicts de non-évaluabilité | `src/engine/outliers.ts`, boucle de verdict : une annonce à prix affiché et valide qu'aucune méthode n'évalue reçoit **un** verdict, `flags = ['INSUFFICIENT_DATA']` si aucune cellule n'atteint `n_price ≥ 12` (dernière ligne du tableau d'EX-DATA-86), `['INSUFFICIENT_SPREAD']` si la cellule retenue a un `IQR(ln p)` nul (EX-DATA-89) ; `opportunityScore`, `expectedPriceEur` et `deviationPct` à `null` (EX-DATA-95) ; méthode nommée `M1` (première du repli, la plus permissive) | test `outliers.cells.test.ts` (4 cas) ; sondes `R-D4-05` (**rendue à `it`**) et `R-D8-09-01` | **FAIT** |
| 9 | **D8-09** — compteurs publiés | `OutlierEvaluationCounters` (`outliers.ts`), publié par `RecalcResult.outlierEvaluation` : `evaluated`, `notEvaluable.INSUFFICIENT_DATA`, `notEvaluable.INSUFFICIENT_SPREAD`, `notEvaluableTotal`, `priceExcluded`, `implausibleInCell` | test : `evaluated + notEvaluableTotal + priceExcluded + implausibleInCell = priceQuotedCount` et `notEvaluableTotal + priceExcluded + implausibleInCell = outlierNotEvaluatedCount` (raffinement d'I6) ; sonde `R-D8-09-01` | **FAIT** |
| 10 | **D8-07 / EX-NFR-5** — budget | `src/engine/kernel.ts` : `STATS_UNPRUNED_MAX_ROWS` (= `OUTLIER_UNPRUNED_MAX_ROWS`, 25 000) ; au-delà, sur une sélection **non élaguée**, les six champs sont absents et `statsSkipped = 'UNPRUNED_SELECTION'` le **dit** (EX-NFR-23) | banc `npm run test:perf` (§4) ; sonde `R-D8-07-07` (3 cas, dont le clonage structuré) | **FAIT** (voir §4 et §6.1) |
| 11 | **D8-19** — sondes modifiées | §3 | contrôle par fix-verify | **FAIT** |
| 12 | Test de **non-divergence** temporaire | `src/engine/stats-nondivergence.test.ts` : 3 sélections, `groupStats` / `ntiles` / `depreciationIndex` / `powerTiers` égaux à `graphs-model.ts` (import **en lecture seule**) | 18 cas verts | **FAIT**, **à SUPPRIMER par fix-screens** (§5) |
| 13 | **D8-22** | Aucune action : `R-D3-02` est hors périmètre (fix-providers) ; elle est **verte** dans mon exécution finale à vide (§4) | `npm test` final | **CONSTATÉ** |

---

## 2. Sondes écrites d'abord ROUGES (D-32)

Le fichier `tests/review/D4/worker-stats-d807.test.ts` (14 sondes) a été écrit contre l'annexe A,
puis exécuté sur l'état d'arrivée du cluster (`1226aeb`) en remisant les seules modifications de
`src/engine/{kernel,outliers,density}.ts` :

```
$ git stash push -- src/engine/kernel.ts src/engine/outliers.ts src/engine/density.ts
$ npx vitest run --config vitest.review.config.ts tests/review/D4/worker-stats-d807.test.ts
  Tests  14 failed (14)
    × R-D8-07-01 … → expected undefined to be defined
    × R-D8-07-02 … → expected undefined to be 'DEGRADED'
    × R-D8-07-03 … × R-D8-07-04 … × R-D8-07-05 … × R-D8-07-06 … × R-D8-09-01 … × R-D8-07-07 …
$ git stash pop
$ npx vitest run --config vitest.review.config.ts tests/review/D4/worker-stats-d807.test.ts
  Tests  14 passed (14)
```

Une seule sonde passait au premier jet rouge (l'invariance par permutation de l'échantillon,
trivialement vraie quand le champ est absent des DEUX côtés) : elle a été renforcée d'une garde
`expect(sample).toBeDefined()` avant la comparaison, et la mesure ci-dessus est celle d'APRÈS ce
renforcement — 14 rouges sur 14.

---

## 3. Sondes modifiées, avec justification (D-31 / D8-19)

`R-D4-05` est **rendue à `it`** dans le commit même de la correction (`15c0806`), **sans qu'aucune de
ses assertions soit touchée** ; seul son titre reçoit la mention `[défaut relevé en 2.5 … — LEVÉ par
D8-09]`, pour qu'une sonde verte ne prétende plus décrire un défaut qui n'existe plus.

**Cinq** sondes vertes — et non quatre : `FIX-LEAD-DECISIONS-2.8` en annonçait quatre d'après
`reports/remediation/fix-engine.md` §3.2, qui omettait `VAL-VARIANCE-0-COLIN` — exigeaient
« AUCUN verdict ». Toutes les cinq décrivaient le moteur d'AVANT D8-09 ; leur transformation est
la même et son intention est intacte : « le tableau des verdicts est vide » devient « aucun verdict
de **DÉTECTION** », c'est-à-dire aucun verdict ne portant un code autre que les deux codes de
non-évaluabilité (`isNotEvaluableOutlierCode`, posé par l'étape 0).

| # | Sonde | Fichier | Transformation | Justification |
|---|---|---|---|---|
| 1 | `ADV-06 / ARB-17 › n = 11 : … aucun verdict` | `tests/review/D4/thresholds-m1m2.test.ts` | `expect(outlierVerdicts).toEqual([])` → `expect(detectionVerdicts(…)).toEqual([])`, plus `11` verdicts `INSUFFICIENT_DATA` et tous scores `null` | Le fait mesuré (aucune détection sous 12, `evaluated = 0`, `notEvaluated = 11`, statistiques toujours calculées) est asserté tel quel. `R-D4-05`, dans le MÊME fichier, mesurait que l'absence de verdict était un défaut au regard d'`EX-DATA-85/86/95` : les deux sondes se contredisaient, D8-09 tranche en faveur de l'exigence. |
| 2 | `ADV-06 / ARB-17 › n = 1..11 : jamais de verdict` | idem | `length === 0` → `detectionVerdicts(…).length === 0`, plus `n` verdicts `INSUFFICIENT_DATA` | idem, sur les onze effectifs. |
| 3 | `VAL-VARIANCE-0` | `tests/review/patho/valeurs.test.ts` | `toHaveLength(0)` → `detectionVerdicts(…)` vide, plus 40 verdicts `INSUFFICIENT_SPREAD` | Le fait mesuré est « AUCUN faux positif » à variance nulle (EX-DATA-89/92) : il est intact. Depuis D8-09 la non-évaluabilité est DITE au lieu d'être déduite d'une absence. |
| 4 | `VAL-VARIANCE-0-COLIN` | idem | idem | idem (les deux régresseurs sont retirés, `outlierEvaluatedCount` reste 0). |
| 5 | `VAL-SEUIL-11` (cas `n = 11` du `it.each`) | idem | `verdicts.filter(v => v.method === 'M1')` → même filtre appliqué aux **verdicts de détection** | La sonde compte les méthodes APPLIQUÉES. Le verdict de non-évaluabilité est nommé sur `M1` (première du repli d'EX-DATA-86) et dit exactement qu'aucune méthode n'a pu être appliquée : le compter comme une application de M1 inverserait son sens. Les cas `n = 12 / 29 / 30` de la même `it.each` sont inchangés et restent verts. |

Deux fonctions utilitaires locales (`detectionVerdicts`, `notEvaluableVerdicts`) sont ajoutées en
tête de ces deux fichiers, avec le commentaire d'amendement.

**Aucune autre sonde n'a été touchée.** En particulier `R-PATHO-07`, `VAL-BASCULE-29-30`,
`R-D4-06`, `R-D4-07` et les huit sondes de `pruning-facets-density` sont vertes sans retouche.

---

## 4. Vérifications et chiffres de performance

```
npx tsc --noEmit -p tsconfig.json            → 0 erreur
npx tsc --noEmit -p tsconfig.worker.json     → 0 erreur
npx tsc --noEmit -p tsconfig.review.json     → 0 erreur
npx eslint src tests                         → vert
npm run build                                → tsc app + worker + vite build, 0 erreur / 0 warning
npm run lint                                 → vert
npm run size                                 → initial 102,12 / 300 Kio gzip (99,46 avant) ; différé 0,00 / 400
npm test                                     → 665 passed (665) puis 814 passed (814)
```

Suite unitaire **615 → 665** (+50 : 16 `group-stats`, 6 `scatter`, 10 `outliers.cells`, 18
non-divergence). Suite de revue **800 → 814** (+14 sondes `worker-stats-d807`).

*Note sur l'état d'arrivée* : à `1226aeb`, `npm test` rendait `5 failed` en revue — `R-D3-02`
(213,8 ms contre 200, machine chargée, D8-22) et **quatre** sondes qui exigent un `dist/`
(`D8/nfr9-size` ×3, `D8/parcours › EX-NFR-9`). Après `npm run build` et sur machine au repos, les
cinq sont **vertes**, y compris `R-D3-02` : aucune n'était une régression, et aucune ne l'est.

### Banc `npm run test:perf` (`recalc.perf.test.ts`, N = 100 000, 100 exécutions)

| Mesure | Avant D8-07 | Après D8-07 | Budget |
|---|---|---|---|
| Recalcul **FULL non élagué** (statistiques OMISES par la garde) | p50 165,3 / **p95 186,5** / max 310,3 ms | p50 159,2 / **p95 175,0** / max 196,0 ms | `EX-NFR-5` p95 ≤ 200 ms — **TENUE** |
| Recalcul **élagué**, plus grande marque (`m = 9 283`, statistiques CALCULÉES) | p50 47,8 / **p95 60,4** / max 66,4 ms | p50 79,9 / **p95 94,0** / max 121,1 ms | `EX-NFR-5` p95 ≤ 200 ms — **TENUE** |
| Facettes différées (8 filtres) | p95 20,4 ms | p95 22,7 ms | `EX-DATA-110bis` ≤ 100 ms — **TENUE** |

**Lecture.** Le surcoût des six statistiques est de **+33,6 ms au p95** sur la sélection élaguée la
plus lourde du jeu synthétique (9 283 lignes), soit **47 % du budget restant** consommé et 106 ms de
marge. L'écran B, seul consommateur, travaille en mode 2 sur `m ≈ 10³` (décision O17), c'est-à-dire
un ordre de grandeur en dessous de ce pire cas. Le chemin **non élagué** est inchangé (l'écart des
deux p95 est du bruit de mesure, la garde de budget y omettant les statistiques comme elle omet déjà
M1/M2 depuis O17).

**La garde est donc conservée** — et elle est **nommée**, jamais silencieuse : `statsSkipped`
vaut `'UNPRUNED_SELECTION'` quand les six champs sont absents, ce que la sonde `R-D8-07-07` exige
et que l'écran doit rendre (`EX-NFR-23`). C'est l'option « calcule-les seulement sur la sélection
élaguée et documente » de la mission ; le chiffre qui la motive est ci-dessus.

---

## 5. Ce que fix-screens doit consommer (noms EXACTS)

Le contrat complet, champ par champ, est dans **`src/worker/README.md`** (section « Ce que le moteur
calcule désormais »). Résumé opposable :

| Champ de `RecalcResult` | Type | Remplace, côté écran |
|---|---|---|
| `groupStats` | `readonly GroupStatSet[]` (9 ensembles, `metric: 'price'`) | `buildYearMedian`, `buildCategoryBars`, `buildPowerTiers` (via `groupStat` de `group-stat.ts`) |
| `ntiles` | `NtileResult` (`k = 5`, `metric: 'mileage'`) | `buildMileageBoxes` / `ntile` |
| `powerTiers` | `PowerTierResult` | `buildPowerTiers` |
| `depreciationIndex` | `DepreciationIndexResult` (`baseYear` **publiée**) | `buildDepreciation` |
| `cellStats` | `readonly CellStat[]` | rien (n'existait pas) — porte `fitCount` et `rSquared` du libellé G8 |
| `sample` | `ScatterSampleSummary` | `sampleScatter` de `scatter-sample.ts` |
| `statsSkipped` | `StatsSkippedReason \| null` | rien — **nouveau**, à rendre quand les six champs sont absents |
| `outlierEvaluation` | `OutlierEvaluationCounters` | rien — **nouveau**, `evaluated` / `notEvaluable.*` |

Trois points d'attention, énoncés aussi dans le README :

1. **`GroupStatEntry.label` des six clés énumérées est le CODE en décimal** (`"3"`), pas un libellé
   FR : le worker ne reçoit ni `ReferenceData` ni vocabulaires (`LOAD_DATASET` ne porte que le lot
   colonnaire et la taxonomie des modèles). L'écran substitue le libellé du vocabulaire au rendu.
   Les trois autres clés portent un libellé complet (`"2019"`, `"Tranche 3"`, `"80 – 99 kW"`).
2. **`CellStat.cellKey`** encode la cellule : `makeId · 2 097 152 + modelId` (`MODEL`), cette clé
   `· 4096 + année` (`MODEL_YEAR`), `-1` (`SELECTION`).
3. **`src/screens/outlier-index.ts` doit être corrigé** — voir §6.1, c'est le seul constat de mon
   travail qui traverse un périmètre voisin.

fix-screens **supprime** `src/engine/stats-nondivergence.test.ts` en même temps qu'il supprime le
recalcul de `graphs-model.ts` / `group-stat.ts` / `scatter-sample.ts` : ce test n'existe que pour
interdire la divergence pendant la coexistence des deux implémentations.

---

## 6. Points ouverts et arbitrages

### 6.1 `OutlierIndex` (fix-screens) — conséquence directe de D8-09, HORS de mon périmètre

`src/screens/outlier-index.ts` répond aujourd'hui :

```ts
has(listingId)        { return entry !== undefined && entry.flags.length > 0; }  // « signalée ? »
isEvaluated(listingId){ return this.byId.has(listingId); }                        // « évaluée ? »
```

Un verdict `INSUFFICIENT_DATA` porte un `flags` non vide : `has()` répondrait donc **oui** pour une
annonce que le moteur déclare NON ÉVALUABLE, et `isEvaluated()` aussi — l'inverse exact du sens de
ces codes. **Aucun test ne tombe** (les 665 unitaires et 814 sondes sont verts, `graphs-model` filtre
déjà sur `opportunityScore != null`), mais la colonne « signalée » de l'écran D marquerait ces
annonces. Les deux méthodes doivent écarter `OUTLIER_NOT_EVALUABLE_CODES` (`isNotEvaluableOutlierCode`,
`src/types/vocabularies.ts`). Le nuage G4 n'est pas concerné dès lors qu'il lit `sample` : le moteur
l'échantillonne sur ses propres `flaggedRows`, qui n'ont jamais contenu de non-évaluable.
**Attribué à fix-screens** (répertoire `src/screens`), signalé ici et dans `src/worker/README.md`.

### 6.2 Trois divergences de `graphs-model.ts` (D7) par rapport à l'annexe A

Relevées en écrivant le test de non-divergence ; le code de D7 disparaît, c'est l'annexe A qui fait
foi, et les trois sélections du test restent dans le domaine COMMUN pour être comparables :

1. `buildDepreciation` retient les millésimes à `n ≥ 5` là où `EX-DATA-83quinquies` exige `n ≥ 12`,
   et calcule sa base sur ce seuil-là (la base peut donc différer d'un millésime) ;
2. le `ntile` de D7 découpe sur `⌊t·n/k⌋` là où `EX-DATA-83ter` pose `⌈t·n/k⌉` : les deux coïncident
   quand `k | n`, et diffèrent sinon dans la RÉPARTITION des tailles (jamais dans leur ensemble) ;
3. le `groupStat` de D7 forme un groupe pour la valeur INCONNUE, qu'`ARB-36` interdit.

Aucune n'appelle de correction : les trois fonctions sont supprimées par fix-screens.

### 6.3 Décisions de lecture de l'annexe A, à ratifier si le fix-lead le juge nécessaire

1. **`yearBucket` = millésime civil.** `EX-DATA-83bis` dit « le bucket d'année produit par `BIN` » ;
   la ligne Année d'`EX-DATA-77` pose `W = {1}`, `O = 0`, donc l'indice de bin d'une année vaut
   exactement cette année sur tout bin **fermé**. Le moteur clé sur le millésime : verser les queues
   à 1 % dans les bins de débordement `kLo−1` / `kHi+1` ferait porter à `depreciationIndex` une
   valeur d'année FAUSSE, alors qu'`EX-DATA-83quinquies` raisonne sur `M(y)` et `M(y+1)`.
2. **Une seule métrique publiée (`price`).** `GROUPSTAT` est défini pour les trois métriques ; les
   neuf graphes qui le lisent lisent tous le prix. Publier 27 ensembles au lieu de 9 triplerait le
   coût sous budget `EX-NFR-5` pour 18 ensembles sans lecteur.
3. **`CellStat.mad`** est l'écart absolu médian de `V_price(C)` autour de sa médiane (l'estimateur
   robuste d'`EX-DATA-92` appliqué à l'échantillon de la CELLULE, en euros), et non le MAD des
   résidus de M2 — celui-ci n'existe pas pour une cellule que seule M1 a retenue, et vaudrait `null`
   sur toutes les cellules de 12 à 29 annonces. `null` signifie « non calculable » (cellule vide),
   jamais « nul » : `0` est une valeur MESURÉE, celle d'une cellule à prix unique.
4. **Paliers de puissance** : émis de `minTier` à `maxTier` observés. Les paliers vides INTÉRIEURS
   sont conservés (le texte l'exige) ; les paliers vides EXTÉRIEURS sous le minimum ne le sont pas,
   par symétrie avec `EX-DATA-79` (un bin de débordement vide n'est pas émis).
5. **Méthode nommée sur un verdict de non-évaluabilité : `M1`.** La clé primaire du verdict est
   `(snapshot, sélection, annonce, méthode)` et `OutlierMethod` est un type gelé de D2 (`M1|M2|M3`).
   `M1` est la première méthode du repli d'`EX-DATA-86` et la plus permissive (12 contre 30) : une
   annonce que M1 ne peut pas juger, M2 ne le peut pas davantage. L'unicité de la clé est préservée
   (une annonce non évaluable ne porte aucun autre verdict).

### 6.4 Non traité, hors mandat

- **`MetricStats.iqr` / `MetricStats.coverage`** (point 9 du rapport de fix-foundation) restent à
  `null` : `iqr` est à portée immédiate d'`exactMetricStats`, mais le remplir changerait la valeur
  publiée de **toutes** les entités `MetricStats` du produit (sélection, marque, modèle) et donc
  plusieurs sondes de D6/D7 hors de mon périmètre ; `coverage` exige `N`, que `exactMetricStats` ne
  connaît pas. D8-10 les attribue à **fix-providers** ; `GroupStatEntry` publie, lui, son propre
  `iqr` et sa propre `coverage`, calculés (§1, lignes 1 et 4).
- **`R-D3-02`** (D8-22) : hors périmètre, verte à vide dans mon exécution finale.

---

## 7. Commits

| SHA | Message |
|---|---|
| `f25c609` | Phase 2.8 (D8-07, EX-DATA-83bis/ter/quater/quinquies): GROUPSTAT, NTILE, power tiers and depreciation index in the engine |
| `15c0806` | Phase 2.8 (D8-07 FV-10 and D8-09 DR-114): cell statistics with the M2 R squared, non evaluable verdicts, RecalcResult wiring |
| (ce fichier) | Phase 2.8 (D8-07, D8-09): fix-engine report |

Rien n'est poussé : le push relève du coordinateur (CLAUDE.md §1.3).
