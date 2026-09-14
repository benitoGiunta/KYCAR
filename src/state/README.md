# src/state

Owned by **lot D5**. The URL-as-state codec (`EX-NAV-9` canonical ordering, `EX-NAV-10`/`11`
2000-char cap, `EX-NAV-21` correction table), the T/R filter split (`EX-SRCH-9bis`,
`localDatasetKey`/`refineHash`), the debounce/history timers (`EX-NAV-12`/`13`), and the
hand-rolled router (six routes, no third-party router per `docs/plans/ARCHITECTURE.md` S:1.5).

| File | Owns |
|---|---|
| `filter-types.ts` | Shared filter types (`FilterDef`, `FilterClass`, `ControlKind`...) |
| `filter-registry.ts` | The 77-filter registry (T/R/D classes, options, dependencies) |
| `url-codec.ts` | Canonical query serialization/parsing, 2000-char budget (`EX-NAV-5`...`11`) |
| `corrections.ts` | The 5-class URL correction table on load (`EX-NAV-21`/`22`) |
| `tr-split.ts` | T/R selection split into `localDatasetKey`/`refineHash` (bridges to D2's hash codec) |
| `router.ts` | Pure path -> route resolution for the 6 routes (market/modelDistribution/modelListings/compare/savedSearches/notFound), plus `resolveTaxonomyRoute` for `EX-NAV-19`/`20` |
| `debounce-policy.ts` | The `EX-SRCH-1`...`8` debounce delay table, keyed by filter id + gesture |
| `interaction.ts` | `InteractionController`: per-filter debounce, `HistoryBurstGrouper` (`EX-NAV-12`/`13`), `RClassBurstCoordinator` (`EX-SRCH-1bis`) |

The Preact UI that consumes this state (the filter band, the 77 filter controls, screen G) lives
in `src/components/filters/` — this folder stays free of any rendering code, consistent with the
D2/D5 split between state and its consumers.
