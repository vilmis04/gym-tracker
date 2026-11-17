# E01 · Project Foundation

**Goal:** A working, deployable Next.js + Supabase skeleton with tooling and CI so every later epic can ship small PRs safely.
**Milestone:** M1 · Walking skeleton
**Depends on:** —

---

### E01-T01 · Bootstrap Next.js app — `S`
Create the Next.js app (App Router, TypeScript strict, `src/` dir), Tailwind CSS, ESLint, Prettier, path aliases (`@/`), and the folder structure from [architecture.md](../architecture.md#code-structure).

**Acceptance criteria**
- [ ] `npm run dev`, `build`, `lint`, `typecheck`, `format:check` work
- [ ] Folder structure matches architecture doc
- [ ] README has local setup instructions

**Depends on:** —

### E01-T02 · Supabase local setup & migrations workflow — `S`
Initialize Supabase CLI (`supabase/`), enable extensions (`pg_trgm`, `unaccent`), add scripts for `db:start`, `db:reset`, `db:migrate`, `db:types` (generate `src/types/database.ts`).

**Acceptance criteria**
- [ ] `supabase start` runs locally and migrations apply on `db:reset`
- [ ] Generated types are committed and used by the Supabase client
- [ ] `.env.example` lists all variables (see architecture doc)

**Depends on:** E01-T01

### E01-T03 · Supabase client helpers — `S`
Server and browser Supabase client factories that accept the Clerk session token (`accessToken` callback). Typed with generated types.

**Acceptance criteria**
- [ ] `createServerClient()` usable in RSC and Server Actions
- [ ] `createBrowserClient()` usable in client components
- [ ] Service-role client lives in a server-only module (`import 'server-only'`)

**Depends on:** E01-T02 (token wiring finalized in E04-T02)

### E01-T04 · Testing setup — `M`
Vitest + Testing Library for unit/component tests; Playwright for e2e with an auth helper (Clerk testing tokens); a DB test harness for RLS tests against local Supabase.

**Acceptance criteria**
- [ ] `npm test` runs unit tests; `npm run e2e` runs Playwright
- [ ] Example unit, e2e and RLS test pass
- [ ] Test users can be created and signed in without the Google UI

**Depends on:** E01-T02

### E01-T05 · CI pipeline — `S`
GitHub Actions: install, lint, typecheck, unit tests, migrations apply on clean DB, RLS tests, build, e2e (on PR to `main`).

**Acceptance criteria**
- [ ] Pipeline runs on every PR and blocks merge on failure
- [ ] Caching keeps the pipeline under ~8 min

**Depends on:** E01-T04

### E01-T06 · Environments & deployment — `S`
Vercel project with preview deployments per PR; Supabase staging and production projects; migrations deployed via CI on merge to `main`.

**Acceptance criteria**
- [ ] Each PR gets a preview URL wired to staging
- [ ] Merge to `main` deploys app and applies migrations to production
- [ ] Secrets stored in Vercel/GitHub, none in repo

**Depends on:** E01-T05

### E01-T07 · Error tracking & app shell result type — `S`
Add error tracking (e.g. Sentry) and a shared `Result<T, ErrorCode>` helper + `ErrorCode` enum used by all Server Actions.

**Acceptance criteria**
- [ ] Unhandled server and client errors reported with release tag
- [ ] `Result` type and helper documented with an example

**Depends on:** E01-T01
