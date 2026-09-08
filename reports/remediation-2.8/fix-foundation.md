# fix-foundation — étape 0 de la phase 2.8

**Agent `fix-foundation` (Opus, effort high), 2026-09-08. Branche `claude/kycar-project-ffcplk`,
arbre principal.** Cette étape amende les interfaces et les entités gelées dont les cinq clusters
de la vague F1 dépendent, et pose les types du protocole worker de D8-07. Elle ne branche AUCUN
calcul : toutes les valeurs posées sont **neutres** (`null`, `0`, absent). Le calcul est le travail
des clusters.

Mandat : `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` **D8-08, D8-09, D8-10, D8-11**, la
partie « types du protocole worker » de **D8-07**, et §B (séquencement). Entrées lues :
`reports/FINAL-VERIFICATION.md` §7 (FV-02, FV-10), `reports/REMEDIATION.md` §4 (DR-082, DR-114,
DR-105, DR-122), `docs/requirements/draft-data-dictionary.md` annexe A, `docs/plans/DataProvider.ts`.
Méthode reprise de l'étape 0 de 2.6 (`reports/remediation/fix-foundation.md`) : deux copies de
`DataProvider.ts` identiques octet à octet, sondes adaptées avec justification écrite (D-31 / D8-19).

---

## 1. Décision → modification → preuve → statut

| # | Décision | Modification (fichiers) | Preuve (commande + sortie) | Statut |
|---|---|---|---|---|
| 1 | **D8-08 / DR-082** (dette D-38 levée) — colonne TVA : `EX-SCR-203` exige 16 colonnes, `TVA` n'avait aucun champ dans l'interface gelée | `src/providers/DataProvider.ts` + `docs/plans/DataProvider.ts` (`vatDeductible: Uint8Array`, commentaire normatif) ; `src/types/sentinels.ts` (`VAT_DEDUCTIBLE`, `VatDeductibleCode`, `readVatDeductible`, `encodeVatDeductible`) ; `src/types/columns.ts` (politique `tristate-zero`, descripteur, champ de la vue logique `Listing`) ; `src/types/index.ts` ; `src/providers/synthetic/columnar.ts` (`MutableColumns`, `allocColumns`, `subsetBatch`) ; `src/engine/synthetic.ts` ; `src/worker/client.ts` (liste de transfert) ; `src/providers/mock-provider.test.ts`, `tests/review/D2/provider-contract.test.ts`, `tests/review/D4/helpers.ts`, `tests/review/patho/_fixtures.ts` | `npm test` → `615 passed` puis `800 passed` ; `npx vitest run --config vitest.review.config.ts tests/review/D2/dictionary-fields.test.ts` → `✓ # 10 vatDeductible — Uint8Array tri-état, inconnu = 0 (D8-08), hors chemin chaud` et `✓ EX-DATA-119 : exactement 20 colonnes énumérées sur un octet et 2 champs de bits` | **FAIT** (interface + valeurs neutres à `0`) |
| 2 | **D8-10 / DR-122** — `MakeAggregate.modelCount` (FV-02, « 0 modèles »), `MetricStats.iqr` / `coverage`, optionnels `coverageWarning` / `samplingBias` / `adTierDistribution` | `src/providers/DataProvider.ts` + `docs/plans/DataProvider.ts` (`modelCount` **obligatoire**, `CoverageWarning`, `AdTierDistribution`, 3 champs optionnels sur `MakeAggregate` ET `ModelAggregate`) ; `src/types/entities.ts` (`MetricStats.iqr`, `MetricStats.coverage`) ; `src/types/index.ts` ; valeurs neutres : `src/engine/aggregate.ts`, `src/engine/quantiles.ts` (4 littéraux), `src/providers/synthetic/aggregate.ts`, `src/providers/tweedehands/aggregate.ts`, fabriques de test `src/screens/market/{csv,state,view-model}.test.ts` et sondes `tests/review/D6/*`, `tests/review/patho/bloquants-st.test.ts` | `npx tsc --noEmit` (app + worker + review) → 0 erreur ; `npm test` → `615 passed` / `800 passed` ; invariants I1–I8 inchangés (`src/types/invariants.test.ts` → 16 tests verts) | **FAIT** (types + `null`/absent partout) |
| 3 | **D8-09 / DR-114** (dette D-45 levée) — vocabulaire des verdicts 6 → 8 codes | `src/types/vocabularies.ts` (`OUTLIER_FLAG_DEFS` à 8 codes, `OutlierFlagCode`, `OUTLIER_NOT_EVALUABLE_CODES`, `isOutlierFlagCode`, `isNotEvaluableOutlierCode`) ; `src/types/index.ts` | `npx vitest run --config vitest.review.config.ts tests/review/D2/open-points.test.ts tests/review/D2/reference-loader.test.ts` → verts avec `OUTLIER_FLAG_VALUES` à 8 ; `R-D4-05` reste `it.fails` **vert** (le moteur n'émet aucun verdict) | **FAIT côté vocabulaire** ; émission = fix-engine |
| 4 | **D8-11 / DR-105** — garde R3 étendu à E15–E17 | `src/types/validation.ts` (14 noms normalisés ajoutés à `R3_FORBIDDEN_FIELD_NAMES` : E15 `vin`, `vehicleidentificationnumber`, `chassisnumber` ; E16 `licenceplate`, `licenseplate`, `numberplate`, `registrationplate`, `plate`, `kenteken` ; E17 `belgiancarpassmileageurl`, `carpassmileageurl`, `carpassurl` ; en-têtes E1..E14 → E1..E17) | `npx vitest run --config vitest.review.config.ts tests/review/D2/r3-guard.test.ts` → `✓ R-D2-02 — rejette les champs RGPD E15..E17 (vin, licencePlate, belgianCarpassMileageUrl)` (**`it`**, plus `it.fails`) et `✓ R-D2-02 (formes imbriquées et aplaties)` ; `src/types/r3-sweep.test.ts` et `tests/review/D2/r3-repository-scan.test.ts` verts (aucun faux positif sur la taxonomie, les référentiels et les filtres retenus) | **FAIT**, sonde levée dans le même commit (D8-19) |
| 5 | **D8-07, types seulement** (dette D-17 levée) — statistiques dans le worker | **nouveau** `src/engine/stats-protocol.ts` (types purs) ; `src/engine/kernel.ts` (6 champs **optionnels** sur `RecalcResult`) ; `src/engine/index.ts` (réexports) ; `src/worker/README.md` (une ligne de table par champ, avec son exigence) | `npm run build` → tsc app + worker + vite, 0 erreur / 0 warning ; `npm test` → `615 passed` / `800 passed` (aucun consommateur cassé : les champs sont optionnels) | **FAIT côté types** ; calcul = fix-engine, consommation = fix-screens |
| 6 | Intendance — `npm run lint` rouge **avant** cette étape | `eslint.config.js` : `reports/**` ajouté aux `ignores` | `npm run lint` → vert (88 erreurs avant, toutes dans `reports/final-verification/scripts/*.cjs` de la phase 2.7 : 73 `no-undef` sur `console`/`process`, 12 `no-require-imports`, 3 variables inutilisées) | **FAIT** (voir §5, point 1) |

---

## 2. Symboles exportés (noms EXACTS, pour les clusters)

### 2.1 D8-08 — colonne TVA

| Symbole | Fichier | Signature / valeur |
|---|---|---|
| `ListingColumnBatch.vatDeductible` | `DataProvider.ts` | `readonly Uint8Array` — **colonne obligatoire** du lot |
| `VAT_DEDUCTIBLE` | `src/types/sentinels.ts` | `{ UNKNOWN: 0, NO: 1, YES: 2 } as const` |
| `VatDeductibleCode` | `src/types/sentinels.ts` | type — `0 \| 1 \| 2` |
| `readVatDeductible` | `src/types/sentinels.ts` | `(code: number) => boolean \| null` — `0` → `null`, **jamais `false`** |
| `encodeVatDeductible` | `src/types/sentinels.ts` | `(value: boolean \| null \| undefined) => VatDeductibleCode` |
| `SentinelPolicy` (`'tristate-zero'`) | `src/types/columns.ts` | nouvelle variante de la politique de sentinelle |
| `Listing.vatDeductible` | `src/types/columns.ts` | `boolean \| null` (vue logique de forage) |

**Attention, piège** : c'est la SEULE colonne dont l'inconnu vaut `0` et non `255`. Ne jamais lui
appliquer `readEnumByte` / `encodeEnumByte` ni `ENUM_UNKNOWN_BYTE`. L'allocation
(`new Uint8Array(rowCount)`) pose déjà l'état neutre.

### 2.2 D8-10 — agrégats et bloc statistique

| Symbole | Fichier | Signature / valeur |
|---|---|---|
| `MakeAggregate.modelCount` | `DataProvider.ts` | `number \| null` — **obligatoire** ; `null` = non calculé → l'écran affiche « — », **jamais `0`** |
| `MakeAggregate.coverageWarning` / `ModelAggregate.coverageWarning` | `DataProvider.ts` | `CoverageWarning \| undefined` |
| `MakeAggregate.samplingBias` / `ModelAggregate.samplingBias` | `DataProvider.ts` | `boolean \| undefined` |
| `MakeAggregate.adTierDistribution` / `ModelAggregate.adTierDistribution` | `DataProvider.ts` | `AdTierDistribution \| undefined` |
| `CoverageWarning` | `DataProvider.ts` (réexporté par `src/types`) | `{ price: boolean; year: boolean; mileage: boolean }` |
| `AdTierDistribution` | `DataProvider.ts` (réexporté par `src/types`) | `Readonly<Record<string, number>>` — clé = code `KYCAR_AD_TIER` |
| `MetricStats.iqr` | `src/types/entities.ts` | `number \| null` — `q3 − q1` |
| `MetricStats.coverage` | `src/types/entities.ts` | `number \| null` — `metricCoverage = n_m / N` (EX-DATA-61), **ni** `sampleCoverage` **ni** `priceQuotedShare` |

### 2.3 D8-09 — verdicts d'outliers

| Symbole | Fichier | Signature / valeur |
|---|---|---|
| `OUTLIER_FLAG_VALUES` | `src/types/vocabularies.ts` | 8 `EnumValueDef` : `M1_LOW`, `M1_HIGH`, `M2_LOW`, `M2_HIGH`, `M1_M2_AGREE_LOW`, `M1_M2_AGREE_HIGH`, **`INSUFFICIENT_DATA`**, **`INSUFFICIENT_SPREAD`** |
| `OutlierFlagCode` | `src/types/vocabularies.ts` | type — union littérale des 8 codes |
| `OUTLIER_NOT_EVALUABLE_CODES` | `src/types/vocabularies.ts` | `readonly OutlierFlagCode[]` — les deux codes de non-évaluabilité |
| `isOutlierFlagCode` | `src/types/vocabularies.ts` | `(code: string) => code is OutlierFlagCode` |
| `isNotEvaluableOutlierCode` | `src/types/vocabularies.ts` | `(code: string) => boolean` |

### 2.4 D8-11 — garde R3

`R3_FORBIDDEN_FIELD_NAMES` (`src/types/validation.ts`) est inchangée dans son type et sa
signature ; elle porte 14 noms de plus. Les clés sont comparées **normalisées** (`normalizeKey`
replie la casse et retire `_`, `-` et l'espace) : une seule entrée couvre la forme imbriquée, la
forme aplatie et les variantes `licence_plate` / `licence-plate` / `licencePlate`.

### 2.5 D8-07 — protocole worker (types seulement)

Tous dans **`src/engine/stats-protocol.ts`**, réexportés par `src/engine/index.ts` :
`GroupStatKey`, `GroupStatEntry`, `GroupStatSet`, `NtileSlice`, `NtileResult`, `PowerTierEntry`,
`PowerTierResult`, `DepreciationEntry`, `DepreciationIndexResult`, `CellLevel`, `CellStat`,
`ScatterSampleSummary`.

Champs ajoutés à `RecalcResult` (`src/engine/kernel.ts`), **tous optionnels** :

| Champ | Type | Exigence |
|---|---|---|
| `groupStats?` | `readonly GroupStatSet[]` | EX-DATA-83bis (+ EX-DATA-61/64, ARB-36) |
| `ntiles?` | `NtileResult` | EX-DATA-83ter |
| `powerTiers?` | `PowerTierResult` | EX-DATA-83quater |
| `depreciationIndex?` | `DepreciationIndexResult` | EX-DATA-83quinquies |
| `cellStats?` | `readonly CellStat[]` | EX-DATA-86 / 87 / 93bis, EX-SCR-164 |
| `sample?` | `ScatterSampleSummary` | EX-DATA-99 à 103, EX-DATA-118 |

Le détail champ par champ, avec l'exigence de chacun et la contrainte de clonage structuré, est
dans **`src/worker/README.md`**.

---

## 3. Sondes adaptées (D-31 / D8-19) et sonde levée

Aucune sonde n'a été modifiée dans son INTENTION. Quatre adaptations, chacune causée par un
amendement d'entité gelée, chacune justifiée dans le fichier même :

| Sonde / fichier | Adaptation | Justification |
|---|---|---|
| `tests/review/D2/dictionary-fields.test.ts` | « exactement **19** colonnes énumérées sur un octet » → **20** (titre du `it` mis à jour) | **D8-08** amende l'interface gelée 2.3 ; la sonde figeait la cardinalité d'AVANT l'amendement. L'assertion normative (le descripteur est aligné colonne par colonne sur `ListingColumnBatch`) est inchangée, et elle est contrôlée par `provider-contract.test.ts`, qui compare les deux listes et reste verte sans retouche. |
| `tests/review/D4/quantiles-bin.test.ts` | `n = 0` : l'objet attendu du `toEqual` reçoit `iqr: null, coverage: null` | **D8-10** ajoute deux champs à `MetricStats` et la sonde compare l'entité ENTIÈRE. Le fait mesuré — à `n = 0` le bloc est entièrement nul — est conservé tel quel. |
| `tests/review/D2/open-points.test.ts` | `expect(OUTLIER_FLAG_VALUES).toHaveLength(6)` → `(8)` | **D8-09** porte le vocabulaire de 6 à 8 codes. La sonde figeait la cardinalité ; le fait mesuré (le barrel exporte le vocabulaire) est inchangé. |
| `tests/review/D2/reference-loader.test.ts` | `expect(n('KYCAR_OUTLIER_FLAG')).toBe(6)` → `(8)` | idem D8-09, côté chargeur de référentiels. |

**Sonde levée (D8-19)** : `tests/review/D2/r3-guard.test.ts › R-D2-02` repasse de `it.fails` à
**`it`**, verte, dans le commit même de la correction (`d3874d9`), sans que ses trois assertions
soient touchées. Un second cas (`R-D2-02 (formes imbriquées et aplaties)`) est ajouté à côté : il
exerce `{ vehicle: { vin } }`, `licence_plate`, `licence-plate`, `belgian_carpass_mileage_url`, et
re-contrôle que `sellerType` / `regionCode` / `postalCodePrefix2` (EX-DATA-42) restent autorisés —
le garde est ÉLARGI, jamais relâché.

**Sondes ajoutées** : 2 (`# 10 vatDeductible` dans `dictionary-fields`, `R-D2-02 (formes
imbriquées et aplaties)` dans `r3-guard`). La suite de revue passe donc de **798** à **800**.

**Sondes NON touchées, à traiter par fix-engine** : les quatre sondes vertes qui exigent « aucun
verdict sous `n = 12` » décrivent le moteur TEL QU'IL EST après cette étape (le vocabulaire est
étendu, l'émission ne l'est pas). Elles ne deviendront contradictoires qu'au moment où fix-engine
émettra les verdicts `INSUFFICIENT_*` : c'est à lui de les amender, avec justification, dans le
commit qui change le comportement (D-31). `R-D4-05` reste `it.fails` **vert** jusque-là — son
assertion de vocabulaire passe désormais, son assertion de comportement (11 verdicts à `n = 11`)
échoue toujours, donc le `it.fails` tient.

---

## 4. Vérifications

```
npm run build                              → tsc app + worker + vite build, 0 erreur / 0 warning
npm run lint                               → eslint ., vert
npm test                                   → 615 passed (615), puis 800 passed (800)
npx tsc --noEmit -p tsconfig.review.json   → 0 erreur
npm run size                               → initial 99,46 / 300 Kio gzip ; différé 0,00 / 400 Kio
```

Suite unitaire : **615 → 615** (aucun test unitaire ajouté ni modifié dans son intention).
Suite de revue : **798 → 800** (+2 sondes, §3).

### Diff des deux copies de l'interface gelée

```
$ diff docs/plans/DataProvider.ts src/providers/DataProvider.ts
$ echo $?
0
```

Sortie **vide** après les deux amendements (`vatDeductible`, agrégats de D8-10).

---

## 5. Points ouverts / à savoir pour la suite

1. **`npm run lint` était rouge AVANT cette étape** (88 erreurs, phase 2.7, commit `427f820`), et
   il l'est resté jusqu'au commit `5ce15fb`. Toutes les erreurs venaient de
   `reports/final-verification/scripts/*.cjs` et `render-matrix.mjs`, pilotes Playwright CommonJS
   lus sous les globales navigateur de la configuration produit. Correction retenue : `reports/**`
   rejoint `scripts/**` dans les `ignores` d'`eslint.config.js` — ce sont des artefacts de preuve,
   pas du code produit, et aucun script de preuve n'a été modifié. **À ratifier par le fix-lead** :
   si la porte G7 exige que ces scripts soient lintés, il faut au contraire leur donner un bloc
   `languageOptions.globals` Node, ce qui suppose de corriger les 12 `no-require-imports` et les
   3 variables inutilisées — hors mandat de l'étape 0.
2. **Sonde sensible à la charge : `tests/review/D3/dataset-100k.test.ts › R-D3-02`.** Elle mesure
   du temps mural contre un budget de 200 ms. À HEAD, isolée : `openSnapshot` = **175, 190 et
   178 ms** sur trois exécutions, et `npm test` complet est **vert**. Elle a échoué (234 ms,
   359 ms) pendant les exécutions où la machine était saturée (load average 3,6 sur 4 cœurs :
   l'agent E2E parallèle). Ce n'est pas une régression de cette étape : la colonne ajoutée par
   D8-08 coûte **une** allocation `Uint8Array` de 100 000 octets, mesurée à **0,056 ms**, et n'est
   jamais écrite dans la boucle de génération. **La marge réelle de cette sonde est d'environ
   10 %** : fix-verify doit la rejouer sur une machine au repos.
3. **`EX-DATA-119` (annexe A) est à amender par fix-docs** : la table de disposition physique
   annonce 19 colonnes énumérées sur un octet et ne connaît pas `vatDeductible` (champ # 10
   `isTaxDeductible`). Après D8-08 : **20** colonnes d'un octet, **+1 octet par ligne** (≈ 252 au
   lieu de ≈ 251, sans effet sur `EX-NFR-3`). L'annexe doit aussi dire que cette colonne est la
   seule à sentinelle `0`.
4. **`EX-DATA-85` (annexe A) dit « 6 codes » en nommant les 8** (`LOW_PRICE_IQR`, `HIGH_PRICE_IQR`,
   `LOW_PRICE_MODEL`, `HIGH_PRICE_MODEL`, `INSUFFICIENT_DATA`, `INSUFFICIENT_SPREAD`) : le décompte
   est faux dans le texte lui-même, indépendamment de la divergence de NOMMAGE avec le vocabulaire
   gelé (`M1_LOW`… , signalée en 2.3, non corrigée). fix-docs doit porter le décompte à 8 ET
   trancher le nommage — le code émet les noms du vocabulaire gelé.
5. **`EX-DATA-49` est à amender par fix-docs** : elle ne cite que E1..E14 alors que le garde couvre
   désormais E15..E17 (D8-11). Le texte d'`EX-DATA-47` n'a pas à bouger, il proscrivait déjà ces
   trois champs.
6. **`MetricStats` publie 12 des 13 valeurs d'EX-DATA-64.** `count` (`N = |Σ|`) reste hors du bloc :
   il est porté par le conteneur (`SelectionStats.selectionCount`, `MakeAggregate.listingCount`),
   et le dupliquer dans chaque bloc de métrique aurait créé trois copies d'une même valeur.
   D8-10 ne le demandait pas ; à trancher par le fix-lead si `EX-DATA-64` doit être tenue à la
   lettre.
7. **`MakeAggregate` n'a toujours ni `displayRange`, ni `rawRange`, ni `rank`, ni `makeName`, ni
   `modelUnresolvedCount`, ni les trois compteurs de prix** cités par `EX-DATA-68`. D8-10 ne les
   demandait pas (dérivables au rendu depuis `price`/`mileage`/`year` et l'ordre de tri) : le
   résidu de DR-122 est donc **partiellement** soldé. Signalé pour arbitrage.
8. **fix-providers** : `vatDeductible` est allouée à `0` partout. La génération plausible (part de
   professionnels déductibles) et le mapping du champ BTW/TVA de 2dehands sont à sa charge ;
   `modelCount`, `iqr`, `coverage`, `coverageWarning`, `samplingBias`, `adTierDistribution` aussi.
   Utiliser `encodeVatDeductible`, jamais un littéral.
9. **fix-engine** : le moteur doit émettre `INSUFFICIENT_DATA` / `INSUFFICIENT_SPREAD` (D8-09) et
   remplir les six champs de `RecalcResult` (D8-07). `iqr` de `MetricStats` est à sa portée
   immédiate (`p75 − p25`, mêmes quantiles de type 7) ; `coverage` exige `N`, que
   `exactMetricStats` ne connaît pas — c'est l'appelant qui devra le fournir.
10. **fix-app** : `src/worker/client.ts` reçoit `batch.vatDeductible` dans sa liste de transfert,
    par cohérence avec les 33 autres colonnes. **D8-01 supprime cette liste entière** (envoi par
    copie structurée) : la ligne ajoutée disparaîtra avec elle, il n'y a rien à conserver.
11. **fix-screens** : la colonne « TVA » de l'écran D (`R-D7-16`, encore `it.fails`) et l'affichage
    de `modelCount` (« — » et jamais `0`, FV-02) sont à sa charge ; `readVatDeductible` rend
    `null` pour l'inconnu, à rendre par une cellule VIDE (jeton `TVA déd.` seulement pour `true`).

---

## 6. Commits

| SHA | Message |
|---|---|
| `a89ca27` | Phase 2.8 step 0 (D8-08, DR-082): ListingColumnBatch carries the tri-state vatDeductible column |
| `22c1625` | Phase 2.8 step 0 (D8-10, DR-122): MakeAggregate.modelCount plus the published MetricStats block |
| `4cb157f` | Phase 2.8 step 0 (D8-09, DR-114): KYCAR_OUTLIER_FLAG goes from 6 to 8 codes |
| `d3874d9` | Phase 2.8 step 0 (D8-11, DR-105): the R3 guard covers E15 to E17, R-D2-02 back to it |
| `74b430f` | Phase 2.8 step 0 (D8-07, types only): RecalcResult carries the worker statistics protocol |
| `5ce15fb` | Phase 2.8 step 0 (housekeeping): eslint ignores reports/, npm run lint green again |

Rien n'est poussé : le push relève du coordinateur (CLAUDE.md §1.3).
