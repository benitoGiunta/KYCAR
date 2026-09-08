# CLAUDE.md — KYCAR

Instructions pour tout agent Claude travaillant dans ce dépôt. État du projet et reprise :
`docs/HANDOFF.md`. Source de vérité de l'avancement : `docs/EXECUTION-LOG.md`.

Quatre règles structurent ce fichier : **(1) push git**, **(2) choix du modèle**, **(3) choix de
l'intensité d'effort**, **(4) structure coordinateur / sous-agents**. Puis les conventions locales.

---

## 1. Push git — TOUJOURS le compte perso, TOUJOURS poussé

### 1.1 Identité

Ce dépôt (`github.com/benitoGiunta/KYCAR`) est sur le **compte GitHub perso** de l'utilisateur. La
config git **globale** de sa machine utilise par défaut l'email et le compte **pro** — corriger à
chaque fois. Deux comptes `gh` sont en keyring : `benitoGiunta` (perso) et `benitoGiunta86` (pro).

```bash
git config user.email   # doit afficher benitognt@gmail.com (perso), PAS benito.giunta@bstorm.be
# si besoin :
git config user.email "benitognt@gmail.com"
git config user.name  "Benito Giunta"
```

### 1.2 Procédure selon l'environnement

**Machine locale de l'utilisateur** — basculer `gh` en perso, pousser, remettre `gh` sur pro :

```bash
gh auth switch --user benitoGiunta       # 1. compte perso actif
git push -u origin <branche>              # 2. push (credentials perso)
gh auth switch --user benitoGiunta86     # 3. remettre le compte pro par défaut
```

**Session distante (Claude Code on the web)** — les credentials de session sont déjà ceux du dépôt
perso, `gh` n'est pas disponible : `git push -u origin <branche>` suffit. Sur échec réseau, réessayer
jusqu'à 4 fois avec attente croissante (2 s, 4 s, 8 s, 16 s).

Ne jamais pousser ce dépôt avec le compte pro. Ne jamais saisir de credentials à la main.

### 1.3 Branche et cadence

- On développe sur la branche désignée par la session (en 2.5/2.6 : `claude/kycar-project-ffcplk`,
  créée depuis `phase-2.4-build`). Jamais de push sur une autre branche sans accord explicite.
- **Chaque livrable d'agent est commité et poussé dès réception** (un commit par lot revu ou corrigé,
  message qui résume les constats/corrections). Entre deux livrables, un commit « WIP … snapshot » des
  fichiers en cours est autorisé et poussé : seul le commité survit à un reset de session.
- L'arbre doit être propre (`git status` vide) à chaque fin de tour du coordinateur : un hook de
  fin de tour le vérifie et refuse un arbre sale.
- Les sous-agents en worktree commitent dans leur worktree ; le coordinateur fusionne (`--no-ff`)
  et pousse. Les sous-agents qui travaillent dans l'arbre principal ne commitent pas : le
  coordinateur commite pour eux, lot par lot.
- Pas de PR sans demande explicite.

### 1.4 Conventions de commit

- Messages en anglais, sans backtick (le shell Windows/Bash les interprète — corruption déjà subie).
- Terminer chaque message par le trailer d'attribution fourni par la session courante
  (`Co-Authored-By: …` et, s'il est fourni, `Claude-Session: …`). Aucun identifiant de modèle
  ailleurs que dans ce trailer.
- Commits incrémentaux, jamais d'`--amend` ni de force-push sur une branche partagée.

---

## 2. Choix du modèle

Contrainte E2 (« aucun modèle Fable ») **levée par le commanditaire le 2026-09-08** : les trois
modèles sont disponibles. Le choix se fait **par tâche**, jamais par habitude, selon la nature du
travail :

| Nature de la tâche | Modèle | Exemples dans KYCAR |
|---|---|---|
| Outillage, vérifications mécaniques, exécution de protocole bien spécifié, édition de prose bornée, corrections localisées dont la sonde dit exactement quoi faire | **Sonnet** | rev-D1, rev-D6 ; fix-state, fix-screens, fix-docs |
| Densité de spécification à confronter au code, preuves statistiques, aller-retours exhaustifs, arbitrage de doublons et de sévérités, corrections algorithmiques bornées à un module, corrections touchant une interface gelée | **Opus** | rev-D2/D3/D5/D7/D9, rev-patho, rev-consolidate ; fix-foundation, fix-engine, fix-providers (relevé de Sonnet, D-22), fix-app, fix-verify |
| Algorithmique lourde avec budget NFR opposable, lots transverses porteurs d'un parcours cible, coordination et arbitrage global, vérification finale | **Fable** | coordinateur de session ; rev-D4 (moteur), rev-D8 (intégration) ; final-check 2.7 |

Règles de bascule :
- Un rôle Sonnet qui rencontre une contradiction inter-annexes ou un choix d'architecture **signale**
  et s'arrête sur ce point ; le coordinateur relance un Opus ou tranche lui-même.
- Un rôle Opus ne passe en Fable que si la tâche engage un budget chiffré (perf, mémoire, taille) ou
  un parcours cible de bout en bout.
- Le modèle de chaque rôle est **déclaré dans `.claude/agents/<rôle>.md`** (frontmatter `model:`).
  Cette fiche fait foi ; les tables de ce fichier en sont le résumé.

---

## 3. Choix de l'intensité d'effort

L'effort est le budget de raisonnement accordé à un agent. Il est **déclaré dans la fiche de rôle**
(frontmatter `effort:`) et **répété dans la mission** (« effort <niveau> »), parce que les fiches de
`.claude/agents/` ne sont chargées qu'au **démarrage** d'une session : dans une session déjà ouverte,
le coordinateur lance le type générique avec le paramètre `model` explicite et impose l'effort par
la mission.

| Niveau | Quand | Exemples |
|---|---|---|
| **low** | jamais sur ce projet (aucune tâche n'est assez mécanique pour se passer de vérification) | — |
| **medium** | protocole entièrement spécifié, résultat vérifiable par une commande, faible risque de faux positif | rev-D1 (outillage) |
| **high** | il faut lire la spec ET le code, construire des preuves, hiérarchiser des constats, ou corriger sans régresser | tous les autres rev-* et fix-*, le coordinateur |
| **max** | verdict engageant sur l'ensemble du produit, exigence par exigence, sans droit à l'erreur | final-check (2.7), arbitre 2.2, req-lead 2.1 |

Règle : **l'effort suit le coût d'une erreur, pas la taille de la tâche.** Une petite tâche dont
l'erreur fausserait une valeur affichée à l'utilisateur est en `high`.

---

## 4. Structure coordinateur / sous-agents

### 4.1 Principe

**Une session coordinatrice** (Fable, effort high) planifie, lance, fusionne, valide, commite et
pousse. **Des sous-agents** exécutent, chacun avec un rôle, un modèle et un effort déclarés dans
`.claude/agents/<rôle>.md`, un périmètre d'écriture disjoint, et une mission qui se suffit à
elle-même (E3 : aucun sous-agent ne pose de question).

Règles de parallélisme :
- **Parallèle** tout ce qui est indépendant ET écrit dans des emplacements disjoints (une revue par
  lot ; une correction par groupe de répertoires).
- **Séquentiel** tout ce qui dépend d'un résultat amont (consolidation après toutes les revues ;
  fusion des worktrees un par un ; vérification après toutes les fusions).
- Sur 4 cœurs : un sous-agent n'exécute que les tests de son périmètre (`--no-file-parallelism`) ;
  la suite complète est lancée par le coordinateur, seul.
- Un constat qui traverse deux périmètres est attribué à un seul agent (celui du répertoire où la
  correction est la plus profonde) ; l'autre est prévenu dans sa mission.
- Un agent qui meurt laisse son WIP sur disque : le coordinateur le récupère, le teste, le finit
  ou relance un agent « de finition ».

### 4.2 Phase 2.5 — revue de développement (PLAN-2 §2.5)

Protocole : `docs/plans/REVIEW-PROTOCOL.md`. Sondes : `tests/review/D<n>/` (config
`vitest.review.config.ts`, script `npm run test:review`, type-check `tsconfig.review.json`).
Rapports : `reports/review/D<n>.md` → consolidés dans `reports/DEV-REVIEW.md`.

```
vague R (PARALLÈLE, 10 agents, même arbre, src/ en lecture seule, sorties disjointes)
  rev-D1 Sonnet/medium · rev-D2 Opus/high · rev-D3 Opus/high · rev-D4 Fable/high
  rev-D5 Opus/high · rev-D6 Sonnet/high · rev-D7 Opus/high · rev-D8 Fable/high
  rev-D9 Opus/high · rev-patho Opus/high (rejeu transverse ADV/ST)
        │
        v  (SÉQUENTIEL : dépend des 10 rapports)
  rev-consolidate Opus/high → reports/DEV-REVIEW.md
        │
        v
  coordinateur : contrôle S1–S4, npm test + npm run test:review, commit, push
```

### 4.3 Phase 2.6 — remédiation (PLAN-2 §2.6)

Décisions du fix-lead (arbitrages, séquencement, dettes) : `reports/remediation/FIX-LEAD-DECISIONS.md`.

```
fix-lead = coordinateur (Fable/high) : ordonne DEV-REVIEW par sévérité, tranche les tensions,
forme des clusters de constats par répertoires DISJOINTS de src/, attribue, arbitre les conflits.
        │
        v  étape 0 (SÉQUENTIEL, arbre principal) fix-foundation Opus/high :
           interfaces gelées élargies (makeId Int32, ingestFlags Uint32, unsupportedFilterIds),
           exports partagés de src/types dont plusieurs clusters dépendent
        │
        v  vague F1 (PARALLÈLE, un worktree git isolé par agent, node_modules symlinké)
  fix-engine Opus/high (src/engine, src/worker, src/types, tools/, vite.config.ts, data/reference/)
  fix-providers Opus/high (src/providers) · fix-state Sonnet/high (src/state, src/components/filters)
  fix-screens Sonnet/high (src/screens, JAMAIS app.tsx) · fix-docs Sonnet/high (docs/, DEV.md, aucun code)
        │
        v  (SÉQUENTIEL) coordinateur fusionne --no-ff un worktree à la fois, dans l'ordre
           engine → providers → state → screens → docs ; après CHAQUE fusion :
           build + lint + npm test + npm run test:review ; conflit → arbitrage coordinateur
        │
        v  vague F2 (SÉQUENTIEL, arbre principal) fix-app Opus/high
           (src/app*, src/main.tsx, src/persistence, src/orchestration : câblage listé par fix-screens)
        │
        v  (SÉQUENTIEL) fix-verify Opus/high : rejoue chaque preuve, écrit reports/REMEDIATION.md
        │
        v  coordinateur : gate G5 (zéro BLOQUANT/MAJEUR ouvert non consigné en dette motivée),
           promotion des sondes dans la suite par défaut, journal, commit, push
```

Règle de preuve (PLAN-2 §2.6 S2) : une correction est prouvée par **la sonde qui a révélé le
problème**, que l'on fait passer sans la modifier. Une sonde jugée fausse se corrige avec
justification écrite dans le rapport du correcteur, jamais en silence.

### 4.4 Phase 2.7 — vérification finale (PLAN-2 §2.7)

Un seul agent `final-check`, **Fable/max**, indépendant des phases précédentes : `src/` en lecture
seule, écrit `reports/FINAL-VERIFICATION.md`. Il peut lancer l'application (`npm run dev` port 5173
ou `vite preview` port 4173) et le navigateur de recette (Playwright, §4.6) pour exercer les parcours.

### 4.5 Phase 2.8 — remédiation post-vérification (PLAN-2 §2.8, extension du 2026-09-08)

Même mécanique que 2.6 : coordinateur = fix-lead, clusters `fix-*` par répertoires disjoints en
worktrees, sonde d'échec d'abord, `fix-verify` indépendant → `reports/REMEDIATION-2.8.md`. Entrées :
matrice 2.7 (`PARTIELLE`/`NON COUVERTE`), constats de la recette 2.9a, dettes 2.6 levables en interne.
Une sonde `it.fails` dont la dette est levée redevient `it`.

### 4.6 Phase 2.9 — recette navigateur (PLAN-2 §2.9, extension du 2026-09-08)

Playwright + Chromium préinstallé, sur le build de production (`playwright.config.ts`, `tests/e2e/`,
`npm run test:e2e`, port 4180). **2.9a** `e2e-harness` Opus/high en worktree, **en parallèle de 2.7**
(ports distincts : 2.7 sur 5173/4173, 2.9a sur 4180) ; **2.9b** `acceptance` Fable/max après 2.8 →
`reports/ACCEPTANCE.md`. Dépendances de test uniquement (`ARCHITECTURE.md` §8), jamais importées
depuis `src/`. Le navigateur se lance par `executablePath` (détection dans la config) : jamais
`playwright install`.

---

## 5. Vérifier avant de livrer

```bash
npm run build         # tsc app + worker + vite build ; doit être 0 erreur / 0 warning
npm run lint          # eslint . ; vert
npm test              # suite unitaire (615) PUIS sondes de revue promues (798) ; tout doit être vert
npm run test:unit     # suite unitaire seule
npm run test:review   # sondes de revue seules (8 dettes consignées en it.fails annoté, jamais skip)
npm run size          # bundle initial < 300 Ko gzip
npm run test:e2e      # recette navigateur (build de prod + Chromium préinstallé), 3 projets
```

Pièges d'environnement (worktrees, `node_modules`, timeouts) et contraintes E1, E3–E5 : voir
`docs/HANDOFF.md` §7–8. Rappels : jamais `npm ci` dans un worktree (symlinker `node_modules` de la
racine) ; **supprimer ce lien (`rm <worktree>/node_modules`) avant `git worktree remove`**, sinon le
`node_modules` de la racine est détruit (D-50) ; jamais la suite complète en parallèle sur le même arbre.
