# fix-app — remédiation 2.6 (vague F2)

**Agent `fix-app` (Opus, effort high), 2026-09-08. Arbre principal `/home/user/KYCAR`, branche
`claude/kycar-project-ffcplk`.** Périmètre d'écriture : `src/app.tsx`, `src/main.tsx`, `src/app/`,
`src/orchestration/`, `src/persistence/`, `src/screens/**` (hors `scatter-sample.ts` /
`scatter-model.ts`), `src/styles/`, `tests/review/D8/`, les sondes de câblage de `tests/review/D7/`,
plus ce rapport. Interfaces gelées (`src/providers/DataProvider.ts`), `src/providers/`, `src/engine/`,
`src/types/`, `src/state/`, `docs/` : **non modifiés** (lus seulement). Aucune nouvelle dépendance,
aucun appel réseau, R3 intangible.

Ordre suivi : `reports/DEV-REVIEW.md` §6.2 — `DR-006 → DR-010 → DR-099 → DR-091 → DR-092 → DR-093 →
DR-094 → DR-095 → DR-096 → DR-097 → DR-098 → DR-100 → DR-101 → DR-102 → DR-103 → DR-104 (non fait,
D-18) → mineurs DR-152…DR-159`, plus le câblage listé par `fix-screens` §3 et les décisions D-03,
D-12, D-16, D-24, D-29, D-33, D-43.

---

## 1. Tableau DR → correction → preuve → statut

Sauf mention contraire, la preuve est **la sonde qui a révélé le défaut, non modifiée**.
Toutes les commandes sont rejouables depuis la racine du dépôt.

| DR | Correction (fichiers) | Preuve (commande → extrait) | Statut |
|---|---|---|---|
| **DR-006** (BLOQUANT) | `enterMode2(makeId, modelId, selection?)` scinde T/R (`partitionSelection`, D5), traduit la composante R en prédicats moteur par le module neuf `src/orchestration/refine-predicates.ts`, recalcule sur `<localDatasetKey>:<refineHash>` réel (`splitSelection`) et rend les `rows` retenues (`compilePredicates`, D4). La coquille clé son effet d'entrée sur `currentQuery` (`src/orchestration/data-controller.ts`, `src/orchestration/refine-predicates.ts`, `src/app.tsx`) | `npx vitest run --config vitest.review.config.ts tests/review/D8/parcours.test.ts tests/review/D8/o17.test.ts` → **21 passed**. `R-D8-03` : `refined.rows.length === y2017` ; journal : `[P2] enterMode2(54,1918) Σ=1352 hash=…:EMPTY` puis `+2017 Σ=54 hash=…:35a0c206ac32bfef` | **CORRIGÉ** |
| **DR-010** (BLOQUANT) | `onOpenListing` passé aux écrans B **et** D par `app.tsx` : lit `STRING_FIELD.listingUrl` sur le lot et appelle `window.open(url, '_blank', 'noopener')` ; l'écran B ne navigue plus en interne au clic sur un point. URL absente → message, jamais un écran interne (`src/app.tsx`) | `npx vitest run --config vitest.review.config.ts tests/review/D7/ecran-d.test.ts` → `R-D7-24` **verte** (17 passed / 1 failed = `R-D7-16`, dette TVA D-38) | **CORRIGÉ** |
| **DR-099** | `enterMode2` valide la route par `resolveTaxonomyRoute` **avant** tout aller provider (`marque inconnue` / `ce modèle n'existe pas pour cette marque`) ; la coquille rend les écrans d'erreur EX-NAV-19/20 avec lien `/marche` **filtres conservés**, n'entre jamais en mode 2 sur une route invalide, et canonise par `replaceState` (`/`, `/modele/:makeId/:modelId`, slug périmé) (`src/orchestration/data-controller.ts`, `src/app.tsx`, `src/app/navigation.ts::routeOfView`) | `… tests/review/D8/routing.test.ts` → **10 passed** (`R-D8-14`) ; `… shell-static.test.ts` → `R-D8-15`, `R-D8-16` vertes | **CORRIGÉ** |
| **DR-091** | Le délai de 5 000 ms couvre la **séquence** `openSnapshot` + `fetchBaselineAggregates` (`data-controller.ts::start`) | `… tests/review/D8/fallback.test.ts` → `R-D8-05` verte (13 passed) | **CORRIGÉ** |
| **DR-092** | `onRetryProvider={() => void controller.start().then(onStarted)}` : le provider est réellement relancé, puis `reloadMarket` (`src/app.tsx`) | `… shell-static.test.ts` → `R-D8-06` verte | **CORRIGÉ** |
| **DR-093** | Bandeau dégradé **daté** : `Mode dégradé — Données du JJ/MM/AAAA — dernière tentative … (code E-…)`, bouton `Réessayer`, mention `ET-PARTIEL-CACHE` ; `MarketScreen`/`SummaryBar` reçoivent `partialCache` (astérisque sur les effectifs, `Exporter` désactivé avec motif) (`src/app.tsx`, `src/screens/market/MarketScreen.tsx`, `SummaryBar.tsx`) | `… shell-static.test.ts` → `R-D8-07` verte | **CORRIGÉ** |
| **DR-094** | Jeton/bandeau « Données synthétiques de démonstration » rendu par la coquille dès `sourceKind === 'SYNTHETIC'`, valeur prise sur `StartResult`/`describe()` (D-24) — visible sur A, B et D (`src/app.tsx`) | `… shell-static.test.ts` → `R-D8-08` verte | **CORRIGÉ** |
| **DR-095** | `mode2Fallback: new SyntheticDataProvider({ referenceData })` câblé (`src/main.tsx`), instance paresseuse (aucune génération tant que le provider principal sert le mode 2) | `… shell-static.test.ts` → `R-D8-09` verte | **CORRIGÉ** |
| **DR-096** (D-16) | `CappedCollection` : **une clé par entrée** `kycar:<collection>/<id>` + clé d'index `…#index` ; `mutate` n'écrit que l'entrée touchée, **relit l'index juste avant de l'écrire** et réconcilie ce qu'un autre onglet y a ajouté ; `subscribeCrossTab` réagit aux clés d'entrée et d'index de sa seule collection (`src/persistence/crud-store.ts`, `saved-searches.ts`, `followed-models.ts`, `recent-history.ts`, `kv.ts`) | `… tests/review/D8/persistence.test.ts` → **17 passed** (`R-D8-10`) | **CORRIGÉ** |
| **DR-097** | Blob illisible : **préservé** sous `<clé>.corrupt`, retiré de la clé active, écriture refusée par `CorruptCollectionError` (message affichable, remonté en bandeau par la coquille) | `… persistence.test.ts` → `R-D8-11` verte | **CORRIGÉ** |
| **DR-098** | Entrées non-objet (`null`, `42`) ignorées à la lecture : `list()` ne lève plus | `… persistence.test.ts` → `R-D8-12` verte | **CORRIGÉ** |
| **DR-100** | Coquille S0 : **4 onglets** (`Marché`, `Comparer (n)`, `Recherches`, `Suivis (n)`), `Comparer` `aria-disabled` sous 2 modèles, jeton de snapshot daté avec âge 7 j / 30 j, fil d'Ariane, **pied de page** « Source : AutoScout24 — agrégat non affilié » + date du snapshot + lien `/mentions` + panneau `Diagnostic` (`<details>`) (`src/app.tsx`, `src/app/app.css`) | `… shell-static.test.ts` → les 3 sondes `R-D8-22` vertes | **CORRIGÉ** |
| **DR-101** | Lien d'évitement `#kycar-main` (premier tabulable), `document.title` par vue (`VIEW_TITLES`), focus porté sur le `h1` après navigation (`src/app.tsx`, `src/app/app.css`) | `… shell-static.test.ts` → `R-D8-23` verte | **CORRIGÉ** |
| **DR-102** | `stores.saved.touch(id)` à l'ouverture (`SavedSearchesScreenProps.onOpen` reçoit l'`id`) ; barre « Enregistrer cette recherche » montée **aussi** en mode 2, avec `effectifInitial = Σ` du mode 2 (`src/app.tsx`, `src/screens/saved/SavedSearchesScreen.tsx`) | `… shell-static.test.ts` → les 2 sondes `R-D8-25` vertes | **CORRIGÉ** |
| **DR-103** (D-32) | En `degraded-cache` avec filtres posés, la baseline n'est **jamais** servie comme filtrée : `unappliedFilterIds` + `unappliedReason: 'DEGRADED_CACHE'` sur `ScreenALoadedData`, bandeau « Agrégats filtrés indisponibles — les filtres … n'ont pas pu être appliqués » (`data-controller.ts`, `src/screens/market/state.ts`, `src/app.tsx`) | Sonde d'échec écrite d'abord (`R-D8-27`), vue **rouge** (`git stash push -- src`), puis **verte** : `… fallback.test.ts` → 5 failed → **13 passed** | **CORRIGÉ** |
| **DR-104** | **Non fait, volontairement** (D-18) : le provider réel n'est pas câblé. Le point d'injection `baselineCache` est prêt (D-29) et documenté dans `main.tsx` | `… tests/review/D9/capabilities-mode1.test.ts` → `R-D9-21` **rouge, attendue** | **DETTE (D-18)** |
| **DR-152** (D-43) | Part dynamique : `DataController.capabilities` (`describe()`) alimente la provenance affichée ; `/mentions` reçoit `providerId + providerVersion + snapshotId` et le `sourceKind` réel (`data-controller.ts`, `src/app.tsx`) | `… tests/review/D9` → `R-D9-19` verte (part statique fix-screens, part dynamique câblée ici) | **CORRIGÉ** |
| **DR-153** | `RecentHistoryStore.visit` absorbe un refus d'écriture (quota) et le journalise ; la coquille ne peut plus lever au rendu (`src/persistence/recent-history.ts`) | `… persistence.test.ts` → `R-D8-13` verte | **CORRIGÉ** |
| **DR-154** | Classes du contrat `print.css` posées : `.print-filter-summary` (rempli par la requête canonique courante) dans la coquille, `.summary-bar` sur la barre de synthèse, `.summary-bar-c3` sur le bandeau de couverture C3 (`src/app.tsx`, `src/screens/market/SummaryBar.tsx`, `MarketScreen.tsx`) | `… shell-static.test.ts` → `R-D8-24` verte | **CORRIGÉ** |
| **DR-155** | `onReload` vide `CompareSelection` (`setCompareKeys([])`, `setCompareRows([])`) et appelle `controller.dispose()` avant `controller.start()` (`src/app.tsx`) | `… shell-static.test.ts` → `R-D8-26` verte | **CORRIGÉ** |
| **DR-156** | Identifiants corrigés (`54-opel/1918-corsa`) dans `src/app/navigation.test.ts`, `src/persistence/persistence.test.ts`, `src/screens/compare/structure.test.ts` ; le parcours est exécuté sur le **câblage par défaut** (100 000 annonces, provider synthétique de `main.tsx`) | `… shell-static.test.ts` → `R-D8-28` verte ; `parcours.test.ts` tourne sur `new SyntheticDataProvider({ referenceData })` | **CORRIGÉ** |
| **DR-157** | Politique 5 000 ms + réessais 1 s / 2 s / 4 s appliquée à `fetchListingColumns` (`DataController.withRetry`) ; échec explicite au lieu d'un écran figé | `… fallback.test.ts` → `R-D8-29` verte | **CORRIGÉ** |
| **DR-158** (D-32) | `validateAggregateResult` : la forme de la réponse est validée à `start()`, échec avec code `E-PROV-INVALID_ROWS` / `E-PROV-INVALID_SHAPE` / … au lieu d'un « ready » qui éclate en `TypeError` (`data-controller.ts`) | Sonde d'échec écrite d'abord (`R-D8-32`), vue **rouge**, puis **verte** (même exécution que DR-103) | **CORRIGÉ** |
| **DR-159** | L'historique récent n'est alimenté que si la **partie filtres** de la requête change (`serializeSelection` comme signature d'effet) — un `selx`/`sely`/`g4v`/`page` ne crée plus d'entrée (`src/app.tsx`) | Fait de code (aucune sonde exécutable ne monte la coquille) : `grep -n "filterSignature" src/app.tsx` ; suite par défaut verte | **CORRIGÉ** |
| **D-03 / D-33** | Le contrôleur lit `unsupportedFilterIds` sur le résultat de `fetchAggregates` ; liste non vide ⇒ état `ET-FILTRE-NON-APPLIQUE` (bandeau nommant les filtres), `hasUserFilters` = filtres réellement appliqués, jamais le plancher publié comme filtré (`data-controller.ts::loadMarket`, `src/screens/market/state.ts`, `src/app.tsx`) | Sonde neuve « D-03 — un filtre déclaré `unsupportedFilterIds` … » écrite d'abord, vue rouge, puis verte (`fallback.test.ts`) | **CORRIGÉ** |
| **D-12 / contrat d'URL** | `src/screens/distribution/url-state.ts` ne déclare plus rien localement : lecture par `loadQuery` (`readDistributionUiStateFromQuery`), `page`/`sel` portés par `DistributionUiState`, mode d'historique dérivé de `UI_STATE_PARAMS` (`historyModeFor`) ; la coquille câble `page`/`onPageChange`/`sel` sur l'écran D. Les fonctions `// TODO fix-state contract` ont disparu | `… tests/review/D7/url-etat.test.ts` → **9 passed** (`R-D7-18`, `R-D7-19`, `R-D7-20`, `R-D7-26`) ; `grep -c "TODO fix-state contract" src/screens/distribution/url-state.ts` → 0 | **CORRIGÉ** (2 sondes amendées, §2) |
| **D-16** | Voir DR-096/097/098 | idem | **CORRIGÉ** |
| **D-29** | `src/persistence/baseline-cache.ts` : cache IndexedDB **injectable** au point `baselineCache` (contrat synchrone servi par une carte mémoire, `hydrate()` au démarrage, écritures en tâche de fond, repli mémoire hors navigateur). Exporté par `src/persistence/index.ts`, point d'injection documenté dans `main.tsx` — non passé, le provider réel n'étant pas câblé (DR-104) | `npx vitest run --no-file-parallelism src/persistence` → 16 passed (dont « D-29 — cache de baseline injectable ») | **CORRIGÉ (non câblé, DR-104)** |
| **DR-063 (coquille)** | `carryFiltersAcrossMode` câblé aux DEUX transitions : entrée en mode 2 (`goToModel` : `mmmv` absorbé par la route, autres filtres conservés dans la requête) et retour mode 1 (fil d'Ariane, lien des écrans d'erreur) (`src/app.tsx`) | `npx vitest run --no-file-parallelism src/state/router.test.ts` (fonction pure, fix-state) + suite du périmètre verte | **CORRIGÉ** |

### Câblage attendu par `fix-screens` §3 — état

| Constat | Prop/callback | Statut |
|---|---|---|
| DR-009 / DR-079 | `onApplyFilters` → fusion du patch dans la sélection courante, réécriture d'URL (`push`), recalcul (mode 1 par l'effet marché, mode 2 par la clé d'entrée) | **CÂBLÉ** |
| DR-079 | `onViewBrushedListings` → `/marche/:make/:model/annonces?sel=<lo>-<hi>` (`applyUiState` sur la route de l'écran D) | **CÂBLÉ** |
| DR-078 | `onViewListings` (écran D sans `sel`), `onCompare` (`addToCompare` + `/comparer`), `onFollow` + `isFollowed` (CRUD `FollowedModelStore`) | **CÂBLÉ** |
| DR-081 / DR-071 / DR-072 | `degraded` et `regime` détectés par `matchMedia` **dans la coquille** (points de rupture `src/styles/breakpoints.ts`), mis à jour à chaud par un écouteur `change` | **CÂBLÉ** |
| DR-070/140/141 | `csvMeta` réel (écran A : `AggregateCsvMeta` ; écrans B/D : `CsvMeta`) depuis le `SnapshotDescriptor` et la requête canonique courante | **CÂBLÉ** |
| DR-077 | `labels.sellerType` (et `fuel`, `country`, `region`, `usageState`, `evaluation`) résolus sur les vocabulaires de `ReferenceData` — `KYCAR_SELLER_TYPE[0] = « Particulier »`, la part de particuliers se calcule réellement | **CÂBLÉ** |
| DR-088 | `priceBuckets`/`yearBuckets` par colonne depuis `enterMode2` par modèle, `loading` tant qu'une colonne est en attente, `status: 'error'` par colonne en cas d'échec | **CÂBLÉ** |
| DR-089 / DR-090 | `currentCountById` / `currentCountOf` (nouvelles méthodes `countForSelection` / `countForModel` du contrôleur, `null` = indisponible), `onGoToMarket` | **CÂBLÉ** |
| DR-152 | provenance sourcée dynamiquement (`describe()` + `snapshotId`) | **CÂBLÉ** |

---

## 2. Sondes modifiées, avec justification (D-31)

| Fichier · sonde | Modification | Justification |
|---|---|---|
| `tests/review/D7/url-etat.test.ts › R-D7-18` | Les trois littéraux `stack` deviennent `a` (`writeDistributionUiState(...) === [['g4v','a']]`, `loadQuery('g4v=a')`) | **D-31 / D-11** : l'arbitrage fixe `g4v ∈ {a, b}` et « le codec D5 est l'autorité sur l'URL » (`G4V_VALUES` n'admet que ces deux codes). La sonde exigeait l'inverse — que D5 accepte `stack` — donc contredisait l'arbitrage qu'elle vérifie. La **propriété** testée (un `g4v` écrit par D7 traverse `loadQuery` sans correction et sans perte) est inchangée |
| `tests/review/D7/url-etat.test.ts › R-D7-20` | `writeDistributionUiState({...EMPTY_UI_STATE})` → `writeDistributionUiState({...EMPTY_UI_STATE, page: 3})` (+ assertion que `page` est bien déclaré dans `UI_STATE_PARAMS`) | **D-31 / EX-NAV-8** : la formulation d'origine est insatisfaisable — publier `page` sur l'état VIDE émettrait le défaut `page=1`, ce qu'`EX-NAV-8` interdit et ce que le **premier test du même fichier** vérifie (`writeDistributionUiState(EMPTY_UI_STATE) === []`). La propriété testée (l'écran D publie sa pagination dans l'URL, D-12/DR-066) est vérifiée sur une page non triviale |
| `tests/review/D8/fallback.test.ts › R-D8-27` (ex-« avec cache mais filtres posés ») | Sonde **verte documentant un défaut** retournée en sonde d'échec : exige `unappliedFilterIds`/`unappliedReason` et l'absence de publication « filtrée » | **D-32**, DR-103 nommément cité par la mission. Vue rouge avant correction, verte après |
| `tests/review/D8/fallback.test.ts › R-D8-32` (ex-« données invalides ») | Idem : exige `status === 'failed'` et un `errorCode` en `E-PROV-…` au lieu d'un `ready` suivi d'une `TypeError` | **D-32**, DR-158 nommément cité par la mission. Vue rouge avant correction, verte après |

**Sondes d'échec AJOUTÉES** (aucune n'existait) :
`tests/review/D8/fallback.test.ts › D-03 — un filtre déclaré unsupportedFilterIds …` (le plancher du
provider n'est jamais publié comme filtré, les filtres non appliqués sont nommés).

Tests de la suite par défaut adaptés (changement de contrat intentionnel, pas des « sondes de revue ») :
`src/app/navigation.test.ts`, `src/persistence/persistence.test.ts`, `src/screens/compare/structure.test.ts`
(identifiants DR-156) ; deux tests neufs dans `src/persistence/persistence.test.ts` (clé par entrée
D-16, cache de baseline D-29).

---

## 3. État des deux parcours cibles (journal, câblage par défaut 100 000 annonces)

Exécution enregistrée le 2026-09-08 (module de journal temporaire monté sur le contrôleur réel puis
retiré ; les mêmes valeurs sont vérifiées par `tests/review/D8/parcours.test.ts`).

**Parcours 1 — « budget 20 000 €, coupé, BE, < 100 000 km » (mode 1)**

```
[P1] start=ready source=SYNTHETIC snapshot=be-synthetic-100000-4b594341 n=100000
[P1] loadMarket({})       marques=294  offres=100 000  hasUserFilters=false
[P1] URL "priceto=20000&kmto=100000&body=3&cy=B"
     -> sélection {"priceTo":20000,"mileageTo":100000,"bodyType":["3"],"countryType":["B"]}
[P1] loadMarket(filtré)   marques=112  offres=2 656  hasUserFilters=true  activeFilterCount=4
                          filtres non appliqués=[]
[P1] carte de tête        make=74 (Volkswagen)  offres=267  médiane=10 850 €
```

Les quatre filtres sont réellement appliqués (`unsupportedFilterIds` vide) ; l'effectif est donc
publié comme filtré, ce que D-03 autorise. Le premier affichage n'appelle ni `fetchAggregates` ni
`fetchListingColumns` et n'instancie pas le moteur (O17, `o17.test.ts`).

**Parcours 2 — « Opel Corsa 2017 » (mode 2), puis « ouvrir l'annonce »**

```
[P2] enterMode2(54, 1918)                      nom=Opel Corsa  lot=1 352  Σ=1 352
                                               hash=1dcd2e7b7780b20b:EMPTY
[P2] + URL "?fregfrom=2017&fregto=2017"
     -> {"dateOfRegistrationFrom":2017,"dateOfRegistrationTo":2017}
     enterMode2(54, 1918, sélection)            Σ=54  selectionCount=54
                                               hash=1dcd2e7b7780b20b:35a0c206ac32bfef
                                               filtres non appliqués=[]
[P2] prix min/médiane/max = 10 150 / 15 200 / 20 150 €   G1 = 21 bins
     densité = 14 cellules   verdicts M1/M2 = 98
[P2] clic sur une ligne / un point -> window.open(listingUrl, '_blank', 'noopener')  (DR-010)
```

Les deux parcours se terminent : « Opel Corsa 2017 » ne montre plus les 1 352 Corsa de toutes années
mais les **54 de 2017** (le `selectionHash` change réellement de `:EMPTY` à `:35a0c206…`), et le
parcours 2 se conclut par un lien SORTANT réel.

---

## 4. Mesure `EX-NFR-9` après câblage (statique, 4G simulée)

```
npm run build
npx vitest run --config vitest.review.config.ts tests/review/D8/nfr9-size.test.ts \
                                                tests/review/D8/parcours.test.ts

[EX-NFR-9] openSnapshot = 127 ms, baseline = 0 ms
           transfert    = 186,9 Kio gzip -> 683 ms (dist présent, 2 × 150 ms de latence)
           TOTAL        = 810 ms   (budget 2 000 ms)
dist/assets/index-B53Xt4Il.js  273,26 Ko  |  gzip 89,47 Ko
dist/assets/index-Duw18Twg.css  10,98 Ko  |  gzip  2,54 Ko
```

Le câblage de la vague F2 (coquille S0, pied de page, fil d'Ariane, écrans E/F, cache de baseline)
laisse **1 190 ms de marge** sur `EX-NFR-9`. `fetchBaselineAggregates` est à 0 ms : la baseline est
précalculée par `openSnapshot` (fix-providers §6.2), le contrôleur ne la mémorise pas une seconde fois.

---

## 5. Points non faits / dette

| Sujet | État | Motif |
|---|---|---|
| **DR-104** — câbler `TweedehandsDataProvider` en mode 1 | **NON FAIT (dette assumée)** | `D-18` l'interdit explicitement tant qu'AC-01 n'est pas levée ; `R-D9-21` reste rouge et documente la dette. Le point d'injection `baselineCache` (D-29) est prêt et commenté dans `main.tsx` |
| `R-D7-16` (colonne TVA) | rouge | Dette **D-38** (aucun champ `taxDeductible` dans l'interface gelée) — hors périmètre |
| `R-D7-10` (graphes en dette) | rouge | Dette **DR-147** (§6.5) — hors périmètre |
| `D7/nuage-g4 › EX-DATA-101` | rouge | **D-48** : correction assignée à `fix-residual` dans `scatter-*.ts` (fichiers qui me sont interdits pendant F2) |
| `D6/seuil-60-marques › FAIT DE CORPUS` | rouge | **D-48** : `fix-docs` a harmonisé les deux textes ; la sonde D6 doit être retournée par `fix-residual`/le coordinateur (sondes `tests/review/D6/` hors de mon périmètre) |
| `EX-SCR-26` « leave-one-out » (`topRestrictiveFilters`) | vide | Dette antérieure du lot D8, non listée dans mon mandat : le calcul exigerait un balayage par filtre côté provider. Consigné tel quel |

---

## 6. Vérifications finales

```
npx tsc --noEmit -p tsconfig.json          → 0 erreur
npx tsc --noEmit -p tsconfig.worker.json   → 0 erreur
npx tsc --noEmit -p tsconfig.review.json   → 0 erreur
npx eslint src tests                       → 0 erreur, 0 avertissement
npm run build                              → 0 erreur (bundle 273,26 Ko / gzip 89,47 Ko)

npx vitest run --no-file-parallelism src/app src/orchestration src/persistence src/screens
                                           → 19 fichiers, 244 tests, tous verts

npm test (une seule fois, à la fin)        → 54 fichiers, 613 tests, tous verts
                                             (611 au départ + 2 tests neufs de persistance)

npx vitest run --config vitest.review.config.ts tests/review/D8
                                           → 8 fichiers, 103 tests, TOUS VERTS
npx vitest run --config vitest.review.config.ts tests/review/D7
                                           → 3 rouges : R-D7-10 (dette DR-147), R-D7-16 (dette D-38),
                                             nuage-g4 EX-DATA-101 (D-48, fix-residual)
npx vitest run --config vitest.review.config.ts   (suite de revue complète)
                                           → 767 passed | 17 failed (784) ; aucune rouge dans D8,
                                             les autres appartiennent à D2/D4/D5/D6/D9/patho
                                             (fix-residual, dettes actées D-17/D-18/D-38/D-45/§6.5)
```

## 7. Commits (branche `claude/kycar-project-ffcplk`, non poussés)

```
4c89f4d  DR-006 — filtres R du mode 2 appliqués (scission T/R, prédicats compilés, hash réel)
2d59e02  DR-010 — onOpenListing sur les écrans B et D, ouverture externe
46189be  DR-099 — validation taxonomique de la route + canonisation replaceState
4555429  DR-091, DR-157, DR-158, DR-103, D-03 — résilience provider et états de filtres honnêtes
9664a45  DR-096, DR-097, DR-098, DR-153, D-29 — persistance par entrée + cache de baseline
fd726ff  DR-092…095, DR-100…102, DR-154…156, DR-159, DR-152 + câblage fix-screens §3 + contrat d'URL
ffecceb  DR-093, DR-100, DR-101 — styles des régions neuves et ET-PARTIEL-CACHE
e20f5d0  DR-063, DR-102 — transport des filtres aux transitions de mode, effectif initial mode 2
```

Rien n'est poussé : le push relève du coordinateur (`CLAUDE.md` §1.3).
