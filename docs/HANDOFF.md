# HANDOFF — reprise du projet KYCAR par un nouvel agent

**Mis à jour le 2026-09-08 (clôture 2.6) par l'agent coordinateur.** Ce fichier suffit à reprendre le travail sans
aucun contexte conversationnel. Lis-le en entier, puis lis `docs/EXECUTION-LOG.md` (source de vérité
de l'avancement).

---

## 0. TL;DR — où en est le projet

- **Chantier 1** (comment charger les données) : **CLOS.** Rapport : `docs/research/DATA-ACQUISITION-REPORT.md`.
- **Chantier 2** (l'application) :
  - Exigences **v1.1** (v1.0 gelée + 32 amendements 2.6 tracés `[amendée 2.6 — D-xx]`), architecture
    figée et amendée (`makeId` Int32, `ingestFlags` Uint32, `unsupportedFilterIds`).
  - **Phase 2.4 (développement D1–D9) : COMPLÈTE.**
  - **Phase 2.5 (revue de développement) : VALIDÉE** — 10 revues, 190 constats → 160 consolidés
    (18 BLOQUANT, 86 MAJEUR, 56 MINEUR), 783 sondes exécutables (`reports/DEV-REVIEW.md`).
  - **Phase 2.6 (remédiation) : VALIDÉE** — 51 décisions du fix-lead
    (`reports/remediation/FIX-LEAD-DECISIONS.md`), 8 correcteurs, 148 constats corrigés, 11 dettes
    consignées (8 portées par une sonde `it.fails`), vérification indépendante `reports/REMEDIATION.md`.
  - **Build 0/0 · lint 0 · `npm test` = 615 tests unitaires + 798 sondes de revue, tous verts ·
    bundle < 300 Ko gzip (chunk worker compris) · recalcul p95 < 200 ms même non élagué.**
- **Reste : la phase 2.7 (vérification finale, `final-check` Fable/max), NON lancée — feu vert
  du commanditaire requis.** Puis, hors plan : levée d'AC-01 (juridique 2dehands) avant tout câblage
  du provider réel (DR-104, dette D-18).

---

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
  2026-09-08) — porte les phases 2.5 et 2.6 complètes, VERTE, poussée.
- `phase-2.4-build` : état à la fin de 2.4 (historique). `main` : historique antérieur. Aucune fusion
  vers `main`, aucune PR (non demandées).
- **Identité** : dépôt réglé sur le compte **perso** de l'utilisateur (`benitognt@gmail.com`), poussé
  sur `github.com/benitoGiunta/KYCAR.git` (perso). NB : la config git **globale** de la machine pointe
  par défaut sur l'email **pro** `benito.giunta@bstorm.be` — vérifier l'identité locale avant tout
  commit sur un projet perso. `gh` a les deux comptes en keyring (`benitoGiunta` perso, `benitoGiunta86` pro).
- `main` : historique antérieur. La fusion de 2.4 dans `main` / la PR ne sont PAS faites (non demandées).

---

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

## 6. Ce qui RESTE (feu vert utilisateur requis)

- **2.7 — Vérification finale** (`reports/FINAL-VERIFICATION.md`) : un agent `final-check`
  **Fable/max**, indépendant, reprend `REQUIREMENTS.md` v1.1 exigence par exigence, lance l'app et
  exerce les deux parcours cibles. Non lancée.

**Dettes consignées à la clôture de 2.6** (détail : `reports/REMEDIATION.md` §4, décisions
`FIX-LEAD-DECISIONS.md`) — chacune porte une sonde `it.fails` annotée qui se signalera d'elle-même
quand la dette sera levée :

| Dette | Nature | Décision |
|---|---|---|
| DR-034 (MAJEUR) | `GROUPSTAT`/`NTILE`/paliers/`R²` calculés par D7 sur le thread principal, pas dans le worker (`EX-DATA-83bis` non tenue) | D-17 |
| DR-104 (MAJEUR) | provider réel `TweedehandsDataProvider` non câblé tant qu'AC-01 (validation juridique 2dehands) n'est pas levée ; source par défaut `SYNTHETIC`, dit dans `/mentions` | D-18 |
| DR-114 | verdicts `INSUFFICIENT_DATA`/`INSUFFICIENT_SPREAD` par annonce (vocabulaire gelé 6 → 8 codes) | D-45 |
| DR-082 (MAJEUR, colonne « TVA » seule) | aucun champ `taxDeductible` dans l'interface gelée ; Conso. et CO₂ sont livrées | D-38 |
| DR-105, DR-112, DR-132, DR-134, DR-147, DR-143 | RGPD E15–E17 hors R3, `postal-regions-be.json` (source externe interdite par E5), libellés `zipr`, suggestions Levenshtein, mention des graphes A-08, grille compacte 4 lignes | §6.5 DEV-REVIEW, D-40, D-49 |

**Points à instruire en 2.7** : D-51 (seuil d'implausibilité de Σ ≠ seuils par cellule d'analyse :
`outlierEvaluatedCount` majoré par l'échantillon purgé des seules sentinelles absolues) ; O15
(`Model.bodyTypes` toujours vide, donnée à fournir) ; `EX-NFR-16`/`EX-NFR-6` (axe-core et rendu réel,
non exécutables en environnement node sans dépendance interdite).

---

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

## 9. Definition of Done — phases 2.4, 2.5, 2.6 ATTEINTES

- ✅ 2.4 : D1–D9 fusionnés, critères vérifiés par exécution.
- ✅ 2.5 : S1–S4 de PLAN-2 §2.5 atteints (`reports/DEV-REVIEW.md` §7) ; 783 sondes, 116 critères jugés.
- ✅ 2.6 : S1–S4 de PLAN-2 §2.6 atteints (`reports/REMEDIATION.md` §6) ; porte G5 : zéro BLOQUANT/MAJEUR
  ouvert — trois MAJEUR en dette **motivée et consignée** (DR-034, DR-082 colonne TVA, DR-104).
- ✅ build 0/0, lint vert, `npm test` vert (615 + 798), bundle < 300 Ko gzip, perf p95 < 200 ms.
- ✅ `docs/EXECUTION-LOG.md`, `CLAUDE.md`, ce handoff à jour ; tout commité et poussé sur
  `claude/kycar-project-ffcplk` (dépôt perso `benitoGiunta/KYCAR`).
- ⏸️ Arrêt. Prochaine action = **phase 2.7**, sur feu vert de l'utilisateur uniquement.
