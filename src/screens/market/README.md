# src/screens/market

Owned by **lot D6 (écran A — survol du marché + sélecteur G)**, phase 2.4. Consomme le moteur
d'agrégation (D4, `src/providers/DataProvider.ts` / `src/engine/`), la taxonomie (`src/types/`), et
réutilise le `ScreenG` et le `FilterBand` de D5 (`src/components/filters/`) et le routeur/état de D5
(`src/state/`) — **rien de ceci n'est réécrit ici**, seulement importé.

Nothing here is wired into `src/app.tsx` — every file is a plain named export, mounted by whichever
lot does the final integration (D8, `docs/plans/ARCHITECTURE.md` §7.1), same convention as D5.

## Layout

| File | Owns |
|---|---|
| `format.ts` | Pure fr-BE number/text formatting (`EX-SCR-1`..`13`) — thousands separator, price/mileage/year formats and ranges, offer-count singular/plural, percent substitution, grapheme-safe truncation |
| `sort.ts` | `EX-DATA-70`/`70bis`/`70ter`/`71`/`72` label comparison and the four make-sort options (`EX-SCR-119`/`120`), plus the fixed model-within-card order (`EX-SCR-121`) |
| `thresholds.ts` | Single normative threshold table (`EX-SCR-124bis`): no-filter teaser (20), grid virtualization (40), the 60-make warning (`EX-SRCH-26`), model collapse/search-field/virtualization thresholds (`EX-SCR-122`/`124`), and the `EX-SCR-33` five-tier statistic-availability ladder |
| `coverage.ts` | `EX-DATA-61bis` sample-coverage computation, the `EX-SCR-115` per-model coverage disc, and the `EX-SCR-31` snapshot-level `C3` banner |
| `view-model.ts` | Pure composition: `MakeAggregate`/`ModelAggregate` + `Make`/`Model` labels → `MakeCardViewModel`/`ModelZoneViewModel` — `displayRange=[p05,p95]` labeled "fourchette centrale (90 % des offres)" everywhere, `rawRange` secondary tooltip on price only, `EX-SCR-116` zero-listing message, the `modelId=0` reserved-key handling, `EX-SCR-134` median tiers, collapse/search/virtualization flags |
| `csv.ts` | `EX-CRUD-14`/`15` aggregate CSV export — always `rawRange` (min/max), UTF-8 BOM, `;` separator |
| `state.ts` | `deriveScreenAState`: the single function deciding which of the **6 renderable states** the screen is in (`loading` / `provider-error` / `empty` (two reasons) / `partial` / `no-filter` / `ready`) |
| `SummaryBar.tsx` | `EX-SCR-106` synthesis/sort bar |
| `ModelZone.tsx` | `EX-SCR-112`..`118` model band |
| `MakeCard.tsx` | `EX-SCR-107`..`111`, `122`..`129`, `132` make card, including the local (non-virtualized) model search filter |
| `GridFooter.tsx` | `EX-SCR-129` continuous-scroll footer (`<n> marques sur <N>` + load-more button) |
| `MarketScreen.tsx` | **Public mount point.** Switches on the 6 `ScreenAState` kinds, builds sorted `MakeCardViewModel[]` from loaded data + `ReferenceData`, mounts `ScreenG` on demand, triggers the CSV download |
| `market.css` | Layout for the above (breakpoints, band heights, grid columns) — imported as a side effect by `MarketScreen.tsx`; reads `src/styles/tokens.css` custom properties, does not edit that file |

## Public exports for D8

- `MarketScreen` (`MarketScreen.tsx`) — the screen itself. Props: `state: ScreenAState`,
  `referenceData?: ReferenceData`, sort/hide-sparse/expand state and their callbacks, pagination
  (`loadedMakeCount`/`onLoadMoreMakes`), the `no-filter` teaser override
  (`showAllMakesRequested`/`onShowAllMakes`/`onApplyPrimerShortcut`), navigation callbacks
  (`onSelectMake` for `EX-SCR-110`, `onSelectModel` for `EX-SCR-117`), comparison-selection wiring,
  retry callbacks, and the `ScreenG` mount controls (`screenGOpen`/`onOpenScreenG`/`onCancelScreenG`/
  `onApplyScreenG`/`currentMmmv`).
- `deriveScreenAState` (`state.ts`) — the pure state-derivation function; D8 (or a test harness) is
  expected to build a `LoadPhase` from whatever the `DataProvider`/engine calls return and pass the
  result straight into `MarketScreen`'s `state` prop.
- Every other pure module (`format.ts`, `sort.ts`, `thresholds.ts`, `coverage.ts`, `view-model.ts`,
  `csv.ts`) — freely importable if a caller needs one rule (e.g. D7 formatting a price the same way,
  though D7 owns its own screens and is expected to have its own needs).

## Design decision: D6 does not own the `DataProvider`/engine call

Exactly like `FilterBand` (D5) does not call the engine itself and instead exposes
`onRecomputeLocal`/`onReload` for its host to wire to the real recompute, `MarketScreen` does not
instantiate `AggregationEngine` or call `DataProvider.fetchBaselineAggregates`/`fetchAggregates`
itself. It receives an already-resolved `ScreenAState` (built via `deriveScreenAState` from a
`LoadPhase`) as a prop. This keeps D6 a pure rendering layer over data the host (D8) fetched — the
same D5-established boundary between "owns state/network" (`src/state/`, `src/providers/`,
`src/engine/`, none of them touched by this lot) and "renders it" (`src/screens/market/`).

## Debts signaled, not silently fixed

- **No DOM test environment**, same root cause as D5 (`src/components/filters/README.md`): no
  `jsdom`/`happy-dom`, no `@testing-library/*`, and `package.json`/`vite.config.ts` are out of this
  lot's periphery. Every `.tsx` component here is therefore a thin, reviewed-but-not-executed wiring
  layer over the pure logic in `format.ts`/`sort.ts`/`thresholds.ts`/`coverage.ts`/`view-model.ts`/
  `csv.ts`/`state.ts`, which carry the real test coverage (144 tests) and are called by the
  components verbatim.
- **No real grid/model-list virtualization.** `EX-SCR-124`/`127` ask for at-most-N-mounted-nodes
  virtualization past 40 cards / 30 model zones; `MakeCardViewModel.needsVirtualizedModelList` and a
  pagination prop (`loadedMakeCount`/`onLoadMoreMakes`) are exposed so a host can build it, but this
  lot renders the full list/grid, same limitation D5 documented for `ScreenG`'s two panels.
- **No `IntersectionObserver`.** `GridFooter`'s "Charger 12 marques de plus" is an explicit button
  only; `EX-SCR-129`'s auto-trigger at 600 px from the bottom is left to the host.
- **`sort` direction is not URL-persisted.** D5 already froze the `sort` UI-state param's value
  domain to the four field codes (`offres`/`median`/`alpha`/`modeles`, `src/state/corrections.ts`'s
  un-exported `UI_SORT_VALUES`) with no direction variant, and `src/state/` is out of this lot's
  scope to edit. `MarketScreen`'s `sortDirection` prop is therefore host-managed local/session
  state, not serialized to the URL — a real behavioral gap against "aller-retour état ↔ URL" for
  this one sub-feature, flagged here rather than fixed by editing D5's frozen file.
- **Per-make/per-model `sampleCoverage` (`EX-SCR-115`) is structurally always the "indisponible"
  dash today.** Confirmed by reading the code, not assumed: `src/types/reference.ts::buildTaxonomy`
  hardcodes `Make`/`Model.announcedCount` to `null` unconditionally (`taxonomy.json` carries no such
  field), and `src/engine/aggregate.ts` hardcodes `MakeAggregate`/`ModelAggregate.sampleCoverage` to
  `null` by design ("laissé à null, renseigné par le rendu"). `coverage.ts`'s `sampleCoverageOf` is
  correct for the day this data exists; it just never receives a non-null `announcedCount` today.
  The snapshot-level `C3` banner (`EX-SCR-31`) is unaffected and works today.
- **The "3 most restrictive filters" of `ET-VIDE-FILTRES` (`EX-SCR-26`) is a prop, not computed
  here.** `state.ts`'s `RestrictiveFilterHint[]` (leave-one-out `FacetCount` per filter) requires
  `computeFacets`/`selectionHashWithoutFilter`, an engine+filter-registry computation this lot does
  not own; `MarketScreen` renders whatever hints its host supplies.
- **The four `EX-SCR-125` primer shortcuts** (`Budget ≤ 10 000 €`, etc.) fire
  `onApplyPrimerShortcut(shortcutId)` with an opaque id — this lot does not know how to turn a
  shortcut into actual filter values (that is `src/state/filter-registry.ts`'s vocabulary, D5's
  file), so the host is expected to interpret the id.
- **axe-core / a11y audit not run**, same cause as the no-DOM-test-environment item above.
