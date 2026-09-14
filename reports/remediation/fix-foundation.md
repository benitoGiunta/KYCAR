# fix-foundation — étape 0 de la phase 2.6

**Agent `fix-foundation` (Opus, effort high), 2026-09-08. Branche `claude/kycar-project-ffcplk`,
arbre principal.** Cette étape élargit les interfaces gelées et pose les symboles partagés dont les
cinq clusters de la vague F1 dépendent. Elle ne branche RIEN dans les providers ni dans le moteur :
c'est le travail des clusters.

Mandat : `reports/remediation/FIX-LEAD-DECISIONS.md` D-01, D-02, D-03 (champ d'interface), D-31, §C,
et `reports/DEV-REVIEW.md` DR-007, DR-013, DR-012, DR-001, DR-003, DR-004, DR-008, DR-025.

---

## 1. Décision / constat → modification → preuve

| # | Décision / constat | Modification (fichiers) | Preuve (commande + sortie) | Statut |
|---|---|---|---|---|
| 1 | **D-02 / DR-007** — `ListingColumnBatch.makeId` en `Int16Array` alors que 158 des 295 marques ont un identifiant > 32 767 (max relevé **53 488** dans `data/reference/taxonomy.json`) : 158 cartes hors taxonomie portant 17 988 annonces sur 100 000 | `src/providers/DataProvider.ts`, `docs/plans/DataProvider.ts` (`Int32Array`), `src/types/columns.ts` (`physical: 'Int32Array'`), `src/providers/synthetic/columnar.ts` (type + allocation), `src/providers/synthetic/generate.ts` (`makeIdByRow`), `src/engine/synthetic.ts`, `src/providers/mock-provider.test.ts` | `npx vitest run --config vitest.review.config.ts tests/review/D8/parcours.test.ts` → `[R-D8-31] cartes hors taxonomie : 0 sur 295, 0 annonces ; exemples :` puis `✓ … R-D8-31` | **FAIT** |
| 1bis | **D-02, domaine de `modelId`** — à vérifier | aucune | `node -e` sur `data/reference/taxonomy.json` et `taxonomy-all.json` → `maxMakeId 53488 maxModelId 79983` | **VÉRIFIÉ, INCHANGÉ** : `modelId` est déjà `Int32Array` et 79 983 y tient largement. Aucune autre colonne n'est élargie. |
| 2 | **D-01 / DR-013 (O13)** — `ingestFlags` en `Uint16Array` : le 17ᵉ code d'EX-DATA-45, `MARKETPLACE_UNMAPPED` (repli d'ARB-60 pour ADV-15), est instockable au bit 16 et `ingestFlagCounts` ne peut jamais le compter (EX-DATA-46 inatteignable) | `src/providers/DataProvider.ts` + `docs/plans/DataProvider.ts` (`Uint32Array` + commentaire normatif), `src/types/columns.ts` (`bitset32` ajouté à `ColumnPhysicalType`, `ingestFlags` en `bitset32`), `src/types/vocabularies.ts` (`INGEST_FLAG_BIT`, `INGEST_FLAG_BIT_CAPACITY`, `IngestFlagCode`, `hasIngestFlag`, `setIngestFlag`, `ingestFlagCodes`), `src/types/index.ts` (barrel), `src/engine/flags.ts` (consomme la table, garde de capacité), `src/providers/synthetic/columnar.ts`, `src/engine/synthetic.ts`, `src/providers/mock-provider.test.ts` | `npx vitest run --config vitest.review.config.ts tests/review/D2/open-points.test.ts` → `✓ … R-D2-18 — les 17 drapeaux tiennent dans le Uint32Array de la colonne (32 bits, D-01)` et `✓ … R-D2-18 (ADV-15) — le repli d'ARB-60 (MARKETPLACE_UNMAPPED) est stockable dans ingestFlags` | **FAIT** — encodage positionnel conservé (bit = rang dans `INGEST_FLAG_VALUES`), 17 codes posés, 15 bits de réserve. `booleanFlags` reste `Uint16Array`. |
| 3 | **DR-012** — `scanForbiddenFields` rejette `seller.name` imbriqué mais laisse passer la forme aplatie `sellerName` | `src/types/validation.ts` : 23 formes aplaties ajoutées à `R3_FORBIDDEN_FIELD_NAMES` + généralisation `isFlattenedSellerIdentifier` (préfixe `seller`/`dealer`/`vendor` + suffixe ∈ `FORBIDDEN_UNDER_SELLER`) | `npx vitest run --config vitest.review.config.ts tests/review/D2/r3-guard.test.ts` → `✓ … R-D2-01 — rejette sellerName, nom de vendeur à plat (E2/E3)` ; `npm test` → `551 passed` (aucune régression sur `listings.test.ts`, `csv-export`, `r3-repository-scan`) | **FAIT** — R3 est seulement ÉLARGI, jamais relâché ; `sellerType`, `regionCode`, `postalCodePrefix2` restent autorisés (EX-DATA-42). |
| 4 | **D-03 (champ d'interface seulement)** — exposer `unsupportedFilterIds` | `src/providers/DataProvider.ts` + `docs/plans/DataProvider.ts` (champ obligatoire sur `AggregateResult<T>` + commentaire normatif), `src/providers/synthetic/SyntheticDataProvider.ts` (`compiled.unsupported`, `[]` pour la ligne de base), `src/providers/tweedehands/TweedehandsDataProvider.ts` (`[]`), mocks | `npm run build` → 0 erreur ; `npx tsc --noEmit -p tsconfig.review.json` → 0 erreur ; `npm test` → `551 passed` | **FAIT pour `fetchAggregates`/`fetchBaselineAggregates`**, **NON FAIT pour `fetchSelectionCount`** — voir §5. |
| 5 | **§C — exports partagés de `src/types`** (DR-001, DR-003, DR-004, DR-008, DR-025) | **nouveau** `src/types/shared-rules.ts` + `src/types/shared-rules.test.ts` (15 tests), réexporté par `src/types/index.ts`, documenté dans `src/types/README.md` | `npx vitest run src/types/shared-rules.test.ts` → `Tests 15 passed (15)` ; sondes « symbole absent » passées au vert : `R-D2-08`, `R-D2-19`, `R-D2-23`, `R-D2-24` | **FAIT** |

### Symboles exportés par `src/types` (noms EXACTS, pour les clusters)

| Symbole | Fichier | Signature / valeur |
|---|---|---|
| `PRICE_SENTINEL_ABSOLUTE_EUR` | `shared-rules.ts` | `250` |
| `isPriceSentinelAbsolute` | `shared-rules.ts` | `(priceEur: number \| null \| undefined) => boolean` — strict `< 250` ; `null`, `undefined` et la sentinelle `-1` rendent `false` |
| `HP_TO_KW` | `shared-rules.ts` | `0.7355` |
| `hpToKw` | `shared-rules.ts` | `(hp: number) => number` — produit exact, **aucun arrondi intermédiaire** |
| `listingKey` | `shared-rules.ts` | `(snapshotId: SnapshotId, listingId: string) => string` — `` `${snapshotId}:${listingId.toLowerCase()}` `` |
| `DUPLICATE_CONFLICT_FIELDS` | `shared-rules.ts` | `['priceEur','priceStatus','mileageKm','firstRegistrationYearMonth'] as const` |
| `DuplicateConflictField` | `shared-rules.ts` | type — union des quatre noms |
| `MODEL_VERSION_CLEAN_MAX` | `shared-rules.ts` | `80` (points de code) |
| `cleanModelVersion` | `shared-rules.ts` | `(raw: string \| null \| undefined) => string` |
| `INGEST_FLAG_BIT` | `vocabularies.ts` | `Readonly<Record<IngestFlagCode, number>>` — **numéro de bit**, pas un masque |
| `INGEST_FLAG_BIT_CAPACITY` | `vocabularies.ts` | `32` |
| `IngestFlagCode` | `vocabularies.ts` | type — union littérale des 17 codes d'EX-DATA-45 |
| `hasIngestFlag` | `vocabularies.ts` | `(flags: number, code: IngestFlagCode) => boolean` |
| `setIngestFlag` | `vocabularies.ts` | `(flags: number, code: IngestFlagCode) => number` — masque non signé, jamais muté en place |
| `ingestFlagCodes` | `vocabularies.ts` | `(flags: number) => readonly IngestFlagCode[]` — ordre d'EX-DATA-45 |
| `unsupportedFilterIds` | `DataProvider.ts` | champ **obligatoire** de `AggregateResult<T>` : `readonly string[]` |

`MODEL_UNRESOLVED_ID` **n'a pas été créé** : la couche exporte déjà cette valeur, sous le nom
`MODEL_ID_UNRESOLVED` (`src/types/sentinels.ts`, `0`, EX-DATA-72), et c'est ce nom que les sondes
`R-D2-…`, `R-D6-…` et `R-D9-…` importent. Un second nom pour la même valeur aurait recréé la
duplication que cette étape supprime. **Les clusters utilisent `MODEL_ID_UNRESOLVED`.**

---

## 2. Sondes de revue passées au vert

`npm run test:review` — **avant : 205 rouges sur 783** (55 fichiers en échec) ; **après : 198 rouges
sur 783** (55 fichiers). Solde : **8 sondes passées au vert, 1 sonde nouvellement rouge** (§4).

| Sonde | Fichier | Constat |
|---|---|---|
| `R-D8-31` | `tests/review/D8/parcours.test.ts` | DR-007 — 0 carte hors taxonomie sur 295 (contre 158 / 17 988 annonces) |
| `R-D2-18` | `tests/review/D2/open-points.test.ts` | DR-013 — les 17 drapeaux tiennent dans la colonne |
| `R-D2-18 (ADV-15)` | `tests/review/D2/open-points.test.ts` | DR-013 / ARB-60 — `MARKETPLACE_UNMAPPED` stockable |
| `R-D2-19` | `tests/review/D2/open-points.test.ts` | DR-025 — la limite 80 caractères est portée par D2 |
| `R-D2-01` | `tests/review/D2/r3-guard.test.ts` | DR-012 — `sellerName` aplati rejeté |
| `R-D2-08` | `tests/review/D2/sentinels-prices.test.ts` | DR-001 — le seuil 250 € est exprimé dans la couche types |
| `R-D2-23` | `tests/review/D2/adv05-duplicates.test.ts` | DR-003 — `listingKey` exposée |
| `R-D2-24` | `tests/review/D2/adv05-duplicates.test.ts` | DR-004 — `DUPLICATE_CONFLICT_FIELDS` exposée |

Les autres rouges restent rouges : elles portent sur le COMPORTEMENT des providers et du moteur
(pose effective des drapeaux, déduplication, conversion ch → kW, pipeline de nettoyage câblé), qui
relève des clusters F1. C'est le résultat attendu de l'étape 0.

---

## 3. Sondes adaptées (D-31)

Aucune sonde n'a été modifiée dans son INTENTION. Neuf fichiers de `tests/review/` ont reçu une
adaptation **de type** rendue indispensable par l'élargissement des colonnes ou par l'ajout d'un
champ obligatoire à l'interface. Chaque adaptation est justifiée par la décision qui la cause.

| Fichier | Adaptation | Justification |
|---|---|---|
| `tests/review/D2/dictionary-fields.test.ts` | `col('makeId').physical` : `'Int16Array'` → `'Int32Array'` (titre du `it` mis à jour) | **D-02** amende explicitement l'interface gelée 2.3 ; la sonde asserte le type d'AVANT l'amendement. Le fait mesuré (le descripteur est aligné sur `ListingColumnBatch`) est inchangé. |
| `tests/review/D2/dictionary-fields.test.ts` | comptage des champs de bits : `physical === 'bitset16'` → `'bitset16' \|\| 'bitset32'`, toujours `toHaveLength(2)` | **D-01** ; l'assertion normative (« exactement 2 champs de bits », EX-DATA-119) est conservée telle quelle. |
| `tests/review/D2/open-points.test.ts` | `fait 2` : `ingestFlags` `'bitset16'` → `'bitset32'` | **D-01** ; `booleanFlags` reste `'bitset16'`, l'assertion sur l'encodage POSITIONNEL est conservée. |
| `tests/review/D2/open-points.test.ts` | `R-D2-18` : seuil `bit > 15` → `bit > 31` ; `R-D2-18 (ADV-15)` : `toBeLessThanOrEqual(15)` → `(31)` | **D-01** porte la capacité de la colonne de 16 à 32 bits. La constante `15` n'était que l'écriture de la largeur `Uint16` que D-01 amende ; **sans cette adaptation la sonde est insatisfaisable**, puisqu'elle compare l'index de tableau (16 pour le 17ᵉ code, imposé par le `fait 1` de la même sonde) à la largeur de la colonne. |
| `tests/review/D2/provider-contract.test.ts` | `new Int16Array(0)` → `Int32Array`, `new Uint16Array(0)` → `Uint32Array` (colonnes `makeId`/`ingestFlags`), littéral `AggregateResult` complété par `unsupportedFilterIds: []` | D-01, D-02, D-03 — la sonde construit elle-même le lot et le résultat. |
| `tests/review/patho/_fixtures.ts` | idem | D-01, D-02, D-03 |
| `tests/review/D4/helpers.ts` | `makeId`/`ingestFlags` retypés | D-01, D-02 |
| `tests/review/D4/invariants-mutation.test.ts` | `Uint16Array.from(batch.ingestFlags)` et `as Uint16Array` → `Uint32Array` | D-01 — la sonde copie la colonne pour la muter. |
| `tests/review/D8/persistence.test.ts` | littéral `baseline` complété par `unsupportedFilterIds: []` | D-03 — champ obligatoire de `AggregateResult`. |

Aucune assertion de comportement, aucun seuil métier, aucune valeur attendue n'a été touchée.

---

## 4. Sonde nouvellement rouge — à traiter par fix-engine

`tests/review/D4/pruning-facets-density.test.ts › EX-DATA-116 — équivalence élagage / balayage
complet (20 sélections aléatoires, graine 2025) › mêmes statistiques, agrégats, histogrammes,
cellules de densité et verdicts que la référence brute` était **verte avant**, elle est **rouge
après**. Vérifié par un worktree sur le commit de base `a01294f` (`8 passed`) puis sur `HEAD`
(`1 failed | 7 passed`).

**Ce n'est pas une régression de valeur, c'est un défaut latent démasqué.** Mécanisme établi :

1. La sonde ouvre le vrai générateur synthétique (`openSyntheticProvider(ref, 10 000, 7)`), donc les
   `makeId` viennent de la taxonomie. **Avant DR-007** ils débordaient l'`Int16Array` et 158 marques
   devenaient négatives ; les clés de `dataset.indexes.makeOffsets` — et donc les 20 sélections
   tirées à la graine 2025 — n'étaient plus les mêmes qu'aujourd'hui. La correction change le jeu de
   sélections testées, pas le calcul.
2. Sur l'une des nouvelles sélections, `deviationPct` d'un verdict M2 diffère entre le chemin élagué
   et le balayage brut à la **dernière décimale de l'arrondi à 9 chiffres**
   (`24106.360448583` contre `24106.360448582`, `expectedPriceEur` identique à l'arrondi).
3. Cause : `candidateRows` (`src/engine/scan.ts` l. 33-73) **concatène les tranches d'index
   marque par marque** sans les refusionner en ordre d'indice croissant, alors que la référence
   brute balaie `0..N-1`. Pour une sélection à deux marques, les deux chemins somment donc les mêmes
   valeurs dans un ORDRE différent : la régression des moindres carrés de M2 rend un `β̂` distinct
   d'un ulp, ce qui bascule l'arrondi.

`EX-DATA-116` exige l'identité des chiffres entre chemin élagué et balayage complet ; la propriété
est donc violée au sens strict. **Non corrigé ici** : `src/engine/scan.ts` appartient au cluster
`fix-engine` (D-20) et l'étape 0 n'a pas mandat d'y toucher. Correction attendue : rendre l'ordre de
visite des lignes candidates **globalement croissant** (fusion triée des tranches d'index, ou tri de
`rows` avant retour), ce qui rend les deux chemins bit à bit identiques. La sonde passera alors sans
être modifiée.

---

## 5. Point NON résolu — `unsupportedFilterIds` sur `fetchSelectionCount`

D-03 demande le champ « sur les résultats de `fetchAggregates` **et** `fetchSelectionCount` ». Le
type de retour de `fetchSelectionCount` est `Promise<number>` : une primitive ne porte pas de champ.
Les deux façons de l'y loger ont été écartées :

- **envelopper le nombre dans un objet** : quatorze appels de sondes de `tests/review/` comparent ce
  résultat arithmétiquement (`toBe(N)`, `.valueOf()`, `toBeLessThan`, `not.toBe`) —
  `D3/contract-labeling`, `D9/capabilities-mode1`, `D9/no-network`, `patho/sollicitation`,
  `patho/bloquants-st`, `D8/fallback`, `D8/_helpers`. Il aurait fallu réécrire des assertions de
  COMPORTEMENT, ce que D-31 interdit ; pire, `R-PATHO-15` (`expect(enCh).not.toBe(enKw)`) serait
  passée au vert **par accident** (deux objets ne sont jamais `toBe`-égaux), c'est-à-dire une preuve
  fausse sur un constat BLOQUANT ;
- **boxer en `Number`** : même effet de bord sur `not.toBe`.

Retenu : `AggregateResult` porte le champ (il sert `fetchAggregates` **et**
`fetchBaselineAggregates`, les deux seules méthodes que le contrôleur appelle — vérifié :
`src/orchestration/data-controller.ts` n'appelle jamais `fetchSelectionCount`), et l'interface
documente à l'endroit de `fetchSelectionCount` où lire la même information. **À arbitrer par le
fix-lead** si un consommateur de `fetchSelectionCount` (effectif initial d'une recherche sauvegardée,
`EX-CRUD-1`) doit lui aussi être protégé : il faudra alors soit une méthode distincte, soit la
promotion des sondes concernées.

---

## 6. Vérifications

```
npm run build                              → tsc app + worker + vite build, 0 erreur / 0 warning
npm run lint                               → eslint ., vert
npm test                                   → Test Files 48 passed (48) · Tests 551 passed (551)
npx tsc --noEmit -p tsconfig.review.json   → 0 erreur
npm run test:review                        → Tests 198 failed | 585 passed (783)
```

Suite par défaut : **536 → 551** tests (+15, les tests unitaires de `src/types/shared-rules.test.ts`).
Aucun test existant de la suite par défaut n'a été modifié.

### Diff des deux copies de l'interface gelée

```
$ diff docs/plans/DataProvider.ts src/providers/DataProvider.ts
$ echo $?
0
```

Sortie **vide** : les deux copies restent identiques octet à octet, après les trois amendements
(`makeId`, `ingestFlags`, `unsupportedFilterIds`).

---

## 7. Ce que les clusters suivants doivent savoir

1. **Partir de la version corrigée de l'interface.** `ListingColumnBatch.makeId` est un
   `Int32Array`, `ListingColumnBatch.ingestFlags` un `Uint32Array`, `AggregateResult` porte un champ
   **obligatoire** `unsupportedFilterIds: readonly string[]`. Tout mock d'un `AggregateResult` doit
   le renseigner, toute allocation de colonne doit utiliser le bon tableau typé.
2. **Aucun `1 << n` littéral pour un drapeau d'ingestion.** La table `INGEST_FLAG_BIT` est la seule
   source ; `setIngestFlag` / `hasIngestFlag` / `ingestFlagCodes` en dérivent. **fix-providers** :
   `src/providers/synthetic/generate.ts` l. 469 pose encore `ingestFlags |= 1 << 8`
   (`SUSPECT_ZERO_MILEAGE`) en dur — à remplacer par `setIngestFlag(..., 'SUSPECT_ZERO_MILEAGE')` en
   même temps que DR-001.
3. **Les symboles partagés sont définis, pas branchés.** `isPriceSentinelAbsolute` n'est appelée
   nulle part (DR-001 → fix-providers), `hpToKw` non plus (DR-008 → fix-engine, consommée ensuite par
   `compileSelection`), `listingKey` / `DUPLICATE_CONFLICT_FIELDS` non plus (DR-003/DR-004 →
   fix-providers), `cleanModelVersion` non plus (DR-025 → fix-engine puis les deux providers).
4. **`cleanModelVersion` est partielle et le dit.** Elle applique les étapes 1, 2, 4, 5 et 6
   d'EX-DATA-29 (NFKC, pictogrammes, suites décoratives, ponctuation résiduelle, compactage et
   troncature ARB-61/ARB-24). L'étape 3 (liste d'arrêt `data/reference/version-stoplist.json`,
   EX-DATA-30) et les étapes 7 à 10 (jetonisation, cylindrée et puissance au badge, lexique de
   motorisation) manquent parce que les deux fichiers de référence sont **absents du dépôt** ; leur
   portage est le reste de DR-025 et s'insère dans la fonction sans changer sa signature. Écart
   assumé et documenté sur EX-DATA-29 étape 5 : les marques combinantes (`\p{M}`) sont CONSERVÉES
   avec leur lettre, faute de quoi ARB-24 n'aurait plus d'objet.
5. **`MODEL_ID_UNRESOLVED`**, pas `MODEL_UNRESOLVED_ID`.
6. **fix-docs** : `docs/requirements/draft-data-dictionary.md` l. 1825 et 1829 (table de disposition
   physique d'EX-DATA-119) annoncent encore `makeId` en `Int16Array` (2 octets) et
   « 2 × `Uint16Array` de bits » (4 octets). Après D-01/D-02 : `makeId` **4 octets**, drapeaux
   **6 octets** (`Uint16Array` + `Uint32Array`), total colonnes numériques et énumérées **≈ 75** au
   lieu de ≈ 71 — soit +4 octets par ligne sur ≈ 251, +1,6 %, sans effet sur `EX-NFR-3` (≤ 6 Mo
   gzip). `docs/EXECUTION-LOG.md` l. 98 (point ouvert O13) est à clore par D-01 : 17 codes,
   `Uint32Array`, table explicite. La ligne §A.1 « 14 codes » reste à porter à 17 (D-01).
7. **fix-app** : le contrôleur (`src/orchestration/data-controller.ts`) ne lit pas encore
   `unsupportedFilterIds` — l'état dégradé `ET-FILTRE-NON-APPLIQUE` de D-03 reste à câbler, sur les
   résultats de `fetchAggregates` (voir §5 pour `fetchSelectionCount`).
8. **fix-engine** : la sonde d'équivalence `EX-DATA-116` de `tests/review/D4/pruning-facets-density`
   attend une fusion **triée** des tranches d'index dans `candidateRows` (§4).

---

## 8. Commits

| SHA | Message |
|---|---|
| `754c9ec` | Phase 2.6 step 0 (D-02, DR-007): widen ListingColumnBatch.makeId to Int32Array |
| `b15425a` | Phase 2.6 step 0 (D-01, DR-013): widen ingestFlags to Uint32Array, add the explicit bit table |
| `8127e96` | Phase 2.6 step 0 (DR-012): R3 guard now rejects the flattened seller field names |
| `48be5d4` | Phase 2.6 step 0 (D-03, interface field): AggregateResult carries unsupportedFilterIds |
| `ef90540` | Phase 2.6 step 0: shared rules exported by src/types for the F1 clusters |

Rien n'est poussé : le push relève du coordinateur (CLAUDE.md §1.3).
