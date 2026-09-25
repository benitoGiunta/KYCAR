# src/components/filters

Owned by **lot D5 (finition)**. The Preact rendering of the filter band and the screen G
brand/model selector, on top of the state owned by `src/state/` (registry, codec, router,
interaction controller). This folder never duplicates a rule already decided there — it only
renders it.

`FilterBand` is the single entry point a caller needs; `src/app.tsx` mounts it inside
`.kycar-filter-bar` (which has no box on screen, so that the bar sticks across the whole page).

## D3-46 (v0.1.1) — what the band looks like now

Sponsor feedback on v0.1.0 (`reports/data/DATA-LEAD-DECISIONS.md` D3-46): endless horizontal scroll
of the primary line, values applied while still being typed, and a third of the page taken by the
sticky header + breadcrumb + band. The band is now:

- **(a) a condensed bar** (`.kycar-band-bar`), the ONLY sticky region of the page (`top: 0`, fixed
  52 px row, 56 px in compact): the three always-visible filters (make/model → screen G, price,
  mileage — `ALWAYS_VISIBLE_FILTER_KEYS`), the `Tous les filtres (n)` button, and on the right the
  applied result count, or `Annuler` / `Appliquer` while the draft is dirty. Never horizontal
  scroll: controls shrink, labels are visually hidden in the intermediate regime. Compact: summary
  `Filtres (n)` + count only.
- **(b) the `Tous les filtres` panel**, an overlay under the bar (no page shift), at most 70 % of the
  viewport, internal vertical scroll, fixed footer (`Fermer`, `Annuler`, `Appliquer`): filter search
  first, then one card per group (`FilterCards.tsx`) — the `Essentiels` card (primaries not in the bar) then each group with at least one
  non-primary filter. Each filter appears once. Compact: the full-screen sheet with one column.
  `Échap`/`Fermer` close without applying and keep the draft; focus returns to the opener.
  Coordinator review: all cards are expanded by default and laid out in CSS columns
  (`column-width: 280px`, `break-inside: avoid`) instead of a grid; `Appliquer` from the panel
  closes it; screen G's own `Appliquer` applies at once, carrying the bar's draft.
- **(c) a draft** (`src/state/draft.ts`): every control writes to the draft; nothing is applied
  until `Appliquer` or `Entrée` in a text/number field — one navigation
  (`InteractionController.applyDraft`), URL budget checked then. Token removal, `Tout effacer`
  and the cascade `Annuler` stay immediate. The projected count of the draft is computed by the
  caller (`onDraftSelectionChange` → `projectedResultCount`), paced by the `EX-SRCH` table.
- **(d) the active-filter tokens**, not sticky, wrapping instead of scrolling.

The applied selection is `initialSelection`, re-read on every render: the shell keys the band on
the PATH only, so panel state, scroll, focus and draft survive an application; pending edits are
rebased when the applied selection changes underneath (`rebaseDraft`).

## Layout

| File | Owns |
|---|---|
| `types.ts` | Shared prop contracts (`FilterControlProps`, `OnFilterChange`, `FacetCounts`) |
| `labels.ts` | fr-BE label resolution + active-filter tokens (`EX-SCR-75`, `EX-NFR-30`) |
| `band-model.ts` | Pure view model: primary control grouping (`EX-SCR-59`), always-visible trio and `Essentiels` card, filter cards with active badges (`EX-SCR-91`/`92`/`93`), draft apply label and live status (D3-46), disablement (`EX-SCR-88` a/b) |
| `keyboard-nav.ts` | Pure tab-order computation (`EX-NFR-14`), roving-tabindex arrow logic, screen G's 6-stop focus trap |
| `filter-search.ts` | Pure `EX-SCR-79` filter search (label/param/id, three indexes) |
| `screen-g-model.ts` | Pure search/sort over D2's `ReferenceData` for screen G |
| `sticky-offset.ts` | Publishes the sticky bar height in `--kycar-band-height` (content `scroll-margin-top`, `app.css`) |
| `FilterFieldRow.tsx` | Per-filter dispatch: single-`FilterDef` controls vs. the three composite ones (range pair, geo, structured picker); `condensed` rendering for the bar |
| `PrimaryLine.tsx` | A list of primary controls: the bar's three (condensed, `data-band-filter`) or the `Essentiels` card's |
| `FilterSearch.tsx` | `Rechercher un filtre`, head of the panel |
| `FilterCards.tsx` | The card grid of the panel / compact sheet |
| `ActiveFilterTokens.tsx` | Active filter tokens, `Tout effacer` |
| `ScreenG.tsx` | The brand/model modal (`EX-SCR-215`/`216`) |
| `controls/*.tsx` | 11 generic per-`ControlKind` renderers, data-driven off `filter-registry.ts`; `RangeControl` keeps the typed text locally and validates on blur/Enter (D3-46) |
| `FilterBand.tsx` | **Public mount point.** Bar, panel/sheet, draft, `InteractionController`, `EX-NAV-11` URL budget at apply time, screen G on demand |

## Public exports for D6/D7/D8

- `FilterBand` (`FilterBand.tsx`) — the band itself. Props: `mode`, `initialSelection` (the APPLIED
  selection, re-read each render), `originAndPath`, optional `uiState`/`resultCount`/
  `referenceData`/`regime`/`projectedResultCount`, and the callbacks `onHistoryReplace`/
  `onHistoryPush`/`onRecomputeLocal`/`onReload`/`onSelectionApplied`/`onDraftSelectionChange`/
  `onUrlBudgetExceeded` that connect it to the real browser history and aggregation engine.
- `ScreenG` (`ScreenG.tsx`) — mountable standalone too (e.g. screen A's own trigger, `EX-SCR-103`).
- Every `controls/*.tsx` component, if a caller needs to render a single filter outside the band.

## Debts signaled, not silently fixed

- **No DOM test environment.** This worktree has neither `jsdom`/`happy-dom` nor
  `@testing-library/*`, and `package.json`/`vite.config.ts`'s `test.include` are out of this lot's
  periphery to change for a dependency addition. Every `.tsx` component is therefore a thin,
  reviewed-but-not-executed wiring layer over the pure logic in `band-model.ts`/`keyboard-nav.ts`/
  `labels.ts`/`filter-search.ts`/`screen-g-model.ts`, which carry the real test coverage (114 tests)
  and are called by the components verbatim, so the two cannot diverge silently.
- **No axe-core run.** Same root cause. `keyboard-nav.test.ts` is the documented fallback.
- `keyboard-nav.ts#computeBandTabOrder` still models the pre-D3-46 order (primaries → search →
  groups → tokens). The real DOM order since D3-46 is bar (3 filters, `Tous les filtres`,
  Annuler/Appliquer) → panel (search, `Essentiels`, group cards, footer) → tokens; it is verified in
  the browser by `tests/e2e/clavier.spec.ts`. The pure model is kept for its unit tests.
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
