# src/providers

Owned by **lots D3 (`SyntheticDataProvider`), D9 (`TweedehandsDataProvider`)**, and a future lot
for `AutoScout24PaidDataProvider`. Every implementation satisfies the `DataProvider` interface
frozen in `docs/plans/DataProvider.ts` (phase 2.3).

`DataProvider.ts` here is a **verbatim copy** of `docs/plans/DataProvider.ts`, integrated by lot D2
(same bytes, unchanged semantics). Import the contract from `../types` (barrel) or directly from
`./DataProvider`; do not duplicate or edit it — sync it from `docs/plans/` if the frozen file ever
changes.

`mock-provider.test.ts` (lot D2) shows a `SERVED` and an `UNAVAILABLE` implementation and the
`servesMode2()` type guard — the template lots D3/D9 build on.
