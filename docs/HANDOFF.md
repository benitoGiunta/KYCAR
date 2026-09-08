# HANDOFF — reprise du projet KYCAR par un nouvel agent

**Écrit le 2026-09-08 par l'agent coordinateur, à la demande de l'utilisateur (« arrête l'exécution,
fais un fichier de handoff self-explanatory »).** Ce fichier suffit à reprendre le travail sans aucun
contexte conversationnel. Lis-le en entier, puis lis `docs/EXECUTION-LOG.md`.

---

## 0. Comment utiliser ce fichier

1. Lis ce HANDOFF en entier.
2. Ouvre **`docs/EXECUTION-LOG.md`** — c'est **LA source de vérité de l'avancement**, phase par phase.
   Ce HANDOFF le résume à un instant T ; en cas de doute, le journal fait foi.
3. Vérifie l'état git (section 3) et fais tourner les commandes de la section 11 pour confirmer la base.
4. La seule tâche restante de la phase 2.4 est **finir le lot D8** (section 6). Commence par le
   déblocage de la section 6.2.
5. **NE lance PAS la phase 2.5 (revue)** ni la suite sans feu vert explicite de l'utilisateur : le
   périmètre autorisé s'arrête à la fin de 2.4.

---

## 1. Ce qu'est le projet (contexte minimal)

KYCAR = agrégateur analytique web du marché de l'occasion. Deux « modes » d'usage :
- **Mode 1** — survol du marché : cartes par marque, zones par modèle, nombre d'offres et fourchettes
  de prix/année/km (écran A).
- **Mode 2** — distributions fines quand une marque/un modèle est choisi : histogrammes, nuage
  prix×année×km, détection d'aberrations (écran B), liste d'annonces (écran D).

Deux chantiers :
- **Chantier 1** — recherche exhaustive « comment charger les données ». **CLOS.** Conclusion :
  aucune voie gratuite + autonome + licite vers l'inventaire AutoScout24 frais ; mode 1 réalisable
  gratuitement via 2dehands/marktplaats (surface `__NEXT_DATA__` autorisée), mode 2 **non résolu**
  gratuitement (même biais publicitaire partout) → données synthétiques étiquetées jusqu'à financement.
  Livrable : `docs/research/DATA-ACQUISITION-REPORT.md`.
- **Chantier 2** — l'application. Exigences gelées v1.0 (485 exigences), architecture figée, en cours
  de développement (phase 2.4).

Décisions de cadrage qui expliquent l'architecture :
- **Les deux chantiers sont découplés par l'interface `DataProvider`** : changer de source = changer
  d'adaptateur, pas d'application.
- **Aucun champ vendeur identifiant** n'entre dans le schéma (règle R3, RGPD structurelle).
- Voir `docs/research/DECISION-coordinateur-source.md` (décision de source corrigée après audit).

---

## 2. Documents qui font foi (à lire selon le besoin)

| Document | Rôle |
|---|---|
| `docs/EXECUTION-LOG.md` | **Source de vérité de l'avancement.** États par phase, contraintes E1–E5, décisions, points ouverts O1–O17 |
| `docs/plans/ARCHITECTURE.md` | Pile technique, modèle de données, stratégie d'agrégation, **§7.1 = spec de chaque lot D1–D9**, §9 = tensions d'exigences signalées |
| `docs/plans/DataProvider.ts` | L'interface pivot gelée (copie verbatim dans `src/providers/DataProvider.ts`) |
| `docs/requirements/REQUIREMENTS.md` | Index normatif v1.0 (485 exigences) → 3 annexes |
| `docs/requirements/draft-data-dictionary.md` | Annexe A : dictionnaire de données, `EX-DATA-*` |
| `docs/requirements/draft-screens.md` | Annexe B : écrans, `EX-SCR-*` |
| `docs/requirements/draft-behaviour.md` | Annexe C : navigation/recherche/CRUD/NFR, `EX-NAV/SRCH/CRUD/NFR-*` |
| `docs/plans/DATA-ACQUISITION-REPORT.md`… | (dans `docs/research/`) rapport de décision du chantier 1 |
| `DEV.md` + `src/**/README.md` | Disposition du code, contrat de chaque dossier |

**Règle d'autorité (R-A09)** : en cas de conflit, les **formules** font foi en annexe A, la
**disposition** en annexe B, les **mécanismes/NFR** en annexe C.

---

## 3. État git au moment du handoff

- Branche de travail : **`phase-2.4-build`** (branchée sur `main`). C'est là que tout le développement
  2.4 est fusionné. **Tip = `910fa15`, VERTE** : `npm run build` 0/0, `npm run lint` vert,
  `npm test` = **502 tests** (vérifié au merge D6 `8f023f1` ; `910fa15` ne change que le journal).
- Branche **`wip/d8-integration`** : le **travail partiel de D8**, sauvegardé avant l'arrêt.
  **Build ROUGE** (voir 6.2). Ne pas fusionner tel quel.
- `main` : historique du chantier 1 + docs. Le dev 2.4 n'y est pas encore (pas de PR demandée).
- Rien n'est poussé (`git push` jamais fait ; l'utilisateur ne l'a pas demandé).

Pour reprendre : rester sur `phase-2.4-build`, repartir de la base verte, et **récupérer le WIP D8**
depuis `wip/d8-integration` (cherry-pick / merge / ou relire pour réécrire — au choix, voir 6).

---

## 4. Ce qui est FAIT (phase 2.4)

Graphe de dépendances (figé en 2.3, ARCHITECTURE §7.2) :
`D1 → D2 → {D3 ∥ D4 ∥ D5} → {D6 ∥ D7} → D8`, avec **D9 ∥ dès D2**.

| Lot | Contenu | État |
|---|---|---|
| **D1** | Échafaudage Vite+Preact+TS strict, ESLint, Vitest, tokens design, worker PING/PONG, garde bundle 300 Ko | ✅ fusionné |
| **D2** | 13 entités typées, modèle colonnaire + sentinelles, validation R3, invariants I1–I8, codec `selectionHash`/`localDatasetKey`, chargeur référentiels, `DataProvider` intégré, SHA-256 maison | ✅ fusionné |
| **D3** | `SyntheticDataProvider` (100k annonces, outliers injectés + **vérité terrain** `getGroundTruthOutliers()`, déterministe, `SYNTHETIC`) | ✅ fusionné |
| **D4** | Moteur d'agrégation (worker) : balayage, index/élagage, quantiles exacts, facettes, M1/M2/M3, densité, LRU 32. **Bug réel corrigé** (agrégation 25 s→0,18 s). Vérifié sur dataset D3 | ✅ fusionné |
| **D5** | Bandeau 77 filtres, codec URL canonique, scission T/R, corrections `EX-NAV-21`, routeur maison 6 routes, contrôleur débounce/historique, écran G (sélecteur 295 marques/4955 modèles) | ✅ fusionné (cœur + UI) |
| **D6** | Écran A : cartes-marques/zones-modèles, fourchette « centrale » `[p05,p95]`, tri, 6 états, CSV sans R3, montage du ScreenG de D5 | ✅ fusionné |
| **D7** | Écran B : histogrammes G1–G3 (SVG), nuage G4 (Canvas 2D, échantillonnage déterministe, brossage, liaison croisée), G5–G15, écran D (liste, pagination 50, CSV sans R3). Perf nuage p95 5,99 ms, 100 % fenêtres ≥30 img/s | ✅ fusionné |
| **D9** | `TweedehandsDataProvider` : mode 1 réel (`__NEXT_DATA__` autorisé), `servesMode2()=false`, R3 à l'ingestion, mapping vocab 2dehands→KYCAR, **zéro appel réseau** | ✅ fusionné |

Points de montage exportés (l'hôte = D8 les assemble) :
- `src/state/` : `matchRoute`/`buildPath` (routeur), `InteractionController` (débounce/historique).
- `src/components/filters/` : `FilterBand`, `ScreenG`.
- `src/screens/market/` : `MarketScreen` (reçoit un `ScreenAState` via `deriveScreenAState`).
- `src/screens/distribution/` : `DistributionScreen` ; `src/screens/listings/` : `ListingsScreen`.
- `src/engine/` : client thread principal `client.ts` + `index.ts` (calcul dans le worker).
- `src/providers/synthetic/` (défaut dev) et `src/providers/tweedehands/` (mode 1 réel).
- `src/orchestration/` : **existe uniquement sur `wip/d8-integration`** (plumbing de D8, voir 6).

---

## 5. Ce qui RESTE : uniquement le lot D8 (intégration finale)

C'est le **dernier lot de la phase 2.4**. Spec complète : `docs/plans/ARCHITECTURE.md` §7.1 « D8 ».
D8 assemble tout ce qui précède en une application qui tourne.

### 5.1 Périmètre de D8
- **Coquille S0 + routage** : câbler `src/app.tsx`, monter le bon écran par route (6 routes,
  redirections canoniques `EX-SCR-140`), rendu = fonction pure de l'URL.
- **Orchestration des données** : ouvrir le snapshot du provider, servir les **agrégats de base
  précalculés** (mode 1) d'abord, charger les colonnes d'annonces **seulement à l'entrée en mode 2**.
  **DÉCISION O17 (perf, impérative)** : ne déclencher M1/M2 et les distributions fines qu'**APRÈS
  élagage marque/modèle**, jamais sur les 100k complets (sinon le budget 200 ms saute — voir O17).
- **Chargement progressif** `EX-NFR-9` (1er affichage mode 1 ≤ 2000 ms en 4G).
- **Écrans restants** : C (comparaison), E (recherches sauvegardées), F (modèles suivis), `/mentions`.
- **CRUD complet** : IndexedDB (recherches ≤ 50, modèles suivis ≤ 30, historique 10 FIFO, cache
  snapshot) + `localStorage` (préférences, **concurrence inter-onglets par événement `storage`**
  `EX-CRUD-19`), **migration `schemaVersion`** `EX-CRUD-18`.
- **États dégradés** (6 par écran), échec provider (`EX-NFR-21` 3 réessais 1s/2s/4s, `EX-NFR-22`
  repli sur cache, `EX-NFR-23` erreur ≠ résultat vide).
- **Campagnes a11y + perf globales**.

### 5.2 Critères de succès de D8 (à VÉRIFIER par exécution)
1. `npm run build` 0/0 ; `npm run lint` vert ; `npm test` (les **502 existants restent verts**) ;
   `npm run size` < 300 Ko gzip.
2. 1er affichage mode 1 ≤ 2000 ms en 4G simulée (`EX-NFR-9`).
3. axe-core 0 violation A/AA sur écrans A et B (`EX-NFR-16`) — ou tests a11y de structure/clavier si
   axe-core n'est pas installable sans dépendance interdite.
4. Les **2 parcours cibles** de bout en bout (test d'intégration) : (i) survol marché → cartes ;
   (ii) marque/modèle → distributions + nuage + liste.
5. Repli `EX-NFR-22` sur échec provider simulé.
6. `npm run dev` sert une **app réellement fonctionnelle** (config `.claude/launch.json` créée par D1).

---

## 6. Reprise de D8, pas à pas

### 6.1 Récupérer le travail partiel déjà fait
D8 a démarré (in-place sur `phase-2.4-build`) puis est mort au reset de session. Son WIP est sur
**`wip/d8-integration`** (commit unique au-dessus de `910fa15`). Il contient :
- `src/orchestration/reference-loader.ts`, `reference-fs.ts`, `engine-inprocess.ts`,
  `data-controller.ts` — plumbing de chargement des référentiels + glue moteur.
- Une modif de `vite.config.ts` : **plugin Vite `kycarReferenceData`** qui sert `data/reference/`
  sous `/reference/*` en dev et copie l'arbre dans `dist/reference/` au build (ne gonfle pas le
  bundle — bonne idée à garder).

Deux options : (a) `git merge wip/d8-integration` puis corriger le bloquant 6.2 et continuer ; ou
(b) relire ces fichiers pour t'en inspirer et réécrire proprement. Recommandé : (a), le plumbing est sain.

### 6.2 BLOQUANT à lever en premier — types Node absents
D8 est mort **précisément là-dessus**. Le build est rouge parce que `src/orchestration/reference-fs.ts`
et `vite.config.ts` utilisent `node:fs`, `node:path`, `process`, `__dirname` alors que **`@types/node`
n'est pas installé** (D1 avait volontairement gardé l'outillage minimal ; D3 puis D8 ont buté dessus).

**Décision recommandée (à valider) :** installer `@types/node` en **devDependency** — c'est un paquet
de **types seulement**, pas une lib runtime tierce, donc il ne viole PAS l'interdiction des libs
graphes/state/routing de l'architecture. Puis **le cantonner** pour ne pas polluer le code navigateur :
- soit un `tsconfig.node.json` séparé couvrant `vite.config.ts`, `tools/**`, `src/orchestration/*fs*`,
  avec `"types": ["node"]`, le reste de l'app restant sans types Node ;
- soit s'assurer que le code **navigateur** charge les référentiels par `fetch('/reference/…')` (via le
  plugin Vite ci-dessus) et non par `fs` — le `fs` ne servant qu'aux tests/outils Node.

Objectif : que le code d'application (navigateur) ne dépende jamais de `fs`/`process`, et que seuls les
fichiers d'outillage/tests aient les types Node. **Signale ce choix, ne le fais pas en silence.**

### 6.3 Comment travailler (conventions du projet — les suivre)
- **Modèle/effort par tâche, JAMAIS Fable** (contrainte E2). D8 mérite Opus (capstone).
- D8 est **séquentiel** (dernier lot) : le faire **in-place sur `phase-2.4-build`**, PAS en worktree
  (voir le piège node_modules en 7).
- **Commiter en incrémental et souvent** : les resets de session tuent les agents ; seul le commité
  survit (c'est arrivé à D3/D4/D5 et D8). Messages en anglais, sans backtick, terminés par
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Réutiliser** les composants exportés (section 4), ne pas les dupliquer. Si un fichier d'un autre
  lot doit être retouché pour l'intégration, le faire **a minima** et le **signaler**.
- Windows (PowerShell + Bash) : **pas de heredoc bash avec backticks** (corruption shell déjà subie) ;
  écrire les fichiers avec les outils Write/Edit, pas `echo`/`node -e`.
- **Vérifier par exécution**, pas par relecture. Rapporter les chiffres réels. **Ne jamais maquiller**
  un critère non tenu — le signaler honnêtement (cf. O17).

---

## 7. Leçons opérationnelles chèrement acquises (ne pas les réapprendre)

1. **Worktrees isolés pour les lots parallèles, in-place pour les lots séquentiels.** La vague
   D3∥D4∥D5∥D9 puis D6∥D7 a tourné en worktrees git (`Agent … isolation:"worktree"`), fusionnés un à
   un dans `phase-2.4-build` avec `git merge --no-ff`, puis worktree supprimé + branche effacée.
2. **PIÈGE `npm ci` en worktree → vide le `node_modules` de la racine.** Vu deux fois. Après une vague
   de worktrees, si `tsc`/`eslint` sont « introuvables », faire **`npm ci`** dans la copie principale
   pour réinstaller. C'est pour ça que D8 (séquentiel) tourne in-place et **ne lance pas `npm ci`**.
3. **Bancs de perf séparés** de la suite par défaut : `*.perf.test.ts` sont exclus de `npm test`
   (config `vitest.perf.config.ts`, mono-thread, gros timeout) et lancés via **`npm run test:perf`**.
   Raison : un banc 100k de ~106 s affamait le heartbeat RPC de vitest et provoquait de faux timeouts.
4. **`testTimeout` par défaut = 30 s** (vite.config.ts) car plusieurs tests génèrent des datasets 100k
   qui débordent 5 s sous charge parallèle (temps CPU réel ~2 s).
5. **Merges propres** parce que chaque lot écrit dans un dossier disjoint et **ne touche AUCUN barrel
   partagé** ; l'intégration des barrels/routes est le travail de D8. Garder cette discipline.
6. **Reprise d'un agent mort** : il n'existe pas d'outil `SendMessage` pour reprendre un sous-agent
   dans ce build. À la place : le travail est dans le worktree (ou in-place) → le commiter, le tester,
   le finir soi-même si petit, ou relancer un agent « de finition » branché sur la base enrichie.

---

## 8. Points ouverts / dettes (pour la phase 2.6, PAS pour 2.4)

Détail complet dans `docs/EXECUTION-LOG.md` § « Points ouverts ». Les plus structurants :
- **O17 (perf, EX-NFR-5)** : le budget 200 ms est tenu sur tous les chemins de production (sélection
  élaguée 37 ms, facettes 31 ms, sélection vide précalculée) mais **pas** sur un recalcul M1/M2
  **complet non filtré** (~720–985 ms p95 à 100k). L'architecture route ce cas (M1/M2 = mode 2, après
  élagage). **D8 doit garantir que l'app ne déclenche jamais M1/M2 avant élagage.** À verrouiller/prouver.
- **O13** : `ingestFlags` gelé sur 16 bits (`Uint16Array`) ; le décompte 14 vs 17 drapeaux
  (annexe A `EX-DATA-45` vs interface) est arbitré en 2.6.
- **O14** : table NUTS-2 BE extrapolée en code (fichiers région absents du dépôt), dette `EX-DATA-53`.
- **O15** : `Model.bodyTypes` vide (donnée absente de `taxonomy.json`) → filtre/regroupement
  Carrosserie doit **se dégrader proprement**, pas planter.
- **O16** : « 13 vs 14 entités » cosmétique.
- **Tensions d'exigences signalées par l'architecture** (`ARCHITECTURE §9`) et par D7 : « rotation »
  d'`EX-NFR-8` vs G4 en projection 2D (§9.1) ; plafond nuage **5 000** (`EX-DATA-100`) vs 20 000 de
  l'annexe B = **code mort** (§9.2) ; `EX-NFR-9` marge mince (§9.3) ; `EX-DATA-101` (pas régulier sans
  PRNG) vs `EX-DATA-100bis` (xoshiro graine) sur l'échantillonnage ; listes de graphes de liaison
  croisée `EX-SCR-158` vs `EX-SCR-184` incohérentes. **Tout ça se tranche en 2.6, pas en 2.4.**

---

## 9. Contraintes actives (non négociables)

| # | Contrainte |
|---|---|
| E1 | Aucune création de compte, aucune saisie de credential par les agents (règle de sécurité) |
| E2 | **Aucun modèle Fable, sur aucune tâche** (consigne utilisateur) |
| E3 | Autonomie totale : aucune information supplémentaire de l'utilisateur |
| E4 | Toute hypothèse non vérifiable est écrite comme hypothèse, jamais présentée comme un fait |
| E5 | Requêtes sur `www.autoscout24.be` limitées aux 17 préfixes autorisés par le robots.txt ; le reste interdit. **D9 ne fait aucun appel réseau live** ; tout accès data respecte robots.txt/CGU/RGPD |

Règle **R3** (RGPD, structurelle) : aucun champ vendeur identifiant (nom, téléphone, adresse, code
postal exact) n'entre dans le schéma. `sellerType` (particulier/pro) et `regionCode` (NUTS-2) sont OK.
Le garde `scanForbiddenFields` de `src/types/validation.ts` le prouve à l'ingestion.

---

## 10. Périmètre autorisé

- Le run en cours était : **« lance la phase 2.4 uniquement »**. Il reste **D8** à finir pour clore 2.4.
- **NE PAS enchaîner sur la phase 2.5** (revue de développement), 2.6 (remédiation) ni 2.7
  (vérification finale) sans **feu vert explicite de l'utilisateur**.
- L'utilisateur travaille de façon autonome/asynchrone ; il attend un point d'étape à chaque jalon.

---

## 11. Commandes (aide-mémoire)

```bash
# À la racine C:\dev\appCar, sur la branche phase-2.4-build
npm ci               # réinstalle les deps si tsc/eslint "introuvables" (piège worktree)
npm run build        # tsc app + tsc worker + vite build ; doit être 0 erreur / 0 warning
npm run lint         # eslint . ; doit être vert (ignore .claude/, dist/, node_modules/, scripts/)
npm test             # vitest run (suite par défaut, ~500+ tests, sans les bancs de perf)
npm run test:perf    # bancs de perf lourds (100k), mono-thread, à la demande
npm run size         # garde bundle initial < 300 Ko gzip (EX-NFR-10)
npm run dev          # sert l'app (objectif de D8 : qu'elle soit fonctionnelle)
```

Récupérer le WIP D8 :
```bash
git checkout phase-2.4-build
git merge wip/d8-integration     # puis lever le bloquant types Node (section 6.2), continuer D8
```

---

## 12. Definition of Done de la phase 2.4

- D8 fusionné dans `phase-2.4-build`, tous les critères de succès 5.2 vérifiés par exécution.
- Base verte : build 0/0, lint vert, `npm test` vert, `npm run size` sous budget.
- `npm run dev` sert une application fonctionnelle ; les 2 parcours cibles se déroulent de bout en bout.
- `docs/EXECUTION-LOG.md` mis à jour (D8 VALIDÉ, phase 2.4 close).
- **Arrêt.** Rapport à l'utilisateur, attente de son feu vert pour 2.5.
