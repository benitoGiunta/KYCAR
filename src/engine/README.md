# src/engine

Owned by **lot D4**. Main-thread-side glue for the aggregation engine: typed request builders
that call `src/worker/client.ts`, the LRU(32) selection cache keyed by
`(localDatasetKey, refineHash)` (`EX-DATA-109`, `EX-SRCH-9quinquies`), and anything that is
"aggregation logic but doesn't itself run inside the worker". The columnar scan, bucketing,
quantiles and outlier detection that DO run inside the worker are new cases in
`src/worker/aggregation.worker.ts`'s message switch, not a parallel engine - see the comments in
that file and in `src/worker/messages.ts`.

Empty in lot D1 (scaffolding only).
