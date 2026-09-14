# tests/e2e — recette navigateur (phase 2.9)

Playwright sur le **build de production** (`vite preview`, port 4180 — `KYCAR_E2E_PORT` pour en
changer), Chromium **préinstallé** (`playwright.config.ts` détecte `/opt/pw-browsers/chromium-*`,
`KYCAR_CHROMIUM` prioritaire ; jamais de `playwright install`). Trois projets alignés sur les points
de rupture normatifs : `desktop` 1280, `tablet` 768, `mobile` 360 (`EX-NFR-18`/`19`).

```bash
npm run test:e2e                                            # les trois projets (~15 min)
npx playwright test tests/e2e/<fichier> --project=desktop    # un fichier, un projet
npm run test:e2e:report                                     # rapport HTML du dernier run
```

## Les neuf fichiers

| Fichier | Ce qu'il exerce |
|---|---|
| `parcours-p1.spec.ts` | Parcours cible 1 (mode 1) : filtres posés par le bandeau réel, URL canonique, effectifs, tri, export CSV, retour arrière |
| `parcours-p2.spec.ts` | Parcours cible 2 (mode 2) : en-tête statistique, G1–G3 et leurs tables, nuage G4, brossage, écran D |
| `a11y.spec.ts` | `@axe-core/playwright`, WCAG 2.1 A/AA sur les huit surfaces (`EX-NFR-16`), contraste au rendu réel (`EX-NFR-13`) |
| `clavier.spec.ts` | `EX-NFR-14`/`12` : lien d'évitement, ordre de tabulation, écran G au clavier, `document.title` par route |
| `responsive.spec.ts` | `EX-NFR-18`/`19` : régimes, dégradation du nuage, repli des zones-modèles, débordements |
| `impression.spec.ts` | `EX-NFR-31` : `emulateMedia({ media: 'print' })`, les quatre règles closes de la feuille d'impression |
| `perf.spec.ts` | `EX-NFR-9` (CDP 4G, cache vidé), `EX-NFR-7`, `EX-NFR-8` (`rAF`, fenêtres glissantes), `EX-NFR-6` |
| `persistance.spec.ts` | `EX-CRUD-*` : entrées + index, plafonds, blob `.corrupt`, concurrence inter-onglets (`EX-CRUD-19`) |
| `partage-url.spec.ts` | `EX-NAV-18`..`22`, `EX-SCR-140` : reconstitution en contexte neuf, plafond d'URL, canonisation, erreurs de route |

`_helpers.ts` porte les constantes de parcours, les attentes de premier affichage, les lectures de
valeurs, le brossage du nuage, les aides de focus et les fabriques de `localStorage`.

## Conventions

- Chaque test cite l'exigence qu'il exerce (`EX-…`) ou le parcours cible (P1 / P2).
- On interroge l'application par son **rôle**, son **libellé** ou son **texte normatif** ; une classe
  CSS n'est utilisée que lorsqu'elle EST le contrat (`print.css`, `data-graph`, `#kycar-main`).
- Un écart d'exigence n'est **jamais** corrigé ici (`src/` en lecture seule en 2.9a) : il devient un
  `test.fail()` annoté `CONSTAT E2E-<nn>` — **jamais** un `test.skip` — et une ligne de
  `reports/remediation/e2e-harness.md`.
- `test.skip` est réservé aux **inadéquations de plate-forme** (par exemple le brossage du nuage sous
  768 px, désactivé par contrat selon `EX-NFR-19`), et son motif cite l'exigence.
- Les mesures (perf, axe) sont publiées par l'aide `mesure()` : elles apparaissent dans la sortie du
  test et dans `reports/e2e/results.json`.

Les captures et traces d'échec vont dans `test-results/` (ignoré) ; le JSON de résultats dans
`reports/e2e/results.json`.
