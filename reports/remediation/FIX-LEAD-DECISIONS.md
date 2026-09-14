# Décisions du fix-lead — phase 2.6 (remédiation)

**Coordinateur de session (Fable, effort high), 2026-09-08.** Ces décisions répondent aux 20 points
de `reports/DEV-REVIEW.md` §5.4 et aux tensions §5.2/§5.3. Elles s'imposent à tous les agents
`fix-*`. Règle d'autorité appliquée : `R-A09` (formules → annexe A, disposition → annexe B,
mécanismes/NFR → annexe C) ; une décision d'arbitrage 2.2 (`ARB-xx`) prime sur la prose qu'elle
corrige ; quand deux textes de même autorité se contredisent, on retient celui qui ne fausse aucune
valeur affichée et on amende l'autre (fix-docs).

## A. Décisions numérotées

| # | Point (§5.4) | Décision | Conséquence / porteur |
|---|---|---|---|
| D-01 | O13 — encodage des drapeaux d'ingestion | `ListingColumnBatch.ingestFlags` passe de `Uint16Array` à **`Uint32Array`** ; encodage **positionnel** conservé (bit = index dans `INGEST_FLAG_VALUES`) ; **table explicite bit ↔ code** exportée par `src/types` (`INGEST_FLAG_BIT`, `hasIngestFlag`, `setIngestFlag`) ; 17 codes, 15 bits de réserve. Amendement de l'interface gelée 2.3, consigné (les deux copies `docs/plans/DataProvider.ts` et `src/providers/DataProvider.ts` restent identiques). | fix-foundation (étape 0). fix-docs met §A.1 à 17 |
| D-02 | `makeId` | `ListingColumnBatch.makeId` passe de `Int16Array` à **`Int32Array`** (ids AutoScout24 réels > 32 767). Même amendement d'interface. `modelId` reste tel quel si son domaine tient (à vérifier par fix-foundation, sinon `Int32Array` aussi). | fix-foundation (étape 0) |
| D-03 | Aiguillage des sélections mode 1 filtrées | **Compléter la table du provider** (`compileSelection` mappe tout identifiant du registre dont la colonne existe, `makesModelsVariants` compris via `TaxonomyScope`) **et exposer `unsupported`** : les résultats de `fetchAggregates`/`fetchSelectionCount` portent `unsupportedFilterIds: readonly string[]` (champ ajouté à l'interface). Le contrôleur **ne publie jamais** un effectif comme filtré quand cette liste est non vide : état dégradé nommé `ET-FILTRE-NON-APPLIQUE` listant les filtres, `hasUserFilters` reflète les seuls filtres appliqués. Pas de re-routage vers le moteur D4 en 2.6. | fix-foundation (champ d'interface) → fix-providers (table) → fix-app (contrôleur) |
| D-04 | T-a `EX-SCR-33` vs `EX-SCR-134` | **`EX-SCR-33` (ARB-17) prévaut** : paliers d'effectif uniques pour toute l'application ; `effectifTier` est câblé dans les trois fourchettes de la zone-modèle (P5/P95 masqués en `n ∈ [5,11]`, jeton `n = <n>`). | fix-screens (DR-069) ; fix-docs amende `EX-SCR-134` |
| D-05 | T-b `EX-DATA-99` | Éligibilité nuage/densité = **« prix valide »** : `priceStatus = QUOTED` ∧ ¬sentinelle absolue (D-A) ∧ ¬implausible en cellule. Cohérent avec `EX-DATA-16(e)`/19/60 et ARB-15. | fix-engine (DR-028) ; fix-docs réécrit `EX-DATA-99` |
| D-06 | T-c `EX-DATA-101` vs `100bis` | **`EX-DATA-101` fait foi** (pas régulier sur `listingId`, outliers conservés). `EX-DATA-100bis` est requalifiée en **propriété** (« identique octet à octet entre permutations »), satisfaite par 101. La graine `0x4B594341` est **retirée** du code et des exigences (elle n'a pas d'objet sous 101) ; la mention d'échantillonnage (`EX-DATA-103`) énonce le mode, `n_e`, `K`, le nombre de points, sans graine. | fix-screens (DR-149, retrait de `SCATTER_SAMPLING_SEED`) ; fix-docs amende `100bis`, `EX-SCR-157` |
| D-07 | §9.1 « rotation » | **Réécrire `EX-NFR-8` et `EX-NFR-15`** en « interaction continue (pan/zoom) sur les deux projections 2D commutables ». Aucune vue `G4c` WebGL ; `EX-NFR-11` reste « sans objet, garde posée ». `Maj`+glisser (DR-148) est implémenté par fix-screens à sa sévérité. | fix-docs ; fix-screens |
| D-08 | §9.2 plafond 5 000 / 20 000 | `EX-SCR-157` requalifiée : `K = 5 000` gouverne, mention d'échantillonnage au-delà ; **`ET-TROP-RESULTATS` supprimé** pour le nuage (et du §6.7 de l'annexe B). DR-146 = requalification documentaire, aucune ligne de code ; la sonde `R-D7-05` est retournée en « absence attendue » par fix-screens **après** l'amendement. | fix-docs (porteur), fix-screens (sonde) |
| D-09 | T-h `make` vs `mmmv` | **`mmmv` est le seul paramètre marque/modèle** (relevé sur AutoScout24, R6 ; présent dans `filters-scope.json`). `EX-NAV-5/15/16/17` sont **amendés** pour parler de `mmmv` : entrée en mode 2 = le bloc `mmmv` du couple choisi est absorbé par la route `/marche/:make/:model`, les autres filtres partagés sont conservés ; retour en mode 1 = le couple est réinjecté dans `mmmv`. `carryFiltersAcrossMode(selection, from, to)` implémente cela. | fix-state (DR-063) ; fix-docs |
| D-10 | T-g `EX-SCR-75` vs `EX-SCR-76` | **(a) retrait unitaire par l'infobulle** : un jeton par filtre portant le cardinal au-delà de 2 valeurs (`EX-SCR-75`/ARB-12) ; l'infobulle/popover du jeton liste les valeurs, chacune avec sa croix (`EX-SCR-76` satisfaite « en substance » : le retrait unitaire est possible). `removesCodes` porté par chaque cible de retrait. | fix-state (DR-062) ; fix-docs précise `EX-SCR-76` |
| D-11 | T-j `g4v`, `selx`/`sely` | **Le codec D5 est l'autorité sur l'URL** : `g4v ∈ {a, b}` ; intervalles `selx`/`sely` au format **`lo-hi`**. D7 s'aligne. Un test d'aller-retour croisé D5 → D7 → D5 est ajouté dans `src/state/` (propriété : rendu = fonction pure de l'URL, `EX-NAV-18`). | fix-state (DR-064/065, livrés ensemble), fix-screens consomme |
| D-12 | `page`/`size` (et `sel`) | **Paramètres d'état d'interface** (`EX-NAV-10bis`) : hors registre de filtres, hors classes T/R, hors `selectionHash`/`localDatasetKey`, `historyMode: 'replace'`, présents dans l'URL. L'écran D lit/écrit `page` depuis l'URL ; `sel` restreint l'affichage de l'écran D (bornes d'axes) sans changer Σ. | fix-state (DR-066/067, déclarations + codec) ; fix-screens (lecture) |
| D-13 | Format de `m` | **`<makeId>-<modelId>`** (annexe C, autorité sur l'encodage). `EX-SCR-194` corrigée. | fix-screens (DR-085) ; fix-docs |
| D-14 | T-p R3 / `zip`, `lat`, `lon` | **(a) Exclure** les trois du périmètre retenu de `filters-scope.json` avec le motif `R3_DONNEE_PERSONNELLE` (même traitement que `cid`). Aucun filtre géographique fin en 2.6 ; le pays/la région restent disponibles. Le test de balayage exigé par `EX-DATA-49` est écrit. | fix-engine (DR-026 : `data/reference/`, `src/types/reference.ts`) ; fix-state retire les 3 du registre |
| D-15 | T-n `ARB-30` / `damaged_listing` | `damaged_listing` **reste en classe D** (motif relevé : rejeté par le marketplace belge, R6). `ustate`, `powertype`, `cy`, `atype` sont marqués `nonExposed` conformément à `EX-SRCH-18bis` (DR-052). Conséquence assumée : **aucun contrôle utilisateur « accidentés » en 2.6** ; `ARB-30` est amendé en ce sens et l'absence est consignée comme dette produit. | fix-state (DR-052) ; fix-docs |
| D-16 | T-q persistance CRUD | **Une clé `localStorage` par entrée** (`kycar:<collection>/<id>`) + une clé d'index ordonné ; `mutate` n'écrit que l'entrée touchée et l'index ; réconciliation sur l'événement `storage`. Pas de `navigator.locks`. | fix-app (DR-096) |
| D-17 | DR-034 GROUPSTAT/NTILE dans le worker | **DETTE consignée** (MAJEUR mis en dette, motif : aucune valeur affichée fausse, D7 calcule les mêmes valeurs sous budget 78,6 ms p50 / 300 ms ; coût = module moteur complet + protocole). Reportée en 2.7 avec `EX-DATA-83bis` explicitement marquée non tenue. | fix-verify consigne dans `REMEDIATION.md` |
| D-18 | Lot D9 | **Corriger les défauts de code** BLOQUANT (DR-016, DR-017, DR-018) et les MAJEUR de normalisation/agrégation (DR-037, 041–048 selon coût) — un adaptateur faux n'a pas sa place dans le dépôt même non câblé. **Ne pas câbler** (DR-104 : AC-01 non levée → **DETTE explicite**, MAJEUR mis en dette) ; `/mentions` dit que la source par défaut est `SYNTHETIC` (DR-152). DR-127…130 en dette (provider non câblé). | fix-providers ; fix-app (DR-152) ; fix-verify consigne |
| D-19 | Débounce T-k / T-l | **Annexe C, autorité sur les mécanismes** : la table `EX-SRCH-1…8` par type de contrôle fait foi (T-k option a), la protection contre les rafales étant `ARB-57` (déjà conforme). Champ numérique : **500 ms** (`EX-SRCH-4`) **plus** validation immédiate au `blur` et à `Entrée` (gestes d'interaction, annexe B) ; `EX-SCR-86` amendée à 500 ms. `EX-SCR-57` amendée pour renvoyer à la table. | fix-state (DR-055…061 selon les constats) ; fix-docs |
| D-20 | Fichiers hors clusters | `tools/`, `vite.config.ts`, `package.json`, `tsconfig*.json`, `data/reference/` → **fix-engine**. `DEV.md`, `docs/**`, `README.md` → **fix-docs**. `src/app.tsx`, `src/main.tsx`, `src/app/` → **fix-app exclusivement** (voir D-21). | — |

## B. Décisions complémentaires

| # | Sujet | Décision |
|---|---|---|
| D-21 | Chevauchement `app.tsx` | **fix-screens ne touche pas `app.tsx`/`main.tsx`.** Il expose ce dont ses écrans ont besoin (props, callbacks, modèles de vue) et liste dans son rapport, constat par constat, le câblage attendu de la coquille. **fix-app** réalise ce câblage en vague F2, après fusion de F1. |
| D-22 | Modèle de fix-providers | **Opus/high** (recommandation du consolidateur : 8 BLOQUANT dont interface). La fiche `.claude/agents/fix-providers.md` est mise à jour ; `CLAUDE.md` §2 le note. |
| D-23 | T-m deux canonisations | Aucune modification de code : `EX-DATA-108` précise que la règle est unique mais s'applique à deux espaces d'identifiants (KYCAR côté D2, AutoScout24 côté D5), chaque implémentation renvoyant à l'autre. fix-docs. |
| D-24 | T-o `EX-DATA-107` | (a) `snapshotId` + `describe()` suffisent ; l'affichage `SYNTHETIC` sur A/B/D est corrigé (DR-094) par fix-app. Pas d'amendement d'interface. |
| D-25 | T-d I7 vs `EX-DATA-102` | (a) I7 précise que la marginale de la grille porte sur l'ensemble **éligible** ; le moteur ne change pas. fix-docs. |
| D-26 | T-e `EX-SCR-158` vs `184` | **Un bouton** « Convertir la sélection en filtre » (`EX-SCR-184`, seul chemin qui change Σ) **plus un lien** « Voir ces annonces » vers l'écran D porteur de `sel` (D-12), qui ne change pas Σ. `EX-SCR-158` amendée en ce sens. fix-screens (DR-079) ; fix-docs. |
| D-27 | T-f `EX-SCR-208` | Pagination client 50 conservée ; `EX-SCR-208` amendée. fix-docs. |
| D-28 | T-u biais d'échantillon source réelle | Rattaché à DR-104 (dette) : un marqueur `sampleBiased` sera exigé **avant** tout câblage réel. Consigné, pas codé en 2.6. |
| D-29 | §9.3 pour `AGGREGATE_SURFACE` | Réconciliation : le précalcul + cache s'impose aux providers `LISTINGS` (baseline calculée une fois à l'ingestion, mise en cache IndexedDB, jamais recalculée à `start()`) ; un provider `AGGREGATE_SURFACE` fait un aller par appel **mais** sa baseline est mise en cache IndexedDB après le premier succès et lue d'abord. DR-049 (synthétique) est corrigé par fix-providers (baseline précalculée, annonces générées en tâche de fond, hors chemin critique) ; DR-050 par fix-providers (cache) ; §6.3/§9.3 réécrits par fix-docs. |
| D-30 | DR-038/DR-126 réalisme du dataset vs `EX-NFR-1`/`3` | Le **budget prime** : si rendre le texte réaliste fait tomber `EX-NFR-3` (≤ 6 Mo gzip), on plafonne la longueur générée des versions pour rester sous budget avec ≥ 10 % de marge, et on le documente. fix-providers re-mesure après correction. |
| D-31 | Sondes de revue jugées fausses | Un correcteur qui estime une sonde fausse ne la modifie **qu'avec** une justification écrite (référence d'exigence) dans son rapport ; sinon il fait passer la sonde telle quelle. fix-verify contrôle chaque sonde modifiée. |
| D-32 | Sondes vertes documentant un défaut (DR-011, DR-071, DR-072, DR-103) | Le correcteur écrit **d'abord** la sonde d'échec, la voit rouge, corrige, la voit verte. |

## C. Séquencement retenu

```
Étape 0 (SÉQUENTIEL, arbre principal) — fix-foundation (Opus/high)
  D-01, D-02, D-03 (champ d'interface), DR-012, + exports partagés de src/types attendus par
  plusieurs clusters : PRICE_SENTINEL_ABSOLUTE_EUR, isPriceSentinelAbsolute, HP_TO_KW, listingKey,
  DUPLICATE_CONFLICT_FIELDS, cleanModelVersion (80 car., frontière de mot, repli ADV-17), table
  bit ↔ code. Compilation verte, suite verte, sondes de revue : les rouges restent rouges sauf
  celles que l'étape 0 résout (DR-007, DR-012, DR-013 et les sondes « symbole absent »).
        │  fusion, build + lint + npm test + npm run test:review, commit, push
        v
Vague F1 (PARALLÈLE, worktrees isolés, node_modules symlinké)
  fix-engine Opus/high · fix-providers Opus/high · fix-state Sonnet/high ·
  fix-screens Sonnet/high (sans app.tsx) · fix-docs Sonnet/high
        │  fusions --no-ff dans l'ordre : engine → providers → state → screens → docs ;
        │  après CHAQUE fusion : build + lint + npm test + npm run test:review
        v
Vague F2 (SÉQUENTIEL, arbre principal) — fix-app Opus/high
  DR-006, DR-010, DR-099, DR-091…DR-103, DR-152, câblage listé par fix-screens, D-03 contrôleur,
  D-16 persistance. DR-104 non fait (D-18).
        │
        v
fix-verify Opus/high → reports/REMEDIATION.md
        │
        v
Coordinateur : porte G5, promotion des sondes dans la suite par défaut, journal, handoff, push.
```

Dépendances honorées : DR-013 avant tout drapeau (étape 0) ; DR-025 (`cleanModelVersion`) avant
DR-126 (étape 0) ; DR-064–067 livrés ensemble par fix-state avant que fix-screens ne soit fusionné
(ordre de fusion) ; DR-038 avant toute re-mesure M1/M2 (fix-providers, en interne) ; DR-104 jamais.

## D. Amendements après l'étape 0 (fix-foundation, 2026-09-08)

| # | Sujet | Décision |
|---|---|---|
| D-33 | `unsupportedFilterIds` et `fetchSelectionCount` | Le champ est porté par `AggregateResult` seulement (retour de `fetchAggregates`) ; `fetchSelectionCount` garde `Promise<number>`. Le contrôleur (fix-app) détermine l'état `ET-FILTRE-NON-APPLIQUE` à partir de `fetchAggregates` ; fix-providers garantit que `fetchSelectionCount` applique exactement le même `compileSelection` (même liste `unsupported`), prouvé par un test qui compare les deux chemins. |
| D-34 | Sonde `tests/review/D4/pruning-facets-density.test.ts › EX-DATA-116` passée au rouge après DR-007 | Non-régression de valeur, mais dépendance à l'ordre de sommation dans `src/engine/scan.ts` (concaténation de tranches d'index sans fusion triée, écart de 1 ulp sur `deviationPct`). Remise à **fix-engine** : rendre le balayage élagué et le balayage complet identiques octet à octet (fusion triée des tranches ou sommation en ordre canonique), sonde à faire passer sans la modifier. |
| D-35 | Nom du symbole « modèle non identifié » | `MODEL_ID_UNRESOLVED` (déjà exporté) ; aucun alias `MODEL_UNRESOLVED_ID` n'est créé. |
| D-36 | Conflit résiduel `EX-SCR-114` vs `EX-SCR-33`/`134` (signalé par fix-docs) | « Jamais masquées » porte sur la présence des trois fourchettes et de l'effectif ; leur contenu suit les paliers ARB-17 (P5/P95 → min/max + jeton `n = <n>` pour 5 ≤ n ≤ 11). `EX-SCR-114` amendée par le coordinateur. |
| D-37 | Conflit résiduel `EX-DATA-49` (D-14) vs `EX-SRCH-6`/`7` (`zip`, `zipr`) | Les deux lignes passent **sans objet** (filtres exclus du périmètre, motif R3), conservées pour la traçabilité de la table. Amendées par le coordinateur. |
| D-38 | DR-082 colonne « TVA » de l'écran D (signalé NON FAIT par fix-screens) | **DETTE** : aucun champ `taxDeductible` dans `ListingColumnBatch` (interface gelée) ni dans les providers ; ajouter le champ est un amendement d'interface + ingestion hors budget 2.6. Consigné ; la sonde `R-D7-16` reste rouge sur cette seule colonne. |
| D-39 | DR-149 retrait de `SCATTER_SAMPLING_SEED` (signalé NON FAIT par fix-screens) | Appliqué par le coordinateur : export retiré, test unitaire et sonde `tests/review/D7/nuage-g4.test.ts` requalifiés (D-06 : la sonde documentait une exigence amendée ; justification D-31 consignée ici). |
| D-40 | DR-143 grille 4 lignes en régime compact | **DETTE** (déjà recommandée §6.5 de DEV-REVIEW) : mise en page CSS sans effet sur une valeur affichée. |
| D-41 | Trois sondes modifiées par fix-providers (`R-D9-11b`, `R-PATHO-02`, sonde D8 « distributions ») | **Acceptées** : chaque modification est justifiée par une exigence (`R-D9-11b` insatisfaisable arithmétiquement ; `R-PATHO-02` contredisait `ARB-16` qu'elle citait ; la sonde D8 comparait l'échantillon valide à un minimum brut, distinction créée par DR-001). fix-verify contrôle les trois diffs. |
| D-42 | D-30 : marge gzip `EX-NFR-3` à 9,2 % (cible interne 10 %) | **Acceptée** : l'exigence est ≤ 6 Mo gzip (5,45 Mo mesurés) ; les 10 % étaient un objectif du fix-lead, pas une exigence. Consigné, pas de nouvelle action. |
| D-43 | DR-152 « source exposée depuis `ProviderCapabilities` » | La part statique (mentions : 2dehands, robots.txt, AC-01, source par défaut SYNTHETIC) est livrée par fix-screens. La part dynamique passe par `describe()` + `snapshotId` (D-24), câblée par fix-app ; aucun amendement d'interface. |

## E. Arbitrages après la vague F1 (2026-09-08)

| # | Sujet | Décision |
|---|---|---|
| D-44 | `R-PATHO-03` — portée de la sentinelle relative `PRICE_IMPLAUSIBLE_IN_CELL` sur les statistiques §B.2 | **Lecture littérale d'`EX-DATA-60`** : une sentinelle (absolue ou relative) est exclue de `V_price`, donc des statistiques de prix (`price.n`, médiane, P5/P95, min/max) **et** de M1/M2. Calcul en deux passes par cellule : médiane de référence sur l'ensemble déjà purgé des sentinelles absolues, puis marquage relatif, puis statistiques sur ce qui reste. Les sondes vertes qui tombent parce qu'elles comptaient une annonce implausible dans `price.n` contredisent `EX-DATA-60` : elles sont amendées avec justification (D-31). Si l'exemple littéral d'`ADV-02` devient inatteignable, le rapporter NON FAIT avec les deux lectures. Porteur : fix-residual (moteur). |
| D-45 | DR-114 — verdicts `INSUFFICIENT_DATA`/`INSUFFICIENT_SPREAD` par annonce | **DETTE** (MINEUR) : exigerait d'étendre un vocabulaire gelé de 6 à 8 codes et contredit 4 sondes vertes ; à instruire en 2.7 avec l'annexe A. |
| D-46 | `R-PATHO-09 (moteur)` / `R-PATHO-10 (moteur)` — déduplication côté moteur | Le moteur **ne déduplique pas** : la déduplication est une responsabilité d'ingestion (DR-003/004, livrées par fix-providers), une seconde passe dans le moteur doublerait le coût sans exigence. Les deux sondes « (moteur) » sont requalifiées pour prouver que le moteur reçoit des lots déjà dédupliqués des deux providers (justification D-31). Porteur : fix-residual. |
| D-47 | `R-PATHO-04`, `R-PATHO-05`, `R-PATHO-11` — bornes de plausibilité et troncature à l'ingestion | **À corriger** dans les deux providers (résidu du cluster fix-providers) : kilométrage hors domaine → `INCONNU` + drapeau, puissance 0 → `INCONNU`, `cleanModelVersion` appliquée à l'ingestion (ADV-17/ARB-61). Porteur : fix-residual. |
| D-48 | Sonde D6 « FAIT DE CORPUS » (`EX-SRCH-26` vs `EX-SCR-32`) et sonde D7 `EX-DATA-101` passée au rouge après fix-engine | fix-docs a harmonisé les deux textes (T-t) : la sonde D6 est retournée pour attester l'égalité. La sonde `EX-DATA-101` : diagnostiquer (indice `OutlierIndex.has()` sur `flags.length`) et corriger dans `src/screens/distribution/scatter-*.ts` **uniquement** (fichiers réservés à fix-residual pendant F2 ; fix-app ne les touche pas). |
| D-49 | Promotion des sondes dans la suite par défaut (clôture 2.6) | Les sondes vertes sont promues telles quelles. Une sonde rouge correspondant à une **dette consignée** (D-17, D-18, D-38, D-40, D-45, §6.5) est convertie en `it.fails(...)` annotée `DETTE DR-xxx / D-xx` : elle reste exécutée, documente l'écart, et se signale d'elle-même le jour où la dette est levée. Jamais de `skip`. Toute sonde rouge sans dette consignée bloque la porte G5. |
| D-50 | Leçon d'outillage : `git worktree remove --force` sur un worktree portant un lien symbolique `node_modules` | Le lien doit être supprimé (`rm <worktree>/node_modules`) **avant** `git worktree remove` ; sinon le `node_modules` de la racine peut être détruit ou remplacé par un lien sur lui-même (constaté le 2026-09-08, réinstallation `npm ci` nécessaire). Consigné dans `CLAUDE.md`. |
| D-51 | `ADV-02` : le chiffre littéral « 119 € » n'est plus atteignable après D-44 (signalé par fix-residual) | **D-44 maintenue** : 119 € sous 0,10 × médiane est une sentinelle relative, hors `V_price` (`EX-DATA-60`). La sonde `VER-ETIQ-A` rejoue l'attaque `ADV-02` avec un prix bas non capté par la règle (1 400 €) et vérifie `ARB-19` à l'identique : l'attaque reste mesurée, seul l'exemple numérique change. L'observation « seuil de Σ ≠ seuils par cellule d'analyse » (`outlierEvaluatedCount` majoré par l'échantillon purgé des seules sentinelles absolues) est versée au dossier 2.7 comme point d'instruction, pas comme défaut. |
