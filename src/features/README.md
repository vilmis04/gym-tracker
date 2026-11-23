# Features

One folder per feature (`buddies`, `sessions`, `exercises`, `logging`, `progress`, `settings`, `landing`).
Each feature owns:

- `components/` — UI used only by this feature
- `actions.ts` — Server Actions (mutations), validated with zod, returning `Result<T>`
- `queries.ts` — reads (called from Server Components)
- `schemas.ts` — zod schemas shared by client and server

Files are added with the feature epics. `settings/` (E04-T04) has only `components/` (the settings page's sections); its Server Action, `savePreferences`, is in `src/lib/profiles/` because the avatar menu uses it on every page. See [docs/architecture.md](../../docs/architecture.md#code-structure). `landing/` (E04-T05): `components/` (`BenefitList`, `ContinueWithGoogle`, types in `landing.types.ts`) and `open-graph/` (`renderLandingOpenGraphImage()`, server only, and `landing-open-graph-image-route.ts`: its path and size for the page's metadata).
