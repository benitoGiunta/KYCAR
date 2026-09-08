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

Ne jamais pousser ce dépôt avec le compte pro. Ne jamais saisir de credentials à la main : `gh` les
détient déjà pour les deux comptes.

## Conventions de commit

- Messages en anglais, sans backtick (le shell Windows/Bash les interprète — corruption déjà subie).
- Terminer chaque message par : `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
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
