# src/components/filters

Owned by **lot D5 (finition)**. The Preact rendering of the filter band and the screen G
brand/model selector, on top of the state owned by `src/state/` (registry, codec, router,
interaction controller). This folder never duplicates a rule already decided there — it only
renders it.

Nothing here is wired into `src/app.tsx`: every file is a plain named export, mounted by whichever
lot does the final integration (D8, `docs/plans/ARCHITECTURE.md` §7.1). `FilterBand` is the single
entry point a caller needs.

## Layout

| File | Owns |
|---|---|
| `types.ts` | Shared prop contracts (`FilterControlProps`, `OnFilterChange`, `FacetCounts`) |
| `labels.ts` | fr-BE label resolution + active-filter tokens (`EX-SCR-75`, `EX-NFR-30`) |
| `band-model.ts` | Pure view model: primary control grouping (`EX-SCR-59`), secondary group ordering/active counts (`EX-SCR-91`/`92`/`93`), disablement (`EX-SCR-88` a/b) |
| `keyboard-nav.ts` | Pure tab-order computation (`EX-NFR-14`), roving-tabindex arrow logic, screen G's 6-stop focus trap |
| `filter-search.ts` | Pure `EX-SCR-79` filter search (label/param/id, three indexes) |
| `screen-g-model.ts` | Pure search/sort over D2's `ReferenceData` for screen G |
| `FilterFieldRow.tsx` | Per-filter dispatch: single-`FilterDef` controls vs. the three composite ones (range pair, geo, structured picker) |
| `PrimaryLine.tsx` | Zone (1), always visible: the 9 primary controls + `kwd` |
| `FilterSearch.tsx` | Zone (2): `Rechercher un filtre` |
| `SecondaryGroups.tsx` | Zone (3): the 13-group accordion |
| `ActiveFilterTokens.tsx` | Zone (4): active filter tokens, `Tout effacer` |
| `ScreenG.tsx` | The brand/model modal (`EX-SCR-215`/`216`) |
| `controls/*.tsx` | 11 generic per-`ControlKind` renderers, data-driven off `filter-registry.ts` — one component per control kind, not per filter |
| `FilterBand.tsx` | **Public mount point.** Composes the four zones, owns selection state, wires `InteractionController`, enforces the `EX-NAV-11` URL budget, mounts `ScreenG` on demand |

## Public exports for D6/D7/D8

- `FilterBand` (`FilterBand.tsx`) — the band itself. Props: `mode`, `initialSelection`,
  `originAndPath`, optional `uiState`/`resultCount`/`referenceData`, and the callbacks
  `onHistoryReplace`/`onHistoryPush`/`onRecomputeLocal`/`onReload`/`onSelectionApplied`/
  `onUrlBudgetExceeded` that connect it to the real browser history and aggregation engine (both
  out of this lot's scope).
- `ScreenG` (`ScreenG.tsx`) — mountable standalone too, if a caller wants to open it from
  somewhere other than the `mmmv` primary control (e.g. screen B's header per `EX-SCR-103`).
- Every `controls/*.tsx` component, if a caller needs to render a single filter outside the band.

## Debts signaled, not silently fixed

- **No DOM test environment.** This worktree has neither `jsdom`/`happy-dom` nor
  `@testing-library/*`, and `package.json`/`vite.config.ts`'s `test.include` are out of this lot's
  periphery to change for a dependency addition. Every `.tsx` component is therefore a thin,
  reviewed-but-not-executed wiring layer over the pure logic in `band-model.ts`/`keyboard-nav.ts`/
  `labels.ts`/`filter-search.ts`/`screen-g-model.ts`, which carry the real test coverage (114 tests)
  and are called by the components verbatim, so the two cannot diverge silently.
- **No axe-core run.** Same root cause. `keyboard-nav.test.ts` is the documented fallback.
- `PanelSearchMulti` (`eq`, 136 values) and `ScreenG`'s two panels (up to 295/4955 rows) are not
  virtualized — `EX-SCR-100`/`216` ask for it at full scale; this lot renders the full list.
- `EX-SCR-73`'s dependent-filter removal notification (`3 filtres de leasing retirés`, with
  `Annuler`) is not implemented — removing a parent silently drops its children's stale values
  without the 5s toast.
- `EX-SCR-95`'s two KYCAR-specific price sanitation toggles are not rendered — they are engine
  settings (D4), not filters of this registry.
- `screen-g-model.ts` falls back to `Make.announcedCount`/`Model.announcedCount` (last known
  source volumetry) when the caller supplies no live per-facet counts — a true "effectif dans le
  périmètre filtré courant" (`EX-SCR-216`) needs the aggregation engine re-run at modal-open time.
- `filter-search.ts` does not implement the Levenshtein ≤ 3 near-match suggestion of `EX-SCR-80`
  on zero results.
- `mmmv` serialization in `screen-g-model.ts` only produces `makeId|modelId` — the
  `modelLineId`/`version` blocks of `EX-SCR-72`'s full format are not produced by this simplified
  selector.
