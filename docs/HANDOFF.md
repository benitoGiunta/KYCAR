# HANDOFF — reprise du projet KYCAR par un nouvel agent

**Mis à jour le 2026-09-08 par l'agent coordinateur.** Ce fichier suffit à reprendre le travail sans
aucun contexte conversationnel. Lis-le en entier, puis lis `docs/EXECUTION-LOG.md` (source de vérité
de l'avancement).

---

## 0. TL;DR — où en est le projet

- **Chantier 1** (comment charger les données) : **CLOS.** Rapport : `docs/research/DATA-ACQUISITION-REPORT.md`.
- **Chantier 2** (l'application) :
  - Exigences v1.0 gelées (485), architecture figée (`docs/plans/ARCHITECTURE.md`).
  - **Phase 2.4 (développement D1–D9) : COMPLÈTE — 9 lots sur 9.** Application fonctionnelle.
  - **Build 0/0 · lint 0 · 536 tests verts · bundle 68/300 Ko gzip · `npm run dev` OK sur 7 vues.**
- **La seule chose restante = les phases de qualité, NON lancées** (voir §6). **Ne PAS les démarrer
  sans feu vert explicite de l'utilisateur** : le périmètre autorisé s'arrêtait à la fin de 2.4.

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

- Branche de travail : **`phase-2.4-build`** — tout le développement 2.4 y est fusionné, VERTE.
- Depuis le 2026-09-08 : phases 2.5/2.6 sur **`claude/kycar-project-ffcplk`**, créée depuis `phase-2.4-build`.
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
# racine C:\dev\appCar, branche phase-2.4-build
npm ci               # SEULEMENT si tsc/eslint "introuvables" (piège worktree, voir §7)
npm run dev          # sert l'app sur http://localhost:5173 (7 vues fonctionnelles)
npm run build        # tsc app + worker + vite build ; doit être 0/0
npm run lint         # eslint . ; vert
npm test             # vitest run ; 536 tests (sans les bancs de perf)
npm run test:perf    # bancs de perf lourds (100k), à la demande
npm run size         # garde bundle < 300 Ko gzip
```

---

## 6. Ce qui RESTE (hors périmètre du run terminé — feu vert utilisateur requis)

Les phases de qualité du plan, **non lancées** :
- **2.5 — Revue de développement** : relire les 9 lots (`reports/DEV-REVIEW.md`).
- **2.6 — Remédiation** : traiter les points ouverts et tensions (ci-dessous) (`reports/REMEDIATION.md`).
- **2.7 — Vérification finale** (`reports/FINAL-VERIFICATION.md`).

**À traiter en 2.6** (détail dans `docs/EXECUTION-LOG.md` § Points ouverts) :
- **O17 (perf, EX-NFR-5)** : budget 200 ms tenu sur les chemins de prod (élagué 37 ms, facettes 31 ms,
  vide précalculé) mais pas sur un recalcul M1/M2 complet non filtré (~720–985 ms/100k). D8 garantit
  que M1/M2 ne tourne qu'après élagage ; à re-vérifier formellement.
- **O13** : `ingestFlags` sur 16 bits ; décompte 14 vs 17 drapeaux (annexe A vs interface) à arbitrer.
- **O14** : table NUTS-2 BE extrapolée en code (fichiers région absents), dette `EX-DATA-53`.
- **O15** : `Model.bodyTypes` vide (donnée absente) → filtre Carrosserie se dégrade proprement.
- Tensions d'exigences (ARCHITECTURE §9 + rapports D7/D8) : « rotation » `EX-NFR-8` vs G4 2D ; plafond
  nuage 5 000 (`EX-DATA-100`) vs 20 000 (annexe B, code mort) ; `EX-DATA-101` vs `100bis`
  (échantillonnage) ; listes de liaison croisée `EX-SCR-158` vs `184` ; **CRUD en `localStorage`** (D8,
  imposé par `EX-CRUD-19`) vs brief IndexedDB ; `topRestrictiveFilters` leave-one-out (`EX-SCR-26`) non
  câblé ; a11y écrans A/B non testée par axe-core (env node, dépendance interdite) — couverte par tests
  de structure D6/D7 seulement.

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

## 9. Definition of Done de la phase 2.4 — ATTEINTE

- ✅ D1–D9 fusionnés dans `phase-2.4-build`, tous critères vérifiés par exécution.
- ✅ build 0/0, lint vert, 536 tests verts, bundle 68/300 Ko gzip.
- ✅ `npm run dev` sert l'app ; les 2 parcours cibles se déroulent de bout en bout ; repli provider testé.
- ✅ `docs/EXECUTION-LOG.md` à jour (2.4 VALIDÉ).
- ✅ Commité et poussé sur le dépôt perso `benitoGiunta/KYCAR`.
- ⏸️ Arrêt. Prochaine action = phase 2.5, **sur feu vert de l'utilisateur uniquement**.
