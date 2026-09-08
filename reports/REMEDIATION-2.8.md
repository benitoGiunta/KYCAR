# REMEDIATION-2.8 — vérification finale de la phase 2.8 (**rev 2**)

Agent `fix-verify` · modèle Opus · effort high · 2026-09-08 · branche `claude/kycar-project-ffcplk`
· arbre principal `/home/user/KYCAR` · **commit vérifié `c8c791a`**
(« Phase 2.8 (D8-35 follow-up): never reuse a stale preview server in the e2e harness »),
arbre propre à l'arrivée (`git status --short` vide).

**Indépendance (R5).** Je n'ai corrigé aucun constat. **Ce fichier est mon seul livrable** ; aucun
fichier de `src/`, `tests/`, `docs/` ni aucun autre rapport n'a été modifié par moi. Une seule
exception, temporaire et exigée par ma mission (§5.4) : la contre-épreuve `D8-27` remplace
`src/screens/distribution/DistributionScreen.tsx` par sa version de `3435456` le temps d'une
exécution, puis le restaure par `git checkout --` (contrôle de propreté cité). Aucun commit, aucun
push, aucun appel réseau vers `autoscout24` / `2dehands`, aucune installation (`playwright install`
jamais lancé), aucune question posée (E3), toute hypothèse écrite comme telle (E4).

---

## 0. Rev 2 — ce qui a changé depuis la rev 1

La **rev 1** (commit `d94d0a2`) concluait **G7 NON FRANCHIE** : S1 et S4 non atteints, sur **huit
exigences `PARTIELLE` sans correction ni dette**, **une correction sans preuve** (`onClearFilter`),
**un renvoi de correcteur non ratifié** (`FV-06` mode 1) et **cinq arbitrages en attente**. Le
fix-lead a répondu par `FIX-LEAD-DECISIONS-2.8.md` §E (`D8-27`…`D8-33`), une **vague F3**
(`fix-engine-2`, `fix-state-2`, `fix-screens-2`, `fix-docs-2`, puis `fix-app-2`), puis §F
(`D8-34`, `D8-35`). 40 commits, `d94d0a2..c8c791a`.

| Réserve de la rev 1 | Traitement F3 | État en rev 2 |
|---|---|---|
| **8 exigences `PARTIELLE` ouvertes** (`EX-DATA-61`, `64`, `23`, `EX-SCR-17`, `101`, `153`, `174`, `212`, `EX-SRCH-14`) | `D8-30`, `D8-31` | **8 / 8 CORRIGÉES**, chacune par une sonde rouge → verte que j'ai rejouée (§3.1) |
| **`onClearFilter` sans preuve** (§7.4 rev 1) | `D8-27` | **COUVERT** — sonde `R-D7-2.8-01` ; contre-épreuve **rejouée par moi** sur les deux commits (§5.4) |
| **`FV-06` mode 1 renvoyé sans décision** | `D8-29` | **DETTE ÉCRITE ET RATIFIÉE**, texte vérifié dans `draft-screens.md` (§6.2) — **acceptée** au titre de S4 (§6.4) |
| **5 arbitrages en attente** (§7.2 rev 1) | `D8-32` (1)…(5) | **5 / 5 CLOS**, textes d'annexe vérifiés par `grep` (§7.3) |
| **2 corrections hors périmètre de fix-app** (§7.3 rev 1) | `D8-28` | **RATIFIÉES** par le fix-lead, conformément à mon avis (§7.4) |
| **`reports/e2e/results.json` suivi et régénéré** | `D8-33` | Règle écrite ; il a de nouveau changé sous mes exécutions (§9) |
| — | `D8-34` | `EX-SCR-216` en mode 2 : `—` partout → effectifs réels (§3.3) |
| — | `D8-35` | `EX-SCR-103` (couple de la route) et `EX-SCR-97` (feuille compacte sous l'en-tête) ; le **seul échec E2E inattendu** de fix-app-2 est **vert** dans ma recette (§2.1, §3.3) |

**Ce qui reste, et qui décide de la porte.** Les écarts de la rev 1 sont soldés. Deux écarts
**nouveaux**, remontés honnêtement par les correcteurs eux-mêmes et qu'**aucune décision `D8-xx`
ne tranche**, prennent leur place (§7.1). Ils sont d'une autre nature que ceux de la rev 1 :
**aucun code n'est en cause**, aucune valeur affichée n'est fausse, et deux lignes de décision
écrite suffisent à les fermer. La porte G7 reste néanmoins **NON FRANCHIE** — motivation au §8.

---

## 1. Commandes rejouées et leurs sorties

Séquentiellement, sur cet arbre, sans autre agent actif, port 4180 libre au départ
(`ss -ltn` : aucun port 4180/4173/5173 occupé — le `vite preview` résiduel signalé par
`fix-state-2` §9bis.2 avait bien été tué).

```
$ git log --oneline -1
c8c791a Phase 2.8 (D8-35 follow-up): never reuse a stale preview server in the e2e harness
$ git status --short
(sortie vide)

$ npm run build
✓ 149 modules transformed.
dist/assets/aggregation.worker-BVhtBzDh.js   37.80 kB
dist/assets/index-DWJLif2D.css               33.10 kB │ gzip:   5.79 kB
dist/assets/index-CsIqf94M.js               323.64 kB │ gzip: 105.35 kB
✓ built in 1.29s          → 0 erreur / 0 warning, exit 0

$ npm run lint
(aucune sortie)           → exit 0

$ npm run size
[size] initial bundle (static from entry) - EX-NFR-10:  102.88 KiB
[size] chunks shipped outside the manifest graph (worker):  13.46 KiB
[size] budgets: initial 116.34/300 KiB gzip, deferred 0.00/400 KiB gzip.
[size] OK: within budget.  → exit 0

$ npm test                 # vitest run PUIS vitest run --config vitest.review.config.ts
  Test Files   58 passed (58)      Tests   675 passed (675)     # suite unitaire
  Test Files  100 passed (100)     Tests  1079 passed (1079)    # sondes de revue
  → exit 0

$ npm run test:perf
  Test Files  2 passed (2)         Tests  7 passed (7)          → exit 0

$ npm run test:e2e         # build de prod servi sur 4180, 3 projets
  Running 255 tests using 1 worker
  ✘   84 [desktop] responsive.spec.ts:208 › DETTE D8-15 … (EX-SCR-95)
  ✘  169 [tablet]  responsive.spec.ts:208 › DETTE D8-15 …
  ✘  254 [mobile]  responsive.spec.ts:208 › DETTE D8-15 …
  9 skipped
  246 passed (9.9m)
  → exit 0 — 255 tests : 243 verts, 3 ÉCHECS ATTENDUS (les 3 `test.fail()` de D8-15, comptés
    « passed » par Playwright), 9 sautés, 0 ÉCHEC INATTENDU
```

Les quatre lignes `[size] FAIL` émises pendant la suite de revue sont les sondes D1 sur
**manifestes factices** : cas de test attendus, pas des dépassements. `npm run size` réel est **OK**.

---

## 2. Décomptes et budgets rejoués

### 2.1 Suites

| Suite | Fichiers | Tests | Passés | Échoués | `it.fails` / `test.fail()` | Sautés | Rev 1 |
|---|---:|---:|---:|---:|---:|---:|---|
| Unitaire | **58** | **675** | 675 | 0 | 0 | 0 | 58 / 675 (=) |
| Sondes de revue | **100** | **1 079** | 1 079 | 0 | **2** (échouent comme attendu, donc comptées « passées ») | 0 | 87 / 953 (**+13 fichiers, +126 sondes**) |
| Performance | 2 | 7 | 7 | 0 | 0 | 0 | 2 / 7 (=) |
| Recette navigateur (3 projets) | 9 `*.spec.ts` × 3 | **255** | **243 verts** | **0 inattendu** | **3** attendus (`D8-15`) | **9** | 237 / 225 / 3 / 9 (**+18 tests**) |

- **L'échec `mobile` d'`EX-SRCH-14`** que `fix-app-2` §5.4 avait délibérément laissé rouge est
  **vert dans ma recette, sur les trois projets** (`✓ 51 desktop · ✓ 136 tablet · ✓ 221 mobile`,
  mesure identique `/marche?mmmv=74&priceto=20000`) : la correction `D8-35`/`EX-SCR-97`
  (`.kycar-filter-band--compact { z-index: 20 }`) tient. **0 échec inattendu**, contre 1 chez
  `fix-app-2`.
- `0 saut`, `0 todo`, `0 .only` sur les deux suites Vitest — règle **D-49** tenue, vérifié par
  `grep -rn 'it\.skip\|test\.skip\|describe\.skip\|it\.todo\|test\.todo\|\.only(' tests/review/ src/`
  → **aucune occurrence**.
- Les **9 sautés** E2E sont les mêmes inadéquations de plate-forme qu'en rev 1 (`E2E-17`/`E2E-18`
  hors compact ×2 projets ; `E2E-04`, brossage, `E2E-03`, `E2E-06`, `E2E-07` en compact), chacune
  motivée en clair. **Aucun saut nouveau.**

### 2.2 Budgets

| Budget | Exigence | Mesuré à `c8c791a` | Marge | Rev 1 |
|---|---|---|---|---|
| Bundle initial gzip | `EX-NFR-10` ≤ 300 Kio | **102,88 Kio** (entrée) ; **116,34 Kio** entrée + worker | 61 % | 112,49 Kio (**+3,85**) |
| Bundle différé | `EX-NFR-11` ≤ 400 Kio | 0,00 Kio | — | = |
| Recalcul FULL non élagué, N = 100 000 | `EX-NFR-5` **p95** ≤ 200 ms | p50 160,9 · **p95 181,1** · max 203,6 ms | 9,5 % au p95 | p95 181,1 ms (=) |
| Recalcul élagué (m = 9 283) | `EX-NFR-5` p95 ≤ 200 ms | p50 76,8 · **p95 92,4** · max 113,9 ms | 54 % | 97,4 ms (−5) |
| Facettes différées (8 filtres) | `EX-DATA-110bis` p95 ≤ 100 ms | p50 18,6 · **p95 20,4 ms** | 80 % | 20,7 ms |
| Rendu initial du nuage, 5 000 pts | `EX-NFR-7` p95 ≤ 500 ms | p50 1,22 · **p95 2,98 ms** | 99 % | 3,91 ms |
| Interaction continue 10 s | `EX-NFR-8` ≥ 30 img/s sur ≥ 95 % | **100 % (91/91, min 376 img/s)** | — | 100 % |
| Repeint du nuage, navigateur | `EX-NFR-7` | médiane **22 ms** (desktop et tablet) | — | non relevé en rev 1 |
| Repeint d'histogramme, navigateur | `EX-NFR-6` ≤ 300 ms | médiane **141 ms** desktop, **127 ms** tablet | 53 % | — |
| Mémoire colonnaire / lot gzip | `EX-NFR-1` ≤ 25 Mo · `EX-NFR-3` ≤ 6 Mo | 17,26 Mo · 5,47 Mo (sondes D3 vertes dans les 1 079) | 31 % · 8,8 % | = |

**`EX-NFR-9` — série complète par projet** (4G simulée : 4 Mb/s, 150 ms ; cache vidé ; 5 mesures ;
budget 2 000 ms) :

| Projet | `/marche` nu | Médiane | Max | URL déjà filtrée (médiane) | Transféré |
|---|---|---:|---:|---:|---:|
| `desktop` | 1529 / 1560 / 1488 / 1510 / 1488 | **1 510 ms** | 1 560 | 1 608 ms (max 1 628) | 212 Kio |
| `tablet` | 1533 / 1514 / 1491 / 1504 / 1488 | **1 504 ms** | 1 533 | 1 620 ms (max 1 751) | 212 Kio |
| `mobile` | 1505 / 1485 / 1486 / 1502 / 1486 | **1 486 ms** | 1 505 | 1 612 ms (max 1 743) | 212 Kio |

Aucune mesure, sur aucun projet, ne dépasse le budget ; le maximum absolu observé (1 751 ms, URL
filtrée, tablet) laisse 249 ms de marge. La dispersion introduite par `D8-02` en rev 1 (écart-type
240 ms sans plancher) **ne réapparaît pas** : les cinq mesures de `/marche` nu tiennent dans 72 ms
sur les trois projets réunis.

**Deux observations chiffrées, sans réserve bloquante.** (a) Le bundle gagne **3,85 Kio gzip** en F3
(axes de G4 et de G7, bloc `ET-VIDE-FILTRES`, cartes de l'écran E, module `restrictive-filters`,
`ineffective-filters`) — 61 % de marge restante. (b) `EX-NFR-5` **FULL** affiche un **max à
203,6 ms**, au-dessus de 200 : le budget porte sur le **p95** (181,1 ms), que l'exigence énonce
explicitement, et la sonde le mesure comme tel ; c'est une queue de distribution, pas un
dépassement. Je le signale plutôt que de le taire.

---

## 3. Matrice constat → décision → correction → preuve → statut

### 3.1 Les huit écarts du §7.1 de la rev 1

Chaque ligne : la décision, le porteur, la correction, la **sonde d'échec documentée rouge avant /
verte après par le correcteur**, et le rejeu que **j'ai** fait (toutes ces sondes sont dans les
1 079 vertes de `npm test`, fichier par fichier ci-dessous).

| # | Exigence | Décision | Porteur | Correction | Preuve (rouge → verte) | Rejeu fix-verify | Statut |
|---|---|---|---|---|---|---|---|
| 1 | **`EX-DATA-61`** et **`EX-DATA-64`** — `MetricStats.iqr` / `coverage` publiés `null` (résidu `DR-122` que fix-engine et fix-providers s'étaient renvoyé) | `D8-30` | fix-engine-2 (`6c1b548`) | `src/engine/quantiles.ts` : `iqr = p75 − p25` et `coverage = round₄(n/N)` aux **trois** sites (`metricStatsFromCounts`, `emptyStats`, `exactStatsBySort`), paramètre `selectionCount` optionnel ; `src/engine/aggregate.ts` passe `\|Σ\|` | `R-D4-2.8-01…04`, **11 rouges sur 14** avant, 14 vertes après | `✓ tests/review/D4/metric-stats-iqr-coverage.test.ts (14 tests)` ; `grep -n 'iqr:' src/engine/quantiles.ts` → plus aucun littéral `null` sur les chemins à `n ≥ 1` | **CORRIGÉ** (voir la réserve §7.1 n° 1 sur les agrégats marque/modèle) |
| 2 | **`EX-DATA-23`** — parsing de `firstRegistrationYearMonth`, `FIRST_REG_UNPARSEABLE` jamais posé | `D8-31` | fix-engine-2 (`426b32b`) | `src/types/shared-rules.ts` : `parseFirstRegistrationYearMonth` — deux motifs **ancrés** avec le mois **énuméré** (`00`, `13`, `5/2024`, `05/24`, espaces d'encadrement tous refusés), résultat portant **à la fois** la valeur et le drapeau, encodage colonnaire `12·y + (m−1)` | `R-D2-2.8-01…03`, **12 rouges sur 12** (`is not a function` : la règle n'existait dans **aucun** module), 12 vertes après | `✓ tests/review/D2/first-registration-parsing.test.ts (12 tests)` | **CORRIGÉ** (voir la réserve §7.1 n° 3 : aucun appelant vivant) |
| 3 | **`EX-SCR-17`** — bascule d'échelle log de G7 absente | `D8-31` | fix-screens-2 (`d690d63`) | `G7` reçoit d'abord un **vrai axe des prix** (`priceBins` de la grille `BIN`, bins de débordement écrêtés `EX-SCR-18`), puis la bascule `log10` (plancher à 1 €), bouton `aria-pressed`, `data-price-scale`, paramètre `g7log` | `R-D7-2.8-02/03/04` rouges → vertes ; `R-D7-2.8-05/06/07` vertes d'emblée (exclusivité G4/G1, encodage de `g7log`) | `✓ tests/review/D7/echelle-log-prix-2.8.test.ts (6 tests)` ; `✓ tests/review/D5/graph-log-param.test.ts` ; E2E `EX-SCR-17 — bascule log de G7` vert ×3 | **CORRIGÉ** |
| 4 | **`EX-SCR-101`** — filtre devenu invalide après changement de snapshot, ni conservé-marqué ni compté | `D8-31` | fix-state-2 (`a9a7bf2` → `d710bd3`) logique ; fix-app-2 (`9ac896f`) câblage | `src/state/ineffective-filters.ts` (module neuf, pur) ; jeton ambre `data-ineffective="true"` + infobulle `Cette marque est absente du snapshot du <date>` + `aria-describedby` (la couleur n'est jamais le seul signal, `EX-SCR-99`) ; compteur distinct `1 filtre sans effet` ; **jamais de retrait automatique** | `R-D5-2.8-01/02`, 14 cas rouges (module absent) → verts ; `R-D8-2.8-01` (câblage `snapshotDate` **sans** `?? null`) | `✓ tests/review/D5/ineffective-filters.test.ts (14 tests)` ; `✓ tests/review/D8/shell-wiring-f3.test.ts (19 tests)` ; E2E `EX-SCR-101 — marque absente du snapshot` vert ×3 | **CORRIGÉ** |
| 5 | **`EX-SCR-153`** — G4a non aligné sur les bornes/buckets de G1 ; **aucun axe dessiné** | `D8-31` | fix-screens-2 (`f5da9c2`) | `scatter-model.ts` : `priceGridEdges`, `gridBucketIndex`, `januaryTicks`, `linearTicks` ; `ScatterCloud` prend `priceBuckets` — G4a **prend** les bornes de G1 et empile sur **ses** buckets ; calque SVG de graduations (`data-axis`, `data-scale`, `data-tick`) sur les deux axes | `R-D7-2.8-08…13`, **6 rouges → 6 vertes** ; `R-D7-2.8-09` compare les graduations **une à une** aux bornes de `recalc.priceHistogram` | `✓ tests/review/D7/g4-bornes-g1-2.8.test.ts (6 tests)` | **CORRIGÉ** |
| 6 | **`EX-SCR-174`** — état `ET-VIDE-FILTRES` de l'écran B jamais rendu (sonde « à écrire en 2.8 » jamais écrite) | `D8-31` | fix-screens-2 (`1a3b0d2`) ; fix-app-2 (`9ac896f`) | À `selectionCount === 0` : les **quatre** blocs de graphes sortent du DOM, bloc `EX-SCR-26` (titre, phrase `<n> filtres actifs…`, 3 suggestions au format normatif, `Réinitialiser`, `Enregistrer` **actif**) ; en-tête conservé mais `aucune offre` et `—` par statistique (`statOrDash`, jamais un chiffre hérité) ; `Voir les 0 annonces` désactivé | `R-D7-2.8-14…17` rouges → vertes, `R-D7-2.8-18` non-régression ; `R-D8-2.8-02` (5 props câblées) | `✓ tests/review/D7/etat-vide-filtres-b-2.8.test.ts (5 tests)` ; E2E `EX-SCR-174 / EX-SCR-26 — sélection vide` et `Réinitialiser tous les filtres` verts ×3 | **CORRIGÉ** |
| 7 | **`EX-SCR-212`** (et `EX-SCR-213`) — carte de l'écran E sans bouton `Ouvrir` nommé, sans description de filtres ni périmètre | `D8-31` | fix-screens-2 (`55a9fd8`) ; fix-app-2 (`9ac896f`) | Trois boutons `Ouvrir` / `Renommer` / `Supprimer`, le nom redevient un texte ; périmètre résolu par la taxonomie **depuis le chemin canonique** ; description générée par `buildActiveFilterTokens` (**le même** générateur que le bandeau : deux libellés ne peuvent pas diverger) ; écart `+ 34 offres depuis le 02/09` **seulement si** le snapshot a changé (jamais `+ 0`) ; `saved.css` (`min-height: 96px`, `line-clamp: 2`) | `R-D6-2.8-05…11`, `13` rouges → vertes ; `R-D6-2.8-12` verte d'emblée (panneau latéral déjà conforme) ; `R-D8-2.8-03` (câblage `currentSnapshotId`, `taxonomy`) | `✓ tests/review/D6/ecran-e-recherches-2.8.test.ts (9 tests)` ; E2E `EX-SCR-212 / EX-SCR-213` vert ×3 | **CORRIGÉ** |
| 8 | **`EX-SRCH-14`** — changer de marque en mode 2 ne vide pas le modèle | `D8-31` | fix-state-2 (`d710bd3`) ; fix-app-2 (`9ac896f`) | `src/state/navigation.ts::resolveMakeChange` → `/marche?mmmv=<make>` en conservant **tous** les autres filtres, URL **canonique** (rechargée, elle ne déclenche aucune correction `EX-NAV-21`) ; couple complet ⇒ `goToModel` (`EX-NAV-15`) | `R-D5-2.8-03/04/05`, 12 cas rouges (module absent) → verts ; `R-D8-2.8-01` (`onSelectModel`) | `✓ tests/review/D5/make-change-mode2.test.ts (12 tests)` ; E2E `EX-SRCH-14` vert **sur les 3 projets** | **CORRIGÉ** |

**Bilan : 8 / 8 CORRIGÉS avec preuve exécutée.** Aucun ne reste OUVERT. J'ai en outre vérifié
l'existence de chaque correction dans le code à `c8c791a`, indépendamment des rapports :
`coverageOf` aux l. 36/48/168/169/293/294 de `quantiles.ts` ; `parseFirstRegistrationYearMonth`
l. 411 de `shared-rules.ts` ; `data-price-scale` dans `AdditionalGraphs.tsx` ;
`src/state/ineffective-filters.ts` ; `priceGridEdges`/`januaryTicks` dans `scatter-model.ts` ;
`EX-SCR-174`/`topRestrictiveFilters`/`activeFilterCount` dans `DistributionScreen.tsx` ; les trois
boutons et `kycar-saved-scope` dans `SavedSearchesScreen.tsx` ; `resolveMakeChange` et
`withRouteTaxonomy` dans `navigation.ts`.

### 3.2 `EX-SCR-26` — le calcul « leave-one-out » de `restrictive-filters.ts`

Point de vigilance explicite de ma mission : **aucun gain annoncé ne doit être faux.** Le module
`src/app/restrictive-filters.ts` (seul code neuf de `fix-app-2`) rejoue **exactement** la mécanique
que `DataController.enterMode2` utilise déjà pour dériver `rows` (`partitionSelection` →
`buildRefinePredicates` → `compilePredicates`), sur la sélection privée d'un filtre : aucune règle
de filtrage n'est réécrite, donc une divergence entre le gain annoncé et l'effectif obtenu en
suivant la suggestion est structurellement impossible. **Prouvé, pas seulement argumenté** :

- sonde `R-D8-2.8-05` — « le gain annoncé **est** le gain remesuré filtre par filtre », plus le tri
  décroissant, les chiffrées avant les `null`, le plafond 3, et le libellé = jeton du bandeau ;
- sonde `R-D8-2.8-04` — `countMatchingRows` comparé à une **vérité terrain** relue directement sur
  la colonne (une sentinelle négative n'est jamais « ≤ 3 000 € ») ;
- sonde `R-D8-2.8-07` — **aucune suggestion inventée** : sélection vide → `[]` ; un retrait sans
  gain n'est pas proposé (« 0 offres de plus » serait un conseil faux) ;
- test E2E `EX-SCR-174 / EX-SCR-26` — la suggestion annonce `1 352 offres de plus` et, **une fois
  suivie**, l'écran affiche exactement 1 352 offres ; le retrait emporte les **deux** bornes de
  l'intervalle et rien d'autre.

Les 8 cas de câblage tournent sur un vrai lot du provider synthétique (20 000 annonces), les
prédicats réels du moteur et le référentiel réel lu sur disque — pas des doublures.
`✓ tests/review/D8/shell-wiring-f3.test.ts (19 tests)`. **Aucun gain annoncé n'est faux.**
Une réserve subsiste, non sur l'exactitude mais sur la **portée** : l'écran A n'en bénéficie pas
(§7.1 n° 2).

### 3.3 Points nouveaux de la vague F3

| Point | Décision | Correction | Preuve rejouée | Statut |
|---|---|---|---|---|
| **`EX-SCR-216` en mode 2** — l'écran G ouvert depuis B affichait `—` par entrée | `D8-34` (voie a) | `DataController.baselineMakeCounts` : carte `makeId → listingCount` dérivée des agrégats **déjà en mémoire** après `start()`, mémoïsée sur l'**identité** de la baseline, `null` (jamais une carte vide, `DR-060`) ; repli dans `app.tsx` **borné au mode 2** | `R-D8-2.8-08` (4 cas, dont « cinq lectures ⇒ **zéro** appel provider supplémentaire », vérité terrain, somme = 20 000) et `R-D8-2.8-09` (borne `currentMode !== 'mode2'`), **5 rouges → 5 vertes** ; `✓ tests/review/D8/screen-g-counts-2.8.test.ts (5 tests)` ; E2E : `[MESURE] EX-SCR-216 — Volkswagen 9340 \| BMW 8243 \| Mercedes-Benz 7961 \| …` (avant : `Volkswagen — \| Abarth — \| AC —`) | **CORRIGÉ** — avec la réserve de sémantique §7.1 n° 5 (effectifs du snapshot, non filtrés) |
| **`EX-SCR-103`** — le contrôle `Marque / Modèle` de B affichait « Toutes les marques » et ouvrait G non positionné | `D8-35` (7.1) | `withRouteTaxonomy(selection, mode, routePair)` — dérivation **pure**, réinjecte le bloc `mmmv` de la route **pour l'affichage seulement**, retourne la même référence hors du cas visé, **jamais** utilisée pour sérialiser une URL (sinon `mmmv` réapparaîtrait en double, `EX-NAV-15`) ; `FilterBand` l'utilise pour `screenGSummary` **et** `ScreenG currentSelection` | `R-D5-2.8-07/08/09`, **11 rouges sur 11** → 11 vertes ; `✓ tests/review/D5/screen-g-mode2-position.test.ts (11 tests)` ; vérifié dans le code : `FilterBand.tsx` l. 446 `taxonomySelection`, l. 511 `currentSelection={taxonomySelection}` | **CORRIGÉ** — réserve de forme §7.2 n° 3 (un maillon prouvé par lecture de source) |
| **`EX-SCR-97`** — la feuille compacte enfermée dans le contexte d'empilement du bandeau, l'en-tête collant avalait le clic | `D8-35` (7.2) | `.kycar-filter-band--compact { z-index: 20 }` (`filter-band.css` l. 475-476), avec le commentaire d'explication | **La preuve est mon propre rejeu** : `EX-SRCH-14` au projet **`mobile`**, le seul échec inattendu de la recette de `fix-app-2`, est **vert** chez moi (`✓ 221 [mobile]`), sans qu'aucun `test.fail()` ait été posé et sans que le test ait été modifié | **CORRIGÉ** |
| **Formateur de date** — `NaN/NaN`, `00/-1`, `01/0`, et un **mois inventé** sur une année nue | signalement fix-engine-2 §6.4, relayé par le coordinateur | `formatMonthYear` exige un entier ≥ 0 d'année dans `[1900, 2100]` ; `formatFirstRegistrationMonthYear` exige `AAAA-MM` avec mois `01..12` explicite **et** date parsable ; repli sur le caractère normatif `—` (`EX-SCR-34`) | `R-D6-2.8-01/03/04` rouges → vertes, `R-D6-2.8-02` non-régression ; `✓ tests/review/D6/format-immatriculation-2.8.test.ts (4 tests)` | **CORRIGÉ** |
| **`withRouteTaxonomy`** — risque de double `mmmv` dans l'URL | `D8-35` | Dérivation **d'affichage seulement** ; la route reste porteuse du couple (`EX-NAV-15`) | Vérifié par moi dans le code : `withRouteTaxonomy` n'apparaît que dans `FilterBand.tsx` (l. 26 import, l. 446 usage) — **aucun** site de sérialisation d'URL ne l'appelle ; les 12 cas de `make-change-mode2.test.ts` incluent le contrôle « URL canonique, aucune correction `EX-NAV-21` au rechargement » | **CONFORME** |

### 3.4 État consolidé des entrées de 2.7 et de 2.9a

| Famille | Total | État en rev 2 |
|---|---:|---|
| Constats `FV-01…FV-24` (2.7) | 24 | **24 traités** (rev 1), dont `FV-06` désormais couvert par la dette écrite `D8-29` |
| Constats `E2E-01…E2E-26` (2.9a) | 26 | **26 corrigés**, 26 `test.fail()` retirés (rev 1), tous rejoués verts dans ma recette |
| Dettes 2.6 « levables en interne » (PLAN §2.8) | 9 | **9 levées** — les 8 de la rev 1, plus le résidu `DR-122` (`EX-DATA-61`/`64`) levé par `D8-30` |
| Exigences `PARTIELLE` ouvertes au §7.1 de la rev 1 | 8 | **8 corrigées** (§3.1) |
| Exigences « mesures au rendu » renvoyées à 2.9b (§3.2(b) de 2.7) | 15 | **DIFFÉRÉES 2.9b**, motivé par le plan ; la suite E2E les exerce |
| Écarts **nouveaux**, sans décision | — | **2** (§7.1 n° 1 et 2) |

---

## 4. Sondes et tests modifiés depuis la rev 1

`git diff --stat d94d0a2..HEAD -- tests/` : **18 fichiers**, **+2 242 / −5** lignes. **Un seul
fichier porte des suppressions** — `tests/e2e/persistance.spec.ts` (+47 / −5). Tous les autres sont
des **créations** (13 fichiers de sondes neufs) ou des **ajouts purs**.

### 4.1 Fichiers créés (aucune assertion préexistante touchée)

`D2/first-registration-parsing` (12) · `D4/metric-stats-iqr-coverage` (14) ·
`D5/graph-log-param` · `D5/ineffective-filters` (14) · `D5/make-change-mode2` (12) ·
`D5/screen-g-mode2-position` (11) · `D6/ecran-e-recherches-2.8` (9) ·
`D6/format-immatriculation-2.8` (4) · `D7/echelle-log-prix-2.8` (6) ·
`D7/etat-vide-filtres-b-2.8` (5) · `D7/g4-bornes-g1-2.8` (6) · `D8/screen-g-counts-2.8` (5) ·
`D8/shell-wiring-f3` (19). **Les 13 sont vertes dans les 1 079** — je les ai relevées une par une
dans la sortie de `npm test`.

### 4.2 Fichiers existants modifiés — justification vérifiée au `git diff`

| Fichier | Changement | Justification (D-31) | Verdict |
|---|---|---|---|
| `tests/review/D4/quantiles-bin.test.ts` | **+13, −0** : un commentaire de 5 lignes, **et un cas voisin** `exactMetricStats([], 25)` exigeant `coverage: 0` | `D8-30`. La rev 1 avait désigné ce `toEqual` comme **figeant le défaut**. Vérification faite : à `n = 0` **et `N` inconnu**, `iqr: null, coverage: null` reste la réponse **juste** (`EX-DATA-64` : `iqr` défini si `n ≥ 1`, `coverage` si `N ≥ 1`) — la sonde repasse verte **sans modification**. Elle n'était pas fausse, elle était **aveugle**. Le `toEqual` d'origine est conservé **au caractère près** et complété par le cas qu'il ne pouvait pas voir | **JUSTIFIÉE — sonde RENFORCÉE, pas relâchée.** J'ai relu le diff : aucune assertion supprimée ni affaiblie. La réserve que je portais en rev 1 §4.1 est **levée** |
| `tests/review/D7/ecran-b.test.ts` | **+52, −0** : un import de type, un import de `clearMetricFilters`, la fabrique `screenVNode` et le cas `R-D7-2.8-01` (40 → 41 cas) | `D8-27`. `screenVNode` est une **nouvelle** fabrique à côté de `renderScreen` : `deepRender` *appelle* les composants enfants et les remplace par leur sortie, si bien qu'une prop de rappel n'existe plus dans l'arbre rendu — impossible d'y prouver un câblage. `toStrictEqual` (et non `toEqual`) parce que seul lui distingue une clé **présente à `undefined`** (un retrait) d'une clé absente : c'est l'enjeu même de `clearMetricFilters` | **JUSTIFIÉE** — les 40 cas d'origine sont identiques (vérifié au diff) |
| `tests/e2e/persistance.spec.ts` | **+47, −5** : **quatre** désignations passent de `getByRole('button', { name: '<nom>' })` à l'aide `savedRow(page, '<nom>')`, `EX-CRUD-6` ouvre par le bouton `Ouvrir` de la carte ; **un test neuf** `EX-SCR-212 / EX-SCR-213` | **`EX-SCR-212` a déplacé le contrôle, pas le fait mesuré** : l'exigence impose trois boutons nommés et fait du nom un **texte** — les tests désignaient un rôle qui n'existe plus. Les assertions (l'entrée est visible ; l'ouverture restitue l'URL et met à jour `dernier_accès_le` **sans toucher aux valeurs figées d'`ARB-45`**) sont **inchangées** — vérifié ligne à ligne au diff. Justification écrite **deux fois** : en commentaire de 7 lignes au-dessus de `savedRow` dans le fichier, et dans `fix-app-2` §4. Adaptation demandée par `fix-screens-2` §8.3 et **étendue** aux trois autres points d'appel qu'elle n'avait pas relevés | **JUSTIFIÉE** |

### 4.3 Outillage de sonde retouché entre le rouge et le vert — trois cas, tous déclarés

Ma mission demande de les examiner nommément. Aucun n'est un amendement au sens de `D-31` (la sonde
n'avait encore rien attesté), et **les trois sont écrits dans les rapports** :

1. **`fix-state-2` §9bis.1** — la traversée `findAll` s'arrêtait au VNode du composant
   `FilterFieldRow` (Preact ne met pas le rendu d'un composant dans `props.children`), et l'expansion
   des composants fonction lève sur les contrôles à hooks de la même ligne. Ajout d'un `expand()`
   qui déplie et **laisse replié** celui qui lève. **La sonde est restée rouge après cette
   retouche** (`expected undefined to be defined`) et n'est passée au vert que sous l'effet de la
   correction de production — c'est la garantie qui compte, et elle est donnée.
2. **`fix-state-2` §3** — un sélecteur filtrait les `<li>` par `n.props.key`, or Preact **sort**
   `key` du sac de props. Filtre remplacé par la classe ; assertion inchangée.
3. **`fix-app-2` §3.1** — `mountOf` découpait le montage jusqu'à une indentation figée et débordait
   sur `AppFooter` ; borne corrigée. Et `removalPatchFor` asserté en `toEqual` (qui ignore les clés
   à `undefined`, donc aurait passé sur `{}`) → **`toStrictEqual`**, strictement plus exigeant. Les
   traces rouges publiées ont été **rejouées avec le fichier final**, pas avec la version d'origine.

**Avis** : les trois sont des corrections d'**outillage de lecture**, aucune ne touche une
assertion, deux d'entre elles **durcissent** la sonde. Déclarées avec le niveau de détail qu'il
faut. **Rien à redire.**

### 4.4 Discipline « sonde d'échec d'abord » (D-32)

| Lot | Preuve rouge | Corroboration |
|---|---|---|
| fix-state-2 | commit **`a9a7bf2`** « add failing D5 probes » ; puis `e3e47e1` « add failing D5 probe for EX-SCR-103 » | Commits **distincts et antérieurs** aux corrections `d710bd3` / `55db246` ✔ |
| fix-app-2 | commit **`0f73c6e`** « failing D8 probes » ; **`b71185a`** « failing D8 probe for the screen G counts » | Antérieurs à `9ac896f` / `25d9d1d` ✔ |
| fix-engine-2 | 11/14 puis 12/12 rouges, sorties citées ; contre-épreuve par `git stash` | Même commit que la correction — **hypothèse acceptée sur la déclaration écrite** (E4), corroborée par le fait que `parseFirstRegistrationYearMonth` n'existait dans aucun module (je l'ai vérifié : `grep -rln FIRST_REG_UNPARSEABLE` avant F3 ne rendait que la déclaration du vocabulaire) |
| fix-screens-2 | `D8-27` : version d'avant recopiée, sonde rouge, puis restaurée | **Rejoué par moi**, §5.4 ✔ |
| fix-app-2, E2E | build de prod reconstruit sur `src/app.tsx` d'avant câblage : **4 failed / 3 passed**, puis 7 verts | Procédé cité, les 2 verts d'emblée **dits comme tels** (constats de conformité, non preuves de câblage) ✔ |

---

## 5. Bijection dettes ↔ marqueurs d'échec

### 5.1 `it.fails` restants dans `tests/review/` — exactement 2

```
$ grep -rn 'it\.fails(' tests/review/ src/
tests/review/D9/capabilities-mode1.test.ts:89:  it.fails('R-D9-21 — le provider n’est câblé nulle part …
tests/review/D2/reference-loader.test.ts:184:  it.fails('R-D2-16 — EX-DATA-54 : les exceptions communales priment sur les plages', …
```

| Sonde | Dette | Nature | Décision |
|---|---|---|---|
| `R-D9-21` | **DR-104** — provider réel non câblé | **Externe** : `AC-01` non levée (juridique) | `D-18`/`D-28`, maintenue par `D8-18` |
| `R-D2-16` | **DR-112** — `postal-regions-be.json` absent | **Externe** : source Statbel/bpost, `E5` interdit de la collecter | §6.5 de 2.6, maintenue par `D8-18` |

Conforme à l'attendu. Les deux échouent réellement (sinon `it.fails` rendrait la suite rouge, et
`npm test` est vert) : les deux dettes sont **vivantes et mesurées**. Aucune sonde `it.fails` n'a été
ajoutée ni retirée en F3 (`fix-engine-2` §7 et `fix-app-2` §4 le déclarent, le `git diff` le
confirme).

### 5.2 `test.fail()` restants dans `tests/e2e/` — exactement 1 appel, 3 échecs attendus

```
$ grep -rn 'test\.fail(' tests/e2e/*.spec.ts
tests/e2e/responsive.spec.ts:211:    test.fail();
```

Un seul appel, dans `DETTE D8-15 — les réglages « Assainissement KYCAR » ne sont offerts nulle part
(EX-SCR-95)`, non conditionné par le régime : il s'exécute donc **dans les trois projets**. Ma
recette le confirme exactement — `✘ 84 [desktop]`, `✘ 169 [tablet]`, `✘ 254 [mobile]`, et **rien
d'autre**. Conforme à l'attendu (3 = 1 test × 3 projets).

**Bijection tenue** : 2 marqueurs Vitest ↔ 2 dettes externes ; 1 marqueur E2E ↔ 1 dette produit
ratifiée. Aucun marqueur sans dette nommée ; aucune dette nommée sans son marqueur **quand une sonde
peut exister** (O15, `EX-SRCH-12`, `EX-SCR-9`, `D8-29` et `D8-32(2)` n'ont rien à faire échouer —
une donnée absente, une sémantique non tranchable localement, un champ hors périmètre R3, un calcul
sans jeu chargé, une colonne absente d'une interface gelée).

### 5.3 Absence de `skip` (D-49)

`grep -rn 'it\.skip\|test\.skip\|describe\.skip\|it\.todo\|test\.todo\|\.only(' tests/review/ src/`
→ **aucune occurrence**. `tests/e2e/` compte **7 `test.skip` conditionnels** (1 dans
`parcours-p1`, 4 dans `parcours-p2`, 2 dans `responsive`), **identiques à la rev 1** : inadéquations
de plate-forme motivées en clair. **Aucun `skip` introduit en F3.**

### 5.4 Contre-épreuve `D8-27` — rejouée par moi sur les deux commits

Ma mission l'exige explicitement. `git show 3435456:src/screens/distribution/DistributionScreen.tsx`
ne contient **aucune** occurrence de `onClearFilter` (HEAD en contient 4).

```
### 1. HEAD (câblé)
✓ tests/review/D7/ecran-b.test.ts (41 tests | 40 skipped)
  Tests  1 passed | 40 skipped (41)

### 2. version 3435456 recopiée (avant câblage)
  564|       expect(typeof hist?.props['onClearFilter'], `${graphId} sans onClearFilter`)…
  Test Files  1 failed (1)      Tests  1 failed | 40 skipped (41)

### 3. git checkout -- src/screens/distribution/DistributionScreen.tsx
$ git status --short   → (vide)      $ grep -c onClearFilter …  → 4
```

`R-D7-2.8-01` est donc **rouge sur `3435456` et verte sur `c8c791a`**, exactement comme
`fix-screens-2` §2 le déclare. Le grief de la rev 1 §7.4 est **soldé** : le câblage
`onClearFilter` posé par le coordinateur au commit `90a9eea` est désormais prouvé par exécution,
et la preuve est celle que la rev 1 avait rédigée.

---

## 6. Dettes restantes

### 6.1 Dettes externes — `D8-18`

| Dette | Exigences | Raison (hors dépôt) | Condition de levée | Marqueur |
|---|---|---|---|---|
| **DR-104 / AC-01** | `EX-DATA-107`, mise en service du provider réel | Hypothèse d'accès à la source non levée ; décision juridique | Statuer sur `AC-01`, puis câbler (`main.tsx`, point d'injection prêt, `D-29`) | `R-D9-21` |
| **DR-112 / Statbel-bpost** | `EX-DATA-53`, `54`, `126` | Source officielle externe, `E5` interdit de la collecter | Fournir `data/reference/postal-regions-be.json` hors session | `R-D2-16` |
| **O15 / `bodyTypes`** | `EX-DATA-115bis`, `EX-SCR-221` | Donnée absente de tout référentiel disponible | Fournir la donnée ; mitigation `D8-20` livrée (le filtre est déclaré non appliqué et **dit**) | `R-D2-17`, `R-D3-20`, `R-D9-31` (vertes, mesurent l'état honnête) |
| **`EX-SRCH-12`** | `EX-SRCH-12` | Sémantique `eq` de la source, non tranchable localement (`E5`) — point ouvert `O7` | Observation sur la source réelle | — |
| **`EX-SCR-9`** | `EX-SCR-9` | `NNxx` non affichable : périmètre R3 (`D-14`) | Amender `EX-SCR-9` ou le périmètre R3 | — |

### 6.2 Dette architecturale ratifiée en F3 — `D8-29` (`FV-06` mode 1)

`EX-SCR-65`, `EX-SCR-89`, `EX-SCR-90` : en **mode 1**, aucun jeu de lignes n'est chargé (`O17`),
donc le calcul de facette leave-one-out qu'exige `EX-SCR-90` n'a **rien** sur quoi porter.
Texte vérifié par moi dans `docs/requirements/draft-screens.md` — l. 1102-1115 (le paragraphe de
dette sous `EX-SCR-90`) et l. 718 (le renvoi sous `EX-SCR-65`), tous deux marqués
`[amendée 2.8 — D8-29]`. Conditions de levée écrites : une décision produit, ou un
`DataProvider.facets()` en v2 de l'interface.

**Contrôle indépendant : aucune valeur n'est inventée.** `src/components/filters/controls/
CheckboxList.tsx` l. 17-20 — `facetCountLabel` rend `null` quand la facette est `undefined`, et
l'appelant ne rend alors **aucune** parenthèse ; le `(0)` gris (l. 66, `opacity: 0.55`) n'est atteint
que lorsqu'un `0` **mesuré** est fourni. Vérifié dans le code, pas seulement lu dans le rapport.

### 6.3 Dette produit ratifiée — `D8-15` (`EX-SCR-95`)

Réglages « Assainissement KYCAR ». **Décision explicite et datée du fix-lead**
(`FIX-LEAD-DECISIONS-2.8.md` §A `D8-15`, « panneau de préférences sans effet sur une valeur
affichée, hors budget »), documentée par fix-docs dans `draft-screens.md` l. 1124, et rendue
**visible à chaque exécution** de la recette par un `test.fail()` annoté de 6 lignes citant la
décision, le motif et la condition de retour au vert. Admise à G7 **parce que la décision existe et
qu'elle est écrite**, non parce que la cause serait hors dépôt.

### 6.4 Dette d'interface gelée ratifiée en F3 — `D8-32(2)` (`co2Source` synthétique)

`EX-DATA-35` : `ListingColumnBatch` n'a **aucune** colonne `co2Source` (interface gelée
`DataProvider` v1) ; le provider synthétique déclare donc `unknownCountByField.co2Source =
listingCount` avec une `coverageNote` qui en donne la raison, plutôt que de laisser le champ muet.
Le provider **réel** tient `EX-DATA-35` en entier. Texte vérifié : `draft-data-dictionary.md`
l. 488-497, `[amendée 2.8 — D8-32]`, avec le coût chiffré d'une levée (21ᵉ colonne d'un octet).

### 6.5 **Acceptation au titre de S4 — mon avis, demandé par la mission**

| Dette | Admise à S4 ? | Pourquoi |
|---|---|---|
| DR-104, DR-112, O15, `EX-SRCH-12`, `EX-SCR-9` | **OUI** | Source ou décision hors dépôt, nommées, condition de levée écrite, marqueur vivant quand une sonde peut exister |
| **`D8-15` / `EX-SCR-95`** | **OUI** | `D8-18` l'admet nommément aux côtés des externes ; c'est une décision de produit écrite, datée, tracée dans l'annexe et **rendue visible par un échec attendu**. Une dette qui se signale à chaque exécution ne peut pas être oubliée |
| **`D8-29` / `FV-06` mode 1** | **OUI** | La cause n'est pas un manque de travail : c'est une **contradiction entre deux exigences du dépôt** (`EX-SCR-89/90` × `O17`) qui ne se tranche qu'avec le commanditaire, et `E3` interdit de poser la question. La construction est **exactement celle d'`EX-SCR-9`**, que 2.6 et 2.7 admettent déjà. Elle est écrite, motivée, avec deux conditions de levée alternatives, et j'ai **vérifié moi-même** qu'aucune valeur n'est inventée en son absence (§6.2). Je l'accepte sans réserve |
| **`D8-32(2)` / `co2Source`** | **OUI** | Même construction : la levée exige un amendement de l'**interface gelée** (v2), c'est-à-dire une décision d'architecture, pas une correction. Écrite, chiffrée, et l'écart est **dit à l'utilisateur** par le descripteur de snapshot plutôt que masqué. Le provider réel, lui, tient l'exigence entière |

**En revanche, ne sont admises ni l'une ni l'autre** : les deux dettes du §7.1, qui ne sont pas
écrites du tout.

---

## 7. Écarts, réserves et recommandations

### 7.1 Écarts OUVERTS — deux, nouveaux, sans décision

Tous deux ont été **remontés par les correcteurs eux-mêmes**, honnêtement, sous le titre « à
remonter au coordinateur » ; **aucune décision `D8-xx` ne leur répond**.

**1. `EX-DATA-68` (et `EX-DATA-61` sur les agrégats) — le bloc de 13 valeurs n'existe pas par
marque ni par modèle.** Remonté par `fix-engine-2` §6 point 1.

`EX-DATA-68` exige, pour chaque agrégat de marque et de modèle : « `price`, `year`, `mileage` : bloc
statistique complet (`EX-DATA-64`) — **3 × 13 valeurs** ». Or l'interface gelée publie un
`MetricRange` de **6 champs** (`min`, `max`, `p05`, `p50`, `p95`, `n`) — vérifié par moi dans
`src/providers/DataProvider.ts`. Il manque `mean`, `stdDev`, `p25`, `p75`, `iqr`, `coverage`, et
**ces six ne sont pas dérivables au rendu** depuis les six publiés, contrairement à `rank`,
`displayRange` et `makeName` que `D8-23` a explicitement ratifiés comme dérivés. `EX-DATA-61`
(« toute statistique publiée est accompagnée de son effectif **et de sa couverture** ») est donc
tenue sur la **sélection** depuis `D8-30`, mais **pas** sur les agrégats marque/modèle.

- **Ce n'est pas une régression** : l'état date de D2 et a traversé 2.5, 2.6 et 2.7 sans être relevé
  — la matrice 2.7 classait `EX-DATA-68` `PARTIELLE` en citant `modelCount`, `displayRange`, `rank`,
  `coverageWarning`, `adTierDistribution`, **tous livrés depuis**, mais pas cette clause-ci.
- **Aucune valeur affichée n'est fausse** : les champs n'existent pas, ils ne mentent pas.
- **La cause est exactement celle de `D8-32(2)`** : un amendement de l'interface gelée (v2).
- **Mon avis : dette à écrire par le fix-lead**, d'une ligne, dans la même famille que `D8-32(2)`,
  plus une annotation `[amendée 2.8 — D8-xx]` sous `EX-DATA-68`. **Aucun code n'est à changer.**
  En l'état, c'est une exigence `PARTIELLE` dont la dette résiduelle (`DR-122`) est **interne** et
  n'a jamais été re-ratifiée — ce que S4 n'admet pas.

**2. `EX-SCR-26` sur l'écran A — les suggestions de retrait ne sont jamais calculées.** Remonté par
`fix-app-2` §9 (« dette **inchangée** de `data-controller.ts`, hors `D8-31`, même cause qu'`D8-29` »).

`src/orchestration/data-controller.ts` l. 582 publie toujours `topRestrictiveFilters: []`. Sur
l'écran A, l'état `ET-VIDE-FILTRES` se rend donc **sans** les suggestions « retirer « … » : `<k>`
offres de plus » qu'`EX-SCR-26` exige — alors que l'écran B les a désormais (§3.2).

- La matrice 2.7 classe `EX-SCR-26` **`COUVERTE`**, sur la foi de sondes D6 qui éprouvent la
  **fonction de modèle**, pas la donnée que la coquille lui passe. L'écart est donc **invisible dans
  la matrice** et ne sera pas rattrapé par 2.9b s'il n'est pas écrit maintenant.
- **La cause est celle de `D8-29`** : le même calcul sur l'écran A exigerait un balayage des
  100 000 annonces, ce qu'`O17` interdit — mot pour mot l'argument de la dette de facettes.
- **Mon avis : dette à écrire par le fix-lead**, en élargissant `D8-29` à `EX-SCR-26` (écran A) —
  ou, si le commanditaire la juge nécessaire, à corriger, mais alors **avant G7**. Le fait qu'une
  exigence classée `COUVERTE` ne le soit pas en production est le genre d'écart que la porte existe
  précisément pour attraper.

### 7.2 Réserves — signalées, non bloquantes, avec mon avis

| # | Réserve | Source | Mon avis |
|---|---|---|---|
| 1 | **`GroupStatEntry.coverage` n'est pas arrondie à 4 décimales** (`group-stats.ts` l. 285, `n / listingCount` brut) là où `MetricStats.coverage` l'est désormais, comme `DistributionBucket.share` et `evalCoverage` | fix-engine-2 §6 pt 2 | **Sans effet aujourd'hui** (dénominateurs différents : le groupe / la sélection), donc aucune incohérence d'affichage. Mais **trois taux publiés côte à côte ne devraient pas être arrondis de deux manières.** Une ligne et une sonde. `fix-engine-2` a eu raison de ne pas la changer sans sonde qui l'exige — c'est exactement le grief `D8-27`. **À traiter en 2.8bis ou à consigner** |
| 2 | **`EX-DATA-23` n'a aucun appelant vivant** : la règle est posée, exportée et prouvée par 12 sondes, mais aucun chemin d'ingestion ne l'appelle — `tweedehands/normalize.ts` l. 353 pose `firstRegistrationYear = null` **inconditionnellement** (l'imputer depuis `modelYear` est interdit, `EX-DATA-25/27`, `DR-017`), et le générateur synthétique construit la colonne arithmétiquement | fix-engine-2 §6 pt 3 | **Correct, et honnête.** L'exigence porte sur la **façon de lire** une chaîne que les sources actuelles n'émettent pas : la règle est implémentée et gardée par une sonde, prête pour la première source qui servira le champ. **Statut à écrire dans la matrice** (« règle prouvée, branchement sans objet tant qu'aucune source ne sert le champ ») pour que 2.9b ne la relève pas comme un manque. **Sans effet, à documenter** |
| 3 | **La sonde `EX-SCR-103` prouve son dernier maillon par lecture de source** (`vitest.review.config.ts` fixe `environment: 'node'` et le dépôt n'embarque aucune dépendance DOM) : dérivation pure + rendu des composants sans hook **exécutés**, câblage dans `FilterBand.tsx` **lu** | fix-state-2 §9bis.1 | **Acceptable** : c'est la convention déjà établie par `tests/review/D8/shell-static.test.ts`, écrite pour la même raison, et la contrainte est d'environnement, pas de complaisance. **La preuve de bout en bout existe par ailleurs** : `EX-SRCH-14` en navigateur ouvre ce contrôle et est vert sur les trois projets. **Réserve de forme** |
| 4 | **`EX-SCR-159` livrée en version bornée** (légende continue atténuée au lieu des pastilles et valeurs littérales de `draft-screens.md` §6.4 à `n ≤ 3`) | rev 1 §7.2 n° 3 | **CLOS** — `D8-32(3)` la ratifie et fix-docs-2 l'annote (`draft-screens.md` l. 1816-1824, `[amendée 2.8 — D8-32]`, vérifié par `grep`) |
| 5 | **`EX-SCR-216` en mode 2 : les effectifs sont ceux du snapshot entier**, non filtrés, alors que l'exigence dit « dans le périmètre filtré courant » | fix-app-2 §10.2 | **Accepté, et bien déclaré (E4)** : en mode 2, un effectif filtré pour une **autre** marque que celle de la route n'est pas calculable sans aller provider, ce que `D8-34` exclut et `O17` interdit. Le repli est une **valeur mesurée**, strictement préférable au `—` qu'il remplace, déclarée en commentaire aux deux endroits, et **bornée au mode 2 par une sonde** (`R-D8-2.8-09`) pour qu'un élargissement futur ne passe pas inaperçu. **Même famille que `D8-29`** : gagnerait à être rattachée à sa dette d'une ligne |
| 6 | **Deux libellés fixés par hypothèse** (`aucun filtre actif` sur une recherche sans filtre ; hauteur **minimale** de 96 px au lieu d'une hauteur fixe) | fix-screens-2 §13 | **Sans effet.** Hypothèses écrites dans le code comme `E4` l'exige ; l'exigence ne fixe ni l'un ni l'autre |
| 7 | **`EX-SRCH-14` ne couvre pas « autre marque **et** modèle »**, classé `goToModel` (`EX-NAV-15`) | fix-state-2 §8 pt 2 | **Lecture correcte** de l'exigence (« hors clic sur zone-modèle » : ce n'est pas un changement de marque). **Sans objet** |

### 7.3 Les cinq arbitrages du §7.2 de la rev 1 — clos, textes vérifiés

| Arbitrage rev 1 | Décision | Texte vérifié par `grep` | État |
|---|---|---|---|
| Dénominateur de `coverageWarning` = effectif de l'échantillon | `D8-32(1)` | `draft-data-dictionary.md` l. 250-263, `[amendée 2.8 — D8-32]` | **CLOS** |
| `co2Source` synthétique `UNKNOWN` déclaré | `D8-32(2)` | `draft-data-dictionary.md` l. 488-497 | **CLOS** (dette, §6.4) |
| `EX-SCR-159` version bornée | `D8-32(3)` | `draft-screens.md` l. 1816-1824 | **CLOS** |
| `EX-DATA-64` : `count` porté par le conteneur | `D8-32(4)` | `draft-data-dictionary.md` l. 943-957 — et le bloc publie **13/13** depuis `D8-30` | **CLOS** |
| `zipr` `RETENU` / « 77 retenus » | `D8-32(5)` | `REF-filters.md` l. 1088 (statut `zipr`) et `ARBITRAGES-req-lead.md` l. 392 (décompte 74) | **CLOS** |

Journal des versions : `REQUIREMENTS.md` l. 332, « Journal des amendements 2.8, vague F3
(v1.2 → v1.3) ». Contrôle de non-régression de fix-docs-2 rejoué par moi : aucune exigence créée,
supprimée ou renumérotée.

### 7.4 Les deux corrections hors périmètre — ratification enregistrée (`D8-28`)

`D8-28` **ratifie** les deux corrections de `fix-app` (régime intermédiaire de `filter-band.css`,
`EX-NAV-11` sur l'application différée de `FilterBand.tsx`), conformément à l'avis que je portais en
rev 1 §7.3, et retient la leçon de séquencement que je recommandais (« un correcteur reste ouvert sur
chaque répertoire de `src/components/` jusqu'à la fin de la vague »). **Elle a été appliquée en F3**
et elle a servi : `fix-state-2`, resté vivant, a traité `D8-35` — sans quoi `EX-SCR-103` et
`EX-SCR-97` seraient restés ouverts ou auraient été corrigés hors périmètre une seconde fois.
Les deux corrections sont de nouveau vertes dans ma recette (`E2E-19` sur les trois projets,
`EX-NAV-11` au projet mobile). **Point clos.**

### 7.5 Recommandations pour 2.9b (`acceptance`, Fable/max)

1. **Écrire les deux dettes du §7.1 avant d'ouvrir 2.9b**, ou les corriger. Ce sont deux lignes de
   décision ; leur absence est la seule chose qui sépare cette phase de sa porte.
2. **Statuer les 15 exigences « mesures au rendu »** de `FINAL-VERIFICATION` §3.2(b) : la suite E2E
   les exerce désormais toutes, aucune n'a plus de raison de rester `PARTIELLE`.
3. **Re-juger `EX-SCR-26`** dans la matrice : 2.7 l'a classée `COUVERTE` sur des sondes de modèle,
   l'écran B la tient maintenant réellement, l'écran A non (§7.1 n° 2).
4. **Prononcer le verdict axe-core sur la surface D** — possible depuis la correction de `E2E-01`.
5. **Republier la série complète d'`EX-NFR-9`** (§2.2), pas la seule médiane : la marge est de
   ~490 ms et la dispersion est le vrai indicateur.
6. **Ne pas commiter `reports/e2e/results.json` depuis une exécution intermédiaire** : `D8-33` en
   fait un artefact de référence, commité **uniquement** avec le rapport qui l'a produit.
7. **Vérifier le port 4180 avant toute recette** : `playwright.config.ts` porte désormais
   `reuseExistingServer: false` (commit `c8c791a`), ce qui fait échouer bruyamment au lieu de
   recetter un build étranger — le piège coûteux qu'a rencontré `fix-state-2` (§9bis.2). À verser à
   `docs/HANDOFF.md` §7.

---

## 8. Verdict des critères S1–S4 et de la porte G7

| Critère | Énoncé (PLAN-2 §2.8) | Verdict | Preuve |
|---|---|---|---|
| **S1** | zéro exigence `NON COUVERTE` et zéro `PARTIELLE` sans dette motivée par une décision | **NON ATTEINT** | Les 28 `NON COUVERTE` de 2.7 sont toutes soldées ; les **huit** `PARTIELLE` que la rev 1 laissait ouvertes sont **corrigées avec preuve** (§3.1) ; `FV-06` mode 1 a désormais sa décision écrite (`D8-29`). Mais **deux exigences restent `PARTIELLE` sans aucune décision** : `EX-DATA-68` / `EX-DATA-61` sur les agrégats (bloc de 13 valeurs inexistant et non dérivable — `DataProvider.ts`, `MetricRange` à 6 champs) et `EX-SCR-26` sur l'écran A (`data-controller.ts` l. 582 : `topRestrictiveFilters: []`). Les deux ont été remontées par les correcteurs sous « à remonter au coordinateur » ; aucune ligne `D8-xx` n'y répond |
| **S2** | chaque correction prouvée par exécution (sonde ou test E2E) | **ATTEINT** | 8/8 des écarts de la rev 1, les 4 points nouveaux de F3, `D8-34` et les deux volets de `D8-35` portent chacun une preuve rouge → verte que **j'ai rejouée** (§3, §5.4). La seule exception de la rev 1 — le câblage `onClearFilter` — est close : `R-D7-2.8-01` rouge sur `3435456`, verte sur `c8c791a`, **contre-épreuve faite par moi**. Le seul échec inattendu de `fix-app-2` (`EX-SRCH-14` mobile) est vert dans ma recette |
| **S3** | aucune régression : `npm test`, `npm run test:e2e`, budgets | **ATTEINT** | `build` 0/0 · `lint` vert · `npm test` **675 + 1 079, 0 échec, 0 saut, 0 todo** · `test:perf` **7/7** · `size` **116,34 / 300 Kio** · `test:e2e` **255 tests, 243 verts, 3 échecs attendus, 9 sautés, 0 échec inattendu, exit 0**. Tous les budgets tenus (§2.2), `EX-NFR-9` sous 2 000 ms sur les trois projets et les deux scénarios |
| **S4** | les dettes restantes sont exclusivement externes (décision ou source hors dépôt), nommées | **NON ATTEINT** | Les **huit** dettes écrites sont toutes admissibles et je les accepte une par une, motifs à l'appui (§6.5) : cinq externes (`D8-18`), une dette produit décidée (`D8-15`), une dette architecturale `O17` × `EX-SCR-89/90` (`D8-29`), une dette d'interface gelée (`D8-32(2)`). Mais les **deux écarts du §7.1 ne sont pas des dettes** : ils ne sont écrits nulle part. Le résidu de `DR-122` sur `EX-DATA-68` est en outre une dette **interne** jamais re-ratifiée |

### **PORTE G7 : NON FRANCHIE.**

**Ce qui a changé depuis la rev 1, et qu'il faut dire.** La vague F3 a fait exactement ce qui lui
était demandé, et bien. Les huit exigences que je laissais ouvertes sont corrigées — pas
contournées : chacune par une sonde écrite **rouge d'abord**, dont deux lots l'ont prouvé par un
commit de sondes séparé et antérieur (`a9a7bf2`, `0f73c6e`, `b71185a`, `e3e47e1`). La correction
sans preuve est prouvée, et je l'ai rejouée moi-même sur les deux commits. Les cinq arbitrages en
attente sont tranchés et **écrits dans les annexes**, textes vérifiés au `grep`. Le renvoi non
ratifié est devenu une dette motivée que **j'accepte**. Deux défauts que personne n'avait vus
(`EX-SCR-216` en mode 2, `EX-SCR-103`) ont été trouvés, rouverts par le fix-lead et corrigés. Le
seul échec inattendu de la recette précédente est vert. Aucune sonde n'a été affaiblie : les deux
seules modifications d'assertion en F3 **durcissent** les sondes, et l'unique adaptation E2E
(`persistance.spec.ts`) suit un contrôle que l'exigence a déplacé, sans toucher une assertion.
Sur la substance, **cette phase a fait son travail.**

**Pourquoi la porte ne s'ouvre pas malgré cela.** G7 ne mesure pas l'effort ni la qualité du
travail : elle mesure l'**absence d'écart non décidé**. C'est le critère que j'ai appliqué en rev 1,
et je ne peux pas l'assouplir maintenant que les écarts restants sont plus petits — la sévérité
d'une porte ne se négocie pas à la taille de ce qui reste. Or deux exigences traversent la phase
sans correction **et** sans décision :

- **`EX-DATA-68` / `EX-DATA-61` sur les agrégats** — `PARTIELLE` dans la matrice 2.7, dont la part
  encore manquante (le bloc de 13 valeurs, non dérivable) n'est couverte que par `DR-122`, une
  dette **interne** que rien n'a re-ratifiée. S4 exige des dettes exclusivement externes ;
- **`EX-SCR-26` sur l'écran A** — pire au regard de la porte, parce que la matrice 2.7 la classe
  `COUVERTE` : l'écart est invisible et disparaîtrait silencieusement si 2.9b se fiait à la matrice.

Aucun des deux ne fausse une valeur affichée, aucun n'est une régression de F3, et **aucun ne
demande de code** : le premier est une dette d'interface gelée de la même famille que `D8-32(2)`,
que le fix-lead a déjà ratifiée une fois ; le second est une dette `O17` de la même famille que
`D8-29`, qu'il a également déjà ratifiée. **Deux lignes de décision et deux annotations d'annexe
ferment la porte** — c'est la distance exacte qui reste, et elle est d'une autre nature que les huit
corrections de la rev 1.

**Ce qu'il faut, précisément, pour franchir G7 :**

1. Écrire la dette `EX-DATA-68` / `EX-DATA-61` (agrégats marque/modèle : 6 valeurs sur 13, non
   dérivables ; levée = v2 de `DataProvider`) — une ligne `D8-xx` + `[amendée 2.8 — D8-xx]` sous
   `EX-DATA-68` ;
2. écrire la dette `EX-SCR-26` écran A, en élargissant `D8-29` (même cause `O17`) — **ou** la
   corriger, si le commanditaire juge la suggestion nécessaire sur l'écran A ;
3. re-statuer `EX-SCR-26` dans la matrice de couverture (elle y est `COUVERTE` à tort).

Rien d'autre. Une fois ces trois points faits, **et sous réserve que 2.9b confirme les mesures
navigateur**, la porte G7 sera franchissable avec, pour seules dettes, les cinq dettes **externes**
de `D8-18`, la dette **produit** `D8-15`, la dette **architecturale** `D8-29` et la dette
**d'interface gelée** `D8-32(2)` — quatre catégories que S4 admet, et que j'accepte une par une.

---

## 9. Effet de ma vérification sur l'arbre

`reports/e2e/results.json` est **suivi par git** et **régénéré** par `npm run test:e2e`. **Il a
changé** : `md5` avant `257b420d8545cc22fafbbc5073475666` (celui de la recette de `fix-app-2`,
commit `834260f`), après **`21d90e4bccdd539fbfa67110d0046924`** ; `git status --short` affiche
`M reports/e2e/results.json`. C'est **normal et attendu** — ma recette est plus complète que celle
de `fix-app-2` (255 tests contre 255, mais **0 échec inattendu** contre 1, `EX-SRCH-14` mobile étant
passé au vert avec `D8-35`). Conformément à `D8-33`, il est l'artefact de preuve **de ce rapport** :
je ne l'ai ni restauré ni commité, la décision revient au coordinateur — **mon avis : le commiter
avec ce rapport**, puisque c'est la première recette qui reflète l'état `c8c791a` complet.

Le second fichier non suivi est ce rapport lui-même. `src/screens/distribution/DistributionScreen.tsx`
a été restauré après la contre-épreuve `D8-27` (§5.4, contrôle de propreté cité). Aucun autre
fichier de `src/`, `tests/`, `docs/` ni aucun autre rapport n'a été modifié ; `dist/` (non suivi) a
été régénéré par `npm run build`.

---

## 10. Résumé (12 lignes)

1. **Porte G7 : NON FRANCHIE.** S1 **non atteint**, S2 **ATTEINT** (c'était la réserve de la rev 1),
   S3 **atteint**, S4 **non atteint**.
2. Portes rejouées à `c8c791a`, toutes vertes : `build` 0/0 · `lint` vert · `size`
   **116,34 / 300 Kio** · `npm test` **675 + 1 079** (58 + 100 fichiers, 0 échec, 0 saut, 0 todo) ·
   `test:perf` **7/7** · `test:e2e` **255 tests, 243 verts, 3 échecs attendus, 9 sautés,
   0 échec inattendu, exit 0** (9,9 min).
3. Budgets : `EX-NFR-5` p95 **181,1 ms** (élagué 92,4) · `EX-NFR-7` 2,98 ms (22 ms au navigateur) ·
   `EX-NFR-8` 100 % · `EX-NFR-6` 141 ms · `EX-NFR-9` médianes **1 510 / 1 504 / 1 486 ms**
   (URL filtrée 1 608 / 1 620 / 1 612), aucune mesure au-dessus de 2 000 ms.
4. **Les 8 écarts de ma rev 1 sont CORRIGÉS avec preuve** : `EX-DATA-61/64` (D8-30, 11/14 rouges),
   `EX-DATA-23` (12/12), `EX-SCR-17`, `EX-SCR-153` (6/6), `EX-SCR-174`, `EX-SCR-212/213`,
   `EX-SCR-101`, `EX-SRCH-14` — 13 fichiers de sondes neufs, **+126 sondes**, tous verts chez moi.
5. **`D8-27` rejoué par moi** : `R-D7-2.8-01` **rouge sur `3435456`**, **verte sur `c8c791a`**,
   arbre restauré — la correction sans preuve de la rev 1 est soldée, S2 devient ATTEINT.
6. **`D8-34`** : `EX-SCR-216` en mode 2 passe de `—` partout à `Volkswagen 9340 | BMW 8243 | …`,
   sans aucun aller provider (sondé). **`D8-35`** : `EX-SCR-103` positionne l'écran G, et
   `EX-SCR-97` rend **vert sur les 3 projets** l'`EX-SRCH-14` mobile que fix-app-2 laissait rouge.
7. **`EX-SCR-26`** : aucun gain annoncé n'est faux — le module rejoue les prédicats réels du moteur,
   et l'E2E vérifie qu'une suggestion à « 1 352 offres de plus », **une fois suivie**, en donne 1 352.
8. **Bijection tenue** : 2 `it.fails` = DR-104 + DR-112 (externes) ; **1** `test.fail()` = D8-15
   (3 échecs, un par projet) ; **0 `skip`** dans `tests/review/`, 7 skips de plate-forme inchangés
   en E2E.
9. **Sondes modifiées** : 18 fichiers, **+2 242 / −5**, un seul avec suppressions
   (`persistance.spec.ts`, 4 désignations suivant le contrôle déplacé par `EX-SCR-212`, assertions
   intactes, justifiées dans le fichier **et** dans le rapport). Les deux autres modifications
   **durcissent** les sondes. **Aucune assertion affaiblie.**
10. **§7.2 clos** (5/5 arbitrages ratifiés par `D8-32`, textes d'annexe vérifiés au `grep`, v1.3) ;
    **§7.3 clos** (`D8-28` ratifie les deux corrections hors périmètre, conformément à mon avis) ;
    **`D8-29` et `D8-32(2)` acceptées au titre de S4**, motifs au §6.5.
11. **Deux écarts OUVERTS, nouveaux, sans décision** : `EX-DATA-68`/`EX-DATA-61` sur les agrégats
    (bloc de 13 valeurs inexistant et non dérivable, `MetricRange` = 6 champs) et `EX-SCR-26` sur
    l'écran A (`topRestrictiveFilters: []`, classée `COUVERTE` à tort par 2.7). **Aucun code à
    changer : deux lignes de décision écrite ferment la porte.** Réserves : arrondi de
    `GroupStatEntry.coverage`, `EX-DATA-23` sans appelant vivant, sémantique de `EX-SCR-216` mode 2.
12. Rapport : `reports/REMEDIATION-2.8.md` **rev 2** — seul fichier écrit ; aucun commit, aucun push.
    **`reports/e2e/results.json` (suivi par git) a changé** (`257b4208…` → `21d90e4b…`) : c'est la
    preuve de cette recette, laissée telle quelle pour arbitrage — mon avis : la commiter avec ce
    rapport.
