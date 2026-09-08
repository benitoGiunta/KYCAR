# CLAUDE.md — KYCAR

Instructions pour tout agent Claude travaillant dans ce dépôt. Voir `docs/HANDOFF.md` pour l'état du
projet et la reprise, et `docs/EXECUTION-LOG.md` (source de vérité de l'avancement).

## Règle de push — TOUJOURS le compte perso

Ce dépôt (`github.com/benitoGiunta/KYCAR`) est sur le **compte GitHub perso** de l'utilisateur. La
config git **globale** de la machine utilise par défaut l'email et le compte **pro** — il faut donc
corriger à chaque fois. Deux comptes `gh` sont en keyring : `benitoGiunta` (perso) et
`benitoGiunta86` (pro).

**Identité des commits** (déjà réglée en local sur ce dépôt, à re-vérifier avant de commiter) :

```bash
git config user.email   # doit afficher benitognt@gmail.com (perso), PAS benito.giunta@bstorm.be
# si besoin :
git config user.email "benitognt@gmail.com"
git config user.name  "Benito Giunta"
```

**Procédure de push** — basculer `gh` en perso, pousser, puis **remettre `gh` sur pro** :

```bash
gh auth switch --user benitoGiunta       # 1. compte perso actif
git push origin <branche>                 # 2. push (credentials perso)
gh auth switch --user benitoGiunta86     # 3. remettre le compte pro par défaut
```

En session distante (Claude Code on the web), les credentials de session sont déjà ceux du dépôt perso :
`git push -u origin <branche>` suffit, `gh` n'y est pas disponible.

Ne jamais pousser ce dépôt avec le compte pro. Ne jamais saisir de credentials à la main : `gh` les
détient déjà pour les deux comptes.

## Conventions de commit

- Messages en anglais, sans backtick (le shell Windows/Bash les interprète — corruption déjà subie).
- Terminer chaque message par le trailer d'attribution fourni par la session courante
  (`Co-Authored-By: …` et, s'il est fourni, `Claude-Session: …`).
- Commiter de façon incrémentale.

## Vérifier avant de livrer

```bash
npm run build   # tsc app + worker + vite build ; doit être 0 erreur / 0 warning
npm run lint    # eslint . ; vert
npm test        # vitest run ; suite par défaut (les bancs *.perf.test.ts sont hors suite)
npm run size    # bundle initial < 300 Ko gzip
```

Détails d'environnement, pièges (worktrees, node_modules, timeouts) et contraintes E1–E5 : voir
`docs/HANDOFF.md` §7–8.

## Organisation en agents (décidée le 2026-09-08, s'applique à partir de la phase 2.5)

Principe : **une session coordinatrice** (Fable 5.1, effort high) planifie, lance, fusionne et
valide ; **des sous-agents** exécutent, chacun avec un modèle et un effort choisis pour la tâche.
Le modèle et l'effort de chaque rôle sont **déclarés dans `.claude/agents/<rôle>.md`** (frontmatter
`model:` / `effort:`), qui fait foi ; la table ci-dessous en est le résumé.

Mécanique de lancement (constatée le 2026-09-08) : les fiches de `.claude/agents/` ne sont chargées
qu'au **démarrage** d'une session. Dans une session déjà ouverte, le coordinateur lance le type
générique avec le paramètre `model` explicite et impose l'effort dans la mission (« lis ta fiche
`.claude/agents/<rôle>.md`, effort <niveau> ») ; la fiche reste la référence du rôle. Règles de choix :

| Nature de la tâche | Modèle | Effort |
|---|---|---|
| Outillage, vérifications mécaniques, édition de prose bornée | Sonnet | medium–high |
| Densité de spécification, preuves statistiques, arbitrage de doublons | Opus | high |
| Algorithmique lourde, lots transverses porteurs d'un budget NFR ou d'un parcours cible, coordination | Fable | high (max pour la vérification finale 2.7) |

Contrainte E2 (« aucun modèle Fable ») **levée par le commanditaire le 2026-09-08**.

### Phase 2.5 — revue de développement (PLAN-2 §2.5)

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
  coordinateur : contrôle S1–S4, `npm test` + `npm run test:review`, commit
```

Pourquoi ce découpage : les revues sont indépendantes (R5, un lot chacune) donc parallèles ; elles
n'écrivent que dans leur dossier de sondes et leur rapport, donc pas de conflit dans un même arbre ;
la consolidation dépend de toutes, donc séquentielle. Sur 4 cœurs, chaque revue n'exécute que les
tests de son lot (`--no-file-parallelism`), jamais la suite complète.

### Phase 2.6 — remédiation (PLAN-2 §2.6)

```
fix-lead = coordinateur (Fable/high) : ordonne DEV-REVIEW par sévérité, forme des clusters de
constats par répertoires DISJOINTS de src/, attribue, arbitre les conflits.
        │
        v  vague F (PARALLÈLE, un worktree git isolé par agent, node_modules symlinké)
  fix-engine Opus/high (src/engine, src/worker, src/types)
  fix-app Opus/high (src/app*, src/main.tsx, src/persistence, src/orchestration)
  fix-providers Sonnet/high (src/providers) · fix-state Sonnet/high (src/state, src/components/filters)
  fix-screens Sonnet/high (src/screens) · fix-docs Sonnet/high (docs/, aucun code)
        │
        v  (SÉQUENTIEL) coordinateur fusionne --no-ff un worktree à la fois ; après CHAQUE fusion :
           build + lint + `npm test` + `npm run test:review` ; conflit → arbitrage coordinateur
        │
        v  (SÉQUENTIEL) fix-verify Opus/high : rejoue chaque preuve, écrit reports/REMEDIATION.md
        │
        v  coordinateur : gate G5 (zéro BLOQUANT/MAJEUR ouvert), promotion des sondes dans la suite
           par défaut, journal, commit, push
```

Un cluster n'est lancé en parallèle que si ses répertoires sont disjoints de ceux des autres ; un
constat qui traverse deux clusters est attribué à un seul agent (celui du répertoire où la
correction est la plus profonde) et l'autre agent est prévenu dans sa mission.

### Phase 2.7 — vérification finale (PLAN-2 §2.7)

Un seul agent `final-check`, **Fable/max**, indépendant des phases précédentes, après feu vert.

### Leçons à respecter par tout agent

- Sous-agents : commits incrémentaux dans leur worktree (seul le commité survit à un reset de
  session) ; jamais `npm ci` dans un worktree (symlinker `node_modules` de la racine).
- Jamais la suite complète en parallèle sur le même arbre : le coordinateur la lance, seul.
- Un agent qui meurt laisse son WIP sur disque : le coordinateur le récupère, le teste, le finit.
