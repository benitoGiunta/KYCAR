# HANDOFF — reprise du projet KYCAR par un nouvel agent

**Mis à jour le 2026-09-09 (clôture 2.9 : toutes les phases du plan 2 sont closes) par l'agent coordinateur.** Ce fichier suffit à reprendre le travail sans
aucun contexte conversationnel. Lis-le en entier, puis lis `docs/EXECUTION-LOG.md` (source de vérité
de l'avancement).

---

## 0. TL;DR — où en est le projet

- **Chantier 1** (comment charger les données) : **CLOS.** Rapport : `docs/research/DATA-ACQUISITION-REPORT.md`.
- **Chantier 2** (l'application) :
  - Exigences **v1.3** (v1.0 gelée + amendements tracés `[amendée 2.6 — D-xx]` et `[amendée 2.8 — D8-xx]`),
    architecture figée et amendée (`makeId` Int32, `ingestFlags` Uint32, `unsupportedFilterIds`,
    `vatDeductible`, `modelCount`, `iqr`/`coverage`, verdicts 8 codes) — sans changement de signature.
  - **2.4 (développement D1–D9) : COMPLÈTE. 2.5 (revue) : VALIDÉE** (160 constats). **2.6 (remédiation) :
    VALIDÉE** (D-01…D-51, `reports/REMEDIATION.md`, porte G5).
  - **2.7 (vérification finale, Fable/max) : VALIDÉE** — `reports/FINAL-VERIFICATION.md`, 485 exigences
    cotées, FV-01…FV-24 (2 BLOQUANT), porte G6.
  - **2.8 (remédiation post-vérification) : VALIDÉE — porte G7 franchie** (`reports/REMEDIATION-2.8.md`
    rev 3, décisions D8-01…D8-40 dans `reports/remediation-2.8/FIX-LEAD-DECISIONS-2.8.md`) : 24/24 FV
    traités, 26/26 constats E2E levés, 8 dettes 2.6 sur 9 levées, **dix dettes admises, toutes écrites**
    (5 externes, 1 produit, 2 architecturales O17 mode 1, 2 d'interface gelée).
  - **2.9a (harnais Playwright) : VALIDÉE** — `tests/e2e/`, 3 projets, Chromium préinstallé.
    **2.9b (recette finale `acceptance`, Fable/max) : VALIDÉE — porte G8 franchie** (`reports/ACCEPTANCE.md`
    rev 2) : 264 tests E2E, 0 échec inattendu ; axe-core 24/24 balayages à 0 violation ; EX-NFR-6/7/8/9
    tenus et mesurés ; P1/P2 journalisés, 18 captures. 16 constats ACC : ACC-01 (MAJEUR, filtres T
    ignorés en silence en mode 2), ACC-05, ACC-15 **corrigés** (`fix-app-3`, D8-41/42) ; ACC-02…04,
    06…14, 16 = **dette de présentation D8-43** (décision du commanditaire).
  - **Build 0/0 · lint 0 · `npm test` = 675 tests unitaires + 1 091 sondes de revue, tous verts ·
    E2E 264 tests, 0 échec inattendu, 3 `test.fail()` attendus (dette D8-15) · bundle 116,6 Kio gzip
    (< 300, chunk worker compris) · recalcul p95 181 ms (< 200) · chargement 4G max 1,76 s (< 2 s).**
- **Toutes les phases du plan 2 sont closes ; le projet est à l'arrêt.** Prochaines actions possibles,
  toutes sur décision explicite du commanditaire : (1) livraison = fusion de `claude/kycar-project-ffcplk`
  dans `main` + tag `v0.1.0` (avis de l'acceptance : prêt, réserves nommées) ; (2) phase 2.10 « finition
  visuelle » sur la dette D8-43 (`ACCEPTANCE.md` §8 = cahier des charges, ACC-06 puis ACC-16 en tête) ;
  (3) levée d'AC-01 (juridique 2dehands) avant tout câblage du provider réel ; (4) v2 de l'interface
  `DataProvider` (dettes D8-32, D8-36, composante T complète vers `fetchListingColumns`).

### 0bis. Plan 3 en cours (données fictives AutoScout24-conformes, ouvert le 2026-09-09)

Plan : `docs/plans/PLAN-3-fixture-data-mvp.md` · décisions D3-00…D3-20 : `reports/data/DATA-LEAD-DECISIONS.md`.

- ✅ 3.1 conception : `docs/data/DATA-MODEL.md` + `data/schema/` (90 champs source, JSON Schema strict,
  R3 par construction) ; `docs/data/DATASET-SPEC.md` + `docs/data/dataset-spec/*.json` (61 règles,
  26 anomalies à vérité terrain, 110 sondes).
- ✅ 3.2 générateur : `tools/dataset/`, `npm run data:gen|data:validate|data:check` ; fixtures commitées
  `data/fixtures/dev` (3 × 5 000) et `test` (3 × 20 000, 8,17 Mio gz) ; **porte G9a franchie**.
- ✅ 3.3 provider : `src/providers/adapters/as24/`, `src/providers/fixture/`, `src/providers/registry.ts`
  (bascule `?provider=fixture:test|fixture:dev|synthetic`, défaut `fixture:test`), `npm run test:contract`
  (50 cas × 3 providers) — fusionné ; finalisation sur fixtures réelles en cours (worktree `fixture-provider`).
- ⏳ 3.3 revue indépendante `data-review` (worktree `data-review`, Opus/high) → `tests/data/`,
  `reports/data/DATA-REVIEW.md`, porte G9b.
- ⏳ 2.10 finition visuelle (worktree `visual`, dette D8-43) → fusionnée à 3.5.
- À venir : 3.4 `data-fix` si revue rouge ; 3.5 `mvp-integrate` (étiquette `FIXTURE` dans l'UI et
  `/mentions` — **absente aujourd'hui**, `P1_EXPECTED` recalculé depuis les manifests, E2E complets)
  puis `acceptance` rev 3 (Fable/max), porte G9.
- Décomptes à `c973a6e` : unitaires 752, sondes de revue 1 097, contrat 50, bundle 129,15 Kio gzip.

## 1. Ce qu'est le projet

KYCAR = agrégateur analytique web du marché de l'occasion. Deux modes :
- **Mode 1** — survol : cartes par marque, zones par modèle, effectifs et fourchettes prix/année/km (écran A).
- **Mode 2** — marque/modèle choisi : histogrammes, nuage prix×année×km, détection d'aberrations
  (écran B), liste d'annonces (écran D).

Décisions de cadrage structurantes :
- **Découplage par l'interface `DataProvider`** : changer de source = changer d'adaptateur, pas d'app.
- **Aucun champ vendeur identifiant** dans le schéma (règle R3, RGPD structurelle ; garde
  `scanForbiddenFields` dans `src/types/validation.ts`).
- Source retenue : mode 1 réel via 2dehands/marktplaats (surface autorisée) ; mode 2 sur **données
  synthétiques étiquetées `SYNTHETIC`** jusqu'à financement (mode 2 non résolu gratuitement). Détail :
  `docs/research/DECISION-coordinateur-source.md`.

---

## 2. Documents qui font foi

| Document | Rôle |
|---|---|
| `docs/EXECUTION-LOG.md` | **Source de vérité de l'avancement** : états par phase, contraintes E1–E5, décisions, points ouverts O1–O17 |
| `docs/plans/ARCHITECTURE.md` | Pile, modèle de données, agrégation, **§7.1 = spec de chaque lot**, §9 = tensions d'exigences signalées |
| `docs/plans/DataProvider.ts` | Interface pivot gelée (copie dans `src/providers/DataProvider.ts`) |
| `docs/requirements/REQUIREMENTS.md` + annexes A/B/C | Exigences v1.0 (`draft-data-dictionary.md` = A/`EX-DATA`, `draft-screens.md` = B/`EX-SCR`, `draft-behaviour.md` = C/`EX-NAV/SRCH/CRUD/NFR`) |
| `DEV.md` + `src/**/README.md` | Disposition du code, contrat de chaque dossier, « Lancer l'application » |

**Règle d'autorité (R-A09)** : en conflit, formules → annexe A, disposition → annexe B, mécanismes/NFR → annexe C.

---

## 3. État git

- Branche de travail courante : **`claude/kycar-project-ffcplk`** (créée depuis `phase-2.4-build` le
  2026-09-08) — porte les phases 2.5, 2.6, 2.7, 2.8 et 2.9a complètes, VERTE, poussée. Branches
  `fix28/*` : branches de worktrees déjà fusionnées `--no-ff` (historique), worktrees supprimés.
- `phase-2.4-build` : état à la fin de 2.4 (historique). `main` : historique antérieur. **Aucune fusion
  vers `main`, aucun tag, aucune PR** (non demandés : `CLAUDE.md` §1.3).
- **Identité** : dépôt réglé sur le compte **perso** de l'utilisateur (`benitognt@gmail.com`), poussé
  sur `github.com/benitoGiunta/KYCAR.git` (perso). NB : la config git **globale** de la machine pointe
  par défaut sur l'email **pro** `benito.giunta@bstorm.be` — vérifier l'identité locale avant tout
  commit. `gh` a les deux comptes en keyring (`benitoGiunta` perso, `benitoGiunta86` pro). En session
  distante, le hook de fin de tour peut réclamer un committer `noreply@anthropic.com` : le dépôt impose
  l'identité perso, le conflit a été signalé au commanditaire, l'identité perso est conservée.
- `reports/e2e/results.json` est **suivi par git** et régénéré à chaque `npm run test:e2e` : il n'est
  commité qu'avec le rapport qui l'a produit (D8-33) ; sinon `git checkout -- reports/e2e/results.json`.

## 4. Ce qui est FAIT — phase 2.4 (9/9 lots)

Graphe (ARCHITECTURE §7.2) : `D1 → D2 → {D3 ∥ D4 ∥ D5} → {D6 ∥ D7} → D8`, `D9 ∥ dès D2`.

| Lot | Contenu | Emplacement |
|---|---|---|
| D1 | Échafaudage Vite+Preact+TS strict, ESLint, Vitest, tokens, worker, garde bundle | racine, `src/worker/`, `src/styles/` |
| D2 | 13 entités, colonnaire+sentinelles, validation R3, invariants I1–I8, codec `selectionHash`, chargeur référentiels, `DataProvider`, SHA-256 maison | `src/types/`, `src/providers/DataProvider.ts` |
| D3 | `SyntheticDataProvider` (100k, outliers injectés + vérité terrain, déterministe) | `src/providers/synthetic/` |
| D4 | Moteur (worker) : balayage, élagage, quantiles exacts, facettes, M1/M2/M3, densité, LRU. Bug corrigé (25 s→0,18 s) | `src/engine/`, `src/worker/aggregation.worker.ts` |
| D5 | Bandeau 77 filtres, codec URL canonique, T/R, corrections, routeur 6 routes, débounce/historique, écran G | `src/state/`, `src/components/filters/` |
| D6 | Écran A : cartes/zones, fourchette « centrale », tri, 6 états, CSV sans R3 | `src/screens/market/` |
| D7 | Écran B (histogrammes SVG, nuage G4 Canvas 2D, brossage) + écran D (liste, CSV sans R3) | `src/screens/distribution/`, `src/screens/listings/` |
| D8 | **Intégration** : coquille+routage, écrans C/E/F + `/mentions`, persistance (localStorage CRUD + IndexedDB cache), états dégradés, tests des 2 parcours + repli | `src/app.tsx`, `src/main.tsx`, `src/app/`, `src/screens/{compare,saved,followed}/`, `src/persistence/`, `src/orchestration/` |
| D9 | `TweedehandsDataProvider` : mode 1 réel, `servesMode2()=false`, R3 à l'ingestion, **zéro appel réseau** | `src/providers/tweedehands/` |

**Câblage (D8)** : `src/main.tsx` = `loadReferenceData()` + `SyntheticDataProvider` (défaut) +
`createAggregationEngine()` (Web Worker) + `DataController`. `src/app.tsx` = coquille S0, hôte unique
du `DataController` ; `src/app/navigation.ts::resolveView` route vers les écrans (mode 1 = agrégats de
base ; entrée mode 2 = `enterMode2(make,model)` qui élague AVANT M1/M2, décision O17). Le
`TweedehandsDataProvider` (mode 1 réel) est prêt à remplacer le synthétique comme provider par défaut.

---

## 5. Comment lancer / vérifier (aide-mémoire)

```bash
# racine du dépôt, branche claude/kycar-project-ffcplk
npm ci               # SEULEMENT si tsc/eslint "introuvables" (piège worktree, voir §7)
npm run dev          # sert l'app sur http://localhost:5173
npm run build        # tsc app + worker + vite build ; doit être 0/0
npm run lint         # eslint . ; vert
npm test             # suite unitaire (615) PUIS sondes de revue promues (798) — tout vert
npm run test:unit    # suite unitaire seule
npm run test:review  # sondes de revue seules (tsc review + vitest.review.config.ts)
npm run test:perf    # bancs de perf lourds (100k), à la demande
npm run size         # garde bundle < 300 Ko gzip (chunk worker inclus depuis DR-036)
```
Pendant `npm test`, des lignes `[size] FAIL …` apparaissent : ce sont les sondes D1 qui éprouvent la
garde de bundle sur des manifestes factices, pas un échec.

---

## 6. Ce qui RESTE

Rien dans le plan 2. Sur décision explicite du commanditaire uniquement :

- **Livraison** : fusion dans `main` + tag `v0.1.0` (`CLAUDE.md` §1.3 : jamais sans accord). Notes de
  version à écrire à partir de `ACCEPTANCE.md` §7–§9 (dettes visibles, réserves).
- **Phase 2.10 « finition visuelle »** (optionnelle) : dette de présentation D8-43 — ACC-02 (bandeau
  collant inerte, hauteur repliée > viewport), ACC-03 (régime compact de l'écran B), ACC-04, 06 (`sel`
  2D → écran D), 07–14, 16 (libellés bruts du bandeau générique). Cahier des charges : `ACCEPTANCE.md` §8.
- **AC-01** (juridique 2dehands) puis câblage du provider réel (DR-104, `it.fails` R-D9-21).
- **v2 de `DataProvider`** : `co2Source`, bloc 13 valeurs par agrégat (`MetricRange`), composante T vers
  `fetchListingColumns`, `facets()` mode 1 (D8-29/D8-37).

**Dettes admises à la clôture de 2.8** (`reports/REMEDIATION-2.8.md` §6.7 ; décisions dans
`FIX-LEAD-DECISIONS-2.8.md`) — chacune est écrite, et visible dans les tests quand une sonde peut la
porter :

| Dette | Nature | Décision | Marqueur |
|---|---|---|---|
| DR-104 / AC-01 | provider réel `TweedehandsDataProvider` non câblé tant que la validation juridique 2dehands n'est pas levée ; source par défaut `SYNTHETIC`, dit dans `/mentions` | D-18, D8-18 | `it.fails` R-D9-21 |
| DR-112 | `postal-regions-be.json` (Statbel/bpost) : source externe interdite par E5 en session — à fournir hors session | D8-18 | `it.fails` R-D2-16 |
| O15 `bodyTypes` | donnée « carrosseries par modèle » absente de tout référentiel ; bandeau « Carrosserie non appliquée » (D8-20) | D8-18 | — |
| EX-SRCH-12 | sémantique `eq` de la source non tranchable sans requête live (O7) | D8-18 | — |
| EX-SCR-9 | `NNxx` non affichable : périmètre R3 (D-14) | D8-18 | — |
| EX-SCR-95 (produit) | panneau « Assainissement KYCAR » sans effet sur une valeur affichée, hors budget | D8-15 | `test.fail()` ×3 (`responsive.spec.ts`) |
| Facettes mode 1 (architecture) | `(n)` et `(0)` des facettes exigent un jeu chargé, ce qu'O17 interdit en mode 1 ; tenues en mode 2 | D8-29 | — |
| EX-SCR-26 écran A (architecture) | suggestions « leave-one-out » non calculables en mode 1 (O17) ; tenues sur l'écran B | D8-37 | — |
| `co2Source` (interface gelée) | pas de colonne dans `DataProvider` v1 ; `UNKNOWN` déclaré | D8-32 | — |
| EX-DATA-68 (interface gelée) | bloc 3 × 13 valeurs par agrégat marque/modèle : `MetricRange` v1 = 6 champs | D8-36 | — |

**Dettes 2.6 levées en 2.8** : DR-034 (stats dans le worker), DR-082 (colonne TVA `vatDeductible`),
DR-114 (`INSUFFICIENT_*`), DR-105 (E15–E17 dans le garde R3), DR-132, DR-134, DR-143, DR-147,
`resultCount` du bandeau. Les sondes `it.fails` correspondantes sont redevenues `it` sans modification.

## 7. Leçons opérationnelles (ne pas les réapprendre)

1. **Worktrees isolés pour les lots parallèles, in-place pour les séquentiels.** Vagues D3∥D4∥D5∥D9
   puis D6∥D7 en worktrees git, fusionnées `--no-ff` une à une, worktree supprimé après.
2. **PIÈGE `npm ci` en worktree → vide le `node_modules` de la racine.** Vu deux fois. Si `tsc`/`eslint`
   « introuvables », faire `npm ci` dans la copie principale.
3. **Bancs de perf séparés** : `*.perf.test.ts` hors du `npm test` par défaut → `npm run test:perf`
   (`vitest.perf.config.ts`, mono-thread). Ils saturaient le heartbeat RPC de vitest.
4. **`testTimeout` = 30 s** (vite.config.ts) : les tests générant des datasets 100k débordaient 5 s.
5. **Merges propres** parce que chaque lot écrivait dans un dossier disjoint sans toucher aux barrels
   partagés ; l'intégration (barrels/routes) était le travail de D8. Garder cette discipline.
6. **Morts au reset de session** : plusieurs agents (D3/D4/D5, puis D8) sont morts à la frontière de
   reset. Parade : **commits incrémentaux fréquents** (seul le commité survit) ; le WIP d'un agent mort
   est dans son worktree / la copie in-place → le commiter, tester, finir. Il n'existe pas d'outil de
   reprise d'un sous-agent dans ce build ; relancer un agent « de finition » branché sur la base enrichie.
7. **`@types/node`** est installé en devDep et `node` est dans les `types` du `tsconfig.json` (nécessaire
   à `vite.config.ts` et à `src/orchestration/reference-fs.ts`, chargeur Node de test). Le code
   navigateur ne doit PAS utiliser `fs`/`process` — charger les référentiels par `fetch('/reference/…')`
   (via le plugin Vite `kycar-reference-data`).
8. **Lien symbolique `node_modules` dans un worktree** : le créer (`ln -s <racine>/node_modules`) au lieu
   de `npm ci`, et **le supprimer (`rm`) avant `git worktree remove`** — sinon le `node_modules` de la
   racine est détruit ou remplacé par un lien sur lui-même (vu le 2026-09-08, D-50).
9. **Fiches de rôle `.claude/agents/*.md`** : chargées au démarrage de session seulement. En session
   ouverte, lancer le type générique avec le paramètre `model` et imposer l'effort dans la mission
   (`CLAUDE.md` §3).
10. **Sondes de revue = contrat de remédiation** : une sonde rouge est un constat, la correction la fait
    passer sans la modifier ; toute modification de sonde est justifiée par écrit (D-31) et contrôlée par
    un vérificateur indépendant. Une dette consignée devient `it.fails` annoté, jamais `skip` (D-49).
11. **Recette E2E : jamais de serveur réutilisé en silence.** Un `vite preview` résiduel d'un autre arbre
    sur le port 4180 a été réutilisé par Playwright (`reuseExistingServer: true`), qui a recetté un build
    étranger sans le dire. Désormais `reuseExistingServer: false` + `--strictPort` : un port occupé fait
    échouer bruyamment — tuer le processus (`ss -ltnp | grep 4180`) ou changer `KYCAR_E2E_PORT`.
12. **Un seul agent à la fois lance la suite E2E** (port unique, 4 cœurs) ; un correcteur n'a droit qu'aux
    tests qu'il a touchés (`npx playwright test -g "<motif>"`), sur autorisation explicite.
13. **Garder un correcteur ouvert par répertoire jusqu'à la fin de la vague de câblage** (D8-28) et
    **trancher chaque point « hors périmètre » des rapports avant de lancer le vérificateur** (D8-30/31/36/37) ;
    relancer le vérificateur par message sur le même agent pour les révisions (delta seulement si le
    code n'a pas changé).

---

## 8. Contraintes actives (non négociables)

| # | Contrainte |
|---|---|
| E1 | Aucune création de compte / saisie de credential par les agents |
| E2 | ~~Aucun modèle Fable~~ **levée le 2026-09-08** — choix modèle/effort par rôle : `CLAUDE.md` § Organisation en agents |
| E3 | Autonomie totale : aucune info supplémentaire de l'utilisateur |
| E4 | Toute hypothèse non vérifiable écrite comme hypothèse, jamais comme un fait |
| E5 | Requêtes `www.autoscout24.be` limitées aux 17 préfixes autorisés ; D9 ne fait aucun appel réseau live ; tout accès data respecte robots.txt/CGU/RGPD |

**R3** (RGPD, structurel) : aucun champ vendeur identifiant (nom, téléphone, adresse, code postal
exact) dans le schéma ni le stockage. `sellerType` (particulier/pro) et `regionCode` (NUTS-2) OK.

---

## 9. Definition of Done — phases 2.4 à 2.9 ATTEINTES

- ✅ 2.4 : D1–D9 fusionnés, critères vérifiés par exécution.
- ✅ 2.5 : S1–S4 de PLAN-2 §2.5 atteints (`reports/DEV-REVIEW.md` §7) ; 783 sondes, 116 critères jugés.
- ✅ 2.6 : S1–S4 de PLAN-2 §2.6 atteints (`reports/REMEDIATION.md` §6) ; porte G5.
- ✅ 2.7 : `reports/FINAL-VERIFICATION.md`, 485 exigences cotées, porte G6 (juge sans corriger).
- ✅ 2.8 : S1–S4 de PLAN-2 §2.8 atteints (`reports/REMEDIATION-2.8.md` rev 3 §8) ; **porte G7 franchie** :
  zéro NON COUVERTE, zéro PARTIELLE sans décision écrite, dix dettes admises nommées.
- ✅ 2.9 : S1–S4 de PLAN-2 §2.9 atteints (`reports/ACCEPTANCE.md` rev 2 §1, §9) ; **porte G8 franchie** :
  E2E verts sur 3 projets, 0 violation axe A/AA, budgets navigateur tenus, ACC-01 corrigé.
- ✅ build 0/0, lint vert, `npm test` vert (675 + 1 091), E2E 264 tests / 0 échec inattendu, bundle
  116,6 Kio gzip, recalcul p95 181 ms, 4G max 1,76 s.
- ✅ `docs/EXECUTION-LOG.md`, `CLAUDE.md`, `README.md`, `DEV.md`, ce handoff à jour ; tout commité et
  poussé sur `claude/kycar-project-ffcplk` (dépôt perso `benitoGiunta/KYCAR`).
- ⏸️ **Arrêt.** Aucune fusion vers `main`, aucun tag, aucune PR sans accord explicite du commanditaire.
