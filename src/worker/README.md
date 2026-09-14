# src/worker

Owned by **lot D4** (the aggregation engine itself). Lot D1 only ships the message envelope
(`messages.ts`), a PING/PONG worker (`aggregation.worker.ts`), and the main-thread client
(`client.ts`) that proves the channel end to end. D4 adds new `WorkerRequest`/`WorkerResponse`
kinds and new `case` branches in the worker's message switch - it does not create a second
worker file or a second channel.

## Statistiques publiées par `RecalcResult` (D8-07, étape 0 de la remédiation 2.8)

La dette **D-17** (2.6) est levée par **D8-07** : `GROUPSTAT`, `NTILE`, les paliers de puissance,
l'indice de dépréciation, le `R²` de M2, les statistiques de cellule et l'échantillon du nuage G4
sont calculés **dans le worker** et publiés par `RecalcResult` (`src/engine/kernel.ts`), qui en
devient la **source unique**. D7 cesse alors de les recalculer sur le thread principal
(`src/screens/distribution/group-stat.ts`, `scatter-sample.ts`).

L'**étape 0** fige la FORME de ces sorties — types dans `src/engine/stats-protocol.ts`, réexportés
par `src/engine/index.ts`. Les six champs sont **optionnels** : un `RecalcResult` d'avant D8-07
reste valide, et rien ne casse tant que le moteur ne les remplit pas. Le calcul est le travail de
**fix-engine**, la consommation celui de **fix-screens**.

| Champ de `RecalcResult` | Type | Exigence | Ce qu'il porte |
|---|---|---|---|
| `groupStats?` | `readonly GroupStatSet[]` | **EX-DATA-83bis** (+ EX-DATA-61, EX-DATA-64, ARB-36) | Un `GROUPSTAT(Σ, g, m)` par clé admise. Les clés autorisées sont **exactement** les neuf de `GroupStatKey` ; par groupe : valeur de clé, libellé, `listingCount`, `n`, `coverage` métrique, médiane, `P5`, `P95`, `IQR`. `INCONNU` n'est jamais une clé : ces annonces vont dans `unknownKeyCount`. Ordre total : `listingCount` décroissant, puis libellé (EX-DATA-70bis), puis code. Alimente G5, G6, G9, G12, G13, G14, G15 et l'infobulle d'EX-SCR-149. |
| `ntiles?` | `NtileResult` | **EX-DATA-83ter** | `NTILE(V_mileage(Σ), 5)` de G10 : tranches de **rang** (jamais de quantile), `{ rank, loObserved, hiObserved, count }`, ex æquo à la tranche de rang le plus bas. `status: 'DEGRADED'` et `n` tranches d'un élément si `n < k`. Déterministe au sens d'EX-DATA-82 (tri par valeur puis `listingId`). |
| `powerTiers?` | `PowerTierResult` | **EX-DATA-83quater** | Paliers `⌊powerKw / 20⌋`, origine 0, largeur 20 kW, borne haute exclusive, libellé `<20·k> – <20·(k+1) − 1> kW`. Paliers vides intérieurs conservés, aucun palier au-delà du maximum observé ; `powerKw` INCONNU compte dans `unknownKeyCount`. |
| `depreciationIndex?` | `DepreciationIndexResult` | **EX-DATA-83quinquies** | `depreciationIndex(y) = 100 × M(y) / M(y_max)` sur les groupes d'année dont `n_price ≥ 12`, `annualLossPct(y) = 100 × (1 − M(y) / M(y+1))`, 1 décimale, `null` sous le seuil. `baseYear` (`y_max`, le millésime le plus récent au-dessus du seuil) est **publiée** avec l'indice. Aucune interpolation, aucun lissage. |
| `cellStats?` | `readonly CellStat[]` | **EX-DATA-86**, **EX-DATA-87**, **EX-DATA-93bis**, **EX-SCR-164** | Par cellule d'homogénéité : `cellLevel`, `n` (hors `PRICE_IMPLAUSIBLE_IN_CELL`), médiane, **MAD**, `fitCount` (`|F|`), `implausibleInCellCount`, et le **`R²`** de la **passe 2** de M2 sur `F` complet en échelle `ln(p)` (`R² = 1 − SCR/SCT`, 2 décimales). `SCT = 0` → `rSquared = null` et verdict `INSUFFICIENT_SPREAD` (D8-09). `rSquaredWarning` est l'avertissement `R² < 0,30` affiché sous le titre de G8. |
| `sample?` | `ScatterSampleSummary` | **EX-DATA-99 à EX-DATA-103**, **EX-DATA-118** | Échantillon déterministe du nuage G4 : lignes triées par `listingId`, `eligibleCount` (`n_e`), `plottedCount`, `outlierCount` (`|A|`), `outlierPlottedCount`, `sampled`, `outlierTruncated`, `maxPoints` (`K`). Les compteurs sont **inséparables** du tracé : EX-DATA-103 exige de dire qu'une nuée est échantillonnée. |

**Contrainte de protocole.** Ces objets traversent `postMessage`, donc l'algorithme de clonage
structuré : uniquement des primitives, des chaînes, des tableaux et des `TypedArray`. Aucune
fonction, aucune classe, aucun `undefined` porteur de sens — l'absence se dit par `null`
(EX-DATA-2). `ScatterSampleSummary.rows` est un `Int32Array` : s'il est un jour **transféré**
plutôt que copié, il faut appliquer la même règle que D8-01 (ne jamais transférer un tampon que le
thread principal relit).

### Ce que le moteur calcule désormais (D8-07 / D8-09, fix-engine)

**Les six champs sont RENSEIGNÉS** depuis `fix-engine` (`src/engine/group-stats.ts`,
`src/engine/scatter.ts`, `src/engine/outliers.ts`, câblés par `src/engine/kernel.ts`). Deux champs
optionnels s'y ajoutent, et il faut les lire ENSEMBLE avec les six premiers :

| Champ de `RecalcResult` | Type | Ce qu'il porte |
|---|---|---|
| `statsSkipped?` | `StatsSkippedReason \| null` | `null` quand les six champs sont renseignés ; `'UNPRUNED_SELECTION'` quand ils sont ABSENTS parce que la sélection n'est pas élaguée ET dépasse `STATS_UNPRUNED_MAX_ROWS` (25 000, le même plafond que M1/M2 — `EX-NFR-5`, O17). L'écran doit dire « non calculé sur cette sélection », JAMAIS afficher un graphe vide (`EX-NFR-23`). L'écran B est toujours élagué (O17) : sur son chemin, `statsSkipped` vaut toujours `null`. |
| `outlierEvaluation?` | `OutlierEvaluationCounters` | `evaluated`, `notEvaluable.INSUFFICIENT_DATA`, `notEvaluable.INSUFFICIENT_SPREAD`, `notEvaluableTotal`, `priceExcluded`, `implausibleInCell`. Invariant : la somme des quatre derniers termes vaut `priceQuotedCount` (`EX-DATA-95`, raffinement d'I6). Absent quand M1/M2 ont été omis (`outliersSkipped`). |

**Trois lectures de l'annexe A tranchées par le moteur**, à connaître avant de consommer :

1. `GroupStatSet.metric` vaut toujours `'price'` : les neuf graphes qui lisent `GROUPSTAT` lisent la
   métrique prix. Les deux autres métriques ne sont pas publiées (coût de recalcul sans lecteur).
2. La clé `yearBucket` est le **millésime civil**. La ligne Année d'`EX-DATA-77` pose `W = {1}` et
   `O = 0` : l'indice de bin d'une année vaut exactement cette année sur tout bin fermé. C'est la
   seule lecture compatible avec `EX-DATA-83quinquies` (`M(y)`, `M(y+1)`).
3. `GroupStatEntry.label` est le libellé que le WORKER sait former seul : millésime (`"2019"`),
   tranche de rang (`"Tranche 3"`), palier (`"80 – 99 kW"`) — et, pour les six clés énumérées, le
   **code entier en décimal** (`"3"`), le worker ne recevant ni `ReferenceData` ni vocabulaires.
   L'écran substitue le libellé FR au rendu ; l'ordre publié est déjà total, donc stable.

**`CellStat.cellKey`** encode la cellule : `makeId · 2 097 152 + modelId` pour `MODEL`,
`(cette clé) · 4096 + année` pour `MODEL_YEAR`, et `-1` pour `SELECTION`. `cellLabel` porte les
identifiants techniques (`"7/1234 · 2019"`, `"Σ"`) ; l'écran y substitue les noms de la taxonomie.

**Ce que `fix-screens` doit faire** (consommation, D8-07) :

- lire `groupStats` / `ntiles` / `powerTiers` / `depreciationIndex` / `sample` au lieu de
  `src/screens/distribution/graphs-model.ts`, `group-stat.ts` et `scatter-sample.ts`, et **supprimer**
  ces recalculs du thread principal (source unique) ainsi que le test temporaire de non-divergence
  `src/engine/stats-nondivergence.test.ts`, qui n'a plus d'objet ;
- afficher sous le titre de `G8` le libellé normatif d'`EX-SCR-164` à partir de `CellStat.fitCount`
  (`n = <|F|>`) et `CellStat.rSquared`, avec l'avertissement quand `rSquaredWarning` est vrai ;
- **corriger `src/screens/outlier-index.ts`** : `has()` (appartenance à `A`) et `isEvaluated()`
  répondent aujourd'hui « oui » dès que `flags` n'est pas vide, donc « oui » pour un verdict
  `INSUFFICIENT_DATA` / `INSUFFICIENT_SPREAD`, ce qui est l'inverse du sens de ces codes. Les deux
  doivent écarter les codes de `OUTLIER_NOT_EVALUABLE_CODES` (`isNotEvaluableOutlierCode`). Le nuage
  G4 n'est pas concerné dès lors qu'il lit `sample`, que le moteur calcule sur ses propres
  `flaggedRows`.
