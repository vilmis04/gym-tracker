# E01 · Project Foundation

**Goal:** A working, deployable Next.js + Supabase skeleton with tooling and CI so every later epic can ship small PRs safely.
**Milestone:** M1 · Walking skeleton
**Depends on:** —

---

### E01-T01 · Bootstrap Next.js app — `S`
**Why:** Every other task needs a consistent codebase with the same structure, lint rules and scripts, so reviews focus on behavior rather than style.

**Scope**
- Create the app with `create-next-app`: App Router, TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`), `src/` directory, Tailwind CSS.
- ESLint (Next.js + TypeScript rules, `import/order`, no unused vars) and Prettier (with the Tailwind class-sorting plugin).
- Path alias `@/*` → `src/*`.
- Create the empty folder structure from [architecture.md](../architecture.md#code-structure) (`app/[locale]`, `components/ui`, `components/common`, `features/*`, `lib/*`, `types/`), each with a `.gitkeep` or short README.
- npm scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `format`, `format:check`.
- `.nvmrc` with the Node LTS version; `engines` field in `package.json`.
- Root README: prerequisites, install, run, and a link to `docs/`.

**Out of scope:** Auth, database, i18n and theming (separate tasks).

**Acceptance criteria**
- [ ] A fresh clone runs with `npm ci && npm run dev` and shows a placeholder page at `http://localhost:3000`.
- [ ] `npm run build`, `lint`, `typecheck` and `format:check` all pass with zero warnings.
- [ ] Introducing an unused variable or wrong import order makes `lint` fail.
- [ ] Folder structure matches the architecture doc.
- [ ] README setup steps work for a new developer without extra help.

**Depends on:** —

### E01-T02 · Supabase local setup & migrations workflow — `S`
**Why:** The schema must be versioned and reproducible so every developer, CI run and environment has the same database.

**Scope**
- `supabase init`; commit `supabase/config.toml`.
- First migration enables extensions `pg_trgm` and `unaccent` and creates an `immutable` wrapper function `f_unaccent(text)` (needed for generated columns and indexes).
- npm scripts: `db:start`, `db:stop`, `db:reset` (applies migrations + `seed.sql`), `db:new <name>`, `db:types` (writes `src/types/database.ts`).
- Empty `supabase/seed.sql` (filled in later epics).
- `.env.example` with every variable from the architecture doc and a one-line comment each.

**Out of scope:** Any application tables (they come with their feature epics).

**Acceptance criteria**
- [ ] `npm run db:start` starts local Supabase (Docker) and prints the local URL and keys.
- [ ] `npm run db:reset` drops and rebuilds the database from migrations without errors.
- [ ] `npm run db:types` creates `src/types/database.ts`, and running it twice produces no diff.
- [ ] `select f_unaccent('Ąžuolas')` returns `Azuolas`.
- [ ] `.env.example` contains every variable the app reads; no real secrets are committed.

**Depends on:** E01-T01

### E01-T03 · Supabase client helpers — `S`
**Why:** One place to create Supabase clients keeps token handling, typing and the service-role key safe and consistent.

**Scope**
- `lib/supabase/server.ts`: `createServerClient()` for Server Components, Server Actions and Route Handlers.
- `lib/supabase/client.ts`: `createBrowserClient()` for client components (singleton per tab).
- Both typed with `Database` from generated types and accept an `accessToken` callback (wired to Clerk in E04-T02; until then a stub).
- `lib/supabase/admin.ts`: service-role client, guarded with `import 'server-only'`, used only by webhooks/admin jobs.

**Out of scope:** Clerk integration itself (E04-T02).

**Acceptance criteria**
- [ ] A Server Component can query a test table through `createServerClient()` with full type inference (wrong column names fail `typecheck`).
- [ ] Importing `lib/supabase/admin.ts` from a client component fails the build.
- [ ] The service-role key does not appear in the client bundle (checked by grepping `.next/static`).
- [ ] Helpers have JSDoc explaining when to use each one.

**Depends on:** E01-T02 (token wiring finalized in E04-T02)

### E01-T04 · Testing setup — `M`
**Why:** RLS rules, metrics and logging flows are easy to break; automated tests at three levels (unit, database, end-to-end) catch this before release.

**Scope**
- **Unit/component:** Vitest + React Testing Library + `jsdom`; `npm test`, `npm run test:watch`, coverage report.
- **Database/RLS:** a test helper that signs JWTs for fake user ids (`sub`) with the local Supabase JWT secret, so tests can act as user A or B against local Supabase; `npm run test:db`.
- **E2E:** Playwright (Chromium + WebKit mobile viewport), `npm run e2e`; Clerk testing tokens plus a helper `signInAs(user)` that skips the Google UI.
- Test data factories (`createUser`, later `createSession`, …) in `tests/factories`.
- One passing example test of each kind.

**Out of scope:** Real feature tests (written with each feature).

**Acceptance criteria**
- [ ] `npm test`, `npm run test:db` and `npm run e2e` each run and pass on a clean checkout with local Supabase running.
- [ ] The example RLS test proves user B cannot read user A's row in a sample table.
- [ ] The example e2e test signs in a test user without the Google consent screen.
- [ ] Each test run starts from a known database state (reset or transaction rollback); tests don't depend on run order.
- [ ] Testing approach is documented in `docs/` or `tests/README.md`.

**Depends on:** E01-T02

### E01-T05 · CI pipeline — `S`
**Why:** Every PR must prove it builds, passes tests and keeps the schema valid before merge.

**Scope**
- GitHub Actions workflow on `pull_request` and `push` to `main`.
- Jobs: install (npm cache) → lint + typecheck + `format:check` → unit tests → start Supabase CLI, apply migrations on an empty DB, run `test:db` → `build` → Playwright e2e (upload report and traces on failure).
- Check that generated DB types are up to date (`db:types` then `git diff --exit-code`).
- Branch protection on `main`: required checks + 1 review.

**Out of scope:** Deployment (E01-T06).

**Acceptance criteria**
- [ ] A PR with a lint error, type error, failing test or broken migration is blocked from merging.
- [ ] A PR that changes a migration without regenerating types fails with a clear message.
- [ ] Playwright HTML report is downloadable from failed runs.
- [ ] Typical pipeline finishes in under ~8 minutes.

**Depends on:** E01-T04

### E01-T06 · Environments & deployment — `S`
**Why:** Product and testers need a link to every change, and production releases must be repeatable and safe.

**Scope**
- Vercel project linked to the repo: preview deployment per PR, production on `main`.
- Supabase projects: **staging** (used by previews) and **production**.
- GitHub Action on merge to `main`: `supabase db push` to production before the Vercel production build is promoted; staging gets migrations on every PR merge to `main` too.
- Secrets set in Vercel/GitHub per environment.
- Short runbook in `docs/` (how to deploy, roll back, run a migration manually).

**Out of scope:** Custom domain and production Clerk instance (E10-T07).

**Acceptance criteria**
- [ ] Every PR shows a preview URL that works against staging.
- [ ] Merging to `main` applies new migrations to production and deploys the app without manual steps.
- [ ] A failed migration stops the production deploy.
- [ ] No secret values exist in the repository or build logs.
- [ ] The runbook explains how to roll back to the previous deployment.

**Depends on:** E01-T05

### E01-T07 · Error tracking & shared Result type — `S`
**Why:** We need to know when something breaks in production, and every Server Action should return errors in the same shape so the UI can show translated messages.

**Scope**
- Error tracking (e.g. Sentry) for client, server and edge runtimes; release tagged with commit SHA; source maps uploaded; PII scrubbing (no emails in events).
- `lib/result.ts`: `type Result<T> = { ok: true; data: T } | { ok: false; error: ErrorCode; fields?: Record<string, ErrorCode> }` and helpers `ok()`, `fail()`.
- `ErrorCode` enum (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT`, `LOCKED`, `UNKNOWN`) mapped to i18n keys `errors.*`.
- `withAction()` wrapper: validates input with zod, catches errors, reports unexpected ones, returns `Result`.

**Out of scope:** Alerting rules (E10-T07).

**Acceptance criteria**
- [ ] A test error thrown in a Server Component and in a client component both appear in error tracking with the release tag and readable stack trace.
- [ ] Events contain no email addresses or auth tokens.
- [ ] An example Server Action using `withAction()` returns `{ ok: false, error: 'VALIDATION', fields }` for invalid input (unit tested).
- [ ] Every `ErrorCode` has an `errors.*` key (checked once i18n exists).

**Depends on:** E01-T01
