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
