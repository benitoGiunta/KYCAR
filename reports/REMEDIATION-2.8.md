# REMEDIATION-2.8 — vérification finale de la phase 2.8

Agent `fix-verify` · modèle Opus · effort high · 2026-09-08 · branche `claude/kycar-project-ffcplk`
· arbre principal `/home/user/KYCAR` · **commit vérifié `90a9eea`**
(« Phase 2.8 (EX-SCR-149, D8-24): wire histogram double-click filter clearing in the distribution
screen »), arbre propre à l'arrivée (`git status --short` vide).

**Indépendance (R5).** Je n'ai corrigé aucun constat. Je n'ai modifié ni `src/`, ni `tests/`, ni
`docs/`, ni aucun autre rapport ; **ce fichier est mon seul livrable**. Aucun commit, aucun push,
aucun appel réseau vers `autoscout24` / `2dehands`, aucune installation (`playwright install`
jamais lancé : le Chromium préinstallé est résolu par `playwright.config.ts`), aucune question
posée (E3). Toute hypothèse est écrite comme telle (E4).

**Sources lues** : `CLAUDE.md` · `docs/plans/PLAN-2-app-build.md` §2.8 (S1–S4) et la table des
portes (G7) · `docs/plans/REVIEW-PROTOCOL.md` · `reports/REMEDIATION.md` (format et §4, les 11
dettes de 2.6) · `reports/FINAL-VERIFICATION.md` (matrice 2.7, `FV-01…FV-24`, §3.2(a)(b)(c)(d)) ·
`reports/remediation/e2e-harness.md` (`E2E-01…E2E-26`) ·
`reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md` (`D8-01…D8-26`) · les huit rapports de
correcteurs `reports/remediation-2.8/fix-{foundation,docs,engine,providers,state,screens,
screens-finition,app}.md`.

**Tout ce qui est chiffré ci-dessous a été rejoué par moi**, séquentiellement, sur cet arbre, sans
autre agent actif.

---

## 0. Commandes rejouées et leurs sorties

```
$ git log --oneline -1
90a9eea Phase 2.8 (EX-SCR-149, D8-24): wire histogram double-click filter clearing in the distribution screen
$ git status --short
(sortie vide — arbre propre AVANT mes exécutions)

$ npm run build
> tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.worker.json && vite build
vite v5.4.21 building for production...
✓ 145 modules transformed.
dist/assets/aggregation.worker-DDPPaIpH.js   37.78 kB
dist/assets/index-CLGLrMBE.css               31.60 kB │ gzip:   5.54 kB
dist/assets/index-C4nhB7Vt.js               312.53 kB │ gzip: 101.47 kB
✓ built in 1.32s
  → 0 erreur, 0 warning (exit 0)

$ npm run lint
> eslint .
  → aucune sortie, exit 0

$ npm run size
[size] initial bundle (static from entry) - EX-NFR-10:
     99.09 KiB  assets/index-C4nhB7Vt.js  (index.html)
[size] chunks shipped outside the manifest graph (worker) - EX-NFR-10:
     13.40 KiB  assets/aggregation.worker-DDPPaIpH.js  (hors manifest)
[size] budgets: initial 112.49/300 KiB gzip, deferred 0.00/400 KiB gzip.
[size] OK: within budget.
  → exit 0

$ npm test                 # vitest run PUIS vitest run --config vitest.review.config.ts
  Test Files  58 passed (58)          # suite unitaire
       Tests  675 passed (675)
    Duration  11.08s
  Test Files  87 passed (87)          # sondes de revue promues
       Tests  953 passed (953)
    Duration  57.42s
  → exit 0

$ npm run test:perf
  Test Files  2 passed (2)
       Tests  7 passed (7)
  → exit 0

$ npm run test:e2e         # build de prod servi sur 4180, 3 projets
  Running 237 tests using 1 worker
  ...
  ✘   78 [desktop] › responsive.spec.ts:208 › DETTE D8-15 — … « Assainissement KYCAR » … (EX-SCR-95)
  ✘  157 [tablet]  › responsive.spec.ts:208 › DETTE D8-15 — …
  ✘  236 [mobile]  › responsive.spec.ts:208 › DETTE D8-15 — …
  9 skipped
  228 passed (9.4m)
  → exit 0 — 237 tests : 225 verts, 3 ÉCHECS ATTENDUS (les 3 `test.fail()` de la dette D8-15,
    comptés « passed » par Playwright), 9 sautés, **0 échec inattendu**
```

Les quatre lignes `[size] FAIL` émises pendant la suite de revue sont les sondes D1
(`tests/review/D1/*`) qui exercent le vérificateur de budget sur des **manifestes factices** : ce
sont des cas de test attendus, pas des dépassements. `npm run size` réel, ci-dessus, est **OK**.

---

## 1. Résumé exécutif et verdict S1–S4 (PLAN-2 §2.8)

Les cinq portes locales sont **vertes** et les deux parcours cibles se déroulent en navigateur : les
deux BLOQUANTS de 2.7 (`FV-01` tampon détaché, `FV-02` « 0 modèles ») sont corrigés et prouvés par
exécution. La remédiation est réelle et large : sur les 24 constats `FV`, 24 sont traités ; sur les
26 constats `E2E`, 26 sont traités et leurs 26 `test.fail()` retirés après rejeu vert.

**Ce qui empêche néanmoins la porte G7 d'être franchie**, ce ne sont pas les corrections livrées :
ce sont **huit exigences `PARTIELLE` de la matrice 2.7 que personne n'a prises et qu'aucune décision
`D8-xx` ne met en dette** (§7.1). G7 exige « zéro `NON COUVERTE`, zéro `PARTIELLE` sans dette
motivée ; dettes restantes **exclusivement externes** » : ces huit écarts sont internes et sans
décision. Ils sont mineurs (aucun ne fausse une valeur affichée), mais la porte ne se lit pas à la
sévérité — elle se lit à la présence ou à l'absence d'une décision écrite.

| Critère | Énoncé (PLAN-2 §2.8) | Verdict | Preuve |
|---|---|---|---|
| **S1** | zéro exigence `NON COUVERTE` et zéro `PARTIELLE` sans dette motivée par une décision | **NON ATTEINT** | Les 28 `NON COUVERTE` de 2.7 sont toutes reprises par un constat `FV` traité (`EX-DATA-5/10/11` → `FV-20`/`D8-16`, sondes `R-D9-26/27/28` vertes ; etc.) — cette moitié tient. Mais **8 `PARTIELLE` restent sans décision** : `EX-DATA-61` et `EX-DATA-64` (résidu `DR-122` : `MetricStats.iqr`/`coverage` toujours `null`, §7.1 n° 1), `EX-DATA-23`, `EX-SCR-17`, `EX-SCR-101`, `EX-SCR-153`, `EX-SCR-212` (les cinq « mineurs isolés » de `FINAL-VERIFICATION` §3.2(d), repris par aucun cluster), `EX-SCR-174` et `EX-SRCH-14` (« à sonder en 2.8 » §3.2(b), aucune sonde écrite). Vérifié par exécution : `grep -rn 'iqr:' src/engine/quantiles.ts` → 4 littéraux `null` ; `grep -rn 'EX-SCR-174\|EX-SRCH-14' tests/` → 0 ; `grep -rn 'EX-DATA-23\|EX-SCR-17\|EX-SCR-101\|EX-SCR-153\|EX-SCR-212' reports/remediation-2.8/` → 0. En outre `FV-06` n'est corrigé **qu'en mode 2** (facettes de mode 1 renvoyées à 2.9 par fix-app §3, sans décision `D8-xx`) : `EX-SCR-65`/`89`/`90` restent partielles en mode 1 |
| **S2** | chaque correction prouvée par exécution (sonde ou test E2E) | **ATTEINT SAUF UN POINT** | 24 `FV` sur 24 et 26 `E2E` sur 26 portent une preuve exécutée que j'ai rejouée (§3) : `npm test` 675 + 953 verts, `npm run test:e2e` **237 tests, 225 verts + 3 échecs attendus, 9 sautés, 0 échec inattendu, exit 0** (9 min 24 s). **Une exception, nommée** : le câblage `onClearFilter` de `DistributionScreen.tsx` posé par le coordinateur au commit `90a9eea` (`EX-SCR-149`, double-clic) **n'est couvert par aucune preuve** — `tests/review/D7/histogrammes.test.ts` prouve le composant `Histogram`, pas la coquille qui lui passe la prop (§5.3) |
| **S3** | aucune régression : `npm test`, `npm run test:e2e`, budgets | **ATTEINT** | `npm run build` 0/0 · `npm run lint` vert · `npm test` **675 + 953 verts, 0 échec, 0 saut, 0 `todo`** · `npm run test:perf` 7/7 · `npm run size` **112,49 / 300 Kio gzip** · `npm run test:e2e` **237 tests, 225 verts + 3 échecs attendus, 9 sautés, 0 échec inattendu, exit 0** (9 min 24 s). Budgets tenus, valeurs au §2.2 |
| **S4** | les dettes restantes sont exclusivement externes (décision ou source hors dépôt), nommées | **NON ATTEINT** | Les cinq dettes **externes** de `D8-18` sont nommées et vivantes (§6.1), et la **dette produit** `D8-15`/`EX-SCR-95` est une décision explicite et datée du fix-lead (§6.2) — cela, c'est conforme. Mais les huit écarts de S1 ci-dessus sont des dettes **internes non déclarées** : ni externes, ni motivées par une décision. Trois arbitrages de correcteurs restent en outre en attente de ratification (§7.2) |

**Porte G7 : NON FRANCHIE** — motivation détaillée au §8.

---

## 2. Décomptes et budgets rejoués

### 2.1 Suites

| Suite | Commande | Fichiers | Tests | Passés | Échoués | `it.fails` / `test.fail()` | Sautés | Référence 2.7 |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Unitaire | `npm run test:unit` (via `npm test`) | **58** | **675** | 675 | 0 | 0 | 0 | 615 (+60) |
| Sondes de revue | `vitest run --config vitest.review.config.ts` (via `npm test`) | **87** | **953** | 953 | 0 | **2** (comptées « passées » : elles échouent comme attendu) | 0 | 798 (+155) |
| Performance | `npm run test:perf` | 2 | 7 | 7 | 0 | 0 | 0 | 7 (=) |
| Recette navigateur | `npm run test:e2e` (3 projets) | **9** `*.spec.ts` × 3 projets | **237** | **225** verts (+ 3 comptés « passed » par Playwright car attendus) | **0** inattendu | ****3**** (`test.fail()` attendus) | **9** | 234 tests / 26 constats (2.9a) |

`0 saut` et `0 todo` sur les deux suites Vitest : la règle **D-49** (« jamais `skip`, jamais
`todo` ») est tenue. Vérifié par exécution :
`grep -rn 'it\.skip\|test\.skip\|describe\.skip\|it\.todo\|test\.todo\|\.only(' tests/review/ src/`
→ **aucune occurrence**.

### 2.2 Budgets

| Budget | Exigence | Mesuré à `90a9eea` | Marge | Référence |
|---|---|---|---|---|
| Bundle initial gzip | `EX-NFR-10` ≤ 300 Kio | **99,09 Kio** (entrée) ; **112,49 Kio** entrée + worker | 62,5 % | 99,13 Kio en 2.7 (+13,4 Kio, dont le worker désormais compté) |
| Bundle différé | `EX-NFR-11` ≤ 400 Kio | 0,00 Kio (aucun chunk différé) | — | = |
| Recalcul FULL non élagué, N = 100 000 | `EX-NFR-5` p95 ≤ 200 ms | **p50 162,7 · p95 181,1 · max 191,4 ms** | 9,5 % au p95 | p95 165,5 ms en 2.7 (+15,6 ms) |
| Recalcul élagué (plus grande marque, m = 9 283) | `EX-NFR-5` p95 ≤ 200 ms | p50 81,6 · **p95 97,4** · max 128,4 ms | 51 % | 60,4 ms avant D8-07 (+37 ms : coût des six statistiques du worker) |
| Facettes différées (8 filtres) | `EX-DATA-110bis` p95 ≤ 100 ms | p50 18,8 · **p95 20,7 ms** | 79 % | 20,4 ms |
| Rendu initial du nuage, 5 000 points | `EX-NFR-7` p95 ≤ 500 ms | p50 1,27 · **p95 3,91 ms** | 99 % | 3,92 ms |
| Interaction continue 10 s | `EX-NFR-8` ≥ 30 img/s sur ≥ 95 % des fenêtres | **100 % (91/91 fenêtres, min 257 img/s)** | — | 100 % |
| Premier affichage utile en 4G simulée | `EX-NFR-9` ≤ 2 000 ms | **desktop médiane 1 515 ms** (1515/1518/1496/1526/1506, max 1 526) · **tablet 1 521 ms** (max 1 556) · **mobile 1 497 ms** (max 1 522) ; URL déjà filtrée : 1 632 / 1 665 / 1 607 ms. 208 Kio transférés | — | 1 493 ms (2.9a), 1 510 ms mesuré par fix-app après plancher de 400 ms |
| Mémoire colonnaire à 100 000 | `EX-NFR-1` ≤ 25 Mo | 17,26 Mo (mesure fix-providers §5.1, non rejouée isolément : la sonde `R-D3-*` correspondante est verte dans les 953) | 31 % | 17,27 Mo |
| Lot sérialisé gzip | `EX-NFR-3` ≤ 6 Mo | 5,47 Mo (idem, sonde `EX-NFR-3` verte dans les 953) | 8,8 % | 5,45 Mo |

**Observations chiffrées, sans réserve bloquante.** (a) `EX-NFR-5` perd 15,6 ms au p95 sur le chemin
non élagué et 37 ms sur le chemin élagué : c'est le coût des six statistiques `D8-07`, mesuré,
documenté par fix-engine §4, et il reste 51 % de marge sur le pire cas du jeu synthétique.
(b) `EX-NFR-3` conserve la marge étroite de 8,8 % déjà consignée en 2.6 (`D-30`, `DR-126`) ; 2.8 lui
coûte +0,02 Mo (entropie réelle de `vatDeductible`). (c) La sonde `R-D3-02`, sensible à la charge
(`D8-22`), a été rejouée **hors charge** comme la décision l'exige : `182 / 119 / 120 / 123 / 172 ms
→ médiane 123 ms` pour un budget de 200 ms — verte, sans relâchement de seuil (§4.2).

---

## 3. Matrice constat → décision → correction → preuve → statut

Colonne « preuve » : la commande ou le test que **j'ai rejoué** ; sauf mention contraire, la sonde
citée est verte dans les 953 sondes de revue de `npm test`, et le test E2E cité est vert dans la
recette des trois projets.

### 3.1 Constats `FV-01…FV-24` de la vérification finale 2.7

| # | Sév. 2.7 | Décision | Correcteur / commit | Correction | Preuve rejouée | Statut |
|---|---|---|---|---|---|---|
| **FV-01** | BLOQUANT | `D8-01` | fix-app · `9722a63` | `src/worker/client.ts` : `batchTransferables` **supprimée**, `postMessage` sans liste de transfert (copie structurée) ; coût mesuré 2,6 ms médiane à 100 000 lignes | `src/worker/client.structured-copy.test.ts` (4 cas, `node:worker_threads`, le cas « AVEC transfert » atteste le défaut) ; `tests/review/D8/shell-wiring-2.8.test.ts` « `loadDataset` n'assemble aucune liste de `Transferable` » ; E2E `parcours-p2.spec.ts` (8 tests ex-`test.fail()`) | **CORRIGÉ** |
| **FV-02** | BLOQUANT | `D8-02`, `D8-10` | fix-app · `6a8398e`, `9106391` ; fix-screens · `743b358` ; fix-providers · `be3cc7d` | `data-controller.ts::loadAllModels` (un `fetchAggregates('MODEL')` de portée marché, hors chemin critique via `requestIdleCallback` + plancher 400 ms) ; `MakeAggregate.modelCount` obligatoire, calculé par les deux providers ; `modelCountLabel` rend « — » sur `null`, **jamais `0`** | Sondes `R-D3-15`/`15b` (synthétique), `R-D9-23` (réel), `tests/review/D6/*` (rendu), `shell-wiring-2.8.test.ts` (`loadAllModels`) ; E2E `parcours-p1.spec.ts::E2E-04`/`E2E-05` | **CORRIGÉ** |
| FV-03 | MAJEUR | `D8-03` | fix-app · `6a8398e` | `app.tsx` consomme `corrections` : `replaceState` canonique + bandeau `ET-URL-CORRIGEE` au format normatif, durée de vie bornée | `shell-wiring-2.8.test.ts` (2 cas) ; E2E `partage-url.spec.ts::E2E-26` (les 4 classes de défaut) | **CORRIGÉ** |
| FV-04 | MAJEUR | `D8-04a-d` | fix-app (a,b,c) · `6a8398e`, `2de2516` ; fix-state (d) · `e9afd7b` | (a) clic d'en-tête pose `mmmv` ; (b) `mmmv` complet redirige vers B en `replace` ; (c) retour B → A réinjecte `make\|\|\|` ; (d) un jeton par niveau, libellé taxonomique | `shell-wiring-2.8.test.ts` (3 cas a/b/c) ; sonde `R-D5-27` (`tests/review/D5/mmmv-tokens.test.ts`) ; E2E `partage-url.spec.ts`, `responsive.spec.ts` | **CORRIGÉ** |
| FV-05 | MAJEUR | `D8-05` | fix-app · `6a8398e` ; fix-state · `e9afd7b` | `screenGMakeCounts` / `screenGModelCounts` alimentés depuis les agrégats courants ; `ScreenG` rend l'effectif au lieu de « — » | `shell-wiring-2.8.test.ts` (« `FilterBand` reçoit … effectifs d'écran G ») ; sonde `R-D5-28` ; E2E `clavier.spec.ts` (écran G), `a11y.spec.ts::E2E-12` | **CORRIGÉ** |
| FV-06 | MAJEUR | `D8-05` | fix-app · `6a8398e` ; fix-state · `e9afd7b` | `computeFacets` + `FACET_FILTER_SPECS` ; facettes différées ≤ 100 ms, `facetCounts`/`facetCountsPending` vers `FilterBand` ; `CheckboxList` rend `(n)` / `(0)` gris / `…` | `shell-wiring-2.8.test.ts` (2 cas, dont « différées ≤ 100 ms ») ; sonde `R-D5-29` (`facet-counts.test.ts`) | **CORRIGÉ EN MODE 2 · PARTIEL EN MODE 1** — fix-app §3 : `computeFacets` exige un jeu chargé, ce qu'`O17` interdit en mode 1 ; aucune facette n'est alors passée (jamais un `(0)` inventé). Renvoyé à 2.9 **par le correcteur, sans décision `D8-xx`** → §7.1 n° 4 |
| FV-07 | MAJEUR | `D8-06` | fix-screens · `ed88b93`, `743b358` ; fix-app · `6a8398e` | `DistributionScreen` rend `buildC3Banner` + ligne de représentativité (`representativityUnproven`) ; pile de bandeaux `EX-SCR-38` plafonnée à 2 + jeton `+k` ; doublon C3 de l'écran A **vérifié inexistant** après restructuration | Sondes `tests/review/D7/ecran-b.test.ts` (4 cas C3) ; `shell-wiring-2.8.test.ts` (2 cas de pile) ; E2E `impression.spec.ts` règle 2 | **CORRIGÉ** |
| FV-08 | MAJEUR | `D8-06` | fix-screens · `27a43cf` ; fix-app · `6a8398e` | `modelId === 0` : bandeau non refermable, G5/G6/G8/G10/G14 **hors DOM**, `Comparer` désactivé | Sondes `tests/review/D6/modele-non-identifie.test.ts` ; `shell-wiring-2.8.test.ts` (`modelId` câblé) ; E2E `partage-url.spec.ts` (route `/marche/54-opel/0-…`) | **CORRIGÉ** |
| FV-09 | MAJEUR | `D8-06` | fix-screens · `27a43cf` | `lowSampleRange` : `[min, max]` rendu dès `n = 1`, jeton ambre `n = <n>` ; « — » interdit (D-04/D-36) | Sondes `tests/review/D6/effectif-seuils.test.ts` (assertions retournées avec justification, §4.1) | **CORRIGÉ** |
| FV-10 | MAJEUR | `D8-07` | fix-engine · `15c0806` ; fix-screens · `743b358` | `fitM2` publie `R² = 1 − SCR/SCT` par cellule + avertissement `R² < 0,30` ; G8 porte le libellé normatif `EX-SCR-164` | Sonde `R-D8-07-05` (2 cas) ; test unitaire `src/engine/outliers.cells.test.ts` (**oracle indépendant** : `R²` recalculé comme `r²` de Pearson) ; sondes `tests/review/D7/ecran-b.test.ts` | **CORRIGÉ** |
| FV-11 | MAJEUR | `D8-06` | fix-screens · `27a43cf` | Notes d'exclusion de G2/G3 dérivées de `SelectionStats.mileage.n` / `year.n`, comme G1 | Sondes `tests/review/D7/ecran-b.test.ts` | **CORRIGÉ** |
| FV-12 | MAJEUR (doc.) | `D8-13` | fix-docs · `ddb95cc`…`46f0e0f` | `EX-NFR-8` (pan/zoom), `EX-SCR-59` (8 contrôles / 11 paramètres), `EX-SCR-82` (6 `NON_EXPOSE`, `zip`/`lat`/`lon` `EXCLU`), `EX-SCR-83` (74/68+6/12/53), REQUIREMENTS §0/§6/§11.3 (74 + 27), annexe A §C.5 (140) ; journal §13 → **v1.2** | `grep -n '74 retenus + 27 exclus' docs/requirements/REQUIREMENTS.md` → §0/§6/§11.3 et journal v1.2 ; sonde `tests/review/D5/registry-scope.test.ts` (`table.size` 76 → **74**, alignée sur `filters-scope.json`) verte | **CORRIGÉ** |
| FV-13 | MINEUR | `D8-14` | fix-app · `3b5ff11` | **Deux** causes : le résumé sort de `.filter-bar` (frère) **et** la règle « masqué à l'écran » est bornée à `@media screen` (elle l'emportait jusqu'au papier) ; contenu construit depuis `buildActiveFilterTokens`, un filtre par ligne | `shell-wiring-2.8.test.ts` (2 cas `E2E-22`/`E2E-23`) ; E2E `impression.spec.ts::E2E-22` et `E2E-23` | **CORRIGÉ** |
| FV-14 | MINEUR | `D8-14` | fix-state · `e9afd7b` ; fix-screens · `b75931f` | Formateur d'année dédié (`fmtYearRange`) dans `labels.ts` et l'écran C | Sondes D5 et `src/screens/compare/structure.test.ts` vertes | **CORRIGÉ** |
| FV-15 | MINEUR | `D8-06` | fix-screens · `b75931f` ; fix-app · `6a8398e` | G5 sans `NaN` (bornes finies, buckets ouverts clampés) ; `FilterBand` monté sur `/comparer` ; colonnes « + Ajouter un modèle » ; `onRedirect` (borné à une **transition**, arbitrage fix-app §5.1) | `src/screens/compare/structure.test.ts` ; `shell-wiring-2.8.test.ts` (2 cas, dont « jamais à froid ») ; E2E `a11y.spec.ts` surface C, `clavier.spec.ts` | **CORRIGÉ** |
| FV-16 | MINEUR | `D8-14` | fix-screens · `68d45aa` ; fix-state · `f098826` ; fix-app · `9106391` | Contraste des pastilles calculé (`badgeTextColorForMake`, luminance WCAG) ; case Comparer sortie du `role=button` ; ARIA de l'écran G corrigée ; `tabindex="-1"` posé **avant** `focus()` | Sondes `tests/review/D6/structure-a11y.test.ts`, `R-D5-28` ; E2E `a11y.spec.ts::E2E-11` et `E2E-12` (axe-core), `clavier.spec.ts::E2E-16` ×2 | **CORRIGÉ** (tension `FV-16` / `E2E-16` arbitrée et prouvée : fix-app §5.2, le lien d'évitement reste le premier arrêt tabulable) |
| FV-17 | MINEUR | `D8-14` | fix-app · `6a8398e`, `2de2516` | Drapeau de session `kycar:primer-seen` ; `mk` dérivé de l'URL en `replace` ; cardinaux d'onglet masqués à 0 ; jeton `Snapshot <JJ/MM>` + infobulle ; `brandHref` avec `currentQuery` | `shell-wiring-2.8.test.ts` (`FV-17`) ; E2E `parcours-p1.spec.ts`, `partage-url.spec.ts` | **CORRIGÉ** |
| FV-18 | MINEUR | `D8-06`, `D8-24` | fix-screens · `f5849be` ; fix-screens-finition · `9d31633`, `b25c4d6` ; fix-app · `6a8398e` | G15 masqué en mono-pays ; empreinte `data-selection` sur les 14 figures ; brossage horizontal / `Ctrl`+clic / double-clic (`EX-SCR-149`) ; légendes discrètes + brossage désactivé sous 4 offres (`EX-SCR-159`) ; `recalculating` → atténuation + `<progress>` (`ET-CHARGE-MAJ`/`INIT`) | Sondes `tests/review/D7/ecran-b.test.ts` (40 cas), `histogrammes.test.ts` (22 cas) ; `shell-wiring-2.8.test.ts` (`recalculating`, survie du payload) | **CORRIGÉ**, une réserve : `EX-SCR-159` est livrée en **version bornée** (légende atténuée, pas les pastilles/valeurs littérales de `draft-screens.md` §6.4) — signalée par fix-screens-finition §2, **non ratifiée** → §7.2 n° 3 |
| FV-19 | MINEUR | `D8-15` | fix-state · `e9afd7b` ; fix-screens · `9456eb3` ; fix-app · `6a8398e`, `33899c1` | Régimes compact/intermédiaire (bandeau, en-tête, écran D), hors ligne (`navigator.onLine`, aucun réseau), raccourci `/`, notification « k filtres retirés / Annuler », feuille plein écran à application différée, menu/tiroir | Sondes `R-D5-30`…`R-D5-34` (`regime-and-shortcuts.test.ts`), `tests/review/D7/ecran-d.test.ts` ; E2E `responsive.spec.ts` (3 projets) | **CORRIGÉ**, sauf `EX-SCR-95` → **DETTE D8-15** (réglages « Assainissement KYCAR », dette **produit** ratifiée, §6.2) |
| FV-20 | MINEUR | `D8-16`, `D8-10` | fix-providers · `638a38d`, `5305a3a` | `UNIT_UNSUPPORTED` posé ; repli carburant création → recherche ; `HYBRID_CATEGORY_UNRESOLVED` ; annonce sans `listingUrl` **rejetée et comptée** ; `co2Source` renseigné ; `coverageWarning` / `samplingBias` / `adTierDistribution` sur le provider réel | Sondes `R-D9-26`…`R-D9-30`, `R-D3-16`…`R-D3-19`, `R-D9-24`/`25`/`25b`, `R-D3-15c` — toutes vertes dans les 953 | **CORRIGÉ**, deux arbitrages en attente de ratification : dénominateur de `coverageWarning` (fix-providers §4.2) et `co2Source` synthétique à `UNKNOWN` déclaré (§4.3) → §7.2 n° 1 et 2 |
| FV-21 | MINEUR | `D8-14` | fix-app · `6a8398e` | Panneau Diagnostic étendu au `SnapshotDescriptor` (champs inconnus, drapeaux **itérés par clé**, doublons, journal des rejets, couverture) ; `Rafraîchir` ; bandeau « Nouvelles données du … » | `shell-wiring-2.8.test.ts` (`FV-21`) ; E2E `parcours-p1.spec.ts` (lecture du snapshot dans le panneau) | **CORRIGÉ** |
| FV-22 | MINEUR | `D8-14` | fix-app · `6a8398e` | `index.html` : `<link rel="icon">` SVG **en `data:`** — aucun fichier binaire, aucun aller réseau (E5) | `shell-wiring-2.8.test.ts` (`FV-22`) ; aucune erreur console dans la recette (`parcours-p2.spec.ts` journalise `pageerror`) | **CORRIGÉ** |
| FV-23 | MINEUR | `D8-05` | fix-app · `6a8398e` | `resultCount` / `resultCountLoading` vers `FilterBand` (`marketSelectionCount`, `null` si un filtre n'est pas appliqué — jamais un plancher présenté comme un effectif) ; double compteur « `<n>` offres \| `<n>` ici » via `withoutTaxonomy` | `shell-wiring-2.8.test.ts` (3 cas, dont « un effectif non établi n'est jamais rendu comme un zéro ») ; E2E `parcours-p1.spec.ts`, `impression.spec.ts` | **CORRIGÉ** (solde la dette `resultCount` du bandeau listée au PLAN §2.8) |
| FV-24 | MINEUR | `D8-14` | fix-app · `6a8398e` ; fix-state · `e9afd7b` | `onSaveSearch={(name) => saveCurrentSearch(name)}` (le bandeau passait par une arité 0 qui ignorait le nom) ; `SaveSearchForm` prérempli par `buildSearchDescription(activeFilterTokens)` | Sonde `R-D5-34` (description du formulaire) ; E2E `persistance.spec.ts` (10/10) | **CORRIGÉ** |

### 3.2 Constats `E2E-01…E2E-26` de la recette 2.9a

| # | Sév. | Décision | Correcteur | Correction | Preuve rejouée | Statut |
|---|---|---|---|---|---|---|
| `E2E-01` `02` `03` `06` `07` `08` `09` `10` `13` | BLOQUANT ×5, MAJEUR ×4 | `D8-01` | fix-app | Cause racine unique : plus de transfert au worker (voir `FV-01`) | Les 8 `test.fail()` de `parcours-p2.spec.ts` retirés après rejeu vert ; `E2E-13` (a11y de l'écran D) désormais **prononçable** : `a11y.spec.ts` surface D verte | **CORRIGÉ** (×9) |
| `E2E-04`, `E2E-05` | MAJEUR | `D8-02` | fix-app, fix-screens | `modelCount` de la donnée ; zones rendues sans clic | `parcours-p1.spec.ts::E2E-04`/`E2E-05` (`expect.poll` : l'enrichissement est progressif, `EX-NFR-9`) | **CORRIGÉ** |
| `E2E-11` | MAJEUR | `D8-14` | fix-screens | `badgeTextColorForMake` + 3 teintes resserrées | `a11y.spec.ts::E2E-11` (axe-core `color-contrast` = 0) | **CORRIGÉ** |
| `E2E-12` | MAJEUR | `D8-14` | fix-state | `aria-selected` porté par le `li[role=option]`, `aria-setsize` par option, `button` interne supprimé | `a11y.spec.ts::E2E-12` ; sonde `R-D5-28` | **CORRIGÉ** |
| `E2E-14` | MAJEUR | `D8-14` | fix-state | Élément déclencheur mémorisé à l'ouverture, refocalisé au démontage | `clavier.spec.ts::E2E-14` | **CORRIGÉ** |
| `E2E-15` | MINEUR | `D8-14` | fix-screens | `<h1>Survol du marché</h1>` sur les 5 branches de `MarketScreen` | `clavier.spec.ts` | **CORRIGÉ** |
| `E2E-16` | MAJEUR | `D8-14` | fix-app | `tabindex="-1"` posé avant `focus()`, repli sur `#kycar-main` | `clavier.spec.ts::E2E-16` (les **deux** tests) ; `shell-wiring-2.8.test.ts` | **CORRIGÉ** |
| `E2E-17` | MAJEUR | `D8-14` | fix-screens | Rampe **ANNÉE** en régime dégradé ; légende de couleur conservée | `responsive.spec.ts::E2E-17` (projet `mobile`) | **CORRIGÉ** |
| `E2E-18` | MINEUR | `D8-14` | fix-screens | Libellé du repli lu sur `modelsVisibleBeforeCollapse` | `responsive.spec.ts::E2E-18` (projet `mobile`) | **CORRIGÉ** |
| `E2E-19` | MAJEUR | `D8-14` | fix-screens ; fix-app | `minmax(0, 1fr)` dans `distribution.css` ; **plus** deux débordements révélés ensuite : grille du panneau Diagnostic (`app.css`) et régime intermédiaire du bandeau (`filter-band.css`, hors périmètre nominal, §5.1) | `responsive.spec.ts::E2E-19` sur les **3 projets** (`scrollWidth` = `clientWidth`) | **CORRIGÉ** |
| `E2E-20` | MAJEUR | `D8-14` | fix-screens | `import './market.css'` dans `MarketScreen.tsx` (feuille morte) | `impression.spec.ts::E2E-20` | **CORRIGÉ** |
| `E2E-21` | MAJEUR | `D8-14` | fix-state | `filter-band.css` et `screen-g.css` écrits et importés | `responsive.spec.ts::E2E-21` | **CORRIGÉ** |
| `E2E-22`, `E2E-23` | MAJEUR / MINEUR | `D8-14` | fix-app | Résumé d'impression frère de `.filter-bar` + masquage borné à `@media screen` ; contenu en libellés FR, un filtre par ligne | `impression.spec.ts::E2E-22` et `E2E-23` ; `shell-wiring-2.8.test.ts` ×2 | **CORRIGÉ** |
| `E2E-24` | MAJEUR | `D8-14` | fix-app | `hasDuplicateName` évalué **avant** `create` | `persistance.spec.ts::E2E-24` ; `shell-wiring-2.8.test.ts` | **CORRIGÉ** |
| `E2E-25` | MAJEUR | — (résidu `D8-09`/coordinateur, `6aa3809`, `3b5ff11`) | fix-app | Index CRUD **auto-réparateur** : réconcilié avec les clés `kycar:<collection>/*` à chaque lecture, réparation persistée, rejouée sur l'événement `storage` ; aucun `navigator.locks` (D-16 intact) | Sonde neuve `tests/review/D8/index-autorepair.test.ts` (**3 cas rouges sur 5 avant**, 5/5 après) ; `persistance.spec.ts::E2E-25` (8 rondes, 0 perte) | **CORRIGÉ** |
| `E2E-26` | MAJEUR | `D8-03` | fix-app | Voir `FV-03` | `partage-url.spec.ts::E2E-26` | **CORRIGÉ** |

**Bilan** : 26 constats `E2E`, **26 corrigés**, **0 ouvert**, **0 mis en dette**. Les 26 `test.fail()`
correspondants ont été retirés, chacun remplacé par un commentaire nommant la correction (règle
`D8-17` / `D8-26`) ; le seul `test.fail()` restant est celui de la dette `D8-15` (§5.2).

### 3.3 Dettes 2.6 « levables en interne » listées au PLAN-2 §2.8

| Dette 2.6 | Décision 2.6 | Décision 2.8 | Correcteur | Preuve rejouée | Statut |
|---|---|---|---|---|---|
| **DR-034** — `GROUPSTAT`/`NTILE`/paliers/indice/`R²`/`SAMPLE` hors worker (MAJEUR) | `D-17` | `D8-07` | fix-engine (`f25c609`, `15c0806`), fix-screens (`743b358`) | 14 sondes `R-D8-07-01`…`07`, `R-D8-09-01` (**14 rouges sur 14 avant**, §4.3) ; `graphs-model.ts` récrit, `group-stat.ts` supprimé, `stats-nondivergence.test.ts` retiré : **source unique** ; budget `EX-NFR-5` remesuré (§2.2) | **LEVÉE** |
| **DR-082** — colonne TVA (MAJEUR) | `D-38` | `D8-08` | fix-foundation (`a89ca27`), fix-providers, fix-screens | `R-D7-16` **repassée de `it.fails` à `it`**, verte, assertions inchangées ; `R-D3-14`/`14b`, `R-D9-22`/`22b` ; colonne alimentée (36 089 oui / 61 357 non / 2 554 inconnus à 100 k) | **LEVÉE** |
| **DR-114** — verdicts `INSUFFICIENT_*` | `D-45` | `D8-09` | fix-foundation (`4cb157f`), fix-engine (`15c0806`), fix-docs | `R-D4-05` **repassée en `it`**, verte, assertions inchangées ; 5 sondes vertes contradictoires amendées avec justification (§4.1) ; `EX-DATA-85` porté à 8 codes par fix-docs | **LEVÉE** |
| **DR-105** — garde R3 E15–E17 | §6.5 | `D8-11` | fix-foundation (`d3874d9`), fix-docs | `R-D2-02` **repassée en `it`** dans le commit même, + un second cas (formes imbriquées/aplaties) ; `grep -n 'vin\|licenceplate\|carpass' src/types/validation.ts` → 14 noms normalisés ; `EX-DATA-49` amendée E1–E17 | **LEVÉE** |
| **DR-132** — libellés `zipr` `[EXTRAPOLÉ]` | §6.5 | `D8-12` | fix-state (`e9afd7b`) | `R-D5-10` **repassée en `it`**, verte | **LEVÉE** |
| **DR-134** — suggestions par distance d'édition | §6.5 | `D8-12` | fix-state (`e9afd7b`) | `R-D5-13` **repassée en `it`**, verte, + 2 cas | **LEVÉE** |
| **DR-143** — grille compacte 4 lignes | `D-40` | `D8-12` | fix-screens (`1d1850f`) | `R-D6-10` retournée d'assertion **négative en positive** avec justification (§4.1) ; dépendait aussi d'`E2E-20` (feuille `market.css` morte) | **LEVÉE** |
| **DR-147** — mention utilisateur de la dette A-08 | §6.5 | `D8-12` | fix-screens (`743b358`) | `R-D7-10` **repassée en `it`**, verte, assertion inchangée | **LEVÉE** (la dette A-08 elle-même — graphes CO₂/conso/boîte — n'est pas levée : seule son **absence de mention** l'était) |
| **`resultCount` du bandeau** | §7.1 n° 1 de `REMEDIATION.md` | `D8-05` | fix-app (`6a8398e`) | Voir `FV-23` | **LEVÉE** |
| **DR-122** — entités `MetricStats` / `MakeAggregate` | §6.5 | `D8-10`, `D8-23` | fix-foundation, fix-providers, fix-screens | `modelCount` ✓, `coverageWarning`/`samplingBias`/`adTierDistribution` ✓ (provider réel), `rank`/`displayRange`/`makeName` dérivés au rendu (`D8-23`) ✓ | **PARTIELLEMENT LEVÉE** — `MetricStats.iqr` et `MetricStats.coverage` restent `null` (4 littéraux de `src/engine/quantiles.ts`). **Écart ouvert** → §7.1 n° 1 |

### 3.4 Exigences `PARTIELLE` / `NON COUVERTE` de 2.7 non reprises par un constat `FV`

| Exigences | Catégorie 2.7 | Traitement en 2.8 | Statut |
|---|---|---|---|
| `EX-DATA-83bis/ter/quater/quinquies`, `EX-SCR-203`, `EX-SCR-135`, `EX-DATA-85`, `EX-NFR-29`, `EX-SCR-80` | §3.2(a), dettes 2.6 levables | `D8-07`, `D8-08`, `D8-12`, `D8-09` — voir §3.3 | **CORRIGÉ** |
| `EX-DATA-53`, `54`, `126` (DR-112) · `EX-DATA-115bis`, `EX-SCR-221` (O15) · `EX-SRCH-12` (D-03/O7) · `EX-SCR-9` (D-14) | §3.2(a), dettes externes | `D8-18` : maintenues, chacune documentée par fix-docs dans l'annexe concernée ; `EX-SCR-221` reçoit en outre la mitigation `D8-20` (bandeau « Filtre Carrosserie non appliqué à ce modèle ») | **DETTE (externe, D8-18)** |
| `EX-DATA-17`, `43`, `68` (DR-122) | §3.2(a) | `D8-10` / `D8-16` : `coverageWarning`, `adTierDistribution`, `samplingBias`, `modelCount` publiés | **CORRIGÉ** |
| **`EX-DATA-61`, `EX-DATA-64`** (DR-122) | §3.2(a) | **Personne** : fix-providers §2 les renvoie à fix-engine, fix-engine §6.4 les déclare hors mandat | **OUVERT** → §7.1 n° 1 |
| `EX-SCR-21`, `25`, `56`, `87`, `100`, `124`, `127`, `171`, `180`, `181`, `186`, `190`, `199`, `EX-NFR-6`, `EX-NFR-14` | §3.2(b), mesures au rendu | Renvoyées à la recette navigateur : la suite E2E les exerce (`perf.spec.ts` pour `EX-NFR-6`, `clavier.spec.ts` pour `EX-NFR-14`, `responsive.spec.ts` pour les régimes). **Statut définitif : 2.9b** | **DIFFÉRÉ 2.9b** (motivé par le plan) |
| **`EX-SCR-174`, `EX-SRCH-14`** | §3.2(b), « à sonder en 2.8 » | **Personne** : `grep -rn 'EX-SCR-174\|EX-SRCH-14' tests/` → 0 | **OUVERT** → §7.1 n° 2 |
| `EX-DATA-110`, `EX-DATA-115`, `EX-SCR-177` | §3.2(c), points d'instruction sans défaut | Inchangés, aucun défaut prouvé | **SANS OBJET** |
| **`EX-DATA-23`, `EX-SCR-17`, `EX-SCR-101`, `EX-SCR-153`, `EX-SCR-212`** | §3.2(d), « mineurs isolés » | **Personne** : aucune ligne des huit rapports ne les cite ; vérifié dans le code (§7.1 n° 3) | **OUVERT** → §7.1 n° 3 |

---

## 4. Sondes et tests modifiés en 2.8, avec leur justification

Périmètre du contrôle : `git diff --stat 427f820..HEAD -- tests/review/` (base = `427f820`,
commit de clôture de 2.7 « FINAL-VERIFICATION.md ») et
`git diff --stat a85c037..HEAD -- tests/e2e/` (base = `a85c037`, fusion du harnais 2.9a — les
fichiers `tests/e2e/` n'existaient pas avant).

- `tests/review/` : **43 fichiers** touchés, dont **10 créés**, +2 601 / −117 lignes.
- `tests/e2e/` : **9 fichiers** touchés, +320 / −106 lignes.

### 4.1 Sondes de revue dont une assertion a changé — justification vérifiée

| Fichier · sonde | Nature du changement | Justification écrite | Où | Verdict |
|---|---|---|---|---|
| `D2/dictionary-fields.test.ts` | « 19 colonnes d'un octet » → **20** | `D8-08` amende l'interface gelée ; l'assertion normative (alignement descripteur ↔ `ListingColumnBatch`) est contrôlée à part par `provider-contract.test.ts`, verte sans retouche | fix-foundation §3 **et** commentaire dans le fichier | **JUSTIFIÉE** |
| `D2/open-points.test.ts` · `D2/reference-loader.test.ts` | `toHaveLength(6)` → `(8)` ; `n('KYCAR_OUTLIER_FLAG')` 6 → 8 | `D8-09` : cardinalité du vocabulaire, fait mesuré inchangé | fix-foundation §3 + fichiers | **JUSTIFIÉE** |
| `D2/r3-guard.test.ts` · `R-D2-02` | `it.fails` → `it`, **assertions intactes**, + un second cas | `D8-11`/`D8-19` : dette levée dans le commit même (`d3874d9`) ; le garde est **élargi**, jamais relâché (le nouveau cas re-contrôle que `sellerType`/`regionCode`/`postalCodePrefix2` restent autorisés) | fix-foundation §3 + fichier | **JUSTIFIÉE** |
| `D3/dataset-100k.test.ts` · `R-D3-02` | échantillon unique → **médiane de 5 exécutions**, **seuil de 200 ms inchangé** | `D8-22`, explicitement : marge réelle ~10 %, la sonde était un détecteur de charge machine autant que de régression ; une vraie régression déplace les 5 mesures donc la médiane | fix-providers §3 + commentaire au-dessus de l'assertion | **JUSTIFIÉE** (et rejouée hors charge par moi, §2.2) |
| `D4/quantiles-bin.test.ts` | `toEqual` reçoit `iqr: null, coverage: null` | `D8-10` ajoute deux champs à `MetricStats` ; le fait mesuré (à `n = 0` le bloc est **entièrement** nul) est conservé | fix-foundation §3 + fichier | **JUSTIFIÉE** — mais l'assertion **fige aujourd'hui le défaut** : elle passera au rouge le jour où `iqr` sera enfin calculé (§7.1 n° 1) |
| `D4/thresholds-m1m2.test.ts` (2 cas) · `patho/valeurs.test.ts` (3 cas) | « aucun verdict » → « aucun verdict **de détection** » (`detectionVerdicts`), plus l'assertion **positive** des `n` verdicts `INSUFFICIENT_*` | `D8-09` : les 5 sondes décrivaient le moteur d'avant ; elles contredisaient `R-D4-05`, qui mesurait l'absence de verdict comme un **défaut** au regard d'`EX-DATA-85/86/95`. L'intention (aucun faux positif sous `n = 12`, aucun à variance nulle) est **renforcée**, pas affaiblie | fix-engine §3, cinq lignes nommées + commentaires en tête de fichier | **JUSTIFIÉE** (fix-engine a en outre **corrigé** le décompte de la décision : 5 sondes concernées, pas 4) |
| `D5/labels-fr.test.ts` · `R-D5-10` ; `D5/keyboard-band.test.ts` · `R-D5-13` | `it.fails` → `it` | `D8-12` : dettes DR-132 / DR-134 levées dans le même commit | fix-state §4 + fichiers | **JUSTIFIÉE** |
| `D5/registry-scope.test.ts` | `table.size` 76 → **74** | `D8-13` : la table normative d'`EX-SCR-82` est amendée (`zip`/`lat`/`lon` → `EXCLU`), alignée sur `filters-scope.json` ; la boucle `drift` compare **chaque ligne** et n'est pas touchée | commentaire de 4 lignes dans le fichier (commit `ee489ef`, coordinateur) | **JUSTIFIÉE** |
| `D6/effectif-seuils.test.ts` | `available: false` / `'—'` → `available: true` / `[min, max]` | `D-36` / `FV-09` : « — » est explicitement **interdit** sous 12 ; l'ancienne assertion figeait le défaut | fix-screens §4 + fichier | **JUSTIFIÉE** |
| `D6/responsive.test.ts` · `R-D6-10` | assertion **négative → positive** | `DR-143` levée : la grille CSS 4 lignes existe. `REMEDIATION.md` §4 signalait que les deux étaient contradictoires ; `D8-12` tranche | fix-screens §4 + fichier | **JUSTIFIÉE** |
| `D6/export-csv.test.ts`, `fourchette-centrale.test.ts`, `repliement-et-topRestrictive.test.ts`, `ex-scr-132-…`, `D4/helpers.ts`, `D2/provider-contract.test.ts`, `patho/_fixtures.ts`, `patho/{structure,ingestion,volumetrie,bloquants-st}.test.ts`, `D5/band-actions.test.ts` | ajout de `modelCount: null` / `vatDeductible` / `onNarrow` aux fabriques de test | Adaptations **mécaniques** aux champs obligatoires ajoutés par `D8-08`/`D8-10` ; aucune assertion touchée | commentaire d'une ligne dans chaque fabrique (« `D8-10` : `modelCount` devient un champ OBLIGATOIRE … valeur neutre `null` ») | **JUSTIFIÉE** (vérifié fichier par fichier au `git diff`) |
| `D7/ecran-b.test.ts` — fixture de référence | `fixture(1200, 0xb1)` → `withCountryCodes(…, [0, 1])`, plus un cas dédié mono-pays | `D8-25` : le générateur fixe `countryCode = 0` ; `EX-SCR-170`/`D8-06` masque G15 à un seul pays depuis que le moteur fournit la donnée. **Seules les données d'entrée changent**, aucune assertion ; le masquage lui-même est prouvé par un cas séparé | fix-screens-finition §4 + en-tête du fichier + le nouveau cas | **JUSTIFIÉE** |
| `D7/ecran-b.test.ts` — cas `EX-NFR-15`/`EX-SCR-189` | fixtures et assertions reconstruites contre `stats-protocol.ts` | `D8-07` : l'ancien modèle de calcul sur le thread principal **n'existe plus** (source unique) ; il n'y avait plus rien à asserter à l'ancienne | fix-screens §4 | **JUSTIFIÉE** |
| `D7/ecran-d.test.ts` · `R-D7-16` ; `D7/ecran-b.test.ts` · `R-D7-10` | `it.fails` → `it` | `D8-08` / `D8-12` : dettes levées, assertions intactes | fix-screens §4 + fichiers | **JUSTIFIÉE** |
| `D8/shell-static.test.ts` (2 cas) | `<nav aria-label="…">` littéral assoupli ; `R-D8-07` lu sur l'entrée de la pile de bandeaux | `D8-15` (le `nav` porte désormais `id`/`class` : tiroir compact) et `EX-SCR-38` (les bandeaux ne sont plus 5 blocs juxtaposés mais une pile plafonnée). Les faits mesurés — landmark **étiqueté**, date du cache, action « Réessayer » — sont assertés à l'identique | fix-app §4 + fichier | **JUSTIFIÉE** |

**Sondes créées** (10 fichiers) : `D3/dictionary-2.8`, `D9/dictionary-2.8`, `D4/worker-stats-d807`,
`D5/{facet-counts,mmmv-tokens,regime-and-shortcuts,screen-g}`, `D7/histogrammes` (élargi),
`D8/{index-autorepair,outlier-index,shell-wiring-2.8}`. **Aucune n'a d'assertion affaiblie** ;
toutes ont été écrites **rouges d'abord** quand elles portaient un défaut (D-32, §4.3).

**Aucune sonde dont l'assertion aurait été affaiblie sans justification n'a été trouvée.** Les deux
seuls points d'attention sont signalés ci-dessus : `D4/quantiles-bin.test.ts` fige un défaut encore
présent, et `D5/registry-scope.test.ts` a été amendé par le **coordinateur** et non par un
correcteur (la justification est écrite dans le fichier, ce qui satisfait D-31).

### 4.2 Tests E2E modifiés — justification vérifiée

| Fichier · test | Changement | Justification | Verdict |
|---|---|---|---|
| `_helpers.ts` · `P1_EXPECTED` | `{ makes: 112, offers: 2656 }` → `{ makes: 107, offers: 2632 }` | **Le jeu de données a changé, pas l'écran** : `D8-16` fait rejeter à l'ingestion les annonces sans `listingUrl` (152 sur 100 000). fix-app a exécuté le contrôle : le même build, **source d'avant ses commits**, affiche déjà 107/2 632 | **JUSTIFIÉE** (contrôle exécuté et cité) |
| `parcours-p1.spec.ts` · périmètre belge | identifiant lu sur l'attribut `title` et dans le panneau Diagnostic | `EX-SCR-43`/`FV-17` **déplacent** l'information (jeton court + infobulle) ; le fait mesuré (`cy` jamais dans l'URL) est intact | **JUSTIFIÉE** |
| `parcours-p2.spec.ts` · `E2E-07` | locator du tri ancré sur `.kycar-listings-table`, `exact: true` | Le locator non ancré devient **ambigu** dès que l'écran D rend réellement (il capturait le repli « Prix et valeur » du bandeau) ; l'assertion `aria-sort` unique est inchangée | **JUSTIFIÉE** |
| `responsive.spec.ts` · cartes-marques, `E2E-18` ; `parcours-p1.spec.ts` · `E2E-04` | dépliage par le bouton de pied de carte ; lectures passées en `expect.poll` | `D8-04a` : le clic d'en-tête **pose `mmmv`** (c'était le premier des quatre écarts `FV-04`), le dépliage a son propre contrôle (`EX-SCR-122`). `D8-02` : les zones-modèles sont un enrichissement **progressif** (`EX-NFR-9`). Assertions inchangées | **JUSTIFIÉE** |
| 5 fichiers · chemins d'interaction | trois aides partagées (`openFilterSheet`, `applyFilterSheet`, `openNav`) sensibles au régime | `D8-15` : la coquille fournit `regime`, donc `EX-SCR-96/97/98` s'appliquent réellement. Chaque test décrit **le même parcours** ; seul le chemin suit l'exigence | **JUSTIFIÉE** |
| 7 fichiers · **26 `test.fail()` retirés** | chacun remplacé par un commentaire nommant la correction | `D8-17`/`D8-26` : le test qui a révélé l'écart est la preuve, non modifié, rejoué vert avant retrait. J'ai relu les 26 commentaires : chacun nomme sa correction | **JUSTIFIÉE** |
| `responsive.spec.ts` · **`DETTE D8-15` (ajouté)** | nouveau `test.fail()` | Dette produit ratifiée (`EX-SCR-95`) rendue **visible à chaque exécution** plutôt que passée sous silence ; commentaire de 6 lignes citant la décision | **JUSTIFIÉE** |

`tests/e2e/` compte **7 `test.skip` conditionnels**, tous des **inadéquations de plate-forme**
documentées par une raison en clair (`EX-SCR-135` cardinal absent en compact ; `EX-NFR-19`
projection 2D dégradée ; `EX-SCR-209` écran D en cartes ; deux constats propres au régime dégradé).
C'est le régime prévu par `tests/e2e/README.md` ; **aucun `test.skip` ne masque un défaut**.

### 4.3 Discipline « sonde d'échec d'abord » (D-32) — ce que j'ai pu vérifier

Je n'ai pas rejoué les états intermédiaires (les worktrees sont fusionnés et supprimés), mais les
rapports citent la preuve rouge, commande et sortie, et l'historique la corrobore :

| Lot | Preuve rouge citée | Corroboration dans `git log` |
|---|---|---|
| fix-providers | commit **`eef1599`** « failing probes first for D8-08, D8-10, D8-16 and D8-20 » : 9 échecs sur 11 en D3, 13 sur 13 en D9 | Commit distinct, **antérieur** aux commits de correction `638a38d` / `5305a3a` ✔ |
| fix-engine | `git stash push -- src/engine/{kernel,outliers,density}.ts` → `14 failed (14)` ; `git stash pop` → `14 passed (14)` | Sortie citée intégralement, sonde renforcée avant mesure (le seul cas trivialement vrai) ✔ |
| fix-screens | `EX-SCR-176` : rouge à l'écriture (1 échec / 34), vert après correction sans toucher l'assertion | ✔ |
| fix-app | `index-autorepair.test.ts` **3 rouges sur 5** ; `outlier-index.test.ts` **2 rouges sur 5** ; `client.structured-copy.test.ts` : le cas « AVEC liste de transfert » **atteste le défaut** | ✔ |
| fix-screens-finition | sondes `EX-SCR-149` / `EX-SCR-159` écrites d'abord, rouges faute d'implémentation | Non corroborable par un commit séparé (même commit) — **hypothèse acceptée sur la déclaration écrite** (E4) |

---

## 5. Bijection dettes ↔ marqueurs d'échec

### 5.1 `it.fails` restants dans `tests/review/`

```
$ grep -rn 'it\.fails\|test\.fails' tests/review/ src/
tests/review/D9/capabilities-mode1.test.ts:89:  it.fails('R-D9-21 — le provider n’est câblé nulle part …
tests/review/D2/reference-loader.test.ts:184:  it.fails('R-D2-16 — EX-DATA-54 : les exceptions communales priment sur les plages', …
```

**Exactement deux**, exactement les attendus :

| Sonde | Dette | Nature | Décision |
|---|---|---|---|
| `R-D9-21` | **DR-104** — `TweedehandsDataProvider` non câblé | **Externe** : `AC-01` (accès à la source réelle) non levée, question juridique hors dépôt | `D-18` / `D-28`, maintenue par `D8-18` |
| `R-D2-16` | **DR-112** — `postal-regions-be.json` absent | **Externe** : source officielle Statbel/bpost, `E5` interdit de la collecter en session | §6.5 de 2.6, maintenue par `D8-18` |

Les six autres `it.fails` de 2.6 (`R-D2-02`, `R-D4-05`, `R-D5-10`, `R-D5-13`, `R-D7-10`,
`R-D7-16`) ont été **retournées en `it`** par le correcteur qui a levé leur dette, dans le commit
même de la correction (règle `D8-19`), sans qu'aucune de leurs assertions soit touchée. Les deux
restantes échouent réellement — sinon `it.fails` rendrait la suite rouge, et `npm test` est vert :
les deux dettes sont **vivantes et mesurées**, pas éteintes.

**Contrôle inverse** : aucune dette externe ne reste sans marqueur **quand une sonde existe**. O15
(`bodyTypes`), `EX-SRCH-12` et `EX-SCR-9` n'ont pas de sonde d'échec — pour la même raison qu'en
2.6 : il n'y a rien à faire échouer (une donnée absente, une sémantique non tranchable localement,
un champ hors périmètre R3). O15 est en revanche **mesurée positivement** : `R-D2-17` (index
disponible et vide) et `R-D3-20`/`R-D9-31` (`bodyType` déclaré non appliqué en mode 2) sont vertes.

### 5.2 `test.fail()` restants dans `tests/e2e/`

```
$ grep -rn 'test\.fail(' tests/e2e/
tests/e2e/responsive.spec.ts:211:    test.fail();
```

**Exactement un**, à la ligne attendue (~211), dans le test
`DETTE D8-15 — les réglages « Assainissement KYCAR » ne sont offerts nulle part (EX-SCR-95)`.
Il n'est conditionné par aucun régime : il s'exécute donc **dans les trois projets**
(desktop, tablet, mobile) → **3 échecs attendus** dans la recette, ce que le décompte du §2.1
confirme. Son en-tête cite la décision (`FIX-LEAD-DECISIONS-2.8.md` §A, `D8-15`), le motif (« hors
budget, dette produit ») et la condition de retour au vert.

**Bijection tenue** : 1 marqueur E2E ↔ 1 dette (`D8-15`) ; 2 marqueurs Vitest ↔ 2 dettes externes
(`DR-104`, `DR-112`). Aucun marqueur d'échec sans dette nommée ; aucune dette nommée sans son
marqueur quand une sonde existe.

### 5.3 Absence de `skip` (D-49)

`grep -rn 'it\.skip\|test\.skip\|describe\.skip\|it\.todo\|test\.todo\|\.only(' tests/review/ src/`
→ **aucune occurrence**. Les 7 `test.skip` de `tests/e2e/` sont des inadéquations de plate-forme
conditionnelles, motivées en clair (§4.2). **Aucun `skip` n'a été introduit en 2.8 pour masquer un
défaut.**

---

## 6. Dettes restantes

### 6.1 Dettes externes (les seules admises à G7 avec `D8-15`) — `D8-18`

| Dette | Exigences | Raison (hors dépôt) | Condition de levée | Marqueur |
|---|---|---|---|---|
| **DR-104 / AC-01** | `EX-DATA-107` et la mise en service du provider réel | Hypothèse d'accès à la source réelle **non levée** ; décision juridique, hors du dépôt. `D-28` exige en outre un marqueur `sampleBiased` avant tout câblage | Statuer sur `AC-01` ; si levée, câbler `main.tsx` (point d'injection prêt, `D-29`) puis traiter `DR-127…130` | `R-D9-21` (`it.fails`) |
| **DR-112 / Statbel-bpost** | `EX-DATA-53`, `54`, `126` | La table communale officielle est une **source externe** que `E5` interdit de collecter en session | Fournir `data/reference/postal-regions-be.json` hors session | `R-D2-16` (`it.fails`) |
| **O15 / `bodyTypes`** | `EX-DATA-115bis`, `EX-SCR-221` | La donnée « carrosseries par modèle » n'existe dans **aucun** référentiel disponible | Fournir la donnée. Mitigation livrée en 2.8 (`D8-20`) : le filtre est déclaré non appliqué et **dit** à l'utilisateur | `R-D2-17`, `R-D3-20`, `R-D9-31` (vertes, mesurent l'état honnête) |
| **`EX-SRCH-12`** | `EX-SRCH-12` | Sémantique `eq` de la source, non tranchable localement (`E5` interdit la requête live) — point ouvert `O7` | Observation sur la source réelle | — (rien à faire échouer) |
| **`EX-SCR-9`** | `EX-SCR-9` | `NNxx` non affichable : périmètre R3 (décision `D-14`) | Amender `EX-SCR-9` ou le périmètre R3 | — |

### 6.2 Dette **produit** ratifiée — `D8-15`

**`EX-SCR-95`, réglages « Assainissement KYCAR ».** Ce n'est **pas** une dette externe : c'est une
**décision explicite du fix-lead**, datée du 2026-09-08, consignée en `FIX-LEAD-DECISIONS-2.8.md`
§A `D8-15` (« panneau de préférences sans effet sur une valeur affichée, hors budget »), documentée
par fix-docs dans `draft-screens.md` l.1124, et rendue **visible à chaque exécution** de la recette
par un `test.fail()` annoté. Elle est admise à G7 au même titre que les dettes externes, **parce que
la décision existe et qu'elle est écrite** — pas parce que la cause serait hors dépôt.

*Note de traçabilité* : `D8-15` citait littéralement `EX-SCR-97/98` ; fix-docs a établi que ces deux
identifiants portent sur le **régime compact**, corrigé par ailleurs dans la même ligne de décision,
et que le panneau d'assainissement est `EX-SCR-95`. La rectification a été ratifiée par le
coordinateur au commit `22719f1`. **Vérifié : la correction d'identifiant est juste** — `EX-SCR-96`,
`97`, `98` sont bien implémentés (sondes `R-D5-30`…`R-D5-34`, E2E `responsive.spec.ts` sur les trois
projets), `EX-SCR-95` seul ne l'est pas.

### 6.3 Dettes **internes non déclarées** — ce qui bloque S4

Huit exigences (§7.1) sont dans un état qui n'est **ni** corrigé, **ni** couvert par une décision.
Ce ne sont pas des dettes : ce sont des **écarts ouverts**. Les nommer en dette relève du fix-lead,
pas de moi.

---

## 7. Écarts, réserves et recommandations pour 2.9b

### 7.1 Écarts OUVERTS (aucune correction, aucune dette motivée)

**1. `MetricStats.iqr` et `MetricStats.coverage` restent `null` — résidu de `DR-122` / `D8-10`.**
Preuve : `grep -n 'iqr:' src/engine/quantiles.ts` → quatre littéraux `null` (l. 106, 137, 180, 255),
dont un commentaire qui **désigne nommément** les deux agents (« … de fix-engine (`iqr = p75 − p25`)
et de fix-providers (`coverage = n_m / N`) »). Chacun a renvoyé à l'autre : fix-providers §2 (« ce
résidu tombe entre deux clusters ») et fix-engine §6.4 (« hors mandat »). Exigences touchées :
`EX-DATA-64` (le bloc de 13 valeurs) et `EX-DATA-61` (`metricCoverage`), toutes deux `PARTIELLE` en
2.7 sous la dette `DR-122` — que `D8-10` avait précisément pour objet de lever. **Aucune valeur
affichée n'est fausse** (les deux champs sont `null`, donc « non calculé », jamais un chiffre
inventé) ; `GroupStatEntry` publie de son côté un `iqr` et une `coverage` **calculés**
(`R-D8-07-01`). *Travail restant, chiffré par fix-providers §2* : deux expressions dans
`metricStatsFromCounts` et `exactStatsBySort` (les quantiles de type 7 sont déjà calculés dans la
même expression), plus un paramètre `selectionCount` optionnel pour `coverage` ; et l'amendement,
dans le même commit, de `tests/review/D4/quantiles-bin.test.ts`, dont le `toEqual` fige aujourd'hui
`iqr: null`.

**2. `EX-SCR-174` et `EX-SRCH-14` : les deux sondes « à écrire en 2.8 » n'ont pas été écrites.**
`FINAL-VERIFICATION` §3.2(b) les classe explicitement « comportements non atteints, **à sonder** » —
c'est-à-dire un travail de 2.8, pas une mesure de 2.9. Preuve : `grep -rn 'EX-SCR-174\|EX-SRCH-14'
tests/` → **0**. `EX-SCR-174` (en-tête « aucune offre » + bloc `EX-SCR-26` sur l'écran B) et
`EX-SRCH-14` (changer de marque vide le modèle et redirige vers `/marche?mmmv=<make>|||`) restent
`PARTIELLE`, non vérifiées. La seconde est d'autant plus regrettable que `D8-04` a **précisément**
retravaillé la mécanique `mmmv`.

**3. Les cinq « mineurs isolés » de `FINAL-VERIFICATION` §3.2(d) n'ont été attribués à personne.**
`grep -rn 'EX-DATA-23\|EX-SCR-17\|EX-SCR-101\|EX-SCR-153\|EX-SCR-212' reports/remediation-2.8/`
→ **0 occurrence** dans les huit rapports ; ils ne figurent pas non plus dans les décisions
`D8-01…D8-26`. État vérifié dans le code à `90a9eea` :

| Exigence | Écart 2.7 | Contrôle exécuté | Toujours ouvert ? |
|---|---|---|---|
| `EX-DATA-23` | tolérance du parsing `firstRegistrationYearMonth` non prouvée, `FIRST_REG_UNPARSEABLE` non sondé | `grep -rln FIRST_REG_UNPARSEABLE tests/ src/` → **seulement** `src/types/vocabularies.ts` | **OUI** |
| `EX-SCR-17` | bascule d'échelle log de G7 absente | `grep -c 'onToggleLog\|log' src/screens/distribution/AdditionalGraphs.tsx` → **0** | **OUI** |
| `EX-SCR-101` | filtre devenu invalide après changement de snapshot non signalé | `grep -rn 'sans effet' src/` → aucune occurrence de marquage utilisateur | **OUI** |
| `EX-SCR-153` | alignement G4a sur les bornes/buckets de G1 non prouvé | `grep -n buckets src/screens/distribution/{scatter-model.ts,ScatterCloud.tsx}` → **0** | **OUI** |
| `EX-SCR-212` | carte de l'écran E sans bouton « Ouvrir » nommé, sans description de filtres ni périmètre | aucun correcteur ne cite l'écran E | **OUI** |

**4. `FV-06` n'est corrigé qu'en mode 2.** fix-app §3 expose le raisonnement (les facettes exigent
un jeu **chargé**, ce qu'`O17` interdit en mode 1) et conclut « hors budget de ce lot, **à instruire
en 2.9** ». C'est une décision de **correcteur**, pas de fix-lead : aucune ligne `D8-xx` ne la
ratifie. `EX-SCR-65`, `89` et `90` restent donc partielles en mode 1. À noter au crédit de la
correction : rien n'est inventé — en l'absence de facettes, `CheckboxList` ne rend **aucune**
parenthèse, jamais un `(0)` par défaut.

### 7.2 Arbitrages de correcteurs restés en attente de ratification

1. **Dénominateur de `coverageWarning` sur une source d'agrégats** (fix-providers §4.2) : l'effectif
   de l'échantillon au lieu de `listingCount`. Le motif est solide et mesuré (à la lettre,
   `EX-DATA-17` rendrait l'avertissement **toujours vrai**, donc muet), mais l'annexe A n'a pas été
   amendée en ce sens. **À trancher, avec une phrase dans `EX-DATA-17`.**
2. **`co2Source` du provider synthétique figé à `UNKNOWN`** et déclaré (`unknownCountByField.co2Source
   = listingCount` + `coverageNote`), faute d'une colonne dans l'interface gelée (fix-providers §4.3).
   L'écart est **dit**, ce qui vaut mieux qu'un champ muet, mais `EX-DATA-35` n'est tenue qu'à moitié.
3. **`EX-SCR-159` livrée en version bornée** (fix-screens-finition §2) : légende continue atténuée
   au lieu des pastilles et valeurs littérales exactes de `draft-screens.md` §6.4 à `n ≤ 3`, et pas
   de recentrage à `n = 1`. Le seuil et la désactivation du brossage, eux, sont conformes.
4. **`EX-DATA-64` à la lettre** : `MetricStats` publie 12 des 13 valeurs, `count` étant porté par le
   conteneur (fix-foundation §5.6). Cumulé avec l'écart n° 1 du §7.1, le bloc en publie **10 sur 13**.
5. **`zipr` reste `RETENU`** alors que sa dépendance `zip` passe `EXCLU` (fix-docs §2 n° 2) ;
   **`ARBITRAGES-req-lead.md` porte encore « 77 retenus »** (fix-docs §2 n° 4). Sans effet
   d'exécution, mais l'un des deux documents ment sur le décompte.

### 7.3 Ratification demandée par fix-app (§5 point 5) — mon avis

fix-app a corrigé **deux fichiers hors de son périmètre nominal**, tous deux dans
`src/components/filters/` (périmètre de fix-state, dont le worktree était déjà fusionné et fermé) :

| Correction | Fichier | Preuve exécutée | Avis |
|---|---|---|---|
| Débordement horizontal du **régime intermédiaire** à 768 px (contrôles à largeur intrinsèque face à 5 pistes de ~134 px) | `filter-band.css`, bloc du **seul** régime `intermediaire` | E2E `responsive.spec.ts::CONSTAT E2E-19`, projet **tablet** : `scrollWidth` du document 836 → **768** pour `clientWidth` 768, sur les surfaces A, B, C, E, F. Rejoué vert dans ma recette | **RATIFIABLE** |
| `EX-NAV-11` non éprouvé sur l'**application différée** de la feuille compacte (`forcePushSelection` réservé aux retraits : une application pouvait dépasser 2 000 caractères sans refus) | `FilterBand.tsx`, `handleApplyCompactSheet` | E2E `partage-url.spec.ts::EX-NAV-11`, projet **mobile** : le bandeau « limite d'URL atteinte, retirez un filtre pour en ajouter un autre » apparaît, l'URL est **inchangée** (`body=` absent) et la feuille reste ouverte (le brouillon n'est pas perdu). Rejoué vert | **RATIFIABLE** |

**Motivation de l'avis.** Les deux corrections sont (a) **causées** par le mandat de fix-app —
c'est le câblage `regime` de `D8-15` qui rend `EX-SCR-96/97` atteignables pour la première fois et
met les deux défauts au jour ; (b) **bornées** au seul régime concerné, donc sans effet sur les
régimes déjà éprouvés (desktop 14/14 inchangé) ; (c) **prouvées par un test E2E qui échouait avant**
et qui est vert après ; (d) **attribuées en commentaire** dans le code (« complété par fix-app
(D8-15), hors de son périmètre nominal »). Les laisser aurait signifié livrer une exigence normative
(`EX-NAV-11`) en défaut avec un test rouge. **Je recommande la ratification**, avec une réserve de
forme : la règle des périmètres disjoints a été enfreinte parce que plus aucun agent ne tenait
`src/components/filters/` — c'est un défaut de **séquencement**, à corriger en 2.8bis/2.9 en gardant
un correcteur ouvert sur chaque répertoire jusqu'à la fin de la vague F2.

### 7.4 Câblage `onClearFilter` (commit `90a9eea`, coordinateur) — couverture manquante

Le commit `90a9eea` ajoute `onClearFilter` à `DistributionScreen.tsx` et le passe aux trois
histogrammes G1–G3 (`EX-SCR-149`, double-clic = retrait du filtre de la métrique). **Aucune preuve
ne le couvre :**

```
$ grep -rn 'onClearFilter' tests/
tests/review/D7/histogrammes.test.ts:173  (fabrique de rendu)
tests/review/D7/histogrammes.test.ts:182  (prop passée au composant)
tests/review/D7/histogrammes.test.ts:267  'double-clic dans la zone de tracé retire le filtre …'
```

Ces trois lignes prouvent le **composant `Histogram`** appelé directement, avec la prop fournie par
le test. Elles ne prouvent **pas** que `DistributionScreen` la fournit : `tests/review/D7/
ecran-b.test.ts` ne cite pas `onClearFilter`, `tests/review/D8/shell-wiring-2.8.test.ts` a été écrit
**avant** ce commit, et aucun test E2E n'exerce le double-clic (`grep -rn 'dblclick' tests/e2e/`
→ 0). C'est le seul point où un statut `CORRIGÉ` de la phase repose sur une lecture de code et non
sur une exécution.

**Test minimal manquant** — un cas à ajouter dans `tests/review/D7/ecran-b.test.ts`, sur le modèle
des cas `EX-SCR-176` déjà présents (rendu VNode, `environment: 'node'`, aucun DOM) :

```ts
it('EX-SCR-149 — DistributionScreen câble onClearFilter sur G1–G3 : le double-clic RETIRE le filtre de la métrique', () => {
  const applied: SelectionInput[] = [];
  const tree = render(<DistributionScreen {...baseProps} onApplyFilters={(p) => applied.push(p)} />);
  for (const [graphId, metric] of [['G1', 'price'], ['G2', 'mileage'], ['G3', 'year']] as const) {
    const hist = findByGraphId(tree, graphId);          // aide déjà utilisée par les cas EX-SCR-176
    expect(hist.props.onClearFilter, `${graphId} sans onClearFilter`).toBeTypeOf('function');
    hist.props.onClearFilter(metric);
  }
  // `clearMetricFilters` pose `undefined` sur les deux bornes de la métrique — un RETRAIT, jamais une valeur
  expect(applied).toEqual([
    clearMetricFilters('price'), clearMetricFilters('mileage'), clearMetricFilters('year'),
  ]);
  expect(applied.every((p) => Object.values(p).every((v) => v === undefined))).toBe(true);
});
```

Écrit **avant** relecture du câblage, il aurait été rouge à `3435456` et vert à `90a9eea` : c'est
exactement la preuve que `D-32` demande.

### 7.5 Recommandations pour 2.9b (`acceptance`, Fable/max)

1. **Ne pas lire `G7` comme franchie** : la recette 2.9b statue sur le navigateur (`G8`), pas sur la
   couverture des exigences. Les huit écarts du §7.1 doivent être soit corrigés, soit mis en dette
   par une décision écrite, **avant** la clôture.
2. **Rejouer `EX-NFR-9` sur le build final** : le plancher de 400 ms + `requestIdleCallback` de
   `D8-02` est un compromis de perf, mesuré sur une seule machine ; la marge annoncée est de
   ~490 ms sur 2 000 ms, avec une variance qui n'existait pas avant (écart-type de 5 → 240 ms sans
   le plancher). Publier la **série complète**, pas la médiane seule.
3. **Prononcer le verdict axe-core sur la surface D**, désormais possible (`E2E-13` était « non
   prononçable » en 2.9a parce que l'écran ne rendait pas).
4. **Statuer les 15 exigences §3.2(b)** (`EX-SCR-21`, `25`, `56`, `87`, `100`, `124`, `127`, `171`,
   `180`, `181`, `186`, `190`, `199`, `EX-NFR-6`, `EX-NFR-14`) : elles attendent 2.9b depuis 2.7 et
   la suite E2E les exerce désormais.
5. **Vérifier que `reports/e2e/results.json` n'est pas commité par accident** : il est **suivi par
   git** et régénéré à chaque exécution (§9).
6. **Refaire tourner `R-D3-02` hors charge** : marge réelle ~10 % même avec la médiane de 5.

---

## 8. Verdict de la porte G7

> **G7 après 2.8** — « zéro `NON COUVERTE`, zéro `PARTIELLE` sans dette motivée ; dettes restantes
> exclusivement externes » (`PLAN-2-app-build.md`, table des points de contrôle bloquants).

### **PORTE G7 : NON FRANCHIE.**

**Ce qui est acquis, et qui est considérable.** Les deux BLOQUANTS de la vérification finale sont
corrigés et prouvés en navigateur : le parcours cible 2 se termine, l'écran D rend, le nuage G4 est
encré, « 0 % particuliers » est redevenu 37 %, « 0 modèles » est redevenu 908. Les 24 constats `FV`
et les 26 constats `E2E` sont traités ; 26 `test.fail()` ont été retirés après rejeu vert ; huit des
neuf dettes 2.6 déclarées levables ont été levées, chacune par la sonde qui l'avait révélée,
retournée en `it` sans que son assertion soit touchée ; le texte v1.1 est passé en v1.2 avec ses
décomptes vérifiés contre `filters-scope.json` ; les cinq portes locales sont vertes et tous les
budgets sont tenus. La règle de preuve de `PLAN-2` §2.6 S2 a été respectée partout où j'ai pu la
contrôler, et la discipline « sonde rouge d'abord » est corroborée par un commit dédié
(`eef1599`) et par des sorties citées.

**Ce qui manque, et pourquoi cela suffit à fermer la porte.** G7 ne mesure pas l'effort : elle
mesure l'**absence d'écart non décidé**. Or huit exigences `PARTIELLE` de la matrice 2.7 traversent
la phase 2.8 sans que personne ne les corrige ni ne les mette en dette :

- `EX-DATA-61` et `EX-DATA-64` — résidu de `DR-122` que `D8-10` avait pour objet de lever, et que
  les deux correcteurs désignés se sont mutuellement renvoyé (§7.1 n° 1) ;
- `EX-SCR-174` et `EX-SRCH-14` — les deux sondes que 2.7 demandait d'écrire **en 2.8**, non écrites
  (§7.1 n° 2) ;
- `EX-DATA-23`, `EX-SCR-17`, `EX-SCR-101`, `EX-SCR-153`, `EX-SCR-212` — les cinq « mineurs isolés »
  de `FINAL-VERIFICATION` §3.2(d), absents des 26 décisions `D8-xx` comme des huit rapports (§7.1
  n° 3), et vérifiés toujours ouverts dans le code.

S'y ajoute `FV-06`, corrigé en mode 2 et renvoyé à 2.9 **par un correcteur** sans décision de
fix-lead (§7.1 n° 4). Aucun de ces écarts n'est externe ; aucun n'est motivé par une décision
écrite. Le critère **S4** (« dettes restantes exclusivement externes ») et le critère **S1**
(« zéro `PARTIELLE` sans dette motivée ») sont donc l'un et l'autre en défaut, et la porte avec eux.

À cela s'ajoute une réserve sur **S2** : un statut `CORRIGÉ` de la phase — le câblage
`onClearFilter` du commit `90a9eea` — ne repose sur **aucune exécution** (§7.4). Conformément à ma
consigne (« un statut CORRIGÉ sans preuve exécutée est un OUVERT »), je le compte comme une
**couverture manquante**, avec le test minimal qui la comblerait.

**Ce qu'il faut pour franchir G7.** Rien de lourd, et rien qui touche à l'architecture :

1. Calculer `MetricStats.iqr` et `MetricStats.coverage` (deux expressions + un paramètre), ou
   requalifier `EX-DATA-61`/`64` par une décision écrite ;
2. écrire les deux sondes `EX-SCR-174` et `EX-SRCH-14` ;
3. traiter ou mettre en dette motivée les cinq mineurs isolés ;
4. ratifier — ou refuser — le renvoi de `FV-06` mode 1 à 2.9, par une ligne `D8-xx` ;
5. ajouter le cas `EX-SCR-149` du §7.4 ;
6. trancher les cinq arbitrages en attente du §7.2 (dont deux amendements d'une phrase à l'annexe A).

Les points 1 à 5 sont du travail de correcteur borné ; le point 6 est du travail de fix-lead. Une
fois ces six points soldés, **et sous réserve que la recette 2.9b confirme les mesures navigateur**,
la porte G7 sera franchissable avec, pour seules dettes, les cinq dettes **externes** de `D8-18` et
la dette **produit** `D8-15` — ce que S4 admet explicitement.

---

## 9. Effet de ma vérification sur l'arbre

`reports/e2e/results.json` est **suivi par git** (`git ls-files reports/e2e/` le liste) et il est
**régénéré** par `npm run test:e2e`. **Il a changé** : `md5` avant `f112709890b3346b4178c8283bda44bc`, après `87ca978db1a4496ba79015ca50719919` ; `git status --short` affiche `M reports/e2e/results.json`. Je ne l'ai **ni restauré ni commité** : la décision revient au coordinateur (le contenu est la trace d'exécution de MA recette, pas celle de 2.9a). Le second fichier non suivi est ce rapport (`?? reports/REMEDIATION-2.8.md`).

Aucun autre fichier n'a été modifié par mes exécutions, à l'exception de `dist/` (non suivi,
regénéré par `npm run build`) et des artefacts Playwright habituels. Je n'ai créé que ce rapport.

---

## 10. Résumé (12 lignes)

1. **Porte G7 : NON FRANCHIE.** S1 **non atteint**, S2 **atteint sauf un point**, S3 **atteint**,
   S4 **non atteint**.
2. Portes locales rejouées, toutes vertes : `build` 0/0 · `lint` vert · `size` **112,49 / 300 Kio** ·
   `npm test` **675 + 953** · `test:perf` **7/7** · `test:e2e` **237 tests, 225 verts + 3 échecs attendus, 9 sautés, 0 échec inattendu, exit 0** (9 min 24 s).
3. Budgets tenus : `EX-NFR-5` p95 **181,1 ms** (élagué 97,4) · `EX-NFR-7` 3,91 ms · `EX-NFR-8` 100 % ·
   `EX-NFR-9` médiane **1 515 / 1 521 / 1 497 ms** sur les 3 projets (budget 2 000) · `EX-DATA-110bis` 20,7 ms.
4. **24 constats `FV` sur 24 traités** (dont les 2 BLOQUANTS `FV-01`/`FV-02`, prouvés en navigateur) ;
   **26 constats `E2E` sur 26 corrigés**, 26 `test.fail()` retirés après rejeu vert.
5. **8 dettes 2.6 sur 9 levées** par la sonde qui les portait, retournée en `it` sans que son
   assertion bouge (`R-D2-02`, `R-D4-05`, `R-D5-10`, `R-D5-13`, `R-D7-10`, `R-D7-16`) ; la 9ᵉ,
   `DR-122`, n'est levée **qu'en partie**.
6. **Bijection tenue** : 2 `it.fails` = 2 dettes externes (`R-D9-21`/DR-104, `R-D2-16`/DR-112) ;
   1 `test.fail()` = 1 dette produit (`D8-15`/`EX-SCR-95`, 3 échecs attendus, un par projet) ;
   **0 `skip`** introduit (D-49 tenue).
7. **43 fichiers de `tests/review/` et 9 de `tests/e2e/` modifiés** : chaque assertion changée porte
   sa justification, dans le rapport de son correcteur **et** dans le fichier. **Aucune sonde
   affaiblie sans justification.**
8. **Écart bloquant n° 1 — 8 exigences `PARTIELLE` ouvertes, sans dette** : `EX-DATA-61`, `EX-DATA-64`
   (résidu `DR-122`, renvoyé d'un correcteur à l'autre), `EX-SCR-174`, `EX-SRCH-14` (sondes 2.8 non
   écrites), `EX-DATA-23`, `EX-SCR-17`, `EX-SCR-101`, `EX-SCR-153`, `EX-SCR-212` (mineurs isolés
   attribués à personne). Plus `FV-06` mode 1, renvoyé à 2.9 sans décision.
9. **Écart n° 2 — une correction sans preuve** : le câblage `onClearFilter` de `90a9eea`
   (`EX-SCR-149`) n'est couvert par aucune sonde ni test E2E ; le test minimal est écrit au §7.4.
10. **Les deux corrections hors périmètre de fix-app sont RATIFIABLES** : régime intermédiaire du
    bandeau (E2E-19 tablet, `scrollWidth` 836 → 768) et `EX-NAV-11` sur l'application différée
    (partage-url, projet mobile) — causées par son mandat, bornées, prouvées, attribuées.
11. **Dettes restantes** : 5 externes (`DR-104`, `DR-112`, O15, `EX-SRCH-12`, `EX-SCR-9`) + 1 dette
    **produit** ratifiée (`D8-15`/`EX-SCR-95`) + 5 arbitrages de correcteurs en attente (§7.2).
12. Rapport : `reports/REMEDIATION-2.8.md` — seul fichier écrit. Aucun `src/`, `tests/`, `docs/` ni
    autre rapport touché ; aucun commit, aucun push. **`reports/e2e/results.json` (suivi par git) a changé** — régénéré par ma recette, laissé tel quel pour arbitrage du coordinateur.
