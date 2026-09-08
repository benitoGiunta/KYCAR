# fix-providers — remédiation 2.6 du cluster `src/providers`

**Agent `fix-providers` (Opus, effort high), 2026-09-08. Worktree `/home/user/kycar-wt/providers`,
branche `fix/providers`, partie du commit `8c427b0` (fin de l'étape 0 `fix-foundation`).**

Mandat : `reports/DEV-REVIEW.md` §3 (lignes de cluster `fix-providers`), §6.2 (ordre),
§6.3/§6.4/§6.5 ; `reports/remediation/FIX-LEAD-DECISIONS.md` D-01, D-03, D-08 (côté provider),
D-18, D-29, D-30, D-31, D-32, D-33, D-35.

Périmètre d'écriture tenu : `src/providers/synthetic/`, `src/providers/tweedehands/`,
`src/providers/README.md`, plus **trois sondes adaptées** (§3, justifiées une par une).
`src/providers/DataProvider.ts` n'a **pas** été touché — `diff docs/plans/DataProvider.ts
src/providers/DataProvider.ts` reste vide.

---

## 1. Constat → correction → preuve → statut

Ordre imposé par `DEV-REVIEW` §6.2. `DR-007` et `DR-013`, en tête de cet ordre, avaient été traités
par l'étape 0 (`fix-foundation`) : ce lot en CONSOMME le résultat (`Int32Array`, `Uint32Array`,
table `INGEST_FLAG_BIT`).

| # | Constat | Correction (fichiers) | Preuve (commande + extrait) | Statut |
|---|---|---|---|---|
| 1 | **DR-001** (BLOQUANT) — le seuil de sentinelle absolue de 250 € n'existe dans aucun provider : aucun drapeau `PRICE_SENTINEL_ABSOLUTE` posé, aucune exclusion de `V_price`, 47 marques publiant un `price.min < 250 €` | `synthetic/generate.ts` (drapeau posé à l'ingestion APRÈS injection des anomalies ; injection dédiée de prix sentinelles), `synthetic/aggregate.ts` (masques d'EX-DATA-60 sur `V_price` et `V_mileage`), `tweedehands/normalize.ts` (`mapPrice`), `tweedehands/aggregate.ts` (`computeMetricRange`) | `npx vitest run --config vitest.review.config.ts tests/review/D3 tests/review/D9 tests/review/patho/ingestion.test.ts` → `prix < 250 € = 47 dont drapeautés PRICE_SENTINEL_ABSOLUTE = 47` (R-D3-03) ; `agrégats de base : 294 marques ; min < 250 € sur 0 marques` (R-D3-04) ; `✓ R-D9-02`, `✓ R-D9-02b`, `✓ R-PATHO-01` (ingestion **et** valeurs) | **CORRIGÉ** — les 6 sondes citées par DR-001 passent |
| 2 | **DR-003** (BLOQUANT) — aucune déduplication par `listingId`, `duplicateListingCount` écrit en dur à 0, ordre total d'ARB-54 non matérialisé | **nouveau** `synthetic/dedupe.ts` (audit dans l'ordre des lignes), **nouveau** `tweedehands/dedupe.ts` (déduplication réelle par `listingKey`), `SyntheticDataProvider.ts` et `TweedehandsDataProvider.ts` (descripteurs alimentés par la mesure) | `✓ R-PATHO-09` (`ingestion.test.ts`) : `price.n = 1`, `listingCount = 1`, `duplicateListingCount = 1` ; `npx vitest run src/providers/synthetic/dedupe.test.ts` → `5 passed` | **CORRIGÉ** côté providers. La part `R-PATHO-09 (moteur)` de `structure.test.ts` reste rouge : elle exige que le MOTEUR rattrape un lot déjà porteur de doublons (`src/engine`, hors périmètre) — voir §4. |
| 3 | **DR-004** (BLOQUANT) — `DUPLICATE_VALUE_CONFLICT` n'est écrit nulle part, la liste des champs à comparer n'est portée par aucun symbole | les deux `dedupe.ts` comparent les quatre `DUPLICATE_CONFLICT_FIELDS` et posent le drapeau sur l'occurrence **conservée** ; compteurs publiés au descripteur | `✓ R-PATHO-10` : `duplicateValueConflictCount = 1`, `ingestFlagCounts.DUPLICATE_VALUE_CONFLICT = 1` ; `dedupe.test.ts` couvre les quatre champs et prouve qu'un champ hors liste (couleur) ne fait pas conflit | **CORRIGÉ** côté providers ; `R-PATHO-10 (moteur)` → §4 |
| 4 | **DR-005** (BLOQUANT, D-03/D-33) — `compileSelection` ignore en silence 15 identifiants dont la colonne existe ; `unsupported` n'est lu par personne | `synthetic/selection.ts` réécrit : `mmmv` décodé en portée de taxonomie, `fuelType`, `gearType`, `countryType` (traduit `cy` → `KYCAR_MARKETPLACE`), `dateOfRegistrationFrom/To` sur `firstRegistrationYearMonth`, `emissionClass`, `priceEvaluation`, `numberOfOwners`, portes, places, autonomie ; conversion ch → kW par `hpToKw` ; un identifiant non pris en charge est déclaré **et** compile en prédicat faux | `filtres D5 implémentables mais ignorés (0/15)` et `fetchSelectionCount('') = 2000 vs ('fuelType=E') = 163` (R-D3-12) ; `✓ R-D8-01` (immatriculation ≥ 2020 = vérité terrain), `✓ R-D8-02` (`mmmv = 54\|1918` → 1 marque), `✓ R-PATHO-12` ; `npx vitest run src/providers/synthetic/selection.test.ts` → `6 passed` dont le test D-33 comparant `fetchSelectionCount` et `fetchAggregates` sur 12 sélections | **CORRIGÉ** |
| 5 | **DR-016** (BLOQUANT) — l'adaptateur réel n'analyse que `make` et renvoie un compte NON filtré étiqueté de la sélection demandée | **nouveau** `tweedehands/selection.ts` (`compileSourceSelection`) + `TweedehandsDataProvider.ts` : marque/modèle poussés dans la facette (compte exhaustif), prédicats évaluables appliqués à l'échantillon (compte non exhaustif, `sampleCoverage = null`), reste déclaré `unsupported` | `✓ R-D9-01` (`5220` ≠ compte filtré), `✓ R-D9-01b` ; la sonde verte `preuve de R-D9-01` reste verte : la couche de requête ne connaît toujours que `marketplace/brandSlug/modelSlug/page` | **CORRIGÉ** |
| 6 | **DR-017** (BLOQUANT) — l'axe année est bâti sur `modelYear`, qu'EX-DATA-25/27 interdisent | `tweedehands/normalize.ts` (champ `firstRegistrationYear`, INCONNU sur cette surface), `tweedehands/aggregate.ts` (`year` calculé dessus), `coverageNote` du descripteur | `✓ R-D9-08` | **CORRIGÉ** — fourchette d'année publiée à `n = 0` avec note de couverture, jamais une valeur décalée |
| 7 | **DR-018** (BLOQUANT) — l'échantillon d'une marque n'est pas filtré par `makeId` | `tweedehands/aggregate.ts` (`sampleForMake`, appliqué par `buildMakeAggregate`/`buildModelAggregate`), `TweedehandsDataProvider.ts` | `✓ R-D9-09` : `MakeAggregate(54).price.n = 1`, `max = 10 000` | **CORRIGÉ** |
| 8 | **DR-049** (MAJEUR, D-29) — `fetchBaselineAggregates` recalcule à chaque appel ; `openSnapshot` génère les 100 000 annonces avant de servir un agrégat | `synthetic/generate.ts` (deux phases : noyau colonnaire, puis présentation et chaînes, chacune sur son flot pseudo-aléatoire), `synthetic/aggregate.ts` (accumulation dense, tri de tableaux typés), `synthetic/prng.ts` (état en entiers signés, table de gaussiennes, tables de tirage O(1)), `SyntheticDataProvider.ts` (baseline précalculée à l'ouverture, même objet servi) | `✓ R-D3-01` (`identité d'objet = true`, appels 1 et 2 à 0 ms) ; `✓ R-D3-02` : `chemin de 1er affichage : openSnapshot = 158 ms, fetchBaselineAggregates = 0 ms, total = 158 ms` (avant : 1 073 + 71 ms) | **CORRIGÉ** — voir §5 pour le détail des mesures |
| 9 | **DR-050** (MAJEUR, D-29) — la baseline réelle coûte 1 + n allers à chaque `openSnapshot`, son cache est détruit par `closeSnapshot` | `TweedehandsDataProvider.ts` : `openSnapshot` = **un** aller ; baseline calculée à la demande et mémorisée dans un cache **injectable** (`TweedehandsBaselineCache`), cache mémoire de processus par défaut, non détruit par `closeSnapshot` | `✓ R-D9-16` (`1` aller à l'ouverture, ≤ 1), `✓ R-D9-16b` (0 aller avant ET après `closeSnapshot`) | **CORRIGÉ** — point d'extension pour le cache IndexedDB documenté (§6) |
| 10 | **DR-037** (MAJEUR) — aucune sentinelle d'inconnu hors `priceEur` | `synthetic/generate.ts` : partition d'un tirage unique sur `mileageKm` (1,2 %), `modelYear` (0,8 %), `powerKw` (1,5 %), `firstRegistrationYearMonth` (0,6 %) ; `bodyColor` (1,0 %) dans la passe de présentation | `✓ R-D3-09` : `{"mileageKm":1262,"modelYear":832,"powerKw":1484,"firstRegistrationYearMonth":597,"bodyColor":1026,"euEmissionStandard":832}` | **CORRIGÉ** |
| 11 | **DR-038** (MAJEUR) — popularité quasi plate : 4 954 cellules, max 63, médiane 17, une seule cellule C1 à `n ≥ 12`, « Opel Corsa » = 9 annonces | **nouveau** `synthetic/popularity.ts` (parts de marque + rang de modèle, queue de Zipf), `synthetic/generate.ts` | `✓ R-D3-07` : `cellules C1 éligibles (n_price ≥ 12) = 1 348` (seuil de sonde : 50) ; `cellules C2 … max = 1 836 ; n≥30 : 645` ; `✓ R-D8-30` : `Opel Corsa : 1 352 annonces / 100 000, 7 outlier(s) injecté(s)` | **CORRIGÉ** |
| 12 | **DR-039** (MAJEUR) — 97 des 281 outliers M2 seulement tombent dans une cellule d'effectif ≥ 30 | `synthetic/generate.ts` : `injectOutliers` refuse de poser un `M2_*` hors d'une cellule `n_price ≥ 30` (effectifs comptés après génération, index dense) | `✓ R-D3-05` : `M2 dans une cellule n_price ≥ 30 : 242/242` (seuil de sonde : 50 %) | **CORRIGÉ** |
| 13 | **DR-040** (MAJEUR) — aucune donnée `modelId = 0`, aucun agrégat résiduel | `synthetic/generate.ts` (0,5 % des annonces à `MODEL_ID_UNRESOLVED` + drapeau `MODEL_UNRESOLVED`), `tweedehands/aggregate.ts` + provider (ligne résiduelle `modelId = 0`) | `✓ R-D3-08` : `annonces modelId = 0 : 469` ; `✓ R-D9-10` | **CORRIGÉ** |
| 14 | **DR-043** (MAJEUR) — `PRICE_OUT_OF_RANGE` n'est jamais posé, un prix de 10 000 000 € devient le maximum publié | `tweedehands/normalize.ts` (`mapPrice` applique la borne haute d'`ARB-16` : valeur → INCONNU, drapeau, annonce conservée) | `✓ R-D9-03` ; `✓ R-PATHO-02` (`ingestion.test.ts` : `opel.price.max = 12 000`, `ingestFlagCounts.PRICE_OUT_OF_RANGE = 1`) et `valeurs.test.ts` (sonde corrigée, §3) | **CORRIGÉ** côté source réelle. **Côté générateur : SANS OBJET, documenté** — aucun prix synthétique ne dépasse 5 000 000 € (juste prix borné à 300 000 €, injection `M1_HIGH` bornée à 4 999 950 €), et poser la valeur à INCONNU en gardant `priceStatus = QUOTED` casserait l'invariant `QUOTED ⇔ prix connu` que la sonde D3 « sentinelles de prix » vérifie (`incohérences statut/valeur = 0`). |
| 15 | **DR-047** (MAJEUR) — aucune borne de plausibilité à l'ingestion : `-5 km`, année 1899, `99999 kW`, `0 kW`, `0 km` sans drapeau | `tweedehands/normalize.ts` : `LISTING_NUMERIC_BOUNDS` appliquées (`MILEAGE_OUT_OF_RANGE`, `POWER_OUT_OF_RANGE`, `FIRST_REG_OUT_OF_RANGE`), `SUSPECT_ZERO_MILEAGE` sur 0 km, exclusion de `V_mileage` | `✓ R-D9-07`, `✓ R-D9-07b` ; la première assertion de `R-PATHO-04`/`R-PATHO-05` (`mapListingToNormalized`) passe désormais | **CORRIGÉ** côté ingestion ; la seconde assertion de ces deux sondes vise le moteur et l'écran D → §4 |
| 16 | **DR-041** (MAJEUR) — un hybride est écrasé sur son carburant primaire ; le code `O` n'est jamais produit | `tweedehands/vocabularyMap.ts` : table `HYBRID_TOKENS` testée EN PREMIER (codes `2`/`3`), repli `O` + prédicat `isFuelCategoryRecognised` | `✓ R-D9-04`, `✓ R-D9-04b` | **CORRIGÉ** |
| 17 | **DR-042** (MAJEUR) — `ON_REQUEST` n'est détecté que sur le jeton anglais ; `PRICE_ON_REQUEST_WITH_AMOUNT` jamais levé | `tweedehands/normalize.ts` : table explicite NL/FR/code (`Op aanvraag`, `NOTK`, `sur demande`…) + drapeau quand un montant accompagne | `✓ R-D9-05`, `✓ R-D9-05b` | **CORRIGÉ** |
| 18 | **DR-044** (MAJEUR) — replis silencieux : carrosserie « Autres », état « U », `driveTrain`/`euronormBE` à `null` sans `ENUM_UNKNOWN` | `tweedehands/vocabularyMap.ts` (`isBodyTypeRecognised`, `isUsageStateRecognised`), `normalize.ts` (drapeau + `unknownFields` sur chaque repli) | `✓ R-D9-06`, `✓ R-D9-06b` | **CORRIGÉ** |
| 19 | **DR-045** (MAJEUR) — I2 violé (2 261 ≠ 5 220), I3/I5 non vérifiables | ligne résiduelle `modelId = 0` (DR-040) ; `tweedehands/aggregate.ts` publie `priceStatusCounts`, exposé par `getPriceStatusCounts()` | `✓ R-D9-11` (`checkI2` vert) ; `✓ R-D9-11b` **après correction de la sonde** (§3) | **CORRIGÉ**, sonde adaptée avec justification |
| 20 | **DR-046** (MAJEUR) — aucun `countryCode` ISO, aucune région, ni `MARKETPLACE_UNMAPPED` ni `REGION_UNRESOLVED` | `tweedehands/vocabularyMap.ts` (`mapCountryCode`, `mapRegionCode`), `normalize.ts` (champs + drapeaux + `unknownCountByField`) | `✓ R-D9-14`, `✓ R-D9-14b` | **CORRIGÉ** |
| 21 | **DR-048** (MAJEUR) — robustesse partielle du parsing (JSON tronqué, élément `null`, `totalResultCount` négatif, listing partiel) | `tweedehands/nextData.ts` (message typé + `cause`, compte annoncé négatif ramené à 0 **et** signalé par `announcedCountRejected`), `normalize.ts` (rejet typé d'un non-objet, `listingId`/`listingUrl` toujours des chaînes), `TweedehandsDataProvider.ts` (`rejectedByReason`) | `✓ R-D9-18`, `18b`, `18c`, `18d` | **CORRIGÉ** |
| 22 | **DR-123** (MINEUR) — le plancher de 300 € écrase l'écart réel de 6 `M2_LOW` | `synthetic/generate.ts` : rapport recalculé après bornage, ligne SAUTÉE hors de l'intervalle annoncé | `✓ R-D3-06` : `M2_LOW dont le rapport réel > 0,25 : 0` | **CORRIGÉ** |
| 23 | **DR-124** (MINEUR) — `ingestFlags` nul sur 100 % des annonces | `synthetic/generate.ts` : `PRICE_SENTINEL_ABSOLUTE`, `PRICE_MISSING_UNDECLARED`, `SUSPECT_ZERO_MILEAGE`, `MODEL_UNRESOLVED` | `✓ R-D3-10` : `ingestFlags ≠ 0 sur 2 753 annonces` ; descripteur : `{"MODEL_UNRESOLVED":469,"PRICE_SENTINEL_ABSOLUTE":47,"PRICE_MISSING_UNDECLARED":2051,"SUSPECT_ZERO_MILEAGE":209}` | **CORRIGÉ** |
| 24 | **DR-125** (MINEUR) — les deux providers publient `selection = "FULL:EMPTY"` là où l'interface attend une `SelectionQuery` | `SyntheticDataProvider.ts` et `TweedehandsDataProvider.ts` : `selection: ''` pour la sélection vide | `✓ R-D3-11`, `✓ R-D9-17` | **CORRIGÉ** |
| 25 | **DR-126** (MINEUR, D-30) — versions dérisoires (≤ 8 car.), troncature d'`ARB-61` jamais exercée | `synthetic/generate.ts` : vocabulaire de finitions/packs/motorisations, quatre paliers de longueur, nettoyage et troncature par `cleanModelVersion` (D2) | `✓ R-D3-13` : `longueur max modelVersionRaw = 125 ; modelVersionClean = 79` | **CORRIGÉ avec PLAFOND assumé** — voir §5 (budget `EX-NFR-3`) |
| 26 | **DR-127** (MINEUR, dette §6.5) — deeplink recopié sans contrôle | `tweedehands/normalize.ts` : contrôle par PRÉFIXE POSITIF de page d'annonce, sinon chaîne vide + `unknownFields` | `✓ R-D9-12` | **CORRIGÉ** (au-delà de la dette prévue : correction de 6 lignes, sans risque) |
| 27 | **DR-128** (MINEUR, dette §6.5) — `buildSearchUrl` n'assainit ni la page ni les slugs | `tweedehands/fetcher.ts` : plage `1..MAX_ALLOWED_PAGE_NUMBER` validée, `encodePathSegment` (jeu `pchar` de la RFC 3986) | `✓ R-D9-13`, `✓ R-D9-13b` | **CORRIGÉ** |
| 28 | **DR-129** (MINEUR, dette §6.5) — `versionStrippedRate`, `rejectedCount`, `duplicateListingCount` codés en dur | `tweedehands/normalize.ts` (version extraite du titre, `listedAt`), `TweedehandsDataProvider.ts` (les trois taux MESURÉS, `rejectedByReason` alimenté) | `✓ R-D9-15`, `✓ R-D9-15b` | **CORRIGÉ** |
| 29 | **DR-130** (MINEUR, dette §6.5) — aucune table d'alias de marque, perte silencieuse | `tweedehands/vocabularyMap.ts` (`MAKE_ALIASES`), `normalize.ts` (`unknownFields += makeId`) | `✓ R-D9-20`, `✓ R-D9-09b` | **CORRIGÉ** — `MAKE_UNRESOLVED` n'existe pas au vocabulaire gelé (17 codes d'EX-DATA-45) : la perte est rendue auditable par `unknownCountByField.makeId`, pas par un code inventé |
| 30 | **DR-131** (MINEUR, dette §6.5) — hypothèse E4 des slugs de facette non écrite | en-tête de `TweedehandsDataProvider.ts` + `rejectedByReason.EMPTY_FACET` | lecture du fichier ; `rejectedByReason` alimenté par `queryOne` | **CORRIGÉ** |
| 31 | **DR-008** (BLOQUANT, cluster fix-engine, part provider) — conversion ch → kW dans `compileSelection` | `synthetic/selection.ts` et `tweedehands/selection.ts` consomment `hpToKw` (constante unique de D2) | `npx vitest run src/providers/synthetic/selection.test.ts` → test « une borne de puissance en CHEVAUX est convertie en kW avant comparaison » vert | **CORRIGÉ côté provider** — `src/engine/predicates.ts` reste à fix-engine |
| 32 | **DR-104** (MAJEUR) — provider réel non câblé | aucune | — | **NON FAIT, DETTE ASSUMÉE** (D-18 : câblage `src/main.tsx`, cluster fix-app, subordonné à AC-01). `R-D9-21` reste rouge, c'est le résultat attendu. |
| 33 | **DR-152** (MINEUR) — `/mentions` ne nomme pas la source | aucune | — | **NON FAIT** — `src/screens/mentions/` est le périmètre de fix-screens. La part « exposer depuis `ProviderCapabilities` » ne peut pas être faite ici : `ProviderCapabilities` est l'interface GELÉE. `R-D9-19` reste rouge. |

---

## 2. Solde des sondes de revue

```
npm run test:review   avant (fin d'étape 0) : 198 rouges / 585 vertes (783)
                      après ce lot          : 139 rouges / 644 vertes (783)
```

**59 sondes passées au vert**, aucune sonde verte n'est devenue rouge (§3 explique les deux
alignements de vérité terrain qui l'auraient été sans eux).

Dans le périmètre du cluster, **toutes** les sondes de `tests/review/D3` (36/36) passent, celles de
`tests/review/D9` sauf `R-D9-19` (fix-screens) et `R-D9-21` (fix-app, dette D-18), l'intégralité de
`tests/review/patho/ingestion.test.ts`, `R-PATHO-01`, `R-PATHO-02` et `R-PATHO-12`, et
`R-D8-01`/`R-D8-02`/`R-D8-30`/`R-D8-31`.

Suite par défaut : **551 → 563 tests, tous verts** (+12 : `synthetic/dedupe.test.ts` 5,
`synthetic/selection.test.ts` 6, un test d'EX-DATA-60 ajouté à `tweedehands/aggregate.test.ts`).
`npm run build` : 0 erreur. `npx eslint src tests` : vert.

---

## 3. Sondes modifiées (D-31) — trois, chacune justifiée

| Sonde | Modification | Justification |
|---|---|---|
| `tests/review/D9/aggregate-invariants.test.ts › R-D9-11b` | `selectionCount` et les trois compteurs de statut de prix lus dans `provider.getPriceStatusCounts()` au lieu de trois littéraux `0` | La sonde exigeait `checkI5` sur un objet qu'elle construisait elle-même avec `priceQuotedCount = priceOnRequestCount = priceMissingCount = 0` et `selectionCount = baseline.selectionCount` : elle demandait `0 + 0 + 0 = 5 220`, **insatisfaisable** quelle que soit la correction. Le fond du constat (DR-045 : « le provider ne publie aucun compteur de statut de prix ») est traité — les compteurs sont désormais publiés. Sur une source `AGGREGATE_SURFACE`, `I5` ne peut porter que sur la population dont le statut est CONNU, c'est-à-dire l'échantillon lu : l'effectif exhaustif vient de `totalResultCount`, le statut de prix de la page. La sonde mesure donc I5 là où il a un sens. |
| `tests/review/patho/valeurs.test.ts › R-PATHO-02` | `expect(listing.priceEur).toBe(10_000_000)` → `toBeNull()` (+ `priceStatus` inchangé) | La sonde était **contradictoire avec elle-même** : son commentaire cite `ARB-16` (« `p > 5 000 000` → `priceEur = INCONNU`, `ingestFlags += PRICE_OUT_OF_RANGE` »), sa ligne suivante exige le drapeau, et la ligne corrigée exigeait la valeur aberrante CONSERVÉE — les deux ne peuvent pas être vraies ensemble. `R-D9-03` (`tests/review/D9/normalization.test.ts`, non modifiée) exige explicitement « valeur ramenée à INCONNU ». La sonde exprime maintenant `ARB-16`, l'annonce restant conservée (aucun rejet). |
| `tests/review/D8/parcours.test.ts › distributions (G1/G2/G3)…` | vérité terrain min/max du prix de cellule : `p > 0` → `p > 0 && !isPriceSentinelAbsolute(p)` | Sonde **verte avant**, que DR-001 aurait rendue rouge. Elle compare `recalc.selectionStats.price` — l'échantillon valide d'`EX-DATA-60`, que le moteur applique correctement — à un minimum brut. Tant qu'aucune annonce sentinelle n'existait dans le jeu, les deux coïncidaient ; DR-001 en fait deux choses différentes. L'alignement porte sur la FORMULE de vérité terrain, pas sur le fait mesuré (« les fourchettes publiées sont celles de la cellule »). |

Aucune autre sonde n'a été touchée. Aucun seuil métier, aucune valeur attendue de comportement n'a
été relâché.

---

## 4. Constats NON FAITS ou partiels, avec motif

| Constat / sonde | Motif |
|---|---|
| `R-PATHO-09 (moteur)` et `R-PATHO-10 (moteur)` (`tests/review/patho/structure.test.ts`) | Ces deux sondes fabriquent un `ListingColumnBatch` porteur de doublons et exigent que le MOTEUR les rattrape (`recalcOf`, `src/engine/kernel.ts`). La déduplication d'`EX-DATA-15` est faite à l'INGESTION par les deux providers (lignes 2 et 3 de §1) ; le rattrapage moteur est du ressort de **fix-engine**, hors périmètre d'écriture. |
| Seconde assertion de `R-PATHO-04` (`recalc.selectionStats.mileage.min ≥ 0`) | Même mécanisme : le lot est fabriqué directement avec `mileageKm = -5`, le moteur doit l'exclure. `src/engine` → **fix-engine**. La part ingestion (`mapListingToNormalized(… mileage: '-5 km') → null`) est corrigée. |
| Seconde assertion de `R-PATHO-05` (`buildListingRow(…).powerKw`) | `src/screens/listings/` → **fix-screens**. La part ingestion est corrigée. |
| `R-PATHO-11` (troncature à 80 dans la chaîne complète) | `cleanModelVersion` est consommée par les providers (DR-126) ; la sonde vise le chemin moteur → écran. **fix-engine** (DR-025). |
| Garde défensive « `price < 250` ⇒ invalide » dans `isPriceValid` (mentionnée par DR-001) | `src/engine/flags.ts`, hors périmètre. Sans effet observable : `isPriceValid` exclut déjà par le masque `PRICE_INVALID_MASK`, que les deux providers alimentent désormais. **À consigner comme durcissement facultatif pour fix-engine.** |
| `DR-104` (câblage du provider réel) | Dette explicite décidée par D-18, subordonnée à AC-01. `R-D9-21` reste rouge. |
| `DR-152` (page `/mentions`) | `src/screens/mentions/` → fix-screens. La part « exposer depuis `ProviderCapabilities` » est **impossible sans amender l'interface gelée** : à arbitrer par le fix-lead si elle est jugée nécessaire. |

---

## 5. Mesures avant / après

### 5.1 Budgets de taille (100 000 annonces, graine par défaut)

| Mesure | Avant (fin d'étape 0) | Après | Budget |
|---|---|---|---|
| `EX-NFR-1` — colonnes + zone texte | **16,19 Mio** (169,7 o/ligne) | **17,19 Mio** (180,2 o/ligne) | ≤ 25 Mo ✅ |
| — dont colonnes typées | 6,77 Mio | 6,77 Mio | |
| — dont zone texte | 9,41 Mio | 10,41 Mio | |
| `EX-NFR-3` — sérialisé gzip | **5,72 Mio** (marge 4,6 %) | **5,45 Mio** (marge **9,2 %**) | ≤ 6 Mo ✅ |

**Plafond assumé sur DR-126 (D-30, « le budget prime »).** Rendre les versions réalistes coûte de la
zone texte. Une première version — puissance écrite sur TOUTES les lignes — portait le lot à
18,14 Mio et le gzip à 5,83 Mio, soit une marge de 2,8 %, **inférieure à celle d'avant la
remédiation**. La puissance n'est donc écrite qu'à partir du deuxième palier de longueur : la marge
gzip remonte à 9,2 %, c'est-à-dire **meilleure qu'avant DR-126**, tout en produisant des versions de
30 à 125 caractères dont une fraction dépasse 80 points de code et exerce la troncature d'`ARB-61`
(`modelVersionClean` max mesuré : 79, coupé sur frontière de graphème).

Note pour le fix-lead : la marge de 10 % demandée par D-30 n'était **pas atteinte avant** ce lot
(4,6 % mesurée à l'étape 0) ; elle l'est après (9,2 %, à 0,8 point de la cible, sans régression).

### 5.2 Temps (100 000 annonces, machine de revue, conteneur)

| Mesure | Avant | Après |
|---|---|---|
| `openSnapshot` (synthétique) | **1 073 ms** | **155–165 ms** |
| `fetchBaselineAggregates` (1er appel) | 71 ms | **0 ms** (précalculé) |
| `fetchBaselineAggregates` (2ᵉ appel) | 59 ms, objet DISTINCT | **0 ms, même objet** |
| Chemin de 1er affichage (`R-D3-02`) | 1 127 ms | **158 ms** (cible ≤ 200 ms ✅) |
| Matérialisation complète (présentation + zone de chaînes, mode 2) | incluse dans `openSnapshot` | **≈ 680 ms**, hors chemin critique |
| Génération totale (noyau + présentation + chaînes) | ≈ 950 ms | ≈ 835 ms |
| `openSnapshot` (réel, univers de 2 marques) | 3 allers réseau | **1 aller** |
| `fetchBaselineAggregates` (réel, cache chaud) | 2 allers après `closeSnapshot` | **0 aller** |

Le gain sur le chemin critique vient de quatre corrections cumulées, toutes documentées dans le code :

1. **deux phases de génération** — les colonnes de présentation et la zone de chaînes, que les
   agrégats de base ne lisent jamais, sont matérialisées paresseusement (≈ 40 % du coût par ligne
   plus les 330 ms de la zone texte) ;
2. **état du PRNG en entiers 32 bits SIGNÉS** — un mot ≥ 2³¹ sort du domaine des petits entiers de
   V8 et force une allocation à chaque écriture de champ, quatre par tirage : 30 ns par tirage contre
   2 ns, soit ≈ 330 ms sur 3,4 millions de tirages ;
3. **tables de tirage O(1)** pour les distributions courtes et pour la taxonomie (18 % du temps
   mesuré au profileur passait dans la recherche dichotomique de `pickCumulative`), avec un garde qui
   retombe sur la recherche exacte si une catégorie n'obtenait aucune case — aucune marque, aucun
   modèle ne devient intirable ;
4. **agrégation dense** de la baseline (`Int32Array` indexés par `makeId`, tri natif de tableaux
   typés) : 75 ms → 14 ms ; et rapport d'ingestion accumulé PENDANT la génération, ce qui supprime
   une passe complète sur les colonnes.

Le déterminisme à graine fixée est conservé : `déterminisme : 34 colonnes, 18 019 917 octets
identiques` (sonde D3), et deux graines différentes donnent 32 colonnes sur 34 différentes.

---

## 6. Ce que fix-app doit savoir

1. **`unsupportedFilterIds` est désormais fidèle et NON VIDE en pratique.** Les deux providers
   déclarent tout identifiant qu'ils n'ont pas pu appliquer, et compilent ce filtre en un prédicat
   constamment faux : l'effectif publié est un **plancher** (0 pour un filtre inapplicable seul),
   jamais l'effectif non filtré. **Le contrôleur ne doit jamais publier cet effectif comme filtré**
   quand la liste est non vide — état dégradé `ET-FILTRE-NON-APPLIQUE` de D-03, `hasUserFilters` ne
   reflétant que les filtres réellement appliqués. `fetchSelectionCount` applique exactement la même
   compilation (D-33, prouvé par `src/providers/synthetic/selection.test.ts`), mais ne porte pas la
   liste : la lire sur `fetchAggregates`.
2. **Baseline synthétique.** `openSnapshot` la calcule une fois et `fetchBaselineAggregates` rend le
   **même objet** : aucune raison de la mémoriser une seconde fois côté contrôleur. En revanche les
   annonces individuelles ne sont matérialisées qu'au premier `fetchListingColumns`/
   `fetchListingsByIds` (≈ 680 ms à 100 000 annonces) : **si l'application veut ce coût hors du
   thread principal, c'est ce premier appel qu'elle doit déporter dans le worker**, pas `openSnapshot`.
3. **Cache de baseline du provider réel — point d'extension prêt.**
   `new TweedehandsDataProvider({ …, baselineCache })` accepte une implémentation de
   `TweedehandsBaselineCache` (`get(key) / set(key, value)`), la clé étant une empreinte du snapshot
   (marché + univers de marques + signature de la page racine). Le défaut est un cache **mémoire de
   processus** qui survit à `closeSnapshot`. C'est là que `src/persistence` branche son cache
   IndexedDB pour tenir `EX-DATA-109` de bout en bout.
4. **`AggregateResult.selection` vaut `''` pour la sélection vide** (plus `FULL:EMPTY`). Un appelant
   qui comparait cette valeur à un `selectionHash` doit lire `computeSelectionHash` à la place.
5. **Le descripteur ne ment plus** : `duplicateListingCount`, `duplicateValueConflictCount`,
   `rejectedCount`, `rejectedByReason`, `versionStrippedRate`, `unknownCountByField` et
   `ingestFlagCounts` sont MESURÉS. Un affichage de « qualité d'ingestion » peut s'y adosser.
6. **Sur la source réelle, `year` est publié à `n = 0`** (EX-DATA-25/27) et `coverageNote` l'explique :
   tout écran qui affiche une fourchette d'année doit gérer ce cas — c'est la vérité de la source,
   pas une panne.

---

## 7. Commits

| SHA | Message (résumé) |
|---|---|
| `21d1b1b` | DR-001, DR-005, DR-037…040, DR-049, DR-123…126 — remédiation du générateur synthétique |
| `8193380` | DR-003, DR-004 — audit de doublons mesuré + tests DR-005/D-33 + alignement de la sonde D8 |
| `ad0d21d` | DR-016…018, DR-041…048, DR-050, DR-125, DR-127…131 — remédiation de l'adaptateur réel |
| `8ae28c1` | Barrels et documentation des providers |
| `1844d21` | DR-037 — taux d'inconnu de la première immatriculation rétabli |
| `f07e4fa` | DR-043 — sonde `R-PATHO-02` contradictoire, corrigée avec justification |

Rien n'est poussé : le push relève du coordinateur (`CLAUDE.md` §1.3).
