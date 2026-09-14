# tests/review — sondes de la revue de développement (phase 2.5)

Un dossier par lot : `D1/` … `D9/`, plus `patho/` (rejeu transverse des cas pathologiques 2.2).

Règles :
- Une sonde = un test Vitest qui prouve un critère de succès, une exigence `EX-…`, ou un cas
  pathologique. Le titre du test cite l'identifiant vérifié (`EX-DATA-108`, `ADV-05`, …).
- Une sonde qui échoue est un **constat** : son titre porte l'identifiant du constat
  (`R-D4-03 …`). Elle n'est ni ignorée (`skip`) ni adoucie : la phase 2.6 doit la faire passer.
- Les sondes n'importent que depuis `src/` (chemins relatifs) et ne touchent jamais au réseau.
- Type-check : `tsconfig.review.json`. Lint : couvert par `npm run lint`.
- Exécution : `npm run test:review` (tout) ou
  `npx vitest run --config vitest.review.config.ts tests/review/D4` (un lot).
