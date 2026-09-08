# tests/e2e — recette navigateur (phase 2.9)

Playwright sur le **build de production** (`vite preview`, port 4180), Chromium préinstallé
(`playwright.config.ts` détecte `/opt/pw-browsers/chromium-*`). Trois projets : `desktop` 1280,
`tablet` 768, `mobile` 360 (`EX-NFR-18`/`19`).

- `npm run test:e2e` — toute la recette ; `npx playwright test tests/e2e/<fichier> --project=desktop`.
- Chaque test cite l'exigence qu'il exerce (`EX-…`) ou le parcours cible (P1 / P2).
- Accessibilité : `@axe-core/playwright`, WCAG 2.1 A/AA (`EX-NFR-16`), zéro violation attendue.
- Les captures et traces d'échec vont dans `test-results/` (ignoré) ; le JSON de résultats dans
  `reports/e2e/results.json` (versionné à la clôture de 2.9).
