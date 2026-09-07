# src/worker

Owned by **lot D4** (the aggregation engine itself). Lot D1 only ships the message envelope
(`messages.ts`), a PING/PONG worker (`aggregation.worker.ts`), and the main-thread client
(`client.ts`) that proves the channel end to end. D4 adds new `WorkerRequest`/`WorkerResponse`
kinds and new `case` branches in the worker's message switch - it does not create a second
worker file or a second channel.
