# REMEDIATION — vérification finale de la phase 2.6

Agent `fix-verify` · modèle Opus · effort high · 2026-09-08 · branche `claude/kycar-project-ffcplk`
· arbre principal `/home/user/KYCAR`.

**Indépendance (R5).** Je n'ai corrigé aucun constat. Je n'ai modifié ni `src/`, ni `tests/`, ni
`docs/` ; ce fichier est le seul livrable. Aucun commit, aucun accès réseau (E5), aucune question
posée (E3).

**Sources lues** : `docs/plans/PLAN-2-app-build.md` §2.6 · `reports/DEV-REVIEW.md` (§1, §3 les
160 constats `DR-001…DR-160`, §5.1 O13–O17, §6.5, §7) · `reports/remediation/FIX-LEAD-DECISIONS.md`
(D-01…D-51) · les huit rapports de correcteurs (`fix-foundation`, `fix-engine`, `fix-providers`,
`fix-state` **§8 comprise**, `fix-screens`, `fix-docs`, `fix-app`, `fix-residual`) · `CLAUDE.md` §5.

**Tout ce qui est chiffré ci-dessous a été rejoué par moi**, commandes et extraits cités.

> **Révision 2 (2026-09-08, après la passe de finition).** Ma première vérification laissait deux
> constats `OUVERT` (§7) : le résidu MAJEUR de `DR-060` et `DR-139`. Les deux ont été livrés depuis
> (`949bba6`, `c24f1e4`, `fa6e83a`). J'ai **tout rejoué**, y compris la preuve que les trois
> nouvelles sondes étaient bien **rouges avant** la correction (§3.1). Le rapport ci-dessous est
> intégralement remesuré ; **il n'y a plus aucun constat ouvert**.

---

## 0. Commandes rejouées et leurs sorties

```
$ git log --oneline -6
e26cfa5 Closure docs: final counts (798 review probes, 11 consigned debts incl. 3 MAJEUR)
fa6e83a Coordinator: wire onSaveSearch from the shell to FilterBand (DR-139, EX-SCR-94)
5319b29 Document the DR-060/DR-139 finishing pass in fix-state.md
c24f1e4 Finish DR-139: EX-SCR-94 save-search button and EX-SCR-78 counter
949bba6 Finish DR-060 residual: screen G clear-search, empty state, windowing
e40c025 Phase 2.6: independent verification report (REMEDIATION.md) and O15 journal line
$ git status --short
(sortie vide — arbre propre)

$ npm run build
> tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.worker.json && vite build
✓ 139 modules transformed.
dist/assets/aggregation.worker-DxWTsNLS.js   29.54 kB
dist/assets/index-Duw18Twg.css               10.98 kB │ gzip:  2.54 kB
dist/assets/index-BSSmQp_l.js               277.11 kB │ gzip: 90.63 kB
✓ built in 1.10s
BUILD_EXIT=0                             → 0 erreur, 0 avertissement

$ npm run lint
> eslint .
(sortie vide)                            → LINT_EXIT=0

$ npx tsc --noEmit -p tsconfig.review.json
(sortie vide)                            → TSC_EXIT=0

$ npm run size
[size] initial bundle (static from entry) - EX-NFR-10:
     88.50 KiB  assets/index-BSSmQp_l.js  (index.html)
[size] chunks shipped outside the manifest graph (worker) - EX-NFR-10:
     10.63 KiB  assets/aggregation.worker-DxWTsNLS.js  (hors manifest)
[size] no deferred (dynamically-imported) chunk yet - EX-NFR-11 not applicable in D1.
[size] budgets: initial 99.13/300 KiB gzip, deferred 0.00/400 KiB gzip.
[size] OK: within budget.

$ npm test          # = vitest run && vitest run --config vitest.review.config.ts
 Test Files  54 passed (54)          ← suite unitaire
      Tests  615 passed (615)
 Test Files  78 passed (78)          ← suite des sondes de revue (promue par D-49)
      Tests  798 passed (798)
```

Les lignes `[size] FAIL: initial bundle 310.12 / 350.15 / 560.21 KiB …` et
`[size] FAIL: deferred bundle 410.14 KiB …` émises pendant la suite de revue proviennent des sondes
D1 (`tests/review/D1/bundle-size-guard.test.ts`) qui éprouvent la garde `EX-NFR-10`/`EX-NFR-11` sur
des manifestes **factices** ; ce ne sont pas des échecs (le fichier rend `Tests 6 passed (6)`).

```
$ npx vitest run --config vitest.review.config.ts tests/review/D5
 Test Files  11 passed (11)   Tests  117 passed (117)
   dont screen-g.test.ts 18 · band-actions.test.ts 9 · keyboard-band.test.ts 16 · labels-fr 9 …

$ npm run test:perf                      # les deux bancs, une seule exécution
[perf recalc] N=100000 runs=100 : p50=150.2ms p95=172.5ms max=182.7ms
                                   — cible EX-NFR-5 p95≤200ms : TENUE
[perf recalc élagué] plus grande marque (m=9283) : p50=48.1ms p95=56.8ms max=65.4ms
[perf facettes] 8 filtres : p50≈19ms p95≈22ms                       (cible EX-NFR-4bis ≤ 100 ms)
[élagage] modèle 51859:75836 : m=8, pruned=true, facteur N/scannedCount = 12500×
[EX-NFR-7] points=5000 p50=1.19ms p95=2.84ms                        (cible ≤ 500 ms p95)
[EX-NFR-8] frames=8371 windows=91 failing=0 okRatio=100.0% minFpsInstant=373
                                                                    (cible ≥ 30 img/s sur ≥ 95 %)
 Test Files  2 passed (2)   Tests  7 passed (7)
```

```
$ npx vitest run --config vitest.review.config.ts --reporter=json --outputFile=…/verify2.json
suites 317 · tests 798 · passed 798 · failed 0 · pending 0 · todo 0 · success true
statuses {"passed":798}
```

```
$ npx vitest run --config vitest.review.config.ts tests/review/D3/dataset-100k.test.ts
[rev-D3] EX-NFR-1 : total = 17.19 Mio (colonnes 6.77 + texte 10.41) ; 180.2 o/ligne   (≤ 25 Mo)
[rev-D3] EX-NFR-3 : sérialisé = 17.19 Mio → gzip = 5.45 Mio (marge 9.2 %)             (≤ 6 Mo)
```

---

## 1. Synthèse chiffrée

### 1.1 Constats par sévérité × statut

| Sévérité | Total | CORRIGÉ | DETTE consignée | OUVERT | Autre |
|---|---|---|---|---|---|
| **BLOQUANT** | 18 | **18** | 0 | **0** | 0 |
| **MAJEUR** | 86 | **83** | **3** (DR-034/D-17, DR-082/D-38, DR-104/D-18) | **0** | 0 |
| **MINEUR** | 56 | 47 | **8** | **0** | 1 `CONFORME — consigné` (DR-142) |
| **Total** | **160** | **148** | **11** | **0** | **1** |

**Aucun constat ouvert.** Les deux points que ma révision 1 signalait au §7 — le résidu MAJEUR de
`DR-060` et `DR-139` (MINEUR) — sont livrés, prouvés par trois sondes neuves écrites **rouges
d'abord** (D-32), et rejoués verts ici (§2, §3.1). Les 11 dettes restantes sont toutes consignées par
une décision `D-xx` ou par `DEV-REVIEW` §6.5 (§4).

### 1.2 Sondes de revue

| Mesure | Valeur rejouée |
|---|---|
| Sondes exécutées (`vitest.review.config.ts`) | **798** dans **78 fichiers** |
| Vertes | **798 / 798** (`success: true`, `numFailedTests 0`, `statuses {"passed":798}`) |
| Dont converties en `it.fails` annotées (D-49) | **8** — elles échouent réellement à l'intérieur et *passent* de ce fait ; c'est la preuve exécutable que les 8 dettes existent toujours |
| Sondes rouges non couvertes par une dette | **0** |
| `it.skip` / `it.todo` / `describe.skip` / `.only` dans `tests/review` et `src` | **0** (grep exhaustif → aucune occurrence) |
| Écart avec la phase 2.5 | 783 sondes en 2.5 → **798** (+15) : 1 sonde neuve de `fix-app` (D-03) et **14 sondes de la passe de finition** — `R-D5-25` (5) et `R-D5-26` (5) dans `D5/screen-g.test.ts` (8 → 18), `R-D5-24` (4) dans `D5/band-actions.test.ts` (5 → 9). Les **205 rouges** de 2.5 sont toutes soldées ou consignées |

### 1.3 Suites

| Suite | Commande | Résultat rejoué |
|---|---|---|
| Unitaire | `npx vitest run` | **54 fichiers, 615 tests, 0 échec** (536 avant 2.6) |
| Revue | `npx vitest run --config vitest.review.config.ts` | **78 fichiers, 798 tests, 0 échec** |
| Combinée | `npm test` | les deux ci-dessus, enchaînées, vertes |
| Performance | `npm run test:perf` | **2 fichiers, 7 tests, 0 échec** |
| Types | `npm run build` (tsc app + worker + vite) et `npx tsc --noEmit -p tsconfig.review.json` | **0 erreur / 0 avertissement** |
| Lint | `npm run lint` | vert |

### 1.4 Budgets

| Budget | Exigence | Mesure rejouée | Verdict |
|---|---|---|---|
| Bundle initial | `EX-NFR-10` ≤ 300 Kio gzip | **99,13 Kio** (88,50 entrée + 10,63 worker hors manifest, compté depuis DR-036) — 98,45 avant la finition, **+0,68 Kio** | **TENU** (33 % du budget) |
| Bundle différé | `EX-NFR-11` ≤ 400 Kio gzip | 0,00 Kio (aucun chunk différé) | **SANS OBJET, garde posée** |
| Mémoire du lot | `EX-NFR-1` ≤ 25 Mo | **17,19 Mio** (6,77 colonnes + 10,41 texte) | **TENU** |
| Sérialisation | `EX-NFR-3` ≤ 6 Mo gzip | **5,45 Mio** (marge 9,2 %, **D-42**) | **TENU** |
| Recalcul p95 | `EX-NFR-5` ≤ 200 ms à N = 100 000 | **172,5 ms** p95 (p50 150,2 ; max 182,7) — 632,7 ms avant 2.6 | **TENU** |
| Facettes différées | `EX-NFR-4bis` ≤ 100 ms p95 | **≈ 22 ms** p95 | **TENU** |
| Rendu du nuage | `EX-NFR-7` ≤ 500 ms p95 pour 5 000 points | **2,84 ms** p95 | **TENU** |
| Interaction continue | `EX-NFR-8` ≥ 30 img/s sur ≥ 95 % des fenêtres de 1 s | **100,0 %** des 91 fenêtres, 0 en échec, min instantané 373 img/s | **TENU** |
| Premier affichage utile | `EX-NFR-9` ≤ 2 000 ms (4G simulée) | **831 ms** — recalculé par moi (§1.5) | **TENU** (marge 1 169 ms) |

### 1.5 `EX-NFR-9` recalculé indépendamment (mesure statique)

Refait à partir de `dist/.vite/manifest.json` et des tailles gzip réelles, sans passer par la sonde,
sur le bundle d'après la finition :

```
$ cat dist/.vite/manifest.json
{ "index.html": { "file": "assets/index-BSSmQp_l.js", "isEntry": true,
                  "css": ["assets/index-Duw18Twg.css"] } }

JS   assets/index-BSSmQp_l.js    88.50 Kio gzip
CSS  assets/index-Duw18Twg.css    2.48 Kio gzip
REF  18 fichiers de data/reference (taxonomy, filters, filters-scope, 15 référentiels)
                                  97.01 Kio gzip
TOTAL                            187.99 Kio gzip
transfert 4G = 187.99 Kio / 500 Ko·s⁻¹ + 2 × 150 ms de latence = 685 ms
$ npx vitest run --config vitest.review.config.ts tests/review/D8/parcours.test.ts
[EX-NFR-9] openSnapshot=146 ms, baseline=0 ms, transfert=188.0 Kio gzip → 685 ms, total=831 ms
 Tests  12 passed (12)
```

**831 ms sur un budget de 2 000 ms** (835 ms avant la finition : le fenêtrage et le bouton ajoutent
0,68 Kio gzip, soit ≈ 1 ms de transfert). `fetchBaselineAggregates = 0 ms` confirme le garde-fou
d'`ARCHITECTURE` §9.3 restauré par DR-049.

*Réserve honnête portée au dossier 2.7* : le chunk du Worker (**10,63 Kio gzip**) est instancié au
`bootstrap()` mais **n'appartient pas au graphe du manifest**, donc `estimateStartupTransfer`
(`tests/review/D8/_helpers.ts`) ne le compte pas dans `EX-NFR-9`, alors que `npm run size` le compte
bien dans `EX-NFR-10` depuis DR-036. Chiffre corrigé : +10,63 Kio → +21 ms → **852 ms**. Sans effet
sur le verdict.

### 1.6 Les deux parcours cibles, rejoués par moi

`npx vitest run --config vitest.review.config.ts tests/review/D8/parcours.test.ts` → **12 tests, tous
verts**, plus un relevé indépendant monté hors du dépôt sur le câblage de production
(`DataController` + `SyntheticDataProvider` par défaut, 100 000 annonces, moteur réel in-process),
rejoué à l'identique après la passe de finition :

```
[VERIF P1] non filtré : marques=294 offres=100000 hasUserFilters=false
[VERIF P1] filtré (priceTo=20000, kmTo=100000, coupé=3, BE) :
           marques=112 offres=2656 hasUserFilters=true activeFilterCount=4 nonAppliqués=[]
[R-D8-31]  cartes hors taxonomie : 0 sur 294, 0 annonces      (158 / 17 988 avant DR-007)
[VERIF P2] enterMode2(54,1918) nom=Opel Corsa lot=1352 Σ=1352 hash=1dcd2e7b7780b20b:EMPTY
[R-D8-30]  Opel Corsa : 1352 annonces / 100 000, 7 outlier(s) injecté(s)   (9 annonces avant DR-038)
[VERIF P2] Opel Corsa toutes années=1352 · millésime 2017=54
[VERIF P2 cellule] prix min/max = 2 500 / 2 812 600 € · price.n=1246 ·
                   verdicts=2461 dont signalés=73
[VERIF P2 2017] lignes=54 Σ=54 hash=1dcd2e7b7780b20b:35a0c206ac32bfef ·
                prix min/max = 10 150 / 20 150 € · price.n=50 · verdicts=98 dont signalés=0
[parcours 2] cellule substitut Trailer-Anhänger Autres : n=1956, injectés=9 dont évaluables=9
             (seuil PRICE_IMPLAUSIBLE_IN_CELL = 225 €), retrouvés=9, verdicts=3593
```

Les valeurs intermédiaires exigées sont confirmées, chiffre par chiffre, et **inchangées** par la
passe de finition (qui ne touche que le bandeau de filtres et l'écran G) :

- **effectif mode 1 filtré** : `2 656` offres sur `112` marques, `activeFilterCount = 4`,
  `unsupportedFilterIds` **vide** — les quatre filtres sont réellement appliqués, l'effectif est
  publié comme filtré à bon droit (D-03/D-33) ;
- **cellule Opel Corsa 2017** : `1 352` Corsa toutes années → **`54`** au millésime 2017 ; le
  `selectionHash` passe réellement de `…:EMPTY` à `…:35a0c206ac32bfef` (DR-006 : les filtres R du
  mode 2 sont compilés, plus ignorés) ; fourchette de prix `10 150 – 20 150 €`, `price.n = 50` ;
- **outliers** : la cellule Corsa entière rend `2 461` verdicts par annonce dont `73` signalés
  (DR-030 : un verdict par annonce ÉVALUÉE, plus seulement par annonce signalée) ; le millésime 2017
  rend `98` verdicts et `0` signalé ; la cellule substitut retrouve **9 injectés sur 9 évaluables**.

### 1.7 R3 / R2 / E5, rejoués

```
$ grep -rn "fetch(" src/ | grep -v test
src/providers/tweedehands/fetcher.ts:139:      const response = await fetch(url, {
src/orchestration/reference-loader.ts:40:  const res = await fetch(url);

$ grep -rn "XMLHttpRequest\|new WebSocket\|sendBeacon" src/ | grep -v test
(aucune)
```

Deux occurrences, aucune fautive : `reference-loader.ts` charge les référentiels **statiques
same-origin** (`/reference/*.json`, copiés en `dist/reference` au build) ; `fetcher.ts` est
l'implémentation réseau du provider réel, **jamais instanciée** (`createHttpTweedehandsFetcher` n'est
appelée nulle part — c'est précisément la dette `DR-104` / D-18), et gardée par `assertAllowedUrl`
(préfixe `robots.txt`). **Aucun appel réseau n'a eu lieu pendant ma session (E5).**

```
$ npx vitest run --config vitest.review.config.ts tests/review/D9/capabilities-mode1.test.ts \
      tests/review/D2/r3-guard.test.ts tests/review/D3
 Test Files  4 passed (4)   Tests  50 passed (50)
[rev-D3] champs de AggregateResult = snapshotId,selection,selectionCount,rows,unsupportedFilterIds
[rev-D3] filtres D5 implémentables mais ignorés (0/15) ;
         fetchSelectionCount('') = 2000 vs ('fuelType=E') = 163
[rev-D3] agrégats de base : 294 marques ; min < 250 € sur 0 marques ; p05 < 250 € sur 0 marques
[rev-D3] doublons de listingId = 0
```

- **R3** : `tests/review/D2/r3-guard.test.ts` → 8 tests verts (dont `R-D2-02` en `it.fails`, dette
  DR-105) ; `R-D2-21`/`R-D2-22` (balayage du dépôt, `zip`/`lat`/`lon` exclus par D-14) verts ;
  `tests/review/D3` prouve l'absence de champ vendeur sur les objets **produits**.
- **R2** : `diff docs/plans/DataProvider.ts src/providers/DataProvider.ts` → **sortie vide, exit 0**
  après les trois amendements (`Int32Array`, `Uint32Array`, `unsupportedFilterIds`) ; aucun accès
  data hors `DataProvider` (le seul `fetch` applicatif charge des référentiels, pas des annonces).
- **E5** : `tests/review/D9/no-network.test.ts` vert dans la suite complète ; aucun `fetch` exécuté.

---

## 2. Problème → correction → preuve rejouée → statut (160 constats)

Une ligne par `DR`. **Correcteur** = les rapports `fix-*` qui portent une ligne de table dédiée au
constat. **Sonde révélatrice** = la preuve citée par la colonne *Preuve* de `DEV-REVIEW` §3, avec le
fichier où elle vit aujourd'hui. **Verdict rejoué** = ce que j'ai lu dans le JSON de
`npx vitest run --config vitest.review.config.ts --reporter=json` du 2026-09-08 (**798/798**).
Statut `DETTE` **seulement** quand une décision `D-xx` ou `DEV-REVIEW` §6.5 la consigne, citée.

| DR | Sév. | Correcteur | Fichiers | Sonde révélatrice | Verdict rejoué (2026-09-08) | Statut |
|---|---|---|---|---|---|---|
| DR-001 | BLOQUANT | foundation, providers | `src/providers/synthetic/`, `src/providers/tweedehands/`, `src/types/`, `src/engine/flags.ts` | `R-D2-08` (D2/sentinels-prices.test.ts) · `R-D3-03` (D3/dataset-100k.test.ts) · `R-D3-04` (D3/dataset-100k.test.ts) · `R-D9-02` (D9/normalization.test.ts) · `R-PATHO-01` (patho/ingestion.test.ts) | `R-D2-08` **vert** · `R-D3-03` **vert** · `R-D3-04` **vert** · `R-D9-02` **vert** · `R-PATHO-01` **vert** | **CORRIGÉ** |
| DR-002 | BLOQUANT | engine | `src/engine/outliers.ts`, `src/types/entities.ts` | `R-D4-03` (D4/sentinels-eligibility.test.ts) · `R-D4-04` (D4/sentinels-eligibility.test.ts) · `R-PATHO-03` (patho/valeurs.test.ts) | `R-D4-03` **vert** · `R-D4-04` **vert** · `R-PATHO-03` **vert** | **CORRIGÉ** (fix-engine) ; `R-PATHO-03` soldée ensuite par fix-residual (D-44) |
| DR-003 | BLOQUANT | foundation, providers | `src/types/`, `src/providers/synthetic/`, `src/providers/tweedehands/` | `R-PATHO-09` (patho/ingestion.test.ts) · `R-D2-23` (D2/adv05-duplicates.test.ts) | `R-PATHO-09` **vert** · `R-D2-23` **vert** | **CORRIGÉ** (ingestion) ; part « moteur » requalifiée par **D-46** |
| DR-004 | BLOQUANT | foundation, providers | `src/types/`, `src/providers/synthetic/`, `src/providers/tweedehands/` | `R-PATHO-10` (patho/ingestion.test.ts) · `R-D2-24` (D2/adv05-duplicates.test.ts) | `R-PATHO-10` **vert** · `R-D2-24` **vert** | **CORRIGÉ** (ingestion) ; part « moteur » requalifiée par **D-46** |
| DR-005 | BLOQUANT | providers | `src/providers/synthetic/selection.ts`, `src/orchestration/data-controller.ts` | `R-D3-12` (D3/contract-labeling.test.ts) · `R-D8-01` (D8/parcours.test.ts) · `R-D8-02` (D8/parcours.test.ts) · `R-PATHO-12` (patho/sollicitation.test.ts) | `R-D3-12` **vert** · `R-D8-01` **vert** · `R-D8-02` **vert** · `R-PATHO-12` **vert** | **CORRIGÉ** |
| DR-006 | BLOQUANT | app | `src/orchestration/`, `src/app.tsx` | `R-D8-03` (D8/parcours.test.ts) | `R-D8-03` **vert** | **CORRIGÉ** |
| DR-007 | BLOQUANT | foundation | `src/providers/DataProvider.ts`, `src/providers/synthetic/columnar.ts`, `src/providers/synthetic/generate.ts` | `R-D8-31` (D8/parcours.test.ts) | `R-D8-31` **vert** | **CORRIGÉ** |
| DR-008 | BLOQUANT | foundation, engine, providers | `src/engine/predicates.ts`, `src/providers/synthetic/selection.ts` | `R-PATHO-15` (patho/bloquants-st.test.ts) | `R-PATHO-15` **vert** | **CORRIGÉ** |
| DR-009 | BLOQUANT | screens, app | `src/screens/distribution/` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
| DR-010 | BLOQUANT | app | `src/app.tsx`, `src/screens/listings/` | `R-D7-24` (D7/ecran-d.test.ts) | `R-D7-24` **vert** | **CORRIGÉ** |
| DR-011 | BLOQUANT | screens | `src/screens/market/` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
| DR-012 | BLOQUANT | foundation, engine | `src/types/validation.ts` | `R-D2-01` (D2/r3-guard.test.ts) | `R-D2-01` **vert** | **CORRIGÉ** |
| DR-013 | BLOQUANT | foundation, engine | `src/types/vocabularies.ts`, `src/engine/flags.ts`, `src/providers/DataProvider.ts` (gelé) | `R-D2-18` (D2/open-points.test.ts) | `R-D2-18` **vert** | **CORRIGÉ** |
| DR-014 | BLOQUANT | state | `src/state/url-codec.ts`, `src/state/corrections.ts` | `R-D5-01` (D5/url-roundtrip.test.ts) · `R-D5-02` (D5/url-roundtrip.test.ts) | `R-D5-01` **vert** · `R-D5-02` **vert** | **CORRIGÉ** |
| DR-015 | BLOQUANT | state | `src/state/interaction.ts` (+ son test existant) | `R-D5-05` (D5/interaction-history.test.ts) | `R-D5-05` **vert** | **CORRIGÉ** |
| DR-016 | BLOQUANT | providers | `src/providers/tweedehands/` | `R-D9-01` (D9/capabilities-mode1.test.ts) · `R-D9-01b` (D9/capabilities-mode1.test.ts) | `R-D9-01` **vert** · `R-D9-01b` **vert** | **CORRIGÉ** |
| DR-017 | BLOQUANT | providers | `src/providers/tweedehands/` | `R-D9-08` (D9/normalization.test.ts) | `R-D9-08` **vert** | **CORRIGÉ** |
| DR-018 | BLOQUANT | providers | `src/providers/tweedehands/` | `R-D9-09` (D9/aggregate-invariants.test.ts) | `R-D9-09` **vert** | **CORRIGÉ** |
| DR-019 | MAJEUR | engine | `src/types/selection.ts` | `R-D2-03` (D2/selection-codec.test.ts) · `R-D2-04` (D2/selection-codec.test.ts) | `R-D2-03` **vert** · `R-D2-04` **vert** | **CORRIGÉ** |
| DR-020 | MAJEUR | engine | `src/types/validation.ts` | `R-D2-10` (D2/dictionary-fields.test.ts) | `R-D2-10` **vert** | **CORRIGÉ** |
| DR-021 | MAJEUR | engine | `src/types/validation.ts` | `R-D2-11` (D2/dictionary-fields.test.ts) | `R-D2-11` **vert** | **CORRIGÉ** |
| DR-022 | MAJEUR | engine | `src/types/validation.ts` | `R-D2-12` (D2/dictionary-fields.test.ts) | `R-D2-12` **vert** | **CORRIGÉ** |
| DR-023 | MAJEUR | engine | `src/types/columns.ts`, `src/types/vocabularies.ts` | `R-D2-13` (D2/dictionary-fields.test.ts) | `R-D2-13` **vert** | **CORRIGÉ** |
| DR-024 | MAJEUR | engine | `src/types/reference.ts` | `R-D2-17` (D2/reference-loader.test.ts) | `R-D2-17` **vert** | **CORRIGÉ** |
| DR-025 | MAJEUR | foundation, engine, providers | `src/types/`, `src/providers/synthetic/`, `src/providers/tweedehands/` | `R-D2-19` (D2/open-points.test.ts) · `R-PATHO-11` (patho/structure.test.ts) | `R-D2-19` **vert** · `R-PATHO-11` **vert** | **CORRIGÉ** |
| DR-026 | MAJEUR | engine | `data/reference/filters-scope.json`, `src/types/reference.ts`, `src/state/filter-registry.ts` | `R-D2-21` (D2/r3-repository-scan.test.ts) | `R-D2-21` **vert** | **CORRIGÉ** |
| DR-027 | MAJEUR | engine | `src/types/validation.ts` | `R-D2-22` (D2/r3-repository-scan.test.ts) | `R-D2-22` **vert** | **CORRIGÉ** |
| DR-028 | MAJEUR | engine | `src/engine/density.ts` | `R-D4-01` (D4/sentinels-eligibility.test.ts) | `R-D4-01` **vert** | **CORRIGÉ** |
| DR-029 | MAJEUR | engine | `src/engine/density.ts`, `src/engine/kernel.ts` | `R-D4-02` (D4/sentinels-eligibility.test.ts) | `R-D4-02` **vert** | **CORRIGÉ** |
| DR-030 | MAJEUR | engine, residual | `src/engine/outliers.ts`, `src/engine/kernel.ts`, `src/screens/outlier-index.ts` | `R-D4-06` (D4/thresholds-m1m2.test.ts) · `R-PATHO-16` (patho/verite-affichee.test.ts) | `R-D4-06` **vert** · `R-PATHO-16` **vert** | **CORRIGÉ** |
| DR-031 | MAJEUR | engine | `src/engine/outliers.ts` | `R-PATHO-08` (patho/structure.test.ts) | `R-PATHO-08` **vert** | **CORRIGÉ** |
| DR-032 | MAJEUR | engine | `src/engine/kernel.ts`, `src/engine/outliers.ts`, `src/worker/messages.ts` | `R-D4-12` (D4/full-100k.test.ts) | `R-D4-12` **vert** | **CORRIGÉ** |
| DR-033 | MAJEUR | engine | `src/engine/uuid.ts`, `src/engine/index-build.ts`, `src/engine/scan.ts` | `R-D4-13` (D4/full-100k.test.ts) | `R-D4-13` **vert** | **CORRIGÉ** |
| DR-034 | MAJEUR | engine | `src/engine/`, `src/worker/messages.ts` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **DETTE (D-17)** — MAJEUR mis en dette motivée |
| DR-035 | MAJEUR | engine | `src/engine/outliers.ts` | `R-PATHO-07` (patho/valeurs.test.ts) | `R-PATHO-07` **vert** | **CORRIGÉ** |
| DR-036 | MAJEUR | engine | `tools/check-bundle-size.mjs`, `vite.config.ts`, `src/worker/client.ts` | `R-D1-01` (D1/bundle-size-guard.test.ts) | `R-D1-01` **vert** | **CORRIGÉ** |
| DR-037 | MAJEUR | providers | `src/providers/synthetic/generate.ts` | `R-D3-09` (D3/dataset-100k.test.ts) | `R-D3-09` **vert** | **CORRIGÉ** |
| DR-038 | MAJEUR | providers | `src/providers/synthetic/generate.ts` | `R-D3-07` (D3/dataset-100k.test.ts) · `R-D8-30` (D8/parcours.test.ts) | `R-D3-07` **vert** · `R-D8-30` **vert** | **CORRIGÉ** |
| DR-039 | MAJEUR | providers | `src/providers/synthetic/generate.ts` | `R-D3-05` (D3/dataset-100k.test.ts) | `R-D3-05` **vert** | **CORRIGÉ** |
| DR-040 | MAJEUR | providers | `src/providers/synthetic/generate.ts`, `src/providers/tweedehands/` | `R-D3-08` (D3/dataset-100k.test.ts) · `R-D9-10` (D9/aggregate-invariants.test.ts) | `R-D3-08` **vert** · `R-D9-10` **vert** | **CORRIGÉ** |
| DR-041 | MAJEUR | providers | `src/providers/tweedehands/` | `R-D9-04` (D9/vocabulary.test.ts) · `R-D9-04b` (D9/vocabulary.test.ts) | `R-D9-04` **vert** · `R-D9-04b` **vert** | **CORRIGÉ** |
| DR-042 | MAJEUR | providers | `src/providers/tweedehands/` | `R-D9-05` (D9/normalization.test.ts) · `R-D9-05b` (D9/normalization.test.ts) | `R-D9-05` **vert** · `R-D9-05b` **vert** | **CORRIGÉ** |
| DR-043 | MAJEUR | providers | `src/providers/tweedehands/`, `src/providers/synthetic/` | `R-D9-03` (D9/normalization.test.ts) · `R-PATHO-02` (patho/ingestion.test.ts) | `R-D9-03` **vert** · `R-PATHO-02` **vert** | **CORRIGÉ** |
| DR-044 | MAJEUR | providers | `src/providers/tweedehands/` | `R-D9-06` (D9/vocabulary.test.ts) · `R-D9-06b` (D9/vocabulary.test.ts) | `R-D9-06` **vert** · `R-D9-06b` **vert** | **CORRIGÉ** |
| DR-045 | MAJEUR | providers | `src/providers/tweedehands/` | `R-D9-11` (D9/aggregate-invariants.test.ts) · `R-D9-11b` (D9/aggregate-invariants.test.ts) | `R-D9-11` **vert** · `R-D9-11b` **vert** | **CORRIGÉ** |
| DR-046 | MAJEUR | providers | `src/providers/tweedehands/` | `R-D9-14` (D9/vocabulary.test.ts) · `R-D9-14b` (D9/vocabulary.test.ts) | `R-D9-14` **vert** · `R-D9-14b` **vert** | **CORRIGÉ** |
| DR-047 | MAJEUR | providers | `src/providers/tweedehands/` | `R-D9-07` (D9/normalization.test.ts) · `R-D9-07b` (D9/normalization.test.ts) · `R-PATHO-04` (patho/valeurs.test.ts) · `R-PATHO-05` (patho/valeurs.test.ts) | `R-D9-07` **vert** · `R-D9-07b` **vert** · `R-PATHO-04` **vert** · `R-PATHO-05` **vert** | **CORRIGÉ** |
| DR-048 | MAJEUR | providers | `src/providers/tweedehands/` | `R-D9-18` (D9/nextdata-robustness.test.ts) | `R-D9-18` **vert** | **CORRIGÉ** |
| DR-049 | MAJEUR | providers | `src/providers/synthetic/`, `src/orchestration/` | `R-D3-01` (D3/dataset-100k.test.ts) · `R-D3-02` (D3/dataset-100k.test.ts) | `R-D3-01` **vert** · `R-D3-02` **vert** | **CORRIGÉ** |
| DR-050 | MAJEUR | providers | `src/providers/tweedehands/` | `R-D9-16` (D9/aggregate-invariants.test.ts) · `R-D9-16b` (D9/aggregate-invariants.test.ts) | `R-D9-16` **vert** · `R-D9-16b` **vert** | **CORRIGÉ** |
| DR-051 | MAJEUR | state | `src/state/corrections.ts` | `R-D5-03` (D5/url-corrections.test.ts) | `R-D5-03` **vert** | **CORRIGÉ** |
| DR-052 | MAJEUR | state | `src/state/filter-registry.ts`, `src/state/url-codec.ts`, `src/state/corrections.ts` | `R-D5-04` (D5/url-roundtrip.test.ts) · `R-PATHO-14` (patho/bloquants-st.test.ts) | `R-D5-04` **vert** · `R-PATHO-14` **vert** | **CORRIGÉ** |
| DR-053 | MAJEUR | state | `src/state/router.ts` | `R-D5-06` (D5/router.test.ts) | `R-D5-06` **vert** | **CORRIGÉ** |
| DR-054 | MAJEUR | state | `src/state/router.ts`, `src/app.tsx`, `src/app/navigation.ts` | `R-D5-07` (D5/router.test.ts) · `R-D8-16` (D8/shell-static.test.ts) · `R-D8-15` (D8/routing.test.ts) | `R-D5-07` **vert** · `R-D8-16` **vert** · `R-D8-15` **vert** | **CORRIGÉ** |
| DR-055 | MAJEUR | state | `src/state/filter-registry.ts` | `R-D5-08` (D5/keyboard-band.test.ts) | `R-D5-08` **vert** | **CORRIGÉ** |
| DR-056 | MAJEUR | state | `src/state/filter-registry.ts`, `src/components/filters/labels.ts` | `R-D5-09` (D5/labels-fr.test.ts) · `R-PATHO-13` (patho/sollicitation.test.ts) | `R-D5-09` **vert** · `R-PATHO-13` **vert** | **CORRIGÉ** |
| DR-057 | MAJEUR | state | `src/components/filters/filter-search.ts`, `src/state/filter-types.ts` | `R-D5-12` (D5/keyboard-band.test.ts) | `R-D5-12` **vert** | **CORRIGÉ** |
| DR-058 | MAJEUR | state | `src/state/debounce-policy.ts`, `src/components/filters/controls/GeoComposite.tsx` | `R-D5-14` (D5/interaction-history.test.ts) | `R-D5-14` **vert** | **CORRIGÉ** |
| DR-059 | MAJEUR | state | `src/components/filters/FilterBand.tsx`, `src/state/filter-registry.ts` | `R-D5-17` (D5/tr-split.test.ts) | `R-D5-17` **vert** | **CORRIGÉ** |
| DR-060 | MAJEUR | state | `src/components/filters/ScreenG.tsx`, `src/components/filters/screen-g-model.ts` | `R-D5-20` (D5/screen-g.test.ts) + **neuves** `R-D5-25`, `R-D5-26` (D5/screen-g.test.ts) | `R-D5-20` **vert** · `R-D5-25` **5/5 verts** · `R-D5-26` **5/5 verts** (rouges avant, §3.1) | **CORRIGÉ** — cœur (`R-D5-20`) + résidu `EX-SCR-216` livré par la passe de finition (fenêtrage `computeRowWindow`, « Effacer la recherche », `ET-VIDE-FILTRES`) ; sondes neuves `R-D5-25`/`R-D5-26` **vues rouges avant** (§3.1) |
| DR-061 | MAJEUR | state | `src/components/filters/band-model.ts`, `src/components/filters/SecondaryGroups.tsx` | `R-D5-21` (D5/band-actions.test.ts) | `R-D5-21` **vert** | **CORRIGÉ** |
| DR-062 | MAJEUR | state | `src/components/filters/labels.ts`, `src/components/filters/ActiveFilterTokens.tsx` | `R-D5-22` (D5/band-actions.test.ts) | `R-D5-22` **vert** | **CORRIGÉ** |
| DR-063 | MAJEUR | state, app | `src/state/router.ts`, `src/state/filter-registry.ts` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
| DR-064 | MAJEUR | state | `src/state/corrections.ts`, `src/screens/distribution/url-state.ts` | `R-D7-18` (D7/url-etat.test.ts) | `R-D7-18` **vert** | **CORRIGÉ** |
| DR-065 | MAJEUR | state, screens | `src/state/corrections.ts`, `src/screens/distribution/url-state.ts` | `R-D7-19` (D7/url-etat.test.ts) | `R-D7-19` **vert** | **CORRIGÉ** (codec D5 + `url-state.ts` aligné, D-11/D-12) |
| DR-066 | MAJEUR | state | `src/state/filter-registry.ts`, `src/state/url-codec.ts`, `src/screens/listings/` | `R-D7-20` (D7/url-etat.test.ts) | `R-D7-20` **vert** | **CORRIGÉ** |
| DR-067 | MAJEUR | state | `src/state/url-codec.ts`, `src/state/corrections.ts`, `src/screens/listings/`, `src/app.tsx` | `R-D7-26` (D7/url-etat.test.ts) | `R-D7-26` **vert** | **CORRIGÉ** |
| DR-068 | MAJEUR | screens | `src/screens/market/` | `R-D6-01` (D6/etats-ecran-a.test.ts) | `R-D6-01` **vert** | **CORRIGÉ** |
| DR-069 | MAJEUR | screens | `src/screens/market/view-model.ts`, `src/screens/market/thresholds.ts` | `R-PATHO-06` (patho/valeurs.test.ts) | `R-PATHO-06` **vert** | **CORRIGÉ** |
| DR-070 | MAJEUR | screens, app | `src/screens/market/csv.ts` | `R-D6-03` (D6/export-csv.test.ts) | `R-D6-03` **vert** | **CORRIGÉ** |
| DR-071 | MAJEUR | screens, app | `src/screens/market/` | `R-D6-08` (D6/responsive.test.ts) | `R-D6-08` **vert** | **CORRIGÉ** |
| DR-072 | MAJEUR | screens, app | `src/screens/market/SummaryBar.tsx` | `R-D6-09` (D6/responsive.test.ts) | `R-D6-09` **vert** | **CORRIGÉ** |
| DR-073 | MAJEUR | screens | `src/screens/distribution/Histogram.tsx` | `R-D7-01` (D7/histogrammes.test.ts) | `R-D7-01` **vert** | **CORRIGÉ** |
| DR-074 | MAJEUR | screens | `src/screens/distribution/Histogram.tsx` | `R-D7-03` (D7/histogrammes.test.ts) | `R-D7-03` **vert** | **CORRIGÉ** |
| DR-075 | MAJEUR | screens | `src/screens/distribution/brush-model.ts`, `ScatterCloud.tsx` | `R-D7-06` (D7/brossage.test.ts) | `R-D7-06` **vert** | **CORRIGÉ** |
| DR-076 | MAJEUR | screens | `src/screens/distribution/DistributionScreen.tsx` | `R-D7-07` (D7/ecran-b.test.ts) | `R-D7-07` **vert** | **CORRIGÉ** |
| DR-077 | MAJEUR | screens, app | `src/screens/distribution/`, `src/engine/aggregate.ts` | `R-D7-08` (D7/ecran-b.test.ts) | `R-D7-08` **vert** | **CORRIGÉ** |
| DR-078 | MAJEUR | screens, app | `src/screens/distribution/`, `src/app.tsx` | `R-D7-09` (D7/ecran-b.test.ts) | `R-D7-09` **vert** | **CORRIGÉ** |
| DR-079 | MAJEUR | screens, app | `src/screens/distribution/` | `R-D7-11` (D7/ecran-b.test.ts) | `R-D7-11` **vert** | **CORRIGÉ** |
| DR-080 | MAJEUR | screens | `src/screens/distribution/` | `R-D7-12` (D7/ecran-b.test.ts) | `R-D7-12` **vert** | **CORRIGÉ** |
| DR-081 | MAJEUR | screens, app | `src/screens/distribution/` | `R-D7-14` (D7/ecran-b.test.ts) | `R-D7-14` **vert** | **CORRIGÉ** |
| DR-082 | MAJEUR | screens | `src/screens/listings/` | `R-D7-16` (D7/ecran-d.test.ts) | `R-D7-16` **vert** *(it.fails — dette)* | **PARTIEL** — `Conso.`/`CO₂` CORRIGÉ ; colonne `TVA` en **DETTE (D-38)** |
| DR-083 | MAJEUR | screens | `src/screens/distribution/` | `R-D7-22` (D7/ecran-b.test.ts) | `R-D7-22` **vert** | **CORRIGÉ** |
| DR-084 | MAJEUR | screens | `src/screens/distribution/` | `R-D7-23` (D7/ecran-b.test.ts) | `R-D7-23` **vert** | **CORRIGÉ** |
| DR-085 | MAJEUR | screens | `src/screens/compare/compare-selection.ts` | `R-D8-17` (D8/routing.test.ts) | `R-D8-17` **vert** | **CORRIGÉ** |
| DR-086 | MAJEUR | screens | `src/screens/distribution/` | `R-D7-25` (D7/ecran-b.test.ts) | `R-D7-25` **vert** | **CORRIGÉ** |
| DR-087 | MAJEUR | screens | `src/screens/compare/`, `src/app.tsx` | `R-D8-18` (D8/screens.test.ts) | `R-D8-18` **vert** | **CORRIGÉ** |
| DR-088 | MAJEUR | screens, app | `src/screens/compare/`, `src/app.tsx` | `R-D8-19` (D8/screens.test.ts) | `R-D8-19` **vert** | **CORRIGÉ** |
| DR-089 | MAJEUR | screens, app | `src/screens/saved/`, `src/app.tsx`, `src/orchestration/` | `R-D8-20` (D8/screens.test.ts) | `R-D8-20` **vert** | **CORRIGÉ** |
| DR-090 | MAJEUR | screens, app | `src/screens/followed/`, `src/app.tsx` | `R-D8-21` (D8/screens.test.ts) | `R-D8-21` **vert** | **CORRIGÉ** |
| DR-091 | MAJEUR | app | `src/orchestration/` | `R-D8-05` (D8/fallback.test.ts) | `R-D8-05` **vert** | **CORRIGÉ** |
| DR-092 | MAJEUR | app | `src/app.tsx` | `R-D8-06` (D8/shell-static.test.ts) | `R-D8-06` **vert** | **CORRIGÉ** |
| DR-093 | MAJEUR | app | `src/app.tsx` | `R-D8-07` (D8/shell-static.test.ts) | `R-D8-07` **vert** | **CORRIGÉ** |
| DR-094 | MAJEUR | app | `src/app.tsx` | `R-D8-08` (D8/shell-static.test.ts) | `R-D8-08` **vert** | **CORRIGÉ** |
| DR-095 | MAJEUR | app | `src/main.tsx` | `R-D8-09` (D8/shell-static.test.ts) | `R-D8-09` **vert** | **CORRIGÉ** |
| DR-096 | MAJEUR | app | `src/persistence/` | `R-D8-10` (D8/persistence.test.ts) | `R-D8-10` **vert** | **CORRIGÉ** |
| DR-097 | MAJEUR | app | `src/persistence/` | `R-D8-11` (D8/persistence.test.ts) | `R-D8-11` **vert** | **CORRIGÉ** |
| DR-098 | MAJEUR | app | `src/persistence/` | `R-D8-12` (D8/persistence.test.ts) | `R-D8-12` **vert** | **CORRIGÉ** |
| DR-099 | MAJEUR | app | `src/app/navigation.ts`, `src/app.tsx`, `src/orchestration/` | `R-D8-14` (D8/routing.test.ts) · `R-D8-16` (D8/shell-static.test.ts) | `R-D8-14` **vert** · `R-D8-16` **vert** | **CORRIGÉ** |
| DR-100 | MAJEUR | app | `src/app.tsx` | `R-D8-22` (D8/shell-static.test.ts) | `R-D8-22` **vert** | **CORRIGÉ** |
| DR-101 | MAJEUR | app | `src/app.tsx` | `R-D8-23` (D8/shell-static.test.ts) | `R-D8-23` **vert** | **CORRIGÉ** |
| DR-102 | MAJEUR | app | `src/app.tsx` | `R-D8-25` (D8/shell-static.test.ts) | `R-D8-25` **vert** | **CORRIGÉ** |
| DR-103 | MAJEUR | app | `src/orchestration/` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
| DR-104 | MAJEUR | providers, app, residual | `src/main.tsx` | `R-D9-21` (D9/capabilities-mode1.test.ts) | `R-D9-21` **vert** *(it.fails — dette)* | **DETTE (D-18)** — MAJEUR mis en dette motivée (AC-01 non levée) |
| DR-105 | MINEUR | engine, residual | `src/types/validation.ts` | `R-D2-02` (D2/r3-guard.test.ts) | `R-D2-02` **vert** *(it.fails — dette)* | **DETTE (§6.5)** |
| DR-106 | MINEUR | engine | `src/types/selection.ts` | `R-D2-05` (D2/selection-codec.test.ts) | `R-D2-05` **vert** | **CORRIGÉ** |
| DR-107 | MINEUR | engine | `src/types/invariants.ts` | `R-D2-06` (D2/invariants-mutation.test.ts) | `R-D2-06` **vert** | **CORRIGÉ** |
| DR-108 | MINEUR | engine | `src/types/invariants.ts` | `R-D2-07` (D2/invariants-mutation.test.ts) | `R-D2-07` **vert** | **CORRIGÉ** |
| DR-109 | MINEUR | engine | `src/types/validation.ts` | `R-D2-09` (D2/sentinels-prices.test.ts) | `R-D2-09` **vert** | **CORRIGÉ** |
| DR-110 | MINEUR | engine | `src/types/reference.ts` | `R-D2-14` (D2/reference-loader.test.ts) | `R-D2-14` **vert** | **CORRIGÉ** |
| DR-111 | MINEUR | engine | `src/types/reference.ts` | `R-D2-15` (D2/reference-loader.test.ts) | `R-D2-15` **vert** | **CORRIGÉ** |
| DR-112 | MINEUR | engine, residual | `data/reference/`, `src/types/reference.ts`, `src/types/vocabularies.ts` | `R-D2-16` (D2/reference-loader.test.ts) | `R-D2-16` **vert** *(it.fails — dette)* | **DETTE (§6.5, O14)** |
| DR-113 | MINEUR | engine | `src/types/validation.ts` | `R-D2-20` (D2/open-points.test.ts) | `R-D2-20` **vert** | **CORRIGÉ** |
| DR-114 | MINEUR | engine, residual | `src/types/vocabularies.ts`, `src/engine/outliers.ts` | `R-D4-05` (D4/thresholds-m1m2.test.ts) | `R-D4-05` **vert** *(it.fails — dette)* | **DETTE (D-45)** |
| DR-115 | MINEUR | engine | `src/engine/outliers.ts` | `R-D4-07` (D4/thresholds-m1m2.test.ts) | `R-D4-07` **vert** | **CORRIGÉ** |
| DR-116 | MINEUR | engine | `src/engine/aggregate.ts`, `src/engine/kernel.ts` | `R-D4-08` (D4/invariants-mutation.test.ts) | `R-D4-08` **vert** | **CORRIGÉ** |
| DR-117 | MINEUR | engine | `src/engine/client.ts` | `R-D4-09` (D4/lru-cache.test.ts) | `R-D4-09` **vert** | **CORRIGÉ** |
| DR-118 | MINEUR | engine | `src/worker/aggregation.worker.ts` | `R-D4-10` (D4/worker-protocol.test.ts) | `R-D4-10` **vert** | **CORRIGÉ** |
| DR-119 | MINEUR | engine | `src/worker/client.ts` | `R-D4-11` (D4/worker-protocol.test.ts) | `R-D4-11` **vert** | **CORRIGÉ** |
| DR-120 | MINEUR | engine | `src/engine/outliers.groundtruth.test.ts` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
| DR-121 | MINEUR | engine | `src/engine/outliers.ts` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
| DR-122 | MINEUR | engine | `src/types/entities.ts`, `src/engine/aggregate.ts` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **DETTE (§6.5)** |
| DR-123 | MINEUR | providers | `src/providers/synthetic/generate.ts` | `R-D3-06` (D3/dataset-100k.test.ts) | `R-D3-06` **vert** | **CORRIGÉ** |
| DR-124 | MINEUR | providers | `src/providers/synthetic/generate.ts` | `R-D3-10` (D3/dataset-100k.test.ts) | `R-D3-10` **vert** | **CORRIGÉ** |
| DR-125 | MINEUR | providers | `src/providers/synthetic/`, `src/providers/tweedehands/` | `R-D3-11` (D3/contract-labeling.test.ts) · `R-D9-17` (D9/aggregate-invariants.test.ts) | `R-D3-11` **vert** · `R-D9-17` **vert** | **CORRIGÉ** |
| DR-126 | MINEUR | providers | `src/providers/synthetic/generate.ts` | `R-D3-13` (D3/dataset-100k.test.ts) | `R-D3-13` **vert** | **CORRIGÉ** |
| DR-127 | MINEUR | providers | `src/providers/tweedehands/` | `R-D9-12` (D9/r3-output.test.ts) | `R-D9-12` **vert** | **CORRIGÉ** |
| DR-128 | MINEUR | providers | `src/providers/tweedehands/` | `R-D9-13` (D9/no-network.test.ts) · `R-D9-13b` (D9/no-network.test.ts) | `R-D9-13` **vert** · `R-D9-13b` **vert** | **CORRIGÉ** |
| DR-129 | MINEUR | providers | `src/providers/tweedehands/` | `R-D9-15` (D9/normalization.test.ts) | `R-D9-15` **vert** | **CORRIGÉ** |
| DR-130 | MINEUR | providers | `src/providers/tweedehands/` | `R-D9-20` (D9/taxonomy.test.ts) · `R-D9-09b` (D9/taxonomy.test.ts) | `R-D9-20` **vert** · `R-D9-09b` **vert** | **CORRIGÉ** |
| DR-131 | MINEUR | providers | `src/providers/tweedehands/` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
| DR-132 | MINEUR | state, residual | `src/state/filter-registry.ts` | `R-D5-10` (D5/labels-fr.test.ts) | `R-D5-10` **vert** *(it.fails — dette)* | **DETTE (§6.5)** |
| DR-133 | MINEUR | state | `src/state/filter-registry.ts` | `R-D5-11` (D5/labels-fr.test.ts) | `R-D5-11` **vert** | **CORRIGÉ** |
| DR-134 | MINEUR | state, residual | `src/components/filters/filter-search.ts` | `R-D5-13` (D5/keyboard-band.test.ts) | `R-D5-13` **vert** *(it.fails — dette)* | **DETTE (§6.5)** |
| DR-135 | MINEUR | state | `src/components/filters/FilterBand.tsx` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
| DR-136 | MINEUR | state | `src/state/url-codec.ts`, `src/state/corrections.ts` | `R-D5-16` (D5/url-corrections.test.ts) | `R-D5-16` **vert** | **CORRIGÉ** |
| DR-137 | MINEUR | state | `src/state/interaction.ts` | `R-D5-18` (D5/interaction-history.test.ts) | `R-D5-18` **vert** | **CORRIGÉ** |
| DR-138 | MINEUR | state | `src/components/filters/band-model.ts`, `PrimaryLine.tsx` | `R-D5-19` (D5/keyboard-band.test.ts) | `R-D5-19` **vert** | **CORRIGÉ** |
| DR-139 | MINEUR | state | `src/components/filters/ActiveFilterTokens.tsx` | grep `EX-SCR-94` (DEV-REVIEW) + **neuve** `R-D5-24` (D5/band-actions.test.ts) | `R-D5-24` **4/4 verts** (3/4 rouges avant, §3.1) ; `grep -rn "EX-SCR-94" src/` = 4 occurrences (0 avant) | **CORRIGÉ** — bouton `EX-SCR-94` + compteur `EX-SCR-78` (`ActiveFilterTokens.tsx`, `FilterBand.tsx`), câblage `onSaveSearch` par le coordinateur (`fa6e83a`) ; sonde neuve `R-D5-24` **vue rouge avant** (§3.1) |
| DR-140 | MINEUR | screens | `src/screens/market/csv.ts` | `R-D6-04` (D6/export-csv.test.ts) | `R-D6-04` **vert** | **CORRIGÉ** |
| DR-141 | MINEUR | screens | `src/screens/market/` | `R-D6-05` (D6/export-csv.test.ts) | `R-D6-05` **vert** | **CORRIGÉ** |
| DR-142 | MINEUR | screens | `src/screens/market/ModelZone.tsx` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CONFORME — consigné (§6.5)**, aucune correction requise |
| DR-143 | MINEUR | screens | `src/screens/market/market.css` | `R-D6-10` (D6/responsive.test.ts) | `R-D6-10` **vert** | **DETTE (D-40 / §6.5)** |
| DR-144 | MINEUR | screens | `src/screens/distribution/Histogram.tsx` | `R-D7-02` (D7/histogrammes.test.ts) | `R-D7-02` **vert** | **CORRIGÉ** |
| DR-145 | MINEUR | screens | `src/screens/distribution/histogram-model.ts` | `R-D7-04` (D7/histogrammes.test.ts) | `R-D7-04` **vert** | **CORRIGÉ** |
| DR-146 | MINEUR | screens | `docs/` (aucune modification de code) | `R-D7-05` (D7/nuage-g4.test.ts) | `R-D7-05` **vert** | **CORRIGÉ** — requalification documentaire (D-08), sonde `R-D7-05` retournée |
| DR-147 | MINEUR | screens, residual | `src/screens/distribution/` | `R-D7-10` (D7/ecran-b.test.ts) | `R-D7-10` **vert** *(it.fails — dette)* | **DETTE (§6.5)** |
| DR-148 | MINEUR | screens | `src/screens/distribution/` | `R-D7-13` (D7/ecran-b.test.ts) | `R-D7-13` **vert** | **CORRIGÉ** (résidu nommé : ancrage des boutons +/−) |
| DR-149 | MINEUR | screens | `src/screens/distribution/` | `R-D7-15` (D7/ecran-b.test.ts) | `R-D7-15` **vert** | **CORRIGÉ** — part fix-screens, puis retrait de `SCATTER_SAMPLING_SEED` par le coordinateur (**D-39**) |
| DR-150 | MINEUR | screens | `src/screens/listings/` | `R-D7-17` (D7/ecran-d.test.ts) | `R-D7-17` **vert** | **CORRIGÉ** |
| DR-151 | MINEUR | screens | `src/screens/distribution/` | `R-D7-21` (D7/ecran-b.test.ts) | `R-D7-21` **vert** | **CORRIGÉ** |
| DR-152 | MINEUR | providers, screens, app | `src/screens/mentions/`, `src/providers/tweedehands/` | `R-D9-19` (D9/capabilities-mode1.test.ts) | `R-D9-19` **vert** | **CORRIGÉ** — part statique fix-screens, part dynamique fix-app (**D-43**) |
| DR-153 | MINEUR | app | `src/persistence/`, `src/app.tsx` | `R-D8-13` (D8/persistence.test.ts) | `R-D8-13` **vert** | **CORRIGÉ** |
| DR-154 | MINEUR | app | `src/app.tsx`, `src/screens/market/SummaryBar.tsx` | `R-D8-24` (D8/shell-static.test.ts) | `R-D8-24` **vert** | **CORRIGÉ** |
| DR-155 | MINEUR | app | `src/app.tsx`, `src/orchestration/` | `R-D8-26` (D8/shell-static.test.ts) | `R-D8-26` **vert** | **CORRIGÉ** |
| DR-156 | MINEUR | app | `src/app/`, `src/persistence/`, `src/screens/compare/`, `src/orchestration/` | `R-D8-28` (D8/shell-static.test.ts) | `R-D8-28` **vert** | **CORRIGÉ** |
| DR-157 | MINEUR | app | `src/orchestration/` | `R-D8-29` (D8/fallback.test.ts) | `R-D8-29` **vert** | **CORRIGÉ** |
| DR-158 | MINEUR | app | `src/orchestration/` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
| DR-159 | MINEUR | app | `src/app.tsx` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
| DR-160 | MINEUR | docs | `DEV.md`, `vite.config.ts` | — (preuve par commande/lecture dans DEV-REVIEW) | aucune sonde tagée ; **suite de revue 798/798 verte** | **CORRIGÉ** |
**Lecture du tableau.** Les 18 BLOQUANT sont tous `CORRIGÉ`, chacun avec sa sonde d'origine verte.
Les six constats dont `DEV-REVIEW` §1.2 disait qu'ils n'étaient pas portés par une sonde rouge
(`R-D4-14…19`, `R-PATHO-17`) et les trois prouvés par une sonde **verte** (`DR-011`, `DR-071`,
`DR-072`, plus `DR-103` ajouté par D-32) ont bien reçu leur sonde d'échec avant correction : `R-D6-07`
(fix-screens §2), `R-D6-08`/`R-D6-09` (fix-screens §2), `R-D8-27` (fix-app §2, vue rouge par
`git stash push -- src` puis verte), `R-D8-32` (idem). Les quatre sont vertes aujourd'hui.

---

## 3. Sondes ajoutées et modifiées depuis la fin de la phase 2.5

Référence : dernier commit de la phase 2.5, `74c725f` (« Phase 2.5: consolidated development review »).

```
$ git diff --shortstat 74c725f..HEAD -- tests/review/
 44 files changed, 1038 insertions(+), 208 deletions(-)
$ git show --stat 559128f -- tests/review/      # « Phase 2.6 (D-49): promote review probes … »
 8 files changed, 32 insertions(+), 8 deletions(-)
$ git diff --numstat e40c025..HEAD -- tests/review/   # la passe de finition, PUREMENT ADDITIVE
 102  0  tests/review/D5/band-actions.test.ts
 166  0  tests/review/D5/screen-g.test.ts
```

**44 fichiers touchés**, dont 8 uniquement (ou aussi) par la conversion `it.fails` de D-49 et 2 par
la passe de finition (**0 suppression** : elle n'ajoute que des sondes). Aucun fichier n'est modifié
sans justification écrite.

### 3.1 Les trois sondes neuves de la passe de finition — vues ROUGES avant, par moi

Les commits `949bba6` et `c24f1e4` livrent la sonde ET la correction ensemble : l'historique seul ne
prouve donc pas la discipline D-32. **Je l'ai prouvée moi-même** en montant un worktree jetable sur
le commit d'AVANT la finition (`e40c025`, celui de ma révision 1) et en y déposant les deux fichiers
de sondes d'aujourd'hui :

```
$ git worktree add /home/user/kycar-wt/verify e40c025
$ ln -s /home/user/KYCAR/node_modules /home/user/kycar-wt/verify/node_modules
$ cp /home/user/KYCAR/tests/review/D5/{screen-g,band-actions}.test.ts  <worktree>/tests/review/D5/
$ npx vitest run --config vitest.review.config.ts tests/review/D5/screen-g.test.ts \
                                                  tests/review/D5/band-actions.test.ts
TypeError: ScreenGMakeRow is not a function          ❯ screen-g.test.ts:292
TypeError: clearScreenGSearch is not a function      ❯ screen-g.test.ts:269
TypeError: makePanelEmptyState is not a function     ❯ screen-g.test.ts:278
 Test Files  2 failed (2)
      Tests  13 failed | 14 passed (27)

Dépouillement du JSON de cette exécution, par identifiant de sonde :
  R-D5-24 {"passed":1,"failed":3}     R-D5-25 {"passed":0,"failed":5}
  R-D5-26 {"passed":0,"failed":5}
  R-D5-20 {"passed":1}  R-D5-21 {"passed":1}  R-D5-22 {"passed":1}   ← inchangées, restées vertes
$ rm <worktree>/node_modules && git worktree remove --force <worktree>     # D-50 respecté
$ ls node_modules | wc -l → 144 ; git status --short → vide
```

**Les 13 assertions des trois sondes neuves échouent sur le code d'avant, et passent toutes sur le
code d'après** (`R-D5-24` 4/4, `R-D5-25` 5/5, `R-D5-26` 5/5 dans la suite de 798). Les trois sondes
préexistantes du même périmètre (`R-D5-20`, `R-D5-21`, `R-D5-22`) sont vertes **avant comme après**,
et leurs fichiers ne perdent aucune ligne : aucune régression, aucune assertion supprimée.

*Écart relevé, non bloquant* : `fix-state` §8.1 annonce « `Tests 3 failed | 15 passed (18)` » pour la
première exécution rouge de `screen-g.test.ts` ; je mesure **10 échecs sur 10** pour `R-D5-25` +
`R-D5-26` contre le code de `e40c025`. L'explication est dans son propre rapport : à l'instant où il
a mesuré, la logique pure (`computeRowWindow`, `makePanelEmptyState`, `clearScreenGSearch`) était
déjà écrite, seule la structure des VNodes manquait. **Ma mesure est la plus stricte des deux** et
elle confirme la discipline ; je consigne la divergence pour la traçabilité.

### 3.2 Verdict par fichier

| # | Fichier · sonde | Correcteur | Justification citée | Mon verdict |
|---|---|---|---|---|
| 1 | `D2/dictionary-fields.test.ts` (`makeId` `Int16Array`→`Int32Array` ; comptage bitset16 ∨ bitset32) | fix-foundation §3 | **D-02** et **D-01** amendent l'interface gelée ; la sonde assertait le type d'AVANT l'amendement ; « exactement 2 champs de bits » (`EX-DATA-119`) conservé | **justifiée** — adaptation de type, aucune assertion normative touchée |
| 2 | `D2/open-points.test.ts` (`bitset32` ; `R-D2-18` seuil `bit > 15` → `> 31`) | fix-foundation §3 | **D-01** : sans l'adaptation la sonde est *insatisfaisable* (elle compare l'index 16 du 17ᵉ code à la largeur de colonne) | **justifiée** |
| 3 | `D2/provider-contract.test.ts` (`Int32Array`/`Uint32Array`, `unsupportedFilterIds: []`) | fix-foundation §3 | **D-01/D-02/D-03** : la sonde construit elle-même le lot et le résultat | **justifiée** |
| 4 | `D2/r3-guard.test.ts` › `R-D2-02` (→ `it.fails`) | coordinateur, commit `559128f` | **D-49** + dette **DR-105** (§6.5) | **justifiée** |
| 5 | `D2/reference-loader.test.ts` › `R-D2-14` (appelle `buildReferenceData` au lieu de forger la clé `"undefined"`) ; › `R-D2-16` (→ `it.fails`) | fix-engine §2 n° 1 ; coordinateur | **DR-110** exige « une erreur nommée » — l'ancienne assertion était insatisfaisable et n'exerçait pas le chargeur ; **D-49** + dette **DR-112** | **justifiée** (les deux) |
| 6 | `D4/full-100k.test.ts` (rappel M1/M2 mesuré sur les injectés ÉVALUABLES, rappel brut toujours imprimé) | fix-engine §2 | **EX-DATA-19(2)** : un injecté sous `0,10 × médianeRéf` est un prix implausible, hors `V_price` — il ne peut pas être « retrouvé » ; `DEV-REVIEW` §6.4 n° 6 ordonne la re-mesure après DR-038 | **justifiée** |
| 7 | `D4/helpers.ts` (**banc**, pas une sonde) | fix-foundation §3 | **D-01/D-02** | **justifiée** |
| 8 | `D4/invariants-mutation.test.ts` (`Uint32Array` ; `I6 — contrôle indépendant` refait les DEUX passes d'`EX-DATA-19`) | fix-foundation §3 ; fix-residual §2 | **D-01** ; **D-44** (la sentinelle relative sort de `V_price`) et la borne de `evaluated` ramenée à l'échantillon purgé des seules sentinelles absolues, avec la mesure `evaluated = 18 560 / n_price(Σ) = 18 378 / valides absolus = 18 830` | **justifiée** |
| 9 | `D4/pruning-facets-density.test.ts` (`n_e` recalculé sous la lecture D-05 ; assertion AJOUTÉE fermant `selectionCount`) | fix-engine §2 | **D-05** amende `EX-DATA-99` ; la sonde codait la lecture d'avant l'amendement | **justifiée** — la sonde est strictement renforcée |
| 10 | `D4/sentinels-eligibility.test.ts` (démonstration faite sur une cellule de 11 prix, plus le comportement au-delà de 12) | fix-residual §2 | **D-44** + seuil de 12 d'`EX-DATA-19(2)` ; le fait mesuré (le moteur ne re-dérive pas la règle ABSOLUE) est conservé | **justifiée** |
| 11 | `D4/thresholds-m1m2.test.ts` › `R-D4-05` (→ `it.fails`) | coordinateur | **D-49** + dette **DR-114 / D-45** | **justifiée** |
| 12 | `D5/band-actions.test.ts` (jetons préfixés du libellé ; `R-D5-22` jeton unique + `removalTargets`) **puis, en finition, ajout du bloc `R-D5-24`** (4 sondes, `+102 / −0`) | fix-state §2 et §8.2 | **DR-056**/`ARB-12` ; **D-10** tranche `EX-SCR-75` vs `EX-SCR-76` contre la lecture « un jeton par valeur » que la sonde codait ; l'ajout `R-D5-24` est une sonde d'échec **neuve** (D-32) pour `DR-139`, aucune assertion existante touchée | **justifiée** |
| 13 | `D5/interaction-history.test.ts` (comptes `pushState`/`replaceState` ; `valueLength: 10` sur la ligne code postal) | fix-state §2 | **DR-015** — les assertions non tagées codaient le défaut que `R-D5-05` (non modifiée) démontre fautif ; **DR-058**/`EX-SRCH-6` (seuil de 4 caractères) : seule la signature d'appel est complétée, le « 500 ms » est intact | **justifiée** |
| 14 | `D5/keyboard-band.test.ts` (comptes primaires 13/9/10 → 12/8/9 ; `R-D5-19` sans `countryType`) ; › `R-D5-13` (→ `it.fails`) | fix-state §2 ; coordinateur | **D-15**/`DR-052` retirent `cy` de la ligne primaire et rendent `powerType`/`hadAccident` `nonExposed` — les comptes bruts changent mécaniquement ; **D-49** + dette **DR-134** | **justifiée** |
| 15 | `D5/labels-fr.test.ts` (`EX-NFR-28` jetons préfixés) ; › `R-D5-10` (→ `it.fails`) | fix-state §2 ; coordinateur | **DR-056** ; **D-49** + dette **DR-132** | **justifiée** |
| 16 | `D5/registry-scope.test.ts` (4 assertions : comptes 77 → −3, `NON_EXPOSE` 1·13 → 6·12, classes `zip`/`page`/`size`) | fix-state §2 | **D-14** (exclusion R3 de `zip`/`lat`/`lon`), **D-12**/`DR-066`, **D-15** | **justifiée** |
| 17 | `D5/router.test.ts` (`Map<number, unknown>` → `Map<number, TaxonomyEntry>`) | coordinateur, commit `2cac847` | Commentaire en tête du fichier : « Adaptation de type seule (**D-31**, coordinateur) : fix-state a typé `TaxonomyLookup` sur `TaxonomyEntry` ; aucune assertion de comportement modifiée » | **justifiée** — *réserve de traçabilité* : la justification vit dans le message de commit et un commentaire, pas dans un rapport `fix-*` ni dans une décision `D-xx`. Adaptation de type pure, vérifiée au diff : elle n'affaiblit rien |
| 18 | `D5/url-budget.test.ts` (filtres sérialisables 73 → 65) | fix-state §2 | Conséquence arithmétique de **D-14** (−3), `DR-052` (−3), **D-12**/`DR-066` (−2) | **justifiée** |
| 19 | `D5/url-corrections.test.ts` (`ADV-01` : jeton préfixé « Prix : … ») | fix-state §2 | **DR-056** | **justifiée** |
| 20 | `D5/url-roundtrip.test.ts` (`ok: 73 → 47`, `notSerialized` étendu à 23 paramètres) | fix-state §2 | **DR-059** : le codec refuse de sérialiser un filtre isolé de sa dépendance non satisfaite — exactement ce qu'exige `R-D5-17`, **non modifiée** ; la sonde teste chaque filtre EN ISOLATION, donc tout filtre à dépendance bascule mécaniquement | **justifiée** — diff relu : `broken: []` est conservé, aucune ligne « rompue » n'est masquée |
| 21 | `D6/effectif-seuils.test.ts` › `R-D6-02` (`price.available` `true` → `false`, `lowSampleToken = 'n = 8'`) | fix-screens §2 | **D-32 + D-04** : la sonde anticipait elle-même l'inversion en commentaire ; D-04 tranche en faveur d'`EX-SCR-33`/`ARB-17` | **justifiée** |
| 22 | `D6/ex-scr-132-modeles-indisponibles.test.ts` › `R-D6-07` (assertions inversées) | fix-screens §2 | **D-32**, `DR-011` nommément : sonde verte documentant un défaut, réécrite rouge puis verte | **justifiée** |
| 23 | `D6/export-csv.test.ts` › `R-D6-03` (en-tête à `lines[3]`) et › `R-D6-05` (exécution de `buildAggregateCsvFileName` au lieu d'un grep de source) | fix-screens §2 | **D-31** : `R-D6-03` (15 colonnes) et `R-D6-04` (3 lignes de métadonnées) décrivent le MÊME fichier et sont incompatibles si l'en-tête reste à l'index 0 ; un nom de fichier dérivé du snapshot (`EX-DATA-123bis`) ne peut pas être un littéral | **justifiée** — la seconde est une preuve strictement plus forte |
| 24 | `D6/responsive.test.ts` › `R-D6-08`, `R-D6-09` (usages attendus, littéral `6` interdit, `matchMedia` exigé) | fix-screens §2 | **D-32**, `DR-071`/`DR-072` nommément : sondes vertes documentant les défauts, réécrites rouge puis verte | **justifiée** |
| 25 | `D6/seuil-60-marques.test.ts` › `FAIT DE CORPUS` (retournée) | fix-residual §2 | **T-t / D-48** : fix-docs a harmonisé `EX-SRCH-26` sur `EX-SCR-32` ; la sonde atteste désormais l'égalité des deux textes ET du code | **justifiée** — diff relu : 6 assertions au lieu de 2, elle se rallume si l'un des textes repart |
| 26 | `D7/ecran-b.test.ts` › `R-D7-10` (→ `it.fails`) | coordinateur | **D-49** + dette **DR-147** (§6.5) | **justifiée** |
| 27 | `D7/ecran-d.test.ts` › `R-D7-16` (→ `it.fails`) | coordinateur | **D-49** + dette **D-38** (colonne TVA seule) | **justifiée** |
| 28 | `D7/histogrammes.test.ts` › « somme des barres de G1 » (vérité terrain à deux passes) | fix-residual §2 (écart de périmètre assumé, §3 n° 2) | **D-44** : le titre de la sonde (« sentinelles exclues ») n'était tenu qu'à moitié — elle comparait Σ barres à un échantillon plus large que celui que le moteur bine | **justifiée** |
| 29 | `D7/nuage-g4.test.ts` › `R-D7-05` (inversée en absence attendue) ; › `EX-DATA-100bis` (la graine n'est plus importée) | fix-screens §2 ; coordinateur (`2cac847`) | **D-08** autorise nommément l'inversion de cette seule sonde (`ET-TROP-RESULTATS` supprimé du catalogue pour `G4`) ; **D-39** applique le retrait de `SCATTER_SAMPLING_SEED` que fix-screens avait rapporté NON FAIT, et requalifie la sonde | **justifiée** — la sonde requalifiée est plus forte (`'SCATTER_SAMPLING_SEED' in mod === false`) |
| 30 | `D7/url-etat.test.ts` › `R-D7-18` (`stack` → `a`), › `R-D7-20` (`page: 3` au lieu de l'état vide), + littéraux `900,100` → `900-100` | fix-screens §2 ; fix-app §2 | **D-11** (`g4v ∈ {a,b}`, le codec D5 fait autorité) — la sonde exigeait l'inverse de l'arbitrage qu'elle vérifie ; **EX-NAV-8** rend la formulation d'origine insatisfaisable (publier `page` sur l'état vide émettrait le défaut `page=1`) ; **D-12** fixe `lo-hi` | **justifiée** — la propriété testée est inchangée dans les trois cas |
| 31 | `D8/fallback.test.ts` › `R-D8-27`, › `R-D8-32` (sondes vertes retournées en sondes d'échec) + **sonde neuve** « D-03 — un filtre déclaré `unsupportedFilterIds` … » | fix-app §2 | **D-32**, `DR-103` et `DR-158` nommément ; les deux ont été vues **rouges** (`git stash push -- src`) avant correction | **justifiée** |
| 32 | `D8/parcours.test.ts` (vérité terrain min/max de cellule : `p > 0` → hors sentinelle absolue, puis hors sentinelle relative) | fix-providers §3 ; fix-residual §2 | **DR-001** puis **D-44** — la sonde comparait `recalc.selectionStats.price` (échantillon valide d'`EX-DATA-60`) à un minimum BRUT ; **D-41** a explicitement accepté le premier alignement, D-44 impose le second | **justifiée** |
| 33 | `D8/persistence.test.ts` (`baseline` complété par `unsupportedFilterIds: []`) | fix-foundation §3 | **D-03** : champ obligatoire de `AggregateResult` | **justifiée** |
| 34 | `D8/routing.test.ts` › `R-D8-17` (titre) + test compagnon (`.` → `-`) | fix-screens §2 | **D-13** fixe `m = <makeId>-<modelId>` ; `R-D8-17` EST la preuve de `DR-085` (modification autorisée par assignation) | **justifiée** |
| 35 | `D9/aggregate-invariants.test.ts` › `R-D9-11b` (compteurs lus dans `getPriceStatusCounts()`) | fix-providers §3 | **D-41** l'accepte : la sonde exigeait `0 + 0 + 0 = 5 220`, **arithmétiquement insatisfaisable** ; le fond de `DR-045` (publier les compteurs) est traité | **justifiée** |
| 36 | `D9/capabilities-mode1.test.ts` › `R-D9-21` (→ `it.fails`) | coordinateur | **D-49** + dette **DR-104 / D-18** | **justifiée** |
| 37 | `patho/_fixtures.ts` (**banc**, le fichier déclare « Ce fichier n'est PAS un test ») | fix-foundation §3 ; fix-residual §2 | **D-01/D-02/D-03** ; **D-47** : bornes de l'annexe A et `cleanModelVersion` appliquées à l'ingestion — le banc fabriquait des lots qu'aucun provider conforme ne peut produire ; les bornes sont LUES dans `src/types` | **justifiée** — `R-PATHO-04/05/11` restent **inchangées** |
| 38 | `patho/bloquants-st.test.ts` › `ST-ARB43` (`1.101` → `1-101`) | fix-screens §2 | **D-13**, même changement de format ; propriété (plafond/écrêtage) inchangée | **justifiée** |
| 39 | `patho/ingestion.test.ts` › `ING-SAIN` (fixture 2 → 12 annonces, palier « trop faible » vérifié en plus) | fix-residual §2 et §3 n° 3 | **EX-SCR-33 / ARB-17 / D-04** : un échantillon de 2 prix relève du palier « trop faible », P5/P95 masqués — c'est l'exigence, pas un défaut ; le cas à 2 annonces est **conservé** comme second volet | **justifiée** |
| 40 | `patho/sollicitation.test.ts` › `SOL-RAFALE-HISTORIQUE` (20 → 19), › `SOL-77` (seuil ≥ 70 → ≥ 60) | fix-state §2 | **DR-015** (même cause que la ligne 13) ; conséquence arithmétique de **D-14**/`DR-052`/**D-12** sur le nombre de filtres exposables | **justifiée** |
| 41 | `patho/structure.test.ts` › `R-PATHO-09 (moteur)`, › `R-PATHO-10 (moteur)` (requalifiées) | fix-residual §2 | **D-46** : le moteur ne déduplique pas, `EX-DATA-15` est une responsabilité d'ingestion (DR-003/004, livrées) ; le constat initial reste MESURÉ en tête, s'y ajoute la preuve que le moteur ne reçoit jamais de lot porteur de doublons | **justifiée** |
| 42 | `patho/valeurs.test.ts` › `VAL-SEUIL-%i` (1 200 € → 4 000 €) ; › `R-PATHO-02` (`toBe(10_000_000)` → `toBeNull()`) | fix-engine §2 ; fix-providers §3 | À 1 200 € la valeur tombe sous `0,10 × médianeRéf` et mesurerait la sentinelle relative au lieu des paliers 12/30 visés ; la sonde `R-PATHO-02` était **contradictoire avec elle-même** (elle cite `ARB-16` « → `priceEur = INCONNU` » et exigeait la valeur conservée), `R-D9-03` non modifiée exige « valeur ramenée à INCONNU ». **D-41** accepte | **justifiée** |
| 43 | `patho/verite-affichee.test.ts` › `VER-ETIQ-A` (`price.min === 119` → effectif 62, `implausibleInCellExcluded = 1`, `price.n = 61`, attaque `ADV-02` rejouée à 1 400 €) | fix-residual §2 | **D-44** puis **D-51**, qui maintient D-44 en toutes lettres : « 119 € sous 0,10 × médiane est une sentinelle relative, hors `V_price` (`EX-DATA-60`)… l'attaque reste mesurée, seul l'exemple numérique change » | **justifiée** |
| 44 | `D5/screen-g.test.ts` — **ajout seul** des blocs `R-D5-25` (fenêtrage) et `R-D5-26` (`ET-VIDE-FILTRES` / « Effacer la recherche »), `+166 / −0` | fix-state §8.1 | **D-32** appliqué au résidu `DR-060` que ma révision 1 signalait ouvert : sondes d'échec écrites d'abord, vues rouges (10/10 chez moi, §3.1), puis vertes sans être modifiées | **justifiée** — aucune assertion préexistante (`R-D5-20/21/22`) n'est touchée : le diff ne contient **aucune suppression** |

**Sondes modifiées sans justification écrite : 0.** **Sondes ajoutées : 15** (1 par `fix-app` pour D-03, 14 par la passe de finition), toutes écrites rouges d'abord.
Aucune assertion `R-Dx-xx` / `R-PATHO-xx` citée comme preuve d'un `DR` n'a été affaiblie : quand la
preuve elle-même a été touchée (`R-D2-14`, `R-D2-18`, `R-D5-19`, `R-D5-22`, `R-D6-02`, `R-D6-03`,
`R-D6-05`, `R-D6-07`, `R-D6-08`, `R-D6-09`, `R-D7-05`, `R-D7-18`, `R-D7-20`, `R-D8-17`, `R-D8-27`,
`R-D8-32`, `R-D9-11b`, `R-PATHO-02`, `R-PATHO-09/10 (moteur)`), la modification est nommément
autorisée par une décision (D-08, D-10, D-11, D-12, D-13, D-31, D-32, D-39, D-41, D-44, D-46, D-48)
ou démontrée nécessaire parce que la formulation d'origine était insatisfaisable. Les sondes
`R-PATHO-04`, `R-PATHO-05`, `R-PATHO-11`, `R-D5-17`, `R-D5-05`, `R-D9-03`, `EX-DATA-101` sont passées
**sans être touchées**.

**Un seul point de traçabilité à signaler** (ligne 17) : l'adaptation de type de
`tests/review/D5/router.test.ts` est justifiée dans le message du commit `2cac847` et dans un
commentaire du fichier, mais dans aucun rapport `fix-*` ni décision numérotée. Le diff relu ne
change que deux paramètres de type générique (`unknown` → `TaxonomyEntry`) ; je la déclare
**justifiée**, en demandant que le coordinateur l'ajoute au journal des décisions pour la forme.

---

## 4. Dettes consignées

Onze constats sont laissés ouverts **avec un motif écrit** (PLAN-2 §2.6 S4). Huit d'entre eux étaient
portés par une sonde rouge : ces huit sondes, et **elles seules**, ont été converties en `it.fails`
annotées (D-49). Les trois autres n'étaient portés par aucune sonde rouge — il n'y avait rien à
convertir.

| # | Dette | Sév. | Motif | Décision qui la consigne | Sonde `it.fails` | Ce que 2.7 doit en faire |
|---|---|---|---|---|---|---|
| 1 | **DR-034** — `GROUPSTAT`/`NTILE`/paliers/indice/`R²`/`SAMPLE` absents du worker | **MAJEUR** | Aucune valeur affichée n'est fausse : D7 produit les mêmes valeurs sur le thread principal en 78,6 ms p50 pour un budget de 300 ms (`EX-SCR-189`). La correction demande un module moteur complet + une extension du protocole worker | **D-17** (reprend §6.5) | — (aucune sonde rouge ne le portait ; preuve par grep) | Instruire `EX-DATA-83bis` (« source unique ») explicitement marquée **non tenue** dans la matrice de couverture |
| 2 | **DR-082 (colonne `TVA` seule)** — `EX-SCR-203` : 16 colonnes normatives, `TVA` manquante | **MAJEUR** | Aucun champ `taxDeductible`/`vat`/`deductible` dans `ListingColumnBatch` (interface gelée 2.3) ni dans les deux providers ; l'ajouter est un amendement d'interface + une chaîne d'ingestion, hors budget 2.6. `Conso.` et `CO₂` sont, elles, **livrées** | **D-38** | `tests/review/D7/ecran-d.test.ts › R-D7-16` — `DETTE D-38 (colonne TVA seule)` | Trancher : amender l'interface (nouveau champ, à la manière de D-01/D-02) **ou** requalifier `EX-SCR-203` en 15 colonnes. Statuer `PARTIELLE` sur `EX-SCR-203` |
| 3 | **DR-104** — `TweedehandsDataProvider` non câblé | **MAJEUR** | `AC-01` (hypothèse d'accès à la source réelle) n'est pas levée ; un provider dont l'axe année, les filtres et l'échantillonnage sont corrigés mais non validés contre la source ne doit pas servir l'utilisateur. `D-28` exige en outre un marqueur `sampleBiased` **avant** tout câblage | **D-18** (+ **D-28**) | `tests/review/D9/capabilities-mode1.test.ts › R-D9-21` — `DETTE DR-104 / D-18` | Statuer sur AC-01. Si levée : câbler (`main.tsx`, point d'injection `baselineCache` prêt, D-29), puis traiter `DR-127…130` (§6.5) et le marqueur `sampleBiased`. Sinon : `EX-DATA-107` reste servie par `SYNTHETIC`, ce que `/mentions` dit déjà |
| 4 | **DR-105** — `vin`, `licencePlate`, `belgianCarpassMileageUrl` (E15–E17) hors du garde R3 | MINEUR | `EX-DATA-49` ne cite littéralement que E1–E14 ; l'extension relève du RGPD, pas de R3 ; aucun de ces champs n'existe dans le schéma | **§6.5** | `tests/review/D2/r3-guard.test.ts › R-D2-02` — `DETTE DR-105 / D-49` | Décider si `EX-DATA-49` est étendue à E15–E17 ; si oui, 3 lignes dans `R3_FORBIDDEN_FIELD_NAMES` |
| 5 | **DR-112** — `data/reference/postal-regions-be.json` absent (solde d'**O14**) | MINEUR | Exige une source externe officielle (Statbel/bpost) que **E5** interdit de collecter en session. Couverture actuelle exhaustive (9 000 codes, plages disjointes et contiguës), dette **visible à l'exécution** (`origin: 'CRÉÉ (§A.8 NUTS-2) [EXTRAPOLÉ]'`) | **§6.5** | `tests/review/D2/reference-loader.test.ts › R-D2-16` — `DETTE DR-112 / D-49` | Fournir le fichier hors session, ou acter `EX-DATA-53`/`54` comme `PARTIELLE [EXTRAPOLÉ]` |
| 6 | **DR-114** — verdicts `INSUFFICIENT_DATA`/`INSUFFICIENT_SPREAD` par annonce | MINEUR | Exigerait d'étendre un vocabulaire **gelé** de 6 à 8 codes et contredit 4 sondes vertes qui exigent « aucun verdict sous n = 12 ». L'implémentation a été écrite puis **retirée** par fix-engine | **D-45** | `tests/review/D4/thresholds-m1m2.test.ts › R-D4-05` — `DETTE DR-114 / D-45` | Instruire avec l'annexe A : soit `KYCAR_OUTLIER_FLAG` passe à 8 codes, soit `EX-DATA-85/86/95` sont amendées |
| 7 | **DR-122** — `MetricStats` publie 10 des 13 valeurs d'`EX-DATA-64` ; `MakeAggregate` sans `modelCount`/`displayRange`/`rank` | MINEUR | Extension d'entités gelées en 2.3 pour des valeurs **dérivables au rendu** ; aucun effet visible | **§6.5** | — (aucune sonde rouge ; la forme des sorties est vérifiée verte) | Publier `iqr` et `coverage` (peu coûteux) ou requalifier `EX-DATA-64` |
| 8 | **DR-132** — libellés forgés de `zipr` non marqués `[EXTRAPOLÉ]` | MINEUR | Traçabilité documentaire, sans effet sur une valeur affichée. Le filtre lui-même est **exclu du périmètre** par D-14 (motif R3) | **§6.5** | `tests/review/D5/labels-fr.test.ts › R-D5-10` — `DETTE DR-132 / D-49` | Sans objet si `EX-SRCH-7` est retirée (conflit résiduel n° 2 de fix-docs) ; sinon marquer les libellés |
| 9 | **DR-134** — suggestions Levenshtein ≤ 3 sur zéro correspondance (`EX-SCR-80`) | MINEUR | Confort de recherche, sans effet sur une valeur affichée ni sur un parcours cible | **§6.5** | `tests/review/D5/keyboard-band.test.ts › R-D5-13` — `DETTE DR-134 / D-49` | Statuer `EX-SCR-80` `PARTIELLE` ou implémenter (distance d'édition sur `searchFilters`) |
| 10 | **DR-143** — grille 4 lignes de la zone-modèle en régime compact | MINEUR | Mise en page CSS sans effet sur une valeur affichée ; l'implémenter ferait passer au rouge `R-D6-10`, sonde **non autorisée** au retournement | **D-40** (+ §6.5) | — (`tests/review/D6/responsive.test.ts › R-D6-10` est **verte** et documente l'absence) | Trancher `R-D6-10` vs `DR-143` avant d'implémenter : les deux sont contradictoires en l'état |
| 11 | **DR-147** — note d'absence des graphes en dette A-08 (CO₂, consommation, boîte) | MINEUR | Traçabilité, sans effet sur une valeur affichée | **§6.5** | `tests/review/D7/ecran-b.test.ts › R-D7-10` — `DETTE DR-147 / D-49` | Ajouter la mention, ou statuer `A-08` `HORS PÉRIMÈTRE` avec motif |

**Contrôle de bijection.** Les 8 `it.fails` du dépôt (`grep -rn "it.fails\|test.fails" tests/review src`)
sont exactement : `R-D2-02` (DR-105), `R-D2-16` (DR-112), `R-D4-05` (DR-114/D-45), `R-D5-10` (DR-132),
`R-D5-13` (DR-134), `R-D7-10` (DR-147), `R-D7-16` (D-38, colonne TVA), `R-D9-21` (DR-104/D-18).
**Chacune correspond à une dette consignée, et à aucune autre** ; aucune dette consignée n'est
couverte par deux sondes ; aucune sonde `it.fails` ne masque un constat sans dette. Toutes échouent
réellement (sinon `it.fails` rendrait la suite rouge) : les 11 dettes sont **vivantes et mesurées**,
pas éteintes.

### 4.1 Les MAJEUR mis en dette — dit explicitement

`PLAN-2` §2.6 **S1** exige « zéro problème de sévérité bloquante ou majeure encore **ouvert** », et
`DEV-REVIEW` §6.5 prévient : « la mise en dette d'un MAJEUR est une **décision explicite du
fix-lead**, à consigner dans `REMEDIATION.md` avec son motif (PLAN-2 §2.6 S4), pas un contournement
silencieux. » Je consigne donc, en clair :

- **`DR-034` (MAJEUR) → DETTE, décision `D-17`.** Motif écrit et mesuré (78,6 ms p50 contre un budget
  de 300 ms, aucune valeur affichée fausse). **Consigné, pas ouvert.**
- **`DR-082`, part « colonne TVA » (MAJEUR) → DETTE, décision `D-38`.** Motif : champ inexistant dans
  l'interface gelée. Les deux autres tiers du constat (`Conso.`, `CO₂`) sont **corrigés**.
  **Consigné, pas ouvert.**
- **`DR-104` (MAJEUR) → DETTE, décision `D-18`.** Motif : `AC-01` non levée ; le provider est corrigé
  mais délibérément non câblé. **Consigné, pas ouvert.**

Aucun autre MAJEUR n'est en dette, et **aucun MAJEUR n'est ouvert** : le résidu de `DR-060` que ma
révision 1 signalait au §7 a été **livré** depuis (commit `949bba6`), avec ses deux sondes d'échec
écrites d'abord et vérifiées rouges par moi (§3.1). Les trois dettes ci-dessus sont donc les seuls
MAJEUR non corrigés, et les trois sont motivées par écrit.

---

## 5. Points ouverts O13–O17 — état final

| Point | État final | Preuve rejouée |
|---|---|---|
| **O13** — `KYCAR_INGEST_FLAG` : 14 / 16 / 17 codes sur 16 bits | **RÉSOLU** (D-01) | `ingestFlags` est un `Uint32Array` (`diff docs/plans/DataProvider.ts src/providers/DataProvider.ts` → vide) ; table explicite `INGEST_FLAG_BIT` + `hasIngestFlag`/`setIngestFlag`/`ingestFlagCodes` exportées par `src/types/vocabularies.ts` ; `tests/review/D2/open-points.test.ts › R-D2-18` **vert** (« les 17 drapeaux tiennent ») et `› R-D2-18 (ADV-15)` **vert** (`MARKETPLACE_UNMAPPED` stockable). Côté données, la question a désormais de la matière : `[rev-D3] ingestFlags ≠ 0 sur 2 753 annonces`, `{MODEL_UNRESOLVED:469, PRICE_SENTINEL_ABSOLUTE:47, PRICE_MISSING_UNDECLARED:2051, SUSPECT_ZERO_MILEAGE:209}`. §A.1 porté à 17 codes par fix-docs |
| **O14** — table NUTS-2 BE `[EXTRAPOLÉ]` | **DETTE** (DR-112, §6.5) | `tests/review/D2/reference-loader.test.ts › R-D2-16` en `it.fails` annotée `DETTE DR-112 / D-49` : `expected [] to have a length of 1`, aucune exception communale, `postal-regions-be.json` absent. Couverture 1000–9999 intacte, dette visible à l'exécution |
| **O15** — `Model.bodyTypes` vide et index taxonomique par carrosserie | **RÉSOLU côté structure, DONNÉE toujours à fournir** | `DR-024` corrigé : `src/types/reference.ts` expose `modelsByBodyType: ReadonlyMap<string, readonly Model[]>` **et** `bodyTypeIndexAvailable: boolean` ; `tests/review/D2/reference-loader.test.ts › R-D2-17` **vert**. `EX-SCR-178` (note d'exclusion) est rendue par `src/screens/distribution/GraphFrame.tsx`. Ce qui reste : `bodyTypes = []` sur les 4 955 modèles, faute de donnée source — l'index est donc *disponible et vide*, ce que le drapeau dit honnêtement. **À instruire en 2.7** (fourniture de la donnée). *Correction appliquée* : la ligne O15 de `docs/EXECUTION-LOG.md`, que ma révision 1 signalait périmée, a été rectifiée par le coordinateur (`e40c025`) — elle dit désormais « Structure RÉSOLUE en 2.6, donnée toujours absente… sonde `R-D2-17` verte », relu et conforme |
| **O16** — 13 contre 14 entités | **RÉSOLU** (documentaire) | fix-docs : `EX-DATA-105`, `draft-data-dictionary.md` §C.5 et `ARCHITECTURE.md` §2.1 portent « quatorze entités » ; impact d'exécution nul, `tests/review/D2/open-points.test.ts` vert |
| **O17** — `EX-NFR-5` (recalcul ≤ 200 ms p95) | **RÉSOLU** — les deux moitiés | *Câblage* : `tests/review/D8/o17.test.ts` vert dans la suite (aucun chemin résiduel n'atteint le moteur non élagué). *API moteur* : `DR-032` corrigé — `src/engine/kernel.ts` porte `OUTLIER_UNPRUNED_MAX_ROWS = 25_000` et publie `outliersSkipped: 'UNPRUNED_SELECTION'` ; `tests/review/D4/full-100k.test.ts › R-D4-12` **vert** (`sans scope : pruned=false, verdicts M2@SELECTION=0, M1@SELECTION=0`). *Chiffre* : `npm run test:perf` → **p50 152,6 ms / p95 166,7 ms / max 180,5 ms** à N = 100 000 (632,7 ms p95 en 2.5) ; élagué 56,2 ms p95 ; facettes 22,1 ms p95. *Contrepartie mesurée* : la baseline n'est plus recalculée (`fetchBaselineAggregates = 0 ms`, identité d'objet vraie, `R-D3-01`) et les annonces sortent du chemin critique (`R-D3-02` : `openSnapshot = 180 ms`, total 180 ms contre 1 073 + 71 ms) |

---

## 6. Critères S1–S4 de PLAN-2 §2.6

| Critère | Énoncé | Verdict | Pourquoi |
|---|---|---|---|
| **S1** | Zéro problème de sévérité **bloquante ou majeure** encore **ouvert** | **ATTEINT** | Les **18 BLOQUANT** sont corrigés, chacun avec la sonde qui l'a révélé, verte et non affaiblie (`R-D2-01`, `R-D2-08`, `R-D2-23/24`, `R-D3-03/04`, `R-D4-03/04`, `R-D8-31`, `R-D8-03`, `R-D7-23/24`, `R-D9-01/08/09`, `R-PATHO-01/09/10/12/15`, `R-D6-07`…). Sur les **86 MAJEUR** : **83 corrigés** — dont `DR-060`, dont le résidu d'`EX-SCR-216` (fenêtrage de l'écran G, bouton « Effacer la recherche », `ET-VIDE-FILTRES`) a été livré et prouvé par `R-D5-25`/`R-D5-26`, **vues rouges avant** dans un worktree sur `e40c025` (§3.1) — et **3 en dette motivée et consignée** (`DR-034`/D-17, `DR-082` colonne TVA/D-38, `DR-104`/D-18), donc *consignés, pas ouverts* (§4.1). **Plus aucun MAJEUR ni BLOQUANT ouvert** |
| **S2** | Chaque correction est prouvée par une **exécution**, pas par une affirmation | **ATTEINT** | **147 des 160** constats sont prouvés par au moins une sonde tagée, rejouée verte par moi dans la même exécution JSON (`798 passed / 798`, `numFailedTests 0`) ; les 13 autres portaient déjà en 2.5 une preuve par commande, et leur correcteur cite une exécution. J'ai en outre rejoué de bout en bout `git log`, `build`, `lint`, `size`, `tsc -p tsconfig.review.json`, `npm test`, `npm run test:perf`, `tests/review/D5`, les deux parcours cibles, `EX-NFR-9` recalculé à la main, et **la rougeur préalable des trois sondes neuves** dans un worktree jetable. **Réserve nommée, non bloquante** : `DR-131`, `DR-135` et `DR-159` restent prouvés par lecture ou `grep` faute d'environnement DOM — la revue 2.5 les avait déjà classés non exécutables, la remédiation n'a pas dégradé leur niveau de preuve |
| **S3** | Aucune régression : la suite complète passe après remédiation | **ATTEINT** | `npm test` → **615/615** (unitaire, 536 avant 2.6) puis **798/798** (revue) ; `npm run test:perf` → **7/7** ; `npm run build` → 0 erreur / 0 avertissement ; `npm run lint` → vert ; `npx tsc --noEmit -p tsconfig.review.json` → vert ; `npm run size` → 99,13/300 Kio. Zéro `skip`, zéro `todo`, zéro `.only`. La passe de finition est **purement additive** côté sondes (`+268 / −0`) et ne fait tomber aucune sonde existante (`R-D5-20/21/22`, `keyboard-band`, piège de focus à 6 arrêts : verts avant et après). Les budgets chiffrés ne régressent pas : `EX-NFR-1` 17,19/25 Mo, `EX-NFR-3` 5,45/6 Mo, `EX-NFR-5` **172,5 ms** ≤ 200 (contre 632,7), `EX-NFR-7` 2,84 ms ≤ 500, `EX-NFR-8` 100 % ≥ 95 %, `EX-NFR-9` 831 ms ≤ 2 000, bundle +0,68 Kio gzip. Les deux copies de l'interface gelée restent identiques (`diff` vide, exit 0) |
| **S4** | Les problèmes laissés ouverts sont consignés comme **dette avec leur motif** | **ATTEINT** | **11 dettes** consignées au §4, chacune avec son motif, la décision (`D-17`, `D-18`, `D-38`, `D-40`, `D-45`) ou la ligne `DEV-REVIEW` §6.5 qui la porte, sa sonde `it.fails` quand elle en a une, et l'action attendue de 2.7. Les **8 conversions `it.fails`** sont en bijection avec les 8 dettes portées par une sonde rouge ; **aucun `skip`, aucun `todo`** (D-49 respecté). **Aucun constat n'est laissé ouvert sans dette** : les deux qui l'étaient à ma révision 1 ont été livrés |

**Verdict de phase : S1, S2, S3 et S4 ATTEINTS.**

---

## 7. Constats OUVERTS

**Aucun.** Les 160 constats sont soldés : **148 CORRIGÉS**, **11 en dette écrite et motivée** (§4),
**1 déclaré CONFORME et consigné** (`DR-142`). Les deux points que signalait ma révision 1 sont
clos :

| Point de la révision 1 | Ce qui a été livré | Preuve rejouée par moi | Statut |
|---|---|---|---|
| **`DR-060`** (MAJEUR) — résidu `EX-SCR-216` : virtualisation de l'écran G, bouton « Effacer la recherche », `ET-VIDE-FILTRES` | `computeRowWindow` (60 lignes visibles + 20 de tampon, espaceurs haut/bas, `aria-posinset`/`aria-setsize` sur la liste COMPLÈTE), `clearScreenGSearch` remettant **les deux** panneaux à l'état initial, `makePanelEmptyState`/`modelPanelEmptyState` + `ScreenGEmptyNotice` portant le bouton — `src/components/filters/screen-g-model.ts`, `ScreenG.tsx` (`949bba6`) | `R-D5-25` **5/5** et `R-D5-26` **5/5** verts dans la suite de 798 ; **10/10 rouges** contre `e40c025` (§3.1). `grep -rn "Effacer la recherche" src/` → 6 occurrences (0 avant) ; `grep -rn "ET-VIDE-FILTRES" src/components/filters/` → 5 (0 avant) ; `grep -n "DETTE SIGNALÉE" src/components/filters/ScreenG.tsx` → **0** (la mention a bien été retirée) | **CORRIGÉ** |
| **`DR-139`** (MINEUR) — bouton `EX-SCR-94` et compteur `EX-SCR-78` | Prop optionnelle `onSaveSearch` (bouton rendu seulement si fournie, CRUD non dupliqué), compteur sorti du texte inline vers un élément en fin de zone (`formatOfferCount`, `EX-SCR-10`), atténué et suivi de `…` pendant `ET-CHARGE-MAJ`, jamais `0` — `ActiveFilterTokens.tsx`, `FilterBand.tsx` (`c24f1e4`) ; câblage `onSaveSearch` sur `<FilterBand>` par le coordinateur (`fa6e83a`, `src/app.tsx` l. 735-740) | `R-D5-24` **4/4** verts (3/4 rouges contre `e40c025`, §3.1). `grep -rn "EX-SCR-94" src/` → 4 occurrences (0 avant) ; `grep -rn "onSaveSearch" src/` → présent sur `FilterBand.tsx` l. 47/238, `ActiveFilterTokens.tsx` l. 34/44/87-88 et `app.tsx` l. 738 (appel de `<FilterBand>`), routé sur le `saveCurrentSearch` existant, **non dupliqué** | **CORRIGÉ** |

### 7.1 Observations non bloquantes, à verser au dossier 2.7

Aucune n'est un constat ouvert ; aucune ne pèse sur S1–S4 ni sur G5.

1. **`resultCount` n'est pas alimenté par la coquille.** `ActiveFilterTokens` implémente désormais le
   format normatif d'`EX-SCR-78`, mais `src/app.tsx` ne passe ni `resultCount` ni
   `resultCountLoading` à `<FilterBand>` — le compteur ne rend donc rien à l'exécution.
   **Ce n'est pas une régression** : la prop était déjà optionnelle et déjà non alimentée avant la
   finition (`git show e40c025:src/app.tsx | grep resultCount` → vide), et la « correction attendue »
   de `DR-139` porte sur le **format** du compteur, pas sur son alimentation. À câbler en 2.7
   (`resultCount={screenA.selectionCount}`, `resultCountLoading` pendant `ET-CHARGE-MAJ`).
2. **`EX-NFR-9` ne compte pas le chunk du Worker** (10,63 Kio gzip, hors graphe du manifest) alors
   que `EX-NFR-10` le compte depuis `DR-036`. Chiffre corrigé : 831 → **852 ms**, sans effet sur le
   verdict, mais les deux gardes devraient parcourir le même ensemble de fichiers.
3. **Deux conflits résiduels d'exigences** signalés par `fix-docs` §2 sans mandat pour trancher :
   `EX-SCR-114` (« jamais masquées ») contre `EX-SCR-33`/`134` (P5/P95 masqués pour `5 ≤ n ≤ 11`) —
   **D-36** tranche le fond mais `EX-SCR-114` n'a pas été éditée ; et `EX-DATA-49` (D-14 exclut
   `zip`/`lat`/`lon`) contre `EX-SRCH-6`/`7` qui continuent de spécifier `zip`/`zipr` — **D-37** les
   déclare « sans objet » sans les retirer. À statuer en 2.7.
4. **`D-51`** : le seuil de `PRICE_IMPLAUSIBLE_IN_CELL` de `C₃ = Σ` et les seuils par cellule
   d'analyse ne coïncident pas — `outlierEvaluatedCount` n'est plus majoré par `n_price(Σ)`
   (18 560 contre 18 378 à N = 20 000). Versé au dossier 2.7 comme point d'instruction, conformément
   à D-51.
5. **`DR-148`** est corrigé (`R-D7-13` verte) avec un résidu nommé par son correcteur : l'ancrage
   centré des boutons +/− du nuage n'est pas traité. MINEUR, sans sonde.
6. **`PanelSearchMulti.tsx`** porte encore une « DETTE SIGNALÉE » sur `EX-SCR-100` (liste non
   virtualisée) — antérieure à 2.6, hors des 160 constats de `DEV-REVIEW`, inchangée par la
   finition. À instruire en 2.7 avec le reste du bandeau.

---

## 8. Résumé (12 lignes)

1. **160 constats vérifiés un par un** : **18 BLOQUANT tous CORRIGÉS**, **86 MAJEUR** = 83 corrigés
   + 3 dettes motivées, **56 MINEUR** = 47 corrigés + 8 dettes + 1 conforme consigné.
   Total : **148 CORRIGÉ · 11 DETTE · 0 OUVERT · 1 CONFORME**.
2. **Sondes** : `798 / 798` vertes (78 fichiers), dont **8 `it.fails`** annotées qui échouent
   réellement et documentent 8 dettes ; **0 sonde rouge non couverte**, **0 `skip`/`todo`/`.only`**.
3. **Suites rejouées** : unitaire **615/615**, revue **798/798**, perf **7/7**, `build` 0/0,
   `lint` vert, `tsc -p tsconfig.review.json` 0 erreur, arbre git propre.
4. **Budgets rejoués** : bundle **99,13 / 300 Kio** gzip (worker compris, +0,68 après finition) ;
   `EX-NFR-1` 17,19/25 Mo ; `EX-NFR-3` 5,45/6 Mo ; `EX-NFR-5` **p95 172,5 ms** ≤ 200 (632,7 en 2.5) ;
   `EX-NFR-4bis` ≈ 22 ms ; `EX-NFR-7` 2,84 ms ; `EX-NFR-8` **100 %** des fenêtres ;
   `EX-NFR-9` **831 ms** ≤ 2 000, recalculé par moi sur `dist/.vite/manifest.json` + 18 référentiels.
5. **Parcours cibles rejoués, valeurs inchangées** : mode 1 filtré = **2 656 offres / 112 marques**,
   `unsupportedFilterIds` vide ; Opel Corsa **1 352 → 54 en 2017**, `selectionHash` `…:EMPTY` →
   `…:35a0c206ac32bfef` ; 2 461 verdicts / 73 signalés, 9 injectés retrouvés sur 9 évaluables.
6. **Sondes : 44 fichiers touchés, 44 justifiés, 0 non justifié ; 15 sondes ajoutées**, toutes
   écrites rouges d'abord. La passe de finition est **purement additive** (`+268 / −0`).
7. **Rougeur préalable prouvée par moi** (§3.1) : worktree jetable sur `e40c025` + les deux fichiers
   de sondes d'aujourd'hui → **13 échecs** (`R-D5-24` 3/4, `R-D5-25` 5/5, `R-D5-26` 5/5), tandis que
   `R-D5-20/21/22` restent verts. Worktree retiré selon **D-50**, `node_modules` intact.
8. **11 dettes consignées**, motif + décision + sonde + action 2.7 au §4 ; les **8 `it.fails`** sont
   en **bijection** avec les 8 dettes portées par une sonde rouge, aucune de plus, aucune de moins.
9. **MAJEUR mis en dette, dits en clair** : `DR-034` (D-17), `DR-082` colonne TVA (D-38),
   `DR-104` (D-18) — **consignés, pas ouverts**, chacun avec son motif chiffré. Aucun autre.
10. **O13 RÉSOLU** (D-01) · **O14 DETTE** (DR-112, E5) · **O15 structure RÉSOLUE**, donnée à fournir ·
    **O16 RÉSOLU** · **O17 RÉSOLU** (garde `OUTLIER_UNPRUNED_MAX_ROWS`, p95 172,5 ms).
11. **S1, S2, S3, S4 : les quatre ATTEINTS. Porte G5 : PASSABLE** — zéro problème bloquant ou majeur
    ouvert, zéro sonde rouge non couverte, aucune régression, toutes les dettes motivées par écrit.
12. Rapport : **`reports/REMEDIATION.md`** (révision 2) · `src/`, `tests/` et `docs/` non modifiés ·
    aucun commit, aucun accès réseau, aucune question.
