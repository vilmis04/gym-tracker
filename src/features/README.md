# Features

One folder per feature (`buddies`, `sessions`, `exercises`, `logging`, `progress`).
Each feature owns:

- `components/` — UI used only by this feature
- `actions.ts` — Server Actions (mutations), validated with zod, returning `Result<T>`
- `queries.ts` — reads (called from Server Components)
- `schemas.ts` — zod schemas shared by client and server

Files are added with the feature epics. See [docs/architecture.md](../../docs/architecture.md#code-structure).
