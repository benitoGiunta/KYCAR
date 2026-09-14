# src/screens

Owned by **lots D6 (screen A + selector G), D7 (screens B/D, chart G4), D8 (shell, routing,
screens C/E/F, `/mentions`)**.

## Deferred heavy chunk (`EX-NFR-11`)

D7's chart `G4` is a 2D projection in the frozen spec (SVG under a threshold, Canvas 2D above -
`docs/plans/ARCHITECTURE.md` S:1.4/4.2), so nothing here should need a heavy graphics library.
*If* a later lot ever needs one, it must be loaded as a dynamic `import()` from a submodule under
this directory (e.g. `src/screens/scatter-heavy/index.ts`, loaded via
`import('./scatter-heavy')` at the point mode 2 is entered), never a static import - that is what
keeps it out of the 300 KiB initial-bundle gate (`EX-NFR-10`) and inside its own 400 KiB gate
(`EX-NFR-11`), both enforced by `npm run size`. See `vite.config.ts` for how the size script
tells the two budgets apart (manifest static-vs-dynamic reachability).

Empty in lot D1 (scaffolding only).
